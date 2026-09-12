import { describe, it, expect } from 'vitest'
import {
  ORIGEN_ENLACE,
  URGE_SEG,
  enlaceDeSala,
  finDe,
  inicialDe,
  posicionSilla,
  resumenDe,
  siguienteConsejo,
  sillasDe,
  urge,
} from './salaEsperaCore.js'
import { PARAM_SALA } from '../config/salaPendiente.js'
import { LLENA_SEG, DURACION_SALA_SEG } from '../config/salas.js'

// ── SAL-B2 · La semántica de la sala de espera ──────────────────────────────
// Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §6. Se prueba el NÚCLEO y no la
// pantalla, por la razón de siempre: no hay jsdom. Todo lo que aquí se sella es
// lo que F1b va a pintar sin decidir nada por su cuenta.

const ANF = '00000000-0000-4000-8000-000000000001'
const INV = '00000000-0000-4000-8000-000000000002'
const OTRO = '00000000-0000-4000-8000-000000000003'

const sala = (extra = {}) => ({
  id: 'u1', codigo: 'AJ-7K2M', tipo: 'privada', jugadores: 4, apuesta: 200,
  anfitrion_id: ANF, estado: 'esperando', ...extra,
})
const asientos = () => [
  { asiento: 0, jugadorId: ANF, username: 'carlos_vzla' },
  { asiento: 1, jugadorId: INV, username: 'maria_ccs' },
]

describe('SAL-B2 · inicialDe', () => {
  it('la primera letra, en mayúscula', () => {
    expect(inicialDe('carlos_vzla')).toBe('C')
    expect(inicialDe('maria_ccs')).toBe('M')
    expect(inicialDe('7lucas')).toBe('7')
  })

  it('sin username, la interrogación: hay alguien, pero no se sabe quién', () => {
    expect(inicialDe(null)).toBe('?')
    expect(inicialDe(undefined)).toBe('?')
    expect(inicialDe('')).toBe('?')
  })
})

describe('SAL-B2 · sillasDe', () => {
  it('una silla por plaza de la mesa, no por sentado', () => {
    const s = sillasDe(sala(), asientos(), ANF)
    expect(s).toHaveLength(4)
    expect(s.map((x) => x.asiento)).toEqual([0, 1, 2, 3])
  })

  it('el anfitrión se marca por uuid, y «Tú» por el uid que mira', () => {
    const s = sillasDe(sala(), asientos(), INV)
    expect(s[0]).toEqual({ asiento: 0, username: 'carlos_vzla', inicial: 'C', esAnfitrion: true, esTu: false, vacia: false })
    expect(s[1]).toEqual({ asiento: 1, username: 'maria_ccs', inicial: 'M', esAnfitrion: false, esTu: true, vacia: false })
  })

  it('el anfitrión que mira es anfitrión Y tú a la vez', () => {
    const s = sillasDe(sala(), asientos(), ANF)
    expect(s[0].esAnfitrion).toBe(true)
    expect(s[0].esTu).toBe(true)
  })

  it('las vacías van punteadas: sin nombre, sin inicial, sin marcas', () => {
    const s = sillasDe(sala(), asientos(), ANF)
    expect(s[2]).toEqual({ asiento: 2, username: null, inicial: null, esAnfitrion: false, esTu: false, vacia: true })
    expect(s[3].vacia).toBe(true)
  })

  it('el asiento manda, no el orden de llegada de las filas', () => {
    // Si el de la silla 1 se levantó y llega otro, ocupa la 1 (SAL-A §10). Las
    // filas pueden venir en cualquier orden: se coloca cada una en SU número.
    const s = sillasDe(sala(), [
      { asiento: 3, jugadorId: OTRO, username: 'ana_bcn' },
      { asiento: 0, jugadorId: ANF, username: 'carlos_vzla' },
    ], ANF)
    expect(s.map((x) => x.vacia)).toEqual([false, true, true, false])
    expect(s[3].username).toBe('ana_bcn')
  })

  it('un sentado sin username enseña «?» y sigue siendo alguien', () => {
    const s = sillasDe(sala(), [{ asiento: 1, jugadorId: OTRO, username: null }], ANF)
    expect(s[1]).toMatchObject({ vacia: false, username: null, inicial: '?' })
  })

  it('sin uid nadie es «Tú»; sin mesa, sin sillas', () => {
    expect(sillasDe(sala(), asientos(), null).every((x) => !x.esTu)).toBe(true)
    expect(sillasDe(null, asientos(), ANF)).toEqual([])
    expect(sillasDe({ jugadores: 0 }, [], ANF)).toEqual([])
  })

  it('las mesas de 2 y de 5 tienen exactamente sus sillas', () => {
    expect(sillasDe(sala({ jugadores: 2 }), asientos(), ANF)).toHaveLength(2)
    expect(sillasDe(sala({ jugadores: 5 }), asientos(), ANF)).toHaveLength(5)
  })
})

