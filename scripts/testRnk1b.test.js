// ── RNK-1b · El cliente del fin de mano ─────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1b_v1.0.md §3 y §4. Contrato: informe de la 1a §4 y
// la migración `20261024191731_rnk1a_libro_puntos.sql`.
//
// Cuatro bloques: 1) `ajileiDe` (H-6, H-7, el 52 sólo con cinco); 2)
// `puntosDeMano` contra la tabla del normativo §2.2 y §2.4; 3) el espejo con el
// SQL de la 1a (INV-65: la regla del cliente es la del servidor, cifra a
// cifra); 4) el barrido con el MOTOR REAL, partidas enteras con eliminados:
// `ruleN === aliveCount` en cada pago (H-3), `mano` = 1, 2, 3… dentro de la
// mesa, y el AJILEI de los puntos = el de la celebración.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { createInitialState, startHand, advanceFromDeal, applyBetAction, applyDiscard, makeHandRules, PHASES } from '../src/engine/gameEngine.js'
import { accionesDe, esLegal } from '../src/engine/pozos.js'
import { createDeck, setRng as sembrarMazo, resetRng as mazoSinSembrar } from '../src/engine/deck.js'
import { setRng as sembrarIA, resetRng as iaSinSembrar, initPersonalities } from '../src/engine/aiPlayer.js'
import { isAjilei } from '../src/engine/handEvaluator.js'
import { esFaseDeApuesta } from '../src/hooks/mesaCore.js'
import { lecturaDeMano } from '../src/hooks/manoCore.js'
import { finDeMano } from '../src/hooks/mesaIACore.js'
import { ajileiDe, puntosDeMano, EXTRA_AJILEI } from '../src/lib/puntos.js'
import { NIVELES } from '../src/config/niveles.js'

const MAZO = Object.fromEntries(createDeck().map((c) => [c.id, c]))
const cartas = (...ids) => ids.map((id) => MAZO[id])
const reglas = (n) => makeHandRules(n)

// ── 1 · ajileiDe ────────────────────────────────────────────────────────────
describe('RNK-1b · ajileiDe', () => {
  const NATURAL = cartas('1-Copas', '3-Copas', '10-Copas', '11-Copas', '12-Copas')   // 11 + 4·10 = 51
  const CUATRO_41 = cartas('1-Copas', '10-Copas', '11-Copas', '12-Copas')            // 41
  const CON_COMODIN = [...CUATRO_41, MAZO['7-Oros']]

  it('el natural de 51 vale 51 en cualquier mesa', () => {
    for (const n of [2, 3, 4, 5]) expect(ajileiDe(NATURAL, reglas(n))).toBe(51)
  })

  it('el de comodín vale 52, y SÓLO con cinco vivos al barajar', () => {
    expect(ajileiDe(CON_COMODIN, reglas(5))).toBe(52)
    expect(ajileiDe(CON_COMODIN, reglas(3))).toBe(0)
    expect(ajileiDe(CON_COMODIN, reglas(2))).toBe(0)
  })

  it('H-6 · mesa de 4: cuatro del palo (41) + el 7 de Oros como comodín de 10 puntúa 51 pero NO es AJILEI', () => {
    expect(reglas(4).comodinValue).toBe(10)
    expect(ajileiDe(CON_COMODIN, reglas(4))).toBe(0)
  })

  it('H-7 · con cuatro cartas (o dos: todos se retiraron «a las 2») → 0', () => {
    expect(ajileiDe(CUATRO_41, reglas(5))).toBe(0)
    expect(ajileiDe(NATURAL.slice(0, 2), reglas(2))).toBe(0)
    expect(ajileiDe([], reglas(2))).toBe(0)
  })

  it('una mano que no es AJILEI → 0; sin cartas o sin reglas → 0', () => {
    expect(ajileiDe(cartas('1-Copas', '3-Copas', '10-Copas', '11-Copas', '12-Oros'), reglas(5))).toBe(0)
    expect(ajileiDe(cartas('1-Copas', '3-Copas', '10-Copas', '11-Copas', '6-Copas'), reglas(2))).toBe(0)   // 47, del palo
    expect(ajileiDe(undefined, reglas(2))).toBe(0)
    expect(ajileiDe(NATURAL, undefined)).toBe(0)
  })
})

