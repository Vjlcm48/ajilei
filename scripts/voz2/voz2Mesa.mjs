// ── voz2Mesa.mjs · VOZ-2 · la frase del óvalo, medida en la mesa real ───────
// Rector: AJILEI_VOZ-2_Fase1_v1.0.md (§2 1a-ii, D15). Fase 0:
// docs/reportes/AJILEI_VOZ-2_Fase0_Informe_v1.0.md.
//
// Lo comparten el modo `voz2` de diagPUE.mjs (las puertas) y
// laminas/voz2/capturar.mjs (la lámina): los dos llegan al MISMO momento —el
// pago de una mano jugada, con la revelación asentada— y miden con la MISMA
// vara. Este módulo sabe llegar y medir; los veredictos son del modo.
//
// ── EL TERRENO ───────────────────────────────────────────────────────────────
// `vite preview` (4173) con la sesión simulada de CAP-1 (`contextoCap`): bundle
// de producción, red a Supabase interceptada entera, azar sembrado (semilla 5),
// así que cada celda reparte siempre la misma mano y la frase real del pago es
// siempre la misma. Ruta de verdad (`recorrerRuta`): reto `basico`, apuesta 0,
// entrada `medio`.
//
// ── LA VARA: LO QUE SE VE, NUNCA `textContent` ───────────────────────────────
// Con el recorte, `textContent` devuelve la frase ENTERA aunque se lean diez
// caracteres: es la familia del falso verde de la insignia oculta (ARN-1 ①).
// Aquí un glifo «se ve» si su caja (`Range` de un carácter) cae dentro del
// rectángulo de recorte: el del propio `.voz2-texto` (que es `overflow: hidden`)
// cortado por cada ancestro que recorte. Las formas de prueba se inyectan en el
// `.voz2-texto` REAL de la mesa —la misma caja, los mismos estilos— y las
// medidas de antes y después se toman en UN `evaluate` síncrono (LUZ-1, O2).
import { register } from 'node:module'
import { contextoCap, mesaQuieta } from '../cap/capMesa.mjs'
import { recorrerRuta } from '../rutaMesa.mjs'

// `gameEngine.js` importa sin extensión y es protegido: el arnés se adapta a él
// con el gancho de siempre (ver _resolveExt.mjs).
register('../_resolveExt.mjs', import.meta.url)
const { composeResultado } = await import('../../src/hooks/resultadoCore.js')
const { componeCapas } = await import('../../src/hooks/cronicaCore.js')
const { PHASES } = await import('../../src/engine/gameEngine.js')

// Las cinco vistas de la ficha (§1). El S25 es el de diagDSK (412×915 vertical).
export const VISTAS_VOZ2 = [
  { id: '1920x1080', w: 1920, h: 1080, movil: false },
  { id: 'S25 412x915', w: 412, h: 915, movil: true },
  { id: '390x844', w: 390, h: 844, movil: true },
  { id: '360x640', w: 360, h: 640, movil: true },
  { id: '844x390', w: 844, h: 390, movil: true },
]
export const MESAS_VOZ2 = [5, 4, 3, 2]
export const etiquetaCelda = (vista, n) => `${vista.id} m${n}`
export const archivoCelda = (vista, n) => `${vista.id.replace(/\W+/g, '_')}_m${n}`

// ── Tabla C1 del informe de la Fase 0 · LA REFERENCIA DE D1 ─────────────────
// Rectángulo del óvalo (x, y, ancho, alto) en el pago de la mano de la semilla
// 5, medido el 2026-10-01 con Edge 154.0.4258.37 ANTES de VOZ-2. La puerta
// `voz2.c1` exige que el óvalo de hoy sea ESTE: la tanda no puede haberlo movido
// ni con la frase real.
export const C1_OVALO = {
  '1920x1080 m5': [728.22, 391, 463.56, 234], '1920x1080 m4': [728.22, 391, 463.56, 234],
  '1920x1080 m3': [630.05, 391, 659.91, 234], '1920x1080 m2': [556, 455, 808, 170],
  'S25 412x915 m5': [21, 409.47, 370, 119], 'S25 412x915 m4': [21, 410.08, 370, 119],
  'S25 412x915 m3': [21, 265.5, 370, 332.5], 'S25 412x915 m2': [21, 256, 370, 341.5],
  '390x844 m5': [21, 365.02, 348, 119], '390x844 m4': [21, 364.52, 348, 119],
  '390x844 m3': [21, 265.5, 348, 261.5], '390x844 m2': [21, 256, 348, 270.5],
  '360x640 m5': [21, 274.81, 318, 96], '360x640 m4': [21, 274.81, 318, 96],
  '360x640 m3': [21, 237.5, 318, 134.5], '360x640 m2': [21, 231, 318, 140.5],
  '844x390 m5': [186, 166.11, 486, 37.8], '844x390 m4': [186, 166.11, 486, 37.8],
  '844x390 m3': [186, 166.11, 486, 37.8], '844x390 m2': [678, 134.91, 157, 69],
}
// Celdas centinela de C-2 (Fase 0 §C2): la palabra «Heptacoins.» no cabe en el
// `<p>` de 73 px y, sin contención, lo hacía saltar de fila.
export const CENTINELAS_C2 = ['360x640 m5', '360x640 m4']
export const FORMAS_C2 = ['IA+tellevas', 'peor']

