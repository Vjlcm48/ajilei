// AJF-1 · Capturas de la lámina del botón «Jugar contra jugadores».
//
//   npx vite --port 5174                      (servidor de desarrollo, con bypass)
//   node laminas/ajf1/capturar.mjs            (AJF1_BASE para otro puerto)
//
// Abre `lamina.html?solo=1` —el lobby real a pantalla completa con la variante
// inyectada— en un contexto nuevo por captura, a la vista y la densidad de cada
// caso, y espera a `window.__ajf1Listo`. Escribe `capturas/<vista>_<variante>.png`
// y `capturas/medidas.json` (cajas y líneas de los dos CTA, desborde).
// «hoy» va como referencia junto a las cuatro variantes.
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.AJF1_BASE || 'http://localhost:5174'
const DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'capturas')
const VISTAS = [
  { id: '1920x1080', w: 1920, h: 1080, dpr: 1, movil: false },
  { id: '390x844',   w: 390,  h: 844,  dpr: 3, movil: true },
  { id: '360x640',   w: 360,  h: 640,  dpr: 3, movil: true },
]
const VARIANTES = ['hoy', 'A', 'B', 'C', 'AI']

mkdirSync(DIR, { recursive: true })
const navegador = await chromium.launch({ channel: 'msedge', headless: true })
const medidas = { edge: navegador.version(), base: BASE, casos: [] }
for (const vista of VISTAS) {
  for (const v of VARIANTES) {
    const ctx = await navegador.newContext({
      viewport: { width: vista.w, height: vista.h }, deviceScaleFactor: vista.dpr,
      ...(vista.movil ? { isMobile: true, hasTouch: true } : {}),
    })
    const page = await ctx.newPage()
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.goto(`${BASE}/laminas/ajf1/lamina.html?solo=1&v=${v}`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__ajf1Listo === true, null, { timeout: 30000 })
    const m = await page.evaluate(() => window.__ajf1Medida())
    const archivo = `${vista.id}_${v}.png`
    await page.screenshot({ path: resolve(DIR, archivo) })
    medidas.casos.push({ ...m, medido: m.vista, vista: vista.id, variante: v, archivo, errores })
    const f = (c) => `${c.w}×${c.h} ${c.lineas}L${c.rebosa ? ' REBOSA' : ''}`
    console.log(`${vista.id.padEnd(9)} ${v.padEnd(3)} · IAS ${f(m.ia)} · jugadores ${f(m.pvp)} · ${m.desborde ? 'DESBORDA' : 'sin desborde'}${errores.length ? ` · ${errores.length} errores` : ''}`)
    await ctx.close()
  }
}
writeFileSync(resolve(DIR, 'medidas.json'), JSON.stringify(medidas, null, 2))

// La hoja de contacto: variantes en filas, vistas en columnas, el CENTRO del
// lobby recortado (marca y acción) para que los botones se lean sin lupa.
const NOMBRES = { hoy: 'Hoy (referencia)', A: 'A · contorno', B: 'B · vinotinto', C: 'C · iconos', AI: 'A + icono' }
const uri = (a) => 'data:image/png;base64,' + readFileSync(resolve(DIR, a)).toString('base64')
const celdas = VARIANTES.map((v) => `<tr><th>${NOMBRES[v]}</th>${VISTAS.map((vista) => {
  const c = medidas.casos.find((x) => x.vista === vista.id && x.variante === v)
  // Ventana alrededor de los dos CTA, en px CSS: de 40 px sobre el de las IAS a 40 bajo el de jugadores.
  const y0 = Math.max(0, c.ia.y - 40), y1 = Math.min(vista.h, c.pvp.y + c.pvp.h + 40)
  const x0 = Math.max(0, c.ia.x - 30), x1 = Math.min(vista.w, c.ia.x + c.ia.w + 30)
  const esc = 440 / (x1 - x0)
  return `<td><div class="v" style="width:${(x1 - x0) * esc}px;height:${(y1 - y0) * esc}px">
    <img src="${uri(c.archivo)}" style="width:${vista.w * esc}px;left:${-x0 * esc}px;top:${-y0 * esc}px"></div></td>`
}).join('')}</tr>`).join('')
const hoja = await navegador.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 })
await hoja.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;padding:20px;background:#0b1a10;color:#f5edd8;font:14px system-ui,"Segoe UI",sans-serif}
  table{border-collapse:separate;border-spacing:14px 10px} th{font-weight:600;text-align:left;vertical-align:middle;white-space:nowrap}
  thead th{text-align:center;color:#b9b29f;font-weight:500} .v{position:relative;overflow:hidden;border-radius:6px;box-shadow:0 0 0 1px rgba(245,237,216,.16)}
  .v img{position:absolute;max-width:none} h1{font-size:16px;margin:0 0 4px 14px}
  </style><h1>AJF-1 · «Jugar contra jugadores» · cuatro variantes sobre el lobby real · Edge ${medidas.edge}</h1>
  <table><thead><tr><th></th>${VISTAS.map((v) => `<th>${v.w}×${v.h}</th>`).join('')}</tr></thead><tbody>${celdas}</tbody></table>`)
await hoja.waitForFunction(() => [...document.images].every((i) => i.complete))
await hoja.screenshot({ path: resolve(DIR, 'hoja.png'), fullPage: true })
await navegador.close()
console.log(`hoja de contacto → ${resolve(DIR, 'hoja.png')}`)
