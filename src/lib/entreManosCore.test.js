import { describe, expect, it } from 'vitest'
import { CLASES, RECARGA_VISTA } from '../arbitro/index.js'
import { PHASES } from '../engine/gameEngine'
import { CLASES_PAUSA_RECARGA, RECARGA_PVP, recargaDeVista, recargaPvP, textoEnAnuncio, textoTarjeta } from './entreManosCore'
import { CORTE_VOZ } from './corteVoz'
import {
  CORTE_PASTILLA, ESPERA_SIGUIENTE_HOY_MS, RECOGE_MS, esperaSiguienteMano, recogerEnPvP, textoPastilla,
} from './transicionCore'
import '../lib/vistaAMesa'   // suma los textos `pvp.` al diccionario
import { MARGEN_VENCIMIENTO_MS } from './partidaCliente'
import { OFERTA_RECARGA_MS } from '../config/esperas'

// MES-PvP L-M 3 · entre una mano y otra (ficha LM-3 §1–§3, con las decisiones del STOP-L).
describe('L-M 3 · entre una mano y otra', () => {
  const players = [{ name: 'Yo' }, { name: 'Ana' }, { name: 'W'.repeat(15) }]

  it('la pastilla dice de quién es la Mano desde la mano 2, en segunda persona la propia y con el corte de 10', () => {
    expect(textoPastilla({ handCount: 1, manoIndex: 1, players })).toBeNull()
    expect(textoPastilla({ handCount: 7, manoIndex: 1, players })).toBe('Mano 7 · Es Mano Ana')
    expect(textoPastilla({ handCount: 7, manoIndex: 0, players })).toBe('Mano 7 · Eres Mano')
    expect(textoPastilla({ handCount: 3, manoIndex: 2, players })).toBe(`Mano 3 · Es Mano ${'W'.repeat(10)}…`)
  })

  // El corte de la pastilla vive copiado en `transicionCore` (trozo de la mesa) para no compartir
  // trozo con el PvP (1.8b). Ninguno de los dos módulos importa al otro: lo ancla esta prueba.
  it('el corte de la pastilla es el de la voz PvP (`CORTE_VOZ`)', () => {
    expect(CORTE_PASTILLA).toBe(CORTE_VOZ)
  })

  it('contra las IAS la mano nueva espera la recogida (b), nunca menos que hoy; en PvP cae antes de vencer la pausa', () => {
    expect(esperaSiguienteMano()).toBe(Math.max(ESPERA_SIGUIENTE_HOY_MS, RECOGE_MS))
    expect(recogerEnPvP({ clase: 'mano_siguiente', hora: 10_000 }, 200)).toBe(10_000 - 200 - RECOGE_MS)
    expect(recogerEnPvP({ clase: 'turno', hora: 10_000 })).toBeNull()
    expect(recogerEnPvP(null)).toBeNull()
  })

  it('la recarga PvP es un solo monto hasta la entrada, ofrecida si no cubre el ante, y sin saldo no se recarga', () => {
    expect(recargaPvP({ pila: 1500, entrada: 1500, ante: 100, saldo: 9000 })).toBeNull()
    expect(recargaPvP({ pila: 900, entrada: 1500, ante: 100, saldo: 2400 }))
      .toEqual({ tipo: RECARGA_PVP.VOLUNTARIA, pila: 900, monto: 600, entrada: 1500, saldo: 2400, alcanza: true, saldoDespues: 1800 })
    expect(recargaPvP({ pila: 50, entrada: 1500, ante: 100, saldo: 2400 }).tipo).toBe(RECARGA_PVP.OFRECIDA)
    const sin = recargaPvP({ pila: 0, entrada: 1500, ante: 100, saldo: 900 })
    expect(sin.alcanza).toBe(false)
    expect(sin.saldoDespues).toBe(900)
  })

  it('la tarjeta dice «para seguir en la mesa» con la pila en 0 y «para volver a…» con pila', () => {
    expect(textoTarjeta(recargaPvP({ pila: 0, entrada: 1500, ante: 100, saldo: 2400 })))
      .toBe('Recargar 1.500 HC para seguir en la mesa. Te quedarán 900 HC.')
    expect(textoTarjeta(recargaPvP({ pila: 900, entrada: 1500, ante: 100, saldo: 2400 })))
      .toBe('Recargar 600 HC para volver a 1.500 HC. Te quedarán 1.800 HC.')
    expect(textoTarjeta(recargaPvP({ pila: 0, entrada: 1500, ante: 100, saldo: 900 }))).toBe('Tu saldo no alcanza para recargar.')
  })

  // v1.3-b · la capa lee la vista del árbitro. Los literales de la vista (fases, clases, la marca
  // pública) se anclan contra el árbitro de verdad.
  it('recargaDeVista: oferta en la pausa, sentado fuera, voluntaria en la mano, retención y cancelación', () => {
    expect(CLASES_PAUSA_RECARGA).toEqual({
      MANO_SIGUIENTE: CLASES.MANO_SIGUIENTE, PAUSA_ANUNCIO: CLASES.PAUSA_ANUNCIO, OFERTA_RECARGA: CLASES.OFERTA_RECARGA,
    })
    expect(RECARGA_VISTA.DECIDE).toBe('decide')
    const privada = (cambios) => ({ monto: 1500, oferta: true, pedida: false, cancelada: null, recargas: 0, ...cambios })
    const jugador = (cambios) => ({ name: 'Ana', abandonado: false, eliminated: false, cobrado: null, folded: false, numCartas: 5, recarga: null, chips: 1500, ...cambios })
    // La mesa de 3 (dos cubren el ante sin el propio: no hay retención); `resto: []`, la de 2.
    const vista = ({ clase = CLASES.MANO_SIGUIENTE, phase = PHASES.PAYOUT, yo = {}, otro = {}, recarga = privada(), resto = [jugador({ name: 'Caro' })], revelacion = [{}] } = {}) => ({
      asiento: 0, phase, handCount: 4, unit: 100, vencimiento: { clase, hora: 9000 }, resultado: { revelacion },
      players: [jugador({ recarga: 'decide', chips: 0, ...yo }), jugador({ name: 'Beto', ...otro }), ...resto], recarga,
    })
    const leer = (v, saldo = 2400) => recargaDeVista(v, { saldo, entrada: 1500 })

    // Quebró: la oferta en la pausa, con la lectura de la revelación.
    expect(leer(vista())).toMatchObject({
      pausa: true, fuera: false, enMano: false, vence: 9000, revelacion: true, totalSeg: 4, espera: null, mano: 4, cancelada: null,
    })
    expect(leer(vista()).oferta).toEqual({ tipo: 'ofrecida', pila: 0, monto: 1500, entrada: 1500, saldo: 2400, alcanza: true, saldoDespues: 900 })
    // Sentado fuera, durante la mano: sin cartas, la oferta sigue y «Recargar» la deja pedida.
    const fuera = leer(vista({ clase: CLASES.TURNO, phase: PHASES.BET_1, yo: { recarga: 'fuera', folded: true, numCartas: 0 } }))
    expect(fuera).toMatchObject({ pausa: false, fuera: true, enMano: false, vence: null })
    expect(fuera.oferta.tipo).toBe('ofrecida')
    // Voluntaria en la mano: se pide.
    const mano = leer(vista({ clase: CLASES.TURNO, phase: PHASES.BET_1, yo: { recarga: null }, recarga: privada({ monto: 600, oferta: false, pedida: true }) }))
    expect(mano).toMatchObject({ enMano: true, pedida: true })
    expect(mano.oferta).toMatchObject({ tipo: 'voluntaria', pila: 900, monto: 600 })
    // La retención: la mesa espera a quien decide, con el anillo de 15 s.
    const espera = leer(vista({ clase: CLASES.OFERTA_RECARGA, yo: { recarga: null }, otro: { recarga: 'decide' }, recarga: privada({ monto: 0, oferta: false }) }))
    expect(espera).toMatchObject({ pausa: true, oferta: null, espera: 'Beto', totalSeg: 15 })
    // La cancelación por saldo: una clave por mano, y la tarjeta dice que no alcanza.
    const cancelada = leer(vista({ yo: { recarga: null }, recarga: privada({ monto: 800, oferta: false, cancelada: { motivo: 'saldo', mano: 4 } }) }), 100)
    expect(cancelada.cancelada).toBe('saldo:4')
    expect(textoTarjeta(cancelada.oferta)).toBe('Tu saldo no alcanza para recargar.')
    // R-4 (sin recarga en la vista), quien ya cobró, el sorteo y el fin: nada.
    expect(leer(vista({ recarga: null }))).toBeNull()
    expect(leer(vista({ yo: { cobrado: 40 } }))).toBeNull()
    expect(leer(vista({ phase: 'SORTEO' }))).toBeNull()
    expect(leer(vista({ phase: PHASES.GAME_OVER }))).toBeNull()

    // Túnel del v1.3 · UN SOLO ANILLO. En la mesa de 2 la retención se ve venir en la pausa: el
    // anillo va hasta su final (la pausa, el reclamo del primer teléfono y los 15 s) y sigue igual
    // en ella. Con revelación, desde la lectura (2 s); sin ella, desde la pausa entera (4 s).
    const tras = MARGEN_VENCIMIENTO_MS + OFERTA_RECARGA_MS
    const dos = { resto: [] }
    expect(leer(vista(dos))).toMatchObject({ retencion: true, anillo: true, finPausa: 9000, vence: 9000 + tras, totalSeg: 18 })
    expect(leer(vista({ ...dos, revelacion: null }))).toMatchObject({ retencion: true, vence: 9000 + tras, totalSeg: 20 })
    expect(leer(vista({ ...dos, clase: CLASES.OFERTA_RECARGA }))).toMatchObject({ retencion: true, finPausa: 9000, vence: 9000, totalSeg: 18 })
    // Mesa de 3: retiene solo si, sin el propio, cubren el ante menos de 2 (como `resolverOfertas`).
    expect(leer(vista())).toMatchObject({ retencion: false, vence: 9000, totalSeg: 4 })
    expect(leer(vista({ resto: [jugador({ name: 'Caro', abandonado: true })] })).retencion).toBe(true)
    expect(leer(vista({ resto: [jugador({ name: 'Caro', eliminated: true })] })).retencion).toBe(true)
    expect(leer(vista({ resto: [jugador({ name: 'Caro', chips: 99 })] })).retencion).toBe(true)
    expect(leer(vista({ resto: [jugador({ name: 'Caro', chips: 100 })] })).retencion).toBe(false)
    // Quien espera (no decide) no tiene anillo único: los 15 s de siempre.
    expect(leer(vista({ ...dos, clase: CLASES.OFERTA_RECARGA, yo: { recarga: null, chips: 1500 }, otro: { recarga: 'decide', chips: 0 }, recarga: privada({ monto: 0, oferta: false }) })))
      .toMatchObject({ retencion: false, totalSeg: 15 })
    // La pausa de anuncio (mesas de 3 o más): la burbuja sin anillo.
    expect(leer(vista({ clase: CLASES.PAUSA_ANUNCIO }))).toMatchObject({ anillo: false, retencion: false })
    expect(leer(vista()).anillo).toBe(true)
  })

  it('quien volvió antes del anuncio lee cuántos siguen en él, sin contarse', () => {
    const conAnuncio = (flags) => flags.map((enAnuncio, i) => ({ name: ['Yo', 'Ana', 'Beto'][i], enAnuncio }))
    expect(textoEnAnuncio(conAnuncio([false, false, false]))).toBeNull()
    expect(textoEnAnuncio(conAnuncio([true, true, false]))).toBe('Ana sigue en el anuncio')
    expect(textoEnAnuncio(conAnuncio([false, true, true]))).toBe('2 jugadores siguen en el anuncio')
  })
})
