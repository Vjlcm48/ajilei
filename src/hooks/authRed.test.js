import { describe, it, expect } from 'vitest'
import { AuthRetryableFetchError, AuthApiError } from '@supabase/supabase-js'
import { esFalloDeRed, esperaDeReintento, SIN_RED, MENSAJE_RED } from './useAuth'

// ── IOS-1c · «no se pudo» no es «no hay» (§3.4) ─────────────────────────────
// Lo que decide entre SIN_RED (la tarjeta «No pudimos cargar tu cuenta») y la
// Portada o el Bautizo. Sin jsdom: se sella la regla, no el hook.

describe('IOS-1c · esFalloDeRed', () => {
  it('auth: un fetch cancelado por el tope o sin red es reintentable', () => {
    expect(esFalloDeRed(new AuthRetryableFetchError('Failed to fetch', 0))).toBe(true)
    expect(esFalloDeRed(new AuthRetryableFetchError('AbortError', 0))).toBe(true)
  })

  it('auth: un refresco rechazado por el servidor NO lo es (ése sí cierra la sesión)', () => {
    expect(esFalloDeRed(new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found'))).toBe(false)
  })

  it('PostgREST: sin código ni estado (el tope, la red) o un 5xx es fallo de red', () => {
    expect(esFalloDeRed({ message: 'AbortError: signal is aborted', code: '' })).toBe(true)
    expect(esFalloDeRed({ message: 'TypeError: Failed to fetch' })).toBe(true)
    expect(esFalloDeRed({ message: 'x', code: '', status: 503 })).toBe(true)
  })

  it('PostgREST: una respuesta con código de Postgres no lo es', () => {
    expect(esFalloDeRed({ message: 'duplicate key', code: '23505', status: 409 })).toBe(false)
    expect(esFalloDeRed({ message: 'check', code: '23514' })).toBe(false)
    expect(esFalloDeRed(null)).toBe(false)
  })

  it('la escalera de reintentos y los textos', () => {
    expect([1, 2, 3, 4, 5, 9].map(esperaDeReintento)).toEqual([1000, 2000, 4000, 8000, 15000, 15000])
    expect(SIN_RED).toBe('SIN_RED')
    expect(MENSAJE_RED).toMatch(/conexión/)
  })
})
