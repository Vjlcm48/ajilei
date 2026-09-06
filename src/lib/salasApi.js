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

  return {
    /** La hora del servidor. La usa `useReloj` una sola vez, al montar. */
    ahora: () => llamar('ahora'),

    /**
     * Abre una mesa. Si es `abierta` y ya existe una esperando con la misma
     * combinación jugadores × apuesta, la base NO crea una segunda: une a ésa y
     * la devuelve. Es la regla sellada de «abrir se vuelve unirme», y vive allí
     * y no aquí porque entre la consulta y la creación cabe otro jugador.
     */
    crearSala: (tipo, jugadores, apuesta) =>
      llamar('crear_sala', { p_tipo: tipo, p_jugadores: jugadores, p_apuesta: apuesta }),

    /**
     * Se sienta en una sala, por código o por id.
     * Idempotente: si ya se está dentro, devuelve la sala sin error.
     */
    unirseSala: ({ codigo = null, salaId = null } = {}) =>
      llamar('unirse_sala', { p_codigo: codigo, p_sala: salaId }),

    /** Deja la sala. Si el que sale es el anfitrión, la sala se cancela. */
    salirSala: (salaId) => llamar('salir_sala', { p_sala: salaId }),

    /** El anfitrión arranca antes de tiempo. Exige ≥2 sentados. */
    jugarYa: (salaId) => llamar('jugar_ya', { p_sala: salaId }),

    /**
     * Cierra una sala vencida. La llama el cliente cuando su cronómetro toca
     * cero: es idempotente y varios jugadores pueden llamarla a la vez sin que
     * el resultado cambie, que es lo que permite no depender de `pg_cron`.
     */
    resolverSala: (salaId) => llamar('resolver_sala', { p_sala: salaId }),

    /** Las mesas abiertas en espera, con su recuento de sentados. Pinta SAL-1. */
    salasAbiertas: () => llamar('salas_abiertas'),

    /** La sala en la que este jugador está, o `null`. Para reanudar tras recargar. */
    miSala: () => llamar('mi_sala'),

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
