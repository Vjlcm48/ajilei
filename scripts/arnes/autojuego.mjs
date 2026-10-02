// ── arnes/autojuego.mjs · ARN-3b · el bucle de autojuego, uno solo ───────────
// Rector: AJILEI_ARN-3b_v1.0.md §0 D2. Hasta ARN-3b cada modo de `diagDSK`
// llevaba su copia del mismo bucle —esperar, mirar, pulsar Pasar/Igualar/
// Apostar— y cada copia envejeció distinto: solo `a1` y `a2` contestaban la
// recarga (H-10), ninguna pulsaba All-in, solo `a1` sabía que la mesa podía
// desaparecer, y ninguna que podía reducirse (B4). `m1` se rompió por eso (H-1).
//
// `jugarMano(page, juego, opciones)` juega UNA mano y devuelve si cerró y, si
// no, por qué. El muestreo sigue siendo del modo: el bucle llama a `muestrear`
// en los mismos ticks y con las mismas etiquetas que el bucle viejo, para que
// las líneas base no se muevan (D9). Lo que decide —qué pulsar, cuándo la mesa
// se redujo, por qué no cerró— es puro y está en `juego.mjs`.
import { elegirAccion, vigilarFotograma, causaSinCerrar } from './juego.mjs'

export { nuevoJuego, resumenJuego, separarReducida, estadoCelda, reintentar, ESTADO, INTENTOS_COBERTURA } from './juego.mjs'

const ULTIMOS = 8

const clicSi = async (page, sel) => {
  const b = page.locator(sel).first()
  if (await b.count() && await b.isVisible().catch(() => false)) {
    await b.click().catch(() => {}); return true
  }
  return false
}

// Una sola lectura del DOM por tick: lo que el bucle necesita para decidir y
// lo que vuelca si la mano no cierra (D5).
const LEER = () => {
  const vis = (e) => !!e && e.getClientRects().length > 0
  const presente = !!document.querySelector('.player-zone')
  const tarjeta = document.querySelector('[data-accion="recarga"]')
  const recarga = {
    tarjeta: !!tarjeta,
    burbuja: !!document.querySelector('[data-accion="recarga-burbuja"]'),
    motivo: tarjeta?.dataset.motivo ?? document.querySelector('.game-table')?.dataset.recMotivo ?? null,
  }
  const botones = [...document.querySelectorAll('.btn')].filter(vis)
    .map((b) => b.textContent.trim() + (b.disabled ? ' (off)' : ''))
  const acciones = [...document.querySelectorAll('.action-buttons [data-accion]')]
    .filter((b) => vis(b) && !b.disabled).map((b) => b.dataset.accion)
  const paneles = [...document.querySelectorAll('.opp-panel')]
  const eliminando = paneles.filter((p) => p.classList.contains('opp-eliminating')).length
  const pensando = [...document.querySelectorAll('.action-area.thinking')]
    .map((e) => e.textContent.trim()).find((t) => /está pensando/.test(t)) ?? null
  const retirados = paneles
    .filter((p) => /Se retiró/.test(p.querySelector('.opp-status')?.textContent ?? ''))
    .map((p) => p.querySelector('.opp-name')?.textContent?.trim() ?? '?')
  // la vía legacy del rival de mesa 2 (`.ai-zone`), por si es la que pinta
  for (const s of document.querySelectorAll('.ai-zone .opp-status')) if (/Se retiró/.test(s.textContent)) retirados.push('IA (ai-zone)')
  return {
    presente, recarga, botones, acciones, pensando, retirados, eliminando,
    vivos: presente ? 1 + paneles.length - eliminando : null,
    gameOver: !!document.querySelector('.game-over-screen'),
  }
}

/** Lee el estado de la mesa (exportado para los modos que lo quieran ver). */
export const leerMesa = (page) => page.evaluate(LEER)

/**
 * Contesta la recarga si está en pantalla. Tarjeta: «Sí» si se puede, si no
 * «No» (la disciplina de C-0.5: estos modos quieren la mesa viva). Burbuja: se
 * toca, que es el gesto del jugador; la tarjeta la contesta el tick siguiente.
 * Devuelve qué hizo, o null.
 */
export async function contestarRecargaComun(page) {
  return page.evaluate(() => {
    if (document.querySelector('[data-accion="recarga"]')) {
      const si = document.querySelector('[data-accion="recarga-si"]')
      if (si && !si.disabled) { si.click(); return 'si' }
      const no = document.querySelector('[data-accion="recarga-no"]')
      if (no) { no.click(); return 'no' }
      return null
    }
    const b = document.querySelector('[data-accion="recarga-burbuja"]')
    if (b) { b.click(); return 'burbuja' }
    return null
  })
}

