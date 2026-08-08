import { PHASES } from '../engine/gameEngine'
import { isAjilei } from '../engine/handEvaluator'

// ── DSK-VC2 · El decisor de celebración ─────────────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §2.
// Función PURA y única: toda la lógica de "¿se celebra, y qué?" vive aquí y en
// ningún otro sitio. Sin React, sin DOM, sin audio — Vitest la sella entera.

export const NIVELES = ['ajilei', 'mano', 'partida']

// Techo de duración de las celebraciones EN MESA (v1.0 §3). La tarjeta de fin
// de partida está exenta: es pantalla terminal, no interrumpe nada.
export const CELEBRACION_TOPE_MS = 2500
export const VIAJE_MS = 1100      // el pozo deslizándose hasta la pila
export const VIAJE_ESCALON_MS = 90 // desfase entre fichas del reguero
export const PULSO_MS = 900        // un ciclo, uno solo
export const AJILEI_MS = 2000      // aparición breve de la palabra

// Reglas, en el orden EXACTO en que se aplican:
//
//   1. winner === 0 SIN EXCEPCIÓN. Las derrotas y las manos que ganan las IAs
//      no se subrayan: pasan como hoy. Esta guarda es lo primero porque de ella
//      depende el caso que más fácil se cuela — un AJILEI del humano que PIERDE.
//      Ocurre de verdad: con dos AJILEI en mesa el desempate lo gana el más
//      cercano a la Mano, así que el humano puede tener mano perfecta y perder.
//      Mano perfecta y derrota siguen siendo derrota: null.
//
//   2. GAME_OVER antes que PAYOUT. Son fases distintas y no compiten (media un
//      clic humano en "Siguiente mano"), pero el orden lo deja explícito.
//
//   3. AJILEI por RECÁLCULO, jamás leyendo el estado ni el mensaje. La bandera
//      `ajilei` que doShowdown calcula muere en su variable local: newPlayers
//      sólo arrastra `score`. Se recalcula con isAjilei —exportada y pura—
//      contra el ruleN CONGELADO de la mano, nunca un recuento vivo. Acepta las
//      DOS variantes que el motor reconoce: la natural (5 del palo, 51) y la de
//      comodín (mesa 5: 4 del palo + 7 de Oros, 52).
//
//   4. AJILEI SUSTITUYE a mano. Juega sólo la mayor, nunca encadenadas.
export function decideCelebracion({ phase, winner, humanCards, ruleN }) {
  if (winner !== 0) return null
  if (phase === PHASES.GAME_OVER) return 'partida'
  if (phase !== PHASES.PAYOUT) return null
  if (Array.isArray(humanCards) && isAjilei(humanCards, ruleN)) return 'ajilei'
  return 'mano'
}

// El viaje del pozo corre en los DOS niveles de mesa: el pozo se ganó igual.
// Lo que AJILEI se lleva por delante es el pulso y el roce de fichas — el
// rasgueo es el sonido de ese momento y no comparte.
export const llevaViaje = (nivel) => nivel === 'mano' || nivel === 'ajilei'
export const llevaPulso = (nivel) => nivel === 'mano'

// Sonido de cada nivel. `null` = silencio propio (AJILEI no suma el roce).
export function sonidoDe(nivel) {
  if (nivel === 'mano') return 'chipsCollect'
  if (nivel === 'ajilei') return 'ajileiStrum'
  if (nivel === 'partida') return 'tableKnock'
  return null
}

// Duración total de la celebración en mesa, para el arnés y para el temporizador.
export function duracionDe(nivel, nFichas = 1) {
  if (nivel === 'ajilei') return AJILEI_MS
  if (nivel === 'mano') return VIAJE_MS + (nFichas - 1) * VIAJE_ESCALON_MS
  return null   // 'partida' es pantalla terminal: sin techo
}
