// ── PES-1 · Los códigos de lugar: lo único que la entrada necesita ──────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §3-D. Validar lo que llega del servidor
// (INV-74) y saber si hay bandera solo pide los códigos. Los nombres viajan con
// lo que los enseña (`lugarCore`, Perfil, Rankings y el mini-perfil), y evaluar
// este módulo en la Portada no construye ninguno.
import { CODIGOS_PAIS, CODIGOS_ESTADO_VE } from '../config/lugaresCodigos'

const PAISES = new Set(CODIGOS_PAIS)
const ESTADOS = new Set(CODIGOS_ESTADO_VE)

export const esPais = (c) => PAISES.has(c)
export const esEstado = (pais, c) => pais === 'VE' && ESTADOS.has(c)

/**
 * Lo que llega del servidor, validado contra las listas (INV-74): un país que
 * no está en la lista se lee como «sin país», y un estado sin Venezuela o fuera
 * de la lista, como «sin estado». Nunca lanza.
 */
export function lugarValido(pais, estado) {
  const p = esPais(pais) ? pais : null
  return { pais: p, estado: esEstado(p, estado) ? estado : null }
}
