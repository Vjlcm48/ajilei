// ── Sorteo sin repetir el último ────────────────────────────────────────────
// La regla vivía dentro de `frasesVictoria.js` desde CEL-1. CEL-2 necesita
// exactamente la misma para la bolsa de melodías —la instrucción lo dice con
// esas palabras, "misma técnica que las frases"—, así que la regla sale de allí
// y pasa a vivir UNA sola vez. `frasesVictoria.eligeIndice` se conserva como
// puerta de entrada (sus pruebas la sellan por nombre) y delega aquí.
//
// Sin React, sin DOM, sin `Math.random`: el aleatorio entra por parámetro. Lo
// que se puede sellar con Vitest se sella entero.

// Sortea sobre las N-1 RESTANTES y corrige el índice, en vez de sortear sobre
// N y repetir hasta que no coincida. Un bucle de reintento no tiene cota
// superior; esto es una operación y siempre acierta.
//
// `ultima` fuera de rango (null, basura de un localStorage manipulado, un
// índice de un banco más corto) se trata como "no hay última": se sortea sobre
// las N. Nunca se devuelve un índice inválido.
//
// El caso N === 1 se resuelve solo y sin excepción: no hay "otra" que elegir,
// así que devuelve 0 aunque 0 sea la última. Una bolsa de un elemento repite
// por definición, y eso no es un fallo del sorteo.
export function eligeSinRepetir(n, ultima, aleatorio) {
  if (!Number.isInteger(n) || n <= 0) return 0
  const a = Math.min(Math.max(Number.isFinite(aleatorio) ? aleatorio : 0, 0), 0.999999999)
  const hayUltima = Number.isInteger(ultima) && ultima >= 0 && ultima < n
  if (!hayUltima || n === 1) return Math.floor(a * n)
  const i = Math.floor(a * (n - 1))
  return i >= ultima ? i + 1 : i
}

// ── La memoria, también compartida ──────────────────────────────────────────
// Lectura y escritura tolerantes: modo privado, storage denegado o valor
// corrupto se resuelven como "no hay memoria". Una repetición de más no es un
// error que justifique romper una pantalla terminal.
export function leeMemoria(clave) {
  try {
    const n = Number.parseInt(window.localStorage.getItem(clave), 10)
    return Number.isInteger(n) ? n : null
  } catch { return null }
}

export function guardaMemoria(clave, indice) {
  try { window.localStorage.setItem(clave, String(indice)) }
  catch { /* sin storage: la memoria dura lo que la sesión, y basta */ }
}
