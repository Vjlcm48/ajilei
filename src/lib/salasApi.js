import { supabase } from './supabase'

// ── SAL-A · La única puerta del cliente a las salas ─────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §5.2.
//
// Envoltorio DELGADO sobre el cliente singleton. No tiene estado, no guarda
// nada, no decide reglas: traduce llamadas y errores. Toda la lógica —la regla
// 5×, el asiento libre más bajo, el límite de intentos, el vencimiento— vive en
// las funciones de la base, que son el único sitio al que un jugador no puede
// mentir.
//
// ── POR QUÉ TODO PASA POR RPC Y NO POR `.from('salas').insert()` ────────────
// Porque las políticas de la migración no dan a nadie INSERT, UPDATE ni DELETE
// sobre estas tablas: sólo SELECT. Un cliente que pudiera escribir en `salas`
// podría sentarse sin saldo, ocupar dos asientos o resucitar una sala vencida.
// Las RPC son `security definer` y comprueban antes de escribir.
//
// ── EL CLIENTE ENTRA POR PARÁMETRO ──────────────────────────────────────────
// `crearSalasApi(cliente)` existe para poder probar esto sin red y sin proyecto:
// el test le pasa un doble y recorre el camino real —la traducción de errores,
// la forma de la respuesta, la baja de las suscripciones— con la certeza de que
// no hay un socket abierto en la corrida de Vitest.
//
// El singleton sigue siendo el de siempre (`lib/supabase.js`) y nadie llama a
// `createClient` aquí: dos instancias del SDK sobre el mismo proyecto se pisan
// la sesión y abren dos sockets de tiempo real, que es justo lo que un PvP no
// puede permitirse.

// ── Los errores son CLAVES, no prosa ────────────────────────────────────────
// Las funciones de la base lanzan `raise exception using errcode = 'P0001',
// message = '<clave>'` con las claves exactas y sin una palabra de más. Aquí se
// devuelven tal cual y SAL-B las traduce con `t('sal.error.<clave>')`.
//
// Es la misma doctrina que `traducirErrorUsername` en `useAuth.js:72` sigue con
// SUP-2a: se compara por CÓDIGO y jamás por texto, porque el mensaje de Postgres
// es prosa que puede cambiar y el `sqlstate` no. La diferencia es que allí los
// códigos eran de Postgres (23514, 23505) y aquí la clave viaja DENTRO del
// mensaje, que es lo que permite tener veinte errores distintos bajo un solo
// `sqlstate`.
// LAS NUEVE SON LAS QUE LANZA LA MIGRACIÓN, y la lista es exhaustiva a
// propósito: lo que no esté aquí no se pinta, cae a `ERROR_INESPERADO`. Si un
// día la base gana un `raise` nuevo, esta lista y las claves `sal.error.*` del
// diccionario tienen que crecer con él — el test lo recuerda.
export const CLAVES_ERROR = [
  'no_autenticado',
  'ya_en_sala',
  'saldo_insuficiente',
  'sala_no_disponible',
  'sala_llena',
  'demasiados_intentos',
  'no_eres_anfitrion',
  'faltan_jugadores',
  'codigo_invalido',
]

// Lo que se devuelve cuando el fallo NO viene de una regla del juego: red caída,
// sesión vencida, un 500. Se distingue a propósito de las claves de arriba
// porque la respuesta del jugador es distinta —«vuelve a intentarlo» y no
// «elige otra mesa»— y porque confundirlas escondería una caída detrás de un
// mensaje de reglas.
export const ERROR_INESPERADO = 'error_inesperado'

