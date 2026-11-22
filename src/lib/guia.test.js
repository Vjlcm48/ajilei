import { describe, it, expect } from 'vitest'
import { crearGuia, estadoVacio, normalizar, SENALES, CAPITULOS } from './guia'
import { limpiarAparato } from './limpiarAparato'

// ── TUT-1 tanda 1 · las marcas del tutorial (`ajilei.guia`) ─────────────────

function almacenFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial))
  return {
    datos,
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)) },
  }
}
const roto = { getItem() { throw new Error('bloqueado') }, setItem() { throw new Error('lleno') } }

describe('TUT-1 · guia', () => {
  it('un aparato nuevo no ha visto nada', () => {
    expect(crearGuia(() => almacenFalso()).leer()).toEqual({
      ofrecida: false,
      pendientePago: false,
      senales: { iniciar: false, apostar: false, descartar: false },
      vistos: [],
    })
    expect(SENALES).toEqual(['iniciar', 'apostar', 'descartar'])
    expect(CAPITULOS).toBe(10)
  })

  it('guarda UNA clave, ajilei.guia, con el objeto entero', () => {
    const a = almacenFalso()
    const g = crearGuia(() => a)
    g.marcarOfrecida()
    expect([...a.datos.keys()]).toEqual(['ajilei.guia'])
    expect(JSON.parse(a.datos.get('ajilei.guia'))).toEqual({ ...estadoVacio(), ofrecida: true })
  })

  it('cada marca se suma a las de antes', () => {
    const a = almacenFalso()
    const g = crearGuia(() => a)
    g.marcarOfrecida()
    g.marcarPendiente()
    g.marcarSenal('apostar')
    g.marcarVisto(5)
    g.marcarVisto(2)
    expect(g.leer()).toEqual({
      ofrecida: true,
      pendientePago: true,
      senales: { iniciar: false, apostar: true, descartar: false },
      vistos: [2, 5],
    })
    g.quitarPendiente()
    expect(g.leer().pendientePago).toBe(false)
  })

  it('T3 · la «hecha» de la tanda 2 no se lee: la marca de guiada hecha vive en el servidor', () => {
    const g = crearGuia(() => almacenFalso({ 'ajilei.guia': '{"ofrecida":true,"hecha":true}' }))
    expect(g.leer()).toEqual({ ...estadoVacio(), ofrecida: true })
    expect('hecha' in g.leer()).toBe(false)
  })

  it('un capítulo visto dos veces cuenta una; uno que no existe no entra', () => {
    const a = almacenFalso()
    const g = crearGuia(() => a)
    g.marcarVisto(3)
    g.marcarVisto(3)
    g.marcarVisto(0)
    g.marcarVisto(11)
    g.marcarVisto(2.5)
    g.marcarVisto('4')
    expect(g.leer().vistos).toEqual([3])
  })

  it('una señal que no es de las tres no entra', () => {
    const a = almacenFalso()
    const g = crearGuia(() => a)
    g.marcarSenal('subir')
    g.marcarSenal('iniciar')
    expect(g.leer().senales).toEqual({ ...estadoVacio().senales, iniciar: true })
  })

  it('lo que no tiene la forma se lee como «nada hecho»', () => {
    for (const crudo of ['no-es-json', '[]', 'null', '42', '"hecha"']) {
      expect(crearGuia(() => almacenFalso({ 'ajilei.guia': crudo })).leer(), crudo).toEqual(estadoVacio())
    }
    expect(normalizar({ ofrecida: 'si', pendientePago: 1, senales: { iniciar: 'true', descartar: true }, vistos: [10, 1, 1, 'x', 12] }))
      .toEqual({ ofrecida: false, pendientePago: false, senales: { iniciar: false, apostar: false, descartar: true }, vistos: [1, 10] })
  })

  it('un almacén que falla se lee vacío y marcar no lanza', () => {
    const g = crearGuia(() => roto)
    expect(g.leer()).toEqual(estadoVacio())
    expect(() => { g.marcarPendiente(); g.quitarPendiente(); g.marcarSenal('iniciar'); g.marcarVisto(1) }).not.toThrow()
    expect(crearGuia(() => null).leer()).toEqual(estadoVacio())
  })

  it('al eliminar la cuenta se va con las demás ajilei.* (limpiarAparato)', () => {
    const datos = new Map([['ajilei.guia', '{"hecha":true}'], ['otra.cosa', '1']])
    const local = {
      get length() { return datos.size },
      key: (i) => [...datos.keys()][i] ?? null,
      removeItem: (k) => { datos.delete(k) },
    }
    expect(limpiarAparato({ local: () => local, sesion: () => null })).toBe(1)
    expect([...datos.keys()]).toEqual(['otra.cosa'])
  })
})
