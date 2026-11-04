// ── IOS-1 · el modo `tam` de diagDSK ────────────────────────────────────────
// 1b: AJILEI_IOS-1_Fase1ab_v1.0.md §4.4 (el barrido de alto). 1e:
// AJILEI_IOS-1_Fase1e_v1.0.md §3 (la zona anclada y la matriz de la lámina 1d).
// Vive en su módulo, como `video`; diagDSK solo lo llama y lee su veredicto por
// `verde`.
//
// «QUIEN MUEVE LA RUTA, RECABLEA EL METRO». La 1e ancla el botón dorado de
// Retar, Salas y Armar mesa al pie (`.sal.es-anclada`): la pantalla ya no
// desplaza nunca; si algo no cabe son las FILAS, que desplazan dentro del
// cuerpo por debajo de la zona. Este modo lo mide así:
//
// A · EL BARRIDO (de la 1b, recableado). Alto en horizontal de 521 a 831 de 10
// en 10, en tres perfiles de Chromium (laptop con ratón a 1366, tableta táctil a
// 1280 y, desde la 1f, una ventana estrecha de 820 que es la que deja filas
// bajo el botón), UN contexto por pantalla y `setViewportSize` (la receta de la
// Fase 0: no depende de las barras de ningún navegador).
//   tam.1  el botón principal se toca SIN desplazar nada (las tres pantallas
//          ancladas); en el lobby, de entrada o tras el gesto real del usuario
//   tam.2  la caja de nota o resumen, si dice algo, se ve entera y va ENCIMA
//          del botón (±1 px)
//   tam.3  nada desplaza a lo ancho; el documento no desplaza; la pantalla
//          anclada no desplaza nunca (las filas sí, dentro del cuerpo), y el
//          gesto del usuario no mueve el botón
//   tam.4  lobby: «Jugar contra jugadores» a ≥ 8 px del menú de abajo
//   tam.5  ningún tocable montado sobre otro (la casa incluida), con el cuerpo
//          arriba, a media pasada y al fondo. Las filas que pasan POR DEBAJO de
//          la zona no cuentan: la zona las tapa a propósito
//   tam.6  donde las filas no caben, el gesto REAL (rueda en la laptop, arrastre
//          táctil por CDP en la tableta) las lleva hasta el final, sin mover el
//          botón: lo que no cabe se alcanza
//
// B · LA MATRIZ (1e, completada en la 1f). Los 16 tamaños de la lámina 1d y
// los de la Fase 0 (§C.2), más las fronteras de la variante B (899/900 de
// ancho, 830/831 de alto), la línea de los 860 (831, 845, 860 y 861 de alto) y
// el roce anotado de la casa a 800×601 y 800×611; en siete estados (Retar
// elegido, sin elegir, con el bloque del video, con el error al sentarse y con
// la lectura fallida; Salas; Armar mesa). Un contexto por perfil (ratón /
// táctil) y pantalla.
//   tam.7  el botón dorado, ENTERO a la vista y tocable, en todas las celdas
//   tam.8  0 px de filas bajo el botón en todo tamaño salvo los teléfonos
//          acostados y las celdas que sólo informan; la página no desplaza
//          nunca. Desde la 1f, también de 831 a 860 de alto en horizontal ancho
//   tam.9  la variante B entra y sale donde debe: dos columnas a 900×600 y a
//          1366×830; una a 899×600 y a 1366×831
//   tam.10 piso táctil: ningún tocable NUEVO o MOVIDO por debajo de 44 en los
//          tamaños táctiles (el botón dorado, el del video, el de reintentar,
//          y —donde el traje apretado los cambia— chips y «Unirme»). Los de
//          PAN-1 (casa, flecha, ⚙, «+», campo de código, chips de 40 en
//          vertical) no entran: se listan
//   tam.11 la casa vive en la cabecera y no roza el título ni el botón
//   tam.12 desde CFG-1 1a el ⚙ abre la hoja, y el «Pronto» es el de sus filas: sale
//          entero y por encima del velo, y al cerrar la hoja el botón vuelve a
//          estar donde estaba y se toca (a 1366×623, 412×915 y 360×640)
//   matriz el barrido y las celdas MEDIDAS son las esperadas (ARN-4d: tamaños por
//          estados, 301 hoy). Antes contaba solo el barrido: un error a media
//          pasada se llevaba las celdas que faltaban y esto seguía en verde
//   consola  sin errores de página
//
// UN VERDE MIDE LO QUE DICE. Una celda que no se pudo medir (el estado no llegó)
// sale como «no medida» y el modo no es verde. El barrido necesita además que
// en algún punto las filas no quepan y el gesto las recorra (tam.6): si en
// ninguno hizo falta, sale «SIN COBERTURA», nunca verde.
//
// LO QUE ESTE MODO NO MIDE: la barra de desplazamiento clásica de Windows (el
// Chromium sin pantalla las oculta) y las barras reales de Safari (aquí el alto
// es el que queda). La pasada de WebKit es una sonda aparte que importa
// `runTam`: el WebKit de Playwright no tiene CDP ni arrastre, y en móvil
// tampoco rueda, así que usa la rueda en escritorio y, en táctil, el gesto
// `codigo` (en `gesto`).

