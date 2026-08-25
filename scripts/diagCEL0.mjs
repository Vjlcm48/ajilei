// ── diagCEL0.mjs · Arnés de la campaña CEL ──────────────────────────────────
// Read-only sobre src/. Uso: `npm run dev` en otra consola, luego
//   node scripts/diagCEL0.mjs                → modo `diagnostico` (CEL-0)
//   node scripts/diagCEL0.mjs celebracion    → modo `celebracion` (CEL-1)
//
// El modo `celebracion` es PERMANENTE: la campaña entera y sus regresiones
// futuras miden esta pantalla con él. Vive aquí y no en un archivo propio
// porque necesita la ruta del molde (`alaVictoria`) y el control negativo, que
// ya están escritos y no deben existir dos veces.
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
const MODO = process.argv[2] ?? 'diagnostico'
const OUT  = MODO === 'celebracion' ? '../_cel1' : '../_cel0'
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
  // Las dos familias juntas a propósito: tras CEL-1, ver `.vc-tarjeta` en "no
  // monta" y `.cel-tarjeta` con medidas ES la prueba de la sustitución de piel.
  '.cel-screen', '.cel-ajilei', '.cel-frase', '.cel-tarjeta', '.cel-netas-num',
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
async function alaVictoria(page, mesa, semilla = '', opciones = {}) {
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
  // CEL-1 partió la pantalla terminal en dos: la VICTORIA es `.cel-screen` y la
  // DERROTA sigue siendo `.game-over-screen`. La ruta espera a cualquiera de las
  // dos porque su trabajo es llegar al final de la mesa, no juzgar cuál salió —
  // eso lo hace cada modo con sus puertas.
  await page.waitForSelector('.cel-screen, .game-over-screen', { timeout: 15000 })
  // CEL-2 · la pantalla de victoria ya NO está quieta cuando aparece: arranca
  // sobria y llega al reposo unos cinco segundos después. Todo lo que mide
  // CAJAS —las puertas de CEL-1, el barrido de frases, el modo `diagnostico`—
  // tiene que esperar a que se pare, o mediría un fotograma del arco.
  // Quien quiera medir el arco EN MARCHA pasa `{ reposo: false }`, que es lo que
  // hace la sección CEL-2 de este mismo archivo.
  if (opciones.reposo !== false && await page.locator('.cel-screen').count() > 0) {
    await page.waitForSelector('.cel-screen[data-fase="reposo"]', { timeout: 20000 })
  }
  await page.evaluate(() => Promise.all(
    document.getAnimations()
      .filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
      .map(a => a.finished.catch(() => {}))
  ))
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
}

// ── MODO `celebracion` · CEL-1 ──────────────────────────────────────────────
// Mide la pantalla que la lámina selló y abre las seis puertas del encargo.
// NO mide "se parece": mide CAJAS contra las cifras de la lámina, con
// tolerancia de REDONDEO (0,6 px) y no de diseño — un 40 que sale 44 es rojo.
const LAMINA = {
  // font-size de `h1.cel-ajilei` · `.cel-netas-num` · lado de la moneda · `.cel-frase`
  escritorio:      { ajilei: 72, cifra: 40, moneda: 56, frase: 26 },
  movilVertical:   { ajilei: 40, cifra: 34, moneda: 48, frase: 18 },
  movilHorizontal: { ajilei: 32, cifra: 34, moneda: 48, frase: 18 },
}
const TOL = 0.6
const SALDO_INICIAL = 5000   // AJILEI_CONFIG.economy.saldoInicial

// Qué piel toca en cada celda, con las MISMAS consultas que usan el JSX y la
// hoja (`GameTable.jsx:72-87`). Se derivan aquí en vez de leerlas del CSS a
// propósito: si la hoja se equivocara de breakpoint, el arnés no repetiría su
// error — diría que la celda esperaba otra cosa.
function pielDe(w, h) {
  const portrait = h >= w
  if (portrait && w <= 767) return 'movilVertical'
  if (!portrait && h <= 600) return 'movilHorizontal'
  return 'escritorio'
}

