// ── verifyIDN1.mjs · Δ=0 de la adopción de identidad (campaña IDN-1) ────────
// Read-only: NO toca src/. Uso: `npm run dev` en otra consola, luego
//   node scripts/verifyIDN1.mjs antes     (con el árbol PRE-tanda)
//   node scripts/verifyIDN1.mjs despues   (con la tanda aplicada)
//   node scripts/verifyIDN1.mjs cmp       (compara los dos JSON y puntúa)
//
// NO es un modo de diagDSK.mjs, por la misma razón que verifyEMB1: la campaña
// es de PINTURA, la superficie es chica y la puerta final es el checkpoint
// visual de Victor. Esto sólo produce las cifras y las capturas.
//
// MÉTODO · aquí NO sirve el A/B por hoja del molde EMB-1. Lo que cambia no es
// una capa de CSS que se pueda apagar: son el árbol JSX y el dibujo del activo.
// El A/B es por TANDA — dos corridas, dos JSON, un `cmp`—, y para que sean
// comparables la ruta se fija (nivel 0, apuesta 0) y se mide SIEMPRE en el
// mismo estado: mesa recién repartida, sin hover, sin mano jugada.
//
// LO QUE SE EXIGE:
//   (a) Δ=0 en las anclas de vecindad — la sustitución es de tinta, no de caja.
//   (b) La caja de cada ficha, idéntica al px (incluido el 11×11 del pozo en
//       landscape móvil, la única regla de toda la app que dimensiona
//       `.chip-token`).
//   (c) El TEXTO del wordmark medido con rango DOM, no con el rect del <h1>:
//       es la única lectura que distingue "la caja creció" de "las letras se
//       movieron" (lección EMB-1).
//   (d) La huella de MARGEN del <h1> intacta: es lo que garantiza que nada de
//       lo que va debajo se entere.
//   (e) Capturas RECORTADAS por contexto: una tira de 1920px no deja juzgar
//       una moneda de 16.

import { chromium } from 'playwright-core'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const MODO = process.argv[2] || 'antes'
const OUT = 'capturas-idn1'
const EVID = `${OUT}/evidencia`
const round = (n) => n == null ? null : Math.round(n * 100) / 100

// ── Instrumento (ARN-1: un número que no se pueda atribuir no vale) ──────────
const ARNES = { tanda: 'IDN-1', chromiumBaselines: '151.0.4129.93' }

// ── Las celdas ──────────────────────────────────────────────────────────────
// 800×1200 no es capricho: es la ZONA HUECO (ni portrait móvil, ni landscape
// móvil, ni escritorio) y es el ÚNICO sitio donde montan `.opp-chips` y
// `.ai-chips`. Sin ella, dos de las trece apariciones del censo no se miden.
const CELDAS = [
  { id: 'bienvenida-1920', w: 1920, h: 937,  pantalla: 'welcome' },
  { id: 'bienvenida-360',  w: 360,  h: 640,  pantalla: 'welcome' },
  { id: 'mesa5-1920',      w: 1920, h: 937,  mesa: 5, menu: true },
  { id: 'mesa5-1024',      w: 1024, h: 768,  mesa: 5, menu: true },
  { id: 'mesa5-800x1200',  w: 800,  h: 1200, mesa: 5 },
  { id: 'mesa5-740x360',   w: 740,  h: 360,  mesa: 5 },
  { id: 'mesa5-360x640',   w: 360,  h: 640,  mesa: 5 },
  { id: 'mesa2-800x1200',  w: 800,  h: 1200, mesa: 2 },
  { id: 'mesa2-740x360',   w: 740,  h: 360,  mesa: 2 },
  { id: 'mesa2-360x640',   w: 360,  h: 640,  mesa: 2 },
]

// (a) Anclas de vecindad — Δ=0 obligatorio. Nada de esto pertenece a la tanda:
// si algo aquí se mueve, la sustitución dejó de ser de tinta.
const ANCLAS_WELCOME = [
  '.welcome-screen', '.welcome-card', '.star-arc', '.subtitle',
  '.mode-buttons', '.btn-mode-ai', '.deco-left', '.deco-right',
]
const ANCLAS_MESA = [
  '.game-table', '.table-header', '.header-right', '.hand-badge',
  '.table-mid', '.center-zone', '.rivals-zone', '.player-zone',
  '.cards-row', '.action-area', '.player-bar-left', '.player-bar-right',
  '.pot-box', '.pot-label', '.call-box', '.game-message',
]

