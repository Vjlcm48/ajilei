// ── RNK-1 1e · El intersticial de SumaMente: la decisión, sin React ni almacén ──
// Rector: AJILEI_RNK-1_Fase1e_v1.0.md §0 («El contador») y §2.1. Módulo PURO:
// Vitest lo importa tal cual. La persistencia vive en `sumaContador.js`; la
// pantalla, en `screens/IntersticialSumaMente.jsx`; quien junta las tres cosas
// es `App` (`entrarRankings`).
//
// LAS CUATRO REGLAS (selladas por Victor, 2026-10-25 al 28):
//   1. Una entrada = tocar «Rankings» en el lobby. Nada más cuenta: ni cambiar
//      de pestaña, ni abrir tarjetas, ni «Ver tu nuevo ranking» desde la
//      victoria (que no pasa por aquí: abre el mini-perfil dentro de la mesa).
//   2. El video sale en la entrada n.º 8 y luego cada 8, si ese DÍA DE CHICAGO
//      aún no salió. Al salir, el contador vuelve a 0 y el día queda gastado.
//   3. Si el turno cae en un día gastado, no sale y el contador vuelve a 0
//      igual: el turno se pierde, no se guarda deuda.
//   4. «Omitir» cuenta como visto: el día se gasta cuando el intersticial
//      APARECE (es `decidir` quien lo gasta, no el final del video).
// Y nunca para Premium.

// Revisable con los datos de los testers (§0): bajarlo es cambiar esta cifra.
export const CADA_ENTRADAS = 8

// La ficha de Google Play de SumaMente (§0, «Botón de Google Play»).
export const ENLACE_PLAY = 'https://play.google.com/store/apps/details?id=com.heptacreation.sumamente'

// «Omitir» (y el botón «atrás» de Android) se encienden a los 5 s de video.
export const OMITIR_MS = 5000
// Si el video no llega a arrancar (red caída, ahorro de batería que bloquea
// hasta el arranque en silencio), «Omitir» sale igual a los 8 s de montar la
// pantalla: nadie se queda atrapado detrás de un icono.
export const RESCATE_MS = 8000

// 'en-CA' formatea como ISO ('2026-10-28') y la zona la fija Chicago: el día
// cambia a la medianoche de Chicago, no a la del aparato.
const FORMATO_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
})

/** El día de Chicago de `fecha`, como 'YYYY-MM-DD'. */
export function diaChicago(fecha = new Date()) {
  return FORMATO_DIA.format(fecha)
}

/**
 * La decisión de una entrada a Rankings.
 * @param {{ n: number, ultimoDia: string|null, hoy: string, premium: boolean }} p
 *   `n`: entradas contadas desde el último turno (0–7); `ultimoDia`: el día de
 *   Chicago en que el video salió por última vez (o `null`).
 * @returns {{ mostrar: boolean, n: number, ultimoDia: string|null }} lo que se
 *   enseña y lo que hay que guardar.
 */
export function decidir({ n, ultimoDia = null, hoy, premium = false }) {
  const siguiente = (Number.isInteger(n) && n >= 0 ? n : 0) + 1
  // Regla 1: aún no es el turno.
  if (siguiente < CADA_ENTRADAS) return { mostrar: false, n: siguiente, ultimoDia }
  // Regla 2: es el turno y el día está libre.
  if (!premium && ultimoDia !== hoy) return { mostrar: true, n: 0, ultimoDia: hoy }
  // Regla 3 (y Premium): el turno se pierde y el contador vuelve a 0.
  return { mostrar: false, n: 0, ultimoDia }
}

/** El video del idioma de `t()`: `es` → el español; cualquier otro → el inglés. */
export function videoDe(idioma) {
  return idioma === 'es' ? '/sumamente/sumamente_promo_es.mp4' : '/sumamente/sumamente_promo_en.mp4'
}
