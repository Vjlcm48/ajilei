// ── TAB-1 · la hoja de escala vive entera bajo `[data-escala]` (§1.4) ──────
// Sin atributo, ni una regla de escala.css aplica: el celular y las pantallas de
// fuera de la mesa no la evalúan. Lo único que no lleva selector son las
// @keyframes gemelas (que sin una regla que las nombre no hacen nada) y las
// @media que envuelven reglas que sí lo llevan.
// TAB-3 · con UNA excepción declarada (§8, la banda P): las dos reglas del óvalo
// de 4 y 5 en el teléfono vertical cuya pista cubre el contenido. Van con
// `html:not([data-escala])`, dentro de la mesa y dentro de su @media exacta.
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
const MEDIA_P = '(orientation: portrait) and (min-width: 410px) and (max-width: 599px) and (max-height: 772px), (orientation: portrait) and (min-width: 444px) and (max-width: 599px) and (min-height: 772.01px)'
const REGLAS_P = [
  'html:not([data-escala]) .game-table-screen .table-wide .center-zone',
  'html:not([data-escala]) .game-table-screen .table-wide .center-zone .game-message',
]
describe('src/styles/escala.css', () => {
  const css = readFileSync(new URL('./escala.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const selectores = []
  const quitarKeyframes = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*\s*\}/g, '')
  for (const m of quitarKeyframes.matchAll(/([^{};]+)\{[^{}]*\}/g)) selectores.push(m[1].trim())
  // Las comas de primer nivel separan la lista; las de dentro de :is() no.
  const partes = (s) => { const out = []; let d = 0, cur = ''; for (const c of s) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { out.push(cur); cur = '' } else cur += c } return [...out, cur] }
  const todas = selectores.flatMap(partes).map((s) => s.trim())
  test('se deja leer (más de diez reglas)', () => {
    expect(selectores.length).toBeGreaterThan(10)
  })
  test('cada selector, cada parte de la lista, lleva [data-escala] (salvo la banda P)', () => {
    // `:not([data-escala])` no cuenta como llevarlo: es justo lo contrario.
    const sueltos = todas.filter((s) => !REGLAS_P.includes(s)).filter((s) => !s.replace(/:not\(\[data-escala\]\)/g, '').includes('[data-escala'))
    expect(sueltos).toEqual([])
  })
  test('TAB-3 · la banda P: solo sus dos reglas van sin atributo, y dentro de su @media', () => {
    expect(todas.filter((s) => s.includes(':not([data-escala])'))).toEqual(REGLAS_P)
    const bloque = css.match(/@media([^{]+)\{\s*html:not\(\[data-escala\]\)/)
    expect(bloque && bloque[1].replace(/\s+/g, ' ').trim()).toBe(MEDIA_P)
  })
})
