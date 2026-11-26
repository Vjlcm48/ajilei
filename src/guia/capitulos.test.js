import { describe, it, expect } from 'vitest'
import { CAPITULOS, MUESTRA_SI_VACIO, ANCLA_MUESTRA, anclasDe } from './capitulos.js'
import { createDeck } from '../engine/deck.js'
import { isAjilei } from '../engine/handEvaluator.js'

// TUT-1 T7 · v1.6 §2.1 · desde el ⋮ sin cartas en la mano, el 1.1 y el 4.1 pintan un AJILEI.

describe('TUT-1 T7 · la muestra del AJILEI cuando la mesa viva no tiene cartas', () => {
  it('la piden el 1.1 y el 4.1, y ningún otro paso', () => {
    const piden = Object.entries(CAPITULOS).flatMap(([n, c]) => c.pasos.map((p, k) => (p.muestraSiVacio ? `${n}.${k + 1}:${p.muestraSiVacio}` : null))).filter(Boolean)
    expect(piden).toEqual(['1.1:ajilei', '4.1:ajilei'])
    for (const nombre of new Set(piden.map((x) => x.split(':')[1]))) expect(MUESTRA_SI_VACIO[nombre]).toBeTruthy()
  })

  it('es un AJILEI para el motor: cinco cartas del mazo, el As y cuatro de diez de un palo', () => {
    const mazo = new Map(createDeck().map((c) => [c.id, c]))
    const { tipo, conjunto, cartas } = MUESTRA_SI_VACIO.ajilei
    expect(tipo).toBe('cartas')
    expect(conjunto).toBe('ajilei')
    const de = cartas.map((id) => mazo.get(id))
    expect(de.every(Boolean)).toBe(true)
    expect(de.reduce((s, c) => s + c.points, 0)).toBe(51)
    expect(new Set(de.map((c) => c.palo)).size).toBe(1)
    expect(de[0].value).toBe(1)
    expect(isAjilei(de, 3)).toBe(true)
  })

  it('su ancla es la de cualquier muestra', () => {
    expect(ANCLA_MUESTRA).toEqual(anclasDe({ muestra: { tipo: 'cartas' } }))
  })
})