import { contextoCap } from '../cap/capMesa.mjs'

export const ALTOS_TAM = Object.freeze(Array.from({ length: 32 }, (_, i) => 521 + i * 10))
export const PERFILES_TAM = Object.freeze([
  { id: 'laptop', w: 1366, movil: false, gesto: 'rueda' },
  { id: 'tableta', w: 1280, movil: true, gesto: 'tactil' },
  // IOS-1f · con la línea de los 860, a 1366 y 1280 ya nada desborda de 521 a
  // 831 (dos columnas hasta 830, el traje en 831) y tam.6 se quedaba sin nada
  // que recorrer. Una ventana estrecha (una columna, < 900) sí deja filas bajo
  // el botón en lo bajo: es la que ejerce el gesto. Solo la carcasa: el lobby
  // tiene sus propios trajes y no es de esta medida.
  { id: 'estrecha', w: 820, movil: false, gesto: 'rueda', pantallas: ['retar', 'retar-video', 'salas', 'armar'] },
])
export const PANTALLAS_TAM = Object.freeze(['lobby', 'retar', 'retar-video', 'salas', 'armar'])

// La matriz de la 1e: los 16 tamaños de la lámina 1d más las fronteras.
export const TAMANOS_MATRIZ = Object.freeze([
  { id: '1366x623', w: 1366, h: 623, tactil: false },
  { id: '1280x585', w: 1280, h: 585, tactil: false },
  { id: '1536x729', w: 1536, h: 729, tactil: false },
  { id: '1920x1080', w: 1920, h: 1080, tactil: false },
  { id: '1133x641', w: 1133, h: 641, tactil: true },
  { id: '1133x720', w: 1133, h: 720, tactil: true },
  { id: '1180x713', w: 1180, h: 713, tactil: true },
  { id: '744x1026', w: 744, h: 1026, tactil: true },
  { id: '1280x648', w: 1280, h: 648, tactil: true },
  { id: '800x1128', w: 800, h: 1128, tactil: true },
  { id: '412x915', w: 412, h: 915, tactil: true },
  { id: '360x704', w: 360, h: 704, tactil: true },
  { id: '390x844', w: 390, h: 844, tactil: true },
  { id: '360x640', w: 360, h: 640, tactil: true },
  { id: '440x956', w: 440, h: 956, tactil: true },
  { id: '915x412', w: 915, h: 412, tactil: true, acostado: true },
  // Fronteras de la variante B (tam.9) y el roce de la casa (tam.11). Sus
  // filas bajo el botón se INFORMAN (tam.8 no les pide 0 px).
  { id: '899x600', w: 899, h: 600, tactil: false, frontera: false, informa: true },
  { id: '900x600', w: 900, h: 600, tactil: false, frontera: true, informa: true },
  { id: '1366x830', w: 1366, h: 830, tactil: false, frontera: true, informa: true },
  { id: '800x601', w: 800, h: 601, tactil: false, informa: true },
  { id: '800x611', w: 800, h: 611, tactil: false, informa: true },
  // IOS-1f (T1) · la línea de los 860: en horizontal ancho, de 831 a 860 de alto,
  // una columna con el traje apretado y 0 px de filas (tam.8, ESTRICTO). La 861
  // ya no lleva traje: se informa.
  { id: '1366x831', w: 1366, h: 831, tactil: false, frontera: false },
  { id: '1366x845', w: 1366, h: 845, tactil: false },
  { id: '1366x860', w: 1366, h: 860, tactil: false },
  { id: '1366x861', w: 1366, h: 861, tactil: false, informa: true },
  // IOS-1f (T3) · la lista de la Fase 0 (§C.2) que no estaba ya arriba. Los
  // tamaños «con barras» son ESTIMADOS (lo dice la Fase 0); el iPhone acostado
  // (832 de ancho: sin `viewport-fit=cover`, Safari no deja a la página las
  // franjas de la isla) cae fuera de las dos columnas y se informa como el
  // teléfono acostado.
  { id: '440x763', w: 440, h: 763, tactil: true },                      // iph-saf-v
  { id: '832x440', w: 832, h: 440, tactil: true, acostado: true },      // iph-app-h
  { id: '832x390', w: 832, h: 390, tactil: true, acostado: true },      // iph-saf-h
  { id: '744x1133', w: 744, h: 1133, tactil: true },                    // ipm-app-v
  { id: '1133x744', w: 1133, h: 744, tactil: true },                    // ipm-app-h
  { id: '1133x637', w: 1133, h: 637, tactil: true },                    // ipm-saf-h
  { id: '820x1180', w: 820, h: 1180, tactil: true },                    // ip11-app-v
  { id: '1180x820', w: 1180, h: 820, tactil: true },                    // ip11-app-h
  { id: '820x1073', w: 820, h: 1073, tactil: true },                    // ip11-saf-v
  { id: '1024x1259', w: 1024, h: 1259, tactil: true },                  // ip13-saf-v
  { id: '1366x917', w: 1366, h: 917, tactil: true },                    // ip13-saf-h
  { id: '876x1248', w: 876, h: 1248, tactil: true },                    // and-g-v
  { id: '1400x724', w: 1400, h: 724, tactil: true },                    // and-g-h
  { id: '1366x633', w: 1366, h: 633, tactil: false },                   // lap-1366
  // TAB-1 1e · el alto útil MEDIDO del iPad mini 6 (Fase 0 TF-3, lámina 1a
  // §3.0): Safari con barras y app instalada en vertical; con barras y a
  // pantalla completa en horizontal. Las estimaciones de arriba se conservan.
  { id: '744x1047', w: 744, h: 1047, tactil: true },                    // ipm-saf-v (medido)
  { id: '744x1100', w: 744, h: 1100, tactil: true },                    // ipm-app-v (medido)
  { id: '1133x658', w: 1133, h: 658, tactil: true },                    // ipm-saf-h (medido)
  { id: '1133x716', w: 1133, h: 716, tactil: true },                    // ipm-pc-h (medido)
])
export const ESTADOS_MATRIZ = Object.freeze(['retar', 'retar-falta', 'retar-video', 'retar-error', 'retar-lectura', 'salas', 'armar'])
const PRONTO_EN = ['1366x623', '412x915', '360x640']

