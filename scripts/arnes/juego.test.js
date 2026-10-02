// ── ARN-3b · las decisiones puras del bucle de autojuego ─────────────────────
// Rector: AJILEI_ARN-3b_v1.0.md §0. Lo que aquí se sella es lo que el bucle
// DECIDE: qué pulsa el humano (D2), cuándo la mesa se redujo (D3), en qué estado
// queda una celda (D4), por qué una mano no cerró (D5) y cuándo hay un turno
// fantasma (D8). Los fotogramas imitan la lectura real de `autojuego.mjs`.
import { describe, it, expect } from 'vitest'
import {
  elegirAccion, violacionFantasma, nuevoJuego, vigilarFotograma, causaSinCerrar,
  estadoCelda, reintentar, separarReducida, resumenJuego, ESTADO, INTENTOS_COBERTURA,
} from './juego.mjs'
import { codigoDeSalida, veredictosDSK } from './nucleo.mjs'

describe('D2 · qué pulsa el humano', () => {
  it('conserva el orden de los bucles de línea base: Pasar, Igualar, Apostar', () => {
    expect(elegirAccion(['apostar', 'pasar'])).toBe('pasar')
    expect(elegirAccion(['retirarse', 'igualar', 'subir'])).toBe('igualar')
    expect(elegirAccion(['apostar'])).toBe('apostar')
  })
  it('cuando la pila no llega (All-in y Retirarse), se retira por defecto', () => {
    expect(elegirAccion(['allin', 'retirarse'])).toBe('retirarse')
  })
  it('con sinPila=allin empuja la mano al pago', () => {
    expect(elegirAccion(['allin', 'retirarse'], { sinPila: 'allin' })).toBe('allin')
  })
  it('si solo hay una de las dos, pulsa esa', () => {
    expect(elegirAccion(['allin'])).toBe('allin')
    expect(elegirAccion(['retirarse'], { sinPila: 'allin' })).toBe('retirarse')
  })
  it('sin fila no pulsa nada', () => {
    expect(elegirAccion([])).toBe(null)
    expect(elegirAccion(null)).toBe(null)
  })
  it('una preferencia desconocida es un error, no un silencio', () => {
    expect(() => elegirAccion(['allin'], { sinPila: 'pasar' })).toThrow(/sinPila/)
  })
})

describe('D8 · el turno fantasma', () => {
  it('ve a una IA «pensando» con su panel en «Se retiró»', () => {
    expect(violacionFantasma({ pensando: 'Bruno está pensando…', retirados: ['Bruno', 'Clara'] })).toBe('Bruno')
  })
  it('no confunde a otra IA retirada con la que piensa', () => {
    expect(violacionFantasma({ pensando: 'Bruno está pensando…', retirados: ['Clara'] })).toBe(null)
  })
  it('en la mesa de 2 la frase no lleva nombre: basta con que el rival esté retirado', () => {
    expect(violacionFantasma({ pensando: 'La IA está pensando…', retirados: ['Bruno'] })).toBe('Bruno')
    expect(violacionFantasma({ pensando: 'La IA está pensando…', retirados: [] })).toBe(null)
  })
  it('sin franja de «pensando» no hay fantasma', () => {
    expect(violacionFantasma({ pensando: null, retirados: ['Bruno'] })).toBe(null)
    expect(violacionFantasma({ pensando: 'Te retiraste — los rivales siguen jugando…', retirados: ['Bruno'] })).toBe(null)
  })
})

describe('D3 · la mesa reducida', () => {
  it('se marca desde el fotograma en que cambia el número de vivos, y se queda marcada', () => {
    const j = nuevoJuego()
    expect(vigilarFotograma(j, { vivos: 5, eliminando: 0 }, 'h0t0').reducida).toBe(false)
    expect(vigilarFotograma(j, { vivos: 5, eliminando: 0 }, 'h1t4').reducida).toBe(false)
    const ev = vigilarFotograma(j, { vivos: 3, eliminando: 2 }, 'h2t10')
    expect(ev).toMatchObject({ reducida: true, nuevaReduccion: true, ceremonia: true })
    expect(j.reducidaDesde).toBe('h2t10')
    expect(vigilarFotograma(j, { vivos: 3, eliminando: 0 }, 'h2t12')).toMatchObject({ reducida: true, nuevaReduccion: false })
  })
  it('cuenta cada ceremonia de encogimiento una vez', () => {
    const j = nuevoJuego()
    for (const e of [0, 1, 1, 1, 0, 0, 2, 0]) vigilarFotograma(j, { vivos: 5, eliminando: e }, 't')
    expect(j.ceremonias).toBe(2)
  })
  it('separa los fotogramas reducidos de los medidos, sin perder ninguno', () => {
    const f = [{ tag: 'a' }, { tag: 'b', mesaReducida: true }, { tag: 'c' }]
    const { medidos, reducidos } = separarReducida(f)
    expect(medidos.map((x) => x.tag)).toEqual(['a', 'c'])
    expect(reducidos.map((x) => x.tag)).toEqual(['b'])
  })
  it('el resumen lo dice: desde dónde, de cuántos a cuántos y cuántos fotogramas', () => {
    const j = nuevoJuego()
    vigilarFotograma(j, { vivos: 5 }, 'h0t0'); vigilarFotograma(j, { vivos: 3 }, 'h2t10'); j.framesReducida = 54
    expect(resumenJuego(j).mesaReducida).toEqual({ desde: 'h2t10', vivos: '5→3', frames: 54 })
    expect(resumenJuego(nuevoJuego()).mesaReducida).toBe(null)
  })
  it('el fantasma queda en el resumen, con su fotograma', () => {
    const j = nuevoJuego()
    vigilarFotograma(j, { vivos: 5, pensando: 'Bruno está pensando…', retirados: ['Bruno'] }, 'h1t8')
    expect(resumenJuego(j).turnoFantasma).toBe(1)
    expect(resumenJuego(j).fantasmas[0]).toMatchObject({ tag: 'h1t8', quien: 'Bruno' })
  })
})

