// ── VIS-1 · El contraste bajo la tinta ──────────────────────────────────────
// Rector: AJILEI_VIS-1_v1.0.md y el §10 de su sonda. Lo usan `cfg.contraste`,
// `tie.contraste` y `luz` p2.
//
// POR QUÉ NO BAJO LA CAJA DE LÍNEA. Muestrear toda la caja del texto da cifras
// falsas: en 915×412 salía 1,72 por el borde punteado de un hueco de carta que
// cruzaba la caja sin tocar una letra. Aquí se hacen dos fotos congeladas, con
// texto y sin él, y solo cuentan los píxeles que cambian: esa es la tinta.
//
// LA FÓRMULA ES SEVERA A PROPÓSITO. Se compone el color del texto (su alfa por
// la opacidad de sus antepasados) sobre el fondo más claro bajo sus letras. Da
// algo menos que leer los píxeles de una letra plena a 3× (4,47 frente a 4,67 en
// el mismo texto), y por eso una misma vara sirve para todo sin excepciones.
import { inflateSync } from 'node:zlib'
import { conRepeticion } from './repetir.mjs'

export const PISO_WCAG = 4.5

/** PNG de 8 bits, RGB o RGBA, sin entrelazar: lo que da `page.screenshot()`. */
export function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ct = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), tipo = buf.toString('latin1', p + 4, p + 8)
    if (tipo === 'IHDR') { w = buf.readUInt32BE(p + 8); h = buf.readUInt32BE(p + 12); ct = buf[p + 17] }
    if (tipo === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len))
    p += 12 + len
  }
  const bpp = ct === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const out = Buffer.alloc(w * h * 3)
  const fila = w * bpp
  const prev = Buffer.alloc(fila), cur = Buffer.alloc(fila)
  let q = 0
  for (let y = 0; y < h; y++) {
    const f = raw[q++]
    for (let x = 0; x < fila; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0
      let v = raw[q++]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[x] = v & 255
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 3
      out[o] = cur[x * bpp]; out[o + 1] = cur[x * bpp + 1]; out[o + 2] = cur[x * bpp + 2]
    }
    cur.copy(prev)
  }
  return { w, h, px: out, at: (x, y) => { const o = (y * w + x) * 3; return [out[o], out[o + 1], out[o + 2]] } }
}

const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export const contraste = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05) }
export const compone = (t, alfa, b) => [0, 1, 2].map((i) => t[i] * alfa + b[i] * (1 - alfa))
export const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
export const r2 = (x) => Math.round(x * 100) / 100
export function parseColor(s) {
  let m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s)
  if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] }
  m = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(s)
  if (m) return { rgb: [+m[1] * 255, +m[2] * 255, +m[3] * 255], a: m[4] === undefined ? 1 : +m[4] }
  return null
}

