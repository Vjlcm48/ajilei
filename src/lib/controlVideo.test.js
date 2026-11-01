import { describe, it, expect, vi, afterEach } from 'vitest'
import { crearControlVideo, FASES_CONTROL } from './controlVideo'
import { crearReproductor, ESTADOS } from './reproductor'
import { crearVideoApi, traducirEstado, traducirBoleto, traducirCobro } from './videoApi'
import { crearBanco, VIDEO_MINIMO_S_SQL } from '../dev/bancoImitado'
import { FASES } from '../hooks/videoCore'

// ── ECO-1g · el canal del video con el servidor ─────────────────────────────
// Contra el banco imitado (el contrato SQL en JS) pasado por la API real y con
// el reproductor de verdad (la costura), sin la capa: aquí «ver el video» es
// adelantar el reloj y llamar a `terminar`. Una «red» que se puede cortar
// envuelve al banco: con `caida`, la llamada no llega; con `pierde`, llega y la
// respuesta se pierde.

const tic = () => new Promise((r) => setTimeout(r, 0))
async function vaciar() { for (let i = 0; i < 8; i++) await tic() }

function montaje({ saldo = 300, mandos = null, cobrados = 0 } = {}) {
  const hora = { t: 1_800_000_000_000 }
  const banco = crearBanco({ saldo, ahora: () => hora.t })
  if (cobrados) banco.sembrarVideosCobrados(cobrados)
  const red = { caida: false, pierde: false, llamadas: [] }
  const cliente = {
    rpc(nombre, params) {
      red.llamadas.push([nombre, params ?? null])
      if (red.caida) return Promise.reject(new Error('sin red'))
      const r = banco.rpc(nombre, params)
      return red.pierde ? r.then(() => { throw new Error('respuesta perdida') }) : r
    },
  }
  const api = crearVideoApi(cliente)
  const timers = []
  const reloj = {
    setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length },
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].f = null },
  }
  // Dispara el reintento pendiente (el más viejo) y dice cuánto esperaba.
  const disparar = () => { const t = timers.find((x) => x.f); const f = t?.f; if (t) t.f = null; f?.(); return t?.ms ?? null }
  const reproductor = crearReproductor()
  const tomados = []
  const libres = []
  const precargas = []
  const ctl = crearControlVideo({
    api, reproductor, duracionMs: 40000, premioEspejo: 500, mandos, reloj, ahora: () => hora.t,
    precargar: () => precargas.push(hora.t),
  })
  ctl.enchufar({ tomarSaldo: (s) => tomados.push(s), alLibre: () => libres.push(hora.t) })
  ctl.cuenta('uid-1')
  // El jugador ve el video entero: pasa el tiempo y la capa dice «completado».
  const verEntero = () => { hora.t += VIDEO_MINIMO_S_SQL * 1000 + 5000; reproductor.terminar(ESTADOS.COMPLETADO) }
  const cobros = () => red.llamadas.filter(([n]) => n === 'cobrar_boleto')
  const videos = () => banco.libro.filter((l) => l.tipo === 'video')
  return { hora, banco, red, api, reloj, timers, disparar, reproductor, ctl, tomados, libres, precargas, verEntero, cobros, videos }
}

