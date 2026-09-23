// ── APU-1 1e-ii · La MESA: legalidad, ritmo, rondas mudas, recarga y capas ──
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §3. Normativo: AJILEI_APU-1_Reglas_v1.1
// §3.1, §3.2, §4.1, §4.2, §4.3, §5 y §6.9.
//
// Este proyecto NO tiene jsdom (hallazgo de FRZ-1), así que `GameTable.jsx` no
// se puede montar en una prueba. Todo lo que 1e-ii decide vive por eso en
// `hooks/mesaCore.js` y en `engine/pozos.js`, que son puros — y lo que se queda
// dentro del JSX lo mide Playwright en el modo `apu` del arnés.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  PHASES, createInitialState, startHand, advanceFromDeal, applyBetAction, applyDiscard,
  decidirIA, aplicarRecarga,
} from '../src/engine/gameEngine.js'
import { puedenHablar, rondaCerrada, accionesDe, capasDe, costoDe, esLegal } from '../src/engine/pozos.js'
import {
  ASIENTO_HUMANO, filaAcciones, multiplicadoresDe, marcadoAllIn, ritmoDe,
  esFaseDeApuesta, mesaClavada, anteDejaAMudos,
  pilaBaja, topeRecarga, recargaValida, opcionesRecarga, pideRecarga, RECARGA,
  nivelarLasIAS, repartoPorCapas, pozoPartido, umbralRecarga,
} from '../src/hooks/mesaCore.js'
import { componeCapas } from '../src/hooks/cronicaCore.js'
import { AJILEI_CONFIG } from '../src/config/ajileiConfig.js'
import { techoDe, pisoDe, jugadoresVsIA } from '../src/engine/entrada.js'
import { apuestasDe } from '../src/config/niveles.js'
import { setRng as sembrarMazo, resetRng as mazoSinSembrar } from '../src/engine/deck.js'
import { setRng as sembrarIA, resetRng as iaSinSembrar } from '../src/engine/aiPlayer.js'

const UNIT = 50

// Una mesa en una fase de apuesta, con las pilas que se pidan. Se construye con
// `createInitialState` y se le pone la fase a mano: son estados SINTÉTICOS para
// preguntas de legalidad, no manos jugadas. Las manos de verdad se juegan en el
// bloque 3, con `startHand`, que es donde importa que el motor participe.
function mesa(chips, extra = {}) {
  const st = createInitialState(UNIT, chips.map((c, i) => ({
    isHuman: i === 0, chips: c, name: i === 0 ? 'Tú' : `IA ${i}`,
  })))
  return { ...st, phase: PHASES.BET_1, activePlayerIndex: 0, ...extra }
}

describe('1. §3.1 · La fila de acciones sale de la legalidad, no de una copia suya', () => {
  it('sin apuesta viva: pasar, apostar y retirarse; nunca igualar ni all-in', () => {
    const g = mesa([1000, 1000])
    expect(filaAcciones(g, 1).map(a => a.id)).toEqual(['pasar', 'apostar', 'retirarse'])
  })

  it('con apuesta viva que la pila cubre: igualar y subir, nunca all-in', () => {
    const g = mesa([1000, 1000], { currentBet: UNIT })
    const ids = filaAcciones(g, 1).map(a => a.id)
    expect(ids).toContain('igualar')
    expect(ids).toContain('subir')
    expect(ids).not.toContain('allIn')
    expect(ids).not.toContain('pasar')
  })

  // §4.1 · EL CASO QUE EL BOTÓN EXISTE PARA ATENDER, y la propiedad que hace que
  // la pantalla no tenga que decidir cuál de los dos enseña.
  it('con apuesta viva que la pila NO cubre: all-in EN LUGAR de igualar', () => {
    const g = mesa([25, 1000], { currentBet: UNIT })
    const ids = filaAcciones(g, 1).map(a => a.id)
    expect(ids).toEqual(['allIn', 'retirarse'])
  })

  it('igualar y all-in son EXCLUYENTES en cualquier pila', () => {
    for (const pila of [0, 1, 25, 49, 50, 51, 500, 5000]) {
      const ids = filaAcciones(mesa([pila, 1000], { currentBet: UNIT }), 1).map(a => a.id)
      expect(ids.includes('igualar') && ids.includes('allIn')).toBe(false)
    }
  })

  it('el all-in cuesta la pila ENTERA, que es lo que el botón dice', () => {
    const g = mesa([25, 1000], { currentBet: UNIT })
    expect(filaAcciones(g, 1).find(a => a.id === 'allIn').costo).toBe(25)
  })

  it('fuera de turno la fila está vacía, y no por una condición de la pantalla', () => {
    const g = mesa([1000, 1000], { activePlayerIndex: 1 })
    expect(filaAcciones(g, 1)).toEqual([])
  })

  it('fuera de las fases con apuesta, también', () => {
    for (const phase of [PHASES.WAITING, PHASES.DEAL_2, PHASES.DISCARD, PHASES.PAYOUT]) {
      expect(filaAcciones(mesa([1000, 1000], { phase }), 1)).toEqual([])
    }
  })

  it('un retirado y un all-in no tienen fila', () => {
    const conFolded = mesa([1000, 1000])
    conFolded.players[0] = { ...conFolded.players[0], folded: true }
    expect(filaAcciones(conFolded, 1)).toEqual([])
    const conAllIn = mesa([1000, 1000])
    conAllIn.players[0] = { ...conAllIn.players[0], allIn: true }
    expect(filaAcciones(conAllIn, 1)).toEqual([])
  })

  // El multiplicador se juzga por lo que CUESTA la acción, no por el monto.
  // `betAmount > playerChips` —la guarda vieja— apagaba multiplicadores que sí
  // se podían pagar, porque subir cuesta la diferencia con lo ya puesto.
  it('el gris del multiplicador mira el COSTO, no el monto', () => {
    // Apuesta viva de 100, el humano ya puso 50: subir ×1 cuesta 100, no 50.
    const g = mesa([200, 1000], { currentBet: 100 })
    g.players[0] = { ...g.players[0], contrib: 50 }
    const m = multiplicadoresDe(g)
    expect(m.find(x => x.k === 1)).toMatchObject({ monto: 50, costo: 100, disponible: true })
    expect(m.find(x => x.k === 2)).toMatchObject({ monto: 100, costo: 150, disponible: true })
    expect(m.find(x => x.k === 10).disponible).toBe(false)
  })

  it('los cuatro multiplicadores son los del normativo y no se inventan aquí', () => {
    expect(multiplicadoresDe(mesa([5000, 5000])).map(m => m.k))
      .toEqual(AJILEI_CONFIG.betting.multiplicadores)
  })
})

