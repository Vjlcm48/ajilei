// ── MOT-1 1b §5 · El árbitro, sin red ───────────────────────────────────────
// Una prueba por regla. Toda carta de un escenario se pone a mano en el estado: el
// azar sólo decide en la prueba de propiedad y en el desempate de la tercera ronda.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resetRng, setRng } from '../engine/deck.js'
import { MOTIVOS as MOTIVOS_POZOS } from '../engine/pozos.js'
import { PHASES, applyDiscard, createInitialState, makeHandRules, startHand } from '../engine/gameEngine.js'
import { ajileiDe as ajileiDelCliente } from '../lib/puntos.js'
import {
  CLASES, ESPERA_REPARTO_SORTEO_MS, ETAPAS, FASE_SORTEO, MOTIVOS, MOTIVOS_ARBITRO, abandonarPorServidor, ajileiDe, aplicarAccion,
  azarSeguro, compactarAsientos, crearPartida, partidaTerminada, vistaDe,
} from './index.js'

const M = MOTIVOS

// mulberry32: el generador con semilla de estas pruebas.
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

const SILLAS = [0, 1, 2, 3, 4].map((asiento) => ({ asiento, uid: `u${asiento}`, nombre: `J${asiento}` }))
const crear = (n, ritmo = 'normal', entrada = 'corta') => crearPartida({ apuesta: 100, entrada, ritmo }, SILLAS.slice(0, n), 0)

const carta = (value, palo = 'Copas') => ({ id: `${value}-${palo}`, value, palo, points: value === 1 ? 11 : value === 7 ? 7 : value === 6 ? 6 : 10, name: String(value) })

// Lo que manda cada cliente, con la versión vigente.
const pide = (e, i, accion, campos = {}, ahora = e.vencimiento?.hora ?? 0) => (
  aplicarAccion(e, { uid: `u${i}`, version: e.version, accion, ...campos }, { ahora })
)
const reclama = (e, i = 0) => pide(e, i, 'reclamar_vencimiento').estado

const conMotor = (e, cambios) => ({ ...e, motor: { ...e.motor, ...cambios } })
const conJugador = (e, i, cambios) => conMotor(e, {
  players: e.motor.players.map((p, j) => (j === i ? { ...p, ...cambios } : p)),
})

// Del sorteo a la primera mano: a la Mano la decide la carta que se le pone al ganador.
function hastaLaMano(n, ganador = 0, ritmo = 'normal') {
  let e = reclama(crear(n, ritmo))
  e = { ...e, sorteo: { ...e.sorteo, cartas: e.sorteo.cartas.map((c, i) => c.map(() => carta(i === ganador ? 12 : 2))) } }
  e = reclama(e)
  return reclama(e)
}
const hastaFase = (e, fase) => {
  let x = e
  for (let i = 0; i < 40 && x.motor.phase !== fase; i++) x = reclama(x)
  expect(x.motor.phase).toBe(fase)
  return x
}

const suma = (lista) => lista.reduce((s, x) => s + x, 0)
const cobrado = (e) => suma(e.asientos.map((a) => a.cobrado ?? 0))
const sumaDinero = (e) => suma(e.motor.players.map((p) => p.chips)) + e.motor.pot + cobrado(e)

beforeEach(() => setRng(semilla(7)))
afterEach(() => resetRng())

