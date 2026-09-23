/**
 * APU-1 · Fase 1b-i — `src/engine/entrada.js`
 *
 * Normativo: `docs/AJILEI_APU-1_Reglas_v1.1.md` §2.2 (entrada, piso 10×, medio
 * 20× y techo 50×), §2.3 (pila de las IAS) y §5.3 (nivelado tras recarga).
 *
 * Ejecutar: npx vitest run scripts/testEntrada.test.js
 */
import { describe, it, expect } from 'vitest'
import { createInitialState } from '../src/engine/gameEngine.js'

import {
  pisoDe, techoDe, medioDe, entradaValida, pilaIA, nivelarIA, jugadoresVsIA,
} from '../src/engine/entrada.js'

describe('entrada.pisoDe / techoDe / medioDe (§2.2)', () => {
  it('reproduce la tabla sellada de las cuatro mesas', () => {
    // 1f-A4 · piso 10× y medio 20× (eran 5× y 15×). El techo no se movió.
    expect([pisoDe(50), techoDe(50)]).toEqual([500, 2500])
    expect([pisoDe(100), techoDe(100)]).toEqual([1000, 5000])
    expect([pisoDe(200), techoDe(200)]).toEqual([2000, 10000])
    expect([pisoDe(1000), techoDe(1000)]).toEqual([10000, 50000])
    expect(medioDe(100)).toBe(2000)
  })
})

describe('entrada.entradaValida (§2.2)', () => {
  it('acepta múltiplos enteros de la apuesta de mesa entre piso y techo', () => {
    expect(entradaValida(1000, 100)).toEqual({ ok: true, motivo: null })
    expect(entradaValida(2500, 100)).toEqual({ ok: true, motivo: null })
    expect(entradaValida(5000, 100)).toEqual({ ok: true, motivo: null })
  })

  it('rechaza lo que no es múltiplo entero y positivo de la apuesta', () => {
    expect(entradaValida(2550, 100).motivo).toBe('monto_invalido')
    expect(entradaValida(2500.5, 100).motivo).toBe('monto_invalido')
    expect(entradaValida(0, 100).motivo).toBe('monto_invalido')
    expect(entradaValida(-500, 100).motivo).toBe('monto_invalido')
  })

  it('rechaza por debajo del piso y por encima del techo, con motivo propio', () => {
    expect(entradaValida(400, 100).motivo).toBe('bajo_piso')
    expect(entradaValida(5100, 100).motivo).toBe('sobre_techo')
  })
})

// La fórmula de §2.3 pasó de `entrada + 1.000` a `round(entrada × 1,5)` al
// cerrar 1c-2 (decisión 3 de la orden del rector para 1c-2-iii). El ejemplo del
// normativo cambia con ella: mesa 100, entra 2.500 → IA 3.750.
describe('entrada.pilaIA (§2.3)', () => {
  it('sigue el ejemplo del normativo: mesa 100, entra 2.500 → cada IA 3.750', () => {
    expect(pilaIA(2500, 100)).toBe(3750)
  })

  it('el techo de la mesa topa la fórmula: entra 4.000 o más → todas a 5.000', () => {
    expect(pilaIA(4000, 100)).toBe(5000)   // 6.000 topado
    expect(pilaIA(5000, 100)).toBe(5000)   // 7.500 topado
  })

  // LO QUE EL FACTOR ARREGLA (D-27 del informe 1c-2). Con el margen fijo, la
  // ventaja de la IA cambiaba sola con la profundidad —×3,00 al piso, ×1,67 al
  // medio, ×1,00 al techo— y eso hacía imposibles V1 y V2 a la vez. Con el
  // factor la ventaja es ×1,5 a toda profundidad, salvo donde el techo topa.
  it('la ventaja de la IA es la misma a toda profundidad, salvo donde topa el techo', () => {
    expect(pilaIA(pisoDe(100), 100)).toBe(1500)    // 10× → ×1,50
    expect(pilaIA(medioDe(100), 100)).toBe(3000)   // 20× → ×1,50
    expect(pilaIA(techoDe(100), 100)).toBe(5000)   // 50× → ×1,00, el techo manda
  })

  it('el factor es proporcional: no depende de la apuesta de mesa, sino de la entrada', () => {
    expect(pilaIA(1000, 50)).toBe(1500)     // bajo el techo 2.500
    expect(pilaIA(1000, 1000)).toBe(1500)   // la misma pila en la mesa mayor
  })

  // Una pila es un entero de fichas: media ficha no existe. En las cuatro
  // apuestas de mesa reales la entrada es siempre par y el redondeo no llega a
  // usarse, pero la función es pública y no lo garantiza.
  it('redondea: la pila de una IA es siempre un entero de fichas', () => {
    expect(pilaIA(375, 1000)).toBe(563)     // 562,5 → 563
  })
})

