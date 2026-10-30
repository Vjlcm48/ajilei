// ── CFG-1 1c · Tras borrar la cuenta, el aparato queda como nuevo ───────────
// Rector: AJILEI_CFG-1_Fase1c_v1.0.md §0 y §2.2.
//
// Borra TODAS las claves `ajilei.*` de `localStorage` recorriéndolas, sin lista
// fija: una clave que nazca mañana tampoco se queda. Y vacía `sessionStorage`
// entero (hoy sólo guarda `ajilei.recargaPorChunk`). La sesión de Supabase
// (`sb-…-auth-token`) no es suya: la quita `signOut`, que va justo después.
//
// Sólo lo llama el borrado de la cuenta. Cerrar sesión NO limpia: las
// preferencias del aparato (sonido, idioma, el ojito…) siguen siendo de quien
// lo usa (Configuracion_v1.1 §6 y §11).
//
// El almacén puede fallar o no existir: todo va protegido y nunca lanza.

const PREFIJO = 'ajilei.'

const delNavegador = (nombre) => () => {
  try { return globalThis[nombre] ?? null } catch { return null }
}

/**
 * @param {{ local?: () => Storage|null, sesion?: () => Storage|null }} [almacenes]
 * @returns {number} cuántas claves `ajilei.*` se borraron de `localStorage`
 */
export function limpiarAparato({ local = delNavegador('localStorage'), sesion = delNavegador('sessionStorage') } = {}) {
  let borradas = 0
  try {
    const l = local()
    if (l) {
      // Primero se juntan y después se borran: borrar mientras se recorre por
      // índice salta claves.
      const nuestras = []
      for (let i = 0; i < l.length; i++) {
        const k = l.key(i)
        if (k !== null && k.startsWith(PREFIJO)) nuestras.push(k)
      }
      for (const k of nuestras) {
        try { l.removeItem(k); borradas++ } catch { /* sigue con las demás */ }
      }
    }
  } catch { /* sin almacén */ }
  try { sesion()?.clear() } catch { /* sin almacén */ }
  return borradas
}
