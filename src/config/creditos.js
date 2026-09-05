// ── LOB-1 · Créditos de terceros: fuente única ──────────────────────────────
// Documento rector: AJILEI_LOB1_Fase1_v1.1.md §3.6 y Anexo A.
//
// Módulo SIN React ni DOM, molde de `niveles.js` y `tapetes.js`. Vive aquí y no
// dentro de la hoja de configuración por la razón de siempre: un crédito
// repetido en dos sitios es un crédito que algún día dirá dos cosas, y en
// materia de licencias eso no es una molestia de mantenimiento — es un
// incumplimiento con dos versiones.
//
// ── POR QUÉ NO PASA POR EL DICCIONARIO DE IDI-0 ─────────────────────────────
// Los nombres propios, las licencias y los enlaces NO SE TRADUCEN: «CC BY 4.0»
// se dice igual en las cinco lenguas y «Hanifi Şahin» se escribe igual en todas.
// Lo único traducible del bloque es su encabezado, y ése sí vive en el
// diccionario (`lob.acerca.sonidos`). Meter los autores en `textos.es.js`
// obligaría a copiarlos cinco veces en IDI-1 para que digan lo mismo.

// ── El crédito CC BY de los emoji · OBLIGATORIO y VISIBLE ───────────────────
// VERBATIM de `components/WelcomeScreen.jsx:85-110`, que es de donde viaja: la
// Bienvenida sale del recorrido con LOB-1 y este texto NO puede salir con ella.
// La licencia de los emoji animados exige atribución, y un comentario en código
// no la cumple — la lección de la lámina GNU (Diseno_Landscape §10.3) fue
// exactamente ésta, y DSK-U2c la dejó escrita al pie de la Bienvenida.
//
// CAMBIA DE SITIO, NO DE RANGO. En la Bienvenida vivía en la cara porque la
// marca de la casa vivía ahí; en el lobby la cara no lleva créditos (decisión de
// Victor: la Portada tampoco los lleva) y el sitio pasa a ser la fila «Acerca
// de» de la hoja ⚙, viva desde el día uno y a un solo toque. Sigue siendo
// visible para cualquiera que lo busque, que es lo que la licencia pide.
export const CREDITOS_EMOJI = {
  etiqueta: 'Emoji:',
  obra: 'Google Animated Noto Emoji',
  url: 'https://googlefonts.github.io/noto-emoji-animation/',
  licencia: 'CC BY 4.0',
}

// ── Pixabay Content License ─────────────────────────────────────────────────
// Fuente: `Ajilei_origen_de_sonidos.docx` (Victor), transcrito en el Anexo A de
// la ficha de Fase 1. La licencia de Pixabay NO exige atribución; se incluye por
// corrección, que es criterio de la casa y no obligación legal.
//
// ── LOS SLUGS NO ESTABAN ────────────────────────────────────────────────────
// El Anexo A dice: «URL de autor: `https://pixabay.com/users/<slug>/` — los
// slugs exactos están en el `.docx`; si no se adjunta, enlazar solo a
// `https://pixabay.com/` y anotar». El `.docx` NO se adjuntó a esta fase, así
// que las 19 entradas enlazan a la raíz y este comentario es la anotación.
// Inventar un slug a partir del nombre visible produciría 19 enlaces rotos con
// aspecto de correctos, que es peor que un enlace genérico honesto.
export const URL_PIXABAY = 'https://pixabay.com/'

// `id` no está en la forma que pide la ficha ({ uso, tipo, autor, url }) y se
// conserva igualmente: es el único puntero EXACTO a cada pieza en Pixabay, y es
// lo que permitirá reconstruir los slugs el día que aparezca el `.docx` sin
// tener que volver a cruzar 19 nombres a mano.
export const CREDITOS_PIXABAY = [
  { uso: 'Repartir cartas',                tipo: 'efecto', autor: 'freesound_community',     id: 91468,  url: URL_PIXABAY },
  { uso: 'Fichas al apostar',              tipo: 'efecto', autor: 'freesound_community',     id: 81172,  url: URL_PIXABAY },
  { uso: 'Sonido al retirarse',            tipo: 'efecto', autor: 'freesound_community',     id: 102746, url: URL_PIXABAY },
  { uso: 'Barajar las cartas',             tipo: 'efecto', autor: 'freesound_community',     id: 94662,  url: URL_PIXABAY },
  { uso: 'Ganador',                        tipo: 'efecto', autor: 'EAGLAXLE',                id: 464016, url: URL_PIXABAY },
  { uso: 'Aviso de cronómetro',            tipo: 'efecto', autor: 'Neo Theone',              id: 433047, url: URL_PIXABAY },
  { uso: 'Revelar cartas',                 tipo: 'efecto', autor: 'Crunchpix Studio',        id: 388903, url: URL_PIXABAY },
  { uso: 'Comodín',                        tipo: 'efecto', autor: 'Shiden Beats Music',      id: 115095, url: URL_PIXABAY },
  { uso: 'Clic de botones',                tipo: 'efecto', autor: 'Hanifi Şahin',            id: 366460, url: URL_PIXABAY },
  { uso: 'Monedas siendo tomadas',         tipo: 'efecto', autor: 'freesound_community',     id: 96121,  url: URL_PIXABAY },
  { uso: 'Nudillos (golpe de mesa)',       tipo: 'efecto', autor: 'freesound_community',     id: 85867,  url: URL_PIXABAY },
  { uso: 'Guitarra (sustituye al cuatro)', tipo: 'efecto', autor: 'u_op8btczor7',            id: 504874, url: URL_PIXABAY },
  { uso: 'joropo1',                        tipo: 'musica', autor: 'Vadim',                   id: 562346, url: URL_PIXABAY },
  { uso: 'gaita2',                         tipo: 'musica', autor: 'Alejandro Piñero Amerio', id: 479719, url: URL_PIXABAY },
  { uso: 'latinjazz3',                     tipo: 'musica', autor: 'Alex Morgan',             id: 560033, url: URL_PIXABAY },
  { uso: 'percusion4',                     tipo: 'musica', autor: 'Bomb Sound',              id: 577424, url: URL_PIXABAY },
  { uso: 'celebracion5',                   tipo: 'musica', autor: 'Voldemar SweetFinger',    id: 353353, url: URL_PIXABAY },
  { uso: 'celebracion6',                   tipo: 'musica', autor: 'Andrii Groza',            id: 582641, url: URL_PIXABAY },
  { uso: 'celebracion7',                   tipo: 'musica', autor: 'Mykola Sosin',            id: 406445, url: URL_PIXABAY },
]

export const LICENCIA_PIXABAY = 'Pixabay Content License'

// La lista de autores ÚNICOS, en el orden en que aparecen arriba. La hoja pinta
// esto y no las 19 filas: `freesound_community` firma cinco piezas y repetirlo
// cinco veces sería ruido, no rigor. Se deriva y no se escribe a mano para que
// añadir una pieza en la tabla actualice el pie sin tocar nada más.
export const AUTORES_PIXABAY = [...new Set(CREDITOS_PIXABAY.map(c => c.autor))]
