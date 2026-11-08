// ── MES-PvP L-M 3 · Entre una mano y otra, como celdas ─────────────────
// Ficha AJILEI_MES-PvP_LM-3_v1.0.md §1–§4 y §6. Contra el servidor del arnés con bypass (`?pvp=`).
//   rec  · la recarga (la burbuja ofrecida; la tarjeta con la pila en 0 y con pila), mesas 2 y 5,
//          en las cinco pantallas: la burbuja no tapa cartas propias ni botones; la tarjeta, 0 px²
//          de cartas en el teléfono vertical (como la de las IAS, §5.4; en escritorio y apaisado se
//          informa) y su frase (la de Victor) cabe en la tarjeta sin cortarse; nada sale de la
//          pantalla; y la maqueta (óvalo, barra, pozo, recuadros) no se mueve al quitar la capa
//          (Δ = 0). Control rojo: la burbuja metida en el flujo de la barra mueve la maqueta, y
//          puesta sobre las cartas las tapa.
//   trans · la pastilla de la mano nueva (`entre-manos`, variante b), mesas 2 y 5: no tapa cartas
//          propias ni botones, no sale de la pantalla y no mueve la maqueta (con y sin ella); y la
//          recogida cabe en la pausa (ms desde que empieza hasta la mano nueva). Control rojo: la pastilla sobre las
//          cartas.
//   anu  · la tarjeta de quien volvió antes del anuncio (centrada con velo), mesas 2 y 5: la frase cabe sin
//          cortarse y «Quitar publicidad» tiene 40 px por eje (INV-07). Control rojo: la tarjeta a
//          120 px de ancho corta la frase, y el enlace a 30 px de alto no llega a 40.
// Además, sin veredicto, las capturas de la lámina: `capturas-dsk/lm3_<escena>_m<n>_<pantalla>.png`.
import { mkdirSync } from 'node:fs'

const PANTALLAS = [[1920, 1080], [412, 915], [915, 412], [390, 844], [360, 640]]
const VERTICALES = new Set(['412x915', '390x844', '360x640'])
const id = ([w, h]) => `${w}x${h}`
const OUT = 'capturas-dsk'
const TOL = 0.5

async function enPagina(browser, [w, h], url, alListo, { espera = '[data-clavada], .game-over-screen, .cel-screen', pausa = 1300 } = {}) {
  for (let intento = 0; intento < 2; intento++) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, ...(w < 1024 ? { hasTouch: true, isMobile: true } : {}) })
    const errores = []
    page.on('pageerror', (e) => errores.push(String(e.message).slice(0, 120)))
    try {
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForSelector(espera, { timeout: 15000 })
      await page.mouse.move(2, 2)
      await page.waitForTimeout(pausa)
      return { ...(await alListo(page)), errores }
    } catch (e) {
      if (intento === 1) return { error: String(e?.message || e).slice(0, 160), errores }
    } finally {
      await page.close()
    }
  }
  return { error: 'sin intentos' }
}

