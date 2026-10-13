import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import {
  crearBanco, APUESTAS_SQL, PISO_SQL, TECHO_SQL, FACTOR_IA_SQL, SILENCIO_RECOGIDA_MS,
  LIMITES_SQL, BONO_CONSTANCIA_SQL, CICLO_CONSTANCIA_SQL, sumarDias,
  VIDEO_PREMIO_SQL, VIDEO_TOPE_SQL, VIDEO_MINIMO_S_SQL, VIDEO_VIDA_MS_SQL, videoReinicioSQL, diaChicagoSQL,
} from './bancoImitado'
import { NIVELES } from '../config/niveles'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
import { CICLO_CONSTANCIA } from '../hooks/constanciaCore'
import { ESPERAS_COBRO_MS } from '../hooks/videoCore'
import { ESPERAS_RED_MS } from '../lib/controlMesaIA'

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
  // ECO-1d · sin límites: el reloj no se mueve en toda la historia, como el
  // guion de la 1c corre en UNA transacción, y la 11.ª sentada del mismo
  // minuto sería `limite` (informe 1d). Los límites tienen su recorrido propio.
  const { b, ll } = banco({ limites: false })
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

// ═══ ECO-1d · constancia, límites y válvula ══════════════════════════════════
// Los casos del guion `supabase/pruebas/eco1d_verificacion.sql`, con sus cifras.
// Aquí el reloj SÍ se mueve (`reloj.t`): «pasa un minuto» es avanzarlo, y «el
// día siguiente» es `constanciaAdmin`, como en el guion.
const DIA = 86_400_000
describe('ECO-1d · banco imitado · la constancia (guion 2–8)', () => {
  it('2 · primer ingreso = día 1; otra vez = ya_marcado, sin cobro', () => {
    const { b, ll } = banco()
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 1, dia_del_ciclo: 1, cobrado: 0, saldo: 2500, dia: b.hoy() })
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ya_marcado', racha: 1, cobrado: 0 })
    expect(b.libro.filter((l) => l.tipo === 'constancia')).toHaveLength(0)
  })

  it('3 · 4 · 5 · 6 · día 2, día 3 cobra 500 una vez, la clave por día y el día perdido', () => {
    const { b, ll } = banco()
    ll('marcar_ingreso')
    b.constanciaAdmin(1, sumarDias(b.hoy(), -1))
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 2, dia_del_ciclo: 2, cobrado: 0 })
    b.constanciaAdmin(2, sumarDias(b.hoy(), -1))
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 3, dia_del_ciclo: 3, cobrado: 500, saldo: 3000 })
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ya_marcado', cobrado: 0, saldo: 3000 })
    // 5 · la racha simulada otra vez hoy: la clave del día ya está.
    b.constanciaAdmin(2, sumarDias(b.hoy(), -1))
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 3, cobrado: 0, saldo: 3000 })
    expect(b.libro.filter((l) => l.tipo === 'constancia')).toEqual([
      expect.objectContaining({ monto: 500, clave: `constancia:${b.hoy()}` }),
    ])
    // 6 · un día perdido
    b.constanciaAdmin(2, sumarDias(b.hoy(), -2))
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 1, dia_del_ciclo: 1, cobrado: 0 })
  })

  it('7 · la cuenta sigue tras cobrar: el día 4 no paga, el 6 sí', () => {
    const { b, ll } = banco()
    b.constanciaAdmin(3, sumarDias(b.hoy(), -1))
    expect(ll('marcar_ingreso')).toMatchObject({ racha: 4, dia_del_ciclo: 1, cobrado: 0 })
    b.constanciaAdmin(5, sumarDias(b.hoy(), -1))
    expect(ll('marcar_ingreso')).toMatchObject({ racha: 6, dia_del_ciclo: 3, cobrado: 500, saldo: 3000 })
  })

  it('el día real: con el reloj un día más tarde, la racha suma sola', () => {
    const { ll, reloj } = banco()
    ll('marcar_ingreso')
    reloj.t += DIA
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 2 })
    reloj.t += 2 * DIA
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'ok', racha: 1 })
  })

  it('8 · las guardas de constancia_admin', () => {
    const { b } = banco()
    expect(b.constanciaAdmin(1, sumarDias(b.hoy(), 1))).toBe(false)   // día futuro
    expect(b.constanciaAdmin(0, b.hoy())).toBe(false)                   // racha 0 con día
    expect(b.constanciaAdmin(-1, null)).toBe(false)
    expect(b.constanciaAdmin(0, null)).toBe(true)
    expect(b.constancia).toEqual({ racha: 0, ultimo_dia: null })
  })
})

