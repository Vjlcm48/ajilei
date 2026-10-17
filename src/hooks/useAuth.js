import { useState, useEffect, useCallback } from 'react'
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { TOPE_ESPERA_MS, conTope } from '../lib/red'
import { ESPERAS_RED_MS } from '../lib/controlMesaIA'

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

// ── IOS-1c · …y el quinto: no se sabe porque NO HAY RED ─────────────────────
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.4 y la respuesta 3 al STOP-1. Dos
// esperas que antes no tenían salida, o la tenían mala:
//   · la sesión: con el token caducado y la red caída, `getSession()` devuelve
//     `session: null` con un `AuthRetryableFetchError` (auth-js
//     `GoTrueClient.ts`, `__loadSession`) aunque la sesión siga guardada. Eso
//     NO es «no hay sesión»: es «no se pudo refrescar». Sólo un error no
//     reintentable lleva a SIN_SESION;
//   · el perfil: un fallo de red al leer `profiles` caía al Bautizo, y un
//     jugador con nombre podía acabar eligiéndolo otra vez.
// Pasado el tope de red sin respuesta, o con un fallo de red, el estado es
// SIN_RED: la tarjeta «No pudimos cargar tu cuenta», que se reintenta sola y
// con su botón. Lo que conteste tarde se aplica igual.
export const SIN_RED = 'SIN_RED'

/** IOS-1c · ¿Es un fallo de red (reintentable) y no una respuesta del servidor? */
export function esFalloDeRed(error) {
  if (!error) return false
  if (isAuthRetryableFetchError(error)) return true
  // PostgREST: sin código de Postgres ni estado HTTP es que no llegó
  // (`FetchError`, el `AbortError` del tope); un 5xx tampoco es una respuesta.
  const estado = Number(error.status ?? 0)
  return (!error.code && estado === 0) || estado >= 500
}

/** IOS-1c · la espera antes del reintento `n` (1, 2, 4, 8 y luego 15 s, la escalera de la mesa). */
export function esperaDeReintento(n) {
  return ESPERAS_RED_MS[Math.max(0, Math.min(n - 1, ESPERAS_RED_MS.length - 1))]
}