const HUECO_MIN = 8
const TOL = 0.5
const PISO = 44

// El botón principal de cada pantalla, y su nota (la caja de encima, desde 1e).
const OBJETIVO = {
  lobby: { boton: '[data-accion="jugar-pvp"]', nota: null },
  retar: { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  'retar-falta': { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  'retar-video': { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  'retar-error': { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  'retar-lectura': { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  salas: { boton: '[data-accion="armar"]', nota: '[data-accion="cta-nota"]' },
  armar: { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
}

// Lo que cada estado le pide al servidor imitado.
function opcionesDe(pantalla) {
  if (pantalla === 'retar-video') return { billetera: { saldo: 1500 } }
  if (pantalla === 'retar-error') return { billetera: { saldo: 5000, cortes: { sentarse_ia: { veces: 999, modo: 'antes' } } } }
  if (pantalla === 'retar-lectura') return { billetera: { saldo: 5000, falla: true } }
  return {}
}

export async function irA(page, base, pantalla) {
  await page.goto(base, { waitUntil: 'load' })
  await page.waitForSelector('main.lobby [data-accion="jugar-ia"]')
  if (pantalla === 'lobby') return
  if (pantalla === 'salas' || pantalla === 'armar') {
    await page.click('[data-accion="jugar-pvp"]')
    await page.waitForSelector('main.sal [data-accion="armar"]')
    if (pantalla === 'armar') {
      await page.click('[data-accion="armar"]')
      await page.waitForSelector('[data-accion="modo-privada"]')
    }
    return
  }
  await page.click('[data-accion="jugar-ia"]')
  if (pantalla === 'retar-lectura') {
    // Sin ninguna cifra y la lectura caída: el aviso con «Reintentar», en la zona.
    await page.waitForSelector('[data-accion="aviso-lectura"]')
    return
  }
  await page.waitForSelector('[data-accion="reto"]:not([disabled])')
  if (pantalla === 'retar-falta') return
  if (pantalla === 'retar-video') {
    // Reto Pro con 1.500 HC: no alcanza, y sale el bloque del video.
    await page.click('[data-accion="reto"]:nth-of-type(3)')
    await page.click('[data-accion="jugadores"]:nth-of-type(1)')
    await page.waitForSelector('[data-accion="mas-monedas"]')
    return
  }
  for (const [a, n] of [['reto', 1], ['jugadores', 4], ['apuesta', 1], ['entrada', 2]]) {
    await page.waitForSelector(`[data-accion="${a}"]:not([disabled])`)
    await page.click(`[data-accion="${a}"]:nth-of-type(${n})`)
  }
  if (pantalla === 'retar-error') {
    // Sentarse contra un servidor que no contesta: la caja dice el error.
    await page.click('[data-accion="cta"]')
    await page.waitForSelector('.sal-caja.is-alerta', { timeout: 30000 })
  }
}

// En la página: la pantalla, el botón, su caja, la zona y los tocables. No juzga.
const LEE = ({ boton, nota, tol }) => {
  const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
  const anclada = raiz.classList.contains('es-anclada')
  const cuerpo = anclada ? raiz.querySelector('.sal-cuerpo') : null
  const zonaEl = anclada ? raiz.querySelector('.sal-cuerpo > .sal-accion') : null
  const de = document.documentElement
  const vh = innerHeight
  const vw = innerWidth
  const caja = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const b = document.querySelector(boton)
  const n = nota ? document.querySelector(nota) : null
  const cb = caja(b)
  const zona = caja(zonaEl)
  // ¿Se puede tocar? Entero en la ventana y su punto central cae en él.
  let tocable = false
  if (cb && cb.t >= -tol && cb.b <= vh + tol && cb.l >= -tol && cb.r <= vw + tol) {
    const e = document.elementFromPoint((cb.l + cb.r) / 2, (cb.t + cb.b) / 2)
    tocable = !!e && (e === b || b.contains(e))
  }
  // Tocables visibles, dentro de la ventana. Una fila que pasa por debajo de la
  // zona anclada está TAPADA a propósito: no cuenta como tocable a la vista.
  // IOS-1f · y lo que está dentro del cuerpo se mide RECORTADO a la caja del
  // cuerpo, que desplaza con `overflow`: una fila que sube por encima de su
  // borde no se ve ni se toca, aunque su caja cruce la cabecera.
  const sel = 'button, input, select, textarea, a[href], [role="button"]'
  const solapa = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > tol && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > tol
  const cajaCuerpo = cuerpo ? cuerpo.getBoundingClientRect() : null
  const rectDe = (e) => {
    const r = e.getBoundingClientRect()
    if (!cajaCuerpo || !cuerpo.contains(e)) return r
    const left = Math.max(r.left, cajaCuerpo.left), right = Math.min(r.right, cajaCuerpo.right)
    const top = Math.max(r.top, cajaCuerpo.top), bottom = Math.min(r.bottom, cajaCuerpo.bottom)
    return { left, right, top, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
  }
  const vivos = [...raiz.querySelectorAll(sel)].filter((e) => {
    if (!e.getClientRects().length) return false
    const cs = getComputedStyle(e)
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || cs.pointerEvents === 'none') return false
    const r = rectDe(e)
    if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw)) return false
    if (zonaEl && cuerpo.contains(e) && !zonaEl.contains(e) && solapa(r, zonaEl.getBoundingClientRect())) return false
    return true
  })
  const nombre = (e) => e.dataset.accion || e.getAttribute('aria-label') || e.className || e.tagName
  const solapes = []
  for (let i = 0; i < vivos.length; i++) {
    for (let j = i + 1; j < vivos.length; j++) {
      const p = vivos[i]
      const q = vivos[j]
      if (p.contains(q) || q.contains(p)) continue
      const a = rectDe(p)
      const c = rectDe(q)
      const x = Math.min(a.right, c.right) - Math.max(a.left, c.left)
      const y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)
      if (x > tol && y > tol) solapes.push(`${nombre(p)}×${nombre(q)} ${Math.min(x, y).toFixed(1)}`)
    }
  }
  // Los tocables NUEVOS o MOVIDOS por la 1e (tam.10). Chips y «Unirme» sólo
  // donde el traje apretado los cambia (horizontal ≤ 800 de alto).
  const traje = matchMedia('(orientation: landscape) and (max-height: 800px)').matches
  const movidos = [b, ...raiz.querySelectorAll('.sal-accion .sal-saldo-cta'), ...(traje ? raiz.querySelectorAll('.sal-chip, .sal-unir') : [])]
    .filter((e) => e && vivos.includes(e) || (e && e === b))
    .map((e) => { const r = e.getBoundingClientRect(); return { k: nombre(e), lado: +Math.min(r.width, r.height).toFixed(1) } })
  const menor = movidos.length ? movidos.reduce((m, x) => (x.lado < m.lado ? x : m)) : null
  // Los de PAN-1 por debajo de 44, sólo para listarlos.
  const pan1 = [...new Set(vivos.filter((e) => !movidos.some((m) => m.k === nombre(e)))
    .map((e) => { const r = e.getBoundingClientRect(); return [nombre(e), Math.min(r.width, r.height)] })
    .filter(([, l]) => l < 44 - 0.01).map(([k, l]) => `${k} ${l.toFixed(1)}`))]
  // La casa (en la cabecera desde la 1e) contra el TEXTO del título y el botón.
  const casaEl = raiz.querySelector('[data-accion="casa"]')
  const h1 = raiz.querySelector('.sal-cab h1')
  let tituloR = null
  if (h1) { const rg = document.createRange(); rg.selectNodeContents(h1); tituloR = caja(rg) }
  const casa = caja(casaEl)
  const cruza = (a, c) => !!a && !!c && Math.min(a.r, c.r) - Math.max(a.l, c.l) > tol && Math.min(a.b, c.b) - Math.max(a.t, c.t) > tol
  const toastEl = raiz.querySelector('.sal-toast.is-on')
  const lobby = document.querySelector('main.lobby')
  let hueco = null
  if (lobby) {
    const p = document.querySelector('[data-accion="jugar-pvp"]')?.getBoundingClientRect()
    const nav = document.querySelector('.lob-nav')?.getBoundingClientRect()
    if (p && nav) hueco = +(nav.top - p.bottom).toFixed(1)
  }
  const cs = cuerpo ? getComputedStyle(cuerpo) : null
  return {
    vh, vw, anclada,
    rollo: raiz.scrollHeight - raiz.clientHeight,
    rolloX: raiz.scrollWidth - raiz.clientWidth,
    docRollo: de.scrollHeight - de.clientHeight,
    docRolloX: de.scrollWidth - de.clientWidth,
    overflowY: getComputedStyle(raiz).overflowY,
    top: raiz.scrollTop,
    filas: cuerpo ? +(cuerpo.scrollHeight - cuerpo.clientHeight).toFixed(1) : 0,
    filasTop: cuerpo ? cuerpo.scrollTop : 0,
    dosColumnas: !!cs && cs.display === 'grid' && cs.gridTemplateColumns.trim().split(/\s+/).length === 2,
    // La caja cuenta si se VE: callada (con el bloque del video) no ocupa sitio.
    boton: cb, nota: caja(n), zona,
    notaVisible: !!n && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden' && n.textContent.trim() !== '',
    cajaTipo: n ? [...n.classList].find((c) => c.startsWith('is-') && c !== 'is-cortada') ?? null : null,
    tocable, solapes, hueco, menor, pan1,
    casaEnCab: !!casaEl && !!casaEl.closest('.sal-cab'),
    casaTitulo: cruza(casa, tituloR), casaBoton: cruza(casa, cb),
    toast: caja(toastEl),
  }
}
const lee = (page, obj) => page.evaluate(LEE, { ...obj, tol: TOL })
// Lo que desplaza: el cuerpo en una pantalla anclada; la pantalla en el lobby.
const fijaScroll = (page, donde) => page.evaluate((d) => {
  const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
  const el = raiz.classList.contains('es-anclada') ? raiz.querySelector('.sal-cuerpo') : raiz
  const max = el.scrollHeight - el.clientHeight
  el.scrollTop = d === 'arriba' ? 0 : d === 'medio' ? Math.round(max / 2) : max
}, donde)
const posicion = (page) => page.evaluate(() => {
  const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
  const el = raiz.classList.contains('es-anclada') ? raiz.querySelector('.sal-cuerpo') : raiz
  return el.scrollTop + raiz.scrollTop * 1e6
})

// Espera a que el desplazamiento se quede quieto (la rueda y el arrastre de
// Chromium animan): dos lecturas iguales seguidas, con tope.
async function quieto(page) {
  let antes = null
  for (let i = 0; i < 30; i++) {
    const t = await posicion(page)
    if (t === antes) return
    antes = t
    await page.waitForTimeout(60)
  }
}

// El gesto REAL del usuario, desde el centro de la pantalla hacia el fondo.
async function gesto(page, perfil, cdp) {
  const { vw, vh } = await page.evaluate(() => ({ vw: innerWidth, vh: innerHeight }))
  const x = Math.round(vw / 2)
  const y = Math.round(vh / 2)
  if (perfil.gesto === 'tactil' && cdp) {
    // Un arrastre de dedo de verdad: tocar, mover hacia arriba y soltar.
    // (`Input.synthesizeScrollGesture` con `gestureSourceType: 'touch'` no
    // desplaza nada en este Chromium sin pantalla: medido en el STOP-2 de 1b.)
    for (let vuelta = 0; vuelta < 3; vuelta++) {
      const y0 = Math.round(vh * 0.6)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - i * 25 }] })
        await page.waitForTimeout(16)
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await quieto(page)
    }
  } else if (perfil.gesto === 'codigo') {
    // Solo para la sonda de WebKit móvil, que no admite ni la rueda ni un
    // arrastre (Playwright): baja desde código, pero SOLO si lo que desplaza
    // deja desplazar al usuario (`overflow-y` auto o scroll).
    await page.evaluate(() => {
      const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
      const el = raiz.classList.contains('es-anclada') ? raiz.querySelector('.sal-cuerpo') : raiz
      if (/auto|scroll/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight
    })
  } else {
    await page.mouse.move(x, y)
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 600)
  }
  await quieto(page)
}

