// ── TIE-1 1a · el modo `tienda` de diagDSK ──────────────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.5. Vive en su módulo, como `cfg`,
// `rnk` y `suma`; diagDSK sólo lo llama y lee su veredicto por `verde`.
//
// CONTRA EL BUNDLE REAL (4173) con la sesión simulada de `contextoCap` y el
// banco imitado por contexto (el contrato de `20261031150000_tie1a_inventario`
// en JS): la tienda se abre por el «+» del lobby, como la abrirá el jugador.
//
// LA MEDIDA DE LOS TOCABLES ES LA DE `cfg` (y la de la lámina 1a-L): zona
// GEOMÉTRICA (caja ∪ `::after`) ≥ 43,5 y zona EFECTIVA (barrido en cruz con
// `elementFromPoint`, tope 600) ≥ 43, y ningún solape entre dos zonas.
//
// LAS PUERTAS (cada una con su nombre; una celda sin medir es roja):
//   tie.zona      ≥ 44 en estantes, filas, «Usar», muestras de tono, CTA,
//                 enlace «Conseguir monedas», botones de la ventana, flecha,
//                 casa, «+», ⚙ y ojito, en los seis tamaños (Monedas, Tapetes,
//                 la vista del grafito y la ventana)
//   tie.solape    cero solape entre zonas, en las mismas vistas
//   tie.estantes  los cinco, en su orden, uno con `aria-pressed`; los tres
//                 últimos «Pronto»; bajo 760 de ancho la fila desplaza y el
//                 activo está entero a la vista; de 760 en adelante, no desplaza
//   tie.puerta    vitrina ↔ mesa: `body` con `data-tapete`/`data-tapete-tono` y
//                 una `.vit` con los mismos, los 9 valores (8 tokens del tapete
//                 en `body` y `.vit`, y `--luz-k` en `.game-table-screen` y en
//                 `.vit-fondo`) iguales en los 11 casos (INV-77)
//   tie.ventana   los cuatro estados: «confirmar» con Precio · Tu saldo · Te
//                 quedarán; «comprando» con `aria-busy` y los botones quietos;
//                 «listo» (vista en «✓ En uso», aviso, píldora y banco al día);
//                 «error» (la línea O1, el saldo intacto) y el reintento que sí
//   tie.falta     4.000 HC frente al vinotinto: CTA atenuado, «No te alcanza:
//                 faltan 21.000 HC» y el enlace lleva al estante Monedas
//   tie.ojito     la píldora de la tienda tapa la cifra (INV-69 de la 1a) y la
//                 ventana enseña el saldo igual
//   tie.inventario  con grafito oscuro en uso y azul comprado: la lista dice
//                 «✓ En uso» / «Usar» / precio; «Usar» y un tono cambian el
//                 servidor y la vitrina sólo con su «ok»
//   tie.contraste VIS-1, la gemela de `cfg.contraste`: el texto del token ≥ 4,5
//                 bajo su tinta en Monedas, Tapetes y la vista del artículo sin saldo
//                 («No te alcanza», INV-79), y el rótulo de la vitrina a 0,55, igual que el de la mesa (INV-77)
//   consola       sin errores de página
//
// Capturas en `capturas-dsk/tienda/` (regenerables).

import { mkdirSync } from 'node:fs'
import { contextoCap, PERFIL_CAP } from '../cap/capMesa.mjs'
import { crearBanco } from '../../src/dev/bancoImitado.js'
import { QUIETA_CSS, esTenue, medirAtenuados } from '../arnes/tinta.mjs'

const CELDAS = [
  { w: 1920, h: 1080, movil: false },
  { w: 1366, h: 768, movil: false },
  { w: 390, h: 844, movil: true },
  { w: 360, h: 640, movil: true },
  { w: 412, h: 915, movil: true },
  { w: 915, h: 412, movil: true },
]
const ZONA_GEO = 43.5
const ZONA_EFECTIVA = 43
const SALDO = 31400
const OUT = 'capturas-dsk/tienda'
const TOKENS = ['--green-abyss', '--green-darkest', '--green-deep', '--green-base', '--green-bright',
  '--surface-game', '--surface-area', '--surface-area-light']

