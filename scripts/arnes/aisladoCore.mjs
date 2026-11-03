// ── arnes/aisladoCore.mjs · ARN-4 A2 y A3 · lo probable en vitest ────────────
// Rector: AJILEI_ARN-4_Tanda4a_v1.0.md §3. La ruta de la copia, el análisis de
// `git worktree list`, la lectura de vitest y de eslint, el veredicto y la
// limpieza. `aislado.mjs` es la línea de órdenes; `orquesta.mjs` usa de aquí la
// lectura de vitest, la de eslint y `correr`.
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, lstatSync, rmSync, unlinkSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import process from 'node:process'
import { ErrorInstrumento } from './nucleo.mjs'

// ── La ruta ──────────────────────────────────────────────────────────────────
/**
 * Dónde vive la copia: fuera de OneDrive y con un nombre nuevo por corrida. Una
 * copia dentro de OneDrive deja `.git/worktrees/wt-*` a medio borrar (A2).
 */
export function rutaDeCopia(base, sha, sello) {
  // Un segmento entero («OneDrive», «OneDrive - Empresa»): el scratchpad de una
  // sesión lleva la palabra dentro de su nombre y no está en OneDrive.
  if (/(^|[\\/])onedrive( - [^\\/]*)?([\\/]|$)/i.test(base)) throw new ErrorInstrumento(`la copia no puede vivir dentro de OneDrive: ${base}`)
  return join(base, `wt-${String(sha).slice(0, 7)}-${sello}`)
}

// ── git worktree list ────────────────────────────────────────────────────────
/** Lee `git worktree list --porcelain`: una entrada por copia, la principal primero. */
export function analizarWorktrees(porcelana) {
  return String(porcelana).split(/\r?\n\r?\n/).map((b) => b.trim()).filter(Boolean).map((bloque) => {
    const campo = (nombre) => bloque.split(/\r?\n/).find((l) => l.startsWith(`${nombre} `))?.slice(nombre.length + 1) ?? null
    return { ruta: campo('worktree'), head: campo('HEAD'), rama: campo('branch') }
  })
}

