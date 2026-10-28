// RNK-1 1e §2.8 · las cuatro reglas del contador, el día de Chicago y el idioma del video.
import { describe, it, expect } from 'vitest'
import { CADA_ENTRADAS, decidir, diaChicago, videoDe, ENLACE_PLAY } from './sumaCore'

// Recorre entradas con el estado que guardaría el aparato; devuelve en qué
// entradas salió el video y el estado final.
function recorrer(estado, dias) {
  const salio = []
  let i = 0
  for (const hoy of dias) {
    i += 1
    const d = decidir({ n: estado.n, ultimoDia: estado.dia, hoy, premium: false })
    if (d.mostrar) salio.push(i)
    estado = { n: d.n, dia: d.ultimoDia }
  }
  return { salio, estado }
}

describe('RNK-1 1e · sumaCore', () => {
  it('el turno es cada 8', () => {
    expect(CADA_ENTRADAS).toBe(8)
  })

  it('el ejemplo del rector: lunes 20 entradas, martes 4 más', () => {
    const LUNES = '2026-10-26'
    const MARTES = '2026-10-27'
    // Lunes 1–7 nada, 8 video, 9–15 nada, 16 nada (día gastado) y reinicia, 17–20 → n 4.
    const lunes = recorrer({ n: 0, dia: null }, Array(20).fill(LUNES))
    expect(lunes.salio).toEqual([8])
    expect(lunes.estado).toEqual({ n: 4, dia: LUNES })
    // Martes: 21–23 nada; la 24 es el turno y el día está libre → video.
    const martes = recorrer(lunes.estado, Array(4).fill(MARTES))
    expect(martes.salio).toEqual([4])
    expect(martes.estado).toEqual({ n: 0, dia: MARTES })
  })

  it('la entrada 16 del mismo día: no sale, el contador vuelve a 0 y el día no cambia', () => {
    expect(decidir({ n: 7, ultimoDia: '2026-10-26', hoy: '2026-10-26' }))
      .toEqual({ mostrar: false, n: 0, ultimoDia: '2026-10-26' })
  })

  it('Premium nunca ve el video, y su turno también reinicia', () => {
    expect(decidir({ n: 7, ultimoDia: null, hoy: '2026-10-26', premium: true }))
      .toEqual({ mostrar: false, n: 0, ultimoDia: null })
    for (let n = 0; n < 7; n++) expect(decidir({ n, ultimoDia: null, hoy: 'x', premium: true }).mostrar).toBe(false)
  })

  it('un contador raro (negativo, no entero, ausente) cuenta desde 0', () => {
    expect(decidir({ n: -3, ultimoDia: null, hoy: 'h' }).n).toBe(1)
    expect(decidir({ n: 2.5, ultimoDia: null, hoy: 'h' }).n).toBe(1)
    expect(decidir({ ultimoDia: null, hoy: 'h' }).n).toBe(1)
    // Por encima del turno (si CADA_ENTRADAS baja algún día) es turno.
    expect(decidir({ n: 12, ultimoDia: null, hoy: 'h' }).mostrar).toBe(true)
  })

  it('diaChicago: las 23:30 y las 00:30 de Chicago son días distintos', () => {
    // 2026-10-27 23:30 CDT (UTC−5) = 04:30 Z del 28; 2026-10-28 00:30 CDT = 05:30 Z.
    expect(diaChicago(new Date('2026-10-28T04:30:00Z'))).toBe('2026-10-27')
    expect(diaChicago(new Date('2026-10-28T05:30:00Z'))).toBe('2026-10-28')
    // En invierno (CST, UTC−6) el corte se mueve una hora.
    expect(diaChicago(new Date('2026-12-01T05:30:00Z'))).toBe('2026-11-30')
    expect(diaChicago(new Date('2026-12-01T06:30:00Z'))).toBe('2026-12-01')
  })

  it('videoDe: es → el español; en, pt y cualquier otro → el inglés', () => {
    expect(videoDe('es')).toBe('/sumamente/sumamente_promo_es.mp4')
    expect(videoDe('en')).toBe('/sumamente/sumamente_promo_en.mp4')
    expect(videoDe('pt')).toBe('/sumamente/sumamente_promo_en.mp4')
    expect(videoDe(undefined)).toBe('/sumamente/sumamente_promo_en.mp4')
  })

  it('el enlace de Google Play es el de la ficha', () => {
    expect(ENLACE_PLAY).toBe('https://play.google.com/store/apps/details?id=com.heptacreation.sumamente')
  })
})
