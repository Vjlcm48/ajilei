// ── MES-PvP 7a · La vara del segundo reparto entre personas, en `diagDSK pvp mesa` ─────────────
// Ficha AJILEI_MES-PvP_Sub7a_v1.0.md §2. Contra 5173 con bypass (`?pvp=reponer&ver=vivo`, el
// árbitro imitado jugando manos seguidas). Se mide el `DEAL_3` de la segunda mano, el primero que
// llega después de un `DEAL_2` en vivo en la misma mesa, que es donde fallaba: el paso del reparto
// se quedaba en `2·n` (`GameTable.jsx`, `if (partida) return`) y `DEAL_3` no tiene barajado que lo
// tape. En la mesa de 2 y en la de 3 con un retirado (`retira=1`), en Normal y en Rápido:
//   · los vuelos `fly-DEAL_3-*` no se solapan nunca (como mucho uno en el aire en cada cuadro);
//   · salen en el orden de `buildDealSeq`: los pasos 0, 1, …, 3·vivos − 1, cada uno una vez;
//   · el primer estado de `DEAL_3` no enseña ninguna carta nueva: tiene las mismas ranuras vacías que
//     el último de `BET_1`, donde cada asiento tiene 2 cartas.
// Se muestrea en cada cuadro (`requestAnimationFrame`) Y en cada cambio del DOM (`MutationObserver`):
// el render viejo de `DEAL_3` a veces se corrige antes de pintarse (en el Chromium del arnés dura
// 5-10 ms), y solo por cuadros el control salía rojo unas veces y otras no. Por mutaciones se ve
// siempre; en un teléfono lento ese render sí llega a la pantalla.
// Control rojo: `GameTable.jsx` servido sin la línea de la 7a (`setDealStep(0)` al salir del
// reparto), que es el cliente que está hoy en ajilei.io. Se corre en las dos mesas en Normal, y el
// informe dice qué síntoma sale (cartas de golpe, vuelos solapados o fuera de orden).
import { enPiscina, pagina } from './sub5aMesa.mjs'

const GRABAR = () => {
  const log = []
  window.__rep7a = log
  let previo = ''
  const muestra = () => {
    const rep = [...document.querySelectorAll('.action-area.thinking')].some((e) => e.textContent.includes('Repartiendo'))
    const vuelos = [...document.querySelectorAll('.flying-card[data-vuelo]')].map((e) => e.dataset.vuelo)
    const d2 = vuelos.filter((v) => v.startsWith('fly-DEAL_2-')).length
    const d3 = vuelos.filter((v) => v.startsWith('fly-DEAL_3-')).map((v) => Number(v.slice('fly-DEAL_3-'.length)))
    const vacias = document.querySelectorAll('.card-empty').length
    const v = window.__pvpImitada?.foto().vista
    const vivos = v?.phase === 'DEAL_3' ? v.players.filter((p) => !p.folded).length : null
    const clave = JSON.stringify([rep, d2, d3, vacias, vivos])
    if (clave !== previo) { previo = clave; log.push({ rep, d2, d3, vacias, vivos, t: performance.now() }) }
  }
  const cuadro = () => { muestra(); if (log.length < 20000) requestAnimationFrame(cuadro) }
  requestAnimationFrame(cuadro)
  const observa = () => new MutationObserver(() => { if (log.length < 20000) muestra() })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-vuelo'] })
  if (document.body) observa()
  else document.addEventListener('DOMContentLoaded', observa)
}

