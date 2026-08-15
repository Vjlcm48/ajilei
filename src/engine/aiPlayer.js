import { getBestSuitScore, isAjilei } from './handEvaluator.js'
import { PALOS, VALORES } from './deck.js'

// Local copy to avoid circular import with gameEngine.js (which also exports maxDiscard)
// ── Personality profiles ──────────────────────────────────────────────────────
// openMin: minimum score to open betting (no bet yet)
// callMin: minimum score to call/stay in
// raiseMin: minimum score to raise
// noise: fraction of threshold randomised per decision (IMPREDECIBLE only)

const PROFILE_NAMES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

const PROFILES = {
  CONSERVADORA: { openMin: 32, callMin: 22, raiseMin: 40, noise: 0 },
  EQUILIBRADA:  { openMin: 28, callMin: 18, raiseMin: 34, noise: 0 },
  AGRESIVA:     { openMin: 22, callMin: 13, raiseMin: 28, noise: 0 },
  IMPREDECIBLE: { openMin: 28, callMin: 18, raiseMin: 34, noise: 0.15 },
}

// ══ NIVELES DE IA (fase 4) ════════════════════════════════════════════════════
// Rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §5.
//
// El nivel entra como PASAJERO `state.nivelIA` (Vía C, rector §2.2): lo cuelga
// la UI en la creación del estado, el motor lo transporta a ciegas y este
// archivo es su ÚNICO lector, siempre con el `??`. Ausencia = Básico.
//
// ARQUITECTURA DE HERMANAS MAYORES (rector §5.5): las capacidades se APILAN
// sobre los cuatro perfiles de arriba, no los sustituyen. Temperamento ⊥
// inteligencia: el perfil dice CÓMO se comporta, el nivel dice CUÁNTO entiende.
// Por eso el nivel es un RANGO y las capacidades se abren con `>=`: Pro hereda
// todo lo de Avanzado sin repetir una línea.
//
// IDENTIDAD DE BÁSICO — regla dura: con `nivelIA: 'basico'` o ausente, la
// decisión es IDÉNTICA a la de antes de NIV-1 para el mismo estado. Cada
// capacidad nueva está detrás de `avanzado`, y las magnitudes que introduce
// valen exactamente 0 cuando el rango es 0. Lo sella el test de oro de
// `scripts/testNivel1.test.js` §1, que lleva transcrita la lógica anterior y
// compara decisión contra decisión sobre una batería de fixtures.
const RANGO_NIVEL = { basico: 0, avanzado: 1, pro: 2 }
const RANGO_AVANZADO = 1

function rangoDe(state) {
  return RANGO_NIVEL[state.nivelIA ?? 'basico'] ?? 0
}

// ── ③ Estrategia completa de comodín · Avanzado+ (rector §5.2) ────────────────
//
// El comodín (7 de Oros) es ÚNICO y, cuando la mesa lo activa, aporta
// `comodinValue` al mejor palo de QUIEN LO TENGA, sea cual sea su palo
// (`handEvaluator.js:28`). De ahí la asimetría que Básico no ve: un 47 CON
// comodín y un 47 SIN comodín valen lo mismo en el showdown, pero no describen
// el mismo mundo. Si el comodín es mío, nadie más puede sumarlo. Si no es mío y
// la mesa lo activa, hay una probabilidad concreta de que un rival vivo lleve
// esos 10 u 11 puntos gratis encima de lo que ya enseñará.
//
// La amenaza se cobra donde de verdad vive —en la EQUIDAD—, y con la aritmética
// exacta. La versión intuitiva (restar los puntos esperados del comodín a mi
// puntaje) se probó y se descartó por FALSA, no por gusto: restar del puntaje
// propio equivale a subir a los k rivales a la vez, y el comodín es UNA carta
// que como mucho tiene UNO. Medido en mesa 5 con la mano en el filo de la
// decisión (puntaje 21, cuatro rivales): la corrección exacta da equidad 0,045
// y el desplazamiento plano da 0,0001 — 400 veces más pesimista, suficiente
// para retirar manos perfectamente pagables. Coincidían por casualidad en la
// zona alta de la curva, que fue donde se comprobó primero.
//
// La fórmula, con k rivales, p = P(uno de ellos lleva el comodín) y g = la
// probabilidad efectiva de batir a UN rival medio (g = equidad^(1/k)):
//
//     equidad = g^(k−1) · [ (1−p)·g + p·g_c ]
//
// es decir: contra k−1 rivales normales, más un rival que con probabilidad p es
// el portador —contra el cual mi mano rinde lo que rendiría contra una mano
// `comodinValue` puntos mejor, que es lo que g_c mide—. En BET_3 esto es
// EXACTO. No lleva ni una constante de ajuste: p sale de contar cartas
// desconocidas y se puede auditar carta por carta (D-4).
const CARTAS_BARAJA = PALOS.length * VALORES.length   // 40, derivado de deck.js