function sondaPantalla() {
  void document.body.offsetWidth
  const uno = (sel) => document.querySelector(sel)
  const rangoDe = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect() }
  const caja = (el) => {
    if (!el) return null
    const b = el.getBoundingClientRect(), cs = getComputedStyle(el)
    const t = rangoDe(el)
    return {
      x: b.x, y: b.y, w: b.width, h: b.height,
      textoW: t.width, textoH: t.height,
      fontSize: parseFloat(cs.fontSize), lineHeight: cs.lineHeight,
      color: cs.color, texto: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    }
  }
  // El valor de una línea de la tarjeta, buscado POR SU RÓTULO y no por
  // posición: si mañana el orden cambia, el arnés sigue midiendo lo que dice.
  const dd = (rotulo) => {
    for (const d of document.querySelectorAll('.cel-detalle > div')) {
      const dt = d.querySelector('dt')
      if (dt && dt.textContent.trim() === rotulo) return d.querySelector('dd')?.textContent?.trim() ?? null
    }
    return null
  }
  const moneda = uno('.cel-netas-ico .chip-token')
  const mb = moneda ? moneda.getBoundingClientRect() : null
  const frase = uno('.cel-frase')
  const lh = frase ? parseFloat(getComputedStyle(frase).lineHeight) : 0
  const rangoFrase = frase ? rangoDe(frase) : null

  return {
    ajilei: caja(uno('h1.cel-ajilei')),
    frase: caja(frase),
    tarjeta: caja(uno('.cel-tarjeta')),
    cifra: caja(uno('.cel-netas-num')),
    moneda: mb ? { w: mb.width, h: mb.height } : null,
    // Renglones por el RANGO del texto dividido por la altura de línea
    // resuelta. El rango mide el texto, no la caja.
    renglonesFrase: rangoFrase && lh > 0 ? Math.round(rangoFrase.height / lh) : null,
    // Y aparte, si el clamp llegó a recortar: eso sería una frase mutilada,
    // que es un fallo distinto de "ocupa tres renglones".
    fraseRecortada: frase ? frase.scrollHeight > frase.clientHeight + 0.5 : null,
    fraseDentro: frase ? (() => {
      const p = frase.parentElement.getBoundingClientRect()
      const b = frase.getBoundingClientRect()
      return b.left >= p.left - 0.5 && b.right <= p.right + 0.5 && b.bottom <= p.bottom + 0.5
    })() : null,
    saldo: dd('Saldo actual'),
    puntos: dd('Puntos obtenidos'),
    manosGanadas: dd('Manos ganadas'),
    // La cifra de sesión, para cruzarla con el saldo: `fichasNetas` es
    // `chips - 5000`, así que saldo y netas tienen que cuadrar entre sí.
    netas: uno('.cel-netas-num')?.textContent?.trim() ?? null,
    // Ancho de CONTENIDO de la columna: es el 100% contra el que resuelve el
    // `min(420px, 100%)` de la tarjeta. Derivarlo del viewport, como hacía la
    // primera corrida, ignora el padding de los ancestros y da un rojo que es
    // del arnés (esperaba 339 donde la columna sólo ofrece 297).
    anchoColumna: (() => {
      const el = uno('.cel-screen')
      if (!el) return null
      const b = el.getBoundingClientRect(), cs = getComputedStyle(el)
      const px = (n) => parseFloat(cs.getPropertyValue(n)) || 0
      return b.width - px('padding-left') - px('padding-right')
        - px('border-left-width') - px('border-right-width')
    })(),
    // El botón primario tiene que ser UNO: dos primarios en una pantalla
    // terminal es justo lo que la lámina vino a ordenar.
    primarios: document.querySelectorAll('.cel-screen .btn-primary').length,
    ranking: (() => {
      const r = uno('.cel-ranking')
      if (!r) return null
      return {
        disabled: r.disabled === true,
        ariaDisabled: r.getAttribute('aria-disabled'),
        etiqueta: r.textContent.replace(/\s+/g, ' ').trim(),
        pastilla: !!r.querySelector('.soon-tag'),
        href: r.getAttribute('href'),
      }
    })(),
    // La piel VIEJA no debe montar en victoria: si `.game-over-screen` sigue
    // ahí, la pantalla nueva no sustituyó nada — se le sumó.
    pielVieja: document.querySelectorAll('.game-over-screen').length,
    // ── EL ENCAJE ────────────────────────────────────────────────────────
    // La puerta que faltaba en la primera corrida. Medir las cajas UNA A UNA
    // no dice nada sobre la SUMA: a 640x360 las cinco piezas daban sus cifras
    // exactas y aun así la tarjeta salía cortada por abajo, con el botón de
    // salir fuera de la pantalla. Ocho verdes y una captura que enseñaba el
    // fallo. Aquí se mide lo que de verdad importa: si la columna entera cabe
    // en el hueco que le queda bajo la cabecera, y si la última pieza —el
    // enlace de ranking, que cierra la columna— está DENTRO del viewport.
    encaje: (() => {
      const s = document.querySelector('.cel-screen')
      const ultima = document.querySelector('.cel-ranking')
      if (!s) return null
      const r = s.getBoundingClientRect()
      const u = ultima ? ultima.getBoundingClientRect() : null
      return {
        altoColumna: Math.round(r.height),
        huecoDisponible: Math.round(window.innerHeight - r.top),
        desbordaColumna: s.scrollHeight > s.clientHeight + 1,
        ultimaPiezaAbajo: u ? Math.round(u.bottom) : null,
        ultimaPiezaDentro: u ? u.bottom <= window.innerHeight + 1 : null,
      }
    })(),
  }
}

// La puerta 6: con la mesa terminada no se puede lanzar una reacción.
async function puertaReacciones(page) {
  await page.click('.utilities-trigger')
  await page.waitForSelector('.util-item-reacciones', { timeout: 5000 })
  const estado = await page.evaluate(() => {
    const b = document.querySelector('.util-item-reacciones')
    return { disabled: b.disabled === true, clase: b.className }
  })
  // Se intenta pulsar de todas formas: un `disabled` que no bloquea el clic no
  // es una puerta, es un adorno.
  await page.click('.util-item-reacciones', { force: true }).catch(() => {})
  await page.waitForTimeout(300)
  const montado = await page.evaluate(() => ({
    selector: document.querySelectorAll('.u2-selector').length,
    burbuja: document.querySelectorAll('.u2-burbuja').length,
  }))
  return { ...estado, ...montado }
}

// ── CEL-2 · EL ARCO ─────────────────────────────────────────────────────────
// Lo que esta sección mide no son cajas, son INSTANTES, y un instante no se
// fotografía: cuando la captura llega, ya pasó. Así que se mide de dos maneras
// a la vez y se cruzan:
//   · desde DENTRO, con las marcas que el arco publica en `window.__AJILEI_ARCO`
//     (dev-only, `src/dev/arcoCEL.js`) — dan el reloj exacto de cada tiempo;
//   · desde FUERA, con observadores de DOM sobre `data-fase` y sobre los nodos
//     de la lluvia — dan lo que de verdad se pintó.
// Si las dos discreparan, una de las dos miente y eso también es un hallazgo.

// Los siete nombres, escritos otra vez a propósito: si alguien renombra un asset
// y actualiza el config, el arnés tiene que DISCREPAR, no seguirle.
const MELODIAS_CEL = [
  'celebracion-gaita-01', 'celebracion-joropo-01', 'celebracion-latinjazz-01',
  'celebracion-percusion-01', 'celebracion-solemne-01',
  'celebracion-brillante-01', 'celebracion-fiesta-01',
]
const GOTAS_TECHO = 18      // lámina CEL-2
const TOC_MS = 1896         // duración medida de table-knock.mp3 (mapa de audio, CEL-0)

