// ── TAB-1 · la hoja de escala vive entera bajo `[data-escala]` (§1.4) ──────
// Sin atributo, ni una regla de escala.css aplica: el celular y las pantallas de
// fuera de la mesa no la evalúan. Lo único que no lleva selector son las
// @keyframes gemelas (que sin una regla que las nombre no hacen nada) y las
// @media que envuelven reglas que sí lo llevan.
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
describe('src/styles/escala.css', () => {
  const css = readFileSync(new URL('./escala.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const selectores = []
  const quitarKeyframes = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*\s*\}/g, '')
  for (const m of quitarKeyframes.matchAll(/([^{};]+)\{[^{}]*\}/g)) selectores.push(m[1].trim())
  test('se deja leer (más de diez reglas)', () => {
    expect(selectores.length).toBeGreaterThan(10)
  })
  test('cada selector, cada parte de la lista, lleva [data-escala]', () => {
    // Las comas de primer nivel separan la lista; las de dentro de :is() no.
    const partes = (s) => { const out = []; let d = 0, cur = ''; for (const c of s) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { out.push(cur); cur = '' } else cur += c } return [...out, cur] }
    const sueltos = selectores.flatMap(partes).map((s) => s.trim()).filter((s) => !s.includes('[data-escala'))
    expect(sueltos).toEqual([])
  })
})
