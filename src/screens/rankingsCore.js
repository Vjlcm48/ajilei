import { montoTexto } from '../config/tapetes'

// ── RNK-1c · Lo puro de la pantalla «Rankings» ──────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §2.3. Sin React: lo prueba
// `rankingsCore.test.js`.
//
// EL CLIENTE NO CALCULA PUESTOS NI FRANJAS (regla 5). Puesto, total y franja
// llegan de `ranking_top` / `ranking_mio` y aquí sólo se eligen la frase y el
// formato de la cifra. «Dentro del top» es `puesto ≤ 100`: con el puesto único
// del Ajuste A, es exactamente estar en la lista.

export const PESTANAS = Object.freeze(['maestros', 'fortunas'])
// Siempre abre en Maestros; no se recuerda la última (§0, INV-12 intacto).
export const PESTANA_INICIAL = 'maestros'
export const TAMANO_TOP = 100

/**
 * El estado de lo que pinta la lista.
 * @param {{ ranking: string, top: object, mio: object } | null} respuesta
 *   lo que contestaron `top` y `mio` para la pestaña activa, o `null` mientras llega.
 * @returns {'cargando' | 'listo' | 'sinred' | 'vacio'}
 */
export function estadoDe(respuesta) {
  if (!respuesta) return 'cargando'
  const { ranking, top, mio } = respuesta
  if (top?.ok !== true || mio?.ok !== true) return 'sinred'
  // Fortunas no puede quedar vacío (todos tienen billetera); Maestros sí, el
  // día que nadie haya ganado una mano.
  if (ranking === 'maestros' && top.filas.length === 0) return 'vacio'
  return 'listo'
}

/** La cifra con el separador de miles de la casa (`montoTexto`): «13.050». */
export function cifraTexto(n) {
  return montoTexto(n)
}

/**
 * La frase de la línea de «Tu posición»: la clave y sus variables.
 * Sin fila en Maestros → «Gana tu primera mano para entrar». Sin fila en
 * Fortunas no debería pasar; la banda queda en hueco (`null`).
 */
export function textoBanda({ ranking, mio }) {
  if (!mio) return ranking === 'maestros' ? { clave: 'rnk.tu.vacio', vars: {} } : null
  const n = cifraTexto(mio.puesto)
  if (mio.puesto <= TAMANO_TOP) return { clave: 'rnk.tu.puesto', vars: { n } }
  return { clave: 'rnk.tu.franja', vars: { n, p: mio.franja } }
}

/**
 * Ajuste A de la 1c-i (M-4) · «Se muestran los 100 primeros.» sólo cuando la
 * lista trae EXACTAMENTE 100 filas: con menos, la frase no es verdad y no se
 * pinta (el hueco Premium sí se queda).
 */
export function muestraFin(filas) {
  return Array.isArray(filas) && filas.length === TAMANO_TOP
}

/** ¿Esta fila es la tuya? Por username, sin mayúsculas (nunca por uuid, INV-67). */
export function esTu(fila, usuario) {
  if (typeof fila?.username !== 'string' || typeof usuario !== 'string' || usuario === '') return false
  return fila.username.toLowerCase() === usuario.toLowerCase()
}