// ── 1 · Propiedad ───────────────────────────────────────────────────────────
describe('MOT-1 1b · propiedad: partidas completas con acciones al azar', () => {
  const PROHIBIDAS = ['"deck"', '"message"', '"isHuman"', '"nivelIA"', '"uid"', '"ritmo"', '"contribMano"', '"mazo"', '"rng"']

  function vigilarVistas(e) {
    e.asientos.forEach((_, i) => {
      const vista = vistaDe(e, i)
      const texto = JSON.stringify(vista)
      for (const clave of PROHIBIDAS) expect(texto, clave).not.toContain(clave)
      const enMesa = JSON.stringify({ ...vista, sorteo: null })
      for (const c of e.motor.deck ?? []) expect(enMesa).not.toContain(`"${c.id}"`)
      const revelados = new Set((vista.resultado?.revelacion ?? []).map((r) => r.asiento))
      e.motor.players.forEach((p, j) => {
        if (j === i || revelados.has(j)) return
        for (const c of p.cards) expect(enMesa).not.toContain(`"${c.id}"`)
      })
    })
  }

  function accionAlAzar(e, azar) {
    const i = Math.floor(azar() * e.asientos.length)
    const uno = (lista) => lista[Math.floor(azar() * lista.length)]
    const version = azar() < 0.05 ? e.version - 1 : e.version
    const base = { uid: azar() < 0.02 ? null : azar() < 0.02 ? 'nadie' : `u${i}`, version }
    const dado = azar()
    if (dado < 0.002) return { ...base, accion: 'abandonar' }
    if (dado < 0.02) return { ...base, accion: 'inventada' }
    if (dado < 0.35) return { ...base, accion: 'reclamar_vencimiento' }
    if (e.sorteo.etapa !== ETAPAS.CERRADO) {
      return { ...base, accion: 'elegir_carta_sorteo', ronda: e.sorteo.ronda, carta: uno([0, 1, 2, 3, 4, 4, 7, -1, 'x']) }
    }
    if (e.motor.phase === PHASES.DISCARD) {
      return { ...base, accion: 'descartar', mano: e.motor.handCount, indices: uno([[], [0], [1, 2], [0, 1, 2, 3], [9], [1, 1]]) }
    }
    const turno = azar() < 0.85 ? e.motor.activePlayerIndex : i
    return {
      ...base,
      uid: `u${turno}`,
      accion: 'apostar',
      tipo: uno(['pasar', 'apostar', 'igualar', 'subir', 'allIn', 'retirarse', 'igualar', 'subir', 'trampa']),
      k: uno([1, 2, 5, 10, 3, undefined]),
    }
  }

  for (const n of [2, 3, 4, 5]) {
    it(`mesa de ${n}: dinero, versión, rechazos y secretos en cada paso, y siempre termina`, () => {
      for (const s of [11, 23, 37]) {
        const azar = semilla(s * 1000 + n)
        setRng(semilla(s))
        let e = crear(n)
        const total = sumaDinero(e)
        let ahora = 0
        const cobros = new Map()
        let pasos = 0
        let manos = 0
        const sinReclamante = () => e.asientos.every((a) => a.abandonado)
        while (!partidaTerminada(e) && !sinReclamante()) {
          expect(++pasos, 'la partida no termina').toBeLessThan(60000)
          // Como la tabla de partida: el estado sale de la base en JSON.
          const antes = JSON.stringify(e)
          e = JSON.parse(antes)
          const peticion = accionAlAzar(e, azar)
          if (peticion.accion === 'reclamar_vencimiento' && azar() < 0.9) ahora = Math.max(ahora, e.vencimiento.hora)
          const r = aplicarAccion(e, peticion, { ahora })
          if (r.respuesta.ok) {
            expect(r.estado.version).toBe(e.version + 1)
            expect(r.respuesta.version).toBe(r.estado.version)
          } else {
            expect(r.estado).toBe(e)
            expect(JSON.stringify(r.estado)).toBe(antes)
            expect(r.respuesta.version).toBe(e.version)
            expect(Object.values(M)).toContain(r.respuesta.motivo)
            expect(r.efectos).toEqual([])
          }
          for (const ef of r.efectos) {
            if (ef.tipo === 'mano_cerrada') {
              manos++
              r.estado.asientos.forEach((a, i) => { if (a.cobrado !== null) expect(ef.pilas[i], 'pila de un cobrado').toBe(0) })
              expect(suma(ef.pilas) + cobrado(r.estado)).toBe(total)
            }
            if (ef.tipo !== 'salida') continue
            expect(cobros.has(ef.asiento), 'nada se cobra dos veces').toBe(false)
            expect(r.estado.motor.players[ef.asiento].chips).toBe(0)
            expect(r.estado.asientos[ef.asiento].cobrado).toBe(ef.monto)
            cobros.set(ef.asiento, ef.monto)
          }
          e = r.estado
          expect(sumaDinero(e)).toBe(total)
          // Un abandonado nunca tiene a la mesa esperando: ni en su turno, ni en el descarte.
          if (e.sorteo.etapa === ETAPAS.ELECCION) {
            e.sorteo.participan.forEach((i) => { if (e.asientos[i].abandonado) expect(e.sorteo.elecciones[i]).not.toBe(null) })
          }
          if (e.sorteo.etapa === ETAPAS.CERRADO && /^BET_/.test(e.motor.phase)) {
            expect(e.asientos[e.motor.activePlayerIndex].abandonado).toBe(false)
          }
          if (e.sorteo.etapa === ETAPAS.CERRADO && e.motor.phase === PHASES.DISCARD) {
            e.asientos.forEach((a, i) => { if (a.abandonado && !e.motor.players[i].folded) expect(e.descarte[i]).not.toBe(null) })
          }
          if (pasos % 7 === 0) vigilarVistas(e)
        }
        vigilarVistas(e)
        // Que no sea una prueba vacía: se jugó de verdad.
        expect(manos + (sinReclamante() ? 1 : 0)).toBeGreaterThan(0)
        if (partidaTerminada(e)) {
          expect([...cobros.values()].reduce((a, b) => a + b, 0)).toBe(total)
          expect(cobros.size).toBe(n)
        }
      }
    }, 60000)
  }

  it('es puro y nadie del cliente lo importa', () => {
    const fuentes = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (
      d.isDirectory() ? fuentes(`${dir}${d.name}/`) : /\.jsx?$/.test(d.name) && !/\.test\./.test(d.name) ? [`${dir}${d.name}`] : []
    ))
    const leer = (f) => readFileSync(new URL(f, import.meta.url), 'utf8')
    for (const f of fuentes('./')) {
      expect(leer(f), f).not.toMatch(/Date\.now|Math\.random|\bwindow\b|\bdocument\b|from '(react|howler|node:|@supabase)/)
      for (const m of leer(f).matchAll(/from '(\.[^']+)'/g)) expect(m[1], f).toMatch(/\.js$/)
    }
    for (const f of fuentes('../').filter((x) => !x.startsWith('../arbitro/'))) {
      expect(leer(f), f).not.toMatch(/from '[^']*arbitro\//)
    }
  })

  it('el orden de las comprobaciones comunes es el del §2', () => {
    const e = crear(3)
    const a = (p) => aplicarAccion(e, { version: e.version, accion: 'abandonar', ...p }, { ahora: 0 }).respuesta.motivo
    expect(a({ uid: null })).toBe(M.NO_AUTENTICADO)
    expect(a({ uid: 'otro' })).toBe(M.NO_ES_DE_ESTA_MESA)
    const fin = conMotor(e, { phase: PHASES.GAME_OVER })
    expect(pide(fin, 0, 'abandonar').respuesta.motivo).toBe(M.PARTIDA_TERMINADA)
    const fuera = pide(e, 0, 'abandonar').estado
    expect(pide(fuera, 0, 'abandonar', { version: -1 }).respuesta.motivo).toBe(M.ASIENTO_ABANDONADO)
    expect(a({ uid: 'u0', version: 9 })).toBe(M.VERSION_VIEJA)
    expect(a({ uid: 'u0', accion: 'constructor' })).toBe(M.DESCONOCIDA)
  })

  it('los motivos: los once de `pozos.js`, tal cual, y los once del árbitro', () => {
    expect(Object.keys(MOTIVOS_POZOS)).toHaveLength(11)
    expect(Object.keys(MOTIVOS_ARBITRO)).toHaveLength(11)
    for (const [k, v] of Object.entries(MOTIVOS_POZOS)) expect(M[k]).toBe(v)
  })

  it('un `apostar` sin `k` es `monto_invalido`, no un multiplicador por defecto', () => {
    const e = hastaFase(hastaLaMano(2), PHASES.BET_1)
    const r = pide(e, e.motor.activePlayerIndex, 'apostar', { tipo: 'apostar' }, 0)
    expect(r.respuesta.motivo).toBe(M.MONTO_INVALIDO)
  })

  it('las sillas se compactan en orden ascendente', () => {
    const c = compactarAsientos([{ asiento: 3, uid: 'c' }, { asiento: 0, uid: 'a' }, { asiento: 1, uid: 'b' }])
    expect(c.map((a) => a.uid)).toEqual(['a', 'b', 'c'])
    expect(c.map((a) => a.silla)).toEqual([0, 1, 3])
  })

  it('el CSPRNG da números en [0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      const x = azarSeguro()
      expect(x >= 0 && x < 1).toBe(true)
    }
  })

  it('el AJILEI del árbitro y el del cliente dicen lo mismo', () => {
    const copas = [1, 10, 11, 12, 2].map((v) => carta(v, 'Copas'))
    const manos = [
      ...crear(5).sorteo.cartas,
      copas,
      copas.slice(0, 2),
      [carta(1), carta(10), carta(11), carta(12), carta(7, 'Oros')],
    ]
    let conAjilei = 0
    for (const cartas of manos) {
      for (const ruleN of [2, 3, 4, 5]) {
        const reglas = makeHandRules(ruleN)
        const dice = ajileiDe(cartas, reglas)
        if (dice > 0) conAjilei++
        expect(dice).toBe(ajileiDelCliente(cartas, reglas))
      }
    }
    expect(conAjilei).toBeGreaterThan(0)
  })
})

