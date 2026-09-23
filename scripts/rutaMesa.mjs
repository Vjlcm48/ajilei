// ── APU-1 1e · LA RUTA A LA MESA, EN UN SOLO SITIO ─────────────────────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §1.5 y §2.5.
//
// ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
// Llegar a la mesa contra IAS son ahora CINCO clics —lobby, reto, jugadores,
// apuesta, entrada— y el último no existía antes de esta tanda. Cuando 1e fue a
// cambiar la ruta se contaron VEINTIDÓS arneses con su propia copia de los tres
// clics viejos, cada uno colgando de `.nivel-grid` y `.mode-stake-grid`. Ésa es
// exactamente la avería que NIV-UI ya pagó una vez («el arnés medía una pantalla
// que la app había dejado de mostrar y nadie se enteró hasta EMB-1»), y el
// remedio que `diagDSK` escribió entonces —`recorrerRuta`, UN sitio que sepa
// cómo se llega a la mesa— se quedó dentro de `diagDSK`, así que no protegió a
// nadie más.
//
// Este módulo saca ese sitio fuera. Un arnés que lo importe sobrevive al próximo
// cambio de pantalla sin tocarse.
//
// ── SE ELIGE POR CONTRATO, NUNCA POR RÓTULO ────────────────────────────────
// `data-accion` en las cinco filas y el índice DERIVADO de `config/niveles.js`
// para el reto y la apuesta. Los `id` son contrato del producto («no se
// renombran nunca»); los nombres son copy que Victor declaró provisional, y
// además salen de un diccionario desde IDI-0 — un arnés colgado del texto se
// rompe con el primer `textos.en.js`.

import { NIVELES, apuestasDe } from '../src/config/niveles.js'

// La entrada por defecto del arnés: el MEDIO (20× desde 1f-A4; era 15× cuando
// 1c-2 midió V2 y V3 con él). Se elige por la misma razón de entonces: es la
// profundidad intermedia, y las capturas enseñan una mesa con la misma forma
// que las bandas del banco. El piso (10×) deja mesas que mueren en pocas manos
// y el techo (50×) las alarga de más.
export const ENTRADA_ARNES = 'medio'

/**
 * Del lobby a la mesa, por la ruta de verdad.
 *
 * @param {import('playwright-core').Page} page
 * @param {number} n        jugadores en la mesa (2–5)
 * @param {string} nivel    id de reto (`basico` | `avanzado` | `pro`)
 * @param {number} stakeIdx índice dentro de `apuestasDe(nivel)` (0–3)
 * @param {string} entrada  `piso` | `medio` | `techo`
 */
export async function recorrerRuta(page, n, nivel, stakeIdx, entrada = ENTRADA_ARNES) {
  const iNivel = NIVELES.findIndex((x) => x.id === nivel)
  if (iNivel < 0) throw new Error(`rutaMesa: reto desconocido "${nivel}"`)
  const montos = apuestasDe(nivel)
  if (!montos[stakeIdx]) throw new Error(`rutaMesa: apuesta ${stakeIdx} fuera de ${nivel}`)

  // LOB-1 · el CTA del lobby, por contrato de marcado y no por rótulo.
  await page.waitForSelector('main.lobby [data-accion="jugar-ia"]')
  await page.click('[data-accion="jugar-ia"]')

  // Las cuatro filas, EN CASCADA: cada una habilita la siguiente, así que no se
  // puede pulsar la tercera antes de que la segunda exista habilitada. Se espera
  // a que el chip esté vivo —`:not([disabled])`— y no sólo a que esté en el DOM:
  // la fila entera se pinta desde el primer render, apagada.
  await pulsarChip(page, 'reto', iNivel + 1)
  await pulsarChip(page, 'jugadores', n - 1)          // 2·3·4·5 → 1º·2º·3º·4º
  await pulsarChip(page, 'apuesta', stakeIdx + 1)
  await pulsarChip(page, 'entrada', ORDEN_ENTRADA.indexOf(entrada) + 1)

  await page.click('[data-accion="cta"]')
  await page.waitForSelector('.game-table')

  return { nivel, stakeIdx, monto: montos[stakeIdx], jugadores: n, entrada }
}

// El orden de los chips de la cuarta fila, tal como los devuelve
// `retarCore.opcionesEntrada`. «Otra…» es el cuarto y no lo usa la ruta: abre un
// contador y el arnés quiere un monto con nombre.
export const ORDEN_ENTRADA = ['piso', 'medio', 'techo', 'otra']

async function pulsarChip(page, accion, nth) {
  const vivo = `[data-accion="${accion}"]:not([disabled])`
  await page.waitForSelector(vivo)
  await page.click(`[data-accion="${accion}"]:nth-of-type(${nth})`)
}

/** `recorrerRuta` con el `goto` delante, que es lo que quiere casi todo el mundo. */
export async function irALaMesa(page, base, n, nivel, stakeIdx, entrada = ENTRADA_ARNES, sufijoUrl = '') {
  await page.goto(`${base}${sufijoUrl}`, { waitUntil: 'networkidle' })
  const usada = await recorrerRuta(page, n, nivel, stakeIdx, entrada)
  await page.mouse.move(5, 5)   // neutraliza el hover de las cartas
  return usada
}
