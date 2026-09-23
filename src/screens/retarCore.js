// ── APU-1 1e · Núcleo puro de «Retar a las IAS» ─────────────────────────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §2.2. Molde de `salasCore.js`: sin React,
// sin DOM, sin `localStorage`. Toda decisión de la pantalla vive aquí y Vitest
// la sella; el JSX se limita a pintar lo que estas funciones devuelven.
//
// Es la misma separación que hizo falta en SAL-B1 y por la misma razón dura:
// este proyecto NO tiene jsdom (hallazgo de FRZ-1), así que lo que no sea puro
// no se puede probar más que con el arnés de Playwright — que mide geometría,
// no reglas.

import { NIVELES, apuestasDe } from '../config/niveles'
import { preseleccion } from '../hooks/nivelCore'
import { pisoDe, medioDe, techoDe, entradaValida, pilaIA } from '../engine/entrada'
import { crearMemoria } from '../config/memoriaChips'

// Convención de la casa `ajilei.<cosa>`. Releva a `ajilei.nivel`, que guardaba
// el reto suelto: la memoria de esta pantalla son TRES campos y mantener dos
// claves para lo mismo sería dejar una que nunca se actualiza. La vieja se
// absorbe y se borra en la primera lectura (`legado`, en `memoriaChips`).
export const CLAVE_RETO = 'ajilei.retoConfig'
export const CLAVE_RETO_LEGADO = 'ajilei.nivel'

// Los cuatro tamaños de mesa que el motor admite (`game.playersMin/Max`). Se
// escriben aquí y no en el JSX por la misma convención que `JUGADORES_PVP`.
export const JUGADORES_IA = [2, 3, 4, 5]

// El comodín (7 de Oros) está activo solo en mesas de 4 y 5 — es la nota que
// hoy da `ModeSelect` y que §2.2 manda conservar. Sale de `handRules`, que ya
// lo decide así; aquí es rótulo, no regla.
export const COMODIN_DESDE = 4
export function hayComodin(jugadores) {
  return jugadores >= COMODIN_DESDE
}

// ── La configuración recordada, ya pasada por sus guardas ──────────────────
// `entrada` NO está: no se recuerda (ver `memoriaChips.js`). Nace en `null` y
// la pantalla obliga a elegirla en cada visita.
export const CONFIG_RETO_DEFECTO = Object.freeze({
  reto: NIVELES[0].id,
  jugadores: null,
  apuesta: null,
})

/**
 * Normaliza lo guardado. SIEMPRE devuelve algo usable.
 *
 * El reto cae a Básico ante cualquier basura (`normalizarNivel`). Los otros dos
 * caen a `null` en vez de a un defecto inventado, y ésa es la diferencia con
 * `normalizarConfig` del PvP: aquí una decisión que no se puede recuperar se
 * deja SIN TOMAR, porque la cascada de §2.2 ya sabe pintar una fila vacía y el
 * CTA ya sabe estar apagado. Inventar un tamaño de mesa sería decidir por el
 * jugador algo que él no eligió.
 *
 * La apuesta se juzga contra el reto RESULTANTE —no contra el guardado—, que es
 * lo que impide que una apuesta de Pro sobreviva a un reto que cayó a Básico, y
 * contra el saldo, por la misma regla que la pinta en gris.
 */
export function normalizarReto(crudo, saldo = Infinity) {
  if (!crudo || typeof crudo !== 'object') return { ...CONFIG_RETO_DEFECTO }

  // `preseleccion` es literalmente esta pregunta —«qué opción viene marcada»—
  // y lleva escrita la regla dura de NIV-UI v1.0 §4.2: la memoria PRESELECCIONA,
  // jamás salta la pantalla. Aquí se cumple por construcción, porque el reto no
  // es la última decisión de la pantalla sino la primera de cuatro.
  const reto = preseleccion(crudo.reto)

  const jugadores = JUGADORES_IA.includes(crudo.jugadores) ? crudo.jugadores : null

  const apuesta = apuestasDe(reto).includes(crudo.apuesta) && alcanzaMesa(crudo.apuesta, saldo)
    ? crudo.apuesta
    : null

  return { reto, jugadores, apuesta }
}

