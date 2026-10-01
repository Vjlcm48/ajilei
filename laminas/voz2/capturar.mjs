// VOZ-2 · Capturas de la lámina de la frase recogida y de la capa desplegada.
//
//   npm run build && npx vite preview --port 4173      (en otra terminal)
//   node laminas/voz2/capturar.mjs                      (las 20 celdas)
//   node laminas/voz2/capturar.mjs --celdas=360x640     (filtra por subcadena)
//
// Rector: AJILEI_VOZ-2_Fase1_v1.0.md §2 1a-iii. Llega a la mesa REAL —el pago
// de una mano jugada, `vite preview` con la sesión simulada de CAP-1— con el
// mismo conductor que las puertas (`scripts/voz2/voz2Mesa.mjs`), y por celda:
//
//   · `capturas/<celda>_mesa.jpg`             la mesa entera en el pago;
//   · `capturas/<celda>_<forma>_<var>.jpg`    el ÓVALO recortado, con cada una
//     de las 9 formas en cada variante de líneas (l1 · l2 · l2a, ver abajo),
//     pintado por el producto: la hoja `voz2.css` con sus dos propiedades
//     redefinidas desde aquí, no una imitación;
//   · `capturas/medidas.json` (+ `medidas.js`, la misma cifra para que la
//     lámina la lea por file:// sin servidor): cajas de lo que la capa podría
//     tapar, glifos visibles y marca de recorte por forma y variante;
//   · `capturas/hoja.png`, la hoja de contacto: la propia lámina en `?hoja=1`.
//
// Las capturas sueltas NO entran al repo (criterio AJF-1/BIE-1): este script
// las regenera. Entran el script, la lámina, `medidas.json` y `hoja.png`.
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as V from '../../scripts/voz2/voz2Mesa.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DIR = resolve(AQUI, 'capturas')
const BASE = process.env.PUE_BASE || 'http://localhost:4173'
const filtro = (process.argv.find((a) => a.startsWith('--celdas=')) || '').split('=')[1] || ''
mkdirSync(DIR, { recursive: true })

// Las tres variantes de «recogida» del interruptor 1 de la lámina:
//   l1  · 1 línea;
//   l2  · 2 líneas con el interlineado de hoy (el valor provisional de voz2.css);
//   l2a · 2 líneas con el interlineado AJUSTADO para que quepan exactas en la
//         caja del `<p>`: min(interlineado de hoy, alto del `<p>` / 2). En 28 px
//         son 14 px; en la caja de 16 px de 844×390 son 8 px para letra de 9,
//         y se enseña tal cual se lee (la ficha pide honestidad, no maquillaje).
//         Donde ya caben (54 y 36 px) es igual a l2; en `two-ovals` el `<p>`
//         no tiene alto fijo y también es igual a l2.
const VARIANTES = {
  l1: () => '.game-table-screen .voz2-texto { --voz2-lineas: 1; }',
  l2: () => null,
  l2a: (px) => `.game-table-screen .voz2-texto { --voz2-lineas: 2; --voz2-interlinea: ${px}px; }`,
}

// Lo que la capa podría tapar, más el origen y el destino del vuelo.
const ENTORNO = () => {
  const r2 = (x) => Math.round(x * 100) / 100
  const caja = (b) => (b ? { x: r2(b.left), y: r2(b.top), w: r2(b.width), h: r2(b.height) } : null)
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
  const union = (els) => {
    const bs = els.filter(vis).map((e) => e.getBoundingClientRect()).filter((b) => b.width > 0)
    if (!bs.length) return null
    const l = Math.min(...bs.map((b) => b.left)), t = Math.min(...bs.map((b) => b.top))
    return caja({ left: l, top: t, width: Math.max(...bs.map((b) => b.right)) - l, height: Math.max(...bs.map((b) => b.bottom)) - t })
  }
  const p = [...document.querySelectorAll('.game-message')].find(vis)
  const sp = p.querySelector('.voz2-texto')
  const ovalo = p.closest('.felt-oval') || p.closest('.center-zone')
  const rivales = [...document.querySelectorAll('.opp-panel, .ai-zone')].filter(vis)
  const cs = getComputedStyle(p)
  return {
    vp: { w: innerWidth, h: innerHeight },
    ovalo: caja(ovalo.getBoundingClientRect()), msg: caja(p.getBoundingClientRect()), texto: caja(sp.getBoundingClientRect()),
    pAlto: p.clientHeight, pFijo: cs.height !== 'auto' && !p.closest('.felt-oval'), interlinea: parseFloat(cs.lineHeight), fuente: parseFloat(cs.fontSize),
    cartasJugador: union([...document.querySelectorAll('.player-zone .playing-card')]),
    cartasRivales: rivales.map((z) => union([...z.querySelectorAll('.playing-card')])).filter(Boolean),
    nombresRivales: [...document.querySelectorAll('.opp-name, .ai-name')].filter(vis).map((e) => caja(e.getBoundingClientRect())),
    ranura: caja(document.querySelector('.player-bar .action-area')?.getBoundingClientRect()),
    siguiente: caja([...document.querySelectorAll('.player-bar .action-area button')].find((b) => /Siguiente mano/.test(b.textContent))?.getBoundingClientRect()),
    pozoMoneda: caja(document.querySelector('[data-coin-source="pot"] .chip-token')?.getBoundingClientRect()),
    destino: union([...document.querySelectorAll('.win-score-chip')]),
    ruta: p.closest('.two-ovals') ? 'two-ovals' : 'center-zone',
  }
}

