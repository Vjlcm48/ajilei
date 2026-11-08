// ── MOT-1 1b · La partida: estado y acción dentro, estado y respuesta fuera ─
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §1, §2, §6 y §7.
//
// PURO, sin red ni base. La hora llega como `ahora` (ms) y el azar por `setRng`. La
// 1e lo envuelve en la Edge Function y la 1d le da dónde guardar: por eso el estado
// es JSON de principio a fin y no hay `Map`, `Date` ni `undefined` que se pierdan.
//
// Toda función devuelve `{ estado, respuesta, efectos }`. Un rechazo devuelve el MISMO
// objeto de estado. `efectos` es lo que la 1e escribe en la transacción del §5:
//   · `mano_cerrada`      las pilas de todos, ya sin lo que sale en esta misma mano, y
//                         el ganador para los puntos.
//   · `salida`            `liberacion_pvp` de un asiento, una sola vez. Con monto 0 no
//                         hay movimiento (`eco1a:181`).
//   · `partida_terminada` el motor llegó a `GAME_OVER`.
//
// Quien sale se lleva su pila: al emitir `salida`, `players[i].chips` queda en 0 y el
// monto pasa a `asientos[i].cobrado`. Pilas + pozo + cobrado es constante, y la pila
// de un asiento ya cobrado no vuelve a pagarse: ni en `mano_cerrada`, ni en la partida
// muerta, que cobra lo que `mano_cerrada` dejó en SQL (contrato §7).
//
// R-4: una partida guardada antes de la v1.1 no trae `vencidos`, `enAnuncio`,
// `sinAnuncio` ni `ultimaAccion`. Se leen con su valor por defecto.
//
// v1.2 (MES-PvP 3-A, regla C-8 del Contrato v1.2 · Reglas v1.7 §8.2): abandonar es
// retirarse en el acto, en cualquier fase de la mano, y con menos de 2 sentados la partida
// termina en la misma jugada. Las tres vías (la ✕, el 3.er vencimiento y otra mesa) pasan
// por `retirarEnMano` y `terminarSiQuedaUno`.
//
// v1.3 (la recarga PvP, Reglas de APU-1 v1.9 §8.1 · bloque D del informe de la Fase 0):
//   · `estado.entrada` es la pila de entrada; sin él (una partida de la v1.2 o la v1.3-a, R-4) la
//     recarga queda apagada en esa partida y todo va como antes.
//   · Cada asiento lleva `pedida`, `fuera` (`null` · `'oferta'`, quebró en esta pausa · `'mano'`,
//     se salta la mano), `recargas` (la suma en HC) y `cancelada` (`null`, o el pedido cancelado por
//     saldo con la MANO en que se canceló: la versión no sirve, porque `jugar` de la función la
//     reescribe cuando aplica abandonos en la misma llamada).
//   · Sentado fuera, el motor lo lleva `eliminated` (no paga el ante, no recibe cartas ni turno y la
//     rotación lo salta) y conserva su residuo: `empezarMano` no lo liquida y `sentados()` lo cuenta
//     (R2). La vista lo publica `eliminated: false`, `folded: true` y sin cartas.
//   · El saldo no está en el estado: llega con la llamada (`{ ahora, saldos }`) y nunca se guarda.
//   · El dinero: pilas + pozo + cobrado es constante MÁS lo recargado. Cada recarga emite el efecto
//     `recarga { asiento, monto, mano }`, que la base aplica después de `mano_cerrada` con la clave
//     `recarga_pvp:<sala>:<uid>:<mano>`: un asiento recarga a lo sumo una vez por pausa.

import {
  PHASES, advanceFromDeal, applyBetAction, applyDiscard, createInitialState, startHand,
} from '../engine/gameEngine.js'
import { costoDe, esLegal, ganadoresPorCapa, repartirCapas } from '../engine/pozos.js'
import { N_AUSENCIA } from '../config/esperas.js'
import { MOTIVOS as M } from './motivos.js'
import { compactarAsientos } from './asientos.js'
import { ajileiDe, ganadorDeMano, huboRevelacion } from './ganador.js'
import {
  CARTAS_POR_ASIENTO, ETAPAS, abrirRonda, cerrar, eligieronTodos, siguienteRonda, voltear,
} from './sorteo.js'
import {
  CLASES, ESPERA_AVISO_SALIDA_MS, ESPERA_BARAJADO_MS, ESPERA_ELECCION_MS, ESPERA_OFERTA_RECARGA_MS, ESPERA_PAUSA_ANUNCIO_MS,
  ESPERA_TURNO_MS, ESPERA_VOLTEO_MS, RITMOS, esperaManoSiguiente, esperaPrimerReparto, esperaRepartoSorteo,
  esperaReposicion, esperaSegundoReparto, llevaAnuncio,
} from './reloj.js'

export const ENTRADAS = Object.freeze({ corta: 15, llena: 50 })

export const APUESTAS = Object.freeze([50, 100, 200, 500, 1000, 2000, 5000])

export const ACCIONES_ARBITRO = Object.freeze([
  'elegir_carta_sorteo', 'apostar', 'descartar', 'reclamar_vencimiento', 'abandonar', 'volver_anuncio',
  'recargar', 'pedir_recarga', 'anular_recarga',
])

const RECARGAS = ['recargar', 'pedir_recarga', 'anular_recarga']

// C-4: éstas se validan contra la ronda o la fase abierta, no contra la versión. La recarga se
// valida contra la `mano`: durante la mano la versión cambia sin parar.
const SIMULTANEAS = ['elegir_carta_sorteo', 'descartar', 'volver_anuncio', ...RECARGAS]

// Las que dicen que el asiento está: ponen a 0 su cuenta de ausencia (contrato §6).
const PROPIAS = ['elegir_carta_sorteo', 'apostar', 'descartar', 'volver_anuncio', ...RECARGAS]

// v1.3 · dónde está un asiento respecto a la recarga.
export const FUERA = Object.freeze({ OFERTA: 'oferta', MANO: 'mano' })
export const CANCELADA_SALDO = 'saldo'

