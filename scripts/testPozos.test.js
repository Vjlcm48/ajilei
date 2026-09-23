/**
 * APU-1 · Fase 1b-i — `src/engine/pozos.js`
 *
 * Normativo: `docs/AJILEI_APU-1_Reglas_v1.1.md` §3.2 (legalidad), §4.1 (all-in
 * defensivo) y §4.2 (capas del pozo).
 *
 * Las fixtures son estados SINTÉTICOS construidos a mano: no se llama a
 * `createInitialState` ni se importa `gameEngine.js`. Es deliberado — la puerta
 * STOP-1 de la ficha 1b no debe depender del motor, que todavía no está tocado.
 *
 * Ejecutar: npx vitest run scripts/testPozos.test.js
 */
import { describe, it, expect } from 'vitest'

import {
  costoDe,
  esLegal,
  accionesDe,
  capasDe,
  ganadoresPorCapa,
  repartirCapas,
} from '../src/engine/pozos.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function jugador(o = {}) {
  return {
    chips: 1000, contrib: 0, contribMano: 0, acted: false,
    folded: false, allIn: false, eliminated: false, ...o,
  }
}

// `pot` se deriva de las contribuciones a la mano, que es lo que el motor
// garantiza: todo lo que sale de una pila entra al pozo. Así el invariante
// `Σ capas === pot` se afirma contra un pozo real, no contra uno inventado.
function estado(players, o = {}) {
  return {
    phase:             'BET_2',
    numPlayers:        players.length,
    players,
    unit:              10,
    currentBet:        0,
    pot:               players.reduce((s, p) => s + (p.contribMano ?? 0), 0),
    activePlayerIndex: 0,
    manoIndex:         0,
    pieIndex:          players.length - 1,
    handCount:         1,
    ...o,
  }
}

const sumaCapas = capas => capas.reduce((s, c) => s + c.monto, 0)

// ── §4.2 · Capas ──────────────────────────────────────────────────────────────

