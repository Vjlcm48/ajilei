import { describe, it, expect } from 'vitest'
import {
  REACCIONES, emojiDe, textoDe, codepointDe, rutaEmoji,
  REACCION_ENTRADA_MS, REACCION_VISIBLE_MS, REACCION_SALIDA_MS, REACCION_TOTAL_MS,
} from '../src/config/reacciones.js'

// ── DSK-U2c · las derivaciones del contenido sellado, selladas ───────────────
// Doctrina v1.3 §4.2: lo que puede ser cierto sin un navegador delante se prueba
// SIN navegador. Estas tres funciones deciden qué imagen pinta cada frase; si se
// equivocan, la burbuja enseña el emoji de otra reacción y ninguna puerta de
// geometría lo notaría. El arnés queda para lo que sólo existe en la página.

describe('contenido sellado', () => {
  it('son doce, únicas y sin espacios de borde', () => {
    expect(REACCIONES).toHaveLength(12)
    expect(new Set(REACCIONES).size).toBe(12)
    REACCIONES.forEach(f => expect(f).toBe(f.trim()))
  })

  it('lleva las dos sustituciones de v1.4 §3 y ninguno de los dos retirados', () => {
    expect(REACCIONES[0]).toBe('¡Ajilei! ♠️')
    expect(REACCIONES[10]).toBe('¡Qué va! 🙄')
    // 🎴 (1f3b4) y 🤦 (1f926) no existen en el catálogo animado: la regla dura
    // es 12/12, y volver a colarlos dejaría el set mixto.
    expect(REACCIONES.join(' ')).not.toContain('🎴')
    expect(REACCIONES.join(' ')).not.toContain('🤦')
  })

  it('cada frase termina en emoji y ninguna lo lleva en medio', () => {
    REACCIONES.forEach(f => {
      expect(emojiDe(f)).not.toBe('')
      expect(f.endsWith(emojiDe(f))).toBe(true)
      // El texto del piso 1 queda limpio de pictogramas.
      expect(/\p{Extended_Pictographic}/u.test(textoDe(f))).toBe(false)
    })
  })
})

describe('derivaciones', () => {
  it('textoDe devuelve la frase sin el emoji ni el espacio que lo separaba', () => {
    expect(textoDe('¡Ajilei! ♠️')).toBe('¡Ajilei!')
    expect(textoDe('Camarita, te estoy mirando 👀')).toBe('Camarita, te estoy mirando')
    expect(textoDe('¡Qué va! 🙄')).toBe('¡Qué va!')
  })

  it('recompone: textoDe + espacio + emojiDe es la frase original', () => {
    REACCIONES.forEach(f => expect(`${textoDe(f)} ${emojiDe(f)}`).toBe(f))
  })

  it('codepointDe sigue el esquema de Noto, con y sin selector de variación', () => {
    // ♠️ es U+2660 + U+FE0F: el selector de variación cuenta y va en la clave.
    expect(codepointDe('¡Ajilei! ♠️')).toBe('2660_fe0f')
    // 🙄 es un solo codepoint fuera del BMP: un par suplente mal leído daría
    // "d83d_de44" en vez de "1f644", que es justo el error que esto sella.
    expect(codepointDe('¡Qué va! 🙄')).toBe('1f644')
    expect(codepointDe('Camarita, te estoy mirando 👀')).toBe('1f440')
  })

  it('las doce claves son distintas — dos frases no pueden compartir dibujo', () => {
    const claves = REACCIONES.map(codepointDe)
    expect(new Set(claves).size).toBe(12)
    claves.forEach(k => expect(k).toMatch(/^[0-9a-f]+(_[0-9a-f]+)*$/))
  })

  it('rutaEmoji apunta al recurso AUTOALOJADO, nunca a gstatic', () => {
    REACCIONES.forEach(f => {
      expect(rutaEmoji(f, 'svg')).toBe(`/emoji/${codepointDe(f)}.svg`)
      expect(rutaEmoji(f, 'avif')).toBe(`/emoji/${codepointDe(f)}.avif`)
      expect(rutaEmoji(f, 'avif')).not.toContain('gstatic')
    })
  })

  it('no revientan con una frase sin emoji', () => {
    expect(emojiDe('sin nada')).toBe('')
    expect(textoDe('sin nada')).toBe('sin nada')
    expect(codepointDe('sin nada')).toBe('')
  })
})

describe('ciclo de vida', () => {
  it('el total es la suma de los tres tramos, y vive una sola vez', () => {
    expect(REACCION_TOTAL_MS).toBe(REACCION_ENTRADA_MS + REACCION_VISIBLE_MS + REACCION_SALIDA_MS)
    expect(REACCION_TOTAL_MS).toBe(3000)
  })

  it('los dos topes del keyframe son el reparto exacto del total', () => {
    // El CSS no repite ninguna cifra de tiempo: sólo reparte. Si alguien
    // cambia los tramos, estos dos porcentajes son lo único que revisar allí.
    expect(REACCION_ENTRADA_MS / REACCION_TOTAL_MS).toBeCloseTo(0.10, 5)
    expect((REACCION_ENTRADA_MS + REACCION_VISIBLE_MS) / REACCION_TOTAL_MS).toBeCloseTo(0.90, 5)
  })

  it('límite conocido y aceptado: 🙄 dura más que la ventana visible', () => {
    // 2,94s de animación contra 2,4s visibles (v1.4 §2). No se compensa ni se
    // alarga la burbuja: se registra para no descubrirlo dos veces.
    expect(REACCION_VISIBLE_MS).toBe(2400)
    expect(2940).toBeGreaterThan(REACCION_VISIBLE_MS)
  })
})