// ARN-4d · tam.12. Abre la hoja, pide su «Pronto», lo lee y CIERRA: la matriz sigue
// en la misma página, y una hoja abierta falsea todas las celdas que vienen detrás.
const LEE_AVISO = () => {
  const t = document.querySelector('.cfg-toast.is-on')
  if (!t) return null
  // `pointer-events: none` lo deja fuera de `elementFromPoint`: se le devuelve un
  // instante para preguntar quién pinta encima en su centro.
  t.style.pointerEvents = 'auto'
  const r = t.getBoundingClientRect()
  const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  t.style.pointerEvents = ''
  return { texto: t.textContent.trim(), t: r.top, b: r.bottom, l: r.left, r: r.right, encima: !!arriba && (arriba === t || t.contains(arriba)) }
}

async function medirPronto(page, obj) {
  const antes = await lee(page, obj)
  await page.click('.lob-ajustes')
  await page.waitForSelector('.lob-hoja.is-on')
  await page.click('.lob-hoja.is-on [data-accion="cfg-idioma"]')
  await page.waitForSelector('.cfg-toast.is-on', { timeout: 3000 })
  await page.waitForTimeout(220) // su transición: 0,18 s
  const aviso = await page.evaluate(LEE_AVISO)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => {
    const visible = (s) => getComputedStyle(document.querySelector(s)).visibility !== 'hidden'
    return !visible('.lob-hoja') && !visible('.lob-velo')
  })
  const tras = await lee(page, obj)
  const entero = !!aviso && aviso.texto === 'Pronto' && aviso.encima && aviso.t >= -TOL && aviso.b <= tras.vh + TOL && aviso.l >= -TOL && aviso.r <= tras.vw + TOL
  const mismoSitio = !!antes.boton && !!tras.boton && Math.abs(tras.boton.t - antes.boton.t) <= 1 && Math.abs(tras.boton.l - antes.boton.l) <= 1
  return {
    pronto: entero && mismoSitio && tras.tocable,
    prontoCaja: `${aviso ? `«${aviso.texto}» ${aviso.t.toFixed(1)}–${aviso.b.toFixed(1)} de ${tras.vh}, encima=${aviso.encima}` : 'no salió'} · al cerrar, botón tocable=${tras.tocable} en su sitio=${mismoSitio}`,
  }
}

