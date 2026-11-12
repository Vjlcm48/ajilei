// ── MES-PvP 5a · Las varas de la sub-tanda, en `diagDSK pvp mesa` ───────────────────────────
// Ficha AJILEI_MES-PvP_Sub5a_v1.0.md §A2 y §A3. Contra 5173 con bypass (`?pvp=` del árbitro
// imitado). Cada celda lleva su control rojo: la misma medida sobre un caso que tiene que fallar.
// Una celda es verde si la medida pasa Y el control sale rojo.
//   1 · el óvalo no se mueve entre el sorteo y la primera mano (`sorteo-volteo-propio&ver=vivo`,
//       en vivo hasta que sale el reloj del turno): Δ = 0 en 360×640, 412×915, 915×412 y
//       1366×768, mesas de 2 y de 5. Control: la caja reservada del sorteo quitada
//       (`display: none`), que es la mesa de antes de la 5a.
//   2 · el área de «Tú» no se mueve en el pago (mesa de 2 en vertical, 412×915 y 360×640): la
//       `.player-zone` de la apuesta (`turno-ajeno`) y la del pago (`revelacion`), iguales.
//       Control: la ranura del pago quitada (`display: none`), la mesa de antes de la 5a.
//   3 · el arranque (`&lento=0` y `&lento=4000`, mesas de 2 y de 5, 412×915): desde que la
//       partida tiene su sala, cuadro a cuadro, ninguno sin mesa y ninguno con texto de espera,
//       hasta el reparto del sorteo. Control: la misma partida sin la mesa provisional (el
//       módulo servido con `provisional = null`): con 4000 hay cuadros sin mesa.
//   4 · el mazo del sorteo en el asiento del anfitrión, desde cada asiento (abajo).

const TOL = 0.5

async function enPiscina(tareas, n = 4) {
  const res = []
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tareas.length) { const k = i++; res[k] = await tareas[k]() }
  }))
  return res
}

const pagina = (browser, [w, h]) => browser.newPage({ viewport: { width: w, height: h }, ...(w < 1024 ? { hasTouch: true, isMobile: true } : {}) })
const quitar = (page, regla) => page.addInitScript((css) => {
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style')
    s.textContent = css
    document.head.appendChild(s)
  })
}, regla)
const delta = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))

// ── 1 · El óvalo entre el sorteo y la primera mano ──────────────────────────
const OVALO = () => {
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height] }
  let oval = R(document.querySelector('.center-zone'))
  const dos = [...document.querySelectorAll('.two-ovals .felt-oval')].map(R)
  if (!oval && dos.length) {
    const x = Math.min(...dos.map((r) => r[0]))
    const y = Math.min(...dos.map((r) => r[1]))
    oval = [x, y, Math.max(...dos.map((r) => r[0] + r[2])) - x, Math.max(...dos.map((r) => r[1] + r[3])) - y]
  }
  return { oval, sorteo: !!document.querySelector('[data-pvp="sorteo"]'), turno: !!document.querySelector('.player-bar-center .timer-display, .ls-timer') }
}
const RESERVA_FUERA = '.player-bar-center > .action-area[aria-hidden="true"] { display: none }'

async function ovaloEnVivo(browser, base, vp, n, control) {
  const page = await pagina(browser, vp)
  try {
    if (control) await quitar(page, RESERVA_FUERA)
    await page.goto(`${base}/?pvp=sorteo-volteo-propio&n=${n}&ver=vivo`, { waitUntil: 'domcontentloaded' })
    const sorteo = []
    const mano = []
    const t0 = Date.now()
    while (Date.now() - t0 < 60000) {
      const m = await page.evaluate(OVALO).catch(() => null)
      if (m?.oval && m.sorteo) sorteo.push(m.oval)
      else if (m?.oval && sorteo.length) { mano.push(m.oval); if (m.turno && mano.length >= 3) break }
      await page.waitForTimeout(100)
    }
    if (!sorteo.length || !mano.length) return { error: `sorteo ${sorteo.length} · mano ${mano.length}` }
    return { muestras: sorteo.length + mano.length, d: Math.round(Math.max(...mano.map((o) => delta(o, sorteo.at(-1)))) * 10) / 10 }
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) }
  } finally {
    await page.close()
  }
}

