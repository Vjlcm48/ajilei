import { describe, it, expect, vi } from 'vitest'

// `supabase.js` lanza al importarse si faltan las variables de entorno: el
// cliente se pasa por parámetro y el singleton no se usa.
vi.mock('./supabase', () => ({ supabase: {} }))
const { crearCorreoApi } = await import('./correoApi.js')

const T = Date.parse('2026-11-01T12:00:00Z')
const iso = (ms) => new Date(ms).toISOString()
const ACTUAL = 'victor@gmail.com'
const NUEVO = 'nuevo@gmail.com'
const OTP_MAL = { name: 'AuthApiError', status: 403, code: 'otp_expired', message: 'Token has expired or is invalid' }

// GoTrue en pequeño, con lo que la sonda leyó de `verify.go`: cada código vale
// solo con el correo que lo recibió, se gasta al usarse y el segundo devuelve
// la sesión.
function servidor({ pendiente = true, enviado = T, ahoraMs = T } = {}) {
  const s = {
    llamadas: [],
    tokens: pendiente ? { [ACTUAL]: '111111', [NUEVO]: '222222' } : {},
    aceptados: 0,
    errorVerify: null,
    errorResend: null,
    errorUpdate: null,
    errorUser: null,
    usuario: { id: 'u', email: ACTUAL, ...(pendiente ? { new_email: NUEVO, email_change_sent_at: iso(enviado) } : {}) },
  }
  s.cliente = {
    auth: {
      getUser: async () => (s.errorUser ? { data: { user: null }, error: s.errorUser } : { data: { user: s.usuario }, error: null }),
      getSession: async () => ({ data: { session: { user: { email: ACTUAL } } }, error: null }),
      updateUser: async (a) => {
        s.llamadas.push(['updateUser', a])
        if (s.errorUpdate) return { data: { user: null }, error: s.errorUpdate }
        if (a.email === s.usuario.email) return { data: { user: { email: ACTUAL } }, error: null }
        return { data: { user: { email: ACTUAL, new_email: a.email, email_change_sent_at: iso(ahoraMs) } }, error: null }
      },
      verifyOtp: async ({ email, token, type }) => {
        s.llamadas.push(['verifyOtp', email, token, type])
        if (s.errorVerify) return { data: { user: null, session: null }, error: s.errorVerify }
        if (ahoraMs >= enviado + 600_000) return { data: { user: null, session: null }, error: OTP_MAL }
        if (s.tokens[email] !== token) return { data: { user: null, session: null }, error: OTP_MAL }
        delete s.tokens[email]
        s.aceptados += 1
        if (s.aceptados === 1) return { data: { user: null, session: null }, error: null }
        return { data: { user: { email: NUEVO }, session: { access_token: 'nuevo' } }, error: null }
      },
      resend: async (a) => {
        s.llamadas.push(['resend', a])
        return { data: { user: null, session: null }, error: s.errorResend }
      },
    },
  }
  s.api = crearCorreoApi(s.cliente, { ahora: () => ahoraMs })
  s.verifies = () => s.llamadas.filter((l) => l[0] === 'verifyOtp').length
  return s
}

describe('CFG-1 1d · estado', () => {
  it('lee del usuario de la sesión', async () => {
    expect(await servidor({ pendiente: false }).api.estado()).toEqual({ ok: true, correo: ACTUAL, estado: 'normal', nuevo: null, enviadoEn: null })
    expect(await servidor().api.estado()).toEqual({ ok: true, correo: ACTUAL, estado: 'pendiente', nuevo: NUEVO, enviadoEn: T })
  })
  it('con el código vencido, normal aunque `new_email` siga', async () => {
    expect((await servidor({ enviado: T - 600_000 }).api.estado()).estado).toBe('normal')
  })
  it('un fallo devuelve el motivo', async () => {
    const s = servidor()
    s.errorUser = { name: 'AuthRetryableFetchError', status: 0 }
    expect(await s.api.estado()).toEqual({ ok: false, motivo: 'red' })
  })
})

describe('CFG-1 1d · pedirCambio', () => {
  it('normaliza y devuelve el envío', async () => {
    const s = servidor({ pendiente: false })
    expect(await s.api.pedirCambio('  Nuevo@GMAIL.com ')).toEqual({ ok: true, motivo: 'pendiente', nuevo: NUEVO, enviadoEn: T })
    expect(s.llamadas).toEqual([['updateUser', { email: NUEVO }]])
  })
  it('lo que seguro no vale no hace viaje', async () => {
    const s = servidor({ pendiente: false })
    expect(await s.api.pedirCambio('nuevo@correo')).toEqual({ ok: false, motivo: 'invalido' })
    expect(await s.api.pedirCambio(' VICTOR@gmail.com')).toEqual({ ok: false, motivo: 'mismo' })
    expect(s.llamadas).toEqual([])
  })
  it('si el servidor contesta 200 sin `new_email`, es el mismo', async () => {
    const s = servidor({ pendiente: false })
    s.cliente.auth.getSession = async () => ({ data: { session: null }, error: null })
    expect(await s.api.pedirCambio(ACTUAL)).toEqual({ ok: false, motivo: 'mismo' })
  })
  it.each([
    [{ status: 422, code: 'email_exists' }, 'en_uso'],
    [{ status: 429, code: 'over_email_send_rate_limit' }, 'limite'],
    [{ status: 500, code: 'unexpected_failure' }, 'red'],
    [{ status: 400, code: 'otra_cosa' }, 'desconocido'],
  ])('%o → %s', async (error, motivo) => {
    const s = servidor({ pendiente: false })
    s.errorUpdate = error
    expect(await s.api.pedirCambio(NUEVO)).toEqual({ ok: false, motivo })
  })
  it('nunca lanza', async () => {
    const s = servidor({ pendiente: false })
    s.cliente.auth.updateUser = async () => { throw new Error('rara') }
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await s.api.pedirCambio(NUEVO)).toEqual({ ok: false, motivo: 'desconocido' })
    aviso.mockRestore()
  })
})

