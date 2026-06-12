/**
 * Fase B – IAs Múltiples: Verificaciones del documento (7 puntos)
 * La IA NO está mockeada — estas pruebas ejercen las decisiones reales.
 * Ejecutar: npm test
 */
import { describe, it, expect, beforeEach } from 'vitest'

import {
  decideBetAction,
  decideDiscard,
  initPersonalities,
  getPersonalityName,
  _resetForTesting,
} from '../src/engine/aiPlayer.js'

import {
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  PHASES,
} from '../src/engine/gameEngine.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_PROFILES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

function makeCard(value, palo) {
  const points = value === 1 ? 11 : value === 7 ? 7 : value === 6 ? 6 : 10
  return { id: `${value}-${palo}`, value, palo, points }
}

// Hand: As+2+3+4+6 Oros = 47 pts, same suit, NOT Ajilei (≠ 51)
const STRONG_HAND = [
  makeCard(1,'Oros'), makeCard(2,'Oros'), makeCard(3,'Oros'),
  makeCard(4,'Oros'), makeCard(6,'Oros'),
]

function makeState(overrides = {}) {
  return {
    players: [
      { isHuman: true,  cards: [], chips: 1000, contrib: 0, folded: false },
      { isHuman: false, cards: STRONG_HAND, chips: 1000, contrib: 0, folded: false },
    ],
    currentBet: 0,
    phase: 'BET_3',
    manoIndex: 0,
    pieIndex: 1,
    numPlayers: 2,
    unit: 10,
    handCount: 1,
    pot: 0,
    ...overrides,
  }
}

// Play a betting phase with real AI; human always matches or passes
function simBettingPhase(state, phase) {
  let s = state
  let cap = 0
  while (s.phase === phase) {
    if (++cap > 600) throw new Error(`${phase} no terminó en 600 iteraciones`)
    if (s.activePlayerIndex === 0) {
      const toCall = s.currentBet - (s.players[0]?.contrib ?? 0)
      const action = toCall > 0 ? 'igualar' : 'pasar'
      s = applyPlayerBetAction(s, action)
    } else {
      s = applyAIBetAction(s)
    }
  }
  return s
}

// Play a complete hand (already started at DEAL_2) with real AI
function simHand(state) {
  let s = advanceFromDeal(state)          // DEAL_2 → BET_1
  s = simBettingPhase(s, PHASES.BET_1)
  if (s.phase === PHASES.PAYOUT) return s
  s = advanceFromDeal(s)                  // DEAL_3 → BET_2
  s = simBettingPhase(s, PHASES.BET_2)
  if (s.phase === PHASES.PAYOUT) return s
  s = applyDiscard(s, [])                 // human descarta nada
  s = simBettingPhase(s, PHASES.BET_3)
  return s
}

// ── 1. Asignación de personalidades ───────────────────────────────────────────
describe('1. Asignación de personalidades', () => {
  beforeEach(() => _resetForTesting())

  it('N=5: los 4 perfiles presentes, todos distintos', () => {
    initPersonalities(5)
    const assigned = [1,2,3,4].map(i => getPersonalityName(i))
    expect(new Set(assigned).size).toBe(4)
    assigned.forEach(p => expect(VALID_PROFILES).toContain(p))
  })

  it('N=4: 3 perfiles distintos, ninguno repetido', () => {
    initPersonalities(4)
    const assigned = [1,2,3].map(i => getPersonalityName(i))
    expect(new Set(assigned).size).toBe(3)
    assigned.forEach(p => expect(VALID_PROFILES).toContain(p))
  })

  it('N=3: 2 perfiles distintos, ninguno repetido', () => {
    initPersonalities(3)
    const assigned = [1,2].map(i => getPersonalityName(i))
    expect(new Set(assigned).size).toBe(2)
    assigned.forEach(p => expect(VALID_PROFILES).toContain(p))
  })

  it('N=2: 1 IA, perfil válido', () => {
    initPersonalities(2)
    expect(VALID_PROFILES).toContain(getPersonalityName(1))
  })

  it('10 inicializaciones N=5: siempre 4 perfiles distintos (no hay repetición)', () => {
    for (let run = 0; run < 10; run++) {
      _resetForTesting()
      initPersonalities(5)
      const assigned = [1,2,3,4].map(i => getPersonalityName(i))
      expect(new Set(assigned).size).toBe(4)
      assigned.forEach(p => expect(VALID_PROFILES).toContain(p))
    }
  })

  it('re-sorteo al detectar nueva sesión (handCount regresa a 0)', () => {
    _resetForTesting()
    initPersonalities(3)
    const s1p = [getPersonalityName(1), getPersonalityName(2)]
    expect(s1p[0]).not.toBe(s1p[1])

    // Avanzar _lastHandCount a 3 llamando decideBetAction con handCount=3
    const cards2 = [makeCard(1,'Oros'), makeCard(2,'Oros')]
    const stateH3 = {
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: cards2, chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: cards2, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'BET_1', manoIndex: 0, pieIndex: 2,
      numPlayers: 3, unit: 10, handCount: 3, pot: 0,
    }
    decideBetAction(stateH3, 1)  // _lastHandCount → 3

    // Nueva sesión: handCount vuelve a 0 → debe re-inicializar
    decideBetAction({ ...stateH3, handCount: 0 }, 1)

    const s2p = [getPersonalityName(1), getPersonalityName(2)]
    s2p.forEach(p => expect(VALID_PROFILES).toContain(p))
    expect(s2p[0]).not.toBe(s2p[1])  // sin repetición en la nueva sesión
  })

  it('100 sorteos N=5: los 4 perfiles aparecen y nunca se repiten en la misma mesa', () => {
    const seen = new Set()
    for (let i = 0; i < 100; i++) {
      _resetForTesting()
      initPersonalities(5)
      const assigned = [1,2,3,4].map(idx => getPersonalityName(idx))
      // Sin repetición en esta mesa
      expect(new Set(assigned).size).toBe(4)
      assigned.forEach(p => seen.add(p))
    }
    // Tras 100 sorteos, los 4 perfiles deben haber aparecido
    expect(seen.size).toBe(4)
  })
})

