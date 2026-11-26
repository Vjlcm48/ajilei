// ── TUT-1 tanda 4 · `diagDSK tut menu` · «Cómo se juega» desde el ⋮ de la mesa ──
// Ficha: AJILEI_TUT-1_T4_v1.0.md §2 (`tut.menu`) y P-1/P-2. Contra 5173 con bypass: una mesa
// real de 3 contra las IAS (el banco imitado), jugada con el dedo (móvil) o el ratón, al ritmo
// normal (sin «Partida rápida»: la IA piensa lo bastante para abrir el ⋮ mientras le toca).
//
// En 360×640 y 1920×1080:
//   · tut.menu.fila   el ⋮ tiene cinco filas, «Cómo se juega» la cuarta («Mano actual» sigue
//                     la última, EMB-2), y en 360×640 caben
//                     sin desplazamiento (el panel entero dentro de la ventana);
//   · tut.menu.fase   la fila abre: antes de la primera mano, el índice (en una capa); en el
//                     reparto, el capítulo 3; en tu turno de apuesta, el 5; en el descarte, el
//                     3 en su paso del descarte; en la revelación, el 4. «Cerrar» lo quita;
//   · tut.menu.pausa  con el capítulo abierto en tu turno, el reloj no baja (y al cerrar sigue);
//                     abierto mientras piensa una IA, la IA no juega (y al cerrar, juega);
//   · tut.menu.mazo   al cerrar, el barajado está en el azar (R-2: la mesa no reparte nunca
//                     el orden de la guiada);
//   · tut.menu.vacio  (T7, AJILEI_TUT-1_T7_v1.0.md §2; v1.6 §2.1) antes de la primera mano,
//                     desde el índice del ⋮, los capítulos 1, 4 y 3 paso a paso: ningún aro
//                     sobre huecos de carta vacíos (un aro que es el hueco de una o varias zonas
//                     de cartas sin cartas); el 1.1 y el 4.1 pintan la muestra del AJILEI (cinco
//                     cartas, `chica`, con el aro y la burbuja); el 1.2–1.4 y el 4.5 señalan lo
//                     que existe (mazo, asientos, pila); el 4.3 y los pasos de cartas del 3, en
//                     la tarjeta sin flecha. Después, «Iniciar mano» reparte normal;
//   · tut.consola     sin errores de página.
//
// Control rojo (T7): `TUT_CONTROL=aro-vacio` hace pasar los huecos vacíos por cartas antes de
// abrir los capítulos (les quita `card-empty`: `anclaVacia` ya no ve ninguno vacío; la vara los
// sigue reconociendo por la marca `tut-control-vacio`): el aro vuelve a los huecos y
// `tut.menu.vacio` sale roja.
import process from 'node:process'

const T = {
  T1: { w: 360, h: 640, movil: true },
  T6: { w: 1920, h: 1080, movil: false },
}
const ESPERA_MS = 30000

