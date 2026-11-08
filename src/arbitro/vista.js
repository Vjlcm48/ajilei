// ── MOT-1 1b · Lo que ve cada asiento ───────────────────────────────────────
// Normativo: contrato §4. Se arma campo a campo: lo que no está aquí no sale del
// servidor, y un campo nuevo del motor no se cuela por un `...`. Los nombres son los
// del motor para que el cliente pueda consultar `pozos.esLegal` sobre la vista.
//
// R-4: una partida guardada antes de la v1.1 no trae `enAnuncio`, `vencidos`,
// `ultimaAccion` ni `posicion`. Se leen con su valor por defecto. `elegidas` (v1.3) sale de
// `sorteo.elecciones`, que está desde la v1.0. La recarga (v1.3) se lee con `fuera = null` y,
// sin `estado.entrada`, la vista privada lleva `recarga: null`.

import { AUSENTE_DESDE } from '../config/esperas.js'
import { PHASES } from '../engine/gameEngine.js'
import { capasDe } from '../engine/pozos.js'
import { ganadorDeMano, ganadoresDeCapas, huboRevelacion } from './ganador.js'
import { FUERA, enPausaEntreManos, recargaActiva, sorteoAbierto } from './partida.js'
import { CARTAS_POR_ASIENTO, ETAPAS } from './sorteo.js'

export const FASE_SORTEO = 'SORTEO'

// v1.3 · la marca pública de la recarga: decide en la pausa («Recargando»), o se salta la mano
// («Fuera de esta mano»).
export const RECARGA_VISTA = Object.freeze({ DECIDE: 'decide', FUERA: 'fuera' })

function asientoVisto(p, { abandonado, cobrado, enAnuncio, vencidos, fuera = null }, propio, pausa) {
  // Sentado fuera, el motor lo lleva eliminado; la mesa lo ve sentado, retirado y sin cartas. Es
  // obligatorio por el cliente ya publicado, que con `eliminated` enseña la pantalla final.
  const saltaMano = fuera === FUERA.MANO
  return {
    name: p.name,
    chips: p.chips,
    contrib: p.contrib,
    contribMano: p.contribMano,
    folded: saltaMano ? true : p.folded,
    allIn: p.allIn,
    eliminated: saltaMano ? false : p.eliminated,
    abandonado,
    cobrado,
    enAnuncio: enAnuncio ?? false,
    ausente: (vencidos ?? 0) >= AUSENTE_DESDE,
    numCartas: saltaMano ? 0 : p.cards.length,
    recarga: fuera === null ? null : pausa ? RECARGA_VISTA.DECIDE : RECARGA_VISTA.FUERA,
    ...(propio ? { cards: saltaMano ? [] : p.cards } : {}),
  }
}

// v1.3 · lo privado de la recarga: solo el asiento propio. `monto = entrada − pila`; el saldo no
// va en la vista (D6). Sin `estado.entrada` (R-4), `null`. Quien ya cobró conserva `recargas`,
// que la pantalla final necesita.
function recargaVista(estado, asiento) {
  if (!recargaActiva(estado)) return null
  const a = estado.asientos[asiento]
  const vivo = a.cobrado === null && !a.abandonado
  return {
    monto: vivo ? Math.max(0, estado.entrada - estado.motor.players[asiento].chips) : 0,
    oferta: vivo && (a.fuera ?? null) !== null,
    pedida: a.pedida ?? false,
    cancelada: a.cancelada ?? null,
    recargas: a.recargas ?? 0,
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
  const pausa = enPausaEntreManos(estado)
  return {
    version,
    asiento,
    phase: abierto ? FASE_SORTEO : motor.phase,
    players: motor.players.map((p, i) => asientoVisto(p, asientos[i], i === asiento, pausa)),
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
    recarga: recargaVista(estado, asiento),
  }
}