// ── 2. Aislamiento: las funciones de decisión no leen cartas ajenas ───────────
describe('2. Aislamiento de información', () => {
  function makeTrapPlayer(fields = {}) {
    const base = { isHuman: true, chips: 500, contrib: 0, folded: false, cards: [], ...fields }
    return new Proxy(base, {
      get(target, prop) {
        if (prop === 'cards') base.__cardsAccessed = true
        return target[prop]
      }
    })
  }

  it('decideBetAction (N=2): no accede a .cards del jugador humano (asiento 0)', () => {
    const trap = makeTrapPlayer()
    const state = {
      players: [
        trap,
        { isHuman: false, cards: STRONG_HAND, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 10, phase: 'BET_3', manoIndex: 0, pieIndex: 1,
      numPlayers: 2, unit: 10, handCount: 1, pot: 0,
    }
    decideBetAction(state, 1)
    expect(trap.__cardsAccessed ?? false).toBe(false)
  })

  it('decideDiscard (N=2): no accede a .cards del jugador humano (asiento 0)', () => {
    const trap = makeTrapPlayer()
    const state = {
      players: [
        trap,
        { isHuman: false, cards: STRONG_HAND, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'DISCARD', manoIndex: 0, pieIndex: 1,
      numPlayers: 2, unit: 10, handCount: 1, pot: 0,
    }
    decideDiscard(state, 1)
    expect(trap.__cardsAccessed ?? false).toBe(false)
  })

  it('decideBetAction (N=5): no accede a .cards de ningún asiento ajeno', () => {
    const traps = [0,2,3,4].map(seat => ({ seat, p: makeTrapPlayer() }))
    const aiCards = STRONG_HAND
    const players = [
      traps.find(t => t.seat === 0).p,
      { isHuman: false, cards: aiCards, chips: 500, contrib: 0, folded: false },  // AI bajo prueba
      traps.find(t => t.seat === 2).p,
      traps.find(t => t.seat === 3).p,
      traps.find(t => t.seat === 4).p,
    ]
    const state = {
      players, currentBet: 10, phase: 'BET_3', manoIndex: 0, pieIndex: 4,
      numPlayers: 5, unit: 10, handCount: 1, pot: 0,
    }
    decideBetAction(state, 1)
    traps.forEach(({ p }) => expect(p.__cardsAccessed ?? false).toBe(false))
  })
})

// ── 3. Sanidad de fold ────────────────────────────────────────────────────────
describe('3. Sanidad de fold', () => {
  beforeEach(() => _resetForTesting())

  it('los 4 perfiles: mano fuerte (score=47) en BET_3 vs apuesta mínima → nunca retirarse', () => {
    const seenProfiles = new Set()
    for (let i = 0; i < 100; i++) {
      _resetForTesting()
      initPersonalities(2)
      const profile = getPersonalityName(1)
      seenProfiles.add(profile)

      const state = makeState({
        players: [
          { isHuman: true,  cards: [], chips: 1000, contrib: 10, folded: false },
          { isHuman: false, cards: STRONG_HAND, chips: 1000, contrib: 0,  folded: false },
        ],
        currentBet: 10,
        phase: 'BET_3',
        handCount: i + 1,
      })
      const result = decideBetAction(state, 1)
      expect(result.action).not.toBe('retirarse')
    }
    // Todos los perfiles deben haber aparecido en 100 sorteos
    expect(seenProfiles.size).toBe(4)
  })

  it('chips insuficientes → retirarse sin importar la mano', () => {
    _resetForTesting()
    initPersonalities(2)
    const state = makeState({
      players: [
        { isHuman: true,  cards: [], chips: 1000, contrib: 100, folded: false },
        { isHuman: false, cards: STRONG_HAND, chips: 5, contrib: 0, folded: false },
      ],
      currentBet: 100,
      phase: 'BET_3',
    })
    expect(decideBetAction(state, 1).action).toBe('retirarse')
  })

  it('Ajilei natural (N=2): siempre apostar si no hay apuesta', () => {
    _resetForTesting()
    initPersonalities(2)
    const ajilei = [
      makeCard(1,'Copas'), makeCard(2,'Copas'), makeCard(3,'Copas'),
      makeCard(4,'Copas'), makeCard(5,'Copas'),
    ]  // 11+10+10+10+10 = 51, mismo palo → Ajilei
    const state = makeState({
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: ajilei, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'BET_3',
    })
    expect(decideBetAction(state, 1).action).toBe('apostar')
  })

  it('Ajilei natural (N=2): siempre subir si ya hay apuesta', () => {
    _resetForTesting()
    initPersonalities(2)
    const ajilei = [
      makeCard(1,'Copas'), makeCard(2,'Copas'), makeCard(3,'Copas'),
      makeCard(4,'Copas'), makeCard(5,'Copas'),
    ]
    const state = makeState({
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 10, folded: false },
        { isHuman: false, cards: ajilei, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 10, phase: 'BET_3',
    })
    expect(decideBetAction(state, 1).action).toBe('subir')
  })
})

// ── 4. Comodín: N=5 la IA lo preserva en el descarte ─────────────────────────
describe('4. Comodín', () => {
  it('N=5: 7-Oros (comodín) + palo fuerte → no se descarta', () => {
    // 7-Oros vale 11 pts en N=5; junto con 4 Oros más forma un palo muy fuerte
    const hand = [
      makeCard(7,'Oros'),   // comodín
      makeCard(1,'Oros'), makeCard(2,'Oros'),
      makeCard(3,'Oros'), makeCard(4,'Oros'),
    ]
    const state = {
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: hand, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'DISCARD', manoIndex: 0, pieIndex: 1,
      numPlayers: 5, unit: 10, handCount: 1, pot: 0,
    }
    const idx = decideDiscard(state, 1)
    const comodinPos = hand.findIndex(c => c.palo === 'Oros' && c.value === 7)
    expect(idx).not.toContain(comodinPos)
  })

  it('N=5: descarte máximo es 3 cartas', () => {
    // Mano mixta: máximo a descartar es 3 (regla N=5)
    const hand = [
      makeCard(7,'Oros'), makeCard(1,'Copas'), makeCard(2,'Espadas'),
      makeCard(3,'Bastos'), makeCard(4,'Oros'),
    ]
    const state = {
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: hand, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'DISCARD', manoIndex: 0, pieIndex: 1,
      numPlayers: 5, unit: 10, handCount: 1, pot: 0,
    }
    expect(decideDiscard(state, 1).length).toBeLessThanOrEqual(3)
  })

  it('N=4: descarte máximo es 5 cartas', () => {
    const hand = [
      makeCard(1,'Oros'), makeCard(2,'Copas'), makeCard(3,'Espadas'),
      makeCard(4,'Bastos'), makeCard(5,'Oros'),
    ]
    const state = {
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: hand, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'DISCARD', manoIndex: 0, pieIndex: 1,
      numPlayers: 4, unit: 10, handCount: 1, pot: 0,
    }
    expect(decideDiscard(state, 1).length).toBeLessThanOrEqual(5)
  })

  it('N=4: 7-Oros vale 10 pts y no tiene protección especial de descarte', () => {
    // En N=4 el comodín vale 10 pero no es "especial"; la IA lo trata como carta normal
    const hand = [
      makeCard(7,'Oros'),   // vale 10 en N=4, mismo que cualquier figura
      makeCard(1,'Copas'), makeCard(2,'Copas'), makeCard(3,'Copas'), makeCard(4,'Copas'),
    ]  // Mejor palo: Copas (10+10+10+10=40 pts). 7-Oros no es del mejor palo.
    const state = {
      players: [
        { isHuman: true,  cards: [], chips: 500, contrib: 0, folded: false },
        { isHuman: false, cards: hand, chips: 500, contrib: 0, folded: false },
      ],
      currentBet: 0, phase: 'DISCARD', manoIndex: 0, pieIndex: 1,
      numPlayers: 4, unit: 10, handCount: 1, pot: 0,
    }
    const idx = decideDiscard(state, 1)
    // 7-Oros DEBERÍA ser descartado (no es del mejor palo Copas y N≠5)
    const comodinPos = hand.findIndex(c => c.palo === 'Oros' && c.value === 7)
    expect(idx).toContain(comodinPos)
  })
})

// ── 5. Simulación completa: 20 manos con IA real ─────────────────────────────
describe('5. Simulación completa (IA real, sin mock)', () => {
  ;[3, 4, 5].forEach(N => {
    it(`N=${N}: 20 manos consecutivas, conservación de fichas, sin errores`, () => {
      let s = createInitialState(10, N)
      const initialTotal = s.players.reduce((sum, p) => sum + p.chips, 0)

      for (let hand = 0; hand < 20; hand++) {
        s = startHand(s)
        s = simHand(s)

        expect(s.phase).toBe(PHASES.PAYOUT)

        // Conservación: Σchips + pot = constante (pot=0 en PAYOUT)
        const total = s.players.reduce((sum, p) => sum + p.chips, 0) + s.pot
        expect(total).toBe(initialTotal)

        // Ningún saldo es negativo
        s.players.forEach(p => expect(p.chips).toBeGreaterThanOrEqual(0))
      }
    })
  })

  it('acciones siempre válidas: ninguna IA apuesta más de su saldo (N=5, 10 manos)', () => {
    let s = createInitialState(10, 5)
    for (let hand = 0; hand < 10; hand++) {
      s = startHand(s)
      s = simHand(s)
      // Ningún jugador termina con saldo negativo
      s.players.forEach(p => expect(p.chips).toBeGreaterThanOrEqual(0))
    }
  })
})

// ── 6. Regresión N=2 ──────────────────────────────────────────────────────────
describe('6. Regresión N=2 (con IA real)', () => {
  it('hand completa N=2 → PAYOUT con estructura players[] íntegra', () => {
    let s = createInitialState(10, 2)
    s = startHand(s)
    s = simHand(s)

    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.players).toHaveLength(2)
    expect(Array.isArray(s.players[0].cards)).toBe(true)
    expect(Array.isArray(s.players[1].cards)).toBe(true)
    expect(typeof s.players[0].chips).toBe('number')
    expect(typeof s.players[1].chips).toBe('number')
    if (s.winner !== null) {
      expect([0, 1]).toContain(s.winner)
    }
  })

  it('N=2: BET_1 con apuesta mínima — tasa de fold < 50% en 40 manos', () => {
    let folds = 0
    for (let i = 0; i < 40; i++) {
      let s = createInitialState(10, 2)
      s = startHand(s)
      s = advanceFromDeal(s)   // → BET_1

      // Humano abre con apuesta mínima (1 unit)
      if (s.activePlayerIndex === 0 && s.phase === PHASES.BET_1) {
        s = applyPlayerBetAction(s, 'apostar', 10)
      }

      // Ahora es turno de la IA en BET_1 con solo 2 cartas
      if (s.activePlayerIndex !== 0 && s.phase === PHASES.BET_1) {
        const result = decideBetAction(s, s.activePlayerIndex)
        if (result.action === 'retirarse') folds++
      }
    }
    // Muy por debajo del bug histórico del 75%
    expect(folds).toBeLessThan(20)
  })

  it('N=2: conservación de fichas en 10 manos consecutivas', () => {
    let s = createInitialState(10, 2)
    const initialTotal = s.players.reduce((sum, p) => sum + p.chips, 0)
    for (let hand = 0; hand < 10; hand++) {
      s = startHand(s)
      s = simHand(s)
      const total = s.players.reduce((sum, p) => sum + p.chips, 0) + s.pot
      expect(total).toBe(initialTotal)
    }
  })
})
