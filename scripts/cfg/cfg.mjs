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
//   cfg.hoja     los tres principios (TIE-1 1a, O-1): la hoja cabe en su techo
//                (100dvh − 20 u), plegada y con «Acerca de» abierto; filas
//                ≥ 44; y lo desplegado entra en la vista aunque el cuerpo
//                desplace. Cabecera fija (cuerpo desplazable) salvo en el
//                apaisado bajo, donde se desplaza la hoja entera. Hasta TIE-1
//                1a exigía además terminar ≤ 584 sin desplazar en 360×640 (el
//                fondo de la lámina de CFG-1); la fila «Tapetes» (V6) lo pasa
//                y el rector dio la razón a la fila
//   cfg.ancla    borde derecho hoja − ⚙ = 0 y el mismo hueco ⚙→hoja que el
//                lobby, en el lobby, Retar y Rankings (1366×768 y 915×412)
//   cfg.toast    «Copiado» sale y queda por encima del velo
//   cfg.sonido   «Sonido» en la hoja cambia `ajilei.sound`; en la mesa el ⋮
//                lleva `is-off` con el sonido apagado (y el icono atenuado), y
//                encenderlo allí lo deja «Sí» en la hoja. VIS-1: el clic SUENA al
//                encender, con el espía de audio (en `vis1.mjs`)
//   cfg.version  «Acerca de» empieza por «AJILEI 0.9.0 · » + 7 hex o `local`
//   cfg.inv45    los dos botones de la sugerencia, el crédito de «Acerca de» y
//                el enlace de SumaMente en Rankings llevan
//                `data-sin-pantalla-completa` (el del intersticial, en el código)
//   cfg.sinojito sin la prop, la barra no pinta el ojito (Retar, Salas, Rankings)
//   TIE-1 1a:
//     cfg.tapetes  la fila «Tapetes» de la hoja, entre Sonido e Idioma: el disco
//                de 20 px dentro de la fila; «Verde clásico» sin inventario y
//                «Negro grafito · claro» (con el disco en grafito claro) con el
//                inventario del banco sembrado; tocarla cierra la hoja y abre
//                la tienda en Tapetes. Sus 44 los mide `cfg.hoja` (todas las
//                filas), con la hoja dentro de su techo
//     cfg.ojito  INV-69 redactado de nuevo: el ojito tapa la cifra también en
//                la tienda (la píldora tapada y con su ojito). Que la ventana
//                de compra enseñe el saldo siempre lo mide `diagDSK tienda`
//   cfg.eliminar.ventana · cfg.eliminar.mesa · cfg.eliminar.ok ·
//   cfg.salir.reinicia   CFG-1 1c: la ventana «Eliminar cuenta», sus dos
//                respuestas y O-2 (ver la sección «CFG-1 1c» de abajo)
//   CFG-1 1b (ver la sección «CFG-1 1b» de abajo):
//     cfg.zona y cfg.solape miden además Rankings y la pantalla de perfil (las
//                filas, el editor del nombre, la ventana de los 30 días y el
//                selector), y Rankings y el perfil con un nombre de 15 «M» en
//                360, 412 y 915 (los roces de §0-14 no vuelven)
//   cfg.perfil   las tres puertas (la barra desde el lobby, Retar y Salas; la
//                cabecera de la hoja ⚙ desde el lobby y Rankings; «Editar» del
//                mini-perfil propio) llevan al perfil, y la flecha vuelve a su
//                origen; la casa va al lobby; el ajeno no tiene «Editar»
//   cfg.freno    con el banco imitado: ocupado y vedado sin ventana; solo
//                mayúsculas sin ventana y sin freno; libre con ventana, y
//                después el freno con su fecha y sin viaje; el servidor frena
//                aunque el cliente no lo supiera; el lugar se guarda solo
//                (Venezuela → estado, otro país sin estado, «Prefiero no
//                decirlo») y se ve en el perfil y en la hoja ⚙
//   CFG-1 1e (en `menu1e.mjs`): cfg.menu, cfg.consulta y cfg.rapida, el ⋮ de
//                la mesa — las entradas que quedan, Mano actual de pago con el
//                banco imitado y Partida rápida con sus duraciones medidas
//   CFG-1 1d (en `correo1d.mjs`): cfg.correo, el cambio de correo — la fila, el
//                editor, los errores, los códigos, hecho y los mandos del bypass
//   VIS-1 (en `vis1.mjs`): cfg.victoria, los botones de la victoria y la
//                derrota con la escala real, y cfg.contraste, el texto atenuado
//                y «Eliminar cuenta» bajo su tinta en las pantallas del lobby
//   consola      sin errores de página

import { readFileSync } from 'node:fs'
import { contextoCap, PERFIL_CAP } from '../cap/capMesa.mjs'
import { sembradosRanking } from '../../src/dev/sembradosRanking.js'
import { crearBanco, sumarDias } from '../../src/dev/bancoImitado.js'
import { recorrerRuta } from '../rutaMesa.mjs'
import { mesa1e } from './menu1e.mjs'
import { correo1d } from './correo1d.mjs'
import { contrasteLobby, sonidoAudio, victoria } from './vis1.mjs'

const VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version
const CELDAS = [
  { w: 360, h: 640, movil: true },
  { w: 412, h: 915, movil: true },
  { w: 915, h: 412, movil: true },
  { w: 1366, h: 768, movil: false },
  { w: 1920, h: 1080, movil: false },
]
const ANCLA_CELDAS = ['1366x768', '915x412']
const ZONA_GEO = 43.5
const ZONA_EFECTIVA = 43

// Tres mesas abiertas, como el molde `opciones-3` del bypass.
const enUnRato = (s) => new Date(Date.now() + s * 1000).toISOString()
const MESAS = [[1, 4, 200, 3], [2, 2, 100, 1], [3, 5, 200, 1]].map(([n, jugadores, apuesta, sentados]) => ({
  id: `00000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`, jugadores, apuesta, sentados, expira_en: enUnRato(150),
}))

