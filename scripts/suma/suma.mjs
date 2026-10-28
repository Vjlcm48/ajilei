// ── RNK-1 1e · el modo `suma` de diagDSK ────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1e_v1.0.md §2.7. Vive en su módulo, como `rnk`;
// diagDSK sólo lo llama y lee su veredicto por `verde`.
//
// CONTRA EL BUNDLE REAL (4173), la sesión simulada de `contextoCap` y el banco
// imitado por contexto (el de `rnk`, con los 139 sembrados). El contador se
// siembra en `localStorage` ANTES de arrancar (una vez por contexto) y el
// mp4 se enruta al WebM de prueba (`scripts/arnes/fixtures/sumamente_prueba.webm`,
// 290×640, 4 s): el Chromium del arnés no reproduce H.264.
//
// Dos mandos sólo del arnés, en la página (nunca en el producto):
//   · la velocidad del video (`playbackRate` 0,5): con el WebM de 4 s, el
//     video dura 8 y deja ver «Omitir» a los 5 s ANTES del final;
//   · el bloqueo del sonido: el primer `play()` sin silencio se rechaza con
//     `NotAllowedError`, como hace un navegador que no deja sonar.
//
// LAS PUERTAS (cada una mide lo que dice; una puerta con menos medidas de las
// esperadas no es verde):
//   suma-contador  n = 6 → Rankings directo (n = 7) y cambiar de pestaña no
//                  cuenta; n = 7 → el intersticial (n = 0, día = hoy); n = 7 con
//                  el día gastado → Rankings directo y n = 0; Premium: la
//                  decisión con `premium` (núcleo) y la constante única de App;
//                  tras el video, n = 0 y día = hoy
//   suma-abre      `cargando` → `antes5`; sin «Omitir»; Google Play desde el
//                  primer fotograma, ≥ 48, `href`/`target`/`rel` exactos; el
//                  video del idioma (`_es.mp4`); sin botón de sonido si sonó
//   suma-omitir    «Omitir» a los 5 s (±0,4) del arranque, zona ≥ 44 × 44;
//                  tocarlo → Rankings, clave gastada
//   suma-fin       al terminar: `fin`, último fotograma, «Omitir» sigue,
//                  «Continuar» encendido en la caja que ya tenía (al
//                  centésimo); tocarlo → Rankings y ninguna entrada muerta en
//                  el historial
//   suma-caja      la caja a la proporción del video (±0,6 px), apilada o
//                  lateral según la lámina, todo dentro y sin desbordar, en
//                  360×640, 412×915, 915×412, 832×384, 1366×623 y 1920×1080
//   suma-sonido    con el sonido bloqueado: en silencio, el botón existe (≥ 44);
//                  tocarlo lo quita y `muted = false`
//   suma-atras     `history.back()` antes de 5 s: sigue en el intersticial;
//                  después: Rankings
//   suma-linea     la línea de la familia al final de la lista, en Maestros y
//                  Fortunas, con 100 y con pocas filas: `href` exacto, zona
//                  ≥ 44, contraste ≥ 4,5 sobre los tonos del verde y del vino,
//                  y el hueco con el alto de la 1c-i (`max(64px, 17u)`)
//   suma-escala    sin `data-escala`; ni el marco del video (`.vid-raiz`) ni
//                  otra pantalla montados detrás
//   consola        sin `pageerror` ni `console.error`
//
// `SUMA_FOTOS=<carpeta>` guarda capturas (fuera del repo) de cada tamaño.

import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { contextoCap } from '../cap/capMesa.mjs'
import { crearBanco } from '../../src/dev/bancoImitado.js'
import { sembradosRanking, PUNTOS_DEL_BYPASS } from '../../src/dev/sembradosRanking.js'
import { PERFIL_CAP } from '../cap/capMesa.mjs'
import { decidir, diaChicago, ENLACE_PLAY, CADA_ENTRADAS } from '../../src/lib/sumaCore.js'

