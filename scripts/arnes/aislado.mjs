// ── arnes/aislado.mjs · ARN-4 A2, A3 y A11 · probar commits aislados ─────────
// Rector: AJILEI_ARN-4_Tanda4a_v1.0.md §3. Se invoca `npm run aislado`:
//
//   npm run aislado -- <sha> [<sha>…] [--perfil=rapido|commit] [--dejar] [--carpeta=<dir>]
//   npm run aislado -- --limpiar=<ruta>
//
// Por cada SHA: `git worktree add --detach` fuera de OneDrive → unión de
// `node_modules` → copia de `.env.local` y de los 75 volcados de `capturas-dsk/`,
// que git no rastrea y sin los que `testBancoBandas` omite una prueba (A11) →
// `vite build`, que vitest ya no necesita pero separa «no compila» de «no pasa» →
// vitest por el lanzador del árbol principal → eslint contra la firma de la base →
// con `commit`, además `diagDSK humo --sin-build` → la limpieza de A2, en un
// `finally` y también ante Ctrl+C.
//
// `--dejar` conserva la copia solo si sale ROJA, para mirarla. Sigue enlazada al
// `node_modules` real: se quita SIEMPRE con `--limpiar=<ruta>`, nunca a mano.
//
// Códigos: 0 = todo verde · 1 = algún rojo · 2 = error de instrumento.
import { execFileSync } from 'node:child_process'
import {
  closeSync, copyFileSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, symlinkSync, writeSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import {
  analizarWorktrees, codigoVitest, correr, leerEslint, limpiarCopia, resumenVitest, rutaDeCopia, textoVitest, veredictoCopia,
} from './aisladoCore.mjs'
import { RAIZ as RAIZ_FUENTE } from './fuente.mjs'
import { codigoDeSalida } from './nucleo.mjs'
import { corregirUnidad } from './unidad.mjs'

const RAIZ = corregirUnidad(resolve(RAIZ_FUENTE))
const MINUTO = 60_000
const git = (...args) => execFileSync('git', ['-C', RAIZ, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

function fallar(mensaje) {
  console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): ${mensaje}`)
  process.exit(2)
}

function leerArgumentos(argv) {
  const opc = { perfil: 'rapido', dejar: false, carpeta: tmpdir(), limpiar: null, shas: [] }
  for (const a of argv) {
    if (a.startsWith('--perfil=')) opc.perfil = a.slice('--perfil='.length)
    else if (a === '--dejar') opc.dejar = true
    else if (a.startsWith('--carpeta=')) opc.carpeta = resolve(a.slice('--carpeta='.length))
    else if (a.startsWith('--limpiar=')) opc.limpiar = resolve(a.slice('--limpiar='.length))
    else if (a.startsWith('--')) fallar(`opción desconocida: ${a}`)
    else opc.shas.push(a)
  }
  if (opc.perfil !== 'rapido' && opc.perfil !== 'commit') fallar(`--perfil=${opc.perfil}: valen «rapido» y «commit»`)
  if (!opc.limpiar && !opc.shas.length) fallar('falta al menos un SHA. Uso: npm run aislado -- <sha> [<sha>…] [--perfil=rapido|commit] [--dejar]')
  return opc
}

const ms = (n) => `${(n / 1000).toFixed(1).replace('.', ',')} s`

/** Las rutas de los volcados, leídas del índice comprometido que usa la propia prueba. */
const volcados = () => Object.keys(JSON.parse(readFileSync(join(RAIZ, 'scripts/apu1_bandas_origen.json'), 'utf8')).volcados)

function prepararCopia(sha, ruta) {
  mkdirSync(dirname(ruta), { recursive: true })
  git('worktree', 'add', '--detach', ruta, sha)
  const real = analizarWorktrees(git('worktree', 'list', '--porcelain')).find((c) => basename(c.ruta) === basename(ruta))?.ruta
  if (!real) throw new Error(`git worktree list no enseña ${ruta}`)
  const copia = corregirUnidad(resolve(real))
  symlinkSync(join(RAIZ, 'node_modules'), join(copia, 'node_modules'), 'junction')
  if (existsSync(join(RAIZ, '.env.local'))) copyFileSync(join(RAIZ, '.env.local'), join(copia, '.env.local'))
  for (const v of volcados()) {
    if (!existsSync(join(RAIZ, v))) continue
    mkdirSync(dirname(join(copia, v)), { recursive: true })
    copyFileSync(join(RAIZ, v), join(copia, v))
  }
  return copia
}

/** Corre un paso, lo apunta en el registro y devuelve también lo que escribió. */
async function paso(fd, titulo, args, { cwd, topeMs }) {
  writeSync(fd, `\n── ${titulo} ──\n`)
  const desde = fstatSync(fd).size
  const r = await correr(args, { cwd, fd, topeMs })
  const hasta = fstatSync(fd).size
  const buf = Buffer.alloc(hasta - desde)
  readSync(fd, buf, 0, buf.length, desde)
  writeSync(fd, `\n── ${titulo}: ${r.topado ? 'TOPE' : `código ${r.status}`}, ${ms(r.ms)} ──\n`)
  return { ...r, texto: buf.toString('utf8') }
}

/** Una copia entera. Devuelve el veredicto y la línea de salida; la limpieza es de quien llama. */
async function probarCopia(sha, copia, perfil, fd, base) {
  const nm = (...p) => join(copia, 'node_modules', ...p)
  const pasos = {}
  const notas = []

  const build = await paso(fd, 'vite build', [nm('vite', 'bin', 'vite.js'), 'build'], { cwd: copia, topeMs: 5 * MINUTO })
  pasos.build = build.status === 0 ? 0 : build.status === 1 ? 1 : 2
  if (pasos.build) notas.push('NO COMPILA')

  const vt = await paso(fd, 'vitest', [join(RAIZ, 'scripts/arnes/vitest.mjs'), 'run', 'scripts/', 'src/'], { cwd: copia, topeMs: 10 * MINUTO })
  const resumen = resumenVitest(vt.texto)
  pasos.vitest = codigoVitest(vt.status, resumen)
  notas.push(textoVitest(resumen))

  const salidaEslint = join(base, `${sha.slice(0, 7)}.eslint.json`)
  const es = await paso(fd, 'eslint', [nm('eslint', 'bin', 'eslint.js'), '.', '-f', 'json', '-o', salidaEslint], { cwd: copia, topeMs: 5 * MINUTO })
  const lectura = leerEslint(es.status, existsSync(salidaEslint) ? readFileSync(salidaEslint, 'utf8') : '', copia)
  pasos.eslint = lectura.codigo
  notas.push(lectura.texto)

  if (perfil === 'commit') {
    // PES-1 §3-G · el peso, antes que el humo: es lo que un commit puede romper sin
    // que nada más se entere.
    const peso = await paso(fd, '1.8b', ['scripts/arnes/peso.mjs', '--sin-build'], { cwd: copia, topeMs: 5 * MINUTO })
    pasos.peso = peso.status === 0 ? 0 : peso.status === 1 ? 1 : 2
    notas.push(`1.8b código ${peso.status ?? 'tope'}`)
    const humo = await paso(fd, 'diagDSK humo', ['scripts/diagDSK.mjs', 'humo', '--sin-build'], { cwd: copia, topeMs: 25 * MINUTO })
    pasos.humo = humo.status === 0 ? 0 : humo.status === 1 ? 1 : 2
    notas.push(`humo código ${humo.status ?? 'tope'}`)
  }
  return { pasos, notas }
}

async function main() {
  const opc = leerArgumentos(process.argv.slice(2))

  if (opc.limpiar) {
    const r = limpiarCopia({ ruta: opc.limpiar, raiz: RAIZ })
    console.log(r.codigo === 0 ? `Copia limpia: ${opc.limpiar}` : `✖ ${r.motivo}`)
    process.exit(r.codigo)
  }

  const antes = analizarWorktrees(git('worktree', 'list', '--porcelain'))
  if (antes.length !== 1) fallar(`ya hay otra copia viva: ${antes.slice(1).map((c) => c.ruta).join(', ')}. Se limpia con --limpiar=<ruta>`)

  const sello = Date.now().toString(36)
  const salidas = join(opc.carpeta, `aislado-${sello}`)
  mkdirSync(salidas, { recursive: true })

  // Ctrl+C no pasa por el `finally`: sin esto, la unión se quedaría viva.
  let viva = null
  const alCortar = () => {
    if (viva) { const r = limpiarCopia({ ruta: viva, raiz: RAIZ }); if (r.codigo) console.error(`✖ ${r.motivo}`) }
    process.exit(2)
  }
  for (const s of ['SIGINT', 'SIGTERM', 'SIGBREAK']) process.on(s, alCortar)

  const veredictos = []
  for (const pedido of opc.shas) {
    const inicio = Date.now()
    let sha = pedido
    let pasos = {}
    let notas = []
    let dejada = false
    const archivo = join(salidas, `${String(pedido).slice(0, 7)}.log`)
    const fd = openSync(archivo, 'a+')
    let ruta = null
    try {
      sha = git('rev-parse', '--verify', `${pedido}^{commit}`).trim()
      ruta = rutaDeCopia(opc.carpeta, sha, `${sello}-${veredictos.length}`)
      viva = ruta
      const copia = prepararCopia(sha, ruta)
      ;({ pasos, notas } = await probarCopia(sha, copia, opc.perfil, fd, salidas))
    } catch (e) {
      pasos.preparacion = 2
      notas.push(`no se pudo preparar: ${String(e.stderr || e.message).trim()}`)
    } finally {
      dejada = opc.dejar && ruta && veredictoCopia(pasos) === 'rojo'
      if (ruta && !dejada) {
        const r = limpiarCopia({ ruta, raiz: RAIZ })
        pasos.limpieza = r.codigo
        if (r.codigo) notas.push(`LIMPIEZA: ${r.motivo}`)
      }
      viva = null
      closeSync(fd)
    }
    const veredicto = veredictoCopia(pasos)
    veredictos.push(veredicto)
    console.log(`${sha.slice(0, 7)} · ${veredicto} · ${ms(Date.now() - inicio)} · ${notas.join(' · ')} · salida: ${archivo}`)
    if (dejada) console.log(`  ⚠ copia conservada, ENLAZADA al node_modules real. Se quita con: npm run aislado -- --limpiar=${ruta}`)
  }

  const copias = analizarWorktrees(git('worktree', 'list', '--porcelain'))
  console.log(`git worktree list: ${copias.length} ${copias.length === 1 ? 'línea' : 'líneas'}`)
  process.exit(codigoDeSalida(veredictos))
}

main().catch((e) => fallar(e.stack || e.message))
