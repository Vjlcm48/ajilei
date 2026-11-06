// MES-PvP 2 §3 · El controlador de la mesa, con una `partida` doble y relojes falsos, sin
// `@testing-library`: la receta de la casa para los hooks.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RITMO_RAPIDO, TOPE_RELOJ_MS, creaMesaPvP, escenaDe, relojDe } from './mesaPvPCore'

const asiento = (extra = {}) => ({
  name: 'A', chips: 1000, contrib: 0, contribMano: 100, folded: false, allIn: false, eliminated: false,
  abandonado: false, cobrado: null, enAnuncio: false, ausente: false, numCartas: 2, cards: [], ...extra,
})
const vista = (extra = {}, propio = {}) => ({
  version: 1, asiento: 1, phase: 'BET_1', players: [asiento({ name: 'B' }), asiento(propio)], currentBet: 0, unit: 100, pot: 200, capas: [],
  activePlayerIndex: 1, manoIndex: 1, pieIndex: 0, handRules: { ruleN: 2, maxDiscard: 2 }, handCount: 1,
  vencimiento: { clase: 'turno', hora: 20_000 },
  descarte: { yaDescartaron: [], cuantas: null }, sorteo: { participan: [], yaEligieron: [], rondas: [], posiciones: [] },
  resultado: null, ultimaAccion: null, ...extra,
})

function doble(inicial = {}) {
  let f = { vista: null, desfase: 0, muerta: false, ...inicial }
  const oyentes = new Set()
  return {
    enviar: vi.fn(),
    iniciar: vi.fn(),
    parar: vi.fn(),
    foto: () => f,
    suscribir: (o) => { oyentes.add(o); return () => oyentes.delete(o) },
    poner: (c) => { f = { ...f, ...c }; oyentes.forEach((o) => o()) },
    oyentes,
  }
}

const SALA = { id: 'mesa-1', ritmo: 'rapido', entrada: 'corta' }

function montar(inicial) {
  const partida = doble(inicial)
  const nucleo = creaMesaPvP({ partida, sala: SALA })
  nucleo.iniciar()
  return { partida, nucleo }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0) })
afterEach(() => { vi.useRealTimers() })

describe('MES-PvP 2 · el reloj', () => {
  it('sin vencimiento, nada; las esperas de animación no cuentan segundos', () => {
    expect(relojDe(null, 0)).toEqual({ clase: null, timeLeft: null })
    expect(relojDe({ clase: 'reposicion', hora: 5000 }, 0)).toEqual({ clase: 'reposicion', timeLeft: null })
  })

  it('redondea hacia arriba y se queda entre 0 y el máximo de su clase', () => {
    expect(relojDe({ clase: 'turno', hora: 20_000 }, 0).timeLeft).toBe(20)
    expect(relojDe({ clase: 'turno', hora: 20_000 }, 19_001).timeLeft).toBe(1)
    expect(relojDe({ clase: 'turno', hora: 20_000 }, 25_000).timeLeft).toBe(0)
    expect(relojDe({ clase: 'turno', hora: 90_000 }, 0).timeLeft).toBe(20)
    expect(relojDe({ clase: 'descarte', hora: 90_000 }, 0).timeLeft).toBe(20)
    expect(relojDe({ clase: 'eleccion_sorteo', hora: 90_000 }, 0).timeLeft).toBe(10)
    expect(relojDe({ clase: 'pausa_anuncio', hora: 90_000 }, 0).timeLeft).toBe(45)
    expect(Object.keys(TOPE_RELOJ_MS)).toHaveLength(4)
  })

  it('usa la hora del servidor: el desfase corrige lo que queda', () => {
    const { nucleo, partida } = montar({ vista: vista() })
    expect(nucleo.foto().reloj.timeLeft).toBe(20)
    partida.poner({ desfase: 5000 })
    expect(nucleo.foto().reloj.timeLeft).toBe(15)
    partida.poner({ desfase: -5000 })
    expect(nucleo.foto().reloj.timeLeft).toBe(20)
    nucleo.parar()
  })

  it('corre solo, y la foto solo cambia cuando cambia el segundo', () => {
    const { nucleo } = montar({ vista: vista() })
    const avisos = vi.fn()
    nucleo.suscribir(avisos)
    vi.advanceTimersByTime(1000)
    expect(nucleo.foto().reloj.timeLeft).toBe(19)
    expect(avisos).toHaveBeenCalledTimes(1)
    const antes = nucleo.foto()
    vi.advanceTimersByTime(500)
    expect(nucleo.foto()).toBe(antes)
    nucleo.parar()
  })
})