// ── La medida, en la página. Autocontenida: Playwright la serializa. ────────
// CFG-1 1b · `dentro`: sólo los tocables de esa capa (el velo del Bautizo, la
// ventana de los 30 días), porque lo de debajo está tapado a propósito. Y sólo
// lo que está en la vista: en una lista que desplaza por dentro (el selector
// de país), las opciones enteras dentro de la lista.
const MEDIR = ({ dentro = null } = {}) => {
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
  const capa = dentro ? document.querySelector(dentro) : null
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return false
    if (el.closest('[hidden], [inert]')) return false
    if (dentro && !(capa && capa.contains(el))) return false
    if (r.bottom <= 0 || r.top >= innerHeight) return false
    const lista = el.closest('.sal-desplaza')
    if (lista) {
      const rl = lista.getBoundingClientRect()
      if (r.top < rl.top - 0.5 || r.bottom > rl.bottom + 0.5) return false
    }
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
    // CFG-1 1b · la pantalla de perfil y su editor.
    ['fila', '.pf-fila'],
    ['opción', '.pf-op'],
    ['buscador', '#pf-buscar'],
    ['borrar', '[data-accion="pf-borrar"]'],
    ['confirmar', '.bautizo-card .puerta-btn'],
    ['cancelar', '[data-accion="bautizo-cancelar"]'],
    ['ventana', '.cfn-tarjeta .elc-btn'],
    // CFG-1 1d · la tarjeta del cambio de correo.
    ['campo', '.cor-card input'],
    ['enlace', '.cor-card .puerta-link'],
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
    // TIE-1 1a (O-1) · los tres principios de `cfg.hoja`: el techo que la hoja
    // se da (`max-height`, 100dvh − 20 u), y lo desplegado frente a la zona
    // visible de lo que se desplaza (el cuerpo, o la hoja en el apaisado bajo).
    techo: r2(parseFloat(cs.maxHeight)),
    cabe: rh.height <= parseFloat(cs.maxHeight) + 0.5 && rh.top >= -0.5 && rh.bottom <= innerHeight + 0.5,
    desplegado: (() => {
      const d = hoja.querySelector('.lob-acerca:not([hidden]), .cfg-sug:not([hidden])')
      if (!d) return null
      const sc = getComputedStyle(cuerpo).overflowY === 'auto' && cs.overflowY !== 'auto' ? cuerpo : hoja
      const v = sc.getBoundingClientRect(), r = d.getBoundingClientRect()
      // Entero a la vista; o, si es más alto que lo visible, empezando en ella.
      const entra = r.top >= v.top - 0.5 && (r.bottom <= v.bottom + 0.5 || r.height >= v.height - 0.5)
      return { top: r2(r.top), fondo: r2(r.bottom), visible: [r2(v.top), r2(v.bottom)], entra }
    })(),
  }
}

// TIE-1 1a · la fila «Tapetes» de la hoja: lo que dice, su disco y su «›».
const FILA_TAPETES = () => {
  const r2 = (x) => Math.round(x * 100) / 100
  const f = document.querySelector('.lob-hoja.is-on [data-accion="cfg-tapetes"]')
  if (!f) return null
  const d = f.querySelector('.vit-disco')
  const rf = f.getBoundingClientRect(), rd = d?.getBoundingClientRect()
  return {
    alto: r2(rf.height),
    valor: f.querySelector('[data-accion="cfg-tapetes-valor"]')?.textContent ?? null,
    disco: rd ? [r2(rd.width), r2(rd.height)] : [],
    discoDentro: !!rd && rd.left >= rf.left && rd.right <= rf.right && rd.top >= rf.top && rd.bottom <= rf.bottom,
    attr: d?.dataset.tapete ?? null, tono: d?.dataset.tapeteTono ?? null,
    chev: !!f.querySelector('.lob-chev'),
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

async function abrirLobby(browser, base, celda, errores, { billetera = null, antes = null, perfil = PERFIL_CAP } = {}) {
  // El banco lleva los sembrados del ranking (como `rnk`): con la lista llena
  // Rankings pinta su línea de SumaMente, que es uno de los portadores de INV-45.
  const conBanco = billetera ?? { banco: crearBanco({ usuario: perfil.username, sembrados: sembradosRanking(), saldo: 5000 }) }
  const { ctx, page } = await contextoCap(browser, { w: celda.w, h: celda.h, dpr: celda.movil ? 2 : 1, movil: celda.movil }, base, { billetera: conBanco, perfil })
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

// ── CFG-1 1c · Eliminar cuenta (rector AJILEI_CFG-1_Fase1c_v1.0.md §3.3) ────
// La Edge Function la contesta el banco imitado del contexto (`eliminarCuenta`,
// el contrato de `partida_abierta_de` + `deleteUser`) por una ruta propia,
// encima de la de `contextoCap`. Cuatro puertas:
//   cfg.eliminar.ventana  abre por portal en <body> por encima de la hoja;
//                         campo, botones y ✕ ≥ 44; cabe sin desplazarse;
//                         borrar apagado hasta la palabra (minúsculas sí,
//                         espacios no); sin oro; #root inert; foco al campo y,
//                         con Escape, de vuelta a la fila (la hoja se queda);
//                         nada viaja al servidor sin confirmar
//   cfg.eliminar.mesa     409 mesa_abierta: el toast, la ventana cerrada y la
//                         sesión intacta
//   cfg.eliminar.ok       200 (y 401, Ajuste A): ninguna clave ajilei.*,
//                         sessionStorage vacío, la sesión fuera y la Portada
//                         (lo ajeno se queda)
//   cfg.salir.reinicia    O-2: cerrar sesión en Retar y volver a entrar por el
//                         formulario aterriza en el lobby
const RUTA_ELIMINAR = /\/functions\/v1\/eliminar_cuenta/
// Los oros de `theme.css` (--gold-brand, -hover, -dim, -brand-hi, -brand-deep).
const OROS = ['232, 184, 75', '245, 204, 106', '201, 151, 58', '245, 223, 174', '172, 126, 22']
const ERROR_ESPERADO = /the server responded with a status of (401|409|500)/

const MEDIR_VENTANA = (oros) => {
  const r2 = (x) => Math.round(x * 100) / 100
  const velo = document.querySelector('.elc-velo')
  const t = document.querySelector('.elc-tarjeta')
  if (!velo || !t) return null
  const wh = (s) => { const e = t.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r2(r.width), r2(r.height)] }
  const rt = t.getBoundingClientRect()
  const oro = []
  for (const e of [velo, t, ...t.querySelectorAll('*')]) {
    const cs = getComputedStyle(e)
    for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'boxShadow']) {
      if (oros.some((g) => cs[p].includes(g))) oro.push(`${e.dataset.accion || e.className || e.tagName}.${p}`)
    }
  }
  const centro = document.elementFromPoint(rt.left + rt.width / 2, rt.top + rt.height / 2)
  return {
    enBody: velo.parentElement === document.body,
    encima: !!centro && t.contains(centro),
    z: Number(getComputedStyle(velo).zIndex),
    tarjeta: [r2(rt.width), r2(rt.height)], dentro: rt.top >= 0 && rt.bottom <= innerHeight && rt.left >= 0 && rt.right <= innerWidth,
    cabe: t.scrollHeight <= t.clientHeight + 1,
    campo: wh('.elc-campo'), cancelar: wh('.elc-cancelar'), borrar: wh('.elc-borrar'), cerrar: wh('.elc-cerrar'),
    apagado: document.querySelector('[data-accion="elc-borrar"]').disabled,
    oro, inert: document.getElementById('root').hasAttribute('inert'),
    foco: document.activeElement?.dataset?.accion ?? null,
    uuid: /[0-9a-f]{8}-[0-9a-f]{4}-/i.test(t.textContent),
  }
}

