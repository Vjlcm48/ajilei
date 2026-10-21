// ── TAB-1 1e · el modo `tab` de diagDSK ─────────────────────────────────────
// Rector: AJILEI_TAB-1_Fase1b-1e_Codigo_v1.0.md §4 1e y §5. Vive en su módulo,
// como `tam` y `webkit`; diagDSK solo lo llama y lee su veredicto por `verde`.
//
// La mesa se adapta al tamaño con «traje + escala» (src/lib/escala.js y
// src/styles/escala.css): un solo factor, `zoom` sobre #root, escrito como
// `data-escala` + `--escala` en <html> SOLO mientras la mesa está montada y
// SOLO fuera del celular. Este modo mide esa escala DE VERDAD: es el único que
// pide `escalaReal()` al terreno común; todos los demás corren con la escala
// forzada a 1 (el interruptor `escala=1` de scripts/arnes/comun.mjs).
//
//   V-cel    celular intacto: (a) los 25 pares del Grupo 1 de la lámina, esta
//            versión con la escala viva frente a la referencia (`--ref`, `main`
//            antes de TAB-1) o, sin ella, frente a la escala forzada a 1:
//            0 px distintos, ruido 0, y ningún intento de escribir el atributo
//            o la variable en toda la visita; (b) las 88 celdas de celular de
//            `ref/t3_matriz.csv` (la matriz de la Fase 0, medida en `9fef917`),
//            BYTE A BYTE, con la sonda de entonces
//   V-tv     tableta y toda ventana vertical de lado corto ≥ 600: cabe sin
//            desplazar, las P con su semáforo frente al S25 sin ningún rojo,
//            zona táctil ≥ 44 y el factor de la fórmula
//   V-h      horizontal (laptop, iPad, monitores): cabe sin desplazar ni un px,
//            etiquetas ≥ 10 px visibles (y sin mover la maqueta: O1), frase
//            ≥ 12 px visibles, nada bajo la banda de R-7, la ✕ no pisa el logo,
//            y el factor de la fórmula
//   V-vuelo  con f ≠ 1 (×1,301 y ×0,874): las cartas en vuelo y las monedas
//            aterrizan a ≤ 1 px de su destino; el globo de VOZ-2 cae donde
//            `colocaCapa` lo pone (≤ 1 px), centrado sobre el óvalo y dentro
//            de la ventana
//   V-fuera  fuera de la mesa (lobby, Retar con sus cuatro filas, Salas, Armar
//            mesa): sin atributo, sin variable y #root sin zoom; y con
//            `--ref=<url>` (un `vite preview` de otra versión, p. ej. `main`)
//            0 px distintos frente a ella. Entrar a la mesa escribe el
//            atributo y salir lo borra
//   V-giro   744×1100 → 1100×744 → 744×1100 en pleno reparto: cabe en los tres
//            estados, con su atributo, y sin errores de página
//
// `diagDSK tab [cel] [tv] [h] [vuelo] [fuera] [giro]` corre solo esas varas.
//
// UN VERDE MIDE LO QUE DICE. Una celda que no llegó a su estado sale «no
// medida» y la vara no es verde. Las fotos se toman con TODAS las animaciones
// detenidas en su instante 0 (lección del Grupo 1 de la lámina: `turnBreath`
// da 36 000 px de ruido), y las cajas se leen pintadas (`getBoundingClientRect`
// es la caja VISUAL bajo `zoom`).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { contextoCap, mesaQuieta, compararPng, equivalentes, TOLERANCIA_CAP } from '../cap/capMesa.mjs'
import { recorrerRuta } from '../rutaMesa.mjs'
import { escalaReal, forzarEscala1 } from '../arnes/comun.mjs'
import { irA } from '../ios/tam.mjs'
import * as V from '../voz2/voz2Mesa.mjs'
import { escalaDe, RESERVA_PIE_FS } from '../../src/lib/escala.js'
import { anchoCapa, colocaCapa } from '../../src/hooks/voz2Core.js'

export const VARAS_TAB = Object.freeze(['cel', 'tv', 'h', 'vuelo', 'fuera', 'giro'])
export const RUTA_T3 = new URL('./ref/t3_matriz.csv', import.meta.url)
const PAR = 6
// `TAB_SOLO=<expresión>` acota V-tv y V-h a las celdas «<tamaño> m<mesa> <estado>»
// que casan (los controles rojos no necesitan la matriz entera). Una corrida
// acotada no es la vara: lo dice en su resumen.
const SOLO = process.env.TAB_SOLO ? new RegExp(process.env.TAB_SOLO) : null
const pasaSolo = (t, n, e) => !SOLO || SOLO.test(`${t.id} m${n} ${e}`)
const SEMILLA = 7
const PISO_TACTIL_TV = 44
const PISO_ETIQUETA = 10
const PISO_FRASE = 12
// La ✕ de Safari en pantalla completa horizontal, en px de la página (Fase 0, T5.1).
const EQUIS_SAFARI = Object.freeze({ x0: 21, x1: 78, y0: 5, y1: 50 })

// ── Los tamaños ────────────────────────────────────────────────────────────
// Grupo 1 de la lámina (laminas/tab1/grupos.js), más el S25 a densidad 3.
export const G1 = Object.freeze({
  tamanos: [{ id: '360x640', w: 360, h: 640 }, { id: '390x844', w: 390, h: 844 }, { id: '412x915', w: 412, h: 915 }, { id: '915x412', w: 915, h: 412 }],
  mesas: [5, 2], estados: ['reposo', 'turno', 'entre'],
})
export const TV = Object.freeze({
  tamanos: [
    { id: '744x1100', w: 744, h: 1100, n: 'iPad mini 6, app instalada' },
    { id: '744x1047', w: 744, h: 1047, n: 'iPad mini 6, Safari con barras' },
    { id: '834x1108', w: 834, h: 1108, n: 'iPad 11", Safari (sup.)' },
    { id: '1024x1259', w: 1024, h: 1259, n: 'iPad Pro 13", Safari (sup.)' },
  ],
  mesas: [2, 3, 4, 5], estados: ['reposo', 'turno', 'entre'],
})
export const HZ = Object.freeze({
  tamanos: [
    { id: '1366x623', w: 1366, h: 623, movil: false, n: 'laptop de Victor' },
    { id: '1366x633', w: 1366, h: 633, movil: false, n: 'laptop 1366' },
    { id: '1133x658', w: 1133, h: 658, movil: true, n: 'iPad mini 6, Safari con barras' },
    { id: '1133x716fs', w: 1133, h: 716, movil: true, pc: true, n: 'iPad mini 6, pantalla completa' },
    { id: '1920x1080', w: 1920, h: 1080, movil: false, n: 'monitor 24"' },
    { id: '2560x1300', w: 2560, h: 1300, movil: false, n: 'monitor QHD (tope)' },
  ],
  mesas: [5, 2], estados: ['turno', 'entre'],
})
export const FUERA = Object.freeze({
  tamanos: [{ id: '744x1100', w: 744, h: 1100, movil: true }, { id: '1366x623', w: 1366, h: 623, movil: false }, { id: '1920x1080', w: 1920, h: 1080, movil: false }],
  pantallas: ['lobby', 'retar', 'salas', 'armar'],
})

