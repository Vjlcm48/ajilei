import { useState, useEffect, useRef, createRef } from 'react'
import '../styles/gameTable.css'
import PlayingCard from './PlayingCard'
import OpponentPanel from './OpponentPanel'
import { SoundButton } from './SoundButton'
import { MuteButton } from './MuteButton'
import { useSounds } from '../hooks/useSounds'
import BalanceDisplay from './BalanceDisplay'
import { effectiveLayout, livingRivalsInDisplayOrder } from '../config/seatLayouts'
import {
  PHASES,
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  toggleDiscard,
  maxDiscard,
} from '../engine/gameEngine'

const TURN_TIME  = 20
const WARNING_AT = 5

// Tanda C3.1: factor único de ritmo de las IAs (+25%) — multiplica TODAS las
// pausas asociadas a acciones de IA (pensar antes de actuar, gaps entre
// acciones/turnos consecutivos y pausas del descarte secuencial)
const AI_SPEED_FACTOR = 1.25
const AI_ACTION_MS    = 900 * AI_SPEED_FACTOR

// Tanda C4.5: coreografía del encogimiento (entre manos)
// C4.5.1: el aviso se muestra antes del reacomodo (secuencia ordenada).
// C4.5.2: duración −25% (5000 → 3750) — debe ir en sync con la animación CSS
// `elimNotice` de gameTable.css (misma duración).
const CEREMONY_MS     = 1000   // salida digna del panel eliminado (desatura → fade)
const ELIM_NOTICE_MS  = 3750   // aviso central no bloqueante (aparece y se va solo)

// ── Deal helpers ─────────────────────────────────────────────────────────────
// Replays the engine's deal visually: active seats in Mano→Pie order, one card
// per seat per round. Returns [{ seat, cardIndex }] in deal order.
function buildDealSeq(state) {
  const { numPlayers: N, manoIndex, players, phase } = state
  const rounds = phase === PHASES.DEAL_3 ? 3 : 2
  const offset = phase === PHASES.DEAL_3 ? 2 : 0
  const seq = []
  for (let r = 0; r < rounds; r++) {
    for (let o = 0; o < N; o++) {
      const seat = (manoIndex + o) % N
      if (players[seat].folded) continue
      seq.push({ seat, cardIndex: offset + r })
    }
  }
  return seq
}

// Cards visible per seat after `step` flying cards have landed
function dealVisibility(seq, step, offset) {
  const vis = {}
  for (let i = 0; i < step && i < seq.length; i++) {
    vis[seq[i].seat] = seq[i].cardIndex + 1
  }
  return seat => vis[seat] ?? offset
}

// Infer the visible action of a seat from a state transition (engine is read-only).
function inferAction(prev, next, seat) {
  const p = prev.players[seat]
  const n = next.players[seat]
  if (!p.folded && n.folded) return 'Se retiró'
  const put = p.chips - n.chips
  if (put > 0) {
    if (prev.currentBet === 0) return 'Apostó'
    const toCall = prev.currentBet - p.contrib
    if (put > toCall) return 'Subió'
    return 'Igualó'
  }
  return 'Pasó'
}

// Clasifica el mensaje del centro por tipo de acción para estilarlo (Tanda C4.3).
// Lee el verbo del texto realmente visible (humano e IA, N=2 y N>2). Devuelve
// 'fold' | 'bet' | 'neutral' para acciones de apuesta, o null si no es una acción
// (reparto, fases, descarte, resultado → conservan su estilo actual).
function messageActionKind(msg) {
  if (!msg) return null
  if (/se retira|Te retiras/.test(msg))            return 'fold'
  if (/apuesta|Apuestas|sube|Subes/.test(msg))     return 'bet'
  if (/pasa|Pasas|iguala|Igualas/.test(msg))       return 'neutral'
  return null
}

// Diff prev/next hands per active seat (Mano→Pie order) → per-player discard plan
function buildDiscardPlan(prevGame, nextGame) {
  const { numPlayers: N, manoIndex, players } = prevGame
  const plan = []
  for (let o = 0; o < N; o++) {
    const seat = (manoIndex + o) % N
    if (players[seat].folded) continue
    const indices = players[seat].cards
      .map((c, i) => (c !== nextGame.players[seat].cards[i] ? i : -1))
      .filter(i => i >= 0)
    plan.push({ seat, indices })
  }
  return plan
}

// Center-message narration during the sequential discard
function discardNarration(seat, n, g) {
  const name   = g.players[seat].name
  const cartas = n === 1 ? 'carta' : 'cartas'
  if (seat === 0) return n === 0 ? 'No descartas.' : `Descartas ${n} ${cartas}.`
  return n === 0 ? `${name} no descarta.` : `${name} descarta ${n} ${cartas}.`
}

// Sequential discard pacing (ms) — tempo ×3 (ajuste Tanda 1.2: el ritmo
// original se sentía "disparado"); la secuencia Mano→Pie no cambia.
// Tanda C3.1: las PAUSAS escalan con AI_SPEED_FACTOR; los vuelos (D_OUT/D_IN)
// no, porque deben coincidir con la duración real de FlyingCard (0.75s)
const D_OUT      = 750   // vuelo carta→mazo
const D_OUT_STAG = 150 * AI_SPEED_FACTOR
const D_PAUSE    = 300 * AI_SPEED_FACTOR   // slots vacíos un instante
const D_IN       = 750   // vuelo mazo→slot
const D_IN_STAG  = 180 * AI_SPEED_FACTOR
const D_SEAT_GAP = 240 * AI_SPEED_FACTOR   // respiro entre jugadores
const D_SKIP     = 600 * AI_SPEED_FACTOR   // pausa del "no descarta"

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
function FlyingCard({ fromX, fromY, toX, toY, duration = 0.595, onDone }) {
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
        transition: moved ? `transform ${duration}s ease-out` : 'none',
      }}
      onTransitionEnd={onDone}
    />
  )
}

