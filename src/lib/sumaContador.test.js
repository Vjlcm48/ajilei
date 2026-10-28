// RNK-1 1e §2.8 · la persistencia del contador: nunca lanza y nunca lee basura.
import { describe, it, expect } from 'vitest'
import { crearSumaContador } from './sumaContador'

function almacenDeMentira() {
  const datos = new Map()
  return {
    datos,
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)) },
  }
}

describe('RNK-1 1e · sumaContador', () => {
  it('sin almacén no lanza y lee n = 0', () => {
    const c = crearSumaContador(() => null)
    expect(c.leer()).toEqual({ n: 0, dia: null })
    expect(() => c.escribir({ n: 3, dia: '2026-10-28' })).not.toThrow()
  })

  it('con un almacén que lanza (privado, cuota) tampoco', () => {
    const roto = { getItem() { throw new Error('SecurityError') }, setItem() { throw new Error('QuotaExceededError') } }
    const c = crearSumaContador(() => roto)
    expect(c.leer()).toEqual({ n: 0, dia: null })
    expect(() => c.escribir({ n: 1, dia: null })).not.toThrow()
    // Y si el propio acceso al almacén lanza.
    const c2 = crearSumaContador(() => { throw new Error('sin acceso') })
    expect(c2.leer()).toEqual({ n: 0, dia: null })
  })

  it('escribe y lee, bajo una sola clave', () => {
    const a = almacenDeMentira()
    const c = crearSumaContador(() => a)
    c.escribir({ n: 5, dia: '2026-10-28' })
    expect(c.leer()).toEqual({ n: 5, dia: '2026-10-28' })
    expect([...a.datos.keys()]).toEqual(['ajilei.sumamente'])
    c.escribir({ n: 0, dia: null })
    expect(c.leer()).toEqual({ n: 0, dia: null })
  })

  it('basura en la clave → n = 0', () => {
    const a = almacenDeMentira()
    const c = crearSumaContador(() => a)
    for (const crudo of ['{', 'null', '42', '"hola"', '{"n":-1}', '{"n":"7"}', '{"n":2.5}', '[]']) {
      a.setItem('ajilei.sumamente', crudo)
      expect(c.leer().n, crudo).toBe(0)
    }
    a.setItem('ajilei.sumamente', '{"n":3,"dia":"ayer"}')
    expect(c.leer()).toEqual({ n: 3, dia: null })
  })
})
