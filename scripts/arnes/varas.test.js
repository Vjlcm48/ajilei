// ── ARN-3c-ii · D9 y §1.1.1 · la mediana de 3 y el encadenado honesto ────────
import { describe, it, expect } from 'vitest'
import { claveFallo, mayoriaDeFallos, mayoriaDePuertas, separarConocidos, encadenadoHonesto, leeHonesto } from './varas.mjs'

describe('D9 · la mediana de 3 como mayoría por puerta', () => {
  it('la clave de un fallo no lleva sus cifras', () => {
    expect(claveFallo('m5: el saldo duró 4138 y pedía 2800')).toBe('m#: el saldo duró # y pedía #')
    expect(claveFallo('x 1,5 px y -3.25')).toBe('x # px y #')
  })
  it('un fallo en 2 de 3 repeticiones se mantiene, con sus tres cifras a la vista', () => {
    const r = mayoriaDeFallos([['a: duró 4138'], ['a: duró 3001'], []])
    expect(r.mantenidos).toHaveLength(1)
    expect(r.mantenidos[0].veces).toBe(2)
    expect(r.mantenidos[0].textos.map((t) => t.texto)).toEqual(['a: duró 4138', 'a: duró 3001'])
  })
  it('un fallo en 1 de 3 es suelto: la mediana pasa', () => {
    const r = mayoriaDeFallos([['entraron 3 rubros, deben ser 4'], [], []])
    expect(r.mantenidos).toEqual([])
    expect(r.sueltos[0].veces).toBe(1)
  })
  it('un fallo repetido dentro de UNA repetición cuenta una vez', () => {
    expect(mayoriaDeFallos([['a 1', 'a 2'], [], []]).mantenidos).toEqual([])
  })
  it('es exactamente la mediana en una puerta de umbral', () => {
    const tope = 600
    for (const xs of [[590, 610, 620], [610, 590, 580], [599, 601, 600], [700, 700, 1]]) {
      const reps = xs.map((x) => [{ clave: 'relevo', ok: x <= tope, det: String(x) }])
      const mediana = [...xs].sort((a, b) => a - b)[1]
      expect(mayoriaDePuertas(reps)[0].ok).toBe(mediana <= tope)
    }
  })
  it('una puerta que no se midió en una repetición cuenta como roja ahí', () => {
    const p = mayoriaDePuertas([[{ clave: 'k', ok: true, det: 'a' }], [], [{ clave: 'k', ok: false, det: 'c' }]])[0]
    expect(p.ok).toBe(false)
    expect(p.dets).toEqual(['a', '(no medida)', 'c'])
  })
  it('separa los rojos conocidos con su dueño de los nuevos', () => {
    const c = [{ patron: /el saldo pide 2800 ms y el doble de CEL-2c son 2933/, dueno: 'CEL-2c' }]
    const r = separarConocidos(['m: el saldo pide 2800 ms y el doble de CEL-2c son 2933', 'm: otra cosa'], c)
    expect(r.conocidos).toEqual([{ fallo: 'm: el saldo pide 2800 ms y el doble de CEL-2c son 2933', dueno: 'CEL-2c' }])
    expect(r.nuevos).toEqual(['m: otra cosa'])
  })
})

describe('§1.1.1 · el encadenado honesto', () => {
  const TOC = 1896
  it('encadena si el toc-toc sonaba: la espera es la del archivo, no la nominal', () => {
    expect(encadenadoHonesto({ encadenado: true, espera: 2146 }, TOC)).toBe(true)
    expect(encadenadoHonesto({ encadenado: true, espera: 3000 }, TOC)).toBe(true)
  })
  it('NO encadena si se pidió pero no sonaba: la espera cae al reloj nominal', () => {
    expect(encadenadoHonesto({ encadenado: true, espera: TOC }, TOC)).toBe(false)
  })
  it('sin audio no hay encadenado', () => {
    expect(encadenadoHonesto({ encadenado: false, espera: TOC }, TOC)).toBe(false)
    expect(encadenadoHonesto(null, TOC)).toBe(false)
  })
  // ARN-3d §1.4 · las dos ramas: la marca `honesto` manda cuando existe; sin
  // ella, la deducción por igualdad de ARN-3c.
  it('con la marca `honesto`, se LEE y no se deduce', () => {
    expect(leeHonesto({ encadenado: true, honesto: true, espera: TOC })).toBe(true)
    // La marca dice la verdad aunque la espera, por azar, valga el nominal…
    expect(encadenadoHonesto({ encadenado: true, honesto: true, espera: TOC }, TOC)).toBe(true)
    // …y aunque la espera parezca de archivo, si la marca dice que no, es que no.
    expect(encadenadoHonesto({ encadenado: true, honesto: false, espera: 2146 }, TOC)).toBe(false)
    // Sin audio pedido no hay encadenado, diga lo que diga la marca.
    expect(encadenadoHonesto({ encadenado: false, honesto: true, espera: 2146 }, TOC)).toBe(false)
  })
  it('sin la marca (o con un valor que no es booleano), cae a la deducción', () => {
    expect(leeHonesto({ encadenado: true, espera: 2146 })).toBe(false)
    expect(leeHonesto({ encadenado: true, honesto: 'sí', espera: TOC })).toBe(false)
    expect(leeHonesto(null)).toBe(false)
    expect(encadenadoHonesto({ encadenado: true, honesto: 'sí', espera: TOC }, TOC)).toBe(false)
    expect(encadenadoHonesto({ encadenado: true, honesto: undefined, espera: 2146 }, TOC)).toBe(true)
  })
})
