// MED-1a T2 · `registrar_evento` desde el cliente: dispara y olvida.
import { describe, expect, it, vi } from 'vitest'
import { reconexionAlArrancar, registrarEvento } from './eventos'

const SALA = '22222222-2222-4222-8222-222222222222'
const clienteDe = (rpc) => ({ rpc: vi.fn(rpc ?? (() => Promise.resolve({ data: true, error: null }))) })

describe('MED-1a T2 · registrarEvento', () => {
  it('llama a la RPC con su tipo y sus datos', () => {
    const c = clienteDe()
    registrarEvento(c, 'pvp_reconexion', { via: 'canal', sala: SALA })
    expect(c.rpc.mock.calls).toEqual([['registrar_evento', { p_tipo: 'pvp_reconexion', p_datos: { via: 'canal', sala: SALA } }]])
  })

  // Un rechazo sin manejar haría fallar la corrida entera de vitest: «después» lo vigila él.
  it('un `false`, un rechazo o un cliente roto no lanzan, ni ahora ni después', async () => {
    for (const rpc of [() => Promise.resolve({ data: false, error: null }), () => Promise.reject(new Error('red')), () => { throw new Error('síncrono') }]) {
      expect(() => registrarEvento(clienteDe(rpc), 'pvp_reconexion')).not.toThrow()
    }
    expect(() => registrarEvento(null, 'pvp_reconexion')).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
  })

  it('PostgREST no sale hasta que alguien llama a `then`: aquí se llama', () => {
    const then = vi.fn()
    registrarEvento({ rpc: () => ({ then }) }, 'pvp_reconexion')
    expect(then).toHaveBeenCalledTimes(1)
  })
})

describe('MED-1a T2 · reconexionAlArrancar (el arranque de `App`)', () => {
  it('el arranque trae la partida viva: una fila `via: arranque` con la sala', () => {
    const c = clienteDe()
    reconexionAlArrancar(c, { id: SALA, estado: 'activa' })
    expect(c.rpc.mock.calls).toEqual([['registrar_evento', { p_tipo: 'pvp_reconexion', p_datos: { via: 'arranque', sala: SALA } }]])
  })

  it('la mesa todavía en espera (el paso normal a la partida es desde `SalaEspera`): nada', () => {
    const c = clienteDe()
    for (const mesa of [{ id: SALA, estado: 'esperando' }, { id: null, estado: 'activa' }, null, undefined]) reconexionAlArrancar(c, mesa)
    expect(c.rpc).not.toHaveBeenCalled()
  })
})
