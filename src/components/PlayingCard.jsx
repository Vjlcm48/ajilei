import '../styles/playingCard.css'
import CardImage from './CardImage'
import reversoUrl from '../assets/cards/reverso_carta.svg?no-inline'

function PlayingCard({ card, selected, onClick, faceDown, animClass, highlight }) {
  if (faceDown) {
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
