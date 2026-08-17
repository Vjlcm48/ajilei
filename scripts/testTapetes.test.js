/**
 * EMB-2 · Tapetes — catálogo sellado, propiedad, flujo de compra y persistencia.
 * Rector: docs/AJILEI_Tapetes_v1.0.md §1 (catálogo y precios) · §4 (UX de
 * compra: tres estados, vista previa, «Sí/No») · §5 (economía y persistencia).
 * Ejecutar: npm test
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
  TAPETES, TAPETE_POR_DEFECTO, TAPETE_KEY, TAPETES_COMPRADOS_KEY,
  tapetePorId, esGratuito, montoTexto,
} from '../src/config/tapetes.js'
import {
  esTapeteValido, normalizarTapete, parseComprados, serializarComprados,
  normalizarComprados, estaComprado, comprar, estadoSwatch, decidirPresion,
  textoCompra, tapeteVisible,
} from '../src/hooks/tapetesCore.js'
import {
  readTapete, writeTapete, readComprados, writeComprados,
} from '../src/hooks/useTapetes.js'

// ── 1. Catálogo sellado ──────────────────────────────────────────────────────
// Los cinco ids y los cuatro montos van escritos A MANO aquí, no derivados del
// propio módulo: un test que calcule lo mismo que el código no sella nada. Si
// alguien mueve un precio en config/tapetes.js, esta lista es la que discrepa.
describe('1. Catálogo sellado (v1.0 §1)', () => {
  it('los cinco tapetes, en orden, con sus ids de contrato', () => {
    expect(TAPETES.map(t => t.id)).toEqual(['verde', 'grafito', 'azul', 'vinotinto', 'tricolor'])
  })

  it('la escalera de precios es la sellada, y el clásico es gratuito', () => {
    expect(TAPETES.map(t => t.precio)).toEqual([0, 10000, 15000, 25000, 50000])
  })

  it('la escalera SUBE en cada peldaño — es la escalera identitaria del §1', () => {
    const precios = TAPETES.map(t => t.precio)
    precios.slice(1).forEach((p, i) => expect(p).toBeGreaterThan(precios[i]))
  })

  it('todos traen nombre, descripción y swatch: el panel no inventa nada', () => {
    TAPETES.forEach(t => {
      expect(t.nombre).toBeTruthy()
      expect(t.descripcion).toBeTruthy()
      expect(t.swatch).toBeTruthy()
    })
  })

  it('el default es el verde clásico y es el único gratuito', () => {
    expect(TAPETE_POR_DEFECTO).toBe('verde')
    expect(TAPETES.filter(t => esGratuito(t.id)).map(t => t.id)).toEqual(['verde'])
  })

  it('tapetePorId devuelve null para lo desconocido, jamás lanza', () => {
    expect(tapetePorId('grafito').nombre).toBe('Negro grafito')
    expect(tapetePorId('oro')).toBeNull()
    expect(tapetePorId(null)).toBeNull()
  })

  it('las claves siguen la convención `ajilei.<cosa>` del proyecto', () => {
    expect(TAPETE_KEY).toBe('ajilei.tapete')
    expect(TAPETES_COMPRADOS_KEY).toBe('ajilei.tapetes.comprados')
  })

  it('montoTexto pone el punto de miles de la casa, sin depender de Intl', () => {
    expect(montoTexto(0)).toBe('0')
    expect(montoTexto(999)).toBe('999')
    expect(montoTexto(1000)).toBe('1.000')
    expect(montoTexto(10000)).toBe('10.000')
    expect(montoTexto(50000)).toBe('50.000')
    expect(montoTexto(1234567)).toBe('1.234.567')
  })
})

// ── 2. Validez y arranque en frío ────────────────────────────────────────────
describe('2. Un id desconocido cae al verde, nunca rompe (v1.0 §3)', () => {
  it('esTapeteValido reconoce los cinco y sólo los cinco', () => {
    TAPETES.forEach(t => expect(esTapeteValido(t.id)).toBe(true))
    expect(esTapeteValido('oro')).toBe(false)
    expect(esTapeteValido('')).toBe(false)
    expect(esTapeteValido(undefined)).toBe(false)
  })

  it('normalizarTapete degrada al default: null, basura y un id retirado', () => {
    expect(normalizarTapete(null)).toBe('verde')
    expect(normalizarTapete('{}')).toBe('verde')
    expect(normalizarTapete('esmeralda')).toBe('verde')
    expect(normalizarTapete('tricolor')).toBe('tricolor')
  })
})

// ── 3. Propiedad ─────────────────────────────────────────────────────────────
describe('3. El verde es incomprable e imborrable (v1.0 §1)', () => {
  it('está comprado aunque no haya clave en disco', () => {
    expect(parseComprados(null)).toEqual(['verde'])
    expect(parseComprados('')).toEqual(['verde'])
    expect(estaComprado('verde', [])).toBe(true)
  })

  it('sobrevive a un storage que lo omite a propósito', () => {
    expect(parseComprados('azul')).toEqual(['verde', 'azul'])
  })

  it('no se puede borrar normalizando sin él', () => {
    expect(normalizarComprados(['azul', 'tricolor'])).toContain('verde')
  })

  it('comprarlo no cambia nada — ya era de todos', () => {
    expect(comprar('verde', ['verde'])).toEqual(['verde'])
  })
})

describe('3b. Comprar agrega, y sólo agrega', () => {
  it('la compra suma el tapete al conjunto', () => {
    expect(comprar('azul', ['verde'])).toEqual(['verde', 'azul'])
  })

  it('comprar dos veces no lo duplica', () => {
    expect(comprar('azul', comprar('azul', ['verde']))).toEqual(['verde', 'azul'])
  })

  it('una compra jamás quita una propiedad anterior', () => {
    const tras = comprar('tricolor', ['verde', 'grafito'])
    expect(tras).toContain('grafito')
    expect(tras).toContain('tricolor')
  })

  it('un id inválido no entra ni ensucia el conjunto', () => {
    expect(comprar('oro', ['verde', 'azul'])).toEqual(['verde', 'azul'])
  })

  it('el orden guardado es el del catálogo, no el de compra', () => {
    // Dos jugadores con los mismos tapetes escriben la MISMA cadena: la
    // serialización es función del conjunto, no de la historia.
    expect(serializarComprados(['tricolor', 'grafito'])).toBe(
      serializarComprados(['grafito', 'tricolor']))
    expect(serializarComprados(['tricolor', 'grafito'])).toBe('verde,grafito,tricolor')
  })

  it('un CSV manipulado con F12 degrada solo, sin lanzar', () => {
    expect(parseComprados('azul,,oro, tricolor ,{')).toEqual(['verde', 'azul', 'tricolor'])
    expect(() => parseComprados('[not json')).not.toThrow()
  })
})

// ── 4. Los tres estados visuales ─────────────────────────────────────────────
describe('4. Tres estados visuales, y "activo" gana a "comprado" (v1.0 §4)', () => {
  const comprados = ['verde', 'azul']

  it('el puesto es activo aunque también esté comprado', () => {
    expect(estadoSwatch('azul', 'azul', comprados)).toBe('activo')
  })

  it('el comprado no puesto es comprado', () => {
    expect(estadoSwatch('verde', 'azul', comprados)).toBe('comprado')
  })

  it('el no comprado es no-comprado', () => {
    expect(estadoSwatch('tricolor', 'azul', comprados)).toBe('no-comprado')
  })
})

// ── 5. Qué ocurre al presionar un swatch ─────────────────────────────────────
describe('5. Los tres desenlaces del press, y ninguno más (v1.0 §4)', () => {
  const comprados = ['verde', 'azul']

  it('el activo es no-op: ni diálogo ni repintado', () => {
    expect(decidirPresion('azul', 'azul', comprados)).toEqual({ accion: 'nada', tapete: 'azul' })
  })

  it('un comprado se aplica directo — cambio libre, sin costo (v1.0 §4)', () => {
    expect(decidirPresion('verde', 'azul', comprados)).toEqual({ accion: 'aplicar', tapete: 'verde' })
  })

  it('un no comprado previsualiza: la mesa es el probador', () => {
    expect(decidirPresion('tricolor', 'azul', comprados))
      .toEqual({ accion: 'previsualizar', tapete: 'tricolor' })
  })

  it('un id inválido no hace nada y deja el activo intacto', () => {
    expect(decidirPresion('oro', 'azul', comprados)).toEqual({ accion: 'nada', tapete: 'azul' })
  })

  it('el texto del diálogo sale de la fuente única, no del JSX', () => {
    expect(textoCompra('tricolor')).toEqual({ nombre: 'Tricolor', precio: 50000 })
    expect(textoCompra('oro')).toBeNull()
  })
})

// ── 6. La vista previa no persiste ───────────────────────────────────────────
describe('6. La previa se pinta y no se guarda (v1.0 §4)', () => {
  it('lo visible es la previa mientras existe', () => {
    expect(tapeteVisible('verde', 'tricolor')).toBe('tricolor')
  })

  it('soltarla revierte al activo — «No», cerrar el diálogo o cerrar el panel', () => {
    expect(tapeteVisible('verde', null)).toBe('verde')
  })

  it('una previa corrupta tampoco puede romper la mesa', () => {
    expect(tapeteVisible('azul', 'oro')).toBe('verde')
  })
})

// ── 7. Persistencia · ida y vuelta ───────────────────────────────────────────
// El storage se simula sobre `globalThis.window` en vez de arrastrar jsdom: lo
// que se está sellando es el contrato de lectura/escritura y su degradación, no
// el DOM. Mismo criterio que el resto de la suite, que corre en Node pelado.
describe('7. Persistencia (v1.0 §5)', () => {
  let almacen

  const fakeStorage = () => ({
    getItem: k => (k in almacen ? almacen[k] : null),
    setItem: (k, v) => { almacen[k] = String(v) },
  })

  beforeEach(() => {
    almacen = {}
    globalThis.window = { localStorage: fakeStorage() }
  })
  afterEach(() => { delete globalThis.window })

  it('arranque en frío: verde, y SIN sembrar la clave', () => {
    expect(readTapete()).toBe('verde')
    expect(readComprados()).toEqual(['verde'])
    // Una preferencia que el jugador no ha expresado no se inventa en disco
    // (diferencia deliberada con el contador de consultas, que sí se siembra).
    expect(Object.keys(almacen)).toEqual([])
  })

  it('ida y vuelta del activo', () => {
    writeTapete('vinotinto')
    expect(almacen[TAPETE_KEY]).toBe('vinotinto')
    expect(readTapete()).toBe('vinotinto')
  })

  it('ida y vuelta de la propiedad', () => {
    writeComprados(comprar('tricolor', readComprados()))
    expect(almacen[TAPETES_COMPRADOS_KEY]).toBe('verde,tricolor')
    expect(readComprados()).toEqual(['verde', 'tricolor'])
  })

  it('lo que se escribe se normaliza: basura dentro, verde fuera', () => {
    writeTapete('oro')
    expect(almacen[TAPETE_KEY]).toBe('verde')
  })

  it('un storage manipulado a mano no rompe la lectura', () => {
    almacen[TAPETE_KEY] = 'esmeralda'
    almacen[TAPETES_COMPRADOS_KEY] = 'oro,,tricolor'
    expect(readTapete()).toBe('verde')
    expect(readComprados()).toEqual(['verde', 'tricolor'])
  })

  it('un storage DENEGADO no tumba la mesa, en las dos direcciones', () => {
    globalThis.window = {
      get localStorage() { throw new Error('SecurityError') },
    }
    expect(readTapete()).toBe('verde')
    expect(readComprados()).toEqual(['verde'])
    expect(() => writeTapete('azul')).not.toThrow()
    expect(() => writeComprados(['azul'])).not.toThrow()
  })
})

// ── 8. La frontera con la economía ───────────────────────────────────────────
describe('8. Sin descuento de saldo — el cobro nace en Supabase (v1.0 §5)', () => {
  it('comprar sólo devuelve propiedad: no hay saldo en la firma ni en la salida', () => {
    const antes = ['verde']
    const despues = comprar('tricolor', antes)
    // Si algún día `comprar` devolviera un saldo, este test es el que tiene que
    // discrepar: el descuento entra AHÍ y en ningún otro sitio (ECO-1).
    expect(Array.isArray(despues)).toBe(true)
    expect(despues).toEqual(['verde', 'tricolor'])
    expect(comprar.length).toBe(2)
  })
})