describe('ECO-1d · banco imitado · los límites (guion 9–14, K7)', () => {
  it('9 · marcar_ingreso: la 7.ª del minuto es `limite`, sin efectos, y queda anotada', () => {
    const { b, ll } = banco()
    for (let i = 0; i < 6; i++) ll('marcar_ingreso')
    b.constanciaAdmin(2, sumarDias(b.hoy(), -1))
    expect(ll('marcar_ingreso')).toMatchObject({ codigo: 'limite', racha: 2, cobrado: 0 })
    expect(b.intentos.filter((x) => x.funcion === 'marcar_ingreso')).toHaveLength(7)
    expect(b.libro.filter((l) => l.tipo === 'constancia')).toHaveLength(0)
  })

  it('10 · sentarse_ia: la 11.ª del minuto es `limite`, sin mesa ni cobro', () => {
    const { b, ll } = banco()
    for (let i = 0; i < 10; i++) sentar(ll, 'experto', 2, 50, 500, T(`x${i}`))
    expect(sentar(ll, 'basico', 2, 50, 500, T('ok'))).toMatchObject({ codigo: 'limite', mesa_id: null, saldo: 2500 })
    expect(b.mesas).toHaveLength(0)
  })

  it('11 · K7 · salir cortado: la mesa espera intacta y un minuto después cobra entera', () => {
    const { b, ll, reloj } = banco()
    const m = sentar(ll, 'basico', 2, 50, 500, T('a'), 'disp-T').mesa_id
    ll('informar_pila', { p_mesa: m, p_seq: 1, p_pila: 800 })
    for (let i = 0; i < 30; i++) ll('salir_ia', { p_mesa: 'otra', p_fichas: 100, p_seq: 1 })
    expect(ll('salir_ia', { p_mesa: m, p_fichas: 800, p_seq: 2 }).codigo).toBe('limite')
    expect(b.mesas[0]).toMatchObject({ estado: 'abierta', pila_informada: 800 })
    reloj.t += 61_000
    expect(ll('salir_ia', { p_mesa: m, p_fichas: 800, p_seq: 2 })).toMatchObject({ codigo: 'ok', cobrado: 800, saldo: 2800 })
    expect(b.libro.filter((l) => l.tipo === 'salida_ia')).toHaveLength(1)
  })

  it('12 · K7 · recoger cortado: la abierta la cierra y la cobra C4 al sentarse', () => {
    const { b, ll } = banco()
    const m = sentar(ll, 'basico', 2, 50, 500, T('a'), 'disp-T').mesa_id
    ll('informar_pila', { p_mesa: m, p_seq: 1, p_pila: 650 })
    b.forzarLimite('recoger_mesa_ia', 1)
    expect(ll('recoger_mesa_ia', { p_dispositivo: 'disp-T' }).codigo).toBe('limite')
    expect(b.mesas[0].estado).toBe('abierta')
    expect(sentar(ll, 'basico', 2, 50, 500, T('b'), 'disp-T'))
      .toMatchObject({ codigo: 'ok', anterior_cerrada: true, anterior_cobro: 650, saldo: 2000 + 650 - 500 })
  })

  it('13 · 14 · recargar_ia corta en la 21.ª; informar_pila no lleva límite (P-1)', () => {
    const { b, ll } = banco()
    const m = sentar(ll, 'basico', 2, 50, 500, T('a')).mesa_id
    for (let i = 0; i < 20; i++) ll('recargar_ia', { p_mesa: 'otra', p_monto: 50, p_seq: 1 })
    expect(ll('recargar_ia', { p_mesa: m, p_monto: 500, p_seq: 1 }).codigo).toBe('limite')
    expect(b.libro.filter((l) => l.tipo === 'recarga_ia')).toHaveLength(0)
    for (let i = 1; i <= 40; i++) ll('informar_pila', { p_mesa: m, p_seq: i, p_pila: 500 - i })
    expect(ll('informar_pila', { p_mesa: m, p_seq: 41, p_pila: 400 })).toMatchObject({ codigo: 'ok', pila: 400 })
    expect(b.intentos.some((x) => x.funcion === 'informar_pila')).toBe(false)
  })

  it('la purga: lo de más de una hora se va al anotar', () => {
    const { b, ll, reloj } = banco()
    ll('marcar_ingreso')
    reloj.t += 3600_001
    ll('marcar_ingreso')
    expect(b.intentos).toHaveLength(1)
  })
})

