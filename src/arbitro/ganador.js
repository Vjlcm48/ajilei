// ── MOT-1 1b · Quién ganó la mano ───────────────────────────────────────────
// Normativo: contrato §7. La mano la gana la CAPA 0: `state.winner`, tras el pago, es
// el dueño de la capa de arriba (`gameEngine.js:285, :292`, la trampa de VOZ-3).

import { ganadoresPorCapa } from '../engine/pozos.js'
import { getBestSuitScore, isAjilei } from '../engine/handEvaluator.js'

const puntaje = (p) => p?.score?.points ?? 0

export const ganadoresDeCapas = (motor) => ganadoresPorCapa(motor, puntaje)

export const ganadorDeMano = (motor) => ganadoresDeCapas(motor)[0]

// ¿Se volteó? En la ruta de los retiros nadie tiene `score`: `doShowdown` los pone
// y `startHand` los quita.
export const huboRevelacion = (motor) => motor.players.some((p) => p.score !== null)

// El AJILEI del que ganó: 0, 51 o 52. Es `lib/puntos.ajileiDe`, que no se puede
// importar desde aquí porque sus especificadores no llevan extensión y el servidor
// no lo cargaría. `src/arbitro/arbitro.test.js` confronta las dos copias.
export function ajileiDe(cartas, reglas) {
  if (cartas.length !== 5 || !isAjilei(cartas, reglas.ruleN)) return 0
  return getBestSuitScore(cartas, reglas.ruleN, reglas.comodinValue !== null).points
}
