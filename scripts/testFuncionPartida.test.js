// ── MOT-1 1e §3 · La función `partida`, sin red ─────────────────────────────
// El árbitro es el de verdad; lo falso es la base, y copia de `guardar_jugada` lo que la
// función no puede saltarse: la versión nueva es la leída + 1, o `estado_incoherente`.
// Vive aquí y no junto a la función porque `npm test` y `aislado` solo corren `scripts/`
// y `src/`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify } from 'jose'
import { resetRng, setRng } from '../src/engine/deck.js'
import { CLASES, ETAPAS, MOTIVOS as M, abandonarPorServidor, aplicarAccion, crearPartida, vistaDe } from '../src/arbitro/index.js'
import {
  ALGORITMOS_TOKEN, EVENTO_AVISO, EVENTO_MENSAJE, INTENTOS_SIMULTANEAS, cabecerasCors, crearEmisor, crearEmisorMensaje, crearManejador,
  crearVerificador, sillaDeFila,
} from '../supabase/functions/partida/nucleo.js'

const MESA = '11111111-2222-4333-8444-555555555555'
const SILLAS = ['A', 'B', 'C', 'D', 'E'].map((uid, i) => ({ asiento: i, uid, nombre: `J${uid}` }))
const SALA = { estado: 'activa', apuesta: 100, entrada: 'corta', ritmo: 'normal' }

function semilla(s) {
  let a = s >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// El banco en memoria y las dependencias. `alGuardar` entra antes de cada escritura: es
// el otro jugador que llega a la vez, y `choques` el que gana sin dejar rastro.
function montar({ n = 2, sala = SALA, sillas = SILLAS.slice(0, n), sinPartida = false, azar = semilla(7) } = {}) {
  const b = {
    hora: 1_000_000,
    orden: [],
    guardados: [],
    avisos: [],
    choques: 0,
    alGuardar: null,
    abandonos: [],
    registros: [],
    fila: null,
    // v1.3 · el freno de `anotar_mensaje`, por uid, y lo que se emitió por el canal.
    ultimoMensaje: new Map(),
    mensajes: [],
    frenoMs: 10000,
  }
  const rpc = vi.fn(async (nombre, args) => {
    b.orden.push(nombre)
    // v1.3 · con el saldo de cada asiento, como `leer_partida` de la segunda migración.
    if (nombre === 'leer_partida') {
      return b.fila ? [{ ...b.fila, abandonos: b.abandonos, saldos: b.saldos ?? b.fila.estado.asientos.map(() => 5000) }] : []
    }
    if (nombre === 'crear_partida') {
      if (b.fila) return { ok: true, creada: false, version: b.fila.version }
      b.fila = { estado: args.p_estado, version: args.p_estado.version }
      b.creada = args
      return { ok: true, creada: true, version: b.fila.version }
    }
    if (nombre === 'guardar_jugada') {
      if (args.p_estado.version !== args.p_version_leida + 1) throw new Error('estado_incoherente')
      if (args.p_vistas.length !== b.fila.estado.asientos.length) throw new Error('vistas_incompletas')
      // v1.3 · la copia de `aplicar_efectos`: el libro no cobra una recarga que el saldo de AHORA
      // no cubre, y la jugada entera se deshace. Quien relee ya ve ese saldo.
      const corta = args.p_efectos.find((x) => x.tipo === 'recarga' && x.monto > (b.saldoReal?.[x.asiento] ?? Infinity))
      if (corta) {
        b.saldos = b.saldoReal
        throw new Error('guardar_jugada: P0001 saldo_insuficiente')
      }
      if (b.choques > 0) {
        b.choques -= 1
        return { ok: false, motivo: 'version_vieja', version: b.fila.version }
      }
      if (b.alGuardar) {
        const otro = b.alGuardar
        b.alGuardar = null
        await otro()
      }
      if (args.p_version_leida !== b.fila.version) return { ok: false, motivo: 'version_vieja', version: b.fila.version }
      b.fila = { estado: args.p_estado, version: args.p_estado.version }
      b.guardados.push(args)
      return { ok: true, version: b.fila.version }
    }
    if (nombre === 'anotar_mensaje') {
      // La copia de lo que hace el SQL: asiento vivo de la mesa y freno de 10 s, atómico.
      const a = b.fila?.estado.asientos.find((x) => x.uid === args.p_uid)
      if (!a || a.cobrado !== null) return { ok: false, motivo: 'no_es_de_esta_mesa' }
      const ultima = b.ultimoMensaje.get(args.p_uid)
      if (ultima !== undefined && b.hora - ultima < b.frenoMs) return { ok: false, motivo: 'freno' }
      b.ultimoMensaje.set(args.p_uid, b.hora)
      return { ok: true }
    }
    throw new Error(`rpc desconocida: ${nombre}`)
  })
  const emitir = vi.fn(async (mesa, version) => {
    b.orden.push('emitir')
    b.avisos.push({ mesa, version })
  })
  const emitirMensaje = vi.fn(async (mesa, mensaje) => {
    b.orden.push('emitirMensaje')
    b.mensajes.push({ mesa, ...mensaje })
  })
  const leerSala = vi.fn(async () => sala)
  const leerSillas = vi.fn(async () => sillas)
  const manejar = crearManejador({
    verificarToken: async (token) => (token.startsWith('uid:') ? token.slice(4) : null),
    rpc,
    leerSala,
    leerSillas,
    emitir,
    emitirMensaje,
    ahora: () => b.hora,
    azar,
    registrar: (...cosas) => b.registros.push(cosas.join(' ')),
  })
  const pedir = async (uid, cuerpo) => {
    const r = await manejar(new Request('https://x/partida', {
      method: 'POST',
      headers: { Authorization: `Bearer uid:${uid}` },
      body: JSON.stringify({ mesa: MESA, ...cuerpo }),
    }))
    const { ahora, ...respuesta } = await r.json()
    expect(ahora).toBe(b.hora)
    return { status: r.status, ...respuesta }
  }
  // Pone una partida en la base sin pasar por la función.
  if (!sinPartida && sala?.estado === 'activa') {
    const estado = crearPartida(sala, sillas, b.hora)
    b.fila = { estado, version: estado.version }
  }
  return { b, rpc, emitir, emitirMensaje, leerSala, leerSillas, manejar, pedir }
}

// Reclama vencimientos, adelantando el reloj, hasta que `llego` lo diga.
async function hasta(m, llego, uid = 'A') {
  for (let i = 0; i < 60; i += 1) {
    if (llego(m.b.fila.estado)) break
    m.b.hora = Math.max(m.b.hora, m.b.fila.estado.vencimiento.hora)
    const r = await m.pedir(uid, { version: m.b.fila.version, accion: 'reclamar_vencimiento' })
    expect(r.ok).toBe(true)
    // Avanzar por reloj no debe abandonar a nadie: estas pruebas no van de la ausencia.
    const { estado } = m.b.fila
    m.b.fila.estado = { ...estado, asientos: estado.asientos.map((a) => ({ ...a, vencidos: 0 })) }
  }
  expect(llego(m.b.fila.estado)).toBe(true)
  m.b.guardados.length = 0
  m.b.avisos.length = 0
  m.b.orden.length = 0
  m.emitir.mockClear()
}

const enEleccion = (e) => e.sorteo.etapa === ETAPAS.ELECCION
const enApuesta = (e) => e.motor.phase === 'BET_1'
const enDescarte = (e) => e.motor.phase === 'DISCARD'

afterEach(() => resetRng())

// ── 1 · El token ────────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 1: sin token o con token inválido', () => {
  it.each([
    ['sin cabecera', {}],
    ['sin Bearer', { Authorization: 'uid:A' }],
    ['Bearer vacío', { Authorization: 'Bearer  ' }],
    ['token inválido', { Authorization: 'Bearer inventado' }],
  ])('%s: `no_autenticado` con 401, sin leer nada', async (_, headers) => {
    const m = montar()
    const r = await m.manejar(new Request('https://x/partida', {
      method: 'POST', headers, body: JSON.stringify({ mesa: MESA, version: 0, accion: 'apostar' }),
    }))
    expect(r.status).toBe(401)
    expect(await r.json()).toEqual({ ok: false, motivo: 'no_autenticado', version: null, ahora: expect.any(Number) })
    expect(m.rpc).not.toHaveBeenCalled()
    expect(m.leerSala).not.toHaveBeenCalled()
  })

  it('el uid sale del token: el del cuerpo no cuenta', async () => {
    const m = montar()
    const r = await m.pedir('NADIE', { uid: 'A', version: 0, accion: 'reclamar_vencimiento' })
    expect(r.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    expect(m.b.guardados).toEqual([])
  })
})