describe('2. §6.9 · El ritmo sale del peso de la decisión, y es una BANDA', () => {
  const BANDAS   = AJILEI_CONFIG.ui.ritmoIA
  const MUESTRAS = 200

  // 1e-ii puso tres cifras fijas; 1e-iii las abre a rangos, que es lo que la
  // ficha madre §3.3 pedía. La razón se OYE antes de explicarse: tres valores
  // exactos son un metrónomo —la misma espera al milisegundo, mano tras mano—
  // y eso delata que detrás hay una tabla y no alguien pensando.
  for (const peso of ['leve', 'media', 'grande']) {
    it(`«${peso}»: doscientas muestras caen todas dentro de su banda`, () => {
      const [min, max] = BANDAS[peso]
      for (let i = 0; i < MUESTRAS; i++) {
        const ms = ritmoDe(peso)
        expect(ms).toBeGreaterThanOrEqual(min)
        expect(ms).toBeLessThanOrEqual(max)
      }
    })
  }

  it('las bandas no se solapan: lo leve nunca tarda lo que lo grande', () => {
    expect(BANDAS.leve[1]).toBeLessThanOrEqual(BANDAS.media[0])
    expect(BANDAS.media[1]).toBeLessThanOrEqual(BANDAS.grande[0])
  })

  // El compás de antes de 1e eran 1.125 ms para TODO. La banda de en medio lo
  // sigue conteniendo, para que la mesa corriente suene como en las tandas que
  // la calibraron.
  it('la banda de en medio contiene el compás único de antes de 1e', () => {
    expect(BANDAS.media[0]).toBeLessThanOrEqual(1125)
    expect(BANDAS.media[1]).toBeGreaterThanOrEqual(1125)
  })

  it('no es un metrónomo: doscientas muestras del mismo peso no dan un solo valor', () => {
    const vistos = new Set()
    for (let i = 0; i < MUESTRAS; i++) vistos.add(ritmoDe('media'))
    expect(vistos.size).toBeGreaterThan(1)
  })

  it('un peso desconocido o ausente cae a «media», nunca a undefined', () => {
    const [min, max] = BANDAS.media
    for (const peso of ['rarísimo', undefined, null, 7]) {
      const ms = ritmoDe(peso)
      expect(Number.isFinite(ms)).toBe(true)
      expect(ms).toBeGreaterThanOrEqual(min)
      expect(ms).toBeLessThanOrEqual(max)
    }
  })
})

// ── 3 · E-13: UN ALL-IN SE RESPONDE ────────────────────────────────────────
// La reproducción de E-13 vivía aquí con el veredicto contrario, y era la
// prueba que lo descubrió: el motor cerraba la ronda en cuanto el penúltimo
// asiento con fichas se marcaba all-in, y el último conservaba su pila entera
// sin haber dicho si pagaba. 1e-iii borra esa línea y estas pruebas cambian de
// veredicto — con las tres salidas del rival medidas una por una.
describe('3. E-13 · El último con fichas TIENE que responder al all-in', () => {
  // Mesa de dos, tres apuestas cada uno. Tras el ante quedan dos; quien abre
  // las empuja con un ×2 que cuesta justo lo que tiene.
  function empujaElQueAbre() {
    const st = createInitialState(UNIT, [
      { isHuman: true,  chips: UNIT * 3, name: 'Tú' },
      { isHuman: false, chips: UNIT * 3, name: 'IA 1' },
    ])
    let g = advanceFromDeal(startHand(st))
    const abre = g.activePlayerIndex
    const otro = abre === 0 ? 1 : 0
    g = applyBetAction(g, abre, 'apostar', 2)
    return { g, abre, otro }
  }

  it('la ronda SIGUE ABIERTA y la palabra pasa al rival', () => {
    const { g, abre, otro } = empujaElQueAbre()
    expect(g.players[abre]).toMatchObject({ chips: 0, allIn: true })
    // Las cuatro líneas que E-13 daba al revés.
    expect(g.phase).toBe(PHASES.BET_1)
    expect(g.activePlayerIndex).toBe(otro)
    expect(g.players[otro].acted).toBe(false)
    expect(rondaCerrada(g)).toBe(false)
    // Y tiene con qué responder: cubre la apuesta justa.
    expect(accionesDe(g, otro)).toContain('igualar')
    expect(g.players[otro].chips).toBe(UNIT * 2)
  })

  it('(a) paga · la ronda cierra y los dos quedan al mismo nivel', () => {
    const { g, otro } = empujaElQueAbre()
    const paga = applyBetAction(g, otro, 'igualar', 1)
    expect(paga.phase).not.toBe(PHASES.BET_1)
    expect(paga.players[otro]).toMatchObject({ chips: 0, allIn: true })
    // Igualados a la ficha: UNA capa, los dos elegibles. Que la capa sea una
    // sola es la prueba de que el all-in se pagó entero.
    const capas = capasDe(paga)
    expect(capas).toHaveLength(1)
    expect(capas[0].elegibles).toEqual([0, 1])
    expect(capas[0].monto).toBe(UNIT * 6)
  })

  it('(b) no cubre · all-in defensivo (§4.1), y lo no igualado vuelve (D-7)', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true,  chips: UNIT * 3, name: 'Tú' },
      { isHuman: false, chips: UNIT * 2, name: 'IA 1' },
    ])
    let g = advanceFromDeal(startHand(st))
    // Quien abre no siempre es el humano. Si abre la IA, pasa y le devuelve la
    // palabra — y pasar NO cierra la ronda: el otro todavía no ha hablado.
    if (g.activePlayerIndex !== 0) {
      g = applyBetAction(g, g.activePlayerIndex, 'pasar', 1)
      expect(g.phase).toBe(PHASES.BET_1)
    }
    expect(g.activePlayerIndex).toBe(0)
    g = applyBetAction(g, 0, 'apostar', 2)            // 100: su pila entera
    expect(g.players[0]).toMatchObject({ chips: 0, allIn: true })
    expect(g.phase).toBe(PHASES.BET_1)
    expect(g.players[1].chips).toBe(UNIT)             // media apuesta: no cubre
    expect(accionesDe(g, 1)).toEqual(['allIn', 'retirarse'])

    const def = applyBetAction(g, 1, 'allIn', 1)
    expect(def.phase).not.toBe(PHASES.BET_1)
    expect(def.players[1]).toMatchObject({ chips: 0, allIn: true })
    const capas = capasDe(def)
    expect(capas).toHaveLength(2)
    expect(capas[0]).toMatchObject({ monto: UNIT * 4, elegibles: [0, 1] })
    expect(capas[1]).toMatchObject({ monto: UNIT, elegibles: [0] })
  })

  it('(c) se retira · el pozo entero para quien empujó', () => {
    const { g, abre, otro } = empujaElQueAbre()
    const fold = applyBetAction(g, otro, 'retirarse', 1)
    expect(fold.phase).toBe(PHASES.PAYOUT)
    expect(fold.winner).toBe(abre)
    expect(fold.players[abre].chips).toBe(UNIT * 4)   // los dos antes + la apuesta
    expect(fold.pot).toBe(0)
  })

  it('regresión del caso corriente: dos con fichas y nadie ha hablado, ronda abierta', () => {
    const g = mesa([UNIT * 20, UNIT * 20])
    expect(rondaCerrada(g)).toBe(false)
    expect(mesaClavada(g)).toBe(false)
  })
})