// ── 2 · puntosDeMano: la tabla del normativo, entera ────────────────────────
describe('RNK-1b · puntosDeMano (normativo §2.2 y §2.4)', () => {
  const TABLA_IAS = { basico: 1, avanzado: 2, pro: 3 }
  const TABLA_HUMANOS = { 2: 5, 3: 6, 4: 7, 5: 8 }
  const EXTRA = { 0: 0, 51: 1, 52: 2 }

  it('contra las IAS: plano por reto, sin importar los sentados', () => {
    for (const [nivel, base] of Object.entries(TABLA_IAS)) {
      for (const sentados of [2, 3, 4, 5]) {
        expect(puntosDeMano({ origen: 'ias', nivel, sentados, ajilei: 0 })).toEqual({ base, extra: 0, total: base })
      }
    }
  })

  it('contra humanos: sentados + 3', () => {
    for (const [sentados, base] of Object.entries(TABLA_HUMANOS)) {
      expect(puntosDeMano({ origen: 'humanos', nivel: null, sentados: Number(sentados), ajilei: 0 }).base).toBe(base)
    }
  })

  it('el adicional: +1 por AJILEI de 51, +2 por el de 52, en los dos orígenes', () => {
    for (const [aj, extra] of Object.entries(EXTRA)) {
      const ajilei = Number(aj)
      expect(puntosDeMano({ origen: 'ias', nivel: 'pro', sentados: 5, ajilei })).toEqual({ base: 3, extra, total: 3 + extra })
      expect(puntosDeMano({ origen: 'humanos', nivel: null, sentados: 5, ajilei })).toEqual({ base: 8, extra, total: 8 + extra })
    }
  })

  it('la base contra las IAS es `NIVELES[].puntos` (`puntosDe`), la tabla plana de niveles.js', () => {
    for (const n of NIVELES) expect(puntosDeMano({ origen: 'ias', nivel: n.id, sentados: 2 }).base).toBe(n.puntos)
  })
})

// ── 3 · El espejo con el SQL de la 1a (INV-65) ──────────────────────────────
describe('RNK-1b · la regla del cliente es la del servidor, cifra a cifra', () => {
  const dir = join(process.cwd(), 'supabase', 'migrations')
  const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.includes('rnk1a_libro_puntos'))), 'utf8')

  it('`puntos_reto_ia` = la base de puntosDeMano para cada reto', () => {
    const cuerpo = /function public\.puntos_reto_ia[\s\S]*?\$fn\$;/.exec(sql)[0]
    for (const nivel of ['basico', 'avanzado', 'pro']) {
      const cifra = Number(new RegExp(`when '${nivel}'\\s+then (\\d+)`).exec(cuerpo)[1])
      expect(puntosDeMano({ origen: 'ias', nivel, sentados: 2 }).base).toBe(cifra)
    }
  })

  it('`extra_ajilei` = EXTRA_AJILEI', () => {
    const cuerpo = /function public\.extra_ajilei[\s\S]*?\$fn\$;/.exec(sql)[0]
    const m = /when 51 then (\d+) when 52 then (\d+) else (\d+)/.exec(cuerpo)
    expect({ 0: Number(m[3]), 51: Number(m[1]), 52: Number(m[2]) }).toEqual({ ...EXTRA_AJILEI })
  })

  it('el `check` del libro: ias por reto, humanos `sentados + 3`, y el extra del AJILEI', () => {
    const base = /constraint libro_puntos_base_chk[\s\S]*?end\),/.exec(sql)[0]
    expect(base).toMatch(/case nivel when 'basico' then 1 when 'avanzado' then 2 when 'pro' then 3 end/)
    expect(base).toMatch(/else sentados \+ 3/)
    expect(sql).toMatch(/libro_puntos_extra_chk\s+check \(extra = case ajilei when 51 then 1 when 52 then 2 else 0 end\)/)
    expect(sql).toMatch(/libro_puntos_ajilei52_chk\s+check \(ajilei <> 52 or sentados = 5\)/)
  })
})

