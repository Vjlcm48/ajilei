// MES-PvP 2 §3 · Cada escena llega a su estado con su semilla, en toda mesa donde cabe y
// desde cada asiento. Quien la pinta es la sub-tanda 3: aquí se mira la vista y lo que
// hace de ella el puente.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { creaMesaPvP } from '../hooks/mesaPvPCore'
import { vistaAMesa } from '../lib/vistaAMesa'
import { recargaDeVista } from '../lib/entreManosCore'
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
  'descarte-propio': ['mesa', (v) => v.phase === 'DISCARD' && clase(v) === 'descarte' && !v.descarte.yaDescartaron.includes(v.asiento) && !propio(v).folded],
  reposicion: ['mesa', (v) => v.phase === 'DISCARD' && clase(v) === 'reposicion' && v.descarte.cuantas[v.asiento] === 1],
  revelacion: ['mesa', (v) => v.phase === 'PAYOUT' && v.resultado.revelacion.length >= 2 && clase(v) === 'mano_siguiente'],
  retirada: ['mesa', (v) => v.phase === 'PAYOUT' && !v.resultado.revelacion],
  'anuncio-yo': ['anuncio', (v) => clase(v) === 'pausa_anuncio' && propio(v).enAnuncio && v.handCount === 5],
  'anuncio-vuelta': ['mesa', (v) => clase(v) === 'pausa_anuncio' && !propio(v).enAnuncio && v.players.some((p) => p.enAnuncio)],
  ausente: ['mesa', (v) => v.players.some((p, i) => i !== v.asiento && p.ausente && !p.abandonado)],
  abandono: ['mesa', (v) => rivalAbandono(v) && v.phase === 'BET_1' && v.activePlayerIndex === v.asiento],
  'final-gana': ['final', (v) => v.phase === 'GAME_OVER' && !propio(v).eliminated && propio(v).cobrado > 0],
  'final-pierde': ['final', (v) => v.phase === 'GAME_OVER' && propio(v).eliminated],
  // MES-PvP 3-A · quien abandona va a su pantalla final en el acto, siga o no la partida.
  'final-fuera': ['final', (v) => propio(v).abandonado && (v.players.length === 2
    ? v.phase === 'GAME_OVER'
    : v.phase !== 'GAME_OVER' && propio(v).cobrado === null)],
  'final-negativo': ['final', (v) => v.phase === 'GAME_OVER' && !propio(v).eliminated && propio(v).cobrado < 1500
    && v.players.every((p, i) => i === v.asiento || p.abandonado) && v.resultado !== null],
  'final-cero': ['final', (v) => v.phase === 'GAME_OVER' && propio(v).cobrado === 1500 && v.handCount === 0],
  'final-todas': ['final', (v) => v.phase === 'GAME_OVER' && propio(v).cobrado > 1500
    && v.players.every((p, i) => i === v.asiento || (p.eliminated && !p.abandonado))],
  muerta: ['muerta', (v) => v.phase === 'BET_1' && v.activePlayerIndex !== v.asiento],
  'aviso-salida': ['mesa', (v) => clase(v) === 'aviso_salida' && v.players.some((p, i) => i !== v.asiento && p.eliminated) && v.players.filter((p) => !p.eliminated).length >= 2],
  // L-M 1 · el sorteo sobre la mesa (lámina): cada escena congelada, desde cada asiento.
  'sorteo-reparto': ['sorteo', (v) => v.sorteo.etapa === 'reparto' && v.sorteo.ronda === 1],
  'sorteo-elige': ['sorteo', (v) => v.sorteo.etapa === 'eleccion' && v.sorteo.yaEligieron.length === 0],
  'sorteo-elige-algunos': ['sorteo', (v) => v.sorteo.etapa === 'eleccion' && v.sorteo.yaEligieron.includes(v.asiento)
    && v.sorteo.yaEligieron.length === Math.min(2, v.players.length - 1)
    // Árbitro v1.3 · la vista dice la posición de quien eligió, y de nadie más.
    && v.sorteo.elegidas.every((p, i) => (v.sorteo.yaEligieron.includes(i) ? Number.isInteger(p) && p >= 0 && p < 5 : p === null))],
  'sorteo-volteo-propio': ['sorteo', (v) => v.sorteo.etapa === 'volteo' && v.sorteo.ronda === 1 && v.sorteo.rondas.at(-1).mano === v.asiento],
  'sorteo-volteo-ajeno': ['sorteo', (v) => v.sorteo.etapa === 'volteo' && v.sorteo.ronda === 1 && ![null, v.asiento].includes(v.sorteo.rondas.at(-1).mano)],
  'sorteo-empate': ['sorteo', (v) => v.sorteo.etapa === 'volteo' && v.sorteo.rondas.at(-1).mano === null && v.sorteo.rondas.at(-1).empatados.includes(v.asiento)],
  'sorteo-desempate': ['sorteo', (v) => v.sorteo.ronda === 2 && v.sorteo.etapa === 'eleccion' && v.sorteo.participan.includes(v.asiento)],
  'sorteo-desempate-fuera': ['sorteo', (v) => v.sorteo.ronda === 2 && v.sorteo.etapa === 'reparto' && !v.sorteo.participan.includes(v.asiento)],
  'sorteo-azar-propio': ['sorteo', (v) => v.sorteo.rondas.at(-1).azar && v.sorteo.rondas.at(-1).mano === v.asiento],
  'sorteo-azar-ajeno': ['sorteo', (v) => v.sorteo.rondas.at(-1).azar && ![null, v.asiento].includes(v.sorteo.rondas.at(-1).mano)],
  'sorteo-vuelta': ['sorteo', (v) => v.sorteo.etapa === 'volteo' && ![null, v.asiento].includes(v.sorteo.rondas.at(-1).mano)],
  // L-M 2 · la mesa de 5 de punta a punta y la ausencia (lámina).
  'mano-reparto': ['mesa', (v) => clase(v) === 'reparto'],
  // Llega al primer turno; las cuatro jugadas caen una a una al arrancar (`enPasos`).
  'ultima-accion': ['mesa', (v) => v.phase === 'BET_1' && clase(v) === 'turno'],
  'allin-rival': ['mesa', (v) => clase(v) === 'turno' && v.activePlayerIndex === v.asiento && v.players.some((p, i) => i !== v.asiento && p.allIn)],
  'pago-capas': ['mesa', (v) => v.phase === 'PAYOUT' && v.capas.length >= 2],
  'ausente-yo': ['mesa', (v) => propio(v).ausente && clase(v) === 'turno' && v.activePlayerIndex === v.asiento],
  'ausencia-tercero': ['mesa', (v) => v.players.some((p, i) => i !== v.asiento && p.abandonado) && v.phase !== 'GAME_OVER'],
  'ausencia-fuera': ['final', (v) => propio(v).abandonado],
  // L-M 3 · entre una mano y otra (lámina): la pausa entre manos, la recarga y el anuncio.
  'entre-manos': ['mesa', (v) => v.phase === 'PAYOUT' && clase(v) === 'mano_siguiente' && !v.resultado.revelacion],
  'recarga-ofrecida': ['mesa', (v) => clase(v) === 'mano_siguiente' && propio(v).chips === 0 && propio(v).recarga === 'decide'],
  'recarga-voluntaria': ['mesa', (v) => clase(v) === 'mano_siguiente' && propio(v).chips >= 100 && propio(v).chips < 1500 && !propio(v).recarga],
  'recarga-pedida': ['mesa', (v) => clase(v) === 'turno' && v.activePlayerIndex !== v.asiento && propio(v).chips < 1500 && !propio(v).folded],
  'recarga-sinsaldo': ['mesa', (v) => clase(v) === 'mano_siguiente' && propio(v).chips === 0 && propio(v).recarga === 'decide'],
  'recarga-fuera': ['mesa', (v) => clase(v) === 'turno' && propio(v).recarga === 'fuera' && propio(v).folded && !propio(v).eliminated],
  'recarga-ajena': ['mesa', (v) => clase(v) === 'mano_siguiente' && v.players.some((p, i) => i !== v.asiento && p.recarga === 'decide')],
  'recarga-ajena-fuera': ['mesa', (v) => clase(v) === 'turno' && v.players.some((p, i) => i !== v.asiento && p.recarga === 'fuera' && !p.eliminated)],
  'recarga-rival': ['mesa', (v) => clase(v) === 'oferta_recarga' && v.players.some((p, i) => i !== v.asiento && p.recarga === 'decide')],
  'anuncio-premium': ['mesa', (v) => clase(v) === 'pausa_anuncio' && !propio(v).enAnuncio && v.players.some((p) => p.enAnuncio)],
  'anuncio-cierre': ['mesa', (v) => clase(v) === 'pausa_anuncio' && !propio(v).enAnuncio && v.players.some((p) => p.enAnuncio)],
  'anuncio-vence': ['mesa', (v) => clase(v) === 'pausa_anuncio' && !propio(v).enAnuncio && v.players.some((p) => p.enAnuncio)],
}

