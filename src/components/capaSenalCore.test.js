import { describe, it, expect } from 'vitest'
import {
  BORDE, MARGEN_HUECO, MAX_LINEAS, SEPARACION, FLECHA_DESDE,
  union, huecoDe, huecosDe, destapa, solape, bandas, radioDe, lineasDe, colocarBurbuja, burbujaCabe, colocarRespaldo,
  colocarBarra, colocarLibre, flechaEntre, trozosRotulo,
} from './capaSenalCore'

// ── TUT-1 tanda 1 · la geometría pura de la capa de señalización ────────────

const caja = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height })
const area = (c) => c.width * c.height
const T1 = { w: 360, h: 640 }
const T6 = { w: 1920, h: 1080 }

describe('TUT-1 · union y huecos', () => {
  it('union envuelve a todas e ignora las de tamaño 0', () => {
    expect(union([caja(10, 10, 20, 20), caja(50, 5, 10, 10), caja(0, 0, 0, 0)])).toEqual(caja(10, 5, 50, 25))
    expect(union([])).toBeNull()
    expect(union([caja(3, 3, 0, 9)])).toBeNull()
  })

  it('el hueco es el ancla más el margen, recortado a la ventana', () => {
    expect(MARGEN_HUECO).toBe(6)
    expect(huecoDe(caja(100, 100, 80, 40), T1)).toEqual(caja(94, 94, 92, 52))
    expect(huecoDe(caja(2, 600, 80, 40), T1)).toEqual(caja(0, 594, 88, 46))
    expect(huecoDe(caja(0, 0, 0, 0), T1)).toBeNull()
    expect(huecoDe(caja(400, 700, 20, 20), T1)).toBeNull()
  })

  it('UN HUECO POR ANCLA: dos botones separados dan dos huecos (hallazgo 5 de la lámina)', () => {
    // Apostar a la izquierda y un multiplicador a 40 px: la caja que los envolvía
    // destapaba lo de en medio.
    const h = huecosDe([caja(100, 500, 80, 44), caja(220, 500, 50, 44)], T1)
    expect(h).toHaveLength(2)
    expect(solape(h[0], h[1])).toBe(0)
    expect(h.map((x) => x.left)).toEqual([94, 214])
  })

  it('los que se pisan (a menos de dos márgenes) se funden en su unión', () => {
    const h = huecosDe([caja(100, 500, 80, 44), caja(188, 500, 80, 44), caja(20, 100, 40, 40)], T1)
    expect(h).toEqual([caja(14, 94, 52, 52), caja(94, 494, 180, 56)])
    // Una cadena: A pisa a B y B pisa a C → uno solo (los cuatro multiplicadores).
    expect(huecosDe([caja(0, 300, 40, 40), caja(48, 300, 40, 40), caja(96, 300, 40, 40)], T1)).toHaveLength(1)
  })

  it('NO se funden si la unión destapa otro control: «Apostar» con la fila de multiplicadores (diagDSK tut)', () => {
    // Los multiplicadores a lo ancho; debajo, «Pasar», «Apostar» y «Retirarse». La caja de
    // «Apostar» con la fila cubría el centro de «Retirarse».
    const mults = caja(40, 440, 280, 36)
    const apostar = caja(130, 484, 100, 44)
    const retirarse = caja(240, 484, 90, 44)
    const pasar = caja(30, 484, 90, 44)
    const sin = huecosDe([mults, apostar], T1)
    expect(sin).toHaveLength(1)
    expect(destapa(sin[0], retirarse)).toBe(true)
    const con = huecosDe([mults, apostar], T1, { evitar: [pasar, retirarse] })
    expect(con).toHaveLength(2)
    expect(con.some((h) => destapa(h, retirarse) || destapa(h, pasar))).toBe(false)
    // Se pisan (están a 8 px) y quedan así: el velo es una máscara, no se vuelven a tapar.
    expect(solape(con[0], con[1])).toBeGreaterThan(0)
  })

  it('funde primero el par más pequeño: los multiplicadores entre ellos, no «×1» con «Apostar»', () => {
    const m = [caja(100, 440, 36, 30), caja(142, 440, 36, 30), caja(184, 440, 36, 30), caja(226, 440, 40, 30)]
    const apostar = caja(100, 478, 100, 40)
    const retirarse = caja(210, 478, 90, 40)
    const h = huecosDe([...m, apostar], T1, { evitar: [retirarse] })
    expect(h).toHaveLength(2)
    expect(h[0]).toEqual(caja(94, 434, 178, 42))
    expect(h[1]).toEqual(caja(94, 472, 112, 52))
  })
})

