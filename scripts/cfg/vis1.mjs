// ── VIS-1 · Tres puertas del modo `cfg` ─────────────────────────────────────
// Rector: AJILEI_VIS-1_v1.0.md, con lo decidido en sus STOP-0 y STOP-L.
//   cfg.victoria  los botones de la victoria y de la derrota: zona ≥ 44 reales,
//                 con la escala de verdad (INV-59 la fuerza a 1 en el resto del
//                 arnés, y por eso esto no se había medido nunca con factor ≠ 1).
//                 En vertical y en apaisado bajo, además, caja de 44. En los
//                 cinco tamaños de siempre, «Ranking» cabe sin desplazar salvo en
//                 los bajos, que son pendiente de MES-PvP (no se miden aquí).
//                 Contra DESARROLLO: `?cel` no existe en el bundle.
//   cfg.contraste el texto del token atenuado ≥ 4,5 bajo su tinta (INV-79), en las
//                 pantallas del lobby, y «Eliminar cuenta». Contra el bundle, y la
//                 Sala de espera contra desarrollo (`?sal=`).
//   cfg.sonido    (ampliación) el clic SUENA al encender desde la hoja: un
//                 arranque y pico en la salida del grafo, con el espía de audio.
import { escalaReal } from '../arnes/comun.mjs'
import { PISO_WCAG, QUIETA_CSS, medirAtenuados, parseColor, peorFondo, TEXTOS, fotosTinta, asentar } from '../arnes/tinta.mjs'
import { recorrerRuta } from '../rutaMesa.mjs'

const ZONA_44 = 43.5
const CELDAS = [
  { w: 360, h: 640, movil: true },
  { w: 412, h: 915, movil: true },
  { w: 915, h: 412, movil: true },
  { w: 1366, h: 768, movil: false },
  { w: 1920, h: 1080, movil: false },
]
// Con factor distinto de 1: la división entre `--escala` solo se ve aquí.
const ESCALADAS = [
  { w: 768, h: 1024, movil: true, escala: true },
  { w: 1024, h: 620, movil: true, escala: true },
]
const idDe = (c) => `${c.w}x${c.h}`
const msj = (e) => String(e?.message ?? e).split('\n')[0]

// ── cfg.victoria ────────────────────────────────────────────────────────────
// La zona por bisección a 1/64 desde el centro del botón, ya centrado en la vista
// para que el borde de la ventana no la recorte.
const LEER_BOTON = (sel) => {
  const el = document.querySelector(sel)
  if (!el) return null
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2
  const suyo = (x, y) => {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false
    const t = document.elementFromPoint(x, y)
    return !!t && (t === el || el.contains(t))
  }
  if (!suyo(cx, cy)) return { oculto: true, caja: r.height }
  const borde = (dy) => {
    let dentro = 0, fuera = 1
    while (fuera < 800 && suyo(cx, cy + dy * fuera)) { dentro = fuera; fuera *= 2 }
    for (let i = 0; i < 16; i++) { const m = (dentro + fuera) / 2; if (suyo(cx, cy + dy * m)) dentro = m; else fuera = m }
    return dentro
  }
  const arriba = borde(-1), abajo = borde(1)
  const k = (x) => Math.round(x * 100) / 100
  return { caja: k(r.height), zona: k(arriba + abajo), izq: k(r.left), der: k(r.right), arriba: k(cy - arriba), abajo: k(cy + abajo) }
}

