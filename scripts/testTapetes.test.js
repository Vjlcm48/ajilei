/**
 * EMB-2 · Tapetes — catálogo sellado, validez y persistencia.
 * Rector: docs/AJILEI_Tapetes_v1.0.md §1 (catálogo y precios) · §5 (economía y
 * persistencia). TIE-1 1a: la compra local, los tres estados del panel y la
 * vista previa del ⋮ salen con el panel; entran el inventario del servidor, los
 * atributos de la mesa, la copia del aparato, el canal («el servidor manda»),
 * la vista del artículo de la tienda y el espejo de precios con el SQL.
 * Ejecutar: npm test
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  TAPETES, TAPETE_POR_DEFECTO, TAPETE_KEY, TAPETE_TONO_KEY, TAPETES_COMPRADOS_LEGADO,
  TONOS, tapetePorId, esGratuito, conTonos, montoTexto,
} from '../src/config/tapetes.js'
import {
  esTapeteValido, normalizarTapete, normalizarTono, desdeInventario, estaComprado, atributosTapete,
} from '../src/hooks/tapetesCore.js'
import { crearAlmacenTapetes } from '../src/hooks/useTapetes.js'
import { crearControlTapetes } from '../src/lib/controlTapetes.js'
import { crearTiendaApi, traducirInventario, traducirMotivo } from '../src/lib/tiendaApi.js'
import { vistaArticulo, trasCompra, teQuedaran, normalizarEstante, enUsoFila, ESTANTES } from '../src/hooks/tiendaCore.js'
import { crearBanco, PRECIOS_ARTICULO_SQL, CON_TONOS_SQL, LIMITE_COMPRA_SQL } from '../src/dev/bancoImitado.js'
import { RAIZ } from './arnes/fuente.mjs'

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
    expect(TAPETE_TONO_KEY).toBe('ajilei.tapete.tono')
    expect(TAPETES_COMPRADOS_LEGADO).toBe('ajilei.tapetes.comprados')
  })

  it('TIE-1 1a · los tonos: sólo grafito, azul y vinotinto, y son tres', () => {
    expect(TONOS).toEqual(['claro', 'actual', 'oscuro'])
    expect(TAPETES.filter((t) => conTonos(t.id)).map((t) => t.id)).toEqual(['grafito', 'azul', 'vinotinto'])
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

// ── 3. TIE-1 1a · Lo que dice el servidor ─────────────────────────────────────
const fila = (articulo, tono = null, en_uso = false) => ({ tipo: 'tapete', articulo, tono, en_uso })

describe('3. TIE-1 1a · normalizarTono y desdeInventario', () => {
  it('el tono vale en los que tienen tonos; si no llega uno válido, «actual»; en los demás, null', () => {
    expect(normalizarTono('grafito', 'claro')).toBe('claro')
    expect(normalizarTono('azul', 'rosa')).toBe('actual')
    expect(normalizarTono('vinotinto', null)).toBe('actual')
    expect(normalizarTono('tricolor', 'claro')).toBeNull()
    expect(normalizarTono('verde', 'oscuro')).toBeNull()
  })

  it('cuenta nueva: nada comprado y el verde en uso', () => {
    expect(desdeInventario([])).toEqual({ comprados: {}, enUso: 'verde', tono: null })
    expect(desdeInventario(null)).toEqual({ comprados: {}, enUso: 'verde', tono: null })
  })

  it('lo comprado con su tono, y el que está en uso con el suyo', () => {
    const r = desdeInventario([fila('grafito', 'oscuro', true), fila('azul', 'actual'), fila('tricolor')])
    expect(r).toEqual({ comprados: { grafito: 'oscuro', azul: 'actual', tricolor: null }, enUso: 'grafito', tono: 'oscuro' })
  })

  it('ninguna fila en uso es el verde (el verde no tiene fila)', () => {
    expect(desdeInventario([fila('azul', 'claro')]).enUso).toBe('verde')
  })

  it('lo que no entiende lo ignora: otro tipo, un id desconocido, el verde con fila', () => {
    const r = desdeInventario([{ tipo: 'reverso', articulo: 'negro', en_uso: true }, fila('esmeralda', null, true), fila('verde', null, true)])
    expect(r).toEqual({ comprados: {}, enUso: 'verde', tono: null })
  })

  it('estaComprado: el verde siempre; los demás, sólo con fila', () => {
    expect(estaComprado('verde', {})).toBe(true)
    expect(estaComprado('azul', { azul: 'actual' })).toBe(true)
    expect(estaComprado('azul', {})).toBe(false)
  })
})

// ── 4. Los atributos de la mesa (y de la vitrina) ─────────────────────────────
describe('4. TIE-1 1a · atributosTapete', () => {
  it('el verde no lleva atributo; el tono «actual» tampoco', () => {
    expect(atributosTapete('verde', null)).toEqual({ tapete: null, tono: null })
    expect(atributosTapete('azul', 'actual')).toEqual({ tapete: 'azul', tono: null })
  })
  it('claro y oscuro sí; en el tricolor el tono no se pone', () => {
    expect(atributosTapete('vinotinto', 'claro')).toEqual({ tapete: 'vinotinto', tono: 'claro' })
    expect(atributosTapete('grafito', 'oscuro')).toEqual({ tapete: 'grafito', tono: 'oscuro' })
    expect(atributosTapete('tricolor', 'oscuro')).toEqual({ tapete: 'tricolor', tono: null })
  })
  it('basura dentro, verde fuera', () => {
    expect(atributosTapete('{}', 'claro')).toEqual({ tapete: null, tono: null })
  })
})

// ── 5. La copia del aparato ───────────────────────────────────────────────────
function almacenFalso(inicial = {}) {
  const m = new Map(Object.entries(inicial))
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  }
}

describe('5. TIE-1 1a · la copia del aparato', () => {
  it('borra el legado al crearse y no lo lee nunca', () => {
    const a = almacenFalso({ 'ajilei.tapetes.comprados': 'verde,tricolor' })
    const al = crearAlmacenTapetes(() => a)
    expect(a.m.has('ajilei.tapetes.comprados')).toBe(false)
    expect(al.leer()).toEqual({ enUso: null, tono: null })
  })
  it('guarda el tapete y el tono en uso; sin tono, la clave del tono se va', () => {
    const a = almacenFalso()
    const al = crearAlmacenTapetes(() => a)
    al.guardar('grafito', 'oscuro')
    expect(Object.fromEntries(a.m)).toEqual({ 'ajilei.tapete': 'grafito', 'ajilei.tapete.tono': 'oscuro' })
    al.guardar('tricolor', null)
    expect(Object.fromEntries(a.m)).toEqual({ 'ajilei.tapete': 'tricolor' })
  })
  it('un almacén DENEGADO no tumba nada, en las dos direcciones', () => {
    const roto = () => { throw new Error('SecurityError') }
    const al = crearAlmacenTapetes(roto)
    expect(al.leer()).toEqual({ enUso: null, tono: null })
    expect(() => al.guardar('azul', 'claro')).not.toThrow()
  })
})

// ── 6. El canal: el servidor manda (INV-76) ──────────────────────────────────
function canal({ saldo = 31400, copia = null, filas = null } = {}) {
  const banco = crearBanco({ saldo, limites: false })
  if (filas) banco.sembrarInventario(filas)
  const guardado = []
  const almacen = { leer: () => copia ?? { enUso: null, tono: null }, guardar: (e, t) => guardado.push([e, t]) }
  return { banco, guardado, control: crearControlTapetes({ api: crearTiendaApi(banco), almacen }) }
}

describe('6. TIE-1 1a · el canal de los tapetes', () => {
  it('arranca con la copia del aparato, sin dar nada por comprado', () => {
    const { control } = canal({ copia: { enUso: 'grafito', tono: 'oscuro' } })
    expect(control.leer()).toEqual({ cargado: false, comprados: {}, enUso: 'grafito', tono: 'oscuro' })
  })
  it('refrescar trae el inventario y pisa la copia', async () => {
    const { control, guardado } = canal({ copia: { enUso: 'grafito', tono: 'oscuro' }, filas: [{ articulo: 'azul', tono: 'claro', en_uso: true }] })
    expect(await control.refrescar()).toBe(true)
    expect(control.leer()).toEqual({ cargado: true, comprados: { azul: 'claro' }, enUso: 'azul', tono: 'claro' })
    expect(guardado.at(-1)).toEqual(['azul', 'claro'])
  })
  it('comprar con «ok» lo pone en uso con su tono; el saldo lo cobra el servidor', async () => {
    const { control, banco } = canal()
    await control.refrescar()
    expect(await control.comprar('grafito', 'claro')).toBe('ok')
    expect(control.leer()).toMatchObject({ comprados: { grafito: 'claro' }, enUso: 'grafito', tono: 'claro' })
    expect(banco.saldo).toBe(21400)
  })
  it('una compra que falla no deja nada puesto (sin_saldo y sin respuesta)', async () => {
    const { control } = canal({ saldo: 4000 })
    await control.refrescar()
    const antes = control.leer()
    expect(await control.comprar('tricolor')).toBe('sin_saldo')
    expect(control.leer()).toBe(antes)
    const mudo = crearControlTapetes({ api: { comprar: async () => null, inventario: async () => [] }, almacen: null })
    expect(await mudo.comprar('azul', 'claro')).toBeNull()
    expect(mudo.leer().enUso).toBe('verde')
  })
  it('«ya_comprado» relee el inventario: la vista pasa a comprado', async () => {
    const { control, banco } = canal()
    await control.refrescar()
    banco.sembrarInventario([{ articulo: 'azul', tono: 'oscuro', en_uso: true }])
    expect(await control.comprar('azul')).toBe('ya_comprado')
    expect(control.leer()).toMatchObject({ comprados: { azul: 'oscuro' }, enUso: 'azul', tono: 'oscuro' })
  })
  it('usar y elegir tono, sólo con «ok»; el verde apaga', async () => {
    const { control } = canal({ filas: [{ articulo: 'grafito', tono: 'claro', en_uso: true }, { articulo: 'azul', tono: 'actual' }] })
    await control.refrescar()
    expect(await control.usar('azul')).toBe('ok')
    expect(control.leer()).toMatchObject({ enUso: 'azul', tono: 'actual' })
    expect(await control.elegirTono('azul', 'oscuro')).toBe('ok')
    expect(control.leer()).toMatchObject({ enUso: 'azul', tono: 'oscuro', comprados: { azul: 'oscuro' } })
    expect(await control.usar('vinotinto')).toBe('no_comprado')
    expect(control.leer().enUso).toBe('azul')
    expect(await control.usar('verde')).toBe('ok')
    expect(control.leer()).toMatchObject({ enUso: 'verde', tono: null })
  })
})

// ── 7. La vista del artículo (V4-A) y la ventana (V5-A) ──────────────────────
describe('7. TIE-1 1a · tiendaCore', () => {
  const sabida = (comprados = {}, enUso = 'verde', tono = null) => ({ cargado: true, comprados, enUso, tono })

  it('en uso, usar, comprar o «No te alcanza: faltan N»', () => {
    expect(vistaArticulo({ id: 'verde', foto: sabida(), saldo: 0 }).cta).toBe('en_uso')
    expect(vistaArticulo({ id: 'verde', foto: sabida({ azul: 'actual' }, 'azul'), saldo: 0 }).cta).toBe('usar')
    expect(vistaArticulo({ id: 'azul', foto: sabida({ azul: 'claro' }), saldo: 0 }).cta).toBe('usar')
    expect(vistaArticulo({ id: 'grafito', foto: sabida(), saldo: 31400 }).cta).toBe('comprar')
    const f = vistaArticulo({ id: 'vinotinto', foto: sabida(), saldo: 5000 })
    expect([f.cta, f.falta]).toEqual(['falta', 20000])
  })
  it('sin inventario o sin saldo todavía: esperando (ni compra ni nota)', () => {
    expect(vistaArticulo({ id: 'grafito', foto: { cargado: false, comprados: {}, enUso: 'verde' }, saldo: 31400 }).cta).toBe('esperando')
    expect(vistaArticulo({ id: 'grafito', foto: sabida(), saldo: null }).cta).toBe('esperando')
  })
  it('el tono que pinta: el suyo si lo tiene, la vista previa si no; null sin tonos', () => {
    expect(vistaArticulo({ id: 'azul', foto: sabida({ azul: 'oscuro' }), saldo: 0, previa: 'claro' }).tono).toBe('oscuro')
    expect(vistaArticulo({ id: 'azul', foto: sabida(), saldo: 0, previa: 'claro' }).tono).toBe('claro')
    expect(vistaArticulo({ id: 'azul', foto: sabida(), saldo: 0 }).tono).toBe('actual')
    expect(vistaArticulo({ id: 'tricolor', foto: sabida(), saldo: 0, previa: 'claro' }).tono).toBeNull()
  })
  it('cada motivo de la compra, a su desenlace; lo demás es error', () => {
    expect(['ok', 'sin_saldo', 'ya_comprado', null, 'limite', 'no_existe'].map(trasCompra))
      .toEqual(['listo', 'sin_saldo', 'ya_comprado', 'error', 'error', 'error'])
  })
  it('«Te quedarán» y los estantes', () => {
    expect(teQuedaran(31400, 10000)).toBe(21400)
    expect(teQuedaran(null, 10000)).toBe(0)
    expect(ESTANTES.map((e) => e.id)).toEqual(['monedas', 'tapetes', 'reversos', 'avatares', 'premium'])
    expect(ESTANTES.filter((e) => e.pronto).map((e) => e.id)).toEqual(['reversos', 'avatares', 'premium'])
    expect(normalizarEstante('monedas')).toBe('monedas')
    expect(normalizarEstante('reversos')).toBe('tapetes')
    expect(normalizarEstante(undefined)).toBe('tapetes')
  })
  it('la fila «Tapetes» del ⚙: lo que está en uso; sin canal, el verde sin tono', () => {
    expect(enUsoFila(null)).toEqual({ id: 'verde', tono: null })
    expect(enUsoFila(sabida({ grafito: 'claro' }, 'grafito', 'claro'))).toEqual({ id: 'grafito', tono: 'claro' })
    expect(enUsoFila(sabida({ azul: null }, 'azul', null))).toEqual({ id: 'azul', tono: 'actual' })
    expect(enUsoFila(sabida({ tricolor: null }, 'tricolor', 'claro'))).toEqual({ id: 'tricolor', tono: null })
    expect(enUsoFila({ enUso: 'morado', tono: 'claro' })).toEqual({ id: 'verde', tono: null })
  })
})

// ── 8. La puerta del cliente y el espejo con el SQL ──────────────────────────
describe('8. TIE-1 1a · tiendaApi y el espejo de precios', () => {
  it('traduce lo que es del contrato y rechaza lo que no', () => {
    expect(traducirInventario([{ jugador_id: 'x', tipo: 'tapete', articulo: 'azul', tono: 'claro', en_uso: true }]))
      .toEqual([{ tipo: 'tapete', articulo: 'azul', tono: 'claro', en_uso: true }])
    expect(traducirInventario(null)).toBeNull()
    expect(traducirMotivo('ok')).toBe('ok')
    expect(traducirMotivo('')).toBeNull()
    expect(traducirMotivo({ resultado: 'ok' })).toBeNull()
  })

  it('un error del cliente o de la red es null, nunca una excepción', async () => {
    const api = crearTiendaApi({ rpc: async () => { throw new Error('red') } })
    expect(await api.comprar('tapete', 'azul')).toBeNull()
    expect(await crearTiendaApi({ rpc: async () => ({ data: null, error: { message: 'x' } }) }).inventario()).toBeNull()
  })

  it('el precio de exhibición es el que cobra el servidor: cliente = migración = banco', () => {
    const dir = join(RAIZ, 'supabase/migrations')
    const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.includes('tie1a_inventario'))), 'utf8')
    const deSql = Object.fromEntries([...sql.matchAll(/when '(\w+)'\s+then (\d+)/g)].map((m) => [m[1], Number(m[2])]))
    const deCliente = Object.fromEntries(TAPETES.filter((t) => !esGratuito(t.id)).map((t) => [t.id, t.precio]))
    expect(deSql).toEqual(deCliente)
    expect(PRECIOS_ARTICULO_SQL.tapete).toEqual(deCliente)
    expect(CON_TONOS_SQL.tapete).toEqual(TAPETES.filter((t) => conTonos(t.id)).map((t) => t.id))
    expect(sql).toMatch(/p_articulo in \('grafito', 'azul', 'vinotinto'\)/)
    expect(sql).toMatch(new RegExp(`contar_intento_dinero\\('comprar_articulo', ${LIMITE_COMPRA_SQL}\\)`))
  })

  it('el banco imitado contesta como el guion: compra, repetida, sin saldo, reparación', () => {
    const b = crearBanco({ saldo: 30000, limites: false })
    const r = (n, p) => b.llamar(n, p)
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'grafito', p_tono: 'claro' })).toBe('ok')
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'grafito', p_tono: 'oscuro' })).toBe('ya_comprado')
    b.borrarFilaInventario('tapete', 'grafito')
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'grafito', p_tono: 'claro' })).toBe('ok')
    expect(b.saldo).toBe(20000)
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'tricolor' })).toBe('sin_saldo')
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'tricolor', p_tono: 'claro' })).toBe('sin_tono')
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'azul', p_tono: 'rosa' })).toBe('tono_invalido')
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'verde' })).toBe('no_existe')
    expect(r('comprar_articulo', { p_tipo: 'reverso', p_articulo: 'negro' })).toBe('tipo_invalido')
    expect(r('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'azul' })).toBe('ok')
    expect(r('mi_inventario', { p_tipo: 'tapete' }).map((f) => `${f.articulo}:${f.tono}:${f.en_uso ? 1 : 0}`).sort())
      .toEqual(['azul:actual:1', 'grafito:claro:0'])
    expect(r('usar_articulo', { p_tipo: 'tapete', p_articulo: 'verde' })).toBe('ok')
    expect(r('mi_inventario', { p_tipo: 'tapete' }).some((f) => f.en_uso)).toBe(false)
    expect(r('elegir_tono', { p_tipo: 'tapete', p_articulo: 'vinotinto', p_tono: 'oscuro' })).toBe('no_comprado')
    expect(r('elegir_tono', { p_tipo: 'tapete', p_articulo: 'verde', p_tono: 'claro' })).toBe('sin_tono')
    expect(b.libro.filter((l) => l.tipo === 'compra').map((l) => l.monto)).toEqual([-10000, -15000])
  })

  it('el límite: 30 compras por minuto; la 31.ª, limite', () => {
    const b = crearBanco({ saldo: 0 })
    for (let i = 0; i < 30; i++) expect(b.llamar('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'dorado' })).toBe('no_existe')
    expect(b.llamar('comprar_articulo', { p_tipo: 'tapete', p_articulo: 'grafito' })).toBe('limite')
  })
})

// ── 9. El tapete del aparato no se reconoce ──────────────────────────────────
describe('9. TIE-1 1a · ningún código lee lo «comprado» en el aparato', () => {
  it('la clave de antes sólo aparece para borrarse', () => {
    const t = readFileSync(join(RAIZ, 'src/hooks/useTapetes.js'), 'utf8')
    expect(t).toMatch(/removeItem\(TAPETES_COMPRADOS_LEGADO\)/)
    expect(t).not.toMatch(/getItem\(TAPETES_COMPRADOS_LEGADO\)/)
  })
  it('el catálogo es el de siempre: nombres de contrato', () => {
    expect(tapetePorId('grafito').nombre).toBe('Negro grafito')
    expect(TAPETE_POR_DEFECTO).toBe('verde')
    expect(montoTexto(25000)).toBe('25.000')
  })
})
