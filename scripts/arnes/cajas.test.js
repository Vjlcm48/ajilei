// ── ARN-3c · D4 · el juicio de «¿cabe el texto en su caja?» ──────────────────
// Lo que se sella es la regla con que `msg` barre las cajas con «Heptacoins»:
// horizontal contra el contenido, vertical contra el relleno, el scroll interno,
// los antepasados que recortan, y la elipsis del producto como «recorta».
import { describe, it, expect } from 'vitest'
import { juzgaCajaTexto, HOLGURA_CAJA, puntoPinta, juzgaSobrante } from './cajas.mjs'

const caja = { contenido: { x: 10, right: 110 }, relleno: { y: 0, bottom: 20 }, scroll: { w: 100, cw: 100, h: 20, ch: 20 } }
const rango = (x, right, y = 4, bottom = 16) => ({ x, right, y, bottom })

describe('D4 · ¿cabe el texto en su caja?', () => {
  it('dentro de la caja: cabe', () => {
    expect(juzgaCajaTexto({ ...caja, rango: rango(10, 110) }).estado).toBe('cabe')
  })
  it('la holgura de medio píxel no es un desborde (cuantización)', () => {
    expect(juzgaCajaTexto({ ...caja, rango: rango(10, 110 + HOLGURA_CAJA) }).estado).toBe('cabe')
    expect(juzgaCajaTexto({ ...caja, rango: rango(10, 110.6) }).estado).toBe('desborda')
  })
  it('se sale por la derecha o por la izquierda del contenido: desborda, con su exceso', () => {
    expect(juzgaCajaTexto({ ...caja, rango: rango(10, 123.456) })).toEqual({ estado: 'desborda', exceso: 13.46 })
    expect(juzgaCajaTexto({ ...caja, rango: rango(4, 100) }).estado).toBe('desborda')
  })
  it('en vertical manda el relleno: la caja de línea puede invadirlo', () => {
    expect(juzgaCajaTexto({ ...caja, rango: rango(10, 100, 0, 20) }).estado).toBe('cabe')
    expect(juzgaCajaTexto({ ...caja, rango: rango(10, 100, 0, 23) }).estado).toBe('desborda')
  })
  it('el desplazamiento interno de la caja es un desborde aunque el rango quepa', () => {
    expect(juzgaCajaTexto({ ...caja, scroll: { w: 140, cw: 100, h: 20, ch: 20 }, rango: rango(10, 100) }).estado).toBe('desborda')
  })
  it('un antepasado que recorta y deja el texto fuera: desborda', () => {
    const recortes = [{ x: 10, right: 60, y: 0, bottom: 20 }]
    expect(juzgaCajaTexto({ ...caja, recortes, rango: rango(10, 100) }).estado).toBe('desborda')
  })
  it('con elipsis del producto es «recorta», no rojo', () => {
    const recortes = [{ x: 10, right: 60, y: 0, bottom: 20 }]
    expect(juzgaCajaTexto({ ...caja, recortes, elipsis: true, rango: rango(10, 100) }).estado).toBe('recorta')
  })
  it('la elipsis no disfraza un texto que cabe', () => {
    expect(juzgaCajaTexto({ ...caja, elipsis: true, rango: rango(10, 100) }).estado).toBe('cabe')
  })
})

// ── ARN-3c-ii · D8 · el sobrante del descarte ────────────────────────────────

describe('D8 · ¿hay algo visible bajo la carta que cuelga?', () => {
  const tapete = { el: 'section.player-zone', esZona: true, visibility: 'visible', opacity: 1, pinta: { fondo: null } }
  const fila = { el: 'div.cards-row', esZona: false, visibility: 'visible', opacity: 1, pinta: {} }
  it('el tapete de la zona y un contenedor sin pintura no pintan', () => {
    expect(puntoPinta(tapete)).toBe(false)
    expect(puntoPinta(fila)).toBe(false)
  })
  it('texto, imagen, fondo, borde, sombra o contorno visibles sí pintan', () => {
    for (const k of ['texto', 'imagen', 'fondo', 'borde', 'sombra', 'contorno']) {
      expect(puntoPinta({ ...fila, pinta: { [k]: k === 'fondo' ? 'rgb(1, 2, 3)' : true } }), k).toBe(true)
    }
  })
  it('lo oculto no pinta (visibility u opacidad 0)', () => {
    expect(puntoPinta({ ...fila, visibility: 'hidden', pinta: { texto: true } })).toBe(false)
    expect(puntoPinta({ ...fila, opacity: 0, pinta: { texto: true } })).toBe(false)
  })
  it('sin casos no hay veredicto; con un punto que pinta, rojo con su culpable', () => {
    expect(juzgaSobrante([]).ok).toBe(null)
    expect(juzgaSobrante([{ pts: [tapete, fila] }]).ok).toBe(true)
    const r = juzgaSobrante([{ pts: [tapete] }, { pts: [{ ...fila, el: 'p.intruso', pinta: { texto: true }, x: 10, y: 20 }] }])
    expect(r.ok).toBe(false)
    expect(r.culpables).toEqual([{ caso: 1, el: 'p.intruso', x: 10, y: 20, pinta: { texto: true } }])
  })
})
