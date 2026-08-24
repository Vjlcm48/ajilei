// ── diagCEL0.mjs · Diagnóstico de la pantalla de victoria + prueba del molde ─
// Read-only sobre src/. Uso: `npm run dev` en otra consola, luego
//   node scripts/diagCEL0.mjs
//
// Tres cosas, en una sola corrida:
//   (1) MAPA DE AUDIO — los doce sonidos registrados en Howler, cada uno
//       pedido por HTTP y DECODIFICADO. Que un asset devuelva 200 no dice que
//       suene: un mp3 corrupto también devuelve 200. Decodificarlo da duración
//       real, pico y número de ataques, que es como se distingue "el archivo
//       está" de "el archivo suena".
//   (2) CAJAS de la pantalla de victoria en las tres celdas del encargo.
//   (3) EL MOLDE — las cuatro comprobaciones de que `?cel` lleva a la pantalla
//       en un paso, con su captura.
//
// Las capturas van a `../_cel0/`, FUERA del repositorio: son material de
// trabajo de la lámina, no evidencia sellada, y el árbol ya carga con tres
// carpetas de arnés.
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT  = '../_cel0'
const round = (n) => (n == null ? null : Math.round(n * 100) / 100)

// Los once, tal como los registra src/hooks/useSounds.js. Eran doce hasta
// CEL-A: `win.mp3` sale del registro y del repositorio en esa tanda, y pedirlo
// aqui daria un 404 que no es un hallazgo, es una lista sin actualizar.
const AUDIOS = [
  'card-deal.mp3', 'coin-bet.mp3', 'card-fold.mp3', 'card-shuffle.mp3',
  'timer-warning.mp3', 'showdown.mp3', 'comodin.mp3',
  'button-click.mp3', 'chips-collect.mp3', 'ajilei-strum.mp3', 'table-knock.mp3',
]

// ── (1) Audio · pedir y decodificar ─────────────────────────────────────────
// El análisis es el de `_vc2audio.mjs` (envolvente RMS en ventanas de 10 ms,
// ataques por cruce al alza con refractario de 120 ms, cola de silencio final).
// Se repite aquí en vez de importarlo porque aquel script analiza tres archivos
// elegidos a mano y éste necesita la tabla entera; la aritmética es la misma y
// las cifras de los tres comunes tienen que coincidir — si no coinciden, una de
// las dos sondas miente y eso también es un hallazgo.
async function mapaDeAudio(page) {
  return page.evaluate(async (lista) => {
    const salida = []
    for (const nombre of lista) {
      const fila = { nombre, url: `/sounds/${nombre}` }
      try {
        const r = await fetch(fila.url)
        fila.http = r.status
        fila.bytes = null
        if (!r.ok) { salida.push(fila); continue }
        const buf = await r.arrayBuffer()
        fila.bytes = buf.byteLength
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const audio = await ctx.decodeAudioData(buf.slice(0))
        const ch = audio.getChannelData(0)
        const sr = audio.sampleRate
        const win = Math.round(sr * 0.01)
        const env = []
        for (let i = 0; i + win <= ch.length; i += win) {
          let s = 0
          for (let j = 0; j < win; j++) s += ch[i + j] * ch[i + j]
          env.push(Math.sqrt(s / win))
        }
        const pico = Math.max(...env)
        const umbral = pico * 0.22
        const ataques = []
        let armado = true, ultimo = -1e9
        env.forEach((v, i) => {
          const t = i * 0.01
          if (armado && v >= umbral && t - ultimo > 0.12) { ataques.push(Math.round(t * 1000) / 1000); ultimo = t; armado = false }
          if (v < umbral * 0.5) armado = true
        })
        let fin = env.length - 1
        while (fin > 0 && env[fin] < pico * 0.03) fin--
        fila.decodifica = true
        fila.duracion = Math.round(audio.duration * 1000) / 1000
        fila.utilHasta = Math.round((fin + 1) * 0.01 * 1000) / 1000
        fila.pico = Math.round(pico * 1000) / 1000
        fila.ataques = ataques
        await ctx.close()
      } catch (e) {
        fila.decodifica = false
        fila.error = String(e && e.message ? e.message : e)
      }
      salida.push(fila)
    }
    return salida
  }, AUDIOS)
}

