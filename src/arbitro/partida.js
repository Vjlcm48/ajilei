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

import {
  PHASES, advanceFromDeal, applyBetAction, applyDiscard, createInitialState, startHand,
} from '../engine/gameEngine.js'
import { esLegal } from '../engine/pozos.js'
import { MOTIVOS as M } from './motivos.js'
import { compactarAsientos } from './asientos.js'
import { ajileiDe, ganadorDeMano, huboRevelacion } from './ganador.js'
import {
  CARTAS_POR_ASIENTO, ETAPAS, abrirRonda, cerrar, eligieronTodos, siguienteRonda, voltear,
} from './sorteo.js'
import {
  CLASES, ESPERA_BARAJADO_MS, ESPERA_ELECCION_MS, ESPERA_REPARTO_SORTEO_MS, ESPERA_TURNO_MS,
  ESPERA_VOLTEO_MS, RITMOS, esperaManoSiguiente, esperaPrimerReparto, esperaSegundoReparto,
} from './reloj.js'

export const ENTRADAS = Object.freeze({ corta: 15, llena: 50 })

export const APUESTAS = Object.freeze([50, 100, 200, 500, 1000, 2000, 5000])

export const ACCIONES_ARBITRO = Object.freeze([
  'elegir_carta_sorteo', 'apostar', 'descartar', 'reclamar_vencimiento', 'abandonar',
])

// C-4: éstas se validan contra la ronda o la fase abierta, no contra la versión.
const SIMULTANEAS = ['elegir_carta_sorteo', 'descartar']

const nulos = (n) => Array(n).fill(null)

export const partidaTerminada = (estado) => estado.motor.phase === PHASES.GAME_OVER

export const sorteoAbierto = (estado) => estado.sorteo.etapa !== ETAPAS.CERRADO

const en = (clase, hora) => ({ clase, hora })

const cuantosNoRetirados = (motor) => motor.players.filter((p) => !p.folded).length

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
    return { ...a, cobrado: monto }
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

// ── La mano, por fases ──────────────────────────────────────────────────────

