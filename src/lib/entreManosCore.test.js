import { describe, expect, it } from 'vitest'
import { CANCELA_PEDIDO, RECARGA_PVP, pedidoEnLaPausa, recargaPvP, textoEnAnuncio, textoTarjeta } from './entreManosCore'
import { CORTE_VOZ } from './corteVoz'
import {
  CORTE_PASTILLA, ESPERA_SIGUIENTE_HOY_MS, RECOGE_MS, esperaSiguienteMano, recogerEnPvP, textoPastilla,
} from './transicionCore'
import '../lib/vistaAMesa'   // suma los textos `pvp.` al diccionario

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

  it('la voluntaria pedida en la mano se aplica en la pausa con el monto de ese momento, o se cancela sola', () => {
    expect(pedidoEnLaPausa({ pila: 700, entrada: 1500, ante: 0, saldo: 2400 })).toEqual({ aplica: true, monto: 800, motivo: null })
    // Ya no hace falta: en silencio. Sin saldo: se dice.
    expect(pedidoEnLaPausa({ pila: 1500, entrada: 1500, ante: 0, saldo: 2400 })).toEqual({ aplica: false, monto: 0, motivo: CANCELA_PEDIDO.PILA })
    expect(pedidoEnLaPausa({ pila: 1900, entrada: 1500, ante: 0, saldo: 2400 })).toEqual({ aplica: false, monto: 0, motivo: CANCELA_PEDIDO.PILA })
    expect(pedidoEnLaPausa({ pila: 200, entrada: 1500, ante: 0, saldo: 900 })).toEqual({ aplica: false, monto: 0, motivo: CANCELA_PEDIDO.SALDO })
  })

  it('quien volvió antes del anuncio lee cuántos siguen en él, sin contarse', () => {
    const conAnuncio = (flags) => flags.map((enAnuncio, i) => ({ name: ['Yo', 'Ana', 'Beto'][i], enAnuncio }))
    expect(textoEnAnuncio(conAnuncio([false, false, false]))).toBeNull()
    expect(textoEnAnuncio(conAnuncio([true, true, false]))).toBe('Ana sigue en el anuncio')
    expect(textoEnAnuncio(conAnuncio([false, true, true]))).toBe('2 jugadores siguen en el anuncio')
  })
})
