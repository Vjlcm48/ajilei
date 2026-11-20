// ── TUT-1 · Las marcas del tutorial, en el aparato ──────────────────────────
// Rector: AJILEI_TUT-1_T1_v1.0.md §1.4; normativo AJILEI_Tutorial_v1.0.md §1.2,
// §1.4 y §2.1. Molde de `partidaRapida.js`: almacén inyectable, todo con `try`.
//
// UNA clave, `ajilei.guia`, con un objeto pequeño:
//   { ofrecida, hecha, senales: { iniciar, apostar, descartar }, vistos: [capítulos] }
//   · `ofrecida`: la oferta del primer login ya salió (no vuelve sola);
//   · `hecha`: la partida guiada se terminó;
//   · `senales`: cada pista de primera vez ya se apagó con su acción;
//   · `vistos`: los capítulos de «Cómo se juega» con su ✓ (1 a 10, sin repetir).
// Es local y de ESTE aparato, como el ojito: no viaja al servidor ni sigue a la
// cuenta (§2.3: nada en `eventos` en la v1). Lo borra `limpiarAparato` con
// todas las `ajilei.*` al eliminar la cuenta.
//
// En la tanda 1 nadie lo lee: lo leen la oferta (tanda 3), las señales (tanda 3)
// y el índice (tanda 4). El almacén puede fallar, venir vacío o traer basura:
// cualquier cosa que no sea la forma de arriba se lee como «nada hecho».

const CLAVE = 'ajilei.guia'

/** Las tres pistas de primera vez (normativo §1.4). */
export const SENALES = Object.freeze(['iniciar', 'apostar', 'descartar'])
/** Los capítulos de la serie (normativo §2.2). */
export const CAPITULOS = 10

/** El estado de un aparato que nunca vio el tutorial. */
export const estadoVacio = () => ({
  ofrecida: false,
  hecha: false,
  senales: { iniciar: false, apostar: false, descartar: false },
  vistos: [],
})

const esCapitulo = (n) => Number.isInteger(n) && n >= 1 && n <= CAPITULOS

/** Lo que se guardó, saneado: sólo lo que tiene la forma de arriba. Pura. */
export function normalizar(crudo) {
  const v = estadoVacio()
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return v
  v.ofrecida = crudo.ofrecida === true
  v.hecha = crudo.hecha === true
  const s = crudo.senales && typeof crudo.senales === 'object' ? crudo.senales : {}
  for (const k of SENALES) v.senales[k] = s[k] === true
  v.vistos = Array.isArray(crudo.vistos) ? [...new Set(crudo.vistos.filter(esCapitulo))].sort((a, b) => a - b) : []
  return v
}

const almacenDelNavegador = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

/** @param {() => Storage|null} [almacen] */
export function crearGuia(almacen = almacenDelNavegador) {
  const leer = () => {
    try {
      const t = almacen()?.getItem(CLAVE)
      return normalizar(t ? JSON.parse(t) : null)
    } catch { return estadoVacio() }
  }
  const guardar = (estado) => {
    try { almacen()?.setItem(CLAVE, JSON.stringify(normalizar(estado))) } catch { /* sin almacén, dura lo que la página */ }
  }
  const cambiar = (f) => { const e = leer(); f(e); guardar(e); return e }
  return {
    /** El estado entero, saneado. */
    leer,
    /** La oferta del primer login ya salió. */
    marcarOfrecida: () => cambiar((e) => { e.ofrecida = true }),
    /** La partida guiada se terminó. */
    marcarHecha: () => cambiar((e) => { e.hecha = true }),
    /** Una pista de primera vez se apagó (`iniciar`, `apostar` o `descartar`). */
    marcarSenal: (senal) => cambiar((e) => { if (SENALES.includes(senal)) e.senales[senal] = true }),
    /** Un capítulo se vio entero (1 a 10). */
    marcarVisto: (n) => cambiar((e) => { if (esCapitulo(n) && !e.vistos.includes(n)) e.vistos.push(n) }),
  }
}

export const guia = crearGuia()
