// ── arnes/orquestaCore.mjs · ARN-4 A4 · la lista de varas, y lo puro ─────────
// Rector: AJILEI_ARN-4_Tanda4a_v1.0.md §4. LA LISTA ES EL CONTRATO: `orquesta.test.js`
// compara los perfiles con `MODOS_DSK` y `MODOS_PUE`, y un modo que nadie declara,
// o que se excluye sin motivo escrito, sale rojo. Sin procesos ni archivos.
import { codigoDeSalida } from './nucleo.mjs'

const MINUTOS = 60_000
const VITEST = ['scripts/arnes/vitest.mjs', 'run', 'scripts/', 'src/']

/** Una vara de un `diag*`: `necesitaDist` pide el build previo; `--sin-build` va siempre. */
const diag = (arnes, id, modo, topeMin, extra = []) => ({
  id,
  args: [`scripts/${arnes}.mjs`, modo, ...extra, '--sin-build'],
  topeMin,
  necesitaDist: true,
})

// ── Las varas ────────────────────────────────────────────────────────────────
// `tipo` dice cómo se lee el resultado; sin él, por su código de salida. Todos los
// topes quedan por debajo de los 30 min de las tareas de Bash (A4).
const BASE = Object.freeze([
  { id: 'eslint', tipo: 'eslint', args: ['node_modules/eslint/bin/eslint.js', '.', '-f', 'json'], topeMin: 5 }, // `orquesta.mjs` añade `-o`
  { id: 'vitest', tipo: 'vitest', args: VITEST, topeMin: 10 },
  { id: 'build', tipo: 'build', args: ['node_modules/vite/bin/vite.js', 'build'], topeMin: 5 },
  { id: 'guiones', args: ['scripts/guiones.mjs'], topeMin: 5 },
])

const HUMO = diag('diagDSK', 'humo', 'humo', 25)

// `apu` entera tarda 40–45 min: va por celdas, con REC-2 y VOZ-3 aparte.
// `orquesta.test.js` las compara con `APU_VIEWPORTS`: una celda que no existe no
// mediría nada y saldría verde.
export const CELDAS_APU = Object.freeze(['360x640', '640x360', '844x390', '1024x768', '1280x720', '1366x768', '1920x937'])
const APU = [...CELDAS_APU, 'rec2', 'voz3'].map((c) => diag('diagDSK', `apu.${c}`, 'apu', 20, [c]))

// ARN-4d · un modo que no cabe en una tirada va por mesas, con su propio tope:
// `m1`, `a1`, `h1` y `tactil` miden 35, 28, 28 y 22 min, y con 1,5 × lo medido
// pasarían de los 30. `orquesta.test.js` las compara con las mesas del arnés.
export const MESAS_PARTIDAS = Object.freeze([5, 4, 3, 2])
const porMesas = (modo, topeMin) => MESAS_PARTIDAS.map((m) => diag('diagDSK', `${modo}.${m}`, modo, topeMin, [String(m)]))
const PARTIDOS = [...porMesas('tactil', 15), ...porMesas('h1', 15), ...porMesas('m1', 20), ...porMesas('a1', 20)]

// `tab` entera roza el tope (27 min): `frase` por un lado, las otras nueve por otro.
const TAB = [
  diag('diagDSK', 'tab.frase', 'tab', 20, ['frase']),
  diag('diagDSK', 'tab.resto', 'tab', 25, ['cel', 'tv', 'h', 'vuelo', 'fuera', 'giro', 'borde', 'hb', 'frontera']),
]

/** Modos de `diagDSK` que corren solos en `completo`, con su tope en minutos. */
const SUELTOS_DSK = Object.freeze({
  // ARN-4d · `f1`, `a2` y `u1` a ≥ 1,5 × lo medido en la línea base; `vuelo` no se
  // puede partir (busca una victoria, hasta 40 manos) y va a su techo.
  b1: 15, p1: 15, p2: 15, r1: 15, r2: 15, o1: 15, f1: 25, z1: 15, o2: 15, a2: 22, u1: 23,
  'menu-movil': 15, u2: 15, u3: 15, vc: 15, msg: 25, tapetes: 15, vuelo: 29, luz: 29, rev: 15, rec: 25, congelado: 15,
  saldo: 15, mesaia: 15, revive: 15, constancia: 15, video: 15, tam: 15, webkit: 20,
})

/** Modos de `diagPUE` en `completo`. `todo` lleva dentro lo que no entra por su nombre. */
const SUELTOS_PUE = Object.freeze({ todo: 25, cap: 15, voz2: 15, mesa: 15 })