describe('MOT-1 1e · el verificador, con jose de verdad', () => {
  const firmar = (llave, alg, claims = {}, exp = '1h') => new SignJWT({ role: 'authenticated', ...claims })
    .setProtectedHeader({ alg, kid: 'k1' })
    .setSubject('uid-real')
    .setAudience('authenticated')
    .setExpirationTime(exp)
    .sign(llave)

  async function verificador() {
    const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true })
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' }
    return {
      privateKey,
      verificar: crearVerificador({ jwks: JSON.stringify({ keys: [jwk] }), createLocalJWKSet, jwtVerify }),
    }
  }

  it('una firma buena da el `sub`', async () => {
    const { privateKey, verificar } = await verificador()
    expect(await verificar(await firmar(privateKey, 'ES256'))).toBe('uid-real')
  })

  it('caducado, de otra llave o con otro rol: null', async () => {
    const { privateKey, verificar } = await verificador()
    const otra = await generateKeyPair('ES256', { extractable: true })
    expect(await verificar(await firmar(privateKey, 'ES256', {}, '-1m'))).toBeNull()
    expect(await verificar(await firmar(otra.privateKey, 'ES256'))).toBeNull()
    expect(await verificar(await firmar(privateKey, 'ES256', { role: 'anon' }))).toBeNull()
    expect(await verificar('no-es-un-token')).toBeNull()
    expect(await verificar('sb_publishable_algo')).toBeNull()
  })

  it('un token HS256 se rechaza: con el secreto heredado nadie entraría', async () => {
    const { verificar } = await verificador()
    expect(ALGORITMOS_TOKEN).not.toContain('HS256')
    const hs = await firmar(new TextEncoder().encode('secreto-heredado-de-al-menos-32-bytes!'), 'HS256')
    expect(await verificar(hs)).toBeNull()
  })

  it.each([
    ['ausente', null],
    ['vacío', '{"keys":[]}'],
    ['ilegible', 'no-es-json'],
  ])('un JWKS %s no se confunde con un token malo: 500, y ni rastro del detalle', async (_, jwks) => {
    const verificarToken = crearVerificador({ jwks, createLocalJWKSet, jwtVerify })
    const registros = []
    const manejar = crearManejador({ verificarToken, registrar: (...c) => registros.push(c.join(' ')) })
    const r = await manejar(new Request('https://x/partida', { method: 'POST', headers: { Authorization: 'Bearer cualquiera' }, body: '{}' }))
    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({ ok: false, motivo: 'servidor', version: null, ahora: expect.any(Number) })
    expect(registros.join()).toMatch(/SUPABASE_JWKS|JSON/)
  })

  it('el JWKS también vale como lista suelta', async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true })
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' }
    const verificar = crearVerificador({ jwks: JSON.stringify([jwk]), createLocalJWKSet, jwtVerify })
    expect(await verificar(await firmar(privateKey, 'ES256'))).toBe('uid-real')
  })
})

