/**
 * CEL-1 · Banco de frases de victoria de mesa.
 * Rector: lámina CEL-1 (composición) · contenido exacto en la instrucción.
 *
 * Lo que hay que sellar aquí no es "sale una frase": es que NO SE REPITE la
 * última, que es la única regla del encargo que un descuido puede romper en
 * silencio (se rompe una vez de cada ocho, y en una pantalla que el jugador ve
 * cada varios minutos eso no se caza jugando).
 *
 * Ejecutar: npm test
 */
import { describe, it, expect } from 'vitest'

import {
  FRASES_VICTORIA, FRASE_KEY, eligeIndice, fraseDe, frasePara, recuerdaFrase,
} from '../src/config/frasesVictoria.js'

describe('1. El banco', () => {
  it('son ocho, todas distintas y ninguna vacía', () => {
    expect(FRASES_VICTORIA).toHaveLength(8)
    expect(new Set(FRASES_VICTORIA).size).toBe(8)
    FRASES_VICTORIA.forEach(f => expect(f.trim().length).toBeGreaterThan(0))
  })

  // El contenido va A MANO, como los montos de niveles: si alguien cambia una
  // frase en el config, esta lista es la que tiene que discrepar.
  it('el contenido sellado, al pie de la letra', () => {
    expect(FRASES_VICTORIA).toEqual([
      '¡Barriste la mesa, mi pana!',
      '¡Te la comiste! La mesa quedó limpia.',
      '¡Épale! Aquí no quedó nadie parado.',
      '¡Sobrado! Todas las Heptacoins son tuyas.',
      '¡Se acabó lo que se daba… y te lo llevaste todo!',
      '¡Qué molleja! Arrasaste con la mesa.',
      '¡Campeón de la mesa! No les dejaste ni una.',
      '¡Ganaste la mesa! Eres el último con Heptacoins.',
    ])
  })

  it('la clave de memoria sigue la convención del proyecto', () => {
    expect(FRASE_KEY).toBe('ajilei.fraseVictoria')
  })
})

describe('2. La regla: aleatoria pero nunca la última', () => {
  const N = FRASES_VICTORIA.length

  it('sin última, el sorteo cubre las OCHO y ninguna se sale del banco', () => {
    const vistos = new Set()
    for (let k = 0; k < N; k++) vistos.add(eligeIndice(null, k / N))
    expect([...vistos].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('con última, JAMÁS la repite — barrido exhaustivo de las 8×N combinaciones', () => {
    for (let ultima = 0; ultima < N; ultima++) {
      const vistos = new Set()
      // 100 muestras por cada `ultima`: cubre el rango de `aleatorio` con
      // holgura y no depende de Math.random.
      for (let k = 0; k < 100; k++) {
        const i = eligeIndice(ultima, k / 100)
        expect(i).not.toBe(ultima)
        expect(i).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThan(N)
        vistos.add(i)
      }
      // Y cubre las SIETE restantes: no se limita a esquivar la última
      // devolviendo siempre la misma.
      expect(vistos.size).toBe(N - 1)
    }
  })

  it('el borde de aleatorio = 1 no se sale del banco', () => {
    // Math.random() nunca devuelve 1, pero un llamador futuro podría.
    expect(eligeIndice(null, 1)).toBeLessThan(N)
    for (let u = 0; u < N; u++) expect(eligeIndice(u, 1)).toBeLessThan(N)
  })

  it('una última corrupta se trata como "no hay última", no como un fallo', () => {
    for (const basura of [null, undefined, -1, 99, 1.5, 'tres', NaN]) {
      const i = eligeIndice(basura, 0.5)
      expect(Number.isInteger(i)).toBe(true)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(N)
    }
  })
})

describe('3. Índice → frase', () => {
  it('devuelve la frase de su índice', () => {
    FRASES_VICTORIA.forEach((f, i) => expect(fraseDe(i)).toBe(f))
  })

  it('un índice imposible cae a la primera, jamás a undefined', () => {
    // Una pantalla de victoria que pinta "undefined" es peor que una repetida.
    for (const basura of [-1, 8, 999, null, undefined]) {
      expect(fraseDe(basura)).toBe(FRASES_VICTORIA[0])
    }
  })
})

describe('4. La frase forzada del molde (?cel&frase=n)', () => {
  it('el parámetro es 1-based y devuelve exactamente esa frase', () => {
    for (let n = 1; n <= FRASES_VICTORIA.length; n++) {
      expect(frasePara(n).texto).toBe(FRASES_VICTORIA[n - 1])
    }
  })

  it('fuera de rango o ausente, sortea del banco', () => {
    for (const n of [0, 9, -3, null, undefined, 2.5]) {
      expect(FRASES_VICTORIA).toContain(frasePara(n).texto)
    }
  })
})

describe('5. CEL-2c · Sortear y recordar, separados', () => {
  // El defecto que esto cierra: el sorteo vivía en un inicializador de
  // `useState`, que en desarrollo se invoca dos veces, y como escribía la
  // memoria, la segunda invocación esquivaba a la primera y dejaba recordada
  // una frase distinta de la mostrada. La siguiente victoria podía repetir la
  // que el jugador acababa de leer.
  it('el sorteo devuelve índice Y texto, y cuadran entre sí', () => {
    for (let k = 0; k < 40; k++) {
      const f = frasePara(null)
      expect(Number.isInteger(f.indice)).toBe(true)
      expect(f.indice).toBeGreaterThanOrEqual(0)
      expect(f.indice).toBeLessThan(FRASES_VICTORIA.length)
      expect(f.texto).toBe(fraseDe(f.indice))
    }
  })

  it('la frase forzada llega SIN índice: no se recuerda', () => {
    expect(frasePara(5)).toEqual({ indice: null, texto: FRASES_VICTORIA[4] })
  })

  it('recordar un índice imposible no hace nada y no revienta', () => {
    expect(() => recuerdaFrase(null)).not.toThrow()
    expect(() => recuerdaFrase('tres')).not.toThrow()
  })
})