const esperarQuieta = (page) => page.waitForTimeout(450)

// Los tocables de la tienda, medidos como en `cfg`. `dentro`: sólo los de esa
// capa (la ventana tapa el resto con su velo).
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
    if (dentro && !(capa && capa.contains(el))) return false
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return false
    // Lo que el cuerpo desplazable deja fuera, o a medias, no se toca ahí: se
    // toca tras desplazar, y entonces se mide (el criterio de `.sal-desplaza`
    // en `cfg`).
    const cuerpo = el.closest('.sal-cuerpo')
    if (cuerpo && !el.closest('.sal-accion')) {
      const rc = cuerpo.getBoundingClientRect()
      if (r.top < rc.top - 0.5 || r.bottom > Math.min(rc.bottom, innerHeight) + 0.5) return false
    }
    // Un estante que la fila desplazable deja fuera (o a medias) no se toca ahí.
    const fila = el.closest('.tie-estantes')
    if (fila) {
      const rf = fila.getBoundingClientRect()
      if (r.left < rf.left - 0.5 || r.right > rf.right + 0.5) return false
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
    ['estante', '.tie-estante'],
    ['video', '.tie-monedas [data-accion="video-pedir"]'],
    ['fila', '.tie-art-abre'],
    ['usar', '.tie-usar'],
    ['tono', '.tie-tono'],
    ['cta', '.sal-accion [data-accion="cta"]'],
    ['enlace', '.tie-enlace'],
    ['ventana', '.tie-ven-btn'],
  ]
  const ts = []
  for (const [n, sel] of TOCABLES) {
    for (const el of $$(sel)) {
      if (!visible(el)) continue
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 16)
      ts.push({ n: `${n}:${el.dataset.accion || ''} ${txt}`.trim(), tipo: n, el, geo: zonaGeo(el), efectiva: zonaEfectiva(el) })
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
  return {
    tocables: ts.map((t) => ({ n: t.n, tipo: t.tipo, caja: wh(caja(t.el.getBoundingClientRect())), zona: wh(t.geo), efectiva: t.efectiva })),
    solapes,
  }
}

// Los estantes: su orden, cuál está pulsado, y si la fila desplaza.
const ESTANTES = () => {
  const fila = document.querySelector('.tie-estantes')
  if (!fila) return null
  const bs = [...fila.querySelectorAll('.tie-estante')]
  const rf = fila.getBoundingClientRect()
  const activo = bs.find((b) => b.getAttribute('aria-pressed') === 'true')
  const ra = activo?.getBoundingClientRect()
  return {
    ids: bs.map((b) => b.dataset.accion.replace('tie-estante-', '')),
    pronto: bs.filter((b) => b.getAttribute('aria-disabled') === 'true').map((b) => b.dataset.accion.replace('tie-estante-', '')),
    pulsados: bs.filter((b) => b.getAttribute('aria-pressed') === 'true').length,
    activo: activo?.dataset.accion.replace('tie-estante-', '') ?? null,
    desplaza: fila.scrollWidth > fila.clientWidth + 0.5,
    activoEntero: !!ra && ra.left >= rf.left - 0.5 && ra.right <= rf.right + 0.5,
  }
}