const dentro = (c, vh) => !!c && c.t >= -TOL && c.b <= vh + 1
// La caja, si dice algo, entera en la ventana y encima del botón.
const cajaBien = (l) => !l.notaVisible || (dentro(l.nota, l.vh) && (!l.boton || l.nota.b <= l.boton.t + 1))

// ── A · El barrido ──────────────────────────────────────────────────────────
async function barrido(browser, { base, perfiles, altos, pantallas, cdp, errores }) {
  const filas = []
  const corre = async (perfil) => {
    for (const pantalla of perfil.pantallas ?? pantallas) {
      const { ctx, page } = await contextoCap(browser, { w: perfil.w, h: 700, dpr: 1, movil: perfil.movil }, base, opcionesDe(pantalla))
      page.on('pageerror', (e) => errores.push(`${perfil.id} ${pantalla} · pageerror: ${e.message}`))
      const sesion = perfil.gesto === 'tactil' && cdp ? await ctx.newCDPSession(page) : null
      try {
        await irA(page, base, pantalla)
        await page.waitForTimeout(500)
        await page.mouse.move(2, 2)
        const obj = OBJETIVO[pantalla]
        for (const h of altos) {
          await page.setViewportSize({ width: perfil.w, height: h })
          await page.waitForTimeout(140)
          await fijaScroll(page, 'arriba')
          const arriba = await lee(page, obj)
          // Media pasada y fondo, para los solapes (tam.5).
          let medio = arriba
          let fondo = arriba
          const rueda = arriba.anclada ? arriba.filas : arriba.rollo
          if (rueda > 1) {
            await fijaScroll(page, 'medio'); medio = await lee(page, obj)
            await fijaScroll(page, 'fondo'); fondo = await lee(page, obj)
            await fijaScroll(page, 'arriba')
          }
          // El gesto del usuario, siempre: o alcanza lo que no cabe, o no mueve nada.
          const yaEsta = arriba.tocable && cajaBien(arriba)
          await gesto(page, perfil, sesion)
          const tras = await lee(page, obj)
          await fijaScroll(page, 'arriba')
          const quietoBoton = !tras.boton || !arriba.boton || Math.abs(tras.boton.t - arriba.boton.t) <= 1
          const fila = {
            perfil: perfil.id, pantalla, h,
            rollo: +arriba.rollo.toFixed(1), filas: arriba.filas, overflowY: arriba.overflowY,
            dosColumnas: arriba.dosColumnas,
            // tam.1 · anclada: sin desplazar nada. Lobby: de entrada o tras el gesto.
            t1: arriba.anclada ? arriba.tocable : (yaEsta ? arriba.tocable : tras.tocable),
            t2: arriba.anclada ? cajaBien(arriba) : cajaBien(yaEsta ? arriba : tras),
            t3: arriba.docRollo <= 1 && arriba.docRolloX <= 1 && arriba.rolloX <= 1
              && (arriba.anclada
                ? arriba.rollo <= 1 && tras.top === 0 && quietoBoton
                : (arriba.rollo > 1 || quietoBoton)),
            t4: pantalla !== 'lobby' || (arriba.hueco !== null && arriba.hueco >= HUECO_MIN),
            hueco: arriba.hueco,
            solapes: [...new Set([...arriba.solapes, ...medio.solapes, ...fondo.solapes])],
            // tam.6 · las filas que no caben se recorren hasta el final con el gesto.
            ejerceFilas: arriba.anclada && arriba.filas > 1,
            t6: !arriba.anclada || arriba.filas <= 1 || (tras.filasTop >= arriba.filas - 2 && quietoBoton && tras.tocable),
            ctaFin: arriba.boton ? +(arriba.boton.b - arriba.vh).toFixed(1) : null,
          }
          fila.t5 = fila.solapes.length === 0
          fila.ok = fila.t1 && fila.t2 && fila.t3 && fila.t4 && fila.t5 && fila.t6
          filas.push(fila)
        }
      } catch (e) {
        errores.push(`${perfil.id} ${pantalla} · ${e.message.split('\n')[0]}`)
      } finally {
        await ctx.close()
      }
    }
  }
  await Promise.all(perfiles.map(corre))
  return filas
}

