// ── mesaCore.js · Lo que la MESA decide y el motor no ──────────────────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §3 (1e-ii). Normativo:
// `docs/AJILEI_APU-1_Reglas_v1.3.md` §3.2, §4.1, §4.3, §5 y §6.9.
//
// Módulo PURO, sin React ni DOM — el molde de `cronicaCore`, `resultadoCore` y
// `sesionCore`, y por la misma razón que aquéllos: este proyecto NO tiene jsdom
// (hallazgo de FRZ-1), así que un componente no se puede probar. Todo lo que se
// quiera sellar con Vitest tiene que poder salir del JSX, y lo que se queda
// dentro sólo lo mide Playwright.
//
// ── QUÉ NO ES ──────────────────────────────────────────────────────────────
// No es una segunda mitad del motor. Ninguna de estas funciones mueve una
// ficha: la legalidad la contesta `pozos.js`, el dinero lo mueve
// `gameEngine.js` y lo que aquí se decide es lo que la PANTALLA tiene que
// saber antes de preguntar — qué botones existen, cuánto espera antes de que
// una IA hable, cuándo una ronda no vale la pena abrirse y cuánto se puede
// recargar. Todo se deriva de lo que ya está sellado; nada se reinventa.

import { AJILEI_CONFIG } from '../config/ajileiConfig'
import { PHASES } from '../engine/gameEngine'
import { ACCIONES, esLegal, costoDe, accionesDe, puedenHablar, capasDe, ganadoresPorCapa } from '../engine/pozos'
import { pisoDe, medioDe, techoDe, nivelarIA } from '../engine/entrada'

// El humano es SIEMPRE el asiento 0. Lo es en el motor (`applyPlayerBetAction`
// lo tiene escrito), en `jugadoresVsIA` y en `resultadoCore.deShowdown`, que
// decide «ganaste tú» con `winner === 0`. Se escribe con nombre porque un `0`
// suelto en una condición no dice cuál de las dos cosas es.
export const ASIENTO_HUMANO = 0

export const FASES_APUESTA = [PHASES.BET_1, PHASES.BET_2, PHASES.BET_3]

export const esFaseDeApuesta = (phase) => FASES_APUESTA.includes(phase)

// ── §3.1 · La fila de acciones, DERIVADA de la legalidad ───────────────────
//
// Releva a `canPass/canBet/canCall/canRaise` (`GameTable.jsx:993-997`), que
// eran cuatro condiciones escritas a mano con la aritmética del motor copiada
// dentro. Ése es el riesgo R-5 del diagnóstico —«cuánto cuesta» y «no cubre»
// viviendo en cuatro sitios— y `pozos.js` existe para cerrarlo: aquí no se
// vuelve a preguntar si la pila alcanza, se pregunta si la acción es legal.
//
// EL BOTÓN ALL-IN NACE DE ESTO, no de una condición nueva. `pozos.esLegal` sólo
// deja `allIn` cuando hay apuesta viva y la pila NO la cubre (§4.1, all-in
// defensivo), y en ese mismo estado rechaza `igualar` con `no_alcanza`. O sea
// que los dos botones son EXCLUYENTES por construcción y ninguna línea de la
// pantalla tiene que decidir cuál se enseña: se enseña el que existe.
const NECESITAN_K = ['apostar', 'subir']

export function filaAcciones(state, k = 1) {
  if (!state?.players?.[ASIENTO_HUMANO]) return []
  return ACCIONES
    .map((id) => ({ id, k: NECESITAN_K.includes(id) ? k : 1 }))
    .filter((a) => esLegal(state, ASIENTO_HUMANO, a.id, a.k).ok)
    .map((a) => ({ ...a, costo: costoDe(state, ASIENTO_HUMANO, a.id, a.k) }))
}

/**
 * Los cuatro multiplicadores con su monto y si se pueden pagar AHORA.
 *
 * El gris de un ×10 significaba «tu pila no llega a 10 apuestas», que es una
 * media verdad: lo que importa no es el monto sino lo que COSTARÍA la acción,
 * y subir cuesta la diferencia con lo ya puesto, no el multiplicador entero.
 * Se le pregunta a la acción que ese multiplicador va a servir.
 */
