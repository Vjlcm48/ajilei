// ── ARN-3e · `!important` solo con permiso escrito (INV-03) ─────────────────
// Doctrina: el CSS del proyecto es aditivo y se gana por especificidad u orden,
// nunca con `!important` (Protegidos §1; cabeceras de rec/rev/luz/salas/
// menuMovil). Las únicas excepciones son las de LISTA_BLANCA, cada una con su
// archivo, su selector, su propiedad y el sitio donde está escrita.
//   · un `!important` que no esté en la lista → rojo;
//   · una entrada de la lista que ya no exista → rojo (la lista no envejece);
//   · `setProperty(…, 'important')` en JS cuenta igual.
// Los comentarios no cuentan: decir «sin `!important`» es la costumbre de la casa.
// Recorre también las dos hojas protegidas, leyendo sus bytes desde fuera.
import { describe, it, expect } from 'vitest'
import { archivos, codigo, lineaDe, sinComentarios } from './arnes/fuente.mjs'

const MOTIVO_SELECCIONADA = 'la carta seleccionada gana a todo estado de la carta (hover, luz, hojas de campaña) · '
  + 'Sistema_Diseno_v1.2.md:432-433 · luz.css:195 · el comentario encima de `.card-selected` en playingCard.css'

const LISTA_BLANCA = [
  { archivo: 'src/styles/playingCard.css', selector: '.card-selected', propiedad: 'transform', motivo: MOTIVO_SELECCIONADA },
  { archivo: 'src/styles/playingCard.css', selector: '.card-selected', propiedad: 'border-color', motivo: MOTIVO_SELECCIONADA },
  { archivo: 'src/styles/playingCard.css', selector: '.card-selected', propiedad: 'box-shadow', motivo: MOTIVO_SELECCIONADA },
]

function hallazgos() {
  const fuera = []
  const lista = [...archivos('src', (n) => /\.(css|jsx?|html)$/.test(n)), 'index.html']
  for (const archivo of lista) {
    const css = archivo.endsWith('.css')
    const t = codigo(archivo)
    for (const m of t.matchAll(/!\s*important\b|setProperty\([^)]*['"]important['"]\s*\)/g)) {
      const antes = t.slice(0, m.index)
      const abre = antes.lastIndexOf('{')
      const selector = css ? antes.slice(antes.lastIndexOf('}', abre) + 1, abre).trim() : '(js)'
      const decl = antes.slice(Math.max(antes.lastIndexOf(';'), abre) + 1)
      const propiedad = css ? decl.slice(0, decl.indexOf(':')).trim() : '(js)'
      fuera.push({ archivo, linea: lineaDe(t, m.index), selector, propiedad })
    }
  }
  return fuera
}

const casa = (h, b) => h.archivo === b.archivo && h.selector === b.selector && h.propiedad === b.propiedad

describe('ARN-3e · `!important` solo con permiso escrito', () => {
  const todos = hallazgos()

  it('ningún `!important` fuera de la lista blanca', () => {
    const intrusos = todos.filter((h) => !LISTA_BLANCA.some((b) => casa(h, b)))
    expect(intrusos, 'cada uno necesita justificación escrita y una entrada aquí, o se quita').toEqual([])
  })

  it('cada entrada de la lista blanca sigue existiendo, una sola vez', () => {
    for (const b of LISTA_BLANCA) {
      expect(todos.filter((h) => casa(h, b)).length, `${b.archivo} ${b.selector} { ${b.propiedad} }`).toBe(1)
    }
  })
})

describe('ARN-3e · el quitacomentarios de las pruebas de fuente', () => {
  it('un comentario no cuenta y conserva las líneas', () => {
    const t = sinComentarios('a { /* sin !important */ color: red }\n/* x\n!important */ b {}', true)
    expect(t).not.toMatch(/important/)
    expect(t.split('\n').length).toBe(3)
  })
  it('en JS, una URL no es un comentario; un `//` sí', () => {
    const t = sinComentarios("const u = 'https://x.y/z' // console.warn\nf()")
    expect(t).toContain('https://x.y/z')
    expect(t).not.toContain('console')
  })
})
