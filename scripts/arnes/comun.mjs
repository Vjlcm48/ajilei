// ── arnes/comun.mjs · ARN-3a · el terreno común de los cuatro arneses ────────
// Rector: AJILEI_ARN-3a_v1.0.md §0. Lo que antes hacía a mano quien corría el
// arnés —levantar el servidor, elegir el navegador, mirar el puerto, saber si
// salió rojo— lo hace ahora el propio arnés, igual en `diagDSK`, `diagPUE`,
// `diagSAL` y `diagCEL0`. Lo puro (y probado) vive en `nucleo.mjs`.
//
//   navegadorArnes()       D1–D4 · Chromium fijo de Playwright; contraste con ARNES_CANAL=msedge
//   servidorArnes({...})   D6–D9 · Vite DENTRO de este proceso: muere con él
//   terminar(codigo)       D5    · cierra todo y sale con 0 / 1 / 2
//   aislarNavegador(b)     3c D6 · ningún contexto del arnés habla con el Supabase real
//
// ── POR QUÉ EL SERVIDOR VIVE DENTRO DEL PROCESO (B8) ─────────────────────────
// Con `npx vite` en otra consola la cadena era bash → node (npx) → cmd → node
// (vite). Cuando la tarea de fondo llegaba a su tope se mataba el bash y
// Windows no mata a los descendientes: el vite quedaba huérfano escuchando. Con
// la API JS de Vite el servidor es un socket de ESTE proceso: si el proceso
// muere, el sistema cierra el socket. Y para el caso de que maten al padre y a
// este proceso no (exactamente lo que hace matar la tarea de fondo), un vigía
// mira cada segundo si el padre sigue vivo y, si no, cierra y sale con 2.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import {
  NAVEGADOR_SELLADO, ORDEN_INSTALAR, CODIGO, ErrorInstrumento,
  canalPedido, comprobarVersion, faltaNavegador, leerOpciones, pidQueEscucha, decidirBuild,
  esLocal, clasificarPeticion, respuestaSupabase, corteDelArnes, veredictoAislamiento,
  crearBanco, SALDO_ARNES,
} from './nucleo.mjs'

export { CODIGO, ErrorInstrumento, ETIQUETA_NAVEGADOR, NAVEGADOR_SELLADO, codigoDeSalida, veredictosDSK, MODOS_DSK } from './nucleo.mjs'

const RAIZ = fileURLToPath(new URL('../..', import.meta.url))

// ── Lo que hay que cerrar al salir, pase lo que pase ─────────────────────────
const cierres = []
let saliendo = false

/** Registra un cierre (navegador, servidor). Se ejecutan en orden inverso. */
export function alSalir(fn) { cierres.push(fn) }

async function cerrarTodo() {
  while (cierres.length) {
    const fn = cierres.pop()
    try {
      await Promise.race([Promise.resolve().then(fn), new Promise((r) => setTimeout(r, 5000))])
    } catch { /* cerrar es lo último que se hace: un fallo aquí no cambia el veredicto */ }
  }
}

/**
 * D5 · cierra navegador y servidores y sale con el código. ARN-3c · D6 · antes
 * juzga el aislamiento de toda la corrida: si algo escapó a la red real, la
 * salida es 2 por mucho que el modo saliera verde (la medida no se hizo en las
 * condiciones que dice).
 */
export async function terminar(codigo) {
  if (saliendo) return
  saliendo = true
  await cerrarTodo()
  if (RED.contextos > 0) {
    const v = veredictoAislamiento(RED)
    console.log(`· aislamiento (D6): ${resumenRed()} → ${v === 'verde' ? 'verde' : 'ERROR DE INSTRUMENTO'}`)
    if (v !== 'verde') {
      console.error(`✖ ${RED.escapadas.length} petición(es) salieron a la red real:\n    ${RED.escapadas.slice(0, 8).join('\n    ')}`)
      codigo = Math.max(codigo, CODIGO.INSTRUMENTO)
    }
  }
  process.exit(codigo)
}

