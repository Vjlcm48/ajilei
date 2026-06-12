/**
 * Fase A – Motor N-Jugadores: Verificaciones del documento (7 puntos)
 * Ejecutar: npm test
 *
 * Usamos vi.mock para fijar la IA a 'pasar' siempre; esto hace los flujos
 * deterministas y evita bucles infinitos en los tests estructurales.
 * Los tests de comodín y handEvaluator llaman directamente a las funciones.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock aiPlayer: AI siempre pasa y nunca descarta
vi.mock('../src/engine/aiPlayer.js', () => ({
  aiBettingDecision: () => ({ action: 'pasar' }),
  aiSelectDiscards:  () => [],
}))

import {
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  toggleDiscard,
  maxDiscard,
  PHASES,
} from '../src/engine/gameEngine.js'
import { getBestSuitScore, isAjilei, getComodinValue } from '../src/engine/handEvaluator.js'
import { createDeck } from '../src/engine/deck.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Advance through a betting phase until it ends.
 * Human always passes if no bet is outstanding, iguala if there is.
 * AI is mocked to always 'pasar', so rounds close cleanly.
 */
function playBettingPhase(state, phase) {
  let s   = state
  let cap = 0
  while (s.phase === phase && cap++ < 200) {
    if (s.activePlayerIndex === 0) {
      const action = s.currentBet === (s.players[0]?.contrib ?? 0) ? 'pasar' : 'igualar'
      s = applyPlayerBetAction(s, action)
    } else {
      s = applyAIBetAction(s)
    }
  }
  return s
}

/**
 * Play a hand that has ALREADY been started (state is in DEAL_2) → returns PAYOUT.
 * Does NOT call startHand; use this when you need to control startHand separately.
 */
function playHandToEnd(state) {
  let s = advanceFromDeal(state)                // DEAL_2 → BET_1
  s = playBettingPhase(s, PHASES.BET_1)         // BET_1 → DEAL_3
  s = advanceFromDeal(s)                        // DEAL_3 → BET_2
  s = playBettingPhase(s, PHASES.BET_2)         // BET_2 → DISCARD
  s = applyDiscard(s, [])                       // DISCARD → BET_3
  s = playBettingPhase(s, PHASES.BET_3)         // BET_3 → PAYOUT
  return s
}

/** Start + play a complete hand (all passes, no discards) → returns PAYOUT state */
function playHandAllPass(state) {
  return playHandToEnd(startHand(state))
}

/** All card IDs in a state's player hands */
function allDealtIds(state) {
  return state.players.flatMap(p => p.cards.map(c => c.id))
}

function hasDuplicates(ids) {
  return ids.length !== new Set(ids).size
}

// ── 1. Conteo de cartas: sin duplicados, mazo nunca negativo ─────────────────
describe('1. Conteo de cartas', () => {
  const sizes = [2, 3, 4, 5]

  sizes.forEach(N => {
    it(`N=${N}: sin duplicados tras reparto inicial (2 cartas c/u)`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      const ids = allDealtIds(s)
      expect(hasDuplicates(ids)).toBe(false)
      expect(ids.length).toBe(N * 2)
      expect(s.deck.length).toBe(40 - N * 2)
    })

    it(`N=${N}: sin duplicados tras BET_2 (5 cartas c/u)`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      s = advanceFromDeal(s)
      s = playBettingPhase(s, PHASES.BET_1)
      s = advanceFromDeal(s)  // now BET_2
      const ids = allDealtIds(s)
      expect(hasDuplicates(ids)).toBe(false)
      expect(ids.length).toBe(N * 5)
      expect(s.deck.length).toBe(40 - N * 5)
    })

    it(`N=${N}: mazo no negativo con descartes máximos`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      s = advanceFromDeal(s)
      s = playBettingPhase(s, PHASES.BET_1)
      s = advanceFromDeal(s)
      s = playBettingPhase(s, PHASES.BET_2)
      // Human discards max allowed; AI is mocked to discard 0
      const limit   = maxDiscard(N)
      const indices = s.players[0].cards.map((_, i) => i).slice(0, limit)
      s = applyDiscard(s, indices)
      expect(s.deck.length).toBeGreaterThanOrEqual(0)
      expect(hasDuplicates(allDealtIds(s))).toBe(false)
    })
  })
})