// ── 3b · §4.3 DESDE EL MOTOR ───────────────────────────────────────────────
// «Si queda un solo jugador con fichas, las rondas de apuesta restantes no
// existen.» 1e-ii lo cumplía desde la pantalla, pulsando «pasar» por el único
// asiento con fichas; 1e-iii lo pasa al motor, que es quien puede decidir si
// una fase existe — y de paso alcanza el caso hermano, que la pantalla no
// podía tocar: que no quede NADIE con fichas (D-12, ruta 2).
describe('3b. §4.3 · Una ronda de apuesta que no se puede jugar NO SE ABRE', () => {
  it('todos all-in por el ante (mesa 3): la mano corre sola hasta el showdown', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true,  chips: UNIT, name: 'Tú' },
      { isHuman: false, chips: UNIT, name: 'IA 1' },
      { isHuman: false, chips: UNIT, name: 'IA 2' },
    ])
    let g = startHand(st)
    expect(g.players.every(p => p.allIn)).toBe(true)
    expect(puedenHablar(g)).toEqual([])

    g = advanceFromDeal(g)                    // BET_1 no se abre
    expect(g.phase).toBe(PHASES.DEAL_3)
    expect(mesaClavada(g)).toBe(false)
    g = advanceFromDeal(g)                    // BET_2 tampoco
    expect(g.phase).toBe(PHASES.DISCARD)      // el DESCARTE no se salta nunca
    expect(mesaClavada(g)).toBe(false)
    g = applyDiscard(g, [])                   // BET_3 tampoco
    expect(g.phase).toBe(PHASES.PAYOUT)

    expect(g.winner).not.toBe(null)
    expect(g.pot).toBe(0)
    expect(g.players.reduce((n, p) => n + p.chips, 0)).toBe(UNIT * 3)
    // §4.4: el asiento en all-in descarta igual, y sus cartas siguen jugando.
    g.players.forEach(p => expect(p.cards).toHaveLength(5))
  })

  it('todos all-in apostando en BET_1 (mesa 2): BET_2 y BET_3 no nacen', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true,  chips: UNIT * 3, name: 'Tú' },
      { isHuman: false, chips: UNIT * 3, name: 'IA 1' },
    ])
    let g = advanceFromDeal(startHand(st))
    expect(g.phase).toBe(PHASES.BET_1)
    const abre = g.activePlayerIndex
    g = applyBetAction(g, abre, 'apostar', 2)
    g = applyBetAction(g, abre === 0 ? 1 : 0, 'igualar', 1)
    expect(g.players.every(p => p.allIn)).toBe(true)
    expect(g.phase).toBe(PHASES.DEAL_3)
    g = advanceFromDeal(g)
    expect(g.phase).toBe(PHASES.DISCARD)
    g = applyDiscard(g, [])
    expect(g.phase).toBe(PHASES.PAYOUT)
    expect(g.players.reduce((n, p) => n + p.chips, 0)).toBe(UNIT * 6)
  })

  it('todos all-in apostando en BET_1 (mesa 4): idem, y el pozo se reparte entero', () => {
    const st = createInitialState(UNIT, Array.from({ length: 4 }, (_, i) => ({
      isHuman: i === 0, chips: UNIT * 2, name: i === 0 ? 'Tú' : `IA ${i}`,
    })))
    let g = advanceFromDeal(startHand(st))
    expect(g.phase).toBe(PHASES.BET_1)
    g = applyBetAction(g, g.activePlayerIndex, 'apostar', 1)   // su pila entera
    let vueltas = 0
    while (g.phase === PHASES.BET_1 && vueltas++ < 8) {
      g = applyBetAction(g, g.activePlayerIndex, 'igualar', 1)
    }
    expect(g.players.every(p => p.allIn)).toBe(true)
    expect(g.phase).toBe(PHASES.DEAL_3)
    g = advanceFromDeal(g)
    expect(g.phase).toBe(PHASES.DISCARD)
    g = applyDiscard(g, [])
    expect(g.phase).toBe(PHASES.PAYOUT)
    expect(g.players.reduce((n, p) => n + p.chips, 0)).toBe(UNIT * 8)
  })

  it('un solo asiento con fichas tras BET_1: se saltan las fases y su pila no se mueve', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true,  chips: UNIT * 10, name: 'Tú' },
      { isHuman: false, chips: UNIT * 3,  name: 'IA 1' },
      { isHuman: false, chips: UNIT,      name: 'IA 2' },
    ])
    let g = advanceFromDeal(startHand(st))
    expect(g.players[2].allIn).toBe(true)      // se quedó en el ante
    expect(g.phase).toBe(PHASES.BET_1)         // todavía quedan DOS que pueden
    let vueltas = 0
    while (g.phase === PHASES.BET_1 && vueltas++ < 8) {
      const seat = g.activePlayerIndex
      const puede = accionesDe(g, seat)
      g = applyBetAction(g, seat, puede.includes('igualar') ? 'igualar' : 'apostar', 2)
    }
    expect(g.phase).toBe(PHASES.DEAL_3)
    expect(puedenHablar(g)).toEqual([0])

    const pila = g.players[0].chips
    g = advanceFromDeal(g)
    expect(g.phase).toBe(PHASES.DISCARD)       // BET_2 no se abre
    expect(g.players[0].chips).toBe(pila)
    expect(g.players[0].acted).toBe(false)     // nunca tuvo que decir nada
    g = applyDiscard(g, [])
    expect(g.phase).toBe(PHASES.PAYOUT)        // BET_3 tampoco
    expect(g.players[0].acted).toBe(false)
  })

  // D-12 ruta 1 · el ante que deja a TODOS en cero. Sigue siendo real, y ahora
  // tiene dos cierres: la pantalla no reparte esa mano (recarga forzosa) y, si
  // por otro camino se llegara ahí, el motor no abre la ronda. La red y el
  // cinturón, que es lo que un estado sin salida merece.
  it('`anteDejaAMudos` ve venir la ruta (a) desde el pago anterior', () => {
    expect(anteDejaAMudos(mesa([UNIT, UNIT, UNIT]))).toBe(true)
    expect(anteDejaAMudos(mesa([UNIT, UNIT, UNIT * 2]))).toBe(false)
    expect(anteDejaAMudos(mesa([UNIT * 3, UNIT]))).toBe(false)
  })

  it('un asiento eliminado no cuenta como vivo para esa cuenta', () => {
    const g = mesa([UNIT, UNIT, 0])
    g.players[2] = { ...g.players[2], eliminated: true, folded: true }
    expect(anteDejaAMudos(g)).toBe(true)
  })
})

