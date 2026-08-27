import { useState, useEffect, useLayoutEffect, useRef, useCallback, createRef } from 'react'
import '../styles/gameTable.css'
import PlayingCard from './PlayingCard'
import OpponentPanel from './OpponentPanel'
import { SoundButton } from './SoundButton'
import { UtilitiesTrigger, UtilitiesPanel } from './UtilitiesMenu'
import { ReaccionesSelector, ReaccionBurbuja } from './Reacciones'
import { ManoActualPopup } from './ManoActual'
import { TapetesPanel } from './TapetesPanel'
import { CuentaPanel } from './CuentaPanel'
import Bautizo from '../screens/Bautizo'
import { CelebracionMesa, PulsoNombre, AjileiOverlay, PantallaVictoria } from './Celebracion'
import { useCelebracion } from '../hooks/useCelebracion'
import { useSesion } from '../hooks/useSesion'
import { fichasNetas } from '../hooks/sesionCore'
import { decideCelebracion, llevaViaje, VIAJE_N } from '../hooks/celebracionCore'
import { conNivel } from '../hooks/nivelCore'
import { puntosDe } from '../config/niveles'
import { composeResultado, claseTono, vozResto } from '../hooks/resultadoCore'
import { componeCronica } from '../hooks/cronicaCore'
import { siembraCEL } from '../dev/siembraCEL'
import {
  useUtilitiesMenu, anclaSatelite, ALTO_AVISO_MANO, ALTO_TAPETES,
  ALTO_SELECTOR_REACCIONES, ALTO_CUENTA,
} from '../hooks/useUtilitiesMenu'
import { useReacciones } from '../hooks/useReacciones'
import { useConsultas } from '../hooks/useConsultas'
import { useTapetes } from '../hooks/useTapetes'
import { hayManoConsultable, desglosarPalos } from '../hooks/consultasCore'
import { VIVAS_ESCRITORIO, VIVAS_MOVIL, PRESENTES_MOVIL_HORIZONTAL } from '../config/menuEntradas'
import { getBestSuitScore } from '../engine/handEvaluator'
import { useSounds } from '../hooks/useSounds'
import BalanceDisplay from './BalanceDisplay'
import ChipToken from './ChipToken'
import { Wordmark } from './Wordmark'
import { effectiveLayout, livingRivalsInDisplayOrder } from '../config/seatLayouts'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
import {
  PHASES,
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyAIBetAction,
  applyDiscard,
  toggleDiscard,
  // DSK-U0 · `maxDiscard` ya no se importa: la UI no recalcula reglas, las lee
  // del snapshot congelado de la mano (game.handRules). Quitar el import es
  // parte del arreglo — mientras la función esté a mano, el patrón vuelve.
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

// ── Hook de orientación del tablero (Opción A, mesa de 2) ────────────────────
// El CSS no puede elegir QUÉ componente monta React; para el 2 jugadores el rival
// es panel compacto (.opp-panel) en landscape y espejo (.ai-zone) en portrait.
// Este hook decide cuál montar usando EXACTAMENTE la misma media query que el
// bloque landscape de gameTable.css (orientation: landscape) and (max-height:600px)
// → JSX y CSS nunca se desincronizan. Solo un componente se monta por orientación,
// así que las refs (slotRefs/deckRefs) del asiento del rival no se duplican.
const LANDSCAPE_TABLE_MQ = '(orientation: landscape) and (max-height: 600px)'

// V1 · Espejo del anterior para MÓVIL VERTICAL: misma media query que el bloque
// portrait de gameTable.css/opponentPanel.css. Distingue el teléfono en vertical
// del ESCRITORIO (donde isLandscapeTable también es false pero el canje de manos
// debe seguir instantáneo — su CSS de coreografía no existe).
const PORTRAIT_TABLE_MQ = '(max-width: 767px) and (orientation: portrait)'

// DSK-G1 · Espejo POSITIVO del landscape móvil para ESCRITORIO / laptop / tablet
// landscape: misma orientación horizontal, pero altura amplia (min-height:601px)
// que el teléfono horizontal (max-height:600px) nunca alcanza. Gate único sobre
// el que se scopea toda la campaña DSK (bloque homónimo al final de gameTable.css).
// Riesgo aceptado: entre max-height:600px (móvil) y min-height:601px (desktop) hay
// un hueco teórico para alturas fraccionales (600 < h < 601), posible solo con
// zoom del navegador. Caso borde extremo, aceptado por simplicidad del corte.
const DESKTOP_TABLE_MQ = '(orientation: landscape) and (min-height: 601px)'

// R2.b · Tiempos de la coreografía de volteo del intercambio de manos en el
// showdown — casar con las variables --reveal-* de opponentPanel.css.
// Timeline total ≈ 960ms: cerrar (320) → recoger (200, la entrante arranca
// al 60%) → crecer (200) → abrir (320).
const REVEAL_CHOREO = {
  FLIP_MS: 220,     // medio giro de carta (cerrar y abrir)
  STAGGER_MS: 25,   // escalonado entre cartas contiguas
  SCALE_MS: 200,    // recogida 1.6→1 y crecimiento 1→1.6 (solo transform)
  GROW_AT: 0.6,     // la entrante arranca al 60% de la recogida de la saliente
}
function useMediaQueryMatch(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

function useIsLandscapeTable() {
  return useMediaQueryMatch(LANDSCAPE_TABLE_MQ)
}

function useIsPortraitTable() {
  return useMediaQueryMatch(PORTRAIT_TABLE_MQ)
}

// DSK-G1 · Gate de escritorio. Primer consumidor en DSK-P1 (header estático del
// panel IA) → dormancia retirada. Espeja el patrón de sus hooks hermanos.
function useIsDesktopTable() {
  return useMediaQueryMatch(DESKTOP_TABLE_MQ)
}

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

// ── MSG-U1 · La clase del mensaje del centro, en UN solo sitio ───────────────
// Estaba DUPLICADA literal en las dos rutas de render del óvalo (center-zone de
// 3/4/5 y portrait, y two-ovals de mesa 2 landscape). El censo MSG-C0 lo dejó
// anotado como aviso de mantenimiento: cualquier tratamiento nuevo había que
// aplicarlo dos veces o se desincronizaban. Se salda ANTES de tocar nada más.
//
// El interruptor es por FASE Y EMISOR, jamás por regex: si hay resultado
// compuesto manda su tono; sólo cuando NO lo hay se mira el verbo del texto,
// que es la crónica de apuestas y sigue exactamente como estaba (Tanda C4.3).
function claseDelMensaje(resultado, msg) {
  if (resultado) return claseTono(resultado.tono)
  const kind = messageActionKind(msg)
  return kind ? ` msg-action msg-action-${kind}` : ''
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
function FlyingCard({ fromX, fromY, toX, toY, w, h, duration = 0.595, onDone }) {
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
        // w/h opcionales: solo se pasan en 2-landscape (slots 63×98). Si vienen,
        // sobreescriben el tamaño CSS por defecto (var(--card-w), que aquí resuelve
        // al token base por estar la carta fuera de .table-two). En 3/4/5 llegan
        // undefined → la carta conserva su tamaño compacto de CSS.
        ...(w != null && { width: w }),
        ...(h != null && { height: h }),
        transform: moved ? `translate(${toX - fromX}px,${toY - fromY}px)` : 'translate(0,0)',
        transition: moved ? `transform ${duration}s ease-out` : 'none',
      }}
      onTransitionEnd={onDone}
    />
  )
}

