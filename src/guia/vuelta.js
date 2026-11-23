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
