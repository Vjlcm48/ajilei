// ── TUT-1 tanda 1 · `diagDSK tut` · la capa de señalización sobre la mesa ─────────────
// Ficha: AJILEI_TUT-1_T1_v1.0.md §1.5. Contra 5173 con bypass: la mesa quieta del árbitro
// imitado (`?pvp=turno-propio&n=3`, el turno del humano, «Pasar», «Apostar» y los
// multiplicadores montados, sin reloj que corra). La capa es la REAL (`CapaSenal`), montada
// por `scripts/tut/montaCapa.mjs` en una raíz propia, fuera de `#root`: el mando `?tut=`
// de la lámina ya no existe.
//
// En 360×640, 640×360 y 1920×1080 comprueba (INV-89, INV-07, INV-79, INV-45):
//   · tut.delta     Δ 0 de TODAS las cajas de `#root` sin capa, con capa y otra vez sin ella
//                   (el paso 2 del capítulo 5: un hueco por ancla, velo, burbuja y barra);
//   · tut.hueco     dentro de cada hueco los píxeles son los de sin capa (el velo no lo tapa);
//   · tut.toque     con `unico`, el toque real en «Pasar» llega a «Pasar» y en «Retirarse» lo
//                   recibe una banda del velo; al irse, `data-tut-unico` y `data-tut-activo`
//                   se van con ella;
//   · tut.44        los botones de la capa miden 44 × 44 como mínimo;
//   · tut.contraste el rótulo (texto, negrita y «paso n de m») da 4,5 : 1 sobre su fondo, con
//                   lo peor que pueda haber detrás (blanco o negro);
//   · tut.respaldo  sin sitio para la burbuja, la tarjeta de respaldo, con el paso y los botones
//                   dentro y sin barra aparte;
//   · tut.lineas    (solo 360×640) ningún rótulo de `textos.tut.es.js` pasa de dos líneas; en
//                   1920×1080 se apuntan las líneas y la forma (burbuja o tarjeta de respaldo).
// Lo que no es de esta vara: que la lámina no llegue a `dist/` (`testDistSinMoldes`).
//
// Control rojo: `TUT_CONTROL=sin-hueco` cierra los agujeros de la máscara del velo y le deja
// recibir el toque: tut.hueco y tut.toque tienen que salir rojos.
//
// TUT-1 T4 · y también SOBRE LA MESA DE LA GUIADA congelada (un capítulo de «Aprender por
// tema», el 5 en su paso 1: la mano 1 en tu primer turno, `guia/momento.js`):
//   · tut.mesa      Δ 0 de todas las cajas de `#root` con la capa y sin ella, en los tres
//                   tamaños (la capa y la muestra pintan encima de la mesa congelada).
// Control rojo: `TUT_CONTROL=caja-movida` mueve la caja del pozo 3 px mientras se mide «con
// capa» (una mesa con una caja movida): tut.mesa tiene que salir roja.
import process from 'node:process'

const T = {
  T1: { w: 360, h: 640, movil: true },
  T3: { w: 640, h: 360, movil: true },
  T6: { w: 1920, h: 1080, movil: false },
}
const MESA = '/?pvp=turno-propio&n=3'
const PAUSA = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}'
const CONTROLES = {
  'sin-hueco': '.tut-velo .tut-velo-hueco { fill: white } .tut-velo { pointer-events: auto } .tut-velo .tut-velo-fondo { pointer-events: all }',
  // T4 · sólo lo usa `tut.mesa`: la caja del pozo, 3 px a la derecha, durante la foto «con capa».
  'caja-movida': '',
}
const CAJA_MOVIDA = 'html[data-tut-control] [data-ancla="pozo"] { margin-left: 3px !important }'
const PASO_2 = {
  ancla: ['[data-accion="apostar"]', '[data-accion="mult"]'],
  rotulo: 'tut.cap5.p2',
  velo: true,
  controles: { volver: true, siguiente: true, cerrar: true, paso: { n: 2, m: 6 } },
}
const PASO_1_UNICO = {
  ancla: ['[data-accion="pasar"]'],
  rotulo: 'tut.cap5.p1',
  velo: true,
  unico: true,
  controles: { siguiente: true, cerrar: true, paso: { n: 1, m: 6 } },
}
const UMBRAL_CONTRASTE = 4.5
// Dentro de un hueco: ningún píxel cambia más de 24 en un canal y el cambio medio queda bajo 4.
const TOLERANCIA_HUECO = Object.freeze({ canal: 24, media: 4 })