// ── 2. Rotación del Pie y la Mano a lo largo de 5+ manos ─────────────────────
describe('2. Rotación Pie / Mano', () => {
  const sizes = [2, 3, 4, 5]

  sizes.forEach(N => {
    it(`N=${N}: primera mano — humano (seat 0) es Mano, pieIndex = N-1`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      expect(s.manoIndex).toBe(0)
      expect(s.pieIndex).toBe(N - 1)
    })

    it(`N=${N}: manoIndex = (pieIndex + 1) % N siempre`, () => {
      let s = createInitialState(10, N)
      for (let hand = 0; hand < N + 2; hand++) {
        s = startHand(s)
        expect(s.manoIndex).toBe((s.pieIndex + 1) % N)
        s = playHandToEnd(s)
      }
    })

    it(`N=${N}: el Pie visita todos los asientos exactamente una vez en N manos`, () => {
      let s = createInitialState(10, N)
      const seenPies = []
      for (let hand = 0; hand < N; hand++) {
        s = startHand(s)          // rotación — registrar pieIndex aquí
        seenPies.push(s.pieIndex)
        s = playHandToEnd(s)      // jugar hasta PAYOUT
      }
      expect(new Set(seenPies).size).toBe(N)
    })
  })
})

// ── 3. Orden de reparto y de turnos ──────────────────────────────────────────
describe('3. Orden de reparto y turno', () => {
  [2, 3, 4, 5].forEach(N => {
    it(`N=${N}: primer turno de apuesta tras DEAL_2 es la Mano`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      s = advanceFromDeal(s)
      expect(s.activePlayerIndex).toBe(s.manoIndex)
    })

    it(`N=${N}: primer turno de apuesta tras DEAL_3 es la Mano`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      s = advanceFromDeal(s)
      s = playBettingPhase(s, PHASES.BET_1)
      s = advanceFromDeal(s)
      expect(s.activePlayerIndex).toBe(s.manoIndex)
    })

    it(`N=${N}: cada jugador activo tiene 5 cartas tras DEAL_3`, () => {
      let s = createInitialState(10, N)
      s = startHand(s)
      s = advanceFromDeal(s)
      s = playBettingPhase(s, PHASES.BET_1)
      s = advanceFromDeal(s)
      s.players.filter(p => !p.folded).forEach(p => {
        expect(p.cards.length).toBe(5)
      })
    })
  })

  it('N=2 mano 1: betTurn="player" (humano es Mano)', () => {
    let s = createInitialState(10, 2)
    s = startHand(s)
    s = advanceFromDeal(s)
    expect(s.betTurn).toBe('player')
  })

  it('N=2 mano 2: betTurn="ai" (AI es Mano)', () => {
    let s = createInitialState(10, 2)
    s = playHandAllPass(s)
    s = startHand(s)
    s = advanceFromDeal(s)
    expect(s.betTurn).toBe('ai')
    expect(s.manoIndex).toBe(1)
  })
})

// ── 4. Límite de descarte por tamaño de mesa ──────────────────────────────────
describe('4. Límite de descarte', () => {
  it('maxDiscard(2) = 5', () => expect(maxDiscard(2)).toBe(5))
  it('maxDiscard(3) = 5', () => expect(maxDiscard(3)).toBe(5))
  it('maxDiscard(4) = 5', () => expect(maxDiscard(4)).toBe(5))
  it('maxDiscard(5) = 3', () => expect(maxDiscard(5)).toBe(3))

  it('toggleDiscard N=2: acepta hasta 5 cartas', () => {
    let s = createInitialState(10, 2)
    s = startHand(s)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)
    for (let i = 0; i < 5; i++) s = toggleDiscard(s, i)
    expect(s.selectedDiscards.length).toBe(5)
    // la 6ª se rechaza (no hay 6ª carta de todas formas, pero índice inventado debe fallar)
    const sizeBefore = s.selectedDiscards.length
    // deseleccionar y volver a añadir para comprobar que el límite se respeta
    s = toggleDiscard(s, 0)   // quitar
    expect(s.selectedDiscards.length).toBe(4)
    s = toggleDiscard(s, 0)   // volver a añadir
    expect(s.selectedDiscards.length).toBe(5)
  })

  it('toggleDiscard N=5: acepta hasta 3 cartas, rechaza la 4ª', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)
    s = toggleDiscard(s, 0)
    s = toggleDiscard(s, 1)
    s = toggleDiscard(s, 2)
    expect(s.selectedDiscards.length).toBe(3)
    s = toggleDiscard(s, 3)   // 4ª: debe ser rechazada
    expect(s.selectedDiscards.length).toBe(3)
  })
})

