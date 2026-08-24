/**
 * REN-2 · El compositor de crónica contra el motor.
 *
 * La prueba no es "el texto me parece bien": es una EQUIVALENCIA. Para cada
 * transición de una partida real, si `composeResultado` devuelve null —es
 * decir, si antes de REN-2 el óvalo habría pintado `game.message` crudo— el
 * texto compuesto tiene que salir byte-idéntico al del motor, con la única
 * diferencia de la palabra de la moneda.
 *
 * Se hace así, y no con una tabla de casos escrita a mano, porque una tabla
 * demuestra que el compositor dice lo que YO creo que dice el motor. Esto
 * demuestra que dice lo que el motor dice de verdad, en los caminos por los que
 * el juego pasa de verdad, incluidos los que no se me habrían ocurrido (retiro
 * forzado por saldo, igualar sin nada que igualar, ronda que termina justo con
 * la acción y le pisa el mensaje la fase nueva).
 *
 * Ejecutar: npm test
 */
import { describe, it, expect } from 'vitest'

import {
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  PHASES,
} from '../src/engine/gameEngine.js'
import { composeResultado } from '../src/hooks/resultadoCore.js'
import { componeCronica, componeFase, componeAccion, MONEDA } from '../src/hooks/cronicaCore.js'

// ── Utilidades ───────────────────────────────────────────────────────────────

// Lo que el motor habría pintado, con la moneda renombrada. La sustitución es
// la MISMA que hace REN-1 en el resto de la app; si el motor gana algún día
// otra cadena con "fichas", esta línea la arrastra sola.
const esperado = (msg) => (msg ?? '').split('fichas').join(MONEDA)

// Mismos argumentos con los que GameTable llama al compositor de resultado.
const resultadoDe = (s) => composeResultado({
  phase: s.phase, winner: s.winner, players: s.players,
  numPlayers: s.numPlayers, manoIndex: s.manoIndex, ruleN: s.handRules?.ruleN,
})

const FASES_APUESTA = [PHASES.BET_1, PHASES.BET_2, PHASES.BET_3]
const esApuesta = (s) => FASES_APUESTA.includes(s.phase)

// Política del humano: rota por los cinco verbos para que ninguno se quede sin
// ejercitar. "apostar" va primero a propósito — es el que produce la cadena que
// motivó toda la tanda ("Apuestas N Heptacoins.").
const VERBOS = ['apostar', 'pasar', 'igualar', 'subir', 'pasar', 'apostar', 'igualar', 'retirarse']

// ...pero SÓLO entre las acciones que la mesa deja pulsar. Las mismas cuatro
// guardas de GameTable (`canPass`/`canBet`/`canCall`/`canRaise`), copiadas aquí
// a propósito: sin ellas el fuzz pide cosas que ningún jugador puede pedir —
// "subir" con la apuesta a cero, "igualar" sin nada que igualar— y ahí el motor
// escribe mensajes ("Subes a 10.", "Igualas a 0.") que la transición resultante
// NO permite distinguir de "Apuestas 10." y "Pasas.": los estados que producen
// son idénticos hasta el último campo. La primera corrida de este test cantó
// esas tres divergencias y eran suyas, no del compositor.
//
// Que sean inalcanzables no es una esperanza: la IA devuelve sólo 'apostar' o
// 'pasar' mientras `currentBet === 0` y sale de esa rama con `return`
// (aiPlayer.js §"No bet yet"), así que 'subir' e 'igualar' viven enteros bajo
// `currentBet > 0`. Si algún día una tanda abre esa puerta, este test la caza:
// la divergencia reaparece.
function permitidos(s) {
  const yo     = s.players[0]
  const toCall = s.currentBet - yo.contrib
  const ok     = ['retirarse']
  if (toCall === 0)                                              ok.push('pasar')
  if (s.currentBet === 0 && yo.chips >= s.unit)                  ok.push('apostar')
  if (toCall > 0 && yo.chips >= toCall)                          ok.push('igualar')
  if (s.currentBet > 0 && yo.chips >= s.currentBet + s.unit - yo.contrib) ok.push('subir')
  return ok
}

// El verbo que toca por rotación si la mesa lo permite; si no, el primero que sí.
function eligeVerbo(s, contador) {
  const ok = permitidos(s)
  for (let k = 0; k < VERBOS.length; k++) {
    const v = VERBOS[(contador.i + k) % VERBOS.length]
    if (ok.includes(v)) { contador.i++; return v }
  }
  contador.i++
  return 'retirarse'
}

// Registro: cada transición se anota como par (antes, después) y se comprueba
// al vuelo, para que el fallo señale la transición y no el final de la partida.
function comprueba(prev, next, fallos) {
  if (resultadoDe(next)) return           // manda `resultadoCore`, no esta crónica
  const visto = componeCronica(prev, next)
  const debe  = esperado(next.message)
  if (visto !== debe) {
    fallos.push({ fase: `${prev.phase}→${next.phase}`, visto, debe })
  }
}

function paso(s, fn, fallos) {
  const next = fn(s)
  comprueba(s, next, fallos)
  return next
}

function ronda(s, fallos, contador) {
  let guardia = 0
  while (esApuesta(s) && guardia++ < 60) {
    const seat = s.activePlayerIndex
    if (s.players[seat].folded) {
      // GameTable salta en silencio a un asiento retirado por la misma API.
      s = paso(s, st => (seat === 0 ? applyPlayerBetAction(st, 'pasar') : applyAIBetAction(st)), fallos)
      continue
    }
    s = seat === 0
      ? paso(s, st => applyPlayerBetAction(st, eligeVerbo(st, contador), st.unit), fallos)
      : paso(s, applyAIBetAction, fallos)
  }
  return s
}