const MAZO = async () => {
  const [{ ORDENES }, { createDeck, shuffleDeck }] = await Promise.all([import('/src/lib/guiaManos.js'), import('/src/engine/deck.js')])
  const a = shuffleDeck(createDeck()).map((c) => c.id).join(',')
  const b = shuffleDeck(createDeck()).map((c) => c.id).join(',')
  return { distintos: a !== b, guion: ORDENES.some((o) => o.join(',') === a || o.join(',') === b) }
}
const ABIERTO = () => {
  if (document.querySelector('[data-tem-capa]')) return { que: 'indice' }
  const capa = document.querySelector('.tut-capa[data-listo]')
  if (!capa) return null
  const t = capa.querySelector('.tut-paso')?.textContent ?? ''
  const m = t.match(/(\d+)\D+(\d+)/)
  return {
    que: 'capitulo',
    aria: capa.getAttribute('aria-label'),
    n: m ? Number(m[1]) : null,
    m: m ? Number(m[2]) : null,
    texto: capa.querySelector('.tut-rotulo:not(.tut-rotulo--medida) .tut-rotulo-texto')?.textContent ?? '',
    nota: capa.querySelector('.tut-rotulo:not(.tut-rotulo--medida) .tut-nota')?.textContent ?? null,
  }
}
const RELOJ = () => {
  const v = [...document.querySelectorAll('.timer-display')].find((e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility === 'visible')
  return v ? parseInt(v.textContent, 10) : null
}
const PIENSA = () => [...document.querySelectorAll('.action-area.thinking')].map((e) => e.textContent).find((x) => /pensando/.test(x)) ?? null
const PANEL = () => {
  const p = document.querySelector('.utilities-panel')
  if (!p) return null
  const r = p.getBoundingClientRect()
  return {
    ids: [...p.querySelectorAll('[data-entrada]')].map((e) => e.dataset.entrada),
    top: r.top, bottom: r.bottom, alto: r.height, scroll: p.scrollHeight > p.clientHeight + 1,
    dentro: r.top >= 0 && r.bottom <= window.innerHeight,
  }
}
// T7 · un paso de capítulo sobre la mesa viva: sus aros, su muestra y los aros que son el hueco
// de zonas de cartas vacías (el hueco del ancla más su margen de 6 px, con 3 px de tolerancia;
// cinco huecos pegados se funden en uno, así que se compara con la unión de los que encierra).
// Un aro alrededor de un panel de rival (el 1.3) encierra sus huecos pero no es su hueco.
const PASO_VIVO = () => {
  const capa = document.querySelector('.tut-capa[data-listo]')
  if (!capa) return null
  const t = capa.querySelector('.tut-paso')?.textContent ?? ''
  const m = t.match(/(\d+)\D+(\d+)/)
  const caja = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom } }
  const centro = (a, c) => { const x = (c.l + c.r) / 2; const y = (c.t + c.b) / 2; return x > a.l && x < a.r && y > a.t && y < a.b }
  const MARGEN = 6
  const vw = window.innerWidth
  const vh = window.innerHeight
  const vacias = [...document.querySelectorAll('[data-ancla="carta"], .opp-card-slot, .card-slot-wrapper')]
    .filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('.muestra')
      && ![...e.querySelectorAll('.playing-card')].some((c) => !c.classList.contains('card-empty') && !c.classList.contains('tut-control-vacio')))
    .map(caja)
  const aros = [...capa.querySelectorAll('.tut-aro')].map(caja)
  const sobreVacios = aros.filter((a) => {
    const dentro = vacias.filter((z) => centro(a, z))
    if (!dentro.length) return false
    const u = {
      l: Math.max(0, Math.min(...dentro.map((z) => z.l)) - MARGEN), t: Math.max(0, Math.min(...dentro.map((z) => z.t)) - MARGEN),
      r: Math.min(vw, Math.max(...dentro.map((z) => z.r)) + MARGEN), b: Math.min(vh, Math.max(...dentro.map((z) => z.b)) + MARGEN),
    }
    return Math.abs(u.l - a.l) <= 3 && Math.abs(u.t - a.t) <= 3 && Math.abs(u.r - a.r) <= 3 && Math.abs(u.b - a.b) <= 3
  }).length
  const mu = document.querySelector('[data-muestra]')
  return {
    n: m ? Number(m[1]) : null,
    m: m ? Number(m[2]) : null,
    modo: capa.dataset.modo,
    texto: capa.querySelector('.tut-rotulo:not(.tut-rotulo--medida) .tut-rotulo-texto')?.textContent ?? '',
    aros: aros.length,
    sobreVacios,
    flecha: !!capa.querySelector('.tut-flecha'),
    muestra: mu ? {
      tipo: mu.dataset.muestra,
      conjunto: mu.dataset.conjunto ?? null,
      tamano: mu.dataset.tamano ?? null,
      cartas: mu.querySelectorAll('.playing-card:not(.card-empty)').length,
      conAro: aros.some((a) => centro(a, caja(mu))),
    } : null,
  }
}
// Lo que cada paso debe enseñar antes de la primera mano (los pasos de 1 en adelante).
//   ajilei: la muestra del AJILEI con su aro y la burbuja · existe: al menos un aro (mazo,
//   asientos, pila) · tarjeta: sin aro y sin flecha · libre: sólo la regla (ningún aro sobre huecos).
const VACIO = {
  1: ['ajilei', 'existe', 'existe', 'existe'],
  4: ['ajilei', 'libre', 'tarjeta', 'libre', 'existe'],
  3: ['tarjeta', 'libre', 'tarjeta', 'tarjeta', 'libre', 'libre', 'tarjeta'],
}
const LISTO_VIVO = (que) => {
  const capa = document.querySelector('.tut-capa[data-listo]')
  if (!capa) return false
  const aros = capa.querySelectorAll('.tut-aro').length
  const mu = document.querySelector('[data-muestra]')
  if (que === 'ajilei') return !!mu && aros > 0 && capa.dataset.modo === 'burbuja'
  if (que === 'existe') return aros > 0
  if (que === 'tarjeta') return capa.dataset.modo === 'tarjeta'
  return true
}

