// ── IOS-1 1b · el modo `tam` de diagDSK, versión mínima ─────────────────────
// Rector: AJILEI_IOS-1_Fase1ab_v1.0.md §4.4, con el plan del STOP-1. Vive en su
// módulo, como `video`; diagDSK solo lo llama y lee su veredicto por `verde`.
// La versión completa es la 1f.
//
// LAS PANTALLAS BAJAS CON BARRAS DE NAVEGADOR. Ningún modo las medía: el arnés
// mide 768 «limpio» y una laptop 1366×768 en ventana deja 623–657 de alto útil;
// el iPad en Safari, 641. Aquí se barre el alto en horizontal, de 521 a 831 de
// 10 en 10, en dos perfiles de Chromium (laptop con ratón a 1366, tableta
// táctil a 1280), con UN contexto por pantalla y `setViewportSize` (la receta
// de la Fase 0: no depende de las barras de ningún navegador).
//
//   tam.1  el botón principal se ALCANZA: dentro de la ventana y sin nada
//          encima (`elementFromPoint`), de entrada o tras un gesto REAL del
//          usuario — la rueda en la laptop, un arrastre táctil por CDP en la
//          tableta. No vale un `scrollTop` desde código: con `overflow: hidden`
//          también se mueve, y la base saldría verde sin que nadie pudiera bajar
//   tam.2  su nota también, tras el mismo gesto (±1 px)
//   tam.3  donde todo cabe, nada desplaza: ni el documento ni, a lo ancho, la
//          pantalla; y si la pantalla no desborda, el gesto no mueve el botón
//   tam.4  lobby: «Jugar contra jugadores» a ≥ 8 px del menú de abajo
//   tam.5  ningún tocable montado sobre otro (la casa incluida), arriba, a
//          media pasada y al fondo del desplazamiento
//   consola  sin errores de página
//
// Debe nacer ROJO contra 92e2eeb (Retar, Salas y Armar mesa recortan; el lobby
// se monta sobre el menú de 661 a 741) y salir verde con el arreglo.
//
// LO QUE ESTE MODO NO MIDE: la barra de desplazamiento clásica de Windows (el
// Chromium sin pantalla las oculta; en la laptop aparece y corre la columna
// ~7 px), y las barras reales de Safari (aquí el alto es el que queda). La
// pasada de WebKit (1133 de ancho) es una sonda aparte que importa `runTam`: el
// WebKit de Playwright no tiene CDP ni arrastre, y en móvil tampoco rueda, así
// que usa la rueda en escritorio y, en táctil, el gesto `codigo` (en `gesto`).

import { contextoCap } from '../cap/capMesa.mjs'

export const ALTOS_TAM = Object.freeze(Array.from({ length: 32 }, (_, i) => 521 + i * 10))
export const PERFILES_TAM = Object.freeze([
  { id: 'laptop', w: 1366, movil: false, gesto: 'rueda' },
  { id: 'tableta', w: 1280, movil: true, gesto: 'tactil' },
])
export const PANTALLAS_TAM = Object.freeze(['lobby', 'retar', 'retar-video', 'salas', 'armar'])
const HUECO_MIN = 8
const TOL = 0.5

