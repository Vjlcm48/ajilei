// ── CFG-1 1d · El cambio de correo: las reglas, sin red ni React ────────────
// Rector: AJILEI_CFG-1_Fase1d_v1.0.md §4, con lo resuelto en STOP-0 y STOP-L.
// Molde de `lugarCore.js`: la API (`correoApi.js`) llama a Supabase y aquí se
// decide qué significa lo que contesta.
//
// LO QUE EL SERVIDOR NO DICE Y ESTE NÚCLEO DEDUCE (sonda, GoTrue v2.197.0):
//   · `new_email` no se borra cuando el código vence, así que «pendiente» es
//     `new_email` + que `email_change_sent_at` no haya caducado.
//   · Vencido e incorrecto son el mismo 403 `otp_expired`: los separa el reloj.
//   · Pedir el mismo correo es un 200 sin efecto, no un error.

// Espejo del panel: Auth → Sign In / Providers → Email → Email OTP expiration.
// Si se cambia allí, se cambia aquí: también lo dice el texto `perfil.correo.vence`.
export const OTP_EXP_S = 600

// Espejo del panel: Auth → Rate Limits, intervalo mínimo por usuario.
export const INTERVALO_ENVIO_S = 60

export const MOTIVOS = Object.freeze([
  'ok', 'pendiente', 'invalido', 'mismo', 'en_uso', 'codigo_mal', 'codigo_vencido', 'limite', 'red', 'desconocido',
])

/** Lo que se compara y se manda: sin espacios y en minúsculas, como lo guarda el servidor. */
export function normalizarCorreo(correo) {
  return typeof correo === 'string' ? correo.trim().toLowerCase() : ''
}

// La autoridad es el servidor: esto solo evita un viaje por lo que seguro no vale.
export function correoValido(correo) {
  const c = normalizarCorreo(correo)
  return c.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)
}

export function esMismoCorreo(a, b) {
  const x = normalizarCorreo(a)
  return x !== '' && x === normalizarCorreo(b)
}

/** Un instante ISO del servidor → ms, o `null` si no lo es. */
export function instanteDe(v) {
  if (typeof v !== 'string' || v === '') return null
  const ms = Date.parse(v)
  return Number.isNaN(ms) ? null : ms
}

export function codigosVencidos(enviadoEn, ahora) {
  return typeof enviadoEn === 'number' && ahora >= enviadoEn + OTP_EXP_S * 1000
}

/** La fila del perfil: `normal`, o `pendiente` mientras viva el código. */
export function estadoFila(usuario, ahora) {
  const nuevo = usuario?.new_email || null
  const enviadoEn = instanteDe(usuario?.email_change_sent_at)
  if (!nuevo || enviadoEn === null || codigosVencidos(enviadoEn, ahora)) {
    return { estado: 'normal', nuevo: null, enviadoEn: null }
  }
  return { estado: 'pendiente', nuevo, enviadoEn }
}

/** Los segundos que faltan para poder mandar otra vez, de 0 a `INTERVALO_ENVIO_S`. */
export function esperaEnvio(enviadoEn, ahora) {
  if (typeof enviadoEn !== 'number') return 0
  const s = Math.ceil((enviadoEn + INTERVALO_ENVIO_S * 1000 - ahora) / 1000)
  return Math.min(INTERVALO_ENVIO_S, Math.max(0, s))
}

// `esFalloDeRed` de `useAuth` con la misma regla: importarlo arrastraría el
// cliente de Supabase a este núcleo.
function esRed(error) {
  if (error?.name === 'AuthRetryableFetchError') return true
  const estado = Number(error?.status ?? 0)
  return (!error?.code && estado === 0) || estado >= 500
}

const esLimite = (error) => Number(error?.status) === 429
  || error?.code === 'over_email_send_rate_limit' || error?.code === 'over_request_rate_limit'

/** La respuesta de `updateUser` o `resend` → un motivo cerrado. */
export function motivoDeEnvio(error) {
  if (!error) return 'ok'
  if (esLimite(error)) return 'limite'
  if (error.code === 'email_exists') return 'en_uso'
  if (error.code === 'validation_failed' || error.code === 'email_address_invalid') return 'invalido'
  return esRed(error) ? 'red' : 'desconocido'
}

/** La respuesta de `verifyOtp` → un motivo cerrado. Vencido o incorrecto lo dice el reloj. */
export function motivoDeCodigo(error, enviadoEn, ahora) {
  if (!error) return 'ok'
  if (esLimite(error)) return 'limite'
  if (error.code === 'otp_expired') return codigosVencidos(enviadoEn, ahora) ? 'codigo_vencido' : 'codigo_mal'
  return esRed(error) ? 'red' : 'desconocido'
}

const CLAVES = {
  invalido: 'perfil.correo.e.invalido',
  mismo: 'perfil.correo.e.mismo',
  en_uso: 'perfil.correo.e.en_uso',
  codigo_vencido: 'perfil.correo.e.vencido',
  limite: 'perfil.correo.e.limite',
}

/** Motivo → clave de texto. `campos`: qué código falló ('actual', 'nuevo' o los dos). */
export function claveDeMotivo(motivo, campos = []) {
  if (motivo === 'codigo_mal') {
    if (campos.length === 1) return `perfil.correo.e.codigo_${campos[0]}`
    return 'perfil.correo.e.codigo_dos'
  }
  return CLAVES[motivo] ?? 'perfil.correo.e.envio'
}