// ── 2 · Sin asiento ─────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 2: cuenta sin asiento', () => {
  it('con partida: `no_es_de_esta_mesa`, sin guardar ni emitir', async () => {
    const m = montar()
    const r = await m.pedir('Z', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.NO_ES_DE_ESTA_MESA, version: 0 })
    expect(m.b.guardados).toEqual([])
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it('con un abandono pedido: quien no es de la mesa no lo dispara', async () => {
    const m = montar({ n: 3 })
    m.b.abandonos = [1]
    const r = await m.pedir('Z', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    expect(m.b.guardados).toEqual([])
    expect(m.b.fila.estado.asientos[1].abandonado).toBe(false)
  })

  it('en el arranque: no crea la partida', async () => {
    const m = montar({ sinPartida: true })
    const r = await m.pedir('Z', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    expect(m.b.creada).toBeUndefined()
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it.each([['no es un uuid', 'no-soy-uuid'], ['falta', undefined], ['no es texto', 7]])('`mesa` %s: no llega a la base', async (_, mesa) => {
    const m = montar()
    const r = await m.pedir('A', { mesa, version: 0, accion: 'apostar' })
    expect(r.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it('un cuerpo que no es JSON tampoco', async () => {
    const m = montar()
    const r = await m.manejar(new Request('https://x/partida', { method: 'POST', headers: { Authorization: 'Bearer uid:A' }, body: '{roto' }))
    expect(r.status).toBe(200)
    expect((await r.json()).motivo).toBe(M.NO_ES_DE_ESTA_MESA)
  })
})

// ── 3 · El arranque ─────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 3: el arranque', () => {
  it('sala activa sin partida + `reclamar_vencimiento` con versión 0: crea y emite', async () => {
    const m = montar({ n: 3, sinPartida: true })
    const r = await m.pedir('B', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toEqual({ status: 200, ok: true, version: 0 })
    expect(m.b.orden).toEqual(['leer_partida', 'crear_partida', 'emitir'])
    expect(m.b.avisos).toEqual([{ mesa: MESA, version: 0 }])

    const { p_estado: estado, p_correspondencia: mapa, p_vistas: vistas, p_vencimiento: hora, p_sala: sala } = m.b.creada
    expect(sala).toBe(MESA)
    expect(estado.version).toBe(0)
    expect(mapa).toEqual({ A: 0, B: 1, C: 2 })
    expect(hora).toBe(new Date(estado.vencimiento.hora).toISOString())
    expect(vistas.map((v) => v.asiento)).toEqual([0, 1, 2])
    expect(vistas[1].vista).toEqual(vistaDe(estado, 1))
  })

  it('compacta las sillas con huecos y usa las cifras de la sala', async () => {
    const sillas = [
      { asiento: 3, uid: 'C', nombre: 'JC' },
      { asiento: 0, uid: 'A', nombre: 'JA' },
    ]
    const m = montar({ sillas, sinPartida: true, sala: { estado: 'activa', apuesta: 200, entrada: 'llena', ritmo: 'rapido' } })
    await m.pedir('C', { version: 0, accion: 'reclamar_vencimiento' })
    const { p_estado: estado, p_correspondencia: mapa } = m.b.creada
    expect(mapa).toEqual({ A: 0, C: 1 })
    expect(estado.asientos.map((a) => a.silla)).toEqual([0, 3])
    expect(estado.motor.players[0].chips).toBe(10_000)
    expect(estado.ritmo).toBe('rapido')
  })

  it('el azar es el inyectado: se fija antes de barajar', async () => {
    const azar = vi.fn(semilla(3))
    const m = montar({ sinPartida: true, azar })
    await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(azar).toHaveBeenCalled()
  })

  it('si otro llegó antes: `version_vieja` y no emite', async () => {
    const m = montar({ sinPartida: true })
    m.rpc.mockImplementationOnce(async () => [])
    m.b.fila = { estado: crearPartida(SALA, SILLAS.slice(0, 2), 0), version: 0 }
    const r = await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.VERSION_VIEJA, version: 0 })
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it.each([
    ['asientos_distintos', M.VERSION_VIEJA, 0],
    ['sala_no_activa', M.NO_ES_DE_ESTA_MESA, null],
  ])('`crear_partida` responde `%s`: `%s`, sin emitir', async (interno, motivo, version) => {
    const m = montar({ sinPartida: true })
    m.rpc.mockImplementation(async (nombre) => (nombre === 'leer_partida' ? [] : { ok: false, motivo: interno }))
    const r = await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toEqual({ status: 200, ok: false, motivo, version })
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it.each([
    ['otra acción', { version: 0, accion: 'apostar', tipo: 'pasar' }],
    ['otra versión', { version: 3, accion: 'reclamar_vencimiento' }],
  ])('activa sin partida con %s: `no_es_de_esta_mesa`', async (_, cuerpo) => {
    const m = montar({ sinPartida: true })
    const r = await m.pedir('A', cuerpo)
    expect(r.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    expect(m.b.creada).toBeUndefined()
  })

  it.each([
    ['terminada', M.PARTIDA_TERMINADA],
    ['cancelada', M.NO_ES_DE_ESTA_MESA],
    ['esperando', M.NO_ES_DE_ESTA_MESA],
  ])('sala %s sin partida: `%s`', async (estado, motivo) => {
    const m = montar({ sala: { ...SALA, estado }, sinPartida: true })
    const r = await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r.motivo).toBe(motivo)
    expect(m.leerSillas).not.toHaveBeenCalled()
  })

  it('una sala que no existe: `no_es_de_esta_mesa`', async () => {
    const m = montar({ sala: null, sinPartida: true })
    expect((await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })).motivo).toBe(M.NO_ES_DE_ESTA_MESA)
  })

  it('con una silla sola no llama al árbitro, que lanzaría', async () => {
    const m = montar({ sillas: SILLAS.slice(0, 1), sinPartida: true })
    const r = await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toMatchObject({ status: 200, motivo: M.NO_ES_DE_ESTA_MESA })
  })

  it('las filas de `sala_jugadores`, con el perfil como objeto o como lista', () => {
    expect(sillaDeFila({ asiento: 2, jugador_id: 'u', profiles: { username: 'x' } })).toEqual({ asiento: 2, uid: 'u', nombre: 'x' })
    expect(sillaDeFila({ asiento: 2, jugador_id: 'u', profiles: [{ username: 'x' }] })).toEqual({ asiento: 2, uid: 'u', nombre: 'x' })
    expect(sillaDeFila({ asiento: 2, jugador_id: 'u', profiles: null })).toEqual({ asiento: 2, uid: 'u', nombre: null })
  })
})

// ── 4 · Los abandonos pedidos ───────────────────────────────────────────────
describe('MOT-1 1e · regla 4: un abandono pedido', () => {
  it('se aplica antes de la acción, en la misma transacción y subiendo una versión', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.abandonos = [2]
    const { ronda } = m.b.fila.estado.sorteo
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda, carta: 1 })

    expect(r).toEqual({ status: 200, ok: true, version: leida + 1 })
    expect(m.b.guardados).toHaveLength(1)
    const [g] = m.b.guardados
    expect(g.p_version_leida).toBe(leida)
    expect(g.p_estado.version).toBe(leida + 1)
    expect(g.p_estado.asientos[2].abandonado).toBe(true)
    expect(g.p_estado.sorteo.elecciones[0]).toBe(1)
    expect(g.p_efectos.filter((e) => e.tipo === 'salida').map((e) => e.asiento)).toEqual([2])
    expect(g.p_vistas[0].vista.version).toBe(leida + 1)
    expect(m.b.avisos).toEqual([{ mesa: MESA, version: leida + 1 }])
  })

  it('una acción con versión no choca con el abandono que se aplica en su misma llamada', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enApuesta)
    const leida = m.b.fila.version
    const turno = m.b.fila.estado.motor.activePlayerIndex
    const otro = (turno + 1) % 3
    m.b.abandonos = [otro]
    const r = await m.pedir(SILLAS[turno].uid, { version: leida, accion: 'apostar', tipo: 'pasar' })
    expect(r).toEqual({ status: 200, ok: true, version: leida + 1 })
    expect(m.b.guardados[0].p_estado.asientos[otro].abandonado).toBe(true)
  })

  it('su `asiento_abandonado` se tolera: el asiento sigue en la lista y la acción pasa', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enApuesta)
    const turno = m.b.fila.estado.motor.activePlayerIndex
    const otro = (turno + 2) % 3
    const hecho = abandonarPorServidor(m.b.fila.estado, SILLAS[otro].uid, { ahora: m.b.hora })
    m.b.fila = { estado: hecho.estado, version: hecho.estado.version }
    m.b.abandonos = [otro]
    const leida = m.b.fila.version

    const r = await m.pedir(SILLAS[turno].uid, { version: leida, accion: 'apostar', tipo: 'pasar' })
    expect(r).toEqual({ status: 200, ok: true, version: leida + 1 })
    expect(m.b.registros).toEqual([])
  })

  it('tolerado y con la acción rechazada: no guarda nada', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enApuesta)
    const hecho = abandonarPorServidor(m.b.fila.estado, 'C', { ahora: m.b.hora })
    m.b.fila = { estado: hecho.estado, version: hecho.estado.version }
    m.b.abandonos = [2]
    const r = await m.pedir('A', { version: 999, accion: 'apostar', tipo: 'pasar' })
    expect(r.motivo).toBe(M.VERSION_VIEJA)
    expect(m.b.guardados).toEqual([])
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it('si la acción se rechaza, el abandono se guarda igual, emite y la respuesta sigue siendo el rechazo', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.abandonos = [2]
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 99, carta: 0 })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.FASE, version: leida + 1 })
    expect(m.b.guardados).toHaveLength(1)
    expect(m.b.guardados[0].p_estado.asientos[2].abandonado).toBe(true)
    expect(m.b.fila.version).toBe(leida + 1)
    expect(m.b.avisos).toEqual([{ mesa: MESA, version: leida + 1 }])
  })

  it('si el abandonado es quien llama: se guarda y recibe `asiento_abandonado`', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.abandonos = [0]
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 0 })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.ASIENTO_ABANDONADO, version: leida + 1 })
    expect(m.b.guardados).toHaveLength(1)
  })

  it('varios en la misma llamada: una sola versión, y si terminan la partida se guarda como tal', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.abandonos = [1, 2]
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 0 })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.PARTIDA_TERMINADA, version: leida + 1 })
    const [g] = m.b.guardados
    expect(g.p_estado.version).toBe(leida + 1)
    expect(g.p_terminada).toBe(true)
    expect(g.p_efectos.filter((e) => e.tipo === 'partida_terminada')).toHaveLength(1)
    expect(g.p_efectos.filter((e) => e.tipo === 'salida').map((e) => e.asiento).sort()).toEqual([0, 1, 2])
  })

  it('un abandono que llega con la partida ya acabada en esta misma llamada se tolera', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.abandonos = [0, 1, 2]
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 0 })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.PARTIDA_TERMINADA, version: leida + 1 })
    expect(m.b.guardados[0].p_terminada).toBe(true)
    expect(m.b.registros).toEqual([])
  })

  it('si solo llevaba abandonos y choca: el rechazo sigue valiendo y nada se guarda', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.abandonos = [2]
    m.b.choques = 1
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 99, carta: 0 })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.FASE, version: leida })
    expect(m.b.guardados).toEqual([])
  })

  it('un asiento que no existe no se esconde: 500', async () => {
    const m = montar({ n: 3 })
    m.b.abandonos = [7]
    const r = await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toMatchObject({ status: 500, motivo: 'servidor', version: null })
    expect(m.b.registros.join()).toMatch(/abandono del asiento 7/)
    expect(m.b.guardados).toEqual([])
  })
})