describe('CFG-1 1d · confirmar', () => {
  it('cada código va con el correo que lo recibió, y el éxito es la sesión', async () => {
    const s = servidor()
    expect(await s.api.confirmar('111111', '222222')).toEqual({ ok: true, motivo: 'ok', correo: NUEVO })
    expect(s.llamadas).toEqual([
      ['verifyOtp', ACTUAL, '111111', 'email_change'],
      ['verifyOtp', NUEVO, '222222', 'email_change'],
    ])
  })
  it('uno bien y otro mal: se marca el malo, aunque no sea el primero', async () => {
    const a = servidor()
    expect(await a.api.confirmar('111111', '000000')).toEqual({ ok: false, motivo: 'codigo_mal', campos: ['nuevo'] })
    const b = servidor()
    expect(await b.api.confirmar('000000', '222222')).toEqual({ ok: false, motivo: 'codigo_mal', campos: ['actual'] })
  })
  it('el reintento acaba aunque el código ya aceptado falle al repetirse', async () => {
    const s = servidor()
    await s.api.confirmar('111111', '000000')
    expect(await s.api.confirmar('111111', '222222')).toEqual({ ok: true, motivo: 'ok', correo: NUEVO })
  })
  it('el ya aceptado no se marca como malo si el otro sigue mal', async () => {
    const s = servidor()
    await s.api.confirmar('111111', '000000')
    expect(await s.api.confirmar('111111', '999999')).toEqual({ ok: false, motivo: 'codigo_mal', campos: ['nuevo'] })
  })
  it('reabrir la app: la API no recuerda lo aceptado y aun así completa', async () => {
    const s = servidor()
    await s.api.confirmar('111111', '000000')
    const otra = crearCorreoApi(s.cliente, { ahora: () => T })
    expect(await otra.confirmar('111111', '222222')).toEqual({ ok: true, motivo: 'ok', correo: NUEVO })
  })
  it('cruzados: se prueban al revés una vez y completa', async () => {
    const s = servidor()
    expect(await s.api.confirmar('222222', '111111')).toEqual({ ok: true, motivo: 'ok', correo: NUEVO })
    expect(s.verifies()).toBe(4)
  })
  it('los dos mal: cuatro llamadas como máximo, y se marcan los dos', async () => {
    const s = servidor()
    expect(await s.api.confirmar('000000', '999999')).toEqual({ ok: false, motivo: 'codigo_mal', campos: ['actual', 'nuevo'] })
    expect(s.verifies()).toBe(4)
  })
  it('cruzado a medias: queda mal el campo que no servía', async () => {
    const s = servidor()
    // «222222» es el del nuevo, y va en el campo «actual»; el del campo «nuevo» no vale.
    expect(await s.api.confirmar('222222', '000000')).toEqual({ ok: false, motivo: 'codigo_mal', campos: ['nuevo'] })
    expect(s.aceptados).toBe(1)
  })
  it('vencido: lo dice el reloj y no gasta más llamadas', async () => {
    const s = servidor({ enviado: T - 600_000 })
    expect(await s.api.confirmar('111111', '222222')).toEqual({ ok: false, motivo: 'codigo_vencido' })
    expect(s.verifies()).toBe(1)
  })
  it.each([
    [{ status: 429, code: 'over_request_rate_limit' }, 'limite'],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 'red'],
  ])('%o corta enseguida: %s', async (error, motivo) => {
    const s = servidor()
    s.errorVerify = error
    expect(await s.api.confirmar('111111', '222222')).toEqual({ ok: false, motivo })
    expect(s.verifies()).toBe(1)
  })
  it('sin cambio pendiente en el servidor no manda nada', async () => {
    const s = servidor({ pendiente: false })
    expect(await s.api.confirmar('111111', '222222')).toEqual({ ok: false, motivo: 'desconocido' })
    expect(s.verifies()).toBe(0)
  })
})

describe('CFG-1 1d · reenviar', () => {
  it('SIEMPRE con el correo actual', async () => {
    const s = servidor()
    expect(await s.api.reenviar()).toEqual({ ok: true, motivo: 'pendiente', nuevo: NUEVO, enviadoEn: T })
    expect(s.llamadas).toEqual([['resend', { type: 'email_change', email: ACTUAL }]])
  })
  it('un envío nuevo olvida lo aceptado en el anterior', async () => {
    const s = servidor()
    await s.api.confirmar('111111', '000000')
    s.usuario = { ...s.usuario, email_change_sent_at: iso(T + 60_000) }
    s.tokens = { [ACTUAL]: '333333', [NUEVO]: '444444' }
    s.aceptados = 0
    expect(await s.api.confirmar('111111', '000000')).toEqual({ ok: false, motivo: 'codigo_mal', campos: ['actual', 'nuevo'] })
  })
  it('el límite sale como motivo', async () => {
    const s = servidor()
    s.errorResend = { status: 429, code: 'over_email_send_rate_limit' }
    expect(await s.api.reenviar()).toEqual({ ok: false, motivo: 'limite' })
  })
  it('sin nada pendiente no llama a resend', async () => {
    const s = servidor({ pendiente: false })
    expect(await s.api.reenviar()).toEqual({ ok: false, motivo: 'desconocido' })
    expect(s.llamadas).toEqual([])
  })
})
