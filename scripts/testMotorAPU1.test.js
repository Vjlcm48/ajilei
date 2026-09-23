/**
 * APU-1 · Fase 1b-ii — el motor con all-in defensivo y pozos por capas.
 *
 * Normativo: `docs/AJILEI_APU-1_Reglas_v1.1.md` §3.2, §4.1, §4.2, §4.3, §5.
 * Ficha: `AJILEI_APU-1_Fase1b_v1.0.md` §3.3.
 *
 * Lo que vive en `scripts/testEngine.test.js` no se toca salvo los dos cambios
 * de veredicto que la ficha manda; lo nuevo va aquí para no seguir engordando
 * aquel archivo.
 *
 * Ejecutar: npx vitest run scripts/testMotorAPU1.test.js
 */
import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  createInitialState,
  startHand,
  advanceFromDeal,
  applyBetAction,
  applyPlayerBetAction,
  applyDiscard,
  aplicarRecarga,
  PHASES,
} from '../src/engine/gameEngine.js'

import { createDeck, shuffleDeck, setRng, resetRng } from '../src/engine/deck.js'
import { capasDe } from '../src/engine/pozos.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCard(value, palo) {
  const points = value === 1 ? 11 : value === 7 ? 7 : value === 6 ? 6 : 10
  return { id: `${value}-${palo}`, value, palo, points }
}

const MANO_47 = [1, 2, 3, 4, 6].map(v => makeCard(v, 'Oros'))                       // 47 pts
const MANO_40 = [2, 3, 4, 5].map(v => makeCard(v, 'Copas')).concat(makeCard(2, 'Espadas'))  // 40 pts
const MANO_16 = [
  makeCard(2, 'Copas'), makeCard(3, 'Espadas'), makeCard(4, 'Bastos'),
  makeCard(5, 'Oros'), makeCard(6, 'Copas'),
]                                                                                   // 16 pts

// Mesa real (con sus `handRules` del barajado) llevada a mano hasta BET_1.
function mesa(numPlayers, unit = 10) {
  return advanceFromDeal(startHand(createInitialState(unit, numPlayers)))
}

const fichas = s => s.players.reduce((n, p) => n + p.chips, 0)

// ── §3.2 y §4.1 · applyBetAction ──────────────────────────────────────────────

describe('applyBetAction · la acción ilegal no se aplica (§3.2)', () => {
  it('devuelve EL MISMO objeto de estado, no una copia', () => {
    const s = mesa(2)
    expect(applyBetAction(s, 0, 'apostar', 3)).toBe(s)        // k fuera de {1,2,5,10}
    expect(applyBetAction(s, 1, 'pasar', 1)).toBe(s)          // fuera de turno
    expect(applyBetAction(s, 0, 'igualar', 1)).toBe(s)        // sin apuesta viva
    expect(applyBetAction(s, 0, 'robar', 1)).toBe(s)          // acción inexistente
  })

  it('ya NO reescribe en `retirarse` lo que no se puede pagar', () => {
    let s = mesa(2)
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, chips: 30 } : p)) }
    s = applyBetAction(s, 0, 'apostar', 10)                   // 100 fichas sobre la mesa
    expect(s.currentBet).toBe(100)

    const antes = s
    s = applyBetAction(s, 1, 'igualar', 1)                    // no cubre
    expect(s).toBe(antes)
    expect(s.players[1].folded).toBe(false)
    expect(s.players[1].allIn).toBe(false)
  })
})

