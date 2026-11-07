import { describe, expect, it } from 'vitest'
import { ETAPA, TEXTOS_SORTEO, mensajeDelSorteo, ordenDeReparto } from './sorteoMesaCore'
import { recortaNombre } from './corteVoz'

// MES-PvP L-M 1 · el orden del reparto, el mensaje del sorteo y el corte de nombres en la voz.

describe('ordenDeReparto: de la derecha del anfitrión hasta él, solo a quienes participan', () => {
  it('mesa de 2', () => {
    expect(ordenDeReparto(0, [0, 1], 2)).toEqual([1, 0])
  })
  it('mesa de 5, con el anfitrión en otro índice de la mesa rotada', () => {
    expect(ordenDeReparto(0, [0, 1, 2, 3, 4], 5)).toEqual([1, 2, 3, 4, 0])
    expect(ordenDeReparto(4, [0, 1, 2, 3, 4], 5)).toEqual([0, 1, 2, 3, 4])
  })
  it('desempate: solo los empatados, en el mismo orden', () => {
    expect(ordenDeReparto(4, [2, 3, 4], 5)).toEqual([2, 3, 4])
  })
})

describe('mensajeDelSorteo', () => {
  const empate2 = TEXTOS_SORTEO.empate.replace('{n}', '2')
  // Ronda 1 empatada entre los asientos 1 y 2; la ronda 2 es su desempate.
  const r1 = { ronda: 1, mano: null, empatados: [1, 2], azar: false, volteo: [0, 1, 2].map((asiento) => ({ asiento })) }
  const ronda2 = (etapa, rondas = [r1]) => ({ ronda: 2, etapa, participan: [1, 2], yaEligieron: [], rondas })

  it('quien está en el desempate: la invitación al elegir', () => {
    const s = { ...ronda2(ETAPA.ELECCION), participan: [0, 1] }
    expect(mensajeDelSorteo({ ...s, rondas: [{ ...r1, empatados: [0, 1] }] }, 0)).toBe(TEXTOS_SORTEO.elige)
  })
  it('quien está fuera: el empate hasta que las cartas están boca arriba', () => {
    expect(mensajeDelSorteo(ronda2(ETAPA.REPARTO), 0)).toBe(empate2)
    expect(mensajeDelSorteo(ronda2(ETAPA.ELECCION), 0)).toBe(empate2)
    const r2 = { ronda: 2, mano: 1, empatados: [], azar: false, volteo: [{ asiento: 1 }, { asiento: 2 }] }
    expect(mensajeDelSorteo(ronda2(ETAPA.VOLTEO, [r1, r2]), 0)).toBe(empate2)
    expect(mensajeDelSorteo(ronda2(ETAPA.VOLTEO, [r1, r2]), 5000)).toBe(TEXTOS_SORTEO.mano)
  })
  it('tercer empate: el azar decide y luego el veredicto', () => {
    const r3 = { ronda: 3, mano: 2, empatados: [1, 2], azar: true, volteo: [{ asiento: 1 }, { asiento: 2 }] }
    const s = { ronda: 3, etapa: ETAPA.VOLTEO, participan: [1, 2], yaEligieron: [1, 2], rondas: [r1, r3] }
    expect(mensajeDelSorteo(s, 1000)).toBe(TEXTOS_SORTEO.azar)
    expect(mensajeDelSorteo(s, 3000)).toBe(TEXTOS_SORTEO.mano)
  })
})

describe('recortaNombre: 10 caracteres y «…»; el que cabe no se toca', () => {
  it('corta, no toca y sin corte deja el nombre', () => {
    expect(recortaNombre('WWWWWWWWWWWWWWW', 10)).toBe('WWWWWWWWWW…')
    expect(recortaNombre('Victor', 10)).toBe('Victor')
    expect(recortaNombre('WWWWWWWWWWWWWWW', 0)).toBe('WWWWWWWWWWWWWWW')
  })
})
