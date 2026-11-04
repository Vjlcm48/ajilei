// ── arnes/orquesta.mjs · ARN-4 A4 · un solo botón para todas las varas ───────
// Rector: AJILEI_ARN-4_Tanda4a_v1.0.md §4. Se invoca `npm run varas`:
//
//   npm run varas -- rapido            eslint, vitest (lanzador), build, guiones
//   npm run varas -- commit            rapido + 1.8b (el peso, sin navegador) + humo
//   npm run varas -- completo          todo, con apu por celdas, tab en dos partes y
//                                      tactil, h1, m1 y a1 por mesas
//   npm run varas -- --solo cfg,lob    esas varas, con el build delante si lo piden
//
// Opciones: `--sin-build` (mide el `dist/` que haya, solo con `--solo`) y
// `--carpeta=<dir>` (dónde van las salidas; por defecto, la carpeta temporal).
// Un solo build, en su propio proceso y antes de toda vara que mida `dist/`: así
// no se compila nunca con un dev vivo (D17). Las varas van EN SERIE: comparten
// puertos, y las de tiempo corren solas (INV-36). La lista de varas y la tabla
// viven en `orquestaCore.mjs`, con su contrato en `orquesta.test.js`.
//
// ARN-4d · antes de lanzar una vara, su JSON de veredicto queda como `.caducado`: una
// vara cortada no deja nada que pase por actual. La tabla y `varas.json` llevan el
// commit que se midió.
//
// Códigos: 0 = todo verde · 1 = algún rojo · 2 = error de instrumento.
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { codigoVitest, correr, leerEslint, resumenVitest, textoVitest } from './aisladoCore.mjs'
import { commitDelArbol, RAIZ as RAIZ_FUENTE } from './fuente.mjs'
import { MODOS_DSK } from './nucleo.mjs'
import { codigoDeVara, codigoGlobal, MANUALES, modosPueDe, PERFILES, tablaDeVaras, topeMs, varasDeSolo, veredictoDeVara } from './orquestaCore.mjs'
import { corregirUnidad } from './unidad.mjs'

const RAIZ = corregirUnidad(resolve(RAIZ_FUENTE))

function fallar(mensaje) {
  console.error(`\n✖ ERROR DE INSTRUMENTO (código 2): ${mensaje}`)
  process.exit(2)
}

function leerArgumentos(argv) {
  const opc = { perfil: null, solo: null, build: true, carpeta: tmpdir() }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--solo') opc.solo = (argv[++i] ?? '').split(',').filter(Boolean)
    else if (a.startsWith('--solo=')) opc.solo = a.slice('--solo='.length).split(',').filter(Boolean)
    else if (a === '--sin-build') opc.build = false
    else if (a.startsWith('--carpeta=')) opc.carpeta = resolve(a.slice('--carpeta='.length))
    else if (a.startsWith('--')) fallar(`opción desconocida: ${a}`)
    else if (opc.perfil) fallar(`sobra «${a}»: ya se pidió el perfil «${opc.perfil}»`)
    else opc.perfil = a
  }
  if (opc.perfil && opc.solo) fallar('o un perfil, o --solo: los dos a la vez no')
  if (!opc.perfil && !opc.solo?.length) fallar('falta el perfil. Uso: npm run varas -- rapido|commit|completo, o --solo cfg,lob')
  if (opc.perfil && !PERFILES[opc.perfil]) fallar(`perfil desconocido: «${opc.perfil}». Valen: ${Object.keys(PERFILES).join(', ')}`)
  if (opc.perfil && !opc.build) fallar('--sin-build es solo para --solo: un perfil tiene su único build')
  return opc
}

function elegirVaras(opc) {
  if (opc.perfil) return PERFILES[opc.perfil]
  const modosPue = modosPueDe(readFileSync(join(RAIZ, 'scripts/diagPUE.mjs'), 'utf8'))
  const { varas, desconocidos } = varasDeSolo(opc.solo, { modosDsk: MODOS_DSK, modosPue, build: opc.build })
  if (desconocidos.length) fallar(`--solo: no existe ${desconocidos.join(', ')}`)
  return varas
}

/** Lo que una corrida anterior dejó como veredicto de esta vara ya no vale. */
function caducar(veredicto) {
  for (const rel of [veredicto?.comun, veredicto?.propio]) {
    const abs = rel && join(RAIZ, rel)
    if (abs && existsSync(abs)) renameSync(abs, `${abs}.caducado`)
  }
}

/** Corre una vara y devuelve su fila de la tabla. */
async function correrVara(vara, salidas) {
  const veredicto = veredictoDeVara(vara)
  caducar(veredicto)
  const archivo = join(salidas, `${vara.id}.log`)
  const json = join(salidas, `${vara.id}.json`)
  const args = vara.tipo === 'eslint' ? [...vara.args, '-o', json] : vara.args
  const fd = openSync(archivo, 'w')
  let r
  try {
    r = await correr(args, { cwd: RAIZ, fd, topeMs: topeMs(vara) })
  } finally {
    closeSync(fd)
  }
  if (veredicto?.propio && existsSync(join(RAIZ, veredicto.comun))) copyFileSync(join(RAIZ, veredicto.comun), join(RAIZ, veredicto.propio))
  const fila = { id: vara.id, ms: r.ms, tope: vara.topeMin, archivo, codigo: codigoDeVara(r.status), nota: r.topado ? `tope de ${vara.topeMin} min` : null }
  if (vara.tipo === 'vitest') {
    const resumen = resumenVitest(readFileSync(archivo, 'utf8'))
    fila.codigo = codigoVitest(r.status, resumen)
    fila.nota = textoVitest(resumen)
  } else if (vara.tipo === 'eslint') {
    const l = leerEslint(r.status, existsSync(json) ? readFileSync(json, 'utf8') : '', RAIZ)
    fila.codigo = l.codigo
    fila.nota = l.texto
  }
  return fila
}

async function main() {
  const opc = leerArgumentos(process.argv.slice(2))
  const varas = elegirVaras(opc)
  const salidas = join(opc.carpeta, `varas-${Date.now().toString(36)}`)
  mkdirSync(salidas, { recursive: true })
  const commit = commitDelArbol()
  console.log(`· ${varas.length} varas, en serie, sobre ${commit}. Salidas en ${salidas}`)

  const filas = []
  const cerrar = (codigo) => {
    console.log(`\n${tablaDeVaras([...filas, ...MANUALES.map((m) => ({ ...m, manual: true }))])}`)
    writeFileSync(join(salidas, 'varas.json'), JSON.stringify({ commit, codigo, filas }, null, 2))
    console.log(`\n── varas · ${filas.length} corridas sobre ${commit} → código ${codigo}`)
    process.exit(codigo)
  }
  for (const s of ['SIGINT', 'SIGTERM', 'SIGBREAK']) process.on(s, () => cerrar(2))

  let sinBuild = false
  for (const vara of varas) {
    // Sin build no hay nada que medir: un `dist/` viejo daría un verde falso.
    if (sinBuild && vara.necesitaDist) {
      filas.push({ id: vara.id, ms: null, archivo: null, codigo: 2, nota: 'no corrió: el build falló' })
      continue
    }
    const fila = await correrVara(vara, salidas)
    filas.push(fila)
    console.log(`· ${fila.id} → código ${fila.codigo}`)
    if (vara.tipo === 'build' && fila.codigo !== 0) sinBuild = true
  }
  cerrar(codigoGlobal(filas))
}

main().catch((e) => fallar(e.stack || e.message))
