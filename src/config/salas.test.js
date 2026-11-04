import { describe, it, expect } from 'vitest'
import {
  APUESTAS_PVP,
  BONO_BIENVENIDA,
  REGLA_ASIENTO,
  ALCANCE_NUEVOS,
  ALFABETO_CODIGO,
  CODIGO_REGEX,
  DURACION_SALA_SEG,
  JUGADORES_PVP,
  saldoMinimo,
  apuestasAlAlcance,
  normalizarCodigo,
} from './salas.js'
import { AJILEI_CONFIG } from './ajileiConfig.js'

// ── SAL-A · Las constantes selladas ─────────────────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §4.1.
//
// Corre en Node pelado, sin jsdom. Lo que este archivo defiende no es que las
// cifras sean "correctas" —eso lo selló Victor— sino que sigan SIENDO ésas y que
// las dos formas del alfabeto (cadena y rango de la migración) no se separen.

describe('SAL-A · las seis apuestas', () => {
  it('son las selladas y en orden', () => {
    // Recordatorio deliberado, molde del test de IDIOMAS_DISPONIBLES: si alguien
    // añade o mueve una apuesta, esta línea sale roja y obliga a decidirlo a
    // mano en vez de que la lista se deslice.
    expect(APUESTAS_PVP).toEqual([100, 200, 500, 1000, 2000, 5000])
  })

  it('no son las de vs-IA', () => {
    // La confusión que este test previene: `STAKE_OPTIONS` y las tablas de
    // `niveles.js` están atadas a la dificultad de la IA (Fase 0 §5.1), un
    // concepto que en PvP no existe. Son seis y aquéllas cuatro.
    expect(APUESTAS_PVP).toHaveLength(6)
  })
})

describe('MOT-1 · la entrada Corta', () => {
  it('el saldo mínimo es quince veces la apuesta', () => {
    expect(REGLA_ASIENTO).toBe(15)
    expect(saldoMinimo(100)).toBe(1500)
    expect(saldoMinimo(5000)).toBe(75000)
  })

  it('un saldo justo para el mínimo SÍ alcanza', () => {
    // El borde: `>=`, no `>`. Con exactamente 1.500 se puede jugar la de 100.
    expect(apuestasAlAlcance(1500)).toEqual([100])
    expect(apuestasAlAlcance(1499)).toEqual([])
  })

  it('el alcance crece con el saldo y conserva el orden', () => {
    expect(apuestasAlAlcance(75000)).toEqual(APUESTAS_PVP)
    expect(apuestasAlAlcance(7500)).toEqual([100, 200, 500])
  })

  it('devuelve un array nuevo, no la lista sellada', () => {
    // Sin esto, un consumidor que hiciera `.sort()` sobre el resultado
    // reordenaría `APUESTAS_PVP` para toda la app.
    const alcance = apuestasAlAlcance(75000)
    expect(alcance).not.toBe(APUESTAS_PVP)
    alcance.reverse()
    expect(APUESTAS_PVP[0]).toBe(100)
  })

  it('un saldo que no es número no alcanza nada, en vez de romper', () => {
    expect(apuestasAlAlcance(undefined)).toEqual([])
    expect(apuestasAlAlcance(null)).toEqual([])
    expect(apuestasAlAlcance(NaN)).toEqual([])
  })
})

describe('SAL-A · el bono de bienvenida', () => {
  it('son 2.500 Heptacoins (ECO-1b, B4)', () => {
    // Re-sello de ECO-1b: era 1.200 (rector SAL-A §4.1) y contradecía S1 y el
    // servidor de la 1a, que da 2.500 (`bono_bienvenida_hc()`).
    expect(BONO_BIENVENIDA).toBe(2500)
  })

  it('una cuenta nueva alcanza solo la primera mesa', () => {
    // Con 2.500 se llega a la de 100 (15 × 100 = 1.500) y no a la de 200 (3.000).
    expect(ALCANCE_NUEVOS).toEqual([100])
  })

  it('el alcance de nuevos se DERIVA y no está escrito a mano', () => {
    expect(ALCANCE_NUEVOS).toEqual(apuestasAlAlcance(BONO_BIENVENIDA))
  })
})