describe('MES-PvP 2 · la foto', () => {
  it('entrega lo que la ficha pide, con la mesa y el ritmo de la sala', () => {
    const { nucleo, partida } = montar()
    expect(nucleo.foto()).toMatchObject({ game: null, escena: 'arrancando', mesa: 'mesa-1', ritmo: 'rapido' })
    expect(nucleo.foto().enviar).toBe(partida.enviar)
    partida.poner({ vista: vista() })
    expect(nucleo.foto().game.players[0].name).toBe('A')
    expect(nucleo.foto().game.voz).toBe('humanos')
    expect(nucleo.foto().cronica).toBe('A las 2 — Tu turno.')
    expect(nucleo.foto().escena).toBe('mesa')
    nucleo.parar()
  })

  it('una foto de la partida con la misma versión no rehace el `game`', () => {
    const { nucleo, partida } = montar({ vista: vista() })
    const { game } = nucleo.foto()
    partida.poner({ avisos: 3 })
    expect(nucleo.foto().game).toBe(game)
    nucleo.parar()
  })

  it('cada lectura se adapta sobre la anterior: la crónica ve la jugada nueva', () => {
    const { nucleo, partida } = montar({ vista: vista() })
    partida.poner({ vista: vista({ version: 2, ultimaAccion: { asiento: 0, tipo: 'pasar', puesto: 0, apuestaAntes: 0, apuestaDespues: 0, porReloj: false } }) })
    expect(nucleo.foto().cronica).toBe('B pasa.')
    expect(nucleo.foto().game.players[1].ultima).toEqual({ tipo: 'pasar' })
    nucleo.parar()
  })

  it('arranca y para la partida, también dos veces (StrictMode)', () => {
    const { nucleo, partida } = montar({ vista: vista() })
    nucleo.parar()
    expect(partida.oyentes.size).toBe(0)
    nucleo.iniciar()
    expect(partida.iniciar).toHaveBeenCalledTimes(2)
    expect(partida.oyentes.size).toBe(1)
    nucleo.parar()
    expect(partida.parar).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(5000)
    expect(nucleo.foto().reloj.timeLeft).toBe(20)
  })
})

describe('MES-PvP 2 · la escena', () => {
  it.each([
    ['sin vista', null, false, 'arrancando'],
    ['el sorteo', vista({ phase: 'SORTEO' }), false, 'sorteo'],
    ['una mano', vista(), false, 'mesa'],
    ['la pausa, en el anuncio', vista({ phase: 'PAYOUT', vencimiento: { clase: 'pausa_anuncio', hora: 1 } }, { enAnuncio: true }), false, 'anuncio'],
    ['la pausa, ya de vuelta', vista({ phase: 'PAYOUT', vencimiento: { clase: 'pausa_anuncio', hora: 1 } }), false, 'mesa'],
    ['abandonó', vista({}, { abandonado: true }), false, 'fuera'],
    ['sin fichas con la mesa viva', vista({}, { eliminated: true }), false, 'fuera'],
    ['terminó', vista({ phase: 'GAME_OVER' }, { eliminated: true }), false, 'final'],
    ['murió', vista(), true, 'muerta'],
    ['murió y un fin le gana', vista({ phase: 'GAME_OVER' }), true, 'final'],
  ])('%s', (_nombre, v, muerta, escena) => {
    expect(escenaDe(v, muerta)).toBe(escena)
  })

  it('la partida muerta pasa a la escena con la vista viva', () => {
    const { nucleo, partida } = montar({ vista: vista() })
    expect(nucleo.foto().escena).toBe('mesa')
    partida.poner({ muerta: true })
    expect(nucleo.foto().escena).toBe('muerta')
    expect(nucleo.foto().game).not.toBeNull()
    nucleo.parar()
  })
})

