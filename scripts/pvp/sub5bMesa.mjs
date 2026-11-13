// ── MES-PvP 5b · Las varas de la reposición uno a uno, en `diagDSK pvp mesa` ────────────────
// Ficha AJILEI_MES-PvP_Sub5b_v1.0.md §3. Contra 5173 con bypass (`?pvp=reponer&ver=vivo`, el
// árbitro imitado, que ya es el del Contrato v1.4). Cada vara lleva su control rojo: la misma
// medida sobre un caso que tiene que fallar, con `reposicionCore.js` servido cambiado.
//   1 · `5b·uno-a-uno`: en cada cuadro de la reposición, las cartas en el aire son de un solo
//       asiento, y los asientos salen de la Mano al Pie (mesas de 5, 3 y 2; Normal y Rápido;
//       412×915 y 1366×768). Control: el calendario sin avanzar de un asiento al siguiente,
//       que es la reposición en paralelo de antes de la 5b.
//   2 · `5b·tardio`: la vista `reponiendo` llega 1,5 s tarde (`&tarde=1500`). Cuando arranca el
//       reloj de `BET_3` no hay ninguna ranura vacía, y la secuencia ya había acabado: en el
//       último cuadro de la reposición no hay cartas en el aire ni ranuras vacías y habla el
//       último asiento del plan. Control: sin el anclaje (la secuencia arranca al llegar la vista).
import { enPiscina, pagina } from './sub5aMesa.mjs'

const GRABAR = () => {
  const log = []
  window.__rep5b = log
  let previo = ''
  const paso = () => {
    const rep = [...document.querySelectorAll('.action-area.thinking')].some((e) => e.textContent.includes('Reponiendo'))
    const vuelos = [...document.querySelectorAll('.flying-card[data-vuelo]')].map((e) => e.dataset.vuelo).filter((v) => /^d(out|in)-/.test(v))
    const asientos = [...new Set(vuelos.map((v) => Number(v.split('-')[1])))]
    const msg = document.querySelector('.game-message')?.textContent ?? ''
    const timer = [...document.querySelectorAll('.timer-display')].some((e) => e.getClientRects().length > 0)
    const vacias = document.querySelectorAll('.card-empty').length
    const clave = JSON.stringify([rep, asientos, vuelos.length, msg, timer, vacias])
    if (clave !== previo) { previo = clave; log.push({ rep, asientos, fly: vuelos.length, msg, timer, vacias }) }
    if (log.length < 20000) requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
}

// El plan que espera este teléfono, leído de la vista del árbitro imitado: de la Mano al Pie, en
// asientos de la mesa (0 = tú), con el nombre de cada uno.
const PLAN = () => {
  const v = window.__pvpImitada?.foto().vista
  if (v?.vencimiento?.clase !== 'reposicion') return null
  const N = v.players.length
  const orden = Array.from({ length: N }, (_, o) => (v.manoIndex + o) % N).filter((real) => v.descarte.cuantas[real] !== null)
  return orden.map((real) => ({ seat: (real - v.asiento + N) % N, n: v.descarte.cuantas[real], nombre: v.players[real].name }))
}

const EN_PARALELO = /\n\s*t = outEnd \+[^\n]*/
const SIN_ANCLA = /const inicio = Math\.min\(ahora, ancla\)/

async function reposicion(browser, base, { n, ritmo, desc, vp, tarde = null, control = null }) {
  const page = await pagina(browser, vp)
  try {
    if (control) {
      await page.route(/\/src\/lib\/reposicionCore\.js/, async (route) => {
        const r = await route.fetch()
        const cuerpo = await r.text()
        const cambiado = cuerpo.replace(control === 'paralelo' ? EN_PARALELO : SIN_ANCLA, control === 'paralelo' ? '\n' : 'const inicio = ahora')
        if (cambiado === cuerpo) throw new Error(`el control «${control}» no encontró su línea`)
        await route.fulfill({ response: r, body: cambiado })
      })
    }
    await page.addInitScript(GRABAR)
    await page.goto(`${base}/?pvp=reponer&n=${n}&ver=vivo&desc=${desc}&ritmo=${ritmo}${tarde ? `&tarde=${tarde}` : ''}`, { waitUntil: 'domcontentloaded' })
    let plan = null
    let log = []
    const tope = Date.now() + 60000
    while (Date.now() < tope) {
      await page.waitForTimeout(200)
      plan ??= await page.evaluate(PLAN)
      log = await page.evaluate(() => window.__rep5b ?? [])
      const i0 = log.findIndex((x) => x.rep)
      if (i0 >= 0 && log.slice(i0).some((x) => !x.rep && x.timer)) break
    }
    const i0 = log.findIndex((x) => x.rep)
    const iCorte = log.findIndex((x, i) => i > i0 && !x.rep)
    if (!plan || i0 < 0 || iCorte < 0) return { error: `sin reposición completa (plan ${!!plan}, ${log.length} cuadros)` }
    const durante = log.slice(i0, iCorte)
    const secuencia = durante.filter((x) => x.fly > 0).map((x) => x.asientos[0]).filter((s, i, a) => i === 0 || s !== a[i - 1])
    const ultimo = durante.at(-1)
    const turno = log.slice(iCorte).find((x) => x.timer)
    const final = plan.at(-1)
    const vozFinal = final.seat === 0 ? /^(Descartas|No descartas)/.test(ultimo.msg) : ultimo.msg.startsWith(final.nombre.slice(0, 8))
    return {
      cuadros: durante.length,
      maxAsientos: Math.max(0, ...durante.map((x) => x.asientos.length)),
      secuencia: secuencia.join('>'),
      esperada: plan.filter((p) => p.n > 0).map((p) => p.seat).join('>'),
      alCorte: { fly: ultimo.fly, vacias: ultimo.vacias, vozFinal },
      vaciasAlTurno: turno?.vacias ?? null,
    }
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) }
  } finally {
    await page.close()
  }
}