// Observadores, instalados en cuanto la pantalla monta y antes de que reviente.
function instalaSondaArco() {
  const s = document.querySelector('.cel-screen')
  if (!s) return false
  const t0 = performance.now()
  const ahora = () => Math.round(performance.now() - t0)
  const reg = {
    t0, fases: [{ fase: s.dataset.fase, t: 0 }],
    nacidas: [], vivasMax: 0, cuadros: [], errores: [],
  }
  window.__CEL2 = reg

  new MutationObserver(() => {
    const f = s.dataset.fase
    if (reg.fases[reg.fases.length - 1].fase !== f) reg.fases.push({ fase: f, t: ahora() })
  }).observe(s, { attributes: true, attributeFilter: ['data-fase'] })

  // Nacimientos de monedas. Se observa el SUBÁRBOL de la pantalla porque la capa
  // de lluvia todavía no existe: nace con la fiesta.
  //
  // Y se cuentan también las monedas que llegan DENTRO del nodo añadido, no sólo
  // las que se añaden sueltas. La primera corrida enseñó por qué: la capa se
  // monta ya con su primera moneda dentro, así que `addedNodes` traía la CAPA y
  // la moneda no se contaba — el informe decía 15 nacidas y 16 vivas a la vez,
  // que es imposible. La contradicción es lo que delató el fallo de la sonda.
  new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue
        if (n.classList.contains('cel-gota')) { reg.nacidas.push(ahora()); continue }
        const dentro = n.querySelectorAll ? n.querySelectorAll('.cel-gota').length : 0
        for (let k = 0; k < dentro; k++) reg.nacidas.push(ahora())
      }
    }
  }).observe(s, { childList: true, subtree: true })

  // Vivas y cuadros, en el mismo rAF: el techo de 18 hay que cazarlo en vuelo, y
  // el ritmo de cuadros es la medida que decide nodos contra canvas.
  let ultimo = performance.now()
  const tick = () => {
    const t = performance.now()
    const vivas = document.querySelectorAll('.cel-gota').length
    if (vivas > reg.vivasMax) reg.vivasMax = vivas
    if (vivas > 0) reg.cuadros.push(Math.round((t - ultimo) * 100) / 100)
    ultimo = t
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  return true
}

// Una foto del estado visible: los dos mandos del resplandor, la frase, las
// cifras y cuántas monedas hay en el aire.
function miraArco() {
  const s = document.querySelector('.cel-screen')
  const h1 = document.querySelector('h1.cel-ajilei')
  const fr = document.querySelector('.cel-frase')
  const dd = (rotulo) => {
    for (const d of document.querySelectorAll('.cel-detalle > div')) {
      const t = d.querySelector('dt')
      if (t && t.textContent.trim() === rotulo) return d.querySelector('dd')?.textContent?.trim() ?? null
    }
    return null
  }
  const cs = h1 ? getComputedStyle(h1) : null
  const capa = document.querySelector('.cel-lluvia')
  const tarjeta = document.querySelector('.cel-tarjeta')
  return {
    fase: s?.dataset.fase ?? null,
    melodia: s?.dataset.melodia ?? null,
    // El resplandor de EMB-1 se apaga con estos dos mandos y con ningún otro.
    bandaFrac: cs ? cs.getPropertyValue('--brillo-banda-frac').trim() : null,
    animacion: cs ? cs.animationPlayState : null,
    fraseOpacidad: fr ? getComputedStyle(fr).opacity : null,
    saldo: dd('Saldo actual'),
    netas: document.querySelector('.cel-netas-num')?.textContent?.trim() ?? null,
    gotas: document.querySelectorAll('.cel-gota').length,
    // El orden de pintado de la lluvia, medido por el MECANISMO que lo decide:
    // dos hermanos posicionados en el mismo contexto de apilamiento se pintan
    // por `z-index`. `elementFromPoint` no sirve aquí — la capa lleva
    // `pointer-events: none` y el navegador la salta, así que devolvería la
    // tarjeta aunque la lluvia estuviera delante.
    z: capa && tarjeta ? {
      capaPos: getComputedStyle(capa).position,
      capaZ: getComputedStyle(capa).zIndex,
      capaEventos: getComputedStyle(capa).pointerEvents,
      tarjetaPos: getComputedStyle(tarjeta).position,
      tarjetaZ: getComputedStyle(tarjeta).zIndex,
    } : null,
  }
}

function cosechaArco() {
  const r = window.__CEL2 || {}
  const c = (r.cuadros || []).slice().sort((a, b) => a - b)
  const pct = (p) => (c.length ? c[Math.min(c.length - 1, Math.floor(c.length * p))] : null)
  return {
    fases: r.fases || [],
    nacidas: r.nacidas || [],
    vivasMax: r.vivasMax || 0,
    cuadros: { n: c.length, p50: pct(0.5), p95: pct(0.95), peor: c.length ? c[c.length - 1] : null },
    marcas: (window.__AJILEI_ARCO || []).slice(),
  }
}

// Devuelve el instante de una marca del arco (la primera con ese nombre).
const marcaDe = (marcas, nombre) => marcas.find(m => m.marca === nombre) ?? null

