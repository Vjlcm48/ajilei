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
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

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
import { setRng as sembrarMazo, resetRng as resetMazo } from '../src/engine/deck.js'
import { setRng as sembrarIA, resetRng as resetIA, _resetForTesting } from '../src/engine/aiPlayer.js'
import { jugadoresVsIA, pisoDe } from '../src/engine/entrada.js'

// ── SIEMBRA (L-7, decisión 6 del rector al cerrar 1c-2) ─────────────────────
//
// Este fichero era el único del banco de pruebas que jugaba partidas enteras
// con `Math.random` en las dos fuentes de azar —la baraja y el cerebro de la
// IA—, y por eso era INTERMITENTE: cada corrida recorría caminos distintos, de
// modo que un camino que divergiera del motor podía pasar verde veinte veces y
// rojo a la veintiuna. Un equivalencia que sólo a veces se comprueba no es una
// equivalencia.
//
// Con las dos sembradas, el recorrido es el MISMO en toda corrida: lo que hoy
// sale verde sigue verde mañana, y lo que un día salga rojo se puede reproducir
// pegando la semilla. Que el recorrido sea fijo no lo hace estrecho: son cinco
// sesiones de 25 a 60 manos en cuatro tamaños de mesa, y cada una recorre
// cientos de transiciones.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const SEMILLA = 23

beforeEach(() => {
  _resetForTesting()
  sembrarMazo(mulberry32(SEMILLA))
  sembrarIA(mulberry32(SEMILLA))
})
afterEach(() => {
  resetMazo(); resetIA(); _resetForTesting()
})

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

// Política del humano: rota por los verbos para que ninguno se quede sin
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
  // §4.1 · el all-in DEFENSIVO: existe exactamente donde `igualar` no llega.
  // Es la quinta guarda que la pantalla tendrá en 1e, y la que este fichero no
  // podía ejercitar mientras todos los asientos nacieran con 5.000 fichas.
  if (toCall > yo.chips)                                         ok.push('allIn')
  return ok
}

// El verbo que toca por rotación si la mesa lo permite; si no, el primero que sí.
// Con `preferirAllIn`, el all-in gana a la rotación donde sea legal: es el único
// modo de recorrer la rama de §4.1 a placer, porque la rotación normal tiene
// 'retirarse' delante y el all-in y el retiro son legales en el mismo sitio.
function eligeVerbo(s, contador, preferirAllIn = false) {
  const ok = permitidos(s)
  if (preferirAllIn && ok.includes('allIn')) { contador.i++; return 'allIn' }
  for (let k = 0; k < VERBOS.length; k++) {
    const v = VERBOS[(contador.i + k) % VERBOS.length]
    if (ok.includes(v)) { contador.i++; return v }
  }
  contador.i++
  return 'retirarse'
}

// Registro: cada transición se anota como par (antes, después) y se comprueba
// al vuelo, para que el fallo señale la transición y no el final de la partida.
// `lineas` recoge todo lo que la crónica llegó a decir, para poder AFIRMAR que
// un camino se recorrió de verdad. Sin eso, una prueba de all-in que nunca
// produce un all-in sale verde sin medir nada.
function comprueba(prev, next, fallos, lineas = null) {
  if (resultadoDe(next)) return           // manda `resultadoCore`, no esta crónica
  const visto = componeCronica(prev, next)
  const debe  = esperado(next.message)
  if (lineas) lineas.push(visto)
  if (visto !== debe) {
    fallos.push({ fase: `${prev.phase}→${next.phase}`, visto, debe })
  }
}

function paso(s, fn, fallos, lineas) {
  const next = fn(s)
  comprueba(s, next, fallos, lineas)
  return next
}

