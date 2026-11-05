// MOT-1 1f · El cliente de la partida, con un doble de Supabase: sin red y sin socket.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOTIVOS as M } from '../arbitro/motivos.js'
import { CLASES } from '../arbitro/reloj.js'
import { ETAPAS } from '../arbitro/sorteo.js'
import { FASE_SORTEO as SORTEO_ARBITRO } from '../arbitro/vista.js'
import { PHASES } from '../engine/gameEngine.js'
import { EVENTO_AVISO as AVISO_FUNCION } from '../../supabase/functions/partida/nucleo.js'
import {
  CLASE_PAUSA_ANUNCIO, ETAPA_ELECCION, EVENTO_AVISO, FASE_DESCARTE, FASE_FIN, FASE_SORTEO, MARGEN_VENCIMIENTO_MS,
  REINTENTO_RECLAMO_MS, RELECTURA_MS, REVISION_MS, crearClientePartida, leerMarcaMot1,
} from './partidaCliente'

const MESA = '11111111-1111-4111-8111-111111111111'
const TOKEN = 'token-del-jugador'

const filaDe = (version, vencimiento = null, propio = {}) => ({
  version,
  asiento: 0,
  vista: { version, asiento: 0, vencimiento, players: [{ abandonado: false, ...propio }] },
})

function doble({ fila = filaDe(1), responder = () => ({ ok: true, version: 2 }) } = {}) {
  const d = { fila, orden: [], aviso: null, alEstado: null }
  d.maybeSingle = vi.fn(async () => {
    d.orden.push('leer')
    return { data: d.fila, error: null }
  })
  d.eq = vi.fn(() => ({ maybeSingle: d.maybeSingle }))
  d.invoke = vi.fn(async (_nombre, { body }) => ({ data: responder(body), error: null }))
  const canal = {
    on: vi.fn((_tipo, _filtro, cb) => { d.aviso = cb; return canal }),
    subscribe: vi.fn((cb) => { d.orden.push('subscribe'); d.alEstado = cb; return canal }),
  }
  d.canal = canal
  d.cliente = {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: TOKEN } } })) },
    functions: { invoke: d.invoke },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: d.eq })) })),
    realtime: { setAuth: vi.fn(async () => { d.orden.push('setAuth') }) },
    channel: vi.fn(() => canal),
    removeChannel: vi.fn(),
  }
  return d
}

const reposar = () => vi.advanceTimersByTimeAsync(0)

async function arrancado(opciones) {
  const d = doble(opciones)
  const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
  await c.iniciar()
  await reposar()
  d.maybeSingle.mockClear()
  return { d, c }
}

const reclamos = (d) => d.invoke.mock.calls.filter(([, { body }]) => body.accion === 'reclamar_vencimiento')

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('MOT-1 1f · los literales son los del servidor', () => {
  it('el evento, las fases y la etapa coinciden con la función y el árbitro', () => {
    expect(EVENTO_AVISO).toBe(AVISO_FUNCION)
    expect(FASE_SORTEO).toBe(SORTEO_ARBITRO)
    expect(FASE_DESCARTE).toBe(PHASES.DISCARD)
    expect(FASE_FIN).toBe(PHASES.GAME_OVER)
    expect(ETAPA_ELECCION).toBe(ETAPAS.ELECCION)
    expect(CLASE_PAUSA_ANUNCIO).toBe(CLASES.PAUSA_ANUNCIO)
  })
})

