import { createDeck, shuffleDeck } from './deck'
import { getBestSuitScore, isAjilei } from './handEvaluator'
import { aiBettingDecision, aiSelectDiscards } from './aiPlayer'
import { AJILEI_CONFIG } from '../config/ajileiConfig'

export const PHASES = {
  WAITING:  'WAITING',
  DEAL_2:   'DEAL_2',   // reserved for Step 5 animation
  BET_1:    'BET_1',    // "a las 2"
  DEAL_3:   'DEAL_3',   // reserved for Step 5 animation
  BET_2:    'BET_2',    // "a las 3"
  DISCARD:  'DISCARD',
  BET_3:    'BET_3',    // "al descarte"
  SHOWDOWN: 'SHOWDOWN',
  PAYOUT:   'PAYOUT',
}

export const MIN_BET = AJILEI_CONFIG.betting.apuestaMinima
const DEFAULT_UNIT = AJILEI_CONFIG.betting.entrada

// ≤4 players: up to 5 cards | 5 players: up to 3
export function maxDiscard(numPlayers) {
  return numPlayers <= 4 ? 5 : 3
}

export function createInitialState(unit = DEFAULT_UNIT) {
  return {
    phase: PHASES.WAITING,
    unit,
    pieIsAI: true,
    deck: [],
    playerCards: [],
    aiCards: [],
    pot: 0,
    playerChips: AJILEI_CONFIG.economy.saldoInicial,
    aiChips: AJILEI_CONFIG.economy.saldoInicial,
    currentBet: 0,
    playerContrib: 0,
    aiContrib: 0,
    betTurn: 'player',
    playerActed: false,
    aiActed: false,
    playerFolded: false,
    aiFolded: false,
    selectedDiscards: [],
    winner: null,
    playerScore: null,
    aiScore: null,
    message: '¡Bienvenido a Ajilei!',
    handCount: 0,
  }
}

// Collect ANTE and deal 2 cards each → BET_1
export function startHand(state) {
  const deck = shuffleDeck(createDeck())
  const unit = state.unit
  // Interleaved deal: player card 1, ai card 1, player card 2, ai card 2
  const playerCards = [deck[0], deck[2]]
  const aiCards    = [deck[1], deck[3]]
  return {
    ...state,
    phase: PHASES.DEAL_2,
    deck: deck.slice(4),
    playerCards,
    aiCards,
    pot: unit * 2,
    playerChips: state.playerChips - unit,
    aiChips: state.aiChips - unit,
    currentBet: 0,
    playerContrib: 0,
    aiContrib: 0,
    betTurn: 'player',
    playerActed: false,
    aiActed: false,
    playerFolded: false,
    aiFolded: false,
    selectedDiscards: [],
    winner: null,
    playerScore: null,
    aiScore: null,
    message: 'Repartiendo...',
    handCount: state.handCount + 1,
  }
}

function isRoundOver(playerActed, aiActed, playerContrib, aiContrib) {
  if (!playerActed || !aiActed) return false
  return playerContrib === aiContrib
}

function resolveWinner(state) {
  const { winner, pot, playerChips, aiChips } = state
  let newPlayerChips = playerChips
  let newAiChips = aiChips
  if (winner === 'player') newPlayerChips += pot
  else if (winner === 'ai') newAiChips += pot
  else {
    const half = Math.floor(pot / 2)
    newPlayerChips += half
    newAiChips += pot - half
  }
  return { ...state, phase: PHASES.PAYOUT, pot: 0, playerChips: newPlayerChips, aiChips: newAiChips }
}

function doShowdown(state) {
  const playerAjilei = isAjilei(state.playerCards)
  const aiAjilei = isAjilei(state.aiCards)
  const playerScore = getBestSuitScore(state.playerCards)
  const aiScore = getBestSuitScore(state.aiCards)

  let winner, message

  if (playerAjilei && !aiAjilei) {
    winner = 'player'
    message = '¡AJILEI! Mano perfecta. ¡Ganaste el pozo!'
  } else if (aiAjilei && !playerAjilei) {
    winner = 'ai'
    message = '¡La IA tiene AJILEI! Mano perfecta. Pierdes.'
  } else if (playerAjilei && aiAjilei) {
    winner = 'player'
    message = '¡Ambos con AJILEI! Ganas por ser el mano.'
  } else if (playerScore.points > aiScore.points) {
    winner = 'player'
    message = `¡Ganas! Tu ${playerScore.palo} (${playerScore.points} pts) supera al ${aiScore.palo} de la IA (${aiScore.points} pts).`
  } else if (aiScore.points > playerScore.points) {
    winner = 'ai'
    message = `Pierdes. La IA gana con ${aiScore.palo} (${aiScore.points} pts) vs tu ${playerScore.palo} (${playerScore.points} pts).`
  } else {
    winner = 'player'
    message = `Empate (${playerScore.points} pts). Ganas por ser el mano.`
  }

  return resolveWinner({ ...state, winner, playerScore, aiScore, message })
}

function advanceBettingPhase(state) {
  const base = {
    ...state,
    currentBet: 0,
    playerContrib: 0,
    aiContrib: 0,
    betTurn: 'player',
    playerActed: false,
    aiActed: false,
  }

  if (state.phase === PHASES.BET_1) {
    // Deal 3 more cards each (interleaved: p3, a3, p4, a4, p5, a5)
    // Stop at DEAL_3 — GameTable animates, then calls advanceFromDeal
    const deck = [...base.deck]
    const playerCards = [...base.playerCards, deck[0], deck[2], deck[4]]
    const aiCards    = [...base.aiCards,    deck[1], deck[3], deck[5]]
    return {
      ...base,
      phase: PHASES.DEAL_3,
      deck: deck.slice(6),
      playerCards,
      aiCards,
      message: 'Repartiendo...',
    }
  }

  if (state.phase === PHASES.BET_2) {
    return { ...base, phase: PHASES.DISCARD, message: 'Selecciona hasta 5 cartas a descartar.' }
  }

  if (state.phase === PHASES.BET_3) {
    return doShowdown(base)
  }

  return base
}