// ── GameTable ─────────────────────────────────────────────────────────────────
export default function GameTable({ stake, numPlayers = 2, nivel, onLeave, cuenta }) {
  // NIV-UI · PASAJERO `nivelIA` (rector §2.2, vía C). Se cuelga aquí, en la
  // creación del estado, que es el único punto donde se escribe: nace con la
  // mesa y muere con este componente, así que D-7 —nivel congelado durante toda
  // la mesa— queda satisfecha por construcción, sin maquinaria de congelado.
  // El motor NO lo conoce: lo transporta a ciegas en sus spreads. `conNivel`
  // aplica el default 'basico' ante un nivel ausente o desconocido.
  // En esta tanda `aiPlayer` no lo lee: viaja INERTE, Δ=0 de conducta de juego.
  // ── MSG-U2 · El estado del motor y la CRÓNICA viajan juntos ───────────────
  // Un solo `useState` para los dos y no dos hooks separados, porque la crónica
  // no es un dato independiente: es una función de la TRANSICIÓN (prev → next),
  // y el único sitio donde las dos puntas existen a la vez es dentro del
  // updater. Componerla aquí la deja atómica —nunca hay un render con el estado
  // nuevo y el texto viejo— y deja intactos los diez `setGame(...)` repartidos
  // por el componente, incluidos los de forma funcional: `setGame` conserva su
  // firma exacta y sigue aceptando valor o updater.
  //
  // Lo que esto compra (REN-2): el óvalo ya NO pinta `game.message`. La voz es
  // `cronicaCore` + `resultadoCore`, y con ella la palabra de la moneda vive en
  // presentación — que es como "Apuestas N Heptacoins." se pudo renombrar sin
  // abrir `gameEngine.js`, que está protegido.
  const [motor, setMotor] = useState(() => {
    // CEL-0 · `siembraCEL` es la IDENTIDAD salvo en desarrollo y con `?cel` en
    // la URL; ahí siembra a los rivales sin fichas para que la mesa cierre en
    // el primer "Iniciar mano". No hay rama de render ni condición nueva: lo
    // único que cambia es con cuánto saldo nacen los rivales.
    const inicial = siembraCEL(conNivel(createInitialState(stake, numPlayers), nivel))
    return { game: inicial, cronica: componeCronica(null, inicial) }
  })
  const game    = motor.game
  const cronica = motor.cronica
  const setGame = useCallback((arg) => {
    setMotor(m => {
      const next = typeof arg === 'function' ? arg(m.game) : arg
      if (next === m.game) return m
      return { game: next, cronica: componeCronica(m.game, next) }
    })
  }, [])
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
  const [displayedSeat, setDisplayedSeat] = useState(null) // Reveal Manos: IA elegida por tap (null = ganadora)
  const [shakeSeat,     setShakeSeat]     = useState(null) // Reveal Manos R2: IA cuyo nombre "sacude" ahora
  const [revealAnim,    setRevealAnim]    = useState(null) // R2.b: {fase, from, to} — coreografía de volteo (lock de taps)
  const [openChipSeat,  setOpenChipSeat]  = useState(null) // H4: IA con el toggle de saldo abierto (uno a la vez)
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
  const revealTimersRef = useRef([])
  const chipTimerRef = useRef(null)   // H4: autocierre del toggle de saldo
  const gameRef = useRef(game)
  const prevPotRef = useRef(game.pot)

  // Clear pending discard / ceremony / reveal timers if the table unmounts mid-animation
  useEffect(() => () => {
    discardTimersRef.current.forEach(clearTimeout)
    ceremonyTimersRef.current.forEach(clearTimeout)
    revealTimersRef.current.forEach(clearTimeout)
    clearTimeout(chipTimerRef.current)
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
  // MSG-U1 · El resultado se COMPONE desde el estado, no se hereda del motor.
  // Vale null fuera de PAYOUT/GAME_OVER, y ahí toma el relevo `cronica`
  // (MSG-U2/REN-2): el interruptor sigue siendo la fase, jamás el texto.
  const resultado = composeResultado({
    phase,
    winner: game.winner,
    players: game.players,
    numPlayers: game.numPlayers,
    manoIndex: game.manoIndex,
    ruleN: game.handRules.ruleN,
  })
  const unit         = game.unit
  const humanIsTurn  = game.activePlayerIndex === 0
  const pieSeat      = game.pieIndex
  // C4.4: el tablero sigue a los jugadores VIVOS (no al tamaño inicial)
  const aliveN       = game.aliveCount
  const isLandscapeTable = useIsLandscapeTable()
  const isPortraitTable  = useIsPortraitTable()
  const isDesktopTable   = useIsDesktopTable()   // DSK-P1: header estático del panel IA
  // DSK-U1 · el menú de utilidades sólo existía en el gate de escritorio.
  // MOV-1a · deja de estar gateado: el menú es ahora la ÚNICA cabecera en las
  // dos pieles, así que el hook corre sin gate. Sus tres hermanos (reacciones,
  // consultas, tapetes) SIGUEN gateados: lo que se porta en esta tanda es el
  // envoltorio y la entrada Sonido, no lo que hay detrás (eso es MOV-1b).
  // El cierre por `resize` que el hook ya traía cubre el cambio de orientación
  // sin una línea nueva: girar el teléfono cierra el panel.
  const utilMenu = useUtilitiesMenu()
  // SUP-2b · Cuenta. Dos estados locales y ningún hook nuevo: el panel es un
  // satélite sin memoria (sólo su ancla) y el modal de cambiar nombre es un
  // booleano. Se queda aquí y no sube a un hook de la familia porque no hay nada
  // que decidir —ni persistencia, ni gate, ni enfriamiento—: crear un
  // `useCuenta` para dos `useState` sería ceremonia, no arquitectura.
  const [cuentaAncla, setCuentaAncla] = useState(null)
  const [editandoNombre, setEditandoNombre] = useState(false)
  // El setter va en las dependencias aunque React garantice que es estable: el
  // compilador de React infiere la lista real y con `[]` marca la memoización
  // como no preservable, que en este repo es un error de lint y no un aviso.
  const cerrarCuenta = useCallback(() => setCuentaAncla(null), [setCuentaAncla])
  // DSK-U2 · circuito de reacciones.
  // MOV-1b-c · sin gate: Reacciones se enciende en móvil con la MISMA lógica
  // —una burbuja a la vez, enfriamiento de 5s inmune a la ✕, veto durante la
  // celebración— y sin una línea nueva de estado. Lo que cambia por rama es
  // sólo dónde se pintan sus dos superficies.
  const reacciones = useReacciones()
  // DSK-U3 · "Mano actual". Mismo gate y mismo molde de hermandad: el hook se
  // llama SIEMPRE (orden de hooks estable) y recibe el gate.
  // MOV-1b-a · sin gate: "Mano actual" se enciende en móvil con el MISMO saldo
  // y la MISMA clave que en escritorio — un solo contador de 20 consultas, una
  // por mano. No hay dos economías.
  const consultas = useConsultas()
  // EMB-2 · Tapetes. Mismo gate y mismo molde de hermandad: el hook se llama
  // SIEMPRE (orden de hooks estable) y recibe el gate, así que fuera de
  // escritorio no hay panel, no hay atributo y el fieltro es el verde de
  // siempre — aunque el localStorage traiga otro (v1.0 §4: el panel hereda la
  // cola del puerto móvil del ⋮ junto al resto del menú).
  // MOV-1b-a · sin gate: Tapetes se enciende en móvil. El segundo cinturón que
  // lo sostenía —el bloque gateado de tapetes.css— también se abrió; un sello
  // que sobrevive a su motivo deja al jugador elegir un tapete y no ver nada.
  const tapetes = useTapetes()
  const manoDisponible = hayManoConsultable(phase, game.handCount, human.cards.length)
  // El popup se ancla al ⋮ (el panel ya no existe: cierra al ejecutar) por su
  // borde DERECHO, molde del popup del contador. Se mide en el press, nunca en
  // el render.
  // MOV-1b-a · D6. La regla de colocación de los satélites del ⋮ es una y vive
  // en `anclaSatelite`; aquí sólo se dice a qué disparador se ancla y cuánto
  // mide la superficie en el peor caso.
  const popupAnchorDesdeTrigger = () => anclaSatelite(utilMenu.triggerRect(), ALTO_AVISO_MANO)
  // El valor se deriva EN EL PRESS, del estado vivo, y desde la fuente única —
  // getBestSuitScore con el ruleN CONGELADO de la mano (handRules), jamás con un
  // recuento vivo de jugadores: esa lectura viva es el patrón enfermo que HR-1
  // erradicó. Sólo las cartas propias del humano: cero información oculta.
  // ── DSK-VC2 · Victory Celebration ─────────────────────────────────────────
  // El pozo YA ES 0 cuando PAYOUT pinta: resolveWinner lo vacía y suma las
  // fichas al ganador antes de que la fase se renderice. El viaje es
  // decorativo, así que su magnitud hay que capturarla ANTES — molde prevPotRef
  // (el mismo patrón del "+N" del pozo, aquí guardando el último valor no nulo).
  // Se escribe en un EFECTO, nunca durante el render: escribir un ref mientras
  // se renderiza es el patrón que react-hooks/refs señala con razón.
  const ultimoPozoRef = useRef(0)
  useEffect(() => {
    if (game.pot > 0) ultimoPozoRef.current = game.pot
  }, [game.pot])

  // Geometría medida EN VIVO al disparar, nunca en el render.
  //
  // VIS-3 · ORIGEN Y DESTINO SON MONEDAS, NO CAJAS. Antes se medían `.pot-box` y
  // `.pbr-chips`, que son los CONTENEDORES: el reguero salía del centro del
  // óvalo y aterrizaba en el centro de "N fichas", nunca sobre la Heptacoin. Se
  // baja un nivel, a `.chip-token`, y el vuelo pasa a ir de moneda a moneda.
  //
  // EL DESTINO SE RESUELVE POR IDENTIFICADOR (VIS-3a), no por clase de posición
  // ni por orden DOM: `game.winner` es el índice del motor y `data-coin-target`
  // lleva ese mismo índice. Por eso funciona igual si gana el humano (0) o
  // cualquier IA, y por eso PvP lo heredará sin tocar nada.
  //
  // `lado` es el ANCHO MEDIDO de la moneda destino, y de él sale la escala de
  // llegada. Medido y no escrito, con motivo: en mesa 5 a 1024x600 la moneda del
  // pozo mide 11 px porque el CSS de landscape móvil la achica, mientras su
  // atributo `width` sigue diciendo 24. Un número escrito mentiría ahí.
  const geometriaViaje = useCallback(() => {
    const moneda = (sel) => document.querySelector(`${sel} .chip-token`)
    const origen  = moneda('[data-coin-source="pot"]')
    const destino = moneda(`[data-coin-target="${game.winner}"]`)
    if (!origen || !destino) {
      // No debería ocurrir: VIS-3a midió 1 origen y 1 destino por jugador vivo
      // en las siete celdas. Si ocurriera, NO se vuela y —lo que importa— no se
      // retiene ningún saldo (§Fase 3): sin vuelo no hay nada que diferir.
      console.warn(`[VIS-3] vuelo sin ${origen ? 'destino' : 'origen'}: winner=${game.winner}`)
      return null
    }
    const a = origen.getBoundingClientRect()
    const b = destino.getBoundingClientRect()
    return {
      desde: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
      hasta: { x: b.left + b.width / 2, y: b.top + b.height / 2, lado: b.width },
      fichas: VIAJE_N,
      // VIS-3c · La retención viaja DENTRO de la geometría, y por dos razones.
      // La primera es de higiene: `ultimoPozoRef.current` no puede leerse durante
      // el render —lo dice la nota de arriba y lo señala el linter—, y aquí se
      // lee en un efecto, que es su sitio. La segunda es de exactitud: el pozo y
      // el ganador quedan CONGELADOS en el instante de armar, el mismo en que se
      // miden las monedas, así que la cifra retenida no puede desincronizarse de
      // la que el vuelo está ilustrando.
      pozo: ultimoPozoRef.current,
      winner: game.winner,
    }
  }, [game.winner])

  // VC2b · El asa del sonido del ganador, para que la celebración pueda
  // encadenarse a su final. Se lee con una función estable, nunca durante el
  // render. La llamada a useCelebracion vive MÁS ABAJO, justo detrás del efecto
  // que llena este ref: el orden de declaración de los hooks es el orden en que
  // React vacía sus efectos, y aquí ese orden es portante.
  const showdownAudioRef = useRef(null)
  const precedenteViaje = useCallback(() => showdownAudioRef.current, [])

  const sesion = useSesion({
    phase,
    handCount: game.handCount,
    winner: game.winner,
    humanScore: human.score,
    enPayout: phase === PHASES.PAYOUT,
  })

  const pedirManoActual = () => {
    const desglose = manoDisponible
      ? desglosarPalos(getBestSuitScore(
          human.cards,
          game.handRules.ruleN,
          game.handRules.comodinValue !== null,
        ))
      : null
    consultas.consultar(game.handCount, desglose, popupAnchorDesdeTrigger())
  }
  // AJ-1 · landscape mesas 5 y 4: AJILEI + "Mano #N" bajan de la cabecera a
  // .table-mid. El bloque debe centrarse en la franja IA↔humano, y esa franja se
  // define DENTRO de .table-mid: colgando de ahí, su 50% ya es el de la franja y
  // el centrado sale de la caja, sin constantes de viewport. Desde la cabecera
  // (hermana de .table-mid) era imposible: un absoluto solo resuelve contra un
  // ANCESTRO posicionado. Condicionado porque el <header> es común a las 4 mesas
  // y a las 3 orientaciones — y en mesa 2 portrait no existe .table-mid.
  // U4L-AJ · mesa 4 se suma al espejo (su bloque .table-four .table-brand replica
  // el de .table-five); mesas 3/2 landscape siguen en la rama !brandInMid (header).
  const brandInMid = isLandscapeTable && (aliveN === 5 || aliveN === 4)
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
  // HR-1: MISMA fuente de verdad que el motor. El comodín está activo si y solo
  // si las reglas congeladas de ESTA mano le dieron valor. Antes se derivaba de
  // aliveCount por separado, y regla mostrada y regla aplicada podían divergir.
  const comodinActive = game.handRules.comodinValue !== null
  const isComodin = card => !!card && card.value === 7 && card.palo === 'Oros'
  const discardNextRef = useRef(null)

  // C4.5: texto del chip de comodín (hogar visual del estado de reglas). Cuando
  // cambia al encoger (5→4 cambia el valor; 4→3 se apaga) el chip destella para
  // señalar que cambiaron las reglas, no solo el nº de sillas.
  const comodinNote = game.handRules.comodinValue !== null
    ? `Comodín activo · vale ${game.handRules.comodinValue}`
    : 'Sin comodín'
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
      // Regla universal: la carta viaja al tamaño del DESTINO. Reparto mazo→slot →
      // destino = slot (sr).
      w: sr.width, h: sr.height,
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
  // DSK-VC2: `win` SALE de aquí. La fanfarria genérica de cada mano ganada la
  // sustituye el sonido del nivel que decide la celebración —chipsCollect para
  // una mano, ajileiStrum para un AJILEI—, disparado por useCelebracion junto
  // con su dibujo: fichas que se deslizan y suenan a la vez, no una fanfarria
  // suelta. `showdown` se conserva EXACTO: es el sonido del volteo, no de la
  // victoria, y suena igual gane quien gane. VC2 dejó `win.mp3` en el
  // repositorio sin uso y anotó que borrarlo era otra tanda (v1.0 §7.2): esa
  // tanda fue CEL-A, y el archivo y su entrada de registro ya no están.
  // DSK-VC2b: `showdown` deja de ser sólo un sonido y pasa a ser el PRIMER
  // TIEMPO de la secuencia de victoria — el viaje del pozo arranca en su final.
  // Por eso su asa se guarda: sin el {sound, id} no hay `end` al que engancharse.
  // Se limpia fuera del pago para que ninguna mano herede el asa de la anterior.
  // VIS-3c · `useLayoutEffect`, y NO por gusto: para no romper VC2b.
  // El armado de la celebración pasó a ser un efecto de LAYOUT (para que el
  // primer fotograma de la fase de pago salga ya con las cifras retenidas), y
  // React vacía TODOS los efectos de layout antes que cualquier efecto pasivo.
  // Con este hermano quedándose en `useEffect`, el orden de la nota de abajo se
  // invertía: la celebración se armaba ANTES de que este ref tuviera el asa,
  // `precedente()` devolvía null, la espera daba 0 y el viaje salía EN PARALELO
  // con showdown.mp3 — exactamente la avería que VC2b vino a arreglar.
  // Lo cazó el arnés: `vc·jugado` dio `secuencia=false · espera=1ms` con
  // showdown.mp3 y chips-collect sonando a la vez.
  // Los dos hermanos tienen que ser de la MISMA clase para que su orden de
  // declaración siga mandando. Que el `play()` ocurra antes de pintar no cambia
  // nada: el sonido no espera al fotograma.
  useLayoutEffect(() => {
    if (phase !== PHASES.PAYOUT) { showdownAudioRef.current = null; return }
    const w = game.winner
    const isShowdown = w !== null && game.players[w].score
    showdownAudioRef.current = isShowdown ? play('showdown') : null
  }, [phase]) // eslint-disable-line

  // VC2b · AQUÍ, y no más arriba, por el orden de vaciado de efectos: el efecto
  // de showdown es hermano ANTERIOR, así que cuando el de useCelebracion corre,
  // showdownAudioRef ya trae el asa de ESTA mano. Al revés leería la anterior.
  // CEL-1 · La condición que decidía inline si montaba la tarjeta, con nombre:
  // ahora decide una PANTALLA entera, y una condición sin nombre repetida en un
  // ternario de dos ramas se lee peor. Misma llamada, mismo decisor sellado.
  const esVictoriaDeMesa = isGameOver && decideCelebracion({
    phase, winner: game.winner, humanCards: human.cards, ruleN: game.handRules.ruleN,
  }) === 'partida'

  const celebracion = useCelebracion({
    enabled: true,
    phase,
    winner: game.winner,
    humanCards: human.cards,
    ruleN: game.handRules.ruleN,
    play,
    geometria: geometriaViaje,
    precedente: precedenteViaje,
  })

  // ── DSK-U2c · la celebración aparta a las reacciones (v1.4 §7) ────────────
  // Dos gramáticas de movimiento sobre la misma superficie y a la misma altura;
  // si compiten no se lee ninguna. CERO MAQUINARIA NUEVA: el bloqueo se une al
  // `bloqueado` que ya existe (por el ref para la regla, por prop para la cara
  // visible) y la retirada reutiliza el camino de la ✕ —`cerrarBurbuja` con su
  // guardia de id—, que mata lo visual y deja el cooldown corriendo.
  // SIN COLA, y está razonado: una reacción encolada se dispararía cuando el
  // momento ya pasó, y eso es peor que no decir nada. Mismo criterio que VC §6
  // aplica al corte — no se resucita lo cortado.
  // CEL-0 lo diagnosticó y CEL-1 lo salda: el silencio de VC2 NO cubría la
  // pantalla terminal. `useCelebracion` devuelve pronto para el nivel 'partida'
  // —no lleva vuelo—, así que `celebracion.activa` es null en GAME_OVER y con
  // ella `vcViva` era false: se podía lanzar una reacción encima de la pantalla
  // de victoria, sobre una mesa que ya no existe.
  //
  // Se salda POR LA VÍA QUE YA HABÍA, sin tocar la lógica sellada de VC2 en
  // mano: `vcViva` es el interruptor único del veto —lo leen el `vetar` del
  // hook (la regla), el `bloqueado` del selector (la cara visible) y el
  // `reaccionesBloqueadas` del menú (la entrada `disabled`)—, así que sumarle
  // la fase terminal apaga las tres cosas a la vez y no hay una cuarta puerta
  // que recordar. El efecto hermano que retira la burbuja viva al activarse el
  // veto tampoco cambia: entra en GAME_OVER por la misma dependencia.
  const vcViva = !!celebracion.activa || isGameOver

  // ── VIS-3c · El saldo diferido y el pozo que se vacía al salir la primera ──
  //
  // EL PROBLEMA. El motor liquida en PAYOUT y el pozo YA es 0 cuando la fase de
  // pago pinta (`resolveWinner` lo vacía y suma las fichas al ganador antes de
  // renderizar — VC v1.0 §3.1, y medido: el pozo pasa de "100" a "0" en el mismo
  // instante en que aparece el mensaje de resultado). Así que el dinero llegaba
  // ANTES que las monedas: el número ya había subido cuando el reguero empezaba
  // a volar, y el vuelo ilustraba un movimiento ya ocurrido.
  //
  // LA CORRECCIÓN NO TOCA EL MOTOR, que es archivo protegido. La capa de UI
  // muestra un valor DIFERIDO: mientras el vuelo está vivo, el pozo enseña su
  // cifra y el ganador su saldo previo; cuando aterriza la última moneda, los
  // dos saltan a lo que el motor dice desde hace rato.
  //
  // NO HAY ESTADO NUEVO, y es deliberado. La retención se DERIVA de la
  // celebración, que ya sabe todo lo que hace falta:
  //   · existe          → `celebracion.activa` (null si no se armó);
  //   · vuela           → `llevaViaje(nivel)` (excluye 'partida');
  //   · ya salió la 1ª  → `!esperando` (esperando es la espera a showdown.mp3;
  //                        la capa se monta y las monedas nacen justo al caer).
  // De ahí sale la LIBERACIÓN GARANTIZADA por todas las salidas que pedía la
  // instrucción, sin una línea de más: el aterrizaje de la séptima, el techo de
  // duración, "Siguiente mano", el cambio de fase, el desmontaje y el corte por
  // resize son EXACTAMENTE los seis caminos por los que `activa` vuelve a null
  // —los mismos que VC v1.0 §6 ya sellaba—, y con `activa` en null no hay
  // retención. Un estado paralelo tendría que replicar esos seis caminos y
  // envejecería el día que se añada un séptimo.
  //
  // INVARIANTES. Nunca se muestra menos que `chips - pozo` (se resta el pozo una
  // vez y sólo al ganador). Nunca se retiene sin vuelo (sin `activa` no hay
  // retención, y `geometriaViaje` devuelve null si no encuentra las monedas, con
  // lo que `activa` no llega a armarse). El movimiento reducido no necesita
  // gate: hoy la celebración no lo consulta (Fase 0), así que no hay caso en el
  // que el vuelo se omita y la retención quede colgada.
  const retencion = celebracion.activa && llevaViaje(celebracion.activa.nivel)
    ? { winner: celebracion.activa.winner, pozo: celebracion.activa.pozo, volando: !celebracion.activa.esperando }
    : null
  // El pozo enseña su cifra hasta que sale la primera moneda; en ese instante,
  // 0. Sin volteo la espera es cero, así que las dos cosas pasan en el mismo
  // fotograma y se ve lo de siempre.
  const pozoMostrado = retencion && !retencion.volando ? retencion.pozo : game.pot
  // Sólo el GANADOR retiene, y sólo para pintar: `playerChips` —el que gobierna
  // qué apuestas se pueden hacer— sigue leyendo el valor real del motor.
  const saldoMostrado = (i, chips) => chips - (retencion && retencion.winner === i ? retencion.pozo : 0)

  const burbujaViva = reacciones.activa?.id ?? null
  const retirarBurbuja = reacciones.cerrarBurbuja
  const vetarReacciones = reacciones.vetar
  useEffect(() => {
    vetarReacciones(vcViva)
    if (vcViva && burbujaViva !== null) retirarBurbuja(burbujaViva)
  }, [vcViva, burbujaViva, retirarBurbuja, vetarReacciones])

  // DSK-VC2 · los dos nudillos secos al entrar en la pantalla de victoria de
  // mesa. Vive aparte de useCelebracion a propósito: 'partida' no es un overlay
  // efímero con techo de duración, es una pantalla terminal — no tiene ciclo de
  // vida que gobernar, sólo un sonido de entrada.
  //
  // CEL-2 · EL DISPARO NO CAMBIA. Sigue siendo éste, en este instante y una sola
  // vez: la coreografía no estrena un segundo toc-toc, se ENCADENA a éste. Lo
  // único que se añade es publicar el mando que `play()` ya devolvía desde VC2,
  // para que la pantalla pueda escuchar su `end`.
  // Viaja como GETTER sobre una ref, que es el molde que VC2b ya usa con
  // `precedenteViaje` doce líneas más arriba: la pantalla no lee el sonido al
  // montar —los efectos del hijo corren ANTES que los del padre y lo
  // encontraría vacío— sino en el primer cuadro, cuando el disparo ya ocurrió.
  // Con el sonido apagado `play()` devuelve null y aquí se guarda `{mudo:true}`:
  // el disparo OCURRIÓ igual, sólo que sin nada que oír, y esa distinción es la
  // que deja al arco visual correr con los mismos tiempos.
  const tocPartidaRef = useRef(null)
  const precedenteToc = useCallback(() => tocPartidaRef.current, [])
  useEffect(() => {
    if (phase !== PHASES.GAME_OVER) return
    if (decideCelebracion({ phase, winner: game.winner, humanCards: human.cards, ruleN: game.handRules.ruleN }) !== 'partida') return
    tocPartidaRef.current = play('tableKnock') ?? { mudo: true }
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
      // Regla universal: tamaño del DESTINO. Descarte saliente slot→mazo → destino
      // = mazo (dr).
      w: dr.width, h: dr.height,
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
      // Regla universal: tamaño del DESTINO. Descarte entrante mazo→slot → destino
      // = slot (sr).
      w: sr.width, h: sr.height,
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

  // ── Revelar Manos (spec v1.0) · Tanda R1 ──────────────────────────────────
  // revealedSeat decide qué mano se muestra en grande. Guard autolimpiante:
  // fuera del showdown vale null y displayedSeat se ignora. El efecto de abajo
  // borra el tap al terminar el showdown — sin él, el valor viejo reaparecería
  // en la mano siguiente (spec §6: cada showdown arranca en su ganadora). No
  // toca el onClick de "Siguiente mano".
  const revealedSeat = showdownWinnerSeat === null ? null : (displayedSeat ?? showdownWinnerSeat)

  useEffect(() => {
    if (showdownWinnerSeat !== null) return
    if (displayedSeat !== null) setDisplayedSeat(null)
    if (revealAnim !== null) {   // R2.b: coreografía a medias al salir del showdown
      revealTimersRef.current.forEach(clearTimeout)
      revealTimersRef.current = []
      setRevealAnim(null)
    }
  }, [showdownWinnerSeat, displayedSeat, revealAnim])

  // Elegible al tap: rival vivo que llegó al showdown (la ganadora incluida,
  // para poder volver a ella). R3: mesas 5, 4 y 3 (mesa 2 excluida por spec —
  // solo hay una IA rival, no hay nada que comparar).
  function isRevealEligible(seat) {
    return showdownWinnerSeat !== null && aliveN >= 3 && seat !== 0 &&
      !game.players[seat].folded && !game.players[seat].eliminated
  }

  // R1.c: tap sobre la ya revelada → no-op; sobre otra elegible → se revela esa
  // y la anterior vuelve boca abajo. displayedSeat nunca vuelve a null por tap —
  // el guard autolimpiante (fin del showdown) es el único reset.
  // R2.b: en landscape el canje corre la coreografía de volteo con lock de taps.
  // V1: en móvil vertical la coreografía corre en las mesas con CSS portrait
  // propio (5 desde V1; M4-5 suma la 4 — la carta grande in-flow de IA2 voltea
  // igual y sus cambios de tamaño son corte seco). Mesa 3 portrait y
  // escritorio siguen instantáneos (pendientes de sus propias tandas).
  function handleRevealTap(seat) {
    if (revealAnim !== null) return
    if (revealedSeat === seat) return
    // DSK-R2: la coreografía de volteo también corre en escritorio (mesas 5/4/3;
    // mesa 2 fuera por el gate aliveN). Móvil intacto (isDesktopTable=false ahí).
    // El driver (startRevealSwap) es el mismo; el CSS de las 4 fases se porta al
    // bloque DSK adaptado al modelo de solape de R1 (transforms → Δ=0 sobrevive).
    const runsChoreo = isLandscapeTable || ((isPortraitTable || isDesktopTable) && (aliveN === 5 || aliveN === 4 || aliveN === 3))
    if (!runsChoreo) { setDisplayedSeat(seat); return }
    startRevealSwap(revealedSeat, seat)
  }

  // ── H4 · Toggle flotante del saldo (ficha de esquina, mesa 5 vertical) ─────
  // Prop hermana de handleRevealTap, temporalmente excluyentes: la ficha es
  // no-op en showdown (visible e inerte) y el nombre solo es tappable en
  // showdown. Un toggle a la vez; tap sobre la misma ficha lo cierra; abrir
  // (re)arma el autocierre de ~3s. Patrón de timers de shakeSeat.
  const CHIP_TOGGLE_MS = 3000
  function handleChipTap(seat) {
    if (showdownWinnerSeat !== null) return   // gate: inerte durante el showdown
    clearTimeout(chipTimerRef.current)
    if (openChipSeat === seat) { setOpenChipSeat(null); return }
    setOpenChipSeat(seat)
    chipTimerRef.current = setTimeout(() => setOpenChipSeat(null), CHIP_TOGGLE_MS)
  }

  // Al entrar al showdown, un toggle abierto se cierra solo
  useEffect(() => {
    if (showdownWinnerSeat !== null && openChipSeat !== null) {
      clearTimeout(chipTimerRef.current)
      setOpenChipSeat(null)
    }
  }, [showdownWinnerSeat, openChipSeat])

  // Cierre por tap fuera. Nota: listener no-bloqueante en vez del overlay del
  // leave-overlay — un overlay tragaría el primer tap sobre los botones de
  // acción en plena ronda (el toggle vive DURANTE el juego, no en un modal).
  // El tap fuera cierra Y su acción procede; los taps sobre cualquier ficha
  // los resuelve handleChipTap (por eso se excluyen aquí).
  useEffect(() => {
    if (openChipSeat === null) return
    const onDocDown = (e) => {
      if (e.target.closest && e.target.closest('.opp-corner-chip')) return
      clearTimeout(chipTimerRef.current)
      setOpenChipSeat(null)
    }
    document.addEventListener('pointerdown', onDocDown, true)
    return () => document.removeEventListener('pointerdown', onDocDown, true)
  }, [openChipSeat])

  // R2.b · Timeline del intercambio (patrón setTimeout de startDiscardAnim):
  // cerrar saliente (escalonado) → recoger 1.6→1 → crecer entrante en dorsos
  // (arranca al 60% de la recogida; AQUÍ cambia displayedSeat) → abrir
  // (escalonado). Los canjes dorso/cara ocurren con las cartas de canto (90°).
  // Si ganó el humano y no había rival revelada (from === 0), no hay saliente
  // que cerrar: se entra directo al crecimiento.
  function startRevealSwap(from, to) {
    const { FLIP_MS, STAGGER_MS, SCALE_MS, GROW_AT } = REVEAL_CHOREO
    const flipTotal = FLIP_MS + 4 * STAGGER_MS
    const timers = []
    let t = 0
    if (from !== 0) {
      setRevealAnim({ fase: 'closing', from, to })
      t = flipTotal
      timers.push(setTimeout(() => setRevealAnim({ fase: 'collect', from, to }), t))
      t += Math.round(SCALE_MS * GROW_AT)
      timers.push(setTimeout(() => {
        setRevealAnim({ fase: 'grow', from, to })
        setDisplayedSeat(to)
      }, t))
    } else {
      setRevealAnim({ fase: 'grow', from, to })
      setDisplayedSeat(to)
    }
    t += SCALE_MS
    timers.push(setTimeout(() => setRevealAnim({ fase: 'open', from, to }), t))
    t += flipTotal
    timers.push(setTimeout(() => setRevealAnim(null), t))
    revealTimersRef.current = timers
  }

  // Cara visible por asiento durante la coreografía: la saliente solo mientras
  // cierra; la entrante solo al abrir. Fuera de coreografía manda el protocolo.
  function seatShowsFace(seat) {
    if (revealAnim) {
      if (seat === revealAnim.from) return revealAnim.fase === 'closing'
      if (seat === revealAnim.to)   return revealAnim.fase === 'open'
    }
    return !revealProtocolActive || seat === revealedSeat
  }

  // Clase de coreografía por asiento (nodo raíz del panel). La saliente
  // conserva 'collect' hasta el final: es un estado autosuficiente que sostiene
  // su transición de encogimiento cuando pierde .opp-winner a mitad de camino.
  function revealChoreoClass(seat) {
    if (!revealAnim) return ''
    if (seat === revealAnim.from) return revealAnim.fase === 'closing' ? 'opp-reveal-closing' : 'opp-reveal-collect'
    if (seat === revealAnim.to) {
      if (revealAnim.fase === 'grow') return 'opp-reveal-grow'
      if (revealAnim.fase === 'open') return 'opp-reveal-open'
    }
    return ''
  }

  // R1.c · Protocolo boca abajo: durante el showdown solo UNA mano (la
  // revelada) está boca arriba; las demás finalistas muestran dorsos sólidos
  // (retiradas: dorsos atenuados + "Se retiró", sin cambios). R3: mesas 5-4-3.
  const revealProtocolActive = revealedSeat !== null && aliveN >= 3

  // R2 · Affordance knob-shake: sacude UN nombre a la vez entre las elegibles
  // no reveladas (la ganadora entra cuando no es la revelada; las retiradas
  // nunca), en orden visual izq→der, ~1s de sacudida + ~1.5s de pausa. Se
  // rearma solo al cambiar la revelada (tap) y se limpia al salir del showdown
  // y al desmontar (cleanup del efecto).
  useEffect(() => {
    // revealAnim !== null pausa la rotación durante el volteo (R2.b); al caer
    // a null el efecto se rearma y la sacudida se reanuda con la mano asentada.
    if (showdownWinnerSeat === null || isClearing || aliveN < 3 || revealAnim !== null) return
    const rotation = livingRivalsInDisplayOrder(game.players).filter(s =>
      !game.players[s].folded && !game.players[s].eliminated && s !== revealedSeat)
    if (rotation.length === 0) return
    const SHAKE_MS = 1000, PAUSE_MS = 1500
    const timers = []
    let idx = 0
    const step = () => {
      setShakeSeat(rotation[idx])
      timers.push(setTimeout(() => {
        setShakeSeat(null)
        timers.push(setTimeout(() => {
          idx = (idx + 1) % rotation.length
          step()
        }, PAUSE_MS))
      }, SHAKE_MS))
    }
    timers.push(setTimeout(step, PAUSE_MS))   // respiro inicial tras el reveal
    return () => { timers.forEach(clearTimeout); setShakeSeat(null) }
  }, [showdownWinnerSeat, isClearing, aliveN, revealedSeat, revealAnim, game.players])

  function isWinningCard(card) {
    if (showdownWinnerSeat === null) return false
    const score = game.players[showdownWinnerSeat].score
    if (card.palo === score.palo) return true
    // HR-1: el comodín cuenta para el palo ganador si y solo si las reglas
    // congeladas de esta mano lo activaron (misma fuente que el motor).
    return game.handRules.comodinValue !== null && card.palo === 'Oros' && card.value === 7
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
      const text = `${next.eliminatedNames.join(', ')} ${next.eliminatedNames.length === 1 ? 'se quedó' : 'se quedaron'} sin Heptacoins · la mesa ahora es de ${next.aliveCount}`
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
        faceDown={!isPayoutPhase || folded || !seatShowsFace(seat)}
        highlight={seat === showdownWinnerSeat && revealedSeat === showdownWinnerSeat && isWinningCard(card)}
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
      <section className={`ai-zone${turnSeat === seat ? ' turn-active' : ''}${turnSeat === 0 ? ' turn-dimmed' : ''}${openChipSeat === seat ? ' chip-open' : ''}`}>
        {/* M2-1 · Header rediseñado SOLO portrait (este render legacy también
            sirve al escritorio, que conserva palabra completa y línea de
            saldo): badges a letra única (patrón seat-badge-letter de 3/4/5) y
            la línea .ai-chips se desmonta — su reemplazo (ficha de esquina
            con toggle) llega en M2-2. */}
        <div className="ai-info">
          {/* M2-5 · Réplica del patrón H2: nombre y grupo de badges en spans
              propios (.ai-name / .ai-header-anchor). Son inline transparentes
              en escritorio (cero cambio); solo el CSS .table-two portrait los
              vuelve fila flex con nombre-izquierda (ellipsis) y anclaje del
              badge al extremo derecho. */}
          <span className="ai-label">
            <span className="ai-name">{rival.name}</span>
            <span className="ai-header-anchor">
              {/* DSK-P1 (cierre mesa 2): la vía legacy .ai-zone también va a inicial
                  en escritorio. rivalLetter = portrait || desktop → móvil intacto
                  (portrait ya usaba letra; desktop pasa de palabra a inicial). */}
              {manoSeat === seat && <span className={`seat-badge seat-badge-gold${(isPortraitTable || isDesktopTable) ? ' seat-badge-letter' : ''}`}>{(isPortraitTable || isDesktopTable) ? 'M' : 'Mano'}</span>}
              {deckSeat === seat && <span className={`seat-badge seat-badge-neutral${(isPortraitTable || isDesktopTable) ? ' seat-badge-letter' : ''}`}>{(isPortraitTable || isDesktopTable) ? 'P' : 'Pie'}</span>}
              {/* TURNO: móvil conserva render condicional; escritorio reserva el slot
                  (visibility) para que su toggle no mueva nombre ni badges (O1). */}
              {!isDesktopTable && turnSeat === seat && <span className={`seat-badge seat-badge-gold${isPortraitTable ? ' seat-badge-letter' : ''}`}>{isPortraitTable ? 'T' : 'Turno'}</span>}
              {isDesktopTable && <span className="seat-badge seat-badge-gold seat-badge-letter" style={{ visibility: turnSeat === seat ? 'visible' : 'hidden' }}>T</span>}
              {rivalWon && <span className="win-score-chip">{rival.score.points}</span>}
            </span>
          </span>
          {/* DSK-P2: escritorio también desmonta el saldo inline (lo sustituye la
              ficha). Móvil intacto (portrait ya lo desmontaba; landscape usa opp-panel). */}
          {/* VIS-3a · destino por la vía legacy .ai-zone, saldo inline. El censo de
              Fase 0 no lo encontró montado en ninguna de las 11 celdas medidas
              (cornerChip lo sustituye en portrait, landscape y escritorio); se
              etiqueta igual para que el contrato no dependa de qué rama gane. */}
          {!isPortraitTable && !isDesktopTable && <span className="ai-chips" data-coin-target={seat}><BalanceDisplay chips={saldoMostrado(seat, rival.chips)} size="compact" /> Heptacoins</span>}
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
              className={`deck-pile${deckSeat !== seat || isClearing || isPayoutPhase ? ' deck-hidden' : ''}`}
            />
            {isShuffling && deckSeat === seat && <ShuffleDeck />}
          </div>
        </div>
        <div className="score-tag" style={{ visibility: isPayoutPhase && !isClearing && !isShuffling && rival.score ? 'visible' : 'hidden' }}>
          {/* MSG-U1b · voz de la casa, igual que el mensaje del óvalo y que
              Mano actual. La cola sale de vozResto para no reescribir el
              formato en cada JSX — así nacieron las dos voces. */}
          {rival.score && <>Mejor palo: <strong>{rival.score.palo}</strong>{vozResto(rival.score)}</>}
        </div>
        {/* M2-3 · Renglón de palabras de acción — SOLO portrait (antes las
            acciones de la IA solo se narraban en el .game-message del óvalo).
            Mismas clases y lógica de contenido que el opp-status de 3/4/5
            (Pensando…/acción/Se retiró; en blanco durante el reset Y durante
            el payout, cuando el .score-tag ocupa la misma franja centrada).
            Absoluto y centrado vía CSS .table-two; con el chip abierto cede
            el renglón al saldo (clase chip-open en la sección). */}
        {(isPortraitTable || isDesktopTable) && (
          <span className={`opp-status${turnSeat === seat ? ' opp-status-turn' : ''}`}>
            {inReset || (isPayoutPhase && rival.score)
              ? ' '
              : rival.folded
                ? 'Se retiró'
                : turnSeat === seat
                  ? 'Pensando…'
                  : (lastActions[seat] ?? ' ')}
          </span>
        )}
        {/* M2-2 · Ficha de esquina (reemplazo consultable del saldo desmontado
            en M2-1) — SOLO portrait; mismas clases y lógica agnóstica que
            3/4/5 (handleChipTap/openChipSeat con el seat REAL del rival, el
            tap-fuera ya excluye .opp-corner-chip). El CSS de posicionamiento
            vive scopeado a .table-two (ancla a .ai-zone, relative en M2-2). */}
        {/* VIS-3a · destino de la IA por la vía legacy .ai-zone (mesa 2): el
            atributo lleva el índice del MOTOR, que aquí es `seat` — el mismo con
            el que ya se llama a handleChipTap. */}
        {(isPortraitTable || isDesktopTable) && (
          <span className="opp-corner-chip" data-coin-target={seat} onClick={() => handleChipTap(seat)}>
            <ChipToken size="icon" />
            {openChipSeat === seat && (
              <span className="chip-balance-float">{saldoMostrado(seat, rival.chips)}</span>
            )}
          </span>
        )}
      </section>
    )
  }

  function renderPanel(seat) {
    return (
      <OpponentPanel
        key={seat}
        player={game.players[seat]}
        // VIS-3a · el índice del MOTOR, que aquí ya se tiene: `seat` es el mismo
        // que indexa game.players y el mismo que devuelve game.winner. No hace
        // falta derivarlo por nombre (ARN-2) porque no se ha perdido.
        playerIndex={seat}
        // VIS-3c · el saldo a pintar. GameTable es quien conoce la celebración,
        // así que la retención se calcula aquí y el panel sólo la obedece.
        chipsMostrados={saldoMostrado(seat, game.players[seat].chips)}
        seatPos={effLayout[seat]}
        isMano={manoSeat === seat && (phase !== PHASES.WAITING || isShuffling)}
        isPie={deckSeat === seat && (phase !== PHASES.WAITING || isShuffling)}
        isTurn={turnSeat === seat}
        isDimmed={turnSeat !== null && turnSeat !== seat}
        isWinner={revealedSeat === seat}
        isRevealEligible={isRevealEligible(seat)}
        onNameTap={() => handleRevealTap(seat)}
        isNameShaking={shakeSeat === seat}
        revealAnimClass={revealChoreoClass(seat)}
        isEliminating={!!ceremony && ceremony.seats.includes(seat)}
        letterBadges={(isPortraitTable && (aliveN === 5 || aliveN === 4 || aliveN === 3)) || (isLandscapeTable && (aliveN === 5 || aliveN === 4 || aliveN === 3 || aliveN === 2))}
        cornerChip={(isPortraitTable && (aliveN === 5 || aliveN === 4 || aliveN === 3)) || (isLandscapeTable && (aliveN === 5 || aliveN === 4 || aliveN === 3 || aliveN === 2)) || isDesktopTable}
        desktopHeader={isDesktopTable}
        inShowdown={showdownWinnerSeat !== null}
        isChipOpen={openChipSeat === seat}
        onChipTap={() => handleChipTap(seat)}
        lastAction={lastActions[seat]}
        renderCard={i => renderOpponentCard(seat, i)}
        score={game.players[seat].score}
        showScore={isPayoutPhase && !inReset}
        resetting={inReset}
        slotRefs={slotRefs.current[seat]}
        deckRef={deckRefs.current[seat]}
        showDeck={deckSeat === seat && !isClearing && !isPayoutPhase}
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

  // AJ-1 · AJILEI + "Mano #N" — fuente ÚNICA, montada en la cabecera o dentro de
  // .table-mid según brandInMid. El markup es idéntico en ambos sitios: solo cambia
  // el padre, que es lo que decide contra qué caja se centran.
  // CEL-2e · `conMarca` lo apaga en la pantalla de victoria. El rótulo de mano
  // se queda —es información de la partida, no adorno—; lo que se va es el
  // wordmark pequeño de la esquina, que en una pantalla que ya enseña AJILEI en
  // grande lo dice dos veces.
  function renderBrand(conMarca = true) {
    return (
      <>
        {conMarca && <h1 className="table-title" aria-label="AJILEI"><Wordmark /></h1>}
        <div className="header-center">
          <span className="hand-badge" style={{ visibility: game.handCount > 0 ? 'visible' : 'hidden' }}>
            Mano #{game.handCount > 0 ? game.handCount : '—'}
          </span>
        </div>
      </>
    )
  }

  function renderCenterZone() {
    // MSG-U1/MSG-U2 · en resultado manda `resultadoCore`; fuera de él, la
    // crónica compuesta por `cronicaCore` con su estilo por tipo de acción
    // (Tanda C4.3). Una sola función de clase para las dos rutas — el aviso del
    // censo, saldado. Ninguna de las dos ramas lee ya `game.message`.
    const centerMsg  = resultado ? resultado.texto : (discardMsg ?? cronica)
    const actionKind = resultado ? null : messageActionKind(centerMsg)
    const msgClass   = claseDelMensaje(resultado, centerMsg)
    return (
      <section className="center-zone">
        {/* C4.5.2: mientras hay aviso de reducción, REEMPLAZA el contenido del óvalo
            (pozo/estado/comodín) por el aviso EN FLUJO, centrado y con wrap. Al
            limpiarse elimNotice (lo hace runEliminationCeremony tras ELIM_NOTICE_MS),
            el contenido normal reaparece solo. */}
        {!elimNotice && (
          <>
            {/* VIS-3a · ORIGEN del vuelo de monedas. El atributo es el contrato:
                el vuelo resuelve `[data-coin-source="pot"] .chip-token` y sale del
                CENTRO DE LA MONEDA, no de la caja del óvalo. Hay dos `.pot-box` en
                este archivo —éste y el de renderTwoOvalsZone— porque son rutas
                alternativas de la misma zona; nunca coexisten (censo de Fase 0:
                exactamente 1 en las 11 celdas medidas), así que los dos lo llevan
                y el selector sigue devolviendo una sola moneda. */}
            <div className="pot-box" data-coin-source="pot">
              <span className="pot-label">Pozo</span>
              <strong className={`pot-value${potAnim ? ' pot-value-pulse' : ''}`} key={potAnim ? `pv-${potAnim.id}` : 'pv'}>
                <ChipToken size="compact" />
                {pozoMostrado}
              </strong>
              {potAnim && <span key={`pf-${potAnim.id}`} className="pot-float">+{potAnim.delta}</span>}
            </div>
            <div className="call-box" style={{ visibility: currentBet > 0 && isBetPhase ? 'visible' : 'hidden' }}>
              <span className="pot-label">A igualar</span>
              <strong className="call-value">{toCall > 0 ? toCall : '—'}</strong>
            </div>
            {/* key cambia solo en acciones → reproduce el pop sin animar mensajes neutros de fase/reparto */}
            {/* data-tono: afidávit para el arnés (molde U3). No pinta nada — un
                atributo no mueve un píxel — y permite verificar que el color
                aplicado y el tono compuesto son el mismo hecho, sin leer prosa. */}
            <p className={`game-message${msgClass}`} data-tono={resultado?.tono ?? ''} key={actionKind ? centerMsg : 'msg'}>
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
          </>
        )}

        {/* Aviso de reducción EN FLUJO dentro del óvalo (variante .elim-notice-inline,
            sin position:absolute): centrado, envuelve y se adapta al ancho. Reemplaza
            el contenido de arriba mientras está activo. */}
        {elimNotice && (
          <div className="elim-notice-inline" key={elimNotice.id}>{elimNotice.text}</div>
        )}
      </section>
    )
  }

  // Mesa de 2 · LANDSCAPE — el óvalo único se parte en DOS óvalos anclados en la
  // franja baja del área de la IA: IZQUIERDO = POZO (+ "A igualar"), DERECHO =
  // mensaje de estado adaptado en vertical. Reutiliza las MISMAS clases internas
  // (.pot-box/.pot-label/.pot-value/.pot-float/.call-box/.game-message + sus
  // modificadores) para heredar el estilo existente; solo cambia el contenedor.
  // No incluye .comodin-note (no aplica al 2: guardado por numPlayers>=4) ni
  // .elim-notice (no se renderiza en el 2). Portrait y 3/4/5 siguen en center-zone.
  function renderTwoOvalsZone() {
    // MSG-U1 · misma composición y misma función de clase que center-zone: esta
    // ruta sólo existe en mesa 2 landscape móvil, y la voz es una sola en todo
    // el juego (alcance multiplataforma deliberado, v1.0 §4).
    const centerMsg  = resultado ? resultado.texto : (discardMsg ?? cronica)
    const actionKind = resultado ? null : messageActionKind(centerMsg)
    const msgClass   = claseDelMensaje(resultado, centerMsg)
    return (
      <div className="two-ovals">
        <section className="felt-oval oval-left">
          {/* VIS-3a · el mismo origen por la vía de los dos óvalos (mesa 2
              landscape móvil). Ver la nota de renderCenterZone. */}
          <div className="pot-box" data-coin-source="pot">
            <span className="pot-label">Pozo</span>
            <strong className={`pot-value${potAnim ? ' pot-value-pulse' : ''}`} key={potAnim ? `pv-${potAnim.id}` : 'pv'}>
              <ChipToken size="compact" />
              {pozoMostrado}
            </strong>
            {potAnim && <span key={`pf-${potAnim.id}`} className="pot-float">+{potAnim.delta}</span>}
          </div>
          <div className="call-box" style={{ visibility: currentBet > 0 && isBetPhase ? 'visible' : 'hidden' }}>
            <span className="pot-label">A igualar</span>
            <strong className="call-value">{toCall > 0 ? toCall : '—'}</strong>
          </div>
        </section>
        <section className="felt-oval oval-right">
          <p className={`game-message${msgClass}`} data-tono={resultado?.tono ?? ''} key={actionKind ? centerMsg : 'msg'}>
            {centerMsg}
          </p>
        </section>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  // EMB-2 · el tapete NO entra por aquí: `useTapetes` pone `data-tapete` en
  // `body` mientras la mesa vive, y styles/tapetes.css redefine desde ahí los
  // tokens de fieltro (`--green-*`, `--surface-game`). El porqué del `body` —el
  // vacío de ~400px por lado que deja `#root` a 1920— está en el hook. Este
  // árbol queda intacto: ni una clase, ni un atributo, ni una caja.
  return (
    <main className="game-table-screen">
      <section className={`game-table${aliveN >= 4 ? ' table-wide' : ''}${aliveN === 5 ? ' table-five' : ''}${aliveN === 4 ? ' table-four' : ''}${aliveN === 3 ? ' table-three' : ''}${aliveN === 2 ? ' table-two' : ''}`}>

        <header className="table-header">
          {/* AJ-1 · en landscape mesa 5 este bloque se monta dentro de .table-mid
              (ver brandInMid); en cualquier otro caso vive aquí, como siempre. */}
          {!brandInMid && renderBrand(!isGameOver)}
          <div className="header-right">
            {/* DSK-U1 · escritorio: la bocina se muda DENTRO del menú y su caja
                pasa a ser el disparador ⋮.
                MOV-1a · móvil hace lo mismo. Mismo contenedor y mismo orden en
                el DOM que la bocina que releva —el disparador conserva su clase
                `.mute-button`, así que TODAS las reglas de posición por celda de
                gameTable.css (flujo en la cabecera, absoluto al flanco del óvalo
                en mesas 5/4 horizontales, 32×28 en mesa 2 horizontal) le siguen
                aplicando sin tocar esa hoja, que es protegida. */}
            {/* CEL-2e · el ⋮ no se monta en la pantalla de victoria. No se
                oculta con CSS: se QUITA del árbol, que es la única forma de que
                tampoco sea enfocable con el teclado. Lo que había dentro
                —reacciones, tapetes, consultas— no tiene sentido sobre una mesa
                que ya terminó, y las burbujas seguían vetadas desde CEL-1.
                Sólo en GAME_OVER: durante el juego, la cabecera es la de
                siempre, y eso lo prueba el control negativo del arnés. */}
            {!isGameOver && (
              <UtilitiesTrigger open={utilMenu.open} onToggle={utilMenu.toggle} registerTrigger={utilMenu.registerTrigger} />
            )}
            <SoundButton className="btn-leave" onClick={() => setConfirmLeave(true)} title="Abandonar mesa">✕</SoundButton>
          </div>
        </header>

        {/* C4.4: GAME_OVER → vista terminal simple. Evita reconstruir el
            tablero cuando el propio humano queda eliminado.
            CEL-1 · La VICTORIA se separa en su propia pantalla (`PantallaVictoria`,
            clases `cel-*`, hoja `celebracion.css`). La DERROTA se queda
            exactamente como estaba, con `.game-over-screen` y su mensaje: la
            frase y la lámina son del ganador. Las dos ramas son excluyentes, así
            que la de derrota no hereda una sola regla de la nueva. */}
        {isGameOver ? (
          esVictoriaDeMesa ? (
            <PantallaVictoria
              sesion={sesion}
              netas={fichasNetas(human.chips)}
              saldo={human.chips}
              puntos={sesion.manosGanadas * puntosDe(game.nivelIA)}
              precedente={precedenteToc}
              onLeave={onLeave}
            />
          ) : (
          <div className="game-over-screen">
            {/* MSG-U1 · el TEXTO sale del compositor, no del motor; desde
                REN-2 tampoco el de la rama sin resultado (`cronica`).
                Lo que cambia es el tono: el oro de marca queda RESERVADO a la
                victoria; la derrota pasa a neutro sobrio. Antes las dos se
                pintaban en el mismo oro, sin consultar winner para nada. */}
            <p
              className={`game-over-msg${resultado?.tono === 'neutro' ? ' game-over-msg-neutro' : ''}`}
              data-tono={resultado?.tono ?? ''}
            >
              {resultado ? resultado.texto : cronica}
            </p>
            <SoundButton className="btn btn-primary" onClick={onLeave}>Salir de la mesa</SoundButton>
          </div>
          )
        ) : (
        <>
        {/* Rivals + Center — el layout sigue SIEMPRE al nº de jugadores VIVOS
            (aliveN), sin importar el tamaño inicial (C4.2.14). La mesa de 2 (sea
            de arranque o reducida por quiebra) usa el espejo dinámico con el
            asiento real del superviviente. */}
        {/* Mesa de 2 · PORTRAIT — espejo legacy (.ai-zone), INTACTO. El hook de
            orientación garantiza que solo este branch monte en vertical → las refs
            del rival no se duplican con el panel compacto de landscape. */}
        {aliveN === 2 && !isLandscapeTable && (
          <>
            {renderTwoPlayerRival(livingRivalsInDisplayOrder(game.players)[0])}
            {renderCenterZone()}
          </>
        )}
        {/* Mesa de 2 · LANDSCAPE — panel compacto (.opp-panel) dentro del esqueleto
            .table-mid, igual que 3/4/5. El rival único cae en 'top-center'
            (seatLayouts) → renderRivalsTopRow lo pinta. Override de 1 IA en CSS. */}
        {aliveN === 2 && isLandscapeTable && (
          <div className={`table-mid${reflowing ? ' reflow-settle' : ''}`}>
            <div className="side-col side-col-left">{seatsAt('side-left').map(renderPanel)}</div>
            <div className="mid-center">
              {renderRivalsTopRow()}
              {renderTwoOvalsZone()}
            </div>
            <div className="side-col side-col-right">{seatsAt('side-right').map(renderPanel)}</div>
          </div>
        )}
        {aliveN >= 3 && (
          <div className={`table-mid${reflowing ? ' reflow-settle' : ''}`}>
            {/* AJ-1 · absoluto (lo saca .table-brand en CSS) → NO es ítem del grid
                y no desplaza a ninguna IA. Solo monta en landscape mesa 5. */}
            {brandInMid && <div className="table-brand">{renderBrand()}</div>}
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
            {human.score && <>Tu mejor palo: <strong>{human.score.palo}</strong>{vozResto(human.score)}</>}
          </div>

          <div className="cards-row">
            <div className="deck-shuffle-wrapper">
              <div
                ref={deckRefs.current[0]}
                className={`deck-pile${deckSeat !== 0 || isClearing || isPayoutPhase ? ' deck-hidden' : ''}`}
              />
              {isShuffling && deckSeat === 0 && <ShuffleDeck />}
            </div>
            {renderPlayerCards()}
          </div>

          {/* Barra única: Tú+badges (izq) · acciones del turno (centro) · saldo (der) */}
          <div className="player-bar">
            <strong className="player-bar-left">
              {/* Orden DOM conservado → escritorio sigue en línea ("Tú Mano Pie
                  Turno"). El grid de gameTable.css recoloca por orientación:
                  · portrait  → .pbr-tags (Mano/Pie) ENCIMA del nombre, Turno al lado;
                  · landscape → TODO el grupo .pbr-badges (Mano/Pie/Turno) debajo de
                                "Mesa N", al fondo del rail izquierdo;
                  · escritorio (DSK-H1) → nombre ARRIBA con reserva 12ch y las tres
                                pastillas en la fila de abajo, palabra completa.
                  Ambos aplanan los wrappers con display:contents (ver CSS). */}
              <span className="pbr-name">
                Tú
                {/* DSK-VC2 · el pulso dorado vive en un hermano PROPIO dentro del
                    nombre: absoluto y pointer-events:none, así que no toca la
                    caja de 12ch ni el layout (Δ=0), y no comparte la
                    abreviatura `animation` con .player-zone, donde vive
                    turnBreath. */}
                <PulsoNombre activa={celebracion.activa} />
              </span>
              <span className="pbr-badges">
                <span className="pbr-tags">
                  {manoSeat === 0 && <span className="seat-badge seat-badge-gold">Mano</span>}
                  {deckSeat === 0 && <span className="seat-badge seat-badge-neutral">Pie</span>}
                </span>
                {/* DSK-H1 · doctrina O1: en escritorio el slot de TURNO se RESERVA
                    siempre y solo cambia su visibility → entrar o salir del turno no
                    mueve el nombre, la pastilla de rol ni nada del área. Espeja el
                    patrón que P1 ya aplicó al header de la IA (línea ~1013). Fuera
                    del gate el badge sigue montándose/desmontándose: móvil idéntico. */}
                {!isDesktopTable && turnSeat === 0 && <span className="seat-badge seat-badge-gold badge-turno">Turno</span>}
                {isDesktopTable && (
                  <span className="seat-badge seat-badge-gold badge-turno" style={{ visibility: turnSeat === 0 ? 'visible' : 'hidden' }}>Turno</span>
                )}
              </span>
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

              {isBetPhase && !humanIsTurn && !human.folded && !game.players[game.activePlayerIndex].folded && (
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
                  {/* DSK-U0 · HR-1 en la capa de presentación. El tope se lee del
                      SNAPSHOT congelado (game.handRules), la misma y única fuente
                      que ya consumen applyDiscard y toggleDiscard. Antes se
                      recalculaba con `maxDiscard(aliveN)` y con un literal `5`: es
                      el patrón que HR-1 erradicó del motor, sobreviviendo aquí.
                      Hoy coinciden —`aliveCount` y `handRules` se escriben juntos y
                      sólo en startHand, así que no pueden divergir dentro de una
                      mano—, o sea que el Δ visible es CERO; lo que se quita es la
                      dependencia de esa coincidencia. El día que algo escriba
                      aliveCount a mitad de mano, el aviso ya no mentirá. */}
                  <p className="discard-hint">
                    {game.selectedDiscards.length === 0
                      ? (
                        <>
                          {/* C4.2.6: desktop conserva 1 línea (regresión cero); móvil
                              muestra 2 líneas con salto FIJO para que el mazo horizontal
                              no tape el mensaje. CSS alterna ambas por media query. */}
                          <span className="discard-hint-1l">
                            Pulsa las cartas a descartar (máx. {game.handRules.maxDiscard}) o continúa sin descartar.
                          </span>
                          <span className="discard-hint-2l">
                            Pulsa las cartas a descartar.<br />(máx. {game.handRules.maxDiscard}). Continúa sin descartar.
                          </span>
                        </>
                      )
                      /* El denominador sólo aporta cuando el tope RESTRINGE de
                         verdad (mesa de 5 → 3 de 5 cartas). El gate también sale
                         del snapshot: con `aliveN === 5` la frase dependía del
                         recuento vivo, no de las reglas de la mano. */
                      : game.handRules.maxDiscard < AJILEI_CONFIG.game.handSize
                        ? `${game.selectedDiscards.length} de ${game.handRules.maxDiscard} seleccionada(s).`
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
              {/* HU-1: la palabra va en un span propio SOLO para poder ocultarla por CSS
                  en portrait 4/5 (.table-wide); el espaciado lo da el gap del inline-flex,
                  así que el span no cambia nada en el resto de mesas/orientaciones. */}
              {/* VIS-3a · DESTINO del vuelo cuando gana el humano. El índice es el
                  del MOTOR (0 = humano), el mismo que `game.winner`, nunca una
                  posición ni un orden DOM. */}
              <span className="pbr-chips" data-coin-target="0"><BalanceDisplay chips={saldoMostrado(0, human.chips)} size="full" /> <span className="pbr-fichas-word">Heptacoins</span></span>
              <span className="pbr-sep"> · </span>
              <span className="pbr-mesa">Mesa {unit}</span>
            </span>

            {/* C5.4 landscape: cronómetro "espejo" en el rail izquierdo del humano.
                Oculto por defecto (.ls-timer { display:none }) → portrait/escritorio
                sin cambios; visible solo en el grid landscape .table-wide. Misma
                fuente (timeLeft); el cronómetro del área de acción se oculta por CSS. */}
            {(isPlayerTurn || isDiscardTimerActive) && (
              <div className={`ls-timer timer-display${timeLeft <= WARNING_AT ? ' timer-warning' : ''}`}>
                {timeLeft}s
              </div>
            )}
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
          w={fc.w}         h={fc.h}
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

      {/* DSK-U1 · panel del menú de utilidades. Vive AQUÍ, hermano del área y
          vecino de las voladoras, no dentro de la cabecera: fuera de flujo
          estricto y `fixed` sobre el viewport (ningún ancestro con transform),
          así que ni empuja ni lo recorta el scroller. */}
      {/* MOV-1a · el panel monta en las dos pieles. `soloSonido` deja vivas
          Sonido y nada más: Reacciones, Tapetes y Mano actual salen en gris con
          el tratamiento exacto de Saldo (`is-disabled` + `disabled`) porque sus
          hooks y sus superficies siguen gateados a escritorio. Se encienden en
          MOV-1b; hasta entonces la geometría del panel es la misma para que el
          puerto no cambie de forma dos veces.
          SUP-2b · esa geometría pasa a 64×288: seis filas de 44 desde que
          "Cuenta" entra en las dos listas de vivas. El alto no lo declara
          ninguna de las dos hojas —sólo el ancho—, así que la fila se pinta sola
          y `gameTable.css` no se abre; el espejo que sí se mueve es `PANEL_H`. */}
      <UtilitiesPanel
        anchor={utilMenu.anchor}
        onClose={utilMenu.close}
        // MOV-1b-c · en móvil el selector es el TERCER satélite del ⋮ y su
        // ancla la pone D6, con la pinza contra los filos vivos. En escritorio
        // se sigue pasando sólo el rect y el hook aplica la fórmula de siempre:
        // la rama se escribe aquí, y no dentro de `anclaSatelite`, porque el
        // selector de escritorio mide 198 de alto contra los 186 de la lista y
        // una pinza pensada para el móvil podría moverlo. Δ=0 por construcción.
        onReacciones={() => reacciones.abrirSelector(
          utilMenu.triggerRect(),
          isDesktopTable ? null : anclaSatelite(utilMenu.triggerRect(), ALTO_SELECTOR_REACCIONES),
        )}
        reaccionesBloqueadas={reacciones.bloqueado || vcViva}
        consultas={consultas.saldo}
        manoDisponible={manoDisponible}
        onManoActual={pedirManoActual}
        onTapetes={() => tapetes.abrir(anclaSatelite(utilMenu.triggerRect(), ALTO_TAPETES))}
        onCuenta={() => setCuentaAncla(anclaSatelite(utilMenu.triggerRect(), ALTO_CUENTA))}
        vivas={isDesktopTable ? VIVAS_ESCRITORIO : VIVAS_MOVIL}
        // El CSS no puede elegir QUÉ componente monta React —la doctrina que
        // abre este archivo en su hook de orientación—, así que la ausencia de
        // "Cuenta" en móvil horizontal se decide aquí, con la MISMA media query
        // que usa el bloque landscape de las hojas. `undefined` = montan todas.
        presentes={isLandscapeTable ? PRESENTES_MOVIL_HORIZONTAL : undefined}
      />

      {/* SUP-2b · panel de Cuenta. Vive AQUÍ por la misma razón que sus tres
          hermanos: la entrada del ⋮ cierra al ejecutar, así que cuando esto se
          pinta el panel de utilidades ya se desmontó con su ancla. Overlay puro,
          Δ=0, y el juego sigue corriendo detrás. Monta en las dos pieles —su
          colocación la pone D6 y su piel es una hoja global, molde de tapetes.css.
          `cuenta` llega SIEMPRE, también con el bypass —ahí el nombre es
          "DevLocal" y las dos acciones responden que no hay cuenta real—: una
          entrada viva en el menú que no abriera nada sería el menu mintiéndole al
          jugador. La guarda se conserva para que el componente no dependa de que
          nadie se olvide de pasar la prop. */}
      {cuenta && (
        <CuentaPanel
          ancla={cuentaAncla}
          username={cuenta.username}
          onCerrar={cerrarCuenta}
          onCambiarNombre={() => { cerrarCuenta(); setEditandoNombre(true) }}
          onCerrarSesion={() => { cerrarCuenta(); cuenta.cerrarSesion() }}
          avisoMano
        />
      )}

      {/* El Bautizo en modo edición (§1.5): la MISMA pantalla, el mismo campo y
          la misma traducción de los tres códigos de SUP-2a, vestida de modal
          sobre la mesa. A diferencia del panel que lo abre, esto SÍ es modal:
          pide un dato y espera. */}
      {cuenta && editandoNombre && (
        <Bautizo
          modo="edicion"
          actual={cuenta.username}
          onConfirmar={cuenta.cambiarNombre}
          onCancelar={() => setEditandoNombre(false)}
        />
      )}

      {/* EMB-2 · panel de tapetes. Vive AQUÍ por la misma razón que sus
          hermanos: la entrada del ⋮ cierra al ejecutar, así que cuando esto se
          pinta el panel de utilidades ya se desmontó con su ancla. Overlay
          puro, Δ=0, y el juego sigue corriendo detrás. */}
      {/* MOV-1b-a · monta en las dos pieles. Su colocación la pone D6 y su piel
          es global desde esta tanda (tapetes.css se desanidó); lo único propio
          de móvil es la disposición en FILA del horizontal, un token en
          menuMovil.css. */}
      {(
        <TapetesPanel
          ancla={tapetes.ancla}
          activo={tapetes.activo}
          comprados={tapetes.comprados}
          previa={tapetes.previa}
          dialogo={tapetes.dialogo}
          onPresionar={tapetes.presionar}
          onConfirmar={tapetes.confirmar}
          onRevertir={tapetes.revertir}
        />
      )}

      {/* DSK-U3 · popup del valor de "Mano actual". Vive AQUÍ y no dentro del
          panel porque la entrada cierra al ejecutar: cuando esto se pinta, el
          panel ya se desmontó con su ancla. Overlay puro, Δ=0. */}
      {/* MOV-1b-a · monta en las dos pieles. Su piel móvil son las diez reglas
          copiadas en menuMovil.css; su colocación, D6. */}
      <ManoActualPopup popup={consultas.popup} saldo={consultas.saldo} />

      {/* DSK-U2 · selector de reacciones y burbuja. Viven AQUÍ por la misma
          razón que el panel de utilidades: hermanos del área y vecinos de las
          voladoras, fuera de flujo estricto. Jamás dentro de un .opp-panel —
          es contexto de apilamiento y R2 le pone `transform`, que rompería el
          `fixed`. La burbuja es overlay puro: Δ=0 de layout por construcción. */}
      {/* MOV-1b-c · las dos montan en las dos pieles. El selector cambia de
          rejilla 3×4 a LISTA de cuatro visibles por un solo token; la burbuja
          conserva su anclaje por tinta y sólo la rama vertical del móvil la
          recoloca (opción E), porque encima del nombre no hay sitio. */}
      <ReaccionesSelector
        anchor={reacciones.selector}
        bloqueado={reacciones.bloqueado || vcViva}
        onElegir={reacciones.enviar}
      />
      <ReaccionBurbuja
        activa={reacciones.activa}
        anchorSel=".pbr-name"
        onCerrar={reacciones.cerrarBurbuja}
      />

      {/* DSK-VC2 · celebración de mesa. Hermanas del área, como el panel de
          utilidades y las burbujas: overlays puros `fixed`, jamás dentro de un
          panel. Δ=0 por construcción — no ocupan una celda del flujo. */}
      <CelebracionMesa activa={celebracion.activa} />
      <AjileiOverlay activa={celebracion.activa} />

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
            <p className="bankrupt-title">Te quedaste sin Heptacoins</p>
            <p className="bankrupt-sub">Necesitas más Heptacoins para seguir jugando.</p>
            <div className="bankrupt-actions">
              <SoundButton className="btn btn-primary" onClick={onLeave}>
                Volver al lobby
              </SoundButton>
              <button className="btn btn-soon" disabled>
                Ver video por Heptacoins
                <span className="soon-tag">Próximamente</span>
              </button>
              <button className="btn btn-soon" disabled>
                Comprar Heptacoins
                <span className="soon-tag">Próximamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
