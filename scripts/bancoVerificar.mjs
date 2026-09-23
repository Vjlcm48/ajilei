// ── bancoVerificar.mjs · CORRER EL BANCO COMO SE SELLÓ ──────────────────────
// APU-1 · ficha de commits C-0.2. Se invoca `npm run banco:verificar`.
//
// ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
// La vara de bandas (`scripts/apu1_bandas.json`) sólo dice la verdad si se la
// interroga con la MISMA forma con que se selló. Eso son cinco cosas a la vez
// —la lista de mesas y conductores, el nivel, `--unit`, `--seed` y el número de
// manos— y hasta hoy vivían en la memoria de quien escribía el comando:
//
//   · E-24 · una corrida a la entrada por defecto (`--unit 50`) contra celdas
//     selladas a 100 salía ROJA por veinte sigmas sin que el producto hubiera
//     cambiado. La misma pila son 100 apuestas de profundidad o 50, y eso es
//     otro juego.
//   · E-27 · la corriente de azar es ÚNICA para toda la matriz, así que una
//     celda sólo se reproduce repitiendo la MISMA lista de mesas y conductores.
//     Correr «la matriz entera» para comprobar una celda suelta no la reproduce.
//
// La forma no hay que recordarla: está ESCRITA en la vara. Cada celda dice de
// qué volcado salió (`origen`), con qué apuesta de mesa (`unit`) y con qué
// semilla (`siembra`) — las dos últimas desde el back-fill de C-0.3. Este guion
// reconstruye una corrida por volcado de origen, la lanza con `--bandas` y
// recoge el veredicto de E-26 tal cual lo imprime el banco. No interpreta: el
// que juzga sigue siendo el lector de 1e-iv.
//
// ── LO QUE NO HACE ─────────────────────────────────────────────────────────
// No sella, no reescribe la vara y no toca `src/`. Si una forma sale roja, la
// decisión de re-sellar es de quien manda la tanda, no de este guion.
//
// Uso:
//   npm run banco:verificar                  → todas las formas de la vara
//   npm run banco:verificar -- --listar      → sólo enumera las formas
//   npm run banco:verificar -- --forma m5_pro_manoso   → las que casen
//   npm run banco:verificar -- --vara <ruta> → otra vara (la de usar y tirar)
//
// Salida: una línea por forma con su veredicto, y un total. Código de salida
// 0 sólo si TODAS las formas salen verdes y comparables; 1 si alguna es roja o
// incomparable; 2 si no había nada que comparar (una vara que no mide nada no
// es verde, es nada — D-16 de 1b).
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const BANCO = join(RAIZ, 'scripts', 'bancoNiveles.mjs')

const argv = process.argv.slice(2)
const arg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d
}
const flag = (n) => argv.includes(`--${n}`)

const RUTA_VARA = arg('vara', 'scripts/apu1_bandas.json')
const FILTRO = arg('forma')

let vara
try { vara = JSON.parse(readFileSync(join(RAIZ, RUTA_VARA), 'utf8')) } catch (e) {
  console.error(`No se pudo leer la vara ${RUTA_VARA}: ${e.message}`)
  process.exit(2)
}