function cerrarMano(estado, ahora) {
  const { motor } = estado
  const ganador = ganadorDeMano(motor)
  const { estado: fuera, efectos } = sacarAbandonados(estado)
  const cierre = {
    tipo: 'mano_cerrada',
    mano: motor.handCount,
    ganador,
    sentados: motor.handRules.ruleN,
    ajilei: ajileiDe(motor.players[ganador].cards, motor.handRules),
    pilas: fuera.motor.players.map((p) => p.chips),
  }
  return {
    estado: { ...fuera, vencimiento: en(CLASES.MANO_SIGUIENTE, ahora + esperaManoSiguiente(huboRevelacion(motor))) },
    efectos: [cierre, ...efectos],
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
      if (estado.asientos[motor.activePlayerIndex].abandonado) {
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

function empezarMano(estado, motorPrevio, ahora) {
  const motor = startHand(motorPrevio)
  const base = { ...estado, motor, descarte: nulos(motor.numPlayers), descartaron: null }
  if (motor.phase === PHASES.GAME_OVER) {
    const { estado: fin, efectos } = liquidar(base, () => true)
    return {
      estado: { ...fin, vencimiento: null },
      efectos: [...efectos, { tipo: 'partida_terminada', ganador: motor.winner }],
    }
  }
  const { estado: conEliminados, efectos } = liquidar(base, (_a, i) => motor.players[i].eliminated)
  return { estado: { ...conEliminados, vencimiento: en(CLASES.BARAJADO, ahora + ESPERA_BARAJADO_MS) }, efectos }
}

function aplicarDescartes(estado, ahora) {
  const { motor, descarte } = estado
  const porAsiento = {}
  const descartaron = nulos(motor.numPlayers)
  motor.players.forEach((p, i) => {
    if (p.folded) return
    porAsiento[i] = descarte[i] ?? []
    descartaron[i] = porAsiento[i].length
  })
  const limpio = { ...estado, descarte: nulos(motor.numPlayers), descartaron }
  return trasMoverMotor(limpio, applyDiscard(motor, porAsiento), ahora)
}

// El abandonado descarta vacío en el acto. Sin nadie pendiente, se aplica sin esperar.
function seguirDescarte(estado, ahora) {
  const { motor, asientos } = estado
  const descarte = estado.descarte.map((d, i) => (
    d === null && asientos[i].abandonado && !motor.players[i].folded ? [] : d
  ))
  const anotado = { ...estado, descarte }
  const faltan = motor.players.some((p, i) => !p.folded && descarte[i] === null)
  return faltan ? { estado: anotado, efectos: [] } : aplicarDescartes(anotado, ahora)
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
      estado: { ...estado, sorteo: nueva, vencimiento: en(CLASES.REPARTO_SORTEO, ahora + ESPERA_REPARTO_SORTEO_MS) },
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
  return trasMoverMotor(estado, applyBetAction(estado.motor, asiento, tipo, k), ahora)
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

function alVencerTurno(estado, ahora) {
  const { motor } = estado
  const asiento = motor.activePlayerIndex
  const accion = esLegal(motor, asiento, 'pasar').ok ? 'pasar' : 'retirarse'
  return trasMoverMotor(estado, applyBetAction(motor, asiento, accion), ahora)
}

function reclamarVencimiento(estado, _asiento, _peticion, ahora) {
  const { vencimiento: v, motor, sorteo } = estado
  if (!v || ahora < v.hora) return M.VENCIMIENTO_NO_CUMPLIDO

  switch (v.clase) {
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
      return { estado: conVolteo(estado, sorteo, ahora), efectos: [] }
    case CLASES.VOLTEO_SORTEO:
      return trasVolteo(estado, ahora)
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
      return aplicarDescartes(estado, ahora)
    case CLASES.MANO_SIGUIENTE:
      return empezarMano(estado, motor, ahora)
    default:
      throw new Error(`MOT-1 · vencimiento desconocido: ${v.clase}`)
  }
}

const manoEnCurso = (estado) => !sorteoAbierto(estado) && estado.motor.phase !== PHASES.PAYOUT

// En mano no cobra: si le tocaba actuar, actúa ya, y si no, espera a que le toque.
function actuarAbandonado(estado, asiento, ahora) {
  const { motor } = estado
  if (motor.phase === PHASES.DISCARD) return seguirDescarte(estado, ahora)
  const apostando = motor.phase === PHASES.BET_1 || motor.phase === PHASES.BET_2 || motor.phase === PHASES.BET_3
  return apostando && motor.activePlayerIndex === asiento ? trasMoverMotor(estado, motor, ahora) : { estado, efectos: [] }
}

// C-8: en mano, no mueve dinero y sigue disputando lo que puso. Sin mano, sale ya.
function marcarAbandono(estado, asiento, ahora) {
  const asientos = estado.asientos.map((a, i) => (i === asiento ? { ...a, abandonado: true } : a))
  const marcado = { ...estado, asientos }
  if (manoEnCurso(marcado)) return actuarAbandonado(marcado, asiento, ahora)

  const { estado: fuera, efectos } = sacarAbandonados(marcado)
  const vivos = fuera.motor.players.filter((p) => !p.eliminated).length
  if (!sorteoAbierto(fuera)) return { estado: fuera, efectos }
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
}

// ── Lo público ──────────────────────────────────────────────────────────────

/**
 * Las comprobaciones comunes del §2, en su orden, y la acción. La primera que falla
 * decide el motivo. `uid` es lo que dijo el token: sin él, `no_autenticado`.
 *
 * @param {object} estado el de `crearPartida`, o el que devolvió la llamada anterior
 * @param {{ uid: string|null, version: number, accion: string }} peticion y los campos de cada acción
 * @param {{ ahora: number }} reloj la hora del servidor, en ms
 */
export function aplicarAccion(estado, peticion, { ahora }) {
  const { uid, version, accion } = peticion
  if (!uid) return rechazo(estado, M.NO_AUTENTICADO)
  const asiento = estado.asientos.findIndex((a) => a.uid === uid)
  if (asiento < 0) return rechazo(estado, M.NO_ES_DE_ESTA_MESA)
  if (partidaTerminada(estado)) return rechazo(estado, M.PARTIDA_TERMINADA)
  if (estado.asientos[asiento].abandonado) return rechazo(estado, M.ASIENTO_ABANDONADO)
  if (!SIMULTANEAS.includes(accion) && version !== estado.version) return rechazo(estado, M.VERSION_VIEJA)
  if (!ACCIONES_ARBITRO.includes(accion)) return rechazo(estado, M.DESCONOCIDA)

  const hecho = MANEJADORES[accion](estado, asiento, peticion, ahora)
  return typeof hecho === 'string' ? rechazo(estado, hecho) : confirmar(hecho)
}

/**
 * El abandono por la regla de una partida por cuenta (§7). Lo marca el servidor, sin
 * versión del cliente, así que no puede chocar con ella.
 */
export function abandonarPorServidor(estado, uid, { ahora }) {
  const asiento = estado.asientos.findIndex((a) => a.uid === uid)
  if (asiento < 0) return rechazo(estado, M.NO_ES_DE_ESTA_MESA)
  if (partidaTerminada(estado)) return rechazo(estado, M.PARTIDA_TERMINADA)
  if (estado.asientos[asiento].abandonado) return rechazo(estado, M.ASIENTO_ABANDONADO)
  return confirmar(marcarAbandono(estado, asiento, ahora))
}

/**
 * La partida de una sala `activa`: versión 0, sorteo abierto en la ronda 1 y el
 * vencimiento de su reparto (§2, arranque).
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
    asientos: compactos.map((a) => ({ ...a, abandonado: false, cobrado: null })),
    sorteo,
    motor,
    descarte: nulos(n),
    descartaron: null,
    vencimiento: en(CLASES.REPARTO_SORTEO, ahora + ESPERA_REPARTO_SORTEO_MS),
  }
}
