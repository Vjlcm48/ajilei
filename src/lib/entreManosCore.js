// ── MES-PvP L-M 3 · Entre una mano y otra: la recarga PvP y la pausa de anuncio ──────────
// Ficha AJILEI_MES-PvP_LM-3_v1.0.md §1 y §3, con las decisiones de Victor en el STOP-L. Puro, sin
// React ni DOM. Del trozo PvP (las capas de la partida y el imitado): la transición entre manos
// tiene su núcleo aparte, en el trozo de la mesa (`lib/transicionCore.js`).

import { t } from '../config/textos'
import { montoTexto } from '../config/tapetes'
import { LECTURA_TRAS_REVELACION_MS, MANO_SIGUIENTE_MS, OFERTA_RECARGA_MS, PAUSA_ANUNCIO_MS } from '../config/esperas'
import { CORTE_VOZ, recortaNombre } from './corteVoz'

// Literales de la vista del árbitro, sin importarlo (INV-84); `entreManosCore.test.js` los ancla.
const FASE_SORTEO = 'SORTEO'
const FASE_FIN = 'GAME_OVER'
const FASE_PAGO = 'PAYOUT'
const RECARGA_VISTA_DECIDE = 'decide'

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

// ── Árbitro v1.3-b · la capa, desde la vista real ───────────────────────────
// El pedido se aplica (o se cancela) en el árbitro al cerrarse la mano: aquí solo se lee. Lo
// que pinta `screens/RecargaPvP.jsx` sale de la vista del árbitro (la del imitado tiene la misma
// forma) y del saldo de la billetera, que no va en la vista (D6).
//   · lo público de cada asiento: `recarga` = `'decide'` (en la pausa) · `'fuera'` (se salta la
//     mano) · `null`; sentado fuera va `folded` y sin cartas;
//   · lo privado: `vista.recarga` = `{ monto, oferta, pedida, cancelada, recargas }`.
export const CLASES_PAUSA_RECARGA = Object.freeze({
  MANO_SIGUIENTE: 'mano_siguiente', PAUSA_ANUNCIO: 'pausa_anuncio', OFERTA_RECARGA: 'oferta_recarga',
})

// Lo que dura cada pausa, en segundos: el anillo de la burbuja.
const TOTAL_SEG = Object.freeze({
  [CLASES_PAUSA_RECARGA.MANO_SIGUIENTE]: Math.round(MANO_SIGUIENTE_MS / 1000),
  [CLASES_PAUSA_RECARGA.PAUSA_ANUNCIO]: Math.round(PAUSA_ANUNCIO_MS / 1000),
  [CLASES_PAUSA_RECARGA.OFERTA_RECARGA]: Math.round(OFERTA_RECARGA_MS / 1000),
})

/**
 * @param {object|null} vista la del árbitro para este asiento (sin rotar)
 * @param {{ saldo: number, entrada: number }} billetera el saldo de la billetera y la entrada de la mesa
 * @returns {null | { oferta: object|null, fuera: boolean, pausa: boolean, enMano: boolean, pedida: boolean,
 *   vence: number|null, revelacion: boolean, totalSeg: number, lecturaMs: number, espera: string|null,
 *   cancelada: string|null, mano: number }} `null` sin recarga (R-4, o quien ya no está en la mesa)
 */
export function recargaDeVista(vista, { saldo, entrada }) {
  const privada = vista?.recarga
  if (!privada || vista.phase === FASE_SORTEO || vista.phase === FASE_FIN) return null
  const yo = vista.players[vista.asiento]
  if (yo.abandonado || yo.eliminated || yo.cobrado !== null) return null
  const clase = vista.vencimiento?.clase ?? null
  const pausa = vista.phase === FASE_PAGO && Object.hasOwn(TOTAL_SEG, clase)
  // Sentado fuera: se salta la mano (o se la saltó, y decide en la pausa). Sin cartas.
  const fuera = yo.recarga !== null && yo.folded && yo.numCartas === 0
  const pila = entrada - privada.monto
  const cruda = privada.monto > 0 ? recargaPvP({ pila, entrada, ante: 0, saldo }) : null
  const oferta = cruda && { ...cruda, tipo: privada.oferta ? RECARGA_PVP.OFRECIDA : RECARGA_PVP.VOLUNTARIA }
  // La retención: la mesa espera a quien decide (§8.1, «Fin de partida»).
  const decide = clase === CLASES_PAUSA_RECARGA.OFERTA_RECARGA && !privada.oferta
    ? vista.players.find((p, i) => i !== vista.asiento && p.recarga === RECARGA_VISTA_DECIDE) : null
  return {
    oferta,
    fuera,
    pausa,
    enMano: !pausa && !fuera,
    pedida: privada.pedida,
    vence: pausa ? vista.vencimiento.hora : null,
    revelacion: clase === CLASES_PAUSA_RECARGA.MANO_SIGUIENTE && !!vista.resultado?.revelacion,
    totalSeg: TOTAL_SEG[clase] ?? 0,
    lecturaMs: LECTURA_TRAS_REVELACION_MS,
    espera: decide?.name ?? null,
    // La tarjeta de saldo insuficiente se abre una vez por cancelación (la mano la distingue).
    cancelada: privada.cancelada ? `${privada.cancelada.motivo}:${privada.cancelada.mano}` : null,
    mano: vista.handCount,
  }
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
