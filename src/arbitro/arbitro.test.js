// ── MOT-1 1b §5 · El árbitro, sin red ───────────────────────────────────────
// Una prueba por regla. Toda carta de un escenario se pone a mano en el estado: el
// azar sólo decide en la prueba de propiedad y en el desempate de la tercera ronda.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resetRng, setRng } from '../engine/deck.js'
import { MOTIVOS as MOTIVOS_POZOS } from '../engine/pozos.js'
import { PHASES, applyDiscard, createInitialState, makeHandRules, startHand } from '../engine/gameEngine.js'
import { ajileiDe as ajileiDelCliente } from '../lib/puntos.js'
import { BARAJADO_MS, VOLTEO_SORTEO_MS } from '../config/esperas.js'
import {
  CLASES, ETAPAS, FASE_SORTEO, MOTIVOS, MOTIVOS_ARBITRO, abandonarPorServidor, ajileiDe, aplicarAccion, ganadorDeMano,
  azarSeguro, compactarAsientos, crearPartida, esperaRepartoSorteo, partidaTerminada, puedeMandarMensaje, vistaDe,
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
const aCero = (e) => ({ ...e, asientos: e.asientos.map((a) => ({ ...a, vencidos: 0 })) })

// Del sorteo a la primera mano: a la Mano la decide la carta que se le pone al ganador.
function hastaLaMano(n, ganador = 0, ritmo = 'normal') {
  let e = reclama(reclama(crear(n, ritmo)))
  e = { ...e, sorteo: { ...e.sorteo, cartas: e.sorteo.cartas.map((c, i) => c.map(() => carta(i === ganador ? 12 : 2))) } }
  e = reclama(e)
  return reclama(e)
}
const hastaFase = (e, fase) => {
  let x = e
  // Avanzar por reloj no debe abandonar a nadie: estas pruebas no van de la ausencia.
  for (let i = 0; i < 40 && x.motor.phase !== fase; i++) x = aCero(reclama(x))
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
  const PROHIBIDAS = ['"deck"', '"message"', '"isHuman"', '"nivelIA"', '"uid"', '"ritmo"', '"mazo"', '"rng"', '"motorTrasDescarte"', '"vencidos"', '"sinAnuncio"']

  function vigilarVistas(e) {
    e.asientos.forEach((_, i) => {
      const vista = vistaDe(e, i)
      const texto = JSON.stringify(vista)
      for (const clave of PROHIBIDAS) expect(texto, clave).not.toContain(clave)
      // Los cinco campos de la v1.1 son datos: ninguno lleva una carta.
      const nuevos = JSON.stringify([
        vista.ultimaAccion,
        vista.players.map((p) => [p.contribMano, p.enAnuncio, p.ausente]),
        vista.sorteo.rondas.flatMap((r) => r.volteo.map((v) => v.posicion)),
      ])
      expect(nuevos).not.toContain('"id"')
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
    if (e.vencimiento?.clase === CLASES.PAUSA_ANUNCIO) {
      return { ...base, accion: 'volver_anuncio', mano: e.motor.handCount - (dado < 0.4 ? 1 : 0) }
    }
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

  const clasesVistas = new Set()

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
          r.efectos.forEach((ef, k) => {
            if (ef.tipo !== 'mano_cerrada') return
            manos++
            // MES-PvP 3-A · el fin en la misma jugada (R2) cobra a quien se queda DESPUÉS del
            // cierre: su pila del cierre es lo que cobra, la misma plata, y no se suma dos veces.
            const despues = r.efectos.slice(k + 1).filter((x) => x.tipo === 'salida')
            r.estado.asientos.forEach((a, i) => {
              if (a.cobrado === null) return
              expect([0, despues.find((x) => x.asiento === i)?.monto ?? 0], 'pila de un cobrado').toContain(ef.pilas[i])
            })
            const doble = suma(despues.map((x) => ef.pilas[x.asiento]))
            expect(suma(ef.pilas) + cobrado(r.estado) - doble).toBe(total)
          })
          for (const ef of r.efectos) {
            if (ef.tipo !== 'salida') continue
            expect(cobros.has(ef.asiento), 'nada se cobra dos veces').toBe(false)
            expect(r.estado.motor.players[ef.asiento].chips).toBe(0)
            expect(r.estado.asientos[ef.asiento].cobrado).toBe(ef.monto)
            cobros.set(ef.asiento, ef.monto)
          }
          // Con la ausencia en 3, el azar abandona a casi todos antes de arruinar a nadie:
          // esta semilla juega sin ella, para que la bancarrota y su aviso sigan pasando por aquí.
          e = s === 37 ? aCero(r.estado) : r.estado
          expect(sumaDinero(e)).toBe(total)
          if (e.vencimiento) clasesVistas.add(e.vencimiento.clase)
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

  it('que no sea una prueba vacía: entre las cuatro mesas, el azar pasó por todos los relojes', () => {
    expect([...clasesVistas].sort()).toEqual(Object.values(CLASES).sort())
  })

  it('es puro y nadie del cliente lo importa', () => {
    const fuentes = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (
      d.isDirectory() ? fuentes(`${dir}${d.name}/`) : /\.jsx?$/.test(d.name) && !/\.test\./.test(d.name) ? [`${dir}${d.name}`] : []
    ))
    const leer = (f) => readFileSync(new URL(f, import.meta.url), 'utf8')
    for (const f of fuentes('./')) {
      expect(leer(f), f).not.toMatch(/Date\.now|Math\.random|\bwindow\b|\bdocument\b|from '(react|howler|node:|@supabase)/)
      for (const m of leer(f).matchAll(/from '(\.[^']+)'/g)) expect(m[1], f).toMatch(/\.js$/)
    }
    // Del árbitro, el cliente solo lee sus motivos (`index.js`, cabecera; ficha 1f §2). La
    // excepción es el árbitro imitado, que es el árbitro y no llega a `dist/` (`testDistSinMoldes`).
    for (const f of fuentes('../').filter((x) => !x.startsWith('../arbitro/') && x !== '../dev/partidaImitada.js')) {
      expect(leer(f), f).not.toMatch(/from '[^']*arbitro\/(?!motivos\.js')/)
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

  it('los motivos: los once de `pozos.js`, tal cual, y los quince del árbitro (v1.3: tres del mensaje)', () => {
    expect(Object.keys(MOTIVOS_POZOS)).toHaveLength(11)
    expect(Object.keys(MOTIVOS_ARBITRO)).toHaveLength(15)
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
  const abierto = (n) => reclama(reclama(crear(n)))
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
    expect(e.vencimiento.clase).toBe(CLASES.BARAJADO_SORTEO)
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
    expect(e.sorteo.etapa).toBe(ETAPAS.BARAJADO)
    expect(e.vencimiento).toEqual({ clase: CLASES.BARAJADO_SORTEO, hora: hora + BARAJADO_MS })
    expect(e.sorteo.participan).toEqual([0, 2])
    expect(e.sorteo.cartas[1]).toBe(null)
    expect(e.sorteo.cartas[0]).toHaveLength(5)
    e = reclama(e)
    expect(e.sorteo.etapa).toBe(ETAPAS.REPARTO)
    expect(e.vencimiento).toEqual({ clase: CLASES.REPARTO_SORTEO, hora: hora + BARAJADO_MS + esperaRepartoSorteo(2) })
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
        if (ronda < 3) { expect(e.sorteo.mano).toBe(null); e = reclama(reclama(reclama(e))) }
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
    expect(e.vencimiento.clase).toBe(CLASES.REPOSICION)
    const orden = [0, 1, 2].map((k) => (mano + k) % 3)
    let ptr = 0
    const quita = { 0: [3, 4], 1: [], 2: [0] }
    for (const i of orden) {
      const esperadas = antes[i].map((id, k) => (quita[i].includes(k) ? mazo[ptr++] : id))
      expect(e.motor.players[i].cards.map((c) => c.id)).toEqual(esperadas)
    }
    expect(vistaDe(e, 2).descarte.cuantas).toEqual([2, 0, 1])
    e = reclama(e)
    expect(e.motor.phase).toBe(PHASES.BET_3)
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
    e = reclama(reclama(e))
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

  it('tras la revelación, la red de la celebración y la lectura', () => {
    const e = hastaFase(hastaLaMano(2), PHASES.BET_3)
    const r = [0, 1].reduce((x) => pide(x, x.motor.activePlayerIndex, 'apostar', { tipo: 'pasar' }, 1000).estado, e)
    expect(r.motor.phase).toBe(PHASES.PAYOUT)
    expect(r.vencimiento.clase).toBe(CLASES.MANO_SIGUIENTE)
    expect(r.vencimiento.hora).toBe(1000 + 6000 + 2000)
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

  // MES-PvP 3-A · reescrita: con la C-8 vieja seguía disputando y, con la mano ganadora,
  // cobraba el pozo. Con la v1.2 se retira en el acto y pierde lo que puso.
  it('el abandonado en all-in se retira en el acto: con la mano ganadora, no cobra nada del pozo (C-8, v1.2)', () => {
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
    const total = sumaDinero(e)
    const sale = pide(e, 0, 'abandonar', {}, 0)
    expect(sale.estado.motor.players[0].folded).toBe(true)
    expect(sale.efectos).toEqual([])
    e = pide(sale.estado, 1, 'apostar', { tipo: 'pasar' }, 0).estado
    const r = pide(e, 2, 'apostar', { tipo: 'pasar' }, 0)
    const cierre = r.efectos.find((x) => x.tipo === 'mano_cerrada')
    expect(cierre.ganador).not.toBe(0)
    expect(cierre.pilas[0]).toBe(0)
    expect(r.efectos).toContainEqual({ tipo: 'salida', asiento: 0, monto: 0 })
    expect(r.estado.motor.players[0].eliminated).toBe(true)
    expect(r.estado.asientos[0].cobrado).toBe(0)
    expect(suma(cierre.pilas)).toBe(total)
    expect(vistaDe(r.estado, 1).resultado.ganador).toBe(cierre.ganador)
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

  // MES-PvP 3-A · reescrita: con la C-8 vieja, fuera de su turno esperaba a que le tocara, en
  // el descarte descartaba vacío y en all-in seguía en la mano. Con la v1.2 se retira en el acto.
  it('se retira en el acto, en cualquier fase: en su turno, fuera de él, en el descarte y en all-in (C-8, v1.2)', () => {
    // Abandona en su turno: se retira ya, aunque pudiera pasar, y el reloj es del siguiente.
    const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const primero = e.motor.activePlayerIndex
    const segundo = reclama(e, primero).motor.activePlayerIndex
    const tercero = 3 - primero - segundo
    const enSuTurno = pide(e, primero, 'abandonar', {}, 1000)
    expect(enSuTurno.estado.motor.players[primero].folded).toBe(true)
    expect(enSuTurno.estado.motor.activePlayerIndex).toBe(segundo)
    expect(enSuTurno.estado.vencimiento).toEqual({ clase: CLASES.TURNO, hora: 1000 + 20000 })

    // Abandona antes de que le toque: se retira ya, y el reloj de quien juega no cambia.
    const antes = pide(e, segundo, 'abandonar', {}, 0).estado
    expect(antes.motor.players[segundo].folded).toBe(true)
    expect(antes.motor.activePlayerIndex).toBe(primero)
    expect(antes.vencimiento).toEqual(e.vencimiento)
    const movio = pide(antes, primero, 'apostar', { tipo: 'pasar' }, 1000).estado
    expect(movio.motor.activePlayerIndex).toBe(tercero)

    // En el descarte: no descarta, está retirado; si era el último que faltaba, la mesa sigue en el acto.
    let d = hastaFase(hastaLaMano(3), PHASES.DISCARD)
    d = pide(d, 0, 'descartar', { mano: d.motor.handCount, indices: [0] }, 0).estado
    d = pide(d, 1, 'descartar', { mano: d.motor.handCount, indices: [] }, 0).estado
    const cartas = d.motor.players[2].cards.map((c) => c.id)
    const ultimo = pide(d, 2, 'abandonar', {}, 0).estado
    expect(ultimo.motor.players[2].folded).toBe(true)
    expect(ultimo.vencimiento.clase).toBe(CLASES.REPOSICION)
    expect(ultimo.descartaron).toEqual([1, 0, null])
    expect(ultimo.motor.players[2].cards.map((c) => c.id)).toEqual(cartas)
    expect(reclama(ultimo).motor.phase).toBe(PHASES.BET_3)

    // En all-in también: se retira al abandonar y no llega al descarte.
    let v = hastaFase(hastaLaMano(3), PHASES.BET_2)
    const uno = v.motor.activePlayerIndex
    const dos = reclama(v, uno).motor.activePlayerIndex
    const tres = 3 - uno - dos
    v = pide(conJugador(v, tres, { allIn: true, chips: 0 }), tres, 'abandonar', {}, 0).estado
    expect(v.motor.players[tres].folded).toBe(true)
    v = pide(v, uno, 'apostar', { tipo: 'pasar' }, 0).estado
    v = pide(v, dos, 'apostar', { tipo: 'pasar' }, 0).estado
    expect(v.motor.phase).toBe(PHASES.DISCARD)
    expect(v.descarte[tres]).toBe(null)
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
    const abierto = reclama(reclama(crear(3)))
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
    expect(r.estado.vencimiento).toEqual({ clase: CLASES.VOLTEO_SORTEO, hora: 500 + VOLTEO_SORTEO_MS })
    expect(r.estado.sorteo.rondas[0].volteo[2].carta).toEqual(abierto.sorteo.cartas[2][0])

    // Si abandona antes del reparto, elige al abrirse la elección.
    const antes = pide(crear(3), 2, 'abandonar', {}, 0).estado
    expect(antes.sorteo.etapa).toBe(ETAPAS.BARAJADO)
    const abre = reclama(reclama(antes))
    expect(abre.sorteo.etapa).toBe(ETAPAS.ELECCION)
    expect(abre.sorteo.elecciones).toEqual([null, null, 0])

    // Si el empate lo lleva a otra ronda, elige también en ésa.
    const empate = { ...abierto, sorteo: { ...abierto.sorteo, cartas: abierto.sorteo.cartas.map((c, i) => c.map(() => carta(i === 2 ? 2 : 12))) } }
    const sale = pide(elige(empate, 2), 1, 'abandonar', {}, 0).estado
    const volteo = pide(sale, 0, 'elegir_carta_sorteo', { ronda: 1, carta: 1 }, 0).estado
    expect(volteo.sorteo.etapa).toBe(ETAPAS.VOLTEO)
    expect(volteo.sorteo.participan).toEqual([0, 1])
    const ronda2 = reclama(reclama(reclama(volteo)))
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

// ── 6 · MES-PvP 1: el árbitro v1.1 ──────────────────────────────────────────
describe('MES-PvP 1 · el árbitro v1.1', () => {
  const crearLlena = (n) => crear(n, 'normal', 'llena')
  const quienAcciona = (x) => x.asientos.findIndex((a) => !a.abandonado)

  // Todos presentes: cada uno hace lo suyo, y lo demás lo reclama el primero que queda.
  function paso(x) {
    const { clase } = x.vencimiento
    const { sorteo, motor } = x
    if (clase === CLASES.ELECCION_SORTEO) {
      const i = sorteo.participan.find((a) => sorteo.elecciones[a] === null)
      return pide(x, i, 'elegir_carta_sorteo', { ronda: sorteo.ronda, carta: 0 })
    }
    if (clase === CLASES.TURNO) return pide(x, motor.activePlayerIndex, 'apostar', { tipo: 'pasar' })
    if (clase === CLASES.DESCARTE) {
      const i = motor.players.findIndex((p, j) => !p.folded && x.descarte[j] === null)
      return pide(x, i, 'descartar', { mano: motor.handCount, indices: [] })
    }
    return pide(x, quienAcciona(x), 'reclamar_vencimiento')
  }

  function jugarHasta(e, llego, alPasar = () => {}) {
    let x = e
    for (let i = 0; i < 4000 && !llego(x); i++) {
      const r = paso(x)
      expect(r.respuesta.ok, r.respuesta.motivo).toBe(true)
      alPasar(r, x)
      x = r.estado
    }
    expect(llego(x)).toBe(true)
    return x
  }

  const enPausa = (x) => x.vencimiento?.clase === CLASES.PAUSA_ANUNCIO
  const pausaDeLaMano = (e, mano) => jugarHasta(e, (x) => x.motor.handCount === mano && enPausa(x))
  const vuelve = (x, i, mano = x.motor.handCount) => pide(x, i, 'volver_anuncio', { mano }, 0)

  describe('la partida entera y sus pausas', () => {
    it.each([2, 3, 5])('mesa de %i: solo en las manos 5 y 11, una con todos de vuelta y otra a los 45 s, y el dinero cuadra', (n) => {
      setRng(semilla(100 + n))
      let e = crearLlena(n)
      const total = sumaDinero(e)
      const pausas = []
      const cuadra = (r) => expect(sumaDinero(r.estado)).toBe(total)
      const hacia = (mano) => jugarHasta(e, (x) => x.motor.handCount === mano && enPausa(x), (r, antes) => {
        cuadra(r)
        if (enPausa(r.estado) && !enPausa(antes)) pausas.push(r.estado.motor.handCount)
      })

      e = hacia(5)
      expect(e.motor.phase).toBe(PHASES.PAYOUT)
      const cartas = JSON.stringify(e.motor.players.map((p) => p.cards))
      expect(vistaDe(e, 0).players.every((p) => p.enAnuncio)).toBe(true)
      for (let i = 0; i < n - 1; i++) {
        e = vuelve(e, i).estado
        expect(enPausa(e), 'falta alguien: la mano no arranca').toBe(true)
        expect(e.motor.handCount).toBe(5)
        expect(JSON.stringify(e.motor.players.map((p) => p.cards))).toBe(cartas)
        expect(vuelve(e, i).respuesta.motivo).toBe(M.YA_VOLVIO)
      }
      e = vuelve(e, n - 1).estado
      expect(e.motor.handCount).toBe(6)
      expect(e.motor.phase).toBe(PHASES.DEAL_2)
      expect(e.vencimiento.clase).toBe(CLASES.BARAJADO)
      expect(e.asientos.some((a) => a.enAnuncio)).toBe(false)

      e = hacia(11)
      const antes = e
      expect(pide(antes, 0, 'reclamar_vencimiento', {}, antes.vencimiento.hora - 1).respuesta.motivo).toBe(M.VENCIMIENTO_NO_CUMPLIDO)
      e = reclama(antes)
      expect(e.motor.handCount).toBe(12)
      expect(e.asientos.some((a) => a.enAnuncio)).toBe(false)
      expect(pausas).toEqual([5, 11])
      expect(sumaDinero(e)).toBe(total)

      // Lo que entra es lo que sale: se levantan todos menos uno y la partida termina.
      expect(total).toBe(n * 5000)
      for (let i = 1; i < n; i++) e = pide(e, i, 'abandonar', {}, e.vencimiento.hora).estado
      if (!partidaTerminada(e)) e = jugarHasta(e, partidaTerminada)
      expect(cobrado(e)).toBe(total)
      expect(suma(e.motor.players.map((p) => p.chips)) + e.motor.pot).toBe(0)
    })

    it('la pausa dura 45 s desde que vence la mano siguiente', () => {
      const e = jugarHasta(crearLlena(2), (x) => x.motor.handCount === 5 && x.vencimiento?.clase === CLASES.MANO_SIGUIENTE)
      const ahora = e.vencimiento.hora + 1234
      const r = pide(e, 0, 'reclamar_vencimiento', {}, ahora)
      expect(r.estado.vencimiento).toEqual({ clase: CLASES.PAUSA_ANUNCIO, hora: ahora + 45000 })
    })

    it('`fase` y `no_participa`: fuera de la pausa, con otra mano, y quien no sigue', () => {
      const fuera = hastaFase(hastaLaMano(2), PHASES.BET_1)
      expect(vuelve(fuera, 0).respuesta.motivo).toBe(M.FASE)
      const e = pausaDeLaMano(crearLlena(3), 5)
      expect(vuelve(e, 0, 4).respuesta.motivo).toBe(M.FASE)
      expect(vuelve({ ...e, asientos: e.asientos.map((a, i) => (i === 1 ? { ...a, enAnuncio: false, sinAnuncio: true } : a)) }, 1).respuesta.motivo)
        .toBe(M.NO_PARTICIPA)
    })

    it('volver no choca con la versión de otro', () => {
      const e = pausaDeLaMano(crearLlena(3), 5)
      const una = vuelve(e, 0).estado
      const r = aplicarAccion(una, { uid: 'u1', version: e.version, accion: 'volver_anuncio', mano: 5 }, { ahora: 0 })
      expect(r.respuesta.ok).toBe(true)
    })

    it('quien no cubre el ante cobra al abrirse la pausa, una sola vez, y luego el aviso de salida', () => {
      let e = jugarHasta(crearLlena(3), (x) => x.motor.handCount === 5 && x.vencimiento?.clase === CLASES.MANO_SIGUIENTE)
      const total = sumaDinero(e)
      e = conJugador(conJugador(e, 0, { chips: e.motor.players[0].chips + e.motor.players[1].chips - 50 }), 1, { chips: 50 })
      expect(sumaDinero(e)).toBe(total)

      const r = pide(e, 0, 'reclamar_vencimiento')
      expect(r.efectos).toEqual([{ tipo: 'salida', asiento: 1, monto: 50 }])
      expect(enPausa(r.estado)).toBe(true)
      expect(r.estado.asientos[1].cobrado).toBe(50)
      expect(r.estado.motor.players[1].chips).toBe(0)
      expect(r.estado.asientos.map((a) => a.enAnuncio)).toEqual([true, false, true])
      expect(vuelve(r.estado, 1).respuesta.motivo).toBe(M.NO_PARTICIPA)

      const uno = vuelve(r.estado, 0).estado
      const fin = vuelve(uno, 2)
      expect(fin.efectos.filter((x) => x.tipo === 'salida')).toEqual([])
      expect(fin.estado.vencimiento.clase).toBe(CLASES.AVISO_SALIDA)
      expect(fin.estado.vencimiento.hora).toBe(3000)
      expect(fin.estado.motor.players[1].eliminated).toBe(true)
      expect(sumaDinero(fin.estado)).toBe(total)
      expect(reclama(fin.estado).vencimiento.clase).toBe(CLASES.BARAJADO)
    })

    describe('quien cobra al abrirse la pausa, hasta que `startHand` lo elimina', () => {
      // El asiento 1 no cubre el ante y está en medio: el turno tendría que saltarlo.
      function conCobrado() {
        const e = jugarHasta(crearLlena(3), (x) => x.motor.handCount === 5 && x.vencimiento?.clase === CLASES.MANO_SIGUIENTE)
        const antes = conJugador(conJugador(e, 0, { chips: e.motor.players[0].chips + e.motor.players[1].chips - 50 }), 1, { chips: 50 })
        return { antes, e: pide(antes, 0, 'reclamar_vencimiento').estado }
      }

      it('no actúa ni recibe cartas: todo se rechaza, y ni la fase ni las cartas se mueven', () => {
        const { antes, e } = conCobrado()
        expect(e.motor.players[1].eliminated).toBe(false)
        expect(e.asientos[1].cobrado).toBe(50)
        expect(e.motor.phase).toBe(PHASES.PAYOUT)
        expect(e.motor.handCount).toBe(5)
        expect(e.motor.players[1].cards).toEqual(antes.motor.players[1].cards)

        for (const [accion, campos, motivo] of [
          ['apostar', { tipo: 'pasar' }, M.FASE],
          ['descartar', { mano: 5, indices: [] }, M.FASE],
          ['elegir_carta_sorteo', { ronda: e.sorteo.ronda, carta: 0 }, M.FASE],
          ['volver_anuncio', { mano: 5 }, M.NO_PARTICIPA],
          ['reclamar_vencimiento', {}, M.VENCIMIENTO_NO_CUMPLIDO],
        ]) {
          const r = pide(e, 1, accion, campos, e.vencimiento.hora - 1)
          expect(r.respuesta.motivo, accion).toBe(motivo)
          expect(r.estado, accion).toBe(e)
        }
      })

      it('levantarse en ese intervalo no le paga dos veces', () => {
        const { e } = conCobrado()
        for (const r of [pide(e, 1, 'abandonar', {}, 0), abandonarPorServidor(e, 'u1', { ahora: 0 })]) {
          expect(r.efectos).toEqual([])
          expect(r.estado.asientos[1].cobrado).toBe(50)
          expect(sumaDinero(r.estado)).toBe(sumaDinero(e))
          expect(enPausa(r.estado)).toBe(true)
        }
      })

      it.each([
        ['vuelven los otros dos', (e) => vuelve(vuelve(e, 0).estado, 2).estado],
        ['vencen los 45 s', (e) => reclama(e)],
      ])('%s: la mano arranca sin él, el turno lo salta y el reloj no le cuenta', (_caso, cerrar) => {
        const { e } = conCobrado()
        const conAviso = cerrar(e)
        expect(conAviso.motor.handCount).toBe(6)
        expect(conAviso.vencimiento.clase).toBe(CLASES.AVISO_SALIDA)
        expect(conAviso.motor.players[1]).toMatchObject({ eliminated: true, folded: true, cards: [], chips: 0, contribMano: 0 })
        expect(conAviso.motor.pot).toBe(2 * conAviso.motor.unit)
        expect(conAviso.motor.handRules.ruleN).toBe(2)
        expect([conAviso.motor.pieIndex, conAviso.motor.manoIndex]).not.toContain(1)

        // La mano entera por reloj, reclamada por otro: es donde se contaría un vencimiento.
        let x = conAviso
        const turnos = new Set()
        const contados = [0, 0, 0]
        for (let i = 0; i < 60 && x.vencimiento.clase !== CLASES.MANO_SIGUIENTE; i++) {
          if (x.vencimiento.clase === CLASES.TURNO) turnos.add(x.motor.activePlayerIndex)
          expect(pide(x, 1, 'apostar', { tipo: 'pasar' }).respuesta.ok).toBe(false)
          expect(pide(x, 1, 'descartar', { mano: 6, indices: [] }).respuesta.ok).toBe(false)
          expect(x.motor.players[1].cards).toEqual([])
          x = reclama(x)
          x.asientos.forEach((a, j) => { contados[j] += a.vencidos })
          x = aCero(x)
        }
        expect(x.vencimiento.clase).toBe(CLASES.MANO_SIGUIENTE)
        expect([...turnos].sort()).toEqual([0, 2])
        expect(contados[1]).toBe(0)
        expect(contados[0]).toBeGreaterThan(0)
        expect(contados[2]).toBeGreaterThan(0)
      })
    })

    it('un abandono dentro de la pausa cobra al instante y sin ante', () => {
      const e = pausaDeLaMano(crearLlena(3), 5)
      const total = sumaDinero(e)
      const pila = e.motor.players[2].chips
      const r = pide(e, 2, 'abandonar', {}, 0)
      expect(r.efectos).toEqual([{ tipo: 'salida', asiento: 2, monto: pila }])
      expect(r.estado.asientos[2].enAnuncio).toBe(false)
      expect(enPausa(r.estado)).toBe(true)
      expect(sumaDinero(r.estado)).toBe(total)
      const uno = vuelve(r.estado, 0).estado
      const sigue = vuelve(uno, 1).estado
      expect(sigue.motor.handCount).toBe(6)
      expect(sigue.motor.players[2].contribMano).toBe(0)
      expect(sigue.vencimiento.clase).toBe(CLASES.BARAJADO)
    })

    it('si el abandono deja a alguien sin rivales, o era el último que faltaba, la pausa se cierra', () => {
      const dos = pausaDeLaMano(crearLlena(2), 5)
      const r = pide(dos, 1, 'abandonar', {}, 0)
      expect(r.estado.motor.phase).toBe(PHASES.GAME_OVER)
      expect(r.efectos.at(-1).tipo).toBe('partida_terminada')
      expect(cobrado(r.estado)).toBe(sumaDinero(dos))

      const tres = pausaDeLaMano(crearLlena(3), 5)
      const faltaUno = vuelve(vuelve(tres, 0).estado, 1).estado
      const ultimo = pide(faltaUno, 2, 'abandonar', {}, 0)
      expect(ultimo.estado.motor.handCount).toBe(6)
      expect(ultimo.efectos.filter((x) => x.tipo === 'salida').map((x) => x.asiento)).toEqual([2])
    })

    it('con un solo asiento que siga no hay pausa, y un Premium no entra en ella', () => {
      let e = jugarHasta(crearLlena(2), (x) => x.motor.handCount === 5 && x.vencimiento?.clase === CLASES.MANO_SIGUIENTE)
      e = conJugador(conJugador(e, 0, { chips: e.motor.players[0].chips + e.motor.players[1].chips - 50 }), 1, { chips: 50 })
      expect(reclama(e).motor.phase).toBe(PHASES.GAME_OVER)

      const tres = jugarHasta(crearLlena(3), (x) => x.motor.handCount === 5 && x.vencimiento?.clase === CLASES.MANO_SIGUIENTE)
      const conPremium = { ...tres, asientos: tres.asientos.map((a, i) => ({ ...a, sinAnuncio: i === 0 })) }
      expect(crearLlena(2).asientos.every((a) => a.sinAnuncio === false)).toBe(true)
      expect(reclama(conPremium).asientos.map((a) => a.enAnuncio)).toEqual([false, true, true])
      const todos = { ...tres, asientos: tres.asientos.map((a) => ({ ...a, sinAnuncio: true })) }
      expect(reclama(todos).motor.handCount).toBe(6)
    })
  })

  describe('la ausencia', () => {
    const presente = 0
    const ausente = 1
    // Solo juega `presente`: lo del otro lo resuelve el reloj.
    function pasoSinElOtro(x) {
      const { clase } = x.vencimiento
      if (clase === CLASES.TURNO && x.motor.activePlayerIndex === presente) return pide(x, presente, 'apostar', { tipo: 'pasar' })
      if (clase === CLASES.DESCARTE && x.descarte[presente] === null) return pide(x, presente, 'descartar', { mano: x.motor.handCount, indices: [] })
      return pide(x, presente, 'reclamar_vencimiento')
    }
    const cuenta = (e) => e.asientos[ausente].vencidos

    // MES-PvP 3-A · reescrita en su final: con la C-8 vieja la partida seguía hasta la mano
    // siguiente; con la v1.2, en la mesa de 2, termina en la misma jugada (R2).
    it('tres vencimientos seguidos lo abandonan: `ausente` desde el 2.º, cobra su pila una vez y la partida termina', () => {
      let e = aCero(hastaFase(hastaLaMano(2), PHASES.BET_2))
      const total = sumaDinero(e)
      const vistos = []
      let ultimo = null
      for (let i = 0; i < 200 && !e.asientos[ausente].abandonado; i++) {
        const antes = cuenta(e)
        ultimo = pasoSinElOtro(e)
        e = ultimo.estado
        if (cuenta(e) !== antes) vistos.push([cuenta(e), vistaDe(e, presente).players[ausente].ausente])
        expect(sumaDinero(e)).toBe(total)
      }
      expect(vistos).toEqual([[1, false], [2, true], [3, true]])
      expect(e.asientos[ausente].abandonado).toBe(true)
      expect(e.motor.players[ausente].folded).toBe(true)
      expect(e.ultimaAccion).toMatchObject({ asiento: ausente, tipo: 'retirarse', porReloj: true })

      const salida = ultimo.efectos.find((x) => x.tipo === 'salida')
      const cierre = ultimo.efectos.find((x) => x.tipo === 'mano_cerrada')
      expect(salida.asiento).toBe(ausente)
      expect(salida.monto).toBeGreaterThan(0)
      expect(cierre.pilas[ausente]).toBe(0)
      expect(e.asientos[ausente].cobrado).toBe(salida.monto)
      expect(pide(e, ausente, 'apostar', { tipo: 'pasar' }).respuesta.motivo).toBe(M.PARTIDA_TERMINADA)

      expect(e.motor.phase).toBe(PHASES.GAME_OVER)
      expect(cobrado(e)).toBe(total)
      expect(ultimo.efectos.map((x) => x.tipo)).toEqual(['mano_cerrada', 'salida', 'salida', 'partida_terminada'])
      expect(ultimo.efectos.filter((x) => x.tipo === 'salida').map((x) => x.asiento)).toEqual([ausente, presente])
    })

    it('da igual quién reclame: lo reclama él mismo y cuenta', () => {
      const e = aCero(hastaFase(hastaLaMano(2), PHASES.BET_1))
      const a = e.motor.activePlayerIndex
      expect(pide(e, a, 'reclamar_vencimiento').estado.asientos[a].vencidos).toBe(1)
      expect(pide(e, 1 - a, 'reclamar_vencimiento').estado.asientos[a].vencidos).toBe(1)
    })

    it('una acción propia en medio pone la cuenta a 0, también volver del anuncio', () => {
      const e = hastaFase(hastaLaMano(2), PHASES.BET_1)
      const a = e.motor.activePlayerIndex
      const conDos = { ...e, asientos: e.asientos.map((x, i) => (i === a ? { ...x, vencidos: 2 } : x)) }
      const jugo = pide(conDos, a, 'apostar', { tipo: 'pasar' })
      expect(jugo.estado.asientos[a].vencidos).toBe(0)
      expect(vistaDe(jugo.estado, 0).players[a].ausente).toBe(false)

      const pausa = pausaDeLaMano(crearLlena(3), 5)
      const enPausaConDos = { ...pausa, asientos: pausa.asientos.map((x) => ({ ...x, vencidos: 2 })) }
      expect(vuelve(enPausaConDos, 1).estado.asientos.map((x) => x.vencidos)).toEqual([2, 0, 2])
      expect(reclama(enPausaConDos).asientos.map((x) => x.vencidos)).toEqual([2, 2, 2])
    })

    it('reclamar no cuenta como jugar, y el vencimiento de otro no le suma', () => {
      const e = aCero(hastaFase(hastaLaMano(3), PHASES.BET_1))
      const a = e.motor.activePlayerIndex
      const otro = (a + 1) % 3
      const conDos = { ...e, asientos: e.asientos.map((x, i) => (i === otro ? { ...x, vencidos: 2 } : x)) }
      const r = pide(conDos, otro, 'reclamar_vencimiento').estado
      expect(r.asientos[otro].vencidos).toBe(2)
      expect(r.asientos[a].vencidos).toBe(1)
    })

    it('el descarte cuenta a quien falte, y solo a él', () => {
      let d = aCero(hastaFase(hastaLaMano(3), PHASES.DISCARD))
      d = pide(d, 0, 'descartar', { mano: d.motor.handCount, indices: [] }, 0).estado
      expect(reclama(d).asientos.map((a) => a.vencidos)).toEqual([0, 1, 1])
    })

    it('el sorteo no cuenta: quien deja vencer las tres rondas llega a la primera mano con 0, y sin falta', () => {
      const empatan = (x) => ({ ...x, sorteo: { ...x.sorteo, cartas: x.sorteo.cartas.map((c) => c.map(() => carta(12))) } })
      let e = crear(2)
      for (let ronda = 1; ronda <= 3; ronda++) {
        e = reclama(empatan(reclama(reclama(e))))
        expect(e.sorteo.rondas[ronda - 1].volteo.map((v) => v.posicion)).toEqual([0, 0])
        expect(e.asientos.map((a) => [a.vencidos, a.abandonado])).toEqual([[0, false], [0, false]])
        if (ronda < 3) e = reclama(e)
      }
      e = reclama(e)
      expect(e.sorteo.etapa).toBe(ETAPAS.CERRADO)
      expect(e.motor.handCount).toBe(1)
      expect(e.asientos.map((a) => [a.vencidos, a.abandonado])).toEqual([[0, false], [0, false]])
      expect(vistaDe(e, 0).players.map((p) => p.ausente)).toEqual([false, false])
    })

    it('si el 3.º llega en el descarte, también abandona sin pagar dos veces', () => {
      let d = hastaFase(hastaLaMano(3), PHASES.DISCARD)
      const total = sumaDinero(d)
      d = pide(d, 0, 'descartar', { mano: d.motor.handCount, indices: [] }, 0).estado
      d = pide(d, 1, 'descartar', { mano: d.motor.handCount, indices: [] }, 0).estado
      d = { ...d, asientos: d.asientos.map((a, i) => (i === 2 ? { ...a, vencidos: 2 } : a)) }
      d = reclama(d)
      expect(d.asientos[2].abandonado).toBe(true)
      expect(d.motor.players[2].folded).toBe(true)
      expect(d.descartaron).toEqual([0, 0, null])
      expect(d.asientos[2].cobrado).toBe(null)
      const bet3 = reclama(d)
      expect(bet3.motor.phase).toBe(PHASES.BET_3)
      expect(sumaDinero(bet3)).toBe(total)
    })
  })

  describe('la reposición', () => {
    const enDescarte = (n) => hastaFase(hastaLaMano(n), PHASES.DISCARD)
    const descartan = (e, listas, ahora = 1000) => listas.reduce(
      (x, indices, i) => pide(x, i, 'descartar', { mano: x.motor.handCount, indices }, ahora).estado, e,
    )

    it('dura la tanda de quien más descartó, y 600 ms si nadie; el turno no corre', () => {
      const uno = descartan(enDescarte(3), [[0, 1, 2], [0], []])
      expect(uno.vencimiento).toEqual({ clase: CLASES.REPOSICION, hora: 1000 + 120 + 3 * 595 + 400 })
      expect(uno.motor.phase).toBe(PHASES.DISCARD)
      const nadie = descartan(enDescarte(3), [[], [], []])
      expect(nadie.vencimiento).toEqual({ clase: CLASES.REPOSICION, hora: 1000 + 600 })
      const trasVencer = pide(nadie, 0, 'reclamar_vencimiento', {}, 5000).estado
      expect(trasVencer.motor.phase).toBe(PHASES.BET_3)
      expect(trasVencer.vencimiento).toEqual({ clase: CLASES.TURNO, hora: 5000 + 20000 })
    })

    it('la vista lleva las cartas nuevas de cada uno y nada más; apostar da `fase` y descartar `ya_descarto`', () => {
      const antes = enDescarte(3)
      const e = descartan(antes, [[0, 1], [], [2]])
      const vista = vistaDe(e, 0)
      expect(vista.phase).toBe(PHASES.DISCARD)
      expect(vista.descarte.cuantas).toEqual([2, 0, 1])
      expect(vista.descarte.yaDescartaron).toEqual([0, 1, 2])
      expect(vista.resultado).toBe(null)
      expect(vista.players[0].cards).not.toEqual(antes.motor.players[0].cards)
      const texto = JSON.stringify(vista)
      for (const c of e.motor.players[2].cards) expect(texto).not.toContain(`"${c.id}"`)
      for (const c of e.motorTrasDescarte.deck) expect(texto).not.toContain(`"${c.id}"`)

      const turno = e.motorTrasDescarte.activePlayerIndex
      expect(pide(e, turno, 'apostar', { tipo: 'pasar' }, 0).respuesta.motivo).toBe(M.FASE)
      expect(pide(e, 0, 'descartar', { mano: e.motor.handCount, indices: [] }, 0).respuesta.motivo).toBe(M.YA_DESCARTO)
    })

    it('con todos en all-in, el showdown y el pago esperan a que venza', () => {
      let e = enDescarte(2)
      const total = sumaDinero(e)
      const puesto = e.motor.pot + e.motor.players[0].chips + e.motor.players[1].chips
      e = conMotor(e, {
        pot: puesto,
        players: e.motor.players.map((p) => ({ ...p, chips: 0, allIn: true, contribMano: puesto / 2 })),
      })
      expect(sumaDinero(e)).toBe(total)
      const repone = descartan(e, [[0], []])
      expect(repone.motor.pot).toBe(puesto)
      expect(vistaDe(repone, 0).resultado).toBe(null)
      expect(vistaDe(repone, 0).players.map((p) => p.chips)).toEqual([0, 0])
      const r = pide(repone, 0, 'reclamar_vencimiento')
      expect(r.estado.motor.phase).toBe(PHASES.PAYOUT)
      expect(r.efectos.map((x) => x.tipo)).toContain('mano_cerrada')
      expect(sumaDinero(r.estado)).toBe(total)
      expect(r.estado.motorTrasDescarte).toBeUndefined()
    })

    // MES-PvP 3-A · reescrita: con la C-8 vieja esperaba a su turno de la apuesta 3. Con la
    // v1.2 se retira en el acto; en la mesa de 2 el otro cobra el pozo y la partida termina.
    it('quien abandona en la reposición se retira en el acto, sin repetirla; con uno solo, la partida termina (C-8, v1.2)', () => {
      const e = descartan(enDescarte(2), [[0], [1]])
      const total = sumaDinero(e)
      const cartas = JSON.stringify(e.motor.players.map((p) => p.cards))
      const turno = e.motorTrasDescarte.activePlayerIndex
      const pila = e.motor.players[turno].chips
      const r = pide(e, turno, 'abandonar', {}, 0)
      expect(JSON.stringify(r.estado.motor.players.map((p) => p.cards))).toBe(cartas)
      expect(partidaTerminada(r.estado)).toBe(true)
      expect(r.estado.motorTrasDescarte).toBeUndefined()
      expect(r.efectos.find((x) => x.tipo === 'salida' && x.asiento === turno).monto).toBe(pila)
      expect(r.estado.asientos[1 - turno].cobrado).toBe(total - pila)
      expect(vistaDe(r.estado, 1 - turno).resultado.ganador).toBe(1 - turno)
    })

    // El caso raro de la C-8: la reposición ya traía calculado un showdown que ganaba él.
    it('el showdown ya calculado se recalcula sin él (C-8, v1.2)', () => {
      const GANADORA = [carta(1, 'Oros'), carta(12, 'Oros'), carta(11, 'Oros'), carta(10, 'Oros'), carta(7, 'Oros')]
      const MALA = [carta(2, 'Copas'), carta(3, 'Copas'), carta(4, 'Espadas'), carta(5, 'Bastos'), carta(6, 'Oros')]
      let e = enDescarte(3)
      const total = sumaDinero(e)
      const puesto = e.motor.pot + suma(e.motor.players.map((p) => p.chips))
      e = conMotor(e, {
        pot: puesto,
        players: e.motor.players.map((p, i) => ({
          ...p, chips: 0, allIn: true, contribMano: puesto / 3, cards: i === 2 ? GANADORA : MALA.map((c) => ({ ...c, id: `${c.id}-${i}` })),
        })),
      })
      const repone = descartan(e, [[], [], []])
      expect(repone.motorTrasDescarte.phase).toBe(PHASES.PAYOUT)
      expect(ganadorDeMano(repone.motorTrasDescarte)).toBe(2)

      const r = pide(repone, 2, 'abandonar', {}, 0)
      expect(r.efectos).toEqual([])
      expect(r.estado.motor.players[2].folded).toBe(true)
      expect(ganadorDeMano(r.estado.motorTrasDescarte)).not.toBe(2)
      const fin = pide(r.estado, 0, 'reclamar_vencimiento')
      const cierre = fin.efectos.find((x) => x.tipo === 'mano_cerrada')
      expect(cierre.ganador).not.toBe(2)
      expect(fin.efectos).toContainEqual({ tipo: 'salida', asiento: 2, monto: 0 })
      expect(suma(cierre.pilas)).toBe(total)
    })
  })

  // ── MES-PvP 3-A · la tabla B de la sonda, fila a fila (Reglas v1.7 §8.2) ──────────────
  // En cada caso, con su dinero: quien se va cobra exactamente su pila al irse (R3); el pozo
  // va a quien se queda; la mesa cuadra, todos cobraron y el neto es 0; y en la mesa de 2 la
  // partida termina en la misma jugada del abandono (R2).
  describe('MES-PvP 3-A · abandonar es retirarse (C-8, Contrato v1.2)', () => {
    function abandona(e, x, via = 'x') {
      const pila = e.motor.players[x].chips
      const total = sumaDinero(e)
      const r = via === 'servidor' ? abandonarPorServidor(e, `u${x}`, { ahora: 0 }) : pide(e, x, 'abandonar', {}, 0)
      expect(r.respuesta.ok).toBe(true)
      return { r, pila, total }
    }
    function terminaYCuadra({ r, pila, total }, x, queda) {
      expect(partidaTerminada(r.estado)).toBe(true)
      expect(r.estado.vencimiento).toBe(null)
      expect(r.efectos.find((f) => f.tipo === 'salida' && f.asiento === x).monto).toBe(pila)
      expect(r.estado.asientos[x].cobrado).toBe(pila)
      expect(r.estado.asientos.every((a) => a.cobrado !== null)).toBe(true)
      expect(cobrado(r.estado)).toBe(total)
      expect(r.estado.asientos[queda].cobrado).toBe(total - suma(r.estado.asientos.map((a, i) => (i === queda ? 0 : a.cobrado))))
      expect(r.efectos.at(-1)).toEqual({ tipo: 'partida_terminada', ganador: queda })
      expect(r.estado.motor.winner).toBe(queda)
    }

    it('mesa de 2 · en la apuesta, le toca al que se va: el otro cobra el pozo y termina', () => {
      const e = hastaFase(hastaLaMano(2), PHASES.BET_1)
      const x = e.motor.activePlayerIndex
      const hecho = abandona(e, x)
      terminaYCuadra(hecho, x, 1 - x)
      expect(hecho.r.efectos.map((f) => f.tipo)).toEqual(['mano_cerrada', 'salida', 'salida', 'partida_terminada'])
      expect(hecho.r.efectos[0].ganador).toBe(1 - x)
    })

    it('mesa de 2 · en la apuesta, le toca al que se queda: pierde lo que apostó, sin que corra el reloj de nadie (la sonda: cobraba 1.600)', () => {
      let e = hastaFase(hastaLaMano(2), PHASES.BET_1)
      const x = e.motor.activePlayerIndex
      e = pide(e, x, 'apostar', { tipo: 'apostar', k: 2 }, 0).estado
      expect(e.motor.activePlayerIndex).toBe(1 - x)
      const hecho = abandona(e, x)
      terminaYCuadra(hecho, x, 1 - x)
      expect(hecho.pila).toBe(1500 - 100 - 200)
      expect(hecho.r.estado.asientos[1 - x].cobrado).toBe(1500 + 300)
      const vista = vistaDe(hecho.r.estado, 1 - x)
      expect(vista.phase).toBe(PHASES.GAME_OVER)
      expect(vista.resultado.ganador).toBe(1 - x)
    })

    it('mesa de 2 · en el descarte: nadie más descarta, el otro cobra el pozo y termina', () => {
      const e = hastaFase(hastaLaMano(2), PHASES.DISCARD)
      const hecho = abandona(e, 1)
      terminaYCuadra(hecho, 1, 0)
      expect(hecho.r.estado.descarte).toEqual([null, null])
    })

    it('mesa de 2 · en la reposición: lo prueba «quien abandona en la reposición…» (arriba)', () => {
      const e = pide(pide(hastaFase(hastaLaMano(2), PHASES.DISCARD), 0, 'descartar', { mano: 1, indices: [0] }, 0).estado, 1, 'descartar', { mano: 1, indices: [] }, 0).estado
      expect(e.vencimiento.clase).toBe(CLASES.REPOSICION)
      terminaYCuadra(abandona(e, 0), 0, 1)
    })

    it('mesa de 2 · entre manos, en el pago: cobra ya y la partida termina sin esperar la mano siguiente', () => {
      let e = hastaFase(hastaLaMano(2), PHASES.BET_1)
      e = pide(e, e.motor.activePlayerIndex, 'apostar', { tipo: 'retirarse' }, 0).estado
      expect(e.vencimiento.clase).toBe(CLASES.MANO_SIGUIENTE)
      const hecho = abandona(e, 0)
      terminaYCuadra(hecho, 0, 1)
      expect(hecho.r.efectos.map((f) => f.tipo)).toEqual(['salida', 'salida', 'partida_terminada'])
      // La vista del fin conserva el resultado de esa mano: el cliente ya lo estaba pintando.
      expect(vistaDe(hecho.r.estado, 1).resultado).not.toBe(null)
    })

    it('mesa de 2 · entre manos, en el barajado de una mano con el ante cobrado: es mano en curso', () => {
      const e = hastaLaMano(2)
      expect(e.vencimiento.clase).toBe(CLASES.BARAJADO)
      expect(e.motor.pot).toBe(200)
      const hecho = abandona(e, 0)
      terminaYCuadra(hecho, 0, 1)
      expect(hecho.pila).toBe(1400)
      expect(hecho.r.estado.asientos[1].cobrado).toBe(1600)
    })

    it('mesa de 2 · en la pausa de anuncio y en el sorteo: cobra sin ante y la partida termina', () => {
      const pausa = pausaDeLaMano(crearLlena(2), 5)
      terminaYCuadra(abandona(pausa, 1), 1, 0)
      const sorteo = abandona(crear(2), 1)
      terminaYCuadra(sorteo, 1, 0)
      expect(sorteo.r.estado.asientos.map((a) => a.cobrado)).toEqual([1500, 1500])
      // Sin mano que cerrar, el fin no trae resultado.
      expect(vistaDe(sorteo.r.estado, 0).resultado).toBe(null)
    })

    it('las tres vías, el mismo camino: la otra mesa (servidor) y el 3.er vencimiento, en el descarte', () => {
      const e = hastaFase(hastaLaMano(2), PHASES.DISCARD)
      const porX = abandona(e, 1).r
      const porServidor = abandona(e, 1, 'servidor')
      terminaYCuadra(porServidor, 1, 0)
      expect(porServidor.r.efectos).toEqual(porX.efectos)

      const conDos = { ...e, asientos: e.asientos.map((a, i) => (i === 1 ? { ...a, vencidos: 2 } : a)) }
      const listo = pide(conDos, 0, 'descartar', { mano: e.motor.handCount, indices: [] }, 0).estado
      const pila = listo.motor.players[1].chips
      const r = pide(listo, 0, 'reclamar_vencimiento')
      terminaYCuadra({ r, pila, total: sumaDinero(listo) }, 1, 0)
      expect(r.efectos.filter((f) => f.tipo === 'salida')).toEqual(porX.efectos.filter((f) => f.tipo === 'salida'))
    })

    it('mesa de 3 · uno abandona a mitad de mano: la mano sigue entre los otros dos y cobra su pila al cerrar', () => {
      const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
      const activo = e.motor.activePlayerIndex
      const x = (activo + 1) % 3
      const { r, pila, total } = abandona(e, x)
      expect(r.efectos).toEqual([])
      expect(r.estado.motor.players[x].folded).toBe(true)
      expect(r.estado.motor.activePlayerIndex).toBe(activo)
      // Los otros dos juegan: apuesta uno, se retira el otro.
      let m = pide(r.estado, activo, 'apostar', { tipo: 'apostar', k: 1 }, 0).estado
      const cierre = pide(m, m.motor.activePlayerIndex, 'apostar', { tipo: 'retirarse' }, 0)
      m = cierre.estado
      expect(m.motor.phase).toBe(PHASES.PAYOUT)
      expect(partidaTerminada(m)).toBe(false)
      expect(cierre.efectos).toContainEqual({ tipo: 'salida', asiento: x, monto: pila })
      const mano = cierre.efectos.find((f) => f.tipo === 'mano_cerrada')
      expect(mano.ganador).toBe(activo)
      expect(mano.pilas[x]).toBe(0)
      expect(suma(mano.pilas) + pila).toBe(total)
    })

    it('mesa de 3 · después abandona el segundo a mitad de mano: el último cobra el pozo y la partida termina', () => {
      let e = hastaFase(hastaLaMano(3), PHASES.BET_1)
      const primero = (e.motor.activePlayerIndex + 1) % 3
      e = abandona(e, primero).r.estado
      e = jugarHasta(e, (x) => x.motor.handCount === 2 && x.motor.phase === PHASES.BET_1 && x.vencimiento.clase === CLASES.TURNO)
      expect(e.motor.players[primero].eliminated).toBe(true)
      const vivos = [0, 1, 2].filter((i) => i !== primero)
      const segundo = vivos.find((i) => i !== e.motor.activePlayerIndex)
      const queda = vivos.find((i) => i !== segundo)
      const hecho = abandona(e, segundo)
      terminaYCuadra(hecho, segundo, queda)
      expect(hecho.r.efectos.find((f) => f.tipo === 'mano_cerrada').ganador).toBe(queda)
    })
  })

  describe('los demás vencimientos y campos', () => {
    it('el barajado va antes de cada ronda, con una sola velocidad', () => {
      for (const ritmo of ['normal', 'rapido']) {
        const e = crear(2, ritmo)
        expect(e.sorteo.etapa).toBe(ETAPAS.BARAJADO)
        expect(vistaDe(e, 0).sorteo.posiciones).toEqual([])
        expect(e.vencimiento).toEqual({ clase: CLASES.BARAJADO_SORTEO, hora: BARAJADO_MS })
      }
    })

    it('`volteo[].posicion` dice qué carta girar, también la que tomó el reloj; nada de las no elegidas', () => {
      let e = reclama(reclama(crear(3)))
      const elegida = e.sorteo.cartas[0][3]
      const noElegida = e.sorteo.cartas[0][1]
      e = pide(e, 0, 'elegir_carta_sorteo', { ronda: 1, carta: 3 }, 0).estado
      e = reclama(e)
      const { volteo } = vistaDe(e, 2).sorteo.rondas[0]
      expect(volteo.map((v) => v.posicion)).toEqual([3, 0, 0])
      expect(volteo[0].carta).toEqual(elegida)
      expect(JSON.stringify(vistaDe(e, 2))).not.toContain(`"${noElegida.id}"`)
    })

    it('`contribMano` y `ultimaAccion`: el dato de cada jugada, con el reloj dicho, y nada al empezar la mano', () => {
      let e = hastaFase(hastaLaMano(3), PHASES.BET_1)
      expect(vistaDe(e, 0).ultimaAccion).toBe(null)
      expect(vistaDe(e, 0).players.map((p) => p.contribMano)).toEqual([100, 100, 100])

      const a = e.motor.activePlayerIndex
      e = pide(e, a, 'apostar', { tipo: 'apostar', k: 2 }, 0).estado
      expect(vistaDe(e, 0).ultimaAccion).toEqual({ asiento: a, tipo: 'apostar', puesto: 200, apuestaAntes: 0, apuestaDespues: 200, porReloj: false })
      expect(vistaDe(e, 0).players[a].contribMano).toBe(300)

      const b = e.motor.activePlayerIndex
      e = pide(e, b, 'apostar', { tipo: 'subir', k: 1 }, 0).estado
      expect(vistaDe(e, 0).ultimaAccion).toEqual({ asiento: b, tipo: 'subir', puesto: 300, apuestaAntes: 200, apuestaDespues: 300, porReloj: false })

      const c = e.motor.activePlayerIndex
      e = reclama(e, c)
      expect(vistaDe(e, 0).ultimaAccion).toEqual({ asiento: c, tipo: 'retirarse', puesto: 0, apuestaAntes: 300, apuestaDespues: 300, porReloj: true })

      const igual = e.motor.activePlayerIndex
      e = pide(e, igual, 'apostar', { tipo: 'igualar' }, 0).estado
      expect(vistaDe(e, 0).ultimaAccion).toEqual({ asiento: igual, tipo: 'igualar', puesto: 100, apuestaAntes: 300, apuestaDespues: 300, porReloj: false })
    })

    it('la retirada automática de un abandonado no pisa la jugada que la provocó', () => {
      const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
      const uno = e.motor.activePlayerIndex
      const dos = (uno + 1) % 3
      const r = pide(pide(e, dos, 'abandonar', {}, 0).estado, uno, 'apostar', { tipo: 'pasar' }, 0).estado
      expect(r.motor.players[dos].folded).toBe(true)
      expect(r.ultimaAccion).toMatchObject({ asiento: uno, tipo: 'pasar' })
      const mano2 = jugarHasta(r, (x) => x.motor.handCount === 2)
      expect(mano2.ultimaAccion).toBe(null)
    })

    it('R-4: una partida guardada antes de la v1.1 sigue leyéndose y jugándose', () => {
      const vieja = (x) => {
        const copia = JSON.parse(JSON.stringify(x))
        delete copia.ultimaAccion
        copia.asientos.forEach((a) => { delete a.vencidos; delete a.enAnuncio; delete a.sinAnuncio })
        copia.sorteo.rondas.forEach((r) => r.volteo.forEach((v) => { delete v.posicion }))
        return copia
      }
      const e = vieja(hastaFase(hastaLaMano(2), PHASES.BET_1))
      const vista = vistaDe(e, 0)
      expect(vista.ultimaAccion).toBe(null)
      expect(vista.players.map((p) => [p.enAnuncio, p.ausente])).toEqual([[false, false], [false, false]])
      expect(vista.sorteo.rondas[0].volteo.map((v) => v.posicion)).toEqual([null, null])

      const a = e.motor.activePlayerIndex
      const vencido = reclama(e)
      expect(vencido.asientos[a].vencidos).toBe(1)
      expect(vencido.ultimaAccion).toMatchObject({ asiento: a, porReloj: true })

      const pausa = vieja(jugarHasta(crearLlena(2), (x) => x.motor.handCount === 5 && x.vencimiento?.clase === CLASES.MANO_SIGUIENTE))
      expect(reclama(pausa).asientos.map((x) => x.enAnuncio)).toEqual([true, true])
    })
  })
})

// ── MES-PvP · árbitro v1.3-a ────────────────────────────────────────────────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md §2.2 y §2.3.
describe('v1.3-a · el sorteo sobre la mesa y el mensaje', () => {
  const abierto = (n) => reclama(reclama(crear(n)))
  const elige = (e, i, carta) => pide(e, i, 'elegir_carta_sorteo', { ronda: e.sorteo.ronda, carta }, 0).estado
  const conValores = (e, valores) => ({
    ...e, sorteo: { ...e.sorteo, cartas: e.sorteo.cartas.map((c, i) => (c ? c.map(() => carta(valores[i])) : c)) },
  })

  it('el reparto espera según quienes participan: la ronda 1 con todos, el desempate con los empatados', () => {
    for (const n of [2, 3, 4, 5]) {
      const barajado = crear(n)
      const reparto = reclama(barajado)
      expect(reparto.vencimiento).toEqual({ clase: CLASES.REPARTO_SORTEO, hora: barajado.vencimiento.hora + esperaRepartoSorteo(n) })
    }
    // Mesa de 5 con tres empatados en el Rey: la ronda 2 reparte a 3.
    let e = abierto(5)
    e = [0, 1, 2, 3, 4].reduce((x, i) => elige(x, i, 0), conValores(e, [12, 3, 12, 5, 12]))
    expect(e.sorteo.etapa).toBe(ETAPAS.VOLTEO)
    e = reclama(e)
    expect(e.vencimiento.clase).toBe(CLASES.BARAJADO_SORTEO)
    expect(e.sorteo.participan).toEqual([0, 2, 4])
    expect(reclama(e).vencimiento).toEqual({ clase: CLASES.REPARTO_SORTEO, hora: e.vencimiento.hora + esperaRepartoSorteo(3) })
  })

  it('el volteo dura 5 s', () => {
    const e = [0, 1].reduce((x, i) => elige(x, i, 0), conValores(abierto(2), [12, 3]))
    expect(e.vencimiento.clase).toBe(CLASES.VOLTEO_SORTEO)
    expect(VOLTEO_SORTEO_MS).toBe(5000)
    expect(e.vencimiento.hora).toBe(0 + 5000)
  })

  it('la vista publica qué posición eligió cada uno, nunca su valor antes del volteo', () => {
    const e = elige(elige(abierto(3), 0, 3), 2, 1)
    for (const yo of [0, 1, 2]) {
      const s = vistaDe(e, yo).sorteo
      expect(s.elegidas).toEqual([3, null, 1])
      expect(s.yaEligieron).toEqual([0, 2])
      expect(JSON.stringify(s)).not.toContain('"value"')
    }
    // En el volteo, el valor llega por `rondas`, y la posición sigue siendo la misma.
    const volteo = elige(e, 1, 4)
    const s = vistaDe(volteo, 1).sorteo
    expect(s.elegidas).toEqual([3, 4, 1])
    expect(s.rondas[0].volteo.map((v) => v.posicion)).toEqual([3, 4, 1])
  })

  it('puedeMandarMensaje: el asiento sale del uid, y sus cinco rechazos', () => {
    const e = hastaFase(hastaLaMano(3), PHASES.BET_1)
    const antes = JSON.stringify(e)
    expect(puedeMandarMensaje(e, 'u2', 'ajilei')).toEqual({ ok: true, asiento: 2 })
    expect(puedeMandarMensaje(e, 'otro', 'ajilei')).toEqual({ ok: false, motivo: M.NO_ES_DE_ESTA_MESA })
    expect(puedeMandarMensaje(e, 'u1', 'texto libre')).toEqual({ ok: false, motivo: M.CLAVE_DESCONOCIDA })
    expect(puedeMandarMensaje(e, 'u1', '2660_fe0f')).toEqual({ ok: false, motivo: M.CLAVE_DESCONOCIDA })
    const fuera = pide(e, 1, 'abandonar', {}, 0).estado
    expect(puedeMandarMensaje(fuera, 'u1', 'ajilei')).toEqual({ ok: false, motivo: M.ASIENTO_ABANDONADO })
    const enAnuncio = { ...e, asientos: e.asientos.map((a, i) => (i === 0 ? { ...a, enAnuncio: true } : a)) }
    expect(puedeMandarMensaje(enAnuncio, 'u0', 'ajilei')).toEqual({ ok: false, motivo: M.EN_ANUNCIO })
    expect(puedeMandarMensaje(enAnuncio, 'u1', 'ajilei').ok).toBe(true)
    const fin = conMotor(e, { phase: PHASES.GAME_OVER })
    expect(puedeMandarMensaje(fin, 'u0', 'ajilei')).toEqual({ ok: false, motivo: M.PARTIDA_TERMINADA })
    // Quien ya cobró salió de la mesa.
    const cobro = { ...e, asientos: e.asientos.map((a, i) => (i === 2 ? { ...a, cobrado: 300 } : a)) }
    expect(puedeMandarMensaje(cobro, 'u2', 'ajilei')).toEqual({ ok: false, motivo: M.NO_ES_DE_ESTA_MESA })
    // No toca el estado.
    expect(JSON.stringify(e)).toBe(antes)
  })

  it('R-4 · una partida guardada con la v1.2, a mitad del sorteo, se sigue jugando', () => {
    const vieja = (x) => {
      const copia = JSON.parse(JSON.stringify(x))
      copia.asientos.forEach((a) => { delete a.vencidos; delete a.enAnuncio; delete a.sinAnuncio })
      return copia
    }
    const e = vieja(elige(abierto(3), 0, 2))
    expect(vistaDe(e, 1).sorteo.elegidas).toEqual([2, null, null])
    expect(puedeMandarMensaje(e, 'u1', 'que_va')).toEqual({ ok: true, asiento: 1 })
    const volteo = elige(elige(conValores(e, [12, 3, 5]), 1, 0), 2, 0)
    expect(volteo.sorteo.etapa).toBe(ETAPAS.VOLTEO)
    const mano = reclama(volteo)
    expect(mano.motor.manoIndex).toBe(0)
    expect(mano.sorteo.etapa).toBe(ETAPAS.CERRADO)
  })
})
