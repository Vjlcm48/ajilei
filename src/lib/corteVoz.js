// ── MES-PvP L-M 1 · El corte de los nombres largos, solo en la voz ───────────
// Ficha AJILEI_MES-PvP_LM-1_v1.0.md §4. Victor eligió el corte en 10 caracteres (aprobación del
// STOP-L3): un nombre que cabe no se toca; el que no, se queda con sus primeros 10 caracteres
// y «…». Los asientos no pasan por aquí: solo las frases. En la sub-tanda 5 el corte pasa a
// `cronicaCore.nombreEnVoz`, con el control de las IAS; hasta entonces lo aplica el trozo de la
// partida (`mesaPvPCore`). La lámina lo quita con `&corte=0` para comparar.

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
