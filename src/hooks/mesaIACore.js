// ── ECO-1c · La mesa contra las IAS, vista desde el teléfono ────────────────
// Rector: AJILEI_ECO-1_Fase1c_v1.0.md §2.2 y el plan aprobado del STOP-1 (§1).
// Módulo PURO, sin React ni red. El hook que lo usa (`useMesaIA`, 1c-iii) sólo
// enchufa esto a la mesa y a la API; lo que aquí se decide se sella con
// pruebas sin jsdom (hallazgo de FRZ-1).
//
// ── LA COLA ─────────────────────────────────────────────────────────────────
// Todo lo que la mesa le dice al servidor va por UN canal ordenado: los avisos
// de pila (C3), las recargas y la salida. Cada cosa lleva un `seq` creciente y
// nada adelanta a lo que va delante. Es lo que permite que el servidor valide
// una recarga contra la pila avisada (P-3): cuando la recarga llega, todos los
// avisos anteriores ya llegaron.
//
// Un aviso que SÓLO lleva pila se puede saltar si detrás hay otro: el
// siguiente trae la pila nueva y el servidor sólo quiere la última. Un aviso
// con fin de mano NO se salta nunca, porque llevarse la pila nueva sin él
// perdería la mano del récord (C7). Lo que ya está en vuelo tampoco se toca.
//
// Si un envío falla por la red, se reintenta EL MISMO, con el mismo `seq`: el
// servidor es idempotente por `seq` (un aviso repetido se ignora, una recarga
// repetida no cobra dos veces).

import { PHASES } from '../engine/gameEngine'
import { ganadoresPorCapa } from '../engine/pozos'
import { ajileiDe } from '../lib/puntos'

// P-2b · lo que espera la tarjeta de recarga una respuesta antes de decir que
// no la hay y ofrecer «Reintentar» (el mismo `seq`) y salir con las fichas.
export const TOPE_RECARGA_MS = 10000

export const TIPOS = Object.freeze({ AVISO: 'aviso', RECARGA: 'recarga', SALIDA: 'salida' })

// Los códigos de `mesa_ia_resultado` (migración eco1c §4), y uno propio del
// cliente para lo que no llegó a contestar.
export const CODIGOS = Object.freeze({
  OK: 'ok',
  REPETIDO: 'repetido',
  MESA_CERRADA: 'mesa_cerrada',
  SIN_MESA: 'sin_mesa',
  SALDO_INSUFICIENTE: 'saldo_insuficiente',
  SOBRE_TECHO: 'sobre_techo',
  SEQ_VIEJO: 'seq_viejo',
  RED: 'red',
  // ECO-1d · el límite por minuto (K6) y la válvula (K8).
  LIMITE: 'limite',
  TOPE_DIARIO: 'tope_diario',
})

// Qué hace la cola con cada respuesta.
//   hecho      se quita y se sigue.
//   cerrada    la mesa ya no existe (C6): se vacía y no se manda nada más.
//   rechazado  el servidor dijo que no a ESTO (una recarga sin saldo, un
//              monto fuera de regla): se quita, y quien lo pidió lo cuenta.
//   reintentar no hubo respuesta: se vuelve a mandar el mismo.
//
// ECO-1d · K7 · `limite` es «no contesta», NUNCA un «no» definitivo: se
// reintenta el mismo con la espera de siempre. Antes de la 1d un código
// desconocido era `rechazado`, y una salida rechazada habría dejado las fichas
// en la mesa hasta que la recogiera otra cosa. `tope_diario` (la válvula, sólo
// en la recarga) sí es un «no»: la recarga no se hace y la mesa sigue.
export const DESTINOS = Object.freeze({
  HECHO: 'hecho', CERRADA: 'cerrada', RECHAZADO: 'rechazado', REINTENTAR: 'reintentar',
})

