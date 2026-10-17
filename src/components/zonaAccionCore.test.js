import { describe, it, expect } from 'vitest'
import { cajaDeAccion, elegirForma, CAJA, PRIORIDAD_CAJA } from './zonaAccionCore'

// IOS-1 1e · la caja de la zona anclada (decisión 3 de Victor, 2026-10-16):
// error > cobrando > cargando > «Elige…» > no alcanza > resumen, nunca dos;
// `aviso` (la nota propia de Armar mesa y Salas) va justo antes del resumen.

const RESUMEN = { formas: ['Básico · 2 jugadores · 50 por mano · entras con 1.000', 'Básico · 2 jug. · 50/mano · entras con 1.000'] }
const TODO = {
  error: 'No pudimos abrir la mesa.',
  cobrando: 'Cobrando tu mesa…',
  cargando: 'Cargando tu saldo…',
  falta: 'Elige reto, jugadores, apuesta y entrada.',
  noAlcanza: 'No te alcanza.',
  aviso: 'Ya hay una mesa así: te unes a ella.',
  resumen: RESUMEN,
}

describe('cajaDeAccion · la prioridad', () => {
  it('la lista sellada es la de la decisión 3', () => {
    expect(PRIORIDAD_CAJA).toEqual(['error', 'cobrando', 'cargando', 'falta', 'noAlcanza', 'aviso', 'resumen'])
  })

  it('cada nivel gana a todos los de debajo', () => {
    const esperado = [
      [CAJA.ALERTA, TODO.error], [CAJA.NOTA, TODO.cobrando], [CAJA.NOTA, TODO.cargando],
      [CAJA.NOTA, TODO.falta], [CAJA.NOTA, TODO.noAlcanza], [CAJA.NOTA, TODO.aviso],
    ]
    PRIORIDAD_CAJA.slice(0, 6).forEach((clave, i) => {
      const estado = Object.fromEntries(PRIORIDAD_CAJA.slice(i).map((k) => [k, TODO[k]]))
      const caja = cajaDeAccion(estado)
      expect([caja.tipo, caja.texto], clave).toEqual(esperado[i])
    })
  })

  it('el resumen sólo sale sin ninguna nota, y con sus formas', () => {
    expect(cajaDeAccion({ resumen: RESUMEN })).toEqual({ tipo: CAJA.RESUMEN, formas: RESUMEN.formas })
    expect(cajaDeAccion({ resumen: RESUMEN, noAlcanza: 'x' }).tipo).toBe(CAJA.NOTA)
  })

  it('la cifra resaltada viaja con el resumen, si la hay', () => {
    expect(cajaDeAccion({ resumen: { ...RESUMEN, cifra: '1.000' } }).cifra).toBe('1.000')
  })

  it('nunca devuelve dos cosas a la vez', () => {
    const caja = cajaDeAccion(TODO)
    expect(caja.formas).toBeUndefined()
    expect(caja.texto).toBe(TODO.error)
  })

  it('sin nada que decir, nada; los textos vacíos no cuentan', () => {
    expect(cajaDeAccion()).toEqual({ tipo: CAJA.NADA })
    expect(cajaDeAccion({ falta: '', cargando: '   ', resumen: { formas: [''] } })).toEqual({ tipo: CAJA.NADA })
  })

  it('`callar` apaga notas y resumen, pero nunca el error', () => {
    expect(cajaDeAccion({ callar: true, falta: 'x', resumen: RESUMEN })).toEqual({ tipo: CAJA.NADA, callada: true })
    expect(cajaDeAccion({ callar: true, error: 'mal' })).toEqual({ tipo: CAJA.ALERTA, texto: 'mal' })
  })
})

describe('elegirForma · por medida, no por letras', () => {
  const cabeHasta = (n) => (t) => t.length <= n

  it('la larga si cabe', () => {
    expect(elegirForma(['larga larga', 'corta'], cabeHasta(20))).toEqual({ indice: 0, texto: 'larga larga', cortada: false })
  })

  it('la corta si la larga no cabe', () => {
    expect(elegirForma(['larga larga', 'corta'], cabeHasta(6))).toEqual({ indice: 1, texto: 'corta', cortada: false })
  })

  it('si ninguna cabe, la última, marcada para «…»', () => {
    expect(elegirForma(['larga larga', 'corta'], () => false)).toEqual({ indice: 1, texto: 'corta', cortada: true })
  })

  it('pregunta en orden y se para en la primera que cabe', () => {
    const preguntas = []
    elegirForma(['a', 'b', 'c'], (t) => { preguntas.push(t); return t === 'b' })
    expect(preguntas).toEqual(['a', 'b'])
  })

  it('sin formas, nada', () => {
    expect(elegirForma([], () => true)).toEqual({ indice: -1, texto: '', cortada: false })
  })
})