const nulos = (n) => Array(n).fill(null)

export const partidaTerminada = (estado) => estado.motor.phase === PHASES.GAME_OVER

export const sorteoAbierto = (estado) => estado.sorteo.etapa !== ETAPAS.CERRADO

const en = (clase, hora) => ({ clase, hora })

const cuantosNoRetirados = (motor) => motor.players.filter((p) => !p.folded).length

const FASES_APUESTA = [PHASES.BET_1, PHASES.BET_2, PHASES.BET_3]

const fueraDe = (a) => a.fuera ?? null

// R2 · sentado es quien no abandonó ni quedó eliminado. Quien quebró en la mano que se
// acaba de cerrar sigue sentado hasta que `startHand` lo elimina. v1.3 · quien está sentado
// fuera (el motor lo lleva eliminado) sigue sentado: decide en la pausa (Reglas v1.9 §8.2).
const sentados = ({ motor, asientos }) => asientos.filter((a, i) => (
  !a.abandonado && (!motor.players[i].eliminated || fueraDe(a) !== null)
)).length

const rechazo = (estado, motivo) => ({
  estado,
  respuesta: { ok: false, motivo, version: estado.version },
  efectos: [],
})

// Toda acción con efecto sube la versión en 1.
function confirmar({ estado, efectos }) {
  const version = estado.version + 1
  return { estado: { ...estado, version }, respuesta: { ok: true, version }, efectos }
}

// ── Salir de la mesa ────────────────────────────────────────────────────────

function liquidar(estado, sale) {
  const efectos = []
  const asientos = estado.asientos.map((a, i) => {
    if (a.cobrado !== null || !sale(a, i)) return a
    const monto = estado.motor.players[i].chips
    efectos.push({ tipo: 'salida', asiento: i, monto })
    // v1.3 · quien cobra ya no decide ni tiene nada pedido.
    return { ...a, cobrado: monto, ...(fueraDe(a) !== null || a.pedida ? { fuera: null, pedida: false } : {}) }
  })
  const players = estado.motor.players.map((p, i) => (asientos[i].cobrado === null ? p : { ...p, chips: 0 }))
  return { estado: { ...estado, asientos, motor: { ...estado.motor, players } }, efectos }
}

// Con el dinero cobrado, el asiento sale: eliminado, y `startHand` ya no lo cuenta.
function sacarAbandonados(estado) {
  const { estado: liquidado, efectos } = liquidar(estado, (a) => a.abandonado)
  const motor = {
    ...liquidado.motor,
    players: liquidado.motor.players.map((p, i) => (
      liquidado.asientos[i].abandonado ? { ...p, eliminated: true } : p
    )),
  }
  return { estado: { ...liquidado, motor }, efectos }
}

// ── La ausencia ─────────────────────────────────────────────────────────────
// Cuenta el reloj, reclame quien reclame. Al llegar a `N_AUSENCIA` queda abandonado antes
// de resolver el vencimiento: así, si esto cierra la mano, su pila va solo en su salida.
const contarVencidos = (estado, vencidos) => ({
  ...estado,
  asientos: estado.asientos.map((a, i) => {
    if (!vencidos.includes(i)) return a
    const cuenta = (a.vencidos ?? 0) + 1
    return { ...a, vencidos: cuenta, abandonado: a.abandonado || cuenta >= N_AUSENCIA }
  }),
})

// ── La recarga PvP (v1.3) ───────────────────────────────────────────────────

export const recargaActiva = (estado) => Number.isInteger(estado.entrada) && estado.entrada > 0

const PAUSAS_ENTRE_MANOS = [CLASES.MANO_SIGUIENTE, CLASES.PAUSA_ANUNCIO, CLASES.OFERTA_RECARGA]

/** Entre una mano y otra: la mano cerrada y su pausa, la de anuncio o la retención de la oferta. */
export const enPausaEntreManos = (estado) => (
  !sorteoAbierto(estado) && estado.motor.phase === PHASES.PAYOUT && PAUSAS_ENTRE_MANOS.includes(estado.vencimiento?.clase)
)

// El saldo llega con la llamada, nunca en el estado. Sin él, no alcanza.
const saldoDe = (estado, i) => {
  const s = Number(estado.saldos?.[i])
  return Number.isFinite(s) ? s : 0
}

const conAsiento = (estado, i, cambios) => ({
  ...estado,
  asientos: estado.asientos.map((a, j) => (j === i ? { ...a, ...cambios } : a)),
})

// La pila vuelve a la entrada. Sentado fuera, vuelve a la mesa (el motor deja de darlo por
// eliminado antes del siguiente `startHand`). `aplicarRecarga` del motor no se usa (D2).
function aplicarRecarga(estado, i) {
  const monto = estado.entrada - estado.motor.players[i].chips
  const players = estado.motor.players.map((p, j) => (j === i ? { ...p, chips: estado.entrada, eliminated: false } : p))
  const recargado = conAsiento({ ...estado, motor: { ...estado.motor, players } }, i, {
    fuera: null, pedida: false, recargas: (estado.asientos[i].recargas ?? 0) + monto,
  })
  return { estado: recargado, efecto: { tipo: 'recarga', asiento: i, monto, mano: estado.motor.handCount } }
}

// D5 · el pedido se aplica al cerrarse la mano, en la misma jugada. Se cancela en silencio si la
// pila ya no está por debajo de la entrada o si la partida termina en esta jugada (R2); con
// `cancelada` si el saldo no alcanza.
function resolverPedidos(estado) {
  if (!recargaActiva(estado)) return { estado, efectos: [] }
  const quedan = sentados(estado) >= 2
  let actual = estado
  const efectos = []
  estado.asientos.forEach((a, i) => {
    if (!a.pedida) return
    const monto = actual.entrada - actual.motor.players[i].chips
    if (a.cobrado !== null || a.abandonado || !quedan || monto <= 0) {
      actual = conAsiento(actual, i, { pedida: false })
    } else if (saldoDe(actual, i) < monto) {
      actual = conAsiento(actual, i, { pedida: false, cancelada: { motivo: CANCELADA_SALDO, mano: actual.motor.handCount } })
    } else {
      const hecho = aplicarRecarga(actual, i)
      actual = hecho.estado
      efectos.push(hecho.efecto)
    }
  })
  return { estado: actual, efectos }
}