// La sesión que contesta `/auth/v1/verify` al volver a entrar: la misma forma
// que la que `contextoCap` siembra al arrancar.
function sesionDeVuelta() {
  const ahora = Math.floor(Date.now() / 1000), dura = 30 * 86400
  const user = { id: PERFIL_CAP.id, aud: 'authenticated', role: 'authenticated', email: 'cap@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  return {
    access_token: 'cap.' + Buffer.from(JSON.stringify({ sub: user.id, exp: ahora + dura })).toString('base64url') + '.cap',
    token_type: 'bearer', expires_in: dura, expires_at: ahora + dura, refresh_token: 'cap-refresh', user,
  }
}

async function abrirEliminar(browser, base, celda, errores, banco, antes = null) {
  const propios = []
  const r = await abrirLobby(browser, base, celda, propios, {
    billetera: { banco },
    antes: async (ctx, page) => {
      await ctx.route(RUTA_ELIMINAR, (ruta) => {
        if (ruta.request().method() !== 'POST') return ruta.fulfill({ status: 204 })
        // La cabecera del tope de 20 s es del cliente: `fetchConTope` la quita
        // antes de mandar. Si llegara aquí, saldría a Supabase (y pediría CORS).
        if ('x-ajilei-tope-ms' in ruta.request().headers()) banco.cuenta.fugaTope = true
        // El uid sale del token: la petición tiene que llevar el JWT de la
        // sesión (el de `contextoCap` empieza por `cap.`), no la llave pública.
        banco.cuenta.conToken = /^Bearer cap\./.test(ruta.request().headers().authorization ?? '')
        const { status, cuerpo } = banco.eliminarCuenta()
        return ruta.fulfill({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) })
      })
      if (antes) await antes(ctx, page)
    },
  })
  // El 409 / 500 de la función lo apunta Chromium como error de consola: es la
  // respuesta pedida, no un fallo de la página.
  return { ...r, volcar: () => errores.push(...propios.filter((e) => !ERROR_ESPERADO.test(e))) }
}
async function abrirVentana(page) {
  await abrirHoja(page)
  await page.click('[data-accion="eliminar-cuenta"]')
  await page.waitForSelector('.elc-tarjeta')
  await page.waitForTimeout(150)
}
const bancoCfg = () => crearBanco({ usuario: PERFIL_CAP.username, sembrados: sembradosRanking(), saldo: 5000 })
const almacenDe = (page) => page.evaluate(() => ({
  ajilei: Object.keys(localStorage).filter((k) => k.startsWith('ajilei.')).sort(),
  sesionAlmacen: sessionStorage.length,
  token: Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k)),
  ajena: localStorage.getItem('otra.cosa'),
}))

