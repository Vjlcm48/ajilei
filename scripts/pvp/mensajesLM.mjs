// ── MES-PvP L-M 2 · §2–§4 · Los mensajes de la mesa, la mesa de 5 y la ausencia, como celdas ──
// Ficha AJILEI_MES-PvP_LM-2_v1.0.md §2.3, §3, §4 y §6. Contra 5173 con bypass (`?pvp=`).
//   msj · `&msj=todos` (los rivales y tú con burbuja a la vez, las frases más largas), mesas 2 y
//         5, en las cinco pantallas y en tres momentos (cartas en la mano con botones, el sorteo,
//         el pago con capas): ninguna burbuja tapa cartas propias ni botones de acción, dos no se
//         pisan, y la maqueta (óvalo, barra propia, recuadros) no se mueve respecto a la misma
//         escena sin mensajes (Δ = 0, O1). Control rojo: una burbuja puesta a mano encima de otra.
//   aus · el aviso de ausencia (la línea de la crónica, elegida por Victor) en las cinco pantallas,
//         mesa de 5 con nombres largos: la tinta no sale del óvalo y el óvalo no cambia. Control
//         rojo: la misma medida con 60 «W» en la línea.
// Además, sin veredicto, las capturas de la lámina: `capturas-dsk/lm2_<escena>_m<n>_<pantalla>.png`.
import { mkdirSync } from 'node:fs'

const PANTALLAS = [[1920, 1080], [412, 915], [915, 412], [390, 844], [360, 640]]
const id = ([w, h]) => `${w}x${h}`
const OUT = 'capturas-dsk'
const MOMENTOS = [['turno-propio', 'mano'], ['sorteo-elige', 'sorteo'], ['pago-capas', 'pago']]
const TOL = 0.5

async function enPagina(browser, [w, h], url, alListo) {
  for (let intento = 0; intento < 2; intento++) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, ...(w < 1024 ? { hasTouch: true, isMobile: true } : {}) })
    const errores = []
    page.on('pageerror', (e) => errores.push(String(e.message).slice(0, 120)))
    try {
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-clavada], .game-over-screen', { timeout: 15000 })
      await page.mouse.move(2, 2)
      await page.waitForTimeout(1300)
      return { ...(await alListo(page)), errores }
    } catch (e) {
      if (intento === 1) return { error: String(e?.message || e).slice(0, 160), errores }
    } finally {
      await page.close()
    }
  }
  return { error: 'sin intentos' }
}

const MEDIR = () => {
  const R = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height } }
  const corte = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    return w > 0.5 && h > 0.5 ? Math.round(w * h) : 0
  }
  const burbujas = [...document.querySelectorAll('.u2-burbuja')].filter((e) => getComputedStyle(e).visibility !== 'hidden')
    .map((e) => ({ k: e.dataset.msjAsiento ?? '0', r: R(e) }))
  const cartas = [...document.querySelectorAll('.player-zone .card-slot-wrapper')].map(R)
  const botones = [...document.querySelectorAll('.action-area button, .player-zone button')].filter((b) => b.offsetWidth > 0).map(R)
  const pisadas = []
  burbujas.forEach((a, i) => burbujas.slice(i + 1).forEach((b) => { const c = corte(a.r, b.r); if (c) pisadas.push(`${a.k}/${b.k}:${c}`) }))
  const anclas = {}
  for (const sel of ['.center-zone', '.player-bar', '.pot-box']) { const el = document.querySelector(sel); if (el) anclas[sel] = R(el) }
  document.querySelectorAll('.opp-panel, .ai-zone').forEach((el, k) => { anclas[`rival${k}`] = R(el) })
  // Una ajena sin recuadro (el rival quebró y su panel se fue) no se pinta: no cuenta.
  const sinRecuadro = [...document.querySelectorAll('.pvp-msj-ajena:not(.es-en-ovalo)')]
    .filter((e) => !document.querySelector(`[data-coin-target="${e.dataset.msjAsiento}"]`)?.closest('.opp-panel, .ai-zone')?.offsetWidth).length
  return {
    n: burbujas.length,
    sinRecuadro,
    cartas: burbujas.flatMap((b) => cartas.map((c) => corte(b.r, c))).reduce((s, x) => s + x, 0),
    botones: burbujas.flatMap((b) => botones.map((c) => corte(b.r, c))).reduce((s, x) => s + x, 0),
    pisadas,
    fuera: burbujas.filter((b) => b.r.left < -0.5 || b.r.top < -0.5 || b.r.right > innerWidth + 0.5 || b.r.bottom > innerHeight + 0.5).map((b) => b.k),
    anclas,
  }
}
const movidas = (a, b) => Object.keys(a).filter((k) => !b[k] || ['left', 'top', 'w', 'h'].some((p) => Math.abs(a[k][p] - b[k][p]) > TOL))

async function celdaMsj(browser, base, vp, n, [escena, momento]) {
  const asiento = n === 5 ? 1 : 0
  const ruta = `${base}/?pvp=${escena}&n=${n}&asiento=${asiento}`
  const sin = await enPagina(browser, vp, ruta, (p) => p.evaluate(MEDIR))
  const shot = `${OUT}/lm2_msj-${momento}_m${n}_${id(vp)}.png`
  const con = await enPagina(browser, vp, `${ruta}&msj=todos`, async (p) => { await p.screenshot({ path: shot }); return p.evaluate(MEDIR) })
  const mov = sin.anclas && con.anclas ? movidas(sin.anclas, con.anclas) : ['sin medida']
  const ok = !con.error && !sin.error && con.n + con.sinRecuadro === n && con.cartas === 0 && con.botones === 0 && !con.pisadas.length && !con.fuera.length && !mov.length && !con.errores.length
  return { celda: `lm·msj ${momento} m${n} ${id(vp)}`, ok, burbujas: con.n, sinRecuadro: con.sinRecuadro, cartas: con.cartas, botones: con.botones, pisadas: con.pisadas, fuera: con.fuera, movidas: mov, shot, error: con.error ?? sin.error }
}