async function arcoDeUnaCelda(browser, celda, fallos, opciones = {}) {
  const { id, w, h, mesa = 5, capturas = false } = celda
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    ...(opciones.reducido ? { reducedMotion: 'reduce' } : {}),
  })
  if (opciones.mudo) {
    await ctx.addInitScript(() => { try { window.localStorage.setItem('ajilei.sound', 'off') } catch { /* sin storage */ } })
  }
  const page = await ctx.newPage()
  page.on('pageerror', e => fallos.push(`${id}: ${e}`))
  // Las peticiones de melodía, que son la prueba INDEPENDIENTE del audio: las
  // marcas del arco dicen "la mandé sonar", y esto dice si el archivo llegó de
  // verdad. Un nombre mal escrito da 404 aquí y una victoria muda allí, sin un
  // solo error en pantalla.
  const pedidos = []
  page.on('response', r => {
    const u = r.url()
    if (u.includes('/sounds/celebracion-')) pedidos.push({ archivo: u.split('/').pop(), http: r.status() })
  })
  const salida = { id, w, h, fotos: {}, pedidos }
  try {
    // SIN esperar al reposo: aquí se viene a ver el arco correr.
    await alaVictoria(page, mesa, '', { reposo: false })
    await page.evaluate(instalaSondaArco)
    salida.fotos.sobria = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/arco-1sobria-${id}.png` })

    if (opciones.rapido) {
      // Con movimiento reducido la fiesta y la calma duran un cuadro cada una:
      // esperarlas con `waitForSelector` sería pedirle al arnés que fotografíe
      // un parpadeo. El ORDEN de los cuatro tiempos lo cuenta igual el
      // observador de mutaciones, que no se pierde ninguna.
      await page.waitForSelector('.cel-screen[data-fase="reposo"]', { timeout: 15000 })
      await page.waitForTimeout(150)
      salida.fotos.reposo = await page.evaluate(miraArco)
      Object.assign(salida, await page.evaluate(cosechaArco))
      await ctx.close()
      return salida
    }
    await page.waitForSelector('.cel-screen[data-fase="fiesta"]', { timeout: 10000 })
    await page.waitForTimeout(350)
    salida.fotos.fiesta = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/arco-2revienta-${id}.png` })

    // Y otra a mitad de fiesta: la de arriba es el ESTALLIDO —tres o cuatro
    // monedas recién nacidas— y la densidad de la lluvia sólo se juzga en
    // régimen, con las catorce o quince en el aire.
    if (capturas) {
      await page.waitForTimeout(750)
      salida.fotos.plena = await page.evaluate(miraArco)
      await page.screenshot({ path: `${OUT}/arco-2b-fiesta-plena-${id}.png` })
    }

    await page.waitForSelector('.cel-screen[data-fase="calma"]', { timeout: 10000 })
    salida.fotos.calma = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/arco-3calma-${id}.png` })

    await page.waitForSelector('.cel-screen[data-fase="reposo"]', { timeout: 10000 })
    await page.waitForTimeout(150)
    salida.fotos.reposo = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/arco-4reposo-${id}.png` })

    Object.assign(salida, await page.evaluate(cosechaArco))
  } catch (e) { fallos.push(`${id}: ${e.message}`) }
  await ctx.close()
  return salida
}

// Las puertas sobre una celda ya corrida. Se separan de la corrida para poder
// aplicarles matices por modo (mudo, movimiento reducido) sin duplicar nada.
function juzgaArco(a, fallos, opciones = {}) {
  const { id, fotos = {}, fases = [], marcas = [] } = a
  const orden = fases.map(f => f.fase)

  // 1 · EL ORDEN. Los cuatro tiempos, en su sitio y sin saltarse ninguno.
  if (orden.join('>') !== 'sobria>fiesta>calma>reposo') {
    fallos.push(`${id}: el arco fue ${orden.join(' > ')} y debe ser sobria > fiesta > calma > reposo`)
  }

  // 2 · EL ENCADENADO. Que la fiesta empiece cuando el toc-toc TERMINA, y que
  // lo haya hecho por el evento `end` y no por el temporizador-red: si mandara
  // la red, el retraso sería el de la espera declarada (duración + margen), y
  // aquí se exige que llegue ANTES de ese margen.
  const ancla = marcaDe(marcas, 'ancla')
  const revienta = marcaDe(marcas, 'revienta')
  const suena = marcaDe(marcas, 'melodia-suena')
  if (!ancla || !revienta) {
    fallos.push(`${id}: faltan marcas del arco (ancla=${!!ancla}, revienta=${!!revienta})`)
  } else {
    const espera = revienta.t - ancla.t
    a.esperaMedida = espera
    if (opciones.mudo) {
      if (ancla.encadenado !== false) fallos.push(`${id}: con el sonido apagado no debe haber encadenado`)
      if (Math.abs(espera - TOC_MS) > 250) fallos.push(`${id}: sin sonido el arco esperó ${espera} ms y el reloj nominal es ${TOC_MS}`)
    } else {
      if (ancla.encadenado !== true) fallos.push(`${id}: la fiesta NO se encadenó al toc-toc (encadenado=${ancla.encadenado})`)
      if (espera < TOC_MS - 250) fallos.push(`${id}: la fiesta reventó a los ${espera} ms, ANTES de que acabara el toc-toc (${TOC_MS} ms)`)
      if (espera >= ancla.espera - 60) fallos.push(`${id}: mandó el temporizador-red (${espera} ms de ${ancla.espera}), no el 'end' de Howler`)
      // 3 · Y la melodía, después. Jamás encima del toc-toc.
      if (!suena) fallos.push(`${id}: la melodía no llegó a sonar`)
      else if (suena.t < revienta.t) fallos.push(`${id}: la melodía sonó ${revienta.t - suena.t} ms ANTES del estallido`)
    }
  }

  // 4 · LA MELODÍA es una de las siete (o ninguna, con el sonido apagado), y el
  // archivo LLEGÓ. Lo segundo no se deduce de lo primero: el nombre puede estar
  // en la bolsa y el asset no estar en disco, y eso en pantalla es silencio.
  const mel = fotos.reposo?.melodia ?? ''
  const pedidos = a.pedidos || []
  if (opciones.mudo) {
    if (mel !== '') fallos.push(`${id}: con el sonido apagado no debe cargarse melodía y hay "${mel}"`)
    // Y no se descarga NADA: la carga perezosa tiene que ahorrarse los ~380 KB
    // enteros cuando no hay nada que oír.
    if (pedidos.length) fallos.push(`${id}: con el sonido apagado se pidieron ${pedidos.length} melodías (${pedidos.map(x => x.archivo).join(', ')})`)
  } else {
    if (!MELODIAS_CEL.includes(mel)) fallos.push(`${id}: la melodía "${mel}" no es una de las siete de CEL-A`)
    const suya = pedidos.filter(x => x.archivo.startsWith(`${mel}.`))
    if (!suya.length) fallos.push(`${id}: la melodía "${mel}" no se llegó a pedir`)
    else if (!suya.some(x => x.http === 200 || x.http === 206)) {
      fallos.push(`${id}: la melodía "${mel}" respondió ${suya.map(x => x.http).join('/')}`)
    }
    // Y sólo la suya: pedir las siete sería tirar 2,6 MB por una que suena.
    const ajenas = pedidos.filter(x => !x.archivo.startsWith(`${mel}.`))
    if (ajenas.length) fallos.push(`${id}: se pidieron melodías que no tocaban (${ajenas.map(x => x.archivo).join(', ')})`)
  }

  // 5 · EL RESPLANDOR. Apagado y PARADO en la entrada; encendido y corriendo en
  // la fiesta. Con movimiento reducido, EMB-1 lo apaga por su cuenta y esta
  // puerta no aplica (la banda vale 0 siempre, que es lo correcto).
  if (!opciones.reducido) {
    if (fotos.sobria?.bandaFrac !== '0') fallos.push(`${id}: AJILEI entra con resplandor (banda ${fotos.sobria?.bandaFrac})`)
    if (fotos.sobria?.animacion !== 'paused') fallos.push(`${id}: el barrido del rótulo corre en la entrada sobria (${fotos.sobria?.animacion})`)
    if (fotos.fiesta?.bandaFrac === '0') fallos.push(`${id}: el resplandor no se encendió en la fiesta`)
    if (fotos.fiesta?.animacion !== 'running') fallos.push(`${id}: el barrido no arrancó en la fiesta (${fotos.fiesta?.animacion})`)
  }

  // 6 · LA FRASE aparece con el estallido y no antes.
  if (Number(fotos.sobria?.fraseOpacidad) !== 0) fallos.push(`${id}: la frase se ve en la entrada sobria (opacidad ${fotos.sobria?.fraseOpacidad})`)
  if (Number(fotos.reposo?.fraseOpacidad) !== 1) fallos.push(`${id}: la frase no acabó visible (opacidad ${fotos.reposo?.fraseOpacidad})`)

  // 7 · LOS CONTADORES. Empiezan en 0 y aterrizan en los valores VERDADEROS.
  // Con movimiento reducido no cuentan: llegan puestos, que es lo pedido.
  if (opciones.reducido) {
    if (fotos.sobria?.saldo !== String(SALDO_INICIAL)) fallos.push(`${id}: con movimiento reducido el saldo debe estar puesto desde el principio, y vale ${fotos.sobria?.saldo}`)
  } else if (fotos.sobria?.saldo !== '0') {
    fallos.push(`${id}: el saldo no arranca en 0 (${fotos.sobria?.saldo})`)
  }
  if (fotos.reposo?.saldo !== String(SALDO_INICIAL)) fallos.push(`${id}: el saldo no aterrizó en ${SALDO_INICIAL} (${fotos.reposo?.saldo})`)
  const netasFin = Number.parseInt(String(fotos.reposo?.netas).replace('+', ''), 10)
  if (String(fotos.reposo?.saldo) !== String(SALDO_INICIAL + netasFin)) {
    fallos.push(`${id}: al terminar, saldo ${fotos.reposo?.saldo} no cuadra con netas ${fotos.reposo?.netas}`)
  }

  // 8 · LA LLUVIA.
  const calma = fases.find(f => f.fase === 'calma')
  const trasCalma = calma ? a.nacidas.filter(t => t > calma.t + 40).length : 0
  a.nacidasTrasCalma = trasCalma
  if (opciones.reducido) {
    if (a.vivasMax !== 0 || a.nacidas.length !== 0) fallos.push(`${id}: con movimiento reducido NO debe llover, y nacieron ${a.nacidas.length}`)
  } else {
    if (!a.nacidas.length) fallos.push(`${id}: no llovió ni una moneda`)
    if (a.vivasMax > GOTAS_TECHO) fallos.push(`${id}: hubo ${a.vivasMax} monedas vivas y el techo es ${GOTAS_TECHO}`)
    if (trasCalma > 0) fallos.push(`${id}: nacieron ${trasCalma} monedas DESPUÉS de la calma`)
    if (fotos.reposo?.gotas !== 0) fallos.push(`${id}: quedan ${fotos.reposo?.gotas} monedas en el reposo`)
    const z = fotos.fiesta?.z
    if (!z) fallos.push(`${id}: no se pudo medir el orden de pintado de la lluvia`)
    else if (!(z.capaZ === '0' && z.tarjetaZ === '1' && z.capaPos === 'absolute' && z.tarjetaPos !== 'static')) {
      fallos.push(`${id}: la lluvia no está detrás de la tarjeta (${JSON.stringify(z)})`)
    } else if (z.capaEventos !== 'none') {
      fallos.push(`${id}: la capa de lluvia recoge eventos y taparía el botón de salir`)
    }
  }
}

