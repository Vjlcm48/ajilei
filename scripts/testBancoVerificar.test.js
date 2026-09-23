// ── APU-1 · C-0.2 y C-0.4 (D-31) · CORRER EL BANCO COMO SE SELLÓ ────────────
//
// Dos cosas que hasta ahora vivían en la memoria de quien escribía el comando:
//
//   · C-0.2 · la FORMA con que se selló una celda —mesas, conductores, nivel,
//     `--unit`, `--seed` y manos— está escrita en la vara, y `banco:verificar`
//     la reconstruye sola. Lo que se prueba no es que el banco mida bien, sino
//     que el verificador vuelve a pedir EXACTAMENTE lo mismo: si lo hace, una
//     celda determinista tiene que salir a 0,00σ de sí misma.
//   · C-0.4 (D-31) · con `--seed`, el conductor `aleatorio` ya tira de la misma
//     corriente que el mazo y la IA (E-27, cerrado). Dos corridas con la misma
//     semilla dan el MISMO volcado salvo los campos de reloj.
//
// Como en `testBancoBandas`, se prueba lanzando el banco: su guion juega al
// importarse y no se le puede llamar por dentro.
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ  = join(dirname(fileURLToPath(import.meta.url)), '..')
const BANCO = join(RAIZ, 'scripts', 'bancoNiveles.mjs')
const VERIF = join(RAIZ, 'scripts', 'bancoVerificar.mjs')
// Una vara de usar y tirar, para no tocar la viva ni de lectura.
const VARA  = 'capturas-dsk/_tv_vara.json'

function corre(guion, args) {
  try { return execFileSync('node', [guion, ...args], { encoding: 'utf8', cwd: RAIZ }) }
  catch (e) { return (e.stdout ?? '') + (e.stderr ?? '') }
}

// Una celda determinista y corta: mesa 2 con el conductor pasivo, sembrada.
const CELDA = ['--mesa', '2', '--j0', 'pasivo', '--nivel', 'basico', '--manos', '2000',
  '--unit', '50', '--seed', '7', '--sinReloj', '--tanda', 'TV']

beforeAll(() => {
  corre(BANCO, [...CELDA, '--volcado', '_tv_run.json'])
  corre(BANCO, ['--sellar-bandas', 'capturas-dsk/_tv_run.json', '--vara-bandas', VARA, '--tanda', 'TV'])
}, 180000)

describe('C-0.2 · `banco:verificar` reconstruye la forma con que se selló', () => {
  it('la forma sale de la vara, no de la memoria de quien escribe el comando', () => {
    const out = corre(VERIF, ['--vara', VARA, '--listar'])
    expect(out).toContain('1 forma(s)')
    // Las cinco piezas que E-24 y E-27 exigen repetir, todas presentes.
    for (const t of ['--mesa 2', '--j0 pasivo', '--nivel basico', '--manos 2000', '--unit 50', '--seed 7']) {
      expect(out).toContain(t)
    }
  })

  it('una celda determinista se reproduce a 0,00σ de sí misma', () => {
    const out = corre(VERIF, ['--vara', VARA])
    expect(out).toContain('VERDE')
    expect(out).not.toContain('INCOMPARABLE')
    expect(out).toMatch(/peor 0\.00s/)
    expect(out).toContain('1/1 celdas comparadas pasan')
  })

  it('una vara que no mide nada no es verde: sin celdas, código 2', () => {
    // `--forma` que no casa con nada deja cero celdas comparadas. El veredicto
    // no puede ser VERDE (D-16 de 1b): es SIN COMPARAR.
    const out = corre(VERIF, ['--vara', VARA, '--forma', 'no-existe-esta-forma'])
    expect(out).toContain('SIN COMPARAR')
    expect(out).not.toMatch(/VERDE: \d+\/\d+ celdas/)
  })
})

describe('C-0.4 (D-31) · el conductor `aleatorio` ya entra en la siembra', () => {
  const base = ['--mesa', '3', '--j0', 'aleatorio', '--nivel', 'basico', '--manos', '800',
    '--unit', '100', '--sinReloj', '--tanda', 'TV']
  const leer = (f) => readFileSync(join(RAIZ, 'capturas-dsk', f), 'utf8')

  it('con la misma semilla, dos corridas dan el mismo volcado', () => {
    corre(BANCO, [...base, '--seed', '11', '--volcado', '_tv_d31_a.json'])
    corre(BANCO, [...base, '--seed', '11', '--volcado', '_tv_d31_b.json'])
    expect(leer('_tv_d31_a.json')).toBe(leer('_tv_d31_b.json'))
  }, 180000)

  it('sin semilla sigue siendo `Math.random`: dos corridas difieren', () => {
    corre(BANCO, [...base, '--volcado', '_tv_d31_c.json'])
    corre(BANCO, [...base, '--volcado', '_tv_d31_d.json'])
    expect(leer('_tv_d31_c.json')).not.toBe(leer('_tv_d31_d.json'))
  }, 180000)
})
