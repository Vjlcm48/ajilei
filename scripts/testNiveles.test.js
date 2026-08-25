/**
 * NIV-UI · Niveles Básico/Avanzado/Pro — tablas selladas, memoria y pasajero.
 * Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §3 (tablas) · §4.2 (arranque
 * en frío y memoria) · §2.2 (pasajero, vía C).
 * Ejecutar: npm test
 */
import { describe, it, expect } from 'vitest'

import {
  NIVELES, NIVEL_POR_DEFECTO, NIVEL_KEY, nivelPorId, apuestasDe, puntosDe,
} from '../src/config/niveles.js'
import {
  esNivelValido, normalizarNivel, preseleccion, conNivel,
} from '../src/hooks/nivelCore.js'
import { createInitialState } from '../src/engine/gameEngine.js'

// ── 1. Tablas selladas ───────────────────────────────────────────────────────
// Los doce montos van escritos A MANO aquí, no derivados del propio módulo: un
// test que calcule lo mismo que el código no sella nada. Si alguien mueve una
// cifra en config/niveles.js, esta lista es la que tiene que discrepar.
describe('1. Tablas selladas (v1.0 §3.3)', () => {
  const ESPERADAS = {
    basico:   [50, 100, 150, 250],
    avanzado: [100, 200, 300, 500],
    pro:      [200, 400, 600, 1000],
  }

  it('los tres niveles, en orden, con sus ids de contrato', () => {
    expect(NIVELES.map(n => n.id)).toEqual(['basico', 'avanzado', 'pro'])
  })

  it('los rótulos visibles son Básico · Avanzado · Pro', () => {
    expect(NIVELES.map(n => n.nombre)).toEqual(['Básico', 'Avanzado', 'Pro'])
  })

  it.each(Object.entries(ESPERADAS))('%s: los 4 montos exactos', (id, montos) => {
    expect(apuestasDe(id)).toEqual(montos)
  })

  it('cada nivel tiene exactamente 4 montos, todos enteros positivos', () => {
    for (const n of NIVELES) {
      expect(n.apuestas).toHaveLength(4)
      n.apuestas.forEach(m => {
        expect(Number.isInteger(m)).toBe(true)
        expect(m).toBeGreaterThan(0)
      })
    }
  })

  it('los montos de cada nivel van en orden ascendente', () => {
    for (const n of NIVELES) {
      expect(n.apuestas).toEqual([...n.apuestas].sort((a, b) => a - b))
    }
  })

  it('cada nivel trae descripción corta no vacía', () => {
    for (const n of NIVELES) expect(n.descripcion.trim().length).toBeGreaterThan(0)
  })

  it('12 montos en total', () => {
    expect(NIVELES.flatMap(n => n.apuestas)).toHaveLength(12)
  })
})

// ── 2. El solapamiento es INTENCIÓN, no descuido ─────────────────────────────
// v1.0 §3.3: el 100 vive en Básico y en Avanzado, el 200 en Avanzado y en Pro.
// Es la costura que permite subir de nivel SIN subir de apuesta. Este test
// existe para que nadie lo "arregle": si alguien deduplica las tablas, falla.
describe('2. Solapamiento sellado', () => {
  it('100 está en Básico y en Avanzado', () => {
    expect(apuestasDe('basico')).toContain(100)
    expect(apuestasDe('avanzado')).toContain(100)
  })

  it('200 está en Avanzado y en Pro', () => {
    expect(apuestasDe('avanzado')).toContain(200)
    expect(apuestasDe('pro')).toContain(200)
  })

  it('la escalera abarata la entrada: el mínimo de Básico es menor que el de hoy (100)', () => {
    expect(apuestasDe('basico')[0]).toBe(50)
    expect(apuestasDe('basico')[0]).toBeLessThan(apuestasDe('avanzado')[0])
  })

  it('las apuestas de hoy (100/200/300/500) son ahora las de Avanzado (v1.0 §3.2)', () => {
    expect(apuestasDe('avanzado')).toEqual([100, 200, 300, 500])
  })
})

// ── 3. Validez y normalización ───────────────────────────────────────────────
describe('3. Validez de nivel', () => {
  it('los tres ids son válidos', () => {
    ['basico', 'avanzado', 'pro'].forEach(id => expect(esNivelValido(id)).toBe(true))
  })

  it.each([
    ['nulo', null], ['indefinido', undefined], ['vacío', ''],
    ['desconocido', 'imposible'], ['con mayúsculas', 'Basico'],
    ['número', 3], ['objeto', {}],
  ])('%s → cae a Básico', (_caso, valor) => {
    expect(normalizarNivel(valor)).toBe(NIVEL_POR_DEFECTO)
  })

  it('un id válido se conserva tal cual', () => {
    expect(normalizarNivel('pro')).toBe('pro')
  })

  it('nivelPorId devuelve null para un id desconocido', () => {
    expect(nivelPorId('imposible')).toBeNull()
  })

  it('apuestasDe NUNCA devuelve vacío: un id desconocido cae a la tabla de Básico', () => {
    expect(apuestasDe('imposible')).toEqual(apuestasDe(NIVEL_POR_DEFECTO))
  })
})

