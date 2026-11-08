import '../styles/playingCard.css'
import CardImage from './CardImage'
import reversoUrl from '../assets/cards/reverso_carta_mesa.svg?no-inline'

function PlayingCard({ card, selected, onClick, faceDown, animClass, highlight }) {
  // Túnel del v1.3 · contra personas, la carta que la vista no enseña llega como `{ dorso: true }`
  // (`lib/vistaAMesa.js`), y la mesa la pondría de cara en el pago de un rival que no se retiró
  // y no reveló (ganó porque los demás se retiraron): sin cara que pintar, la imagen salía rota.
  // Contra las IAS ninguna carta lleva `dorso`.
  if (faceDown || card?.dorso) {
    return (
      <div className={`playing-card card-back${animClass ? ` ${animClass}` : ''}`} onClick={onClick}>
        <img src={reversoUrl} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
      </div>
    )
  }
  if (!card) {
    return <div className="playing-card card-empty" />
  }
  return (
    <div
      className={`playing-card${selected ? ' card-selected' : ''}${onClick ? ' card-clickable' : ''}${highlight ? ' card-winner' : ''}${animClass ? ` ${animClass}` : ''}`}
      onClick={onClick}
    >
      <CardImage card={card} />
    </div>
  )
}

export default PlayingCard