// ── Utilidades de página ───────────────────────────────────────────────────
const raf2 = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
// Los pulsos infinitos (`turnBreath`…) se detienen en su instante 0, como en la
// lámina; lo FINITO (transiciones, entradas) se termina. Pausar una transición
// en 0 la deja en su valor de PARTIDA si seguía viva y en el final si ya había
// acabado: dos contextos con relojes distintos «diferían» hasta 33 niveles en
// el brillo de la zona del jugador al entrar en turno sin que nada cambiara.
async function quietas(page, cancelar = false) {
  await page.evaluate((FOTO) => {
    for (const a of document.getAnimations()) {
      if (a.effect?.getComputedTiming().iterations === Infinity) { if (FOTO.cancelar) a.cancel(); else { a.pause(); a.currentTime = 0 } } else { try { a.finish() } catch { a.pause() } }
    }
  }, { cancelar })
  await raf2(page)
}
// useCongelado obedece a `document.hidden`: la mesa deja de programar pasos.
const CONGELAR = () => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
  document.dispatchEvent(new Event('visibilitychange'))
}
// Cuenta los intentos de escribir la escala en <html> (sin impedirlos).
const CONTAR_ESCRITURAS = () => {
  window.__tabEscrituras = 0
  const setAttr = Element.prototype.setAttribute
  Element.prototype.setAttribute = function (k, v) {
    if (k === 'data-escala' && this === document.documentElement) window.__tabEscrituras++
    return setAttr.call(this, k, v)
  }
  const setProp = CSSStyleDeclaration.prototype.setProperty
  CSSStyleDeclaration.prototype.setProperty = function (k, ...r) {
    if (k === '--escala' && document.documentElement && this === document.documentElement.style) window.__tabEscrituras++
    return setProp.call(this, k, ...r)
  }
}
// La celda horizontal sin pantalla completa: «Iniciar mano» la pide en táctil
// (PAN-1 1c) y Chromium sin cabeza la concede sin cambiar la ventana.
const SIN_PANTALLA_COMPLETA = () => { Element.prototype.requestFullscreen = function () { return Promise.resolve() } }

/** Una página en la mesa `n`, en reposo («Iniciar mano» a la vista). */
async function abrirMesa(browser, base, v, n, { forzar = false, contar = false, sinPC = false } = {}) {
  const { ctx, page, errores } = await contextoCap(browser, { w: v.w, h: v.h, dpr: v.dpr ?? 1, movil: v.movil ?? true }, base, { semilla: SEMILLA })
  if (forzar) await forzarEscala1(ctx)
  if (contar) await ctx.addInitScript(CONTAR_ESCRITURAS)
  if (sinPC) await ctx.addInitScript(SIN_PANTALLA_COMPLETA)
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  await page.goto(base, { waitUntil: 'networkidle' })
  await recorrerRuta(page, n, 'basico', 0, 'medio')
  await page.waitForSelector('button:has-text("Iniciar mano")', { timeout: 20000 })
  await page.mouse.move(2, 2)
  return { ctx, page, errores }
}

const ESTADO_MESA = () => {
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
  const btn = (re) => [...document.querySelectorAll('button')].find((b) => re.test(b.innerText.trim()) && !b.disabled && vis(b))
  return {
    iniciar: !!btn(/^Iniciar mano$/), siguiente: !!btn(/^Siguiente mano$/),
    turno: [...document.querySelectorAll('[data-accion="apostar"]')].some((b) => !b.disabled && vis(b)),
    mult: document.querySelectorAll('.btn-mult:not(.apu-monto)').length,
    crono: parseInt(document.querySelector('.timer-display')?.innerText || '0', 10),
    retiro: [...document.querySelectorAll('[data-accion="retirarse"], [data-accion="pasar"]')].find((b) => !b.disabled && vis(b))?.dataset.accion || null,
  }
}
async function pulsarIniciar(page, re = /^(Iniciar mano|Siguiente mano)$/) {
  await page.locator('button', { hasText: re }).first().click({ timeout: 2000 }).catch(() => {})
  await page.mouse.move(2, 2).catch(() => {})
}
/** Turno del humano con el cronómetro holgado. */
async function aTurno(page, ms = 45000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const s = await page.evaluate(ESTADO_MESA)
    if (s.turno && s.mult && s.crono >= 12) return true
    if (s.iniciar || s.siguiente) await pulsarIniciar(page)
    await page.waitForTimeout(250)
  }
  return false
}
/** Entre manos: jugar retirándose hasta «Siguiente mano». */
async function aEntre(page, ms = 90000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const s = await page.evaluate(ESTADO_MESA)
    if (s.siguiente) return true
    if (s.iniciar) await pulsarIniciar(page, /^Iniciar mano$/)
    else if (s.retiro) await page.click(`[data-accion="${s.retiro}"]`).catch(() => {})
    await page.waitForTimeout(300)
  }
  return false
}
async function aEstado(page, estado) {
  if (estado === 'reposo') { await mesaQuieta(page, 3000); return true }
  if (estado === 'turno') { const ok = await aTurno(page); if (ok) await mesaQuieta(page, 1500); return ok }
  const ok = await aEntre(page)
  if (ok) { await mesaQuieta(page, 4000); await page.waitForTimeout(2000) }
  return ok
}

// Lo que la escala dejó escrito (o no) en el documento.
const HUELLA_ESCALA = () => ({
  attr: document.documentElement.getAttribute('data-escala'),
  f: document.documentElement.style.getPropertyValue('--escala') || null,
  zoom: getComputedStyle(document.getElementById('root')).zoom,
  escrituras: window.__tabEscrituras ?? null,
})

// ── La medida de la mesa (la `medir()` de la lámina, con lo que piden V-tv y V-h)
const MEDIR_TAB = () => {
  const html = document.documentElement
  const f = parseFloat(html.style.getPropertyValue('--escala')) || 1
  const W = innerWidth, H = innerHeight
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
  const q = (s, raiz = document) => [...raiz.querySelectorAll(s)].filter(vis)
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right } }
  const boton = (re) => [...document.querySelectorAll('button')].find((b) => re.test(b.innerText.trim()) && vis(b))
  const gt = R(document.querySelector('.game-table'))
  const pz = document.querySelector('.player-zone')
  const cartaJ = R(pz && (q('.playing-card', pz)[0] || q('.card-slot-wrapper, .card-slot', pz)[0]))
  const oval = R(q('.center-zone')[0] || q('.felt-oval.oval-right')[0] || q('.two-ovals')[0])
  const msg = q('.game-message')[0]
  const frase = msg ? parseFloat(getComputedStyle(msg).fontSize) * f : null
  const btns = q('[data-accion="apostar"], [data-accion="pasar"], [data-accion="retirarse"], [data-accion="igualar"]')
  const ini = boton(/^(Iniciar mano|Siguiente mano)$/)
  const chips = q('.btn-mult:not(.apu-monto)')
  // Zona táctil: el escáner de `diagDSK tactil` (elementFromPoint desde el
  // centro hacia fuera, hasta que el punto deja de ser suyo).
  const zona = (el) => {
    const r = el.getBoundingClientRect()
    const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2)
    const suyo = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
    if (!suyo(cx, cy)) return { w: 0, h: 0, tapado: true }
    const scan = (dx, dy) => { let x = cx, y = cy, n = 0; while (n < 160 && suyo(x + dx, y + dy)) { x += dx; y += dy; n++ } return { x, y } }
    return { w: scan(1, 0).x - scan(-1, 0).x + 1, h: scan(0, 1).y - scan(0, -1).y + 1 }
  }
  const tocables = [
    ...btns.map((e) => ['accion:' + e.dataset.accion, e]), ...chips.map((e) => ['chip:' + e.innerText.trim(), e]),
    ...(ini ? [['iniciar', ini]] : []), ...q('.utilities-trigger').map((e) => ['menu', e]), ...q('.btn-leave').map((e) => ['salir', e]),
  ].map(([k, e]) => ({ k, ...zona(e) }))
  const tactil = tocables.length ? tocables.reduce((m, t) => (Math.min(t.w, t.h) < Math.min(m.w, m.h) ? t : m)) : null
  // P-hueco: tapete vacío entre el fondo de la cabecera y el borde de la zona del jugador
  const cab = [...q('.table-title, .table-brand, .hand-badge, .utilities-trigger, .btn-leave, .table-header')].map((e) => e.getBoundingClientRect())
  const riv = q('.opp-panel, .ai-zone').map((e) => e.getBoundingClientRect())
  const pzr = R(pz)
  let hueco = null
  if (gt && pzr && oval) {
    const y0 = cab.length ? Math.max(gt.y, Math.max(...cab.filter((r) => r.top < gt.y + gt.h / 3).map((r) => r.bottom))) : gt.y
    const y1 = pzr.y
    const iv = [...riv.map((r) => [r.top, r.bottom]), [oval.y, oval.b]].map(([a, b]) => [Math.max(a, y0), Math.min(b, y1)]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0])
    let cubierto = 0, fin = y0
    for (const [a, b] of iv) { if (b <= fin) continue; cubierto += b - Math.max(a, fin); fin = b }
    hueco = Math.max(0, y1 - y0 - cubierto)
  }
  const dentro = (r) => r && r.y >= -0.5 && r.b <= H + 0.5 && r.x >= -0.5 && r.r <= W + 0.5
  const piezas = {
    cartas: cartaJ, botones: btns.length ? R(btns[btns.length - 1]) : null, 'Iniciar/Siguiente': R(ini), Recargar: R(boton(/^Recargar$/)),
    chips: chips.length ? R(chips[chips.length - 1]) : null, pie: R(q('.pbr-mesa')[0]), 'zona del jugador': pzr,
  }
  const fuera = Object.entries(piezas).filter(([, r]) => r && !dentro(r)).map(([k, r]) => `${k} +${(r.b - H).toFixed(1)}`)
  const scr = document.querySelector('.game-table-screen'), se = document.scrollingElement
  const pc = !!document.fullscreenElement
  const banda = pc && W > H ? 28 : 0
  const bajoBanda = banda ? Math.max(0, ...Object.values(piezas).filter(Boolean).map((r) => r.b - (H - banda))) : 0
  const logo = R(q('.table-title')[0] || q('.table-brand')[0])
  const chicas = q('.hand-badge, .seat-badge').map((e) => ({ t: e.innerText.trim(), px: parseFloat(getComputedStyle(e).fontSize) * f }))
  return {
    W, H, f, attr: html.getAttribute('data-escala'), zoom: getComputedStyle(document.getElementById('root')).zoom, pc,
    gt, oval, cartaJ, pz: pzr, logo,
    frase, chicaMin: chicas.length ? Math.min(...chicas.map((c) => c.px)) : null, chicas,
    tactil, tocables,
    P: gt && oval && cartaJ ? { ovalo: oval.h / gt.h, hueco: hueco != null ? hueco / gt.h : null, carta: cartaJ.h / gt.h, frase: frase && cartaJ.h ? frase / cartaJ.h : null } : null,
    fuera, desplaza: { pantalla: scr ? scr.scrollHeight - scr.clientHeight : null, doc: se.scrollHeight - se.clientHeight, ancho: se.scrollWidth - se.clientWidth },
    bajoBanda,
    equisLogo: pc && logo ? Math.max(0, Math.min(logo.r, 78) - Math.max(logo.x, 21)) * Math.max(0, Math.min(logo.b, 50) - Math.max(logo.y, 5)) : 0,
    mensaje: (msg?.innerText || '').replace(/\s+/g, ' ').trim(),
  }
}
// Las anclas que las etiquetas no pueden mover (O1).
const ANCLAS = () => {
  const r = (s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 100) / 100) }
  return {
    gt: r('.game-table'), pz: r('.player-zone'), oval: r('.center-zone') || r('.felt-oval.oval-right'), carta: r('.player-zone .card-slot-wrapper'),
    accion: r('.action-area'), barra: r('.player-bar'), riv: [...document.querySelectorAll('.opp-panel, .ai-zone')].map((e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 100) / 100) }),
  }
}

