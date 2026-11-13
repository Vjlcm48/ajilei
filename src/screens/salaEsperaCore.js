// ── SAL-B2 · La semántica de la sala de espera, sin React y sin DOM ─────────
// Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §6, sobre la lámina SAL-3 v1.5 (sellada
// 11-sep-2026) y el informe de Fase 0 §7.5.
//
// Módulo SIN React ni DOM, molde de `salasCore.js` y `relojCore.js`, y por la
// misma razón: el proyecto no tiene jsdom (hallazgo de FRZ-1), así que todo lo
// que la pantalla DECIDE tiene que vivir fuera del JSX para poder sellarse en
// Vitest. Aquí está: qué silla es de quién, si el anfitrión puede arrancar, qué
// final de mesa le toca a quien estaba sentado, dónde va cada silla en el anillo,
// cuándo urge el reloj, qué consejo sigue y qué enlace se comparte.
//
// Lo que NO está aquí: textos (F1b los resuelve con `t()`), la red, el reloj de
// la máquina y cualquier medida del DOM. Las funciones reciben números y filas
// y devuelven números y objetos planos.
//
// ── LAS FORMAS QUE ENTRAN ───────────────────────────────────────────────────
//   `sala`     · la fila de `salas` tal como la devuelve la base:
//                `{ id, jugadores, anfitrion_id, estado, codigo, … }`.
//   `asientos` · lo que devuelve `salasApi.asientosDe`:
//                `[{ asiento, jugadorId, username }]`.
//   `uid`      · `cuenta.id`, el `auth.users.id` del que mira.

import { PARAM_SALA } from '../config/salaPendiente'

// ── Las sillas ──────────────────────────────────────────────────────────────
// Una entrada por silla de la mesa —`sala.jugadores`, no `asientos.length`—:
// las vacías también se pintan (la lámina las enseña punteadas con
// «Esperando…»). El asiento es el ÍNDICE: el 0 es la Mano de la primera mano y
// el anfitrión se sienta ahí al crear (SAL-A §9), pero `esAnfitrion` se decide
// por `anfitrion_id` y no por el número, porque el contrato es el uuid.
//
// `inicial` es lo que el hueco del avatar enseña hasta que AVA-1 ponga la
// imagen (lámina v1.5 §A): la primera letra del username en mayúscula. Un
// sentado SIN username —incrustación que no llegó— enseña `?` en vez de nada,
// para que se vea que hay alguien; una silla vacía no tiene inicial (`null`).

export function inicialDe(username) {
  if (typeof username !== 'string' || username.length === 0) return '?'
  return username[0].toUpperCase()
}

export function sillasDe(sala, asientos, uid) {
  const n = Number(sala?.jugadores)
  if (!Number.isInteger(n) || n < 1) return []
  const filas = Array.isArray(asientos) ? asientos : []

  return Array.from({ length: n }, (_, i) => {
    const fila = filas.find((f) => Number(f?.asiento) === i) ?? null
    if (fila === null) {
      return { asiento: i, username: null, inicial: null, esAnfitrion: false, esTu: false, vacia: true }
    }
    const jugadorId = fila.jugadorId ?? null
    return {
      asiento: i,
      username: fila.username ?? null,
      inicial: inicialDe(fila.username),
      esAnfitrion: jugadorId !== null && jugadorId === (sala?.anfitrion_id ?? undefined),
      esTu: jugadorId !== null && uid != null && jugadorId === uid,
      vacia: false,
    }
  })
}

// MES-PvP 7a · el rótulo bajo el nombre (decisión de Victor, P-4): la silla propia dice
// SIEMPRE «Tú», también si eres el anfitrión; la del anfitrión ajeno, «Anfitrión». Las demás,
// nada (`null`: la pantalla pinta un espacio, la caja se queda).
export function rotuloSilla(silla) {
  if (silla?.esTu) return 'sal.espera.tu'
  if (silla?.esAnfitrion) return 'sal.espera.anfitrion'
  return null
}

// 5a · la fila de la sala con sus sillas sentadas, para la mesa provisional de la partida
// (`mesaPvPCore.vistaProvisional`): asiento, nombre y cuál es la propia. Solo para quien vio la
// sala arrancar (`enVivo`: la vio esperando y luego activa): quien vuelve con la partida ya en
// curso no lleva sillas y ve la mesa sin texto hasta la vista real, sin un barajado que ya pasó.
export function salaParaPartida(sala, asientos, uid, enVivo) {
  if (!enVivo) return sala
  const sillas = sillasDe(sala, asientos ?? [], uid).filter((s) => !s.vacia)
  return { ...sala, sillas: sillas.map((s) => ({ asiento: s.asiento, nombre: s.username, tu: s.esTu })) }
}

// ── El resumen que gobierna la acción ───────────────────────────────────────
// `puedeJugarYa` reúne las tres condiciones de la lámina y de `jugar_ya`
// (SAL-A §12): ser el anfitrión, tener al menos dos sentados, y que la mesa NO
// esté llena — llena arranca sola con la cuenta corta y el CTA se retira.
export function resumenDe(sala, asientos, uid) {
  const jugadores = Number(sala?.jugadores)
  const sentados = Array.isArray(asientos) ? asientos.length : 0
  const esAnfitrion = uid != null && sala?.anfitrion_id != null && sala.anfitrion_id === uid
  const llena = Number.isFinite(jugadores) && jugadores > 0 && sentados >= jugadores
  return {
    esAnfitrion,
    sentados,
    jugadores: Number.isFinite(jugadores) ? jugadores : 0,
    llena,
    puedeJugarYa: esAnfitrion && sentados >= 2 && !llena,
  }
}

