// ── GUI-1 · Las tres manos de la partida guiada ─────────────────────────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §0 y §1.2; normativo AJILEI_Tutorial_v1.5.md
// §1.1, §1.3 (la escalera) y §1.4 (el contrato de las tres manos). Módulo PURO,
// sin React ni DOM: lo leen la mesa guiada (`components/GuiaControl.jsx`), el
// buscador de órdenes (`scripts/guia/buscarOrdenes.mjs`) y su prueba
// (`guiaManos.test.js`).
//
// LA MESA. Tres asientos (tú, «IA 1», «IA 2»), sin comodín (solo existe en 4 y
// 5), apuesta de mesa 100 y 10.000 por cabeza: ni el pozo de la mano 3 (dos ×10)
// acerca a nadie a una recarga. Sin servidor (excepción escrita a INV-47).
//
// LA ESCALERA (v1.3 §1.3). Lo que enseña la guiada lo hace el dedo: palos
// distintos, pasar; te apuestan y tienes algo, igualar; dos del palo, ×1;
// cuatro, ×2; cinco, ×5; AJILEI, ×10. Tres pases en toda la guiada, los tres en
// la mano 1; una igualada (la última ronda de la mano 1); seis apuestas.
//
// LOS RIVALES DE GUION, POR MANO Y RONDA (`GUION_RIVALES`). Pasan si no hay
// apuesta viva e IGUALAN la que haya, sea del tamaño que sea (también el ×10);
// nunca suben, nunca se retiran (si quedara un solo pendiente, el motor saltaría
// la fase, APU-1 §4.4, y el paso desaparecería). La única apuesta propia de un
// rival es la de IA 1 en la última ronda de la mano 1 (×1, tras tu pase). Descartan lo que decide la IA (vía (i) de la Fase 0 §A.3):
// `applyDiscard` llama a su `decideDiscard`, que no lee azar, así que con el
// mazo dado el descarte es siempre el mismo. Por eso los órdenes se BUSCAN con el
// motor real y no se escriben a mano: el buscador corre la mano entera y se
// queda con un orden que cumple la condición del normativo con ese descarte
// dentro.
//
// LOS ÓRDENES NO SE TOCAN A MANO, NUNCA. Si una mano no enseña lo que debe, se
// cambia la condición en el normativo y se vuelve a correr el buscador.
import {
  PHASES, createInitialState, startHand, advanceFromDeal, applyBetAction, applyDiscard,
} from '../engine/gameEngine'
import { getBestSuitScore } from '../engine/handEvaluator'
import { conNivel } from '../hooks/nivelCore'
import { montoTexto } from '../config/tapetes'

export const APUESTA = 100
export const ASIENTOS = 3
export const PILA = 10000
export const NIVEL = 'basico'
export const MANOS = 3

/** La lista con la que se sienta la mesa guiada (forma de `jugadoresVsIA`). */
export const JUGADORES = Object.freeze([
  { isHuman: true, chips: PILA, name: 'Tú' },
  { isHuman: false, chips: PILA, name: 'IA 1' },
  { isHuman: false, chips: PILA, name: 'IA 2' },
])

/** El estado con el que nace la mesa guiada (el mismo para la mesa y el buscador). */
export const estadoInicial = () => conNivel(createInitialState(APUESTA, JUGADORES.map((j) => ({ ...j }))), NIVEL)