// Quien no cubre el ante de la mano siguiente decide: la oferta (§8.1).
const abrirOfertas = (estado) => (!recargaActiva(estado) ? estado : {
  ...estado,
  asientos: estado.asientos.map((a, i) => {
    const p = estado.motor.players[i]
    const quebro = a.cobrado === null && !a.abandonado && !p.eliminated && fueraDe(a) === null && p.chips < estado.motor.unit
    return quebro ? { ...a, fuera: FUERA.OFERTA } : a
  }),
})

const indecisos = (estado) => estado.asientos.flatMap((a, i) => (
  fueraDe(a) !== null && a.cobrado === null && !a.abandonado ? [i] : []
))

// ── La mano, por fases ──────────────────────────────────────────────────────

function cerrarMano(estado, ahora) {
  const { motor } = estado
  const ganador = ganadorDeMano(motor)
  const { estado: liquidado, efectos } = sacarAbandonados(estado)
  const cierre = {
    tipo: 'mano_cerrada',
    mano: motor.handCount,
    ganador,
    sentados: motor.handRules.ruleN,
    ajilei: ajileiDe(motor.players[ganador].cards, motor.handRules),
    pilas: liquidado.motor.players.map((p) => p.chips),
  }
  // v1.3 · las pilas del cierre van sin la recarga: el efecto `recarga` la suma después.
  const { estado: recargado, efectos: recargas } = resolverPedidos(liquidado)
  return {
    estado: { ...abrirOfertas(recargado), vencimiento: en(CLASES.MANO_SIGUIENTE, ahora + esperaManoSiguiente(huboRevelacion(motor))) },
    efectos: [cierre, ...efectos, ...recargas],
  }
}

// El motor acaba de moverse: lo que toca ahora depende de la fase en que quedó, que
// puede ser cualquiera porque `abrirApuesta` se salta las rondas que no se juegan.
function trasMoverMotor(estado, motor, ahora) {
  const nuevo = { ...estado, motor }
  switch (motor.phase) {
    case PHASES.BET_1:
    case PHASES.BET_2:
    case PHASES.BET_3:
      // El abandonado no gasta el reloj de nadie. El motor no da turno a un all-in.
      // Esta retirada no pisa `ultimaAccion`: la jugada que la provocó sigue siendo la última.
      // Desde la v1.2 `retirarEnMano` lo retira antes; esto queda de guardia, y nunca sobre
      // un retirado, que el motor rechazaría y dejaría esta recursión sin fin.
      if (estado.asientos[motor.activePlayerIndex].abandonado && !motor.players[motor.activePlayerIndex].folded) {
        return trasMoverMotor(estado, applyBetAction(motor, motor.activePlayerIndex, 'retirarse'), ahora)
      }
      return { estado: { ...nuevo, vencimiento: en(CLASES.TURNO, ahora + ESPERA_TURNO_MS) }, efectos: [] }
    case PHASES.DEAL_3: {
      const cartas = 3 * cuantosNoRetirados(motor)
      return { estado: { ...nuevo, vencimiento: en(CLASES.REPARTO, ahora + esperaSegundoReparto(cartas, estado.ritmo)) }, efectos: [] }
    }
    case PHASES.DISCARD:
      return seguirDescarte({ ...nuevo, vencimiento: en(CLASES.DESCARTE, ahora + ESPERA_TURNO_MS) }, ahora)
    case PHASES.PAYOUT:
      return cerrarMano(nuevo, ahora)
    default:
      throw new Error(`MOT-1 · fase inesperada tras mover el motor: ${motor.phase}`)
  }
}

// El dato de la jugada, no su frase (K-12). `puesto` y la apuesta se leen antes de mover
// el motor, porque cerrar la ronda pone `currentBet` a cero.
function moverApuesta(estado, asiento, tipo, k, porReloj, ahora) {
  const { motor } = estado
  const puesto = costoDe(motor, asiento, tipo, k)
  const apuestaAntes = motor.currentBet
  const apuestaDespues = tipo === 'apostar' ? puesto : tipo === 'subir' ? apuestaAntes + k * motor.unit : apuestaAntes
  const ultimaAccion = { asiento, tipo, puesto, apuestaAntes, apuestaDespues, porReloj }
  return trasMoverMotor({ ...estado, ultimaAccion }, applyBetAction(motor, asiento, tipo, k), ahora)
}

function empezarMano(estado, motorPrevio, ahora) {
  const motor = startHand(motorPrevio)
  const base = { ...estado, motor, descarte: nulos(motor.numPlayers), descartaron: null, ultimaAccion: null }
  if (motor.phase === PHASES.GAME_OVER) {
    const { estado: fin, efectos } = liquidar(base, () => true)
    return {
      estado: { ...fin, vencimiento: null },
      efectos: [...efectos, { tipo: 'partida_terminada', ganador: motor.winner }],
    }
  }
  // v1.3 · quien se salta la mano sentado fuera no sale: conserva su residuo.
  const sentadoFuera = (i) => fueraDe(estado.asientos[i]) === FUERA.MANO
  const { estado: conEliminados, efectos } = liquidar(base, (_a, i) => motor.players[i].eliminated && !sentadoFuera(i))
  const salenAhora = motor.players.some((p, i) => p.eliminated && !motorPrevio.players[i].eliminated && !sentadoFuera(i))
  const vencimiento = salenAhora
    ? en(CLASES.AVISO_SALIDA, ahora + ESPERA_AVISO_SALIDA_MS)
    : en(CLASES.BARAJADO, ahora + ESPERA_BARAJADO_MS)
  return { estado: { ...conEliminados, vencimiento }, efectos }
}

// ── La pausa de anuncio ─────────────────────────────────────────────────────
// Contrato §6, «Publicidad». Va antes de `startHand`: la fase sigue en `PAYOUT`, no hay
// cartas nuevas y quien abandona cobra sin pagar el ante.
function sigue({ motor, asientos }, i) {
  const p = motor.players[i]
  return !p.eliminated && !asientos[i].abandonado && p.chips >= motor.unit
}