// ── Las 9 formas de la Fase 0, compuestas por los compositores REALES ───────
const NAT = [
  { palo: 'Espadas', points: 11, value: 1 }, { palo: 'Espadas', points: 10, value: 3 },
  { palo: 'Espadas', points: 10, value: 10 }, { palo: 'Espadas', points: 10, value: 11 },
  { palo: 'Espadas', points: 10, value: 12 }]
const CORR = [{ palo: 'Copas', points: 11, value: 1 }, { palo: 'Bastos', points: 10, value: 12 }]
const sc = (palo, points) => ({ palo, points, suitScores: { [palo]: points } })
const nombre = (n, i) => (i === 0 ? 'Tú' : (n === 2 ? 'IA' : `IA ${i}`))
const compone = (n, winner, asientos, { manoIndex = 0, phase = PHASES.PAYOUT } = {}) => composeResultado({
  phase, winner, numPlayers: n, manoIndex, ruleN: n,
  players: asientos.map((a, i) => ({ id: i, name: nombre(n, i), isHuman: i === 0,
    cards: a.cards ?? CORR, score: a.score === undefined ? sc('Bastos', 27) : a.score, eliminated: !!a.eliminated })),
}).texto

// VOZ-3 · `componeCapas` recibe la LECTURA de la mano (`manoCore.lecturaDeMano`)
// y no una lista de capas. Aquí se le da la lectura mínima que la frase usa
// —principal, lo que se llevan los demás y lo que vuelve—: el compositor es el
// real, y la forma de cada caso es la de §C del informe de VOZ-3.
const lectura = (n, principal, otras, devoluciones) => ({ principal, numPlayers: n, otras, devoluciones })

/**
 * Las formas de una mesa, en el orden del informe de la Fase 0 de VOZ-2 §B1,
 * y al final las dos de VOZ-3 (C1 y C3). `fin-gana` no llega nunca al óvalo
 * (D16): va como referencia de longitud.
 *
 * VOZ-3 (Fase 1, 1c.1) · `peor` y `corriente+1capa` cambian de texto a
 * propósito: «N vuelven sin igualar» desaparece y la devolución se dice por
 * asiento (D5). `IA+tellevas` sale ahora del compositor y queda al byte (la
 * cola de APU-1 se conserva, D8). Las longitudes nuevas van en el informe de
 * la Fase 1 de VOZ-3; las de las demás formas no cambian.
 */
export function formasVoz2(n) {
  const W = n - 1
  const iguales = Array.from({ length: n }, () => ({ score: sc('Espadas', 31) }))
  const jug = Array.from({ length: n }, (_, i) => ({ name: nombre(n, i) }))
  const corrIA = compone(n, W, iguales.map((a, i) => (i === W ? { score: sc('Espadas', 41) } : a)))
  const multi = compone(n, W, Array.from({ length: n }, () => ({ cards: NAT, score: sc('Espadas', 51) })), { manoIndex: (W + 1) % n })
  // Peor caso factible: el titular más largo, N−2 capas ajenas y una
  // devolución a cada uno de los demás (VOZ-3 · la capa sin elegibles las da
  // todas a la vez), con montos de 6 cifras (pro 1000 × techo 50).
  const demas = Array.from({ length: n }, (_, s) => s).filter((s) => s !== W)
  const peor = lectura(n, W, demas.slice(0, n - 2).map((asiento) => ({ asiento, monto: 125000 })),
    demas.map((asiento) => ({ asiento, monto: 100000 })))
  // La IA principal y una devolución: a ti en la mesa de 2 (C3), a IA 1 en las
  // demás.
  const unaCapa = componeCapas(lectura(n, W, [], [{ asiento: n === 2 ? 0 : 1, monto: 200 }]), jug)
  // VOZ-3 · C1 y C3 tal como los compone la mesa: la mano tuya con una
  // devolución a la IA 1, y su espejo.
  const tuya41 = compone(n, 0, iguales.map((a, i) => (i === 0 ? { score: sc('Espadas', 41) } : a)))
  const ia41 = compone(n, 1, iguales.map((a, i) => (i === 1 ? { score: sc('Espadas', 41) } : a)))
  return [
    { id: 'corta', texto: tuya41 },
    { id: 'corriente-IA', texto: corrIA },
    { id: 'retiros-humano', texto: compone(n, 0, Array.from({ length: n }, () => ({ score: null }))) },
    { id: 'fin-gana', texto: compone(n, 0, iguales, { phase: PHASES.GAME_OVER }) },
    { id: 'empate-cerca-IA', texto: compone(n, W, iguales, { manoIndex: (W + 1) % n }) },
    { id: 'multi-ajilei-IA', texto: multi },
    { id: 'corriente+1capa', texto: `${corrIA} ${unaCapa}` },
    { id: 'peor', texto: `${multi} ${componeCapas(peor, jug)}` },
    { id: 'IA+tellevas', texto: `${corrIA} ${componeCapas(lectura(n, W, [{ asiento: 0, monto: 1500 }], []), jug)}` },
    { id: 'C1', texto: `${tuya41} ${componeCapas(lectura(n, 0, [], [{ asiento: 1, monto: 350 }]), jug)}` },
    { id: 'C3', texto: `${ia41} ${componeCapas(lectura(n, 1, [], [{ asiento: 0, monto: 350 }]), jug)}` },
  ]
}