// Control rojo de `msj`: la misma medida con la burbuja de un rival puesta encima de la propia.
async function controlMsj(browser, base) {
  const r = await enPagina(browser, [412, 915], `${base}/?pvp=turno-propio&n=5&asiento=1&msj=todos`, async (p) => {
    await p.evaluate(() => {
      const [a, b] = document.querySelectorAll('.u2-burbuja')
      b.style.left = a.style.left
      b.style.top = a.style.top
      b.dataset.msjAsiento = 'x'
    })
    return p.evaluate(MEDIR)
  })
  return { celda: 'lm·msj control (una encima de otra)', rojo: (r.pisadas?.length ?? 0) > 0, pisadas: r.pisadas }
}

// El aviso de ausencia: en la crónica, dentro del óvalo y sin moverlo. La base es la
// misma página con la frase cambiada por «x» (trampa de L-M 1: el óvalo de otra escena es otro).
async function celdaAusencia(browser, base, vp) {
  const r = await enPagina(browser, vp, `${base}/?pvp=ausente-yo&n=5&asiento=1&nombres=largo`, async (p) => {
    await p.screenshot({ path: `${OUT}/lm2_ausente-yo_m5_${id(vp)}.png` })
    const medir = () => p.evaluate(() => {
      const msg = document.querySelector('.game-message')
      const ov = document.querySelector('.center-zone').getBoundingClientRect()
      const rg = document.createRange(); rg.selectNodeContents(msg)
      const t = rg.getBoundingClientRect()
      return { texto: msg.textContent.trim(), ov: [ov.left, ov.top, ov.width, ov.height], sale: Math.max(0, ov.left - t.left, t.right - ov.right, ov.top - t.top, t.bottom - ov.bottom),
        lineas: new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size }
    })
    const con = await medir()
    const poner = (txt) => p.evaluate((x) => { document.querySelector('.game-message').textContent = x }, txt)
    await poner('x')
    const sin = await medir()
    await poner('W'.repeat(60))
    const ctl = await medir()
    const crece = (a) => Math.max(...a.ov.map((v, i) => Math.abs(v - sin.ov[i])))
    return { ...con, crece: crece(con), controlRojo: ctl.sale > TOL || crece(ctl) > TOL }
  })
  const ok = !r.error && r.texto === '1 turno más y saldrás de la mesa' && r.sale <= TOL && r.crece <= TOL && r.controlRojo
  return { celda: `lm·ausente m5 ${id(vp)}`, ok, texto: r.texto, sale: r.sale, crece: r.crece, lineas: r.lineas, controlRojo: r.controlRojo, error: r.error }
}

// Las capturas de la lámina que no salen de las celdas (sin veredicto).
const CAPTURAS = [
  ['msj-llega', 'turno-ajeno', [2, 5], '&msj=uno'],
  ['msj-anuncio', 'anuncio-yo', [2, 5], '&msj=uno'],
  ['freno', 'turno-ajeno', [2, 5], '&msj=propio', 'menu'],
  ['sorteo-desempate', 'sorteo-desempate', [5], '&nombres=largo'],
  ['mano-reparto', 'mano-reparto', [5], '&nombres=largo'],
  ['ultima-accion', 'ultima-accion', [5], '&nombres=largo'],
  ['allin-rival', 'allin-rival', [5], '&nombres=largo'],
  ['descarte-espera', 'descarte-espera', [5], '&nombres=largo'],
  ['reposicion', 'reposicion', [5], '&nombres=largo'],
  ['pago-capas', 'pago-capas', [5], '&nombres=largo'],
  ['ausente', 'ausente', [2, 5], '&nombres=largo'],
  ['ausente-yo', 'ausente-yo', [2], ''],
  ['ausencia-tercero', 'ausencia-tercero', [5], '&nombres=largo'],
]
async function capturas(browser, base) {
  const tareas = []
  for (const [nombre, escena, mesas, extra, abrir] of CAPTURAS) {
    for (const n of mesas) {
      for (const vp of PANTALLAS) {
        tareas.push(() => enPagina(browser, vp, `${base}/?pvp=${escena}&n=${n}&asiento=${n === 5 ? 1 : 0}${extra}`, async (p) => {
          if (abrir) {
            await p.click('.utilities-trigger')
            await p.waitForTimeout(250)
          }
          await p.screenshot({ path: `${OUT}/lm2_${nombre}_m${n}_${id(vp)}.png` })
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

export async function runMensajesLM(browser, base, { conCapturas = true, solo = null } = {}) {
  mkdirSync(OUT, { recursive: true })
  if (solo === 'aus') return { celdas: await enPiscina(PANTALLAS.map((vp) => () => celdaAusencia(browser, base, vp))) }
  const tareas = []
  for (const vp of PANTALLAS) for (const n of [2, 5]) for (const m of MOMENTOS) tareas.push(() => celdaMsj(browser, base, vp, n, m))
  const msj = await enPiscina(tareas)
  const control = await controlMsj(browser, base)
  // Una celda de `msj` es verde si su medida pasa y el control sale rojo.
  for (const c of msj) c.ok = c.ok && control.rojo
  const aus = await enPiscina(PANTALLAS.map((vp) => () => celdaAusencia(browser, base, vp)))
  const fallosCaptura = conCapturas ? await capturas(browser, base) : 0
  const celdas = [...msj, ...aus]
  return { celdas, control, fallosCaptura, verde: celdas.every((c) => c.ok) }
}
