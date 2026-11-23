import { describe, it, expect, afterAll } from 'vitest'
import { momentoGuiada } from './momento.js'
import { paradaDePaso, sumaDe, indicesSueltas, ORDENES } from '../lib/guiaManos.js'
import { soltarMazo } from '../lib/mazoDado.js'
import { createDeck, shuffleDeck } from '../engine/deck.js'
import { isAjilei } from '../engine/handEvaluator.js'

// TUT-1 T4 §1.1 · los momentos del mapa de la ficha, reproducidos con el motor real.
afterAll(() => soltarMazo())

const mias = (g) => g.players[0].cards
const palos = (c) => new Set(c.map((x) => x.palo)).size

describe('TUT-1 T4 · la parada de cada paso sale de los PASOS de la guiada', () => {
  it('mano 1: los dos turnos de la última ronda, el descarte con y sin selección, el pago', () => {
    expect(paradaDePaso(1, 1)).toEqual({ fase: 'WAITING' })
    expect(paradaDePaso(1, 2)).toEqual({ fase: 'BET_1', turno: 1 })
    expect(paradaDePaso(1, 3)).toEqual({ fase: 'BET_1', turno: 1 })
    expect(paradaDePaso(1, 4)).toEqual({ fase: 'BET_2', turno: 1 })
    expect(paradaDePaso(1, 6)).toMatchObject({ fase: 'DISCARD', seleccion: null })
    expect(typeof paradaDePaso(1, 7).seleccion).toBe('function')
    expect(paradaDePaso(1, 9)).toEqual({ fase: 'BET_3', turno: 1 })
    expect(paradaDePaso(1, 10)).toEqual({ fase: 'BET_3', turno: 2 })
    expect(paradaDePaso(1, 11)).toEqual({ fase: 'PAYOUT' })
    expect(() => paradaDePaso(1, 13)).toThrow()
  })
})

describe('TUT-1 T4 · los momentos del mapa (§1.3)', () => {
  it('1·2: tus dos cartas, de palos distintos, en tu turno de la primera ronda', () => {
    const g = momentoGuiada(1, 2)
    expect(g.phase).toBe('BET_1')
    expect(g.activePlayerIndex).toBe(0)
    expect(mias(g)).toHaveLength(2)
    expect(palos(mias(g))).toBe(2)
  })

  it('1·4: cinco cartas, tres del mismo palo (30)', () => {
    const g = momentoGuiada(1, 4)
    expect(g.phase).toBe('BET_2')
    expect(mias(g)).toHaveLength(5)
    expect(sumaDe(mias(g)).points).toBe(30)
  })

  it('1·6 y 1·7: el descarte, sin selección y con las dos sueltas elegidas', () => {
    const a = momentoGuiada(1, 6)
    expect(a.phase).toBe('DISCARD')
    expect(a.selectedDiscards).toEqual([])
    const b = momentoGuiada(1, 7)
    expect(b.phase).toBe('DISCARD')
    expect([...b.selectedDiscards].sort()).toEqual(indicesSueltas(mias(b)).sort())
    expect(b.selectedDiscards).toHaveLength(2)
  })

  it('1·10: la apuesta viva de IA 1 (te toca igualar en la última ronda)', () => {
    const g = momentoGuiada(1, 10)
    expect(g.phase).toBe('BET_3')
    expect(g.activePlayerIndex).toBe(0)
    expect(g.currentBet).toBeGreaterThan(g.players[0].contrib)
  })

  it('1·11: el pago; te gana un rival', () => {
    const g = momentoGuiada(1, 11)
    expect(g.phase).toBe('PAYOUT')
    expect(g.winner).not.toBe(0)
  })

  it('2·4: cuatro del palo, tu turno de la segunda ronda', () => {
    const g = momentoGuiada(2, 4)
    expect(g.handCount).toBe(2)
    expect(g.phase).toBe('BET_2')
    expect(g.activePlayerIndex).toBe(0)
  })

  it('3·3: AJILEI en tu mano, tu turno de la segunda ronda', () => {
    const g = momentoGuiada(3, 3)
    expect(g.handCount).toBe(3)
    expect(g.phase).toBe('BET_2')
    expect(isAjilei(mias(g), g.aliveCount ?? 3, false) || sumaDe(mias(g)).points === 51).toBe(true)
  })

  it('es determinista y no toca los órdenes', () => {
    const antes = JSON.stringify(ORDENES)
    expect(momentoGuiada(1, 10)).toEqual(momentoGuiada(1, 10))
    expect(JSON.stringify(ORDENES)).toBe(antes)
  })

  it('R-2: después de un momento el barajado vuelve al azar (no repite el orden de la guiada)', () => {
    momentoGuiada(3, 3)
    const ids = () => shuffleDeck(createDeck()).map((c) => c.id).join(',')
    const a = ids()
    const b = ids()
    expect(a).not.toBe(b)
    expect(ORDENES.map((o) => o.join(','))).not.toContain(a)
  })
})