describe('MES-PvP 2 · la píldora', () => {
  it('avisa cuando cambia lo cobrado propio, una vez por cambio, y no por lo ajeno', () => {
    const alCobrar = vi.fn()
    const partida = doble({ vista: vista() })
    const nucleo = creaMesaPvP({ partida, sala: SALA })
    nucleo.alCobrar(alCobrar)
    nucleo.iniciar()
    expect(alCobrar).not.toHaveBeenCalled()
    partida.poner({ vista: vista({ version: 2, players: [asiento({ cobrado: 500 }), asiento()] }) })
    expect(alCobrar).not.toHaveBeenCalled()
    partida.poner({ vista: vista({ version: 3 }, { cobrado: 1500 }) })
    expect(alCobrar).toHaveBeenCalledTimes(1)
    expect(alCobrar).toHaveBeenCalledWith(1500)
    partida.poner({ vista: vista({ version: 4 }, { cobrado: 1500 }) })
    expect(alCobrar).toHaveBeenCalledTimes(1)
    nucleo.alCobrar(null)
    partida.poner({ vista: vista({ version: 5 }, { cobrado: 0 }) })
    expect(alCobrar).toHaveBeenCalledTimes(1)
    nucleo.parar()
  })

  it('quien vuelve a una mesa ya cobrada también se entera', () => {
    const alCobrar = vi.fn()
    const nucleo = creaMesaPvP({ partida: doble({ vista: vista({}, { cobrado: 800 }) }), sala: SALA })
    nucleo.alCobrar(alCobrar)
    nucleo.iniciar()
    expect(alCobrar).toHaveBeenCalledWith(800)
    nucleo.parar()
  })
})

describe('MES-PvP 3 · la selección del descarte', () => {
  const cartas = Array.from({ length: 5 }, (_, k) => ({ id: `c${k}` }))
  const enDescarte = (extra = {}, propio = {}) => vista({ phase: 'DISCARD', vencimiento: { clase: 'descarte', hora: 20_000 }, ...extra }, { cards: cartas, numCartas: 5, ...propio })

  it('alterna con el tope de la mano y sobrevive a la lectura siguiente de la misma mano', () => {
    const { partida, nucleo } = montar({ vista: enDescarte() })
    nucleo.foto().alternarDescarte(1)
    nucleo.foto().alternarDescarte(3)
    nucleo.foto().alternarDescarte(4)
    expect(nucleo.foto().game.selectedDiscards).toEqual([1, 3])
    nucleo.foto().alternarDescarte(1)
    expect(nucleo.foto().game.selectedDiscards).toEqual([3])
    partida.poner({ vista: enDescarte({ version: 2, descarte: { yaDescartaron: [0], cuantas: null } }) })
    expect(nucleo.foto().game.selectedDiscards).toEqual([3])
  })

  // Lo que vio Victor (cierre de la 3): las cartas repuestas llegaban levantadas.
  it('se vacía al abrirse la reposición, no antes: las marcadas siguen arriba mientras la mesa descarta', () => {
    const { partida, nucleo } = montar({ vista: enDescarte() })
    nucleo.foto().alternarDescarte(1)
    nucleo.foto().alternarDescarte(3)
    partida.poner({ vista: enDescarte({ version: 2, descarte: { yaDescartaron: [1], cuantas: null } }) })
    expect(nucleo.foto().game.selectedDiscards).toEqual([1, 3])
    partida.poner({ vista: enDescarte({ version: 3, vencimiento: { clase: 'reposicion', hora: 21_000 }, descarte: { yaDescartaron: [0, 1], cuantas: [0, 2] } }) })
    expect(nucleo.foto().game.reponiendo).toBe(true)
    expect(nucleo.foto().game.selectedDiscards).toEqual([])
    nucleo.foto().alternarDescarte(2)
    expect(nucleo.foto().game.selectedDiscards).toEqual([])
  })

  it('no cambia nada fuera del descarte, retirado o con el descarte ya mandado', () => {
    for (const v of [vista(), enDescarte({}, { folded: true }), enDescarte({ descarte: { yaDescartaron: [1], cuantas: null } })]) {
      const { nucleo } = montar({ vista: v })
      const antes = nucleo.foto()
      antes.alternarDescarte(0)
      expect(nucleo.foto()).toBe(antes)
    }
  })
})

describe('MES-PvP 3 · el ritmo escala el reparto', () => {
  it('rápido es FACTOR_RAPIDA, con el literal del árbitro; normal, 1', async () => {
    const { RITMOS, factorDe } = await import('../arbitro/reloj.js')
    expect(RITMO_RAPIDO).toBe(RITMOS.RAPIDO)
    expect(montar({ vista: vista() }).nucleo.foto().factorReparto).toBe(factorDe(RITMOS.RAPIDO))
    const normal = creaMesaPvP({ partida: doble({ vista: vista() }), sala: { ...SALA, ritmo: 'normal' } })
    expect(normal.foto().factorReparto).toBe(1)
  })
})
