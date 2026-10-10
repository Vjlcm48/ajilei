import { describe, it, expect } from 'vitest'
import {
  TIPOS, CODIGOS, DESTINOS, destinoDe, colaNueva, encolarPila, encolarRecarga,
  encolarSalida, proximo, enviando, alResponder, anotarPila, finDeMano,
} from './mesaIACore'
import { PHASES, createInitialState } from '../engine/gameEngine'
import { nivelarLasIAS } from './mesaCore'

// ── ECO-1c · el núcleo de la mesa contra las IAS ────────────────────────────
// Rector: AJILEI_ECO-1_Fase1c_v1.0.md §2.2 y el plan del STOP-1 §1.

describe('ECO-1c · la cola de avisos', () => {
  it('una pila nueva se encola con seq creciente; la misma pila no se repite', () => {
    let c = colaNueva(500)
    c = encolarPila(c, 500)                 // igual a la de la entrada: nada
    expect(c.pendientes).toEqual([])
    c = encolarPila(c, 450)
    c = encolarRecarga(c, 500)
    expect(c.pendientes.map((it) => [it.tipo, it.seq])).toEqual([[TIPOS.AVISO, 1], [TIPOS.RECARGA, 2]])
  })

  it('un aviso de sólo pila se salta si detrás llega otro; el que está en vuelo no', () => {
    let c = colaNueva(500)
    c = encolarPila(c, 450)                 // seq 1
    c = enviando(c, proximo(c).seq)         // seq 1 en vuelo
    c = encolarPila(c, 400)                 // seq 2
    c = encolarPila(c, 350)                 // seq 3: salta el 2, no el 1
    expect(c.pendientes.map((it) => [it.seq, it.pila])).toEqual([[1, 450], [3, 350]])
  })

  it('el aviso de fin de mano NO se salta nunca (C7) y va aunque la pila no cambie', () => {
    let c = colaNueva(500)
    c = encolarPila(c, 400, { vivos: 2, ganoHumano: false })   // seq 1, misma pila después
    c = encolarPila(c, 400, { vivos: 2, ganoHumano: false })   // la mano siguiente, perdida igual
    c = encolarPila(c, 350)                                    // el ante de la otra
    c = encolarPila(c, 300)
    expect(c.pendientes.map((it) => [it.seq, it.pila, !!it.fin])).toEqual([[1, 400, true], [2, 400, true], [4, 300, false]])
  })

  it('nada adelanta a lo que va delante: una cosa en vuelo a la vez, en orden', () => {
    let c = colaNueva(500)
    c = encolarPila(c, 450)
    c = encolarRecarga(c, 500)
    c = encolarSalida(c, 950)
    const vistos = []
    for (let i = 0; i < 3; i++) {
      const it = proximo(c)
      vistos.push(it.tipo)
      c = enviando(c, it.seq)
      expect(proximo(c)).toBe(null)
      c = alResponder(c, it.seq, CODIGOS.OK).cola
    }
    expect(vistos).toEqual([TIPOS.AVISO, TIPOS.RECARGA, TIPOS.SALIDA])
    expect(c.pendientes).toEqual([])
  })

  it('sin respuesta (red) se reintenta EL MISMO, con el mismo seq', () => {
    let c = encolarPila(colaNueva(500), 450)
    c = enviando(c, 1)
    const r = alResponder(c, 1, CODIGOS.RED)
    expect(r.destino).toBe(DESTINOS.REINTENTAR)
    expect(proximo(r.cola)).toMatchObject({ seq: 1, pila: 450 })
  })

  it('mesa cerrada (C6): la cola se vacía y no admite nada más', () => {
    let c = encolarSalida(encolarPila(colaNueva(500), 450), 450)
    c = enviando(c, 1)
    const r = alResponder(c, 1, CODIGOS.MESA_CERRADA)
    expect(r.destino).toBe(DESTINOS.CERRADA)
    expect(r.cola.cerrada).toBe(true)
    expect(proximo(r.cola)).toBe(null)
    expect(encolarPila(r.cola, 10).pendientes).toEqual([])
  })

  it('una recarga rechazada se quita y se cuenta; la cola sigue', () => {
    let c = encolarPila(encolarRecarga(colaNueva(500), 9000), 450)
    c = enviando(c, 1)
    const r = alResponder(c, 1, CODIGOS.SALDO_INSUFICIENTE)
    expect(r.destino).toBe(DESTINOS.RECHAZADO)
    expect(proximo(r.cola)).toMatchObject({ seq: 2, tipo: TIPOS.AVISO })
  })

  it('repetido y seq_viejo son «hecho»: el servidor ya lo tenía', () => {
    expect(destinoDe(CODIGOS.REPETIDO)).toBe(DESTINOS.HECHO)
    expect(destinoDe(CODIGOS.SEQ_VIEJO)).toBe(DESTINOS.HECHO)
    expect(destinoDe(CODIGOS.SIN_MESA)).toBe(DESTINOS.CERRADA)
    expect(destinoDe(undefined)).toBe(DESTINOS.REINTENTAR)
  })

  it('ECO-1d · K7 · `limite` es «no contesta»: la salida se reintenta, nunca se tira', () => {
    expect(destinoDe(CODIGOS.LIMITE)).toBe(DESTINOS.REINTENTAR)
    let c = encolarSalida(colaNueva(500), 800)
    c = enviando(c, 1)
    const r = alResponder(c, 1, CODIGOS.LIMITE)
    expect(r.destino).toBe(DESTINOS.REINTENTAR)
    expect(proximo(r.cola)).toMatchObject({ seq: 1, tipo: TIPOS.SALIDA, fichas: 800 })
  })

  it('ECO-1d · K8 · `tope_diario` en una recarga es un «no»: se quita y la mesa sigue', () => {
    let c = encolarRecarga(colaNueva(500), 500)
    c = encolarPila(c, 450)
    c = enviando(c, 1)
    const r = alResponder(c, 1, CODIGOS.TOPE_DIARIO)
    expect(r.destino).toBe(DESTINOS.RECHAZADO)
    expect(r.cola.cerrada).toBe(false)
    expect(proximo(r.cola)).toMatchObject({ seq: 2, tipo: TIPOS.AVISO })
  })

  it('tras una recarga confirmada, la pila que ya conoce el servidor no se vuelve a avisar', () => {
    let c = anotarPila(colaNueva(400), 900)
    c = encolarPila(c, 900)
    expect(c.pendientes).toEqual([])
  })
})