// ── La hoja de control (1a-ii · «sin ese rojo, el verde no vale») ───────────
// Se inyecta en la página, FUERA del repo. 0,3,0 contra el 0,1,0 de voz2.css:
// gana por especificidad, como haría cualquier regla de verdad.
//   contain → la misma hoja sin `contain: inline-size` (vuelve C-2);
//   nowrap  → además, el recorte ingenuo a una línea (el de los 906 px).
export const HOJAS_CONTROL = {
  contain: '.game-table-screen .game-message .voz2-texto { contain: none; }',
  nowrap: '.game-table-screen .game-message .voz2-texto { contain: none; display: block; white-space: nowrap; }',
  // 1b · una capa que lo tapa todo: 200vw × 200vh como mínimo (`min-*` le gana
  // al ancho en línea que pone `Voz2Capa`), y `colocaCapa`, con ese alto, la
  // sube a 6 px del borde: cubre la mesa entera por debajo y a la derecha.
  // `voz2.capa` tiene que VER que «Siguiente mano» deja de ser tocable y que la
  // frase se sale del viewport. (Un primer intento con `scale(4)` no llegaba a
  // «Siguiente mano» en 1920 m5/m4/m2, y la puerta lo dijo: allí no lo tapaba.)
  capa: '.game-table-screen .voz2-capa { min-width: 200vw; min-height: 200vh; }',
}

// ── Llegar al pago ──────────────────────────────────────────────────────────
// Mismo conductor que las sondas de la Fase 0: Pasar/Igualar/Iniciar y «Sin
// descartar» hasta que el óvalo lleve tono de resultado; después la revelación
// (+3,72 s, REC-1) y la mesa quieta (`getAnimations` y vuelos a cero).
// VOZ-3 · el pago se reconoce por `data-tono` (gana, pierde o neutro), nunca
// por la clase: el tono `neutro` (D4) no lleva `msg-win` ni `msg-lose`.
// VOZ-3 · el tono del resultado de una MANO, si el óvalo lo lleva. Lo comparte
// todo el arnés: es la única señal del pago que no depende del color.
export const TONOS_DE_PAGO = ['gana', 'pierde', 'neutro']
export const TONO_DE_PAGO = () => [...document.querySelectorAll('.game-message')]
  .map((m) => m.dataset.tono).find((t) => t === 'gana' || t === 'pierde' || t === 'neutro') ?? null

export async function abrirCeldaEnPago(browser, vista, n, base, { dpr = 1, control = null } = {}) {
  const { ctx, page, red, errores } = await contextoCap(browser, { w: vista.w, h: vista.h, dpr, movil: vista.movil }, base)
  const r = { celda: etiquetaCelda(vista, n), vista: vista.id, mesa: n }
  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    if (control) await page.addStyleTag({ content: HOJAS_CONTROL[control] })
    await recorrerRuta(page, n, 'basico', 0, 'medio')
    await page.mouse.move(5, 5)
    let enPago = false
    for (let i = 0; i < 480 && !enPago; i++) {
      await page.waitForTimeout(200)
      enPago = await page.evaluate(TONO_DE_PAGO)
      if (enPago) break
      const b = page.locator('.action-buttons button:has-text("Pasar"), .action-buttons button:has-text("Igualar"), button:has-text("Iniciar mano")').first()
      if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click({ timeout: 1500 }).catch(() => {}); await page.mouse.move(5, 5); continue }
      const d = page.locator('button:has-text("Sin descartar")').first()
      if (await d.count()) await d.click({ timeout: 1500 }).catch(() => {})
    }
    if (!enPago) throw new Error('la mano no llegó al pago')
    await page.waitForTimeout(4500)
    r.quieta = await mesaQuieta(page, 8000)
    await page.mouse.move(5, 5)
    return { ...r, ctx, page, red, errores }
  } catch (e) {
    await ctx.close()
    throw Object.assign(e, { celda: r.celda })
  }
}