export function applyPlayerBetAction(state, action, betAmount) {
  let { pot, playerChips, currentBet, playerContrib, aiContrib, aiActed } = state
  const amount = betAmount || state.unit
  let playerFolded = false
  let message = ''

  const toCall = currentBet - playerContrib
  if (toCall > 0 && playerChips < toCall && action !== 'retirarse') {
    action = 'retirarse'
  }

  switch (action) {
    case 'pasar':
      message = 'Pasas.'
      break
    case 'apostar': {
      playerChips -= amount
      pot += amount
      playerContrib += amount
      currentBet = amount
      message = `Apuestas ${amount} fichas.`
      break
    }
    case 'igualar': {
      playerChips -= toCall
      pot += toCall
      playerContrib = currentBet
      message = `Igualas a ${currentBet}.`
      break
    }
    case 'subir': {
      const newBet = currentBet + amount
      const toPut = newBet - playerContrib
      playerChips -= toPut
      pot += toPut
      playerContrib = newBet
      currentBet = newBet
      aiActed = false
      message = `Subes a ${newBet}.`
      break
    }
    case 'retirarse':
      playerFolded = true
      message = 'Te retiras. La IA gana el pozo.'
      break
  }

  const next = {
    ...state,
    pot, playerChips, currentBet, playerContrib, aiContrib,
    playerActed: true, aiActed, playerFolded, betTurn: 'ai', message,
  }

  if (playerFolded) return resolveWinner({ ...next, winner: 'ai' })
  if (isRoundOver(true, aiActed, playerContrib, aiContrib)) return advanceBettingPhase(next)
  return next
}

export function applyAIBetAction(state) {
  let { pot, aiChips, currentBet, playerContrib, aiContrib, playerActed } = state
  let aiFolded = false
  let message = ''

  const unit = state.unit
  const decision = aiBettingDecision(state.aiCards, currentBet, aiContrib, aiChips, state.phase)

  switch (decision.action) {
    case 'pasar':
      message = 'La IA pasa.'
      break
    case 'apostar': {
      aiChips -= unit
      pot += unit
      aiContrib += unit
      currentBet = unit
      playerActed = false
      message = `La IA apuesta ${unit}. ¿Qué haces?`
      break
    }
    case 'igualar': {
      const toCall = currentBet - aiContrib
      aiChips -= toCall
      pot += toCall
      aiContrib = currentBet
      message = `La IA iguala a ${currentBet}.`
      break
    }
    case 'subir': {
      const newBet = currentBet + unit
      const toPut = newBet - aiContrib
      aiChips -= toPut
      pot += toPut
      aiContrib = newBet
      currentBet = newBet
      playerActed = false
      message = `La IA sube a ${newBet}. ¿Qué haces?`
      break
    }
    case 'retirarse':
      aiFolded = true
      message = '¡La IA se retira! Ganaste el pozo.'
      break
  }

  const next = {
    ...state,
    pot, aiChips, currentBet, playerContrib, aiContrib,
    playerActed, aiActed: true, aiFolded, betTurn: 'player', message,
  }

  if (aiFolded) return resolveWinner({ ...next, winner: 'player' })
  if (isRoundOver(playerActed, true, playerContrib, aiContrib)) return advanceBettingPhase(next)
  return next
}

export function applyDiscard(state, selectedIndices) {
  const deckCopy = [...state.deck]

  const newPlayerCards = state.playerCards.map((card, i) =>
    selectedIndices.includes(i) ? deckCopy.shift() : card
  )

  const aiDiscardIndices = aiSelectDiscards(state.aiCards)
  const newAiCards = state.aiCards.map((card, i) =>
    aiDiscardIndices.includes(i) ? deckCopy.shift() : card
  )

  return {
    ...state,
    phase: PHASES.BET_3,
    deck: deckCopy,
    playerCards: newPlayerCards,
    aiCards: newAiCards,
    selectedDiscards: [],
    currentBet: 0,
    playerContrib: 0,
    aiContrib: 0,
    betTurn: 'player',
    playerActed: false,
    aiActed: false,
    message: `Descartaste ${selectedIndices.length}, la IA descartó ${aiDiscardIndices.length}. Al descarte — Tu turno.`,
  }
}

// Called by GameTable after deal animation completes
export function advanceFromDeal(state) {
  if (state.phase === PHASES.DEAL_2) {
    return { ...state, phase: PHASES.BET_1, message: 'A las 2 — Tu turno.' }
  }
  if (state.phase === PHASES.DEAL_3) {
    return { ...state, phase: PHASES.BET_2, message: 'A las 3 — Tu turno.' }
  }
  return state
}

export function toggleDiscard(state, cardIndex) {
  const selected = [...state.selectedDiscards]
  const pos = selected.indexOf(cardIndex)
  const limit = maxDiscard(2)
  if (pos >= 0) {
    selected.splice(pos, 1)
  } else if (selected.length < limit) {
    selected.push(cardIndex)
  }
  return { ...state, selectedDiscards: selected }
}