// ══ V-cel ══════════════════════════════════════════════════════════════════
// (a) Los pares del Grupo 1. Cada par son DOS contextos con la misma semilla,
// el mismo recorrido y el mismo estado: A con esta versión y la escala viva; B
// con la referencia (`--ref`, p. ej. `main` antes de TAB-1) o, sin ella, con
// la escala forzada a 1. Las dos fotos con la mesa congelada, las animaciones
// en su instante 0 y los dígitos del cronómetro enmascarados igual en las dos
// (el único texto que depende del reloj de pared). C repite A: el ruido.
// ENTRE DOS CONTEXTOS EL RASTER NO ES DETERMINISTA: la MISMA build contra sí
// misma da hasta ~43 000 px distintos en turno (Δ ≤ 38, el tapete y los bordes
// de las cartas; control medido en la 1e), aunque la maqueta sea idéntica al
// byte (la matriz T3 de abajo). Por eso un par es bueno si sale IDÉNTICO o, si
// no, EQUIVALENTE con la vara de `diagPUE cap` (`TOLERANCIA_CAP`: el 99,9 % de
// los píxeles con Δ ≤ 2 y ninguno con Δ > 40); el resumen cuenta cuántos
// salieron idénticos al píxel. Dentro de la página (A frente a C) se exige 0.
// La lámina comparaba en UNA página encendiendo y apagando sus hojas; aquí
// escala.css va en el MISMO trozo de CSS que las @keyframes de la mesa, y
// tocar ese CSSOM re-resuelve las animaciones (medido: hasta 62 012 px de
// «diferencia» sin un solo atributo escrito). Por eso no se borra nada.
const MASCARA_RELOJ = 'html body .game-table-screen :is(.timer-display, .ls-timer) { color: transparent; text-shadow: none; }'
async function fotoCelda(browser, base, t, n, estado, dpr, { forzar = false } = {}) {
  const { ctx, page, errores } = await abrirMesa(browser, base, { ...t, dpr, movil: true }, n, { contar: true, forzar })
  try {
    if (!(await aEstado(page, estado))) { await ctx.close(); return { medida: false, motivo: `sin ${estado}` } }
    await page.evaluate(CONGELAR)
    await page.waitForTimeout(estado === 'entre' ? 6000 : 500)
    await page.addStyleTag({ content: MASCARA_RELOJ })
    await quietas(page, true)
    const png = await page.screenshot()
    return { medida: true, png, huella: await page.evaluate(HUELLA_ESCALA), page, ctx, errores }
  } catch (e) { await ctx.close(); throw e }
}
async function parG1(browser, base, ref, t, n, estado, dpr) {
  let a = null, b = null
  try {
    a = await fotoCelda(browser, base, t, n, estado, dpr)
    if (!a.medida) return a
    b = await fotoCelda(browser, ref || base, t, n, estado, dpr, { forzar: !ref })
    if (!b.medida) return { medida: false, motivo: `referencia ${b.motivo}` }
    await quietas(a.page, true)
    const c = await a.page.screenshot()
    const ab = await compararPng(a.page, a.png, b.png)
    const ac = await compararPng(a.page, a.png, c)
    // `TAB_FOTOS=<carpeta>` vuelca las dos fotos de cada par distinto (diagnóstico).
    if (ab.distintos && process.env.TAB_FOTOS) {
      mkdirSync(process.env.TAB_FOTOS, { recursive: true })
      const k = `${t.id}_m${n}_${estado}${dpr !== 1 ? '@' + dpr : ''}`
      writeFileSync(`${process.env.TAB_FOTOS}/${k}_A.png`, a.png); writeFileSync(`${process.env.TAB_FOTOS}/${k}_B.png`, b.png)
    }
    return {
      medida: true, distintos: ab.distintos ?? -1, total: ab.pixeles ?? 0, equivalente: equivalentes(ab), deltaMax: ab.deltaMax, fraccionFina: ab.fraccionFina,
      ruido: ac.distintos, ruidoEquivalente: equivalentes(ac), huella: a.huella, contra: ref ? 'referencia' : 'escala=1', errores: [...a.errores, ...b.errores],
    }
  } finally {
    if (a?.ctx) await a.ctx.close()
    if (b?.ctx) await b.ctx.close()
  }
}

