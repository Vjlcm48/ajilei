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

// ── MES-PvP 3 · Los textos de un trozo diferido viajan con su trozo (INV-84) ──
// `textos.es.js` va en la entrada, y cada clave suya pesa en `1.8b`. Lo que solo pinta un
// trozo diferido (la partida entre personas: `pvp.*`) vive en su propio diccionario, que
// ese trozo SUMA al cargarse. Antes no se pide: solo lo pinta lo que el trozo monta.
const SUMADOS = {
  es: {},
}

/** Suma al idioma los textos de un trozo diferido. Lo llama el trozo al cargarse. */
export function sumarTextos(idioma, textos) {
  Object.assign(SUMADOS[idioma] ??= {}, textos)
}

// ── El fallback VISIBLE, y por qué no es la cadena vacía ────────────────────
// Una clave que no existe devuelve `⟦lob.loquesea⟧`, no `''`. La diferencia es
// todo: una cadena vacía deja un botón mudo que nadie nota hasta que un jugador
// lo reporta, y los corchetes blancos cantan en la primera captura del arnés.
// Es lo que el modo `lob` mide en su punto 4 —`innerText` no contiene `⟦`—, así
// que una traducción olvidada sale ROJA en la corrida, no en producción.
const AVISADAS = new Set()

// ── SAL-Aa · Las variables, y por qué llegan ahora ──────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §3. Hasta LOB-1 el diccionario eran 18
// rótulos fijos y `t(clave)` bastaba. Las salas no: «3 de 5 jugadores»,
// «Quedan 2:47», «Apuesta: 500 HC» son frases con huecos, y la Fase 0 §3.5
// midió que aquí no había ninguno.
//
// SE INTERPOLA EN VEZ DE TROCEAR, y ésa es toda la decisión. Partir la frase en
// `t('sal.de')` + n + `t('sal.jugadores')` es barato hoy y deja el texto
// INTRADUCIBLE mañana: el orden de las palabras cambia entre idiomas y un
// traductor que recibe tres cachos sueltos no puede reordenarlos. IDI-1 trae
// cuatro diccionarios más; la plomería tiene que aguantarlos.
//
// La sustitución es una expresión regular sobre `{nombre}` y NADA más. Sin
// `eval`, sin `new Function`, sin plantillas anidadas: el valor de una clave
// viene de un archivo del repo, pero las VARIABLES vienen del estado de la app
// —un username que otro jugador eligió, por ejemplo— y no hay motivo para que
// un texto pueda ejecutar nada.
const PATRON_VAR = /\{([a-z0-9_]+)\}/g

/**
 * Resuelve una clave de texto, sustituyendo sus variables.
 * @param {string} clave        p. ej. 'lob.cta.ia' o 'sal.espera.sentados'
 * @param {object} [vars]       valores de los huecos `{nombre}` de la cadena
 * @param {string} [idioma]     id de idioma; cae al por defecto si no hay diccionario
 * @returns {string}            el texto resuelto, o `⟦clave⟧` si no existe
 */
export function t(clave, vars = {}, idioma = IDIOMA_POR_DEFECTO) {
  const dicc = DICCIONARIOS[idioma] ?? DICCIONARIOS[IDIOMA_POR_DEFECTO]
  const valor = dicc?.[clave] ?? (SUMADOS[idioma] ?? SUMADOS[IDIOMA_POR_DEFECTO])?.[clave]

  if (typeof valor === 'string' && valor.length > 0) return interpolar(valor, vars, clave)

  // UN aviso por clave y por vida del módulo. Sin el guardia, una clave rota
  // dentro de un render escupe una línea por fotograma y ahoga la consola —que
  // es justo donde `puerta.5` de diagPUE exige silencio.
  avisar(clave, `IDI-0: clave sin traducir en "${idioma}" — ${clave}`)
  return `⟦${clave}⟧`
}

/**
 * Sustituye los huecos `{nombre}` de un texto ya resuelto.
 *
 * Se exporta —y no se queda dentro de `t`— porque es la mitad de esta plomería
 * que se puede probar SOLA. El diccionario del lobby son 18 rótulos fijos sin un
 * `{` en ninguno (lo defiende un test), así que probar la sustitución a través
 * de `t` obligaría a sembrar claves de mentira en el diccionario real. Aquí la
 * regla se ejercita con el texto que haga falta y `textos.es.js` no se entera.
 *
 * @param {string} texto    la cadena del diccionario, p. ej. '{n} de {total}'
 * @param {object} [vars]   valores de los huecos
 * @param {string} [clave]  sólo para el aviso: de qué clave venía el texto
 * @returns {string}
 */
export function interpolar(texto, vars = {}, clave = '') {
  // Atajo para las cadenas sin huecos, que son la inmensa mayoría: ni siquiera
  // se construye el reemplazo. `includes('{')` es más barato que el `replace`.
  if (typeof texto !== 'string' || !texto.includes('{')) return texto

  // ── Una variable ausente CANTA, igual que una clave ausente ───────────────
  // Devuelve `⟦nombre⟧` y no `undefined`, `''` ni el literal `{nombre}`. La
  // razón es la misma que sostiene el fallback de clave desde LOB-1: los
  // corchetes blancos salen en la primera captura del arnés y el punto 4 del
  // modo `lob` ya los busca (`innerText` no contiene `⟦`). Un `undefined`
  // impreso en una sala también se ve, pero no lo caza ninguna comprobación; una
  // cadena vacía no se ve en absoluto y llega a producción.
  //
  // `null` cuenta como ausente y `0` NO: `0` es un valor legítimo —«0 jugadores
  // sentados»— y confundirlos sería el clásico fallo de `||`. De ahí la
  // comprobación explícita contra los dos y no una prueba de veracidad.
  return texto.replace(PATRON_VAR, (_literal, nombre) => {
    const valor = vars?.[nombre]
    if (valor === undefined || valor === null) {
      avisar(`${clave}#${nombre}`, `IDI-0: falta la variable "${nombre}" en "${clave || texto}"`)
      return `⟦${nombre}⟧`
    }
    return String(valor)
  })
}

// El guardia de avisos, compartido por los dos fallos. La marca lleva la clave y
// —en el caso de una variable— el nombre, para que dos huecos rotos de la misma
// cadena avisen los dos y no sólo el primero.
function avisar(marca, mensaje) {
  if (AVISADAS.has(marca)) return
  AVISADAS.add(marca)
  console.warn(mensaje)
}

/** ¿Este id tiene diccionario propio? Lo usa `useIdioma` para decidir el fallback. */
export function idiomaValido(id) {
  return IDIOMAS_DISPONIBLES.includes(id)
}

/** Las claves de un diccionario. La usa el test para comparar hermanos en IDI-1. */
export function clavesDe(idioma = IDIOMA_POR_DEFECTO) {
  return Object.keys(DICCIONARIOS[idioma] ?? {})
}