describe('pozos.capasDe — capas del pozo (§4.2)', () => {
  it('sin all-in hay una sola capa con todo el pozo y todos los vivos elegibles', () => {
    const s = estado([
      jugador({ contribMano: 100 }),
      jugador({ contribMano: 100 }),
      jugador({ contribMano: 100 }),
    ])
    const capas = capasDe(s)
    expect(capas).toHaveLength(1)
    expect(capas[0].monto).toBe(300)
    expect(capas[0].elegibles).toEqual([0, 1, 2])
    expect(sumaCapas(capas)).toBe(s.pot)
  })

  it('un all-in parte el pozo en dos: la capa que él disputa y la superior sin él', () => {
    const s = estado([
      jugador({ contribMano: 100 }),
      jugador({ contribMano: 40, allIn: true, chips: 0 }),
      jugador({ contribMano: 100 }),
    ])
    const capas = capasDe(s)
    expect(capas).toHaveLength(2)
    expect(capas[0]).toEqual({ monto: 120, elegibles: [0, 1, 2] })
    expect(capas[1]).toEqual({ monto: 120, elegibles: [0, 2] })
    expect(sumaCapas(capas)).toBe(s.pot)
  })

  it('dos all-in a niveles distintos dan tres capas, cada una con menos elegibles', () => {
    const s = estado([
      jugador({ contribMano: 300 }),
      jugador({ contribMano: 50,  allIn: true, chips: 0 }),
      jugador({ contribMano: 120, allIn: true, chips: 0 }),
      jugador({ contribMano: 300 }),
    ])
    const capas = capasDe(s)
    expect(capas).toHaveLength(3)
    expect(capas[0]).toEqual({ monto: 200, elegibles: [0, 1, 2, 3] })
    expect(capas[1]).toEqual({ monto: 210, elegibles: [0, 2, 3] })
    expect(capas[2]).toEqual({ monto: 360, elegibles: [0, 3] })
    expect(sumaCapas(capas)).toBe(s.pot)
  })

  it('un all-in POR DEBAJO del ante también hace capa (§2.4: el corte es «menos de un ante»)', () => {
    const s = estado([
      jugador({ contribMano: 10 }),
      jugador({ contribMano: 4, allIn: true, chips: 0 }),
    ])
    const capas = capasDe(s)
    expect(capas).toEqual([
      { monto: 8, elegibles: [0, 1] },
      { monto: 6, elegibles: [0] },
    ])
    expect(sumaCapas(capas)).toBe(s.pot)
  })

  it('el retirado deja su dinero en la capa pero no es elegible en ninguna', () => {
    const s = estado([
      jugador({ contribMano: 100 }),
      jugador({ contribMano: 50, folded: true }),
      jugador({ contribMano: 80, allIn: true, chips: 0 }),
    ])
    const capas = capasDe(s)
    expect(capas[0]).toEqual({ monto: 210, elegibles: [0, 2] })
    expect(capas[1]).toEqual({ monto: 20, elegibles: [0] })
    expect(capas.every(c => !c.elegibles.includes(1))).toBe(true)
    expect(sumaCapas(capas)).toBe(s.pot)
  })

  it('la capa de monto 0 se omite (todos al mismo nivel: no hay capa superior)', () => {
    const s = estado([
      jugador({ contribMano: 100, allIn: true, chips: 0 }),
      jugador({ contribMano: 100 }),
      jugador({ contribMano: 100, allIn: true, chips: 0 }),
    ])
    const capas = capasDe(s)
    expect(capas).toHaveLength(1)
    expect(capas[0].monto).toBe(300)
    expect(capas.some(c => c.monto === 0)).toBe(false)
  })

  // El invariante de la casa. Contribuciones arbitrarias, no redondas, con
  // all-in y retirados mezclados, en las cuatro mesas que el juego admite.
  const MESAS = {
    2: [{ contribMano: 37 }, { contribMano: 21, allIn: true, chips: 0 }],
    3: [{ contribMano: 90 }, { contribMano: 13, allIn: true, chips: 0 }, { contribMano: 47, folded: true }],
    4: [{ contribMano: 111 }, { contribMano: 7, allIn: true, chips: 0 }, { contribMano: 111 }, { contribMano: 58, allIn: true, chips: 0 }],
    5: [{ contribMano: 260 }, { contribMano: 260 }, { contribMano: 33, allIn: true, chips: 0 }, { contribMano: 149, folded: true }, { contribMano: 91, allIn: true, chips: 0 }],
  }

  for (const [n, filas] of Object.entries(MESAS)) {
    it(`Σ capas === pot en mesa de ${n} con contribuciones arbitrarias`, () => {
      const s = estado(filas.map(jugador))
      const capas = capasDe(s)
      expect(sumaCapas(capas)).toBe(s.pot)
      expect(capas.every(c => Number.isInteger(c.monto) && c.monto > 0)).toBe(true)
    })
  }
})

// ── §4.2 · Ganadores y reparto ────────────────────────────────────────────────

