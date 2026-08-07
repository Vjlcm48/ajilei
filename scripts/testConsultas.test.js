import { describe, it, expect } from 'vitest'
import {
  FASES_CONSULTABLES,
  hayManoConsultable,
  estadoInicial,
  pedirConsulta,
  desglosarPalos,
} from '../src/hooks/consultasCore.js'
import { PHASES } from '../src/engine/gameEngine.js'
import { getBestSuitScore } from '../src/engine/handEvaluator.js'

// ── DSK-U3 · Las cuatro semánticas selladas de "Mano actual" ─────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.3.md §2.
// Se sella el NÚCLEO PURO, no la superficie: el arnés diagDSK (modo u3) cubre
// lo que sólo existe en el navegador (Δ=0, capa, autocierres, el invariante del
// badge). Aquí vive lo que debe ser cierto sin un DOM delante.

const carta = (palo, points, value = 10) => ({ palo, points, value })

describe('U3 · disponibilidad de la entrada', () => {
  it('sólo las cuatro fases de decisión viva son consultables', () => {
    expect(FASES_CONSULTABLES).toEqual([
      PHASES.BET_1, PHASES.BET_2, PHASES.DISCARD, PHASES.BET_3,
    ])
  })

  it('habilita en las fases de decisión con mano repartida', () => {
    for (const fase of FASES_CONSULTABLES) {
      expect(hayManoConsultable(fase, 3, 5)).toBe(true)
    }
  })

  it('deshabilita en showdown, pago y fin de mesa', () => {
    for (const fase of [PHASES.SHOWDOWN, PHASES.PAYOUT, PHASES.GAME_OVER]) {
      expect(hayManoConsultable(fase, 3, 5)).toBe(false)
    }
  })

  it('deshabilita en espera y durante el reparto', () => {
    for (const fase of [PHASES.WAITING, PHASES.DEAL_2, PHASES.DEAL_3]) {
      expect(hayManoConsultable(fase, 3, 5)).toBe(false)
    }
  })

  it('deshabilita sin mano repartida aún (handCount 0) y sin cartas', () => {
    expect(hayManoConsultable(PHASES.BET_1, 0, 5)).toBe(false)
    expect(hayManoConsultable(PHASES.BET_1, 3, 0)).toBe(false)
    expect(hayManoConsultable(PHASES.BET_1, null, 5)).toBe(false)
  })
})

describe('U3 · consulta por mano', () => {
  it('la primera consulta de una mano cobra exactamente 1', () => {
    const r = pedirConsulta(estadoInicial(20), 1)
    expect(r.resultado).toBe('nueva')
    expect(r.cobro).toBe(1)
    expect(r.estado.saldo).toBe(19)
    expect(r.estado.manoConsultada).toBe(1)
  })

  it('re-presionar la MISMA mano es gratis y no mueve el contador', () => {
    const primera = pedirConsulta(estadoInicial(20), 1)
    const segunda = pedirConsulta(primera.estado, 1)
    expect(segunda.resultado).toBe('repetida')
    expect(segunda.cobro).toBe(0)
    expect(segunda.estado.saldo).toBe(19)
    const tercera = pedirConsulta(segunda.estado, 1)
    expect(tercera.estado.saldo).toBe(19)
  })

  it('una mano NUEVA vuelve a cobrar', () => {
    let e = estadoInicial(20)
    e = pedirConsulta(e, 1).estado
    e = pedirConsulta(e, 1).estado     // gratis
    const nueva = pedirConsulta(e, 2)
    expect(nueva.resultado).toBe('nueva')
    expect(nueva.cobro).toBe(1)
    expect(nueva.estado.saldo).toBe(18)
    expect(nueva.estado.manoConsultada).toBe(2)
  })

  it('no se puede consumir dos veces la misma mano volviendo a la anterior', () => {
    // La identidad es el número de mano del marcador, que sólo crece: una vez
    // pasada la mano 1, su derecho adquirido se pierde y volver a ella cobraría.
    // Se documenta el comportamiento, no se pretende que ocurra en la app.
    let e = estadoInicial(20)
    e = pedirConsulta(e, 1).estado
    e = pedirConsulta(e, 2).estado
    expect(e.saldo).toBe(18)
    expect(pedirConsulta(e, 1).cobro).toBe(1)
  })
})