/** Un error de instrumento: lo dice en voz alta y sale con 2. */
export async function fallarInstrumento(error) {
  const msg = error instanceof ErrorInstrumento ? error.message : String(error?.stack || error)
  console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): ${msg}`)
  if (error?.detalle) console.error(error.detalle)
  await terminar(CODIGO.INSTRUMENTO)
}

let instalado = false
/**
 * Lo que tiene que pasar en CUALQUIER salida: excepción sin atrapar, promesa
 * rechazada sin manejar, Ctrl+C, SIGTERM, o el padre que desaparece. Se llama
 * una vez al empezar cada arnés.
 */
export function instalarSalidas() {
  if (instalado) return
  instalado = true
  process.on('uncaughtException', (e) => { fallarInstrumento(e) })
  process.on('unhandledRejection', (e) => { fallarInstrumento(e) })
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    try { process.on(s, () => { console.error(`\n✖ ${s}: se cierra el arnés`); terminar(CODIGO.INSTRUMENTO) }) } catch { /* señal no soportada aquí */ }
  }
  // El vigía del padre (B8). `process.ppid` es el PID del padre al arrancar;
  // `process.kill(pid, 0)` no envía nada, solo pregunta si existe.
  const padre = process.ppid
  if (padre && !process.env.ARNES_SIN_VIGIA) {
    const t = setInterval(() => {
      try { process.kill(padre, 0) } catch (e) {
        if (e.code === 'EPERM') return   // existe, pero es de otro usuario
        clearInterval(t)
        console.error(`\n✖ el proceso padre (${padre}) desapareció: se cierra el arnés para no dejar huérfanos`)
        terminar(CODIGO.INSTRUMENTO)
      }
    }, 1000)
    t.unref()
  }
}

// ── Opciones ─────────────────────────────────────────────────────────────────
/**
 * Lee las opciones comunes y las QUITA de `process.argv`, para que cada arnés
 * siga leyendo sus modos por posición como siempre. Un error de opción es de
 * instrumento (2).
 */
export function opcionesDelArnes() {
  try {
    const { opc, resto } = leerOpciones(process.argv.slice(2))
    process.argv.splice(2, process.argv.length - 2, ...resto)
    return opc
  } catch (e) {
    console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): ${e.message}`)
    process.exit(CODIGO.INSTRUMENTO)
  }
}

// ── D1–D4 · el navegador ─────────────────────────────────────────────────────
/**
 * Lanza el navegador del arnés. Por defecto, el Chromium sellado de Playwright;
 * con ARNES_CANAL=msedge, el Edge del sistema (pasada de contraste). Devuelve
 * el navegador y la nota de versión. Con el canal por defecto, una versión
 * distinta de la sellada es un error de instrumento (D3).
 */
export async function navegadorArnes(extra = {}) {
  const canal = canalPedido(process.env)
  let browser
  try {
    browser = await chromium.launch({ channel: canal, headless: true, ...extra })
  } catch (e) {
    if (faltaNavegador(e)) {
      throw new ErrorInstrumento(
        `el Chromium del arnés no está instalado (canal ${canal}, ${NAVEGADOR_SELLADO.version}). Instálalo con:\n\n    ${ORDEN_INSTALAR}\n`,
        String(e.message).split('\n')[0])
    }
    throw new ErrorInstrumento(`no arrancó el navegador (canal ${canal}): ${String(e.message).split('\n')[0]}`)
  }
  alSalir(() => browser.close())
  aislarNavegador(browser)
  const vivo = browser.version()
  const v = comprobarVersion(canal, vivo)
  if (!v.ok) throw new ErrorInstrumento(v.nota)
  if (v.nota) console.log(`⚠ ${v.nota}`)
  return { browser, canal, version: vivo, contraste: v.contraste, nota: v.nota }
}