// ── 4. Preselección y memoria (v1.0 §4.2) ────────────────────────────────────
describe('4. Preselección', () => {
  it('sin nada guardado → Básico (arranque en frío)', () => {
    expect(preseleccion(null)).toBe('basico')
  })

  it('con una elección guardada → esa misma', () => {
    expect(preseleccion('pro')).toBe('pro')
    expect(preseleccion('avanzado')).toBe('avanzado')
  })

  it('con basura guardada (storage manipulado) → Básico, sin romper', () => {
    expect(preseleccion('borrado-a-mano')).toBe('basico')
  })

  it('la clave sigue la convención del proyecto: ajilei.<cosa>', () => {
    expect(NIVEL_KEY).toBe('ajilei.nivel')
  })
})

// ── 5. El pasajero `nivelIA` (v1.0 §2.2, vía C) ──────────────────────────────
// NO se re-verifica que sobreviva a los retornos del motor: eso lo dejaron
// sellado NIV-0 §3 y la puerta extra del banco NIV-B0. Aquí sólo se prueba lo
// que esta tanda añade — que se cuelga, con qué valor y con qué default.
describe('5. Pasajero nivelIA', () => {
  it('se cuelga del estado con el nivel elegido', () => {
    const s = conNivel(createInitialState(50, 3), 'pro')
    expect(s.nivelIA).toBe('pro')
  })

  it('default: sin nivel → basico', () => {
    expect(conNivel(createInitialState(50, 2), undefined).nivelIA).toBe('basico')
    expect(conNivel(createInitialState(50, 2), null).nivelIA).toBe('basico')
  })

  it('un nivel desconocido no se cuela: se normaliza a basico', () => {
    expect(conNivel(createInitialState(50, 2), 'trampa').nivelIA).toBe('basico')
  })

  it('no altera NADA del estado que crea el motor', () => {
    const base = createInitialState(100, 4)
    const conP = conNivel(base, 'avanzado')
    for (const k of Object.keys(base)) {
      expect(conP[k]).toEqual(base[k])
    }
    // y sólo añade una clave
    expect(Object.keys(conP)).toHaveLength(Object.keys(base).length + 1)
  })

  it('el motor sigue sin conocerlo: createInitialState no lo produce por su cuenta', () => {
    expect(createInitialState(50, 2).nivelIA).toBeUndefined()
  })

  it('el monto elegido llega al estado como `unit` por la vía existente', () => {
    // La apuesta viaja por donde siempre: createInitialState(stake, N).
    for (const monto of apuestasDe('pro')) {
      expect(conNivel(createInitialState(monto, 5), 'pro').unit).toBe(monto)
    }
  })
})

// ── 5. CEL-1 · Puntos de ranking por nivel ───────────────────────────────────
// La tabla PLANA de `Modos_y_Asistencia_v1.0.md` §6.1, escrita a mano por la
// misma razón que los doce montos de arriba: un test que la derive del módulo
// no sella nada.
describe('5. Puntos de ranking vs IA (§6.1)', () => {
  it('la tabla sellada: Básico 1 · Avanzado 2 · Pro 3', () => {
    expect(puntosDe('basico')).toBe(1)
    expect(puntosDe('avanzado')).toBe(2)
    expect(puntosDe('pro')).toBe(3)
  })

  it('es PLANA: no depende del tamaño de la mesa', () => {
    // §6.1: "ganarle a cuatro IAs de Básico da lo mismo que ganarle a una".
    // La función no recibe N y no puede, por construcción, mirarlo.
    expect(puntosDe.length).toBe(1)
  })

  it('un id desconocido cae al nivel por defecto, jamás a undefined', () => {
    for (const basura of [null, undefined, '', 'leyenda', 42]) {
      expect(puntosDe(basura)).toBe(puntosDe(NIVEL_POR_DEFECTO))
    }
  })

  it('los tres niveles declaran sus puntos, sin huecos', () => {
    for (const n of NIVELES) expect(Number.isInteger(n.puntos)).toBe(true)
  })

  it('el cálculo de la pantalla: manos ganadas × puntos del nivel', () => {
    // Lo que pinta "Puntos obtenidos" en la tarjeta de victoria.
    const puntos = (ganadas, nivel) => ganadas * puntosDe(nivel)
    expect(puntos(0, 'basico')).toBe(0)
    expect(puntos(7, 'basico')).toBe(7)
    expect(puntos(7, 'avanzado')).toBe(14)
    expect(puntos(7, 'pro')).toBe(21)
  })
})
