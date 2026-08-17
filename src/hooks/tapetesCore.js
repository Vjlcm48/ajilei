import { TAPETES, TAPETE_POR_DEFECTO, esGratuito, tapetePorId } from '../config/tapetes'

// ── EMB-2 · Núcleo puro de los tapetes ───────────────────────────────────────
// Documento rector: docs/AJILEI_Tapetes_v1.0.md §4 (UX de compra) y §5
// (economía y persistencia).
// Sin React, sin DOM, sin localStorage: sólo las semánticas —qué id es válido,
// qué está comprado, qué pasa al presionar un swatch y cómo se serializa la
// propiedad— como funciones puras para que Vitest las selle. El hook
// (useTapetes) se limita a leer, escribir y sostener el estado; toda decisión
// vive aquí. Mismo molde que nivelCore (NIV-UI) y consultasCore (U3).

const IDS = TAPETES.map(t => t.id)

export function esTapeteValido(id) {
  return IDS.includes(id)
}

// Todo lo que no sea un id conocido —null, basura de un localStorage
// manipulado con F12, un id retirado en una versión futura— cae al verde. El
// arranque en frío nunca deja al jugador sin tapete, y un storage corrupto
// jamás rompe la mesa (v1.0 §3: el default es la ausencia de variante).
export function normalizarTapete(id) {
  return esTapeteValido(id) ? id : TAPETE_POR_DEFECTO
}

// ── Propiedad ───────────────────────────────────────────────────────────────
// Serialización en CSV de ids y no en JSON: `JSON.parse` de una cadena
// manipulada LANZA, y la propiedad de los cosméticos no puede ser una vía de
// tumbar la mesa. Un split filtrado degrada solo — lo desconocido se ignora.
//
// El gratuito SIEMPRE está dentro, venga lo que venga en disco: es propiedad de
// todos por definición y no depende de que la clave exista.
export function parseComprados(raw) {
  const sueltos = String(raw ?? '').split(',').map(s => s.trim())
  return normalizarComprados(sueltos)
}

export function serializarComprados(ids) {
  return normalizarComprados(ids).join(',')
}

// Orden CANÓNICO —el del catálogo— y sin repetidos: así la cadena guardada es
// una función del conjunto y no del orden de compra. Dos jugadores con los
// mismos tapetes escriben la misma cadena, y una re-escritura no ensucia disco.
export function normalizarComprados(ids) {
  const dentro = new Set((ids ?? []).filter(esTapeteValido))
  IDS.filter(esGratuito).forEach(id => dentro.add(id))
  return IDS.filter(id => dentro.has(id))
}

export function estaComprado(id, comprados) {
  return esGratuito(id) || (comprados ?? []).includes(id)
}

// La compra REGISTRA PROPIEDAD Y NO COBRA (v1.0 §5, doctrina sellada del cobro
// de Mano Actual): la economía nace autoritativa en Supabase, porque una
// billetera en localStorage es falsificable con F12 y enseñaría que la economía
// es de mentira. Cuando ECO-1 despierte, propiedad y descuento nacen juntos:
// el descuento entra AQUÍ, en esta función, y en ningún otro sitio.
export function comprar(id, comprados) {
  if (!esTapeteValido(id)) return normalizarComprados(comprados)
  return normalizarComprados([...(comprados ?? []), id])
}

// ── Los tres estados visuales del swatch (v1.0 §4) ──────────────────────────
// 'activo' gana a 'comprado': el resalte es la respuesta a "¿cuál tengo
// puesto?", que es la primera pregunta del panel.
export function estadoSwatch(id, activo, comprados) {
  if (id === activo) return 'activo'
  return estaComprado(id, comprados) ? 'comprado' : 'no-comprado'
}

// ── Qué ocurre al presionar un swatch (v1.0 §4) ─────────────────────────────
// Devuelve la intención, no el efecto: quién aplica, quién persiste y quién
// abre el diálogo es del hook. Tres desenlaces exactos y ninguno más:
//   'nada'     — ya está activo: no-op (ni un repintado, ni un diálogo).
//   'aplicar'  — comprado: se activa y persiste. Cambio libre, sin costo y sin
//                límite entre comprados.
//   'previsualizar' — no comprado: se aplica AL INSTANTE como vista previa con
//                el diálogo de compra encima. La mesa es el probador.
export function decidirPresion(id, activo, comprados) {
  if (!esTapeteValido(id)) return { accion: 'nada', tapete: activo }
  if (id === activo) return { accion: 'nada', tapete: id }
  if (estaComprado(id, comprados)) return { accion: 'aplicar', tapete: id }
  return { accion: 'previsualizar', tapete: id }
}

// El texto del diálogo se compone desde la fuente única, jamás desde JSX: ni el
// nombre ni el monto se escriben a mano en ningún componente (v1.0 §1).
export function textoCompra(id) {
  const t = tapetePorId(id)
  return t ? { nombre: t.nombre, precio: t.precio } : null
}

// ── Lo que se PINTA: el tapete en vuelo ─────────────────────────────────────
// La vista previa NO persiste (v1.0 §4: «No» o cerrar revierten al activo).
// Que sea una derivación y no un segundo estado es lo que hace imposible la
// fuga: no hay ninguna rama en la que la previa se escriba a disco, porque
// quien se escribe es `activo` y la previa nunca lo toca.
export function tapeteVisible(activo, previa) {
  return normalizarTapete(previa ?? activo)
}
