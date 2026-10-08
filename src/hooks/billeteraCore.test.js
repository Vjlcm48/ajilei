import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  CARGANDO, LISTO, ERROR, MOTIVOS, INTERVALO_PRIMER_PLANO_MS, SIN_JUICIO,
  billeteraNueva, paraCuenta, esSaldoValido, debeLeer, alResponder,
  saldoMostrado, entrar, recargar, salir, saldoParaJuzgar,
} from './billeteraCore'
import { crearBilleteraApi, ERROR_LECTURA } from '../lib/billeteraApi'
import { simulacionBilletera } from '../dev/billeteraFalsa'

// ── ECO-1b · el núcleo de la billetera del cliente ──────────────────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §3.1. Sin jsdom (hallazgo de FRZ-1): el
// hook es cableado y lo que aquí se sella son sus reglas — lectura, carga,
// error, ajuste local y refresco.

const UNO = 'aaaaaaaa-0000-4000-8000-000000000001'
const DOS = 'aaaaaaaa-0000-4000-8000-000000000002'

describe('ECO-1b · lectura y carga', () => {
  it('una cuenta nueva nace cargando y sin cifra: nunca 0 ni 5.000', () => {
    const b = billeteraNueva(UNO)
    expect(b).toEqual({ uid: UNO, servidor: null, estado: CARGANDO, ajuste: 0 })
    expect(saldoMostrado(b)).toBe(null)
  })

  it('con una cifra inicial (la falsa del arnés) nace lista, sin fotograma de carga', () => {
    const b = billeteraNueva(UNO, 5000)
    expect(b.estado).toBe(LISTO)
    expect(saldoMostrado(b)).toBe(5000)
  })

  it('la respuesta del servidor fija la cifra', () => {
    const b = alResponder(billeteraNueva(UNO), UNO, { data: 2500, error: null })
    expect(b.estado).toBe(LISTO)
    expect(b.servidor).toBe(2500)
    expect(saldoMostrado(b)).toBe(2500)
  })

  it('sólo es saldo un entero finito no negativo', () => {
    for (const ok of [0, 1, 2500, 2147483648]) expect(esSaldoValido(ok)).toBe(true)
    for (const no of [null, undefined, -1, 1.5, NaN, Infinity, '2500']) expect(esSaldoValido(no)).toBe(false)
  })
})

describe('ECO-1b · error', () => {
  it('un fallo sin cifra conocida deja el estado en error y la cifra en null', () => {
    const b = alResponder(billeteraNueva(UNO), UNO, { data: null, error: ERROR_LECTURA })
    expect(b.estado).toBe(ERROR)
    expect(saldoMostrado(b)).toBe(null)
  })

  it('un fallo con cifra conocida CONSERVA la última: tras un corte no se inventa nada', () => {
    const lista = alResponder(billeteraNueva(UNO), UNO, { data: 2500, error: null })
    const b = alResponder(lista, UNO, { data: null, error: ERROR_LECTURA })
    expect(b.estado).toBe(ERROR)
    expect(saldoMostrado(b)).toBe(2500)
  })

  it('una respuesta sin error pero sin número cuenta como fallo (el arnés viejo contestaba null)', () => {
    for (const data of [null, undefined, -5, 1.5, 'x']) {
      const b = alResponder(billeteraNueva(UNO), UNO, { data, error: null })
      expect(b.estado, String(data)).toBe(ERROR)
      expect(saldoMostrado(b)).toBe(null)
    }
  })

  it('tras un error, la siguiente respuesta buena se recupera sola', () => {
    const mal = alResponder(billeteraNueva(UNO), UNO, { data: null, error: ERROR_LECTURA })
    const bien = alResponder(mal, UNO, { data: 2500, error: null })
    expect(bien.estado).toBe(LISTO)
    expect(saldoMostrado(bien)).toBe(2500)
  })
})