export const MENSAJE_RED = 'No contesta el servidor — revisa tu conexión e inténtalo de nuevo'
const TOPE = Symbol('tope')

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
  // IOS-1c · la sesión no se pudo saber por la red (SIN_RED mientras `sesion`
  // siga `undefined`), y cuántas veces se ha vuelto a preguntar.
  const [sinRed, setSinRed] = useState(false)
  const [intentoSesion, setIntentoSesion] = useState(0)

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
  // IOS-1c · los fallos de red al leerlo, también con su dueño, y el intento.
  const [falloPerfil, setFalloPerfil] = useState({ uid: null, n: 0 })
  const [intentoPerfil, setIntentoPerfil] = useState(0)

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, s) => {
      if (!vivo) return
      // IOS-1c · el INITIAL_SESSION nulo llega también cuando el refresco falló
      // por la red: quien decide entre «no hay» y «no se pudo» es `getSession`,
      // que trae el error. Una sesión que llega (el refresco automático del SDK
      // al volver la red) se toma siempre.
      if (evento === 'INITIAL_SESSION' && !s) return
      setSesion(s ?? null)
    })
    return () => { vivo = false; subscription.unsubscribe() }
  }, [])

  // `onAuthStateChange` ya emite INITIAL_SESSION al suscribirse, pero
  // `getSession` se llama igual: es el único camino que no depende de que ese
  // evento exista en la versión del SDK que se instale mañana.
  // IOS-1c · y con tope: si no contesta en `TOPE_ESPERA_MS`, SIN_RED (lo que
  // conteste después se aplica igual); un fallo de red se vuelve a preguntar
  // con la escalera de la mesa.
  useEffect(() => {
    if (AUTH_BYPASS) return
    let vivo = true
    let reintento = null
    const tope = setTimeout(() => { if (vivo) setSinRed(true) }, TOPE_ESPERA_MS)
    supabase.auth.getSession().then(({ data, error }) => {
      clearTimeout(tope)
      if (!vivo) return
      if (data?.session) { setSinRed(false); setSesion(data.session); return }
      if (error && esFalloDeRed(error)) {
        setSinRed(true)
        reintento = setTimeout(() => { if (vivo) setIntentoSesion((n) => n + 1) }, esperaDeReintento(intentoSesion + 1))
        return
      }
      setSinRed(false)
      setSesion((previa) => (previa === undefined ? null : previa))
    })
    return () => { vivo = false; clearTimeout(tope); clearTimeout(reintento) }
  }, [intentoSesion])

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
  //
  // IOS-1c · «NO EXISTE» Y «NO SE PUDO» SON COSAS DISTINTAS. `.maybeSingle()`
  // sin fila contesta `{ data: null, error: null }`: no hay perfil, Bautizo.
  // Con `error` (el tope, la red, un 5xx) el perfil NO se sabe: SIN_RED, y se
  // vuelve a leer con la escalera. Antes los dos caían al Bautizo (el «coste
  // declarado» de SUP-2b), y con el tope de red eso habría mandado al Bautizo a
  // jugadores con nombre por una red lenta. Pasado el tope sin respuesta,
  // también SIN_RED; si contesta tarde, se aplica.
  useEffect(() => {
    if (AUTH_BYPASS) return
    if (!uid) return                          // sin sesión no hay perfil que consultar
    let vivo = true
    let reintento = null
    const tope = setTimeout(() => {
      if (vivo) setFalloPerfil((f) => (f.uid === uid ? f : { uid, n: 0 }))
    }, TOPE_ESPERA_MS)
    supabase
      .from('profiles')
      .select('id, username')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        clearTimeout(tope)
        if (!vivo) return
        if (error) {
          console.warn('SUP-2b: no se pudo leer el perfil —', error.message)
          setFalloPerfil((f) => ({ uid, n: f.uid === uid ? f.n + 1 : 1 }))
          reintento = setTimeout(() => { if (vivo) setIntentoPerfil((i) => i + 1) }, esperaDeReintento(intentoPerfil + 1))
          return
        }
        setFalloPerfil({ uid: null, n: 0 })
        setCargaPerfil({ uid, perfil: data ?? null })
      })
    return () => { vivo = false; clearTimeout(tope); clearTimeout(reintento) }
  }, [uid, intentoPerfil])

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
  const perfilSinRed = uid != null && falloPerfil.uid === uid
  const estado = AUTH_BYPASS
    ? COMPLETO
    : sesion === undefined ? (sinRed ? SIN_RED : CARGANDO)
    : sesion === null ? SIN_SESION
    : perfil === undefined ? (perfilSinRed ? SIN_RED : CARGANDO)
    : perfil === null ? SESION_SIN_PERFIL
    : COMPLETO

  // IOS-1c · el «Reintentar» de la tarjeta SIN_RED: vuelve a preguntar ya lo
  // que no se pudo saber (la sesión o el perfil).
  //
  // IOS-1f (T6) · RECARGA LA PÁGINA. Tras un refresco del token fallido, el SDK
  // (auth-js 2.112.4) guarda el fallo 60 s por token en `lastRefreshFailure`,
  // un campo de la instancia de GoTrueClient: vive SOLO EN MEMORIA, nunca en el
  // almacén. Volver a preguntar sin recargar devolvía ese fallo guardado durante
  // un minuto aunque la red ya hubiera vuelto. Recargar crea un cliente nuevo,
  // sin la caché, con la sesión intacta en el almacén. Los reintentos SOLOS de
  // arriba (la escalera de `esperaDeReintento`) no cambian.
  const reintentar = useCallback(() => {
    window.location.reload()
  }, [])

  const perfilVivo = AUTH_BYPASS ? PERFIL_DEV : (perfil ?? null)

  // ── Acciones ─────────────────────────────────────────────────────────────
  // Todas devuelven `{ ok, mensaje }` y NINGUNA lanza: quien las llama es un
  // manejador de evento de una pantalla, y una promesa rechazada ahí se pierde
  // en la consola en vez de convertirse en un mensaje para el jugador.

  // `shouldCreateUser: true` es lo que funde entrar y registrarse en un solo
  // gesto (§1.3): si el correo no existe, la cuenta nace con el código.
  // IOS-1c · las dos esperas de la puerta terminan en el tope (S7): «Enviando…»
  // y «Entrando…» vuelven con un mensaje y el botón disponible. Lo que conteste
  // tarde se aplica igual (un `verifyOtp` que acaba entrando emite SIGNED_IN).
  const enviarCodigo = useCallback(async (correo) => {
    const r = await conTope(supabase.auth.signInWithOtp({
      email: correo,
      options: { shouldCreateUser: true },
    }), TOPE_ESPERA_MS, TOPE)
    if (r === TOPE) return { ok: false, mensaje: MENSAJE_RED }
    const { error } = r
    if (!error) return { ok: true }
    if (esFalloDeRed(error)) return { ok: false, mensaje: MENSAJE_RED }
    // 429 es el límite de reenvío del propio Supabase; el resto se dice sin
    // tecnicismos, como pide el §1.3.
    if (error.status === 429) return { ok: false, mensaje: 'Demasiados intentos — espera un momento antes de pedir otro código' }
    return { ok: false, mensaje: 'No se pudo enviar el código — revisa el correo e inténtalo de nuevo' }
  }, [])

  // El estado NO se toca aquí: al verificar, el SDK emite SIGNED_IN y el efecto A
  // lo recoge. Una escritura de estado desde este manejador sería una segunda
  // fuente de verdad compitiendo con la suscripción.
  const verificarCodigo = useCallback(async (correo, codigo) => {
    const r = await conTope(supabase.auth.verifyOtp({ email: correo, token: codigo, type: 'email' }), TOPE_ESPERA_MS, TOPE)
    if (r === TOPE) return { ok: false, mensaje: MENSAJE_RED }
    const { error } = r
    if (error && esFalloDeRed(error)) return { ok: false, mensaje: MENSAJE_RED }
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
    // IOS-1c · «Guardando…» termina en el tope (S7). Y si la inserción llegó
    // pero la respuesta se perdió, el reintento chocaría con el propio jugador
    // (23505, «ya está tomado»): ante un fallo de red o un 23505 se relee el
    // perfil, y si ya es suyo, está hecho.
    const trabajo = (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: uid, username })
        .select('id, username')
        .single()
      if (!error) {
        setCargaPerfil({ uid, perfil: data })
        return { ok: true }
      }
      if (esFalloDeRed(error) || error.code === '23505') {
        const leido = await supabase.from('profiles').select('id, username').eq('id', uid).maybeSingle()
        if (leido.data) {
          setCargaPerfil({ uid, perfil: leido.data })
          return { ok: true }
        }
        if (esFalloDeRed(error)) return { ok: false, mensaje: MENSAJE_RED }
      }
      return { ok: false, mensaje: traducirErrorUsername(error) }
    })()
    const r = await conTope(trabajo, TOPE_ESPERA_MS, TOPE)
    return r === TOPE ? { ok: false, mensaje: MENSAJE_RED } : r
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
    enviarCodigo, verificarCodigo, crearPerfil, cambiarNombre, cerrarSesion, reintentar,
  }
}