export function multiplicadoresDe(state) {
  const mults = AJILEI_CONFIG.betting.multiplicadores
  const unit = state?.unit ?? 0
  const p = state?.players?.[ASIENTO_HUMANO]
  const hayApuestaViva = (state?.currentBet ?? 0) > (p?.contrib ?? 0)
  const accion = hayApuestaViva ? 'subir' : 'apostar'
  return mults.map((k) => ({
    k,
    monto: unit * k,
    costo: costoDe(state, ASIENTO_HUMANO, accion, k),
    disponible: esLegal(state, ASIENTO_HUMANO, accion, k).ok,
  }))
}

// ── §4.3 · Un asiento en all-in va MARCADO ─────────────────────────────────
// La marca es del asiento, no de la ronda: dura toda la mano, porque toda la
// mano compite por sus capas. `folded` gana —quien se retiró ya no disputa
// nada— pero por construcción un all-in no puede retirarse (`pozos.esLegal`
// devuelve `en_all_in` antes de mirar la acción), así que los dos juntos sólo
// se ven en un estado sintético.
export function marcadoAllIn(player) {
  return !!player && !!player.allIn && !player.folded && !player.eliminated
}

// ── §6.9 · El ritmo, por peso de la decisión ───────────────────────────────
// `decidirIA` devuelve `{action, k, peso}` desde 1c y el `peso` no había tenido
// nunca un consumidor: el motor no lo mira (no es regla de juego) y la pantalla
// esperaba lo mismo para todo. Aquí es donde se cobra.
// 1e-iii · devuelve un uniforme DENTRO de la banda del peso, no la banda. El
// azar vive aquí, en la pantalla, y no llega al motor: nadie decide distinto
// porque una espera haya salido de 1.480 en vez de 1.020.
export function ritmoDe(peso) {
  const r = AJILEI_CONFIG.ui?.ritmoIA ?? {}
  const [min, max] = r[peso] ?? r.media ?? [1000, 1500]
  return Math.round(min + Math.random() * (max - min))
}

// ── D-12 · El vigía de la mesa clavada ──────────────────────────────
//
// Una fase de apuesta ABIERTA en la que no queda NADIE que pueda poner una
// ficha: el asiento activo está en all-in, no le queda una sola acción legal y
// la ronda no converge nunca, porque el motor sólo evalúa el cierre DESPUÉS de
// una acción y aquí no va a haber ninguna. Es D-12, y desde fuera del motor no
// tiene salida: no hay acción que aplicar.
//
// 1e-ii lo cerraba a dos manos —la pantalla pasaba por el último asiento con
// fichas (§4.3) y `pideRecarga` evitaba llegar aquí (ruta 1)—. 1e-iii lo
// cierra donde corresponde: el motor no ABRE una fase de apuesta que nadie
// pueda jugar. Así que esta función ya no previene nada; es un VIGÍA, y su
// trabajo es valer `0` siempre. La mesa lo publica en `data-clavada` y el arnés
// lo mira en cada mano que juega: si alguna vez vale `1`, es un defecto del
// motor y va a salir en un informe en vez de en un jugador mirando una mesa
// que no avanza.

export function mesaClavada(state) {
  return esFaseDeApuesta(state?.phase) && puedenHablar(state).length === 0
}

/**
 * ¿El ante de la mano que viene dejaría a TODOS en cero? (D-12, de frente).
 *
 * Es la única forma de cerrar D-12 sin abrir el motor: se mira ANTES de
 * repartir. Un asiento vivo es el que puede pagar el ante (`chips >= unit`), y
 * queda con algo justo cuando `chips > unit`. Si ninguno pasa de ahí, la mano
 * que se va a repartir es una mano sin una sola decisión posible, y la mesa se
 * clavaría en `BET_1`.
 */
export function anteDejaAMudos(state) {
  const unit = state?.unit ?? 0
  if (unit <= 0) return false
  const vivos = (state?.players ?? []).filter((p) => !p.eliminated && (p.chips ?? 0) >= unit)
  return vivos.length >= 2 && vivos.every((p) => (p.chips ?? 0) === unit)
}

// ── §5 · La recarga entre manos ────────────────────────────────────────────

const CFG_RECARGA = () => AJILEI_CONFIG.betting.recarga
export const umbralRecarga = (unit) => CFG_RECARGA().umbral * unit
export const plazoRecarga = () => CFG_RECARGA().plazoMs

