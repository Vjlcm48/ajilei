import { esTu, cifraTexto } from '../screens/rankingsCore'

// ── RNK-1c-ii · Lo puro del mini-perfil ─────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §2.1. Sin React: lo prueba
// `miniPerfilCore.test.js`. La tarjeta es UNA (la abren Rankings y, con la 1d,
// la victoria), así que lo que decide qué dice vive aquí y no en la pantalla.
//
// El cliente NO calcula puestos (regla 5 de la 1c-i): llegan de `mini_perfil`
// y aquí sólo se elige la frase y el formato de la cifra.

/** ¿La tarjeta es la tuya? Por username sin mayúsculas (`esTu`), nunca por uuid (INV-67). */
export function esPropio(username, usuarioSesion) {
  return esTu({ username }, usuarioSesion)
}

/**
 * Las dos líneas de rankings: clave y variables de cada una.
 * Sin puesto de Maestros (ningún punto): en la tuya, «Gana tu primera mano
 * para entrar» (`rnk.tu.vacio`, la misma frase que la banda); en la de otro,
 * «Aún no está en este ranking» (`rnk.perfil.sinpuntos`, Ajuste B: la otra le
 * habla a quien mira). Sin perfil, las dos en hueco.
 * @param {{ puestoMaestros: number|null, puntos: number|null,
 *           puestoFortunas: number|null, saldo: number|null } | null} perfil
 * @param {boolean} propio
 */
export function lineasDe(perfil, propio = false) {
  if (!perfil) return { maestros: null, fortunas: null }
  const maestros = perfil.puestoMaestros === null || perfil.puestoMaestros === undefined
    ? { clave: propio ? 'rnk.tu.vacio' : 'rnk.perfil.sinpuntos', vars: {} }
    : { clave: 'rnk.perfil.puntos', vars: { n: cifraTexto(perfil.puestoMaestros), p: cifraTexto(perfil.puntos ?? 0) } }
  // Todos tienen billetera, así que Fortunas siempre trae puesto; si un día no,
  // la línea queda en hueco en vez de inventar un cero.
  const fortunas = perfil.puestoFortunas === null || perfil.puestoFortunas === undefined
    ? null
    : { clave: 'rnk.perfil.hc', vars: { n: cifraTexto(perfil.puestoFortunas), s: cifraTexto(perfil.saldo ?? 0) } }
  return { maestros, fortunas }
}

/**
 * El estado de la tarjeta según lo que contestó `api.perfil`.
 * @returns {'cargando' | 'listo' | 'nohay' | 'sinred'}
 */
export function estadoPerfil(respuesta) {
  if (!respuesta) return 'cargando'
  if (respuesta.ok !== true) return 'sinred'
  return respuesta.perfil ? 'listo' : 'nohay'
}