describe('ECO-1d · banco imitado · la válvula (guion 16–19, K8, P-2, P-3)', () => {
  it('apagada no cambia nada; encendida dice tope_diario sin efectos; la mesa en curso cobra entera', () => {
    const { b, ll } = banco()
    const m = sentar(ll, 'basico', 2, 50, 500, T('a'), 'disp-C').mesa_id
    ll('informar_pila', { p_mesa: m, p_seq: 1, p_pila: 1250 })
    expect(b.gananciaHoy()).toBe(750)
    expect(ll('recargar_ia', { p_mesa: m, p_monto: 50, p_seq: 2 }).codigo).toBe('ok')
    expect(b.valvula(500)).toEqual({ codigo: 'encendida', tope: 500 })
    const s0 = b.saldo
    expect(sentar(ll, 'basico', 2, 50, 500, T('b'), 'disp-C')).toMatchObject({ codigo: 'tope_diario', mesa_id: null, anterior_cerrada: false })
    expect(ll('recargar_ia', { p_mesa: m, p_monto: 50, p_seq: 3 }).codigo).toBe('tope_diario')
    expect(sentar(ll, 'basico', 2, 50, 500, T('a'), 'disp-C')).toMatchObject({ codigo: 'repetido', mesa_id: m })
    expect(b.saldo).toBe(s0)
    expect(b.mesas.filter((x) => x.estado === 'abierta')).toHaveLength(1)
    // K8 · la mesa en curso se paga completa
    expect(ll('salir_ia', { p_mesa: m, p_fichas: 1300, p_seq: 4 })).toMatchObject({ codigo: 'ok', cobrado: 1300 })
    expect(b.gananciaHoy()).toBe(750)
    expect(sentar(ll, 'basico', 2, 50, 500, T('c')).codigo).toBe('tope_diario')
    // 19 · apagarla lo devuelve todo; el rastro
    expect(b.valvula(0).codigo).toBe('tope_invalido')
    expect(b.valvula(null)).toEqual({ codigo: 'apagada', tope: null })
    expect(b.valvula(null).codigo).toBe('sin_cambio')
    expect(sentar(ll, 'basico', 2, 50, 500, T('d')).codigo).toBe('ok')
    expect(b.cambiosValvula).toEqual([{ antes: null, despues: 500 }, { antes: 500, despues: null }])
  })

  it('P-2 · una mesa cuenta el día en que se CIERRA, entera', () => {
    const { b, ll, reloj } = banco()
    const m = sentar(ll, 'basico', 2, 50, 500, T('a')).mesa_id
    ll('informar_pila', { p_mesa: m, p_seq: 1, p_pila: 900 })
    reloj.t += DIA
    expect(b.gananciaHoy()).toBe(400)            // la abierta cuenta ya
    ll('salir_ia', { p_mesa: m, p_fichas: 900, p_seq: 2 })
    expect(b.gananciaHoy()).toBe(400)            // cerrada hoy: entera, aunque la entrada fuera ayer
    reloj.t += DIA
    expect(b.gananciaHoy()).toBe(0)              // cerrada ayer: ya no
  })
})