// ── 3c · LA COPIA PÚBLICA Y LA PRIVADA ─────────────────────────────────────
describe('3c. `pozos.rondaCerrada` y el `isRoundOver` del motor dicen lo mismo', () => {
  // El `isRoundOver` del motor es privado y `gameEngine.js` está protegido, así
  // que `pozos.rondaCerrada` lo REPLICA. En 1e-iii las dos copias se editaron a
  // la vez (E-13), y esta confrontación es lo único que demuestra que siguen
  // diciendo lo mismo.
  //
  // El veredicto del motor se lee por donde se puede leer: si la ronda quedó
  // cerrada, `applyBetAction` avanza de fase; si no, devuelve la misma. Para
  // que la comparación no sea vacía se ANCLA — el estado que juzga la copia se
  // construye aquí, y cuando el motor no avanza se comprueba campo por campo
  // contra el que él devuelve.
  const foto = p => ({ acted: !!p.acted, contrib: p.contrib ?? 0, chips: p.chips, allIn: !!p.allIn })

  function simula(state, seat, accion) {
    const costo = costoDe(state, seat, accion, 1)
    return { ...state, players: state.players.map((p, i) => {
      if (i !== seat) return p
      const q = { ...p, acted: true }
      if (accion === 'igualar') { q.chips -= costo; q.contrib = state.currentBet }
      if (accion === 'allIn')   { q.chips -= costo; q.contrib = (q.contrib ?? 0) + costo }
      if (q.chips === 0) q.allIn = true
      return q
    }) }
  }

  // Todas en BET_2: cerrar la ronda ahí lleva al descarte y no pide mazo.
  const ESCENAS = [
    { nombre: 'nadie ha hablado: pasar no cierra',
      pilas: [500, 500, 500], cb: 0, accion: 'pasar',
      jugadores: [{}, {}, {}] },
    { nombre: 'los otros dos ya hablaron: pasar cierra',
      pilas: [500, 500, 500], cb: 0, accion: 'pasar',
      jugadores: [{}, { acted: true }, { acted: true }] },
    { nombre: 'a un all-in no se le espera: pasar cierra igual',
      pilas: [500, 0, 500], cb: 0, accion: 'pasar',
      jugadores: [{}, { allIn: true, acted: true }, { acted: true }] },
    { nombre: 'un pendiente que aún no habló mantiene la ronda abierta',
      pilas: [500, 0, 500], cb: 0, accion: 'pasar',
      jugadores: [{}, { allIn: true, acted: true }, {}] },
    { nombre: 'E-13 · el último con fichas paga el all-in y cierra',
      pilas: [300, 0, 0], cb: 200, accion: 'igualar',
      jugadores: [{ contrib: 0, contribMano: 50 },
                  { allIn: true, acted: true, contrib: 200, contribMano: 250 },
                  { folded: true }] },
    { nombre: 'E-13 · el que no cubre va all-in defensivo y cierra',
      pilas: [150, 0, 0], cb: 200, accion: 'allIn',
      jugadores: [{ contrib: 0, contribMano: 50 },
                  { allIn: true, acted: true, contrib: 200, contribMano: 250 },
                  { folded: true }] },
    { nombre: 'con otro que todavía puede pagar, igualar no cierra',
      pilas: [300, 300, 0], cb: 100, accion: 'igualar',
      jugadores: [{ contrib: 0 }, { contrib: 0 }, { allIn: true, acted: true, contrib: 100 }] },
  ]

  for (const e of ESCENAS) {
    it(e.nombre, () => {
      const base = mesa(e.pilas, { phase: PHASES.BET_2, currentBet: e.cb, activePlayerIndex: 0 })
      const g = { ...base, players: base.players.map((p, i) => ({ ...p, ...e.jugadores[i] })) }

      // Un estado que el motor entrega con la fase abierta nunca está cerrado.
      expect(rondaCerrada(g)).toBe(false)
      expect(accionesDe(g, 0)).toContain(e.accion)

      const next = applyBetAction(g, 0, e.accion, 1)
      expect(next).not.toBe(g)                       // la acción era legal
      const hipo  = simula(g, 0, e.accion)
      const cerro = next.phase !== g.phase
      expect(cerro).toBe(rondaCerrada(hipo))
      if (!cerro) expect(next.players.map(foto)).toEqual(hipo.players.map(foto))
    })
  }
})

