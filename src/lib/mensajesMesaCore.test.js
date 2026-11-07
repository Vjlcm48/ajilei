import { describe, expect, it } from 'vitest'
import { REACCIONES, REACCION_TOTAL_MS } from '../config/reacciones'
import {
  CLAVES_MENSAJE, FRENO_MENSAJE_MS, burbujasVivas, claveDeFrase, colocarAjena, corta, fraseDeClave,
  frenoRestante, rechazoDeMensaje,
} from './mensajesMesaCore'

// MES-PvP L-M 2 · los mensajes de la mesa entre personas (ficha LM-2 §2.1).
describe('L-M 2 · los mensajes de la mesa', () => {
  it('cada frase viaja como una clave única y vuelve a ser la misma frase', () => {
    expect(new Set(CLAVES_MENSAJE).size).toBe(REACCIONES.length)
    for (const frase of REACCIONES) expect(fraseDeClave(claveDeFrase(frase))).toBe(frase)
    expect(claveDeFrase('texto libre')).toBeNull()
    expect(fraseDeClave('nada')).toBeNull()
  })

  it('una burbuja viva por asiento, la última, mientras dura su ciclo', () => {
    const [a, b] = CLAVES_MENSAJE
    const lista = [
      { id: 1, asiento: 1, clave: a, hora: 0 },
      { id: 2, asiento: 1, clave: b, hora: 1000 },
      { id: 3, asiento: 2, clave: a, hora: 500 },
      { id: 4, asiento: 3, clave: 'falsa', hora: 500 },
    ]
    expect(burbujasVivas(lista, 1200).map((m) => m.id)).toEqual([2, 3])
    expect(burbujasVivas(lista, 500 + REACCION_TOTAL_MS).map((m) => m.id)).toEqual([2])
    expect(burbujasVivas(lista, 1000 + REACCION_TOTAL_MS)).toEqual([])
  })

  it('el freno es de 10 s por jugador, desde que se publica, y no limita a los demás', () => {
    const [a] = CLAVES_MENSAJE
    const lista = [{ id: 1, asiento: 0, clave: a, hora: 1000 }]
    expect(frenoRestante(lista, 0, 4000)).toBe(FRENO_MENSAJE_MS - 3000)
    expect(frenoRestante(lista, 0, 1000 + FRENO_MENSAJE_MS)).toBe(0)
    expect(frenoRestante(lista, 1, 4000)).toBe(0)
    expect(rechazoDeMensaje(lista, 0, a, 4000)).toBe('freno')
    expect(rechazoDeMensaje(lista, 1, a, 4000)).toBeNull()
    expect(rechazoDeMensaje(lista, 1, 'falsa', 4000)).toBe('clave_desconocida')
  })

  it('la ajena va bajo el nombre, dentro de su recuadro, y baja si pisa una ya puesta', () => {
    const area = { izq: 0, der: 400 }
    const recuadro = { left: 200, right: 390, top: 60, bottom: 200 }
    const nombre = { left: 210, right: 290, top: 75, bottom: 90 }
    const caja = { width: 170, height: 90 }
    const libre = colocarAjena({ nombre, recuadro, caja, area })
    expect(libre.top).toBe(100)
    expect(libre.left).toBeGreaterThanOrEqual(204)
    expect(libre.left + caja.width).toBeLessThanOrEqual(386)
    expect(libre.desplazada).toBe(false)
    const puesta = { left: 100, right: 350, top: 60, bottom: 140 }
    const movida = colocarAjena({ nombre, recuadro, caja, area, puestas: [puesta] })
    expect(movida.top).toBe(144)
    expect(movida.desplazada).toBe(true)
    expect(corta({ left: movida.left, right: movida.left + caja.width, top: movida.top, bottom: movida.top + caja.height }, puesta)).toBe(false)
  })
})