function llevaComodin(cards) {
  return cards.some(c => c.palo === 'Oros' && c.value === 7)
}

// P(un rival VIVO lleve el comodín). Cero si la mesa no lo activa (N≤3) y cero
// si es mío — la misma fórmula cubre los dos casos sin ramas especiales. Un
// retirado que lo llevara ya no compite, y el taco no juega: por eso el numerador
// cuenta sólo cartas en manos vivas.
function probComodinEnRival(state, ai, activeOpponents) {
  const { comodinValue } = state.handRules
  if (comodinValue === null) return 0
  if (llevaComodin(ai.cards)) return 0
  const propias      = ai.cards.length
  const desconocidas = CARTAS_BARAJA - propias
  if (desconocidas <= 0 || activeOpponents <= 0) return 0
  return Math.min(1, (activeOpponents * propias) / desconocidas)
}

// ── ④ Disciplina de bote · Avanzado+ (rector §5.2) ────────────────────────────
//
// Básico decide igualar o retirarse con un listón crudo sobre su propio puntaje
// más un tope absoluto (`toCall <= unit*2`, `:129 :137 :145` del archivo previo)
// que IGNORA EL BOTE por completo. La vara NIV-B0 midió el precio de esa ceguera:
// un conductor PASIVO —iguala o pasa, jamás sube, jamás se retira— bate a la
// mesa en N≥3 por +0,50 / +1,55 / +1,03 pp (hasta 11σ). Gana pozos por abandono.
//
// Avanzado sustituye ese tramo por matemática de bote: se iguala cuando la
// equidad estimada de la mano cubre el PRECIO que la mesa está cobrando.
//
//   precio  = toCall / bote al cierre de la ronda
//   equidad = P(mi mano gane el showdown)
//
// EL BOTE DE REFERENCIA es el del CIERRE DE LA RONDA, no el del instante: lo que
// ya hay en la mesa, más mi igualada, más lo que los asientos vivos todavía
// deben para quedarse. Ese último sumando es la lectura de los `contrib` ajenos
// que ④ pide: `currentBet − contrib` de cada rival vivo, topado por sus fichas.
// Todo público, nada oculto.
//
// Se cuenta y no se descarta porque el error va en la dirección segura: si un
// rival acaba retirándose en vez de igualar, el bote sale menor que lo estimado
// —pero también sale un rival menos, y mi equidad sube por el mismo suceso—. Las
// dos desviaciones se compensan. Medido: contarlo baja la tasa de retiro de la
// mesa del 20,4% al 12,4% en mesa 4, y es la mitad de la reparación de la fuga
// que la vara NIV-B0 midió.
//
// Lo que NO entra (rector §5.2, techo de ④): el TAMAÑO de la apuesta.
// `applyAIBetAction` pasa `state.unit` fijo e ignora cualquier monto que esta
// función devolviera (`gameEngine.js:482`). Elegir tamaño es abrir el motor.