// ── El final de la mesa, para quien ya estaba sentado ───────────────────────
// Tres finales sobre la misma pantalla (lámina v1.5 §C), y de dónde sale cada
// uno (informe de Fase 0 §7.5-5):
//
//   · `'cancelada'` · la fila de `salas` cambió a 'cancelada' SIN que este
//                     cliente llegara a cero: el anfitrión cerró la mesa
//                     (`salir_sala`). Llega por Realtime.
//   · `'vencida'`   · el reloj llegó a cero, la pantalla llamó a `resolver_sala`
//                     y la fila resuelta dice 'cancelada': no llegó gente.
//   · `'activa'`    · la fila dice 'activa', venga de donde venga: `jugar_ya`,
//                     el barrido, o la fila resuelta con ≥ 2.
//   · `null`        · sigue 'esperando'.
//
// `resuelta` es la fila que devolvió `resolver_sala` al llegar a cero.
//
// ── F1b · SI LA FILA CONOCIDA YA ES TERMINAL, GANA ELLA ───────────────────
// Decisión del rector (F1b §3.3, sobre la duda 4 del informe de F1a). La
// resuelta sólo decide cuando la conocida sigue 'esperando': si Realtime ya
// trajo 'cancelada' es que el anfitrión cerró la mesa, y una resuelta que llegue
// después por la carrera del reloj no convierte eso en «no llegó gente». Una
// resuelta que siga 'esperando' —el reloj local se adelantó al del servidor— es
// `null`: la pantalla vuelve a preguntar.
//
// ── AJUSTES · LO DECIDE QUIÉN MIRA, NO LA FILA ────────────────────────────
// Defecto E5, medido con dos teléfonos (12-sep-2026): el anfitrión solo dejó
// correr los 3:00 y leyó «El anfitrión cerró la mesa». La fila NO guarda quién
// la cerró —`resolver_sala` escribe 'cancelada' igual que `salir_sala`—, así
// que el mismo dato significa dos cosas distintas según quién lo lea (lámina
// v1.6):
//   · para el ANFITRIÓN que sigue en la pantalla, 'cancelada' es siempre
//     VENCIDA: si la hubiera cerrado él, ya no estaría aquí (`salir` lo saca
//     de la pantalla en el mismo gesto);
//   · para un INVITADO sentado, 'cancelada' es siempre EL ANFITRIÓN CERRÓ: con
//     dos o más sentados el barrido ARRANCA la mesa en vez de cancelarla, así
//     que un invitado no puede ver una vencida con él dentro.
// `esAnfitrion` es `false` por defecto: quien no lo pase lee lo de antes.
export function finDe(sala, resuelta = null, esAnfitrion = false) {
  if (sala?.estado === 'cancelada') return esAnfitrion ? 'vencida' : 'cancelada'
  if (sala?.estado === 'activa') return 'activa'
  if (resuelta && typeof resuelta === 'object') {
    if (resuelta.estado === 'cancelada') return 'vencida'
    if (resuelta.estado === 'activa') return 'activa'
  }
  return null
}

// ── El anillo de sillas ─────────────────────────────────────────────────────
// El ángulo de la lámina, palabra por palabra: la primera silla arriba
// (`-π/2`), y de ahí en sentido horario a partes iguales. `arriba` es la mitad
// superior del anillo, donde los textos crecen hacia arriba y el avatar queda
// abajo; el umbral `-0.01` deja a las sillas de la línea del ecuador (sin < 0
// por un pelo de coma flotante) en la mitad de abajo, como en la lámina.
//
// Devuelve el DESPLAZAMIENTO respecto al centro del anillo, en las unidades de
// `rx` y `ry`; `cx`/`cy` permiten pedir la posición absoluta si se pasan. Los
// radios los mide la pantalla (son cajas del DOM); aquí sólo hay trigonometría.
export function posicionSilla(i, n, rx, ry, cx = 0, cy = 0) {
  const total = Number(n)
  if (!Number.isInteger(total) || total < 1) return { x: cx, y: cy, arriba: false }
  const ang = -Math.PI / 2 + (2 * Math.PI * i) / total
  const seno = Math.sin(ang)
  return {
    x: cx + rx * Math.cos(ang),
    y: cy + ry * seno,
    arriba: seno < -0.01,
  }
}

// ── Cuándo urge el reloj ────────────────────────────────────────────────────
// A treinta segundos o menos el cronómetro se pinta en naranja — salvo con la
// mesa llena, donde la cuenta corta va en oro y es una buena noticia, no una
// urgencia (lámina v1.5 §B).
export const URGE_SEG = 30

export function urge(segundos, llena) {
  return Number.isFinite(segundos) && segundos <= URGE_SEG && !llena
}

// ── El consejo siguiente ────────────────────────────────────────────────────
// Circular. Con `total` inválido se queda en el 0 para no pedir un índice que
// no existe.
export function siguienteConsejo(i, total) {
  const n = Number(total)
  if (!Number.isInteger(n) || n < 1) return 0
  const actual = Number.isInteger(i) ? i : 0
  return (((actual + 1) % n) + n) % n
}

// ── El enlace que se comparte ───────────────────────────────────────────────
// `https://ajilei.io/?sala=AJ-XXXX`, exactamente lo que `recogerDeLaUrl()` lee
// (`salaPendiente.js`): el parámetro sale de `PARAM_SALA` y no de una cadena
// escrita aquí, para que las dos puntas no puedan separarse. El código llega ya
// normalizado (`AJ-XXXX`, el formato de la base); una mesa abierta no tiene
// código y no tiene enlace: `null`.
export const ORIGEN_ENLACE = 'https://ajilei.io/'

export function enlaceDeSala(codigo) {
  if (typeof codigo !== 'string' || codigo.length === 0) return null
  return `${ORIGEN_ENLACE}?${PARAM_SALA}=${codigo}`
}
