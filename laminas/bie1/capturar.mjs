// BIE-1 · Capturas de la lámina del indicador «Cargando».
//
//   node laminas/bie1/capturar.mjs
//
// Abre `lamina.html?solo=1` por file:// —no hace falta servidor: la lámina lee
// `theme.css` y el isotipo por ruta relativa— a cada vista, con las animaciones
// congeladas en la MISMA fase (`fase=0.3`: el primer punto en su cresta, el
// segundo subiendo, el tercero aún apagado; el tramo de la barra entrando), y
// escribe `capturas/<vista>_<forma><iso>.png`, `capturas/medidas.json` (caja
// del indicador y su descentrado respecto de la pantalla) y `capturas/hoja.png`.
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DIR = resolve(AQUI, 'capturas')
const LAMINA = pathToFileURL(resolve(AQUI, 'lamina.html')).href
const VISTAS = [
  { id: '1920x1080', w: 1920, h: 1080, dpr: 1, movil: false },
  { id: '390x844',   w: 390,  h: 844,  dpr: 2, movil: true },
  { id: '360x640',   w: 360,  h: 640,  dpr: 2, movil: true },
  { id: '844x390',   w: 844,  h: 390,  dpr: 2, movil: true },
]
const CASOS = [
  { forma: 'P', iso: 1, nombre: 'P · con isotipo' },
  { forma: 'P', iso: 0, nombre: 'P · sin isotipo' },
  { forma: 'B', iso: 1, nombre: 'B · con isotipo' },
  { forma: 'B', iso: 0, nombre: 'B · sin isotipo' },
]
const FASE = 0.3

mkdirSync(DIR, { recursive: true })
const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const medidas = { edge: navegador.version(), fase: FASE, casos: [] }
for (const vista of VISTAS) {
  for (const c of CASOS) {
    const ctx = await navegador.newContext({
      viewport: { width: vista.w, height: vista.h }, deviceScaleFactor: vista.dpr,
      ...(vista.movil ? { isMobile: true, hasTouch: true } : {}),
    })
    const page = await ctx.newPage()
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    page.on('requestfailed', (r) => errores.push(`no cargó ${r.url()}`))
    await page.goto(`${LAMINA}?solo=1&forma=${c.forma}&iso=${c.iso}&fase=${FASE}`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__bieListo === true, null, { timeout: 15000 })
    const m = await page.evaluate(() => {
      const caja = (e) => { const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } }
      const ind = document.querySelector('#capa-indicador > .bie-indicador')
      const r = caja(ind)
      const iso = document.getElementById('iso')
      const texto = [...ind.querySelectorAll('.bie-texto')].find((t) => t.offsetParent !== null)
      return {
        indicador: r,
        dxCentro: +((r.x + r.w / 2) - innerWidth / 2).toFixed(2),
        dyCentro: +((r.y + r.h / 2) - innerHeight / 2).toFixed(2),
        isoCaja: iso.hidden ? null : caja(iso),
        isoCargado: iso.hidden ? null : iso.naturalWidth > 0,
        fuente: texto ? getComputedStyle(texto).fontSize : null,
        status: ind.getAttribute('role'), vivo: ind.getAttribute('aria-live'),
        desborde: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
      }
    })
    const archivo = `${vista.id}_${c.forma}${c.iso ? '-iso' : ''}.png`
    await page.screenshot({ path: resolve(DIR, archivo) })
    medidas.casos.push({ ...m, vista: vista.id, ...c, archivo, errores })
    console.log(`${vista.id.padEnd(9)} ${c.nombre.padEnd(16)} · indicador ${m.indicador.w}×${m.indicador.h} · Δcentro ${m.dxCentro},${m.dyCentro} · texto ${m.fuente}${m.isoCaja ? ` · iso ${m.isoCaja.w}×${m.isoCaja.h}${m.isoCargado ? '' : ' SIN CARGAR'}` : ''}${m.desborde ? ' · DESBORDA' : ''}${errores.length ? ` · ${errores.length} errores` : ''}`)
    await ctx.close()
  }
}
writeFileSync(resolve(DIR, 'medidas.json'), JSON.stringify(medidas, null, 2))

// La hoja: los cuatro casos en filas, las cuatro vistas en columnas. Cada celda
// es la pantalla ENTERA reducida (se ve dónde cae el indicador) y debajo un
// recorte alrededor del indicador a su tamaño (se ve cómo es).
const uri = (a) => 'data:image/png;base64,' + readFileSync(resolve(DIR, a)).toString('base64')
const ANCHO = 300
const celda = (c, vista) => {
  const k = ANCHO / vista.w
  const r = c.indicador, pad = 28
  const x0 = Math.max(0, r.x - pad), y0 = Math.max(0, r.y - pad)
  const x1 = Math.min(vista.w, r.x + r.w + pad), y1 = Math.min(vista.h, r.y + r.h + pad)
  const kz = Math.min(1.6, ANCHO / (x1 - x0))
  return `<td><div class="v" style="width:${ANCHO}px;height:${Math.round(vista.h * k)}px"><img src="${uri(c.archivo)}" style="width:${ANCHO}px;left:0;top:0"></div>
    <div class="v z" style="width:${Math.round((x1 - x0) * kz)}px;height:${Math.round((y1 - y0) * kz)}px"><img src="${uri(c.archivo)}" style="width:${Math.round(vista.w * kz)}px;left:${-Math.round(x0 * kz)}px;top:${-Math.round(y0 * kz)}px"></div></td>`
}
const filas = CASOS.map((c) => `<tr><th>${c.nombre}</th>${VISTAS.map((v) => celda(medidas.casos.find((x) => x.vista === v.id && x.forma === c.forma && x.iso === c.iso), v)).join('')}</tr>`).join('')
const hoja = await navegador.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1.5 })
await hoja.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;padding:18px;background:#050d08;color:#f5edd8;font:14px Arial,sans-serif}
  h1{font-size:16px;margin:0 0 6px 12px} table{border-collapse:separate;border-spacing:12px 14px}
  th{font-weight:600;text-align:left;vertical-align:top;white-space:nowrap;padding-top:6px}
  thead th{text-align:center;color:#b9b29f;font-weight:400} td{vertical-align:top}
  .v{position:relative;overflow:hidden;border-radius:5px;box-shadow:0 0 0 1px rgba(245,237,216,.18)} .v img{position:absolute;max-width:none}
  .z{margin-top:8px}
  </style><h1>BIE-1 · indicador «Cargando» · P (puntos) y B (barra indeterminada), con y sin isotipo · fase ${FASE} · Edge ${medidas.edge}</h1>
  <table><thead><tr><th></th>${VISTAS.map((v) => `<th>${v.w}×${v.h}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table>`)
await hoja.waitForFunction(() => [...document.images].every((i) => i.complete))
await hoja.screenshot({ path: resolve(DIR, 'hoja.png'), fullPage: true })
await navegador.close()
console.log(`hoja de contacto → ${resolve(DIR, 'hoja.png')}`)
