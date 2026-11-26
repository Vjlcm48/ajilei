// ── TUT-1 tanda 6 · `diagDSK tut ruta` · la ruta de la primera vez ────────────────────
// Ficha: AJILEI_TUT-1_T6_v1.0.md §2; normativo AJILEI_Tutorial_v1.5.md §1.2.1. Contra 5173 con
// bypass y el banco imitado, con un aparato SIN el ✓ del capítulo 2 (la guía del arnés lo trae,
// `GUIA_VISTA`: aquí se reescribe una vez por pestaña), en 360×640, 640×360, 780×360 y
// 1920×1080:
//   · tut.ruta    «Jugar la guiada» desde la oferta del primer login y desde la tarjeta de «Cómo
//                 se juega» abre la intro; sus siete piezas se revelan en orden, ≈ 0,4 s entre
//                 una y otra, y un toque en la pantalla las completa de golpe; «Empecemos» abre
//                 el capítulo 2 (siete pasos, «Salir» arriba y «Siguiente» en el último); al
//                 pasarlo, `vistos` tiene el 2; el puente; «Jugar» abre la mesa guiada, que se
//                 juega entera hasta el cierre con «+2.000 HC» (`jugarGuiada`, la de
//                 `tut guiada`). Con el ✓ del 2 ya puesto, la tarjeta va directa a la mesa;
//   · tut.salir   «Salir» en la intro, en el capítulo y en el puente deja el lobby, sin ✓ nuevo
//                 (salvo el del capítulo ya pasado), y la oferta del primer login no vuelve;
//   · tut.mazo    tras «Salir» en el capítulo, el generador de la baraja es el de verdad (R-2);
//   · tut.red     de «Jugar la guiada» al cierre, ninguna llamada al servidor salvo UNA
//                 `cobrar_guiada` (y las dos de la app al cambiar de pantalla);
//   · tut.delta   O1: las cajas de las piezas y de la tarjeta no cambian durante la revelación;
//   · tut.44, tut.contraste (4,5 de cada texto sobre la tarjeta), tut.lineas (dos como mucho,
//                 la línea pequeña aparte) y tut.solape («Salir», la tarjeta y las piezas no se
//                 pisan, todo dentro de la ventana sin desplazar) en la intro y en el puente;
//   · tut.consola sin errores de página.
// Control rojo: `TUT_CONTROL=caja-salta` oculta las piezas sin reservar su caja: tut.delta roja.
// Va en `completo`, como `tut guiada`: juega la guiada entera (pasa del minuto).
import process from 'node:process'
import { jugarGuiada, ESPIA, PROHIBIDAS } from './guiada.mjs'

const T = {
  T1: { w: 360, h: 640, movil: true },
  T3: { w: 640, h: 360, movil: true },
  T3s: { w: 780, h: 360, movil: true },
  T6: { w: 1920, h: 1080, movil: false },
}
const ESPERA_MS = 20000
const CALMA_MS = 1500
const PIEZAS = 7
// Lo que la app pide al cambiar de pantalla (`useAuth` y `App`, de antes de TUT-1; `tut temas`).
const DE_LA_APP = ['mi_proximo_cambio', 'mi_inventario']
// La guía de un aparato que nunca terminó el capítulo 2. `ofrecida` según la entrada.
const GUIA_SIN_RUTA = (ofrecida) => ({ ofrecida, senales: { iniciar: true, apostar: true, descartar: true } })

// ── En la página ────────────────────────────────────────────────────────────
const GUIA = () => { try { return JSON.parse(localStorage.getItem('ajilei.guia') ?? 'null') } catch { return null } }

// Lo que se ve de la intro: cuántas piezas, cuáles, y las cajas que O1 reserva.
const REVELADO = () => {
  const raiz = document.querySelector('[data-ruta="intro"]')
  if (!raiz) return null
  const piezas = [...raiz.querySelectorAll('[data-pieza]')].sort((a, b) => a.dataset.pieza - b.dataset.pieza)
  const caja = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 100) / 100) }
  return {
    k: Number(raiz.dataset.rutaK),
    vistas: piezas.map((p) => getComputedStyle(p).visibility === 'visible'),
    cajas: [...piezas, raiz.querySelector('.ruta-tarjeta')].map(caja),
    t: performance.now(),
  }
}