// ── La medida (corre DENTRO de la página, síncrona) ─────────────────────────
// `formas`: [{ id, texto }]. `extra`: { estilo } — CSS que se aplica SÓLO
// mientras se mide cada forma (la lámina lo usa para las variantes de líneas).
// Devuelve las anclas de partida, y por forma: anclas, glifos visibles/total,
// cajas del `<p>` y del `.voz2-texto`. Restaura el texto real al terminar.
export const MEDIR_VOZ2 = ({ formas, estilo = null }) => {
  const r2 = (x) => Math.round(x * 100) / 100
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: r2(b.x), y: r2(b.y), w: r2(b.width), h: r2(b.height) } }
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
  const p = [...document.querySelectorAll('.game-message')].find(vis)
  const sp = p && p.querySelector(':scope > .voz2-texto')
  if (!p || !sp) return { error: `sin ${p ? '.voz2-texto' : '.game-message'} visible en el pago` }
  const ovalo = p.closest('.felt-oval') || p.closest('.center-zone')
  const anclas = () => ({
    ovalo: R(ovalo), pozo: R(document.querySelector('.pot-box')),
    igualar: R(document.querySelector('.call-box')), comodin: vis(document.querySelector('.comodin-note')) ? R(document.querySelector('.comodin-note')) : null,
    msg: R(p), texto: R(sp),
  })
  // Recorte de los ancestros (los que no son `overflow: visible`).
  const clipAnc = () => {
    let c = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 }
    for (let n = sp.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const b = n.getBoundingClientRect()
        c = { l: Math.max(c.l, b.left), t: Math.max(c.t, b.top), r: Math.min(c.r, b.right), b: Math.min(c.b, b.bottom) }
      }
    }
    return c
  }
  const glifos = () => {
    const tn = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT).nextNode()
    if (!tn) return { visibles: 0, total: 0 }
    const b = sp.getBoundingClientRect(), a = clipAnc()
    // El propio `.voz2-texto` recorta (overflow: hidden) — salvo en un control
    // que lo hubiera desactivado, y entonces sólo cuentan los ancestros.
    const propio = getComputedStyle(sp).overflowY !== 'visible'
    const c = propio ? { l: Math.max(a.l, b.left), t: Math.max(a.t, b.top), r: Math.min(a.r, b.right), b: Math.min(a.b, b.bottom) } : a
    const rg = document.createRange()
    let v = 0
    for (let i = 0; i < tn.length; i++) {
      rg.setStart(tn, i); rg.setEnd(tn, i + 1)
      const q = rg.getBoundingClientRect()
      if (q.width === 0 || (q.left >= c.l - 0.5 && q.right <= c.r + 0.5 && q.top >= c.t - 0.5 && q.bottom <= c.b + 0.5)) v++
    }
    return { visibles: v, total: tn.length }
  }
  const lineas = () => {
    const rg = document.createRange(); rg.selectNodeContents(sp)
    return new Set([...rg.getClientRects()].filter((q) => q.width > 0.5).map((q) => Math.round(q.top))).size
  }
  // Lo que se LEE, que no es lo mismo que lo que tiene caja dentro del
  // recorte: Chromium deja la caja de los glifos que el «…» tapa en la última
  // línea (medido: «¡Ganas c…» daba 12 «visibles» para 8 leídos). Se estima
  // como lo hace el propio recorte: el prefijo más largo que, seguido de «…»,
  // cabe en las líneas permitidas, maquetado en un clon con la misma letra y el
  // mismo ancho y SIN recorte. Para el oráculo de la puerta no hace falta (una
  // línea entera queda fuera de la caja y basta); para la cifra que se enseña, sí.
  const leidos = (total) => {
    const cs = getComputedStyle(sp)
    const n = parseInt(cs.webkitLineClamp, 10)
    if (!Number.isFinite(n)) return null
    // VOZ-3 · D16 · una caja de 0 px no deja leer nada. El clon con ese ancho
    // partía la frase en una letra por línea y la búsqueda devolvía 4–14
    // «leídos» que no existen (tableta vertical m4/m5, informe de VOZ-3 §E.3).
    if (sp.clientWidth === 0) return 0
    const lh = parseFloat(cs.lineHeight)
    const c = document.createElement('div')
    Object.assign(c.style, { position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden', width: sp.clientWidth + 'px',
      font: cs.font, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, whiteSpace: 'normal', overflowWrap: cs.overflowWrap, wordBreak: cs.wordBreak })
    document.body.appendChild(c)
    const t = sp.textContent
    const cabe = (k) => { c.textContent = k >= total ? t : t.slice(0, k).trimEnd() + '…'; return c.getBoundingClientRect().height <= n * lh + 0.5 }
    let lo = 0, hi = total
    if (cabe(total)) { c.remove(); return total }
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cabe(m)) lo = m; else hi = m - 1 }
    c.remove()
    return t.slice(0, lo).trimEnd().length
  }
  let tag = null
  if (estilo) { tag = document.createElement('style'); tag.textContent = estilo; document.head.appendChild(tag) }
  const original = sp.textContent
  void p.offsetHeight
  const base = anclas()
  const cs = getComputedStyle(sp), csp = getComputedStyle(p)
  const out = {
    original, base, lineasReal: lineas(), glifosReal: glifos(),
    estilo: { fontSize: csp.fontSize, lineHeight: csp.lineHeight, pAlto: csp.height, clampSpan: cs.webkitLineClamp, contain: cs.contain, interlineaSpan: cs.lineHeight, justifySelf: csp.justifySelf },
    scroll: (() => { const s = document.querySelector('.game-table-screen'); return s.scrollHeight - s.clientHeight })(),
    formas: [],
  }
  for (const f of formas) {
    sp.textContent = f.texto
    void p.offsetHeight
    const g = glifos()
    out.formas.push({ id: f.id, car: f.texto.length, anclas: anclas(), ...g, leidos: g.visibles < g.total ? leidos(g.total) : g.total, lineasLayout: lineas(),
      scroll: (() => { const s = document.querySelector('.game-table-screen'); return s.scrollHeight - s.clientHeight })() })
  }
  sp.textContent = original
  void p.offsetHeight
  if (tag) tag.remove()
  out.restaurado = JSON.stringify(anclas()) === JSON.stringify(base)
  return out
}