describe('MOT-1 1f · enviar una acción', () => {
  it('manda el token de la sesión, la mesa, la versión vigente y los campos', async () => {
    const { d, c } = await arrancado()
    const r = await c.enviar('apostar', { tipo: 'pasar' })
    expect(r).toEqual({ ok: true, version: 2 })
    expect(d.invoke).toHaveBeenCalledWith('partida', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: { mesa: MESA, accion: 'apostar', version: 1, tipo: 'pasar' },
    })
    c.parar()
  })

  it('sin sesión no sale a la red y responde `no_autenticado`', async () => {
    const { d, c } = await arrancado()
    d.cliente.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    expect((await c.enviar('abandonar')).motivo).toBe(M.NO_AUTENTICADO)
    expect(d.invoke).not.toHaveBeenCalled()
    c.parar()
  })

  it('un 401 se lee del cuerpo y un fallo de red es `red`, sin lanzar', async () => {
    const { d, c } = await arrancado()
    d.invoke.mockResolvedValueOnce({
      data: null,
      error: { name: 'FunctionsHttpError', context: { json: async () => ({ ok: false, motivo: M.NO_AUTENTICADO, version: null }) } },
    })
    expect((await c.enviar('abandonar')).motivo).toBe(M.NO_AUTENTICADO)
    d.invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsFetchError' } })
    expect((await c.enviar('abandonar')).motivo).toBe('red')
    expect(c.foto().rechazo).toEqual({ accion: 'abandonar', motivo: 'red' })
    c.parar()
  })

  it('mide la acción, relee si hay versión nueva y deja el rechazo a la vista', async () => {
    const { d, c } = await arrancado({ responder: () => ({ ok: false, motivo: M.FUERA_DE_TURNO, version: 1 }) })
    d.invoke.mockImplementationOnce(async () => {
      await vi.advanceTimersByTimeAsync(120)
      return { data: { ok: false, motivo: M.FUERA_DE_TURNO, version: 1 }, error: null }
    })
    await c.enviar('apostar', { tipo: 'pasar' })
    expect(c.foto().msAccion).toBe(120)
    expect(c.foto().rechazo).toEqual({ accion: 'apostar', motivo: M.FUERA_DE_TURNO })
    expect(d.maybeSingle).not.toHaveBeenCalled()

    d.fila = filaDe(2)
    d.invoke.mockResolvedValueOnce({ data: { ok: true, version: 2 }, error: null })
    await c.enviar('apostar', { tipo: 'pasar' })
    expect(c.foto().version).toBe(2)
    c.parar()
  })
})

describe('MOT-1 1f · leer y escuchar', () => {
  it('lee la vista de esa mesa, sin filtrar por cuenta: la RLS deja solo la propia', async () => {
    const { d, c } = await arrancado()
    expect(d.cliente.from).toHaveBeenCalledWith('partida_vistas')
    expect(d.eq.mock.calls.every(([col, val]) => col === 'sala_id' && val === MESA)).toBe(true)
    expect(c.foto().version).toBe(1)
    c.parar()
  })

  it('el canal es privado, el del tema de la mesa, y Realtime lleva el token antes de suscribirse', async () => {
    const { d, c } = await arrancado()
    expect(d.cliente.realtime.setAuth).toHaveBeenCalledWith(TOKEN)
    expect(d.cliente.channel).toHaveBeenCalledWith(`partida:${MESA}`, { config: { private: true } })
    expect(d.canal.on).toHaveBeenCalledWith('broadcast', { event: 'version' }, expect.any(Function))
    expect(d.orden.indexOf('setAuth')).toBeLessThan(d.orden.indexOf('subscribe'))
    c.parar()
    expect(d.cliente.removeChannel).toHaveBeenCalledWith(d.canal)
  })

  it('relee al quedar suscrito: lo anterior no avisó a nadie', async () => {
    const { d, c } = await arrancado()
    d.alEstado('SUBSCRIBED')
    await reposar()
    expect(d.maybeSingle).toHaveBeenCalledTimes(1)
    expect(c.foto().canal).toBe('SUBSCRIBED')
    c.parar()
  })

  it('una versión mayor relee y mide del aviso al final de la lectura', async () => {
    const { d, c } = await arrancado()
    d.fila = filaDe(2)
    d.maybeSingle.mockImplementationOnce(async () => {
      await vi.advanceTimersByTimeAsync(80)
      return { data: d.fila, error: null }
    })
    d.aviso({ payload: { version: 2 } })
    await vi.advanceTimersByTimeAsync(100)
    expect(d.maybeSingle).toHaveBeenCalledTimes(1)
    expect(c.foto().version).toBe(2)
    expect(c.foto().msAviso).toBe(80)
    expect(c.foto().avisos).toBe(1)
    c.parar()
  })

  it.each([[1], [0]])('una versión igual o menor (%i) no relee', async (version) => {
    const { d, c } = await arrancado()
    d.aviso({ payload: { version } })
    await reposar()
    expect(d.maybeSingle).not.toHaveBeenCalled()
    expect(c.foto().avisos).toBe(1)
    c.parar()
  })

  it('un aviso sin versión numérica no cuenta', async () => {
    const { d, c } = await arrancado()
    d.aviso({ payload: {} })
    d.aviso({})
    await reposar()
    expect(c.foto().avisos).toBe(0)
    expect(d.maybeSingle).not.toHaveBeenCalled()
    c.parar()
  })

  it('el aviso que llega con una lectura en el aire vuelve a leer al acabar', async () => {
    const { d, c } = await arrancado()
    let soltar
    d.maybeSingle.mockImplementationOnce(() => new Promise((res) => { soltar = () => res({ data: filaDe(2), error: null }) }))
    d.aviso({ payload: { version: 2 } })
    await reposar()
    d.fila = filaDe(3)
    d.aviso({ payload: { version: 3 } })
    await reposar()
    expect(d.maybeSingle).toHaveBeenCalledTimes(1)
    soltar()
    await reposar()
    expect(d.maybeSingle).toHaveBeenCalledTimes(2)
    expect(c.foto().version).toBe(3)
    c.parar()
  })

  it('una lectura que trae una versión vieja no pisa la vista', async () => {
    const { d, c } = await arrancado({ fila: filaDe(5) })
    d.fila = filaDe(4)
    await c.releer()
    expect(c.foto().version).toBe(5)
    c.parar()
  })

  it('«su aviso» se mide igual si llega antes o después de la respuesta', async () => {
    const { d, c } = await arrancado()
    d.invoke.mockImplementationOnce(async () => {
      await vi.advanceTimersByTimeAsync(50)
      d.aviso({ payload: { version: 2 } })
      await vi.advanceTimersByTimeAsync(20)
      return { data: { ok: true, version: 2 }, error: null }
    })
    d.fila = filaDe(2)
    await c.enviar('abandonar')
    expect(c.foto().msEco).toBe(50)

    d.invoke.mockImplementationOnce(async () => {
      await vi.advanceTimersByTimeAsync(30)
      return { data: { ok: true, version: 3 }, error: null }
    })
    d.fila = filaDe(3)
    await c.enviar('abandonar')
    await vi.advanceTimersByTimeAsync(40)
    d.aviso({ payload: { version: 3 } })
    expect(c.foto().msEco).toBe(70)
    c.parar()
  })
})

