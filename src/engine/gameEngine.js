import { createDeck, shuffleDeck } from './deck.js'
import { getBestSuitScore, isAjilei, getComodinValue } from './handEvaluator.js'
import { decideBetAction, decideDiscard } from './aiPlayer.js'
// `accionesDe` salió de aquí con el puente de la IA (1c, E-12): el motor
// pregunta por legalidad de UNA acción, no por la fila — la fila la consulta
// quien decide (la IA y, desde 1e, la pantalla).
import { esLegal, costoDe, ganadoresPorCapa, repartirCapas } from './pozos.js'
import { AJILEI_CONFIG } from '../config/ajileiConfig.js'

export const PHASES = {
  WAITING:   'WAITING',
  DEAL_2:    'DEAL_2',   // reserved for deal animation
  BET_1:     'BET_1',    // "a las 2"
  DEAL_3:    'DEAL_3',   // reserved for deal animation
  BET_2:     'BET_2',    // "a las 3"
  DISCARD:   'DISCARD',
  BET_3:     'BET_3',    // "al descarte"
  SHOWDOWN:  'SHOWDOWN',
  PAYOUT:    'PAYOUT',
  GAME_OVER: 'GAME_OVER', // C4.4: fin de mesa (1 vivo) o humano sin fichas
}

export const MIN_BET = AJILEI_CONFIG.betting.apuestaMinima
const DEFAULT_UNIT   = AJILEI_CONFIG.betting.unidadPorDefecto

// Single source of truth for discard limit (≤4 players: 5 cards; 5 players: 3 cards)
export function maxDiscard(numPlayers) {
  return numPlayers <= 4 ? 5 : 3
}

// HR-1 · REGLAS CONGELADAS DE LA MANO.
// Los parámetros de una mano (valor del comodín, ruleN de puntuación, tope de
// descarte) se fijan en el BARAJADO DEL PIE según los jugadores vivos EN LA MESA
// en ese instante, y no vuelven a moverse: los retiros (`folded`) durante la mano
// jamás los alteran, y la bancarrota (`eliminated`) los altera recién en el
// barajado de la mano siguiente.
//
// Antes de HR-1 esto se cumplía por ACCIDENTE: cinco puntos del código
// recalculaban `state.aliveCount ?? numPlayers` por su cuenta, y la invariante
// dependía de que nadie escribiera `aliveCount` a mitad de mano. Ahora hay un
// único origen —este snapshot— y los lectores solo lo consultan. La UI lee el
// MISMO objeto, así que la regla mostrada y la regla aplicada no pueden
// divergir (era la contradicción del caso CM-1/2/3).
export function makeHandRules(ruleN) {
  return {
    ruleN,
    comodinValue: getComodinValue(ruleN),   // null = comodín inactivo (<4 vivos)
    maxDiscard:   maxDiscard(ruleN),
  }
}

// ── Player factory ─────────────────────────────────────────────────────────────
// `eliminated` (C4.4): bancarrota PERMANENTE — a diferencia de `folded`, NO se
// resetea entre manos. Un jugador eliminado nunca vuelve a entrar en la sesión.
// APU-1 · `contribMano` es la contribución TOTAL a la mano (ante incluido) y es
// lo único que la fórmula de capas del §4.2 necesita; `contrib` sigue siendo la
// de la ronda y se resetea con ella. `allIn` es marca propia, distinta de
// `folded`: el retirado pierde el pozo, el all-in compite por sus capas.
// `entrada` son las fichas con que el asiento se sentó — el resultado de la
// mesa se calcula contra ella (§2.5), ya no contra 5.000.
function makePlayer(id, name, isHuman, chips) {
  return {
    id, name, isHuman, chips, cards: [], contrib: 0, contribMano: 0,
    acted: false, folded: false, allIn: false, score: null, eliminated: false,
    entrada: chips,
  }
}