// ── SAL-B1 · Ajuste A2 · ¿Esto es una mesa? ────────────────────────────────
// Rector: AJILEI_SAL-B1_AjusteA2_v1.0.md §2.1. EL ÚNICO predicado de «hay mesa»
// del cliente: `App` lo usa como guarda del último metro y esta capa para
// normalizar lo que devuelve la base. Nada vuelve a comparar contra `null` a
// mano.
//
// ── LA FILA DE NULOS ──────────────────────────────────────────────────────
// Una función que `returns public.salas` y hace `return null` NO llega al
// cliente como JSON `null`. PostgREST la llama con `select * from f()`, y
// Postgres, al expandir en `FROM` un compuesto nulo, produce UNA fila con todas
// las columnas en null (`ExecMakeTableFunctionResult`: «NULL result, store a
// null row»). El cliente recibía `{ id: null, jugadores: null, estado: null, … }`,
// lo tomaba por mesa, y pintaba un stub con «Mesa de ⟦n⟧ · 0 HC · La mesa
// arrancó». Dos teléfonos lo vieron el 2026-09-11 tras un código falso.
//
// Se detecta por `id`: es la clave primaria, `not null` en la tabla, así que
// una fila sin él no puede ser una mesa venga de donde venga.
export function esMesa(mesa) {
  return mesa != null && typeof mesa === 'object' && mesa.id != null
}

/**
 * Traduce la respuesta de una RPC a `{ data, error }`.
 *
 * `error` es SIEMPRE una clave (cadena) o `null`; nunca el objeto de Supabase.
 * Que el consumidor no vea nunca el objeto crudo es deliberado: si lo viera,
 * antes o después alguien pintaría `error.message` en pantalla y el jugador
 * leería una excepción de Postgres.
 */
function traducir({ data, error }) {
  if (!error) return { data: data ?? null, error: null }

  // `P0001` es el `raise exception` de nuestras funciones: el mensaje ES la
  // clave. Se comprueba contra la lista para que un `raise` con prosa escrita a
  // mano —o una función futura que olvide la convención— no acabe pintado tal
  // cual en la pantalla del jugador.
  if (error.code === 'P0001' && CLAVES_ERROR.includes(error.message)) {
    return { data: null, error: error.message }
  }

  console.warn('SAL-A: error inesperado de la base —', error.code ?? '(sin código)', error.message)
  return { data: null, error: ERROR_INESPERADO }
}

/**
 * Construye la API contra un cliente de Supabase.
 * @param {object} [cliente]  el SDK; por defecto, el singleton de la casa
 */
