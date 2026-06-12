import { useState, useEffect, useRef, createRef } from 'react'
import '../styles/gameTable.css'
import PlayingCard from './PlayingCard'
import { SoundButton } from './SoundButton'
import { MuteButton } from './MuteButton'
import { useSounds } from '../hooks/useSounds'
import BalanceDisplay from './BalanceDisplay'
import {
  PHASES,
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  toggleDiscard,
} from '../engine/gameEngine'

const TURN_TIME  = 20
const WARNING_AT = 5

// ── Deal helpers ─────────────────────────────────────────────────────────────
// Which card is dealt at a given step: even=player, odd=AI
function getDealTarget(phase, step, manoIsPlayer) {
  const isPlayerCard = manoIsPlayer ? (step % 2 === 0) : (step % 2 !== 0)
  const offset = phase === PHASES.DEAL_3 ? 2 : 0
  return { isPlayerCard, cardIndex: offset + Math.floor(step / 2) }
}

// How many cards are visible after `step` have landed
function getDealVis(phase, step, manoIsPlayer) {
  const off = phase === PHASES.DEAL_3 ? 2 : 0
  return manoIsPlayer
    ? { pc: off + Math.ceil(step / 2),  ac: off + Math.floor(step / 2) }
    : { pc: off + Math.floor(step / 2), ac: off + Math.ceil(step / 2) }
}

// ── ShuffleDeck ───────────────────────────────────────────────────────────────
function ShuffleDeck() {
  const angles = [-22, -11, 0, 11, 22]
  return (
    <>
      {angles.map((angle, i) => (
        <div
          key={i}
          className="shuffle-fan-card"
          style={{ animationDelay: `${i * 25}ms`, '--fan-angle': `${angle}deg` }}
        />
      ))}
    </>
  )
}

// ── FlyingCard ────────────────────────────────────────────────────────────────
function FlyingCard({ fromX, fromY, toX, toY, onDone }) {
  const [moved, setMoved] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMoved(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className="flying-card"
      style={{
        left: fromX,
        top:  fromY,
        transform: moved ? `translate(${toX - fromX}px,${toY - fromY}px)` : 'translate(0,0)',
        transition: moved ? 'transform 0.595s ease-out' : 'none',
      }}
      onTransitionEnd={onDone}
    />
  )
}

