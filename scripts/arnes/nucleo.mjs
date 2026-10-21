// ── arnes/nucleo.mjs · ARN-3a · lo PURO del terreno del arnés ────────────────
// Rector: AJILEI_ARN-3a_v1.0.md §0. Aquí no hay navegador, ni red, ni procesos:
// solo las decisiones que se pueden probar en vitest (`nucleo.test.js`).
//   · qué navegador está sellado y cómo se compara con el vivo   (D1–D4)
//   · cómo se leen las opciones comunes de la línea de órdenes    (D7–D9)
//   · cómo un veredicto se traduce a código de salida             (D5)
//   · qué dice cada modo de `diagDSK` sobre sí mismo              (D5)

// ── D1/D2 · el navegador sellado ─────────────────────────────────────────────
// `playwright-core` va fijado EXACTO en package.json, y cada versión trae su
// Chromium. Las cifras de las baselines son las mismas que con el Edge 151 con
// que se tomaron (ARN-3 Fase 0 §B2: 515 + 726 + 210 números, 0 diferencias),
// así que no se re-sellan: solo cambia la etiqueta.
export const NAVEGADOR_SELLADO = Object.freeze({
  canal: 'chromium',
  version: '151.0.7922.34',
  playwrightCore: '1.62.1',
})
export const ETIQUETA_NAVEGADOR =
  `${NAVEGADOR_SELLADO.canal} ${NAVEGADOR_SELLADO.version} (playwright-core ${NAVEGADOR_SELLADO.playwrightCore})`

// D4 · sin descarga automática: el comando exacto, con `--no-shell` (el canal
// `chromium` arranca el Chromium completo; el headless shell no se usa).
export const ORDEN_INSTALAR = 'node node_modules/playwright-core/cli.js install --no-shell chromium'

// ── D5 · códigos de salida ───────────────────────────────────────────────────
export const CODIGO = Object.freeze({ VERDE: 0, ROJO: 1, INSTRUMENTO: 2 })

/** Un error que es del INSTRUMENTO (código 2), no del producto. */
export class ErrorInstrumento extends Error {
  constructor(mensaje, detalle = null) {
    super(mensaje)
    this.name = 'ErrorInstrumento'
    this.detalle = detalle
  }
}

/**
 * Junta los veredictos de los modos corridos. Cada uno es 'verde', 'rojo',
 * 'cobertura', 'informativo' o 'error'. Un solo error manda (2); si no, un
 * rojo o una cobertura (1); si no, 0. Una lista VACÍA es un error: un arnés que
 * no midió nada no puede salir verde (D4 de la Fase 0: un skip silencioso no es
 * un verde).
 *
 * ARN-3b · D4 · 'cobertura' es un modo con alguna celda «sin cobertura»: el
 * caso que la celda mide no se dio en tres intentos. No es un rojo de puerta
 * —la etiqueta lo distingue en la salida y en el JSON—, pero tampoco puede
 * salir 0: un hueco de medida no es un verde.
 */
export const VEREDICTOS = Object.freeze(['verde', 'rojo', 'cobertura', 'informativo', 'error'])
export function codigoDeSalida(veredictos) {
  if (!Array.isArray(veredictos) || veredictos.length === 0) return CODIGO.INSTRUMENTO
  if (veredictos.some((v) => v === 'error' || !VEREDICTOS.includes(v))) return CODIGO.INSTRUMENTO
  if (veredictos.includes('rojo') || veredictos.includes('cobertura')) return CODIGO.ROJO
  return CODIGO.VERDE
}

// ── D1/D3 · el canal y la versión ────────────────────────────────────────────
/** El canal pedido: por defecto el sellado; `ARNES_CANAL=msedge` es el contraste. */
export function canalPedido(env = {}) {
  const c = (env.ARNES_CANAL || '').trim()
  if (!c) return NAVEGADOR_SELLADO.canal
  if (c !== 'chromium' && c !== 'msedge') {
    throw new ErrorInstrumento(`ARNES_CANAL desconocido: «${c}». Valen «chromium» (por defecto) y «msedge» (contraste)`)
  }
  return c
}

