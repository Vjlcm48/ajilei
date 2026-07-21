/**
 * TB-1 — Blindaje de la REGLA OFICIAL de parámetros por mano.
 *
 * REGLA OFICIAL:
 *   Los parámetros de una mano (valor del comodín, límite de descarte, ruleN de
 *   puntuación) se CONGELAN en el barajado del Pie, según los jugadores vivos en
 *   la mesa en ese momento. Los retiros (fold) durante la mano NO los alteran
 *   jamás. La eliminación por bancarrota los altera recién en el barajado de la
 *   mano siguiente. Caso todos-se-retiran-menos-uno: gana por abandono, sin
 *   cómputo.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO (diagnóstico CM-2):
 *   Hoy la invariante se cumple por ACCIDENTE, no por garantía estructural:
 *   `aliveCount` solo se escribe en `createInitialState` y en las tres ramas de
 *   `startHand`, así que nada la mueve a mitad de mano. Es una propiedad
 *   emergente de cuatro sitios de escritura, y cualquier tanda futura que añada
 *   un quinto la rompería en silencio. Estos cinco tests convierten esa
 *   propiedad emergente en alarma permanente.
 *
 *   La distinción que vigilan es `folded` (transitorio, por mano) vs
 *   `eliminated` (permanente, por bancarrota). Confundirlas fue la hipótesis
 *   que CM-2 tuvo que refutar por medición; a partir de aquí, si alguien las
 *   confunde, lo dice la suite.
 *
 * La IA se mockea para decidir por asiento, de modo que los folds sean
 * deterministas y pasen por el camino REAL de retiro (`applyBetAction`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const ctl = vi.hoisted(() => ({ foldSeats: new Set() }))

vi.mock('../src/engine/aiPlayer.js', () => ({
  decideBetAction: (_state, seat) =>
    (ctl.foldSeats.has(seat) ? { action: 'retirarse' } : { action: 'pasar' }),
  decideDiscard: () => [],
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
import { createDeck } from '../src/engine/deck.js'

// ── Utilería ────────────────────────────────────────────────────────────────
function playBettingPhase(state, phase) {
  let s = state, cap = 0
  while (s.phase === phase && cap++ < 200) {
    if (s.activePlayerIndex === 0) {
      const action = s.currentBet === (s.players[0]?.contrib ?? 0) ? 'pasar' : 'igualar'
      s = applyPlayerBetAction(s, action)
    } else s = applyAIBetAction(s)
  }
  return s
}

const setChips = (s, seat, chips) =>
  ({ ...s, players: s.players.map((p, i) => (i === seat ? { ...p, chips } : p)) })

const setCards = (s, seat, cards) =>
  ({ ...s, players: s.players.map((p, i) => (i === seat ? { ...p, cards } : p)) })

// La mano real del caso CM-1, que fue el origen de toda esta línea:
// Copas 6+7+4 = 23 · comodín (7 de Oros) = 11 → 34 con mesa de 5.
const DECK = createDeck()
const carta = (value, palo) => DECK.find(c => c.value === value && c.palo === palo)
const MANO_CM1 = () => [
  carta(6, 'Copas'), carta(7, 'Oros'), carta(7, 'Copas'), carta(4, 'Copas'), carta(5, 'Bastos'),
]

beforeEach(() => { ctl.foldSeats = new Set() })

// ── 1 · fold ≠ eliminación ──────────────────────────────────────────────────
describe('TB-1 · fold ≠ eliminación', () => {
  it('dos IAs se retiran en BET_1: aliveCount sigue en 5 y el comodín del humano vale 11', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    expect(s.aliveCount).toBe(5)

    ctl.foldSeats = new Set([3, 4])
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_1)

    // Se retiraron DE LA MANO, no de la mesa.
    expect(s.players[3].folded).toBe(true)
    expect(s.players[4].folded).toBe(true)
    expect(s.players[3].eliminated).toBe(false)
    expect(s.players[4].eliminated).toBe(false)
    expect(s.aliveCount).toBe(5)

    s = advanceFromDeal(s)                 // BET_2 · las 5 cartas ya repartidas
    s = setCards(s, 0, MANO_CM1())
    s = playBettingPhase(s, PHASES.BET_2)
    s = applyDiscard(s, [])
    s = playBettingPhase(s, PHASES.BET_3)

    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.aliveCount).toBe(5)
    // Con ruleN=5 el 7 de Oros sale de su palo y suma 11 al mejor: 23 + 11.
    expect(s.players[0].score.palo).toBe('Copas')
    expect(s.players[0].score.points).toBe(34)
  })
})

// ── 2 · congelación en el barajado ──────────────────────────────────────────
describe('TB-1 · congelación de reglas en el barajado', () => {
  it('aliveCount al cerrar la mano == al barajar, con folds en BET_1, BET_2 y BET_3', () => {
    for (const faseDelFold of [PHASES.BET_1, PHASES.BET_2, PHASES.BET_3]) {
      ctl.foldSeats = new Set()
      let s = createInitialState(10, 5)
      s = startHand(s)
      const alBarajar = s.aliveCount
      expect(alBarajar).toBe(5)

      s = advanceFromDeal(s)
      if (faseDelFold === PHASES.BET_1) ctl.foldSeats = new Set([3, 4])
      s = playBettingPhase(s, PHASES.BET_1)

      s = advanceFromDeal(s)
      if (faseDelFold === PHASES.BET_2) ctl.foldSeats = new Set([3, 4])
      s = playBettingPhase(s, PHASES.BET_2)

      s = applyDiscard(s, [])
      if (faseDelFold === PHASES.BET_3) ctl.foldSeats = new Set([3, 4])
      s = playBettingPhase(s, PHASES.BET_3)

      expect(s.phase).toBe(PHASES.PAYOUT)
      expect(s.players.filter(p => p.folded).length).toBe(2)   // los folds ocurrieron
      expect(s.aliveCount).toBe(alBarajar)                     // y no movieron nada
      expect(s.players.filter(p => p.eliminated).length).toBe(0)
    }
  })
})

// ── 3 · tope de descarte estable ────────────────────────────────────────────
describe('TB-1 · tope de descarte congelado', () => {
  it('un fold en BET_1 no altera el tope vigente al llegar a DISCARD', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    const topeAlBarajar = maxDiscard(s.aliveCount)
    expect(topeAlBarajar).toBe(3)          // mesa de 5 → 3 cartas

    ctl.foldSeats = new Set([3, 4])
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_2)

    expect(s.phase).toBe(PHASES.DISCARD)
    // Si los folds contaran como bajas, aliveCount sería 3 y el tope saltaría a 5.
    expect(maxDiscard(s.aliveCount)).toBe(topeAlBarajar)
    expect(s.message).toContain(`hasta ${topeAlBarajar} cartas`)

    // El tope real se ejerce: intentar marcar 5 cartas deja solo 3.
    for (let i = 0; i < 5; i++) s = toggleDiscard(s, i)
    expect(s.selectedDiscards.length).toBe(topeAlBarajar)
  })
})

// ── 4 · abandono sin cómputo ────────────────────────────────────────────────
describe('TB-1 · abandono', () => {
  it('todos se retiran menos uno: gana por abandono, sin evaluar ninguna mano', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    ctl.foldSeats = new Set([1, 2, 3, 4])
    s = advanceFromDeal(s)
    s = playBettingPhase(s, PHASES.BET_1)

    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.winner).toBe(0)
    expect(s.message).toMatch(/se retiran/)
    // Sin cómputo: ninguna mano fue puntuada.
    expect(s.players.every(p => p.score === null)).toBe(true)
    expect(s.aliveCount).toBe(5)
  })
})

// ── 5 · la bancarrota difiere un barajado ───────────────────────────────────
describe('TB-1 · bancarrota diferida', () => {
  it('quien queda a 0 en la mano N sigue vivo hasta el startHand de N+1', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)                    // ante ya cobrado
    s = setChips(s, 4, 0)               // se queda a cero DURANTE la mano
    ctl.foldSeats = new Set([4])

    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_2)
    s = applyDiscard(s, []); s = playBettingPhase(s, PHASES.BET_3)

    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.players[4].chips).toBe(0)
    expect(s.players[4].eliminated).toBe(false)   // todavía NO
    expect(s.aliveCount).toBe(5)                  // reglas de ESTA mano intactas

    const siguiente = startHand(s)                // el barajado siguiente sí lo aplica
    expect(siguiente.players[4].eliminated).toBe(true)
    expect(siguiente.aliveCount).toBe(4)
    expect(maxDiscard(siguiente.aliveCount)).toBe(5)   // y las reglas se reducen
  })
})
