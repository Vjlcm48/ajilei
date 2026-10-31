import { PHASES } from '../engine/gameEngine'

// ── DSK-U3 · Núcleo puro de "Mano actual" ────────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.6.md §3 (antes v1.3 §2).
// Sin React, sin DOM, sin almacén: la disponibilidad, el desglose y, desde
// CFG-1 1e, qué hacer al tocar y qué pintar con la respuesta del servidor,
// expresados como funciones puras para que Vitest las selle. El hook
// (useConsultas) se limita a sostener el estado y a llamar; toda decisión vive aquí.

// Fases en las que la consulta tiene sentido: aquellas en las que hay una mano
// repartida Y una decisión viva del humano. Las de reparto (DEAL_2/DEAL_3) son
// animación en tránsito —las cartas están volando— y las de cierre (SHOWDOWN,
// PAYOUT, GAME_OVER) ya no admiten decisión: ahí la banda gratuita "Tu mejor
// palo" toma el relevo, que es justo la frontera de v1.1 §3.2.
export const FASES_CONSULTABLES = [
  PHASES.BET_1,
  PHASES.BET_2,
  PHASES.DISCARD,
  PHASES.BET_3,
]

// Disponibilidad de la entrada. `handCount` es la identidad de mano del
// marcador ("Mano #N"): 0 significa que aún no se ha repartido ninguna.
export function hayManoConsultable(phase, handCount, numCartas) {
  return (
    FASES_CONSULTABLES.includes(phase) &&
    Number.isInteger(handCount) && handCount > 0 &&
    numCartas > 0
  )
}

// ── CFG-1 1e · Mano actual de pago: lo que decide el cliente ────────────────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §2.3 y el STOP-E1 (P-1). El servidor
// (`consultar_mano`, INV-75) gasta la gratis o cobra; el cliente sólo decide
// CUÁNDO llamar y QUÉ pintar con lo que vuelve. La mano es la unidad: la
// primera consulta de una mano gasta una gratis o se paga, y las siguientes de
// esa misma mano no gastan nada.
//
// El estado (`estadoConsultas`):
//   gratis  las gratis que quedan según el servidor (`null` mientras no lo dijo);
//   precio  el precio de una mano en ESTA mesa (espejo de `precio_consulta`,
//           corregido por la primera respuesta);
//   ultima  la última mano consultada `{ mesa, mano, pagada }`, o `null`.
//
// La mano es el par (mesa, número de mano del marcador) que dice el cliente
// hasta MOT-1 (hueco declarado de INV-75).

export function estadoConsultas({ precio = null } = {}) {
  return { gratis: null, precio, ultima: null }
}

const esLaUltima = (estado, mesa, mano) =>
  estado.ultima !== null && estado.ultima.mesa === mesa && estado.ultima.mano === mano

/** Lo que `mi_consulta()` dice al entrar a la mesa. Una última mano de OTRA mesa no cuenta. */
export function conMiConsulta(estado, r, mesa) {
  if (!r || !Number.isInteger(r.gratis_restantes)) return estado
  const ultima = r.ultima_mesa && r.ultima_mesa === mesa && Number.isInteger(r.ultima_mano)
    ? { mesa, mano: r.ultima_mano, pagada: false }
    : estado.ultima
  return { ...estado, gratis: r.gratis_restantes, ultima }
}

// Qué hacer al tocar la entrada:
//   'sin_mesa'  no hay mesa del servidor o mano: no se llama (aviso de error);
//   'repetida'  es la última mano consultada: se abre la ventana SIN llamar;
//   'llamar'    quedan gratis, o ya se confirmó un cobro en esta sesión;
//   'sin_saldo' va a cobrar y la billetera que la mesa conoce no alcanza: el
//               aviso, sin preguntar ni llamar (el servidor diría lo mismo);
//   'confirmar' va a cobrar y es el primer cobro de la sesión (o no se sabe
//               todavía si quedan gratis): primero la ventana de confirmación.
export function decidirConsulta(estado, { mesa, mano, confirmada, saldo = null }) {
  if (!mesa || !Number.isInteger(mano) || mano < 1) return 'sin_mesa'
  if (esLaUltima(estado, mesa, mano)) return 'repetida'
  if (Number.isInteger(estado.gratis) && estado.gratis > 0) return 'llamar'
  if (estado.gratis === 0 && Number.isInteger(estado.precio) && Number.isFinite(saldo) && saldo < estado.precio) return 'sin_saldo'
  return confirmada ? 'llamar' : 'confirmar'
}