const cuantosSiguen = (estado) => estado.asientos.filter((_a, i) => sigue(estado, i)).length

const veAnuncio = (estado, i) => sigue(estado, i) && !estado.asientos[i].sinAnuncio

const pausaAbierta = ({ vencimiento }) => vencimiento?.clase === CLASES.PAUSA_ANUNCIO

function trasManoSiguiente(estado, ahora) {
  const { motor } = estado
  const hayPausa = llevaAnuncio(motor.handCount)
    && cuantosSiguen(estado) > 1
    && estado.asientos.some((_a, i) => veAnuncio(estado, i))
  if (!hayPausa) return resolverOfertas(estado, ahora)

  // v1.3 · la oferta sigue viva en la pausa de anuncio (D7): quien decide no sale aquí.
  const noCubre = (a, i) => !motor.players[i].eliminated && motor.players[i].chips < motor.unit && fueraDe(a) === null
  const { estado: liquidado, efectos } = liquidar(estado, noCubre)
  return {
    estado: {
      ...liquidado,
      asientos: liquidado.asientos.map((a, i) => ({ ...a, enAnuncio: veAnuncio(estado, i) })),
      vencimiento: en(CLASES.PAUSA_ANUNCIO, ahora + ESPERA_PAUSA_ANUNCIO_MS),
    },
    efectos,
  }
}

function cerrarPausa(estado, ahora) {
  const asientos = estado.asientos.map((a) => ({ ...a, enAnuncio: false }))
  return resolverOfertas({ ...estado, asientos }, ahora)
}

// v1.3 · D8 · vence la pausa entre manos (o la de anuncio) con alguien decidiendo.
//   · Si la mesa sigue sin él (2 o más cubren el ante): la primera vez se salta la mano sentado
//     fuera; la segunda, sale y cobra su residuo, como quebrado y no como abandonado («Te quedaste
//     sin fichas», §8.3 fila 2).
//   · Si no (R2, retención): la mesa espera `oferta_recarga`; al vencer, salen todos los que no
//     decidieron y `startHand` cierra la partida. Ese vencimiento no cuenta para la ausencia (D7).
// Quien sale vuelve a la mano sin fuera y sin el `eliminated` del motor: `startHand` lo elimina
// por no cubrir el ante, `empezarMano` le paga el residuo y hay aviso de salida, como siempre.
function resolverOfertas(estado, ahora) {
  const quienes = indecisos(estado)
  if (quienes.length === 0) return empezarMano(estado, estado.motor, ahora)
  const juegan = cuantosSiguen(estado)
  if (juegan < 2 && estado.vencimiento?.clase !== CLASES.OFERTA_RECARGA) {
    return { estado: { ...estado, vencimiento: en(CLASES.OFERTA_RECARGA, ahora + ESPERA_OFERTA_RECARGA_MS) }, efectos: [] }
  }
  const asientos = estado.asientos.map((a, i) => {
    if (!quienes.includes(i)) return a
    return juegan >= 2 && fueraDe(a) === FUERA.OFERTA ? { ...a, fuera: FUERA.MANO } : { ...a, fuera: null, pedida: false }
  })
  const players = estado.motor.players.map((p, i) => (quienes.includes(i) && asientos[i].fuera === null ? { ...p, eliminated: false } : p))
  return empezarMano({ ...estado, asientos }, { ...estado.motor, players }, ahora)
}

// En la retención, quien recarga la resuelve si ya no queda nadie decidiendo o si la mesa ya
// puede seguir: se juega la mano siguiente en la misma jugada.
const retencionResuelta = (estado) => estado.vencimiento?.clase === CLASES.OFERTA_RECARGA
  && (indecisos(estado).length === 0 || cuantosSiguen(estado) >= 2)

// Se acaba sola cuando ya no queda a quién esperar, o nadie con quien jugar.
function seguirPausa(estado, ahora) {
  const nadieEnAnuncio = !estado.asientos.some((a) => a.enAnuncio)
  return nadieEnAnuncio || cuantosSiguen(estado) <= 1 ? cerrarPausa(estado, ahora) : { estado, efectos: [] }
}

// ── El descarte ─────────────────────────────────────────────────────────────

function aplicarDescartes(estado, ahora) {
  const { motor, descarte } = estado
  const porAsiento = {}
  const descartaron = nulos(motor.numPlayers)
  motor.players.forEach((p, i) => {
    if (p.folded) return
    porAsiento[i] = descarte[i] ?? []
    descartaron[i] = porAsiento[i].length
  })
  // Las cartas nuevas van ya a la vista; todo lo demás espera a que venza la reposición,
  // porque `applyDiscard` puede abrir `BET_3` o llegar al showdown y pagar (contrato §6).
  const motorTrasDescarte = applyDiscard(motor, porAsiento)
  const players = motor.players.map((p, i) => ({ ...p, cards: motorTrasDescarte.players[i].cards }))
  return {
    estado: {
      ...estado,
      motor: { ...motor, players, deck: motorTrasDescarte.deck },
      motorTrasDescarte,
      descarte: motor.players.map((p, i) => (p.folded ? null : porAsiento[i])),
      descartaron,
      vencimiento: en(CLASES.REPOSICION, ahora + esperaReposicion(Math.max(0, ...descartaron))),
    },
    efectos: [],
  }
}

function trasReposicion({ motorTrasDescarte, ...estado }, ahora) {
  return trasMoverMotor({ ...estado, descarte: nulos(motorTrasDescarte.numPlayers) }, motorTrasDescarte, ahora)
}

// Sin nadie pendiente, se aplica sin esperar. El abandonado ya no descarta: está retirado
// (v1.2, `retirarEnMano`).
function seguirDescarte(estado, ahora) {
  const { motor, descarte } = estado
  const faltan = motor.players.some((p, i) => !p.folded && descarte[i] === null)
  return faltan ? { estado, efectos: [] } : aplicarDescartes(estado, ahora)
}