describe('applyBetAction · all-in defensivo (§4.1)', () => {
  // Mesa de 3: el asiento 0 apuesta fuerte, el 1 no cubre y va all-in, el 2
  // sigue teniendo que actuar. Es el estado donde se miden casi todas las reglas.
  function conAllIn() {
    let s = mesa(3)
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, chips: 30 } : p)) }
    s = applyBetAction(s, 0, 'apostar', 10)     // 100
    return applyBetAction(s, 1, 'allIn', 1)     // pone sus 30
  }

  it('no reabre la ronda: el `acted` de los demás queda intacto', () => {
    const s = conAllIn()
    expect(s.players[0].acted).toBe(true)
    expect(s.currentBet).toBe(100)              // el all-in no mueve la apuesta viva
  })

  it('no termina la mano antes de tiempo', () => {
    const s = conAllIn()
    expect(s.phase).toBe(PHASES.BET_1)
    expect(s.winner).toBe(null)
  })

  it('el asiento en all-in cuenta para el pozo y NO para el turno', () => {
    const s = conAllIn()
    expect(s.players[1].allIn).toBe(true)
    expect(s.players[1].folded).toBe(false)     // no es un retiro
    expect(s.players[1].chips).toBe(0)
    expect(s.activePlayerIndex).toBe(2)         // el turno lo salta
    expect(capasDe(s).some(c => c.elegibles.includes(1))).toBe(true)
  })

  it('`contribMano` acumula el ante y todo lo puesto en las rondas', () => {
    const s = conAllIn()
    expect(s.players[1].contribMano).toBe(40)   // 10 de ante + 30 de all-in
    expect(s.players[0].contribMano).toBe(110)  // 10 de ante + 100 de apuesta
    expect(s.pot).toBe(s.players.reduce((n, p) => n + p.contribMano, 0))
  })

  it('quedarse sin fichas pagando justo también deja el asiento en all-in', () => {
    let s = mesa(2)
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, chips: 100 } : p)) }
    s = applyBetAction(s, 0, 'apostar', 10)     // exactamente lo que le queda
    s = applyBetAction(s, 1, 'igualar', 1)
    expect(s.players[1].chips).toBe(0)
    expect(s.players[1].allIn).toBe(true)
  })
})

// ── §4.3 · La mano continúa ───────────────────────────────────────────────────

describe('isRoundOver y nextActiveIndex con all-in (§4.3)', () => {
  it('la ronda cierra cuando queda un solo jugador con fichas', () => {
    let s = mesa(2)
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, chips: 30 } : p)) }
    s = applyBetAction(s, 0, 'apostar', 10)
    s = applyBetAction(s, 1, 'allIn', 1)
    expect(s.phase).toBe(PHASES.DEAL_3)         // BET_1 cerrada, la mano sigue
  })

  // 1e-iii · A-2. Antes esta prueba compraba que BET_2 se abría «en quien sí
  // podía actuar», y era cierto: se abría para UN asiento, que tenía que pulsar
  // «pasar» contra nadie. §4.3 dice que esa ronda no existe, así que ya no se
  // abre: la mano sigue por reparto y descarte.
  it('la ronda siguiente no se ABRE: con un solo asiento con fichas, §4.3 la salta', () => {
    let s = mesa(2)
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, chips: 30 } : p)) }
    s = applyBetAction(s, 0, 'apostar', 10)
    s = applyBetAction(s, 1, 'allIn', 1)
    const pila = s.players[0].chips
    s = advanceFromDeal(s)                      // DEAL_3 → (BET_2 saltada) → DISCARD
    expect(s.phase).toBe(PHASES.DISCARD)
    expect(s.players[0].chips).toBe(pila)       // no puso ni una ficha más
    expect(s.players[0].acted).toBe(false)      // ni tuvo que decir nada
  })

  // El DESCARTE no se salta nunca, aunque las apuestas sí: el asiento en all-in
  // descarta igual (§4.4) porque sus cartas siguen jugando por sus capas.
  it('el asiento en all-in descarta con normalidad: el descarte no toca dinero', () => {
    let s = mesa(2)
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, chips: 30 } : p)) }
    s = applyBetAction(s, 0, 'apostar', 10)
    s = applyBetAction(s, 1, 'allIn', 1)
    s = advanceFromDeal(s)
    expect(s.phase).toBe(PHASES.DISCARD)

    // El descarte no mueve dinero, y como BET_3 tampoco se abre, entre el
    // estado de antes y el pago no entra ni sale una ficha: lo que había en el
    // pozo es exactamente lo que acaba repartido.
    const potAntes   = s.pot
    const fichasEnPie = s.players.reduce((n, p) => n + p.chips, 0)
    s = applyDiscard(s, [0, 1])
    expect(s.phase).toBe(PHASES.PAYOUT)         // BET_3 no se abre (§4.3)
    expect(s.pot).toBe(0)
    expect(s.players.reduce((n, p) => n + p.chips, 0)).toBe(fichasEnPie + potAntes)
    expect(s.players[1].cards).toHaveLength(5)
    expect(s.players[1].allIn).toBe(true)       // el descarte no lo desmarca
  })
})