// ── State factory ──────────────────────────────────────────────────────────────
// `jugadores` es la lista `[{ isHuman, chips, name? }]` que arma `entrada.js`.
//
// Dos formas, y las dos son de verdad. Con una LISTA de jugadores cada asiento
// se sienta con las fichas que le tocan —la entrada del humano y la pila de
// cada IA (§2.2, §2.3)—, y ésa es la forma que usa el juego desde 1e. Con un
// NÚMERO se arma una mesa de n asientos iguales con `economy.pilaPruebas`: es
// la forma corta que usan el banco de niveles y las pruebas del motor, donde lo
// que se mide es el cerebro y no el bolsillo y unas pilas iguales son
// exactamente lo que hace honesta la comparación. En 1e-iii dejó de anunciarse
// como provisional, porque no lo es: no espera a que nadie la retire.
export function createInitialState(unit = DEFAULT_UNIT, jugadores = 2) {
  const lista = typeof jugadores === 'number'
    ? Array.from({ length: jugadores }, (_, i) => ({
        isHuman: i === 0,
        chips:   AJILEI_CONFIG.economy.pilaPruebas,
        name:    i === 0 ? 'Tú' : (jugadores === 2 ? 'IA' : `IA ${i}`),
      }))
    : jugadores
  const numPlayers = lista.length
  const players = lista.map((j, i) =>
    makePlayer(i, j.name ?? (i === 0 ? 'Tú' : `IA ${i}`), j.isHuman ?? i === 0, j.chips)
  )
  // pieIndex = N-1: on the first startHand call (no rotation for handCount=0),
  // manoIndex stays at 0 → human is Mano on the first hand of every session.
  const pieIndex  = numPlayers - 1
  const manoIndex = 0
  const base = {
    phase:             PHASES.WAITING,
    numPlayers,                 // tamaño físico fijo de la mesa (asientos, índices)
    aliveCount:        numPlayers, // C4.4: jugadores vivos (con fichas) en la mesa
    // HR-1: semilla de reglas para la pantalla previa al primer barajado (WAITING).
    // startHand la recalcula en cada mano; aquí solo evita que la UI lea undefined.
    handRules:         makeHandRules(numPlayers),
    eliminatedNames:   [],       // nombres eliminados en la última mano (UI)
    unit,
    players,
    pieIndex,
    manoIndex,
    activePlayerIndex: manoIndex,
    pot:               0,
    currentBet:        0,
    selectedDiscards:  [],
    winner:            null,
    message:           '¡Bienvenido a Ajilei!',
    handCount:         0,
  }
  return base
}

// ── Round helpers ──────────────────────────────────────────────────────────────
function activePlayers(players) {
  return players.filter(p => !p.folded)
}

// C4.4: jugadores vivos = no eliminados (permanente). Distinto de activePlayers,
// que filtra `folded` DENTRO de una mano. El conteo vivo enruta las reglas.
function countAlive(players) {
  return players.reduce((n, p) => n + (p.eliminated ? 0 : 1), 0)
}

// Siguiente asiento NO eliminado tras fromIndex (envuelve). Para rotación
// Mano/Pie entre vivos conservando índices estables (no se compacta el array).
function nextAliveIndex(players, fromIndex) {
  const N = players.length
  for (let i = 1; i <= N; i++) {
    const idx = (fromIndex + i) % N
    if (!players[idx].eliminated) return idx
  }
  return fromIndex
}

// APU-1 §4.3: el asiento en all-in se salta en las rondas de apuesta igual que
// el retirado. Cuenta como PENDIENTE solo quien no está retirado, no está en
// all-in y todavía tiene fichas.
function pendientes(players) {
  return activePlayers(players).filter(p => !p.allIn && p.chips > 0)
}

function isRoundOver(players, currentBet) {
  const active = activePlayers(players)
  if (active.length <= 1) return true
  const pend = pendientes(players)
  // APU-1 1e-iii · E-13. Aquí vivía `if (pend.length <= 1) return true`, con la
  // etiqueta de §4.3 puesta encima. Era una mala lectura del normativo: §4.3
  // habla de las rondas RESTANTES, no de la que se está jugando. Lo que ese
  // corte hacía de verdad era cerrar la ronda en cuanto el penúltimo asiento con
  // fichas se marcaba all-in — y el último se quedaba con su pila entera sin
  // haber dicho si pagaba. Un all-in existe exactamente para forzar esa
  // decisión, así que ahí el motor estaba deshaciendo la jugada.
  //
  // No hacía falta para nada más: el caso legítimo —un solo pendiente que YA
  // actuó e igualó— lo cubre la línea de abajo, y la lista vacía también
  // (`every` sobre `[]` es `true`). §4.3 sigue viva y se aplica donde le toca:
  // al ABRIR una fase de apuesta (`abrirApuesta`), no al cerrarla.
  return pend.every(p => p.acted && p.contrib === currentBet)
}

// Returns index of the next player after fromIndex who can still act (wraps).
// APU-1 §4.3: salta retirados Y all-in.
function nextActiveIndex(players, fromIndex) {
  const N = players.length
  for (let i = 1; i <= N; i++) {
    const idx = (fromIndex + i) % N
    if (!players[idx].folded && !players[idx].allIn) return idx
  }
  return fromIndex  // fallback: only one player left
}