// ── 5 y 6 · Guardar y avisar ────────────────────────────────────────────────
describe('MOT-1 1e · regla 5: una acción válida', () => {
  it('guarda con sus efectos y emite una vez, después de guardar', async () => {
    const m = montar()
    await hasta(m, (e) => e.motor.phase === 'BET_1')
    const leida = m.b.fila.version
    const turno = m.b.fila.estado.motor.activePlayerIndex
    const r = await m.pedir(SILLAS[turno].uid, { version: leida, accion: 'apostar', tipo: 'retirarse' })

    expect(r).toEqual({ status: 200, ok: true, version: leida + 1 })
    expect(m.b.orden).toEqual(['leer_partida', 'guardar_jugada', 'emitir'])
    expect(m.emitir).toHaveBeenCalledTimes(1)
    expect(m.b.avisos).toEqual([{ mesa: MESA, version: leida + 1 }])

    const [g] = m.b.guardados
    expect(g.p_sala).toBe(MESA)
    expect(g.p_version_leida).toBe(leida)
    const cierre = g.p_efectos.find((e) => e.tipo === 'mano_cerrada')
    expect(cierre.pilas).toEqual(g.p_estado.motor.players.map((p) => p.chips))
    expect(g.p_terminada).toBe(false)
    expect(g.p_vencimiento).toBe(new Date(g.p_estado.vencimiento.hora).toISOString())
    expect(g.p_vistas).toEqual(g.p_estado.asientos.map((_, i) => ({ asiento: i, vista: vistaDe(g.p_estado, i) })))
  })

  it('la hora es la del servidor, no la que mande el cliente', async () => {
    const m = montar()
    const leida = m.b.fila.version
    const r = await m.pedir('A', { version: leida, accion: 'reclamar_vencimiento', ahora: 9e15 })
    expect(r.motivo).toBe(M.VENCIMIENTO_NO_CUMPLIDO)
  })

  it('el azar se fija en cada jugada, justo antes del árbitro', async () => {
    const azar = vi.fn(semilla(5))
    // Con esta semilla la primera ronda no empata: un empate abriría otra en vez de cerrar.
    setRng(semilla(1))
    const m = montar({ azar })
    await hasta(m, (e) => e.vencimiento?.clase === CLASES.VOLTEO_SORTEO)
    azar.mockClear()
    // Lo que hubiera quedado fijado antes no puede barajar esta mano.
    setRng(() => { throw new Error('azar de otra llamada') })
    m.b.hora = m.b.fila.estado.vencimiento.hora
    const r = await m.pedir('A', { version: m.b.fila.version, accion: 'reclamar_vencimiento' })
    expect(r.ok).toBe(true)
    expect(m.b.fila.estado.sorteo.etapa).toBe(ETAPAS.CERRADO)
    expect(azar).toHaveBeenCalled()
  })

  it('una partida que termina con el vencimiento nulo manda `null`', async () => {
    const m = montar()
    await hasta(m, enEleccion)
    await m.pedir('A', { version: m.b.fila.version, accion: 'abandonar' })
    expect(m.b.guardados[0].p_vencimiento).toBeNull()
  })
})