// ── La puerta del sorteo de melodías ────────────────────────────────────────
// Cinco victorias seguidas EN LA MISMA pestaña: la memoria vive en
// localStorage, así que sólo encadenando corridas se prueba que no repite.
async function puertaMelodias(browser, fallos) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const vistas = []
  try {
    for (let k = 0; k < 5; k++) {
      // Basta con que la pantalla monte: la pieza se sortea al montar y viaja en
      // el atributo. No hace falta esperar a que suene para saber cuál es.
      await alaVictoria(page, 5, '', { reposo: false })
      vistas.push(await page.getAttribute('.cel-screen', 'data-melodia'))
    }
  } catch (e) { fallos.push(`melodias: ${e.message}`) }
  await ctx.close()
  vistas.forEach((m, i) => {
    if (!MELODIAS_CEL.includes(m)) fallos.push(`melodias: la corrida ${i + 1} sonó "${m}", que no es de la bolsa`)
    if (i > 0 && m === vistas[i - 1]) fallos.push(`melodias: la corrida ${i + 1} REPITIÓ "${m}"`)
  })
  return vistas
}

// ── La puerta del salto por toque ───────────────────────────────────────────
async function puertaSalto(browser, fallos) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const r = { medio: null, tras: null, salida: null }
  try {
    await alaVictoria(page, 5, '', { reposo: false })
    await page.evaluate(instalaSondaArco)
    await page.waitForSelector('.cel-screen[data-fase="fiesta"]', { timeout: 10000 })
    // A MITAD del conteo: ni recién empezado ni ya aterrizado.
    await page.waitForTimeout(400)
    r.medio = await page.evaluate(miraArco)
    // El toque, lejos de cualquier control: lo que corta es el `pointerdown` en
    // captura sobre el documento, no un clic sobre un botón.
    await page.mouse.click(8, 400)
    await page.waitForTimeout(150)
    r.tras = await page.evaluate(miraArco)
    r.cosecha = await page.evaluate(cosechaArco)
    // Y el botón de salir responde, que es la promesa que acompaña al salto.
    await page.click('.cel-screen .btn-primary')
    await page.waitForSelector('.mode-select-card', { timeout: 5000 })
    r.salida = true
  } catch (e) { fallos.push(`salto: ${e.message}`); r.salida = false }
  await ctx.close()

  if (r.medio && Number(r.medio.saldo) >= SALDO_INICIAL) {
    fallos.push(`salto: el conteo ya había terminado al tocar (saldo ${r.medio.saldo}); la puerta no probó nada`)
  }
  if (r.tras) {
    if (r.tras.saldo !== String(SALDO_INICIAL)) fallos.push(`salto: el saldo no saltó a ${SALDO_INICIAL} (${r.tras.saldo})`)
    if (!['calma', 'reposo'].includes(r.tras.fase)) fallos.push(`salto: tras el toque la fase es ${r.tras.fase}`)
  }
  if (r.cosecha) {
    const salto = marcaDe(r.cosecha.marcas, 'salto')
    const calma = r.cosecha.fases.find(f => f.fase === 'calma')
    if (!salto) fallos.push('salto: el arco no registró el toque')
    if (calma) {
      const nuevas = r.cosecha.nacidas.filter(t => t > calma.t + 40).length
      if (nuevas > 0) fallos.push(`salto: siguieron naciendo ${nuevas} monedas tras el toque`)
    }
  }
  if (r.salida !== true) fallos.push('salto: el botón de salir NO respondió tras el toque')
  return r
}

