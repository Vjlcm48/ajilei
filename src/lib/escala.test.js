// ── TAB-1 1b · el núcleo de la escala ───────────────────────────────────────
// Las cifras son las de la ficha 1b–1e §2; los bordes, los de sus referencias.
import { describe, test, expect } from 'vitest'
import {
  REF, LADO_CELULAR, RESERVA_PIE_FS, ANCHO_HB, MEDIA_RATON, clasificar, factorDe, escalaDe, aPropios, escalaActual,
  aplicarEscala, quitarEscala, enganchaEscala, orientacionDe, altoEfectivo, ventanaDe,
} from './escala'

const f = (ancho, alto, extra = {}) => factorDe({ ancho, alto, ...extra })

describe('las cifras de la ficha (§2)', () => {
  test.each([
    [744, 1100, 1.301],
    [744, 1047, 1.289],
    [834, 1108, 1.365],
    [1024, 1259, 1.55],
    [1366, 623, 0.874],
    [1366, 633, 0.888],
    [1133, 658, 0.923],
    [1366, 768, 1],
    [1920, 1080, 1.3],
    [2560, 1300, 1.3],
  ])('%i×%i → %f', (w, h, esperado) => {
    expect(f(w, h)).toBe(esperado)
  })

  test('1133×716 en pantalla completa descuenta la banda del pie', () => {
    expect(f(1133, 716)).toBe(1)
    expect(f(1133, 716, { pantallaCompleta: true })).toBe(Math.round((716 - RESERVA_PIE_FS) / 713 * 1000) / 1000)
  })

  test.each([[412, 915], [915, 412], [1280, 600]])('%i×%i → sin atributo y factor 1', (w, h) => {
    const e = escalaDe({ ancho: w, alto: h })
    expect(e.atributo).toBeNull()
    expect(e.f).toBe(1)
  })
})

describe('la clase', () => {
  test('celular: lado corto < 600, en las dos orientaciones', () => {
    expect(clasificar({ ancho: 599, alto: 1300 }).clase).toBe('celular')
    expect(clasificar({ ancho: 1300, alto: 599 }).clase).toBe('celular')
    expect(clasificar({ ancho: 360, alto: 640 }).atributo).toBeNull()
  })

  test('600 exacto ya no es celular', () => {
    expect(LADO_CELULAR).toBe(600)
    expect(clasificar({ ancho: 600, alto: 900 })).toEqual({ clase: 'vertical-ancha', atributo: 'tv' })
  })

  test('traje B (horizontal, alto ≤ 600) → ninguno, con 600 exacto incluido (R-2)', () => {
    expect(clasificar({ ancho: 900, alto: 600 })).toEqual({ clase: 'horizontal-b', atributo: null })
    expect(clasificar({ ancho: 1280, alto: 585 }).atributo).toBeNull()
    expect(clasificar({ ancho: 1000, alto: 601 })).toEqual({ clase: 'horizontal', atributo: 'h' })
  })

  test('toda ventana vertical de lado corto ≥ 600 es `tv`, tenga dedo o ratón', () => {
    for (const [w, h] of [[744, 1100], [768, 1024], [1080, 1920], [1024, 1366]]) {
      expect(clasificar({ ancho: w, alto: h }).atributo).toBe('tv')
    }
  })

  test('la orientación es la del CSS: el cuadrado es vertical', () => {
    expect(orientacionDe(800, 800)).toBe('vertical')
    expect(orientacionDe(801, 800)).toBe('horizontal')
    expect(clasificar({ ancho: 800, alto: 800 }).atributo).toBe('tv')
  })

  test('la orientación que llega manda sobre la deducida', () => {
    expect(clasificar({ ancho: 800, alto: 700, orientacion: 'vertical' }).atributo).toBe('tv')
  })
})