// La pantalla de la ruta medida: 44, contraste, líneas y solapes.
const MIDE = () => {
  const raiz = document.querySelector('[data-ruta]')
  const tarjeta = raiz.querySelector('.ruta-tarjeta')
  const rgba = (c) => (c.match(/[\d.]+/g) ?? []).map(Number)
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  // El fondo de la tarjeta (casi opaco) sobre el de la página; el texto con su alfa encima.
  const sobre = (arriba, abajo) => { const a = arriba[3] ?? 1; return [0, 1, 2].map((i) => arriba[i] * a + abajo[i] * (1 - a)) }
  const pagina = [9, 23, 14]
  const fondo = sobre(rgba(getComputedStyle(tarjeta).backgroundColor), pagina)
  const textos = [...raiz.querySelectorAll('.ruta-titulo, .ruta-frase, .ruta-nota, .ruta-dos, .ruta-item, .ruta-frase strong')]
  const contraste = textos.map((e) => {
    const c = sobre(rgba(getComputedStyle(e).color), fondo)
    const [l1, l2] = [lum(c), lum(fondo)].sort((a, b) => b - a)
    return { que: e.className || e.tagName, r: +((l1 + 0.05) / (l2 + 0.05)).toFixed(2) }
  })
  const lineas = [...raiz.querySelectorAll('.ruta-titulo, .ruta-frase, .ruta-item')].map((e) => ({
    que: e.textContent.slice(0, 40), n: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)),
  }))
  const r = (e) => e.getBoundingClientRect()
  const botones = [...raiz.querySelectorAll('button')].map((b) => ({ que: b.dataset.accion, w: Math.round(r(b).width), h: Math.round(r(b).height) }))
  const pisa = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5
  const salir = raiz.querySelector('.tut-salir')
  const piezas = [...tarjeta.querySelectorAll('.ruta-titulo, .ruta-texto, .ruta-cartas, .ruta-dos, .ruta-lista li, .ruta-btn, .tem-ico')]
    .filter((e) => !e.closest('.ruta-lista li') || e.matches('.ruta-lista li'))
  const choques = []
  if (salir && pisa(r(salir), r(tarjeta))) choques.push('«Salir» pisa la tarjeta')
  for (let i = 0; i < piezas.length; i++) for (let j = i + 1; j < piezas.length; j++) {
    if (pisa(r(piezas[i]), r(piezas[j]))) choques.push(`${piezas[i].className} ∩ ${piezas[j].className}`)
  }
  const t = r(tarjeta)
  const fuera = t.left < 0 || t.top < 0 || t.right > innerWidth + 0.5 || t.bottom > innerHeight + 0.5
  if (fuera) choques.push(`la tarjeta se sale de la ventana (${Math.round(t.left)},${Math.round(t.top)},${Math.round(t.right)},${Math.round(t.bottom)})`)
  if (raiz.scrollHeight > raiz.clientHeight + 1) choques.push(`hay que desplazar (${raiz.scrollHeight} > ${raiz.clientHeight})`)
  return { contraste, lineas, botones, choques }
}

const MAZO = async () => {
  const [{ ORDENES }, { createDeck, shuffleDeck }] = await Promise.all([import('/src/lib/guiaManos.js'), import('/src/engine/deck.js')])
  const a = shuffleDeck(createDeck()).map((c) => c.id).join(',')
  const b = shuffleDeck(createDeck()).map((c) => c.id).join(',')
  return { distintos: a !== b, guion: ORDENES.some((o) => o.join(',') === a || o.join(',') === b) }
}