// ── 2 · Sorteo ──────────────────────────────────────────────────────────────
describe('MOT-1 1b · el sorteo', () => {
  const abierto = (n) => reclama(crear(n))
  const conCartas = (e, valores) => ({
    ...e,
    sorteo: { ...e.sorteo, cartas: e.sorteo.cartas.map((c, i) => (c ? c.map(() => carta(valores[i])) : c)) },
  })
  const eligen = (e, asientos) => asientos.reduce(
    (x, i) => pide(x, i, 'elegir_carta_sorteo', { ronda: x.sorteo.ronda, carta: 2 }, 0).estado, e,
  )

  it('arranca en versión 0, ronda 1, con 5 cartas distintas por asiento y su vencimiento', () => {
    const e = crear(5)
    expect(e.version).toBe(0)
    expect(e.sorteo.ronda).toBe(1)
    expect(e.vencimiento.clase).toBe(CLASES.REPARTO_SORTEO)
    const ids = e.sorteo.cartas.flat().map((c) => c.id)
    expect(ids).toHaveLength(25)
    expect(new Set(ids).size).toBe(25)
  })

  it('gana la más alta por `drawRank`: el Rey sobre el 7, y el As es la más baja', () => {
    const e = eligen(conCartas(abierto(3), [7, 12, 1]), [0, 1, 2])
    expect(e.sorteo.etapa).toBe(ETAPAS.VOLTEO)
    expect(e.sorteo.mano).toBe(1)
    const mano = reclama(e)
    expect(mano.motor.manoIndex).toBe(1)
    expect(mano.motor.pieIndex).toBe(0)
    expect(mano.motor.phase).toBe(PHASES.DEAL_2)
    expect(mano.sorteo.etapa).toBe(ETAPAS.CERRADO)
  })

  it('en el empate solo participan los empatados, con cartas nuevas', () => {
    let e = eligen(conCartas(abierto(4), [12, 3, 12, 5]), [0, 1, 2, 3])
    expect(e.sorteo.mano).toBe(null)
    const hora = e.vencimiento.hora
    e = reclama(e)
    expect(e.sorteo.ronda).toBe(2)
    expect(e.vencimiento.hora).toBe(hora + ESPERA_REPARTO_SORTEO_MS)
    expect(e.sorteo.participan).toEqual([0, 2])
    expect(e.sorteo.cartas[1]).toBe(null)
    expect(e.sorteo.cartas[0]).toHaveLength(5)
    e = reclama(e)
    expect(pide(e, 1, 'elegir_carta_sorteo', { ronda: 2, carta: 0 }, 0).respuesta.motivo).toBe(M.NO_PARTICIPA)
  })

  it('la tercera ronda empatada la decide el azar, entre los empatados', () => {
    const ganadores = new Set()
    for (const s of [1, 2, 3, 4, 5, 6, 7, 8]) {
      setRng(semilla(s))
      let e = abierto(3)
      for (let ronda = 1; ronda <= 3; ronda++) {
        e = eligen(conCartas(e, [12, 12, 2]), e.sorteo.participan)
        if (ronda < 3) { expect(e.sorteo.mano).toBe(null); e = reclama(reclama(e)) }
      }
      expect(e.sorteo.rondas[2].azar).toBe(true)
      expect([0, 1]).toContain(e.sorteo.mano)
      ganadores.add(e.sorteo.mano)
    }
    expect(ganadores.size).toBe(2)
  })

  it('al vencer se toma la posición 0 de quien no eligió', () => {
    let e = abierto(2)
    e = {
      ...e,
      sorteo: {
        ...e.sorteo,
        cartas: [[carta(5), carta(12), carta(12), carta(12), carta(12)], [carta(2), carta(12), carta(12), carta(12), carta(12)]],
      },
    }
    expect(pide(e, 0, 'reclamar_vencimiento', {}, e.vencimiento.hora - 1).respuesta.motivo).toBe(M.VENCIMIENTO_NO_CUMPLIDO)
    e = reclama(e)
    const volteo = e.sorteo.rondas[0].volteo
    expect(volteo.map((v) => v.carta.value)).toEqual([5, 2])
    expect(e.sorteo.mano).toBe(0)
  })

  it('las no elegidas nunca aparecen en una vista, y las elegidas sí tras el volteo', () => {
    let e = abierto(3)
    const ids = (i) => e.sorteo.cartas[i].map((c) => c.id)
    const todas = [0, 1, 2].flatMap(ids)
    for (const i of [0, 1, 2]) {
      const texto = JSON.stringify(vistaDe(e, i))
      for (const id of todas) expect(texto).not.toContain(`"${id}"`)
      expect(vistaDe(e, i).sorteo.posiciones).toEqual([0, 1, 2, 3, 4])
      expect(vistaDe(e, i).phase).toBe(FASE_SORTEO)
    }
    const elegidas = [0, 1, 2].map((i) => e.sorteo.cartas[i][2].id)
    e = eligen(e, [0, 1, 2])
    const texto = JSON.stringify(vistaDe(e, 0))
    for (const id of todas) {
      if (elegidas.includes(id)) expect(texto).toContain(`"${id}"`)
      else expect(texto).not.toContain(`"${id}"`)
    }
    expect(JSON.stringify(e.sorteo.cartas)).toBe('[null,null,null]')
  })

  it('`fase`: ronda vieja, reparto aún sin terminar o sorteo cerrado', () => {
    const repartiendo = crear(2)
    expect(pide(repartiendo, 0, 'elegir_carta_sorteo', { ronda: 1, carta: 0 }, 0).respuesta.motivo).toBe(M.FASE)
    const e = abierto(2)
    expect(pide(e, 0, 'elegir_carta_sorteo', { ronda: 2, carta: 0 }, 0).respuesta.motivo).toBe(M.FASE)
    expect(pide(hastaLaMano(2), 0, 'elegir_carta_sorteo', { ronda: 1, carta: 0 }, 0).respuesta.motivo).toBe(M.FASE)
  })

  it('`ya_eligio`, `carta_invalida` y elegir no choca con la versión de otro', () => {
    const e = abierto(3)
    const una = pide(e, 0, 'elegir_carta_sorteo', { ronda: 1, carta: 0 }, 0).estado
    expect(pide(una, 0, 'elegir_carta_sorteo', { ronda: 1, carta: 1 }, 0).respuesta.motivo).toBe(M.YA_ELIGIO)
    expect(pide(una, 1, 'elegir_carta_sorteo', { ronda: 1, carta: 5 }, 0).respuesta.motivo).toBe(M.CARTA_INVALIDA)
    const conVieja = aplicarAccion(una, { uid: 'u1', version: e.version, accion: 'elegir_carta_sorteo', ronda: 1, carta: 1 }, { ahora: 0 })
    expect(conVieja.respuesta.ok).toBe(true)
  })
})