// (b) La matriz de la Fase 0, celdas de celular, BYTE A BYTE. La sonda es la de
// entonces (`sonda.mjs` de la Fase 0), copiada sin cambiar una coma de lo que
// mide; las filas se escriben como las escribía `analisis.py` (el `csv` de
// Python: `True`/`False`, vacío para null, CRLF).
const MEDIR_T3 = () => {
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none'
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }
  const q = (s, raiz = document) => [...raiz.querySelectorAll(s)].filter(vis)
  const fs = (e) => e ? parseFloat(getComputedStyle(e).fontSize) : null
  const W = innerWidth, H = innerHeight
  const btnTxt = (re) => q('button').find((b) => re.test(b.innerText.trim()))
  const pz = document.querySelector('.player-zone')
  const cartaJ = pz ? q('.playing-card', pz)[0] : null
  const cartaIA = q('.opp-cards .playing-card, .ai-zone .playing-card')[0] || q('.opp-card-slot, .ai-zone .card-slot-wrapper')[0]
  const oval = q('.center-zone')[0] || q('.felt-oval.oval-right')[0] || q('.two-ovals')[0]
  const msg = q('.game-message')[0]
  const nombre = q('.opp-name, .ai-name')[0]
  const estado = q('.opp-status')[0] || q('.ai-zone .ai-info, .ai-label')[0]
  const mano = q('.hand-badge')[0]
  const saldo = q('.pbr-chips .bd-num, .pbr-chips, .bd-num')[0]
  const mesa = q('.pbr-mesa')[0]
  const timer = q('.timer-display')[0]
  const apostar = q('[data-accion="apostar"], [data-accion="pasar"], [data-accion="igualar"]')
  const chips = q('.btn-mult:not(.apu-monto)')
  const badges = q('.player-zone .seat-badge, .player-bar .seat-badge')
  const iniciar = btnTxt(/^(Iniciar mano|Siguiente mano)$/)
  const recargar = btnTxt(/^Recargar$/)
  const pie = [...badges, mesa].filter(Boolean)
  const dentro = (r) => r && r.y >= -0.5 && r.y + r.h <= H + 0.5 && r.x >= -0.5 && r.x + r.w <= W + 0.5
  const scr = document.querySelector('.game-table-screen')
  const se = document.scrollingElement
  const partes = [...q('.opp-panel, .ai-zone'), oval, pz].filter(Boolean).map((e) => e.getBoundingClientRect())
  let occ = null, caja = null
  if (partes.length) {
    const x0 = Math.max(0, Math.min(...partes.map((r) => r.left))), y0 = Math.max(0, Math.min(...partes.map((r) => r.top)))
    const x1 = Math.min(W, Math.max(...partes.map((r) => r.right))), y1 = Math.min(H, Math.max(...partes.map((r) => r.bottom)))
    caja = { x: +x0.toFixed(0), y: +y0.toFixed(0), w: +(x1 - x0).toFixed(0), h: +(y1 - y0).toFixed(0) }
    occ = +(((x1 - x0) * (y1 - y0)) / (W * H)).toFixed(3)
  }
  const fuera = []
  if (msg && oval) { const a = msg.getBoundingClientRect(), o = oval.getBoundingClientRect(); const d = Math.max(o.left - a.left, a.right - o.right, o.top - a.top, a.bottom - o.bottom); if (d > 0.5) fuera.push(`msg fuera del óvalo ${d.toFixed(1)}`) }
  for (const e of q('.opp-name, .opp-status, .ai-name, .game-message, .comodin-note, [data-accion], .btn-mult')) {
    if (e.scrollWidth > e.clientWidth + 1) fuera.push(`${e.className.split(' ')[0]} desborda ${e.scrollWidth - e.clientWidth}`)
  }
  const tocables = q('[data-accion], .btn-mult:not(.apu-monto), .utilities-trigger, .btn-leave').map((e) => ({ k: e.dataset.accion || e.className.split(' ')[0] + (e.classList.contains('btn-mult') ? e.innerText.trim() : ''), ...R(e) }))
  const solapes = []
  for (let i = 0; i < tocables.length; i++) for (let j = i + 1; j < tocables.length; j++) {
    const a = tocables[i], b = tocables[j]
    const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
    if (ix > 0.5 && iy > 0.5) solapes.push(`${a.k}×${b.k}`)
  }
  return {
    W, H, cartaJ: R(cartaJ), cartaIA: R(cartaIA), oval: R(oval),
    f: { msg: fs(msg), nombre: fs(nombre), estado: fs(estado), mano: fs(mano), saldo: fs(saldo), mesa: fs(mesa), boton: fs(apostar[0] || iniciar), timer: fs(timer) },
    hBoton: apostar.length ? Math.min(...apostar.map((b) => b.getBoundingClientRect().height)) : (iniciar ? iniciar.getBoundingClientRect().height : null),
    hChip: chips.length ? Math.min(...chips.map((b) => b.getBoundingClientRect().height)) : null,
    cabe: {
      iniciar: iniciar ? dentro(R(iniciar)) : null, recargar: recargar ? dentro(R(recargar)) : null,
      acciones: apostar.length ? apostar.every((b) => dentro(R(b))) : null, chips: chips.length ? chips.every((b) => dentro(R(b))) : null,
      pie: pie.length ? pie.every((e) => dentro(R(e))) : null,
      pieBajo: pie.length ? +Math.max(...pie.map((e) => e.getBoundingClientRect().bottom - H)).toFixed(1) : null,
    },
    desplaza: { pantalla: scr ? scr.scrollHeight - scr.clientHeight : null, doc: se.scrollHeight - se.clientHeight, ancho: se.scrollWidth - se.clientWidth },
    occ, caja, fuera, solapes,
    turno: [...document.querySelectorAll('[data-accion="apostar"], [data-accion="pasar"], [data-accion="igualar"]')].some((b) => !b.disabled),
    crono: (timer?.innerText || '').trim(),
    huella: { attr: document.documentElement.getAttribute('data-escala'), zoom: getComputedStyle(document.getElementById('root')).zoom },
  }
}
async function medirT3Estable(page) {
  await page.evaluate(() => { document.scrollingElement.scrollTop = 0; const s = document.querySelector('.game-table-screen'); if (s) s.scrollTop = 0 })
  await page.waitForTimeout(350)
  await raf2(page)
  let a = await page.evaluate(MEDIR_T3)
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(180)
    const b = await page.evaluate(MEDIR_T3)
    if (JSON.stringify(b.cartaJ) === JSON.stringify(a.cartaJ) && JSON.stringify(b.oval) === JSON.stringify(a.oval)) return b
    a = b
  }
  return { ...a, inestable: true }
}
// Una celda de `analisis.py`, escrita como la escribía el `csv` de Python.
const py = (v) => (v === null || v === undefined ? '' : v === true ? 'True' : v === false ? 'False' : String(v))
const celdaCsv = (v) => { const s = py(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export function filaT3(r) {
  const o = r.H > r.W ? 'v' : 'h'
  const traje = r.W <= 767 && o === 'v' ? 'A' : o === 'h' && r.H <= 600 ? 'B' : o === 'h' ? 'C' : 'D'
  const clase = Math.min(r.W, r.H) < 600 ? 'celular' : 'tableta'
  const fuera = r.fuera.filter((x) => !x.startsWith('btn ') && !x.startsWith('btn-'))
  return [r.tam, r.W, r.H, clase, o, traje, r.n, r.estado, r.cartaJ?.w, r.cartaJ?.h, r.cartaIA?.w, r.cartaIA?.h,
    r.f.msg, r.f.nombre, r.f.estado, r.f.mano, r.f.saldo, r.f.mesa, r.f.boton, r.f.timer, r.hBoton, r.hChip,
    r.cabe.iniciar, r.cabe.acciones, r.cabe.chips, r.cabe.pie, r.cabe.pieBajo,
    r.desplaza.pantalla, r.desplaza.doc, r.desplaza.ancho, r.occ, r.caja?.w, r.caja?.h, r.oval?.w, r.oval?.h,
    fuera.join('; '), r.solapes.join('; ')].map(celdaCsv).join(',')
}
// El repo guarda este CSV en LF (`.gitattributes`, eol=lf) y una copia vieja
// puede traer CRLF: se parte por los dos (las celdas no llevan saltos de línea).
export function leerT3(ruta = RUTA_T3) {
  const lineas = readFileSync(ruta, 'utf8').split(/\r?\n/).filter(Boolean)
  const filas = new Map()
  for (const l of lineas.slice(1)) {
    const c = l.split(',')
    if (c[3] === 'celular') filas.set(`${c[0]}|${c[6]}|${c[7]}`, l)
  }
  return filas
}
// Una tarea de la sonda de la Fase 0: un contexto, un grupo de tamaños, reposo y turno.
async function tareaT3(browser, base, n, tamanos) {
  const out = []
  const v0 = tamanos[0]
  const { ctx, page } = await contextoCap(browser, { w: v0.w, h: v0.h, dpr: 1, movil: true }, base, { semilla: SEMILLA })
  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    await recorrerRuta(page, n, 'basico', 0, 'medio')
    await page.waitForSelector('button:has-text("Iniciar mano")', { timeout: 20000 })
    await page.mouse.move(2, 2)
    for (const s of tamanos) {
      await page.setViewportSize({ width: s.w, height: s.h })
      out.push({ tam: s.id, n, estado: 'reposo', ...(await medirT3Estable(page)) })
    }
    let pend = [...tamanos]
    for (let intentos = 0; pend.length && intentos < 4; intentos++) {
      if (!(await aTurno(page))) break
      await mesaQuieta(page, 1500)
      while (pend.length) {
        const s = pend[0]
        await page.setViewportSize({ width: s.w, height: s.h })
        const m = await medirT3Estable(page)
        if (!m.turno || parseInt(m.crono, 10) < 2) break
        out.push({ tam: s.id, n, estado: 'turno', ...m })
        pend.shift()
      }
    }
    for (const s of pend) out.push({ tam: s.id, n, estado: 'turno', noMedida: true })
  } finally { await ctx.close() }
  return out
}

async function varaCel(browser, base, ref) {
  // (a) los pares
  const tareas = []
  for (const t of G1.tamanos) for (const n of G1.mesas) for (const e of G1.estados) if (pasaSolo(t, n, e)) tareas.push({ t, n, e, dpr: 1 })
  if (pasaSolo(G1.tamanos[2], 5, 'turno')) tareas.push({ t: G1.tamanos[2], n: 5, e: 'turno', dpr: 3 })
  const pares = await V.enPool(tareas, PAR, async (x) => {
    // Hasta 3 intentos (como el Grupo 1 de la lámina); se queda el MEJOR:
    // idéntico, si no equivalente, si no el último. Todos quedan anotados.
    const intentos = []
    const nota = (y) => (!y.medida ? 0 : y.distintos === 0 && y.ruido === 0 ? 3
      : (y.distintos === 0 || y.equivalente) && (y.ruido === 0 || y.ruidoEquivalente) ? 2 : 1)
    for (let i = 0; i < 3; i++) {
      let y
      try { y = await parG1(browser, base, ref, x.t, x.n, x.e, x.dpr) } catch (e) { y = { medida: false, motivo: String(e.message).split('\n')[0] } }
      intentos.push(y)
      if (nota(y) === 3) break
    }
    const r = intentos.reduce((m, y) => (nota(y) > nota(m) ? y : m))
    return { clave: `${x.t.id}|${x.n}|${x.e}${x.dpr !== 1 ? '@' + x.dpr : ''}`, ...r, intentos: intentos.map((y) => (y.medida ? `${y.distintos}/${y.ruido}` : y.motivo)) }
  })
  // (b) la matriz de la Fase 0
  const t3ref = leerT3()
  const tams = [...new Set([...t3ref.keys()].map((k) => k.split('|')[0]))].map((id) => { const [w, h] = id.split('x').map(Number); return { id, w, h } })
  const grupos = [tams.filter((t) => t.h > t.w), tams.filter((t) => t.w >= t.h)]
  const tareasT3 = []
  for (const n of [5, 4, 3, 2]) for (const g of grupos) if (g.length) tareasT3.push({ n, g })
  const medidas = (await V.enPool(tareasT3, PAR, async (x) => {
    try { return await tareaT3(browser, base, x.n, x.g) } catch (e) { return x.g.map((s) => ({ tam: s.id, n: x.n, estado: '?', error: String(e.message).split('\n')[0] })) }
  })).flat()
  const t3 = { celdas: t3ref.size, iguales: 0, distintas: [], noMedidas: [], conEscala: [] }
  for (const [k, linea] of t3ref) {
    const [tam, n, estado] = k.split('|')
    const m = medidas.find((r) => r.tam === tam && String(r.n) === n && r.estado === estado)
    if (!m || m.noMedida || m.error) { t3.noMedidas.push(k); continue }
    if (m.huella.attr || m.huella.zoom !== '1') t3.conEscala.push(k)
    const nueva = filaT3(m)
    if (nueva === linea) t3.iguales++
    else t3.distintas.push({ celda: k, antes: linea, ahora: nueva })
  }
  const paresMal = pares.filter((p) => !p.medida || !(p.distintos === 0 || p.equivalente) || !(p.ruido === 0 || p.ruidoEquivalente) || p.huella?.attr || p.huella?.f || p.huella?.escrituras !== 0 || p.huella?.zoom !== '1')
  const ok = paresMal.length === 0 && t3.iguales === t3.celdas && !t3.conEscala.length
  return {
    ok, pares: pares.length, identicos: pares.filter((p) => p.distintos === 0).length, tolerancia: TOLERANCIA_CAP, paresMal: paresMal.map((p) => `${p.clave}: ${p.medida ? `distintos ${p.distintos} (Δmáx ${p.deltaMax}, finos ${p.fraccionFina?.toFixed(5)}), ruido ${p.ruido}, huella ${JSON.stringify(p.huella)}` : p.motivo}`),
    contra: ref || 'escala=1', detallePares: pares.map((p) => ({ clave: p.clave, distintos: p.distintos, equivalente: p.equivalente, deltaMax: p.deltaMax, fraccionFina: p.fraccionFina, ruido: p.ruido, total: p.total, escrituras: p.huella?.escrituras, intentos: p.intentos, motivo: p.motivo })),
    t3: { celdas: t3.celdas, iguales: t3.iguales, distintas: t3.distintas, noMedidas: t3.noMedidas, conEscala: t3.conEscala },
  }
}

// ══ V-tv ═══════════════════════════════════════════════════════════════════
// El semáforo de las P (§1.2.2): verde hasta ±20 %, ámbar hasta ±35 %, rojo
// por encima. P-hueco: «no menos de la mitad del patrón, con un suelo absoluto
// de 0,05», leído como en la lámina: solo cuenta lo que FALTA respecto del
// patrón (un hueco mayor que el del teléfono no es defecto), y la falta se mide
// contra max(patrón, 0,05), para que un patrón diminuto (mesas 2 y 3, 0,013 y
// 0,06) no ponga rojo un solo píxel. Verde si falta como mucho la mitad.
// Mesas 4 y 5 (resolución 1 del rector, 2026-10-21): donde manda el alto, la
// mesa propia queda en la referencia exacta y el tapete libre no llega a la
// mitad del del teléfono; Victor lo vio y no le pareció apretado. Para ellas la
// vara es un suelo absoluto: P-hueco ≥ SUELO_HUECO_45 del alto de la mesa.
export const SUELO_HUECO_45 = 0.035
export function semaforo(clave, valor, patron, mesa) {
  if (valor == null || patron == null) return { color: 'gris', d: null }
  if (clave === 'hueco' && (mesa === 4 || mesa === 5)) {
    return { color: valor >= SUELO_HUECO_45 ? 'verde' : 'rojo', d: +Math.max(0, SUELO_HUECO_45 - valor).toFixed(3), valor: +valor.toFixed(4), patron: SUELO_HUECO_45 }
  }
  if (clave === 'hueco') {
    const falta = Math.max(0, patron - valor) / Math.max(patron, 0.05)
    return { color: falta <= 0.5 ? 'verde' : 'rojo', d: +falta.toFixed(3), valor: +valor.toFixed(4), patron: +patron.toFixed(4) }
  }
  const d = Math.abs(valor - patron) / patron
  return { color: d <= 0.2 ? 'verde' : d <= 0.35 ? 'ambar' : 'rojo', d: +d.toFixed(3) }
}
async function celdaMesa(browser, base, v, n, estado, opc = {}) {
  const { ctx, page, errores } = await abrirMesa(browser, base, v, n, opc)
  try {
    if (!(await aEstado(page, estado))) return { medida: false, motivo: `sin ${estado}`, errores }
    if (opc.pc) {
      await page.evaluate(() => document.fullscreenElement || document.documentElement.requestFullscreen().catch(() => {}))
      await page.waitForTimeout(600)
    }
    await page.evaluate(() => { document.scrollingElement.scrollTop = 0; const s = document.querySelector('.game-table-screen'); if (s) s.scrollTop = 0 })
    await page.evaluate(CONGELAR)
    await page.waitForTimeout(300)
    await quietas(page)
    const m = await page.evaluate(MEDIR_TAB)
    let o1 = null
    if (opc.o1) {
      // O1 de las etiquetas: las anclas con la regla de 10 px y sin ella.
      const a = await page.evaluate(ANCLAS)
      await page.addStyleTag({ content: 'html[data-escala] body .game-table-screen :is(.hand-badge, .seat-badge) { font-size: 10px; }' })
      await raf2(page)
      const b = await page.evaluate(ANCLAS)
      o1 = { iguales: JSON.stringify(a) === JSON.stringify(b), a, b }
    }
    return { medida: true, ...m, o1, errores }
  } finally { await ctx.close() }
}
async function patronS25(browser, base) {
  const out = {}
  await V.enPool(TV.mesas.flatMap((n) => TV.estados.map((e) => ({ n, e }))).filter(({ n, e }) => TV.tamanos.some((t) => pasaSolo(t, n, e))), PAR, async ({ n, e }) => {
    const r = await celdaMesa(browser, base, { w: 412, h: 915, movil: true }, n, e)
    ;(out[n] ??= {})[e] = r.medida ? r.P : null
  })
  return out
}
async function varaTv(browser, base) {
  const patron = await patronS25(browser, base)
  const tareas = []
  for (const t of TV.tamanos) for (const n of TV.mesas) for (const e of TV.estados) if (pasaSolo(t, n, e)) tareas.push({ t, n, e })
  const celdas = await V.enPool(tareas, PAR, async ({ t, n, e }) => {
    let r
    try { r = await celdaMesa(browser, base, { ...t, movil: true }, n, e) } catch (x) { r = { medida: false, motivo: String(x.message).split('\n')[0] } }
    const esperado = escalaDe({ ancho: t.w, alto: t.h })
    const c = { tam: t.id, n, estado: e, medida: r.medida, motivo: r.motivo ?? null }
    if (!r.medida) return c
    const sem = {}
    for (const k of ['ovalo', 'hueco', 'carta', 'frase']) sem[k] = semaforo(k, r.P?.[k], patron[n]?.[e]?.[k], n)
    const motivos = []
    if (r.attr !== 'tv' || Math.abs(r.f - esperado.f) > 0.0005) motivos.push(`factor ${r.attr} ${r.f} ≠ tv ${esperado.f}`)
    if (r.desplaza.pantalla > 0 || r.desplaza.doc > 0 || r.desplaza.ancho > 0 || r.fuera.length) motivos.push(`no cabe: ${r.fuera.join(' · ') || JSON.stringify(r.desplaza)}`)
    const rojas = Object.entries(sem).filter(([, s]) => s.color === 'rojo' || s.color === 'gris').map(([k, s]) => `P-${k} ${s.color} (falta ${s.d}${s.valor != null ? `: ${s.valor} frente a ${s.patron}` : ''})`)
    if (rojas.length) motivos.push(rojas.join(' · '))
    if (!r.tactil || Math.min(r.tactil.w, r.tactil.h) < PISO_TACTIL_TV) motivos.push(`táctil ${r.tactil ? `${r.tactil.k} ${r.tactil.w}×${r.tactil.h}` : 'sin tocables'} < 44`)
    if (r.errores?.length) motivos.push(`errores: ${r.errores.slice(0, 2).join(' · ')}`)
    return Object.assign(c, {
      ok: motivos.length === 0, motivos, f: r.f, esperado: esperado.f, P: r.P, semaforo: sem, carta: r.cartaJ && +r.cartaJ.h.toFixed(1),
      frase: r.frase && +r.frase.toFixed(2), tactil: r.tactil, desplaza: r.desplaza, mensaje: r.mensaje,
    })
  })
  return { ok: celdas.every((c) => c.medida && c.ok), celdas, patron }
}

// ══ V-h ════════════════════════════════════════════════════════════════════
async function varaH(browser, base) {
  const tareas = []
  for (const t of HZ.tamanos) for (const n of HZ.mesas) for (const e of HZ.estados) if (pasaSolo(t, n, e)) tareas.push({ t, n, e })
  const celdas = await V.enPool(tareas, PAR, async ({ t, n, e }) => {
    let r
    try { r = await celdaMesa(browser, base, t, n, e, { sinPC: t.movil && !t.pc, pc: !!t.pc, o1: true }) } catch (x) { r = { medida: false, motivo: String(x.message).split('\n')[0] } }
    const c = { tam: t.id, n, estado: e, medida: r.medida, motivo: r.motivo ?? null }
    if (!r.medida) return c
    const esperado = escalaDe({ ancho: t.w, alto: t.h, orientacion: 'horizontal', pantallaCompleta: !!t.pc })
    const motivos = []
    if (!!t.pc !== r.pc) motivos.push(`pantalla completa ${r.pc} (se pedía ${!!t.pc})`)
    if (r.attr !== 'h' || Math.abs(r.f - esperado.f) > 0.0005) motivos.push(`factor ${r.attr} ${r.f} ≠ h ${esperado.f}`)
    if (r.desplaza.pantalla !== 0 || r.desplaza.doc !== 0 || r.desplaza.ancho !== 0 || r.fuera.length) motivos.push(`no cabe: ${r.fuera.join(' · ') || JSON.stringify(r.desplaza)}`)
    if (r.chicaMin != null && r.chicaMin < PISO_ETIQUETA - 0.01) motivos.push(`etiqueta ${r.chicaMin.toFixed(2)} px < 10`)
    if (r.frase != null && r.frase < PISO_FRASE - 0.01) motivos.push(`frase ${r.frase.toFixed(2)} px < 12`)
    if (r.bajoBanda > 0.5) motivos.push(`${r.bajoBanda.toFixed(1)} px bajo la banda de R-7`)
    if (r.equisLogo > 0) motivos.push(`la ✕ pisa el logotipo (${r.equisLogo.toFixed(0)} px²)`)
    if (r.o1 && !r.o1.iguales) motivos.push('las etiquetas de 10 px mueven la maqueta (O1)')
    if (r.errores?.length) motivos.push(`errores: ${r.errores.slice(0, 2).join(' · ')}`)
    return Object.assign(c, {
      ok: motivos.length === 0, motivos, f: r.f, esperado: esperado.f, pc: r.pc, chicaMin: r.chicaMin && +r.chicaMin.toFixed(2), frase: r.frase && +r.frase.toFixed(2),
      bajoBanda: r.bajoBanda, logo: r.logo && [Math.round(r.logo.x), Math.round(r.logo.r)], carta: r.cartaJ && +r.cartaJ.h.toFixed(1),
      tactil: t.movil ? r.tactil : null, o1: r.o1?.iguales ?? null, desplaza: r.desplaza,
    })
  })
  return { ok: celdas.every((c) => c.medida && c.ok), celdas }
}

// ══ V-vuelo ════════════════════════════════════════════════════════════════
// Cada carta en vuelo, al terminar su `transform`, se compara con el hueco o
// el mazo más cercano; cada moneda, al terminar su `translate`, con la moneda
// de destino más cercana. Los registra un oyente en CAPTURA (antes que React,
// que retira la carta en el mismo `transitionend`).
const GRABAR_VUELOS = () => {
  window.__tabVuelos = []
  window.addEventListener('transitionend', (ev) => {
    const el = ev.target
    if (!(el instanceof HTMLElement)) return
    const caja = (e) => e.getBoundingClientRect()
    const vivos = (s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length)
    if (el.classList.contains('flying-card') && ev.propertyName === 'transform') {
      const r = caja(el)
      const err = Math.min(...vivos('.card-slot-wrapper, .opp-card-slot, .deck-pile').map((d) => { const b = caja(d); return Math.max(Math.abs(b.left - r.left), Math.abs(b.top - r.top)) }))
      window.__tabVuelos.push({ tipo: 'carta', err })
    }
    if (el.classList.contains('vc-ficha') && ev.propertyName === 'translate') {
      const m = el.querySelector('.chip-token') || el
      const r = caja(m); const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const err = Math.min(...vivos('[data-coin-target] .chip-token').map((d) => { const b = caja(d); return Math.hypot(b.left + b.width / 2 - cx, b.top + b.height / 2 - cy) }))
      window.__tabVuelos.push({ tipo: 'moneda', err })
    }
  }, true)
}
async function vuelosEn(browser, base, v, n) {
  const { ctx, page, errores } = await contextoCap(browser, { w: v.w, h: v.h, dpr: 1, movil: v.movil }, base, { semilla: SEMILLA })
  await ctx.addInitScript(GRABAR_VUELOS)
  if (v.movil) await ctx.addInitScript(SIN_PANTALLA_COMPLETA)
  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    await recorrerRuta(page, n, 'basico', 0, 'medio')
    await page.waitForSelector('button:has-text("Iniciar mano")', { timeout: 20000 })
    // Una mano entera: reparto, descartes de las IAS y el pago con sus monedas.
    const t0 = Date.now(); let pago = false
    while (Date.now() - t0 < 90000) {
      pago = await page.evaluate(() => [...document.querySelectorAll('.game-message')].some((m) => m.classList.contains('msg-win') || m.classList.contains('msg-lose')))
      if (pago) break
      const b = page.locator('.action-buttons button:has-text("Pasar"), .action-buttons button:has-text("Igualar"), button:has-text("Iniciar mano")').first()
      if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click({ timeout: 1500 }).catch(() => {}); await page.mouse.move(5, 5); continue }
      const d = page.locator('button:has-text("Sin descartar")').first()
      if (await d.count()) await d.click({ timeout: 1500 }).catch(() => {})
      await page.waitForTimeout(200)
    }
    await page.waitForTimeout(5000)
    const h = await page.evaluate(HUELLA_ESCALA)
    const vuelos = await page.evaluate(() => window.__tabVuelos)
    return { pago, f: h.f, attr: h.attr, vuelos, errores }
  } finally { await ctx.close() }
}
async function globoEn(browser, base, v, n) {
  const c = await V.abrirCeldaEnPago(browser, { id: v.id, w: v.w, h: v.h, movil: v.movil }, n, base)
  const { ctx, page } = c
  try {
    const peor = V.formasVoz2(n).find((x) => x.id === 'peor').texto
    const marca = await V.ponerTexto(page, peor)
    if (marca !== '1') return { medida: false, motivo: 'la frase no salió recortada' }
    const centro = await page.evaluate(() => { const r = document.querySelector('.voz2-texto').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })
    await V.tocar(page, v.movil, ...centro)
    await page.waitForTimeout(400)
    const m = await page.evaluate(() => {
      const capa = document.querySelector('.voz2-capa:not([hidden])')
      if (!capa) return null
      const sp = document.querySelector(`[aria-controls="${CSS.escape(capa.id)}"]`)
      const ov = sp && sp.closest('.center-zone, .felt-oval')
      const caja = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } }
      return {
        f: parseFloat(document.documentElement.style.getPropertyValue('--escala')) || 1,
        capa: caja(capa), alto: capa.offsetHeight, ovalo: ov ? caja(ov) : null,
        vp: { width: document.documentElement.clientWidth, height: innerHeight },
      }
    })
    if (!m || !m.ovalo) return { medida: false, motivo: 'la capa no se abrió' }
    // Donde la pone el producto, calculado aparte con la pieza pura y las
    // cajas pasadas a px propios: si el componente dividiera mal, no casa.
    const f = m.f
    const o = { left: m.ovalo.left / f, top: m.ovalo.top / f, width: m.ovalo.width / f, height: m.ovalo.height / f }
    const vp = { width: m.vp.width / f, height: m.vp.height / f }
    const ancho = anchoCapa(o, vp)
    const { x, y } = colocaCapa({ ovalo: o, vp, ancho, alto: m.alto })
    const err = Math.max(Math.abs(x * f - m.capa.left), Math.abs(y * f - m.capa.top), Math.abs(ancho * f - m.capa.width))
    const dentro = m.capa.left >= -0.5 && m.capa.top >= -0.5 && m.capa.left + m.capa.width <= m.vp.width + 0.5 && m.capa.top + m.capa.height <= m.vp.height + 0.5
    const dx = (m.capa.left + m.capa.width / 2) - (m.ovalo.left + m.ovalo.width / 2)
    const dy = (m.capa.top + m.capa.height / 2) - (m.ovalo.top + m.ovalo.height / 2)
    return { medida: true, f, err: +err.toFixed(2), dentro, centro: [+dx.toFixed(2), +dy.toFixed(2)] }
  } finally { await ctx.close() }
}
async function varaVuelo(browser, base) {
  const vistas = [{ id: '744x1100', w: 744, h: 1100, movil: true }, { id: '1366x623', w: 1366, h: 623, movil: false }]
  const tareas = vistas.flatMap((v) => [5, 2].map((n) => ({ v, n })))
  const vuelos = await V.enPool(tareas, PAR, async ({ v, n }) => {
    try {
      const r = await vuelosEn(browser, base, v, n)
      const cartas = r.vuelos.filter((x) => x.tipo === 'carta'), monedas = r.vuelos.filter((x) => x.tipo === 'moneda')
      const peor = (l) => (l.length ? +Math.max(...l.map((x) => x.err)).toFixed(2) : null)
      const ok = r.f !== null && r.f !== '1' && cartas.length > 0 && peor(cartas) <= 1 && (monedas.length === 0 || peor(monedas) <= 1) && !r.errores.length
      return { celda: `${v.id} m${n}`, f: r.f, cartas: cartas.length, peorCarta: peor(cartas), monedas: monedas.length, peorMoneda: peor(monedas), ok, errores: r.errores }
    } catch (e) { return { celda: `${v.id} m${n}`, ok: false, motivo: String(e.message).split('\n')[0] } }
  })
  const globos = await V.enPool(vistas.map((v) => ({ v, n: 5 })), PAR, async ({ v, n }) => {
    try {
      const r = await globoEn(browser, base, v, n)
      return { celda: `${v.id} m${n}`, ...r, ok: r.medida && r.f !== 1 && r.err <= 1 && r.dentro && Math.abs(r.centro[0]) <= 1 }
    } catch (e) { return { celda: `${v.id} m${n}`, ok: false, motivo: String(e.message).split('\n')[0] } }
  })
  return { ok: vuelos.every((x) => x.ok) && globos.every((x) => x.ok), vuelos, globos }
}