// ── El sorteo ───────────────────────────────────────────────────────────────

const conVolteo = (estado, sorteo, ahora) => ({
  ...estado,
  sorteo: voltear(sorteo),
  vencimiento: en(CLASES.VOLTEO_SORTEO, ahora + ESPERA_VOLTEO_MS),
})

// El abandonado elige al instante la posición 0, la misma que al vencer. Sin nadie
// pendiente, voltea.
function seguirEleccion(estado, ahora) {
  const { sorteo, asientos } = estado
  const elecciones = sorteo.elecciones.map((e, i) => (
    e === null && asientos[i].abandonado && sorteo.participan.includes(i) ? 0 : e
  ))
  const anotado = { ...sorteo, elecciones }
  return eligieronTodos(anotado) ? conVolteo(estado, anotado, ahora) : { ...estado, sorteo: anotado }
}

function trasVolteo(estado, ahora) {
  const { sorteo, motor } = estado
  if (sorteo.mano === null) {
    const nueva = siguienteRonda(sorteo)
    return {
      estado: { ...estado, sorteo: nueva, vencimiento: en(CLASES.BARAJADO_SORTEO, ahora + ESPERA_BARAJADO_MS) },
      efectos: [],
    }
  }
  // El Pie se deriva: `startHand`, en la primera mano, lee `pieIndex` y la Mano es el
  // siguiente vivo (`gameEngine.js:542-543`).
  const N = motor.numPlayers
  const fijado = { ...motor, pieIndex: (sorteo.mano - 1 + N) % N, manoIndex: sorteo.mano }
  return empezarMano({ ...estado, sorteo: cerrar(sorteo) }, fijado, ahora)
}

// ── Las acciones ────────────────────────────────────────────────────────────
// Cada una devuelve el motivo, si rechaza, o `{ estado, efectos }`.

function elegirCartaSorteo(estado, asiento, peticion, ahora) {
  const { sorteo } = estado
  if (sorteo.etapa !== ETAPAS.ELECCION || peticion.ronda !== sorteo.ronda) return M.FASE
  if (!sorteo.participan.includes(asiento)) return M.NO_PARTICIPA
  if (sorteo.elecciones[asiento] !== null) return M.YA_ELIGIO
  const { carta } = peticion
  if (!Number.isInteger(carta) || carta < 0 || carta >= CARTAS_POR_ASIENTO) return M.CARTA_INVALIDA

  const elecciones = sorteo.elecciones.map((e, i) => (i === asiento ? carta : e))
  return { estado: seguirEleccion({ ...estado, sorteo: { ...sorteo, elecciones } }, ahora), efectos: [] }
}

function apostar(estado, asiento, peticion, ahora) {
  const { tipo } = peticion
  // `k` por defecto vale 1 en `esLegal`: sin `null`, un `apostar` sin `k` sería legal.
  const k = tipo === 'apostar' || tipo === 'subir' ? peticion.k ?? null : undefined
  const juicio = esLegal(estado.motor, asiento, tipo, k)
  if (!juicio.ok) return juicio.motivo
  return moverApuesta(estado, asiento, tipo, k, false, ahora)
}

function indicesValidos(indices, cartas, tope) {
  return Array.isArray(indices)
    && indices.length <= tope
    && new Set(indices).size === indices.length
    && indices.every((i) => Number.isInteger(i) && i >= 0 && i < cartas)
}

function descartar(estado, asiento, peticion, ahora) {
  const { motor } = estado
  if (motor.phase !== PHASES.DISCARD || peticion.mano !== motor.handCount) return M.FASE
  const jugador = motor.players[asiento]
  if (jugador.folded) return M.RETIRADO
  if (estado.descarte[asiento] !== null) return M.YA_DESCARTO
  if (!indicesValidos(peticion.indices, jugador.cards.length, motor.handRules.maxDiscard)) return M.DESCARTE_INVALIDO

  const descarte = estado.descarte.map((d, i) => (i === asiento ? peticion.indices : d))
  return seguirDescarte({ ...estado, descarte }, ahora)
}

function volverAnuncio(estado, asiento, peticion, ahora) {
  if (!pausaAbierta(estado) || peticion.mano !== estado.motor.handCount) return M.FASE
  if (!estado.asientos[asiento].enAnuncio) return veAnuncio(estado, asiento) ? M.YA_VOLVIO : M.NO_PARTICIPA
  const asientos = estado.asientos.map((a, i) => (i === asiento ? { ...a, enAnuncio: false } : a))
  return seguirPausa({ ...estado, asientos }, ahora)
}

// v1.3 · D3 · en la pausa entre manos, con la oferta o la voluntaria, se aplica en el acto.
// Sentado fuera durante la mano, queda PEDIDA para la pausa siguiente (P-6): el dinero nunca se
// mueve dentro de una mano. Dentro de la mano, sin estar fuera, es `pedir_recarga`.
function recargar(estado, asiento, peticion, ahora) {
  if (sorteoAbierto(estado) || peticion.mano !== estado.motor.handCount) return M.FASE
  if (!recargaActiva(estado)) return M.SIN_RECARGA
  const a = estado.asientos[asiento]
  if (a.cobrado !== null) return M.SIN_RECARGA
  if (manoEnCurso(estado)) {
    if (fueraDe(a) !== FUERA.MANO) return M.FASE
    if (a.pedida) return M.YA_PEDIDA
    return { estado: conAsiento(estado, asiento, { pedida: true }), efectos: [] }
  }
  if (!enPausaEntreManos(estado)) return M.FASE
  const monto = estado.entrada - estado.motor.players[asiento].chips
  if (monto <= 0) return M.SIN_RECARGA
  if (saldoDe(estado, asiento) < monto) return M.SALDO_INSUFICIENTE
  const { estado: recargado, efecto } = aplicarRecarga(estado, asiento)
  if (!retencionResuelta(recargado)) return { estado: recargado, efectos: [efecto] }
  const sigue = resolverOfertas(recargado, ahora)
  return { estado: sigue.estado, efectos: [efecto, ...sigue.efectos] }
}