// ── 3d · LA PROPIEDAD, SOBRE MANOS SEMBRADAS ───────────────────────────────
describe('3d. Propiedad · manos sembradas en Pro con entradas al mínimo', () => {
  // Donde más all-ins hay: reto Pro, entrada al PISO (10× la apuesta desde
  // 1f-A4; eran 5×), que es la
  // profundidad más corta que §2.2 permite. Se juegan manos de verdad con el
  // motor y se vigilan las tres propiedades que A-1 y A-2 prometen:
  //
  //   · ninguna fase de apuesta se ABRE con uno o ningún asiento que pueda
  //     hablar (§4.3 desde el motor),
  //   · ninguna mano se queda sin showdown ni sin ganador, y ninguna se cuelga,
  //   · el dinero se conserva entero de una mano a la siguiente.
  //
  // LAS IAS DECIDEN POR SÍ MISMAS; EL ASIENTO 0 NO PUEDE. `decideBetAction`
  // reparte temperamentos a los asientos de IA y el 0 no tiene ninguno —el
  // banco lo resuelve con un estado espejo—, así que aquí el humano lo conduce
  // un conductor propio: elige AL AZAR entre sus acciones legales y no se
  // retira mientras le quede otra cosa que hacer. No es una estrategia y no
  // pretende serlo; para lo que se está midiendo es mejor que una, porque
  // recorre estados que ninguna IA sensata visitaría.
  const MANOS   = 2000
  const APUESTA = apuestasDe('pro')[0]
  const ENTRADA = pisoDe(APUESTA)
  const MULTS   = AJILEI_CONFIG.betting.multiplicadores

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const azar = mulberry32(20260918)

  beforeAll(() => { sembrarMazo(azar); sembrarIA(azar) })
  afterAll(() => { mazoSinSembrar(); iaSinSembrar() })

  function decideHumano(g) {
    const todas = accionesDe(g, ASIENTO_HUMANO)
    if (!todas.length) return null
    const pool = todas.length > 1 ? todas.filter(a => a !== 'retirarse') : todas
    const action = pool[Math.floor(azar() * pool.length)]
    if (action !== 'apostar' && action !== 'subir') return { action, k: 1 }
    const ks = MULTS.filter(k => esLegal(g, ASIENTO_HUMANO, action, k).ok)
    return { action, k: ks[Math.floor(azar() * ks.length)] ?? 1 }
  }

  for (const N of [2, 3, 4, 5]) {
    it(`mesa de ${N}: ${MANOS} manos sin ronda muda, sin mano colgada y sin fichas perdidas`, () => {
      const nueva = () => createInitialState(APUESTA, jugadoresVsIA(ENTRADA, N, APUESTA))
      const falla = { abiertaSinJuego: 0, clavada: 0, ilegal: 0, sinGanador: 0, descuadre: 0, colgada: 0 }
      let s = nueva()
      let manos = 0
      let conShowdown = 0
      let conAllIn = 0

      while (manos < MANOS) {
        const antes = s.players.reduce((n, p) => n + p.chips, 0)
        let g = startHand(s)
        if (g.phase === PHASES.GAME_OVER) { s = nueva(); continue }

        let faseAnterior = null
        let pasos = 0
        while (g.phase !== PHASES.PAYOUT && g.phase !== PHASES.GAME_OVER && pasos++ < 400) {
          if (g.phase === PHASES.DEAL_2 || g.phase === PHASES.DEAL_3) { g = advanceFromDeal(g); continue }
          if (g.phase === PHASES.DISCARD) { g = applyDiscard(g, []); continue }
          if (!esFaseDeApuesta(g.phase)) break

          // La invariante de A-2, mirada SÓLO al abrir la fase: dentro de la
          // ronda es legítimo que quede un solo pendiente —es el que debe
          // responder al all-in, que es justamente lo que A-1 arregla—.
          if (g.phase !== faseAnterior && puedenHablar(g).length <= 1) falla.abiertaSinJuego++
          faseAnterior = g.phase
          if (mesaClavada(g)) falla.clavada++

          const seat = g.activePlayerIndex
          const d = seat === ASIENTO_HUMANO ? decideHumano(g) : decidirIA(g, seat)
          if (!d) { falla.ilegal++; break }
          const next = applyBetAction(g, seat, d.action, d.k)
          if (next === g) { falla.ilegal++; break }
          g = next
        }

        if (pasos >= 400) falla.colgada++
        if (g.phase === PHASES.PAYOUT) {
          if (g.winner === null || g.winner === undefined) falla.sinGanador++
          if (g.pot !== 0) falla.descuadre++
          if (g.players.reduce((n, p) => n + p.chips, 0) !== antes) falla.descuadre++
          conShowdown++
        }
        if (g.players.some(p => p.allIn)) conAllIn++
        manos++
        s = g.phase === PHASES.GAME_OVER ? nueva() : g
      }

      expect(falla).toEqual({ abiertaSinJuego: 0, clavada: 0, ilegal: 0, sinGanador: 0, descuadre: 0, colgada: 0 })
      expect(manos).toBe(MANOS)
      expect(conShowdown).toBe(MANOS)
      // Y que la muestra no sea vacía: con entradas al piso, los all-ins tienen
      // que salir a menudo. Si esto bajara, la propiedad de arriba estaría
      // pasando por no visitar nunca el caso que vigila.
      //
      // 1f-A4 · EL LISTÓN BAJA DE 1/20 A 1/40 DE LAS MANOS, y no porque el
      // motor haya cambiado: el PISO pasó de 5× a 10×, así que la entrada más
      // corta que §2.2 permite es hoy el doble de profunda y una pila tarda el
      // doble en agotarse. Medido con el piso nuevo, sobre 2.000 manos: mesa 2
      // 617, mesa 3 107, mesa 4 98, mesa 5 77. Con el piso viejo las cuatro
      // pasaban de 100. Setenta y siete all-ins siguen siendo muestra de sobra
      // para lo que este bloque vigila; cero no lo sería, y de eso trata el
      // listón. Si alguna vez vuelve a bajar, lo que hay que mirar es si la
      // profundidad cambió otra vez, no si el motor dejó de pagar all-ins.
      expect(conAllIn).toBeGreaterThan(MANOS / 40)
    })
  }
})

