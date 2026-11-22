// ── TUT-1 tanda 2 · `diagDSK tut guiada` · la partida guiada, jugada entera ──────────
// Ficha: AJILEI_TUT-1_T2_v1.0.md §1.6. Contra 5173 con bypass: el lobby real, «Cómo se
// juega» y la guiada de verdad (`screens/Guiada.jsx`), tocando en cada paso el control
// único con el dedo (en móvil) o el ratón, por el hueco de la capa.
//
// En 360×640, 640×360 y 1920×1080:
//   · tut.guiada  llega al cierre («¡Ya sabes jugar!») habiendo visto la celebración de
//                 AJILEI, y `ajilei.guia` queda con `hecha`; en cada paso el toque del
//                 control único avanza el paso;
//   · tut.red     durante la guiada NADIE llama a `sentarse_ia`, `informar_pila`,
//                 `recargar_ia`, `salir_ia`, `mi_consulta`, `consultar_mano` ni
//                 `mini_perfil` (ni al banco imitado ni a la red; el latido y la
//                 constancia son de la app y quedan fuera), y la píldora del lobby dice lo
//                 mismo antes y después (INV-47, su excepción escrita);
//   · tut.salir   «Salir» está en cada paso y entre pasos, arriba a la derecha, vinotinto
//                 (#7c1d30) con borde de oro, sin pisar el rótulo ni la barra (v1.3 §1.1);
//   · tut.delta   Δ 0 de todas las cajas de `#root` con la capa y sin ella, en cada paso de
//                 lectura (la capa pinta encima y nunca empuja, INV-89);
//   · tut.lineas  ningún rótulo de la guiada pasa de dos líneas;
//   · tut.mazo    (solo 360×640) «Salir» en el paso 1 y después una mesa real de 3 contra
//                 las IAS: tus dos cartas NO son las del guion (R-2, a nivel de instrumento;
//                 la prueba de `mazoDado` lo cubre a nivel de módulo);
//   · tut.consola sin errores de página.
// Va aparte de `diagDSK tut` (la capa sobre la mesa quieta, en `commit`): la guiada entera
// pasa del minuto y corre en `completo`.
import process from 'node:process'
const T = {
  T1: { w: 360, h: 640, movil: true },
  T3: { w: 640, h: 360, movil: true },
  T6: { w: 1920, h: 1080, movil: false },
}
const PROHIBIDAS = ['sentarse_ia', 'informar_pila', 'recargar_ia', 'salir_ia', 'mi_consulta', 'consultar_mano', 'mini_perfil']
const PAUSA = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}'
const TOPE_PASOS = 60
const ESPERA_PASO_MS = 30000

// ── En la página ────────────────────────────────────────────────────────────
const CAJAS = () => [...document.querySelectorAll('#root *')].map((e) => {
  const r = e.getBoundingClientRect()
  return [r.left, r.top, r.width, r.height]
})

const ESPIA = (prohibidas) => {
  window.__guia = { llamadas: [], ajilei: false }
  const b = window.__ajileiBancoImitado?.banco
  if (b) {
    for (const m of ['rpc', 'llamar']) {
      const f = b[m].bind(b)
      b[m] = (nombre, params) => { window.__guia.llamadas.push(nombre); return f(nombre, params) }
    }
  }
  const mira = () => { if (document.querySelector('.vc-ajilei')) window.__guia.ajilei = true }
  new MutationObserver(mira).observe(document.body, { childList: true, subtree: true })
  window.__guia.prohibidas = prohibidas
}

const ESTADO = () => {
  if (document.querySelector('[data-guia-cierre]')) return 'cierre'
  if (document.querySelector('.tut-capa[data-listo]')) return 'capa'
  return null
}