describe('ECO-1g · videoApi · la traducción', () => {
  it('snake_case → camelCase, instantes en ms, y lo ilegible es `red`', () => {
    expect(traducirEstado({ codigo: 'ok', quedan: 8, tope: 8, ahora: '2026-10-12T20:00:00Z', reinicio_en: '2026-10-13T05:00:00Z', premio: 500 }))
      .toEqual({ codigo: 'ok', quedan: 8, tope: 8, ahora: Date.UTC(2026, 9, 12, 20), reinicioEn: Date.UTC(2026, 9, 13, 5), premio: 500 })
    expect(traducirBoleto({ codigo: 'tope_dia', boleto_id: null, emitido_en: null, vence_en: null, ahora: '2026-10-12T20:00:00Z', minimo_s: 35, quedan: 0, reinicio_en: '2026-10-13T05:00:00Z' }))
      .toMatchObject({ codigo: 'tope_dia', boletoId: null, emitidoEn: null, venceEn: null, minimoS: 35, quedan: 0 })
    // `bigint` llega como texto si es grande: se lee igual.
    expect(traducirCobro({ codigo: 'ok', cobrado: '500', saldo: '3000', quedan: 7, reinicio_en: '2026-10-13T05:00:00Z', faltan_s: 0, premio: '500' }))
      .toEqual({ codigo: 'ok', cobrado: 500, saldo: 3000, quedan: 7, reinicioEn: Date.UTC(2026, 9, 13, 5), faltanS: 0, premio: 500 })
    // Un compuesto nulo de PostgREST llega como FILA DE NULOS (lección de SAL-B1 A2).
    expect(traducirCobro({ codigo: null, cobrado: null, saldo: null })).toEqual({ codigo: 'red' })
    expect(traducirEstado(null)).toEqual({ codigo: 'red' })
    expect(traducirBoleto([])).toEqual({ codigo: 'red' })
  })

  it('nunca rechaza: la red caída es `red`', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const api = crearVideoApi({ rpc: () => Promise.reject(new Error('sin red')) })
    expect(await api.estado()).toEqual({ codigo: 'red' })
    expect(await api.pedir()).toEqual({ codigo: 'red' })
    expect(await api.cobrar('x')).toEqual({ codigo: 'red' })
    const rota = crearVideoApi({ rpc: () => { throw new Error('ni sale') } })
    expect(await rota.cobrar('x')).toEqual({ codigo: 'red' })
    const conError = crearVideoApi({ rpc: () => Promise.resolve({ data: null, error: { code: '42501', message: 'no' } }) })
    expect(await conError.pedir()).toEqual({ codigo: 'red' })
    vi.restoreAllMocks()
  })
})

