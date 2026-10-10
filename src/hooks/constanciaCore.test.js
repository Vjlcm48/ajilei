import { describe, it, expect } from 'vitest'
import {
  CICLO_CONSTANCIA, ESPERA_MARCAR_MS, diaChicago, debeMarcar, fichaTrasMarcar, monedaPosada, soltarAvisoDeFicha,
} from './constanciaCore'
import {
  encolarAviso, sacarAviso, sustituirFila, desdeAlSustituir, HUECO_FILA_MS, nuevoIdAviso, avisoDeVuelta,
} from './avisoSaldoCore'

// ── ECO-1d · la constancia en el teléfono (plan del STOP-1 §1 y §4) ─────────

// 2026-10-09 15:00 UTC = 10:00 en Chicago (CDT, UTC−5).
const T0 = Date.UTC(2026, 9, 9, 15, 0, 0)

describe('ECO-1d · el día de Chicago', () => {
  it('cambia a la medianoche de Chicago, no a la de UTC', () => {
    expect(diaChicago(T0)).toBe('2026-10-09')
    expect(diaChicago(Date.UTC(2026, 9, 10, 4, 59))).toBe('2026-10-09')   // 23:59 CDT
    expect(diaChicago(Date.UTC(2026, 9, 10, 5, 1))).toBe('2026-10-10')    // 00:01 CDT
  })
  it('con el horario de invierno (CST, UTC−6) también', () => {
    expect(diaChicago(Date.UTC(2026, 11, 1, 5, 30))).toBe('2026-11-30')
    expect(diaChicago(Date.UTC(2026, 11, 1, 6, 30))).toBe('2026-12-01')
  })
})

describe('ECO-1d · cuándo se pregunta al volver a primer plano', () => {
  const base = { ultimoDia: '2026-10-09', enVuelo: false, ultimaLlamada: T0 - ESPERA_MARCAR_MS }
  it('el mismo día: no', () => {
    expect(debeMarcar(base, T0)).toBe(false)
  })
  it('cambió el día y pasó el minuto: sí', () => {
    expect(debeMarcar(base, Date.UTC(2026, 9, 10, 15))).toBe(true)
  })
  it('nunca en ráfaga: con una en vuelo, o antes de 60 s desde la última, no', () => {
    const mañana = Date.UTC(2026, 9, 10, 15)
    expect(debeMarcar({ ...base, enVuelo: true }, mañana)).toBe(false)
    expect(debeMarcar({ ...base, ultimaLlamada: mañana - 1000 }, mañana)).toBe(false)
  })
  it('si el arranque no obtuvo día (red, límite), lo vuelve a intentar pasado el minuto', () => {
    expect(debeMarcar({ ultimoDia: null, enVuelo: false, ultimaLlamada: T0 }, T0 + 30_000)).toBe(false)
    expect(debeMarcar({ ultimoDia: null, enVuelo: false, ultimaLlamada: T0 }, T0 + ESPERA_MARCAR_MS)).toBe(true)
  })
})

describe('ECO-1d · la ficha del lobby (ubicación A)', () => {
  const ok = (dia, cobrado = 0) => ({ codigo: 'ok', diaDelCiclo: dia, cobrado })
  it('un ingreso nuevo posa la moneda del día; ya_marcado no la hace saltar otra vez', () => {
    const f1 = fichaTrasMarcar(null, ok(1))
    expect(f1).toEqual({ lleno: 1, posa: 1, avisoId: null })
    expect(fichaTrasMarcar(f1, { codigo: 'ya_marcado', diaDelCiclo: 1, cobrado: 0 })).toEqual(f1)
    expect(fichaTrasMarcar(f1, ok(2))).toEqual({ lleno: 2, posa: 2, avisoId: null })
  })
  it('el día del cobro la moneda espera a su aviso', () => {
    const f = fichaTrasMarcar(null, ok(3, 500), 'aviso-9')
    expect(f).toEqual({ lleno: 3, posa: 1, avisoId: 'aviso-9' })
    expect(monedaPosada(f, null, false)).toBe(false)
    expect(monedaPosada(f, { id: 'aviso-1' }, true)).toBe(false)       // la recogida va delante
    expect(monedaPosada(f, { id: 'aviso-9' }, false)).toBe(false)      // su aviso, antes de contar
    expect(monedaPosada(f, { id: 'aviso-9' }, true)).toBe(true)
    expect(monedaPosada(soltarAvisoDeFicha(f), null, false)).toBe(true)
  })
  it('red, límite o sin datos: la ficha no cambia', () => {
    const f = { lleno: 2, posa: 1, avisoId: null }
    expect(fichaTrasMarcar(f, { codigo: 'red' })).toBe(f)
    expect(fichaTrasMarcar(f, { codigo: 'limite', diaDelCiclo: 0 })).toBe(f)
    expect(fichaTrasMarcar(null, { codigo: 'red' })).toBe(null)
  })
  it('el ciclo es de 3', () => {
    expect(CICLO_CONSTANCIA).toBe(3)
  })
})

describe('ECO-1d · la fila de avisos', () => {
  const a = avisoDeVuelta({ cobrado: 1350, saldo: 6350 }, { conMonto: 'r', cero: 'r0' })
  const c = avisoDeVuelta({ cobrado: 500, saldo: 6850 }, { conMonto: 'c', cero: 'c' })
  it('dos avisos nacidos seguidos tienen ids distintos', () => {
    expect(a.id).not.toBe(c.id)
    expect(nuevoIdAviso()).not.toBe(nuevoIdAviso())
  })
  it('van en fila: el segundo entra cuando sale el primero, tras el hueco, y cuenta desde donde acabó aquél', () => {
    let fila = encolarAviso(encolarAviso([], a), c)
    expect(fila.map((x) => x.id)).toEqual([a.id, c.id])
    expect(sacarAviso(fila, c.id)).toBe(fila)           // sólo sale el primero
    fila = sacarAviso(fila, a.id)
    expect(fila).toEqual([{ ...c, espera: HUECO_FILA_MS }])
    expect(fila[0].desde).toBe(a.hasta)
    expect(sacarAviso(fila, c.id)).toEqual([])
  })
  it('C5/C6 sustituyen la fila y heredan la cifra visible: la píldora no retrocede ni pierde nada', () => {
    const c5 = avisoDeVuelta({ cobrado: 700, saldo: 7550 }, { conMonto: 'x', cero: 'x' })
    expect(sustituirFila(c5)).toEqual([{ ...c5, sustituye: true }])
    // La constancia iba por 6.700 (de 6.350 a 6.850): el C5 cuenta de 6.700 a 7.550.
    expect(desdeAlSustituir(6700, c5)).toBe(6700)
    expect(desdeAlSustituir(null, c5)).toBe(c5.desde)
    expect(desdeAlSustituir(9999, c5)).toBe(c5.hasta)
  })
})
