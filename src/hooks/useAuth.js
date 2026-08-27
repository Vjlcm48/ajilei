import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── SUP-2b · La puerta: fuente única del estado de sesión ────────────────────
// Documento rector: docs/AJILEI_SUP-2b_Puerta_v1.0.md §1.1 y §1.2, con la
// adenda de OK de Fase 1.
//
// Quinto hook de la familia (useUtilitiesMenu, useReacciones, useConsultas,
// useTapetes): un solo estado, consumidores fuera. Se llama UNA vez, en App, y
// lo que necesitan las pantallas baja por props — no hay contexto nuevo. La
// razón es doble: un segundo `useAuth()` abriría una segunda suscripción y una
// segunda consulta de perfil sobre la misma sesión, y un Provider en `.jsx`
// exportando hook + componente estrenaría el error de `react-refresh` que ya
// muerde en SoundContext.jsx.
//
// NO SE LLAMA useSesion. Ese nombre ya está tomado y significa otra cosa
// —acumulados de la partida en curso, DSK-VC2—; dos "sesiones" con el mismo
// nombre en `hooks/` es exactamente cómo se pierde una tarde.
//
// ── Por qué el archivo es `.js` y no `.jsx` ─────────────────────────────────
// No devuelve JSX y exporta constantes junto al hook, que es el molde de
// useUtilitiesMenu (readConsultas/writeConsultas viven ahí al lado del hook).
// Así la regla `react-refresh/only-export-components` ni se aplica.

// ── Los tres estados del §1.1 ───────────────────────────────────────────────
export const SIN_SESION = 'SIN_SESION'
export const SESION_SIN_PERFIL = 'SESION_SIN_PERFIL'
export const COMPLETO = 'COMPLETO'

// ── …y el cuarto, que el documento no nombra y la realidad exige ────────────
// `getSession()` es asíncrono: entre el primer render y su respuesta hay uno o
// más fotogramas en los que TODAVÍA NO SE SABE si hay sesión. Sin este estado,
// un jugador que vuelve con sesión viva vería un parpadeo de la pantalla de
// Entrada antes de entrar — que es justo lo que O1 prohíbe: algo que aparece y
// desaparece a mitad de transición. CARGANDO no pinta una pantalla propia: pinta
// NADA, sobre el mismo fondo, y dura lo que tarda el SDK en leer su almacén.
export const CARGANDO = 'CARGANDO'

// ── Bypass de desarrollo (§1.2) ─────────────────────────────────────────────
// PUERTA DOBLE, copiada literal de src/dev/siembraCEL.js: el gate del build Y la
// presencia de la variable. `import.meta.env.DEV` es `false` bajo `vite build`,
// así que en producción la condición se evalúa a `false` en tiempo de compilación
// y la rama entera se cae del bundle: no hay bypass que activar en el producto.
//
// LO QUE EL BYPASS SALTA ES LA RED, NO EL CLIENTE. `supabase.js` se sigue
// importando arriba, así que su guarda de SUP-1 —fallar ruidoso si faltan las
// variables— sigue mordiendo igual. Es deliberado: un bypass que además apagara
// la guarda convertiría un `.env.local` mal escrito en un misterio de tres
// pantallas después, que es exactamente lo que SUP-1 vino a evitar.
export const AUTH_BYPASS = Boolean(import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS)

// El perfil ficticio del bypass. ID fijo y con forma de UUID para que nada que
// lo reciba tenga que saber que es de mentira; jamás viaja a la red.
const PERFIL_DEV = { id: '00000000-0000-4000-8000-000000000000', username: 'DevLocal' }

// ── La regla del username, y por qué está DUPLICADA aquí a propósito ────────
// La autoridad es la base (SUP-2a: CHECK de formato, índice único sobre
// lower(username) y disparador de vedados). Esta copia NO valida: sólo enciende
// o apaga el botón mientras se teclea, para no gastar un viaje de red en algo
// que el propio campo ya sabe. Cualquier discrepancia la gana la base, que es
// quien responde con código.
export const REGLA_USERNAME = /^[A-Za-z0-9_]{6,15}$/

// ── Traducción de los tres códigos (§1.4) ───────────────────────────────────
// Los tres son CONTRATO con SUP-2a y por eso se comparan por código y nunca por
// texto: el mensaje de Postgres es prosa que puede cambiar, el `sqlstate` no.
//   23514 → el CHECK de formato de la tabla
//   P0001 → el `raise exception` del disparador de vedados
//   23505 → el índice único sobre lower(username)
// Sirve a las DOS operaciones —el insert del Bautizo y el update del cambio de
// nombre— porque las dos pasan por las mismas cerraduras.
export function traducirErrorUsername(error) {
  if (!error) return null
  switch (error.code) {
    case '23514': return 'Debe tener entre 6 y 15 caracteres, solo letras, números y guion bajo'
    case 'P0001': return 'Ese nombre no está permitido — prueba otro'
    case '23505': return 'Ese nombre ya está tomado'
    default:      return 'No se pudo guardar el nombre — inténtalo de nuevo'
  }
}