// (b) Las trece apariciones de la Tabla A, por su caja.
const FICHAS = [
  '.pot-value .chip-token', '.opp-corner-chip .chip-token',
  '.opp-chips .chip-token', '.ai-chips .chip-token',
  '.pbr-chips .chip-token', '.util-ico-chip .chip-token',
]
// Los contenedores: si la ficha creciera de caja, el contenedor lo delataría
// aunque la propia ficha mintiera.
const CONTENEDORES = ['.pot-value', '.opp-corner-chip', '.opp-chips', '.ai-chips', '.pbr-chips', '.util-ico-chip']

// ── Sondas (se serializan a la página; no pueden cerrar sobre nada de Node) ──
function rects(sels) {
  void document.body.offsetWidth
  const out = {}
  for (const s of sels) {
    const els = [...document.querySelectorAll(s)]
    out[s] = els.map(n => {
      const r = n.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    })
  }
  return out
}

// (c)+(d) El wordmark: rango DOM del contenido + caja de borde + huella de
// margen + el nombre accesible, que es lo único que sigue diciendo "AJILEI"
// cuando la A y la J dejan de ser letras.
function wordmark(sel) {
  const el = document.querySelector(sel)
  if (!el) return { presente: false }
  void document.body.offsetWidth
  const cs = getComputedStyle(el)
  const b = el.getBoundingClientRect()
  const r = document.createRange(); r.selectNodeContents(el)
  const t = r.getBoundingClientRect()
  const px = (p) => parseFloat(cs.getPropertyValue(p)) || 0
  const iso = el.querySelector('.wm-iso')
  return {
    presente: true,
    texto:  { x: t.x, y: t.y, w: t.width, h: t.height },
    caja:   { x: b.x, y: b.y, w: b.width, h: b.height },
    margen: { top: b.y - px('margin-top'), bottom: b.bottom + px('margin-bottom'),
              left: b.x - px('margin-left'), right: b.right + px('margin-right') },
    fontSize: cs.fontSize, letterSpacing: cs.letterSpacing,
    lineHeight: cs.lineHeight, position: cs.position,
    // Nombre accesible: antes lo daba el texto; después tiene que darlo el
    // aria-label. Si esto se queda en null, la marca se volvió invisible para
    // quien no ve — y eso sería una regresión, no un cambio de estilo.
    nombreAccesible: el.getAttribute('aria-label') || el.textContent.trim(),
    textoVisible: el.textContent.trim(),
    isotipo: iso ? (() => {
      const ri = iso.getBoundingClientRect()
      const ci = getComputedStyle(iso)
      return { x: ri.x, y: ri.y, w: ri.width, h: ri.height,
               verticalAlign: ci.verticalAlign, display: ci.display, src: iso.getAttribute('src') }
    })() : null,
  }
}

// Altura de mayúscula real de la fuente resuelta — el calibre del que cuelga
// todo el dimensionado del isotipo (Identidad A §3: caja = 1,5 × cap).
function calibre(sel) {
  const el = document.querySelector(sel)
  if (!el) return null
  const cs = getComputedStyle(el)
  const c = document.createElement('canvas').getContext('2d')
  c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const m = c.measureText('I')
  return { fontSize: parseFloat(cs.fontSize), cap: m.actualBoundingBoxAscent,
           ratio: m.actualBoundingBoxAscent / parseFloat(cs.fontSize), familia: cs.fontFamily }
}

// El overlay de celebración no se alcanza sin ganar una mano: se CONSTRUYE con
// el mismo molde que usa diagDSK (modo vc2), pero clonando el marcado REAL del
// producto en vez de una copia congelada — ésa fue la avería que ARN-1 vino a
// prohibir. Se lee del propio árbol y se destruye al terminar.
// El anfitrión se clona ENTERO —marcado y `aria-label`— del <h1> vivo de la
// mesa, que monta el mismo <Wordmark/>. Clonar sólo el innerHTML dejaba el
// span sin nombre accesible y el arnés cantaba un rojo que era suyo, no del
// producto: la primera corrida de F3 reportó «.vc-ajilei pierde el nombre
// accesible ("ILEI")» midiendo un elemento que había fabricado él mal.
function construyeAjilei({ html, label }) {
  const c = document.createElement('div')
  c.className = 'vc-ajilei-capa'
  c.setAttribute('data-idn1', '1')
  c.innerHTML = `<span class="vc-ajilei"${label ? ` aria-label="${label}"` : ''}>${html}</span>`
  document.querySelector('.game-table-screen').appendChild(c)
}

