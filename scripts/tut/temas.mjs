// ── TUT-1 tanda 4 · `diagDSK tut temas` · «Aprender por tema» ───────────────────
// Ficha: AJILEI_TUT-1_T4_v1.0.md §2. Contra 5173 con bypass: el lobby real, «Cómo se juega»,
// el índice (`screens/IndiceTemas.jsx`) y los capítulos 1 a 6 sobre la mesa de la guiada
// congelada (`guia/Capitulo.jsx`), tocando con el dedo (móvil) o el ratón.
//
// En 360×640, 640×360, 780×360 y 1920×1080:
//   · tut.indice   tres pistas y diez filas; 1–6 abren, 7–10 dicen «Pronto» y su toque da el
//                  aviso del lobby; el ✓ sale de `ajilei.guia.vistos`;
//   · tut.pasos    cada capítulo tiene los pasos de `guia/capitulos.js` («Paso n de m»), y
//                  «Siguiente», «Volver» y el toque fuera de la burbuja recorren;
//   · tut.marca    «Cerrar» no pone el ✓ y vuelve al índice; «Terminar» lo pone y vuelve;
//   · tut.lineas   ningún rótulo pasa de dos líneas (el techo se mide en 360×640; en los otros
//                  tamaños, se anota);
//   · tut.delta    Δ 0 de todas las cajas de `#root` con la capa (y la muestra) y sin ella;
//   · tut.solape   (STOP-T) en todos los pasos, cero solapes entre la barra, el rótulo (burbuja
//                  o tarjeta) y la muestra, y la barra no pisa ningún aro; y, en los pasos sin
//                  muestra, ningún hueco pisa a otro ni pisa a medias una carta revelada de un
//                  rival (o la abraza entera o no la toca);
//   · tut.barra    (STOP-T) la barra no se mueve de paso en paso: el mismo sitio en todos;
//   · tut.grande   (STOP-T) la carta grande de la muestra (el 7 de Oro) no es menor que las de
//                  la mano propia;
//   · tut.red      ninguna llamada al servidor dentro de un capítulo (banco imitado y red);
//   · tut.mazo     tras «Cerrar» y tras «Terminar» el generador del barajado está en el azar
//                  (R-2): dos barajados seguidos difieren y ninguno es un orden de la guiada;
//   · tut.consola  sin errores de página.
// Aparte, en `completo` (pasa del minuto): `diagDSK tut temas`.
// Control rojo (STOP-T): `TUT_CONTROL=barra-encima` pinta la barra en el centro de la ventana,
// en el mismo sitio en todos los pasos: `tut.solape` sale roja y `tut.barra` sigue verde.
import process from 'node:process'

const T = {
  T1: { w: 360, h: 640, movil: true, techo: true },
  T3: { w: 640, h: 360, movil: true },
  // STOP-T · el S25 acostado (la barra en columna; la muestra chica en una fila).
  T3s: { w: 780, h: 360, movil: true },
  T6: { w: 1920, h: 1080, movil: false },
}
const PAUSA = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}'
const ESPERA_MS = 20000
// Las dos lecturas que la APP hace en CADA cambio de pantalla (el freno del nombre de
// `useAuth` y el inventario de los tapetes de `App`), también al abrir «Cómo se juega» o el
// índice: no son del capítulo. Cualquier otra llamada dentro de un capítulo es roja.
const DE_LA_APP = ['mi_proximo_cambio', 'mi_inventario']
// Lo que el índice tiene que listar (normativo §2.2): tres pistas, diez filas, seis construidas.
const PISTAS = { a: [1, 2, 3, 4], b: [5, 6], c: [7, 8, 9, 10] }