// ── De las celdas selladas a las FORMAS que las produjeron ──────────────────
// Una forma es un volcado de origen: la corrida que se lanzó aquel día. Se
// agrupan por `origen` porque es lo único que garantiza repetir la misma
// corriente de azar (E-27); agrupar por mesa o por nivel produciría corridas
// que no reproducen nada.
//
// El número de manos sale de la CLAVE (`|n=100000`) y no de `manosContadas`:
// aquél es lo que se pidió —que es lo que hay que volver a pedir— y éste lo que
// salió, que trae el sobrante de la última partida.
function formaDe(celdas) {
  const manos = new Set(), mesas = new Set(), conductores = new Set()
  const niveles = new Set(), units = new Set(), siembras = new Set(), entradas = new Set()
  const duelos = new Set()
  for (const c of celdas) {
    const m = /\|n=(\d+)/.exec(c.clave)
    manos.add(m ? Number(m[1]) : null)
    mesas.add(c.mesa); conductores.add(c.conductor); niveles.add(c.nivel)
    units.add(c.unit ?? null); siembras.add(c.siembra ?? null)
    entradas.add(c.entrada ?? null)
    // Una celda de espejo cuyo asiento 0 lleva OTRO nivel es un duelo, y el
    // duelo se pide por bandera: sin ella esa celda no existe en la corrida.
    if (c.conductor === 'espejo' && c.nivelAsiento0 !== c.nivel) duelos.add(c.nivelAsiento0)
  }
  const uno = (s, campo) => {
    if (s.size !== 1) return { error: `la forma mezcla ${s.size} valores de ${campo}: ${[...s].join(', ')}` }
    return { valor: [...s][0] }
  }
  const n = uno(manos, 'manos'), niv = uno(niveles, 'nivel')
  const u = uno(units, 'unit'), s = uno(siembras, 'siembra'), e = uno(entradas, 'entrada')
  const error = [n, niv, u, s, e].find(x => x.error)?.error ?? null
  return {
    error,
    manos: n.valor, nivel: niv.valor, unit: u.valor, siembra: s.valor, entrada: e.valor,
    mesas: [...mesas].sort((a, b) => a - b), conductores: [...conductores].sort(),
    duelos: [...duelos].sort(),
  }
}

const porOrigen = new Map()
for (const c of vara.celdas) {
  if (!porOrigen.has(c.origen)) porOrigen.set(c.origen, [])
  porOrigen.get(c.origen).push(c)
}

const formas = []
for (const [origen, celdas] of porOrigen) {
  if (FILTRO && !origen.includes(FILTRO)) continue
  formas.push({ origen, celdas, ...formaDe(celdas) })
}

// ── El comando, reconstruido ───────────────────────────────────────────────
// Sólo se pasa `--mesa` y `--j0` cuando la forma tiene UNA; con varias se deja
// que el banco corra su lista completa, que es lo que hizo aquel día.
function comandoDe(f, i) {
  const a = ['--nivel', f.nivel, '--manos', String(f.manos), '--sinReloj', '--tanda', 'VERIF']
  if (f.mesas.length === 1) a.push('--mesa', String(f.mesas[0]))
  if (f.conductores.length === 1) a.push('--j0', f.conductores[0])
  if (f.unit !== null) a.push('--unit', String(f.unit))
  if (f.siembra !== null) a.push('--seed', String(f.siembra))
  if (f.entrada !== null) a.push('--entrada', String(f.entrada))
  if (f.duelos.length) a.push('--duelo', f.duelos.join(','))
  a.push('--bandas', '--vara-bandas', RUTA_VARA, '--volcado', `_verif_${i}.json`)
  return a
}

if (flag('listar')) {
  console.log(`${formas.length} forma(s) en ${RUTA_VARA} (${vara.celdas.length} celdas)`)
  for (const [i, f] of formas.entries()) {
    console.log(`  ${String(i).padStart(3)} ${f.origen}`)
    console.log(`      ${f.error ?? `${f.celdas.length} celda(s) · ` + comandoDe(f, i).join(' ')}`)
  }
  process.exit(0)
}

try { mkdirSync(join(RAIZ, 'capturas-dsk'), { recursive: true }) } catch { /* ya existe */ }

// El banco sale con código 1 (roja) o 2 (sin comparar) A PROPÓSITO: aquí
// interesa lo que imprime, así que el estado se recoge y no se lanza.
function correr(args) {
  try { return { salida: execFileSync('node', [BANCO, ...args], { encoding: 'utf8', cwd: RAIZ }), codigo: 0 } }
  catch (e) { return { salida: (e.stdout ?? '') + (e.stderr ?? ''), codigo: e.status ?? 1 } }
}

