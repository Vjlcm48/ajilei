// IDX-1 Fase 1a y 1b · pruebas de la lógica pura del índice digital.
// Rector: AJILEI_IDX-1_Fase1a_v1.0 §5.1 y AJILEI_IDX-1_Fase1b_v1.0 §2.1.
import { describe, it, expect } from 'vitest'
import {
  ANCHO, ALTO, CREMA, RANGOS, ORDEN_RANGOS, CARTAS, CAJAS_INDICE, COLORES,
  alturaCifra, textoRango, colorPalo, margenBorrado, ampliarCaja, cajasBorrado,
  factoresEncogido, FACTOR_SUELO, estadoCarta, HOLGURA_MINIMA, destinoMoneda, MONEDAS,
  esRestoNumero, TINTA_ARRIBA, TINTA_DERECHA, INTERIOR, COMPONENTE_MINIMA,
  aplanarCrema, rellenarCaja, restosEnAnillo, mascaraDibujo, distancia2, holgura,
  dilatar, componentes, rellenarHuecos, cajaMascara, sinComponentesPequenas,
  FACTORES_SELLADOS, MONEDAS_SELLADO, factorSellado, factorNumerico, comprobarHolgura,
  HOLGURA_TOLERADA, INTENSIDAD_RESTO,
} from './idx/idxCore.mjs'

// Un lienzo RGBA de w×h relleno de crema.
const lienzo = (w, h, rgb = CREMA) => {
  const d = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) { d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = 255 }
  return d
}
const pon = (d, w, x, y, rgb) => { const i = (y * w + x) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2] }
const lee = (d, w, x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]] }