describe('ECO-1g · controlVideo', () => {
  afterEach(() => vi.restoreAllMocks())

  it('el recorrido entero: pedir → ver → cobrar → celebrar; el saldo es el que devuelve el cobro', async () => {
    const m = montaje()
    m.ctl.mirar()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, estado: { quedan: 8, tope: 8, premio: 500 } })

    m.ctl.pedir()
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.PIDIENDO })
    expect(m.precargas).toHaveLength(1)          // el sonido del cobro se pide ya, 40 s antes
    await vaciar()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.VIENDO)
    const sesion = m.reproductor.leer()
    expect(sesion).toMatchObject({ fase: FASES.CORRIENDO, duracionMs: 40000, cierraSolo: false })
    // El boleto vence a los 10 min del servidor; el reloj local es el mismo aquí.
    expect(sesion.caducaEn).toBe(m.hora.t + 10 * 60 * 1000)
    expect(m.ctl.ocupado()).toBe(true)

    m.verEntero()
    await vaciar()
    const f = m.ctl.leer()
    expect(f.fase).toBeNull()
    expect(f.cel).toEqual({ id: 1, premio: 500, desde: 300, hasta: 800 })
    expect(f.estado.quedan).toBe(7)
    expect(m.tomados).toEqual([800])
    expect(m.videos()).toHaveLength(1)
    expect(m.cobros()).toHaveLength(1)
    // Sigue ocupado mientras se celebra; al acabar, queda libre y lo dice UNA vez.
    expect(m.ctl.ocupado()).toBe(true)
    expect(m.libres).toHaveLength(0)
    m.ctl.finCelebracion(99)                      // de otra celebración: nada
    expect(m.ctl.leer().cel).not.toBeNull()
    m.ctl.finCelebracion(1)
    expect(m.ctl.leer().cel).toBeNull()
    expect(m.ctl.ocupado()).toBe(false)
    expect(m.libres).toHaveLength(1)
  })

  it('G2 · cerrado antes de tiempo: no llama al cobro, ni saldo ni contador cambian', async () => {
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.hora.t += 20000
    m.reproductor.terminar(ESTADOS.CERRADO_ANTES)
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, cel: null, estado: { quedan: 8 } })
    expect(m.cobros()).toHaveLength(0)
    expect(m.tomados).toEqual([])
    expect(m.banco.saldo).toBe(300)
    expect(m.libres).toHaveLength(1)
    // S1 · el siguiente pedido anula el boleto que quedó sin cobrar.
    m.ctl.pedir()
    await vaciar()
    expect(m.banco.boletos.map((b) => b.anulado_en !== null)).toEqual([true, false])
  })

  it('no hay video al pedir (red caída o `limite`): el mensaje, sin abrir la capa y sin tocar nada', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    m.red.caida = true
    m.ctl.pedir()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.SIN, cel: null })
    expect(m.reproductor.leer()).toBeNull()
    expect(m.banco.boletos).toHaveLength(0)
    m.ctl.cerrarSin()
    expect(m.ctl.leer().fase).toBeNull()
    m.red.caida = false
    m.banco.forzarLimite('pedir_boleto', 1)
    m.ctl.pedir()
    await vaciar()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.SIN)
    expect(m.banco.boletos).toHaveLength(0)
    expect(m.banco.saldo).toBe(300)
  })

  it('el reproductor dice «no disponible» (el mando `sin`): el mensaje; el boleto emitido no cuenta', async () => {
    const m = montaje({ mandos: { disponible: false } })
    m.ctl.pedir()
    await vaciar()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.SIN)
    expect(m.reproductor.leer()).toBeNull()
    expect(m.cobros()).toHaveLength(0)
    expect(m.banco.llamar('mi_video').quedan).toBe(8)
  })

  it('los mandos de desarrollo llegan al reproductor: duración corta y cierre solo', async () => {
    const m = montaje({ mandos: { duracionMs: 4000 } })
    m.ctl.pedir()
    await vaciar()
    expect(m.reproductor.leer().duracionMs).toBe(4000)
    const c = montaje({ mandos: { cierra: true } })
    c.ctl.pedir()
    await vaciar()
    expect(c.reproductor.leer()).toMatchObject({ cierraSolo: true, duracionMs: 40000 })
  })

  it('el tope: con 0 de 8 no se pide; y `tope_dia` al pedir apaga sin mensaje', async () => {
    const m = montaje({ cobrados: 8 })
    // Aún no se ha mirado: el cliente no sabe que no quedan. El servidor lo dice.
    m.ctl.pedir()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, cel: null, estado: { quedan: 0 } })
    expect(m.reproductor.leer()).toBeNull()
    // Ya lo sabe: un segundo toque ni llama.
    const antes = m.red.llamadas.length
    m.ctl.pedir()
    await vaciar()
    expect(m.red.llamadas).toHaveLength(antes)
  })

  it('un video a la vez: el segundo toque no pide otro boleto', async () => {
    const m = montaje()
    m.ctl.pedir()
    m.ctl.pedir()
    await vaciar()
    m.ctl.pedir()
    await vaciar()
    expect(m.red.llamadas.filter(([n]) => n === 'pedir_boleto')).toHaveLength(1)
    expect(m.banco.boletos).toHaveLength(1)
  })

  it('K7 · `limite` en el cobro: se reintenta EL MISMO boleto y se cobra una vez', async () => {
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.banco.forzarLimite('cobrar_boleto', 2)
    m.verEntero()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.COBRANDO, salible: false, cel: null })
    expect(m.disparar()).toBe(1000)
    await vaciar()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.COBRANDO)
    expect(m.disparar()).toBe(2000)
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, cel: { desde: 300, hasta: 800 } })
    expect(new Set(m.cobros().map(([, p]) => p.p_boleto)).size).toBe(1)
    expect(m.cobros()).toHaveLength(3)
    expect(m.videos()).toHaveLength(1)
    expect(m.tomados).toEqual([800])
  })

  it('S3 · la respuesta del cobro se pierde: el reintento recibe `ya_cobrado` y se celebra UNA vez', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.red.pierde = true
    m.verEntero()
    await vaciar()
    expect(m.banco.saldo).toBe(800)               // el cobro SÍ entró
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.COBRANDO, cel: null })
    expect(m.tomados).toEqual([])
    m.red.pierde = false
    m.disparar()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, cel: { premio: 500, desde: 300, hasta: 800 } })
    expect(m.videos()).toHaveLength(1)
    expect(m.tomados).toEqual([800])
  })

  it('P-2 · la ✕ no está durante la primera tanda; después «Salir» abandona y el video no cuenta', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.red.caida = true
    m.verEntero()
    await vaciar()
    const esperas = []
    for (let i = 0; i < 5; i++) {
      expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.COBRANDO, salible: false })
      m.ctl.salirDelCobro()                       // todavía no se puede: no hace nada
      expect(m.ctl.leer().fase).toBe(FASES_CONTROL.COBRANDO)
      esperas.push(m.disparar())
      await vaciar()
    }
    expect(esperas).toEqual([1000, 2000, 4000, 8000, 15000])
    // La sexta llamada también falló: ahora sí hay ✕, y se sigue reintentando.
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.COBRANDO, salible: true })
    expect(m.cobros()).toHaveLength(6)
    expect(m.disparar()).toBe(15000)
    await vaciar()
    expect(m.cobros()).toHaveLength(7)
    m.ctl.salirDelCobro()
    expect(m.ctl.leer()).toMatchObject({ fase: null, salible: false, cel: null })
    expect(m.libres).toHaveLength(1)
    // Nada más sale por la red, aunque quedara un reintento programado.
    m.red.caida = false
    m.disparar()
    await vaciar()
    expect(m.cobros()).toHaveLength(7)
    expect(m.videos()).toHaveLength(0)
    expect(m.banco.llamar('mi_video').quedan).toBe(8)
  })

  it('volver a primer plano adelanta el reintento del cobro', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.red.caida = true
    m.verEntero()
    await vaciar()
    m.red.caida = false
    m.ctl.reintentarAhora()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, cel: { hasta: 800 } })
    expect(m.timers.filter((x) => x.f)).toHaveLength(0)
  })

  it('`demasiado_pronto` (relojes desfasados): espera lo que dice el servidor y cobra', async () => {
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.hora.t += 31000                              // el teléfono cree que ya; el servidor dice que faltan 4 s
    m.reproductor.terminar(ESTADOS.COMPLETADO)
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.COBRANDO, salible: false })
    m.hora.t += 4250
    expect(m.disparar()).toBe(4250)
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: null, cel: { hasta: 800 } })
    expect(m.videos()).toHaveLength(1)
  })

  it('anulado al cobrar (se pidió otro en otro dispositivo): «no hay video», sin cobro', async () => {
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.banco.llamar('pedir_boleto')                 // el otro dispositivo
    m.verEntero()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ fase: FASES_CONTROL.SIN, cel: null })
    expect(m.banco.saldo).toBe(300)
    expect(m.tomados).toEqual([])
  })

  it('la pausa larga: el reproductor dice «no disponible» y sale el mensaje, sin cobro', async () => {
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.hora.t += 11 * 60 * 1000
    m.reproductor.terminar(ESTADOS.NO_DISPONIBLE)
    await vaciar()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.SIN)
    expect(m.cobros()).toHaveLength(0)
  })

  it('el octavo: tras cobrarlo quedan 0 y ya no se puede pedir', async () => {
    const m = montaje({ cobrados: 7 })
    m.ctl.mirar()
    await vaciar()
    expect(m.ctl.leer().estado.quedan).toBe(1)
    m.ctl.pedir()
    await vaciar()
    m.verEntero()
    await vaciar()
    expect(m.ctl.leer()).toMatchObject({ estado: { quedan: 0 }, cel: { hasta: 800 } })
    m.ctl.finCelebracion()
    const antes = m.red.llamadas.length
    m.ctl.pedir()
    await vaciar()
    expect(m.red.llamadas).toHaveLength(antes)
    expect(m.ctl.leer().fase).toBeNull()
  })

  it('otra cuenta no hereda nada: ni el contador, ni el video, ni el cobro en curso', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje({ cobrados: 8 })
    m.ctl.mirar()
    await vaciar()
    expect(m.ctl.leer().estado.quedan).toBe(0)
    m.ctl.cuenta(null)
    expect(m.ctl.leer()).toEqual({ estado: null, fase: null, salible: false, cel: null, en: 0 })
    // Sin cuenta no se mira ni se pide.
    const antes = m.red.llamadas.length
    m.ctl.mirar(); m.ctl.pedir()
    await vaciar()
    expect(m.red.llamadas).toHaveLength(antes)
    expect(m.ctl.leer().fase).toBeNull()

    // A mitad de un video, la sesión se cierra: la capa se va y nada se cobra.
    const v = montaje()
    v.ctl.pedir()
    await vaciar()
    v.ctl.cuenta(null)
    expect(v.reproductor.leer()).toBeNull()
    await vaciar()
    expect(v.ctl.leer().fase).toBeNull()
    expect(v.cobros()).toHaveLength(0)

    // Y a mitad de un cobro que se reintenta.
    const c = montaje()
    c.ctl.pedir()
    await vaciar()
    c.red.caida = true
    c.verEntero()
    await vaciar()
    c.ctl.cuenta('uid-2')
    c.red.caida = false
    c.disparar()
    await vaciar()
    expect(c.cobros()).toHaveLength(1)
    expect(c.ctl.leer()).toMatchObject({ fase: null, cel: null, estado: null })
  })

  it('al desmontarse el marco se recoge lo que sólo era pintura; el video y el cobro, no', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    m.ctl.pedir()
    await vaciar()
    m.ctl.recoger()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.VIENDO)
    m.verEntero()
    await vaciar()
    expect(m.ctl.leer().cel).not.toBeNull()
    m.ctl.recoger()
    expect(m.ctl.leer()).toMatchObject({ cel: null, fase: null })
    expect(m.ctl.ocupado()).toBe(false)
    expect(m.tomados).toEqual([800])
    m.red.caida = true
    m.ctl.pedir()
    await vaciar()
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.SIN)
    m.ctl.recoger()
    expect(m.ctl.leer().fase).toBeNull()
  })

  it('la foto lleva el instante en que se tomó', async () => {
    const m = montaje()
    m.hora.t += 5000
    m.ctl.pedir()
    expect(m.ctl.leer().en).toBe(m.hora.t)
  })

  it('avisa a quien escucha en cada cambio, y la foto sólo cambia de identidad cuando cambia', async () => {
    const m = montaje()
    let avisos = 0
    const soltar = m.ctl.suscribir(() => { avisos += 1 })
    const f0 = m.ctl.leer()
    expect(m.ctl.leer()).toBe(f0)
    m.ctl.pedir()
    expect(avisos).toBe(1)
    expect(m.ctl.leer()).not.toBe(f0)
    m.ctl.finCelebracion()                        // no hay celebración: ni avisa
    m.ctl.cerrarSin()                             // no hay mensaje: ni avisa
    expect(avisos).toBe(1)
    soltar()
    await vaciar()                                // el video sale a la vista, sin oyente
    expect(m.ctl.leer().fase).toBe(FASES_CONTROL.VIENDO)
    expect(avisos).toBe(1)
  })
})