// Espera a que ASIENTEN las animaciones de entrada antes de medir.
// Sin esto la matriz da rojos fantasma: `.welcome-card` lleva
// `panel-enter 0.55s` (translateY de 14px) y los botones entran escalonados,
// así que una lectura tomada en pleno vuelo compara dos instantes distintos de
// la MISMA animación y no dos versiones del código. Así salió el primer
// Δ=0,7px de `.mode-buttons` en una pantalla que la Fase 2 ni siquiera toca.
//
// Se esperan sólo las animaciones FINITAS: el barrido dorado de EMB-1 sobre el
// título es infinito (7 s en bucle) y nunca resolvería su `finished`. No
// importa — mueve `background-position`, no la caja de nadie.
async function asienta(page) {
  await page.evaluate(() => Promise.all(
    document.getAnimations()
      .filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
      .map(a => a.finished.catch(() => {}))
  ))
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
}

async function ruta(page, mesa) {
  await page.click('button:has-text("Jugar vs IA")')
  await page.waitForSelector('.nivel-grid button')
  await page.click('.nivel-grid button:nth-of-type(1)')
  await page.click(`button:has-text("Mesa de ${mesa} jugadores")`)
  await page.waitForSelector('.mode-stake-btn')
  await page.click('.mode-stake-grid button:nth-of-type(1)')
  await page.waitForSelector('.game-table')
  await page.mouse.move(5, 5)          // neutraliza hover de cartas
  await asienta(page)
}

// (e) Captura RECORTADA al elemento + aire, a escala 2 para poder juzgar el
// cuño de una moneda de 16px. Una tira de viewport entero no sirve de prueba.
async function recorte(page, sel, nombre, aire = 24) {
  const el = await page.$(sel)
  if (!el) return null
  const b = await el.boundingBox()
  if (!b || b.width === 0) return null
  const vp = page.viewportSize()
  const clip = {
    x: Math.max(0, b.x - aire), y: Math.max(0, b.y - aire),
    width: Math.min(vp.width, b.width + aire * 2), height: Math.min(vp.height, b.height + aire * 2),
  }
  clip.width = Math.min(clip.width, vp.width - clip.x)
  clip.height = Math.min(clip.height, vp.height - clip.y)
  const f = `${EVID}/${MODO}/${nombre}.png`
  await page.screenshot({ path: f, clip })
  return f
}