const CELDAS_OVALO = [[360, 640], [412, 915], [915, 412], [1366, 768]]
const CONTROL_OVALO = [[[1366, 768], 2], [[412, 915], 5]]   // donde la mesa de antes saltaba 27,5 y 42,8 px

async function varaOvalo(browser, base) {
  const tareas = []
  for (const vp of CELDAS_OVALO) for (const n of [2, 5]) tareas.push(async () => ({ vp: vp.join('x'), n, ...(await ovaloEnVivo(browser, base, vp, n, false)) }))
  for (const [vp, n] of CONTROL_OVALO) tareas.push(async () => ({ vp: vp.join('x'), n, control: true, ...(await ovaloEnVivo(browser, base, vp, n, true)) }))
  const todas = await enPiscina(tareas)
  const filas = todas.filter((f) => !f.control)
  const controles = todas.filter((f) => f.control)
  const medida = filas.every((f) => !f.error && f.d <= TOL)
  const control = { caso: 'sin la caja reservada del sorteo', filas: controles, rojo: controles.every((c) => !c.error && c.d > TOL) }
  return { celda: '5a·ovalo-sorteo-mano', ok: medida && control.rojo, medida, filas, control }
}

// ── 2 · El área de «Tú» en el pago ──────────────────────────────────────────
const ZONA = () => {
  const b = document.querySelector('.player-zone')?.getBoundingClientRect()
  return b ? [b.left, b.top, b.width, b.height] : null
}
const RANURA_FUERA = '.player-bar-center > .action-area.rec-ranura { display: none }'

async function zonaEn(browser, base, vp, escena, control) {
  const page = await pagina(browser, vp)
  try {
    if (control) await quitar(page, RANURA_FUERA)
    await page.goto(`${base}/?pvp=${escena}&n=2&asiento=1`, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-clavada]', { timeout: 15000 })
    await page.mouse.move(2, 2)
    await page.waitForTimeout(1200)
    return { zona: await page.evaluate(ZONA), fase: await page.evaluate(() => window.__pvpImitada?.foto().vista.phase ?? null) }
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) }
  } finally {
    await page.close()
  }
}

async function varaZona(browser, base) {
  const celdas = [[412, 915], [360, 640]]
  const filas = await enPiscina(celdas.map((vp) => async () => {
    const [apuesta, pago, sinRanura] = await Promise.all([
      zonaEn(browser, base, vp, 'turno-ajeno', false),
      zonaEn(browser, base, vp, 'revelacion', false),
      zonaEn(browser, base, vp, 'revelacion', true),
    ])
    const error = apuesta.error ?? pago.error ?? sinRanura.error ?? (!apuesta.zona || !pago.zona || !sinRanura.zona ? 'sin .player-zone' : null)
    if (error) return { vp: vp.join('x'), error }
    return {
      vp: vp.join('x'), fases: `${apuesta.fase}→${pago.fase}`,
      d: Math.round(delta(pago.zona, apuesta.zona) * 10) / 10,
      dControl: Math.round(delta(sinRanura.zona, apuesta.zona) * 10) / 10,
    }
  }), 2)
  const medida = filas.every((f) => !f.error && f.d <= TOL)
  const control = { caso: 'sin la ranura del pago', rojo: filas.every((f) => !f.error && f.dControl > TOL) }
  return { celda: '5a·zona-tu-pago', ok: medida && control.rojo, medida, filas, control }
}