// Los títulos de los capítulos, por su clave (la capa lleva el título como nombre accesible).
const TITULOS = { 3: 'Cómo va una mano', 4: 'Cómo se gana y cómo se pierde', 5: 'Apostar, pasar, retirarse' }

async function celda(page, base, tam, vp, rastro = {}) {
  const out = { tam, puertas: {}, fallos: [], notas: [], fases: {} }
  // T6 · la etapa en curso: si el recorrido se corta, el fallo dice dónde (y la fila de acciones).
  const etapa = (e) => { rastro.etapa = e }
  const falla = (puerta, texto) => { out.fallos.push(`${tam} ${puerta}: ${texto}`); out.puertas[puerta] = false }
  const pasa = (puerta) => { if (!(puerta in out.puertas)) out.puertas[puerta] = true }
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e?.message || e)))
  const punto = (sel) => page.evaluate((s) => {
    const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width > 0)
    if (!e) return null
    const r = e.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, sel)
  const tocar = async (sel) => {
    const p = await punto(sel)
    if (!p) throw new Error(`no está «${sel}»`)
    if (vp.movil) await page.touchscreen.tap(p.x, p.y)
    else await page.mouse.click(p.x, p.y)
  }
  const abrirFila = async () => {
    await tocar('[data-ancla="menu"]')
    await page.waitForSelector('.utilities-panel [data-accion="tut-menu"]', { timeout: 5000 })
    const panel = await page.evaluate(PANEL)
    await tocar('.utilities-panel [data-accion="tut-menu"]')
    await page.waitForFunction(ABIERTO, null, { timeout: 8000 })
    return { panel, abierto: await page.evaluate(ABIERTO) }
  }
  const cerrar = async () => {
    await tocar('[data-accion="tut-salir"]')
    await page.waitForFunction(() => !document.querySelector('.tut-capa') && !document.querySelector('[data-tem-capa]'), null, { timeout: 5000 })
  }
  const espera = (fn, ms = ESPERA_MS) => page.waitForFunction(fn, null, { timeout: ms })
  const esperado = (fase, abierto, n, paso) => {
    out.fases[fase] = abierto
    if (n === null) { if (abierto?.que !== 'indice') falla('tut.menu.fase', `${fase}: abrió ${JSON.stringify(abierto)} (se esperaba el índice)`) } else if (abierto?.que !== 'capitulo' || abierto.aria !== TITULOS[n] || abierto.n !== paso) {
      falla('tut.menu.fase', `${fase}: abrió ${JSON.stringify(abierto)} (se esperaba el capítulo ${n}, paso ${paso})`)
    }
  }

  // ── La mesa de 3 contra las IAS ──
  etapa('lobby y Retar')
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('main.lobby [data-accion="jugar-ia"]', { timeout: ESPERA_MS })
  await tocar('[data-accion="jugar-ia"]')
  for (const [fila, texto] of [['reto', null], ['jugadores', '3'], ['apuesta', null], ['entrada', null]]) {
    await page.waitForFunction(({ f, x }) => [...document.querySelectorAll(`[data-accion="${f}"]`)].some((b) => !b.disabled && (x === null || b.textContent.trim() === x)), { f: fila, x: texto }, { timeout: 10000 })
    await page.evaluate(({ f, x }) => [...document.querySelectorAll(`[data-accion="${f}"]`)].find((b) => !b.disabled && (x === null || b.textContent.trim() === x)).click(), { f: fila, x: texto })
  }
  await espera(() => { const b = document.querySelector('button.sal-cta.es-retar'); return b && !b.disabled }, 15000)
  await tocar('button.sal-cta.es-retar')
  await page.waitForSelector('[data-accion="iniciar-mano"]', { timeout: ESPERA_MS })

  // 1 · Antes de la primera mano: el índice, y el panel con sus cinco filas.
  etapa('antes de la primera mano')
  {
    const { panel, abierto } = await abrirFila()
    out.panel = panel
    const ids = panel?.ids ?? []
    if (ids.length !== 5 || ids[3] !== 'tutorial' || ids[4] !== 'mano') falla('tut.menu.fila', `filas ${ids.join(',')}`)
    if (vp.w === 360 && (!panel?.dentro || panel.scroll)) falla('tut.menu.fila', `el panel no cabe en 360×640: ${JSON.stringify(panel)}`)
    esperado('espera', abierto, null)
    await cerrar()
  }
  // 1b · T7 · los capítulos 1, 4 y 3 desde el índice del ⋮, con la mano sin cartas.
  etapa('capítulos sin cartas')
  if (process.env.TUT_CONTROL === 'aro-vacio') {
    await page.evaluate(() => document.querySelectorAll('.playing-card.card-empty').forEach((e) => { e.classList.remove('card-empty'); e.classList.add('tut-control-vacio') }))
  }
  out.vacio = {}
  for (const [n, esperados] of Object.entries(VACIO)) {
    const { abierto } = await abrirFila()
    if (abierto?.que !== 'indice') { falla('tut.menu.vacio', `cap ${n}: el ⋮ abrió ${JSON.stringify(abierto)} (se esperaba el índice)`); await cerrar(); continue }
    await tocar(`.tem-fila[data-capitulo="${n}"]`)
    out.vacio[n] = []
    for (let k = 1; k <= esperados.length; k++) {
      const que = esperados[k - 1]
      etapa(`capítulos sin cartas · ${n}.${k}`)
      await page.waitForFunction((x) => new RegExp(`^\\D*${x}\\D`).test(document.querySelector('.tut-capa[data-listo] .tut-paso')?.textContent ?? ''), k, { timeout: 8000 })
      // Lo que el paso debe enseñar, cuando llega (la muestra viaja por su trozo); si no llega, se lee igual.
      await page.waitForFunction(LISTO_VIVO, que, { timeout: 4000 }).catch(() => {})
      await page.waitForTimeout(250)
      const p = await page.evaluate(PASO_VIVO)
      out.vacio[n].push({ que, ...p })
      const yo = `${n}.${k}`
      if (!p || p.n !== k || p.m !== esperados.length) { falla('tut.menu.vacio', `${yo}: el paso no es el ${k} de ${esperados.length} (${JSON.stringify(p)})`); break }
      if (p.sobreVacios > 0) falla('tut.menu.vacio', `${yo}: ${p.sobreVacios} aro(s) sobre huecos de carta vacíos`)
      if (que === 'ajilei') {
        const mu = p.muestra
        if (!mu || mu.tipo !== 'cartas' || mu.conjunto !== 'ajilei' || mu.cartas !== 5 || mu.tamano !== 'chica') falla('tut.menu.vacio', `${yo}: sin la muestra del AJILEI (${JSON.stringify(mu)})`)
        else if (!mu.conAro) falla('tut.menu.vacio', `${yo}: la muestra del AJILEI sin aro`)
        if (p.modo !== 'burbuja') falla('tut.menu.vacio', `${yo}: el rótulo en ${p.modo}, no en la burbuja sobre la muestra`)
        if (!/AJILEI/.test(p.texto)) falla('tut.menu.vacio', `${yo}: el rótulo no nombra el AJILEI («${p.texto}»)`)
      } else if (p.muestra?.conjunto) falla('tut.menu.vacio', `${yo}: la muestra del AJILEI fuera del 1.1 y el 4.1`)
      if (que === 'existe' && p.aros === 0) falla('tut.menu.vacio', `${yo}: sin aro (su ancla existe antes de la primera mano)`)
      if (que === 'tarjeta' && (p.modo !== 'tarjeta' || p.aros > 0 || p.flecha)) falla('tut.menu.vacio', `${yo}: se esperaba la tarjeta sin aro ni flecha (${p.modo}, ${p.aros} aros${p.flecha ? ', flecha' : ''})`)
      if (k < esperados.length) await tocar('.tut-capa [data-accion="tut-siguiente"]')
    }
    await cerrar()
  }
  pasa('tut.menu.vacio')
  // 2 · El reparto: el capítulo 3, desde su primer paso.
  etapa('el reparto')
  await tocar('[data-accion="iniciar-mano"]')
  {
    const { abierto } = await abrirFila()
    esperado('reparto', abierto, 3, 1)
    await cerrar()
  }
  // 3 · Tu turno de apuesta: el 5, con el reloj quieto mientras está abierto.
  etapa('tu turno de apuesta')
  await page.waitForSelector('[data-ancla="fila-acciones"]', { timeout: ESPERA_MS })
  {
    const { abierto } = await abrirFila()
    esperado('apuesta', abierto, 5, 1)
    const r0 = await page.evaluate(RELOJ)
    await page.waitForTimeout(3000)
    const r1 = await page.evaluate(RELOJ)
    await cerrar()
    await page.waitForTimeout(2200)
    const r2 = await page.evaluate(RELOJ)
    out.reloj = { r0, r1, r2 }
    if (r0 === null || r0 !== r1) falla('tut.menu.pausa', `el reloj corrió con el capítulo abierto (${r0} → ${r1})`)
    else if (!(r2 < r1)) falla('tut.menu.pausa', `al cerrar, el reloj no siguió (${r1} → ${r2})`)
  }
  // 4 · Mientras piensa una IA: no juega con el capítulo abierto.
  etapa('mientras piensa una IA')
  {
    const accion = (await punto('[data-accion="pasar"]')) ? '[data-accion="pasar"]' : '[data-accion="igualar"]'
    await tocar(accion)
    const piensa = await espera(PIENSA, 5000).then((h) => h.jsonValue()).catch(() => null)
    if (!piensa) out.notas.push('no se vio pensar a ninguna IA (la ronda se cerró sola)')
    else {
      await tocar('[data-ancla="menu"]')
      await page.waitForSelector('.utilities-panel [data-accion="tut-menu"]', { timeout: 5000 })
      await tocar('.utilities-panel [data-accion="tut-menu"]')
      await page.waitForFunction(ABIERTO, null, { timeout: 8000 })
      const p0 = await page.evaluate(PIENSA)
      await page.waitForTimeout(5000)
      const p1 = await page.evaluate(PIENSA)
      out.ia = { piensa, p0, p1 }
      if (!p0 || p0 !== p1) falla('tut.menu.pausa', `la IA jugó con el capítulo abierto («${p0}» → «${p1}»)`)
      await cerrar()
      const siguio = await espera(() => !document.querySelector('.action-area.thinking') || ![...document.querySelectorAll('.action-area.thinking')].some((e) => /pensando/.test(e.textContent)), 15000).then(() => true).catch(() => false)
      const cambio = siguio || (await page.evaluate(PIENSA)) !== p1
      if (!cambio) falla('tut.menu.pausa', 'al cerrar, la IA no jugó')
    }
  }
  // 5 · Hasta el descarte (pasando o igualando lo que haga falta): el 3, en su paso del descarte.
  // T6 · si una IA apostó más que tu pila solo quedan «All-in» y «Retirarse»: antes del descarte,
  // all-in (las cartas siguen jugando y se llega al descarte); después, retirarse (la mano acaba
  // con «Siguiente mano»). Sin esto la vara no tocaba nada y el reloj cerraba la mano (un rojo
  // de la serie de la tanda 6 que dependía del barajado).
  const turno = async (resto) => {
    for (const a of ['pasar', 'igualar', resto]) if (await punto(`[data-ancla="fila-acciones"] [data-accion="${a}"]`)) return `[data-ancla="fila-acciones"] [data-accion="${a}"]`
    return null
  }
  etapa('hasta el descarte')
  for (let k = 0; k < 20; k++) {
    if (await punto('[data-accion="descartar"]')) break
    const p = await turno('allin')
    if (p) await tocar(p)
    await page.waitForTimeout(700)
  }
  await page.waitForSelector('[data-accion="descartar"]', { timeout: ESPERA_MS })
  {
    const { abierto } = await abrirFila()
    esperado('descarte', abierto, 3, 5)
    await cerrar()
  }
  await tocar('[data-accion="descartar"]')
  // 6 · Hasta la revelación: el 4.
  etapa('hasta la revelación')
  for (let k = 0; k < 30; k++) {
    if (await punto('[data-accion="siguiente-mano"]')) break
    const p = await turno('retirarse')
    if (p) await tocar(p)
    await page.waitForTimeout(700)
  }
  await page.waitForSelector('[data-accion="siguiente-mano"]', { timeout: ESPERA_MS })
  {
    const { abierto } = await abrirFila()
    esperado('revelacion', abierto, 4, 1)
    await cerrar()
  }
  pasa('tut.menu.fila')
  pasa('tut.menu.fase')
  pasa('tut.menu.pausa')
  const z = await page.evaluate(MAZO)
  out.mazo = z
  if (!z.distintos || z.guion) falla('tut.menu.mazo', JSON.stringify(z))
  pasa('tut.menu.mazo')
  if (errores.length) falla('tut.consola', errores.slice(0, 3).join(' | '))
  pasa('tut.consola')
  return out
}

