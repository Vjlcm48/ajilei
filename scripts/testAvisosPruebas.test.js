// ── ARN-3e · los avisos de las pruebas van por `stderr` (INV-38) ────────────
// H3c-1: con el reporter por defecto de vitest, la consola de una prueba que
// PASA no se ve. Un aviso escrito con el `warn` de la consola es, en la práctica,
// silencioso con `npm test`; el que llega es `process.stderr.write` (molde de
// `testBancoBandas.test.js`, su salto «en voz alta»).
// Rojo: cualquier `warn` de la consola fuera de comentarios en las pruebas de
// `scripts/` y `src/` (las dos carpetas de `npm test`).
import { describe, it, expect } from 'vitest'
import { archivos, codigo, lineaDe } from './arnes/fuente.mjs'

// Escrito en dos piezas para que esta misma prueba no se encuentre a sí misma.
const AVISO_MUDO = new RegExp('\\bconsole\\s*\\.\\s*' + 'warn\\b', 'g')

describe('ARN-3e · los avisos de las pruebas', () => {
  const pruebas = [...archivos('scripts', (n) => /\.test\.jsx?$/.test(n)), ...archivos('src', (n) => /\.test\.jsx?$/.test(n))]

  it('hay pruebas que mirar', () => {
    expect(pruebas.length).toBeGreaterThan(40)
  })

  it('ninguna avisa por la consola: los avisos van por process.stderr.write', () => {
    const mudos = []
    for (const a of pruebas) {
      const t = codigo(a)
      for (const m of t.matchAll(AVISO_MUDO)) mudos.push({ archivo: a, linea: lineaDe(t, m.index) })
    }
    expect(mudos, 'vitest no enseña ese aviso si la prueba pasa (H3c-1): usa process.stderr.write').toEqual([])
  })
})