describe('SAL-B2 · resumenDe', () => {
  it('cuenta sentados y plazas', () => {
    expect(resumenDe(sala(), asientos(), ANF)).toEqual({
      esAnfitrion: true, sentados: 2, jugadores: 4, llena: false, puedeJugarYa: true,
    })
  })

  it('el invitado nunca puede «Jugar ya»', () => {
    expect(resumenDe(sala(), asientos(), INV).puedeJugarYa).toBe(false)
    expect(resumenDe(sala(), asientos(), INV).esAnfitrion).toBe(false)
  })

  it('el anfitrión solo no puede: hacen falta al menos 2', () => {
    expect(resumenDe(sala(), [asientos()[0]], ANF).puedeJugarYa).toBe(false)
  })

  it('llena: arranca sola y el CTA se retira', () => {
    const cuatro = [...asientos(),
      { asiento: 2, jugadorId: OTRO, username: 'ana_bcn' },
      { asiento: 3, jugadorId: 'x', username: 'luis_mia' }]
    const r = resumenDe(sala(), cuatro, ANF)
    expect(r.llena).toBe(true)
    expect(r.puedeJugarYa).toBe(false)
  })

  it('una mesa de 2 con dos sentados está llena', () => {
    expect(resumenDe(sala({ jugadores: 2 }), asientos(), ANF).llena).toBe(true)
  })

  it('sin asientos ni uid, todo apagado y sin romper', () => {
    expect(resumenDe(sala(), null, null)).toEqual({
      esAnfitrion: false, sentados: 0, jugadores: 4, llena: false, puedeJugarYa: false,
    })
    expect(resumenDe(null, null, null).jugadores).toBe(0)
  })
})

describe('SAL-B2 · finDe', () => {
  it('esperando → null: la mesa vive', () => {
    expect(finDe(sala())).toBeNull()
    expect(finDe(sala(), null)).toBeNull()
  })

  it('la fila cambió a cancelada sin resolver → el anfitrión cerró la mesa', () => {
    expect(finDe(sala({ estado: 'cancelada' }))).toBe('cancelada')
  })

  // ── Ajustes · lo decide quién mira (defecto E5) ──────────────────────────
  it('el ANFITRIÓN nunca lee «el anfitrión cerró»: una fila cancelada es vencida', () => {
    expect(finDe(sala({ estado: 'cancelada' }), null, true)).toBe('vencida')
  })

  it('el INVITADO sí: una fila cancelada es que el anfitrión cerró', () => {
    expect(finDe(sala({ estado: 'cancelada' }), null, false)).toBe('cancelada')
  })

  it('la fila cambió a activa → arranca, venga de jugar_ya o del barrido', () => {
    expect(finDe(sala({ estado: 'activa' }))).toBe('activa')
  })

  it('resuelta a cero con < 2 → vencida (no «cancelada»: nadie la cerró)', () => {
    expect(finDe(sala(), sala({ estado: 'cancelada' }))).toBe('vencida')
  })

  it('resuelta a cero con ≥ 2 → activa', () => {
    expect(finDe(sala(), sala({ estado: 'activa' }))).toBe('activa')
  })

  it('la fila conocida terminal gana a la resuelta · vista de invitado (F1b §3.3)', () => {
    // La carrera: Realtime trajo 'cancelada' (el anfitrión cerró) y el reloj
    // local llegó a cero en el mismo instante. Lo que el invitado lee es «El
    // anfitrión cerró la mesa», no «no llegó gente a tiempo».
    expect(finDe(sala({ estado: 'cancelada' }), sala({ estado: 'cancelada' }))).toBe('cancelada')
    expect(finDe(sala({ estado: 'cancelada' }), sala({ estado: 'activa' }))).toBe('cancelada')
    expect(finDe(sala({ estado: 'activa' }), sala({ estado: 'cancelada' }))).toBe('activa')
  })

  it('la misma carrera con la vista del ANFITRIÓN: cancelada se lee vencida', () => {
    // Gana igual la fila conocida; lo que cambia es CÓMO se lee una cancelada.
    expect(finDe(sala({ estado: 'cancelada' }), sala({ estado: 'cancelada' }), true)).toBe('vencida')
    expect(finDe(sala({ estado: 'cancelada' }), sala({ estado: 'activa' }), true)).toBe('vencida')
    expect(finDe(sala({ estado: 'activa' }), sala({ estado: 'cancelada' }), true)).toBe('activa')
  })

  it('una resuelta que sigue esperando es null: el reloj local se adelantó', () => {
    expect(finDe(sala(), sala({ estado: 'esperando' }))).toBeNull()
  })
})

