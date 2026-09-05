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
// CEL-2c · el modo `celebracion` escribe en `_cel2`. Cada tanda de la campaña
// deja su carpeta, fuera del repositorio: mezclarlas haría que una captura
// vieja pasara por evidencia nueva.
const OUT  = MODO === 'celebracion' ? '../_cel2' : '../_cel0'
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
  // LOB-1 · el CTA del lobby, por contrato de marcado y no por rótulo: el
  // texto sale ahora de un diccionario (IDI-0) y cambiará con el idioma.
  await page.waitForSelector('main.lobby [data-accion="jugar-ia"]')
  await page.click('[data-accion="jugar-ia"]')
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
    // CEL-2c · la fiesta pasó a durar los 12 s de la melodía, así que esperar al
    // reposo natural cuesta ~16 s POR CORRIDA, y aquí hay treinta y siete que no
    // vienen a medir el arco sino cajas quietas: diez minutos de espera que no
    // miden nada. Se asienta con el gesto que el propio arco ofrece —un toque,
    // que salta al reposo— y que tiene su puerta propia unas líneas más abajo.
    // El estado final es el mismo: cifras finales, sin lluvia, fase `reposo`.
    // Quien viene a ver el arco correr pasa `{ reposo: false }`.
    await page.mouse.click(1, 1)
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
  // CEL-2e · la moneda sube un 25 %: 56 -> 70 y 48 -> 60. Los demás tamaños
  // siguen sellados por la lámina de CEL-1 y no se han movido.
  escritorio:      { ajilei: 72, cifra: 40, moneda: 70, frase: 26 },
  movilVertical:   { ajilei: 40, cifra: 34, moneda: 60, frase: 18 },
  movilHorizontal: { ajilei: 32, cifra: 34, moneda: 60, frase: 18 },
}
const TOL = 0.6
const SALDO_INICIAL = 5000   // AJILEI_CONFIG.economy.saldoInicial
// CEL-1b · el hueco fijo entre la moneda de aterrizaje y la cifra del saldo.
// Constante LOCAL declarada en celebracion.css §CEL-1b: el Sistema de Diseno
// v1.2 no define escala de espaciado, asi que no hay token que citar. Vive aqui
// para que el arnes mida contra el numero de la instruccion y no contra el CSS
// —comprobar una hoja contra si misma no comprueba nada.
const HUECO_MONEDA = 8
const LADO_MONEDA = 16       // ChipToken `size="icon"`, el del cornerChip de mesa

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
    // CEL-1b · la moneda de aterrizaje, en las TRES pieles. Aqui la pantalla
    // esta quieta y ya en reposo, asi que lo que se mide es la composicion: que
    // la moneda exista, que su caja sea su tinta y que el hueco sea el fijo.
    // El movil horizontal es la celda que importa: ahi la tarjeta reparte sus
    // lineas en dos columnas y la fila del saldo vive en media tarjeta.
    monedaSaldo: (() => {
      const m = uno('.cel-saldo-moneda')
      const n = uno('.cel-saldo-num')
      if (!m || !n) return null
      const mb = m.getBoundingClientRect(), nb = n.getBoundingClientRect()
      const fila = m.closest('.cel-linea-alta')
      const fb = fila ? fila.getBoundingClientRect() : null
      const r2 = (v) => Math.round(v * 100) / 100
      return {
        w: r2(mb.width), h: r2(mb.height),
        hueco: r2(nb.left - mb.right),
        // El grupo alineado a la DERECHA de la fila: el borde derecho de la
        // cifra tiene que ser el de la fila. Si algun dia se alineara a la
        // izquierda, el hueco seguiria siendo 8 y esto seria lo unico que lo
        // delataria.
        margenDerecho: fb ? r2(fb.right - nb.right) : null,
        // Y la fila entera dentro de su columna: es la puerta del movil
        // horizontal, donde los 24 px que anade el grupo pueden desbordar.
        desborda: fila ? fila.scrollWidth > fila.clientWidth + 0.5 : null,
        // ── El comportamiento adaptativo, MEDIDO ─────────────────────────
        // La instruccion pide que con cifras de distinta longitud el hueco siga
        // fijo y el grupo crezca hacia la IZQUIERDA. Con el molde `?cel` el
        // saldo es siempre 5000, asi que medirlo sobre la pantalla tal cual no
        // comprobaria nada: seria un verde que no mide lo que declara.
        // Se hace por SONDA DE DOM y no sembrando estado: se escribe la cifra,
        // se fuerza el reflujo, se mide y se DEVUELVE el texto original en el
        // mismo tick. La pantalla esta en reposo, asi que no hay render de React
        // que atropelle la medida, y lo que se prueba es geometria de CSS —que
        // es exactamente de quien depende el hueco.
        longitudes: (() => {
          const antes = n.textContent
          const filas = ['999', '25000', '1250000'].map((t) => {
            n.textContent = t
            void document.body.offsetWidth
            const mb2 = m.getBoundingClientRect(), nb2 = n.getBoundingClientRect()
            const fb2 = fila ? fila.getBoundingClientRect() : null
            return {
              cifra: t,
              hueco: r2(nb2.left - mb2.right),
              monedaX: r2(mb2.left),
              margenDerecho: fb2 ? r2(fb2.right - nb2.right) : null,
              desborda: fila ? fila.scrollWidth > fila.clientWidth + 0.5 : null,
            }
          })
          n.textContent = antes
          void document.body.offsetWidth
          return filas
        })(),
      }
    })(),
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
    // ── CEL-2e · LA CABECERA ─────────────────────────────────────────────
    // Se cuenta lo que NO debe estar y lo que SÍ debe seguir. Y se mira que
    // los ausentes tampoco sean enfocables: ocultar con CSS dejaría el ⋮ en el
    // recorrido del tabulador, que es la trampa clásica.
    cabecera: {
      util: document.querySelectorAll('.utilities-trigger').length,
      wordmark: document.querySelectorAll('h1.table-title').length,
      panelUtil: document.querySelectorAll('.util-panel, .utilities-panel').length,
      salir: document.querySelectorAll('.btn-leave').length,
      mano: document.querySelectorAll('.hand-badge').length,
      enfocables: [...document.querySelectorAll('.table-header button, .table-header a, .table-header [tabindex]')]
        .map(e => e.className),
    },
    // ── CEL-2e · LOS DOS CONTROLES ───────────────────────────────────────
    acciones: (() => {
      const p = document.querySelector('.cel-acciones .btn-primary')
      const r = document.querySelector('.cel-acciones .cel-ranking')
      if (!p || !r) return null
      const a = p.getBoundingClientRect(), b = r.getBoundingClientRect()
      return {
        primario: { x: a.x, y: a.y, w: a.width, h: a.height },
        ranking: { x: b.x, y: b.y, w: b.width, h: b.height },
        // "En fila" no es una clase que consultar: es que compartan banda
        // vertical y no se solapen en horizontal.
        enFila: Math.abs(a.y - b.y) <= 4 && (b.x >= a.x + a.width - 1 || a.x >= b.x + b.width - 1),
        mismoAlto: Math.abs(a.height - b.height) <= 1,
        dentro: a.bottom <= window.innerHeight + 1 && b.bottom <= window.innerHeight + 1
          && a.left >= -1 && b.right <= window.innerWidth + 1,
        rankingDisabled: r.disabled === true,
        rankingHref: r.getAttribute('href'),
        pastilla: document.querySelectorAll('.cel-acciones .soon-tag').length,
      }
    })(),
    // La capa de luz tiene que cubrir la moneda, ni más ni menos: si el
    // envoltorio no midiera lo que la moneda, el brillo saldría descentrado.
    luz: (() => {
      const l = document.querySelector('.cel-moneda-luz')
      const m = document.querySelector('.cel-netas-ico .chip-token')
      if (!l || !m) return null
      const a = l.getBoundingClientRect(), b = m.getBoundingClientRect()
      return { dx: Math.abs(a.x - b.x), dy: Math.abs(a.y - b.y), dw: Math.abs(a.width - b.width), dh: Math.abs(a.height - b.height) }
    })(),
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

