// ── CFG-1 1e · El primer cobro de Mano actual, confirmado en esta sesión ────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §0-4 y §2.3.
//
// El primer cobro de cada sesión pide confirmación de un toque; los siguientes
// de la misma sesión, no. «Sesión» es la de la pestaña: `sessionStorage`, clave
// `ajilei.consultaConfirmada` con `'si'`. Se va sola al cerrar la pestaña, y
// `limpiarAparato` la vacía con todo `sessionStorage` al eliminar la cuenta.
//
// Sin almacén, la confirmación se pregunta en cada cobro: es el lado seguro.

const CLAVE = 'ajilei.consultaConfirmada'

const almacenDeSesion = () => {
  try { return globalThis.sessionStorage ?? null } catch { return null }
}

/** @param {() => Storage|null} [almacen] */
export function crearConsultaConfirmada(almacen = almacenDeSesion) {
  return {
    leer() {
      try { return almacen()?.getItem(CLAVE) === 'si' } catch { return false }
    },
    marcar() {
      try { almacen()?.setItem(CLAVE, 'si') } catch { /* sin almacén, se vuelve a preguntar */ }
    },
  }
}

export const consultaConfirmada = crearConsultaConfirmada()