// ── (2) Cajas ───────────────────────────────────────────────────────────────
const CAJAS = [
  '.game-over-screen', '.game-over-msg', '.vc-tarjeta', '.vc-netas',
  '.vc-netas-ico .chip-token', '.vc-netas-num', '.vc-netas-word',
  '.vc-detalle', '.vc-detalle > div', '.vc-detalle dt', '.vc-detalle dd',
  '.game-over-screen .btn-primary',
]
const TOKENS = [
  '--gold-brand', '--gold-brand-rgb', '--text-primary', '--text-secondary',
  '--text-muted', '--lose-red', '--surface-modal',
]

function sondaCajas({ sels, tokens }) {
  void document.body.offsetWidth
  const raiz = getComputedStyle(document.documentElement)
  const out = { tokens: {}, cajas: {} }
  for (const t of tokens) out[ 'tokens' ][t] = raiz.getPropertyValue(t).trim() || null
  for (const s of sels) {
    out.cajas[s] = [...document.querySelectorAll(s)].map(el => {
      const b = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        texto: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        x: b.x, y: b.y, w: b.width, h: b.height,
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color,
      }
    })
  }
  return out
}

// ── Ruta con el molde puesto ────────────────────────────────────────────────
// `?cel` viaja en la URL de entrada; la app es SPA y no navega, así que el
// parámetro sigue ahí cuando GameTable monta y siembra su estado inicial.
async function alaVictoria(page, mesa, semilla = '') {
  await page.goto(`${BASE}/?cel${semilla}`, { waitUntil: 'networkidle' })
  await page.click('button:has-text("Jugar vs IA")')
  await page.waitForSelector('.nivel-grid button')
  await page.click('.nivel-grid button:nth-of-type(1)')
  await page.waitForSelector('.mode-select-card')
  await page.click(`button:has-text("Mesa de ${mesa} jugadores")`)
  await page.waitForSelector('.mode-stake-btn')
  await page.click('.mode-stake-grid button:nth-of-type(1)')
  await page.waitForSelector('.game-table')
  // EL PASO. Uno.
  await page.click('button:has-text("Iniciar mano")')
  await page.waitForSelector('.game-over-screen', { timeout: 15000 })
  await page.evaluate(() => Promise.all(
    document.getAnimations()
      .filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
      .map(a => a.finished.catch(() => {}))
  ))
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
}

// ── Corrida ─────────────────────────────────────────────────────────────────
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const informe = { tanda: 'CEL-0', chromium: browser.version(), audio: null, celdas: {}, molde: [] }
const errores = []

// (1) Audio — una sola pestaña, sin mesa: no depende de la pantalla.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  informe.audio = await mapaDeAudio(page)
  await ctx.close()
}

// (2)+(3) Cajas y molde. Las tres celdas del diagnóstico son mesa 5; las cuatro
// comprobaciones del molde son mesa 5 y mesa 2 a 1920×1080 y 360×640.
const CELDAS = [
  { id: 'mesa5-1920x1080', w: 1920, h: 1080, mesa: 5, mide: true,  molde: true },
  { id: 'mesa5-360x640',   w: 360,  h: 640,  mesa: 5, mide: true,  molde: true },
  { id: 'mesa5-640x360',   w: 640,  h: 360,  mesa: 5, mide: true,  molde: false },
  { id: 'mesa2-1920x1080', w: 1920, h: 1080, mesa: 2, mide: false, molde: true },
  { id: 'mesa2-360x640',   w: 360,  h: 640,  mesa: 2, mide: false, molde: true },
]

// CONTROL NEGATIVO. Un molde que siembra siempre no es un molde, es una avería:
// sin `?cel` en la URL la mesa tiene que arrancar como cualquier otra —rivales
// con su saldo íntegro y ninguna pantalla terminal— o `siembraCEL` habría
// dejado de ser la identidad y estaría contaminando el juego de verdad.
async function controlNegativo(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  const r = { termina: null, saldoRival: null, error: null }
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' })   // SIN ?cel
    await page.click('button:has-text("Jugar vs IA")')
    await page.waitForSelector('.nivel-grid button')
    await page.click('.nivel-grid button:nth-of-type(1)')
    await page.waitForSelector('.mode-select-card')
    await page.click('button:has-text("Mesa de 5 jugadores")')
    await page.waitForSelector('.mode-stake-btn')
    await page.click('.mode-stake-grid button:nth-of-type(1)')
    await page.waitForSelector('.game-table')
    await page.click('button:has-text("Iniciar mano")')
    await page.waitForTimeout(3500)   // ante + barajado + reparto
    r.termina = await page.locator('.game-over-screen').count() > 0
    r.saldoRival = await page.evaluate(() => {
      const el = document.querySelector('.opp-corner-chip .chip-balance-float, .opp-chips, .ai-chips')
      return el ? el.textContent.trim() : null
    })
    // El saldo del humano tras pagar UN ante: la prueba de que la mesa vive.
    r.saldoHumano = await page.evaluate(() => document.querySelector('.pbr-chips')?.textContent?.trim() ?? null)
  } catch (e) { r.error = e.message }
  await ctx.close()
  return r
}

