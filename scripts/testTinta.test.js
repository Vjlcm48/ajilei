// ── VIS-1 · El instrumento del contraste ────────────────────────────────────
// Lo puro de `scripts/arnes/tinta.mjs`: si esto miente, `cfg.contraste`,
// `tie.contraste` y `luz` p2 mienten con él.
import { describe, it, expect } from 'vitest'
import { Buffer } from 'node:buffer'
import { deflateSync } from 'node:zlib'
import { compone, contraste, decodePNG, esTenue, parseColor, peorFondo } from './arnes/tinta.mjs'

// Un PNG RGB de verdad, con el filtro 0 en todas las filas.
function png(w, h, pixel) {
  const crudo = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    const o = y * (w * 3 + 1)
    for (let x = 0; x < w; x++) crudo.set(pixel(x, y), o + 1 + x * 3)
  }
  const trozo = (tipo, datos) => {
    const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length)
    return Buffer.concat([largo, Buffer.from(tipo, 'latin1'), datos, Buffer.alloc(4)])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr), trozo('IDAT', deflateSync(crudo)), trozo('IEND', Buffer.alloc(0))])
}

describe('WCAG', () => {
  it('blanco sobre negro es 21 y un color consigo mismo es 1', () => {
    expect(contraste([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5)
    expect(contraste([27, 72, 44], [27, 72, 44])).toBe(1)
  })
  it('da las cifras de la sonda: el token a α 0,55 sobre el centro del verde y del vino', () => {
    const crema = [245, 237, 216]
    expect(contraste(compone(crema, 0.55, [0x1b, 0x48, 0x2c]), [0x1b, 0x48, 0x2c])).toBeCloseTo(3.9, 1)
    expect(contraste(compone(crema, 0.55, [0x7c, 0x1d, 0x30]), [0x7c, 0x1d, 0x30])).toBeCloseTo(3.63, 1)
  })
})

describe('parseColor y esTenue', () => {
  it('lee rgb, rgba y color(srgb)', () => {
    expect(parseColor('rgb(1, 2, 3)')).toEqual({ rgb: [1, 2, 3], a: 1 })
    expect(parseColor('rgba(245, 237, 216, 0.65)').a).toBe(0.65)
    expect(parseColor('color(srgb 1 0 0 / 0.5)')).toEqual({ rgb: [255, 0, 0], a: 0.5 })
    expect(parseColor('transparent')).toBeNull()
  })
  it('reconoce el token por color y alfa, sin confundirlo con otro crema', () => {
    expect(esTenue('rgba(245, 237, 216, 0.65)', 0.65)).toBe(true)
    expect(esTenue('rgba(245, 237, 216, 0.72)', 0.65)).toBe(false)
    expect(esTenue('rgba(255, 0, 0, 0.65)', 0.65)).toBe(false)
  })
})

describe('peorFondo', () => {
  // 10×4: fondo oscuro; una «letra» en (2,1) y una raya clara en la fila 3 que NO es tinta.
  const fondo = (x, y) => (y === 3 ? [200, 200, 200] : [20, 40, 30])
  const sin = decodePNG(png(10, 4, fondo))
  const con = decodePNG(png(10, 4, (x, y) => (x === 2 && y === 1 ? [245, 237, 216] : fondo(x, y))))
  const texto = { color: 'rgba(245, 237, 216, 0.65)', op: 1, rects: [{ l: 0, t: 0, r: 10, b: 4 }] }

  it('decodifica el PNG', () => {
    expect([sin.w, sin.h]).toEqual([10, 4])
    expect(sin.at(0, 3)).toEqual([200, 200, 200])
  })
  it('solo cuenta los píxeles que cambian: la raya clara bajo la caja no entra', () => {
    const m = peorFondo({ con, sin, dpr: 1 }, texto)
    expect(m.fondo).toBe('#141e1e'.replace('1e1e', '281e'))
    expect(m.contraste).toBeGreaterThan(4.5)
  })
  it('sin tinta no hay cifra, y eso no es un aprobado', () => {
    expect(peorFondo({ con: sin, sin, dpr: 1 }, texto).contraste).toBeNull()
  })
  it('la opacidad de los antepasados cuenta, y el color se puede forzar', () => {
    const f = { con, sin, dpr: 1 }
    const entero = peorFondo(f, texto).contraste
    expect(peorFondo(f, { ...texto, op: 0.8 }).contraste).toBeLessThan(entero)
    expect(peorFondo(f, texto, { rgb: [245, 237, 216], a: 0.9 }).contraste).toBeGreaterThan(entero)
  })
})