// CURVAS DE FUERZA — MEDIDAS, no estimadas. Todas salen del banco de la fase
// (`node scripts/bancoNiveles.mjs --curvas`, volcado en capturas-dsk/), y el
// test §3 de `scripts/testNivel1.test.js` las vuelve a derivar y las compara:
// si alguien mueve una cifra a mano, el test discrepa.
//
// MANO DEFINITIVA (BET_3) · enumeración EXACTA de las C(40,5) = 658.008 manos.
// Para cada puntaje s, la probabilidad de que una mano al azar quede por debajo,
// contando medio empate (el desempate real es por orden de asiento desde la
// Mano, `gameEngine.js:157-163`, que desde un asiento cualquiera vale ½):
//
//     q[s] = P(X < s) + ½·P(X = s)
//
// Contra k rivales la equidad es q^k, y aquí eso es EXACTO: con la mano cerrada,
// las manos de los rivales son independientes entre sí dada la mía.
const CURVA_FINAL = {
  desde: 13,
  q: [0.003, 0.006, 0.006, 0.033, 0.102, 0.150, 0.156, 0.325, 0.569, 0.643,
      0.652, 0.663, 0.664, 0.692, 0.757, 0.803, 0.812, 0.858, 0.932, 0.960,
      0.962, 0.965, 0.965, 0.968, 0.977, 0.984, 0.986, 0.989, 0.995, 0.998,
      0.999, 0.999, 0.999, 0.999, 0.999, 1, 1, 1, 1],
}

// FASES INTERMEDIAS (BET_1, BET_2) · tablas por número de rivales, medidas con
// la dinámica real (reparto 2+3, descarte al mejor palo, reposición del taco),
// 4.000.000 de muestras por columna y con el tope de descarte de la mesa que
// corresponde a cada k (5 en mesas 2-4, 3 en mesa 5).
//
// POR QUÉ UNA TABLA POR k Y NO UNA CURVA ELEVADA A LA k. Con la mano todavía
// abierta, «probabilidad de batir a un rival» es un PROMEDIO sobre los
// desenlaces posibles de mi propia mano, y E[q]^k ≠ E[q^k] (Jensen). No es un
// matiz: a 2 cartas, puntaje 21 contra 4 rivales da 0,340 medido frente a 0,186
// por la vía del promedio elevado — 45% de subestimación, suficiente para
// retirar manos que pagan. La tabla mide el número que hace falta y se acabó el
// modelo.
//
// Lo que la tabla enseña de paso: a 2 cartas la fuerza casi no separa (0,38 a
// 0,66 contra un rival). En BET_1 lo que decide es el PRECIO, no la mano — y eso
// es un hallazgo de la medición, no una postura de diseño.
//
// Límite declarado: medidas sobre baraja SIN comodín. La asimetría del comodín
// no se mete aquí: la cobra ③ sobre el puntaje, para que cada capacidad se pueda
// auditar por separado.
const TABLA_BET_1 = {
  desde: 6,
  k: [
    [0.379, 0.408, 0.408, 0.408, 0.476, 0.519, 0.519, 0.455, 0.455, 0.455, 0.478, 0.516, 0.541, 0.541, 0.587, 0.657],
    [0.220, 0.241, 0.241, 0.241, 0.309, 0.349, 0.349, 0.288, 0.288, 0.288, 0.310, 0.345, 0.374, 0.374, 0.422, 0.497],
    [0.150, 0.171, 0.171, 0.171, 0.228, 0.265, 0.265, 0.208, 0.208, 0.208, 0.231, 0.260, 0.286, 0.286, 0.331, 0.401],
    [0.115, 0.128, 0.128, 0.128, 0.179, 0.211, 0.211, 0.164, 0.164, 0.164, 0.183, 0.208, 0.233, 0.233, 0.274, 0.340],
  ],
}
const TABLA_BET_2 = {
  desde: 13,
  k: [
    [0.260, 0.260, 0.260, 0.285, 0.328, 0.349, 0.349, 0.414, 0.509, 0.509, 0.459, 0.472, 0.472, 0.497, 0.573,
     0.625, 0.625, 0.703, 0.797, 0.797, 0.797, 0.801, 0.801, 0.820, 0.862, 0.900, 0.900, 0.924, 0.957],
    [0.129, 0.129, 0.129, 0.143, 0.175, 0.201, 0.201, 0.252, 0.329, 0.329, 0.276, 0.286, 0.286, 0.307, 0.373,
     0.430, 0.430, 0.516, 0.648, 0.648, 0.633, 0.656, 0.656, 0.679, 0.745, 0.806, 0.806, 0.860, 0.914],
    [0.079, 0.079, 0.079, 0.091, 0.113, 0.133, 0.133, 0.178, 0.243, 0.243, 0.196, 0.214, 0.214, 0.221, 0.272,
     0.320, 0.320, 0.401, 0.539, 0.539, 0.522, 0.536, 0.536, 0.570, 0.646, 0.731, 0.731, 0.790, 0.881],
    [0.058, 0.058, 0.058, 0.067, 0.082, 0.098, 0.098, 0.135, 0.191, 0.191, 0.151, 0.157, 0.157, 0.173, 0.215,
     0.253, 0.253, 0.324, 0.455, 0.455, 0.434, 0.438, 0.438, 0.484, 0.573, 0.651, 0.651, 0.739, 0.845],
  ],
}

