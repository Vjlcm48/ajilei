// ── ARN-4 A5 · repetir ante un rojo de foto ──────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { anotarRuido, conRepeticion, notaRuido, reiniciarRuido, resumenRuido } from './repetir.mjs'
import { equivalentes, TOLERANCIA_CAP } from '../cap/capMesa.mjs'

// Capturas simuladas: cada toma devuelve la siguiente de la lista.
const capturas = (...lista) => {
  const tomar = vi.fn(async (i) => lista[i])
  return tomar
}
const esVerde = (v) => v === 'verde'

beforeEach(() => {
  reiniciarRuido()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('A5 · la repetición', () => {
  it('verde a la primera: ni repite ni anota', async () => {
    const tomar = capturas('verde')
    const r = await conRepeticion('x', tomar, esVerde)
    expect(tomar).toHaveBeenCalledTimes(1)
    expect(r).toMatchObject({ valor: 'verde', dentro: true, repeticiones: 0, nota: null })
  })
  it('rojo → verde = verde, «ruido, 1 repetición»', async () => {
    const r = await conRepeticion('x', capturas('rojo', 'verde'), esVerde)
    expect(r).toMatchObject({ valor: 'verde', dentro: true, repeticiones: 1, nota: 'ruido, 1 repetición' })
  })
  it('rojo → rojo → verde = verde, «ruido, 2 repeticiones»', async () => {
    const r = await conRepeticion('x', capturas('rojo', 'rojo', 'verde'), esVerde)
    expect(r).toMatchObject({ dentro: true, repeticiones: 2, nota: 'ruido, 2 repeticiones' })
  })
  it('rojo → rojo → rojo = rojo: no hay una cuarta foto, y sin nota', async () => {
    const tomar = capturas('rojo', 'rojo', 'rojo', 'verde')
    const r = await conRepeticion('x', tomar, esVerde)
    expect(tomar).toHaveBeenCalledTimes(3)
    expect(r).toMatchObject({ valor: 'rojo', dentro: false, repeticiones: 2, nota: null })
  })
  it('cada toma sabe qué repetición es', async () => {
    const tomar = capturas('rojo', 'verde')
    await conRepeticion('x', tomar, esVerde)
    expect(tomar.mock.calls.map(([i]) => i)).toEqual([0, 1])
  })
})

describe('A5 · el ruido no se calla', () => {
  it('sale en la línea de quien lo mide', async () => {
    await conRepeticion('cap.estable v', capturas('rojo', 'verde'), esVerde)
    expect(console.log).toHaveBeenCalledWith('  · cap.estable v: ruido, 1 repetición')
  })
  it('se cuenta en el resumen del modo', async () => {
    await conRepeticion('a', capturas('verde'), esVerde)
    await conRepeticion('b', capturas('rojo', 'verde'), esVerde)
    await conRepeticion('c', capturas('rojo', 'rojo', 'verde'), esVerde)
    await conRepeticion('d', capturas('rojo', 'rojo', 'rojo'), esVerde)
    expect(resumenRuido()).toBe('· ruido de fotos: 2 de 4 comparaciones, 3 repeticiones')
  })
  it('un modo sin fotos no dice nada, y uno sin ruido dice cero', async () => {
    expect(resumenRuido()).toBeNull()
    await conRepeticion('a', capturas('verde'), esVerde)
    expect(resumenRuido()).toBe('· ruido de fotos: 0 de 1 comparaciones, 0 repeticiones')
  })
  it('`anotarRuido` cuenta lo que repite su propio bucle (V-fuera)', () => {
    expect(anotarRuido('V-fuera', 2)).toBe(notaRuido(2))
    expect(resumenRuido()).toContain('1 de 0 comparaciones, 2 repeticiones')
  })
})

describe('A5 · el umbral no se afloja', () => {
  it('sigue siendo el 99,9 % con Δ ≤ 2 y ningún Δ > 40', () => {
    expect(TOLERANCIA_CAP).toEqual({ deltaFino: 2, fraccionFina: 0.999, deltaMax: 40 })
  })
  it('el ruido de VIS-1, Δ 57 en pocos píxeles, sigue fuera', () => {
    expect(equivalentes({ mismasDim: true, fraccionFina: 0.9999, deltaMax: 57 })).toBe(false)
    expect(equivalentes({ mismasDim: true, fraccionFina: 0.9999, deltaMax: 40 })).toBe(true)
    expect(equivalentes({ mismasDim: true, fraccionFina: 0.998, deltaMax: 3 })).toBe(false)
    expect(equivalentes({ mismasDim: false })).toBe(false)
  })
})
