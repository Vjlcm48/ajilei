import { describe, it, expect } from 'vitest'
import { calcularDesfase, ahoraServidor, restante, comoReloj } from './relojCore.js'
import { duracionSala } from '../config/salas.js'

// ── SAL-A · El reloj del servidor ───────────────────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §5.1.
//
// Todo entra por parámetro: no hay un solo `Date.now()` en el módulo bajo
// prueba, y por eso aquí se puede adelantar el reloj tres minutos sin esperarlos
// y correr un teléfono dos días sin tocar la máquina.

// Un instante fijo y legible, para que los números del test se puedan leer.
const T0 = Date.parse('2026-09-05T12:00:00.000Z')

describe('SAL-A · calcularDesfase', () => {
  it('relojes sincronizados dan cero', () => {
    expect(calcularDesfase(new Date(T0).toISOString(), T0)).toBe(0)
  })

  it('reloj local ATRASADO da desfase positivo', () => {
    // El servidor va 30 s por delante.
    expect(calcularDesfase(new Date(T0 + 30_000).toISOString(), T0)).toBe(30_000)
  })

  it('reloj local ADELANTADO da desfase negativo', () => {
    expect(calcularDesfase(new Date(T0 - 30_000).toISOString(), T0)).toBe(-30_000)
  })

  it('aguanta un teléfono con la fecha corrida dos días', () => {
    // El caso que motiva todo este archivo. No es una hipótesis: un móvil sin
    // red puede arrancar con la fecha de fábrica.
    const dosDias = 2 * 24 * 60 * 60 * 1000
    expect(calcularDesfase(new Date(T0).toISOString(), T0 - dosDias)).toBe(dosDias)
  })

  it('una hora ilegible degrada a cero, no a NaN', () => {
    // Un `NaN` aquí se propagaría a todos los cronómetros en silencio: el
    // restante saldría 0 siempre y las salas parecerían vencidas al nacer.
    expect(calcularDesfase('no es una fecha', T0)).toBe(0)
    expect(calcularDesfase(undefined, T0)).toBe(0)
    expect(calcularDesfase(new Date(T0).toISOString(), NaN)).toBe(0)
  })

  it('`null` NO es la época de 1970 — la trampa que este test cazó', () => {
    // `new Date(null).getTime()` devuelve 0, un número finito, así que un
    // guardia de `Number.isFinite` sobre el resultado NO salta. Con una RPC
    // caída que devolviera `null`, el desfase habría salido de cincuenta y seis
    // años y todas las salas habrían nacido vencidas. Se rechaza a mano.
    expect(calcularDesfase(null, T0)).toBe(0)
    expect(calcularDesfase('', T0)).toBe(0)
    expect(restante(null, T0)).toBe(0)
  })

  it('acepta las tres formas de hora que puede devolver el SDK', () => {
    const iso = new Date(T0).toISOString()
    expect(calcularDesfase(iso, T0)).toBe(0)
    expect(calcularDesfase(T0, T0)).toBe(0)
    expect(calcularDesfase(new Date(T0), T0)).toBe(0)
  })
})

describe('SAL-A · ahoraServidor', () => {
  it('suma el desfase a la hora local', () => {
    expect(ahoraServidor(T0, 30_000)).toBe(T0 + 30_000)
    expect(ahoraServidor(T0, -30_000)).toBe(T0 - 30_000)
  })

  it('sin desfase devuelve la hora local tal cual', () => {
    expect(ahoraServidor(T0)).toBe(T0)
    expect(ahoraServidor(T0, NaN)).toBe(T0)
  })
})

describe('SAL-A · restante', () => {
  const expira = new Date(T0 + duracionSala('abierta') * 1000).toISOString()

  it('una sala recién creada muestra los tres minutos enteros', () => {
    // El redondeo hacia arriba es lo que hace que el primer fotograma diga 180 y
    // no 179. Con `floor` la cuenta empezaría en «2:59» y parecería rota.
    expect(restante(expira, T0)).toBe(duracionSala('abierta'))
  })

  it('cuenta hacia abajo', () => {
    expect(restante(expira, T0 + 1_000)).toBe(179)
    expect(restante(expira, T0 + 90_000)).toBe(90)
    expect(restante(expira, T0 + 179_500)).toBe(1)
  })

  it('en el instante exacto del vencimiento es cero', () => {
    expect(restante(expira, T0 + 180_000)).toBe(0)
  })

  it('NUNCA es negativo, por mucho que se haya pasado', () => {
    // Es lo que permite que la pantalla escriba `restante(x) === 0` como única
    // condición de vencimiento, sin acordarse de recortar.
    expect(restante(expira, T0 + 181_000)).toBe(0)
    expect(restante(expira, T0 + 999_999_999)).toBe(0)
  })

  it('una pestaña que vuelve de dormir se pone al día de golpe', () => {
    // El motivo de que el restante se CALCULE en cada pulso en vez de restarle
    // uno al anterior: aquí el navegador estranguló el intervalo dos minutos y
    // el número correcto sale igual, en el primer fotograma.
    expect(restante(expira, T0 + 120_000)).toBe(60)
  })

  it('una fecha ilegible da cero en vez de romper la pantalla', () => {
    expect(restante('basura', T0)).toBe(0)
    expect(restante(null, T0)).toBe(0)
    expect(restante(expira, NaN)).toBe(0)
  })

  it('el camino completo: desfase medido y cuenta corregida', () => {
    // El recorrido de verdad, de punta a punta. Teléfono 45 s adelantado: sin
    // corrección la sala parecería tener 135 s; con ella tiene los 180 que son.
    const localAlEntrar = T0 + 45_000
    const desfase = calcularDesfase(new Date(T0).toISOString(), localAlEntrar)
    expect(restante(expira, ahoraServidor(localAlEntrar, desfase))).toBe(180)
    // Y un segundo después de verdad, 179.
    expect(restante(expira, ahoraServidor(localAlEntrar + 1_000, desfase))).toBe(179)
  })
})

describe('SAL-A · comoReloj', () => {
  it('pinta los casos de la sala de espera', () => {
    expect(comoReloj(180)).toBe('3:00')
    expect(comoReloj(167)).toBe('2:47')
    expect(comoReloj(7)).toBe('0:07')
    expect(comoReloj(0)).toBe('0:00')
  })

  it('el 60 y sus vecinos, que es donde se rompe una implementación descuidada', () => {
    expect(comoReloj(61)).toBe('1:01')
    expect(comoReloj(60)).toBe('1:00')
    expect(comoReloj(59)).toBe('0:59')
  })

  it('un negativo o una basura se pintan como cero, no como texto roto', () => {
    expect(comoReloj(-5)).toBe('0:00')
    expect(comoReloj(NaN)).toBe('0:00')
    expect(comoReloj(undefined)).toBe('0:00')
  })
})