// ARN-4 A10a · la Portada bajo su tinta. Desde la 4c, un texto bajo 4,5 es rojo.
const PUE_CONTRASTE = diag('diagPUE', 'pue.contraste', 'contraste', 10)

// ARN-4d · el camino crítico de INV-30, sin navegador: va en `commit`. Lo que cruza
// el techo se ve en cada commit, no en una corrida de `completo` (`diagPUE 1.8`).
const PESO = { id: '1.8b', args: ['scripts/arnes/peso.mjs', '--sin-build'], topeMin: 5, necesitaDist: true }

const OTRAS = Object.freeze([
  diag('diagCEL0', 'celebracion', 'celebracion', 20),
  diag('diagSAL', 'sal', 'sal', 15),
  { id: 'banco', args: ['scripts/bancoVerificar.mjs'], topeMin: 20 },
])

// ── Lo que no corre por su nombre, con su motivo escrito ─────────────────────
const EN_HUMO = 'corre dentro de `humo`'
const EN_TODO = 'corre dentro de `diagPUE todo`'
export const EXCLUIDOS_DSK = Object.freeze({
  d1d2: EN_HUMO, d3: EN_HUMO, bug: EN_HUMO, shots: EN_HUMO, gate: EN_HUMO, lob: EN_HUMO,
  retar: EN_HUMO, rnk: EN_HUMO, suma: EN_HUMO, cfg: EN_HUMO, tienda: EN_HUMO,
  apu: 'corre partida por celdas: `apu.<celda>`, `apu.rec2` y `apu.voz3`',
  tab: 'corre partida en dos: `tab.frase` y `tab.resto`',
  tactil: 'corre partida por mesas: `tactil.<mesa>`',
  h1: 'corre partida por mesas: `h1.<mesa>`',
  m1: 'corre partida por mesas: `m1.<mesa>`',
  a1: 'corre partida por mesas: `a1.<mesa>`',
})
export const EXCLUIDOS_PUE = Object.freeze({
  puerta: EN_TODO, '1.1': EN_TODO, '1.2': EN_TODO, '1.3': EN_TODO, '1.4': EN_TODO, '1.5': EN_TODO, '1.6': EN_TODO, '1.7': EN_TODO, '1.8': EN_TODO, '1.9': EN_TODO,
  '2.4': EN_TODO, '2.5': EN_TODO, mon: EN_TODO, dis: EN_TODO, bie: EN_TODO,
})