// ── D8 · el puerto ───────────────────────────────────────────────────────────
/** ¿Quién escucha en el puerto? `{ pid, linea }` o null. */
export function quienEscucha(puerto) {
  let pid = null
  try {
    pid = pidQueEscucha(execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' }), puerto)
    if (!pid) pid = pidQueEscucha(execFileSync('netstat', ['-ano', '-p', 'TCPv6'], { encoding: 'utf8' }), puerto)
  } catch { return null }
  if (!pid) return null
  let linea = '(no se pudo leer la línea de órdenes)'
  try {
    linea = execFileSync('powershell', ['-NoProfile', '-Command',
      `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`], { encoding: 'utf8' }).trim() || linea
  } catch { /* se informa el PID igualmente */ }
  return { pid, linea }
}

function exigirPuertoLibre(puerto) {
  const q = quienEscucha(puerto)
  if (!q) return
  throw new ErrorInstrumento(
    `el puerto ${puerto} está ocupado por otro proceso y el arnés NO lo toca.\n` +
    `    PID ${q.pid} · ${q.linea}\n` +
    `  Elige otro puerto con --puerto=N, o usa ese servidor con --servidor=externo.`)
}

// ── D6–D9 · el servidor ──────────────────────────────────────────────────────
// ARN-3e-ii · D17 · los servidores de desarrollo que este proceso ya creó. Un
// build pedido después es un error de instrumento (`decidirBuild`, H3e-i-1).
const DEVS_VIVOS = []

/**
 * Levanta (o, con `externo`, solo comprueba) el servidor del arnés.
 *   tipo   'dev' (createServer) o 'preview' (build + preview)
 *   bypass solo 'dev': true = VITE_AUTH_BYPASS del .env.local; false = vaciado
 * Devuelve `{ base }`. El cierre queda registrado en `alSalir`.
 */
export async function servidorArnes({ tipo, puerto, bypass = true, build = true, externo = false, base = null }) {
  const url = base || `http://localhost:${puerto}`
  if (externo) {
    await exigirQueResponda(url, `--servidor=externo: no responde ${url}. Levántalo tú, o quita --servidor=externo para que el arnés levante el suyo.`)
    return { base: url, propio: false }
  }
  exigirPuertoLibre(puerto)
  const vite = await import('vite')
  if (tipo === 'dev') {
    // El bypass es de COMPILACIÓN (import.meta.env): Vite lee el entorno al
    // resolver la configuración, y una variable que ya existe en el proceso
    // gana al .env.local. Vacía, no '0' (H-2 de LUZ-1: '0' es verdadero).
    const antes = process.env.VITE_AUTH_BYPASS
    if (bypass) delete process.env.VITE_AUTH_BYPASS
    else process.env.VITE_AUTH_BYPASS = ''
    let servidor
    try {
      servidor = await conNodeEnvPropio(() => vite.createServer({
        root: RAIZ, logLevel: 'warn', clearScreen: false,
        // `forwardConsole`: Vite 8 copia la consola del navegador a la terminal
        // del servidor, que ahora es la del arnés. Los modos ya la recogen por
        // su cuenta (y algunos la juzgan): duplicarla solo ensucia la salida.
        server: { port: puerto, strictPort: true, host: 'localhost', forwardConsole: false },
      }))
    } finally {
      if (antes === undefined) delete process.env.VITE_AUTH_BYPASS
      else process.env.VITE_AUTH_BYPASS = antes
    }
    DEVS_VIVOS.push(puerto)
    alSalir(() => servidor.close())
    await servidor.listen()
  } else if (tipo === 'preview') {
    // D7 · nunca un dist/ viejo: se compila antes, salvo --sin-build.
    if (build) {
      const puede = decidirBuild(DEVS_VIVOS)
      if (!puede.ok) throw new ErrorInstrumento(puede.motivo)
      console.log('· arnés: compilando (vite build) para medir el bundle de este árbol…')
      await conNodeEnvPropio(() => vite.build({ root: RAIZ, logLevel: 'warn', clearScreen: false }))
    }
    const servidor = await conNodeEnvPropio(() => vite.preview({
      root: RAIZ, logLevel: 'warn', clearScreen: false,
      preview: { port: puerto, strictPort: true, host: 'localhost' },
    }))
    alSalir(() => servidor.close())
  } else {
    throw new ErrorInstrumento(`servidorArnes: tipo desconocido «${tipo}»`)
  }
  await exigirQueResponda(url, `el servidor propio no responde en ${url}`)
  console.log(`· arnés: servidor ${tipo}${tipo === 'dev' ? (bypass ? ' con bypass' : ' sin bypass') : ''} en ${url} (dentro de este proceso)`)
  return { base: url, propio: true }
}

// Vite solo pone su NODE_ENV por defecto («development» al servir, «production»
// al compilar o previsualizar) si el proceso no tiene ya uno, y lo deja puesto
// (vite/dist/node/chunks/node.js:34338-34340). Con dos servidores en el MISMO
// proceso, el primero decidía por el segundo: tras el `preview` de `diagPUE`,
// el servidor de desarrollo de la burbuja nacía en producción, sin
// `import.meta.env.DEV` y por tanto sin `?apu=` ni bypass (ARN-3a §5, A-6).
// Cada llamada nace sin NODE_ENV y al terminar se devuelve el que había.
async function conNodeEnvPropio(fn) {
  const antes = process.env.NODE_ENV
  delete process.env.NODE_ENV
  try { return await fn() } finally {
    if (antes === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = antes
  }
}

async function exigirQueResponda(url, mensaje) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e) {
    throw new ErrorInstrumento(`${mensaje} (${e.message})`)
  }
}