// ══ V-fuera ════════════════════════════════════════════════════════════════
async function fotoFuera(browser, base, t, pantalla) {
  const { ctx, page, errores } = await contextoCap(browser, { w: t.w, h: t.h, dpr: 1, movil: t.movil }, base, { semilla: SEMILLA })
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  try {
    await irA(page, base, pantalla)
    await page.waitForTimeout(900)
    await page.mouse.move(2, 2)
    await quietas(page)
    const huella = await page.evaluate(HUELLA_ESCALA)
    const png = await page.screenshot()
    return { huella, png, errores, page, ctx }
  } catch (e) { await ctx.close(); throw e }
}
async function entrarYSalir(browser, base, t) {
  const { ctx, page, errores } = await contextoCap(browser, { w: t.w, h: t.h, dpr: 1, movil: t.movil }, base, { semilla: SEMILLA })
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    const antes = await page.evaluate(HUELLA_ESCALA)
    await recorrerRuta(page, 5, 'basico', 0, 'medio')
    await page.waitForSelector('button:has-text("Iniciar mano")', { timeout: 20000 })
    const dentro = await page.evaluate(HUELLA_ESCALA)
    await page.click('.btn-leave'); await page.waitForTimeout(200)
    await page.click('.leave-modal button:has-text("Abandonar mesa")')
    await page.waitForSelector('[data-accion="reto"]', { timeout: 15000 })
    await page.waitForTimeout(300)
    const despues = await page.evaluate(HUELLA_ESCALA)
    const esperado = escalaDe({ ancho: t.w, alto: t.h }).atributo
    const ok = !antes.attr && antes.zoom === '1' && dentro.attr === esperado && !despues.attr && !despues.f && despues.zoom === '1' && !errores.length
    return { tam: t.id, ok, antes, dentro, despues, errores }
  } finally { await ctx.close() }
}
async function varaFuera(browser, base, ref) {
  const tareas = FUERA.tamanos.flatMap((t) => FUERA.pantallas.map((p) => ({ t, p })))
  const pantallas = await V.enPool(tareas, 4, async ({ t, p }) => {
    const c = { celda: `${p} ${t.id}` }
    let a = null, b = null
    try {
      a = await fotoFuera(browser, base, t, p)
      c.huella = a.huella
      c.limpia = !a.huella.attr && !a.huella.f && a.huella.zoom === '1'
      if (ref) {
        // Hasta tres intentos al píxel (el raster entre contextos no es
        // determinista, ver V-cel); si ninguno sale idéntico, vale EQUIVALENTE
        // con la vara de `cap`, y el resumen lo cuenta aparte.
        for (let i = 0; i < 3; i++) {
          if (i) { await a.ctx.close(); await b.ctx.close(); a = await fotoFuera(browser, base, t, p); b = null }
          b = await fotoFuera(browser, ref, t, p)
          const d = await compararPng(a.page, a.png, b.png)
          c.distintos = d.distintos; c.equivalente = equivalentes(d); c.deltaMax = d.deltaMax; c.intentos = i + 1
          if (c.distintos === 0) break
        }
      }
      c.errores = a.errores
      c.ok = c.limpia && (!ref || c.distintos === 0 || c.equivalente) && !a.errores.length
    } catch (e) { c.ok = false; c.motivo = String(e.message).split('\n')[0] } finally {
      if (a) await a.ctx.close()
      if (b) await b.ctx.close()
    }
    return c
  })
  const visitas = await V.enPool(FUERA.tamanos, 3, (t) => entrarYSalir(browser, base, t).catch((e) => ({ tam: t.id, ok: false, motivo: String(e.message).split('\n')[0] })))
  return { ok: pantallas.every((c) => c.ok) && visitas.every((v) => v.ok), referencia: ref || null, pantallas, visitas }
}