// ── 4 · El barrido con el motor real ────────────────────────────────────────
function generador(semilla) {
  let s = semilla >>> 0
  return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const PESOS = { retirarse: 1, pasar: 2, igualar: 4, apostar: 3, subir: 3, allIn: 6 }

// Una partida ENTERA, mano tras mano, hasta que alguien se queda con todo (o
// el tope de manos). Devuelve cada pago en orden.
function partida(N, azar, topeManos = 80) {
  const entero = (n) => Math.floor(azar() * n)
  initPersonalities(N)
  const jug = Array.from({ length: N }, (_, i) => ({ isHuman: i === 0, chips: 10 * (5 + entero(40)), name: i === 0 ? 'Tú' : `IA ${i}` }))
  let st = createInitialState(10, jug)
  const pagos = []
  for (let manos = 0; manos < topeManos; manos++) {
    st = startHand(st)
    if (st.phase === PHASES.GAME_OVER) break
    for (let g = 0; g < 400 && st.phase !== PHASES.PAYOUT && st.phase !== PHASES.GAME_OVER; g++) {
      if (st.phase === PHASES.DEAL_2 || st.phase === PHASES.DEAL_3) st = advanceFromDeal(st)
      else if (st.phase === PHASES.DISCARD) st = applyDiscard(st, [])
      else if (esFaseDeApuesta(st.phase)) {
        const seat = st.activePlayerIndex
        const acc = accionesDe(st, seat)
        if (!acc.length) break
        const pesos = acc.map((a) => PESOS[a])
        let r = azar() * pesos.reduce((x, y) => x + y, 0)
        let a = acc[0]
        for (let i = 0; i < acc.length; i++) { r -= pesos[i]; if (r <= 0) { a = acc[i]; break } }
        const ks = [1, 2, 5, 10].filter((k) => esLegal(st, seat, a, k).ok)
        st = applyBetAction(st, seat, a, ks.length ? ks[entero(ks.length)] : 1)
      } else break
    }
    if (st.phase !== PHASES.PAYOUT) break
    pagos.push(st)
  }
  return pagos
}

describe('RNK-1b · el barrido: partidas enteras con el motor real', () => {
  const azar = generador(1976)
  beforeAll(() => { sembrarMazo(azar); sembrarIA(azar) })
  afterAll(() => { mazoSinSembrar(); iaSinSembrar() })

  for (const N of [2, 3, 4, 5]) {
    it(`mesa de ${N}: ruleN = aliveCount (H-3), mano = 1, 2, 3…, y el AJILEI de los puntos = el de la celebración`, () => {
      const cuenta = { pagos: 0, eliminadas: 0, ganadas: 0, ajileis: 0, conAjileiSinGanar: 0 }
      for (let p = 0; p < 60; p++) {
        const pagos = partida(N, azar)
        pagos.forEach((pago, i) => {
          cuenta.pagos++
          if (pago.aliveCount < N) cuenta.eliminadas++
          // H-3 · los sentados que viajan son los de la regla de la mano, y en
          // el pago coinciden con los vivos.
          expect(pago.handRules.ruleN).toBe(pago.aliveCount)
          const fin = finDeMano(pago)
          expect(fin.vivos).toBe(pago.handRules.ruleN)
          // La mano: 1 en la primera de la mesa y +1 en cada una.
          expect(fin.mano).toBe(i + 1)
          expect(fin.mano).toBe(pago.handCount)
          // El AJILEI de los puntos: sólo si gana, y el mismo que celebra la mesa.
          const lectura = lecturaDeMano(pago)
          expect(lectura.ganoHumano).toBe(fin.ganoHumano)
          if (fin.ganoHumano) {
            cuenta.ganadas++
            expect(fin.ajilei > 0).toBe(lectura.nivel === 'ajilei')
          } else {
            expect(fin.ajilei).toBe(0)
            if (isAjilei(pago.players[0].cards, pago.handRules.ruleN)) cuenta.conAjileiSinGanar++
          }
          if (fin.ajilei > 0) {
            cuenta.ajileis++
            expect(isAjilei(pago.players[0].cards, pago.handRules.ruleN)).toBe(true)
            if (fin.ajilei === 52) expect(pago.handRules.ruleN).toBe(5)
          }
          const pts = puntosDeMano({ origen: 'ias', nivel: 'avanzado', sentados: fin.vivos, ajilei: fin.ajilei })
          expect(pts.total).toBe(2 + EXTRA_AJILEI[fin.ajilei])
        })
      }
      // El barrido tiene que haber pasado por lo que mide: muchos pagos, manos
      // ganadas y, en las mesas de 3 o más, pagos con eliminados.
      expect(cuenta.pagos).toBeGreaterThan(300)
      expect(cuenta.ganadas).toBeGreaterThan(50)
      if (N > 2) expect(cuenta.eliminadas).toBeGreaterThan(0)
    })
  }
})
