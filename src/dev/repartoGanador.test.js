import { describe, it, expect, afterEach } from 'vitest'
import { ordenGanador, tiradasPara, armarRepartoGanador } from './repartoGanador.js'
import { createDeck, shuffleDeck, setRng, resetRng } from '../engine/deck.js'
import { getBestSuitScore, isAjilei, getComodinValue } from '../engine/handEvaluator.js'
import { maxDiscard } from '../engine/gameEngine.js'

// ARN-3d §2.5 (D14) · el molde `?apu=gana`. Se comprueba contra el barajado y el
// evaluador REALES (que no se tocan): que la baraja sale exacta, y que con ella
// el humano no puede perder la primera mano salvo en el caso declarado.
const CARTAS = Object.fromEntries(createDeck().map((c) => [c.id, c]))

afterEach(() => resetRng())

// Lo que cada lado puede tener al llegar al showdown con k asientos vivos tras
// la ronda «a las 2» (el humano, siempre vivo, es la Mano: asiento 0).
function mesa(n, k) {
  const T = ordenGanador(n)
  const humano = [T[0], T[n], ...[0, k, 2 * k].map((p) => T[2 * n + p])]
  // Lo que las IAS PODRÍAN tocar entre todas: todo lo repartido que no es del
  // humano y lo que alcanzan sus descartes (k − 1 IAS, `maxDiscard` cada una).
  // Es un techo: ninguna IA puede tener más que esto junto.
  const alcance = 2 * n + 3 * k + (k - 1) * maxDiscard(n)
  const ias = T.slice(0, alcance).filter((id) => !humano.includes(id))
  return { T, humano: humano.map((id) => CARTAS[id]), ias: ias.map((id) => CARTAS[id]), alcance }
}

// El mejor resultado posible de una mano de cinco sacada de `pool`, por la
// regla del evaluador: el mejor palo (cinco cartas) o, con comodín, cuatro del
// palo más el 7 de Oros.
function techo(pool, n) {
  const com = getComodinValue(n)
  const esCom = (c) => c.palo === 'Oros' && c.value === 7
  let max = 0
  for (const palo of ['Oros', 'Copas', 'Espadas', 'Bastos']) {
    const pts = pool.filter((c) => c.palo === palo && !(com !== null && esCom(c))).map((c) => c.points).sort((a, b) => b - a)
    max = Math.max(max, pts.slice(0, 5).reduce((a, x) => a + x, 0))
    if (com !== null && pool.some(esCom)) max = Math.max(max, pts.slice(0, 4).reduce((a, x) => a + x, 0) + com)
  }
  return max
}

describe('ARN-3d · ordenGanador', () => {
  it.each([2, 3, 4, 5])('n=%i: es una permutación de las 40 cartas', (n) => {
    const T = ordenGanador(n)
    expect(T).toHaveLength(40)
    expect(new Set(T).size).toBe(40)
    expect([...T].sort()).toEqual(Object.keys(CARTAS).sort())
  })

  it('fuera de 2..5 no inventa nada', () => {
    expect(() => ordenGanador(1)).toThrow()
    expect(() => ordenGanador(6)).toThrow()
  })
})

describe('ARN-3d · tiradasPara + el barajado real', () => {
  it.each([2, 3, 4, 5])('n=%i: shuffleDeck devuelve EXACTAMENTE el orden, con 39 tiradas en [0,1)', (n) => {
    const orden = ordenGanador(n)
    const t = tiradasPara(orden)
    expect(t).toHaveLength(39)
    expect(t.every((x) => x >= 0 && x < 1)).toBe(true)
    let k = 0
    setRng(() => t[k++])
    expect(shuffleDeck(createDeck()).map((c) => c.id)).toEqual(orden)
    expect(k).toBe(39)
  })

  it('armarRepartoGanador sirve UN barajado y devuelve el azar de verdad', () => {
    armarRepartoGanador(4)
    expect(shuffleDeck(createDeck()).map((c) => c.id)).toEqual(ordenGanador(4))
    // El segundo ya no es el del molde: el generador se desarmó solo.
    let llamadas = 0
    const real = Math.random
    Math.random = () => { llamadas++; return real() }
    try { shuffleDeck(createDeck()) } finally { Math.random = real }
    expect(llamadas).toBe(39)
  })
})

describe('ARN-3d · con ese reparto el humano no pierde la primera mano', () => {
  // (n, k) con k = asientos vivos tras «a las 2». k = 1 es que todas se
  // retiraron: gana sin showdown. n=5, k=3 es el caso que el molde NO cubre
  // (ver la cabecera de repartoGanador.js).
  const casos = []
  for (const n of [2, 3, 4, 5]) for (let k = 2; k <= n; k++) if (!(n === 5 && k === 3)) casos.push([n, k])

  it.each(casos)('n=%i, k=%i: la mano del humano no es AJILEI y nadie la supera', (n, k) => {
    const { humano, ias } = mesa(n, k)
    const regla = getComodinValue(n) !== null
    const suyo = getBestSuitScore(humano, n, regla).points
    expect(isAjilei(humano, n)).toBe(false)
    expect(suyo).toBe(n === 5 ? 51 : 50)
    // Empatar le basta: en la primera mano la Mano es el humano.
    expect(techo(ias, n)).toBeLessThanOrEqual(suyo)
  })

  it.each([2, 3, 4, 5])('n=%i: las IAS nacen con manos flojas (nunca más de dos cartas de un palo)', (n) => {
    const T = ordenGanador(n)
    for (let seat = 1; seat < n; seat++) {
      const mano = [seat, n + seat, 2 * n + seat, 3 * n + seat, 4 * n + seat].map((p) => CARTAS[T[p]])
      const porPalo = {}
      for (const c of mano) porPalo[c.palo] = (porPalo[c.palo] ?? 0) + 1
      expect(Math.max(...Object.values(porPalo))).toBeLessThanOrEqual(2)
      expect(getBestSuitScore(mano, n, getComodinValue(n) !== null).points).toBeLessThanOrEqual(21)
    }
  })

  it('el caso no cubierto existe y se declara: n=5, k=3', () => {
    const { humano } = mesa(5, 3)
    expect(getBestSuitScore(humano, 5, true).points).toBeLessThan(51)
  })

  it.each([2, 3, 4])('n=%i: los cuatro Ases quedan fuera del alcance de cualquier descarte', (n) => {
    const { T, alcance } = mesa(n, n)
    for (const as of ['1-Oros', '1-Copas', '1-Espadas', '1-Bastos']) expect(T.indexOf(as)).toBeGreaterThanOrEqual(alcance)
  })
})