describe('TUT-1 · el velo: bandas y trazado', () => {
  it('sin hueco, una banda que lo tapa todo', () => {
    expect(bandas([], T1)).toEqual([caja(0, 0, 360, 640)])
    expect(bandas(null, T1)).toEqual([caja(0, 0, 360, 640)])
  })

  it('con un hueco, cuatro bandas que cubren todo menos el hueco, sin pisarse', () => {
    const h = caja(94, 494, 92, 56)
    const b = bandas(h, T1)
    expect(b).toHaveLength(4)
    expect(b.every((x) => solape(x, h) === 0)).toBe(true)
    expect(b.reduce((s, x) => s + area(x), 0)).toBe(360 * 640 - area(h))
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(solape(b[i], b[j])).toBe(0)
  })

  it('con varios huecos (también en la misma franja), lo mismo', () => {
    const hs = huecosDe([caja(100, 500, 80, 44), caja(220, 510, 50, 44), caja(20, 100, 40, 40)], T1)
    const b = bandas(hs, T1)
    expect(b.every((x) => hs.every((h) => solape(x, h) === 0))).toBe(true)
    expect(b.reduce((s, x) => s + area(x), 0)).toBe(360 * 640 - hs.reduce((s, h) => s + area(h), 0))
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(solape(b[i], b[j])).toBe(0)
  })

  it('con huecos que se pisan, las bandas tampoco tapan ninguno', () => {
    const hs = [caja(34, 434, 292, 48), caja(124, 478, 112, 56)]
    const b = bandas(hs, T1)
    expect(b.every((x) => hs.every((h) => solape(x, h) === 0))).toBe(true)
    const unidos = 292 * 48 + 112 * 56 - solape(hs[0], hs[1])
    expect(b.reduce((s, x) => s + area(x), 0)).toBe(360 * 640 - unidos)
  })

  it('el radio de las esquinas no pasa de la mitad del lado corto', () => {
    expect(radioDe(caja(0, 0, 100, 44))).toBe(12)
    expect(radioDe(caja(0, 0, 100, 10))).toBe(5)
  })
})

describe('TUT-1 · la burbuja y su respaldo', () => {
  it('cuenta las líneas por el alto y el interlineado', () => {
    expect(lineasDe(20.25, 20.25)).toBe(1)
    expect(lineasDe(40.5, 20.25)).toBe(2)
    expect(lineasDe(64.8, 21.6)).toBe(3)
    expect(lineasDe(0, 20)).toBe(0)
    expect(MAX_LINEAS).toBe(2)
  })

  it('la burbuja va encima del ancla si cabe, con el pico al centro', () => {
    const hueco = caja(94, 494, 92, 56)
    const b = colocarBurbuja({ tam: { w: 300, h: 70 }, hueco, vista: T1 })
    expect(b.lado).toBe('arriba')
    expect(b.caja.top).toBe(494 - SEPARACION - 70)
    expect(b.caja.left).toBe(BORDE)
    expect(b.picoX).toBe(94 + 46 - BORDE)
  })

  it('si encima no cabe, debajo; el pico nunca sale de las esquinas', () => {
    const b = colocarBurbuja({ tam: { w: 300, h: 70 }, hueco: caja(300, 20, 50, 40), vista: T1 })
    expect(b.lado).toBe('abajo')
    expect(b.caja.top).toBe(60 + SEPARACION)
    expect(b.picoX).toBe(325 - 48)
    // Pegado al borde derecho, el pico se queda a 20 px de la esquina.
    expect(colocarBurbuja({ tam: { w: 300, h: 70 }, hueco: caja(340, 300, 20, 40), vista: T1 }).picoX).toBe(300 - 12 - 8)
  })

  it('cabe con dos líneas dentro y sin pisar huecos; no con tres, ni fuera, ni encima de un hueco', () => {
    const hueco = caja(94, 494, 92, 56)
    const { caja: c } = colocarBurbuja({ tam: { w: 300, h: 70 }, hueco, vista: T1 })
    expect(burbujaCabe({ caja: c, huecos: [hueco], vista: T1, lineas: 2 })).toBe(true)
    expect(burbujaCabe({ caja: c, huecos: [hueco], vista: T1, lineas: 3 })).toBe(false)
    expect(burbujaCabe({ caja: caja(0, 400, 300, 70), huecos: [hueco], vista: T1, lineas: 1 })).toBe(false)
    expect(burbujaCabe({ caja: caja(BORDE, 480, 300, 70), huecos: [hueco], vista: T1, lineas: 1 })).toBe(false)
    expect(burbujaCabe({ caja: null, huecos: [], vista: T1, lineas: 1 })).toBe(false)
  })

  it('EL PASO 4 EN 1920 (lámina): tres líneas en la burbuja → tarjeta de respaldo abajo, con flecha', () => {
    // La fila de acciones bajo la mesa, y «Cuando alguien apuesta, aquí sale Subir…»
    // en la burbuja de 380: tres líneas de 21,6 px.
    const fila = huecosDe([caja(760, 846, 400, 52)], T6)
    const b = colocarBurbuja({ tam: { w: 380, h: 112 }, hueco: union(fila), vista: T6 })
    expect(burbujaCabe({ caja: b.caja, huecos: fila, vista: T6, lineas: lineasDe(64.8, 21.6) })).toBe(false)
    const tarjeta = colocarRespaldo({ tam: { w: 440, h: 120 }, huecos: fila, vista: T6 })
    expect(tarjeta).toEqual(caja(740, 1080 - BORDE - 120, 440, 120))
    expect(fila.every((h) => solape(tarjeta, h) === 0)).toBe(true)
    const f = flechaEntre(tarjeta, union(fila))
    expect(f).not.toBeNull()
    expect(f.y1).toBe(948)
    expect(f.y2).toBe(904)
  })

  it('la tarjeta de respaldo sube arriba si abajo hay un hueco', () => {
    const hueco = caja(10, 560, 340, 70)
    expect(colocarRespaldo({ tam: { w: 336, h: 120 }, huecos: [hueco], vista: T1 })).toEqual(caja(BORDE, BORDE, 336, 120))
  })

  it('la barra de botones va abajo salvo que pise un hueco o la burbuja', () => {
    expect(colocarBarra({ tam: { w: 200, h: 56 }, evitar: [caja(0, 0, 50, 50)], vista: T1 })).toEqual(caja(80, 572, 200, 56))
    expect(colocarBarra({ tam: { w: 200, h: 56 }, evitar: [caja(0, 560, 360, 80)], vista: T1 })).toEqual(caja(80, BORDE, 200, 56))
  })
})

