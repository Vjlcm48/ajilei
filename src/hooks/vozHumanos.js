// ── MES-PvP 2 · La voz entre personas ───────────────────────────────────────
// Hermano de `cronicaCore.js`. Diagnóstico: informe de la Fase 0 de MES-PvP, §B.5. Allí
// la crónica se deduce de la transición del motor y dice «La IA…»; aquí sale de
// `ultimaAccion`, que trae el dato y no la frase (K-12), con nombres y con la segunda
// persona para el jugador. Puro. Lee un `game` de `vistaAMesa`: el jugador es el asiento 0.
//
// «Mesa de dos» es la de dos sentados en esta mano (`handRules.ruleN`), no la de dos
// sillas: una mesa de cinco que se quedó en dos ya habla como la de dos.
//
// Las frases llevan los verbos que `messageActionKind` (`GameTable.jsx`) busca para el
// color: «Pasaste» y «Te retiraste» contienen «Pasas» y «Te retiras» a propósito.
import { montoTexto } from '../config/tapetes'
import { t } from '../config/textos'
import { PHASES } from '../engine/gameEngine'
import { MONEDA, nombreEnVoz } from './cronicaCore'
import { CLASE_AVISO_SALIDA, CLASE_REPOSICION } from '../lib/partidaCliente'
import { mismaAccion } from '../lib/vistaAMesa'

// La línea de una jugada. Las cifras con su punto de millar, como en la pantalla.
export function fraseDeAccion(accion, game) {
  const { asiento, tipo, puesto, apuestaDespues, porReloj } = accion
  const jugador = game.players[asiento]
  const dos = game.handRules.ruleN === 2
  const coste = montoTexto(puesto)
  const nueva = montoTexto(apuestaDespues)

  if (asiento === 0) {
    switch (tipo) {
      case 'pasar':     return porReloj ? 'Pasaste por tiempo.' : 'Pasas.'
      case 'apostar':   return `Apuestas ${nueva} ${MONEDA}.`
      case 'igualar':   return `Igualas con ${coste}.`
      case 'subir':     return `Subes a ${nueva}.`
      case 'allIn':     return `Vas all-in con ${coste} ${MONEDA}.`
      case 'retirarse': return porReloj ? 'Te retiraste por tiempo.' : 'Te retiras.'
      default:          return null
    }
  }
  const n = nombreEnVoz(jugador)
  const pregunta = dos ? ' ¿Qué haces?' : ''
  switch (tipo) {
    case 'pasar':     return porReloj ? `${n} pasa por tiempo.` : `${n} pasa.`
    case 'apostar':   return `${n} apuesta ${nueva}.${pregunta}`
    case 'igualar':   return `${n} iguala con ${coste}.`
    case 'subir':     return `${n} sube a ${nueva}.${pregunta}`
    case 'allIn':     return `${n} va all-in con ${coste}.`
    case 'retirarse': return porReloj ? `${n} se retira por tiempo.` : `${n} se retira.`
    default:          return null
  }
}

// ── La línea de una fase ────────────────────────────────────────────────────
const quienAbre = ({ activePlayerIndex: a, players }) => (a === 0 ? 'Tu turno.' : `${nombreEnVoz(players[a])} abre.`)

function resumenDescarte(game) {
  const cuantas = game.descarte.cuantas ?? []
  if (game.handRules.ruleN !== 2) return 'Descarte completado.'
  const rival = game.players.findIndex((p, i) => i !== 0 && !p.eliminated)
  return `Descartaste ${cuantas[0] ?? 0}, ${nombreEnVoz(game.players[rival])} descartó ${cuantas[rival] ?? 0}.`
}