/**
 * D3 · ¿el navegador vivo es el sellado? Con el canal por defecto, una versión
 * distinta es un error de instrumento: las cifras dejaron de ser comparables.
 * Con el canal de contraste la diferencia es esperada y solo se anota.
 */
export function comprobarVersion(canal, vivo) {
  if (canal === NAVEGADOR_SELLADO.canal) {
    if (vivo === NAVEGADOR_SELLADO.version) return { ok: true, contraste: false, nota: null }
    return {
      ok: false, contraste: false,
      nota: `el navegador cambió: hay que re-sellar (vivo ${canal} ${vivo}, sellado ${ETIQUETA_NAVEGADOR})`,
    }
  }
  return { ok: true, contraste: true, nota: `pasada de contraste: ${canal} ${vivo} frente a ${ETIQUETA_NAVEGADOR}` }
}

/** ¿El error de Playwright es «el navegador no está instalado»? */
export function faltaNavegador(error) {
  return /Executable doesn't exist|browserType\.launch: .*(not found|no such file)/i.test(String(error?.message ?? error))
}

// ── D7–D9 · las opciones comunes ─────────────────────────────────────────────
const BANDERAS = ['--servidor=', '--puerto=', '--puerto-aux=', '--sin-build']

/**
 * Lee las opciones del terreno y devuelve además `resto`: la línea de órdenes
 * SIN ellas. Los arneses leen sus modos por posición (`argv[2]`, `[3]`, `[4]`),
 * así que las banderas comunes no pueden quedarse en medio.
 */
export function leerOpciones(argv) {
  const opc = { servidor: 'propio', puerto: null, puertoAux: null, build: true }
  const resto = []
  for (const a of argv) {
    if (a.startsWith('--servidor=')) {
      const v = a.slice('--servidor='.length)
      if (v !== 'propio' && v !== 'externo') throw new ErrorInstrumento(`--servidor=${v}: valen «propio» (por defecto) y «externo»`)
      opc.servidor = v
    } else if (a.startsWith('--puerto=')) {
      opc.puerto = puertoValido(a.slice('--puerto='.length), '--puerto')
    } else if (a.startsWith('--puerto-aux=')) {
      opc.puertoAux = puertoValido(a.slice('--puerto-aux='.length), '--puerto-aux')
    } else if (a === '--sin-build') {
      opc.build = false
    } else {
      resto.push(a)
    }
  }
  return { opc, resto }
}

function puertoValido(texto, bandera) {
  const n = Number(texto)
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw new ErrorInstrumento(`${bandera}=${texto}: no es un puerto`)
  return n
}

export const esBanderaComun = (a) => BANDERAS.some((b) => (b.endsWith('=') ? a.startsWith(b) : a === b))

// ── ARN-3e-ii · D17 · ¿se puede compilar ahora? ─────────────────────────────
// H3e-i-1: un `vite build` en el MISMO proceso que un servidor de desarrollo ya
// creado deja a ese dev inservible: la app no llega al lobby y el modo muere
// por un timeout de 30 s que no dice por qué. El orden sano es el de `diagPUE
// voz2` y `humo`: el preview (con su build) primero, el dev después.
/**
 * `devsVivos`: los puertos de los servidores de desarrollo que este proceso ya
 * creó. Con alguno, compilar es un error de INSTRUMENTO (código 2), con el
 * motivo escrito. Devuelve `{ ok, motivo }`.
 */
export function decidirBuild(devsVivos = []) {
  if (!devsVivos.length) return { ok: true, motivo: null }
  return {
    ok: false,
    motivo: `H3e-i-1 · se pidió un build con un servidor de desarrollo ya vivo en este proceso `
      + `(${devsVivos.map((p) => `:${p}`).join(', ')}). Compilar después de crear el dev lo deja inservible: `
      + `la app no llega al lobby. Levanta el preview (y su build) ANTES que el dev, o usa --sin-build.`,
  }
}

// ── D8 · el puerto ocupado ───────────────────────────────────────────────────
/**
 * Del texto de `netstat -ano` saca el PID que ESCUCHA en el puerto, en
 * cualquier dirección (0.0.0.0, [::], 127.0.0.1, [::1]). Null si nadie.
 */