const LEE_PASO = () => {
  const capa = document.querySelector('.tut-capa')
  const rot = capa?.querySelector('.tut-rotulo:not(.tut-rotulo--medida)')
  const p = rot?.querySelector('.tut-rotulo-texto')
  const alto = p?.getBoundingClientRect().height ?? 0
  const linea = p ? parseFloat(getComputedStyle(p).lineHeight) : 1
  const activos = [...document.querySelectorAll('[data-tut-activo]')]
  const boton = activos.find((e) => e.matches('[data-accion]')) ?? null
  // Un paso de SELECCIÓN (v1.1): sólo cartas encendidas, y se tocan todas, una vez cada una.
  const cartas = boton ? [] : activos.filter((e) => e.matches('[data-ancla="carta"]'))
  const siguiente = capa?.querySelector('[data-accion="tut-siguiente"]')
  const salir = capa?.querySelector('[data-accion="tut-salir"]')
  // «Salir» en su sitio: arriba a la derecha, vinotinto, sin pisar el rótulo ni la barra.
  let salirMal = salir ? null : 'no está'
  if (salir) {
    const r = salir.getBoundingClientRect()
    const cs = getComputedStyle(salir)
    const pisa = (o) => o && (() => { const q = o.getBoundingClientRect(); return q.width > 0 && r.left < q.right && q.left < r.right && r.top < q.bottom && q.top < r.bottom })()
    if (r.top > 24 || r.right < window.innerWidth - 24) salirMal = `fuera de la esquina (${Math.round(r.left)},${Math.round(r.top)})`
    else if (cs.backgroundColor !== 'rgb(124, 29, 48)') salirMal = `relleno ${cs.backgroundColor}`
    else if (cs.opacity !== '1') salirMal = `apagado (opacidad ${cs.opacity})`
    else if (pisa(rot)) salirMal = 'pisa el rótulo'
    else if (pisa(capa.querySelector('.tut-barra'))) salirMal = 'pisa la barra'
  }
  return {
    texto: p?.textContent ?? '',
    lineas: p ? Math.max(1, Math.round(alto / linea)) : 0,
    modo: capa?.dataset.modo,
    lectura: !!siguiente,
    salirMal,
    selectores: siguiente ? ['.tut-capa [data-accion="tut-siguiente"]']
      : boton ? [`[data-tut-activo][data-accion="${boton.dataset.accion}"]`]
        : cartas.map((c) => `[data-tut-activo][data-ancla="carta"][data-i="${c.dataset.i}"]`),
    que: siguiente ? 'tut-siguiente' : boton ? (boton.dataset.k ? `×${boton.dataset.k}` : boton.dataset.accion)
      : cartas.length ? `carta ${cartas.map((c) => c.dataset.i).join(' y ')}` : null,
  }
}

// El centro del control y si el dedo, ahí, cae en él (no en una banda del velo ni en la barra).
const APUNTA = (sel) => {
  const e = document.querySelector(sel)
  if (!e) return null
  const r = e.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const encima = document.elementFromPoint(x, y)
  const libre = !!encima && (encima === e || e.contains(encima))
  return { x, y, libre, encima: encima ? `${encima.tagName.toLowerCase()}.${[...encima.classList].join('.')}` : null }
}

const SALDO = () => {
  const p = document.querySelector('.lob-pildora')
  return p && p.dataset.saldo === 'listo' ? p.textContent.trim() : null
}

// Las dos cartas del humano en la primera mano del guion, con el nombre que pinta la carta.
const CARTAS_DEL_GUION = async () => {
  const [{ ORDENES }, { createDeck }] = await Promise.all([import('/src/lib/guiaManos.js'), import('/src/engine/deck.js')])
  const por = Object.fromEntries(createDeck().map((c) => [c.id, `${c.name} de ${c.palo}`]))
  return [ORDENES[0][0], ORDENES[0][3]].map((id) => por[id]).sort()
}
const CARTAS_PROPIAS = () => [0, 1].map((i) => document.querySelector(`[data-ancla="carta"][data-i="${i}"] img[alt]`)?.alt ?? null)

function delta(a, b) {
  if (a.length !== b.length) return { max: Infinity, quien: `cajas ${a.length} → ${b.length}` }
  let max = 0
  let quien = null
  a.forEach((c, i) => c.forEach((v, k) => { const d = Math.abs(v - b[i][k]); if (d > max) { max = d; quien = i } }))
  return { max: +max.toFixed(2), quien }
}

