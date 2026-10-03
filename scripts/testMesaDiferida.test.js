// ── ARN-3d §2.4 (B11) · prueba de fuente: la mesa sólo entra por `import()` ──
// Si un solo archivo de `src/` importa `GameTable` de forma ESTÁTICA, Rollup la
// mete otra vez en el paquete principal (y avisa `INEFFECTIVE_DYNAMIC_IMPORT`):
// el `lazy` sigue escrito pero deja de servir, y `1.8b` vuelve a 222 KiB sin
// que nada más se rompa. Esta prueba es la que se rompe.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

function fuentes(dir) {
  const out = []
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) out.push(...fuentes(p))
    else if (/\.(jsx?|mjs)$/.test(n) && !/\.test\.js$/.test(n)) out.push(p)
  }
  return out
}

// `import X from '…/GameTable'`, `import { y } from '…/GameTable.jsx'`,
// `import '…/GameTable'` y `export … from '…/GameTable'`. El `import()`
// dinámico NO casa: lleva paréntesis tras `import`.
const ESTATICO = /(^|\n)\s*(import|export)\b[^;()]*?from\s*['"][^'"]*\/GameTable(\.jsx)?['"]|(^|\n)\s*import\s*['"][^'"]*\/GameTable(\.jsx)?['"]/

describe('ARN-3d · GameTable sólo por import() dinámico', () => {
  const archivos = fuentes(SRC)

  it('el barrido ve la app (no es una prueba vacía)', () => {
    const rel = archivos.map((p) => relative(SRC, p).replaceAll('\\', '/'))
    expect(rel).toContain('App.jsx')
    expect(rel).toContain('lib/cargarMesa.js')
  })

  it('ningún archivo de src/ importa GameTable de forma estática', () => {
    const culpables = archivos
      .filter((p) => ESTATICO.test(readFileSync(p, 'utf8')))
      .map((p) => relative(SRC, p).replaceAll('\\', '/'))
    expect(culpables).toEqual([])
  })

  it('cargarMesa.js la pide con import() dinámico', () => {
    const src = readFileSync(join(SRC, 'lib/cargarMesa.js'), 'utf8')
    expect(src).toMatch(/import\(\s*['"]\.\.\/components\/GameTable['"]\s*\)/)
  })

  it('el detector sabe fallar: casa las formas estáticas y no la dinámica', () => {
    expect(ESTATICO.test("import GameTable from './components/GameTable'")).toBe(true)
    expect(ESTATICO.test("\nimport { x } from '../components/GameTable.jsx'")).toBe(true)
    expect(ESTATICO.test("import './components/GameTable'")).toBe(true)
    expect(ESTATICO.test("export { default } from './components/GameTable'")).toBe(true)
    expect(ESTATICO.test("const m = () => import('../components/GameTable')")).toBe(false)
  })
})
