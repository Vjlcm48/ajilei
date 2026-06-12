import '../styles/opponentPanel.css'
import BalanceDisplay from './BalanceDisplay'
import { DECK_ANCHORS } from '../config/seatLayouts'

// Panel compacto de rival (mesas 3-5). Diseñado conforme a docs/AJILEI_Sistema_Diseno_v1.2.md.
// Muestra solo: nombre, saldo, 5 cartas pequeñas con solape, estado breve, badge Mano.
// GameTable controla el contenido de cada slot vía renderCard(i) — el panel es solo layout.
export default function OpponentPanel({
  player,           // players[seat] del motor
  seatPos,          // 'top-left' | 'top-center' | 'top-right' | 'side-left' | 'side-right'
  isMano,
  isTurn,
  isWinner,         // ganó el showdown (cartas reveladas escalan + chip de puntaje)
  lastAction,       // 'Apostó' | 'Igualó' | 'Subió' | 'Pasó' | 'Descartó N' | null
  renderCard,       // (i) => JSX de la carta del slot i
  score,            // score del showdown (o null)
  showScore,
  slotRefs,         // array de 5 refs para las animaciones de vuelo
  deckRef,          // ref del mazo anclado a este asiento
  showDeck,         // este asiento es el Pie → mazo visible
  shuffleChildren,  // <ShuffleDeck/> cuando baraja este asiento
}) {
  return (
    <div className={`opp-panel opp-${seatPos}${player.folded ? ' opp-folded' : ''}${isWinner ? ' opp-winner' : ''}`}>
      <div className="opp-header">
        <span className="opp-name">{player.name}</span>
        {isMano && <span className="mano-badge">Mano</span>}
        {isWinner && score && <span className="win-score-chip">{score.points}</span>}
      </div>
      <span className="opp-chips"><BalanceDisplay chips={player.chips} /> fichas</span>

      <div className="opp-cards">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} ref={slotRefs[i]} className="opp-card-slot">
            {renderCard(i)}
          </div>
        ))}
      </div>

      {/* Mazo anclado según la posición del asiento (nunca en línea con los slots) */}
      <div className={`opp-deck-wrapper deck-shuffle-wrapper opp-deck-anchor-${DECK_ANCHORS[seatPos]}`}>
        <div ref={deckRef} className={`deck-pile opp-deck${showDeck ? '' : ' deck-hidden'}`} />
        {shuffleChildren}
      </div>

      <span className={`opp-status${isTurn ? ' opp-status-turn' : ''}`}>
        {player.folded ? 'Se retiró' : (isTurn ? 'Pensando…' : (lastAction ?? ' '))}
      </span>

      <span className="opp-score" style={{ visibility: showScore && score ? 'visible' : 'hidden' }}>
        {score && <>Mejor palo: <strong>{score.palo}</strong> ({score.points} pts)</>}
      </span>
    </div>
  )
}
