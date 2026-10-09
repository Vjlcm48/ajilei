import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import {
  crearBanco, APUESTAS_SQL, PISO_SQL, TECHO_SQL, FACTOR_IA_SQL, SILENCIO_RECOGIDA_MS,
} from './bancoImitado'
import { NIVELES } from '../config/niveles'
import { AJILEI_CONFIG } from '../config/ajileiConfig'

// ── ECO-1c · el banco imitado cumple el contrato del SQL ────────────────────
// Los casos son los del guion `supabase/pruebas/eco1c_verificacion.sql`, con
// las MISMAS cifras y el mismo orden: si el modelo y la migración se separan,
// una de las dos suites lo dice. Cada `describe` lleva el número de la prueba
// del guion que repite.

const T = (n) => `token-${n}`
const banco = (extra) => {
  const reloj = { t: 1_000_000_000 }
  const b = crearBanco({ saldo: 2500, ahora: () => reloj.t, ...extra })
  return { b, reloj, ll: (nombre, p) => b.llamar(nombre, p) }
}
const sentar = (ll, reto, jug, ap, ent, token, disp = null) =>
  ll('sentarse_ia', { p_reto: reto, p_jugadores: jug, p_apuesta: ap, p_entrada: ent, p_token: token, p_dispositivo: disp })