// ══ V-giro ═════════════════════════════════════════════════════════════════
async function varaGiro(browser, base) {
  const { ctx, page, errores } = await abrirMesa(browser, base, { w: 744, h: 1100, movil: true }, 5, {})
  const pasos = []
  const enReparto = async () => {
    for (let i = 0; i < 200; i++) {
      if (await page.evaluate(() => document.querySelectorAll('.flying-card').length > 0)) return true
      await page.waitForTimeout(50)
    }
    return false
  }
  const medir = async (w, h) => {
    const reparto = await enReparto()
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(1500)
    await mesaQuieta(page, 6000)
    const m = await page.evaluate(MEDIR_TAB)
    const esperado = escalaDe({ ancho: w, alto: h })
    const ok = reparto && m.attr === esperado.atributo && Math.abs(m.f - esperado.f) < 0.0005 && m.desplaza.pantalla === 0 && m.desplaza.doc === 0 && m.desplaza.ancho === 0 && !m.fuera.length
    pasos.push({ a: `${w}x${h}`, enReparto: reparto, attr: m.attr, f: m.f, desplaza: m.desplaza, fuera: m.fuera, ok })
  }
  try {
    await pulsarIniciar(page, /^Iniciar mano$/)
    await medir(1100, 744)
    // Segunda vuelta, otra vez en pleno reparto: la mano siguiente.
    if (!(await aEntre(page))) pasos.push({ a: '744x1100', ok: false, motivo: 'sin «Siguiente mano»' })
    else { await pulsarIniciar(page, /^Siguiente mano$/); await medir(744, 1100) }
    // Y el tercer estado, ya quieto, otra vez en horizontal → vertical medido arriba.
  } finally { await ctx.close() }
  return { ok: pasos.length === 2 && pasos.every((p) => p.ok) && !errores.length, pasos, errores }
}

