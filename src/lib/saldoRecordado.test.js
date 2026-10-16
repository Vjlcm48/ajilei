import { describe, it, expect } from 'vitest'
import { crearSaldoRecordado } from './saldoRecordado'

// ── IOS-1c · el último saldo visto, en el aparato (S2) ──────────────────────

const UNO = 'aaaaaaaa-0000-4000-8000-000000000001'
const DOS = 'aaaaaaaa-0000-4000-8000-000000000002'

function almacenFalso() {
  const datos = new Map()
  return {
    datos,
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)) },
    removeItem: (k) => { datos.delete(k) },
  }
}

describe('IOS-1c · saldoRecordado', () => {
  it('guarda una sola entrada, con su dueño, bajo ajilei.saldoVisto', () => {
    const a = almacenFalso()
    const r = crearSaldoRecordado(() => a)
    r.guardar(UNO, 12450, 7)
    expect([...a.datos.keys()]).toEqual(['ajilei.saldoVisto'])
    expect(r.leer(UNO)).toEqual({ uid: UNO, saldo: 12450, en: 7 })
  })

  it('otra cuenta no la ve nunca, y su primera cifra la sustituye', () => {
    const a = almacenFalso()
    const r = crearSaldoRecordado(() => a)
    r.guardar(UNO, 12450)
    expect(r.leer(DOS)).toBe(null)
    r.guardar(DOS, 300)
    expect(r.leer(UNO)).toBe(null)
    expect(r.leer(DOS).saldo).toBe(300)
  })

  it('sólo saldos: ni negativos, ni decimales, ni sin cuenta', () => {
    const a = almacenFalso()
    const r = crearSaldoRecordado(() => a)
    r.guardar(UNO, -5)
    r.guardar(UNO, 2.5)
    r.guardar(null, 100)
    expect(a.datos.size).toBe(0)
  })

  it('se borra al cerrar sesión', () => {
    const a = almacenFalso()
    const r = crearSaldoRecordado(() => a)
    r.guardar(UNO, 12450)
    r.borrar()
    expect(r.leer(UNO)).toBe(null)
  })

  it('un almacén roto, ausente o con basura es «no hay recuerdo», sin lanzar', () => {
    const roto = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') }, removeItem: () => { throw new Error('x') } }
    const r1 = crearSaldoRecordado(() => roto)
    expect(() => r1.guardar(UNO, 1)).not.toThrow()
    expect(r1.leer(UNO)).toBe(null)
    expect(() => r1.borrar()).not.toThrow()
    const r2 = crearSaldoRecordado(() => null)
    expect(r2.leer(UNO)).toBe(null)
    const a = almacenFalso()
    a.setItem('ajilei.saldoVisto', '{no es json')
    expect(crearSaldoRecordado(() => a).leer(UNO)).toBe(null)
  })
})
