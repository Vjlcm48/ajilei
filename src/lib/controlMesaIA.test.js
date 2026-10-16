import { describe, it, expect, vi, afterEach } from 'vitest'
import { crearControlMesa, ESPERAS_RED_MS } from './controlMesaIA'
import { crearMesaIAApi } from './mesaIAApi'
import { crearBanco } from '../dev/bancoImitado'

// ── ECO-1c · el canal de la mesa con el servidor ────────────────────────────
// Contra el banco imitado (el contrato SQL en JS) pasado por la API real. Una
// «red» que se puede cortar envuelve al banco: con `caida`, la llamada no llega
// (no toca el banco) o llega y la respuesta se pierde (`pierde`).

const tic = () => new Promise((r) => setTimeout(r, 0))
async function vaciar() { for (let i = 0; i < 8; i++) await tic() }

function montaje({ saldo = 2500 } = {}) {
  const banco = crearBanco({ saldo })
  const red = { caida: false, pierde: false, llamadas: [] }
  const cliente = {
    rpc(nombre, params) {
      red.llamadas.push([nombre, params])
      if (red.caida) return Promise.reject(new Error('sin red'))
      const r = banco.rpc(nombre, params)
      return red.pierde ? r.then(() => { throw new Error('respuesta perdida') }) : r
    },
  }
  const api = crearMesaIAApi(cliente)
  const timers = []
  const reloj = {
    setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length },
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].f = null },
  }
  const disparar = () => { const t = timers.find((x) => x.f); const f = t?.f; if (t) t.f = null; f?.() }
  return { banco, red, api, reloj, timers, disparar }
}

async function sentar(m, entrada = 500) {
  const r = await m.api.sentarse({ reto: 'basico', jugadores: 2, apuesta: 50, entrada, token: 'tok-1' })
  return crearControlMesa({ api: m.api, mesaId: r.mesaId, pilaInicial: entrada, reloj: m.reloj })
}

