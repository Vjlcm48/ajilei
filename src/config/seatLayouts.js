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

// Orden de renderizado en el DOM (izquierda → derecha) para la zona de rivales
const DISPLAY_ORDER = ['side-left', 'top-left', 'top-center', 'top-right', 'side-right']

// Asientos rivales (1..N-1) ordenados para render visual
export function rivalSeatsInDisplayOrder(numPlayers) {
  const layout = SEAT_LAYOUTS[numPlayers]
  return Array.from({ length: numPlayers - 1 }, (_, i) => i + 1)
    .sort((a, b) => DISPLAY_ORDER.indexOf(layout[a]) - DISPLAY_ORDER.indexOf(layout[b]))
}
