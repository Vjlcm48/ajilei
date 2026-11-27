// PAN-2 · el vigilante de `viewport-fit=cover` solo en la app instalada (nota
// bajo INV-45). `document` y `window` falsos, sin jsdom (el molde de
// `pantallaCompletaCore.test.js`). Lo que NO mide: que Chrome suelte el margen
// del recorte de la cámara. Eso lo valida el S25 (T1–T7 de la ficha PAN-2 T1).
import { describe, test, expect } from 'vitest'
import { aplicarCover, debeCubrir, CONSULTA_INSTALADA, COVER } from './viewportCover'

const VIEWPORT = 'width=device-width, initial-scale=1.0'

// Una meta del viewport con `getAttribute`/`setAttribute` de verdad.
function monta({ consultas = [], meta = true, content = VIEWPORT, matchMedia = true } = {}) {
  const nodo = meta ? {
    attrs: { name: 'viewport', content },
    getAttribute(n) { return this.attrs[n] ?? null },
    setAttribute(n, v) { this.attrs[n] = String(v) },
  } : null
  const doc = {
    querySelector(sel) {
      if (sel !== 'meta[name="viewport"]') throw new Error(`selector inesperado: ${sel}`)
      return nodo
    },
  }
  const win = { document: doc }
  if (matchMedia) win.matchMedia = (q) => ({ matches: consultas.includes(q) })
  return { doc, win, nodo }
}

const cuentaFit = (s) => (s.match(/viewport-fit/g) || []).length

describe('viewportCover · PAN-2 (cover solo instalada en Android)', () => {
  test('1 · instalada (display-mode: fullscreen): añade cover una vez', () => {
    const { doc, win, nodo } = monta({ consultas: [CONSULTA_INSTALADA] })
    expect(debeCubrir(win)).toBe(true)
    expect(aplicarCover(doc, win)).toBe(true)
    expect(nodo.getAttribute('content')).toBe(`${VIEWPORT}, ${COVER}`)
  })

  test('2 · llamada dos veces: sigue habiendo un solo viewport-fit', () => {
    const { doc, win, nodo } = monta({ consultas: [CONSULTA_INSTALADA] })
    aplicarCover(doc, win)
    expect(aplicarCover(doc, win)).toBe(false)
    expect(cuentaFit(nodo.getAttribute('content'))).toBe(1)
  })

  test('3 · standalone (iOS instalado), pestaña o nada: no toca la meta', () => {
    for (const consultas of [['(display-mode: standalone)'], ['(display-mode: browser)'], []]) {
      const { doc, win, nodo } = monta({ consultas })
      expect(debeCubrir(win)).toBe(false)
      expect(aplicarCover(doc, win)).toBe(false)
      expect(nodo.getAttribute('content')).toBe(VIEWPORT)
    }
  })

  test('4 · sin matchMedia, sin meta o con un DOM que lanza: no lanza y devuelve falso', () => {
    const sinMM = monta({ consultas: [CONSULTA_INSTALADA], matchMedia: false })
    expect(aplicarCover(sinMM.doc, sinMM.win)).toBe(false)
    expect(sinMM.nodo.getAttribute('content')).toBe(VIEWPORT)

    const sinMeta = monta({ consultas: [CONSULTA_INSTALADA], meta: false })
    expect(aplicarCover(sinMeta.doc, sinMeta.win)).toBe(false)

    const roto = { querySelector() { throw new Error('roto') } }
    const winRoto = { matchMedia() { throw new Error('roto') } }
    expect(() => aplicarCover(roto, winRoto)).not.toThrow()
    expect(aplicarCover(roto, winRoto)).toBe(false)
    expect(aplicarCover(roto, { matchMedia: () => ({ matches: true }) })).toBe(false)
    expect(aplicarCover(undefined, undefined)).toBe(false)
  })

  test('5 · si la meta ya declara viewport-fit (otro valor), no lo pisa', () => {
    const { doc, win, nodo } = monta({ consultas: [CONSULTA_INSTALADA], content: `${VIEWPORT}, viewport-fit=auto` })
    expect(aplicarCover(doc, win)).toBe(false)
    expect(nodo.getAttribute('content')).toBe(`${VIEWPORT}, viewport-fit=auto`)
  })

  test('6 · main.jsx lo llama antes de montar React', async () => {
    const { readFileSync } = await import('node:fs')
    const main = readFileSync(new URL('../main.jsx', import.meta.url), 'utf8')
    const llamada = main.indexOf('aplicarCover(document, window)')
    expect(llamada).toBeGreaterThan(-1)
    expect(llamada).toBeLessThan(main.indexOf('createRoot('))
  })
})