describe('MOT-1 1e · regla 6: un rechazo del árbitro', () => {
  it('no guarda ni emite, y conserva la versión', async () => {
    const m = montar()
    const leida = m.b.fila.version
    const r = await m.pedir('A', { version: leida, accion: 'reclamar_vencimiento' })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.VENCIMIENTO_NO_CUMPLIDO, version: leida })
    expect(m.b.orden).toEqual(['leer_partida'])
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it('una acción fuera de la lista: `accion_desconocida`', async () => {
    const m = montar()
    const r = await m.pedir('A', { version: 0, accion: 'arrancar' })
    expect(r.motivo).toBe(M.DESCONOCIDA)
    expect(m.b.guardados).toEqual([])
  })

  it('una RPC que falla da 500 con motivo genérico: el detalle, solo en el registro', async () => {
    const m = montar()
    m.rpc.mockImplementationOnce(async () => { throw new Error('leer_partida: 42501 permiso de la tabla secreta') })
    const r = await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })
    expect(r).toEqual({ status: 500, ok: false, motivo: 'servidor', version: null })
    expect(m.b.registros.join()).toMatch(/tabla secreta/)
    expect(m.emitir).not.toHaveBeenCalled()
  })
})

// ── 7 · Los choques ─────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 7: `version_vieja`', () => {
  it('dos eligen a la vez en el sorteo: los dos entran, y nadie recibe `version_vieja`', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    let delOtro
    m.b.alGuardar = async () => { delOtro = await m.pedir('B', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 4 }) }

    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 2 })
    expect(delOtro).toEqual({ status: 200, ok: true, version: leida + 1 })
    expect(r).toEqual({ status: 200, ok: true, version: leida + 2 })
    expect(m.b.fila.estado.sorteo.elecciones.slice(0, 2)).toEqual([2, 4])
    expect(m.emitir).toHaveBeenCalledTimes(2)
  })

  it('dos descartan a la vez: se relee y el segundo acierta', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enDescarte)
    const mano = m.b.fila.estado.motor.handCount
    const leida = m.b.fila.version
    m.b.alGuardar = async () => { await m.pedir('B', { version: leida, accion: 'descartar', mano, indices: [0] }) }
    const r = await m.pedir('A', { version: leida, accion: 'descartar', mano, indices: [] })
    expect(r).toEqual({ status: 200, ok: true, version: leida + 2 })
    expect(m.b.fila.estado.descarte.slice(0, 2)).toEqual([[], [0]])
  })

  it('dos vuelven del anuncio a la vez: se relee y el segundo acierta', async () => {
    const m = montar({ n: 3 })
    const estado = m.b.fila.estado
    const mano = 5
    m.b.fila = {
      version: 40,
      estado: {
        ...estado,
        version: 40,
        sorteo: { ...estado.sorteo, etapa: ETAPAS.CERRADO },
        motor: { ...estado.motor, handCount: mano, phase: 'PAYOUT' },
        asientos: estado.asientos.map((a) => ({ ...a, enAnuncio: true })),
        vencimiento: { clase: CLASES.PAUSA_ANUNCIO, hora: m.b.hora + 45000 },
      },
    }
    m.b.alGuardar = async () => { await m.pedir('B', { version: 40, accion: 'volver_anuncio', mano }) }
    const r = await m.pedir('A', { version: 40, accion: 'volver_anuncio', mano })
    expect(r).toEqual({ status: 200, ok: true, version: 42 })
    expect(m.b.fila.estado.asientos.map((a) => a.enAnuncio)).toEqual([false, false, true])
    expect(m.b.fila.estado.vencimiento.clase).toBe(CLASES.PAUSA_ANUNCIO)
  })

  it('si al releer la ronda ya no está abierta, rechaza con `fase` y no guarda', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.alGuardar = async () => {
      m.b.hora = m.b.fila.estado.vencimiento.hora
      await m.pedir('B', { version: m.b.fila.version, accion: 'reclamar_vencimiento' })
    }
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 2 })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.FASE, version: leida + 1 })
    expect(m.b.guardados).toHaveLength(1)
  })

  it('tras 5 choques se devuelve, y no se emite', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    m.b.choques = 99
    const r = await m.pedir('A', { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta: 2 })
    expect(INTENTOS_SIMULTANEAS).toBe(5)
    expect(r).toEqual({ status: 200, ok: false, motivo: M.VERSION_VIEJA, version: leida })
    expect(m.b.orden.filter((o) => o === 'guardar_jugada')).toHaveLength(5)
    expect(m.b.orden.filter((o) => o === 'leer_partida')).toHaveLength(5)
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it('con 4 choques, el quinto intento acierta', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    m.b.choques = 4
    const r = await m.pedir('A', { version: m.b.fila.version, accion: 'elegir_carta_sorteo', ronda: 1, carta: 2 })
    expect(r.ok).toBe(true)
    expect(m.emitir).toHaveBeenCalledTimes(1)
  })

  it('cinco asientos eligen a la vez: el último choca con los otros cuatro y entra', async () => {
    const m = montar({ n: 5 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    const delOtro = (uid, carta) => m.pedir(uid, { version: leida, accion: 'elegir_carta_sorteo', ronda: 1, carta })
    // Cada escritura del último la adelanta otro asiento, que entra a la primera.
    const adelantar = (resto) => {
      if (!resto.length) return
      const [[uid, carta], ...siguen] = resto
      m.b.alGuardar = async () => {
        const hecho = await delOtro(uid, carta)
        expect(hecho.ok).toBe(true)
        adelantar(siguen)
      }
    }
    adelantar([['B', 1], ['C', 2], ['D', 3], ['E', 4]])

    const r = await delOtro('A', 0)
    expect(r).toEqual({ status: 200, ok: true, version: leida + 5 })
    expect(m.b.orden.filter((o) => o === 'guardar_jugada')).toHaveLength(9)
    expect(m.emitir).toHaveBeenCalledTimes(5)
  })

  it('en `apostar` se devuelve tal cual, al primer choque', async () => {
    const m = montar()
    await hasta(m, enApuesta)
    const leida = m.b.fila.version
    const turno = m.b.fila.estado.motor.activePlayerIndex
    m.b.choques = 1
    const r = await m.pedir(SILLAS[turno].uid, { version: leida, accion: 'apostar', tipo: 'retirarse' })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.VERSION_VIEJA, version: leida })
    expect(m.b.orden.filter((o) => o === 'guardar_jugada')).toHaveLength(1)
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it('una versión vieja que llega del cliente se rechaza sin tocar la base', async () => {
    const m = montar()
    await hasta(m, enApuesta)
    const turno = m.b.fila.estado.motor.activePlayerIndex
    const r = await m.pedir(SILLAS[turno].uid, { version: 0, accion: 'apostar', tipo: 'retirarse' })
    expect(r.motivo).toBe(M.VERSION_VIEJA)
    expect(m.b.orden).toEqual(['leer_partida'])
  })

  it('`sin_partida` de `guardar_jugada`: la mesa ya no está', async () => {
    const m = montar()
    await hasta(m, enEleccion)
    const { fila } = m.b
    m.rpc.mockImplementation(async (nombre) => (
      nombre === 'leer_partida' ? [{ ...fila, abandonos: [] }] : { ok: false, motivo: 'sin_partida', version: null }
    ))
    const r = await m.pedir('A', { version: fila.version, accion: 'abandonar' })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.NO_ES_DE_ESTA_MESA, version: null })
    expect(m.emitir).not.toHaveBeenCalled()
  })

  it('`partida_terminada` de `guardar_jugada` (la partida muerta) llega tal cual', async () => {
    const m = montar()
    await hasta(m, enEleccion)
    const { fila } = m.b
    m.rpc.mockImplementation(async (nombre) => (
      nombre === 'leer_partida' ? [{ ...fila, abandonos: [] }] : { ok: false, motivo: 'partida_terminada', version: fila.version }
    ))
    const r = await m.pedir('A', { version: fila.version, accion: 'abandonar' })
    expect(r).toEqual({ status: 200, ok: false, motivo: M.PARTIDA_TERMINADA, version: fila.version })
    expect(m.emitir).not.toHaveBeenCalled()
  })
})