// ── §4.2 · Reparto por capas ──────────────────────────────────────────────────

describe('doShowdown reparte por capas (§4.2)', () => {
  // Estado sintético en BET_3 sobre una mesa real: el asiento 1 está all-in por
  // 40 y tiene la mejor mano; 0 y 2 pusieron 100 cada uno. La capa baja es del
  // 1; la superior, que él no puede ganar, del mejor entre 0 y 2.
  function enBet3(cards, contribs, allIns, chips) {
    const s = mesa(3)
    const players = s.players.map((p, i) => ({
      ...p,
      cards:       cards[i],
      contribMano: contribs[i],
      allIn:       allIns[i],
      chips:       chips[i],
      contrib:     0,
      acted:       i !== 2,
      folded:      false,
    }))
    return {
      ...s,
      phase:             PHASES.BET_3,
      players,
      pot:               contribs.reduce((a, b) => a + b, 0),
      currentBet:        0,
      activePlayerIndex: 2,
      winner:            null,
    }
  }

  it('dos capas con ganadores distintos: cada una va a su mejor elegible', () => {
    let s = enBet3(
      [MANO_40, MANO_47, MANO_16],
      [100, 40, 100],
      [false, true, false],
      [500, 0, 500],
    )
    s = applyBetAction(s, 2, 'pasar', 1)        // cierra la ronda → showdown

    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.pot).toBe(0)
    expect(s.players[1].chips).toBe(120)        // capa baja: 40 × 3
    expect(s.players[0].chips).toBe(620)        // capa superior: 60 × 2
    expect(s.players[2].chips).toBe(500)
  })

  it('la capa superior vuelve a quien la puso aunque pierda la mano', () => {
    let s = enBet3(
      [MANO_16, MANO_47, MANO_16],
      [100, 40, 100],
      [false, true, false],
      [500, 0, 500],
    )
    const antes = fichas(s) + s.pot
    s = applyBetAction(s, 2, 'pasar', 1)
    // El 1 gana la capa baja con 47; la superior la disputan 0 y 2, que
    // empatan a 16, y la gana el más cercano a la Mano.
    expect(s.players[1].chips).toBe(120)
    expect(fichas(s)).toBe(antes)
  })

  it('el pozo queda en 0 y las fichas de la mesa se conservan exactamente', () => {
    let s = enBet3(
      [MANO_40, MANO_47, MANO_16],
      [100, 40, 100],
      [false, true, false],
      [500, 0, 500],
    )
    const total = fichas(s) + s.pot
    s = applyBetAction(s, 2, 'pasar', 1)
    expect(s.pot).toBe(0)
    expect(fichas(s)).toBe(total)
  })

  it('el último en pie cobra el pozo entero (ruta de retiro, sin capas)', () => {
    let s = mesa(3)
    const total = fichas(s) + s.pot
    s = applyBetAction(s, 0, 'apostar', 1)
    s = applyBetAction(s, 1, 'retirarse', 1)
    s = applyBetAction(s, 2, 'retirarse', 1)
    expect(s.phase).toBe(PHASES.PAYOUT)
    expect(s.winner).toBe(0)
    expect(s.pot).toBe(0)
    expect(fichas(s)).toBe(total)
  })
})

// ── §2, §5 · Entrada por asiento, ante y recarga ──────────────────────────────

