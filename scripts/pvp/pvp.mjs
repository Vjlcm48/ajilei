// ── MES-PvP 3 · `diagDSK pvp` · la mesa contra personas, sobre el árbitro imitado ─────────
// Ficha: AJILEI_MES-PvP_Fase1-3_v1.0.md §3.6. Diagnóstico: informe de la Fase 0, §I.2.
// Contra 5173 con bypass: `?pvp=<escena>&n=&asiento=&nombres=` monta `PartidaPvP` con el
// árbitro real en memoria (`src/dev/partidaImitada.js`), sin servidor.
//
// Por celda (mesa 2–5 × 412×915, 915×412, 1366×768, 1920×1080 y la tableta 1024×768), desde
// el último asiento, para que la rotación trabaje:
//   · rotación: el panel del asiento i de la mesa nombra al jugador real (i + asiento) % n;
//   · O1: un paso de un rival (otra frase, otro rótulo) no mueve la maqueta;
//   · piso táctil de 40 en las pantallas táctiles: cada tocable visible, con su zona ampliada
//     (`::after`). En escritorio no hay dedo, y la mesa de las IAS tiene ahí los mismos botones;
//   · tinta: los textos de la rama PvP (rótulos, línea de acción) por encima de 4,5, y
//     ningún `⟦clave⟧` sin texto en toda la pantalla;
//   · `data-clavada` en 0.
// Además, sin veredicto (§3.5, lo decide la lámina L-M): 15 «W» en el óvalo (crónica y
// resultado), `.opp-name` y `.ai-name`, en 412×915 y 915×412.
// Y la reposición hecha desde la mesa (cierre de la 3, hallazgo 5): se marcan dos cartas, se
// descarta, la mesa repone, y ninguna carta queda levantada. Capturas en `capturas-dsk/`.

import { mkdirSync } from 'node:fs'
import { PISO_WCAG, TEXTOS, fotosTinta, peorFondo } from '../arnes/tinta.mjs'

const VIEWPORTS = [
  { id: '412x915', w: 412, h: 915, movil: true },
  { id: '915x412', w: 915, h: 412, movil: true },
  { id: '1366x768', w: 1366, h: 768, movil: false },
  { id: '1920x1080', w: 1920, h: 1080, movil: false },
  { id: 'tableta-1024x768', w: 1024, h: 768, movil: true },
]
const MESAS = [2, 3, 4, 5]
const NOMBRES = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli']   // los de `partidaImitada.js`
const PISO_TACTIL = 40
const TOLERANCIA_O1 = 0.5

const abrir = (browser, vp) => browser.newPage({
  viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}),
})

