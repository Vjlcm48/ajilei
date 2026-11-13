// ── MES-PvP 5b · El calendario de la reposición uno a uno ───────────────────
// Ficha AJILEI_MES-PvP_Sub5b_v1.0.md §3: contra las IAS no cambia nada (instante a instante con
// `7a8c7c1`), la espera del árbitro es la duración del plan del cliente, y los vuelos entre
// personas duran lo mismo que los de las IAS escalados por el ritmo.
import { describe, expect, it } from 'vitest'
import { D_IN, D_OUT } from '../config/esperas.js'
import { anclarReposicion, calendarioReposicion, planReposicionPvP, vueloDescarte } from './reposicionCore.js'

// `startDiscardAnim` de `7a8c7c1` (GameTable.jsx:1638-1660), copiado al pie de la letra con sus
// constantes de entonces: los instantes de cada paso, en el orden en que se programaban.
const AI_SPEED_FACTOR = 1.25
const D7 = {
  OUT: 750, OUT_STAG: 150 * AI_SPEED_FACTOR, PAUSE: 300 * AI_SPEED_FACTOR, IN: 750,
  IN_STAG: 180 * AI_SPEED_FACTOR, SEAT_GAP: 240 * AI_SPEED_FACTOR, SKIP: 600 * AI_SPEED_FACTOR,
}
function de7a8c7c1(plan) {
  const pasos = []
  let t = 100
  plan.forEach(({ seat, indices }) => {
    const n = indices.length
    pasos.push(['narra', seat, t])
    if (n === 0) { t += D7.SKIP; return }
    indices.forEach((idx, k) => pasos.push(['sale', seat, idx, t + k * D7.OUT_STAG]))
    const outEnd = t + (n - 1) * D7.OUT_STAG + D7.OUT
    indices.forEach((idx, k) => pasos.push(['entra', seat, idx, outEnd + D7.PAUSE + k * D7.IN_STAG]))
    t = outEnd + D7.PAUSE + (n - 1) * D7.IN_STAG + D7.IN + D7.SEAT_GAP
  })
  const humanDiscarded = plan.some((p) => p.seat === 0 && p.indices.length > 0)
  pasos.push(['fin', t + (humanDiscarded ? 500 : 200)])
  return pasos
}
const comoAntes = ({ pasos, fin }) => [
  ...pasos.map((p) => (p.tipo === 'narra' ? [p.tipo, p.seat, p.t] : [p.tipo, p.seat, p.idx, p.t])),
  ['fin', fin],
]
const primeras = (n) => Array.from({ length: n }, (_, k) => k)

// Un `game` rotado como el de `vistaAMesa`, con lo que lee el plan.
const mesa = (cuantas, manoIndex) => ({ players: cuantas.map(() => ({})), manoIndex, descarte: { cuantas } })

describe('5b · contra las IAS, el calendario es el de 7a8c7c1', () => {
  // Las 12 combinaciones de la tabla B.3 de la Fase 0 (mesas de 2 a 5, todos 1, 3 y 5), con el
  // propio descartando y sin descartar, y con la Mano en cada asiento.
  for (const N of [2, 3, 4, 5]) {
    for (const n of [1, 3, 5]) {
      it(`mesa de ${N}, todos ${n}: instante a instante`, () => {
        for (let mano = 0; mano < N; mano++) {
          for (const propio of [n, 0]) {
            const plan = Array.from({ length: N }, (_, o) => {
              const seat = (mano + o) % N
              return { seat, indices: primeras(seat === 0 ? propio : n) }
            })
            expect(comoAntes(calendarioReposicion(plan))).toEqual(de7a8c7c1(plan))
          }
        }
      })
    }
  }

  it('las cifras de la tabla B.3, en Normal y en Rápido', () => {
    const espera = (N, n, f) => calendarioReposicion(Array.from({ length: N }, (_, s) => ({ seat: s, indices: primeras(n) })), f).espera
    expect([2, 3, 4, 5].map((N) => espera(N, 1, 1))).toEqual([4950, 7125, 9300, 11475])
    expect([2, 3, 4, 5].map((N) => espera(N, 3, 1))).toEqual([6600, 9600, 12600, 15600])
    expect([2, 3, 4].map((N) => espera(N, 5, 1))).toEqual([8250, 12075, 15900])
    expect([2, 3, 4, 5].map((N) => espera(N, 1, 0.5))).toEqual([2775, 3863, 4950, 6038])
    expect([2, 3, 4, 5].map((N) => espera(N, 3, 0.5))).toEqual([3600, 5100, 6600, 8100])
    expect([2, 3, 4, 5].map((N) => espera(N, 0, 1))).toEqual([2100, 2850, 3600, 4350])
  })
})

describe('5b · el plan entre personas', () => {
  it('va de la Mano al Pie, se salta los `null`, y el propio usa su selección si cuadra', () => {
    const game = mesa([2, null, 0, 1], 2)
    expect(planReposicionPvP(game, [1, 4])).toEqual([
      { seat: 2, indices: [] },
      { seat: 3, indices: [0] },
      { seat: 0, indices: [1, 4] },
    ])
    expect(planReposicionPvP(game, [3])[2]).toEqual({ seat: 0, indices: [0, 1] })
  })

  it('el teléfono tardío arranca a la hora del árbitro: lo vencido ya no espera', () => {
    const pasos = [{ t: 100 }, { t: 2000 }, { t: 5000 }]
    expect(anclarReposicion(pasos, 8500, 10000).map((p) => p.en)).toEqual([-1400, 500, 3500])
    // Una ancla en el futuro (el desfase se pasó) no retrasa: arranca ya.
    expect(anclarReposicion(pasos, 10300, 10000).map((p) => p.en)).toEqual([100, 2000, 5000])
  })
})

describe('5b · los vuelos entre personas duran lo que los de las IAS (decisión 3 del STOP-L)', () => {
  it('0,75 · f, el mismo número que el calendario usa para el vuelo', () => {
    expect(vueloDescarte()).toBe(0.75)
    expect(vueloDescarte(0.5)).toBe(0.375)
    expect(D_OUT).toBe(vueloDescarte() * 1000)
    expect(D_IN).toBe(vueloDescarte() * 1000)
  })

})