// ── P-2a · la salida que espera a una recarga (regla sellada por el rector) ──
// La mesa pone 300 en la salida: son las fichas que tiene, porque las de una
// recarga sólo aparecen cuando el servidor confirma.
describe('ECO-1c · P-2a · la salida espera a la recarga pendiente', () => {
  // La recarga de 500 en vuelo y la salida (la ✕, el plazo o la celebración)
  // pedida detrás.
  function conRecargaEnVuelo() {
    let c = encolarRecarga(colaNueva(300), 500)      // seq 1
    c = enviando(c, proximo(c).seq)
    c = encolarSalida(c, 300)                        // seq 2
    return c
  }
  const salidaDe = (c) => c.pendientes.find((it) => it.tipo === TIPOS.SALIDA)

  it('la ✕ se pulsa con la recarga en vuelo y la recarga entra: la salida lleva sus fichas', () => {
    let c = conRecargaEnVuelo()
    expect(proximo(c)).toBe(null)                    // la salida no adelanta a la recarga
    const r = alResponder(c, 1, CODIGOS.OK)
    expect(r.destino).toBe(DESTINOS.HECHO)
    c = r.cola
    expect(proximo(c)).toMatchObject({ seq: 2, tipo: TIPOS.SALIDA, fichas: 800 })
  })

  it('repetido también es «entró»: suma', () => {
    const { cola } = alResponder(conRecargaEnVuelo(), 1, CODIGOS.REPETIDO)
    expect(salidaDe(cola).fichas).toBe(800)
  })

  it('un fallo definitivo (sin saldo, sobre el techo, seq_viejo) deja la salida sin ellas', () => {
    for (const codigo of [CODIGOS.SALDO_INSUFICIENTE, CODIGOS.SOBRE_TECHO, CODIGOS.SEQ_VIEJO, 'monto_invalido']) {
      const r = alResponder(conRecargaEnVuelo(), 1, codigo)
      expect(r.destino, codigo).toBe(DESTINOS.RECHAZADO)
      expect(proximo(r.cola), codigo).toMatchObject({ seq: 2, tipo: TIPOS.SALIDA, fichas: 300 })
    }
  })

  it('sin respuesta no es definitivo: se reintenta la recarga y la salida sigue esperando', () => {
    let c = conRecargaEnVuelo()
    for (let i = 0; i < 3; i++) {
      const r = alResponder(c, 1, CODIGOS.RED)
      expect(r.destino).toBe(DESTINOS.REINTENTAR)
      c = r.cola
      expect(proximo(c)).toMatchObject({ seq: 1, tipo: TIPOS.RECARGA })
      c = enviando(c, 1)
    }
    c = alResponder(c, 1, CODIGOS.OK).cola
    expect(proximo(c)).toMatchObject({ tipo: TIPOS.SALIDA, fichas: 800 })
  })

  it('la recarga aún sin salir (detrás de un aviso) también se espera y suma', () => {
    let c = encolarPila(colaNueva(400), 300)         // seq 1, aviso en vuelo
    c = enviando(c, 1)
    c = encolarRecarga(c, 500)                       // seq 2
    c = encolarSalida(c, 300)                        // seq 3
    c = alResponder(c, 1, CODIGOS.OK).cola
    expect(proximo(c)).toMatchObject({ seq: 2, tipo: TIPOS.RECARGA })
    c = alResponder(enviando(c, 2), 2, CODIGOS.OK).cola
    expect(proximo(c)).toMatchObject({ seq: 3, fichas: 800 })
  })

  it('la segunda respuesta del mismo seq (un reintento forzado) no suma dos veces', () => {
    let c = alResponder(conRecargaEnVuelo(), 1, CODIGOS.OK).cola
    const r = alResponder(c, 1, CODIGOS.OK)
    expect(r.destino).toBe(null)
    expect(salidaDe(r.cola).fichas).toBe(800)
  })

  it('sin salida en cola, la recarga que entra no toca nada más', () => {
    let c = encolarRecarga(colaNueva(300), 500)
    c = encolarPila(enviando(c, 1), 250)
    c = alResponder(c, 1, CODIGOS.OK).cola
    expect(c.pendientes).toEqual([expect.objectContaining({ tipo: TIPOS.AVISO, pila: 250 })])
  })
})

