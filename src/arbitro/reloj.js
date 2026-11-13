// ── MOT-1 1b · Cuánto dura cada espera ──────────────────────────────────────
// Normativo: contrato §6. El ritmo escala el vuelo del reparto, las esperas del segundo
// reparto y la reposición (salvo su arranque y su cierre). El aviso y las pausas, no.

import {
  ANTES_DEL_REPARTO_MS, AVISO_SALIDA_MS, BARAJADO_MS, D_IN, D_IN_STAG, D_OUT, D_OUT_STAG, D_PAUSE, D_SEAT_GAP,
  D_SKIP, ELECCION_SORTEO_MS, FACTOR_RAPIDA, FIN_SEGUNDO_REPARTO_MS, LECTURA_TRAS_REVELACION_MS, MANO_SIGUIENTE_MS,
  OFERTA_RECARGA_MS, PAUSA_ANUNCIO_MS, RED_REVELACION_MS, REPOSICION_ARRANQUE_MS, REPOSICION_CIERRE_MS,
  TRAS_PRIMER_REPARTO_MS, TURN_TIME, VOLTEO_SORTEO_MS, VUELO_REPARTO_MS, esperaRepartoSorteo,
} from '../config/esperas.js'

// v1.3 · el reparto del sorteo depende de cuántos participan en la ronda (la fórmula vive en
// `config/esperas.js`, la misma que pinta la capa).
export { esperaRepartoSorteo }

export const CLASES = Object.freeze({
  BARAJADO_SORTEO: 'barajado_sorteo',
  REPARTO_SORTEO:  'reparto_sorteo',
  ELECCION_SORTEO: 'eleccion_sorteo',
  VOLTEO_SORTEO:   'volteo_sorteo',
  BARAJADO:        'barajado',
  REPARTO:         'reparto',
  TURNO:           'turno',
  DESCARTE:        'descarte',
  REPOSICION:      'reposicion',
  AVISO_SALIDA:    'aviso_salida',
  MANO_SIGUIENTE:  'mano_siguiente',
  PAUSA_ANUNCIO:   'pausa_anuncio',
  // v1.3 · la retención de la oferta de recarga: sin quien quebró quedaría uno solo con fichas.
  OFERTA_RECARGA:  'oferta_recarga',
})

export const RITMOS = Object.freeze({ NORMAL: 'normal', RAPIDO: 'rapido' })

export const factorDe = (ritmo) => (ritmo === RITMOS.RAPIDO ? FACTOR_RAPIDA : 1)

const reparto = (cartas, factor, cierre) => Math.round(
  ANTES_DEL_REPARTO_MS + cartas * VUELO_REPARTO_MS * factor + cierre,
)

export const esperaPrimerReparto = (cartas, ritmo) => reparto(cartas, factorDe(ritmo), TRAS_PRIMER_REPARTO_MS)
export const esperaSegundoReparto = (cartas, ritmo) => reparto(cartas, factorDe(ritmo), FIN_SEGUNDO_REPARTO_MS * factorDe(ritmo))
export const esperaManoSiguiente = (conRevelacion) => (
  conRevelacion ? RED_REVELACION_MS + LECTURA_TRAS_REVELACION_MS : MANO_SIGUIENTE_MS
)

// MES-PvP 5b · uno a uno, de la Mano al Pie (contrato §6): lo que dura en el cliente cada asiento
// que sigue en la mano. El ritmo escala pausas y vuelos; el arranque y el cierre no, y el cierre es
// siempre el del volteo propio, el peor caso. Los retirados (`null`) no cuentan; el ausente, con 0.
const reponerAsiento = (n) => (n === 0
  ? D_SKIP
  : D_OUT + D_PAUSE + D_IN + D_SEAT_GAP + (n - 1) * (D_OUT_STAG + D_IN_STAG))
export const esperaReposicion = (descartaron, ritmo) => Math.round(
  REPOSICION_ARRANQUE_MS
  + factorDe(ritmo) * descartaron.reduce((suma, n) => (n === null ? suma : suma + reponerAsiento(n)), 0)
  + REPOSICION_CIERRE_MS,
)

// Contrato §6, «Publicidad»: las manos 5, 11, 16, 22, 27, 33, 38, 44…
export const llevaAnuncio = (mano) => mano % 11 === 5 || mano % 11 === 0

export const ESPERA_TURNO_MS = TURN_TIME * 1000
export const ESPERA_BARAJADO_MS = BARAJADO_MS
export const ESPERA_ELECCION_MS = ELECCION_SORTEO_MS
export const ESPERA_VOLTEO_MS = VOLTEO_SORTEO_MS
export const ESPERA_AVISO_SALIDA_MS = AVISO_SALIDA_MS
export const ESPERA_PAUSA_ANUNCIO_MS = PAUSA_ANUNCIO_MS
export const ESPERA_OFERTA_RECARGA_MS = OFERTA_RECARGA_MS