// ── Los órdenes (los escribe `scripts/guia/buscarOrdenes.mjs`) ─────────────
// BEGIN ORDENES
// Escrito por `node scripts/guia/buscarOrdenes.mjs` (no a mano). Cada orden es la
// baraja de arriba abajo; lo que cumple, contado por el propio buscador:
//   · mano 1: a 2: 10-Oros, 6-Bastos · a 5: 10-Oros, 6-Bastos, 7-Copas, 4-Oros, 11-Oros (30) · descartas 6-Bastos, 7-Copas y llega 5-Bastos, 12-Bastos (30) · pozo 600 · al mostrar: tú 30, IA 1 30, IA 2 37; gana IA 2.
//   · mano 2: a 2: 4-Espadas, 11-Espadas · a 5: 4-Espadas, 11-Espadas, 2-Espadas, 7-Copas, 6-Espadas (36; antes del descarte un rival lleva 40) · descartas 7-Copas y llega 5-Espadas (46) · pozo 2700 · al mostrar: tú 46, IA 1 31, IA 2 40; gana Tú.
//   · mano 3: a 2: 1-Bastos, 5-Bastos · a 5: 1-Bastos, 5-Bastos, 12-Bastos, 3-Bastos, 4-Bastos (51) · sin descartar (51) · pozo 6600 · al mostrar: tú 51, IA 1 26, IA 2 31; gana Tú.
export const ORDENES = Object.freeze([
  Object.freeze(['10-Oros', '12-Oros', '3-Oros', '6-Bastos', '3-Espadas', '4-Bastos', '7-Copas', '11-Espadas', '4-Espadas', '4-Oros', '10-Copas', '4-Copas', '11-Oros', '1-Bastos', '7-Bastos', '5-Bastos', '12-Bastos', '2-Copas', '5-Copas', '10-Espadas', '11-Bastos', '1-Espadas', '2-Bastos', '5-Espadas', '6-Espadas', '6-Copas', '10-Bastos', '6-Oros', '2-Oros', '3-Bastos', '1-Copas', '7-Oros', '1-Oros', '12-Espadas', '11-Copas', '5-Oros', '7-Espadas', '12-Copas', '3-Copas', '2-Espadas']),
  Object.freeze(['12-Espadas', '12-Copas', '4-Espadas', '3-Copas', '5-Copas', '11-Espadas', '7-Espadas', '10-Copas', '2-Espadas', '4-Copas', '11-Copas', '7-Copas', '7-Oros', '11-Oros', '6-Espadas', '3-Espadas', '1-Copas', '6-Oros', '10-Espadas', '5-Espadas', '1-Espadas', '12-Oros', '2-Bastos', '5-Bastos', '2-Oros', '10-Oros', '10-Bastos', '2-Copas', '4-Oros', '5-Oros', '7-Bastos', '11-Bastos', '1-Oros', '1-Bastos', '3-Bastos', '3-Oros', '6-Bastos', '12-Bastos', '6-Copas', '4-Bastos']),
  Object.freeze(['4-Copas', '1-Bastos', '6-Espadas', '10-Espadas', '5-Bastos', '5-Copas', '7-Bastos', '12-Bastos', '6-Oros', '4-Oros', '3-Bastos', '3-Espadas', '1-Espadas', '4-Bastos', '11-Espadas', '3-Oros', '11-Bastos', '4-Espadas', '10-Oros', '7-Copas', '7-Oros', '12-Copas', '10-Copas', '6-Copas', '11-Copas', '7-Espadas', '5-Oros', '10-Bastos', '12-Espadas', '1-Oros', '5-Espadas', '12-Oros', '1-Copas', '2-Espadas', '2-Bastos', '11-Oros', '3-Copas', '2-Copas', '2-Oros', '6-Bastos']),
])
// END ORDENES

// ── El guion de los rivales y del humano ───────────────────────────────────
const hayApuestaViva = (game, seat) => game.currentBet > (game.players[seat]?.contrib ?? 0)

/**
 * Las apuestas propias de los rivales, por mano y ronda: `{ mano: { fase: { asiento: k } } }`.
 * Sólo se apuesta sin apuesta viva delante; con ella, el rival iguala.
 */
export const GUION_RIVALES = Object.freeze({
  1: { BET_3: { 1: 1 } },
})

/**
 * La decisión de un rival de guion, con la forma de `decidirIA`: igualar no
 * lleva multiplicador (paga lo que haya), así que ahí `k` no cuenta. La mano es
 * `game.handCount` (la mesa y `jugarMano` la cuentan igual). El peso `leve` es
 * la banda corta de `ritmoDe`: el ritmo Rápido de la guiada.
 */
export function decidirRival(game, seat) {
  if (hayApuestaViva(game, seat)) return { action: 'igualar', k: 1, peso: 'leve' }
  const k = GUION_RIVALES[game.handCount]?.[game.phase]?.[seat]
  return k ? { action: 'apostar', k, peso: 'leve' } : { action: 'pasar', k: 1, peso: 'leve' }
}

/** Puntos del mejor palo de unas cartas en la mesa de 3 (sin comodín). */
export const sumaDe = (cartas) => getBestSuitScore(cartas ?? [], ASIENTOS, false)