describe('ECO-1c · banco imitado · el recorrido del guion', () => {
  // Una sola historia, como el guion: cada paso parte del anterior.
  const { b, ll } = banco()
  let A, B, C

  it('1 · sentarse cobra la entrada (2.500 → 2.000, techo 1.250)', () => {
    const r = sentar(ll, 'basico', 2, 50, 500, T('a'), 'disp-A')
    A = r.mesa_id
    expect(r).toMatchObject({ codigo: 'ok', saldo: 2000, pila: 500, techo: 1250, seq: 0, anterior_cerrada: false })
    expect(b.libro.filter((l) => l.tipo === 'entrada_ia')).toHaveLength(1)
  })

  it('2 · el mismo token no cobra dos veces', () => {
    const r = sentar(ll, 'basico', 2, 50, 500, T('a'), 'disp-A')
    expect(r).toMatchObject({ codigo: 'repetido', mesa_id: A, saldo: 2000 })
    expect(b.libro.filter((l) => l.tipo === 'entrada_ia')).toHaveLength(1)
  })

  it('3 · la combinación se valida (P-1) y sin efectos', () => {
    const codigos = [
      sentar(ll, 'basico', 2, 50, 450, T('x1')), sentar(ll, 'basico', 2, 50, 525, T('x2')),
      sentar(ll, 'basico', 2, 50, 2550, T('x3')), sentar(ll, 'basico', 2, 75, 750, T('x4')),
      sentar(ll, 'basico', 2, 1000, 10000, T('x5')), sentar(ll, 'basico', 6, 50, 500, T('x6')),
      sentar(ll, 'experto', 2, 50, 500, T('x7')),
    ].map((r) => r.codigo)
    expect(codigos).toEqual(['entrada_invalida', 'entrada_invalida', 'entrada_invalida',
      'apuesta_invalida', 'apuesta_invalida', 'jugadores_invalidos', 'reto_invalido'])
    expect(b.mesas).toHaveLength(1)
    expect(b.saldo).toBe(2000)
  })

  it('4 · informar_pila: seq viejo ignorado, pila sobre el techo topada', () => {
    expect(ll('informar_pila', { p_mesa: A, p_seq: 1, p_pila: 450 }).codigo).toBe('ok')
    expect(ll('informar_pila', { p_mesa: A, p_seq: 1, p_pila: 999 }).codigo).toBe('repetido')
    expect(ll('informar_pila', { p_mesa: A, p_seq: 0, p_pila: 10 })).toMatchObject({ codigo: 'repetido', pila: 450 })
    expect(ll('informar_pila', { p_mesa: A, p_seq: 2, p_pila: 5000 })).toMatchObject({ codigo: 'ok', pila: 1250, seq: 2 })
    expect(b.mesas[0].anomalias).toBe(1)
  })

  it('5 · el récord suma una mano por fin de mano, una sola vez', () => {
    expect(ll('informar_pila', { p_mesa: A, p_seq: 3, p_pila: 400, p_fin_vivos: 2, p_fin_gano: true }).codigo).toBe('ok')
    expect(ll('informar_pila', { p_mesa: A, p_seq: 3, p_pila: 400, p_fin_vivos: 2, p_fin_gano: true }).codigo).toBe('repetido')
    expect(ll('informar_pila', { p_mesa: A, p_seq: 4, p_pila: 350, p_fin_vivos: 2, p_fin_gano: false }).codigo).toBe('ok')
    ll('informar_pila', { p_mesa: A, p_seq: 5, p_pila: 350, p_fin_vivos: 7, p_fin_gano: false })
    expect(b.record).toEqual({ 'basico:2': { jugadas: 2, ganadas_humano: 1, ganadas_ia: 1 } })
  })

  it('6 · recargar cobra, sube el techo (1.250 + 500 + 2.500) y la pila', () => {
    expect(ll('recargar_ia', { p_mesa: A, p_monto: 500, p_seq: 6 }))
      .toMatchObject({ codigo: 'ok', saldo: 1500, pila: 850, techo: 4250 })
    expect(ll('recargar_ia', { p_mesa: A, p_monto: 500, p_seq: 6 })).toMatchObject({ codigo: 'repetido', saldo: 1500 })
    expect(b.libro.filter((l) => l.tipo === 'recarga_ia')).toHaveLength(1)
  })

  it('7 · recarga sobre el techo, no múltiplo y sin saldo (P-3)', () => {
    expect(ll('recargar_ia', { p_mesa: A, p_monto: 1700, p_seq: 7 }).codigo).toBe('sobre_techo')
    expect(ll('recargar_ia', { p_mesa: A, p_monto: 75, p_seq: 8 }).codigo).toBe('monto_invalido')
    expect(ll('recargar_ia', { p_mesa: A, p_monto: 1550, p_seq: 9 }).codigo).toBe('saldo_insuficiente')
    expect(b.saldo).toBe(1500)
  })

  it('8 · salir cobra una vez, topado por el techo', () => {
    expect(ll('salir_ia', { p_mesa: A, p_fichas: 99999, p_seq: 10 }))
      .toMatchObject({ codigo: 'ok', cobrado: 4250, saldo: 5750, motivo_cierre: 'salida' })
    expect(ll('salir_ia', { p_mesa: A, p_fichas: 99999, p_seq: 11 }))
      .toMatchObject({ codigo: 'repetido', cobrado: 4250, saldo: 5750 })
    expect(b.libro.filter((l) => l.tipo === 'salida_ia').map((l) => l.monto)).toEqual([4250])
  })

  it('9 · sentarse con una mesa abierta la cierra y devuelve lo cobrado (C4/C5)', () => {
    B = sentar(ll, 'basico', 3, 50, 600, T('b'), 'disp-A').mesa_id    // «Otra…», 12u
    ll('informar_pila', { p_mesa: B, p_seq: 1, p_pila: 700 })
    const r = sentar(ll, 'avanzado', 2, 100, 1000, T('c'), 'disp-B')
    C = r.mesa_id
    expect(r).toMatchObject({ codigo: 'ok', anterior_cerrada: true, anterior_cobro: 700, saldo: 5150 + 700 - 1000 })
    expect(sentar(ll, 'avanzado', 2, 100, 1000, T('c'), 'disp-B'))
      .toMatchObject({ codigo: 'repetido', mesa_id: C, anterior_cerrada: true, anterior_cobro: 700 })
    expect(b.mesas.find((m) => m.id === B)).toMatchObject({ estado: 'cerrada', motivo_cierre: 'reemplazada', cobrado: 700 })
  })

  it('10 · una sola mesa abierta', () => {
    expect(b.mesas.filter((m) => m.estado === 'abierta')).toHaveLength(1)
  })

  it('11 · la mesa reemplazada responde mesa_cerrada (C6)', () => {
    expect(ll('informar_pila', { p_mesa: B, p_seq: 9, p_pila: 100 }).codigo).toBe('mesa_cerrada')
    expect(ll('recargar_ia', { p_mesa: B, p_monto: 50, p_seq: 10 }).codigo).toBe('mesa_cerrada')
    expect(ll('salir_ia', { p_mesa: B, p_fichas: 100, p_seq: 11 }))
      .toMatchObject({ codigo: 'mesa_cerrada', motivo_cierre: 'reemplazada', cobrado: 700 })
  })

  it('12 · saldo insuficiente al sentarse: no cierra la vieja', () => {
    const s0 = b.saldo
    expect(sentar(ll, 'pro', 2, 1000, 50000, T('y')).codigo).toBe('saldo_insuficiente')
    expect(b.mesas.find((m) => m.id === C).estado).toBe('abierta')
    expect(b.saldo).toBe(s0)
  })

  it('14 · salir con 0 cierra sin movimiento (va antes del 13 para no cerrar C)', () => {
    // En el guion es la 14; aquí se juega con una mesa propia para no tocar C.
    const { b: b2, ll: ll2 } = banco()
    const m = sentar(ll2, 'basico', 2, 50, 500, T('z')).mesa_id
    expect(ll2('salir_ia', { p_mesa: m, p_fichas: 0, p_seq: 1 }))
      .toMatchObject({ codigo: 'ok', cobrado: 0, saldo: 2000, motivo_cierre: 'salida' })
    expect(b2.libro.filter((l) => l.tipo === 'salida_ia')).toHaveLength(0)
  })

  it('18 · el libro cuadra y cada mesa cerrada cobra una vez', () => {
    const suma = 2500 + b.libro.reduce((s, l) => s + l.monto, 0)
    expect(suma).toBe(b.saldo)
    for (const m of b.mesas.filter((x) => x.estado === 'cerrada' && x.cobrado > 0)) {
      const cobros = b.libro.filter((l) => l.ref === m.id && ['salida_ia', 'abandono_ia'].includes(l.tipo))
      expect(cobros.map((l) => l.monto)).toEqual([m.cobrado])
    }
  })
})

