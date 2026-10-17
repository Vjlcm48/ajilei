// ── IOS-1 1e · Núcleo puro de la zona anclada ───────────────────────────────
// Rector: AJILEI_IOS-1_Fase1e_v1.0.md §2.3 (lámina `laminas/ios1d`, decisiones
// 3 y 2 de Victor del 2026-10-16).
//
// La zona anclada al pie de Retar, Salas y Armar mesa lleva UNA caja encima del
// botón dorado. En ella cabe una sola cosa: o una nota (lo que impide pulsar, o
// lo que pasó al pulsar) o el resumen de la mesa elegida. Nunca las dos. Antes
// el resumen iba DENTRO del botón («Retar a 4 IAS · mesa 200 · entras con
// 4.000») y el botón crecía y envolvía con cada elección; ahora el botón dice
// siempre lo mismo y mide siempre lo mismo, y las cifras viven aquí.
//
// Dos funciones, las dos sin DOM:
//   · `cajaDeAccion` decide QUÉ va en la caja, con la prioridad sellada;
//   · `elegirForma` decide CÓMO va el resumen (larga, corta o cortada con
//     «…»), preguntando a quien sabe medir. No cuenta letras: en otro idioma
//     la misma frase mide otra cosa, y lo único que no miente es la medida.

/** Lo que puede ir en la caja, de más urgente a menos (decisión 3). `aviso` es
 * la nota propia de una pantalla que no es ninguna de las de Retar (en Armar
 * mesa, «Ya hay una mesa así…»; en Salas, la nota fija del botón): va justo
 * antes del resumen, que es lo único que puede tapar. */
export const PRIORIDAD_CAJA = Object.freeze(['error', 'cobrando', 'cargando', 'falta', 'noAlcanza', 'aviso', 'resumen'])

/** Los tipos de caja que pinta la pantalla. */
export const CAJA = Object.freeze({
  NADA: 'nada',         // nada que decir: la caja guarda su línea, vacía
  ALERTA: 'alerta',     // un error: naranja y `role="alert"`
  NOTA: 'nota',         // lo que impide pulsar, o lo que conviene saber
  RESUMEN: 'resumen',   // la mesa elegida, con sus formas
})

const hayTexto = (v) => typeof v === 'string' && v.trim() !== ''

/**
 * Qué enseña la caja de la zona anclada.
 *
 * `estado` lleva, cada uno opcional:
 *   · `error`, `cobrando`, `cargando`, `falta`, `noAlcanza`, `aviso`: el TEXTO de esa
 *     nota (o nada si no toca). El error manda sobre todo: es la respuesta a lo
 *     último que hizo el jugador.
 *   · `resumen`: `{ formas: [larga, corta, …] }`, o nada si la mesa no está
 *     entera. Sólo se enseña si no hay ninguna nota.
 *   · `callar`: la caja no dice nada aunque haya nota o resumen (el bloque del
 *     video o el de la lectura fallida ya lo dicen, con su botón). El error
 *     NO se calla: un error que no se ve es un botón que no hace nada.
 *
 * Devuelve `{ tipo, texto }` para las notas, `{ tipo, formas, cifra? }` para el
 * resumen, `{ tipo: 'nada' }` si no hay nada que decir y `{ tipo: 'nada',
 * callada: true }` si se calla.
 */
export function cajaDeAccion(estado = {}) {
  if (hayTexto(estado.error)) return { tipo: CAJA.ALERTA, texto: estado.error }
  // Callada, la caja SUELTA su línea: el bloque que la calla (video, lectura)
  // va en la misma zona y ya ocupa ese sitio.
  if (estado.callar) return { tipo: CAJA.NADA, callada: true }
  for (const clave of ['cobrando', 'cargando', 'falta', 'noAlcanza', 'aviso']) {
    if (hayTexto(estado[clave])) return { tipo: CAJA.NOTA, texto: estado[clave] }
  }
  const formas = (estado.resumen?.formas ?? []).filter(hayTexto)
  if (formas.length) {
    // `cifra`: el monto que la pantalla resalta en oro (la entrada de Retar).
    return hayTexto(estado.resumen.cifra)
      ? { tipo: CAJA.RESUMEN, formas, cifra: estado.resumen.cifra }
      : { tipo: CAJA.RESUMEN, formas }
  }
  return { tipo: CAJA.NADA }
}

/**
 * La primera forma que cabe, según `cabe(texto)` (quien mide). Si ninguna cabe,
 * la ÚLTIMA (la más corta), marcada `cortada`: el CSS la termina en «…».
 * Con una lista vacía, `{ indice: -1 }`.
 */
export function elegirForma(formas, cabe) {
  if (!formas?.length) return { indice: -1, texto: '', cortada: false }
  for (let i = 0; i < formas.length; i++) {
    if (cabe(formas[i])) return { indice: i, texto: formas[i], cortada: false }
  }
  const ultima = formas.length - 1
  return { indice: ultima, texto: formas[ultima], cortada: true }
}
