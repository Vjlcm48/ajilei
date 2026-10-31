// ── CFG-1 1e · el ⋮ de la mesa en el modo `cfg` ─────────────────────────────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §2.7. Tres puertas, contra el bundle real
// (4173) con la sesión simulada de `contextoCap` y un banco imitado POR
// CONTEXTO, que es el que contesta `sentarse_ia`, `mi_consulta` y
// `consultar_mano` por la ruta de Supabase: el arnés mueve el banco desde Node
// (las gratis gastadas, el saldo) y lee su libro, sin mandos de desarrollo.
// Sólo el caso «contra humanos» necesita el servidor de desarrollo con bypass
// (`?cfg=mesa-humanos`): la mesa del bundle es siempre contra las IAS.
//
//   cfg.menu     contra las IAS: Sonido, Reacciones, Tapetes, Partida rápida y
//                Mano actual (sin Cuenta ni Saldo), 64 × altoPanel(5) = 244, en
//                escritorio, móvil vertical y móvil acostado; «Partida rápida ·
//                No» y «Mano actual · 20 gratis» con el banco recién nacido.
//                Contra humanos (dev): sin Partida rápida, 64 × 200.
//   cfg.consulta con quedan 3: 3 → 2 → 1 en tres manos (la pastilla y el pie de
//                la ventana), repetir la mano no gasta, sin recorrido dorado;
//                sin gratis: el primer cobro pregunta, «Consultar» cobra 100 una
//                vez (una línea `consulta` en el libro), «pagada» (✓), la ventana
//                con el recorrido dorado, volver a consultar no pregunta ni
//                cobra; la mano de OTRA mesa en la misma sesión cobra sin
//                preguntar; sin saldo, «No te alcanza: 100 HC» y ninguna ventana
//   cfg.rapida   «Partida rápida · Sí» en el ⋮ y en el aparato; el vuelo del
//                reparto a 0,2975 s (la `transition` aplicada en la carta), las
//                esperas del segundo reparto a la mitad (volteos y avance,
//                medidos), el barajado igual (1,95 s en el CSS aplicado y en lo
//                que dura en pantalla); apagarla a mitad de mano no cambia esa
//                mano y la siguiente vuelve a 0,595; recargar la conserva

import { contextoCap, PERFIL_CAP } from '../cap/capMesa.mjs'
import { crearBanco, PRECIOS_CONSULTA_SQL } from '../../src/dev/bancoImitado.js'
import { recorrerRuta, esperarMesa } from '../rutaMesa.mjs'
import { ENTRADAS_PANEL, presentesDe, altoPanel } from '../../src/config/menuEntradas.js'
import { jugarMano, siguienteMano as pulsarSiguiente, nuevoJuego } from '../arnes/autojuego.mjs'

const ESCRITORIO = { w: 1366, h: 768, movil: false }
const CELDAS_MENU = [ESCRITORIO, { w: 412, h: 915, movil: true }, { w: 915, h: 412, movil: true }]
const VUELO = 0.595
const BARAJADO_MS = 1950

const idDe = (c) => `${c.w}x${c.h}`

// La mesa de 2 en Básico con la apuesta y la entrada mínimas (50 y 500), y la
// primera mano repartida hasta que «Mano actual» está viva.
async function mesaEnBet1(page) {
  await recorrerRuta(page, 2, 'basico', 0, 'piso')
  await page.mouse.move(5, 5)
  await iniciarMano(page)
}
async function iniciarMano(page) {
  await page.click('button:has-text("Iniciar mano")')
  await esperarTurno(page)
}
// El turno vivo del humano (BET_1): sus botones. La fila «Mano actual» sólo
// existe con el panel abierto, así que no sirve de señal.
const esperarTurno = (page) => page.waitForSelector('.action-buttons [data-accion]:not([disabled])', { timeout: 30000 })