describe('createInitialState, startHand y aplicarRecarga', () => {
  it('acepta la lista de jugadores con las fichas de cada asiento', () => {
    const s = createInitialState(100, [
      { isHuman: true,  chips: 2500 },
      { isHuman: false, chips: 3500 },
      { isHuman: false, chips: 3500, name: 'La Pro' },
    ])
    expect(s.numPlayers).toBe(3)
    expect(s.players.map(p => p.chips)).toEqual([2500, 3500, 3500])
    expect(s.players.map(p => p.entrada)).toEqual([2500, 3500, 3500])
    expect(s.players[2].name).toBe('La Pro')
    expect(s.players[0].isHuman).toBe(true)
  })

  it('la forma numérica transitoria da exactamente la mesa de hoy', () => {
    const s = createInitialState(10, 3)
    expect(s.numPlayers).toBe(3)
    expect(s.players.map(p => p.name)).toEqual(['Tú', 'IA 1', 'IA 2'])
    expect(s.players.map(p => p.isHuman)).toEqual([true, false, false])
    expect(new Set(s.players.map(p => p.chips)).size).toBe(1)
    expect(createInitialState(10, 2).players[1].name).toBe('IA')
  })

  it('el ante de cada mano entra en `contribMano`', () => {
    const s = startHand(createInitialState(50, 4))
    expect(s.players.map(p => p.contribMano)).toEqual([50, 50, 50, 50])
    expect(s.pot).toBe(200)
    expect(s.players.every(p => p.allIn === false)).toBe(true)
  })

  it('el asiento 0 quebrado con ≥2 vivos ya NO termina la mesa (§5.4)', () => {
    let s = createInitialState(10, 3)
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, chips: 0 } : p)) }
    s = startHand(s)
    expect(s.phase).toBe(PHASES.DEAL_2)
    expect(s.players[0].eliminated).toBe(true)
    expect(s.aliveCount).toBe(2)
  })

  // ── APU-1 1d §2.1 · D-7 · el ante justo deja el asiento en all-in ──────────
  it('el ante que deja la pila en cero marca `allIn` desde el reparto', () => {
    let s = createInitialState(50, 3)
    // El asiento 2 tiene exactamente el ante: paga y se queda a cero. No es
    // `eliminated` (la puerta es `chips < unit`, y 50 no es menor que 50).
    s = { ...s, players: s.players.map((p, i) => (i === 2 ? { ...p, chips: 50 } : p)) }
    s = startHand(s)
    expect(s.phase).toBe(PHASES.DEAL_2)
    expect(s.players[2].eliminated).toBe(false)
    expect(s.players[2].chips).toBe(0)
    expect(s.players[2].allIn).toBe(true)
    expect(s.players.map(p => p.allIn)).toEqual([false, false, true])
    // Y no recibe el turno: la ronda no se queda esperando a quien no puede actuar.
    expect(advanceFromDeal(s).activePlayerIndex).not.toBe(2)
  })

  // Segunda línea de D-7, consignada como salida de rango: `advanceFromDeal` no
  // recalcula el turno, así que sin este arreglo BET_1 abría sobre una Mano que
  // acababa de quedarse a cero y que, ya marcada en all-in, no tiene NINGUNA
  // acción legal. La mesa se clavaba (medido en el banco, mesa 2, espejo).
  it('si la Mano se queda a cero con el ante, BET_1 abre en quien sí puede actuar', () => {
    let s = createInitialState(50, 2)
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, chips: 50 } : p)) }
    s = startHand(s)
    expect(s.manoIndex).toBe(0)                  // el ROL de Mano no se mueve
    expect(s.players[0].allIn).toBe(true)
    expect(s.activePlayerIndex).toBe(1)          // pero habla el que puede
    // 1e-iii · y en una mesa de DOS, con el otro en all-in por el ante, BET_1
    // ni siquiera se abre: no hay con quién apostar (§4.3). El rol de Mano y el
    // turno se siguen calculando bien —eso es lo que mide esta prueba—; lo que
    // cambia es que ese turno ya no llega a usarse.
    const sigue = advanceFromDeal(s)
    expect(sigue.phase).toBe(PHASES.DEAL_3)
    expect(sigue.players[1].acted).toBe(false)
  })

  it('ese asiento no es elegible por encima de su ante (`capasDe`)', () => {
    let s = createInitialState(50, 3)
    s = { ...s, players: s.players.map((p, i) => (i === 2 ? { ...p, chips: 50 } : p)) }
    s = startHand(s)
    // Los otros dos ponen 100 más cada uno sobre el ante.
    s = { ...s, players: s.players.map((p, i) => (i === 2 ? p : { ...p, contribMano: 150 })) }
    const capas = capasDe(s)
    expect(capas).toHaveLength(2)
    expect(capas[0].monto).toBe(150)                     // la capa del ante: 50×3
    expect(capas[0].elegibles).toEqual([0, 1, 2])
    expect(capas[1].monto).toBe(200)                     // lo puesto por encima
    expect(capas[1].elegibles).toEqual([0, 1])           // el de a-cero queda fuera
  })

  it('la recarga solo vale entre manos, y suma a la pila y a la entrada', () => {
    const s = createInitialState(100, 2)          // WAITING
    const recargado = aplicarRecarga(s, 0, 1000)
    expect(recargado.players[0].chips).toBe(s.players[0].chips + 1000)
    expect(recargado.players[0].entrada).toBe(s.players[0].entrada + 1000)

    const enMano = mesa(2)                        // BET_1
    expect(aplicarRecarga(enMano, 0, 1000)).toBe(enMano)
    expect(aplicarRecarga(s, 0, 0)).toBe(s)
    expect(aplicarRecarga(s, 0, 12.5)).toBe(s)
  })
})

