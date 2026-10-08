import { supabase } from './supabase'

// ── ECO-1b · La única puerta del cliente a la billetera ─────────────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §2 y el plan aprobado del STOP-1. Molde
// de `salasApi.js`: envoltorio delgado sobre el cliente singleton, sin estado y
// sin reglas. Lee y traduce; lo que se hace con la cifra lo decide
// `hooks/billeteraCore.js`.
//
// Hoy sólo lee. El cliente NUNCA escribe saldo: la billetera se mueve sólo por
// el libro, en el servidor (Reglas §1, M-5 de la 1a).
//
// ── EL CLIENTE ENTRA POR PARÁMETRO ──────────────────────────────────────────
// `crearBilleteraApi(cliente)` existe para que la billetera falsa del arnés
// (`dev/billeteraFalsa.js`) cambie SÓLO la fuente de la lectura: el núcleo, el
// ajuste local y las tres operaciones son los mismos en la app real y en el
// arnés (ajuste 2 del rector al plan de la 1b).

export const ERROR_LECTURA = 'error_lectura'

/**
 * Traduce la respuesta de `mi_billetera()` a `{ data, error }`.
 *
 * `data` es un número o `null`; `error` es una clave o `null`, nunca el objeto
 * de Supabase. `mi_billetera` devuelve `bigint` y PostgREST lo entrega como
 * número JSON; si llegara como texto (un cambio de configuración, un proxy), se
 * pasa por `Number`. Lo que no sea un número se queda en `null` y el núcleo lo
 * trata como fallo.
 */
function traducir({ data, error }) {
  if (error) {
    console.warn('ECO-1: no se pudo leer la billetera —', error.code ?? '(sin código)', error.message)
    return { data: null, error: ERROR_LECTURA }
  }
  if (data === null || data === undefined) return { data: null, error: null }
  const n = typeof data === 'number' ? data : Number(data)
  return { data: Number.isFinite(n) ? n : null, error: null }
}

/**
 * @param {object} cliente  algo con `rpc(nombre)` que devuelve `{ data, error }`
 * @param {object} [opciones]
 * @param {number|null} [opciones.inicial]  la cifra que se conoce ANTES de leer
 *   (sólo la billetera falsa la tiene: así las varas del arnés no ven un
 *   fotograma de carga). La real no sabe nada hasta preguntar.
 */
export function crearBilleteraApi(cliente = supabase, { inicial = null } = {}) {
  return {
    inicial,
    // NUNCA rechaza: una red caída, un 500 o una excepción del SDK llegan como
    // `{ error }`, que es lo que el núcleo sabe tratar. Una promesa rechazada
    // en un efecto se perdería en la consola.
    leer() {
      let llamada
      try {
        llamada = cliente.rpc('mi_billetera')
      } catch (e) {
        return Promise.resolve(traducir({ data: null, error: { message: String(e?.message ?? e) } }))
      }
      return Promise.resolve(llamada)
        .then((r) => traducir(r ?? {}))
        .catch((e) => traducir({ data: null, error: { message: String(e?.message ?? e) } }))
    },
  }
}

export const billeteraApi = crearBilleteraApi()