// ── 8 · El aviso ────────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 8: si el aviso falla', () => {
  it('la respuesta sigue siendo `ok`, y queda en el registro', async () => {
    const m = montar()
    await hasta(m, enApuesta)
    const leida = m.b.fila.version
    const turno = m.b.fila.estado.motor.activePlayerIndex
    m.emitir.mockRejectedValueOnce(new Error('Broadcast contestó 500'))
    const r = await m.pedir(SILLAS[turno].uid, { version: leida, accion: 'apostar', tipo: 'retirarse' })
    expect(r).toEqual({ status: 200, ok: true, version: leida + 1 })
    expect(m.b.guardados).toHaveLength(1)
    expect(m.b.registros.join()).toMatch(/Broadcast contestó 500/)
  })

  it('tampoco en el arranque', async () => {
    const m = montar({ sinPartida: true })
    m.emitir.mockRejectedValueOnce(new Error('red'))
    expect(await m.pedir('A', { version: 0, accion: 'reclamar_vencimiento' })).toEqual({ status: 200, ok: true, version: 0 })
  })
})

describe('MOT-1 1e · el emisor', () => {
  const emitirCon = (secreta, status = 202) => {
    const pedir = vi.fn(async () => ({ ok: status < 300, status }))
    return { pedir, emitir: crearEmisor({ base: 'https://p.supabase.co', secreta, fetch: pedir }) }
  }

  it('al canal privado de la mesa, con la versión y nada más', async () => {
    const { pedir, emitir } = emitirCon('sb_secret_x')
    await emitir(MESA, 8)
    const [url, op] = pedir.mock.calls[0]
    expect(url).toBe('https://p.supabase.co/realtime/v1/api/broadcast')
    expect(op.method).toBe('POST')
    expect(JSON.parse(op.body)).toEqual({
      messages: [{ topic: `partida:${MESA}`, event: EVENTO_AVISO, payload: { version: 8 }, private: true }],
    })
    expect(op.headers).toEqual({ apikey: 'sb_secret_x', 'Content-Type': 'application/json' })
  })

  it('una llave heredada, además, en Authorization', async () => {
    const { pedir, emitir } = emitirCon('eyJ.heredada')
    await emitir(MESA, 8)
    expect(pedir.mock.calls[0][1].headers.Authorization).toBe('Bearer eyJ.heredada')
  })

  it('una respuesta que no es 2xx lanza', async () => {
    await expect(emitirCon('sb_secret_x', 403).emitir(MESA, 8)).rejects.toThrow(/403/)
  })
})

// ── 9 · El final ────────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 9: `terminada`', () => {
  it('llega a `guardar_jugada` cuando el árbitro termina la partida', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enEleccion)
    const leida = m.b.fila.version
    const r = await m.pedir('A', { version: leida, accion: 'abandonar' })
    expect(r).toEqual({ status: 200, ok: true, version: leida + 1 })
    const [g] = m.b.guardados
    expect(g.p_terminada).toBe(true)
    expect(g.p_efectos.filter((e) => e.tipo === 'partida_terminada')).toHaveLength(1)
    expect(g.p_efectos.filter((e) => e.tipo === 'salida')).toHaveLength(2)
  })

  it('y no llega con la partida viva', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enEleccion)
    await m.pedir('A', { version: m.b.fila.version, accion: 'abandonar' })
    expect(m.b.guardados[0].p_terminada).toBe(false)
  })

  it('con la partida terminada: `partida_terminada`, sin guardar', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enEleccion)
    await m.pedir('A', { version: m.b.fila.version, accion: 'abandonar' })
    m.b.guardados.length = 0
    m.b.abandonos = [1]
    const r = await m.pedir('B', { version: m.b.fila.version, accion: 'reclamar_vencimiento' })
    expect(r.motivo).toBe(M.PARTIDA_TERMINADA)
    expect(m.b.guardados).toEqual([])
  })
})

