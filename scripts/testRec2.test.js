// ── REC-2 · Recarga con saldo insuficiente: la regla híbrida ────────────────
// Ficha: AJILEI_REC-2_v1.0.md §2 y §4.3 · Addendum 1 (D-3…D-7). Normativo:
// `docs/AJILEI_APU-1_Reglas_v1.3.md` §5.1 y §5.2.
//
// Fase 0: con el saldo entre UNA apuesta y el piso de DIEZ, `pideRecarga`
// preguntaba y la fila tenía los tres montos apagados; la pantalla rellenaba
// el hueco con un `?? 0` y pintaba «Recargar 0». La tarjeta entera sale ahora
// de `tarjetaRecarga` (pura), y esto es lo que la sella. Lo que queda dentro
// del JSX lo mide el modo `apu` del arnés (estados `rec2-caso2` y
// `rec2-caso3`): este proyecto no tiene jsdom.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PHASES, createInitialState, aplicarRecarga } from '../src/engine/gameEngine.js'
import {
  pideRecarga, RECARGA, tarjetaRecarga, armarTarjeta, CASOS_RECARGA,
  saldoUsable, hayRecarga, recargaValida, nivelarLasIAS, ASIENTO_HUMANO,
} from '../src/hooks/mesaCore.js'
import { techoDe, pisoDe, pilaIA } from '../src/engine/entrada.js'

const { FILA, TODO, SIN_SALDO } = CASOS_RECARGA

function mesa(unit, chips, phase = PHASES.PAYOUT) {
  const st = createInitialState(unit, chips.map((c, i) => ({
    isHuman: i === 0, chips: c, name: i === 0 ? 'Tú' : `IA ${i}`,
  })))
  return { ...st, phase }
}

// Las tres formas, por la pila: forzosa no cubre el ante, automática bajo el
// listón de 5×, voluntaria por encima.
const FORMAS = {
  forzosa:    () => 0,
  automatica: (u) => 3 * u,
  voluntaria: (u) => 20 * u,
}

// Lo que la tarjeta ofrece, como lo lee la pantalla: los montos que se pintan
// y el primario.
function ofrecido(t) {
  return {
    pintados: t.opciones.map((o) => o.monto),
    encendidos: t.opciones.filter((o) => !o.disabled).map((o) => o.monto),
    primario: t.monto,
  }
}

describe('REC-2 · la matriz de la ficha (§4.3), mesas 50 y 100, tres formas', () => {
  for (const unit of [50, 100]) {
    const M = pisoDe(unit)
    const SALDOS = { 'S ≥ M': 50 * unit, 'S = M': M, 'S = M − 1': M - 1, 'S = 1': 1, 'S = 0': 0 }
    for (const [forma, pilaDe] of Object.entries(FORMAS)) {
      const P = pilaDe(unit)
      for (const [nombre, S] of Object.entries(SALDOS)) {
        it(`mesa ${unit} · ${forma} · ${nombre} (${S})`, () => {
          const g = mesa(unit, [P, 20 * unit])
          const motivo = pideRecarga(g, S)
          const t = tarjetaRecarga(P, unit, S)
          const su = saldoUsable(S, unit)

          // ¿Hay pregunta? La forzosa siempre; las otras dos sólo con saldo usable.
          if (forma === 'forzosa') expect(motivo).toBe(RECARGA.FORZOSA)
          else if (su >= unit) expect(motivo).toBe(forma === 'automatica' ? RECARGA.AUTOMATICA : RECARGA.VOLUNTARIA)
          else expect(motivo).toBe(RECARGA.NINGUNA)

          // ¿Qué caso?
          if (su >= M) expect(t.caso).toBe(FILA)
          else if (su >= unit) {
            expect(t.caso).toBe(TODO)
            expect(t.monto).toBe(su)
            expect(t.todo).toBe(true)
          } else {
            expect(t.caso).toBe(SIN_SALDO)
            expect(t.monto).toBeNull()
          }
        })
      }
    }
  }
})