// ── En la página ────────────────────────────────────────────────────────────
const CAJAS = () => [...document.querySelectorAll('#root *')].map((e) => {
  const r = e.getBoundingClientRect()
  return [r.left, r.top, r.width, r.height]
})

const LISTO = async () => {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => requestAnimationFrame(r))
    if (document.querySelector('.tut-capa[data-listo]')) {
      await new Promise((r) => requestAnimationFrame(r))
      return true
    }
  }
  return false
}

const LEE_CAPA = ({ umbral, anclas }) => {
  const rgba = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    return { r, g, b, a }
  }
  const sobre = (c, f) => ({ r: c.r * c.a + f.r * (1 - c.a), g: c.g * c.a + f.g * (1 - c.a), b: c.b * c.a + f.b * (1 - c.a), a: 1 })
  const lum = (c) => {
    const k = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * k(c.r) + 0.7152 * k(c.g) + 0.0722 * k(c.b)
  }
  const razon = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const rot = document.querySelector('.tut-rotulo:not(.tut-rotulo--medida)')
  const fondo = rgba(getComputedStyle(rot).backgroundColor)
  const contraste = {}
  for (const [nombre, q] of [['texto', '.tut-rotulo-texto span'], ['negrita', '.tut-rotulo-texto strong'], ['paso', '.tut-paso']]) {
    const e = rot.querySelector(q)
    if (!e) continue
    const tinta = rgba(getComputedStyle(e).color)
    const peor = Math.min(...[{ r: 255, g: 255, b: 255, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }].map((detras) => {
      const f = sobre(fondo, detras)
      return razon(sobre(tinta, f), f)
    }))
    contraste[nombre] = +peor.toFixed(2)
  }
  const botones = [...document.querySelectorAll('.tut-capa .tut-btn')].map((b) => {
    const r = b.getBoundingClientRect()
    return { accion: b.dataset.accion, w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
  })
  const huecos = [...document.querySelectorAll('.tut-capa .tut-aro')].map((e) => {
    const r = e.getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height }
  })
  // Lo que el hueco no puede destapar: el centro de otro botón de la fila (hallazgo 5 de la lámina).
  const destapa = [...document.querySelectorAll('.action-area [data-accion]')]
    .filter((e) => !e.matches(anclas.join(',')))
    .map((e) => { const r = e.getBoundingClientRect(); return { accion: e.dataset.accion, x: r.left + r.width / 2, y: r.top + r.height / 2 } })
    .filter((c) => huecos.some((h) => c.x > h.x && c.x < h.x + h.w && c.y > h.y && c.y < h.y + h.h))
    .map((c) => c.accion)
  return { contraste, bajos: Object.entries(contraste).filter(([, v]) => v < umbral), botones, huecos, destapa, modo: document.querySelector('.tut-capa')?.dataset.modo }
}

const LINEAS = () => {
  const p = document.querySelector('.tut-rotulo:not(.tut-rotulo--medida) .tut-rotulo-texto')
  if (!p) return null
  const alto = p.getBoundingClientRect().height
  const linea = parseFloat(getComputedStyle(p).lineHeight)
  return { lineas: Math.max(1, Math.round(alto / linea)), modo: document.querySelector('.tut-capa')?.dataset.modo, texto: p.textContent }
}

