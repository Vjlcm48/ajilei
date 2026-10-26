// ── RNK-1c-ii · Lo puro del mini-perfil ─────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §3. Propio o ajeno, las dos líneas
// (con y sin puesto de Maestros, cifras con miles) y el estado de la tarjeta.

import { describe, it, expect } from 'vitest'
import { esPropio, lineasDe, estadoPerfil } from './miniPerfilCore'

const perfil = (o = {}) => ({ username: 'Bachaquero_VE', puestoMaestros: 1, puntos: 96, puestoFortunas: 2, saldo: 13050, ...o })

describe('RNK-1c-ii · esPropio', () => {
  it('por username sin mayúsculas', () => {
    expect(esPropio('test1976', 'Test1976')).toBe(true)
    expect(esPropio('DevLocal', 'devlocal')).toBe(true)
    expect(esPropio('ticotest2022', 'test1976')).toBe(false)
  })

  it('sin sesión o sin nombre, nunca', () => {
    expect(esPropio('test1976', '')).toBe(false)
    expect(esPropio('test1976', null)).toBe(false)
    expect(esPropio(undefined, 'test1976')).toBe(false)
  })
})

describe('RNK-1c-ii · lineasDe', () => {
  it('con puesto en las dos: «Puesto n · p puntos» y «Puesto n · s Heptacoins», con miles', () => {
    expect(lineasDe(perfil({ puestoMaestros: 1482, puntos: 3, puestoFortunas: 2, saldo: 13050 }))).toEqual({
      maestros: { clave: 'rnk.perfil.puntos', vars: { n: '1.482', p: '3' } },
      fortunas: { clave: 'rnk.perfil.hc', vars: { n: '2', s: '13.050' } },
    })
  })

  it('sin puesto de Maestros, el PROPIO → «Gana tu primera mano para entrar»', () => {
    const l = lineasDe(perfil({ puestoMaestros: null, puntos: null, puestoFortunas: 2, saldo: 48700 }), true)
    expect(l.maestros).toEqual({ clave: 'rnk.tu.vacio', vars: {} })
    expect(l.fortunas).toEqual({ clave: 'rnk.perfil.hc', vars: { n: '2', s: '48.700' } })
  })

  it('sin puesto de Maestros, el AJENO → «Aún no está en este ranking» (Ajuste B)', () => {
    const sinPuntos = perfil({ puestoMaestros: null, puntos: null, puestoFortunas: 2, saldo: 48700 })
    expect(lineasDe(sinPuntos, false).maestros).toEqual({ clave: 'rnk.perfil.sinpuntos', vars: {} })
    expect(lineasDe(sinPuntos).maestros).toEqual({ clave: 'rnk.perfil.sinpuntos', vars: {} })
    expect(lineasDe(sinPuntos).fortunas).toEqual({ clave: 'rnk.perfil.hc', vars: { n: '2', s: '48.700' } })
  })

  it('con puesto, propio o ajeno dicen lo mismo', () => {
    const p = perfil({ puestoMaestros: 7, puntos: 11 })
    expect(lineasDe(p, true)).toEqual(lineasDe(p, false))
  })

  it('saldo en 0 se pinta 0 (los quebrados también tienen puesto)', () => {
    expect(lineasDe(perfil({ puestoFortunas: 140, saldo: 0 })).fortunas).toEqual({ clave: 'rnk.perfil.hc', vars: { n: '140', s: '0' } })
  })

  it('sin perfil (cargando, sin red) → las dos en hueco', () => {
    expect(lineasDe(null)).toEqual({ maestros: null, fortunas: null })
  })

  it('sin puesto de Fortunas → hueco, no un cero inventado', () => {
    expect(lineasDe(perfil({ puestoFortunas: null, saldo: null })).fortunas).toBe(null)
  })
})

describe('RNK-1c-ii · estadoPerfil', () => {
  it('sin respuesta → cargando', () => {
    expect(estadoPerfil(null)).toBe('cargando')
  })
  it('sin red → sinred', () => {
    expect(estadoPerfil({ ok: false, motivo: 'sinred' })).toBe('sinred')
  })
  it('perfil nulo → nohay; con perfil → listo', () => {
    expect(estadoPerfil({ ok: true, perfil: null })).toBe('nohay')
    expect(estadoPerfil({ ok: true, perfil: perfil() })).toBe('listo')
  })
})
