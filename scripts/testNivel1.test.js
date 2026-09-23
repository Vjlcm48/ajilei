/**
 * NIV-1 · Nivel Avanzado — comodín completo (③) y disciplina de bote (④).
 * Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §5.2 · §5.5 · §2.1.
 *
 * La pieza central es el §1: el TEST DE ORO de Básico. Lleva transcrita la
 * lógica de `decideBetAction`/`decideDiscard` ANTERIOR a esta tanda y la compara
 * decisión contra decisión sobre una batería de fixtures. Si Básico cambia en un
 * solo caso, la tanda está mal.
 *
 * Ejecutar: npm test
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  decideBetAction, decideDiscard, getPersonalityName,
  _resetForTesting, _CURVAS_PARA_TEST,
} from '../src/engine/aiPlayer.js'
import { getBestSuitScore, isAjilei } from '../src/engine/handEvaluator.js'
import { PALOS, VALORES, getCardPoints } from '../src/engine/deck.js'
import {
  createInitialState, startHand, advanceFromDeal, applyPlayerBetAction,
  applyAIBetAction, applyDiscard, makeHandRules, PHASES,
} from '../src/engine/gameEngine.js'
import { accionesDe } from '../src/engine/pozos.js'
import { AJILEI_CONFIG } from '../src/config/ajileiConfig.js'

// ── Utilería ─────────────────────────────────────────────────────────────────

const carta = (value, palo) => ({ id: `${value}-${palo}`, value, palo, points: getCardPoints(value) })
const COMODIN = carta(7, 'Oros')

// Manos de 5 cartas con puntajes conocidos y variados.
const M5 = {
  floja:   [carta(6,'Oros'), carta(7,'Copas'), carta(2,'Espadas'), carta(3,'Bastos'), carta(4,'Oros')],   // Oros 16
  media:   [carta(1,'Oros'), carta(2,'Oros'), carta(5,'Copas'), carta(6,'Bastos'), carta(7,'Espadas')],   // Oros 21
  fuerte:  [carta(1,'Oros'), carta(2,'Oros'), carta(3,'Oros'), carta(4,'Oros'), carta(6,'Oros')],         // Oros 47
  ajilei:  [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(5,'Copas')],    // 51
  // Con comodín: Copas 1+2+3+6 = 37; +10 (N=4) = 47, +11 (N=5) = 48. NO es Ajilei.
  comodin: [COMODIN, carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(6,'Copas')],
  // El gemelo SIN comodín del mismo puntaje en N=4: Copas 1+2+3+5+10 → 11+10+10+10+... ajustado abajo.
  sinComodin47: [carta(1,'Copas'), carta(2,'Copas'), carta(3,'Copas'), carta(4,'Copas'), carta(6,'Copas')], // 47
}
const M2 = {
  floja: [carta(6,'Oros'), carta(7,'Copas')],                 // 7
  media: [carta(1,'Copas'), carta(10,'Espadas')],             // 11
  alta:  [carta(1,'Oros'), carta(10,'Oros')],                 // 21
  comodin: [COMODIN, carta(1,'Copas')],                       // 11 + comodinValue
}

function jugador(over = {}) {
  return { id: 0, isHuman: false, cards: [], chips: 1000, contrib: 0, acted: false, folded: false, ...over }
}

function estado(over = {}) {
  const numPlayers = over.numPlayers ?? 2
  const players = over.players ?? Array.from({ length: numPlayers }, (_, i) =>
    jugador({ id: i, isHuman: i === 0, cards: M5.media }))
  return {
    players, numPlayers,
    currentBet: 0, phase: 'BET_3', manoIndex: 0, pieIndex: numPlayers - 1,
    unit: 50, handCount: 3, aliveCount: numPlayers, pot: 200,
    handRules: makeHandRules(numPlayers),
    ...over,
  }
}

// Fija el reparto de perfiles para que un asiento lleve el temperamento pedido.
// Sondea con el MISMO estado que va a usar la prueba: así la llamada de la
// prueba no vuelve a disparar el re-sorteo por partida y el perfil se mantiene.
//
// SIEMPRE ANTES DE MOCKEAR `Math.random`: el sorteo de perfiles sale del mismo
// generador que los dados, así que con el mock puesto el reparto se congela y
// tres de los cuatro temperamentos se vuelven inalcanzables.
function fijarPerfil(perfil, s, asiento) {
  for (let i = 0; i < 600; i++) {
    _resetForTesting()
    decideBetAction(s, asiento)
    if (getPersonalityName(asiento) === perfil) return
  }
  throw new Error(`no salió el perfil ${perfil} en 600 sorteos`)
}

const PERFILES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

// ══ 1. TEST DE ORO — la identidad de Básico ══════════════════════════════════
// Transcripción literal de la lógica anterior a NIV-1. No se importa nada del
// módulo vivo salvo el perfil vigente: si el archivo cambia, esto no cambia.
const PERFILES_ANTES = {
  CONSERVADORA: { openMin: 32, callMin: 22, raiseMin: 40, noise: 0 },
  EQUILIBRADA:  { openMin: 28, callMin: 18, raiseMin: 34, noise: 0 },
  AGRESIVA:     { openMin: 22, callMin: 13, raiseMin: 28, noise: 0 },
  IMPREDECIBLE: { openMin: 28, callMin: 18, raiseMin: 34, noise: 0.15 },
}

function jitterAntes(value, noise) {
  if (noise === 0) return value
  return value * (1 + (Math.random() * 2 - 1) * noise)
}

function decideBetAntes(state, aiIndex, perfilName) {
  const { players, currentBet, phase, manoIndex, pieIndex, unit } = state
  const ai = players[aiIndex]
  if (ai.folded) return { action: 'pasar' }
  const { ruleN } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const { points: score } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const toCall = currentBet - ai.contrib
  if (toCall > 0 && ai.chips < toCall) return { action: 'retirarse' }
  const canAffordRaise = ai.chips >= toCall + unit
  if (isAjilei(ai.cards, ruleN)) return { action: currentBet > 0 ? 'subir' : 'apostar' }

  const profile = PERFILES_ANTES[perfilName]
  const activeOpponents = players.filter((p, i) => i !== aiIndex && !p.folded).length
  const opponentAdj = (activeOpponents - 1) * 2
  const posAdj = pieIndex === aiIndex ? -2 : (manoIndex === aiIndex ? 1 : 0)
  const openMin  = jitterAntes(profile.openMin  + opponentAdj + posAdj, profile.noise)
  const callMin  = jitterAntes(profile.callMin  + opponentAdj + posAdj, profile.noise)
  const raiseMin = jitterAntes(profile.raiseMin + opponentAdj + posAdj, profile.noise)

  if (currentBet === 0) {
    if (score >= openMin && ai.chips >= unit) return { action: 'apostar' }
    return { action: 'pasar' }
  }
  if (phase === 'BET_1') {
    if (score >= raiseMin) return canAffordRaise ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin)  return { action: 'igualar' }
    if (toCall <= unit * 2) return { action: 'igualar' }
    return { action: 'retirarse' }
  }
  if (phase === 'BET_2') {
    if (score >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin + 4) return { action: 'igualar' }
    if (score >= callMin) return toCall <= unit * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }
  if (phase === 'BET_3') {
    if (score >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin + 4) return { action: 'igualar' }
    if (score >= callMin) return toCall <= unit ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }
  return score >= callMin ? { action: 'igualar' } : { action: 'retirarse' }
}

function decideDiscardAntes(state, aiIndex) {
  const ai = state.players[aiIndex]
  const { ruleN, maxDiscard: tope } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const { palo: bestSuit } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const indices = []
  ai.cards.forEach((card, i) => {
    if (ruleN === 5 && card.palo === 'Oros' && card.value === 7) return
    if (card.palo !== bestSuit) indices.push(i)
  })
  return indices.slice(0, tope)
}

// La batería. Barre las ramas deterministas de las cuatro fases, los cuatro
// tamaños de mesa, las tres posiciones (Mano / Pie / medio), el saldo corto, el
// retirado, el bote vacío y el bote gordo.
function bateria() {
  const casos = []
  for (const numPlayers of [2, 3, 4, 5]) {
    for (const phase of ['BET_1', 'BET_2', 'BET_3', 'DISCARD']) {
      const manos = phase === 'BET_1' ? Object.values(M2) : Object.values(M5)
      for (const mano of manos) {
        for (const currentBet of [0, 50, 150]) {
          for (const pot of [0, 200, 3000]) {
            for (const chips of [30, 1000]) {
              for (const asiento of [1, numPlayers - 1]) {
                for (const folded of [false, true]) {
                  const players = Array.from({ length: numPlayers }, (_, i) => jugador({
                    id: i, isHuman: i === 0,
                    cards: i === asiento ? mano : (phase === 'BET_1' ? M2.media : M5.media),
                    chips: i === asiento ? chips : 1000,
                    contrib: i === 0 ? currentBet : 0,
                    folded: i === 2 ? folded : false,
                  }))
                  casos.push({
                    players, numPlayers, currentBet, phase, pot,
                    manoIndex: 0, pieIndex: numPlayers - 1, unit: 50,
                    handCount: 3, aliveCount: numPlayers,
                    handRules: makeHandRules(numPlayers),
                    _asiento: asiento,
                  })
                }
              }
            }
          }
        }
      }
    }
  }
  return casos
}

// ── APU-1 1c · las DOS puertas por las que el oro puede cambiar ──────────────
//
// El oro sella que Básico decide hoy lo mismo que antes de NIV-1. APU-1 no toca
// la estrategia de Básico —sus curvas siguen calibradas y sus umbrales
// intactos—, pero sí cambia las REGLAS DEL JUEGO debajo de ella, y hay estados
// de la batería donde la pregunta que se le hace ya no es la misma:
//
//   1. LA RESPUESTA DE ANTES YA NO ES LEGAL. El caso real: Ajilei en la mano y
//      la pila por debajo de la apuesta de apertura. La lógica anterior
//      devolvía `apostar` sin mirar el saldo, y el motor lo tapaba con el
//      retiro forzoso (`gameEngine.js:255-262`, retirado en 1b). Sin esa red,
//      devolver `apostar` sería devolver una acción que nadie puede aplicar.
//   2. LA PILA NO CUBRE EL PAGO. Antes se perdía lo ya apostado; desde §4.1
//      existe el all-in defensivo, y el árbitro lo ofrece en la fila. La lógica
//      transcrita NO TIENE OPINIÓN sobre el all-in porque el all-in no existía
//      cuando se transcribió: comparar ahí no es medir si Básico cambió, es
//      preguntarle por una regla que no conocía.
//
// DESDE 1c-2-iii ESTAS DOS YA NO SON PUERTAS: son ETIQUETAS.
//
// El rector re-derivó el oro al cerrar 1c-2 y lo pidió «con identidad exacta y
// sin puertas». Una puerta excusa una divergencia por su CATEGORÍA —«aquí el
// all-in existe, así que lo que salga vale»— y eso, con el tiempo, es un sello
// de goma: mientras la divergencia caiga en la categoría, cualquier cifra nueva
// pasa sin que nadie la vea. Lo que hay ahora es una FOTOGRAFÍA: cada decisión
// que se aparta de la lógica anterior a NIV-1 está escrita, una por línea, con
// su caso, su antes, su ahora, su multiplicador y su motivo. La prueba compara
// contra esa lista entera. Si una sola decisión se mueve —o aparece, o
// desaparece— el `diff` la señala con nombre y apellido.
//
// Y LA IDENTIDAD AHORA INCLUYE EL MULTIPLICADOR. Hasta 1c-2 el oro comparó sólo
// la ACCIÓN, y eso dejaba un agujero del tamaño de §6.3: una Básica que antes
// subía ×1 y ahora sube ×10 decía «subir» las dos veces y pasaba por idéntica.
// La lógica transcrita no conoce los multiplicadores —subía siempre de una
// unidad—, así que su `k` es 1 por definición y comparar contra él es legítimo.
const MOTIVOS_ORO = {
  // La respuesta de antes ya no es legal (el caso real: Ajilei con la pila por
  // debajo de la apertura; el motor lo tapaba con un retiro forzoso que 1b
  // retiró).
  ilegal: 'ilegal',
  // La pila no cubre el pago y desde §4.1 existe el all-in defensivo, que no
  // existía cuando la lógica se transcribió.
  allIn: 'allIn',
  // Misma acción, otro monto: la firma de §6.3 (R-B) y del Ajilei de §6.2.
  multiplicador: 'multiplicador',
  // Lo demás: una regla de APU-1 cambió la decisión de Básico. En 1c-2 son
  // `fraccionPozo` (§6.5) y la subida fuerte encendida (§6.3).
  regla: 'regla-APU1',
}

function motivoOro(s, asiento, antes, vivo) {
  const acciones = accionesDe({ ...s, activePlayerIndex: asiento }, asiento)
  if (vivo.action === antes.action) return MOTIVOS_ORO.multiplicador
  if (!acciones.length) return MOTIVOS_ORO.regla
  if (!acciones.includes(antes.action)) return MOTIVOS_ORO.ilegal
  if (acciones.includes('allIn')) return MOTIVOS_ORO.allIn
  return MOTIVOS_ORO.regla
}

// Una línea de la fotografía. Lleva lo justo para reproducir el caso a mano.
function lineaOro(i, caso, asiento, pasajero, perfil, chips, antes, vivo, motivo) {
  return [
    String(i).padStart(5, '0'),
    `mesa${caso.numPlayers}`,
    caso.phase.padEnd(7),
    `a${asiento}`,
    (pasajero ?? 'sinPasajero').padEnd(11),
    perfil.padEnd(12),
    `cb${String(caso.currentBet).padStart(3)}`,
    `pot${String(caso.pot).padStart(4)}`,
    `ch${String(chips).padStart(4)}`,
    `${antes.action} -> ${vivo.action} x${vivo.k ?? 1}`.padEnd(28),
    motivo,
  ].join(' ')
}

describe('1. Test de oro — Básico es idéntico a antes de NIV-1', () => {
  afterEach(() => vi.restoreAllMocks())

  // Los dados (0.6/0.7 de las subidas y el ruido ±15% de IMPREDECIBLE) se fijan
  // por mock. Tres valores: uno por debajo de ambos umbrales, uno en medio, uno
  // por encima — así se recorren los dos lados de cada rama con dado.
  it.each([0.05, 0.5, 0.95])('Math.random=%s · decideBetAction sin pasajero y con `basico`', async (dado) => {
    _resetForTesting()                       // el farol por bloques es memoria
    vi.spyOn(Math, 'random').mockReturnValue(dado)
    const casos = bateria()
    expect(casos.length).toBeGreaterThan(1500)
    let comparados = 0
    const porMotivo = {}
    const lineas = []
    let i = -1
    for (const caso of casos) {
      const asiento = caso._asiento
      for (const pasajero of [undefined, 'basico']) {
        i++
        const s = pasajero === undefined ? caso : { ...caso, nivelIA: pasajero }
        const vivo = decideBetAction(s, asiento)
        const perfil = getPersonalityName(asiento)
        const antes = decideBetAntes(s, asiento, perfil)
        if (vivo.action === antes.action && (vivo.k ?? 1) === 1) { comparados++; continue }
        const motivo = motivoOro(s, asiento, antes, vivo)
        porMotivo[motivo] = (porMotivo[motivo] ?? 0) + 1
        lineas.push(lineaOro(i, caso, asiento, pasajero, perfil,
          s.players[asiento].chips, antes, vivo, motivo))
      }
    }
    // La inmensa mayoría de la batería sigue saliendo IDÉNTICA a la lógica
    // anterior a NIV-1, acción y monto. Si eso dejara de ser cierto, Básico
    // habría dejado de ser Básico.
    expect(comparados + lineas.length).toBe(casos.length * 2)
    expect(comparados / (casos.length * 2)).toBeGreaterThan(0.6)

    // Y lo que NO sale idéntico está sellado una por una, con su motivo.
    const cabecera = [
      `# ORO DE BÁSICO · APU-1 1c-2-iii · Math.random = ${dado}`,
      `# ${casos.length * 2} decisiones · ${comparados} idénticas a la lógica anterior a NIV-1 · ${lineas.length} cambiadas`,
      `# por motivo: ${Object.entries(porMotivo).sort().map(([k, n]) => `${k}=${n}`).join(' · ')}`,
      '#',
    ]
    await expect(cabecera.concat(lineas).join('\n') + '\n')
      .toMatchFileSnapshot(`oro/nivel1_basico_${dado}.txt`)
  })

  // ══ APU-1 1c-2 §2.5 · LA CONTABILIDAD DEL ORO (D-22) ════════════════
  //
  // Nació como recibo provisional: entre STOP-1 y STOP-3 el oro estuvo rojo por
  // decisión del rector, y esta prueba afirmaba lo único que podía afirmarse sin
  // re-derivar nada —que la MÁQUINA nueva no mueve el oro, que lo mueven las
  // CIFRAS—. El rector decidió en STOP-2 (D-22) que se quedara después de
  // sellar, apuntando ya a las cifras selladas. Esto es eso.
  //
  // QUÉ AFIRMA AHORA. Con `ajileiConfig.js` devuelto a los valores de 1d —mapa
  // plano, Básico neutro, sin piso, sin R-D— toda decisión que las cifras de
  // 1c-2 habían movido VUELVE a ser idéntica a la lógica anterior a NIV-1, y no
  // aparece ninguna nueva. Es decir: R-A, R-B y R-D son retrocompatibles, y todo
  // lo que el oro re-derivado consigna sale de las CIFRAS, no del código. Si
  // alguna vez dejara de cumplirse, sería un fallo de verdad.
  //
  // Lo que NO vuelve al oro al revertir son las divergencias de LEGALIDAD —la
  // respuesta de antes ya no es legal, o existe el all-in defensivo—: ésas son
  // de APU-1 1b, viven en las dos configuraciones por igual y se cancelan solas
  // en la resta.
  //
  // Y atribuye: cuántas decisiones devuelve al oro cada cifra por separado.
  const CIFRAS_1D = {
    'porMesa plano (R-B en su forma vieja)':
      (ia) => { ia.subidaFuerte.porMesa = { 2: 41, 3: 40, 4: 36, 5: 33 } },
    'subidaFuerte.porReto.basico = false':
      (ia) => { ia.subidaFuerte.porReto.basico = false },
    'fraccionPozo.basico = null':
      (ia) => { ia.fraccionPozo.basico = null },
    'farol.bloquePorReto.basico = null':
      (ia) => { ia.farol.bloquePorReto.basico = null },
    'sin farol.pisoPuntajePorMesa (R-A)':
      (ia) => { delete ia.farol.pisoPuntajePorMesa },
    'sin soloContraHumano (R-D)':
      (ia) => { delete ia.soloContraHumano },
  }

  it.each([0.05, 0.5, 0.95])(
    'Math.random=%s · revertir a las cifras de 1d devuelve al oro lo que ellas movieron, y la tanda lo atribuye',
    async (dado) => {
      const casos = bateria()
      const ORIGINAL = structuredClone(AJILEI_CONFIG.ia)

      // Una corrida entera de la batería con la configuración que haya puesta.
      // Se recorre EN EL MISMO ORDEN que el oro y sin reiniciar entre casos: el
      // farol por bloques es memoria de partida, así que una decisión aislada
      // no reproduce el estado en que el oro la tomó.
      const corrida = () => {
        _resetForTesting()
        vi.spyOn(Math, 'random').mockReturnValue(dado)
        const filas = []
        for (const caso of casos) {
          const asiento = caso._asiento
          for (const pasajero of [undefined, 'basico']) {
            const s = pasajero === undefined ? caso : { ...caso, nivelIA: pasajero }
            const vivo   = decideBetAction(s, asiento)
            const perfil = getPersonalityName(asiento)
            const antes  = decideBetAntes(s, asiento, perfil)
            filas.push(vivo.action === antes.action && (vivo.k ?? 1) === 1)
          }
        }
        vi.restoreAllMocks()
        return filas
      }

      try {
        const conNuevo = corrida()

        // (1) LO QUE IMPORTA: al revertir las cifras, todo lo que ellas movieron
        //     vuelve al oro, y no aparece NINGUNA divergencia nueva.
        for (const revertir of Object.values(CIFRAS_1D)) revertir(AJILEI_CONFIG.ia)
        const conViejo = corrida()
        const recuperadas = conViejo.reduce((a, ok, i) => a + (ok && !conNuevo[i] ? 1 : 0), 0)
        const nuevas      = conViejo.reduce((a, ok, i) => a + (!ok && conNuevo[i] ? 1 : 0), 0)
        expect(nuevas,
          'revertir a las cifras de 1d ha CREADO divergencias: R-A, R-B o R-D ' +
          'han dejado de ser retrocompatibles').toBe(0)

        // (2) Y las cifras movieron algo: si no, la batería no mediría nada.
        expect(recuperadas).toBeGreaterThan(0)

        // (3) ATRIBUCIÓN, por dos caminos, porque ninguno solo dice la verdad
        //     entera.
        //
        //     SOLA: cada cifra revertida por su cuenta, con las demás en su
        //     valor sellado. Es la lectura natural —«cuántas decisiones mueve
        //     esta cifra»— pero NO suma: dos cifras pueden explicar la misma
        //     decisión, y otras sólo hacen efecto acompañadas. El caso real es
        //     `porMesa`: revertirlo solo, con la subida fuerte aún encendida, no
        //     devuelve una sola decisión al oro —cambia el umbral, no lo apaga—.
        //
        //     MARGINAL: las cifras se revierten ACUMULANDO en un orden fijo, y a
        //     cada una se le apunta lo que añade sobre las anteriores. Suma
        //     exactamente lo recuperado, por construcción, a cambio de depender
        //     del orden. Es la que se puede sellar.
        const porRegla = {}
        for (const [nombre, revertir] of Object.entries(CIFRAS_1D)) {
          AJILEI_CONFIG.ia = structuredClone(ORIGINAL)
          revertir(AJILEI_CONFIG.ia)
          const filas = corrida()
          porRegla[nombre] = filas.reduce(
            (a, ok, i) => a + (ok && !conNuevo[i] ? 1 : 0), 0)
        }

        const marginal = {}
        AJILEI_CONFIG.ia = structuredClone(ORIGINAL)
        let acumulado = conNuevo
        for (const [nombre, revertir] of Object.entries(CIFRAS_1D)) {
          revertir(AJILEI_CONFIG.ia)
          const filas = corrida()
          marginal[nombre] = filas.reduce(
            (a, ok, i) => a + (ok && !acumulado[i] ? 1 : 0), 0)
          acumulado = filas
        }
        const suma = Object.values(marginal).reduce((a, n) => a + n, 0)
        expect(suma, `la atribución marginal no cuadra: ${JSON.stringify(marginal)}`)
          .toBe(recuperadas)

        // Sellado, para que el informe lo cite y para que nadie mueva una cifra
        // sin que se vea cuántas decisiones de Básico se lleva por delante.
        const ancho = Math.max(...Object.keys(CIFRAS_1D).map(k => k.length))
        await expect([
          `# CONTABILIDAD DEL ORO DE BÁSICO · APU-1 1c-2-iii · Math.random = ${dado}`,
          `# ${conNuevo.length} decisiones · ${recuperadas} las mueven las cifras de 1c-2`,
          '#',
          '# cifra revertida'.padEnd(ancho + 2) + '  sola  marginal',
          ...Object.keys(CIFRAS_1D).map(k =>
            `  ${k.padEnd(ancho)}  ${String(porRegla[k]).padStart(4)}  ${String(marginal[k]).padStart(8)}`),
          `  ${'TOTAL'.padEnd(ancho)}  ${String(Object.values(porRegla).reduce((a, n) => a + n, 0)).padStart(4)}  ${String(suma).padStart(8)}`,
        ].join('\n') + '\n').toMatchFileSnapshot(`oro/nivel1_atribucion_${dado}.txt`)
      } finally {
        AJILEI_CONFIG.ia = ORIGINAL
        vi.restoreAllMocks()
        _resetForTesting()
      }
    })

  it('decideDiscard sin pasajero y con `basico`: mismos índices', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    for (const numPlayers of [2, 3, 4, 5]) {
      for (const mano of Object.values(M5)) {
        const s = estado({
          numPlayers, phase: 'DISCARD',
          players: Array.from({ length: numPlayers }, (_, i) => jugador({ id: i, isHuman: i === 0, cards: mano })),
        })
        for (const pasajero of [undefined, 'basico']) {
          const conNivel = pasajero === undefined ? s : { ...s, nivelIA: pasajero }
          expect(decideDiscard(conNivel, 1)).toEqual(decideDiscardAntes(conNivel, 1))
        }
      }
    }
  })

  it('un nivel desconocido cae a Básico (contrato del pasajero, rector §2.2)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const s = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 150, pot: 200 })
    _resetForTesting()
    const base = decideBetAction(s, 1)
    for (const basura of ['PRO', 'experto', '', null, 3, {}]) {
      expect(decideBetAction({ ...s, nivelIA: basura }, 1).action).toBe(base.action)
    }
  })
})

// ══ 2. Despacho de nivel ═════════════════════════════════════════════════════
describe('2. Despacho de nivel', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  it('Pro hereda las capacidades de Avanzado (hermanas mayores, rector §5.5)', () => {
    // Mesa 4: el comodín está activo y Básico NO lo protege. Avanzado y Pro sí.
    const s = estado({
      numPlayers: 4, phase: 'DISCARD',
      players: Array.from({ length: 4 }, (_, i) => jugador({ id: i, isHuman: i === 0, cards: M5.comodin })),
    })
    const pos = M5.comodin.findIndex(c => c.palo === 'Oros' && c.value === 7)
    expect(decideDiscard({ ...s, nivelIA: 'basico' }, 1)).toContain(pos)
    expect(decideDiscard({ ...s, nivelIA: 'avanzado' }, 1)).not.toContain(pos)
    expect(decideDiscard({ ...s, nivelIA: 'pro' }, 1)).not.toContain(pos)
  })

  it('el pasajero NO se muta: la decisión no escribe en el estado', () => {
    const s = estado({ numPlayers: 4, phase: 'BET_3', currentBet: 50, nivelIA: 'avanzado' })
    const copia = JSON.parse(JSON.stringify(s))
    decideBetAction(s, 1)
    decideDiscard(s, 1)
    expect(JSON.parse(JSON.stringify(s))).toEqual(copia)
  })
})

// ══ 3. Las curvas de fuerza son MEDIDAS ══════════════════════════════════════
describe('3. Curvas de fuerza', () => {
  it('la curva de mano definitiva coincide con la enumeración exacta de C(40,5)', () => {
    // Enumeración completa: 658.008 manos. Se compara contra lo escrito en
    // aiPlayer.js — si alguien mueve una cifra a mano, esto discrepa.
    const paloDe = [], puntos = []
    for (const p of PALOS) for (const v of VALORES) { paloDe.push(PALOS.indexOf(p)); puntos.push(getCardPoints(v)) }
    const n = paloDe.length
    expect(n).toBe(40)

    const cuenta = new Map()
    let total = 0
    const suma = [0, 0, 0, 0]
    for (let a = 0; a < n - 4; a++) {
      suma[paloDe[a]] += puntos[a]
      for (let b = a + 1; b < n - 3; b++) {
        suma[paloDe[b]] += puntos[b]
        for (let c = b + 1; c < n - 2; c++) {
          suma[paloDe[c]] += puntos[c]
          for (let d = c + 1; d < n - 1; d++) {
            suma[paloDe[d]] += puntos[d]
            for (let e = d + 1; e < n; e++) {
              suma[paloDe[e]] += puntos[e]
              const mejor = Math.max(suma[0], suma[1], suma[2], suma[3])
              cuenta.set(mejor, (cuenta.get(mejor) ?? 0) + 1)
              total++
              suma[paloDe[e]] -= puntos[e]
            }
            suma[paloDe[d]] -= puntos[d]
          }
          suma[paloDe[c]] -= puntos[c]
        }
        suma[paloDe[b]] -= puntos[b]
      }
      suma[paloDe[a]] -= puntos[a]
    }
    expect(total).toBe(658008)

    const { CURVA_FINAL } = _CURVAS_PARA_TEST
    const maximo = Math.max(...cuenta.keys())
    expect(CURVA_FINAL.desde + CURVA_FINAL.q.length - 1).toBe(maximo)
    let acum = 0
    for (let s = 0; s <= maximo; s++) {
      const c = cuenta.get(s) ?? 0
      const q = (acum + 0.5 * c) / total
      acum += c
      if (s < CURVA_FINAL.desde) { expect(q).toBe(0); continue }
      expect(CURVA_FINAL.q[s - CURVA_FINAL.desde]).toBeCloseTo(q, 3)
    }
  })

  it('las tablas intermedias respetan sus invariantes de forma', () => {
    const { TABLA_BET_1, TABLA_BET_2 } = _CURVAS_PARA_TEST
    for (const tabla of [TABLA_BET_1, TABLA_BET_2]) {
      expect(tabla.k).toHaveLength(4)                      // k = 1..4 rivales
      const largo = tabla.k[0].length
      for (const fila of tabla.k) {
        expect(fila).toHaveLength(largo)
        fila.forEach(v => { expect(v).toBeGreaterThan(0); expect(v).toBeLessThanOrEqual(1) })
      }
      // Más rivales, menos equidad — en TODOS los puntajes, sin excepción.
      for (let k = 1; k < 4; k++) {
        for (let i = 0; i < largo; i++) {
          expect(tabla.k[k][i]).toBeLessThan(tabla.k[k - 1][i])
        }
      }
      // El mejor puntaje de la tabla es el de mayor equidad en cada columna.
      for (const fila of tabla.k) expect(fila[largo - 1]).toBe(Math.max(...fila))
    }
    // A dos cartas la fuerza casi no separa: es el hallazgo que obligó a medir
    // por k en vez de elevar una curva. Si esto dejara de cumplirse, la tabla
    // de BET_1 ya no describe lo que su comentario dice que describe.
    const b1 = TABLA_BET_1.k[0]
    expect(Math.max(...b1) - Math.min(...b1)).toBeLessThan(0.35)
  })
})

// ══ 4. ③ Comodín en el DESCARTE ══════════════════════════════════════════════
describe('4. ③ Comodín · descarte', () => {
  beforeEach(() => _resetForTesting())

  const conMano = (numPlayers, cards) => estado({
    numPlayers, phase: 'DISCARD',
    players: Array.from({ length: numPlayers }, (_, i) => jugador({ id: i, isHuman: i === 0, cards })),
  })
  const posComodin = M5.comodin.findIndex(c => c.palo === 'Oros' && c.value === 7)

  it('N=4: Básico TIRA el comodín (punto ciego declarado, rector §5.1)', () => {
    expect(decideDiscard({ ...conMano(4, M5.comodin), nivelIA: 'basico' }, 1)).toContain(posComodin)
  })

  it('N=4: Avanzado lo PROTEGE — la corrección del punto ciego', () => {
    expect(decideDiscard({ ...conMano(4, M5.comodin), nivelIA: 'avanzado' }, 1)).not.toContain(posComodin)
  })

  it('N=5: los dos lo protegen (ahí Básico ya acertaba)', () => {
    for (const nivel of ['basico', 'avanzado']) {
      expect(decideDiscard({ ...conMano(5, M5.comodin), nivelIA: nivel }, 1)).not.toContain(posComodin)
    }
  })

  it.each([2, 3])('N=%s: sin comodín en la mesa, el 7 de Oros es carta normal en los dos niveles', (numPlayers) => {
    const s = conMano(numPlayers, M5.comodin)
    expect(s.handRules.comodinValue).toBeNull()
    // Mejor palo Copas; el 7 de Oros no es de ese palo → se descarta en ambos.
    for (const nivel of ['basico', 'avanzado']) {
      expect(decideDiscard({ ...s, nivelIA: nivel }, 1)).toContain(posComodin)
    }
  })

  it('Avanzado lee `handRules.comodinValue`, no el número 5: respeta el tope de descarte', () => {
    for (const numPlayers of [4, 5]) {
      const s = conMano(numPlayers, [COMODIN, carta(1,'Copas'), carta(2,'Espadas'), carta(3,'Bastos'), carta(4,'Copas')])
      const idx = decideDiscard({ ...s, nivelIA: 'avanzado' }, 1)
      expect(idx.length).toBeLessThanOrEqual(s.handRules.maxDiscard)
      expect(idx).not.toContain(0)   // el comodín nunca
    }
  })
})

// ══ 5. ③ Comodín en la APUESTA ═══════════════════════════════════════════════
// «Un 47-con-comodín ≠ un 47-sin» (rector §5.2). Las dos manos valen lo mismo en
// el showdown; lo que las separa es que la primera se lleva la amenaza puesta.
describe('5. ③ Comodín · apuesta', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  function mesaCon(cards, over = {}) {
    return estado({
      numPlayers: 4, phase: 'BET_3', currentBet: 400, pot: 300,
      players: Array.from({ length: 4 }, (_, i) => jugador({
        id: i, isHuman: i === 0, cards: i === 1 ? cards : M5.media,
        contrib: i === 0 ? 400 : 0,
      })),
      ...over,
    })
  }

  it('mismo puntaje (47), decisión distinta según de dónde salgan los puntos', () => {
    const conC = mesaCon(M5.comodin)
    const sinC = mesaCon(M5.sinComodin47)
    // Los dos puntajes son 47 en mesa 4 — el gemelo exacto que pide el rector.
    const pts = (s) => getBestSuitScore(s.players[1].cards, 4, true).points
    expect(pts(conC)).toBe(47)
    expect(pts(sinC)).toBe(47)

    fijarPerfil('CONSERVADORA', { ...conC, nivelIA: 'avanzado' }, 1)   // raiseMin 44
    vi.spyOn(Math, 'random').mockReturnValue(0.5)                      // el dado deja subir

    // CAMBIO DE VEREDICTO (APU-1 1c, A-3). La subida fuerte de §6.3 pone el
    // listón de mesa 4 en 36 (+2 de CONSERVADORA = 38), por DEBAJO de los dos
    // puntajes de este gemelo: el 47 y el 42-efectivo suben los dos, y aquí ③
    // deja de decidir. No ha muerto —sigue moviendo `scoreEf` exactamente
    // `comodinValue` puntos, y eso se sella en §3 y en la prueba de abajo—; lo
    // que pasó es que la regla nueva puso su bar por debajo del gemelo entero.
    // Mover el gemelo para que volviera a straddlear sería re-derivar la prueba
    // con el mismo agente que movió el código, que es justo lo que no se hace.
    expect(decideBetAction({ ...conC, nivelIA: 'avanzado' }, 1).action).toBe('subir')
    expect(decideBetAction({ ...sinC, nivelIA: 'avanzado' }, 1).action).toBe('subir')

    // Básico no distingue: para él los dos 47 son el mismo 47, y sube en ambos.
    expect(decideBetAction({ ...conC, nivelIA: 'basico' }, 1).action).toBe('subir')
    expect(decideBetAction({ ...sinC, nivelIA: 'basico' }, 1).action).toBe('subir')
  })

  it('la amenaza es EXACTAMENTE `comodinValue`: apagarlo devuelve la decisión de Básico', () => {
    // Aislamiento puro: mismo estado, misma mano, mismo todo. Lo único que
    // cambia es el renglón `comodinValue` del snapshot de la mano. La mano no
    // lleva el 7 de Oros, así que su puntaje es 47 en los dos casos.
    const apagado = mesaCon(M5.sinComodin47, { handRules: { ruleN: 4, comodinValue: null, maxDiscard: 5 } })
    const activo  = mesaCon(M5.sinComodin47, { handRules: { ruleN: 4, comodinValue: 10,   maxDiscard: 5 } })
    expect(getBestSuitScore(apagado.players[1].cards, 4, false).points).toBe(47)
    expect(getBestSuitScore(activo.players[1].cards, 4, true).points).toBe(47)

    fijarPerfil('CONSERVADORA', { ...apagado, nivelIA: 'avanzado' }, 1)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // Mismo cambio de veredicto que arriba: con §6.3 en vigor los dos suben.
    expect(decideBetAction({ ...apagado, nivelIA: 'avanzado' }, 1).action).toBe('subir')
    expect(decideBetAction({ ...activo,  nivelIA: 'avanzado' }, 1).action).toBe('subir')
  })

  // DÓNDE QUEDÓ ③ DESPUÉS DE APU-1, medido y declarado (hallazgo de 1c):
  //
  // La amenaza del comodín sigue restando exactamente `comodinValue` puntos a
  // `scoreEf` —lo derivan y lo comparan las curvas de §3—, pero con las cifras
  // de TRABAJO de §6.3 esa resta ya no cambia ninguna ACCIÓN en las mesas
  // grandes: el listón de subida fuerte (36 en mesa 4, 33 en mesa 5) queda por
  // debajo del `raiseMin` de los cuatro temperamentos (40..44 con el `+2` por
  // rival), así que cualquier mano que antes distinguía las dos versiones del
  // gemelo hoy las sube las dos. Ni en `BET_1` se ve: con dos cartas el máximo
  // es 21 y el tramo que mira el puntaje empieza en 26.
  //
  // El propio normativo §6.3 lo deja abierto —«no es contradicción (abrir no es
  // subir fuerte), pero la simulación decide la relación entre ambos»—, y es
  // 1d quien la decide. Se escribe aquí para que la próxima tanda no crea que
  // ③ se perdió por descuido: está viva en el puntaje y tapada en la acción.
})

// ══ 6. ④ Disciplina de bote ══════════════════════════════════════════════════
describe('6. ④ Disciplina de bote', () => {
  beforeEach(() => _resetForTesting())
  afterEach(() => vi.restoreAllMocks())

  // Mesa 2 para que el listón no lleve `opponentAdj` y la aritmética se lea sola.
  function duelo({ cards, pot, currentBet, phase = 'BET_3' }) {
    return estado({
      numPlayers: 2, phase, pot, currentBet,
      players: [
        jugador({ id: 0, isHuman: true, cards: M5.media, contrib: currentBet }),
        jugador({ id: 1, cards, contrib: 0 }),
      ],
    })
  }

  // CAMBIO DE VEREDICTO (APU-1 1c-2, §2.1). Hasta 1d el contraste era real:
  // `fraccionPozo.basico` valía `null`, así que Básico se iba y Avanzado se
  // quedaba. La ficha 1c-2 le da a Básico su propia fracción —era el único
  // mando que metía V4 de Básico en rango en las cuatro mesas (informe 1d,
  // D.8)— y los dos retos coinciden. LA CONDUCTA DE AVANZADO NO SE HA MOVIDO:
  // lo que cambió es que Básico dejó de ser el negativo de esta prueba.
  //
  // Lo que el paso 7 sigue sin mirar, y es lo que esta prueba sella: las
  // cartas. Se paga por barato, no por bueno.
  it('odds a favor: bote gordo y precio barato → los TRES retos se quedan', () => {
    // Puntaje 21 (equidad 0,569 contra un rival) frente a un precio de
    // 150/3150 = 4,8%.
    const s = duelo({ cards: M5.media, pot: 3000, currentBet: 150 })
    fijarPerfil('CONSERVADORA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action).toBe('igualar')
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action).toBe('igualar')
  })

  it('odds en contra: bote flaco y precio caro → decide el temperamento, no la equidad', () => {
    // CAMBIO DE VEREDICTO (APU-1 1c, A-4 · normativo §6.5). Puntaje 16 frente a
    // un precio de 600/700 = 86%. Avanzado se retiraba aquí porque la equidad
    // no cubría el precio; §6.5 retira esa matemática COMO CRITERIO DE PAGO y
    // deja una sola cifra: barato respecto al pozo se paga sin mirar cartas, y
    // caro se decide por el listón del temperamento. 600 no es ≤ ¼ de 100, así
    // que cae al listón — y ahí un 16 supera el `callMin + 4` de AGRESIVA, como
    // en Básico. Los dos retos coinciden, y esa coincidencia es el efecto.
    const s = duelo({ cards: M5.floja, pot: 100, currentBet: 600 })
    fijarPerfil('AGRESIVA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action).toBe('igualar')
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action).toBe('igualar')
  })

  // CAMBIO DE VEREDICTO (APU-1 1c-2, §2.1). Igual que arriba: con su propia
  // `fraccionPozo`, Básico tampoco regala ya una mano que puede quedarse gratis.
  it('quedarse GRATIS nunca se cambia por un retiro, en ningún reto', () => {
    // toCall = 0: la apuesta ya está cubierta. Retirarse ahí es regalar la mano
    // sin que nadie la cobre —que es lo que Básico hacía hasta 1d—.
    //
    // CAMBIO DE VEREDICTO (APU-1 1c, A-4 y §3.2 de `pozos.js`): la acción se
    // llama `pasar`, no `igualar`. Sin apuesta viva que igualar, `igualar` es
    // ilegal (`sin_apuesta`) — hasta 1b el nombre equivocado lo tapaba el
    // puente del motor, que E-12 retiró. La conducta es la misma: quedarse.
    const s = estado({
      numPlayers: 2, phase: 'BET_3', pot: 500, currentBet: 100,
      players: [
        jugador({ id: 0, isHuman: true, cards: M5.media, contrib: 100 }),
        jugador({ id: 1, cards: M5.floja, contrib: 100 }),
      ],
    })
    fijarPerfil('CONSERVADORA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action).toBe('pasar')
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action).toBe('pasar')
  })

  it('sin bote no hay matemática de bote: cae al listón de Básico', () => {
    const s = duelo({ cards: M5.floja, pot: 0, currentBet: 600 })
    fijarPerfil('AGRESIVA', { ...s, nivelIA: 'avanzado' }, 1)
    expect(decideBetAction({ ...s, nivelIA: 'avanzado' }, 1).action)
      .toBe(decideBetAction({ ...s, nivelIA: 'basico' }, 1).action)
  })

  it('no se retira una mano ganadora ante un rival que sólo iguala (partida completa)', () => {
    // Rival pasivo: nunca sube. La IA con mano fuerte no puede irse jamás.
    vi.restoreAllMocks()
    _resetForTesting()
    const nuevaPartida = () => ({ ...createInitialState(50, 2), nivelIA: 'avanzado' })
    let s = nuevaPartida()
    let retiros = 0, manos = 0
    for (let h = 0; h < 60; h++) {
      s = startHand(s)
      // APU-1 1c · la subida fuerte vacía las pilas mucho más rápido, así que un
      // duelo se acaba antes de las 60 manos. Se abre otro: lo que la prueba
      // mide es que la IA no suelte una mano ganadora, no cuánto dura una mesa.
      if (s.phase === PHASES.GAME_OVER) s = startHand(nuevaPartida())
      s = advanceFromDeal(s)
      const jugarRonda = (fase) => {
        let n = 0
        while (s.phase === fase) {
          if (++n > 500) throw new Error('ronda sin converger')
          if (s.activePlayerIndex === 0) {
            // APU-1 §4.1 · el conductor pasivo tiene que poder responder a una
            // subida que no cubre: la respuesta es el all-in, no una `igualar`
            // ilegal que el motor ya no reescribe (E-12) y que dejaría la ronda
            // dando vueltas.
            const toCall = s.currentBet - s.players[0].contrib
            const accion = toCall > 0
              ? (s.players[0].chips >= toCall ? 'igualar' : 'allIn')
              : 'pasar'
            s = applyPlayerBetAction(s, accion)
          } else {
            const antes = s.players[1].folded
            const fuerte = getBestSuitScore(s.players[1].cards, s.handRules.ruleN,
              s.handRules.comodinValue !== null).points >= 40
            s = applyAIBetAction(s)
            if (!antes && s.players[1].folded && fuerte) retiros++
          }
        }
      }
      jugarRonda(PHASES.BET_1)
      if (s.phase !== PHASES.PAYOUT) {
        s = advanceFromDeal(s); jugarRonda(PHASES.BET_2)
        if (s.phase !== PHASES.PAYOUT) {
          s = applyDiscard(s, []); jugarRonda(PHASES.BET_3)
        }
      }
      manos++
    }
    expect(manos).toBeGreaterThan(20)
    expect(retiros).toBe(0)
  })
})

// ══ 7. Rider §4 · re-sorteo por PARTIDA, por la vía alcanzable ═══════════════
describe('7. Re-sorteo de perfiles por partida', () => {
  beforeEach(() => _resetForTesting())

  // Juega una partida entera por la API pública y devuelve el reparto observado.
  function jugarPartida(numPlayers, topeManos = 40) {
    let s = createInitialState(50, numPlayers)
    const repartos = new Set()
    for (let h = 0; h < topeManos; h++) {
      s = startHand(s)
      if (s.phase === PHASES.GAME_OVER) break
      s = advanceFromDeal(s)
      const ronda = (fase) => {
        let n = 0
        while (s.phase === fase) {
          if (++n > 500) throw new Error('ronda sin converger')
          if (s.players[s.activePlayerIndex].folded || s.activePlayerIndex === 0) {
            // APU-1 §4.1: si el humano no cubre lo que falta, ya no hay retiro
            // forzoso — la acción de pago es el all-in. El conductor de la
            // prueba lo refleja; el veredicto de la prueba no cambia.
            const toCall = s.currentBet - (s.players[0].contrib ?? 0)
            const cubre  = s.players[0].chips >= toCall
            const accion = toCall > 0 ? (cubre ? 'igualar' : 'allIn') : 'pasar'
            s = s.activePlayerIndex === 0
              ? applyPlayerBetAction(s, accion)
              : applyAIBetAction(s)
          } else {
            s = applyAIBetAction(s)
          }
        }
        repartos.add(Array.from({ length: numPlayers }, (_, i) => getPersonalityName(i)).join('|'))
      }
      ronda(PHASES.BET_1)
      if (s.phase === PHASES.PAYOUT) continue
      s = advanceFromDeal(s); ronda(PHASES.BET_2)
      if (s.phase === PHASES.PAYOUT) continue
      s = applyDiscard(s, []); ronda(PHASES.BET_3)
    }
    return repartos
  }

  it('DENTRO de una partida el reparto no se mueve — ni una sola vez en 40 manos', () => {
    for (const numPlayers of [2, 3, 4, 5]) {
      _resetForTesting()
      const repartos = jugarPartida(numPlayers)
      expect(repartos.size).toBe(1)
    }
  })

  it('ENTRE partidas se re-reparte — por la vía que ocurre en vivo, sin estados sintéticos', () => {
    // 30 partidas de mesa 5: si el detector no disparara, el reparto sería el
    // mismo en las 30. La probabilidad de que 30 sorteos independientes de 4!
    // permutaciones coincidan es (1/24)^29: cero a efectos prácticos.
    _resetForTesting()
    const vistos = new Set()
    for (let p = 0; p < 30; p++) {
      for (const r of jugarPartida(5, 3)) vistos.add(r)
    }
    expect(vistos.size).toBeGreaterThan(1)
  })

  it('la rama vieja (`handCount === 0`) ya no hace falta: el detector la cubre', () => {
    // Un estado sintético con el contador en 0 sigue disparando el re-sorteo,
    // porque el contador RETROCEDE. Lo que cambia es que ahora no es el único
    // camino — y el que sí ocurre en vivo es el de la prueba anterior.
    _resetForTesting()
    const s = estado({ numPlayers: 3, phase: 'BET_1', handCount: 7, currentBet: 50 })
    decideBetAction(s, 1)
    const antes = [getPersonalityName(1), getPersonalityName(2)].join('|')
    expect(antes).not.toContain('null')
    decideBetAction({ ...s, handCount: 0 }, 1)
    expect([getPersonalityName(1), getPersonalityName(2)].join('|')).not.toContain('null')
  })

  it('cambiar el tamaño de mesa re-reparte (comportamiento conservado)', () => {
    _resetForTesting()
    decideBetAction(estado({ numPlayers: 3, phase: 'BET_1', currentBet: 50 }), 1)
    expect(getPersonalityName(3)).toBeNull()
    decideBetAction(estado({ numPlayers: 5, phase: 'BET_1', currentBet: 50 }), 1)
    expect(PERFILES).toContain(getPersonalityName(3))
  })
})

// ══ 8. D-5 · trampa Proxy extendida a TODAS las ramas de Avanzado ════════════
// Puerta obligatoria del rector §2.1(b): ninguna capacidad nueva entra sin
// ampliar la vigilancia a los datos que introduce. Esta tanda introduce lectura
// de `pot` y de los `contrib` ajenos —ambos públicos— y NADA más: en particular
// `state.deck` sigue sin tocarse (la aritmética del taco es ② de Pro, NIV-2).
describe('8. D-5 · aislamiento de información en Avanzado', () => {
  beforeEach(() => _resetForTesting())

  function trampaJugador(over = {}) {
    const base = jugador({ ...over, __cardsAccessed: false })
    return new Proxy(base, {
      get(target, prop) {
        if (prop === 'cards') base.__cardsAccessed = true
        return target[prop]
      },
    })
  }

  // Estado con `deck` instrumentado: cualquier lectura queda marcada, se indexe
  // o no. Avanzado no puede tocarlo ni para leer su longitud.
  function conTrampaDeMazo(s) {
    const marca = { leido: false, indexado: false }
    const mazo = new Proxy([carta(1, 'Oros'), carta(2, 'Copas')], {
      get(target, prop) {
        if (prop !== Symbol.toPrimitive) marca.indexado = true
        return target[prop]
      },
    })
    Object.defineProperty(s, 'deck', { get() { marca.leido = true; return mazo }, configurable: true })
    return marca
  }

  // Este bloque vigila AVANZADO, que no toca `state.deck` ni para su longitud.
  // Pro salió de aquí en NIV-2 y no por rebajarle el listón: su frontera es más
  // fina —puede leer `.length` y jamás el contenido— y necesita una trampa que
  // distinga las dos cosas, que es la de `scripts/testNivel2.test.js` §8. Allí
  // se le exige MÁS que aquí: los dos lados de la frontera, no sólo uno.
  for (const numPlayers of [2, 3, 4, 5]) {
    for (const nivel of ['avanzado']) {
      it(`N=${numPlayers} · ${nivel}: ninguna rama lee cartas ajenas ni el mazo`, () => {
        const fases = [
          { phase: 'BET_1', currentBet: 0,   cards: M2.alta,    pot: 200 },
          { phase: 'BET_1', currentBet: 50,  cards: M2.floja,   pot: 200 },
          { phase: 'BET_2', currentBet: 300, cards: M5.floja,   pot: 100 },
          { phase: 'BET_2', currentBet: 50,  cards: M5.fuerte,  pot: 900 },
          { phase: 'BET_3', currentBet: 400, cards: M5.media,   pot: 300 },
          { phase: 'BET_3', currentBet: 50,  cards: M5.comodin, pot: 900 },
          { phase: 'BET_3', currentBet: 50,  cards: M5.ajilei,  pot: 900 },
          { phase: 'DISCARD', currentBet: 0, cards: M5.comodin, pot: 500 },
        ]
        for (const f of fases) {
          for (const asiento of [1, numPlayers - 1]) {
            const trampas = []
            const players = Array.from({ length: numPlayers }, (_, i) => {
              if (i === asiento) return jugador({ id: i, cards: f.cards, contrib: 0 })
              const t = trampaJugador({ id: i, isHuman: i === 0, cards: M5.fuerte, contrib: i === 0 ? f.currentBet : 0 })
              trampas.push(t)
              return t
            })
            const s = {
              players, numPlayers, currentBet: f.currentBet, phase: f.phase, pot: f.pot,
              manoIndex: 0, pieIndex: numPlayers - 1, unit: 50,
              handCount: 4, aliveCount: numPlayers,
              handRules: makeHandRules(numPlayers), nivelIA: nivel,
            }
            const mazo = conTrampaDeMazo(s)

            if (f.phase === 'DISCARD') decideDiscard(s, asiento)
            else decideBetAction(s, asiento)

            trampas.forEach(t => expect(t.__cardsAccessed).toBe(false))
            expect(mazo.leido).toBe(false)
            expect(mazo.indexado).toBe(false)
          }
        }
      })
    }
  }

  it('lo que SÍ puede leer (público) queda declarado y EJERCIDO: pot y contrib ajenos', () => {
    // Prueba de contraste. Si Avanzado no leyera `pot` y los `contrib` ajenos,
    // la decisión no podría cambiar al moverlos con todo lo demás quieto.
    // Cambia en las dos direcciones — luego los lee, y sólo eso.
    //
    // NIV-CAL §1: la mano de referencia sube de 21 a 31 puntos. No es un ajuste
    // cosmético — con la curva de BET_3 reparada, un 21 después del descarte
    // tiene un 0,23% de equidad contra cuatro rivales y se suelta a CUALQUIER
    // precio, así que dejó de servir para leer un contraste de bote. Lo que la
    // prueba afirma es el mismo de siempre; lo que cambió es que ahora la
    // aritmética que lo produce es la correcta. El 31 sigue por debajo del
    // `raiseMin` de los cuatro perfiles en mesa 5 (28+6 = 34 el más bajo), así
    // que la rama es la misma sea cual sea el temperamento.
    const M5_31 = [carta(1,'Bastos'), carta(2,'Bastos'), carta(3,'Bastos'), carta(6,'Oros'), carta(6,'Espadas')]
    const conBote = (pot, contribAjeno) => ({
      numPlayers: 5, phase: 'BET_3', currentBet: 400, pot, unit: 50,
      manoIndex: 0, pieIndex: 4, handCount: 4, aliveCount: 5,
      handRules: makeHandRules(5), nivelIA: 'avanzado',
      players: Array.from({ length: 5 }, (_, i) => jugador({
        id: i, isHuman: i === 0, cards: i === 1 ? M5_31 : M5.fuerte,
        contrib: i === 1 ? 0 : (i === 0 ? 400 : contribAjeno),
      })),
    })
    _resetForTesting()
    // CAMBIO DE VEREDICTO (APU-1 1c, A-4 · normativo §6.5). Lo que esta prueba
    // declara es QUÉ LEE la IA, y APU-1 le quitó un lector: la regla del cuarto
    // del pozo mira `pot` y el costo propio, y ya no necesita sumar lo que los
    // rivales aún deben. El contraste se reescribe en esa dirección —`pot` sí,
    // `contrib` ajeno ya no—, que es una frontera MÁS ESTRECHA que la anterior,
    // no más ancha: la IA de APU-1 lee menos información pública que la de
    // NIV-1, y esta prueba es la que lo sella.
    fijarPerfil('CONSERVADORA', conBote(100, 400), 1)
    // (a) pozo flaco: 400 no es ≤ ¼ de 100, decide el listón y un 31 se suelta.
    expect(decideBetAction(conBote(100, 400), 1).action).toBe('retirarse')
    // (b) pozo gordo: el mismo precio es ≤ ¼ del pozo y se paga sin mirar mano.
    //     Luego `pot` se lee, y se lee para esto.
    expect(decideBetAction(conBote(30000, 400), 1).action).toBe('igualar')
    // (c) los `contrib` ajenos ya NO mueven la decisión, en ninguno de los dos
    //     extremos: mismo pozo, deudas ajenas distintas, misma respuesta.
    expect(decideBetAction(conBote(100, 0), 1).action)
      .toBe(decideBetAction(conBote(100, 400), 1).action)
    expect(decideBetAction(conBote(30000, 0), 1).action)
      .toBe(decideBetAction(conBote(30000, 400), 1).action)
  })
})
