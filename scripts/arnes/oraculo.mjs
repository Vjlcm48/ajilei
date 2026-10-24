// ── arnes/oraculo.mjs · VOZ-3 · D12 · quién gana la mano, sin mirar la pantalla ──
// Rector: AJILEI_VOZ-3_Fase1_v1.0.md §3 1c.2. Puro: lo prueba `oraculo.test.js`.
//
// POR QUÉ. El modo `msg` re-deriva la frase del óvalo desde las cartas, pero
// su ganador (`idxGana`) lo leía del chip de puntos del showdown, que pinta la
// PROPIA mesa. Un oráculo que lee lo que mide no puede desmentirlo: antes de
// VOZ-3 el chip seguía al dueño de la capa de arriba, el arnés componía la
// misma frase equivocada que la mesa y la daba por buena (informe de la Fase 0
// de VOZ-3, §G.1). Aquí el ganador sale de lo que el arnés lee por su cuenta:
// las cartas de cada finalista y quién es la Mano.
//
// LA REGLA es la de VOZ-3 (D1): la mano la gana quien gana la capa principal,
// y en la capa principal son elegibles TODOS los que llegaron al volteo (todos
// pagaron el ante). Gana la mejor mano y, si empatan, la más cercana a la Mano
// recorriendo asientos desde ella: el desempate de `pozos.ganadoresPorCapa`
// (`pozos.js:319-326`), que es el del motor. Se REPLICA a propósito, no se
// importa: el oráculo no puede depender del código que juzga. La prueba lo
// cruza contra `ganadoresPorCapa` para que las dos copias no se separen.

/**
 * El asiento de un nombre de la mesa: 'Tú' es el 0, 'IA' el 1 (mesa de 2) e
 * 'IA k' el k. Son los nombres de `createInitialState`, únicos y estables
 * aunque alguien quiebre (el asiento no se renumera). `null` si no casa.
 */
export function asientoDeNombre(nombre) {
  if (nombre === 'Tú') return 0
  if (nombre === 'IA') return 1
  const m = /^IA (\d+)$/.exec(nombre ?? '')
  return m ? Number(m[1]) : null
}

/**
 * El principal: el asiento que gana la capa 0.
 * @param {{asiento:number, puntos:number}[]} finalistas  los que llegaron al volteo
 * @param {number} mano  asiento de la Mano
 * @param {number} n     asientos de la mesa (los de arranque: el motor no los quita)
 * @returns {number|null}  `null` si no hay finalistas o falta un dato
 */
export function principalPorCartas(finalistas, mano, n) {
  if (!finalistas?.length || !Number.isInteger(mano) || !(n > 0)) return null
  if (finalistas.some((f) => !Number.isInteger(f.asiento) || !Number.isFinite(f.puntos))) return null
  const mejor = Math.max(...finalistas.map((f) => f.puntos))
  const empatan = finalistas.filter((f) => f.puntos === mejor).map((f) => f.asiento)
  for (let k = 0; k < n; k++) {
    const seat = (mano + k) % n
    if (empatan.includes(seat)) return seat
  }
  return null
}