async function contextoMesa(browser, base, celda, errores, banco, { antes = null } = {}) {
  const { ctx, page } = await contextoCap(browser, { w: celda.w, h: celda.h, dpr: celda.movil ? 2 : 1, movil: celda.movil }, base, { billetera: { banco }, perfil: PERFIL_CAP })
  const id = idDe(celda)
  page.on('pageerror', (e) => errores.push(`${id} pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`${id} console: ${m.text()}`) })
  if (antes) await antes(ctx, page)
  await page.goto(base)
  await page.waitForSelector('main.lobby [data-accion="jugar-ia"]', { timeout: 30000 })
  return { ctx, page }
}

async function abrirMenu(page) {
  await page.click('.utilities-trigger')
  await page.waitForSelector('.utilities-panel')
  await page.waitForTimeout(300)
}
async function cerrarMenu(page) {
  if (await page.$('.utilities-panel')) { await page.keyboard.press('Escape'); await page.waitForTimeout(150) }
}

const LEER_PANEL = () => {
  const p = document.querySelector('.utilities-panel')
  if (!p) return null
  const r = p.getBoundingClientRect()
  const fila = (id) => p.querySelector(`[data-entrada="${id}"]`)
  const pastilla = (id) => fila(id)?.querySelector('.util-estado, .util-badge')?.textContent ?? null
  const nombre = (id) => {
    const f = fila(id)
    return f?.getAttribute('aria-label') ?? f?.querySelector('[aria-label]')?.getAttribute('aria-label') ?? null
  }
  return {
    caja: [Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100],
    ids: [...p.querySelectorAll('.util-item')].map((e) => e.dataset.entrada),
    titles: [...p.querySelectorAll('.util-item')].map((e) => e.getAttribute('title')),
    rapida: { pastilla: pastilla('rapida'), nombre: nombre('rapida'), off: fila('rapida')?.classList.contains('is-off') ?? null },
    mano: { pastilla: pastilla('mano'), nombre: nombre('mano'), estado: fila('mano')?.querySelector('[data-estado]')?.dataset.estado ?? null },
  }
}

// La ventana de Mano actual (o el aviso), y si lleva el recorrido dorado: el
// pseudo `::before` con contenido y la animación de EMB-1 aplicados.
const LEER_VENTANA = () => {
  const v = document.querySelector('.u3-popup')
  const conf = document.querySelector('.cmc-tarjeta')
  if (!v) return { abierta: false, confirmacion: conf ? conf.textContent : null }
  const antes = getComputedStyle(v, '::before')
  return {
    abierta: true,
    aviso: v.classList.contains('u3-popup-aviso'),
    texto: v.textContent,
    pie: v.querySelector('.u3-saldo')?.textContent ?? null,
    pagada: v.hasAttribute('data-pagada'),
    dorado: antes.content !== 'none' && antes.content !== 'normal' && antes.animationName === 'emb-u3-recorrido',
    confirmacion: conf ? conf.textContent : null,
  }
}

async function tocarMano(page) {
  await abrirMenu(page)
  await page.click('.util-item-mano .util-ico-slot')
  await page.waitForFunction(() => document.querySelector('.u3-popup, .cmc-tarjeta'), null, { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(350)
  return page.evaluate(LEER_VENTANA)
}
async function cerrarVentana(page) {
  await page.mouse.click(3, 3)
  await page.waitForFunction(() => !document.querySelector('.u3-popup'), null, { timeout: 5000 }).catch(() => {})
}
const consultasDelLibro = (banco) => banco.libro.filter((l) => l.tipo === 'consulta')

// Juega la mano en curso hasta el pago con el bucle común del arnés
// (`jugarMano`: no decide nada que importe aquí) y abre la siguiente.
async function siguienteMano(page) {
  const juego = nuevoJuego()
  const r = await jugarMano(page, juego, { iniciar: false, cada: 0 })
  if (!r.cerrada) return false
  if (!(await pulsarSiguiente(page, juego, { espera: 300 }))) return false
  await esperarTurno(page)
  return true
}

// Juega lo justo para llegar al segundo reparto: pasa o iguala hasta que se
// ven los tres volteos del humano.
async function hastaElSegundoReparto(page, volteosAntes) {
  const fin = Date.now() + 30000
  while (Date.now() < fin) {
    if (await page.evaluate((n) => window.__cfg1eRapida.volteos.length >= n + 3, volteosAntes)) return true
    for (const accion of ['pasar', 'igualar']) {
      const b = await page.$(`.action-buttons [data-accion="${accion}"]:not([disabled])`)
      if (b) { await b.click().catch(() => {}); break }
    }
    await page.waitForTimeout(120)
  }
  return false
}

// ── cfg.menu ────────────────────────────────────────────────────────────────
async function puertaMenu(browser, { base, baseDev }, errores, anota) {
  for (const celda of CELDAS_MENU) {
    const id = idDe(celda)
    let ctx = null
    try {
      const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo: 5000 })
      ;({ ctx } = await contextoMesa(browser, base, celda, errores, banco))
      const page = ctx.pages()[0]
      await mesaEnBet1(page)
      await abrirMenu(page)
      const p = await page.evaluate(LEER_PANEL)
      const alto = altoPanel(5)
      anota('menu', JSON.stringify(p.ids) === JSON.stringify(ENTRADAS_PANEL)
        && !p.ids.includes('cuenta') && !p.ids.includes('saldo')
        && Math.abs(p.caja[0] - 64) <= 0.5 && Math.abs(p.caja[1] - alto) <= 0.5
        && p.rapida.pastilla === 'No' && p.rapida.nombre === 'Partida rápida · No' && p.rapida.off
        && p.mano.pastilla === '20' && p.mano.nombre === 'Mano actual · 20 gratis',
      { celda: id, que: 'contra las IAS', ids: p.ids, caja: p.caja, esperado: [64, alto], rapida: p.rapida, mano: p.mano })
    } catch (e) {
      anota('menu', false, { celda: id, que: 'contra las IAS', error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // Contra humanos: el servidor de desarrollo con el mando del bypass.
  if (!baseDev) {
    anota('menu', false, { que: 'contra humanos', error: 'sin servidor de desarrollo (baseDev)' })
    return
  }
  let ctx = null
  try {
    ctx = await browser.newContext({ viewport: { width: ESCRITORIO.w, height: ESCRITORIO.h } })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errores.push(`humanos pageerror: ${e.message}`))
    await page.goto(`${baseDev}?cfg=mesa-humanos`, { waitUntil: 'networkidle' })
    await mesaEnBet1(page)
    await abrirMenu(page)
    const p = await page.evaluate(LEER_PANEL)
    const esperados = presentesDe(false)
    anota('menu', JSON.stringify(p.ids) === JSON.stringify(esperados) && Math.abs(p.caja[1] - altoPanel(4)) <= 0.5,
      { celda: idDe(ESCRITORIO), que: 'contra humanos (dev, ?cfg=mesa-humanos)', ids: p.ids, caja: p.caja, esperado: [64, altoPanel(4)] })
  } catch (e) {
    anota('menu', false, { que: 'contra humanos', error: String(e?.message ?? e).split('\n')[0] })
  } finally { await ctx?.close().catch(() => {}) }
}

// ── cfg.consulta ────────────────────────────────────────────────────────────
async function puertaConsulta(browser, { base }, errores, anota) {
  const celda = ESCRITORIO
  const id = idDe(celda)

  // 1 · Quedan 3: 3 → 2 → 1 en tres manos; repetir no gasta; sin dorado.
  let ctx = null
  try {
    const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo: 5000 })
    banco.gastarConsultas(17)
    ;({ ctx } = await contextoMesa(browser, base, celda, errores, banco))
    const page = ctx.pages()[0]
    await mesaEnBet1(page)
    const pasos = []
    for (let mano = 1; mano <= 3; mano++) {
      await abrirMenu(page)
      const antes = (await page.evaluate(LEER_PANEL)).mano.pastilla
      await cerrarMenu(page)
      const v = await tocarMano(page)
      await cerrarVentana(page)
      const otra = await tocarMano(page)
      await cerrarVentana(page)
      pasos.push({ mano, antes, pie: v.pie, pagada: v.pagada, dorado: v.dorado, confirmacion: v.confirmacion, repetidaPie: otra.pie, banco: banco.consultas?.usadas })
      if (mano < 3 && !(await siguienteMano(page))) throw new Error(`no llegó a la mano ${mano + 1}`)
    }
    const ok = pasos.map((x) => x.antes).join() === '3,2,1'
      && pasos.map((x) => x.pie).join('|') === 'Te quedan 2 consultas gratis|Te queda 1 consulta gratis|Ya no te quedan consultas gratis'
      && pasos.every((x) => !x.pagada && !x.dorado && x.confirmacion === null && x.repetidaPie === x.pie)
      && pasos.map((x) => x.banco).join() === '18,19,20' && consultasDelLibro(banco).length === 0
    anota('consulta', ok, { celda: id, que: 'quedan 3: una por mano, repetir no gasta, sin dorado', pasos })
  } catch (e) {
    anota('consulta', false, { celda: id, que: 'quedan 3', error: String(e?.message ?? e).split('\n')[0] })
  } finally { await ctx?.close().catch(() => {}) }

  // 2 · Sin gratis: el primer cobro pregunta; luego ya no, tampoco en otra mesa.
  ctx = null
  try {
    const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo: 5000 })
    banco.gastarConsultas(20)
    ;({ ctx } = await contextoMesa(browser, base, celda, errores, banco))
    const page = ctx.pages()[0]
    await mesaEnBet1(page)
    await abrirMenu(page)
    const etiqueta0 = (await page.evaluate(LEER_PANEL)).mano
    await cerrarMenu(page)
    const s0 = banco.saldo
    const v1 = await tocarMano(page)
    const preguntaPrimero = v1.confirmacion !== null && !v1.abierta
      && v1.confirmacion.includes(`Consultar tu mano cuesta ${PRECIOS_CONSULTA_SQL.basico} HC`)
    await page.click('[data-accion="cmc-consultar"]')
    await page.waitForSelector('.u3-popup', { timeout: 5000 })
    await page.waitForTimeout(300)
    const v2 = await page.evaluate(LEER_VENTANA)
    const cobro1 = { saldo: s0 - banco.saldo, libro: consultasDelLibro(banco).length }
    await cerrarVentana(page)
    await abrirMenu(page)
    const etiqueta1 = (await page.evaluate(LEER_PANEL)).mano
    await cerrarMenu(page)
    const v3 = await tocarMano(page)
    const cobro2 = consultasDelLibro(banco).length
    await cerrarVentana(page)
    // Otra mesa, la misma pestaña (la misma sesión): la mano 1 de la mesa nueva
    // es otra mano, y cobra sin preguntar.
    await page.goto(base)
    await page.waitForSelector('main.lobby [data-accion="jugar-ia"]', { timeout: 30000 })
    await mesaEnBet1(page)
    const v4 = await tocarMano(page)
    await page.waitForTimeout(200)
    const cobro3 = consultasDelLibro(banco).length
    const ok = etiqueta0.pastilla === '100' && etiqueta0.nombre === 'Mano actual · 100 HC'
      && preguntaPrimero && v2.abierta && v2.pagada && v2.dorado && cobro1.saldo === 100 && cobro1.libro === 1
      && etiqueta1.pastilla === '✓' && etiqueta1.nombre === 'Mano actual · pagada'
      && v3.confirmacion === null && v3.abierta && v3.pagada && cobro2 === 1
      && v4.confirmacion === null && v4.abierta && v4.pagada && cobro3 === 2
    anota('consulta', ok, {
      celda: id, que: 'sin gratis: pregunta una vez, cobra por mano, dorado con la mano pagada',
      etiqueta0, preguntaPrimero, ventanaPagada: { pagada: v2.pagada, dorado: v2.dorado }, cobro1, etiqueta1,
      repetir: { pregunta: v3.confirmacion !== null, libro: cobro2 }, otraMesa: { pregunta: v4.confirmacion !== null, libro: cobro3 },
    })
  } catch (e) {
    anota('consulta', false, { celda: id, que: 'sin gratis', error: String(e?.message ?? e).split('\n')[0] })
  } finally { await ctx?.close().catch(() => {}) }

  // 3 · Sin saldo: el aviso, sin ventana ni confirmación, y nada escrito.
  ctx = null
  try {
    const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo: 550 })
    banco.gastarConsultas(20)
    ;({ ctx } = await contextoMesa(browser, base, celda, errores, banco))
    const page = ctx.pages()[0]
    await mesaEnBet1(page)
    const v = await tocarMano(page)
    anota('consulta', v.abierta && v.aviso && v.texto === 'No te alcanza: 100 HC' && v.confirmacion === null && !v.pagada
      && banco.saldo === 50 && consultasDelLibro(banco).length === 0,
    { celda: id, que: 'sin saldo (50 HC tras sentarse)', ventana: v, saldo: banco.saldo })
  } catch (e) {
    anota('consulta', false, { celda: id, que: 'sin saldo', error: String(e?.message ?? e).split('\n')[0] })
  } finally { await ctx?.close().catch(() => {}) }
}

// ── cfg.rapida ──────────────────────────────────────────────────────────────
// El registro vive en la página desde antes de cargar: cada carta voladora con
// su `transition` APLICADA (la que escribió React al despegar), el barajado (su
// `animation-duration` computada y cuánto está en pantalla) y los volteos del
// segundo reparto, todo con `performance.now()`.
const REGISTRO = () => {
  const r = { vuelos: [], barajados: [], volteos: [], retirados: [] }
  window.__cfg1eRapida = r
  const visto = new WeakSet()
  const enCurso = new Map()
  new MutationObserver((muts) => {
    const t = performance.now()
    for (const m of muts) {
      if (m.type === 'attributes' && m.target.classList?.contains('flying-card')) {
        const tr = m.target.style.transition
        if (tr && tr !== 'none' && !visto.has(m.target)) { visto.add(m.target); r.vuelos.push({ t, transition: tr }) }
      }
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue
        const fan = n.classList.contains('shuffle-fan-card') ? n : n.querySelector?.('.shuffle-fan-card')
        if (fan && !enCurso.has('b')) enCurso.set('b', { desde: t, css: getComputedStyle(fan).animationDuration })
        for (const f of [n, ...(n.querySelectorAll?.('.card-flip-anim') ?? [])]) {
          if (f.classList?.contains('card-flip-anim')) r.volteos.push({ t, css: getComputedStyle(f).animationDuration })
        }
      }
      for (const n of m.removedNodes) {
        if (n.nodeType !== 1) continue
        // El avance tras el segundo reparto deja de pintar los volteos.
        if (n.classList.contains('card-flip-anim') || n.querySelector?.('.card-flip-anim')) r.retirados.push(t)
        if ((n.classList.contains('shuffle-fan-card') || n.querySelector?.('.shuffle-fan-card')) && enCurso.has('b')) {
          const b = enCurso.get('b'); enCurso.delete('b')
          r.barajados.push({ ms: t - b.desde, css: b.css })
        }
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] })
}

const segundosDe = (transition) => Number(/transform ([\d.]+)s/.exec(transition ?? '')?.[1] ?? NaN)

// Juega hasta el segundo reparto de la mano en curso y mide: los vuelos de
// sus cartas, los tres volteos desde que aterriza la última y el avance (los
// volteos se retiran en el render de `advanceFromDeal`).
async function medirSegundoReparto(page) {
  const antes = await page.evaluate(() => ({ v: window.__cfg1eRapida.vuelos.length, n: window.__cfg1eRapida.volteos.length }))
  if (!(await hastaElSegundoReparto(page, antes.n))) throw new Error('no llegó al segundo reparto')
  await page.waitForFunction((n) => {
    const r = window.__cfg1eRapida
    const t3 = r.volteos[n + 2]?.t
    return t3 != null && r.retirados.some((t) => t > t3)
  }, antes.n, { timeout: 20000, polling: 16 })
  const r = await page.evaluate(() => JSON.parse(JSON.stringify(window.__cfg1eRapida)))
  const vuelos = r.vuelos.slice(antes.v).map((v) => ({ t: v.t, s: segundosDe(v.transition) })).filter((v) => v.s !== 0.75)
  const ultimo = vuelos.at(-1)
  const aterriza = ultimo.t + ultimo.s * 1000
  const t3 = r.volteos[antes.n + 2].t
  return {
    vuelos: vuelos.map((v) => v.s),
    volteos: r.volteos.slice(antes.n, antes.n + 3).map((v) => Math.round(v.t - aterriza)),
    avance: Math.round(r.retirados.find((t) => t > t3) - aterriza),
    registro: r,
  }
}

async function puertaRapida(browser, { base }, errores, anota) {
  const celda = ESCRITORIO
  const id = idDe(celda)
  let ctx = null
  try {
    const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo: 5000 })
    ;({ ctx } = await contextoMesa(browser, base, celda, errores, banco, { antes: (c) => c.addInitScript(REGISTRO) }))
    const page = ctx.pages()[0]
    await recorrerRuta(page, 2, 'basico', 0, 'piso')
    await page.mouse.move(5, 5)

    // Encenderla antes de la primera mano, desde el ⋮.
    await abrirMenu(page)
    await page.click('.util-item-rapida')
    await page.waitForTimeout(200)
    const clave = await page.evaluate(() => localStorage.getItem('ajilei.partidaRapida'))
    await abrirMenu(page)
    const encendida = (await page.evaluate(LEER_PANEL)).rapida
    await cerrarMenu(page)

    // Mano 1, rápida: el reparto (DEAL_2) y, tras pasar, el segundo (DEAL_3).
    await iniciarMano(page)
    const reg1 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__cfg1eRapida)))
    // Apagarla a MITAD de mano, antes del segundo reparto.
    await abrirMenu(page)
    await page.click('.util-item-rapida')
    await page.waitForTimeout(200)
    const sr1 = await medirSegundoReparto(page)
    const reg2 = sr1.registro
    const deal3 = sr1.vuelos

    // Mano 2 (ya apagada): vuelve a 0,595.
    if (!(await siguienteMano(page))) throw new Error('no llegó a la mano 2')
    const reg3 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__cfg1eRapida)))
    // Entre el segundo reparto de la mano 1 y la mano 2 vuelan también las
    // cartas del DESCARTE de la mano 1 (0,75 s, `fast`): se separan, y su
    // duración se sella aparte (Partida rápida no las toca).
    const tras2 = reg3.vuelos.slice(reg2.vuelos.length).map((v) => segundosDe(v.transition))
    const descarte = tras2.filter((x) => x === 0.75)
    const mano2 = tras2.filter((x) => x !== 0.75)
    // …y su segundo reparto, ya a ritmo normal: el «antes» de las esperas.
    const sr2 = await medirSegundoReparto(page)

    // Recargar conserva la elección del aparato (se vuelve a encender y se lee).
    await page.evaluate(() => localStorage.setItem('ajilei.partidaRapida', 'si'))
    await page.reload()
    await page.waitForSelector('main.lobby [data-accion="jugar-ia"]', { timeout: 30000 })
    await recorrerRuta(page, 2, 'basico', 0, 'piso')
    await abrirMenu(page)
    const trasRecargar = (await page.evaluate(LEER_PANEL)).rapida
    await cerrarMenu(page)

    const deal2 = reg1.vuelos.map((v) => segundosDe(v.transition))
    const mitad = VUELO / 2
    const cerca = (a, b, tol) => Number.isFinite(a) && Math.abs(a - b) <= tol
    // Los volteos se miden desde que aterriza la última carta del segundo
    // reparto: 150 / 300 / 450 ms con Partida rápida y 300 / 600 / 900 a
    // ritmo normal, con el margen de un par de fotogramas y del render. El
    // avance, 1000 y 2000.
    const enSuSitio = (medidos, paso) => medidos.length === 3 && medidos.every((d, i) => d >= paso * (i + 1) - 60 && d <= paso * (i + 1) + 120)
    const barajados = reg3.barajados
    const ok = clave === 'si' && encendida.pastilla === 'Sí' && !encendida.off
      && deal2.length >= 4 && deal2.every((s) => cerca(s, mitad, 0.0005))
      && deal3.length >= 6 && deal3.every((s) => cerca(s, mitad, 0.0005))
      && enSuSitio(sr1.volteos, 150) && sr1.avance >= 1000 - 60 && sr1.avance <= 1000 + 400
      && enSuSitio(sr2.volteos, 300) && sr2.avance >= 2000 - 60 && sr2.avance <= 2000 + 400
      && sr2.vuelos.every((x) => cerca(x, VUELO, 0.0005))
      && mano2.length >= 4 && mano2.every((s) => cerca(s, VUELO, 0.0005))
      && descarte.every((s) => s === 0.75)
      && barajados.length >= 2 && barajados.every((b) => b.css === '1.95s' && cerca(b.ms, BARAJADO_MS, 200))
      && trasRecargar.pastilla === 'Sí'
    anota('rapida', ok, {
      celda: id, clave, encendida,
      vuelo: { regla: `${VUELO} × factorManoRef (0,5 con Partida rápida)`, mano1Deal2: [...new Set(deal2)], mano1Deal3TrasApagar: [...new Set(deal3)], mano2: [...new Set(mano2)], descarteMano1: [...new Set(descarte)] },
      segundoReparto: {
        regla: '300·k / 600·k / 900·k y avance 2000·k, desde que aterriza la última carta',
        rapida: { volteos: sr1.volteos, avance: sr1.avance },
        normal: { volteos: sr2.volteos, avance: sr2.avance, vuelos: [...new Set(sr2.vuelos)] },
      },
      barajado: { regla: 'setTimeout 1950 (JS) y fanOut 1.95s (gameTable.css, protegido): sin factor', medidos: barajados.map((b) => ({ ms: Math.round(b.ms), css: b.css })) },
      trasRecargar,
    })
  } catch (e) {
    anota('rapida', false, { celda: id, error: String(e?.message ?? e).split('\n')[0] })
  } finally { await ctx?.close().catch(() => {}) }
}

// `bases.solo` ('menu' | 'consulta' | 'rapida'): una sola puerta, para iterar.
export async function mesa1e(browser, bases, errores, anota) {
  const corre = (p) => !bases.solo || bases.solo === p
  if (corre('menu')) await puertaMenu(browser, bases, errores, anota)
  if (corre('consulta')) await puertaConsulta(browser, bases, errores, anota)
  if (corre('rapida')) await puertaRapida(browser, bases, errores, anota)
}

export { esperarMesa }