const CLAVE = 'ajilei.sumamente'
const WEBM = readFileSync(new URL('../arnes/fixtures/sumamente_prueba.webm', import.meta.url))
const PROPORCION = 1280 / 580
const FOTOS = process.env.SUMA_FOTOS || null
if (FOTOS) mkdirSync(FOTOS, { recursive: true })

// La disposición que dibujó la lámina 1e-L (§2.2): lateral en apaisado ≤ 830 de alto.
const TAMANOS = [[360, 640], [412, 915], [915, 412], [832, 384], [744, 1100], [1366, 623], [1920, 1080]]
const CAJA_PUERTA = new Set(['360x640', '412x915', '915x412', '832x384', '1366x623', '1920x1080'])
const lateralDe = (w, h) => w > h && h <= 830

function bancoDe({ sembrados = sembradosRanking(), puntos = PUNTOS_DEL_BYPASS } = {}) {
  const b = crearBanco({ usuario: PERFIL_CAP.username, sembrados })
  if (puntos) b.sumarPuntos(PERFIL_CAP.username, puntos)
  return { get saldo() { return b.saldo }, llamar: (n, p) => b.llamar(n, p) }
}

// Lo que corre en la página antes que la app: la siembra del contador (una
// vez por contexto), el registro de estados y los dos mandos del arnés.
const INICIO = ({ clave, valor, rate, bloquea }) => {
  try {
    if (valor !== null && !sessionStorage.getItem('__sumaSembrada')) {
      localStorage.setItem(clave, valor)
      sessionStorage.setItem('__sumaSembrada', '1')
    }
  } catch { /* sin almacén */ }
  window.__suma = []
  const mira = () => {
    const m = document.querySelector('main.sm')
    const e = m ? m.dataset.sumaEstado : null
    const ultimo = window.__suma[window.__suma.length - 1]
    if (!ultimo || ultimo.e !== e) window.__suma.push({ e, t: performance.now() })
  }
  new MutationObserver(mira).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-suma-estado'] })
  const play = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function () {
    if (rate) { this.defaultPlaybackRate = rate; this.playbackRate = rate }
    if (bloquea && !this.muted && !this.__sumaBloqueado) {
      this.__sumaBloqueado = true
      return Promise.reject(new DOMException('arnés: el navegador no deja sonar', 'NotAllowedError'))
    }
    return play.call(this)
  }
}