export const MEMORIA_RETO = crearMemoria({
  clave: CLAVE_RETO,
  // LA POLÍTICA, en una línea: tres campos, y `entrada` no es uno de ellos.
  campos: ['reto', 'jugadores', 'apuesta'],
  normalizar: normalizarReto,
  legado: { clave: CLAVE_RETO_LEGADO, campo: 'reto' },
})

// ── El alcance de una mesa ────────────────────────────────────────────────
// La regla de §2.2 es el PISO de entrada, no la apuesta: sentarse a una mesa de
// 250 cuesta 10 × 250 = 2.500 desde 1f-A4 (eran 5 × 250 = 1.250), y con 2.000 en
// el bolsillo esa mesa no se puede jugar aunque la apuesta «quepa». Tiene la
// misma FORMA que la regla del PvP (`salasCore.alcanza`) pero ya no el mismo
// múltiplo: aquélla sigue en 5× y es de SAL, no de APU-1. Ésta se escribe con
// la fuente de APU-1, que es lo que permite que las dos se muevan por separado.
export function alcanzaMesa(apuesta, saldo) {
  return saldo >= pisoDe(apuesta)
}

// ── La cascada de §2.2 ───────────────────────────────────
// «Elegir una fila habilita la siguiente; cambiar una superior limpia las
// inferiores.» El orden de las filas se escribe una sola vez y de él sale todo:
// quién habilita a quién y cuándo está lista la pantalla.
//
// ── LA ÚNICA EXCEPCIÓN, Y POR QUÉ LA HAY (E-6, sellada por Victor) ─────────
// 1e-i barría hacia abajo SIN excepciones: cambiar de reto limpiaba también el
// número de jugadores. Se escribió así a propósito —una regla sin excepciones es
// una regla que el jugador no tiene que aprender— y se consignó para que el
// rector la mirara. La miró y decidió lo contrario, con razón: limpiar no es una
// costumbre de la cascada, es la CONSECUENCIA de una dependencia. La apuesta
// sale de `apuestasDe(reto)` y la entrada sale de la apuesta, así que las dos
// dejan de ser válidas cuando el reto cambia; el tamaño de la mesa no depende
// del reto en nada, y borrarlo le cobraba al jugador una decisión de más cada
// vez que curioseaba los tres retos.
//
// `DEPENDEN` dice, para cada fila, qué se invalida al tocarla: la cascada menos
// esa casilla, escrita como DATO para que la excepción se vea en vez de
// esconderse dentro de un `if`.
export const ORDEN_FILAS = ['reto', 'jugadores', 'apuesta', 'entrada']

const DEPENDEN = Object.freeze({
  reto:      ['apuesta', 'entrada'],
  jugadores: ['apuesta', 'entrada'],
  apuesta:   ['entrada'],
  entrada:   [],
})

export function elegir(config, campo, valor) {
  if (!ORDEN_FILAS.includes(campo)) return config
  const fuera = { ...config, [campo]: valor }
  for (const dependiente of DEPENDEN[campo]) fuera[dependiente] = null
  return fuera
}

// Una fila está habilitada cuando TODAS las de arriba están decididas.
export function filaHabilitada(config, campo) {
  const i = ORDEN_FILAS.indexOf(campo)
  if (i <= 0) return true
  return ORDEN_FILAS.slice(0, i).every((c) => config?.[c] !== null && config?.[c] !== undefined)
}

export function listo(config) {
  return ORDEN_FILAS.every((c) => config?.[c] !== null && config?.[c] !== undefined)
}

// ── Las cuatro filas, como datos ──────────────────────────────────────────
export function opcionesReto() {
  return NIVELES.map(({ id, nombre, descripcion }) => ({ id, etiqueta: nombre, aviso: descripcion }))
}

export function opcionesJugadores() {
  return JUGADORES_IA.map((n) => ({ id: n, etiqueta: n, comodin: hayComodin(n) }))
}

/**
 * Las cuatro mesas del reto. Una mesa va en gris cuando el saldo de la sesión no
 * cubre su PISO de entrada, y lleva escrito cuánto hace falta.
 */
export function opcionesApuesta(reto, saldo) {
  return apuestasDe(reto).map((hc) => ({
    id: hc,
    etiqueta: hc,
    disabled: !alcanzaMesa(hc, saldo),
    minimo: pisoDe(hc),
  }))
}

