// ── manoCore.js · VOZ-3 · Quién ganó la mano, leído de las fichas ──────────
// Rector: AJILEI_VOZ-3_Fase1_v1.0.md (decisiones D1–D11). Informe de la
// Fase 0: docs/reportes/AJILEI_VOZ-3_Fase0_Informe_v1.0.md §A, §B y §D.
//
// POR QUÉ EXISTE. `doShowdown` elige bien al ganador —la mejor mano— y acto
// seguido escribe en `state.winner` al dueño de la capa de ARRIBA
// (`gameEngine.js:285`, `:292`). Cuando esa capa es el sobrante de un all-in
// corto, su dueño es quien solo recupera su vuelto, y la mesa entera lo
// trataba como ganador: la frase, el color, la mano en grande, la
// celebración, las monedas, el saldo retenido y «Manos ganadas». El motor es
// protegido y no se abre: lo que se corrige es la LECTURA.
//
// LA REGLA, en una línea: **la mano la gana quien gana la capa principal**
// (la capa 0). En el volteo es la mejor mano entre los que no se retiraron
// —mismo conjunto y mismo desempate que el `winner` local del motor—; en la
// ruta de los retiros, el último en pie. Su neto en la mano es siempre
// positivo: gana todas las capas en las que es elegible, y en cada una los
// demás pusieron al menos el ante. Es la regla que `mesaIACore.finDeMano` ya
// usa para el récord del servidor desde ECO-1.
//
// UNA SOLA FUENTE (D3). Todo lo que la mesa deriva del fin de la mano sale de
// `lecturaDeMano` y de ningún otro sitio. Ningún consumidor vuelve a leer
// `game.winner` en el pago ni a hacer su propia cuenta: siete consumidores
// con siete cuentas es justo cómo nació el defecto.
//
// Módulo PURO, sin React ni DOM (molde de `mesaCore`, `cronicaCore`): este
// proyecto no tiene jsdom, así que lo que se quiera sellar tiene que vivir
// fuera del JSX. Lo sella `scripts/testVoz3.test.js` con el motor real.

import { PHASES } from '../engine/gameEngine'
import { ASIENTO_HUMANO, repartoPorCapas } from './mesaCore'
import { decideCelebracion } from './celebracionCore'
import { composeResultado } from './resultadoCore'

// Contribución total de un asiento a la mano, ante incluido (`pozos.js`, `C`).
const C = (p) => Math.max(0, p?.contribMano ?? 0)

// ── Los tramos de las capas ─────────────────────────────────────────────────
// `capasDe` (`pozos.js:260-296`) no devuelve los niveles, y hacen falta para
// saber qué parte de cada capa puso cada asiento. Se rehacen con su misma
// fórmula: niveles = contribuciones de los all-in no retirados, ordenadas y sin
// repetir; un tramo por nivel y uno por encima del último. `capasDe` omite las
// capas de monto 0, así que aquí también: el i-ésimo tramo con dinero es la
// i-ésima capa, y `lecturaDeMano` exige que las cuentas casen.
function tramosDe(players) {
  const niveles = [...new Set(
    players.filter((p) => p.allIn && !p.folded).map(C).filter((a) => a > 0)
  )].sort((x, y) => x - y)
  const cortes = [0, ...niveles, Infinity]
  const tramos = []
  for (let k = 1; k < cortes.length; k++) {
    const lo = cortes[k - 1], hi = cortes[k]
    const monto = players.reduce((s, p) => s + puesto(p, lo, hi), 0)
    if (monto > 0) tramos.push({ lo, hi })
  }
  return tramos
}

// Lo que un asiento puso dentro del tramo (lo, hi]: `min(C, hi) − min(C, lo)`.
const puesto = (p, lo, hi) => Math.max(0, Math.min(C(p), hi) - Math.min(C(p), lo))

/**
 * Todo lo que se deriva del fin de la mano. `null` fuera del pago, y también
 * en el pago mientras la mesa recoge («Siguiente mano» pone `winner` a null
 * para dejar el óvalo en blanco, `GameTable.jsx`): esa es la única lectura de
 * `winner` que queda, y es de PRESENCIA, no de quién ganó.
 *
 *   principal     asiento que gana la capa 0 (D1)
 *   tono          'gana' | 'pierde' | 'neutro' (D4)
 *   nivel         nivel de celebración, del principal ('ajilei' | 'mano' | 'recoleccion')
 *   destinoVuelo  = principal (D9)
 *   retencion     lo que cobra el principal: lo que su pila retiene en el vuelo (D9)
 *   ganoHumano    principal === humano (D10)
 *   porAsiento    [{ disputado, sinDisputa, devuelto, cobro, neto }]
 *   otras         [{ asiento, monto }] lo que se llevan los demás (D8)
 *   devoluciones  [{ asiento, monto }] en orden de asiento, el principal incluido (D5)
 */