export function crearSalasApi(cliente = supabase) {
  const llamar = (nombre, args) => cliente.rpc(nombre, args).then(traducir)

  // ── A2 §2.1 · Toda RPC que devuelve `public.salas` pasa por aquí ──────────
  // Sin error y sin `id` → «no hay mesa» → `{ data: null, error: null }`, sea
  // la respuesta `null`, `undefined` o la fila de nulos de PostgREST. Los cinco
  // envoltorios de abajo que devuelven una mesa lo usan; ninguno llama a
  // `llamar` a secas.
  //
  // La traza temporal de A2 que escribía aquí la forma cruda de la fila se
  // retiró en la ficha de commits: su lectura verbatim está en los informes de
  // A2 y A3 (`{"id":null,"codigo":null,…}`, leída en el PC el 2026-09-11).
  const mesaOpcional = (nombre, args) =>
    llamar(nombre, args).then((r) => {
      if (r.error !== null || esMesa(r.data)) return r
      return { data: null, error: null }
    })

  return {
    /**
     * La hora del servidor. La usa `useCronometroSala` una sola vez, al montar.
     * (SAL-B2: el comentario decía `useReloj`, y era falso — aquel hook llama al
     * singleton por su cuenta; el informe de B2 Fase 0 §3.7 lo midió.)
     */
    ahora: () => llamar('ahora'),

    /**
     * Abre una mesa. Si es `abierta` y ya existe una esperando con la misma
     * combinación jugadores × apuesta, la base NO crea una segunda: une a ésa y
     * la devuelve. Es la regla sellada de «abrir se vuelve unirme», y vive allí
     * y no aquí porque entre la consulta y la creación cabe otro jugador.
     */
    crearSala: (tipo, jugadores, apuesta) =>
      mesaOpcional('crear_sala', { p_tipo: tipo, p_jugadores: jugadores, p_apuesta: apuesta }),

    /**
     * Se sienta en una sala, por código o por id.
     * Idempotente: si ya se está dentro, devuelve la sala sin error.
     *
     * ── SAL-B1 · Ajuste A1 · el «no encontrado» por código VUELVE COMO DATO ──
     * Rector: AJILEI_SAL-B1_AjusteA1_v1.0.md §3. Desde la migración
     * `sal_b1_ajuste`, `unirse_sala(p_codigo)` con un código bien formado que no
     * encuentra mesa viva devuelve NULL en vez de lanzar. La razón es de
     * Postgres y no de gusto: el intento se anota en `intentos_codigo` DENTRO de
     * la misma transacción, y un `raise` al final la deshace entera —anotación
     * incluida—, así que el límite de cinco por minuto nunca llegaba a contar.
     * Once códigos falsos seguidos lo demostraron el 2026-09-11.
     *
     * Aquí ese `null` se traduce a la MISMA clave que el jugador leía antes,
     * `codigo_invalido` («Código no encontrado o mesa ya iniciada»), para que
     * ninguna pantalla se entere del cambio de mecanismo. SÓLO en el camino por
     * código: por id (`p_sala`) la base sigue lanzando `sala_no_disponible`,
     * porque ahí no hay intento que persistir.
     *
     * A2 · ese «null» llega en realidad como la FILA DE NULOS (ver `esMesa`);
     * `mesaOpcional` la normaliza antes de que esta línea la mire.
     */
    unirseSala: ({ codigo = null, salaId = null } = {}) =>
      mesaOpcional('unirse_sala', { p_codigo: codigo, p_sala: salaId })
        .then((r) => (codigo !== null && r.error === null && r.data === null
          ? { data: null, error: 'codigo_invalido' }
          : r)),

    /** Deja la sala. Si el que sale es el anfitrión, la sala se cancela. */
    salirSala: (salaId) => llamar('salir_sala', { p_sala: salaId }),

    /** El anfitrión arranca antes de tiempo. Exige ≥2 sentados. */
    jugarYa: (salaId) => mesaOpcional('jugar_ya', { p_sala: salaId }),

    /**
     * Cierra una sala vencida. La llama el cliente cuando su cronómetro toca
     * cero: es idempotente y varios jugadores pueden llamarla a la vez sin que
     * el resultado cambie, que es lo que permite no depender de `pg_cron`.
     */
    resolverSala: (salaId) => mesaOpcional('resolver_sala', { p_sala: salaId }),

    /** Las mesas abiertas en espera, con su recuento de sentados. Pinta SAL-1. */
    salasAbiertas: () => llamar('salas_abiertas'),

    /** La sala en la que este jugador está, o `null`. Para reanudar tras recargar. */
    miSala: () => mesaOpcional('mi_sala'),

    // ── SAL-B1 · Cuántos hay sentados en ESTA sala ──────────────────────────
    // Añadida por SAL-B1 (rector §2: «si `salasApi.js` no expone algo que una
    // pantalla necesita, se añade una función NUEVA, sin alterar las
    // existentes»). Ninguna de las de arriba cambia.
    //
    // ── POR QUÉ HACÍA FALTA ────────────────────────────────────────────────
    // `mi_sala()` devuelve la fila de `salas`, que trae `jugadores` —el tamaño
    // de la mesa— pero NO el recuento de sentados; y `salas_abiertas()`, que sí
    // lo trae, sólo ve las abiertas. Una sala privada quedaba sin manera de
    // saber su «x/N», que es justo lo que la sala de espera enseña.
    //
    // ── Y POR QUÉ NO HIZO FALTA UNA FUNCIÓN NUEVA EN LA BASE ───────────────
    // Porque la política de lectura de `sala_jugadores` YA lo permite: un
    // miembro ve los asientos de su sala (`es_miembro`), y cualquiera ve los de
    // una abierta que espera (`es_sala_publica`). Un `select` con `count` cae
    // dentro de lo que la RLS de SAL-A ya concedió, así que esta tanda no
    // escribe SQL — que es la regla 3.
    //
    // `head: true` pide el recuento SIN traerse las filas: lo único que se
    // necesita es un número, y bajar cinco filas para contarlas sería pagar por
    // datos que nadie va a mirar.
    contarSentados: (salaId) =>
      cliente
        .from('sala_jugadores')
        .select('jugador_id', { count: 'exact', head: true })
        .eq('sala_id', salaId)
        .then(({ count, error }) => (error
          ? traducir({ data: null, error })
          : { data: count ?? 0, error: null })),

    // ── SAL-B2 · Quién está sentado en ESTA sala, con su nombre ─────────────
    // Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §4, sobre el informe de Fase 0 §2.3.
    // Función NUEVA; ninguna de las de arriba cambia.
    //
    // ── POR QUÉ NO HACE FALTA SQL ──────────────────────────────────────────
    // Tres hechos que ya estaban en la base: la política de lectura de
    // `sala_jugadores` deja a un miembro ver los asientos de su mesa (SAL-A
    // §6); la de `profiles` es `using (true)` para todo autenticado (SUP-2a §5:
    // «los rivales tienen que verte el nombre en la mesa»); y `jugador_id` es
    // clave foránea a `profiles(id)`, que es lo que PostgREST necesita para
    // incrustar `profiles(username)` en la misma consulta. Es el mismo camino
    // que `contarSentados` ya recorre sin migración.
    //
    // El informe de B1 (§«requiere autorización» 1) afirmaba que `profiles` no
    // era legible para un tercero por RLS. No era cierto, y por eso el stub
    // pintaba «Estás en la mesa» en vez del nombre del anfitrión.
    //
    // ── LA FORMA QUE SE DEVUELVE ───────────────────────────────────────────
    // `[{ asiento, jugadorId, username }]` ordenado por asiento. Los nombres
    // van en camelCase porque es lo que el cliente consume; los de la base se
    // quedan en la base. `username` es `null` si la incrustación no llegó —un
    // perfil borrado a mitad, una fila rara— para que la pantalla pinte una
    // inicial de respaldo en vez de caerse. PostgREST entrega la incrustación
    // de un «muchos a uno» como OBJETO; se tolera también un array de uno por
    // si un cambio de configuración lo devolviera así.
    asientosDe: (salaId) =>
      cliente
        .from('sala_jugadores')
        .select('asiento, jugador_id, profiles(username)')
        .eq('sala_id', salaId)
        .order('asiento')
        .then(({ data, error }) => {
          if (error) return traducir({ data: null, error })
          const filas = Array.isArray(data) ? data : []
          return {
            data: filas.map((fila) => {
              const perfil = Array.isArray(fila.profiles) ? fila.profiles[0] : fila.profiles
              return {
                asiento: Number(fila.asiento),
                jugadorId: fila.jugador_id ?? null,
                username: perfil?.username ?? null,
              }
            }),
            error: null,
          }
        }),

    // ── SAL-B2 F1b · La fila de MI sala, en el estado que esté ──────────────
    // Rector: AJILEI_SAL-B2_Fase1b_v1.0.md §3.2. Función NUEVA, aditiva.
    //
    // `mi_sala()` sólo devuelve 'esperando' (A1 §5): para un miembro sentado es
    // la única pregunta que NO puede responder: «¿mi mesa quedó cancelada o
    // arrancó?». La política `salas_select_visibles` (SAL-A §6) sí lo permite:
    // un miembro ve su sala «en el estado que sea», que es exactamente lo que
    // la sala de espera necesita para pintar uno de sus tres finales. Se lee la
    // fila directa, sin RPC, y se normaliza con `esMesa` como las cinco RPC:
    // una fila sin `id` —o ninguna— es «no hay mesa», nunca una mesa.
    //
    // `maybeSingle()` y no `single()`: una sala que ya no es visible (un
    // no-miembro, una abierta que arrancó) devuelve cero filas, y eso es un
    // `null` legítimo, no un error que traducir.
    leerSala: (salaId) =>
      cliente
        .from('salas')
        .select('*')
        .eq('id', salaId)
        .maybeSingle()
        .then(({ data, error }) => (error
          ? traducir({ data: null, error })
          : { data: esMesa(data) ? data : null, error: null })),

    /**
     * Escucha una sala concreta: la fila de `salas` y los asientos de
     * `sala_jugadores`.
     *
     * Devuelve la función de BAJA, y no el canal. Un canal suelto invita a que
     * el consumidor se olvide de cerrarlo; una función de baja es lo que un
     * `useEffect` sabe devolver sin pensarlo. Dejarlo abierto no es un detalle:
     * son sockets que se acumulan por cada sala visitada.
     *
     * Los `DELETE` llegan con sus columnas porque la migración pone
     * `replica identity full` en las dos tablas — sin eso, un jugador que se
     * levanta llegaría como un borrado sin `sala_id` y nadie sabría de cuál.
     */
    suscribirSala: (salaId, onCambio) => {
      const canal = cliente
        .channel(`sala:${salaId}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'salas', filter: `id=eq.${salaId}` },
          (evento) => onCambio({ tabla: 'salas', evento }))
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'sala_jugadores', filter: `sala_id=eq.${salaId}` },
          (evento) => onCambio({ tabla: 'sala_jugadores', evento }))
        .subscribe()
      return () => { cliente.removeChannel(canal) }
    },

    /**
     * Escucha el listado de mesas abiertas.
     *
     * SIN filtro, y a propósito. Un filtro de Realtime se aplica a la fila del
     * evento, así que una sala que SALE de `esperando` —la que más importa
     * quitar del listado— no casaría con `estado=eq.esperando` y el jugador
     * seguiría viendo una mesa que ya arrancó. Además el recuento de sentados
     * vive en la otra tabla y ningún filtro lo alcanza.
     *
     * Por eso el contrato es «algo cambió, vuelve a pedir la lista» y no «aquí
     * tienes la fila»: `salas_abiertas()` es una consulta barata y la RLS ya
     * limita lo que este jugador puede ver.
     */
    suscribirAbiertas: (onCambio) => {
      const canal = cliente
        .channel('salas:abiertas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salas' }, () => onCambio())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sala_jugadores' }, () => onCambio())
        .subscribe()
      return () => { cliente.removeChannel(canal) }
    },
  }
}

/** La instancia de la casa, contra el cliente singleton. */
export const salasApi = crearSalasApi()

// ── SAL-B1 · De la clave de error a la clave de texto ───────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §6.3 y §2 («si `salasApi.js` no expone
// algo que una pantalla necesita, se añade una función NUEVA»). Es lo único que
// esta sub-tanda añade a este archivo: ninguna línea de arriba cambia.
//
// ── POR QUÉ AQUÍ Y NO EN CADA PANTALLA ──────────────────────────────────────
// Las tres pantallas de SAL pintan errores y las tres tendrían que saber
// convertir `sala_llena` en `sal.error.sala_llena`. Repetir esa concatenación
// tres veces es repetir tres veces la ocasión de escribirla mal, y un prefijo
// mal escrito no falla: pinta `⟦sal.errr.sala_llena⟧` en la cara del jugador.
//
// Vive junto a `CLAVES_ERROR` porque es la MISMA lista mirada desde el otro
// lado: si un día la base gana un `raise` nuevo, la lista de arriba y el
// diccionario tienen que crecer con él, y tenerlos a dos líneas de distancia es
// lo que hace probable que se recuerde.
//
// EL DESCONOCIDO NO SE LLAMA COMO EL ERROR. `ERROR_INESPERADO` es
// `'error_inesperado'` —el nombre del estado— y su texto vive en
// `sal.error.desconocido`, que es como lo bautizó §6.3. La traducción entre los
// dos nombres ocurre aquí y en ningún otro sitio.
export const CLAVE_TEXTO_DESCONOCIDO = 'sal.error.desconocido'

/**
 * La clave de texto que corresponde a un error de `salasApi`.
 *
 * Cualquier cosa que no sea una de las nueve —`null`, `undefined`,
 * `ERROR_INESPERADO`, o una clave futura que el diccionario aún no conozca—
 * cae al genérico. Devolver el prefijo + lo que sea sería fabricar claves
 * inexistentes y convertir un error del servidor en un `⟦…⟧` en pantalla.
 *
 * @param {string|null} error  lo que devolvió una llamada de `salasApi`
 * @returns {string} una clave que el diccionario tiene, siempre
 */
export function claveDeError(error) {
  return CLAVES_ERROR.includes(error) ? `sal.error.${error}` : CLAVE_TEXTO_DESCONOCIDO
}
