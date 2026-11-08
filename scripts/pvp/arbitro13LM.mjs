// ── MES-PvP · árbitro v1.3-a · dos varas, como celdas de `diagDSK pvp` ───────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md §3. Contra 5173 con bypass (`?pvp=`, el árbitro
// imitado, que ya publica la vista del árbitro real). Cada celda lleva su control rojo: una
// celda es verde si la medida pasa Y el control falla.
//   1 · las posiciones del sorteo (`sorteo-elige&ver=vivo`, mesas 2 y 5, dos pantallas): con los
//       rivales ya elegidos (su carta más alta, según la semilla) y tú aún sin elegir, la carta
//       adelantada de cada asiento que eligió es la de la posición que publica la vista
//       (`sorteo.elegidas`), y nadie más tiene una adelantada. Control: la misma comparación
//       contra la posición que se inventaba la capa antes de la v1.3, `(asiento·2 + ronda) % 5`.
//       (En la escena congelada `sorteo-elige-algunos` el guion elige justo esas posiciones y el
//       control no podía fallar: por eso en vivo.)
//   2 · el mensaje con id fijo (`turno-ajeno&msj=uno`, mesas 2 y 5): la clave que viaja es un id
//       de `config/mensajes.js` y la burbuja del rival pinta su frase. Control: las mismas
//       claves reescritas al código del emoji (la clave de antes de la v1.3) y la mesa repintada:
//       no debe quedar ninguna burbuja ajena.

const PANTALLAS = [[412, 915], [1920, 1080]]
const id = ([w, h]) => `${w}x${h}`
const MESAS = [[2, 0], [5, 1]]   // [n, asiento]

async function enPagina(browser, [w, h], url, alListo, vivo = false) {
  for (let intento = 0; intento < 2; intento++) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, ...(w < 1024 ? { hasTouch: true, isMobile: true } : {}) })
    try {
      await page.goto(url, { waitUntil: 'networkidle' })
      if (!vivo) {
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

// ── 1 · Las posiciones del sorteo ───────────────────────────────────────────
// Espera (en vivo) a que todos los rivales hayan elegido y tú todavía no.
const ESPERAR_RIVALES = () => new Promise((ok) => {
  const t0 = performance.now()
  const mira = () => {
    const v = window.__pvpImitada?.foto().vista
    const s = v?.sorteo
    const listos = s && v.phase === 'SORTEO' && s.etapa === 'eleccion'
      && s.participan.every((j) => j === v.asiento || s.yaEligieron.includes(j)) && !s.yaEligieron.includes(v.asiento)
    if (listos || performance.now() - t0 > 25000) return setTimeout(() => ok(!!listos), 400)
    setTimeout(mira, 100)
  }
  mira()
})

const MEDIR_POSICIONES = () => {
  const { vista } = window.__pvpImitada.foto()
  const n = vista.players.length
  const rot = (j) => (j - vista.asiento + n) % n
  const s = vista.sorteo
  const pantalla = [...document.querySelectorAll('.pvp-sc[data-sorteo-lugar="adelante"]')]
    .map((c) => `${c.dataset.sorteoAsiento}:${c.dataset.sorteoCarta}`).sort()
  const vistaDice = s.yaEligieron.map((j) => `${rot(j)}:${s.elegidas[j]}`).sort()
  const inventada = s.yaEligieron.map((j) => `${rot(j)}:${(rot(j) * 2 + s.ronda) % 5}`).sort()
  return { pantalla, vistaDice, inventada, rivales: s.yaEligieron.filter((j) => j !== vista.asiento).length }
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

async function varaPosiciones(browser, base) {
  const filas = []
  for (const [n, asiento] of MESAS) {
    for (const vp of PANTALLAS) {
      const m = await enPagina(browser, vp, `${base}/?pvp=sorteo-elige&n=${n}&asiento=${asiento}&ver=vivo`, async (p) => {
        const listos = await p.evaluate(ESPERAR_RIVALES)
        return { listos, ...(await p.evaluate(MEDIR_POSICIONES)) }
      }, true)
      filas.push({
        n, vp: id(vp), ...m,
        ok: !m.error && m.listos && m.rivales === n - 1 && igual(m.pantalla, m.vistaDice),
        controlRojo: !m.error && !igual(m.pantalla, m.inventada),
      })
    }
  }
  const control = { caso: 'la posición inventada de antes de la v1.3', rojas: filas.filter((f) => f.controlRojo).length, rojo: filas.some((f) => f.controlRojo) }
  const medida = filas.every((f) => f.ok)
  return { celda: 'v13·sorteo-posiciones', ok: medida && control.rojo, medida, filas, control }
}

// ── 2 · El mensaje con id fijo ──────────────────────────────────────────────
const MEDIR_MENSAJE = async (conEmoji) => {
  const p = window.__pvpImitada
  const { CLAVES_MENSAJE } = await import('/src/config/mensajes.js')
  const { REACCIONES, codepointDe } = await import('/src/config/reacciones.js')
  const lista = p.mensajes.lista()
  if (conEmoji) {
    for (const m of lista) m.clave = codepointDe(REACCIONES[CLAVES_MENSAJE.indexOf(m.clave)])
    p.repintar()   // repinta la mesa (la lámina congelada no tiene reloj que lo haga)
    await new Promise((r) => setTimeout(r, 400))
  }
  const ajenas = [...document.querySelectorAll('.pvp-msj-ajena')]
  return {
    claves: lista.map((m) => m.clave),
    sonIds: lista.length > 0 && lista.every((m) => CLAVES_MENSAJE.includes(m.clave)),
    pintadas: ajenas.map((e) => ({ asiento: e.dataset.msjAsiento, frase: e.getAttribute('aria-label') })),
    esperadas: lista.filter((m) => m.asiento !== 0).map((m) => ({ asiento: String(m.asiento), frase: REACCIONES[CLAVES_MENSAJE.indexOf(m.clave)] ?? null })),
  }
}

async function varaMensaje(browser, base) {
  const vp = [412, 915]
  const filas = []
  const controles = []
  for (const [n, asiento] of MESAS) {
    const url = `${base}/?pvp=turno-ajeno&n=${n}&asiento=${asiento}&msj=uno`
    const m = await enPagina(browser, vp, url, (p) => p.evaluate(MEDIR_MENSAJE, false))
    filas.push({ n, vp: id(vp), ...m, ok: !m.error && m.sonIds && m.pintadas.length === 1 && igual(m.pintadas, m.esperadas) })
    const c = await enPagina(browser, vp, url, (p) => p.evaluate(MEDIR_MENSAJE, true))
    controles.push({ n, ...c, rojo: !c.error && !c.sonIds && c.pintadas.length === 0 })
  }
  const control = { caso: 'las claves reescritas al código del emoji', filas: controles, rojo: controles.every((c) => c.rojo) }
  const medida = filas.every((f) => f.ok)
  return { celda: 'v13·mensaje-id', ok: medida && control.rojo, medida, filas, control }
}

export async function runArbitro13LM(browser, base) {
  const celdas = []
  for (const vara of [varaPosiciones, varaMensaje]) {
    const c = await vara(browser, base)
    celdas.push(c)
    const malas = c.filas.filter((f) => !f.ok).map((f) => `m${f.n} ${f.vp}${f.error ? ` ${f.error}` : ''}`)
    console.log(`pvp·vara ${c.celda} · ${c.ok ? 'OK' : 'FALLA'} · medida ${c.medida}${malas.length ? ` (${malas.join(', ')})` : ''} · control rojo ${c.control.rojo}`)
  }
  return { celdas, verde: celdas.every((c) => c.ok) }
}
