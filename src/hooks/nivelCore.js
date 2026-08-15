import { NIVELES, NIVEL_POR_DEFECTO } from '../config/niveles'

// ── NIV-UI · Núcleo puro de los niveles ──────────────────────────────────────
// Documento rector: docs/AJILEI_Modos_y_Asistencia_v1.0.md §2.2, §3 y §4.2.
// Sin React, sin DOM, sin localStorage: sólo las tres semánticas —qué nivel es
// válido, cuál se preselecciona y cómo se cuelga el pasajero— como funciones
// puras para que Vitest las selle. El hook (useNivel) se limita a leer y
// escribir; toda decisión vive aquí. Mismo molde que consultasCore (U3).

const IDS = NIVELES.map(n => n.id)

export function esNivelValido(id) {
  return IDS.includes(id)
}

// Todo lo que no sea un id conocido —null, basura de un localStorage
// manipulado, un id retirado en una versión futura— cae a Básico. El arranque
// en frío nunca deja al jugador sin nivel.
export function normalizarNivel(id) {
  return esNivelValido(id) ? id : NIVEL_POR_DEFECTO
}

// Preselección de la pantalla de dificultad (v1.0 §4.2): la última elección
// guardada; si no hay ninguna, Básico.
//
// REGLA DURA que esta función NO puede romper por sí sola y que la pantalla
// debe respetar: **la memoria preselecciona, jamás salta la pantalla**. Esto
// devuelve qué opción viene marcada, no adónde ir. Un recorrido que entrara
// directo a la mesa con el nivel de ayer convertiría una preferencia en una
// decisión tomada por otro.
export function preseleccion(guardado) {
  return normalizarNivel(guardado)
}

// El PASAJERO (v1.0 §2.2, vía C). Se cuelga del estado en su creación, que es
// el único momento en que se escribe: nace con la mesa y muere con el
// componente, y por eso D-7 —el nivel congelado durante toda la mesa— queda
// satisfecha por construcción, sin maquinaria de congelado.
//
// El motor NO lo conoce y no hace falta que lo conozca: lo transporta a ciegas
// en sus spreads. Esa supervivencia está verificada (NIV-0 §3 y la puerta extra
// del banco NIV-B0) y no se re-verifica aquí.
//
// En esta tanda `aiPlayer` no lo lee: viaja INERTE. Δ=0 de conducta de juego.
export function conNivel(state, nivel) {
  return { ...state, nivelIA: normalizarNivel(nivel) }
}
