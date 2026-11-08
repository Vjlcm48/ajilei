// ── MOT-1 1b · Los motivos de rechazo ───────────────────────────────────────
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §3. Son cadenas literales y son
// contrato: la A es la de `pozos.js`, reexportada; la B es la del árbitro. Es la
// lista que leerá el cliente en MES-PvP.

import { MOTIVOS as MOTIVOS_APUESTA } from '../engine/pozos.js'

export { MOTIVOS_APUESTA }

export const MOTIVOS_ARBITRO = Object.freeze({
  NO_AUTENTICADO:          'no_autenticado',
  NO_ES_DE_ESTA_MESA:      'no_es_de_esta_mesa',
  PARTIDA_TERMINADA:       'partida_terminada',
  ASIENTO_ABANDONADO:      'asiento_abandonado',
  VERSION_VIEJA:           'version_vieja',
  VENCIMIENTO_NO_CUMPLIDO: 'vencimiento_no_cumplido',
  NO_PARTICIPA:            'no_participa',
  YA_ELIGIO:               'ya_eligio',
  CARTA_INVALIDA:          'carta_invalida',
  YA_DESCARTO:             'ya_descarto',
  DESCARTE_INVALIDO:       'descarte_invalido',
  YA_VOLVIO:               'ya_volvio',
  // v1.3 · el mensaje de la mesa (ruta B: fuera de `ACCIONES_ARBITRO`, `arbitro/mensaje.js`).
  CLAVE_DESCONOCIDA:       'clave_desconocida',
  EN_ANUNCIO:              'en_anuncio',
  FRENO:                   'freno',
})

export const MOTIVOS = Object.freeze({ ...MOTIVOS_APUESTA, ...MOTIVOS_ARBITRO })