// Fija el texto (en el `.voz2-texto` real) y la variante, y deja la página
// lista para fotografiar: dos fotogramas para que se pinte.
const PONER = async ({ texto, estilo }) => {
  let tag = document.getElementById('voz2-variante')
  if (!tag) { tag = document.createElement('style'); tag.id = 'voz2-variante'; document.head.appendChild(tag) }
  tag.textContent = estilo || ''
  const p = [...document.querySelectorAll('.game-message')].find((e) => e.getClientRects().length)
  const sp = p.querySelector('.voz2-texto')
  if (texto != null) sp.textContent = texto
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  // Final de lo visible: caja del último glifo que cae dentro del recorte
  // (para colocar el indicio de toque detrás del «…»).
  const b = sp.getBoundingClientRect()
  const tn = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT).nextNode()
  const rg = document.createRange()
  let ult = null
  for (let i = 0; tn && i < tn.length; i++) {
    rg.setStart(tn, i); rg.setEnd(tn, i + 1)
    const q = rg.getBoundingClientRect()
    if (q.width > 0 && q.left >= b.left - 0.5 && q.right <= b.right + 0.5 && q.top >= b.top - 0.5 && q.bottom <= b.bottom + 0.5) ult = q
  }
  const r2 = (x) => Math.round(x * 100) / 100
  return { texto: { x: r2(b.x), y: r2(b.y), w: r2(b.width), h: r2(b.height) },
    interlinea: parseFloat(getComputedStyle(sp).lineHeight),
    ultimo: ult ? { x: r2(ult.right), y: r2(ult.top), h: r2(ult.height) } : null }
}

const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const medidas = { edge: navegador.version(), generado: new Date().toISOString(), base: BASE, variantes: Object.keys(VARIANTES), celdas: {} }
const tareas = []
for (const v of V.VISTAS_VOZ2) for (const n of V.MESAS_VOZ2) if (V.etiquetaCelda(v, n).includes(filtro)) tareas.push([v, n])

await V.enPool(tareas, 4, async ([v, n]) => {
  const etq = V.etiquetaCelda(v, n), arch = V.archivoCelda(v, n)
  const dpr = v.movil ? 2 : 1
  let abierta
  try { abierta = await V.abrirCeldaEnPago(navegador, v, n, BASE, { dpr }) } catch (e) { console.log(`${etq} · ERROR ${e.message}`); return }
  const { ctx, page } = abierta
  try {
    const formas = V.formasVoz2(n)
    const ent = await page.evaluate(ENTORNO)
    await page.screenshot({ path: `${DIR}/${arch}_mesa.jpg`, type: 'jpeg', quality: 86 })
    // l2a: el interlineado que hace caber dos líneas en la caja del `<p>`.
    const ajustada = ent.pFijo ? Math.min(ent.interlinea, Math.floor((ent.pAlto / 2) * 64) / 64) : ent.interlinea
    const celda = { vista: v.id, mesa: n, dpr, real: await page.evaluate(() => document.querySelector('.voz2-texto')?.textContent), interlineaAjustada: ajustada, ...ent, formas: {} }
    const clip = { x: ent.ovalo.x, y: ent.ovalo.y, width: ent.ovalo.w, height: ent.ovalo.h }
    for (const [vid, fn] of Object.entries(VARIANTES)) {
      const estilo = fn(ajustada)
      // Primero, la variante en su sitio: `PONER` deja su hoja puesta entre
      // fotos, y si se midiera antes de cambiarla se mediría la variante
      // ANTERIOR (pasó: «2 líneas» salió con las cifras de «1 línea»).
      await page.evaluate(PONER, { texto: null, estilo })
      // La misma vara que las puertas: geometría síncrona y marca del producto.
      const m = await page.evaluate(V.MEDIR_VOZ2, { formas, estilo })
      const marcas = await V.leerMarcas(page, formas, estilo)
      for (const f of formas) {
        const pos = await page.evaluate(PONER, { texto: f.texto, estilo })
        await page.screenshot({ path: `${DIR}/${arch}_${f.id.replace(/\W+/g, '_')}_${vid}.jpg`, type: 'jpeg', quality: 88, clip })
        const mf = m.formas.find((x) => x.id === f.id)
        celda.formas[f.id] ??= { texto: f.texto, car: f.texto.length, var: {} }
        celda.formas[f.id].var[vid] = {
          visibles: mf.visibles, leidos: mf.leidos, total: mf.total, marca: marcas?.[f.id] === '1',
          dOvalo: +V.deltaCaja(m.base.ovalo, mf.anclas.ovalo).toFixed(2), dMsg: +V.deltaCaja(m.base.msg, mf.anclas.msg).toFixed(2),
          ...pos,
        }
      }
    }
    await page.evaluate(PONER, { texto: celda.real, estilo: null })
    medidas.celdas[etq] = celda
    console.log(`${etq} · ok · real «${celda.real}» · l2a ${ajustada}px`)
  } catch (e) { console.log(`${etq} · ERROR ${e.message}`) } finally { await ctx.close() }
})

writeFileSync(`${DIR}/medidas.json`, JSON.stringify(medidas, null, 2))
writeFileSync(`${DIR}/medidas.js`, `window.VOZ2_MEDIDAS = ${JSON.stringify(medidas)};\n`)

// Hoja de contacto: la propia lámina, en su modo hoja, a ancho fijo.
const hoja = await navegador.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
const errores = []
hoja.on('pageerror', (e) => errores.push(e.message))
await hoja.goto(`${pathToFileURL(resolve(AQUI, 'lamina.html')).href}?hoja=1`, { waitUntil: 'load' })
await hoja.waitForFunction(() => window.__voz2Listo === true, null, { timeout: 30000 })
await hoja.screenshot({ path: `${DIR}/hoja.png`, fullPage: true })
console.log(`hoja.png${errores.length ? ' · errores: ' + errores.join(' | ') : ''}`)
await navegador.close()
