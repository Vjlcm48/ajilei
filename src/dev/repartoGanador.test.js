import { describe, it, expect, afterEach } from 'vitest'
import { ordenGanador, tiradasPara, armarRepartoGanador, ordenAllin, ordenAllinEspejo, armarRepartoAllin } from './repartoGanador.js'
import { createDeck, shuffleDeck, setRng, resetRng } from '../engine/deck.js'
import { getBestSuitScore, isAjilei, getComodinValue } from '../engine/handEvaluator.js'
import { maxDiscard, createInitialState, startHand, advanceFromDeal, applyDiscard, applyBetAction, PHASES } from '../engine/gameEngine.js'
import { accionesDe } from '../engine/pozos.js'
import { setRng as sembrarIA, resetRng as iaSinSembrar, initPersonalities } from '../engine/aiPlayer.js'
import { esFaseDeApuesta } from '../hooks/mesaCore.js'
import { lecturaDeMano, resultadoDeMano } from '../hooks/manoCore.js'
import { componeCapas } from '../hooks/cronicaCore.js'

// ARN-3d §2.5 (D14) · el molde `?apu=gana`. Se comprueba contra el barajado y el
// evaluador REALES (que no se tocan): que la baraja sale exacta, y que con ella
// el humano no puede perder la primera mano salvo en el caso declarado.
const CARTAS = Object.fromEntries(createDeck().map((c) => [c.id, c]))

afterEach(() => { resetRng(); iaSinSembrar() })

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

// ── VOZ-3 · D13 · `?apu=allin` (C1) y `?apu=allin-espejo` (C3) ────────────────
const posiciones = (seat, n) => [0, 1, 2, 3, 4].map((r) => r * n + seat)
const manoDe = (T, seat, n) => posiciones(seat, n).map((p) => CARTAS[T[p]])
const puntos = (cartas, n) => getBestSuitScore(cartas, n, getComodinValue(n) !== null).points

describe('VOZ-3 · ordenAllin y ordenAllinEspejo', () => {
  it.each([2, 3, 4, 5])('n=%i: los dos son permutaciones exactas del barajado real', (n) => {
    for (const orden of [ordenAllin(n), ordenAllinEspejo(n)]) {
      expect([...orden].sort()).toEqual(Object.keys(CARTAS).sort())
      const t = tiradasPara(orden)
      let k = 0
      setRng(() => t[k++])
      expect(shuffleDeck(createDeck()).map((c) => c.id)).toEqual(orden)
    }
  })

  it.each([2, 3, 4, 5])('n=%i, C1: el humano conserva su mano y la IA 1 nace fuerte pero por debajo', (n) => {
    const T = ordenAllin(n)
    expect(manoDe(T, 0, n)).toEqual(manoDe(ordenGanador(n), 0, n))
    const suyo = puntos(manoDe(T, 0, n), n)
    const ia1 = puntos(manoDe(T, 1, n), n)
    expect(ia1).toBeGreaterThanOrEqual(40)
    expect(ia1).toBeLessThan(suyo)
    // Lo que las IAS pueden tocar no pasa del humano (empatar es suyo: es la Mano).
    const alcance = 2 * n + 3 * n + (n - 1) * maxDiscard(n)
    const humano = posiciones(0, n).map((p) => T[p])
    expect(techo(T.slice(0, alcance).filter((id) => !humano.includes(id)).map((id) => CARTAS[id]), n)).toBeLessThanOrEqual(suyo)
  })

  it.each([2, 3, 4, 5])('n=%i, C3: la IA 1 tiene la mano del humano de `ordenGanador` y el humano una floja', (n) => {
    const T = ordenAllinEspejo(n)
    expect(manoDe(T, 1, n)).toEqual(manoDe(ordenGanador(n), 0, n))
    expect(puntos(manoDe(T, 0, n), n)).toBeLessThanOrEqual(21)
  })

  // El camino de verdad en la mesa de 2, con el motor: el reparto armado como
  // lo arma el molde, las pilas sembradas como las siembra (`siembraAPU`), y el
  // guion de la prueba de Victor (§4): en C1 la IA abre y el humano contesta
  // con su All-in; en C3 el humano abre y la IA contesta con el suyo. Lo demás,
  // pasar o igualar. La frase es la que la mesa pinta (`GameTable`).
  function mano(espejo) {
    armarRepartoAllin(2, espejo)
    let a = 0x2468ace
    sembrarIA(() => { a = (a * 1103515245 + 12345) >>> 0; return a / 4294967296 })
    initPersonalities(2)
    const unit = 100
    const jug = [{ isHuman: true, chips: espejo ? 5000 : 150, name: 'Tú' }, { isHuman: false, chips: espejo ? 150 : 5000, name: 'IA' }]
    let st = startHand(createInitialState(unit, jug))
    let abrio = false
    for (let g = 0; g < 100 && st.phase !== PHASES.PAYOUT; g++) {
      if (st.phase === PHASES.DEAL_2 || st.phase === PHASES.DEAL_3) st = advanceFromDeal(st)
      else if (st.phase === PHASES.DISCARD) st = applyDiscard(st, [])
      else if (esFaseDeApuesta(st.phase)) {
        const seat = st.activePlayerIndex
        const acc = accionesDe(st, seat)
        const abre = seat === (espejo ? 0 : 1)
        const a = abre && !abrio && acc.includes('apostar') ? 'apostar'
          : acc.includes('allIn') && !abre ? 'allIn'
            : acc.includes('pasar') ? 'pasar' : 'igualar'
        if (a === 'apostar') abrio = true
        st = applyBetAction(st, seat, a, 1)
      } else break
    }
    expect(st.phase).toBe(PHASES.PAYOUT)
    const lectura = lecturaDeMano(st)
    const r = resultadoDeMano(st, lectura)
    return { lectura, tono: r.tono, frase: [r.texto, componeCapas(lectura, st.players)].filter(Boolean).join(' ') }
  }

  it('C1 en la mesa de 2: «¡Ganas con…! A la IA se le devuelven…», en verde', () => {
    const { lectura, tono, frase } = mano(false)
    expect(lectura.principal).toBe(0)
    expect(tono).toBe('gana')
    expect(frase).toBe('¡Ganas con Copas, 50 pts! A la IA se le devuelven 50 Heptacoins.')
  })

  it('C3 en la mesa de 2: «La IA gana con… Se te devuelven…», en rojo', () => {
    const { lectura, tono, frase } = mano(true)
    expect(lectura.principal).toBe(1)
    expect(tono).toBe('pierde')
    expect(frase).toBe('La IA gana con Copas, 50 pts. Se te devuelven 50 Heptacoins.')
  })
})