async function celda(browser, base, tam, vp) {
  const out = { tam, puertas: {}, fallos: [], notas: [], pasos: [] }
  const falla = (puerta, texto) => { out.fallos.push(`${tam} ${puerta}: ${texto}`); out.puertas[puerta] = false }
  const pasa = (puerta) => { if (!(puerta in out.puertas)) out.puertas[puerta] = true }
  const errores = []

  const abrir = async (ofrecida) => {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
    // Corre después de `GUIA_VISTA`: el aparato, sin el ✓ del 2. Una vez por pestaña.
    await ctx.addInitScript((g) => {
      try {
        if (sessionStorage.getItem('tut.ruta.guia')) return
        sessionStorage.setItem('tut.ruta.guia', '1')
        localStorage.setItem('ajilei.guia', JSON.stringify(g))
      } catch { /* sin almacenamiento */ }
    }, GUIA_SIN_RUTA(ofrecida))
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errores.push(String(e?.message || e)))
    const tocarEn = async (p) => (vp.movil ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y))
    const tocar = async (sel) => {
      const p = await page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null }, sel)
      if (!p) throw new Error(`no está «${sel}»`)
      await tocarEn(p)
    }
    const lobby = async () => {
      await page.goto(`${base}/`, { waitUntil: 'networkidle' })
      await page.waitForSelector('main.lobby [data-accion="reglas"]', { timeout: ESPERA_MS })
      await page.evaluate(ESPIA, PROHIBIDAS)
    }
    const alLobby = async (donde) => {
      await page.waitForSelector('main.lobby [data-accion="reglas"]', { timeout: ESPERA_MS })
        .catch(() => falla('tut.salir', `«Salir» en ${donde} no dejó el lobby`))
    }
    const hub = async () => {
      await tocar('main.lobby [data-accion="reglas"]')
      await page.waitForSelector('[data-accion="csj-guiada"]', { timeout: ESPERA_MS })
      await tocar('[data-accion="csj-guiada"]')
    }
    const llamadas = async () => page.evaluate(() => window.__guia?.llamadas.length ?? 0)
    const desde = async (n) => page.evaluate((k) => window.__guia?.llamadas.slice(k) ?? [], n)
    return { ctx, page, tocar, tocarEn, lobby, alLobby, hub, llamadas, desde }
  }

  // La intro abierta: se mira la revelación (orden, ritmo y O1) y la pantalla entera.
  const mirarIntro = async (page) => {
    await page.waitForSelector('[data-ruta="intro"]', { timeout: ESPERA_MS })
    // Control rojo: una pieza oculta que NO reserva su caja (`display: none` hasta revelarse).
    if (process.env.TUT_CONTROL === 'caja-salta') await page.addStyleTag({ content: '.ruta-pieza:not(.es-vista){display:none!important}' })
    const muestras = []
    for (let n = 0; n < 80; n++) {
      const m = await page.evaluate(REVELADO)
      if (!m) break
      muestras.push(m)
      if (m.k >= PIEZAS && m.vistas.every(Boolean)) break
      await page.waitForTimeout(50)
    }
    const primera = muestras[0]
    const ultima = muestras.at(-1)
    out.revelacion = { muestras: muestras.length, k0: primera?.k, ms: Math.round((ultima?.t ?? 0) - (primera?.t ?? 0)) }
    if (!ultima || ultima.k < PIEZAS || !ultima.vistas.every(Boolean)) falla('tut.ruta', `la intro no terminó de revelarse (${JSON.stringify(ultima?.vistas)})`)
    // En orden: lo visible es siempre un principio de la lista.
    const desordenada = muestras.find((m) => m.vistas.some((v, i) => v && i > 0 && !m.vistas[i - 1]))
    if (desordenada) falla('tut.ruta', `una pieza se reveló antes que la anterior (${JSON.stringify(desordenada.vistas)})`)
    if (primera && primera.k > 2) falla('tut.ruta', `la intro abrió ya revelada hasta la pieza ${primera.k}`)
    // ≈ 0,4 s entre piezas: seis pasos, entre 1,8 y 4 s.
    if (ultima && primera && primera.k <= 2 && (out.revelacion.ms < 1800 || out.revelacion.ms > 4000)) falla('tut.ruta', `la revelación tardó ${out.revelacion.ms} ms`)
    // O1: las cajas reservadas no cambian.
    const cambia = muestras.find((m) => JSON.stringify(m.cajas) !== JSON.stringify(primera.cajas))
    if (cambia) falla('tut.delta', `una caja de la intro cambió durante la revelación (${JSON.stringify(primera.cajas)} → ${JSON.stringify(cambia.cajas)})`)
    await page.waitForTimeout(400)
    medir(await page.evaluate(MIDE), 'intro')
    if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/ruta-intro-${tam}.png` }).catch(() => {})
  }
  const medir = (m, donde) => {
    out[donde] = m
    for (const c of m.contraste) if (c.r < 4.5) falla('tut.contraste', `${donde}: ${c.que} da ${c.r}`)
    for (const l of m.lineas) if (l.n > 2) falla('tut.lineas', `${donde}: «${l.que}» en ${l.n} líneas`)
    for (const b of m.botones) if (b.w < 44 || b.h < 44) falla('tut.44', `${donde}: ${b.que} mide ${b.w}×${b.h}`)
    for (const c of m.choques) falla('tut.solape', `${donde}: ${c}`)
  }
  // El capítulo 2 de la ruta, del paso 1 al 7: «Salir» arriba, «Siguiente» al final (sin «Terminar»).
  const capituloEntero = async (page, tocar) => {
    for (let k = 1; k <= 7; k++) {
      const h = await page.waitForFunction((n) => {
        const capa = document.querySelector('.tut-capa[data-listo]')
        const p = capa?.querySelector('.tut-paso')?.textContent ?? ''
        if (!new RegExp(`^\\D*${n}\\D+7\\b`).test(p)) return null
        return {
          salir: capa.querySelector('[data-accion="tut-salir"]')?.textContent ?? null,
          siguiente: !!capa.querySelector('[data-accion="tut-siguiente"]'),
          ultimo: capa.querySelector('[data-accion="tut-terminar"]')?.textContent ?? null,
        }
      }, k, { timeout: ESPERA_MS }).catch(() => null)
      const p = h ? await h.jsonValue() : null
      if (!p) { falla('tut.ruta', `el capítulo 2 no llegó a su paso ${k} de 7`); return false }
      if (p.salir !== 'Salir') falla('tut.ruta', `capítulo 2, paso ${k}: arriba dice «${p.salir}»`)
      if (k < 7) await tocar('.tut-capa [data-accion="tut-siguiente"]')
      else {
        if (p.siguiente || p.ultimo !== 'Siguiente') falla('tut.ruta', `capítulo 2, paso 7: «${p.ultimo}» (se esperaba «Siguiente»)`)
        await tocar('.tut-capa [data-accion="tut-terminar"]')
      }
    }
    return true
  }

  // ══ A · desde la oferta: la intro y su «Salir»; el capítulo y su «Salir»; la ruta entera ══
  {
    const { ctx, page, tocar, tocarEn, lobby, alLobby, hub, llamadas, desde } = await abrir(false)
    await lobby()
    const oferta = await page.waitForSelector('.ofg-tarjeta', { timeout: ESPERA_MS }).catch(() => null)
    if (!oferta) falla('tut.ruta', 'la oferta del primer login no salió (aparato sin marca)')
    else {
      await tocar('[data-accion="guiada-jugar"]')
      await mirarIntro(page)
      await tocar('[data-ruta="intro"] [data-accion="tut-salir"]')
      await alLobby('la intro')
      await page.waitForTimeout(CALMA_MS)
      const g = await page.evaluate(GUIA)
      if ((g?.vistos ?? []).length) falla('tut.salir', `tras «Salir» en la intro, vistos ${JSON.stringify(g.vistos)}`)
      if (g?.ofrecida !== true) falla('tut.salir', '«Jugar la guiada» no puso la marca ofrecida')
      if (await page.$('.ofg-tarjeta')) falla('tut.salir', 'la oferta volvió tras «Salir» en la intro')
    }

    // Desde el hub: un toque completa la revelación; «Empecemos»; «Salir» en el capítulo.
    await hub()
    await page.waitForSelector('[data-ruta="intro"]', { timeout: ESPERA_MS })
    const k0 = await page.evaluate(() => Number(document.querySelector('[data-ruta="intro"]').dataset.rutaK))
    const p = await page.evaluate(() => { const r = document.querySelector('.ruta-titulo').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
    await tocarEn(p)
    const completa = await page.waitForFunction(() => Number(document.querySelector('[data-ruta="intro"]')?.dataset.rutaK) >= 7, null, { timeout: 300 }).then(() => true).catch(() => false)
    if (k0 >= PIEZAS) out.notas.push('la intro ya estaba revelada al tocarla: el toque no se midió')
    else if (!completa) falla('tut.ruta', `un toque durante la revelación no la completó (iba por ${k0})`)
    await page.waitForTimeout(350)
    await tocar('[data-accion="ruta-empecemos"]')
    await page.waitForSelector('.tut-capa[data-listo]', { timeout: ESPERA_MS })
    await tocar('.tut-capa [data-accion="tut-salir"]')
    await alLobby('el capítulo')
    const g2 = await page.evaluate(GUIA)
    if ((g2?.vistos ?? []).length) falla('tut.salir', `tras «Salir» en el capítulo, vistos ${JSON.stringify(g2.vistos)}`)
    const z = await page.evaluate(MAZO)
    out.mazo = z
    if (!z.distintos || z.guion) falla('tut.mazo', `tras «Salir» en el capítulo 2: ${JSON.stringify(z)}`)

    // La ruta entera: intro → capítulo 2 → puente → la guiada → el cierre.
    await hub()
    const n0 = await llamadas()
    await page.waitForSelector('[data-ruta="intro"]', { timeout: ESPERA_MS })
    await page.waitForFunction(() => Number(document.querySelector('[data-ruta="intro"]')?.dataset.rutaK) >= 7, null, { timeout: 6000 })
    await tocar('[data-accion="ruta-empecemos"]')
    if (await capituloEntero(page, tocar)) {
      const puente = await page.waitForSelector('[data-ruta="puente"]', { timeout: ESPERA_MS }).catch(() => null)
      if (!puente) falla('tut.ruta', '«Siguiente» en el paso 7 no llevó al puente')
      else {
        const g3 = await page.evaluate(GUIA)
        if (!(g3?.vistos ?? []).includes(2)) falla('tut.ruta', `al pasar el capítulo 2, vistos ${JSON.stringify(g3?.vistos)}`)
        await page.waitForTimeout(300)
        medir(await page.evaluate(MIDE), 'puente')
        if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/ruta-puente-${tam}.png` }).catch(() => {})
        await tocar('[data-accion="ruta-jugar"]')
        const { fin } = await jugarGuiada(page, { vp, tam, out, falla })
        if (!fin) falla('tut.ruta', `la guiada no llegó al cierre (${out.pasos.length} pasos)`)
        else {
          await page.waitForFunction(() => document.querySelector('[data-guia-premio]')?.dataset.guiaPremio !== 'pidiendo', null, { timeout: 10000 }).catch(() => {})
          const c = await page.evaluate(() => ({ fase: document.querySelector('[data-guia-premio]')?.dataset.guiaPremio ?? null, cifra: document.querySelector('.guia-premio-cifra')?.textContent ?? null }))
          out.cierre = c
          if (c.fase !== 'pagado' || c.cifra !== '+2.000 HC') falla('tut.ruta', `el cierre: fase ${c.fase} · «${c.cifra}»`)
        }
        const durante = await desde(n0)
        const ajenas = durante.filter((x) => !DE_LA_APP.includes(x) && x !== 'cobrar_guiada')
        const cobros = durante.filter((x) => x === 'cobrar_guiada').length
        out.red = { durante: [...new Set(durante)], cobros }
        if (ajenas.length) falla('tut.red', `llamadas en la ruta: ${[...new Set(ajenas)].join(', ')}`)
        if (fin && cobros !== 1) falla('tut.red', `cobrar_guiada ${cobros} veces (debe ser una)`)
      }
    }
    await ctx.close()
  }

  // ══ B · desde el hub: el puente y su «Salir»; con el ✓, directo a la mesa ══════════════
  {
    const { ctx, page, tocar, lobby, alLobby, hub, llamadas, desde } = await abrir(true)
    await lobby()
    await hub()
    const n0 = await llamadas()
    await page.waitForSelector('[data-ruta="intro"]', { timeout: ESPERA_MS })
    await page.waitForFunction(() => Number(document.querySelector('[data-ruta="intro"]')?.dataset.rutaK) >= 7, null, { timeout: 6000 })
    await tocar('[data-accion="ruta-empecemos"]')
    if (await capituloEntero(page, tocar)) {
      await page.waitForSelector('[data-ruta="puente"]', { timeout: ESPERA_MS })
      const ajenas = (await desde(n0)).filter((x) => !DE_LA_APP.includes(x))
      if (ajenas.length) falla('tut.red', `llamadas hasta el puente: ${[...new Set(ajenas)].join(', ')}`)
      await tocar('[data-ruta="puente"] [data-accion="tut-salir"]')
      await alLobby('el puente')
      await page.waitForTimeout(CALMA_MS)
      const g = await page.evaluate(GUIA)
      if (JSON.stringify(g?.vistos) !== '[2]') falla('tut.salir', `tras «Salir» en el puente, vistos ${JSON.stringify(g?.vistos)}`)
      if (await page.$('.ofg-tarjeta')) falla('tut.salir', 'la oferta salió tras «Salir» en el puente')
      // Con el ✓ del 2: la tarjeta de la guiada abre la mesa, sin ruta.
      await page.evaluate(() => {
        window.__rutaVista = false
        new MutationObserver(() => { if (document.querySelector('[data-ruta]')) window.__rutaVista = true }).observe(document.body, { childList: true, subtree: true })
      })
      await hub()
      const mesa = await page.waitForFunction(() => document.documentElement.hasAttribute('data-guiada') && document.querySelector('.tut-capa[data-listo]'), null, { timeout: ESPERA_MS }).then(() => true).catch(() => false)
      const vista = await page.evaluate(() => window.__rutaVista)
      if (!mesa) falla('tut.ruta', 'con el ✓ del 2, «Jugar la guiada» no abrió la mesa')
      if (vista) falla('tut.ruta', 'con el ✓ del 2, «Jugar la guiada» pasó por la ruta')
    }
    await ctx.close()
  }

  pasa('tut.ruta')
  pasa('tut.salir')
  pasa('tut.mazo')
  pasa('tut.red')
  pasa('tut.delta')
  pasa('tut.44')
  pasa('tut.contraste')
  pasa('tut.lineas')
  pasa('tut.solape')
  if (errores.length) falla('tut.consola', errores.slice(0, 3).join(' | '))
  else pasa('tut.consola')
  return out
}

export async function runTutRuta(browser, { base }) {
  const t0 = Date.now()
  const celdas = {}
  const fallos = []
  await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
    try {
      celdas[tam] = await celda(browser, base, tam, vp)
      fallos.push(...celdas[tam].fallos)
    } catch (e) {
      fallos.push(`${tam}: el recorrido se cortó: ${String(e?.message || e).split('\n').slice(0, 2).join(' · ').slice(0, 300)}`)
    }
  }))
  const verde = fallos.length === 0 && Object.keys(celdas).length === Object.keys(T).length
  const ms = Date.now() - t0
  console.log(`  tut.ruta · ${verde ? 'VERDE' : 'ROJO'} · ${Object.keys(celdas).join(' · ')} · ${(ms / 1000).toFixed(0)} s`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  for (const [tam, c] of Object.entries(celdas)) {
    if (c.revelacion) console.log(`    · ${tam} revelación: ${c.revelacion.ms} ms desde la pieza ${c.revelacion.k0}`)
    for (const n of c.notas ?? []) console.log(`    · ${tam} ${n}`)
  }
  if (process.env.TUT_DETALLE) console.log(JSON.stringify(celdas, null, 1))
  return { verde, ms, fallos, celdas }
}
