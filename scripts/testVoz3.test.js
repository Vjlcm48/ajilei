// ── VOZ-3 · La voz del All-in ───────────────────────────────────────────────
// Rector: AJILEI_VOZ-3_Fase1_v1.0.md (D1–D11). Informe de la Fase 0:
// docs/reportes/AJILEI_VOZ-3_Fase0_Informe_v1.0.md, §C (la matriz) y §D (la regla).
//
// Todo con el MOTOR REAL: cada caso es un estado a mitad de `BET_3` construido a
// mano, y la última acción va por `applyBetAction`, que lleva sola a
// `doShowdown` (o a `resolveWinner`). Así lo que se juzga es el `PAYOUT` que la
// mesa recibe de verdad, con su `winner` de la capa de arriba incluido.
//
// Cuatro bloques: 1) la matriz C1–C10 en las mesas donde aplica; 2) el control
// al byte con una sola capa (D11), contra la voz de ANTES de VOZ-3 tomada el
// 2026-10-23 sobre `5fad6d9`; 3) el barrido por semilla (D8, el cuadre del
// cobro con el motor y la concordancia con el récord del servidor); 4) la
// forma de las devoluciones (D5).

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createInitialState, applyBetAction, startHand, advanceFromDeal, applyDiscard, makeHandRules, PHASES } from '../src/engine/gameEngine.js'
import { accionesDe, esLegal } from '../src/engine/pozos.js'
import { createDeck, setRng as sembrarMazo, resetRng as mazoSinSembrar } from '../src/engine/deck.js'
import { setRng as sembrarIA, resetRng as iaSinSembrar, initPersonalities } from '../src/engine/aiPlayer.js'
import { lecturaDeMano, resultadoDeMano } from '../src/hooks/manoCore.js'
import { componeCapas } from '../src/hooks/cronicaCore.js'
import { repartoPorCapas, esFaseDeApuesta } from '../src/hooks/mesaCore.js'
import { composeResultado } from '../src/hooks/resultadoCore.js'
import { decideCelebracion } from '../src/hooks/celebracionCore.js'
import { finDeMano } from '../src/hooks/mesaIACore.js'

// ── Las manos, de fuerza fija y sin cartas repetidas ni el 7 de Oros ─────────
const MAZO = Object.fromEntries(createDeck().map(c => [c.id, c]))
const mano = (...ids) => ids.map(id => MAZO[id])
const T = {
  T1:  mano('1-Copas', '12-Copas', '11-Copas', '10-Copas', '5-Oros'),        // Copas 41
  T2:  mano('1-Espadas', '12-Espadas', '11-Espadas', '6-Oros', '2-Bastos'),   // Espadas 31
  T2b: mano('1-Oros', '12-Oros', '11-Oros', '6-Copas', '3-Bastos'),           // Oros 31
  T3:  mano('1-Bastos', '12-Bastos', '2-Copas', '2-Espadas', '2-Oros'),       // Bastos 21
  T4:  mano('11-Bastos', '6-Bastos', '4-Copas', '4-Espadas', '4-Oros'),       // Bastos 16
  T5:  mano('7-Copas', '6-Espadas', '7-Espadas', '11-Oros', '4-Bastos'),      // Espadas 13
  AJ:  mano('1-Copas', '3-Copas', '10-Copas', '11-Copas', '12-Copas'),        // AJILEI 51
}

// Un estado a mitad de BET_3. `ante` es lo que el asiento ya llevaba puesto en
// la mano (por defecto, el ante de 100); `contrib`, lo de esta ronda.
function estado(N, asientos, { currentBet, activo, mano: manoIndex = 0 }) {
  const s = createInitialState(100, N)
  const players = s.players.map((p, i) => {
    const a = asientos[i]
    const contrib = a.contrib ?? 0
    return {
      ...p, cards: T[a.t], chips: a.chips ?? 5000, contrib, contribMano: (a.ante ?? 100) + contrib,
      folded: !!a.folded, allIn: !!a.allIn, acted: !!a.acted, score: null,
    }
  })
  return {
    ...s, phase: PHASES.BET_3, handRules: makeHandRules(N), players,
    pot: players.reduce((x, p) => x + p.contribMano, 0),
    currentBet, activePlayerIndex: activo, manoIndex, pieIndex: (manoIndex + N - 1) % N,
    deck: [], handCount: 1, aliveCount: N,
  }
}

