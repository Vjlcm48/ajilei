/**
 * Tanda C4.4 — La mesa se encoge según jugadores vivos.
 * Tests deterministas del núcleo: eliminación permanente, conteo de vivos
 * enrutado a las reglas, rotación entre vivos y condiciones terminales.
 * IA mockeada a 'pasar' / no-descartar para flujos deterministas.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/engine/aiPlayer.js', () => ({
  decideBetAction: () => ({ action: 'pasar' }),
  decideDiscard:   () => [],
}))

import {
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  toggleDiscard,
  PHASES,
} from '../src/engine/gameEngine.js'
import { createDeck } from '../src/engine/deck.js'
import { effectiveLayout, livingRivalsInDisplayOrder, SEAT_LAYOUTS } from '../src/config/seatLayouts.js'

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

// Juega una mano ya iniciada (DEAL_2) hasta PAYOUT
function playToPayout(s) {
  s = advanceFromDeal(s)
  s = playBettingPhase(s, PHASES.BET_1)
  if (s.phase === PHASES.PAYOUT) return s
  s = advanceFromDeal(s)
  s = playBettingPhase(s, PHASES.BET_2)
  if (s.phase === PHASES.PAYOUT) return s
  s = applyDiscard(s, [])
  s = playBettingPhase(s, PHASES.BET_3)
  return s
}

const setChips = (s, seat, chips) =>
  ({ ...s, players: s.players.map((p, i) => (i === seat ? { ...p, chips } : p)) })

// ── PASO 1: eliminación permanente ──────────────────────────────────────────
describe('C4.4 · Eliminación permanente', () => {
  it('chips < unit en startHand → eliminated + folded, sin cartas, aliveCount baja', () => {
    let s = createInitialState(10, 5)
    s = setChips(s, 2, 5)
    s = startHand(s)
    expect(s.players[2].eliminated).toBe(true)
    expect(s.players[2].folded).toBe(true)
    expect(s.players[2].cards.length).toBe(0)
    expect(s.aliveCount).toBe(4)
  })

  it('un eliminado NO vuelve aunque recupere fichas', () => {
    let s = createInitialState(10, 4)
    s = setChips(s, 3, 0)
    s = startHand(s)
    expect(s.players[3].eliminated).toBe(true)
    s = playToPayout(s)
    expect(s.phase).toBe(PHASES.PAYOUT)
    s = setChips(s, 3, 5000)     // le "devolvemos" fichas
    s = startHand(s)
    expect(s.players[3].eliminated).toBe(true)
    expect(s.players[3].cards.length).toBe(0)
  })

  it('el eliminado no recibe cartas; los vivos reciben 2', () => {
    let s = createInitialState(10, 5)
    s = setChips(s, 1, 0)
    s = startHand(s)
    expect(s.players[1].cards.length).toBe(0)
    s.players.filter(p => !p.eliminated).forEach(p => expect(p.cards.length).toBe(2))
    expect(s.aliveCount).toBe(4)
  })
})

// ── PASO 2: conteo de vivos enrutado a reglas ───────────────────────────────
describe('C4.4 · Reglas siguen al conteo de vivos', () => {
  it('mesa de 5 intacta → descarte máximo 3', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    expect(s.aliveCount).toBe(5)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)
    for (let i = 0; i < 4; i++) s = toggleDiscard(s, i)
    expect(s.selectedDiscards.length).toBe(3)  // 5 vivos → tope 3
  })

  it('mesa de 5 reducida a 4 vivos → descarte máximo 5', () => {
    let s = createInitialState(10, 5)
    s = setChips(s, 4, 0)
    s = startHand(s)
    expect(s.aliveCount).toBe(4)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)
    for (let i = 0; i < 5; i++) s = toggleDiscard(s, i)
    expect(s.selectedDiscards.length).toBe(5)  // 4 vivos → tope 5
  })

  it('comodín se APAGA bajo 4 vivos: 7-Oros puntúa como carta normal (48, no 51)', () => {
    let s = createInitialState(10, 5)
    s = setChips(s, 2, 0); s = setChips(s, 3, 0); s = setChips(s, 4, 0)
    s = startHand(s)
    expect(s.aliveCount).toBe(2)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s)   // BET_2: 5 cartas repartidas
    // Fijar mano del humano: As+2+3+4 + 7 de Oros (mismo palo)
    const deck = createDeck()
    const oros = v => deck.find(c => c.palo === 'Oros' && c.value === v)
    const hand = [oros(1), oros(2), oros(3), oros(4), oros(7)]
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, cards: hand } : p)) }
    s = playBettingPhase(s, PHASES.BET_2)
    s = applyDiscard(s, [])
    s = playBettingPhase(s, PHASES.BET_3)
    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.players[0].score.points).toBe(48)  // comodín inactivo (con bono sería 51)
  })

  it('comodín ACTIVO con 4 vivos: 7-Oros como comodín=10 → 51', () => {
    let s = createInitialState(10, 5)
    s = setChips(s, 4, 0)        // 5 → 4 vivos
    s = startHand(s)
    expect(s.aliveCount).toBe(4)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s)
    const deck = createDeck()
    const oros = v => deck.find(c => c.palo === 'Oros' && c.value === v)
    const hand = [oros(1), oros(2), oros(3), oros(4), oros(7)]  // 41 (sin 7) + comodín 10 = 51
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, cards: hand } : p)) }
    s = playBettingPhase(s, PHASES.BET_2)
    s = applyDiscard(s, [])
    s = playBettingPhase(s, PHASES.BET_3)
    expect(s.players[0].score.points).toBe(51)
  })
})

// ── PASO 3: rotación entre vivos (índice intermedio) ────────────────────────
describe('C4.4 · Rotación Mano/Pie entre vivos', () => {
  it('salta un asiento eliminado intermedio; Mano/Pie nunca caen en él', () => {
    let s = createInitialState(10, 4)
    s = setChips(s, 2, 0)          // eliminar el asiento intermedio 2
    s = startHand(s)
    expect(s.players[2].eliminated).toBe(true)
    expect(s.aliveCount).toBe(3)
    const piesVistos = new Set()
    for (let h = 0; h < 6; h++) {
      expect(s.players[s.manoIndex].eliminated).toBe(false)
      expect(s.players[s.pieIndex].eliminated).toBe(false)
      expect(s.manoIndex).not.toBe(2)
      expect(s.pieIndex).not.toBe(2)
      expect(s.players[0].isHuman).toBe(true)  // humano siempre seat 0
      piesVistos.add(s.pieIndex)
      s = playToPayout(s)
      s = startHand(s)
    }
    // El Pie rota entre los 3 vivos {0,1,3}
    expect([...piesVistos].sort().join(',')).toBe('0,1,3')
  })
})

// ── PASO 4: condiciones terminales ──────────────────────────────────────────
describe('C4.4 · Condiciones terminales', () => {
  it('queda 1 vivo (humano) → GAME_OVER con winner=0', () => {
    let s = createInitialState(10, 3)
    s = setChips(s, 1, 0); s = setChips(s, 2, 0)
    s = startHand(s)
    expect(s.phase).toBe(PHASES.GAME_OVER)
    expect(s.winner).toBe(0)
    expect(s.aliveCount).toBe(1)
  })

  it('queda 1 vivo (IA) → GAME_OVER con winner = esa IA', () => {
    let s = createInitialState(10, 3)
    s = setChips(s, 0, 0); s = setChips(s, 1, 0)   // solo seat 2 vivo
    s = startHand(s)
    expect(s.phase).toBe(PHASES.GAME_OVER)
    expect(s.winner).toBe(2)
  })

  // CAMBIO DE VEREDICTO (APU-1 1b, E-11c · normativo §5.4): el humano quebrado
  // con ≥2 vivos YA NO termina la mesa desde el motor. La mesa termina solo con
  // ≤1 vivos, sea quien sea. El caso del humano pasa por la pregunta de recarga
  // forzosa, que es pantalla (1e) y cobra por `aplicarRecarga`.
  it('humano eliminado con ≥2 vivos → la mesa SIGUE, ya no es GAME_OVER', () => {
    let s = createInitialState(10, 3)
    s = setChips(s, 0, 0)
    s = startHand(s)
    expect(s.phase).toBe(PHASES.DEAL_2)
    expect(s.winner).toBe(null)
    expect(s.players[0].eliminated).toBe(true)
    expect(s.aliveCount).toBe(2)
  })
})

// ── PASO 5: layout efectivo (UI) — el tablero se reacomoda a los vivos ───────
describe('C4.4 · Layout efectivo según vivos', () => {
  const mk = elim => elim.map((e, i) => ({ eliminated: e, isHuman: i === 0 }))

  it('mesa de 5 intacta → 5 asientos, humano en bottom', () => {
    const eff = effectiveLayout(mk([false, false, false, false, false]))
    expect(eff[0]).toBe('bottom')
    expect(Object.keys(eff).length).toBe(5)
    expect(Object.values(eff).sort()).toEqual([...SEAT_LAYOUTS[5]].sort())
  })

  it('5 con asiento INTERMEDIO 2 eliminado → layout de 4, seat 2 ausente', () => {
    const eff = effectiveLayout(mk([false, false, true, false, false]))
    expect(eff[2]).toBeUndefined()
    expect(eff[0]).toBe('bottom')
    expect(Object.values(eff).sort()).toEqual([...SEAT_LAYOUTS[4]].sort())
  })

  it('5 reducida a 2 vivos {0,3} → humano bottom, rival a top-center', () => {
    const eff = effectiveLayout(mk([false, true, true, false, true]))
    expect(eff[0]).toBe('bottom')
    expect(eff[3]).toBe('top-center')
    expect(Object.keys(eff).length).toBe(2)
  })

  it('livingRivalsInDisplayOrder excluye eliminados y al humano', () => {
    const rivals = livingRivalsInDisplayOrder(mk([false, false, true, false, false]))
    expect(rivals).not.toContain(0)
    expect(rivals).not.toContain(2)
    expect([...rivals].sort()).toEqual([1, 3, 4])
  })
})