/**
 * La marca del producto (`data-voz2-recortada`) para cada forma. La pone React
 * desde los observadores de `useVoz2Recorte`, así que llega un render DESPUÉS
 * de cambiar el texto: se inyecta, se espera a que la marca se asiente (dos
 * fotogramas seguidos iguales) y se lee. Va aparte de la medida síncrona
 * porque necesita ceder el hilo.
 */
export async function leerMarcas(page, formas, estilo = null) {
  return page.evaluate(async ({ formas, estilo }) => {
    const raf = () => new Promise((res) => requestAnimationFrame(() => res()))
    const vis = (e) => !!e && e.getClientRects().length > 0
    const p = [...document.querySelectorAll('.game-message')].find(vis)
    const sp = p && p.querySelector(':scope > .voz2-texto')
    if (!sp) return null
    let tag = null
    if (estilo) { tag = document.createElement('style'); tag.textContent = estilo; document.head.appendChild(tag) }
    const leer = () => sp.getAttribute('data-voz2-recortada')
    const asentar = async () => { let a = leer(); for (let i = 0; i < 12; i++) { await raf(); const b = leer(); if (b === a && i >= 2) return b; a = b } return a }
    const original = sp.textContent
    const out = {}
    for (const f of formas) { sp.textContent = f.texto; out[f.id] = await asentar() }
    sp.textContent = original
    out.__real = await asentar()
    if (tag) tag.remove()
    return out
  }, { formas, estilo })
}

// Δ máximo entre dos cajas (null si falta una de las dos).
export const deltaCaja = (a, b) => (a && b ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h)) : (a || b ? Infinity : 0))

// Pool sencillo: `tareas` en paralelo de a `n`.
export async function enPool(tareas, n, fn) {
  const out = []; let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < tareas.length) { const t = tareas[i++]; out.push(await fn(t)) } }))
  return out
}

// ══ 1b · LA CAPA, EL TOQUE Y LA ACCESIBILIDAD ══════════════════════════════
// Rector: AJILEI_VOZ-2_Fase1_v1.0.md §3 1b-iii, más las dos exigencias que
// Victor añadió al elegir en la lámina: (a) con la capa abierta, «Siguiente
// mano» y la burbuja de recarga siguen VISIBLES y TOCABLES (`elementFromPoint`)
// en las 20 celdas —si alguna lo impide, STOP con la medida, sin mover la capa—;
// (b) qué tapa la capa abierta, por celda y con el peor caso (informativo).

// El toque de verdad: dedo en las vistas móviles (sus contextos llevan
// `hasTouch`), ratón en escritorio. Nada de `el.click()`: eso se saltaría el
// `elementFromPoint` que decide quién recibe el toque.
export async function tocar(page, movil, x, y) {
  if (movil) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  if (!movil) await page.mouse.move(2, 2)
}

// Pone un texto en el `.voz2-texto` real y espera a que la marca del producto
// se asiente. Devuelve la marca ('1' o null).
export async function ponerTexto(page, texto) {
  return page.evaluate(async (texto) => {
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()))
    const sp = document.querySelector('.voz2-texto')
    if (!sp) return 'sin-span'
    sp.textContent = texto
    const leer = () => sp.getAttribute('data-voz2-recortada')
    let a = leer()
    for (let i = 0; i < 12; i++) { await raf(); const b = leer(); if (b === a && i >= 2) break; a = b }
    for (let i = 0; i < 3; i++) await raf()
    return leer()
  }, texto)
}