// ── B · La matriz de la 1e ──────────────────────────────────────────────────
export async function matriz(browser, { base, tamanos, estados, errores }) {
  const celdas = []
  const corre = async (tactil) => {
    const lista = tamanos.filter((t) => t.tactil === tactil)
    if (!lista.length) return
    for (const estado of estados) {
      const { ctx, page } = await contextoCap(browser, { w: lista[0].w, h: lista[0].h, dpr: 1, movil: tactil }, base, opcionesDe(estado))
      page.on('pageerror', (e) => errores.push(`matriz ${estado} · pageerror: ${e.message}`))
      let llego = true
      try {
        await irA(page, base, estado)
        await page.waitForTimeout(400)
      } catch (e) {
        llego = false
        errores.push(`matriz ${estado} (${tactil ? 'táctil' : 'ratón'}) · no llegó: ${e.message.split('\n')[0]}`)
      }
      try {
        for (const t of lista) {
          const celda = { tam: t.id, estado, tactil, acostado: !!t.acostado, informa: !!t.informa, frontera: t.frontera ?? null, medida: false }
          celdas.push(celda)
          if (!llego) continue
          await page.setViewportSize({ width: t.w, height: t.h })
          await page.waitForTimeout(160)
          await fijaScroll(page, 'arriba')
          const l = await lee(page, OBJETIVO[estado])
          // El estado tiene que seguir siendo el pedido (un error que se apaga
          // solo, un bloque que no salió): si no, la celda no se midió.
          const esElEstado = estado === 'retar-error' ? l.cajaTipo === 'is-alerta'
            : estado === 'retar-video' ? await page.$('[data-accion="mas-monedas"]') !== null
              : estado === 'retar-lectura' ? await page.$('[data-accion="aviso-lectura"]') !== null
                : true
          Object.assign(celda, {
            medida: esElEstado,
            boton: l.boton ? `${l.boton.w.toFixed(1)}×${l.boton.h.toFixed(1)}` : null,
            botonVisible: l.tocable,
            cajaBien: cajaBien(l), cajaTipo: l.cajaTipo,
            filas: l.filas, pagina: Math.max(l.rollo, l.docRollo), ancho: Math.max(l.rolloX, l.docRolloX),
            dosColumnas: l.dosColumnas, menor: l.menor, pan1: l.pan1,
            casaEnCab: l.casaEnCab, casaTitulo: l.casaTitulo, casaBoton: l.casaBoton,
            solapes: l.solapes,
          })
          if (estado === 'retar' && PRONTO_EN.includes(t.id)) {
            Object.assign(celda, await medirPronto(page, OBJETIVO[estado]))
          }
        }
      } catch (e) {
        errores.push(`matriz ${estado} · ${e.message.split('\n')[0]}`)
      } finally {
        await ctx.close()
      }
    }
  }
  await Promise.all([corre(false), corre(true)])
  return celdas
}

