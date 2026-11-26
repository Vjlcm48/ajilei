// ── TUT-1 · Las marcas del tutorial, en el aparato ──────────────────────────
// Rector: AJILEI_TUT-1_T1_v1.0.md §1.4 y AJILEI_TUT-1_T3_v1.0.md §2.1; normativo
// AJILEI_Tutorial_v1.5.md §1.2, §1.5, §1.6 y §2.1. Molde de `partidaRapida.js`:
// almacén inyectable, todo con `try`.
//
// UNA clave, `ajilei.guia`, con un objeto pequeño:
//   { ofrecida, pendientePago, senales: { iniciar, apostar, descartar }, vistos: [capítulos] }
//   · `ofrecida`: la oferta del primer login ya salió (no vuelve sola);
//   · `pendientePago`: la guiada llegó a su cierre y el premio no se confirmó
//     (sin red): el lobby reintenta `cobrar_guiada` mientras diga que sí.
//     TANDA 3 · «guiada hecha» YA NO VIVE AQUÍ: la verdad es la fila del servidor
//     (`premios_guiada`, que `premio_guiada_estado` lee). La `hecha` de la tanda 2
//     se descarta al leer: un aparato no puede decir que alguien cobró;
//   · `senales`: cada pista de primera vez ya se apagó con su acción;
//   · `vistos`: los capítulos de «Cómo se juega» con su ✓ (1 a 10, sin repetir).
// Es local y de ESTE aparato, como el ojito: no viaja al servidor ni sigue a la
// cuenta (§2.3: nada en `eventos` en la v1). Lo borra `limpiarAparato` con
// todas las `ajilei.*` al eliminar la cuenta.
//
// Lo leen la oferta y el reintento del lobby (`PuertaGuiada`), el cierre de la
// guiada, las señales de primera vez (tanda 3) y el índice (tanda 4). El almacén puede fallar, venir vacío o traer basura:
// cualquier cosa que no sea la forma de arriba se lee como «nada hecho».

const CLAVE = 'ajilei.guia'

/** Las tres pistas de primera vez (normativo §1.6). */
export const SENALES = Object.freeze(['iniciar', 'apostar', 'descartar'])
/** Los capítulos de la serie (normativo §2.2). */
export const CAPITULOS = 10
/** TUT-1 T6 · el capítulo que la ruta de la primera vez enseña antes de la guiada (§1.2.1). */
export const CAPITULO_DE_LA_RUTA = 2

/** El estado de un aparato que nunca vio el tutorial. */
export const estadoVacio = () => ({
  ofrecida: false,
  pendientePago: false,
  senales: { iniciar: false, apostar: false, descartar: false },
  vistos: [],
})

const esCapitulo = (n) => Number.isInteger(n) && n >= 1 && n <= CAPITULOS

/** Lo que se guardó, saneado: sólo lo que tiene la forma de arriba. Pura. */
export function normalizar(crudo) {
  const v = estadoVacio()
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return v
  v.ofrecida = crudo.ofrecida === true
  v.pendientePago = crudo.pendientePago === true
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
    /** La guiada llegó a su cierre: el premio queda por confirmar hasta que el servidor conteste. */
    marcarPendiente: () => cambiar((e) => { e.pendientePago = true }),
    /** El servidor dijo `pagado` o `cobrado`: ya no hay nada que reintentar. */
    quitarPendiente: () => cambiar((e) => { e.pendientePago = false }),
    /** Una pista de primera vez se apagó (`iniciar`, `apostar` o `descartar`). */
    marcarSenal: (senal) => cambiar((e) => { if (SENALES.includes(senal)) e.senales[senal] = true }),
    /** Un capítulo se vio entero (1 a 10). */
    marcarVisto: (n) => cambiar((e) => { if (esCapitulo(n) && !e.vistos.includes(n)) e.vistos.push(n) }),
    /**
     * TUT-1 T6 · ¿«Jugar la guiada» pasa antes por la ruta de la primera vez (v1.5 §1.2.1)?
     * Sí mientras este aparato no tenga el ✓ del capítulo 2 («Cuánto vale cada carta»).
     */
    rutaPendiente: () => !leer().vistos.includes(CAPITULO_DE_LA_RUTA),
  }
}

export const guia = crearGuia()