describe('pozos.ganadoresPorCapa y repartirCapas (§4.2)', () => {
  const puntajes = tabla => p => tabla[p.id] ?? 0

  function conIds(filas) {
    return estado(filas.map((f, i) => jugador({ id: i, ...f })))
  }

  it('sin all-in gana una sola capa el de mayor puntaje', () => {
    const s = conIds([{ contribMano: 100 }, { contribMano: 100 }])
    const g = ganadoresPorCapa(s, puntajes([30, 45]))
    expect(g).toEqual([1])
    const players = repartirCapas(s, g)
    expect(players[1].chips).toBe(1200)   // 1.000 + el pozo entero (100 + 100)
    expect(players[0].chips).toBe(1000)
  })

  it('cada capa puede tener un ganador distinto', () => {
    // El all-in del asiento 1 gana la capa baja; el 0 gana la superior.
    const s = conIds([
      { contribMano: 100 },
      { contribMano: 40, allIn: true, chips: 0 },
      { contribMano: 100 },
    ])
    const g = ganadoresPorCapa(s, puntajes([41, 50, 20]))
    expect(g).toEqual([1, 0])
    const players = repartirCapas(s, g)
    expect(players[1].chips).toBe(120)   // capa baja entera
    expect(players[0].chips).toBe(1120)  // capa superior
    expect(players[2].chips).toBe(1000)
  })

  it('el empate DENTRO de una capa lo rompe la cercanía a la Mano', () => {
    // Mano en el asiento 2: con puntajes iguales gana él, no el índice 0.
    const s = conIds([{ contribMano: 50 }, { contribMano: 50 }, { contribMano: 50 }], )
    const sMano = { ...s, manoIndex: 2 }
    expect(ganadoresPorCapa(sMano, puntajes([44, 44, 44]))).toEqual([2])
    expect(ganadoresPorCapa({ ...s, manoIndex: 0 }, puntajes([44, 44, 44]))).toEqual([0])
  })

  it('la capa superior con un solo elegible vuelve entera a quien la puso', () => {
    // El asiento 0 puso 100 y nadie pudo igualar más de 40: los 60 sobrantes
    // son suyos aunque pierda el showdown (§4.2, «nadie gana de otro más de lo
    // que él mismo puso»).
    const s = conIds([
      { contribMano: 100 },
      { contribMano: 40, allIn: true, chips: 0 },
    ])
    const g = ganadoresPorCapa(s, puntajes([10, 51]))
    expect(g).toEqual([1, 0])
    const players = repartirCapas(s, g)
    expect(players[0].chips).toBe(1060)
    expect(players[1].chips).toBe(80)
  })

  it('el reparto conserva el pozo exacto, en enteros y sin sobrante', () => {
    const s = conIds([
      { contribMano: 260 },
      { contribMano: 33, allIn: true, chips: 0 },
      { contribMano: 149, folded: true },
      { contribMano: 91, allIn: true, chips: 0 },
    ])
    const g = ganadoresPorCapa(s, puntajes([28, 47, 51, 39]))
    const players = repartirCapas(s, g)
    const repartido = players.reduce((acc, p, i) => acc + (p.chips - s.players[i].chips), 0)
    expect(repartido).toBe(s.pot)
    expect(Number.isInteger(repartido)).toBe(true)
  })

  // D-7. El invariante `Σ repartido === pot` tiene que ser TOTAL: el árbitro de
  // MOT-1 no puede tener un estado donde falte dinero. La capa sin elegibles es
  // la apuesta no igualada y vuelve a quien la puso, como en el póker.
  it('una capa sin elegibles vuelve entera a quien la puso, y el pozo cuadra igual', () => {
    const s = conIds([
      { contribMano: 50,  allIn: true, chips: 0 },
      { contribMano: 300, folded: true },
      { contribMano: 200, allIn: true, chips: 0 },
    ])
    const capas = capasDe(s)
    expect(capas[2]).toEqual({ monto: 100, elegibles: [] })

    const g = ganadoresPorCapa(s, puntajes([40, 0, 60]))
    expect(g).toEqual([2, 2, -1])

    const players = repartirCapas(s, g)
    expect(players[2].chips).toBe(450)    // las dos capas que disputaba
    expect(players[1].chips).toBe(1100)   // sus 100 no igualados, de vuelta
    expect(players[0].chips).toBe(0)

    const repartido = players.reduce((acc, p, i) => acc + (p.chips - s.players[i].chips), 0)
    expect(repartido).toBe(s.pot)
  })

  it('repartirCapas no muta el estado que recibe', () => {
    const s = conIds([{ contribMano: 100 }, { contribMano: 100 }])
    const antes = JSON.stringify(s)
    const players = repartirCapas(s, ganadoresPorCapa(s, puntajes([10, 20])))
    expect(JSON.stringify(s)).toBe(antes)
    expect(players).not.toBe(s.players)
    expect(players[1]).not.toBe(s.players[1])
  })
})

// ── §3.2 y §4.1 · Costo, legalidad y acciones ────────────────────────────────

describe('pozos.costoDe — cuánto cuesta cada acción (§3.2)', () => {
  it('las cinco acciones con costo dan la cifra exacta, y las gratis dan 0', () => {
    const s = estado(
      [jugador({ chips: 500, contrib: 20 }), jugador()],
      { currentBet: 50, unit: 10 },
    )
    expect(costoDe(s, 0, 'pasar')).toBe(0)
    expect(costoDe(s, 0, 'retirarse')).toBe(0)
    expect(costoDe(s, 0, 'apostar', 2)).toBe(20)   // k × unit
    expect(costoDe(s, 0, 'subir', 2)).toBe(50)     // (apuesta viva + k × unit) − contrib
    expect(costoDe(s, 0, 'igualar')).toBe(30)      // apuesta viva − contrib
    expect(costoDe(s, 0, 'allIn')).toBe(500)       // la pila entera
  })
})