// ── 3 · Descarte ────────────────────────────────────────────────────────────
describe('MOT-1 1b · el descarte', () => {
  const enDescarte = (n) => hastaFase(hastaLaMano(n), PHASES.DISCARD)
  const descarta = (e, i, indices, mano = e.motor.handCount) => aplicarAccion(
    e, { uid: `u${i}`, version: -1, accion: 'descartar', mano, indices }, { ahora: 0 },
  )

  it('`mano` vieja o fuera de `DISCARD` da `fase`', () => {
    const e = enDescarte(3)
    expect(descarta(e, 0, [], e.motor.handCount - 1).respuesta.motivo).toBe(M.FASE)
    const antes = hastaFase(hastaLaMano(3), PHASES.DEAL_2)
    expect(descarta(antes, 0, []).respuesta.motivo).toBe(M.FASE)
  })

  it('el asiento en all-in descarta; el retirado no', () => {
    let e = enDescarte(3)
    e = conJugador(e, 1, { allIn: true, chips: 0 })
    e = conJugador(e, 2, { folded: true })
    expect(descarta(e, 2, []).respuesta.motivo).toBe(M.RETIRADO)
    const r = descarta(e, 1, [0, 1])
    expect(r.respuesta.ok).toBe(true)
    expect(r.estado.descarte[1]).toEqual([0, 1])
  })

  it('se rechaza lo que el motor recortaría: mesa de 5, tope 3', () => {
    const e = enDescarte(5)
    expect(e.motor.handRules.maxDiscard).toBe(3)
    const motivo = (ind) => descarta(e, 0, ind).respuesta.motivo
    expect(motivo([0, 1, 2, 3])).toBe(M.DESCARTE_INVALIDO)
    expect(motivo([5])).toBe(M.DESCARTE_INVALIDO)
    expect(motivo([1, 1])).toBe(M.DESCARTE_INVALIDO)
    expect(motivo([0.5])).toBe(M.DESCARTE_INVALIDO)
    expect(motivo('0')).toBe(M.DESCARTE_INVALIDO)
    expect(descarta(e, 0, [0, 1, 2]).respuesta.ok).toBe(true)
  })

  it('cada asiento repone lo suyo, en orden Mano→Pie, y sólo al descartar todos', () => {
    let e = enDescarte(3)
    const antes = e.motor.players.map((p) => p.cards.map((c) => c.id))
    const mazo = e.motor.deck.map((c) => c.id)
    const mano = e.motor.manoIndex
    e = descarta(e, 2, [0]).estado
    e = descarta(e, 1, []).estado
    expect(e.motor.phase).toBe(PHASES.DISCARD)
    expect(vistaDe(e, 0).descarte.yaDescartaron).toEqual([1, 2])
    expect(JSON.stringify(vistaDe(e, 0).descarte)).not.toContain('indices')
    e = descarta(e, 0, [3, 4]).estado
    expect(e.motor.phase).toBe(PHASES.BET_3)
    const orden = [0, 1, 2].map((k) => (mano + k) % 3)
    let ptr = 0
    const quita = { 0: [3, 4], 1: [], 2: [0] }
    for (const i of orden) {
      const esperadas = antes[i].map((id, k) => (quita[i].includes(k) ? mazo[ptr++] : id))
      expect(e.motor.players[i].cards.map((c) => c.id)).toEqual(esperadas)
    }
    expect(vistaDe(e, 2).descarte.cuantas).toEqual([2, 0, 1])
    expect(descarta(e, 0, []).respuesta.motivo).toBe(M.FASE)
  })

  it('edición 3: la llamada de hoy contra las IAS da lo mismo, y las IAS no cambian de cerebro', () => {
    const mesa = () => {
      setRng(semilla(3))
      let s = startHand(createInitialState(100, 3))
      s = { ...s, phase: PHASES.DISCARD, deck: s.deck, players: s.players.map((p) => ({ ...p, cards: [...p.cards, ...s.deck.slice(0, 3)] })) }
      return s
    }
    const conLista = applyDiscard(mesa(), [0, 1])
    const conMapa = applyDiscard(mesa(), { 0: [0, 1] })
    expect(conMapa).toEqual(conLista)
    expect(applyDiscard(mesa(), {})).toEqual(applyDiscard(mesa(), []))
  })

  it('`ya_descarto`', () => {
    const e = descarta(enDescarte(3), 0, []).estado
    expect(descarta(e, 0, [1]).respuesta.motivo).toBe(M.YA_DESCARTO)
  })
})