describe('MOT-1 1f · el bus no manda', () => {
  it('al volver a primer plano relee, sin aviso', async () => {
    const d = doble()
    const oyentes = {}
    const documento = {
      visibilityState: 'hidden',
      addEventListener: vi.fn((n, f) => { oyentes[n] = f }),
      removeEventListener: vi.fn(),
    }
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento })
    await c.iniciar()
    await reposar()
    d.maybeSingle.mockClear()

    oyentes.visibilitychange()
    await reposar()
    expect(d.maybeSingle).not.toHaveBeenCalled()

    documento.visibilityState = 'visible'
    oyentes.visibilitychange()
    await reposar()
    expect(d.maybeSingle).toHaveBeenCalledTimes(1)
    c.parar()
    expect(documento.removeEventListener).toHaveBeenCalledWith('visibilitychange', oyentes.visibilitychange)
  })

  it('con el vencimiento cumplido y sin aviso, relee a los pocos segundos', async () => {
    const venc = () => ({ clase: 'turno', hora: Date.now() + 1000 })
    const { d, c } = await arrancado({
      fila: filaDe(1, venc()),
      responder: () => ({ ok: false, motivo: M.VENCIMIENTO_NO_CUMPLIDO, version: 1 }),
    })
    await vi.advanceTimersByTimeAsync(1000 + MARGEN_VENCIMIENTO_MS + RELECTURA_MS)
    expect(d.maybeSingle).toHaveBeenCalled()
    c.parar()
  })

  it('sin vencimiento cumplido no relee por su cuenta', async () => {
    const { d, c } = await arrancado({ fila: filaDe(1, { clase: 'turno', hora: Date.now() + 60_000 }) })
    await vi.advanceTimersByTimeAsync(RELECTURA_MS * 3)
    expect(d.maybeSingle).not.toHaveBeenCalled()
    c.parar()
  })
})