async function modoCelebracion(browser) {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
  const CELDAS_CEL = [
    { id: '1920x1080', w: 1920, h: 1080 },
    { id: '375x812',   w: 375,  h: 812  },
    { id: '360x640',   w: 360,  h: 640  },
    { id: '640x360',   w: 640,  h: 360  },
  ]
  const inf = { tanda: 'CEL-1', chromium: browser.version(), celdas: {}, frases: {}, reacciones: {} }
  const fallos = []

  for (const mesa of [5, 2]) {
    for (const c of CELDAS_CEL) {
      const id = `mesa${mesa}-${c.id}`
      const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      page.on('pageerror', e => fallos.push(`${id}: ${e}`))
      try {
        await alaVictoria(page, mesa)
        await page.waitForSelector('.cel-screen', { timeout: 10000 })
        // CEL-2 · la espera fija de 1,7 s que había aquí desapareció: ahora es
        // `alaVictoria` quien deja la pantalla EN REPOSO antes de devolver, y
        // esperar a un estado declarado siempre le gana a esperar un rato.
        const d = await page.evaluate(sondaPantalla)
        const piel = pielDe(c.w, c.h)
        d.piel = piel
        inf.celdas[id] = d

        const esperado = LAMINA[piel]
        const cerca = (v, e) => v != null && Math.abs(v - e) <= TOL
        if (!cerca(d.ajilei?.fontSize, esperado.ajilei)) fallos.push(`${id}: AJILEI ${d.ajilei?.fontSize} != ${esperado.ajilei}`)
        if (!cerca(d.cifra?.fontSize, esperado.cifra))   fallos.push(`${id}: cifra ${d.cifra?.fontSize} != ${esperado.cifra}`)
        if (!cerca(d.moneda?.w, esperado.moneda))        fallos.push(`${id}: moneda ${d.moneda?.w} != ${esperado.moneda}`)
        if (!cerca(d.frase?.fontSize, esperado.frase))   fallos.push(`${id}: frase ${d.frase?.fontSize} != ${esperado.frase}`)
        // `min(420px, 100%)` contra el ancho de CONTENIDO de la columna, medido
        // en la página. Lo que se comprueba es la regla, no una reconstrucción
        // del layout entero desde el viewport.
        const anchoTarjeta = Math.min(420, d.anchoColumna ?? 0)
        if (!cerca(d.tarjeta?.w, anchoTarjeta))          fallos.push(`${id}: tarjeta ${d.tarjeta?.w} != ${anchoTarjeta} (columna ${d.anchoColumna})`)

        // "Saldo actual" pinta `human.chips`, el dato VERDADERO — y esta celda
        // es justo la prueba de por qué la lámina prohíbe pintar la fórmula.
        // Con `?cel` los rivales nacen SIN fichas: el humano gana la mesa sin
        // ganarle un céntimo a nadie, así que su saldo sigue siendo 5000 y la
        // fórmula "5000 + 5000×rivales" diría 25000. La primera corrida exigió
        // los 25000 y el rojo era del arnés, no de la pantalla.
        //
        // Lo que sí se puede exigir es la COHERENCIA entre las dos cifras que la
        // tarjeta pinta por caminos distintos: `fichasNetas` es `chips - 5000`,
        // luego saldo = 5000 + netas, siempre y en cualquier partida.
        const netas = Number.parseInt(String(d.netas).replace('+', ''), 10)
        if (String(d.saldo) !== String(SALDO_INICIAL + netas)) {
          fallos.push(`${id}: "Saldo actual" ${d.saldo} no cuadra con netas ${d.netas} (esperado ${SALDO_INICIAL + netas})`)
        }
        // Y con el molde determinista, el saldo es exactamente el inicial.
        if (d.saldo !== String(SALDO_INICIAL)) fallos.push(`${id}: con ?cel el saldo debe ser ${SALDO_INICIAL}, no ${d.saldo}`)
        // Con `?cel` no se juega ninguna mano: 0 ganadas -> 0 puntos, gane el
        // nivel que gane. La multiplicación la sellan las aserciones de unidad.
        if (d.manosGanadas !== '0') fallos.push(`${id}: manos ganadas ${d.manosGanadas} != 0`)
        if (d.puntos !== '0')       fallos.push(`${id}: "Puntos obtenidos" ${d.puntos} != 0`)

        if (d.primarios !== 1)                  fallos.push(`${id}: ${d.primarios} botones primarios, debe haber 1`)
        if (!d.ranking?.disabled)               fallos.push(`${id}: ranking sin disabled real`)
        if (d.ranking?.ariaDisabled !== 'true') fallos.push(`${id}: ranking sin aria-disabled`)
        if (!d.ranking?.pastilla)               fallos.push(`${id}: ranking sin pastilla Proximamente`)
        if (d.ranking?.href != null)            fallos.push(`${id}: el ranking navega a ${d.ranking.href}`)
        if (d.pielVieja !== 0)                  fallos.push(`${id}: .game-over-screen sigue montada en victoria`)
        // Encaje: la última pieza de la columna tiene que verse. Si no se ve,
        // da igual que todas las cajas midan lo sellado.
        if (d.encaje?.ultimaPiezaDentro === false) {
          fallos.push(`${id}: la columna NO cabe — el enlace de ranking acaba en ${d.encaje.ultimaPiezaAbajo} y el viewport mide ${c.h} (columna ${d.encaje.altoColumna} en un hueco de ${d.encaje.huecoDisponible})`)
        }

        await page.screenshot({ path: `${OUT}/${id}.png` })

        // La puerta de reacciones se corre en las celdas de mesa 5: no depende
        // del tamaño de la mesa y repetirla ocho veces sólo alarga la corrida.
        if (mesa === 5) {
          const r = await puertaReacciones(page)
          inf.reacciones[id] = r
          if (!r.disabled)      fallos.push(`${id}: Reacciones NO esta disabled en GAME_OVER`)
          if (r.selector !== 0) fallos.push(`${id}: el selector de reacciones monto en GAME_OVER`)
          if (r.burbuja !== 0)  fallos.push(`${id}: se monto una burbuja en GAME_OVER`)
        }
      } catch (e) { fallos.push(`${id}: ${e.message}`) }
      await ctx.close()
    }
  }

  // ── Las ocho frases, una por una ──────────────────────────────────────────
  // La instrucción señala la 5 como la más larga. No se da por bueno: se miden
  // las ocho en una celda de cada piel y se reporta cuál es de verdad la más
  // ancha. Puerta: ninguna pasa de DOS renglones ni se recorta.
  const PIELES = [
    ['escritorio',      { width: 1920, height: 1080 }],
    ['movilVertical',   { width: 360,  height: 640  }],
    ['movilHorizontal', { width: 640,  height: 360  }],
  ]
  for (const [piel, celda] of PIELES) {
    const ctx = await browser.newContext({ viewport: celda, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    page.on('pageerror', e => fallos.push(`frases-${piel}: ${e}`))
    try {
      for (let n = 1; n <= 8; n++) {
        await alaVictoria(page, 5, `&frase=${n}`)
        await page.waitForSelector('.cel-screen', { timeout: 10000 })
        const d = await page.evaluate(sondaPantalla)
        inf.frases[`${piel}-${n}`] = {
          texto: d.frase?.texto, w: d.frase?.textoW, renglones: d.renglonesFrase,
          recortada: d.fraseRecortada, dentro: d.fraseDentro,
        }
        if (d.renglonesFrase > 2)    fallos.push(`frase ${n} en ${piel}: ${d.renglonesFrase} renglones`)
        // El encaje se comprueba TAMBIEN aqui: la altura de la columna depende
        // de cuantos renglones ocupe la frase, asi que una celda que cabe con la
        // frase corta puede no caber con la larga. Medir el encaje una sola vez,
        // con la frase que toco por sorteo, es medir media puerta.
        if (d.encaje?.ultimaPiezaDentro === false) {
          fallos.push(`frase ${n} en ${piel}: la columna NO cabe (ultima pieza en ${d.encaje.ultimaPiezaAbajo})`)
        }
        if (d.fraseRecortada)        fallos.push(`frase ${n} en ${piel}: RECORTADA por el clamp`)
        if (d.fraseDentro === false) fallos.push(`frase ${n} en ${piel}: se sale de su caja`)
        if (n === 5) await page.screenshot({ path: `${OUT}/frase5-${piel}.png` })
      }
    } catch (e) { fallos.push(`frases-${piel}: ${e.message}`) }
    await ctx.close()
  }

  // Control negativo: sin `?cel` la mesa no debe terminar sola.
  inf.control = await controlNegativo(browser)
  if (inf.control.termina !== false || inf.control.error) fallos.push(`control negativo ROJO: ${JSON.stringify(inf.control)}`)

  // ── CEL-2 · El arco, celda por celda ──────────────────────────────────────
  inf.arco = {}
  for (const c of [
    { id: 'escritorio-1920x1080', w: 1920, h: 1080, capturas: true },
    { id: 'movil-360x640',        w: 360,  h: 640,  capturas: true },
    { id: 'movil-640x360',        w: 640,  h: 360,  capturas: true },
    // La celda de CUADROS va sin capturas a propósito: `page.screenshot`
    // congela el hilo de render y en la primera corrida metió un cuadro de
    // 390 ms en la celda de 1920 — un pico del arnés, no de la lluvia. Ésta es
    // la medida limpia, y en el móvil de referencia, que es donde la decisión
    // nodos-contra-canvas se juega de verdad.
    { id: 'cuadros-360x640',      w: 360,  h: 640 },
  ]) {
    const a = await arcoDeUnaCelda(browser, c, fallos)
    juzgaArco(a, fallos)
    inf.arco[c.id] = a
  }
  // Con el sonido apagado: el arco visual completo, con los mismos tiempos.
  const mudo = await arcoDeUnaCelda(browser, { id: 'mudo-1280x800', w: 1280, h: 800 }, fallos, { mudo: true })
  juzgaArco(mudo, fallos, { mudo: true })
  inf.arco.mudo = mudo
  // Con movimiento reducido: sin lluvia y con las cifras puestas.
  const reducido = await arcoDeUnaCelda(browser, { id: 'reducido-1280x800', w: 1280, h: 800 }, fallos, { reducido: true, rapido: true })
  juzgaArco(reducido, fallos, { reducido: true })
  inf.arco.reducido = reducido
  // Y las dos puertas que necesitan su propia pestaña.
  inf.melodias = await puertaMelodias(browser, fallos)
  inf.salto = await puertaSalto(browser, fallos)

  writeFileSync(`${OUT}/cel1.json`, JSON.stringify(inf, null, 2))

  console.log('-- CEL-1 - cajas contra la lamina --')
  for (const [id, d] of Object.entries(inf.celdas)) {
    console.log(`  ${id.padEnd(18)} ${String(d.piel).padEnd(15)} AJILEI ${round(d.ajilei?.fontSize)} - cifra ${round(d.cifra?.fontSize)} - moneda ${round(d.moneda?.w)} - frase ${round(d.frase?.fontSize)} (${d.renglonesFrase} rgl) - tarjeta ${round(d.tarjeta?.w)} - saldo ${d.saldo} - puntos ${d.puntos} - encaje ${d.encaje?.altoColumna}/${d.encaje?.huecoDisponible} ${d.encaje?.ultimaPiezaDentro ? 'CABE' : 'NO CABE'}`)
  }
  console.log('\n-- las ocho frases --')
  for (const [piel] of PIELES) {
    const fs = Array.from({ length: 8 }, (_, i) => inf.frases[`${piel}-${i + 1}`]).filter(Boolean)
    if (!fs.length) continue
    const masAncha = fs.reduce((a, b) => (b.w > a.w ? b : a))
    console.log(`  ${piel.padEnd(16)} renglones ${fs.map(f => f.renglones).join(',')} - la mas ancha: "${masAncha.texto}" (${round(masAncha.w)}px)`)
  }
  console.log('\n-- puerta de reacciones en GAME_OVER --')
  for (const [id, r] of Object.entries(inf.reacciones)) {
    console.log(`  ${id.padEnd(18)} disabled ${r.disabled} - selector ${r.selector} - burbuja ${r.burbuja}`)
  }
  console.log('\n-- CEL-2 - el arco, tiempos MEDIDOS (ms desde que monta la pantalla) --')
  for (const [id, a] of Object.entries(inf.arco)) {
    const t = Object.fromEntries((a.fases || []).map(f => [f.fase, f.t]))
    console.log(`  ${id.padEnd(22)} sobria 0 -> fiesta ${t.fiesta ?? '?'} -> calma ${t.calma ?? '?'} -> reposo ${t.reposo ?? '?'}`
      + ` | espera al toc ${a.esperaMedida ?? '?'} | melodia ${a.fotos?.reposo?.melodia || '(ninguna)'}`)
    console.log(`  ${''.padEnd(22)} lluvia: ${a.nacidas?.length ?? 0} monedas, ${a.vivasMax ?? 0} vivas como mucho, ${a.nacidasTrasCalma ?? 0} tras la calma`
      + ` | cuadros p50 ${a.cuadros?.p50 ?? '?'} ms p95 ${a.cuadros?.p95 ?? '?'} ms peor ${a.cuadros?.peor ?? '?'} ms`)
  }
  console.log(`\n-- la bolsa de melodias, cinco victorias seguidas --\n  ${(inf.melodias || []).join('\n  ')}`)
  const sl = inf.salto || {}
  console.log(`\n-- el salto por toque --\n  saldo a mitad ${sl.medio?.saldo} -> tras el toque ${sl.tras?.saldo} (fase ${sl.tras?.fase}) - boton de salir ${sl.salida ? 'responde' : 'NO responde'}`)
  console.log(`\ncontrol negativo: ${inf.control.termina === false && !inf.control.error ? 'verde' : 'ROJO'}`)
  console.log(`\nFALLOS: ${fallos.length ? '\n  - ' + fallos.join('\n  - ') : 'ninguno'}`)
  console.log(`capturas y cifras en ${OUT}/`)
}

// ── Corrida ─────────────────────────────────────────────────────────────────
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })

