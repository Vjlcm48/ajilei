// ── idxPagina.mjs · La parte del generador IDX-1 que corre DENTRO de Edge ────
// Rector: AJILEI_IDX-1_Fase1a_v1.0 §3 y Fase1b_v1.0. La montan `gen-idx.mjs`,
// `gen-cards.mjs` y `gen-portada-assets.mjs` con `idxNavegador.mjs` en una
// página servida por `page.route` (origen ficticio `http://idx.local/`), así
// que todo —maestros, fuente y este módulo— llega por archivo local y nada
// sale a la red.
//
// El navegador pone lo que Node no tiene sin dependencias nuevas (D-3):
// decodificar PNG, rasterizar la fuente, remuestrear con calidad alta y
// codificar PNG/WebP. Las reglas y las operaciones de píxel son las de
// `idxCore.mjs`, las mismas que prueba Vitest.
import {
  ANCHO, ALTO, CREMA, INTERIOR, VENTANA_MEDIDA, VENTANA_ENCOGIDO, HOLGURA_MINIMA,
  DILATACION_DIBUJO, TINTA_ARRIBA, TINTA_DERECHA, CONTORNO_PX, FUENTE_PESO, MONEDAS,
  MONEDAS_SELLADO, factorSellado, factorNumerico,
  alturaCifra, textoRango, colorPalo, cajasBorrado, factoresEncogido, estadoCarta,
  destinoMoneda, aplanarCrema, rellenarCaja, restosEnAnillo, mascaraDibujo,
  mascaraEstrellas, distancia2, holgura, dilatar, restar, cajaMascara, componentes,
  rellenarHuecos, mascaraDeIndices, sinComponentesPequenas,
} from './idxCore.mjs'

const FAMILIA = 'IDXRobotoCondensed'
const CREMA_CSS = `rgb(${CREMA.join(',')})`
// La tinta del número se define por cobertura ≥ 50 % (alfa ≥ 128): es el
// borde geométrico del glifo, no el halo de antialias. Con ese criterio se
// colocan y = 93 y x = 976 (D-7) y se mide la altura de cifra (D-6).
const ALFA_TINTA = 128

export async function cargarFuente() {
  const f = new FontFace(FAMILIA, 'url(/fonts/RobotoCondensed-wght.ttf)', { weight: '100 900' })
  await f.load()
  document.fonts.add(f)
  await document.fonts.load(`${FUENTE_PESO} 100px ${FAMILIA}`)
  return document.fonts.check(`${FUENTE_PESO} 100px ${FAMILIA}`)
}

