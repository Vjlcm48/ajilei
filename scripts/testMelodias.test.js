/**
 * CEL-2 · La bolsa de melodías de celebración.
 * Rector: lámina CEL-2 · assets sellados en
 * docs/AJILEI_Fuentes_Audio_Celebracion_v1.0.md (CEL-A).
 *
 * Dos cosas que un descuido rompe en silencio y que sólo se cazan aquí:
 *   · un nombre mal escrito en la bolsa. En pantalla eso no es un error rojo:
 *     es una victoria SIN música, y nadie sabe si es que tocó el silencio. Por
 *     eso la lista se contrasta contra los archivos que hay en `public/sounds`.
 *   · la repetición. Ganar dos mesas seguidas con la misma melodía convierte la
 *     fiesta en un jingle, y se rompe una vez de cada siete.
 *
 * Ejecutar: npm test
 */
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  MELODIAS, MELODIA_KEY, MELODIA_VOLUMEN, MELODIA_MS,
  eligeMelodia, melodiaDe, fuentesDe, melodiaPara, recuerdaMelodia,
} from '../src/config/melodiasCelebracion.js'
import { eligeSinRepetir } from '../src/config/sinRepetir.js'
import { eligeIndice, FRASES_VICTORIA } from '../src/config/frasesVictoria.js'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('1. La bolsa', () => {
  it('son las siete de CEL-A, todas distintas', () => {
    expect(MELODIAS).toHaveLength(7)
    expect(new Set(MELODIAS).size).toBe(7)
  })

  it('los nombres sellados, al pie de la letra', () => {
    expect(MELODIAS).toEqual([
      'celebracion-gaita-01',
      'celebracion-joropo-01',
      'celebracion-latinjazz-01',
      'celebracion-percusion-01',
      'celebracion-solemne-01',
      'celebracion-brillante-01',
      'celebracion-fiesta-01',
    ])
  })

  it('convención en castellano y sin extensión en el nombre', () => {
    MELODIAS.forEach(n => {
      expect(n).toMatch(/^celebracion-[a-z0-9]+-\d{2}$/)
      expect(n).not.toMatch(/\.(mp3|ogg)$/)
    })
  })

  // LA PRUEBA QUE IMPORTA: la bolsa contra el disco. Una `s` de más en un
  // nombre no rompe nada en tiempo de compilación y deja la victoria muda.
  it('cada melodía existe en disco, en los DOS formatos', () => {
    MELODIAS.forEach(n => {
      const [mp3, ogg] = fuentesDe(n)
      expect(existsSync(join(RAIZ, 'public', mp3))).toBe(true)
      expect(existsSync(join(RAIZ, 'public', ogg))).toBe(true)
    })
  })

  it('las fuentes van mp3 primero y ogg después', () => {
    expect(fuentesDe('x')).toEqual(['/sounds/x.mp3', '/sounds/x.ogg'])
  })

  it('la clave de memoria sigue la convención de la casa', () => {
    expect(MELODIA_KEY).toBe('ajilei.melodiaCelebracion')
    expect(MELODIA_KEY.startsWith('ajilei.')).toBe(true)
  })

  it('el volumen y la duración son los sellados por CEL-A', () => {
    // 0,6 es el volumen de `table-knock.mp3`, que mide los mismos -20,0 LUFS:
    // así la melodía entra al nivel efectivo del toc-toc que la precede.
    expect(MELODIA_VOLUMEN).toBe(0.6)
    expect(MELODIA_MS).toBe(12000)
  })
})