async function abrirFinDeMesa(browser, baseDev, celda, pantalla) {
  // Solo estos contextos llevan la escala real: el resto de `cfg` la mide forzada.
  escalaReal(true)
  let ctx
  try {
    ctx = await browser.newContext({ viewport: { width: celda.w, height: celda.h }, ...(celda.movil ? { isMobile: true, hasTouch: true } : {}) })
  } finally { escalaReal(false) }
  await ctx.addInitScript(() => { Element.prototype.requestFullscreen = function () { return Promise.reject(new Error('cfg.victoria')) } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  // Otra pasada del arnés puede escribir con vite vivo; la ruta se reintenta una vez.
  for (let i = 0; ; i++) {
    try {
      await page.goto(`${baseDev}/?cel${pantalla === 'derrota' ? '=derrota' : ''}&frase=4`, { waitUntil: 'load' })
      await recorrerRuta(page, 2, 'basico', 0, 'piso')
      break
    } catch (e) { if (i >= 1) throw e }
  }
  if (pantalla === 'victoria') {
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForSelector('.cel-screen', { timeout: 20000 })
    await page.mouse.click(1, 1)
    await page.waitForSelector('.cel-screen[data-fase="reposo"]', { timeout: 25000 })
  } else {
    await page.waitForSelector('.game-over-screen .btn-primary', { timeout: 20000 })
  }
  await page.mouse.move(2, 2)
  await page.waitForTimeout(300)
  return { ctx, page }
}

export async function victoria(browser, baseDev, anota) {
  if (!baseDev) { anota('victoria', false, { error: 'sin servidor de desarrollo: `?cel` no existe en el bundle' }); return }
  for (const celda of [...CELDAS, ...ESCALADAS]) for (const pantalla of ['victoria', 'derrota']) {
    const id = idDe(celda)
    let ctx = null
    try {
      let page
      ;({ ctx, page } = await abrirFinDeMesa(browser, baseDev, celda, pantalla))
      const selectores = pantalla === 'victoria'
        ? { salir: '.cel-acciones .btn-primary', ranking: '.cel-acciones .cel-ranking' }
        : { salir: '.game-over-screen .btn-primary' }
      const entorno = await page.evaluate(() => ({ factor: document.documentElement.style.getPropertyValue('--escala') || '1', vh: innerHeight, vw: innerWidth }))
      // Los fondos antes de nada: centrar un botón para barrerlo desplaza la pantalla.
      const fondos = await page.evaluate((s) => Object.values(s).map((x) => document.querySelector(x)?.getBoundingClientRect().bottom ?? Infinity), selectores)
      const botones = {}
      for (const [k, sel] of Object.entries(selectores)) botones[k] = await page.evaluate(LEER_BOTON, sel)
      const lista = Object.values(botones)
      const vertical = entorno.vh > entorno.vw
      const apaisadoBajo = !vertical && entorno.vh <= 600
      const zonasBien = lista.every((b) => b && !b.oculto && b.zona >= ZONA_44)
      const cajasBien = !(vertical || apaisadoBajo) || lista.every((b) => b && Math.abs(b.caja - 44) < 0.51)
      // El horizontal alto no gana caja: es lo que mantiene «Ranking» a la vista.
      const sinCrecer = vertical || apaisadoBajo || lista.every((b) => b && b.caja < 46)
      const escalaVista = !celda.escala || Number(entorno.factor) !== 1
      // En fila (apaisado bajo) no se pisan por el eje X; apilados, por el Y.
      const sinCruce = !botones.ranking || botones.salir.der <= botones.ranking.izq + 0.5 || botones.salir.abajo <= botones.ranking.arriba + 0.5
      const aLaVista = !CELDAS.includes(celda) || fondos.every((f) => f <= entorno.vh)
      anota('victoria', zonasBien && cajasBien && sinCrecer && escalaVista && sinCruce && aLaVista,
        { celda: id, pantalla, factor: entorno.factor, botones, fondos, zonasBien, cajasBien, sinCrecer, escalaVista, sinCruce, aLaVista })
    } catch (e) {
      anota('victoria', false, { celda: id, pantalla, error: msj(e) })
    } finally { await ctx?.close().catch(() => {}) }
  }
}

// ── cfg.contraste ───────────────────────────────────────────────────────────
function anotaPantalla(anota, id, pantalla, m, { sinTextos = false } = {}) {
  const medido = sinTextos ? m.n === 0 : m.n > 0
  anota('contraste', medido && m.bajo.length === 0 && m.viejos.length === 0, {
    celda: id, pantalla, n: m.n, peor: m.peor?.contraste ?? null, fondo: m.peor?.fondo ?? null, texto: m.peor?.txt ?? null,
    bajo: m.bajo, viejos: m.viejos, apagados: m.apagados, medido,
  })
}

export async function contrasteLobby(browser, { base, baseDev }, errores, anota, { abrirLobby, abrirHoja, irRetar }) {
  for (const celda of CELDAS) {
    const id = idDe(celda)
    const dpr = celda.movil ? 2 : 1
    const paso = async (nombre, fn) => {
      let ctx = null
      try {
        const abierto = await abrirLobby(browser, base, celda, errores)
        ctx = abierto.ctx
        await abierto.page.addStyleTag({ content: QUIETA_CSS })
        await fn(abierto.page)
      } catch (e) {
        anota('contraste', false, { celda: id, pantalla: nombre, error: msj(e) })
      } finally { await ctx?.close().catch(() => {}) }
    }
    await paso('lobby', async (page) => {
      // La pantalla del lobby no tiene ningún texto de este token (sonda VIS-1 §3).
      anotaPantalla(anota, id, 'lobby', await medirAtenuados(page, dpr), { sinTextos: true })
      await abrirHoja(page)
      anotaPantalla(anota, id, 'hoja', await medirAtenuados(page, dpr))
      await page.locator('.lob-fila-peligro').scrollIntoViewIfNeeded()
      await asentar(page)
      const texto = (await page.evaluate(TEXTOS)).find((t) => t.clase.includes('lob-fila-peligro') || /Eliminar/.test(t.txt))
      const fotos = await fotosTinta(page, dpr)
      const m = texto ? peorFondo(fotos, texto) : null
      anota('contraste', m?.contraste != null && m.contraste >= PISO_WCAG && parseColor(texto.color)?.rgb[0] > 200,
        { celda: id, pantalla: 'hoja · Eliminar cuenta', ...m, color: texto?.color })
    })
    await paso('rankings', async (page) => {
      await page.click('[data-accion="rankings"]')
      await page.waitForSelector('main.sal[data-ranking="maestros"][data-rnk-estado="listo"]', { timeout: 15000 })
      anotaPantalla(anota, id, 'rankings verde', await medirAtenuados(page, dpr))
      await page.click('.rnk-pestanas .sal-chip:nth-child(2)')
      await page.waitForSelector('main.sal[data-ranking="fortunas"][data-rnk-estado="listo"]', { timeout: 10000 })
      anotaPantalla(anota, id, 'rankings vino', await medirAtenuados(page, dpr))
    })
    await paso('retar', async (page) => {
      await irRetar(page)
      anotaPantalla(anota, id, 'retar', await medirAtenuados(page, dpr))
    })
    await paso('salas', async (page) => {
      await page.click('[data-accion="jugar-pvp"]')
      await page.waitForSelector('[data-accion="armar"]', { timeout: 10000 })
      anotaPantalla(anota, id, 'salas', await medirAtenuados(page, dpr))
      await page.click('[data-accion="armar"]')
      await page.waitForSelector('[data-accion="modo-privada"]', { timeout: 8000 })
      anotaPantalla(anota, id, 'armar', await medirAtenuados(page, dpr))
    })
    await paso('perfil', async (page) => {
      await page.click('.lob-top [data-accion="perfil"]')
      await page.waitForSelector('.pf-fila', { timeout: 8000 })
      anotaPantalla(anota, id, 'perfil', await medirAtenuados(page, dpr))
    })
    // La Sala de espera solo existe por `?sal=`: desarrollo y bypass.
    if (!baseDev) { anota('contraste', false, { celda: id, pantalla: 'sala de espera', error: 'sin servidor de desarrollo' }); continue }
    let ctx = null
    try {
      ctx = await browser.newContext({ viewport: { width: celda.w, height: celda.h }, deviceScaleFactor: dpr, ...(celda.movil ? { isMobile: true, hasTouch: true } : {}) })
      const page = await ctx.newPage()
      await page.goto(`${baseDev}/?sal=espera-anfitrion`, { waitUntil: 'load' })
      await page.waitForSelector('main.sal', { timeout: 12000 })
      await page.addStyleTag({ content: QUIETA_CSS })
      await page.waitForTimeout(500)
      anotaPantalla(anota, id, 'sala de espera', await medirAtenuados(page, dpr))
    } catch (e) {
      anota('contraste', false, { celda: id, pantalla: 'sala de espera', error: msj(e) })
    } finally { await ctx?.close().catch(() => {}) }
  }
}

// ── cfg.sonido · el espía de audio ──────────────────────────────────────────
// Howler corre sobre WebAudio: cada sonido es un `AudioBufferSourceNode.start`, y
// un analizador colgado de lo que llega a la salida da el pico. Hay DOS contextos
// de audio en la página y uno nace cerrado: se lee el analizador del que corre.
const ESPIA = () => {
  window.__arranques = 0
  const start = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (...a) { window.__arranques++; return start.apply(this, a) }
  const con = AudioNode.prototype.connect
  AudioNode.prototype.connect = function (d, ...r) {
    if (d === this.context.destination && !this.__espiado) {
      const an = this.context.createAnalyser(); an.fftSize = 2048
      con.call(this, an)
      this.__espiado = true
      ;(window.__analizadores ??= []).push(an)
    }
    return con.call(this, d, ...r)
  }
  window.__pico = (ms) => new Promise((ok) => {
    let pico = 0
    const buf = new Float32Array(2048)
    const t0 = performance.now()
    const id = setInterval(() => {
      const an = (window.__analizadores ?? []).find((a) => a.context.state === 'running')
      if (an) { an.getFloatTimeDomainData(buf); for (const v of buf) if (Math.abs(v) > pico) pico = Math.abs(v) }
      if (performance.now() - t0 > ms) { clearInterval(id); ok(Math.round(pico * 10000) / 10000) }
    }, 10)
  })
}
const SUENA = 0.05
const CALLA = 0.01

async function tocar(page, selector, ms = 900) {
  await page.evaluate(() => { window.__arranques = 0 })
  const pico = page.evaluate((m) => window.__pico(m), ms)
  await page.click(selector)
  return { pico: await pico, arranques: await page.evaluate(() => window.__arranques) }
}

export async function sonidoAudio(browser, base, errores, anota, { abrirLobby, abrirHoja }) {
  const celda = { w: 412, h: 915, movil: true }
  const id = idDe(celda)
  // 1 · Con el sonido encendido al entrar: control, apagar y encender.
  let ctx = null
  try {
    let page
    ;({ ctx, page } = await abrirLobby(browser, base, celda, errores, { antes: (c) => c.addInitScript(ESPIA) }))
    await abrirHoja(page)
    const control = await tocar(page, '[data-accion="acerca"]')
    await page.waitForTimeout(150)
    const apagar = await tocar(page, '[data-accion="cfg-sonido"]')
    const encender = await tocar(page, '[data-accion="cfg-sonido"]')
    const pastilla = await page.evaluate(() => document.querySelector('[data-accion="cfg-sonido"] .lob-pastilla').textContent)
    anota('sonido', control.arranques >= 1 && control.pico > SUENA, { celda: id, que: 'control: otra fila de la hoja suena (el espía oye)', ...control })
    anota('sonido', encender.arranques === 1 && encender.pico > SUENA && pastilla === 'Sí', { celda: id, que: 'encender: el clic suena', ...encender, pastilla })
    anota('sonido', apagar.pico < CALLA, { celda: id, que: 'apagar: no se oye (Howler.mute lo corta)', ...apagar })
  } catch (e) {
    anota('sonido', false, { celda: id, que: 'audio', error: msj(e) })
  } finally { await ctx?.close().catch(() => {}) }
  // 2 · Entrando con el sonido apagado guardado: el sonido nace en ese clic.
  ctx = null
  try {
    let page
    ;({ ctx, page } = await abrirLobby(browser, base, celda, errores, {
      antes: async (c) => {
        await c.addInitScript(ESPIA)
        await c.addInitScript(() => { if (!sessionStorage.getItem('vis1.sonido')) { localStorage.setItem('ajilei.sound', 'off'); sessionStorage.setItem('vis1.sonido', '1') } })
      },
    }))
    await abrirHoja(page)
    const antes = await page.evaluate(() => document.querySelector('[data-accion="cfg-sonido"] .lob-pastilla').textContent)
    const encender = await tocar(page, '[data-accion="cfg-sonido"]', 1500)
    anota('sonido', antes === 'No' && encender.arranques === 1 && encender.pico > SUENA, { celda: id, que: 'entrando apagado: el clic suena al encender', ...encender, antes })
  } catch (e) {
    anota('sonido', false, { celda: id, que: 'audio, entrando apagado', error: msj(e) })
  } finally { await ctx?.close().catch(() => {}) }
}
