import { describe, it, expect, afterEach } from 'vitest'
import { tiradasPara, armarOrden, soltarMazo } from './mazoDado.js'
import { createDeck, shuffleDeck, resetRng } from '../engine/deck.js'
import { ORDENES } from './guiaManos.js'

// TUT-1 T2 §1.1 · el mazo dado de la partida guiada, contra el barajado REAL
// (`deck.js`, protegido: se usa por sus exportaciones). Lo que importa es R-2 de
// la Fase 0: el guion nunca llega a una mesa de verdad.
afterEach(() => { resetRng() })

const ids = (baraja) => baraja.map((c) => c.id)
const barajado = () => ids(shuffleDeck(createDeck()))

describe('TUT-1 · mazoDado', () => {
  it('con un orden armado, `shuffleDeck(createDeck())` devuelve ese orden', () => {
    for (const orden of ORDENES) {
      armarOrden(orden)
      expect(barajado()).toEqual([...orden])
    }
  })

  it('tras `soltarMazo()` antes de consumir, dos barajados seguidos NO repiten el orden del guion', () => {
    for (const orden of ORDENES) {
      armarOrden(orden)
      soltarMazo()
      const a = barajado()
      const b = barajado()
      expect(a).not.toEqual([...orden])
      expect(b).not.toEqual([...orden])
      expect(a).not.toEqual(b)
    }
  })

  it('`armarOrden` se consume UNA vez: el segundo barajado ya es el azar de verdad', () => {
    const [orden] = ORDENES
    armarOrden(orden)
    expect(barajado()).toEqual([...orden])
    const real = Math.random
    let llamadas = 0
    Math.random = () => { llamadas++; return real() }
    try {
      expect(barajado()).not.toEqual([...orden])
    } finally { Math.random = real }
    expect(llamadas).toBe(39)
  })

  it('`soltarMazo` sin nada armado no rompe nada (la mesa lo llama siempre)', () => {
    soltarMazo()
    soltarMazo()
    expect(barajado()).toHaveLength(40)
  })

  it('`tiradasPara` da 39 tiradas en [0, 1) para cada orden de la guiada', () => {
    for (const orden of ORDENES) {
      const t = tiradasPara(orden)
      expect(t).toHaveLength(39)
      expect(t.every((x) => x >= 0 && x < 1)).toBe(true)
    }
  })
})