describe('SAL-A · el alfabeto del código', () => {
  it('tiene 32 símbolos y ninguno repetido', () => {
    expect(ALFABETO_CODIGO).toHaveLength(32)
    expect(new Set(ALFABETO_CODIGO).size).toBe(32)
  })

  it('no contiene los cuatro que se confunden a la vista', () => {
    for (const prohibido of ['O', '0', 'I', '1']) {
      expect(ALFABETO_CODIGO).not.toContain(prohibido)
    }
  })

  it('la cadena y el rango de la migración son el MISMO alfabeto', () => {
    // El test que impide que las dos formas se separen en silencio. `CODIGO_REGEX`
    // lleva el mismo `[A-HJ-NP-Z2-9]` que viaja en `salas_codigo_formato_chk`;
    // si alguien toca uno de los dos sin el otro, esta comprobación lo caza.
    //
    // Las dos direcciones, porque una sola no basta: que todo lo del alfabeto
    // pase el rango NO impide que el rango acepte algo de más.
    for (const caracter of ALFABETO_CODIGO) {
      expect(CODIGO_REGEX.test(`AJ-${caracter.repeat(4)}`)).toBe(true)
    }
    const TODOS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    for (const caracter of TODOS) {
      const enRango = CODIGO_REGEX.test(`AJ-${caracter.repeat(4)}`)
      expect(enRango).toBe(ALFABETO_CODIGO.includes(caracter))
    }
  })
})

describe('SAL-A · normalizarCodigo', () => {
  it('acepta lo que un humano escribe de verdad', () => {
    expect(normalizarCodigo('aj 7k2m')).toBe('AJ-7K2M')
    expect(normalizarCodigo('AJ-7K2M')).toBe('AJ-7K2M')
    expect(normalizarCodigo('aj7k2m')).toBe('AJ-7K2M')
    expect(normalizarCodigo('7K2M')).toBe('AJ-7K2M')
    expect(normalizarCodigo('  7k2m  ')).toBe('AJ-7K2M')
    expect(normalizarCodigo('AJ - 7 K 2 M')).toBe('AJ-7K2M')
  })

  it('rechaza los cuatro caracteres que no se emiten', () => {
    expect(normalizarCodigo('AJ-0OI1')).toBe(null)
    expect(normalizarCodigo('0OI1')).toBe(null)
    expect(normalizarCodigo('AJ-7K2O')).toBe(null)
  })

  it('rechaza longitudes que no son de código', () => {
    expect(normalizarCodigo('')).toBe(null)
    expect(normalizarCodigo('7K2')).toBe(null)
    expect(normalizarCodigo('7K2MX')).toBe(null)
    expect(normalizarCodigo('AJ-7K2MX')).toBe(null)
  })

  it('un cuerpo que empieza por AJ no se come sus propias letras', () => {
    // El caso que obliga a mirar la LONGITUD y no sólo las dos primeras letras:
    // `A` y `J` están los dos en el alfabeto, así que `AJKL` es un cuerpo
    // legítimo y no un prefijo con dos caracteres sueltos detrás.
    expect(normalizarCodigo('AJKL')).toBe('AJ-AJKL')
    expect(normalizarCodigo('AJ-AJKL')).toBe('AJ-AJKL')
  })

  it('lo que no es cadena devuelve null en vez de lanzar', () => {
    // El consumidor es un campo que se teclea: «todavía no vale» es el estado
    // normal, no un error que deba tumbar la pantalla.
    expect(normalizarCodigo(null)).toBe(null)
    expect(normalizarCodigo(undefined)).toBe(null)
    expect(normalizarCodigo(7)).toBe(null)
  })

  it('todo lo que normaliza pasa el regex de la base', () => {
    // La promesa que le hace al servidor: si esto devuelve algo, la base no lo
    // va a rechazar por formato.
    for (const entrada of ['aj 7k2m', '7K2M', 'AJKL', 'zzzz', '2345']) {
      const salida = normalizarCodigo(entrada)
      if (salida !== null) expect(CODIGO_REGEX.test(salida)).toBe(true)
    }
  })
})

describe('SAL-A · el resto de las cifras', () => {
  it('la sala vive tres minutos', () => {
    expect(DURACION_SALA_SEG).toBe(180)
  })

  it('las mesas PvP son de 2 a 5 y se derivan del config del juego', () => {
    expect(JUGADORES_PVP).toEqual([2, 3, 4, 5])
    expect(JUGADORES_PVP[0]).toBe(AJILEI_CONFIG.game.playersMin)
    expect(JUGADORES_PVP.at(-1)).toBe(AJILEI_CONFIG.game.playersMax)
  })
})