/**
 * La respuesta de `consultar_mano` → el estado siguiente y lo que se pinta:
 * `{ tipo: 'valor', pagada }` (la ventana con el desglose) o
 * `{ tipo: 'aviso', clave, vars }` (una línea, sin ventana).
 */
export function responderConsulta(estado, { mesa, mano }, r) {
  const resultado = r?.resultado
  if (typeof resultado !== 'string') {
    return { estado, popup: { tipo: 'aviso', clave: 'ia.mesa.consulta.error', vars: {} } }
  }
  const precio = Number.isInteger(r.precio) && r.precio > 0 ? r.precio : estado.precio
  const gratis = Number.isInteger(r.gratis_restantes) ? r.gratis_restantes : estado.gratis
  const base = { ...estado, precio, gratis }
  const marcar = (pagada) => ({
    estado: { ...base, ultima: { mesa, mano, pagada } },
    popup: { tipo: 'valor', pagada },
  })
  if (resultado === 'gratis') return marcar(false)
  if (resultado === 'cobrada' || resultado === 'pagada') return marcar(true)
  // La última del servidor (p. ej. consultada desde otro aparato): se respeta
  // lo que se sepa aquí de ella.
  if (resultado === 'repetida') return marcar(esLaUltima(estado, mesa, mano) ? estado.ultima.pagada : false)
  if (resultado === 'saldo_insuficiente') {
    return { estado: base, popup: { tipo: 'aviso', clave: 'ia.mesa.consulta.sin_saldo', vars: { hc: precio ?? '' } } }
  }
  return { estado: base, popup: { tipo: 'aviso', clave: 'ia.mesa.consulta.error', vars: {} } }
}

/**
 * Lo que la entrada dice de sí misma en la mano en curso:
 * `{ tipo: 'pagada' }`, `{ tipo: 'gratis', n }`, `{ tipo: 'precio', precio }` o
 * `null` (todavía no se sabe).
 */
export function etiquetaConsulta(estado, mesa, mano) {
  if (esLaUltima(estado, mesa, mano) && estado.ultima.pagada) return { tipo: 'pagada' }
  if (Number.isInteger(estado.gratis) && estado.gratis > 0) return { tipo: 'gratis', n: estado.gratis }
  if (estado.gratis === 0 && Number.isInteger(estado.precio)) return { tipo: 'precio', precio: estado.precio }
  return null
}

// Reparto del resultado de getBestSuitScore en las dos filas del popup, sin
// recalcular una sola regla: la fuente única ya devolvió `palo`, `points` y
// `suitScores`, y aquí sólo se ordenan.
//
// El comodín no aparece en `suitScores` (getBestSuitScore lo excluye del
// recuento por palo) pero SÍ está sumado en `points`. La bonificación se
// DERIVA de la propia salida de la fuente —points menos el crudo del mejor
// palo— en vez de volver a decidir si el comodín aplica: eso sería la segunda
// calculadora que v1.1 §3.3 prohíbe.
export function desglosarPalos(score) {
  if (!score || !score.palo) return null
  const crudo = score.suitScores?.[score.palo] ?? 0
  const resto = Object.entries(score.suitScores || {})
    .filter(([palo]) => palo !== score.palo)
    .sort((a, b) => b[1] - a[1])
    .map(([palo, pts]) => ({ palo, pts }))
  return {
    palo: score.palo,
    pts: score.points,
    bonifComodin: score.points - crudo,
    resto,
  }
}