// Cuenta las alternancias: cada cambio de `aria-expanded` del texto es una.
export const ARMAR_CONTADOR = () => {
  const sp = document.querySelector('.voz2-texto')
  window.__voz2Alt = 0
  window.__voz2Obs?.disconnect()
  if (!sp) return false
  window.__voz2Obs = new MutationObserver((ms) => { for (const m of ms) if (m.attributeName === 'aria-expanded') window.__voz2Alt++ })
  window.__voz2Obs.observe(sp, { attributes: true, attributeFilter: ['aria-expanded'] })
  return true
}

// Las anclas de D1 (y la caja del `<p>` y del texto), síncronas.
export const ANCLAS_VOZ2 = () => {
  const r2 = (x) => Math.round(x * 100) / 100
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: r2(b.x), y: r2(b.y), w: r2(b.width), h: r2(b.height) } }
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
  const sp = document.querySelector('.voz2-texto')
  const p = sp?.parentElement || [...document.querySelectorAll('.game-message')].find(vis)
  const ov = p?.closest('.center-zone, .felt-oval')
  const com = document.querySelector('.comodin-note')
  return {
    ovalo: R(ov), pozo: R(document.querySelector('.pot-box')), igualar: R(document.querySelector('.call-box')),
    comodin: vis(com) ? R(com) : null, msg: R(p), texto: R(sp),
    cartasJugador: R(document.querySelector('.player-zone .cards-row')), barra: R(document.querySelector('.player-bar')),
  }
}

// La foto del estado de la frase y de la capa. Lo «visible y tocable» se mide
// con `elementFromPoint` en una rejilla de 3×3 metida 3 px (el centro incluido):
// el botón tiene que recibir los nueve toques, y su caja no puede cortarse con
// la de la capa. Lo «tapado» (b) se mide por intersección de cajas, en % de la
// caja tapada (el elemento más tapado de cada grupo, y cuántos lo están).
export const ESTADO_VOZ2 = () => {
  const r2 = (x) => Math.round(x * 100) / 100
  const caja = (b) => (b ? { x: r2(b.left), y: r2(b.top), w: r2(b.width), h: r2(b.height) } : null)
  const vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none'
  const inter = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    return w > 0.5 && h > 0.5 ? w * h : 0
  }
  const nombre = (h) => (h.closest('.voz2-capa') ? 'capa' : (h.className?.baseVal ?? h.className) || h.tagName)
  const sp = document.querySelector('.voz2-texto')
  const capa = document.querySelector('.voz2-capa')
  const capaVis = !!capa && !capa.hidden && vis(capa)
  const cr = capaVis ? capa.getBoundingClientRect() : null
  const tocable = (el) => {
    if (!el || !vis(el)) return { visible: false }
    const b = el.getBoundingClientRect()
    const pts = []
    for (const fy of [0, 0.5, 1]) for (const fx of [0, 0.5, 1]) pts.push([b.left + 3 + fx * (b.width - 6), b.top + 3 + fy * (b.height - 6)])
    const dentroVp = b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight
    const hs = pts.map(([x, y]) => document.elementFromPoint(x, y))
    const mio = (h) => !!h && (h === el || el.contains(h))
    return { visible: true, caja: caja(b), dentroVp, centro: mio(hs[4]), toques: hs.filter(mio).length, de: hs.length,
      solapeCapa: cr ? r2(inter(cr, b)) : 0, robados: [...new Set(hs.filter((h) => h && !mio(h)).map(nombre))] }
  }
  const sig = [...document.querySelectorAll('.btn')].find((x) => x.textContent.trim() === 'Siguiente mano')
  const bur = document.querySelector('[data-accion="recarga-burbuja"]')
  const tapa = {}
  if (cr) {
    const grupos = {
      pozo: [...document.querySelectorAll('.pot-box')],
      paneles: [...document.querySelectorAll('.opp-panel, .ai-zone')],
      'cartas reveladas': [...document.querySelectorAll('.opp-panel .playing-card, .ai-zone .playing-card')].filter((c) => c.querySelector('img[alt]:not([alt=""])')),
      'cartas del jugador': [...document.querySelectorAll('.player-zone .playing-card')],
      'nombres de rivales': [...document.querySelectorAll('.opp-name, .ai-name')],
      'comodín': [...document.querySelectorAll('.comodin-note')],
    }
    for (const [g, els] of Object.entries(grupos)) {
      let peor = null, n = 0
      for (const e of els.filter(vis)) {
        const b = e.getBoundingClientRect(); const a = inter(cr, b)
        if (a <= 0) continue
        n++
        const pc = r2((100 * a) / (b.width * b.height))
        if (!peor || pc > peor.pc) peor = { pc, area: r2(a) }
      }
      if (peor) tapa[g] = { ...peor, n }
    }
  }
  // Los glifos de la capa: dentro del viewport y sin tapar (su punto central
  // cae en la propia capa).
  let glifos = null
  if (capaVis) {
    const tn = document.createTreeWalker(capa, NodeFilter.SHOW_TEXT).nextNode()
    const rg = document.createRange(); let ok = 0, total = 0, fuera = 0, tapados = 0
    for (let i = 0; tn && i < tn.length; i++) {
      rg.setStart(tn, i); rg.setEnd(tn, i + 1); const q = rg.getBoundingClientRect()
      if (q.width === 0) continue
      total++
      const enVp = q.left >= 0 && q.top >= 0 && q.right <= innerWidth && q.bottom <= innerHeight
      const h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2)
      if (!enVp) fuera++; else if (!(h && (h === capa || capa.contains(h)))) tapados++; else ok++
    }
    glifos = { ok, total, fuera, tapados }
  }
  // El indicio: visible, y no recortado por ningún ancestro.
  const ind = sp?.parentElement?.querySelector(':scope > .voz2-indicio')
  let indicio = null
  if (ind) {
    const b = ind.getBoundingClientRect(); let recortado = false
    for (let n = ind.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const c = n.getBoundingClientRect()
        if (b.left < c.left - 0.5 || b.right > c.right + 0.5 || b.top < c.top - 0.5 || b.bottom > c.bottom + 0.5) recortado = true
      }
    }
    indicio = { visible: getComputedStyle(ind).visibility === 'visible', caja: caja(b), recortado, dentroVp: b.left >= 0 && b.right <= innerWidth }
  }
  const apagados = []
  for (let n = sp?.parentElement; n; n = n.parentElement) if (n.hasAttribute('disabled') || n.getAttribute('aria-disabled') === 'true' || n.inert) apagados.push(n.tagName + '.' + n.className)
  return {
    hay: !!sp, texto: sp?.textContent ?? null, marca: sp?.getAttribute('data-voz2-recortada') ?? null,
    role: sp?.getAttribute('role') ?? null, tabindex: sp?.getAttribute('tabindex') ?? null,
    expanded: sp?.getAttribute('aria-expanded') ?? null, controls: sp?.getAttribute('aria-controls') ?? null,
    capa: { existe: !!capa, visible: capaVis, caja: cr ? caja(cr) : null, texto: capa?.textContent ?? null, id: capa?.id ?? null,
      z: capa ? getComputedStyle(capa).zIndex : null, pos: capa ? getComputedStyle(capa).position : null },
    glifos, indicio, siguiente: tocable(sig), burbuja: tocable(bur), tapa, apagados,
    vp: { w: innerWidth, h: innerHeight }, alt: window.__voz2Alt ?? null,
  }
}

