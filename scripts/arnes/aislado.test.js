// ── ARN-4 A2 y A3 · la ruta, el análisis, el veredicto y la limpieza ─────────
// La limpieza se prueba de verdad, con uniones reales en una carpeta temporal: un
// destino con testigos, una unión hacia él, limpiar, y los testigos siguen ahí.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import {
  analizarWorktrees, codigoVitest, compararFirma, entornoLimpio, FIRMA_ESLINT_BASE, firmaEslint, leerEslint, limpiarCopia, resumenVitest, rutaDeCopia, veredictoCopia,
} from './aisladoCore.mjs'

const UNA_LINEA = 'worktree C:/repo\nHEAD abc\nbranch refs/heads/main\n\n'

describe('A3 · la ruta de la copia', () => {
  it('lleva el SHA corto y el sello, y dos corridas no chocan', () => {
    const r = rutaDeCopia('C:\\Temp', '0364a5e7da4a04dd', 'x1')
    expect(r).toMatch(/wt-0364a5e-x1$/)
    expect(rutaDeCopia('C:\\Temp', '0364a5e7da4a04dd', 'x2')).not.toBe(r)
  })
  it('se niega a vivir dentro de OneDrive', () => {
    expect(() => rutaDeCopia('C:\\Users\\v\\OneDrive\\Documents', 'abc1234', 'x')).toThrow(/OneDrive/)
    expect(() => rutaDeCopia('C:/Users/v/OneDrive - Empresa/x', 'abc1234', 'x')).toThrow(/OneDrive/)
  })
  it('un scratchpad con la palabra dentro de su nombre no está en OneDrive', () => {
    expect(rutaDeCopia('C:\\Temp\\c--Users-v-OneDrive-Documents-ajilei\\s', 'abc1234', 'x')).toMatch(/wt-abc1234-x$/)
  })
})

describe('A3 · git worktree list', () => {
  it('lee una entrada por copia, la principal primero', () => {
    const lista = analizarWorktrees(`${UNA_LINEA}worktree C:/t/wt-abc\nHEAD def\ndetached\n\n`)
    expect(lista.map((c) => c.ruta)).toEqual(['C:/repo', 'C:/t/wt-abc'])
    expect(lista[0].rama).toBe('refs/heads/main')
    expect(lista[1].rama).toBeNull()
  })
  it('entiende los finales CRLF y la salida vacía', () => {
    expect(analizarWorktrees('worktree C:/repo\r\nHEAD abc\r\n\r\n')).toHaveLength(1)
    expect(analizarWorktrees('')).toEqual([])
  })
})

describe('A3 · la lectura de vitest', () => {
  const salida = (archivos, pruebas) => ` Test Files  ${archivos}\n      Tests  ${pruebas}\n   Start at  05:00:00\n`
  it('lee un verde', () => {
    const r = resumenVitest(salida('88 passed (88)', '2076 passed (2076)'))
    expect(r).toEqual({ archivos: 88, archivosFallidos: 0, pruebas: 2076, fallidas: 0, omitidas: 0 })
    expect(codigoVitest(0, r)).toBe(0)
  })
  it('lee las fallidas y las omitidas, con colores por medio', () => {
    const r = resumenVitest(salida('\x1b[31m1 failed\x1b[39m | 87 passed (88)', '2 failed | 2073 passed | 1 skipped (2076)'))
    expect(r).toEqual({ archivos: 88, archivosFallidos: 1, pruebas: 2076, fallidas: 2, omitidas: 1 })
    expect(codigoVitest(1, r)).toBe(1)
  })
  it('una omitida no es un verde (A11)', () => {
    expect(codigoVitest(0, resumenVitest(salida('88 passed (88)', '2075 passed | 1 skipped (2076)')))).toBe(1)
  })
  it('sin medir es instrumento: la guarda de la unidad, «no tests» y el tope', () => {
    expect(codigoVitest(2, null)).toBe(2)
    expect(codigoVitest(1, resumenVitest(salida('88 failed (88)', 'no tests')))).toBe(2)
    expect(codigoVitest(null, null)).toBe(2)
  })
})