export async function runTutMenu(browser, { base }) {
  const t0 = Date.now()
  const celdas = {}
  const fallos = []
  await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const rastro = {}
    try {
      celdas[tam] = await celda(page, base, tam, vp, rastro)
      fallos.push(...celdas[tam].fallos)
    } catch (e) {
      const fila = await page.evaluate(() => [...document.querySelectorAll('[data-ancla="fila-acciones"] [data-accion]')]
        .filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.dataset.accion).join(',')).catch(() => '?')
      const mensaje = String(e?.message || e).split('\n').filter((l) => l.trim() && !/^Call log:/.test(l.trim())).slice(0, 2).join(' · ').slice(0, 300)
      fallos.push(`${tam}: el recorrido se cortó en «${rastro.etapa ?? '?'}» (fila: ${fila || 'vacía'}): ${mensaje}`)
      if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/menu-${tam}-corte.png` }).catch(() => {})
    } finally { await ctx.close() }
  }))
  const verde = fallos.length === 0 && Object.keys(celdas).length === Object.keys(T).length
  const ms = Date.now() - t0
  console.log(`  tut.menu · ${verde ? 'VERDE' : 'ROJO'} · ${Object.keys(celdas).join(' · ')} · ${(ms / 1000).toFixed(0)} s`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  for (const [tam, c] of Object.entries(celdas)) for (const n of c.notas ?? []) console.log(`    · ${tam} ${n}`)
  if (process.env.TUT_DETALLE) console.log(JSON.stringify(celdas, null, 1))
  return { verde, ms, fallos, celdas }
}
