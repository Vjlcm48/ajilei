// MES-PvP 2 §3 · El adaptador, sobre partidas completas sembradas del árbitro real: de 2 a
// 5 asientos y desde cada asiento. Se lee del árbitro lo que el cliente nunca verá, para
// comprobar que no se cuela.
import { afterEach, describe, expect, it } from 'vitest'
import { resetRng, setRng } from '../engine/deck.js'
import { PHASES } from '../engine/gameEngine.js'
import { capasDe } from '../engine/pozos.js'
import { effectiveLayout } from '../config/seatLayouts.js'
import { componeCapas } from '../hooks/cronicaCore.js'
import { lecturaDeMano, resultadoDeMano } from '../hooks/manoCore.js'
import { cronicaDe } from '../hooks/vozHumanos.js'
import { ENTRADAS, CLASES, ETAPAS, FASE_SORTEO, aplicarAccion, crearPartida, partidaTerminada, vistaDe } from '../arbitro/index.js'
import { FASES_APUESTA, FASE_FIN_MESA, FASE_PAGO, VECES_ENTRADA, estadoDeAsiento, vistaAMesa } from './vistaAMesa.js'

function semilla(s) {
  let a = s >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SALA = { id: 'mesa', entrada: 'corta', ritmo: 'normal' }
const SILLAS = [0, 1, 2, 3, 4].map((asiento) => ({ asiento, uid: `u${asiento}`, nombre: `J${asiento}` }))

function accionAlAzar(e, azar) {
  const i = Math.floor(azar() * e.asientos.length)
  const uno = (lista) => lista[Math.floor(azar() * lista.length)]
  const base = { uid: `u${i}`, version: e.version }
  const dado = azar()
  if (dado < 0.003) return { ...base, accion: 'abandonar' }
  if (dado < 0.3) return { ...base, accion: 'reclamar_vencimiento' }
  if (e.vencimiento?.clase === CLASES.PAUSA_ANUNCIO) return { ...base, accion: 'volver_anuncio', mano: e.motor.handCount }
  if (e.sorteo.etapa !== ETAPAS.CERRADO) return { ...base, accion: 'elegir_carta_sorteo', ronda: e.sorteo.ronda, carta: uno([0, 1, 2, 3, 4]) }
  if (e.motor.phase === PHASES.DISCARD) return { ...base, accion: 'descartar', mano: e.motor.handCount, indices: uno([[], [0], [1, 2], [0, 1, 2, 3]]) }
  return {
    ...base,
    uid: `u${e.motor.activePlayerIndex}`,
    accion: 'apostar',
    tipo: uno(['pasar', 'apostar', 'igualar', 'subir', 'allIn', 'retirarse', 'igualar', 'igualar']),
    k: uno([1, 2, 5, 10]),
  }
}

// Una partida entera, con un `game` por asiento, cada uno sobre su lectura anterior.
function jugar(n, s, alLeer) {
  const azar = semilla(s * 1000 + n)
  setRng(semilla(s))
  let e = crearPartida({ apuesta: 100, entrada: 'corta', ritmo: 'normal' }, SILLAS.slice(0, n), 0)
  let ahora = 0
  let pasos = 0
  const previas = Array(n).fill(null)
  const leer = () => {
    for (let a = 0; a < n; a++) {
      const vista = JSON.parse(JSON.stringify(vistaDe(e, a)))
      const game = vistaAMesa(vista, previas[a], SALA)
      alLeer({ e, a, vista, game, previa: previas[a] })
      previas[a] = game
    }
  }
  leer()
  while (!partidaTerminada(e) && !e.asientos.every((x) => x.abandonado)) {
    expect(++pasos, 'la partida no termina').toBeLessThan(60000)
    const peticion = accionAlAzar(e, azar)
    if (peticion.accion === 'reclamar_vencimiento') ahora = Math.max(ahora, e.vencimiento.hora)
    const r = aplicarAccion(e, peticion, { ahora })
    if (!r.respuesta.ok) continue
    e = r.estado
    leer()
  }
}

afterEach(() => resetRng())

describe('MES-PvP 2 · los literales son los del árbitro', () => {
  it('fases y entradas', () => {
    expect(FASE_PAGO).toBe(PHASES.PAYOUT)
    expect(FASE_FIN_MESA).toBe(PHASES.GAME_OVER)
    expect(FASES_APUESTA).toEqual([PHASES.BET_1, PHASES.BET_2, PHASES.BET_3])
    expect(VECES_ENTRADA).toEqual(ENTRADAS)
  })
})

describe('MES-PvP 2 · propiedades, en partidas completas', () => {
  for (const n of [2, 3, 4, 5]) {
    it(`mesa de ${n}, desde cada asiento`, () => {
      const vistos = new Set()
      for (const s of [11, 23, 37, 41]) {
        jugar(n, s, ({ e, a, vista, game, previa }) => {
          const atras = (k) => (k === null ? null : (k + a) % n)
          vistos.add(vista.phase)

          // La rotación se deshace: el propio abajo, y todo lo demás vuelve a su asiento.
          expect(game.players[0].name).toBe(vista.players[a].name)
          game.players.forEach((p, k) => {
            const real = vista.players[atras(k)]
            expect(p.id).toBe(k)
            for (const campo of ['name', 'contrib', 'contribMano', 'folded', 'allIn', 'abandonado', 'cobrado', 'enAnuncio', 'ausente']) {
              expect(p[campo], campo).toEqual(real[campo])
            }
            expect(p.cards).toHaveLength(real.numCartas)
          })
          expect(atras(game.activePlayerIndex)).toBe(vista.activePlayerIndex)
          expect(atras(game.manoIndex)).toBe(vista.manoIndex)
          expect(atras(game.pieIndex)).toBe(vista.pieIndex)
          expect(game.descarte.yaDescartaron.map(atras)).toEqual(vista.descarte.yaDescartaron)
          expect(game.sorteo.participan.map(atras)).toEqual(vista.sorteo.participan)
          expect(game.sorteo.yaEligieron.map(atras)).toEqual(vista.sorteo.yaEligieron)
          game.sorteo.rondas.forEach((r, k) => {
            expect(r.volteo.map((v) => atras(v.asiento))).toEqual(vista.sorteo.rondas[k].volteo.map((v) => v.asiento))
            expect(atras(r.mano)).toBe(vista.sorteo.rondas[k].mano)
          })
          // El orden circular se conserva: el siguiente de cada uno sigue siéndolo.
          for (let k = 0; k < n; k++) {
            expect(game.players[(k + 1) % n].name).toBe(vista.players[(atras(k) + 1) % n].name)
          }

          // Las capas suman el pozo y son las que la mesa recalcula con su fórmula. En el
          // pago el motor ya vació `pot`: el pozo es lo que puso cada uno en la mano.
          expect(game.capas).toEqual(capasDe(game))
          if (vista.phase !== PHASES.GAME_OVER) {
            const pozo = vista.phase === PHASES.PAYOUT ? game.players.reduce((s2, p) => s2 + p.contribMano, 0) : game.pot
            expect(game.capas.reduce((s2, c) => s2 + c.monto, 0)).toBe(pozo)
          }

          // En el pago, la lectura de la mano da el ganador del servidor.
          if (vista.phase === PHASES.PAYOUT) {
            const lectura = lecturaDeMano(game)
            expect(atras(lectura.principal)).toBe(vista.resultado.ganador)
            expect(atras(game.winner)).toBe(vista.resultado.ganador)
            // La pila retenida durante el vuelo no sale negativa (§B.3).
            expect(game.players[lectura.principal].chips).toBeGreaterThanOrEqual(lectura.retencion)
          }

          // Las dos trampas del pago.
          game.players.forEach((p, k) => {
            const real = vista.players[atras(k)]
            if (vista.phase === PHASES.PAYOUT && real.cobrado !== null && real.numCartas > 0) {
              expect(p.eliminated).toBe(false)
              expect(p.chips).toBe(real.cobrado)
              vistos.add('cobra en el pago')
            }
          })
          if (vista.phase !== PHASES.GAME_OVER) {
            expect(game.players[0].eliminated).toBe(false)
            const posiciones = effectiveLayout(game.players)
            game.players.forEach((p, k) => { if (!p.eliminated) expect(posiciones[k], `asiento ${k}`).toBeTruthy() })
          }

          // En el fin, gana quien no está eliminado.
          if (vista.phase === PHASES.GAME_OVER) {
            const vivo = vista.players.findIndex((p) => !p.eliminated)
            expect(game.winner === null ? -1 : atras(game.winner)).toBe(vivo)
          }

          // La voz, sobre partidas de verdad: nombres, nunca «la IA», y nada sin rellenar.
          const lectura = lecturaDeMano(game)
          const frases = [cronicaDe(game, previa), resultadoDeMano(game, lectura)?.texto ?? '', componeCapas(lectura, game.players, game.voz) ?? '']
          for (const frase of frases) expect(frase).not.toMatch(/\bIA\b|undefined|null|NaN/)

          // Los dorsos no cambian de `id` entre lecturas de la misma mano y fase.
          if (previa?.handCount === game.handCount) {
            game.players.forEach((p, k) => {
              if (k === 0 || p.cards.length !== previa.players[k].cards.length) return
              if (p.cards.every((c) => c.dorso) && previa.players[k].cards.every((c) => c.dorso)) {
                expect(p.cards.map((c) => c.id)).toEqual(previa.players[k].cards.map((c) => c.id))
              }
            })
          }

          // Ningún secreto. Del sorteo solo salen las cartas ya volteadas: `rondas` no
          // cuenta aquí, porque una carta de una ronda vieja puede volver a repartirse.
          const { sorteo, ...resto } = game
          const texto = JSON.stringify(resto)
          expect(game).not.toHaveProperty('deck')
          expect(sorteo).not.toHaveProperty('cartas')
          expect(sorteo).not.toHaveProperty('elecciones')
          for (const c of e.motor.deck ?? []) expect(texto).not.toContain(`"${c.id}"`)
          const revelados = new Set((vista.resultado?.revelacion ?? []).map((r) => r.asiento))
          e.motor.players.forEach((p, j) => {
            if (j === a || revelados.has(j)) return
            for (const c of p.cards) expect(texto).not.toContain(`"${c.id}"`)
          })
          if (e.sorteo.etapa === ETAPAS.ELECCION || e.sorteo.etapa === ETAPAS.REPARTO) {
            expect(sorteo.rondas).toHaveLength(e.sorteo.ronda - 1)
            sorteo.posiciones.forEach((x) => expect(Number.isInteger(x)).toBe(true))
          }
          expect(game).not.toHaveProperty('players.0.isHuman')
        })
      }
      // No es una prueba vacía: las partidas pasan por todo.
      for (const f of [FASE_SORTEO, PHASES.BET_1, PHASES.BET_2, PHASES.DISCARD, PHASES.BET_3, PHASES.PAYOUT, 'cobra en el pago']) expect(vistos, f).toContain(f)
    })
  }
})

describe('MES-PvP 2 · lo que depende de la lectura anterior', () => {
  const asiento = (name, extra = {}) => ({
    name, chips: 1000, contrib: 0, contribMano: 100, folded: false, allIn: false, eliminated: false,
    abandonado: false, cobrado: null, enAnuncio: false, ausente: false, numCartas: 2, ...extra,
  })
  const vista = (players, extra = {}) => ({
    version: 1, asiento: 0, phase: PHASES.BET_1, players, currentBet: 0, unit: 100, pot: 300, capas: [],
    activePlayerIndex: 0, manoIndex: 0, pieIndex: 2, handRules: { ruleN: 3 }, handCount: 3, vencimiento: null,
    descarte: { yaDescartaron: [], cuantas: null }, sorteo: { participan: [], yaEligieron: [], rondas: [], posiciones: [] },
    resultado: null, ultimaAccion: null, ...extra,
  })

  it('`eliminatedNames` compara con la previa, se conserva en la mano y se vacía en la siguiente', () => {
    const uno = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')]), null, SALA)
    expect(uno.eliminatedNames).toEqual([])
    const dos = vistaAMesa(vista([asiento('A'), asiento('B', { eliminated: true }), asiento('C')], { handCount: 4 }), uno, SALA)
    expect(dos.eliminatedNames).toEqual(['B'])
    expect(dos.aliveCount).toBe(2)
    const tres = vistaAMesa(vista([asiento('A'), asiento('B', { eliminated: true }), asiento('C')], { handCount: 4, version: 2 }), dos, SALA)
    expect(tres.eliminatedNames).toEqual(['B'])
    const cuatro = vistaAMesa(vista([asiento('A'), asiento('B', { eliminated: true }), asiento('C')], { handCount: 5 }), tres, SALA)
    expect(cuatro.eliminatedNames).toEqual([])
  })

  it('quien salió en el pago entra en `eliminatedNames` en la mano siguiente, no antes', () => {
    const pago = vistaAMesa(vista(
      [asiento('A'), asiento('B', { eliminated: true, abandonado: true, chips: 0, cobrado: 700 }), asiento('C')],
      { phase: PHASES.PAYOUT, resultado: { ganador: 0, ganadoresPorCapa: [0] } },
    ), null, SALA)
    expect(pago.players[1]).toMatchObject({ eliminated: false, chips: 700, cobrado: 700 })
    expect(pago.eliminatedNames).toEqual([])
    const sigue = vistaAMesa(vista([asiento('A'), asiento('B', { eliminated: true, abandonado: true, chips: 0, cobrado: 700, numCartas: 0 }), asiento('C')], { handCount: 4 }), pago, SALA)
    expect(sigue.players[1].eliminated).toBe(true)
    expect(sigue.eliminatedNames).toEqual(['B'])
  })

  it('`selectedDiscards` es local: no viene de la vista y sobrevive a otra lectura de la mano', () => {
    const uno = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')]), null, SALA)
    expect(uno.selectedDiscards).toEqual([])
    const marcadas = { ...uno, selectedDiscards: [1, 3] }
    expect(vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { version: 2 }), marcadas, SALA).selectedDiscards).toEqual([1, 3])
    expect(vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { handCount: 4 }), marcadas, SALA).selectedDiscards).toEqual([])
  })

  it('cada asiento conserva su última jugada hasta la mano siguiente, y el descarte la pisa', () => {
    const accion = (a, tipo) => ({ asiento: a, tipo, puesto: 0, apuestaAntes: 0, apuestaDespues: 0, porReloj: false })
    const uno = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { ultimaAccion: accion(1, 'pasar') }), null, SALA)
    const dos = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { ultimaAccion: accion(2, 'apostar') }), uno, SALA)
    expect(dos.players[1].ultima).toEqual({ tipo: 'pasar' })
    expect(dos.players[2].ultima).toEqual({ tipo: 'apostar' })
    // La vista sigue trayendo la última apuesta en la reposición y en BET_3: no vuelve a pisar.
    const repuesto = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { ultimaAccion: accion(2, 'apostar'), descarte: { yaDescartaron: [0, 1, 2], cuantas: [1, 2, 0] } }), dos, SALA)
    expect(repuesto.players[2].ultima).toEqual({ tipo: 'descarto', n: 0 })
    const tres = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { phase: PHASES.BET_3, ultimaAccion: accion(2, 'apostar'), descarte: { yaDescartaron: [], cuantas: [1, 2, 0] } }), repuesto, SALA)
    expect(tres.players[2].ultima).toEqual({ tipo: 'descarto', n: 0 })
    const otra = vistaAMesa(vista([asiento('A'), asiento('B'), asiento('C')], { handCount: 4 }), tres, SALA)
    expect(otra.players[1].ultima).toBeNull()
  })

  it('la entrada de cada asiento sale de la mesa, y por defecto es la Corta', () => {
    expect(vistaAMesa(vista([asiento('A'), asiento('B')]), null, { entrada: 'llena' }).players[0].entrada).toBe(5000)
    expect(vistaAMesa(vista([asiento('A'), asiento('B')]), null, null).players[1].entrada).toBe(1500)
  })
})