// El botón principal de cada pantalla, y su nota (las de `PantallaChips`).
const OBJETIVO = {
  lobby: { boton: '[data-accion="jugar-pvp"]', nota: null },
  retar: { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  'retar-video': { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
  salas: { boton: '[data-accion="armar"]', nota: null },
  armar: { boton: '[data-accion="cta"]', nota: '[data-accion="cta-nota"]' },
}

async function irA(page, base, pantalla) {
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
  await page.waitForSelector('[data-accion="reto"]:not([disabled])')
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
}

// En la página: la pantalla, el botón, su nota y los tocables. No juzga.
const LEE = ({ boton, nota, tol }) => {
  const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
  const de = document.documentElement
  const vh = innerHeight
  const vw = innerWidth
  const caja = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const b = document.querySelector(boton)
  const n = nota ? document.querySelector(nota) : null
  const cb = caja(b)
  // ¿Se puede tocar? El punto central del botón cae en él (nada encima).
  let tocable = false
  if (cb && cb.t >= -tol && cb.b <= vh + tol && cb.l >= 0 && cb.r <= vw) {
    const e = document.elementFromPoint((cb.l + cb.r) / 2, (cb.t + cb.b) / 2)
    tocable = !!e && (e === b || b.contains(e))
  }
  // Tocables visibles, dentro de la ventana, y sus solapes de dos en dos.
  const sel = 'button, input, select, textarea, a[href], [role="button"]'
  const vivos = [...raiz.querySelectorAll(sel)].filter((e) => {
    if (!e.getClientRects().length) return false
    const cs = getComputedStyle(e)
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || cs.pointerEvents === 'none') return false
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw
  })
  const nombre = (e) => e.dataset.accion || e.getAttribute('aria-label') || e.className || e.tagName
  const solapes = []
  for (let i = 0; i < vivos.length; i++) {
    for (let j = i + 1; j < vivos.length; j++) {
      const p = vivos[i]
      const q = vivos[j]
      if (p.contains(q) || q.contains(p)) continue
      const a = p.getBoundingClientRect()
      const c = q.getBoundingClientRect()
      const x = Math.min(a.right, c.right) - Math.max(a.left, c.left)
      const y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)
      if (x > tol && y > tol) solapes.push(`${nombre(p)}×${nombre(q)} ${Math.min(x, y).toFixed(1)}`)
    }
  }
  const lobby = document.querySelector('main.lobby')
  let hueco = null
  if (lobby) {
    const p = document.querySelector('[data-accion="jugar-pvp"]')?.getBoundingClientRect()
    const nav = document.querySelector('.lob-nav')?.getBoundingClientRect()
    if (p && nav) hueco = +(nav.top - p.bottom).toFixed(1)
  }
  return {
    vh, vw,
    rollo: raiz.scrollHeight - raiz.clientHeight,
    rolloX: raiz.scrollWidth - raiz.clientWidth,
    docRollo: de.scrollHeight - de.clientHeight,
    docRolloX: de.scrollWidth - de.clientWidth,
    overflowY: getComputedStyle(raiz).overflowY,
    top: raiz.scrollTop,
    // La nota cuenta si se VE: con el bloque del video, Retar la oculta y solo
    // reserva su caja (salas.css, `:has(.sal-saldo) .sal-accion small`).
    boton: cb, nota: caja(n), notaVisible: !!n && getComputedStyle(n).visibility !== 'hidden' && n.textContent.trim() !== '',
    tocable, solapes, hueco,
  }
}
const lee = (page, obj) => page.evaluate(LEE, { ...obj, tol: TOL })
const fijaScroll = (page, donde) => page.evaluate((d) => {
  const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
  const max = raiz.scrollHeight - raiz.clientHeight
  raiz.scrollTop = d === 'arriba' ? 0 : d === 'medio' ? Math.round(max / 2) : max
}, donde)

// Espera a que el desplazamiento se quede quieto (la rueda y el arrastre de
// Chromium animan): dos lecturas iguales seguidas, con tope.
async function quieto(page) {
  let antes = null
  for (let i = 0; i < 30; i++) {
    const t = await page.evaluate(() => (document.querySelector('main.sal') || document.querySelector('main.lobby')).scrollTop)
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
    // desplaza nada en este Chromium sin pantalla: medido en el STOP-2.)
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      const y0 = Math.round(vh * 0.8)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - i * 30 }] })
        await page.waitForTimeout(16)
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await quieto(page)
    }
  } else if (perfil.gesto === 'codigo') {
    // Solo para la sonda de WebKit móvil, que no admite ni la rueda ni un
    // arrastre (Playwright): baja desde código, pero SOLO si la pantalla deja
    // desplazar al usuario (`overflow-y` auto o scroll). Con `hidden` no se
    // mueve, y la base no puede salir verde por esta vía.
    await page.evaluate(() => {
      const raiz = document.querySelector('main.sal') || document.querySelector('main.lobby')
      if (/auto|scroll/.test(getComputedStyle(raiz).overflowY)) raiz.scrollTop = raiz.scrollHeight
    })
  } else {
    await page.mouse.move(x, y)
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 600)
  }
  await quieto(page)
}

const dentro = (c, vh) => !!c && c.t >= -TOL && c.b <= vh + 1

/**
 * Corre el barrido. `browser` es un Chromium (o un WebKit desde una sonda, con
 * `perfiles` de gesto 'rueda'). Devuelve `{ verde, puntos, filas, resumen }`.
 */