// Primer asiento que PUEDE actuar a partir de `desde`, INCLUIDO. Abre cada
// ronda. Sin esto, una ronda que arranca en un asiento retirado o en all-in
// deja el turno en alguien que no puede jugar y la mesa se queda clavada: el
// humano no tiene acciones y la IA propondría la suya una y otra vez.
function primerTurno(players, desde) {
  const N = players.length
  for (let i = 0; i < N; i++) {
    const idx = (desde + i) % N
    const p   = players[idx]
    if (!p.folded && !p.allIn && p.chips > 0) return idx
  }
  return desde
}

// ── Resolve winner ─────────────────────────────────────────────────────────────
// Ruta de pago del ÚLTIMO EN PIE (todos los demás retirados). La regla no
// cambia —cobra él—, pero cobra por `repartirCapas` para que el dinero salga
// del mismo sitio en las dos rutas. Es siempre UNA capa: un asiento en all-in
// no puede retirarse (`pozos.esLegal` → `en_all_in`), así que si hay algún
// all-in vivo quedan al menos dos sin retirar y esta ruta no se toma.
function resolveWinner(state) {
  const { winner } = state
  const ganadores  = ganadoresPorCapa(state, (p, i) => (i === winner ? 1 : 0))
  return {
    ...state,
    phase:   PHASES.PAYOUT,
    pot:     0,
    players: repartirCapas(state, ganadores),
  }
}

// ── Showdown with N players ────────────────────────────────────────────────────
function doShowdown(state) {
  const { numPlayers, players, manoIndex } = state
  // HR-1: las reglas se leen del snapshot congelado en el barajado, no se
  // recalculan aquí. La matemática de evaluación en handEvaluator no se toca.
  const { ruleN } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const active = activePlayers(players)
  const N      = players.length

  const withScores = active.map(p => ({
    ...p,
    score:  getBestSuitScore(p.cards, ruleN, comodinEnabled),
    ajilei: isAjilei(p.cards, ruleN),
  }))

  const maxScore = Math.max(...withScores.map(p => p.score.points))
  const tied     = withScores.filter(p => p.score.points === maxScore)

  // Tie-break: seat-order from Mano (Mano wins; if not Mano, closest to Mano)
  let winnerData = tied[0]
  for (let offset = 0; offset < N; offset++) {
    const seat  = (manoIndex + offset) % N
    const found = tied.find(p => p.id === seat)
    if (found) { winnerData = found; break }
  }
  const winner = winnerData.id

  // Attach scores to players for payout display
  const newPlayers = players.map(p => {
    const s = withScores.find(w => w.id === p.id)
    return s ? { ...p, score: s.score } : p
  })

  // Build message — N=2 preserves original strings exactly
  let message
  if (numPlayers === 2) {
    const pData  = withScores.find(p => p.id === 0)
    const aiData = withScores.find(p => p.id === 1)
    if (pData?.ajilei && !aiData?.ajilei) {
      message = '¡AJILEI! Mano perfecta. ¡Ganaste el pozo!'
    } else if (aiData?.ajilei && !pData?.ajilei) {
      message = '¡La IA tiene AJILEI! Mano perfecta. Pierdes.'
    } else if (pData?.ajilei && aiData?.ajilei) {
      message = '¡Ambos con AJILEI! Ganas por ser el mano.'
    } else if (winner === 0) {
      message = tied.length > 1
        ? `Empate (${pData.score.points} pts). Ganas por ser el mano.`
        : `¡Ganas! Tu ${pData.score.palo} (${pData.score.points} pts) supera al ${aiData.score.palo} de la IA (${aiData.score.points} pts).`
    } else {
      message = `Pierdes. La IA gana con ${aiData.score.palo} (${aiData.score.points} pts) vs tu ${pData.score.palo} (${pData.score.points} pts).`
    }
  } else {
    const wName = players[winner].name
    if (winnerData.ajilei) {
      message = `¡AJILEI! ${wName} gana con mano perfecta${maxScore >= 52 ? ' (comodín)' : ''}.`
    } else if (tied.length > 1) {
      message = `Empate. Gana ${wName} por ser el más cercano a la Mano.`
    } else {
      message = `${wName} gana con ${winnerData.score.palo} (${winnerData.score.points} pts).`
    }
  }

  // APU-1 §4.2 · El pozo se reparte POR CAPAS. Cada una se resuelve por
  // separado con la misma regla de desempate, restringida a sus elegibles.
  // Con una sola capa —el caso de siempre, sin all-in— el resultado es
  // idéntico al de antes: `ganadores[0] === winner`.
  const conScores = { ...state, players: newPlayers, winner, message }
  const puntos    = newPlayers.map(p => withScores.find(w => w.id === p.id)?.score.points ?? -1)
  const ganadores = ganadoresPorCapa(conScores, (_p, i) => puntos[i])
  const pagados   = repartirCapas(conScores, ganadores)

  // `winner` del estado pasa a ser el ganador de la CAPA SUPERIOR: es el nombre
  // que la pantalla pinta. Si esa capa no tiene elegibles (apuesta no igualada
  // que vuelve a quien la puso, D-7), se cae hacia la capa más alta que sí tuvo
  // ganador, y en último caso al de mejor mano.
  const winnerCapa = [...ganadores].reverse().find(g => g >= 0)

  return {
    ...conScores,
    phase:   PHASES.PAYOUT,
    pot:     0,
    players: pagados,
    winner:  winnerCapa ?? winner,
  }
}