describe('ECO-1d · las cifras de la 1d, en espejo', () => {
  const dir = join(process.cwd(), 'supabase', 'migrations')
  const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.includes('eco1d_constancia'))), 'utf8')

  // ECO-1g · `limite_dinero` es un `case` cerrado y cada tanda que añade una
  // función de dinero la REDEFINE entera. El espejo es la definición MÁS
  // RECIENTE (la última migración, por orden de nombre, que la trae), no la de
  // la 1d: así la próxima redefinición no deja esta prueba mirando una vieja.
  const ultimaDefinicion = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
    .map((f) => /function public\.limite_dinero[\s\S]*?\$fn\$;/.exec(readFileSync(join(dir, f), 'utf8'))?.[0])
    .filter(Boolean).pop()

  it('limite_dinero: SQL = modelo; informar_pila sin límite', () => {
    const bloque = ultimaDefinicion
    const enSql = Object.fromEntries([...bloque.matchAll(/when '(\w+)'\s+then (\d+)/g)].map((m) => [m[1], Number(m[2])]))
    expect(enSql).toEqual({ ...LIMITES_SQL })
    expect(enSql.informar_pila).toBeUndefined()
  })

  it('la constancia: 500 cada 3 en el SQL, en el modelo y en el cliente', () => {
    expect(/bono_constancia_hc\(\)\s*returns bigint[^$]*\$fn\$ select (\d+)::bigint/.exec(sql)[1]).toBe(String(BONO_CONSTANCIA_SQL))
    expect(/constancia_ciclo\(\)\s*returns integer[^$]*\$fn\$ select (\d+) \$fn\$/.exec(sql)[1]).toBe(String(CICLO_CONSTANCIA_SQL))
    expect(CICLO_CONSTANCIA).toBe(CICLO_CONSTANCIA_SQL)
  })
})

