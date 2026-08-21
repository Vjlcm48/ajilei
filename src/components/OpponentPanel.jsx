import '../styles/opponentPanel.css'
import BalanceDisplay from './BalanceDisplay'
import ChipToken from './ChipToken'
import { DECK_ANCHORS } from '../config/seatLayouts'
import { vozResto } from '../hooks/resultadoCore'

// Panel compacto de rival (mesas 3-5). Diseñado conforme a docs/AJILEI_Sistema_Diseno_v1.2.md.
// Muestra solo: nombre, saldo, 5 cartas pequeñas con solape, estado breve, badge Mano.
// GameTable controla el contenido de cada slot vía renderCard(i) — el panel es solo layout.
export default function OpponentPanel({
  player,           // players[seat] del motor
  chipsMostrados,   // VIS-3c: el saldo que se PINTA, que durante el vuelo de las
                    // monedas no es el del motor: el ganador enseña su cifra
                    // previa hasta que aterriza la séptima. GameTable lo calcula
                    // (es quien conoce la celebración) y el panel sólo lo pinta.
                    // Si no llega, se pinta `player.chips`: el panel nunca queda
                    // sin cifra por una prop que alguien olvide pasar.
  playerIndex,      // VIS-3a: el ÍNDICE de ese jugador en el motor — el mismo que
                    // devuelve game.winner. El panel recibía el objeto pero no su
                    // índice, y el vuelo de monedas necesita nombrar el destino por
                    // identificador estable, jamás por posición ni por orden DOM.
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
  letterBadges,     // H1/M4-1/M3-1: header rediseñado (letra M/P/T, sin saldo) — mesas 5, 4 y 3 vertical
  desktopHeader,    // DSK-P1: header estático de escritorio (nombre izq + inicial M/P/T der)
  cornerChip,       // H4/M4-2/M3-1: monta la ficha de esquina — mesas 5, 4 y 3 vertical
  inShowdown,       // H2: hay mano revelada en la mesa (showdownWinnerSeat !== null)
  isChipOpen,       // H4: el toggle de saldo de ESTE panel está desplegado
  onChipTap,        // H4: tap en la ficha de esquina (GameTable decide/gatea)
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
  // VIS-3c · una sola lectura del saldo a pintar, para que las dos apariciones
  // —el saldo inline y el flotante de la ficha de esquina— no puedan discrepar.
  const chipsVista = chipsMostrados ?? player.chips
  const stateClasses =
    `${player.folded ? ' opp-folded' : ''}${isWinner ? ' opp-winner' : ''}` +
    `${isTurn ? ' turn-active' : ''}${isDimmed && !player.folded ? ' turn-dimmed' : ''}` +
    `${isEliminating ? ' opp-eliminating' : ''}${isChipOpen ? ' chip-open' : ''}`
  // H2 · Anclaje derecho compartido (solo modo letra = mesa 5 vertical): en
  // showdown la letra se oculta y el chip de puntaje ocupa el MISMO anclaje —
  // nunca coexisten, sin hueco vacío ni salto (alturas de pastilla parejas).
  // Fuera del modo letra los badges siguen visibles en showdown, como siempre.
  const lettersHidden = letterBadges && inShowdown
  // DSK-P1: en escritorio los badges también van a inicial (M/P/T). Móvil intacto
  // (desktopHeader es false fuera del gate → headerLetter === letterBadges).
  const headerLetter = letterBadges || desktopHeader
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
              descentraba la letra única.
              H2: .opp-header-anchor es display:contents por defecto (patrón
              .opp-topline → transparente en todos los escenarios); solo mesa 5
              vertical lo vuelve el anclaje derecho único donde conviven —nunca
              a la vez— la letra (juego) y el chip de puntaje (showdown). */}
          <span className="opp-header-anchor">
            {isMano && !lettersHidden && <span className={`seat-badge seat-badge-gold${headerLetter ? ' seat-badge-letter' : ''}`}>{headerLetter ? 'M' : 'Mano'}</span>}
            {isPie  && !lettersHidden && <span className={`seat-badge seat-badge-neutral${headerLetter ? ' seat-badge-letter' : ''}`}>{headerLetter ? 'P' : 'Pie'}</span>}
            {/* TURNO — móvil: render condicional intacto (gateado por !desktopHeader).
                DSK-P1 · escritorio: el slot se RESERVA siempre (visibility) para que su
                aparición/desaparición no mueva el badge de rol ni el nombre (doctrina O1). */}
            {!desktopHeader && isTurn && !lettersHidden && <span className={`seat-badge seat-badge-gold${letterBadges ? ' seat-badge-letter' : ''}`}>{letterBadges ? 'T' : 'Turno'}</span>}
            {desktopHeader && <span className="seat-badge seat-badge-gold seat-badge-letter" style={{ visibility: isTurn && !lettersHidden ? 'visible' : 'hidden' }}>T</span>}
            {isWinner && score && <span className="win-score-chip">{score.points}</span>}
          </span>
        </div>
        {/* H3/M4-1: en las mesas con header rediseñado (señal letterBadges:
            5 y 4 vertical) la línea del saldo no se monta — su lugar lo toma
            la ficha con toggle. El resto de escenarios la conserva intacta. */}
        {/* DSK-P2: en escritorio cornerChip=true → el saldo inline "N fichas" se
            desmonta (lo sustituye la ficha de esquina), cumpliendo DSK-1 en las IAs.
            Móvil intacto: donde cornerChip=true, letterBadges ya era true → !letterBadges
            ya lo desmontaba (la condición extra es no-op fuera del gate desktop). */}
        {/* VIS-3a · destino del vuelo por la rama del saldo inline. El censo de
            Fase 0 no la encontró montada en ninguna de las 11 celdas medidas —la
            ficha de esquina la sustituye en portrait, landscape y escritorio—,
            pero se etiqueta igual: el contrato no debe depender de qué rama gane. */}
        {!letterBadges && !cornerChip && <span className="opp-chips" data-coin-target={playerIndex}><BalanceDisplay chips={chipsVista} size="compact" /> fichas</span>}
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

      {/* H4 · Ficha de esquina: reemplazo consultable del saldo retirado.
          Absolute contra el panel (cero flujo), target táctil ~28px con SVG
          de 16 (padding invisible, patrón del nombre tappable). El tap lo
          gatea GameTable (no-op en showdown — visible e inerte). El float
          despliega a la derecha sin empujar nada (patrón pot-float).
          M4-1: gate propio (cornerChip) separado de letterBadges — su CSS
          absolute está scopeado por mesa y sin él el span caería EN FLUJO. */}
      {/* VIS-3a · DESTINO del vuelo de monedas cuando gana esta IA: es la rama
          viva en las 11 celdas del censo. El vuelo mide el centro y el TAMAÑO de
          `[data-coin-target="n"] .chip-token` (aquí 16 px, contra los 36 del
          humano), y de ahí sale la escala de llegada. */}
      {cornerChip && (
        <span className="opp-corner-chip" data-coin-target={playerIndex} onClick={onChipTap}>
          <ChipToken size="icon" />
          {isChipOpen && (
            /* H5: solo el número, desnudo (sin caja ni "fichas") */
            <span className="chip-balance-float">{chipsVista}</span>
          )}
        </span>
      )}

      {/* Rótulo de estado (doblado en C4.3.1). En la transición a la mano
          siguiente (resetting) se limpia para no arrastrar "Se retiró" ni la
          última acción de la mano previa durante el barajado. */}
      <span className={`opp-status${isTurn ? ' opp-status-turn' : ''}${isEliminating ? ' opp-status-elim' : ''}`}>
        {isEliminating
          ? 'Sin fichas'
          : resetting ? ' ' : (player.folded ? 'Se retiró' : (isTurn ? 'Pensando…' : (lastAction ?? ' ')))}
      </span>

      <span className="opp-score" style={{ visibility: showScore && score && !resetting ? 'visible' : 'hidden' }}>
        {/* MSG-U1b · voz de la casa (ver src/hooks/resultadoCore.js). Ésta es la
            ruta opp-panel; la legacy .ai-zone de mesa 2 lleva la misma línea. */}
        {score && <>Mejor palo: <strong>{score.palo}</strong>{vozResto(score)}</>}
      </span>
    </div>
  )
}