for (const c of CELDAS) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => errores.push(`${c.id}: ${e}`))
  try {
    await alaVictoria(page, c.mesa)
    const titulo = await page.evaluate(() => document.querySelector('.game-over-msg')?.textContent?.trim() ?? null)
    const tarjeta = await page.locator('.vc-tarjeta').count()
    const saldo = await page.evaluate(() => document.querySelector('.vc-netas-num')?.textContent?.trim() ?? null)
    if (c.mide) informe.celdas[c.id] = await page.evaluate(sondaCajas, { sels: CAJAS, tokens: TOKENS })
    if (c.molde) informe.molde.push({ celda: c.id, mesa: c.mesa, titulo, tarjeta, saldo })
    await page.screenshot({ path: `${OUT}/${c.id}.png` })
  } catch (e) { errores.push(`${c.id}: ${e.message}`) }
  await ctx.close()
}

informe.control = await controlNegativo(browser)
await browser.close()

informe.errores = errores
writeFileSync(`${OUT}/cel0.json`, JSON.stringify(informe, null, 2))

// ── Salida ──────────────────────────────────────────────────────────────────
console.log('── (1) MAPA DE AUDIO ──')
for (const a of informe.audio) {
  const ok = a.http === 200 && a.decodifica
  console.log(`${ok ? 'OK ' : 'MAL'} ${a.nombre.padEnd(20)} http ${a.http} · ${a.bytes ?? '—'} B · ${a.decodifica ? `${a.duracion}s (útil ${a.utilHasta}s) · pico ${a.pico} · ${a.ataques.length} ataque(s)` : `NO DECODIFICA: ${a.error}`}`)
}

console.log('\n── (2) CAJAS de la pantalla de victoria ──')
for (const [celda, d] of Object.entries(informe.celdas)) {
  console.log(`\n· ${celda}`)
  for (const [sel, arr] of Object.entries(d.cajas)) {
    if (!arr.length) { console.log(`    ${sel.padEnd(30)} — no monta`); continue }
    arr.forEach((r, i) => console.log(`    ${(sel + (arr.length > 1 ? `[${i}]` : '')).padEnd(30)} ${round(r.w)}×${round(r.h)} @ ${round(r.x)},${round(r.y)} · ${r.fontSize}/${r.fontWeight} ${r.color}${r.texto ? ` · "${r.texto}"` : ''}`))
  }
}
const tk = Object.values(informe.celdas)[0]?.tokens
if (tk) { console.log('\n  tokens:'); for (const [k, v] of Object.entries(tk)) console.log(`    ${k.padEnd(20)} ${v}`) }

console.log('\n── (3) EL MOLDE · un paso hasta la victoria ──')
let verdes = 0
for (const m of informe.molde) {
  const ok = m.titulo === '¡Ganaste la mesa! Eres el último con Heptacoins.' && m.tarjeta === 1
  if (ok) verdes++
  console.log(`${ok ? 'VERDE' : ' MAL '} ${m.celda.padEnd(18)} mesa ${m.mesa} · tarjeta ${m.tarjeta} · saldo ${m.saldo} · "${m.titulo}"`)
}
const ctrl = informe.control
const ctrlOk = ctrl.termina === false && !ctrl.error
console.log(`${ctrlOk ? 'VERDE' : ' MAL '} control-negativo   sin ?cel · ¿termina la mesa? ${ctrl.termina} · saldo rival ${JSON.stringify(ctrl.saldoRival)} · saldo humano ${JSON.stringify(ctrl.saldoHumano)}${ctrl.error ? ` · ${ctrl.error}` : ''}`)

console.log(`\ncomprobaciones verdes: ${verdes}/${informe.molde.length} · control negativo: ${ctrlOk ? 'verde' : 'ROJO'} · errores de página: ${errores.length ? errores.join(' | ') : 'ninguno'}`)
console.log(`capturas y cifras en ${OUT}/`)
