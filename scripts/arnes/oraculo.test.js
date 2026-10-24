import { describe, it, expect } from 'vitest'
import { asientoDeNombre, principalPorCartas } from './oraculo.mjs'
import { ganadoresPorCapa } from '../../src/engine/pozos.js'
import { composeResultado } from '../../src/hooks/resultadoCore.js'
import { PHASES } from '../../src/engine/gameEngine.js'

// VOZ-3 · D12 · el oráculo de `msg`. Dos cosas: que su desempate es el del
// motor (cruzado contra `ganadoresPorCapa`, que no se toca), y que con él el
// modo habría salido ROJO con la mesa de antes de VOZ-3 en C1, donde el
// oráculo viejo —el chip de la pantalla— salía verde.

describe('VOZ-3 · asientoDeNombre', () => {
  it('los nombres de createInitialState', () => {
    expect(asientoDeNombre('Tú')).toBe(0)
    expect(asientoDeNombre('IA')).toBe(1)
    expect(asientoDeNombre('IA 3')).toBe(3)
    expect(asientoDeNombre('Jugador')).toBe(null)
    expect(asientoDeNombre(null)).toBe(null)
  })
})

describe('VOZ-3 · principalPorCartas = la capa 0 de ganadoresPorCapa', () => {
  // Semilla fija (mulberry32), como el barrido de testVoz3.
  let s = 11
  const azar = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const entero = (k) => Math.floor(azar() * k)

  it('5.000 mesas al azar, con empates forzados', () => {
    let empates = 0
    for (let m = 0; m < 5000; m++) {
      const n = 2 + entero(4)
      // Puntos de un abanico corto para que los empates abunden.
      const puntos = Array.from({ length: n }, () => 40 + entero(4))
      const folded = Array.from({ length: n }, () => azar() < 0.25)
      if (folded.every(Boolean)) folded[entero(n)] = false
      const mano = entero(n)
      const players = puntos.map((p, i) => ({ contribMano: 100, folded: folded[i], allIn: false }))
      const motor = ganadoresPorCapa({ players, manoIndex: mano }, (_, i) => puntos[i])[0]
      const finalistas = puntos.map((p, i) => ({ asiento: i, puntos: p })).filter((f) => !folded[f.asiento])
      if (finalistas.filter((f) => f.puntos === Math.max(...finalistas.map((x) => x.puntos))).length > 1) empates++
      expect(principalPorCartas(finalistas, mano, n)).toBe(motor)
    }
    // Un verde mide lo que dice: el desempate se ejercitó de verdad.
    expect(empates).toBeGreaterThan(1000)
  })

  it('sin finalistas o sin la Mano no decide', () => {
    expect(principalPorCartas([], 0, 2)).toBe(null)
    expect(principalPorCartas([{ asiento: 0, puntos: 41 }], null, 2)).toBe(null)
  })
})

// C1 en la mesa de 2, tal como lo pintaba la mesa ANTES de VOZ-3: la captura
// `hoy_C1_m2_390x844` del STOP-A de la Fase 1 (dist de `5fad6d9`). El humano,
// all-in corto, tenía Copas 41; la IA, Bastos 21 y el sobrante. La mesa ponía
// el chip de ganador en la IA y decía:
const HOY_C1 = 'La IA gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 400 Heptacoins.'
const VOZ3_C1 = '¡Ganas con Copas, 41 pts! A la IA se le devuelven 350 Heptacoins.'
const sc = (palo, points) => ({ palo, points, suitScores: { [palo]: points } })
const PLAYERS = [
  { id: 0, name: 'Tú', isHuman: true, cards: [], score: sc('Copas', 41) },
  { id: 1, name: 'IA', isHuman: false, cards: [], score: sc('Bastos', 21) },
]
// Lo que hace `msgAuditaMano` con un pozo partido: compone el resultado con el
// ganador que le da su oráculo y exige que la frase EMPIECE por él.
const esperado = (winner) => composeResultado({ phase: PHASES.PAYOUT, winner, players: PLAYERS, numPlayers: 2, manoIndex: 0, ruleN: 2 }).texto
const coincide = (texto, winner) => texto.startsWith(esperado(winner))

describe('VOZ-3 · D12 · el oráculo viejo daba verde a C1; el nuevo, rojo', () => {
  const chip = 1   // el oráculo viejo: el asiento del chip de la pantalla
  const cartas = principalPorCartas([{ asiento: 0, puntos: 41 }, { asiento: 1, puntos: 21 }], 0, 2)

  it('el nuevo oráculo nombra al humano', () => expect(cartas).toBe(0))
  it('con la mesa de antes: el viejo, VERDE (el falso verde de §G.1)', () => expect(coincide(HOY_C1, chip)).toBe(true))
  it('con la mesa de antes: el nuevo, ROJO', () => expect(coincide(HOY_C1, cartas)).toBe(false))
  it('con la mesa de VOZ-3: el nuevo, VERDE', () => expect(coincide(VOZ3_C1, cartas)).toBe(true))
})
