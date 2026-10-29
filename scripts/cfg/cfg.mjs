// ── CFG-1 1a · el modo `cfg` de diagDSK ─────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §3.3. Vive en su módulo, como `rnk` y
// `suma`; diagDSK sólo lo llama y lee su veredicto por `verde`.
//
// CONTRA EL BUNDLE REAL (4173) con la sesión simulada de `contextoCap` y el
// banco imitado por contexto, el mismo camino que `lob`, `rnk` y `suma`. Las
// salas abiertas (para «Unirme») las contesta una ruta propia, encima de la de
// `contextoCap`.
//
// LA MEDIDA ES LA DE LA LÁMINA (`laminas/cfg1a/guion.js`, `medir()`):
//   · zona GEOMÉTRICA = la caja del botón ∪ el rectángulo de su `::after`,
//     calculado de los `inset` que el navegador resolvió;
//   · zona EFECTIVA = barrido en cruz con `elementFromPoint` desde el centro,
//     píxel a píxel (tope 600: con 200 salían anchos falsos de 401);
//   · solapes = cruce de zonas geométricas entre dos tocables, por parejas.
//
// LAS PUERTAS (cada una con su nombre; una celda sin medir es roja):
//   cfg.zona     zona ≥ 44 (geométrica ≥ 43,5 y efectiva ≥ 43: el barrido va de
//                píxel en píxel) en ⚙, casa, flecha, avatar, chips, ±, «Unirme»,
//                «+» y ojito, en el lobby, Retar y Salas
//   cfg.solape   cero solape entre las zonas de dos tocables (R-9 en 360)
//   cfg.ojito    la caja de la cifra igual abierta y tapada (también con 9 HC);
//                tapada mientras cuenta (el aviso de la constancia): los puntos
//                no se mueven; `ajilei.saldoOculto` sobrevive a recargar; en
//                Rankings no hay ojito y la cifra se ve
//   cfg.hoja     360×640 con «Acerca de» abierto: la hoja termina ≤ 584 y no se
//                desplaza; filas ≥ 44; cabecera fija (cuerpo desplazable)
//                salvo en el apaisado bajo, donde se desplaza la hoja entera
//   cfg.ancla    borde derecho hoja − ⚙ = 0 y el mismo hueco ⚙→hoja que el
//                lobby, en el lobby, Retar y Rankings (1366×768 y 915×412)
//   cfg.toast    «Copiado» sale y queda por encima del velo
//   cfg.sonido   «Sonido» en la hoja cambia `ajilei.sound`; en la mesa el ⋮
//                lleva `is-off` con el sonido apagado (y el icono atenuado), y
//                encenderlo allí lo deja «Sí» en la hoja
//   cfg.version  «Acerca de» empieza por «AJILEI 0.9.0 · » + 7 hex o `local`
//   cfg.inv45    los dos botones de la sugerencia, el crédito de «Acerca de» y
//                el enlace de SumaMente en Rankings llevan
//                `data-sin-pantalla-completa` (el del intersticial, en el código)
//   cfg.sinojito sin la prop, la barra no pinta el ojito (Retar, Salas, Rankings)
//   consola      sin errores de página

import { readFileSync } from 'node:fs'
import { contextoCap, PERFIL_CAP } from '../cap/capMesa.mjs'
import { sembradosRanking } from '../../src/dev/sembradosRanking.js'
import { crearBanco, sumarDias } from '../../src/dev/bancoImitado.js'
import { recorrerRuta } from '../rutaMesa.mjs'

const VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version
const CELDAS = [
  { w: 360, h: 640, movil: true },
  { w: 412, h: 915, movil: true },
  { w: 915, h: 412, movil: true },
  { w: 1366, h: 768, movil: false },
  { w: 1920, h: 1080, movil: false },
]
const ANCLA_CELDAS = ['1366x768', '915x412']
const TECHO_HOJA_360 = 584
const ZONA_GEO = 43.5
const ZONA_EFECTIVA = 43