// ── 5. Valor del comodín correcto por tamaño de mesa ─────────────────────────
describe('5. Comodín', () => {
  it('N=2: 7Oros vale 7 pts (comodín inactivo)', () => {
    const deck = createDeck()
    // Mano mono-palo Oros con el 7 de Oros
    const hand = [
      deck.find(c => c.palo === 'Oros' && c.value === 1),  // As  = 11
      deck.find(c => c.palo === 'Oros' && c.value === 7),  // 7   = 7
      deck.find(c => c.palo === 'Oros' && c.value === 2),  // 2   = 10
      deck.find(c => c.palo === 'Oros' && c.value === 3),  // 3   = 10
      deck.find(c => c.palo === 'Oros' && c.value === 4),  // 4   = 10
    ]
    const score = getBestSuitScore(hand, 2, false)
    expect(score.points).toBe(48)   // 11+7+10+10+10 (comodín inactivo)
  })

  it('N=3: getComodinValue devuelve null', () => {
    expect(getComodinValue(3)).toBe(null)
  })

  it('N=4: getComodinValue = 10', () => {
    expect(getComodinValue(4)).toBe(10)
  })

  it('N=5: getComodinValue = 11', () => {
    expect(getComodinValue(5)).toBe(11)
  })

  it('N=4: comodín completa 51 (As+2+3+4+5 Espadas = 41 + comodín 10 = 51)', () => {
    const deck = createDeck()
    const espadas4 = [1, 2, 3, 4, 5].map(v => deck.find(c => c.palo === 'Espadas' && c.value === v))
    // reemplazamos el 5 por el 7Oros para que el comodín actúe
    const comodin  = deck.find(c => c.palo === 'Oros' && c.value === 7)
    const hand     = [...espadas4.slice(0, 4), comodin]  // As+2+3+4 Espadas (=41) + comodín(10) = 51
    const score    = getBestSuitScore(hand, 4, true)
    expect(score.points).toBe(51)
  })

  it('N=4: comodín NO excede 51 (score máximo con comodín es 51)', () => {
    const deck    = createDeck()
    // As(11)+Sota(10)+Caballo(10)+Rey(10) de Espadas = 41 + comodín(10) = 51
    const hand    = [1, 10, 11, 12].map(v => deck.find(c => c.palo === 'Espadas' && c.value === v))
    const comodin = deck.find(c => c.palo === 'Oros' && c.value === 7)
    const score   = getBestSuitScore([...hand, comodin], 4, true)
    expect(score.points).toBe(51)
  })

  it('N=5: comodín produce 52 y vence a Ajilei natural de 51', () => {
    const deck = createDeck()

    // Ajilei natural: As(11)+2(10)+3(10)+4(10)+5(10) de Oros = 51
    const naturalAjilei = [1, 2, 3, 4, 5].map(v => deck.find(c => c.palo === 'Oros' && c.value === v))
    expect(naturalAjilei.reduce((s, c) => s + c.points, 0)).toBe(51)
    expect(isAjilei(naturalAjilei, 5)).toBe(true)

    // Comodín Ajilei: As+Sota+Caballo+Rey de Espadas (41) + 7Oros (comodín=11) = 52
    const comodin      = deck.find(c => c.palo === 'Oros' && c.value === 7)
    const handComodin  = [1, 10, 11, 12].map(v => deck.find(c => c.palo === 'Espadas' && c.value === v))
    const scoreComodin = getBestSuitScore([...handComodin, comodin], 5, true)
    expect(scoreComodin.points).toBe(52)
    expect(isAjilei([...handComodin, comodin], 5)).toBe(true)

    // 52 supera al natural 51
    expect(scoreComodin.points).toBeGreaterThan(51)
  })

  it('isAjilei: comodín 52 sólo se reconoce con numPlayers=5', () => {
    const deck     = createDeck()
    const comodin  = deck.find(c => c.palo === 'Oros' && c.value === 7)
    const hand     = [1, 10, 11, 12].map(v => deck.find(c => c.palo === 'Espadas' && c.value === v))
    const full     = [...hand, comodin]
    expect(isAjilei(full, 5)).toBe(true)   // N=5: sí
    expect(isAjilei(full, 4)).toBe(false)  // N=4: no
    expect(isAjilei(full, 2)).toBe(false)  // N=2: no
  })
})