async function celda(page, base, tam, vp, progreso) {
  const out = { tam, puertas: {}, fallos: [], pasos: [], notas: [] }
  progreso.out = out
  const falla = (puerta, texto) => { out.fallos.push(`${tam} ${puerta}: ${texto}`); out.puertas[puerta] = false }
  const pasa = (puerta) => { if (!(puerta in out.puertas)) out.puertas[puerta] = true }
  const errores = []
  const red = []
  page.on('pageerror', (e) => errores.push(String(e?.message || e)))
  const tocar = async (p) => (vp.movil ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y))
  const tocarSel = async (sel) => {
    const p = await page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null }, sel)
    if (!p) throw new Error(`no está «${sel}»`)
    await tocar(p)
  }
  const saldo = async () => (await page.waitForFunction(SALDO, null, { timeout: 15000 })).jsonValue()

  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('main.lobby [data-accion="reglas"]', { timeout: 20000 })
  await page.evaluate(ESPIA, PROHIBIDAS)
  const antes = await saldo()
  page.on('request', (r) => red.push(r.url()))
  await tocarSel('[data-accion="reglas"]')

  // ── La guiada, paso a paso ──
  let fin = false
  let sinSalir = 0
  for (let n = 0; n < TOPE_PASOS && !fin; n++) {
    const h = await page.waitForFunction(ESTADO, null, { timeout: ESPERA_PASO_MS })
    if ((await h.jsonValue()) === 'cierre') { fin = true; break }
    const paso = await page.evaluate(LEE_PASO)
    out.pasos.push({ texto: paso.texto, lineas: paso.lineas, modo: paso.modo, que: paso.que })
    if (process.env.TUT_FOTO && tam === 'T1') await page.screenshot({ path: `${process.env.TUT_FOTO}/paso-${String(n).padStart(2, '0')}.png` }).catch(() => {})
    if (paso.salirMal) { sinSalir++; falla('tut.salir', `«${paso.texto}»: «Salir» ${paso.salirMal}`) }
    if (paso.lineas > 2) falla('tut.lineas', `«${paso.texto}»: ${paso.lineas} líneas (${paso.modo})`)
    if (paso.lectura && !process.env.TUT_SIN_DELTA) {
      // Δ con la capa y sin ella, entre dos fotos SIN capa iguales: la mesa del pago se mueve
      // sola (la sacudida de los nombres de la revelación, sus temporizadores), y eso no es la capa.
      // El ratón, fuera de todo: el que se queda donde tocó «Pasar» lo levanta 2 px (hover) en
      // cuanto la capa deja de taparlo, y eso no es la capa.
      if (!vp.movil) await page.mouse.move(1, 1)
      const estilo = await page.addStyleTag({ content: PAUSA })
      let d = null
      for (let k = 0; k < 6 && !d; k++) {
        const sinCapa = async () => {
          const o = await page.addStyleTag({ content: '.tut-capa, .tut-capa * { visibility: hidden !important }' })
          const cajas = await page.evaluate(CAJAS)
          await o.evaluate((e) => e.remove())
          return cajas
        }
        const sin1 = await sinCapa()
        const con = await page.evaluate(CAJAS)
        const sin2 = await sinCapa()
        if (delta(sin1, sin2).max === 0 || k === 5) d = { ...delta(sin2, con), quieta: delta(sin1, sin2).max === 0, sin: sin2, con }
        else await page.waitForTimeout(150)
      }
      await estilo.evaluate((e) => e.remove())
      if (!d.quieta) out.notas.push(`«${paso.texto}»: la mesa no se quedó quieta para medir Δ`)
      else if (d.max !== 0) {
        const quien = await page.evaluate((i) => { const e = document.querySelectorAll('#root *')[i]; return e ? `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}` : '?' }, d.quien)
        falla('tut.delta', `«${paso.texto}»: Δ ${d.max} (${quien}; ${JSON.stringify(d.sin[d.quien])} → ${JSON.stringify(d.con[d.quien])})`)
      }
    }
    if (!paso.selectores.length) { falla('tut.guiada', `«${paso.texto}»: ningún control único que tocar`); break }
    // El toque de verdad, con el dedo o el ratón, en el centro del control: antes se mira que
    // ese punto sea el control (y no una banda del velo) y, si el paso no avanza, se repite.
    const capa = await page.$('.tut-capa')
    let avanzo = false
    const fuera = []
    // En la selección, cada carta se toca UNA vez (otra la soltaría) antes de esperar el avance.
    const previos = paso.selectores.slice(0, -1)
    for (const sel of previos) {
      for (let k = 1; k <= 4; k++) {
        const punto = await page.evaluate(APUNTA, sel)
        if (punto?.libre) { await tocar(punto); await page.waitForTimeout(250); break }
        fuera.push(punto ? `encima: ${punto.encima}` : 'sin control')
        await page.waitForTimeout(250)
      }
    }
    const ultimo = paso.selectores.at(-1)
    for (let intento = 1; intento <= 4 && !avanzo; intento++) {
      const punto = await page.evaluate(APUNTA, ultimo)
      if (punto?.libre) await tocar(punto)
      else fuera.push(punto ? `encima: ${punto.encima}` : 'sin control')
      try {
        await page.waitForFunction((e) => !e.isConnected, capa, { timeout: punto?.libre ? 3000 : 500 })
        avanzo = true
        if (intento > 1) out.notas.push(`«${paso.texto}»: el toque en «${paso.que}» avanzó al intento ${intento} (${fuera.join(', ')})`)
      } catch { if (punto?.libre) fuera.push('tocado sin avanzar') }
    }
    if (!avanzo) {
      falla('tut.guiada', `«${paso.texto}»: tocar «${paso.que}» no avanzó el paso`)
      break
    }
    // Entre pasos, «Salir» sigue a mano (en la capa nueva o en la espera).
    const hay = await page.evaluate(() => !!document.querySelector('[data-accion="tut-salir"]'))
    if (!hay) sinSalir++
  }
  if (!fin) falla('tut.guiada', `no llegó al cierre (${out.pasos.length} pasos)`)
  const g = await page.evaluate(() => {
    let hecha = null
    try { hecha = JSON.parse(localStorage.getItem('ajilei.guia') ?? 'null')?.hecha ?? null } catch { /* nada */ }
    return { ajilei: window.__guia.ajilei, llamadas: window.__guia.llamadas, hecha, titulo: document.querySelector('.guia-cierre-titulo')?.textContent ?? null }
  })
  out.cierre = { titulo: g.titulo, ajilei: g.ajilei, hecha: g.hecha, pasos: out.pasos.length }
  if (fin && !g.ajilei) falla('tut.guiada', 'llegó al cierre sin la celebración de AJILEI')
  if (fin && g.hecha !== true) falla('tut.guiada', `ajilei.guia sin «hecha» (${g.hecha})`)
  pasa('tut.guiada')
  if (sinSalir) falla('tut.salir', `${sinSalir} momentos sin «Salir» en su sitio`)
  else pasa('tut.salir')

  // ── El dinero: nadie llamó y la píldora no cambió ──
  if (fin) await tocarSel('[data-accion="guia-lobby"]')
  await page.waitForSelector('main.lobby', { timeout: 15000 })
  const despues = await saldo()
  const llamadas = g.llamadas.filter((x) => PROHIBIDAS.includes(x))
  const porRed = red.filter((u) => PROHIBIDAS.some((p) => u.includes(p)))
  out.dinero = { antes, despues, llamadas: [...new Set(g.llamadas)], prohibidas: llamadas, porRed }
  if (llamadas.length) falla('tut.red', `llamadas durante la guiada: ${[...new Set(llamadas)].join(', ')}`)
  if (porRed.length) falla('tut.red', `por la red: ${porRed.slice(0, 3).join(' | ')}`)
  if (antes !== despues) falla('tut.red', `la píldora cambió: ${antes} → ${despues}`)
  pasa('tut.red')
  pasa('tut.delta')
  pasa('tut.lineas')

  // ── R-2: «Salir» en el paso 1 y una mesa real de 3 contra las IAS ──
  if (tam === 'T1') {
    await tocarSel('[data-accion="reglas"]')
    await page.waitForSelector('.tut-capa[data-listo] [data-accion="tut-salir"]', { timeout: ESPERA_PASO_MS })
    await tocarSel('.tut-capa [data-accion="tut-salir"]')
    await page.waitForSelector('main.lobby [data-accion="jugar-ia"]', { timeout: 15000 })
    await tocarSel('[data-accion="jugar-ia"]')
    // Fila a fila, como la cascada de la pantalla: cada una se enciende al elegir la anterior.
    // La mesa de 3, y en las demás la primera que se pueda.
    for (const [fila, texto] of [['reto', null], ['jugadores', '3'], ['apuesta', null], ['entrada', null]]) {
      await page.waitForFunction(({ f, x }) => [...document.querySelectorAll(`[data-accion="${f}"]`)].some((b) => !b.disabled && (x === null || b.textContent.trim() === x)), { f: fila, x: texto }, { timeout: 10000 })
      await page.evaluate(({ f, x }) => [...document.querySelectorAll(`[data-accion="${f}"]`)].find((b) => !b.disabled && (x === null || b.textContent.trim() === x)).click(), { f: fila, x: texto })
    }
    await page.waitForFunction(() => { const b = document.querySelector('button.sal-cta.es-retar'); return b && !b.disabled }, null, { timeout: 15000 })
    await tocarSel('button.sal-cta.es-retar')
    await page.waitForSelector('[data-accion="iniciar-mano"]', { timeout: 20000 })
    await tocarSel('[data-accion="iniciar-mano"]')
    await page.waitForFunction(() => [0, 1].every((i) => document.querySelector(`[data-ancla="carta"][data-i="${i}"] img[alt]`)), null, { timeout: 20000 })
    const propias = (await page.evaluate(CARTAS_PROPIAS)).sort()
    // El control del espía: en la mesa real tiene que haber visto `sentarse_ia`; si no, está ciego
    // y el «ninguna llamada» de la guiada no valdría nada.
    const vistas = await page.evaluate(() => window.__guia.llamadas)
    out.espia = { veSentarse: vistas.includes('sentarse_ia') }
    if (!out.espia.veSentarse) falla('tut.red', 'el espía no vio `sentarse_ia` en la mesa real: está ciego')
    const guion = await page.evaluate(CARTAS_DEL_GUION)
    out.mazo = { propias, guion }
    if (JSON.stringify(propias) === JSON.stringify(guion)) falla('tut.mazo', `la mesa real repartió las del guion: ${propias.join(', ')}`)
    else pasa('tut.mazo')
  }
  if (errores.length) falla('tut.consola', errores.slice(0, 3).join(' | '))
  else pasa('tut.consola')
  return out
}