describe('U3 · saldo agotado (N=0)', () => {
  it('a saldo 0 no cobra, no baja de cero y anuncia agotadas', () => {
    const r = pedirConsulta(estadoInicial(0), 7)
    expect(r.resultado).toBe('agotadas')
    expect(r.cobro).toBe(0)
    expect(r.estado.saldo).toBe(0)
    expect(r.estado.manoConsultada).toBe(null)
  })

  it('quien gastó su ÚLTIMA gratis conserva el derecho sobre esa mano', () => {
    // El orden de las guardas importa: 'repetida' va antes que 'agotadas'.
    const ultima = pedirConsulta(estadoInicial(1), 4)
    expect(ultima.resultado).toBe('nueva')
    expect(ultima.estado.saldo).toBe(0)
    const rep = pedirConsulta(ultima.estado, 4)
    expect(rep.resultado).toBe('repetida')
    expect(rep.estado.saldo).toBe(0)
    // pero la mano siguiente ya no tiene con qué
    expect(pedirConsulta(ultima.estado, 5).resultado).toBe('agotadas')
  })
})

describe('U3 · desglose de palos desde la fuente única', () => {
  it('reparte mejor palo y resto ordenado de mayor a menor', () => {
    const mano = [
      carta('Oros', 11, 1), carta('Oros', 10, 12),
      carta('Espadas', 10, 11), carta('Bastos', 10, 10), carta('Bastos', 6, 6),
    ]
    const d = desglosarPalos(getBestSuitScore(mano, 2, false))
    expect(d.palo).toBe('Oros')
    expect(d.pts).toBe(21)
    expect(d.resto).toEqual([
      { palo: 'Bastos', pts: 16 },
      { palo: 'Espadas', pts: 10 },
    ])
    expect(d.bonifComodin).toBe(0)
  })

  it('el comodín suma al mejor palo y se declara como bonificación', () => {
    // Mesa 5: el 7 de Oros vale 11 y NO cuenta como carta de Oros.
    const mano = [
      carta('Oros', 7, 7),                                    // comodín
      carta('Espadas', 11, 1), carta('Espadas', 10, 12),
      carta('Copas', 10, 11), carta('Copas', 6, 6),
    ]
    const score = getBestSuitScore(mano, 5, true)
    const d = desglosarPalos(score)
    expect(d.palo).toBe('Espadas')
    expect(d.pts).toBe(32)             // 21 crudo + 11 de comodín
    expect(d.bonifComodin).toBe(11)
    expect(d.resto).toEqual([{ palo: 'Copas', pts: 16 }])
    // La cifra mostrada es la de la fuente única, sin recalcular nada
    expect(d.pts).toBe(score.points)
  })

  it('sin comodín habilitado el 7 de Oros es una carta normal de Oros', () => {
    const mano = [
      carta('Oros', 7, 7), carta('Oros', 11, 1),
      carta('Espadas', 10, 12), carta('Bastos', 10, 11), carta('Copas', 10, 10),
    ]
    const d = desglosarPalos(getBestSuitScore(mano, 3, false))
    expect(d.palo).toBe('Oros')
    expect(d.pts).toBe(18)
    expect(d.bonifComodin).toBe(0)
  })

  it('un solo palo deja el resto vacío', () => {
    const mano = [carta('Copas', 11, 1), carta('Copas', 10, 12)]
    const d = desglosarPalos(getBestSuitScore(mano, 2, false))
    expect(d.palo).toBe('Copas')
    expect(d.resto).toEqual([])
  })

  it('sin cartas no hay desglose que pintar', () => {
    expect(desglosarPalos(getBestSuitScore([], 2, false))).toBe(null)
    expect(desglosarPalos(null)).toBe(null)
  })
})