// Dos recortes, píxel a píxel (en la página, con un lienzo): cuántos píxeles cambian más
// de `umbral` en algún canal y el cambio medio.
const DIF = async ({ a, b, umbral }) => {
  const img = (s) => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = `data:image/png;base64,${s}` })
  const [ia, ib] = await Promise.all([img(a), img(b)])
  const datos = (i) => {
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height
    const x = c.getContext('2d'); x.drawImage(i, 0, 0)
    return x.getImageData(0, 0, i.width, i.height).data
  }
  const [da, db] = [datos(ia), datos(ib)]
  let distintos = 0
  let suma = 0
  let max = 0
  for (let k = 0; k < da.length; k += 4) {
    const d = Math.max(Math.abs(da[k] - db[k]), Math.abs(da[k + 1] - db[k + 1]), Math.abs(da[k + 2] - db[k + 2]))
    suma += d
    if (d > max) max = d
    if (d > umbral) distintos++
  }
  return { px: da.length / 4, distintos, media: +(suma / (da.length / 4)).toFixed(2), max }
}

// ── La comparación ──────────────────────────────────────────────────────────
function delta(a, b) {
  if (a.length !== b.length) return { n: a.length, max: Infinity, quien: `cajas ${a.length} → ${b.length}` }
  let max = 0
  let quien = null
  a.forEach((c, i) => c.forEach((v, k) => {
    const d = Math.abs(v - b[i][k])
    if (d > max) { max = d; quien = i }
  }))
  return { n: a.length, max: +max.toFixed(2), quien }
}

/** Los recortes de dentro de un hueco, sin sus esquinas redondeadas ni el borde del trazado. */
const recortes = (h) => [
  { x: h.x + 13, y: h.y + 3, width: h.w - 26, height: h.h - 6 },
  { x: h.x + 3, y: h.y + 13, width: h.w - 6, height: h.h - 26 },
].filter((c) => c.width >= 1 && c.height >= 1).map((c) => ({ x: Math.ceil(c.x), y: Math.ceil(c.y), width: Math.floor(c.width), height: Math.floor(c.height) }))

