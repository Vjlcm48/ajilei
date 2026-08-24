// ── verifyREN1.mjs · ¿desborda "Heptacoins" alguna caja? (campaña REN-1) ────
// Read-only sobre src/. Uso: `npm run dev` en otra consola, luego
//   node scripts/verifyREN1.mjs
//
// La tanda es de COPY, no de caja: la palabra pasa de 6 letras a 10 y ninguna
// regla de CSS se toca. La única pregunta que importa es si en algún sitio el
// texto se sale de la caja que lo contiene. Por eso aquí NO se miden anclas de
// vecindad como en IDN-1.
//
// MÉTODO · dos decisiones que costaron una corrida en falso:
//
//   1) La caja de referencia se declara A MANO por sitio (`ref`), no se deduce
//      buscando el ancestro con `overflow != visible`. Ese ancestro resultó ser
//      SIEMPRE la pantalla entera (`.game-table-screen`, `.mode-select-screen`),
//      contra la que nada desborda jamás: la primera corrida cantó 31 rojos que
//      eran todos de la sonda. Lo que de verdad acota a `.opp-status` es su
//      panel, y a `.tap-precio` su fila; eso es lo que hay que declarar.
//
//   2) El veredicto es A/B sobre el MISMO elemento: se mide con "Heptacoins",
//      se sustituyen los nodos de texto por "fichas", se vuelve a medir y se
//      restaura. Así el rojo sólo se enciende si la palabra NUEVA no cabe donde
//      la VIEJA sí cabía — un desborde que ya existía antes de la tanda no es
//      de la tanda. Se reporta aparte (`previo`).
//
// Un elemento con rango 0×0 NO se mide: es `display:none` (la palabra no monta
// en esa celda) y medirlo produce el rojo fantasma de una caja en el origen.
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT = 'capturas-ren1'
const round = (n) => n == null ? null : Math.round(n * 100) / 100

// ── Sonda (se serializa a la página; no cierra sobre nada de Node) ───────────
function sonda(sitios) {
  void document.body.offsetWidth
  const E = 0.5
  const rect = (r) => ({ x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom })
  const rangoDe = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect() }
  const contentBox = (el) => {
    const b = el.getBoundingClientRect(), cs = getComputedStyle(el)
    const px = (p) => parseFloat(cs.getPropertyValue(p)) || 0
    return { x: b.x + px('border-left-width') + px('padding-left'),
             right: b.right - px('border-right-width') - px('padding-right'),
             y: b.y + px('border-top-width') + px('padding-top'),
             bottom: b.bottom - px('border-bottom-width') - px('padding-bottom'),
             w: b.width, h: b.height }
  }
  const swap = (el, de, a) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let n; while ((n = w.nextNode())) if (n.nodeValue.includes(de)) n.nodeValue = n.nodeValue.split(de).join(a)
  }
  // Lectura completa de un elemento contra su caja de referencia.
  const lee = (el, refEl) => {
    void document.body.offsetWidth
    const t = rangoDe(el)
    const c = refEl ? contentBox(refEl) : null
    return {
      rango: rect(t),
      ref: c,
      fuera: c ? { derecha: t.right - c.right, izquierda: c.x - t.x,
                   abajo: t.bottom - c.bottom, arriba: c.y - t.y } : null,
      scrollRef: refEl ? { w: refEl.scrollWidth, cw: refEl.clientWidth,
                           h: refEl.scrollHeight, ch: refEl.clientHeight } : null,
    }
  }
  const noCabe = (l) => !l.ref ? false
    : (l.fuera.derecha > E || l.fuera.izquierda > E || l.fuera.abajo > E || l.fuera.arriba > E
       || (l.scrollRef && (l.scrollRef.w > l.scrollRef.cw + E || l.scrollRef.h > l.scrollRef.ch + E)))

  const out = {}
  for (const s of sitios) {
    out[s.sel] = [...document.querySelectorAll(s.sel)].map(el => {
      const cs = getComputedStyle(el)
      const refEl = s.ref ? el.closest(s.ref) : el.parentElement
      const t0 = rangoDe(el)
      if (t0.width === 0 && t0.height === 0) return { monta: false, display: cs.display }
      const nuevo = lee(el, refEl)
      swap(el, 'Heptacoins', 'fichas')
      const viejo = lee(el, refEl)
      swap(el, 'fichas', 'Heptacoins')
      void document.body.offsetWidth
      return {
        monta: true,
        texto: el.textContent.replace(/\s+/g, ' ').trim(),
        caja: rect(el.getBoundingClientRect()),
        refSel: s.ref || '(padre)',
        refClase: refEl ? (refEl.className || refEl.tagName) : null,
        nuevo, viejo,
        estilo: { whiteSpace: cs.whiteSpace, overflow: cs.overflow, textOverflow: cs.textOverflow,
                  fontSize: cs.fontSize, display: cs.display, position: cs.position },
        delta: { ancho: nuevo.rango.w - viejo.rango.w, alto: nuevo.rango.h - viejo.rango.h },
        // Renglones: el alto del rango crece de golpe cuando el texto envuelve.
        envuelveAhora: nuevo.rango.h > viejo.rango.h + E,
        desborda: noCabe(nuevo),
        previo:   noCabe(viejo),
      }
    })
  }
  return out
}