// Tres mesas abiertas, como el molde `opciones-3` del bypass.
const enUnRato = (s) => new Date(Date.now() + s * 1000).toISOString()
const MESAS = [[1, 4, 200, 3], [2, 2, 100, 1], [3, 5, 200, 1]].map(([n, jugadores, apuesta, sentados]) => ({
  id: `00000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`, jugadores, apuesta, sentados, expira_en: enUnRato(150),
}))

// ── La medida, en la página. Autocontenida: Playwright la serializa. ────────
const MEDIR = () => {
  const $$ = (s) => [...document.querySelectorAll(s)]
  const r2 = (x) => Math.round(x * 100) / 100
  const caja = (r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom })
  const wh = (z) => [r2(z.r - z.l), r2(z.b - z.t)]
  const cruza = (a, b) => {
    const l = Math.max(a.l, b.l), t = Math.max(a.t, b.t), r = Math.min(a.r, b.r), bb = Math.min(a.b, b.b)
    return r - l > 0.5 && bb - t > 0.5 ? { l, t, r, b: bb } : null
  }
  const zonaGeo = (el) => {
    const r = el.getBoundingClientRect()
    let z = caja(r)
    const a = getComputedStyle(el, '::after'), cs = getComputedStyle(el)
    if (a.content && a.content !== 'none' && a.content !== 'normal' && a.position === 'absolute' && cs.position !== 'static') {
      const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0
      const br = parseFloat(cs.borderRightWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0
      const za = { l: r.left + bl + parseFloat(a.left), t: r.top + bt + parseFloat(a.top), r: r.right - br - parseFloat(a.right), b: r.bottom - bb - parseFloat(a.bottom) }
      z = { l: Math.min(z.l, za.l), t: Math.min(z.t, za.t), r: Math.max(z.r, za.r), b: Math.max(z.b, za.b) }
    }
    return z
  }
  const zonaEfectiva = (el) => {
    const r = el.getBoundingClientRect()
    const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2)
    const suyo = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
    if (!suyo(cx, cy)) return null
    const barre = (dx, dy) => { let x = cx, y = cy, n = 0; while (n < 600 && suyo(x + dx, y + dy)) { x += dx; y += dy; n++ } return [x, y] }
    return [barre(1, 0)[0] - barre(-1, 0)[0] + 1, barre(0, 1)[1] - barre(0, -1)[1] + 1]
  }
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return false
    if (el.closest('[hidden], [inert]')) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  const TOCABLES = [
    ['⚙', '.lob-top [data-accion="ajustes"]'],
    ['avatar', '.lob-top [data-accion="perfil"]'],
    ['«+»', '.lob-pildora .lob-mas'],
    ['ojito', '.lob-pildora [data-accion="ojito"]'],
    ['casa', '[data-accion="casa"]'],
    ['flecha', '[data-accion="volver"]'],
    ['chip', '.sal-chip'],
    ['±', '.sal-paso'],
    ['Unirme', '.sal-unir'],
  ]
  const VECINOS = [['cifra', '.lob-pildora .bd-num'], ['nombre', '.lob-top .lob-nombre'], ['título', '.sal-cab h1']]
  const ts = []
  for (const [n, sel] of TOCABLES) {
    for (const el of $$(sel)) {
      if (!visible(el)) continue
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 14)
      const nombre = n === 'chip' ? `chip:${el.dataset.accion || ''} ${txt}` : n === '±' ? (el.dataset.accion || '±') : n
      ts.push({ n: nombre, tipo: n, el, geo: zonaGeo(el), efectiva: zonaEfectiva(el) })
    }
  }
  const solapes = []
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      const a = ts[i], b = ts[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      const x = cruza(a.geo, b.geo)
      if (x) solapes.push({ a: a.n, b: b.n, px: wh(x) })
    }
  }
  const vecinos = []
  for (const t of ts) {
    for (const [vn, vs] of VECINOS) {
      for (const v of $$(vs)) {
        if (!visible(v) || v.contains(t.el) || t.el.contains(v)) continue
        const x = cruza(t.geo, caja(v.getBoundingClientRect()))
        if (x) vecinos.push({ a: t.n, con: vn, px: wh(x) })
      }
    }
  }
  return {
    tocables: ts.map((t) => ({ n: t.n, tipo: t.tipo, caja: wh(caja(t.el.getBoundingClientRect())), zona: wh(t.geo), efectiva: t.efectiva })),
    solapes, vecinos,
    ojito: !!document.querySelector('[data-accion="ojito"]'),
  }
}