describe('MOT-1 1f · el reloj lo mueven los teléfonos', () => {
  it('no reclama antes de la hora más el margen, y reclama después con la versión vigente', async () => {
    const hora = Date.now() + 2000
    const { d, c } = await arrancado({ fila: filaDe(7, { clase: 'turno', hora }), responder: () => ({ ok: true, version: 8 }) })
    await vi.advanceTimersByTimeAsync(2000 + MARGEN_VENCIMIENTO_MS - REVISION_MS)
    expect(reclamos(d)).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(REVISION_MS * 2)
    expect(reclamos(d)).toHaveLength(1)
    expect(reclamos(d)[0][1].body).toEqual({ mesa: MESA, accion: 'reclamar_vencimiento', version: 7 })
    c.parar()
  })

  it.each([[M.VENCIMIENTO_NO_CUMPLIDO], [M.VERSION_VIEJA]])('tolera `%s` en silencio y vuelve a intentarlo', async (motivo) => {
    const { d, c } = await arrancado({
      fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }),
      responder: () => ({ ok: false, motivo, version: 1 }),
    })
    await vi.advanceTimersByTimeAsync(REVISION_MS)
    expect(reclamos(d)).toHaveLength(1)
    expect(c.foto().rechazo).toBeNull()
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS)
    expect(reclamos(d).length).toBeGreaterThanOrEqual(2)
    expect(c.foto().rechazo).toBeNull()
    c.parar()
  })

  it('`version_vieja` relee: otro teléfono reclamó antes', async () => {
    const { d, c } = await arrancado({
      fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }),
      responder: () => ({ ok: false, motivo: M.VERSION_VIEJA, version: 1 }),
    })
    d.fila = filaDe(2, { clase: 'turno', hora: Date.now() + 20_000 })
    await vi.advanceTimersByTimeAsync(REVISION_MS)
    expect(c.foto().version).toBe(2)
    c.parar()
  })

  it('entre un rechazo y el siguiente reclamo espera el reintento', async () => {
    const { d, c } = await arrancado({
      fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }),
      responder: () => ({ ok: false, motivo: M.VENCIMIENTO_NO_CUMPLIDO, version: 1 }),
    })
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS - REVISION_MS)
    expect(reclamos(d)).toHaveLength(1)
    c.parar()
  })

  it('nunca reclama dos veces a la vez, ni más deprisa que el reintento', async () => {
    const { d, c } = await arrancado({ fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }) })
    d.invoke.mockImplementation(() => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 5)
    expect(reclamos(d)).toHaveLength(1)
    c.parar()
  })

  it('el asiento abandonado no reclama', async () => {
    const { d, c } = await arrancado({ fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }, { abandonado: true }) })
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 3)
    expect(reclamos(d)).toHaveLength(0)
    c.parar()
  })

  it('sin vencimiento no hay nada que reclamar', async () => {
    const { d, c } = await arrancado({ fila: filaDe(1, null) })
    await vi.advanceTimersByTimeAsync(RELECTURA_MS * 3)
    expect(d.invoke).not.toHaveBeenCalled()
    c.parar()
  })

  it('`partida_terminada` se enseña y deja de reclamar; «Releer» lo destapa', async () => {
    const { d, c } = await arrancado({
      fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }),
      responder: () => ({ ok: false, motivo: M.PARTIDA_TERMINADA, version: 1 }),
    })
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 4)
    expect(reclamos(d)).toHaveLength(1)
    expect(c.foto().rechazo).toEqual({ accion: 'reclamar_vencimiento', motivo: M.PARTIDA_TERMINADA })
    await c.releer()
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS)
    expect(reclamos(d)).toHaveLength(2)
    c.parar()
  })

  it('un fallo de red se reintenta: no es definitivo', async () => {
    const { d, c } = await arrancado({ fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }) })
    d.invoke.mockResolvedValue({ data: null, error: { name: 'FunctionsFetchError' } })
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 3)
    expect(reclamos(d).length).toBeGreaterThanOrEqual(2)
    c.parar()
  })
})

describe('MOT-1 1f · el arranque', () => {
  it('sin vista, reclama con versión 0 y lee lo que creó', async () => {
    const d = doble({ fila: null, responder: () => ({ ok: true, version: 0 }) })
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    await c.iniciar()
    await reposar()
    d.fila = filaDe(0)
    await vi.advanceTimersByTimeAsync(REVISION_MS)
    expect(reclamos(d)).toHaveLength(1)
    expect(reclamos(d)[0][1].body).toEqual({ mesa: MESA, accion: 'reclamar_vencimiento', version: 0 })
    expect(c.foto().version).toBe(0)
    expect(c.foto().vista).not.toBeNull()
    c.parar()
  })

  it('otro lo creó antes: relee y no vuelve a arrancar', async () => {
    const d = doble({ fila: null, responder: () => ({ ok: false, motivo: M.VERSION_VIEJA, version: 0 }) })
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    await c.iniciar()
    await reposar()
    d.fila = filaDe(0)
    await vi.advanceTimersByTimeAsync(REVISION_MS)
    expect(c.foto().version).toBe(0)
    expect(c.foto().rechazo).toBeNull()
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 2)
    expect(reclamos(d)).toHaveLength(1)
    c.parar()
  })

  it('con `version_vieja` y versión 0 sin vista, repite (`asientos_distintos`)', async () => {
    const d = doble({ fila: null, responder: () => ({ ok: false, motivo: M.VERSION_VIEJA, version: 0 }) })
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    await c.iniciar()
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 2 + REVISION_MS)
    expect(reclamos(d).length).toBeGreaterThanOrEqual(2)
    c.parar()
  })

  it('sin leer todavía, no arranca: un error de lectura no es «no hay partida»', async () => {
    const d = doble({ fila: null })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    d.maybeSingle.mockResolvedValue({ data: null, error: { message: 'caído' } })
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    await c.iniciar()
    await vi.advanceTimersByTimeAsync(RELECTURA_MS * 2)
    expect(reclamos(d)).toHaveLength(0)
    expect(d.maybeSingle.mock.calls.length).toBeGreaterThanOrEqual(2)
    c.parar()
  })

  it('`no_es_de_esta_mesa` se enseña y no insiste', async () => {
    const d = doble({ fila: null, responder: () => ({ ok: false, motivo: M.NO_ES_DE_ESTA_MESA, version: null }) })
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    await c.iniciar()
    await vi.advanceTimersByTimeAsync(REINTENTO_RECLAMO_MS * 4)
    expect(reclamos(d)).toHaveLength(1)
    expect(c.foto().rechazo?.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
    c.parar()
  })
})

