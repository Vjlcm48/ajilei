// ── MES-PvP L-M 2 · §1.3 · Las tres varas de la tanda 1, como celdas de `diagDSK pvp` ──────
// Ficha AJILEI_MES-PvP_LM-2_v1.0.md §1.3; antes, `laminas/lm1/medir.mjs` y `_salto.mjs`. Contra
// 5173 con bypass (`?pvp=` del árbitro imitado). Cada celda lleva un control rojo: la misma
// medida sobre un caso que tiene que fallar. Una celda es verde si la medida pasa Y el control
// sale rojo (si el control no falla, la medida no mide).
//   1 · franja del sorteo (`sorteo-elige`, mesas 2 y 5): no corta recuadros ajenos ni cartas
//       propias; en la mesa de 2 a 915×412 va en la crónica, dentro del óvalo y sin moverlo.
//       Control: la franja, puesta a mano encima del primer recuadro rival.
//   2 · la crónica con 15 «W» y corte 10 (`turno-ajeno` + un paso: «… pasa.»), mesas 2 y 5: la
//       tinta no sale del óvalo ni pisa el pozo, y el óvalo no crece. La base es la misma página con la frase cambiada por «x»
//       (el óvalo de otra escena tiene otra caja: trampa de L-M 1). Control: la misma frase con el
//       nombre entero puesta a mano (desde la 5a el corte vive en `nombreEnVoz` y `&corte=0` ya no
//       lo quita).
//   3 · el salto raro (`sorteo-desempate&ver=vivo`, 412×915, mesas 2 y 5): ningún fotograma con
//       cartas en los huecos antes del primer vuelo del reparto (110 ms tras el barajado).
//       Control: el mismo contador sobre `sorteo-elige` congelada, con las cartas ya repartidas.

const PANTALLAS = [[1920, 1080], [412, 915], [915, 412], [390, 844], [360, 640]]
const id = ([w, h]) => `${w}x${h}`
const MESAS = [[2, 0], [5, 1]]   // [n, asiento], como la lámina de la tanda 1
const PRIMER_VUELO_MS = 110      // el reparto arranca a los 120 ms (`esperaRepartoSorteo`)
const TOL = 0.5

async function enPagina(browser, [w, h], q, alListo) {
  for (let intento = 0; intento < 2; intento++) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, ...(w < 1024 ? { hasTouch: true, isMobile: true } : {}) })
    try {
      await page.goto(`${q.base}/${q.ruta}`, { waitUntil: 'networkidle' })
      if (!q.vivo) {
        await page.waitForSelector('[data-clavada]', { timeout: 15000 })
        await page.mouse.move(2, 2)
        await page.waitForTimeout(1200)
      }
      return await alListo(page)
    } catch (e) {
      if (intento === 1) return { error: String(e?.message || e).slice(0, 160) }
    } finally {
      await page.close()
    }
  }
  return { error: 'sin intentos' }
}

async function enPiscina(tareas, n = 4) {
  const res = []
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tareas.length) { const k = i++; res[k] = await tareas[k]() }
  }))
  return res
}

// ── 1 · La franja ───────────────────────────────────────────────────────────
// `encima`: el control. Pone la franja sobre el primer recuadro rival antes de medir.
const MEDIR_FRANJA = (encima) => {
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height } }
  const corte = (a, b) => {
    if (!a || !b) return 0
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
    return w > 0.5 && h > 0.5 ? `${Math.round(w)}×${Math.round(h)}` : 0
  }
  const franjaEl = document.querySelector('[data-pvp="sorteo-franja"]')
  if (!franjaEl) return { sinFranja: true }
  const recuadros = [...document.querySelectorAll('[data-coin-target]')]
    .filter((m) => m.dataset.coinTarget !== 'pot' && m.dataset.coinTarget !== '0')
    .map((m) => ({ seat: Number(m.dataset.coinTarget), r: R(m.closest('.opp-panel, .ai-zone')) }))
  if (encima && recuadros[0]) {
    const q = recuadros[0].r
    Object.assign(franjaEl.style, { position: 'fixed', left: `${q.x}px`, top: `${q.y}px`, transform: 'none' })
  }
  const franja = R(franjaEl)
  const propias = [...document.querySelectorAll('.player-zone .card-slot-wrapper, .pvp-sc[data-sorteo-asiento="0"]')].map(R)
  const ovalEl = document.querySelector('.game-message')?.closest('.felt-oval, .center-zone')
  const oval = R(ovalEl)
  const fueraOval = oval ? Math.round(Math.max(0, oval.y - franja.y, franja.y + franja.h - (oval.y + oval.h), oval.x - franja.x, franja.x + franja.w - (oval.x + oval.w))) : null
  // El óvalo no cambia de tamaño con el texto: se mide, se cambia el texto por «x» y se vuelve a medir.
  const antes = oval && [oval.x, oval.y, oval.w, oval.h]
  const texto = franjaEl.textContent
  franjaEl.textContent = 'x'
  const o2 = R(ovalEl)
  franjaEl.textContent = texto
  const dOval = antes && o2 ? Math.max(...[o2.x, o2.y, o2.w, o2.h].map((v, i) => Math.abs(v - antes[i]))) : null
  return {
    texto: texto.trim(),
    recuadros: recuadros.map((q) => (corte(franja, q.r) ? `${q.seat}:${corte(franja, q.r)}` : null)).filter(Boolean),
    propias: propias.map((p) => corte(franja, p)).filter(Boolean),
    enCronica: franjaEl.classList.contains('es-en-cronica'),
    fueraOval,
    dOval: dOval === null ? null : Math.round(dOval * 10) / 10,
  }
}
const franjaPasa = (m, n, vp) => !m.error && !m.sinFranja && m.recuadros.length === 0 && m.propias.length === 0
  && (n !== 2 || id(vp) !== '915x412' || (m.enCronica && m.fueraOval === 0 && m.dOval !== null && m.dOval <= TOL))

