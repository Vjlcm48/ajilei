// ── IOS-1c · El nombre del Bautizo: recorte y aviso ─────────────────────────
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.4 (S6) y la lámina `laminas/ios1c`,
// escena f, elección f2 de Victor (2026-10-16). Puro: sin React ni DOM, para
// que Vitest lo selle (el proyecto no tiene jsdom).
//
// La sospecha C-1 de F-2 (Fase 0, §B.1): el teclado de iOS deja un espacio al
// final al aceptar una sugerencia, el nombre deja de valer y el botón se queda
// gris sin decir por qué. Ahora:
//   · los espacios del principio y del final NO cuentan: se juzga el nombre
//     recortado, y el campo se limpia solo al salir de él o al dejar de
//     escribir. No se recorta en cada tecla: un espacio en medio desaparecería
//     al escribirlo y el aviso no saldría nunca;
//   · el aviso sale SÓLO cuando el nombre escrito no vale: al instante con un
//     carácter no permitido (un espacio en medio, una ñ, un acento); si sólo es
//     corto, tras 1,2 s sin teclear o al salir del campo. Nunca vacío ni válido.
import { REGLA_USERNAME } from '../hooks/useAuth'

export const AVISO_NOMBRE = 'De 6 a 15 letras, números o _, sin espacios'
export const PAUSA_AVISO_MS = 1200

const CARACTER_NO_PERMITIDO = /[^A-Za-z0-9_]/

/** El nombre que se juzga y se envía. */
export function nombreLimpio(nombre) {
  return String(nombre ?? '').trim()
}

export function nombreValido(nombre) {
  return REGLA_USERNAME.test(nombreLimpio(nombre))
}

/**
 * ¿Se enseña el aviso? `pausado` = el jugador dejó de escribir 1,2 s o salió
 * del campo.
 */
export function avisoDelNombre(nombre, { pausado = false } = {}) {
  const limpio = nombreLimpio(nombre)
  if (limpio === '' || REGLA_USERNAME.test(limpio)) return false
  if (CARACTER_NO_PERMITIDO.test(limpio)) return true
  return pausado
}