describe('A3 · la firma de eslint', () => {
  const cwd = process.platform === 'win32' ? 'C:\\copia' : '/copia'
  const ruta = (r) => (process.platform === 'win32' ? `C:\\copia\\${r.split('/').join('\\')}` : `/copia/${r}`)
  const salida = (extra = []) => [{
    filePath: ruta('src/components/CardImage.jsx'),
    messages: [{ ruleId: 'react-refresh/only-export-components', severity: 2, line: 16 }, ...extra],
  }]
  it('no lleva números de línea, y cuenta por archivo, regla y severidad', () => {
    const f = firmaEslint(salida([{ ruleId: null, severity: 1, line: 3 }]), cwd)
    expect(f).toEqual({
      'src/components/CardImage.jsx|react-refresh/only-export-components|error': 1,
      'src/components/CardImage.jsx|(sin regla)|aviso': 1,
    })
  })
  it('la base son 20 errores y 1 aviso', () => {
    const c = compararFirma(FIRMA_ESLINT_BASE)
    expect([c.errores, c.avisos, c.nuevos, c.menos]).toEqual([20, 1, [], []])
  })
  it('lo que sube es rojo, y lo que baja no', () => {
    const sube = { ...FIRMA_ESLINT_BASE, 'src/x.jsx|no-undef|error': 1 }
    expect(compararFirma(sube).nuevos).toEqual(['src/x.jsx|no-undef|error: 0 → 1'])
    const baja = { ...FIRMA_ESLINT_BASE }
    delete baja['src/components/CardImage.jsx|react-refresh/only-export-components|error']
    expect(compararFirma(baja).nuevos).toEqual([])
    expect(compararFirma(baja).menos).toHaveLength(1)
  })
  it('un eslint que no corrió es instrumento, no un rojo', () => {
    expect(leerEslint(2, '', cwd).codigo).toBe(2)
    expect(leerEslint(1, 'no es json', cwd).codigo).toBe(2)
    expect(leerEslint(1, JSON.stringify(salida([{ ruleId: 'no-undef', severity: 2 }])), cwd).codigo).toBe(1)
  })
})

describe('A3 · el veredicto', () => {
  it('todo a cero es verde; un 1, rojo; un 2 manda', () => {
    expect(veredictoCopia({ build: 0, vitest: 0, eslint: 0, limpieza: 0 })).toBe('verde')
    expect(veredictoCopia({ build: 0, vitest: 1, eslint: 0, limpieza: 0 })).toBe('rojo')
    expect(veredictoCopia({ build: 0, vitest: 1, eslint: 0, limpieza: 2 })).toBe('error')
  })
  it('sin pasos medidos no hay verde', () => {
    expect(veredictoCopia({})).toBe('error')
  })
})

describe('A3 · el entorno de un paso', () => {
  it('no hereda lo que vitest o npm dejaron puesto', () => {
    expect(entornoLimpio({ NODE_ENV: 'test', VITEST: 'true', TEST: 'true', PATH: 'x' })).toEqual({ PATH: 'x' })
  })
})