describe('2. Nunca la misma dos veces', () => {
  it('jamás devuelve la última, sortee lo que sortee', () => {
    for (let ultima = 0; ultima < MELODIAS.length; ultima++) {
      for (let k = 0; k < 100; k++) {
        const i = eligeMelodia(ultima, k / 100)
        expect(i).not.toBe(ultima)
        expect(i).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThan(MELODIAS.length)
      }
    }
  })

  // Sin esto, "devolver siempre la 0 salvo cuando la última es la 0" pasaría la
  // prueba de arriba y la bolsa tendría dos piezas de siete.
  it('y alcanza a las SEIS restantes, no sólo a una', () => {
    for (let ultima = 0; ultima < MELODIAS.length; ultima++) {
      const vistas = new Set()
      for (let k = 0; k < 100; k++) vistas.add(eligeMelodia(ultima, k / 100))
      expect(vistas.size).toBe(MELODIAS.length - 1)
    }
  })

  it('sin memoria previa, entran las siete', () => {
    const vistas = new Set()
    for (let k = 0; k < 100; k++) vistas.add(eligeMelodia(null, k / 100))
    expect(vistas.size).toBe(MELODIAS.length)
  })

  it('una memoria corrupta se trata como "no hay memoria"', () => {
    for (const basura of [null, undefined, -1, 7, 99, 1.5, NaN, 'tres']) {
      const i = eligeMelodia(basura, 0.5)
      expect(Number.isInteger(i)).toBe(true)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(MELODIAS.length)
    }
  })

  it('un índice imposible cae a la primera y jamás a `undefined`', () => {
    expect(melodiaDe(99)).toBe(MELODIAS[0])
    expect(melodiaDe(-1)).toBe(MELODIAS[0])
    expect(melodiaDe(2)).toBe(MELODIAS[2])
  })
})

describe('3. Una sola regla para las dos bolsas', () => {
  // CEL-2 sacó la regla de `frasesVictoria` a `sinRepetir` para no tener dos
  // copias. Esto sella que la mudanza no cambió el comportamiento de las
  // frases ni en un caso: si alguien "mejora" una de las dos, discrepan aquí.
  it('las frases y las melodías sortean con la MISMA función', () => {
    for (let ultima = -1; ultima < FRASES_VICTORIA.length; ultima++) {
      for (let k = 0; k < 50; k++) {
        const u = ultima < 0 ? null : ultima
        expect(eligeIndice(u, k / 50)).toBe(eligeSinRepetir(FRASES_VICTORIA.length, u, k / 50))
      }
    }
  })

  it('una bolsa de una sola pieza repite, y no es un fallo', () => {
    // El caso límite existe: si algún día quedara una sola melodía, la regla
    // tiene que devolverla en vez de quedarse sin candidatas.
    expect(eligeSinRepetir(1, 0, 0.7)).toBe(0)
  })

  it('una bolsa vacía o imposible devuelve 0 en vez de romper', () => {
    expect(eligeSinRepetir(0, null, 0.5)).toBe(0)
    expect(eligeSinRepetir(-3, 1, 0.5)).toBe(0)
  })
})

describe('4. Sortear y recordar, separados', () => {
  // El sorteo vive en un inicializador de `useState`, y en desarrollo esos se
  // invocan dos veces. Si `melodiaPara` escribiera la memoria, la segunda
  // invocación —que evita a la primera porque lee lo que acaba de escribir—
  // dejaría guardada una pieza distinta de la que suena, y la victoria
  // siguiente podría repetir la que el jugador acaba de oír. Por eso devuelve
  // el índice en vez de guardarlo: guarda el efecto, con lo que de verdad sonó.
  it('el sorteo devuelve índice Y nombre, y cuadran entre sí', () => {
    for (let k = 0; k < 30; k++) {
      const p = melodiaPara(null)
      expect(Number.isInteger(p.indice)).toBe(true)
      expect(p.indice).toBeGreaterThanOrEqual(0)
      expect(p.indice).toBeLessThan(MELODIAS.length)
      expect(p.nombre).toBe(melodiaDe(p.indice))
    }
  })

  it('la pieza forzada llega SIN índice: no se recuerda', () => {
    expect(melodiaPara(3)).toEqual({ indice: null, nombre: MELODIAS[2] })
    expect(melodiaPara(1).nombre).toBe(MELODIAS[0])
    expect(melodiaPara(MELODIAS.length).nombre).toBe(MELODIAS[MELODIAS.length - 1])
  })

  it('un forzado fuera de rango vuelve al sorteo', () => {
    for (const n of [0, -1, 99, 1.5, NaN, null, undefined, 'dos']) {
      const p = melodiaPara(n)
      expect(Number.isInteger(p.indice)).toBe(true)
    }
  })

  it('recordar un índice imposible no hace nada y no revienta', () => {
    expect(() => recuerdaMelodia(null)).not.toThrow()
    expect(() => recuerdaMelodia('dos')).not.toThrow()
  })
})