export function lecturaDeMano(state) {
  if (state?.phase !== PHASES.PAYOUT || state.winner == null) return null
  const players = state.players ?? []
  const capas = repartoPorCapas(state)
  if (!capas.length) return null
  const tramos = tramosDe(players)
  if (tramos.length !== capas.length) return null   // no casa con `capasDe`: no se inventa nada

  // La capa 0 siempre tiene elegibles: el all-in que la define o quien se queda.
  const principal = capas[0].ganador
  if (principal < 0) return null
  const porAsiento = players.map(() => ({ disputado: 0, sinDisputa: 0, devuelto: 0 }))
  // Lo que se llevan los demás, en el orden en que aparece (el pozo leído de
  // abajo arriba, como se reparte: E-23).
  const otrasMap = new Map()
  const otra = (asiento, monto) => {
    if (asiento === principal || monto <= 0) return
    otrasMap.set(asiento, (otrasMap.get(asiento) ?? 0) + monto)
  }

  capas.forEach((capa, k) => {
    const { lo, hi } = tramos[k]
    // Sin elegibles (D-7 de APU-1): cada uno recupera lo que puso en el tramo,
    // retirados incluidos (`repartirCapas`, `pozos.js:354-356`).
    if (capa.elegibles.length === 0) {
      players.forEach((p, i) => { porAsiento[i].devuelto += puesto(p, lo, hi) })
      return
    }
    // Un solo elegible (D7). En la capa 0 es la ruta de los retiros: el último
    // en pie se la GANA entera, son las fichas de los que se fueron. En otra
    // capa, lo propio vuelve y lo ajeno —fichas de quien se retiró dentro de
    // ese tramo— se gana sin disputa y se nombra; nunca se suma al vuelto.
    if (capa.elegibles.length === 1) {
      const x = capa.elegibles[0]
      if (k === 0) { porAsiento[x].disputado += capa.monto; return }
      const propio = puesto(players[x], lo, hi)
      porAsiento[x].devuelto += propio
      porAsiento[x].sinDisputa += capa.monto - propio
      otra(x, capa.monto - propio)
      return
    }
    porAsiento[capa.ganador].disputado += capa.monto
    otra(capa.ganador, capa.monto)
  })

  const filas = porAsiento.map((a, i) => {
    const cobro = a.disputado + a.sinDisputa + a.devuelto
    return { ...a, cobro, neto: cobro - C(players[i]) }
  })
  const humano = filas[ASIENTO_HUMANO]
  // D4 · `neutro` cuando el humano gana fichas sin la principal (una capa
  // intermedia): el titular dice quién tuvo la mejor mano, la cola da la buena
  // noticia, y el color no miente en ninguna de las dos direcciones.
  const tono = principal === ASIENTO_HUMANO ? 'gana' : (humano && humano.neto > 0 ? 'neutro' : 'pierde')
  const nivel = decideCelebracion({
    phase: state.phase, winner: principal,
    humanCards: players[ASIENTO_HUMANO]?.cards, ruleN: state.handRules?.ruleN,
  })

  return {
    principal,
    tono,
    nivel,
    destinoVuelo: principal,
    retencion: filas[principal]?.cobro ?? 0,
    ganoHumano: principal === ASIENTO_HUMANO,
    numPlayers: state.numPlayers ?? players.length,
    porAsiento: filas,
    otras: [...otrasMap].map(([asiento, monto]) => ({ asiento, monto })),
    devoluciones: filas.map((f, asiento) => ({ asiento, monto: f.devuelto })).filter((d) => d.monto > 0),
  }
}

/**
 * El resultado que pinta el óvalo: `composeResultado` de siempre, con el
 * principal como ganador y el tono de la lectura (que añade `neutro`, D4).
 * Fuera del pago —el fin de partida— no hay lectura y manda `winner`, que ahí
 * es el de `startHand` (el último con fichas), no el de una mano.
 */
export function resultadoDeMano(state, lectura) {
  const base = {
    phase: state.phase,
    players: state.players,
    numPlayers: state.numPlayers,
    manoIndex: state.manoIndex,
    ruleN: state.handRules?.ruleN,
    voz: state.voz, // MES-PvP 2 · lo pone `vistaAMesa`; el motor no lo tiene: contra las IAS, la de siempre
  }
  if (!lectura) return composeResultado({ ...base, winner: state.winner })
  const r = composeResultado({ ...base, winner: lectura.principal })
  if (!r) return r
  // MES-PvP 3-A · contra personas, si un abandono cerró la mano, el titular es el aviso
  // («Ana abandonó la mesa.»), con el tono de la lectura. Lo pone `mesaPvPCore`; el motor
  // no tiene `aviso`, así que contra las IAS esta línea no existe.
  return { ...r, tono: lectura.tono, ...(state.aviso ? { texto: state.aviso } : {}) }
}
