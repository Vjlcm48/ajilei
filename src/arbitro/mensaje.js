// ── MES-PvP · árbitro v1.3 · ¿Puede este asiento mandar un mensaje? ──────────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md §2.3 (ruta B). El mensaje NO es una acción del
// árbitro: no entra en `ACCIONES_ARBITRO`, no toca el estado ni sube la versión. La función
// `partida` lo desvía antes de `jugar`, pregunta aquí con el estado leído, anota el freno de
// 10 s en SQL (`anotar_mensaje`) y lo emite por el canal de la mesa como evento `mensaje`.
//
// PURO. El asiento sale del uid del token, nunca del cuerpo. El freno no se mira aquí: vive en
// `partida_asientos.ultimo_mensaje` y lo impone `anotar_mensaje`, que es atómico.

import { CLAVES_MENSAJE, esClaveMensaje } from '../config/mensajes.js'
import { MOTIVOS as M } from './motivos.js'
import { partidaTerminada } from './partida.js'

export { CLAVES_MENSAJE }

/**
 * Las comprobaciones, en su orden; la primera que falla decide el motivo.
 * Quien ya cobró (salió con su dinero) ya no tiene asiento en la mesa.
 *
 * @param {object} estado el de la partida, tal como se leyó
 * @param {string|null} uid el del token
 * @param {unknown} clave la del cuerpo
 * @returns {{ ok: true, asiento: number } | { ok: false, motivo: string }}
 */
export function puedeMandarMensaje(estado, uid, clave) {
  const no = (motivo) => ({ ok: false, motivo })
  if (!uid) return no(M.NO_AUTENTICADO)
  const asiento = estado.asientos.findIndex((a) => a.uid === uid)
  if (asiento < 0) return no(M.NO_ES_DE_ESTA_MESA)
  if (partidaTerminada(estado)) return no(M.PARTIDA_TERMINADA)
  const a = estado.asientos[asiento]
  if (a.abandonado) return no(M.ASIENTO_ABANDONADO)
  if (a.cobrado !== null && a.cobrado !== undefined) return no(M.NO_ES_DE_ESTA_MESA)
  if (!esClaveMensaje(clave)) return no(M.CLAVE_DESCONOCIDA)
  // Durante su anuncio no ve la mesa: tampoco habla en ella (Reglas v1.9 §8.6).
  if (a.enAnuncio) return no(M.EN_ANUNCIO)
  return { ok: true, asiento }
}
