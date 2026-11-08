// ── MES-PvP L-M 3 · Entre una mano y otra: la recarga PvP y la pausa de anuncio ──────────
// Ficha AJILEI_MES-PvP_LM-3_v1.0.md §1 y §3, con las decisiones de Victor en el STOP-L. Puro, sin
// React ni DOM. Del trozo PvP (las capas de la partida y el imitado): la transición entre manos
// tiene su núcleo aparte, en el trozo de la mesa (`lib/transicionCore.js`).

import { t } from '../config/textos'
import { montoTexto } from '../config/tapetes'
import { CORTE_VOZ, recortaNombre } from './corteVoz'

// ── §1 · La recarga PvP (Reglas v1.8 §8.1) ──────────────────────────────────
// Un solo monto, `entrada − pila`, nunca por encima de la entrada. Ofrecida sola cuando la pila
// no cubre el ante de la mano siguiente; voluntaria si está por debajo de la entrada. Sin saldo
// para el monto completo, no se recarga.
export const RECARGA_PVP = Object.freeze({ OFRECIDA: 'ofrecida', VOLUNTARIA: 'voluntaria' })

export function recargaPvP({ pila, entrada, ante, saldo }) {
  const monto = Math.max(0, entrada - pila)
  if (monto === 0) return null
  const tipo = pila < ante ? RECARGA_PVP.OFRECIDA : RECARGA_PVP.VOLUNTARIA
  const alcanza = saldo >= monto
  return { tipo, pila, monto, entrada, saldo, alcanza, saldoDespues: alcanza ? saldo - monto : saldo }
}

/**
 * La frase de la tarjeta (Victor, STOP-L): con la pila en 0, «para seguir en la mesa»; con pila,
 * «para volver a {entrada} HC». Sin saldo para el monto, lo dice (y no hay tienda, INV-76).
 */
export function textoTarjeta(oferta) {
  if (!oferta.alcanza) return t('pvp.recarga.sinsaldo')
  const monto = montoTexto(oferta.monto)
  const saldo = montoTexto(oferta.saldoDespues)
  return oferta.pila === 0
    ? t('pvp.recarga.tarjeta.cero', { monto, saldo })
    : t('pvp.recarga.tarjeta', { monto, entrada: montoTexto(oferta.entrada), saldo })
}

/**
 * La voluntaria pedida durante la mano se aplica en la pausa siguiente (Victor, STOP-L): con el
 * monto de ese momento, si la pila sigue por debajo de la entrada y el saldo alcanza. Si no, el
 * pedido se cancela solo: en silencio si la pila ya no está por debajo (no hace falta recargar);
 * diciéndolo si el saldo no alcanza (la tarjeta, con «Tu saldo no alcanza para recargar.»).
 */
export const CANCELA_PEDIDO = Object.freeze({ PILA: 'pila', SALDO: 'saldo' })

export function pedidoEnLaPausa({ pila, entrada, ante, saldo }) {
  const o = recargaPvP({ pila, entrada, ante, saldo })
  if (!o) return { aplica: false, monto: 0, motivo: CANCELA_PEDIDO.PILA }   // ya no hace falta: en silencio
  if (!o.alcanza) return { aplica: false, monto: 0, motivo: CANCELA_PEDIDO.SALDO }   // se dice (la tarjeta)
  return { aplica: true, monto: o.monto, motivo: null }
}

// ── §3 · La pausa de anuncio ────────────────────────────────────────────────
/** Los que siguen en el anuncio, sin el propio (índice 0 de la mesa). */
export const siguenEnAnuncio = (players) => players.filter((p, i) => i !== 0 && p.enAnuncio && !p.abandonado)

export function textoEnAnuncio(players, corte = CORTE_VOZ) {
  const siguen = siguenEnAnuncio(players)
  if (siguen.length === 0) return null
  if (siguen.length === 1) return t('pvp.anuncio.uno', { nombre: recortaNombre(siguen[0].name, corte) })
  return t('pvp.anuncio.varios', { n: siguen.length })
}