describe('entrada.nivelarIA (§5.3)', () => {
  it('completa hacia arriba tras la recarga', () => {
    expect(nivelarIA(600, 2500, 100)).toBe(3750)
  })

  it('nunca baja: a la IA que ya va por encima no se le quita nada', () => {
    expect(nivelarIA(4800, 2500, 100)).toBe(4800)
    expect(nivelarIA(5000, 1000, 100)).toBe(5000)
  })
})

describe('entrada.jugadoresVsIA (§2.3)', () => {
  it('da la lista que la Fase 1e le pasará al motor: humano con su entrada, IAS con su pila', () => {
    const lista = jugadoresVsIA(2500, 4, 100)
    expect(lista).toHaveLength(4)
    expect(lista[0]).toEqual({ isHuman: true, chips: 2500, name: 'Tú' })
    expect(lista.slice(1)).toEqual([
      { isHuman: false, chips: 3750, name: 'IA 1' },
      { isHuman: false, chips: 3750, name: 'IA 2' },
      { isHuman: false, chips: 3750, name: 'IA 3' },
    ])
  })

  // ── APU-1 1e · §E-7 ────────────────────────────────────────
  // La forma NUMÉRICA de `createInitialState` bautiza al rival de la mesa de dos
  // como «IA», a secas, y a partir de tres como «IA 1», «IA 2»… La de LISTA cae
  // a `IA ${i}` para todo el que no traiga nombre, así que al estrenar la lista
  // en 1e el rival de la mesa de 2 pasó a llamarse «IA 1» en el óvalo, en la
  // crónica y en el resultado. Lo cazó `diagDSK msg` en su punto T2.
  //
  // Esta prueba es la que impide que vuelva: las dos formas tienen que bautizar
  // igual, porque el jugador no sabe cuál de las dos usó la pantalla.
  it('bautiza los asientos como la forma numérica del motor — en la mesa de 2 el rival es «IA»', () => {
    expect(jugadoresVsIA(2500, 2, 100).map((j) => j.name)).toEqual(['Tú', 'IA'])
    expect(jugadoresVsIA(2500, 3, 100).map((j) => j.name)).toEqual(['Tú', 'IA 1', 'IA 2'])
    expect(jugadoresVsIA(2500, 5, 100).map((j) => j.name)).toEqual(['Tú', 'IA 1', 'IA 2', 'IA 3', 'IA 4'])
  })

  // Y la prueba que de verdad manda: las dos formas, PASADAS POR EL MOTOR, dan
  // los mismos nombres. La de arriba fija la convención; ésta la confronta con
  // quien la inventa, así que sobrevive a que el motor cambie de criterio.
  it('las dos formas de `createInitialState` bautizan igual, en las cuatro mesas', () => {
    for (const n of [2, 3, 4, 5]) {
      const porNumero = createInitialState(100, n).players.map((p) => p.name)
      const porLista  = createInitialState(100, jugadoresVsIA(2500, n, 100)).players.map((p) => p.name)
      expect(porLista).toEqual(porNumero)
    }
  })

  it('quien entra al techo se sienta exactamente igual que las IAS', () => {
    const lista = jugadoresVsIA(5000, 2, 100)
    expect(lista[0].chips).toBe(lista[1].chips)
  })
})