async function asienta(page) {
  await page.evaluate(() => Promise.all(
    document.getAnimations()
      .filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
      .map(a => a.finished.catch(() => {}))
  ))
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
}

async function recorte(page, sel, nombre, aire = 30) {
  const el = await page.$(sel); if (!el) return null
  const b = await el.boundingBox(); if (!b || b.width === 0) return null
  const vp = page.viewportSize()
  const clip = { x: Math.max(0, b.x - aire), y: Math.max(0, b.y - aire),
                 width: b.width + aire * 2, height: b.height + aire * 2 }
  clip.width = Math.min(clip.width, vp.width - clip.x)
  clip.height = Math.min(clip.height, vp.height - clip.y)
  if (clip.width <= 0 || clip.height <= 0) return null
  await page.screenshot({ path: `${OUT}/${nombre}.png`, clip })
  return `${OUT}/${nombre}.png`
}

// ── Sitios · la caja que de verdad acota a cada aparición ───────────────────
const S = {
  rango:   { sel: '.nivel-btn-rango',    ref: '.nivel-btn' },
  saldo:   { sel: '.mode-balance-value', ref: '.mode-balance' },
  sub:     { sel: '.mode-select-sub',    ref: '.mode-select-card' },
  stake:   { sel: '.mode-stake-label',   ref: '.mode-stake-btn' },
  oppch:   { sel: '.opp-chips',          ref: '.opp-panel' },
  // `.opp-status` es ABSOLUTE y en landscape vive FUERA de la caja del panel
  // (LH-3: franja inferior, bottom:-4), así que medirla contra `.opp-panel` da
  // un rojo que es del arnés. Su caja propia lleva `overflow:hidden`: ELLA es
  // quien clipa, y contra ella es contra quien hay que medir.
  oppst:   { sel: '.opp-status',         ref: '.opp-status' },
  aich:    { sel: '.ai-chips',           ref: '.ai-zone' },
  pbr:     { sel: '.pbr-chips',          ref: '.player-bar-right' },
  pbrw:    { sel: '.pbr-fichas-word',    ref: '.player-bar-right' },
  precio:  { sel: '.tap-precio',         ref: '.tap-swatch' },
}

// 800×1200 es la zona hueco (ni portrait móvil, ni landscape móvil, ni
// escritorio): el único sitio donde montan `.opp-chips` y `.ai-chips`.
const CELDAS = [
  { id: 'nivel-360x640',    w: 360,  h: 640,  hasta: 'nivel',   sitios: [S.rango] },
  { id: 'modo-360x640',     w: 360,  h: 640,  hasta: 'modo',    mesa: 5, sitios: [S.saldo, S.sub, S.stake] },
  { id: 'modo-740x360',     w: 740,  h: 360,  hasta: 'modo',    mesa: 5, sitios: [S.saldo, S.sub, S.stake] },
  { id: 'mesa5-800x1200',   w: 800,  h: 1200, hasta: 'mesa',    mesa: 5, sitios: [S.oppch, S.oppst, S.pbr, S.pbrw] },
  { id: 'mesa2-800x1200',   w: 800,  h: 1200, hasta: 'mesa',    mesa: 2, sitios: [S.aich, S.pbr, S.pbrw] },
  { id: 'mesa5-740x360',    w: 740,  h: 360,  hasta: 'mesa',    mesa: 5, sitios: [S.oppst, S.pbr, S.pbrw] },
  { id: 'mesa5-360x640',    w: 360,  h: 640,  hasta: 'mesa',    mesa: 5, sitios: [S.oppst, S.pbr, S.pbrw] },
  { id: 'mesa5-1920x937',   w: 1920, h: 937,  hasta: 'mesa',    mesa: 5, sitios: [S.oppst, S.pbr, S.pbrw] },
  { id: 'tapetes-360x640',  w: 360,  h: 640,  hasta: 'tapetes', mesa: 5, sitios: [S.precio] },
  { id: 'tapetes-1920x937', w: 1920, h: 937,  hasta: 'tapetes', mesa: 5, sitios: [S.precio] },
]