describe('SAL-B2 · posicionSilla', () => {
  it('la primera silla arriba del todo', () => {
    const p = posicionSilla(0, 4, 100, 50)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(-50, 6)
    expect(p.arriba).toBe(true)
  })

  it('sentido horario: la segunda de cuatro a la derecha, la tercera abajo', () => {
    const der = posicionSilla(1, 4, 100, 50)
    expect(der.x).toBeCloseTo(100, 6)
    expect(der.y).toBeCloseTo(0, 6)
    // En el ecuador (seno ≈ 0) cae a la mitad de abajo, como en la lámina.
    expect(der.arriba).toBe(false)
    const abajo = posicionSilla(2, 4, 100, 50)
    expect(abajo.y).toBeCloseTo(50, 6)
    expect(abajo.arriba).toBe(false)
  })

  it('en una mesa de 2 la segunda está abajo del todo', () => {
    const p = posicionSilla(1, 2, 100, 50)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(50, 6)
  })

  it('en una de 5, tres arriba (la 0, la 1 y la 4) y dos abajo', () => {
    // A 72° por silla, la primera queda arriba del todo, la segunda y la última
    // a 18° por encima del ecuador, y las dos del medio por debajo: es la
    // lámina con `?n=5`.
    const arriba = [0, 1, 2, 3, 4].map((i) => posicionSilla(i, 5, 100, 50).arriba)
    expect(arriba).toEqual([true, true, false, false, true])
  })

  it('con centro, devuelve la posición absoluta', () => {
    const p = posicionSilla(0, 4, 100, 50, 300, 200)
    expect(p.x).toBeCloseTo(300, 6)
    expect(p.y).toBeCloseTo(150, 6)
  })

  it('un n inválido devuelve el centro sin romper', () => {
    expect(posicionSilla(0, 0, 100, 50)).toEqual({ x: 0, y: 0, arriba: false })
  })
})

describe('SAL-B2 · urge', () => {
  it('a 30 o menos urge; a 31 no', () => {
    expect(URGE_SEG).toBe(30)
    expect(urge(31, false)).toBe(false)
    expect(urge(30, false)).toBe(true)
    expect(urge(0, false)).toBe(true)
  })

  it('con la mesa llena nunca urge: la cuenta corta es oro, no naranja', () => {
    expect(urge(LLENA_SEG, true)).toBe(false)
    expect(urge(3, true)).toBe(false)
  })

  it('un número que no es número no urge', () => {
    expect(urge(NaN, false)).toBe(false)
    expect(urge(undefined, false)).toBe(false)
  })

  it('el umbral está por debajo de la cuenta entera y por encima de la corta', () => {
    expect(URGE_SEG).toBeLessThan(DURACION_SALA_SEG)
    expect(URGE_SEG).toBeGreaterThan(LLENA_SEG)
  })
})

describe('SAL-B2 · siguienteConsejo', () => {
  it('avanza y da la vuelta', () => {
    expect(siguienteConsejo(0, 5)).toBe(1)
    expect(siguienteConsejo(3, 5)).toBe(4)
    expect(siguienteConsejo(4, 5)).toBe(0)
  })

  it('con un total inválido se queda en el primero', () => {
    expect(siguienteConsejo(2, 0)).toBe(0)
    expect(siguienteConsejo(2, undefined)).toBe(0)
  })

  it('con un índice raro arranca del primero', () => {
    expect(siguienteConsejo(undefined, 5)).toBe(1)
    expect(siguienteConsejo(-1, 5)).toBe(0)
  })
})

describe('SAL-B2 · enlaceDeSala', () => {
  it('es exactamente lo que recogerDeLaUrl() lee', () => {
    expect(enlaceDeSala('AJ-7K2M')).toBe(`${ORIGEN_ENLACE}?${PARAM_SALA}=AJ-7K2M`)
    expect(enlaceDeSala('AJ-7K2M')).toBe('https://ajilei.io/?sala=AJ-7K2M')
  })

  it('una mesa abierta no tiene código ni enlace', () => {
    expect(enlaceDeSala(null)).toBeNull()
    expect(enlaceDeSala('')).toBeNull()
    expect(enlaceDeSala(undefined)).toBeNull()
  })
})
