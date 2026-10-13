import { describe, it, expect } from 'vitest'
import {
  TOPE_TIC_MS, CONSEJOS, PASO_CONSEJO_MS, FASES,
  sumarVisible, consejoDe, faltanS, progreso, daTiempo,
  estadoTras, msHastaReinicio, tiempoPartes, contadorDe, sinVideosHoy, tocaReleer,
  alPedir, AL_PEDIR, alCobrar, AL_COBRAR, esperaCobro, cobroSalible, ESPERAS_COBRO_MS, celebracionDe,
  TIEMPOS_CEL,
} from './videoCore'
import { TEXTOS_ES } from '../config/textos.es'

// ── ECO-1g · las reglas puras del video de recompensa ───────────────────────

describe('ECO-1g · videoCore · el tiempo visible (G4, G7, G8)', () => {
  it('sólo suma corriendo y a la vista', () => {
    expect(sumarVisible(1000, 100, { fase: FASES.CORRIENDO, oculto: false })).toBe(1100)
    expect(sumarVisible(1000, 100, { fase: FASES.CORRIENDO, oculto: true })).toBe(1000)
    expect(sumarVisible(1000, 100, { fase: FASES.CONFIRMA, oculto: false })).toBe(1000)
    expect(sumarVisible(1000, 100, { fase: FASES.PAUSA, oculto: false })).toBe(1000)
  })

  it('el primer tic al volver no regala lo que pasó a oscuras', () => {
    expect(sumarVisible(5000, 20000, { fase: FASES.CORRIENDO, oculto: false })).toBe(5000 + TOPE_TIC_MS)
    expect(sumarVisible(5000, -5, { fase: FASES.CORRIENDO, oculto: false })).toBe(5000)
  })

  it('«Faltan N s» va hacia arriba y nunca es negativo', () => {
    expect(faltanS(40000, 0)).toBe(40)
    expect(faltanS(40000, 1)).toBe(40)
    expect(faltanS(40000, 39001)).toBe(1)
    expect(faltanS(40000, 40000)).toBe(0)
    expect(faltanS(40000, 41000)).toBe(0)
    expect(progreso(40000, 10000)).toBe(0.25)
    expect(progreso(40000, 50000)).toBe(1)
  })

  it('G10 · los consejos rotan cada 6,5 s y empiezan por uno distinto', () => {
    expect(consejoDe(0, 0)).toBe(0)
    expect(consejoDe(0, PASO_CONSEJO_MS - 1)).toBe(0)
    expect(consejoDe(0, PASO_CONSEJO_MS)).toBe(1)
    expect(consejoDe(3, 0)).toBe(3)
    expect(consejoDe(7, PASO_CONSEJO_MS)).toBe(0)
    // Un video de 40 s enseña siete: 0, 6,5 … 39 s.
    const vistos = new Set(Array.from({ length: 400 }, (_, i) => consejoDe(2, i * 100)))
    expect(vistos.size).toBe(7)
    // Y hay un texto para cada uno de los ocho.
    for (let i = 1; i <= CONSEJOS; i++) expect(typeof TEXTOS_ES[`video.consejo.${i}`]).toBe('string')
    expect(TEXTOS_ES[`video.consejo.${CONSEJOS + 1}`]).toBeUndefined()
  })

  it('tras una pausa larga: si ya no da tiempo antes de que caduque, no se sigue', () => {
    const ahora = 1_000_000
    expect(daTiempo(ahora + 30000, ahora, 40000, 20000)).toBe(true)    // faltan 20 s, quedan 30
    expect(daTiempo(ahora + 20000, ahora, 40000, 20000)).toBe(false)   // justo: no
    expect(daTiempo(ahora + 5000, ahora, 40000, 20000)).toBe(false)
    expect(daTiempo(null, ahora, 40000, 0)).toBe(true)                 // sin caducidad conocida
  })
})