describe('MES-PvP 2 · estadoDeAsiento: uno solo, en este orden', () => {
  const todo = {
    abandonado: true, enAnuncio: true, folded: true, allIn: true, ausente: true, turno: true, ultima: { tipo: 'pasar' },
  }
  const ORDEN = [
    ['abandonado', 'abandono', 'Abandonó'], ['enAnuncio', 'anuncio', 'En anuncio'], ['folded', 'retirado', 'Se retiró'],
    ['allIn', 'allin', 'ALL-IN'], ['ausente', 'ausente', 'Ausente'], ['turno', 'turno', 'Su turno'], ['ultima', 'accion', 'Pasó'],
  ]

  it('cada rótulo gana a todos los que van detrás', () => {
    let seat = { ...todo }
    for (const [campo, tipo, texto] of ORDEN) {
      expect(estadoDeAsiento(seat)).toEqual({ tipo, texto })
      seat = { ...seat, [campo]: campo === 'ultima' ? null : false }
    }
    expect(estadoDeAsiento(seat)).toEqual({ tipo: null, texto: '' })
  })

  it.each([
    [{ tipo: 'apostar' }, 'Apostó'], [{ tipo: 'igualar' }, 'Igualó'], [{ tipo: 'subir' }, 'Subió'], [{ tipo: 'descarto', n: 2 }, 'Descartó 2'],
  ])('la última jugada %j se dice «%s»', (ultima, texto) => {
    expect(estadoDeAsiento({ ultima }).texto).toBe(texto)
  })
})