async function aEscena(page, base, { escena, n, asiento, largo = false }) {
  await page.goto(`${base}/?pvp=${escena}&n=${n}&asiento=${asiento}${largo ? '&nombres=largo' : ''}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-clavada]', { timeout: 15000 })
  await page.mouse.move(2, 2)
  await page.waitForTimeout(600)
}

// ── Lo que se mide en la página ─────────────────────────────────────────────
const MEDIR = () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  // La rotación: cada panel con su índice de asiento y su nombre.
  const paneles = [...document.querySelectorAll('[data-coin-target]')]
    .filter((m) => m.dataset.coinTarget !== '0' && m.dataset.coinTarget !== 'pot')
    .map((m) => {
      const raiz = m.closest('.opp-panel, .ai-zone')
      const nombre = raiz?.querySelector('.opp-name, .ai-name')
      return { i: Number(m.dataset.coinTarget), nombre: nombre ? nombre.textContent.trim() : null }
    })
  // La maqueta: las cajas que no deben moverse con un transitorio.
  const anclas = {}
  // Ni `.action-area` ni `.game-message`: cambian a propósito (de «pensando» a la fila de
  // botones; el párrafo, de líneas con la frase). Lo fijo es el óvalo (`.center-zone`), como en `o1`.
  for (const sel of ['.center-zone', '.player-bar', '.pot-box']) {
    const el = document.querySelector(sel)
    if (el) { const r = el.getBoundingClientRect(); anclas[sel] = [r.left, r.top, r.width, r.height] }
  }
  document.querySelectorAll('.opp-panel, .ai-zone').forEach((el, k) => {
    const r = el.getBoundingClientRect(); anclas[`rival${k}`] = [r.left, r.top, r.width, r.height]
  })
  // El piso táctil: la zona efectiva, con el `::after` que la amplía (PAN-1 1b).
  const tocables = [...document.querySelectorAll('button, [role="button"]')]
    .filter(visible)
    .map((el) => {
      const r = el.getBoundingClientRect()
      let w = r.width, h = r.height
      const a = getComputedStyle(el, '::after')
      if (a.content !== 'none' && a.position === 'absolute') {
        const px = (v) => (v.endsWith('px') ? parseFloat(v) : 0)
        w = Math.max(w, w - px(a.left) - px(a.right))
        h = Math.max(h, h - px(a.top) - px(a.bottom))
      }
      return { txt: (el.textContent || el.getAttribute('aria-label') || el.className).toString().trim().slice(0, 30), w, h }
    })
  const raiz = document.querySelector('[data-clavada]')
  return {
    paneles,
    anclas,
    tocables,
    clavada: raiz?.getAttribute('data-clavada') ?? null,
    sinClave: (document.body.textContent.match(/⟦[^⟧]*⟧/g) ?? []).slice(0, 5),
  }
}

// Los textos de la rama PvP, con su tinta: los rótulos de asiento y la línea de la acción.
const ES_PVP = (t) => /\bopp-status\b|\bthinking\b/.test(t.clase)

async function medirTinta(page) {
  const textos = (await page.evaluate(TEXTOS)).filter(ES_PVP)
  if (!textos.length) return []
  const fotos = await fotosTinta(page, 1)
  return textos.map((t) => ({ txt: t.txt, clase: t.clase, ...peorFondo(fotos, t) }))
}

function cambiosDeMaqueta(antes, despues) {
  const fuera = []
  for (const [k, a] of Object.entries(antes)) {
    const b = despues[k]
    if (!b) { fuera.push(`${k}: desaparece`); continue }
    const d = Math.max(...a.map((v, i) => Math.abs(v - b[i])))
    if (d > TOLERANCIA_O1) fuera.push(`${k}: ${Math.round(d * 10) / 10}px`)
  }
  return fuera
}

async function celda(browser, base, vp, n) {
  const asiento = n - 1
  const page = await abrir(browser, vp)
  const out = { celda: `${n}·${vp.id}`, asiento }
  try {
    // Rotación, piso, tinta y clavada en el turno propio (botones a la vista).
    await aEscena(page, base, { escena: 'turno-propio', n, asiento })
    const m = await page.evaluate(MEDIR)
    const esperados = Object.fromEntries(m.paneles.map((p) => [p.i, NOMBRES[(p.i + asiento) % n]]))
    out.rotacion = m.paneles.length === n - 1 && m.paneles.every((p) => p.nombre === esperados[p.i])
    out.paneles = m.paneles
    out.bajos = !vp.movil ? [] : m.tocables.filter((t) => Math.min(t.w, t.h) < PISO_TACTIL - 0.5)
    out.tactil = !vp.movil || (out.bajos.length === 0 && m.tocables.length > 0)
    out.clavada = m.clavada === '0'
    out.sinClave = m.sinClave
    out.tinta = await medirTinta(page)
    out.tintaOk = out.tinta.every((t) => t.contraste === null || t.contraste >= PISO_WCAG) && m.sinClave.length === 0

    // O1 en el turno ajeno: un paso del rival cambia la frase y su rótulo, no la maqueta.
    await aEscena(page, base, { escena: 'turno-ajeno', n, asiento })
    const antes = (await page.evaluate(MEDIR)).anclas
    await page.evaluate(() => window.__pvpImitada.avanzar())
    await page.waitForTimeout(700)
    const despues = await page.evaluate(MEDIR)
    out.movidas = cambiosDeMaqueta(antes, despues.anclas)
    out.o1 = out.movidas.length === 0
    out.ok = out.rotacion && out.tactil && out.clavada && out.tintaOk && out.o1
  } catch (e) {
    out.error = String(e?.message || e).slice(0, 200)
    out.ok = false
  }
  await page.context().close()
  return out
}

// §3.5 · los nombres largos, sin veredicto: cuánto se sale cada caja.
async function nombresLargos(browser, base) {
  const MEDIDA = () => {
    const caja = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        texto: el.textContent.trim().slice(0, 60),
        ancho: Math.round(r.width), visible: Math.round(el.clientWidth), contenido: el.scrollWidth,
        desborda: el.scrollWidth > el.clientWidth + 1, elipsis: cs.textOverflow === 'ellipsis',
        lineas: Math.round(r.height / (parseFloat(cs.lineHeight) || 16)),
      }
    }
    const ovalo = document.querySelector('.game-message')
    const centro = document.querySelector('.center-zone')
    const ro = ovalo?.getBoundingClientRect(), rc = centro?.getBoundingClientRect()
    return {
      ovalo: caja(ovalo),
      ovaloFueraDelCentro: ro && rc ? Math.round(Math.max(0, rc.left - ro.left, ro.right - rc.right) * 10) / 10 : null,
      resultado: caja(document.querySelector('.voz2-texto')),
      recortado: document.querySelector('[data-voz2-recortada="1"]') !== null,
      oppName: caja(document.querySelector('.opp-name')),
      aiName: caja(document.querySelector('.ai-name')),
    }
  }
  const out = []
  for (const vp of VIEWPORTS.slice(0, 2)) {
    for (const [n, escena, que] of [[2, 'turno-ajeno', 'crónica'], [2, 'revelacion', 'resultado'], [5, 'turno-ajeno', 'crónica'], [5, 'revelacion', 'resultado']]) {
      const page = await abrir(browser, vp)
      try {
        await aEscena(page, base, { escena, n, asiento: 0, largo: true })
        if (que === 'crónica') { await page.evaluate(() => window.__pvpImitada.avanzar()); await page.waitForTimeout(700) }
        out.push({ vp: vp.id, n, que, ...(await page.evaluate(MEDIDA)) })
      } catch (e) {
        out.push({ vp: vp.id, n, que, error: String(e?.message || e).slice(0, 160) })
      }
      await page.context().close()
    }
  }
  return out
}

// Cada escena del mando, en una mesa de 3 en 412×915: monta sin errores de página, sin
// `⟦clave⟧`, y cae en su pantalla (`escenaDe`). Lo que las celdas no recorren: el sorteo, el
// anuncio, los finales, la salida con la mesa viva y la partida muerta.
const PANTALLA_DE = (escena) => (
  escena.startsWith('sorteo-') ? '[data-pvp="sorteo"]'
    : escena === 'anuncio-yo' ? '[data-pvp="anuncio"]'
      // Llega con el asiento propio ya abandonado: es quien vuelve, y va al lobby (§3.3).
      : escena === 'final-fuera' ? '.lob-nav-tienda'
        : escena === 'muerta' ? '[data-pvp="muerta"]'
          : escena === 'final-gana' ? '.cel-pantalla, [class*="cel-"]'
            : escena === 'final-pierde' ? '.game-over-screen'
              : '[data-clavada="0"]'
)
const ESCENAS = ['sorteo-baraja', 'sorteo-oleadas', 'sorteo-eleccion', 'sorteo-empate-2', 'sorteo-empate-3', 'sorteo-azar',
  'turno-propio', 'turno-ajeno', 'descarte-espera', 'reposicion', 'revelacion', 'retirada', 'anuncio-yo', 'anuncio-vuelta',
  'ausente', 'abandono', 'aviso-salida', 'final-gana', 'final-pierde', 'final-fuera', 'muerta', 'descarte-propio']

async function escenas(browser, base) {
  const out = []
  for (const escena of ESCENAS) {
    const page = await abrir(browser, VIEWPORTS[0])
    const errores = []
    page.on('pageerror', (e) => errores.push(String(e.message).slice(0, 120)))
    try {
      await page.goto(`${base}/?pvp=${escena}&n=3&asiento=1`, { waitUntil: 'networkidle' })
      const sel = PANTALLA_DE(escena)
      const pantalla = await page.waitForSelector(sel, { timeout: 15000 }).then(() => true, () => false)
      await page.waitForTimeout(400)
      const sinClave = await page.evaluate(() => (document.body.textContent.match(/⟦[^⟧]*⟧/g) ?? []).slice(0, 3))
      out.push({ escena, pantalla, sinClave, errores, ok: pantalla && !sinClave.length && !errores.length })
    } catch (e) {
      out.push({ escena, ok: false, error: String(e?.message || e).slice(0, 160), errores })
    }
    await page.context().close()
  }
  // Y la salida con la mesa viva, de verdad: ✕, «Dejar la mesa», y su pantalla.
  const page = await abrir(browser, VIEWPORTS[0])
  try {
    await aEscena(page, base, { escena: 'turno-propio', n: 3, asiento: 1 })
    await page.click('.btn-leave')
    const aviso = await page.textContent('.leave-modal-sub')
    await page.click('.leave-modal-actions .btn-fold')
    const pantalla = await page.waitForSelector('[data-pvp="fuera"]', { timeout: 8000 }).then(() => true, () => false)
    const texto = pantalla ? (await page.textContent('[data-pvp="fuera"]')).trim() : null
    out.push({ escena: 'abandonar-en-vivo', aviso, texto, ok: pantalla && /abandonado/.test(aviso) })
  } catch (e) {
    out.push({ escena: 'abandonar-en-vivo', ok: false, error: String(e?.message || e).slice(0, 160) })
  }
  await page.context().close()
  out.push(await reposicionDesdeMesa(browser, base))
  return out
}

// ── Las cartas repuestas vuelven a la fila (hallazgo 5 de la prueba de Victor) ───────────
// `reposicion` llega con el descarte de guion, sin tocar la mesa: aquí se hace con la mesa.
// Antes de abrirse la reposición las marcadas siguen arriba (así se ve qué se va); después,
// ninguna levantada. Mesa de 3, desde el asiento 1, en 412×915.
const OUT_DIR = 'capturas-dsk'
async function reposicionDesdeMesa(browser, base) {
  const page = await abrir(browser, VIEWPORTS[0])
  const levantadas = () => page.locator('.player-zone .cards-row .card-selected').count()
  const clase = () => page.evaluate(() => window.__pvpImitada.foto().vista.vencimiento?.clase ?? null)
  try {
    mkdirSync(OUT_DIR, { recursive: true })
    await aEscena(page, base, { escena: 'descarte-propio', n: 3, asiento: 1 })
    const tocables = page.locator('.player-zone .cards-row .card-clickable')
    await tocables.nth(0).click()
    await tocables.nth(2).click()
    const marcadas = await levantadas()
    await page.locator('.player-zone button', { hasText: /^Descartar/ }).click()
    await page.waitForTimeout(400)
    const esperando = await levantadas()
    await page.screenshot({ path: `${OUT_DIR}/pvp_reposicion_antes_412x915.png` })
    for (let k = 0; k < 10 && (await clase()) !== 'reposicion'; k++) {
      await page.evaluate(() => window.__pvpImitada.avanzar())
      await page.waitForTimeout(150)
    }
    const abierta = (await clase()) === 'reposicion'
    // Los vuelos de dos cartas duran ~1,6 s; la reposición imitada no vence sola.
    await page.waitForTimeout(2500)
    const despues = await levantadas()
    const caras = await page.locator('.player-zone .cards-row .playing-card:not(.card-back):not(.card-empty)').count()
    const shot = `${OUT_DIR}/pvp_reposicion_412x915.png`
    await page.screenshot({ path: shot })
    const ok = marcadas === 2 && esperando === 2 && abierta && despues === 0
    await page.context().close()
    return { escena: 'reposicion-desde-mesa', marcadas, esperando, abierta, despues, caras, shot, ok }
  } catch (e) {
    await page.context().close()
    return { escena: 'reposicion-desde-mesa', ok: false, error: String(e?.message || e).slice(0, 160) }
  }
}

export async function runPvp(browser, { base, mesas = MESAS }) {
  const celdas = []
  for (const n of mesas) {
    for (const vp of VIEWPORTS) {
      const c = await celda(browser, base, vp, n)
      celdas.push(c)
      console.log(`pvp·${c.celda} · ${c.ok ? 'OK' : 'FALLA'} · rotación ${c.rotacion} · táctil ${c.tactil}${c.bajos?.length ? ` (${c.bajos.map((b) => `${b.txt} ${Math.round(b.w)}×${Math.round(b.h)}`).join(', ')})` : ''} · tinta ${c.tintaOk}${c.tinta?.filter((t) => t.contraste !== null && t.contraste < PISO_WCAG).map((t) => ` «${t.txt}» ${t.contraste}`).join('') ?? ''} · O1 ${c.o1}${c.movidas?.length ? ` (${c.movidas.join(', ')})` : ''} · clavada ${c.clavada}${c.error ? ` · ${c.error}` : ''}`)
    }
  }
  const vistas = mesas.length === MESAS.length ? await escenas(browser, base) : []
  for (const v of vistas) console.log(`pvp·escena ${v.escena} · ${v.ok ? 'OK' : 'FALLA'}${v.ok ? '' : ` · ${JSON.stringify(v)}`}`)
  const largos = await nombresLargos(browser, base)
  for (const l of largos) console.log(`pvp·15W ${l.vp} mesa ${l.n} ${l.que} · ${JSON.stringify(l)}`)
  const verde = celdas.length > 0 && celdas.every((c) => c.ok) && vistas.every((v) => v.ok)
  console.log(`── PVP · ${celdas.filter((c) => c.ok).length}/${celdas.length} celdas · ${vistas.filter((v) => v.ok).length}/${vistas.length} escenas · ${verde ? 'VERDE' : 'ROJO'}`)
  return { verde, celdas, escenas: vistas, largos }
}
