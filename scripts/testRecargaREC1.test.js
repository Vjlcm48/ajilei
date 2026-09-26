// ── REC-1 · La recarga como burbuja: el contrato puro ──────────────────────
// Rector: AJILEI_REC-1_Fase1_v1.0.md §3.1. Normativo: AJILEI_APU-1_Reglas_v1.2
// §5.5 y §10.
//
// Como el resto de la mesa, lo que se sella aquí vive en `mesaCore.js` porque
// este proyecto no tiene jsdom: el JSX sólo pinta lo que estas funciones dicen,
// y lo que pinta lo mide el modo `rec` de `diagDSK.mjs`.

import { describe, it, expect } from 'vitest'
import {
  RECARGA, APERTURA_SOLA_S, RED_REVELACION_MS,
  recargaLista, formaRecarga, abrirRecarga, plegarRecarga,
} from '../src/hooks/mesaCore.js'

describe('REC-1 · recargaLista (§5.5.1)', () => {
  it('sin vuelo previsto, lista en el acto', () => {
    expect(recargaLista({ vuelo: false, armada: false, descargada: false, ms: 0 })).toBe(true)
  })

  it('con vuelo, no hasta que se arma Y se descarga', () => {
    expect(recargaLista({ vuelo: true, armada: false, descargada: false, ms: 0 })).toBe(false)
    expect(recargaLista({ vuelo: true, armada: true, descargada: false, ms: 3000 })).toBe(false)
    expect(recargaLista({ vuelo: true, armada: true, descargada: true, ms: 3720 })).toBe(true)
  })

  it('descargada sin haberse armado no cuenta: es el render previo a armar', () => {
    expect(recargaLista({ vuelo: true, armada: false, descargada: true, ms: 10 })).toBe(false)
  })

  it('la red de 6 s: lista aunque la celebración no avise', () => {
    expect(RED_REVELACION_MS).toBe(6000)
    expect(recargaLista({ vuelo: true, armada: false, descargada: false, ms: RED_REVELACION_MS - 1 })).toBe(false)
    expect(recargaLista({ vuelo: true, armada: false, descargada: false, ms: RED_REVELACION_MS })).toBe(true)
    expect(recargaLista({ vuelo: true, armada: true, descargada: false, ms: RED_REVELACION_MS })).toBe(true)
  })
})

describe('REC-1 · formaRecarga (§5.5)', () => {
  const F = RECARGA.FORZOSA, A = RECARGA.AUTOMATICA, V = RECARGA.VOLUNTARIA

  it('la constante que cita el normativo', () => {
    expect(APERTURA_SOLA_S).toBe(5)
  })

  it('voluntaria: siempre tarjeta, sin plegar y sin plazo', () => {
    for (const seg of [0, 3, 15]) for (const abierta of [true, false]) {
      expect(formaRecarga({ seg, abierta, motivo: V })).toEqual({ forma: 'tarjeta', plegable: false })
    }
  })

  it('seg ≤ 0 → vence', () => {
    for (const m of [F, A]) {
      expect(formaRecarga({ seg: 0, abierta: false, motivo: m }).forma).toBe('vence')
      expect(formaRecarga({ seg: -1, abierta: true, motivo: m }).forma).toBe('vence')
    }
  })

  it('seg ≤ 5 → tarjeta fija, abierta o no', () => {
    for (const m of [F, A]) for (const abierta of [true, false]) for (const seg of [1, 5]) {
      expect(formaRecarga({ seg, abierta, motivo: m })).toEqual({ forma: 'tarjeta', plegable: false })
    }
  })

  it('abierta con más de 5 s → tarjeta plegable', () => {
    for (const m of [F, A]) for (const seg of [6, 15]) {
      expect(formaRecarga({ seg, abierta: true, motivo: m })).toEqual({ forma: 'tarjeta', plegable: true })
    }
  })

  it('sin abrir con más de 5 s → burbuja', () => {
    for (const m of [F, A]) for (const seg of [6, 15]) {
      expect(formaRecarga({ seg, abierta: false, motivo: m })).toEqual({ forma: 'burbuja', plegable: false })
    }
  })
})

describe('REC-1 · un solo reloj (§5.5.4 y §5.5.5)', () => {
  it('abrir y plegar no cambian seg: el reloj sigue su cuenta', () => {
    let r = { motivo: RECARGA.FORZOSA, monto: 500, abierta: false }
    const vistas = []
    for (let seg = 15; seg >= 1; seg--) {
      if (seg === 12) r = abrirRecarga(r)
      if (seg === 9) r = plegarRecarga(r, seg)
      if (seg === 8) r = abrirRecarga(r)
      if (seg === 3) r = plegarRecarga(r, seg)   // ya no se puede: se ignora
      vistas.push([seg, formaRecarga({ seg, abierta: r.abierta, motivo: r.motivo }).forma])
      expect(Object.keys(r).sort()).toEqual(['abierta', 'monto', 'motivo'])
    }
    expect(vistas.map(([s]) => s)).toEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
    expect(Object.fromEntries(vistas)).toMatchObject({
      15: 'burbuja', 13: 'burbuja', 12: 'tarjeta', 10: 'tarjeta', 9: 'burbuja',
      8: 'tarjeta', 6: 'tarjeta', 5: 'tarjeta', 3: 'tarjeta', 1: 'tarjeta',
    })
  })

  it('plegar a 5 s o menos no hace nada: la tarjeta queda fija', () => {
    const r = { motivo: RECARGA.AUTOMATICA, monto: 500, abierta: true }
    expect(plegarRecarga(r, 5)).toBe(r)
    expect(plegarRecarga(r, 6)).toEqual({ ...r, abierta: false })
  })

  it('la voluntaria no se pliega', () => {
    const r = { motivo: RECARGA.VOLUNTARIA, monto: 500, abierta: true }
    expect(plegarRecarga(r, 0)).toBe(r)
  })
})