/** Los índices de las cartas del mejor palo (los aros de «tres / cuatro del mismo palo»). */
export function indicesDelPalo(cartas) {
  const { palo } = sumaDe(cartas)
  return (cartas ?? []).map((c, i) => (c.palo === palo ? i : -1)).filter((i) => i >= 0)
}

/** Los índices de las que NO son del mejor palo: las que el guion descarta. */
export function indicesSueltas(cartas) {
  const del = new Set(indicesDelPalo(cartas))
  return (cartas ?? []).map((_, i) => i).filter((i) => !del.has(i))
}

/**
 * La carta que no suma: la única de un palo distinto al de las otras cuatro
 * (mano 2, paso 6). `-1` si las cartas no tienen esa forma.
 */
export function indiceSuelta(cartas) {
  if (!Array.isArray(cartas) || cartas.length !== 5) return -1
  const cuenta = {}
  for (const c of cartas) cuenta[c.palo] = (cuenta[c.palo] ?? 0) + 1
  const palo = Object.keys(cuenta).find((p) => cuenta[p] === 4)
  return palo ? cartas.findIndex((c) => c.palo !== palo) : -1
}

/**
 * Lo que hace el humano en cada ronda, mano por mano (la escalera, §1.3 y
 * §1.4), en orden: `k` es lo que pone, en apuestas de mesa (0 al pasar; al
 * igualar, la apuesta que le llega). La mesa no la usa —allí toca el
 * jugador—; la usan el buscador y la prueba para jugar la mano entera por la
 * misma vía que los pasos.
 *   · mano 1: pasa · pasa · descarta las dos sueltas · pasa e iguala el ×1 de IA 1;
 *   · mano 2: apuesta ×1 · ×2 · descarta la suelta · ×5;
 *   · mano 3: apuesta ×1 · ×10 · sin descartar · ×10.
 */
const J = (action, k) => Object.freeze({ action, k })
export const ESCALERA = Object.freeze({
  1: { BET_1: [J('pasar', 0)], BET_2: [J('pasar', 0)], BET_3: [J('pasar', 0), J('igualar', 1)] },
  2: { BET_1: [J('apostar', 1)], BET_2: [J('apostar', 2)], BET_3: [J('apostar', 5)] },
  3: { BET_1: [J('apostar', 1)], BET_2: [J('apostar', 10)], BET_3: [J('apostar', 10)] },
})

export function jugadaHumana(mano, game) {
  if (game.phase === PHASES.DISCARD) return mano === 3 ? [] : indicesSueltas(game.players[0].cards)
  // Con apuesta viva, iguala (sólo pasa donde el guion la pone: mano 1, BET_3);
  // si llegara en otro sitio, la escalera no se cumple y el buscador lo descarta.
  if (hayApuestaViva(game, 0)) return { action: 'igualar', k: 1 }
  const k = ESCALERA[mano]?.[game.phase]?.[0]?.k ?? 0
  return k === 0 ? { action: 'pasar', k: 1 } : { action: 'apostar', k }
}

const FASES_APUESTA = [PHASES.BET_1, PHASES.BET_2, PHASES.BET_3]
const foto = (game) => game.players.map((p) => p.cards.map((c) => ({ ...c })))

/** Lo que hay en el pozo de la mano, contado por lo que puso cada uno (el pago ya lo vació). */
export const pozoDeMano = (game) => game.players.reduce((s, p) => s + (p.contribMano ?? 0), 0)

/**
 * Juega UNA mano entera con el motor real, el orden dado y el guion de arriba,
 * desde el estado previo (`estadoInicial()` o el pago de la mano anterior).
 * `armar(orden)` prepara el barajado (`mazoDado.armarOrden`): se inyecta para
 * que este módulo no toque el generador por su cuenta.
 * Devuelve el pago y lo que cada paso del normativo necesita ver.
 *
 * TUT-1 T4 · `parar(g, r)`, opcional: se pregunta antes de cada jugada y, si dice
 * que sí, la mano se queda ahí y `r.momento` es ese estado (el «momento» de un
 * capítulo, `guia/momento.js`). Sin él, la mano se juega entera como siempre.
 */
