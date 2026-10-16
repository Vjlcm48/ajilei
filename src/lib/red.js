// ── IOS-1c · El tope de tiempo de la red, en un solo sitio ──────────────────
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.1 (S5) y el plan aprobado del STOP-1.
//
// Hasta aquí ninguna petición al servidor tenía tiempo límite (Fase 0, §B.4):
// una que se quedaba colgada —la app de iOS que vuelve de segundo plano por
// una conexión que ya no existe— no FALLABA, y los reintentos que sí existen
// sólo arrancan con un fallo. La píldora esperaba lo que tardara, con el botón
// de Retar apagado.
//
// `fetchConTope` envuelve el `fetch` que el cliente de Supabase usa para TODO
// su HTTP (`supabase.js`: las RPC, las tablas y la autenticación). Pasado el
// tope, la petición se cancela y llega como un fallo de red, que es lo que
// cada API del cliente ya traduce a `red` y sabe reintentar.
//
// ── POR QUÉ ES SEGURO CANCELAR ──────────────────────────────────────────────
//   · el dinero: todas las funciones que lo mueven son idempotentes por token,
//     por `seq` o por clave del libro (informe de la 1c, §1): repetir lo que sí
//     llegó no cobra dos veces;
//   · la sesión: para la autenticación, un fetch cancelado es un
//     `AuthRetryableFetchError` (auth-js `lib/fetch.ts`), y la sesión sólo se
//     borra con un error NO reintentable (`GoTrueClient.ts`, `_callRefreshToken`).
//
// DEPENDENCIA DECLARADA: el refresco cortado por el tope se reenvía al momento
// con el mismo token de refresco. Supabase lo acepta durante su intervalo de
// reuso, 10 s por defecto (panel: Auth → «Refresh token reuse interval»). Con
// un intervalo menor que el tope, cortar un refresco que SÍ llegó podría dejar
// la sesión muerta. No se baja de 10 s.

/** El tope, medido en la 1c (informe §2). */
export const TOPE_RED_MS = 8000

/**
 * El tope de una ESPERA DE PANTALLA («Cargando», «Entrando…», «Guardando…»):
 * el de la red y un margen para el primer reintento que el SDK hace solo (el
 * refresco de sesión cortado por el tope se reenvía a los 200 ms). Sin el
 * margen, la tarjeta «No pudimos cargar tu cuenta» asomaría un instante justo
 * antes de que ese reintento contestara.
 */
export const TOPE_ESPERA_MS = TOPE_RED_MS + 2000

/**
 * Un `fetch` que se cancela solo pasado `ms`.
 * Respeta la señal que ya traiga la petición: si quien llama cancela antes,
 * se cancela igual que sin el tope.
 *
 * @param {typeof fetch} fetchBase
 * @param {number} ms
 * @param {object} [reloj]  `setTimeout`/`clearTimeout` (las pruebas dan uno falso)
 */
export function fetchConTope(fetchBase, ms = TOPE_RED_MS, reloj = globalThis) {
  return (entrada, opciones = {}) => {
    const control = new AbortController()
    const previa = opciones.signal
    if (previa?.aborted) return fetchBase(entrada, opciones)
    const alCancelar = () => control.abort(previa.reason)
    previa?.addEventListener('abort', alCancelar, { once: true })
    const id = reloj.setTimeout(() => control.abort(new DOMException('IOS-1c: tope de red', 'AbortError')), ms)
    let llamada
    try {
      llamada = Promise.resolve(fetchBase(entrada, { ...opciones, signal: control.signal }))
    } catch (e) {
      llamada = Promise.reject(e)
    }
    return llamada.finally(() => {
      reloj.clearTimeout(id)
      previa?.removeEventListener('abort', alCancelar)
    })
  }
}

/**
 * Una espera de la pantalla que no puede quedarse sin salida (S7): la promesa
 * de `trabajo` o, pasado `ms`, `alTope`. NO cancela el trabajo: si contesta
 * tarde, su efecto llega igual (un `verifyOtp` que acaba entrando, por ejemplo);
 * sólo libera el botón con un mensaje.
 */
export function conTope(trabajo, ms, alTope, reloj = globalThis) {
  let id
  const tope = new Promise((ok) => { id = reloj.setTimeout(() => ok(alTope), ms) })
  return Promise.race([Promise.resolve(trabajo), tope]).finally(() => reloj.clearTimeout(id))
}
