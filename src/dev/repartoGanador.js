// ── repartoGanador.js · ARN-3d §2.5 (D14) · el humano gana la PRIMERA mano ──
// Rector: AJILEI_ARN-3d_v1.0.md §0 D14 y la revisión del STOP-1. Lo consume
// `?apu=gana` (`siembraAPU.js`), con la misma doble puerta que los demás moldes.
// VOZ-3 · y `?apu=allin` / `?apu=allin-espejo` (más abajo, `ordenAllin`).
//
// PARA QUÉ. `vc` necesita una mano GANADA por el humano para medir la
// celebración de mano (el roce de fichas, el Δ de la barra, el reloj, el mudo y
// el corte). Jugando a ciegas eso salía en 1 de cada pocas manos, y con cuatro
// sub-pasadas por celda alguna se quedaba sin victoria en el tope de 18
// (H3d-i-2). Con red estrangulada, ni una en 20 manos (Fase 0 §C4).
//
// QUÉ HACE Y QUÉ NO. Prepara el REPARTO de la primera mano y nada más: el orden
// en que sale la baraja. La mano se juega por el camino normal —el ante, las
// tres rondas, los descartes de las IAS, el showdown y el pago los hace el motor
// por su regla—, y las IAS deciden con su propio azar, que no se toca. No abre
// ningún protegido: usa `setRng`, la API que `deck.js` exporta para inyectar el
// generador del barajado (Protegidos §6, la excepción de APU-1 §6.11). El
// barajado es el de siempre, con su mismo número de tiradas: lo que cambia es
// qué devuelven esas 39 tiradas, UNA vez. La siguiente mano baraja con el azar
// de verdad.
//
// ── POR QUÉ ESTA MANO GANA (reglas de `handEvaluator.js`) ──────────────────
// Puntos: As 11, 7 vale 7, 6 vale 6, el resto 10. La mano vale lo que su mejor
// palo, más el comodín (el 7 de Oros, que vale 10 con 4 vivos y 11 con 5). En
// la PRIMERA mano de la sesión la Mano es el humano (`gameEngine.js:92-95`), y
// el empate lo gana la Mano: al humano le basta con que nadie le SUPERE.
//   · 2–3 vivos: cinco «diez» de Copas = 50. Superarlo exige 51, y 51 sólo es
//     el As con cuatro «diez» del mismo palo: los cuatro Ases van al fondo de la
//     baraja, fuera del alcance de cualquier descarte.
//   · 4 vivos: el 7 de Oros y cuatro «diez» de Copas = 40 + 10 = 50. Nadie más
//     tiene comodín, y sin As nadie pasa de 50. Los Ases, al fondo.
//   · 5 vivos: lo mismo = 40 + 11 = 51, el máximo que alguien sin comodín puede
//     hacer. Empata como mucho, y el empate es suyo.
// NUNCA es AJILEI (cinco del mismo palo que suman 51, o con comodín 52): una
// mano AJILEI celebraría como 'ajilei' y no como 'mano', que es lo que mide `vc`.
//
// ── EL REPARTO, Y LA ÚNICA COSA QUE NO CONTROLA ─────────────────────────────
// Primera vuelta: dos cartas a cada asiento, de la Mano (0) al Pie. Segunda
// vuelta (tras la ronda «a las 2»): tres a cada asiento NO RETIRADO. Si una IA
// se retira a las 2, la segunda vuelta se corre y al humano le tocan otras
// posiciones: con k asientos vivos, las k-ésimas. Por eso las «diez» de Copas
// se reparten en las posiciones del humano para TODOS los k posibles… salvo
// con 5 vivos y exactamente dos retiradas a las 2 (k = 3), donde no hay Copas
// para todo. Si pasa, el molde no da la victoria y `vc` lo dice («cobertura»).
// El humano del arnés no se retira y no descarta.
//
// ── Y LAS IAS, CON MANOS FLOJAS ─────────────────────────────────────────────
// No basta con que el humano tenga la mejor mano: si una IA cree tener una
// buena, apuesta fuerte, y dos apuestas de 500 dejan al humano en All-in. Un
// All-in con la mejor mano gana el pozo principal, pero el sobrante de la IA
// vuelve a ella como capa propia, y el óvalo dice «La IA gana…»: no es la
// celebración de mano que `vc` mide (medido en mesa 2: 46 de Oros contra 50).
// Por eso cada IA recibe sus cinco cartas con los palos repartidos (nunca más
// de dos del mismo) y las de menos puntos primero, y el resto de la baraja —de
// donde salen sus descartes— va intercalado por palo.

import { createDeck, setRng, resetRng, PALOS } from '../engine/deck.js'