// Aplica las acciones con el motor y devuelve el pago, con lo que había antes.
function jugar(previo, acciones) {
  let st = previo
  for (const [seat, a] of acciones) st = applyBetAction(st, seat, a, 1)
  expect(st.phase).toBe(PHASES.PAYOUT)
  return st
}

// Lo que la mesa pinta y hace, con la lectura (lo mismo que `GameTable`).
function leer(pago) {
  const lectura = lecturaDeMano(pago)
  const resultado = resultadoDeMano(pago, lectura)
  const cola = componeCapas(lectura, pago.players)
  return { lectura, frase: [resultado?.texto, cola].filter(Boolean).join(' '), tono: resultado?.tono }
}

// Cuadre con el motor: lo que cobró cada asiento es la diferencia de `chips`
// entre el estado previo (más lo que puso en las acciones finales) y el pago.
function cuadra(previo, pago, lectura) {
  const puesto = pago.players.map((p, i) => p.contribMano - previo.players[i].contribMano)
  const cobroMotor = pago.players.map((p, i) => p.chips - (previo.players[i].chips - puesto[i]))
  expect(lectura.porAsiento.map(a => a.cobro)).toEqual(cobroMotor)
  expect(lectura.porAsiento.reduce((s, a) => s + a.cobro, 0)).toBe(pago.players.reduce((s, p) => s + p.contribMano, 0))
}

const fuera = (t) => ({ t, folded: true, acted: true, chips: 4900 })
const resto = (N, desde, ts = ['T4', 'T5', 'T2b']) => Array.from({ length: N - desde }, (_, j) => fuera(ts[j % ts.length]))
const IA = (N, k = 1) => (N === 2 ? 'La IA' : `IA ${k}`)
const ia = (N, k = 1) => (N === 2 ? 'la IA' : `IA ${k}`)
const devA = (N, k, m) => (N === 2 ? `A la IA se le devuelven ${m} Heptacoins.` : `A IA ${k} se le devuelven ${m} Heptacoins.`)