// Sólo para las pruebas: `scripts/testNivel1.test.js` §3 re-deriva estas tablas
// —la final por enumeración exacta, las intermedias por sus invariantes— y las
// compara con lo que está escrito aquí. Mismo molde que `_resetForTesting`.
export const _CURVAS_PARA_TEST = { CURVA_FINAL, TABLA_BET_1, TABLA_BET_2 }

function enTabla(tabla, score, k) {
  const fila = tabla.k[Math.min(Math.max(k, 1), tabla.k.length) - 1]
  const i = Math.round(score) - tabla.desde
  if (i < 0) return fila[0]
  if (i >= fila.length) return fila[fila.length - 1]
  return fila[i]
}

function equidad(score, phase, activeOpponents) {
  const k = Math.max(1, activeOpponents)
  if (phase === 'BET_1') return enTabla(TABLA_BET_1, score, k)
  if (phase === 'BET_2') return enTabla(TABLA_BET_2, score, k)
  // Mano definitiva: la curva exacta, elevada a los rivales.
  const i = Math.round(score) - CURVA_FINAL.desde
  const q = i < 0 ? 0 : i >= CURVA_FINAL.q.length ? 1 : CURVA_FINAL.q[i]
  return Math.pow(q, k)
}

// ③ aplicada a ④: la equidad con la amenaza del comodín dentro.
function equidadConComodin(score, phase, k, comodinValue, p) {
  const base = equidad(score, phase, k)
  if (p <= 0 || comodinValue === null || base <= 0) return base
  const g  = Math.pow(base, 1 / k)
  const gc = Math.pow(equidad(score - comodinValue, phase, k), 1 / k)
  return Math.pow(g, k - 1) * ((1 - p) * g + p * gc)
}

// Rango de puntajes posibles por fase — el dominio de las curvas.
function rangoDeFase(phase) {
  if (phase === 'BET_1') return [TABLA_BET_1.desde, TABLA_BET_1.desde + TABLA_BET_1.k[0].length - 1]
  if (phase === 'BET_2') return [TABLA_BET_2.desde, TABLA_BET_2.desde + TABLA_BET_2.k[0].length - 1]
  return [CURVA_FINAL.desde, CURVA_FINAL.desde + CURVA_FINAL.q.length - 1]
}

// ③ aplicada al LISTÓN clásico. Los umbrales de personalidad (openMin, callMin,
// raiseMin) están en puntos, no en equidad, así que la amenaza se les traduce:
// el puntaje equivalente es el puntaje SIN comodín en mesa que valdría lo mismo
// que mi mano vale CON la amenaza encima. Una sola fuente —la equidad corregida
// de arriba—, dos monedas. Sin esto, ③ sólo se notaría al igualar y no al abrir
// ni al subir, que es justo donde el rector §5.2 pide que se note.
function puntajeEquivalente(eqCorregida, score, phase, k) {
  const [lo, hi] = rangoDeFase(phase)
  for (let s = lo; s <= Math.min(hi, Math.round(score)); s++) {
    if (equidad(s, phase, k) >= eqCorregida) return s
  }
  return Math.min(hi, Math.round(score))
}