// ── GameTable ─────────────────────────────────────────────────────────────────
export default function GameTable({ stake, onLeave }) {
  const [game,         setGame]         = useState(() => createInitialState(stake))
  const [betAmount,    setBetAmount]    = useState(stake)
  const [dealStep,     setDealStep]     = useState(0)
  const [flyingCards,  setFlyingCards]  = useState([])
  const [discardAnim,    setDiscardAnim]    = useState(null)
  const [timeLeft,     setTimeLeft]     = useState(TURN_TIME)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [isShuffling,  setIsShuffling]  = useState(false)
  const [isClearing,   setIsClearing]   = useState(false)
  const [deal3FaceUp,  setDeal3FaceUp]  = useState(new Set())
  const { play } = useSounds()

  // Position refs
  const aiDeckRef         = useRef(null)
  const playerDeckRef          = useRef(null)
  const discardStepLaunchedRef = useRef(-1)
  const playerSlotRefs = useRef(Array.from({ length: 5 }, () => createRef()))
  const aiSlotRefs     = useRef(Array.from({ length: 5 }, () => createRef()))
  const gameRef        = useRef(game)

  const { phase, betTurn, currentBet, playerContrib, playerChips } = game
  const unit        = game.unit
  const isDealPhase = phase === PHASES.DEAL_2 || phase === PHASES.DEAL_3
  const dealTotal   = phase === PHASES.DEAL_2 ? 4 : phase === PHASES.DEAL_3 ? 6 : 0
  const showDeck    = true

  useEffect(() => { gameRef.current = game })

  // ── betAmount reset ───────────────────────────────────────────────────────
  useEffect(() => { setBetAmount(unit) }, [phase, unit])

  // ── Deal animation ────────────────────────────────────────────────────────
  function launchFlyingCard(step) {
    const { isPlayerCard, cardIndex } = getDealTarget(phase, step, game.pieIsAI)
    const deckEl  = game.pieIsAI ? aiDeckRef.current : playerDeckRef.current
    const slotEl  = (isPlayerCard ? playerSlotRefs : aiSlotRefs).current[cardIndex]?.current

    if (!deckEl || !slotEl) {          // fallback: skip animation
      play('cardDeal')
      setDealStep(s => s + 1)
      return
    }

    const dr = deckEl.getBoundingClientRect()
    const sr = slotEl.getBoundingClientRect()
    play('cardDeal')
    setFlyingCards(prev => [...prev, {
      id: `fly-${phase}-${step}`,
      fromX: dr.left, fromY: dr.top,
      toX:   sr.left, toY:   sr.top,
    }])
  }

  useEffect(() => {
    if (!isDealPhase) { setFlyingCards([]); return }
    if (dealStep >= dealTotal) {
      if (phase === PHASES.DEAL_3) {
        const t0 = setTimeout(() => setDeal3FaceUp(prev => new Set(prev).add(2)), 300)
        const t1 = setTimeout(() => setDeal3FaceUp(prev => new Set(prev).add(3)), 600)
        const t2 = setTimeout(() => setDeal3FaceUp(prev => new Set(prev).add(4)), 900)
        const t3 = setTimeout(() => {
          setDeal3FaceUp(new Set())
          setDealStep(0)
          setGame(prev => advanceFromDeal(prev))
        }, 2000)
        return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
      }
      const t = setTimeout(() => {
        setDealStep(0)
        setGame(prev => advanceFromDeal(prev))
      }, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => launchFlyingCard(dealStep), dealStep === 0 ? 120 : 0)
    return () => clearTimeout(t)
  }, [isDealPhase, dealStep, dealTotal]) // eslint-disable-line

  // Reset deal step on entering a deal phase
  useEffect(() => {
    if (phase === PHASES.DEAL_2 || phase === PHASES.DEAL_3) {
      setDealStep(0)
      setDeal3FaceUp(new Set())
    }
  }, [phase]) // eslint-disable-line

  // Shuffle sound fires on the same render that mounts ShuffleDeck
  useEffect(() => {
    if (isShuffling) play('cardShuffle')
  }, [isShuffling]) // eslint-disable-line

  // ── Turn timer ────────────────────────────────────────────────────────────
  const toCallEarly        = currentBet - playerContrib
  const isBetPhaseEarly    = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
  const isPlayerTurnEarly  = betTurn === 'player' && isBetPhaseEarly
  const isDiscardTimerActive = phase === PHASES.DISCARD && !discardAnim

  useEffect(() => {
    if (isPlayerTurnEarly || phase === PHASES.DISCARD) setTimeLeft(TURN_TIME)
  }, [phase, betTurn]) // eslint-disable-line

  useEffect(() => {
    if (!isPlayerTurnEarly && !isDiscardTimerActive) return
    if (timeLeft <= 0) return
    const t = setTimeout(() => {
      const next = timeLeft - 1
      setTimeLeft(next)
      if (next > 0 && next <= WARNING_AT) play('timerWarning')
      if (next === 0) {
        if (isPlayerTurnEarly) {
          setGame(prev => applyPlayerBetAction(prev, prev.currentBet === 0 ? 'pasar' : 'retirarse', prev.unit))
        } else {
          const g = gameRef.current
          const nextGame = applyDiscard({ ...g, selectedDiscards: [] }, [])
          const aiDiscardIndices = g.aiCards
            .map((c, i) => (c !== nextGame.aiCards[i] ? i : -1))
            .filter(i => i >= 0)
          const manoIsPlayer = g.pieIsAI
          const manoSeq = (manoIsPlayer ? [] : aiDiscardIndices).map(idx => ({ isPlayer: manoIsPlayer, idx }))
          const pieSeq  = (manoIsPlayer ? aiDiscardIndices : []).map(idx => ({ isPlayer: !manoIsPlayer, idx }))
          setDiscardAnim({ nextGame, seq: [...manoSeq, ...pieSeq], step: 0, faceDown: new Set(), revealed: new Set() })
        }
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [isPlayerTurnEarly, isDiscardTimerActive, timeLeft]) // eslint-disable-line

  // ── Win sound ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === PHASES.PAYOUT) play('win')
  }, [phase]) // eslint-disable-line

  // ── Discard replenishment animation ───────────────────────────────────────
  useEffect(() => {
    if (!discardAnim) { discardStepLaunchedRef.current = -1; return }
    const { seq, step, nextGame } = discardAnim
    if (step >= seq.length) {
      const lastIsPlayer = seq[seq.length - 1]?.isPlayer ?? false
      const delay = lastIsPlayer ? 900 : 300
      const t = setTimeout(() => { setGame(nextGame); setDiscardAnim(null) }, delay)
      return () => clearTimeout(t)
    }
    if (discardStepLaunchedRef.current >= step) return
    discardStepLaunchedRef.current = step

    const { isPlayer, idx } = seq[step]
    const deckEl = game.pieIsAI ? aiDeckRef.current : playerDeckRef.current
    const slotEl = (isPlayer ? playerSlotRefs : aiSlotRefs).current[idx]?.current

    if (!deckEl || !slotEl) { handleDiscardFlyDone(isPlayer, idx); return }

    const dr = deckEl.getBoundingClientRect()
    const sr = slotEl.getBoundingClientRect()
    play('cardDeal')
    setFlyingCards(prev => [...prev, {
      id: `discard-fly-${step}`,
      fromX: dr.left, fromY: dr.top,
      toX:   sr.left, toY:   sr.top,
      isDiscardFly: true, isPlayer, slotIdx: idx,
    }])
  }, [discardAnim]) // eslint-disable-line

  // ── AI auto-action ────────────────────────────────────────────────────────
  useEffect(() => {
    const isBet = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
    if (isBet && betTurn === 'ai') {
      const t = setTimeout(() => {
        setGame(prev => {
          const next = applyAIBetAction(prev)
          if (next.pot > prev.pot) play('coinBet')
          return next
        })
      }, 900)
      return () => clearTimeout(t)
    }
  }, [phase, betTurn])

  // ── Betting helpers ───────────────────────────────────────────────────────
  const toCall       = toCallEarly
  const isBetPhase   = isBetPhaseEarly
  const isPlayerTurn = isPlayerTurnEarly
  const canPass  = isPlayerTurn && toCall === 0
  const canBet   = isPlayerTurn && currentBet === 0 && playerChips >= betAmount
  const canCall  = isPlayerTurn && toCall > 0 && playerChips >= toCall
  const raiseTo  = currentBet + betAmount
  const canRaise = isPlayerTurn && currentBet > 0 && playerChips >= (raiseTo - playerContrib)

  function act(action) {
    if (['apostar', 'igualar', 'subir'].includes(action)) play('coinBet')
    setGame(prev => applyPlayerBetAction(prev, action, betAmount))
  }

  // ── Discard ───────────────────────────────────────────────────────────────
  function handleDiscard() {
    const playerDiscardIndices = [...game.selectedDiscards]
    const nextGame = applyDiscard(game, playerDiscardIndices)
    const aiDiscardIndices = game.aiCards
      .map((c, i) => (c !== nextGame.aiCards[i] ? i : -1))
      .filter(i => i >= 0)

    const manoIsPlayer = game.pieIsAI
    const manoSeq = (manoIsPlayer ? playerDiscardIndices : aiDiscardIndices)
      .map(idx => ({ isPlayer: manoIsPlayer, idx }))
    const pieSeq  = (manoIsPlayer ? aiDiscardIndices : playerDiscardIndices)
      .map(idx => ({ isPlayer: !manoIsPlayer, idx }))

    setDiscardAnim({ nextGame, seq: [...manoSeq, ...pieSeq], step: 0, faceDown: new Set(), revealed: new Set() })
  }

  function handleDiscardFlyDone(isPlayer, slotIdx) {
    const key = isPlayer ? `p${slotIdx}` : `a${slotIdx}`
    setDiscardAnim(prev => {
      if (!prev) return null
      return { ...prev, step: prev.step + 1, faceDown: new Set(prev.faceDown).add(key) }
    })
    if (isPlayer) {
      setTimeout(() => {
        setDiscardAnim(prev => {
          if (!prev) return null
          return { ...prev, revealed: new Set(prev.revealed).add(key) }
        })
      }, 450)
    }
  }

  const isDiscardPhase = phase === PHASES.DISCARD
  const isPayoutPhase  = phase === PHASES.PAYOUT

  // ── Card visibility ───────────────────────────────────────────────────────
  const { pc: visP, ac: visA } = isDealPhase ? getDealVis(phase, dealStep, game.pieIsAI) : { pc: 5, ac: 5 }

  // ── Phase label ───────────────────────────────────────────────────────────
  const phaseLabel = {
    [PHASES.DEAL_2]:  'Repartiendo',
    [PHASES.BET_1]:   'A las 2',
    [PHASES.DEAL_3]:  'Repartiendo',
    [PHASES.BET_2]:   'A las 3',
    [PHASES.DISCARD]: 'Descarte',
    [PHASES.BET_3]:   'Al descarte',
    [PHASES.PAYOUT]:  'Resultado',
    [PHASES.WAITING]: '—',
  }[phase] ?? phase

  // ── Card render helpers ───────────────────────────────────────────────────
  function renderAICards() {
    return Array.from({ length: 5 }, (_, i) => {
      const ref = aiSlotRefs.current[i]
      if (discardAnim) {
        const key  = `a${i}`
        const card = discardAnim.nextGame.aiCards[i]
        const inSeq = discardAnim.seq.some(s => !s.isPlayer && s.idx === i)
        const content = !inSeq
          ? (card ? <PlayingCard card={card} faceDown /> : <PlayingCard />)
          : discardAnim.faceDown.has(key)
            ? <PlayingCard faceDown />
            : <PlayingCard />
        return <div key={`as-${i}`} ref={ref} className="card-slot-wrapper">{content}</div>
      }
      if (isClearing || isShuffling) return <div key={`as-${i}`} ref={ref} className="card-slot-wrapper"><PlayingCard /></div>
      const card    = game.aiCards[i]
      const visible = i < visA
      return (
        <div key={`as-${i}`} ref={ref} className="card-slot-wrapper">
          {!visible || !card
            ? <PlayingCard />
            : <PlayingCard card={card} faceDown={!isPayoutPhase} />}
        </div>
      )
    })
  }

  function renderPlayerCards() {
    return Array.from({ length: 5 }, (_, i) => {
      const ref = playerSlotRefs.current[i]
      if (discardAnim) {
        const key  = `p${i}`
        const card = discardAnim.nextGame.playerCards[i]
        const inSeq = discardAnim.seq.some(s => s.isPlayer && s.idx === i)
        let content
        if (!inSeq) {
          content = card ? <PlayingCard card={card} /> : <PlayingCard />
        } else if (discardAnim.revealed.has(key)) {
          content = <PlayingCard key={`rev-${i}`} card={card} animClass="card-flip-anim" />
        } else if (discardAnim.faceDown.has(key)) {
          content = <PlayingCard faceDown />
        } else {
          content = <PlayingCard />
        }
        return <div key={`ps-${i}`} ref={ref} className="card-slot-wrapper">{content}</div>
      }
      if (isClearing || isShuffling) return <div key={`ps-${i}`} ref={ref} className="card-slot-wrapper"><PlayingCard /></div>
      const card    = game.playerCards[i]
      const visible = i < visP
      if (phase === PHASES.DEAL_3 && i >= 2 && visible && card) {
        return (
          <div key={`ps-${i}`} ref={ref} className="card-slot-wrapper">
            {deal3FaceUp.has(i)
              ? <PlayingCard key={`d3rev-${i}`} card={card} animClass="card-flip-anim" />
              : <PlayingCard faceDown />}
          </div>
        )
      }
      return (
        <div key={`ps-${i}`} ref={ref} className="card-slot-wrapper">
          {!visible || !card
            ? <PlayingCard />
            : <PlayingCard
                card={card}
                selected={game.selectedDiscards.includes(i)}
                onClick={isDiscardPhase ? () => setGame(prev => toggleDiscard(prev, i)) : undefined}
              />}
        </div>
      )
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="game-table-screen">
      <section className="game-table">

        <header className="table-header">
          <h1 className="table-title">AJILEI</h1>
          <div className="header-center">
            <span className="table-badge">{phaseLabel}</span>
            <span className="hand-badge" style={{ visibility: game.handCount > 0 ? 'visible' : 'hidden' }}>
              Mano #{game.handCount > 0 ? game.handCount : '—'}
            </span>
          </div>
          <div className="header-right">
            <MuteButton />
            <SoundButton className="btn-leave" onClick={() => setConfirmLeave(true)} title="Abandonar mesa">✕</SoundButton>
          </div>
        </header>

        {/* AI Zone */}
        <section className="ai-zone">
          <div className="ai-info">
            <span className="ai-label">
              IA<span className="mano-badge" style={{ visibility: !game.pieIsAI ? 'visible' : 'hidden' }}>Mano</span>
            </span>
            <span className="ai-chips"><BalanceDisplay chips={game.aiChips} /> fichas</span>
          </div>
          <div className="cards-row">
            {renderAICards()}
            <div className="deck-shuffle-wrapper">
              <div
                ref={aiDeckRef}
                className={`deck-pile${!game.pieIsAI || !showDeck || isClearing ? ' deck-hidden' : ''}`}
              />
              {isShuffling && game.pieIsAI && <ShuffleDeck />}
            </div>
          </div>
          <div className="score-tag" style={{ visibility: isPayoutPhase && !isClearing && game.aiScore ? 'visible' : 'hidden' }}>
            {game.aiScore && <>Mejor palo: <strong>{game.aiScore.palo}</strong> ({game.aiScore.points} pts)</>}
          </div>
        </section>

        {/* Center Zone */}
        <section className="center-zone">
          <div className="pot-box">
            <span className="pot-label">Pozo</span>
            <strong className="pot-value">{game.pot}</strong>
          </div>
          <div className="call-box" style={{ visibility: currentBet > 0 && isBetPhase ? 'visible' : 'hidden' }}>
            <span className="pot-label">A igualar</span>
            <strong className="call-value">{toCall > 0 ? toCall : '—'}</strong>
          </div>
          <p className={`game-message${game.winner === 'player' ? ' msg-win' : game.winner === 'ai' ? ' msg-lose' : ''}`}>
            {game.message}
          </p>
        </section>

        {/* Player Zone */}
        <section className="player-zone">
          <div className="score-tag score-tag-player" style={{ visibility: isPayoutPhase && !isClearing && game.playerScore ? 'visible' : 'hidden' }}>
            {game.playerScore && <>Tu mejor palo: <strong>{game.playerScore.palo}</strong> ({game.playerScore.points} pts)</>}
          </div>

          <div className="cards-row">
            <div className="deck-shuffle-wrapper">
              <div
                ref={playerDeckRef}
                className={`deck-pile${game.pieIsAI || !showDeck || isClearing ? ' deck-hidden' : ''}`}
              />
              {isShuffling && !game.pieIsAI && <ShuffleDeck />}
            </div>
            {renderPlayerCards()}
          </div>

          {phase === PHASES.WAITING && !isShuffling && (
            <div className="action-area">
              <SoundButton className="btn btn-primary" onClick={() => {
                setIsShuffling(true)
                setTimeout(() => {
                  setIsShuffling(false)
                  setGame(prev => startHand(prev))
                }, 1950)
              }}>
                Iniciar mano
              </SoundButton>
            </div>
          )}

          {phase === PHASES.WAITING && isShuffling && (
            <div className="action-area thinking">Barajando…</div>
          )}

          {isDealPhase && (
            <div className="action-area thinking">Repartiendo cartas…</div>
          )}

          {isBetPhase && betTurn === 'ai' && (
            <div className="action-area thinking">La IA está pensando…</div>
          )}

          {isPlayerTurn && (
            <div className="action-area action-col">
              <div className={`timer-display${timeLeft <= WARNING_AT ? ' timer-warning' : ''}`}>
                {timeLeft}s
              </div>
              <div className="mult-row">
                {[1, 2, 5, 10].map((mult) => {
                  const val = unit * mult
                  return (
                    <SoundButton
                      key={mult}
                      className={`btn btn-mult${betAmount === val ? ' btn-mult-active' : ''}`}
                      onClick={() => setBetAmount(val)}
                      disabled={val > playerChips}
                    >
                      ×{mult}
                    </SoundButton>
                  )
                })}
                <span className="bet-total">
                  {currentBet === 0 ? betAmount : raiseTo} fic.
                </span>
              </div>
              <div className="action-buttons">
                {canPass  && <SoundButton className="btn btn-pass"  onClick={() => act('pasar')}>Pasar</SoundButton>}
                {canBet   && <SoundButton className="btn btn-bet"   onClick={() => act('apostar')}>Apostar {betAmount}</SoundButton>}
                {canCall  && <SoundButton className="btn btn-call"  onClick={() => act('igualar')}>Igualar ({toCall})</SoundButton>}
                {canRaise && <SoundButton className="btn btn-raise" onClick={() => act('subir')}>Subir a {raiseTo}</SoundButton>}
                <SoundButton className="btn btn-fold" onClick={() => act('retirarse')}>Retirarse</SoundButton>
              </div>
            </div>
          )}

          {isDiscardPhase && !discardAnim && (
            <div className="action-area discard-area">
              <div className={`timer-display${timeLeft <= WARNING_AT ? ' timer-warning' : ''}`}>
                {timeLeft}s
              </div>
              <p className="discard-hint">
                {game.selectedDiscards.length === 0
                  ? 'Pulsa las cartas a descartar (máx. 5) o continúa sin descartar.'
                  : `${game.selectedDiscards.length} carta(s) seleccionada(s).`}
              </p>
              <SoundButton className="btn btn-primary" onClick={handleDiscard}>
                {game.selectedDiscards.length > 0 ? `Descartar ${game.selectedDiscards.length}` : 'Sin descartar'}
              </SoundButton>
            </div>
          )}

          {isDiscardPhase && discardAnim && (
            <div className="action-area thinking">Reponiendo…</div>
          )}

          {isPayoutPhase && !isClearing && !isShuffling && (
            <div className="action-area">
              <SoundButton className="btn btn-primary" onClick={() => {
                setIsClearing(true)
                setGame(prev => ({ ...prev, message: '', winner: null }))
                setTimeout(() => {
                  setIsClearing(false)
                  setGame(prev => ({ ...prev, pieIsAI: !prev.pieIsAI }))
                  setIsShuffling(true)
                  setTimeout(() => {
                    setIsShuffling(false)
                    setGame(prev => startHand(prev))
                  }, 1950)
                }, 300)
              }}>
                Siguiente mano
              </SoundButton>
            </div>
          )}

          {isPayoutPhase && isShuffling && (
            <div className="action-area thinking">Barajando…</div>
          )}

          {isPayoutPhase && isClearing && (
            <div className="action-area" />
          )}

          <div className="player-info">
            <strong>Tú<span className="mano-badge" style={{ visibility: game.pieIsAI ? 'visible' : 'hidden' }}>Mano</span></strong>
            <span><BalanceDisplay chips={game.playerChips} /> fichas · Mesa {unit}</span>
          </div>
        </section>

      </section>

      {/* Flying cards overlay */}
      {flyingCards.map(fc => (
        <FlyingCard
          key={fc.id}
          fromX={fc.fromX} fromY={fc.fromY}
          toX={fc.toX}     toY={fc.toY}
          onDone={() => {
            setFlyingCards(prev => prev.filter(c => c.id !== fc.id))
            if (fc.isDiscardFly) handleDiscardFlyDone(fc.isPlayer, fc.slotIdx)
            else setDealStep(s => s + 1)
          }}
        />
      ))}

      {/* Confirmación abandonar mesa */}
      {confirmLeave && (
        <div className="leave-overlay" onClick={() => setConfirmLeave(false)}>
          <div className="leave-modal" onClick={e => e.stopPropagation()}>
            <p className="leave-modal-title">¿Abandonar la mesa?</p>
            <p className="leave-modal-sub">Perderás el progreso de esta mano.</p>
            <div className="leave-modal-actions">
              <SoundButton className="btn btn-pass" onClick={() => setConfirmLeave(false)}>
                Cancelar
              </SoundButton>
              <SoundButton
                className="btn btn-fold"
                onClick={() => {
                  // TODO: sync balance to Supabase (Step 7)
                  setConfirmLeave(false)
                  onLeave()
                }}
              >
                Abandonar mesa
              </SoundButton>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