export function pidQueEscucha(netstat, puerto) {
  for (const linea of String(netstat).split(/\r?\n/)) {
    const m = linea.trim().match(/^TCP\s+(\S+):(\d+)\s+\S+\s+(LISTENING|ESCUCHANDO)\s+(\d+)$/i)
    if (m && Number(m[2]) === puerto) return Number(m[4])
  }
  return null
}

// ── D5 · qué dice cada modo de `diagDSK` sobre sí mismo ──────────────────────
// Cada modo nació en una campaña distinta y guarda su veredicto donde pudo:
// `passed` por celda, `passed`/`ok`/`verde` arriba, o booleanos sueltos en los
// modos de diagnóstico de la Fase 0 de DSK. Aquí se lee cada uno por donde lo
// escribe — sin cambiar una sola puerta —; lo que no tiene veredicto es
// 'informativo'. Una matriz VACÍA no es verde: es 'vacio' (error, código 2).
const TODAS = (lista, pred) => lista.every(pred) ? 'verde' : 'rojo'
// ARN-3b · D4 · una celda dice su `estado`: 'medida' (o sin campo, como antes),
// 'sinCobertura' o 'error'. Su `passed` se calcula SIN la puerta de cobertura,
// así que una celda sin cobertura con un rojo de geometría sigue siendo roja.
// Orden: error > rojo > cobertura > verde.
const PORCELDA = (d) => {
  if (!Array.isArray(d)) return 'rojo'
  if (!d.length) return 'vacio'
  if (d.some((c) => c?.estado === 'error')) return 'error'
  if (d.some((c) => c?.passed !== true)) return 'rojo'
  return d.some((c) => c?.estado === 'sinCobertura') ? 'cobertura' : 'verde'
}
// Los modos con veredicto arriba declaran sus huecos en `sinCobertura` (lista).
const ARRIBA = (campo) => (d) => {
  if (!(d && typeof d === 'object' && campo in d)) return 'rojo'
  if (d[campo] !== true) return 'rojo'
  return Array.isArray(d.sinCobertura) && d.sinCobertura.length ? 'cobertura' : 'verde'
}
const BOOLEANOS = (campos) => (d) => Array.isArray(d)
  ? (d.length ? TODAS(d, (c) => campos.every((k) => c[k] === true)) : 'vacio')
  : 'rojo'

export const VEREDICTO_DSK = Object.freeze({
  // informativos: miden y vuelcan, no deciden
  d1d2: () => 'informativo', d3: () => 'informativo', bug: () => 'informativo',
  shots: () => 'informativo', b1: () => 'informativo',
  // `passed` por celda
  a1: PORCELDA, a2: PORCELDA, f1: PORCELDA, h1: PORCELDA, o1: PORCELDA, o2: PORCELDA,
  r1: PORCELDA, z1: PORCELDA, m1: PORCELDA,
  r2: (d) => PORCELDA(d?.cells),
  // `passed` arriba
  menuMovil: ARRIBA('passed'), msg: ARRIBA('passed'), tapetes: ARRIBA('passed'),
  u1: ARRIBA('passed'), u2: ARRIBA('passed'), u3: ARRIBA('passed'), vc: ARRIBA('passed'),
  // `ok` arriba
  apu: ARRIBA('ok'), lob: ARRIBA('ok'), retar: ARRIBA('ok'),
  // `verde` arriba
  luz: ARRIBA('verde'), rev: ARRIBA('verde'), rec: ARRIBA('verde'), vuelo: ARRIBA('verde'),
  congelado: ARRIBA('verde'),   // ARN-3c-ii · §1.1.2
  saldo: ARRIBA('verde'),       // ECO-1b · una sola cifra (INV-46)
  mesaia: ARRIBA('verde'),      // ECO-1c · la mesa contra las IAS en el servidor (INV-47–49)
  revive: ARRIBA('verde'),      // ECO-1c · D-1: la IA quebrada no vuelve
  constancia: ARRIBA('verde'),  // ECO-1d · constancia, límites y válvula (INV-50–52)
  video: ARRIBA('verde'),       // ECO-1g · el video de recompensa contra un boleto (INV-54)
  tam: ARRIBA('verde'),         // IOS-1 1b · lo principal se alcanza en las pantallas bajas (INV-55)
  webkit: ARRIBA('verde'),      // IOS-1 1f · la matriz de `tam` en WebKit (INV-55; el acostado, limitación)
  tab: ARRIBA('verde'),         // TAB-1 1e · la escala de la mesa: V-cel, V-tv, V-h, V-vuelo, V-fuera y V-giro
  // `matrixOk`
  gate: ARRIBA('matrixOk'),
  // booleanos por celda (diagnósticos de DSK que nunca juntaron un `passed`)
  p1: BOOLEANOS(['allBadgesLetters', 'scoreHidden', 'noShift']),
  p2: BOOLEANOS(['chipOk', 'saldoHiddenResting', 'fichasAbsent', 'cycleOk', 'worst7Ok', 'noShift', 'overflowOk']),
  tactil: BOOLEANOS(['allInteractiveOk', 'multNoOverlap']),
  // ARN-3c · D6 · no es un modo: es la puerta del aislamiento de toda la corrida.
  aislamiento: (d) => veredictoAislamiento(d),
})