// El techo REAL de esta sesión: el de la mesa, o lo que el bolsillo dé, lo que
// sea menor. Se cuantiza a múltiplos de la apuesta porque la entrada siempre lo
// es (§2.2) — un tope de 1.234 en una mesa de 100 no es una entrada legal.
export function topeEntrada(unit, saldo) {
  const porBolsillo = Math.floor(saldo / unit) * unit
  return Math.min(techoDe(unit), Math.max(0, porBolsillo))
}

// Los cuatro ids de la cuarta fila, en su orden.
export const IDS_ENTRADA = ['piso', 'medio', 'techo', 'otra']

/**
 * Los tres montos con nombre, más la puerta a «Otra…». Cada uno trae ya si el
 * saldo lo cubre, para que el JSX no vuelva a decidirlo.
 *
 * SIN MESA ELEGIDA DEVUELVE LOS CUATRO IGUAL, apagados y sin monto. No es
 * cortesía: una lista vacía dejaba la fila sin un solo chip mientras la cascada
 * no llegaba a ella, y al elegir mesa apareciían cuatro botones de golpe que
 * empujaban el CTA hacia abajo — justo bajo el dedo que iba a pulsarlo. La caja
 * se reserva con los chips puestos, que es la regla O1 aplicada a un control en
 * vez de a un aviso. El monto llega después; el hueco está desde el principio.
 */
export function opcionesEntrada(unit, saldo) {
  if (!unit) return IDS_ENTRADA.map((id) => ({ id, monto: null, disabled: true }))
  const tope = topeEntrada(unit, saldo)
  return [
    { id: 'piso',  monto: pisoDe(unit),  disabled: pisoDe(unit)  > tope },
    { id: 'medio', monto: medioDe(unit), disabled: medioDe(unit) > tope },
    { id: 'techo', monto: techoDe(unit), disabled: techoDe(unit) > tope },
    // «Otra…» sólo tiene sentido si queda algún múltiplo entre el piso y el
    // tope que no sea uno de los tres de arriba.
    { id: 'otra',  monto: null,          disabled: tope < pisoDe(unit) + unit },
  ]
}

// Qué chip se enciende para un monto dado. Si el contador de «Otra…» aterriza
// justo en uno de los tres montos con nombre, se enciende ése: lo que la
// pantalla marca es el MONTO, no por qué camino se llegó a él.
export function idEntrada(monto, unit) {
  if (monto === null || monto === undefined) return null
  if (monto === pisoDe(unit))  return 'piso'
  if (monto === medioDe(unit)) return 'medio'
  if (monto === techoDe(unit)) return 'techo'
  return 'otra'
}

// El contador de «Otra…» se mueve de apuesta en apuesta entre el piso y el tope
// de la sesión. Devuelve el monto ya acotado, nunca uno ilegal.
export function pasoEntrada(monto, unit, saldo, direccion) {
  const tope = topeEntrada(unit, saldo)
  const piso = pisoDe(unit)
  const crudo = (monto ?? piso) + direccion * unit
  return Math.min(tope, Math.max(piso, crudo))
}

/**
 * La validación de §2.2: la de `entrada.js` MÁS el saldo de la sesión, que
 * aquél no mira a propósito («eso lo hace la pantalla»).
 *
 * Devuelve el mismo contrato `{ ok, motivo }`, con un cuarto motivo propio de
 * la pantalla para el caso que el motor no puede juzgar.
 */
export const MOTIVO_SIN_SALDO = 'sin_saldo'

export function entradaDeLaSesion(monto, unit, saldo) {
  const v = entradaValida(monto, unit)
  if (!v.ok) return v
  if (monto > saldo) return { ok: false, motivo: MOTIVO_SIN_SALDO }
  return { ok: true, motivo: null }
}

// Lo que el aviso de la cuarta fila dice: con cuánto se sienta CADA IA. Sale de
// `entrada.pilaIA`, nunca de una copia de la fórmula.
export function pilaDeCadaIA(entrada, unit) {
  if (entrada === null || entrada === undefined) return null
  return pilaIA(entrada, unit)
}