// ── Advance to next betting phase ──────────────────────────────────────────────
function advanceBettingPhase(state) {
  const N = state.numPlayers
  // El reset es de RONDA: `contrib` y `acted` vuelven a cero, `contribMano` y
  // `allIn` NO — son de la mano entera (§4.2, §4.3).
  const reseteados = state.players.map(p => ({ ...p, contrib: 0, acted: false }))
  const base = {
    ...state,
    currentBet:        0,
    players:           reseteados,
    activePlayerIndex: primerTurno(reseteados, state.manoIndex),
  }

  if (state.phase === PHASES.BET_1) {
    // Deal 3 more cards, Mano→Pie order (skip folded)
    const deckArr = [...base.deck]
    let   deckPtr = 0
    const deal    = {}
    for (let round = 0; round < 3; round++) {
      for (let offset = 0; offset < N; offset++) {
        const seat = (base.manoIndex + offset) % N
        if (base.players[seat].folded) continue
        if (!deal[seat]) deal[seat] = []
        deal[seat].push(deckArr[deckPtr++])
      }
    }
    const players = base.players.map((p, i) =>
      deal[i] ? { ...p, cards: [...p.cards, ...deal[i]] } : p
    )
    return { ...base, phase: PHASES.DEAL_3, deck: deckArr.slice(deckPtr), players, message: 'Repartiendo...' }
  }

  if (state.phase === PHASES.BET_2) {
    return {
      ...base,
      phase:   PHASES.DISCARD,
      message: `Selecciona hasta ${state.handRules.maxDiscard} cartas a descartar.`,
    }
  }

  if (state.phase === PHASES.BET_3) {
    return doShowdown(base)
  }

  return base
}

// ── §4.3 · Una ronda que no se puede jugar no se abre ─────────────────────
//
// «Si queda un solo jugador con fichas, las rondas de apuesta restantes no
// existen: la mano sigue por reparto y descarte directo al showdown.»
//
// EXISTIR O NO EXISTIR ES COSA DEL MOTOR. 1e-ii lo había resuelto desde la
// pantalla, haciendo que el único asiento con fichas pulsara «pasar» por sí
// mismo; funcionaba, pero dejaba la regla fuera del único sitio que puede
// garantizarla y, sobre todo, no alcanzaba al caso hermano: si NADIE queda con
// fichas (todos all-in en `BET_1`, D-12 ruta 2) no hay nadie que pueda pulsar
// nada y la mano se clava — no hay acción legal que aplicar y
// `advanceBettingPhase` es privada. Desde aquí los dos casos son el mismo y se
// cierran con una sola pregunta, hecha al ENTRAR en la fase.
//
// Se salta exactamente como si todos hubieran pasado: `advanceBettingPhase` es
// la misma transición, con su reset de ronda y su reparto. Descarte y showdown
// no se saltan NUNCA — el asiento en all-in descarta igual (§4.4) y sus cartas
// siguen jugando por sus capas.
function abrirApuesta(estado) {
  return pendientes(estado.players).length > 1 ? estado : advanceBettingPhase(estado)
}