// ── 4 · Vencimientos ────────────────────────────────────────────────────────
describe('MOT-1 1b · los vencimientos', () => {
  it('turno: `pasar` si es legal; si no, `retirarse`', () => {
    let e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const primero = e.motor.activePlayerIndex
    e = reclama(e)
    expect(e.motor.players[primero].folded).toBe(false)
    expect(e.motor.players[primero].acted).toBe(true)
    const segundo = e.motor.activePlayerIndex
    e = pide(e, segundo, 'apostar', { tipo: 'apostar', k: 1 }, 0).estado
    const tercero = e.motor.activePlayerIndex
    e = reclama(e, segundo)
    expect(e.motor.players[tercero].folded).toBe(true)
  })

  it('descarte vacío para quien falte, y aplica', () => {
    let e = hastaFase(hastaLaMano(3), PHASES.DISCARD)
    const cartas1 = e.motor.players[1].cards.map((c) => c.id)
    e = pide(e, 0, 'descartar', { mano: e.motor.handCount, indices: [0] }, 0).estado
    expect(e.motor.phase).toBe(PHASES.DISCARD)
    e = reclama(e)
    expect(e.motor.phase).toBe(PHASES.BET_3)
    expect(e.motor.players[1].cards.map((c) => c.id)).toEqual(cartas1)
  })

  it('`vencimiento_no_cumplido` antes de la hora, y la hora la pone el servidor', () => {
    const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const r = pide(e, 0, 'reclamar_vencimiento', {}, e.vencimiento.hora - 1)
    expect(r.respuesta.motivo).toBe(M.VENCIMIENTO_NO_CUMPLIDO)
    expect(r.estado).toBe(e)
    expect(pide(e, 0, 'reclamar_vencimiento', {}, e.vencimiento.hora).respuesta.ok).toBe(true)
  })

  it('un asiento retirado puede reclamar; si dos reclaman, el segundo llega viejo', () => {
    let e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    e = conJugador(e, 2, { folded: true })
    const primero = pide(e, 2, 'reclamar_vencimiento')
    expect(primero.respuesta.ok).toBe(true)
    const segundo = aplicarAccion(primero.estado, { uid: 'u1', version: e.version, accion: 'reclamar_vencimiento' }, { ahora: e.vencimiento.hora })
    expect(segundo.respuesta.motivo).toBe(M.VERSION_VIEJA)
  })

  it('la mano ganada por retirada: sin cartas de nadie, ganador por la capa 0 y 4 s al cierre', () => {
    let e = hastaFase(hastaLaMano(2), PHASES.BET_1)
    const activo = e.motor.activePlayerIndex
    const ahora = 5000
    const r = pide(e, activo, 'apostar', { tipo: 'retirarse' }, ahora)
    e = r.estado
    expect(e.motor.phase).toBe(PHASES.PAYOUT)
    expect(e.vencimiento).toEqual({ clase: CLASES.MANO_SIGUIENTE, hora: ahora + 4000 })
    const cierre = r.efectos.find((x) => x.tipo === 'mano_cerrada')
    expect(cierre.ganador).toBe(1 - activo)
    const vista = vistaDe(e, activo)
    expect(vista.resultado.ganador).toBe(1 - activo)
    expect(vista.resultado.revelacion).toBeUndefined()
  })

  it('el ganador de la mano es la capa 0 aunque `state.winner` sea la capa de arriba', () => {
    let e = hastaFase(hastaLaMano(3), PHASES.BET_3)
    e = conMotor(e, {
      pot: 700,
      manoIndex: 0,
      currentBet: 0,
      activePlayerIndex: 1,
      players: e.motor.players.map((p, i) => ({
        ...p,
        chips: i === 0 ? 0 : 1000,
        allIn: i === 0,
        contrib: 0,
        acted: i === 2,
        contribMano: i === 0 ? 100 : 300,
        cards: i === 0
          ? [carta(1, 'Oros'), carta(12, 'Oros'), carta(11, 'Oros'), carta(10, 'Oros'), carta(7, 'Oros')]
          : i === 1
            ? [carta(12, 'Copas'), carta(11, 'Copas'), carta(10, 'Copas'), carta(2, 'Bastos'), carta(3, 'Bastos')]
            : [carta(2, 'Copas'), carta(3, 'Copas'), carta(4, 'Espadas'), carta(5, 'Bastos'), carta(6, 'Oros')],
      })),
    })
    const r = pide(e, 1, 'apostar', { tipo: 'pasar' }, 0)
    expect(r.estado.motor.phase).toBe(PHASES.PAYOUT)
    expect(r.estado.motor.winner).toBe(1)
    const cierre = r.efectos.find((x) => x.tipo === 'mano_cerrada')
    expect(cierre.ganador).toBe(0)
    expect(cierre.pilas).toEqual(r.estado.motor.players.map((p) => p.chips))
    const vista = vistaDe(r.estado, 2)
    expect(vista.resultado.ganador).toBe(0)
    expect(vista.resultado.revelacion.map((x) => x.asiento)).toEqual([0, 1, 2])
  })

  it('tras la revelación, la coreografía y 4 s', () => {
    const e = hastaFase(hastaLaMano(2), PHASES.BET_3)
    const r = [0, 1].reduce((x) => pide(x, x.motor.activePlayerIndex, 'apostar', { tipo: 'pasar' }, 1000).estado, e)
    expect(r.motor.phase).toBe(PHASES.PAYOUT)
    expect(r.vencimiento.clase).toBe(CLASES.MANO_SIGUIENTE)
    expect(r.vencimiento.hora).toBe(1000 + 960 + 4000)
    expect(reclama(r).motor.handCount).toBe(2)
  })

  it('la partida termina con `partida_terminada` cuando el motor llega a `GAME_OVER`', () => {
    let e = hastaFase(hastaLaMano(2), PHASES.BET_1)
    e = conJugador(e, 0, { chips: 50 })
    const activo = e.motor.activePlayerIndex
    e = pide(e, activo, 'apostar', { tipo: 'retirarse' }, 0).estado
    e = conJugador(e, 0, { chips: 50 })
    e = conJugador(e, 1, { chips: 2950 })
    const r = pide(e, 1, 'reclamar_vencimiento')
    expect(r.estado.motor.phase).toBe(PHASES.GAME_OVER)
    expect(r.estado.vencimiento).toBe(null)
    expect(r.efectos.at(-1)).toEqual({ tipo: 'partida_terminada', ganador: 1 })
    expect(r.efectos.filter((x) => x.tipo === 'salida')).toEqual([
      { tipo: 'salida', asiento: 0, monto: 50 },
      { tipo: 'salida', asiento: 1, monto: 2950 },
    ])
    const final = vistaDe(r.estado, 0).players
    expect(final.map((p) => p.chips)).toEqual([0, 0])
    expect(final.map((p) => p.cobrado)).toEqual([50, 2950])
    expect(pide(r.estado, 1, 'reclamar_vencimiento').respuesta.motivo).toBe(M.PARTIDA_TERMINADA)
  })
})