// Durante la mano, con la pila por debajo de la entrada: se aplica al cerrarse (D5).
function pedirRecarga(estado, asiento, peticion) {
  if (!manoEnCurso(estado) || peticion.mano !== estado.motor.handCount) return M.FASE
  const a = estado.asientos[asiento]
  if (!recargaActiva(estado) || a.cobrado !== null) return M.SIN_RECARGA
  if (a.pedida) return M.YA_PEDIDA
  if (estado.motor.players[asiento].chips >= estado.entrada) return M.SIN_RECARGA
  return { estado: conAsiento(estado, asiento, { pedida: true }), efectos: [] }
}

function anularRecarga(estado, asiento, peticion) {
  if (!manoEnCurso(estado) || peticion.mano !== estado.motor.handCount) return M.FASE
  if (!estado.asientos[asiento].pedida) return M.SIN_PEDIDO
  return { estado: conAsiento(estado, asiento, { pedida: false }), efectos: [] }
}

function alVencerTurno(estado, ahora) {
  const { motor } = estado
  const asiento = motor.activePlayerIndex
  const contado = contarVencidos(estado, [asiento])
  // El vencimiento que lo abandona lo retira, como a cualquier abandonado en su turno.
  const pasa = !contado.asientos[asiento].abandonado && esLegal(motor, asiento, 'pasar').ok
  return terminarSiQuedaUno(moverApuesta(contado, asiento, pasa ? 'pasar' : 'retirarse', undefined, true, ahora))
}

// El vencimiento que lo abandona lo retira (R1), y a los demás que faltan les descarta vacío.
function alVencerDescarte(estado, ahora) {
  const faltan = estado.motor.players.flatMap((p, i) => (!p.folded && estado.descarte[i] === null ? [i] : []))
  const retirado = retirarEnMano(contarVencidos(estado, faltan), ahora)
  const { estado: e } = retirado
  if (e.motor.phase !== PHASES.DISCARD || e.vencimiento?.clase !== CLASES.DESCARTE) return terminarSiQuedaUno(retirado)
  const aplicado = aplicarDescartes(e, ahora)
  return { estado: aplicado.estado, efectos: [...retirado.efectos, ...aplicado.efectos] }
}

function reclamarVencimiento(estado, _asiento, _peticion, ahora) {
  const { vencimiento: v, motor, sorteo } = estado
  if (!v || ahora < v.hora) return M.VENCIMIENTO_NO_CUMPLIDO

  switch (v.clase) {
    case CLASES.BARAJADO_SORTEO:
      // v1.3 · se reparte de una en una a quienes participan en la ronda (en un desempate,
      // solo los empatados): la espera depende de cuántos son.
      return {
        estado: {
          ...estado,
          sorteo: { ...sorteo, etapa: ETAPAS.REPARTO },
          vencimiento: en(CLASES.REPARTO_SORTEO, ahora + esperaRepartoSorteo(sorteo.participan.length)),
        },
        efectos: [],
      }
    case CLASES.REPARTO_SORTEO:
      return {
        estado: seguirEleccion({
          ...estado,
          sorteo: { ...sorteo, etapa: ETAPAS.ELECCION },
          vencimiento: en(CLASES.ELECCION_SORTEO, ahora + ESPERA_ELECCION_MS),
        }, ahora),
        efectos: [],
      }
    case CLASES.ELECCION_SORTEO:
      // No cuenta para la ausencia: quien no eligió se queda con la posición 0, sin falta.
      return { estado: conVolteo(estado, sorteo, ahora), efectos: [] }
    case CLASES.VOLTEO_SORTEO:
      return trasVolteo(estado, ahora)
    case CLASES.AVISO_SALIDA:
      return { estado: { ...estado, vencimiento: en(CLASES.BARAJADO, ahora + ESPERA_BARAJADO_MS) }, efectos: [] }
    case CLASES.BARAJADO:
      return {
        estado: {
          ...estado,
          vencimiento: en(CLASES.REPARTO, ahora + esperaPrimerReparto(2 * cuantosNoRetirados(motor), estado.ritmo)),
        },
        efectos: [],
      }
    case CLASES.REPARTO:
      return trasMoverMotor(estado, advanceFromDeal(motor), ahora)
    case CLASES.TURNO:
      return alVencerTurno(estado, ahora)
    case CLASES.DESCARTE:
      return alVencerDescarte(estado, ahora)
    case CLASES.REPOSICION:
      return trasReposicion(estado, ahora)
    case CLASES.MANO_SIGUIENTE:
      return trasManoSiguiente(estado, ahora)
    case CLASES.PAUSA_ANUNCIO:
      return cerrarPausa(estado, ahora)
    case CLASES.OFERTA_RECARGA:
      // No cuenta para la ausencia (D7): quien no decidió sale con su residuo.
      return resolverOfertas(estado, ahora)
    default:
      throw new Error(`MOT-1 · vencimiento desconocido: ${v.clase}`)
  }
}

// «Mano en curso» incluye el barajado y el reparto de una mano con el ante ya cobrado: la
// fase ya no es `PAYOUT` desde `startHand` (Reglas v1.7 §8.2, R1).
const manoEnCurso = (estado) => !sorteoAbierto(estado) && estado.motor.phase !== PHASES.PAYOUT

// ── El abandono (regla C-8 del Contrato v1.2) ───────────────────────────────

const plegar = (motor, quienes) => ({
  ...motor,
  players: motor.players.map((p, i) => (quienes.includes(i) ? { ...p, folded: true } : p)),
})

// La copia de `primerTurno` (`gameEngine.js:182-190`, no exportada): el primero desde la
// Mano que puede actuar. La ronda que se abra tras un reparto no puede caer en un retirado.
function primerTurno(players, desde) {
  const N = players.length
  for (let k = 0; k < N; k++) {
    const i = (desde + k) % N
    if (!players[i].folded && !players[i].allIn && players[i].chips > 0) return i
  }
  return desde
}