// ── Generic bet-action dispatcher ──────────────────────────────────────────────
//
// APU-1 §3.2 · EL MOTOR VALIDA; la pantalla y la IA solo consultan. Una acción
// ilegal no se aplica: se devuelve **el mismo objeto de estado** (identidad
// `===`, que es lo que `setGame` aprovecha para no re-renderizar) y el motivo
// lo da `pozos.esLegal`, que es a quien preguntan antes la pantalla y el
// árbitro. El motor ya NO reescribe una acción en otra: las tres guardas que
// convertían en `retirarse` lo que no se podía pagar desaparecen, y su caso
// pasa a ser el all-in defensivo del §4.1.
//
// `k` es el multiplicador (§3.1), no un monto: todo lo que cuesta sale de
// `pozos.costoDe` y el motor no hace aritmética de dinero por su cuenta.
export function applyBetAction(state, playerIndex, action, k = 1) {
  if (!esLegal(state, playerIndex, action, k).ok) return state

  let { pot, currentBet } = state
  const player = state.players[playerIndex]
  const costo  = costoDe(state, playerIndex, action, k)
  const amount = k * state.unit   // solo para los mensajes de `apostar`

  let newPlayer     = { ...player, acted: true }
  let newCurrentBet = currentBet
  let isRaise       = false

  switch (action) {
    case 'pasar':
      break
    case 'apostar':
      newPlayer.chips   -= costo
      newPlayer.contrib += costo
      newCurrentBet      = costo
      isRaise            = true
      break
    case 'igualar':
      newPlayer.chips   -= costo
      newPlayer.contrib  = currentBet
      break
    case 'subir':
      newPlayer.chips   -= costo
      newPlayer.contrib  = currentBet + amount
      newCurrentBet      = currentBet + amount
      isRaise            = true
      break
    // §4.1 · All-in DEFENSIVO. No es una subida: no mueve `currentBet` —no
    // puede, por definición no cubría— y NO reabre la ronda aunque sea el
    // último en actuar. Tampoco termina la mano antes de tiempo.
    case 'allIn':
      newPlayer.chips   -= costo
      newPlayer.contrib += costo
      break
    case 'retirarse':
      newPlayer.folded = true
      break
    default:
      return state
  }

  // §4.2 · Todo lo que entra al pozo suma también a la contribución de la MANO,
  // que es lo que la fórmula de capas lee.
  newPlayer.contribMano = (newPlayer.contribMano ?? 0) + costo

  // CLAMP DURO: garantía matemática de que el saldo jamás sea < 0 por ninguna
  // ruta (presente o futura). Con `esLegal` delante no debería activarse.
  newPlayer.chips = Math.max(0, newPlayer.chips)

  // Quedarse sin fichas ES estar en all-in, se haya llegado por la acción
  // `allIn` o pagando justo lo último que se tenía: en las dos el asiento deja
  // de poder apostar y su nivel tiene que hacer capa (§4.2).
  if (newPlayer.chips === 0 && !newPlayer.folded) newPlayer.allIn = true

  pot += costo
  let newPlayers = state.players.map((p, i) => i === playerIndex ? newPlayer : p)

  // After raise: all other active players must act again. El all-in no vuelve a
  // actuar nunca (§4.3), así que no se le rearma `acted`.
  if (isRaise) {
    newPlayers = newPlayers.map((p, i) =>
      i === playerIndex || p.folded || p.allIn ? p : { ...p, acted: false }
    )
  }

  // Build message — N=2 strings preserved verbatim; N>2 uses player name
  let message = ''
  if (state.numPlayers === 2) {
    const h = player.isHuman
    switch (action) {
      case 'pasar':     message = h ? 'Pasas.'                                  : 'La IA pasa.'; break
      case 'apostar':   message = h ? `Apuestas ${amount} fichas.`              : `La IA apuesta ${amount}. ¿Qué haces?`; break
      case 'igualar':   message = h ? `Igualas a ${currentBet}.`                : `La IA iguala a ${currentBet}.`; break
      case 'subir':     message = h ? `Subes a ${newCurrentBet}.`               : `La IA sube a ${newCurrentBet}. ¿Qué haces?`; break
      case 'allIn':     message = h ? `Vas all-in con ${costo} fichas.`         : `La IA va all-in con ${costo}.`; break
      case 'retirarse': message = h ? 'Te retiras. La IA gana el pozo.'         : '¡La IA se retira! Ganaste el pozo.'; break
    }
  } else {
    const n = player.name
    switch (action) {
      case 'pasar':     message = `${n} pasa.`; break
      case 'apostar':   message = `${n} apuesta ${amount}.`; break
      case 'igualar':   message = `${n} iguala a ${currentBet}.`; break
      case 'subir':     message = `${n} sube a ${newCurrentBet}.`; break
      case 'allIn':     message = `${n} va all-in con ${costo}.`; break
      case 'retirarse': message = `${n} se retira.`; break
    }
  }

  // Last player standing wins the pot without showdown
  const stillActive = newPlayers.filter(p => !p.folded)
  if (action === 'retirarse' && stillActive.length === 1) {
    const survivor = stillActive[0]
    let winMsg
    if (state.numPlayers === 2) {
      // Preserve original N=2 messages exactly
      winMsg = player.isHuman
        ? 'Te retiras. La IA gana el pozo.'
        : '¡La IA se retira! Ganaste el pozo.'
    } else {
      winMsg = survivor.isHuman
        ? 'Los demás se retiran. ¡Ganaste el pozo!'
        : `Los demás se retiran. Gana ${survivor.name}.`
    }
    return resolveWinner({
      ...state, pot, currentBet: newCurrentBet,
      players: newPlayers, winner: survivor.id, message: winMsg,
    })
  }

  const next = { ...state, pot, currentBet: newCurrentBet, players: newPlayers, message }

  if (isRoundOver(newPlayers, newCurrentBet)) return advanceBettingPhase(next)

  return { ...next, activePlayerIndex: nextActiveIndex(newPlayers, playerIndex) }
}

