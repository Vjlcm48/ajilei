import { describe, it, expect } from 'vitest'
import { crearSaldoOculto } from './saldoOculto'

// ── CFG-1 1a · el ojito, recordado en el aparato ────────────────────────────

function almacenFalso() {
  const datos = new Map()
  return {
    datos,
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)) },
  }
}

describe('CFG-1 1a · saldoOculto', () => {
  it('sin nada guardado, la cifra se ve', () => {
    expect(crearSaldoOculto(() => almacenFalso()).leer()).toBe(false)
  })

  it('guarda «si» / «no» bajo ajilei.saldoOculto, y nada más', () => {
    const a = almacenFalso()
    const o = crearSaldoOculto(() => a)
    o.guardar(true)
    expect([...a.datos.entries()]).toEqual([['ajilei.saldoOculto', 'si']])
    expect(o.leer()).toBe(true)
    o.guardar(false)
    expect(a.datos.get('ajilei.saldoOculto')).toBe('no')
    expect(o.leer()).toBe(false)
  })

  it('un valor raro se lee como «a la vista»', () => {
    const a = almacenFalso()
    a.setItem('ajilei.saldoOculto', 'true')
    expect(crearSaldoOculto(() => a).leer()).toBe(false)
  })

  it('un almacén que falla no rompe: se lee a la vista y guardar no lanza', () => {
    const roto = { getItem() { throw new Error('bloqueado') }, setItem() { throw new Error('lleno') } }
    const o = crearSaldoOculto(() => roto)
    expect(o.leer()).toBe(false)
    expect(() => o.guardar(true)).not.toThrow()
    expect(crearSaldoOculto(() => null).leer()).toBe(false)
  })
})
