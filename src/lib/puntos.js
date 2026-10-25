import { isAjilei, getBestSuitScore } from '../engine/handEvaluator'
import { puntosDe } from '../config/niveles'

// ── RNK-1b · Los puntos de una mano, en UN sitio del cliente ────────────────
// Rector: AJILEI_RNK-1_Fase1b_v1.0.md §3.1 y §3.3. Normativo:
// docs/AJILEI_Rankings_v1.0.md §2.2 (la tabla) y §2.4 (el adicional del AJILEI).
//
// FUENTE ÚNICA (INV-65). El cliente NUNCA le manda al servidor una cifra de
// puntos: le manda qué mano era, con cuántos vivos y si fue AJILEI, y el
// servidor la deriva (`puntos_reto_ia`, `extra_ajilei` y el `check`
// `libro_puntos_base_chk` de la migración `20261024191731_rnk1a_libro_puntos.sql`).
// Lo que hay aquí es su ESPEJO para lo que la sesión enseña («Puntos
// obtenidos»), y la prueba `scripts/testRnk1b.test.js` lo sella contra la tabla
// del normativo y contra las cifras del SQL.
//
// PURO: sin React, sin red y sin el motor (sólo `handEvaluator`, que no es
// protegido). No se exporta nada nuevo de `gameEngine.js` (Fase 0 §C).

// El adicional por AJILEI: 51 → +1, 52 → +2. Espejo de `extra_ajilei()`.
export const EXTRA_AJILEI = Object.freeze({ 0: 0, 51: 1, 52: 2 })

/**
 * El AJILEI de una mano: 0, 51 o 52.
 *
 * Con el `ruleN` CONGELADO de la mano (`handRules`, K-7), el mismo que usa el
 * motor en `doShowdown` y la celebración en `decideCelebracion`:
 *   · menos de 5 cartas → 0 (todos se retiraron «a las 2», H-7);
 *   · `isAjilei` falso → 0. Esto cubre H-6: en mesa de 4, cuatro del palo (41)
 *     más el 7 de Oros como comodín de 10 puntúa 51, pero NO es AJILEI;
 *   · si lo es, el mejor palo con el comodín de la mano da exactamente 51 (el
 *     natural, que no puede llevar el 7 de Oros: su palo suma como mucho 48) o
 *     52 (4 del palo que suman 41 + el 7 de Oros a 11, sólo con 5 vivos).
 * Cualquier otra cifra es un error de programación y se lanza: la Fase 0 §C
 * demostró que no puede pasar, y un 0 silencioso escondería el día que pase.
 */
export function ajileiDe(cards, handRules) {
  if (!Array.isArray(cards) || cards.length !== 5 || !handRules) return 0
  const { ruleN } = handRules
  if (!isAjilei(cards, ruleN)) return 0
  const { points } = getBestSuitScore(cards, ruleN, handRules.comodinValue !== null)
  if (points !== 51 && points !== 52) {
    throw new Error(`RNK-1b · ajileiDe: un AJILEI que vale ${points} (ruleN ${ruleN})`)
  }
  return points
}

/**
 * Los puntos de UNA mano ganada (normativo §2.2 y §2.4).
 *   origen 'ias'      base = la tabla plana del reto (`puntosDe`: 1 · 2 · 3).
 *   origen 'humanos'  base = sentados + 3 (5 · 6 · 7 · 8). Hoy no se usa: hasta
 *                     MOT-1 no hay manos contra humanos. Los sentados son los
 *                     que el motor congela al barajar (`handRules.ruleN`), y
 *                     llegan por parámetro: esto NO es la calculadora paralela
 *                     que `niveles.js` prohíbe, porque no recuenta asientos.
 *   extra             0 · 1 · 2 por AJILEI 0 · 51 · 52.
 */
export function puntosDeMano({ origen, nivel, sentados, ajilei = 0 }) {
  const base = origen === 'humanos' ? sentados + 3 : puntosDe(nivel)
  const extra = EXTRA_AJILEI[ajilei] ?? 0
  return { base, extra, total: base + extra }
}