const N_CARTAS = 40
// Los cinco «diez» de Copas que no son As ni 7 ni 6, y los dos de reserva.
const COPAS_DIEZ = ['2-Copas', '3-Copas', '4-Copas', '5-Copas', '10-Copas', '11-Copas', '12-Copas']
const COMODIN = '7-Oros'
const ASES = ['1-Oros', '1-Copas', '1-Espadas', '1-Bastos']

// Las posiciones del humano en la segunda vuelta, contadas desde el primer
// naipe tras la primera: con k vivos, 0, k y 2k.
const posicionesSegunda = (k) => [0, k, 2 * k]

/**
 * El orden de la baraja (ids, de arriba abajo) que hace ganar al humano la
 * primera mano con `n` vivos. Puro.
 * @param {number} n  vivos en la mesa (2–5)
 * @returns {string[]}
 */
export function ordenGanador(n) {
  if (!Number.isInteger(n) || n < 2 || n > 5) throw new Error(`ordenGanador: n=${n} fuera de 2..5`)
  const T = new Array(N_CARTAS).fill(null)
  const copas = [...COPAS_DIEZ]
  const conComodin = n >= 4

  // Primera vuelta: el humano recibe la 0 y la n.
  T[0] = conComodin ? COMODIN : copas.shift()
  T[n] = copas.shift()

  // Segunda vuelta: las posiciones del humano para cada k, de más probable
  // (nadie se retira, k = n) a menos. Con 5 vivos las Copas no alcanzan para
  // k = 3 (ver la cabecera): se cubren n, n-1 y 2, en ese orden.
  const ks = n === 5 ? [5, 4, 2] : Array.from({ length: n - 1 }, (_, i) => n - i)
  const base = 2 * n
  for (const k of ks) {
    for (const p of posicionesSegunda(k)) {
      if (T[base + p] === null) T[base + p] = copas.shift()
    }
  }

  // Los Ases, al FONDO: con 2–4 vivos nadie los alcanza descartando (5 por
  // cabeza con ≤ 4 vivos, 3 con 5; `maxDiscard`).
  ASES.forEach((id, i) => { T[N_CARTAS - ASES.length + i] = id })

  // Lo que queda, de menos a más puntos (el orden de `createDeck` desempata).
  const puestos = new Set(T.filter(Boolean))
  const pool = createDeck().filter((c) => !puestos.has(c.id)).sort((a, b) => a.points - b.points)
  const toma = (palo) => {
    const i = pool.findIndex((c) => c.palo === palo)
    return i < 0 ? null : pool.splice(i, 1)[0]
  }

  // Las IAS (asientos 1..n-1), en sus posiciones de nadie-se-retira: primera
  // vuelta s y n+s; segunda, 2n+s, 3n+s y 4n+s. Cada hueco, con el palo que
  // menos lleva esa IA (y que aún quede), girando el orden por asiento.
  for (let seat = 1; seat < n; seat++) {
    const pos = [seat, n + seat, 2 * n + seat, 3 * n + seat, 4 * n + seat]
    const lleva = Object.fromEntries(PALOS.map((p) => [p, 0]))
    for (const q of pos) if (T[q] !== null) lleva[T[q].split('-')[1]]++
    for (const q of pos) {
      if (T[q] !== null) continue
      const giro = PALOS.map((_, i) => PALOS[(i + seat) % PALOS.length])
      const palo = giro
        .filter((p) => pool.some((c) => c.palo === p))
        .reduce((mejor, p) => (lleva[p] < lleva[mejor] ? p : mejor))
      T[q] = toma(palo).id
      lleva[palo]++
    }
  }

  // El resto (el mazo de los descartes), intercalado por palo.
  let k = 0
  for (let i = 0; i < N_CARTAS; i++) {
    if (T[i] !== null) continue
    let c = null
    for (let intento = 0; intento < PALOS.length && !c; intento++) c = toma(PALOS[(k++) % PALOS.length])
    T[i] = c.id
  }
  return T
}

/**
 * Las 39 tiradas que hacen que el barajado de `deck.js` (Fisher-Yates de atrás
 * adelante, `j = floor(rng() * (i + 1))`) devuelva exactamente `orden`. Puro.
 * @param {string[]} orden
 * @returns {number[]}
 */
export function tiradasPara(orden) {
  const cur = createDeck().map((c) => c.id)
  const tiradas = []
  for (let i = cur.length - 1; i > 0; i--) {
    const j = cur.indexOf(orden[i])
    if (j < 0 || j > i) throw new Error(`tiradasPara: ${orden[i]} fuera de alcance en i=${i}`)
    // El centro del intervalo [j, j+1) / (i+1): sin riesgo de redondeo.
    tiradas.push((j + 0.5) / (i + 1))
    ;[cur[i], cur[j]] = [cur[j], cur[i]]
  }
  return tiradas
}