// ── 3 · El arranque, cuadro a cuadro ────────────────────────────────────────
// Desde que `PartidaPvP` tiene su partida (`__pvpImitada`, la sala de la mesa real): antes solo
// carga el módulo del imitado, que es de desarrollo.
const GRABAR = () => {
  const t0 = performance.now()
  window.__cuadros = []
  const paso = () => {
    const capa = document.querySelector('[data-pvp="sorteo"]')
    const texto = document.querySelector('.sal-partida-pronto')?.textContent.trim() ?? ''
    window.__cuadros.push({
      t: Math.round(performance.now() - t0),
      partida: !!window.__pvpImitada,
      mesa: !!document.querySelector('.center-zone, .two-ovals'),
      espera: texto || (/Arrancando/.test(document.body?.innerText ?? '') ? 'Arrancando' : ''),
      etapa: capa?.dataset.etapa ?? null,
    })
    if (capa?.dataset.etapa !== 'reparto' && window.__cuadros.length < 5000) requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
}

async function arranque(browser, base, n, lento, control) {
  const page = await pagina(browser, [412, 915])
  try {
    if (control) {
      await page.route(/\/src\/hooks\/mesaPvPCore\.js/, async (route) => {
        const r = await route.fetch()
        const cuerpo = (await r.text()).replace(/const provisional = [^\n;]*/, 'const provisional = null')
        await route.fulfill({ response: r, body: cuerpo })
      })
    }
    await page.addInitScript(GRABAR)
    await page.goto(`${base}/?pvp=sorteo-volteo-propio&n=${n}&ver=vivo&lento=${lento}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__cuadros?.some((c) => c.etapa === 'reparto'), null, { timeout: 20000 })
    const cuadros = await page.evaluate(() => window.__cuadros)
    const conPartida = cuadros.filter((c) => c.partida)
    const primera = conPartida.findIndex((c) => c.mesa)
    return {
      cuadros: conPartida.length,
      primeraMesaMs: primera < 0 ? null : conPartida[primera].t - conPartida[0].t,
      sinMesa: conPartida.filter((c) => !c.mesa).length,
      conEspera: cuadros.filter((c) => c.espera).length,
      etapas: [...new Set(conPartida.map((c) => c.etapa).filter(Boolean))].join('>'),
    }
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) }
  } finally {
    await page.close()
  }
}

async function varaArranque(browser, base) {
  const tareas = []
  for (const lento of [0, 4000]) for (const n of [2, 5]) tareas.push(async () => ({ lento, n, ...(await arranque(browser, base, n, lento, false)) }))
  tareas.push(async () => ({ lento: 4000, n: 2, control: true, ...(await arranque(browser, base, 2, 4000, true)) }))
  const todas = await enPiscina(tareas)
  const filas = todas.filter((f) => !f.control)
  const [c] = todas.filter((f) => f.control)
  const medida = filas.every((f) => !f.error && f.cuadros > 0 && f.sinMesa === 0 && f.conEspera === 0 && f.etapas.startsWith('barajado'))
  const control = { caso: 'sin la mesa provisional, lento=4000', ...c, rojo: !c.error && c.sinMesa > 0 }
  return { celda: '5a·arranque', ok: medida && control.rojo, medida, filas, control }
}

// ── 4 · El mazo del sorteo, en el asiento del anfitrión ─────────────────────
// Túnel 1 de la 5a: Victor vio el mazo junto al invitado. El anfitrión es el asiento real 0
// (Contrato §1, «Asiento»); visto desde cada asiento de las mesas de 2 a 5 (el anfitrión queda
// abajo, arriba o a un lado), el mazo tiene que estar más cerca de su recuadro que de ningún otro.
// También en la mesa provisional (`&lento`). Control: `mesaPvPCore` servido con el mazo siempre
// en el asiento propio, que es lo que vería un invitado con el anfitrión mal contado.
const MAZO = () => {
  const m = document.querySelector('[data-pvp="sorteo-mazo"]')?.getBoundingClientRect()
  const p = window.__pvpImitada
  if (!m || !p) return { error: 'sin mazo' }
  const centro = (b) => [b.x + b.width / 2, b.y + b.height / 2]
  const [cx, cy] = centro(m)
  const recuadros = [['Tú', document.querySelector('.player-zone')],
    ...[...document.querySelectorAll('.opp-panel, .ai-zone')].map((el) => [el.querySelector('.opp-name, .ai-name')?.textContent.trim(), el])]
  const cerca = recuadros.filter(([, el]) => el)
    .map(([nombre, el]) => { const [x, y] = centro(el.getBoundingClientRect()); return { nombre, d: Math.hypot(x - cx, y - cy) } })
    .sort((a, b) => a.d - b.d)[0]
  const sillas = [...(p.sala.sillas ?? [])].sort((a, b) => a.asiento - b.asiento)
  const vista = p.foto().vista
  const anfitrion = vista ? (vista.asiento === 0 ? 'Tú' : vista.players[0].name) : sillas[0]?.tu ? 'Tú' : sillas[0]?.nombre
  return { cerca: cerca?.nombre ?? null, anfitrion, conVista: !!vista }
}
const MAZO_PROPIO = /anfitrion: provisional \? \(nProvisional - provisional\.asiento\) % nProvisional : 0/
const MAZO_PROPIO_VISTA = /const anfitrion = \(vista\.players\.length - vista\.asiento\) % vista\.players\.length/

async function mazoEn(browser, base, n, asiento, lento, control) {
  const page = await pagina(browser, [412, 915])
  try {
    if (control) {
      await page.route(/\/src\/hooks\/mesaPvPCore\.js/, async (route) => {
        const r = await route.fetch()
        const cuerpo = (await r.text()).replace(MAZO_PROPIO, 'anfitrion: 0').replace(MAZO_PROPIO_VISTA, 'const anfitrion = 0')
        await route.fulfill({ response: r, body: cuerpo })
      })
    }
    await page.goto(`${base}/?pvp=sorteo-baraja&n=${n}&asiento=${asiento}&ver=vivo${lento ? `&lento=${lento}` : ''}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-pvp="sorteo-mazo"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    return await page.evaluate(MAZO)
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) }
  } finally {
    await page.close()
  }
}