/** Modos válidos de `diagDSK` (el argumento) y la clave con que vuelven en el informe. */
export const MODOS_DSK = Object.freeze([
  'humo', 'd1d2', 'd3', 'bug', 'shots', 'gate', 'lob', 'retar', 'apu', 'b1', 'tactil', 'p1', 'p2',
  'r1', 'r2', 'o1', 'h1', 'm1', 'a1', 'f1', 'z1', 'o2', 'a2', 'u1', 'menu-movil', 'u2', 'u3',
  'vc', 'msg', 'tapetes', 'vuelo', 'luz', 'rev', 'rec', 'congelado', 'saldo', 'mesaia', 'revive', 'constancia', 'video', 'tam', 'webkit', 'tab',
])
const CLAVES_META = new Set(['mode', 'ts', 'arnes', 'error', 'veredicto', 'codigo'])

/**
 * El veredicto de una corrida de `diagDSK`: un par [clave, veredicto] por modo
 * del informe. `report.error` (el modo abortó) es siempre 'error'.
 */
export function veredictosDSK(report) {
  const out = []
  for (const [clave, datos] of Object.entries(report || {})) {
    if (CLAVES_META.has(clave)) continue
    const f = VEREDICTO_DSK[clave]
    out.push([clave, f ? normaliza(f(datos)) : 'error'])
  }
  if (report?.error) out.push(['error', 'error'])
  return out
}
const normaliza = (v) => (v === 'vacio' ? 'error' : v)

// ── ARN-3c · D6 · el arnés no habla con el Supabase real ─────────────────────
// Hasta 3c, cada carga de 5173 hacía un `401` contra la base de verdad y dejaba
// `SAL-A … 42501 permission denied for function mi_sala` en la consola (H-7), y
// un corte de red pintaba de rojo una celda de `apu` (H3b-ii-7). `contextoCap`
// ya sabía no salir: una ruta para todo que deja pasar lo local, contesta a
// Supabase desde aquí y corta el resto. Esa misma regla pasa al terreno común
// (`comun.mjs` la pone en TODO contexto del navegador del arnés) y aquí queda
// lo que decide, probado en `nucleo.test.js`.

const LOCALES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/** ¿Es una petición que se queda en esta máquina (o no es de red)? */
export function esLocal(url) {
  let u
  try { u = new URL(url) } catch { return true }      // sin URL no hay red que proteger
  if (!/^(https?|wss?):$/.test(u.protocol)) return true   // data:, blob:, about:, chrome-extension:…
  return LOCALES.has(u.hostname)
}

/**
 * 'local' pasa, 'supabase' se contesta desde el arnés, 'fuera' se corta.
 * `hostSupabase` es el host del `.env.local`; además, cualquier `*.supabase.co`
 * es Supabase aunque el host no se conozca (un `.env.local` de otro proyecto).
 */