// El despacho de modo va AQUÍ, con `process.exit`, y no envolviendo el cuerpo
// de CEL-0 en un `if`: envolverlo obligaría a reindentar 150 líneas ya
// verificadas y el diff escondería cualquier cambio real dentro del ruido.
if (MODO === 'celebracion') {
  await modoCelebracion(browser)
  await browser.close()
  process.exit(0)
}

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
    // CEL-1: en victoria la frase del ganador sustituyó al título del motor y
    // la tarjeta cambió de clase. Se leen las DOS familias y gana la que monte,
    // para que este modo siga sirviendo antes y después de la tanda.
    const titulo = await page.evaluate(() =>
      document.querySelector('.cel-frase')?.textContent?.trim()
      ?? document.querySelector('.game-over-msg')?.textContent?.trim() ?? null)
    const tarjeta = await page.locator('.cel-tarjeta, .vc-tarjeta').count()
    const saldo = await page.evaluate(() =>
      document.querySelector('.cel-netas-num')?.textContent?.trim()
      ?? document.querySelector('.vc-netas-num')?.textContent?.trim() ?? null)
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
  // CEL-1: el título fijo dejó de existir en victoria — ahora la pantalla abre
  // con una frase SORTEADA del banco, así que exigir una cadena concreta sería
  // un rojo de cada ocho. Lo que el molde tiene que demostrar es que llegó a la
  // pantalla de victoria en un paso: tarjeta montada y una frase del banco.
  const ok = m.tarjeta === 1 && !!m.titulo
  if (ok) verdes++
  console.log(`${ok ? 'VERDE' : ' MAL '} ${m.celda.padEnd(18)} mesa ${m.mesa} · tarjeta ${m.tarjeta} · saldo ${m.saldo} · "${m.titulo}"`)
}
const ctrl = informe.control
const ctrlOk = ctrl.termina === false && !ctrl.error
console.log(`${ctrlOk ? 'VERDE' : ' MAL '} control-negativo   sin ?cel · ¿termina la mesa? ${ctrl.termina} · saldo rival ${JSON.stringify(ctrl.saldoRival)} · saldo humano ${JSON.stringify(ctrl.saldoHumano)}${ctrl.error ? ` · ${ctrl.error}` : ''}`)

console.log(`\ncomprobaciones verdes: ${verdes}/${informe.molde.length} · control negativo: ${ctrlOk ? 'verde' : 'ROJO'} · errores de página: ${errores.length ? errores.join(' | ') : 'ninguno'}`)
console.log(`capturas y cifras en ${OUT}/`)
