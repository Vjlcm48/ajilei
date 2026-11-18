// MED-1a T2 · `origen`: de dónde vino la cuenta, hasta el Bautizo.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizarCampana, olvidarOrigen, origenParaPerfil, recogerOrigen } from './origen'
import { insertarPerfil } from '../hooks/useAuth'

const DIA = 24 * 60 * 60 * 1000
const T0 = Date.parse('2026-11-17T15:00:00.000Z')

// El check de la base, leído de la migración: el normalizador obedece a la base.
const MIGRACION = readFileSync(new URL('../../supabase/migrations/20261116120000_med1a_eventos.sql', import.meta.url), 'utf8')
const CHECK = new RegExp(MIGRACION.match(/check \(origen ~ '([^']+)'\)/)[1])

function almacenFalso() {
  const m = new Map()
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
  }
}

let almacen
beforeEach(() => {
  almacen = almacenFalso()
  vi.stubGlobal('localStorage', almacen)
  vi.stubGlobal('navigator', { language: 'es-VE' })
})
afterEach(() => vi.unstubAllGlobals())

describe('MED-1a T2 · normalizarCampana frente al check de la migración', () => {
  it('el check sale de la migración, y es el que dice la ficha', () => {
    expect(CHECK.source).toBe('^(directo|utm:[a-z0-9_-]{1,40}|invitacion|tienda)$')
  })

  it.each([
    ['Ola0-Test', 'ola0-test'],
    ['Día de la Madre!', 'diadelamadre'],
    ['x'.repeat(60), 'x'.repeat(40)],
    ['  Verano_26 / B  ', 'verano_26b'],
    ['🎉ÑANDÚ🎉', 'nandu'],
  ])('%j → %j, y `utm:` + eso pasa el check', (entrada, salida) => {
    expect(normalizarCampana(entrada)).toBe(salida)
    expect(CHECK.test(`utm:${normalizarCampana(entrada)}`)).toBe(true)
  })

  it('lo que queda vacío no pasa el check: por eso `recogerOrigen` cae a `directo`', () => {
    for (const v of ['', null, undefined, '!!!', '🎉']) expect(normalizarCampana(v)).toBe('')
    expect(CHECK.test('utm:')).toBe(false)
  })

  it('mil textos al azar: o vacío, o `utm:<normalizado>` pasa el check', () => {
    let semilla = 7
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla }
    for (let i = 0; i < 1000; i++) {
      const s = Array.from({ length: azar() % 80 }, () => String.fromCodePoint(32 + (azar() % 400))).join('')
      const n = normalizarCampana(s)
      expect(n === '' || CHECK.test(`utm:${n}`), JSON.stringify(s)).toBe(true)
    }
  })
})

describe('MED-1a T2 · recogerOrigen: primer toque, 30 días', () => {
  it('con utm_campaign: utm:<campaña>, y los utm_* a minúsculas y 60', () => {
    const g = recogerOrigen('?utm_source=Prueba&utm_medium=WhatsApp&utm_campaign=Ola0-Test&utm_content=' + 'A'.repeat(80), T0)
    expect(g).toEqual({
      origen: 'utm:ola0-test',
      datos: { utm_source: 'prueba', utm_medium: 'whatsapp', utm_campaign: 'ola0-test', utm_content: 'a'.repeat(60) },
      llegada: '2026-11-17T15:00:00.000Z',
    })
    expect(JSON.parse(almacen.getItem('ajilei.origen'))).toEqual(g)
  })

  it('solo utm_source: hace de campaña', () => {
    expect(recogerOrigen('?utm_source=TikTok', T0).origen).toBe('utm:tiktok')
  })

  it('?sala= sin utm: invitacion, con el código en datos.sala', () => {
    expect(recogerOrigen('?sala=K7Q2MX', T0)).toMatchObject({ origen: 'invitacion', datos: { sala: 'K7Q2MX' } })
  })

  it('nada: directo, y se guarda igual (la llegada cuenta)', () => {
    expect(recogerOrigen('', T0)).toEqual({ origen: 'directo', datos: {}, llegada: '2026-11-17T15:00:00.000Z' })
  })

  it('una campaña que queda vacía al normalizar: directo', () => {
    expect(recogerOrigen('?utm_campaign=!!!', T0).origen).toBe('directo')
  })

  it('primer toque: lo vigente no se sobrescribe', () => {
    recogerOrigen('?utm_campaign=primera', T0)
    expect(recogerOrigen('?utm_campaign=segunda', T0 + 29 * DIA).origen).toBe('utm:primera')
    expect(recogerOrigen('?sala=ABC', T0 + DIA).origen).toBe('utm:primera')
  })

  it('a los 30 días caduca y manda la visita nueva', () => {
    recogerOrigen('?utm_campaign=primera', T0)
    expect(recogerOrigen('?utm_campaign=segunda', T0 + 30 * DIA)).toMatchObject({ origen: 'utm:segunda', llegada: new Date(T0 + 30 * DIA).toISOString() })
  })

  it('lo guardado fuera de formato (tocado a mano) no vale: se recoge de nuevo', () => {
    almacen.setItem('ajilei.origen', JSON.stringify({ origen: 'utm:Verano', datos: {}, llegada: new Date(T0).toISOString() }))
    expect(recogerOrigen('', T0).origen).toBe('directo')
    almacen.setItem('ajilei.origen', '{roto')
    expect(recogerOrigen('?utm_campaign=x1', T0).origen).toBe('utm:x1')
  })

  it('sin almacén, o con uno que lanza: no rompe', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('bloqueado') }, setItem() { throw new Error('bloqueado') }, removeItem() { throw new Error('bloqueado') } })
    expect(() => recogerOrigen('?utm_campaign=x', T0)).not.toThrow()
    expect(origenParaPerfil(T0).origen).toBe('directo')
    expect(() => olvidarOrigen()).not.toThrow()
  })
})