export function clasificarPeticion(url, hostSupabase = null) {
  if (esLocal(url)) return 'local'
  const h = new URL(url).hostname
  if ((hostSupabase && h === hostSupabase) || /\.supabase\.co$/.test(h)) return 'supabase'
  return 'fuera'
}

// ECO-1c · el servidor imitado de las mesas contra las IAS: el MISMO modelo
// que usan el bypass y las pruebas de contrato (`src/dev/bancoImitado.js`, la
// migración eco1c leída en JS). Es puro: sin `import.meta` ni DOM.
import { crearBanco } from '../../src/dev/bancoImitado.js'
export { crearBanco }

// El perfil y el usuario que contesta el arnés. No se pintan (el bypass trae
// PERFIL_DEV y la sesión simulada de `contextoCap` trae el suyo): solo cierran
// la cascada si alguien pregunta.
export const PERFIL_ARNES = Object.freeze({ id: '0ca90000-0000-4000-8000-0000000a7e50', username: 'Jugador_ARNES' })

// ── ECO-1b · la billetera que sirve el arnés ────────────────────────────────
// Desde la 1b la app lee su saldo de `mi_billetera()`. Contra `vite preview`
// (sesión simulada) la app usa la API real y quien contesta es el arnés: 5.000,
// la cifra con la que nacieron las varas, para que ninguna se mueva. El modo
// `saldo` de diagDSK sirve otra (3.700) para que una constante no pueda pasar.
export const SALDO_ARNES = 5000

/**
 * Lo que contesta el arnés a una RPC. `mi_billetera` → el saldo; el resto →
 * `null` con 200: así `mesaOpcional` da «no hay» sin avisar (un cuerpo de
 * error haría que `traducir` escribiera un SAL-A en la consola).
 * Es la respuesta común de las TRES rutas que imitan a Supabase: la de
 * `comun.mjs`, `contextoCap` y `contextoBie`.
 *
 * ECO-1c · con `banco` (uno por contexto de navegador), el saldo es el del
 * banco y las seis funciones de mesa (`sentarse_ia`…`recoger_mesa_ia`) las
 * contesta él con `params` (el cuerpo JSON de la petición): una partida en
 * `vite preview` mueve dinero de verdad contra el contrato de la 1c.
 */
export function respuestaRpc(pathname, { saldo = SALDO_ARNES, banco = null, params = null } = {}) {
  const nombre = pathname.slice('/rest/v1/rpc/'.length)
  if (banco) {
    if (nombre === 'mi_billetera') return banco.saldo
    return banco.llamar(nombre, params ?? {})
  }
  if (nombre === 'mi_billetera') return saldo
  return null
}

/**
 * Lo que contesta el arnés a una petición a Supabase: lo mismo que `contextoCap`.
 */
export function respuestaSupabase(pathname, accept = '', perfil = PERFIL_ARNES, opciones = {}) {
  if (pathname.startsWith('/rest/v1/profiles')) return accept.includes('vnd.pgrst.object') ? perfil : [perfil]
  if (pathname.startsWith('/rest/v1/rpc/')) return respuestaRpc(pathname, opciones)
  if (pathname.startsWith('/auth/v1/user')) return { id: perfil.id, aud: 'authenticated', role: 'authenticated' }
  return []
}

/** ¿Este fallo de petición lo provocó un corte del propio arnés? */
export const corteDelArnes = (errorText) => /ERR_BLOCKED_BY_CLIENT|ERR_FAILED|ERR_ABORTED/.test(String(errorText || ''))

/**
 * El veredicto del aislamiento de una corrida. Lo que manda son las
 * ESCAPADAS: respuestas que llegaron de un servidor no local (las contestadas
 * por el arnés no tienen dirección de servidor), fallos de red que no fueron un
 * corte del arnés y sockets no locales que nadie desvió. Una sola es un error de
 * INSTRUMENTO (código 2): la medida dejó de hacerse en las condiciones que dice.
 * Las peticiones cortadas («fuera») se informan; quien las juzga es su modo
 * (`cap.red`, `bie.s0`).
 */
export function veredictoAislamiento(red) {
  if (!red || !Array.isArray(red.escapadas)) return 'error'
  return red.escapadas.length === 0 ? 'verde' : 'error'
}