// ── Public API ─────────────────────────────────────────────────────────────────

// Deal 2 cards, collect antes, advance to DEAL_2.
// Rotation: hand 0 keeps initial indices; subsequent hands rotate pieIndex by +1.
export function startHand(state) {
  const unit = state.unit
  const N    = state.numPlayers   // tamaño físico (recorrido de asientos)

  // ── PASO 1+2: eliminación permanente y conteo de vivos ──────────────────────
  // Quien ya estaba eliminado, o no puede pagar el ante, queda `eliminated`
  // (permanente) y `folded` (out de la mano). Los vivos se resetean normalmente.
  const prevElim = state.players.map(p => p.eliminated)
  let players = state.players.map(p => {
    const elim = p.eliminated || p.chips < unit
    // `contribMano` y `allIn` son de la MANO: se resetean aquí, como `folded`,
    // y no en el reset de ronda (§4.2, §4.3).
    return elim
      ? { ...p, cards: [], contrib: 0, contribMano: 0, allIn: false, acted: false, folded: true,  score: null, eliminated: true }
      : { ...p, cards: [], contrib: 0, contribMano: 0, allIn: false, acted: false, folded: false, score: null }
  })
  const alive = countAlive(players)
  const eliminatedNames = players.filter((p, i) => p.eliminated && !prevElim[i]).map(p => p.name)

  // ── PASO 4: condiciones terminales (antes de repartir) ──────────────────────
  if (alive <= 1) {
    const winnerSeat = players.findIndex(p => !p.eliminated)
    const humanWon   = winnerSeat === 0
    return {
      ...state, players, aliveCount: alive, eliminatedNames,
      handRules: makeHandRules(alive),
      phase: PHASES.GAME_OVER, pot: 0, currentBet: 0, winner: winnerSeat >= 0 ? winnerSeat : null,
      message: winnerSeat < 0
        ? 'Mesa terminada.'
        : humanWon
          ? '¡Ganaste la mesa! Eres el último con fichas.'
          : `${players[winnerSeat].name} gana la mesa. Te quedaste sin fichas.`,
    }
  }
  // APU-1 §5.4 · El humano sin fichas con ≥2 vivos YA NO termina la mesa desde
  // el motor. La mesa termina solo cuando quedan ≤1 vivos, sea quien sea. El
  // caso del humano quebrado pasa por la pregunta de recarga forzosa, que es
  // pantalla (1e) y cobra por `aplicarRecarga`. Es la edición 5 de MOT-1.

  // ── PASO 3: rotación Mano/Pie entre vivos (índices estables) ────────────────
  const newPieIndex  = state.handCount === 0 ? state.pieIndex : nextAliveIndex(players, state.pieIndex)
  const newManoIndex = nextAliveIndex(players, newPieIndex)

  // Cobro de antes (todos los vivos pueden pagar; eliminados no participan)
  let pot = 0
  players = players.map(p => {
    if (p.eliminated) return p
    pot += unit
    // §4.2: el ante es contribución a la mano como cualquier otra ficha.
    // APU-1 1d §2.1 (D-7 de 1c): si el ante deja la pila EN CERO, ese asiento
    // queda en all-in desde antes de la primera ronda. Sin esta línea recibía
    // turno sin poder actuar, creaba deuda que nadie podía pagar y llegaba al
    // showdown elegible por encima de lo que puso.
    const chips = p.chips - unit
    return { ...p, chips, contribMano: (p.contribMano ?? 0) + unit, allIn: chips === 0 }
  })

  // Deal 2 cards each, Mano→Pie order (skip eliminated, que están folded)
  const deck    = shuffleDeck(createDeck())
  let   deckPtr = 0
  const deal    = {}
  for (let round = 0; round < 2; round++) {
    for (let offset = 0; offset < N; offset++) {
      const seat = (newManoIndex + offset) % N
      if (players[seat].folded) continue
      if (!deal[seat]) deal[seat] = []
      deal[seat].push(deck[deckPtr++])
    }
  }
  players = players.map((p, i) => deal[i] ? { ...p, cards: deal[i] } : p)

  return {
    ...state,
    phase:             PHASES.DEAL_2,
    deck:              deck.slice(deckPtr),
    players,
    aliveCount:        alive,
    // HR-1: AQUÍ se congelan las reglas de esta mano — en el barajado del Pie.
    handRules:         makeHandRules(alive),
    eliminatedNames,
    pot,
    currentBet:        0,
    // APU-1 1d §2.1 · SEGUNDA LÍNEA DE D-7, y la razón es «la mesa se clava»:
    // `advanceFromDeal` (DEAL_2 -> BET_1) no recalcula el turno, así que BET_1
    // abría sobre la Mano aunque la Mano acabara de quedarse a cero pagando el
    // ante. Antes eso pasaba inadvertido —el asiento podía `pasar`—; con el
    // all-in marcado no le queda NINGUNA acción legal y la ronda no converge.
    // `primerTurno` es exactamente lo que `advanceBettingPhase` ya usa para
    // BET_2 y BET_3. El rol de Mano no se mueve: sigue repartiendo y cobrando
    // los empates; lo único que cambia es quién habla primero.
    activePlayerIndex: primerTurno(players, newManoIndex),
    pieIndex:          newPieIndex,
    manoIndex:         newManoIndex,
    selectedDiscards:  [],
    winner:            null,
    message:           'Repartiendo...',
    handCount:         state.handCount + 1,
  }
}