// La línea de E-26 es la ÚLTIMA del bloque de bandas y se lee entera: dice
// cuántas comparables pasaron, cuántas son rojas y cuántas no se pudieron
// comparar, cada cosa con su nombre. Se copia tal cual; este guion no resume.
function veredictoDe(salida) {
  const l = salida.split('\n').map(s => s.trim()).filter(s => /^(INCOMPARABLE · )?VERDE \d+\/\d+ comparables/.test(s))
  return l.length ? l[l.length - 1] : null
}

const cuenta = { formas: 0, comparadas: 0, rojas: 0, otraEntrada: 0, otroMotor: 0, sinVara: 0, sinVeredicto: 0 }
const filas = []
console.log(`banco:verificar · ${formas.length} forma(s) de ${RUTA_VARA}\n`)
for (const [i, f] of formas.entries()) {
  const etiqueta = f.origen.replace(/^capturas-dsk\//, '')
  if (f.error) {
    console.log(`  SIN FORMA  ${etiqueta.padEnd(38)} ${f.error}`)
    cuenta.sinVeredicto++
    filas.push({ origen: f.origen, error: f.error })
    continue
  }
  const { salida, codigo } = correr(comandoDe(f, i))
  const v = veredictoDe(salida)
  cuenta.formas++
  if (!v) {
    console.log(`  SIN VEREDICTO ${etiqueta.padEnd(35)} (código ${codigo})`)
    cuenta.sinVeredicto++
    filas.push({ origen: f.origen, codigo, veredicto: null })
    continue
  }
  const num = (re) => Number(re.exec(v)?.[1] ?? 0)
  const comparables = num(/VERDE (\d+)\//)
  const rojas = num(/ROJA (\d+)/)
  cuenta.comparadas += num(/VERDE \d+\/(\d+)/)
  cuenta.rojas += rojas
  cuenta.otraEntrada += num(/OTRA ENTRADA (\d+)/)
  cuenta.otroMotor += num(/OTRO MOTOR (\d+)/)
  cuenta.sinVara += num(/SIN VARA (\d+)/)
  const sello = rojas === 0 && !v.startsWith('INCOMPARABLE') ? 'VERDE' : (rojas ? 'ROJA ' : 'INCOMP')
  console.log(`  ${sello.padEnd(7)} ${etiqueta.padEnd(38)} ${v}`)
  // La peor sigma de la forma, que es lo que se mira cuando algo se mueve.
  const peor = [...salida.matchAll(/peor: \w+ (-?\d+\.\d+)s/g)].map(m => Math.abs(Number(m[1])))
  filas.push({ origen: f.origen, veredicto: v, comparables, rojas, peorSigma: peor.length ? Math.max(...peor) : null })
}

const peorGlobal = filas.map(f => f.peorSigma).filter(x => x !== null)
console.log(`\n── total · ${cuenta.formas} forma(s) · ${cuenta.comparadas} celda(s) comparada(s)` +
  ` · ROJA ${cuenta.rojas} · OTRA ENTRADA ${cuenta.otraEntrada} · OTRO MOTOR ${cuenta.otroMotor}` +
  ` · SIN VARA ${cuenta.sinVara}` + (cuenta.sinVeredicto ? ` · SIN VEREDICTO ${cuenta.sinVeredicto}` : '') +
  (peorGlobal.length ? ` · peor ${Math.max(...peorGlobal).toFixed(2)}s` : ''))

const incomparables = cuenta.otraEntrada + cuenta.otroMotor + cuenta.sinVara + cuenta.sinVeredicto
if (cuenta.comparadas === 0) {
  console.log('   SIN COMPARAR: ninguna celda de la vara se pudo reproducir. Una vara que no mide nada no es verde.')
  process.exit(2)
}
console.log(`   ${cuenta.rojas === 0 && incomparables === 0 ? 'VERDE' : 'NO VERDE'}: ` +
  `${cuenta.comparadas - cuenta.rojas}/${cuenta.comparadas} celdas comparadas pasan` +
  (incomparables ? `, y ${incomparables} no se pudieron comparar` : ''))
process.exit(cuenta.rojas === 0 && incomparables === 0 ? 0 : 1)
