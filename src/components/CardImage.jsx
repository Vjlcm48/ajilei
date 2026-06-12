const cardImages = import.meta.glob('../assets/cards/*.png', { eager: true, query: '?url', import: 'default' })

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
  const url    = cardImages[`../assets/cards/${nombre}_${palo}.png`]

  return (
    <img
      src={url}
      alt={`${card.name} de ${card.palo}`}
      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
    />
  )
}