// ── ECO-1g · el video de recompensa cumple el contrato del SQL ──────────────
// Los casos son los del guion `supabase/pruebas/eco1g_verificacion.sql`, con
// las MISMAS cifras; cada prueba lleva el número de la fila del guion que
// repite. Lo que el guion hace envejeciendo filas, aquí lo hace el reloj.
// Sin su par aquí: 17 (sin sesión), 18 y 19 (permisos y tabla), que son de la
// base y no del modelo; y de la 16, «ajeno» (el banco es de UNA cuenta).
describe('ECO-1g · banco imitado · el video (guion 1g)', () => {
  const S = 1000
  const ms = (isoTexto) => new Date(isoTexto).getTime()
  const videos = (b) => b.libro.filter((l) => l.tipo === 'video')
  // Un video entero: pedir, dejar pasar el mínimo y cobrar.
  const ver = (ll, reloj) => {
    const p = ll('pedir_boleto')
    reloj.t += VIDEO_MINIMO_S_SQL * S
    return ll('cobrar_boleto', { p_boleto: p.boleto_id })
  }

  it('2 · mi_video: quedan 8 de 8, el premio y la próxima medianoche de Chicago; no escribe', () => {
    const { b, ll, reloj } = banco()
    const r = ll('mi_video')
    expect(r).toMatchObject({ codigo: 'ok', quedan: 8, tope: 8, premio: 500 })
    expect(ms(r.ahora)).toBe(reloj.t)
    expect(ms(r.reinicio_en)).toBe(videoReinicioSQL(reloj.t))
    expect(ms(r.reinicio_en)).toBeGreaterThan(reloj.t)
    expect(diaChicagoSQL(ms(r.reinicio_en))).toBe(sumarDias(diaChicagoSQL(reloj.t), 1))
    expect(diaChicagoSQL(ms(r.reinicio_en) - 1)).toBe(diaChicagoSQL(reloj.t))
    expect(b.intentos).toHaveLength(0)
    expect(b.boletos).toHaveLength(0)
  })

  it('3 · 4 · 5 · 6 · 21 · pedir, cobrar pronto, cobrar a tiempo y cobrar otra vez', () => {
    const { b, ll, reloj } = banco()
    // 3 · un boleto que vence a los 10 min; el recién emitido no descuenta
    const p = ll('pedir_boleto')
    expect(p).toMatchObject({ codigo: 'ok', minimo_s: 35, quedan: 8 })
    expect(p.boleto_id).toBeTruthy()
    expect(ms(p.vence_en) - ms(p.emitido_en)).toBe(VIDEO_VIDA_MS_SQL)
    expect(ms(p.emitido_en)).toBe(reloj.t)
    // 4 · antes de los 35 s: demasiado_pronto, con lo que falta y sin cobro
    reloj.t += 10 * S
    expect(ll('cobrar_boleto', { p_boleto: p.boleto_id }))
      .toMatchObject({ codigo: 'demasiado_pronto', cobrado: 0, saldo: 2500, quedan: 8, faltan_s: 25, premio: 500 })
    expect(videos(b)).toHaveLength(0)
    // 5 · a los 35 s: +500, una línea `video`
    reloj.t += 25 * S
    expect(ll('cobrar_boleto', { p_boleto: p.boleto_id }))
      .toMatchObject({ codigo: 'ok', cobrado: 500, saldo: 3000, quedan: 7, faltan_s: 0, premio: 500 })
    expect(videos(b)).toEqual([{ tipo: 'video', monto: 500, saldo_tras: 3000, clave: `video:${p.boleto_id}`, ref: p.boleto_id }])
    // 6 · 21 · otra vez: ya_cobrado, el saldo ya subido, el premio dicho y UN movimiento
    expect(ll('cobrar_boleto', { p_boleto: p.boleto_id }))
      .toMatchObject({ codigo: 'ya_cobrado', cobrado: 0, saldo: 3000, quedan: 7, premio: 500 })
    expect(videos(b)).toHaveLength(1)
    expect(b.saldo).toBe(3000)
  })

  it('7 · S1: pedir con uno vivo anula el anterior, y el anulado no se cobra', () => {
    const { b, ll, reloj } = banco()
    const viejo = ll('pedir_boleto').boleto_id
    reloj.t += 20 * S
    const nuevo = ll('pedir_boleto').boleto_id
    expect(nuevo).not.toBe(viejo)
    expect(b.boletos.filter((x) => x.cobrado_en === null && x.anulado_en === null).map((x) => x.id)).toEqual([nuevo])
    reloj.t += 40 * S
    expect(ll('cobrar_boleto', { p_boleto: viejo })).toMatchObject({ codigo: 'anulado', cobrado: 0, saldo: 2500 })
    expect(ll('cobrar_boleto', { p_boleto: nuevo })).toMatchObject({ codigo: 'ok', cobrado: 500 })
    expect(videos(b)).toHaveLength(1)
  })

  it('8 · vencido a los 10 min, sin cobro; el ya cobrado sigue diciendo ya_cobrado pasados 11', () => {
    const { b, ll, reloj } = banco()
    const p = ll('pedir_boleto').boleto_id
    reloj.t += VIDEO_VIDA_MS_SQL
    expect(ll('cobrar_boleto', { p_boleto: p })).toMatchObject({ codigo: 'vencido', cobrado: 0, saldo: 2500 })
    expect(videos(b)).toHaveLength(0)
    const r = ver(ll, reloj)
    expect(r.codigo).toBe('ok')
    const cobrado = b.boletos.find((x) => x.cobrado_en !== null).id
    reloj.t += 11 * 60 * S
    expect(ll('cobrar_boleto', { p_boleto: cobrado })).toMatchObject({ codigo: 'ya_cobrado', saldo: 3000 })
  })

  it('9 · G2: el boleto sin cobrar (el video cerrado antes) no cuenta para el tope', () => {
    const { b, ll } = banco()
    for (let i = 0; i < 5; i++) ll('pedir_boleto')
    expect(ll('mi_video').quedan).toBe(8)
    expect(b.saldo).toBe(2500)
  })

  it('10 · 11 · 12 · ocho al día: el noveno pedido es tope_dia sin efectos, y al día siguiente vuelve', () => {
    const { b, ll, reloj } = banco()
    for (let i = 1; i <= 8; i++) {
      // Un minuto entre uno y otro: el límite por minuto no es lo que se prueba aquí.
      reloj.t += 60 * S
      expect(ver(ll, reloj)).toMatchObject({ codigo: 'ok', quedan: 8 - i })
    }
    expect(b.saldo).toBe(2500 + 8 * 500)
    const boletos = b.boletos.length
    const r = ll('pedir_boleto')
    expect(r).toMatchObject({ codigo: 'tope_dia', boleto_id: null, emitido_en: null, vence_en: null, quedan: 0 })
    expect(b.boletos).toHaveLength(boletos)
    expect(ll('mi_video').quedan).toBe(0)
    // 12 · al día siguiente de Chicago (26 h: el día de otoño dura 25)
    reloj.t += 26 * 3600 * S
    expect(ll('mi_video').quedan).toBe(8)
    expect(ver(ll, reloj)).toMatchObject({ codigo: 'ok', quedan: 7 })
  })

  it('11 · la guarda de tope_dia en el cobro: con 8 cobrados, un boleto vivo no paga', () => {
    const { b, ll, reloj } = banco()
    const p = ll('pedir_boleto').boleto_id
    b.sembrarVideosCobrados(8)
    reloj.t += VIDEO_MINIMO_S_SQL * S
    expect(ll('cobrar_boleto', { p_boleto: p })).toMatchObject({ codigo: 'tope_dia', cobrado: 0, saldo: 2500, quedan: 0 })
    expect(videos(b)).toHaveLength(0)
  })

  it('13 · el reinicio es la medianoche de Chicago, también los dos días del cambio de hora', () => {
    // 2026-11-01: el día de 25 h (vuelve la hora de invierno). 2026-03-08: el de 23 h.
    const mediodia = (dia) => new Date(`${dia}T18:00:00Z`).getTime()
    expect(new Date(videoReinicioSQL(mediodia('2026-10-31'))).toISOString()).toBe('2026-11-01T05:00:00.000Z')
    expect(new Date(videoReinicioSQL(mediodia('2026-11-01'))).toISOString()).toBe('2026-11-02T06:00:00.000Z')
    expect(videoReinicioSQL(mediodia('2026-11-01')) - videoReinicioSQL(mediodia('2026-10-31'))).toBe(25 * 3600 * S)
    expect(new Date(videoReinicioSQL(mediodia('2026-03-07'))).toISOString()).toBe('2026-03-08T06:00:00.000Z')
    expect(new Date(videoReinicioSQL(mediodia('2026-03-08'))).toISOString()).toBe('2026-03-09T05:00:00.000Z')
    expect(videoReinicioSQL(mediodia('2026-03-08')) - videoReinicioSQL(mediodia('2026-03-07'))).toBe(23 * 3600 * S)
    // Un segundo antes de la medianoche, el reinicio es esa medianoche; en ella, la siguiente.
    const medianoche = new Date('2026-07-15T05:00:00Z').getTime()
    expect(videoReinicioSQL(medianoche - S)).toBe(medianoche)
    expect(videoReinicioSQL(medianoche)).toBe(medianoche + 24 * 3600 * S)
  })

  it('14 · el límite al pedir: el 11.º del minuto es limite sin efectos, y queda anotado', () => {
    const { b, ll, reloj } = banco()
    for (let i = 0; i < 10; i++) expect(ll('pedir_boleto').codigo).toBe('ok')
    const vivo = b.boletos.find((x) => x.anulado_en === null).id
    expect(ll('pedir_boleto')).toMatchObject({ codigo: 'limite', boleto_id: null, quedan: 8 })
    expect(b.boletos).toHaveLength(10)
    expect(b.boletos.find((x) => x.anulado_en === null).id).toBe(vivo)
    expect(b.intentos.filter((x) => x.funcion === 'pedir_boleto')).toHaveLength(11)
    reloj.t += 61 * S
    expect(ll('pedir_boleto').codigo).toBe('ok')
  })

  it('15 · K7: un cobro cortado por el límite se cobra entero después, con el mismo boleto', () => {
    const { b, ll, reloj } = banco()
    const p = ll('pedir_boleto').boleto_id
    reloj.t += VIDEO_MINIMO_S_SQL * S
    b.forzarLimite('cobrar_boleto', 2)
    expect(ll('cobrar_boleto', { p_boleto: p })).toMatchObject({ codigo: 'limite', cobrado: 0, saldo: 2500, quedan: 8, premio: 500 })
    expect(ll('cobrar_boleto', { p_boleto: p }).codigo).toBe('limite')
    expect(b.boletos[0]).toMatchObject({ cobrado_en: null, anulado_en: null })
    expect(ll('cobrar_boleto', { p_boleto: p })).toMatchObject({ codigo: 'ok', cobrado: 500, saldo: 3000 })
    expect(videos(b)).toHaveLength(1)
    // y el tope de verdad: 20 por minuto
    const otro = crearBanco({ saldo: 0, ahora: () => 5_000_000 })
    for (let i = 0; i < 20; i++) expect(otro.llamar('cobrar_boleto', { p_boleto: 'x' }).codigo).toBe('inexistente')
    expect(otro.llamar('cobrar_boleto', { p_boleto: 'x' }).codigo).toBe('limite')
  })

  it('16 · un boleto que no existe no se cobra', () => {
    const { b, ll } = banco()
    expect(ll('cobrar_boleto', { p_boleto: 'boleto-de-otro' })).toMatchObject({ codigo: 'inexistente', cobrado: 0, saldo: 2500 })
    expect(ll('cobrar_boleto', {})).toMatchObject({ codigo: 'inexistente' })
    expect(videos(b)).toHaveLength(0)
  })

  it('20 · el libro cuadra: cada boleto cobrado tiene su movimiento y ninguno más', () => {
    const { b, ll, reloj } = banco()
    for (let i = 0; i < 3; i++) { reloj.t += 60 * S; ver(ll, reloj) }
    ll('pedir_boleto')                      // uno sin cobrar
    const cobrados = b.boletos.filter((x) => x.cobrado_en !== null)
    expect(cobrados).toHaveLength(3)
    expect(videos(b).map((l) => l.clave).sort()).toEqual(cobrados.map((x) => `video:${x.id}`).sort())
    expect(b.saldo).toBe(2500 + b.libro.reduce((s, l) => s + l.monto, 0))
  })

  it('el mando de desarrollo acorta el mínimo; `rpc` contesta con la forma de PostgREST', async () => {
    const reloj = { t: 1_000_000_000 }
    const b = crearBanco({ saldo: 0, ahora: () => reloj.t, videoMinimoS: 3 })
    const { data: p, error } = await b.rpc('pedir_boleto')
    expect(error).toBeNull()
    expect(p.minimo_s).toBe(3)
    reloj.t += 3 * S
    expect((await b.rpc('cobrar_boleto', { p_boleto: p.boleto_id })).data).toMatchObject({ codigo: 'ok', saldo: 500 })
  })
})