async function ruta(page, c) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('button:has-text("Jugar vs IA")')
  await page.waitForSelector('.nivel-grid button')
  if (c.hasta === 'nivel') { await asienta(page); return }
  await page.click('.nivel-grid button:nth-of-type(1)')
  await page.waitForSelector('.mode-select-card')
  await page.click(`button:has-text("Mesa de ${c.mesa} jugadores")`)
  await page.waitForSelector('.mode-stake-btn')
  if (c.hasta === 'modo') { await asienta(page); return }
  await page.click('.mode-stake-grid button:nth-of-type(1)')
  await page.waitForSelector('.game-table')
  await page.mouse.move(2, 2)
  await asienta(page)
  if (c.hasta === 'tapetes') {
    await page.click('.utilities-trigger')
    await page.waitForSelector('.util-item-tapetes')
    await page.click('.util-item-tapetes')
    await page.waitForSelector('.tap-precio')
    await asienta(page)
  }
}

// `.opp-status` sólo dice su rótulo de bancarrota cuando una IA quiebra, que no
// se alcanza en una mesa recién repartida. Se inyecta la cadena REAL en el
// elemento REAL (mismas clases, mismo CSS, misma caja): lo que se mide es la
// caja del producto, no una maqueta del arnés (lección IDN-1 F3).
//
// REN-2: la cadena ya no es "Sin Heptacoins" sino "Sin saldo" — la decisión de
// Victor sobre el desborde que esta misma sonda cazó en móvil horizontal. Se
// lee del JSX para que el arnés no se quede midiendo un rótulo retirado.
const ROTULO_BANCARROTA = 'Sin saldo'
async function inyectaEstado(page) {
  await page.evaluate((rotulo) => {
    for (const s of document.querySelectorAll('.opp-status')) s.textContent = rotulo
  }, ROTULO_BANCARROTA)
  await page.evaluate(() => new Promise(r => requestAnimationFrame(r)))
}

// ── Muestreo de la CRÓNICA (REN-2) ──────────────────────────────────────────
// La equivalencia byte a byte contra el motor ya la prueba `testCronica`, que
// recorre miles de transiciones. Esto es lo que un test de nodo no puede dar:
// que la cadena llegue PINTADA al óvalo de la app real. Se juega una mesa 2, se
// abre con una apuesta del humano —la línea que motivó la tanda— y se recogen
// todos los textos distintos que pasan por `.game-message`, para leer de un
// vistazo que ninguno se quedó con "fichas" ni se rompió por el camino.
async function muestreoCronica(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 937 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const fallos = []
  page.on('pageerror', e => fallos.push(`cronica: ${e}`))
  const vistos = new Set()
  const lee = async () => {
    const t = await page.evaluate(() => document.querySelector('.game-message')?.textContent?.trim() ?? null)
    if (t) vistos.add(t)
    return t
  }
  const out = { vistos: [], apuesta: null, saludo: null, aperturaBet1: null, fallos }
  try {
    await ruta(page, { hasta: 'mesa', mesa: 2 })
    out.saludo = await lee()

    await page.click('button:has-text("Iniciar mano")')
    // El humano es Mano en la primera mano de toda sesión (pieIndex = N-1), así
    // que BET_1 abre con su turno y la apuesta a cero: el botón "Apostar" existe.
    await page.waitForSelector('.action-buttons button:has-text("Apostar")', { timeout: 20000 })
    out.aperturaBet1 = await lee()
    await recorteEn(page, '.game-message', 'cronica__1-apertura-bet1')

    await page.click('.action-buttons button:has-text("Apostar")')
    await page.waitForFunction(() => /^Apuestas /.test(document.querySelector('.game-message')?.textContent ?? ''), { timeout: 10000 })
    out.apuesta = await lee()
    await recorteEn(page, '.game-message', 'cronica__2-apuesta-mesa2')

    // Y se sigue jugando en automático para que pasen por el óvalo el resto de
    // voces: respuesta de la IA, "A las 3", descarte, resultado de mano.
    const pulsa = async (sel) => {
      const b = page.locator(sel).first()
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); return true }
      return false
    }
    for (let i = 0; i < 260; i++) {
      await lee()
      if (await page.locator('.game-over-screen').count() > 0) break
      await pulsa('.action-buttons button:has-text("Pasar")') ||
        await pulsa('.action-buttons button:has-text("Igualar")')
      await pulsa('button:has-text("Sin descartar")')
      await pulsa('button:has-text("Siguiente mano")')
      await pulsa('button:has-text("Iniciar mano")')
      await page.waitForTimeout(150)
    }
    if (await page.locator('.game-over-msg').count() > 0) {
      out.gameOver = await page.evaluate(() => document.querySelector('.game-over-msg')?.textContent?.trim())
      await recorteEn(page, '.game-over-msg', 'cronica__3-game-over')
    }
  } catch (e) { fallos.push(`cronica: ${e.message}`) }
  out.vistos = [...vistos].sort()
  await ctx.close()
  return out
}