export function destinoDe(codigo) {
  if (codigo === CODIGOS.OK || codigo === CODIGOS.REPETIDO || codigo === CODIGOS.SEQ_VIEJO) return DESTINOS.HECHO
  if (codigo === CODIGOS.MESA_CERRADA || codigo === CODIGOS.SIN_MESA) return DESTINOS.CERRADA
  if (codigo === CODIGOS.RED || codigo === CODIGOS.LIMITE || codigo === null || codigo === undefined) return DESTINOS.REINTENTAR
  return DESTINOS.RECHAZADO
}

/**
 * Una cola nueva para una mesa recién abierta. El servidor la abrió con
 * `seq` 0 y la pila igual a la entrada, así que eso es lo último «avisado».
 */
export function colaNueva(pilaInicial = null) {
  return { seq: 0, pendientes: [], enVuelo: null, ultimaPila: pilaInicial, cerrada: false }
}

// Los avisos de sólo pila que todavía no salieron: los que se pueden saltar.
const saltable = (cola) => (it) => it.tipo === TIPOS.AVISO && !it.fin && it.seq !== cola.enVuelo

function encolar(cola, item) {
  if (cola.cerrada) return cola
  const seq = cola.seq + 1
  return { ...cola, seq, pendientes: [...cola.pendientes, { ...item, seq }] }
}

/**
 * La pila del humano cambió (o terminó una mano). Con `fin` = `{ vivos,
 * ganoHumano, mano, ajilei }` (`finDeMano`) es el aviso de fin de mano, que va SIEMPRE aunque la pila no
 * haya cambiado (quien pierde ya la bajó al apostar). Sin `fin`, una pila igual
 * a la última avisada no se manda.
 */
export function encolarPila(cola, pila, fin = null) {
  if (cola.cerrada || !Number.isFinite(pila)) return cola
  if (!fin && pila === cola.ultimaPila) return cola
  const sinSaltables = { ...cola, pendientes: cola.pendientes.filter((it) => !saltable(cola)(it)) }
  return { ...encolar(sinSaltables, { tipo: TIPOS.AVISO, pila, fin: fin ?? null }), ultimaPila: pila }
}

export function encolarRecarga(cola, monto) {
  return encolar(cola, { tipo: TIPOS.RECARGA, monto })
}

export function encolarSalida(cola, fichas) {
  return encolar(cola, { tipo: TIPOS.SALIDA, fichas })
}

/** Lo siguiente que hay que mandar, o `null` si hay algo en vuelo o nada. */
export function proximo(cola) {
  if (cola.cerrada || cola.enVuelo !== null) return null
  return cola.pendientes[0] ?? null
}

export function enviando(cola, seq) {
  return { ...cola, enVuelo: seq }
}

// ── LA SALIDA QUE ESPERA A UNA RECARGA (P-2a, regla sellada por el rector) ──
// Si hay una recarga pendiente, la salida espera su respuesta EN LA COLA: va
// detrás y nada adelanta a lo que va delante, así que mientras la red no
// conteste se reintenta la recarga y la salida no sale. Cuando contesta:
//   · entró (`ok` o `repetido`): sus fichas se SUMAN a las de la salida. La
//     mesa no llegó a ponerlas —las fichas aparecen cuando el servidor confirma—
//     y sin la suma el servidor cobraría una pila sin ellas.
//   · falló de forma definitiva (un «no» del servidor, o `seq_viejo`, que en una
//     recarga quiere decir que no se aplicó): la salida va sin ellas.
// Vale para las tres puertas, porque las tres piden la MISMA salida: la ✕, el
// plazo y la celebración.

/**
 * La respuesta del envío `seq`. Devuelve la cola nueva y el destino, para que
 * el hook sepa si tiene que contar algo (una recarga rechazada, la mesa
 * cerrada). Una respuesta a algo que ya no está pendiente (la segunda de un
 * reintento forzado) no cambia nada: destino `null`.
 */
