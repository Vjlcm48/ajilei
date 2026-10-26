// ── RNK-1c · Lo puro de la pantalla «Rankings» ──────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §4. La frase de la banda (vacío,
// dentro, fuera), el estado de la lista, la cifra con miles y «es tu fila».

import { describe, it, expect } from 'vitest'
import { PESTANAS, PESTANA_INICIAL, estadoDe, textoBanda, cifraTexto, esTu, muestraFin } from './rankingsCore'

const ok = (filas) => ({ ok: true, filas })
const mioOk = (mio) => ({ ok: true, mio })
const SINRED = { ok: false, motivo: 'sinred' }

describe('RNK-1c · pestañas', () => {
  it('dos, y abre siempre en Maestros', () => {
    expect(PESTANAS).toEqual(['maestros', 'fortunas'])
    expect(PESTANA_INICIAL).toBe('maestros')
  })
})

describe('RNK-1c · textoBanda', () => {
  it('sin fila en Maestros → «Gana tu primera mano para entrar»', () => {
    expect(textoBanda({ ranking: 'maestros', mio: null })).toEqual({ clave: 'rnk.tu.vacio', vars: {} })
  })

  it('sin fila en Fortunas no hay frase (la banda queda en hueco)', () => {
    expect(textoBanda({ ranking: 'fortunas', mio: null })).toBe(null)
  })

  it('dentro del top: solo «Puesto n», sin franja', () => {
    expect(textoBanda({ ranking: 'maestros', mio: { puesto: 7, total: 130, franja: 10, cifra: 11 } }))
      .toEqual({ clave: 'rnk.tu.puesto', vars: { n: '7' } })
    expect(textoBanda({ ranking: 'fortunas', mio: { puesto: 100, total: 140, franja: 75, cifra: 3150 } }))
      .toEqual({ clave: 'rnk.tu.puesto', vars: { n: '100' } })
  })

  it('fuera del top: puesto con miles y la franja DEL SERVIDOR, sin recalcular', () => {
    // 1.482 de 4.940 sería «dentro del 30 %»; el servidor manda 35 y se pinta 35.
    expect(textoBanda({ ranking: 'maestros', mio: { puesto: 1482, total: 4940, franja: 35, cifra: 3 } }))
      .toEqual({ clave: 'rnk.tu.franja', vars: { n: '1.482', p: 35 } })
    expect(textoBanda({ ranking: 'maestros', mio: { puesto: 101, total: 130, franja: 80, cifra: 1 } }))
      .toEqual({ clave: 'rnk.tu.franja', vars: { n: '101', p: 80 } })
  })
})

describe('RNK-1c · estadoDe', () => {
  it('sin respuesta todavía → cargando', () => {
    expect(estadoDe(null)).toBe('cargando')
  })

  it('cualquiera de las dos llamadas sin red → sinred', () => {
    expect(estadoDe({ ranking: 'maestros', top: SINRED, mio: mioOk(null) })).toBe('sinred')
    expect(estadoDe({ ranking: 'fortunas', top: ok([{ puesto: 1 }]), mio: SINRED })).toBe('sinred')
  })

  it('Maestros sin ninguna fila → vacio; con filas → listo', () => {
    expect(estadoDe({ ranking: 'maestros', top: ok([]), mio: mioOk(null) })).toBe('vacio')
    expect(estadoDe({ ranking: 'maestros', top: ok([{ puesto: 1 }]), mio: mioOk(null) })).toBe('listo')
  })

  it('Fortunas nunca está vacío: sin filas sigue siendo listo', () => {
    expect(estadoDe({ ranking: 'fortunas', top: ok([]), mio: mioOk(null) })).toBe('listo')
  })
})

describe('RNK-1c · cifraTexto', () => {
  it('separador de miles de la casa (montoTexto)', () => {
    expect(cifraTexto(1482)).toBe('1.482')
    expect(cifraTexto(13050)).toBe('13.050')
    expect(cifraTexto(48700)).toBe('48.700')
    expect(cifraTexto(7)).toBe('7')
    expect(cifraTexto(0)).toBe('0')
  })
})

describe('RNK-1c · Ajuste A · «Se muestran los 100 primeros.» sólo con 100 filas', () => {
  const filas = (n) => Array.from({ length: n }, (_, i) => ({ puesto: i + 1, username: `j${i}`, cifra: 1 }))

  it('exactamente 100 → se pinta', () => {
    expect(muestraFin(filas(100))).toBe(true)
  })

  it('con menos (la base real de hoy: 1 en Maestros, 6 en Fortunas) → nada', () => {
    for (const n of [0, 1, 6, 99]) expect(muestraFin(filas(n))).toBe(false)
  })

  it('sin lista, nada', () => {
    expect(muestraFin(null)).toBe(false)
    expect(muestraFin(undefined)).toBe(false)
  })
})

describe('RNK-1c · esTu', () => {
  it('por username sin mayúsculas', () => {
    expect(esTu({ username: 'Test1976' }, 'test1976')).toBe(true)
    expect(esTu({ username: 'test1976' }, 'TEST1976')).toBe(true)
    expect(esTu({ username: 'test19760' }, 'test1976')).toBe(false)
  })

  it('sin usuario o sin nombre, nunca', () => {
    expect(esTu({ username: '' }, '')).toBe(false)
    expect(esTu({ username: 'x' }, null)).toBe(false)
    expect(esTu(null, 'x')).toBe(false)
  })
})
