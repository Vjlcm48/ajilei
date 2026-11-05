// MES-PvP 2 §3 · Cada escena llega a su estado con su semilla, en toda mesa donde cabe y
// desde cada asiento. Quien la pinta es la sub-tanda 3: aquí se mira la vista y lo que
// hace de ella el puente.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { creaMesaPvP } from '../hooks/mesaPvPCore'
import { vistaAMesa } from '../lib/vistaAMesa'
import { ESCENAS_PVP, MARCA_PARTIDA_IMITADA, crearPartidaImitada, escenaCabeEn, leerMandoPvP } from './partidaImitada'

const clase = (v) => v.vencimiento?.clase
const propio = (v) => v.players[v.asiento]
const rivalAbandono = (v) => v.players.some((p, i) => i !== v.asiento && p.abandonado)

// Lo que define cada escena, y la pantalla que le toca.
const ESPERADO = {
  'sorteo-baraja': ['sorteo', (v) => v.sorteo.etapa === 'barajado' && clase(v) === 'barajado_sorteo' && v.sorteo.ronda === 1],
  'sorteo-oleadas': ['sorteo', (v) => v.sorteo.etapa === 'reparto' && clase(v) === 'reparto_sorteo'],
  'sorteo-eleccion': ['sorteo', (v) => v.sorteo.etapa === 'eleccion' && clase(v) === 'eleccion_sorteo' && v.sorteo.posiciones.length === 5],
  'sorteo-empate-2': ['sorteo', (v) => v.sorteo.etapa === 'volteo' && v.sorteo.rondas.at(-1).empatados.length === 2 && v.sorteo.rondas.at(-1).mano === null],
  'sorteo-empate-3': ['sorteo', (v) => v.sorteo.etapa === 'volteo' && v.sorteo.rondas.at(-1).empatados.length === 3 && v.sorteo.rondas.at(-1).mano === null],
  'sorteo-azar': ['sorteo', (v) => v.sorteo.rondas.length === 3 && v.sorteo.rondas.at(-1).azar && v.sorteo.rondas.at(-1).mano !== null],
  'turno-propio': ['mesa', (v) => v.phase === 'BET_1' && clase(v) === 'turno' && v.activePlayerIndex === v.asiento],
  'turno-ajeno': ['mesa', (v) => v.phase === 'BET_1' && clase(v) === 'turno' && v.activePlayerIndex !== v.asiento],
  'descarte-espera': ['mesa', (v) => v.phase === 'DISCARD' && clase(v) === 'descarte' && v.descarte.yaDescartaron.includes(v.asiento)
    && v.descarte.yaDescartaron.length < v.players.filter((p) => !p.folded).length],
  reposicion: ['mesa', (v) => v.phase === 'DISCARD' && clase(v) === 'reposicion' && v.descarte.cuantas[v.asiento] === 1],
  revelacion: ['mesa', (v) => v.phase === 'PAYOUT' && v.resultado.revelacion.length >= 2 && clase(v) === 'mano_siguiente'],
  retirada: ['mesa', (v) => v.phase === 'PAYOUT' && !v.resultado.revelacion],
  'anuncio-yo': ['anuncio', (v) => clase(v) === 'pausa_anuncio' && propio(v).enAnuncio && v.handCount === 5],
  'anuncio-vuelta': ['mesa', (v) => clase(v) === 'pausa_anuncio' && !propio(v).enAnuncio && v.players.some((p) => p.enAnuncio)],
  ausente: ['mesa', (v) => v.players.some((p, i) => i !== v.asiento && p.ausente && !p.abandonado)],
  abandono: ['mesa', (v) => rivalAbandono(v) && v.phase === 'BET_1' && v.activePlayerIndex === v.asiento],
  'final-gana': ['final', (v) => v.phase === 'GAME_OVER' && !propio(v).eliminated && propio(v).cobrado > 0],
  'final-pierde': ['final', (v) => v.phase === 'GAME_OVER' && propio(v).eliminated],
  'final-fuera': ['fuera', (v) => v.phase !== 'GAME_OVER' && propio(v).abandonado && propio(v).cobrado !== null],
  muerta: ['muerta', (v) => v.phase === 'BET_1' && v.activePlayerIndex !== v.asiento],
  'aviso-salida': ['mesa', (v) => clase(v) === 'aviso_salida' && v.players.some((p, i) => i !== v.asiento && p.eliminated) && v.players.filter((p) => !p.eliminated).length >= 2],
}