// ── 5 · Abandono ────────────────────────────────────────────────────────────
describe('MOT-1 1b · el abandono', () => {
  const GANADORA = [carta(1, 'Oros'), carta(12, 'Oros'), carta(11, 'Oros'), carta(10, 'Oros'), carta(7, 'Oros')]
  const MALA = [carta(2, 'Copas'), carta(3, 'Copas'), carta(4, 'Espadas'), carta(5, 'Bastos'), carta(6, 'Oros')]

  it('el abandonado en all-in sigue disputando la mano y, si gana, el premio va a su pila (C-8)', () => {
    let e = hastaFase(hastaLaMano(3), PHASES.BET_3)
    e = conMotor(e, {
      pot: 700,
      manoIndex: 1,
      activePlayerIndex: 1,
      currentBet: 0,
      players: e.motor.players.map((p, i) => ({
        ...p,
        chips: i === 0 ? 0 : 1000,
        allIn: i === 0,
        contrib: 0,
        acted: false,
        contribMano: i === 0 ? 100 : 300,
        cards: i === 0 ? GANADORA : MALA,
      })),
    })
    e = pide(e, 0, 'abandonar', {}, 0).estado
    expect(e.motor.players[0].folded).toBe(false)
    e = pide(e, 1, 'apostar', { tipo: 'pasar' }, 0).estado
    const r = pide(e, 2, 'apostar', { tipo: 'pasar' }, 0)
    const cierre = r.efectos.find((x) => x.tipo === 'mano_cerrada')
    expect(cierre.ganador).toBe(0)
    expect(cierre.pilas[0]).toBe(0)
    expect(r.efectos).toContainEqual({ tipo: 'salida', asiento: 0, monto: 300 })
    expect(r.estado.motor.players[0].eliminated).toBe(true)
    expect(r.estado.motor.players[0].chips).toBe(0)
    expect(r.estado.asientos[0].cobrado).toBe(300)
    expect(vistaDe(r.estado, 1).resultado.ganador).toBe(0)
    const sig = reclama(r.estado, 1)
    expect(sig.motor.players[0].folded).toBe(true)
    expect(sig.motor.aliveCount).toBe(2)
  })

  it('nada se paga dos veces: la pila queda en 0 y ninguna `mano_cerrada` la vuelve a incluir', () => {
    let e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const total = sumaDinero(e)
    while (e.motor.phase !== PHASES.PAYOUT) e = pide(e, e.motor.activePlayerIndex, 'apostar', { tipo: 'retirarse' }, 0).estado
    const pila = e.motor.players[1].chips
    expect(pila).toBeGreaterThan(0)

    const sale = pide(e, 1, 'abandonar', {}, 0)
    expect(sale.efectos).toEqual([{ tipo: 'salida', asiento: 1, monto: pila }])
    expect(sale.estado.motor.players[1].chips).toBe(0)
    expect(sumaDinero(sale.estado)).toBe(total)

    let sig = hastaFase(reclama(sale.estado), PHASES.BET_1)
    const r = pide(sig, sig.motor.activePlayerIndex, 'apostar', { tipo: 'retirarse' }, 0)
    sig = r.estado
    const cierre = r.efectos.find((x) => x.tipo === 'mano_cerrada')
    expect(cierre.pilas[1]).toBe(0)
    expect(suma(cierre.pilas) + cobrado(sig)).toBe(total)
    expect(r.efectos.filter((x) => x.tipo === 'salida')).toEqual([])
  })

  it('actúa al instante: en su turno se retira y en el descarte descarta vacío, sin esperar el reloj', () => {
    // Abandona en su turno: se retira ya, aunque pudiera pasar, y el reloj es del siguiente.
    const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const primero = e.motor.activePlayerIndex
    const segundo = reclama(e, primero).motor.activePlayerIndex
    const tercero = 3 - primero - segundo
    const enSuTurno = pide(e, primero, 'abandonar', {}, 1000)
    expect(enSuTurno.estado.motor.players[primero].folded).toBe(true)
    expect(enSuTurno.estado.motor.activePlayerIndex).toBe(segundo)
    expect(enSuTurno.estado.vencimiento).toEqual({ clase: CLASES.TURNO, hora: 1000 + 20000 })

    // Abandona antes de que le toque: se retira cuando le llega, y sin dar un paso más.
    const antes = pide(e, segundo, 'abandonar', {}, 0).estado
    expect(antes.motor.players[segundo].folded).toBe(false)
    const movio = pide(antes, primero, 'apostar', { tipo: 'pasar' }, 1000).estado
    expect(movio.motor.players[segundo].folded).toBe(true)
    expect(movio.motor.activePlayerIndex).toBe(tercero)

    // En el descarte: si era el último que faltaba, la mesa sigue en el acto.
    let d = hastaFase(hastaLaMano(3), PHASES.DISCARD)
    d = pide(d, 0, 'descartar', { mano: d.motor.handCount, indices: [0] }, 0).estado
    d = pide(d, 1, 'descartar', { mano: d.motor.handCount, indices: [] }, 0).estado
    const cartas = d.motor.players[2].cards.map((c) => c.id)
    const ultimo = pide(d, 2, 'abandonar', {}, 0).estado
    expect(ultimo.motor.phase).toBe(PHASES.BET_3)
    expect(ultimo.descartaron).toEqual([1, 0, 0])
    expect(ultimo.motor.players[2].cards.map((c) => c.id)).toEqual(cartas)

    // En all-in no se retira y llega al descarte: descarta vacío al abrirse.
    let v = hastaFase(hastaLaMano(3), PHASES.BET_2)
    const uno = v.motor.activePlayerIndex
    const dos = reclama(v, uno).motor.activePlayerIndex
    const tres = 3 - uno - dos
    v = pide(conJugador(v, tres, { allIn: true, chips: 0 }), tres, 'abandonar', {}, 0).estado
    v = pide(v, uno, 'apostar', { tipo: 'pasar' }, 0).estado
    v = pide(v, dos, 'apostar', { tipo: 'pasar' }, 0).estado
    expect(v.motor.phase).toBe(PHASES.DISCARD)
    expect(v.motor.players[tres].folded).toBe(false)
    expect(v.descarte[tres]).toEqual([])
    expect(v.vencimiento.clase).toBe(CLASES.DESCARTE)
  })

  it('la vista dice quién abandonó y cuánto cobró, a todos los asientos', () => {
    const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    expect(vistaDe(e, 0).players.map((p) => p.abandonado)).toEqual([false, false, false])
    expect(vistaDe(e, 0).players.map((p) => p.cobrado)).toEqual([null, null, null])
    const r = pide(e, 2, 'abandonar', {}, 0).estado
    for (const i of [0, 1, 2]) {
      expect(vistaDe(r, i).players.map((p) => p.abandonado)).toEqual([false, false, true])
      expect(vistaDe(r, i).players.map((p) => p.cobrado)).toEqual([null, null, null])
    }
    const enSorteo = pide(crear(3), 2, 'abandonar', {}, 0).estado
    for (const i of [0, 1, 2]) expect(vistaDe(enSorteo, i).players.map((p) => p.cobrado)).toEqual([null, null, 1500])
  })

  it('en el sorteo elige al instante la posición 0, sin esperar los 10 s', () => {
    const abierto = reclama(crear(3))
    const elige = (x, i) => pide(x, i, 'elegir_carta_sorteo', { ronda: x.sorteo.ronda, carta: 1 }, 0).estado

    // Con la elección abierta, y otro aún sin elegir: se anota y la ronda sigue abierta.
    const uno = pide(elige(abierto, 0), 2, 'abandonar', {}, 500).estado
    expect(uno.sorteo.etapa).toBe(ETAPAS.ELECCION)
    expect(uno.sorteo.elecciones).toEqual([1, null, 0])
    expect(uno.vencimiento).toEqual(abierto.vencimiento)
    expect(vistaDe(uno, 1).sorteo.yaEligieron).toEqual([0, 2])

    // Si era el último que faltaba, voltea en el acto, con su posición 0.
    const r = pide(elige(elige(abierto, 0), 1), 2, 'abandonar', {}, 500)
    expect(r.efectos).toEqual([{ tipo: 'salida', asiento: 2, monto: 1500 }])
    expect(r.estado.sorteo.etapa).toBe(ETAPAS.VOLTEO)
    expect(r.estado.vencimiento).toEqual({ clase: CLASES.VOLTEO_SORTEO, hora: 500 + 3000 })
    expect(r.estado.sorteo.rondas[0].volteo[2].carta).toEqual(abierto.sorteo.cartas[2][0])

    // Si abandona durante el reparto, elige al abrirse la elección.
    const antes = pide(crear(3), 2, 'abandonar', {}, 0).estado
    expect(antes.sorteo.etapa).toBe(ETAPAS.REPARTO)
    const abre = reclama(antes)
    expect(abre.sorteo.etapa).toBe(ETAPAS.ELECCION)
    expect(abre.sorteo.elecciones).toEqual([null, null, 0])

    // Si el empate lo lleva a otra ronda, elige también en ésa.
    const empate = { ...abierto, sorteo: { ...abierto.sorteo, cartas: abierto.sorteo.cartas.map((c, i) => c.map(() => carta(i === 2 ? 2 : 12))) } }
    const sale = pide(elige(empate, 2), 1, 'abandonar', {}, 0).estado
    const volteo = pide(sale, 0, 'elegir_carta_sorteo', { ronda: 1, carta: 1 }, 0).estado
    expect(volteo.sorteo.etapa).toBe(ETAPAS.VOLTEO)
    expect(volteo.sorteo.participan).toEqual([0, 1])
    const ronda2 = reclama(reclama(volteo))
    expect(ronda2.sorteo.ronda).toBe(2)
    expect(ronda2.sorteo.elecciones).toEqual([null, 0, null])
  })

  it('en mano no mueve dinero; sin mano en curso cobra en el acto', () => {
    const enMano = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const r = pide(enMano, 0, 'abandonar', {}, 0)
    expect(r.efectos).toEqual([])
    expect(r.estado.asientos[0].abandonado).toBe(true)
    expect(pide(r.estado, 0, 'apostar', { tipo: 'retirarse' }, 0).respuesta.motivo).toBe(M.ASIENTO_ABANDONADO)

    const sorteo = pide(crear(3), 1, 'abandonar', {}, 0)
    expect(sorteo.efectos).toEqual([{ tipo: 'salida', asiento: 1, monto: 1500 }])
    expect(sorteo.estado.motor.players[1].eliminated).toBe(true)
  })

  it('en el sorteo, quedarse sin rivales termina la partida', () => {
    const r = pide(crear(2), 1, 'abandonar', {}, 0)
    expect(partidaTerminada(r.estado)).toBe(true)
    expect(r.efectos).toEqual([
      { tipo: 'salida', asiento: 1, monto: 1500 },
      { tipo: 'salida', asiento: 0, monto: 1500 },
      { tipo: 'partida_terminada', ganador: 0 },
    ])
  })

  it('lo marca el servidor sin versión; un segundo abandono no hace nada', () => {
    const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const r = abandonarPorServidor(e, 'u1', { ahora: 0 })
    expect(r.respuesta.ok).toBe(true)
    expect(r.estado.version).toBe(e.version + 1)
    expect(abandonarPorServidor(r.estado, 'u1', { ahora: 0 }).respuesta.motivo).toBe(M.ASIENTO_ABANDONADO)
    expect(abandonarPorServidor(e, 'nadie', { ahora: 0 }).respuesta.motivo).toBe(M.NO_ES_DE_ESTA_MESA)
  })
})
