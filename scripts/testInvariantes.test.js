// ── ARN-3e · el registro de invariantes se deja leer y no apunta al vacío ───
// El registro (`docs/AJILEI_Invariantes_v1.0.md`) apunta y no copia: cada fila
// dice dónde está escrita su regla y quién la vigila. Esta prueba lee sus dos
// tablas DESDE EL MARKDOWN (sin JSON gemelo, como `testProtegidos` lee
// Protegidos) y comprueba que lo que nombran sigue existiendo:
//   · un archivo de prueba o una ruta del repo citados → existen;
//   · un modo de arnés (`diagDSK o1`, `diagPUE 1.8`…) → está en la lista de
//     modos de su arnés;
//   · un documento `AJILEI_*.md` → está en `docs/` o en `docs/reportes/`;
//   · los ids no se repiten, y una fila «vigilada» tiene vigilante;
//   · una tabla que no se deja leer (0 filas) es roja, no verde.
// Lo que va entre comillas de código en «Fuente» y «Vigilante» se comprueba;
// una forma que no se reconoce también es roja (registro §1).
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { RAIZ } from './arnes/fuente.mjs'
import { MODOS_DSK } from './arnes/nucleo.mjs'

const DOC = 'docs/AJILEI_Invariantes_v1.0.md'
const doc = readFileSync(join(RAIZ, DOC), 'utf8').replace(/\r\n/g, '\n')
const texto = (rel) => readFileSync(join(RAIZ, rel), 'utf8')

// Los modos de cada arnés, leídos de donde cada uno los decide. `diagDSK` los
// exporta desde su núcleo puro; los otros tres los escriben en su guarda de
// «modo desconocido», que es lo que de verdad los acepta o los rechaza.
const MODOS = {
  diagDSK: [...MODOS_DSK],
  diagPUE: [...(texto('scripts/diagPUE.mjs').match(/const MODOS_PUE = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]),
  diagCEL0: [...texto('scripts/diagCEL0.mjs').matchAll(/MODO !== '([^']+)'/g)].map((m) => m[1]),
  diagSAL: [...texto('scripts/diagSAL.mjs').matchAll(/MODE !== '([^']+)'/g)].map((m) => m[1]),
}

// Las filas de la tabla cuya cabecera es exactamente `cabecera`, hasta la
// primera línea que no es de tabla. Sin cabecera, ninguna fila.
function tabla(cabecera) {
  const lineas = doc.split('\n')
  const i = lineas.indexOf(cabecera)
  if (i < 0) return []
  const n = cabecera.split('|').length
  const filas = []
  for (const l of lineas.slice(i + 2)) {
    if (!l.startsWith('|')) break
    const celdas = l.split('|').slice(1, -1).map((c) => c.trim())
    filas.push({ linea: l, celdas, completa: l.split('|').length === n })
  }
  return filas
}

const CAB_INV = '| id | Regla | Fuente | Vigilante | Etiqueta |'
const CAB_DOCS = '| Documento | Qué rige | Vigilado por |'
const invariantes = tabla(CAB_INV)
const documentos = tabla(CAB_DOCS)

const sinLinea = (t) => t.replace(/:\d[\d-]*$/, '')
const existe = (rel) => existsSync(join(RAIZ, rel))

/**
 * Qué es un token entre comillas de código y si lo que nombra existe.
 * Devuelve `{ tipo, ok, motivo }`; `tipo` es 'modo', 'prueba', 'documento',
 * 'ruta' o 'desconocido'.
 */
function comprobar(token) {
  const modo = token.match(/^(diagDSK|diagPUE|diagCEL0|diagSAL) (\S+)$/)
  if (modo) {
    const [, arnes, m] = modo
    return { tipo: 'modo', ok: MODOS[arnes].includes(m), motivo: `${arnes} no tiene el modo «${m}»` }
  }
  const doc = sinLinea(token)
  if (/^AJILEI_[^/\s]+\.md$/.test(doc)) {
    return { tipo: 'documento', ok: existe(`docs/${doc}`) || existe(`docs/reportes/${doc}`), motivo: `${doc} no está en docs/ ni en docs/reportes/` }
  }
  if (/^[^\s]+$/.test(doc) && (doc.includes('/') || /^\.[a-z]+$/.test(doc))) {
    const tipo = /\.test\.jsx?$/.test(doc) ? 'prueba' : 'ruta'
    return { tipo, ok: existe(doc), motivo: `${doc} no existe` }
  }
  return { tipo: 'desconocido', ok: false, motivo: `«${token}» no es ni modo, ni prueba, ni ruta, ni documento: va sin comillas de código` }
}

const tokens = (celda) => [...celda.matchAll(/`([^`]+)`/g)].map((m) => m[1])
const rotos = (celda) => tokens(celda).map(comprobar).filter((r) => !r.ok).map((r) => r.motivo)
const vigilantes = (celda) => tokens(celda).map(comprobar).filter((r) => r.tipo !== 'documento')

describe('ARN-3e · el registro se deja leer', () => {
  it('cada arnés publica su lista de modos', () => {
    for (const [arnes, lista] of Object.entries(MODOS)) expect(lista.length, `${arnes}: 0 modos leídos`).toBeGreaterThan(0)
    expect(MODOS.diagDSK).toContain('humo')
    expect(MODOS.diagPUE).toContain('voz2')
  })

  it('la tabla de §2 tiene filas, todas con sus cinco columnas', () => {
    expect(invariantes.length, `${DOC}: no hay filas bajo «${CAB_INV}»`).toBeGreaterThan(0)
    expect(invariantes.filter((f) => !f.completa).map((f) => f.linea)).toEqual([])
  })

  it('los ids son INV-nn y no se repiten', () => {
    const ids = invariantes.map((f) => f.celdas[0])
    expect(ids.filter((id) => !/^INV-\d{2}$/.test(id))).toEqual([])
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('la tabla de §4 tiene filas, todas con sus tres columnas', () => {
    expect(documentos.length, `${DOC}: no hay filas bajo «${CAB_DOCS}»`).toBeGreaterThan(0)
    expect(documentos.filter((f) => !f.completa).map((f) => f.linea)).toEqual([])
  })
})

describe('ARN-3e · cada invariante apunta a algo que existe', () => {
  for (const { celdas: [id, , fuente, vigilante, etiqueta] } of invariantes) {
    it(id, () => {
      expect(tokens(fuente).length, `${id}: la fuente no cita ningún documento ni ruta`).toBeGreaterThan(0)
      expect(rotos(fuente), `${id} · fuente`).toEqual([])
      expect(rotos(vigilante), `${id} · vigilante`).toEqual([])
      const hay = vigilantes(vigilante).length > 0
      if (/^vigilado/.test(etiqueta)) expect(hay, `${id}: «${etiqueta}» sin ningún vigilante citado`).toBe(true)
      if (!hay) expect(vigilante, `${id}: sin vigilante citado, tiene que decir «nadie»`).toMatch(/\bnadie\b/)
    })
  }
})

describe('ARN-3e · cada documento normativo tiene vigilantes que existen', () => {
  for (const { celdas: [documento, , vigilado] } of documentos) {
    const nombre = tokens(documento)[0] ?? documento
    it(nombre, () => {
      expect(existe(`docs/${nombre}`), `${nombre} no está en docs/`).toBe(true)
      expect(vigilantes(vigilado).length, `${nombre}: ningún vigilante citado`).toBeGreaterThan(0)
      expect(rotos(vigilado), `${nombre} · vigilado por`).toEqual([])
    })
  }
})
