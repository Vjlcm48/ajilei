import { createDeck, shuffleDeck } from './deck'
import { getBestSuitScore, isAjilei } from './handEvaluator'
import { decideBetAction, decideDiscard } from './aiPlayer'
import { AJILEI_CONFIG } from '../config/ajileiConfig'

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
const DEFAULT_UNIT   = AJILEI_CONFIG.betting.entrada

// Single source of truth for discard limit (≤4 players: 5 cards; 5 players: 3 cards)
export function maxDiscard(numPlayers) {
  return numPlayers <= 4 ? 5 : 3
}

// ── Player factory ─────────────────────────────────────────────────────────────
// `eliminated` (C4.4): bancarrota PERMANENTE — a diferencia de `folded`, NO se
// resetea entre manos. Un jugador eliminado nunca vuelve a entrar en la sesión.
function makePlayer(id, name, isHuman, chips) {
  return { id, name, isHuman, chips, cards: [], contrib: 0, acted: false, folded: false, score: null, eliminated: false }
}

// ── State factory ──────────────────────────────────────────────────────────────
export function createInitialState(unit = DEFAULT_UNIT, numPlayers = 2) {
  const chips = AJILEI_CONFIG.economy.saldoInicial
  const players = [
    makePlayer(0, 'Tú', true, chips),
    ...Array.from({ length: numPlayers - 1 }, (_, i) =>
      makePlayer(i + 1, numPlayers === 2 ? 'IA' : `IA ${i + 1}`, false, chips)
    ),
  ]
  // pieIndex = N-1: on the first startHand call (no rotation for handCount=0),
  // manoIndex stays at 0 → human is Mano on the first hand of every session.
  const pieIndex  = numPlayers - 1
  const manoIndex = 0
  const base = {
    phase:             PHASES.WAITING,
    numPlayers,                 // tamaño físico fijo de la mesa (asientos, índices)
    aliveCount:        numPlayers, // C4.4: jugadores vivos (con fichas) → reglas
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

function isRoundOver(players, currentBet) {
  const active = activePlayers(players)
  if (active.length <= 1) return true
  return active.every(p => p.acted && p.contrib === currentBet)
}

// Returns index of the next non-folded player after fromIndex (wraps around)
function nextActiveIndex(players, fromIndex) {
  const N = players.length
  for (let i = 1; i <= N; i++) {
    const idx = (fromIndex + i) % N
    if (!players[idx].folded) return idx
  }
  return fromIndex  // fallback: only one player left
}

// ── Resolve winner ─────────────────────────────────────────────────────────────
function resolveWinner(state) {
  const { winner, pot, players } = state
  const newPlayers = players.map((p, i) =>
    i === winner ? { ...p, chips: p.chips + pot } : p
  )
  return { ...state, phase: PHASES.PAYOUT, pot: 0, players: newPlayers }
}

// ── Showdown with N players ────────────────────────────────────────────────────
function doShowdown(state) {
  const { numPlayers, players, manoIndex } = state
  // C4.4: las reglas (comodín, valor, ajilei N=5) leen el conteo VIVO, no el
  // tamaño fijo. La matemática de evaluación en handEvaluator no se toca.
  const ruleN = state.aliveCount ?? numPlayers
  const comodinEnabled = ruleN >= 4
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

  return resolveWinner({ ...state, players: newPlayers, winner, message })
}

// ── Advance to next betting phase ──────────────────────────────────────────────
function advanceBettingPhase(state) {
  const N    = state.numPlayers
  const base = {
    ...state,
    currentBet:        0,
    players:           state.players.map(p => ({ ...p, contrib: 0, acted: false })),
    activePlayerIndex: state.manoIndex,
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
      message: `Selecciona hasta ${maxDiscard(state.aliveCount ?? N)} cartas a descartar.`,
    }
  }

  if (state.phase === PHASES.BET_3) {
    return doShowdown(base)
  }

  return base
}

// ── Generic bet-action dispatcher ──────────────────────────────────────────────
function applyBetAction(state, playerIndex, action, betAmount) {
  let { pot, currentBet } = state
  const amount  = betAmount || state.unit
  const player  = state.players[playerIndex]
  const toCall  = currentBet - player.contrib

  // REGLA: saldo nunca negativo. Si no cubre el monto completo de la acción,
  // retiro forzado (Opción A). No existe all-in parcial en esta fase.
  // Guarda original — igualar (o cualquier acción con call pendiente impagable):
  if (toCall > 0 && player.chips < toCall && action !== 'retirarse') action = 'retirarse'
  // apostar: monto de apertura impagable → retiro forzado.
  if (action === 'apostar' && amount > player.chips) action = 'retirarse'
  // subir: monto TOTAL a poner (newBet − contrib) impagable → retiro forzado.
  if (action === 'subir' && ((currentBet + amount) - player.contrib) > player.chips) action = 'retirarse'

  let newPlayer     = { ...player, acted: true }
  let newCurrentBet = currentBet
  let potDelta      = 0
  let isRaise       = false

  switch (action) {
    case 'pasar':
      break
    case 'apostar':
      potDelta           = amount
      newPlayer.chips   -= amount
      newPlayer.contrib += amount
      newCurrentBet      = amount
      isRaise            = true
      break
    case 'igualar':
      potDelta           = toCall
      newPlayer.chips   -= toCall
      newPlayer.contrib  = currentBet
      break
    case 'subir': {
      const newBet      = currentBet + amount
      const toPut       = newBet - player.contrib
      potDelta           = toPut
      newPlayer.chips   -= toPut
      newPlayer.contrib  = newBet
      newCurrentBet      = newBet
      isRaise            = true
      break
    }
    case 'retirarse':
      newPlayer.folded = true
      break
  }

  // CLAMP DURO: garantía matemática de que el saldo jamás sea < 0 por ninguna
  // ruta (presente o futura). Con las guardas de arriba no debería activarse.
  newPlayer.chips = Math.max(0, newPlayer.chips)

  pot += potDelta
  let newPlayers = state.players.map((p, i) => i === playerIndex ? newPlayer : p)

  // After raise: all other active players must act again
  if (isRaise) {
    newPlayers = newPlayers.map((p, i) =>
      i === playerIndex || p.folded ? p : { ...p, acted: false }
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
      case 'retirarse': message = h ? 'Te retiras. La IA gana el pozo.'         : '¡La IA se retira! Ganaste el pozo.'; break
    }
  } else {
    const n = player.name
    switch (action) {
      case 'pasar':     message = `${n} pasa.`; break
      case 'apostar':   message = `${n} apuesta ${amount}.`; break
      case 'igualar':   message = `${n} iguala a ${currentBet}.`; break
      case 'subir':     message = `${n} sube a ${newCurrentBet}.`; break
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
    return elim
      ? { ...p, cards: [], contrib: 0, acted: false, folded: true,  score: null, eliminated: true }
      : { ...p, cards: [], contrib: 0, acted: false, folded: false, score: null }
  })
  const alive = countAlive(players)
  const eliminatedNames = players.filter((p, i) => p.eliminated && !prevElim[i]).map(p => p.name)

  // ── PASO 4: condiciones terminales (antes de repartir) ──────────────────────
  if (alive <= 1) {
    const winnerSeat = players.findIndex(p => !p.eliminated)
    const humanWon   = winnerSeat === 0
    return {
      ...state, players, aliveCount: alive, eliminatedNames,
      phase: PHASES.GAME_OVER, pot: 0, currentBet: 0, winner: winnerSeat >= 0 ? winnerSeat : null,
      message: winnerSeat < 0
        ? 'Mesa terminada.'
        : humanWon
          ? '¡Ganaste la mesa! Eres el último con fichas.'
          : `${players[winnerSeat].name} gana la mesa. Te quedaste sin fichas.`,
    }
  }
  if (players[0].eliminated) {   // humano sin fichas con ≥2 vivos → stop básico
    return {
      ...state, players, aliveCount: alive, eliminatedNames,
      phase: PHASES.GAME_OVER, pot: 0, currentBet: 0, winner: null,
      message: 'Te quedaste sin fichas.',
    }
  }

  // ── PASO 3: rotación Mano/Pie entre vivos (índices estables) ────────────────
  const newPieIndex  = state.handCount === 0 ? state.pieIndex : nextAliveIndex(players, state.pieIndex)
  const newManoIndex = nextAliveIndex(players, newPieIndex)

  // Cobro de antes (todos los vivos pueden pagar; eliminados no participan)
  let pot = 0
  players = players.map(p => {
    if (p.eliminated) return p
    pot += unit
    return { ...p, chips: p.chips - unit }
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
    eliminatedNames,
    pot,
    currentBet:        0,
    activePlayerIndex: newManoIndex,
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
    return { ...state, phase: PHASES.BET_1, message: msg }
  }
  if (state.phase === PHASES.DEAL_3) {
    const msg = state.numPlayers === 2
      ? (manoIsHuman ? 'A las 3 — Tu turno.' : 'A las 3 — IA pensando...')
      : `A las 3 — ${state.players[state.manoIndex].name} abre.`
    return { ...state, phase: PHASES.BET_2, message: msg }
  }
  return state
}

// Called by GameTable for human player's bet action.
export function applyPlayerBetAction(state, action, betAmount) {
  return applyBetAction(state, 0, action, betAmount)   // human is always seat 0
}

// Called by GameTable to auto-advance AI turn(s).
export function applyAIBetAction(state) {
  const aiIndex  = state.activePlayerIndex
  const decision = decideBetAction(state, aiIndex)
  return applyBetAction(state, aiIndex, decision.action, state.unit)
}

// Discard phase: replenish cards in Mano→Pie order, then advance to BET_3.
export function applyDiscard(state, humanDiscardIndices) {
  const { players, manoIndex, numPlayers } = state
  const N = players.length
  const ruleN = state.aliveCount ?? numPlayers   // C4.4: límite de descarte según vivos

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

    indices = indices.slice(0, maxDiscard(ruleN))
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

  return {
    ...state,
    phase:             PHASES.BET_3,
    deck:              deckCopy,
    players:           newPlayers.map(p => ({ ...p, contrib: 0, acted: false })),
    selectedDiscards:  [],
    currentBet:        0,
    activePlayerIndex: manoIndex,
    message,
  }
}

// Toggle a card in/out of the discard selection (respects per-table limit).
export function toggleDiscard(state, cardIndex) {
  const selected = [...state.selectedDiscards]
  const pos      = selected.indexOf(cardIndex)
  const limit    = maxDiscard(state.aliveCount ?? state.numPlayers)   // C4.4: según vivos
  if (pos >= 0) {
    selected.splice(pos, 1)
  } else if (selected.length < limit) {
    selected.push(cardIndex)
  }
  return { ...state, selectedDiscards: selected }
}
