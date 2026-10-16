import { describe, it, expect } from 'vitest'
import { nombreLimpio, nombreValido, avisoDelNombre, AVISO_NOMBRE, PAUSA_AVISO_MS } from './bautizoCore'

// ── IOS-1c · el nombre del Bautizo (S6, lámina `laminas/ios1c`, f2) ─────────

describe('IOS-1c · el nombre recortado', () => {
  it('los espacios del principio y del final no cuentan', () => {
    expect(nombreLimpio('  victor ')).toBe('victor')
    expect(nombreValido('victor ')).toBe(true)
    expect(nombreValido(' victor')).toBe(true)
  })

  it('un espacio en medio, una ñ o un acento no valen', () => {
    expect(nombreValido('vic tor')).toBe(false)
    expect(nombreValido('señor_7')).toBe(false)
    expect(nombreValido('andrés_9')).toBe(false)
  })
})

describe('IOS-1c · cuándo sale el aviso', () => {
  it('el texto y la pausa aprobados', () => {
    expect(AVISO_NOMBRE).toBe('De 6 a 15 letras, números o _, sin espacios')
    expect(PAUSA_AVISO_MS).toBe(1200)
  })

  it('nunca con el campo vacío ni con un nombre válido (tampoco con el espacio final)', () => {
    for (const pausado of [false, true]) {
      expect(avisoDelNombre('', { pausado })).toBe(false)
      expect(avisoDelNombre('   ', { pausado })).toBe(false)
      expect(avisoDelNombre('victor', { pausado })).toBe(false)
      expect(avisoDelNombre('victor ', { pausado })).toBe(false)
    }
  })

  it('al instante con un carácter no permitido', () => {
    expect(avisoDelNombre('vic tor')).toBe(true)
    expect(avisoDelNombre('señ')).toBe(true)
    expect(avisoDelNombre('andré')).toBe(true)
  })

  it('si sólo es corto, cuando el jugador para de escribir o sale del campo', () => {
    expect(avisoDelNombre('victo')).toBe(false)
    expect(avisoDelNombre('victo', { pausado: true })).toBe(true)
  })
})
