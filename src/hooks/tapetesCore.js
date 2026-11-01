import { TAPETE_POR_DEFECTO, TONOS, TONO_POR_DEFECTO, esGratuito, conTonos, tapetePorId } from '../config/tapetes'

// ── EMB-2 · Núcleo puro de los tapetes ───────────────────────────────────────
// Documento rector: docs/AJILEI_Tapetes_v1.0.md §4 y §5; TIE-1 1a (la tienda).
// Sin React, sin DOM, sin localStorage: sólo las semánticas —qué id y qué tono
// son válidos, qué dice el inventario del servidor y qué atributos lleva la
// mesa— como funciones puras para que Vitest las selle. El hook (useTapetes) y
// el canal (lib/controlTapetes) sostienen el estado; toda decisión vive aquí.
// Mismo molde que nivelCore (NIV-UI) y consultasCore (U3).
//
// ── TIE-1 1a · LA PROPIEDAD YA NO VIVE AQUÍ ──────────────────────────────────
// Hasta la 1a este núcleo «compraba»: añadía el id a una lista en el aparato,
// sin cobrar. Lo comprado y lo puesto los dice ahora el servidor
// (`mi_inventario`, INV-76) y este archivo sólo los LEE: `desdeInventario`. La
// compra, el uso y el tono son RPC (`lib/tiendaApi`) y el estado local se
// actualiza con su `'ok'`, nunca antes.

const IDS = ['verde', 'grafito', 'azul', 'vinotinto', 'tricolor'].filter((id) => tapetePorId(id))

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

// El tono de un tapete: uno de los tres si el tapete los tiene ('actual' si no
// llega uno válido) y `null` si no los tiene (verde, tricolor).
export function normalizarTono(id, tono) {
  if (!conTonos(id)) return null
  return TONOS.includes(tono) ? tono : TONO_POR_DEFECTO
}

// ── Lo que dice el servidor ──────────────────────────────────────────────────
// Las filas de `mi_inventario('tapete')` (`{ tipo, articulo, tono, en_uso }`)
// en el estado del cliente:
//   comprados  { id: tono } de los de pago que el jugador tiene (tono `null` en
//              los que no tienen tonos);
//   enUso      el id en uso, o el verde si ninguna fila lo está (el verde no
//              tiene fila: tie1a_inventario §1);
//   tono       el tono del que está en uso, o `null`.
// Lo que no se entiende —otro tipo, un id que este cliente no conoce, el verde
// con fila— se ignora: un cliente viejo frente a un catálogo nuevo no se rompe.
export function desdeInventario(filas) {
  const comprados = {}
  let enUso = TAPETE_POR_DEFECTO
  for (const f of Array.isArray(filas) ? filas : []) {
    if (!f || f.tipo !== 'tapete' || !esTapeteValido(f.articulo) || esGratuito(f.articulo)) continue
    comprados[f.articulo] = normalizarTono(f.articulo, f.tono)
    if (f.en_uso === true) enUso = f.articulo
  }
  return { comprados, enUso, tono: enUso === TAPETE_POR_DEFECTO ? null : comprados[enUso] }
}

/** ¿El jugador lo tiene? El gratuito, siempre. */
export function estaComprado(id, comprados) {
  return esGratuito(id) || Object.hasOwn(comprados ?? {}, id)
}

// ── Lo que se pone en `<body>` mientras vive la mesa ────────────────────────
// `data-tapete` sólo fuera del verde (el verde es la ausencia de variante, v1.0
// §3) y `data-tapete-tono` sólo en un tono que no sea 'actual' de un tapete que
// los tenga. `null` = sin atributo. Lo mismo vale para la `.vit` de la vitrina:
// los dos leen los mismos 9 valores (tapetes.css §1b, INV-77).
export function atributosTapete(id, tono) {
  const tapete = normalizarTapete(id)
  const t = normalizarTono(tapete, tono)
  return {
    tapete: tapete === TAPETE_POR_DEFECTO ? null : tapete,
    tono: t === null || t === TONO_POR_DEFECTO ? null : t,
  }
}