export function alResponder(cola, seq, codigo) {
  const item = cola.pendientes.find((it) => it.seq === seq)
  const sinVuelo = { ...cola, enVuelo: cola.enVuelo === seq ? null : cola.enVuelo }
  if (!item) return { cola: sinVuelo, destino: null }
  const esRecarga = item.tipo === TIPOS.RECARGA
  // `seq_viejo` en una recarga: no hay movimiento con su clave, no se aplicó.
  const destino = esRecarga && codigo === CODIGOS.SEQ_VIEJO ? DESTINOS.RECHAZADO : destinoDe(codigo)
  if (destino === DESTINOS.REINTENTAR) return { cola: sinVuelo, destino }
  if (destino === DESTINOS.CERRADA) return { cola: { ...sinVuelo, pendientes: [], cerrada: true }, destino }
  let pendientes = sinVuelo.pendientes.filter((it) => it.seq !== seq)
  if (esRecarga && destino === DESTINOS.HECHO) {
    pendientes = pendientes.map((it) => (it.tipo === TIPOS.SALIDA ? { ...it, fichas: it.fichas + item.monto } : it))
  }
  return { cola: { ...sinVuelo, pendientes }, destino }
}

/**
 * La pila que el servidor ya conoce sin aviso: tras una recarga confirmada,
 * `recargar_ia` subió la pila avisada en el monto. Anotarla evita mandar un
 * aviso con la misma cifra cuando la mesa aplique las fichas.
 */
export function anotarPila(cola, pila) {
  return { ...cola, ultimaPila: pila }
}

// ── El fin de mano (C7, y RNK-1b) ───────────────────────────────────────────
// `vivos` es `handRules.ruleN` (K-7): los vivos que el motor CONGELA al barajar
// el Pie (`startHand`), de 2 a 5 en toda mano jugada. `startHand` escribe
// `aliveCount` y `handRules` juntos, así que en el pago valen lo mismo (H-3,
// lo sella `testRnk1b`); se lee `ruleN` porque es la regla de la mano.
// `ganoHumano`: el asiento 0 se lleva la CAPA 0, el pozo principal (Reglas §5,
// INV-63). No se usa `winner`, que es el ganador de la capa SUPERIOR
// (`doShowdown`), la trampa de VOZ-3.
//
// RNK-1b · `mano` es `handCount`: 1 en la primera mano de la mesa y +1 en cada
// `startHand`. Una mesa del servidor es UN montaje de `GameTable` con su estado
// nuevo, y la app nunca reanuda una mesa tras recargar (la recoge el arranque),
// así que `mano` crece de uno en uno dentro de cada `mesas_ia`, como exige
// `informar_pila`. `ajilei`: 0/51/52 con las cartas del humano, SÓLO si ganó la
// mano (normativo §2.4.3 y §2.5: un AJILEI que no gana no da nada).
//
// En PAYOUT el estado conserva `contribMano`, `folded` y `score`, que es todo
// lo que `capasDe` y `ganadoresPorCapa` necesitan, y todo el que no se retiró
// es elegible para la capa 0. El puntaje es el mismo que usa el motor; en la
// ruta de los retiros nadie tiene `score`, pero la capa 0 sólo tiene un
// elegible, el que se queda.
const puntaje = (p) => p?.score?.points ?? 0

export function finDeMano(state) {
  if (state?.phase !== PHASES.PAYOUT) return null
  const capa0 = ganadoresPorCapa(state, puntaje)[0]
  const ganador = capa0 === undefined || capa0 < 0 ? state.winner : capa0
  const ganoHumano = ganador === 0
  return {
    vivos: state.handRules.ruleN,
    ganoHumano,
    mano: state.handCount,
    ajilei: ganoHumano ? ajileiDe(state.players[0]?.cards, state.handRules) : 0,
  }
}

// ── ECO-1d · K7 · SENTARSE CON `limite` ─────────────────────────────────────
// Sentarse no va por la cola (no hay mesa todavía): lo reintenta `retar` en
// App. Con `limite` el botón sigue en «Sentando…» y se vuelve a pedir con el
// MISMO token cada 15 s, hasta 4 veces: un minuto, lo que dura la ventana del
// límite. Si aun así no pasa, la nota lo dice y el token se conserva (el
// siguiente toque es el mismo intento: nunca dos mesas ni dos cobros).
export const LIMITE_SENTARSE = Object.freeze({ esperaMs: 15_000, reintentos: 4 })
