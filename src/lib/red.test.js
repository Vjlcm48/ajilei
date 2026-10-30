import { describe, it, expect, vi, afterEach } from 'vitest'
import { TOPE_RED_MS, fetchConTope, conTope, CABECERA_TOPE } from './red'

// ── IOS-1c · el tope de red (S5, S7) ────────────────────────────────────────

afterEach(() => { vi.useRealTimers() })

/** Un `fetch` falso que no contesta nunca, salvo que lo cancelen. */
function fetchColgado() {
  const llamadas = []
  const f = (url, opciones) => new Promise((_, mal) => {
    llamadas.push({ url, opciones })
    opciones.signal.addEventListener('abort', () => mal(opciones.signal.reason))
  })
  return { f, llamadas }
}

describe('IOS-1c · fetchConTope', () => {
  it('el tope de partida es de 8 s', () => {
    expect(TOPE_RED_MS).toBe(8000)
  })

  it('una petición colgada se cancela en el tope, como un fallo de red', async () => {
    vi.useFakeTimers()
    const { f } = fetchColgado()
    const p = fetchConTope(f, 8000)('https://x/rest/v1/rpc/mi_billetera', { method: 'POST' })
    const resultado = p.then(() => 'contestó', (e) => e.name)
    await vi.advanceTimersByTimeAsync(7999)
    let ya = false
    resultado.then(() => { ya = true })
    await Promise.resolve()
    expect(ya).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await resultado).toBe('AbortError')
  })

  it('la que contesta antes del tope pasa tal cual, y el reloj se limpia', async () => {
    vi.useFakeTimers()
    const respuesta = { ok: true }
    const f = vi.fn(() => Promise.resolve(respuesta))
    const r = await fetchConTope(f, 8000)('u', { headers: { a: '1' } })
    expect(r).toBe(respuesta)
    expect(f.mock.calls[0][1].headers).toEqual({ a: '1' })
    expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('respeta la señal de quien llama: cancela antes del tope', async () => {
    vi.useFakeTimers()
    const { f } = fetchColgado()
    const propia = new AbortController()
    const p = fetchConTope(f, 8000)('u', { signal: propia.signal }).catch((e) => e)
    propia.abort(new DOMException('mía', 'AbortError'))
    const e = await p
    expect(e.message).toBe('mía')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('una señal ya cancelada no arma el tope', async () => {
    vi.useFakeTimers()
    const propia = new AbortController()
    propia.abort()
    const f = vi.fn(() => Promise.reject(new DOMException('x', 'AbortError')))
    await fetchConTope(f, 8000)('u', { signal: propia.signal }).catch(() => {})
    expect(f.mock.calls[0][1].signal).toBe(propia.signal)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('un fetch que lanza al llamarlo llega como promesa rechazada', async () => {
    const f = () => { throw new TypeError('sin red') }
    await expect(fetchConTope(f, 8000)('u')).rejects.toThrow('sin red')
  })

  // CFG-1 1c · eliminar la cuenta espera 20 s, no 8.
  it('la cabecera de tope pide otro tope y no sale en la petición', async () => {
    vi.useFakeTimers()
    const { f, llamadas } = fetchColgado()
    const p = fetchConTope(f, 8000)('u', { method: 'POST', headers: { [CABECERA_TOPE]: '20000', Authorization: 'Bearer t' } })
    const resultado = p.then(() => 'contestó', (e) => e.name)
    const h = llamadas[0].opciones.headers
    expect(h.has(CABECERA_TOPE)).toBe(false)
    expect(h.get('authorization')).toBe('Bearer t')
    let ya = false
    resultado.then(() => { ya = true })
    await vi.advanceTimersByTimeAsync(19999)
    expect(ya).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await resultado).toBe('AbortError')
  })

  it('una cabecera de tope que no es un número positivo deja el de siempre (y tampoco sale)', async () => {
    vi.useFakeTimers()
    const { f, llamadas } = fetchColgado()
    const p = fetchConTope(f, 8000)('u', { headers: new Headers({ [CABECERA_TOPE]: 'mucho' }) })
    const resultado = p.then(() => 'contestó', (e) => e.name)
    expect(llamadas[0].opciones.headers.has(CABECERA_TOPE)).toBe(false)
    await vi.advanceTimersByTimeAsync(8000)
    expect(await resultado).toBe('AbortError')
  })
})

describe('IOS-1c · conTope (las esperas de la pantalla)', () => {
  it('pasado el tope devuelve lo de `alTope`; lo que llega antes, lo suyo', async () => {
    vi.useFakeTimers()
    const lenta = conTope(new Promise(() => {}), 8000, { ok: false, tope: true })
    await vi.advanceTimersByTimeAsync(8000)
    expect(await lenta).toEqual({ ok: false, tope: true })
    expect(await conTope(Promise.resolve({ ok: true }), 8000, null)).toEqual({ ok: true })
    expect(vi.getTimerCount()).toBe(0)
  })
})
