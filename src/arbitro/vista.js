// ── MOT-1 1b · Lo que ve cada asiento ───────────────────────────────────────
// Normativo: contrato §4. Se arma campo a campo: lo que no está aquí no sale del
// servidor, y un campo nuevo del motor no se cuela por un `...`. Los nombres son los
// del motor para que el cliente pueda consultar `pozos.esLegal` sobre la vista.
//
// R-4: una partida guardada antes de la v1.1 no trae `enAnuncio`, `vencidos`,
// `ultimaAccion` ni `posicion`. Se leen con su valor por defecto. `elegidas` (v1.3) sale de
// `sorteo.elecciones`, que está desde la v1.0.

import { AUSENTE_DESDE } from '../config/esperas.js'
import { PHASES } from '../engine/gameEngine.js'
import { capasDe } from '../engine/pozos.js'
import { ganadorDeMano, ganadoresDeCapas, huboRevelacion } from './ganador.js'
import { sorteoAbierto } from './partida.js'
import { CARTAS_POR_ASIENTO, ETAPAS } from './sorteo.js'

export const FASE_SORTEO = 'SORTEO'

function asientoVisto(p, { abandonado, cobrado, enAnuncio, vencidos }, propio) {
  return {
    name: p.name,
    chips: p.chips,
    contrib: p.contrib,
    contribMano: p.contribMano,
    folded: p.folded,
    allIn: p.allIn,
    eliminated: p.eliminated,
    abandonado,
    cobrado,
    enAnuncio: enAnuncio ?? false,
    ausente: (vencidos ?? 0) >= AUSENTE_DESDE,
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
    // v1.3 · QUÉ POSICIÓN eligió cada asiento (0…4, o null), sin el valor: la carta elegida se
    // adelanta también en los asientos ajenos (Reglas v1.9 §8.4). El valor llega en el volteo.
    elegidas: sorteo.elecciones.map((e) => e ?? null),
    rondas: sorteo.rondas.map((r) => ({
      ...r,
      volteo: r.volteo.map((v) => ({ ...v, posicion: v.posicion ?? null })),
    })),
  }
}

// v1.2 · el fin que llega en la misma jugada que cierra la mano (R2, `terminarSiQuedaUno`)
// conserva las contribuciones de esa mano; el de `startHand` las pone a cero. Con ellas, la
// vista del fin publica el resultado de la mano, y el cliente enseña su pago antes.
const finConPago = (motor) => motor.phase === PHASES.GAME_OVER && motor.players.some((p) => (p.contribMano ?? 0) > 0)

function resultadoVisto(motor) {
  if (motor.phase !== PHASES.PAYOUT && !finConPago(motor)) return null
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
  const { motor, asientos, vencimiento, descarte, descartaron, version, ultimaAccion } = estado
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
    ultimaAccion: ultimaAccion ?? null,
  }
}