// La medida común: la capa (`sel`) contra las cartas propias y los botones, si sale de la
// pantalla, y las anclas de la maqueta con la capa y sin ella.
const MEDIR = (sel) => {
  const R = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height } }
  const corte = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    return w > 0.5 && h > 0.5 ? Math.round(w * h) : 0
  }
  const anclas = () => {
    const a = {}
    for (const s of ['.center-zone', '.player-bar', '.pot-box']) { const el = document.querySelector(s); if (el) a[s] = R(el) }
    document.querySelectorAll('.opp-panel, .ai-zone').forEach((el, k) => { a[`rival${k}`] = R(el) })
    return a
  }
  const capa = [...document.querySelectorAll(sel)].filter((e) => e.offsetWidth > 0)
  const cajas = capa.map((e) => R(e.matches('.pvp-rec-ancla') ? e.firstElementChild : e))
  const cartas = [...document.querySelectorAll('.player-zone .card-slot-wrapper')].map(R)
  const propios = new Set(capa.flatMap((e) => [...e.querySelectorAll('button')]))
  const botones = [...document.querySelectorAll('.action-area button, .player-zone button')].filter((b) => b.offsetWidth > 0 && !propios.has(b)).map(R)
  const con = anclas()
  const quitados = capa.map((e) => { const p = e.parentNode; const s = e.nextSibling; p.removeChild(e); return () => p.insertBefore(e, s) })
  const sin = anclas()
  quitados.forEach((f) => f())
  const movidas = Object.keys(con).filter((k) => !sin[k] || ['left', 'top', 'w', 'h'].some((p) => Math.abs(con[k][p] - sin[k][p]) > 0.5))
  return {
    n: cajas.length,
    cartas: cajas.flatMap((b) => cartas.map((c) => corte(b, c))).reduce((s, x) => s + x, 0),
    botones: cajas.flatMap((b) => botones.map((c) => corte(b, c))).reduce((s, x) => s + x, 0),
    fuera: cajas.filter((b) => b.left < -0.5 || b.top < -0.5 || b.right > innerWidth + 0.5 || b.bottom > innerHeight + 0.5).length,
    movidas,
    caja: cajas[0] && [cajas[0].left, cajas[0].top, cajas[0].w, cajas[0].h].map(Math.round),
  }
}

// La frase de la tarjeta (Victor, STOP-L): con la pila en 0, «para seguir en la mesa»; con pila,
// «para volver a 1.500 HC». Se mide que cabe dentro de la tarjeta, sin cortarse.
const FRASES = {
  'tarjeta-cero': 'Recargar 1.500 HC para seguir en la mesa. Te quedarán 900 HC.',
  'tarjeta-pila': /^Recargar \d[\d.]* HC para volver a 1\.500 HC\. Te quedarán \d[\d.]* HC\.$/,
}
const RECARGA = [
  ['burbuja', 'recarga-ofrecida', '', '[data-pvp-recarga="burbuja"]'],
  ['tarjeta-cero', 'recarga-ofrecida', '&abierta=1', '[data-pvp-recarga="tarjeta"] .bankrupt-modal'],
  ['tarjeta-pila', 'recarga-voluntaria', '&abierta=1', '[data-pvp-recarga="tarjeta"] .bankrupt-modal'],
]
const MEDIR_FRASE = () => {
  const sub = document.querySelector('[data-pvp-recarga="tarjeta"] [data-accion="recarga-sub"]')
  if (!sub) return null
  const modal = sub.closest('.bankrupt-modal').getBoundingClientRect()
  const rg = document.createRange(); rg.selectNodeContents(sub)
  const t = rg.getBoundingClientRect()
  return {
    texto: sub.textContent,
    lineas: new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size,
    sale: Math.round(Math.max(0, modal.left - t.left, t.right - modal.right, modal.top - t.top, t.bottom - modal.bottom) * 10) / 10,
    cortada: sub.scrollWidth > sub.clientWidth + 0.5 || sub.scrollHeight > sub.clientHeight + 0.5,
  }
}
export async function celdaRec(browser, base, vp, n, [que, escena, extra, sel]) {
  const r = await enPagina(browser, vp, `${base}/?pvp=${escena}&n=${n}&asiento=${n === 5 ? 1 : 0}${extra}`, async (p) => ({
    ...(await p.evaluate(MEDIR, sel)), frase: await p.evaluate(MEDIR_FRASE),
  }))
  const esTarjeta = que.startsWith('tarjeta')
  const juzgaCartas = !esTarjeta || VERTICALES.has(id(vp))
  const fraseOk = !esTarjeta || (!!r.frase && (typeof FRASES[que] === 'string' ? r.frase.texto === FRASES[que] : FRASES[que].test(r.frase.texto))
    && r.frase.sale <= TOL && !r.frase.cortada)
  const ok = !r.error && r.n === 1 && (!juzgaCartas || r.cartas === 0) && r.botones === 0 && r.fuera === 0 && !r.movidas.length && fraseOk && !r.errores.length
  return { celda: `lm·rec ${que} m${n} ${id(vp)}`, ok, ...r, juzgaCartas }
}
export async function controlRec(browser, base) {
  const sel = '[data-pvp-recarga="burbuja"]'
  const r = await enPagina(browser, [412, 915], `${base}/?pvp=recarga-ofrecida&n=2`, (p) => p.evaluate((s) => {
    const R = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height] }
    const ov = () => R(document.querySelector('.player-bar'))
    const antes = ov()
    const b = document.querySelector(s)
    const carta = document.querySelector('.player-zone .card-slot-wrapper').getBoundingClientRect()
    b.style.left = `${carta.left + carta.width / 2}px`
    b.style.top = `${carta.top + carta.height / 2}px`
    const bb = b.firstElementChild.getBoundingClientRect()
    const tapa = Math.max(0, Math.min(bb.right, carta.right) - Math.max(bb.left, carta.left)) * Math.max(0, Math.min(bb.bottom, carta.bottom) - Math.max(bb.top, carta.top))
    b.style.position = 'static'; b.style.transform = 'none'
    document.querySelector('.player-bar').prepend(b)
    const despues = ov()
    return { tapa: Math.round(tapa), mueve: antes.some((v, i) => Math.abs(v - despues[i]) > 0.5) }
  }, sel))
  return { celda: 'lm·rec control (sobre las cartas y en el flujo)', rojo: (r.tapa ?? 0) > 0 && !!r.mueve, ...r }
}

