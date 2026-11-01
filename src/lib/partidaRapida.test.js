import { describe, it, expect } from 'vitest'
import { crearPartidaRapida, factorDeMano, FACTOR_RAPIDA } from './partidaRapida'
import { crearConsultaConfirmada } from './consultaConfirmada'
import { crearConsultaApi, traducirConsulta, traducirMiConsulta } from './consultaApi'
import { ENTRADA, ENTRADAS_PANEL, VIVAS_ESCRITORIO, VIVAS_MOVIL, presentesDe, filasDelPanel, altoPanel } from '../config/menuEntradas'

// ── CFG-1 1e · Partida rápida, la confirmación de la sesión, la API de Mano
// actual y el contrato de entradas del ⋮ ────────────────────────────────────

function almacenFalso() {
  const datos = new Map()
  return {
    datos,
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)) },
  }
}
const roto = { getItem() { throw new Error('bloqueado') }, setItem() { throw new Error('lleno') } }

describe('CFG-1 1e · partidaRapida (INV-70)', () => {
  it('por defecto, no', () => {
    expect(crearPartidaRapida(() => almacenFalso()).leer()).toBe(false)
  })
  it('guarda «si» / «no» bajo ajilei.partidaRapida, y nada más', () => {
    const a = almacenFalso()
    const r = crearPartidaRapida(() => a)
    r.guardar(true)
    expect([...a.datos.entries()]).toEqual([['ajilei.partidaRapida', 'si']])
    expect(r.leer()).toBe(true)
    r.guardar(false)
    expect(a.datos.get('ajilei.partidaRapida')).toBe('no')
    expect(r.leer()).toBe(false)
  })
  it('un almacén que falla se lee como «no» y guardar no lanza', () => {
    const r = crearPartidaRapida(() => roto)
    expect(r.leer()).toBe(false)
    expect(() => r.guardar(true)).not.toThrow()
  })
  it('el factor: ×0,5 sólo contra las IAS y encendida', () => {
    expect(FACTOR_RAPIDA).toBe(0.5)
    expect(factorDeMano(true, true)).toBe(0.5)
    expect(factorDeMano(true, false)).toBe(1)
    expect(factorDeMano(false, true)).toBe(1)
  })
})

describe('CFG-1 1e · consultaConfirmada', () => {
  it('sin marca pregunta; marcada, no; la clave es ajilei.consultaConfirmada', () => {
    const a = almacenFalso()
    const c = crearConsultaConfirmada(() => a)
    expect(c.leer()).toBe(false)
    c.marcar()
    expect([...a.datos.entries()]).toEqual([['ajilei.consultaConfirmada', 'si']])
    expect(c.leer()).toBe(true)
  })
  it('sin almacén se vuelve a preguntar (el lado seguro)', () => {
    const c = crearConsultaConfirmada(() => roto)
    expect(() => c.marcar()).not.toThrow()
    expect(c.leer()).toBe(false)
  })
})

describe('CFG-1 1e · consultaApi', () => {
  it('llama a las dos RPC con sus parámetros y traduce la fila', async () => {
    const llamadas = []
    const api = crearConsultaApi({
      rpc: async (nombre, params) => {
        llamadas.push([nombre, params])
        return nombre === 'mi_consulta'
          ? { data: { gratis_restantes: 13, ultima_mesa: null, ultima_mano: null }, error: null }
          : { data: [{ resultado: 'gratis', precio: 100, gratis_restantes: 12, saldo: '4500' }], error: null }
      },
    })
    expect(await api.mi()).toEqual({ gratis_restantes: 13, ultima_mesa: null, ultima_mano: null })
    expect(await api.consultar('m1', 3)).toEqual({ resultado: 'gratis', precio: 100, gratis_restantes: 12, saldo: 4500 })
    expect(llamadas).toEqual([['mi_consulta', undefined], ['consultar_mano', { p_mesa: 'm1', p_mano: 3 }]])
  })
  it('un error, una excepción o una forma ajena dan null', async () => {
    expect(await crearConsultaApi({ rpc: async () => ({ data: null, error: { code: '42501' } }) }).consultar('m', 1)).toBe(null)
    expect(await crearConsultaApi({ rpc: async () => { throw new Error('red') } }).mi()).toBe(null)
    expect(traducirConsulta({ foo: 1 })).toBe(null)
    expect(traducirMiConsulta({ gratis_restantes: 'x' })).toBe(null)
  })
})

describe('CFG-1 1e · las entradas del ⋮', () => {
  it('salen Cuenta y Saldo; entra Partida rápida; los IDs retirados no vuelven', () => {
    // TIE-1 1a · sale también Tapetes: el tapete se elige en la tienda.
    expect(ENTRADAS_PANEL).toEqual(['sonido', 'reacciones', 'rapida', 'mano'])
    expect(Object.values(ENTRADA)).not.toContain('saldo')
    expect(Object.values(ENTRADA)).not.toContain('cuenta')
    expect(Object.values(ENTRADA)).not.toContain('tapetes')
    expect(VIVAS_ESCRITORIO).toContain(ENTRADA.RAPIDA)
    expect(VIVAS_MOVIL).toContain(ENTRADA.RAPIDA)
  })
  it('Partida rápida sólo monta contra las IAS, y el panel mide sus filas', () => {
    expect(presentesDe(true)).toBe(null)
    expect(presentesDe(false)).toEqual(['sonido', 'reacciones', 'mano'])
    expect(filasDelPanel(true)).toBe(4)
    expect(filasDelPanel(false)).toBe(3)
    expect(altoPanel(4)).toBe(200)
    expect(altoPanel(3)).toBe(156)
  })
})