/**
 * Arma el barajado de la PRÓXIMA mano y se desarma solo al consumirlo: tras la
 * tirada 39, `resetRng()` devuelve el azar de verdad. Armarlo otra vez antes de
 * que se consuma lo reemplaza (StrictMode llama dos veces al inicializador de la
 * mesa; las dos armas son la misma).
 * @param {number} n  vivos en la mesa
 */
export function armarRepartoGanador(n) {
  armarOrden(ordenGanador(n))
}

// ── VOZ-3 · D13 · `?apu=allin` y `?apu=allin-espejo` ────────────────────────
// Rector: AJILEI_VOZ-3_Fase1_v1.0.md §3 1c.3. Los dos casos que VOZ-3 corrige,
// pintados por el camino de verdad: un all-in corto que GANA la capa principal
// mientras el rival recupera su sobrante (C1), y su espejo (C3). El molde
// prepara el reparto; las pilas las siembra `siembraAPU.js` (1,5 apuestas al
// corto: tras el ante le queda media, que no cubre ninguna apuesta).
//
// C1 · `ordenAllin(n)`. El humano recibe la mano de `ordenGanador` (50, o 51
// con 5 vivos) y la IA 1 una mano FUERTE pero menor: cuatro «diez» de Oros y
// el 6 de Oros = 46. Es la mano que hace apostar a una IA (la cabecera de este
// archivo lo midió: «46 de Oros contra 50» dejaba al humano en All-in), y con
// media apuesta en la pila el humano solo puede contestar con su All-in. Sus
// mejoras posibles no la pasan de 50: el As de Oros sigue al fondo, y con las
// tres «diez» de Oros que quedan empata a 50, que en la primera mano es del
// humano por ser la Mano. Con 4 y 5 vivos el comodín es del humano.
//
// C3 · `ordenAllinEspejo(n)`. Las manos del humano y de la IA 1 se cambian de
// sitio: la IA 1 (el corto) tiene la mejor, y el humano una floja. El humano,
// que es la Mano, apuesta en su primer turno; la IA 1 contesta con su All-in y
// a él le vuelve el sobrante.
//
// LO QUE NO CONTROLA, como `ordenGanador`: las posiciones son las de «nadie se
// retira a las 2». En la mesa de 2 eso es siempre así (retirarse acaba la
// mano); en las de 3 a 5, si una IA se retira a las 2, la segunda vuelta se
// corre y las manos de la IA 1 cambian. Y las IAS deciden con su propio azar:
// el molde hace probable que la IA 1 apueste (C1) o pague (C3), no seguro. Las
// celdas de `apu` que lo usan siembran ese azar (ARN-4 A6) y, si la semilla ya
// no lo da, lo declaran «sin cobertura».
const OROS_FUERTE = ['2-Oros', '3-Oros', '4-Oros', '5-Oros', '6-Oros']
const posicionesDe = (seat, n) => [seat, n + seat, 2 * n + seat, 3 * n + seat, 4 * n + seat]

/**
 * C1: el humano con la mejor mano y la IA 1 con 46 de Oros. Puro.
 * @param {number} n  vivos en la mesa (2–5)
 * @returns {string[]}
 */
export function ordenAllin(n) {
  const T = ordenGanador(n)
  // Una posición de la IA 1 puede estar ya ocupada por una «diez» de Copas que
  // el humano necesita si alguien se retira a las 2 (mesa de 3: la 10 es suya
  // con k = 2). Esa no se toca: la IA 1 se queda con cuatro de Oros y esa.
  const reservada = (id) => COPAS_DIEZ.includes(id) || id === COMODIN
  let i = 0
  for (const q of posicionesDe(1, n)) {
    if (reservada(T[q])) continue
    const j = T.indexOf(OROS_FUERTE[i++])
    ;[T[q], T[j]] = [T[j], T[q]]
  }
  return T
}

/**
 * C3: la IA 1 con la mejor mano y el humano con una floja. Puro.
 * @param {number} n  vivos en la mesa (2–5)
 * @returns {string[]}
 */
export function ordenAllinEspejo(n) {
  const T = ordenGanador(n)
  const h = posicionesDe(0, n), a = posicionesDe(1, n)
  h.forEach((q, i) => { [T[q], T[a[i]]] = [T[a[i]], T[q]] })
  return T
}

/**
 * Arma el reparto de C1 (o de C3 con `espejo`), como `armarRepartoGanador`.
 * @param {number} n  vivos en la mesa
 * @param {boolean} [espejo]
 */
export function armarRepartoAllin(n, espejo = false) {
  armarOrden(espejo ? ordenAllinEspejo(n) : ordenAllin(n))
}

function armarOrden(orden) {
  const tiradas = tiradasPara(orden)
  let k = 0
  setRng(() => {
    const v = tiradas[k++]
    if (k >= tiradas.length) resetRng()
    return v
  })
}
