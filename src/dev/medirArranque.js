// ── MES-PvP 5a · A3 · Las marcas del arranque (`?medir=arranque`) ───────────
// Fase 0, §C.4. Herramienta fija SOLO de desarrollo: cada llamada vive dentro de una rama
// `import.meta.env.DEV`, así que en `dist/` no queda ni el módulo (lo comprueba
// `testDistSinMoldes`). El mando se recuerda en `sessionStorage` para que sobreviva al inicio de
// sesión y a las pantallas del camino (lobby → sala → partida).
//
// Las marcas, en el orden del arranque (§C.2):
//   sala-cero          la cuenta atrás de la sala llega a 0 y se pide `resolver_sala`
//   resuelta           la sala se ve `activa` (por la respuesta o por Realtime; con «Jugar ya»
//                      o la mesa llena es la primera)
//   pantalla           se monta la partida
//   mesa-1             el primer cuadro con la mesa (la provisional, si la hay)
//   reclamo-enviado    el primer `reclamar_vencimiento`, sin vista
//   reclamo-respuesta  su respuesta
//   vista-1            la primera vista del árbitro (con su vencimiento: de ahí sale cuándo nació
//                      el barajado en la hora del servidor)
// Cada una con `Date.now()`, y además como `performance.mark('arranque:<nombre>')`.

const CLAVE = 'ajilei.medir'
const VALOR = 'arranque'
const NUEVO = ['sala-cero', 'resuelta']

let registro = []
let primeraVista = null
let sillas = null
let estado = { registro, primeraVista, sillas }   // la foto que lee el panel: cambia solo con una marca
const oyentes = /* @__PURE__ */ new Set()

export function midiendo() {
  if (typeof window === 'undefined') return false
  const pide = new URLSearchParams(window.location.search).get('medir') === VALOR
  try {
    if (pide) window.sessionStorage.setItem(CLAVE, VALOR)
    return pide || window.sessionStorage.getItem(CLAVE) === VALOR
  } catch {
    return pide
  }
}

/**
 * Una marca, la primera vez en este arranque. `datos`: con `vista-1`, la vista del árbitro; con
 * `resuelta`, las sillas de la sala (`{ anfitrion, propia }`). De ahí sale en qué asiento real
 * se sentó cada uno y dónde va el mazo del sorteo.
 */
export function marcar(nombre, datos = null) {
  if (!midiendo()) return
  // Otra partida en la misma página: el arranque anterior ya llegó a la mesa.
  if (NUEVO.includes(nombre) && registro.some((m) => m.nombre === 'pantalla')) {
    registro = []
    primeraVista = null
    sillas = null
  }
  if (registro.some((m) => m.nombre === nombre)) return
  registro = [...registro, { nombre, hora: Date.now() }]
  if (datos && nombre === 'vista-1') {
    primeraVista = {
      vencimiento: datos.vencimiento ?? null, participan: datos.sorteo?.participan?.length ?? 0,
      asiento: datos.asiento, n: datos.players?.length ?? 0,
    }
  }
  if (datos && nombre === 'resuelta') sillas = datos
  globalThis.performance?.mark?.(`arranque:${nombre}`)
  estado = { registro, primeraVista, sillas }
  oyentes.forEach((o) => o())
}

export const leerArranque = () => estado

export function escucharArranque(o) {
  oyentes.add(o)
  return () => oyentes.delete(o)
}