describe('ECO-1c · controlMesaIA', () => {
  afterEach(() => vi.restoreAllMocks())

  it('los avisos llegan en orden, uno a la vez, y el fin de mano suma al récord', async () => {
    const m = montaje()
    const c = await sentar(m)
    c.pila(450)
    c.pila(400, { vivos: 2, ganoHumano: false })
    c.pila(350)
    await vaciar()
    const avisos = m.red.llamadas.filter(([n]) => n === 'informar_pila').map(([, p]) => [p.p_seq, p.p_pila])
    expect(avisos).toEqual([[1, 450], [2, 400], [3, 350]])
    expect(m.banco.mesas[0].pila_informada).toBe(350)
    expect(m.banco.record).toEqual({ 'basico:2': { jugadas: 1, ganadas_humano: 0, ganadas_ia: 1 } })
  })

  it('un aviso que falla se reintenta EL MISMO y llega una sola vez y en orden (mesaia.7)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    const c = await sentar(m)
    m.red.pierde = true                 // llega al banco, la respuesta se pierde
    c.pila(450, { vivos: 2, ganoHumano: true })
    await vaciar()
    expect(m.timers.at(-1).ms).toBe(ESPERAS_RED_MS[0])
    c.pila(300)                         // la siguiente espera detrás
    m.red.pierde = false
    m.disparar()
    await vaciar()
    const avisos = m.red.llamadas.filter(([n]) => n === 'informar_pila').map(([, p]) => p.p_seq)
    expect(avisos).toEqual([1, 1, 2])   // el 1 dos veces (el reintento), luego el 2
    // El banco lo contó UNA vez: el reintento del mismo seq se ignora.
    expect(m.banco.record['basico:2'].jugadas).toBe(1)
    expect(m.banco.mesas[0].pila_informada).toBe(300)
  })

  it('la recarga llega por la suscripción y su pila no se vuelve a avisar', async () => {
    const m = montaje()
    const c = await sentar(m)
    const eventos = []
    c.suscribir((e) => eventos.push(e))
    c.pila(300)
    const seq = c.recargar(500)
    await vaciar()
    const ev = eventos.find((e) => e.tipo === 'recarga')
    expect(ev).toMatchObject({ seq, monto: 500, ok: true })
    expect(ev.respuesta.saldo).toBe(1500)
    c.pila(800)                          // la mesa aplica las fichas: el servidor ya lo sabe
    await vaciar()
    expect(m.red.llamadas.filter(([n]) => n === 'informar_pila')).toHaveLength(1)
  })

  it('una recarga rechazada llega como no, y la cola sigue', async () => {
    const m = montaje({ saldo: 900 })
    const c = await sentar(m)
    const eventos = []
    c.suscribir((e) => eventos.push(e))
    c.recargar(1000)                     // pila 500 + 1000 cabe en el techo, pero no hay saldo (400)
    c.pila(450)
    await vaciar()
    expect(eventos.find((e) => e.tipo === 'recarga')).toMatchObject({ ok: false })
    expect(eventos.find((e) => e.tipo === 'recarga').respuesta.codigo).toBe('saldo_insuficiente')
    expect(m.banco.mesas[0].pila_informada).toBe(450)
  })

  it('salir cobra UNA vez aunque se pida dos (mesaia.6)', async () => {
    const m = montaje()
    const c = await sentar(m)
    const a = c.salir(800)
    const b = c.salir(800)
    expect(a).toBe(b)
    const r = await a
    expect(r).toMatchObject({ codigo: 'ok', cobrado: 800, saldo: 2800 })
    expect(m.red.llamadas.filter(([n]) => n === 'salir_ia')).toHaveLength(1)
    expect(c.terminado).toBe(true)
  })

  it('la salida espera a los avisos de delante y se reintenta sola si la red cae', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    const c = await sentar(m)
    m.red.caida = true
    c.pila(450, { vivos: 2, ganoHumano: false })
    const p = c.salir(450)
    await vaciar()
    expect(m.banco.mesas[0].estado).toBe('abierta')
    m.red.caida = false
    m.disparar()
    const r = await p
    expect(r).toMatchObject({ codigo: 'ok', cobrado: 450 })
    expect(m.banco.record['basico:2'].jugadas).toBe(1)
  })

  it('si el «sí» de una recarga llega con la salida ya en cola, sus fichas van en la salida', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    const c = await sentar(m)
    m.red.pierde = true                  // la recarga se cobra, la respuesta se pierde
    c.recargar(500)
    await vaciar()
    const p = c.salir(500)               // el jugador se va con las fichas de antes
    m.red.pierde = false
    m.disparar()
    const r = await p
    // 2.500 − 500 (entrada) − 500 (recarga) + 1.000 (las 500 de la mesa + las 500 recargadas)
    expect(r).toMatchObject({ codigo: 'ok', cobrado: 1000, saldo: 2500 })
  })

  it('P-2b · una recarga COLGADA: «Reintentar» forzado la vuelve a mandar con el mismo seq y cuenta una vez', async () => {
    const m = montaje()
    const c = await sentar(m)
    // La primera llamada llega al banco (cobra) y su respuesta no vuelve nunca
    // mientras no se suelte: no es un fallo, es una petición colgada.
    let soltar = null
    const api = {
      ...m.api,
      recargar: (...a) => {
        const r = m.api.recargar(...a)
        if (soltar !== null) return r
        return new Promise((ok) => { soltar = () => r.then(ok) })
      },
    }
    const c2 = crearControlMesa({ api, mesaId: c.mesaId, pilaInicial: 500, reloj: m.reloj })
    const eventos = []
    c2.suscribir((e) => eventos.push(e))
    c2.recargar(500)
    const p = c2.salir(500)                    // la ✕ con la recarga en vuelo
    await vaciar()
    c2.reintentarAhora()                       // sin forzar: no hay espera, no hace nada
    await vaciar()
    const recargas = () => m.red.llamadas.filter(([n]) => n === 'recargar_ia').map(([, q]) => q.p_seq)
    expect(recargas()).toEqual([1])
    c2.reintentarAhora({ forzar: true })       // el «Reintentar» de la tarjeta tras el tope
    const r = await p
    expect(recargas()).toEqual([1, 1])         // el mismo seq
    // 2.500 − 500 (entrada) − 500 (recarga) + 1.000 (las 500 de la mesa + las 500 recargadas)
    expect(r).toMatchObject({ codigo: 'ok', cobrado: 1000, saldo: 2500 })
    soltar()                                   // la respuesta colgada llega tarde: no cuenta
    await vaciar()
    expect(eventos.filter((e) => e.tipo === 'recarga')).toHaveLength(1)
    expect(m.red.llamadas.filter(([n]) => n === 'salir_ia')).toHaveLength(1)
    expect(m.banco.libro.filter((l) => l.tipo === 'recarga_ia')).toHaveLength(1)
  })

  it('C6 · la mesa cerrada desde otro dispositivo se dice al siguiente aviso, y para', async () => {
    const m = montaje()
    const c = await sentar(m)
    const eventos = []
    c.suscribir((e) => eventos.push(e))
    c.pila(650)
    await vaciar()
    m.banco.cerrarDesdeOtroDispositivo()
    c.pila(600)
    await vaciar()
    const ev = eventos.find((e) => e.tipo === 'cerrada')
    expect(ev.respuesta).toMatchObject({ codigo: 'mesa_cerrada', cobrado: 650, motivoCierre: 'reemplazada', saldo: 2650 })
    expect(c.terminado).toBe(true)
    c.pila(10)
    await vaciar()
    expect(m.red.llamadas.filter(([n]) => n === 'informar_pila')).toHaveLength(2)
    // Y una salida después de cerrada devuelve la misma respuesta, sin llamar.
    expect(await c.salir(600)).toMatchObject({ codigo: 'mesa_cerrada' })
  })

  it('reintentarAhora se salta la espera', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = montaje()
    const c = await sentar(m)
    m.red.caida = true
    c.pila(450)
    await vaciar()
    expect(c.esperandoRed).toBe(true)
    m.red.caida = false
    c.reintentarAhora()
    await vaciar()
    expect(c.esperandoRed).toBe(false)
    expect(m.banco.mesas[0].pila_informada).toBe(450)
  })
})

