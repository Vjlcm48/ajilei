import { describe, it, expect, vi } from 'vitest'

// `supabase.js` lee `import.meta.env` al cargar: un doble mínimo, como en las demás APIs.
vi.mock('./supabase', () => ({ supabase: { rpc: () => Promise.reject(new Error('sin red')) } }))

const { crearGuiadaApi, traducirPremio, premioDisponible, ESTADO_RED } = await import('./guiadaApi')
const { crearBanco } = await import('../dev/bancoImitado')

// ── TUT-1 T3 · guiadaApi: el envoltorio de las dos funciones del premio ─────
describe('TUT-1 T3 · guiadaApi', () => {
  it('traduce el objeto jsonb (y la fila, si viniera en lista)', () => {
    expect(traducirPremio({ estado: 'pagado', monto: 2000, tramo: 'limpio', saldo: 4500 }))
      .toEqual({ estado: 'pagado', monto: 2000, tramo: 'limpio', saldo: 4500 })
    expect(traducirPremio([{ estado: 'disponible', monto: '1000', tramo: 'jugado' }]))
      .toEqual({ estado: 'disponible', monto: 1000, tramo: 'jugado', saldo: null })
  })

  it('lo que no tiene forma es red', () => {
    for (const d of [null, undefined, 42, 'x', {}, { monto: 2000 }, []]) {
      expect(traducirPremio(d).estado).toBe(ESTADO_RED)
    }
  })

  it('sólo «disponible» con un monto positivo promete una cifra', () => {
    expect(premioDisponible({ estado: 'disponible', monto: 2000 })).toBe(true)
    expect(premioDisponible({ estado: 'disponible', monto: 0 })).toBe(false)
    expect(premioDisponible({ estado: 'cobrado', monto: 2000 })).toBe(false)
    expect(premioDisponible({ estado: ESTADO_RED, monto: 0 })).toBe(false)
    expect(premioDisponible(null)).toBe(false)
  })

  it('contra el banco imitado: estado, cobro y repetición', async () => {
    const api = crearGuiadaApi(crearBanco({ saldo: 2500 }))
    expect(await api.estado()).toEqual({ estado: 'disponible', monto: 2000, tramo: 'limpio', saldo: null })
    expect(await api.cobrar()).toEqual({ estado: 'pagado', monto: 2000, tramo: 'limpio', saldo: 4500 })
    expect((await api.cobrar()).estado).toBe('cobrado')
    expect((await api.estado()).estado).toBe('cobrado')
  })

  it('nunca rechaza: error de PostgREST, promesa rota o excepción del SDK son red', async () => {
    const conError = crearGuiadaApi({ rpc: () => Promise.resolve({ data: null, error: { code: 'XX000', message: 'x' } }) })
    const rota = crearGuiadaApi({ rpc: () => Promise.reject(new Error('caída')) })
    const lanza = crearGuiadaApi({ rpc: () => { throw new Error('sdk') } })
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const api of [conError, rota, lanza]) {
      expect((await api.cobrar()).estado).toBe(ESTADO_RED)
      expect((await api.estado()).estado).toBe(ESTADO_RED)
    }
    avisos.mockRestore()
  })
})