// ── El fin de mano · la capa 0, no `winner` ─────────────────────────────────
function enPago(players, extra = {}) {
  return {
    phase: PHASES.PAYOUT, aliveCount: players.length, manoIndex: 0, winner: null,
    players: players.map((p, i) => ({ id: i, folded: false, allIn: false, score: null, chips: 0, ...p })),
    ...extra,
  }
}

describe('ECO-1c · finDeMano (C7)', () => {
  it('fuera de PAYOUT no hay fin de mano', () => {
    expect(finDeMano({ phase: PHASES.BET_1 })).toBe(null)
  })

  it('VOZ-3: el humano corto gana la capa 0 aunque `winner` sea la IA de la capa de arriba', () => {
    const s = enPago([
      { contribMano: 100, allIn: true, score: { points: 40 } },
      { contribMano: 300, score: { points: 30 } },
    ], { winner: 1 })
    expect(finDeMano(s)).toEqual({ vivos: 2, ganoHumano: true })
  })

  it('por retiros: gana el que se queda, sin score', () => {
    const s = enPago([
      { contribMano: 50, folded: true },
      { contribMano: 100 },
      { contribMano: 50, folded: true },
    ], { winner: 1 })
    expect(finDeMano(s)).toEqual({ vivos: 3, ganoHumano: false })
  })

  it('empate: lo gana el más cercano a la Mano, como en el motor', () => {
    const pl = [{ contribMano: 100, score: { points: 30 } }, { contribMano: 100, score: { points: 30 } }]
    expect(finDeMano(enPago(pl, { manoIndex: 1, winner: 1 })).ganoHumano).toBe(false)
    expect(finDeMano(enPago(pl, { manoIndex: 0, winner: 0 })).ganoHumano).toBe(true)
  })

  it('vivos es aliveCount: las eliminadas no cuentan', () => {
    const s = enPago([
      { contribMano: 100, score: { points: 30 } },
      { contribMano: 100, score: { points: 20 } },
      { contribMano: 0, folded: true, eliminated: true },
    ], { aliveCount: 2 })
    expect(finDeMano(s).vivos).toBe(2)
  })
})

// ── D-1 · la IA quebrada que revive (Fase 0 §D.1, C9) ───────────────────────
// Mesa de 2 en PAYOUT: la IA acaba de quedarse a 0 en ESTA mano y todavía no
// está `eliminated` (sólo lo escribe `startHand`). Si el humano recarga, el
// nivelado la completa y la mesa no se gana. La regla de P-2: se nivela sólo a
// las IAS con fichas ≥ apuesta, el criterio de `startHand`.
//
// En la 1c-i esto era `it.fails`: D-1 se reprodujo (la IA a 0 recibía la pila
// entera). Desde la 1c-iii `nivelarLasIAS` sólo completa a las IAS con fichas
// ≥ apuesta, y pasa a `it` normal.
describe('ECO-1c · D-1 · la IA quebrada no se nivela', () => {
  const UNIT = 50
  const quebrada = () => {
    const st = createInitialState(UNIT, [
      { isHuman: true, chips: 1100, name: 'Tú' },
      { isHuman: false, chips: 0, name: 'IA' },
    ])
    return { ...st, phase: PHASES.PAYOUT }
  }

  it('la IA está a 0 pero aún no eliminada (el hueco de D-1)', () => {
    const g = quebrada()
    expect(g.players[1].chips).toBe(0)
    expect(g.players[1].eliminated).toBe(false)
  })

  it('al recargar, la IA a 0 no recibe nada (D-1)', () => {
    expect(nivelarLasIAS(quebrada())).toEqual([])
  })

  it('tampoco la que queda por debajo del ante: startHand la eliminaría igual', () => {
    const g = quebrada()
    g.players[1] = { ...g.players[1], chips: UNIT - 1 }
    expect(nivelarLasIAS(g)).toEqual([])
    g.players[1] = { ...g.players[1], chips: UNIT }
    expect(nivelarLasIAS(g).map((x) => x.seat)).toEqual([1])
  })
})