describe('pozos.esLegal — los once motivos de rechazo (§3.2)', () => {
  const base = (over = {}, jug = {}) => estado(
    [jugador({ chips: 500, ...jug }), jugador()],
    { currentBet: 0, activePlayerIndex: 0, ...over },
  )
  const motivo = (s, ...args) => esLegal(s, ...args).motivo

  it('cada motivo sale en su caso y no en otro', () => {
    // fase: fuera de BET_1/2/3 no se apuesta.
    expect(motivo(base({ phase: 'DISCARD' }), 0, 'pasar')).toBe('fase')
    // retirado y en all-in: se comprueban ANTES que el turno, para que el
    // motivo verdadero sea observable aunque el asiento sea el activo.
    expect(motivo(base({}, { folded: true }), 0, 'pasar')).toBe('retirado')
    expect(motivo(base({}, { eliminated: true }), 0, 'pasar')).toBe('retirado')
    expect(motivo(base({}, { allIn: true }), 0, 'pasar')).toBe('en_all_in')
    expect(motivo(base({ activePlayerIndex: 1 }), 0, 'pasar')).toBe('fuera_de_turno')
    // monto: k debe ser uno de los cuatro multiplicadores.
    expect(motivo(base(), 0, 'apostar', 3)).toBe('monto_invalido')
    expect(motivo(base(), 0, 'apostar', 1.5)).toBe('monto_invalido')
    expect(motivo(base(), 0, 'apostar', -1)).toBe('monto_invalido')
    // no alcanza: ×10 sobre unidad 10 son 100, y solo tiene 50.
    expect(motivo(base({}, { chips: 50 }), 0, 'apostar', 10)).toBe('no_alcanza')
    // apostar con apuesta viva / igualar sin ella.
    expect(motivo(base({ currentBet: 50 }), 0, 'apostar', 1)).toBe('hay_apuesta')
    expect(motivo(base({ currentBet: 50 }), 0, 'pasar')).toBe('hay_apuesta')
    expect(motivo(base(), 0, 'igualar')).toBe('sin_apuesta')
    expect(motivo(base(), 0, 'subir', 1)).toBe('sin_apuesta')
    // all-in cuando SÍ alcanza para igualar: no procede (§4.1).
    expect(motivo(base({ currentBet: 50 }), 0, 'allIn')).toBe('all_in_no_procede')
    expect(motivo(base(), 0, 'allIn')).toBe('all_in_no_procede')
    // acción que no existe.
    expect(motivo(base(), 0, 'robar')).toBe('accion_desconocida')
  })

  it('retirarse es legal siempre que sea tu turno, haya apuesta o no', () => {
    expect(esLegal(base(), 0, 'retirarse')).toEqual({ ok: true, motivo: null })
    expect(esLegal(base({ currentBet: 500 }), 0, 'retirarse')).toEqual({ ok: true, motivo: null })
  })

  // ── `sin_rival`, undécimo motivo (ficha 1c §2.1) ───────────────────────────

  it('sin nadie que pueda contestar, apostar y subir son sin_rival', () => {
    // Mesa de dos: el rival empujó su pila y quedó marcado. Nadie puede
    // responder a una apuesta nueva, así que no se ofrece ninguna.
    const contraAllIn = estado(
      [jugador({ chips: 500 }), jugador({ chips: 0, allIn: true, contribMano: 300 })],
      { currentBet: 0, activePlayerIndex: 0 },
    )
    expect(motivo(contraAllIn, 0, 'apostar', 1)).toBe('sin_rival')

    // Con apuesta viva del all-in: igualar sí, subir no.
    const conApuestaViva = estado(
      [jugador({ chips: 500 }), jugador({ chips: 0, allIn: true, contribMano: 300, contrib: 300 })],
      { currentBet: 300, activePlayerIndex: 0 },
    )
    expect(motivo(conApuestaViva, 0, 'subir', 1)).toBe('sin_rival')
    expect(esLegal(conApuestaViva, 0, 'igualar').ok).toBe(true)

    // Un retirado tampoco es rival; un tercero vivo con fichas, sí.
    const soloRetirados = estado(
      [jugador({ chips: 500 }), jugador({ folded: true }), jugador({ chips: 0, allIn: true })],
      { currentBet: 0, activePlayerIndex: 0 },
    )
    expect(motivo(soloRetirados, 0, 'apostar', 1)).toBe('sin_rival')
    const conTercero = estado(
      [jugador({ chips: 500 }), jugador({ chips: 0, allIn: true }), jugador({ chips: 40 })],
      { currentBet: 0, activePlayerIndex: 0 },
    )
    expect(esLegal(conTercero, 0, 'apostar', 1).ok).toBe(true)
  })

  it('en una ronda sin rival la fila se queda en pasar/retirarse o igualar/retirarse', () => {
    const sinApuesta = estado(
      [jugador({ chips: 500 }), jugador({ chips: 0, allIn: true, contribMano: 300 })],
      { currentBet: 0, activePlayerIndex: 0 },
    )
    expect(accionesDe(sinApuesta, 0)).toEqual(['pasar', 'retirarse'])

    const conApuesta = estado(
      [jugador({ chips: 500 }), jugador({ chips: 0, allIn: true, contribMano: 300, contrib: 300 })],
      { currentBet: 300, activePlayerIndex: 0 },
    )
    expect(accionesDe(conApuesta, 0)).toEqual(['igualar', 'retirarse'])
  })
})