// ── En la página ────────────────────────────────────────────────────────────
const CAJAS = () => [...document.querySelectorAll('#root *')].map((e) => {
  const r = e.getBoundingClientRect()
  return [r.left, r.top, r.width, r.height]
})
function delta(a, b) {
  if (a.length !== b.length) return { max: Infinity, quien: `cajas ${a.length} → ${b.length}` }
  let max = 0
  let quien = null
  a.forEach((c, i) => c.forEach((v, k) => { const d = Math.abs(v - b[i][k]); if (d > max) { max = d; quien = i } }))
  return { max: +max.toFixed(2), quien }
}
const GUIA = () => { try { return JSON.parse(localStorage.getItem('ajilei.guia') ?? 'null') } catch { return null } }
const ESPIA = () => {
  window.__tem = { llamadas: [] }
  const b = window.__ajileiBancoImitado?.banco
  if (b) {
    for (const m of ['rpc', 'llamar']) {
      const f = b[m].bind(b)
      b[m] = (nombre, params) => { window.__tem.llamadas.push(nombre); return f(nombre, params) }
    }
  }
}
const INDICE = () => ({
  pistas: [...document.querySelectorAll('.tem-pista')].map((s) => ({
    id: s.dataset.pista,
    filas: [...s.querySelectorAll('.tem-fila')].map((f) => {
      const r = f.getBoundingClientRect()
      return { n: Number(f.dataset.capitulo), pronto: f.classList.contains('es-pronto'), visto: f.hasAttribute('data-visto'), h: Math.round(r.height), w: Math.round(r.width) }
    }),
  })),
})
const PASO = () => {
  const capa = document.querySelector('.tut-capa[data-listo]')
  if (!capa) return null
  const rot = capa.querySelector('.tut-rotulo:not(.tut-rotulo--medida)')
  const p = rot?.querySelector('.tut-rotulo-texto')
  const n = capa.querySelector('.tut-paso')?.textContent ?? ''
  const m = n.match(/(\d+)\D+(\d+)/)
  return {
    texto: p?.textContent ?? '',
    lineas: p ? Math.max(1, Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight))) : 0,
    modo: capa.dataset.modo,
    n: m ? Number(m[1]) : null,
    m: m ? Number(m[2]) : null,
    huecos: capa.querySelectorAll('.tut-aro').length,
    muestra: document.querySelector('[data-muestra]')?.dataset.muestra ?? null,
    botones: [...capa.querySelectorAll('[data-accion^="tut-"]')].map((b) => b.dataset.accion),
    cajas: {
      rot: caja(rot),
      barra: caja(capa.querySelector('.tut-barra')),
      muestra: caja(document.querySelector('.muestra')),
      aros: [...capa.querySelectorAll('.tut-aro')].map(caja),
      reveladas: [...document.querySelectorAll('[data-ancla="rival"] .playing-card:not(.card-back)')].map(caja),
    },
    grande: document.querySelector('.muestra--grande') ? {
      carta: Math.min(...[...document.querySelectorAll('.muestra--grande .muestra-carta')].map((e) => e.getBoundingClientRect().width)),
      mano: Math.max(0, ...[...document.querySelectorAll('[data-ancla="carta"]')].map((e) => e.getBoundingClientRect().width)),
    } : null,
  }
  function caja(e) {
    if (!e) return null
    const r = e.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  }
}
// Área común de dos cajas (0 si no se tocan o falta una).
const solape = (a, b) => {
  if (!a || !b) return 0
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
  return w > 0.5 && h > 0.5 ? Math.round(w * h) : 0
}
// R-2: dos barajados seguidos con el `deck.js` de la página (el mismo módulo que la mesa).
const MAZO = async () => {
  const [{ ORDENES }, { createDeck, shuffleDeck }] = await Promise.all([import('/src/lib/guiaManos.js'), import('/src/engine/deck.js')])
  const a = shuffleDeck(createDeck()).map((c) => c.id).join(',')
  const b = shuffleDeck(createDeck()).map((c) => c.id).join(',')
  return { distintos: a !== b, guion: ORDENES.some((o) => o.join(',') === a || o.join(',') === b) }
}
const CAPITULOS = async () => {
  const { CAPITULOS: C, CONSTRUIDOS } = await import('/src/guia/capitulos.js')
  return Object.fromEntries(CONSTRUIDOS.map((n) => [n, C[n].pasos.map((p) => !!p.muestra)]))
}

