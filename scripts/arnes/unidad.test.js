// ── ARN-4 A1 · la letra de la unidad ─────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { corregirUnidad, unidadEnMinuscula } from './unidad.mjs'

describe('A1 · la letra de la unidad', () => {
  it('sube la letra de la unidad y nada más', () => {
    expect(corregirUnidad('c:\\Users\\victo\\ajilei')).toBe('C:\\Users\\victo\\ajilei')
    expect(corregirUnidad('d:/a/b')).toBe('D:/a/b')
  })
  it('lo que ya está bien, o no lleva unidad, no cambia', () => {
    for (const r of ['C:\\Users\\victo', '/home/victo', '\\\\servidor\\c:\\x', 'scripts/c:/x', '']) {
      expect(corregirUnidad(r)).toBe(r)
    }
  })
  it('detecta la minúscula solo al principio', () => {
    expect(unidadEnMinuscula('c:\\x')).toBe(true)
    expect(unidadEnMinuscula('C:\\x')).toBe(false)
    expect(unidadEnMinuscula('/opt/buildhome/repo')).toBe(false)
  })
})