export function jugarMano(previo, mano, orden, armar, parar = null) {
  armar(orden)
  let g = startHand(previo)
  const r = {
    mano, manoIndex: g.manoIndex, fases: [], turnos: { BET_1: 0, BET_2: 0, BET_3: 0 }, jugadas: [],
    dos: null, cinco: null, antes: null, despues: null, pozoEnDescarte: null, momento: null,
  }
  for (let paso = 0; paso < 200 && g.phase !== PHASES.PAYOUT && g.phase !== PHASES.GAME_OVER; paso++) {
    if (parar && parar(g, r)) { r.momento = g; return r }
    if (!r.fases.includes(g.phase)) r.fases.push(g.phase)
    if (g.phase === PHASES.DEAL_2 || g.phase === PHASES.DEAL_3) {
      g = advanceFromDeal(g)
    } else if (g.phase === PHASES.DISCARD) {
      r.antes = foto(g)
      r.pozoEnDescarte = g.pot
      g = applyDiscard(g, jugadaHumana(mano, g))
      r.despues = foto(g)
    } else if (FASES_APUESTA.includes(g.phase)) {
      const seat = g.activePlayerIndex
      if (seat === 0) {
        r.turnos[g.phase]++
        if (g.phase === PHASES.BET_1 && !r.dos) r.dos = foto(g)[0]
        if (g.phase === PHASES.BET_2 && !r.cinco) r.cinco = foto(g)
        const j = jugadaHumana(mano, g)
        // Lo que puso, por su cuenta de la mano: si su palabra cierra la última
        // ronda, el pago ya vació el pozo.
        const antes = g.players[0].contribMano ?? 0
        g = applyBetAction(g, 0, j.action, j.k)
        r.jugadas.push({ fase: r.fases.at(-1), action: j.action, k: j.k, puso: (g.players[0].contribMano ?? 0) - antes })
      } else {
        const d = decidirRival(g, seat)
        g = applyBetAction(g, seat, d.action, d.k)
      }
    } else {
      break
    }
  }
  r.fases.push(g.phase)
  r.pago = g
  r.pozo = pozoDeMano(g)
  return r
}

// ── Los pasos (normativo v1.3 §1.4) ────────────────────────────────────────
// Cada paso dice CUÁNDO se ve (`cuando`, sobre la mano y la fase), QUÉ se señala
// (`ancla`, selectores de la tanda 1), su rótulo (clave de `t()`) y cómo avanza:
//   · `toque`: el único control es el ancla; el toque real hace la jugada y
//     avanza el paso (`alTocar` de `CapaSenal`);
//   · `seleccion`: el único control son las cartas de `objetivo`; el paso avanza
//     cuando la selección de descarte de la mesa es exactamente ésa (la mano 1
//     pide DOS toques en un paso: el normativo lo cuenta como uno);
//   · `lectura`: el único control es «Siguiente», de la capa;
//   · `fin`: sin rótulo (la celebración de AJILEI) y, al terminar, el cierre.
// Cada «×k y Apostar» son dos pasos: primero el multiplicador, después el botón.
// Mientras un paso no se ve (reparte, piensa una IA, vuela una moneda), la mesa
// sigue a la vista y nada responde salvo «Salir».
//
// `cuando`:
//   · `inicio`:  esperando «Iniciar mano»;
//   · `turno`:   te toca apostar en `fase` (la fila de acciones montada);
//   · `descarte`: te toca descartar (el botón montado, sin reponer en curso);
//   · `cobro`:   el pago, con la celebración terminada.
//
// «Igualaron» se dice cuando vuelve a tocarte (el siguiente turno o el descarte),
// con el aro en el pozo. En la última ronda de la mano 1 te toca dos veces: la
// primera pasas; la segunda, tras el ×1 de IA 1 y el pago de IA 2, igualas.
const A = {
  iniciar: '[data-accion="iniciar-mano"]',
  siguiente: '[data-accion="siguiente-mano"]',
  pasar: '[data-accion="pasar"]',
  igualar: '[data-accion="igualar"]',
  apostar: '[data-accion="apostar"]',
  descartar: '[data-accion="descartar"]',
  pozo: '[data-ancla="pozo"]',
  mult: (k) => `[data-accion="mult"][data-k="${k}"]`,
  carta: (i) => `[data-ancla="carta"][data-i="${i}"]`,
  rival: (s) => `[data-ancla="rival"][data-asiento="${s}"]`,
}
const cartas = (idx) => idx.map(A.carta)
const CINCO = [0, 1, 2, 3, 4]
const DOS = [0, 1]
const mias = (g) => g.players[0].cards
const suma = (g) => sumaDe(mias(g)).points
const mejorRival = (g) => Math.max(...g.players.slice(1).map((p) => p.score?.points ?? sumaDe(p.cards).points))

