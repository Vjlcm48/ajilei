import { describe, it, expect } from 'vitest'
import { TEXTOS_ES } from '../config/textos.es'
import {
  OTP_EXP_S, INTERVALO_ENVIO_S, MOTIVOS, normalizarCorreo, correoValido, esMismoCorreo, instanteDe,
  codigosVencidos, estadoFila, esperaEnvio, motivoDeEnvio, motivoDeCodigo, claveDeMotivo,
} from './correoCore'

const T = Date.parse('2026-11-01T12:00:00Z')
const iso = (ms) => new Date(ms).toISOString()

describe('CFG-1 1d · las dos cifras del panel', () => {
  it('10 minutos de código y 60 s entre envíos, y el texto dice lo mismo', () => {
    expect(OTP_EXP_S).toBe(600)
    expect(INTERVALO_ENVIO_S).toBe(60)
    expect(TEXTOS_ES['perfil.correo.vence']).toContain(`${OTP_EXP_S / 60} minutos`)
  })
})

describe('CFG-1 1d · normalizar y validar', () => {
  it('quita los espacios y las mayúsculas', () => {
    expect(normalizarCorreo('  Nuevo.Correo@GMAIL.com ')).toBe('nuevo.correo@gmail.com')
    expect(normalizarCorreo(null)).toBe('')
  })
  it.each(['a@b.co', ' A@B.CO ', 'victorjlcm32+borrar1d@gmail.com'])('%s vale', (c) => {
    expect(correoValido(c)).toBe(true)
  })
  it.each(['', 'a', 'a@b', '@b.co', 'a b@c.co', 'a@b c.co', 'a@@b.co', `${'x'.repeat(251)}@b.co`, null])('%s no vale', (c) => {
    expect(correoValido(c)).toBe(false)
  })
  it('el mismo correo no distingue mayúsculas ni espacios, y vacío no es el mismo', () => {
    expect(esMismoCorreo(' VICTOR@gmail.com', 'victor@GMAIL.com ')).toBe(true)
    expect(esMismoCorreo('a@b.co', 'c@b.co')).toBe(false)
    expect(esMismoCorreo('', '')).toBe(false)
  })
  it('un instante que no lo es da null', () => {
    expect(instanteDe('2026-11-01T12:00:00Z')).toBe(T)
    for (const v of [null, undefined, '', 'ayer', 5]) expect(instanteDe(v)).toBeNull()
  })
})

describe('CFG-1 1d · el estado de la fila (H-1)', () => {
  const pendiente = { new_email: 'n@b.co', email_change_sent_at: iso(T) }
  it('sin cambio: normal', () => {
    expect(estadoFila({ email: 'a@b.co' }, T).estado).toBe('normal')
    expect(estadoFila(null, T).estado).toBe('normal')
  })
  it('con cambio vivo: pendiente, con la dirección y el envío', () => {
    expect(estadoFila(pendiente, T + 599_000)).toEqual({ estado: 'pendiente', nuevo: 'n@b.co', enviadoEn: T })
  })
  it('new_email sigue en el servidor pero el código venció: normal', () => {
    expect(codigosVencidos(T, T + 599_999)).toBe(false)
    expect(codigosVencidos(T, T + 600_000)).toBe(true)
    expect(estadoFila(pendiente, T + 600_000)).toEqual({ estado: 'normal', nuevo: null, enviadoEn: null })
  })
  it('new_email sin fecha de envío no es pendiente', () => {
    expect(estadoFila({ new_email: 'n@b.co' }, T).estado).toBe('normal')
  })
})

describe('CFG-1 1d · la espera entre envíos', () => {
  it('cuenta hacia abajo y redondea hacia arriba', () => {
    expect(esperaEnvio(T, T)).toBe(60)
    expect(esperaEnvio(T, T + 500)).toBe(60)
    expect(esperaEnvio(T, T + 18_000)).toBe(42)
    expect(esperaEnvio(T, T + 59_001)).toBe(1)
    expect(esperaEnvio(T, T + 60_000)).toBe(0)
  })
  it('no sale de 0…60, aunque el reloj del aparato vaya mal', () => {
    expect(esperaEnvio(T, T - 3_600_000)).toBe(60)
    expect(esperaEnvio(T, T + 3_600_000)).toBe(0)
    expect(esperaEnvio(null, T)).toBe(0)
  })
})

describe('CFG-1 1d · traducir las respuestas (sonda S-5)', () => {
  const err = (status, code, name = 'AuthApiError') => ({ name, status, code, message: 'x' })
  const envio = [
    [err(400, 'validation_failed'), 'invalido'],
    [err(400, 'email_address_invalid'), 'invalido'],
    [err(422, 'email_exists'), 'en_uso'],
    [err(429, 'over_email_send_rate_limit'), 'limite'],
    [err(429, undefined), 'limite'],
    [{ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }, 'red'],
    [{ name: 'Error', status: 0, message: 'AbortError' }, 'red'],
    [err(500, 'unexpected_failure'), 'red'],
    [err(400, 'session_not_found'), 'desconocido'],
    [err(422, 'lo_que_sea'), 'desconocido'],
  ]
  it.each(envio)('%o al enviar → %s', (error, motivo) => {
    expect(motivoDeEnvio(error)).toBe(motivo)
  })
  it('sin error, ok', () => {
    expect(motivoDeEnvio(null)).toBe('ok')
    expect(motivoDeCodigo(null, T, T)).toBe('ok')
  })
  it('otp_expired es incorrecto o vencido según el reloj (H-2)', () => {
    const e = err(403, 'otp_expired')
    expect(motivoDeCodigo(e, T, T + 599_000)).toBe('codigo_mal')
    expect(motivoDeCodigo(e, T, T + 600_000)).toBe('codigo_vencido')
  })
  it('los demás del código', () => {
    expect(motivoDeCodigo(err(429, 'over_request_rate_limit'), T, T)).toBe('limite')
    expect(motivoDeCodigo({ name: 'AuthRetryableFetchError', status: 0 }, T, T)).toBe('red')
    expect(motivoDeCodigo(err(403, 'user_banned'), T, T)).toBe('desconocido')
  })
})

describe('CFG-1 1d · de motivo a texto', () => {
  it('cada código malo dice cuál', () => {
    expect(claveDeMotivo('codigo_mal', ['actual'])).toBe('perfil.correo.e.codigo_actual')
    expect(claveDeMotivo('codigo_mal', ['nuevo'])).toBe('perfil.correo.e.codigo_nuevo')
    expect(claveDeMotivo('codigo_mal', ['actual', 'nuevo'])).toBe('perfil.correo.e.codigo_dos')
    expect(claveDeMotivo('codigo_mal')).toBe('perfil.correo.e.codigo_dos')
  })
  it('red y desconocido dicen «no se pudo enviar» (H-6, H-7)', () => {
    expect(claveDeMotivo('red')).toBe('perfil.correo.e.envio')
    expect(claveDeMotivo('desconocido')).toBe('perfil.correo.e.envio')
  })
  it('todo motivo de fallo tiene su texto en el diccionario', () => {
    for (const m of MOTIVOS.filter((x) => x !== 'ok' && x !== 'pendiente')) {
      expect(TEXTOS_ES[claveDeMotivo(m)], m).toBeTypeOf('string')
    }
    for (const c of ['actual', 'nuevo']) expect(TEXTOS_ES[claveDeMotivo('codigo_mal', [c])]).toBeTypeOf('string')
  })
})