// ── Personality module state ──────────────────────────────────────────────────
// Keyed by seat index → profile name.  Re-initialised on new game detection.

let _assignments     = null   // { [seatIndex]: profileName }
let _lastNumPlayers  = 0
let _lastHandCount   = -1     // -1 = never seen; tracks partida boundary
let _lastAliveCount  = -1     // -1 = never seen; segunda señal del límite

function _shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Public — also called directly by tests
export function initPersonalities(numPlayers) {
  const numAIs   = numPlayers - 1       // seat 0 is the human
  const shuffled = _shuffled(PROFILE_NAMES)
  _assignments    = {}
  _lastNumPlayers = numPlayers
  for (let i = 0; i < numAIs; i++) {
    _assignments[i + 1] = shuffled[i]  // AI seats: 1 … N-1
  }
}

// Returns the profile name for a given AI seat (null if not yet initialised)
export function getPersonalityName(aiIndex) {
  return _assignments ? (_assignments[aiIndex] ?? null) : null
}

// Resets all module state — for test isolation only
export function _resetForTesting() {
  _assignments    = null
  _lastNumPlayers = 0
  _lastHandCount  = -1
  _lastAliveCount = -1
}

// ── RIDER NIV-1 §4 · re-sorteo de perfiles por PARTIDA ────────────────────────
//
// CONTABILIDAD DEL ARREGLO (qué murió, qué lo reemplaza, por qué):
//
// QUÉ MURIÓ. La condición anterior era `state.handCount === 0 && _lastHandCount > 0`.
// Era una rama MUERTA, medida en NIV-B0, no supuesta: `startHand` deja el
// contador en 1 ANTES de la primera decisión de apuesta (`gameEngine.js:451`),
// así que ninguna llamada real llega jamás con `handCount === 0`. Sólo la
// alcanzaba un estado sintético fabricado por el test. Consecuencia en vivo: los
// perfiles se repartían UNA vez y se quedaban puestos mesa tras mesa, durante
// toda la vida del módulo. El banco lo cuantificó: dos corridas de 3000 manos
// dieron 25,17% y 17,20% de tasa para el mismo asiento, sólo por el reparto.
//
// QUÉ LO REEMPLAZA. Dos señales del propio estado, ambas públicas, que juntas
// marcan el límite de partida sin inventar maquinaria ni tocar el motor:
//   · `handCount` RETROCEDE — dentro de una partida sólo crece de 1 en 1, así
//     que verlo bajar sólo puede significar un estado recién creado.
//   · `aliveCount` SUBE — dentro de una partida sólo baja (las bancarrotas son
//     permanentes, `gameEngine.js:49-50`), así que verlo subir es mesa nueva.
// Se conserva el disparo por cambio de `numPlayers` y el de arranque en frío.
//
// POR QUÉ SE REPARA Y NO SE RETIRA (decisión de Victor, NIV-1 §4): la intención
// original era correcta —una mesa nueva merece rivales nuevos—; lo que estaba
// roto era el detector. Retirarla habría sellado como diseño un accidente.
// Aplica IGUAL a los tres niveles: el temperamento es ortogonal al nivel
// (rector §5.5), así que el reparto no es una capacidad que se gane subiendo.
//
// PUNTO CIEGO RESIDUAL, declarado: dos partidas consecutivas que terminaran
// AMBAS en su primera mano serían indistinguibles desde aquí (handCount 1 → 1,
// aliveCount N → N, sin llamada intermedia). El motor no puede producirlo con
// las tablas del rector §3.3 —haría falta dejar a N−1 jugadores por debajo de la
// entrada en una sola mano partiendo de 5000 fichas iguales—, y si ocurriera el
// efecto sería que una partida hereda los perfiles de la anterior: exactamente
// lo que pasaba SIEMPRE hasta esta tanda. Degrada al comportamiento viejo, no
// por debajo.
function _ensurePersonalities(state) {
  const vivos = state.aliveCount ?? state.numPlayers
  const partidaNueva = state.handCount < _lastHandCount || vivos > _lastAliveCount
  if (_assignments === null || state.numPlayers !== _lastNumPlayers || partidaNueva) {
    initPersonalities(state.numPlayers)
  }
  _lastHandCount  = state.handCount
  _lastAliveCount = vivos
}