/** Los modos de `diagPUE`, leídos de su guarda de «modo desconocido», como `testInvariantes`. */
export const modosPueDe = (texto) => [...(String(texto).match(/const MODOS_PUE = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])

// ── Las manuales: se listan y no se corren ───────────────────────────────────
export const MANUALES = Object.freeze([
  { id: 'guiones en la base real', motivo: 'SQL Editor de Victor, tras cada db push' },
])

// ── Los perfiles ─────────────────────────────────────────────────────────────
const sueltos = (arnes, mapa) => Object.entries(mapa).map(([m, tope]) => diag(arnes, m, m, tope))

export const PERFILES = Object.freeze({
  rapido: [...BASE],
  commit: [...BASE, PESO, HUMO],
  completo: [...BASE, PESO, HUMO, ...sueltos('diagDSK', SUELTOS_DSK), ...PARTIDOS, ...APU, ...TAB, ...sueltos('diagPUE', SUELTOS_PUE), PUE_CONTRASTE, ...OTRAS],
})

const unica = (lista) => [...new Map(lista.map((v) => [v.id, v])).values()]
const BUILD = BASE.find((v) => v.id === 'build')

/**
 * Las varas de un `--solo`, en el orden pedido. Vale un id de vara, un modo de
 * `diagDSK` o `diagPUE` aunque corra dentro de otro (`lob`, `1.8`), y un grupo
 * (`apu`, `tab`). Con alguna que mida `dist/`, el único build va delante; `sin-build`
 * lo quita. Un nombre que no existe es un error de instrumento: devuelve `desconocidos`.
 */
export function varasDeSolo(nombres, { modosDsk, modosPue, build = true }) {
  const todas = PERFILES.completo
  const varas = []
  const desconocidos = []
  for (const n of nombres) {
    const exacta = todas.find((v) => v.id === n)
    const grupo = todas.filter((v) => v.id.startsWith(`${n}.`))
    if (exacta) varas.push(exacta)
    else if (grupo.length) varas.push(...grupo)
    else if (modosDsk.includes(n)) varas.push(diag('diagDSK', n, n, 25))
    else if (modosPue.includes(n)) varas.push(diag('diagPUE', n, n, 25))
    else desconocidos.push(n)
  }
  const pide = build && varas.some((v) => v.necesitaDist) && !varas.some((v) => v.id === 'build')
  return { varas: unica(pide ? [BUILD, ...varas] : varas), desconocidos }
}

// ── El veredicto de cada vara ────────────────────────────────────────────────
// ARN-4d · una vara cortada no reescribe su JSON: la línea base dejó seis verdes de
// octubre pasando por actuales. Antes de lanzarla, lo que hubiera se marca caducado.
const DIR_DIAG = { diagDSK: 'capturas-dsk', diagSAL: 'capturas-sal' }

/**
 * Dónde deja una vara su veredicto. `comun` es lo que escribe el arnés; `propio`,
 * adonde se copia si ese archivo lo comparten varias varas (las partes de un modo y
 * los modos de `diagPUE`), para que la siguiente no se lo lleve por delante.
 * Sin JSON, `null`: `eslint`, `vitest`, `build`, `guiones`, `1.8b` y `banco`.
 */
export function veredictoDeVara(vara) {
  const arnes = vara.args[0].match(/^scripts\/(diag\w+)\.mjs$/)?.[1]
  const modo = vara.args[1]
  if (arnes === 'diagPUE') return { comun: 'capturas-pue/diagPUE.json', propio: `capturas-pue/diag_${vara.id}.json` }
  if (arnes === 'diagCEL0') return { comun: '../_cel2/cel0.json', propio: null }
  if (!DIR_DIAG[arnes]) return null
  const dir = DIR_DIAG[arnes]
  return { comun: `${dir}/diag_${modo}.json`, propio: vara.id === modo ? null : `${dir}/diag_${vara.id}.json` }
}

/** Cuántos ms puede tardar una vara. */
export const topeMs = (vara) => vara.topeMin * MINUTOS

// ── El contrato ──────────────────────────────────────────────────────────────
/**
 * Lo que está mal entre una lista de modos, lo que corre y lo excluido. `corren` son
 * los modos con vara propia. Vacío = la lista cumple.
 */
export function contratoDeModos(modos, corren, excluidos) {
  const problemas = []
  for (const m of modos) {
    const corre = corren.includes(m)
    const motivo = excluidos[m]
    if (!corre && !motivo) problemas.push(`${m}: nadie lo declara, y sin motivo escrito no se puede excluir`)
    if (corre && motivo) problemas.push(`${m}: corre y a la vez está excluido`)
  }
  for (const m of [...corren, ...Object.keys(excluidos)]) {
    if (!modos.includes(m)) problemas.push(`${m}: declarado aquí, y su arnés ya no lo tiene`)
  }
  return problemas
}

/** Los modos de `arnes` con vara propia en un perfil. */
export function modosQueCorren(perfil, arnes) {
  const guion = `scripts/${arnes}.mjs`
  return [...new Set(perfil.filter((v) => v.args[0] === guion && v.args.filter((a) => a !== '--sin-build').length === 2).map((v) => v.args[1]))]
}

// ── El resultado ─────────────────────────────────────────────────────────────
/** El código de una vara leído por su código de salida: lo que no sea 0 ni 1 es instrumento. */
export const codigoDeVara = (status) => (status === 0 || status === 1 ? status : 2)

/** El código global de las filas corridas. Las manuales no cuentan; ninguna corrida es un 2. */
export function codigoGlobal(filas) {
  const v = filas.filter((f) => !f.manual).map((f) => ['verde', 'rojo', 'error'][f.codigo] ?? 'error')
  return codigoDeSalida(v)
}

const duracion = (ms) => {
  if (ms === null || ms === undefined) return '—'
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
}

/** La tabla de salida: vara, código, duración, tope y archivo, con las manuales al final. */
export function tablaDeVaras(filas) {
  const celdas = filas.map((f) => [
    f.id,
    f.manual ? 'manual' : String(f.codigo),
    duracion(f.ms),
    f.tope ? `${f.tope} min` : '—',
    f.manual ? f.motivo : `${f.nota ? `${f.nota} · ` : ''}${f.archivo ?? '—'}`,
  ])
  const cabecera = ['Vara', 'Código', 'Duración', 'Tope', 'Salida']
  const anchos = cabecera.map((c, i) => Math.max(c.length, ...celdas.map((f) => f[i].length)))
  const linea = (f) => f.map((c, i) => (i === f.length - 1 ? c : c.padEnd(anchos[i]))).join(' | ')
  return [linea(cabecera), anchos.map((a) => '-'.repeat(a)).join('-|-'), ...celdas.map(linea)].join('\n')
}