// La transición: la pastilla de la mano 2, y los ms de la recogida dentro de la pausa.
export async function celdaTrans(browser, base, vp, n) {
  const r = await enPagina(browser, vp, `${base}/?pvp=entre-manos&n=${n}&asiento=${n === 5 ? 1 : 0}`, async (p) => {
    const t = await p.evaluate(() => new Promise((ok) => {
      const pantalla = document.querySelector('.game-table-screen')
      const t0 = performance.now()
      let recoge = null
      const ov0 = document.querySelector('.center-zone')?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 }
      const mira = setInterval(() => {
        if (recoge === null && pantalla.getAttribute('data-trans') === 'recoge') recoge = performance.now()
        if (document.querySelector('.tm-pastilla')) {
          clearInterval(mira)
          ok({ recogeMs: recoge === null ? null : Math.round(performance.now() - recoge), desdeLlegada: Math.round(performance.now() - t0), ov0: [ov0.left, ov0.top, ov0.width, ov0.height] })
        }
      }, 10)
      setTimeout(() => { clearInterval(mira); ok({ recogeMs: null, sinPastilla: true }) }, 8000)
    }))
    await p.waitForTimeout(350)
    await p.screenshot({ path: `${OUT}/lm3_entre-manos_m${n}_${id(vp)}.png` })
    const m = await p.evaluate(MEDIR, '.tm-pastilla')
    const ov1 = await p.evaluate(() => { const b = document.querySelector('.center-zone')?.getBoundingClientRect(); return b ? [b.left, b.top, b.width, b.height] : [0, 0, 0, 0] })
    const texto = await p.evaluate(() => document.querySelector('.tm-pastilla')?.textContent ?? null)
    // Informativo: lo que el óvalo ya salta hoy del pago al barajado (no lo mueve la pastilla;
    // eso lo mide `movidas`, con la pastilla y sin ella).
    return { ...t, ...m, texto, saltoDeMesa: Math.round(Math.max(...(t.ov0 ?? [0]).map((v, i) => Math.abs(v - ov1[i]))) * 10) / 10 }
  }, { pausa: 200 })
  const ok = !r.error && !!r.texto && r.n === 1 && r.cartas === 0 && r.botones === 0 && r.fuera === 0 && !r.movidas?.length
    && r.recogeMs !== null && r.recogeMs <= 4000 && !r.errores.length
  return { celda: `lm·trans m${n} ${id(vp)}`, ok, texto: r.texto, recogeMs: r.recogeMs, cartas: r.cartas, botones: r.botones, fuera: r.fuera, movidas: r.movidas, saltoDeMesa: r.saltoDeMesa, caja: r.caja, error: r.error }
}
async function controlTrans(browser, base) {
  const r = await enPagina(browser, [412, 915], `${base}/?pvp=entre-manos&n=2`, async (p) => {
    await p.waitForSelector('.tm-pastilla', { timeout: 8000 })
    await p.evaluate(() => {
      const c = document.querySelector('.player-zone .card-slot-wrapper').getBoundingClientRect()
      const e = document.querySelector('.tm-pastilla'); e.style.left = `${c.left + c.width / 2}px`; e.style.top = `${c.top + c.height / 2}px`
    })
    return p.evaluate(MEDIR, '.tm-pastilla')
  }, { pausa: 0 })
  return { celda: 'lm·trans control (sobre las cartas)', rojo: (r.cartas ?? 0) > 0, cartas: r.cartas }
}