describe('D5 · por qué no cerró', () => {
  const f = (o) => ({ tag: 't', presente: true, recarga: { tarjeta: false, burbuja: false, motivo: null }, botones: [], acciones: [], pensando: null, ...o })
  it('la mesa se fue', () => expect(causaSinCerrar([f({ presente: false })])).toBe('mesa-ausente'))
  it('la recarga quedó pendiente en los últimos fotogramas', () => {
    expect(causaSinCerrar([f({ recarga: { tarjeta: false, burbuja: true, motivo: 'automatica' } }), f()])).toBe('recarga-pendiente')
  })
  it('la fila de All-in/Retirarse sin contestar', () => {
    expect(causaSinCerrar([f({ acciones: ['allin', 'retirarse'] })])).toBe('sin-pila-sin-contestar')
  })
  it('el humano con fila normal', () => expect(causaSinCerrar([f({ acciones: ['pasar'] })])).toBe('humano-con-fila'))
  it('el descarte sin contestar', () => expect(causaSinCerrar([f({ botones: ['Sin descartar'] })])).toBe('descarte-sin-contestar'))
  it('el tope con una IA pensando', () => expect(causaSinCerrar([f({ pensando: 'Bruno está pensando…' })])).toBe('tope-con-ia-pensando'))
  it('nunca vacía', () => {
    expect(causaSinCerrar([])).toBe('sin-fotogramas')
    expect(causaSinCerrar([f()])).toBe('tope')
  })
})

describe('D4 · tres estados por celda', () => {
  it('medida, sin cobertura o error', () => {
    expect(estadoCelda({ cubierta: true })).toBe(ESTADO.MEDIDA)
    expect(estadoCelda({ cubierta: false })).toBe(ESTADO.SIN_COBERTURA)
    expect(estadoCelda({ error: 'boom', cubierta: true })).toBe(ESTADO.ERROR)
  })
  it('se reintenta hasta 3 veces, y solo si faltó el caso', () => {
    expect(INTENTOS_COBERTURA).toBe(3)
    expect(reintentar(ESTADO.SIN_COBERTURA, 1)).toBe(true)
    expect(reintentar(ESTADO.SIN_COBERTURA, 2)).toBe(true)
    expect(reintentar(ESTADO.SIN_COBERTURA, 3)).toBe(false)
    expect(reintentar(ESTADO.MEDIDA, 1)).toBe(false)
    expect(reintentar(ESTADO.ERROR, 1)).toBe(false)
  })
  it('una celda sin cobertura saca el modo con «cobertura» y código 1, no 0', () => {
    const r = { a1: [{ passed: true }, { passed: true, estado: 'sinCobertura' }] }
    expect(veredictosDSK(r)).toEqual([['a1', 'cobertura']])
    expect(codigoDeSalida(['cobertura'])).toBe(1)
    expect(codigoDeSalida(['verde', 'cobertura'])).toBe(1)
  })
  it('un rojo de puerta manda sobre la cobertura, y el error sobre los dos', () => {
    expect(veredictosDSK({ a1: [{ passed: false }, { passed: true, estado: 'sinCobertura' }] })).toEqual([['a1', 'rojo']])
    expect(veredictosDSK({ a1: [{ passed: true, estado: 'error' }, { passed: false }] })).toEqual([['a1', 'error']])
  })
  it('una celda sin cobertura con un rojo de geometría sigue siendo roja', () => {
    expect(veredictosDSK({ z1: [{ passed: false, estado: 'sinCobertura' }] })).toEqual([['z1', 'rojo']])
  })
  it('los modos con veredicto arriba declaran sus huecos en `sinCobertura`', () => {
    expect(veredictosDSK({ rec: { verde: true, sinCobertura: ['p7 forzosa-s25v'] } })).toEqual([['rec', 'cobertura']])
    expect(veredictosDSK({ rec: { verde: true, sinCobertura: [] } })).toEqual([['rec', 'verde']])
    expect(veredictosDSK({ rec: { verde: false, sinCobertura: ['p7'] } })).toEqual([['rec', 'rojo']])
  })
})