describe('ECO-1c · banco imitado · recoger al arrancar (13, P-4)', () => {
  it('mismo dispositivo: se recoge; otro y fresca: viva; otro y 10 min callada: se recoge', () => {
    const { b, ll } = banco()
    sentar(ll, 'avanzado', 2, 100, 1000, T('c'), 'disp-B')
    expect(ll('recoger_mesa_ia', { p_dispositivo: 'disp-A' }).codigo).toBe('viva')
    expect(ll('recoger_mesa_ia', { p_dispositivo: 'disp-B' }))
      .toMatchObject({ codigo: 'recogida', cobrado: 1000, motivo_cierre: 'abandono', saldo: 2500 })
    sentar(ll, 'basico', 2, 50, 500, T('d'), 'disp-A')
    b.envejecerAbierta(SILENCIO_RECOGIDA_MS - 1000)
    expect(ll('recoger_mesa_ia', { p_dispositivo: 'disp-Z' }).codigo).toBe('viva')
    b.envejecerAbierta(2000)
    expect(ll('recoger_mesa_ia', { p_dispositivo: 'disp-Z' })).toMatchObject({ codigo: 'recogida', cobrado: 500 })
    expect(ll('recoger_mesa_ia', { p_dispositivo: 'disp-Z' }).codigo).toBe('ninguna')
  })

  it('C6 · otro dispositivo se sienta: la de aquí se cierra cobrada y lo dice al siguiente aviso', () => {
    const { b, ll } = banco()
    const m = sentar(ll, 'basico', 2, 50, 500, T('e')).mesa_id
    ll('informar_pila', { p_mesa: m, p_seq: 1, p_pila: 650 })
    expect(b.cerrarDesdeOtroDispositivo()).toEqual({ cerrada: true, mesa_id: m, cobrado: 650 })
    expect(ll('informar_pila', { p_mesa: m, p_seq: 2, p_pila: 600 }))
      .toMatchObject({ codigo: 'mesa_cerrada', motivo_cierre: 'reemplazada', cobrado: 650, saldo: 2650 })
  })

  it('sin mesa abierta, mi_mesa_ia es una lista vacía (A2), y con ella una fila', () => {
    const { ll } = banco()
    expect(ll('mi_mesa_ia')).toEqual([])
    sentar(ll, 'basico', 2, 50, 500, T('f'))
    expect(ll('mi_mesa_ia')).toHaveLength(1)
  })

  it('rpc() tiene la forma de supabase.rpc', async () => {
    const { b } = banco()
    expect(await b.rpc('mi_billetera')).toEqual({ data: 2500, error: null })
    expect((await b.rpc('no_existe')).error).not.toBe(null)
  })
})