describe('los bordes de las referencias', () => {
  test('tv: piso 1, techo 1,6 y las dos referencias 572/812', () => {
    expect(f(600, 700)).toBe(1)                       // las dos razones < 1 → 1
    expect(f(572 * 1.2, 812 * 2)).toBe(1.2)           // manda el ancho
    expect(f(572 * 1.4, 812 * 1.25)).toBe(1.25)       // manda el alto
    expect(f(1600, 2600)).toBe(REF.tv.max)            // 1,6
    expect(REF.tv).toMatchObject({ ancho: 572, alto: 812, max: 1.6 })
  })

  test('h bajo 830: H/713 con piso 0,87 y techo 1', () => {
    expect(f(1366, 713)).toBe(1)
    expect(f(1366, 700)).toBe(Math.round(700 / 713 * 1000) / 1000)
    expect(f(1366, 620)).toBe(0.87)
    expect(f(1366, 601)).toBe(0.87)
    expect(f(1366, 829)).toBe(1)
  })

  test('h desde 830: crece con min(W/1126, H/830) hasta 1,3', () => {
    expect(f(1366, 830)).toBe(1)
    expect(f(1126 * 1.2, 830 * 1.5)).toBe(1.2)
    expect(f(1126 * 1.5, 830 * 1.1)).toBe(1.1)
    expect(f(1100, 900)).toBe(1)                      // estrecha: no baja de 1
    expect(f(3840, 2000)).toBe(REF.hAlta.max)
  })

  test('la reserva del pie solo cuenta en horizontal', () => {
    expect(altoEfectivo({ alto: 716, orientacion: 'horizontal', pantallaCompleta: true })).toBe(716 - RESERVA_PIE_FS)
    expect(altoEfectivo({ alto: 1100, orientacion: 'vertical', pantallaCompleta: true })).toBe(1100)
    expect(f(744, 1100, { pantallaCompleta: true })).toBe(f(744, 1100))
  })

  test('O1: el factor no depende de nada más que la ventana', () => {
    expect(factorDe({ ancho: 1366, alto: 623, mesa: 2 })).toBe(factorDe({ ancho: 1366, alto: 623, mesa: 5 }))
  })
})

describe('aPropios', () => {
  test('divide la caja UNA vez y rehace los bordes', () => {
    const r = aPropios({ left: 130, top: 260, width: 65, height: 13 }, 1.3)
    expect(r.left).toBeCloseTo(100)
    expect(r.top).toBeCloseTo(200)
    expect(r.width).toBeCloseTo(50)
    expect(r.height).toBeCloseTo(10)
    expect(r.x).toBe(r.left)
    expect(r.right).toBeCloseTo(150)
    expect(r.bottom).toBeCloseTo(210)
  })

  test('con f = 1 devuelve la misma caja (el celular no paga nada)', () => {
    const caja = { left: 1, top: 2, width: 3, height: 4 }
    expect(aPropios(caja, 1)).toBe(caja)
    expect(aPropios(null, 1.3)).toBeNull()
  })
})

// ── El hook, por su camino real con un DOM falso ────────────────────────────
function creaDOM({ ancho, alto, vertical = alto >= ancho, completa = false, raton = false }) {
  const oyentes = { win: {}, doc: {}, mq: {}, mqRaton: {} }
  const alta = (k) => (t, fn) => { (oyentes[k][t] ||= []).push(fn) }
  const baja = (k) => (t, fn) => { oyentes[k][t] = (oyentes[k][t] || []).filter((x) => x !== fn) }
  const atributos = new Map()
  const estilo = new Map()
  const html = {
    getAttribute: (k) => (atributos.has(k) ? atributos.get(k) : null),
    setAttribute: (k, v) => atributos.set(k, String(v)),
    hasAttribute: (k) => atributos.has(k),
    removeAttribute: (k) => atributos.delete(k),
    style: {
      getPropertyValue: (k) => estilo.get(k) ?? '',
      setProperty: (k, v) => estilo.set(k, v),
      removeProperty: (k) => estilo.delete(k),
    },
  }
  const mq = { get matches() { return estado.vertical }, addEventListener: alta('mq'), removeEventListener: baja('mq') }
  const mqRaton = { get matches() { return estado.raton }, addEventListener: alta('mqRaton'), removeEventListener: baja('mqRaton') }
  const estado = { vertical, raton }
  const document = { documentElement: html, fullscreenElement: completa ? html : null, addEventListener: alta('doc'), removeEventListener: baja('doc') }
  const win = {
    innerWidth: ancho, innerHeight: alto, document,
    matchMedia: (q) => (q === MEDIA_RATON ? mqRaton : q === '(orientation: portrait)' ? mq : null),
    addEventListener: alta('win'), removeEventListener: baja('win'),
  }
  const despacha = (k, t) => (oyentes[k][t] || []).slice().forEach((fn) => fn())
  const cuantos = () => Object.values(oyentes).reduce((n, o) => n + Object.values(o).reduce((m, l) => m + l.length, 0), 0)
  return { win, document, html, atributos, estilo, estado, despacha, cuantos }
}

