// ── TUT-1 tanda 3 · `diagDSK tut puerta` · lo que rodea a la guiada ─────────────
// Ficha: AJILEI_TUT-1_T3_v1.0.md §3. Contra 5173 con bypass (el banco imitado contesta
// `premio_guiada_estado` y `cobrar_guiada`; los mandos `?guia=` de `src/dev/guiadaFalsa.js`).
//
//   · tut.oferta   la tarjeta del primer login: sale en la primera visita sin marca, con la
//                  cifra del servidor (2.000 y «antes de jugar tu primera mano»; 1.000 con
//                  una mano jugada, sin esa frase); no sale tras «Ahora no» (ni al recargar),
//                  ni con el premio cobrado, ni con sala pendiente; Δ 0 del lobby; los dos
//                  botones con piso de 44; el texto, en dos líneas como mucho.
//   · tut.hub      «Cómo se juega»: las tres tarjetas (guiada, temas, Mia), «Pronto» sólo en
//                  la de Mia (y su aviso al tocarla; T4: «Aprender por tema» abre el índice), la
//                  cifra del servidor o «✓ Hecha», el piso de 44, una por fila en el teléfono
//                  vertical y en fila en la PC, y la guiada se abre desde su tarjeta.
//   · tut.senales  en una mesa real de 3 contra las IAS: cada pista (iniciar, turno de apuesta,
//                  descarte) sale una vez, se apaga con su acción y no vuelve en la mano
//                  siguiente; Δ 0 de `#root` con la pista; no tapa el reloj de turno, que
//                  sigue corriendo (360×640 y 1920×1080).
//   · tut.consola  sin errores de página.
// Va aparte de `diagDSK tut` (la capa sobre la mesa quieta) y de `tut guiada` (la guiada entera).
import process from 'node:process'
import { guiaReal } from '../arnes/comun.mjs'

const T = {
  T1: { w: 360, h: 640, movil: true, senales: true },
  T3: { w: 640, h: 360, movil: true, senales: false },
  T6: { w: 1920, h: 1080, movil: false, senales: true },
}
const PAUSA = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}'
const ESPERA_OFERTA_MS = 8000
// Lo que tarda la puerta en decidir: el trozo, el estado (300 ms en el banco) y un margen.
const CALMA_MS = 2500

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
const LINEAS = (sel) => {
  const p = document.querySelector(sel)
  if (!p) return null
  return Math.max(1, Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)))
}
const OFERTA = () => {
  const c = document.querySelector('.ofg-tarjeta')
  if (!c) return null
  const botones = [...c.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { accion: b.dataset.accion, w: Math.round(r.width), h: Math.round(r.height) } })
  const p = c.querySelector('.ofg-texto')
  return {
    texto: p?.textContent ?? '',
    lineas: p ? Math.max(1, Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight))) : 0,
    titulo: c.querySelector('.ofg-titulo')?.textContent ?? '',
    botones,
  }
}
const HUB = () => {
  const ts = [...document.querySelectorAll('.csj-tarjeta')]
  return ts.map((b) => {
    const r = b.getBoundingClientRect()
    return {
      accion: b.dataset.accion,
      top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
      titulo: b.querySelector('.csj-tarjeta-titulo')?.textContent ?? '',
      premio: b.querySelector('.csj-tarjeta-premio')?.textContent?.trim() ?? null,
      premioVisible: b.querySelector('.csj-tarjeta-premio') ? getComputedStyle(b.querySelector('.csj-tarjeta-premio')).visibility === 'visible' : null,
      pronto: !!b.querySelector('.csj-pronto'),
      oro: getComputedStyle(b).backgroundImage.includes('gradient'),
    }
  })
}
// La pista libre: su texto, su caja y lo que pisa (el reloj visible, las cartas propias).
const PISTA = () => {
  const capa = document.querySelector('.tut-capa--libre[data-listo]')
  if (!capa) return null
  const rot = capa.querySelector('.tut-rotulo')
  const r = rot.getBoundingClientRect()
  const pisa = (sel) => [...document.querySelectorAll(sel)].filter((e) => {
    const q = e.getBoundingClientRect()
    if (q.width === 0 || getComputedStyle(e).visibility !== 'visible' || getComputedStyle(e).display === 'none') return false
    return r.left < q.right && q.left < r.right && r.top < q.bottom && q.top < r.bottom
  }).length
  return {
    texto: rot.textContent,
    velo: !!capa.querySelector('.tut-velo'),
    aro: !!capa.querySelector('.tut-aro'),
    reloj: pisa('.timer-display'),
    cartas: pisa('[data-ancla="carta"]'),
    lineas: Math.max(1, Math.round(rot.querySelector('p').getBoundingClientRect().height / parseFloat(getComputedStyle(rot.querySelector('p')).lineHeight))),
  }
}
const RELOJ = () => {
  const vis = [...document.querySelectorAll('.timer-display')].find((e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility === 'visible')
  return vis ? parseInt(vis.textContent, 10) : null
}

async function contexto(browser, vp, { guia = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.movil ? { hasTouch: true, isMobile: true } : {}), deviceScaleFactor: 1 })
  // Partida rápida: la mesa real va a su ritmo corto, como la dejaría el jugador.
  await ctx.addInitScript((g) => {
    try {
      localStorage.setItem('ajilei.partidaRapida', 'si')
      if (g && localStorage.getItem('ajilei.guia') === null) localStorage.setItem('ajilei.guia', JSON.stringify(g))
    } catch { /* nada */ }
  }, guia)
  return ctx
}

