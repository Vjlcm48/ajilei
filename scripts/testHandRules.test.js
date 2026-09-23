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

// ── 6 · el snapshot en sí (HR-1) ────────────────────────────────────────────
describe('HR-1 · snapshot de reglas congelado', () => {
  it('handRules existe desde el barajado y sus tres valores no cambian en ninguna fase', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)

    // Congelado en el barajado, con los vivos EN LA MESA (5).
    expect(s.handRules).toEqual({ ruleN: 5, comodinValue: 11, maxDiscard: 3 })
    const congelado = JSON.stringify(s.handRules)

    // Se anota el snapshot en cada hito para que un fallo diga EN QUÉ FASE se movió.
    const hitos = []
    const anota = etiqueta => hitos.push([etiqueta, JSON.stringify(s.handRules)])

    anota('tras el barajado')
    ctl.foldSeats = new Set([3, 4])
    s = advanceFromDeal(s);                 anota('BET_1 abierta')
    s = playBettingPhase(s, PHASES.BET_1);  anota('BET_1 cerrada (con 2 folds)')
    s = advanceFromDeal(s);                 anota('BET_2 abierta')
    s = playBettingPhase(s, PHASES.BET_2);  anota('DISCARD')
    s = applyDiscard(s, []);                anota('BET_3 abierta')
    s = playBettingPhase(s, PHASES.BET_3);  anota('PAYOUT')

    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.players.filter(p => p.folded).length).toBe(2)   // los folds ocurrieron de verdad
    for (const [etiqueta, valor] of hitos) {
      expect([etiqueta, valor]).toEqual([etiqueta, congelado])
    }
  })

  it('el barajado siguiente SÍ recalcula el snapshot cuando la mesa se reduce', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    expect(s.handRules).toEqual({ ruleN: 5, comodinValue: 11, maxDiscard: 3 })

    s = setChips(s, 3, 0)
    s = setChips(s, 4, 0)
    const siguiente = startHand(s)
    // 3 vivos → comodín apagado y tope de descarte de mesa chica.
    expect(siguiente.handRules).toEqual({ ruleN: 3, comodinValue: null, maxDiscard: 5 })
  })
})

// ── 5 · la bancarrota difiere un barajado ───────────────────────────────────
describe('TB-1 · bancarrota diferida', () => {
  it('quien queda a 0 en la mano N sigue vivo hasta el startHand de N+1', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)                    // ante ya cobrado
    s = setChips(s, 4, 0)               // se queda a cero DURANTE la mano
    // INTERMITENCIA CAZADA (APU-1 1c, latente desde 1b). El retiro se hacía con
    // el mock —`ctl.foldSeats`—, y desde que `primerTurno`/`nextActiveIndex`
    // saltan a los asientos sin fichas (E-6/E-9 de 1b), al 4 no le llega el
    // turno JAMÁS: el mock no se ejecutaba y el asiento llegaba al showdown vivo
    // y elegible. Como sus cartas son aleatorias, ganaba el pozo de los antes una
    // de cada cinco corridas y la prueba fallaba sin tocar nada. Se retira en el
    // estado, que es lo que la prueba quería decir desde el principio.
    //
    // Lo que esto destapa y NO se arregla aquí: el ante puede dejar una pila en
    // cero sin marcar `allIn` (el motor sólo lo marca en `applyBetAction`), y
    // ese asiento entra en las capas como si pudiera cubrir lo que se aposte
    // después. La cura vive en `startHand`, fuera de los rangos de 1c.
    s = { ...s, players: s.players.map((p, i) => (i === 4 ? { ...p, folded: true } : p)) }
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

// ── 7 · qué fuente MANDA si las dos llegaran a divergir (DSK-U0) ────────────
// Los tests de arriba blindan que `aliveCount` y `handRules` no divergen dentro
// de una mano. Este blinda algo distinto y complementario: SI divergieran, quién
// gobierna. Es la vacuna contra el patrón que DSK-U0 tuvo que sacar de la UI —
// recalcular el tope con `maxDiscard(aliveCount)` en vez de leer el snapshot.
// Mientras las dos fuentes coincidan por construcción, un lector equivocado
// PARECE correcto; sólo fabricando la divergencia se ve que no lo es.
describe('DSK-U0 · el tope que rige es el del snapshot, no el recuento vivo', () => {
  it('con aliveCount y handRules divergentes, la selección se capa por handRules', () => {
    let s = createInitialState(10, 5)
    s = startHand(s)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)

    // Divergencia IMPOSIBLE hoy, fabricada a mano: la mesa diría 3 vivos (tope 5)
    // mientras las reglas congeladas de ESTA mano siguen siendo las de 5 (tope 3).
    const divergente = { ...s, aliveCount: 3 }
    expect(maxDiscard(divergente.aliveCount)).toBe(5)   // lo que diría el recuento vivo
    expect(divergente.handRules.maxDiscard).toBe(3)     // lo que dicen las reglas

    // Selección: manda el snapshot, no el recuento.
    let d = divergente
    for (let i = 0; i < 5; i++) d = toggleDiscard(d, i)
    expect(d.selectedDiscards.length).toBe(3)

    // Y el descarte aplicado también: pedir 5 repone sólo el tope congelado.
    const antes = d.players[0].cards.map(c => `${c.value}-${c.palo}`)
    const tras  = applyDiscard(divergente, [0, 1, 2, 3, 4])
    const ahora = tras.players[0].cards.map(c => `${c.value}-${c.palo}`)
    const cambiadas = ahora.filter((c, i) => c !== antes[i]).length
    expect(cambiadas).toBe(3)
  })

  it('el snapshot está disponible para la UI en la fase de descarte', () => {
    // La capa de presentación lo lee directamente (game.handRules.maxDiscard):
    // si algún día dejara de existir en DISCARD, el aviso pintaría `undefined`.
    let s = createInitialState(10, 5)
    s = startHand(s)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_1)
    s = advanceFromDeal(s); s = playBettingPhase(s, PHASES.BET_2)
    expect(s.phase).toBe(PHASES.DISCARD)
    expect(Number.isInteger(s.handRules.maxDiscard)).toBe(true)
    expect(s.message).toContain(`hasta ${s.handRules.maxDiscard} cartas`)
  })
})