// §5.1 · «pila < 5 × unit». El listón mira la PILA, no el saldo: quien va
// sobrado de bolsillo pero corto de mesa es exactamente a quien la pregunta le
// sirve de algo.
export function pilaBaja(pila, unit) {
  return pila < umbralRecarga(unit)
}

/**
 * Cuánto se puede recargar como MÁXIMO: lo que quepa bajo el techo de la mesa
 * y lo que el bolsillo cubra, lo que sea menor, en múltiplos de la apuesta.
 * §5.2: «múltiplos de la apuesta de mesa, y pila resultante ≤ techo».
 */
export function topeRecarga(pila, unit, saldo) {
  if (!unit || unit <= 0) return 0
  const bajoTecho = Math.max(0, techoDe(unit) - pila)
  const enBolsillo = Math.max(0, Math.floor(saldo / unit) * unit)
  return Math.floor(Math.min(bajoTecho, enBolsillo) / unit) * unit
}

export const MOTIVOS_RECARGA = Object.freeze({
  MONTO_INVALIDO: 'monto_invalido',
  SOBRE_TECHO: 'sobre_techo',
  SIN_SALDO: 'sin_saldo',
})

export function recargaValida(monto, pila, unit, saldo) {
  if (!Number.isInteger(monto) || monto <= 0) return { ok: false, motivo: MOTIVOS_RECARGA.MONTO_INVALIDO }
  if (!Number.isInteger(unit) || unit <= 0) return { ok: false, motivo: MOTIVOS_RECARGA.MONTO_INVALIDO }
  if (monto % unit !== 0) return { ok: false, motivo: MOTIVOS_RECARGA.MONTO_INVALIDO }
  if (pila + monto > techoDe(unit)) return { ok: false, motivo: MOTIVOS_RECARGA.SOBRE_TECHO }
  if (monto > saldo) return { ok: false, motivo: MOTIVOS_RECARGA.SIN_SALDO }
  return { ok: true, motivo: null }
}

export const IDS_RECARGA = ['piso', 'medio', 'techo']

/**
 * Los tres montos de la recarga, con la MISMA forma que los de la entrada
 * (§5.2: «se elige como una entrada»). No es un parecido estético: son las
 * mismas tres cifras de `entrada.js`, así que el jugador que aprendió a
 * sentarse ya sabe leer esto, y el día que `betting.entrada` se mueva se
 * mueven las dos pantallas a la vez.
 *
 * «Techo» es el único que NO es una cifra fija: es lo que falta para llenar la
 * mesa, porque recargar al techo con la pila a medias no cuesta un techo entero.
 * Los tres se apagan por lo mismo —el tope de §5.2— y NUNCA se esconden, que es
 * la lección de E-2: una fila que cambia de número de botones mueve lo que hay
 * debajo justo cuando el dedo va bajando.
 */
export function opcionesRecarga(pila, unit, saldo) {
  const tope = topeRecarga(pila, unit, saldo)
  const montos = {
    piso: pisoDe(unit),
    medio: medioDe(unit),
    techo: Math.max(0, techoDe(unit) - pila),
  }
  return IDS_RECARGA.map((id) => {
    const monto = Math.floor(montos[id] / unit) * unit
    return { id, monto, disabled: monto <= 0 || monto > tope }
  })
}

// ── REC-2 · La regla híbrida (normativo v1.3 §5.1 y §5.2) ──────────────────
//
// Fase 0 de REC-2: `pideRecarga` preguntaba en cuanto el bolsillo cubría UNA
// apuesta, pero el monto más bajo de la fila es el piso de DIEZ. Con el saldo
// entre las dos cifras salía la pregunta con los tres montos apagados, y la
// pantalla rellenaba el hueco con un `?? 0` que se pintaba «Recargar 0». En la
// forzosa eso echaba de la mesa a quien tenía saldo para seguir.
//
// Ahora las dos preguntas —¿hay pregunta? y ¿qué se ofrece?— salen de la MISMA
// cifra, `topeRecarga`, y la tarjeta entera sale de aquí: la vista no vuelve a
// inventar un monto.

