// MED-1a T2 · el latido de sesión (`crearLatido`), con el reloj falso y sin red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LATIDO_MS, OCULTA_MAX_MS, crearLatido, idSesion, sesionPara } from './useLatidoSesion'

const MIN = 60 * 1000

function documentoFalso() {
  const oyentes = new Set()
  return {
    visibilityState: 'visible',
    addEventListener: (tipo, f) => { if (tipo === 'visibilitychange') oyentes.add(f) },
    removeEventListener: (tipo, f) => { if (tipo === 'visibilitychange') oyentes.delete(f) },
    poner(estado) { this.visibilityState = estado; oyentes.forEach((f) => f()) },
    oyentes,
  }
}

function montar({ responder = () => true } = {}) {
  let n = 0
  const ids = []
  const documento = documentoFalso()
  const latir = vi.fn(async (id) => { ids.push(id); return responder(id) })
  const sesion = { id: 'id-0' }
  const latido = crearLatido({ latir, sesion, documento, nuevoId: () => `id-${++n}`, ahora: () => Date.now() })
  return { latido, latir, ids, documento, sesion }
}

// Deja correr las promesas de `latir` (el `then` que lee el booleano).
const promesas = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-11-17T15:00:00Z')) })
afterEach(() => vi.useRealTimers())

