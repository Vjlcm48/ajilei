import { describe, it, expect, afterAll } from 'vitest'
import {
  ORDENES, MANOS, ASIENTOS, PILA, APUESTA, PASOS, JUGADORES, ESCALERA, GUION_RIVALES, estadoInicial, jugarMano, decidirRival,
  indiceSuelta, indicesSueltas, indicesDelPalo, sumaDe, pasosDeMano, pastillaGuiada,
} from './guiaManos.js'
import { armarOrden, soltarMazo } from './mazoDado.js'
import { isAjilei } from '../engine/handEvaluator.js'
import { PHASES } from '../engine/gameEngine.js'
import { TEXTOS_TUT_ES } from '../config/textos.tut.es.js'

// TUT-1 T2 §1.2 · las tres manos de la partida guiada (normativo v1.3 §1.4),
// REPRODUCIDAS con el motor real por la misma vía que el buscador (`jugarMano`:
// el guion de los rivales, la escalera del humano y el descarte que decide la
// IA). Cada condición del normativo se afirma aquí por separado: si una campaña
// futura cambia el motor y una deja de cumplirse, esta prueba lo dice (y se
// vuelve a correr el buscador; los órdenes no se tocan a mano).
afterAll(() => soltarMazo())

const suma = (c) => sumaDe(c).points
const palos = (cartas) => {
  const n = {}
  for (const c of cartas) n[c.palo] = (n[c.palo] ?? 0) + 1
  return Object.values(n).sort((a, b) => b - a).join('+')
}
const ids = (cartas) => cartas.map((c) => c.id)

// Las tres, en orden: la pila y la Mano de cada una salen de la anterior.
const R = []
let previo = estadoInicial()
for (let mano = 1; mano <= MANOS; mano++) {
  const r = jugarMano(previo, mano, ORDENES[mano - 1], armarOrden)
  R.push(r)
  previo = r.pago
}
const finales = (r) => r.pago.players.map((p) => suma(p.cards))

describe('GUI-1 · la mesa guiada', () => {
  it('tres asientos de 10.000, sin comodín, apuesta 100', () => {
    expect(JUGADORES.map((j) => j.chips)).toEqual([PILA, PILA, PILA])
    expect(JUGADORES.map((j) => j.name)).toEqual(['Tú', 'IA 1', 'IA 2'])
    const g = estadoInicial()
    expect(g.unit).toBe(100)
    expect(g.numPlayers).toBe(ASIENTOS)
  })

  it('hay un orden por mano y cada uno es una permutación de las 40 cartas', () => {
    expect(ORDENES).toHaveLength(MANOS)
    for (const T of ORDENES) {
      expect(T).toHaveLength(40)
      expect(new Set(T).size).toBe(40)
    }
  })

  it('los rivales pasan sin apuesta viva e igualan la que haya; nunca suben ni se retiran', () => {
    const g = R[2].pago
    const con = (bet, handCount = 3, phase = 'BET_3') => ({ ...g, handCount, phase, currentBet: bet, players: g.players.map((p) => ({ ...p, contrib: 0 })) })
    expect(decidirRival(con(0), 1).action).toBe('pasar')
    expect(decidirRival(con(100), 1).action).toBe('igualar')
    expect(decidirRival(con(1000), 2).action).toBe('igualar')
    expect(decidirRival(con(0, 1, 'BET_2'), 1).action).toBe('pasar')
  })

  it('la única apuesta de un rival: IA 1, ×1, en la última ronda de la mano 1; IA 2 la iguala', () => {
    expect(GUION_RIVALES).toEqual({ 1: { BET_3: { 1: 1 } } })
    const g = { ...R[0].pago, handCount: 1, phase: 'BET_3', players: R[0].pago.players.map((p) => ({ ...p, contrib: 0 })) }
    expect(decidirRival({ ...g, currentBet: 0 }, 1)).toMatchObject({ action: 'apostar', k: 1 })
    expect(decidirRival({ ...g, currentBet: 0 }, 2).action).toBe('pasar')
    expect(decidirRival({ ...g, currentBet: 100 }, 2).action).toBe('igualar')
  })

  it.each([1, 2, 3])('mano %i: ninguna fase saltada, nadie se retira ni se queda sin pila (APU-1 §4.4)', (mano) => {
    const r = R[mano - 1]
    expect(r.turnos).toEqual({ BET_1: 1, BET_2: 1, BET_3: mano === 1 ? 2 : 1 })
    expect(r.fases).toEqual(expect.arrayContaining([PHASES.BET_1, PHASES.BET_2, PHASES.DISCARD, PHASES.BET_3, PHASES.PAYOUT]))
    expect(r.pago.players.every((p) => p.chips > 0 && !p.eliminated && !p.folded)).toBe(true)
  })

  it.each([1, 2, 3])('mano %i: la escalera, tal cual (§1.3), y los rivales lo igualan todo', (mano) => {
    const r = R[mano - 1]
    const esperado = ['BET_1', 'BET_2', 'BET_3'].flatMap((f) => ESCALERA[mano][f].map((e) => ({ fase: f, action: e.action, puso: e.k * APUESTA })))
    expect(r.jugadas.map(({ fase, action, puso }) => ({ fase, action, puso }))).toEqual(esperado)
    const puesto = r.pago.players.map((p) => p.contribMano)
    expect(new Set(puesto).size).toBe(1)
    const ks = esperado.reduce((s, e) => s + e.puso, 0)
    expect(r.pozo).toBe(ASIENTOS * (APUESTA + ks))
  })

  it('tres pases en toda la guiada, los tres en la mano 1; una igualada; seis apuestas', () => {
    const todas = R.flatMap((r) => r.jugadas)
    expect(todas.filter((j) => j.action === 'pasar')).toHaveLength(3)
    expect(R[0].jugadas.filter((j) => j.action === 'pasar')).toHaveLength(3)
    expect(todas.filter((j) => j.action === 'igualar')).toHaveLength(1)
    expect(todas.filter((j) => j.action === 'apostar')).toHaveLength(6)
  })

  it('la Mano rota: tú en la 1, IA 1 en la 2, IA 2 en la 3', () => {
    expect(R.map((r) => r.manoIndex)).toEqual([0, 1, 2])
  })
})