// Called by GameTable after deal animation completes.
export function advanceFromDeal(state) {
  const manoIsHuman = state.manoIndex === 0
  if (state.phase === PHASES.DEAL_2) {
    const msg = state.numPlayers === 2
      ? (manoIsHuman ? 'A las 2 — Tu turno.' : 'A las 2 — IA pensando...')
      : `A las 2 — ${state.players[state.manoIndex].name} abre.`
    return abrirApuesta({ ...state, phase: PHASES.BET_1, message: msg })
  }
  if (state.phase === PHASES.DEAL_3) {
    const msg = state.numPlayers === 2
      ? (manoIsHuman ? 'A las 3 — Tu turno.' : 'A las 3 — IA pensando...')
      : `A las 3 — ${state.players[state.manoIndex].name} abre.`
    return abrirApuesta({ ...state, phase: PHASES.BET_2, message: msg })
  }
  return state
}

// Called by GameTable for human player's bet action.
// El humano es SIEMPRE el asiento 0. `k` es el multiplicador de §3.1, no un
// monto: aquí vivía la traducción `betAmount → k` que existía porque la pantalla
// hablaba en fichas y el motor en multiplicadores. Desde 1e la pantalla elige un
// `k` para consultar la legalidad (`mesaCore.filaAcciones`) y sería absurdo que
// lo multiplicara por la apuesta sólo para que el motor volviera a dividirlo:
// una división de ida y vuelta es una ocasión de redondear mal, y no compraba
// nada. El monto sigue existiendo donde tiene sentido —en el botón, que dice
// cuánto cuesta— y el dinero lo sigue calculando `pozos.costoDe`.
export function applyPlayerBetAction(state, action, k = 1) {
  return applyBetAction(state, 0, action, k)
}

// APU-1 §6.9 · La DECISIÓN de la IA, sin aplicarla. Pura: no toca el estado.
//
// Existe separada de `applyAIBetAction` porque el ritmo humano de 1e necesita
// saber CUÁN GRANDE es la decisión antes de esperar: la pantalla llamará a
// `decidirIA`, esperará según `peso` y sólo entonces aplicará. El `peso` se
// queda fuera del motor —no es regla de juego, es puesta en escena—, así que
// esta función lo devuelve entero y `applyAIBetAction` sólo usa `action` y `k`.
export function decidirIA(state, seat) {
  return decideBetAction(state, seat)
}

