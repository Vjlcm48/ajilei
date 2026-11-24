// ── TUT-1 T4 · A dónde vuelve un capítulo ──────────────────────────────────
// Un capítulo abierto desde el índice vuelve al índice (P-5): «Cómo se juega» abre su
// vista de temas en vez de las tres tarjetas. La marca vive en el trozo del tutorial y
// se consume al leerla: así `App` sólo sabe que el capítulo vuelve a «Cómo se juega»
// (una rama menos en la entrada, `1.8b`).
let alIndice = false

/** El capítulo se cierra (o termina): la próxima «Cómo se juega» abre el índice. */
export function volverAlIndice() { alIndice = true }

/** ¿Hay que abrir el índice? Lo dice una vez. */
export function tomarVuelta() {
  const v = alIndice
  alIndice = false
  return v
}

// ── TUT-1 T5 · El paso en curso, entre pantallas ───────────────────────────
// Un capítulo de la Pista C pasa de una pantalla a otra (el lobby, Salas, Armar mesa, la
// mesa congelada): en cada una se monta un `Capitulo` nuevo, que sigue por el paso en que
// iba el anterior. Lo guarda este trozo, no `App`. Mientras hay uno, la puerta de la guiada
// del lobby calla (ni oferta ni reintento del premio: nada escribe dentro de un capítulo).
let enCurso = null

/** El paso por el que sigue el capítulo `n` (o `null` si no iba por ninguno). */
export function pasoEnCurso(n) { return enCurso?.n === n ? enCurso.i : null }

/** El capítulo `n` va por el paso `i`. */
export function anotarPaso(n, i) { enCurso = { n, i } }

/** El capítulo se cerró o terminó. */
export function soltarCapitulo() { enCurso = null }

/** ¿Hay un capítulo abierto desde el índice? */
export function hayCapitulo() { return enCurso !== null }
