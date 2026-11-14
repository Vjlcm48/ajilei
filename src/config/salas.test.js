import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import {
  APUESTAS_PVP,
  BONO_BIENVENIDA,
  ENTRADAS_PVP,
  ENTRADA_POR_DEFECTO,
  REGLA_ASIENTO,
  RITMOS_PVP,
  ALCANCE_NUEVOS,
  ALFABETO_CODIGO,
  CODIGO_REGEX,
  duracionSala,
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

// MES-PvP 7b · las migraciones, en orden, como texto: los espejos de abajo leen
// la ÚLTIMA definición de cada cifra que el servidor hace cumplir.
const MIGRACIONES = (() => {
  const dir = new URL('../../supabase/migrations/', import.meta.url)
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(new URL(f, dir), 'utf8'))
})()

describe('MES-PvP 7b · las siete apuestas', () => {
  it('son las selladas y en orden', () => {
    // Recordatorio deliberado, molde del test de IDIOMAS_DISPONIBLES: si alguien
    // añade o mueve una apuesta, esta línea sale roja y obliga a decidirlo a
    // mano en vez de que la lista se deslice. El 50 entra con la 7b (Reglas §8).
    expect(APUESTAS_PVP).toEqual([50, 100, 200, 500, 1000, 2000, 5000])
  })

  it('no son las de vs-IA', () => {
    // La confusión que este test previene: `STAKE_OPTIONS` y las tablas de
    // `niveles.js` están atadas a la dificultad de la IA (Fase 0 §5.1), un
    // concepto que en PvP no existe. Son siete y aquéllas cuatro.
    expect(APUESTAS_PVP).toHaveLength(7)
  })

  it('son el espejo del `check (apuesta in (…))` de `salas`', () => {
    const listas = MIGRACIONES.flatMap((sql) => [...sql.matchAll(/check \(apuesta in \(([\d, ]+)\)\)/g)].map((m) => m[1]))
    expect(listas.length).toBeGreaterThan(0)
    expect(listas.at(-1).split(',').map(Number)).toEqual(APUESTAS_PVP)
  })
})

describe('MOT-1 · la entrada: Corta 15× y Llena 50×', () => {
  it('el saldo mínimo es quince veces la apuesta con la Corta, que es la de por defecto', () => {
    expect(REGLA_ASIENTO).toBe(15)
    expect(ENTRADA_POR_DEFECTO).toBe('corta')
    expect(saldoMinimo(50)).toBe(750)
    expect(saldoMinimo(100)).toBe(1500)
    expect(saldoMinimo(5000)).toBe(75000)
    expect(saldoMinimo(100, 'corta')).toBe(1500)
  })

  it('MES-PvP 7b · y cincuenta con la Llena; una entrada desconocida cuenta como Corta', () => {
    expect(saldoMinimo(50, 'llena')).toBe(2500)
    expect(saldoMinimo(100, 'llena')).toBe(5000)
    expect(saldoMinimo(5000, 'llena')).toBe(250000)
    expect(saldoMinimo(100, 'otra')).toBe(1500)
  })

  it('MES-PvP 7b · Corta y Llena son el espejo de `entrada_de` en SQL', () => {
    const conFuncion = MIGRACIONES.filter((sql) => /function public\.entrada_de\(/.test(sql))
    expect(conFuncion.length).toBeGreaterThan(0)
    const sql = conFuncion.at(-1)
    const desde = sql.indexOf('function public.entrada_de(')
    const cuerpo = sql.slice(desde, sql.indexOf('$fn$;', desde))
    const veces = Object.fromEntries([...cuerpo.matchAll(/when '(\w+)' then (\d+)/g)].map(([, e, n]) => [e, Number(n)]))
    expect(veces).toEqual(ENTRADAS_PVP)
  })

  it('MES-PvP 7b · Normal y Rápido son el espejo del `check` de `salas.ritmo`', () => {
    const checks = MIGRACIONES.flatMap((sql) => [...sql.matchAll(/check \(ritmo in \(([^)]*)\)\)/g)].map((m) => m[1]))
    expect(checks.length).toBeGreaterThan(0)
    expect([...checks.at(-1).matchAll(/'(\w+)'/g)].map((m) => m[1])).toEqual(RITMOS_PVP)
  })

  it('un saldo justo para el mínimo SÍ alcanza', () => {
    // El borde: `>=`, no `>`. Con exactamente 750 se puede jugar la de 50.
    expect(apuestasAlAlcance(750)).toEqual([50])
    expect(apuestasAlAlcance(749)).toEqual([])
    expect(apuestasAlAlcance(1500)).toEqual([50, 100])
  })

  it('el alcance crece con el saldo y conserva el orden', () => {
    expect(apuestasAlAlcance(75000)).toEqual(APUESTAS_PVP)
    expect(apuestasAlAlcance(7500)).toEqual([50, 100, 200, 500])
  })

  it('devuelve un array nuevo, no la lista sellada', () => {
    // Sin esto, un consumidor que hiciera `.sort()` sobre el resultado
    // reordenaría `APUESTAS_PVP` para toda la app.
    const alcance = apuestasAlAlcance(75000)
    expect(alcance).not.toBe(APUESTAS_PVP)
    alcance.reverse()
    expect(APUESTAS_PVP[0]).toBe(50)
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

  it('una cuenta nueva alcanza solo las dos primeras mesas', () => {
    // Con 2.500 se llega a la de 50 (750) y a la de 100 (15 × 100 = 1.500), y no
    // a la de 200 (3.000). MES-PvP 7b · el aviso a los nuevos dice «50 o 100».
    expect(ALCANCE_NUEVOS).toEqual([50, 100])
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
  it('MES-PvP 7a · la privada vive 5:00 y la abierta 3:00; otro tipo, lo del defecto de la columna', () => {
    expect(duracionSala('privada')).toBe(300)
    expect(duracionSala('abierta')).toBe(180)
    expect(duracionSala('otra')).toBe(180)
    expect(duracionSala(undefined)).toBe(180)
  })

  // El espejo: la última `duracion_sala` de las migraciones, leída del SQL, dice lo mismo.
  it('MES-PvP 7a · duracionSala es el espejo de duracion_sala(tipo) en SQL', () => {
    const dir = new URL('../../supabase/migrations/', import.meta.url)
    const conFuncion = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
      .map((f) => readFileSync(new URL(f, dir), 'utf8'))
      .filter((sql) => /create or replace function public\.duracion_sala\(/.test(sql))
    expect(conFuncion.length).toBeGreaterThan(0)
    const sql = conFuncion.at(-1)
    const cuerpo = sql.slice(sql.indexOf('function public.duracion_sala('), sql.indexOf('$fn$;', sql.indexOf('function public.duracion_sala(')))
    const minutos = Object.fromEntries([...cuerpo.matchAll(/when '(\w+)' then interval '(\d+) minutes'/g)].map(([, tipo, m]) => [tipo, Number(m)]))
    expect(minutos).toEqual({ privada: 5, abierta: 3 })
    for (const [tipo, m] of Object.entries(minutos)) expect(duracionSala(tipo)).toBe(m * 60)
  })

  it('las mesas PvP son de 2 a 5 y se derivan del config del juego', () => {
    expect(JUGADORES_PVP).toEqual([2, 3, 4, 5])
    expect(JUGADORES_PVP[0]).toBe(AJILEI_CONFIG.game.playersMin)
    expect(JUGADORES_PVP.at(-1)).toBe(AJILEI_CONFIG.game.playersMax)
  })
})
