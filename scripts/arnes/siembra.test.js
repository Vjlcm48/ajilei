// ── ARN-4 A6 · la siembra común ──────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RAIZ } from './fuente.mjs'
import { AVISO_SEMILLA, generador, guionSiembra, sembrarAzar } from './siembra.mjs'

const CIFRAS_SEMILLA_5 = [0.6897749109193683, 0.7727432732935995, 0.21976301027461886]

// El guion corre como en la página: `window` y `Math` son los que se le pasan.
function correrGuion(semilla) {
  const window = {}
  const Math_ = Object.create(Math)
  new Function('window', 'Math', guionSiembra(semilla))(window, Math_)
  return { window, Math_ }
}

describe('A6 · el generador', () => {
  it('la misma semilla da la misma secuencia, y otra semilla otra', () => {
    const a = generador(5), b = generador(5), c = generador(6)
    const tira = (g) => Array.from({ length: 8 }, g)
    const primera = tira(a)
    expect(tira(b)).toEqual(primera)
    expect(tira(c)).not.toEqual(primera)
    for (const v of primera) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) }
  })
  it('no cambia: mover estas cifras invalida todas las semillas selladas', () => {
    const g = generador(5)
    expect([g(), g(), g()]).toEqual(CIFRAS_SEMILLA_5)
  })
})

describe('A6 · el guion de arranque', () => {
  it('cambia Math.random por el generador sembrado, y cuenta las tiradas', () => {
    const { window, Math_ } = correrGuion(11)
    const g = generador(11)
    expect(window.__azarTiradas).toBe(0)
    expect([Math_.random(), Math_.random()]).toEqual([g(), g()])
    expect(window.__azarTiradas).toBe(2)
  })
  it('una navegación nueva empieza la secuencia de cero', () => {
    expect(correrGuion(11).Math_.random()).toBe(correrGuion(11).Math_.random())
  })
  it('una semilla que no es un entero es un error, no un azar silencioso', () => {
    expect(() => guionSiembra('7')).toThrow(/semilla inválida/)
    expect(() => guionSiembra(NaN)).toThrow(/semilla inválida/)
  })
  it('se instala antes de arrancar, en la página o el contexto que le pasen', async () => {
    const llamadas = []
    await sembrarAzar({ addInitScript: async (g) => llamadas.push(g) }, 7)
    expect(llamadas).toEqual([{ content: guionSiembra(7) }])
  })
})

describe('A6 · una sola pieza', () => {
  it('`contextoCap` siembra por aquí, y no con otra copia', () => {
    const cap = readFileSync(join(RAIZ, 'scripts/cap/capMesa.mjs'), 'utf8')
    expect(cap).toContain('sembrarAzar(ctx, semilla)')
    expect(cap).not.toContain('0x6D2B79F5')
  })
  it('el aviso dice lo que hay que hacer', () => {
    expect(AVISO_SEMILLA).toBe('re-elegir semilla')
  })
})