// Called by GameTable to auto-advance AI turn(s).
//
// SIN PUENTE (1c, D-11 de 1b). El puente provisional que traducía una
// propuesta ilegal a la mejor acción posible se retira: desde A-2 la IA elige
// dentro de `pozos.accionesDe` y una acción ilegal ya no es un caso a cubrir
// sino un fallo de la IA. Dejar el puente puesto sería esconderlo justo donde
// más caro sale —una mesa que avanza con una acción que nadie decidió—, y lo
// que lo caza es la prueba de legalidad sobre estados aleatorios y la
// convergencia de las 12 celdas del banco.
export function applyAIBetAction(state) {
  const seat = state.activePlayerIndex
  const { action, k } = decidirIA(state, seat)
  return applyBetAction(state, seat, action, k)
}

// APU-1 §5 · Recarga entre manos. Pura, y solo entre manos: NUNCA dentro de
// una. Suma a la pila y a la entrada, porque el resultado de la mesa se calcula
// contra la entrada (§2.5). Ilegal → el mismo objeto de estado, como
// `applyBetAction`.
//
// NO nivela a las IAS: eso es regla de vs-IAS (§5.3) y lo hace 1e con
// `entrada.nivelarIA`. En PvP el árbitro no llama nunca a esta función.
export function aplicarRecarga(state, seat, monto) {
  const p = state.players?.[seat]
  if (!p) return state
  if (state.phase !== PHASES.PAYOUT && state.phase !== PHASES.WAITING) return state
  if (!Number.isInteger(monto) || monto <= 0) return state

  return {
    ...state,
    players: state.players.map((q, i) =>
      i === seat ? { ...q, chips: q.chips + monto, entrada: (q.entrada ?? 0) + monto } : q
    ),
  }
}

// Discard phase: replenish cards in Mano→Pie order, then advance to BET_3.
export function applyDiscard(state, humanDiscardIndices) {
  const { players, manoIndex, numPlayers } = state
  const N = players.length
  const topeDescarte = state.handRules.maxDiscard   // HR-1: congelado en el barajado

  let deckCopy     = [...state.deck]
  let newPlayers   = players.map(p => ({ ...p }))
  const discardCounts = {}

  for (let offset = 0; offset < N; offset++) {
    const seat   = (manoIndex + offset) % N
    const player = players[seat]
    if (player.folded) continue

    let indices = player.isHuman
      ? humanDiscardIndices
      : decideDiscard(state, seat)

    indices = indices.slice(0, topeDescarte)
    discardCounts[seat] = indices.length

    newPlayers[seat] = {
      ...newPlayers[seat],
      cards: player.cards.map((card, i) =>
        indices.includes(i) ? deckCopy.shift() : card
      ),
    }
  }

  let message
  if (numPlayers === 2) {
    const hCount  = discardCounts[0] ?? 0
    const aiCount = discardCounts[1] ?? 0
    const turnHint = manoIndex === 0 ? 'Tu turno.' : 'IA pensando...'
    message = `Descartaste ${hCount}, la IA descartó ${aiCount}. Al descarte — ${turnHint}`
  } else {
    message = 'Descarte completado. Al descarte.'
  }

  // Reset de RONDA, igual que en `advanceBettingPhase`: `contrib` y `acted` a
  // cero, `contribMano` y `allIn` intactos. El asiento que abre es el primero
  // que puede actuar desde la Mano, no la Mano a ciegas (§4.3).
  const reseteados = newPlayers.map(p => ({ ...p, contrib: 0, acted: false }))

  return abrirApuesta({
    ...state,
    phase:             PHASES.BET_3,
    deck:              deckCopy,
    players:           reseteados,
    selectedDiscards:  [],
    currentBet:        0,
    activePlayerIndex: primerTurno(reseteados, manoIndex),
    message,
  })
}

// Toggle a card in/out of the discard selection (respects per-table limit).
export function toggleDiscard(state, cardIndex) {
  const selected = [...state.selectedDiscards]
  const pos      = selected.indexOf(cardIndex)
  const limit    = state.handRules.maxDiscard   // HR-1: congelado en el barajado
  if (pos >= 0) {
    selected.splice(pos, 1)
  } else if (selected.length < limit) {
    selected.push(cardIndex)
  }
  return { ...state, selectedDiscards: selected }
}
