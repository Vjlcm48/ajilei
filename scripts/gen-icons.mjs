// ── gen-icons.mjs · Derivados del icono oficial AJILEI (campaña ICO-1) ───────
// Documento rector: docs/AJILEI_Icono_v1.0.md
//
// El MAESTRO es uno solo —`public/icons/ajilei-icon-maestro.svg`, lienzo 1024,
// anclaje óptico sellado por Victor— y los PNG del manifest y de iOS NO se
// dibujan a mano: se DERIVAN de él con este comando. Fórmula sobre constante,
// aplicada a los activos: el día que el maestro cambie, `node scripts/gen-icons.mjs`
// vuelve a escribir los tres y nadie tiene que acordarse de cuál faltaba.
//
// Cero dependencias nuevas: rasteriza con el mismo playwright-core + Edge que ya
// mide la campaña DSK (`scripts/diagDSK.mjs`), pineado en devDependencies.
//
// Determinista por construcción: el maestro no tiene texto —ni una letra— así
// que no depende de qué fuentes tenga instalada la máquina; sólo de gradientes y
// trazos. Dos corridas en la misma máquina dan el mismo byte.
//
// Uso:  node scripts/gen-icons.mjs
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'

const MAESTRO = new URL('../public/icons/ajilei-icon-maestro.svg', import.meta.url)
const DESTINO = new URL('../public/icons/', import.meta.url)

// Las tres salidas y para qué existe cada una. Los 512 y 192 son los que pide el
// manifest; el de 180 es el que iOS clava en la pantalla de inicio y que, a
// diferencia de los otros dos, NO acepta SVG.
const SALIDAS = [
  { archivo: 'icon-512.png', px: 512, para: 'manifest PWA · purpose "any maskable"' },
  { archivo: 'icon-192.png', px: 192, para: 'manifest PWA · purpose "any maskable"' },
  { archivo: 'apple-touch-icon.png', px: 180, para: 'iOS · pantalla de inicio' },
]

// Alto y ancho REALES del PNG, leídos de su cabecera IHDR (bytes 16-23 del
// fichero). Se miden del archivo escrito, no del viewport que se pidió: lo que
// se declara en la ficha es lo que hay en el disco.
const dimensionesPng = (buf) => ({
  w: buf.readUInt32BE(16),
  h: buf.readUInt32BE(20),
})

const svg = readFileSync(MAESTRO, 'utf8')
// El maestro no trae width/height, sólo viewBox: lo dimensiona el CSS al
// viewport exacto y la captura sale a pixel entero, sin reescalado intermedio.
const pagina = `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; background: #000; overflow: hidden }
  svg { display: block; width: 100vw; height: 100vh }
</style></head><body>${svg}</body></html>`

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 })
await page.setContent(pagina, { waitUntil: 'load' })

const hechos = []
for (const s of SALIDAS) {
  await page.setViewportSize({ width: s.px, height: s.px })
  // `omitBackground` se queda en false a propósito: con él la captura saldría
  // con alfa transparente donde el SVG no pinte, y estos iconos tienen que ser
  // OPACOS de borde a borde (una esquina transparente se ve como un mordisco
  // en el lanzador de Android). Que lo sean se comprueba abajo, no se supone.
  const png = await page.screenshot({ type: 'png', omitBackground: false })
  const destino = new URL(s.archivo, DESTINO)
  writeFileSync(destino, png)
  const dim = dimensionesPng(png)
  hechos.push({ ...s, dim, bytes: png.length, b64: png.toString('base64') })
}

// ── Puerta de opacidad ──────────────────────────────────────────────────────
// Se relee cada PNG YA ESCRITO en un lienzo y se muestrean las cuatro esquinas
// y el centro. Alfa 255 en las cinco = fondo opaco de verdad. Si alguna esquina
// saliera translúcida, el generador lo canta en vez de dejar el mordisco para
// que lo descubra un teléfono.
const opacidad = await page.evaluate(async (lista) => {
  const salida = []
  for (const it of lista) {
    const img = new Image()
    await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = `data:image/png;base64,${it.b64}` })
    const c = document.createElement('canvas')
    c.width = img.width; c.height = img.height
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const px = (x, y) => [...ctx.getImageData(x, y, 1, 1).data]
    const m = img.width - 1
    const puntos = { si: px(0, 0), sd: px(m, 0), ii: px(0, m), id: px(m, m), centro: px(m >> 1, m >> 1) }
    salida.push({
      archivo: it.archivo,
      opaco: Object.values(puntos).every(p => p[3] === 255),
      esquinaSI: `rgba(${puntos.si.join(',')})`,
      centro: `rgba(${puntos.centro.join(',')})`,
    })
  }
  return salida
}, hechos.map(h => ({ archivo: h.archivo, b64: h.b64 })))

await browser.close()

let todoOk = true
console.log(`maestro · ${MAESTRO.pathname.split('/').pop()} · ${svg.length} bytes · lienzo 1024`)
for (const h of hechos) {
  const o = opacidad.find(x => x.archivo === h.archivo)
  const medidaOk = h.dim.w === h.px && h.dim.h === h.px
  const ok = medidaOk && o && o.opaco
  if (!ok) todoOk = false
  console.log(`${ok ? 'OK   ' : 'FALLA'} public/icons/${h.archivo} · ${h.dim.w}x${h.dim.h} (pedido ${h.px}) · ${h.bytes} bytes · opaco=${o ? o.opaco : '?'} · esquina=${o ? o.esquinaSI : '?'} · centro=${o ? o.centro : '?'} · ${h.para}`)
}
console.log(todoOk ? '\n── ICONOS: los tres derivados con medida exacta y fondo opaco' : '\n── ICONOS: FALLA (ver arriba)')
process.exitCode = todoOk ? 0 : 1