function ronda(s, fallos, contador, lineas) {
  let guardia = 0
  while (esApuesta(s) && guardia++ < 60) {
    const seat = s.activePlayerIndex
    if (s.players[seat].folded) {
      // GameTable salta en silencio a un asiento retirado por la misma API.
      s = paso(s, st => (seat === 0 ? applyPlayerBetAction(st, 'pasar') : applyAIBetAction(st)), fallos, lineas)
      continue
    }
    s = seat === 0
      ? paso(s, st => applyPlayerBetAction(st, eligeVerbo(st, contador, contador.allIn), 1), fallos, lineas)
      : paso(s, applyAIBetAction, fallos, lineas)
  }
  return s
}

function juegaMano(s, fallos, contador, lineas) {
  s = paso(s, advanceFromDeal, fallos, lineas)      // DEAL_2 → BET_1
  s = ronda(s, fallos, contador, lineas)
  if (s.phase !== PHASES.DEAL_3) return s
  s = paso(s, advanceFromDeal, fallos, lineas)      // DEAL_3 → BET_2
  s = ronda(s, fallos, contador, lineas)
  if (s.phase !== PHASES.DISCARD) return s
  // Descarte del humano variable: 0, 1 y 2 cartas, para que el resumen de N=2
  // no se compruebe siempre con la misma cuenta.
  const cuantas = contador.i % 3
  s = paso(s, st => applyDiscard(st, [0, 1].slice(0, cuantas)), fallos, lineas)
  return ronda(s, fallos, contador, lineas)
}

// `inicio` permite sentar la mesa con las pilas REALES de la pantalla (§2.3) en
// vez de con los 5.000 de siempre; sin él, la mesa de toda la vida.
function juegaSesion(N, manos, fallos, { inicio = null, allIn = false, lineas = null } = {}) {
  let s = inicio ?? createInitialState(10, N)
  const contador = { i: 0, allIn }
  // El primer render no tiene transición: manda la fase (WAITING).
  expect(componeCronica(null, s)).toBe(esperado(s.message))
  for (let m = 0; m < manos && s.phase !== PHASES.GAME_OVER; m++) {
    s = paso(s, startHand, fallos, lineas)
    if (s.phase === PHASES.GAME_OVER) break
    s = juegaMano(s, fallos, contador, lineas)
    if (s.phase === PHASES.PAYOUT) {
      // "Siguiente mano": GameTable vacía el mensaje y anula el ganador. El
      // resultado deja de mandar y el óvalo tiene que quedarse EN BLANCO.
      const limpio = { ...s, message: '', winner: null }
      comprueba(s, limpio, fallos, lineas)
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
    const next = applyPlayerBetAction(abierto, 'apostar', 5)   // ×5 sobre unit 10

    expect(componeCronica(abierto, next)).toBe('Apuestas 50 Heptacoins.')
    // El motor NO se tocó: conserva su cadena como letra muerta interna.
    expect(next.message).toBe('Apuestas 50 fichas.')
  })

  it('la IA de mesa 2 no lleva moneda en su línea (el motor tampoco la lleva)', () => {
    let s = startHand(createInitialState(10, 2))
    s = advanceFromDeal(s)
    const abierto = { ...s, activePlayerIndex: 1, currentBet: 0 }
    const next = applyPlayerBetActionEnAsiento(abierto, 1, 5)  // ×5 sobre unit 10
    expect(componeCronica(abierto, next)).toBe('La IA apuesta 50. ¿Qué haces?')
  })
})