describe('4. §4.3 · La marca de all-in', () => {
  it('marca al que está en all-in y sigue en la mano', () => {
    const g = mesa([0, 1000])
    g.players[0] = { ...g.players[0], allIn: true }
    expect(marcadoAllIn(g.players[0])).toBe(true)
    expect(marcadoAllIn(g.players[1])).toBe(false)
  })

  it('no marca al retirado ni al eliminado: ésos ya no disputan nada', () => {
    expect(marcadoAllIn({ allIn: true, folded: true })).toBe(false)
    expect(marcadoAllIn({ allIn: true, eliminated: true })).toBe(false)
    expect(marcadoAllIn(null)).toBe(false)
  })
})

describe('5. §5 · La recarga entre manos', () => {
  const SALDO = 100000

  it('el listón es «pila < 5 × apuesta», y sale de la config', () => {
    expect(umbralRecarga(UNIT)).toBe(AJILEI_CONFIG.betting.recarga.umbral * UNIT)
    expect(pilaBaja(UNIT * 4, UNIT)).toBe(true)
    expect(pilaBaja(UNIT * 5, UNIT)).toBe(false)
  })

  it('el tope es lo que cabe bajo el techo Y lo que el bolsillo cubre', () => {
    // Pila vacía y bolsillo de sobra → el techo entero.
    expect(topeRecarga(0, UNIT, SALDO)).toBe(techoDe(UNIT))
    // Media mesa dentro → sólo lo que falta.
    expect(topeRecarga(techoDe(UNIT) - UNIT * 3, UNIT, SALDO)).toBe(UNIT * 3)
    // Ya en el techo → nada.
    expect(topeRecarga(techoDe(UNIT), UNIT, SALDO)).toBe(0)
    // Bolsillo corto → manda el bolsillo, y en múltiplos de la apuesta.
    expect(topeRecarga(0, UNIT, UNIT * 2 + 7)).toBe(UNIT * 2)
  })

  it('una recarga es válida como una entrada: múltiplo, bajo techo y con saldo', () => {
    expect(recargaValida(UNIT * 5, 0, UNIT, SALDO).ok).toBe(true)
    expect(recargaValida(UNIT * 5 + 1, 0, UNIT, SALDO)).toMatchObject({ motivo: 'monto_invalido' })
    expect(recargaValida(0, 0, UNIT, SALDO)).toMatchObject({ motivo: 'monto_invalido' })
    expect(recargaValida(techoDe(UNIT) + UNIT, 0, UNIT, SALDO)).toMatchObject({ motivo: 'sobre_techo' })
    expect(recargaValida(UNIT * 5, 0, UNIT, UNIT)).toMatchObject({ motivo: 'sin_saldo' })
  })

  // E-2 otra vez: los tres botones SIEMPRE están, y lo que cambia es el gris.
  // Una fila que cambia de número de botones mueve lo que hay debajo.
  it('los tres montos están siempre, se puedan pagar o no', () => {
    expect(opcionesRecarga(0, UNIT, SALDO).map(o => o.id)).toEqual(['piso', 'medio', 'techo'])
    expect(opcionesRecarga(techoDe(UNIT), UNIT, 0).map(o => o.id)).toEqual(['piso', 'medio', 'techo'])
  })

  it('«Mínimo» y «Medio» son las MISMAS cifras que las de la entrada', () => {
    const o = opcionesRecarga(0, UNIT, SALDO)
    expect(o.find(x => x.id === 'piso').monto).toBe(pisoDe(UNIT))
    expect(o.find(x => x.id === 'medio').monto).toBe(20 * UNIT)  // 1f-A4: era 15×
  })

  it('«Al techo» es lo que FALTA para llenar la mesa, no una cifra fija', () => {
    const o = opcionesRecarga(techoDe(UNIT) - UNIT * 4, UNIT, SALDO)
    expect(o.find(x => x.id === 'techo').monto).toBe(UNIT * 4)
  })

  it('con la pila en el techo los tres se apagan, ninguno desaparece', () => {
    const o = opcionesRecarga(techoDe(UNIT), UNIT, SALDO)
    expect(o.every(x => x.disabled)).toBe(true)
    expect(o).toHaveLength(3)
  })

  describe('cuál de las tres preguntas toca', () => {
    const enPago = (chips) => ({ ...mesa([chips, 1000]), phase: PHASES.PAYOUT })

    it('dentro de una mano NUNCA', () => {
      for (const phase of [PHASES.BET_1, PHASES.BET_2, PHASES.BET_3, PHASES.DISCARD, PHASES.DEAL_2]) {
        expect(pideRecarga({ ...mesa([UNIT, 1000]), phase }, SALDO)).toBe(RECARGA.NINGUNA)
      }
    })

    it('voluntaria cuando la pila va sobrada', () => {
      expect(pideRecarga(enPago(UNIT * 20), SALDO)).toBe(RECARGA.VOLUNTARIA)
    })

    it('automática bajo el listón de §5.1', () => {
      expect(pideRecarga(enPago(UNIT * 4), SALDO)).toBe(RECARGA.AUTOMATICA)
    })

    it('forzosa cuando no cubre el ante (§5.4)', () => {
      expect(pideRecarga(enPago(UNIT - 1), SALDO)).toBe(RECARGA.FORZOSA)
    })

    // La otra mitad de la forzosa, y la razón de que exista: es lo único que
    // cierra la ruta (a) de D-12 sin abrir el motor.
    it('forzosa cuando el ante dejaría a todos mudos (D-12)', () => {
      const g = { ...mesa([UNIT, UNIT]), phase: PHASES.PAYOUT }
      expect(pideRecarga(g, SALDO)).toBe(RECARGA.FORZOSA)
    })

    it('ninguna sin bolsillo: una pregunta con una sola respuesta no es pregunta', () => {
      expect(pideRecarga(enPago(UNIT * 4), 0)).toBe(RECARGA.NINGUNA)
      expect(pideRecarga(enPago(UNIT - 1), 0)).toBe(RECARGA.NINGUNA)
    })

    it('ninguna con la pila ya en el techo', () => {
      expect(pideRecarga(enPago(techoDe(UNIT)), SALDO)).toBe(RECARGA.NINGUNA)
    })
  })

  describe('§5.3 · el nivelado de las IAS', () => {
    it('completa HACIA ARRIBA y no le quita nada a la que va sobrada', () => {
      const g = mesa([1000, 200, 3000])
      const subidas = nivelarLasIAS(g)
      // pila_IA = min(round(1000 × 1,5), techo) = 1500; el techo de 50 es 2500.
      expect(subidas).toEqual([{ seat: 1, monto: 1300 }])
    })

    it('las eliminadas no vuelven', () => {
      const g = mesa([1000, 0, 0])
      g.players[1] = { ...g.players[1], eliminated: true }
      expect(nivelarLasIAS(g).map(x => x.seat)).toEqual([2])
    })

    it('el techo de la mesa topa también a las IAS', () => {
      const g = mesa([techoDe(UNIT), 0])
      expect(nivelarLasIAS(g)).toEqual([{ seat: 1, monto: techoDe(UNIT) }])
    })

    // La recarga sube la PILA y la ENTRADA a la vez, y eso es lo que hace que
    // la cuenta final siga siendo honesta: lo recargado es dinero puesto.
    it('`aplicarRecarga` sube pila y entrada, así que las netas no mienten', () => {
      const g = { ...mesa([500, 1000]), phase: PHASES.PAYOUT }
      const tras = aplicarRecarga(g, ASIENTO_HUMANO, 750)
      expect(tras.players[0].chips).toBe(1250)
      expect(tras.players[0].entrada).toBe(g.players[0].entrada + 750)
      expect(tras.players[0].chips - tras.players[0].entrada)
        .toBe(g.players[0].chips - g.players[0].entrada)
    })
  })
})

