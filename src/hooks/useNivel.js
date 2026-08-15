import { NIVEL_KEY, NIVEL_POR_DEFECTO } from '../config/niveles'
import { normalizarNivel } from './nivelCore'

// ── NIV-UI · Persistencia del nivel elegido ──────────────────────────────────
// Infraestructura, no lógica: la decisión de qué nivel vale vive en nivelCore.
// Molde exacto de readConsultas/writeConsultas (useUtilitiesMenu, U3): try/catch
// en las dos direcciones, porque un storage denegado no puede tumbar el lobby.
//
// Diferencia deliberada con el contador de consultas: aquí NO se siembra la
// clave al leer. Una preferencia que el jugador todavía no ha expresado no se
// inventa en disco — se escribe cuando elige, y hasta entonces la preselección
// es Básico por defecto (v1.0 §4.2).

export function readNivel() {
  try {
    return normalizarNivel(window.localStorage.getItem(NIVEL_KEY))
  } catch {
    return NIVEL_POR_DEFECTO   // storage denegado: se arranca en frío, sin ruido
  }
}

export function writeNivel(id) {
  try {
    window.localStorage.setItem(NIVEL_KEY, normalizarNivel(id))
  } catch { /* storage denegado: la elección vive sólo en esta sesión */ }
}