describe('MED-1a T2 · origenParaPerfil y olvidarOrigen', () => {
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone

  it('con almacén: su origen y sus datos, más zona horaria, idioma y la llegada guardada', () => {
    recogerOrigen('?utm_source=prueba&utm_campaign=Ola0-Test&sala=K7Q2MX', T0)
    expect(origenParaPerfil(T0 + DIA)).toEqual({
      origen: 'utm:ola0-test',
      origen_datos: { utm_source: 'prueba', utm_campaign: 'ola0-test', sala: 'K7Q2MX', zona_horaria: zona, idioma: 'es-VE', llegada: '2026-11-17T15:00:00.000Z' },
    })
  })

  it('sin almacén: directo, con zona horaria, idioma y llegada = ahora', () => {
    expect(origenParaPerfil(T0)).toEqual({ origen: 'directo', origen_datos: { zona_horaria: zona, idioma: 'es-VE', llegada: '2026-11-17T15:00:00.000Z' } })
  })

  it('sin Intl ni navigator: directo con la llegada, sin lanzar', () => {
    vi.stubGlobal('Intl', undefined)
    vi.stubGlobal('navigator', undefined)
    expect(origenParaPerfil(T0)).toEqual({ origen: 'directo', origen_datos: { llegada: '2026-11-17T15:00:00.000Z' } })
  })

  it('origen_datos con todo lleno no se acerca a 2 KB', () => {
    recogerOrigen('?' + ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map((k) => `${k}=${'ñ'.repeat(200)}`).join('&') + '&sala=' + 'Z'.repeat(200), T0)
    const datos = origenParaPerfil(T0).origen_datos
    expect(Object.keys(datos)).toEqual(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'sala', 'zona_horaria', 'idioma', 'llegada'])
    expect([datos.utm_source.length, datos.sala.length]).toEqual([60, 20])
    expect(new TextEncoder().encode(JSON.stringify(datos)).length).toBeLessThan(800)
  })

  it('olvidarOrigen borra la clave; después, directo', () => {
    almacen.setItem('ajilei.origen', JSON.stringify({ origen: 'utm:x1', datos: {}, llegada: new Date(T0).toISOString() }))
    olvidarOrigen()
    expect(almacen.getItem('ajilei.origen')).toBe(null)
    expect(origenParaPerfil(T0).origen).toBe('directo')
  })
})

describe('MED-1a T2 · el Bautizo nunca se pierde por la medición (insertarPerfil)', () => {
  const MEDICION = { origen: 'utm:ola0-test', origen_datos: { zona_horaria: 'America/Caracas' } }
  const FILA = { id: 'u1', username: 'jugador_1', pais: null, estado: null }
  const CHECK_ORIGEN = { code: '23514', message: 'new row for relation "profiles" violates check constraint "profiles_origen_chk"' }

  it('el insert lleva origen y origen_datos', async () => {
    const api = { crear: vi.fn(async () => ({ data: FILA, error: null })) }
    expect(await insertarPerfil(api, 'u1', 'jugador_1', MEDICION)).toEqual({ data: FILA, error: null })
    expect(api.crear.mock.calls).toEqual([['u1', 'jugador_1', MEDICION]])
  })

  it('el check de origen falla (23514): se repite UNA vez sin origen y el Bautizo sale', async () => {
    const api = { crear: vi.fn(async (_u, _n, m) => (m ? { data: null, error: CHECK_ORIGEN } : { data: FILA, error: null })) }
    expect(await insertarPerfil(api, 'u1', 'jugador_1', MEDICION)).toEqual({ data: FILA, error: null })
    expect(api.crear.mock.calls).toEqual([['u1', 'jugador_1', MEDICION], ['u1', 'jugador_1']])
  })

  it('el check del nombre (23514 también): el segundo intento lo repite y vuelve su error', async () => {
    const malo = { code: '23514', message: 'violates check constraint "profiles_username_check"' }
    const api = { crear: vi.fn(async () => ({ data: null, error: malo })) }
    expect(await insertarPerfil(api, 'u1', 'x', MEDICION)).toEqual({ data: null, error: malo })
    expect(api.crear).toHaveBeenCalledTimes(2)
  })

  it('otro error (23505, red) no se repite aquí: lo trata crearPerfil como siempre', async () => {
    for (const error of [{ code: '23505' }, { message: 'Failed to fetch' }]) {
      const api = { crear: vi.fn(async () => ({ data: null, error })) }
      expect(await insertarPerfil(api, 'u1', 'jugador_1', MEDICION)).toEqual({ data: null, error })
      expect(api.crear).toHaveBeenCalledTimes(1)
    }
  })
})
