import { eligeSinRepetir, leeMemoria, guardaMemoria } from './sinRepetir'

// ── CEL-2 · La bolsa de melodías de celebración ─────────────────────────────
// Documento rector: docs/AJILEI_Fuentes_Audio_Celebracion_v1.0.md (CEL-A), que
// sella las siete piezas, su receta de corte y su sonoridad.
//
// Las siete se cortaron a la MISMA receta —fin en 12,000 s exactos, desvanecido
// desde 9,5 s, −20,0 LUFS integrados— así que aquí no hay una tabla de volumen
// por pieza: un solo token vale para todas, y ése es justamente el sentido de
// haberlas normalizado.
//
// Módulo sin React ni DOM, como `frasesVictoria.js`: `node` lo importa tal cual
// y Vitest sella la elección.
//
// PROHIBIDO escribir el nombre de un asset en un componente. Si la bolsa crece
// o una pieza se retira, se toca aquí y en ningún otro sitio.

// Nombre BASE, sin extensión: cada melodía existe en `.mp3` y en `.ogg`, y es
// Howler quien elige según lo que el navegador declare que sabe decodificar
// (`fuentesDe` devuelve los dos, en el orden en que se prefieren).
export const MELODIAS = [
  'celebracion-gaita-01',
  'celebracion-joropo-01',
  'celebracion-latinjazz-01',
  'celebracion-percusion-01',
  'celebracion-solemne-01',
  'celebracion-brillante-01',
  'celebracion-fiesta-01',
]

// Convención del proyecto: `ajilei.<cosa>`, igual que `ajilei.nivel`,
// `ajilei.sound` y `ajilei.fraseVictoria`.
export const MELODIA_KEY = 'ajilei.melodiaCelebracion'

// ── Volumen ─────────────────────────────────────────────────────────────────
// 0,6 no es un número a ojo: es el MISMO volumen con el que suena
// `table-knock.mp3`, que también mide −20,0 LUFS (informe CEL-A §3.1). A ese
// volumen la melodía entra exactamente al nivel efectivo del toc-toc que la
// precede —−24,4 LUFS los dos—, que es lo que hace que el encadenado suene a
// una sola cosa y no a dos archivos pegados.
// Token único y ajustable: si en la audición resultan altas, se baja AQUÍ.
export const MELODIA_VOLUMEN = 0.6

// Duración sellada por CEL-A. No la usa la reproducción —la melodía termina
// sola— pero sí el arnés, para saber cuánto dura el reposo con música.
export const MELODIA_MS = 12000

export function fuentesDe(nombre) {
  return [`/sounds/${nombre}.mp3`, `/sounds/${nombre}.ogg`]
}

// ── La regla ────────────────────────────────────────────────────────────────
// Aleatoria, PERO no la última sonada. Misma técnica que las frases y misma
// implementación, literalmente: `eligeSinRepetir`. Ganar dos mesas seguidas y
// oír la misma melodía es lo que convierte una fiesta en un jingle.
export function eligeMelodia(ultima, aleatorio) {
  return eligeSinRepetir(MELODIAS.length, ultima, aleatorio)
}

// Índice → nombre, con el mismo criterio defensivo que `fraseDe`: un índice
// imposible cae a la primera en vez de pedir `/sounds/undefined.mp3`.
export function melodiaDe(indice) {
  return MELODIAS[indice] ?? MELODIAS[0]
}

// La melodía de ESTA pantalla: sortea y devuelve `{ indice, nombre }`.
// `forzada` (1-based, del molde de desarrollo) manda sobre todo lo demás y llega
// con `indice: null`, que es como se dice "esto no se recuerda": forzar una
// pieza para medirla no debe alterar cuál oye el jugador en su próxima victoria
// real.
//
// ── Por qué SORTEAR y RECORDAR van separados ────────────────────────────────
// Porque el sorteo ocurre en un inicializador de `useState`, y esos se invocan
// DOS VECES en desarrollo (StrictMode). Si el sorteo escribiera la memoria, el
// segundo sorteo —que además evita al primero, porque lee lo que el primero
// acaba de escribir— dejaría guardada una pieza distinta de la que suena, y la
// victoria siguiente podría repetir justo la que se acaba de oír. Escribiendo
// desde un efecto, lo que se recuerda es exactamente lo que sonó.
export function melodiaPara(forzada) {
  if (Number.isInteger(forzada) && forzada >= 1 && forzada <= MELODIAS.length) {
    return { indice: null, nombre: melodiaDe(forzada - 1) }
  }
  const i = eligeMelodia(leeMemoria(MELODIA_KEY), Math.random())
  return { indice: i, nombre: melodiaDe(i) }
}

// El segundo tiempo: recordar la que sonó. Idempotente a propósito — en
// desarrollo el efecto que la llama monta dos veces.
export function recuerdaMelodia(indice) {
  if (!Number.isInteger(indice)) return
  guardaMemoria(MELODIA_KEY, indice)
}