const OCULTA_CSS = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; text-decoration-color: transparent !important; }
::placeholder { color: transparent !important; }`
export const QUIETA_CSS = '*, *::before, *::after { transition: none !important; caret-color: transparent !important; }'

/** Todas las animaciones paradas en su fase 0: dos fotos seguidas salen iguales. */
export const parar = (page) => page.evaluate(() => {
  for (const a of document.getAnimations()) { try { a.pause(); a.currentTime = 0 } catch { /* sin línea de tiempo */ } }
  return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))
})

/**
 * ARN-4 A10a · todas en su estado FINAL, y las infinitas en pausa. En la Portada los
 * textos entran por animación con `forwards`: la fase 0 de `parar` los dejaría
 * invisibles, y un texto invisible no se mide.
 */
export const fijar = (page) => page.evaluate(() => {
  for (const a of document.getAnimations()) {
    try { if (a.effect?.getComputedTiming().iterations === Infinity) a.pause(); else a.finish() } catch { /* sin línea de tiempo */ }
  }
  return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))
})

/** Espera a que dos fotos seguidas salgan iguales: el póster y el fieltro se pintan con retraso. */
export async function asentar(page, quieto = parar) {
  let previa = null
  for (let i = 0; i < 14; i++) {
    await quieto(page)
    const foto = await page.screenshot()
    if (previa && foto.equals(previa)) return
    previa = foto
    await page.waitForTimeout(350)
  }
}

/** Cada texto visible y arriba en su punto, con su color, su opacidad acumulada y sus cajas. */
export const TEXTOS = () => {
  const out = []
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = w.nextNode())) {
    const t = n.textContent.replace(/\s+/g, ' ').trim()
    if (!t) continue
    const el = n.parentElement
    if (!el || el.closest('script,style,noscript')) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const r = document.createRange(); r.selectNodeContents(n)
    const rects = [...r.getClientRects()]
      .filter((q) => q.width > 1 && q.height > 1 && q.bottom > 0 && q.right > 0 && q.top < innerHeight && q.left < innerWidth)
    if (!rects.length) continue
    let op = 1
    for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity)
    if (op < 0.02) continue
    const c = rects[0]
    const top = document.elementFromPoint(Math.min(innerWidth - 1, c.left + c.width / 2), Math.min(innerHeight - 1, c.top + c.height / 2))
    if (!top || !(top === el || el.contains(top) || top.contains(el))) continue
    out.push({
      txt: t.slice(0, 44),
      clase: typeof el.className === 'string' ? el.className.trim() : '',
      enVitrina: !!el.closest('.vit'),
      color: cs.color,
      op,
      rects: rects.map((q) => ({ l: q.left, t: q.top, r: q.right, b: q.bottom })),
    })
  }
  return out
}

/** Las dos fotos: con el texto y sin él. */
export async function fotosTinta(page, dpr, quieto = parar) {
  await quieto(page)
  const con = decodePNG(await page.screenshot())
  const oculta = await page.addStyleTag({ content: OCULTA_CSS })
  await quieto(page)
  const sin = decodePNG(await page.screenshot())
  await oculta.evaluate((n) => n.remove())
  return { con, sin, dpr }
}

/**
 * ARN-4 A5 · una medida sobre las dos fotos, con la repetición de los rojos de foto.
 * Se repite la PAREJA: un redibujado entre las dos se contaría como tinta.
 */
export const tintaConRepeticion = (page, dpr, etiqueta, medir, dentro, quieto = parar) =>
  conRepeticion(etiqueta, async () => medir(await fotosTinta(page, dpr, quieto)), dentro)

/**
 * El peor fondo bajo la tinta de un texto. `color` fuerza otro color que el suyo.
 * @returns {{contraste:number|null, fondo:string|null, alfa:number}|null} `contraste`
 *   nulo si no hay tinta (el texto no se ha medido, y eso no es un aprobado).
 */
export function peorFondo(fotos, texto, color = null) {
  const col = color ?? parseColor(texto.color)
  if (!col) return null
  const alfa = col.a * texto.op
  let peor = null
  for (const q of texto.rects) {
    const x0 = Math.max(0, Math.floor(q.l * fotos.dpr)), x1 = Math.min(fotos.sin.w, Math.ceil(q.r * fotos.dpr))
    const y0 = Math.max(0, Math.floor(q.t * fotos.dpr)), y1 = Math.min(fotos.sin.h, Math.ceil(q.b * fotos.dpr))
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const b = fotos.sin.at(x, y), a = fotos.con.at(x, y)
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 18) continue
      const c = contraste(compone(col.rgb, alfa, b), b)
      if (!peor || c < peor.c) peor = { c, b }
    }
  }
  return peor ? { contraste: r2(peor.c), fondo: hex(peor.b), alfa: r2(alfa) } : { contraste: null, fondo: null, alfa: r2(alfa) }
}

/** ¿Es del color crema del token `--text-muted`, con este alfa? */
export function esTenue(colorCss, alfa) {
  const k = parseColor(colorCss)
  return !!k && Math.abs(k.a - alfa) < 0.006 && Math.abs(k.rgb[0] - 245) < 1.5 && Math.abs(k.rgb[1] - 237) < 1.5 && Math.abs(k.rgb[2] - 216) < 1.5
}

/**
 * Los textos del token en la pantalla abierta, medidos. La opacidad de grupo por
 * debajo de 0,9 es un control apagado a propósito: se cuenta aparte, sin piso.
 * Lo de dentro de la vitrina va aparte también: es copia de la mesa (INV-77).
 */
export async function medirAtenuados(page, dpr) {
  await asentar(page)
  const textos = await page.evaluate(TEXTOS)
  const v = page.viewportSize()
  const { valor, nota } = await tintaConRepeticion(page, dpr, `tinta ${v.width}x${v.height}`, (fotos) => {
    const activos = [], apagados = [], viejos = []
    for (const t of textos) {
      if (t.enVitrina) continue
      if (esTenue(t.color, 0.55)) viejos.push({ txt: t.txt, clase: t.clase })
      if (!esTenue(t.color, 0.65)) continue
      const m = peorFondo(fotos, t)
      const fila = { txt: t.txt, clase: t.clase, ...m }
      if (t.op < 0.9) apagados.push(fila)
      else if (m?.contraste != null) activos.push(fila)
    }
    const peor = activos.reduce((a, b) => (!a || b.contraste < a.contraste ? b : a), null)
    return { n: activos.length, peor, bajo: activos.filter((t) => t.contraste < PISO_WCAG), apagados: apagados.length, viejos }
  }, (m) => m.bajo.length === 0)
  return { ...valor, ruido: nota }
}