// Los puntos del óvalo para la rejilla de `voz2.toque`: 5×3 metidos 4 px, más
// el centro del texto. Cada uno con quién lo recibe según `elementFromPoint`.
export const REJILLA_OVALO = () => {
  const sp = document.querySelector('.voz2-texto')
  const p = sp?.parentElement || [...document.querySelectorAll('.game-message')].find((e) => e.getClientRects().length)
  const ov = p?.closest('.center-zone, .felt-oval')
  if (!ov) return []
  const b = ov.getBoundingClientRect()
  const pts = []
  for (const fy of [0, 0.5, 1]) for (const fx of [0, 0.25, 0.5, 0.75, 1]) pts.push({ x: b.left + 4 + fx * (b.width - 8), y: b.top + 4 + fy * (b.height - 8) })
  if (sp) { const s = sp.getBoundingClientRect(); pts.push({ x: s.left + s.width / 2, y: s.top + s.height / 2, texto: true }) }
  return pts.map((q) => {
    const h = document.elementFromPoint(q.x, q.y)
    const de = !h ? 'nada' : h.closest('.opp-name, .ai-name') ? 'nombre' : ov.contains(h) ? 'ovalo' : h.closest('.voz2-capa') ? 'capa' : 'otro'
    return { ...q, de, el: h ? (h.className?.baseVal ?? h.className) || h.tagName : null }
  })
}