/** MES-PvP 3 · «Juan», «Juan y Ana», «Juan, Ana y María». */
export function listaDeNombres(nombres) {
  return nombres.length < 2 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

// MES-PvP 3 · alguien deja la mesa (quiebra o abandono): el aviso de salida lo dice en el óvalo,
// con su texto propio, no «sin Heptacoins» (Fase 0, §C).
function avisoDeSalida(game) {
  const nombres = game.eliminatedNames
  const quien = `${listaDeNombres(nombres)} ${nombres.length === 1 ? 'dejó' : 'dejaron'} la mesa`
  return `${quien} · la mesa ahora es de ${game.aliveCount}`
}

export function faseHumanos(game) {
  const yo = game.players[0]
  if (game.vencimiento?.clase === CLASE_AVISO_SALIDA && game.eliminatedNames.length > 0) return avisoDeSalida(game)
  switch (game.phase) {
    case PHASES.DEAL_2:
    case PHASES.DEAL_3:  return 'Repartiendo...'
    case PHASES.BET_1:   return `A las 2 — ${quienAbre(game)}`
    case PHASES.BET_2:   return `A las 3 — ${quienAbre(game)}`
    case PHASES.DISCARD:
      if (game.vencimiento?.clase === CLASE_REPOSICION) return resumenDescarte(game)
      if (yo.folded) return 'La mesa descarta.'
      if (game.descarte.yaDescartaron.includes(0)) return 'Esperando el descarte de la mesa.'
      return `Selecciona hasta ${game.handRules.maxDiscard} cartas a descartar.`
    case PHASES.BET_3:   return `${resumenDescarte(game)} Al descarte — ${quienAbre(game)}`
    // El sorteo tiene su capa, y el pago y el fin son de `composeResultado`.
    default: return ''
  }
}

// ── La crónica de una lectura ───────────────────────────────────────────────
// La regla de `cronicaCore`: si la fase cambió manda la fase; si no, y alguien actuó, manda
// la acción. Con dos diferencias. Lo que el reloj hizo por el jugador se dice aunque cierre
// la ronda: es lo único que le cuenta por qué ya no le toca (Fase 0, §G.3). Y una lectura
// sin jugada nueva (alguien abandona, sube la versión) no borra la línea que había.
export function cronicaDe(game, previa = null, anterior = '') {
  const linea = faseHumanos(game)
  if (linea === '') return ''
  const accion = game.ultimaAccion
  const nueva = accion !== null && !mismaAccion(accion, previa?.ultimaAccion)
  if (nueva && accion.asiento === 0 && accion.porReloj) return fraseDeAccion(accion, game)
  if (!previa || previa.phase !== game.phase || game.phase === PHASES.DISCARD) return linea
  if (nueva) return fraseDeAccion(accion, game)
  return anterior || linea
}

// ── MES-PvP 3-A · El abandono, en el óvalo (Reglas v1.7 §8.2) ─────────────────
// Quién abandonó en esta lectura y no en la anterior: dos `game` de `vistaAMesa`, con la
// misma rotación. Sin lectura anterior no hay aviso: quien llega no vio a nadie irse.
export function nuevosAbandonos(game, previa) {
  if (!previa) return []
  return game.players.flatMap((p, i) => (i !== 0 && p.abandonado && !previa.players[i]?.abandonado ? [p.name] : []))
}

/** «Ana abandonó la mesa.», y con `termina`, «… La partida termina.». `null` sin nadie. */
export function avisoDeAbandono(nombres, termina) {
  if (nombres.length === 0) return null
  if (nombres.length === 1) return t(termina ? 'pvp.abandono.termina' : 'pvp.abandono.aviso', { nombre: nombres[0] })
  return t(termina ? 'pvp.abandono.termina.varios' : 'pvp.abandono.aviso.varios', { lista: listaDeNombres(nombres) })
}

// ── MES-PvP 3-A · La pantalla final (Reglas v1.7 §8.3) ─────────────────────────
// Cada uno la suya. El TONO lo pone el resultado, `cobrado − (entrada + recargas)` (en el fin,
// `vistaAMesa` pone lo cobrado en `chips`; quien se fue con la mano en curso aún no cobró, y su
// pila es la de irse). La FRASE la pone cómo terminó, en este orden. Ganar la mesa no se
// decide por `winner`: las frases de victoria solo cuando todos los rivales quebraron.
export const TONOS_FIN = Object.freeze({ CELEBRACION: 'celebracion', NEUTRO: 'neutro', SOBRIO: 'sobrio' })

export function finDePartida(game) {
  const yo = game.players[0]
  // v1.3-b · `entrada` es la de la mesa (`vistaAMesa`, de la sala), no la de `partida_asientos`,
  // que la base sube con cada recarga: así lo recargado se resta una sola vez (Reglas v1.9 §8.3).
  const neta = yo.chips - (yo.entrada + (yo.recargas ?? 0))
  const tono = neta > 0 ? TONOS_FIN.CELEBRACION : neta < 0 ? TONOS_FIN.SOBRIO : TONOS_FIN.NEUTRO
  const fueron = game.players.filter((p, i) => i !== 0 && p.abandonado)
  let caso
  if (yo.abandonado) caso = 1
  else if (yo.eliminated) caso = 2
  else if (fueron.length === 1) caso = 3
  else if (fueron.length >= 2) caso = 4
  else caso = 5
  // El caso 5 siempre es positivo (se quedó con todo). Si no lo fuera, nunca una frase de
  // victoria: la del caso 4, que también es cierta.
  const frase = {
    1: t('pvp.fin.saliste'),
    2: t('pvp.fin.sinfichas'),
    // L-M 3 · Victor (STOP-L): los casos 3 y 4 se funden en una frase sin nombre (Reglas v1.9).
    3: t('pvp.fin.solo'),
    4: t('pvp.fin.solo'),
    5: tono === TONOS_FIN.CELEBRACION ? null : t('pvp.fin.solo'),
  }[caso]
  const cifra = `${neta > 0 ? '+' : neta < 0 ? '−' : ''}${montoTexto(Math.abs(neta))}`
  return { caso, tono, neta, frase, cifra: t('pvp.fin.resultado', { cifra }) }
}

// ── El sonido de una jugada ─────────────────────────────────────────────────
// La propia ya sonó al tocar el botón, salvo si la hizo el reloj.
export function sonidoDe(accion) {
  if (!accion || (accion.asiento === 0 && !accion.porReloj)) return null
  if (accion.tipo === 'retirarse') return 'cardFold'
  return accion.puesto > 0 ? 'coinBet' : null
}
