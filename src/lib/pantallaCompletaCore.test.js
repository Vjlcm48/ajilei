// PAN-1 1c · el vigilante de INV-45 (la pantalla completa en los teléfonos).
//
// Recorre el núcleo con un `document` y un `window` falsos, sin jsdom (el molde
// de `useCongelado.test.js`). Lo que NO mide, y no puede medir ningún arnés: el
// salto de alto al entrar, el gesto de atrás de Android y el aviso de Chrome.
// Eso lo valida el S25 (V1–V10 de la ficha de la 1c).
import { describe, test, expect, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'
import {
  aplica, pedir, reentrar, creaPantallaCompleta, esSafariDeIPad,
  CONSULTA_TACTIL, CONSULTA_HORIZONTAL, SIN_PANTALLA_COMPLETA,
} from './pantallaCompletaCore'

// ── Dobles del DOM ──────────────────────────────────────────────────────────
// Un nodo con `closest` de verdad sobre una cadena de padres: `marcado` dice si
// ese nodo lleva `data-sin-pantalla-completa`.
function creaNodo({ marcado = false, padre = null } = {}) {
  return {
    marcado, padre,
    closest(sel) {
      if (sel !== SIN_PANTALLA_COMPLETA) throw new Error(`selector inesperado: ${sel}`)
      for (let n = this; n; n = n.padre) if (n.marcado) return n
      return null
    },
  }
}

// `consultas`: las media queries que dan `true`. Por omisión, un teléfono en el
// navegador (táctil y sin instalar). `callout`: el `CSS.supports` de WebKit de
// iOS/iPadOS para `-webkit-touch-callout` (IOS-1 1a).
function monta({ consultas = [CONSULTA_TACTIL], api = true, standalone, rechaza = false, callout = false } = {}) {
  const oyentes = {}
  const doc = {
    fullscreenElement: null,
    fullscreenEnabled: true,
    documentElement: {},
    exitFullscreen: vi.fn(() => Promise.resolve()),
    addEventListener(tipo, fn, captura) { (oyentes[tipo] ||= []).push({ fn, captura }) },
    removeEventListener(tipo, fn) { oyentes[tipo] = (oyentes[tipo] || []).filter(o => o.fn !== fn) },
    despacha(tipo, ev = { target: creaNodo() }) { (oyentes[tipo] || []).slice().forEach(o => o.fn(ev)) },
    oyentes,
  }
  const pide = vi.fn(() => {
    if (rechaza) return Promise.reject(new Error('sin activación'))
    doc.fullscreenElement = doc.documentElement
    return Promise.resolve()
  })
  if (api) doc.documentElement.requestFullscreen = pide
  const win = {
    document: doc,
    navigator: standalone === undefined ? {} : { standalone },
    matchMedia: (q) => ({ matches: consultas.includes(q) }),
    CSS: { supports: (p, v) => callout && p === '-webkit-touch-callout' && v === 'none' },
  }
  return {
    doc, win, pide,
    // Algo la saca (atrás, bloqueo, cambio de app): el navegador la quita.
    sale() { doc.fullscreenElement = null },
  }
}

describe('pantallaCompletaCore · INV-45 (PAN-1 1c, R1–R5)', () => {
  test('1 · `pedir` llama a requestFullscreen de forma SÍNCRONA', () => {
    const m = monta()
    let antesDeVolver = -1
    m.pide.mockImplementation(() => { antesDeVolver = m.pide.mock.calls.length; return Promise.resolve() })
    const pidio = pedir(m.doc, m.win)
    // Ya llamado al volver, sin esperar un tick ni un temporizador: fuera del
    // gesto el navegador no vería la activación.
    expect(m.pide).toHaveBeenCalledTimes(1)
    expect(antesDeVolver).toBe(1)
    expect(pidio).toBe(true)
    expect(m.pide).toHaveBeenCalledWith({ navigationUI: 'hide' })
  })

  test('2 · sin la API (Safari en iPhone, R7): no hace nada y no lanza', () => {
    const m = monta({ api: false })
    expect(aplica(m.win)).toBe(false)
    expect(() => pedir(m.doc, m.win)).not.toThrow()
    expect(pedir(m.doc, m.win)).toBe(false)
    // Y con la API presente pero deshabilitada (un iframe sin permiso).
    const d = monta()
    d.doc.fullscreenEnabled = false
    expect(pedir(d.doc, d.win)).toBe(false)
    expect(d.pide).not.toHaveBeenCalled()
  })

  test('3 · instalada (R5): no hace nada', () => {
    for (const m of [
      monta({ consultas: [CONSULTA_TACTIL, '(display-mode: standalone)'] }),
      monta({ consultas: [CONSULTA_TACTIL, '(display-mode: fullscreen)'] }),
      monta({ standalone: true }),
    ]) {
      expect(aplica(m.win)).toBe(false)
      expect(pedir(m.doc, m.win)).toBe(false)
      expect(m.pide).not.toHaveBeenCalled()
    }
  })

  test('4 · escritorio (R1): no hace nada, tampoco con pantalla táctil', () => {
    for (const consultas of [
      [],                                    // ratón: hover y pointer fine
      ['(pointer: coarse)'],                 // portátil táctil: su entrada principal tiene hover
      ['(hover: none)'],                     // sin hover pero con pointer fine
    ]) {
      const m = monta({ consultas })
      expect(aplica(m.win)).toBe(false)
      expect(pedir(m.doc, m.win)).toBe(false)
      expect(m.pide).not.toHaveBeenCalled()
    }
  })

  test('5 · ya en pantalla completa: no la pide otra vez', () => {
    const m = monta()
    pedir(m.doc, m.win)
    expect(m.doc.fullscreenElement).not.toBe(null)
    expect(pedir(m.doc, m.win)).toBe(false)
    expect(m.pide).toHaveBeenCalledTimes(1)
  })

  test('6 · la promesa rechazada se traga, sin unhandledrejection', async () => {
    const vistos = []
    const oye = (e) => vistos.push(e)
    process.on('unhandledRejection', oye)
    try {
      const m = monta({ rechaza: true })
      expect(pedir(m.doc, m.win)).toBe(true)
      // Y si la API lanza en vez de rechazar, tampoco sale.
      const l = monta()
      l.pide.mockImplementation(() => { throw new Error('TypeError de un navegador viejo') })
      expect(() => pedir(l.doc, l.win)).not.toThrow()
      await new Promise(r => setTimeout(r, 20))
      expect(vistos).toEqual([])
    } finally {
      process.off('unhandledRejection', oye)
    }
  })

  test('7 · nunca se llama a la salida (R3), ni aquí ni en ningún archivo de src', () => {
    const m = monta()
    const pc = creaPantallaCompleta(m.doc, m.win)
    pc.engancha()
    m.doc.despacha('pointerup')
    pc.fijaDentroMesa(true)
    pc.reentrar()
    m.sale()
    m.doc.despacha('pointerup')
    pc.fijaDentroMesa(false)
    m.doc.despacha('pointerup')
    expect(m.doc.exitFullscreen).not.toHaveBeenCalled()

    // Y en el código: ninguna llamada de salida en src (las pruebas aparte).
    const raiz = join(process.cwd(), 'src')
    const fuentes = []
    const recorre = (d) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n)
        if (statSync(p).isDirectory()) recorre(p)
        else if (/\.(jsx?|mjs)$/.test(n) && !/\.test\./.test(n)) fuentes.push(p)
      }
    }
    recorre(raiz)
    expect(fuentes.length).toBeGreaterThan(50)
    const conSalida = fuentes.filter(p => /exitFullscreen|webkitExitFullscreen/.test(readFileSync(p, 'utf8')))
      .map(p => relative(process.cwd(), p))
    expect(conSalida).toEqual([])
  })

  test('8 · tras salir, FUERA de la mesa: el siguiente gesto reentra', () => {
    const m = monta()
    const pc = creaPantallaCompleta(m.doc, m.win)
    const suelta = pc.engancha()
    // En captura (R2: antes de que el clic cambie de pantalla).
    expect(m.doc.oyentes.pointerup).toEqual([{ fn: pc.alGesto, captura: true }])
    m.doc.despacha('pointerup')
    expect(m.pide).toHaveBeenCalledTimes(1)
    m.doc.despacha('pointerup')               // ya dentro: no pide otra vez
    expect(m.pide).toHaveBeenCalledTimes(1)
    m.sale()
    m.doc.despacha('pointerup')
    expect(m.pide).toHaveBeenCalledTimes(2)
    suelta()
    expect(m.doc.oyentes.pointerup).toEqual([])
  })

  test('9 · tras salir, DENTRO de la mesa: un gesto no reentra; la reentrada explícita sí', () => {
    const m = monta()
    const pc = creaPantallaCompleta(m.doc, m.win)
    pc.engancha()
    m.doc.despacha('pointerup')              // primer toque, fuera de la mesa
    pc.fijaDentroMesa(true)
    expect(pc.estaDentroMesa()).toBe(true)
    m.sale()                                 // el atrás en mitad de una mano
    m.doc.despacha('pointerup')
    m.doc.despacha('pointerup')
    expect(m.pide).toHaveBeenCalledTimes(1)
    pc.reentrar()                            // «Siguiente mano»
    expect(m.pide).toHaveBeenCalledTimes(2)
    // La de GameTable, sin el controlador, hace lo mismo.
    m.sale()
    expect(reentrar(m.doc, m.win)).toBe(true)
    expect(m.pide).toHaveBeenCalledTimes(3)
    // Y al dejar la mesa (R3: sigue en pantalla completa), fuera vuelve a valer
    // cualquier gesto.
    pc.fijaDentroMesa(false)
    m.sale()
    m.doc.despacha('pointerup')
    expect(m.pide).toHaveBeenCalledTimes(4)
  })

  test('10 · un toque dentro de [data-sin-pantalla-completa] no pide; el siguiente toque normal sí', () => {
    // Compartir, copiar o abrir otra app necesitan la activación del gesto, y
    // pedir la pantalla completa la gasta (§9 del informe de la 1c).
    const m = monta()
    const pc = creaPantallaCompleta(m.doc, m.win)
    pc.engancha()
    const boton = creaNodo({ marcado: true })
    m.doc.despacha('pointerup', { target: boton })
    // El icono de dentro del botón: la exclusión sube por los padres.
    m.doc.despacha('pointerup', { target: creaNodo({ padre: creaNodo({ padre: boton }) }) })
    expect(m.pide).not.toHaveBeenCalled()
    m.doc.despacha('pointerup', { target: creaNodo() })
    expect(m.pide).toHaveBeenCalledTimes(1)
    // Y sin `target` (o un nodo sin `closest`), el gesto pide como siempre.
    m.sale()
    pc.alGesto({})
    m.sale()
    pc.alGesto(undefined)
    expect(m.pide).toHaveBeenCalledTimes(3)
  })
})

