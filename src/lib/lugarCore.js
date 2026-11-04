// ── CFG-1 1b · «De dónde eres»: lo puro ─────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.1 (R-12). Copia de la lámina
// `laminas/cfg1b/lugar.jsx`, sin React: buscar, el texto del lugar y la
// validación de lo que llega del servidor. Lo prueba `lugarCore.test.js`.
import { PAISES } from '../config/paises'
import { ESTADOS_VE } from '../config/estados'

// PES-1 §3-D · la validación solo pide códigos y vive en la entrada.
export { lugarValido } from './lugarCodigos'

export const POR_CODIGO = new Map(PAISES.map((p) => [p.c, p]))
const ESTADO_POR_CODIGO = new Map(ESTADOS_VE.map((e) => [e.c, e]))

// El atajo «Donde más estamos» (V3-A), en este orden: Venezuela y la diáspora.
export const DIASPORA = Object.freeze(['VE', 'US', 'CO', 'ES', 'CL', 'PE', 'EC', 'AR', 'PA', 'MX'])

// ── Normalizar: sin tildes, sin mayúsculas, sin puntuación ─────────────────
// «Perú» → «peru», «EE. UU.» → «ee uu», «Curaçao» → «curacao».
export function normalizar(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
const junto = (s) => s.replace(/ /g, '')

// Una entrada casa si CADA palabra de lo escrito es comienzo de alguna palabra
// de un mismo nombre, o si lo escrito sin espacios es comienzo del nombre sin
// espacios («eeuu» con «EE. UU.», «estadosu» con «Estados Unidos»). Comienzo y
// no «contiene»: «us» no encuentra «Rusia».
function casa(q, nombre) {
  const n = normalizar(nombre)
  if (!n) return 0
  if (junto(n).startsWith(junto(q))) return 2
  const pals = n.split(' ')
  return q.split(' ').every((w) => pals.some((p) => p.startsWith(w))) ? 1 : 0
}

/**
 * Los países que casan con `texto`, por su nombre, el inglés y sus alias; los
 * que empiezan por él primero y, dentro de cada nota, en orden alfabético.
 */
export function buscarPaises(texto) {
  const q = normalizar(texto)
  if (!q) return PAISES
  const r = []
  for (const p of PAISES) {
    const nota = Math.max(casa(q, p.n) * 2, casa(q, p.en), ...p.a.map((a) => casa(q, a)))
    if (nota > 0) r.push([nota, p])
  }
  return r.sort((x, y) => y[0] - x[0]).map(([, p]) => p) // `sort` es estable
}

/** El país si el código está en la lista, o `null`. */
export const paisDe = (c) => POR_CODIGO.get(c) ?? null

/** El estado si el país es Venezuela y el código está en la lista, o `null`. */
export const estadoDe = (pais, c) => (pais === 'VE' ? ESTADO_POR_CODIGO.get(c) ?? null : null)

/** «Venezuela · Zulia», «Venezuela», «España» o '' (sin país). */
export function textoLugar(pais, estado) {
  const p = paisDe(pais)
  if (!p) return ''
  const e = estadoDe(pais, estado)
  return e ? `${p.n} · ${e.n}` : p.n
}