const mesasDe = (escena) => [2, 3, 4, 5].filter((n) => escenaCabeEn(escena, n))

describe('MES-PvP 2 · las escenas', () => {
  it('la lista es la del §I.2, con `reposicion` y `aviso-salida`, `descarte-propio` (MES-PvP 3) y los tres fines de la 3-A', () => {
    expect([...ESCENAS_PVP].sort()).toEqual(Object.keys(ESPERADO).sort())
    expect(ESCENAS_PVP).toHaveLength(55)
    expect(mesasDe('abandono')).toEqual([3, 4, 5])
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

  // MES-PvP 3 · lo que vio Victor: la mesa marca, descarta, y las repuestas no llegan levantadas.
  it('con el árbitro de verdad, la selección sigue hasta abrirse la reposición y ahí se vacía', async () => {
    const p = crearPartidaImitada({ escena: 'descarte-propio', n: 3, asiento: 1 })
    const nucleo = creaMesaPvP({ partida: p, sala: p.sala })
    nucleo.iniciar()
    nucleo.foto().alternarDescarte(0)
    nucleo.foto().alternarDescarte(2)
    const marcadas = [...nucleo.foto().game.selectedDiscards]
    expect(marcadas.length).toBeGreaterThan(0)
    const { game } = nucleo.foto()
    expect((await p.enviar('descartar', { mano: game.handCount, indices: marcadas })).ok).toBe(true)
    expect(nucleo.foto().game.descarte.yaDescartaron).toContain(0)
    expect(nucleo.foto().game.selectedDiscards).toEqual(marcadas)
    for (let k = 0; k < 10 && !nucleo.foto().game.reponiendo; k++) p.avanzar()
    expect(nucleo.foto().game.reponiendo).toBe(true)
    expect(nucleo.foto().game.descarte.cuantas[0]).toBe(marcadas.length)
    expect(nucleo.foto().game.selectedDiscards).toEqual([])
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

  // v1.3-b · la recarga es la del árbitro real: la capa la lee de la vista (`recargaDeVista`).
  const recDe = (partida) => recargaDeVista(partida.foto().vista, { saldo: partida.lamina.saldo(), entrada: 1500 })

  // L-M 3 · la voluntaria pedida durante la mano (Victor, STOP-L): queda pedida, se puede anular,
  // y en la mano la oferta es siempre voluntaria.
  it('`recarga-pedida`: la voluntaria queda pedida en la mano y se anula, en el árbitro', async () => {
    const partida = crearPartidaImitada({ escena: 'recarga-pedida', n: 3, asiento: 1 })
    expect(recDe(partida)).toMatchObject({ pedida: true, enMano: true, pausa: false })
    expect(recDe(partida).oferta.tipo).toBe('voluntaria')
    const mano = partida.foto().vista.handCount
    expect((await partida.enviar('anular_recarga', { mano })).ok).toBe(true)
    expect(recDe(partida).pedida).toBe(false)
    expect((await partida.enviar('pedir_recarga', { mano })).ok).toBe(true)
    expect(recDe(partida).pedida).toBe(true)
  })

  // L-M 3 · el pedido que se cancela porque el saldo no alcanza lo dice: la vista trae la
  // cancelación, y la capa abre la tarjeta, que pinta «Tu saldo no alcanza para recargar.».
  it('`recarga-pedida` sin saldo: al cerrarse la mano el árbitro la cancela y la tarjeta lo dice', async () => {
    vi.useFakeTimers()
    try {
      const partida = crearPartidaImitada({ escena: 'recarga-pedida', n: 2, asiento: 0, vivo: true, saldo: 100, ahora: () => Date.now() })
      await partida.iniciar()
      const vista = () => partida.foto().vista
      for (let k = 0; k < 1200 && !vista().recarga.cancelada; k++) vi.advanceTimersByTime(100)
      expect(vista().recarga).toMatchObject({ pedida: false, cancelada: { motivo: 'saldo' }, recargas: 0 })
      expect(recDe(partida).cancelada).toMatch(/^saldo:\d+$/)
      expect(recDe(partida).oferta.alcanza).toBe(false)
      partida.parar()
    } finally {
      vi.useRealTimers()
    }
  })

  it('`recarga-pedida` con saldo, en vivo: al cerrarse la mano el árbitro la aplica y el saldo de la escena baja', async () => {
    vi.useFakeTimers()
    try {
      const partida = crearPartidaImitada({ escena: 'recarga-pedida', n: 2, asiento: 0, vivo: true, ahora: () => Date.now() })
      await partida.iniciar()
      const vista = () => partida.foto().vista
      for (let k = 0; k < 1200 && !vista().recarga.recargas; k++) vi.advanceTimersByTime(100)
      const { recargas } = vista().recarga
      expect(recargas).toBeGreaterThan(0)
      expect(vista().recarga).toMatchObject({ pedida: false, cancelada: null })
      expect(partida.lamina.saldo()).toBe(2400 - recargas)
      partida.parar()
    } finally {
      vi.useRealTimers()
    }
  })

  it('las escenas de la recarga, leídas como las lee la capa', () => {
    const ofrecida = recDe(crearPartidaImitada({ escena: 'recarga-ofrecida', n: 2 }))
    expect(ofrecida).toMatchObject({ pausa: true, fuera: false, enMano: false, espera: null })
    expect(ofrecida.oferta).toMatchObject({ tipo: 'ofrecida', pila: 0, monto: 1500, alcanza: true, saldoDespues: 900 })
    const fuera = recDe(crearPartidaImitada({ escena: 'recarga-fuera', n: 3 }))
    expect(fuera).toMatchObject({ pausa: false, fuera: true, enMano: false })
    expect(fuera.oferta.tipo).toBe('ofrecida')
    const rival = recDe(crearPartidaImitada({ escena: 'recarga-rival', n: 2 }))
    expect(rival).toMatchObject({ pausa: true, oferta: null, espera: 'Beto', totalSeg: 15 })
    const sinSaldo = recDe(crearPartidaImitada({ escena: 'recarga-sinsaldo', n: 2 }))
    expect(sinSaldo.oferta.alcanza).toBe(false)
    const voluntaria = recDe(crearPartidaImitada({ escena: 'recarga-voluntaria', n: 2 }))
    expect(voluntaria.oferta).toMatchObject({ tipo: 'voluntaria', monto: 1500 - voluntaria.oferta.pila })
  })

  // Túnel del v1.3 · sentado fuera, «Recargar» dos veces (la burbuja seguía ahí): el segundo es
  // `ya_pedida`, y al cerrarse la mano se cobra una sola vez.
  it('sentado fuera, dos «Recargar»: el segundo es ya_pedida y el cobro es uno', async () => {
    vi.useFakeTimers()
    try {
      const partida = crearPartidaImitada({ escena: 'recarga-fuera', n: 3, vivo: true, ahora: () => Date.now() })
      const mano = partida.foto().vista.handCount
      const r1 = await partida.enviar('recargar', { mano })
      const r2 = await partida.enviar('recargar', { mano })
      expect(r1.ok).toBe(true)
      expect(r2).toMatchObject({ ok: false, motivo: 'ya_pedida' })
      expect(recDe(partida)).toMatchObject({ fuera: true, pedida: true })
      expect(partida.lamina.saldo()).toBe(2400)
      await partida.iniciar()
      const vista = () => partida.foto().vista
      for (let k = 0; k < 1200 && !vista().recarga.recargas; k++) vi.advanceTimersByTime(100)
      expect(vista().recarga).toMatchObject({ recargas: 1500, pedida: false })
      expect(partida.lamina.saldo()).toBe(2400 - 1500)
      partida.parar()
    } finally {
      vi.useRealTimers()
    }
  })

  // Túnel del v1.3 · el anillo único: lo que la capa prevé en la pausa es lo que hace el árbitro
  // al vencerla (mesa de 2: la retención; mesa de 3: la mesa sigue sin él).
  it('la retención que la capa ve venir en la pausa es la que abre el árbitro al vencerla', async () => {
    for (const [n, retiene] of [[2, true], [3, false]]) {
      let t = 0
      const partida = crearPartidaImitada({ escena: 'recarga-ofrecida', n, ahora: () => t })
      const enPausa = recDe(partida)
      expect(enPausa).toMatchObject({ pausa: true, retencion: retiene, finPausa: partida.foto().vista.vencimiento.hora })
      if (retiene) expect(enPausa.vence).toBe(enPausa.finPausa + 300 + 15000)
      else expect(enPausa.vence).toBe(enPausa.finPausa)
      t += 30000
      const r = await partida.enviar('reclamar_vencimiento')
      expect(r.ok).toBe(true)
      expect(clase(partida.foto().vista) === 'oferta_recarga').toBe(retiene)
      if (retiene) expect(recDe(partida)).toMatchObject({ retencion: true, totalSeg: enPausa.totalSeg })
    }
  })

  it('recargar en la pausa: el árbitro devuelve la pila a la entrada y el saldo de la escena baja', async () => {
    const partida = crearPartidaImitada({ escena: 'recarga-ofrecida', n: 2 })
    const r = await partida.enviar('recargar', { mano: partida.foto().vista.handCount })
    expect(r.ok).toBe(true)
    expect(propio(partida.foto().vista)).toMatchObject({ chips: 1500, recarga: null })
    expect(partida.foto().vista.recarga.recargas).toBe(1500)
    expect(partida.lamina.saldo()).toBe(900)
  })

  // §2.3 · la base sube `entrada` con cada recarga; la pantalla final usa la de la MESA
  // (`vistaAMesa`, de la sala) y le suma `recargas`: lo recargado se resta una sola vez.
  it('la pantalla final resta lo recargado una sola vez: recarga 1.500 y se va con 1.500 → −1.500', async () => {
    const partida = crearPartidaImitada({ escena: 'recarga-ofrecida', n: 2 })
    expect((await partida.enviar('recargar', { mano: partida.foto().vista.handCount })).ok).toBe(true)
    expect((await partida.enviar('abandonar')).ok).toBe(true)
    const nucleo = creaMesaPvP({ partida, sala: partida.sala })
    nucleo.iniciar()
    const { fin, game } = nucleo.foto()
    nucleo.parar()
    expect(game.players[0]).toMatchObject({ chips: 1500, entrada: 1500, recargas: 1500 })
    expect(fin).toMatchObject({ caso: 1, neta: -1500, tono: 'sobrio', cifra: '−1.500 Heptacoins' })
  })

  it('con la puerta abierta, lee la escena y sus datos, y corrige lo que no vale', () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '1')
    // L-M 1 · y los mandos de la lámina, con sus valores por defecto.
    const lamina = { vivo: false, corte: null, momento: null, msj: null, msjMs: 1200, abierta: null, premium: null, saldo: null }
    expect(leerMandoPvP('?pvp=revelacion&n=4&asiento=3&nombres=largo')).toEqual({ escena: 'revelacion', n: 4, asiento: 3, nombres: 'largo', ...lamina })
    expect(leerMandoPvP('?pvp=revelacion')).toEqual({ escena: 'revelacion', n: 2, asiento: 0, nombres: null, ...lamina })
    expect(leerMandoPvP('?pvp=revelacion&n=9&asiento=7')).toEqual({ escena: 'revelacion', n: 2, asiento: 0, nombres: null, ...lamina })
    expect(leerMandoPvP('?pvp=sorteo-elige&ver=vivo&corte=0&momento=900')).toMatchObject({ vivo: true, corte: 0, momento: 900 })
    expect(leerMandoPvP('?pvp=sorteo-elige&corte=12')).toMatchObject({ corte: null })
    // L-M 3 · `abierta`, `premium` y `saldo`; las variantes (`var`) se retiraron en el STOP-L.
    expect(leerMandoPvP('?pvp=recarga-voluntaria&var=b&abierta=1&saldo=900')).toMatchObject({ abierta: true, saldo: 900 })
    expect(leerMandoPvP('?pvp=recarga-voluntaria&var=b')).not.toHaveProperty('variante')
    // L-M 2 · los mensajes de la lámina.
    expect(leerMandoPvP('?pvp=turno-ajeno&msj=todos&msjms=800')).toMatchObject({ msj: 'todos', msjMs: 800 })
    expect(leerMandoPvP('?pvp=turno-ajeno&msj=otro')).toMatchObject({ msj: null })
    expect(leerMandoPvP('?pvp=revelacion&n=3&asiento=3')).toMatchObject({ n: 3, asiento: 0 })
    // v1.3-b · la mesa, dentro de las que caben en la escena.
    expect(leerMandoPvP('?pvp=recarga-rival&n=3&asiento=1')).toMatchObject({ n: 2, asiento: 1 })
    expect(leerMandoPvP('?pvp=recarga-fuera&n=2')).toMatchObject({ n: 3 })
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

// ── Árbitro v1.3-a · el mensaje, con las comprobaciones del árbitro real ─────
describe('v1.3-a · el mensaje del imitado', () => {
  it('pasa con un id fijo; rechaza una clave de emoji, al abandonado y a quien está en su anuncio', () => {
    vi.stubEnv('VITE_AUTH_BYPASS', '1')
    const viva = crearPartidaImitada({ escena: 'turno-ajeno', n: 3 })
    expect(viva.mensajes.enviar('2660_fe0f')).toEqual({ ok: false, motivo: 'clave_desconocida' })
    expect(viva.mensajes.enviar('que_va')).toEqual({ ok: true })
    expect(viva.mensajes.lista().at(-1)).toMatchObject({ asiento: 0, clave: 'que_va' })
    expect(viva.mensajes.enviar('ajilei')).toEqual({ ok: false, motivo: 'freno' })

    const anuncio = crearPartidaImitada({ escena: 'anuncio-yo', n: 2 })
    expect(anuncio.mensajes.enviar('ajilei')).toEqual({ ok: false, motivo: 'en_anuncio' })

    const fuera = crearPartidaImitada({ escena: 'turno-ajeno', n: 3 })
    fuera.enviar('abandonar')
    expect(fuera.mensajes.enviar('ajilei')).toEqual({ ok: false, motivo: 'asiento_abandonado' })
  })
})

// ── Árbitro v1.3-b · la recarga de la lámina, solo detrás de la puerta DEV ──────────────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3b_v1.0.md §2.3. El cliente real lee la recarga de la vista
// (`recargaDeVista`) y la manda por `enviar`; lo de la lámina (la recarga del imitado, su saldo)
// no se lee fuera de `src/dev/`. La única puerta es `lamina`, que solo trae el imitado.
describe('v1.3-b · la recarga de la lámina solo vive detrás de la puerta DEV', () => {
  // La API de la recarga del imitado se reconoce por la llamada (las claves de texto `ia.recarga.pedir`
  // no la llevan) o por `partida.recarga`.
  const LAMINA = /recargaLamina|saldoLamina|\.recarga\.(abrir|cerrar|recargar|pedir|anular)\(|partida\??\.recarga\b/
  const fuentes = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (
    d.isDirectory() ? fuentes(`${dir}${d.name}/`) : /\.jsx?$/.test(d.name) && !/\.test\./.test(d.name) ? [`${dir}${d.name}`] : []
  ))

  it('ningún archivo fuera de `src/dev/` la lee, y la capa lee la vista real', () => {
    const fuera = fuentes('../').filter((f) => !f.startsWith('../dev/'))
    expect(fuera.length).toBeGreaterThan(100)
    for (const f of fuera) expect(readFileSync(new URL(f, import.meta.url), 'utf8'), f).not.toMatch(LAMINA)
    const capa = readFileSync(new URL('../screens/RecargaPvP.jsx', import.meta.url), 'utf8')
    expect(capa).toMatch(/recargaDeVista\(foto\.vista,/)
    expect(capa).toMatch(/foto\.enviar\(accion/)
  })

  it('control rojo: la capa de la L-M 3 (8b89eb9) cae', () => {
    // `screens/RecargaPvP.jsx:46` y `screens/PartidaPvP.jsx:159` de 8b89eb9, tal cual.
    expect('  const rec = foto.recargaLamina').toMatch(LAMINA)
    expect("      {partida?.recarga && escena === 'mesa' && <RecargaPvP partida={partida} desfase={desfase} />}").toMatch(LAMINA)
    expect('    if (rec.pedida) partida.recarga.anular()').toMatch(LAMINA)
  })
})