describe('ECO-1g · las cifras del video, en espejo', () => {
  const dir = join(process.cwd(), 'supabase', 'migrations')
  const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.includes('eco1g_video'))), 'utf8')
  const cifra = (nombre) => new RegExp(`function public\\.${nombre}\\(\\)[^$]*\\$fn\\$ select ([^$]+?) \\$fn\\$`).exec(sql)[1]

  it('el premio, el tope, el mínimo y la vida del boleto: SQL = modelo', () => {
    expect(cifra('video_premio_hc')).toBe(`${VIDEO_PREMIO_SQL}::bigint`)
    expect(cifra('video_tope_dia')).toBe(String(VIDEO_TOPE_SQL))
    expect(cifra('video_minimo_s')).toBe(String(VIDEO_MINIMO_S_SQL))
    expect(cifra('video_vida_boleto')).toBe(`interval '${VIDEO_VIDA_MS_SQL / 60000} minutes'`)
  })

  it('el espejo del cliente (`videoReward`, `maxVideosPerDay`) dice lo mismo que el SQL', () => {
    // El premio lo dice el servidor (`premio` en `mi_video` y `cobrar_boleto`);
    // el del cliente sólo se usa mientras el servidor no ha contestado.
    expect(AJILEI_CONFIG.economy.videoReward).toBe(VIDEO_PREMIO_SQL)
    expect(AJILEI_CONFIG.economy.maxVideosPerDay).toBe(VIDEO_TOPE_SQL)
    // El video visible dura más que el mínimo del servidor (S2: sitio a la latencia).
    expect(AJILEI_CONFIG.economy.video.duracionMs).toBeGreaterThan(VIDEO_MINIMO_S_SQL * 1000)
    expect(AJILEI_CONFIG.economy.video.duracionMs).toBeLessThan(VIDEO_VIDA_MS_SQL)
  })

  it('los reintentos del cobro son los de la casa, y caben holgados en el límite', () => {
    expect([...ESPERAS_COBRO_MS]).toEqual([...ESPERAS_RED_MS])
    // El primer minuto: la llamada inicial (t = 0) más los reintentos que caen
    // antes de los 60 s (1, 3, 7, 15, 30 y 45 s). El de los 60 s ya es otro minuto.
    let t = 0
    let llamadas = 1
    for (let i = 0; t + ESPERAS_COBRO_MS[Math.min(i, ESPERAS_COBRO_MS.length - 1)] < 60000; i++) {
      t += ESPERAS_COBRO_MS[Math.min(i, ESPERAS_COBRO_MS.length - 1)]
      llamadas += 1
    }
    expect(llamadas).toBe(7)
    expect(llamadas).toBeLessThan(LIMITES_SQL.cobrar_boleto / 2)
  })
})