async function celda(page, base, tam, vp, control) {
  const out = { tam, puertas: {}, fallos: [] }
  const falla = (puerta, texto) => { out.fallos.push(`${tam} ${puerta}: ${texto}`); out.puertas[puerta] = false }
  const pasa = (puerta) => { if (!(puerta in out.puertas)) out.puertas[puerta] = true }
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e?.message || e)))
  await page.goto(`${base}${MESA}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-clavada] .action-buttons [data-accion="pasar"]', { timeout: 20000 })
  await page.waitForSelector('.action-buttons [data-accion="apostar"]', { timeout: 5000 })
  await page.addStyleTag({ content: PAUSA })
  if (control) await page.addStyleTag({ content: CONTROLES[control] })
  await page.mouse.move(1, 1)
  await page.evaluate(async () => { window.__tut = await import('/scripts/tut/montaCapa.mjs') })
  await page.waitForTimeout(300)

  // ── Δ, huecos, contraste y 44: el paso 2 del capítulo 5 ──
  const antes = await page.evaluate(CAJAS)
  await page.evaluate((p) => window.__tut.montar(p), PASO_2)
  if (!(await page.evaluate(LISTO))) throw new Error(`${tam}: la capa no se colocó (data-listo)`)
  const con = await page.evaluate(CAJAS)
  const capa = await page.evaluate(LEE_CAPA, { umbral: UMBRAL_CONTRASTE, anclas: PASO_2.ancla })
  out.capa = capa
  // La foto es del VELO: los aros se ocultan mientras (el de un hueco vecino que lo pisa
  // asoma unos píxeles dentro de este, y eso es el aro, no el velo).
  const sinAros = await page.addStyleTag({ content: '.tut-capa .tut-aro { visibility: hidden }' })
  const fotos = []
  for (const h of capa.huecos) for (const c of recortes(h)) fotos.push({ c, con: await page.screenshot({ clip: c }) })
  await sinAros.evaluate((n) => n.remove())
  await page.evaluate(() => window.__tut.desmontar())
  await page.waitForTimeout(100)
  const despues = await page.evaluate(CAJAS)
  for (const f of fotos) f.sin = await page.screenshot({ clip: f.c })

  out.delta = { conCapa: delta(antes, con), sinCapa: delta(antes, despues) }
  if (out.delta.sinCapa.max !== 0) throw new Error(`${tam}: la mesa no está quieta sin capa (Δ ${out.delta.sinCapa.max}, ${out.delta.sinCapa.quien})`)
  if (out.delta.conCapa.max !== 0) falla('tut.delta', `Δ ${out.delta.conCapa.max} px con la capa (${out.delta.conCapa.quien}) sobre ${out.delta.conCapa.n} cajas`)
  else pasa('tut.delta')

  if (!capa.huecos.length) falla('tut.hueco', 'la capa no abrió ningún hueco')
  if (capa.destapa.length) falla('tut.hueco', `un hueco destapa otro botón de la fila: ${capa.destapa.join(', ')} (un hueco por ancla)`)
  for (const f of fotos) f.dif = await page.evaluate(DIF, { a: f.con.toString('base64'), b: f.sin.toString('base64'), umbral: TOLERANCIA_HUECO.canal })
  out.hueco = fotos.map((f) => ({ clip: f.c, ...f.dif }))
  if (process.env.TUT_DEPURA) console.log(tam, JSON.stringify(out.hueco))
  // El velo al 35 % cambia los píxeles de lo que tapa en decenas por canal; lo que se tolera es
  // el suavizado del texto al cambiar la composición (medido: máx. 15, media ≤ 2,1).
  const tapados = fotos.filter((f) => f.dif.distintos > 0 || f.dif.media >= TOLERANCIA_HUECO.media)
  if (!fotos.length) falla('tut.hueco', 'ningún recorte que comparar')
  else if (tapados.length) falla('tut.hueco', `${tapados.length} de ${fotos.length} recortes de dentro de los huecos cambian con la capa (el velo los tapa): ${tapados.map((f) => `media ${f.dif.media}, ${f.dif.distintos} px > ${TOLERANCIA_HUECO.canal}`).join('; ')}`)
  else pasa('tut.hueco')

  if (capa.bajos.length) falla('tut.contraste', capa.bajos.map(([k, v]) => `${k} ${v}`).join(', '))
  else if (!('texto' in capa.contraste)) falla('tut.contraste', 'sin texto que medir')
  else pasa('tut.contraste')

  const chicos = capa.botones.filter((b) => b.w < 44 || b.h < 44)
  if (!capa.botones.length) falla('tut.44', 'la capa no tiene botones')
  else if (chicos.length) falla('tut.44', chicos.map((b) => `${b.accion} ${b.w}×${b.h}`).join(', '))
  else pasa('tut.44')

  // ── El toque real con `unico` ──
  await page.evaluate(() => {
    window.__toques = []
    window.addEventListener('click', (ev) => {
      const e = ev.target instanceof Element ? ev.target : null
      window.__toques.push(e?.closest('[data-accion]')?.dataset.accion ?? (e?.classList.contains('tut-banda') ? 'banda' : (e?.tagName ?? '?').toLowerCase()))
      ev.stopPropagation()
      ev.preventDefault()
    }, true)
  })
  await page.evaluate((p) => window.__tut.montar(p), PASO_1_UNICO)
  if (!(await page.evaluate(LISTO))) throw new Error(`${tam}: la capa con «unico» no se colocó`)
  const centro = (q) => page.evaluate((s) => {
    const r = document.querySelector(s)?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null
  }, q)
  const enPasar = await centro('.action-buttons [data-accion="pasar"]')
  const fuera = await centro('.action-buttons [data-accion="retirarse"]') ?? await centro('.action-buttons [data-accion="apostar"]')
  const tocar = async (p) => (vp.movil ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y))
  await tocar(enPasar)
  await tocar(fuera)
  const marcas = await page.evaluate(() => ({
    unico: document.documentElement.hasAttribute('data-tut-unico'),
    activo: document.querySelector('[data-accion="pasar"]')?.hasAttribute('data-tut-activo') ?? false,
    gris: getComputedStyle(document.querySelector('.action-buttons [data-accion="retirarse"], .action-buttons [data-accion="apostar"]')).opacity,
  }))
  await page.evaluate(() => window.__tut.desmontar())
  const limpio = await page.evaluate(() => !document.documentElement.hasAttribute('data-tut-unico') && !document.querySelector('[data-tut-activo]'))
  const toques = await page.evaluate(() => window.__toques)
  out.toque = { toques, marcas, limpio }
  if (toques[0] !== 'pasar') falla('tut.toque', `el toque en «Pasar» lo recibió «${toques[0]}»`)
  if (toques[1] !== 'banda') falla('tut.toque', `el toque fuera del hueco lo recibió «${toques[1]}»`)
  if (!marcas.unico || !marcas.activo || marcas.gris !== '0.4') falla('tut.toque', `unico sin sus marcas (${JSON.stringify(marcas)})`)
  if (!limpio) falla('tut.toque', 'al irse la capa quedan data-tut-unico o data-tut-activo')
  pasa('tut.toque')

  // ── La tarjeta de respaldo: un ancla que ocupa la pantalla entera no deja sitio a la burbuja ──
  await page.evaluate((p) => window.__tut.montar(p), { ...PASO_2, ancla: '#root > *' })
  if (!(await page.evaluate(LISTO))) falla('tut.respaldo', 'la tarjeta de respaldo no se colocó')
  else {
    const r = await page.evaluate(() => {
      const rot = document.querySelector('.tut-rotulo:not(.tut-rotulo--medida)')
      const b = rot.getBoundingClientRect()
      return {
        modo: document.querySelector('.tut-capa').dataset.modo,
        botones: rot.querySelectorAll('.tut-btn').length,
        paso: !!rot.querySelector('.tut-controles .tut-paso'),
        barra: !!document.querySelector('.tut-capa .tut-barra'),
        dentro: b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight,
      }
    })
    out.respaldo = r
    if (r.modo !== 'tarjeta' || r.botones < 3 || !r.paso || r.barra || !r.dentro) falla('tut.respaldo', JSON.stringify(r))
    else pasa('tut.respaldo')
  }
  await page.evaluate(() => window.__tut.desmontar())

  // ── Las líneas de cada rótulo: la puerta, en 360×640; en 1920×1080 se apuntan (ahí la
  //    burbuja de tres líneas cae en la tarjeta de respaldo) ──
  if (tam === 'T1' || tam === 'T6') {
    const puerta = tam === 'T1'
    const claves = await page.evaluate(() => window.__tut.rotulos())
    out.lineas = {}
    for (const k of claves) {
      const libre = k.startsWith('tut.senal.')
      const props = libre
        ? { ancla: '[data-ancla="fila-acciones"]', rotulo: k, colocacion: 'libre' }
        : { ...PASO_2, ancla: '[data-ancla="fila-acciones"]', rotulo: k }
      await page.evaluate(({ p, k: c }) => window.__tut.montar({ ...p, vars: window.__tut.varsDe(c) }), { p: props, k })
      if (!(await page.evaluate(LISTO))) { if (puerta) falla('tut.lineas', `${k}: la capa no se colocó`); continue }
      const l = await page.evaluate(LINEAS)
      out.lineas[k] = l
      if (puerta && !l) falla('tut.lineas', `${k}: sin rótulo`)
      else if (puerta && l.lineas > 2) falla('tut.lineas', `${k}: ${l.lineas} líneas (${l.modo})`)
      await page.evaluate(() => window.__tut.desmontar())
    }
    if (puerta && !claves.length) falla('tut.lineas', 'ningún rótulo que medir')
    if (puerta) pasa('tut.lineas')
  }
  if (errores.length) falla('tut.consola', errores.slice(0, 3).join(' | '))
  return out
}

// ── T4 · la mesa de la guiada congelada, bajo un capítulo ───────────────────
async function celdaMesa(page, base, tam, vp, control) {
  const out = { fallos: [] }
  const tocar = async (sel) => {
    const p = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }, sel)
    if (!p) throw new Error(`no está «${sel}»`)
    if (vp.movil) await page.touchscreen.tap(p.x, p.y)
    else await page.mouse.click(p.x, p.y)
  }
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('main.lobby [data-accion="reglas"]', { timeout: 20000 })
  await tocar('[data-accion="reglas"]')
  await page.waitForSelector('[data-accion="csj-temas"]', { timeout: 15000 })
  await tocar('[data-accion="csj-temas"]')
  await page.waitForSelector('.tem-fila[data-capitulo="5"]', { timeout: 15000 })
  await tocar('.tem-fila[data-capitulo="5"]')
  await page.waitForSelector('.tut-capa[data-listo]', { timeout: 20000 })
  if (control === 'caja-movida') await page.addStyleTag({ content: CAJA_MOVIDA })
  if (!vp.movil) await page.mouse.move(1, 1)
  const estilo = await page.addStyleTag({ content: PAUSA })
  let d = null
  for (let k = 0; k < 6 && !d; k++) {
    const sin = async () => {
      const o = await page.addStyleTag({ content: '.tut-capa, .tut-capa *, .muestra, .muestra * { visibility: hidden !important }' })
      const c = await page.evaluate(CAJAS)
      await o.evaluate((e) => e.remove())
      return c
    }
    const s1 = await sin()
    if (control === 'caja-movida') await page.evaluate(() => { document.documentElement.dataset.tutControl = '' })
    const con = await page.evaluate(CAJAS)
    await page.evaluate(() => { delete document.documentElement.dataset.tutControl })
    const s2 = await sin()
    if (deltaCajas(s1, s2).max === 0) d = { ...deltaCajas(s2, con), n: con.length }
    else await page.waitForTimeout(250)
  }
  await estilo.evaluate((e) => e.remove())
  out.delta = d
  if (!d) out.fallos.push(`${tam} tut.mesa: la mesa congelada no se quedó quieta para medir`)
  else if (d.max !== 0) out.fallos.push(`${tam} tut.mesa: Δ ${d.max} sobre ${d.n} cajas`)
  return out
}

function deltaCajas(a, b) {
  if (a.length !== b.length) return { max: Infinity }
  let max = 0
  a.forEach((c, i) => c.forEach((v, k) => { max = Math.max(max, Math.abs(v - b[i][k])) }))
  return { max: +max.toFixed(2) }
}

export async function runTut(browser, { base }) {
  const t0 = Date.now()
  const control = process.env.TUT_CONTROL || null
  if (control && !(control in CONTROLES)) throw new Error(`TUT_CONTROL=${control}: vale «${Object.keys(CONTROLES).join('», «')}»`)
  const celdas = {}
  const fallos = []
  await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    try {
      celdas[tam] = await celda(page, base, tam, vp, control === 'caja-movida' ? null : control)
      fallos.push(...celdas[tam].fallos)
    } catch (e) {
      fallos.push(`${tam}: el recorrido se cortó: ${String(e?.message || e).split('\n')[0].slice(0, 160)}`)
    }
    // T4 · la mesa de la guiada congelada, en una página nueva del mismo aparato.
    try {
      const otra = await ctx.newPage()
      const m = await celdaMesa(otra, base, tam, vp, control)
      if (celdas[tam]) celdas[tam].mesa = m.delta
      fallos.push(...m.fallos)
    } catch (e) {
      fallos.push(`${tam} tut.mesa: el recorrido se cortó: ${String(e?.message || e).split('\n')[0].slice(0, 160)}`)
    } finally { await ctx.close() }
  }))
  const verde = fallos.length === 0 && Object.keys(celdas).length === Object.keys(T).length
  const ms = Date.now() - t0
  const resumen = Object.entries(celdas).map(([tam, c]) => `${tam} Δ ${c.delta?.conCapa.max} sobre ${c.delta?.conCapa.n} · mesa Δ ${c.mesa?.max} sobre ${c.mesa?.n}`).join(' · ')
  console.log(`  tut · ${verde ? 'VERDE' : 'ROJO'} · ${resumen} · ${(ms / 1000).toFixed(0)} s${control ? ` · CONTROL ${control}` : ''}`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  return { verde, ms, control, fallos, celdas }
}