describe('6. §4.2 · Las capas, y la frase que las cuenta', () => {
  // Un pozo con dos niveles: la IA 1 fue all-in con 100 y los otros dos
  // llegaron a 300. Capa 1 = 300 (los tres), capa superior = 400 (los dos).
  function conCapas() {
    const g = mesa([300, 100, 300], { phase: PHASES.PAYOUT, pot: 700, manoIndex: 0, winner: 0 })
    g.players = g.players.map((p, i) => ({
      ...p,
      contribMano: [300, 100, 300][i],
      allIn: i === 1,
      score: { palo: 'Copas', points: [41, 45, 30][i] },
    }))
    return g
  }

  it('el pozo se parte en dos capas y la suma cuadra con el pote', () => {
    const capas = capasDe(conCapas())
    expect(capas.map(c => c.monto)).toEqual([300, 400])
    expect(capas.reduce((s, c) => s + c.monto, 0)).toBe(700)
  })

  it('cada capa tiene su ganador, y no tienen por qué ser el mismo', () => {
    const reparto = repartoPorCapas(conCapas())
    // La IA 1 tiene el mejor puntaje pero sólo es elegible para la de abajo.
    expect(reparto).toEqual([
      { monto: 300, elegibles: [0, 1, 2], ganador: 1 },
      { monto: 400, elegibles: [0, 2], ganador: 0 },
    ])
    expect(pozoPartido(conCapas())).toBe(true)
  })

  it('con una sola capa no hay nada que contar: es el pozo de siempre', () => {
    const g = mesa([300, 300], { phase: PHASES.PAYOUT, winner: 0 })
    g.players = g.players.map(p => ({ ...p, contribMano: 300, score: { palo: 'Oros', points: 30 } }))
    expect(pozoPartido(g)).toBe(false)
    expect(componeCapas(repartoPorCapas(g), g.players, 0)).toBe(null)
  })

  it('la frase nombra sólo lo que el resultado NO dice ya', () => {
    const g = conCapas()
    const texto = componeCapas(repartoPorCapas(g), g.players, 0)
    // El ganador principal (asiento 0) no se repite: su capa ya la dice el
    // resultado. Lo que se cuenta es la otra.
    expect(texto).toBe('El pozo se partió: IA 1 se lleva 300.')
  })

  it('cuando la capa se la lleva el humano, se le habla de tú', () => {
    const g = conCapas()
    g.players[1] = { ...g.players[1], score: { palo: 'Copas', points: 10 } }
    g.winner = 1
    const texto = componeCapas(repartoPorCapas(g), g.players, 1)
    expect(texto).toContain('Te llevas')
  })

  // D-7: la apuesta que nadie igualó VUELVE a quien la puso. Es dinero que el
  // jugador vio salir de su pila, así que decirlo no es opcional.
  it('la capa que no gana nadie se anuncia como lo que es: dinero que vuelve', () => {
    // Para que una capa se quede SIN elegibles hace falta que el único que no
    // está en all-in se haya retirado: los dos que siguen en pie sólo alcanzan
    // hasta su propio nivel. Es el caso de D-7, y es el que hace que el
    // invariante «todo el pozo se reparte» sea TOTAL y no «salvo un caso».
    const g = mesa([500, 100, 100], { phase: PHASES.PAYOUT, winner: 1 })
    g.players = g.players.map((p, i) => ({
      ...p,
      contribMano: [500, 100, 100][i],
      allIn: i !== 0,
      folded: i === 0,
      score: i === 0 ? null : { palo: 'Espadas', points: i === 1 ? 44 : 20 },
    }))
    const reparto = repartoPorCapas(g)
    expect(reparto.map(c => c.monto)).toEqual([300, 400])
    expect(reparto.map(c => c.ganador)).toEqual([1, -1])
    expect(componeCapas(reparto, g.players, 1)).toBe('El pozo se partió: 400 vuelven sin igualar.')
  })

  // ── E-23 (1e-iv) · UN GANADOR, UNA VEZ ───────────────────────────────────
  //
  // Las capas van de abajo arriba y sus elegibles sólo se ESTRECHAN, así que un
  // asiento que gana una capa gana también la siguiente mientras siga siendo
  // elegible: los repetidos son consecutivos y salen solos en cuanto hay tres
  // capas. La frase los sumaba por separado y nombraba dos veces al mismo.
  //
  // Tres niveles de all-in (100, 300, 500) parten el pozo en tres capas, y el
  // ganador principal es el de la de ARRIBA —que es la única que el resultado
  // ya cuenta—, con lo que las otras dos quedan para esta frase.
  function tresCapas(puntajes) {
    const g = mesa([100, 300, 500, 500], { phase: PHASES.PAYOUT, pot: 1400, manoIndex: 0, winner: 2 })
    g.players = g.players.map((p, i) => ({
      ...p,
      contribMano: [100, 300, 500, 500][i],
      allIn: i < 2,
      score: { palo: 'Copas', points: puntajes[i] },
    }))
    return g
  }

  it('dos capas del MISMO asiento se dicen una sola vez, con la suma', () => {
    const g = tresCapas([30, 50, 40, 20])
    const reparto = repartoPorCapas(g)
    expect(reparto.map(c => c.monto)).toEqual([400, 600, 400])
    expect(reparto.map(c => c.ganador)).toEqual([1, 1, 2])
    // Antes de E-23: «IA 1 se lleva 400. IA 1 se lleva 600.»
    expect(componeCapas(reparto, g.players, 2)).toBe('El pozo se partió: IA 1 se lleva 1000.')
  })

  it('dos capas de asientos DISTINTOS se siguen diciendo por separado', () => {
    const g = tresCapas([50, 45, 40, 20])
    const reparto = repartoPorCapas(g)
    expect(reparto.map(c => c.ganador)).toEqual([0, 1, 2])
    const texto = componeCapas(reparto, g.players, 2)
    expect(texto).toContain('Te llevas otros 400')
    expect(texto).toContain('IA 1 se lleva 600.')
  })
})