export async function runTam(browser, { base, perfiles = PERFILES_TAM, altos = ALTOS_TAM, pantallas = PANTALLAS_TAM, cdp = true, etiqueta = 'TAM' } = {}) {
  const errores = []
  const filas = []
  const corre = async (perfil) => {
    for (const pantalla of pantallas) {
      const op = pantalla === 'retar-video' ? { billetera: { saldo: 1500 } } : {}
      const { ctx, page } = await contextoCap(browser, { w: perfil.w, h: 700, dpr: 1, movil: perfil.movil }, base, op)
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
          // Media pasada y fondo, para los solapes (tam.5) con la casa fija.
          let medio = arriba
          let fondo = arriba
          if (arriba.rollo > 1) {
            await fijaScroll(page, 'medio'); medio = await lee(page, obj)
            await fijaScroll(page, 'fondo'); fondo = await lee(page, obj)
            await fijaScroll(page, 'arriba')
          }
          // tam.1/tam.2 · si de entrada no se alcanza, el gesto del usuario.
          let tras = arriba
          let gestoUsado = false
          const notaOk = (l) => !obj.nota || !l.notaVisible || dentro(l.nota, l.vh)
          const yaEsta = arriba.tocable && notaOk(arriba)
          if (!yaEsta || arriba.rollo <= 1) {
            // Donde no desborda también se hace el gesto: tam.3 exige que no mueva nada.
            await gesto(page, perfil, sesion)
            tras = await lee(page, obj)
            gestoUsado = !yaEsta
            await fijaScroll(page, 'arriba')
          }
          const fila = {
            perfil: perfil.id, pantalla, h,
            rollo: +arriba.rollo.toFixed(1), overflowY: arriba.overflowY, gestoUsado,
            desplazoTrasGesto: tras.top,
            't1': (yaEsta ? arriba.tocable : tras.tocable),
            't2': notaOk(yaEsta ? arriba : tras),
            't3': arriba.docRollo <= 1 && arriba.docRolloX <= 1 && arriba.rolloX <= 1
              && (arriba.rollo > 1 || !tras.boton || !arriba.boton || Math.abs(tras.boton.t - arriba.boton.t) <= 1),
            't4': pantalla !== 'lobby' || (arriba.hueco !== null && arriba.hueco >= HUECO_MIN),
            hueco: arriba.hueco,
            solapes: [...new Set([...arriba.solapes, ...medio.solapes, ...fondo.solapes])],
            ctaFin: arriba.boton ? +(arriba.boton.b - arriba.vh).toFixed(1) : null,
          }
          fila.t5 = fila.solapes.length === 0
          fila.ok = fila.t1 && fila.t2 && fila.t3 && fila.t4 && fila.t5
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

  const esperadas = perfiles.length * pantallas.length * altos.length
  const fallosDe = (k) => filas.filter((f) => !f[k]).map((f) => `${f.perfil} ${f.pantalla} ${f.h}`)
  const puntos = {
    'tam.1': { fallos: fallosDe('t1') },
    'tam.2': { fallos: fallosDe('t2') },
    'tam.3': { fallos: fallosDe('t3') },
    'tam.4': { fallos: fallosDe('t4'), minimo: Math.min(...filas.filter((f) => f.pantalla === 'lobby').map((f) => f.hueco ?? -Infinity)) },
    'tam.5': { fallos: filas.filter((f) => !f.t5).map((f) => `${f.perfil} ${f.pantalla} ${f.h} (${f.solapes.join('; ')})`) },
  }
  for (const p of Object.values(puntos)) p.ok = p.fallos.length === 0
  puntos.matriz = { medidas: filas.length, esperadas, ok: filas.length === esperadas }
  puntos.consola = { errores, ok: errores.length === 0 }
  // El desplazamiento se tiene que haber ejercido: si en ningún punto hizo
  // falta el gesto, tam.1 no midió que el botón SE ALCANZA desplazando.
  const conGesto = filas.filter((f) => f.gestoUsado).length
  const sinCobertura = conGesto ? [] : ['tam.1 (en ningún punto hizo falta desplazar: el gesto no se ejerció)']
  const verde = Object.values(puntos).every((x) => x.ok === true)
  const orden = ['tam.1', 'tam.2', 'tam.3', 'tam.4', 'tam.5', 'matriz', 'consola']
  const resumen = `${verde ? (sinCobertura.length ? 'SIN COBERTURA' : 'VERDE') : 'ROJO'} · ` + orden.map((k) => `${k} ${puntos[k].ok ? '✓' : `✗${puntos[k].fallos ? ` (${puntos[k].fallos.length})` : ''}`}`).join(' · ')
    + ` · ${filas.length} puntos, ${conGesto} con gesto`
  console.log(`── ${etiqueta} · ${resumen}`)
  for (const k of ['tam.1', 'tam.2', 'tam.3', 'tam.4', 'tam.5']) {
    if (puntos[k].fallos.length) console.log(`   ${k} ✗ ${puntos[k].fallos.slice(0, 12).join(' · ')}${puntos[k].fallos.length > 12 ? ` · … (+${puntos[k].fallos.length - 12})` : ''}`)
  }
  for (const e of errores.slice(0, 5)) console.log(`   consola · ${e}`)
  for (const s of sinCobertura) console.log(`   sin cobertura · ${s}`)
  return { verde, puntos, filas, sinCobertura, resumen }
}