const mesasDe = (escena) => [2, 3, 4, 5].filter((n) => escenaCabeEn(escena, n))

describe('MES-PvP 2 · las escenas', () => {
  it('la lista es la del §I.2, con `reposicion` y `aviso-salida`', () => {
    expect([...ESCENAS_PVP].sort()).toEqual(Object.keys(ESPERADO).sort())
    expect(ESCENAS_PVP).toHaveLength(21)
    expect(mesasDe('aviso-salida')).toEqual([3, 4, 5])
    expect(mesasDe('sorteo-empate-3')).toEqual([3, 4, 5])
    expect(mesasDe('turno-propio')).toEqual([2, 3, 4, 5])
  })

  describe.each(ESCENAS_PVP)('%s', (escena) => {
    const [pantalla, llego] = ESPERADO[escena]
    it.each(mesasDe(escena))('en mesa de %i, desde cada asiento', (n) => {
      for (let asiento = 0; asiento < n; asiento++) {
        const partida = crearPartidaImitada({ escena, n, asiento })
        const { vista } = partida.foto()
        expect(vista.asiento).toBe(asiento)
        expect(vista.players).toHaveLength(n)
        expect(llego(vista), `asiento ${asiento}`).toBe(true)

        // El puente la adapta y le da su pantalla.
        const nucleo = creaMesaPvP({ partida, sala: partida.sala })
        nucleo.iniciar()
        expect(nucleo.foto().escena, `asiento ${asiento}`).toBe(pantalla)
        expect(nucleo.foto().game.players[0].name).toBe(vista.players[asiento].name)
        nucleo.parar()
      }
    })

    it('es la misma cada vez: la semilla manda', () => {
      const foto = () => {
        const { vista } = crearPartidaImitada({ escena, n: mesasDe(escena)[0], ahora: () => 1000 }).foto()
        return JSON.stringify(vista)
      }
      expect(foto()).toBe(foto())
    })
  })

  it('una escena que no cabe en la mesa, o que no existe, lo dice', () => {
    expect(() => crearPartidaImitada({ escena: 'aviso-salida', n: 2 })).toThrow(/no cabe/)
    expect(() => crearPartidaImitada({ escena: 'inventada' })).toThrow(/desconocida/)
  })

  it('con `nombres=largo`, los 15 «W»', () => {
    const { vista } = crearPartidaImitada({ escena: 'turno-propio', n: 5, nombres: 'largo' }).foto()
    expect(vista.players.every((p) => p.name === 'W'.repeat(15))).toBe(true)
  })
})