// El saldo que de verdad se puede poner en la mesa: redondeado hacia abajo a
// la apuesta. El resto (< `unit`) se queda en el bolsillo (§5.2, múltiplos).
export function saldoUsable(saldo, unit) {
  if (!unit || unit <= 0) return 0
  return Math.max(0, Math.floor((saldo ?? 0) / unit) * unit)
}

// LA puerta de «hay saldo» que comparten `pideRecarga` y `tarjetaRecarga`.
// Bajo el techo es exactamente «saldo usable ≥ una apuesta»; con la pila en el
// techo tampoco hay nada que ofrecer, y es lo mismo que decía `pideRecarga`.
export const hayRecarga = (pila, unit, saldo) => topeRecarga(pila, unit, saldo) > 0

export const CASOS_RECARGA = Object.freeze({
  FILA: 1,       // al menos un monto de la fila cabe: la fila de siempre
  TODO: 2,       // ninguno cabe, pero el saldo usable llega a una apuesta
  SIN_SALDO: 3,  // saldo usable < una apuesta: sólo la forzosa, y de sólo salida
})

/**
 * Lo que la tarjeta de recarga ofrece, entero. `monto` es el que nace elegido
 * y NUNCA es 0: o es un monto que cabe o es `null` (caso 3, sin primario).
 *
 *   caso 1 — la fila de tres, con los inalcanzables apagados (E-2).
 *   caso 2 — la fila se sustituye por UN monto: `topeRecarga`, que es todo el
 *            saldo usable o lo que falte hasta el techo si es menor. `todo`
 *            dice cuál de los dos, y de eso depende el rótulo.
 *   caso 3 — nada que ofrecer.
 *
 * El caso 2 sólo existe con la fila entera apagada, y con la fila apagada el
 * techo no puede cortar: «Al techo» vale `techo − pila`, que es ≥ el tope, y si
 * fuera igual estaría encendida. `todo: false` es por eso una rama DEFENSIVA,
 * que sólo se alcanza si alguien cambia la fila (informe REC-2 Fase 1, D-4).
 */
export function tarjetaRecarga(pila, unit, saldo) {
  return armarTarjeta(opcionesRecarga(pila, unit, saldo), topeRecarga(pila, unit, saldo), saldoUsable(saldo, unit))
}

// La decisión, separada de las cifras para que la rama defensiva del caso 2 (el
// techo cortando) se pueda probar con una fila fabricada: con la fila de
// verdad no se alcanza.
export function armarTarjeta(opciones, tope, usable) {
  if (!(tope > 0)) return { caso: CASOS_RECARGA.SIN_SALDO, opciones: [], monto: null, todo: false }
  const primera = opciones.find((o) => !o.disabled && o.monto > 0)
  if (primera) return { caso: CASOS_RECARGA.FILA, opciones, monto: primera.monto, todo: false }
  return { caso: CASOS_RECARGA.TODO, opciones: [], monto: tope, todo: tope === usable }
}

export const RECARGA = Object.freeze({
  NINGUNA: null,
  VOLUNTARIA: 'voluntaria',
  AUTOMATICA: 'automatica',
  FORZOSA: 'forzosa',
})

/**
 * Qué recarga toca AHORA, entre manos. Sólo entre manos: dentro de una, nunca
 * (§5.1), y por eso lo primero que se mira es la fase.
 *
 *   `forzosa`    — o el humano no cubre el ante (v1.3 §5.1), o la mano que viene no
 *                  tendría una sola decisión posible porque el ante dejaría a
 *                  todos mudos (D-12). Son el mismo hecho contado dos veces:
 *                  la mesa no puede continuar como un juego de decisiones, y
 *                  preguntar con un «No» por defecto sería ofrecer una salida
 *                  que no lleva a ninguna parte. Rechazarla termina la mesa —y
 *                  las fichas vuelven al bolsillo (§2.5), así que no cuesta
 *                  nada más que la mano que no se jugó.
 *   `automatica` — la pila bajó del listón de §5.1. Sale sola, 15 s, «No» por
 *                  defecto, y bloquea «Siguiente mano» mientras esté viva.
 *   `voluntaria` — nadie la pidió; el jugador puede pedirla él.
 *
 * Devuelve `NINGUNA` cuando no hay saldo usable con el que recargar: una
 * pregunta cuya única respuesta posible es «No» no es una pregunta, es un
 * reproche. La FORZOSA es la excepción desde REC-2 (v1.3 §5.1): sin saldo sale
 * igual, como tarjeta de sólo salida (caso 3 de `tarjetaRecarga`), porque ahí
 * no se pregunta nada —la mesa no puede continuar— y antes ese hueco lo cubría
 * el modal de bancarrota con sus dos «Próximamente».
 */