async function varaFranja(browser, base) {
  const filas = await enPiscina(MESAS.flatMap(([n, asiento]) => PANTALLAS.map((vp) => async () => {
    const m = await enPagina(browser, vp, { base, ruta: `?pvp=sorteo-elige&n=${n}&asiento=${asiento}` }, (p) => p.evaluate(MEDIR_FRANJA, false))
    return { n, vp: id(vp), ...m, ok: franjaPasa(m, n, vp) }
  })))
  const c = await enPagina(browser, [412, 915], { base, ruta: '?pvp=sorteo-elige&n=5&asiento=1' }, (p) => p.evaluate(MEDIR_FRANJA, true))
  const control = { caso: 'franja sobre el recuadro rival · m5 412x915', recuadros: c.recuadros, error: c.error, rojo: !franjaPasa(c, 5, [412, 915]) && !c.error }
  const medida = filas.every((f) => f.ok)
  return { celda: 'lm·franja-sorteo', ok: medida && control.rojo, medida, filas, control }
}

// ── 2 · La crónica con 15 «W» ───────────────────────────────────────────────
// `sinCorte`: el control. Pone en la crónica la misma frase con el nombre entero (15 «W»).
const MEDIR_CRONICA = (sinCorte) => {
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height } }
  const msg = document.querySelector('.game-message')
  const ovalEl = document.querySelector('.center-zone') ?? document.querySelector('.felt-oval.oval-right')
  if (!msg || !ovalEl) return { error: 'sin óvalo' }
  if (sinCorte) msg.textContent = msg.textContent.replace(/W+…/g, 'W'.repeat(15))
  const rg = document.createRange()
  rg.selectNodeContents(msg)
  const t = R(rg)
  const caja = R(msg)
  const oval = R(ovalEl)
  // Se sale: la tinta pasa el ancho de su caja o cualquier filo del óvalo. La caja de la crónica
  // es de alto fijo y `overflow: visible`: una 2.ª línea la pasa por abajo sin salir del óvalo
  // (dato, `bajoLaCaja`, como en L-M 1). Y la tinta no pisa el pozo.
  const seSale = Math.max(0, Math.round(t.x + t.w - (caja.x + caja.w)), Math.round(caja.x - t.x),
    Math.round(oval.y - t.y), Math.round(t.y + t.h - (oval.y + oval.h)), Math.round(oval.x - t.x), Math.round(t.x + t.w - (oval.x + oval.w)))
  const pozoEl = document.querySelector('.pot-box')
  const pz = pozoEl && R(pozoEl)
  // Por renglón, y sin el aire de la fuente: la caja de un renglón lleva por encima de las
  // mayúsculas ~1/5 de su alto (a 360×640 la 1.ª línea entra 3 px de 25 en la caja del pozo
  // sin que la tinta lo toque; captura en `capturas-dsk/lm2_vara_cronica_m2_360x640.png`).
  const pisaPozo = !!pz && pz.w > 0 && [...rg.getClientRects()].some((l) => {
    const aire = l.height / 5
    return Math.min(l.right, pz.x + pz.w) - Math.max(l.left, pz.x) > 0.5
      && Math.min(l.bottom - aire, pz.y + pz.h) - Math.max(l.top + aire, pz.y) > 0.5
  })
  const bajoLaCaja = Math.max(0, msg.scrollHeight - msg.clientHeight)
  const lineas = new Set([...rg.getClientRects()].map((r) => Math.round(r.top))).size
  const frase = msg.textContent.trim()
  const antes = [oval.x, oval.y, oval.w, oval.h]
  // La base: la misma página con la frase cambiada por «x».
  const guardado = [...msg.childNodes].map((nd) => nd.cloneNode(true))
  msg.textContent = 'x'
  const o2 = R(ovalEl)
  msg.replaceChildren(...guardado)
  const crece = Math.max(...[o2.x, o2.y, o2.w, o2.h].map((v, i) => Math.abs(v - antes[i])))
  return { frase, lineas, seSale, pisaPozo, bajoLaCaja, crece: Math.round(crece * 10) / 10 }
}
const cronicaPasa = (m) => !m.error && /W/.test(m.frase) && m.seSale === 0 && !m.pisaPozo && m.crece <= TOL