async function celda(browser, base, tam, vp) {
  const out = { tam, puertas: {}, fallos: [], notas: [] }
  const falla = (puerta, texto) => { out.fallos.push(`${tam} ${puerta}: ${texto}`); out.puertas[puerta] = false }
  const pasa = (puerta) => { if (!(puerta in out.puertas)) out.puertas[puerta] = true }
  const errores = []
  const abrir = async (opciones) => {
    const ctx = await contexto(browser, vp, opciones)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errores.push(String(e?.message || e)))
    const tocar = async (sel) => {
      const p = await page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null }, sel)
      if (!p) throw new Error(`no está «${sel}»`)
      if (vp.movil) await page.touchscreen.tap(p.x, p.y)
      else await page.mouse.click(p.x, p.y)
    }
    const lobby = async (query = '') => {
      await page.goto(`${base}/${query}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('main.lobby [data-accion="reglas"]', { timeout: 20000 })
    }
    return { ctx, page, tocar, lobby }
  }

  // ══ tut.oferta ════════════════════════════════════════════════════════════
  {
    const { ctx, page, tocar, lobby } = await abrir()
    await lobby()
    const h = await page.waitForSelector('.ofg-tarjeta', { timeout: ESPERA_OFERTA_MS }).catch(() => null)
    if (!h) falla('tut.oferta', 'no salió en la primera visita sin marca')
    else {
      const o = await page.evaluate(OFERTA)
      out.oferta = o
      // Δ del lobby con la tarjeta y sin ella (tapada), entre dos fotos sin tarjeta iguales y quietas.
      const estilo = await page.addStyleTag({ content: PAUSA })
      const sinTarjeta = async () => {
        const t = await page.addStyleTag({ content: '.ofg-raiz, .ofg-raiz * { visibility: hidden !important }' })
        const c = await page.evaluate(CAJAS)
        await t.evaluate((e) => e.remove())
        return c
      }
      // Como en `tut guiada`: hasta seis veces, a que el lobby se quede quieto (lo que se mueve
      // por JS no lo para la pausa de las animaciones).
      let d = null
      let quieto = false
      for (let k = 0; k < 6 && !quieto; k++) {
        const s1 = await sinTarjeta()
        const con = await page.evaluate(CAJAS)
        const s2 = await sinTarjeta()
        quieto = delta(s1, s2).max === 0
        d = delta(s2, con)
        if (!quieto) {
          const quien = await page.evaluate((i) => { const e = document.querySelectorAll('#root *')[i]; return e ? `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}` : '?' }, delta(s1, s2).quien)
          out.oferta.mueve = quien
          await page.waitForTimeout(250)
        }
      }
      await estilo.evaluate((e) => e.remove())
      if (!quieto) out.notas.push(`el lobby no se quedó quieto para medir Δ de la oferta (se mueve ${out.oferta.mueve})`)
      else if (d.max !== 0) falla('tut.oferta', `Δ ${d.max} del lobby con la tarjeta`)
      if (!o.texto.includes('2.000 HC') || !o.texto.includes('antes de jugar tu primera mano')) falla('tut.oferta', `texto de la cuenta limpia: «${o.texto}»`)
      if (o.titulo !== 'Aprende en dos minutos') falla('tut.oferta', `título «${o.titulo}»`)
      if (o.lineas > 2) out.notas.push(`la oferta pinta su texto en ${o.lineas} líneas`)
      const chicos = o.botones.filter((b) => b.h < 44)
      if (o.botones.length !== 2 || chicos.length) falla('tut.oferta', `botones ${JSON.stringify(o.botones)}`)
      await tocar('[data-accion="guiada-ahora-no"]')
      await page.waitForSelector('.ofg-tarjeta', { state: 'detached', timeout: 5000 }).catch(() => falla('tut.oferta', '«Ahora no» no la cerró'))
      const g = await page.evaluate(GUIA)
      if (g?.ofrecida !== true) falla('tut.oferta', `«Ahora no» sin la marca ofrecida (${JSON.stringify(g)})`)
      await lobby()
      await page.waitForTimeout(CALMA_MS)
      if (await page.$('.ofg-tarjeta')) falla('tut.oferta', 'volvió a salir tras «Ahora no»')
    }
    await ctx.close()
  }
  {
    // Con una mano jugada (entre personas, el mando del banco): 1.000, sin «antes de…».
    const { ctx, page, lobby } = await abrir()
    await lobby('?guia=jugado')
    const h = await page.waitForSelector('.ofg-tarjeta', { timeout: ESPERA_OFERTA_MS }).catch(() => null)
    const o = h ? await page.evaluate(OFERTA) : null
    out.ofertaJugado = o
    if (!o) falla('tut.oferta', 'con una mano jugada no salió')
    else if (!o.texto.includes('1.000 HC') || o.texto.includes('antes de jugar')) falla('tut.oferta', `texto con una mano jugada: «${o.texto}»`)
    await ctx.close()
  }
  {
    // Con el premio cobrado: no sale.
    const { ctx, page, lobby } = await abrir()
    await lobby('?guia=cobrado')
    await page.waitForTimeout(CALMA_MS)
    if (await page.$('.ofg-tarjeta')) falla('tut.oferta', 'salió con el premio cobrado')
    await ctx.close()
  }
  {
    // Con sala pendiente: la puerta, montada sola con un cliente que cuenta, ni pregunta ni sale.
    const { ctx, page, lobby } = await abrir({ guia: { ofrecida: true } })
    await lobby()
    const r = await page.evaluate(async () => (await import('/scripts/tut/montaPuerta.mjs')).probarSalaPendiente())
      .catch((e) => ({ error: String(e?.message || e) }))
    out.salaPendiente = r
    if (r.error) falla('tut.oferta', `sala pendiente: ${r.error}`)
    else if (r.sale || r.llamadasConSala.length) falla('tut.oferta', `con sala pendiente: tarjeta ${r.sale} · llamadas ${r.llamadasConSala.join(', ')}`)
    else if (!r.control) falla('tut.oferta', 'sala pendiente: el control (sin sala) tampoco la sacó: la prueba está ciega')
    await ctx.close()
  }
  pasa('tut.oferta')

  // ══ tut.hub ═══════════════════════════════════════════════════════════════
  for (const [query, premioEsperado] of [['', 'Gana 2.000 HC'], ['?guia=cobrado', '✓ Hecha']]) {
    // T6 · con el ✓ del capítulo 2, la tarjeta de la guiada va directa a la mesa (sin él, a la
    // ruta de la primera vez: la recorre `tut ruta`).
    const { ctx, page, tocar, lobby } = await abrir({ guia: { ofrecida: true, vistos: [2] } })
    await lobby(query)
    await tocar('[data-accion="reglas"]')
    await page.waitForSelector('.csj-tarjeta[data-accion="csj-guiada"]', { timeout: 15000 })
    await page.waitForFunction(() => document.querySelector('[data-csj-premio]')?.dataset.csjPremio !== 'esperando', null, { timeout: 8000 }).catch(() => {})
    await page.addStyleTag({ content: PAUSA })
    const hub = await page.evaluate(HUB)
    out[query ? 'hubCobrado' : 'hub'] = hub
    const [g, temas, mia] = hub
    if (hub.length !== 3 || g?.accion !== 'csj-guiada' || temas?.accion !== 'csj-temas' || mia?.accion !== 'csj-mia') falla('tut.hub', `tarjetas ${JSON.stringify(hub.map((x) => x.accion))}`)
    else {
      if (g.premio !== premioEsperado || !g.premioVisible) falla('tut.hub', `la guiada dice «${g.premio}» (visible ${g.premioVisible}); se esperaba «${premioEsperado}»`)
      // TUT-1 T4 · «Aprender por tema» ya existe: sólo Mia dice «Pronto».
      if (temas.pronto || !mia.pronto || g.pronto) falla('tut.hub', '«Pronto» fuera de su sitio')
      if (!g.oro || temas.oro || mia.oro) falla('tut.hub', 'el oro sólido no es sólo el de la guiada')
      const chicas = hub.filter((x) => x.h < 44 || x.w < 44)
      if (chicas.length) falla('tut.hub', `bajo el piso de 44: ${chicas.map((x) => `${x.accion} ${x.w}×${x.h}`).join(', ')}`)
      const enColumna = g.top < temas.top && temas.top < mia.top
      const enFila = g.top === temas.top && temas.top === mia.top && g.left < temas.left && temas.left < mia.left
      if (tam === 'T1' && !enColumna) falla('tut.hub', 'en el teléfono vertical no van una por fila')
      if (tam !== 'T1' && !enFila) falla('tut.hub', `en ${tam} no van en fila`)
      const dentro = hub.every((x) => x.left >= 0 && x.left + x.w <= vp.w + 0.5 && x.top + x.h <= vp.h + 0.5)
      if (!dentro) falla('tut.hub', 'una tarjeta se sale de la pantalla')
    }
    if (!query) {
      await page.evaluate(() => document.querySelectorAll('style').forEach((s) => { if (s.textContent.includes('animation-play-state:paused')) s.remove() }))
      await tocar('[data-accion="csj-mia"]')
      const aviso = await page.waitForFunction(() => document.querySelector('.sal-toast.is-on')?.textContent.trim() ?? null, null, { timeout: 3000 }).then((x) => x.jsonValue()).catch(() => null)
      if (!aviso) falla('tut.hub', '«Pregúntale a Mia» no avisó «Pronto»')
      // T4 · «Aprender por tema» abre el índice (lo recorre `tut temas`); de vuelta, la guiada.
      await tocar('[data-accion="csj-temas"]')
      const indice = await page.waitForSelector('.tem-fila[data-capitulo="1"]', { timeout: 15000 }).catch(() => null)
      if (!indice) falla('tut.hub', '«Aprender por tema» no abrió el índice')
      else {
        await tocar('[data-accion="volver"]')
        await page.waitForSelector('[data-accion="csj-guiada"]', { timeout: 15000 })
      }
      await tocar('[data-accion="csj-guiada"]')
      const capa = await page.waitForSelector('.tut-capa[data-listo]', { timeout: 20000 }).catch(() => null)
      if (!capa) falla('tut.hub', 'la tarjeta de la guiada no abrió la guiada')
    }
    await ctx.close()
  }
  pasa('tut.hub')

  // ══ tut.senales ═══════════════════════════════════════════════════════════
  if (vp.senales) {
    const { ctx, page, tocar, lobby } = await abrir({ guia: { ofrecida: true } })
    await lobby()
    await tocar('[data-accion="jugar-ia"]')
    for (const [fila, texto] of [['reto', null], ['jugadores', '3'], ['apuesta', null], ['entrada', null]]) {
      await page.waitForFunction(({ f, x }) => [...document.querySelectorAll(`[data-accion="${f}"]`)].some((b) => !b.disabled && (x === null || b.textContent.trim() === x)), { f: fila, x: texto }, { timeout: 10000 })
      await page.evaluate(({ f, x }) => [...document.querySelectorAll(`[data-accion="${f}"]`)].find((b) => !b.disabled && (x === null || b.textContent.trim() === x)).click(), { f: fila, x: texto })
    }
    await page.waitForFunction(() => { const b = document.querySelector('button.sal-cta.es-retar'); return b && !b.disabled }, null, { timeout: 15000 })
    await tocar('button.sal-cta.es-retar')
    await page.waitForSelector('[data-accion="iniciar-mano"]', { timeout: 20000 })
    out.senales = {}
    // Una pista: sale con su texto, sin velo y con su aro; Δ 0; no pisa el reloj ni las cartas.
    const mirar = async (clave, frase, { reloj = false } = {}) => {
      const h = await page.waitForFunction(PISTA, null, { timeout: 15000 }).catch(() => null)
      const p = h ? await h.jsonValue() : null
      out.senales[clave] = p
      if (!p) { falla('tut.senales', `«${clave}» no salió`); return false }
      if (!p.texto.includes(frase)) falla('tut.senales', `«${clave}» dice «${p.texto}»`)
      if (p.velo) falla('tut.senales', `«${clave}» con velo`)
      if (!p.aro) falla('tut.senales', `«${clave}» sin aro`)
      if (p.reloj) falla('tut.senales', `«${clave}» tapa el reloj de turno`)
      if (p.cartas) falla('tut.senales', `«${clave}» tapa ${p.cartas} cartas`)
      if (p.lineas > 2) out.notas.push(`la pista «${clave}» va en ${p.lineas} líneas`)
      const estilo = await page.addStyleTag({ content: PAUSA })
      const sinCapa = async () => {
        const o = await page.addStyleTag({ content: '.tut-capa, .tut-capa * { visibility: hidden !important }' })
        const c = await page.evaluate(CAJAS)
        await o.evaluate((e) => e.remove())
        return c
      }
      const s1 = await sinCapa()
      const con = await page.evaluate(CAJAS)
      const s2 = await sinCapa()
      await estilo.evaluate((e) => e.remove())
      const quieta = delta(s1, s2).max === 0
      const d = delta(s2, con)
      if (quieta && d.max !== 0) falla('tut.senales', `«${clave}»: Δ ${d.max}`)
      if (!quieta) out.notas.push(`«${clave}»: la mesa no se quedó quieta para medir Δ`)
      if (reloj) {
        const a = await page.evaluate(RELOJ)
        await page.waitForTimeout(2200)
        const b = await page.evaluate(RELOJ)
        out.senales[`${clave}Reloj`] = [a, b]
        if (!(a !== null && b !== null && b < a)) falla('tut.senales', `«${clave}»: el reloj no corre (${a} → ${b})`)
      }
      return true
    }
    const apagada = async (clave) => {
      const ok = await page.waitForFunction(() => !document.querySelector('.tut-capa--libre'), null, { timeout: 8000 }).then(() => true).catch(() => false)
      if (!ok) falla('tut.senales', `«${clave}» no se apagó con su acción`)
    }
    // Lo que se toca en un turno: pasar si se puede; si no, igualar (nunca retirarse antes del
    // descarte: hace falta verlo). T5 · tras el descarte, retirarse antes que el all-in: un
    // all-in perdido deja la pila en cero y la mesa vuelve a Retar sin «Siguiente mano» (el rojo
    // de la serie de la tanda 5, que dependía del barajado).
    const jugarTurno = async () => {
      const orden = vistoDescarte ? ['pasar', 'igualar', 'retirarse', 'allin'] : ['pasar', 'igualar', 'allin', 'retirarse']
      const sel = await page.evaluate((o) => o.map((a) => `[data-ancla="fila-acciones"] [data-accion="${a}"]`).find((s) => document.querySelector(s)), orden)
      if (!sel) throw new Error('sin acción en la fila')
      await tocar(sel)
    }
    const esperarMomento = async () => (await page.waitForFunction(() => {
      if (document.querySelector('[data-accion="siguiente-mano"]')) return 'siguiente'
      if (document.querySelector('[data-ancla="fila-acciones"] [data-accion]')) return 'turno'
      if (document.querySelector('[data-accion="descartar"]')) return 'descarte'
      return null
    }, null, { timeout: 60000, polling: 200 }).catch(async (e) => {
      if (process.env.TUT_FOTO) await page.screenshot({ path: `${process.env.TUT_FOTO}/senales-${tam}.png` }).catch(() => {})
      const botones = await page.evaluate(() => [...document.querySelectorAll('[data-accion]')].map((x) => x.dataset.accion).join(',')).catch(() => '?')
      throw new Error(`sin momento de la mano (${(out.senales.secuencia ?? []).join(' → ')}; a la vista: ${botones}): ${String(e.message).split(String.fromCharCode(10))[0]}`)
    })).jsonValue()

    if (await mirar('iniciar', 'Iniciar mano')) { await tocar('[data-accion="iniciar-mano"]'); await apagada('iniciar') }
    // Mano 1: el primer turno lleva su pista; el primer descarte, la suya; los demás, ninguna.
    let vistoTurno = false
    let vistoDescarte = false
    let repetidas = 0
    const secuencia = []
    out.senales.secuencia = secuencia
    for (let k = 0; k < 20; k++) {
      const m = await esperarMomento()
      secuencia.push(m === 'turno' ? `turno(${await page.evaluate(() => [...document.querySelectorAll('[data-ancla="fila-acciones"] [data-accion]')].map((b) => b.dataset.accion).join('/'))})` : m)
      if (m === 'siguiente') break
      if (m === 'turno') {
        if (!vistoTurno) { vistoTurno = true; if (await mirar('turno', 'Te apuestan', { reloj: true })) { await jugarTurno(); await apagada('turno') } }
        else { if (await page.$('.tut-capa--libre')) repetidas++; await jugarTurno() }
      } else if (m === 'descarte') {
        if (!vistoDescarte) { vistoDescarte = true; if (await mirar('descartar', '20 segundos', { reloj: true })) { await tocar('[data-accion="descartar"]'); await apagada('descartar') } }
        else { await tocar('[data-accion="descartar"]') }
      }
      await page.waitForFunction((prev) => {
        const ahora = document.querySelector('[data-accion="siguiente-mano"]') ? 'siguiente'
          : document.querySelector('[data-ancla="fila-acciones"] [data-accion]') ? 'turno'
            : document.querySelector('[data-accion="descartar"]') ? 'descarte' : null
        return ahora !== prev || ahora === null
      }, m, { timeout: 15000, polling: 100 }).catch(() => {})
    }
    if (!vistoTurno) falla('tut.senales', 'la mano 1 no llegó a un turno de apuesta')
    if (!vistoDescarte) falla('tut.senales', `la mano 1 no llegó al descarte (${secuencia.join(' → ')})`)
    if (repetidas) falla('tut.senales', `${repetidas} turnos más de la mano 1 con pista`)
    // Mano 2: ninguna pista.
    const sig = await page.waitForSelector('[data-accion="siguiente-mano"]', { timeout: 30000 }).catch(() => null)
    if (sig) {
      await tocar('[data-accion="siguiente-mano"]')
      const m = await esperarMomento().catch(() => null)
      if (m === 'turno' || m === 'descarte') {
        await page.waitForTimeout(600)
        if (await page.$('.tut-capa--libre')) falla('tut.senales', `volvió una pista en la mano 2 (${m})`)
      } else out.notas.push(`la mano 2 no llegó a un turno (${m})`)
    } else out.notas.push('la mano 1 no terminó: la mano 2 no se miró')
    const g = await page.evaluate(GUIA)
    out.senales.marcas = g?.senales ?? null
    if (!(g?.senales?.iniciar && g?.senales?.apostar && g?.senales?.descartar)) falla('tut.senales', `marcas ${JSON.stringify(g?.senales)}`)
    pasa('tut.senales')
    await ctx.close()
  }
  if (errores.length) falla('tut.consola', errores.slice(0, 3).join(' | '))
  else pasa('tut.consola')
  return out
}

export async function runTutPuerta(browser, { base }) {
  const t0 = Date.now()
  const celdas = {}
  const fallos = []
  // Esta vara mide la oferta y las señales: sus contextos nacen como un aparato nuevo,
  // sin la guía «vista» que el arnés pone a todos los demás (`arnes/comun.mjs`).
  guiaReal()
  try {
    await Promise.all(Object.entries(T).map(async ([tam, vp]) => {
      try {
        celdas[tam] = await celda(browser, base, tam, vp)
        fallos.push(...celdas[tam].fallos)
      } catch (e) {
        fallos.push(`${tam}: el recorrido se cortó: ${String(e?.message || e).split('\n').slice(0, 2).join(' · ').slice(0, 300)}`)
      }
    }))
  } finally {
    guiaReal(false)
  }
  const verde = fallos.length === 0 && Object.keys(celdas).length === Object.keys(T).length
  const ms = Date.now() - t0
  console.log(`  tut.puerta · ${verde ? 'VERDE' : 'ROJO'} · ${Object.keys(celdas).join(' · ')} · ${(ms / 1000).toFixed(0)} s`)
  for (const f of fallos) console.log(`    ✗ ${f}`)
  for (const [tam, c] of Object.entries(celdas)) for (const n of c.notas ?? []) console.log(`    · ${tam} ${n}`)
  if (process.env.TUT_DETALLE) console.log(JSON.stringify(celdas, null, 1))
  return { verde, ms, fallos, celdas }
}