async function abrirLobby(browser, base, w, h, errores, { n = 0, dia = null, rate = 0, bloquea = false, retraso = 0, banco = bancoDe() } = {}) {
  const { ctx, page } = await contextoCap(browser, { w, h, dpr: 1, movil: false }, base, { billetera: { banco } })
  page.on('pageerror', (e) => errores.push(`${w}x${h} pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`${w}x${h} console: ${m.text()}`) })
  const pedidos = []
  await page.route('**/sumamente/*.mp4', async (route) => {
    pedidos.push(new URL(route.request().url()).pathname)
    if (retraso) await new Promise((ok) => setTimeout(ok, retraso))
    await route.fulfill({ status: 200, contentType: 'video/webm', body: WEBM }).catch(() => {})
  })
  const valor = n === null ? null : JSON.stringify({ n, dia })
  await page.addInitScript(INICIO, { clave: CLAVE, valor, rate, bloquea })
  await page.goto(base)
  await page.waitForSelector('[data-accion="rankings"]', { timeout: 30000 })
  await page.mouse.move(2, 2)
  return { ctx, page, pedidos }
}

const leerClave = (page) => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k)) } catch { return 'basura' } }, CLAVE)
const enRankings = (page) => page.waitForSelector('main.sal[data-ranking][data-rnk-estado="listo"]', { timeout: 15000 })
const estadoSuma = (page, e, ms = 15000) => page.waitForSelector(`main.sm[data-suma-estado="${e}"]`, { timeout: ms })

// Las medidas de la pantalla (las de la lámina, `pantalla.html` `medidas()`).
const MEDIR = () => {
  const q = (s) => document.querySelector(s)
  const r = (s) => { const e = q(s); return e ? e.getBoundingClientRect() : null }
  const rgba = (s) => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 } }
  const sobre = (c, f) => ({ r: c.r * c.a + f.r * (1 - c.a), g: c.g * c.a + f.g * (1 - c.a), b: c.b * c.a + f.b * (1 - c.a), a: 1 })
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
  const fondoDe = (el) => {
    const capas = []
    for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c.a > 0) capas.push(c) }
    return capas.reverse().reduce((f, c) => sobre(c, f), { r: 0, g: 0, b: 0, a: 1 })
  }
  const contraste = (s, fondo) => {
    const el = q(s)
    if (!el) return null
    const f = fondo || fondoDe(el)
    const c = sobre(rgba(getComputedStyle(el).color), f)
    const [a, b] = [lum(c), lum(f)].sort((x, y) => y - x)
    return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100
  }
  const caja = r('.sm-caja'), play = r('.sm-play'), cont = r('.sm-cont'), omi = r('.sm-omitir'), fam = r('.sm-fam'), acc = r('.sm-acc'), son = r('.sm-sonido')
  const v = q('.sm-caja video')
  const dentro = (b) => !b || (b.top >= -0.5 && b.bottom <= innerHeight + 0.5 && b.left >= -0.5 && b.right <= innerWidth + 0.5)
  const root = document.getElementById('root')
  return {
    // `--u` se lee como su expresión (`clamp(…)`): se calcula como la lámina.
    u: Math.min(6, Math.max(3.2, Math.min(innerWidth, innerHeight) / 100)),
    estado: q('main.sm')?.dataset.sumaEstado ?? null,
    caja: caja && { x: caja.left, y: caja.top, w: caja.width, h: caja.height },
    fam: fam && { right: fam.right, bottom: fam.bottom },
    play: play && { w: play.width, h: play.height },
    cont: cont && { x: cont.left, y: cont.top, w: cont.width, h: cont.height },
    contVisible: !!q('.sm-cont') && getComputedStyle(q('.sm-cont')).visibility === 'visible',
    contActivo: !!q('.sm-cont') && !q('.sm-cont').disabled,
    omitir: omi && { x: omi.left, y: omi.top, w: omi.width, h: omi.height },
    sonido: son && { w: son.width, h: son.height },
    cabe: [caja, play, omi, fam, acc].every(dentro),
    desborda: document.documentElement.scrollHeight > innerHeight + 0.5 || document.documentElement.scrollWidth > innerWidth + 0.5,
    playHref: q('.sm-play')?.getAttribute('href') ?? null,
    playTarget: q('.sm-play')?.getAttribute('target') ?? null,
    playRel: q('.sm-play')?.getAttribute('rel') ?? null,
    video: v && { muted: v.muted, paused: v.paused, ended: v.ended, t: v.currentTime, d: v.duration, src: v.currentSrc },
    carga: r('.sm-carga img') && getComputedStyle(q('.sm-carga')).display !== 'none' ? r('.sm-carga img').width : null,
    escala: !!q('[data-escala]'),
    marcoVideo: !!q('.vid-raiz'),
    hijosRoot: root ? [...root.children].map((e) => `${e.tagName.toLowerCase()}.${e.className}`) : null,
    historia: !!(history.state && history.state.ajileiSumaMente),
    c: {
      play: contraste('.sm-play b'), playSub: contraste('.sm-play small'), familia: contraste('.sm-fam span'),
      omitir: contraste('.sm-omitir'), cont: contraste('.sm-cont', { r: 232, g: 184, b: 75, a: 1 }),
    },
  }
}

// El contraste WCAG de un texto (con su alfa) compuesto sobre un tono opaco.
function contrasteSobre(texto, fondoHex) {
  const m = texto.match(/[\d.]+/g).map(Number)
  const [r, g, b, a = 1] = m
  const F = [1, 3, 5].map((i) => parseInt(fondoHex.slice(i, i + 2), 16))
  const c = [r * a + F[0] * (1 - a), g * a + F[1] * (1 - a), b * a + F[2] * (1 - a)]
  const L = (x) => { const v = x.map((y) => { y /= 255; return y <= 0.03928 ? y / 12.92 : ((y + 0.055) / 1.055) ** 2.4 }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] }
  const [p, q] = [L(c), L(F)].sort((x, y) => y - x)
  return (p + 0.05) / (q + 0.05)
}

const r2 = (x) => (x == null ? 'null' : Math.round(x * 100) / 100)

export async function runSuma(browser, { base }) {
  const errores = []
  const puertas = {}
  const medidas = []
  const p = (k) => (puertas[k] ??= { fallos: [], medidas: [], esperadas: 0 })
  const anota = (k, ok, quien, valor) => {
    const x = p(k)
    x.medidas.push(`${quien} ${valor}`)
    if (!ok) x.fallos.push(`${quien} ${valor}`)
  }
  for (const [k, n] of Object.entries({
    'suma-contador': 5, 'suma-abre': 1, 'suma-omitir': 1, 'suma-fin': 2, 'suma-caja': 6,
    'suma-sonido': 1, 'suma-atras': 1, 'suma-linea': 4, 'suma-escala': 2,
  })) p(k).esperadas = n
  const hoy = diaChicago()
  const corre = async (nombre, fn) => {
    try { await fn() } catch (e) { errores.push(`${nombre}: ${String(e.message).split('\n')[0]}`) }
  }

  // ── suma-contador: n = 6 → Rankings directo; cambiar de pestaña no cuenta ──
  await corre('contador n=6', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 412, 915, errores, { n: 6 })
    await page.click('[data-accion="rankings"]')
    await enRankings(page)
    const k1 = await leerClave(page)
    await page.click('.rnk-pestanas .sal-chip:nth-child(2)')
    await page.waitForSelector('main.sal[data-ranking="fortunas"][data-rnk-estado="listo"]', { timeout: 10000 })
    const k2 = await leerClave(page)
    const sinSuma = !(await page.$('main.sm'))
    anota('suma-contador', sinSuma && k1?.n === 7 && k1?.dia === null && k2?.n === 7, 'n=6',
      `rankings directo=${sinSuma} clave=${JSON.stringify(k1)} tras cambiar de pestaña=${JSON.stringify(k2)}`)
    await ctx.close()
  })

  // ── suma-contador: n = 7 con el día gastado → Rankings directo y n = 0 ──
  await corre('contador gastado', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 412, 915, errores, { n: 7, dia: hoy })
    await page.click('[data-accion="rankings"]')
    await enRankings(page)
    const k = await leerClave(page)
    const sinSuma = !(await page.$('main.sm'))
    anota('suma-contador', sinSuma && k?.n === 0 && k?.dia === hoy, 'n=7 día gastado', `rankings directo=${sinSuma} clave=${JSON.stringify(k)}`)
    await ctx.close()
  })

  // ── Premium: el bundle no tiene la condición (hoy no existe); se mide la
  //    decisión en el núcleo y que la constante de App sea única y falsa ──
  {
    const d = decidir({ n: CADA_ENTRADAS - 1, ultimoDia: null, hoy, premium: true })
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8')
    const defs = [...app.matchAll(/const esPremium\s*=\s*([^\n]+)/g)].map((m) => m[1].trim())
    const usa = /premium:\s*esPremium/.test(app)
    anota('suma-contador', !d.mostrar && d.n === 0 && defs.length === 1 && defs[0] === 'false' && usa, 'premium',
      `núcleo=${JSON.stringify(d)} App: esPremium=${JSON.stringify(defs)} pasa a decidir=${usa}`)
  }

  // ── suma-contador (n = 7 → intersticial) + suma-abre + suma-escala ──
  await corre('abre', async () => {
    const { ctx, page, pedidos } = await abrirLobby(browser, base, 412, 915, errores, { n: 7, retraso: 700 })
    await page.click('[data-accion="rankings"]')
    await page.waitForSelector('main.sm', { timeout: 10000 })
    const k = await leerClave(page)
    anota('suma-contador', k?.n === 0 && k?.dia === hoy, 'n=7', `intersticial=sí clave=${JSON.stringify(k)} (el día se gasta al aparecer)`)
    const m0 = await page.evaluate(MEDIR)
    if (FOTOS) await page.screenshot({ path: join(FOTOS, 'cargando_412x915.png') })
    await estadoSuma(page, 'antes5')
    const m1 = await page.evaluate(MEDIR)
    const estados = await page.evaluate(() => window.__suma.map((x) => x.e).filter(Boolean))
    const ok = m0.estado === 'cargando' && !m0.omitir && m0.play?.h >= 48 && m0.carga > 0
      && estados[0] === 'cargando' && m1.estado === 'antes5' && !m1.omitir && m1.play?.h >= 48
      && m0.playHref === ENLACE_PLAY && m0.playTarget === '_blank' && m0.playRel === 'noopener noreferrer'
      && pedidos[0] === '/sumamente/sumamente_promo_es.mp4' && !m1.sonido && m1.video.muted === false
    anota('suma-abre', ok, '412x915',
      `estados=${estados.join('→')} omitir=${!!m0.omitir}/${!!m1.omitir} play=${r2(m0.play?.h)} icono=${r2(m0.carga)} href=${m0.playHref === ENLACE_PLAY} target=${m0.playTarget} rel=${m0.playRel} pedido=${pedidos[0]} sonido=${m1.video.muted ? 'silencio' : 'con sonido'} botónSonido=${!!m1.sonido}`)
    anota('suma-escala', !m1.escala && !m1.marcoVideo && m1.hijosRoot?.length === 1 && m1.hijosRoot[0].startsWith('main.sm'), '412x915 intersticial',
      `data-escala=${m1.escala} .vid-raiz=${m1.marcoVideo} #root=${JSON.stringify(m1.hijosRoot)}`)
    await ctx.close()
  })

  // ── suma-omitir: a los 5 s, con el video a media velocidad (dura 8 s) ──
  await corre('omitir', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 360, 640, errores, { n: 7, rate: 0.5 })
    await page.click('[data-accion="rankings"]')
    await estadoSuma(page, 'antes5')
    await page.waitForTimeout(4300)
    const antes = await page.evaluate(MEDIR)
    await estadoSuma(page, 'despues5', 4000)
    const m = await page.evaluate(MEDIR)
    const t = await page.evaluate(() => {
      const a = window.__suma.find((x) => x.e === 'antes5'), d = window.__suma.find((x) => x.e === 'despues5')
      return a && d ? d.t - a.t : null
    })
    await page.click('[data-accion="sm-omitir"]')
    await enRankings(page)
    const k = await leerClave(page)
    const fuera = !(await page.$('main.sm'))
    const ok = !antes.omitir && antes.estado === 'antes5' && Math.abs(t - 5000) <= 400 && m.omitir?.w >= 44 && m.omitir?.h >= 44
      && m.video.ended === false && fuera && k?.n === 0 && k?.dia === hoy
    anota('suma-omitir', ok, '360x640',
      `a 4,3 s omitir=${!!antes.omitir} · aparece a ${r2(t)} ms del arranque (video en ${r2(m.video.t)} s de ${r2(m.video.d)}) · zona ${r2(m.omitir?.w)}×${r2(m.omitir?.h)} · tocar → Rankings=${fuera} clave=${JSON.stringify(k)}`)
    await ctx.close()
  })

  // ── suma-fin: el WebM de 4 s hasta el final ──
  await corre('fin', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 412, 915, errores, { n: 7 })
    await page.click('[data-accion="rankings"]')
    await estadoSuma(page, 'antes5')
    const a = await page.evaluate(MEDIR)
    await estadoSuma(page, 'fin', 10000)
    await page.waitForTimeout(400)   // el fundido de 220 ms
    const f = await page.evaluate(MEDIR)
    const misma = ['x', 'y', 'w', 'h'].every((c) => Math.abs(a.cont[c] - f.cont[c]) < 0.01)
    const ultimo = f.video.ended && Math.abs(f.video.t - f.video.d) < 0.05
    anota('suma-fin', f.estado === 'fin' && ultimo && !!f.omitir && f.contVisible && f.contActivo && !a.contVisible && !a.contActivo && misma, '412x915',
      `estado=${f.estado} último fotograma=${ultimo} (${r2(f.video.t)}/${r2(f.video.d)}) omitir=${!!f.omitir} continuar antes=${a.contVisible}/${a.contActivo} después=${f.contVisible}/${f.contActivo} caja ${JSON.stringify(a.cont)} → ${JSON.stringify(f.cont)} misma=${misma}`)
    await page.click('[data-accion="sm-continuar"]')
    await enRankings(page)
    await page.waitForTimeout(300)
    const k = await leerClave(page)
    const tras = await page.evaluate(() => ({ suma: !!document.querySelector('main.sm'), historia: !!(history.state && history.state.ajileiSumaMente), escala: !!document.querySelector('[data-escala]') }))
    anota('suma-fin', !tras.suma && !tras.historia, '412x915 continuar', `→ Rankings=${!tras.suma} entrada muerta en el historial=${tras.historia}`)
    anota('suma-contador', k?.n === 0 && k?.dia === hoy, 'tras el video', `clave=${JSON.stringify(k)}`)
    anota('suma-escala', !tras.escala, '412x915 Rankings tras el intersticial', `data-escala=${tras.escala}`)
    await ctx.close()
  })

  // ── suma-caja: los tamaños de la lámina, al final del video (todo a la vista) ──
  for (const [w, h] of TAMANOS) {
    const clave = `${w}x${h}`
    await corre(`caja ${clave}`, async () => {
      const { ctx, page } = await abrirLobby(browser, base, w, h, errores, { n: 7 })
      await page.click('[data-accion="rankings"]')
      await estadoSuma(page, 'fin', 12000)
      await page.waitForTimeout(400)
      const m = await page.evaluate(MEDIR)
      if (FOTOS) await page.screenshot({ path: join(FOTOS, `fin_${clave}.png`) })
      const prop = Math.abs(m.caja.h - m.caja.w * PROPORCION)
      const lateral = m.caja.x > m.fam.right - 0.5
      const fila = {
        tam: clave, u: r2(m.u), disposicion: lateral ? 'lateral' : 'apilada',
        caja: `${r2(m.caja.w)} × ${r2(m.caja.h)}`, pct: r2((m.caja.h / h) * 100), desvio: r2(prop),
        play: `${r2(m.play.h)} × ${r2(m.play.w)}`, cont: r2(m.cont.h), omitir: `${r2(m.omitir?.w)} × ${r2(m.omitir?.h)} @ (${r2(m.omitir?.x)}, ${r2(m.omitir?.y)})`,
        cabe: m.cabe, desborda: m.desborda, c: m.c,
      }
      medidas.push(fila)
      if (CAJA_PUERTA.has(clave)) {
        anota('suma-caja', prop <= 0.6 && lateral === lateralDe(w, h) && m.cabe && !m.desborda && m.play.h >= 48 && m.cont.h >= 44 && m.omitir?.h >= 44, clave,
          `${fila.disposicion} caja ${fila.caja} (desvío ${fila.desvio} px, ${fila.pct} % del alto) play ${fila.play} continuar ${fila.cont} omitir ${fila.omitir} cabe=${m.cabe} desborda=${m.desborda}`)
      }
      await ctx.close()
    })
  }

  // ── suma-sonido: el navegador no deja sonar ──
  await corre('sonido', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 360, 640, errores, { n: 7, bloquea: true, rate: 0.5 })
    await page.click('[data-accion="rankings"]')
    await estadoSuma(page, 'antes5')
    await page.waitForTimeout(200)
    const a = await page.evaluate(MEDIR)
    if (FOTOS) await page.screenshot({ path: join(FOTOS, 'silencio_360x640.png') })
    await page.click('[data-accion="sm-sonido"]')
    await page.waitForTimeout(200)
    const d = await page.evaluate(MEDIR)
    const raiz = await page.evaluate(() => document.querySelector('main.sm').dataset.sumaSonido)
    anota('suma-sonido', a.sonido?.w >= 44 && a.sonido?.h >= 44 && a.video.muted && !a.video.paused && !d.sonido && d.video.muted === false && !d.video.paused && raiz === 'si', '360x640 bloqueado',
      `botón ${r2(a.sonido?.w)}×${r2(a.sonido?.h)} muted=${a.video.muted} en marcha=${!a.video.paused} · tocar → botón=${!!d.sonido} muted=${d.video.muted} en marcha=${!d.video.paused}`)
    await ctx.close()
  })

  // ── suma-atras: el botón «atrás» antes y después de los 5 s ──
  await corre('atras', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 412, 915, errores, { n: 7, rate: 0.5 })
    await page.click('[data-accion="rankings"]')
    await estadoSuma(page, 'antes5')
    await page.waitForTimeout(1000)
    await page.evaluate(() => history.back())
    await page.waitForTimeout(600)
    const antes = await page.evaluate(() => ({ suma: !!document.querySelector('main.sm'), estado: document.querySelector('main.sm')?.dataset.sumaEstado ?? null, rnk: !!document.querySelector('main.sal[data-ranking]') }))
    await estadoSuma(page, 'despues5', 6000)
    await page.evaluate(() => history.back())
    await enRankings(page)
    const despues = !(await page.$('main.sm'))
    anota('suma-atras', antes.suma && antes.estado === 'antes5' && !antes.rnk && despues, '412x915',
      `atrás a ~1 s: sigue=${antes.suma} (${antes.estado}) · atrás tras 5 s → Rankings=${despues}`)
    await ctx.close()
  })

  // ── suma-linea: Maestros y Fortunas, con 100 y con pocas filas ──
  const linea = async (page, quien) => {
    await page.evaluate(() => { const l = document.querySelector('.rnk-lista'); l.scrollTop = 1e6 })
    await page.waitForTimeout(150)
    const m = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const a = q('.rnk-familia')
      if (!a) return null
      const b = a.getBoundingClientRect(), hueco = q('.rnk-premium').getBoundingClientRect(), lista = q('.rnk-lista').getBoundingClientRect()
      const css = getComputedStyle(document.documentElement)
      const u = Math.min(6, Math.max(3.2, Math.min(innerWidth, innerHeight) / 100))
      return {
        filas: document.querySelectorAll('.rnk-filas .rnk-fila').length,
        ultimo: q('.rnk-lista').lastElementChild === q('.rnk-premium') && q('.rnk-premium').contains(a),
        href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), accion: a.dataset.accion,
        nombre: a.getAttribute('aria-label'), w: b.width, h: b.height, visible: getComputedStyle(a).visibility,
        aLaVista: b.top >= lista.top - 0.5 && b.bottom <= lista.bottom + 0.5,
        hueco: hueco.height, huecoLamina: Math.max(64, 17 * u),
        colores: [getComputedStyle(a.querySelector('b')).color, getComputedStyle(a.querySelector('span')).color],
        tonos: ['--green-base', '--green-deep', '--green-abyss', '--vino', '--vino-deep', '--vino-abyss'].map((k) => css.getPropertyValue(k).trim()),
        ranking: q('main.sal').dataset.ranking,
      }
    })
    if (!m) { anota('suma-linea', false, quien, 'sin línea'); return }
    const tonos = m.ranking === 'fortunas' ? m.tonos.slice(3) : m.tonos.slice(0, 3)
    const peor = Math.min(...m.colores.flatMap((c) => tonos.map((t) => contrasteSobre(c, t))))
    anota('suma-linea', m.ultimo && m.aLaVista && m.visible === 'visible' && m.href === ENLACE_PLAY && m.target === '_blank' && m.rel === 'noopener noreferrer'
      && m.accion === 'sumamente' && m.h >= 44 && m.w >= 44 && Math.abs(m.hueco - m.huecoLamina) <= 0.5 && peor >= 4.5, quien,
    `filas=${m.filas} al final=${m.ultimo} ${r2(m.w)}×${r2(m.h)} hueco=${r2(m.hueco)} (1c-i ${r2(m.huecoLamina)}) contraste peor=${r2(peor)} sobre ${tonos.join('/')} nombre="${m.nombre}"`)
  }
  await corre('linea 100', async () => {
    const { ctx, page } = await abrirLobby(browser, base, 412, 915, errores, { n: 0 })
    await page.click('[data-accion="rankings"]')
    await enRankings(page)
    await linea(page, '412x915 Maestros 100')
    if (FOTOS) await page.screenshot({ path: join(FOTOS, 'linea_maestros_412x915.png') })
    await page.click('.rnk-pestanas .sal-chip:nth-child(2)')
    await page.waitForSelector('main.sal[data-ranking="fortunas"][data-rnk-estado="listo"]', { timeout: 10000 })
    await linea(page, '412x915 Fortunas 100')
    if (FOTOS) await page.screenshot({ path: join(FOTOS, 'linea_fortunas_412x915.png') })
    await ctx.close()
  })
  await corre('linea pocos', async () => {
    const todos = sembradosRanking()
    const pocos = [...todos.filter((j) => j.puntos).slice(0, 5), todos.find((j) => j.username === 'Rio_Caroni')]
    const { ctx, page } = await abrirLobby(browser, base, 360, 640, errores, { n: 0, banco: bancoDe({ sembrados: pocos }) })
    await page.click('[data-accion="rankings"]')
    await enRankings(page)
    await linea(page, '360x640 Maestros pocos')
    await page.click('.rnk-pestanas .sal-chip:nth-child(2)')
    await page.waitForSelector('main.sal[data-ranking="fortunas"][data-rnk-estado="listo"]', { timeout: 10000 })
    await linea(page, '360x640 Fortunas pocos')
    if (FOTOS) await page.screenshot({ path: join(FOTOS, 'linea_fortunas_pocos_360x640.png') })
    await ctx.close()
  })

  for (const x of Object.values(puertas)) x.ok = x.fallos.length === 0 && x.medidas.length === x.esperadas
  puertas.consola = { errores, ok: errores.length === 0 }
  const verde = Object.values(puertas).every((x) => x.ok === true)
  const resumen = `${verde ? 'VERDE' : 'ROJO'} · ` + Object.entries(puertas).map(([k, x]) => `${k} ${x.ok ? '✓' : '✗'}${x.medidas ? ` (${x.medidas.length}/${x.esperadas})` : ''}`).join(' · ')
  console.log(`── SUMA · ${resumen}`)
  for (const [k, x] of Object.entries(puertas)) {
    for (const f of x.fallos ?? []) console.log(`   ${k} ✗ ${f}`)
    for (const mm of x.medidas ?? []) console.log(`   ${k} · ${mm}`)
  }
  for (const f of medidas) console.log(`   medida · ${JSON.stringify(f)}`)
  for (const e of errores.slice(0, 8)) console.log(`   consola · ${e}`)
  return { verde, puertas, medidas, resumen }
}
