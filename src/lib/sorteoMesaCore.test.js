import { describe, expect, it } from 'vitest'
import { ETAPA, TEXTOS_SORTEO, BARAJADO_MIN_MS, PASO_MIN_MS, avanzaSorteo, inicioDeEtapa, lugarDeLaFranja, mensajeDelSorteo, ordenDeReparto } from './sorteoMesaCore'
import { aplicarAccion, crearPartida } from '../arbitro/index.js'
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

describe('5a · inicioDeEtapa: cada etapa empieza donde el árbitro la abrió', () => {
  it('barajado, reparto, elección y volteo, con el reclamo tardío de cada una', () => {
    const sillas = [0, 1, 2].map((i) => ({ asiento: i, uid: `u${i}`, nombre: `J${i}` }))
    let e = crearPartida({ apuesta: 100, entrada: 'corta', ritmo: 'normal' }, sillas, 1000)
    expect(inicioDeEtapa(e.vencimiento, e.sorteo.participan.length)).toBe(1000)
    for (const tarde of [300, 450, 0]) {
      const ahora = e.vencimiento.hora + tarde
      const r = aplicarAccion(e, { uid: 'u0', version: e.version, accion: 'reclamar_vencimiento' }, { ahora })
      e = r.estado
      expect(inicioDeEtapa(e.vencimiento, e.sorteo.participan.length)).toBe(ahora)
    }
    expect(e.sorteo.etapa).toBe('volteo')
  })

  it('sin vencimiento o fuera del sorteo, null', () => {
    expect(inicioDeEtapa(null, 2)).toBeNull()
    expect(inicioDeEtapa({ clase: 'turno', hora: 5 }, 2)).toBeNull()
  })
})

describe('5a · lugarDeLaFranja: no sale por encima del óvalo', () => {
  it('un óvalo bajo y ancho la deja con su medio alto dentro; uno alto, donde siempre', () => {
    expect(lugarDeLaFranja({ x: 0, y: 100, w: 600, h: 40 }, []).y).toBe(122)
    expect(lugarDeLaFranja({ x: 0, y: 100, w: 600, h: 400 }, []).y).toBe(300 - 48)
  })
})

describe('5a · avanzaSorteo: la ceremonia entera, acabando con el árbitro', () => {
  const D2 = 3495   // esperaRepartoSorteo(2)
  const paso = (previo, entrada, ahora) => avanzaSorteo(previo, { ronda: 1, participantes: 2, desfase: 0, ...entrada }, ahora)
  const barajado = { etapa: 'barajado', vencimiento: null }
  const reparto = (hora) => ({ etapa: 'reparto', vencimiento: { clase: 'reparto_sorteo', hora } })
  const eleccion = (inicio) => ({ etapa: 'eleccion', vencimiento: { clase: 'eleccion_sorteo', hora: inicio + 10000 } })

  it('a tiempo: el reparto empieza en la primera carta y casi a su paso', () => {
    let s = paso(null, barajado, 0)
    s = paso(s, reparto(1950 + D2), 2050)
    expect(s).toMatchObject({ etapa: 'reparto', t: 0 })
    expect(s.reparto.acelera).toBeCloseTo(D2 / (D2 - 100))
    expect(paso(s, reparto(1950 + D2), 1950 + D2).t).toBeCloseTo(D2)
  })

  it('tarde (4000, mesa de 5): ni una carta en su hueco al llegar; el reparto acelerado acaba con el árbitro', () => {
    const D5 = 7958
    const cinco = (previo, entrada, ahora) => paso(previo, { participantes: 5, ...entrada }, ahora)
    let s = cinco(null, barajado, 0)
    s = cinco(s, reparto(1950 + D5), 4000)
    expect(s).toMatchObject({ etapa: 'reparto', t: 0, barajadoMs: 1950 })
    expect(s.reparto.acelera).toBeCloseTo(D5 / (1950 + D5 - 4000))
    expect(cinco(s, eleccion(1950 + D5), 1950 + D5 + 1)).toMatchObject({ etapa: 'eleccion' })
  })

  it('muy tarde (6000): al paso mínimo, y la elección empieza cuando aterriza la última', () => {
    let s = paso(null, barajado, 0)
    s = paso(s, eleccion(1950 + D2), 6000)
    expect(s.reparto.acelera).toBeCloseTo(297.5 / PASO_MIN_MS)
    const fin = 6000 + D2 / (297.5 / PASO_MIN_MS)
    expect(paso(s, eleccion(1950 + D2), fin - 5).etapa).toBe('reparto')
    expect(paso(s, eleccion(1950 + D2), fin + 5).etapa).toBe('eleccion')
  })

  it('sin barajado visto (llega ya en el reparto): el barajado mínimo, con su abanico a ese ritmo', () => {
    const s = paso(null, reparto(9000), 5000)
    expect(s).toMatchObject({ etapa: 'barajado', barajadoMs: BARAJADO_MIN_MS })
    expect(paso(s, reparto(9000), 5000 + BARAJADO_MIN_MS)).toMatchObject({ etapa: 'reparto', t: 0 })
  })

  it('el volteo, en la hora del árbitro; una ronda nueva empieza de cero', () => {
    const s = paso(null, { etapa: 'volteo', vencimiento: { clase: 'volteo_sorteo', hora: 10000 } }, 6000)
    expect(s).toMatchObject({ etapa: 'volteo', t: 1000 })
    expect(avanzaSorteo(s, { ronda: 2, participantes: 2, ...barajado }, 7000)).toMatchObject({ ronda: 2, etapa: 'barajado', t: 0, reparto: null })
  })
})