// La tarjeta de quien volvió antes del anuncio.
const MEDIR_ANU = () => {
  const fr = document.querySelector('[data-pvp="anuncio-frase"]')
  const card = document.querySelector('.pvp-anu-tarjeta').getBoundingClientRect()
  const rg = document.createRange(); rg.selectNodeContents(fr)
  const t = rg.getBoundingClientRect()
  const q = document.querySelector('.pvp-anu-quitar').getBoundingClientRect()
  return {
    sale: Math.round(Math.max(0, card.left - t.left, t.right - card.right, card.top - t.top, t.bottom - card.bottom) * 10) / 10,
    cortada: fr.scrollWidth > fr.clientWidth + 0.5 || fr.scrollHeight > fr.clientHeight + 0.5,
    lineas: new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size,
    quitar: [Math.round(q.width * 10) / 10, Math.round(q.height * 10) / 10],
    enPantalla: card.left >= -0.5 && card.top >= -0.5 && card.right <= innerWidth + 0.5 && card.bottom <= innerHeight + 0.5,
  }
}
async function celdaAnu(browser, base, vp, n) {
  const r = await enPagina(browser, vp, `${base}/?pvp=anuncio-vuelta&n=${n}&asiento=${n === 5 ? 1 : 0}`, async (p) => {
    await p.screenshot({ path: `${OUT}/lm3_anuncio-espera_m${n}_${id(vp)}.png` })
    return p.evaluate(MEDIR_ANU)
  }, { espera: '.pvp-anu-tarjeta' })
  const ok = !r.error && r.sale <= TOL && !r.cortada && r.quitar[0] >= 40 && r.quitar[1] >= 40 && r.enPantalla && !r.errores.length
  return { celda: `lm·anu m${n} ${id(vp)}`, ok, ...r }
}
async function controlAnu(browser, base) {
  const r = await enPagina(browser, [360, 640], `${base}/?pvp=anuncio-vuelta&n=3`, async (p) => {
    await p.evaluate(() => {
      const c = document.querySelector('.pvp-anu-tarjeta'); c.style.width = '120px'; c.style.overflow = 'hidden'
      document.querySelector('[data-pvp="anuncio-frase"]').style.whiteSpace = 'nowrap'
      document.querySelector('[data-pvp="anuncio-frase"]').style.overflow = 'hidden'
      const q = document.querySelector('.pvp-anu-quitar'); q.style.minHeight = '0'; q.style.height = '30px'
    })
    return p.evaluate(MEDIR_ANU)
  }, { espera: '.pvp-anu-tarjeta' })
  return { celda: 'lm·anu control (tarjeta a 120 px y enlace a 30)', rojo: !!r.cortada && (r.quitar?.[1] ?? 99) < 40, ...r }
}