export function pideRecarga(state, saldo) {
  const phase = state?.phase
  if (phase !== PHASES.PAYOUT && phase !== PHASES.WAITING) return RECARGA.NINGUNA
  const unit = state?.unit ?? 0
  const humano = state?.players?.[ASIENTO_HUMANO]
  if (!humano || unit <= 0) return RECARGA.NINGUNA
  const pila = humano.chips ?? 0

  const noCubreAnte = pila < unit
  if (noCubreAnte || anteDejaAMudos(state)) return RECARGA.FORZOSA
  if (!hayRecarga(pila, unit, saldo)) return RECARGA.NINGUNA
  if (pilaBaja(pila, unit)) return RECARGA.AUTOMATICA
  return RECARGA.VOLUNTARIA
}

/**
 * §5.3 · Lo que hay que sumarle a cada IA viva tras la recarga del humano.
 *
 * Devuelve `[{ seat, monto }]` con sólo los que suben, para que la pantalla se
 * lo pase a `aplicarRecarga` ASIENTO POR ASIENTO — que es la forma que el
 * rector pidió y la que deja el rastro en `entrada` de cada uno.
 *
 * `nivelarIA` COMPLETA HACIA ARRIBA: a la que ya va por encima no se le quita
 * nada, porque una pila de IA no se reduce por regla, sólo por perder. Las
 * eliminadas no vuelven.
 *
 * La referencia es la pila del humano DESPUÉS de recargar, tal como la escribe
 * §5.3 («pila_humano_tras_recarga»). Al sentarse coincide con su entrada; a
 * mitad de mesa no, y es la pila la que manda: nivelar contra una entrada que
 * el jugador ya perdió sentaría a las IAS por encima de la mesa que hay.
 *
 * ── ECO-1c · D-1: LA QUEBRADA NO VUELVE (C9, P-2) ─────────────────────────
 * `eliminated` sólo lo escribe `startHand` (`gameEngine.js:507-515`), así que
 * una IA que se queda sin fichas EN ESTA MANO sigue sin marcar durante PAYOUT,
 * que es justo cuando se ofrece la recarga. Con el filtro de `eliminated` a
 * secas, recargar entonces la completaba hasta la pila de §2.3 y la mesa que
 * el jugador acababa de ganar no se cerraba (Fase 0 §D.1; reproducido en
 * `mesaIACore.test.js` y en el modo `revive`). Se nivela sólo a las IAS con
 * fichas ≥ la apuesta: el MISMO criterio con el que `startHand` elimina
 * (`p.chips < unit`), porque una IA por debajo del ante que se completara
 * revivía igual.
 */
export function nivelarLasIAS(state) {
  const unit = state?.unit ?? 0
  const pilaHumano = state?.players?.[ASIENTO_HUMANO]?.chips ?? 0
  return (state?.players ?? [])
    .map((p, seat) => ({ p, seat }))
    .filter(({ p, seat }) => seat !== ASIENTO_HUMANO && !p.eliminated && (p.chips ?? 0) >= unit)
    .map(({ p, seat }) => ({ seat, monto: nivelarIA(p.chips ?? 0, pilaHumano, unit) - (p.chips ?? 0) }))
    .filter((x) => x.monto > 0)
}

// ── §4.2 · Las capas, con nombre y dueño ───────────────────────────────────
//
// `capasDe` y `ganadoresPorCapa` viven en `pozos.js` y son la verdad del
// dinero. Esto sólo las junta para que la pantalla no tenga que saber que son
// dos llamadas ni con qué puntaje se resuelve la segunda.
//
// El puntaje sale de `player.score`, que es lo que `doShowdown` deja escrito al
// pagar. Quien no llegó a comparación lo tiene en `null` y puntúa −1: no gana
// una capa por defecto, que es exactamente lo que `deShowdown` hace al filtrar
// por `p.score`.
export function repartoPorCapas(state) {
  const capas = capasDe(state)
  if (!capas.length) return []
  const ganadores = ganadoresPorCapa(state, (p) => p?.score?.points ?? -1)
  return capas.map((capa, i) => ({
    monto: capa.monto,
    elegibles: capa.elegibles,
    ganador: ganadores[i],
  }))
}