// La hoja abierta: su geometría contra el ⚙ de la pantalla que la monta.
const MEDIR_HOJA = () => {
  const r2 = (x) => Math.round(x * 100) / 100
  const hoja = document.querySelector('.lob-hoja.is-on')
  if (!hoja) return null
  const rh = hoja.getBoundingClientRect()
  const aj = document.querySelector('.lob-top [data-accion="ajustes"]').getBoundingClientRect()
  const cuerpo = hoja.querySelector('.cfg-hoja-cuerpo')
  const cs = getComputedStyle(hoja)
  return {
    top: r2(rh.top), alto: r2(rh.height), fondo: r2(rh.bottom), celda: innerHeight,
    derecha: r2(rh.right - aj.right), hueco: r2(rh.top - aj.bottom),
    hojaDesplaza: hoja.scrollHeight > hoja.clientHeight + 1,
    cuerpoDesplaza: cuerpo.scrollHeight > cuerpo.clientHeight + 1,
    // Qué se desplaza cuando no cabe: el cuerpo (cabecera fija) o la hoja entera.
    desplazable: getComputedStyle(cuerpo).overflowY === 'auto' && cs.overflowY === 'hidden' ? 'cuerpo' : (cs.overflowY === 'auto' ? 'hoja' : cs.overflowY),
    filas: [...hoja.querySelectorAll('.lob-fila')].map((f) => [f.dataset.accion, r2(f.getBoundingClientRect().height)]),
  }
}

const CIFRA = () => {
  const r2 = (x) => Math.round(x * 100) / 100
  const pil = document.querySelector('.lob-pildora')
  const num = pil?.querySelector('.bd-num')
  if (!num) return null
  const r = num.getBoundingClientRect(), p = pil.getBoundingClientRect()
  const tapada = pil.hasAttribute('data-saldo-oculto')
  const tapa = tapada ? getComputedStyle(num, '::after').content : null
  return {
    texto: num.textContent, tapada, caja: [r2(r.width), r2(r.height), r2(r.left)], pildora: [r2(p.width), r2(p.height)],
    puntos: tapada ? /••••/.test(tapa || '') : false,
    digitosOcultos: tapada ? getComputedStyle(num.querySelector('.pil-tapada')).visibility === 'hidden' : false,
  }
}

const esperarQuieta = (page) => page.waitForTimeout(450)