describe('ECO-1c · mesaIAApi', () => {
  it('nunca rechaza: excepción, promesa rechazada o error de la base dan «red»', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const api = (rpc) => crearMesaIAApi({ rpc })
    expect((await api(() => { throw new Error('x') }).salir('m', 1, 1)).codigo).toBe('red')
    expect((await api(() => Promise.reject(new Error('x'))).salir('m', 1, 1)).codigo).toBe('red')
    expect((await api(() => Promise.resolve({ data: null, error: { message: 'x' } })).salir('m', 1, 1)).codigo).toBe('red')
    vi.restoreAllMocks()
  })

  it('traduce el compuesto y los bigint que lleguen como texto', async () => {
    const api = crearMesaIAApi({ rpc: () => Promise.resolve({ data: {
      codigo: 'ok', mesa_id: 'm1', saldo: '2000', pila: 500, techo: '1250', seq: 0,
      cobrado: 0, anterior_cerrada: true, anterior_cobro: '700', motivo_cierre: null,
    }, error: null }) })
    expect(await api.sentarse({})).toEqual({
      codigo: 'ok', mesaId: 'm1', saldo: 2000, pila: 500, techo: 1250, seq: 0,
      cobrado: 0, anteriorCerrada: true, anteriorCobro: 700, motivoCierre: null,
    })
  })

  it('mi_mesa_ia: lista vacía → null; una fila → la mesa', async () => {
    expect(await crearMesaIAApi({ rpc: () => Promise.resolve({ data: [], error: null }) }).miMesa()).toBe(null)
    const una = await crearMesaIAApi({ rpc: () => Promise.resolve({ data: [{ codigo: 'ok', mesa_id: 'x' }], error: null }) }).miMesa()
    expect(una.mesaId).toBe('x')
  })
})

// ── IOS-1c · volver a primer plano fuerza sólo lo colgado ───────────────────
describe('IOS-1c · reintentarAhora({ forzarTrasMs })', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lo recién salido no se toca; lo que lleva más que el tope se reenvía con el mismo seq y cobra una vez', async () => {
    const m = montaje()
    const c = await sentar(m)
    let t = 0
    const reloj = { ...m.reloj, now: () => t }
    // La salida llega al banco y su respuesta no vuelve hasta que se suelte:
    // la petición colgada de la app que vuelve de segundo plano (sonda c de F-7).
    let soltar = null
    const api = {
      ...m.api,
      salir: (...a) => {
        const r = m.api.salir(...a)
        if (soltar !== null) return r
        return new Promise((ok) => { soltar = () => r.then(ok) })
      },
    }
    const c2 = crearControlMesa({ api, mesaId: c.mesaId, pilaInicial: 500, reloj })
    const p = c2.salir(500)
    await vaciar()
    const salidas = () => m.red.llamadas.filter(([n]) => n === 'salir_ia').map(([, q]) => q.p_seq)
    t = 1000
    c2.reintentarAhora({ forzarTrasMs: 8000 })   // vuelve al segundo: no está colgada todavía
    await vaciar()
    expect(salidas()).toEqual([1])
    t = 9000
    c2.reintentarAhora({ forzarTrasMs: 8000 })   // vuelve a los 9 s: sí
    const r = await p
    expect(salidas()).toEqual([1, 1])
    // La primera ya cobró en el banco: el reenvío forzado contesta `repetido`
    // con el mismo saldo, sin un segundo movimiento.
    expect(r).toMatchObject({ codigo: 'repetido', saldo: 2500 })
    soltar()
    await vaciar()
    expect(m.banco.libro.filter((l) => l.tipo === 'salida_ia')).toHaveLength(1)
  })
})