/** Un paso de toque sobre un botón: el aro en el botón, el toque en el botón. */
const boton = (mano, cuando, fase, rotulo, sel) => ({ mano, cuando, fase, rotulo, ancla: () => [sel], avanza: 'toque' })

export const PASOS = Object.freeze([
  // ── Mano 1 · «Mirar y arriesgar» ──
  { mano: 1, cuando: 'inicio', rotulo: 'tut.g1.p1', ancla: () => [A.iniciar], avanza: 'toque' },
  { mano: 1, cuando: 'turno', fase: 'BET_1', rotulo: 'tut.g1.p2', ancla: () => cartas(DOS), avanza: 'lectura' },
  boton(1, 'turno', 'BET_1', 'tut.g1.p3', A.pasar),
  {
    mano: 1, cuando: 'turno', fase: 'BET_2', rotulo: 'tut.g1.p4', avanza: 'lectura',
    ancla: (g) => cartas(indicesDelPalo(mias(g))), vars: (g) => ({ n: suma(g) }),
  },
  boton(1, 'turno', 'BET_2', 'tut.g1.p5', A.pasar),
  {
    mano: 1, cuando: 'descarte', rotulo: 'tut.g1.p6', avanza: 'seleccion', guarda: 'repuestas',
    objetivo: (g) => indicesSueltas(mias(g)), ancla: (g) => cartas(indicesSueltas(mias(g))),
  },
  boton(1, 'descarte', undefined, 'tut.g.descartar', A.descartar),
  {
    mano: 1, cuando: 'turno', fase: 'BET_3', rotulo: 'tut.g1.p8', avanza: 'lectura',
    // Las que llegaron ocupan el sitio de las que salieron (`applyDiscard` repone
    // en su índice); el controlador lo guarda al completar la selección (`guarda`).
    ancla: (g, ctx) => cartas(ctx.repuestas ?? []), vars: (g) => ({ n: suma(g) }),
  },
  { ...boton(1, 'turno', 'BET_3', 'tut.g1.p9', A.pasar), vars: (g) => ({ n: suma(g) }) },
  { ...boton(1, 'turno', 'BET_3', 'tut.g1.p10', A.igualar), vars: (g) => ({ n: suma(g) }) },
  {
    mano: 1, cuando: 'cobro', rotulo: 'tut.g1.p11', avanza: 'lectura',
    ancla: (g) => [A.rival(g.winner)],
    vars: (g) => {
      const w = g.players[g.winner]
      return { rival: w.name, m: w.score?.points ?? sumaDe(w.cards).points, n: suma(g) }
    },
  },
  boton(1, 'cobro', undefined, 'tut.g1.cierre', A.siguiente),

  // ── Mano 2 · «Mejorar y apostar» ──
  { mano: 2, cuando: 'turno', fase: 'BET_1', rotulo: 'tut.g2.p1', ancla: () => [...cartas(DOS), A.apostar], toque: A.apostar, avanza: 'toque' },
  { mano: 2, cuando: 'turno', fase: 'BET_2', rotulo: 'tut.g.igualaron', ancla: () => [A.pozo], avanza: 'lectura' },
  {
    mano: 2, cuando: 'turno', fase: 'BET_2', rotulo: 'tut.g2.p3', avanza: 'lectura',
    ancla: (g) => cartas(indicesDelPalo(mias(g))), vars: (g) => ({ n: suma(g) }),
  },
  boton(2, 'turno', 'BET_2', 'tut.g2.p4', A.mult(2)),
  boton(2, 'turno', 'BET_2', 'tut.g2.p5', A.apostar),
  {
    mano: 2, cuando: 'descarte', rotulo: 'tut.g2.p6', avanza: 'seleccion', guarda: 'repuestas',
    objetivo: (g) => indicesSueltas(mias(g)), ancla: (g) => cartas(indicesSueltas(mias(g))),
  },
  boton(2, 'descarte', undefined, 'tut.g.descartar', A.descartar),
  {
    mano: 2, cuando: 'turno', fase: 'BET_3', rotulo: 'tut.g2.p8', avanza: 'lectura',
    ancla: (g, ctx) => cartas(ctx.repuestas ?? []), vars: (g) => ({ n: suma(g) }),
  },
  boton(2, 'turno', 'BET_3', 'tut.g2.p9', A.mult(5)),
  boton(2, 'turno', 'BET_3', 'tut.g.yapostar', A.apostar),
  {
    mano: 2, cuando: 'cobro', rotulo: 'tut.g2.p11', avanza: 'lectura',
    ancla: () => cartas(CINCO), vars: (g) => ({ n: suma(g), m: mejorRival(g), pozo: montoTexto(pozoDeMano(g)) }),
  },
  boton(2, 'cobro', undefined, 'tut.g2.cierre', A.siguiente),

  // ── Mano 3 · «AJILEI» ──
  { mano: 3, cuando: 'turno', fase: 'BET_1', rotulo: 'tut.g3.p1', ancla: () => [...cartas(DOS), A.apostar], toque: A.apostar, avanza: 'toque' },
  { mano: 3, cuando: 'turno', fase: 'BET_2', rotulo: 'tut.g.igualaron', ancla: () => [A.pozo], avanza: 'lectura' },
  { mano: 3, cuando: 'turno', fase: 'BET_2', rotulo: 'tut.g3.p3', ancla: () => cartas(CINCO), avanza: 'lectura' },
  boton(3, 'turno', 'BET_2', 'tut.g3.p4', A.mult(10)),
  boton(3, 'turno', 'BET_2', 'tut.g.yapostar', A.apostar),
  { mano: 3, cuando: 'descarte', rotulo: 'tut.g.igualaron.pozo', ancla: () => [A.pozo], avanza: 'lectura', vars: (g) => ({ pozo: montoTexto(g.pot) }) },
  boton(3, 'descarte', undefined, 'tut.g3.p7', A.descartar),
  boton(3, 'turno', 'BET_3', 'tut.g3.p8', A.mult(10)),
  boton(3, 'turno', 'BET_3', 'tut.g3.p9', A.apostar),
  { mano: 3, cuando: 'cobro', avanza: 'fin' },
])