describe('MOT-1 1f · parar', () => {
  it('parado no reclama, no relee y no abre un canal a destiempo', async () => {
    const d = doble({ fila: filaDe(1, { clase: 'turno', hora: Date.now() - 5000 }) })
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    const inicio = c.iniciar()
    c.parar()
    await inicio
    await vi.advanceTimersByTimeAsync(RELECTURA_MS * 2)
    expect(d.cliente.channel).not.toHaveBeenCalled()
    expect(d.invoke).not.toHaveBeenCalled()
  })

  it('parado con el token de Realtime en vuelo, tampoco abre el canal', async () => {
    const d = doble()
    let soltar
    d.cliente.realtime.setAuth.mockImplementation(() => new Promise((res) => { soltar = res }))
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    const inicio = c.iniciar()
    await reposar()
    c.parar()
    soltar()
    await inicio
    expect(d.cliente.channel).not.toHaveBeenCalled()
  })

  it('iniciar, parar e iniciar (StrictMode) deja un solo canal', async () => {
    const d = doble()
    const c = crearClientePartida({ cliente: d.cliente, mesa: MESA, documento: null })
    const primero = c.iniciar()
    c.parar()
    await Promise.all([primero, c.iniciar()])
    await reposar()
    expect(d.cliente.channel).toHaveBeenCalledTimes(1)
    c.parar()
  })
})

describe('MOT-1 1f · la marca', () => {
  function entorno(search, guardado = {}) {
    const memoria = new Map(Object.entries(guardado))
    vi.stubGlobal('location', { search })
    vi.stubGlobal('localStorage', {
      getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
      setItem: (k, v) => memoria.set(k, v),
      removeItem: (k) => memoria.delete(k),
    })
    return memoria
  }
  afterEach(() => { vi.unstubAllGlobals() })

  it('sin parámetro ni guardada, apagada', () => {
    entorno('')
    expect(leerMarcaMot1()).toBe(false)
  })

  it('`?mot1=1` la enciende y la guarda; luego vale sin el parámetro', () => {
    const memoria = entorno('?mot1=1')
    expect(leerMarcaMot1()).toBe(true)
    expect(memoria.get('ajilei.mot1')).toBe('1')
    vi.stubGlobal('location', { search: '' })
    expect(leerMarcaMot1()).toBe(true)
  })

  it('`?mot1=0` la apaga y la borra', () => {
    const memoria = entorno('?mot1=0', { 'ajilei.mot1': '1' })
    expect(leerMarcaMot1()).toBe(false)
    expect(memoria.has('ajilei.mot1')).toBe(false)
  })

  it('otro valor no la enciende', () => {
    entorno('?mot1=si')
    expect(leerMarcaMot1()).toBe(false)
  })

  it('sin almacenamiento no revienta: vale mientras siga en la dirección', () => {
    vi.stubGlobal('location', { search: '?mot1=1' })
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('bloqueado') },
      setItem: () => { throw new Error('bloqueado') },
      removeItem: () => { throw new Error('bloqueado') },
    })
    expect(leerMarcaMot1()).toBe(true)
    vi.stubGlobal('location', { search: '' })
    expect(leerMarcaMot1()).toBe(false)
  })
})
