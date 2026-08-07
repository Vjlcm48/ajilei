import { PHASES } from '../engine/gameEngine'

// ── DSK-U3 · Núcleo puro de "Mano actual" ────────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.3.md §2.
// Sin React, sin DOM, sin localStorage: sólo las cuatro semánticas selladas
// —consulta-por-mano, disponibilidad, N=0 y qué popup toca— expresadas como
// funciones puras para que Vitest las selle. El hook (useConsultas) se limita a
// sostener el estado, persistir y calcular el valor; toda decisión vive aquí.

// Fases en las que la consulta tiene sentido: aquellas en las que hay una mano
// repartida Y una decisión viva del humano. Las de reparto (DEAL_2/DEAL_3) son
// animación en tránsito —las cartas están volando— y las de cierre (SHOWDOWN,
// PAYOUT, GAME_OVER) ya no admiten decisión: ahí la banda gratuita "Tu mejor
// palo" toma el relevo, que es justo la frontera de v1.1 §3.2.
export const FASES_CONSULTABLES = [
  PHASES.BET_1,
  PHASES.BET_2,
  PHASES.DISCARD,
  PHASES.BET_3,
]

// Disponibilidad de la entrada. `handCount` es la identidad de mano del
// marcador ("Mano #N"): 0 significa que aún no se ha repartido ninguna.
export function hayManoConsultable(phase, handCount, numCartas) {
  return (
    FASES_CONSULTABLES.includes(phase) &&
    Number.isInteger(handCount) && handCount > 0 &&
    numCartas > 0
  )
}

export function estadoInicial(saldo) {
  return { saldo, manoConsultada: null }
}

// Decide qué ocurre al presionar la entrada. Devuelve el estado siguiente y el
// desenlace; no toca nada del mundo.
//
//   'repetida' — misma mano ya consultada: GRATIS y con valor recalculado (las
//                cartas cambian con el descarte, así que la respuesta puede ser
//                distinta aunque no se cobre).
//   'nueva'    — primera consulta de esta mano: cobra exactamente 1.
//   'agotadas' — sin saldo y sin derecho adquirido sobre esta mano.
//
// El orden de las guardas NO es intercambiable: 'repetida' va PRIMERO. Quien
// consulta con su última gratis queda en saldo 0 dentro de la misma mano, y
// aun así debe poder volver a mirar — ya pagó por esa mano.
export function pedirConsulta(estado, handCount) {
  if (estado.manoConsultada !== null && estado.manoConsultada === handCount) {
    return { estado, cobro: 0, resultado: 'repetida' }
  }
  if (estado.saldo <= 0) {
    return { estado, cobro: 0, resultado: 'agotadas' }
  }
  return {
    estado: { saldo: estado.saldo - 1, manoConsultada: handCount },
    cobro: 1,
    resultado: 'nueva',
  }
}

// Reparto del resultado de getBestSuitScore en las dos filas del popup, sin
// recalcular una sola regla: la fuente única ya devolvió `palo`, `points` y
// `suitScores`, y aquí sólo se ordenan.
//
// El comodín no aparece en `suitScores` (getBestSuitScore lo excluye del
// recuento por palo) pero SÍ está sumado en `points`. La bonificación se
// DERIVA de la propia salida de la fuente —points menos el crudo del mejor
// palo— en vez de volver a decidir si el comodín aplica: eso sería la segunda
// calculadora que v1.1 §3.3 prohíbe.
export function desglosarPalos(score) {
  if (!score || !score.palo) return null
  const crudo = score.suitScores?.[score.palo] ?? 0
  const resto = Object.entries(score.suitScores || {})
    .filter(([palo]) => palo !== score.palo)
    .sort((a, b) => b[1] - a[1])
    .map(([palo, pts]) => ({ palo, pts }))
  return {
    palo: score.palo,
    pts: score.points,
    bonifComodin: score.points - crudo,
    resto,
  }
}