// La puerta 6, REESCRITA EN CEL-2e. Hasta aqui comprobaba que la entrada de
// Reacciones estuviera deshabilitada dentro del menu; ahora ese menu no existe
// en esta pantalla, asi que lo que hay que probar es que no hay por donde
// entrar —ni con el raton ni con el TABULADOR— y que aun asi no se monta
// ninguna burbuja: el veto de CEL-1 sigue vivo por debajo, y quitarlo porque
// "ya no hay boton" seria quitarle el suelo.
async function puertaSinMenu(page) {
  const antes = await page.evaluate(() => ({
    util: document.querySelectorAll('.utilities-trigger').length,
    panel: document.querySelectorAll('.util-panel, .utilities-panel').length,
  }))
  const focos = []
  for (let k = 0; k < 8; k++) {
    await page.keyboard.press('Tab')
    focos.push(await page.evaluate(() => document.activeElement?.className ?? ''))
  }
  const montado = await page.evaluate(() => ({
    selector: document.querySelectorAll('.u2-selector').length,
    burbuja: document.querySelectorAll('.u2-burbuja').length,
  }))
  return { ...antes, focos, ...montado }
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
// CEL-2c · las cifras que Victor selló en vivo. Van escritas aquí y no
// importadas del núcleo: si alguien recalibra el factor, el arnés tiene que
// DISCREPAR y decirlo, no seguirle.
const CAIDA_MIN_S = 1.54    // 1100 ms x 1,4
const CAIDA_MAX_S = 2.10    // 1500 ms x 1,4
const OPACIDAD_TECHO = 0.7
const MELODIA_S = 12        // duración sellada por CEL-A
// CEL-2g · el doble de lo que medían en CEL-2c, con la mesa del molde: el premio
// no mueve nada (netas 0 -> mínimo) y el saldo va de 5000 a 5000 (magnitud 5000).
const CONTEO_PREMIO_MS = 2800   // era 1400
const CONTEO_SALDO_MS = 2933    // era 1467
const CASCADA_ORDEN = ['Puntos obtenidos', 'Manos jugadas', 'Manos ganadas', 'Tu mejor mano']

// Observadores, instalados en cuanto la pantalla monta y antes de que reviente.
function instalaSondaArco() {
  const s = document.querySelector('.cel-screen')
  if (!s) return false
  const t0 = performance.now()
  const ahora = () => Math.round(performance.now() - t0)
  const reg = {
    t0, fases: [{ fase: s.dataset.fase, t: 0 }],
    nacidas: [], vivasMax: 0, cuadros: [], errores: [],
    // CEL-2g · el relato de los numeros
    animaciones: [], traspasos: 0, vuelo: [], anclas: null,
  }
  window.__CEL2 = reg

  // Las animaciones se anuncian solas. `animationstart` da el instante EXACTO en
  // que a cada rubro le toca entrar —con su retraso ya aplicado— y cuantas veces
  // se disparo el pulso del saldo, que tiene que ser una. Medir eso muestreando
  // opacidades daria la misma respuesta con menos precision y mas codigo.
  // CEL-1b · `cel-posada` entra en el mismo censo: el micro-pulso de la moneda
  // de aterrizaje tiene que dispararse UNA vez, igual que el de la cifra.
  const ANIMS = ['cel-asiento', 'cel-rubro-entra', 'cel-posada']
  document.addEventListener('animationstart', (e) => {
    if (!ANIMS.includes(e.animationName)) return
    const crudo = e.target && e.target.style ? e.target.style.getPropertyValue('--rubro-i') : ''
    reg.animaciones.push({
      nombre: e.animationName,
      i: crudo === '' ? null : Number(crudo),
      rotulo: e.target.querySelector ? (e.target.querySelector('dt')?.textContent?.trim() ?? null) : null,
      t: ahora(),
    })
  }, true)

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
        if (n.classList.contains('cel-traspaso')) { reg.traspasos++; continue }
        if (n.classList.contains('cel-gota')) { reg.nacidas.push(ahora()); continue }
        const dentro = n.querySelectorAll ? n.querySelectorAll('.cel-gota').length : 0
        for (let k = 0; k < dentro; k++) reg.nacidas.push(ahora())
      }
    }
  }).observe(s, { childList: true, subtree: true })

  // Vivas y cuadros, en el mismo rAF: el techo de 18 hay que cazarlo en vuelo, y
  // el ritmo de cuadros es la medida que decide nodos contra canvas.
  let ultimo = performance.now()
  const centro = (el) => {
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }
  }
  const ddDe = (rotulo) => {
    for (const d of document.querySelectorAll('.cel-detalle > div')) {
      const t = d.querySelector('dt')
      if (t && t.textContent.trim() === rotulo) return d.querySelector('dd')
    }
    return null
  }
  const tick = () => {
    const t = performance.now()
    // CEL-2g · la moneda del traspaso, fotograma a fotograma: de donde sale y a
    // donde llega se comprueba contra los DOS anclas reales, no contra numeros.
    const tr = document.querySelector('.cel-traspaso')
    if (tr) {
      if (!reg.anclas) {
        // CEL-1b · el ancla de llegada deja de ser la CAJA DE LA CIFRA y pasa a
        // ser la TINTA de la moneda de aterrizaje. `.cel-saldo-moneda` es un
        // contenedor flex con `line-height: 0`, asi que su caja es la de la
        // imagen —16x16— y su centro es el centro del dibujo.
        // Se deja tambien el centro del <dd> para poder REPORTAR a que distancia
        // quedo del punto viejo: es la medida del recableo.
        reg.anclas = {
          moneda: centro(document.querySelector('.cel-netas-ico')),
          saldo: centro(document.querySelector('.cel-saldo-moneda')),
          cifra: centro(ddDe('Saldo actual')),
        }
      }
      reg.vuelo.push({ t: ahora(), ...centro(tr) })
    }
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
    // ── CEL-2g · el relato ───────────────────────────────────────────────
    tramo: (() => {
      const l = document.querySelector('.cel-detalle')
      return l ? { cascada: l.dataset.cascada, pausa: l.dataset.pausa } : null
    })(),
    // La caja de la tarjeta, para probar que NO cambia en todo el arco: los
    // rubros entran con opacidad, no ocupando sitio nuevo.
    tarjetaCaja: (() => {
      const t = document.querySelector('.cel-tarjeta')
      if (!t) return null
      const b = t.getBoundingClientRect()
      return [Math.round(b.width * 100) / 100, Math.round(b.height * 100) / 100]
    })(),
    rubros: [...document.querySelectorAll('.cel-rubro')].map(e => {
      const cs = getComputedStyle(e)
      return {
        i: Number(e.style.getPropertyValue('--rubro-i')),
        rotulo: e.querySelector('dt')?.textContent?.trim() ?? null,
        opacidad: Math.round(Number(cs.opacity) * 100) / 100,
        // El escalonado RESUELTO. Es la medida exacta del paso de la cascada y
        // no la afecta que el arnés congele el render para capturar, que es lo
        // que sí le pasa a los tiempos de `animationstart`.
        retraso: cs.animationDelay,
        animacion: cs.animationName,
      }
    }),
    asiento: document.querySelector('.cel-detalle .cel-linea-alta dd')?.dataset?.asiento ?? null,
    // ── CEL-1b · la moneda de aterrizaje ─────────────────────────────────
    // Se fotografia en CADA tramo, y eso es lo que permite afirmar la doctrina
    // O1: la moneda no aparece al aterrizar, esta desde el primer fotograma.
    // El hueco se mide entre CAJAS —borde derecho de la moneda contra borde
    // izquierdo de la cifra— y no se lee del CSS: un `gap` declarado que la
    // rejilla de movil horizontal aplastara seguiria diciendo 8.
    monedaSaldo: (() => {
      const m = document.querySelector('.cel-saldo-moneda')
      const n = document.querySelector('.cel-saldo-num')
      if (!m || !n) return null
      const mb = m.getBoundingClientRect(), nb = n.getBoundingClientRect()
      const r2 = (v) => Math.round(v * 100) / 100
      return {
        w: r2(mb.width), h: r2(mb.height),
        hueco: r2(nb.left - mb.right),
        posada: m.dataset.posada ?? null,
        animacion: getComputedStyle(m).animationName,
      }
    })(),
    // CEL-2c · el detalle de cada moneda VIVA: su duración de caída (la primera
    // de las tres animaciones, que es `cel-caida`) y su opacidad. Lo primero es
    // la medida del +40 %; lo segundo, la del techo de 0,7.
    gotasDetalle: [...document.querySelectorAll('.cel-gota')].map(g => {
      const c = getComputedStyle(g)
      return {
        caida: parseFloat(String(c.animationDuration).split(',')[0]),
        crucero: parseFloat(c.getPropertyValue('--gota-opacidad')),
        opacidad: parseFloat(c.opacity),
      }
    }),
    // ── CEL-2e · EL BRILLO DE LA MONEDA, medido del CSSOM ────────────────
    // Lo que hay que probar no es "brilla": es que su periodo sea EL MISMO que
    // el del resplandor del nombre y que vaya medio ciclo por detras. Las dos
    // cifras se leen resueltas del navegador, que es donde se ve si el JS que
    // las ata funciono; si alguien las escribiera a mano en la hoja, esto
    // seguiria verde hasta que Victor recalibrase EMB-1, y entonces cantaria.
    brillo: (() => {
      const luz = document.querySelector('.cel-moneda-luz')
      const h1 = document.querySelector('h1.cel-ajilei')
      if (!luz || !h1) return null
      const emb = getComputedStyle(h1)
      const bar = getComputedStyle(luz, '::before')
      const des = getComputedStyle(luz, '::after')
      const uno = (cs) => ({
        nombre: cs.animationName,
        dur: cs.animationDuration,
        retraso: cs.animationDelay,
        estado: cs.animationPlayState,
      })
      return { emb: uno(emb), barrido: uno(bar), destello: uno(des) }
    })(),
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
    animaciones: r.animaciones || [],
    traspasos: r.traspasos || 0,
    vuelo: r.vuelo || [],
    anclas: r.anclas || null,
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
  const salida = { id, w, h, capturas, fotos: {}, pedidos }
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
      await page.waitForSelector('.cel-screen[data-fase="reposo"]', { timeout: 25000 })
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

    // ── CEL-2g · UNA FOTO POR TRAMO DEL RELATO ──────────────────────────
    // El premio contando, con el saldo quieto en su cifra de entrada.
    await page.waitForTimeout(700)
    salida.fotos.premio = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/relato-1premio-${id}.png` })

    // El saldo contando, con el premio ya asentado. Se espera a la MARCA y no a
    // un reloj: la duración del premio depende de la magnitud, así que un
    // `waitForTimeout` aquí mediría bien sólo en la mesa del molde.
    await page.waitForFunction(() => (window.__AJILEI_ARCO || []).some(m => m.marca === 'saldo-ini'), null, { timeout: 20000 })
    await page.waitForTimeout(700)
    salida.fotos.saldoContando = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/relato-2saldo-${id}.png` })

    // CEL-2c · LA FOTO DE LOS SEIS SEGUNDOS. Es la que prueba la decisión de
    // Victor: con la lluvia atada al contador, a esta altura no quedaría ni una
    // moneda —la puerta vieja habría dado cero— y ahora tiene que haber emisión
    // viva. También es donde se mide la caída y la opacidad, con la lluvia en
    // régimen y no con las cuatro monedas del estallido.
    // Los seis segundos se cuentan desde el ESTALLIDO, no desde aquí: entre
    // medias hay dos esperas que dependen de las cifras de la partida.
    await page.waitForFunction(() => {
      const r = (window.__AJILEI_ARCO || []).find(m => m.marca === 'revienta')
      return r && performance.now() - r.t >= 6000
    }, null, { timeout: 25000 })
    salida.fotos.plena = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/arco-2b-fiesta-6s-${id}.png` })

    // La cascada a mitad: dos rubros dentro y dos fuera. A los 400 ms del
    // arranque han entrado el 0 (sin retraso) y el 1 (a 250); el 2 entra a 500.
    await page.waitForFunction(() => (window.__AJILEI_ARCO || []).some(m => m.marca === 'cascada-ini'), null, { timeout: 25000 })
    await page.waitForTimeout(400)
    salida.fotos.cascada = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/relato-3cascada-${id}.png` })

    // La fiesta dura ahora los 12 s de la melodía: las esperas se alargan.
    await page.waitForSelector('.cel-screen[data-fase="calma"]', { timeout: 20000 })
    salida.fotos.calma = await page.evaluate(miraArco)
    if (capturas) await page.screenshot({ path: `${OUT}/arco-3calma-${id}.png` })

    await page.waitForSelector('.cel-screen[data-fase="reposo"]', { timeout: 20000 })
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

  // 5b · CEL-2e · EL BRILLO DE LA MONEDA, en armonia con el del nombre.
  const seg = (v) => {
    const n = parseFloat(String(v))
    return Number.isFinite(n) ? n : null
  }
  for (const [cuando, foto] of [['fiesta', fotos.fiesta], ['reposo', fotos.reposo]]) {
    const br = foto?.brillo
    if (!br) { if (foto) fallos.push(`${id}: sin medida de brillo en ${cuando}`); continue }
    if (opciones.reducido) {
      // Movimiento reducido: la capa entera apagada, ni brillo atenuado ni
      // banda aparcada encendida.
      if (br.barrido.nombre !== 'none' || br.destello.nombre !== 'none') {
        fallos.push(`${id}: con movimiento reducido la moneda sigue animada (${br.barrido.nombre}/${br.destello.nombre})`)
      }
      continue
    }
    if (br.barrido.estado !== 'running' || br.destello.estado !== 'running') {
      fallos.push(`${id}: el brillo de la moneda no corre en ${cuando} (${br.barrido.estado}/${br.destello.estado})`)
    }
    const ciclo = seg(br.emb.dur)
    const bar = seg(br.barrido.dur)
    const des = seg(br.destello.dur)
    const ret = seg(br.barrido.retraso)
    a.brillo = { ciclo, periodo: bar, desfase: ret }
    if (!ciclo) fallos.push(`${id}: no se pudo leer el ciclo de EMB-1`)
    else {
      if (Math.abs(bar - ciclo) > 0.01 || Math.abs(des - ciclo) > 0.01) {
        fallos.push(`${id}: el periodo de la moneda (${bar}/${des}) no es el de EMB-1 (${ciclo}) en ${cuando}`)
      }
      if (Math.abs(ret - ciclo / 2) > 0.01) {
        fallos.push(`${id}: el desfase es ${ret} y medio ciclo son ${ciclo / 2} en ${cuando}`)
      }
      if (Math.abs(seg(br.destello.retraso) - ret) > 0.01) {
        fallos.push(`${id}: el destello y el barrido no van juntos (${br.destello.retraso} vs ${br.barrido.retraso})`)
      }
    }
  }
  // Y en la entrada sobria, parado: la moneda no brilla antes de la fiesta.
  if (!opciones.reducido && fotos.sobria?.brillo) {
    const b0 = fotos.sobria.brillo
    if (b0.barrido.estado !== 'paused' || b0.destello.estado !== 'paused') {
      fallos.push(`${id}: la moneda ya brilla en la entrada sobria (${b0.barrido.estado}/${b0.destello.estado})`)
    }
  }

  // 6 · LA FRASE aparece con el estallido y no antes.
  if (Number(fotos.sobria?.fraseOpacidad) !== 0) fallos.push(`${id}: la frase se ve en la entrada sobria (opacidad ${fotos.sobria?.fraseOpacidad})`)
  if (Number(fotos.reposo?.fraseOpacidad) !== 1) fallos.push(`${id}: la frase no acabó visible (opacidad ${fotos.reposo?.fraseOpacidad})`)

  // 7 · LOS CONTADORES. Empiezan en 0 y aterrizan en los valores VERDADEROS.
  // Con movimiento reducido no cuentan: llegan puestos, que es lo pedido.
  // CEL-2g DEROGA la puerta de CEL-2c que exigía ver el saldo arrancar en 0: la
  // decisión de Victor es justamente la contraria —"Saldo actual" está quieto en
  // su cifra de entrada desde el primer fotograma y sólo se mueve cuando le toca
  // su turno—. La comprobación no desaparece, se INVIERTE, y vive en el bloque
  // del relato unas líneas más abajo.
  if (fotos.reposo?.saldo !== String(SALDO_INICIAL)) fallos.push(`${id}: el saldo no aterrizó en ${SALDO_INICIAL} (${fotos.reposo?.saldo})`)
  const netasFin = Number.parseInt(String(fotos.reposo?.netas).replace('+', ''), 10)
  if (String(fotos.reposo?.saldo) !== String(SALDO_INICIAL + netasFin)) {
    fallos.push(`${id}: al terminar, saldo ${fotos.reposo?.saldo} no cuadra con netas ${fotos.reposo?.netas}`)
  }

  // ── CEL-2g · EL RELATO DE LOS NÚMEROS ───────────────────────────────────
  const mk = (n) => marcaDe(marcas, n)
  const rubrosDe = (foto) => (foto?.rubros || []).filter(r => r.opacidad > 0.5).length

  if (opciones.reducido) {
    // Todo puesto desde el primer fotograma: ni cuenta, ni vuelo, ni cascada.
    if (mk('premio-ini')) fallos.push(`${id}: con movimiento reducido no debe contarse el premio`)
    if (a.traspasos) fallos.push(`${id}: con movimiento reducido voló una moneda de traspaso`)
    const r0 = fotos.sobria?.rubros || []
    if (r0.length !== 4) fallos.push(`${id}: no hay cuatro rubros (${r0.length})`)
    if (r0.some(r => r.opacidad < 1)) fallos.push(`${id}: con movimiento reducido los rubros deben estar puestos desde el primer fotograma`)
    if (fotos.sobria?.saldo !== String(SALDO_INICIAL)) fallos.push(`${id}: el saldo no está puesto en la entrada (${fotos.sobria?.saldo})`)
  } else {
    const pIni = mk('premio-ini'), pFin = mk('premio-fin')
    const tIni = mk('traspaso-ini'), tFin = mk('traspaso-fin')
    const sIni = mk('saldo-ini'), sFin = mk('saldo-fin')
    const cIni = mk('cascada-ini'), rFin = mk('relato-fin')
    const faltan = [['premio-ini', pIni], ['premio-fin', pFin], ['traspaso-ini', tIni], ['traspaso-fin', tFin],
      ['saldo-ini', sIni], ['saldo-fin', sFin], ['cascada-ini', cIni], ['relato-fin', rFin]]
      .filter(([, v]) => !v).map(([n]) => n)
    if (faltan.length) fallos.push(`${id}: faltan marcas del relato: ${faltan.join(', ')}`)
    else {
      a.relato = {
        premio: { dur: pIni.dur, medido: pFin.t - pIni.t },
        traspaso: tFin.t - tIni.t,
        saldo: { dur: sIni.dur, medido: sFin.t - sIni.t },
        cascada: rFin.t - cIni.t,
        total: rFin.t - pIni.t,
      }
      // EL ORDEN ESTRICTO, que es la decisión de Victor hecha puerta.
      if (sIni.t < pFin.t) fallos.push(`${id}: el saldo arrancó ANTES de que el premio asentara (${sIni.t} < ${pFin.t})`)
      if (sIni.t < tFin.t) fallos.push(`${id}: el saldo arrancó ANTES de que aterrizara la moneda (${sIni.t} < ${tFin.t})`)
      if (cIni.t < sFin.t) fallos.push(`${id}: la cascada arrancó ANTES de que el saldo asentara`)
      // Y las duraciones al doble. La tolerancia es mayor en las celdas que
      // capturan: `page.screenshot` congela el render y el acotado del delta
      // —que es lo que pausa con la pestaña oculta— se niega, con razón, a
      // contar el tiempo que no se pintó.
      const tol = a.capturas ? 1200 : 400
      if (pIni.dur !== CONTEO_PREMIO_MS) fallos.push(`${id}: el premio pide ${pIni.dur} ms y el doble de CEL-2c son ${CONTEO_PREMIO_MS}`)
      if (sIni.dur !== CONTEO_SALDO_MS) fallos.push(`${id}: el saldo pide ${sIni.dur} ms y el doble de CEL-2c son ${CONTEO_SALDO_MS}`)
      if (Math.abs(a.relato.premio.medido - pIni.dur) > tol) fallos.push(`${id}: el premio duró ${a.relato.premio.medido} y pedía ${pIni.dur}`)
      if (Math.abs(a.relato.saldo.medido - sIni.dur) > tol) fallos.push(`${id}: el saldo duró ${a.relato.saldo.medido} y pedía ${sIni.dur}`)
    }
    // EL TRASPASO: uno, y del premio al saldo. La red NO debe haber saltado —si
    // saltó, el aterrizaje no disparó nada y el relato siguió por un cronómetro.
    if (mk('traspaso-red')) fallos.push(`${id}: el traspaso lo cerró la RED, no el aterrizaje de la moneda`)
    if (a.traspasos !== 1) fallos.push(`${id}: volaron ${a.traspasos} monedas de traspaso, debe ser 1`)
    const v = a.vuelo || []
    if (!v.length || !a.anclas) fallos.push(`${id}: no se pudo seguir la moneda del traspaso`)
    else {
      const dist = (p, q) => (p && q ? Math.round(Math.hypot(p.x - q.x, p.y - q.y)) : 9999)
      a.vueloDe = dist(v[0], a.anclas.moneda)
      a.vueloA = dist(v[v.length - 1], a.anclas.saldo)
      a.vueloACifra = dist(v[v.length - 1], a.anclas.cifra)
      if (a.vueloDe > 14) fallos.push(`${id}: la moneda no salió de la fila del premio (${a.vueloDe} px)`)
      // CEL-1b · LA PUERTA SE APRIETA PORQUE AHORA MIDE OTRA COSA. Los 24 px de
      // CEL-2g eran la tolerancia contra el centro de una CAJA DE CIFRA de ~60
      // px de ancho: sobre una moneda de 16 px esa misma puerta pasaria en verde
      // aunque el vuelo aterrizara encima del numero, que es justo lo que esta
      // tanda vino a cambiar. 8 px es medio lado de la moneda: dentro de la
      // tinta o rojo. El resto de holgura es el muestreo —el ultimo fotograma
      // capturado no es el ultimo de la transicion— y con esta curva vale <1 px.
      if (a.vueloA > 8) fallos.push(`${id}: la moneda no aterrizó sobre la tinta de la moneda del saldo (${a.vueloA} px)`)
    }
    // EL ASIENTO: un solo disparo.
    const pulsos = (a.animaciones || []).filter(x => x.nombre === 'cel-asiento')
    if (pulsos.length !== 1) fallos.push(`${id}: el pulso del saldo se disparó ${pulsos.length} veces`)

    // ── CEL-1b · LA MONEDA DE ATERRIZAJE ──────────────────────────────────
    // Tres puertas, y las tres miden lo que declaran.
    //
    // (a) O1 · esta DESDE EL PRIMER RENDER. Por eso se mira en la entrada sobria
    //     y mientras cuenta el premio —los dos tramos ANTERIORES al vuelo— y no
    //     sólo al final: una moneda que apareciera al aterrizar pasaria una
    //     comprobacion hecha en el reposo.
    // (b) EL HUECO ES FIJO. Se compara contra los 8 px declarados y, sobre todo,
    //     CONSIGO MISMO a lo largo del arco: entre la entrada sobria y el reposo
    //     el saldo ha cambiado de cifra, y si entre moneda y numero hubiera un
    //     espacio elastico, ahi es donde se veria.
    //     Se excluye a proposito la foto de `saldoContando`: ahi el micro-pulso
    //     esta corriendo y `getBoundingClientRect` devuelve la caja ESCALADA.
    // (c) EL MICRO-PULSO ES UNO.
    const conMoneda = [['sobria', fotos.sobria], ['premio', fotos.premio], ['reposo', fotos.reposo]]
      .filter(([, f]) => f)
    for (const [cuando, f] of conMoneda) {
      if (!f.monedaSaldo) { fallos.push(`${id}: no hay moneda de aterrizaje en el tramo ${cuando}`); continue }
      if (Math.abs(f.monedaSaldo.w - LADO_MONEDA) > TOL) {
        fallos.push(`${id}: la moneda de aterrizaje mide ${f.monedaSaldo.w} y no ${LADO_MONEDA} (${cuando})`)
      }
      // La caja tiene que ser CUADRADA: si no lo fuera, sobraria el hueco del
      // descendente de la linea y el centro medido no seria el de la tinta —el
      // fallo exacto que VIS-3 documento en `.vc-ficha`.
      if (Math.abs(f.monedaSaldo.w - f.monedaSaldo.h) > TOL) {
        fallos.push(`${id}: la caja de la moneda de aterrizaje no es su tinta (${f.monedaSaldo.w}x${f.monedaSaldo.h}, ${cuando})`)
      }
      if (Math.abs(f.monedaSaldo.hueco - HUECO_MONEDA) > TOL) {
        fallos.push(`${id}: el hueco moneda-cifra es ${f.monedaSaldo.hueco} y no ${HUECO_MONEDA} (${cuando})`)
      }
    }
    const huecos = conMoneda.filter(([, f]) => f.monedaSaldo).map(([c, f]) => `${c}:${f.monedaSaldo.hueco}`)
    if (new Set(huecos.map(h => h.split(':')[1])).size > 1) {
      fallos.push(`${id}: el hueco moneda-cifra se estira con la cifra (${huecos.join(' ')})`)
    }
    a.moneda = { hueco: fotos.reposo?.monedaSaldo?.hueco ?? null, lado: fotos.reposo?.monedaSaldo?.w ?? null }
    const posadas = (a.animaciones || []).filter(x => x.nombre === 'cel-posada')
    if (posadas.length !== 1) fallos.push(`${id}: el micro-pulso de aterrizaje se disparó ${posadas.length} veces`)
    // Y CAE EN EL ATERRIZAJE, no en cualquier momento del relato. Se mide contra
    // el pulso de la cifra y no contra la marca `traspaso-fin`, y ahí hay una
    // lección que la primera corrida cobró en rojo: `marcaCEL` y `animationstart`
    // llevan RELOJES DISTINTOS —el de las marcas nace al montar la pantalla y el
    // de la sonda al instalarse, unos 3,6 s después—, así que restar uno del otro
    // no mide nada. Dentro del reloj de la sonda sí se puede afirmar la relación
    // que importa: entre el aterrizaje y el asiento de la cifra hay exactamente
    // una cuenta de saldo, así que el micro-pulso precede al asiento y lo hace
    // por lo que dura esa cuenta.
    const asientos = pulsos
    if (posadas.length === 1 && asientos.length === 1) {
      const entre = asientos[0].t - posadas[0].t
      a.pulsoAntesDelAsiento = entre
      if (entre <= 0) {
        fallos.push(`${id}: el micro-pulso de aterrizaje no precede al asiento de la cifra (${entre} ms)`)
      } else if (!a.capturas && a.relato?.saldo?.dur) {
        // Misma puerta abierta que la del paso de la cascada: en las celdas que
        // capturan, `page.screenshot` congela el hilo de render y retrasa el
        // `animationstart` que caiga dentro de la captura. Eso es el arnés.
        const dur = a.relato.saldo.dur
        if (Math.abs(entre - dur) > 400) {
          fallos.push(`${id}: entre el micro-pulso y el asiento pasaron ${entre} ms y el saldo cuenta ${dur} — el pulso no cae en el aterrizaje`)
        }
      }
    }
    // LA CASCADA: los cuatro, en su orden y a su paso.
    const entradas = (a.animaciones || []).filter(x => x.nombre === 'cel-rubro-entra')
    a.cascada = entradas.map(x => ({ i: x.i, rotulo: x.rotulo, t: x.t }))
    if (entradas.length !== 4) fallos.push(`${id}: entraron ${entradas.length} rubros, deben ser 4`)
    else {
      const orden = entradas.map(x => x.i)
      if (orden.join(',') !== '0,1,2,3') fallos.push(`${id}: la cascada entró en el orden ${orden.join(',')}`)
      const rotulos = entradas.map(x => x.rotulo)
      if (rotulos.join(' | ') !== CASCADA_ORDEN.join(' | ')) fallos.push(`${id}: el orden de los rubros es ${rotulos.join(' | ')}`)
      // El paso, POR RELOJ, sólo en las celdas que no capturan: `page.screenshot`
      // congela el hilo de render y retrasa el `animationstart` del rubro que
      // caiga dentro de la captura — medido, 410 ms entre el tercero y el cuarto
      // en la celda de 1920. Eso es el arnés, no la cascada.
      if (!a.capturas) {
        for (let k = 1; k < entradas.length; k++) {
          const paso = entradas[k].t - entradas[k - 1].t
          if (Math.abs(paso - 250) > 130) fallos.push(`${id}: entre el rubro ${k - 1} y el ${k} pasaron ${paso} ms y no ~250`)
        }
      }
    }
    // Y el paso POR CSSOM, en todas las celdas: el retraso resuelto de cada
    // rubro es su índice por 250 ms, lo mire el arnés cuando lo mire.
    const escalones = (fotos.cascada?.rubros || [])
    if (escalones.length === 4) {
      for (const r of escalones) {
        const esperado = `${r.i * 0.25}s`
        if (r.retraso !== esperado) fallos.push(`${id}: el rubro ${r.i} entra con retraso ${r.retraso} y debía ser ${esperado}`)
        if (r.animacion !== 'cel-rubro-entra') fallos.push(`${id}: el rubro ${r.i} no lleva la animación de entrada (${r.animacion})`)
      }
    }
    // LAS CIFRAS DE CADA TRAMO.
    if (fotos.sobria?.saldo !== String(SALDO_INICIAL)) {
      fallos.push(`${id}: en la entrada sobria el saldo debe estar quieto en ${SALDO_INICIAL} y pinta ${fotos.sobria?.saldo}`)
    }
    if (fotos.premio?.saldo !== String(SALDO_INICIAL)) {
      fallos.push(`${id}: mientras cuenta el premio, el saldo debe seguir quieto en ${SALDO_INICIAL} (pinta ${fotos.premio?.saldo})`)
    }
    if (rubrosDe(fotos.sobria) !== 0) fallos.push(`${id}: hay ${rubrosDe(fotos.sobria)} rubros visibles en la entrada sobria`)
    if (rubrosDe(fotos.premio) !== 0) fallos.push(`${id}: hay rubros visibles mientras cuenta el premio`)
    if (rubrosDe(fotos.cascada) !== 2) fallos.push(`${id}: a mitad de cascada hay ${rubrosDe(fotos.cascada)} rubros visibles y deben ser 2`)
    if (rubrosDe(fotos.reposo) !== 4) fallos.push(`${id}: en el reposo hay ${rubrosDe(fotos.reposo)} rubros visibles y deben ser 4`)
    if (fotos.reposo?.tramo?.cascada !== 'fin') fallos.push(`${id}: la cascada no acabó (${fotos.reposo?.tramo?.cascada})`)
    if (fotos.reposo?.asiento !== 'si') fallos.push(`${id}: la cifra del saldo no quedó marcada como asentada`)
  }

  // LA CAJA DE LA TARJETA NO CAMBIA EN TODO EL ARCO. Es la promesa de que los
  // rubros ocupan su sitio desde el primer fotograma aunque no se vean.
  const cajas = [['sobria', fotos.sobria], ['fiesta', fotos.fiesta], ['reposo', fotos.reposo]]
    .filter(([, f]) => f?.tarjetaCaja)
  for (const [cuando, f] of cajas) {
    if (JSON.stringify(f.tarjetaCaja) !== JSON.stringify(cajas[0][1].tarjetaCaja)) {
      fallos.push(`${id}: la tarjeta cambia de caja entre ${cajas[0][0]} y ${cuando} (${JSON.stringify(cajas[0][1].tarjetaCaja)} vs ${JSON.stringify(f.tarjetaCaja)})`)
    }
  }

  // 8 · LA LLUVIA.
  const calma = fases.find(f => f.fase === 'calma')
  const trasCalma = calma ? a.nacidas.filter(t => t > calma.t + 40).length : 0
  a.nacidasTrasCalma = trasCalma
  const fiesta = fases.find(f => f.fase === 'fiesta')
  if (opciones.reducido) {
    if (a.vivasMax !== 0 || a.nacidas.length !== 0) fallos.push(`${id}: con movimiento reducido NO debe llover, y nacieron ${a.nacidas.length}`)
  } else {
    if (!a.nacidas.length) fallos.push(`${id}: no llovió ni una moneda`)
    if (a.vivasMax > GOTAS_TECHO) fallos.push(`${id}: hubo ${a.vivasMax} monedas vivas y el techo es ${GOTAS_TECHO}`)
    if (trasCalma > 0) fallos.push(`${id}: nacieron ${trasCalma} monedas DESPUÉS de la calma`)

    // ── CEL-2c · LA VENTANA DE LLUVIA ES LA MELODÍA ─────────────────────────
    // La puerta que prueba la decisión de Victor. Con la lluvia atada al
    // contador, la fiesta duraba ~1,5 s: cualquiera de estas tres condiciones
    // habría estado roja.
    if (fiesta && calma) {
      const ventana = calma.t - fiesta.t
      a.ventanaLluvia = ventana
      if (ventana < MELODIA_S * 1000 - 700 || ventana > MELODIA_S * 1000 + 1200) {
        fallos.push(`${id}: la lluvia duró ${ventana} ms y la melodía dura ${MELODIA_S * 1000}`)
      }
      const tardias = a.nacidas.filter(t => t > fiesta.t + 5000).length
      a.nacidasTrasSeisSegundos = tardias
      if (tardias === 0) fallos.push(`${id}: a los 6 s de fiesta ya no nacían monedas`)
    }
    if (!fotos.plena?.gotas) fallos.push(`${id}: a los 6 s de fiesta no había ni una moneda en el aire`)

    // ── CEL-2c · LA CAÍDA Y EL ORO ──────────────────────────────────────────
    // Medidas sobre las monedas VIVAS a los 6 s, que es donde la lluvia está en
    // régimen. La caída se lee del `animation-duration` resuelto: es el número
    // que el navegador va a usar, no el que el CSS pretende.
    const det = fotos.plena?.gotasDetalle || []
    if (!det.length) fallos.push(`${id}: no se pudo medir ninguna moneda en régimen`)
    else {
      const caidas = det.map(d => d.caida)
      a.caida = { min: Math.min(...caidas), max: Math.max(...caidas) }
      if (a.caida.min < CAIDA_MIN_S - 0.02 || a.caida.max > CAIDA_MAX_S + 0.02) {
        fallos.push(`${id}: caída medida ${a.caida.min}-${a.caida.max} s, sellada ${CAIDA_MIN_S}-${CAIDA_MAX_S}`)
      }
      const cruceros = det.map(d => d.crucero)
      const opacidades = det.map(d => d.opacidad)
      a.opacidad = { crucero: Math.max(...cruceros), pintada: Math.max(...opacidades) }
      if (a.opacidad.crucero > OPACIDAD_TECHO + 0.001) fallos.push(`${id}: hay monedas a opacidad ${a.opacidad.crucero} y el techo es ${OPACIDAD_TECHO}`)
      if (a.opacidad.pintada > OPACIDAD_TECHO + 0.01) fallos.push(`${id}: una moneda se pintó a ${a.opacidad.pintada}`)
    }
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

// ── CEL-2c · La puerta del sorteo de frases ─────────────────────────────────
// Lo que se comprueba es que la frase MOSTRADA y la RECORDADA sean la misma.
// El defecto que esto cierra no se ve jamás en una pantalla: el sorteo vivía en
// un inicializador de `useState` —invocado dos veces en desarrollo— y escribía
// la memoria, así que quedaba guardada una frase distinta de la que se veía y
// la victoria siguiente podía repetir la que el jugador acababa de leer.
//
// El banco se lee de la PÁGINA, con un `import()` dinámico del módulo real que
// el servidor de desarrollo ya está sirviendo: ni se copian las ocho frases
// aquí (envejecerían) ni se importa el módulo en Node (sus importaciones son
// sin extensión, resueltas por Vite).
async function puertaFrases(browser, fallos) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const pares = []
  try {
    for (let k = 0; k < 6; k++) {
      await alaVictoria(page, 5, '', { reposo: false })
      await page.waitForSelector('.cel-screen', { timeout: 10000 })
      pares.push(await page.evaluate(async () => {
        const mod = await import('/src/config/frasesVictoria.js')
        let guardado = null
        try { guardado = window.localStorage.getItem(mod.FRASE_KEY) } catch { /* sin storage */ }
        const i = Number.parseInt(guardado, 10)
        return {
          mostrada: document.querySelector('.cel-frase')?.textContent?.trim() ?? null,
          indice: Number.isInteger(i) ? i : null,
          recordada: Number.isInteger(i) ? (mod.FRASES_VICTORIA[i] ?? null) : null,
        }
      }))
    }
  } catch (e) { fallos.push(`frases: ${e.message}`) }
  await ctx.close()
  pares.forEach((par, k) => {
    if (par.indice === null) fallos.push(`frases: la corrida ${k + 1} no recordó ninguna frase`)
    else if (par.mostrada !== par.recordada) {
      fallos.push(`frases: la corrida ${k + 1} mostró "${par.mostrada}" y recordó "${par.recordada}"`)
    }
    if (k > 0 && par.mostrada === pares[k - 1].mostrada) fallos.push(`frases: la corrida ${k + 1} REPITIÓ "${par.mostrada}"`)
  })
  return pares
}