function juegaMano(s, fallos, contador) {
  s = paso(s, advanceFromDeal, fallos)              // DEAL_2 → BET_1
  s = ronda(s, fallos, contador)
  if (s.phase !== PHASES.DEAL_3) return s
  s = paso(s, advanceFromDeal, fallos)              // DEAL_3 → BET_2
  s = ronda(s, fallos, contador)
  if (s.phase !== PHASES.DISCARD) return s
  // Descarte del humano variable: 0, 1 y 2 cartas, para que el resumen de N=2
  // no se compruebe siempre con la misma cuenta.
  const cuantas = contador.i % 3
  s = paso(s, st => applyDiscard(st, [0, 1].slice(0, cuantas)), fallos)
  return ronda(s, fallos, contador)
}

function juegaSesion(N, manos, fallos) {
  let s = createInitialState(10, N)
  const contador = { i: 0 }
  // El primer render no tiene transición: manda la fase (WAITING).
  expect(componeCronica(null, s)).toBe(esperado(s.message))
  for (let m = 0; m < manos && s.phase !== PHASES.GAME_OVER; m++) {
    s = paso(s, startHand, fallos)
    if (s.phase === PHASES.GAME_OVER) break
    s = juegaMano(s, fallos, contador)
    if (s.phase === PHASES.PAYOUT) {
      // "Siguiente mano": GameTable vacía el mensaje y anula el ganador. El
      // resultado deja de mandar y el óvalo tiene que quedarse EN BLANCO.
      const limpio = { ...s, message: '', winner: null }
      comprueba(s, limpio, fallos)
      s = limpio
    }
  }
  return s
}

// ── 1. Equivalencia contra el motor ─────────────────────────────────────────

describe('REN-2 · la crónica compuesta es la del motor, con la moneda renombrada', () => {
  ;[2, 3, 4, 5].forEach(N => {
    it(`N=${N}: 25 manos, ninguna transición diverge`, () => {
      const fallos = []
      juegaSesion(N, 25, fallos)
      expect(fallos).toEqual([])
    })
  })

  it('N=2, 60 manos: la crónica aguanta una sesión larga', () => {
    const fallos = []
    juegaSesion(2, 60, fallos)
    expect(fallos).toEqual([])
  })
})

// ── 2. La cadena que motivó la tanda ────────────────────────────────────────

describe('REN-2 · "Apuestas N Heptacoins." sale del compositor, no del motor', () => {
  it('mesa 2, apertura del humano: la moneda es Heptacoins y el motor sigue diciendo fichas', () => {
    let s = startHand(createInitialState(10, 2))
    s = advanceFromDeal(s)
    // Se fuerza el turno del humano con apuesta abierta a cero (apertura).
    const abierto = { ...s, activePlayerIndex: 0, currentBet: 0 }
    const next = applyPlayerBetAction(abierto, 'apostar', 50)

    expect(componeCronica(abierto, next)).toBe('Apuestas 50 Heptacoins.')
    // El motor NO se tocó: conserva su cadena como letra muerta interna.
    expect(next.message).toBe('Apuestas 50 fichas.')
  })

  it('la IA de mesa 2 no lleva moneda en su línea (el motor tampoco la lleva)', () => {
    let s = startHand(createInitialState(10, 2))
    s = advanceFromDeal(s)
    const abierto = { ...s, activePlayerIndex: 1, currentBet: 0 }
    const next = applyPlayerBetActionEnAsiento(abierto, 1, 50)
    expect(componeCronica(abierto, next)).toBe('La IA apuesta 50. ¿Qué haces?')
  })
})

// El motor sólo expone la acción del humano por asiento 0; para mover el 1 se
// usa la misma puerta pública con el estado rotado, que es lo que hace el
// propio `applyAIBetAction` por dentro (sin tocar el motor).
function applyPlayerBetActionEnAsiento(state, seat, monto) {
  const rotado = { ...state, activePlayerIndex: seat }
  return applyPlayerBetActionComoSeat(rotado, seat, monto)
}
function applyPlayerBetActionComoSeat(state, seat, monto) {
  // `applyPlayerBetAction` siempre actúa sobre el asiento 0. Para el asiento 1
  // se intercambian los jugadores, se aplica y se devuelven a su sitio: el
  // mensaje del motor sale con `isHuman` del asiento real.
  const swap = (arr) => { const a = [...arr]; const t = a[0]; a[0] = a[seat]; a[seat] = t; return a }
  const dentro = { ...state, players: swap(state.players), activePlayerIndex: 0 }
  const salida = applyPlayerBetAction(dentro, 'apostar', monto)
  return { ...salida, players: swap(salida.players), activePlayerIndex: state.activePlayerIndex }
}

// ── 3. Las piezas, por separado ─────────────────────────────────────────────

describe('REN-2 · piezas del compositor', () => {
  it('la fase de espera saluda', () => {
    expect(componeFase(createInitialState(10, 2))).toBe('¡Bienvenido a Ajilei!')
  })

  it('PAYOUT sin ganador pinta en blanco (el óvalo entre manos)', () => {
    const s = { ...createInitialState(10, 2), phase: PHASES.PAYOUT, winner: null }
    expect(componeFase(s)).toBe('')
  })

  it('componeAccion devuelve null si el asiento no existe', () => {
    const s = createInitialState(10, 2)
    expect(componeAccion(s, s, 9)).toBe(null)
  })
})