describe('enganchaEscala (el hook useEscalaMesa)', () => {
  test('al montar escribe atributo y variable; al desmontar los BORRA y suelta los oyentes', () => {
    const d = creaDOM({ ancho: 744, alto: 1100 })
    const soltar = enganchaEscala(d.win)
    expect(d.atributos.get('data-escala')).toBe('tv')
    expect(d.estilo.get('--escala')).toBe('1.301')
    expect(escalaActual(d.document)).toBe(1.301)
    expect(d.cuantos()).toBe(5)
    soltar()
    expect(d.atributos.has('data-escala')).toBe(false)
    expect(d.estilo.has('--escala')).toBe(false)
    expect(escalaActual(d.document)).toBe(1)
    expect(d.cuantos()).toBe(0)
  })

  test('en el celular no escribe nada, ni al montar ni al girar', () => {
    const d = creaDOM({ ancho: 412, alto: 915 })
    const soltar = enganchaEscala(d.win)
    expect(d.atributos.size).toBe(0)
    expect(d.estilo.size).toBe(0)
    Object.assign(d.win, { innerWidth: 915, innerHeight: 412 }); d.estado.vertical = false
    d.despacha('mq', 'change')
    expect(d.atributos.size).toBe(0)
    soltar()
  })

  test('recalcula con el giro en caliente (744×1100 → 1100×744 → 744×1100)', () => {
    const d = creaDOM({ ancho: 744, alto: 1100 })
    const soltar = enganchaEscala(d.win)
    Object.assign(d.win, { innerWidth: 1100, innerHeight: 744 }); d.estado.vertical = false
    d.despacha('win', 'orientationchange')
    expect(d.atributos.get('data-escala')).toBe('h')
    expect(d.estilo.get('--escala')).toBe('1')
    Object.assign(d.win, { innerWidth: 744, innerHeight: 1100 }); d.estado.vertical = true
    d.despacha('win', 'resize')
    expect(d.atributos.get('data-escala')).toBe('tv')
    expect(d.estilo.get('--escala')).toBe('1.301')
    soltar()
  })

  test('la pantalla completa en horizontal cambia el factor (fullscreenchange)', () => {
    const d = creaDOM({ ancho: 1133, alto: 716 })
    const soltar = enganchaEscala(d.win)
    expect(d.estilo.get('--escala')).toBe('1')
    d.document.fullscreenElement = d.html
    d.despacha('doc', 'fullscreenchange')
    expect(d.estilo.get('--escala')).toBe(String(factorDe({ ancho: 1133, alto: 716, pantallaCompleta: true })))
    soltar()
  })

  test('aplicar y quitar son idempotentes', () => {
    const d = creaDOM({ ancho: 1366, alto: 623 })
    aplicarEscala(d.document, { atributo: 'h', f: 0.874 })
    aplicarEscala(d.document, { atributo: 'h', f: 0.874 })
    expect(d.atributos.get('data-escala')).toBe('h')
    quitarEscala(d.document)
    quitarEscala(d.document)
    expect(d.atributos.size + d.estilo.size).toBe(0)
  })
})

