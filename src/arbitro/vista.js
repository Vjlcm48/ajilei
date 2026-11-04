// ── MOT-1 1b · Lo que ve cada asiento ───────────────────────────────────────
// Normativo: contrato §4. Se arma campo a campo: lo que no está aquí no sale del
// servidor, y un campo nuevo del motor no se cuela por un `...`. Los nombres son los
// del motor para que el cliente pueda consultar `pozos.esLegal` sobre la vista.

import { PHASES } from '../engine/gameEngine.js'
import { capasDe } from '../engine/pozos.js'
import { ganadorDeMano, ganadoresDeCapas, huboRevelacion } from './ganador.js'
import { sorteoAbierto } from './partida.js'
import { CARTAS_POR_ASIENTO, ETAPAS } from './sorteo.js'

export const FASE_SORTEO = 'SORTEO'

function asientoVisto(p, { abandonado, cobrado }, propio) {
  return {
    name: p.name,
    chips: p.chips,
    contrib: p.contrib,
    folded: p.folded,
    allIn: p.allIn,
    eliminated: p.eliminated,
    abandonado,
    cobrado,
    numCartas: p.cards.length,
    ...(propio ? { cards: p.cards } : {}),
  }
}

function sorteoVisto({ sorteo }, asiento) {
  const eligiendo = sorteo.etapa === ETAPAS.REPARTO || sorteo.etapa === ETAPAS.ELECCION
  return {
    ronda: sorteo.ronda,
    etapa: sorteo.etapa,
    participan: sorteo.participan,
    posiciones: eligiendo && sorteo.participan.includes(asiento)
      ? Array.from({ length: CARTAS_POR_ASIENTO }, (_, i) => i)
      : [],
    yaEligieron: sorteo.elecciones.flatMap((e, i) => (e === null ? [] : [i])),
    rondas: sorteo.rondas,
  }
}

function resultadoVisto(motor) {
  if (motor.phase !== PHASES.PAYOUT) return null
  const base = { ganador: ganadorDeMano(motor), ganadoresPorCapa: ganadoresDeCapas(motor) }
  if (!huboRevelacion(motor)) return base
  return {
    ...base,
    revelacion: motor.players.flatMap((p, asiento) => (
      p.folded ? [] : [{ asiento, cards: p.cards, score: p.score }]
    )),
  }
}

/** @returns {object} la fila de vistas de ese asiento (contrato §5). */
export function vistaDe(estado, asiento) {
  const { motor, asientos, vencimiento, descarte, descartaron, version } = estado
  const abierto = sorteoAbierto(estado)
  return {
    version,
    asiento,
    phase: abierto ? FASE_SORTEO : motor.phase,
    players: motor.players.map((p, i) => asientoVisto(p, asientos[i], i === asiento)),
    currentBet: motor.currentBet,
    unit: motor.unit,
    pot: motor.pot,
    capas: capasDe(motor),
    activePlayerIndex: abierto ? null : motor.activePlayerIndex,
    manoIndex: abierto ? null : motor.manoIndex,
    pieIndex: abierto ? null : motor.pieIndex,
    handRules: motor.handRules,
    handCount: motor.handCount,
    vencimiento,
    descarte: {
      yaDescartaron: descarte.flatMap((d, i) => (d === null ? [] : [i])),
      cuantas: descartaron,
    },
    sorteo: sorteoVisto(estado, asiento),
    resultado: resultadoVisto(motor),
  }
}
