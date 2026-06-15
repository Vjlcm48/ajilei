// Sistema de asientos parametrizado (Fase C).
// El índice del array = asiento del motor (0 = humano, siempre 'bottom').
// Orden antihorario desde el humano: asiento 1 a la derecha, último a la izquierda
// (la Mano queda a la derecha del Pie, como en la mesa física).
export const SEAT_LAYOUTS = {
  2: ['bottom', 'top-center'],
  3: ['bottom', 'top-right', 'top-left'],
  4: ['bottom', 'side-right', 'top-center', 'side-left'],
  5: ['bottom', 'side-right', 'top-right', 'top-left', 'side-left'],
}

// Punto de anclaje del mazo por posición de asiento (Tanda C2, revisado en
// Tanda C3.2 — la franja sobre los paneles superiores creaba una banda muerta
// bajo el header que impedía que la mesa cupiera en el viewport):
// - asientos superiores: mazo al costado del panel, hacia el centro de la
//   fila (hueco reservado por el gap de .rivals-zone)
// - asientos laterales: mazo hacia el lado interior (centro de mesa)
// - asiento humano: posición actual, en línea con sus cartas
export const DECK_ANCHORS = {
  'bottom':     'inline',
  'top-left':   'inner-right',   // panel izquierdo de la fila → mazo a su derecha
  'top-center': 'inner-right',
  'top-right':  'inner-left',    // panel derecho de la fila → mazo a su izquierda
  'side-left':  'inner-right',   // panel a la izquierda → mazo a su derecha
  'side-right': 'inner-left',    // panel a la derecha  → mazo a su izquierda
}

// Orden de renderizado en el DOM (izquierda → derecha) para la zona de rivales
const DISPLAY_ORDER = ['side-left', 'top-left', 'top-center', 'top-right', 'side-right']

// Asientos rivales (1..N-1) ordenados para render visual
export function rivalSeatsInDisplayOrder(numPlayers) {
  const layout = SEAT_LAYOUTS[numPlayers]
  return Array.from({ length: numPlayers - 1 }, (_, i) => i + 1)
    .sort((a, b) => DISPLAY_ORDER.indexOf(layout[a]) - DISPLAY_ORDER.indexOf(layout[b]))
}