// La puerta vitrina ↔ mesa, en la misma página (molde: laminas/tie1a/medir.js).
const PUERTA = (TOKENS) => {
  const mesa = document.createElement('div'); mesa.className = 'game-table-screen'; mesa.style.display = 'none'
  const vit = document.createElement('div'); vit.className = 'vit'; vit.style.display = 'none'
  const fondo = document.createElement('div'); fondo.className = 'vit-fondo'; vit.append(fondo)
  document.body.append(mesa, vit)
  const prev = { t: document.body.dataset.tapete, n: document.body.dataset.tapeteTono }
  const filas = []
  for (const id of ['verde', 'grafito', 'azul', 'vinotinto', 'tricolor']) {
    const tonos = ['grafito', 'azul', 'vinotinto'].includes(id) ? ['claro', 'actual', 'oscuro'] : ['actual']
    for (const tn of tonos) {
      for (const el of [document.body, vit]) {
        if (id === 'verde') delete el.dataset.tapete; else el.dataset.tapete = id
        if (tn === 'actual') delete el.dataset.tapeteTono; else el.dataset.tapeteTono = tn
      }
      const a = TOKENS.map((t) => getComputedStyle(document.body).getPropertyValue(t).trim()).concat(getComputedStyle(mesa).getPropertyValue('--luz-k').trim())
      const b = TOKENS.map((t) => getComputedStyle(vit).getPropertyValue(t).trim()).concat(getComputedStyle(fondo).getPropertyValue('--luz-k').trim())
      const distintos = a.map((v, i) => (v === b[i] && v !== '' ? null : [i < 8 ? TOKENS[i] : '--luz-k', v, b[i]])).filter(Boolean)
      filas.push({ caso: `${id}/${tn}`, iguales: distintos.length === 0, luzK: a[8], base: a[3], distintos })
    }
  }
  if (prev.t) document.body.dataset.tapete = prev.t; else delete document.body.dataset.tapete
  if (prev.n) document.body.dataset.tapeteTono = prev.n; else delete document.body.dataset.tapeteTono
  mesa.remove(); vit.remove()
  return filas
}

const CIFRA = () => {
  const pil = document.querySelector('.lob-pildora')
  const num = pil?.querySelector('.bd-num')
  return num ? { texto: num.textContent.replace(/\s+/g, ''), tapada: pil.hasAttribute('data-saldo-oculto') } : null
}

