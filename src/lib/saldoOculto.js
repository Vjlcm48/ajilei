// ── CFG-1 1a · El ojito de la píldora del lobby, recordado en el aparato ────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §0 y §2.4.
//
// UNA clave, `ajilei.saldoOculto`, con `'si'` o `'no'`. Es una preferencia de
// vista y de ESTE aparato (quien juega en el autobús tapa; en casa, no): no
// viaja al servidor ni sigue a la cuenta, y por eso no se borra al cerrar
// sesión. Sólo la lee y la escribe el lobby: el ojito vive SÓLO en su píldora
// (INV-69).
//
// El almacén puede fallar o venir vacío: todo va protegido, y cualquier lectura
// que no sea `'si'` es «a la vista», que es lo de siempre.

const CLAVE = 'ajilei.saldoOculto'

const almacenDelNavegador = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

/** @param {() => Storage|null} [almacen] */
export function crearSaldoOculto(almacen = almacenDelNavegador) {
  return {
    /** `true` si el jugador lo dejó tapado en este aparato. */
    leer() {
      try { return almacen()?.getItem(CLAVE) === 'si' } catch { return false }
    },
    guardar(oculto) {
      try { almacen()?.setItem(CLAVE, oculto ? 'si' : 'no') } catch { /* sin almacén, dura lo que la sesión */ }
    },
  }
}

export const saldoOculto = crearSaldoOculto()