// ── TAB-2 2c · `hb`: el traje B con la doble llave (R-2 como B′) ───────────
describe('la clase hb', () => {
  test('horizontal, alto ≤ 600, ancho ≥ 1024 y ratón → hb con factor 1', () => {
    expect(ANCHO_HB).toBe(1024)
    expect(MEDIA_RATON).toBe('(hover: hover) and (pointer: fine)')
    for (const [w, h] of [[1280, 577], [1242, 566], [1093, 498], [1024, 600], [1920, 400]]) {
      expect(clasificar({ ancho: w, alto: h, raton: true })).toEqual({ clase: 'horizontal-b-raton', atributo: 'hb' })
      expect(escalaDe({ ancho: w, alto: h, raton: true })).toEqual({ clase: 'horizontal-b-raton', atributo: 'hb', f: 1 })
    }
  })

  test('cada llave sola no basta', () => {
    expect(clasificar({ ancho: 1280, alto: 577 }).atributo).toBeNull()                 // sin ratón
    expect(clasificar({ ancho: 1023, alto: 577, raton: true }).atributo).toBeNull()    // 1 px corto
    expect(clasificar({ ancho: 1280, alto: 601, raton: true })).toEqual({ clase: 'horizontal', atributo: 'h' })
    expect(clasificar({ ancho: 577, alto: 1280, raton: true }).atributo).toBeNull()    // vertical: celular
    expect(clasificar({ ancho: 1280, alto: 600, raton: false })).toEqual({ clase: 'horizontal-b', atributo: null })
  })

  test('la orientación que llega manda también aquí', () => {
    expect(clasificar({ ancho: 1100, alto: 500, orientacion: 'vertical', raton: true }).atributo).toBeNull()
  })

  // Los 16 casos de la frontera (lámina 2a §5.2). `raton` es lo que da la
  // emulación de Chromium: el dedo es `hover: none` y `pointer: coarse`.
  test.each([
    ['iPhone 16/17 Pro Max acostado', 956, 402, false, null],
    ['iPhone 15 Plus / Pro Max acostado', 932, 390, false, null],
    ['Galaxy S25 Ultra acostado', 891, 370, false, null],
    ['Galaxy S25 acostado', 915, 412, false, null],
    ['Xperia 1 acostado', 960, 411, false, null],
    ['Galaxy Z Flip 6 acostado', 1006, 411, false, null],
    ['Galaxy Z Fold 6 exterior acostado', 905, 369, false, null],
    ['TRAMPA 1030×420 táctil', 1030, 420, false, null],
    ['teléfono con ratón 1006×411', 1006, 411, true, null],
    ['Fold 6 interior acostado', 823, 707, false, 'h'],
    ['iPad en ventana 980×560', 980, 560, false, null],
    ['iPad en ventana 1133×500', 1133, 500, false, null],
    ['laptop 1280×577', 1280, 577, true, 'hb'],
    ['laptop 1242×566 (110 %)', 1242, 566, true, 'hb'],
    ['laptop 1093×498 (125 %)', 1093, 498, true, 'hb'],
    ['netbook 1024×600', 1024, 600, true, 'hb'],
  ])('%s (%i×%i, ratón %s) → %s', (_, w, h, raton, atributo) => {
    expect(clasificar({ ancho: w, alto: h, raton }).atributo).toBe(atributo)
  })

  test('ventanaDe lee la media del ratón', () => {
    const d = creaDOM({ ancho: 1280, alto: 577, raton: true })
    expect(ventanaDe(d.win)).toMatchObject({ ancho: 1280, alto: 577, orientacion: 'horizontal', raton: true })
  })

  test('el hook escribe hb y lo BORRA al desmontar', () => {
    const d = creaDOM({ ancho: 1280, alto: 577, raton: true })
    const soltar = enganchaEscala(d.win)
    expect(d.atributos.get('data-escala')).toBe('hb')
    expect(d.estilo.get('--escala')).toBe('1')
    soltar()
    expect(d.atributos.size + d.estilo.size).toBe(0)
    expect(d.cuantos()).toBe(0)
  })

  test('un ratón que se conecta o se desconecta recalcula la clase', () => {
    const d = creaDOM({ ancho: 1280, alto: 577 })
    const soltar = enganchaEscala(d.win)
    expect(d.atributos.size).toBe(0)                  // con el dedo: el traje B de siempre
    d.estado.raton = true
    d.despacha('mqRaton', 'change')
    expect(d.atributos.get('data-escala')).toBe('hb')
    d.estado.raton = false
    d.despacha('mqRaton', 'change')
    expect(d.atributos.size + d.estilo.size).toBe(0)
    soltar()
  })

  test('el teléfono con ratón no recibe nada, ni al conectarlo ni al girar', () => {
    const d = creaDOM({ ancho: 411, alto: 1006, raton: true })
    const soltar = enganchaEscala(d.win)
    Object.assign(d.win, { innerWidth: 1006, innerHeight: 411 }); d.estado.vertical = false
    d.despacha('mq', 'change')
    d.despacha('mqRaton', 'change')
    expect(d.atributos.size + d.estilo.size).toBe(0)
    soltar()
  })
})