// `ruido`: lo que el propio arnés provoca en la consola (el 503 de un corte) y
// no es un error de la página.
async function abrirTienda(browser, base, celda, errores, { saldo = SALDO, inventario = null, billetera = {}, ruido = null } = {}) {
  const banco = crearBanco({ usuario: PERFIL_CAP.username, saldo })
  if (inventario) banco.sembrarInventario(inventario)
  const conBanco = { banco, ...billetera }
  const { ctx, page } = await contextoCap(browser, { w: celda.w, h: celda.h, dpr: celda.movil ? 2 : 1, movil: celda.movil }, base, { billetera: conBanco })
  const id = `${celda.w}x${celda.h}`
  page.on('pageerror', (e) => errores.push(`${id} pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !(ruido && ruido.test(m.text()))) errores.push(`${id} console: ${m.text()}`) })
  await page.goto(base)
  await page.waitForSelector('main.lobby .lob-pildora .bd-num', { timeout: 30000 })
  await page.waitForFunction(() => /\d/.test(document.querySelector('.lob-pildora .bd-num')?.textContent ?? ''), null, { timeout: 15000 })
  await page.click('.lob-pildora .lob-mas')
  await page.waitForSelector('[data-tienda="monedas"][data-tie-cargado]', { timeout: 15000 })
  await esperarQuieta(page)
  return { ctx, page, banco, billetera: conBanco }
}

async function irEstante(page, id) {
  await page.click(`[data-accion="tie-estante-${id}"]`)
  await page.waitForSelector(`[data-tienda="${id}"]`)
  await esperarQuieta(page)
}
async function abrirArticulo(page, id) {
  await page.click(`[data-tap="${id}"] [data-accion="tie-art"]`)
  await page.waitForSelector(`[data-tienda="vitrina"] .tie-vitrina[data-tap="${id}"]`)
  await esperarQuieta(page)
}
const ventanaEn = (page, estado) => page.waitForSelector(`[data-accion="tie-ventana"][data-estado="${estado}"]`, { timeout: 15000 })

function anotaZonas(anota, celda, vista, m) {
  for (const t of m.tocables) {
    const ok = Math.min(...t.zona) >= ZONA_GEO && t.efectiva !== null && Math.min(...t.efectiva) >= ZONA_EFECTIVA
    if (!ok) anota('zona', false, { celda, vista, tocable: t.n, zona: t.zona, efectiva: t.efectiva })
  }
  anota('zona', m.tocables.length > 0, { celda, vista, tocables: m.tocables.length })
  anota('solape', m.solapes.length === 0, { celda, vista, solapes: m.solapes })
}

export async function runTienda(browser, { base }) {
  const t0 = Date.now()
  mkdirSync(OUT, { recursive: true })
  const errores = []
  const celdas = []
  const puertas = { zona: [], solape: [], estantes: [], puerta: [], ventana: [], falta: [], ojito: [], inventario: [], contraste: [] }
  const anota = (p, ok, detalle) => { puertas[p].push({ ok: ok === true, ...detalle }); return ok === true }
  const foto = (page, nombre) => page.screenshot({ path: `${OUT}/${nombre}.png` })

  // ── 1 · Los seis tamaños: zonas, solapes y estantes ─────────────────────
  for (const celda of CELDAS) {
    const id = `${celda.w}x${celda.h}`
    const c = { id, vistas: {} }
    celdas.push(c)
    let ctx = null
    try {
      let page
      ;({ ctx, page } = await abrirTienda(browser, base, celda, errores))
      c.vistas.monedas = await page.evaluate(MEDIR)
      anotaZonas(anota, id, 'monedas', c.vistas.monedas)
      const e = await page.evaluate(ESTANTES)
      const estrecha = celda.w < 760
      anota('estantes', e && e.ids.join() === 'monedas,tapetes,reversos,avatares,premium'
        && e.pronto.join() === 'reversos,avatares,premium' && e.pulsados === 1 && e.activo === 'monedas'
        && e.activoEntero && e.desplaza === estrecha, { celda: id, ...e, debeDesplazar: estrecha })
      if (id === '1366x768' || id === '360x640') await foto(page, `a_monedas_${id}`)

      await irEstante(page, 'tapetes')
      c.vistas.tapetes = await page.evaluate(MEDIR)
      anotaZonas(anota, id, 'tapetes', c.vistas.tapetes)
      const e2 = await page.evaluate(ESTANTES)
      anota('estantes', e2?.activo === 'tapetes' && e2.pulsados === 1 && e2.activoEntero, { celda: id, vista: 'tapetes', ...e2 })
      await foto(page, `b_tapetes_${id}`)

      await abrirArticulo(page, 'grafito')
      c.vistas.vitrina = await page.evaluate(MEDIR)
      anotaZonas(anota, id, 'vitrina', c.vistas.vitrina)
      await foto(page, `c_grafito_${id}`)

      await page.click('.sal-accion [data-accion="cta"]')
      await ventanaEn(page, 'confirmar')
      await esperarQuieta(page)
      c.vistas.ventana = await page.evaluate(MEDIR, { dentro: '.tie-ven' })
      anotaZonas(anota, id, 'ventana', c.vistas.ventana)
      if (id === '360x640' || id === '915x412') await foto(page, `d_ventana_${id}`)
    } catch (err) {
      anota('zona', false, { celda: id, error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  // ── 2 · La puerta vitrina ↔ mesa, los cuatro estados de la ventana ──────
  {
    const celda = CELDAS[1]
    let ctx = null
    try {
      let page, banco, billetera
      ;({ ctx, page, banco, billetera } = await abrirTienda(browser, base, celda, errores, { billetera: { retrasos: { comprar_articulo: 1200 } } }))
      const filas = await page.evaluate(PUERTA, TOKENS)
      anota('puerta', filas.length === 11 && filas.every((f) => f.iguales), { casos: filas.length, distintos: filas.filter((f) => !f.iguales), luzK: filas.map((f) => `${f.caso}=${f.luzK}`) })

      await irEstante(page, 'tapetes')
      await abrirArticulo(page, 'grafito')
      await page.click('[data-accion="tie-tono-claro"]')
      await page.click('.sal-accion [data-accion="cta"]')
      await ventanaEn(page, 'confirmar')
      const cifras = await page.evaluate(() => ({
        saldo: document.querySelector('[data-accion="tie-ven-saldo"]')?.textContent,
        queda: document.querySelector('[data-accion="tie-ven-queda"]')?.textContent,
        titulo: document.querySelector('.tie-ven-t')?.textContent,
      }))
      anota('ventana', cifras.saldo === '31.400 HC' && cifras.queda === '21.400 HC' && cifras.titulo === '¿Comprar Negro grafito?',
        { estado: 'confirmar', ...cifras })
      await foto(page, 'd_ventana_1366x768')

      await page.click('[data-accion="tie-compra-si"]')
      await ventanaEn(page, 'comprando')
      const comprando = await page.evaluate(() => ({
        busy: document.querySelector('[data-accion="tie-compra-si"]')?.getAttribute('aria-busy'),
        quietos: [...document.querySelectorAll('.tie-ven-btn')].every((b) => b.disabled),
        texto: document.querySelector('[data-accion="tie-compra-si"]')?.textContent,
      }))
      anota('ventana', comprando.busy === 'true' && comprando.quietos && comprando.texto === 'Comprando…', { estado: 'comprando', ...comprando })
      await foto(page, 'e_comprando_1366x768')

      await page.waitForSelector('[data-accion="tie-listo"]', { timeout: 15000 })
      await page.waitForFunction(() => document.querySelector('.lob-pildora .bd-num')?.textContent.includes('21.400'), null, { timeout: 15000 })
      const listo = await page.evaluate(() => ({
        aviso: document.querySelector('[data-accion="tie-listo"]')?.textContent,
        enUso: !!document.querySelector('.sal-accion [data-accion="tie-enuso"]'),
        sinCta: !document.querySelector('.sal-accion [data-accion="cta"]'),
        ventana: !!document.querySelector('[data-accion="tie-ventana"]'),
      }))
      const fila = banco.inventario.find((f) => f.articulo === 'grafito')
      const compras = banco.libro.filter((l) => l.tipo === 'compra')
      anota('ventana', listo.aviso === '¡Listo! Negro grafito es tu tapete' && listo.enUso && listo.sinCta && !listo.ventana
        && fila?.tono === 'claro' && fila?.en_uso === true && compras.length === 1 && banco.saldo === 21400,
      { estado: 'listo', ...listo, fila, compras: compras.length, saldo: banco.saldo })
      await foto(page, 'f_listo_1366x768')
      billetera.retrasos = {}
    } catch (err) {
      anota('ventana', false, { error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }
  {
    let ctx = null
    try {
      let page, banco
      ;({ ctx, page, banco } = await abrirTienda(browser, base, CELDAS[1], errores, { billetera: { cortes: { comprar_articulo: { veces: 1, modo: 'antes' } } }, ruido: /status of 503/ }))
      await irEstante(page, 'tapetes')
      await abrirArticulo(page, 'azul')
      await page.click('.sal-accion [data-accion="cta"]')
      await ventanaEn(page, 'confirmar')
      await page.click('[data-accion="tie-compra-si"]')
      await ventanaEn(page, 'error')
      const error = await page.evaluate(() => ({
        linea: document.querySelector('.tie-ven-error.is-on')?.textContent,
        pildora: document.querySelector('.lob-pildora .bd-num')?.textContent.replace(/\s+/g, ''),
      }))
      anota('ventana', error.linea === 'No se pudo comprar. Tu saldo no cambió.' && banco.saldo === SALDO && banco.inventario.length === 0
        && error.pildora === '31.400', { estado: 'error', ...error, saldo: banco.saldo })
      await foto(page, 'g_error_1366x768')
      await page.click('[data-accion="tie-compra-si"]')
      await page.waitForSelector('[data-accion="tie-listo"]', { timeout: 15000 })
      anota('ventana', banco.inventario.some((f) => f.articulo === 'azul' && f.tono === 'actual' && f.en_uso) && banco.saldo === SALDO - 15000,
        { estado: 'reintento', saldo: banco.saldo })
    } catch (err) {
      anota('ventana', false, { estado: 'error', error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  // ── 3 · «No te alcanza» ─────────────────────────────────────────────────
  {
    let ctx = null
    try {
      let page
      ;({ ctx, page } = await abrirTienda(browser, base, CELDAS[2], errores, { saldo: 4000 }))
      await irEstante(page, 'tapetes')
      await abrirArticulo(page, 'vinotinto')
      const f = await page.evaluate(() => ({
        cta: document.querySelector('.sal-accion [data-accion="cta"]')?.disabled,
        nota: document.querySelector('.sal-accion .sal-caja, .sal-accion [role="status"], .sal-accion .sal-nota')?.textContent?.trim() ?? null,
        todo: document.querySelector('.sal-accion')?.textContent,
        enlace: document.querySelector('[data-accion="tie-conseguir"]')?.textContent,
      }))
      await foto(page, 'h_falta_390x844')
      await page.click('[data-accion="tie-conseguir"]')
      await page.waitForSelector('[data-tienda="monedas"]')
      anota('falta', f.cta === true && /No te alcanza: faltan 21\.000 HC/.test(f.todo ?? '') && f.enlace === 'Conseguir monedas',
        { cta: f.cta, enlace: f.enlace, texto: f.todo, llegaAMonedas: true })
    } catch (err) {
      anota('falta', false, { error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  // ── 4 · El ojito ────────────────────────────────────────────────────────
  {
    let ctx = null
    try {
      let page
      ;({ ctx, page } = await abrirTienda(browser, base, CELDAS[4], errores))
      const antes = await page.evaluate(CIFRA)
      await page.click('.lob-pildora [data-accion="ojito"]')
      await esperarQuieta(page)
      const tapada = await page.evaluate(CIFRA)
      const guardado = await page.evaluate(() => localStorage.getItem('ajilei.saldoOculto'))
      await irEstante(page, 'tapetes')
      await abrirArticulo(page, 'grafito')
      await page.click('.sal-accion [data-accion="cta"]')
      await ventanaEn(page, 'confirmar')
      const enVentana = await page.evaluate(() => document.querySelector('[data-accion="tie-ven-saldo"]')?.textContent)
      await foto(page, 'i_ojito_412x915')
      anota('ojito', antes?.tapada === false && tapada?.tapada === true && guardado === 'si' && enVentana === '31.400 HC',
        { antes, tapada, guardado, enVentana })
    } catch (err) {
      anota('ojito', false, { error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  // ── 5 · Lo comprado: la lista, «Usar» y el tono ─────────────────────────
  {
    let ctx = null
    try {
      let page, banco
      ;({ ctx, page, banco } = await abrirTienda(browser, base, CELDAS[3], errores, {
        inventario: [{ articulo: 'grafito', tono: 'oscuro', en_uso: true }, { articulo: 'azul', tono: 'actual' }],
      }))
      await irEstante(page, 'tapetes')
      const lista = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.tie-art')].map((a) => [
        a.dataset.tap, a.querySelector('[data-accion="tie-enuso"]') ? 'en_uso' : a.querySelector('[data-accion="tie-usar"]') ? 'usar' : 'precio'])))
      await foto(page, 'j_comprado_360x640')
      await abrirArticulo(page, 'azul')
      const antes = await page.evaluate(() => document.querySelector('.tie-vitrina .vit')?.dataset.tapeteTono ?? null)
      await page.click('.sal-accion [data-accion="cta"]')
      await page.waitForSelector('.sal-accion [data-accion="tie-enuso"]', { timeout: 15000 })
      await page.click('[data-accion="tie-tono-oscuro"]')
      await page.waitForFunction(() => document.querySelector('.tie-vitrina .vit')?.dataset.tapeteTono === 'oscuro', null, { timeout: 15000 })
      await foto(page, 'k_azul_oscuro_360x640')
      const azul = banco.inventario.find((f) => f.articulo === 'azul')
      const grafito = banco.inventario.find((f) => f.articulo === 'grafito')
      anota('inventario', lista.verde === 'usar' && lista.grafito === 'en_uso' && lista.azul === 'usar'
        && lista.vinotinto === 'precio' && lista.tricolor === 'precio' && antes === null
        && azul?.en_uso === true && azul?.tono === 'oscuro' && grafito?.en_uso === false
        && banco.libro.filter((l) => l.tipo === 'compra').length === 0,
      { lista, antes, azul, grafito })
    } catch (err) {
      anota('inventario', false, { error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  // ── VIS-1 · tie.contraste: la gemela de `cfg.contraste` ───────────────────
  for (const celda of CELDAS) {
    const id = `${celda.w}x${celda.h}`
    const dpr = celda.movil ? 2 : 1
    let ctx = null
    try {
      let page
      ;({ ctx, page } = await abrirTienda(browser, base, celda, errores, { saldo: SALDO }))
      await page.addStyleTag({ content: QUIETA_CSS })
      const anotaVista = (vista, m) => anota('contraste', m.n > 0 && m.bajo.length === 0 && m.viejos.length === 0,
        { celda: id, vista, n: m.n, peor: m.peor?.contraste ?? null, fondo: m.peor?.fondo ?? null, texto: m.peor?.txt ?? null, bajo: m.bajo, viejos: m.viejos })
      anotaVista('monedas', await medirAtenuados(page, dpr))
      await page.click('[data-accion="tie-estante-tapetes"]')
      await page.waitForSelector('[data-tienda="tapetes"]')
      anotaVista('tapetes', await medirAtenuados(page, dpr))
      // La vista del artículo, sin saldo: con el que alcanza no queda texto del
      // token fuera de `.vit`, y una celda sin medir es roja. El que se mide es
      // «No te alcanza», que nadie más vigila.
      await ctx.close()
      ;({ ctx, page } = await abrirTienda(browser, base, celda, errores, { saldo: 0 }))
      await page.addStyleTag({ content: QUIETA_CSS })
      await page.click('[data-accion="tie-estante-tapetes"]')
      await page.waitForSelector('[data-tienda="tapetes"]')
      await page.click('[data-tap="azul"] [data-accion="tie-art"]')
      await page.waitForSelector('[data-tienda="vitrina"] .tie-vitrina[data-tap="azul"]')
      anotaVista('vitrina', await medirAtenuados(page, dpr))
      const rotulo = await page.evaluate(() => getComputedStyle(document.querySelector('.vit .vit-pozo-l')).color)
      anota('contraste', esTenue(rotulo, 0.55), { celda: id, vista: 'el rótulo de la vitrina, a 0,55', rotulo })
    } catch (err) {
      anota('contraste', false, { celda: id, error: String(err?.message ?? err).split('\n')[0] })
    } finally {
      await ctx?.close().catch(() => {})
    }
  }

  const veredictos = Object.fromEntries(Object.entries(puertas).map(([k, v]) => [`tie.${k}`, v.length > 0 && v.every((x) => x.ok)]))
  veredictos.consola = errores.length === 0
  const verde = Object.values(veredictos).every(Boolean)
  return {
    verde,
    veredictos,
    fallos: Object.fromEntries(Object.entries(puertas).map(([k, v]) => [k, v.filter((x) => !x.ok)]).filter(([, v]) => v.length)),
    puertas,
    celdas,
    errores,
    capturas: OUT,
    segundos: Math.round((Date.now() - t0) / 100) / 10,
  }
}
