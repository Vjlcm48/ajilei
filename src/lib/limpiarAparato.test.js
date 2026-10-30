import { describe, it, expect } from 'vitest'
import { limpiarAparato } from './limpiarAparato.js'

// ── CFG-1 1c · limpiarAparato ───────────────────────────────────────────────
// Un almacén en memoria con la forma de `Storage` (`length`, `key`, `getItem`,
// `setItem`, `removeItem`, `clear`): el proyecto no tiene jsdom.
function almacen(inicial = {}) {
  const m = new Map(Object.entries(inicial))
  return {
    get length() { return m.size },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    clear: () => { m.clear() },
    claves: () => [...m.keys()],
  }
}

describe('CFG-1 1c · limpiarAparato', () => {
  it('borra TODAS las claves ajilei.* (también una que no está en ningún censo) y deja las ajenas', () => {
    const l = almacen({
      'ajilei.sound': 'off', 'ajilei.saldoOculto': 'si', 'ajilei.tapetes.comprados': '[]',
      'ajilei.claveDeMañana': 'x', 'sb-abc-auth-token': '{}', 'ajileiSinPunto': '1', 'otra.cosa': '2',
    })
    const s = almacen({ 'ajilei.recargaPorChunk': '1', 'cualquiera': '3' })
    expect(limpiarAparato({ local: () => l, sesion: () => s })).toBe(4)
    expect(l.claves().sort()).toEqual(['ajileiSinPunto', 'otra.cosa', 'sb-abc-auth-token'])
    expect(s.claves()).toEqual([])
  })

  it('con muchas claves seguidas no se salta ninguna (no borra mientras recorre por índice)', () => {
    const l = almacen(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`ajilei.k${i}`, String(i)])))
    expect(limpiarAparato({ local: () => l, sesion: () => null })).toBe(12)
    expect(l.claves()).toEqual([])
  })

  it('sin almacén, o con uno que lanza, no lanza', () => {
    expect(limpiarAparato({ local: () => null, sesion: () => null })).toBe(0)
    const roto = { get length() { throw new Error('SecurityError') }, clear() { throw new Error('SecurityError') } }
    expect(() => limpiarAparato({ local: () => roto, sesion: () => roto })).not.toThrow()
    expect(limpiarAparato({ local: () => { throw new Error('x') }, sesion: () => { throw new Error('x') } })).toBe(0)
  })

  it('una clave que no se deja borrar no impide borrar las demás', () => {
    const l = almacen({ 'ajilei.a': '1', 'ajilei.b': '2' })
    const quitar = l.removeItem
    l.removeItem = (k) => { if (k === 'ajilei.a') throw new Error('x'); quitar(k) }
    expect(limpiarAparato({ local: () => l, sesion: () => null })).toBe(1)
    expect(l.claves()).toEqual(['ajilei.a'])
  })
})