const VERTICAL = [412, 915]
const ESCRITORIO = [1366, 768]

export async function runSub5bMesa(browser, base) {
  const casos = [
    { vara: 'uno', n: 5, ritmo: 'normal', desc: 1, vp: VERTICAL },
    { vara: 'uno', n: 3, ritmo: 'rapido', desc: 3, vp: ESCRITORIO },
    { vara: 'uno', n: 2, ritmo: 'normal', desc: 3, vp: VERTICAL },
    { vara: 'uno', n: 5, ritmo: 'normal', desc: 1, vp: VERTICAL, control: 'paralelo' },
    { vara: 'tarde', n: 3, ritmo: 'normal', desc: 1, vp: VERTICAL, tarde: 1500 },
    { vara: 'tarde', n: 5, ritmo: 'rapido', desc: 3, vp: ESCRITORIO, tarde: 1500 },
    { vara: 'tarde', n: 3, ritmo: 'normal', desc: 1, vp: VERTICAL, tarde: 1500, control: 'sin-ancla' },
  ]
  const todas = await enPiscina(casos.map((c) => async () => ({ ...c, vp: c.vp.join('x'), ...(await reposicion(browser, base, c)) })))
  const unoBien = (f) => !f.error && f.cuadros > 0 && f.maxAsientos === 1 && f.secuencia === f.esperada
  const tardeBien = (f) => !f.error && f.vaciasAlTurno === 0 && f.alCorte.fly === 0 && f.alCorte.vacias === 0 && f.alCorte.vozFinal
  const celda = (nombre, bien, vara, caso) => {
    const filas = todas.filter((f) => f.vara === vara && !f.control).map((f) => ({ ...f, ok: bien(f) }))
    const c = todas.find((f) => f.vara === vara && f.control)
    const medida = filas.every((f) => f.ok)
    const control = { caso, ...c, rojo: !c.error && !bien(c) }
    return { celda: nombre, ok: medida && control.rojo, medida, filas, control }
  }
  const celdas = [
    celda('5b·uno-a-uno', unoBien, 'uno', 'la reposición en paralelo (el calendario sin avanzar de asiento)'),
    celda('5b·tardio', tardeBien, 'tarde', 'sin el anclaje al reloj del árbitro'),
  ]
  for (const c of celdas) {
    const malas = c.filas.filter((f) => !f.ok).map((f) => JSON.stringify(f))
    console.log(`pvp·vara ${c.celda} · ${c.ok ? 'OK' : 'FALLA'} · medida ${c.medida}${malas.length ? ` (${malas.join(', ')})` : ''} · control rojo ${c.control.rojo} · ${JSON.stringify(c.control)}`)
  }
  return { celdas }
}
