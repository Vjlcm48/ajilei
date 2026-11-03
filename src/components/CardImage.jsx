// ── CAR-1 · la cara de la carta viaja en WebP, no en PNG ─────────────────────
// Rector: AJILEI_CAR1_Fase1_v1.0 §2.1. Los maestros siguen siendo los 40 PNG de
// `src/assets/cards/`, que no se borran ni se mueven; simplemente dejan de
// referenciarse desde el código, y por eso Vite deja de emitirlos. Lo que se
// pide al servidor son los derivados de `scripts/gen-cards.mjs`: 320×452, WebP
// q80, 14,4 KB de media contra 621,7 KB (Fase 0 §1 y §6).
//
// Este sigue siendo el ÚNICO punto donde se construye la ruta de una cara, y
// por eso los dos caminos de render —`OpponentPanel` en las mesas 5/4/3 y
// `.ai-zone` en la mesa 2— quedan cubiertos por construcción, no por repetición.
import { cardImages } from '../lib/carasBaraja'

const NUM_MAP = {
  1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
  6: 'seis', 7: 'siete', 10: 'diez', 11: 'once', 12: 'doce',
}

const PALO_MAP = {
  Oros: 'oro', Copas: 'copa', Espadas: 'espada', Bastos: 'basto',
}

export default function CardImage({ card }) {
  const nombre = NUM_MAP[card.value]
  const palo   = PALO_MAP[card.palo]
  const url    = cardImages[`../assets/cards/webp/${nombre}_${palo}.webp`]

  return (
    <img
      src={url}
      alt={`${card.name} de ${card.palo}`}
      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
    />
  )
}