// ── GameTable ─────────────────────────────────────────────────────────────────
export default function GameTable({ stake, numPlayers = 2, onLeave }) {
  const [game,         setGame]         = useState(() => createInitialState(stake, numPlayers))
  const [betAmount,    setBetAmount]    = useState(stake)
  const [dealStep,     setDealStep]     = useState(0)
  const [flyingCards,  setFlyingCards]  = useState([])
  const [discardAnim,  setDiscardAnim]  = useState(null)
  const [discardMsg,   setDiscardMsg]   = useState(null)
  const [lastActions,  setLastActions]  = useState({})
  const [timeLeft,     setTimeLeft]     = useState(TURN_TIME)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [isShuffling,  setIsShuffling]  = useState(false)
  const [isClearing,   setIsClearing]   = useState(false)
  const [deal3FaceUp,  setDeal3FaceUp]  = useState(new Set())
  const [potAnim,      setPotAnim]      = useState(null)   // Tanda C4.3: pulso + "+N" del pozo
  // ── C4.5: coreografía del encogimiento ────────────────────────────────────
  const [ceremony,     setCeremony]     = useState(null)   // {seats:number[]} — IA(s) en salida digna
  const [elimNotice,   setElimNotice]   = useState(null)   // {id,text} — aviso central no bloqueante
  const [reflowing,    setReflowing]    = useState(false)  // asentado suave del nuevo layout
  const [noteFlash,    setNoteFlash]    = useState(0)      // destello del chip de comodín
  const [bankruptModal, setBankruptModal] = useState(false)// Caso B: humano sin fichas (≥2 vivos)
  const { play } = useSounds()

  // Position refs: one 5-slot row + one deck anchor per seat
  const slotRefs = useRef(null)
  if (!slotRefs.current) {
    slotRefs.current = Array.from({ length: numPlayers }, () =>
      Array.from({ length: 5 }, () => createRef())
    )
  }
  const deckRefs = useRef(null)
  if (!deckRefs.current) {
    deckRefs.current = Array.from({ length: numPlayers }, () => createRef())
  }
  const discardTimersRef = useRef([])
  const ceremonyTimersRef = useRef([])
  const gameRef = useRef(game)
  const prevPotRef = useRef(game.pot)

  // Clear pending discard / ceremony timers if the table unmounts mid-animation
  useEffect(() => () => {
    discardTimersRef.current.forEach(clearTimeout)
    ceremonyTimersRef.current.forEach(clearTimeout)
  }, [])

  // ── Pozo: pulso + "+N" flotante al aumentar (Tanda C4.3) ──────────────────
  // Cualquier incremento del pozo (apuesta/igualada/subida de humano o IA, y
  // el cobro de antes al iniciar mano) dispara el efecto. El "+N" es overlay
  // absoluto y el pulso es transform/text-shadow → no altera caja ni layout.
  useEffect(() => {
    const prev = prevPotRef.current
    prevPotRef.current = game.pot
    if (game.pot > prev) {
      const id = Date.now() + Math.random()
      setPotAnim({ id, delta: game.pot - prev })
      const t = setTimeout(() => setPotAnim(a => (a && a.id === id ? null : a)), 600)
      return () => clearTimeout(t)
    }
  }, [game.pot])

  const { phase, currentBet } = game
  const human        = game.players[0]
  const unit         = game.unit
  const humanIsTurn  = game.activePlayerIndex === 0
  const pieSeat      = game.pieIndex
  // C4.4: el tablero sigue a los jugadores VIVOS (no al tamaño inicial)
  const aliveN       = game.aliveCount
  const effLayout    = effectiveLayout(game.players)
  const isGameOver   = phase === PHASES.GAME_OVER
  const isDealPhase  = phase === PHASES.DEAL_2 || phase === PHASES.DEAL_3
  const dealSeq      = isDealPhase ? buildDealSeq(game) : []
  const dealTotal    = dealSeq.length
  const dealOffset   = phase === PHASES.DEAL_3 ? 2 : 0

  // ── Comodín (7 de Oros) ───────────────────────────────────────────────────
  // Suena SOLO en mesas 4-5 (donde es comodín) y SOLO cuando llega a la mano
  // del humano, en el instante del volteo. Nunca para una IA — delataría su
  // mano. discardNextRef guarda la mano post-descarte para leer la carta
  // repuesta en el momento del flip sin depender del estado (evita doble
  // disparo de StrictMode al no vivir dentro de un updater).
  const comodinActive = (game.aliveCount ?? numPlayers) >= 4   // C4.4: sigue a los vivos
  const isComodin = card => !!card && card.value === 7 && card.palo === 'Oros'
  const discardNextRef = useRef(null)

  // C4.5: texto del chip de comodín (hogar visual del estado de reglas). Cuando
  // cambia al encoger (5→4 cambia el valor; 4→3 se apaga) el chip destella para
  // señalar que cambiaron las reglas, no solo el nº de sillas.
  const comodinNote = aliveN >= 4 ? `Comodín activo · vale ${aliveN === 5 ? 11 : 10}` : 'Sin comodín'
  const prevNoteRef = useRef(comodinNote)
  useEffect(() => {
    if (numPlayers < 4) return
    if (prevNoteRef.current !== comodinNote) {
      prevNoteRef.current = comodinNote
      setNoteFlash(n => n + 1)
    }
  }, [comodinNote, numPlayers])

  // Estado de transición entre manos: cartas/rótulos en blanco (incluye la
  // salida digna de la ceremonia C4.5, no solo clearing/shuffle de C4.4).
  const inReset = isClearing || isShuffling || !!ceremony

  useEffect(() => { gameRef.current = game })

  // ── betAmount reset ───────────────────────────────────────────────────────
  useEffect(() => { setBetAmount(unit) }, [phase, unit])

  // ── Deal animation ────────────────────────────────────────────────────────
  function launchFlyingCard(step) {
    const { seat, cardIndex } = dealSeq[step]
    const deckEl = deckRefs.current[pieSeat]?.current
    const slotEl = slotRefs.current[seat][cardIndex]?.current

    if (!deckEl || !slotEl) {          // fallback: skip animation
      play('cardDeal')
      // DEAL_2 muestra la carta del humano boca arriba al instante (sin flip):
      // su volteo es el aterrizaje, así que el comodín suena aquí.
      if (phase === PHASES.DEAL_2 && seat === 0 && comodinActive && isComodin(game.players[0].cards[cardIndex])) play('comodin')
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
      dealSeat: seat, dealCardIndex: cardIndex,
    }])
  }

  useEffect(() => {
    if (!isDealPhase) { setFlyingCards([]); return }
    if (isShuffling) return   // C4.4.1: ante ya descontado; repartir solo al terminar el barajado
    if (dealStep >= dealTotal) {
      if (phase === PHASES.DEAL_3) {
        // El flip de cada carta (2,3,4) es el volteo del humano: comodín ahí.
        const revealDeal3 = i => {
          setDeal3FaceUp(prev => new Set(prev).add(i))
          if (comodinActive && isComodin(game.players[0].cards[i])) play('comodin')
        }
        const t0 = setTimeout(() => revealDeal3(2), 300)
        const t1 = setTimeout(() => revealDeal3(3), 600)
        const t2 = setTimeout(() => revealDeal3(4), 900)
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
  }, [isDealPhase, dealStep, dealTotal, isShuffling]) // eslint-disable-line

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
  const toCallEarly          = currentBet - human.contrib
  const isBetPhaseEarly      = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
  const isPlayerTurnEarly    = humanIsTurn && isBetPhaseEarly && !human.folded
  const isDiscardTimerActive = phase === PHASES.DISCARD && !discardAnim && !human.folded

  useEffect(() => {
    if (isPlayerTurnEarly || phase === PHASES.DISCARD) setTimeLeft(TURN_TIME)
  }, [phase, game.activePlayerIndex]) // eslint-disable-line

  useEffect(() => {
    if (!isPlayerTurnEarly && !isDiscardTimerActive) return
    if (timeLeft <= 0) return
    const t = setTimeout(() => {
      const next = timeLeft - 1
      setTimeLeft(next)
      if (next > 0 && next <= WARNING_AT) play('timerWarning')
      if (next === 0) {
        if (isPlayerTurnEarly) {
          if (gameRef.current.currentBet > 0) play('cardFold')   // timeout → se retira
          setGame(prev => applyPlayerBetAction(prev, prev.currentBet === 0 ? 'pasar' : 'retirarse', prev.unit))
        } else {
          startDiscardAnim(gameRef.current, [])
        }
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [isPlayerTurnEarly, isDiscardTimerActive, timeLeft]) // eslint-disable-line

  // ── Sonidos de cierre de mano: showdown + victoria ────────────────────────
  // showdown: la mano llegó a comparación (el ganador tiene score → cartas
  //   reveladas); en una mano ganada por retiros no hay volteo, no suena.
  // win: SOLO cuando gana el humano (asiento 0). Antes sonaba en cada payout,
  //   también al perder (corrección Tanda C4.1). Si hubo showdown, la fanfarria
  //   entra un instante después del sonido de revelado.
  useEffect(() => {
    if (phase !== PHASES.PAYOUT) return
    const w = game.winner
    const isShowdown = w !== null && game.players[w].score
    if (isShowdown) play('showdown')
    if (w === 0) {
      const t = setTimeout(() => play('win'), isShowdown ? 450 : 0)
      return () => clearTimeout(t)
    }
  }, [phase]) // eslint-disable-line

  // ── AI auto-action ────────────────────────────────────────────────────────
  // C4.4.1: una IA RETIRADA (folded) no recibe turno de "pensar" — se excluye
  // aquí y se salta en silencio en el efecto siguiente.
  useEffect(() => {
    const isBet = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
    const active = game.players[game.activePlayerIndex]
    if (isBet && game.activePlayerIndex !== 0 && !active.folded) {
      const t = setTimeout(() => {
        const prev = gameRef.current
        const seat = prev.activePlayerIndex
        const next = applyAIBetAction(prev)
        const action = inferAction(prev, next, seat)
        if (next.pot > prev.pot) play('coinBet')
        if (action === 'Se retiró') play('cardFold')
        setLastActions(la => ({ ...la, [seat]: action }))
        setGame(next)
      }, AI_ACTION_MS)
      return () => clearTimeout(t)
    }
  }, [phase, game.activePlayerIndex]) // eslint-disable-line

  // ── Saltar en silencio a un jugador activo RETIRADO (C4.4.1) ──────────────
  // Puede ocurrir al iniciar BET_2/BET_3 si la Mano se retiró en una ronda
  // previa (el motor reinicia activePlayerIndex = manoIndex). Sin "pensando" ni
  // retardo: se avanza el turno de inmediato vía la API del motor (sin tocarlo).
  useEffect(() => {
    const isBet = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
    if (!isBet) return
    const active = game.players[game.activePlayerIndex]
    if (!active || !active.folded) return
    const t = setTimeout(() => {
      const prev = gameRef.current
      const cur  = prev.players[prev.activePlayerIndex]
      if (!cur || !cur.folded) return
      setGame(prev.activePlayerIndex === 0 ? applyPlayerBetAction(prev, 'pasar') : applyAIBetAction(prev))
    }, 0)
    return () => clearTimeout(t)
  }, [phase, game.activePlayerIndex]) // eslint-disable-line

  // Human folded during DISCARD (N≥3): rivals discard on their own
  useEffect(() => {
    if (phase === PHASES.DISCARD && human.folded && !discardAnim) {
      const t = setTimeout(() => startDiscardAnim(gameRef.current, []), AI_ACTION_MS)
      return () => clearTimeout(t)
    }
  }, [phase]) // eslint-disable-line

  // ── Betting helpers ───────────────────────────────────────────────────────
  const toCall       = toCallEarly
  const isBetPhase   = isBetPhaseEarly
  const isPlayerTurn = isPlayerTurnEarly
  const playerChips  = human.chips
  const canPass  = isPlayerTurn && toCall === 0
  const canBet   = isPlayerTurn && currentBet === 0 && playerChips >= betAmount
  const canCall  = isPlayerTurn && toCall > 0 && playerChips >= toCall
  const raiseTo  = currentBet + betAmount
  const canRaise = isPlayerTurn && currentBet > 0 && playerChips >= (raiseTo - human.contrib)

  function act(action) {
    if (['apostar', 'igualar', 'subir'].includes(action)) play('coinBet')
    if (action === 'retirarse') play('cardFold')
    setGame(prev => applyPlayerBetAction(prev, action, betAmount))
  }

  // ── Discard (secuencial, jugador por jugador en orden Mano→Pie) ───────────
  // Por jugador: cartas vuelan boca abajo hacia el mazo → slots vacíos un
  // instante → reposiciones llegan una a una desde el mazo. ~0,5s por jugador.
  function launchDiscardOut(seat, idx) {
    const key = `${seat}:${idx}`
    setDiscardAnim(prev => prev && ({ ...prev, emptied: new Set(prev.emptied).add(key) }))
    const slotEl = slotRefs.current[seat][idx]?.current
    const deckEl = deckRefs.current[gameRef.current.pieIndex]?.current
    if (!slotEl || !deckEl) return
    const sr = slotEl.getBoundingClientRect()
    const dr = deckEl.getBoundingClientRect()
    play('cardDeal')
    setFlyingCards(prev => [...prev, {
      id: `dout-${seat}-${idx}`,
      fromX: sr.left, fromY: sr.top,
      toX:   dr.left, toY:   dr.top,
      fast: true, isDiscardOut: true,
    }])
  }

  function launchDiscardIn(seat, idx) {
    const deckEl = deckRefs.current[gameRef.current.pieIndex]?.current
    const slotEl = slotRefs.current[seat][idx]?.current
    if (!deckEl || !slotEl) { markRefilled(seat, idx); return }
    const dr = deckEl.getBoundingClientRect()
    const sr = slotEl.getBoundingClientRect()
    play('cardDeal')
    setFlyingCards(prev => [...prev, {
      id: `din-${seat}-${idx}`,
      fromX: dr.left, fromY: dr.top,
      toX:   sr.left, toY:   sr.top,
      fast: true, isDiscardIn: true, seat, slotIdx: idx,
    }])
  }

  function markRefilled(seat, idx) {
    const key = `${seat}:${idx}`
    setDiscardAnim(prev => prev && ({ ...prev, refilled: new Set(prev.refilled).add(key) }))
    if (seat === 0) {
      setTimeout(() => {
        setDiscardAnim(prev => prev && ({ ...prev, revealed: new Set(prev.revealed).add(key) }))
        // El flip de la reposición es el volteo: si la carta repuesta del
        // humano es el comodín, suena (leído del ref, no del updater).
        if (comodinActive && isComodin(discardNextRef.current?.players[0].cards[idx])) play('comodin')
      }, 350)
    }
  }

  function startDiscardAnim(g, humanDiscardIndices) {
    const nextGame = applyDiscard(g, humanDiscardIndices)
    discardNextRef.current = nextGame
    const plan     = buildDiscardPlan(g, nextGame)
    const allKeys  = new Set(plan.flatMap(p => p.indices.map(i => `${p.seat}:${i}`)))
    setDiscardAnim({ nextGame, allKeys, emptied: new Set(), refilled: new Set(), revealed: new Set() })

    const timers = []
    let t = 100
    plan.forEach(({ seat, indices }) => {
      const n = indices.length
      timers.push(setTimeout(() => {
        if (seat !== 0) setLastActions(la => ({ ...la, [seat]: `Descartó ${n}` }))
        setDiscardMsg(discardNarration(seat, n, g))
      }, t))
      if (n === 0) { t += D_SKIP; return }
      indices.forEach((idx, k) =>
        timers.push(setTimeout(() => launchDiscardOut(seat, idx), t + k * D_OUT_STAG)))
      const outEnd = t + (n - 1) * D_OUT_STAG + D_OUT
      indices.forEach((idx, k) =>
        timers.push(setTimeout(() => launchDiscardIn(seat, idx), outEnd + D_PAUSE + k * D_IN_STAG)))
      t = outEnd + D_PAUSE + (n - 1) * D_IN_STAG + D_IN + D_SEAT_GAP
    })
    // margen extra si el humano descartó (su flip de revelado tarda 350ms más)
    const humanDiscarded = plan.some(p => p.seat === 0 && p.indices.length > 0)
    timers.push(setTimeout(() => {
      setGame(nextGame)
      setDiscardAnim(null)
      setDiscardMsg(null)
    }, t + (humanDiscarded ? 500 : 200)))
    discardTimersRef.current = timers
  }

  function handleDiscard() {
    startDiscardAnim(game, [...game.selectedDiscards])
  }

  const isDiscardPhase = phase === PHASES.DISCARD
  const isPayoutPhase  = phase === PHASES.PAYOUT

  // ── Showdown winner emphasis ──────────────────────────────────────────────
  // Active until "Siguiente mano" (isClearing). Only when the hand reached
  // showdown (winner has a score) — fold-wins reveal nothing.
  const showdownWinnerSeat =
    isPayoutPhase && !isClearing && game.winner !== null && game.players[game.winner].score
      ? game.winner
      : null

  function isWinningCard(card) {
    if (showdownWinnerSeat === null) return false
    const score = game.players[showdownWinnerSeat].score
    if (card.palo === score.palo) return true
    // comodín (7 de Oros) cuenta para el palo ganador solo si está activo (vivos≥4)
    return aliveN >= 4 && card.palo === 'Oros' && card.value === 7
  }

  // ── Position-derived anchors (deck, MANO badge) ───────────────────────────
  // C4.4.1: startHand se aplica ANTES de barajar (cobro del ante visible), así
  // que durante el barajado `game` ya tiene los índices de la nueva mano. El
  // mazo y los badges leen game directamente — ya están en su posición final.
  const deckSeat = pieSeat
  const manoSeat = game.manoIndex

  // ── Señal de turno (solo fases de apuesta) ────────────────────────────────
  const turnSeat = isBetPhaseEarly ? game.activePlayerIndex : null

  // ── Card visibility during deal ───────────────────────────────────────────
  const visFor = isDealPhase ? dealVisibility(dealSeq, dealStep, dealOffset) : () => 5

  // ── New-hand dispatcher (cobro de ante → barajar → repartir) ──────────────
  // C4.4: si la mesa terminó (GAME_OVER) no barajamos, vamos al fin de mesa.
  // C4.4.1: el ante se cobra ANTES de barajar — committeamos startHand de
  // inmediato (el descuento de saldos se ve), luego corre el barajado y, al
  // terminar, el efecto de reparto reparte las cartas.
  // C4.5: si una IA cae en bancarrota, primero corre la salida digna del panel
  // (ceremonia) y LUEGO se compromete la mano nueva con aviso + asentado suave.
  // Si el humano cae en bancarrota con ≥2 vivos, en vez del GAME_OVER básico se
  // congela la mesa (no se compromete next) y se abre el modal bloqueante.
  function beginHand() {
    setLastActions({})
    const prev = gameRef.current
    const next = startHand(prev)
    if (next.phase === PHASES.GAME_OVER) {
      if (next.players[0].eliminated && next.aliveCount >= 2) setBankruptModal(true)
      else setGame(next)
      return
    }
    const elimSeats = next.players
      .map((_, i) => i)
      .filter(i => i !== 0 && next.players[i].eliminated && !prev.players[i].eliminated)
    if (elimSeats.length > 0) { runEliminationCeremony(next, elimSeats); return }
    commitNewHand(next)
  }

  // C4.5.1 — ceremonia en etapas que NO se pisan (mesa congelada en `prev`
  // durante todas las etapas previas al reacomodo):
  //   1) salida digna del panel (CEREMONY_MS)
  //   2) aviso central en área limpia, legible (~5 s)
  //   3) el aviso se desvanece
  //   4) ENTONCES el tablero se reacomoda (settle + destello del comodín al
  //      cambiar `game` → aliveN). El reflujo ya no coincide con el aviso.
  function runEliminationCeremony(next, elimSeats) {
    setCeremony({ seats: elimSeats })   // mesa = prev; el panel eliminado se desvanece
    const t1 = setTimeout(() => {
      const text = `${next.eliminatedNames.join(', ')} ${next.eliminatedNames.length === 1 ? 'se quedó' : 'se quedaron'} sin fichas · la mesa ahora es de ${next.aliveCount}`
      const id = Date.now()
      setElimNotice({ id, text })       // etapa 2: aviso (mesa aún en prev)
      const t2 = setTimeout(() => {
        setElimNotice(n => (n && n.id === id ? null : n))  // etapa 3: fade terminó
        setCeremony(null)
        commitReflow(next)              // etapa 4: recién ahora se reacomoda
      }, ELIM_NOTICE_MS)
      ceremonyTimersRef.current.push(t2)
    }, CEREMONY_MS)
    ceremonyTimersRef.current.push(t1)
  }

  // Reacomodo al nuevo tamaño: asentado suave + commit (el cambio de aliveN
  // dispara el destello del chip de comodín). Mismo manejo aprobado en C4.5.
  function commitReflow(next) {
    setReflowing(true)
    setTimeout(() => setReflowing(false), 600)
    commitNewHand(next)
  }

  function commitNewHand(next) {
    setGame(next)            // cobro del ante visible (saldos descontados, pozo armado)
    setIsShuffling(true)     // baraja sobre el estado ya cobrado
    setTimeout(() => setIsShuffling(false), 1950)
  }

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
    [PHASES.GAME_OVER]: 'Fin de mesa',
  }[phase] ?? phase

  // ── Card render helpers ───────────────────────────────────────────────────
  function renderOpponentCard(seat, i) {
    if (discardAnim) {
      const key  = `${seat}:${i}`
      const card = game.players[seat].cards[i]
      if (!discardAnim.allKeys.has(key)) {
        return card ? <PlayingCard card={card} faceDown /> : <PlayingCard />
      }
      if (discardAnim.refilled.has(key)) return <PlayingCard faceDown />
      if (discardAnim.emptied.has(key))  return <PlayingCard />
      return <PlayingCard card={card} faceDown />   // aún en mano, no ha volado
    }
    if (inReset) return <PlayingCard />
    const card    = game.players[seat].cards[i]
    const visible = i < visFor(seat)
    if (!visible || !card) return <PlayingCard />
    // Retirados permanecen boca abajo en el showdown, sin resaltado
    const folded = game.players[seat].folded
    return (
      <PlayingCard
        card={card}
        faceDown={!isPayoutPhase || folded}
        highlight={seat === showdownWinnerSeat && isWinningCard(card)}
      />
    )
  }

  function renderPlayerCards() {
    return Array.from({ length: 5 }, (_, i) => {
      const ref = slotRefs.current[0][i]
      if (discardAnim) {
        const key     = `0:${i}`
        const oldCard = game.players[0].cards[i]
        const newCard = discardAnim.nextGame.players[0].cards[i]
        let content
        if (!discardAnim.allKeys.has(key)) {
          content = oldCard ? <PlayingCard card={oldCard} /> : <PlayingCard />
        } else if (discardAnim.revealed.has(key)) {
          content = <PlayingCard key={`rev-${i}`} card={newCard} animClass="card-flip-anim" />
        } else if (discardAnim.refilled.has(key)) {
          content = <PlayingCard faceDown />
        } else if (discardAnim.emptied.has(key)) {
          content = <PlayingCard />
        } else {
          content = <PlayingCard card={oldCard} />   // aún en mano, no ha volado
        }
        return <div key={`ps-${i}`} ref={ref} className="card-slot-wrapper">{content}</div>
      }
      if (inReset) return <div key={`ps-${i}`} ref={ref} className="card-slot-wrapper"><PlayingCard /></div>
      const card    = game.players[0].cards[i]
      const visible = i < visFor(0)
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
                highlight={showdownWinnerSeat === 0 && isWinningCard(card)}
                onClick={isDiscardPhase && !human.folded ? () => setGame(prev => toggleDiscard(prev, i)) : undefined}
              />}
        </div>
      )
    })
  }

  // Layout dinámico de 2 vivos (C4.2.14): el ÚNICO rival superviviente —cualquier
  // asiento (IA1 en mesa nueva, o IA3/IA4 tras quiebras)— se renderiza como espejo
  // del humano en la zona ancha. TODAS las referencias (slotRefs/deckRefs) y los
  // estados (turno/Mano/Pie/ganador) usan el asiento REAL, no el 1 fijo. Sirve por
  // igual a una mesa que arranca en 2 y a una reducida a 2 por bancarrota.
  function renderTwoPlayerRival(seat) {
    const rival = game.players[seat]
    const rivalWon = showdownWinnerSeat === seat
    return (
      <section className={`ai-zone${turnSeat === seat ? ' turn-active' : ''}${turnSeat === 0 ? ' turn-dimmed' : ''}`}>
        <div className="ai-info">
          <span className="ai-label">
            {rival.name}
            {manoSeat === seat && <span className="seat-badge seat-badge-gold">Mano</span>}
            {deckSeat === seat && <span className="seat-badge seat-badge-neutral">Pie</span>}
            {turnSeat === seat && <span className="seat-badge seat-badge-gold">Turno</span>}
            {rivalWon && <span className="win-score-chip">{rival.score.points}</span>}
          </span>
          <span className="ai-chips"><BalanceDisplay chips={rival.chips} /> fichas</span>
        </div>
        <div className="cards-row">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`as-${i}`} ref={slotRefs.current[seat][i]} className={`card-slot-wrapper${rivalWon ? ' card-slot-winner' : ''}`}>
              {renderOpponentCard(seat, i)}
            </div>
          ))}
          <div className="deck-shuffle-wrapper">
            <div
              ref={deckRefs.current[seat]}
              className={`deck-pile${deckSeat !== seat || isClearing ? ' deck-hidden' : ''}`}
            />
            {isShuffling && deckSeat === seat && <ShuffleDeck />}
          </div>
        </div>
        <div className="score-tag" style={{ visibility: isPayoutPhase && !isClearing && !isShuffling && rival.score ? 'visible' : 'hidden' }}>
          {rival.score && <>Mejor palo: <strong>{rival.score.palo}</strong> ({rival.score.points} pts)</>}
        </div>
      </section>
    )
  }

  function renderPanel(seat) {
    return (
      <OpponentPanel
        key={seat}
        player={game.players[seat]}
        seatPos={effLayout[seat]}
        isMano={manoSeat === seat && (phase !== PHASES.WAITING || isShuffling)}
        isPie={deckSeat === seat && (phase !== PHASES.WAITING || isShuffling)}
        isTurn={turnSeat === seat}
        isDimmed={turnSeat !== null && turnSeat !== seat}
        isWinner={showdownWinnerSeat === seat}
        isEliminating={!!ceremony && ceremony.seats.includes(seat)}
        lastAction={lastActions[seat]}
        renderCard={i => renderOpponentCard(seat, i)}
        score={game.players[seat].score}
        showScore={isPayoutPhase && !inReset}
        resetting={inReset}
        slotRefs={slotRefs.current[seat]}
        deckRef={deckRefs.current[seat]}
        showDeck={deckSeat === seat && !isClearing}
        shuffleChildren={isShuffling && deckSeat === seat ? <ShuffleDeck /> : null}
      />
    )
  }

  // Asientos rivales VIVOS en una franja de posiciones (orden visual izq→der)
  function seatsAt(...positions) {
    return livingRivalsInDisplayOrder(game.players).filter(s => positions.includes(effLayout[s]))
  }

  function renderRivalsTopRow() {
    return (
      <section className={`rivals-zone${reflowing ? ' reflow-settle' : ''}`}>
        {seatsAt('top-left', 'top-center', 'top-right').map(renderPanel)}
      </section>
    )
  }

  function renderCenterZone() {
    const centerMsg  = discardMsg ?? game.message
    // El resultado (winner) conserva su estilo win/lose; solo fuera de él
    // estilamos por tipo de acción (Tanda C4.3).
    const actionKind = game.winner !== null ? null : messageActionKind(centerMsg)
    const msgClass = game.winner === 0 ? ' msg-win'
                   : game.winner !== null ? ' msg-lose'
                   : actionKind ? ` msg-action msg-action-${actionKind}` : ''
    return (
      <section className="center-zone">
        <div className="pot-box">
          <span className="pot-label">Pozo</span>
          <strong className={`pot-value${potAnim ? ' pot-value-pulse' : ''}`} key={potAnim ? `pv-${potAnim.id}` : 'pv'}>
            {game.pot}
          </strong>
          {potAnim && <span key={`pf-${potAnim.id}`} className="pot-float">+{potAnim.delta}</span>}
        </div>
        <div className="call-box" style={{ visibility: currentBet > 0 && isBetPhase ? 'visible' : 'hidden' }}>
          <span className="pot-label">A igualar</span>
          <strong className="call-value">{toCall > 0 ? toCall : '—'}</strong>
        </div>
        {/* key cambia solo en acciones → reproduce el pop sin animar mensajes neutros de fase/reparto */}
        <p className={`game-message${msgClass}`} key={actionKind ? centerMsg : 'msg'}>
          {centerMsg}
        </p>
        {/* C4.4: el chip refleja el estado real según jugadores vivos. Solo en
            mesas que pudieron tener comodín (arrancaron en 4+); las de 2-3 no
            muestran nota (regresión preservada). C4.5: destella al cambiar las
            reglas (key=noteFlash remonta → corre la animación una sola vez). */}
        {numPlayers >= 4 && (
          <span
            key={noteFlash}
            className={`comodin-note${noteFlash > 0 ? ' comodin-note-flash' : ''}`}
          >
            {comodinNote}
          </span>
        )}

        {/* C4.5.2: aviso de eliminación — overlay absoluto en una banda HORIZONTAL
            limpia, un poco por debajo de la fila pozo/comodín (espacio libre del
            felt). Así sale horizontal en una sola línea y legible en TODAS las
            reducciones (5→4, 4→3, 3→2), sin apretarse entre pozo y comodín.
            No ocupa flujo ni empuja nada (ley de anclaje). */}
        {elimNotice && (
          <div className="elim-notice" key={elimNotice.id}>{elimNotice.text}</div>
        )}
      </section>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="game-table-screen">
      <section className={`game-table${aliveN >= 4 ? ' table-wide' : ''}${aliveN === 5 ? ' table-five' : ''}${aliveN === 3 ? ' table-three' : ''}`}>

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

        {/* C4.4: GAME_OVER → vista terminal simple (mensaje + salir). Evita
            reconstruir el tablero cuando el propio humano queda eliminado. */}
        {isGameOver ? (
          <div className="game-over-screen">
            <p className="game-over-msg">{game.message}</p>
            <SoundButton className="btn btn-primary" onClick={onLeave}>Salir de la mesa</SoundButton>
          </div>
        ) : (
        <>
        {/* Rivals + Center — el layout sigue SIEMPRE al nº de jugadores VIVOS
            (aliveN), sin importar el tamaño inicial (C4.2.14). La mesa de 2 (sea
            de arranque o reducida por quiebra) usa el espejo dinámico con el
            asiento real del superviviente. */}
        {aliveN === 2 && (
          <>
            {renderTwoPlayerRival(livingRivalsInDisplayOrder(game.players)[0])}
            {renderCenterZone()}
          </>
        )}
        {aliveN === 3 && (
          <>
            {renderRivalsTopRow()}
            {renderCenterZone()}
          </>
        )}
        {aliveN >= 4 && (
          <div className={`table-mid${reflowing ? ' reflow-settle' : ''}`}>
            <div className="side-col side-col-left">{seatsAt('side-left').map(renderPanel)}</div>
            <div className="mid-center">
              {renderRivalsTopRow()}
              {renderCenterZone()}
            </div>
            <div className="side-col side-col-right">{seatsAt('side-right').map(renderPanel)}</div>
          </div>
        )}

        {/* Player Zone — dos pisos (Tanda C3.2): cartas + barra única */}
        <section className={`player-zone${turnSeat === 0 ? ' turn-active' : ''}${turnSeat !== null && turnSeat !== 0 ? ' turn-dimmed' : ''}`}>
          <div className="score-tag score-tag-player" style={{ visibility: isPayoutPhase && !inReset && human.score ? 'visible' : 'hidden' }}>
            {human.score && <>Tu mejor palo: <strong>{human.score.palo}</strong> ({human.score.points} pts)</>}
          </div>

          <div className="cards-row">
            <div className="deck-shuffle-wrapper">
              <div
                ref={deckRefs.current[0]}
                className={`deck-pile${deckSeat !== 0 || isClearing ? ' deck-hidden' : ''}`}
              />
              {isShuffling && deckSeat === 0 && <ShuffleDeck />}
            </div>
            {renderPlayerCards()}
          </div>

          {/* Barra única: Tú+badges (izq) · acciones del turno (centro) · saldo (der) */}
          <div className="player-bar">
            <strong className="player-bar-left">
              Tú
              {manoSeat === 0 && <span className="seat-badge seat-badge-gold">Mano</span>}
              {deckSeat === 0 && <span className="seat-badge seat-badge-neutral">Pie</span>}
              {turnSeat === 0 && <span className="seat-badge seat-badge-gold">Turno</span>}
              {showdownWinnerSeat === 0 && <span className="win-score-chip">{human.score.points}</span>}
            </strong>

            <div className="player-bar-center">
              {phase === PHASES.WAITING && !isShuffling && (
                <div className="action-area">
                  <SoundButton className="btn btn-primary" onClick={beginHand}>
                    Iniciar mano
                  </SoundButton>
                </div>
              )}

              {isShuffling && (
                <div className="action-area thinking">Barajando…</div>
              )}

              {isDealPhase && !isShuffling && (
                <div className="action-area thinking">Repartiendo cartas…</div>
              )}

              {isBetPhase && !humanIsTurn && !game.players[game.activePlayerIndex].folded && (
                <div className="action-area thinking">
                  {numPlayers === 2
                    ? 'La IA está pensando…'
                    : `${game.players[game.activePlayerIndex].name} está pensando…`}
                </div>
              )}

              {isPlayerTurn && (
                <div className="action-area action-col">
                  <div className="mult-row">
                    <div className={`timer-display${timeLeft <= WARNING_AT ? ' timer-warning' : ''}`}>
                      {timeLeft}s
                    </div>
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

              {isBetPhase && human.folded && (
                <div className="action-area thinking">Te retiraste — los rivales siguen jugando…</div>
              )}

              {isDiscardPhase && !discardAnim && !human.folded && (
                <div className="action-area discard-area">
                  <div className={`timer-display${timeLeft <= WARNING_AT ? ' timer-warning' : ''}`}>
                    {timeLeft}s
                  </div>
                  <p className="discard-hint">
                    {game.selectedDiscards.length === 0
                      ? (
                        <>
                          {/* C4.2.6: desktop conserva 1 línea (regresión cero); móvil
                              muestra 2 líneas con salto FIJO para que el mazo horizontal
                              no tape el mensaje. CSS alterna ambas por media query. */}
                          <span className="discard-hint-1l">
                            Pulsa las cartas a descartar (máx. {maxDiscard(aliveN)}) o continúa sin descartar.
                          </span>
                          <span className="discard-hint-2l">
                            Pulsa las cartas a descartar.<br />(máx. {maxDiscard(aliveN)}). Continúa sin descartar.
                          </span>
                        </>
                      )
                      : aliveN === 5
                        ? `${game.selectedDiscards.length} de ${maxDiscard(5)} seleccionada(s).`
                        : `${game.selectedDiscards.length} carta(s) seleccionada(s).`}
                  </p>
                  <SoundButton className="btn btn-primary" onClick={handleDiscard}>
                    {game.selectedDiscards.length > 0 ? `Descartar ${game.selectedDiscards.length}` : 'Sin descartar'}
                  </SoundButton>
                </div>
              )}

              {isDiscardPhase && !discardAnim && human.folded && (
                <div className="action-area thinking">Los rivales descartan…</div>
              )}

              {isDiscardPhase && discardAnim && (
                <div className="action-area thinking">Reponiendo…</div>
              )}

              {/* C4.5: durante la salida digna (ceremony) o el modal de bancarrota
                  no se ofrece "Siguiente mano" — la mesa no continúa. */}
              {isPayoutPhase && !isClearing && !isShuffling && !ceremony && !bankruptModal && (
                <div className="action-area">
                  <SoundButton className="btn btn-primary" onClick={() => {
                    setIsClearing(true)
                    setGame(prev => ({ ...prev, message: '', winner: null }))
                    setTimeout(() => {
                      setIsClearing(false)
                      beginHand()
                    }, 300)
                  }}>
                    Siguiente mano
                  </SoundButton>
                </div>
              )}

              {((isPayoutPhase && isClearing) || ceremony) && (
                <div className="action-area" />
              )}
            </div>

            <span className="player-bar-right">
              <BalanceDisplay chips={human.chips} /> fichas · Mesa {unit}
            </span>
          </div>
        </section>
        </>
        )}

      </section>

      {/* Flying cards overlay */}
      {flyingCards.map(fc => (
        <FlyingCard
          key={fc.id}
          fromX={fc.fromX} fromY={fc.fromY}
          toX={fc.toX}     toY={fc.toY}
          duration={fc.fast ? 0.75 : 0.595}
          onDone={() => {
            setFlyingCards(prev => prev.filter(c => c.id !== fc.id))
            if (fc.isDiscardIn) markRefilled(fc.seat, fc.slotIdx)
            else if (!fc.isDiscardOut) {
              // DEAL_2: la carta del humano se revela boca arriba al aterrizar
              if (phase === PHASES.DEAL_2 && fc.dealSeat === 0 && comodinActive && isComodin(game.players[0].cards[fc.dealCardIndex])) play('comodin')
              setDealStep(s => s + 1)
            }
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

      {/* C4.5 · Caso B — humano sin fichas (≥2 vivos): modal bloqueante y educado.
          La mesa permanece congelada detrás (no se compromete la mano nueva). */}
      {bankruptModal && (
        <div className="bankrupt-overlay">
          <div className="bankrupt-modal">
            <p className="bankrupt-title">Te quedaste sin fichas</p>
            <p className="bankrupt-sub">Necesitas más fichas para seguir jugando.</p>
            <div className="bankrupt-actions">
              <SoundButton className="btn btn-primary" onClick={onLeave}>
                Volver al lobby
              </SoundButton>
              <button className="btn btn-soon" disabled>
                Ver video por fichas
                <span className="soon-tag">Próximamente</span>
              </button>
              <button className="btn btn-soon" disabled>
                Comprar fichas
                <span className="soon-tag">Próximamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