async function abrirLobby(browser, base, celda, errores, { billetera = null, antes = null } = {}) {
  // El banco lleva los sembrados del ranking (como `rnk`): con la lista llena
  // Rankings pinta su línea de SumaMente, que es uno de los portadores de INV-45.
  const conBanco = billetera ?? { banco: crearBanco({ usuario: PERFIL_CAP.username, sembrados: sembradosRanking(), saldo: 5000 }) }
  const { ctx, page } = await contextoCap(browser, { w: celda.w, h: celda.h, dpr: celda.movil ? 2 : 1, movil: celda.movil }, base, { billetera: conBanco })
  const id = `${celda.w}x${celda.h}`
  page.on('pageerror', (e) => errores.push(`${id} pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`${id} console: ${m.text()}`) })
  await ctx.route(/\/rest\/v1\/rpc\/salas_abiertas/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MESAS) }))
  if (antes) await antes(ctx, page)
  await page.goto(base)
  await page.waitForSelector('main.lobby .lob-pildora .bd-num', { timeout: 30000 })
  await page.waitForFunction(() => /\d/.test(document.querySelector('.lob-pildora .bd-num')?.textContent ?? ''), null, { timeout: 15000 })
  await esperarQuieta(page)
  return { ctx, page }
}

async function abrirHoja(page) {
  await page.click('.lob-top [data-accion="ajustes"]')
  await page.waitForSelector('.lob-hoja.is-on')
  await esperarQuieta(page)
}
async function cerrarHoja(page) {
  await page.keyboard.press('Escape')
  await page.waitForSelector('.lob-hoja:not(.is-on)')
  await esperarQuieta(page)
}

// Retar con «Otra…» elegida: aparecen los ± del contador (como la lámina).
async function irRetar(page) {
  await page.click('[data-accion="jugar-ia"]')
  await page.waitForSelector('main.sal .sal-chip[data-accion="reto"]:not([disabled])')
  for (const accion of ['reto', 'jugadores', 'apuesta']) {
    await page.waitForSelector(`[data-accion="${accion}"]:not([disabled])`)
    await page.click(`[data-accion="${accion}"]:nth-of-type(${accion === 'jugadores' ? 3 : 1})`)
  }
  await page.waitForSelector('[data-accion="entrada"]:not([disabled])')
  await page.locator('[data-accion="entrada"]').last().click()
  await page.waitForSelector('.sal-paso', { timeout: 5000 }).catch(() => {})
  await esperarQuieta(page)
}

const pasa = (lista) => lista.every(Boolean)

export async function runCfg(browser, { base }) {
  const t0 = Date.now()
  const errores = []
  const celdas = []
  const puertas = { zona: [], solape: [], ojito: [], hoja: [], ancla: [], toast: [], sonido: [], version: [], inv45: [], sinojito: [] }
  const anota = (p, ok, detalle) => { puertas[p].push({ ok: ok === true, ...detalle }); return ok === true }

  for (const celda of CELDAS) {
    const id = `${celda.w}x${celda.h}`
    const t = Date.now()
    const c = { id, pantallas: {} }
    celdas.push(c)
    let ctx = null
    try {
      // ── 1 · El lobby: zonas, cifra y ojito ──────────────────────────────
      ;({ ctx } = await abrirLobby(browser, base, celda, errores))
      const page = ctx.pages()[0]
      const lobby = await page.evaluate(MEDIR)
      const abierta = await page.evaluate(CIFRA)
      await page.click('[data-accion="ojito"]'); await page.waitForTimeout(150)
      const tapada = await page.evaluate(CIFRA)
      const guardado = await page.evaluate(() => localStorage.getItem('ajilei.saldoOculto'))
      await page.reload(); await page.waitForSelector('main.lobby .lob-pildora .bd-num'); await esperarQuieta(page)
      const trasRecargar = await page.evaluate(CIFRA)
      await page.click('[data-accion="ojito"]'); await page.waitForTimeout(150)
      c.pantallas.lobby = { ...lobby, cifra: { abierta, tapada, trasRecargar, guardado } }
      anota('ojito', abierta && tapada && abierta.caja.join() === tapada.caja.join() && abierta.pildora.join() === tapada.pildora.join()
        && tapada.puntos && tapada.digitosOcultos && guardado === 'si' && trasRecargar?.tapada === true,
        { celda: id, que: 'caja igual abierta/tapada con 5.000; se recuerda al recargar', abierta: abierta?.caja, tapada: tapada?.caja, guardado, trasRecargar: trasRecargar?.tapada })

      // ── 2 · La hoja en el lobby ─────────────────────────────────────────
      await abrirHoja(page)
      const hojaLobby = await page.evaluate(MEDIR_HOJA)
      await page.click('[data-accion="acerca"]'); await page.waitForTimeout(300)
      const hojaAcerca = await page.evaluate(MEDIR_HOJA)
      const version = await page.evaluate(() => document.querySelector('.lob-acerca .cfg-version')?.textContent ?? '')
      const versionPrimera = await page.evaluate(() => document.querySelector('.lob-acerca')?.firstElementChild?.classList.contains('cfg-version') === true)
      await page.click('[data-accion="acerca"]')
      await page.click('[data-accion="cfg-sugerencias"]'); await page.waitForTimeout(300)
      const inv45 = await page.evaluate(() => [...document.querySelectorAll('.cfg-sug-btn, .lob-acerca a')].map((e) => [e.dataset.accion || e.textContent.trim().slice(0, 20), e.hasAttribute('data-sin-pantalla-completa')]))
      const botones = await page.evaluate(() => [...document.querySelectorAll('.cfg-sug-btn')].map((b) => Math.round(b.getBoundingClientRect().height * 100) / 100))
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin }).catch(() => {})
      await page.click('[data-accion="cfg-copiar"]')
      await page.waitForSelector('.cfg-toast.is-on', { timeout: 3000 }).catch(() => {})
      const toast = await page.evaluate(() => {
        const t = document.querySelector('.cfg-toast')
        const velo = document.querySelector('.lob-velo.is-on')
        if (!t || !t.classList.contains('is-on')) return { on: false }
        // `pointer-events: none` lo deja fuera de `elementFromPoint`: se le
        // devuelve un instante para preguntar quién pinta encima en su centro.
        t.style.pointerEvents = 'auto'
        const r = t.getBoundingClientRect()
        const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        t.style.pointerEvents = ''
        return { on: true, texto: t.textContent, encima: arriba === t || t.contains(arriba), velo: !!velo, z: getComputedStyle(t).zIndex }
      })
      const copiado = await page.evaluate(() => navigator.clipboard.readText().catch(() => null))
      const sonido0 = await page.evaluate(() => [localStorage.getItem('ajilei.sound'), document.querySelector('[data-accion="cfg-sonido"] .lob-pastilla').textContent])
      await page.click('[data-accion="cfg-sonido"]'); await page.waitForTimeout(150)
      const sonido1 = await page.evaluate(() => [localStorage.getItem('ajilei.sound'), document.querySelector('[data-accion="cfg-sonido"] .lob-pastilla').textContent])
      await page.click('[data-accion="cfg-sonido"]'); await page.waitForTimeout(150)
      await cerrarHoja(page)
      c.pantallas.lobby.hoja = { plegada: hojaLobby, acerca: hojaAcerca, version, botones, toast, copiado }

      const filas44 = [...hojaLobby.filas, ...hojaAcerca.filas].every(([, a]) => a >= 44 - 0.01) && botones.every((a) => a >= 44 - 0.01)
      const bajo = celda.h <= 520
      const esperado = bajo ? 'hoja' : 'cuerpo'
      anota('hoja', filas44 && hojaLobby.desplazable === esperado
        && (id !== '360x640' || (hojaAcerca.fondo <= TECHO_HOJA_360 && !hojaAcerca.hojaDesplaza && !hojaAcerca.cuerpoDesplaza)),
        { celda: id, plegada: hojaLobby.alto, acerca: hojaAcerca.alto, fondoAcerca: hojaAcerca.fondo, desplazable: hojaLobby.desplazable, esperado, filas: hojaLobby.filas, botones })
      anota('version', versionPrimera && new RegExp(`^AJILEI ${VERSION.replace(/\./g, '\\.')} · ([0-9a-f]{7}|local)$`).test(version), { celda: id, version, primera: versionPrimera })
      anota('inv45', inv45.length >= 3 && inv45.every(([, si]) => si), { celda: id, lobby: inv45 })
      anota('toast', toast.on && toast.texto === 'Copiado' && toast.encima && toast.velo, { celda: id, ...toast, copiado })
      anota('sonido', sonido0[1] === (sonido0[0] === 'off' ? 'No' : 'Sí') && sonido1[0] !== sonido0[0] && sonido1[1] !== sonido0[1],
        { celda: id, que: 'la fila cambia ajilei.sound y la pastilla', antes: sonido0, despues: sonido1 })
      const lobbyAncla = { derecha: hojaLobby.derecha, hueco: hojaLobby.hueco }

      // ── 3 · Retar ───────────────────────────────────────────────────────
      await irRetar(page)
      const retar = await page.evaluate(MEDIR)
      await abrirHoja(page)
      const hojaRetar = await page.evaluate(MEDIR_HOJA)
      await cerrarHoja(page)
      c.pantallas.retar = { ...retar, hoja: hojaRetar }
      await page.click('[data-accion="casa"]')
      await page.waitForSelector('main.lobby'); await esperarQuieta(page)

      // ── 4 · Salas (tres mesas abiertas) ─────────────────────────────────
      await page.click('[data-accion="jugar-pvp"]')
      await page.waitForSelector('main.sal .sal-unir', { timeout: 15000 })
      await esperarQuieta(page)
      const salas = await page.evaluate(MEDIR)
      c.pantallas.salas = salas
      await page.click('[data-accion="casa"]')
      await page.waitForSelector('main.lobby'); await esperarQuieta(page)

      // ── 5 · Rankings, con el ojito cerrado en el aparato ────────────────
      await page.click('[data-accion="ojito"]'); await page.waitForTimeout(150)
      await page.click('[data-accion="rankings"]')
      await page.waitForSelector('main.sal[data-ranking][data-rnk-estado="listo"]', { timeout: 15000 })
      await esperarQuieta(page)
      const rnk = await page.evaluate(MEDIR)
      const rnkCifra = await page.evaluate(CIFRA)
      const rnkInv45 = await page.evaluate(() => [...document.querySelectorAll('a[data-accion="sumamente"]')].map((a) => a.hasAttribute('data-sin-pantalla-completa')))
      await abrirHoja(page)
      const hojaRnk = await page.evaluate(MEDIR_HOJA)
      await cerrarHoja(page)
      c.pantallas.rankings = { ...rnk, cifra: rnkCifra, hoja: hojaRnk }
      await page.click('[data-accion="casa"]')
      await page.waitForSelector('main.lobby'); await esperarQuieta(page)
      await page.click('[data-accion="ojito"]'); await page.waitForTimeout(150)
      anota('inv45', rnkInv45.length === 1 && rnkInv45[0], { celda: id, rankings: rnkInv45 })
      anota('ojito', !rnk.ojito && rnkCifra && !rnkCifra.tapada && /\d/.test(rnkCifra.texto), { celda: id, que: 'Rankings: sin ojito y la cifra a la vista con el ojito cerrado', ojito: rnk.ojito, cifra: rnkCifra?.texto })

      // ── Las puertas de zona, solape, ancla y sinojito de la celda ───────
      for (const [nombre, m] of [['lobby', lobby], ['retar', retar], ['salas', salas]]) {
        const cortos = m.tocables.filter((x) => Math.min(...x.zona) < ZONA_GEO || !x.efectiva || Math.min(...x.efectiva) < ZONA_EFECTIVA)
        const tipos = new Set(m.tocables.map((x) => x.tipo))
        const deben = nombre === 'lobby' ? ['⚙', 'avatar', '«+»', 'ojito'] : nombre === 'retar' ? ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'chip', '±'] : ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'Unirme']
        const faltan = deben.filter((d) => !tipos.has(d))
        anota('zona', !cortos.length && !faltan.length, { celda: id, pantalla: nombre, cortos: cortos.map((x) => [x.n, x.zona, x.efectiva]), faltan })
        anota('solape', m.solapes.length === 0, { celda: id, pantalla: nombre, solapes: m.solapes })
      }
      for (const [nombre, m] of [['retar', retar], ['salas', salas], ['rankings', rnk]]) {
        anota('sinojito', m.ojito === false, { celda: id, pantalla: nombre })
      }
      const anclas = { lobby: lobbyAncla, retar: { derecha: hojaRetar.derecha, hueco: hojaRetar.hueco }, rankings: { derecha: hojaRnk.derecha, hueco: hojaRnk.hueco } }
      c.anclas = anclas
      if (ANCLA_CELDAS.includes(id)) {
        const okA = Object.values(anclas).every((a) => Math.abs(a.derecha) <= 0.5 && Math.abs(a.hueco - lobbyAncla.hueco) <= 0.5)
        anota('ancla', okA, { celda: id, ...anclas })
      }
      c.ms = Date.now() - t
    } catch (e) {
      c.error = String(e?.message ?? e).split('\n')[0]
      for (const p of Object.keys(puertas)) if (!['ancla'].includes(p)) anota(p, false, { celda: id, error: c.error })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  // ── 6 · El ojito con 9 HC, y tapado mientras cuenta ───────────────────────
  for (const celda of [CELDAS[0], CELDAS[1], CELDAS[3], CELDAS[4]]) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    try {
      ;({ ctx } = await abrirLobby(browser, base, celda, errores, { billetera: { saldo: 9 } }))
      const page = ctx.pages()[0]
      const a = await page.evaluate(CIFRA)
      await page.click('[data-accion="ojito"]'); await page.waitForTimeout(150)
      const b = await page.evaluate(CIFRA)
      anota('ojito', a && b && a.texto === '9' && a.caja.join() === b.caja.join() && a.pildora.join() === b.pildora.join(),
        { celda: id, que: 'caja igual abierta/tapada con 9 HC', abierta: a?.caja, tapada: b?.caja })
    } catch (e) {
      anota('ojito', false, { celda: id, que: '9 HC', error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }
  {
    // La constancia paga hoy (racha 2 ayer → 3 hoy): el aviso cuenta en la
    // píldora de 5.000 a 5.500. El ojito, cerrado desde antes de cargar.
    const celda = CELDAS[1]
    let ctx = null
    try {
      const banco = crearBanco({ saldo: 5000 })
      banco.constanciaAdmin(2, sumarDias(banco.hoy(), -1))
      ;({ ctx } = await contextoCap(browser, { w: celda.w, h: celda.h, dpr: 2, movil: true }, base, { billetera: { banco } }))
      const page = ctx.pages()[0]
      page.on('pageerror', (e) => errores.push(`cuenta pageerror: ${e.message}`))
      await ctx.addInitScript(() => { try { localStorage.setItem('ajilei.saldoOculto', 'si') } catch { /* sin almacén */ } })
      await page.goto(base)
      await page.waitForSelector('main.lobby .lob-pildora .bd-num', { timeout: 30000 })
      const muestras = []
      const fin = Date.now() + 6000
      while (Date.now() < fin) {
        muestras.push(await page.evaluate(() => {
          const pil = document.querySelector('.lob-pildora'), num = pil.querySelector('.bd-num'), r = num.getBoundingClientRect()
          const d = pil.querySelector('.pil-tapada')
          return { tapada: pil.hasAttribute('data-saldo-oculto'), texto: d?.textContent ?? num.textContent, oculto: d ? getComputedStyle(d).visibility === 'hidden' : false,
            puntos: /••••/.test(getComputedStyle(num, '::after').content), x: Math.round(r.left * 100) / 100, w: Math.round(r.width * 100) / 100, cuenta: !!pil.querySelector('.avs-viva') }
        }))
        await page.waitForTimeout(120)
      }
      const conCifra = muestras.filter((m) => /\d/.test(m.texto))
      const textos = [...new Set(conCifra.map((m) => m.texto))]
      const contando = muestras.some((m) => m.cuenta) && textos.length >= 3
      const quietos = new Set(conCifra.map((m) => `${m.x}/${m.w}`)).size === 1
      const siempreTapada = conCifra.every((m) => m.tapada && m.oculto && m.puntos)
      anota('ojito', contando && quietos && siempreTapada, { celda: '412x915', que: 'tapada mientras cuenta (aviso de la constancia, 5.000 → 5.500)', textos: textos.slice(0, 4).concat(textos.length > 4 ? ['…', textos.at(-1)] : []), cajas: [...new Set(conCifra.map((m) => `${m.x}/${m.w}`))], siempreTapada })
    } catch (e) {
      anota('ojito', false, { celda: '412x915', que: 'cuenta', error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // ── 7 · El ⋮ de la mesa lee el mismo sonido (piel móvil y de escritorio) ──
  for (const celda of [CELDAS[1], CELDAS[3]]) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    try {
      ;({ ctx } = await abrirLobby(browser, base, celda, errores))
      const page = ctx.pages()[0]
      // Apagar desde la hoja y entrar a una mesa.
      await abrirHoja(page)
      const enHoja = await page.evaluate(() => document.querySelector('[data-accion="cfg-sonido"] .lob-pastilla').textContent)
      if (enHoja === 'Sí') await page.click('[data-accion="cfg-sonido"]')
      await page.waitForTimeout(150)
      await cerrarHoja(page)
      await recorrerRuta(page, 2, 'basico', 0, 'piso')
      await page.click('.utilities-trigger')
      await page.waitForSelector('.util-item-sound', { state: 'visible' })
      await page.waitForTimeout(250)
      const enMesa = await page.evaluate(() => {
        const e = document.querySelector('.util-item-sound')
        return { off: e.classList.contains('is-off'), opacidad: getComputedStyle(e.querySelector('.util-ico')).opacity, clave: localStorage.getItem('ajilei.sound') }
      })
      // Encenderlo desde el ⋮ y volver al lobby recargando: la hoja dice «Sí».
      await page.click('.util-item-sound'); await page.waitForTimeout(150)
      const clave2 = await page.evaluate(() => localStorage.getItem('ajilei.sound'))
      await page.goto(base); await page.waitForSelector('main.lobby .lob-pildora .bd-num', { timeout: 30000 }); await esperarQuieta(page)
      await abrirHoja(page)
      const deVuelta = await page.evaluate(() => document.querySelector('[data-accion="cfg-sonido"] .lob-pastilla').textContent)
      anota('sonido', enMesa.off && enMesa.clave === 'off' && Number(enMesa.opacidad) < 1 && clave2 === 'on' && deVuelta === 'Sí',
        { celda: id, que: 'hoja → ⋮ → hoja', enMesa, trasEncenderEnMesa: clave2, hojaDeVuelta: deVuelta })
    } catch (e) {
      anota('sonido', false, { celda: id, que: 'mesa', error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // ── 8 · El enlace del intersticial: en el código (no se llega sin jugar) ──
  {
    const fuente = readFileSync(new URL('../../src/screens/IntersticialSumaMente.jsx', import.meta.url), 'utf8')
    const a = fuente.match(/<a className="sm-play"[^>]*>/)
    anota('inv45', !!a && /data-sin-pantalla-completa/.test(a[0]), { que: 'IntersticialSumaMente: el enlace a la tienda (fuente)' })
  }

  const resumen = Object.fromEntries(Object.entries(puertas).map(([k, v]) => [`cfg.${k}`, v.length > 0 && pasa(v.map((x) => x.ok))]))
  resumen.consola = errores.length === 0
  const verde = Object.values(resumen).every(Boolean)
  return { verde, puertas: resumen, detalle: puertas, celdas, errores, ms: Date.now() - t0 }
}