describe('GUI-1 · mano 1 · «Mirar y arriesgar»', () => {
  const r = R[0]
  const sueltas = indicesSueltas(r.cinco[0])
  it('a 2 cartas, dos palos distintos', () => {
    expect(r.dos[0].palo).not.toBe(r.dos[1].palo)
  })
  it('a 5 cartas, tres de un palo (30) y dos sueltas', () => {
    expect(palos(r.cinco[0])).toBe('3+1+1')
    expect(suma(r.cinco[0])).toBe(30)
    expect(indicesDelPalo(r.cinco[0])).toHaveLength(3)
    expect(sueltas).toHaveLength(2)
  })
  it('cambias las dos sueltas y las dos que llegan, en su sitio, NO son del palo: sigues en 30', () => {
    const palo = sumaDe(r.cinco[0]).palo
    for (const i of sueltas) {
      expect(r.despues[0][i].id).not.toBe(r.cinco[0][i].id)
      expect(r.despues[0][i].palo).not.toBe(palo)
    }
    expect(suma(r.despues[0])).toBe(30)
  })
  it('última ronda: pasas, IA 1 apuesta ×1, IA 2 iguala y tú igualas (pozo 600)', () => {
    const bet3 = r.jugadas.filter((j) => j.fase === 'BET_3')
    expect(bet3.map((j) => [j.action, j.puso])).toEqual([['pasar', 0], ['igualar', APUESTA]])
    expect(r.pago.players.map((p) => p.contribMano)).toEqual([2 * APUESTA, 2 * APUESTA, 2 * APUESTA])
    expect(r.pozo).toBe(600)
  })
  it('al mostrar, un rival te gana solo, con 37 o más; nadie con AJILEI', () => {
    const s = finales(r)
    expect(r.pago.winner).not.toBe(0)
    expect(s[r.pago.winner]).toBeGreaterThanOrEqual(37)
    expect(s.filter((x) => x === Math.max(...s))).toHaveLength(1)
    expect(r.pago.players.some((p) => isAjilei(p.cards, ASIENTOS))).toBe(false)
  })
})

describe('GUI-1 · mano 2 · «Mejorar y apostar»', () => {
  const r = R[1]
  const iS = indiceSuelta(r.cinco[0])
  it('a 2 cartas, dos del mismo palo', () => {
    expect(r.dos[0].palo).toBe(r.dos[1].palo)
  })
  it('a 5 cartas, cuatro de un palo y una suelta', () => {
    expect(palos(r.cinco[0])).toBe('4+1')
    expect(iS).toBeGreaterThanOrEqual(0)
    expect(indicesSueltas(r.cinco[0])).toEqual([iS])
  })
  it('ANTES del descarte un rival va por delante', () => {
    const antes = r.antes.map(suma)
    expect(antes[0]).toBeLessThan(Math.max(antes[1], antes[2]))
  })
  it('descartas la suelta y la que llega, en su sitio, ES del palo: cinco del palo', () => {
    expect(r.despues[0][iS].id).not.toBe(r.cinco[0][iS].id)
    expect(palos(r.despues[0])).toBe('5')
  })
  it('al mostrar, tu suma es la más alta, sin empate, y nadie tiene AJILEI', () => {
    const s = finales(r)
    expect(r.pago.winner).toBe(0)
    expect(s[0]).toBeGreaterThan(s[1])
    expect(s[0]).toBeGreaterThan(s[2])
    expect(r.pago.players.some((p) => isAjilei(p.cards, ASIENTOS))).toBe(false)
  })
})