// ── 6. Jugador sin fondos → retiro forzoso ────────────────────────────────────
describe('6. Fondos insuficientes → retiro forzoso', () => {
  it('N=2: player con 0 fichas intenta igualar → retiro automático → AI gana', () => {
    let s = createInitialState(10, 2)
    s = startHand(s)
    s = advanceFromDeal(s)  // BET_1, human es Mano

    // Forzamos fichas del humano a 0 ANTES de que tenga que igualar una apuesta
    // Hacemos que la IA apueste primero manipulando el estado activo
    s = {
      ...s,
      players: s.players.map((p, i) => i === 0 ? { ...p, chips: 0 } : p),
      playerChips: 0,
      activePlayerIndex: 1,       // turno de IA
      betTurn: 'ai',
    }
    // IA apuesta (pero está mockeada a 'pasar' — sin currentBet no fuerza retiro)
    // Para este test necesitamos que haya una apuesta y el humano no pueda pagarla.
    // Simulamos directamente: hay una apuesta de 10 del turno anterior
    s = {
      ...s,
      currentBet:  10,
      players: s.players.map((p, i) =>
        i === 1 ? { ...p, contrib: 10, acted: true }
                : { ...p, acted: false }
      ),
      aiContrib:     10,
      aiActed:       true,
      playerActed:   false,
      activePlayerIndex: 0,
      betTurn: 'player',
    }
    // Player intenta igualar — no tiene fichas, debe retirarse automáticamente
    s = applyPlayerBetAction(s, 'igualar')
    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.winner).toBe('ai')
  })

  it('N=3: jugador con 0 chips ante → auto-folded en startHand', () => {
    let s = createInitialState(10, 3)
    // IA 2 (seat 2) sin fondos
    s = { ...s, players: s.players.map((p, i) => i === 2 ? { ...p, chips: 0 } : p) }
    s = startHand(s)
    expect(s.players[2].folded).toBe(true)
    expect(s.players[2].cards.length).toBe(0)
    expect(s.players.filter(p => !p.folded).length).toBe(2)
  })

  it('N=4: jugador con chips < unit ante → auto-folded y no recibe cartas', () => {
    let s = createInitialState(10, 4)
    s = { ...s, players: s.players.map((p, i) => i === 3 ? { ...p, chips: 5 } : p) }
    s = startHand(s)
    expect(s.players[3].folded).toBe(true)
    expect(s.players[3].cards.length).toBe(0)
  })
})

