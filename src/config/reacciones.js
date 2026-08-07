// ── DSK-U2 · Reacciones entre jugadores — CONTENIDO Y TIEMPOS SELLADOS ───────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.2.md §2 y §3.
//
// FUENTE ÚNICA. Este archivo es el único sitio donde viven las frases y los
// tiempos: el selector las pinta en este orden, la burbuja muestra la elegida y
// el arnés deriva de aquí sus expectativas (jamás una lista paralela, que se
// desincronizaría al primer retoque de redacción).
//
// El emoji es PARTE DE LA FRASE, no un adorno aparte: se sella junto al texto y
// viaja con él. Estático — ni animación ni sprite.

export const REACCIONES = [
  '¡Ajilei! 🎴',
  '¡Eso, chamo! 🙌',
  'Eso estuvo fino, chamo 👌',
  'Suerte la próxima 🤝',
  '¡Me lleva el diablo! 😤',
  '¡Eso fue trampa! 😂',
  'Aquí no se regala nada 😏',
  'Camarita, te estoy mirando 👀',
  'Pana, qué mano te salió 😳',
  'Tú y yo sabemos cómo es esto 🤨',
  '¡Qué va! 🤦',
  'No me hagas eso, pana 😅',
]

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
