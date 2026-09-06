import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CLAVE_SALA_PENDIENTE,
  PARAM_SALA,
  guardar,
  leer,
  borrar,
  recogerDeLaUrl,
} from './salaPendiente.js'

// ── SAL-A · El código que sobrevive al registro ─────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §4.3.
//
// El almacenamiento y la barra de direcciones se simulan sobre `globalThis.window`
// en vez de arrastrar jsdom, que este proyecto NO tiene. Es el molde exacto de
// `scripts/testTapetes.test.js:205-220`: lo que se sella es el contrato de
// lectura/escritura y su degradación, no el DOM.

let almacen
let urlActual
let reemplazos

const fakeStorage = () => ({
  getItem: (k) => (k in almacen ? almacen[k] : null),
  setItem: (k, v) => { almacen[k] = String(v) },
  removeItem: (k) => { delete almacen[k] },
})

function montarWindow(href = 'https://ajilei.app/') {
  almacen = {}
  urlActual = href
  reemplazos = []
  globalThis.window = {
    localStorage: fakeStorage(),
    get location() { return { href: urlActual } },
    history: {
      replaceState: (_estado, _titulo, url) => {
        reemplazos.push(url)
        urlActual = new URL(url, urlActual).href
      },
    },
  }
}

beforeEach(() => { montarWindow() })
afterEach(() => { delete globalThis.window })

describe('SAL-A · guardar y leer', () => {
  it('ida y vuelta con el código canónico', () => {
    expect(guardar('AJ-7K2M')).toBe('AJ-7K2M')
    expect(almacen[CLAVE_SALA_PENDIENTE]).toBe('AJ-7K2M')
    expect(leer()).toBe('AJ-7K2M')
  })

  it('NORMALIZA al guardar: lo que entra torcido sale canónico', () => {
    // Es la razón de que la escritura pase por este módulo y no por un `setItem`
    // suelto: lo que llega es un parámetro de URL escrito por quien sea.
    expect(guardar('aj 7k2m')).toBe('AJ-7K2M')
    expect(almacen[CLAVE_SALA_PENDIENTE]).toBe('AJ-7K2M')
    expect(leer()).toBe('AJ-7K2M')
  })

  it('no guarda basura, y no ensucia el almacenamiento intentándolo', () => {
    expect(guardar('AJ-0OI1')).toBe(null)
    expect(guardar('')).toBe(null)
    expect(guardar(null)).toBe(null)
    expect(Object.keys(almacen)).toEqual([])
  })

  it('en frío no hay nada que leer y no se siembra la clave', () => {
    // Misma doctrina que el tapete: una invitación que nadie mandó no se inventa
    // en disco.
    expect(leer()).toBe(null)
    expect(Object.keys(almacen)).toEqual([])
  })

  it('un almacenamiento manipulado a mano no cuela un código imposible', () => {
    // Se vuelve a normalizar en la LECTURA, no sólo en la escritura: entre las
    // dos puede haber pasado cualquier cosa.
    almacen[CLAVE_SALA_PENDIENTE] = 'AJ-0OI1'
    expect(leer()).toBe(null)
    almacen[CLAVE_SALA_PENDIENTE] = 'basura'
    expect(leer()).toBe(null)
    almacen[CLAVE_SALA_PENDIENTE] = 'aj7k2m'
    expect(leer()).toBe('AJ-7K2M')
  })

  it('borrar deja el almacenamiento como estaba', () => {
    guardar('AJ-7K2M')
    borrar()
    expect(leer()).toBe(null)
    expect(CLAVE_SALA_PENDIENTE in almacen).toBe(false)
  })

  it('la clave sigue la convención ajilei.<cosa>', () => {
    expect(CLAVE_SALA_PENDIENTE).toBe('ajilei.salaPendiente')
  })
})

describe('SAL-A · almacenamiento denegado', () => {
  it('no tumba nada, en las tres direcciones', () => {
    // El caso real: ventana privada o cookies bloqueadas. Se pierde la
    // invitación, no la app.
    globalThis.window = {
      get localStorage() { throw new Error('SecurityError') },
    }
    expect(() => guardar('AJ-7K2M')).not.toThrow()
    expect(guardar('AJ-7K2M')).toBe(null)
    expect(leer()).toBe(null)
    expect(() => borrar()).not.toThrow()
  })

  it('sin window tampoco rompe', () => {
    // Es lo que ocurre en Vitest sin jsdom, y también en cualquier import desde
    // `node` — un arnés, por ejemplo.
    delete globalThis.window
    expect(leer()).toBe(null)
    expect(guardar('AJ-7K2M')).toBe(null)
    expect(() => borrar()).not.toThrow()
  })
})

describe('SAL-A · recoger de la URL', () => {
  it('lee ?sala=, lo recuerda y LIMPIA la barra', () => {
    montarWindow('https://ajilei.app/?sala=aj7k2m')
    expect(recogerDeLaUrl()).toBe('AJ-7K2M')
    expect(leer()).toBe('AJ-7K2M')
    expect(reemplazos).toEqual(['/'])
  })

  it('la limpieza conserva los demás parámetros y el hash', () => {
    montarWindow('https://ajilei.app/?sala=7K2M&utm=wa#abajo')
    expect(recogerDeLaUrl()).toBe('AJ-7K2M')
    expect(reemplazos).toEqual(['/?utm=wa#abajo'])
  })

  it('sin ?sala= no toca nada', () => {
    montarWindow('https://ajilei.app/')
    expect(recogerDeLaUrl()).toBe(null)
    expect(reemplazos).toEqual([])
    expect(Object.keys(almacen)).toEqual([])
  })

  it('un ?sala= con basura se limpia igual, pero no se guarda', () => {
    // Limpiar aunque no valga es lo correcto: si el parámetro se quedara, cada
    // recarga volvería a intentar la misma invitación imposible.
    montarWindow('https://ajilei.app/?sala=0OI1')
    expect(recogerDeLaUrl()).toBe(null)
    expect(leer()).toBe(null)
    expect(reemplazos).toEqual(['/'])
  })

  it('el nombre del parámetro es el sellado', () => {
    expect(PARAM_SALA).toBe('sala')
  })
})