/**
 * ARN-4d · lo que le falta a la matriz: una entrada por celda esperada (tamaños por
 * estados) que no se midió. Una celda perdida a media pasada no llega a `celdas`,
 * así que no se cuenta lo que hay: se cuenta lo que tenía que haber.
 */
export function celdasSinMedir(celdas, tamanos, estados) {
  const medidas = new Set(celdas.filter((c) => c.medida).map((c) => `${c.estado} ${c.tam}`))
  return estados.flatMap((e) => tamanos.map((t) => `${e} ${t.id}`)).filter((n) => !medidas.has(n))
}

/**
 * Corre el barrido y la matriz. `browser` es un Chromium (o un WebKit desde una
 * sonda, con `perfiles` de gesto 'rueda' o 'codigo' y `matriz: false` o sus
 * `tamanos`). Devuelve `{ verde, puntos, filas, celdas, sinCobertura, resumen }`.
 */
export async function runTam(browser, {
  base, perfiles = PERFILES_TAM, altos = ALTOS_TAM, pantallas = PANTALLAS_TAM, cdp = true, etiqueta = 'TAM',
  tamanos = TAMANOS_MATRIZ, estados = ESTADOS_MATRIZ, conMatriz = true,
} = {}) {
  const errores = []
  const [filas, celdas] = await Promise.all([
    barrido(browser, { base, perfiles, altos, pantallas, cdp, errores }),
    conMatriz ? matriz(browser, { base, tamanos, estados, errores }) : Promise.resolve([]),
  ])

  const esperadas = perfiles.reduce((n, p) => n + (p.pantallas ?? pantallas).length, 0) * altos.length
  const fallosDe = (k) => filas.filter((f) => !f[k]).map((f) => `${f.perfil} ${f.pantalla} ${f.h}`)
  const medidas = celdas.filter((c) => c.medida)
  const nombre = (c) => `${c.estado} ${c.tam}`
  const puntos = {
    'tam.1': { fallos: fallosDe('t1') },
    'tam.2': { fallos: fallosDe('t2') },
    'tam.3': { fallos: fallosDe('t3') },
    'tam.4': { fallos: fallosDe('t4'), minimo: Math.min(...filas.filter((f) => f.pantalla === 'lobby').map((f) => f.hueco ?? -Infinity)) },
    'tam.5': { fallos: filas.filter((f) => !f.t5).map((f) => `${f.perfil} ${f.pantalla} ${f.h} (${f.solapes.join('; ')})`) },
    'tam.6': { fallos: fallosDe('t6'), ejercidas: filas.filter((f) => f.ejerceFilas).length },
  }
  if (conMatriz) {
    Object.assign(puntos, {
      'tam.7': { fallos: medidas.filter((c) => !c.botonVisible || !c.cajaBien || c.solapes.length).map((c) => `${nombre(c)}${c.solapes.length ? ` (${c.solapes.join('; ')})` : ''}${c.cajaBien ? '' : ' (caja)'}`) },
      'tam.8': {
        fallos: medidas.filter((c) => c.pagina > 1 || c.ancho > 1 || (!c.acostado && !c.informa && c.filas > 1)).map((c) => `${nombre(c)} filas ${c.filas} página ${c.pagina} ancho ${c.ancho}`),
        // Lo que se informa sin juzgar: el acostado y las celdas fuera de la lista.
        informadas: medidas.filter((c) => (c.acostado || c.informa) && c.filas > 1).map((c) => `${nombre(c)} ${c.filas}`),
      },
      'tam.9': { fallos: medidas.filter((c) => c.frontera !== null && c.dosColumnas !== c.frontera).map((c) => `${nombre(c)} dosColumnas=${c.dosColumnas}`) },
      'tam.10': { fallos: medidas.filter((c) => c.tactil && c.menor && c.menor.lado < PISO - 0.01).map((c) => `${nombre(c)} ${c.menor.k} ${c.menor.lado}`) },
      'tam.11': { fallos: medidas.filter((c) => !c.casaEnCab || c.casaTitulo || c.casaBoton).map(nombre) },
      'tam.12': { fallos: medidas.filter((c) => 'pronto' in c && !c.pronto).map((c) => `${nombre(c)} ${c.prontoCaja}`), medidos: medidas.filter((c) => 'pronto' in c).length },
    })
    puntos['tam.12'].ok = puntos['tam.12'].fallos.length === 0 && puntos['tam.12'].medidos === PRONTO_EN.length
  }
  for (const p of Object.values(puntos)) if (p.ok === undefined) p.ok = p.fallos.length === 0
  // ARN-4d · sustituye a «no medidas», que solo veía las celdas que llegaron a nacer.
  const celdasEsperadas = conMatriz ? tamanos.length * estados.length : 0
  const sinMedir = conMatriz ? celdasSinMedir(celdas, tamanos, estados) : []
  puntos.matriz = {
    medidas: filas.length, esperadas, celdas: celdasEsperadas - sinMedir.length, celdasEsperadas,
    fallos: [...(filas.length === esperadas ? [] : [`barrido ${filas.length} de ${esperadas}`]), ...sinMedir],
  }
  puntos.matriz.ok = puntos.matriz.fallos.length === 0
  puntos.consola = { errores, ok: errores.length === 0 }
  // Las filas que no caben se tienen que haber recorrido en algún punto: si en
  // ninguno hizo falta, tam.6 no midió que lo que no cabe se alcanza.
  const ejercidas = puntos['tam.6'].ejercidas
  const sinCobertura = ejercidas ? [] : ['tam.6 (en ningún punto del barrido desbordaron las filas: el gesto no las recorrió)']
  const verde = Object.values(puntos).every((x) => x.ok === true)
  const orden = Object.keys(puntos)
  const resumen = `${verde ? (sinCobertura.length ? 'SIN COBERTURA' : 'VERDE') : 'ROJO'} · ` + orden.map((k) => `${k} ${puntos[k].ok ? '✓' : `✗${puntos[k].fallos ? ` (${puntos[k].fallos.length})` : ''}`}`).join(' · ')
    + ` · ${filas.length} puntos de barrido (${ejercidas} con filas recorridas) · ${celdasEsperadas - sinMedir.length} de ${celdasEsperadas} celdas`
  console.log(`── ${etiqueta} · ${resumen}`)
  for (const k of orden) {
    const f = puntos[k].fallos
    if (f?.length) console.log(`   ${k} ✗ ${f.slice(0, 12).join(' · ')}${f.length > 12 ? ` · … (+${f.length - 12})` : ''}`)
  }
  if (puntos['tam.8']?.informadas.length) console.log(`   tam.8 · filas bajo el botón (informadas): ${puntos['tam.8'].informadas.join(' · ')}`)
  for (const e of errores.slice(0, 5)) console.log(`   consola · ${e}`)
  for (const s of sinCobertura) console.log(`   sin cobertura · ${s}`)
  return { verde, puntos, filas, celdas, sinCobertura, resumen }
}
