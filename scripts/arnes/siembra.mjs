// ── arnes/siembra.mjs · ARN-4 A6 · el azar de la página, sembrado desde fuera ──
// Rector: AJILEI_ARN-4_Tanda4b_v1.0.md §2. La única siembra de arranque para 4173
// (`contextoCap`) y 5173 (`apu`, `u3`). No abre ningún protegido: `deck.js:56` y
// `aiPlayer.js:599` leen `Math.random` en cada llamada, así que basta cambiarlo
// antes de que arranque la app. Cada navegación vuelve a sembrar y empieza la
// secuencia de cero.
//
// UNA SEMILLA ENVEJECE. Si cambia el consumo de azar (MOT-1, un cambio de la IA),
// la semilla sellada puede dejar de dar su caso. Eso no es una regresión: el punto
// sale «sin cobertura» con `AVISO_SEMILLA`, y se elige otra con `--semilla=N`.

export const AVISO_SEMILLA = 're-elegir semilla'

/** mulberry32. Puro; su fuente viaja también a la página, y no puede leer nada de fuera. */
export const generador = (a) => () => {
  a |= 0; a = a + 0x6D2B79F5 | 0
  let t = Math.imul(a ^ a >>> 15, 1 | a)
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
  return ((t ^ t >>> 14) >>> 0) / 4294967296
}

/** El guion de arranque. `window.__azarTiradas` cuenta lo que la página ha bebido. */
export const guionSiembra = (semilla) => {
  if (!Number.isSafeInteger(semilla)) throw new Error(`siembra: semilla inválida (${semilla})`)
  return `(() => {
  const dado = (${generador})(${semilla})
  window.__azarTiradas = 0
  Math.random = () => { window.__azarTiradas++; return dado() }
})()`
}

/** Siembra una página o un contexto, antes de su primera navegación. */
export const sembrarAzar = (destino, semilla) => destino.addInitScript({ content: guionSiembra(semilla) })
