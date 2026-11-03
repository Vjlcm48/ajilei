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

// `tab` entera roza el tope (27 min): `frase` por un lado, las otras nueve por otro.
const TAB = [
  diag('diagDSK', 'tab.frase', 'tab', 20, ['frase']),
  diag('diagDSK', 'tab.resto', 'tab', 25, ['cel', 'tv', 'h', 'vuelo', 'fuera', 'giro', 'borde', 'hb', 'frontera']),
]

/** Modos de `diagDSK` que corren solos en `completo`, con su tope en minutos. */
const SUELTOS_DSK = Object.freeze({
  b1: 15, tactil: 15, p1: 15, p2: 15, r1: 15, r2: 15, o1: 15, h1: 15, m1: 15, a1: 15, f1: 15, z1: 15, o2: 15, a2: 15, u1: 15,
  'menu-movil': 15, u2: 15, u3: 15, vc: 15, msg: 25, tapetes: 15, vuelo: 15, luz: 29, rev: 15, rec: 25, congelado: 15,
  saldo: 15, mesaia: 15, revive: 15, constancia: 15, video: 15, tam: 15, webkit: 20,
})

/** Modos de `diagPUE` en `completo`. `todo` lleva dentro lo que no entra por su nombre. */
const SUELTOS_PUE = Object.freeze({ todo: 25, cap: 15, voz2: 15, mesa: 15 })

// ARN-4 A10a · la Portada bajo su tinta. Desde la 4c, un texto bajo 4,5 es rojo.
const PUE_CONTRASTE = diag('diagPUE', 'pue.contraste', 'contraste', 10)

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
  commit: [...BASE, HUMO],
  completo: [...BASE, HUMO, ...sueltos('diagDSK', SUELTOS_DSK), ...APU, ...TAB, ...sueltos('diagPUE', SUELTOS_PUE), PUE_CONTRASTE, ...OTRAS],
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

/** La tabla de salida: vara, código, duración y archivo, con las manuales al final. */
export function tablaDeVaras(filas) {
  const celdas = filas.map((f) => [
    f.id,
    f.manual ? 'manual' : String(f.codigo),
    duracion(f.ms),
    f.manual ? f.motivo : `${f.nota ? `${f.nota} · ` : ''}${f.archivo ?? '—'}`,
  ])
  const cabecera = ['Vara', 'Código', 'Duración', 'Salida']
  const anchos = cabecera.map((c, i) => Math.max(c.length, ...celdas.map((f) => f[i].length)))
  const linea = (f) => f.map((c, i) => (i === f.length - 1 ? c : c.padEnd(anchos[i]))).join(' | ')
  return [linea(cabecera), anchos.map((a) => '-'.repeat(a)).join('-|-'), ...celdas.map(linea)].join('\n')
}