// Apply ±noise% variance to a threshold — called once per decision, not at assignment
function _jitter(value, noise) {
  if (noise === 0) return value
  const factor = 1 + (Math.random() * 2 - 1) * noise
  return value * factor
}

// ── Core decision functions ───────────────────────────────────────────────────

export function decideBetAction(state, aiIndex) {
  const { players, currentBet, phase, manoIndex, pieIndex, unit } = state
  const ai = players[aiIndex]

  if (ai.folded) return { action: 'pasar' }

  // HR-1: las reglas vienen del snapshot congelado en el barajado. Solo cambia
  // de dónde se leen; la estrategia (umbrales, perfiles) no se toca.
  const { ruleN } = state.handRules
  const comodinEnabled = state.handRules.comodinValue !== null
  const { points: score } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const toCall = currentBet - ai.contrib

  // Engine will force-fold if chips < toCall, but we mirror it here for safety
  if (toCall > 0 && ai.chips < toCall) return { action: 'retirarse' }

  // Saldo (defensa en profundidad): solo intentar 'subir' si alcanza para el
  // monto TOTAL de la subida (toCall + unit). Si no, se degrada a 'igualar'
  // (la igualada ya está garantizada por la guarda de arriba). No se intenta
  // ninguna acción impagable; el motor es la garantía dura de saldo ≥ 0.
  const canAffordRaise = ai.chips >= toCall + unit

  // Ajilei always plays aggressively regardless of profile.
  // El tell honesto se conserva en Básico Y en Avanzado a propósito (rector
  // §5.3): disimularlo es capacidad exclusiva de Pro, y llega en NIV-2.
  if (isAjilei(ai.cards, ruleN)) {
    return { action: currentBet > 0 ? 'subir' : 'apostar' }
  }

  _ensurePersonalities(state)
  const profile = PROFILES[_assignments[aiIndex]]

  // Nivel de esta mesa. `avanzado` abre ③ y ④; Pro las hereda por rango.
  const avanzado = rangoDe(state) >= RANGO_AVANZADO

  // ── Threshold adjustments ─────────────────────────────────────────────────
  // More active opponents → raise the bar (each extra opponent adds 2 pts)
  const activeOpponents = players.filter((p, i) => i !== aiIndex && !p.folded).length
  const opponentAdj     = (activeOpponents - 1) * 2  // 0 at N=2

  // Position: Pie (acts last, most info) → slightly lower bar; Mano (opens blind) → slightly higher
  const posAdj = pieIndex === aiIndex ? -2 : (manoIndex === aiIndex ? 1 : 0)

  // Noise applied per decision (IMPREDECIBLE: ±15% per call)
  const openMin  = _jitter(profile.openMin  + opponentAdj + posAdj, profile.noise)
  const callMin  = _jitter(profile.callMin  + opponentAdj + posAdj, profile.noise)
  const raiseMin = _jitter(profile.raiseMin + opponentAdj + posAdj, profile.noise)

  // ③ · la amenaza del comodín, calculada UNA vez y gastada en sus dos monedas:
  // `eqMano` para la matemática de bote, `scoreEf` para el listón de personalidad.
  // En Básico —y en Avanzado en mesas sin comodín, y en Avanzado cuando el
  // comodín es MÍO— `pComodin` vale 0 y `scoreEf === score` exactamente, así que
  // ninguna comparación de abajo cambia de lado.
  const kRivales = Math.max(1, activeOpponents)
  const pComodin = avanzado ? probComodinEnRival(state, ai, activeOpponents) : 0
  const eqMano   = avanzado
    ? equidadConComodin(score, phase, kRivales, state.handRules.comodinValue, pComodin)
    : 0
  const scoreEf  = pComodin > 0 ? puntajeEquivalente(eqMano, score, phase, kRivales) : score

  // ── No bet yet: open or pass ──────────────────────────────────────────────
  if (currentBet === 0) {
    // Saldo: no abrir si no se puede cubrir la apuesta de apertura (unit) → pasar.
    if (scoreEf >= openMin && ai.chips >= unit) return { action: 'apostar' }
    return { action: 'pasar' }
  }

  // ④ · el veredicto del bote. Sólo Avanzado+, y sólo cuando hay bote que medir:
  // sin bote no hay matemática de bote y se cae al listón de Básico (estado
  // sintético, no situación de juego real — el motor cobra antes en cada mano).
  // Con `toCall <= 0` igualar es GRATIS y retirarse no puede ser correcto nunca:
  // Básico sí se retira ahí (`score < callMin` en el tramo final), y eso es
  // regalar la mano sin que nadie la cobre.
  const bote = state.pot ?? 0
  const boteDecide = avanzado && bote > 0
  // Lectura de `contrib` ajenos: lo que los vivos aún deben para quedarse.
  const porIgualar = !boteDecide ? 0 : players.reduce((suma, p, i) => (
    i === aiIndex || p.folded ? suma : suma + Math.min(Math.max(currentBet - p.contrib, 0), p.chips)
  ), 0)
  const pagaElBote = boteDecide && (
    toCall <= 0 || eqMano >= toCall / (bote + toCall + porIgualar)
  )

  // ── BET_1: only 2 cards — call liberally; fold only on big raise + weak hand
  if (phase === 'BET_1') {
    if (scoreEf >= raiseMin)             return canAffordRaise ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)                      return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin)              return { action: 'igualar' }
    if (toCall <= unit * 2)              return { action: 'igualar' }  // cheap-call safety
    return { action: 'retirarse' }
  }

  // ── BET_2: 5 cards — real hand evaluation ────────────────────────────────
  if (phase === 'BET_2') {
    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)                      return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin + 4)          return { action: 'igualar' }
    if (scoreEf >= callMin) return toCall <= unit * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  // ── BET_3: post-discard — highest bar ────────────────────────────────────
  if (phase === 'BET_3') {
    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? { action: 'subir' } : { action: 'igualar' }
    if (boteDecide)                      return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
    if (scoreEf >= callMin + 4)          return { action: 'igualar' }
    if (scoreEf >= callMin) return toCall <= unit ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  if (boteDecide) return pagaElBote ? { action: 'igualar' } : { action: 'retirarse' }
  return scoreEf >= callMin ? { action: 'igualar' } : { action: 'retirarse' }
}