describe('ECO-1b · el ajuste local (TRANSITORIO hasta ECO-1c)', () => {
  const lista = () => alResponder(billeteraNueva(UNO), UNO, { data: 2500, error: null })

  it('entrar resta la entrada, salir suma las fichas: las cuentas de saldoSesion', () => {
    let b = entrar(lista(), 1000)
    expect(saldoMostrado(b)).toBe(1500)
    b = salir(b, 1300, 1000)
    expect(saldoMostrado(b)).toBe(2800)
    // El servidor no se movió: el ajuste es aparte.
    expect(b.servidor).toBe(2500)
    expect(b.ajuste).toBe(300)
  })

  it('salir sin fichas válidas devuelve la entrada (era `App.jsx:543-547`)', () => {
    const b = salir(entrar(lista(), 1000), undefined, 1000)
    expect(saldoMostrado(b)).toBe(2500)
  })

  it('recargar resta, pero nunca deja la cifra bajo cero (era `Math.max(0, p − monto)`)', () => {
    let b = entrar(lista(), 2000)          // 500
    b = recargar(b, 300)                   // 200
    expect(saldoMostrado(b)).toBe(200)
    b = recargar(b, 900)                   // max(0, 200 − 900) = 0
    expect(saldoMostrado(b)).toBe(0)
    b = salir(b, 400, 2000)                // y la salida suma sobre 0, como antes
    expect(saldoMostrado(b)).toBe(400)
  })

  it('una relectura del servidor conserva el ajuste: billetera + ajuste', () => {
    let b = entrar(lista(), 1000)
    b = alResponder(b, UNO, { data: 2500, error: null })
    expect(saldoMostrado(b)).toBe(1500)
    // Un ajuste del administrador a la baja mientras se juega no da negativos.
    b = alResponder(b, UNO, { data: 500, error: null })
    expect(saldoMostrado(b)).toBe(0)
  })

  it('la billetera es de UNA cuenta: otra cuenta empieza de cero, sin el ajuste de la anterior', () => {
    const b = entrar(lista(), 1000)
    const otra = paraCuenta(b, DOS)
    expect(otra).toEqual(billeteraNueva(DOS))
    expect(paraCuenta(b, UNO)).toBe(b)
    // Y una respuesta para la otra cuenta tampoco hereda nada.
    expect(saldoMostrado(alResponder(b, DOS, { data: 2500, error: null }))).toBe(2500)
  })
})

describe('ECO-1b · cuándo se vuelve a leer', () => {
  const ctl = (extra) => ({ uid: UNO, enVuelo: false, ultima: null, ...extra })

  it('sin cuenta, nunca', () => {
    for (const m of Object.values(MOTIVOS)) expect(debeLeer({ uid: null, enVuelo: false, ultima: null }, m, 0)).toBe(false)
  })

  it('nunca dos lecturas a la vez', () => {
    for (const m of Object.values(MOTIVOS)) expect(debeLeer(ctl({ enVuelo: true }), m, 0)).toBe(false)
  })

  it('el arranque, una sola vez por cuenta (StrictMode monta dos veces)', () => {
    expect(debeLeer(ctl(), MOTIVOS.ARRANQUE, 0)).toBe(true)
    expect(debeLeer(ctl({ ultima: 0 }), MOTIVOS.ARRANQUE, 1)).toBe(false)
  })

  it('primer plano: como mucho una vez cada 15 s', () => {
    const t0 = 1_000_000
    expect(debeLeer(ctl({ ultima: t0 }), MOTIVOS.PRIMER_PLANO, t0 + INTERVALO_PRIMER_PLANO_MS - 1)).toBe(false)
    expect(debeLeer(ctl({ ultima: t0 }), MOTIVOS.PRIMER_PLANO, t0 + INTERVALO_PRIMER_PLANO_MS)).toBe(true)
    expect(debeLeer(ctl(), MOTIVOS.PRIMER_PLANO, t0)).toBe(true)
  })

  it('primer plano tras un FALLO no espera: la red volvió y el saldo se ve ya', () => {
    const t0 = 1_000_000
    expect(debeLeer(ctl({ ultima: t0, fallo: true }), MOTIVOS.PRIMER_PLANO, t0 + 1)).toBe(true)
    expect(debeLeer(ctl({ ultima: t0, fallo: true, enVuelo: true }), MOTIVOS.PRIMER_PLANO, t0 + 1)).toBe(false)
  })

  it('un saldo_insuficiente o un reintento se saltan la espera, no la regla de una a la vez', () => {
    const t0 = 1_000_000
    expect(debeLeer(ctl({ ultima: t0 }), MOTIVOS.INSUFICIENTE, t0 + 1)).toBe(true)
    expect(debeLeer(ctl({ ultima: t0 }), MOTIVOS.REINTENTO, t0 + 1)).toBe(true)
  })

  it('un motivo desconocido no lee', () => {
    expect(debeLeer(ctl(), 'cualquiera', 0)).toBe(false)
  })
})

