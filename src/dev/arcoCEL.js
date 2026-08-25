// ── arcoCEL.js · Las marcas del arco, sólo en desarrollo ────────────────────
// El arco de CEL-2 es una secuencia de instantes encadenados a un sonido, y un
// arnés no puede medir instantes mirando píxeles: cuando la captura llega, el
// instante ya pasó. Así que el arco DECLARA sus marcas y el arnés las lee.
//
// Misma doctrina que `siembraCEL.js`: `import.meta.env.DEV` lo apaga en
// cualquier build de producción —allí `marcaCEL` es un no-op y `window` no
// estrena una sola propiedad—, y la única superficie es un array de sólo
// lectura para quien lo mire desde fuera.
//
// NO es telemetría y no sale de la pestaña. Es el equivalente en tiempo de lo
// que `?cel` es en estado: una puerta para poder medir lo que si no habría que
// creerse.

export const ARCO_GLOBAL = '__AJILEI_ARCO'

function almacen() {
  if (!import.meta.env.DEV) return null
  if (typeof window === 'undefined') return null
  if (!window[ARCO_GLOBAL]) window[ARCO_GLOBAL] = []
  return window[ARCO_GLOBAL]
}

// `t` en milisegundos desde el arranque de la página (`performance.now`), que
// es el reloj monótono: un cambio de hora del sistema no puede desordenar dos
// marcas. Los deltas del informe se calculan restando, nunca acumulando.
export function marcaCEL(marca, extra) {
  const a = almacen()
  if (!a) return
  a.push({ marca, t: Math.round(performance.now()), ...(extra || {}) })
}

// El arnés arranca cada celda con la pizarra limpia: una corrida que arrastre
// las marcas de la anterior mide un arco que no existió.
export function limpiaArcoCEL() {
  const a = almacen()
  if (a) a.length = 0
}
