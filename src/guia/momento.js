// ── TUT-1 T4 · El momento de un capítulo ────────────────────────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.1; normativo AJILEI_Tutorial_v1.4.md §2.1
// («Capítulos de mesa (1–6): sobre el modo guion, con la mesa de la guiada
// congelada en el momento del paso»). Módulo PURO, sin React ni DOM.
//
// QUÉ ES UN MOMENTO. La partida guiada jugada hasta el paso `paso` de la mano
// `mano`, con el MOTOR REAL: las manos anteriores enteras y la de ahora hasta su
// parada (`guiaManos.paradaDePaso`), por la misma vía que el buscador y la prueba
// de las tres manos (`jugarMano`: el guion de los rivales, la escalera del humano
// y los órdenes del buscador). Nada se escribe a mano: si la guiada cambia, el
// momento cambia con ella, y `guiaManos.test.js` sigue vigilando los órdenes.
//
// R-2 DE LA FASE 0. Reproducir una mano arma su orden (`setRng`) y el barajado lo
// consume en el acto, dentro de esta función; aun así, `soltarMazo` devuelve el azar
// de verdad al salir, pase lo que pase. El capítulo lo vuelve a soltar al cerrarse.
import { estadoInicial, jugarMano, paradaDePaso, ORDENES } from '../lib/guiaManos'
import { armarOrden, soltarMazo } from '../lib/mazoDado'
import { toggleDiscard } from '../engine/gameEngine'

/** ¿La mano está en la parada? (el turno del humano se cuenta al llegar). */
function enParada(g, r, parada) {
  if (g.phase !== parada.fase) return false
  if (parada.fase === 'DISCARD') return true
  return g.activePlayerIndex === 0 && r.turnos[g.phase] + 1 === parada.turno
}

/**
 * El estado de la mesa guiada en el paso `paso` de la mano `mano` (normativo §1.4).
 * @param {1|2|3} mano
 * @param {number} paso
 * @returns {object} el estado del motor, listo para `GameTable` (`guion.estadoInicial`)
 */
export function momentoGuiada(mano, paso) {
  const parada = paradaDePaso(mano, paso)
  try {
    let g = estadoInicial()
    for (let m = 1; m < mano; m++) g = jugarMano(g, m, ORDENES[m - 1], armarOrden).pago
    if (parada.fase === 'WAITING') return g
    const r = jugarMano(g, mano, ORDENES[mano - 1], armarOrden, parada.fase === 'PAYOUT' ? null : (x, info) => enParada(x, info, parada))
    let e = r.momento ?? r.pago
    if (parada.fase !== 'PAYOUT' && !r.momento) throw new Error(`momentoGuiada: la mano ${mano} no llegó al paso ${paso}`)
    if (parada.seleccion) for (const i of parada.seleccion(e)) e = toggleDiscard(e, i)
    return e
  } finally {
    soltarMazo()
  }
}