// El control: el `GameTable.jsx` de antes de la 7a. Vite lo sirve sin compilar el efecto, así que
// la línea se ve tal cual.
const CON_LA_LINEA = /(if \(!isDealPhase\) \{\s*setFlyingCards\(\[\]\);)\s*setDealStep\(0\);/

// Los tramos del registro: el primer `DEAL_2` en vivo, su `BET_1` y el `DEAL_3` que le sigue.
function tramos(log) {
  const iD2 = log.findIndex((x) => x.d2 > 0)
  const iB1 = iD2 < 0 ? -1 : log.findIndex((x, i) => i > iD2 && !x.rep)
  const iD3 = iB1 < 0 ? -1 : log.findIndex((x, i) => i > iB1 && x.rep)
  const iFin = iD3 < 0 ? -1 : log.findIndex((x, i) => i > iD3 && !x.rep)
  return { iD2, iB1, iD3, iFin }
}

async function segundoReparto(browser, base, { n, ritmo, retira = null, vp, control = false }) {
  const page = await pagina(browser, vp)
  try {
    if (control) {
      await page.route(/\/src\/components\/GameTable\.jsx/, async (route) => {
        const r = await route.fetch()
        const cuerpo = await r.text()
        const cambiado = cuerpo.replace(CON_LA_LINEA, '$1')
        if (cambiado === cuerpo) throw new Error('el control no encontró la línea de la 7a')
        await route.fulfill({ response: r, body: cambiado })
      })
    }
    await page.addInitScript(GRABAR)
    await page.goto(`${base}/?pvp=reponer&n=${n}&ver=vivo&ritmo=${ritmo}${retira !== null ? `&retira=${retira}` : ''}`, { waitUntil: 'domcontentloaded' })
    let log = []
    const tope = Date.now() + 120000
    while (Date.now() < tope) {
      await page.waitForTimeout(250)
      log = await page.evaluate(() => window.__rep7a ?? [])
      if (tramos(log).iFin >= 0) break
    }
    const { iD3, iFin } = tramos(log)
    if (iD3 < 0 || iFin < 0) return { error: `sin segundo reparto completo (${log.length} cuadros)` }
    const durante = log.slice(iD3, iFin)
    const vivos = durante.find((x) => x.vivos !== null)?.vivos ?? null
    // Cada paso, la primera vez que aparece en el aire, en el orden en que aparecen.
    const pasos = []
    for (const x of durante) for (const p of x.d3) if (!pasos.includes(p)) pasos.push(p)
    return {
      cuadros: durante.length,
      vivos,
      maxEnElAire: Math.max(0, ...durante.map((x) => x.d3.length)),
      pasos: pasos.join(','),
      esperados: vivos === null ? '?' : Array.from({ length: 3 * vivos }, (_x, i) => i).join(','),
      // Cartas que el primer cuadro de DEAL_3 enseña de más frente al último de BET_1, y cuánto
      // siguen a la vista (informativo: el control dice así qué síntoma sale).
      deGolpe: log[iD3 - 1].vacias - log[iD3].vacias,
      msDeGolpe: Math.round((durante.find((x) => x.vacias >= log[iD3 - 1].vacias)?.t ?? log[iD3].t) - log[iD3].t),
    }
  } catch (e) {
    return { error: String(e?.message || e).slice(0, 160) }
  } finally {
    await page.close()
  }
}

const VERTICAL = [412, 915]
const ESCRITORIO = [1366, 768]

export async function runSub7aMesa(browser, base) {
  const casos = [
    { n: 2, ritmo: 'normal', vp: VERTICAL },
    { n: 2, ritmo: 'rapido', vp: ESCRITORIO },
    { n: 3, ritmo: 'normal', retira: 1, vp: ESCRITORIO },
    { n: 3, ritmo: 'rapido', retira: 1, vp: VERTICAL },
    { n: 2, ritmo: 'normal', vp: VERTICAL, control: true },
    { n: 3, ritmo: 'normal', retira: 1, vp: ESCRITORIO, control: true },
  ]
  const todas = await enPiscina(casos.map((c) => async () => ({ ...c, vp: c.vp.join('x'), ...(await segundoReparto(browser, base, c)) })))
  const bien = (f) => !f.error && f.cuadros > 0 && f.maxEnElAire === 1 && f.pasos === f.esperados && f.deGolpe === 0
  const filas = todas.filter((f) => !f.control).map((f) => ({ ...f, ok: bien(f) }))
  const controles = todas.filter((f) => f.control).map((f) => ({ caso: 'sin la línea de la 7a (el cliente de hoy en ajilei.io)', ...f, rojo: !f.error && !bien(f) }))
  const medida = filas.every((f) => f.ok)
  const celda = { celda: '7a·segundo-reparto', ok: medida && controles.every((c) => c.rojo), medida, filas, control: controles }
  const malas = filas.filter((f) => !f.ok).map((f) => JSON.stringify(f))
  console.log(`pvp·vara ${celda.celda} · ${celda.ok ? 'OK' : 'FALLA'} · medida ${medida}${malas.length ? ` (${malas.join(', ')})` : ''} · controles rojos ${controles.map((c) => c.rojo).join('/')} · ${JSON.stringify(controles)}`)
  return { celdas: [celda] }
}