// La ruta de los retiros: el mismo resultado que `resolveWinner` (`gameEngine.js:198-207`),
// con las piezas de `pozos.js`. Una capa sin elegibles vuelve a quien la puso (D-7).
function pagarAlUltimo(motor) {
  const ultimo = motor.players.findIndex((p) => !p.folded)
  const ganadores = ganadoresPorCapa(motor, (_p, i) => (i === ultimo ? 1 : 0))
  return { ...motor, phase: PHASES.PAYOUT, pot: 0, winner: ultimo, players: repartirCapas(motor, ganadores) }
}

// R1 · todo abandonado que siga en la mano se retira en el acto, en cualquier fase. Si queda
// uno solo, cobra el pozo y la mano se cierra; si quedan dos o más, la mano sigue sin él. Su
// pila no se mueve hasta el cierre: ahí la cobra, sin nada del pozo (R3).
function retirarEnMano(estado, ahora) {
  const { motor, asientos, vencimiento } = estado
  let fuera = motor.players.flatMap((p, i) => (!p.folded && asientos[i].abandonado ? [i] : []))
  // Si se van a la vez todos los que siguen en la mano (el 3.er vencimiento de varios en el
  // mismo descarte), el más cercano a la Mano no se retira: alguien cobra el pozo, como en
  // el motor, donde el último en pie no se retira. Cobra al cerrar, como todo abandonado.
  if (fuera.length > 0 && fuera.length === cuantosNoRetirados(motor)) {
    const N = motor.numPlayers
    const cercano = Array.from({ length: N }, (_, k) => (motor.manoIndex + k) % N).find((i) => fuera.includes(i))
    fuera = fuera.filter((i) => i !== cercano)
  }
  if (fuera.length === 0 || !manoEnCurso(estado)) return { estado, efectos: [] }

  // En su turno de apuesta, el camino de siempre: el motor lo retira y sigue la ronda.
  const activo = motor.activePlayerIndex
  const enSuTurno = FASES_APUESTA.includes(motor.phase) && fuera.includes(activo)
  const plegado = plegar(motor, fuera.filter((i) => !(enSuTurno && i === activo)))
  const descarte = estado.descarte.map((d, i) => (fuera.includes(i) ? null : d))
  const base = { ...estado, motor: plegado, descarte }

  if (enSuTurno) return trasMoverMotor(base, applyBetAction(plegado, activo, 'retirarse'), ahora)

  if (cuantosNoRetirados(plegado) === 1) {
    // Lo calculado para la reposición ya no vale: la mano se cierra aquí.
    const sinCalculo = { ...base, descarte: nulos(motor.numPlayers), motor: pagarAlUltimo(plegado) }
    delete sinCalculo.motorTrasDescarte
    return cerrarMano(sinCalculo, ahora)
  }
  // En la reposición, lo calculado (la apuesta 3 o el showdown) se recalcula sin él. Las
  // cartas nuevas ya están en su sitio: nadie roba otra vez.
  if (vencimiento?.clase === CLASES.REPOSICION) {
    return { estado: { ...base, motorTrasDescarte: applyDiscard(plegado, {}) }, efectos: [] }
  }
  if (motor.phase === PHASES.DISCARD) return seguirDescarte(base, ahora)
  // Repartiendo: la ronda que viene no puede abrir en él.
  if (plegado.players[activo].folded) {
    return { estado: { ...base, motor: { ...plegado, activePlayerIndex: primerTurno(plegado.players, plegado.manoIndex) } }, efectos: [] }
  }
  return { estado: base, efectos: [] }
}

// R2 · con menos de 2 sentados, la partida termina en la misma jugada, sin empezar otra
// mano. Si la mano acaba de cerrarse, el fin conserva sus cartas y sus capas: la vista
// publica su resultado (`vista.js`, `resultadoVisto`) y el cliente enseña el pago antes de
// la pantalla final.
function terminarSiQuedaUno({ estado, efectos }) {
  if (estado.motor.phase !== PHASES.PAYOUT || pausaAbierta(estado) || sentados(estado) >= 2) return { estado, efectos }
  const { motor, asientos } = estado
  const ganador = motor.players.findIndex((p, i) => (!p.eliminated || fueraDe(asientos[i]) !== null) && !asientos[i].abandonado)
  const fin = {
    ...estado,
    motor: { ...motor, phase: PHASES.GAME_OVER, winner: ganador >= 0 ? ganador : null, aliveCount: ganador >= 0 ? 1 : 0 },
    descarte: nulos(motor.numPlayers),
  }
  const { estado: liquidado, efectos: salidas } = liquidar(fin, () => true)
  return {
    estado: { ...liquidado, vencimiento: null },
    efectos: [...efectos, ...salidas, { tipo: 'partida_terminada', ganador: fin.motor.winner }],
  }
}

// Con mano, se retira y cobra al cerrarse. Sin mano, sale ya. v1.3 · D7 · un pedido o una oferta
// abiertos se limpian: el pedido no movió dinero, y cobra su pila o su residuo por la ruta de siempre.
function marcarAbandono(estado, asiento, ahora) {
  const asientos = estado.asientos.map((a, i) => (i !== asiento ? a : {
    ...a, abandonado: true, enAnuncio: false, ...(fueraDe(a) !== null || a.pedida ? { fuera: null, pedida: false } : {}),
  }))
  const marcado = { ...estado, asientos }
  if (manoEnCurso(marcado)) return terminarSiQuedaUno(retirarEnMano(marcado, ahora))

  const { estado: fuera, efectos } = sacarAbandonados(marcado)
  if (pausaAbierta(fuera)) {
    const sigueLaPausa = seguirPausa(fuera, ahora)
    return { estado: sigueLaPausa.estado, efectos: [...efectos, ...sigueLaPausa.efectos] }
  }
  const vivos = fuera.motor.players.filter((p) => !p.eliminated).length
  if (!sorteoAbierto(fuera)) return terminarSiQuedaUno({ estado: fuera, efectos })
  if (vivos > 1) {
    return { estado: fuera.sorteo.etapa === ETAPAS.ELECCION ? seguirEleccion(fuera, ahora) : fuera, efectos }
  }

  // El sorteo se queda sin rivales: `startHand` lo cierra sin repartir (`:522`).
  const fin = empezarMano({ ...fuera, sorteo: cerrar(fuera.sorteo) }, fuera.motor, ahora)
  return { estado: fin.estado, efectos: [...efectos, ...fin.efectos] }
}