// ── CEL-2e · La puerta del aviso "Proximamente" ─────────────────────────────
// Cuatro cosas: que aparezca al tocar, que NO desplace nada (va fuera de flujo),
// que se retire solo antes de 3,5 s, que un segundo toque lo quite antes, y que
// no navegue a ningun sitio.
async function puertaRanking(browser, fallos) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const r = {}
  const geometria = () => page.evaluate(() => {
    const caja = (sel) => {
      const e = document.querySelector(sel)
      if (!e) return null
      const b = e.getBoundingClientRect()
      return [Math.round(b.x * 100) / 100, Math.round(b.y * 100) / 100, Math.round(b.width * 100) / 100, Math.round(b.height * 100) / 100]
    }
    return {
      titulo: caja('h1.cel-ajilei'), frase: caja('.cel-frase'), tarjeta: caja('.cel-tarjeta'),
      primario: caja('.cel-acciones .btn-primary'), ranking: caja('.cel-acciones .cel-ranking'),
    }
  })
  const aviso = () => page.evaluate(() => {
    const e = document.querySelector('.cel-aviso')
    if (!e) return null
    const b = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    return {
      texto: e.textContent.trim(),
      vive: cs.display !== 'none' && b.width > 0 && b.height > 0,
      viva: e.getAttribute('aria-live'),
      papel: e.getAttribute('role'),
      // Fuera de flujo: si fuera estatico, empujaria a sus hermanos.
      posicion: cs.position,
    }
  })
  try {
    await alaVictoria(page, 5)     // asentada en reposo
    r.url = page.url()
    r.antes = await geometria()
    r.avisoAntes = await aviso()

    await page.click('.cel-acciones .cel-ranking')
    // EL RATON SE APARTA ANTES DE MEDIR, y esto lo enseñó un rojo de la primera
    // corrida: la puerta cantó "la columna se movió al aparecer el aviso" con un
    // desplazamiento de 2 px del ranking. No era el aviso — era el `:hover` de la
    // familia `.btn`, que levanta el botón 2 px y que el ranking heredó al pasar
    // a ser un botón de verdad. Medido: con el ratón fuera, la caja es idéntica
    // con y sin aviso; con el ratón encima, sube 2 px se toque o no se toque.
    // Comparar geometría con el puntero posado sobre el control mide el hover,
    // no el aviso.
    await page.mouse.move(4, 4)
    await page.waitForTimeout(150)
    r.conAviso = await aviso()
    r.despues = await geometria()
    await page.screenshot({ path: `${OUT}/cel2e-proximamente.png` })

    // Se retira solo. Se mira a los 3,5 s, que es el tope del encargo.
    await page.waitForTimeout(3400)
    r.trasEspera = await aviso()

    // Y el segundo toque lo quita antes de los 3 s.
    await page.click('.cel-acciones .cel-ranking')
    await page.waitForTimeout(150)
    r.segundoToque = await aviso()
    await page.click('.cel-acciones .cel-ranking')
    await page.waitForTimeout(150)
    r.tercerToque = await aviso()
    await page.mouse.move(4, 4)

    r.urlFinal = page.url()
    r.sigueEnPantalla = await page.locator('.cel-screen').count()
  } catch (e) { fallos.push(`ranking: ${e.message}`) }
  await ctx.close()

  if (r.avisoAntes?.vive) fallos.push('ranking: el aviso se ve sin haberlo tocado')
  if (r.avisoAntes?.viva !== 'polite') fallos.push(`ranking: la region viva no es polite (${r.avisoAntes?.viva})`)
  if (r.avisoAntes?.papel !== 'status') fallos.push(`ranking: la region viva no tiene role=status (${r.avisoAntes?.papel})`)
  if (!r.conAviso?.vive) fallos.push('ranking: el aviso NO aparecio al tocar')
  if (r.conAviso?.texto !== 'Próximamente') fallos.push(`ranking: el aviso dice "${r.conAviso?.texto}"`)
  if (r.conAviso?.posicion !== 'absolute') fallos.push(`ranking: el aviso esta en flujo (${r.conAviso?.posicion})`)
  if (JSON.stringify(r.antes) !== JSON.stringify(r.despues)) {
    fallos.push(`ranking: la columna se movio al aparecer el aviso\n      antes  ${JSON.stringify(r.antes)}\n      despues ${JSON.stringify(r.despues)}`)
  }
  if (r.trasEspera?.vive) fallos.push('ranking: el aviso sigue ahi pasados 3,5 s')
  if (!r.segundoToque?.vive) fallos.push('ranking: el aviso no volvio con otro toque')
  if (r.tercerToque?.vive) fallos.push('ranking: un segundo toque no lo quita')
  if (r.url !== r.urlFinal) fallos.push(`ranking: NAVEGO de ${r.url} a ${r.urlFinal}`)
  if (r.sigueEnPantalla !== 1) fallos.push('ranking: la pantalla de victoria se fue')
  return r
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
    // A MITAD del relato: el premio contando y los rubros todavía fuera.
    await page.waitForTimeout(700)
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

  // CEL-2g · con la mesa del molde las dos cifras valen lo mismo al principio y
  // al final (se gana la mesa sin ganarle un céntimo a nadie), así que "el
  // conteo iba por la mitad" ya no se puede leer en el número. Lo que sí se lee
  // —y es lo que la instrucción pide— es el TRAMO: al tocar, el relato estaba
  // sin empezar la cascada; después, todo puesto y los cuatro rubros dentro.
  const visibles = (f) => (f?.rubros || []).filter(x => x.opacidad > 0.5).length
  if (r.medio) {
    if (r.medio.tramo?.cascada !== 'no') fallos.push(`salto: al tocar, el relato ya iba por "${r.medio.tramo?.cascada}"; la puerta no probó nada`)
    if (visibles(r.medio) !== 0) fallos.push(`salto: al tocar ya había ${visibles(r.medio)} rubros dentro`)
  }
  if (r.tras) {
    if (r.tras.saldo !== String(SALDO_INICIAL)) fallos.push(`salto: el saldo no saltó a ${SALDO_INICIAL} (${r.tras.saldo})`)
    if (!['calma', 'reposo'].includes(r.tras.fase)) fallos.push(`salto: tras el toque la fase es ${r.tras.fase}`)
    if (r.tras.tramo?.cascada !== 'fin') fallos.push(`salto: el relato no saltó al final (${r.tras.tramo?.cascada})`)
    if (visibles(r.tras) !== 4) fallos.push(`salto: tras el toque hay ${visibles(r.tras)} rubros visibles y deben ser los 4`)
    if (r.tras.asiento === 'si') fallos.push('salto: el toque encendió el pulso del saldo, que es una celebración de propina')
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
    // CEL-2e · la segunda celda horizontal del encargo. Es la más ancha de las
    // dos y la que enseña la fila de botones con holgura; 640x360 sigue siendo
    // la que aprieta.
    { id: '812x375',   w: 812,  h: 375  },
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

        // CEL-1b · LA MONEDA DE ATERRIZAJE, en la composicion quieta de las tres
        // pieles. La medida del arco (O1, hueco a lo largo del relato, pulso
        // unico) vive en el modo `arco`; esto es la geometria.
        if (!d.monedaSaldo) fallos.push(`${id}: no hay moneda de aterrizaje en la fila del saldo`)
        else {
          const m = d.monedaSaldo
          if (!cerca(m.w, LADO_MONEDA))       fallos.push(`${id}: moneda de aterrizaje ${m.w} != ${LADO_MONEDA}`)
          if (!cerca(m.w, m.h))               fallos.push(`${id}: la caja de la moneda de aterrizaje no es su tinta (${m.w}x${m.h})`)
          if (!cerca(m.hueco, HUECO_MONEDA))  fallos.push(`${id}: hueco moneda-cifra ${m.hueco} != ${HUECO_MONEDA}`)
          if (!cerca(m.margenDerecho, 0))     fallos.push(`${id}: el grupo moneda+cifra no está alineado a la derecha (sobran ${m.margenDerecho} px)`)
          if (m.desborda)                     fallos.push(`${id}: la fila del saldo desborda su columna con la moneda`)

          // EL COMPORTAMIENTO ADAPTATIVO. Tres cosas, y la tercera es la que la
          // instrucción llama "la moneda acompaña a la cifra": si entre las dos
          // hubiera un espacio elástico, al crecer el número la moneda se
          // quedaría clavada en su sitio en vez de retroceder con él.
          const L = m.longitudes || []
          for (const f of L) {
            if (!cerca(f.hueco, HUECO_MONEDA)) {
              fallos.push(`${id}: con la cifra ${f.cifra} el hueco moneda-cifra es ${f.hueco} y no ${HUECO_MONEDA}`)
            }
            if (!cerca(f.margenDerecho, 0)) {
              fallos.push(`${id}: con la cifra ${f.cifra} el grupo se despega de la derecha (${f.margenDerecho} px)`)
            }
          }
          for (let k = 1; k < L.length; k++) {
            if (!(L[k].monedaX < L[k - 1].monedaX)) {
              fallos.push(`${id}: al pasar de ${L[k - 1].cifra} a ${L[k].cifra} la moneda no retrocedió (${L[k - 1].monedaX} -> ${L[k].monedaX})`)
            }
          }
        }
        // Con `?cel` no se juega ninguna mano: 0 ganadas -> 0 puntos, gane el
        // nivel que gane. La multiplicación la sellan las aserciones de unidad.
        if (d.manosGanadas !== '0') fallos.push(`${id}: manos ganadas ${d.manosGanadas} != 0`)
        if (d.puntos !== '0')       fallos.push(`${id}: "Puntos obtenidos" ${d.puntos} != 0`)

        if (d.primarios !== 1)                  fallos.push(`${id}: ${d.primarios} botones primarios, debe haber 1`)
        // CEL-2e · el ranking deja de ser inerte: ni `disabled`, ni pastilla, y
        // sigue sin `href` — un control que contesta no puede anunciarse
        // deshabilitado, y el que no navega no debe parecer un enlace.
        if (d.acciones?.rankingDisabled)     fallos.push(`${id}: el ranking sigue deshabilitado`)
        if (d.acciones?.pastilla !== 0)      fallos.push(`${id}: sigue habiendo pastilla "Proximamente" (${d.acciones?.pastilla})`)
        if (d.acciones?.rankingHref != null) fallos.push(`${id}: el ranking navega a ${d.acciones.rankingHref}`)

        // ── CEL-2e · LA CABECERA DE LA VICTORIA ─────────────────────────────
        if (d.cabecera?.util !== 0)      fallos.push(`${id}: el menu de utilidades sigue montado en la victoria`)
        if (d.cabecera?.wordmark !== 0)  fallos.push(`${id}: el wordmark pequeno sigue en la esquina`)
        if (d.cabecera?.panelUtil !== 0) fallos.push(`${id}: el panel de utilidades quedo montado`)
        // Y lo que SI se queda. Una puerta que solo mira lo que se fue no
        // distingue "limpiaron la cabecera" de "borraron la cabecera".
        if (d.cabecera?.salir !== 1)     fallos.push(`${id}: la equis de salir no esta (${d.cabecera?.salir})`)
        if (d.cabecera?.mano !== 1)      fallos.push(`${id}: el rotulo de mano no esta (${d.cabecera?.mano})`)
        const colados = (d.cabecera?.enfocables || []).filter(c => /utilities-trigger|mute-button/.test(c))
        if (colados.length) fallos.push(`${id}: quedan enfocables en la cabecera: ${colados.join(' | ')}`)

        // ── CEL-2e · LA FILA DE BOTONES, solo en movil horizontal ────────────
        if (!d.acciones) fallos.push(`${id}: no se pudieron medir los dos controles`)
        else if (piel === 'movilHorizontal') {
          if (!d.acciones.enFila)    fallos.push(`${id}: los botones NO estan en fila (primario y=${round(d.acciones.primario.y)}, ranking y=${round(d.acciones.ranking.y)})`)
          if (!d.acciones.mismoAlto) fallos.push(`${id}: los botones no tienen el mismo alto (${round(d.acciones.primario.h)} vs ${round(d.acciones.ranking.h)})`)
          if (!d.acciones.dentro)    fallos.push(`${id}: algun boton se sale de la pantalla`)
          for (const [n, c] of [['primario', d.acciones.primario], ['ranking', d.acciones.ranking]]) {
            if (c.h < 44) fallos.push(`${id}: el ${n} mide ${round(c.h)} de alto y el minimo tactil es 44`)
          }
        } else if (d.acciones.enFila) {
          // El complemento, y no es adorno: la fila es SOLO de horizontal, y
          // sin esta puerta un `@media` mal escrito la colaria en escritorio.
          fallos.push(`${id}: los botones salieron en fila fuera de movil horizontal`)
        }

        // La capa de luz cubre la moneda, ni mas ni menos.
        if (!d.luz) fallos.push(`${id}: la moneda no tiene capa de luz`)
        else if (Math.max(d.luz.dx, d.luz.dy, d.luz.dw, d.luz.dh) > 1) {
          fallos.push(`${id}: la capa de luz no cuadra con la moneda (${JSON.stringify(d.luz)})`)
        }
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
          const r = await puertaSinMenu(page)
          inf.reacciones[id] = r
          if (r.util !== 0)     fallos.push(`${id}: el menu de utilidades sigue ahi en GAME_OVER`)
          if (r.panel !== 0)    fallos.push(`${id}: el panel de utilidades esta montado en GAME_OVER`)
          if (r.selector !== 0) fallos.push(`${id}: el selector de reacciones monto en GAME_OVER`)
          if (r.burbuja !== 0)  fallos.push(`${id}: se monto una burbuja en GAME_OVER`)
          const colados = r.focos.filter(c => /utilities-trigger|mute-button/.test(c))
          if (colados.length)   fallos.push(`${id}: el tabulador llega al menu de utilidades (${colados.join(' | ')})`)
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
  if (inf.control.cabeceraEnJuego?.util !== 1) fallos.push(`control negativo: el menu de utilidades NO esta en una mesa viva (${inf.control.cabeceraEnJuego?.util})`)
  if (inf.control.cabeceraEnJuego?.wordmark !== 1) fallos.push(`control negativo: el wordmark NO esta en una mesa viva (${inf.control.cabeceraEnJuego?.wordmark})`)

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
  inf.frases2c = await puertaFrases(browser, fallos)
  inf.ranking2e = await puertaRanking(browser, fallos)
  inf.salto = await puertaSalto(browser, fallos)

  writeFileSync(`${OUT}/cel1.json`, JSON.stringify(inf, null, 2))

  console.log('-- CEL-1 - cajas contra la lamina --')
  for (const [id, d] of Object.entries(inf.celdas)) {
    const L = d.monedaSaldo?.longitudes || []
    if (L.length) {
      console.log(`  ${''.padEnd(18)} moneda de aterrizaje: `
        + L.map(f => `${f.cifra} -> hueco ${f.hueco}, x ${f.monedaX}${f.desborda ? ' DESBORDA' : ''}`).join(' | '))
    }
    console.log(`  ${id.padEnd(18)} ${String(d.piel).padEnd(15)} AJILEI ${round(d.ajilei?.fontSize)} - cifra ${round(d.cifra?.fontSize)} - moneda ${round(d.moneda?.w)} - frase ${round(d.frase?.fontSize)} (${d.renglonesFrase} rgl) - tarjeta ${round(d.tarjeta?.w)} - saldo ${d.saldo} (moneda ${round(d.monedaSaldo?.w)} + hueco ${round(d.monedaSaldo?.hueco)}) - puntos ${d.puntos} - encaje ${d.encaje?.altoColumna}/${d.encaje?.huecoDisponible} ${d.encaje?.ultimaPiezaDentro ? 'CABE' : 'NO CABE'}`)
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
    console.log(`  ${''.padEnd(22)} lluvia: ${a.nacidas?.length ?? 0} monedas en ${a.ventanaLluvia ?? '?'} ms, ${a.vivasMax ?? 0} vivas como mucho,`
      + ` ${a.nacidasTrasSeisSegundos ?? 0} nacidas tras los 6 s, ${a.nacidasTrasCalma ?? 0} tras la calma`)
    console.log(`  ${''.padEnd(22)} caida ${a.caida?.min ?? '?'}-${a.caida?.max ?? '?'} s | opacidad max ${a.opacidad?.crucero ?? '?'} (pintada ${a.opacidad?.pintada ?? '?'})`
      + ` | cuadros p50 ${a.cuadros?.p50 ?? '?'} ms p95 ${a.cuadros?.p95 ?? '?'} ms peor ${a.cuadros?.peor ?? '?'} ms`)
  }
  console.log(`\n-- la bolsa de melodias, cinco victorias seguidas --\n  ${(inf.melodias || []).join('\n  ')}`)
  console.log(`\n-- el sorteo de frases: mostrada contra recordada --`)
  for (const [k, par] of (inf.frases2c || []).entries()) {
    console.log(`  ${k + 1}. ${par.mostrada === par.recordada ? 'cuadra' : 'DISCREPA'} - indice ${par.indice} - "${par.mostrada}"`)
  }
  console.log('\n-- CEL-2g - el relato de los numeros (ms desde que monta la pantalla) --')
  for (const [id, a] of Object.entries(inf.arco)) {
    if (!a.relato) { console.log(`  ${id.padEnd(22)} sin relato (movimiento reducido)`); continue }
    console.log(`  ${id.padEnd(22)} premio ${a.relato.premio.medido}/${a.relato.premio.dur} -> traspaso ${a.relato.traspaso} -> saldo ${a.relato.saldo.medido}/${a.relato.saldo.dur}`
      + ` -> cascada ${a.relato.cascada} | total ${a.relato.total} ms`)
    console.log(`  ${''.padEnd(22)} vuelo: 1 moneda, ${a.vueloDe} px del origen y ${a.vueloA} px de la tinta de la moneda de aterrizaje`
      + ` (${a.vueloACifra} px del centro de la cifra, que era el destino hasta CEL-1b)`)
    console.log(`  ${''.padEnd(22)} aterrizaje: moneda ${a.moneda?.lado} px, hueco ${a.moneda?.hueco} px,`
      + ` micro-pulso ${a.pulsoAntesDelAsiento} ms antes del asiento (el saldo cuenta ${a.relato.saldo.dur})`)
    console.log(`  ${''.padEnd(22)}`
      + ` | cascada ${(a.cascada || []).map(x => x.rotulo).join(' > ')}`)
  }
  const rk = inf.ranking2e || {}
  console.log(`\n-- el aviso "Proximamente" --`)
  console.log(`  al tocar: ${rk.conAviso?.vive ? 'visible' : 'NO'} (${rk.conAviso?.posicion}) - tras 3,5 s: ${rk.trasEspera?.vive ? 'SIGUE' : 'se fue'}`
    + ` - segundo toque: ${rk.tercerToque?.vive ? 'SIGUE' : 'lo quita'} - navegacion: ${rk.url === rk.urlFinal ? 'ninguna' : 'HUBO'}`)
  const b0 = Object.values(inf.arco)[0]?.brillo
  console.log(`\n-- el brillo de la moneda --\n  ciclo EMB-1 ${b0?.ciclo}s = periodo de la moneda ${b0?.periodo}s - desfase ${b0?.desfase}s (medio ciclo)`)
  const sl = inf.salto || {}
  console.log(`\n-- el salto por toque --\n  al tocar: tramo ${sl.medio?.tramo?.cascada}, rubros dentro ${(sl.medio?.rubros || []).filter(x => x.opacidad > 0.5).length} -> tras el toque: tramo ${sl.tras?.tramo?.cascada}, rubros ${(sl.tras?.rubros || []).filter(x => x.opacidad > 0.5).length}, saldo ${sl.tras?.saldo} (fase ${sl.tras?.fase}) - boton de salir ${sl.salida ? 'responde' : 'NO responde'}`)
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
    // LOB-1 · el CTA del lobby, por contrato de marcado y no por rótulo: el
    // texto sale ahora de un diccionario (IDI-0) y cambiará con el idioma.
    await page.waitForSelector('main.lobby [data-accion="jugar-ia"]')
    await page.click('[data-accion="jugar-ia"]')
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
    // CEL-2e · Y EL CONTROL NEGATIVO DE LA CABECERA. La limpieza es SOLO de
    // GAME_OVER: en una mesa viva el menu y el wordmark tienen que seguir donde
    // estaban. Sin esta cuenta, "quitarlos siempre" pasaria todas las puertas de
    // la victoria y rompería el juego entero sin que nadie se enterase.
    r.cabeceraEnJuego = await page.evaluate(() => ({
      util: document.querySelectorAll('.utilities-trigger').length,
      wordmark: document.querySelectorAll('h1.table-title').length,
    }))
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
