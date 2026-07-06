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
  isPie,
  isTurn,           // señal triple: borde+halo, badge TURNO, los demás atenuados
  isDimmed,         // otro jugador tiene el turno → ~85% de intensidad
  isWinner,         // mano mostrada en grande en el showdown (ganadora por defecto,
                    // o la IA elegida por tap — Revelar Manos v1.0)
  isRevealEligible, // llegó al showdown → su nombre es tappable para revisar su mano
  onNameTap,        // tap en el nombre (GameTable decide qué mano desplegar)
  isNameShaking,    // turno de esta IA en la rotación de sacudida (affordance R2)
  revealAnimClass,  // fase de la coreografía de volteo (R2.b) — '' fuera de ella
  isEliminating,    // C4.5: bancarrota — salida digna (desatura + "Sin fichas" + fade)
  letterBadges,     // H1: badges de una letra (M/P/T) — solo mesa 5 vertical
  lastAction,       // 'Apostó' | 'Igualó' | 'Subió' | 'Pasó' | 'Descartó N' | null
  renderCard,       // (i) => JSX de la carta del slot i
  score,            // score del showdown (o null)
  showScore,
  resetting,        // mano nueva en transición (clearing/shuffle) → rótulos en blanco
  slotRefs,         // array de 5 refs para las animaciones de vuelo
  deckRef,          // ref del mazo anclado a este asiento
  showDeck,         // este asiento es el Pie → mazo visible
  shuffleChildren,  // <ShuffleDeck/> cuando baraja este asiento
}) {
  const stateClasses =
    `${player.folded ? ' opp-folded' : ''}${isWinner ? ' opp-winner' : ''}` +
    `${isTurn ? ' turn-active' : ''}${isDimmed && !player.folded ? ' turn-dimmed' : ''}` +
    `${isEliminating ? ' opp-eliminating' : ''}`
  return (
    <div className={`opp-panel opp-${seatPos}${stateClasses}${revealAnimClass ? ` ${revealAnimClass}` : ''}`}>
      {/* opp-topline: por defecto display:contents (transparente) → identidad y saldo
          se apilan como siempre (3/4/5/portrait/escritorio sin cambios). Solo en la
          mesa de 2 landscape se vuelve una fila space-between (fusión en una línea). */}
      <div className="opp-topline">
        <div className="opp-header">
          <span
            className={`opp-name${isRevealEligible ? ' opp-name-tappable' : ''}${isNameShaking ? ' opp-name-shake' : ''}`}
            onClick={isRevealEligible ? onNameTap : undefined}
          >{player.name}</span>
          {/* H1: en mesa 5 vertical los badges muestran una letra (M/P/T) para
              caber en el header compacto; misma pastilla, solo cambia el texto.
              seat-badge-letter neutraliza el letter-spacing final que
              descentraba la letra única. */}
          {isMano && <span className={`seat-badge seat-badge-gold${letterBadges ? ' seat-badge-letter' : ''}`}>{letterBadges ? 'M' : 'Mano'}</span>}
          {isPie  && <span className={`seat-badge seat-badge-neutral${letterBadges ? ' seat-badge-letter' : ''}`}>{letterBadges ? 'P' : 'Pie'}</span>}
          {isTurn && <span className={`seat-badge seat-badge-gold${letterBadges ? ' seat-badge-letter' : ''}`}>{letterBadges ? 'T' : 'Turno'}</span>}
          {isWinner && score && <span className="win-score-chip">{score.points}</span>}
        </div>
        <span className="opp-chips"><BalanceDisplay chips={player.chips} size="compact" /> fichas</span>
      </div>

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

      {/* Rótulo de estado (doblado en C4.3.1). En la transición a la mano
          siguiente (resetting) se limpia para no arrastrar "Se retiró" ni la
          última acción de la mano previa durante el barajado. */}
      <span className={`opp-status${isTurn ? ' opp-status-turn' : ''}${isEliminating ? ' opp-status-elim' : ''}`}>
        {isEliminating
          ? 'Sin fichas'
          : resetting ? ' ' : (player.folded ? 'Se retiró' : (isTurn ? 'Pensando…' : (lastAction ?? ' ')))}
      </span>

      <span className="opp-score" style={{ visibility: showScore && score && !resetting ? 'visible' : 'hidden' }}>
        {score && <>Mejor palo: <strong>{score.palo}</strong> ({score.points} pts)</>}
      </span>
    </div>
  )
}