async function varaMazo(browser, base) {
  const tareas = []
  for (const n of [2, 3, 4, 5]) for (let asiento = 0; asiento < n; asiento++) {
    tareas.push(async () => ({ n, asiento, ...(await mazoEn(browser, base, n, asiento, null, false)) }))
  }
  // La mesa provisional, antes de la vista: desde el anfitrión y desde un invitado.
  for (const [n, asiento] of [[2, 0], [2, 1], [3, 2]]) tareas.push(async () => ({ n, asiento, lento: 4000, ...(await mazoEn(browser, base, n, asiento, 4000, false)) }))
  for (const [n, asiento, lento] of [[2, 1, null], [3, 1, null], [3, 2, 4000]]) tareas.push(async () => ({ n, asiento, lento, control: true, ...(await mazoEn(browser, base, n, asiento, lento, true)) }))
  const todas = await enPiscina(tareas)
  const filas = todas.filter((f) => !f.control).map((f) => ({ ...f, ok: !f.error && f.cerca === f.anfitrion }))
  const controles = todas.filter((f) => f.control)
  const medida = filas.every((f) => f.ok) && filas.some((f) => f.lento && !f.conVista)
  const control = { caso: 'el mazo siempre en el asiento propio', filas: controles, rojo: controles.every((c) => !c.error && c.cerca !== c.anfitrion) }
  return { celda: '5a·mazo-anfitrion', ok: medida && control.rojo, medida, filas, control }
}

export async function runSub5aMesa(browser, base) {
  const celdas = [await varaOvalo(browser, base), await varaZona(browser, base), await varaArranque(browser, base), await varaMazo(browser, base)]
  for (const c of celdas) {
    const malas = c.filas.filter((f) => f.error || f.ok === false || (f.d ?? 0) > TOL || f.sinMesa > 0 || f.conEspera > 0).map((f) => JSON.stringify(f))
    console.log(`pvp·vara ${c.celda} · ${c.ok ? 'OK' : 'FALLA'} · medida ${c.medida}${malas.length ? ` (${malas.join(', ')})` : ''} · control rojo ${c.control.rojo}`)
  }
  return { celdas }
}
