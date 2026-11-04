// ── MOT-1 1b · De las sillas de la sala a los índices del motor ─────────────
// Normativo: contrato §1 (K-11). `sala_jugadores.asiento` va de 0 a 4 y puede tener
// huecos; `players[i]` no. El orden de los asientos es el orden de los turnos.

/**
 * @param {{ asiento: number, uid: string, nombre?: string }[]} sillas las de la sala
 * @returns {{ silla: number, uid: string, nombre: string|null }[]} el índice es la posición
 */
export function compactarAsientos(sillas) {
  return [...sillas]
    .sort((a, b) => a.asiento - b.asiento)
    .map(({ asiento, uid, nombre }) => ({ silla: asiento, uid, nombre: nombre ?? null }))
}