async function eliminarCuenta(browser, base, errores, anota) {
  // ── cfg.eliminar.ventana · en las cinco celdas ────────────────────────────
  for (const celda of CELDAS) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    try {
      const banco = bancoCfg()
      const a = await abrirEliminar(browser, base, celda, errores, banco)
      ctx = a.ctx
      const page = a.page
      await abrirVentana(page)
      const vacia = await page.evaluate(MEDIR_VENTANA, OROS)
      const prueba = async (texto) => { await page.fill('.elc-campo', texto); return page.evaluate(() => document.querySelector('[data-accion="elc-borrar"]').disabled) }
      const apagados = { 'ELIMINA': await prueba('ELIMINA'), ' ELIMINAR': await prueba(' ELIMINAR'), 'ELIMINAR ': await prueba('ELIMINAR ') }
      const encendidos = { 'eliminar': !(await prueba('eliminar')), 'Eliminar': !(await prueba('Eliminar')), 'ELIMINAR': !(await prueba('ELIMINAR')) }
      const lista = await page.evaluate(MEDIR_VENTANA, OROS)
      await page.keyboard.press('Escape')
      await page.waitForSelector('.elc-tarjeta', { state: 'detached', timeout: 3000 })
      await page.waitForTimeout(100)
      const trasEscape = await page.evaluate(() => ({
        hoja: !!document.querySelector('.lob-hoja.is-on'),
        foco: document.activeElement?.dataset?.accion ?? null,
        inert: document.getElementById('root').hasAttribute('inert'),
      }))
      const m = vacia
      const de44 = [m.campo, m.cancelar, m.borrar, m.cerrar].every((x) => x && x[1] >= 44 - 0.01) && m.cerrar[0] >= 44 - 0.01
      anota('eliminar.ventana',
        m.enBody && m.encima && m.z > 8 && m.dentro && m.cabe && lista.cabe && lista.tarjeta.join() === m.tarjeta.join() && de44
        && m.apagado && Object.values(apagados).every(Boolean) && Object.values(encendidos).every(Boolean)
        && m.oro.length === 0 && lista.oro.length === 0 && m.inert && m.foco === 'elc-campo' && !m.uuid
        && trasEscape.hoja && trasEscape.foco === 'eliminar-cuenta' && !trasEscape.inert && banco.cuenta.llamadas === 0,
        { celda: id, ...m, apagados, encendidos, oroListo: lista.oro, trasEscape, llamadas: banco.cuenta.llamadas })
      a.volcar()
    } catch (e) {
      anota('eliminar.ventana', false, { celda: id, error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // ── cfg.eliminar.mesa y cfg.eliminar.ok · un teléfono y un escritorio ─────
  for (const celda of [CELDAS[1], CELDAS[3]]) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    try {
      // Una sala abierta: la guarda del servidor dice que no.
      const banco = bancoCfg()
      banco.cuenta.sala = true
      const a = await abrirEliminar(browser, base, celda, errores, banco)
      ctx = a.ctx
      const page = a.page
      await abrirVentana(page)
      await page.fill('.elc-campo', 'eliminar')
      await page.click('[data-accion="elc-borrar"]')
      await page.waitForSelector('.cfg-toast.is-on', { timeout: 5000 })
      await page.waitForTimeout(150)
      const m = await page.evaluate(() => ({
        toast: document.querySelector('.cfg-toast')?.textContent ?? null,
        ventana: !!document.querySelector('.elc-tarjeta'),
        lobby: !!document.querySelector('main.lobby'),
        hoja: !!document.querySelector('.lob-hoja.is-on'),
        inert: document.getElementById('root').hasAttribute('inert'),
      }))
      const alm = await almacenDe(page)
      anota('eliminar.mesa', m.toast === 'Cierra o abandona tu mesa primero' && !m.ventana && m.lobby && m.hoja && !m.inert
        && alm.token && banco.cuenta.llamadas === 1 && !banco.cuenta.borrada,
        { celda: id, ...m, sesion: alm.token, llamadas: banco.cuenta.llamadas })
      a.volcar()
    } catch (e) {
      anota('eliminar.mesa', false, { celda: id, error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }

    // 200 en las dos celdas; en el teléfono, además, el 401 (Ajuste A: la
    // cuenta ya no está, se sale igual que con el ok).
    for (const ya of celda === CELDAS[1] ? [false, true] : [false]) {
      ctx = null
      try {
        const banco = bancoCfg()
        banco.cuenta.borrada = ya
        const a = await abrirEliminar(browser, base, celda, errores, banco)
        ctx = a.ctx
        const page = a.page
        await page.evaluate(() => {
          localStorage.setItem('ajilei.saldoOculto', 'si')
          localStorage.setItem('ajilei.claveSinCenso', '1')
          localStorage.setItem('otra.cosa', 'queda')
          sessionStorage.setItem('ajilei.recargaPorChunk', '1')
        })
        const antes = await almacenDe(page)
        await abrirVentana(page)
        await page.fill('.elc-campo', 'ELIMINAR')
        await page.keyboard.press('Enter')
        await page.waitForSelector('#entrada-correo', { state: 'attached', timeout: 10000 })
        await page.waitForTimeout(400)
        const despues = await almacenDe(page)
        const quedan = await page.evaluate(() => ({
          ventana: !!document.querySelector('.elc-tarjeta'),
          inert: document.getElementById('root').hasAttribute('inert'),
          lobby: !!document.querySelector('main.lobby'),
        }))
        anota('eliminar.ok', antes.ajilei.length >= 3 && antes.sesionAlmacen >= 1 && antes.token
          && despues.ajilei.length === 0 && despues.sesionAlmacen === 0 && !despues.token && despues.ajena === 'queda'
          && !quedan.ventana && !quedan.inert && !quedan.lobby && banco.cuenta.borrada && banco.cuenta.llamadas === 1
        && !banco.cuenta.fugaTope && banco.cuenta.conToken === true,
          { celda: id, respuesta: ya ? 401 : 200, antes, despues, ...quedan, borrada: banco.cuenta.borrada,
            fugaTope: !!banco.cuenta.fugaTope, conToken: banco.cuenta.conToken })
        a.volcar()
      } catch (e) {
        anota('eliminar.ok', false, { celda: id, respuesta: ya ? 401 : 200, error: String(e?.message ?? e).split('\n')[0] })
      } finally { await ctx?.close().catch(() => {}) }
    }
  }

  // ── cfg.salir.reinicia · O-2, en escritorio (el formulario está a la vista)
  {
    const celda = CELDAS[3]
    let ctx = null
    try {
      const banco = bancoCfg()
      const a = await abrirEliminar(browser, base, celda, errores, banco, async (c) => {
        await c.route(/\/auth\/v1\/verify/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sesionDeVuelta()) }))
      })
      ctx = a.ctx
      const page = a.page
      await page.click('[data-accion="jugar-ia"]')
      await page.waitForSelector('main.sal .sal-chip[data-accion="reto"]')
      await esperarQuieta(page)
      await abrirHoja(page)
      await page.click('[data-accion="cerrar-sesion"]')
      await page.waitForSelector('#entrada-correo', { timeout: 10000 })
      await page.fill('#entrada-correo', 'cap@example.invalid')
      await page.keyboard.press('Enter')
      await page.waitForSelector('#entrada-codigo', { timeout: 10000 })
      await page.fill('#entrada-codigo', '123456')
      await page.keyboard.press('Enter')
      await page.waitForSelector('main.lobby, main.sal', { timeout: 15000 })
      await esperarQuieta(page)
      const donde = await page.evaluate(() => ({ lobby: !!document.querySelector('main.lobby'), sal: !!document.querySelector('main.sal') }))
      anota('salir.reinicia', donde.lobby && !donde.sal, { celda: `${celda.w}x${celda.h}`, que: 'Retar → Cerrar sesión → entrar', ...donde })
      a.volcar()
    } catch (e) {
      anota('salir.reinicia', false, { error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }
}

// ── CFG-1 1b · El perfil (rector AJILEI_CFG-1_Fase1b_v1.0.md §3.6, R-17) ────
// La medida es la de siempre (`MEDIR`), en cinco estados de la pantalla: las
// filas, el editor del nombre (sólo su velo: lo de debajo está tapado), la
// ventana de los 30 días (sólo ella), el selector y el selector buscando.
const DEBEN_1B = {
  rankings: ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'chip'],
  perfil: ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'fila'],
  'perfil.editor': ['confirmar', 'cancelar'],
  'perfil.ventana': ['ventana'],
  'perfil.selector': ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'buscador', 'opción'],
  'perfil.buscando': ['casa', 'flecha', 'buscador', 'borrar', 'opción'],
}

function anotaZonas(anota, id, nombre, m, deben) {
  const cortos = m.tocables.filter((x) => Math.min(...x.zona) < ZONA_GEO || !x.efectiva || Math.min(...x.efectiva) < ZONA_EFECTIVA)
  const tipos = new Set(m.tocables.map((x) => x.tipo))
  const faltan = (deben ?? []).filter((d) => !tipos.has(d))
  anota('zona', !cortos.length && !faltan.length, { celda: id, pantalla: nombre, cortos: cortos.map((x) => [x.n, x.zona, x.efectiva]), faltan })
  // El «×» del buscador vive DENTRO del campo, en el relleno derecho que el
  // campo le reserva (R-18): ese cruce es el diseño, no un roce. Su zona propia
  // sí se mide (≥ 44, efectiva incluida).
  const solapes = m.solapes.filter((x) => !(x.a === 'buscador' && x.b === 'borrar'))
  anota('solape', solapes.length === 0, { celda: id, pantalla: nombre, solapes })
}

// Del lobby al perfil y por sus cinco estados; vuelve al lobby por la casa.
async function medirPerfil(page, { nombreNuevo = 'Jugador_Nuevo' } = {}) {
  await page.click('.lob-top [data-accion="perfil"]')
  await page.waitForSelector('.pf-cab')
  await esperarQuieta(page)
  const perfil = await page.evaluate(MEDIR)
  await page.click('[data-accion="pf-fila-nombre"]')
  await page.waitForSelector('.bautizo-card.is-edicion')
  await page.waitForTimeout(650)   // la entrada de la tarjeta (`panel-enter`, 0,55 s)
  const editor = await page.evaluate(MEDIR, { dentro: '.bautizo-overlay' })
  await page.fill('#bautizo-nombre', nombreNuevo)
  await page.press('#bautizo-nombre', 'Enter')
  await page.waitForSelector('.cfn-tarjeta')
  await page.waitForTimeout(150)
  const ventana = await page.evaluate(MEDIR, { dentro: '.cfn-velo' })
  await page.click('[data-accion="cfn-cancelar"]')
  await page.click('[data-accion="bautizo-cancelar"]')
  await page.waitForSelector('.bautizo-card', { state: 'detached' })
  await page.click('[data-accion="pf-fila-pais"]')
  await page.waitForSelector('#pf-buscar')
  await esperarQuieta(page)
  const selector = await page.evaluate(MEDIR)
  await page.fill('#pf-buscar', 'ven')
  await page.waitForSelector('[data-accion="pf-borrar"]')
  await page.waitForTimeout(150)
  const buscando = await page.evaluate(MEDIR)
  await page.click('[data-accion="casa"]')
  await page.waitForSelector('main.lobby')
  await esperarQuieta(page)
  return { perfil, 'perfil.editor': editor, 'perfil.ventana': ventana, 'perfil.selector': selector, 'perfil.buscando': buscando }
}

// `profiles` contra el banco imitado: GET la fila propia, PATCH el `update`
// con sus errores de PostgREST (código, mensaje y `hint`). `contextoCap`
// contesta siempre la fila fija; esta ruta va encima (la última gana).
async function rutaPerfil(ctx, banco, perfil = PERFIL_CAP) {
  const viajes = { patch: 0 }
  await ctx.route(/\/rest\/v1\/profiles/, async (ruta) => {
    const r = ruta.request()
    const objeto = (r.headers().accept || '').includes('vnd.pgrst.object')
    const fila = (d) => ({ ...d, id: perfil.id })
    if (r.method() === 'PATCH') {
      viajes.patch += 1
      let campos = {}
      try { campos = r.postDataJSON() } catch { campos = {} }
      const { data, error } = banco.actualizarPerfil(campos)
      if (error) {
        return ruta.fulfill({ status: error.code === '23505' ? 409 : 400, contentType: 'application/json', body: JSON.stringify(error) })
      }
      return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(objeto ? fila(data) : [fila(data)]) })
    }
    const { data } = banco.leerPerfil()
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(objeto ? fila(data) : [fila(data)]) })
  })
  return viajes
}

