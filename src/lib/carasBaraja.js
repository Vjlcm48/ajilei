// ── CAR-1 · las caras de la baraja, ya resueltas por Vite ───────────────────
// ARN-4 B1 · vivían en `CardImage.jsx`; un componente no puede exportar también
// una lista sin romper el refresco en caliente. El glob sigue siendo uno solo,
// el que usan la carta y la precarga.
export const cardImages = import.meta.glob('../assets/cards/webp/*.webp', { eager: true, query: '?url', import: 'default' })

// La lista de URLs que el glob resolvió, para que la precarga no repita el glob
// —y, sobre todo, para que no pueda quedarse desincronizada de lo que la mesa
// pide de verdad. Ver `src/lib/precargaBaraja.js`.
export const URLS_BARAJA = Object.values(cardImages)