// ── §6.11 · Reproducibilidad del barajado ─────────────────────────────────────

describe('deck.setRng / resetRng (§6.11)', () => {
  afterEach(() => resetRng())

  // LCG mínimo: no hace falta calidad estadística, hace falta repetibilidad.
  const lcg = semilla => () => {
    semilla = (semilla * 1103515245 + 12345) % 2147483648
    return semilla / 2147483648
  }

  it('con un generador fijo el barajado es determinista y repetible', () => {
    setRng(lcg(42))
    const a = shuffleDeck(createDeck()).map(c => c.id)
    setRng(lcg(42))
    const b = shuffleDeck(createDeck()).map(c => c.id)
    expect(a).toEqual(b)

    setRng(lcg(7))
    const c = shuffleDeck(createDeck()).map(c => c.id)
    expect(c).not.toEqual(a)
    expect(a).toHaveLength(40)
  })

  // APU-1 1d §2.1 · LIGADO TARDE. Antes, `let rng = Math.random` capturaba la
  // función original al cargar el módulo: un espía puesto después no se veía y
  // el barajado corría contra el azar real mientras la prueba lo creía fijado.
  it('un vi.spyOn(Math,"random") POSTERIOR a la carga sí afecta al barajado', () => {
    const espia = vi.spyOn(Math, 'random').mockReturnValue(0)
    const conEspia = shuffleDeck(createDeck()).map(c => c.id)
    expect(espia).toHaveBeenCalled()
    setRng(() => 0)
    expect(shuffleDeck(createDeck()).map(c => c.id)).toEqual(conEspia)
    espia.mockRestore()
  })

  it('resetRng devuelve el barajado a Math.random', () => {
    setRng(() => 0)
    const fijo = shuffleDeck(createDeck()).map(c => c.id)
    resetRng()
    const libre = shuffleDeck(createDeck()).map(c => c.id)
    expect(shuffleDeck(createDeck()).map(c => c.id)).not.toEqual(libre)
    expect(fijo).toHaveLength(40)
  })
})

// ── La puerta del humano habla en MULTIPLICADORES ───────────────────────
// Estas dos pruebas sellaban la traducción `betAmount → k`, que existía porque
// la pantalla hablaba en fichas y el motor en multiplicadores. 1e-iii la retiró
// —la pantalla ya elige un `k` para consultar la legalidad— y cambian de
// veredicto con ella: lo que sellan ahora es que el tercer argumento ES el
// multiplicador de §3.1.

describe('applyPlayerBetAction recibe el multiplicador de §3.1', () => {
  it('el `k` que manda la pantalla es el que el motor aplica', () => {
    let s = mesa(2)
    s = applyPlayerBetAction(s, 'apostar', 5)
    expect(s.currentBet).toBe(s.unit * 5)
    expect(s.players[0].contribMano).toBe(s.unit + s.unit * 5)   // ante + apuesta
  })

  it('sin multiplicador apuesta el ×1, como hasta hoy', () => {
    let s = mesa(2)
    s = applyPlayerBetAction(s, 'apostar')
    expect(s.currentBet).toBe(s.unit)
  })
})
