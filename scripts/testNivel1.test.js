/**
 * NIV-1 · Nivel Avanzado — comodín completo (③) y disciplina de bote (④).
 * Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §5.2 · §5.5 · §2.1.
 *
 * La pieza central es el §1: el TEST DE ORO de Básico. Lleva transcrita la
 * lógica de `decideBetAction`/`decideDiscard` ANTERIOR a esta tanda y la compara
 * decisión contra decisión sobre una batería de fixtures. Si Básico cambia en un
 * solo caso, la tanda está mal.
 *
 * Ejecutar: npm test
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  decideBetAction, decideDiscard, getPersonalityName,
  _resetForTesting, _CURVAS_PARA_TEST,
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

// Manos de 5 cartas con puntajes conocidos y variados.
const M5 = {
  floja:   [carta(6,'Oros'), carta(7,'Copas'), carta(2,'Espadas'), carta(3,'Bastos'), carta(4,'Oros')],   // Oros 16
  media:   [carta(1,'Oros'), carta(2,'Oros'), carta(5,'Copas'), carta(6,'Bastos'), carta(7,'Espadas')],   // Oros 21
  fuerte:  [carta(1,'Oros'), carta(2,'Oros'), carta(3,'Oros'), carta(4,'Oros'), carta(6,'Oros')],         // Oros 47
  ajilei:  [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(5,'Copas')],    // 51
  // Con comodín: Copas 1+2+3+6 = 37; +10 (N=4) = 47, +11 (N=5) = 48. NO es Ajilei.
  comodin: [COMODIN, carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(6,'Copas')],
  // El gemelo SIN comodín del mismo puntaje en N=4: Copas 1+2+3+5+10 → 11+10+10+10+... ajustado abajo.
  sinComodin47: [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(6,'Copas')], // 47
}
const M2 = {
  floja: [carta(6,'Oros'), carta(7,'Copas')],                 // 7
  media: [carta(1,'Copas'), carta(10,'Espadas')],             // 11
  alta:  [carta(1,'Oros'), carta(10,'Oros')],                 // 21
  comodin: [COMODIN, carta(1,'Copas')],                       // 11 + comodinValue
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

// Fija el reparto de perfiles para que un asiento lleve el temperamento pedido.
// Sondea con el MISMO estado que va a usar la prueba: así la llamada de la
// prueba no vuelve a disparar el re-sorteo por partida y el perfil se mantiene.
//
// SIEMPRE ANTES DE MOCKEAR `Math.random`: el sorteo de perfiles sale del mismo
// generador que los dados, así que con el mock puesto el reparto se congela y
// tres de los cuatro temperamentos se vuelven inalcanzables.
function fijarPerfil(perfil, s, asiento) {
  for (let i = 0; i < 600; i++) {
    _resetForTesting()
    decideBetAction(s, asiento)
    if (getPersonalityName(asiento) === perfil) return
  }
  throw new Error(`no salió el perfil ${perfil} en 600 sorteos`)
}

const PERFILES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

// ══ 1. TEST DE ORO — la identidad de Básico ══════════════════════════════════
// Transcripción literal de la lógica anterior a NIV-1. No se importa nada del
// módulo vivo salvo el perfil vigente: si el archivo cambia, esto no cambia.
const PERFILES_ANTES = {
  CONSERVADORA: { openMin: 32, callMin: 22, raiseMin: 40, noise: 0 },
  EQUILIBRADA:  { openMin: 28, callMin: 18, raiseMin: 34, noise: 0 },
  AGRESIVA:     { openMin: 22, callMin: 13, raiseMin: 28, noise: 0 },
  IMPREDECIBLE: { openMin: 28, callMin: 18, raiseMin: 34, noise: 0.15 },
}

function jitterAntes(value, noise) {
  if (noise === 0) return value
  return value * (1 + (Math.random() * 2 - 1) * noise)
}

function decideBetAntes(state, aiIndex, perfilName) {
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
  const activeOpponents = players.filter((p, i) => i !== aiIndex && !p.folded).length
  const opponentAdj = (activeOpponents - 1) * 2
  const posAdj = pieIndex === aiIndex ? -2 : (manoIndex === aiIndex ? 1 : 0)
  const openMin  = jitterAntes(profile.openMin  + opponentAdj + posAdj, profile.noise)
  const callMin  = jitterAntes(profile.callMin  + opponentAdj + posAdj, profile.noise)
  const raiseMin = jitterAntes(profile.raiseMin + opponentAdj + posAdj, profile.noise)

  if (currentBet === 0) {
    if (score >= openMin && ai.chips >= unit) return { action: 'apostar' }
    return { action: 'pasar' }
  }
  if (phase === 'BET_1') {
    if (score >= raiseMin) return canAffordRaise ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin)  return { action: 'igualar' }
    if (toCall <= unit * 2) return { action: 'igualar' }
    return { action: 'retirarse' }
  }
  if (phase === 'BET_2') {
    if (score >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin + 4) return { action: 'igualar' }
    if (score >= callMin) return toCall <= unit * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }
  if (phase === 'BET_3') {
    if (score >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin + 4) return { action: 'igualar' }
    if (score >= callMin) return toCall <= unit ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }
  return score >= callMin ? { action: 'igualar' } : { action: 'retirarse' }
}

function decideDiscardAntes(state, aiIndex) {
  const ai = state.players[aiIndex]
  const { ruleN, maxDiscard: tope } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const { palo: bestSuit } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const indices = []
  ai.cards.forEach((card, i) => {
    if (ruleN === 5 && card.palo === 'Oros' && card.value === 7) return
    if (card.palo !== bestSuit) indices.push(i)
  })
  return indices.slice(0, tope)
}

// La batería. Barre las ramas deterministas de las cuatro fases, los cuatro
// tamaños de mesa, las tres posiciones (Mano / Pie / medio), el saldo corto, el
// retirado, el bote vacío y el bote gordo.
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
                    handCount: 3, aliveCount: numPlayers,
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

describe('1. Test de oro — Básico es idéntico a antes de NIV-1', () => {
  afterEach(() => vi.restoreAllMocks())

  // Los dados (0.6/0.7 de las subidas y el ruido ±15% de IMPREDECIBLE) se fijan
  // por mock. Tres valores: uno por debajo de ambos umbrales, uno en medio, uno
  // por encima — así se recorren los dos lados de cada rama con dado.
  it.each([0.05, 0.5, 0.95])('Math.random=%s · decideBetAction sin pasajero y con `basico`', (dado) => {
    vi.spyOn(Math, 'random').mockReturnValue(dado)
    const casos = bateria()
    expect(casos.length).toBeGreaterThan(1500)
    let comparados = 0
    for (const caso of casos) {
      const asiento = caso._asiento
      for (const pasajero of [undefined, 'basico']) {
        const s = pasajero === undefined ? caso : { ...caso, nivelIA: pasajero }
        const vivo = decideBetAction(s, asiento)
        const perfil = getPersonalityName(asiento)
        const antes = decideBetAntes(s, asiento, perfil)
        if (vivo.action !== antes.action) {
          throw new Error(
            `BÁSICO CAMBIÓ · mesa ${caso.numPlayers} ${caso.phase} asiento ${asiento} ` +
            `perfil ${perfil} currentBet ${caso.currentBet} pot ${caso.pot} ` +
            `chips ${s.players[asiento].chips} · antes ${antes.action} → ahora ${vivo.action}`)
        }
        comparados++
      }
    }
    expect(comparados).toBe(casos.length * 2)
  })

  it('decideDiscard sin pasajero y con `basico`: mismos índices', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    for (const numPlayers of [2, 3, 4, 5]) {
      for (const mano of Object.values(M5)) {
        const s = estado({
          numPlayers, phase: 'DISCARD',
          players: Array.from({ length: numPlayers }, (_, i) => jugador({ id: i, isHuman: i === 0, cards: mano })),
        })
        for (const pasajero of [undefined, 'basico']) {
          const conNivel = pasajero === undefined ? s : { ...s, nivelIA: pasajero }
          expect(decideDiscard(conNivel, 1)).toEqual(decideDiscardAntes(conNivel, 1))
        }
      }
    }
  })

  it('un nivel desconocido cae a Básico (contrato del pasajero, rector §2.2)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const s = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 150, pot: 200 })
    _resetForTesting()
    const base = decideBetAction(s, 1)
    for (const basura of ['PRO', 'experto', '', null, 3, {}]) {
      expect(decideBetAction({ ...s, nivelIA: basura }, 1).action).toBe(base.action)
    }
  })
})

// ══ 2. Despacho de nivel ═════════════════════════════════════════════════════
describe('2. Despacho de nivel', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  it('Pro hereda las capacidades de Avanzado (hermanas mayores, rector §5.5)', () => {
    // Mesa 4: el comodín está activo y Básico NO lo protege. Avanzado y Pro sí.
    const s = estado({
      numPlayers: 4, phase: 'DISCARD',
      players: Array.from({ length: 4 }, (_, i) => jugador({ id: i, isHuman: i === 0, cards: M5.comodin })),
    })
    const pos = M5.comodin.findIndex(c => c.palo === 'Oros' && c.value === 7)
    expect(decideDiscard({ ...s, nivelIA: 'basico' }, 1)).toContain(pos)
    expect(decideDiscard({ ...s, nivelIA: 'avanzado' }, 1)).not.toContain(pos)
    expect(decideDiscard({ ...s, nivelIA: 'pro' }, 1)).not.toContain(pos)
  })

  it('el pasajero NO se muta: la decisión no escribe en el estado', () => {
    const s = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 50, nivelIA: 'avanzado' })
    const copia = JSON.parse(JSON.stringify(s))
    decideBetAction(s, 1)
    decideDiscard(s, 1)
    expect(JSON.parse(JSON.stringify(s))).toEqual(copia)
  })
})

// ══ 3. Las curvas de fuerza son MEDIDAS ══════════════════════════════════════
describe('3. Curvas de fuerza', () => {
  it('la curva de mano definitiva coincide con la enumeración exacta de C(40,5)', () => {
    // Enumeración completa: 658.008 manos. Se compara contra lo escrito en
    // aiPlayer.js — si alguien mueve una cifra a mano, esto discrepa.
    const paloDe = [], puntos = []
    for (const p of PALOS) for (const v of VALORES) { paloDe.push(PALOS.indexOf(p)); puntos.push(getCardPoints(v)) }
    const n = paloDe.length
    expect(n).toBe(40)

    const cuenta = new Map()
    let total = 0
    const suma = [0, 0, 0, 0]
    for (let a = 0; a < n - 4; a++) {
      suma[paloDe[a]] += puntos[a]
      for (let b = a + 1; b < n - 3; b++) {
        suma[paloDe[b]] += puntos[b]
        for (let c = b + 1; c < n - 2; c++) {
          suma[paloDe[c]] += puntos[c]
          for (let d = c + 1; d < n - 1; d++) {
            suma[paloDe[d]] += puntos[d]
            for (let e = d + 1; e < n; e++) {
              suma[paloDe[e]] += puntos[e]
              const mejor = Math.max(suma[0], suma[1], suma[2], suma[3])
              cuenta.set(mejor, (cuenta.get(mejor) ?? 0) + 1)
              total++
              suma[paloDe[e]] -= puntos[e]
            }
            suma[paloDe[d]] -= puntos[d]
          }
          suma[paloDe[c]] -= puntos[c]
        }
        suma[paloDe[b]] -= puntos[b]
      }
      suma[paloDe[a]] -= puntos[a]
    }
    expect(total).toBe(658008)

    const { CURVA_FINAL } = _CURVAS_PARA_TEST
    const maximo = Math.max(...cuenta.keys())
    expect(CURVA_FINAL.desde + CURVA_FINAL.q.length - 1).toBe(maximo)
    let acum = 0
    for (let s = 0; s <= maximo; s++) {
      const c = cuenta.get(s) ?? 0
      const q = (acum + 0.5 * c) / total
      acum += c
      if (s < CURVA_FINAL.desde) { expect(q).toBe(0); continue }
      expect(CURVA_FINAL.q[s - CURVA_FINAL.desde]).toBeCloseTo(q, 3)
    }
  })

  it('las tablas intermedias respetan sus invariantes de forma', () => {
    const { TABLA_BET_1, TABLA_BET_2 } = _CURVAS_PARA_TEST
    for (const tabla of [TABLA_BET_1, TABLA_BET_2]) {
      expect(tabla.k).toHaveLength(4)                      // k = 1..4 rivales
      const largo = tabla.k[0].length
      for (const fila of tabla.k) {
        expect(fila).toHaveLength(largo)
        fila.forEach(v => { expect(v).toBeGreaterThan(0); expect(v).toBeLessThanOrEqual(1) })
      }
      // Más rivales, menos equidad — en TODOS los puntajes, sin excepción.
      for (let k = 1; k < 4; k++) {
        for (let i = 0; i < largo; i++) {
          expect(tabla.k[k][i]).toBeLessThan(tabla.k[k - 1][i])
        }
      }
      // El mejor puntaje de la tabla es el de mayor equidad en cada columna.
      for (const fila of tabla.k) expect(fila[largo - 1]).toBe(Math.max(...fila))
    }
    // A dos cartas la fuerza casi no separa: es el hallazgo que obligó a medir
    // por k en vez de elevar una curva. Si esto dejara de cumplirse, la tabla
    // de BET_1 ya no describe lo que su comentario dice que describe.
    const b1 = TABLA_BET_1.k[0]
    expect(Math.max(...b1) - Math.min(...b1)).toBeLessThan(0.35)
  })
})

// ══ 4. ③ Comodín en el DESCARTE ══════════════════════════════════════════════
describe('4. ③ Comodín · descarte', () => {
  beforeEach(() => _resetForTesting())

  const conMano = (numPlayers, cards) => estado({
    numPlayers, phase: 'DISCARD',
    players: Array.from({ length: numPlayers }, (_, i) => jugador({ id: i, isHuman: i === 0, cards })),
  })
  const posComodin = M5.comodin.findIndex(c => c.palo === 'Oros' && c.value === 7)

  it('N=4: Básico TIRA el comodín (punto ciego declarado, rector §5.1)', () => {
    expect(decideDiscard({ ...conMano(4, M5.comodin), nivelIA: 'basico' }, 1)).toContain(posComodin)
  })

  it('N=4: Avanzado lo PROTEGE — la corrección del punto ciego', () => {
    expect(decideDiscard({ ...conMano(4, M5.comodin), nivelIA: 'avanzado' }, 1)).not.toContain(posComodin)
  })

  it('N=5: los dos lo protegen (ahí Básico ya acertaba)', () => {
    for (const nivel of ['basico', 'avanzado']) {
      expect(decideDiscard({ ...conMano(5, M5.comodin), nivelIA: nivel }, 1)).not.toContain(posComodin)
    }
  })

  it.each([2, 3])('N=%s: sin comodín en la mesa, el 7 de Oros es carta normal en los dos niveles', (numPlayers) => {
    const s = conMano(numPlayers, M5.comodin)
    expect(s.handRules.comodinValue).toBeNull()
    // Mejor palo Copas; el 7 de Oros no es de ese palo → se descarta en ambos.
    for (const nivel of ['basico', 'avanzado']) {
      expect(decideDiscard({ ...s, nivelIA: nivel }, 1)).toContain(posComodin)
    }
  })

  it('Avanzado lee `handRules.comodinValue`, no el número 5: respeta el tope de descarte', () => {
    for (const numPlayers of [4, 5]) {
      const s = conMano(numPlayers, [COMODIN, carta(1,'Copas'), carta(2,'Espadas'), carta(3,'Bastos'), carta(4,'Copas')])
      const idx = decideDiscard({ ...s, nivelIA: 'avanzado' }, 1)
      expect(idx.length).toBeLessThanOrEqual(s.handRules.maxDiscard)
      expect(idx).not.toContain(0)   // el comodín nunca
    }
  })
})

// ══ 5. ③ Comodín en la APUESTA ═══════════════════════════════════════════════
// «Un 47-con-comodín ≠ un 47-sin» (rector §5.2). Las dos manos valen lo mismo en
// el showdown; lo que las separa es que la primera se lleva la amenaza puesta.
describe('5. ③ Comodín · apuesta', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  function mesaCon(cards, over = {}) {
    return estado({
      numPlayers: 4, phase: 'BET_3', currentBet: 400, pot: 300,
      players: Array.from({ length: 4 }, (_, i) => jugador({
        id: i, isHuman: i === 0, cards: i === 1 ? cards : M5.media,
        contrib: i === 0 ? 400 : 0,
      })),
      ...over,
    })
  }

  it('mismo puntaje (47), decisión distinta según de dónde salgan los puntos', () => {
    const conC = mesaCon(M5.comodin)
    const sinC = mesaCon(M5.sinComodin47)
    // Los dos puntajes son 47 en mesa 4 — el gemelo exacto que pide el rector.
    const pts = (s) => getBestSuitScore(s.players[1].cards, 4, true).points
    expect(pts(conC)).toBe(47)
    expect(pts(sinC)).toBe(47)

    fijarPerfil('CONSERVADORA', { ...conC, nivelIA: 'avanzado' }, 1)   // raiseMin 44
    vi.spyOn(Math, 'random').mockReturnValue(0.5)                      // el dado deja subir

    // Con el comodín EN LA MANO no hay amenaza: el 47 vale 47 y sube.
    expect(decideBetAction({ ...conC, nivelIA: 'avanzado' }, 1).action).toBe('subir')
    // Sin él, el mismo 47 vale 42 efectivos —el listón de subida queda fuera de
    // alcance— y la mano se limita a pagar. Ese es el «47-con ≠ 47-sin».
    expect(decideBetAction({ ...sinC, nivelIA: 'avanzado' }, 1).action).toBe('igualar')

    // Básico no distingue: para él los dos 47 son el mismo 47, y sube en ambos.
    expect(decideBetAction({ ...conC, nivelIA: 'basico' }, 1).action).toBe('subir')
    expect(decideBetAction({ ...sinC, nivelIA: 'basico' }, 1).action).toBe('subir')
  })

  it('la amenaza es EXACTAMENTE `comodinValue`: apagarlo devuelve la decisión de Básico', () => {
    // Aislamiento puro: mismo estado, misma mano, mismo todo. Lo único que
    // cambia es el renglón `comodinValue` del snapshot de la mano. La mano no
    // lleva el 7 de Oros, así que su puntaje es 47 en los dos casos.
    const apagado = mesaCon(M5.sinComodin47, { handRules: { ruleN: 4, comodinValue: null, maxDiscard: 5 } })
    const activo  = mesaCon(M5.sinComodin47, { handRules: { ruleN: 4, comodinValue: 10,   maxDiscard: 5 } })
    expect(getBestSuitScore(apagado.players[1].cards, 4, false).points).toBe(47)
    expect(getBestSuitScore(activo.players[1].cards, 4, true).points).toBe(47)

    fijarPerfil('CONSERVADORA', { ...apagado, nivelIA: 'avanzado' }, 1)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(decideBetAction({ ...apagado, nivelIA: 'avanzado' }, 1).action).toBe('subir')
    expect(decideBetAction({ ...activo,  nivelIA: 'avanzado' }, 1).action).toBe('igualar')
  })
})

// ══ 6. ④ Disciplina de bote ══════════════════════════════════════════════════
describe('6. ④ Disciplina de bote', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  // Mesa 2 para que el listón no lleve `opponentAdj` y la aritmética se lea sola.
  function duelo({ cards, pot, currentBet, phase = 'BET_3' }) {
    return estado({
      numPlayers: 2, phase, pot, currentBet,
      players: [
        jugador({ id: 0, isHuman: true, cards: M5.media, contrib: currentBet }),
        jugador({ id: 1, cards, contrib: 0 }),
      ],
    })
  }

  it('odds a favor: bote gordo y precio barato → iguala donde el listón crudo se retiraba', () => {
    // Puntaje 21 (equidad 0,569 contra un rival) frente a un precio de
    // 150/3150 = 4,8%. Básico se va porque `toCall > unit`; el bote no lo mira.
    const s = duelo({ cards: M5.media, pot: 3000, currentBet: 150 })
    fijarPerfil('CONSERVADORA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action).toBe('retirarse')
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action).toBe('igualar')
  })

  it('odds en contra: bote flaco y subida cara → se retira donde el listón crudo pagaba', () => {
    // Puntaje 16 frente a un precio de 600/700 = 86%: no lo paga ninguna mano.
    // Básico iguala porque 16 supera su `callMin + 4`; el precio le da igual.
    const s = duelo({ cards: M5.floja, pot: 100, currentBet: 600 })
    fijarPerfil('AGRESIVA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action).toBe('igualar')
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action).toBe('retirarse')
  })

  it('igualar GRATIS nunca se cambia por un retiro (Básico sí lo hace)', () => {
    // toCall = 0: la apuesta ya está cubierta. Retirarse ahí es regalar la mano
    // sin que nadie la cobre, y Básico lo hace en el tramo final de BET_3.
    const s = estado({
      numPlayers: 2, phase: 'BET_3', pot: 500, currentBet: 100,
      players: [
        jugador({ id: 0, isHuman: true, cards: M5.media, contrib: 100 }),
        jugador({ id: 1, cards: M5.floja, contrib: 100 }),
      ],
    })
    fijarPerfil('CONSERVADORA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action).toBe('retirarse')
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action).toBe('igualar')
  })

  it('sin bote no hay matemática de bote: cae al listón de Básico', () => {
    const s = duelo({ cards: M5.floja, pot: 0, currentBet: 600 })
    fijarPerfil('AGRESIVA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action)
      .toBe(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action)
  })

  it('no se retira una mano ganadora ante un rival que sólo iguala (partida completa)', () => {
    // Rival pasivo: nunca sube. La IA con mano fuerte no puede irse jamás.
    vi.restoreAllMocks()
    _resetForTesting()
    let s = { ...createInitialState(50, 2), nivelIA: 'avanzado' }
    let retiros = 0, manos = 0
    for (let h = 0; h < 60; h++) {
      s = startHand(s)
      if (s.phase === PHASES.GAME_OVER) break
      s = advanceFromDeal(s)
      const jugarRonda = (fase) => {
        let n = 0
        while (s.phase === fase) {
          if (++n > 500) throw new Error('ronda sin converger')
          if (s.activePlayerIndex === 0) {
            const toCall = s.currentBet - s.players[0].contrib
            s = applyPlayerBetAction(s, toCall > 0 ? 'igualar' : 'pasar')
          } else {
            const antes = s.players[1].folded
            const fuerte = getBestSuitScore(s.players[1].cards, s.handRules.ruleN,
              s.handRules.comodinValue !== null).points >= 40
            s = applyAIBetAction(s)
            if (!antes && s.players[1].folded && fuerte) retiros++
          }
        }
      }
      jugarRonda(PHASES.BET_1)
      if (s.phase !== PHASES.PAYOUT) {
        s = advanceFromDeal(s); jugarRonda(PHASES.BET_2)
        if (s.phase !== PHASES.PAYOUT) {
          s = applyDiscard(s, []); jugarRonda(PHASES.BET_3)
        }
      }
      manos++
    }
    expect(manos).toBeGreaterThan(20)
    expect(retiros).toBe(0)
  })
})

// ══ 7. Rider §4 · re-sorteo por PARTIDA, por la vía alcanzable ═══════════════
describe('7. Re-sorteo de perfiles por partida', () => {
  beforeEach(() => _resetForTesting())

  // Juega una partida entera por la API pública y devuelve el reparto observado.
  function jugarPartida(numPlayers, topeManos = 40) {
    let s = createInitialState(50, numPlayers)
    const repartos = new Set()
    for (let h = 0; h < topeManos; h++) {
      s = startHand(s)
      if (s.phase === PHASES.GAME_OVER) break
      s = advanceFromDeal(s)
      const ronda = (fase) => {
        let n = 0
        while (s.phase === fase) {
          if (++n > 500) throw new Error('ronda sin converger')
          if (s.players[s.activePlayerIndex].folded || s.activePlayerIndex === 0) {
            const toCall = s.currentBet - (s.players[0].contrib ?? 0)
            s = s.activePlayerIndex === 0
              ? applyPlayerBetAction(s, toCall > 0 ? 'igualar' : 'pasar')
              : applyAIBetAction(s)
          } else {
            s = applyAIBetAction(s)
          }
        }
        repartos.add(Array.from({ length: numPlayers }, (_, i) => getPersonalityName(i)).join('|'))
      }
      ronda(PHASES.BET_1)
      if (s.phase === PHASES.PAYOUT) continue
      s = advanceFromDeal(s); ronda(PHASES.BET_2)
      if (s.phase === PHASES.PAYOUT) continue
      s = applyDiscard(s, []); ronda(PHASES.BET_3)
    }
    return repartos
  }

  it('DENTRO de una partida el reparto no se mueve — ni una sola vez en 40 manos', () => {
    for (const numPlayers of [2, 3, 4, 5]) {
      _resetForTesting()
      const repartos = jugarPartida(numPlayers)
      expect(repartos.size).toBe(1)
    }
  })

  it('ENTRE partidas se re-reparte — por la vía que ocurre en vivo, sin estados sintéticos', () => {
    // 30 partidas de mesa 5: si el detector no disparara, el reparto sería el
    // mismo en las 30. La probabilidad de que 30 sorteos independientes de 4!
    // permutaciones coincidan es (1/24)^29: cero a efectos prácticos.
    _resetForTesting()
    const vistos = new Set()
    for (let p = 0; p < 30; p++) {
      for (const r of jugarPartida(5, 3)) vistos.add(r)
    }
    expect(vistos.size).toBeGreaterThan(1)
  })

  it('la rama vieja (`handCount === 0`) ya no hace falta: el detector la cubre', () => {
    // Un estado sintético con el contador en 0 sigue disparando el re-sorteo,
    // porque el contador RETROCEDE. Lo que cambia es que ahora no es el único
    // camino — y el que sí ocurre en vivo es el de la prueba anterior.
    _resetForTesting()
    const s = estado({ numPlayers: 3, phase: 'BET_1', handCount: 7, currentBet: 50 })
    decideBetAction(s, 1)
    const antes = [getPersonalityName(1), getPersonalityName(2)].join('|')
    expect(antes).not.toContain('null')
    decideBetAction({ ...s, handCount: 0 }, 1)
    expect([getPersonalityName(1), getPersonalityName(2)].join('|')).not.toContain('null')
  })

  it('cambiar el tamaño de mesa re-reparte (comportamiento conservado)', () => {
    _resetForTesting()
    decideBetAction(estado({ numPlayers: 3, phase: 'BET_1', currentBet: 50 }), 1)
    expect(getPersonalityName(3)).toBeNull()
    decideBetAction(estado({ numPlayers: 5, phase: 'BET_1', currentBet: 50 }), 1)
    expect(PERFILES).toContain(getPersonalityName(3))
  })
})

// ══ 8. D-5 · trampa Proxy extendida a TODAS las ramas de Avanzado ════════════
// Puerta obligatoria del rector §2.1(b): ninguna capacidad nueva entra sin
// ampliar la vigilancia a los datos que introduce. Esta tanda introduce lectura
// de `pot` y de los `contrib` ajenos —ambos públicos— y NADA más: en particular
// `state.deck` sigue sin tocarse (la aritmética del taco es ② de Pro, NIV-2).
describe('8. D-5 · aislamiento de información en Avanzado', () => {
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

  // Estado con `deck` instrumentado: cualquier lectura queda marcada, se indexe
  // o no. Avanzado no puede tocarlo ni para leer su longitud.
  function conTrampaDeMazo(s) {
    const marca = { leido: false, indexado: false }
    const mazo = new Proxy([carta(1, 'Oros'), carta(2, 'Copas')], {
      get(target, prop) {
        if (prop !== Symbol.toPrimitive) marca.indexado = true
        return target[prop]
      },
    })
    Object.defineProperty(s, 'deck', { get() { marca.leido = true; return mazo }, configurable: true })
    return marca
  }

  // Este bloque vigila AVANZADO, que no toca `state.deck` ni para su longitud.
  // Pro salió de aquí en NIV-2 y no por rebajarle el listón: su frontera es más
  // fina —puede leer `.length` y jamás el contenido— y necesita una trampa que
  // distinga las dos cosas, que es la de `scripts/testNivel2.test.js` §8. Allí
  // se le exige MÁS que aquí: los dos lados de la frontera, no sólo uno.
  for (const numPlayers of [2, 3, 4, 5]) {
    for (const nivel of ['avanzado']) {
      it(`N=${numPlayers} · ${nivel}: ninguna rama lee cartas ajenas ni el mazo`, () => {
        const fases = [
          { phase: 'BET_1', currentBet: 0,   cards: M2.alta,    pot: 200 },
          { phase: 'BET_1', currentBet: 50,  cards: M2.floja,   pot: 200 },
          { phase: 'BET_2', currentBet: 300, cards: M5.floja,   pot: 100 },
          { phase: 'BET_2', currentBet: 50,  cards: M5.fuerte,  pot: 900 },
          { phase: 'BET_3', currentBet: 400, cards: M5.media,   pot: 300 },
          { phase: 'BET_3', currentBet: 50,  cards: M5.comodin, pot: 900 },
          { phase: 'BET_3', currentBet: 50,  cards: M5.ajilei,  pot: 900 },
          { phase: 'DISCARD', currentBet: 0, cards: M5.comodin, pot: 500 },
        ]
        for (const f of fases) {
          for (const asiento of [1, numPlayers - 1]) {
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
            const mazo = conTrampaDeMazo(s)

            if (f.phase === 'DISCARD') decideDiscard(s, asiento)
            else decideBetAction(s, asiento)

            trampas.forEach(t => expect(t.__cardsAccessed).toBe(false))
            expect(mazo.leido).toBe(false)
            expect(mazo.indexado).toBe(false)
          }
        }
      })
    }
  }

  it('lo que SÍ puede leer (público) queda declarado y EJERCIDO: pot y contrib ajenos', () => {
    // Prueba de contraste. Si Avanzado no leyera `pot` y los `contrib` ajenos,
    // la decisión no podría cambiar al moverlos con todo lo demás quieto.
    // Cambia en las dos direcciones — luego los lee, y sólo eso.
    //
    // NIV-CAL §1: la mano de referencia sube de 21 a 31 puntos. No es un ajuste
    // cosmético — con la curva de BET_3 reparada, un 21 después del descarte
    // tiene un 0,23% de equidad contra cuatro rivales y se suelta a CUALQUIER
    // precio, así que dejó de servir para leer un contraste de bote. Lo que la
    // prueba afirma es el mismo de siempre; lo que cambió es que ahora la
    // aritmética que lo produce es la correcta. El 31 sigue por debajo del
    // `raiseMin` de los cuatro perfiles en mesa 5 (28+6 = 34 el más bajo), así
    // que la rama es la misma sea cual sea el temperamento.
    const M5_31 = [carta(1,'Bastos'), carta(2,'Bastos'), carta(3,'Bastos'), carta(6,'Oros'), carta(6,'Espadas')]
    const conBote = (pot, contribAjeno) => ({
      numPlayers: 5, phase: 'BET_3', currentBet: 400, pot, unit: 50,
      manoIndex: 0, pieIndex: 4, handCount: 4, aliveCount: 5,
      handRules: makeHandRules(5), nivelIA: 'avanzado',
      players: Array.from({ length: 5 }, (_, i) => jugador({
        id: i, isHuman: i === 0, cards: i === 1 ? M5_31 : M5.fuerte,
        contrib: i === 1 ? 0 : (i === 0 ? 400 : contribAjeno),
      })),
    })
    _resetForTesting()
    // (a) bote de 2000 y los tres rivales ya pagados: nada más va a entrar.
    expect(decideBetAction(conBote(2000, 400), 1).action).toBe('retirarse')
    // (b) el mismo bote, pero los tres rivales deben todavía 400 cada uno: el
    //     bote de cierre es 1200 mayor y el mismo precio se vuelve pagable.
    expect(decideBetAction(conBote(2000, 0), 1).action).toBe('igualar')
    // (c) y con `pot` gordo, iguala aunque nadie deba nada.
    expect(decideBetAction(conBote(30000, 400), 1).action).toBe('igualar')
  })
})