const ESTADO_PERFIL = () => ({
  titulo: document.querySelector('main.sal .sal-cab h1')?.textContent ?? null,
  perfil: !!document.querySelector('.pf-cab'),
  lobby: !!document.querySelector('main.lobby'),
  hoja: !!document.querySelector('.lob-hoja.is-on'),
  tarjeta: !!document.querySelector('.mp-tarjeta'),
  unir: !!document.querySelector('.sal-unir'),
  reto: !!document.querySelector('[data-accion="reto"]'),
  ranking: document.querySelector('main.sal')?.dataset.ranking ?? null,
})

const AVISO = () => document.querySelector('[data-accion="aviso-nombre"]')?.textContent ?? ''

async function perfilDe1b(browser, base, errores, anota) {
  // ── cfg.zona / cfg.solape · 15 «M» en la barra, en Rankings y en el perfil
  const ANCHO = { id: PERFIL_CAP.id, username: 'MMMMMMMMMMMMMMM' }
  for (const celda of [CELDAS[0], CELDAS[1], CELDAS[2]]) {
    const id = `${celda.w}x${celda.h}·15M`
    let ctx = null
    try {
      ;({ ctx } = await abrirLobby(browser, base, celda, errores, { perfil: ANCHO }))
      const page = ctx.pages()[0]
      await page.click('[data-accion="rankings"]')
      await page.waitForSelector('main.sal[data-ranking][data-rnk-estado="listo"]', { timeout: 15000 })
      await esperarQuieta(page)
      anotaZonas(anota, id, 'rankings', await page.evaluate(MEDIR), DEBEN_1B.rankings)
      await page.click('[data-accion="casa"]')
      await page.waitForSelector('main.lobby')
      await esperarQuieta(page)
      for (const [nombre, m] of Object.entries(await medirPerfil(page))) anotaZonas(anota, id, nombre, m, DEBEN_1B[nombre])
    } catch (e) {
      anota('zona', false, { celda: id, error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // ── cfg.perfil · las tres puertas y la vuelta ─────────────────────────────
  for (const celda of [CELDAS[1], CELDAS[3]]) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    let paso = ''
    try {
      ;({ ctx } = await abrirLobby(browser, base, celda, errores))
      const page = ctx.pages()[0]
      const estado = () => page.evaluate(ESTADO_PERFIL)
      const alPerfil = async () => { paso += ' perfil'; await page.waitForSelector('.pf-cab'); await page.waitForTimeout(200); return estado() }
      const volver = async (sel) => { paso += ` volver→${sel}`; await page.click('[data-accion="volver"]'); await page.waitForSelector(sel, { timeout: 10000 }); await esperarQuieta(page); return estado() }
      const casa = async () => { await page.click('[data-accion="casa"]'); await page.waitForSelector('main.lobby'); await esperarQuieta(page) }

      // La barra, desde el lobby, Retar y Salas.
      await page.click('.lob-top [data-accion="perfil"]')
      const a1 = await alPerfil(); const v1 = await volver('main.lobby')
      anota('perfil', a1.perfil && a1.titulo === 'Perfil' && v1.lobby, { celda: id, puerta: 'barra desde el lobby', llega: a1, vuelve: v1 })
      await irRetar(page)
      await page.click('.lob-top [data-accion="perfil"]')
      const a2 = await alPerfil(); const v2 = await volver('[data-accion="reto"]')
      anota('perfil', a2.perfil && v2.reto && !v2.perfil, { celda: id, puerta: 'barra desde Retar', llega: a2, vuelve: v2 })
      await casa()
      await page.click('[data-accion="jugar-pvp"]')
      await page.waitForSelector('main.sal .sal-unir', { timeout: 15000 })
      await page.click('.lob-top [data-accion="perfil"]')
      const a3 = await alPerfil(); const v3 = await volver('main.sal .sal-unir')
      anota('perfil', a3.perfil && v3.unir && !v3.perfil, { celda: id, puerta: 'barra desde Salas', llega: a3, vuelve: v3 })
      await casa()

      // La cabecera de la hoja ⚙, desde el lobby y desde Rankings.
      await abrirHoja(page)
      const boton = await page.$eval('[data-accion="cfg-perfil"]', (e) => ({ tag: e.tagName, h: e.getBoundingClientRect().height, chev: !!e.querySelector('.cfg-chev') }))
      await page.click('[data-accion="cfg-perfil"]')
      const a4 = await alPerfil(); const v4 = await volver('main.lobby')
      anota('perfil', boton.tag === 'BUTTON' && boton.h >= 44 - 0.01 && boton.chev && a4.perfil && !a4.hoja && v4.lobby && !v4.hoja,
        { celda: id, puerta: 'cabecera de la hoja desde el lobby', boton, llega: a4, vuelve: v4 })
      await page.click('[data-accion="rankings"]')
      await page.waitForSelector('main.sal[data-ranking][data-rnk-estado="listo"]', { timeout: 15000 })
      await abrirHoja(page)
      await page.click('[data-accion="cfg-perfil"]')
      const a5 = await alPerfil(); const v5 = await volver('main.sal[data-ranking][data-rnk-estado="listo"]')
      anota('perfil', a5.perfil && !a5.hoja && v5.ranking === 'maestros', { celda: id, puerta: 'cabecera de la hoja desde Rankings', llega: a5, vuelve: v5 })

      // «Editar» del mini-perfil propio; el ajeno no lo tiene.
      await page.click('.rnk-filas .rnk-fila[data-puesto="3"]')
      await page.waitForSelector('.mp-velo[data-mp-estado="listo"]')
      const ajeno = await page.evaluate(() => document.querySelectorAll('.mp-editar').length)
      await page.keyboard.press('Escape')
      // La cuenta del arnés no tiene puntos: la banda es «Gana tu primera mano…», que también abre la tuya.
      await page.click('.rnk-tu .rnk-fila, .rnk-tu [data-accion="rnk-tu-abre"]')
      await page.waitForSelector('.mp-velo[data-mp-estado="listo"]')
      const editar = await page.$eval('.mp-editar', (e) => ({ encendido: !e.disabled, pronto: !!e.querySelector('span'), h: e.getBoundingClientRect().height }))
      await page.click('[data-accion="mp-editar"]')
      const a6 = await alPerfil(); const v6 = await volver('main.sal[data-ranking][data-rnk-estado="listo"]')
      anota('perfil', ajeno === 0 && editar.encendido && !editar.pronto && editar.h >= 44 - 0.01 && a6.perfil && !a6.tarjeta && v6.ranking === 'maestros' && !v6.tarjeta,
        { celda: id, puerta: '«Editar» del mini-perfil propio', ajeno, editar, llega: a6, vuelve: v6 })

      // La casa del perfil va al lobby, venga de donde venga.
      await page.click('.lob-top [data-accion="perfil"]')
      await alPerfil()
      await casa()
      anota('perfil', (await estado()).lobby, { celda: id, puerta: 'casa del perfil (desde Rankings)' })
    } catch (e) {
      anota('perfil', false, { celda: id, paso, error: String(e?.message ?? e).split('\n').slice(0, 3).join(' | ') })
    } finally { await ctx?.close().catch(() => {}) }
  }

  // ── cfg.freno · el nombre y el lugar contra el banco imitado ──────────────
  for (const celda of [CELDAS[0], CELDAS[3]]) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    const propios = []
    try {
      const banco = bancoCfg()
      let viajes = null
      // Los 409 (ocupado) y 400 (vedado, el freno) son las respuestas pedidas:
      // Chromium las apunta en la consola, no son fallos de la página.
      ;({ ctx } = await abrirLobby(browser, base, celda, propios, {
        billetera: { banco },
        antes: async (c) => { viajes = await rutaPerfil(c, banco) },
      }))
      const page = ctx.pages()[0]
      await page.click('.lob-top [data-accion="perfil"]')
      await page.waitForSelector('.pf-cab')
      const abrirEditor = async () => {
        await page.click('[data-accion="pf-fila-nombre"]')
        await page.waitForSelector('.bautizo-card.is-edicion')
        await page.waitForTimeout(200)
      }
      const probar = async (nombre, espera) => {
        await page.fill('#bautizo-nombre', nombre)
        await page.press('#bautizo-nombre', 'Enter')
        await page.waitForFunction(espera, null, { timeout: 5000 })
        await page.waitForTimeout(150)
        return { ventana: !!(await page.$('.cfn-tarjeta')), aviso: await page.evaluate(AVISO), editor: !!(await page.$('.bautizo-card')) }
      }

      // Ocupado y vedado: sin ventana, con su texto, y el freno sin gastar.
      await abrirEditor()
      const ocupado = await probar('ElCatire88', () => /tomado/.test(document.querySelector('[data-accion="aviso-nombre"]')?.textContent ?? ''))
      const vedado = await probar('Ajilei_Oficial', () => /permitido/.test(document.querySelector('[data-accion="aviso-nombre"]')?.textContent ?? ''))
      anota('freno', !ocupado.ventana && !vedado.ventana && ocupado.editor && vedado.editor && banco.perfil.nombre_cambiado_en === null && banco.usuario === PERFIL_CAP.username,
        { celda: id, caso: 'ocupado y vedado: sin ventana', ocupado, vedado, cambiado: banco.perfil.nombre_cambiado_en })

      // Solo mayúsculas: sin ventana y sin freno.
      const mayus = PERFIL_CAP.username.toLowerCase()
      await page.fill('#bautizo-nombre', mayus)
      await page.press('#bautizo-nombre', 'Enter')
      await page.waitForSelector('.bautizo-card', { state: 'detached', timeout: 5000 })
      const trasMayus = await page.evaluate(() => ({ fila: document.querySelector('[data-accion="pf-fila-nombre"]')?.textContent ?? '', toast: document.querySelector('.sal-toast.is-on')?.textContent ?? null }))
      anota('freno', banco.usuario === mayus && banco.perfil.nombre_cambiado_en === null && !/Próximo cambio/.test(trasMayus.fila),
        { celda: id, caso: 'solo mayúsculas: sin ventana y sin freno', usuario: banco.usuario, cambiado: banco.perfil.nombre_cambiado_en, ...trasMayus })

      // Libre: la ventana; «Cambiar» guarda y pone el freno con su fecha.
      await abrirEditor()
      const libre = await probar('Jugador_Nuevo', () => !!document.querySelector('.cfn-tarjeta'))
      const antes = viajes.patch
      await page.click('[data-accion="cfn-cambiar"]')
      await page.waitForSelector('.bautizo-card', { state: 'detached', timeout: 5000 })
      await page.waitForFunction(() => /Próximo cambio/.test(document.querySelector('[data-accion="pf-fila-nombre"]')?.textContent ?? ''), null, { timeout: 5000 })
      const hasta = new Date(Date.parse(banco.perfil.nombre_cambiado_en) + 30 * 86400000)
      const fecha = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(hasta)
      const tras = await page.evaluate(() => ({ fila: document.querySelector('[data-accion="pf-fila-nombre"]')?.textContent ?? '', toast: document.querySelector('.sal-toast.is-on')?.textContent ?? null, barra: document.querySelector('.lob-top .lob-nombre')?.textContent ?? null }))
      anota('freno', libre.ventana && viajes.patch === antes + 1 && banco.usuario === 'Jugador_Nuevo' && tras.fila.includes(`Próximo cambio: ${fecha}`)
        && tras.toast === 'Listo: ahora eres Jugador_Nuevo' && tras.barra === 'Jugador_Nuevo',
        { celda: id, caso: 'libre: ventana, cambio y fecha', ventana: libre.ventana, patch: viajes.patch - antes, fecha, ...tras })

      // Con el freno puesto: el editor quieto, la fecha, «Cerrar»; ni un viaje.
      await abrirEditor()
      const quieto = await page.evaluate(() => ({
        campo: document.querySelector('#bautizo-nombre')?.disabled, confirmar: document.querySelector('.bautizo-card .puerta-btn')?.disabled,
        aviso: document.querySelector('[data-accion="aviso-nombre"]')?.textContent ?? '', boton: document.querySelector('[data-accion="bautizo-cancelar"]')?.textContent ?? '',
      }))
      const p0 = viajes.patch
      await page.press('#bautizo-nombre', 'Enter').catch(() => {})
      await page.waitForTimeout(300)
      anota('freno', quieto.campo && quieto.confirmar && quieto.aviso === `Podrás cambiarlo de nuevo el ${fecha}.` && quieto.boton === 'Cerrar' && viajes.patch === p0,
        { celda: id, caso: 'bloqueado: quieto, fecha y sin viaje', ...quieto, viajes: viajes.patch - p0 })
      await page.click('[data-accion="bautizo-cancelar"]')
      await page.waitForSelector('.bautizo-card', { state: 'detached' })

      // El lugar: Venezuela → estados con «Sin estado» marcado → Zulia; España; «Prefiero no decirlo».
      await page.click('[data-accion="pf-fila-pais"]')
      await page.waitForSelector('#pf-buscar')
      await page.click('[data-accion="pf-op"][data-pais="VE"]')
      await page.waitForSelector('[data-accion="pf-op-sinestado"]')
      const sinEstado = await page.$eval('[data-accion="pf-op-sinestado"]', (e) => e.getAttribute('aria-selected'))
      const tras1 = { ...banco.perfil }
      await page.click('[data-accion="pf-op-estado"]:has-text("Zulia")')
      await page.waitForSelector('.pf-cab')
      await page.waitForTimeout(150)
      const cab = await page.evaluate(() => ({ texto: document.querySelector('.pf-lugar')?.textContent ?? '', pais: document.querySelector('.pf-lugar img')?.dataset.pais ?? null, toast: document.querySelector('.sal-toast.is-on')?.textContent ?? null }))
      await abrirHoja(page)
      const hoja = await page.evaluate(() => { const i = document.querySelector('.lob-hoja-cuenta img.cfg-band'); return { pais: i?.dataset.pais ?? null, texto: !!document.querySelector('.lob-hoja-cuenta .pf-lugar, .lob-hoja-cuenta .rnk-lugar-t') } })
      await cerrarHoja(page)
      const ve = { pais: banco.perfil.pais, estado: banco.perfil.estado }
      await page.click('[data-accion="pf-fila-pais"]')
      await page.waitForSelector('#pf-buscar')
      await page.fill('#pf-buscar', 'espana')
      await page.click('[data-accion="pf-op"][data-pais="ES"]')
      await page.waitForSelector('.pf-cab')
      const es = { pais: banco.perfil.pais, estado: banco.perfil.estado }
      await page.click('[data-accion="pf-fila-pais"]')
      await page.waitForSelector('#pf-buscar')
      await page.click('[data-accion="pf-op-nada"]')
      await page.waitForSelector('.pf-cab')
      await page.waitForTimeout(150)
      const nada = { pais: banco.perfil.pais, estado: banco.perfil.estado, iso: await page.$eval('.pf-lugar img', (i) => i.classList.contains('es-iso')) }
      anota('freno', sinEstado === 'true' && tras1.pais === 'VE' && tras1.estado === null && ve.pais === 'VE' && ve.estado === 'ZUL'
        && cab.texto === 'Venezuela · Zulia' && cab.pais === 'VE' && cab.toast === 'Guardado' && hoja.pais === 'VE' && !hoja.texto
        && es.pais === 'ES' && es.estado === null && nada.pais === null && nada.estado === null && nada.iso,
        { celda: id, caso: 'el lugar se guarda solo', sinEstado, alElegirVenezuela: tras1.pais + '/' + tras1.estado, ve, cab, hoja, es, nada })
    } catch (e) {
      anota('freno', false, { celda: id, error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }

    // El servidor frena aunque el cliente no lo supiera (otro aparato cambió el nombre).
    ctx = null
    try {
      const banco = bancoCfg()
      ;({ ctx } = await abrirLobby(browser, base, celda, propios, { billetera: { banco }, antes: async (c) => { await rutaPerfil(c, banco) } }))
      const page = ctx.pages()[0]
      await page.click('.lob-top [data-accion="perfil"]')
      await page.waitForSelector('.pf-cab')
      await page.waitForTimeout(300)
      banco.nombreCambiadoHace(2 * 86400000)
      await page.click('[data-accion="pf-fila-nombre"]')
      await page.waitForSelector('.bautizo-card.is-edicion')
      const libreAntes = await page.$eval('#bautizo-nombre', (e) => !e.disabled)
      await page.fill('#bautizo-nombre', 'Jugador_Otro')
      await page.press('#bautizo-nombre', 'Enter')
      await page.waitForSelector('.cfn-tarjeta')
      await page.click('[data-accion="cfn-cambiar"]')
      // No basta con `disabled`: mientras dice «Guardando…» el campo también lo está.
      await page.waitForFunction(() => /Podrás/.test(document.querySelector('[data-accion="aviso-nombre"]')?.textContent ?? ''), null, { timeout: 5000 })
      const hasta = new Date(Math.floor((Date.parse(banco.perfil.nombre_cambiado_en) + 30 * 86400000) / 1000) * 1000)
      const fecha = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(hasta)
      const r = await page.evaluate(() => ({ aviso: document.querySelector('[data-accion="aviso-nombre"]')?.textContent ?? '', campo: document.querySelector('#bautizo-nombre')?.value, boton: document.querySelector('[data-accion="bautizo-cancelar"]')?.textContent ?? '' }))
      anota('freno', libreAntes && r.aviso === `Podrás cambiarlo de nuevo el ${fecha}.` && r.campo === PERFIL_CAP.username && r.boton === 'Cerrar' && banco.usuario === PERFIL_CAP.username,
        { celda: id, caso: 'AJ030 del servidor: el editor pasa a bloqueado con la fecha del hint', libreAntes, fecha, ...r })
    } catch (e) {
      anota('freno', false, { celda: id, caso: 'AJ030', error: String(e?.message ?? e).split('\n')[0] })
    } finally { await ctx?.close().catch(() => {}) }
    errores.push(...propios.filter((e) => !/the server responded with a status of (400|409)/.test(e)))
  }
}

// `baseDev`: el servidor de desarrollo con bypass (en `humo`, el suyo; con `cfg`
// a solas, el auxiliar). Sólo lo usa el caso «contra humanos» de cfg.menu.
export async function runCfg(browser, { base, baseDev = null }) {
  const t0 = Date.now()
  const errores = []
  const celdas = []
  const puertas = {
    zona: [], solape: [], ojito: [], hoja: [], ancla: [], toast: [], sonido: [], version: [], inv45: [], sinojito: [], tapetes: [],
    'eliminar.ventana': [], 'eliminar.mesa': [], 'eliminar.ok': [], 'salir.reinicia': [],
    perfil: [], freno: [],
    menu: [], consulta: [], rapida: [],
    correo: [],
    victoria: [], contraste: [],
  }
  const DE_LA_1C = ['eliminar.ventana', 'eliminar.mesa', 'eliminar.ok', 'salir.reinicia', 'perfil', 'freno', 'menu', 'consulta', 'rapida', 'correo', 'victoria', 'contraste']
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
      const filaTap = await page.evaluate(FILA_TAPETES)
      const orden = hojaLobby.filas.map(([a]) => a)
      anota('tapetes', filaTap && orden.indexOf('cfg-tapetes') === orden.indexOf('cfg-sonido') + 1 && orden.indexOf('cfg-idioma') === orden.indexOf('cfg-tapetes') + 1
        && filaTap.valor === 'Verde clásico' && filaTap.disco.join() === '20,20' && filaTap.discoDentro && filaTap.chev
        && filaTap.attr === null && filaTap.tono === null,
        { celda: id, que: 'entre Sonido e Idioma, «Verde clásico», disco de 20', orden, ...filaTap })
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
        // TIE-1 1a (O-1, rector): sin el 584 literal de la lámina de CFG-1. La
        // hoja cabe en su techo, plegada y con «Acerca de» abierto, y lo
        // desplegado entra en la vista aunque el cuerpo desplace.
        && hojaLobby.cabe && hojaAcerca.cabe && hojaAcerca.desplegado?.entra === true,
        { celda: id, plegada: hojaLobby.alto, acerca: hojaAcerca.alto, techo: hojaAcerca.techo, fondoAcerca: hojaAcerca.fondo, desplegado: hojaAcerca.desplegado,
          cuerpoDesplaza: hojaAcerca.cuerpoDesplaza, hojaDesplaza: hojaAcerca.hojaDesplaza, desplazable: hojaLobby.desplazable, esperado, filas: hojaLobby.filas, botones })
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
      // TIE-1 1a · INV-69: la tienda lo obedece (la píldora tapada, con ojito).
      await page.click('.lob-nav-tienda')
      await page.waitForSelector('[data-tienda="tapetes"]', { timeout: 15000 })
      await esperarQuieta(page)
      const tieCifra = await page.evaluate(CIFRA)
      const tieOjito = await page.evaluate(() => !!document.querySelector('.lob-pildora [data-accion="ojito"]'))
      anota('ojito', tieCifra?.tapada === true && tieCifra.puntos && tieCifra.digitosOcultos && tieOjito,
        { celda: id, que: 'Tienda: la cifra tapada con el ojito cerrado (INV-69)', cifra: tieCifra, ojito: tieOjito })
      await page.click('[data-accion="casa"]')
      await page.waitForSelector('main.lobby'); await esperarQuieta(page)
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

      // ── 5b · CFG-1 1b · La pantalla de perfil ───────────────────────────
      const pf = await medirPerfil(page)
      c.pantallas.perfil = pf
      anota('ojito', !rnk.ojito && rnkCifra && !rnkCifra.tapada && /\d/.test(rnkCifra.texto), { celda: id, que: 'Rankings: sin ojito y la cifra a la vista con el ojito cerrado', ojito: rnk.ojito, cifra: rnkCifra?.texto })

      // ── Las puertas de zona, solape, ancla y sinojito de la celda ───────
      const DEBEN = {
        lobby: ['⚙', 'avatar', '«+»', 'ojito'],
        retar: ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'chip', '±'],
        salas: ['⚙', 'avatar', '«+»', 'casa', 'flecha', 'Unirme'],
        ...DEBEN_1B,
      }
      for (const [nombre, m] of [['lobby', lobby], ['retar', retar], ['salas', salas], ['rankings', rnk], ...Object.entries(pf)]) {
        anotaZonas(anota, id, nombre, m, DEBEN[nombre])
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
      for (const p of Object.keys(puertas)) if (!['ancla', ...DE_LA_1C].includes(p)) anota(p, false, { celda: id, error: c.error })
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

  // ── 6b · TIE-1 1a · la fila «Tapetes» con inventario, y su puerta ────────
  for (const celda of [CELDAS[0], CELDAS[3]]) {
    const id = `${celda.w}x${celda.h}`
    let ctx = null
    try {
      const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo: 5000 })
      banco.sembrarInventario([{ articulo: 'grafito', tono: 'claro', en_uso: true }, { articulo: 'azul', tono: 'actual' }])
      ;({ ctx } = await abrirLobby(browser, base, celda, errores, { billetera: { banco } }))
      const page = ctx.pages()[0]
      await abrirHoja(page)
      // El canal contesta al entrar la cuenta: la fila pasa de la copia al servidor.
      await page.waitForFunction(() => document.querySelector('[data-accion="cfg-tapetes-valor"]')?.textContent === 'Negro grafito · claro', null, { timeout: 8000 }).catch(() => {})
      const fila = await page.evaluate(FILA_TAPETES)
      await page.click('[data-accion="cfg-tapetes"]')
      await page.waitForSelector('[data-tienda="tapetes"]', { timeout: 15000 })
      await esperarQuieta(page)
      const llega = await page.evaluate(() => ({
        tienda: document.querySelector('[data-tienda]')?.dataset.tienda ?? null,
        hoja: !!document.querySelector('.lob-hoja.is-on'),
        enUso: document.querySelector('[data-tap="grafito"] [data-accion="tie-enuso"]') !== null,
      }))
      anota('tapetes', fila?.valor === 'Negro grafito · claro' && fila.attr === 'grafito' && fila.tono === 'claro'
        && llega.tienda === 'tapetes' && !llega.hoja && llega.enUso,
        { celda: id, que: 'con inventario: «Negro grafito · claro» → la tienda en Tapetes', fila, llega })
    } catch (e) {
      anota('tapetes', false, { celda: id, que: 'con inventario', error: String(e?.message ?? e).split('\n')[0] })
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

  // ── 9 · CFG-1 1c · Eliminar cuenta y O-2 ──────────────────────────────────
  await eliminarCuenta(browser, base, errores, anota)

  // ── 10 · CFG-1 1b · 15 «M», las tres puertas y el freno ──────────────────
  await perfilDe1b(browser, base, errores, anota)

  // ── 11 · CFG-1 1e · el ⋮ de la mesa: entradas, Mano actual y Partida rápida ─
  await mesa1e(browser, { base, baseDev }, errores, anota)

  // ── 12 · CFG-1 1d · el cambio de correo ───────────────────────────────────
  await correo1d(browser, { base, baseDev }, errores, anota, {
    abrirLobby, MEDIR, esperarQuieta, perfil: PERFIL_CAP,
    bancoCon: (correo) => crearBanco({ usuario: PERFIL_CAP.username, sembrados: sembradosRanking(), saldo: 5000, correo }),
  })

  // ── 13 · VIS-1 · fin de mesa, contraste y el clic del sonido ──────────────
  await victoria(browser, baseDev, anota)
  await contrasteLobby(browser, { base, baseDev }, errores, anota, { abrirLobby, abrirHoja, irRetar })
  await sonidoAudio(browser, base, errores, anota, { abrirLobby, abrirHoja })

  const resumen = Object.fromEntries(Object.entries(puertas).map(([k, v]) => [`cfg.${k}`, v.length > 0 && pasa(v.map((x) => x.ok))]))
  resumen.consola = errores.length === 0
  const verde = Object.values(resumen).every(Boolean)
  return { verde, puertas: resumen, detalle: puertas, celdas, errores, ms: Date.now() - t0 }
}