describe('pozos.accionesDe — la fila de acciones (§4.1)', () => {
  const mesa = (over = {}, jug = {}) => estado(
    [jugador({ chips: 500, ...jug }), jugador()],
    { currentBet: 0, activePlayerIndex: 0, ...over },
  )

  it('sin apuesta viva se puede pasar, apostar o retirarse', () => {
    expect(accionesDe(mesa(), 0)).toEqual(['pasar', 'apostar', 'retirarse'])
  })

  it('con apuesta viva que la pila cubre: igualar, subir o retirarse', () => {
    expect(accionesDe(mesa({ currentBet: 50 }), 0)).toEqual(['igualar', 'subir', 'retirarse'])
  })

  it('subir exige cubrir al menos el ×1; si no, desaparece', () => {
    // Apuesta viva 50, pila 55: igualar cuesta 50 y cabe; subir ×1 cuesta 60 y no.
    expect(accionesDe(mesa({ currentBet: 50 }, { chips: 55 }), 0)).toEqual(['igualar', 'retirarse'])
  })

  it('si la pila no cubre la apuesta viva, «igualar» se sustituye por «allIn»', () => {
    const acciones = accionesDe(mesa({ currentBet: 50 }, { chips: 30 }), 0)
    expect(acciones).toEqual(['allIn', 'retirarse'])
    expect(acciones).not.toContain('igualar')
  })

  it('un retirado, un all-in, un eliminado o quien no tiene el turno no tienen acciones', () => {
    expect(accionesDe(mesa({}, { folded: true }), 0)).toEqual([])
    expect(accionesDe(mesa({}, { allIn: true }), 0)).toEqual([])
    expect(accionesDe(mesa({}, { eliminated: true }), 0)).toEqual([])
    expect(accionesDe(mesa({ activePlayerIndex: 1 }), 0)).toEqual([])
    expect(accionesDe(mesa({ phase: 'PAYOUT' }), 0)).toEqual([])
  })

  it('toda acción ofrecida es legal: accionesDe y esLegal no pueden divergir', () => {
    const casos = [
      mesa(), mesa({ currentBet: 50 }), mesa({ currentBet: 50 }, { chips: 30 }),
      mesa({ currentBet: 500 }, { chips: 499 }), mesa({}, { chips: 5 }),
    ]
    for (const s of casos) {
      for (const a of accionesDe(s, 0)) {
        expect(esLegal(s, 0, a, 1).ok).toBe(true)
      }
    }
  })
})
