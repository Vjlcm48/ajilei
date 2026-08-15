/**
 * NIV-2 · Nivel Pro — lectura de descartes (②), farol estratégico (⑥) y Ajilei
 * disimulado. Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §5.3 · §5.5 · §2.1.
 *
 * La pieza central es el §1: el TEST DE ORO DOBLE. Lleva transcrita la lógica de
 * `decideBetAction`/`decideDiscard` ANTERIOR a esta tanda —la de NIV-1, con ③ y
 * ④ dentro— y la compara decisión contra decisión para `basico` Y para
 * `avanzado`. Si cualquiera de los dos cambia en un solo caso, la tanda está mal:
 * Pro APILA, no contamina.
 *
 * Ejecutar: npm test
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  decideBetAction, decideDiscard, getPersonalityName,
  _resetForTesting, _CURVAS_PARA_TEST, _DIAG_PRO,
} from '../src/engine/aiPlayer.js'
import { getBestSuitScore, isAjilei } from '../src/engine/handEvaluator.js'
import { PALOS, VALORES, getCardPoints } from '../src/engine/deck.js'
import {
  createInitialState, startHand, advanceFromDeal, applyPlayerBetAction,
  applyAIBetAction, applyDiscard, makeHandRules, PHASES,
} from '../src/engine/gameEngine.js'

// ── Utilería ─────────────────────────────────────────────────────────────────

const carta = (value, palo) => ({ id: `${value}-${palo}`, value, palo, points: getCardPoints(value) })
const COMODIN = carta(7, 'Oros')

const M5 = {
  floja:   [carta(6,'Oros'), carta(7,'Copas'), carta(2,'Espadas'), carta(3,'Bastos'), carta(4,'Oros')],   // Oros 16
  media:   [carta(1,'Oros'), carta(2,'Oros'), carta(5,'Copas'), carta(6,'Bastos'), carta(7,'Espadas')],   // Oros 21
  fuerte:  [carta(1,'Oros'), carta(2,'Oros'), carta(3,'Oros'), carta(4,'Oros'), carta(6,'Oros')],         // Oros 47
  ajilei:  [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(5,'Copas')],    // 51
  comodin: [COMODIN, carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(6,'Copas')],
  sinComodin47: [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(6,'Copas')],
}
const M2 = {
  floja: [carta(6,'Oros'), carta(7,'Copas')],
  media: [carta(1,'Copas'), carta(10,'Espadas')],
  alta:  [carta(1,'Oros'), carta(10,'Oros')],
}

// MANOS DE DESCARTE CONOCIDO. La política es «todo lo que no sea del mejor palo»,
// así que el número de cartas cambiadas es exactamente cuántas quedan fuera del
// palo dominante. Ninguna suma 51 (no serían manos, serían Ajileis) y ninguna
// lleva el 7 de Oros (el comodín tiene su propia rama y aquí estorbaría).
const MANO_D = {
  0: [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(6,'Copas')],   // Copas 47
  1: [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(6,'Oros')],    // Copas 41
  2: [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(6,'Oros'), carta(6,'Espadas')],  // Copas 31
  3: [carta(1,'Copas'), carta(2,'Copas'), carta(6,'Oros'), carta(6,'Espadas'), carta(6,'Bastos')], // Copas 21
}

function jugador(over = {}) {
  return { id: 0, isHuman: false, cards: [], chips: 1000, contrib: 0, acted: false, folded: false, ...over }
}

function estado(over = {}) {
  const numPlayers = over.numPlayers ?? 2
  const players = over.players ?? Array.from({ length: numPlayers }, (_, i) =>
    jugador({ id: i, isHuman: i === 0, cards: M5.media }))
  return {
    players, numPlayers,
    currentBet: 0, phase: 'BET_3', manoIndex: 0, pieIndex: numPlayers - 1,
    unit: 50, handCount: 3, aliveCount: numPlayers, pot: 200,
    handRules: makeHandRules(numPlayers),
    ...over,
  }
}

// Taco falso: sólo interesa su LONGITUD, que es lo único que Pro puede mirar.
const taco = (n) => Array.from({ length: n }, (_, i) => carta(VALORES[i % 10], PALOS[i % 4]))

// NOTA sobre el temperamento: esta red NO fija perfiles con el molde
// `fijarPerfil` de NIV-1, y es deliberado. Aquel sondea llamando a
// `_resetForTesting` en bucle hasta que sale el perfil pedido — y ese reinicio
// BORRARÍA la memoria de descartes que ② acaba de anotar, que es justo lo que
// aquí se está midiendo. En su lugar las fixtures se eligieron para que la rama
// bajo prueba no dependa del temperamento: manos por debajo del `openMin` de los
// cuatro perfiles en las pruebas de farol, y decisiones que caen en el tramo de
// bote —donde los listones de personalidad no participan— en las de lectura.

const PERFILES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

// «Pagar» son dos acciones, no una: cuando la lectura sube bastante el puntaje
// efectivo, un temperamento AGRESIVO cruza además su listón de subida y sube en
// vez de igualar. Lo que las pruebas de ② afirman es PAGA contra SUELTA — la
// dirección de la decisión—, no la etiqueta exacta, que depende del reparto de
// perfiles y no de la capacidad que se está midiendo.
const PAGA = ['igualar', 'subir']

// ══ 1. TEST DE ORO DOBLE — Básico Y Avanzado, idénticos a antes de NIV-2 ═════
//
// Transcripción literal de la lógica de NIV-1 (③ + ④ incluidas). Del módulo vivo
// sólo se importa el perfil vigente y las CURVAS: las curvas son datos medidos
// que esta tanda no toca, y `scripts/testNivel1.test.js` §3 ya las re-deriva por
// enumeración exacta contra la fuente. Lo que aquí se vigila es la LÓGICA DE
// DECISIÓN, y de ésa no se importa ni una línea.
const { CURVA_FINAL, TABLA_BET_1, TABLA_BET_2 } = _CURVAS_PARA_TEST

const PERFILES_ANTES = {
  CONSERVADORA: { openMin: 32, callMin: 22, raiseMin: 40, noise: 0 },
  EQUILIBRADA:  { openMin: 28, callMin: 18, raiseMin: 34, noise: 0 },
  AGRESIVA:     { openMin: 22, callMin: 13, raiseMin: 28, noise: 0 },
  IMPREDECIBLE: { openMin: 28, callMin: 18, raiseMin: 34, noise: 0.15 },
}
const CARTAS_BARAJA_ANTES = PALOS.length * VALORES.length

function jitterAntes(value, noise) {
  if (noise === 0) return value
  return value * (1 + (Math.random() * 2 - 1) * noise)
}
function llevaComodinAntes(cards) {
  return cards.some(c => c.palo === 'Oros' && c.value === 7)
}
function probComodinAntes(state, ai, activeOpponents) {
  const { comodinValue } = state.handRules
  if (comodinValue === null) return 0
  if (llevaComodinAntes(ai.cards)) return 0
  const propias = ai.cards.length
  const desconocidas = CARTAS_BARAJA_ANTES - propias
  if (desconocidas <= 0 || activeOpponents <= 0) return 0
  return Math.min(1, (activeOpponents * propias) / desconocidas)
}
function enTablaAntes(tabla, score, k) {
  const fila = tabla.k[Math.min(Math.max(k, 1), tabla.k.length) - 1]
  const i = Math.round(score) - tabla.desde
  if (i < 0) return fila[0]
  if (i >= fila.length) return fila[fila.length - 1]
  return fila[i]
}
function equidadAntes(score, phase, activeOpponents) {
  const k = Math.max(1, activeOpponents)
  if (phase === 'BET_1') return enTablaAntes(TABLA_BET_1, score, k)
  if (phase === 'BET_2') return enTablaAntes(TABLA_BET_2, score, k)
  const i = Math.round(score) - CURVA_FINAL.desde
  const q = i < 0 ? 0 : i >= CURVA_FINAL.q.length ? 1 : CURVA_FINAL.q[i]
  return Math.pow(q, k)
}
function equidadConComodinAntes(score, phase, k, comodinValue, p) {
  const base = equidadAntes(score, phase, k)
  if (p <= 0 || comodinValue === null || base <= 0) return base
  const g  = Math.pow(base, 1 / k)
  const gc = Math.pow(equidadAntes(score - comodinValue, phase, k), 1 / k)
  return Math.pow(g, k - 1) * ((1 - p) * g + p * gc)
}
function rangoDeFaseAntes(phase) {
  if (phase === 'BET_1') return [TABLA_BET_1.desde, TABLA_BET_1.desde + TABLA_BET_1.k[0].length - 1]
  if (phase === 'BET_2') return [TABLA_BET_2.desde, TABLA_BET_2.desde + TABLA_BET_2.k[0].length - 1]
  return [CURVA_FINAL.desde, CURVA_FINAL.desde + CURVA_FINAL.q.length - 1]
}
function puntajeEquivalenteAntes(eqCorregida, score, phase, k) {
  const [lo, hi] = rangoDeFaseAntes(phase)
  for (let s = lo; s <= Math.min(hi, Math.round(score)); s++) {
    if (equidadAntes(s, phase, k) >= eqCorregida) return s
  }
  return Math.min(hi, Math.round(score))
}

function decideBetAntes(state, aiIndex, perfilName, rango) {
  const { players, currentBet, phase, manoIndex, pieIndex, unit } = state
  const ai = players[aiIndex]
  if (ai.folded) return { action: 'pasar' }
  const { ruleN } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const { points: score } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const toCall = currentBet - ai.contrib
  if (toCall > 0 && ai.chips < toCall) return { action: 'retirarse' }
  const canAffordRaise = ai.chips >= toCall + unit
  if (isAjilei(ai.cards, ruleN)) return { action: currentBet > 0 ? 'subir' : 'apostar' }

  const profile = PERFILES_ANTES[perfilName]
  const avanzado = rango >= 1
  const activeOpponents = players.filter((p, i) => i !== aiIndex && !p.folded).length
  const opponentAdj = (activeOpponents - 1) * 2
  const posAdj = pieIndex === aiIndex ? -2 : (manoIndex === aiIndex ? 1 : 0)
  const openMin  = jitterAntes(profile.openMin  + opponentAdj + posAdj, profile.noise)
  const callMin  = jitterAntes(profile.callMin  + opponentAdj + posAdj, profile.noise)
  const raiseMin = jitterAntes(profile.raiseMin + opponentAdj + posAdj, profile.noise)

  const kRivales = Math.max(1, activeOpponents)
  const pComodin = avanzado ? probComodinAntes(state, ai, activeOpponents) : 0
  const eqMano   = avanzado
    ? equidadConComodinAntes(score, phase, kRivales, state.handRules.comodinValue, pComodin)
    : 0
  const scoreEf  = pComodin > 0 ? puntajeEquivalenteAntes(eqMano, score, phase, kRivales) : score

  if (currentBet === 0) {
    if (scoreEf >= openMin && ai.chips >= unit) return { action: 'apostar' }
    return { action: 'pasar' }
  }

  const bote = state.pot ?? 0
  const boteDecide = avanzado && bote > 0
  const porIgualar = !boteDecide ? 0 : players.reduce((suma, p, i) => (
    i === aiIndex || p.folded ? suma : suma + Math.min(Math.max(currentBet - p.contrib, 0), p.chips)
  ), 0)
  const pagaElBote = boteDecide && (toCall <= 0 || eqMano >= toCall / (bote + toCall + porIgualar))

  if (phase === 'BET_1') {
    if (scoreEf >= raiseMin) return canAffordRaise ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)          return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin)  return { action: 'igualar' }
    if (toCall <= unit * 2)  return { action: 'igualar' }
    return { action: 'retirarse' }
  }
  if (phase === 'BET_2') {
    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)          return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin + 4) return { action: 'igualar' }
    if (scoreEf >= callMin)  return toCall <= unit * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }
  if (phase === 'BET_3') {
    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)          return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin + 4) return { action: 'igualar' }
    if (scoreEf >= callMin)  return toCall <= unit ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }
  if (boteDecide) return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
  return scoreEf >= callMin ? { action: 'igualar' } : { action: 'retirarse' }
}

function decideDiscardAntes(state, aiIndex, rango) {
  const ai = state.players[aiIndex]
  const { ruleN, maxDiscard: tope, comodinValue } = state.handRules
  const comodinEnabled = comodinValue !== null
  const { palo: bestSuit } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const avanzado = rango >= 1
  const indices = []
  ai.cards.forEach((card, i) => {
    const esComodin = card.palo === 'Oros' && card.value === 7
    if (esComodin && (avanzado ? comodinEnabled : ruleN === 5)) return
    if (card.palo !== bestSuit) indices.push(i)
  })
  return indices.slice(0, tope)
}

// La misma batería de NIV-1, ampliada con un taco presente en el estado: ahí es
// donde ② podría colarse si estuviera mal cerrada.
function bateria() {
  const casos = []
  for (const numPlayers of [2, 3, 4, 5]) {
    for (const phase of ['BET_1', 'BET_2', 'BET_3', 'DISCARD']) {
      const manos = phase === 'BET_1' ? Object.values(M2) : Object.values(M5)
      for (const mano of manos) {
        for (const currentBet of [0, 50, 150]) {
          for (const pot of [0, 200, 3000]) {
            for (const chips of [30, 1000]) {
              for (const asiento of [1, numPlayers - 1]) {
                for (const folded of [false, true]) {
                  const players = Array.from({ length: numPlayers }, (_, i) => jugador({
                    id: i, isHuman: i === 0,
                    cards: i === asiento ? mano : (phase === 'BET_1' ? M2.media : M5.media),
                    chips: i === asiento ? chips : 1000,
                    contrib: i === 0 ? currentBet : 0,
                    folded: i === 2 ? folded : false,
                  }))
                  casos.push({
                    players, numPlayers, currentBet, phase, pot,
                    manoIndex: 0, pieIndex: numPlayers - 1, unit: 50,
                    handCount: 3, aliveCount: numPlayers, deck: taco(15),
                    handRules: makeHandRules(numPlayers),
                    _asiento: asiento,
                  })
                }
              }
            }
          }
        }
      }
    }
  }
  return casos
}

describe('1. Test de oro doble — Básico y Avanzado son idénticos a antes de NIV-2', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each([0.05, 0.5, 0.95])('Math.random=%s · decideBetAction sin pasajero, `basico` y `avanzado`', (dado) => {
    vi.spyOn(Math, 'random').mockReturnValue(dado)
    const casos = bateria()
    expect(casos.length).toBeGreaterThan(1500)
    let comparados = 0
    for (const caso of casos) {
      const asiento = caso._asiento
      for (const [pasajero, rango] of [[undefined, 0], ['basico', 0], ['avanzado', 1]]) {
        const s = pasajero === undefined ? caso : { ...caso, nivelIA: pasajero }
        const vivo = decideBetAction(s, asiento)
        const perfil = getPersonalityName(asiento)
        const antes = decideBetAntes(s, asiento, perfil, rango)
        if (vivo.action !== antes.action) {
          throw new Error(
            `${pasajero ?? 'SIN PASAJERO'} CAMBIÓ · mesa ${caso.numPlayers} ${caso.phase} asiento ${asiento} ` +
            `perfil ${perfil} currentBet ${caso.currentBet} pot ${caso.pot} ` +
            `chips ${s.players[asiento].chips} · antes ${antes.action} → ahora ${vivo.action}`)
        }
        comparados++
      }
    }
    expect(comparados).toBe(casos.length * 3)
  })

  it('decideDiscard: mismos índices en Básico y en Avanzado', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    for (const numPlayers of [2, 3, 4, 5]) {
      for (const mano of [...Object.values(M5), ...Object.values(MANO_D)]) {
        const s = estado({
          numPlayers, phase: 'DISCARD', deck: taco(15),
          players: Array.from({ length: numPlayers }, (_, i) => jugador({ id: i, isHuman: i === 0, cards: mano })),
        })
        for (const [pasajero, rango] of [[undefined, 0], ['basico', 0], ['avanzado', 1]]) {
          const conNivel = pasajero === undefined ? s : { ...s, nivelIA: pasajero }
          expect(decideDiscard(conNivel, 1)).toEqual(decideDiscardAntes(conNivel, 1, rango))
        }
      }
    }
  })

  it('CON la memoria de descartes viva, Avanzado sigue decidiendo lo de antes', () => {
    // La batería de arriba no puede cazar una capacidad de ② que se escapara al
    // rango de Avanzado: sus estados no han pasado por ninguna ronda de descarte,
    // así que la lectura sale nula y la rama nueva queda inerte. Esta prueba tapa
    // ese hueco — monta la ronda de verdad y exige que Avanzado no se entere.
    for (const numPlayers of [2, 3, 4]) {
      for (const ds of [[0, 3, 3, 3].slice(0, numPlayers), [0, 0, 0, 0].slice(0, numPlayers)]) {
        for (const dHumano of [0, 3]) {
          for (const currentBet of [50, 200, 400]) {
            _resetForTesting()
            const s = rondaDeDescarte(numPlayers, ds, dHumano, {
              currentBet, pot: 1000, cartasEnBet3: { 1: M5.media }, nivelIA: 'avanzado' })
            const perfil = getPersonalityName(1)
            expect(decideBetAction(s, 1).action).toBe(decideBetAntes(s, 1, perfil, 1).action)
          }
        }
      }
    }
  })

  it('…y la misma lectura SÍ mueve a Pro (si no, la prueba de arriba no probaría nada)', () => {
    _resetForTesting()
    const flojos = rondaDeDescarte(4, [0, 3, 3, 3], 3, { currentBet: 200, pot: 1000, cartasEnBet3: { 1: M5.media } })
    const conPro = decideBetAction(flojos, 1).action
    _resetForTesting()
    const conAv = decideBetAction(
      rondaDeDescarte(4, [0, 3, 3, 3], 3, { currentBet: 200, pot: 1000, cartasEnBet3: { 1: M5.media }, nivelIA: 'avanzado' }),
      1).action
    expect(conPro).not.toBe(conAv)
  })

  it('Básico y Avanzado no dejan rastro en la memoria de descartes', () => {
    // Si alguno anotara, la lectura de un Pro posterior saldría contaminada.
    for (const nivel of ['basico', 'avanzado']) {
      _resetForTesting()
      const s = estado({ numPlayers: 4, phase: 'DISCARD', deck: taco(20), nivelIA: nivel,
        players: Array.from({ length: 4 }, (_, i) => jugador({ id: i, isHuman: i === 0, cards: MANO_D[3] })) })
      for (let i = 1; i < 4; i++) decideDiscard(s, i)
      // Sin memoria no hay lectura: Pro decide igual que Avanzado en el mismo estado.
      const bet = { ...s, phase: 'BET_3', currentBet: 50, deck: taco(11) }
      _resetForTesting()
      const conPro = decideBetAction({ ...bet, nivelIA: 'pro' }, 1)
      _resetForTesting()
      const conAv  = decideBetAction({ ...bet, nivelIA: 'avanzado' }, 1)
      expect(conPro.action).toBe(conAv.action)
    }
  })
})

// ══ 2. Despacho de nivel ═════════════════════════════════════════════════════
describe('2. Despacho de nivel', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  it('un nivel desconocido cae a Básico (contrato del pasajero, rector §2.2)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const s = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 150, pot: 200, deck: taco(15) })
    _resetForTesting()
    const base = decideBetAction(s, 1)
    for (const basura of ['PRO', 'experto', '', null, 3, {}]) {
      expect(decideBetAction({ ...s, nivelIA: basura }, 1).action).toBe(base.action)
    }
  })

  it('el pasajero NO se muta: la decisión no escribe en el estado', () => {
    const s = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 50, nivelIA: 'pro', deck: taco(15) })
    const copia = JSON.parse(JSON.stringify(s))
    decideBetAction(s, 1)
    decideDiscard(s, 1)
    expect(JSON.parse(JSON.stringify(s))).toEqual(copia)
  })
})

// ══ 3. La curva de ② es MEDIDA ═══════════════════════════════════════════════
describe('3. Curva de descarte', () => {
  const { CURVA_DESCARTE } = _CURVAS_PARA_TEST

  it('el tope de descarte NUNCA liga: ninguna mano de C(40,5) deja más de 3 fuera del mejor palo', () => {
    // Es el hallazgo que reduce la tabla de ocho filas a cuatro, y se demuestra
    // por enumeración EXACTA, no por muestreo. El argumento: con 5 cartas en 4
    // palos algún palo tiene ≥2, y la suma mínima de dos cartas de un palo es
    // 6+7=13, por encima del As (11); luego ningún palo de una sola carta puede
    // ser el mejor y siempre sobran ≤3.
    const paloDe = [], puntos = []
    for (const p of PALOS) for (const v of VALORES) { paloDe.push(PALOS.indexOf(p)); puntos.push(getCardPoints(v)) }
    const n = paloDe.length
    expect(n).toBe(40)

    let total = 0, maxFuera = 0
    const suma = [0, 0, 0, 0]
    const cuenta = [0, 0, 0, 0]
    const idx = [0, 0, 0, 0, 0]
    for (idx[0] = 0; idx[0] < n - 4; idx[0]++) {
      suma[paloDe[idx[0]]] += puntos[idx[0]]; cuenta[paloDe[idx[0]]]++
      for (idx[1] = idx[0] + 1; idx[1] < n - 3; idx[1]++) {
        suma[paloDe[idx[1]]] += puntos[idx[1]]; cuenta[paloDe[idx[1]]]++
        for (idx[2] = idx[1] + 1; idx[2] < n - 2; idx[2]++) {
          suma[paloDe[idx[2]]] += puntos[idx[2]]; cuenta[paloDe[idx[2]]]++
          for (idx[3] = idx[2] + 1; idx[3] < n - 1; idx[3]++) {
            suma[paloDe[idx[3]]] += puntos[idx[3]]; cuenta[paloDe[idx[3]]]++
            for (idx[4] = idx[3] + 1; idx[4] < n; idx[4]++) {
              suma[paloDe[idx[4]]] += puntos[idx[4]]; cuenta[paloDe[idx[4]]]++
              let mejor = 0
              for (let p = 1; p < 4; p++) if (suma[p] > suma[mejor]) mejor = p
              const fuera = 5 - cuenta[mejor]
              if (fuera > maxFuera) maxFuera = fuera
              total++
              suma[paloDe[idx[4]]] -= puntos[idx[4]]; cuenta[paloDe[idx[4]]]--
            }
            suma[paloDe[idx[3]]] -= puntos[idx[3]]; cuenta[paloDe[idx[3]]]--
          }
          suma[paloDe[idx[2]]] -= puntos[idx[2]]; cuenta[paloDe[idx[2]]]--
        }
        suma[paloDe[idx[1]]] -= puntos[idx[1]]; cuenta[paloDe[idx[1]]]--
      }
      suma[paloDe[idx[0]]] -= puntos[idx[0]]; cuenta[paloDe[idx[0]]]--
    }
    expect(total).toBe(658008)
    expect(maxFuera).toBe(3)
    // Y por eso la tabla tiene exactamente cuatro filas, d = 0…3.
    expect(CURVA_DESCARTE.d).toHaveLength(4)
  })

  it('respeta sus invariantes de forma', () => {
    const largo = CURVA_DESCARTE.marginal.length
    expect(CURVA_DESCARTE.desde).toBe(CURVA_FINAL.desde)
    expect(largo).toBe(CURVA_FINAL.q.length)
    for (const fila of CURVA_DESCARTE.d) {
      expect(fila).toHaveLength(largo)
      // Una CDF: no decrece nunca y vive en [0,1].
      for (let i = 0; i < largo; i++) {
        expect(fila[i]).toBeGreaterThanOrEqual(0)
        expect(fila[i]).toBeLessThanOrEqual(1)
        if (i > 0) expect(fila[i]).toBeGreaterThanOrEqual(fila[i - 1])
      }
    }
    // MÁS descartes ⇒ mano más débil ⇒ más fácil de batir, en TODO puntaje.
    for (let d = 1; d < 4; d++) {
      for (let i = 0; i < largo; i++) {
        expect(CURVA_DESCARTE.d[d][i]).toBeGreaterThanOrEqual(CURVA_DESCARTE.d[d - 1][i])
      }
    }
    // La marginal es una mezcla: queda entre el extremo fuerte y el flojo.
    for (let i = 0; i < largo; i++) {
      expect(CURVA_DESCARTE.marginal[i]).toBeGreaterThanOrEqual(CURVA_DESCARTE.d[0][i])
      expect(CURVA_DESCARTE.marginal[i]).toBeLessThanOrEqual(CURVA_DESCARTE.d[3][i])
    }
  })

  it('se re-deriva por muestreo con la dinámica real', () => {
    // Misma magnitud, medida aquí de nuevo y a menor volumen. No pretende la
    // precisión del banco (20 millones de muestras); pretende que si alguien
    // mueve una cifra a mano, esto discrepe.
    const baraja = []
    for (const p of PALOS) for (const v of VALORES) baraja.push({ palo: p, points: getCardPoints(v) })
    const DESDE = CURVA_DESCARTE.desde, ANCHO = CURVA_DESCARTE.marginal.length
    const hist = Array.from({ length: 4 }, () => new Float64Array(ANCHO))
    const bolsa = baraja.slice()
    const MUESTRAS = 400000
    for (let m = 0; m < MUESTRAS; m++) {
      for (let i = 0; i < 8; i++) {
        const j = i + Math.floor(Math.random() * (bolsa.length - i))
        const t = bolsa[i]; bolsa[i] = bolsa[j]; bolsa[j] = t
      }
      const mano = [bolsa[0], bolsa[1], bolsa[2], bolsa[3], bolsa[4]]
      const s = {}
      for (const c of mano) s[c.palo] = (s[c.palo] ?? 0) + c.points
      let pts = 0, bp = ''
      for (const k in s) if (s[k] > pts) { pts = s[k]; bp = k }
      const fuera = []
      for (let i = 0; i < 5; i++) if (mano[i].palo !== bp) fuera.push(i)
      let ptr = 5
      for (const i of fuera) mano[i] = bolsa[ptr++]
      const t = {}
      for (const c of mano) t[c.palo] = (t[c.palo] ?? 0) + c.points
      let fin = 0
      for (const k in t) if (t[k] > fin) fin = t[k]
      hist[fuera.length][fin - DESDE]++
    }
    for (let d = 0; d < 4; d++) {
      const n = hist[d].reduce((a, x) => a + x, 0)
      if (n < 20000) continue          // d=0 es demasiado raro a este volumen
      let acum = 0
      for (let i = 0; i < ANCHO; i++) {
        const q = (acum + 0.5 * hist[d][i]) / n
        acum += hist[d][i]
        expect(Math.abs(q - CURVA_DESCARTE.d[d][i])).toBeLessThan(0.02)
      }
    }
  })
})

// ══ 4. ② Memoria de descartes ════════════════════════════════════════════════
//
// Fabrica una mano completa: la ronda de descarte con un taco de longitud
// conocida, y después el estado de BET_3 con el taco ya menguado. Es exactamente
// la secuencia que `applyDiscard` produce (`gameEngine.js:495-511`).
function rondaDeDescarte(numPlayers, dPorAsiento, dHumano, over = {}) {
  const L0 = 40 - numPlayers * 5
  const players = Array.from({ length: numPlayers }, (_, i) => jugador({
    id: i, isHuman: i === 0,
    cards: i === 0 ? (over.manoHumano ?? MANO_D[3]) : MANO_D[dPorAsiento[i]],
    contrib: 0,
  }))
  const base = {
    players, numPlayers, unit: 50, manoIndex: 0, pieIndex: numPlayers - 1,
    handCount: over.handCount ?? 4, aliveCount: numPlayers, pot: over.pot ?? 400,
    handRules: makeHandRules(numPlayers), nivelIA: over.nivelIA ?? 'pro',
  }
  const sDescarte = { ...base, phase: 'DISCARD', currentBet: 0, deck: taco(L0) }
  // Reparto de perfiles ANTES del descarte, igual que en juego real: la ronda de
  // descarte llega siempre después de BET_1 y BET_2, así que cuando `applyDiscard`
  // corre los perfiles ya están puestos. Sin esta llamada, el arranque en frío de
  // `_ensurePersonalities` borraría la memoria recién anotada — cosa que en la
  // aplicación no puede ocurrir, pero en una fixture sintética sí.
  decideBetAction({ ...base, phase: 'BET_2', currentBet: 0, deck: taco(L0) }, 1)
  for (let i = 1; i < numPlayers; i++) {
    const idx = decideDiscard(sDescarte, i)
    if (idx.length !== dPorAsiento[i]) throw new Error(`fixture mala: asiento ${i} cambió ${idx.length}, se pidió ${dPorAsiento[i]}`)
  }
  const total = dPorAsiento.slice(1).reduce((a, n) => a + n, 0) + dHumano
  return {
    ...base,
    phase: 'BET_3', currentBet: over.currentBet ?? 50,
    deck: taco(L0 - total),
    players: players.map((p, i) => ({ ...p, cards: over.cartasEnBet3?.[i] ?? p.cards, contrib: i === 0 ? (over.currentBet ?? 50) : 0 })),
  }
}

describe('4. ② Memoria de descartes', () => {
  beforeEach(() => _resetForTesting())

  it('registra lo que CADA asiento IA cambió, y sólo en Pro', () => {
    const s = { ...estado({ numPlayers: 4, phase: 'DISCARD', deck: taco(20) }), nivelIA: 'pro' }
    s.players = [0, 1, 2, 3].map(i => jugador({ id: i, isHuman: i === 0, cards: MANO_D[i === 0 ? 3 : i] }))
    expect(decideDiscard(s, 1)).toHaveLength(1)
    expect(decideDiscard(s, 2)).toHaveLength(2)
    expect(decideDiscard(s, 3)).toHaveLength(3)
  })

  it('la lectura mueve la decisión: rivales que cambiaron mucho vs rivales servidos', () => {
    // Mismo estado, misma mano propia, mismo bote. Lo ÚNICO que cambia es
    // cuántas cartas cambiaron los rivales. Si Pro no leyera, no podría cambiar.
    //
    // Cada fixture se construye Y SE DECIDE en el acto: la memoria es de módulo,
    // así que montar las dos y decidir después dejaría a la segunda pisando a la
    // primera. La regla vale para toda esta sección.
    const monta = (ds, dHumano, nivel = 'pro') => {
      _resetForTesting()
      const s = rondaDeDescarte(4, ds, dHumano, { currentBet: 200, pot: 1000,
        cartasEnBet3: { 1: M5.media }, nivelIA: nivel })
      return { s, accion: decideBetAction(s, 1).action }
    }
    const flojos   = monta([0, 3, 3, 3], 3)
    const servidos = monta([0, 0, 0, 0], 0)

    // Salvo la longitud del taco, los dos estados son el mismo.
    expect(flojos.s.players[1].cards).toEqual(servidos.s.players[1].cards)
    expect(flojos.s.pot).toBe(servidos.s.pot)
    expect(flojos.s.currentBet).toBe(servidos.s.currentBet)

    // Contra rivales que reconstruyeron palo se paga; contra rivales servidos se
    // suelta. Y Avanzado, que no lee, se retira en LOS DOS.
    expect(PAGA).toContain(flojos.accion)
    expect(servidos.accion).toBe('retirarse')
    expect(monta([0, 3, 3, 3], 3, 'avanzado').accion).toBe('retirarse')
    expect(monta([0, 0, 0, 0], 0, 'avanzado').accion).toBe('retirarse')
  })

  it('deduce el descarte del HUMANO por la caída de `deck.length`', () => {
    // Mesa 2: el único rival es el humano, que nunca pasa por `decideDiscard`.
    // Todo lo que Pro sabe de él sale de la longitud del taco. Dos estados
    // idénticos salvo esa longitud, y la decisión cambia con ella.
    const monta = (dHumano) => {
      _resetForTesting()
      const s = rondaDeDescarte(2, [0, 3], dHumano, { currentBet: 400, pot: 300,
        cartasEnBet3: { 1: M5.media } })
      return { largoTaco: s.deck.length, accion: decideBetAction(s, 1).action }
    }
    const flojo   = monta(3)
    const servido = monta(0)
    expect(servido.largoTaco - flojo.largoTaco).toBe(3)
    expect(PAGA).toContain(flojo.accion)
    expect(servido.accion).toBe('retirarse')
  })

  it('sin taco no hay lectura: Pro cae a la decisión de Avanzado', () => {
    const s = rondaDeDescarte(2, [0, 3], 3, { currentBet: 400, pot: 300, cartasEnBet3: { 1: M5.media } })
    expect(PAGA).toContain(decideBetAction(s, 1).action)
    const sinTaco = { ...s }
    delete sinTaco.deck
    _resetForTesting()
    const proCiego = decideBetAction(sinTaco, 1).action
    _resetForTesting()
    expect(proCiego).toBe(decideBetAction({ ...sinTaco, nivelIA: 'avanzado' }, 1).action)
    expect(proCiego).toBe('retirarse')
  })

  it('una cuenta que no cuadra deja a Pro ciego en vez de adivinar', () => {
    const s = rondaDeDescarte(2, [0, 3], 3, { currentBet: 400, pot: 300, cartasEnBet3: { 1: M5.media } })
    // Taco IMPOSIBLE: más largo que antes de la ronda. La resta sale negativa.
    const roto = { ...s, deck: taco(100) }
    _resetForTesting()
    const ciego = decideBetAction(roto, 1).action
    _resetForTesting()
    expect(ciego).toBe(decideBetAction({ ...roto, nivelIA: 'avanzado' }, 1).action)
    expect(ciego).toBe('retirarse')
  })

  it('la memoria MUERE con la mano', () => {
    const s = rondaDeDescarte(2, [0, 3], 3, { currentBet: 400, pot: 300, cartasEnBet3: { 1: M5.media } })
    expect(PAGA).toContain(decideBetAction(s, 1).action)
    // Mismo estado, número de mano distinto. SIN reiniciar el módulo a propósito:
    // la memoria de la mano anterior sigue ahí, y lo que se exige es que Pro la
    // RECHACE por no ser de esta mano. Si aquí se llamara a `_resetForTesting`,
    // la prueba mediría el reinicio y no el límite de mano — que es justo el
    // agujero que una mutación deliberada destapó.
    const otraMano = { ...s, handCount: s.handCount + 1 }
    const sinMemoria = decideBetAction(otraMano, 1).action
    expect(sinMemoria).toBe('retirarse')
    _resetForTesting()
    expect(sinMemoria).toBe(decideBetAction({ ...otraMano, nivelIA: 'avanzado' }, 1).action)
  })

  it('la memoria MUERE con la partida, por las dos señales del rider NIV-1', () => {
    for (const nuevaPartida of [
      (s) => ({ ...s, handCount: 1 }),                                   // handCount retrocede
      (s) => ({ ...s, aliveCount: s.numPlayers + 1, numPlayers: s.numPlayers }), // aliveCount sube
    ]) {
      _resetForTesting()
      const s = rondaDeDescarte(2, [0, 3], 3, { currentBet: 400, pot: 300, handCount: 7,
        cartasEnBet3: { 1: M5.media } })
      decideBetAction(s, 1)                     // fija _lastHandCount/_lastAliveCount
      const despues = nuevaPartida(s)
      const tras = decideBetAction(despues, 1).action
      _resetForTesting()
      expect(tras).toBe(decideBetAction({ ...despues, nivelIA: 'avanzado' }, 1).action)
    }
  })

  it('`_resetForTesting` la borra, y también los contadores de diagnóstico', () => {
    const s = rondaDeDescarte(2, [0, 3], 3, { currentBet: 400, pot: 300, cartasEnBet3: { 1: M5.media } })
    decideBetAction(s, 1)
    expect(_DIAG_PRO.decisiones).toBeGreaterThan(0)
    _resetForTesting()
    expect(_DIAG_PRO.decisiones).toBe(0)
    expect(_DIAG_PRO.farolPorAsiento).toEqual({})
    // Y sin memoria, la misma llamada decide como Avanzado.
    const proCiego = decideBetAction(s, 1).action
    _resetForTesting()
    expect(proCiego).toBe(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action)
  })

  it('se indexa por `player.id`, no por la casilla: el estado espejo del banco sigue siendo válido', () => {
    // Reproduce el adaptador espejo de `bancoNiveles.mjs:165`: permuta 0↔1 y
    // remapea Mano/Pie. Con la memoria indexada por casilla, la lectura salía
    // cruzada; con `id`, la permutación es inofensiva. Se comprueba pidiendo la
    // MISMA decisión por los dos caminos.
    const s = rondaDeDescarte(4, [0, 3, 1, 3], 3, { currentBet: 200, pot: 1000, cartasEnBet3: { 2: M5.media } })
    const directa = decideBetAction(s, 2).action
    const perm = (i) => (i === 0 ? 1 : i === 1 ? 0 : i)
    const espejo = {
      ...s,
      players: s.players.map((_, i) => s.players[perm(i)]),
      manoIndex: perm(s.manoIndex), pieIndex: perm(s.pieIndex),
    }
    expect(decideBetAction(espejo, 2).action).toBe(directa)
  })
})

// ══ 5. ⑥ Farol estratégico ═══════════════════════════════════════════════════
describe('5. ⑥ Farol estratégico', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  // Duelo: un solo rival, que es donde el respaldo puede llegar a cubrir el
  // precio. Mano propia flojísima y bote gordo: sin farol, se pasa o se retira.
  function mesaDeFarol({ dRival = 3, pot = 3000, currentBet = 0, cartas = M5.floja }) {
    const L0 = 30
    const players = [
      jugador({ id: 0, isHuman: true, cards: MANO_D[dRival], contrib: currentBet }),
      jugador({ id: 1, cards: cartas, contrib: 0 }),
    ]
    const base = {
      players, numPlayers: 2, unit: 50, manoIndex: 0, pieIndex: 1,
      handCount: 4, aliveCount: 2, pot,
      handRules: makeHandRules(2), nivelIA: 'pro',
    }
    // El rival es el HUMANO: su descarte se deduce del taco, no se registra.
    const sDescarte = { ...base, phase: 'DISCARD', currentBet: 0, deck: taco(L0) }
    decideBetAction({ ...base, phase: 'BET_2', currentBet: 0, deck: taco(L0) }, 1)   // reparte perfiles
    const propio = decideDiscard(sDescarte, 1).length                                // y anota lo propio
    return { ...base, phase: 'BET_3', currentBet, deck: taco(L0 - propio - dRival) }
  }

  it('se dispara cuando la lectura y el precio lo respaldan', () => {
    const s = mesaDeFarol({ dRival: 3, pot: 3000, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)    // dado por debajo de FREC_FAROL
    expect(decideBetAction(s, 1).action).toBe('apostar')
    expect(_DIAG_PRO.farolAbre).toBeGreaterThan(0)
  })

  it('el dado manda: con el mismo respaldo y el dado alto, no farolea', () => {
    const s = mesaDeFarol({ dRival: 3, pot: 3000, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.9)    // dado por encima de FREC_FAROL
    expect(decideBetAction(s, 1).action).toBe('pasar')
  })

  it('NUNCA CIEGO: sin lectura no hay farol, por respaldado que estuviera el precio', () => {
    const s = mesaDeFarol({ dRival: 3, pot: 3000, currentBet: 0 })
    const sinTaco = { ...s }
    delete sinTaco.deck
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(decideBetAction(sinTaco, 1).action).toBe('pasar')
    expect(_DIAG_PRO.faroles).toBe(0)
  })

  it('sin respaldo de la lectura no farolea: contra un rival SERVIDO se pasa', () => {
    const s = mesaDeFarol({ dRival: 0, pot: 3000, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(decideBetAction(s, 1).action).toBe('pasar')
    expect(_DIAG_PRO.farolRespaldado).toBe(0)
  })

  it('sin bote no farolea: el premio de un farol es el bote, y no hay', () => {
    const s = mesaDeFarol({ dRival: 3, pot: 0, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(decideBetAction(s, 1).action).toBe('pasar')
  })

  it('el precio manda: bote flaco y farol caro, no se paga', () => {
    // Mismo rival y misma lectura; sólo baja el bote. El respaldo deja de cubrir
    // `costo / (costo + bote)` y el farol se apaga solo, sin umbral inventado.
    const gordo = mesaDeFarol({ dRival: 3, pot: 3000, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(decideBetAction(gordo, 1).action).toBe('apostar')
    vi.restoreAllMocks()
    _resetForTesting()
    const flaco = mesaDeFarol({ dRival: 3, pot: 30, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(decideBetAction(flaco, 1).action).toBe('pasar')
  })

  it('Básico y Avanzado no farolean jamás', () => {
    const s = mesaDeFarol({ dRival: 3, pot: 3000, currentBet: 0 })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    for (const nivel of ['basico', 'avanzado']) {
      expect(decideBetAction({ ...s, nivelIA: nivel }, 1).action).toBe('pasar')
    }
  })

  it('el farol nunca convierte una mano que iba a pagar: sólo retiros y pasos', () => {
    // Mano fuerte: la decisión base es subir/igualar y el farol no la toca.
    const s = mesaDeFarol({ dRival: 3, pot: 3000, currentBet: 200, cartas: M5.fuerte })
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const antes = _DIAG_PRO.faroles
    expect(['subir', 'igualar']).toContain(decideBetAction(s, 1).action)
    expect(_DIAG_PRO.faroles).toBe(antes)
  })
})

// ══ 6. Ajilei disimulado — EXCLUSIVO de Pro ══════════════════════════════════
describe('6. Ajilei disimulado', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  const conAjilei = (phase, currentBet, nivel, numPlayers = 2) => estado({
    numPlayers, phase, currentBet, pot: 500, nivelIA: nivel, deck: taco(15),
    players: Array.from({ length: numPlayers }, (_, i) => jugador({
      id: i, isHuman: i === 0, cards: i === 1 ? M5.ajilei : M5.media,
      contrib: i === 0 ? currentBet : 0,
    })),
  })

  it('Básico y Avanzado conservan el TELL honesto: agresión total, siempre', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)   // dado por debajo de FREC_DISIMULO
    for (const nivel of ['basico', 'avanzado']) {
      expect(decideBetAction(conAjilei('BET_2', 0, nivel), 1).action).toBe('apostar')
      expect(decideBetAction(conAjilei('BET_2', 150, nivel), 1).action).toBe('subir')
      expect(decideBetAction(conAjilei('BET_3', 150, nivel), 1).action).toBe('subir')
    }
  })

  it('Pro juega lento en fases tempranas con la frecuencia declarada', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(decideBetAction(conAjilei('BET_2', 0, 'pro'), 1).action).toBe('pasar')
    expect(decideBetAction(conAjilei('BET_2', 150, 'pro'), 1).action).toBe('igualar')
  })

  it('con el dado alto, Pro cobra igual que los otros dos', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    expect(decideBetAction(conAjilei('BET_2', 0, 'pro'), 1).action).toBe('apostar')
    expect(decideBetAction(conAjilei('BET_2', 150, 'pro'), 1).action).toBe('subir')
  })

  it('en BET_3 Pro cobra SIEMPRE: es la última ronda y no deja dinero sin recoger', () => {
    for (const dado of [0.1, 0.5, 0.9]) {
      vi.restoreAllMocks()
      vi.spyOn(Math, 'random').mockReturnValue(dado)
      expect(decideBetAction(conAjilei('BET_3', 150, 'pro'), 1).action).toBe('subir')
      expect(decideBetAction(conAjilei('BET_3', 0, 'pro'), 1).action).toBe('apostar')
    }
  })

  it('INVARIANTE ABSOLUTA: con Ajilei no se retira jamás, en ningún nivel ni fase', () => {
    for (const nivel of ['basico', 'avanzado', 'pro']) {
      for (const phase of ['BET_1', 'BET_2', 'BET_3']) {
        for (const currentBet of [0, 50, 150, 900]) {
          for (const numPlayers of [2, 3, 4, 5]) {
            for (const dado of [0.05, 0.5, 0.95]) {
              vi.restoreAllMocks()
              _resetForTesting()
              const s = conAjilei(phase, currentBet, nivel, numPlayers)
              vi.spyOn(Math, 'random').mockReturnValue(dado)
              expect(decideBetAction(s, 1).action).not.toBe('retirarse')
            }
          }
        }
      }
    }
  })

  it('la frecuencia efectiva se cuenta y queda a la vista del banco', () => {
    _resetForTesting()
    let lentas = 0
    const s = conAjilei('BET_2', 150, 'pro')
    for (let i = 0; i < 2000; i++) {
      if (decideBetAction(s, 1).action === 'igualar') lentas++
    }
    expect(lentas / 2000).toBeGreaterThan(0.4)
    expect(lentas / 2000).toBeLessThan(0.6)
    expect(_DIAG_PRO.disimulos).toBe(lentas)
    expect(_DIAG_PRO.ajileis).toBe(2000)
  })
})

// ══ 7. Re-sorteo de perfiles — conservado (rider NIV-1 §4) ═══════════════════
describe('7. El rider de NIV-1 sigue en pie con Pro', () => {
  beforeEach(() => _resetForTesting())

  it('dentro de una partida de nivel Pro el reparto no se mueve', () => {
    let s = { ...createInitialState(50, 4), nivelIA: 'pro' }
    const repartos = new Set()
    for (let h = 0; h < 30; h++) {
      s = startHand(s)
      if (s.phase === PHASES.GAME_OVER) break
      s = advanceFromDeal(s)
      const ronda = (fase) => {
        let n = 0
        while (s.phase === fase) {
          if (++n > 500) throw new Error('ronda sin converger')
          s = s.activePlayerIndex === 0
            ? applyPlayerBetAction(s, s.currentBet - s.players[0].contrib > 0 ? 'igualar' : 'pasar')
            : applyAIBetAction(s)
        }
        repartos.add(Array.from({ length: 4 }, (_, i) => getPersonalityName(i)).join('|'))
      }
      ronda(PHASES.BET_1)
      if (s.phase === PHASES.PAYOUT) continue
      s = advanceFromDeal(s); ronda(PHASES.BET_2)
      if (s.phase === PHASES.PAYOUT) continue
      s = applyDiscard(s, []); ronda(PHASES.BET_3)
    }
    expect(repartos.size).toBe(1)
  })

  it('cambiar el tamaño de mesa re-reparte (comportamiento conservado)', () => {
    decideBetAction(estado({ numPlayers: 3, phase: 'BET_1', currentBet: 50, nivelIA: 'pro' }), 1)
    expect(getPersonalityName(3)).toBeNull()
    decideBetAction(estado({ numPlayers: 5, phase: 'BET_1', currentBet: 50, nivelIA: 'pro' }), 1)
    expect(PERFILES).toContain(getPersonalityName(3))
  })

  it('una partida entera de nivel Pro corre por la API pública sin romper nada', () => {
    // Prueba de integración: es la ÚNICA vía por la que ② recibe estados reales
    // —el taco de verdad, la ronda de descarte de verdad— en toda la red.
    let s = { ...createInitialState(50, 5), nivelIA: 'pro' }
    const fichasIniciales = s.players.reduce((a, p) => a + p.chips, 0)
    let manos = 0
    for (let h = 0; h < 40; h++) {
      s = startHand(s)
      if (s.phase === PHASES.GAME_OVER) break
      s = advanceFromDeal(s)
      const ronda = (fase) => {
        let n = 0
        while (s.phase === fase) {
          if (++n > 500) throw new Error('ronda sin converger')
          s = s.activePlayerIndex === 0
            ? applyPlayerBetAction(s, s.currentBet - s.players[0].contrib > 0 ? 'igualar' : 'pasar')
            : applyAIBetAction(s)
        }
      }
      ronda(PHASES.BET_1)
      if (s.phase !== PHASES.PAYOUT) {
        s = advanceFromDeal(s); ronda(PHASES.BET_2)
        if (s.phase !== PHASES.PAYOUT) {
          s = applyDiscard(s, s.players[0].folded ? [] : [0, 1]); ronda(PHASES.BET_3)
        }
      }
      manos++
      expect(s.players.reduce((a, p) => a + p.chips, 0) + s.pot).toBe(fichasIniciales)
      expect(s.players.every(p => p.chips >= 0)).toBe(true)
      expect(s.nivelIA).toBe('pro')
    }
    expect(manos).toBeGreaterThan(10)
    // Y la capacidad se ejerció de verdad, no quedó en rama muerta.
    expect(_DIAG_PRO.conLectura).toBeGreaterThan(0)
  })
})

// ══ 8. D-5 · la frontera fina de esta tanda ══════════════════════════════════
//
// Puerta obligatoria del rector §2.1(b). NIV-2 introduce la primera lectura de
// `state.deck`, y la vigilancia tiene que demostrar LOS DOS LADOS: que se lee la
// LONGITUD y que el CONTENIDO no se toca jamás.
describe('8. D-5 · aislamiento de información', () => {
  beforeEach(() => _resetForTesting())

  function trampaJugador(over = {}) {
    const base = jugador({ ...over, __cardsAccessed: false })
    return new Proxy(base, {
      get(target, prop) {
        if (prop === 'cards') base.__cardsAccessed = true
        return target[prop]
      },
    })
  }

  // Taco instrumentado: distingue leer `.length` (permitido para Pro) de tocar
  // el CONTENIDO —índices, iteración, cualquier otra propiedad— (prohibido para
  // los tres niveles).
  function conTrampaDeMazo(s, largo = 15) {
    const marca = { longitud: false, contenido: false, propiedades: [] }
    const real = taco(largo)
    const mazo = new Proxy(real, {
      get(target, prop) {
        if (prop === 'length') marca.longitud = true
        else if (typeof prop === 'string' && prop !== 'constructor') {
          marca.contenido = true
          marca.propiedades.push(prop)
        }
        return target[prop]
      },
      has(target, prop) { marca.contenido = true; marca.propiedades.push(`has:${String(prop)}`); return prop in target },
    })
    Object.defineProperty(s, 'deck', { get() { return mazo }, configurable: true, enumerable: true })
    return marca
  }

  const FASES = [
    { phase: 'BET_1', currentBet: 0,   cards: M2.alta,    pot: 200 },
    { phase: 'BET_1', currentBet: 50,  cards: M2.floja,   pot: 200 },
    { phase: 'BET_2', currentBet: 300, cards: M5.floja,   pot: 100 },
    { phase: 'BET_2', currentBet: 50,  cards: M5.fuerte,  pot: 900 },
    { phase: 'BET_3', currentBet: 400, cards: M5.media,   pot: 300 },
    { phase: 'BET_3', currentBet: 0,   cards: M5.floja,   pot: 3000 },
    { phase: 'BET_3', currentBet: 50,  cards: M5.comodin, pot: 900 },
    { phase: 'BET_3', currentBet: 50,  cards: M5.ajilei,  pot: 900 },
    { phase: 'DISCARD', currentBet: 0, cards: M5.comodin, pot: 500 },
  ]

  function montar(numPlayers, asiento, f, nivel) {
    const trampas = []
    const players = Array.from({ length: numPlayers }, (_, i) => {
      if (i === asiento) return jugador({ id: i, cards: f.cards, contrib: 0 })
      const t = trampaJugador({ id: i, isHuman: i === 0, cards: M5.fuerte, contrib: i === 0 ? f.currentBet : 0 })
      trampas.push(t)
      return t
    })
    const s = {
      players, numPlayers, currentBet: f.currentBet, phase: f.phase, pot: f.pot,
      manoIndex: 0, pieIndex: numPlayers - 1, unit: 50,
      handCount: 4, aliveCount: numPlayers,
      handRules: makeHandRules(numPlayers), nivelIA: nivel,
    }
    return { s, trampas }
  }

  for (const numPlayers of [2, 3, 4, 5]) {
    for (const nivel of ['basico', 'avanzado', 'pro']) {
      it(`N=${numPlayers} · ${nivel}: ninguna rama lee cartas ajenas ni el CONTENIDO del taco`, () => {
        for (const f of FASES) {
          for (const asiento of [1, numPlayers - 1]) {
            _resetForTesting()
            const { s, trampas } = montar(numPlayers, asiento, f, nivel)
            const mazo = conTrampaDeMazo(s)

            if (f.phase === 'DISCARD') decideDiscard(s, asiento)
            else decideBetAction(s, asiento)

            trampas.forEach(t => expect(t.__cardsAccessed).toBe(false))
            expect({ ...mazo, propiedades: mazo.propiedades.slice(0, 5) })
              .toEqual({ longitud: mazo.longitud, contenido: false, propiedades: [] })
          }
        }
      })
    }
  }

  it('Básico y Avanzado no tocan el taco NI PARA LA LONGITUD', () => {
    for (const nivel of ['basico', 'avanzado']) {
      for (const f of FASES) {
        _resetForTesting()
        const { s } = montar(4, 1, f, nivel)
        const mazo = conTrampaDeMazo(s)
        if (f.phase === 'DISCARD') decideDiscard(s, 1)
        else decideBetAction(s, 1)
        expect(mazo.longitud).toBe(false)
      }
    }
  })

  it('Pro SÍ lee la longitud — y sólo la longitud (prueba de contraste)', () => {
    // La otra mitad de la frontera: si Pro no leyera `.length`, la capacidad ②
    // no existiría. Se exige el disparo del getter en las dos funciones.
    _resetForTesting()
    const sDescarte = estado({ numPlayers: 4, phase: 'DISCARD', nivelIA: 'pro' })
    // Perfiles repartidos antes, igual que en juego real (BET_1 y BET_2 preceden
    // siempre al descarte): en arranque en frío el rider borra la memoria.
    decideBetAction({ ...estado({ numPlayers: 4, phase: 'BET_2', nivelIA: 'pro' }), deck: taco(20) }, 1)
    const mDescarte = conTrampaDeMazo(sDescarte, 20)
    decideDiscard(sDescarte, 1)
    expect(mDescarte.longitud).toBe(true)
    expect(mDescarte.contenido).toBe(false)

    const sApuesta = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 50, nivelIA: 'pro', handCount: sDescarte.handCount })
    const mApuesta = conTrampaDeMazo(sApuesta, 17)
    decideBetAction(sApuesta, 1)
    expect(mApuesta.longitud).toBe(true)
    expect(mApuesta.contenido).toBe(false)
  })

  it('mover las cartas ajenas NO cambia nada; mover los conteos SÍ (contraste completo)', () => {
    // Molde de NIV-1 §8, extendido a la frontera nueva de esta tanda.
    const conCartas = (cartasAjenas) => {
      _resetForTesting()
      const s = rondaDeDescarte(4, [0, 3, 3, 3], 3, { currentBet: 200, pot: 1000,
        cartasEnBet3: { 1: M5.media } })
      return decideBetAction({
        ...s,
        players: s.players.map((p, i) => (i === 1 ? p : { ...p, cards: cartasAjenas })),
      }, 1).action
    }
    // Ajilei en todas las manos ajenas o basura en todas: da exactamente igual.
    expect(conCartas(M5.ajilei)).toBe(conCartas(M5.floja))

    // Y los conteos sí mueven la decisión, en las dos direcciones.
    const conConteos = (ds, dHumano) => {
      _resetForTesting()
      return decideBetAction(
        rondaDeDescarte(4, ds, dHumano, { currentBet: 200, pot: 1000, cartasEnBet3: { 1: M5.media } }), 1).action
    }
    expect(PAGA).toContain(conConteos([0, 3, 3, 3], 3))
    expect(conConteos([0, 0, 0, 0], 0)).toBe('retirarse')
  })
})
