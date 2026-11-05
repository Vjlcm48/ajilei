// ── MOT-1 1b · Cuánto dura cada espera ──────────────────────────────────────
// Normativo: contrato §6. El ritmo escala el vuelo del reparto y las esperas del
// segundo reparto, y nada más. La reposición, el aviso y las pausas no los escala.

import {
  ANTES_DEL_REPARTO_MS, AVISO_SALIDA_MS, BARAJADO_MS, ELECCION_SORTEO_MS, FACTOR_RAPIDA,
  FIN_SEGUNDO_REPARTO_MS, LECTURA_TRAS_REVELACION_MS, MANO_SIGUIENTE_MS, PAUSA_ANUNCIO_MS,
  RED_REVELACION_MS, REPOSICION_SIN_CARTAS_MS, TRAS_PRIMER_REPARTO_MS, TURN_TIME, VOLTEO_SORTEO_MS,
  VUELO_REPARTO_MS,
} from '../config/esperas.js'
import { CARTAS_POR_ASIENTO } from './sorteo.js'

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

// Todos reponen a la vez: la duran las cartas de quien más descartó (contrato §6).
export const esperaReposicion = (mayorDescarte) => (
  mayorDescarte > 0 ? reparto(mayorDescarte, 1, TRAS_PRIMER_REPARTO_MS) : REPOSICION_SIN_CARTAS_MS
)

// Contrato §6, «Publicidad»: las manos 5, 11, 16, 22, 27, 33, 38, 44…
export const llevaAnuncio = (mano) => mano % 11 === 5 || mano % 11 === 0

// El sorteo se reparte por oleadas, una carta a cada asiento a la vez: cinco vuelos, sean
// cuantos sean los asientos, y siempre con el factor rápido.
export const ESPERA_REPARTO_SORTEO_MS = reparto(CARTAS_POR_ASIENTO, FACTOR_RAPIDA, TRAS_PRIMER_REPARTO_MS)
export const ESPERA_TURNO_MS = TURN_TIME * 1000
export const ESPERA_BARAJADO_MS = BARAJADO_MS
export const ESPERA_ELECCION_MS = ELECCION_SORTEO_MS
export const ESPERA_VOLTEO_MS = VOLTEO_SORTEO_MS
export const ESPERA_AVISO_SALIDA_MS = AVISO_SALIDA_MS
export const ESPERA_PAUSA_ANUNCIO_MS = PAUSA_ANUNCIO_MS
