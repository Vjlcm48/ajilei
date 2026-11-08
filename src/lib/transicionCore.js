// ── MES-PvP L-M 3 · §2 · La transición entre manos ───────────────────────────────────────
// Ficha AJILEI_MES-PvP_LM-3_v1.0.md §2; variante b, elegida por Victor (STOP-L): las cartas se
// desvanecen en su sitio y solo se desliza la marca de Mano. Las dos mesas. Puro, sin React ni
// DOM, y SOLO del trozo de la mesa (lo importan `GameTable` y `TransicionMano`): si lo importara
// también el trozo PvP, saldría un trozo compartido más en el mapa de la entrada y subiría
// `1.8b` (INV-84; medido en el STOP-L: +0,05 KiB). Por eso el corte de 10 va aquí copiado de
// `lib/corteVoz.js`, que es del trozo PvP.

export const RECOGE_MS = 380        // las cartas se desvanecen
export const DESLIZA_MS = 480       // la marca de Mano va a su asiento nuevo
export const PASTILLA_MS = 1900     // «Mano 7 · Es Mano Ana»
// Lo que «Siguiente mano» esperaba hasta hoy antes de `beginHand` (el borrado de 300 ms).
export const ESPERA_SIGUIENTE_HOY_MS = 300
export const CORTE_PASTILLA = 10    // = `CORTE_VOZ` (`lib/corteVoz.js`); lo ancla la prueba

/** Lo que espera «Siguiente mano» contra las IAS: la recogida entera, nunca menos que hoy. */
export const esperaSiguienteMano = () => Math.max(ESPERA_SIGUIENTE_HOY_MS, RECOGE_MS)

const corta = (nombre) => (nombre.length <= CORTE_PASTILLA ? nombre : `${nombre.slice(0, CORTE_PASTILLA).trimEnd()}…`)

/**
 * «Mano 7 · Es Mano Ana» · «Mano 7 · Eres Mano». Desde la mano 2: la 1 de PvP la anuncia el
 * sorteo. Los nombres van cortados a 10, también contra las IAS.
 */
export function textoPastilla({ handCount, manoIndex, players }) {
  if (!(handCount >= 2) || manoIndex === null || manoIndex === undefined || !players?.[manoIndex]) return null
  if (manoIndex === 0) return `Mano ${handCount} · Eres Mano`
  return `Mano ${handCount} · Es Mano ${corta(String(players[manoIndex].name))}`
}

/** En PvP la recogida cae `RECOGE_MS` antes de que venza la pausa entre manos (hora local). */
export function recogerEnPvP(vencimiento, desfase = 0) {
  return vencimiento?.clase === 'mano_siguiente' ? vencimiento.hora - desfase - RECOGE_MS : null
}