async function celda(page, base, tam, vp) {
  const out = { tam, puertas: {}, fallos: [], notas: [], capitulos: {} }
  const falla = (puerta, texto) => { out.fallos.push(`${tam} ${puerta}: ${texto}`); out.puertas[puerta] = false }
  const pasa = (puerta) => { if (!(puerta in out.puertas)) out.puertas[puerta] = true }
  const errores = []
  const red = []
  page.on('pageerror', (e) => errores.push(String(e?.message || e)))
  const tocar = async (sel) => {
    const p = await page.evaluate((s) => {
      const e = document.querySelector(s)
      if (!e) return null
      e.scrollIntoView({ block: 'center', inline: 'center' })
      const r = e.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }, sel)
    if (!p) throw new Error(`no está «${sel}»`)
    if (vp.movil) await page.touchscreen.tap(p.x, p.y)
    else await page.mouse.click(p.x, p.y)
  }
  // Un toque en el velo, lejos de la burbuja, la barra, «Cerrar» y la muestra: arriba a la izquierda.
  const tocarFondo = async () => {
    const p = await page.evaluate(() => {
      const bandas = [...document.querySelectorAll('.tut-capa .tut-banda')].map((b) => b.getBoundingClientRect()).filter((r) => r.width > 30 && r.height > 30)
      const evita = [...document.querySelectorAll('.tut-rotulo:not(.tut-rotulo--medida), .tut-barra, .tut-salir')].map((e) => e.getBoundingClientRect())
      // Una rejilla de 20 px dentro de cada banda (STOP-T: la barra fija vive arriba a la izquierda).
      for (const r of bandas) {
        for (let y = r.top + 15; y <= r.bottom - 15; y += 20) {
          for (let x = r.left + 15; x <= r.right - 15; x += 20) {
            if (!evita.some((q) => x >= q.left - 4 && x <= q.right + 4 && y >= q.top - 4 && y <= q.bottom + 4)) return { x, y }
          }
        }
      }
      return null
    })
    if (!p) return false
    if (vp.movil) await page.touchscreen.tap(p.x, p.y)
    else await page.mouse.click(p.x, p.y)
    return true
  }
  const pasoN = async (n) => page.waitForFunction((k) => {
    const t = document.querySelector('.tut-capa[data-listo] .tut-paso')?.textContent ?? ''
    return new RegExp(`^\\D*${k}\\D`).test(t)
  }, n, { timeout: ESPERA_MS })
  const indice = async () => page.waitForSelector('.tem-fila[data-capitulo="1"]', { timeout: ESPERA_MS })

  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('main.lobby [data-accion="reglas"]', { timeout: ESPERA_MS })
  await page.evaluate(ESPIA)
  await tocar('[data-accion="reglas"]')
  await page.waitForSelector('[data-accion="csj-temas"]', { timeout: ESPERA_MS })
  if (await page.$('[data-accion="csj-temas"] .csj-pronto')) falla('tut.indice', '«Aprender por tema» todavía dice «Pronto»')
  await tocar('[data-accion="csj-temas"]')
  await indice()

  // ── El índice ──
  const ix = await page.evaluate(INDICE)
  out.indice = ix
  const ids = ix.pistas.map((p) => p.id).join('')
  if (ids !== 'abc') falla('tut.indice', `pistas «${ids}»`)
  for (const p of ix.pistas) {
    const ns = p.filas.map((f) => f.n)
    if (JSON.stringify(ns) !== JSON.stringify(PISTAS[p.id])) falla('tut.indice', `pista ${p.id}: filas ${ns.join(',')}`)
    for (const f of p.filas) {
      if (f.pronto !== f.n >= 7) falla('tut.indice', `fila ${f.n}: «Pronto» ${f.pronto}`)
      if (f.h < 44) falla('tut.indice', `fila ${f.n}: ${f.h} de alto (piso 44)`)
      if (f.visto) falla('tut.indice', `fila ${f.n} con ✓ en un aparato nuevo`)
    }
  }
  await tocar('.tem-fila[data-capitulo="8"]')
  const toast = await page.waitForFunction(() => document.body.textContent.includes('Pronto'), null, { timeout: 3000 }).then(() => true).catch(() => false)
  if (!toast) falla('tut.indice', 'tocar una fila «Pronto» no dio el aviso')
  if (await page.$('.tut-capa')) falla('tut.indice', 'una fila «Pronto» abrió algo')
  pasa('tut.indice')

  const esperados = await page.evaluate(CAPITULOS)
  // La app termina de arrancar con el banco imitado (el inventario, el freno del nombre, el
  // latido) unos cientos de ms después del lobby: se espera a que el espía calle 1,5 s.
  for (let k = 0, quieto = 0, antes = -1; k < 40 && quieto < 6; k++) {
    const c = await page.evaluate(() => window.__tem.llamadas.length)
    quieto = c === antes ? quieto + 1 : 0
    antes = c
    await page.waitForTimeout(250)
  }
  // Lo que se llama mientras un capítulo está abierto: del toque en su fila a su último toque
  // («Cerrar» o «Terminar»). Lo que llama el índice al volver a montarse es de la carcasa.
  let enCapitulo = false
  page.on('request', (r) => { if (enCapitulo && /supabase|\/rest\/v1|\/functions\/v1/.test(r.url())) red.push(r.url()) })
  const llamadasCap = []
  const cuenta = () => page.evaluate(() => window.__tem.llamadas.length)

  // ── Los seis capítulos ──
  let sitioBarra = null
  for (const n of [1, 2, 3, 4, 5, 6]) {
    const cap = { pasos: [] }
    out.capitulos[n] = cap
    const c0 = await cuenta()
    enCapitulo = true
    await tocar(`.tem-fila[data-capitulo="${n}"]`)
    await pasoN(1)
    const conMuestra = esperados[n]
    const m = conMuestra.length
    for (let k = 1; k <= m; k++) {
      await pasoN(k)
      // Un paso con muestra se mide con ella pintada y señalada (la muestra viaja con la mesa y
      // llega un cuadro después de la capa: STOP-T, la primera medida del paso 1 salía sin ella).
      if (conMuestra[k - 1]) {
        await page.waitForFunction(() => {
          const mu = document.querySelector('.muestra')?.getBoundingClientRect()
          return !!mu && [...document.querySelectorAll('.tut-capa[data-listo] .tut-aro')].some((a) => {
            const r = a.getBoundingClientRect()
            return r.left <= mu.left && r.top <= mu.top && r.right >= mu.right && r.bottom >= mu.bottom
          })
        }, null, { timeout: ESPERA_MS }).catch(() => falla('tut.pasos', `cap ${n} paso ${k}: la muestra no llegó o no tiene su aro`))
      }
      // La capa se coloca en dos tiempos (burbuja o tarjeta): un cuadro de calma.
      await page.waitForTimeout(120)
      if (process.env.TUT_CONTROL === 'barra-encima' && k === 1) {
        await page.addStyleTag({ content: '.tut-barra { left: 35vw !important; top: 45vh !important }' })
      }
      const paso = await page.evaluate(PASO)
      cap.pasos.push({ k, texto: paso.texto, lineas: paso.lineas, modo: paso.modo, huecos: paso.huecos, muestra: paso.muestra })
      if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/${tam}-cap${n}-p${k}.png` }).catch(() => {})
      if (paso.m !== m) falla('tut.pasos', `capítulo ${n}: «Paso ${paso.n} de ${paso.m}» (capitulos.js dice ${m})`)
      // STOP-T · la barra es un obstáculo: ni el rótulo ni la muestra la pisan, ni ella a un aro.
      const { rot, barra, muestra, aros } = paso.cajas
      if (!barra) falla('tut.barra', `cap ${n} paso ${k}: sin barra`)
      const cruces = [['rótulo∩barra', solape(rot, barra)], ['rótulo∩muestra', solape(rot, muestra)], ['barra∩muestra', solape(barra, muestra)],
        ['barra∩aro', aros.reduce((s, a) => s + solape(barra, a), 0)]].filter(([, v]) => v > 0)
      if (cruces.length) falla('tut.solape', `cap ${n} paso ${k} (${paso.modo}): ${cruces.map(([q, v]) => `${q} ${v} px²`).join(', ')}`)
      if (paso.grande && paso.grande.carta + 0.5 < paso.grande.mano) falla('tut.grande', `cap ${n} paso ${k}: la carta de la muestra mide ${paso.grande.carta.toFixed(1)} y las de la mano ${paso.grande.mano.toFixed(1)}`)
      if (paso.grande) out.notas.push(`tut.grande cap ${n} paso ${k}: muestra ${paso.grande.carta.toFixed(0)} px · mano ${paso.grande.mano.toFixed(0)} px`)
      // STOP-T · los huecos: ninguno pisa a otro, ni pisa a medias una carta revelada (en un paso
      // con muestra el aro es el de la muestra, que tapa lo de debajo: no cuenta).
      if (!paso.muestra) {
        const entre = []
        aros.forEach((a, i) => aros.slice(i + 1).forEach((b) => { const v = solape(a, b); if (v) entre.push(v) }))
        if (entre.length) falla('tut.solape', `cap ${n} paso ${k}: ${entre.length} hueco(s) pisan a otro (${entre.join(', ')} px²)`)
        const dentro = (c, a) => c.left >= a.left - 0.5 && c.top >= a.top - 0.5 && c.left + c.width <= a.left + a.width + 0.5 && c.top + c.height <= a.top + a.height + 0.5
        const amedias = paso.cajas.reveladas.filter((c) => aros.some((a) => solape(c, a) > 0) && !aros.some((a) => dentro(c, a)))
        if (amedias.length) falla('tut.solape', `cap ${n} paso ${k}: ${amedias.length} carta(s) revelada(s) pisadas a medias por un hueco`)
      }
      const rotAro = aros.reduce((s, a) => s + solape(rot, a), 0)
      if (rotAro > 0) out.notas.push(`tut.solape cap ${n} paso ${k}: la ${paso.modo} pisa ${rotAro} px² de un aro (no hay sitio libre)`)
      // STOP-T · la barra no se mueve de paso en paso (su esquina fija: arriba a la izquierda).
      if (barra) {
        const sitio = `${Math.round(barra.left)},${Math.round(barra.top)}`
        sitioBarra ??= sitio
        if (sitio !== sitioBarra) falla('tut.barra', `cap ${n} paso ${k}: la barra en ${sitio} (antes en ${sitioBarra})`)
      }
      if (paso.lineas > 2) (vp.techo ? falla : (p, t) => out.notas.push(`${p} ${t}`))('tut.lineas', `cap ${n} paso ${k} «${paso.texto}»: ${paso.lineas} líneas (${paso.modo})`)
      if (!paso.botones.includes('tut-salir')) falla('tut.pasos', `capítulo ${n} paso ${k} sin «Cerrar»`)
      if (k === m && !paso.botones.includes('tut-terminar')) falla('tut.pasos', `capítulo ${n}: el último paso sin «Terminar»`)
      if (k < m && paso.botones.includes('tut-terminar')) falla('tut.pasos', `capítulo ${n} paso ${k}: «Terminar» antes del final`)
      // Δ 0: con la capa y la muestra, y sin ellas, entre dos fotos sin capa iguales.
      if (!vp.movil) await page.mouse.move(1, 1)
      const estilo = await page.addStyleTag({ content: PAUSA })
      let d = null
      for (let r = 0; r < 6 && !d; r++) {
        const sin = async () => {
          const o = await page.addStyleTag({ content: '.tut-capa, .tut-capa *, .muestra, .muestra * { visibility: hidden !important }' })
          const c = await page.evaluate(CAJAS)
          await o.evaluate((e) => e.remove())
          return c
        }
        const s1 = await sin()
        const con = await page.evaluate(CAJAS)
        const s2 = await sin()
        if (delta(s1, s2).max === 0) d = delta(s2, con)
        else await page.waitForTimeout(250)
      }
      await estilo.evaluate((e) => e.remove())
      if (!d) out.notas.push(`cap ${n} paso ${k}: la mesa no se quedó quieta para medir Δ`)
      else if (d.max !== 0) falla('tut.delta', `cap ${n} paso ${k}: Δ ${d.max}`)
      // Avanzar: en el capítulo 2 con el toque en el fondo (fuera de la burbuja), en el resto con «Siguiente».
      if (k < m) {
        if (n === 2) { if (!(await tocarFondo())) falla('tut.pasos', `cap 2 paso ${k}: sin fondo que tocar`) } else await tocar('.tut-capa [data-accion="tut-siguiente"]')
      }
    }
    // «Volver» desde el último, y de nuevo al último.
    if (m > 1) {
      await tocar('.tut-capa [data-accion="tut-volver"]')
      await pasoN(m - 1).catch(() => falla('tut.pasos', `capítulo ${n}: «Volver» no volvió`))
      await tocar('.tut-capa [data-accion="tut-siguiente"]')
      await pasoN(m)
    }
    llamadasCap.push(...(await page.evaluate((k) => window.__tem.llamadas.slice(k), c0)))
    enCapitulo = false
    if (n === 1) {
      // «Cerrar» no marca: vuelve al índice sin ✓.
      await tocar('.tut-capa [data-accion="tut-salir"]')
      await indice()
      const g = await page.evaluate(GUIA)
      if ((g?.vistos ?? []).includes(1)) falla('tut.marca', '«Cerrar» puso el ✓ del capítulo 1')
      if (await page.$('.tem-fila[data-capitulo="1"][data-visto]')) falla('tut.marca', 'el índice pinta ✓ tras «Cerrar»')
    } else {
      await tocar('.tut-capa [data-accion="tut-terminar"]')
      await indice()
      const g = await page.evaluate(GUIA)
      if (!(g?.vistos ?? []).includes(n)) falla('tut.marca', `«Terminar» no puso el ✓ del capítulo ${n} (${JSON.stringify(g?.vistos)})`)
      if (!(await page.$(`.tem-fila[data-capitulo="${n}"][data-visto]`))) falla('tut.marca', `el índice no pinta el ✓ del capítulo ${n}`)
    }
    const z = await page.evaluate(MAZO)
    if (!z.distintos || z.guion) falla('tut.mazo', `tras el capítulo ${n}: ${JSON.stringify(z)}`)
  }
  pasa('tut.pasos')
  pasa('tut.marca')
  pasa('tut.lineas')
  pasa('tut.delta')
  pasa('tut.solape')
  pasa('tut.barra')
  pasa('tut.grande')
  pasa('tut.mazo')

  // ── La red ──
  out.red = { banco: llamadasCap, red }
  const ajenas = llamadasCap.filter((x) => !DE_LA_APP.includes(x))
  if (ajenas.length) falla('tut.red', `llamadas en los capítulos: ${[...new Set(ajenas)].join(', ')}`)
  if (red.length) falla('tut.red', `red en los capítulos: ${red.slice(0, 3).join(', ')}`)
  // El control del espía: en el índice SÍ llama la carcasa (la píldora); si no ve nada, está ciego.
  if ((await cuenta()) === 0) falla('tut.red', 'el espía no vio ninguna llamada en toda la corrida: está ciego')
  pasa('tut.red')
  if (errores.length) falla('tut.consola', errores.slice(0, 3).join(' | '))
  pasa('tut.consola')
  return out
}

export async function runTutTemas(browser, { base }) {
  const t0 = Date.now()
  const celdas = {}
  const fallos = []
  await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    try {
      celdas[tam] = await celda(page, base, tam, vp)
      fallos.push(...celdas[tam].fallos)
    } catch (e) {
      fallos.push(`${tam}: el recorrido se cortó: ${String(e?.message || e).split('\n').slice(0, 2).join(' · ').slice(0, 300)}`)
      if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/temas-${tam}-corte.png` }).catch(() => {})
    } finally { await ctx.close() }
  }))
  const verde = fallos.length === 0 && Object.keys(celdas).length === Object.keys(T).length
  const ms = Date.now() - t0
  console.log(`  tut.temas · ${verde ? 'VERDE' : 'ROJO'} · ${Object.keys(celdas).join(' · ')} · ${(ms / 1000).toFixed(0)} s`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  for (const [tam, c] of Object.entries(celdas)) for (const n of c.notas ?? []) console.log(`    · ${tam} ${n}`)
  if (process.env.TUT_DETALLE) console.log(JSON.stringify(celdas, null, 1))
  return { verde, ms, fallos, celdas }
}