describe('GUI-1 · mano 3 · «AJILEI»', () => {
  const r = R[2]
  it('a 2 cartas, el As y una de diez del mismo palo', () => {
    expect(r.dos[0].palo).toBe(r.dos[1].palo)
    expect(r.dos.map((c) => c.points).sort((a, b) => a - b)).toEqual([10, 11])
  })
  it('a 5 cartas, AJILEI de 51 (As y cuatro de diez del mismo palo)', () => {
    expect(isAjilei(r.cinco[0], ASIENTOS)).toBe(true)
    expect(suma(r.cinco[0])).toBe(51)
  })
  it('«Sin descartar»; en el descarte el pozo ya lleva el ×1 y el ×10 igualados (ante 300 + 300 + 3.000)', () => {
    expect(ids(r.despues[0])).toEqual(ids(r.cinco[0]))
    expect(r.pozoEnDescarte).toBe(3600)
  })
  it('ganas el pozo (6.600) y ningún rival tiene AJILEI', () => {
    expect(r.pago.winner).toBe(0)
    expect(r.pozo).toBe(6600)
    expect(r.pago.players.slice(1).some((p) => isAjilei(p.cards, ASIENTOS))).toBe(false)
  })
})

describe('GUI-1 · los pasos del normativo v1.3 §1.4', () => {
  it('11 + cierre, 11 + cierre y 9 + la celebración', () => {
    expect([1, 2, 3].map(pasosDeMano)).toEqual([12, 12, 10])
  })
  it('cada rótulo existe en `textos.tut.es.js`', () => {
    for (const p of PASOS) if (p.rotulo) expect(TEXTOS_TUT_ES[p.rotulo], p.rotulo).toBeTruthy()
  })
  it('cada «×k y Apostar» son dos pasos: el multiplicador y, después, el botón', () => {
    const sel = PASOS.map((p) => (p.ancla ? p.ancla({ players: [{ cards: [] }] }, {}).join() : ''))
    const mults = sel.map((s, i) => [s, i]).filter(([s]) => s.includes('data-accion="mult"'))
    expect(mults.map(([s]) => s.match(/data-k="(\d+)"/)[1])).toEqual(['2', '5', '10', '10'])
    for (const [, i] of mults) expect(sel[i + 1]).toBe('[data-accion="apostar"]')
  })
  it('la última ronda de la mano 1: «Pasar» y después «Igualar»', () => {
    const m1 = PASOS.filter((p) => p.mano === 1 && p.fase === 'BET_3' && p.avanza === 'toque')
    expect(m1.map((p) => [p.rotulo, p.ancla()[0]])).toEqual([
      ['tut.g1.p9', '[data-accion="pasar"]'], ['tut.g1.p10', '[data-accion="igualar"]'],
    ])
  })
  it('las cartas que señalan los pasos son las que el orden hace ciertas', () => {
    const g1 = { players: [{ cards: R[0].cinco[0] }] }
    const p4 = PASOS.find((p) => p.rotulo === 'tut.g1.p4')
    expect(p4.ancla(g1)).toHaveLength(3)
    const p6 = PASOS.find((p) => p.rotulo === 'tut.g1.p6')
    expect(p6.objetivo(g1)).toEqual(indicesSueltas(R[0].cinco[0]))
    expect(p6.ancla(g1)).toHaveLength(2)
    const g2 = { players: [{ cards: R[1].cinco[0] }] }
    const p6b = PASOS.find((p) => p.rotulo === 'tut.g2.p6')
    expect(p6b.ancla(g2)).toEqual([`[data-ancla="carta"][data-i="${indiceSuelta(R[1].cinco[0])}"]`])
  })
})

// T6 · v1.6 · la pastilla entre manos de la guiada cuenta el camino (Victor, STOP-T).
describe('T6 · la pastilla entre manos de la guiada', () => {
  const t = (k, v = {}) => TEXTOS_TUT_ES[k].replace(/\{(\w+)\}/g, (_, x) => String(v[x]))
  it('mano 1 de 3, mano 2 de 3 y la última, con quien es Mano', () => {
    const players = JUGADORES.map((j) => ({ ...j }))
    expect(pastillaGuiada({ handCount: 1, manoIndex: 0, players }, t)).toBe('Mano 1 de 3 · Eres Mano')
    expect(pastillaGuiada({ handCount: 2, manoIndex: 1, players }, t)).toBe('Mano 2 de 3 · Es Mano IA 1')
    expect(pastillaGuiada({ handCount: 3, manoIndex: 2, players }, t)).toBe('Última mano · Es Mano IA 2')
  })
  it('sin mano todavía, nada', () => {
    expect(pastillaGuiada({ handCount: 0, manoIndex: 0, players: JUGADORES }, t)).toBe(null)
    expect(pastillaGuiada(null, t)).toBe(null)
  })
})