// ── 10 · CORS ───────────────────────────────────────────────────────────────
describe('MOT-1 1e · regla 10: el `OPTIONS` del navegador', () => {
  const opciones = (Origin) => {
    const m = montar()
    return m.manejar(new Request('https://x/partida', { method: 'OPTIONS', headers: { Origin } })).then((r) => ({ r, m }))
  }

  it.each([
    'https://ajilei.io',
    'https://www.ajilei.io',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://uno-dos-tres.trycloudflare.com',
  ])('%s: 204 con las cabeceras, sin tocar nada', async (origen) => {
    const { r, m } = await opciones(origen)
    expect(r.status).toBe(204)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(origen)
    expect(r.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    expect(r.headers.get('Access-Control-Allow-Headers')).toContain('authorization')
    expect(r.headers.get('Vary')).toBe('Origin')
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it.each([
    'https://ajilei.io.malo.com',
    'https://www.ajilei.io.malo.com',
    'http://www.ajilei.io',
    'http://ajilei.io',
    'http://localhost:9999',
    'https://malo.com',
    'https://trycloudflare.com',
    'https://a.b.trycloudflare.com',
  ])('%s: sin cabeceras', (origen) => {
    expect(cabecerasCors(origen)).toEqual({ Vary: 'Origin' })
  })

  it('también en las respuestas de verdad: el navegador las lee', async () => {
    const m = montar()
    const r = await m.manejar(new Request('https://x/partida', { method: 'POST', headers: { Origin: 'https://ajilei.io' }, body: '{}' }))
    expect(r.status).toBe(401)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('https://ajilei.io')
    expect(r.headers.get('Content-Type')).toContain('application/json')
  })

  it('otro método: 405, en JSON', async () => {
    const m = montar()
    const r = await m.manejar(new Request('https://x/partida'))
    expect(r.status).toBe(405)
    expect(await r.json()).toEqual({ ok: false, motivo: 'metodo', version: null, ahora: expect.any(Number) })
  })
})

// ── Lo que el contrato pide de la función, en su texto ──────────────────────
describe('MOT-1 1e · la función de verdad', () => {
  const fuente = readFileSync(new URL('../supabase/functions/partida/index.ts', import.meta.url), 'utf8')

  it('sus dependencias llevan versión fija', () => {
    const especificadores = [...fuente.matchAll(/from '((?:npm|jsr):[^']+)'/g)].map((m) => m[1])
    expect(especificadores.length).toBeGreaterThan(0)
    for (const e of especificadores) expect(e).toMatch(/@\d+\.\d+\.\d+$/)
  })

  it('verifica en local: no llama a /auth/v1/user', () => {
    expect(fuente).not.toMatch(/fetch\(.*auth\/v1\/user/)
    expect(fuente).toContain("env('SUPABASE_JWKS')")
  })

  it('config.toml la deja sin la puerta del gateway', () => {
    const toml = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8')
    expect(toml).toMatch(/\[functions\.partida\]\s*\nverify_jwt = false/)
  })

  it('el árbitro no se entera: `aplicarAccion` sigue rechazando la versión que no toca', () => {
    const e = crearPartida(SALA, SILLAS.slice(0, 2), 0)
    expect(aplicarAccion(e, { uid: 'A', version: 5, accion: 'abandonar' }, { ahora: 0 }).respuesta.motivo).toBe(M.VERSION_VIEJA)
  })
})

// ── 11 · El mensaje (árbitro v1.3, ruta B) ──────────────────────────────────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md §2.3.
describe('v1.3-a · el mensaje de la mesa', () => {
  const enMano = (e) => e.motor.phase === 'BET_1' && e.vencimiento?.clase === CLASES.TURNO

  it('pasa: anota el freno, emite `{ asiento, clave }` y no guarda ni sube la versión', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enMano)
    const v = m.b.fila.version
    const r = await m.pedir('C', { version: v, accion: 'mensaje', clave: 'que_va' })
    expect(r).toEqual({ status: 200, ok: true, version: v })
    expect(m.b.fila.version).toBe(v)
    expect(m.b.guardados).toEqual([])
    expect(m.b.avisos).toEqual([])
    expect(m.b.mensajes).toEqual([{ mesa: MESA, asiento: 2, clave: 'que_va' }])
    expect(m.b.orden).toEqual(['leer_partida', 'anotar_mensaje', 'emitirMensaje'])
  })

  it('el asiento sale del uid del token: el del cuerpo no cuenta', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enMano)
    await m.pedir('B', { accion: 'mensaje', clave: 'ajilei', asiento: 0, uid: 'A' })
    expect(m.b.mensajes.map((x) => x.asiento)).toEqual([1])
    expect([...m.b.ultimoMensaje.keys()]).toEqual(['B'])
  })

  it('el freno de 10 s por jugador: el segundo rebota, y no limita a los demás', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enMano)
    expect((await m.pedir('A', { accion: 'mensaje', clave: 'ajilei' })).ok).toBe(true)
    m.b.hora += 9999
    const r = await m.pedir('A', { accion: 'mensaje', clave: 'suerte' })
    expect(r.motivo).toBe(M.FRENO)
    expect((await m.pedir('B', { accion: 'mensaje', clave: 'suerte' })).ok).toBe(true)
    m.b.hora += 1
    expect((await m.pedir('A', { accion: 'mensaje', clave: 'suerte' })).ok).toBe(true)
    expect(m.b.mensajes.map((x) => `${x.asiento}:${x.clave}`)).toEqual(['0:ajilei', '1:suerte', '0:suerte'])
  })

  it('clave desconocida, abandonado, en su anuncio o sin asiento: rechazo sin anotar ni emitir', async () => {
    const m = montar({ n: 3 })
    await hasta(m, enMano)
    const motivo = async (uid, clave = 'ajilei') => (await m.pedir(uid, { accion: 'mensaje', clave })).motivo
    expect(await motivo('A', '2660_fe0f')).toBe(M.CLAVE_DESCONOCIDA)
    expect(await motivo('A', null)).toBe(M.CLAVE_DESCONOCIDA)
    expect(await motivo('Z')).toBe(M.NO_ES_DE_ESTA_MESA)
    const { estado } = m.b.fila
    m.b.fila.estado = {
      ...estado,
      asientos: estado.asientos.map((a, i) => (i === 1 ? { ...a, abandonado: true } : i === 2 ? { ...a, enAnuncio: true } : a)),
    }
    expect(await motivo('B')).toBe(M.ASIENTO_ABANDONADO)
    expect(await motivo('C')).toBe(M.EN_ANUNCIO)
    expect(m.b.ultimoMensaje.size).toBe(0)
    expect(m.b.mensajes).toEqual([])
    expect(m.rpc.mock.calls.filter(([n]) => n === 'anotar_mensaje')).toEqual([])
  })

  it('sin partida todavía: `no_es_de_esta_mesa`, sin arrancarla', async () => {
    const m = montar({ n: 2, sinPartida: true })
    const r = await m.pedir('A', { accion: 'mensaje', clave: 'ajilei' })
    expect(r.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    expect(m.b.fila).toBe(null)
    expect(m.leerSala).not.toHaveBeenCalled()
  })

  it('si el canal falla: `ok` igual, el freno queda anotado y el fallo, en el registro', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enMano)
    m.emitirMensaje.mockRejectedValueOnce(new Error('Broadcast contestó 500'))
    const r = await m.pedir('A', { accion: 'mensaje', clave: 'ajilei' })
    expect(r.ok).toBe(true)
    expect(m.b.ultimoMensaje.has('A')).toBe(true)
    expect(m.b.registros.join(' | ')).toMatch(/mensaje.*500/)
  })

  it('el emisor del mensaje: al canal de la mesa, evento `mensaje`, con asiento y clave y nada más', async () => {
    const pedir = vi.fn(async () => ({ ok: true, status: 202 }))
    const emitir = crearEmisorMensaje({ base: 'https://p.supabase.co', secreta: 'sb_secret_x', fetch: pedir })
    await emitir(MESA, { asiento: 3, clave: 'te_miro', extra: 'no' })
    expect(EVENTO_MENSAJE).toBe('mensaje')
    expect(JSON.parse(pedir.mock.calls[0][1].body)).toEqual({
      messages: [{ topic: `partida:${MESA}`, event: 'mensaje', payload: { asiento: 3, clave: 'te_miro' }, private: true }],
    })
  })
})