describe('ECO-1b · el saldo con el que se juzga', () => {
  it('sin cifra no se juzga (Infinity); con cifra, la cifra', () => {
    expect(saldoParaJuzgar(null)).toBe(SIN_JUICIO)
    expect(saldoParaJuzgar(undefined)).toBe(SIN_JUICIO)
    expect(saldoParaJuzgar(0)).toBe(0)
    expect(saldoParaJuzgar(2500)).toBe(2500)
  })
})

describe('ECO-1b · la API de lectura', () => {
  const cliente = (respuesta) => ({ llamadas: [], rpc(n) { this.llamadas.push(n); return respuesta } })

  it('llama a mi_billetera y devuelve el número', async () => {
    const c = cliente(Promise.resolve({ data: 2500, error: null }))
    expect(await crearBilleteraApi(c).leer()).toEqual({ data: 2500, error: null })
    expect(c.llamadas).toEqual(['mi_billetera'])
  })

  it('un bigint que llegue como texto se pasa a número', async () => {
    expect(await crearBilleteraApi(cliente(Promise.resolve({ data: '2500', error: null }))).leer())
      .toEqual({ data: 2500, error: null })
  })

  it('NUNCA rechaza: error de la base, promesa rechazada o excepción síncrona', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const deLaBase = await crearBilleteraApi(cliente(Promise.resolve({ data: null, error: { code: '500', message: 'x' } }))).leer()
      expect(deLaBase).toEqual({ data: null, error: ERROR_LECTURA })
      const rechazo = await crearBilleteraApi(cliente(Promise.reject(new Error('red')))).leer()
      expect(rechazo).toEqual({ data: null, error: ERROR_LECTURA })
      const sincrona = await crearBilleteraApi({ rpc() { throw new Error('sdk') } }).leer()
      expect(sincrona).toEqual({ data: null, error: ERROR_LECTURA })
    } finally {
      aviso.mockRestore()
    }
  })

  it('la real no sabe nada antes de preguntar', () => {
    expect(crearBilleteraApi(cliente(Promise.resolve({}))).inicial).toBe(null)
  })
})

// ── Ajuste 2 del rector · la falsa sólo cambia la FUENTE ────────────────────
// La billetera falsa pasa por `crearBilleteraApi` —la capa real— y lo que
// devuelve se aplica con el MISMO núcleo. Aquí se comprueba que su contrato es
// el de la API real: `inicial` y `leer()`, nada más.
describe('ECO-1b · la billetera falsa del bypass', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin bypass no existe', () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '')
    expect(simulacionBilletera()).toBe(null)
  })

  it('con bypass y sin ?apu=saldo, 5.000 por el mismo camino que la real', async () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '1')
    const api = simulacionBilletera()
    expect(Object.keys(api).sort()).toEqual(['inicial', 'leer'])
    expect(api.inicial).toBe(5000)
    const respuesta = await api.leer()
    expect(respuesta).toEqual({ data: 5000, error: null })
    // Y el núcleo de la app la trata igual que a la real.
    const b = entrar(alResponder(billeteraNueva(UNO, api.inicial), UNO, respuesta), 1000)
    expect(saldoMostrado(b)).toBe(4000)
  })
})