/** Cuántos pasos tiene cada mano (para «Paso n de m»). */
export const pasosDeMano = (mano) => PASOS.filter((p) => p.mano === mano).length

// ── TUT-1 T4 · Dónde se para la mano para el paso n (el «momento» de un capítulo) ──
// Sale de los PASOS de arriba, no de una tabla aparte: si la guiada cambia, el
// momento cambia con ella.
const TERMINAN_TURNO = new Set([A.pasar, A.igualar, A.apostar])
const terminaTurno = (p) => p.avanza === 'toque' && TERMINAN_TURNO.has(p.toque ?? p.ancla()[0])

/**
 * La parada del paso `paso` (1…) de la mano `mano`, en términos de la mesa:
 *   · `{ fase: 'WAITING' }`: antes de «Iniciar mano»;
 *   · `{ fase: 'BET_k', turno: t }`: el turno `t` del humano en esa ronda (en la
 *     última ronda de la mano 1 hay dos: pasar, y luego igualar el ×1 de IA 1);
 *   · `{ fase: 'DISCARD', seleccion }`: el descarte; con `seleccion(g)` si un paso
 *     anterior de la mano ya eligió las cartas (el paso de «Descartar»);
 *   · `{ fase: 'PAYOUT' }`: el pago.
 * Pura. Lanza si el paso no existe.
 */
export function paradaDePaso(mano, paso) {
  const deMano = PASOS.filter((p) => p.mano === mano)
  const p = deMano[paso - 1]
  if (!p) throw new Error(`paradaDePaso: la mano ${mano} no tiene paso ${paso}`)
  const antes = deMano.slice(0, paso - 1)
  switch (p.cuando) {
    case 'inicio': return { fase: 'WAITING' }
    case 'turno': return { fase: p.fase, turno: 1 + antes.filter((q) => q.cuando === 'turno' && q.fase === p.fase && terminaTurno(q)).length }
    case 'descarte': {
      const sel = antes.find((q) => q.cuando === 'descarte' && q.avanza === 'seleccion')
      return { fase: 'DISCARD', seleccion: sel ? sel.objetivo : null }
    }
    default: return { fase: 'PAYOUT' }
  }
}