describe('ECO-1g · videoCore · lo que el servidor dijo del día (G1, G6)', () => {
  const LOCAL = 1_800_000_000_000
  const SERVIDOR = LOCAL + 90_000           // el teléfono atrasa minuto y medio
  const r = (extra = {}) => ({ codigo: 'ok', quedan: 8, tope: 8, premio: 500, ahora: SERVIDOR, reinicioEn: SERVIDOR + 5 * 3600_000, ...extra })

  it('toma quedan, tope, premio, reinicio y el desfase del reloj', () => {
    expect(estadoTras(null, r(), LOCAL)).toEqual({ quedan: 8, tope: 8, premio: 500, reinicioEn: SERVIDOR + 5 * 3600_000, desfase: 90_000 })
  })

  it('una respuesta sin datos deja lo que había', () => {
    const previo = estadoTras(null, r(), LOCAL)
    expect(estadoTras(previo, { codigo: 'red' }, LOCAL)).toBe(previo)
    expect(estadoTras(previo, null, LOCAL)).toBe(previo)
    expect(estadoTras(previo, { codigo: 'ok', quedan: 3, reinicioEn: null }, LOCAL)).toBe(previo)
    expect(estadoTras(null, { codigo: 'red' }, LOCAL)).toBeNull()
  })

  it('las respuestas de pedir y cobrar no traen tope (y pedir, ni premio): se conservan', () => {
    const previo = estadoTras(null, r(), LOCAL)
    const tras = estadoTras(previo, { codigo: 'ok', quedan: 7, ahora: SERVIDOR + 1000, reinicioEn: previo.reinicioEn }, LOCAL + 1000)
    expect(tras).toEqual({ ...previo, quedan: 7 })
    // Sin `ahora` (el cobro no lo trae) el desfase es el que había.
    expect(estadoTras(previo, { codigo: 'ok', quedan: 6, premio: 500, reinicioEn: previo.reinicioEn }, LOCAL + 99_999).desfase).toBe(90_000)
  })

  it('«Vuelven en…» se resta contra el reloj del SERVIDOR, no el del teléfono', () => {
    const e = estadoTras(null, r({ quedan: 0 }), LOCAL)
    expect(msHastaReinicio(e, LOCAL)).toBe(5 * 3600_000)
    expect(msHastaReinicio(e, LOCAL + 3600_000)).toBe(4 * 3600_000)
    expect(msHastaReinicio(e, LOCAL + 99 * 3600_000)).toBe(0)
    expect(msHastaReinicio(null, LOCAL)).toBeNull()
  })

  it('las piezas del tiempo: hacia arriba y con un minuto como mínimo', () => {
    expect(tiempoPartes((5 * 60 + 12) * 60000)).toEqual({ h: 5, m: 12 })
    expect(tiempoPartes((5 * 60 + 11) * 60000 + 1)).toEqual({ h: 5, m: 12 })
    expect(tiempoPartes(59 * 60000)).toEqual({ h: 0, m: 59 })
    expect(tiempoPartes(60 * 60000)).toEqual({ h: 1, m: 0 })
    expect(tiempoPartes(0)).toEqual({ h: 0, m: 1 })
    expect(tiempoPartes(25 * 3600_000)).toEqual({ h: 25, m: 0 })    // el día de 25 h
  })

  it('el contador: plural, singular en clave aparte, «Vuelven en…» y nada si no se sabe', () => {
    const e = (quedan) => estadoTras(null, r({ quedan }), LOCAL)
    expect(contadorDe(null, LOCAL)).toBeNull()
    expect(contadorDe(e(8), LOCAL)).toEqual({ clave: 'video.quedan', vars: { n: 8, total: 8 } })
    expect(contadorDe(e(1), LOCAL)).toEqual({ clave: 'video.queda.uno', vars: { total: 8 } })
    expect(contadorDe(e(0), LOCAL)).toEqual({ clave: 'video.vuelven', tiempo: { clave: 'video.tiempo.hm', vars: { h: 5, m: 0 } } })
    expect(contadorDe(e(0), LOCAL + 4.5 * 3600_000)).toEqual({ clave: 'video.vuelven', tiempo: { clave: 'video.tiempo.m', vars: { m: 30 } } })
    for (const k of ['video.quedan', 'video.queda.uno', 'video.vuelven', 'video.tiempo.hm', 'video.tiempo.m']) {
      expect(typeof TEXTOS_ES[k]).toBe('string')
    }
  })

  it('el tope apaga, y pasada la medianoche toca releer', () => {
    const e = estadoTras(null, r({ quedan: 0 }), LOCAL)
    expect(sinVideosHoy(e)).toBe(true)
    expect(sinVideosHoy(estadoTras(null, r({ quedan: 1 }), LOCAL))).toBe(false)
    expect(sinVideosHoy(null)).toBe(false)
    expect(tocaReleer(e, LOCAL)).toBe(false)
    expect(tocaReleer(e, LOCAL + 5 * 3600_000)).toBe(true)
    expect(tocaReleer(estadoTras(null, r({ quedan: 3 }), LOCAL), LOCAL + 9 * 3600_000)).toBe(false)
  })
})

