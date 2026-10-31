// ── CFG-1 1e · «Partida rápida», recordada en el aparato ────────────────────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §0-2 y §2.2 (INV-70).
//
// UNA clave, `ajilei.partidaRapida`, con `'si'` o `'no'` (por defecto, no). Es
// una preferencia de ritmo y de ESTE aparato, como el ojito: no viaja al
// servidor ni sigue a la cuenta. Sólo existe contra las IAS: contra humanos el
// ritmo lo decide el anfitrión al armar la mesa (MES-PvP).
//
// La mesa la lee UNA vez por mano, en `commitNewHand`, y la congela en un ref:
// cambiarla a mitad de mano no toca la mano en curso. Acelera ×0,5 el vuelo de
// las cartas del reparto y las esperas del segundo reparto; el barajado de
// 1,95 s (`gameTable.css`, protegido) no cambia.
//
// El almacén puede fallar o venir vacío: todo va protegido, y cualquier lectura
// que no sea `'si'` es «no».

const CLAVE = 'ajilei.partidaRapida'

/** El factor de las duraciones con «Partida rápida» encendida. */
export const FACTOR_RAPIDA = 0.5

const almacenDelNavegador = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

/** @param {() => Storage|null} [almacen] */
export function crearPartidaRapida(almacen = almacenDelNavegador) {
  return {
    /** `true` si el jugador la dejó encendida en este aparato. */
    leer() {
      try { return almacen()?.getItem(CLAVE) === 'si' } catch { return false }
    },
    guardar(encendida) {
      try { almacen()?.setItem(CLAVE, encendida ? 'si' : 'no') } catch { /* sin almacén, dura lo que la página */ }
    },
  }
}

export const partidaRapida = crearPartidaRapida()

/** El factor de una mano: 0,5 con «Partida rápida» encendida contra las IAS, 1 si no. */
export const factorDeMano = (contraIAS, encendida) => (contraIAS && encendida ? FACTOR_RAPIDA : 1)
