// ── repartoGanador.js · ARN-3d §2.5 (D14) · el humano gana la PRIMERA mano ──
// Rector: AJILEI_ARN-3d_v1.0.md §0 D14 y la revisión del STOP-1. Lo consume
// `?apu=gana` (`siembraAPU.js`), con la misma doble puerta que los demás moldes.
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
  const tiradas = tiradasPara(ordenGanador(n))
  let k = 0
  setRng(() => {
    const v = tiradas[k++]
    if (k >= tiradas.length) resetRng()
    return v
  })
}
