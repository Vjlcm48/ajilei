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
 * 'informativo' o 'error'. Un solo error manda (2); si no, un solo rojo (1);
 * si no, 0. Una lista VACÍA es un error: un arnés que no midió nada no puede
 * salir verde (D4 de la Fase 0: un skip silencioso no es un verde).
 */
export function codigoDeSalida(veredictos) {
  if (!Array.isArray(veredictos) || veredictos.length === 0) return CODIGO.INSTRUMENTO
  if (veredictos.some((v) => v !== 'verde' && v !== 'rojo' && v !== 'informativo')) return CODIGO.INSTRUMENTO
  if (veredictos.includes('rojo')) return CODIGO.ROJO
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
const PORCELDA = (d) => Array.isArray(d) ? (d.length ? TODAS(d, (c) => c.passed === true) : 'vacio') : 'rojo'
const ARRIBA = (campo) => (d) => (d && typeof d === 'object' && campo in d) ? (d[campo] === true ? 'verde' : 'rojo') : 'rojo'
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
  // `matrixOk`
  gate: ARRIBA('matrixOk'),
  // booleanos por celda (diagnósticos de DSK que nunca juntaron un `passed`)
  p1: BOOLEANOS(['allBadgesLetters', 'scoreHidden', 'noShift']),
  p2: BOOLEANOS(['chipOk', 'saldoHiddenResting', 'fichasAbsent', 'cycleOk', 'worst7Ok', 'noShift', 'overflowOk']),
  tactil: BOOLEANOS(['allInteractiveOk', 'multNoOverlap']),
})

/** Modos válidos de `diagDSK` (el argumento) y la clave con que vuelven en el informe. */
export const MODOS_DSK = Object.freeze([
  'all', 'd1d2', 'd3', 'bug', 'shots', 'gate', 'lob', 'retar', 'apu', 'b1', 'tactil', 'p1', 'p2',
  'r1', 'r2', 'o1', 'h1', 'm1', 'a1', 'f1', 'z1', 'o2', 'a2', 'u1', 'menu-movil', 'u2', 'u3',
  'vc', 'msg', 'tapetes', 'vuelo', 'luz', 'rev', 'rec',
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