// `recorte` necesita el nombre de celda; aquí basta el nombre pelado.
const recorteEn = (page, sel, nombre) => recorte(page, sel, nombre)

const informe = { tanda: 'REN-1', celdas: {} }
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
informe.chromium = browser.version()
const errores = []

for (const c of CELDAS) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => errores.push(`${c.id}: ${e}`))
  try {
    await ruta(page, c)
    if (c.sitios.some(s => s.sel === '.opp-status')) await inyectaEstado(page)
    const m = await page.evaluate(sonda, c.sitios)
    informe.celdas[c.id] = m
    for (const s of c.sitios) {
      if (!m[s.sel] || !m[s.sel].some(r => r.monta)) continue
      await recorte(page, s.sel, `${c.id}__${s.sel.replace(/[^a-z0-9]/gi, '')}`)
      if (s.ref) await recorte(page, s.ref, `${c.id}__ref-${s.ref.replace(/[^a-z0-9]/gi, '')}`, 12)
    }
    await page.screenshot({ path: `${OUT}/${c.id}__pantalla.png` })
  } catch (e) { errores.push(`${c.id}: ${e.message}`) }
  await ctx.close()
}

informe.cronica = await muestreoCronica(browser)
errores.push(...informe.cronica.fallos)
await browser.close()

informe.errores = errores
writeFileSync(`${OUT}/ren1.json`, JSON.stringify(informe, null, 2))

// ── Veredicto ───────────────────────────────────────────────────────────────
let nuevos = 0, previos = 0, vivos = 0, envuelven = 0
for (const [celda, sels] of Object.entries(informe.celdas)) {
  for (const [sel, arr] of Object.entries(sels)) {
    if (!arr.length) { console.log(`·  ${celda} ${sel} — no existe en el árbol`); continue }
    if (!arr.some(r => r.monta)) { console.log(`·  ${celda} ${sel} — NO MONTA (display:${arr[0].display})`); continue }
    arr.forEach((r, i) => {
      if (!r.monta) return
      vivos++
      if (r.envuelveAhora) envuelven++
      let flag = '   ok   '
      if (r.desborda && !r.previo) { flag = 'DESBORDA'; nuevos++ }
      else if (r.desborda && r.previo) { flag = ' previo '; previos++ }
      const et = arr.filter(x => x.monta).length > 1 ? `[${i}]` : ''
      const sobra = r.nuevo.fuera ? -Math.max(r.nuevo.fuera.derecha, r.nuevo.fuera.izquierda) : null
      console.log(`${flag} ${celda} ${sel}${et} · "${r.texto}" · Δancho ${round(r.delta.ancho)}px Δalto ${round(r.delta.alto)}px · rango ${round(r.nuevo.rango.w)}×${round(r.nuevo.rango.h)} en ${r.refSel} (${round(r.nuevo.ref?.w)}×${round(r.nuevo.ref?.h)}) · holgura ${round(sobra)}px${r.envuelveAhora ? ' · ENVUELVE' : ''}`)
    })
  }
}
console.log(`\nmediciones vivas: ${vivos} · desbordes NUEVOS: ${nuevos} · desbordes previos a la tanda: ${previos} · envuelven ahora y antes no: ${envuelven} · errores de página: ${errores.length ? errores.join(' | ') : 'ninguno'}`)

// ── Crónica ─────────────────────────────────────────────────────────────────
const cr = informe.cronica
const okApuesta = /^Apuestas \d+ Heptacoins\.$/.test(cr.apuesta ?? '')
console.log(`\n── crónica de mesa 2 ──`)
console.log(`saludo:          ${JSON.stringify(cr.saludo)}`)
console.log(`apertura BET_1:  ${JSON.stringify(cr.aperturaBet1)}`)
console.log(`${okApuesta ? 'OK  ' : 'MAL '} apuesta humano: ${JSON.stringify(cr.apuesta)}`)
if (cr.gameOver) console.log(`fin de partida:  ${JSON.stringify(cr.gameOver)}`)
const conFichas = cr.vistos.filter(t => /fichas/i.test(t))
console.log(`textos distintos por el óvalo (${cr.vistos.length}):`)
cr.vistos.forEach(t => console.log(`   · ${t}`))
console.log(`\ncadenas que aún dicen "fichas": ${conFichas.length ? conFichas.join(' | ') : 'ninguna'}`)