describe('MES-PvP 2 · la misma forma que el cliente', () => {
  it('tiene lo que la mesa usa, y su marca', async () => {
    const p = crearPartidaImitada({ escena: 'turno-propio', n: 3, asiento: 1 })
    expect(p.marca).toBe(MARCA_PARTIDA_IMITADA)
    for (const f of ['iniciar', 'parar', 'revisar', 'enviar', 'releer', 'suscribir', 'foto']) expect(typeof p[f], f).toBe('function')
    expect(p.foto()).toMatchObject({ canal: 'SUBSCRIBED', rechazo: null, muerta: false })
  })

  it('el reloj del cliente ve la hora del árbitro: `desfase` la acerca', () => {
    const p = crearPartidaImitada({ escena: 'turno-propio', n: 2, ahora: () => 1000 })
    const { vista, desfase } = p.foto()
    expect(vista.vencimiento.hora - (1000 + desfase)).toBe(20_000)
  })

  it('`enviar` va al árbitro de verdad: acepta lo legal, rechaza lo ilegal y sube la versión', async () => {
    const p = crearPartidaImitada({ escena: 'turno-propio', n: 2 })
    const avisos = vi.fn()
    p.suscribir(avisos)
    const v0 = p.foto().version
    const ilegal = await p.enviar('apostar', { tipo: 'igualar' })
    expect(ilegal).toMatchObject({ ok: false, motivo: 'sin_apuesta' })
    expect(p.foto().version).toBe(v0)
    expect(p.foto().rechazo).toEqual({ accion: 'apostar', motivo: 'sin_apuesta' })
    const bien = await p.enviar('apostar', { tipo: 'pasar' })
    expect(bien.ok).toBe(true)
    expect(typeof bien.ahora).toBe('number')
    expect(p.foto().version).toBe(v0 + 1)
    expect(p.foto().rechazo).toBeNull()
    expect(avisos).toHaveBeenCalledTimes(2)
  })

  it('un reclamo antes de la hora se rechaza, como en el servidor', async () => {
    const p = crearPartidaImitada({ escena: 'turno-propio', n: 2 })
    expect(await p.enviar('reclamar_vencimiento')).toMatchObject({ ok: false, motivo: 'vencimiento_no_cumplido' })
  })

  it('`avanzar` sigue jugando el guion, y el puente ve la transición', () => {
    const p = crearPartidaImitada({ escena: 'turno-ajeno', n: 2 })
    const nucleo = creaMesaPvP({ partida: p, sala: p.sala })
    nucleo.iniciar()
    const antes = nucleo.foto().game.version
    p.avanzar()
    expect(nucleo.foto().game.version).toBe(antes + 1)
    expect(nucleo.foto().cronica).toMatch(/pasa\.$/)
    nucleo.parar()
  })

  it('en `muerta`, toda acción recibe `partida_terminada` y la vista sigue viva', async () => {
    const p = crearPartidaImitada({ escena: 'muerta', n: 3 })
    expect(p.foto().muerta).toBe(true)
    expect(await p.enviar('reclamar_vencimiento')).toMatchObject({ ok: false, motivo: 'partida_terminada' })
    expect(p.foto().vista.phase).toBe('BET_1')
    expect(p.foto().rechazo.motivo).toBe('partida_terminada')
  })

  it('el adaptador recorre la escena con la previa: quien salió en `aviso-salida` se nombra', () => {
    const p = crearPartidaImitada({ escena: 'aviso-salida', n: 3 })
    const { vista } = p.foto()
    const anterior = JSON.parse(JSON.stringify(vista))
    const fuera = anterior.players.findIndex((x) => x.eliminated)
    anterior.players[fuera].eliminated = false
    anterior.handCount -= 1
    const game = vistaAMesa(vista, vistaAMesa(anterior, null, p.sala), p.sala)
    expect(game.eliminatedNames).toEqual([vista.players[fuera].name])
    expect(game.aliveCount).toBe(2)
  })
})

describe('MES-PvP 2 · el mando', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('con la puerta abierta, lee la escena y sus datos, y corrige lo que no vale', () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '1')
    expect(leerMandoPvP('?pvp=revelacion&n=4&asiento=3&nombres=largo')).toEqual({ escena: 'revelacion', n: 4, asiento: 3, nombres: 'largo' })
    expect(leerMandoPvP('?pvp=revelacion')).toEqual({ escena: 'revelacion', n: 2, asiento: 0, nombres: null })
    expect(leerMandoPvP('?pvp=revelacion&n=9&asiento=7')).toEqual({ escena: 'revelacion', n: 2, asiento: 0, nombres: null })
    expect(leerMandoPvP('?pvp=revelacion&n=3&asiento=3')).toMatchObject({ n: 3, asiento: 0 })
    expect(leerMandoPvP('?pvp=inventada')).toBeNull()
    expect(leerMandoPvP('')).toBeNull()
  })

  it('sin bypass, no existe', () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '')
    expect(leerMandoPvP('?pvp=revelacion')).toBeNull()
  })

  it('fuera de desarrollo, no existe', () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '1')
    vi.stubEnv('DEV', false)
    expect(leerMandoPvP('?pvp=revelacion')).toBeNull()
  })
})