// Las capturas de la lámina que no salen de las celdas (sin veredicto).
const CAPTURAS = [
  ['recarga-ofrecida', 'recarga-ofrecida', [2, 5], ''],
  ['recarga-tarjeta-cero', 'recarga-ofrecida', [2, 5], '&abierta=1'],
  ['recarga-voluntaria', 'recarga-voluntaria', [2, 5], '', 'menu'],
  ['recarga-tarjeta-pila', 'recarga-voluntaria', [2, 5], '&abierta=1'],
  ['recarga-pedida', 'recarga-pedida', [2, 5], ''],
  ['recarga-pedida-menu', 'recarga-pedida', [2, 5], '', 'menu'],
  ['recarga-sinsaldo', 'recarga-sinsaldo', [2, 5], ''],
  ['recarga-fuera', 'recarga-fuera', [5], ''],
  ['recarga-ajena', 'recarga-ajena', [5], ''],
  ['recarga-ajena-fuera', 'recarga-ajena-fuera', [5], ''],
  ['recarga-rival', 'recarga-rival', [2], ''],
  ['anuncio-yo', 'anuncio-yo', [2, 5], ''],
  ['anuncio-premium', 'anuncio-premium', [2, 5], ''],
  ['final-celebracion', 'final-todas', [2, 5], ''],
  ['final-neutro', 'final-cero', [2, 5], ''],
  ['final-sobrio', 'final-negativo', [2, 5], ''],
  ['final-sinfichas', 'final-pierde', [2], ''],
]
export async function capturas(browser, base) {
  const tareas = []
  for (const [nombre, escena, mesas, extra, abrir] of CAPTURAS) {
    for (const n of mesas) {
      for (const vp of PANTALLAS) {
        tareas.push(() => enPagina(browser, vp, `${base}/?pvp=${escena}&n=${n}&asiento=${n === 5 ? 1 : 0}${extra}`, async (p) => {
          if (abrir) {
            await p.click('.utilities-trigger')
            await p.waitForTimeout(400)
          }
          await p.screenshot({ path: `${OUT}/lm3_${nombre}_m${n}_${id(vp)}.png` })
          return {}
        }))
      }
    }
  }
  const res = await enPiscina(tareas)
  return res.filter((r) => r.error).length
}

async function enPiscina(tareas, n = 4) {
  const res = []
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < tareas.length) { const k = i++; res[k] = await tareas[k]() } }))
  return res
}

export async function runEntreManosLM(browser, base, { conCapturas = true } = {}) {
  mkdirSync(OUT, { recursive: true })
  const rec = []; const trans = []; const anu = []
  for (const vp of PANTALLAS) {
    for (const n of [2, 5]) {
      for (const c of RECARGA) rec.push(() => celdaRec(browser, base, vp, n, c))
      trans.push(() => celdaTrans(browser, base, vp, n))
      anu.push(() => celdaAnu(browser, base, vp, n))
    }
  }
  const celdasRec = await enPiscina(rec)
  const ctlRec = await controlRec(browser, base)
  celdasRec.forEach((c) => { c.ok = c.ok && ctlRec.rojo })
  // La transición mide tiempos: de dos en dos, para no apretar el reloj.
  const celdasTrans = await enPiscina(trans, 2)
  const ctlTrans = await controlTrans(browser, base)
  celdasTrans.forEach((c) => { c.ok = c.ok && ctlTrans.rojo })
  const celdasAnu = await enPiscina(anu)
  const ctlAnu = await controlAnu(browser, base)
  celdasAnu.forEach((c) => { c.ok = c.ok && ctlAnu.rojo })
  const fallosCaptura = conCapturas ? await capturas(browser, base) : 0
  const celdas = [...celdasRec, ...celdasTrans, ...celdasAnu]
  return { celdas, controles: [ctlRec, ctlTrans, ctlAnu], fallosCaptura, verde: celdas.every((c) => c.ok) }
}