// ── ARN-3c · D6 · el aislamiento de la red ───────────────────────────────────
// La regla de `contextoCap` (scripts/cap/capMesa.mjs), puesta en TODO contexto:
// lo local pasa, Supabase se contesta desde el arnés (`respuestaSupabase`) y lo
// demás se corta y se anota. Los sockets no locales (el tiempo real de
// Supabase) se desvían y quedan mudos; el de Vite (local) no se toca.
//
// Se engancha en `browser.newContext` de la INSTANCIA: `browser.newPage()` de
// playwright-core crea su contexto llamando a `this.newContext(...)`, así que
// los ~70 sitios que abren página siguen como estaban y quedan cubiertos. La
// ruta se registra al NACER el contexto: en Playwright manda la última ruta
// registrada, así que las propias de `contextoCap` y `contextoBie` (que
// contestan con su sesión y sus retrasos) siguen mandando, y esta queda debajo
// como red de seguridad.
//
// La PUERTA no mira la ruta (eso sería creerse a sí misma): mira lo que llegó.
// Una respuesta contestada por el arnés no trae dirección de servidor
// (`serverAddr() === null`); una que trae dirección y no es local salió a la
// red. Un socket desviado no dispara `page.on('websocket')`; uno que lo dispara
// y no es local, salió.
const RED = { contextos: 0, supabase: 0, cortadas: [], sockets: [], escapadas: [] }

/** El resumen de la corrida, para el JSON y la línea final. */
export function redDelArnes() {
  return {
    contextos: RED.contextos, supabaseAtendidas: RED.supabase,
    cortadas: [...new Set(RED.cortadas)], socketsDesviados: [...new Set(RED.sockets)],
    escapadas: [...RED.escapadas], veredicto: RED.contextos ? veredictoAislamiento(RED) : null,
  }
}
const resumenRed = () =>
  `${RED.contextos} contextos · ${RED.supabase} a Supabase contestadas aquí · ${new Set(RED.cortadas).size} destinos cortados · ` +
  `${new Set(RED.sockets).size} sockets desviados · ${RED.escapadas.length} escapadas`

let hostSupabaseCache
function hostSupabase() {
  if (hostSupabaseCache !== undefined) return hostSupabaseCache
  let url = process.env.VITE_SUPABASE_URL
  const env = join(RAIZ, '.env.local')
  if (!url && existsSync(env)) url = (readFileSync(env, 'utf8').match(/^VITE_SUPABASE_URL=(.+)$/m) || [])[1]
  try { hostSupabaseCache = url ? new URL(url.trim()).host : null } catch { hostSupabaseCache = null }
  return hostSupabaseCache
}

/** Aísla un contexto. Devuelve su registro (`ctx.__aislamiento`). */
export async function aislarContexto(ctx) {
  RED.contextos++
  const host = hostSupabase()
  const propio = { sockets: [] }
  ctx.__aislamiento = propio
  await ctx.route('**/*', async (route) => {
    const r = route.request()
    const clase = clasificarPeticion(r.url(), host)
    if (clase === 'local') return route.continue()
    if (clase === 'supabase') {
      RED.supabase++
      const u = new URL(r.url())
      // ECO-1c · un banco imitado por contexto, por si una mesa se sienta aquí.
      ctx.__banco ??= crearBanco({ saldo: SALDO_ARNES })
      let params = null
      try { params = r.postDataJSON() } catch { params = null }
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(respuestaSupabase(u.pathname, r.headers()['accept'] || '', undefined, { banco: ctx.__banco, params })) })
    }
    RED.cortadas.push(new URL(r.url()).host)
    return route.abort('blockedbyclient')
  })
  await ctx.routeWebSocket((u) => !esLocal(String(u)), (ws) => {
    RED.sockets.push(ws.url()); propio.sockets.push(ws.url())
    // Ni `connectToServer()` ni `close()`: queda abierto y mudo, como un
    // servidor que no contesta. Cerrarlo dispararía reintentos del SDK.
  })
  // El vigía (la puerta): lo que de verdad llegó de fuera.
  ctx.on('response', async (resp) => {
    if (esLocal(resp.url())) return
    let dir = null
    try { dir = await resp.serverAddr() } catch { /* contexto cerrándose */ }
    if (dir) RED.escapadas.push(`${resp.request().method()} ${resp.url()} ← ${dir.ipAddress}:${dir.port}`)
  })
  ctx.on('requestfailed', (r) => {
    if (esLocal(r.url()) || corteDelArnes(r.failure()?.errorText)) return
    RED.escapadas.push(`${r.method()} ${r.url()} ✖ ${r.failure()?.errorText}`)
  })
  ctx.on('page', (p) => p.on('websocket', (ws) => {
    if (!esLocal(ws.url())) RED.escapadas.push(`WS ${ws.url()}`)
  }))
  return propio
}

/**
 * Engancha el aislamiento en TODO contexto que abra este navegador. Se aplica
 * solo en `navegadorArnes()`; un navegador lanzado aparte (el WebKit de
 * `diagPUE dis`) se pasa por aquí a mano.
 */
export function aislarNavegador(browser) {
  if (browser.__aislado) return browser
  const nuevo = browser.newContext.bind(browser)
  browser.newContext = async (opciones) => {
    const ctx = await nuevo(opciones)
    await aislarContexto(ctx)
    return ctx
  }
  browser.__aislado = true
  return browser
}