/**
 * Juega UNA mano. Opciones (todas con el valor de los bucles de línea base):
 *   mano        número de mano, para las etiquetas `h{mano}t{i}`
 *   tick        espera por vuelta (230 ms)
 *   max         tope de vueltas (340)
 *   cada        muestrea cuando `i % cada === 0` (2; 0 = nunca)
 *   muestrear   async (tag) => fotograma | undefined — el snap del modo
 *   finTag      etiqueta del fotograma de cierre (por defecto `h{mano}t{i}f`)
 *   muestraFinal  tomar ese fotograma de cierre (true; `o1` no lo tomaba)
 *   trasMuestra async (i) — gancho tras muestrear (f1: el descarte)
 *   trasAccion  async (i, accion) — gancho tras pulsar (f1/a2: el rechequeo)
 *   descarte    async () — en vez de «Sin descartar» (vuelo descarta de verdad)
 *   iniciar     pulsar «Iniciar mano» al empezar (true)
 *   sinPila     'retirarse' | 'allin'
 *   esperar     async (ms) — por defecto page.waitForTimeout
 * Devuelve `{ cerrada, causa, ticks, ultimos }`. `causa` y `ultimos` solo si
 * no cerró: es el volcado de D5 (nunca un `SINCERRAR` mudo).
 */
export async function jugarMano(page, juego, opc = {}) {
  const {
    mano = juego.manos, tick = 230, max = 340, cada = 2, muestrear = null, finTag = null, muestraFinal = true,
    trasMuestra = null, trasAccion = null, descarte = null, iniciar = true, sinPila = 'retirarse',
    esperar = (ms) => page.waitForTimeout(ms),
  } = opc
  juego.manos++
  if (iniciar) await clicSi(page, 'button:has-text("Iniciar mano")')
  const ultimos = []
  const marcar = (f) => { if (f && juego.reducida) { f.mesaReducida = true; juego.framesReducida++ } return f }
  let i = 0
  for (; i < max; i++) {
    await esperar(tick); await page.mouse.move(5, 5)
    const st = await page.evaluate(LEER)
    ultimos.push({ tag: `h${mano}t${i}`, presente: st.presente, recarga: st.recarga, botones: st.botones, acciones: st.acciones, pensando: st.pensando })
    if (ultimos.length > ULTIMOS) ultimos.shift()
    // H-10 · la recarga se contesta SIEMPRE, en todos los modos.
    if (st.recarga.tarjeta || st.recarga.burbuja) {
      if (await contestarRecargaComun(page)) { await esperar(260); continue }
    }
    if (!st.presente) { juego.ausente = true; break }
    vigilarFotograma(juego, st, `h${mano}t${i}`)
    if (muestrear && cada && i % cada === 0) marcar(await muestrear(`h${mano}t${i}`))
    if (trasMuestra) await trasMuestra(i)
    if (await page.locator('button:has-text("Siguiente mano")').isVisible().catch(() => false)) {
      if (muestrear && muestraFinal) marcar(await muestrear(finTag ? finTag(i) : `h${mano}t${i}f`))
      juego.cerradas++
      return { cerrada: true, ticks: i + 1 }
    }
    const accion = elegirAccion(st.acciones, { sinPila })
    let pulsada = null
    if (accion && await clicSi(page, `.action-buttons [data-accion="${accion}"]`)) {
      pulsada = accion
      if (accion === 'allin' || accion === 'retirarse') juego.sinPila++
    }
    if (trasAccion) await trasAccion(i, pulsada)
    if (descarte) await descarte()
    else await clicSi(page, 'button:has-text("Sin descartar")')
  }
  const causa = juego.ausente ? 'mesa-ausente' : causaSinCerrar(ultimos)
  juego.sinCerrar.push({ mano, causa, ticks: i, ultimos })
  return { cerrada: false, causa, ticks: i, ultimos }
}

/**
 * Pulsa «Siguiente mano», espera y comprueba que la mesa sigue. Devuelve false
 * si no se pudo pulsar o si la mesa ya no está (bancarrota, fin de partida).
 */
export async function siguienteMano(page, juego, { espera = 1500, esperar = (ms) => page.waitForTimeout(ms) } = {}) {
  if (!await clicSi(page, 'button:has-text("Siguiente mano")')) return false
  await esperar(espera); await page.mouse.move(5, 5)
  if (!await page.evaluate(() => !!document.querySelector('.player-zone'))) { juego.ausente = true; return false }
  return true
}

/** Marca un fotograma suelto (fuera de `jugarMano`) si la mesa ya se redujo. */
export function marcarReducida(juego, f) {
  if (f && juego.reducida) { f.mesaReducida = true; juego.framesReducida++ }
  return f
}