export function useAuth() {
  // `undefined` = todavía no se sabe · `null` = no hay · objeto = lo hay.
  // Los tres valores son distintos y los tres significan algo: colapsar
  // "no se sabe" con "no hay" es exactamente el parpadeo que CARGANDO evita.
  const [sesion, setSesion] = useState(undefined)

  // ── El perfil se guarda CON SU DUEÑO, y no suelto ─────────────────────────
  // El estado no es "el perfil": es "el perfil DE ESTE uid". La diferencia no es
  // cosmética —es lo que permite saber si lo que hay en memoria corresponde a la
  // sesión actual sin tener que borrarlo a mano cuando la sesión cambia—, y con
  // ella el efecto de abajo deja de escribir estado de forma síncrona en su
  // cuerpo, que es lo que `react-hooks/set-state-in-effect` prohibe con razón:
  // cada una de esas escrituras es un render en cascada.
  //   `.uid` null   = todavía no se ha resuelto ninguno
  //   `.perfil` null = ese uid NO tiene fila en `profiles`
  const [cargaPerfil, setCargaPerfil] = useState({ uid: null, perfil: null })

  // ── Efecto A · la sesión. NO consulta nada ────────────────────────────────
  // El callback de `onAuthStateChange` corre CON EL CERROJO DE AUTH TOMADO: una
  // llamada al SDK desde dentro (un `from(...).select()`, que internamente pide
  // la sesión) se queda esperando un cerrojo que no se soltará hasta que el
  // callback termine — un abrazo mortal clásico del SDK v2. Por eso aquí sólo se
  // guarda la sesión, que es síncrono, y la consulta del perfil vive en su
  // propio efecto: la separación no es orden, es corrección.
  useEffect(() => {
    if (AUTH_BYPASS) return
    let vivo = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, s) => {
      if (vivo) setSesion(s ?? null)
    })
    // `onAuthStateChange` ya emite INITIAL_SESSION al suscribirse, pero
    // `getSession` se llama igual: es el único camino que no depende de que ese
    // evento exista en la versión del SDK que se instale mañana.
    supabase.auth.getSession().then(({ data }) => { if (vivo) setSesion(data.session ?? null) })
    return () => { vivo = false; subscription.unsubscribe() }
  }, [])

  const uid = sesion?.user?.id ?? null

  // ── Efecto B · el perfil, UNA consulta por arranque o cambio de sesión ────
  // Se dispara por `uid` y no por el objeto de sesión: la sesión se reemplaza
  // entera en cada refresco de token —cada hora— y colgar la consulta de ella
  // significaría releer el perfil sin que nada haya cambiado.
  //
  // NO ESCRIBE ESTADO EN SU CUERPO. La única escritura vive dentro del `.then`,
  // que es una respuesta del exterior y no una cascada: es exactamente la forma
  // que la regla de React describe como correcta —suscribirse a un sistema
  // externo y llamar a setState en su callback.
  useEffect(() => {
    if (AUTH_BYPASS) return
    if (!uid) return                          // sin sesión no hay perfil que consultar
    let vivo = true
    supabase
      .from('profiles')
      .select('id, username')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!vivo) return
        // COSTE DECLARADO: si la consulta falla por red, se trata como "no hay
        // perfil" y el jugador aterriza en el Bautizo. Es la única salida que no
        // deja la app colgada en CARGANDO para siempre, y si además ya tenía
        // nombre, la base lo defiende: el insert rebota con 23505 y el mensaje
        // traducido dice "ya está tomado". Feo, pero nunca incorrecto.
        if (error) console.warn('SUP-2b: no se pudo leer el perfil —', error.message)
        setCargaPerfil({ uid, perfil: data ?? null })
      })
    return () => { vivo = false }
  }, [uid])

  // ¿Lo que hay en memoria es de ESTA sesión? Se deriva comparando dueños, que
  // es lo que evita tener que vaciar el estado desde el efecto. Mientras no
  // coincidan, el perfil "todavía no se sabe" y el estado de abajo dice CARGANDO.
  const perfilResuelto = uid != null && cargaPerfil.uid === uid
  const perfil = perfilResuelto ? cargaPerfil.perfil : undefined

  // ── El estado DERIVADO, jamás sincronizado con un efecto ─────────────────
  // Molde de useUtilitiesMenu y useTapetes: `open`/`abierto` se derivan de su
  // gate en cada render. Un `useState` de estado más un efecto que lo persigue
  // es la vía conocida de que la pantalla y la sesión se cuenten cosas distintas
  // durante un fotograma.
  const estado = AUTH_BYPASS
    ? COMPLETO
    : sesion === undefined ? CARGANDO
    : sesion === null ? SIN_SESION
    : perfil === undefined ? CARGANDO
    : perfil === null ? SESION_SIN_PERFIL
    : COMPLETO

  const perfilVivo = AUTH_BYPASS ? PERFIL_DEV : (perfil ?? null)

  // ── Acciones ─────────────────────────────────────────────────────────────
  // Todas devuelven `{ ok, mensaje }` y NINGUNA lanza: quien las llama es un
  // manejador de evento de una pantalla, y una promesa rechazada ahí se pierde
  // en la consola en vez de convertirse en un mensaje para el jugador.

  // `shouldCreateUser: true` es lo que funde entrar y registrarse en un solo
  // gesto (§1.3): si el correo no existe, la cuenta nace con el código.
  const enviarCodigo = useCallback(async (correo) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: correo,
      options: { shouldCreateUser: true },
    })
    if (!error) return { ok: true }
    // 429 es el límite de reenvío del propio Supabase; el resto se dice sin
    // tecnicismos, como pide el §1.3.
    if (error.status === 429) return { ok: false, mensaje: 'Demasiados intentos — espera un momento antes de pedir otro código' }
    return { ok: false, mensaje: 'No se pudo enviar el código — revisa el correo e inténtalo de nuevo' }
  }, [])

  // El estado NO se toca aquí: al verificar, el SDK emite SIGNED_IN y el efecto A
  // lo recoge. Una escritura de estado desde este manejador sería una segunda
  // fuente de verdad compitiendo con la suscripción.
  const verificarCodigo = useCallback(async (correo, codigo) => {
    const { error } = await supabase.auth.verifyOtp({ email: correo, token: codigo, type: 'email' })
    if (error) return { ok: false, mensaje: 'Código incorrecto o vencido — pide uno nuevo' }
    return { ok: true }
  }, [])

  // Sin validación duplicada más allá del formato (§1.4): se intenta y se
  // traduce. La fila se devuelve con `.select().single()` para que el estado
  // pase a COMPLETO con el nombre que la base guardó de verdad —no con el que
  // se tecleó—, que son cosas distintas en cuanto alguien toque la normalización.
  const crearPerfil = useCallback(async (username) => {
    if (AUTH_BYPASS) return { ok: false, mensaje: 'Bypass de desarrollo: no hay cuenta real que bautizar' }
    if (!uid) return { ok: false, mensaje: 'La sesión expiró — vuelve a entrar' }
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: uid, username })
      .select('id, username')
      .single()
    if (error) return { ok: false, mensaje: traducirErrorUsername(error) }
    setCargaPerfil({ uid, perfil: data })
    return { ok: true }
  }, [uid])

  // Mismo camino y misma traducción que el bautizo: el UPDATE pasa por el mismo
  // CHECK, el mismo disparador y el mismo índice único (§1.5).
  const cambiarNombre = useCallback(async (username) => {
    // Con bypass el perfil es de mentira y el `uid` no existe: sin esta rama el
    // mensaje sería "la sesión expiró", que es falso y manda a buscar un problema
    // donde no lo hay. Decírselo por su nombre cuesta una línea.
    if (AUTH_BYPASS) return { ok: false, mensaje: 'Bypass de desarrollo: no hay cuenta real que renombrar' }
    if (!uid) return { ok: false, mensaje: 'La sesión expiró — vuelve a entrar' }
    const { data, error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', uid)
      .select('id, username')
      .single()
    if (error) return { ok: false, mensaje: traducirErrorUsername(error) }
    setCargaPerfil({ uid, perfil: data })
    return { ok: true }
  }, [uid])

  // Con bypass no hay sesión que cerrar y el estado está clavado en COMPLETO, así
  // que llamar al SDK sólo serviría para tocar el almacenamiento sin efecto.
  const cerrarSesion = useCallback(async () => {
    if (AUTH_BYPASS) return
    await supabase.auth.signOut()
  }, [])

  return {
    estado, perfil: perfilVivo, correo: sesion?.user?.email ?? null,
    enviarCodigo, verificarCodigo, crearPerfil, cambiarNombre, cerrarSesion,
  }
}