export async function runTutGuiada(browser, { base }) {
  const t0 = Date.now()
  const celdas = {}
  const fallos = []
  await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const progreso = {}
    try {
      celdas[tam] = await celda(page, base, tam, vp, progreso)
      fallos.push(...celdas[tam].fallos)
    } catch (e) {
      const ultimo = progreso.out?.pasos.at(-1)
      const donde = String(e?.message || e).split('\n').filter((l) => /waiting for|Timeout|Error|no está/.test(l)).slice(0, 2).join(' · ')
      fallos.push(`${tam}: el recorrido se cortó tras ${progreso.out?.pasos.length ?? 0} pasos (último «${ultimo?.texto ?? '—'}» → ${ultimo?.que ?? '—'}): ${donde.slice(0, 260)}`)
      if (progreso.out) celdas[tam] = progreso.out
      if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/guiada-${tam}.png` }).catch(() => {})
    } finally { await ctx.close() }
  }))
  const verde = fallos.length === 0 && Object.keys(celdas).length === Object.keys(T).length
  const ms = Date.now() - t0
  const resumen = Object.entries(celdas).map(([tam, c]) => `${tam} ${c.cierre?.pasos ?? 0} pasos${c.cierre?.ajilei ? ' · AJILEI' : ''}`).join(' · ')
  console.log(`  tut.guiada · ${verde ? 'VERDE' : 'ROJO'} · ${resumen} · ${(ms / 1000).toFixed(0)} s`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  for (const [tam, c] of Object.entries(celdas)) for (const n of c.notas ?? []) console.log(`    · ${tam} ${n}`)
  return { verde, ms, fallos, celdas }
}