describe('MED-1a T2 · el latido de sesión', () => {
  it('las constantes de la ficha: 60 s y 5 min', () => {
    expect([LATIDO_MS, OCULTA_MAX_MS]).toEqual([60000, 300000])
  })

  it('primer latido inmediato, y después cada 60 s', async () => {
    const { latido, ids } = montar()
    latido.iniciar()
    expect(ids).toEqual(['id-0'])
    await vi.advanceTimersByTimeAsync(LATIDO_MS - 1)
    expect(ids).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(ids).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(3 * LATIDO_MS)
    expect(ids).toEqual(['id-0', 'id-0', 'id-0', 'id-0', 'id-0'])
  })

  it('se para con la app oculta: ni un latido mientras tanto', async () => {
    const { latido, ids, documento } = montar()
    latido.iniciar()
    documento.poner('hidden')
    await vi.advanceTimersByTimeAsync(4 * MIN)
    expect(ids).toHaveLength(1)
  })

  it('vuelve tras 4 min oculta: mismo id, latido al instante y la cadencia sigue', async () => {
    const { latido, ids, documento } = montar()
    latido.iniciar()
    documento.poner('hidden')
    await vi.advanceTimersByTimeAsync(4 * MIN)
    documento.poner('visible')
    expect(ids).toEqual(['id-0', 'id-0'])
    await vi.advanceTimersByTimeAsync(LATIDO_MS)
    expect(ids).toEqual(['id-0', 'id-0', 'id-0'])
  })

  it('vuelve tras 6 min oculta: id nuevo', async () => {
    const { latido, ids, documento } = montar()
    latido.iniciar()
    documento.poner('hidden')
    await vi.advanceTimersByTimeAsync(6 * MIN)
    documento.poner('visible')
    await vi.advanceTimersByTimeAsync(LATIDO_MS)
    expect(ids).toEqual(['id-0', 'id-1', 'id-1'])
  })

  it('el corte es 5 min justos: 4:59 sigue, 5:00 abre otra', async () => {
    const a = montar()
    a.latido.iniciar(); a.documento.poner('hidden')
    await vi.advanceTimersByTimeAsync(OCULTA_MAX_MS - 1000)
    a.documento.poner('visible')
    expect(a.ids.at(-1)).toBe('id-0')
    a.latido.parar()
    const b = montar()
    b.latido.iniciar(); b.documento.poner('hidden')
    await vi.advanceTimersByTimeAsync(OCULTA_MAX_MS)
    b.documento.poner('visible')
    expect(b.ids.at(-1)).toBe('id-1')
  })

  it('un `false` de la base: id nuevo en el siguiente latido', async () => {
    const { latido, ids } = montar({ responder: (id) => id !== 'id-0' })
    latido.iniciar()
    await promesas()
    await vi.advanceTimersByTimeAsync(LATIDO_MS)
    await vi.advanceTimersByTimeAsync(LATIDO_MS)
    expect(ids).toEqual(['id-0', 'id-1', 'id-1'])
  })

  it('un fallo de red no lanza, no reintenta y no cambia el id', async () => {
    const { latido, latir, ids } = montar()
    latir.mockImplementationOnce(async () => { throw new Error('Failed to fetch') })
    latir.mockImplementationOnce(() => { throw new Error('síncrono') })
    expect(() => latido.iniciar()).not.toThrow()
    await promesas()
    expect(latir).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(LATIDO_MS - 1)
    expect(latir).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    await vi.advanceTimersByTimeAsync(LATIDO_MS)
    expect(latir).toHaveBeenCalledTimes(3)
    expect(ids).toEqual(['id-0'])
    expect(latir.mock.calls.map((c) => c[0])).toEqual(['id-0', 'id-0', 'id-0'])
  })

  it('un `null` (error de PostgREST) tampoco cambia el id', async () => {
    const { latido, ids } = montar({ responder: () => null })
    latido.iniciar()
    await promesas()
    await vi.advanceTimersByTimeAsync(LATIDO_MS)
    expect(ids).toEqual(['id-0', 'id-0'])
  })

  it('nace oculta: no late hasta verse; parar quita el oyente y el reloj', async () => {
    const { latido, ids, documento } = montar()
    documento.visibilityState = 'hidden'
    latido.iniciar()
    expect(ids).toEqual([])
    documento.poner('visible')
    expect(ids).toEqual(['id-0'])
    latido.parar()
    expect(documento.oyentes.size).toBe(0)
    await vi.advanceTimersByTimeAsync(5 * LATIDO_MS)
    expect(ids).toEqual(['id-0'])
  })

  it('StrictMode: el mismo objeto `sesion` en el segundo montaje da el mismo id', async () => {
    const { latido, ids, sesion, documento, latir } = montar()
    latido.iniciar(); latido.parar()
    const otra = crearLatido({ latir, sesion, documento, nuevoId: () => 'otro' })
    otra.iniciar()
    expect(ids).toEqual(['id-0', 'id-0'])
  })

  it('idSesion da un uuid v4', () => {
    expect(idSesion()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe('MED-1a T2 · tras el túnel (T-2): el id es de la carga, y volver late en el acto', () => {
  it('un `visible` sin `hidden` antes (la pestaña congelada sin avisar): mismo id, latido en el acto y la cadencia arranca de ahí', async () => {
    const { latido, ids, documento } = montar()
    latido.iniciar()
    await vi.advanceTimersByTimeAsync(30 * 1000)
    documento.poner('visible')
    expect(ids).toEqual(['id-0', 'id-0'])
    await vi.advanceTimersByTimeAsync(LATIDO_MS - 1)
    expect(ids).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(ids).toEqual(['id-0', 'id-0', 'id-0'])
  })

  it('volver tras un bloqueo corto late en el acto, antes del siguiente tic', async () => {
    const { latido, ids, documento } = montar()
    latido.iniciar()
    await vi.advanceTimersByTimeAsync(10 * 1000)
    documento.poner('hidden')
    await vi.advanceTimersByTimeAsync(MIN)
    documento.poner('visible')
    expect(ids).toEqual(['id-0', 'id-0'])
  })

  it('sesionPara: la misma cuenta en la misma carga da la misma sesión, la remonte quien la remonte', () => {
    let n = 0
    const nuevoId = () => `carga-${++n}`
    const a = sesionPara('uid-a', nuevoId)
    expect(sesionPara('uid-a', nuevoId)).toBe(a)
    expect(sesionPara('uid-a', nuevoId).id).toBe(a.id)
    const b = sesionPara('uid-b', nuevoId)
    expect(b.id).not.toBe(a.id)
    expect(sesionPara('uid-b', nuevoId)).toBe(b)
  })

  it('un remontaje (otro crearLatido con la sesión de la carga) sigue con el id, aunque el anterior lo cambiara', async () => {
    const { latir, ids, documento } = montar({ responder: (id) => id !== 'x-0' })
    let n = 0
    const nuevoId = () => `x-${n++}`
    const sesion = sesionPara('uid-remonta', nuevoId)
    const uno = crearLatido({ latir, sesion: sesionPara('uid-remonta', nuevoId), documento, nuevoId })
    uno.iniciar()
    await promesas()
    uno.parar()
    const dos = crearLatido({ latir, sesion: sesionPara('uid-remonta', nuevoId), documento, nuevoId })
    dos.iniciar()
    expect(ids).toEqual(['x-0', 'x-1'])
    expect(sesion.id).toBe('x-1')
    dos.parar()
  })
})