// ── 1 · La matriz ───────────────────────────────────────────────────────────
// Cada caso: el estado, las acciones y lo esperado. `retencion` es lo que cobra
// el principal; `dev` las devoluciones de la lectura (el principal incluido).
function matriz(N) {
  const extra = (N - 2) * 100   // los antes de los asientos que se retiraron
  const C = []
  C.push({ id: 'C1', desc: 'humano all-in corto gana la principal; la IA recupera el sobrante',
    st: estado(N, [{ t: 'T1', chips: 300 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }),
    acc: [[0, 'allIn']],
    esp: { principal: 0, frase: `¡Ganas con Copas, 41 pts! ${devA(N, 1, 700)}`, tono: 'gana', nivel: 'mano', retencion: 800 + extra, dev: [{ asiento: 1, monto: 700 }] } })
  C.push({ id: 'C2', desc: 'humano all-in corto pierde (D6: la devolución al principal no se dice)',
    st: estado(N, [{ t: 'T3', chips: 300 }, { t: 'T1', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }),
    acc: [[0, 'allIn']],
    esp: { principal: 1, frase: `${IA(N)} gana con Copas, 41 pts.`, tono: 'pierde', nivel: 'recoleccion', retencion: 1500 + extra, dev: [{ asiento: 1, monto: 700 }] } })
  C.push({ id: 'C3', desc: 'espejo: la IA all-in corta gana y al humano le vuelve el sobrante',
    st: estado(N, [{ t: 'T3', contrib: 1000, chips: 3000, acted: true }, { t: 'T1', chips: 300 }, ...resto(N, 2)], { currentBet: 1000, activo: 1 }),
    acc: [[1, 'allIn']],
    esp: { principal: 1, frase: `${IA(N)} gana con Copas, 41 pts. Se te devuelven 700 Heptacoins.`, tono: 'pierde', nivel: 'recoleccion', retencion: 800 + extra, dev: [{ asiento: 0, monto: 700 }] } })
  C.push({ id: 'C4', desc: 'la IA all-in corta pierde: el humano se lo lleva todo',
    st: estado(N, [{ t: 'T1', contrib: 1000, chips: 3000, acted: true }, { t: 'T3', chips: 300 }, ...resto(N, 2)], { currentBet: 1000, activo: 1 }),
    acc: [[1, 'allIn']],
    esp: { principal: 0, frase: '¡Ganas con Copas, 41 pts!', tono: 'gana', nivel: 'mano', retencion: 1500 + extra, dev: [{ asiento: 0, monto: 700 }] } })
  C.push({ id: 'C6a', desc: 'empate en la principal, el humano es la Mano',
    st: estado(N, [{ t: 'T2', chips: 300 }, { t: 'T2b', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0, mano: 0 }),
    acc: [[0, 'allIn']],
    esp: { principal: 0, frase: `Empate, 31 pts. Ganas por ser la Mano. ${devA(N, 1, 700)}`, tono: 'gana', nivel: 'mano', retencion: 800 + extra, dev: [{ asiento: 1, monto: 700 }] } })
  C.push({ id: 'C6b', desc: 'el mismo empate con la IA de Mano',
    st: estado(N, [{ t: 'T2', chips: 300 }, { t: 'T2b', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0, mano: 1 }),
    acc: [[0, 'allIn']],
    esp: { principal: 1, frase: `Empate, 31 pts. Gana ${ia(N)} por ser la Mano.`, tono: 'pierde', nivel: 'recoleccion', retencion: 1500 + extra, dev: [{ asiento: 1, monto: 700 }] } })
  C.push({ id: 'C10a', desc: 'AJILEI del humano en all-in corto',
    st: estado(N, [{ t: 'AJ', chips: 300 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }),
    acc: [[0, 'allIn']],
    esp: { principal: 0, frase: `¡AJILEI! Ganas con mano perfecta. ${devA(N, 1, 700)}`, tono: 'gana', nivel: 'ajilei', retencion: 800 + extra, dev: [{ asiento: 1, monto: 700 }] } })
  // C7g · la ruta de los retiros CON un all-in en pie: la capa sin elegibles
  // vuelve a quien la puso, retirados incluidos. «Retirarse» sin apuesta viva
  // es legal (`pozos.esLegal`), y es lo que la hace alcanzable.
  if (N === 2) {
    C.push({ id: 'C7g', desc: 'retiros con all-in en pie: lo de arriba vuelve al humano retirado',
      st: estado(2, [{ t: 'T1', ante: 500, chips: 3000 }, { t: 'T3', ante: 300, chips: 0, allIn: true, acted: true }], { currentBet: 0, activo: 0 }),
      acc: [[0, 'retirarse']],
      esp: { principal: 1, frase: 'Te retiras. La IA gana el pozo. Se te devuelven 200 Heptacoins.', tono: 'pierde', nivel: 'recoleccion', retencion: 600, dev: [{ asiento: 0, monto: 200 }] } })
  }
  if (N >= 3) {
    const r3 = (ts) => resto(N, 3, ts)
    C.push({ id: 'C7g', desc: 'retiros con all-in en pie: lo de arriba vuelve a los dos retirados',
      st: estado(N, [{ t: 'T1', ante: 500, chips: 3000 }, { t: 'T3', ante: 500, chips: 3000 }, { t: 'T2', ante: 300, chips: 0, allIn: true, acted: true }, ...r3(['T5'])], { currentBet: 0, activo: 0 }),
      acc: [[0, 'retirarse'], [1, 'retirarse']],
      esp: { principal: 2, frase: 'Los demás se retiran. Gana IA 2. Se te devuelven 200 Heptacoins. A IA 1 se le devuelven 200 Heptacoins.', tono: 'pierde', nivel: 'recoleccion', retencion: 900 + (N - 3) * 100, dev: [{ asiento: 0, monto: 200 }, { asiento: 1, monto: 200 }] } })
    C.push({ id: 'C7', desc: 'la capa de arriba, disputada por dos IAS; el humano gana la principal',
      st: estado(N, [{ t: 'T1', chips: 300 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, { t: 'T4', contrib: 1000, chips: 3000, acted: true }, ...r3(['T5'])], { currentBet: 1000, activo: 0 }),
      acc: [[0, 'allIn']],
      esp: { principal: 0, frase: '¡Ganas con Copas, 41 pts! El pozo se partió: IA 1 se lleva 1400.', tono: 'gana', nivel: 'mano', retencion: 1200 + (N - 3) * 100, dev: [] } })
    C.push({ id: 'C8', desc: 'el humano se retiró; all-in entre IAS',
      st: estado(N, [{ t: 'T5', folded: true, acted: true, chips: 4900 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, { t: 'T1', chips: 300 }, ...r3(['T4'])], { currentBet: 1000, activo: 2 }),
      acc: [[2, 'allIn']],
      esp: { principal: 2, frase: 'IA 2 gana con Copas, 41 pts. A IA 1 se le devuelven 700 Heptacoins.', tono: 'pierde', nivel: 'recoleccion', retencion: 800 + (N - 2) * 100, dev: [{ asiento: 1, monto: 700 }] } })
    C.push({ id: 'C10c', desc: 'principal pequeña, capa disputada grande para el humano: neutro',
      st: estado(N, [{ t: 'T2', chips: 2000 }, { t: 'T3', contrib: 2000, chips: 3000, acted: true }, { t: 'T1', contrib: 50, allIn: true, acted: true, chips: 0 }, ...r3(['T5'])], { currentBet: 2000, activo: 0 }),
      acc: [[0, 'igualar']],
      esp: { principal: 2, frase: 'IA 2 gana con Copas, 41 pts. El pozo se partió: Te llevas otros 3900 Heptacoins.', tono: 'neutro', nivel: 'recoleccion', retencion: 450 + (N - 3) * 100, dev: [] } })
    C.push({ id: 'C10f', desc: 'capa de un elegible con fichas de un retirado: vuelto y ganado, aparte',
      st: estado(N, [{ t: 'T1', ante: 300, chips: 0, allIn: true, acted: true }, { t: 'T3', ante: 600, contrib: 500, chips: 3000, acted: true }, { t: 'T4', ante: 600, chips: 3000 }, ...r3(['T5'])], { currentBet: 500, activo: 2 }),
      acc: [[2, 'retirarse']],
      esp: { principal: 0, frase: '¡Ganas con Copas, 41 pts! El pozo se partió: IA 1 se lleva 300. A IA 1 se le devuelven 800 Heptacoins.', tono: 'gana', nivel: 'mano', retencion: 900 + (N - 3) * 100, dev: [{ asiento: 1, monto: 800 }] } })
    C.push({ id: 'C10e', desc: 'el sobrante de un all-in que apostó su pila entera',
      st: estado(N, [{ t: 'T1', contrib: 200, chips: 0, allIn: true, acted: true }, { t: 'T4', chips: 3000 }, { t: 'T3', contrib: 500, chips: 0, allIn: true, acted: true }, ...r3(['T5'])], { currentBet: 500, activo: 1 }),
      acc: [[1, 'retirarse']],
      esp: { principal: 0, frase: '¡Ganas con Copas, 41 pts! A IA 2 se le devuelven 300 Heptacoins.', tono: 'gana', nivel: 'mano', retencion: 700 + (N - 3) * 100, dev: [{ asiento: 2, monto: 300 }] } })
  }
  if (N >= 4) {
    const r4 = resto(N, 4, ['T5'])
    const frase5 = `IA 3 gana con Copas, 41 pts. El pozo se partió: Te llevas otros 900 Heptacoins. IA 2 se lleva 400. A IA 1 se le devuelven 400 Heptacoins.`
    C.push({ id: 'C5', desc: 'el humano gana una capa intermedia: neutro',
      st: estado(N, [{ t: 'T2', chips: 400 }, { t: 'T4', contrib: 1000, chips: 3000, acted: true }, { t: 'T3', contrib: 600, allIn: true, acted: true, chips: 0 }, { t: 'T1', contrib: 100, allIn: true, acted: true, chips: 0 }, ...r4], { currentBet: 1000, activo: 0 }),
      acc: [[0, 'allIn']],
      esp: { principal: 3, frase: frase5, tono: 'neutro', nivel: 'recoleccion', retencion: 800 + (N - 4) * 100, dev: [{ asiento: 1, monto: 400 }] } })
    C.push({ id: 'C5b', desc: 'igual, con el humano peor que IA 3 pero mejor que IA 1 e IA 2',
      st: estado(N, [{ t: 'T3', chips: 400 }, { t: 'T5', contrib: 1000, chips: 3000, acted: true }, { t: 'T4', contrib: 600, allIn: true, acted: true, chips: 0 }, { t: 'T1', contrib: 100, allIn: true, acted: true, chips: 0 }, ...r4], { currentBet: 1000, activo: 0 }),
      acc: [[0, 'allIn']],
      esp: { principal: 3, frase: frase5, tono: 'neutro', nivel: 'recoleccion', retencion: 800 + (N - 4) * 100, dev: [{ asiento: 1, monto: 400 }] } })
  }
  return C
}

describe('1. La matriz C1–C10, con el motor real', () => {
  for (const N of [2, 3, 4, 5]) {
    describe(`mesa de ${N}`, () => {
      for (const c of matriz(N)) {
        it(`${c.id} · ${c.desc}`, () => {
          const pago = jugar(c.st, c.acc)
          const { lectura, frase, tono } = leer(pago)
          expect(lectura.principal).toBe(c.esp.principal)
          expect(frase).toBe(c.esp.frase)
          expect(tono).toBe(c.esp.tono)
          expect(lectura.tono).toBe(c.esp.tono)
          expect(lectura.nivel).toBe(c.esp.nivel)
          expect(lectura.destinoVuelo).toBe(c.esp.principal)
          expect(lectura.retencion).toBe(c.esp.retencion)
          expect(lectura.ganoHumano).toBe(c.esp.principal === 0)
          expect(lectura.devoluciones).toEqual(c.esp.dev)
          cuadra(c.st, pago, lectura)
          // D10 · la tarjeta y el récord del servidor dicen lo mismo.
          expect(lectura.ganoHumano).toBe(finDeMano(pago).ganoHumano)
          // El principal siempre gana fichas (D8 del rector, la lección de ECO-1).
          expect(lectura.porAsiento[lectura.principal].neto).toBeGreaterThan(0)
        })
      }
    })
  }

  it('C1 · el defecto que corrige: el motor sigue llamando ganador a quien recupera su vuelto', () => {
    const c = matriz(2).find(x => x.id === 'C1')
    const pago = jugar(c.st, c.acc)
    expect(pago.winner).toBe(1)                 // `winner` es la capa de arriba (gameEngine.js:285, :292)
    expect(lecturaDeMano(pago).principal).toBe(0)
  })
})

// ── 2 · Control al byte (D11) ───────────────────────────────────────────────
// La voz de ANTES de VOZ-3 para las manos de una sola capa, tomada con el
// código de `5fad6d9` (sonda de la Fase 0) ANTES de tocar nada. Con una sola
// capa `winner` es el principal, la cola no existe y la retención es el pozo.
const HOY = {
  C9a:  (N) => ({ frase: '¡Ganas con Copas, 41 pts!', tono: 'gana', nivel: 'mano', destino: 0, pozo: 2200 + (N - 2) * 100 }),
  C9b:  (N) => ({ frase: `${IA(N)} gana con Copas, 41 pts.`, tono: 'pierde', nivel: 'recoleccion', destino: 1, pozo: 2200 + (N - 2) * 100 }),
  C10b: (N) => ({ frase: '¡Ganas con Copas, 41 pts!', tono: 'gana', nivel: 'mano', destino: 0, pozo: 2200 + (N - 2) * 100 }),
  C7f:  (N) => ({ frase: N === 2 ? 'Te retiras. La IA gana el pozo.' : 'Los demás se retiran. Gana IA 1.', tono: 'pierde', nivel: 'recoleccion', destino: 1, pozo: 1200 + (N - 2) * 100 }),
}
const CONTROL = {
  C9a:  (N) => [estado(N, [{ t: 'T1', chips: 3000 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }), [[0, 'igualar']]],
  C9b:  (N) => [estado(N, [{ t: 'T3', chips: 3000 }, { t: 'T1', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }), [[0, 'igualar']]],
  C10b: (N) => [estado(N, [{ t: 'T1', chips: 1000 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }), [[0, 'igualar']]],
  C7f:  (N) => [estado(N, [{ t: 'T1', chips: 3000 }, { t: 'T3', contrib: 1000, chips: 3000, acted: true }, ...resto(N, 2)], { currentBet: 1000, activo: 0 }), [[0, 'retirarse']]],
}

describe('2. Control al byte: una sola capa se dice y se celebra como antes (D11)', () => {
  for (const N of [2, 3, 4, 5]) {
    for (const id of Object.keys(CONTROL)) {
      it(`mesa de ${N} · ${id}`, () => {
        const [st, acc] = CONTROL[id](N)
        const pago = jugar(st, acc)
        const { lectura, frase, tono } = leer(pago)
        const hoy = HOY[id](N)
        expect(frase).toBe(hoy.frase)
        expect(tono).toBe(hoy.tono)
        expect(lectura.nivel).toBe(hoy.nivel)
        expect(lectura.destinoVuelo).toBe(hoy.destino)
        expect(lectura.retencion).toBe(hoy.pozo)
      })
    }
  }
})

// ── 3 · El barrido ──────────────────────────────────────────────────────────
// Manos reales del motor con acciones legales al azar (semilla fija; el azar del
// mazo y de la IA, sembrado por sus propias puertas). Se pide al azar que
// provoque all-ins y, de vez en cuando, retirarse sin apuesta viva: así salen
// todas las formas de pozo partido, la capa sin elegibles incluida.
function generador(semilla) {
  let s = semilla >>> 0
  return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const PESOS = { retirarse: 1, pasar: 2, igualar: 4, apostar: 3, subir: 3, allIn: 6 }
function barrido(N, mesas, azar) {
  const pagos = []
  const entero = (n) => Math.floor(azar() * n)
  for (let m = 0; m < mesas; m++) {
    initPersonalities(N)
    const jug = Array.from({ length: N }, (_, i) => ({ isHuman: i === 0, chips: 10 * (3 + entero(60)), name: i === 0 ? 'Tú' : (N === 2 ? 'IA' : `IA ${i}`) }))
    let st = startHand(createInitialState(10, jug))
    const inicio = st.players.map(p => p.chips + p.contribMano)
    for (let g = 0; g < 400 && st.phase !== PHASES.PAYOUT && st.phase !== PHASES.GAME_OVER; g++) {
      if (st.phase === PHASES.DEAL_2 || st.phase === PHASES.DEAL_3) st = advanceFromDeal(st)
      else if (st.phase === PHASES.DISCARD) st = applyDiscard(st, [])
      else if (esFaseDeApuesta(st.phase)) {
        const seat = st.activePlayerIndex
        const acc = accionesDe(st, seat)
        if (!acc.length) break
        const pesos = acc.map(a => PESOS[a])
        let r = azar() * pesos.reduce((x, y) => x + y, 0), a = acc[0]
        for (let i = 0; i < acc.length; i++) { r -= pesos[i]; if (r <= 0) { a = acc[i]; break } }
        const ks = [1, 2, 5, 10].filter(k => esLegal(st, seat, a, k).ok)
        st = applyBetAction(st, seat, a, ks.length ? ks[entero(ks.length)] : 1)
      } else break
    }
    if (st.phase === PHASES.PAYOUT) pagos.push({ pago: st, inicio })
  }
  return pagos
}

describe('3. El barrido: 1.500 mesas por tamaño, semilla fija', () => {
  const azar = generador(7)
  beforeAll(() => { sembrarMazo(azar); sembrarIA(azar) })
  afterAll(() => { mazoSinSembrar(); iaSinSembrar() })

  for (const N of [2, 3, 4, 5]) {
    it(`mesa de ${N}: cobro = motor, principal con neto > 0, la tarjeta = el servidor, una capa = antes`, () => {
      const pagos = barrido(N, 1500, azar)
      const formas = { partidos: 0, neutro: 0, sinElegibles: 0, ajenoEnUnElegible: 0, unaCapa: 0 }
      for (const { pago, inicio } of pagos) {
        const lectura = lecturaDeMano(pago)
        expect(lectura).not.toBe(null)
        // El cobro reconstruido es el del motor, asiento por asiento, y suma el pozo.
        const cobroMotor = pago.players.map((p, i) => p.chips - (inicio[i] - p.contribMano))
        expect(lectura.porAsiento.map(a => a.cobro)).toEqual(cobroMotor)
        // D8 · quien sale como ganador tiene fichas netas a favor.
        expect(lectura.porAsiento[lectura.principal].neto).toBeGreaterThan(0)
        // D10 · «Manos ganadas» y el récord del servidor, la misma regla.
        expect(lectura.ganoHumano).toBe(finDeMano(pago).ganoHumano)
        // D4 · el tono no contradice al neto del humano.
        const netoH = lectura.porAsiento[0].neto
        if (lectura.tono === 'gana') expect(netoH).toBeGreaterThan(0)
        if (lectura.tono === 'pierde') expect(netoH).toBeLessThanOrEqual(0)
        if (lectura.tono === 'neutro') { expect(netoH).toBeGreaterThan(0); expect(lectura.principal).not.toBe(0) }

        const capas = repartoPorCapas(pago)
        if (capas.length === 1) {
          // D11 · con una sola capa, todo como antes: el `winner` del motor.
          formas.unaCapa++
          const antes = composeResultado({ phase: pago.phase, winner: pago.winner, players: pago.players, numPlayers: N, manoIndex: pago.manoIndex, ruleN: pago.handRules.ruleN })
          const r = resultadoDeMano(pago, lectura)
          expect(r).toEqual(antes)
          expect(componeCapas(lectura, pago.players)).toBe(null)
          expect(lectura.principal).toBe(pago.winner)
          expect(lectura.nivel).toBe(decideCelebracion({ phase: pago.phase, winner: pago.winner, humanCards: pago.players[0].cards, ruleN: pago.handRules.ruleN }))
          expect(lectura.retencion).toBe(pago.players.reduce((s, p) => s + p.contribMano, 0))
          continue
        }
        formas.partidos++
        if (lectura.tono === 'neutro') formas.neutro++
        if (capas.some(c => c.elegibles.length === 0)) formas.sinElegibles++
        if (lectura.porAsiento.some(a => a.sinDisputa > 0)) formas.ajenoEnUnElegible++
        // La frase nunca dice la forma vieja.
        expect(componeCapas(lectura, pago.players) ?? '').not.toMatch(/vuelven sin igualar/)
      }
      // Un verde mide lo que dice: el barrido tiene que haber pasado por las formas.
      expect(formas.unaCapa).toBeGreaterThan(100)
      expect(formas.partidos).toBeGreaterThan(50)
      if (N >= 3) {
        expect(formas.neutro).toBeGreaterThan(0)
        expect(formas.sinElegibles).toBeGreaterThan(0)
        expect(formas.ajenoEnUnElegible).toBeGreaterThan(0)
      }
    })
  }
})

// ── 4 · La forma de las devoluciones (D5) ────────────────────────────────────
describe('4. Una sola forma de decir «vuelve» (D5, D6)', () => {
  const lectura = (devoluciones, extra = {}) => ({ principal: 0, numPlayers: 3, otras: [], devoluciones, ...extra })
  const players = [{ name: 'Tú' }, { name: 'IA 1' }, { name: 'IA 2' }]

  it('en orden de asiento, sin «El pozo se partió:» cuando sólo hay devoluciones', () => {
    expect(componeCapas(lectura([{ asiento: 1, monto: 300 }, { asiento: 2, monto: 200 }], { principal: 0 }), players))
      .toBe('A IA 1 se le devuelven 300 Heptacoins. A IA 2 se le devuelven 200 Heptacoins.')
  })
  it('al humano se le habla de tú', () => {
    expect(componeCapas(lectura([{ asiento: 0, monto: 700 }], { principal: 1 }), players)).toBe('Se te devuelven 700 Heptacoins.')
  })
  it('la mesa de dos dice «la IA»', () => {
    expect(componeCapas(lectura([{ asiento: 1, monto: 700 }], { numPlayers: 2 }), [{ name: 'Tú' }, { name: 'IA' }]))
      .toBe('A la IA se le devuelven 700 Heptacoins.')
  })
  it('singular por regla, aunque hoy no se alcance', () => {
    expect(componeCapas(lectura([{ asiento: 2, monto: 1 }]), players)).toBe('A IA 2 se le devuelve 1 Heptacoin.')
    expect(componeCapas(lectura([{ asiento: 0, monto: 1 }], { principal: 1 }), players)).toBe('Se te devuelve 1 Heptacoin.')
  })
  it('D6 · la devolución al propio principal no se anuncia', () => {
    expect(componeCapas(lectura([{ asiento: 0, monto: 700 }], { principal: 0 }), players)).toBe(null)
  })
  it('la cola de APU-1 va antes que las devoluciones', () => {
    expect(componeCapas(lectura([{ asiento: 1, monto: 400 }], { principal: 2, otras: [{ asiento: 0, monto: 900 }] }), players))
      .toBe('El pozo se partió: Te llevas otros 900 Heptacoins. A IA 1 se le devuelven 400 Heptacoins.')
  })
})
