// ── MES-PvP 5b · El calendario de la reposición, uno a uno ──────────────────
// Reglas de APU-1 v1.11 §8.7. Una sola cuenta para las dos mesas: contra las IAS
// (`startDiscardAnim`, con `f = 1`) y entre personas (`startReposicionPvP`, con el
// ritmo de la sala). De la Mano al Pie, asiento a asiento: la voz, las cartas que
// salen al mazo, un instante con las ranuras vacías y las que entran.
//
// `f` escala las pausas y los vuelos; el arranque y el cierre no (§8.7). La espera del árbitro
// (`arbitro/reloj.js`, `esperaReposicion`) es la misma cuenta: `reposicionCore.test.js` las ata.
import {
  D_OUT, D_OUT_STAG, D_PAUSE, D_IN, D_IN_STAG, D_SEAT_GAP, D_SKIP,
  REPOSICION_ARRANQUE_MS, REPOSICION_CIERRE_MS, REPOSICION_CIERRE_SIN_VOLTEO_MS,
} from '../config/esperas.js'

/**
 * @param {{ seat: number, indices: number[] }[]} plan en orden, de la Mano al Pie
 * @param {number} [f] el factor del ritmo
 * @returns {{ pasos: { t: number, tipo: 'narra'|'sale'|'entra', seat: number, n?: number, idx?: number }[],
 *   t: number, fin: number, espera: number }} `t`, cuando acaba el último asiento; `fin`, el cierre
 *   (el volteo de la carta propia, si el asiento 0 descartó); `espera`, lo que espera el árbitro,
 *   con el peor cierre, porque cada teléfono cierra según su propio descarte
 */
export function calendarioReposicion(plan, f = 1) {
  const pasos = []
  let t = REPOSICION_ARRANQUE_MS
  plan.forEach(({ seat, indices }) => {
    const n = indices.length
    pasos.push({ t, tipo: 'narra', seat, n })
    if (n === 0) { t += D_SKIP * f; return }
    indices.forEach((idx, k) => pasos.push({ t: t + k * D_OUT_STAG * f, tipo: 'sale', seat, idx }))
    const outEnd = t + (n - 1) * D_OUT_STAG * f + D_OUT * f
    indices.forEach((idx, k) => pasos.push({ t: outEnd + D_PAUSE * f + k * D_IN_STAG * f, tipo: 'entra', seat, idx }))
    t = outEnd + D_PAUSE * f + (n - 1) * D_IN_STAG * f + D_IN * f + D_SEAT_GAP * f
  })
  const volteo = plan.some((p) => p.seat === 0 && p.indices.length > 0)
  return {
    pasos, t, fin: t + (volteo ? REPOSICION_CIERRE_MS : REPOSICION_CIERRE_SIN_VOLTEO_MS), espera: Math.round(t + REPOSICION_CIERRE_MS),
  }
}

/**
 * El teléfono tardío (Reglas v1.11 §8.7): la secuencia empieza en `ancla` (hora local del arranque
 * según el árbitro, `vencimiento − R − desfase`) o ahora, lo que sea antes. `en` es cuánto falta
 * para cada paso: con `en ≤ 0` ya venció, y se aplica sin vuelo.
 */
export function anclarReposicion(pasos, ancla, ahora = Date.now()) {
  const inicio = Math.min(ahora, ancla)
  return pasos.map((p) => ({ ...p, en: inicio + p.t - ahora }))
}

/** La duración de un vuelo del descarte, en s (`FlyingCard`). */
export const vueloDescarte = (f = 1) => (D_OUT * f) / 1000

/**
 * Entre personas: el plan sale de la vista. De la Mano al Pie, solo los asientos con `cuantas`
 * (los retirados, abandonados y sentados fuera llegan con `null`; el ausente, con 0). De un rival
 * salen sus primeras cartas; las propias, las seleccionadas si coinciden con lo que contó el árbitro.
 * @param {{ players: object[], manoIndex: number, descarte: { cuantas: (number|null)[] } }} game rotado
 * @param {number[]} propias la selección del propio, ordenada
 */
export function planReposicionPvP(game, propias = []) {
  const N = game.players.length
  const cuantas = game.descarte?.cuantas ?? []
  const plan = []
  for (let o = 0; o < N; o++) {
    const seat = (game.manoIndex + o) % N
    const n = cuantas[seat]
    if (n === null || n === undefined) continue
    const indices = seat === 0 && propias.length === n ? propias : Array.from({ length: n }, (_, k) => k)
    plan.push({ seat, indices })
  }
  return plan
}