// ══ El modo ════════════════════════════════════════════════════════════════
/** Corre las varas pedidas. Devuelve `{ verde, varas, resumen }`. */
export async function runTab(browser, { base, ref = null, varas = VARAS_TAB } = {}) {
  escalaReal(true)
  const t0 = Date.now()
  const out = {}
  try {
    if (varas.includes('cel')) out.cel = await varaCel(browser, base, ref)
    if (varas.includes('fuera')) out.fuera = await varaFuera(browser, base, ref)
    if (varas.includes('h')) out.h = await varaH(browser, base)
    if (varas.includes('tv')) out.tv = await varaTv(browser, base)
    if (varas.includes('vuelo')) out.vuelo = await varaVuelo(browser, base)
    if (varas.includes('giro')) out.giro = await varaGiro(browser, base)
  } finally { escalaReal(false) }
  const verde = Object.values(out).every((v) => v.ok)
  const nombre = { cel: 'V-cel', tv: 'V-tv', h: 'V-h', vuelo: 'V-vuelo', fuera: 'V-fuera', giro: 'V-giro' }
  const resumen = `${SOLO ? `ACOTADA a /${SOLO.source}/ (no es la vara) · ` : ''}${verde ? 'VERDE' : 'ROJO'} · ` + Object.entries(out).map(([k, v]) => `${nombre[k]} ${v.ok ? '✓' : '✗'}`).join(' · ') + ` · ${((Date.now() - t0) / 1000).toFixed(0)} s`
  console.log(`── TAB · ${resumen}`)
  if (out.cel) {
    const c = out.cel
    console.log(`   V-cel   pares ${c.pares - c.paresMal.length}/${c.pares} bien (${c.identicos} idénticos al píxel, el resto equivalentes con la vara de cap) frente a ${c.contra} · t3 ${c.t3.iguales}/${c.t3.celdas} byte a byte${c.t3.noMedidas.length ? ` · ${c.t3.noMedidas.length} sin medir` : ''}${c.t3.conEscala.length ? ` · ${c.t3.conEscala.length} con escala` : ''}`)
    for (const m of c.paresMal.slice(0, 6)) console.log(`     ✗ ${m}`)
    for (const d of c.t3.distintas.slice(0, 6)) console.log(`     ✗ ${d.celda}\n        antes ${d.antes}\n        ahora ${d.ahora}`)
  }
  for (const k of ['tv', 'h']) if (out[k]) {
    const malas = out[k].celdas.filter((c) => !c.medida || !c.ok)
    console.log(`   ${nombre[k].padEnd(7)} ${out[k].celdas.length - malas.length}/${out[k].celdas.length} celdas bien`)
    for (const c of malas.slice(0, 12)) console.log(`     ✗ ${c.tam} m${c.n} ${c.estado}: ${c.medida ? c.motivos.join(' · ') : c.motivo}`)
  }
  if (out.vuelo) {
    for (const v of out.vuelo.vuelos) console.log(`   V-vuelo ${v.ok ? '✓' : '✗'} ${v.celda} f ${v.f} · ${v.cartas} cartas, peor ${v.peorCarta} px · ${v.monedas} monedas, peor ${v.peorMoneda} px${v.motivo ? ' · ' + v.motivo : ''}`)
    for (const g of out.vuelo.globos) console.log(`   V-vuelo ${g.ok ? '✓' : '✗'} globo ${g.celda} f ${g.f} · error ${g.err} px · dentro ${g.dentro} · centro ${JSON.stringify(g.centro)}${g.motivo ? ' · ' + g.motivo : ''}`)
  }
  if (out.fuera) {
    const malas = out.fuera.pantallas.filter((c) => !c.ok)
    const identicas = out.fuera.pantallas.filter((c) => c.distintos === 0).length
    console.log(`   V-fuera ${out.fuera.pantallas.length - malas.length}/${out.fuera.pantallas.length} pantallas bien${out.fuera.referencia ? ` frente a ${out.fuera.referencia} (${identicas} idénticas al píxel, el resto equivalentes)` : ' (sin referencia: solo la huella)'} · entrar y salir ${out.fuera.visitas.filter((v) => v.ok).length}/${out.fuera.visitas.length}`)
    for (const c of malas) console.log(`     ✗ ${c.celda}: ${c.motivo || `huella ${JSON.stringify(c.huella)} · distintos ${c.distintos}`}`)
    for (const v of out.fuera.visitas.filter((x) => !x.ok)) console.log(`     ✗ ${v.tam}: ${v.motivo || JSON.stringify({ antes: v.antes, dentro: v.dentro, despues: v.despues, errores: v.errores })}`)
  }
  if (out.giro) for (const p of out.giro.pasos) console.log(`   V-giro  ${p.ok ? '✓' : '✗'} → ${p.a} ${p.attr} ×${p.f} · en reparto ${p.enReparto} · desplaza ${JSON.stringify(p.desplaza)}${p.fuera?.length ? ' · fuera ' + p.fuera.join(' · ') : ''}`)
  return { verde, varas: out, resumen, reservaPie: RESERVA_PIE_FS }
}