describe('REC-2 · la matriz del addendum, mesa 100', () => {
  const U = 100
  const caso = (P, S) => ({ motivo: pideRecarga(mesa(U, [P, 2000]), S), t: tarjetaRecarga(P, U, S) })

  it('S 5000 · P 300 → los tres montos, como hoy (caso 1)', () => {
    const { motivo, t } = caso(300, 5000)
    expect(motivo).toBe(RECARGA.AUTOMATICA)
    expect(t.caso).toBe(FILA)
    expect(t.opciones.map((o) => o.id)).toEqual(['piso', 'medio', 'techo'])
    expect(t.monto).toBe(1000)
  })

  it('S 600 · P 300 → automática, caso 2, «Recargar todo (600)»', () => {
    const { motivo, t } = caso(300, 600)
    expect(motivo).toBe(RECARGA.AUTOMATICA)
    expect(t).toMatchObject({ caso: TODO, monto: 600, todo: true, opciones: [] })
  })

  it('S 650 · P 300 → caso 2 con 600: los 50 se quedan en el saldo', () => {
    const { t } = caso(300, 650)
    expect(t).toMatchObject({ caso: TODO, monto: 600, todo: true })
    expect(650 - t.monto).toBe(50)
    expect(recargaValida(t.monto, 300, U, 650).ok).toBe(true)
  })

  it('S 600 · P 0 → forzosa, caso 2, «Recargar todo (600)»', () => {
    const { motivo, t } = caso(0, 600)
    expect(motivo).toBe(RECARGA.FORZOSA)
    expect(t).toMatchObject({ caso: TODO, monto: 600, todo: true })
  })

  it('S 50 · P 0 → forzosa, caso 3: sólo «Salir con mis fichas»', () => {
    const { motivo, t } = caso(0, 50)
    expect(motivo).toBe(RECARGA.FORZOSA)
    expect(t).toMatchObject({ caso: SIN_SALDO, monto: null, opciones: [] })
  })

  it('S 0 · P 0 → forzosa, caso 3', () => {
    const { motivo, t } = caso(0, 0)
    expect(motivo).toBe(RECARGA.FORZOSA)
    expect(t.caso).toBe(SIN_SALDO)
  })

  it('S 0 · P 300 → automática sin pregunta', () => {
    expect(caso(300, 0).motivo).toBe(RECARGA.NINGUNA)
  })

  it('la forzosa por D-12 (el ante deja a todos mudos) con S < unit es caso 3', () => {
    const g = mesa(U, [U, U])
    expect(pideRecarga(g, 50)).toBe(RECARGA.FORZOSA)
    expect(tarjetaRecarga(U, U, 50).caso).toBe(SIN_SALDO)
  })
})

// D-4 · ¿Puede el techo cortar el caso 2? Con la fila de verdad, no: el caso 2
// exige la fila entera apagada, y «Al techo» vale `techo − pila`, que es ≥ el
// tope; si fuera igual, estaría encendida. Se barre la rejilla entera para que
// esa afirmación no dependa de un razonamiento, y la rama defensiva se prueba
// con una fila fabricada.
describe('REC-2 · D-4 · el techo y el caso 2', () => {
  it('con la fila real, el caso 2 es SIEMPRE todo el saldo usable', () => {
    let casos2 = 0
    for (const unit of [10, 50, 100, 200, 300, 500]) {
      for (let P = 0; P <= techoDe(unit); P += unit / 2) {
        for (let S = 0; S <= 12 * unit; S += unit / 2) {
          const t = tarjetaRecarga(P, unit, S)
          if (t.caso !== TODO) continue
          casos2++
          expect(t.todo).toBe(true)
          expect(t.monto).toBe(saldoUsable(S, unit))
        }
      }
    }
    expect(casos2).toBeGreaterThan(0)
  })

  it('rama defensiva: si la fila apagada conviviera con un tope menor que el saldo usable, el primario dice la cifra', () => {
    const fila = [
      { id: 'piso', monto: 1000, disabled: true },
      { id: 'medio', monto: 2000, disabled: true },
      { id: 'techo', monto: 4700, disabled: true },
    ]
    expect(armarTarjeta(fila, 400, 600)).toMatchObject({ caso: TODO, monto: 400, todo: false })
    expect(armarTarjeta(fila, 600, 600)).toMatchObject({ caso: TODO, monto: 600, todo: true })
  })

  it('«Al techo» por debajo del piso sigue en la fila (caso 1) si cabe', () => {
    // Mesa 100, pila 4.600: faltan 400 hasta el techo y el saldo tiene 600.
    const t = tarjetaRecarga(4600, 100, 600)
    expect(t.caso).toBe(FILA)
    expect(t.monto).toBe(400)
    expect(t.opciones.find((o) => o.id === 'techo')).toMatchObject({ monto: 400, disabled: false })
  })
})

describe('REC-2 · el invariante: todo monto ofrecido cumple 0 < monto ≤ S', () => {
  it('sobre toda la rejilla, y nunca se pinta un 0', () => {
    for (const unit of [10, 50, 100, 200, 300, 500]) {
      for (let P = 0; P <= techoDe(unit) + unit; P += unit / 2) {
        for (let S = 0; S <= 60 * unit; S += (S < 12 * unit ? unit / 2 : 7 * unit)) {
          const t = tarjetaRecarga(P, unit, S)
          const { pintados, encendidos, primario } = ofrecido(t)
          for (const m of pintados) expect(m).toBeGreaterThan(0)
          for (const m of [...encendidos, ...(primario === null ? [] : [primario])]) {
            expect(m).toBeGreaterThan(0)
            expect(m).toBeLessThanOrEqual(S)
            expect(recargaValida(m, P, unit, S).ok).toBe(true)
          }
          // Caso 3 ⇔ no hay primario ⇔ la puerta dice que no hay recarga.
          expect(primario === null).toBe(!hayRecarga(P, unit, S))
        }
      }
    }
  })

  it('`pideRecarga` y `tarjetaRecarga` comparten la puerta (D-7)', () => {
    for (const unit of [50, 100]) {
      for (const P of [unit * 3, unit * 20]) {
        for (let S = 0; S <= 12 * unit; S += unit / 2) {
          const hay = pideRecarga(mesa(unit, [P, 20 * unit]), S) !== RECARGA.NINGUNA
          expect(hay).toBe(tarjetaRecarga(P, unit, S).caso !== SIN_SALDO)
        }
      }
    }
  })
})