export function decideDiscard(state, aiIndex) {
  const { players } = state
  const ai = players[aiIndex]
  // HR-1: comodín y tope de descarte salen del snapshot congelado en el barajado
  const { ruleN, maxDiscard: topeDescarte, comodinValue } = state.handRules
  const comodinEnabled = comodinValue !== null

  const { palo: bestSuit } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const avanzado = rangoDe(state) >= RANGO_AVANZADO

  const indices = []
  ai.cards.forEach((card, i) => {
    const esComodin = card.palo === 'Oros' && card.value === 7
    // ③ · Básico protege el comodín SÓLO en N=5 (`ruleN === 5` a pelo). Es un
    // punto ciego declarado del nivel, no un descuido: en N=4 el 7 de Oros
    // también es comodín y también vale 10 sobre CUALQUIER palo
    // (`handEvaluator.js:2-6`), así que tirarlo regala 10 puntos.
    // Avanzado lee la regla congelada de la mano en vez del número: protege
    // siempre que la mesa haga valer el comodín, que es lo que `comodinValue`
    // dice. Es la corrección del punto ciego, no una capacidad nueva.
    if (esComodin && (avanzado ? comodinEnabled : ruleN === 5)) return
    if (card.palo !== bestSuit) indices.push(i)
  })

  return indices.slice(0, topeDescarte)
}
