// ── MOT-1 1b · Cuánto dura cada espera ──────────────────────────────────────
// Normativo: contrato §6. El ritmo escala el vuelo del reparto y las esperas del
// segundo reparto, y nada más.

import {
  ANTES_DEL_REPARTO_MS, BARAJADO_MS, ELECCION_SORTEO_MS, FACTOR_RAPIDA, FIN_SEGUNDO_REPARTO_MS,
  MANO_SIGUIENTE_MS, REVELACION_MS, TRAS_PRIMER_REPARTO_MS, TURN_TIME, VOLTEO_SORTEO_MS,
  VUELO_REPARTO_MS,
} from '../config/esperas.js'
import { CARTAS_POR_ASIENTO } from './sorteo.js'

export const CLASES = Object.freeze({
  REPARTO_SORTEO:  'reparto_sorteo',
  ELECCION_SORTEO: 'eleccion_sorteo',
  VOLTEO_SORTEO:   'volteo_sorteo',
  BARAJADO:        'barajado',
  REPARTO:         'reparto',
  TURNO:           'turno',
  DESCARTE:        'descarte',
  MANO_SIGUIENTE:  'mano_siguiente',
})

export const RITMOS = Object.freeze({ NORMAL: 'normal', RAPIDO: 'rapido' })

export const factorDe = (ritmo) => (ritmo === RITMOS.RAPIDO ? FACTOR_RAPIDA : 1)

const reparto = (cartas, factor, cierre) => Math.round(
  ANTES_DEL_REPARTO_MS + cartas * VUELO_REPARTO_MS * factor + cierre,
)

export const esperaPrimerReparto = (cartas, ritmo) => reparto(cartas, factorDe(ritmo), TRAS_PRIMER_REPARTO_MS)
export const esperaSegundoReparto = (cartas, ritmo) => reparto(cartas, factorDe(ritmo), FIN_SEGUNDO_REPARTO_MS * factorDe(ritmo))
export const esperaManoSiguiente = (conRevelacion) => (conRevelacion ? REVELACION_MS : 0) + MANO_SIGUIENTE_MS

// El sorteo se reparte por oleadas, una carta a cada asiento a la vez: cinco vuelos, sean
// cuantos sean los asientos, y siempre con el factor rápido.
export const ESPERA_REPARTO_SORTEO_MS = reparto(CARTAS_POR_ASIENTO, FACTOR_RAPIDA, TRAS_PRIMER_REPARTO_MS)
export const ESPERA_TURNO_MS = TURN_TIME * 1000
export const ESPERA_BARAJADO_MS = BARAJADO_MS
export const ESPERA_ELECCION_MS = ELECCION_SORTEO_MS
export const ESPERA_VOLTEO_MS = VOLTEO_SORTEO_MS