const lienzo = (w = ANCHO, h = ALTO) => {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

async function cargarImagen(url) {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

// Caja de la tinta (alfa ≥ umbral) de un lienzo.
function cajaTinta(canvas, umbral = ALFA_TINTA) {
  const { width: w, height: h } = canvas
  const d = canvas.getContext('2d').getImageData(0, 0, w, h).data
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] >= umbral) {
        if (x < x0) x0 = x; if (x > x1) x1 = x
        if (y < y0) y0 = y; if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : [x0, y0, x1, y1]
}

// §3.7.2 · el cuerpo se ajusta por la TINTA: se mide la altura real del
// render a 1000 px y se escala. Luego se comprueba sobre el render final.
function cuerpoPara(texto, altura) {
  const c = lienzo(2400, 1400)
  const ctx = c.getContext('2d')
  ctx.font = `${FUENTE_PESO} 1000px ${FAMILIA}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#000'
  ctx.fillText(texto, 100, 1150)
  const [, y0, , y1] = cajaTinta(c)
  return (altura / (y1 - y0 + 1)) * 1000
}

// El número en su sitio, sobre un lienzo transparente del tamaño de la carta.
// Se renderiza una vez en un origen cualquiera, se mide la tinta y se
// desplaza un número ENTERO de píxeles: una traslación entera no toca el
// raster, así que lo medido es exactamente lo que se pinta. La TINTA empieza
// en y = 93 y acaba en x = 976 (Ajuste A-1).
function colocarNumero(texto, cuerpo) {
  const c = lienzo()
  const ctx = c.getContext('2d')
  ctx.font = `${FUENTE_PESO} ${cuerpo}px ${FAMILIA}`
  ctx.textBaseline = 'alphabetic'
  const x0 = 400, base = 600
  ctx.fillStyle = '#000'
  ctx.fillText(texto, x0, base)
  const [, ty0, tx1] = cajaTinta(c)
  return { x: x0 + (TINTA_DERECHA - tx1), base: base + (TINTA_ARRIBA - ty0) }
}

function pintarNumero(ctx, texto, cuerpo, pos, color, contorno) {
  ctx.save()
  ctx.font = `${FUENTE_PESO} ${cuerpo}px ${FAMILIA}`
  ctx.textBaseline = 'alphabetic'
  if (contorno) {
    ctx.lineWidth = CONTORNO_PX * 2
    ctx.lineJoin = 'round'
    ctx.strokeStyle = CREMA_CSS
    ctx.strokeText(texto, pos.x, pos.base)
  }
  ctx.fillStyle = color
  ctx.fillText(texto, pos.x, pos.base)
  ctx.restore()
}

const base64 = async (blob) => {
  const buf = new Uint8Array(await blob.arrayBuffer())
  let s = ''
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
  return btoa(s)
}
const aBlob = (canvas, tipo, calidad) => new Promise((ok) => canvas.toBlob(ok, tipo, calidad))

// Un derivado WebP de la carta. Dos formas, las de los dos generadores:
//   { ancho, calidad }              calidad fija (gen-cards: 320 px, q80)
//   { ancho, techo, calidadTope }   la calidad más alta que entra en `techo`
//                                   bytes, por bisección (gen-portada-assets)
// El remuestreo es el de siempre: un drawImage con suavizado alto.
async function derivado(canvas, { ancho, calidad = 0.8, techo = null, calidadTope = 0.92 }) {
  const alto = Math.round((ancho * ALTO) / ANCHO)
  const c = lienzo(ancho, alto)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, ancho, alto)
  const pesar = async (q) => {
    const blob = await aBlob(c, 'image/webp', q)
    if (blob.type !== 'image/webp') throw new Error(`el canvas devolvió ${blob.type}, no image/webp`)
    return { blob, bytes: blob.size, calidad: q }
  }
  let mejor = await pesar(techo === null ? calidad : calidadTope)
  if (techo !== null && mejor.bytes > techo) {
    // La misma bisección que `gen-portada-assets.mjs`: doce pasadas entre
    // 0,30 y el tope. Si ni la más baja entrara, sale la más pequeña probada
    // y el generador lo ve al compararla con el techo.
    let lo = 0.30, hi = calidadTope
    for (let i = 0; i < 12; i++) {
      const q = (lo + hi) / 2
      const r = await pesar(q)
      if (r.bytes <= techo) { mejor = r; lo = q } else { hi = q; if (mejor.bytes > techo && r.bytes < mejor.bytes) mejor = r }
    }
  }
  return { b64: await base64(mejor.blob), bytes: mejor.bytes, calidad: mejor.calidad, ancho, alto }
}

// Un lienzo con SOLO los píxeles de la máscara (el resto transparente).
function recortePorMascara(imgData, m) {
  const c = lienzo()
  const out = new ImageData(new Uint8ClampedArray(imgData.data), ANCHO, ALTO)
  for (let i = 0; i < m.length; i++) if (!m[i]) out.data[i * 4 + 3] = 0
  c.getContext('2d').putImageData(out, 0, 0)
  return c
}

function borrarMascara(imgData, m) {
  const d = imgData.data
  for (let i = 0; i < m.length; i++) {
    if (m[i]) { d[i * 4] = CREMA[0]; d[i * 4 + 1] = CREMA[1]; d[i * 4 + 2] = CREMA[2]; d[i * 4 + 3] = 255 }
  }
}

// §3.4 con el Ajuste A-3: sin las componentes de menos de 10 px.
function medirHolgura(ctx, d2Num) {
  const data = ctx.getImageData(0, 0, ANCHO, ALTO).data
  return holgura(d2Num, sinComponentesPequenas(mascaraDibujo(data, ANCHO, ALTO, VENTANA_MEDIDA), ANCHO, ALTO), ANCHO)
}

const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null)

// La baraja CLÁSICA (Cierre, C-3): el maestro tal cual, sin IDX, reducido con
// el mismo `derivado`. Es la franja «Hoy» de la hoja de contacto, que así
// enseña el antes y el después aunque el juego ya sirva la baraja nueva.
export async function derivarClasica({ rango, palo, derivados = [] }) {
  // Se reduce desde la IMAGEN, sin lienzo intermedio, como hacía `gen-cards`
  // antes de IDX-1: así «Hoy» es al byte la baraja que servía el juego.
  const img = await cargarImagen(`/cards/${rango}_${palo}.png`)
  const out = {}
  for (const d of derivados) out[d.clave] = await derivado(img, d)
  return out
}

// Una carta con el índice nuevo, en memoria. `png` pide la carta entera a
// 1055×1491 (la hoja de contacto); `derivados`, la lista de WebP que quiere
// cada generador (ver `derivado`), que vuelven en `out.derivados[clave]`.
// El factor es el SELLADO (Fase 1b, B-1); la regla de holgura sólo se corre
// para informar de qué factor habría dado (B-2).
export async function procesarCarta({ rango, palo, png = false, derivados = [] }) {
  const nombre = `${rango}_${palo}`
  const sellado = factorSellado(nombre)
  const texto = textoRango(rango)
  const color = colorPalo(palo)

  // §3.1
  const img = await cargarImagen(`/cards/${nombre}.png`)
  if (img.naturalWidth !== ANCHO || img.naturalHeight !== ALTO) throw new Error(`${nombre}: ${img.naturalWidth}×${img.naturalHeight}`)
  const c = lienzo()
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const trabajo = ctx.getImageData(0, 0, ANCHO, ALTO)

  // §3.2
  const aplanados = aplanarCrema(trabajo.data, ANCHO, INTERIOR)

  // §3.3 · borrar. La verificación va sobre la carta final (Ajuste A-2).
  const cajas = cajasBorrado(rango, palo)
  rellenarCaja(trabajo.data, ANCHO, ALTO, cajas.sup)
  rellenarCaja(trabajo.data, ANCHO, ALTO, cajas.inf)
  ctx.putImageData(trabajo, 0, 0)

  // Número (D-6, D-7): cuerpo por la tinta y posición entera.
  const altura = alturaCifra(rango)
  const cuerpo = cuerpoPara(texto, altura)
  const pos = colocarNumero(texto, cuerpo)
  const cNum = lienzo()
  pintarNumero(cNum.getContext('2d'), texto, cuerpo, pos, '#000', false)
  const tinta = cajaTinta(cNum)
  const dNum = cNum.getContext('2d').getImageData(0, 0, ANCHO, ALTO).data
  const mNum = new Uint8Array(ANCHO * ALTO)
  for (let i = 0; i < mNum.length; i++) if (dNum[i * 4 + 3] > 0) mNum[i] = 1
  const d2Num = distancia2(mNum, ANCHO, ALTO)

  // §3.4 · holgura antes de tocar el dibujo.
  const antes = medirHolgura(ctx, d2Num)

  let factor = 1
  let despues = antes
  let detalle = null
  let factorRegla = antes.px >= HOLGURA_MINIMA ? 1 : null

  if (rango === 'cuatro' && palo === 'oro') {
    // §3.6 · las cuatro monedas. Es el único tratamiento de esta carta, así
    // que la regla y la tabla coinciden por construcción.
    if (sellado !== MONEDAS_SELLADO) throw new Error(`${nombre}: el 4 de oros sólo admite ${MONEDAS_SELLADO} y la tabla dice ${sellado}`)
    const mMed = mascaraDibujo(trabajo.data, ANCHO, ALTO, VENTANA_MEDIDA)
    const monedas = componentes(mMed, ANCHO, ALTO, MONEDAS.areaMinima)
    if (monedas.length !== 4) throw new Error(`${nombre}: se esperaban 4 monedas y hay ${monedas.length} (áreas ${monedas.map((m) => m.area).join(', ')})`)
    const fondo = new ImageData(new Uint8ClampedArray(trabajo.data), ANCHO, ALTO)
    const piezas = monedas.map((m) => {
      const llena = rellenarHuecos(m, ANCHO)
      const mascara = dilatar(mascaraDeIndices(llena.indices, ANCHO, ALTO), ANCHO, ALTO, DILATACION_DIBUJO)
      const [x0, y0, x1, y1] = m.caja
      return { mascara, cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, radio: (x1 - x0 + 1) / 2, area: m.area, huecos: llena.area - m.area }
    })
    for (const p of piezas) borrarMascara(fondo, p.mascara)
    ctx.putImageData(fondo, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    detalle = { monedas: [] }
    for (const p of piezas) {
      const recorte = recortePorMascara(trabajo, p.mascara)
      const dst = destinoMoneda(p)
      const f = MONEDAS.factor
      ctx.save()
      ctx.setTransform(f, 0, 0, f, dst.cx - f * p.cx, p.cy - f * p.cy)
      ctx.drawImage(recorte, 0, 0)
      ctx.restore()
      detalle.monedas.push({ area: p.area, huecosRellenos: p.huecos, centro: [r1(p.cx), r1(p.cy)], radio: r1(p.radio), destino: [r1(dst.cx), r1(dst.cy)], radioFinal: r1(dst.radio) })
    }
    factor = MONEDAS_SELLADO
    factorRegla = MONEDAS_SELLADO
    despues = medirHolgura(ctx, d2Num)
  } else if (sellado !== 1 || factorRegla === null) {
    // §3.5 · encoger todo el dibujo alrededor del centro de su caja. La
    // máscara y el recorte salen de la carta sin encoger, así que sirven igual
    // para el factor sellado y para la búsqueda informativa de la regla.
    const estrellas = dilatar(mascaraEstrellas(trabajo.data, ANCHO, ALTO), ANCHO, ALTO, 2)
    const mEnc = restar(mascaraDibujo(trabajo.data, ANCHO, ALTO, VENTANA_ENCOGIDO), estrellas)
    const M = dilatar(mEnc, ANCHO, ALTO, DILATACION_DIBUJO)
    const caja = cajaMascara(M, ANCHO)
    const cx = (caja[0] + caja[2] + 1) / 2, cy = (caja[1] + caja[3] + 1) / 2
    const recorte = recortePorMascara(trabajo, M)
    const fondo = new ImageData(new Uint8ClampedArray(trabajo.data), ANCHO, ALTO)
    borrarMascara(fondo, M)
    const encoger = (s) => {
      ctx.putImageData(fondo, 0, 0)
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.setTransform(s, 0, 0, s, cx * (1 - s), cy * (1 - s))
      ctx.drawImage(recorte, 0, 0)
      ctx.restore()
      return medirHolgura(ctx, d2Num)
    }
    // Lo que la ventana de MEDIDA dejaría fuera y la de encogido arrastra.
    let bajo1300 = 0
    for (let y = VENTANA_MEDIDA[3] + 1; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) bajo1300 += mEnc[y * ANCHO + x]
    // B-2 · sólo como dato: el primer factor con el que la regla llegaría a
    // 18 px. Si ni el suelo llega, `factorRegla` se queda en null.
    const intentos = []
    if (factorRegla === null) {
      for (const s of factoresEncogido()) {
        const h = encoger(s)
        intentos.push([s, r1(h.px)])
        if (h.px >= HOLGURA_MINIMA) { factorRegla = s; break }
      }
    }
    // Lo que se entrega es el factor SELLADO, dibujado desde cero.
    if (sellado === 1) {
      ctx.putImageData(trabajo, 0, 0)
      despues = antes
    } else {
      despues = encoger(sellado)
    }
    factor = sellado
    detalle = { cajaDibujo: caja, centro: [cx, cy], pxBajo1300: bajo1300, intentosRegla: intentos }
  }

  // Ajuste A-2 · verificación del borrado sobre la carta FINAL (ya encogida
  // o recolocada) y antes de pintar el número nuevo, que en los oros es del
  // mismo rojo y caería dentro del anillo del índice superior.
  const final = ctx.getImageData(0, 0, ANCHO, ALTO).data
  const anillo = {}
  for (const k of ['sup', 'inf']) {
    const px = restosEnAnillo(final, ANCHO, ALTO, cajas[k])
    anillo[k] = {
      caja: cajas[k],
      restos: px.length,
      cajaRestos: px.length ? [Math.min(...px.map((p) => p.x)), Math.min(...px.map((p) => p.y)), Math.max(...px.map((p) => p.x)), Math.max(...px.map((p) => p.y))] : null,
      muestra: px.slice(0, 3).map((p) => `${p.x},${p.y} rgb(${p.rgb.join(',')})`),
    }
  }
  const borradoOk = anillo.sup.restos === 0 && anillo.inf.restos === 0

  // §3.7 · contorno y número.
  // MEDIDO en la Fase 1b: en las 9 cartas encogidas el `drawImage` desde un
  // lienzo acelerado deja este lienzo en GPU, y ahí el texto no es
  // determinista (±1–2 en el antialias del borde del número entre corridas).
  // En las otras 31 el número se rasteriza en CPU y sale igual siempre. Se
  // deja como lo aprobó Victor: pintarlo en un lienzo CPU limpio es
  // determinista, pero cambia el número de esas 9 (ver el informe de la 1b).
  pintarNumero(ctx, texto, cuerpo, pos, color, true)

  // El 4 de oros cuenta como «encogida»: sus monedas van al 84 % (§3.6).
  const estado = estadoCarta({ borradoOk, holguraFinal: despues.px, factor: factorNumerico(factor) })
  const out = {
    nombre, rango, palo, texto, color,
    cuerpo: Math.round(cuerpo * 100) / 100,
    alturaObjetivo: r1(altura),
    tinta, alturaTinta: tinta[3] - tinta[1] + 1,
    aplanados,
    anillo, borradoOk,
    holguraAntes: { px: r1(antes.px), en: [antes.x, antes.y] },
    holguraDespues: { px: r1(despues.px), en: [despues.x, despues.y] },
    // Sin redondear: la comprobación B-2 no puede depender del redondeo a
    // décimas (16,96 no es 17,0).
    holguraExacta: despues.px,
    factor, factorRegla, reglaDifiere: factorRegla !== factor,
    detalle, estado,
    derivados: {},
  }
  if (png) out.png = await base64(await aBlob(c, 'image/png'))
  for (const d of derivados) out.derivados[d.clave] = await derivado(c, d)
  return out
}