async function varaCronica(browser, base) {
  const medir = (corte) => enPiscina(MESAS.flatMap(([n, asiento]) => PANTALLAS.map((vp) => async () => {
    const m = await enPagina(browser, vp, { base, ruta: `?pvp=turno-ajeno&n=${n}&asiento=${asiento}&nombres=largo` }, async (p) => {
      await p.evaluate(() => window.__pvpImitada.avanzar())
      await p.waitForTimeout(700)
      return p.evaluate(MEDIR_CRONICA, !corte)
    })
    return { n, vp: id(vp), ...m, ok: cronicaPasa(m) }
  })))
  const filas = await medir(true)
  const sinCorte = await medir(false)
  const rojas = sinCorte.filter((f) => !f.ok && !f.error)
  const control = { caso: 'la frase con el nombre entero, puesta a mano', rojas: rojas.map((f) => `m${f.n} ${f.vp} «${f.frase}» ${f.lineas} lín · sale ${f.seSale} · crece ${f.crece} · pisa el pozo ${f.pisaPozo}`), rojo: rojas.length > 0 }
  const medida = filas.every((f) => f.ok)
  return { celda: 'lm·cronica-15W', ok: medida && control.rojo, medida, filas, control }
}

// ── 3 · El salto raro ───────────────────────────────────────────────────────
// `desdeYa`: el control. Sin esperar al barajado, cuenta desde el primer fotograma.
const CONTAR_SALTO = ({ desdeYa, tope }) => new Promise((ok) => {
  const out = []
  let vioBarajado = desdeYa
  let t0 = null
  const inicio = performance.now()
  const paso = () => {
    const fans = document.querySelectorAll('.pvp-sc-capa .shuffle-fan-card').length
    if (fans) vioBarajado = true
    if (vioBarajado && !fans) {
      t0 ??= performance.now()
      const cs = [...document.querySelectorAll('.pvp-sc')]
      out.push({ ms: Math.round(performance.now() - t0), hueco: cs.filter((c) => c.dataset.sorteoLugar === 'hueco').length })
      if (performance.now() - t0 > tope) return ok(out)
    }
    if (performance.now() - inicio > 20000) return ok(out)
    requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
})
const saltos = (frames) => frames.filter((f) => f.ms < PRIMER_VUELO_MS && f.hueco > 0).length

async function varaSalto(browser, base) {
  const vp = [412, 915]
  const filas = []
  for (const [n, asiento] of MESAS) {
    const m = await enPagina(browser, vp, { base, ruta: `?pvp=sorteo-desempate&n=${n}&asiento=${asiento}&ver=vivo`, vivo: true }, async (p) => {
      const frames = await p.evaluate(CONTAR_SALTO, { desdeYa: false, tope: 700 })
      return { fotogramas: frames.filter((f) => f.ms < PRIMER_VUELO_MS).length, conCartas: saltos(frames) }
    })
    filas.push({ n, vp: id(vp), ...m, ok: !m.error && m.fotogramas > 0 && m.conCartas === 0 })
  }
  const c = await enPagina(browser, vp, { base, ruta: '?pvp=sorteo-elige&n=5&asiento=1' }, async (p) => {
    const frames = await p.evaluate(CONTAR_SALTO, { desdeYa: true, tope: 200 })
    return { fotogramas: frames.filter((f) => f.ms < PRIMER_VUELO_MS).length, conCartas: saltos(frames) }
  })
  const control = { caso: 'sorteo-elige congelada (cartas ya en los huecos)', ...c, rojo: !c.error && c.conCartas > 0 }
  const medida = filas.every((f) => f.ok)
  return { celda: 'lm·salto-raro', ok: medida && control.rojo, medida, filas, control }
}

export async function runVarasLM(browser, base) {
  const celdas = []
  for (const vara of [varaFranja, varaCronica, varaSalto]) {
    const c = await vara(browser, base)
    celdas.push(c)
    const malas = c.filas.filter((f) => !f.ok).map((f) => `m${f.n} ${f.vp}${f.error ? ` ${f.error}` : ''}`)
    console.log(`pvp·vara ${c.celda} · ${c.ok ? 'OK' : 'FALLA'} · medida ${c.medida}${malas.length ? ` (${malas.join(', ')})` : ''} · control rojo ${c.control.rojo}`)
  }
  return { celdas, verde: celdas.every((c) => c.ok) }
}
