import { calcularDesfase, ahoraServidor } from './relojCore.js'

// ── ECO-1g · El video de recompensa, en su mitad pura ───────────────────────
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §1 (G1–G10, S1–S6) y el plan aprobado del
// STOP-1 (§4 y §5). Sin React, sin DOM y sin `Date.now()`: la hora entra por
// parámetro, como en `relojCore`. Vitest sella estas reglas; el canal
// (`lib/controlVideo`) y las piezas que pintan sólo las cablean.

// G4 · un tic de 100 ms suma tiempo VISIBLE; cada suma se topa a 250 ms para
// que el primer tic al volver de la pantalla bloqueada no regale lo que pasó a
// oscuras.
export const TIC_MS = 100
export const TOPE_TIC_MS = 250

// G10 · ocho consejos, uno cada 6,5 s, empezando por uno distinto cada video.
export const CONSEJOS = 8
export const PASO_CONSEJO_MS = 6500

// Lo que se ve dentro de la capa.
export const FASES = Object.freeze({ CORRIENDO: 'corriendo', CONFIRMA: 'confirma', PAUSA: 'pausa' })

/**
 * El tiempo visible tras un tic. Sólo suma si el video corre y la pestaña está
 * a la vista (G7: con la confirmación de la ✕ abierta no corre; G8: en pausa
 * tampoco).
 */
export function sumarVisible(ms, delta, { fase, oculto }) {
  if (fase !== FASES.CORRIENDO || oculto) return ms
  if (!(delta > 0)) return ms
  return ms + Math.min(delta, TOPE_TIC_MS)
}

/** El consejo que toca (0..7): avanza uno cada `PASO_CONSEJO_MS` visibles. */
export function consejoDe(inicio, ms) {
  const base = Number.isFinite(inicio) ? Math.max(0, Math.floor(inicio)) : 0
  return (base + Math.floor(Math.max(0, ms) / PASO_CONSEJO_MS)) % CONSEJOS
}

/** «Faltan N s»: hacia arriba, y nunca negativo. */
export function faltanS(duracionMs, ms) {
  return Math.max(0, Math.ceil((duracionMs - ms) / 1000))
}

export function progreso(duracionMs, ms) {
  if (!(duracionMs > 0)) return 1
  return Math.min(1, Math.max(0, ms / duracionMs))
}

/**
 * G8 + S2 · ¿da tiempo a terminar antes de que caduque la ocasión? Tras una
 * pausa larga el boleto puede estar a punto de vencer: seguir sería hacer ver
 * el resto para nada. `caducaEn` y `ahora` van en el MISMO reloj (el local).
 * Sin caducidad conocida, siempre da tiempo.
 */
export function daTiempo(caducaEn, ahora, duracionMs, ms) {
  if (!Number.isFinite(caducaEn)) return true
  return ahora + Math.max(0, duracionMs - ms) < caducaEn
}

// ── Lo que el servidor dijo del día ─────────────────────────────────────────

/**
 * El estado del día tras una respuesta del servidor (`mi_video`, `pedir_boleto`
 * o `cobrar_boleto`: las tres traen `quedan` y `reinicioEn`). Una respuesta
 * sin datos (`red`, o un instante ilegible) deja lo que había.
 *   quedan, tope   los videos que quedan hoy y el tope del día
 *   premio         lo que paga un video: LO DICE EL SERVIDOR; el del espejo
 *                  (`videoReward`) sólo mientras no ha contestado
 *   reinicioEn     la próxima medianoche de Chicago, en ms de servidor
 *   desfase        servidor − local, para restar contra el reloj del servidor
 */
export function estadoTras(previo, r, ahoraLocal) {
  if (!r || r.codigo === 'red' || !Number.isFinite(r.reinicioEn) || !Number.isFinite(r.quedan)) return previo ?? null
  return {
    quedan: Math.max(0, r.quedan),
    tope: Number.isFinite(r.tope) && r.tope > 0 ? r.tope : (previo?.tope ?? null),
    premio: Number.isFinite(r.premio) && r.premio > 0 ? r.premio : (previo?.premio ?? null),
    reinicioEn: r.reinicioEn,
    desfase: Number.isFinite(r.ahora) ? calcularDesfase(r.ahora, ahoraLocal) : (previo?.desfase ?? 0),
  }
}

/** Lo que falta hasta el reinicio, en ms y contra el reloj del servidor (G6). */
export function msHastaReinicio(estado, ahoraLocal) {
  if (!estado || !Number.isFinite(estado.reinicioEn)) return null
  return Math.max(0, estado.reinicioEn - ahoraServidor(ahoraLocal, estado.desfase))
}

/**
 * «5 h 12 min» o «12 min», en piezas: el texto lo pone `t()`. Hacia arriba y
 * con un minuto como mínimo: «Vuelven en 0 min» no dice nada.
 */
export function tiempoPartes(ms) {
  const min = Math.max(1, Math.ceil((Number.isFinite(ms) ? ms : 0) / 60000))
  return { h: Math.floor(min / 60), m: min % 60 }
}

/**
 * Lo que pinta el contador (O1: una sola caja para los tres textos).
 * @returns {{clave:string, vars:object}|null}  `null` = aún no se sabe (la caja
 *   se queda reservada y vacía)
 */
