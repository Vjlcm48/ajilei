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

// ── El sonido de una jugada ─────────────────────────────────────────────────
// La propia ya sonó al tocar el botón, salvo si la hizo el reloj.
export function sonidoDe(accion) {
  if (!accion || (accion.asiento === 0 && !accion.porReloj)) return null
  if (accion.tipo === 'retirarse') return 'cardFold'
  return accion.puesto > 0 ? 'coinBet' : null
}