// ── Vitest ───────────────────────────────────────────────────────────────────
const SIN_COLOR = /\x1b\[[0-9;]*m/g

/** Las cifras de la salida de vitest, o null si no llegó a imprimir su resumen. */
export function resumenVitest(texto) {
  const limpio = String(texto).replace(SIN_COLOR, '')
  const linea = (rotulo) => limpio.match(new RegExp(`^\\s*${rotulo}\\s+(.+)$`, 'm'))?.[1] ?? null
  const archivos = linea('Test Files')
  const pruebas = linea('Tests')
  if (archivos === null || pruebas === null) return null
  const cifra = (l, palabra) => Number(l.match(new RegExp(`(\\d+) ${palabra}`))?.[1] ?? 0)
  const total = (l) => Number(l.match(/\((\d+)\)\s*$/)?.[1] ?? 0)
  return {
    archivos: total(archivos),
    archivosFallidos: cifra(archivos, 'failed'),
    pruebas: total(pruebas),
    fallidas: cifra(pruebas, 'failed'),
    omitidas: cifra(pruebas, 'skipped') + cifra(pruebas, 'todo'),
  }
}

/**
 * El código de una corrida de vitest. 2 si no llegó a medir (el lanzador o la
 * guarda de la unidad, o una corrida sin pruebas); 1 si algo cayó, o si se omitió
 * algo: un skip silencioso no es un verde (D4 de la Fase 0 de ARN-3).
 */
export function codigoVitest(status, resumen) {
  if (status === 2 || status === null || resumen === null || resumen.pruebas === 0) return 2
  if (status !== 0 || resumen.fallidas > 0 || resumen.archivosFallidos > 0 || resumen.omitidas > 0) return 1
  return 0
}

export const textoVitest = (r) => (r
  ? `vitest ${r.archivos - r.archivosFallidos}/${r.archivos} archivos, ${r.pruebas} pruebas, ${r.fallidas} fallidas, ${r.omitidas} omitidas`
  : 'vitest sin resumen')

// ── Eslint ───────────────────────────────────────────────────────────────────
// La firma de la base: cuántos problemas hay por archivo, regla y severidad, sin
// números de línea, que se mueven con cualquier cambio. La limpieza de eslint de
// la 4c (B1) baja estas cifras en el mismo commit que los arregla.
export const FIRMA_ESLINT_BASE = Object.freeze({
  'src/components/CardImage.jsx|react-refresh/only-export-components|error': 1,
  'src/components/GameTable.jsx|react-hooks/refs|error': 11,
  'src/components/GameTable.jsx|react-hooks/set-state-in-effect|error': 6,
  'src/components/GameTable.jsx|react-hooks/immutability|error': 1,
  'src/components/GameTable.jsx|(sin regla)|aviso': 1,
  'src/context/SoundContext.jsx|react-refresh/only-export-components|error': 1,
})

/** La firma de la salida de `eslint -f json`. */
export function firmaEslint(resultados, cwd) {
  const firma = {}
  for (const r of resultados) {
    const rel = relative(cwd, r.filePath).split('\\').join('/')
    for (const m of r.messages) {
      const clave = `${rel}|${m.ruleId ?? '(sin regla)'}|${m.severity === 2 ? 'error' : 'aviso'}`
      firma[clave] = (firma[clave] ?? 0) + 1
    }
  }
  return firma
}

/** Qué sube y qué baja la firma viva frente a la base. Solo lo que sube es rojo. */
export function compararFirma(viva, base = FIRMA_ESLINT_BASE) {
  const claves = [...new Set([...Object.keys(viva), ...Object.keys(base)])].sort()
  const nuevos = claves.filter((c) => (viva[c] ?? 0) > (base[c] ?? 0)).map((c) => `${c}: ${base[c] ?? 0} → ${viva[c]}`)
  const menos = claves.filter((c) => (viva[c] ?? 0) < (base[c] ?? 0)).map((c) => `${c}: ${base[c]} → ${viva[c] ?? 0}`)
  const suma = (sufijo) => Object.entries(viva).filter(([c]) => c.endsWith(sufijo)).reduce((a, [, n]) => a + n, 0)
  return { nuevos, menos, errores: suma('|error'), avisos: suma('|aviso') }
}

/** El código de una corrida de eslint: `status` 0 y 1 son normales; lo demás, instrumento. */
export function leerEslint(status, json, cwd) {
  if (status !== 0 && status !== 1) return { codigo: 2, texto: `eslint no corrió (código ${status})` }
  let resultados
  try { resultados = JSON.parse(json) } catch { return { codigo: 2, texto: 'eslint no dio un JSON legible' } }
  const c = compararFirma(firmaEslint(resultados, cwd))
  const cifras = `${c.errores} errores y ${c.avisos} ${c.avisos === 1 ? 'aviso' : 'avisos'}`
  if (c.nuevos.length) return { codigo: 1, texto: `eslint ${cifras}, NUEVOS: ${c.nuevos.join(' · ')}` }
  return { codigo: 0, texto: `eslint ${cifras}, ${c.menos.length ? `por debajo de la base: ${c.menos.join(' · ')}` : 'igual a la base'}` }
}

// ── El veredicto ─────────────────────────────────────────────────────────────
/**
 * El veredicto de una copia a partir del código de cada paso, limpieza incluida.
 * Un 2 manda; un paso sin medir no puede salir verde.
 */
export function veredictoCopia(pasos) {
  const codigos = Object.values(pasos)
  if (!codigos.length || codigos.some((c) => c !== 0 && c !== 1)) return 'error'
  return codigos.includes(1) ? 'rojo' : 'verde'
}

// ── La limpieza (A2) ─────────────────────────────────────────────────────────
// Un borrado recursivo por la unión vacía el `node_modules` REAL. Por eso el
// orden no se negocia: primero se suelta la unión y se comprueba que el real sigue
// entero, y solo entonces se toca la copia. Si la ruta no es una unión no se toca
// nada: quien la creó no fue este guion.
export const TESTIGOS_NODE_MODULES = Object.freeze(['vite/package.json', '.package-lock.json'])

const gitDe = (raiz) => (args) => execFileSync('git', ['-C', raiz, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
})

/**
 * Limpia una copia, siempre en el orden de A2. `git` se inyecta en las pruebas.
 * Devuelve `{ codigo, motivo }`: 0 si la copia se fue y queda una sola línea en
 * `git worktree list`; 2 si algo no cuadra, con el motivo escrito.
 */
export function limpiarCopia({ ruta, raiz, nodeModulesReal = join(raiz, 'node_modules'), gitComun = join(raiz, '.git'), git = gitDe(raiz) }) {
  const union = join(ruta, 'node_modules')
  // 1 · ¿es una unión? `ENOENT` no es un fallo: la corrida cayó antes de crearla.
  let st = null
  try { st = lstatSync(union) } catch (e) {
    if (e.code !== 'ENOENT') return { codigo: 2, motivo: `no se pudo leer ${union}: ${e.message}. No se tocó nada` }
  }
  if (st && !st.isSymbolicLink()) return { codigo: 2, motivo: `${union} no es una unión. No se tocó nada` }
  // 2 · soltarla: quita el enlace y deja intacto el destino.
  if (st) {
    try { unlinkSync(union) } catch (e) {
      return { codigo: 2, motivo: `no se pudo soltar ${union}: ${e.message}. No se tocó nada más` }
    }
  }
  // 3 · el real, entero. Si no, se para aquí: es la alarma de esta tanda.
  const faltan = TESTIGOS_NODE_MODULES.filter((t) => !existsSync(join(nodeModulesReal, t)))
  if (faltan.length) return { codigo: 2, motivo: `¡el node_modules real perdió ${faltan.join(' y ')}! No se tocó nada más` }

  const fallos = []
  // 4 · la copia, si llegó a existir.
  if (existsSync(ruta)) {
    // Con el repo en OneDrive, git quita la copia y aun así protesta, porque no
    // puede borrar `.git/worktrees/wt-*`. Lo que manda es si la copia se fue.
    try { git(['worktree', 'remove', '--force', ruta]) } catch (e) {
      if (existsSync(ruta)) fallos.push(`git worktree remove: ${String(e.stderr || e.message).trim()}. Queda ${ruta}`)
    }
  }
  // 5 · lo que OneDrive pueda dejar, y solo lo de esta copia.
  const admin = join(gitComun, 'worktrees', basename(ruta))
  if (existsSync(admin) && !existsSync(ruta)) {
    try { rmSync(admin, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch (e) {
      fallos.push(`no se pudo borrar ${admin}: ${e.message}`)
    }
  }
  // 6 y 7 · el registro de git, en una línea.
  try {
    git(['worktree', 'prune'])
    const copias = analizarWorktrees(git(['worktree', 'list', '--porcelain']))
    if (copias.length !== 1) fallos.push(`git worktree list da ${copias.length} líneas: ${copias.map((c) => c.ruta).join(', ')}`)
  } catch (e) {
    fallos.push(`git worktree prune o list: ${String(e.stderr || e.message).trim()}`)
  }
  return fallos.length ? { codigo: 2, motivo: fallos.join(' · ') } : { codigo: 0, motivo: null }
}

// ── Correr un paso ───────────────────────────────────────────────────────────
/** El entorno de un paso: sin lo que el proceso padre, npm o vitest hayan dejado puesto. */
export function entornoLimpio(env = process.env) {
  const limpio = { ...env }
  for (const k of ['NODE_ENV', 'VITEST', 'TEST']) delete limpio[k]
  return limpio
}

/**
 * Corre `node <args>` con la salida en el descriptor `fd` y un tope propio. Al
 * llegar al tope mata el árbol entero: un hijo huérfano retendría los archivos de
 * la copia o el puerto de la vara siguiente. `status` null = no terminó por sí solo.
 */
export function correr(args, { cwd, fd, topeMs }) {
  return new Promise((resolve) => {
    const inicio = Date.now()
    const hijo = spawn(process.execPath, args, { cwd, env: entornoLimpio(), stdio: ['ignore', fd, fd] })
    let topado = false
    const reloj = setTimeout(() => {
      topado = true
      if (process.platform === 'win32') {
        try { execFileSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' }) } catch { /* ya no estaba */ }
      } else hijo.kill('SIGKILL')
    }, topeMs)
    const fin = (status) => {
      clearTimeout(reloj)
      resolve({ status: topado ? null : status, topado, ms: Date.now() - inicio })
    }
    hijo.on('error', () => fin(null))
    hijo.on('close', (status) => fin(status))
  })
}