// IOS-1 1a (P1, opción C+B): en Safari del iPad, nunca fuera de la mesa y,
// dentro, solo en horizontal. El resto, como en PAN-1. Lo que esto NO prueba: que
// el iPad de verdad dé esas señales (el WebKit de Playwright en Windows no las
// da); eso lo valida Victor en el aparato.
describe('pantallaCompletaCore · Safari del iPad (IOS-1 1a)', () => {
  const IPAD_VERTICAL = { consultas: [CONSULTA_TACTIL], callout: true }
  const IPAD_HORIZONTAL = { consultas: [CONSULTA_TACTIL, CONSULTA_HORIZONTAL], callout: true }

  // El recorrido entero: toques fuera, entrar en la mesa, «Iniciar mano».
  function recorre(opciones) {
    const m = monta(opciones)
    const pc = creaPantallaCompleta(m.doc, m.win)
    pc.engancha()
    m.doc.despacha('pointerup')
    m.doc.despacha('pointerup')
    const fuera = m.pide.mock.calls.length
    pc.fijaDentroMesa(true)
    m.sale()
    const pidio = pc.reentrar()
    return { m, pc, fuera, pidio }
  }

  test('11 · Safari del iPad, fuera de la mesa: ningún toque pide (ni en horizontal)', () => {
    for (const o of [IPAD_VERTICAL, IPAD_HORIZONTAL]) {
      const m = monta(o)
      expect(esSafariDeIPad(m.win)).toBe(true)
      const pc = creaPantallaCompleta(m.doc, m.win)
      pc.engancha()
      for (let i = 0; i < 5; i++) m.doc.despacha('pointerup')
      expect(m.pide).not.toHaveBeenCalled()
    }
  })

  test('12 · Safari del iPad, mesa en vertical: «Iniciar mano» y «Siguiente mano» no piden', () => {
    const { m, fuera, pidio } = recorre(IPAD_VERTICAL)
    expect(fuera).toBe(0)
    expect(pidio).toBe(false)
    expect(reentrar(m.doc, m.win)).toBe(false)
    expect(m.pide).not.toHaveBeenCalled()
  })

  test('13 · Safari del iPad, mesa en horizontal: «Iniciar mano» pide, y solo dentro de la mesa', () => {
    const { m, pc, fuera, pidio } = recorre(IPAD_HORIZONTAL)
    expect(fuera).toBe(0)
    expect(pidio).toBe(true)
    expect(m.pide).toHaveBeenCalledTimes(1)
    expect(m.pide).toHaveBeenCalledWith({ navigationUI: 'hide' })
    // La de GameTable, sin el controlador, igual.
    m.sale()
    expect(reentrar(m.doc, m.win)).toBe(true)
    // Al dejar la mesa (R3: no se sale), los toques de fuera siguen sin pedir.
    pc.fijaDentroMesa(false)
    m.sale()
    m.doc.despacha('pointerup')
    expect(m.pide).toHaveBeenCalledTimes(2)
    expect(m.doc.exitFullscreen).not.toHaveBeenCalled()
  })

  test('14 · tableta Android (sin la capacidad de iOS), fuera de la mesa: pide como hoy', () => {
    for (const consultas of [[CONSULTA_TACTIL], [CONSULTA_TACTIL, CONSULTA_HORIZONTAL]]) {
      const { m, fuera, pidio } = recorre({ consultas })
      expect(esSafariDeIPad(m.win)).toBe(false)
      expect(fuera).toBe(1)
      expect(pidio).toBe(true)
    }
  })

  test('15 · teléfono Android: sin cambio, fuera y dentro, en las dos orientaciones', () => {
    for (const consultas of [[CONSULTA_TACTIL], [CONSULTA_TACTIL, CONSULTA_HORIZONTAL]]) {
      const m = monta({ consultas })
      const pc = creaPantallaCompleta(m.doc, m.win)
      pc.engancha()
      m.doc.despacha('pointerup')
      expect(m.pide).toHaveBeenCalledTimes(1)
      pc.fijaDentroMesa(true)
      m.sale()
      m.doc.despacha('pointerup')               // dentro, un gesto no reentra (R4)
      expect(m.pide).toHaveBeenCalledTimes(1)
      expect(pc.reentrar()).toBe(true)
      expect(m.pide).toHaveBeenCalledTimes(2)
    }
  })

  test('16 · iPhone (sin la API): no pide en ningún caso', () => {
    for (const consultas of [[CONSULTA_TACTIL], [CONSULTA_TACTIL, CONSULTA_HORIZONTAL]]) {
      const { m, fuera, pidio } = recorre({ consultas, api: false, callout: true })
      expect(esSafariDeIPad(m.win)).toBe(false)
      expect(fuera).toBe(0)
      expect(pidio).toBe(false)
    }
  })

  test('17 · la app instalada en el iPad: no pide en ningún caso', () => {
    for (const o of [
      { ...IPAD_HORIZONTAL, standalone: true },
      { ...IPAD_HORIZONTAL, consultas: [...IPAD_HORIZONTAL.consultas, '(display-mode: standalone)'] },
    ]) {
      const { m, fuera, pidio } = recorre(o)
      expect(fuera).toBe(0)
      expect(pidio).toBe(false)
      expect(m.pide).not.toHaveBeenCalled()
    }
  })

  test('18 · Mac con ratón (con la capacidad de iOS): no pide, ni fuera ni en la mesa', () => {
    for (const consultas of [[], [CONSULTA_HORIZONTAL]]) {
      const { m, fuera, pidio } = recorre({ consultas, callout: true })
      expect(esSafariDeIPad(m.win)).toBe(false)
      expect(fuera).toBe(0)
      expect(pidio).toBe(false)
    }
  })

  test('19 · iPad con teclado y panel táctil (entrada principal fina): no pide, como un computador', () => {
    const { m, fuera, pidio } = recorre({ consultas: ['(pointer: coarse)', CONSULTA_HORIZONTAL], callout: true })
    expect(esSafariDeIPad(m.win)).toBe(false)
    expect(fuera).toBe(0)
    expect(pidio).toBe(false)
  })
})