describe('ECO-1c · banco imitado · los moldes de humano (P-6)', () => {
  it('sin la puerta, la entrada de un molde (1,5 apuestas) es ilegal; con ella cobra lo sentado', () => {
    const sinPuerta = banco()
    expect(sentar(sinPuerta.ll, 'basico', 2, 50, 75, T('m')).codigo).toBe('entrada_invalida')
    const conPuerta = banco({ entradaDeMolde: true })
    expect(sentar(conPuerta.ll, 'basico', 2, 50, 75, T('m'))).toMatchObject({ codigo: 'ok', saldo: 2425, pila: 75 })
    // El techo de la mesa sigue mandando.
    expect(sentar(conPuerta.ll, 'basico', 2, 50, 2550, T('n')).codigo).toBe('entrada_invalida')
  })
})

// ── El espejo: SQL, modelo y cliente dicen las mismas cifras ────────────────
describe('ECO-1c · las constantes del servidor, en espejo', () => {
  const dir = join(process.cwd(), 'supabase', 'migrations')
  const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.includes('eco1c_mesas_ia'))), 'utf8')

  it('las apuestas de cada reto: SQL = modelo = niveles.js', () => {
    for (const reto of ['basico', 'avanzado', 'pro']) {
      const m = new RegExp(`when '${reto}'\\s+then array\\[([^\\]]+)\\]`).exec(sql)
      const enSql = m[1].split(',').map((x) => Number(x.trim()))
      expect(enSql).toEqual(APUESTAS_SQL[reto])
      expect(NIVELES.find((n) => n.id === reto).apuestas).toEqual(APUESTAS_SQL[reto])
    }
  })

  it('piso, techo y factor de la IA: SQL = modelo = ajileiConfig', () => {
    expect(/select (\d+) \* p_apuesta \$fn\$;\s*\n\s*create or replace function public\.ia_techo_mesa/.exec(sql)[1]).toBe(String(PISO_SQL))
    expect(/ia_techo_mesa\(p_apuesta bigint\)[\s\S]*?select (\d+) \* p_apuesta/.exec(sql)[1]).toBe(String(TECHO_SQL))
    expect(/round\(p_entrada \* ([\d.]+)\)/.exec(sql)[1]).toBe(String(FACTOR_IA_SQL))
    expect(AJILEI_CONFIG.betting.entrada.piso).toBe(PISO_SQL)
    expect(AJILEI_CONFIG.betting.entrada.techo).toBe(TECHO_SQL)
    expect(AJILEI_CONFIG.ia.factorPila).toBe(FACTOR_IA_SQL)
  })

  it('el silencio de recogida: 10 minutos en los dos (P-4)', () => {
    expect(/interval '(\d+) minutes'/.exec(sql)[1]).toBe(String(SILENCIO_RECOGIDA_MS / 60000))
  })
})