describe('ECO-1g · videoCore · qué se hace con cada código (plan §5)', () => {
  it('al pedir: sólo `ok` con boleto abre; el tope apaga; lo demás es «no hay video»', () => {
    expect(alPedir({ codigo: 'ok', boletoId: 'b1' })).toBe(AL_PEDIR.ABRIR)
    expect(alPedir({ codigo: 'ok', boletoId: null })).toBe(AL_PEDIR.SIN)
    expect(alPedir({ codigo: 'tope_dia' })).toBe(AL_PEDIR.TOPE)
    for (const codigo of ['limite', 'red', 'sin_sesion', 'sin_billetera', 'otra_cosa']) {
      expect(alPedir({ codigo })).toBe(AL_PEDIR.SIN)
    }
    expect(alPedir(null)).toBe(AL_PEDIR.SIN)
  })

  it('al cobrar: `ok` y `ya_cobrado` celebran (S3)', () => {
    expect(alCobrar({ codigo: 'ok', saldo: 3000 }).accion).toBe(AL_COBRAR.CELEBRAR)
    expect(alCobrar({ codigo: 'ya_cobrado', saldo: 3000 }).accion).toBe(AL_COBRAR.CELEBRAR)
    // Sin saldo legible no se celebra a ciegas: se pregunta otra vez.
    expect(alCobrar({ codigo: 'ok', saldo: null }).accion).toBe(AL_COBRAR.REINTENTAR)
  })

  it('al cobrar: `demasiado_pronto` espera lo que dice el servidor', () => {
    expect(alCobrar({ codigo: 'demasiado_pronto', faltanS: 4 })).toEqual({ accion: AL_COBRAR.ESPERAR, esperaMs: 4250 })
    expect(alCobrar({ codigo: 'demasiado_pronto', faltanS: 0 }).esperaMs).toBe(1250)
  })

  it('al cobrar: `limite` y `red` reintentan con las esperas de la casa (K7)', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map((i) => alCobrar({ codigo: 'limite' }, i).esperaMs)).toEqual([1000, 2000, 4000, 8000, 15000, 15000, 15000])
    expect(alCobrar({ codigo: 'red' }, 0)).toEqual({ accion: AL_COBRAR.REINTENTAR, esperaMs: 1000 })
    expect(esperaCobro(-3)).toBe(1000)
  })

  it('al cobrar: el tope cierra sin celebrar; anulado, vencido y ajeno son «no hay video»', () => {
    expect(alCobrar({ codigo: 'tope_dia' }).accion).toBe(AL_COBRAR.TOPE)
    for (const codigo of ['anulado', 'vencido', 'ajeno', 'inexistente', 'sin_sesion', 'sin_billetera', 'error_libro']) {
      expect(alCobrar({ codigo }).accion).toBe(AL_COBRAR.SIN)
    }
  })

  it('P-2 · la ✕ no está durante la primera tanda (1, 2, 4, 8 y 15 s) y aparece después', () => {
    expect(ESPERAS_COBRO_MS.reduce((a, b) => a + b, 0)).toBe(30000)
    expect([0, 1, 2, 3, 4].map(cobroSalible)).toEqual([false, false, false, false, false])
    expect(cobroSalible(5)).toBe(true)
    expect(cobroSalible(12)).toBe(true)
  })

  it('la celebración cuenta con el premio del SERVIDOR, también con `ya_cobrado`', () => {
    expect(celebracionDe({ codigo: 'ok', cobrado: 500, saldo: 3000, premio: 500 }, 999)).toEqual({ premio: 500, desde: 2500, hasta: 3000 })
    expect(celebracionDe({ codigo: 'ya_cobrado', cobrado: 0, saldo: 3000, premio: 500 }, 999)).toEqual({ premio: 500, desde: 2500, hasta: 3000 })
    // Si el servidor no lo dijera, el espejo.
    expect(celebracionDe({ codigo: 'ok', saldo: 3000, premio: null }, 500)).toEqual({ premio: 500, desde: 2500, hasta: 3000 })
    expect(celebracionDe({ codigo: 'ok', saldo: 200, premio: 500 }, 500).desde).toBe(0)
  })

  it('G5 · la celebración sobria dura unos 2,2 s', () => {
    expect(TIEMPOS_CEL.fin).toBe(2200)
    expect(TIEMPOS_CEL.sale).toBeLessThan(TIEMPOS_CEL.fin)
    expect(TIEMPOS_CEL.vuelo + 520 + TIEMPOS_CEL.conteo).toBeLessThanOrEqual(TIEMPOS_CEL.sale)
  })
})