describe('TUT-1 · la señal libre, la flecha y el rótulo', () => {
  it('la señal libre busca el sitio cercano que no pisa los obstáculos', () => {
    const ancla = caja(100, 560, 160, 50)
    const ovalo = caja(0, 200, 360, 300)
    const { caja: c, pisa } = colocarLibre({ tam: { w: 300, h: 67 }, ancla, obstaculos: [{ caja: ovalo }], vista: T1 })
    expect(pisa).toBe(0)
    expect(solape(c, ovalo)).toBe(0)
    expect(solape(c, ancla)).toBe(0)
    // Más cerca que el borde de arriba: entre el óvalo y el ancla no cabe, así que va arriba del óvalo.
    expect(c.top + c.height).toBeLessThanOrEqual(200)
  })

  it('si no hay sitio libre pisa lo menos posible, con su peso', () => {
    const { pisa } = colocarLibre({ tam: { w: 300, h: 67 }, ancla: caja(0, 600, 10, 10), obstaculos: [{ caja: caja(0, 0, 360, 640), peso: 0.3 }], vista: T1 })
    expect(pisa).toBeCloseTo(300 * 67 * 0.3)
  })

  it('la flecha va de borde a borde; si quedan cerca o se pisan, no hay', () => {
    expect(FLECHA_DESDE).toBe(36)
    expect(flechaEntre(caja(0, 0, 100, 50), caja(0, 70, 100, 40))).toBeNull()
    expect(flechaEntre(caja(0, 0, 100, 50), caja(0, 40, 100, 40))).toBeNull()
    expect(flechaEntre(caja(0, 0, 100, 50), caja(0, 200, 100, 40))).toEqual({ x1: 50, y1: 50, x2: 50, y2: 200 })
  })

  it('el rótulo con **negrita** se corta en trozos, sin trozos vacíos', () => {
    expect(trozosRotulo('Toca **Iniciar mano** cuando estés listo.')).toEqual([
      { texto: 'Toca ', fuerte: false },
      { texto: 'Iniciar mano', fuerte: true },
      { texto: ' cuando estés listo.', fuerte: false },
    ])
    expect(trozosRotulo('**Pasar** no cuesta')).toEqual([{ texto: 'Pasar', fuerte: true }, { texto: ' no cuesta', fuerte: false }])
    expect(trozosRotulo(undefined)).toEqual([])
  })
})