// ¿Hay algo que contar? Una sola capa es el pozo de siempre y no se nombra: el
// resultado ya dice quién lo gana. Se cuenta cuando el pozo se PARTIÓ.
export function pozoPartido(state) {
  return repartoPorCapas(state).length > 1
}

// Re-exportado para que la pantalla tenga UNA puerta: `accionesDe` se usa en la
// mesa para preguntar por un asiento cualquiera (el salto en silencio), no sólo
// por el humano.
export { accionesDe }

// ── REC-1 · La pregunta que no tapa la mano (normativo v1.3 §5.5) ──────────
//
// La automática y la forzosa se decidían y se pintaban en el MISMO fotograma
// que el resultado (Fase 0 de REC-1: t = 0 del pago), así que la tarjeta tapaba
// la revelación y el reloj gastaba 3,7 de sus 15 s mientras el jugador aún
// miraba las cartas. Aquí viven las dos decisiones que lo corrigen, puras para
// que Vitest las selle: CUÁNDO se puede enseñar la pregunta y CON QUÉ FORMA.

// §10 · «Apertura sola de la tarjeta: en los últimos 5 s del plazo».
export const APERTURA_SOLA_S = 5

// La red de `recargaLista`: si en este tiempo desde el primer render del pago
// la revelación no dio señal de terminar, la pregunta sale igual. El reloj de
// la recarga no puede quedarse colgado de una celebración que no llegó a
// armarse (sin geometría, por ejemplo) o que no avisó al descargarse.
export const RED_REVELACION_MS = 6000

/**
 * §5.5.1 · ¿Terminó la revelación? Se deriva de lo que la mesa ya sabe:
 *
 *   `vuelo`      — la celebración de esta mano lleva viaje de fichas
 *                  (`llevaViaje(decideCelebracion(...))`). Sin vuelo previsto,
 *                  lista en el acto: no hay nada que esperar.
 *   `armada`     — la celebración llegó a existir (`celebracion.activa`).
 *   `descargada` — y después volvió a null: aterrizó, se cortó o venció.
 *   `ms`         — lo que lleva la fase de pago; a partir de la red, lista.
 */
export function recargaLista({ vuelo, armada, descargada, ms = 0 }) {
  if (!vuelo) return true
  if (armada && descargada) return true
  return ms >= RED_REVELACION_MS
}

/**
 * §5.5 · Qué forma tiene la pregunta ahora mismo.
 *
 *   voluntaria           → tarjeta, sin plegar y sin plazo (§5.5.8);
 *   seg ≤ 0              → vence (lo resuelve el tic, como siempre);
 *   seg ≤ APERTURA_SOLA_S → tarjeta fija: se abre sola y ya no se pliega;
 *   abierta              → tarjeta que se puede plegar con «Ver la mesa»;
 *   si no                → burbuja.
 *
 * `seg` no se toca aquí ni en ningún sitio que abra o pliegue: burbuja y
 * tarjeta leen el MISMO reloj (§5.5.4), y la continuidad sale por construcción.
 */
export function formaRecarga({ seg, abierta, motivo }) {
  if (motivo === RECARGA.VOLUNTARIA) return { forma: 'tarjeta', plegable: false }
  if (seg <= 0) return { forma: 'vence', plegable: false }
  if (seg <= APERTURA_SOLA_S) return { forma: 'tarjeta', plegable: false }
  if (abierta) return { forma: 'tarjeta', plegable: true }
  return { forma: 'burbuja', plegable: false }
}

// Abrir y plegar sólo cambian `abierta`. Devuelven la pregunta entera para que
// la pantalla las use tal cual en su `setRecarga`, y así la prueba de que el
// reloj no se toca es la de estas dos funciones: no reciben `seg` para
// escribirlo, sólo para negarse a plegar cuando ya no se puede (§5.5.5).
export const abrirRecarga = (r) => (r ? { ...r, abierta: true } : r)
export function plegarRecarga(r, seg) {
  if (!r || !formaRecarga({ seg, abierta: r.abierta, motivo: r.motivo }).plegable) return r
  return { ...r, abierta: false }
}