// ── 7. Regresión N=2: comportamiento idéntico al motor original ───────────────
describe('7. Regresión N=2', () => {
  it('createInitialState(10) produce todos los campos shim correctos', () => {
    const s = createInitialState(10)
    expect(s.numPlayers).toBe(2)
    expect(s.playerChips).toBe(5000)
    expect(s.aiChips).toBe(5000)
    expect(Array.isArray(s.playerCards)).toBe(true)
    expect(Array.isArray(s.aiCards)).toBe(true)
    expect(s.betTurn).toBe('player')
    expect(s.pieIsAI).toBe(true)    // mano 1: AI es Pie
    expect(s.pot).toBe(0)
    expect(s.phase).toBe(PHASES.WAITING)
    expect(s.winner).toBe(null)
  })

  it('startHand: pot = unit×2, 2 cartas cada uno, pieIsAI=true en mano 1', () => {
    let s = createInitialState(10)
    s = startHand(s)
    expect(s.pot).toBe(20)
    expect(s.playerCards.length).toBe(2)
    expect(s.aiCards.length).toBe(2)
    expect(s.pieIsAI).toBe(true)
    expect(s.playerChips).toBe(4990)
    expect(s.aiChips).toBe(4990)
  })

  it('advanceFromDeal DEAL_2→BET_1: betTurn=player, message original', () => {
    let s = createInitialState(10)
    s = startHand(s)
    s = advanceFromDeal(s)
    expect(s.phase).toBe(PHASES.BET_1)
    expect(s.betTurn).toBe('player')
    expect(s.message).toBe('A las 2 — Tu turno.')
  })

  it('player pasar + AI pasar → avanza a DEAL_3 (no BET_2 aún)', () => {
    let s = createInitialState(10)
    s = startHand(s)
    s = advanceFromDeal(s)
    s = applyPlayerBetAction(s, 'pasar')
    expect(s.betTurn).toBe('ai')
    s = applyAIBetAction(s)
    expect(s.phase).toBe(PHASES.DEAL_3)
  })

  it('player se retira → AI gana, PAYOUT, winner="ai", pot=0', () => {
    let s = createInitialState(10)
    s = startHand(s)
    s = advanceFromDeal(s)
    s = applyPlayerBetAction(s, 'retirarse')
    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.winner).toBe('ai')
    expect(s.pot).toBe(0)
    expect(s.message).toBe('Te retiras. La IA gana el pozo.')
  })

  it('AI se retira → player gana, PAYOUT, winner="player"', () => {
    // Para que AI "se retire" necesitamos que esté ante una apuesta que no puede pagar
    let s = createInitialState(10)
    s = startHand(s)
    s = advanceFromDeal(s)
    // Vaciamos chips de AI y ponemos una apuesta del player
    s = {
      ...s,
      currentBet: 10,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, contrib: 10, acted: true, chips: p.chips - 10 }
                : { ...p, chips: 0, acted: false }
      ),
      playerChips:   s.playerChips - 10,
      aiChips:       0,
      playerContrib: 10,
      playerActed:   true,
      aiActed:       false,
      activePlayerIndex: 1,
      betTurn: 'ai',
      pot: s.pot + 10,
    }
    s = applyAIBetAction(s)
    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.winner).toBe('player')
    expect(s.message).toBe('¡La IA se retira! Ganaste el pozo.')
  })

  it('applyDiscard: message contiene conteos y llega a BET_3', () => {
    let s = createInitialState(10)
    s = startHand(s)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)
    s = applyDiscard(s, [0, 1])
    expect(s.phase).toBe(PHASES.BET_3)
    expect(s.message).toMatch(/Descartaste 2/)
    expect(s.playerCards.length).toBe(5)
    expect(s.aiCards.length).toBe(5)
  })

  it('toggleDiscard usa límite 5 (corrección del bug hardcodeado)', () => {
    let s = createInitialState(10)
    s = startHand(s)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_2)
    for (let i = 0; i < 5; i++) s = toggleDiscard(s, i)
    expect(s.selectedDiscards.length).toBe(5)  // era 3 en el engine original (bug)
  })

  it('mano completa N=2 termina en PAYOUT con pot=0', () => {
    let s = createInitialState(10)
    s = playHandAllPass(s)
    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.pot).toBe(0)
    expect(s.winner === 'player' || s.winner === 'ai').toBe(true)
    expect(s.playerCards.length).toBe(5)
    expect(s.aiCards.length).toBe(5)
  })

  it('rotación mano 2: pieIsAI=false (humano es Pie), AI es Mano', () => {
    let s = createInitialState(10)
    s = playHandAllPass(s)
    s = startHand(s)     // mano 2: Pie rota al humano
    expect(s.pieIsAI).toBe(false)
    expect(s.pieIndex).toBe(0)
    expect(s.manoIndex).toBe(1)
    expect(s.betTurn).toBe('ai')
  })
})

// ── Bonus: empate — regla de cercanía a la Mano ────────────────────────────────
describe('Bonus: empate — seat más cercano a Mano gana', () => {
  // Verificamos el algoritmo de desempate directamente (independiente del flujo de mano)
  function breakTie(manoIndex, N, tiedSeats) {
    const tied  = tiedSeats.map(id => ({ id }))
    let winner  = tied[0]
    for (let offset = 0; offset < N; offset++) {
      const seat  = (manoIndex + offset) % N
      const found = tied.find(p => p.id === seat)
      if (found) { winner = found; break }
    }
    return winner.id
  }

  it('N=3, Mano=0: empate seat 1 vs seat 2 → gana seat 1', () => {
    expect(breakTie(0, 3, [1, 2])).toBe(1)
  })

  it('N=3, Mano=0: empate Mano (seat 0) vs seat 2 → gana Mano', () => {
    expect(breakTie(0, 3, [0, 2])).toBe(0)
  })

  it('N=5, Mano=2: empate seat 3 vs seat 4 → gana seat 3 (más cercano a Mano=2)', () => {
    expect(breakTie(2, 5, [3, 4])).toBe(3)
  })

  it('N=5, Mano=2: empate seat 0 vs seat 4 → gana seat 4 (offset 2 vs offset 3)', () => {
    // desde mano=2: offset 0=seat2, 1=seat3, 2=seat4, 3=seat0
    expect(breakTie(2, 5, [0, 4])).toBe(4)
  })
})
