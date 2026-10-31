import { describe, it, expect } from 'vitest'
import {
  FASES_CONSULTABLES,
  hayManoConsultable,
  desglosarPalos,
  estadoConsultas,
  conMiConsulta,
  decidirConsulta,
  responderConsulta,
  etiquetaConsulta,
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

// ── CFG-1 1e · Mano actual de pago: lo que decide el cliente ────────────────
// El servidor gasta y cobra (INV-75; lo sella el guion cfg1e y el banco
// imitado en espejo). Aquí se sella lo que el cliente decide con lo que vuelve:
// cuándo llamar, cuándo preguntar, qué pintar.
const M = 'mesa-1'

describe('CFG-1 1e · qué hacer al tocar', () => {
  it('sin mesa del servidor o sin mano no se llama', () => {
    const e = estadoConsultas({ precio: 100 })
    expect(decidirConsulta(e, { mesa: null, mano: 1, confirmada: true })).toBe('sin_mesa')
    expect(decidirConsulta(e, { mesa: M, mano: 0, confirmada: true })).toBe('sin_mesa')
  })

  it('con gratis se llama sin preguntar, aunque la sesión no haya confirmado nada', () => {
    const e = conMiConsulta(estadoConsultas({ precio: 100 }), { gratis_restantes: 3, ultima_mesa: null, ultima_mano: null }, M)
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: false })).toBe('llamar')
  })

  it('sin gratis: el primer cobro de la sesión pregunta; confirmado, ya no', () => {
    const e = conMiConsulta(estadoConsultas({ precio: 100 }), { gratis_restantes: 0, ultima_mesa: null, ultima_mano: null }, M)
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: false })).toBe('confirmar')
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: true })).toBe('llamar')
  })

  it('sin gratis y sin saldo para el precio: el aviso, sin preguntar ni llamar', () => {
    const e = conMiConsulta(estadoConsultas({ precio: 100 }), { gratis_restantes: 0, ultima_mesa: null, ultima_mano: null }, M)
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: false, saldo: 50 })).toBe('sin_saldo')
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: true, saldo: 50 })).toBe('sin_saldo')
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: true, saldo: 100 })).toBe('llamar')
    // Con gratis, el saldo no importa.
    expect(decidirConsulta({ ...e, gratis: 2 }, { mesa: M, mano: 1, confirmada: false, saldo: 0 })).toBe('llamar')
  })

  it('sin saber todavía si quedan gratis, se pregunta (el lado seguro)', () => {
    const e = estadoConsultas({ precio: 100 })
    expect(decidirConsulta(e, { mesa: M, mano: 1, confirmada: false })).toBe('confirmar')
  })

  it('la última mano consultada no se vuelve a pedir: ni gasta ni cobra', () => {
    let e = conMiConsulta(estadoConsultas({ precio: 100 }), { gratis_restantes: 1, ultima_mesa: null, ultima_mano: null }, M)
    e = responderConsulta(e, { mesa: M, mano: 4 }, { resultado: 'gratis', precio: 100, gratis_restantes: 0, saldo: 900 }).estado
    // Quien gastó su ÚLTIMA gratis conserva el derecho sobre esa mano (P-1).
    expect(decidirConsulta(e, { mesa: M, mano: 4, confirmada: false })).toBe('repetida')
    expect(decidirConsulta(e, { mesa: M, mano: 5, confirmada: false })).toBe('confirmar')
  })

  it('una última mano de OTRA mesa no cuenta', () => {
    const e = conMiConsulta(estadoConsultas(), { gratis_restantes: 5, ultima_mesa: 'otra', ultima_mano: 4 }, M)
    expect(e.ultima).toBe(null)
    expect(e.gratis).toBe(5)
  })
})

describe('CFG-1 1e · qué pintar con la respuesta', () => {
  const base = () => conMiConsulta(estadoConsultas({ precio: 100 }), { gratis_restantes: 3, ultima_mesa: null, ultima_mano: null }, M)

  it('gratis: la ventana sin recorrido y el contador al día', () => {
    const r = responderConsulta(base(), { mesa: M, mano: 1 }, { resultado: 'gratis', precio: 100, gratis_restantes: 2, saldo: 900 })
    expect(r.popup).toEqual({ tipo: 'valor', pagada: false })
    expect(r.estado.gratis).toBe(2)
    expect(r.estado.ultima).toEqual({ mesa: M, mano: 1, pagada: false })
  })

  it('cobrada y pagada: la ventana con el recorrido dorado', () => {
    for (const resultado of ['cobrada', 'pagada']) {
      const r = responderConsulta(base(), { mesa: M, mano: 2 }, { resultado, precio: 200, gratis_restantes: 0, saldo: 700 })
      expect(r.popup).toEqual({ tipo: 'valor', pagada: true })
      expect(r.estado.ultima.pagada).toBe(true)
      expect(r.estado.precio).toBe(200)
    }
  })

  it('saldo insuficiente: un aviso con el precio, sin ventana ni última mano', () => {
    const r = responderConsulta(base(), { mesa: M, mano: 2 }, { resultado: 'saldo_insuficiente', precio: 100, gratis_restantes: 0, saldo: 50 })
    expect(r.popup).toEqual({ tipo: 'aviso', clave: 'ia.mesa.consulta.sin_saldo', vars: { hc: 100 } })
    expect(r.estado.ultima).toBe(null)
  })

  it('sin respuesta, sin sesión, mesa inválida o límite: «No se pudo consultar»', () => {
    for (const r of [null, { resultado: 'sin_sesion' }, { resultado: 'mesa_invalida', precio: 0 }, { resultado: 'limite', precio: 0 }]) {
      expect(responderConsulta(base(), { mesa: M, mano: 2 }, r).popup.clave).toBe('ia.mesa.consulta.error')
    }
  })
})

describe('CFG-1 1e · lo que dice la entrada', () => {
  it('N gratis, luego el precio, y «pagada» sólo en la mano pagada', () => {
    let e = conMiConsulta(estadoConsultas({ precio: 100 }), { gratis_restantes: 13, ultima_mesa: null, ultima_mano: null }, M)
    expect(etiquetaConsulta(e, M, 1)).toEqual({ tipo: 'gratis', n: 13 })
    e = { ...e, gratis: 0 }
    expect(etiquetaConsulta(e, M, 1)).toEqual({ tipo: 'precio', precio: 100 })
    e = responderConsulta(e, { mesa: M, mano: 1 }, { resultado: 'cobrada', precio: 100, gratis_restantes: 0, saldo: 900 }).estado
    expect(etiquetaConsulta(e, M, 1)).toEqual({ tipo: 'pagada' })
    expect(etiquetaConsulta(e, M, 2)).toEqual({ tipo: 'precio', precio: 100 })
  })

  it('antes de que el servidor conteste no dice cifra', () => {
    expect(etiquetaConsulta(estadoConsultas({ precio: 100 }), M, 1)).toBe(null)
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