// El caso borde de la ficha §2: P + S por debajo del listón. El caso 2 ofrece
// «Recargar todo» igual; tras usarlo el saldo es 0 y rige el caso 3, así que la
// burbuja no puede insistir mano tras mano sin un contador.
describe('REC-2 · caso borde: P + S por debajo del listón de 5×', () => {
  it('ofrece todo, y después ya no hay pregunta hasta que la mesa no pueda seguir', () => {
    const U = 100
    let g = mesa(U, [100, 2000])
    let S = 200
    expect(pideRecarga(g, S)).toBe(RECARGA.AUTOMATICA)
    const t = tarjetaRecarga(100, U, S)
    expect(t).toMatchObject({ caso: TODO, monto: 200, todo: true })

    g = aplicarRecarga(g, ASIENTO_HUMANO, t.monto)
    S -= t.monto
    expect(g.players[0].chips).toBe(300)
    expect(g.players[0].chips).toBeLessThan(5 * U)
    // Sigue bajo el listón, pero ya no queda saldo: no hay automática.
    expect(pideRecarga(g, S)).toBe(RECARGA.NINGUNA)
    // Y cuando pierde hasta no cubrir el ante, la forzosa es de sólo salida.
    const quebrado = { ...g, players: g.players.map((p, i) => (i === 0 ? { ...p, chips: 40 } : p)) }
    expect(pideRecarga(quebrado, S)).toBe(RECARGA.FORZOSA)
    expect(tarjetaRecarga(40, U, S).caso).toBe(SIN_SALDO)
  })
})

describe('REC-2 · la nivelación de las IAS usa el monto EFECTIVO', () => {
  it('en el caso 2 las IAS se nivelan contra P + S, no contra el piso nominal', () => {
    const U = 100
    const P = 300, S = 600
    const g = mesa(U, [P, 200, 5000])
    const t = tarjetaRecarga(P, U, S)
    expect(t.monto).toBe(600)

    // Lo mismo que hace `confirmarRecarga` en GameTable, en el mismo orden.
    let tras = aplicarRecarga(g, ASIENTO_HUMANO, t.monto)
    for (const { seat, monto } of nivelarLasIAS(tras)) tras = aplicarRecarga(tras, seat, monto)

    expect(tras.players[0].chips).toBe(900)
    expect(tras.players[1].chips).toBe(pilaIA(900, U))          // sube hasta la fórmula con 900
    expect(tras.players[1].chips).not.toBe(pilaIA(P + pisoDe(U), U)) // y no con el piso de 1.000
    expect(tras.players[2].chips).toBe(5000)                    // la sobrada no baja
  })
})

// D-7 · ninguna vista vuelve a inventar un monto. No se puede montar
// `GameTable.jsx` (sin jsdom), así que se sella el texto: toda apertura de la
// tarjeta toma el monto de `tarjetaRecarga`, y no queda un `?? 0` de monto.
describe('REC-2 · D-7 · ninguna ruta de la tarjeta llega a monto 0', () => {
  const src = readFileSync(new URL('../src/components/GameTable.jsx', import.meta.url), 'utf8')

  it('toda apertura de la tarjeta toma el monto del núcleo', () => {
    const aperturas = [...src.matchAll(/setRecarga\(\{\s*motivo:[^}]*\}\)/g)].map((m) => m[0])
    expect(aperturas.length).toBeGreaterThanOrEqual(2)
    for (const a of aperturas) expect(a).toMatch(/monto:\s*tarjRec\.monto\b/)
  })

  it('no queda ningún `?? 0` junto a un monto', () => {
    const lineas = src.split('\n').filter((l) => /monto/.test(l) && /\?\?\s*0\b/.test(l))
    expect(lineas).toEqual([])
  })

  it('el primario sólo se pinta cuando el núcleo da un monto (caso 1 o 2)', () => {
    const primarios = [...src.matchAll(/data-accion="recarga-si"/g)]
    expect(primarios.length).toBe(2)
    expect(src).toMatch(/tarjRec\.caso === CASOS_RECARGA\.FILA && \(\s*<SoundButton\s+className="btn btn-primary"\s+data-accion="recarga-si"/)
    expect(src).toMatch(/tarjRec\.caso === CASOS_RECARGA\.TODO && \(\s*<div className="rec-todo">/)
  })

  it('en el núcleo, la tarjeta nunca nace con monto 0', () => {
    for (const unit of [50, 100]) {
      for (let P = 0; P <= techoDe(unit); P += unit) {
        for (let S = 0; S <= 12 * unit; S += unit / 2) {
          expect(tarjetaRecarga(P, unit, S).monto).not.toBe(0)
        }
      }
    }
  })
})