export function contadorDe(estado, ahoraLocal) {
  if (!estado) return null
  if (estado.quedan > 0) {
    return estado.quedan === 1
      ? { clave: 'video.queda.uno', vars: { total: estado.tope } }
      : { clave: 'video.quedan', vars: { n: estado.quedan, total: estado.tope } }
  }
  const { h, m } = tiempoPartes(msHastaReinicio(estado, ahoraLocal))
  return { clave: 'video.vuelven', tiempo: h > 0 ? { clave: 'video.tiempo.hm', vars: { h, m } } : { clave: 'video.tiempo.m', vars: { m } } }
}

/** El tope del día alcanzado: fila y botón apagados (G6). */
export const sinVideosHoy = (estado) => Boolean(estado) && estado.quedan <= 0

/** ¿Pasó ya la medianoche de Chicago que se estaba esperando? Toca releer. */
export function tocaReleer(estado, ahoraLocal) {
  return sinVideosHoy(estado) && msHastaReinicio(estado, ahoraLocal) === 0
}

// ── Qué hace el cliente con cada código (plan del STOP-1 §5) ────────────────

export const AL_PEDIR = Object.freeze({ ABRIR: 'abrir', TOPE: 'tope', SIN: 'sin' })

/** Al pedir el boleto: la capa no se abre hasta que hay uno. */
export function alPedir(r) {
  if (r?.codigo === 'ok' && r.boletoId) return AL_PEDIR.ABRIR
  if (r?.codigo === 'tope_dia') return AL_PEDIR.TOPE
  // `limite`, `red`, `sin_sesion`, `sin_billetera` o cualquier otra cosa: el
  // mensaje T7. No se descontó nada.
  return AL_PEDIR.SIN
}

export const AL_COBRAR = Object.freeze({
  CELEBRAR: 'celebrar', ESPERAR: 'esperar', REINTENTAR: 'reintentar', TOPE: 'tope', SIN: 'sin',
})

// Los reintentos de la casa (`esperasRed.ESPERAS_RED_MS`): 1, 2, 4, 8 y
// luego 15 s. La PRIMERA TANDA son esos cinco (unos 30 s): mientras dura, la ✕
// no está (P-2 del rector).
export const ESPERAS_COBRO_MS = Object.freeze([1000, 2000, 4000, 8000, 15000])
// Un margen sobre los segundos que dice el servidor, por el redondeo y el viaje.
const MARGEN_PRONTO_MS = 250

/**
 * Al cobrar: qué hacer con la respuesta.
 *   celebrar    `ok` o `ya_cobrado` (S3: el reintento de un cobro que sí entró
 *               trae el saldo ya subido). Se celebra una vez.
 *   esperar     `demasiado_pronto` (relojes desfasados): lo que diga el servidor.
 *   reintentar  `limite` o `red` (K7: un límite nunca hace perder un video ya
 *               visto). El MISMO boleto, mientras viva.
 *   tope        `tope_dia`: se cierra sin celebrar.
 *   sin         `anulado`, `vencido`, `ajeno`… el mensaje T7, sin cobro.
 * @param {object} r         la respuesta de `cobrar`
 * @param {number} intentos  los reintentos YA hechos por `limite` o `red`
 */
export function alCobrar(r, intentos = 0) {
  const codigo = r?.codigo
  if ((codigo === 'ok' || codigo === 'ya_cobrado') && Number.isFinite(r.saldo)) return { accion: AL_COBRAR.CELEBRAR }
  if (codigo === 'demasiado_pronto') {
    return { accion: AL_COBRAR.ESPERAR, esperaMs: Math.max(1, r.faltanS || 1) * 1000 + MARGEN_PRONTO_MS }
  }
  if (codigo === 'limite' || codigo === 'red' || codigo === 'ok' || codigo === 'ya_cobrado') {
    // (`ok` sin saldo legible no se celebra a ciegas: se pregunta otra vez, y
    // la respuesta será `ya_cobrado` con su saldo.)
    return { accion: AL_COBRAR.REINTENTAR, esperaMs: esperaCobro(intentos) }
  }
  if (codigo === 'tope_dia') return { accion: AL_COBRAR.TOPE }
  return { accion: AL_COBRAR.SIN }
}

export function esperaCobro(intentos) {
  const i = Math.max(0, Math.min(intentos, ESPERAS_COBRO_MS.length - 1))
  return ESPERAS_COBRO_MS[i]
}

/**
 * P-2 · ¿se puede salir del cobro? No durante la primera tanda de reintentos:
 * la ✕ aparece cuando los cinco ya se hicieron y el cobro sigue sin entrar.
 */
export const cobroSalible = (intentos) => intentos >= ESPERAS_COBRO_MS.length

/**
 * La celebración de un cobro: de dónde a dónde cuenta la píldora. El premio es
 * el que dice el servidor (también con `ya_cobrado`, donde `cobrado` es 0).
 */
export function celebracionDe(r, premioEspejo) {
  const premio = Number.isFinite(r?.premio) && r.premio > 0 ? r.premio : premioEspejo
  return { premio, desde: Math.max(0, r.saldo - premio), hasta: r.saldo }
}

// ── La celebración sobria (G5): ~2,2 s ──────────────────────────────────────
// La moneda sale a los 520 ms, llega (`TRASPASO_MS` después) y ahí suenan las
// fichas y la píldora cuenta 800 ms; la tarjeta se va a los 1,9 s.
export const TIEMPOS_CEL = Object.freeze({ vuelo: 520, conteo: 800, sale: 1900, fin: 2200, sinVuelo: 600 })
