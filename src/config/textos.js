// ── IDI-0 · La plomería de idiomas ──────────────────────────────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §2.2.
//
// Módulo SIN React ni DOM (molde de `niveles.js`, `tapetes.js`, `consultas.js`):
// resuelve claves y nada más. Todo lo que huele a navegador —leer `localStorage`,
// escribir `<html lang>`— vive en `hooks/useIdioma.js`, que es el único sitio de
// IDI-0 que toca el DOM. La separación no es orden: es lo que permite que Vitest
// importe este archivo tal cual, sin jsdom (que este proyecto no tiene: hallazgo
// de FRZ-1).
//
// ── POR QUÉ NO HAY LIBRERÍA ─────────────────────────────────────────────────
// La Fase 0 §3 midió terreno virgen: cero dependencias de i18n, cero `t(`, cero
// `ajilei.idioma`. Lo que el lobby necesita son 18 cadenas y un fallback; i18next
// pesa ~40 KB para traer pluralización, interpolación, namespaces y detección de
// idioma que aquí no tienen consumidor. Cuando alguno lo tenga, esta capa es
// exactamente el sitio donde se sustituye —los consumidores sólo conocen `t`—.

import { TEXTOS_ES } from './textos.es.js'

// ── Los cinco ids del selector de la Portada ────────────────────────────────
// `screens/Portada.jsx:122-128` ya ofrece es · en · pt · fr · it con su bandera,
// y esos ids SON el contrato heredado: cuando IDI-1 escriba `textos.en.js` el id
// tiene que ser `'en'` y no `'eng'` ni `'en-US'`, o el selector y el diccionario
// hablarán de cosas distintas. Se dejan escritos aquí para que ese día no haya
// que ir a buscarlos.
//
//   es → Español (VE)   en → English (US)   pt → Português (BR)
//   fr → Français (FR)  it → Italiano (IT)
//
// `IDIOMAS_DISPONIBLES` es la lista de los que TIENEN diccionario, que hoy es
// uno. Es deliberadamente distinta de la lista de la Portada: aquélla enseña
// cinco y desactiva cuatro; ésta declara con cuáles se puede pintar de verdad.
export const IDIOMA_POR_DEFECTO = 'es'
export const IDIOMAS_DISPONIBLES = ['es']

// Convención de la casa `ajilei.<cosa>`, la misma de `ajilei.nivel`,
// `ajilei.tapete`, `ajilei.consultas` y `ajilei.sound` (Fase 0 §3.2). La clave
// nace aquí aunque todavía nadie escriba en ella: `useIdioma` ya la LEE, y así
// una preferencia sembrada a mano —o por IDI-1— funciona desde el primer día.
export const CLAVE_IDIOMA_STORAGE = 'ajilei.idioma'

const DICCIONARIOS = {
  es: TEXTOS_ES,
}

// ── El fallback VISIBLE, y por qué no es la cadena vacía ────────────────────
// Una clave que no existe devuelve `⟦lob.loquesea⟧`, no `''`. La diferencia es
// todo: una cadena vacía deja un botón mudo que nadie nota hasta que un jugador
// lo reporta, y los corchetes blancos cantan en la primera captura del arnés.
// Es lo que el modo `lob` mide en su punto 4 —`innerText` no contiene `⟦`—, así
// que una traducción olvidada sale ROJA en la corrida, no en producción.
const AVISADAS = new Set()

/**
 * Resuelve una clave de texto.
 * @param {string} clave        p. ej. 'lob.cta.ia'
 * @param {string} [idioma]     id de idioma; cae al por defecto si no hay diccionario
 * @returns {string}            el texto, o `⟦clave⟧` si no existe
 */
export function t(clave, idioma = IDIOMA_POR_DEFECTO) {
  const dicc = DICCIONARIOS[idioma] ?? DICCIONARIOS[IDIOMA_POR_DEFECTO]
  const valor = dicc?.[clave]
  if (typeof valor === 'string' && valor.length > 0) return valor

  // UN aviso por clave y por vida del módulo. Sin el guardia, una clave rota
  // dentro de un render escupe una línea por fotograma y ahoga la consola —que
  // es justo donde `puerta.5` de diagPUE exige silencio.
  if (!AVISADAS.has(clave)) {
    AVISADAS.add(clave)
    console.warn(`IDI-0: clave sin traducir en "${idioma}" — ${clave}`)
  }
  return `⟦${clave}⟧`
}

/** ¿Este id tiene diccionario propio? Lo usa `useIdioma` para decidir el fallback. */
export function idiomaValido(id) {
  return IDIOMAS_DISPONIBLES.includes(id)
}

/** Las claves de un diccionario. La usa el test para comparar hermanos en IDI-1. */
export function clavesDe(idioma = IDIOMA_POR_DEFECTO) {
  return Object.keys(DICCIONARIOS[idioma] ?? {})
}