describe('rangos: texto y altura de cifra (D-6)', () => {
  it('diez rangos, sin 8 ni 9', () => {
    expect(ORDEN_RANGOS).toEqual(['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'diez', 'once', 'doce'])
    expect(ORDEN_RANGOS.map(textoRango)).toEqual(['1', '2', '3', '4', '5', '6', '7', '10', '11', '12'])
  })
  it('del 1 al 7 al 16 % del alto; 10, 11 y 12 al 12 %', () => {
    for (const r of ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete']) expect(alturaCifra(r)).toBeCloseTo(238.56, 2)
    for (const r of ['diez', 'once', 'doce']) expect(alturaCifra(r)).toBeCloseTo(178.92, 2)
    expect(Object.values(RANGOS).filter((r) => r.figura)).toHaveLength(3)
  })
  it('rechaza un rango inventado', () => {
    expect(() => alturaCifra('ocho')).toThrow()
    expect(() => textoRango('nueve')).toThrow()
  })
})

describe('palos: color (D-9)', () => {
  it('oros rojo, copas verde, espadas azul, bastos bronce', () => {
    expect(colorPalo('oro')).toBe('#CF142B')
    expect(colorPalo('copa')).toBe('#235C38')
    expect(colorPalo('espada')).toBe('#003893')
    expect(colorPalo('basto')).toBe('#7A5200')
  })
  it('ningún palo usa el oro de marca (regla del oro único)', () => {
    for (const c of Object.values(COLORES)) expect(c.toLowerCase()).not.toBe('#e8b84b')
  })
  it('las 40 cartas, cada una una sola vez', () => {
    expect(CARTAS).toHaveLength(40)
    expect(new Set(CARTAS.map((c) => c.nombre)).size).toBe(40)
    expect(() => colorPalo('corazon')).toThrow()
  })
})

describe('cajas de borrado (§3.3)', () => {
  it('3 px por lado, salvo el índice inferior del 4 de oros (2 px)', () => {
    expect(margenBorrado('cuatro', 'oro', 'inf')).toBe(2)
    expect(margenBorrado('cuatro', 'oro', 'sup')).toBe(3)
    expect(margenBorrado('cuatro', 'copa', 'inf')).toBe(3)
    expect(margenBorrado('siete', 'oro', 'inf')).toBe(3)
  })
  it('amplía la caja de la Fase 0 con su margen', () => {
    expect(ampliarCaja([10, 20, 30, 40], 3)).toEqual([7, 17, 33, 43])
    expect(cajasBorrado('cuatro', 'oro')).toEqual({ sup: [864, 136, 945, 245], inf: [110, 1246, 189, 1353] })
    expect(cajasBorrado('cuatro', 'espada').inf).toEqual([109, 1245, 190, 1354])
  })
  it('la caja inferior es la superior girada 180° (Fase 0 §B.1)', () => {
    for (const { sup, inf } of Object.values(CAJAS_INDICE)) {
      expect(inf).toEqual([ANCHO - 1 - sup[2], ALTO - 1 - sup[3], ANCHO - 1 - sup[0], ALTO - 1 - sup[1]])
    }
  })
  it('rellena la caja y deja fuera intacto', () => {
    const w = 12, h = 12, d = lienzo(w, h, [0, 0, 0])
    rellenarCaja(d, w, h, [2, 3, 4, 5])
    expect(lee(d, w, 2, 3)).toEqual(CREMA)
    expect(lee(d, w, 4, 5)).toEqual(CREMA)
    expect(lee(d, w, 5, 5)).toEqual([0, 0, 0])
    expect(lee(d, w, 1, 3)).toEqual([0, 0, 0])
  })
  it('la verificación ve el resto en el anillo y no el de dentro de la caja', () => {
    const w = 30, h = 30, d = lienzo(w, h)
    pon(d, w, 12, 12, [207, 20, 43])   // dentro de la caja
    expect(restosEnAnillo(d, w, h, [10, 10, 15, 15])).toHaveLength(0)
    pon(d, w, 20, 12, [207, 20, 43])   // a 5 px: dentro del anillo de 8
    pon(d, w, 25, 12, [207, 20, 43])   // a 10 px: fuera
    pon(d, w, 12, 20, [236, 190, 51])  // oro de moneda en el anillo: no es resto
    const px = restosEnAnillo(d, w, h, [10, 10, 15, 15])
    expect(px.map((p) => [p.x, p.y])).toEqual([[20, 12]])
  })
  it('resto = en la mezcla crema → #CF142B a ≤ 12 por canal y fuera de la crema pura (A-2)', () => {
    expect(esRestoNumero(207, 20, 43)).toBe(true)          // el rojo viejo
    expect(esRestoNumero(231, 157, 152)).toBe(true)        // su antialias
    expect(esRestoNumero(245, 237, 216)).toBe(false)       // crema pura
    expect(esRestoNumero(236, 190, 51)).toBe(false)        // oro de moneda (el falso positivo del 4 de oros)
    expect(esRestoNumero(0x23, 0x5c, 0x38)).toBe(false)    // verde de copas
    expect(esRestoNumero(0x7a, 0x52, 0x00)).toBe(false)    // bronce de bastos
    // Más allá del extremo rojo la proyección se satura en t = 1 y el residuo
    // es el desplazamiento: 12 en R todavía cuenta; 13, ya no.
    expect(esRestoNumero(207 - 12, 20, 43)).toBe(true)
    expect(esRestoNumero(207 - 13, 20, 43)).toBe(false)
  })
  it('un píxel pálido de la mezcla, a menos de 6 niveles de la crema, ya no cuenta (B-3)', () => {
    // Crema + 2 % del camino al rojo: (244, 233, 213), a 4 niveles en G.
    // Está en la recta, así que en el ajuste contaba como resto.
    expect(esRestoNumero(244, 233, 213)).toBe(false)
    // Crema + 3 %: (244, 230, 211), a 7 niveles en G. Cuenta.
    expect(esRestoNumero(244, 230, 211)).toBe(true)
    expect(INTENSIDAD_RESTO).toBe(6)
    // El umbral es por canal (el máximo): 5 niveles en G no, 6 sí.
    expect(esRestoNumero(245, 237 - 5, 216 - 4)).toBe(false)
    expect(esRestoNumero(245, 237 - 6, 216 - 5)).toBe(true)
  })
})

describe('factores sellados (B-1) y comprobación de holgura (B-2)', () => {
  it('la tabla tiene las 40 cartas y ninguna más', () => {
    expect(Object.keys(FACTORES_SELLADOS).sort()).toEqual(CARTAS.map((c) => c.nombre).sort())
    expect(Object.isFrozen(FACTORES_SELLADOS)).toBe(true)
  })
  it('los valores son los del informe del ajuste', () => {
    const encogidas = {
      cinco_copa: 0.93, cuatro_basto: 0.91, cinco_basto: 0.91, siete_basto: 0.96, cinco_oro: 0.90,
      seis_basto: 0.96, cuatro_espada: 0.90, cuatro_copa: 0.90, cuatro_oro: 'monedas-0.84',
    }
    for (const { nombre } of CARTAS) expect(factorSellado(nombre)).toBe(encogidas[nombre] ?? 1)
    expect(Object.values(FACTORES_SELLADOS).filter((f) => f === 1)).toHaveLength(31)
    // El 7 de copas, en el filo de la regla, queda sin encoger.
    expect(factorSellado('siete_copa')).toBe(1)
    expect(MONEDAS_SELLADO).toBe('monedas-0.84')
    expect(factorNumerico(MONEDAS_SELLADO)).toBe(MONEDAS.factor)
    expect(factorNumerico(0.93)).toBe(0.93)
    expect(() => factorSellado('ocho_oro')).toThrow()
  })
  it('se detiene por debajo de 17,0 px y deja pasar 17,0 o más', () => {
    expect(HOLGURA_TOLERADA).toBe(17)
    expect(comprobarHolgura('cinco_copa', 17)).toBe(true)
    expect(comprobarHolgura('siete_copa', 18.2)).toBe(true)
    expect(comprobarHolgura('cuatro_oro', Infinity)).toBe(true)
    expect(() => comprobarHolgura('cinco_copa', 16.99)).toThrow(/cinco_copa.*17.*0\.93/)
    expect(() => comprobarHolgura('siete_copa', 0)).toThrow(/B-2/)
    expect(() => comprobarHolgura('siete_copa', NaN)).toThrow()
  })
})

describe('factores de encogido (D-12)', () => {
  it('de 0,99 a 0,85 de 1 en 1 %, sin pasar del suelo', () => {
    const f = factoresEncogido()
    expect(f[0]).toBe(0.99)
    expect(f.at(-1)).toBe(FACTOR_SUELO)
    expect(f).toHaveLength(15)
    for (let i = 1; i < f.length; i++) expect(Math.round((f[i - 1] - f[i]) * 100)).toBe(1)
    expect(f.every((x) => x >= 0.85)).toBe(true)
  })
})

describe('estado de la carta', () => {
  it('borrado incompleto manda sobre todo', () => {
    expect(estadoCarta({ borradoOk: false, holguraFinal: 50, factor: 1 })).toBe('borrado-incompleto')
  })
  it('por debajo de la holgura tolerada (B-2), necesita decisión', () => {
    expect(estadoCarta({ borradoOk: true, holguraFinal: HOLGURA_TOLERADA - 0.1, factor: 0.85 })).toBe('necesita-decision')
    // Entre 17 y 18 ya no: la regla sólo informa (B-2).
    expect(estadoCarta({ borradoOk: true, holguraFinal: HOLGURA_MINIMA - 0.5, factor: 1 })).toBe('ok')
  })
  it('encogida si el factor no es 1; ok si no se tocó', () => {
    expect(estadoCarta({ borradoOk: true, holguraFinal: 19.9, factor: 0.94 })).toBe('encogida')
    expect(estadoCarta({ borradoOk: true, holguraFinal: HOLGURA_MINIMA, factor: 1 })).toBe('ok')
  })
})

describe('4 de oros (§3.6)', () => {
  it('monedas al 84 %, simétricas y a 16 px entre sí', () => {
    const izq = destinoMoneda({ cx: 286, cy: 322.5, radio: 157 })
    const der = destinoMoneda({ cx: 724.5, cy: 323, radio: 157 })
    expect(izq.radio).toBeCloseTo(157 * MONEDAS.factor, 6)
    expect(izq.cx).toBeCloseTo(527 - (8 + 157 * 0.84), 6)
    expect(der.cx).toBeCloseTo(527 + (8 + 157 * 0.84), 6)
    expect(izq.cy).toBe(322.5)
    expect((der.cx - der.radio) - (izq.cx + izq.radio)).toBeCloseTo(16, 6)
  })
})

describe('posición del número (D-7, Ajuste A-1)', () => {
  it('la tinta empieza en y = 93 y acaba en x = 976: 22 px bajo el marco y 24 a su izquierda', () => {
    expect(TINTA_ARRIBA).toBe(93)
    expect(TINTA_DERECHA).toBe(976)
    expect(TINTA_ARRIBA - INTERIOR[1]).toBe(22)
    expect(INTERIOR[2] - TINTA_DERECHA).toBe(24)
  })
})

describe('aplanar la crema (§3.2)', () => {
  it('≤ 12 pasa a crema exacta; > 12 y las estrellas no cambian', () => {
    const w = 8, h = 1, d = lienzo(w, h)
    pon(d, w, 0, 0, [245 - 12, 237, 216 + 12])
    pon(d, w, 1, 0, [245 - 13, 237, 216])
    pon(d, w, 2, 0, [0x87, 0x9b, 0x83])
    const n = aplanarCrema(d, w, [0, 0, 7, 0])
    expect(n).toBe(1)
    expect(lee(d, w, 0, 0)).toEqual(CREMA)
    expect(lee(d, w, 1, 0)).toEqual([232, 237, 216])
    expect(lee(d, w, 2, 0)).toEqual([0x87, 0x9b, 0x83])
  })
  it('fuera de la ventana no toca nada', () => {
    const w = 4, h = 1, d = lienzo(w, h)
    pon(d, w, 3, 0, [240, 237, 216])
    aplanarCrema(d, w, [0, 0, 2, 0])
    expect(lee(d, w, 3, 0)).toEqual([240, 237, 216])
  })
})

describe('máscaras, distancia y holgura (§3.4)', () => {
  it('máscara del dibujo: desviación > 18 dentro de la ventana', () => {
    const w = 6, h = 1, d = lienzo(w, h)
    pon(d, w, 1, 0, [245 - 18, 237, 216])
    pon(d, w, 2, 0, [245 - 19, 237, 216])
    pon(d, w, 5, 0, [0, 0, 0])
    expect([...mascaraDibujo(d, w, h, [0, 0, 4, 0])]).toEqual([0, 0, 1, 0, 0, 0])
  })
  it('la transformada de distancia es euclídea exacta', () => {
    const w = 40, h = 30, m = new Uint8Array(w * h)
    m[10 * w + 10] = 1
    const d2 = distancia2(m, w, h)
    expect(d2[10 * w + 10]).toBe(0)
    expect(d2[10 * w + 13]).toBe(9)
    expect(d2[14 * w + 13]).toBe(25)
    expect(d2[29 * w + 39]).toBe(19 * 19 + 29 * 29)
  })
  it('holgura = distancia mínima entre número y dibujo, con dónde', () => {
    const w = 60, h = 20, num = new Uint8Array(w * h), dib = new Uint8Array(w * h)
    num[5 * w + 5] = 1; num[5 * w + 6] = 1
    dib[5 * w + 30] = 1; dib[15 * w + 10] = 1
    const r = holgura(distancia2(num, w, h), dib, w)
    expect(r.px).toBeCloseTo(Math.hypot(4, 10), 9)
    expect([r.x, r.y]).toEqual([10, 15])
    expect(holgura(distancia2(num, w, h), new Uint8Array(w * h), w).px).toBe(Infinity)
  })
  it('dilatar por disco de radio 2 y caja de la máscara', () => {
    const w = 11, h = 11, m = new Uint8Array(w * h)
    m[5 * w + 5] = 1
    const g = dilatar(m, w, h, 2)
    expect(g[5 * w + 7]).toBe(1)
    expect(g[7 * w + 7]).toBe(0)   // √8 > 2
    expect(g[6 * w + 6]).toBe(1)
    expect(cajaMascara(g, w)).toEqual([3, 3, 7, 7])
  })
})

describe('píxeles sueltos (Ajuste A-3)', () => {
  it('fuera las componentes de menos de 10 px; se quedan las de 10 o más', () => {
    expect(COMPONENTE_MINIMA).toBe(10)
    const w = 30, h = 10, m = new Uint8Array(w * h)
    m[5 * w + 2] = 1                                       // suelto
    for (let x = 10; x < 19; x++) m[2 * w + x] = 1         // 9 px
    for (let x = 10; x < 20; x++) m[6 * w + x] = 1         // 10 px
    const f = sinComponentesPequenas(m, w, h)
    expect(f[5 * w + 2]).toBe(0)
    expect(f[2 * w + 10]).toBe(0)
    expect([...f].reduce((a, b) => a + b, 0)).toBe(10)
    expect(f[6 * w + 19]).toBe(1)
  })
})

describe('componentes y huecos (§3.6.1)', () => {
  it('separa regiones, filtra por área y rellena el hueco de un anillo', () => {
    const w = 20, h = 12, m = new Uint8Array(w * h)
    for (let y = 1; y <= 7; y++) for (let x = 1; x <= 7; x++) if (y === 1 || y === 7 || x === 1 || x === 7) m[y * w + x] = 1
    m[2 * w + 15] = 1
    const cs = componentes(m, w, h, 5)
    expect(cs).toHaveLength(1)
    expect(cs[0].area).toBe(24)
    expect(cs[0].caja).toEqual([1, 1, 7, 7])
    const lleno = rellenarHuecos(cs[0], w)
    expect(lleno.area).toBe(49)
    expect(componentes(m, w, h, 1)).toHaveLength(2)
  })
})