const MANEJADORES = {
  elegir_carta_sorteo: elegirCartaSorteo,
  apostar,
  descartar,
  reclamar_vencimiento: reclamarVencimiento,
  abandonar: (estado, asiento, _peticion, ahora) => marcarAbandono(estado, asiento, ahora),
  volver_anuncio: volverAnuncio,
  recargar,
  pedir_recarga: pedirRecarga,
  anular_recarga: anularRecarga,
}

// El saldo leído entra con la llamada y sale antes de guardar: el estado nunca lo lleva.
const conSaldos = (estado, saldos) => (saldos ? { ...estado, saldos } : estado)
function sinSaldos(hecho) {
  if (!('saldos' in hecho.estado)) return hecho
  const estado = { ...hecho.estado }
  delete estado.saldos
  return { ...hecho, estado }
}

function cuentaACero(hecho, asiento) {
  const asientos = hecho.estado.asientos.map((a, i) => (i === asiento ? { ...a, vencidos: 0 } : a))
  return { ...hecho, estado: { ...hecho.estado, asientos } }
}

// ── Lo público ──────────────────────────────────────────────────────────────

/**
 * Las comprobaciones comunes del §2, en su orden, y la acción. La primera que falla
 * decide el motivo. `uid` es lo que dijo el token: sin él, `no_autenticado`.
 *
 * @param {object} estado el de `crearPartida`, o el que devolvió la llamada anterior
 * @param {{ uid: string|null, version: number, accion: string }} peticion y los campos de cada acción
 * @param {{ ahora: number, saldos?: number[] }} reloj la hora del servidor, en ms, y (v1.3) el saldo
 *   de cada asiento según `leer_partida`, para la recarga. No se guarda.
 */
export function aplicarAccion(estado, peticion, { ahora, saldos = null }) {
  const { uid, version, accion } = peticion
  if (!uid) return rechazo(estado, M.NO_AUTENTICADO)
  const asiento = estado.asientos.findIndex((a) => a.uid === uid)
  if (asiento < 0) return rechazo(estado, M.NO_ES_DE_ESTA_MESA)
  if (partidaTerminada(estado)) return rechazo(estado, M.PARTIDA_TERMINADA)
  if (estado.asientos[asiento].abandonado) return rechazo(estado, M.ASIENTO_ABANDONADO)
  if (!SIMULTANEAS.includes(accion) && version !== estado.version) return rechazo(estado, M.VERSION_VIEJA)
  if (!ACCIONES_ARBITRO.includes(accion)) return rechazo(estado, M.DESCONOCIDA)

  const hecho = MANEJADORES[accion](conSaldos(estado, saldos), asiento, peticion, ahora)
  if (typeof hecho === 'string') return rechazo(estado, hecho)
  return confirmar(sinSaldos(PROPIAS.includes(accion) ? cuentaACero(hecho, asiento) : hecho))
}

/**
 * El abandono por la regla de una partida por cuenta (§7). Lo marca el servidor, sin
 * versión del cliente, así que no puede chocar con ella.
 */
export function abandonarPorServidor(estado, uid, { ahora, saldos = null }) {
  const asiento = estado.asientos.findIndex((a) => a.uid === uid)
  if (asiento < 0) return rechazo(estado, M.NO_ES_DE_ESTA_MESA)
  if (partidaTerminada(estado)) return rechazo(estado, M.PARTIDA_TERMINADA)
  if (estado.asientos[asiento].abandonado) return rechazo(estado, M.ASIENTO_ABANDONADO)
  return confirmar(sinSaldos(marcarAbandono(conSaldos(estado, saldos), asiento, ahora)))
}

/**
 * La partida de una sala `activa`: versión 0, sorteo abierto en la ronda 1 y el
 * vencimiento de su barajado (§2, arranque).
 *
 * @param {{ apuesta: number, entrada: 'corta'|'llena', ritmo: 'normal'|'rapido' }} mesa
 * @param {{ asiento: number, uid: string, nombre?: string }[]} sillas las de la sala
 * @param {number} ahora la hora del servidor, en ms
 */
export function crearPartida({ apuesta, entrada, ritmo }, sillas, ahora) {
  if (!APUESTAS.includes(apuesta)) throw new Error(`MOT-1 · apuesta fuera de la tabla: ${apuesta}`)
  if (!Object.hasOwn(ENTRADAS, entrada)) throw new Error(`MOT-1 · entrada desconocida: ${entrada}`)
  if (!Object.values(RITMOS).includes(ritmo)) throw new Error(`MOT-1 · ritmo desconocido: ${ritmo}`)
  if (sillas.length < 2 || sillas.length > 5) throw new Error(`MOT-1 · ${sillas.length} sillas: la mesa es de 2 a 5`)

  const compactos = compactarAsientos(sillas)
  const n = compactos.length
  const motor = createInitialState(apuesta, compactos.map(({ nombre }, i) => ({
    isHuman: true,
    chips: ENTRADAS[entrada] * apuesta,
    name: nombre ?? `Asiento ${i + 1}`,
  })))
  const sorteo = abrirRonda(n, 1, compactos.map((_, i) => i))
  return {
    version: 0,
    ritmo,
    // v1.3 · la pila de entrada: con ella, la recarga está encendida en esta partida.
    entrada: ENTRADAS[entrada] * apuesta,
    asientos: compactos.map((a) => ({
      ...a, abandonado: false, cobrado: null, vencidos: 0, enAnuncio: false, sinAnuncio: false,
      pedida: false, fuera: null, recargas: 0, cancelada: null,
    })),
    sorteo,
    motor,
    descarte: nulos(n),
    descartaron: null,
    ultimaAccion: null,
    vencimiento: en(CLASES.BARAJADO_SORTEO, ahora + ESPERA_BARAJADO_MS),
  }
}