// ── Corrida ─────────────────────────────────────────────────────────────────
async function medir() {
  for (const d of [OUT, EVID, `${EVID}/${MODO}`]) if (!existsSync(d)) mkdirSync(d, { recursive: true })

  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const out = { arnes: ARNES, modo: MODO, chromium: browser.version(), celdas: {} }

  for (const c of CELDAS) {
    const ctx = await browser.newContext({
      viewport: { width: c.w, height: c.h },
      deviceScaleFactor: 2,
      hasTouch: c.w < 900,
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForSelector('.welcome-title')
    await asienta(page)

    const celda = { vp: `${c.w}x${c.h}`, mesa: c.mesa ?? null, capturas: [] }

    if (c.pantalla === 'welcome') {
      celda.anclas   = await page.evaluate(rects, ANCLAS_WELCOME)
      celda.wordmark = { '.welcome-title': await page.evaluate(wordmark, '.welcome-title') }
      celda.calibre  = { '.welcome-title': await page.evaluate(calibre, '.welcome-title') }
      celda.capturas.push(await recorte(page, '.welcome-title', `${c.id}-wordmark`, 30))
    } else {
      await ruta(page, c.mesa)
      if (c.menu) { await page.click('.utilities-trigger'); await page.waitForSelector('.utilities-panel'); await asienta(page) }

      celda.anclas   = await page.evaluate(rects, ANCLAS_MESA)
      celda.fichas   = await page.evaluate(rects, FICHAS)
      celda.cajas    = await page.evaluate(rects, CONTENEDORES)
      celda.wordmark = { '.table-title': await page.evaluate(wordmark, '.table-title') }
      celda.calibre  = { '.table-title': await page.evaluate(calibre, '.table-title') }
      celda.clases   = await page.evaluate(() => document.querySelector('.game-table').className)

      celda.capturas.push(await recorte(page, '.table-title', `${c.id}-wordmark`, 14))
      celda.capturas.push(await recorte(page, '.pot-box', `${c.id}-pozo`, 16))
      celda.capturas.push(await recorte(page, '.player-bar-right', `${c.id}-saldo`, 10))
      for (const s of ['.opp-corner-chip', '.opp-chips', '.ai-chips', '.util-ico-chip'])
        celda.capturas.push(await recorte(page, s, `${c.id}-${s.replace(/\W+/g, '')}`, 14))

      // Overlay AJILEI de la celebración, construido con el marcado vivo.
      if (c.id === 'mesa5-1920') {
        const fuente = await page.evaluate(() => {
          const t = document.querySelector('.table-title')
          return { html: t ? t.innerHTML : 'AJILEI', label: t ? t.getAttribute('aria-label') : null }
        })
        await page.evaluate(construyeAjilei, fuente)
        await asienta(page)   // el overlay entra con un pop; medir en vuelo no vale
        celda.wordmark['.vc-ajilei'] = await page.evaluate(wordmark, '.vc-ajilei')
        celda.calibre['.vc-ajilei']  = await page.evaluate(calibre, '.vc-ajilei')
        celda.anclasTrasOverlay = await page.evaluate(rects, ANCLAS_MESA)
        celda.capturas.push(await recorte(page, '.vc-ajilei', `${c.id}-celebracion`, 30))
        await page.evaluate(() => document.querySelector('[data-idn1]')?.remove())
      }
    }
    celda.capturas = celda.capturas.filter(Boolean)
    out.celdas[c.id] = celda
    await ctx.close()
  }

  await browser.close()
  writeFileSync(`${EVID}/idn1-${MODO}.json`, JSON.stringify(out, null, 2))
  console.log(`✔ ${MODO}: ${Object.keys(out.celdas).length} celdas · ${EVID}/idn1-${MODO}.json`)
  console.log(`  capturas en ${EVID}/${MODO}/`)
  return out
}

// ── Comparación ─────────────────────────────────────────────────────────────
function cmp() {
  const A = JSON.parse(readFileSync(`${EVID}/idn1-antes.json`, 'utf8'))
  const B = JSON.parse(readFileSync(`${EVID}/idn1-despues.json`, 'utf8'))
  let peorAncla = 0, peorAnclaQuien = null, fallos = []

  const dRects = (a, b) => {
    let m = 0, quien = null
    for (const s of Object.keys(a)) {
      const la = a[s] || [], lb = b[s] || []
      if (la.length !== lb.length) { fallos.push(`censo distinto en ${s}: ${la.length} → ${lb.length}`); continue }
      la.forEach((ra, i) => {
        for (const k of ['x', 'y', 'w', 'h']) {
          const d = Math.abs(ra[k] - lb[i][k])
          if (d > m) { m = d; quien = `${s}[${i}].${k}` }
        }
      })
    }
    return { m, quien }
  }

  console.log(`\nIDN-1 · Δ ANTES → DESPUÉS   (Chromium ${A.chromium} → ${B.chromium})\n`)
  console.log('celda              Δanclas    Δcajas-ficha   Δtexto-wm   Δx-badge   ¿explicado?    nombre accesible')
  console.log('─'.repeat(104))

  for (const id of Object.keys(A.celdas)) {
    const a = A.celdas[id], b = B.celdas[id]
    if (!b) { fallos.push(`falta la celda ${id} en 'despues'`); continue }

    // ── La ÚNICA consecuencia declarada de la Fase 3 ──────────────────────
    // La letra doble es más angosta que la secuencia "AJ" con su traza, así
    // que el <h1> de la mesa se estrecha. `.table-header` es `space-between`
    // con tres ítems, de modo que la pastilla "Mano #N" —el del medio— se
    // recentra la MITAD de ese estrechamiento. Es geometría de la sustitución,
    // no una regresión.
    //
    // No se mete en una lista de excepciones: eso apagaría el ancla para
    // siempre y un arnés que perdona por nombre es un arnés a oscuras
    // (lección ARN-1). Lo que se exige es la IDENTIDAD: el desplazamiento
    // tiene que ser exactamente la mitad del delta de ancho del título, o
    // cero si en ese breakpoint el título está fuera de flujo. Cualquier otro
    // valor —incluido el mismo 7,03px por otra causa— sigue siendo rojo.
    const dWtitulo = (a.wordmark?.['.table-title']?.presente && b.wordmark?.['.table-title']?.presente)
      ? b.wordmark['.table-title'].caja.w - a.wordmark['.table-title'].caja.w
      : null
    // El título se estrecha (Δw negativo) y la pastilla se va con él hacia la
    // izquierda: mismo signo, la mitad de magnitud.
    const esperadoBadge = dWtitulo === null ? null : dWtitulo / 2
    const dxBadge = (a.anclas['.hand-badge']?.[0] && b.anclas['.hand-badge']?.[0])
      ? b.anclas['.hand-badge'][0].x - a.anclas['.hand-badge'][0].x
      : 0
    // Tolerancia = 1/64px, la REJILLA DE LAYOUT de Chromium, no un número
    // cómodo. Partir por la mitad un valor cuantizado a 1/64 cae en 1/128 y el
    // motor lo re-cuantiza: los Δw medidos son −14,046875 y −10,40625, ambos
    // múltiplos exactos de 1/64, y su mitad se separa del desplazamiento real
    // en 1/128 justos. Una tolerancia más fina que la rejilla no mide mejor:
    // sólo da rojos que no significan nada.
    const REJILLA = 1 / 64
    const badgeExplicado = Math.abs(dxBadge) < REJILLA ||
      (esperadoBadge !== null && Math.abs(dxBadge - esperadoBadge) <= REJILLA)
    if (!badgeExplicado) fallos.push(`${id}: .hand-badge se movió ${round(dxBadge)}px, y la mitad del Δ de ancho del título es ${round(esperadoBadge)}px — no cuadra`)

    const anclasSinBadge = Object.fromEntries(
      Object.entries(a.anclas).filter(([s]) => !(s === '.hand-badge' && badgeExplicado)))
    const anc = dRects(anclasSinBadge,
      Object.fromEntries(Object.entries(b.anclas).filter(([s]) => s in anclasSinBadge)))
    if (anc.m > peorAncla) { peorAncla = anc.m; peorAnclaQuien = `${id} · ${anc.quien}` }
    const caj = a.cajas ? dRects(a.cajas, b.cajas) : { m: 0, quien: null }

    let dTexto = 0, dMargen = 0, nombres = []
    for (const sel of Object.keys(a.wordmark || {})) {
      const wa = a.wordmark[sel], wb = (b.wordmark || {})[sel]
      if (!wa?.presente) continue
      if (!wb?.presente) { fallos.push(`${id}: ${sel} desapareció`); continue }
      for (const k of ['x', 'y', 'w', 'h']) dTexto = Math.max(dTexto, Math.abs(wa.texto[k] - wb.texto[k]))
      for (const k of ['top', 'bottom', 'left', 'right'])
        dMargen = Math.max(dMargen, Math.abs(wa.margen[k] - wb.margen[k]))
      nombres.push(wb.nombreAccesible)
      if (wb.nombreAccesible !== 'AJILEI') fallos.push(`${id}: ${sel} pierde el nombre accesible ("${wb.nombreAccesible}")`)
    }

    const ok = anc.m === 0 && caj.m === 0
    console.log(
      `${id.padEnd(18)} ${String(round(anc.m)).padStart(7)}  ${String(round(caj.m)).padStart(12)}  ` +
      `${String(round(dTexto)).padStart(10)}  ${String(round(dxBadge)).padStart(9)}  ` +
      `${badgeExplicado ? (dxBadge ? '= Δw/2 ✓' : '  (fijo)') : ' SIN EXPLICAR'}   ${[...new Set(nombres)].join(', ') || '—'}` +
      `${ok ? '' : '   ← ' + (anc.quien || caj.quien)}`
    )
  }

  // Las cajas de ficha, una por una: es el corazón de la Fase 2.
  console.log('\nCajas de ficha (Tabla A) · antes → después, por celda:')
  for (const id of Object.keys(A.celdas)) {
    const a = A.celdas[id], b = B.celdas[id]
    if (!a.fichas) continue
    for (const s of Object.keys(a.fichas)) {
      const la = a.fichas[s], lb = (b.fichas || {})[s] || []
      if (!la.length) continue
      const ra = la[0], rb = lb[0]
      const igual = rb && ra.w === rb.w && ra.h === rb.h
      console.log(`  ${id.padEnd(18)} ${s.padEnd(30)} ${round(ra.w)}×${round(ra.h)} → ${rb ? `${round(rb.w)}×${round(rb.h)}` : 'AUSENTE'}  ${igual ? 'Δ=0' : '←← CAMBIÓ'}`)
      if (!igual) fallos.push(`${id}: caja de ${s} cambió`)
    }
  }

  console.log(`\nPeor Δ de ancla en toda la matriz: ${round(peorAncla)}px${peorAnclaQuien ? `  (${peorAnclaQuien})` : ''}`)
  if (fallos.length) { console.log('\nFALLOS:'); fallos.forEach(f => console.log('  ✗ ' + f)) }
  console.log(`\nVEREDICTO: ${peorAncla === 0 && !fallos.length ? 'VERDE — sustitución de tinta, Δ=0 de caja' : 'ROJO'}`)
}

if (MODO === 'cmp') cmp()
else await medir()