// Los nombres de rival, TODOS los visibles, con su distancia al óvalo: los que
// quedan a 16 px o menos son la FRONTERA. Se toca el punto del nombre más
// cercano al óvalo. (En 360×640 m5 ninguno llega a la frontera: los nombres van
// arriba en sus paneles; tocarlos igual prueba que su toque es suyo.)
export const NOMBRES_FRONTERA = () => {
  const sp = document.querySelector('.voz2-texto')
  const ov = sp?.parentElement?.closest('.center-zone, .felt-oval')
  if (!ov) return []
  const o = ov.getBoundingClientRect()
  return [...document.querySelectorAll('.opp-name, .ai-name')].filter((e) => e.getClientRects().length).map((e) => {
    const b = e.getBoundingClientRect()
    const dx = Math.max(o.left - b.right, b.left - o.right, 0), dy = Math.max(o.top - b.bottom, b.top - o.bottom, 0)
    const x = Math.min(Math.max(o.left + 1, b.left + 2), b.right - 2)
    const y = b.bottom <= o.top ? b.bottom - 2 : b.top >= o.bottom ? b.top + 2 : b.top + b.height / 2
    const h = document.elementFromPoint(x, y)
    const dist = Math.round(Math.max(dx, dy) * 100) / 100
    return { nombre: e.textContent.trim(), dist, frontera: dist <= 16, x, y, gana: !!h && (h === e || e.contains(h)) }
  })
}

// Grabadora por fotograma para `voz2.siguiente`: ¿hay capa visible? ¿hay
// pastilla TURNO? (la señal POSITIVA de mano nueva, lección ARN-2). La marca
// de tiempo del toque la pone un `pointerdown` en captura.
export const ARMAR_GRABADORA = () => {
  window.__voz2Rec = { f: [], toque: null }
  document.addEventListener('pointerdown', () => { window.__voz2Rec.toque ??= performance.now() }, { capture: true, once: true })
  const turno = () => [...document.querySelectorAll('.seat-badge-gold')].some((b) => ['Turno', 'T'].includes(b.textContent.trim()) && b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden')
  const tick = (t) => {
    const c = document.querySelector('.voz2-capa')
    window.__voz2Rec.f.push({ t, capa: !!c && !c.hidden && c.getClientRects().length > 0, turno: turno(), span: !!document.querySelector('.voz2-texto') })
    if (window.__voz2Rec.f.length < 4000) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// ── voz2.burbuja · la recarga, en el servidor de desarrollo ─────────────────
// `?apu=` no existe en `dist/` (siembraAPU.js: la puerta del build), así que
// esta parte corre contra el 5173 —como el modo `rec` de diagDSK— con el mismo
// conductor de REC-1: `?apu=saldo:5000,recarga`, pasos blandos hasta que la
// mesa pida la automática, y la burbuja tras la revelación.
const PASO_BLANDO = () => {
  const p = (s) => { const x = document.querySelector(s); if (x && !x.disabled) { x.click(); return s } return null }
  const t = (q) => { const x = [...document.querySelectorAll('.btn')].find((y) => y.textContent.trim().startsWith(q) && !y.disabled); if (x) { x.click(); return q } return null }
  return p('[data-accion="pasar"]') || p('[data-accion="igualar"]') || p('[data-accion="retirarse"]') || t('Iniciar mano') || t('Sin descartar')
}
const ESTADO_REC = () => {
  const g = document.querySelector('.game-table')
  return { motivo: g?.dataset.recMotivo || null, siguiente: [...document.querySelectorAll('.btn')].some((b) => b.textContent.trim() === 'Siguiente mano'), mesa: !!g }
}
// Devuelve la página en cuanto la mesa PIDE la automática: la burbuja sale
// después, al terminar la revelación (REC-1, +3,72 s), y el modo abre la capa
// ANTES para ver que la burbuja no la cierra (D10). `esperarBurbuja` espera.
export async function esperarBurbuja(page, limite = 9000) {
  const t0 = Date.now()
  while (Date.now() - t0 < limite) {
    if (await page.evaluate(() => !!document.querySelector('[data-accion="recarga-burbuja"]'))) {
      await page.waitForTimeout(600)
      await mesaQuieta(page, 6000)
      return true
    }
    await page.waitForTimeout(120)
  }
  return false
}
export async function abrirCeldaConBurbuja(browser, vista, n, base, intentos = 12) {
  const ctx = await browser.newContext({ viewport: { width: vista.w, height: vista.h }, deviceScaleFactor: 1, ...(vista.movil ? { isMobile: true, hasTouch: true } : {}) })
  const page = await ctx.newPage()
  try {
    for (let i = 0; i < intentos; i++) {
      await page.goto(`${base}/?apu=saldo:5000,recarga`)
      await recorrerRuta(page, n, 'basico', 0, 'medio')
      await page.mouse.move(5, 5)
      let motivo = null
      for (let paso = 0; paso < 600; paso++) {
        const st = await page.evaluate(ESTADO_REC)
        if (st.motivo === 'automatica') { motivo = st.motivo; break }
        if (st.motivo || st.siguiente || !st.mesa) break
        await page.evaluate(PASO_BLANDO)
        await new Promise((r) => setTimeout(r, 120))
      }
      if (motivo !== 'automatica') continue
      return { ctx, page, intentos: i + 1 }
    }
    throw new Error(`la automática no salió en ${intentos} intentos`)
  } catch (e) { await ctx.close(); throw e }
}
