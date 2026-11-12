// ── MES-PvP L-M 1 · El corte de los nombres largos, solo en la voz ───────────
// Ficha AJILEI_MES-PvP_LM-1_v1.0.md §4. Victor eligió el corte en 10 caracteres (aprobación del
// STOP-L3): un nombre que cabe no se toca; el que no, se queda con sus primeros 10 caracteres
// y «…». Los asientos no pasan por aquí: solo las frases. Desde la sub-tanda 5a el corte lo
// aplica `cronicaCore.nombreEnVoz` a toda frase de la mesa entre personas; el trozo de la partida
// (`mesaPvPCore`) lo aplica además a la crónica, sin daño (cortar lo ya cortado no cambia nada).
// `&corte=0` de la lámina ya solo lo quita ahí, no en las frases de la mesa.

export const CORTE_VOZ = 10

export function recortaNombre(nombre, corte) {
  if (!corte || typeof nombre !== 'string' || nombre.length <= corte) return nombre
  return `${nombre.slice(0, corte).trimEnd()}…`
}

/** El mismo `game` con los nombres cortados, para componer frases; la mesa pinta el original. */
export function conNombresDeVoz(game, corte) {
  if (!game || !corte) return game
  return { ...game, players: game.players.map((p) => ({ ...p, name: recortaNombre(p.name, corte) })) }
}
