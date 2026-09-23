/**
 * APU-1 · Fase 1c-ii — la conducta de la IA
 *
 * Normativo: `docs/AJILEI_APU-1_Reglas_v1.1.md` §6 (6.2 monto, 6.3 subida
 * fuerte, 6.4 farol por bloques, 6.5 cuarto del pozo, 6.6 all-in, 6.8 pasar con
 * mano grande) y §3.2 / §4.1 vía `pozos.js`.
 *
 * Las cifras de conducta son PARÁMETRO por reto (`ajileiConfig.js`): las pruebas
 * las LEEN de ahí en vez de repetirlas, para que 1d pueda barrerlas sin que este
 * archivo mienta. Lo que se sella aquí es la MECÁNICA —quién decide qué y con
 * qué regla—, no la calibración.
 *
 * Ejecutar: npx vitest run scripts/testIAAPU1.test.js
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  decideBetAction, getPersonalityName, _resetForTesting, _CONT_APU1,
} from '../src/engine/aiPlayer.js'
import {
  decidirIA, applyAIBetAction, applyBetAction, makeHandRules,
} from '../src/engine/gameEngine.js'
import { accionesDe, esLegal } from '../src/engine/pozos.js'
import { getCardPoints } from '../src/engine/deck.js'
import { AJILEI_CONFIG } from '../src/config/ajileiConfig.js'

// ── Utilería ─────────────────────────────────────────────────────────────────

const MULTS   = AJILEI_CONFIG.betting.multiplicadores
const IA      = AJILEI_CONFIG.ia
const PESOS   = ['leve', 'media', 'grande']

const carta = (value, palo) => ({ id: `${value}-${palo}`, value, palo, points: getCardPoints(value) })

// Manos de puntaje conocido. La escala de la baraja es GRUESA —As 11, siete 7,
// seis 6 y TODAS las demás 10 (`deck.getCardPoints`)—, así que los puntajes
// alcanzables van a saltos: 40 y 41 son consecutivos, pero 39 no existe. Por eso
// el filo de §6.3 se prueba en mesa 2 (umbral 41) con el par 41/40, que sí son
// vecinos de verdad. Cada puntaje se AFIRMA con `getBestSuitScore` antes de
// usarse: ninguna prueba depende de una cuenta hecha a mano.
const MANO = {
  floja: [carta(6,'Copas'), carta(7,'Copas'), carta(6,'Espadas'), carta(7,'Espadas'), carta(6,'Bastos')], // 13
  m31:   [carta(1,'Copas'), carta(12,'Copas'), carta(11,'Copas'), carta(6,'Espadas'), carta(7,'Bastos')], // 31
  m40:   [carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(5,'Copas'), carta(6,'Espadas')],    // 40
  m41:   [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(6,'Espadas')],    // 41
}

function jugador(over = {}) {
  return {
    id: 0, isHuman: false, cards: MANO.floja, chips: 1000, contrib: 0, contribMano: 0,
    acted: false, folded: false, allIn: false, eliminated: false, ...over,
  }
}

// Mesa de 3 a propósito en casi todo el archivo: es la mayor que NO activa el
// comodín (`handEvaluator`), así que `scoreEf === score` y los umbrales de §6.3
// se leen contra el puntaje real sin la corrección de ③ de por medio.
function estado(over = {}) {
  const numPlayers = over.numPlayers ?? 3
  const players = over.players ?? Array.from({ length: numPlayers }, (_, i) =>
    jugador({ id: i, isHuman: i === 0 }))
  return {
    players, numPlayers,
    phase: 'BET_2', currentBet: 0, pot: 0, unit: 50,
    manoIndex: 0, pieIndex: numPlayers - 1,
    activePlayerIndex: 1, handCount: 15, aliveCount: numPlayers,
    handRules: makeHandRules(numPlayers),
    ...over,
  }
}

// El mismo idiom de NIV-1: se sondea con el estado que la prueba va a usar, y
// SIEMPRE antes de mockear el dado (el reparto sale del mismo generador).
//
// EL SONDEO VA EN OTRO BLOQUE DE FAROL, y es necesario: las ~600 llamadas del
// sondeo corren con el azar de verdad y dejan un bloque ya sorteado, con su mano
// elegida al azar. Si la prueba usara ese mismo bloque, un farol podría caerle
// encima una de cada doce corridas y la prueba sería intermitente. Sondeando en
// la mano 3 (bloque 0) y midiendo en la 15 (bloque 1), la primera llamada
// mockeada vuelve a sortear con el dado fijo — y como 15 > 3, `handCount` no
// retrocede y el reparto de perfiles no se re-dispara.
const MANO_SONDA = 3

function fijarPerfil(perfil, s, asiento) {
  const sonda = { ...s, handCount: MANO_SONDA }
  for (let i = 0; i < 600; i++) {
    _resetForTesting()
    decideBetAction(sonda, asiento)
    if (getPersonalityName(asiento) === perfil) return
  }
  throw new Error(`no salió el perfil ${perfil} en 600 sorteos`)
}

const dado = (v) => vi.spyOn(Math, 'random').mockReturnValue(v)

// Los contadores de 1c-2 (`_CONT_APU1`) son estado de MÓDULO, y `fijarPerfil`
// decide de verdad hasta 600 veces con el azar real: en una de cada B corridas
// el sondeo deja un farol ejecutado o trasladado detrás. Medirlos por valor
// absoluto haría pruebas intermitentes, así que se miden por DIFERENCIA desde
// justo antes de la decisión que se está examinando.
const contadores = () => ({ ..._CONT_APU1 })
const desde = (antes) => Object.fromEntries(
  Object.keys(_CONT_APU1).map(k => [k, _CONT_APU1[k] - antes[k]]))

// ══ 1. Regla 1.4 · toda decisión es legal ════════════════════════════════════
//
// La invariante dura de la tanda: desde que E-12 retiró el puente, una acción
// ilegal no se reescribe — el motor devuelve el mismo estado y la mesa se
// queda clavada. Se afirma sobre estados aleatorios con semilla fija, en los
// tres retos, incluidas las mesas con retirados, con asientos en all-in y con
// pilas que no cubren el pago.
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 500 mesas sintéticas, deterministas. El asiento que decide está siempre
// vivo y con el turno —el motor nunca pregunta en otra situación—, y todo lo
// demás se sortea: tamaño, fase, apuesta viva, pozo, pilas, retirados y
// all-ins ajenos.
function mesasAleatorias(n) {
  const r = mulberry32(20260917)
  const ent = (max) => Math.floor(r() * max)
  const fases = ['BET_1', 'BET_2', 'BET_3']
  const manos = Object.values(MANO)
  const salida = []
  for (let i = 0; i < n; i++) {
    const numPlayers = 2 + ent(4)
    const unit       = [10, 50, 100][ent(3)]
    const currentBet = [0, unit, unit * 3, unit * 7][ent(4)]
    const asiento    = 1 + ent(numPlayers - 1)
    const players = Array.from({ length: numPlayers }, (_, j) => {
      const propio = j === asiento
      const chips  = propio ? [0, 5, unit, unit * 2, unit * 40][ent(5)] : unit * (1 + ent(40))
      return jugador({
        id: j, isHuman: j === 0,
        cards: manos[ent(manos.length)],
        chips,
        contrib: currentBet > 0 && !propio && r() < 0.5 ? currentBet : 0,
        contribMano: ent(10) * unit,
        folded:     !propio && r() < 0.25,
        allIn:      !propio && r() < 0.15,
      })
    })
    salida.push(estado({
      numPlayers, players, unit, currentBet,
      phase: fases[ent(3)],
      pot: ent(40) * unit,
      manoIndex: ent(numPlayers),
      pieIndex: ent(numPlayers),
      activePlayerIndex: asiento,
      handCount: 1 + ent(30),
      _asiento: asiento,
    }))
  }
  return salida
}

describe('1. Legalidad — toda decisión está en `accionesDe` (regla 1.4)', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  it('500 mesas × tres retos: acción legal, `k` de la tabla y `peso` de los tres', () => {
    const mesas = mesasAleatorias(500)
    let conFila = 0
    for (const base of mesas) {
      for (const nivelIA of ['basico', 'avanzado', 'pro']) {
        _resetForTesting()
        const s = { ...base, nivelIA }
        const asiento = base._asiento
        const d = decideBetAction(s, asiento)

        expect(MULTS).toContain(d.k)
        expect(PESOS).toContain(d.peso)

        const fila = accionesDe(s, asiento)
        if (!fila.length) continue          // el motor no pregunta aquí
        conFila++
        expect(fila, `${nivelIA} · ${s.phase} devolvió ${d.action}`).toContain(d.action)
        // Y el MONTO también: `accionesDe` sólo certifica el ×1.
        expect(esLegal(s, asiento, d.action, d.k).ok,
          `${nivelIA} · ${d.action} ×${d.k} no es legal`).toBe(true)
      }
    }
    // Que la batería no esté midiendo el vacío.
    expect(conFila).toBeGreaterThan(1000)
  })

  it('`k` sólo es distinto de 1 cuando la acción lo admite', () => {
    const mesas = mesasAleatorias(200)
    for (const base of mesas) {
      for (const nivelIA of ['basico', 'avanzado', 'pro']) {
        _resetForTesting()
        const d = decideBetAction({ ...base, nivelIA }, base._asiento)
        if (d.action !== 'apostar' && d.action !== 'subir') expect(d.k).toBe(1)
      }
    }
  })
})

// ══ 2. A-3 · Subida fuerte por puntaje (§6.3) ════════════════════════════════
describe('2. A-3 · subida fuerte', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  // R-B (1c-2): `porMesa` es anidado por reto. Esta batería mide Avanzado.
  const UMBRAL_2 = IA.subidaFuerte.porMesa.avanzado[2]   // mesa 2, sin desplazamiento

  // Mesa 2: el umbral más alto de la tabla (41) y el único par de puntajes
  // verdaderamente consecutivos que la baraja permite en esa zona.
  const mesa = (cards, over = {}) => estado({
    numPlayers: 2, phase: 'BET_2', currentBet: 50, pot: 100, unit: 50,
    players: [
      jugador({ id: 0, isHuman: true, contrib: 50 }),
      jugador({ id: 1, cards, chips: 5000 }),
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('las manos de la batería valen lo que la prueba dice', async () => {
    const { getBestSuitScore } = await import('../src/engine/handEvaluator.js')
    expect(getBestSuitScore(MANO.m41, 2, false).points).toBe(UMBRAL_2)
    expect(getBestSuitScore(MANO.m40, 2, false).points).toBe(UMBRAL_2 - 1)
  })

  it('sube fuerte al alcanzar el umbral de su mesa, y no un punto por debajo', () => {
    const conUmbral = mesa(MANO.m41)
    fijarPerfil('EQUILIBRADA', conUmbral, 1)      // desplazamiento 0
    dado(0.95)                                     // el dado de la escalera NO sube

    const alcanza = decideBetAction(conUmbral, 1)
    expect(alcanza.action).toBe('subir')
    expect(alcanza.peso).toBe('grande')

    // Un punto por debajo la regla no entra: decide la escalera, y con el dado
    // alto la escalera iguala.
    expect(decideBetAction(mesa(MANO.m40), 1).action).toBe('igualar')
  })

  it('elige el MAYOR multiplicador que la pila cubre, no el mayor de la tabla', () => {
    // Apuesta viva 50 y unidad 50: subir ×k cuesta 50 + 50k. Con 320 fichas
    // cabe el ×5 (300) y no el ×10 (550).
    const corta = mesa(MANO.m41, {
      players: [
        jugador({ id: 0, isHuman: true, contrib: 50 }),
        jugador({ id: 1, cards: MANO.m41, chips: 320 }),
      ],
    })
    fijarPerfil('EQUILIBRADA', corta, 1)
    dado(0.95)
    const d = decideBetAction(corta, 1)
    expect(d.action).toBe('subir')
    expect(d.k).toBe(5)
    expect(MULTS[MULTS.length - 1]).toBe(10)      // el mayor de la tabla existía
  })

  it('`BET_1` sigue siendo reactiva: con el mismo puntaje no hay subida fuerte', () => {
    const b1 = mesa(MANO.m41, { phase: 'BET_1' })
    fijarPerfil('EQUILIBRADA', b1, 1)
    dado(0.95)
    // La escalera de BET_1 sí sube (el puntaje pasa su `raiseMin`), pero sube de
    // ×1: la firma de §6.3 es el monto, y aquí no está.
    expect(decideBetAction(b1, 1).k).toBe(1)
  })

  // EL TECHO DE UNA MANO CORRIENTE ES 41, y eso gobierna toda la zona alta de
  // §6.3 (D-29 del informe 1c-2). Un as vale 11 y ninguna otra carta pasa de
  // 10, así que cuatro cartas del mismo palo suman 41 como máximo; con cinco ya
  // es AJILEI y la decisión se va por §6.2, que es otra rama. Consecuencia
  // directa: un umbral de 42 o más NO SE ALCANZA por puntaje —sólo con el
  // descuento del temperamento (§6.7)—, y es lo que le pasa a Básico en mesas
  // 2 y 3 desde que el rector lo selló en Avanzado + 2.
  it('el techo de una mano que no es Ajilei son 41 puntos', async () => {
    const { getBestSuitScore, isAjilei } = await import('../src/engine/handEvaluator.js')
    // La mejor mano posible sin ser Ajilei: as más tres dieces del mismo palo.
    const mejor = [carta(1, 'Copas'), carta(10, 'Copas'), carta(11, 'Copas'),
                   carta(12, 'Copas'), carta(6, 'Espadas')]
    expect(isAjilei(mejor, 2)).toBe(false)
    expect(getBestSuitScore(mejor, 2, false).points).toBe(41)
    expect(getBestSuitScore(MANO.m41, 2, false).points).toBe(41)
    // Y por eso el umbral sellado de Básico en mesa 2 queda por encima de todo
    // lo que la baraja puede dar sin ayuda del temperamento.
    expect(IA.subidaFuerte.porMesa.basico[2]).toBeGreaterThan(41)
  })

  // CAMBIO DE VEREDICTO, DOS VECES. Hasta 1d Básico era NEUTRO aquí y esta
  // prueba afirmaba que el mismo 41 no lo movía. La ficha 1c-2 §2.1 lo encendió
  // con umbral propio (R-B, entonces Avanzado − 8) y R-D lo gobierna: contra el
  // humano empuja, entre IAS no. Y al cerrar 1c-2 el rector selló el umbral de
  // Básico en Avanzado + 2, POR ENCIMA del de Avanzado —D-23: cuanto más alto,
  // más difícil es Básico, porque empuja menos—.
  //
  // Con la cuantización de arriba eso tiene una consecuencia exacta: en mesa 2
  // el umbral de Básico es 43 y ninguna mano llega, así que la regla sólo entra
  // por el DESPLAZAMIENTO del temperamento (§6.7). Con AGRESIVA, 43 − 2 = 41 y
  // el 41 alcanza justo. Esa es la Básica que Victor se encuentra: sube fuerte,
  // pero mucho menos a menudo que Avanzado.
  it('Básico sube fuerte contra el humano, con SU umbral, que está por ENCIMA del de Avanzado', () => {
    const basico = mesa(MANO.m41, { nivelIA: 'basico' })
    fijarPerfil('AGRESIVA', basico, 1)
    dado(0.95)
    const d = decideBetAction(basico, 1)
    expect(d.action).toBe('subir')
    expect(d.k).toBeGreaterThan(1)
    expect(d.peso).toBe('grande')
    expect(IA.subidaFuerte.porReto.basico).toBe(true)
    // El umbral que usó es el suyo, y es MÁS ALTO que el de Avanzado (D-23).
    expect(IA.subidaFuerte.porMesa.basico[2])
      .toBeGreaterThan(IA.subidaFuerte.porMesa.avanzado[2])
  })

  // Y la otra mitad del mismo hecho: sin el descuento del temperamento, en mesa
  // 2 la regla de Básico no llega a entrar nunca. No es un fallo —es la forma
  // que tiene «empuja menos» cuando el puntaje va de diez en diez—, pero
  // conviene que esté escrito y no se descubra por sorpresa en 1e.
  it('en mesa 2 y con EQUILIBRADA, el umbral de Básico queda fuera del alcance de la baraja', () => {
    // El farol por bloques se apaga a propósito: es la OTRA vía por la que
    // Básico puede poner un ×k delante, y `fijarPerfil` sortea 600 veces con azar
    // de verdad antes de que el dado se fije, así que puede dejar un farol
    // planeado justo en esta mano. Lo que aquí se mide es §6.3, no §6.4.
    const bloque = IA.farol.bloquePorReto.basico
    IA.farol.bloquePorReto.basico = null
    try {
      const basico = mesa(MANO.m41, { nivelIA: 'basico' })
      fijarPerfil('EQUILIBRADA', basico, 1)
      dado(0.95)
      expect(IA.subidaFuerte.porMesa.basico[2] + IA.desplazamiento.EQUILIBRADA).toBe(43)
      expect(decideBetAction(basico, 1).k).toBe(1)
    } finally {
      IA.farol.bloquePorReto.basico = bloque
    }
  })

  it('el temperamento desplaza el umbral (§6.7)', () => {
    // CONSERVADORA suma +2: el 41 justo deja de alcanzar.
    const s = mesa(MANO.m41)
    fijarPerfil('CONSERVADORA', s, 1)
    dado(0.95)
    expect(IA.desplazamiento.CONSERVADORA).toBe(2)
    expect(decideBetAction(s, 1).k).toBe(1)       // no hay subida fuerte
  })
})

// ══ 3. A-4 · Regla del cuarto del pozo (§6.5) ════════════════════════════════
describe('3. A-4 · cuarto del pozo', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  const FRAC = IA.fraccionPozo.avanzado

  // Mano floja (9 puntos) para que ninguna otra regla pueda explicar un pago.
  const mesa = (pot, currentBet, over = {}) => estado({
    numPlayers: 3, phase: 'BET_3', pot, currentBet, unit: 50,
    players: [
      jugador({ id: 0, isHuman: true, contrib: currentBet }),
      jugador({ id: 1, cards: MANO.floja, chips: 5000 }),
      jugador({ id: 2 }),
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('costo ≤ ¼ del pozo: paga con la mano más floja de la batería', () => {
    const barato = mesa(1000, 150)                 // 150 ≤ 250
    fijarPerfil('EQUILIBRADA', barato, 1)
    dado(0.5)
    const d = decideBetAction(barato, 1)
    expect(150).toBeLessThanOrEqual(FRAC * 1000)
    expect(d.action).toBe('igualar')
    expect(d.peso).toBe('leve')
  })

  it('costo > ¼ del pozo: decide el listón del temperamento', () => {
    const caro = mesa(200, 150)                    // 150 > 50
    fijarPerfil('EQUILIBRADA', caro, 1)
    dado(0.5)
    expect(decideBetAction(caro, 1).action).toBe('retirarse')
  })

  // CAMBIO DE VEREDICTO (1c-2). `fraccionPozo.basico` deja de ser `null`: era
  // lo único que metía V4 de Básico en rango en las cuatro mesas (informe 1d,
  // D.8). El valor es provisional —lo fija el barrido de §3.2—; la MECÁNICA,
  // que es lo que esta prueba sella, ya no distingue a Básico.
  it('Básico ya paga barato: el cuarto del pozo vale para los tres retos', () => {
    const barato = mesa(1000, 150, { nivelIA: 'basico' })
    fijarPerfil('EQUILIBRADA', barato, 1)
    dado(0.5)
    const d = decideBetAction(barato, 1)
    expect(d.action).toBe('igualar')
    expect(d.peso).toBe('leve')
    expect(typeof IA.fraccionPozo.basico).toBe('number')
  })

  // R-D no lo toca, y es deliberado: el paso 7 es un PAGO, no un empuje. La
  // ficha 1c-2 §2.2 deja fuera de R-D los pasos 3, 4 y 7 por eso mismo.
  it('el cuarto del pozo se evalúa también sin humano en la mano (R-D)', () => {
    const sinHumano = mesa(1000, 150, { nivelIA: 'basico' })
    sinHumano.players = sinHumano.players.map(
      (j, i) => (i === 0 ? { ...j, isHuman: false } : j))
    fijarPerfil('EQUILIBRADA', sinHumano, 1)
    dado(0.5)
    expect(IA.soloContraHumano.basico).toBe(true)
    expect(decideBetAction(sinHumano, 1).action).toBe('igualar')
  })
})

// ══ 4. A-5 · All-in de la IA (§6.6) ══════════════════════════════════════════
describe('4. A-5 · all-in de la IA', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  // La pila NO cubre la apuesta viva: la fila es ['allIn', 'retirarse'].
  const corta = (chips, pot, cards = MANO.floja, over = {}) => estado({
    numPlayers: 3, phase: 'BET_3', pot, currentBet: 2000, unit: 50,
    players: [
      jugador({ id: 0, isHuman: true, contrib: 2000 }),
      jugador({ id: 1, cards, chips }),
      jugador({ id: 2, chips: 5000 }),
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('la situación es la que se cree: sólo caben all-in y retirarse', () => {
    expect(accionesDe(corta(300, 2000), 1)).toEqual(['allIn', 'retirarse'])
  })

  it('pila ≤ ¼ del pozo: all-in con la mano más floja', () => {
    const s = corta(300, 2000)                     // 300 ≤ 500
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    const d = decideBetAction(s, 1)
    expect(d.action).toBe('allIn')
    expect(d.peso).toBe('grande')
  })

  it('pila > ¼ y puntaje bajo el mínimo: se retira', () => {
    const s = corta(900, 2000)                     // 900 > 500, mano de 9
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    expect(decideBetAction(s, 1).action).toBe('retirarse')
  })

  it('pila > ¼ pero puntaje sobre el mínimo: all-in', () => {
    const s = corta(900, 2000, MANO.m41)
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    expect(decideBetAction(s, 1).action).toBe('allIn')
    expect(IA.allIn.puntajeMin.avanzado).toBeLessThan(41)
  })

  it('el desplazamiento de CONSERVADORA cambia el veredicto en el filo', () => {
    // 31 justos: con EQUILIBRADA (0) alcanza el mínimo; con CONSERVADORA (+2),
    // el mínimo sube a 33 y la misma mano se suelta.
    const s = corta(900, 2000, MANO.m31)
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    expect(decideBetAction(s, 1).action).toBe('allIn')

    vi.restoreAllMocks()
    fijarPerfil('CONSERVADORA', s, 1)
    dado(0.5)
    expect(decideBetAction(s, 1).action).toBe('retirarse')
  })

  it('Básico también empuja cuando la pila es barata: la regla vieja ya no existe', () => {
    // §6.6 gobierna los tres retos por la fracción: antes de APU-1, quien no
    // cubría PERDÍA lo puesto, y eso es lo que 1b retiró del motor.
    const s = corta(300, 2000, MANO.floja, { nivelIA: 'basico' })
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    expect(decideBetAction(s, 1).action).toBe('allIn')

    // Lo que Básico sigue sin hacer es mirar la mano: con la pila cara se va
    // aunque lleve la mejor mano de la batería. El perfil se vuelve a fijar
    // DESPUÉS de soltar el mock — con el dado congelado el sorteo también lo
    // está y sólo un temperamento sería alcanzable.
    vi.restoreAllMocks()
    const cara = corta(900, 2000, MANO.m41, { nivelIA: 'basico' })
    fijarPerfil('EQUILIBRADA', cara, 1)
    dado(0.5)
    expect(decideBetAction(cara, 1).action).toBe('retirarse')
    expect(IA.allIn.puntajeMin.basico).toBeNull()
  })
})

// ══ 5. A-6 · Farol por bloques (§6.4) ════════════════════════════════════════
describe('5. A-6 · farol por bloques', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  const B = IA.farol.bloquePorReto.avanzado       // 12

  // Con el dado fijo en 0,2 el sorteo del bloque 1 (manos 13…24) cae en la
  // 13 + floor(0,2 × 12) = 15, que es el `handCount` de estas fixtures.
  const DADO_MANO_ELEGIDA = 0.2

  // LA FAROLERA LLEVA `m31` Y NO `floja`, y es R-A (1c-2) quien lo obliga: con
  // 13 puntos el plan ya no se ejecuta, se TRASLADA. El 31 está elegido para que
  // ninguna otra regla pueda explicar la subida, y el margen se comprueba abajo:
  //   · 31 ≥ 26/28, el piso de la mesa  → el farol cabe;
  //   · 31 < `openMin` de CONSERVADORA en el pie (32 + 2 − 2 = 32) → sin farol,
  //     esta misma mano PASA, que es lo que las pruebas del negativo miden;
  //   · 31 < umbral de §6.3 de Avanzado en mesa 3 (40 + 2) → el paso 5 no entra.
  // Por eso todas fijan CONSERVADORA en el asiento 2 antes de medir.
  const mesa = (over = {}) => estado({
    numPlayers: 3, phase: 'BET_2', currentBet: 0, pot: 300, unit: 50, handCount: 15,
    players: [
      jugador({ id: 0, isHuman: true }),
      jugador({ id: 1, cards: MANO.floja, chips: 1000 }),
      jugador({ id: 2, cards: MANO.m31, chips: 9000 }),     // la de mayor pila
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('la mano de la farolera cae en la ventana que la prueba dice', async () => {
    const { getBestSuitScore } = await import('../src/engine/handEvaluator.js')
    const puntaje = getBestSuitScore(MANO.m31, 3, false).points
    expect(puntaje).toBeGreaterThanOrEqual(IA.farol.pisoPuntajePorMesa[3])
    expect(puntaje).toBeLessThan(IA.subidaFuerte.porMesa.avanzado[3])
  })

  it('el sorteo cae en la mano esperada y farolea la IA de mayor pila', () => {
    const s = mesa()
    fijarPerfil('CONSERVADORA', s, 2)
    dado(DADO_MANO_ELEGIDA)
    // El asiento 2 tiene 9.000 contra 1.000: es la elegida y abre con mano de 9.
    const d = decideBetAction({ ...s, activePlayerIndex: 2 }, 2)
    expect(d.action).toBe('apostar')
    expect(d.peso).toBe('grande')
    expect(d.k).toBeGreaterThan(1)                // el mayor que la pila cubre
  })

  it('la IA que NO es la de mayor pila no farolea', () => {
    const s = mesa()
    fijarPerfil('CONSERVADORA', s, 2)
    dado(DADO_MANO_ELEGIDA)
    decideBetAction({ ...s, activePlayerIndex: 2 }, 2)     // adjudica el farol
    // El asiento 1, con la misma mano de 9 puntos, pasa.
    expect(decideBetAction(s, 1).action).toBe('pasar')
  })

  it('vuelve a subir en BET_3 con el mayor multiplicador legal', () => {
    const s = mesa()
    fijarPerfil('CONSERVADORA', s, 2)
    dado(DADO_MANO_ELEGIDA)
    decideBetAction({ ...s, activePlayerIndex: 2 }, 2)
    const enBet3 = { ...s, phase: 'BET_3', currentBet: 100, activePlayerIndex: 2,
      players: s.players.map((p, i) => (i === 0 ? { ...p, contrib: 100 } : p)) }
    const d = decideBetAction(enBet3, 2)
    expect(d.action).toBe('subir')
    expect(d.k).toBeGreaterThan(1)
  })

  it('si le suben y no cubre, el plan muere y decide la regla del all-in', () => {
    const s = mesa()
    fijarPerfil('CONSERVADORA', s, 2)
    dado(DADO_MANO_ELEGIDA)
    decideBetAction({ ...s, activePlayerIndex: 2 }, 2)
    // La farolera queda corta ante una apuesta que no cubre: ya no hay subida
    // posible, así que entra A-5 — y con la pila barata frente al pozo, empuja.
    const acorralada = {
      ...s, phase: 'BET_3', currentBet: 20000, pot: 40000, activePlayerIndex: 2,
      players: [
        jugador({ id: 0, isHuman: true, contrib: 20000 }),
        jugador({ id: 1, chips: 30000 }),
        jugador({ id: 2, cards: MANO.m31, chips: 9000 }),
      ],
    }
    expect(accionesDe(acorralada, 2)).toEqual(['allIn', 'retirarse'])
    expect(decideBetAction(acorralada, 2).action).toBe('allIn')
  })

  // CAMBIO DE VEREDICTO (1c-2). Básico tenía `bloquePorReto = null` y esta
  // prueba sellaba que no farolease ni una vez. La ficha 1c-2 §2.1 le da bloque
  // de 15 —el más largo de los tres, o sea el que menos farolea— y R-D le pone
  // la condición: contra el humano sí. Sin humano, bloque 11.
  it('Básico ya tiene bloque, y con el humano en la mano farolea', () => {
    const s = mesa({ nivelIA: 'basico' })
    fijarPerfil('CONSERVADORA', s, 2)
    // MANO 20, no 15: con B = 15 la mano 15 cae en el bloque 0, que es el
    // MISMO en que sondea `fijarPerfil` (mano 3), y ahí el sorteo ya estaba
    // hecho con el azar de verdad. En la 20 el bloque es el 1 —manos 16…30— y
    // vuelve a sortearse con el dado fijo: 16 + floor(0,3 × 15) = 20.
    dado(0.3)
    expect(IA.farol.bloquePorReto.basico).toBe(15)
    const d = decideBetAction({ ...s, handCount: 20, activePlayerIndex: 2 }, 2)
    expect(d.action).toBe('apostar')
    expect(d.k).toBeGreaterThan(1)
  })

  it('dos manos del mismo bloque no tienen dos faroles', () => {
    const s = mesa()
    fijarPerfil('CONSERVADORA', s, 2)
    dado(DADO_MANO_ELEGIDA)
    expect(decideBetAction({ ...s, activePlayerIndex: 2 }, 2).action).toBe('apostar')
    // Mano 4: mismo bloque (1…12), y el farol ya se gastó en la 3.
    const siguiente = { ...s, handCount: 16, activePlayerIndex: 2 }
    expect(decideBetAction(siguiente, 2).action).toBe('pasar')
    // Mano 5, por si acaso: sigue sin farol.
    expect(decideBetAction({ ...s, handCount: 17, activePlayerIndex: 2 }, 2).action).toBe('pasar')
    expect(B).toBeGreaterThan(5)
  })
})

// ══ 6. A-8 · Pasar con mano grande (§6.8) ════════════════════════════════════
describe('6. A-8 · pasar con mano grande y cobrar en BET_3', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  const P = IA.pasarConManoGrande.avanzado        // 0,15

  const mesa = (over = {}) => estado({
    numPlayers: 3, phase: 'BET_2', currentBet: 50, pot: 100, unit: 50, handCount: 15,
    players: [
      jugador({ id: 0, isHuman: true, contrib: 50 }),
      jugador({ id: 1, cards: MANO.m40, chips: 5000 }),
      jugador({ id: 2 }),
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('con el dado por debajo de `p`: iguala en BET_2 y sube fuerte en BET_3', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(P / 2)                                    // cae dentro de la probabilidad
    expect(decideBetAction(s, 1).action).toBe('igualar')

    // Misma mano, misma partida: en BET_3 cobra, y cobra con el mayor k.
    const bet3 = { ...s, phase: 'BET_3', currentBet: 100,
      players: s.players.map((p, i) => (i === 0 ? { ...p, contrib: 100 } : p)) }
    const d = decideBetAction(bet3, 1)
    expect(d.action).toBe('subir')
    expect(d.k).toBeGreaterThan(1)
    expect(d.peso).toBe('grande')
  })

  it('con el dado por encima de `p`: sube fuerte en BET_2, sin trampa', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.95)
    const d = decideBetAction(s, 1)
    expect(d.action).toBe('subir')
    expect(d.k).toBeGreaterThan(1)
  })

  // CAMBIO DE VEREDICTO (1c-2). Hasta 1d esto medía a Básico NEUTRO: sin
  // umbral de §6.3, la rama entera quedaba fuera y decidía la escalera con ×1.
  // Ahora Básico tiene umbral propio y SÍ entra en la rama —sube fuerte contra
  // el humano—, pero `p = 0` sigue cerrándole la trampa: con el dado en el
  // suelo, que es donde la trampa se armaría, no la arma.
  //
  // El hallazgo D-15 de 1d queda así cerrado por el otro lado: el valor de
  // Básico en §6.8 ya no está inerte por `umbralFuerte === null`, está en cero
  // porque vale cero. Si alguien lo sube, ahora se notará.
  // AGRESIVA y no EQUILIBRADA desde 1c-2-iii: el umbral de Básico en mesa 3 es
  // 42 y el 40 de esta mano no llega sin el −2 del temperamento (§6.7). Lo que
  // la prueba mide —que `p = 0` no arma la trampa— no depende del temperamento.
  it('Básico sube fuerte pero nunca arma la trampa (p = 0)', () => {
    const s = mesa({ nivelIA: 'basico' })
    fijarPerfil('AGRESIVA', s, 1)
    dado(0)                                        // el dado más bajo posible
    expect(IA.pasarConManoGrande.basico).toBe(0)
    const d = decideBetAction(s, 1)
    expect(d.action).toBe('subir')                 // no `igualar`: no hubo trampa
    expect(d.k).toBeGreaterThan(1)
    expect(d.peso).toBe('grande')
  })
})

// ══ 7. E-12 · el motor y la decisión ═════════════════════════════════════════
describe('7. E-12 · `decidirIA` y `applyAIBetAction`', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  const mesa = () => estado({
    numPlayers: 3, phase: 'BET_2', currentBet: 50, pot: 400, unit: 50,
    players: [
      jugador({ id: 0, isHuman: true, contrib: 50, contribMano: 50 }),
      jugador({ id: 1, cards: MANO.m40, chips: 5000 }),
      jugador({ id: 2 }),
    ],
    nivelIA: 'avanzado',
  })

  it('`decidirIA` no muta el estado', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    const antes = JSON.stringify(s)
    const d = decidirIA(s, 1)
    expect(JSON.stringify(s)).toBe(antes)
    expect(d).toHaveProperty('peso')
  })

  it('`applyAIBetAction` aplica exactamente el `{action, k}` que decidió', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    const d = decidirIA(s, 1)
    const porElMotor = applyAIBetAction(s)
    const aMano      = applyBetAction(s, 1, d.action, d.k)
    expect(JSON.stringify(porElMotor)).toBe(JSON.stringify(aMano))
    // Y aplicó DE VERDAD: el estado cambió de objeto.
    expect(porElMotor).not.toBe(s)
  })

  it('el `peso` no entra al motor', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.5)
    const despues = applyAIBetAction(s)
    expect(despues.players.every(p => !('peso' in p))).toBe(true)
    expect('peso' in despues).toBe(false)
  })
})

// ══ 8. R-B · `subidaFuerte.porMesa` por reto (ficha 1c-2 §2.2) ══════════════
//
// Lo que sella este bloque es la FORMA, no la cifra: que el mapa se pueda
// escribir por reto sin que la forma plana de 1c cambie una sola decisión. Las
// tres pruebas manipulan `AJILEI_CONFIG` en vivo y lo devuelven en `afterEach`,
// que es la única manera de comparar las dos formas en la misma corrida.
describe('8. R-B · `porMesa` por reto', () => {
  const ORIGINAL = IA.subidaFuerte.porMesa
  const PLANA    = { 2: 41, 3: 40, 4: 38, 5: 39 }

  beforeEach(() => _resetForTesting())
  afterEach(() => {
    IA.subidaFuerte.porMesa = ORIGINAL
    vi.restoreAllMocks()
  })

  // Mesa 2 con el humano vivo, para que R-D no se cruce.
  const mesa = (cards, over = {}) => estado({
    numPlayers: 2, phase: 'BET_2', currentBet: 50, pot: 100, unit: 50,
    players: [
      jugador({ id: 0, isHuman: true, contrib: 50 }),
      jugador({ id: 1, cards, chips: 5000 }),
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('la forma plana y la anidada equivalente dan LA MISMA decisión, 200 × 3', () => {
    const mesas = mesasAleatorias(200)
    // El reparto de perfiles corre con el azar de verdad, así que las dos
    // corridas tienen que arrancar del mismo generador o compararse ruido.
    const corrida = () => {
      const real = Math.random
      Math.random = mulberry32(20260918)
      try {
        return mesas.map(base => ['basico', 'avanzado', 'pro'].map(nivelIA => {
          _resetForTesting()
          const d = decideBetAction({ ...base, nivelIA }, base._asiento)
          return `${d.action}|${d.k}|${d.peso}`
        }).join(','))
      } finally { Math.random = real }
    }

    IA.subidaFuerte.porMesa = PLANA
    const conPlana = corrida()
    IA.subidaFuerte.porMesa = { basico: PLANA, avanzado: PLANA, pro: PLANA }
    expect(corrida()).toEqual(conPlana)

    // Y que la batería no esté comparando el vacío: con el mapa plano y los tres
    // retos encendidos, §6.3 dispara de verdad en alguna de las 600 decisiones.
    expect(conPlana.some(fila => fila.includes('|10|'))).toBe(true)
  })

  it('con la forma anidada, cada reto lee SU umbral', () => {
    IA.subidaFuerte.porMesa = {
      basico:   { 2: 20 },     // 41 lo pasa de sobra
      avanzado: { 2: 50 },     // 41 no lo alcanza
      pro:      { 2: 50 },
    }
    const s = mesa(MANO.m41)
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.95)                                     // la escalera NO sube

    _resetForTesting()
    const bas = decideBetAction({ ...s, nivelIA: 'basico' }, 1)
    expect(bas.action).toBe('subir')
    expect(bas.k).toBeGreaterThan(1)

    _resetForTesting()
    const ava = decideBetAction({ ...s, nivelIA: 'avanzado' }, 1)
    expect(ava.k).toBe(1)                          // la escalera, no §6.3
  })

  it('un reto sin entrada anidada cae a la forma plana del mismo mapa', () => {
    IA.subidaFuerte.porMesa = { 2: 20, avanzado: { 2: 50 } }
    const s = mesa(MANO.m41)
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.95)

    _resetForTesting()
    // `pro` no tiene entrada propia: usa el 20 de la plana y sube fuerte.
    expect(decideBetAction({ ...s, nivelIA: 'pro' }, 1).k).toBeGreaterThan(1)
    _resetForTesting()
    // `avanzado` sí la tiene: el 50 manda y la plana no se mira.
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).k).toBe(1)
  })
})

// ══ 9. R-A · piso de puntaje para el farol (ficha 1c-2 §2.2) ════════════════
//
// La vía del BLOQUE, que es la que traslada. La vía de ⑥ —reactiva, sin
// traslado— se mide en `testNivel2` §5, que es donde vive la maquinaria de la
// lectura de descartes.
describe('9. R-A · piso de puntaje para el farol', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  const PISO = IA.farol.pisoPuntajePorMesa[3]      // mesa 3
  const B    = IA.farol.bloquePorReto.avanzado     // 12

  // Bloque 1 = manos 13…24. Con el dado en 0,2 el sorteo cae en la 15.
  const mesa = (cards, over = {}) => estado({
    numPlayers: 3, phase: 'BET_2', currentBet: 0, pot: 300, unit: 50, handCount: 15,
    players: [
      jugador({ id: 0, isHuman: true }),
      jugador({ id: 1, cards: MANO.floja, chips: 1000 }),
      jugador({ id: 2, cards, chips: 9000 }),      // la elegida: mayor pila
    ],
    nivelIA: 'avanzado',
    ...over,
  })

  it('bajo el piso no farolea, y el plan se traslada en vez de gastarse', () => {
    const s = mesa(MANO.floja)                     // 13 puntos, muy por debajo
    fijarPerfil('CONSERVADORA', s, 2)
    dado(0.2)
    expect(PISO).toBeGreaterThan(13)
    const antes = contadores()
    expect(decideBetAction({ ...s, activePlayerIndex: 2 }, 2).action).toBe('pasar')
    const d = desde(antes)
    expect(d.farolTrasladadoPiso).toBe(1)
    expect(d.farolBloqueEjecutado).toBe(0)
    expect(d.farolBloqueAgotado).toBe(0)           // quedaban manos de sobra
  })

  it('sobre el piso sí farolea, con la misma fixture y el mismo dado', () => {
    const s = mesa(MANO.m31)                       // 31 ≥ 28
    fijarPerfil('CONSERVADORA', s, 2)
    dado(0.2)
    const antes = contadores()
    const d = decideBetAction({ ...s, activePlayerIndex: 2 }, 2)
    expect(d.action).toBe('apostar')
    expect(d.k).toBeGreaterThan(1)
    expect(desde(antes).farolBloqueEjecutado).toBe(1)
    expect(desde(antes).farolTrasladadoPiso).toBe(0)
  })

  it('el traslado cae DENTRO del bloque, y ahí sí farolea', () => {
    const s = mesa(MANO.floja)
    fijarPerfil('CONSERVADORA', s, 2)
    dado(0.2)
    // Mano 15: bajo el piso. Con el dado en 0,2 el traslado cae en la
    // 15 + 1 + floor(0,2 × (24 − 15)) = 17.
    decideBetAction({ ...s, activePlayerIndex: 2 }, 2)
    const conMano = {
      ...s, handCount: 17, activePlayerIndex: 2,
      players: s.players.map((j, i) => (i === 2 ? { ...j, cards: MANO.m31 } : j)),
    }
    const antes = contadores()
    expect(decideBetAction(conMano, 2).action).toBe('apostar')
    expect(desde(antes).farolBloqueEjecutado).toBe(1)
  })

  it('si el traslado cae fuera del bloque, ese bloque se queda sin farol', () => {
    // Mano 24: la última del bloque 1. Con el dado en 0,95 el sorteo cae ahí
    // (13 + floor(0,95 × 12) = 24) y ya no quedan manos a las que trasladar.
    const s = mesa(MANO.floja, { handCount: 24 })
    fijarPerfil('CONSERVADORA', s, 2)
    dado(0.95)
    const antes = contadores()
    expect(decideBetAction({ ...s, activePlayerIndex: 2 }, 2).action).toBe('pasar')
    const d = desde(antes)
    expect(d.farolBloqueAgotado).toBe(1)
    expect(d.farolBloqueEjecutado).toBe(0)
    expect(B).toBe(12)
  })

  it('el piso va POR MESA: el de mesa 2 es más bajo que el de las grandes', () => {
    const piso = IA.farol.pisoPuntajePorMesa
    expect(piso[2]).toBeLessThan(piso[3])
    expect(piso[3]).toBe(piso[4])
    expect(piso[5]).toBe(piso[4])
  })
})

// ══ 10. R-D · sólo contra humano (ficha 1c-2 §2.2) ═══════════════════════
//
// La asimetría que E.2b del informe 1d pidió: Básico compromete fichas contra
// el humano y no entre IAS. Lo que se sella aquí es el REPARTO de pasos —qué
// se apaga y qué no—, no la cifra de ningún umbral.
describe('10. R-D · el compromiso depende de contra quién se juega', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  // Mesa 3, apuesta viva de 50 sobre un pozo de 100: el paso 7 NO cubre este
  // pago (50 > ¼ de 100), así que lo único que puede producir un ×k es §6.3.
  const mesa = (over = {}) => estado({
    numPlayers: 3, phase: 'BET_2', currentBet: 50, pot: 100, unit: 50, handCount: 15,
    players: [
      jugador({ id: 0, isHuman: true, contrib: 50 }),
      jugador({ id: 1, cards: MANO.m41, chips: 5000 }),
      jugador({ id: 2 }),
    ],
    nivelIA: 'basico',
    ...over,
  })

  const sinHumano = (s) => ({
    ...s, players: s.players.map((j, i) => (i === 0 ? { ...j, isHuman: false } : j)),
  })

  // AGRESIVA desde 1c-2-iii, por la cuantización: en mesa 3 el umbral sellado
  // de Básico es 42 y el techo de una mano corriente es 41, así que sin el −2
  // del temperamento la rama no se alcanza y esta batería no mediría R-D sino
  // el umbral. R-D no depende del temperamento.
  it('Básico con el humano en la mano sube con el mayor multiplicador', () => {
    const s = mesa()
    fijarPerfil('AGRESIVA', s, 1)
    dado(0.95)
    const d = decideBetAction(s, 1)
    expect(d.action).toBe('subir')
    expect(d.k).toBeGreaterThan(1)
    expect(IA.soloContraHumano.basico).toBe(true)
  })

  it('el MISMO estado sin humano cae a la lógica de NIV-2, con ×1', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.95)
    const antes = contadores()
    const d = decideBetAction(sinHumano(s), 1)
    expect(d.k).toBe(1)
    expect(d.action).not.toBe('subir')
    expect(desde(antes).decisionesSinHumano).toBe(1)
  })

  it('con el humano RETIRADO tampoco empuja: «en la mano» es vivo y sin retirar', () => {
    const s = mesa()
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.95)
    const retirado = {
      ...s, players: s.players.map((j, i) => (i === 0 ? { ...j, folded: true } : j)),
    }
    expect(decideBetAction(retirado, 1).k).toBe(1)
  })

  it('Avanzado no cambia cuando el humano se va: su interruptor está apagado', () => {
    const s = mesa({ nivelIA: 'avanzado' })
    fijarPerfil('EQUILIBRADA', s, 1)
    dado(0.95)
    expect(IA.soloContraHumano.avanzado).toBe(false)
    // Sin `_resetForTesting` entre las dos: el reparto de temperamentos tira
    // del mismo `Math.random` que ya está fijo en 0,95, así que reiniciarlo
    // sortearía OTRO perfil y la prueba compararía dos IAS distintas. Lo único
    // que cambia entre las dos llamadas es el `isHuman` del asiento 0, que es
    // exactamente lo que se quiere medir.
    const con = decideBetAction(s, 1)
    const sin = decideBetAction(sinHumano(s), 1)
    expect(sin.action).toBe(con.action)
    expect(sin.k).toBe(con.k)
    expect(con.k).toBeGreaterThan(1)               // la fixture no mide el vacío
  })

  it('el all-in y el cuarto del pozo se evalúan igual sin humano', () => {
    // (a) pila barata frente al pozo: empuja, haya humano o no.
    const empuje = estado({
      numPlayers: 3, phase: 'BET_3', currentBet: 4000, pot: 2000, unit: 50,
      players: [
        jugador({ id: 0, isHuman: false, contrib: 4000 }),
        jugador({ id: 1, cards: MANO.floja, chips: 300 }),
        jugador({ id: 2, chips: 9000 }),
      ],
      nivelIA: 'basico',
    })
    fijarPerfil('EQUILIBRADA', empuje, 1)
    dado(0.5)
    expect(accionesDe({ ...empuje, activePlayerIndex: 1 }, 1)).toEqual(['allIn', 'retirarse'])
    expect(decideBetAction(empuje, 1).action).toBe('allIn')

    // (b) pago barato frente al pozo: paga, haya humano o no.
    vi.restoreAllMocks()                           // `fijarPerfil` sondea con azar real
    _resetForTesting()
    const barato = estado({
      numPlayers: 3, phase: 'BET_3', currentBet: 150, pot: 1000, unit: 50,
      players: [
        jugador({ id: 0, isHuman: false, contrib: 150 }),
        jugador({ id: 1, cards: MANO.floja, chips: 5000 }),
        jugador({ id: 2 }),
      ],
      nivelIA: 'basico',
    })
    fijarPerfil('EQUILIBRADA', barato, 1)
    dado(0.5)
    const d = decideBetAction(barato, 1)
    expect(d.action).toBe('igualar')
    expect(d.peso).toBe('leve')
  })

  // D-19, decidido por el rector al abrir 1c-2-ii: §6.2 entra bajo el mismo
  // botón. El argumento del propio archivo se lee en las dos direcciones —si
  // §6.2 no es más que §6.3 adelantada, lo que apague §6.3 tiene que apagar
  // §6.2—; si no, un Básico entre IAS subiría ×1 con 45 puntos y ×10 con 51.
  it('el Ajilei de §6.2 también empuja sólo contra el humano (D-19)', async () => {
    const { isAjilei } = await import('../src/engine/handEvaluator.js')
    // 51 puntos: Copas del As al 5. Se AFIRMA que es Ajilei antes de usarla.
    const AJILEI = [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'),
                    carta(4,'Copas'), carta(5,'Copas')]
    const s = mesa({
      players: [
        jugador({ id: 0, isHuman: true, contrib: 50 }),
        jugador({ id: 1, cards: AJILEI, chips: 5000 }),
        jugador({ id: 2 }),
      ],
    })
    expect(isAjilei(AJILEI, s.handRules.ruleN)).toBe(true)
    // Sin `fijarPerfil`: la rama del Ajilei devuelve ANTES de que
    // `_ensurePersonalities` reparta temperamentos, así que aquí no hay perfil
    // que fijar —ni que pueda influir—. El dado sólo gobierna el disimulo de Pro.
    dado(0.95)

    const con = decideBetAction(s, 1)
    expect(con.action).toBe('subir')
    expect(con.k).toBeGreaterThan(1)               // §6.2 con el humano delante

    const sin = decideBetAction(sinHumano(s), 1)
    // LA INVARIANTE NO SE TOCA: con el Ajilei no se retira jamás. Lo único que
    // R-D cambia es el MONTO.
    expect(sin.action).toBe('subir')
    expect(sin.k).toBe(1)
    expect(sin.peso).not.toBe('grande')
  })

  it('...y en Avanzado el Ajilei sigue empujando sin humano', () => {
    const AJILEI = [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'),
                    carta(4,'Copas'), carta(5,'Copas')]
    const s = mesa({
      nivelIA: 'avanzado',
      players: [
        jugador({ id: 0, isHuman: true, contrib: 50 }),
        jugador({ id: 1, cards: AJILEI, chips: 5000 }),
        jugador({ id: 2 }),
      ],
    })
    dado(0.95)
    expect(decideBetAction(s, 1).k).toBeGreaterThan(1)
    expect(decideBetAction(sinHumano(s), 1).k).toBeGreaterThan(1)
  })

  it('un farol de bloque en curso se SUSPENDE sin humano, y se traslada', () => {
    const conFarol = estado({
      numPlayers: 3, phase: 'BET_2', currentBet: 0, pot: 300, unit: 50, handCount: 20,
      players: [
        jugador({ id: 0, isHuman: true }),
        jugador({ id: 1, cards: MANO.floja, chips: 1000 }),
        jugador({ id: 2, cards: MANO.m31, chips: 9000 }),
      ],
      nivelIA: 'basico',
    })
    fijarPerfil('CONSERVADORA', conFarol, 2)
    dado(0.3)                                      // bloque 1: sortea la mano 20
    expect(decideBetAction({ ...conFarol, activePlayerIndex: 2 }, 2).action).toBe('apostar')

    vi.restoreAllMocks()                           // idem: el sondeo necesita azar real
    _resetForTesting()
    fijarPerfil('CONSERVADORA', conFarol, 2)
    dado(0.3)
    const sin = { ...sinHumano(conFarol), activePlayerIndex: 2 }
    const antes = contadores()
    expect(decideBetAction(sin, 2).action).toBe('pasar')
    const d = desde(antes)
    expect(d.farolTrasladadoSinHumano).toBe(1)
    expect(d.farolBloqueEjecutado).toBe(0)
  })
})
