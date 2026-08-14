// ── DSK-U2 · Reacciones entre jugadores — CONTENIDO Y TIEMPOS SELLADOS ───────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.4.md §2 y §3.
//
// FUENTE ÚNICA. Este archivo es el único sitio donde viven las frases y los
// tiempos: el selector las pinta en este orden, la burbuja muestra la elegida y
// el arnés deriva de aquí sus expectativas (jamás una lista paralela, que se
// desincronizaría al primer retoque de redacción).
//
// El emoji SIGUE SIENDO PARTE DE LA FRASE: se sella con ella, se elige con ella
// y viaja con ella al arnés. Lo que la v1.4 §1.1 archivó —con contabilidad, no
// borrándolo— es que compartiera RENGLÓN: soldarlo al último término con un
// espacio duro hacía un bloque indivisible que fijaba un techo medido de
// 17,03px, ilegible para cualquier animación. Ahora vive en su propio piso de
// la burbuja (v1.4 §2) y como recurso propio de Noto (v1.4 §4), no como glifo
// del sistema — que además pintaba doce dibujos distintos según el aparato.

export const REACCIONES = [
  // v1.4 §3 · 🎴 (1f3b4) NO existe en el catálogo animado —404 en todas sus
  // claves— y la regla dura es 12/12 o no hay animación. ♠️ no es un repuesto
  // cualquiera: es el palo ESPADAS, que ya vive en la voz de la casa (los
  // mensajes de resultado lo nombran y el desglose de "Mano actual" lo lista).
  '¡Ajilei! ♠️',
  '¡Eso, chamo! 🙌',
  'Eso estuvo fino, chamo 👌',
  'Suerte la próxima 🤝',
  '¡Me lleva el diablo! 😤',
  '¡Eso fue trampa! 😂',
  'Aquí no se regala nada 😏',
  'Camarita, te estoy mirando 👀',
  'Pana, qué mano te salió 😳',
  'Tú y yo sabemos cómo es esto 🤨',
  // v1.4 §3 · 🤦 (1f926) tampoco existe animado, ni con género ni con tono de
  // piel, ni su hermano 🤷. 🙄 conserva la incredulidad de "¡Qué va!".
  // LÍMITE CONOCIDO Y ACEPTADO: su animación dura 2,94s y la ventana visible
  // son 2,4s, así que se corta sin completar el ciclo. No se compensa ni se
  // alarga la burbuja por ello (v1.4 §2).
  '¡Qué va! 🙄',
  'No me hagas eso, pana 😅',
]

// ── Derivaciones del contenido sellado ───────────────────────────────────────
// TRES DERIVACIONES, NINGUNA LISTA PARALELA. La clave del recurso sale del
// propio emoji de la frase, así que un retoque de redacción no puede
// desincronizar nada — misma disciplina que hace al arnés importar REACCIONES
// de aquí en vez de copiarlas.
//
// La clave sigue el esquema de Noto: los codepoints en hexadecimal, unidos por
// guión bajo. Vale igual para un emoji simple (🙄 → `1f644`) y para uno con
// selector de variación (♠️ → `2660_fe0f`), que es justo el caso de la
// sustitución de la frase 1.
// Los dos acompañantes van ESCAPADOS a propósito: el ZWJ (U+200D) y el selector
// de variación (U+FE0F) son invisibles, y un carácter invisible literal dentro
// de un regex es una trampa para el siguiente que lea este archivo.
const RE_EMOJI = /(?:\p{Extended_Pictographic}|\u200D|\uFE0F)+$/u

export const emojiDe = (frase) => (frase.match(RE_EMOJI) ?? [''])[0]
export const textoDe = (frase) => frase.replace(RE_EMOJI, '').trimEnd()
export const codepointDe = (frase) =>
  [...emojiDe(frase)].map(c => c.codePointAt(0).toString(16)).join('_')

// Ruta del recurso AUTOALOJADO (public/emoji/). No se apunta a gstatic: su ruta
// `latest` es mutable y la PWA no puede depender de un tercero para pintar
// (v1.4 §4). `scripts/fetchEmoji.mjs` los baja desde aquí mismo.
export const rutaEmoji = (frase, ext) => `/emoji/${codepointDe(frase)}.${ext}`

// Presupuesto de peso SELLADO (v1.4 §4), en bytes y para los doce juntos. Vive
// aquí y no en el arnés ni en el script de descarga porque los dos lo necesitan,
// y una cifra repetida en dos sitios es una cifra que algún día dirá dos cosas.
// Es un TECHO, no un objetivo: el total real de SVG queda por debajo porque la
// v1.4 §4 lo calculó con los dos emojis que luego sustituyó el §3.
export const EMOJI_PRESUPUESTO = { svg: 71764, avif: 584179 }

// ── Ciclo de vida de la burbuja ──────────────────────────────────────────────
// 0,3s entrada · 2,4s visible · 0,3s salida. Los tres tramos viven AQUÍ y sólo
// aquí: el total viaja al CSS como la custom property `--u2-dur` en línea, así
// que el keyframe no repite la cifra (sí reparte: ver el comentario de
// `@keyframes u2Burbuja` en gameTable.css). Es el arreglo de la deuda que
// GameTable.jsx:38-42 dejó anotada para ELIM_NOTICE_MS.
export const REACCION_ENTRADA_MS = 300
export const REACCION_VISIBLE_MS = 2400
export const REACCION_SALIDA_MS  = 300
export const REACCION_TOTAL_MS   = REACCION_ENTRADA_MS + REACCION_VISIBLE_MS + REACCION_SALIDA_MS

// Antiflood. Corre desde el ENVÍO y es indiferente a la X: cerrar la burbuja
// antes de tiempo es un gesto visual, no un permiso para volver a hablar.
// Constante ajustable: subirla o bajarla no toca ninguna otra pieza.
export const REACCION_COOLDOWN_MS = 5000

// Geometría del pico (triángulo invertido que apunta al nombre). Vive aquí
// porque JS la necesita para calcular el techo de la burbuja y el CSS para
// dibujarla; se transporta en línea como `--u2-pico` → un solo número.
export const REACCION_PICO_PX = 8

// Aire entre el pico y la tinta del nombre, y entre la burbuja y la primera
// carta del humano al derivar su tope de ancho.
export const REACCION_GAP_PX = 6

// Suelo del tope de ancho: por estrecho que quede el corredor vivo, la burbuja
// nunca baja de aquí (por debajo, una frase larga se vuelve ilegible).
export const REACCION_MIN_W_PX = 120