describe('7. El molde `?apu`, por su PROMESA y no por su URL', () => {
  // `siembraMesaAPU` lee `window.location`, que sin jsdom no existe: aquí
  // devolvería la identidad y la prueba no probaría nada. Lo que sí se puede
  // sellar —y es lo único que importa— es que las pilas que el molde siembra
  // produzcan los estados que promete, con el motor de verdad haciendo el resto.

  it('`allinIA` · una IA con la apuesta justa queda en all-in por el ANTE', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true, chips: 1500, name: 'Tú' },
      { isHuman: false, chips: UNIT, name: 'IA 1' },
      { isHuman: false, chips: 1500, name: 'IA 2' },
    ])
    const tras = startHand(st)
    expect(tras.players[1].allIn).toBe(true)
    expect(tras.players[1].chips).toBe(0)
    expect(tras.players[1].eliminated).toBe(false)   // sigue en la mano
    expect(marcadoAllIn(tras.players[1])).toBe(true)
    // Y no clava nada: los otros dos siguen pudiendo hablar.
    expect(puedenHablar(advanceFromDeal(tras))).toEqual([0, 2])
  })

  it('`allinHumano` · con 1,5 apuestas no cubre NINGUNA apuesta viva', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true, chips: Math.round(UNIT * 1.5), name: 'Tú' },
      { isHuman: false, chips: 2000, name: 'IA' },
    ])
    const b1 = advanceFromDeal(startHand(st))
    expect(b1.players[0].chips).toBe(25)          // le queda media apuesta
    expect(b1.players[0].allIn).toBe(false)       // pero sigue vivo
    const conApuesta = { ...b1, currentBet: UNIT, activePlayerIndex: 0 }
    expect(filaAcciones(conApuesta, 1).map(a => a.id)).toEqual(['allIn', 'retirarse'])
  })

  it('`recarga` · con 3 apuestas nace bajo el listón de §5.1', () => {
    expect(pilaBaja(UNIT * 3, UNIT)).toBe(true)
  })

  it('`sinRival` · todas las IAS con la apuesta justa dejan al humano solo', () => {
    const st = createInitialState(UNIT, [
      { isHuman: true, chips: 1500, name: 'Tú' },
      { isHuman: false, chips: UNIT, name: 'IA 1' },
      { isHuman: false, chips: UNIT, name: 'IA 2' },
      { isHuman: false, chips: UNIT, name: 'IA 3' },
    ])
    const tras = startHand(st)
    expect(puedenHablar(tras)).toEqual([0])
    // §4.3 desde el motor: la ronda no se abre, y el humano no tiene que
    // pulsar nada para decir que no puede hacer nada.
    const sigue = advanceFromDeal(tras)
    expect(sigue.phase).toBe(PHASES.DEAL_3)
    expect(mesaClavada(sigue)).toBe(false)
    expect(sigue.players[0].acted).toBe(false)
  })
})