// El motor sólo expone la acción del humano por asiento 0; para mover el 1 se
// usa la misma puerta pública con el estado rotado, que es lo que hace el
// propio `applyAIBetAction` por dentro (sin tocar el motor).
function applyPlayerBetActionEnAsiento(state, seat, k) {
  const rotado = { ...state, activePlayerIndex: seat }
  return applyPlayerBetActionComoSeat(rotado, seat, k)
}
function applyPlayerBetActionComoSeat(state, seat, k) {
  // `applyPlayerBetAction` siempre actúa sobre el asiento 0. Para el asiento 1
  // se intercambian los jugadores, se aplica y se devuelven a su sitio: el
  // mensaje del motor sale con `isHuman` del asiento real.
  const swap = (arr) => { const a = [...arr]; const t = a[0]; a[0] = a[seat]; a[seat] = t; return a }
  const dentro = { ...state, players: swap(state.players), activePlayerIndex: 0 }
  const salida = applyPlayerBetAction(dentro, 'apostar', k)
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

// ── 4. El sexto verbo: all-in (L-7 · D-20) ──────────────────────────

// La mesa REAL de la pantalla: apuesta 50, el humano entra al PISO y cada IA
// se sienta con lo que reparte `entrada.pilaIA` (§2.3). A esa profundidad el
// all-in defensivo de §4.1 ocurre solo, y es justo la mesa que este fichero no
// podía jugar mientras todos nacieran con 5.000 fichas.
//
// C-0.1 · el piso se DERIVA de la fuente única (`pisoDe`), no se escribe. Estaba
// clavado en 250 —5× la apuesta— y 1f-A4 lo subió a 10×: un número a mano aquí
// dejaba esta prueba midiendo una mesa que la pantalla ya no ofrece.
const PISO_MESA_REAL = pisoDe(50)
const mesaReal = (N) => createInitialState(50, jugadoresVsIA(PISO_MESA_REAL, N, 50))

describe('L-7 · la crónica sabe decir all-in', () => {
  // §4.3 EN LA MESA DE DOS: cuando el humano se queda en all-in, el rival es el
  // único que puede seguir actuando, así que la ronda se cierra en el mismo paso
  // y el motor PISA su propia línea con la de la fase nueva. La crónica hace lo
  // mismo —manda la fase— y por eso la equivalencia se conserva; la frase del
  // all-in se comprueba en la pieza, que es donde vive.
  it('mesa 2: la pieza dice la frase con la moneda, y la transición la pisa la fase', () => {
    const s = advanceFromDeal(startHand(createInitialState(50, 2)))
    const corto = {
      ...s,
      activePlayerIndex: 0,
      currentBet: 200,
      players: s.players.map((p, i) => i === 0
        ? { ...p, chips: 70, contrib: 0, acted: false }
        : { ...p, contrib: 200, acted: false, folded: false }),
    }
    const next = applyPlayerBetAction(corto, 'allIn')

    expect(componeAccion(corto, next, 0)).toBe(`Vas all-in con 70 ${MONEDA}.`)
    expect(componeCronica(corto, next)).toBe(esperado(next.message))
    // Y queda marcado: el asiento hace capa por lo que ya puso (§4.2). Lo que
    // NO sobrevive al cierre de ronda es `contrib`, que es de la ronda y se
    // resetea con ella; `allIn` es de la MANO.
    expect(next.players[0].allIn).toBe(true)
    expect(next.players[0].chips).toBe(0)
  })

  // En una mesa de cuatro quedan dos que pueden seguir actuando, la ronda NO se
  // cierra y la línea del all-in es la que el óvalo pinta. Aquí sí se compara
  // contra el motor, palabra por palabra.
  it('mesa 4, humano: la línea del all-in es la del motor', () => {
    const s = advanceFromDeal(startHand(createInitialState(50, 4)))
    const corto = {
      ...s,
      activePlayerIndex: 0,
      currentBet: 300,
      players: s.players.map((p, i) => i === 0
        ? { ...p, chips: 90, contrib: 0, acted: false }
        : { ...p, contrib: 300, acted: false, folded: false }),
    }
    const next = applyPlayerBetAction(corto, 'allIn')
    expect(next.message).toBe(`${corto.players[0].name} va all-in con 90.`)
    expect(componeCronica(corto, next)).toBe(esperado(next.message))
    // Aquí la ronda sigue abierta, así que se ve lo que el all-in dejó puesto:
    // NO es una subida (§4.1) y hace capa por lo suyo (§4.2).
    expect(next.currentBet).toBe(300)
    expect(next.players[0].contrib).toBe(90)
    expect(next.players[0].allIn).toBe(true)
  })

  it('mesa 4: el all-in de un asiento con nombre lleva su nombre y no lleva moneda', () => {
    const s = advanceFromDeal(startHand(createInitialState(50, 4)))
    const corto = {
      ...s,
      activePlayerIndex: 2,
      currentBet: 300,
      players: s.players.map((p, i) => i === 2
        ? { ...p, chips: 120, contrib: 0, acted: false }
        : { ...p, contrib: 300, acted: false, folded: false }),
    }
    const next = allInEnAsiento(corto, 2)
    expect(next.message).toBe(`${corto.players[2].name} va all-in con 120.`)
    expect(componeCronica(corto, next)).toBe(`${corto.players[2].name} va all-in con 120.`)
  })

  // LA DISTINCIÓN QUE HABÍA QUE GANAR. Un `igualar` que gasta la última ficha
  // también deja la pila en cero y también marca `allIn`; lo que lo separa es que
  // LLEGA a la apuesta viva. Si la crónica se guiara por la pila en cero, esta
  // transición saldría rotulada «va all-in» y el motor dice «iguala».
  //
  // La mesa es de cuatro para que igualar NO cierre la ronda: si la cerrara, el
  // motor pisaría su propio mensaje con el de la fase nueva y la comparación
  // dejaría de mirar lo que se quiere mirar.
  it('un igualar que gasta hasta la última ficha sigue siendo igualar', () => {
    const s = advanceFromDeal(startHand(createInitialState(50, 4)))
    const justo = {
      ...s,
      activePlayerIndex: 0,
      currentBet: 200,
      players: s.players.map((p, i) => i === 0
        ? { ...p, chips: 200, contrib: 0, acted: false }
        : { ...p, acted: false, contrib: 200, folded: false }),
    }
    const next = applyPlayerBetAction(justo, 'igualar')
    expect(next.players[0].chips).toBe(0)
    expect(next.players[0].allIn).toBe(true)
    expect(next.message).toBe('Tú iguala a 200.')
    expect(componeCronica(justo, next)).toBe('Tú iguala a 200.')
  })

  // Y la equivalencia entera, en la mesa donde el all-in ocurre solo.
  ;[2, 3, 4, 5].forEach(N => {
    it(`N=${N} al piso con pilas reales: 60 manos, ninguna transición diverge`, () => {
      const fallos = []
      juegaSesion(N, 60, fallos, { inicio: mesaReal(N), allIn: true })
      expect(fallos).toEqual([])
    })
  })

  // Y la prueba mide algo: el camino de §4.1 se recorre de verdad en el fuzz,
  // no sólo en los estados armados a mano de arriba. Se cuenta sobre las cuatro
  // mesas juntas porque al piso una partida de mesa 2 se acaba en pocas manos y
  // no da tiempo a que nadie se quede corto.
  it('el fuzz con pilas reales llega a la rama de §4.1 por su propio pie', () => {
    const fallos = [], lineas = []
    for (const N of [2, 3, 4, 5]) juegaSesion(N, 60, fallos, { inicio: mesaReal(N), allIn: true, lineas })
    expect(fallos).toEqual([])
    expect(lineas.filter(l => l.includes('all-in')).length).toBeGreaterThan(0)
  })
})

// El motor sólo expone la acción del humano por el asiento 0; para los demás se
// usa la misma puerta pública con el estado rotado, igual que hace el bloque 2.
function allInEnAsiento(state, seat) {
  const swap = (arr) => { const a = [...arr]; const t = a[0]; a[0] = a[seat]; a[seat] = t; return a }
  const dentro = { ...state, players: swap(state.players), activePlayerIndex: 0 }
  const salida = applyPlayerBetAction(dentro, 'allIn')
  return { ...salida, players: swap(salida.players), activePlayerIndex: state.activePlayerIndex }
}
