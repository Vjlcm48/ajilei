import { describe, it, expect } from 'vitest'
import {
  estaRecortada, HOLGURA_RECORTE_PX, finDeLoLeido,
  anchoCapa, colocaCapa, CAPA_ANCHO_MIN, CAPA_ANCHO_MAX, CAPA_MARGEN_X, CAPA_MARGEN_Y,
} from './voz2Core'

const caja = (scrollWidth, clientWidth, scrollHeight, clientHeight) => ({ scrollWidth, clientWidth, scrollHeight, clientHeight })

describe('VOZ-2 · estaRecortada', () => {
  it('una frase que cabe no está recortada', () => {
    expect(estaRecortada(caja(209, 505, 20, 20))).toBe(false)
    expect(estaRecortada(caja(324, 324, 34, 34))).toBe(false)
  })

  it('el redondeo del interlineado no inventa un recorte (holgura de 1 px)', () => {
    expect(HOLGURA_RECORTE_PX).toBe(1)
    expect(estaRecortada(caja(73, 73, 35, 34))).toBe(false)
    expect(estaRecortada(caja(74, 73, 34, 34))).toBe(false)
  })

  it('una línea de más bajo la caja es recorte (vertical, line-clamp)', () => {
    // La línea más pequeña de la casa: 9 px × 1,3 = 11,7.
    expect(estaRecortada(caja(113, 113, 35, 23))).toBe(true)
    expect(estaRecortada(caja(73, 73, 51, 34))).toBe(true)
  })

  it('una línea sin cortes que desborda a lo ancho es recorte (horizontal)', () => {
    expect(estaRecortada(caja(420, 117, 17, 17))).toBe(true)
  })

  it('sin medidas (elemento sin maquetar) no se declara recorte', () => {
    expect(estaRecortada({})).toBe(false)
    expect(estaRecortada(caja(NaN, 10, 10, 10))).toBe(false)
  })

  it('acepta el propio elemento del DOM, que trae las cuatro medidas', () => {
    const el = { scrollWidth: 300, clientWidth: 300, scrollHeight: 60, clientHeight: 39, otra: 'cosa' }
    expect(estaRecortada(el)).toBe(true)
  })
})

// Una caja de glifo: x, línea (top) y ancho; alto de 13 px como la letra de 360.
const g = (left, top, width = 7, alto = 13) => ({ left, right: left + width, top, bottom: top + alto, width })
const marco = { left: 100, right: 173, top: 50, bottom: 84 }

describe('VOZ-2 · finDeLoLeido (dónde va la flechita)', () => {
  it('sin «…» que medir, el final es el último glifo de la última línea dentro', () => {
    const cajas = [g(100, 52), g(107, 52), g(114, 52), g(100, 69), g(107, 69), g(120, 86), g(127, 86)]
    expect(finDeLoLeido(cajas, marco)).toEqual({ x: 114, y: 69, alto: 13 })
  })

  it('la flecha va DETRÁS del «…», no del último glifo (medido: «con…» en 360×640)', () => {
    // «con» centrado en una caja de 73 px y el «…» de 13 px a continuación.
    const m = { left: 242.8, right: 316, top: 291.8, bottom: 325.6 }
    const con = [g(267.6, 312, 7.4), g(275, 312, 8.1), g(283.1, 312, 8.1)]
    expect(finDeLoLeido(con, m, 13).x).toBeCloseTo(304.2, 5)
  })

  it('los glifos que tapa el «…» no cuentan como leídos', () => {
    // «AJILEI! IA»: la «A» final acaba en 311 y con el «…» no cabría en 316,
    // así que el «…» empieza tras la «I» (301,4).
    const m = { left: 242.8, right: 316, top: 291.8, bottom: 325.6 }
    const cajas = [g(285.5, 312, 3.8), g(289.3, 312, 4.5), g(297.6, 312, 3.8), g(301.4, 312, 9.6)]
    expect(finDeLoLeido(cajas, m, 13).x).toBeCloseTo(314.4, 5)
  })

  it('un glifo que sobresale del marco no se cuenta como leído', () => {
    expect(finDeLoLeido([g(100, 52), g(160, 69), g(168, 69)], marco).x).toBe(167)
  })

  it('nunca pasa del marco, ni cuando no cabe ni un glifo con el «…»', () => {
    expect(finDeLoLeido([g(100, 52), g(165, 69)], marco, 13).x).toBe(173)
  })

  it('ignora los glifos sin ancho (espacios colapsados)', () => {
    const cajas = [g(100, 52), { left: 140, right: 140, top: 69, bottom: 82, width: 0 }]
    expect(finDeLoLeido(cajas, marco)).toEqual({ x: 107, y: 52, alto: 13 })
  })

  it('sin glifos dentro, no hay final', () => {
    expect(finDeLoLeido([], marco)).toBe(null)
    expect(finDeLoLeido([g(100, 90)], marco)).toBe(null)
    expect(finDeLoLeido(null, marco)).toBe(null)
  })
})

describe('VOZ-2 · la capa sobre el óvalo (anchoCapa, colocaCapa)', () => {
  const vp = (width, height) => ({ width, height })
  const ov = (left, top, width, height) => ({ left, top, width, height })

  it('el ancho es el del óvalo entre 260 y 520, y cabe en el viewport', () => {
    expect(anchoCapa(ov(21, 274.81, 318, 96), vp(360, 640))).toBe(318)
    expect(anchoCapa(ov(678, 134.91, 157, 69), vp(844, 390))).toBe(CAPA_ANCHO_MIN)
    expect(anchoCapa(ov(556, 455, 808, 170), vp(1920, 1080))).toBe(CAPA_ANCHO_MAX)
    expect(anchoCapa(ov(10, 0, 100, 50), vp(270, 600))).toBe(270 - 2 * CAPA_MARGEN_X)
  })

  it('centrada sobre el óvalo cuando cabe', () => {
    expect(colocaCapa({ ovalo: ov(21, 274.81, 318, 96), vp: vp(360, 640), ancho: 318, alto: 58 }))
      .toEqual({ x: 21, y: 274.81 + 48 - 29 })
  })

  it('empujada hacia dentro del viewport cuando el óvalo está en un borde', () => {
    // Mesa 2 en 844×390: el óvalo derecho mide 157 y la capa 260.
    const r = colocaCapa({ ovalo: ov(678, 134.91, 157, 69), vp: vp(844, 390), ancho: 260, alto: 120 })
    expect(r.x).toBe(844 - CAPA_MARGEN_X - 260)
    expect(colocaCapa({ ovalo: ov(100, 0, 300, 20), vp: vp(844, 390), ancho: 300, alto: 100 }).y).toBe(CAPA_MARGEN_Y)
    expect(colocaCapa({ ovalo: ov(100, 380, 300, 20), vp: vp(844, 390), ancho: 300, alto: 100 }).y).toBe(390 - CAPA_MARGEN_Y - 100)
  })
})