describe('A2 · la limpieza, con uniones de verdad', () => {
  let tmp, real, ruta, gitComun, llamadas

  // El `git` falso anota el orden y en qué estado estaba la unión en cada llamada.
  const git = (salidaList = UNA_LINEA) => (args) => {
    llamadas.push({ args, union: existeEnlace(join(ruta, 'node_modules')) })
    if (args[1] === 'remove') rmSync(ruta, { recursive: true, force: true })
    return args[1] === 'list' ? salidaList : ''
  }
  const existeEnlace = (p) => { try { lstatSync(p); return true } catch { return false } }
  const limpiar = (extra = {}) => limpiarCopia({ ruta, raiz: tmp, nodeModulesReal: real, gitComun, git: git(), ...extra })

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'aislado-test-'))
    real = join(tmp, 'real')
    ruta = join(tmp, 'wt-abc')
    gitComun = join(tmp, 'gitcomun')
    llamadas = []
    mkdirSync(join(real, 'vite'), { recursive: true })
    writeFileSync(join(real, 'vite', 'package.json'), 'testigo')
    writeFileSync(join(real, '.package-lock.json'), 'testigo')
    mkdirSync(ruta)
  })
  afterEach(() => {
    // Se suelta primero, aunque la prueba haya fallado: ni aquí se borra por una unión.
    const u = join(ruta, 'node_modules')
    try { if (lstatSync(u).isSymbolicLink()) unlinkSync(u) } catch { /* no estaba */ }
    rmSync(tmp, { recursive: true, force: true })
  })

  it('suelta la unión, los testigos siguen ahí y solo después toca la copia', () => {
    symlinkSync(real, join(ruta, 'node_modules'), 'junction')
    expect(lstatSync(join(ruta, 'node_modules')).isSymbolicLink()).toBe(true)
    const r = limpiar()
    expect(r).toEqual({ codigo: 0, motivo: null })
    expect(readFileSync(join(real, 'vite', 'package.json'), 'utf8')).toBe('testigo')
    expect(readFileSync(join(real, '.package-lock.json'), 'utf8')).toBe('testigo')
    expect(llamadas.map((l) => l.args.slice(0, 2).join(' '))).toEqual(['worktree remove', 'worktree prune', 'worktree list'])
    expect(llamadas[0].union).toBe(false)
  })

  it('si la ruta no es una unión no toca nada y sale con código 2', () => {
    mkdirSync(join(ruta, 'node_modules'))
    writeFileSync(join(ruta, 'node_modules', 'propio.txt'), 'de otro')
    const r = limpiar()
    expect(r.codigo).toBe(2)
    expect(r.motivo).toMatch(/no es una unión/)
    expect(llamadas).toEqual([])
    expect(readFileSync(join(ruta, 'node_modules', 'propio.txt'), 'utf8')).toBe('de otro')
  })

  it('sin unión, porque la corrida cayó antes de crearla, limpia igual', () => {
    expect(limpiar().codigo).toBe(0)
    expect(llamadas[0].args[1]).toBe('remove')
  })

  it('si el node_modules real perdió un testigo, para antes de tocar la copia', () => {
    symlinkSync(real, join(ruta, 'node_modules'), 'junction')
    rmSync(join(real, '.package-lock.json'))
    const r = limpiar()
    expect(r.codigo).toBe(2)
    expect(r.motivo).toMatch(/perdió \.package-lock\.json/)
    expect(llamadas).toEqual([])
    expect(existsSync(ruta)).toBe(true)
  })

  it('borra lo que OneDrive dejó de esta copia, y solo eso', () => {
    mkdirSync(join(gitComun, 'worktrees', 'wt-abc'), { recursive: true })
    mkdirSync(join(gitComun, 'worktrees', 'wt-otra'), { recursive: true })
    expect(limpiar().codigo).toBe(0)
    expect(existsSync(join(gitComun, 'worktrees', 'wt-abc'))).toBe(false)
    expect(existsSync(join(gitComun, 'worktrees', 'wt-otra'))).toBe(true)
  })

  it('si git worktree list no da una línea, es código 2', () => {
    const r = limpiar({ git: git(`${UNA_LINEA}worktree C:/t/otra\nHEAD def\ndetached\n\n`) })
    expect(r.codigo).toBe(2)
    expect(r.motivo).toMatch(/2 líneas/)
  })

  it('si git quita la copia pero protesta por .git/worktrees, como con OneDrive, no es un fallo', () => {
    mkdirSync(join(gitComun, 'worktrees', 'wt-abc'), { recursive: true })
    const r = limpiar({ git: (args) => {
      if (args[1] === 'remove') {
        rmSync(ruta, { recursive: true, force: true })
        throw Object.assign(new Error('x'), { stderr: "failed to delete '.git/worktrees/wt-abc': Permission denied" })
      }
      return args[1] === 'list' ? UNA_LINEA : ''
    } })
    expect(r).toEqual({ codigo: 0, motivo: null })
    expect(existsSync(join(gitComun, 'worktrees', 'wt-abc'))).toBe(false)
  })

  it('si git no puede quitar la copia, lo dice y no borra por su cuenta', () => {
    const r = limpiar({ git: (args) => {
      if (args[1] === 'remove') throw Object.assign(new Error('x'), { stderr: 'Permission denied' })
      return args[1] === 'list' ? UNA_LINEA : ''
    } })
    expect(r.codigo).toBe(2)
    expect(r.motivo).toMatch(/Permission denied/)
    expect(existsSync(ruta)).toBe(true)
  })
})