// ── 12 · La recarga (árbitro v1.3-b) ────────────────────────────────────────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3b_v1.0.md §2.2: los saldos de `leer_partida` llegan al árbitro
// con la hora, y si el saldo bajó al guardar, la jugada se repite UNA vez con saldos frescos.
describe('v1.3-b · la recarga en la función', () => {
  const enPausa = (e) => e.vencimiento?.clase === CLASES.MANO_SIGUIENTE
  const enTurno = (e) => e.motor.phase === 'BET_1' && e.vencimiento?.clase === CLASES.TURNO
  const tocar = (m, i, cambios, pila = null) => {
    const { estado } = m.b.fila
    m.b.fila.estado = {
      ...estado,
      asientos: estado.asientos.map((a, j) => (j === i ? { ...a, ...cambios } : a)),
      motor: { ...estado.motor, players: estado.motor.players.map((p, j) => (j === i && pila !== null ? { ...p, chips: pila } : p)) },
    }
  }

  it('el saldo de `leer_partida` llega al árbitro: recarga si alcanza, `saldo_insuficiente` si no, y nunca se guarda', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enPausa)
    tocar(m, 0, {}, 700)
    const mano = m.b.fila.estado.motor.handCount
    m.b.saldos = [799, 5000]
    const corto = await m.pedir('A', { accion: 'recargar', mano })
    expect(corto.motivo).toBe(M.SALDO_INSUFICIENTE)
    expect(m.b.guardados).toEqual([])
    m.b.saldos = [800, 5000]
    const r = await m.pedir('A', { accion: 'recargar', mano })
    expect(r.ok).toBe(true)
    expect(m.b.guardados[0].p_efectos).toEqual([{ tipo: 'recarga', asiento: 0, monto: 800, mano }])
    expect(JSON.stringify(m.b.guardados[0].p_estado)).not.toMatch(/saldos/)
    expect(m.b.fila.estado.motor.players[0].chips).toBe(1500)
  })

  it('va contra la `mano` y reintenta al chocar, como las simultáneas', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enTurno)
    tocar(m, 1, {}, 700)
    m.b.choques = 2
    const r = await m.pedir('B', { version: 0, accion: 'pedir_recarga', mano: m.b.fila.estado.motor.handCount })
    expect(r.ok).toBe(true)
    expect(m.b.fila.estado.asientos[1].pedida).toBe(true)
    expect(m.b.orden.filter((x) => x === 'guardar_jugada')).toHaveLength(3)
  })

  it('si el saldo bajó entre la lectura y la escritura: relee UNA vez y la recarga se cancela con `saldo`', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enTurno)
    tocar(m, 0, { pedida: true }, 700)
    m.b.saldos = [5000, 5000]
    m.b.saldoReal = [100, 5000]
    const activo = m.b.fila.estado.motor.activePlayerIndex
    const r = await m.pedir(['A', 'B'][activo], { version: m.b.fila.version, accion: 'apostar', tipo: 'retirarse' })
    expect(r.ok).toBe(true)
    expect(m.b.orden).toEqual(['leer_partida', 'guardar_jugada', 'leer_partida', 'guardar_jugada', 'emitir'])
    const [guardado] = m.b.guardados
    expect(guardado.p_efectos.filter((x) => x.tipo === 'recarga')).toEqual([])
    expect(m.b.fila.estado.asientos[0]).toMatchObject({ pedida: false, cancelada: { motivo: 'saldo', mano: m.b.fila.estado.motor.handCount } })
    expect(m.b.registros.join(' | ')).toMatch(/no alcanzó al guardar/)
  })

  it('el reintento es uno solo: si vuelve a faltar, 500 sin guardar nada', async () => {
    const m = montar({ n: 2 })
    await hasta(m, enTurno)
    tocar(m, 0, { pedida: true }, 700)
    m.b.saldos = [5000, 5000]
    m.b.saldoReal = [100, 5000]
    // Otra pestaña sigue gastando: lo que se relee vuelve a ser más de lo que hay.
    m.rpc.mockImplementation(async (nombre, args) => {
      if (nombre === 'leer_partida') return [{ ...m.b.fila, abandonos: [], saldos: [5000, 5000] }]
      if (nombre === 'guardar_jugada') {
        m.b.orden.push(nombre)
        throw new Error('guardar_jugada: P0001 saldo_insuficiente')
      }
      throw new Error(`rpc inesperada: ${nombre} ${JSON.stringify(args).slice(0, 40)}`)
    })
    const activo = m.b.fila.estado.motor.activePlayerIndex
    const r = await m.pedir(['A', 'B'][activo], { version: m.b.fila.version, accion: 'apostar', tipo: 'retirarse' })
    expect(r.status).toBe(500)
    expect(m.b.orden.filter((x) => x === 'guardar_jugada')).toHaveLength(2)
    expect(m.b.guardados).toEqual([])
  })
})
