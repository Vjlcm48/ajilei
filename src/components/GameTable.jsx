import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, useId, createRef } from 'react'
import '../styles/gameTable.css'
import '../styles/apu.css'
import PlayingCard from './PlayingCard'
import OpponentPanel from './OpponentPanel'
import { SoundButton } from './SoundButton'
import { UtilitiesTrigger, UtilitiesPanel } from './UtilitiesMenu'
import { ReaccionesSelector, ReaccionBurbuja } from './Reacciones'
import { ManoActualPopup } from './ManoActual'
import ConfirmarConsulta from './ConfirmarConsulta'
import { CelebracionMesa, PulsoNombre, AjileiOverlay, PantallaVictoria } from './Celebracion'
import MiniPerfil from './MiniPerfil'
import { inicialDe } from '../screens/salaEsperaCore'
import { useCelebracion } from '../hooks/useCelebracion'
import { useSesion } from '../hooks/useSesion'
import { fichasNetas } from '../hooks/sesionCore'
import { decideCelebracion, llevaViaje, VIAJE_N } from '../hooks/celebracionCore'
import { conNivel } from '../hooks/nivelCore'
import { puntosDeMano } from '../lib/puntos'
import { claseTono, vozResto } from '../hooks/resultadoCore'
import { componeCronica, componeCapas } from '../hooks/cronicaCore'
import { lecturaDeMano, resultadoDeMano } from '../hooks/manoCore'
import { useVoz2Recorte } from '../hooks/useVoz2Recorte'
import { Voz2Capa } from './Voz2Capa'
import { siembraCEL } from '../dev/siembraCEL'
import { siembraMesaAPU } from '../dev/siembraAPU'
import {
  ASIENTO_HUMANO, filaAcciones, multiplicadoresDe, marcadoAllIn, ritmoDe,
  mesaClavada, pideRecarga, RECARGA,
  tarjetaRecarga, CASOS_RECARGA, topeRecarga, recargaValida, plazoRecarga, nivelarLasIAS,
  repartoPorCapas,
  recargaLista, formaRecarga, abrirRecarga, plegarRecarga, RED_REVELACION_MS,
} from '../hooks/mesaCore'
import { t } from '../config/textos'
// ECO-1c · el fin de mano para el récord (C7): la capa 0, no `winner`.
import { finDeMano, TOPE_RECARGA_MS } from '../hooks/mesaIACore'
import { jugadoresVsIA } from '../engine/entrada'
import {
  useUtilitiesMenu, anclaSatelite, ALTO_AVISO_MANO,
  ALTO_SELECTOR_REACCIONES,
} from '../hooks/useUtilitiesMenu'
import { useReacciones } from '../hooks/useReacciones'
import { useConsultas } from '../hooks/useConsultas'
import { useTapeteEnMesa } from '../hooks/useTapetes'
import { useCongelado } from '../hooks/useCongelado'
import { useEscalaMesa } from '../hooks/useEscalaMesa'
import { aPropios, escalaActual } from '../lib/escala'
import { reentrar as reentrarPantallaCompleta } from '../lib/pantallaCompletaCore'
import { hayManoConsultable, desglosarPalos, etiquetaConsulta } from '../hooks/consultasCore'
import { VIVAS_ESCRITORIO, VIVAS_MOVIL, presentesDe, filasDelPanel } from '../config/menuEntradas'
import { partidaRapida, factorDeMano } from '../lib/partidaRapida'
import { getBestSuitScore } from '../engine/handEvaluator'
import { useSounds } from '../hooks/useSounds'
import BalanceDisplay from './BalanceDisplay'
import ChipToken from './ChipToken'
import BurbujaRecarga from './BurbujaRecarga'
import TransicionMano from './TransicionMano'
import { esperaSiguienteMano, recogerEnPvP } from '../lib/transicionCore'
import { Wordmark } from './Wordmark'
import { effectiveLayout, livingRivalsInDisplayOrder } from '../config/seatLayouts'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
import { TURN_TIME } from '../config/esperas'
import {
  PHASES,
  createInitialState,
  startHand,
  advanceFromDeal,
  applyPlayerBetAction,
  applyBetAction,
  applyAIBetAction,
  // APU-1 1e-ii · `decidirIA` decide y `aplicarRecarga` cobra. Las dos existen
  // desde 1b/1c sin un solo consumidor: el ritmo de §6.9 y la recarga de §5 son
  // los que estaban esperando.
  decidirIA,
  aplicarRecarga,
  applyDiscard,
  toggleDiscard,
  // DSK-U0 · `maxDiscard` ya no se importa: la UI no recalcula reglas, las lee
  // del snapshot congelado de la mano (game.handRules). Quitar el import es
  // parte del arreglo — mientras la función esté a mano, el patrón vuelve.
} from '../engine/gameEngine'
import '../styles/luz.css'
import '../styles/voz2.css'
import '../styles/rev.css'
import '../styles/rec.css'
import '../styles/transicion.css'   // L-M 3 · §2 · la pastilla de la transición (las dos mesas)
import '../styles/tactil.css'
// TAB-1 · la escala de la mesa (solo bajo html[data-escala], que escribe useEscalaMesa)
import '../styles/escala.css'

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
const PORTRAIT_TABLE_MQ = '(orientation: portrait)'

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
// CFG-1 1e · el vuelo de una carta del reparto, en s. «Partida rápida» lo
// multiplica por 0,5 (`factorManoRef`); el del descarte (0,75, `fast`) no se toca.
const VUELO_REPARTO_S = 0.595

function FlyingCard({ fromX, fromY, toX, toY, w, h, duration = VUELO_REPARTO_S, onDone }) {
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
// ECO-1c · `control` es el canal de ESTA mesa con el servidor (`lib/controlMesaIA`),
// que crea `App` al sentarse: los avisos de pila (C3), las recargas y el cobro
// de la victoria (C8) pasan por él. Releva a `onRecargar`, que restaba del ajuste
// local de la 1b. Sin `control` la mesa juega como antes, sin servidor.
// RNK-1d · `apiRanking` es la MISMA de `App` (el banco imitado del bypass o la
// real): la usa sólo el mini-perfil propio que abre la victoria.
// CFG-1 1e · `contraIAS`: la mesa es contra las IAS. Solo entonces monta
// «Partida rápida» (INV-70); `false` por defecto, para que MES-PvP no la herede
// sin decidirlo. `apiConsulta`: `lib/consultaApi` (o su gemela del bypass), la
// puerta de Mano actual de pago (INV-75). `cuenta` ya sólo trae el nombre y el
// correo del mini-perfil propio: el Bautizo en edición no monta desde la mesa.
// `onSaldo`: el saldo que contesta `consultar_mano`, para la billetera de App.
// TIE-1 1a · `tapetes`: el canal de los tapetes de App (`lib/controlTapetes`);
// la mesa pone en `<body>` el tapete y el tono en uso. Sin él, el verde.
// MES-PvP 3 · `partida`: la mesa contra personas, `null` contra las IAS. Es la foto de
// `useMesaPvP` (`{ game, cronica, enviar, reloj }`, más `alternarDescarte(i)`), y llega
// siempre con `game`. Con ella la mesa no mueve el motor: pinta la vista del servidor y
// manda las jugadas por `enviar`. Cada guarda dice `partida` y, contra las IAS, es falsa:
// ningún hook cambia de sitio y ninguna tirada cambia (Fase 0 de MES-PvP, §B.1-B.2).
export default function GameTable({ stake, numPlayers = 2, nivel, entrada = null, onLeave, cuenta, saldo = 0, control = null, apiRanking = null, contraIAS = false, apiConsulta = null, onSaldo = null, tapetes = null, partida = null }) {
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
    // MES-PvP 3 · contra personas no hay motor local: ni mesa que crear ni tirada.
    if (partida) return { game: null, cronica: '' }
    // CEL-0 · `siembraCEL` es la IDENTIDAD salvo en desarrollo y con `?cel` en
    // la URL; ahí siembra a los rivales sin fichas para que la mesa cierre en
    // el primer "Iniciar mano". No hay rama de render ni condición nueva: lo
    // único que cambia es con cuánto saldo nacen los rivales.
    // ── APU-1 1e · LA MESA SE CREA CON LA LISTA, NUNCA CON EL NÚMERO ──────
    // Rector 1e §2.3. `jugadoresVsIA` sienta al asiento 0 con la entrada que el
    // jugador eligió y a cada IA con `min(round(entrada × 1,5), techo)` — el
    // factor que 1c-2 selló. La forma NUMÉRICA de `createInitialState` sigue
    // existiendo para las pruebas y el banco, pero la app ya no la usa: aquí
    // era el último sitio donde los cinco asientos nacían con 5.000 iguales.
    //
    // El `?? numPlayers` no es una cortesía: es la red para un montaje sin
    // entrada —un fixture futuro, una prueba— que caería en la forma vieja en
    // vez de en una lista de `undefined`.
    const lista = entrada !== null ? jugadoresVsIA(entrada, numPlayers, stake) : numPlayers
    const inicial = siembraMesaAPU(siembraCEL(conNivel(createInitialState(stake, lista), nivel)))
    return { game: inicial, cronica: componeCronica(null, inicial) }
  })
  const game    = partida ? partida.game : motor.game
  const cronica = partida ? partida.cronica : motor.cronica
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
  const [relojLocal,   setTimeLeft]     = useState(TURN_TIME)
  // MES-PvP 3 · contra personas el reloj es el del servidor, ya con el desfase corregido.
  const timeLeft = partida ? (partida.reloj.timeLeft ?? 0) : relojLocal
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [barajaLocal,  setIsShuffling]  = useState(false)
  // MES-PvP 3 · contra personas se baraja mientras el servidor espera el barajado.
  const isShuffling = partida ? partida.game.barajando : barajaLocal
  const [isClearing,   setIsClearing]   = useState(false)
  const [deal3FaceUp,  setDeal3FaceUp]  = useState(new Set())
  const [potAnim,      setPotAnim]      = useState(null)   // Tanda C4.3: pulso + "+N" del pozo
  // ── C4.5: coreografía del encogimiento ────────────────────────────────────
  const [ceremony,     setCeremony]     = useState(null)   // {seats:number[]} — IA(s) en salida digna
  const [elimNotice,   setElimNotice]   = useState(null)   // {id,text} — aviso central no bloqueante
  const [reflowing,    setReflowing]    = useState(false)  // asentado suave del nuevo layout
  const [noteFlash,    setNoteFlash]    = useState(0)      // destello del chip de comodín
  // ── APU-1 §5 · LA RECARGA ENTRE MANOS ────────────────────────────
  // `recarga` es la pregunta ABIERTA: `{ motivo, monto, abierta }`, o `null` si no hay
  // ninguna. El motivo lo decide `pideRecarga` y manda en todo lo demás —si hay
  // cuenta atrás, si se puede decir que no, qué pasa al decirlo—, así que se
  // guarda ÉL y no tres banderas que podrían contradecirse.
  const [recarga,    setRecarga]    = useState(null)
  const [recargaSeg, setRecargaSeg] = useState(0)     // cuenta atrás de la automática y la forzosa
  // REC-1 · lo que la revelación de ESTA mano lleva hecho, para `recargaLista`:
  // si la celebración llegó a armarse, si ya se descargó y si saltó la red.
  // Va con la identidad de la mano (`handCount`), así que una mano nueva
  // empieza de cero sin que nadie tenga que acordarse de limpiarlo.
  const [revelacion, setRevelacion] = useState({ mano: -1, armada: false, descargada: false, red: false })
  const [recargaHecha, setRecargaHecha] = useState(0) // nº de recargas de esta mesa (tarjeta y arnés)
  const [displayedSeat, setDisplayedSeat] = useState(null) // Reveal Manos: IA elegida por tap (null = ganadora)
  const [shakeSeat,     setShakeSeat]     = useState(null) // Reveal Manos R2: IA cuyo nombre "sacude" ahora
  const [revealAnim,    setRevealAnim]    = useState(null) // R2.b: {fase, from, to} — coreografía de volteo (lock de taps)
  const [openChipSeat,  setOpenChipSeat]  = useState(null) // H4: IA con el toggle de saldo abierto (uno a la vez)
  const { play } = useSounds()

  // ── FRZ-1 · El freeze de visibilidad ──────────────────────────────────────
  // Rector: AJILEI_FRZ1_Fase1_v1.0, arquitectura (c) con (a) dentro. El hook no
  // sabe nada de la partida: silencia el audio, dice si estamos a oscuras y
  // sostiene UN slot de continuación. Quien decide qué se congela son las cinco
  // guardas de abajo (§2.1-2.5), y todas viven AQUÍ — que es lo que hace que las
  // dos vías de render (OpponentPanel en 5/4/3 y .ai-zone en la mesa de 2)
  // queden cubiertas por construcción, sin una línea por camino.
  //
  // `congelado` es para las DEPENDENCIAS de los efectos que deben rearmarse al
  // volver; `congeladoRef` es para leer la verdad DENTRO de un timer o un
  // manejador, donde el valor capturado sería el de otro render.
  const { congelado, congeladoRef, diferir } = useCongelado()
  // TAB-1 · la escala vive SOLO mientras la mesa está montada (src/lib/escala.js).
  useEscalaMesa()

  // Position refs: one 5-slot row + one deck anchor per seat
  const [slotRefs] = useState(() =>
    Array.from({ length: numPlayers }, () =>
      Array.from({ length: 5 }, () => createRef())
    )
  )
  const [deckRefs] = useState(() =>
    Array.from({ length: numPlayers }, () => createRef())
  )
  const [deckHumano] = deckRefs
  const discardTimersRef = useRef([])
  const ceremonyTimersRef = useRef([])
  const revealTimersRef = useRef([])
  const chipTimerRef = useRef(null)   // H4: autocierre del toggle de saldo
  const gameRef = useRef(game)
  const prevPotRef = useRef(game.pot)
  // FRZ-1 §2.4 · los dos únicos relojes del arranque de mano que ESTA tanda
  // saca de la cola de "sin handle": la guarda de mano nueva los necesita
  // cancelables. Los otros siete los cerró GT-HIG; dos de ellos, aquí abajo.
  const barajaTimerRef = useRef(null)     // 1950 ms: baraja → dispara el reparto
  const siguienteManoTimerRef = useRef(null)  // 300 ms: "Siguiente mano" → beginHand
  // GT-HIG · Los dos relojes que este archivo dejaba sin handle en el censo
  // de FRZ-1 §1.3. `refillTimersRef` es una LISTA y no un handle suelto a
  // propósito: el humano repone hasta cinco cartas y cada una programa su
  // propio revelado, todos en vuelo a la vez. Cancelar "el anterior" antes de
  // programar el nuevo —la regla que sirve para los demás— aquí dejaría ver
  // sólo la última carta repuesta.
  const refillTimersRef = useRef([])      // 350 ms ×N: revelado de la carta repuesta
  const reflowTimerRef = useRef(null)     // 600 ms: apaga `reflowing` tras la ceremonia

  // Clear pending discard / ceremony / reveal timers if the table unmounts mid-animation
  useEffect(() => () => {
    discardTimersRef.current.forEach(clearTimeout)
    ceremonyTimersRef.current.forEach(clearTimeout)
    revealTimersRef.current.forEach(clearTimeout)
    clearTimeout(chipTimerRef.current)
    clearTimeout(barajaTimerRef.current)
    clearTimeout(siguienteManoTimerRef.current)
    refillTimersRef.current.forEach(clearTimeout)
    clearTimeout(reflowTimerRef.current)
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

  // ── VOZ-3 · QUIÉN GANÓ LA MANO, LEÍDO DE LAS FICHAS ──────────────────────
  // `game.winner` es el dueño de la capa de ARRIBA (`gameEngine.js:285`, `:292`):
  // con un all-in corto, quien sólo recupera su vuelto. La mano la gana quien
  // gana la capa principal, y todo lo que la mesa deriva del fin de la mano
  // —titular, tono, cola de capas, mano en grande, celebración, monedas,
  // retención, «Manos ganadas» y la espera de la recarga— sale de esta lectura
  // y de ningún otro sitio (`manoCore.lecturaDeMano`). `null` fuera del pago y
  // mientras se recoge la mano.
  //
  // `ganadorVisible` es la puerta de compatibilidad para los consumidores que
  // reciben un asiento (`useCelebracion`, `useSesion`): en el pago, el
  // principal; en el fin de partida, el `winner` de `startHand` —el último con
  // fichas—, que no es el de una mano y no cambia con VOZ-3.
  const lectura = useMemo(() => lecturaDeMano(game), [game])
  const ganadorVisible = phase === PHASES.PAYOUT ? (lectura?.principal ?? null) : game.winner
  const destinoVuelo = lectura?.destinoVuelo ?? null
  const retencionVuelo = lectura?.retencion ?? 0

  // ── RNK-1b · I-7 · UN fin de mano por mano, para el servidor y la sesión ──
  // `finDeMano` (capa principal, `ruleN`, `handCount` y AJILEI) se calcula UNA
  // vez al entrar en el pago —memo por `handCount`— y lo usan las dos cosas que
  // dependen de él: el aviso de fin de mano a la cola del servidor (abajo) y
  // «Manos ganadas» / «Puntos obtenidos» de la sesión (`useSesion`). Así no
  // pueden discrepar. Los puntos son `puntosDeMano`, espejo de la regla del
  // servidor (INV-65); al servidor nunca viaja la cifra, sólo el fin.
  const finMano = useMemo(
    () => (phase === PHASES.PAYOUT ? finDeMano(game) : null),
    [phase, game.handCount], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const puntosMano = finMano
    ? puntosDeMano({ origen: 'ias', nivel: game.nivelIA, sentados: finMano.vivos, ajilei: finMano.ajilei }).total
    : 0

  // ── APU-1 1e · SALIR DEVUELVE LAS FICHAS ─────────────────────────────────
  // Rector 1e §2.3. `onLeave` recibe con cuántas fichas se levanta el humano,
  // para que el saldo de la sesión suba con lo ganado. Las cuatro salidas de
  // la mesa pasan por aquí y no por `onLeave` a pelo, y eso arregla de paso un
  // defecto latente: tres de ellas eran `onClick={onLeave}`, así que le
  // entregaban el EVENTO DE CLIC como primer argumento. Mientras nadie leyera
  // ese argumento daba igual; desde esta tanda se lee.
  const salir = useCallback(() => { onLeave?.(human.chips) }, [onLeave, human.chips])

  // ── ECO-1c · C3 · CADA CAMBIO DE LA PILA, AL SERVIDOR ─────────────────────
  // Plan del STOP-1 §1. Todo lo que mueve la pila del humano —el ante, sus
  // apuestas, el pozo que cobra, la recarga— pasa por `setGame`, y por eso
  // basta UN efecto que mire la pila: la apuesta se avisa en el commit en que
  // sale al pozo, antes de que nadie vea cartas. Al entrar en PAYOUT, una vez
  // por mano, el aviso lleva el fin de mano (C7), aunque la pila no cambie
  // (quien pierde ya la bajó al apostar). La cola de `control` ordena, salta lo
  // que sobra y reintenta; aquí sólo se dice qué pasó.
  const finAvisadoRef = useRef(-1)
  useEffect(() => {
    if (!control) return
    let fin = null
    if (phase === PHASES.PAYOUT && finAvisadoRef.current !== game.handCount) {
      fin = finMano
      finAvisadoRef.current = game.handCount
    }
    control.pila(human.chips, fin)
  }, [control, human.chips, phase, game.handCount]) // eslint-disable-line react-hooks/exhaustive-deps
  // MSG-U1 · El resultado se COMPONE desde el estado, no se hereda del motor.
  // Vale null fuera de PAYOUT/GAME_OVER, y ahí toma el relevo `cronica`
  // (MSG-U2/REN-2): el interruptor sigue siendo la fase, jamás el texto.
  // VOZ-3 · en el pago, con el principal como ganador y el tono de la lectura
  // (que añade `neutro`); en el fin de partida, como siempre.
  const resultado = resultadoDeMano(game, lectura)
  // VOZ-2 · ¿La frase de resultado se pintó recortada? Lo mide la caja, no la
  // longitud (D4): ver `useVoz2Recorte`. Se publica en el `.voz2-texto` como
  // `data-voz2-recortada`, y el arnés lo contrasta con los glifos visibles.
  const [voz2Ref, voz2Recortada] = useVoz2Recorte()
  // VOZ-2 · 1b · ¿La frase está desplegada? Se guarda la MANO en la que se
  // abrió (`handCount`), no un booleano: en cuanto empieza otra mano deja de
  // coincidir y la capa se cierra sola, sin un efecto que la limpie (D3, molde
  // U1). El estado abierto de verdad se DERIVA más abajo (`voz2Abierta`), con la
  // recarga ya calculada.
  const [vozAbierta, setVozAbierta] = useState(null)
  const voz2CapaId = useId()
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
  // CFG-1 1e · el alto del panel sale de las filas que montan (5 contra las
  // IAS, 4 sin «Partida rápida»): de ahí sale la pinza.
  const utilMenu = useUtilitiesMenu(true, filasDelPanel(contraIAS))
  // SUP-2b dejaba aquí el panel de Cuenta y el Bautizo en edición. CFG-1 1e los
  // retira de la mesa: el perfil tiene sus tres puertas desde la 1b (P-1).
  //
  // CFG-1 1e · «Partida rápida» (INV-70). `rapida` es lo que enseña el ⋮ y se
  // recuerda en el aparato; `factorManoRef` es lo que usa la mano EN CURSO, y
  // sólo lo escribe `commitNewHand`: cambiarla a mitad de mano no toca esa mano.
  const [rapida, setRapida] = useState(() => partidaRapida.leer())
  const factorManoRef = useRef(1)
  const alternarRapida = () => {
    const encendida = !rapida
    partidaRapida.guardar(encendida)
    setRapida(encendida)
  }
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
  // CFG-1 1e · el contador y el cobro viven en el servidor (INV-75): la mano es
  // (mesa del servidor, «Mano #N»), y el precio sale del nivel de la mesa.
  const mesaServidor = control?.mesaId ?? null
  const consultas = useConsultas({ api: apiConsulta, mesaId: mesaServidor, nivel, saldo, onSaldo })
  // EMB-2 · Tapetes. Mismo gate y mismo molde de hermandad: el hook se llama
  // SIEMPRE (orden de hooks estable) y recibe el gate, así que fuera de
  // escritorio no hay panel, no hay atributo y el fieltro es el verde de
  // siempre — aunque el localStorage traiga otro (v1.0 §4: el panel hereda la
  // cola del puerto móvil del ⋮ junto al resto del menú).
  // MOV-1b-a · sin gate: Tapetes se enciende en móvil. El segundo cinturón que
  // lo sostenía —el bloque gateado de tapetes.css— también se abrió; un sello
  // que sobrevive a su motivo deja al jugador elegir un tapete y no ver nada.
  // TIE-1 1a · la mesa ya no elige ni compra: el tapete y su tono los dice el
  // servidor por el canal de `App` (`lib/controlTapetes`, INV-76), con la copia
  // del aparato mientras contesta, y aquí sólo se ponen en `<body>`. La entrada
  // «Tapetes» del ⋮ y su panel se retiran: se elige en la tienda.
  useTapeteEnMesa(tapetes)
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
  // ni por orden DOM: el destino es un índice de asiento del motor y
  // `data-coin-target` lleva ese mismo índice. Por eso funciona igual si gana el humano (0) o
  // cualquier IA, y por eso PvP lo heredará sin tocar nada.
  //
  // `lado` es el ANCHO MEDIDO de la moneda destino, y de él sale la escala de
  // llegada. Medido y no escrito, con motivo: en mesa 5 a 1024x600 la moneda del
  // pozo mide 11 px porque el CSS de landscape móvil la achica, mientras su
  // atributo `width` sigue diciendo 24. Un número escrito mentiría ahí.
  //
  // VOZ-3 · D9 · el destino es el PRINCIPAL (`lectura.destinoVuelo`), no
  // `game.winner`: con un all-in corto, las monedas volaban a la IA que sólo
  // recuperaba su vuelto. Y lo que la pila del destino retiene durante el vuelo
  // es lo que COBRA él (`retiene`), no el pozo entero: en cuanto cobran dos
  // asientos, restar el pozo bajaba la pila del principal por debajo de lo que
  // tenía. Las devoluciones y los cobros ajenos no vuelan: aparecen al aterrizar.
  // Con una sola capa, `retiene` es el pozo y todo queda como antes (D11).
  const geometriaViaje = useCallback(() => {
    const moneda = (sel) => document.querySelector(`${sel} .chip-token`)
    const origen  = moneda('[data-coin-source="pot"]')
    const destino = moneda(`[data-coin-target="${destinoVuelo}"]`)
    if (!origen || !destino) {
      // No debería ocurrir: VIS-3a midió 1 origen y 1 destino por jugador vivo
      // en las siete celdas. Si ocurriera, NO se vuela y —lo que importa— no se
      // retiene ningún saldo (§Fase 3): sin vuelo no hay nada que diferir.
      console.warn(`[VIS-3] vuelo sin ${origen ? 'destino' : 'origen'}: destino=${destinoVuelo}`)
      return null
    }
    // TAB-1 · las monedas vuelan dentro de `#root` ampliado: posiciones en px
    // propios. El `lado` sigue VISUAL a propósito: `FichaViajera` lo divide
    // entre el lado de su propia moneda, que también mide visual.
    const f = escalaActual()
    const b0 = destino.getBoundingClientRect()
    const a = aPropios(origen.getBoundingClientRect(), f)
    const b = aPropios(b0, f)
    return {
      desde: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
      hasta: { x: b.left + b.width / 2, y: b.top + b.height / 2, lado: b0.width },
      fichas: VIAJE_N,
      // VIS-3c · La retención viaja DENTRO de la geometría, y por dos razones.
      // La primera es de higiene: `ultimoPozoRef.current` no puede leerse durante
      // el render —lo dice la nota de arriba y lo señala el linter—, y aquí se
      // lee en un efecto, que es su sitio. La segunda es de exactitud: el pozo y
      // el ganador quedan CONGELADOS en el instante de armar, el mismo en que se
      // miden las monedas, así que la cifra retenida no puede desincronizarse de
      // la que el vuelo está ilustrando.
      pozo: ultimoPozoRef.current,
      winner: destinoVuelo,
      retiene: retencionVuelo,
    }
  }, [destinoVuelo, retencionVuelo])

  // VC2b · El asa del sonido del ganador, para que la celebración pueda
  // encadenarse a su final. Se lee con una función estable, nunca durante el
  // render. La llamada a useCelebracion vive MÁS ABAJO, justo detrás del efecto
  // que llena este ref: el orden de declaración de los hooks es el orden en que
  // React vacía sus efectos, y aquí ese orden es portante.
  const showdownAudioRef = useRef(null)
  const precedenteViaje = useCallback(() => showdownAudioRef.current, [])

  // VOZ-3 · D10 · «Manos ganadas» = el principal es el humano, la misma regla
  // que el récord del servidor. RNK-1b · I-7 · y ya no una regla igual, sino el
  // MISMO `finMano` que viaja al servidor, con sus puntos.
  const sesion = useSesion({
    phase,
    handCount: game.handCount,
    fin: finMano,
    puntos: puntosMano,
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
  // eslint-disable-next-line react-hooks/set-state-in-effect -- MOT-1 reescribe este flujo
  useEffect(() => { setBetAmount(unit) }, [phase, unit])

  // ── Deal animation ────────────────────────────────────────────────────────
  function launchFlyingCard(step) {
    const { seat, cardIndex } = dealSeq[step]
    const deckEl = deckRefs[pieSeat]?.current
    const slotEl = slotRefs[seat][cardIndex]?.current

    if (!deckEl || !slotEl) {          // fallback: skip animation
      play('cardDeal')
      // DEAL_2 muestra la carta del humano boca arriba al instante (sin flip):
      // su volteo es el aterrizaje, así que el comodín suena aquí.
      if (phase === PHASES.DEAL_2 && seat === 0 && comodinActive && isComodin(game.players[0].cards[cardIndex])) play('comodin')
      setDealStep(s => s + 1)
      return
    }

    // TAB-1 · la carta en vuelo es `fixed` DENTRO de `#root` ampliado: lo que
    // escribe se vuelve a ampliar, así que las cajas pasan a px propios aquí,
    // al crear el vuelo, y en ningún otro sitio (dividir también al pintar
    // dividía dos veces: lámina 1a §5).
    const f = escalaActual()
    const dr = aPropios(deckEl.getBoundingClientRect(), f)
    const sr = aPropios(slotEl.getBoundingClientRect(), f)
    play('cardDeal')
    setFlyingCards(prev => [...prev, {
      id: `fly-${phase}-${step}`,
      fromX: dr.left, fromY: dr.top,
      toX:   sr.left, toY:   sr.top,
      // Regla universal: la carta viaja al tamaño del DESTINO. Reparto mazo→slot →
      // destino = slot (sr).
      w: sr.width, h: sr.height,
      dealSeat: seat, dealCardIndex: cardIndex,
      // CFG-1 1e · la duración del vuelo, con el factor de ESTA mano (×0,5 con
      // «Partida rápida»). Va en la carta al crearla: la que ya vuela no cambia.
      dur: VUELO_REPARTO_S * factorManoRef.current,
    }])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- MOT-1 reescribe este flujo
    if (!isDealPhase) { setFlyingCards([]); return }
    if (isShuffling) return   // C4.4.1: ante ya descontado; repartir solo al terminar el barajado
    if (dealStep >= dealTotal) {
      if (phase === PHASES.DEAL_3) {
        // El flip de cada carta (2,3,4) es el volteo del humano: comodín ahí.
        const revealDeal3 = i => {
          setDeal3FaceUp(prev => new Set(prev).add(i))
          if (comodinActive && isComodin(game.players[0].cards[i])) play('comodin')
        }
        // CFG-1 1e · las esperas del segundo reparto, con el factor de ESTA
        // mano (×0,5 con «Partida rápida»). El volteo en sí (0,30 s) vive en
        // `gameTable.css`, protegido, y no cambia.
        const k = factorManoRef.current
        const t0 = setTimeout(() => revealDeal3(2), 300 * k)
        const t1 = setTimeout(() => revealDeal3(3), 600 * k)
        const t2 = setTimeout(() => revealDeal3(4), 900 * k)
        // MES-PvP 3 · contra personas el reparto acaba aquí: las cartas quedan como
        // están y la fase la cambia la vista siguiente, cuando el servidor avance.
        if (partida) return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
        const t3 = setTimeout(() => {
          setDeal3FaceUp(new Set())
          setDealStep(0)
          setGame(prev => advanceFromDeal(prev))
        }, 2000 * k)
        return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
      }
      if (partida) return
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- MOT-1 reescribe este flujo
      setDealStep(0)
      setDeal3FaceUp(new Set())
    }
  }, [phase])

  // Shuffle sound fires on the same render that mounts ShuffleDeck
  useEffect(() => {
    if (isShuffling) play('cardShuffle')
  }, [isShuffling]) // eslint-disable-line

  // ── Turn timer ────────────────────────────────────────────────────────────
  const toCallEarly          = currentBet - human.contrib
  const isBetPhaseEarly      = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
  const isPlayerTurnEarly    = humanIsTurn && isBetPhaseEarly && !human.folded
  // MES-PvP 3 · contra personas, una vez mandado el descarte se espera a la mesa: sin reloj ni botón.
  const yaDescarte           = !!partida && game.descarte.yaDescartaron.includes(0)
  const isDiscardTimerActive = phase === PHASES.DISCARD && !discardAnim && !human.folded && !yaDescarte

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- MOT-1 reescribe este flujo
    if (isPlayerTurnEarly || phase === PHASES.DISCARD) setTimeLeft(TURN_TIME)
  }, [phase, game.activePlayerIndex]) // eslint-disable-line

  // FRZ-1 §2.1 · El reloj de turno del humano NO corre a oscuras. Medido en la
  // Fase 0 (corrida C): con audio, Chrome no estrangula nada y los 20 segundos
  // se consumían a tiempo real en segundo plano — el jugador volvía retirado.
  //
  // El mecanismo es la lista de dependencias, no un temporizador nuevo:
  // ocultarse cambia `congelado`, el cleanup limpia el tick pendiente y el
  // efecto sale por aquí. `timeLeft` NO se toca, así que volver reprograma
  // desde el MISMO segundo. Y como el tick pendiente se limpió, ni los avisos
  // de ≤5 ni el auto-pasar de 0 pueden disparar durante la ausencia ni
  // duplicarse al volver: en cualquier instante hay como mucho un timer vivo.
  useEffect(() => {
    // MES-PvP 3 · contra personas el reloj lo cuenta y lo resuelve el servidor.
    if (partida) return
    if (congelado) return
    if (!isPlayerTurnEarly && !isDiscardTimerActive) return
    if (timeLeft <= 0) return
    const t = setTimeout(() => {
      const next = timeLeft - 1
      setTimeLeft(next)
      if (next > 0 && next <= WARNING_AT) play('timerWarning')
      if (next === 0) {
        if (isPlayerTurnEarly) {
          if (gameRef.current.currentBet > 0) play('cardFold')   // timeout → se retira
          setGame(prev => applyPlayerBetAction(prev, prev.currentBet === 0 ? 'pasar' : 'retirarse'))
        } else {
          // eslint-disable-next-line react-hooks/immutability -- MOT-1 reescribe este flujo
          startDiscardAnim(gameRef.current, [])
        }
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [isPlayerTurnEarly, isDiscardTimerActive, timeLeft, congelado]) // eslint-disable-line

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
    // VOZ-3 · el principal tiene `score` exactamente cuando hubo volteo, igual
    // que lo tenía `winner`: el sonido no cambia, sólo de dónde se lee.
    const w = ganadorVisible
    const isShowdown = w !== null && game.players[w].score
    showdownAudioRef.current = isShowdown ? play('showdown') : null
  }, [phase]) // eslint-disable-line

  // VC2b · AQUÍ, y no más arriba, por el orden de vaciado de efectos: el efecto
  // de showdown es hermano ANTERIOR, así que cuando el de useCelebracion corre,
  // showdownAudioRef ya trae el asa de ESTA mano. Al revés leería la anterior.
  // CEL-1 · La condición que decidía inline si montaba la tarjeta, con nombre:
  // ahora decide una PANTALLA entera, y una condición sin nombre repetida en un
  // ternario de dos ramas se lee peor. Misma llamada, mismo decisor sellado.
  // MES-PvP 3-A · contra personas, ganar la mesa no lo decide quien queda en pie: la
  // celebración la pone el signo del resultado (Reglas v1.7 §8.3, `vozHumanos.finDePartida`).
  const finPvP = partida ? partida.fin : null
  const esVictoriaDeMesa = isGameOver && (partida
    ? finPvP?.tono === 'celebracion'
    : decideCelebracion({
      phase, winner: game.winner, humanCards: human.cards, ruleN: game.handRules.ruleN,
    }) === 'partida')

  // ── ECO-1c · C8 · «SALDO ACTUAL» ES EL SALDO REAL ─────────────────────────
  // La mesa ganada no tiene más manos: se cobra AL ENTRAR en la celebración, no
  // al pulsar «Salir», y la cifra que cuenta «Saldo actual» es la que devuelve
  // `salir_ia`. La cuenta del saldo empieza unos 5 s después de montar la
  // pantalla (Victory_Celebration v1.1 §4.2), así que casi siempre llega antes;
  // si no, `useCoreografia` la espera. El «Salir» de la celebración vuelve a
  // llamar a `control.salir`, que devuelve la MISMA promesa: un cobro.
  const [saldoFinal, setSaldoFinal] = useState(null)
  const cobroVictoriaRef = useRef(false)
  useEffect(() => {
    if (!esVictoriaDeMesa || !control || cobroVictoriaRef.current) return
    cobroVictoriaRef.current = true
    control.salir(human.chips).then((r) => {
      if (Number.isFinite(r?.saldo)) setSaldoFinal(r.saldo)
    })
  }, [esVictoriaDeMesa, control, human.chips])

  // ── RNK-1d · «VER TU NUEVO RANKING» ──────────────────────────────────────
  // Abre TU mini-perfil (el de Rankings, por portal en `<body>`: fuera de
  // `#root` no hereda el `zoom` de la mesa, INV-59) y no navega. Se enciende
  // con `saldoFinal`: `salir_ia` contesta después de que el libro anotó la
  // última mano (Fase 0 §E.2), así que la tarjeta ya trae los puntos nuevos.
  // Sin `control` no hay libro que esperar y el botón nace encendido, como
  // «Saldo actual» pinta entonces las fichas de la mesa; sin `apiRanking`, no
  // hay tarjeta que abrir y se queda apagado. Al cerrar, el foco vuelve al
  // botón que la abrió.
  const listoRanking = !!apiRanking && (!control || saldoFinal !== null)
  const [perfilVictoria, setPerfilVictoria] = useState(false)
  const origenPerfil = useRef(null)
  const abrirRanking = useCallback((el) => {
    origenPerfil.current = el ?? null
    setPerfilVictoria(true)
  }, [])
  const cerrarRanking = useCallback(() => {
    setPerfilVictoria(false)
    if (origenPerfil.current?.isConnected) origenPerfil.current.focus()
  }, [])

  // VOZ-3 · el nivel sigue al principal (`lectura.nivel` es este mismo decisor
  // con el mismo asiento): `mano` o `ajilei` si es el humano, `recoleccion` si
  // es una IA, también con el tono `neutro` (D4: sin pulso ni fanfarria).
  const celebracion = useCelebracion({
    enabled: true,
    phase,
    winner: ganadorVisible,
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
  // INVARIANTES. Nunca se muestra menos que `chips - retiene` (se resta una vez
  // y sólo al principal, y `retiene` es lo que él cobra: VOZ-3 D9; con una sola
  // capa es el pozo entero, como antes). Nunca se retiene sin vuelo (sin `activa` no hay
  // retención, y `geometriaViaje` devuelve null si no encuentra las monedas, con
  // lo que `activa` no llega a armarse). El movimiento reducido no necesita
  // gate: hoy la celebración no lo consulta (Fase 0), así que no hay caso en el
  // que el vuelo se omita y la retención quede colgada.
  const retencion = celebracion.activa && llevaViaje(celebracion.activa.nivel)
    ? { winner: celebracion.activa.winner, pozo: celebracion.activa.pozo, retiene: celebracion.activa.retiene, volando: !celebracion.activa.esperando }
    : null
  // El pozo enseña su cifra hasta que sale la primera moneda; en ese instante,
  // 0. Sin volteo la espera es cero, así que las dos cosas pasan en el mismo
  // fotograma y se ve lo de siempre.
  const pozoMostrado = retencion && !retencion.volando ? retencion.pozo : game.pot

  // Sólo el GANADOR retiene, y sólo para pintar: `playerChips` —el que gobierna
  // qué apuestas se pueden hacer— sigue leyendo el valor real del motor.
  const saldoMostrado = (i, chips) => chips - (retencion && retencion.winner === i ? retencion.retiene : 0)

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
    // MES-PvP 3-A · la misma condición que la pantalla: contra las IAS es la de siempre.
    if (!esVictoriaDeMesa) return
    tocPartidaRef.current = play('tableKnock') ?? { mudo: true }
  }, [phase]) // eslint-disable-line

  // ── AI auto-action ────────────────────────────────────────────────────────
  // C4.4.1: una IA RETIRADA (folded) no recibe turno de "pensar" — se excluye
  // aquí y se salta en silencio en el efecto siguiente.
  //
  // FRZ-1 §2.2 · Y no piensa a oscuras. La guarda es una CONDICIÓN DE ENTRADA,
  // no un cancelar/reprogramar en bucle: mientras `congelado` valga true el
  // efecto sale en la primera línea y no programa nada, y `congelado` solo
  // cambia cuando cambia la visibilidad de verdad — no hay ciclo posible.
  // Al volver se reprograma ENTERA (los 1125 ms completos) y lee
  // `gameRef.current` fresco, así que no hay jugada obsoleta ni doble. Es la
  // propiedad que la Fase 0 verificó en §2.4 y sobre la que se apoya todo esto.
  useEffect(() => {
    // MES-PvP 3 · contra personas no hay IA: la guarda va antes de `decidirIA`, la tirada.
    if (partida) return
    if (congelado) return
    const isBet = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
    const active = game.players[game.activePlayerIndex]
    if (isBet && game.activePlayerIndex !== 0 && !active.folded) {
      // ── APU-1 §6.9 · EL RITMO SALE DEL PESO DE LA DECISIÓN ──────────────
      //
      // Hasta aquí toda acción de IA esperaba `AI_ACTION_MS` —1.125 ms— pasara
      // lo que pasara: una IA que pasa y una IA que empuja su pila entera
      // tardaban IGUAL. `decidirIA` devuelve `{action, k, peso}` desde 1c
      // precisamente para esto, y hasta hoy nadie había leído el `peso`.
      //
      // SE DECIDE ANTES Y SE APLICA DESPUÉS, y el orden no es un detalle: para
      // saber cuánto esperar hay que saber QUÉ va a hacer, y la decisión de la
      // IA consume azar. Llamar a `decidirIA` para medir el peso y luego a
      // `applyAIBetAction` —que vuelve a decidir por dentro— gastaría dos
      // tiradas y podría aplicar una acción DISTINTA de la que se cronometró.
      // Así se consume exactamente una, la misma que consumía antes.
      const seat = game.activePlayerIndex
      const decision = decidirIA(game, seat)
      const t = setTimeout(() => {
        const prev = gameRef.current
        // La mesa pudo moverse mientras se esperaba (una mano nueva, un
        // descongelado que reprograma). Si ya no es su turno, la decisión
        // caduca: se descarta en vez de aplicarse sobre otro estado.
        if (prev.activePlayerIndex !== seat || prev.phase !== phase) return
        const next = applyBetAction(prev, seat, decision.action, decision.k)
        const action = inferAction(prev, next, seat)
        if (next.pot > prev.pot) play('coinBet')
        if (action === 'Se retiró') play('cardFold')
        setLastActions(la => ({ ...la, [seat]: action }))
        setGame(next)
      }, ritmoDe(decision.peso))
      return () => clearTimeout(t)
    }
  }, [phase, game.activePlayerIndex, congelado]) // eslint-disable-line

  // ── Saltar en silencio a un jugador activo RETIRADO (C4.4.1) ──────────────
  // Nació para cuando BET_2/BET_3 abrían en la Mano retirada en una ronda
  // previa. HOY NO SE ALCANZA: el motor abre la ronda en la siguiente silla
  // viva, nunca en la retirada (medido a la vista, 3 de 3, en ARN-3c §11.1.2;
  // por eso la celda `retirado` del modo `congelado` sale «no alcanzable»).
  // La guarda se MANTIENE como defensa: si el motor volviera a dar el turno a
  // un retirado, se avanza de inmediato vía su API (sin tocarlo), sin
  // "pensando" ni retardo, en vez de dejar la mesa esperando a quien no juega.
  //
  // FRZ-1 §2.3 · Transición de UN paso, así que va al slot en vez de a las
  // dependencias: si estamos a oscuras se DIFIERE y la vuelta la ejecuta. Se
  // hace así y no con `congelado` en las deps a propósito — con las dos vías
  // vivas, volver ejecutaría el slot Y rearmaría el efecto, dos caminos para un
  // solo salto. El cuerpo ya relee `gameRef.current` y se autoprotege con su
  // guarda de `folded`, así que la continuación diferida es la misma decisión,
  // tomada más tarde y sobre el estado de entonces.
  useEffect(() => {
    if (partida) return   // MES-PvP 3 · el turno de un retirado lo salta el servidor
    const isBet = phase === PHASES.BET_1 || phase === PHASES.BET_2 || phase === PHASES.BET_3
    if (!isBet) return
    const active = game.players[game.activePlayerIndex]
    if (!active || !active.folded) return
    const salta = () => {
      const prev = gameRef.current
      const cur  = prev.players[prev.activePlayerIndex]
      if (!cur || !cur.folded) return
      setGame(prev.activePlayerIndex === 0 ? applyPlayerBetAction(prev, 'pasar') : applyAIBetAction(prev))
    }
    if (congeladoRef.current) { diferir(salta); return }
    const t = setTimeout(salta, 0)
    return () => clearTimeout(t)
  }, [phase, game.activePlayerIndex]) // eslint-disable-line

  // ── APU-1 §4.3 · LA RONDA SIN JUEGO YA NO LLEGA AQUÍ ────────────────
  //
  // Aquí vivía un efecto que pasaba por el único asiento con fichas cuando la
  // ronda no tenía juego: pulsaba «pasar» por él para que el motor viera la
  // ronda cerrada y avanzara de fase. Funcionaba, y aun así estaba en el sitio
  // equivocado —§4.3 dice que esas rondas NO EXISTEN, y existir o no existir es
  // cosa del motor—. Desde 1e-iii el motor no abre una fase de apuesta que nadie
  // pueda jugar (`abrirApuesta`), así que la pantalla no tiene por qué fingir
  // una acción que nadie tomó, y el caso hermano —que no quede NADIE con
  // fichas— queda cerrado por la misma puerta, que es algo que desde fuera del
  // motor no se podía hacer.
  //
  // Lo que queda de aquello es el vigía: `data-clavada`, abajo, que tiene que
  // valer `0` siempre.


  // Human folded during DISCARD (N≥3): rivals discard on their own
  // FRZ-1 §2.3 · Mismo trato que el salto de retirado: si estamos a oscuras, al
  // slot. El precio declarado es que la vuelta arranca el descarte en el acto en
  // vez de tras el compás de 1125 ms — y solo en el caso raro de ocultarse
  // dentro de esa ventana, estando el humano retirado.
  useEffect(() => {
    if (partida) return   // MES-PvP 3 · el descarte de los demás lo aplica el servidor
    if (phase === PHASES.DISCARD && human.folded && !discardAnim) {
      const arranca = () => startDiscardAnim(gameRef.current, [])
      if (congeladoRef.current) { diferir(arranca); return }
      const t = setTimeout(arranca, AI_ACTION_MS)
      return () => clearTimeout(t)
    }
  }, [phase]) // eslint-disable-line

  // ── Betting helpers ───────────────────────────────────────────────────────
  const toCall       = toCallEarly
  const isBetPhase   = isBetPhaseEarly
  const isPlayerTurn = isPlayerTurnEarly

  // ── APU-1 §3.1 · LOS BOTONES SON LA LEGALIDAD, NO UNA COPIA SUYA ────────
  //
  // Aquí vivían `canPass`, `canBet`, `canCall` y `canRaise`: cuatro condiciones
  // escritas a mano con la aritmética del motor copiada dentro —`playerChips >=
  // toCall`, `playerChips >= (raiseTo - human.contrib)`—. Es literalmente el
  // riesgo R-5 del diagnóstico, y lo que lo cierra es preguntar en vez de
  // calcular: `pozos.esLegal` es el mismo árbitro que el motor consulta antes de
  // aplicar y que la IA consulta antes de decidir, así que la fila de botones y
  // lo que la mesa acepta no pueden divergir NUNCA.
  //
  // El botón All-in sale de aquí sin una condición nueva. §4.1: el all-in es
  // defensivo —existe sólo cuando hay apuesta viva y la pila no la cubre— y en
  // ese mismo estado `igualar` se rechaza con `no_alcanza`. Los dos son
  // EXCLUYENTES por construcción: donde antes no había botón de pago y al
  // jugador sólo le quedaba retirarse —perdiendo lo que ya había puesto, que es
  // el defecto que APU-1 corrige— ahora hay All-in.
  const kElegido   = Math.max(1, Math.round(betAmount / (unit || 1)))
  const fila       = filaAcciones(game, kElegido)
  const puedeHacer = (id) => fila.some(a => a.id === id)
  const costoAccion = (id) => fila.find(a => a.id === id)?.costo ?? 0
  const raiseTo    = currentBet + betAmount
  const mults      = multiplicadoresDe(game)

  function act(action) {
    // §1 de la ficha: el all-in REUTILIZA `coinBet`. No estrena sonido —es
    // dinero al pozo como cualquier otro— y lo que lo distingue es el compás,
    // no el timbre.
    if (['apostar', 'igualar', 'subir', 'allIn'].includes(action)) play('coinBet')
    if (action === 'retirarse') play('cardFold')
    // MES-PvP 3 · contra personas la jugada va al árbitro, con el mismo `k`.
    if (partida) { partida.enviar('apostar', { tipo: action, k: kElegido }); return }
    // 1e-iii · al motor va el MULTIPLICADOR, no el monto. Es el mismo `k` con
    // el que `filaAcciones` acaba de preguntar si esta acción era legal, así que
    // lo que se aplica y lo que se ofreció no pueden separarse.
    setGame(prev => applyPlayerBetAction(prev, action, kElegido))
  }

  // ── APU-1 §5 · LA RECARGA ENTRE MANOS ────────────────────────────
  //
  // Releva al modal de bancarrota con sus dos «Próximamente» (§5.4 nombra esa
  // superficie como la que se reemplaza) y estrena el otro lado de la moneda de
  // APU-1: si la entrada es lo que arriesgas, la recarga es el segundo round.
  //
  // Las tres formas salen de UNA función pura, `pideRecarga`, que mira la fase,
  // la pila, el techo de la mesa y el bolsillo. La pantalla no vuelve a decidir
  // nada: pinta lo que esa función dice y cobra por `aplicarRecarga`.
  // MES-PvP 3 · la recarga es solo contra las IAS (Reglas v1.5 §5).
  const motivoRec  = partida ? RECARGA.NINGUNA : pideRecarga(game, saldo)
  // REC-2 · la tarjeta ENTERA sale del núcleo: qué caso es (fila, «todo» o sin
  // saldo), qué montos se pintan y cuál nace elegido. El monto elegido es
  // `null` en el caso 3 y nunca 0: aquí no se rellena ningún hueco.
  const tarjRec    = tarjetaRecarga(human.chips, unit, saldo)
  const topeRec    = topeRecarga(human.chips, unit, saldo)

  // ── ECO-1c · LA RECARGA SE COBRA EN EL SERVIDOR ──────────────────────────
  // Las fichas aparecen CUANDO EL SERVIDOR CONFIRMA (ficha §2.2). Mientras,
  // `recargaVuelo` apaga los botones de la tarjeta y para su plazo; si la red no
  // contesta, se dice y se ofrece reintentar la MISMA recarga (mismo `seq`: no
  // se cobra dos veces), sin tocar las fichas. Un «no» del servidor (sin saldo,
  // sobre el techo) se dice en el subtítulo y la tarjeta sigue abierta.
  //
  // P-2b · TOPE DE 10 S. Pasado `TOPE_RECARGA_MS` sin respuesta —falle la red
  // o se quede colgada—, la tarjeta lo dice, «Reintentar» vuelve a mandar la
  // misma recarga aunque siga en vuelo (`forzar`), y el segundo botón pasa a
  // «Salir con mis fichas». Salir no pierde nada: la salida espera en la cola a
  // la recarga y, si entra, la lleva (P-2a). `tope` no vuelve atrás hasta que
  // el servidor conteste: quien ya vio la salida no la pierde por reintentar.
  // La ✕ no se apaga nunca; en la forzosa la tapa el velo, como antes.
  const [recargaVuelo, setRecargaVuelo] = useState(null)   // { seq, monto, estado: 'enviando'|'red', tope }
  const [recargaFallo, setRecargaFallo] = useState(null)   // el código del último «no»
  // ECO-1d · P-3 · la válvula (K8) encendida y el tope de hoy alcanzado: la
  // recarga no se hace y no hay nada que reintentar. La tarjeta lo dice con su
  // texto y queda como la del caso 3 de REC-2 (sin montos ni primario): en la
  // blanda, seguir sin recargar o «Salir con mis fichas»; en la forzosa, sólo
  // salir. La mesa en curso sigue y se paga completa.
  const sinRecargaHoy = recargaFallo === 'tope_diario'
  const recargaVueloRef = useRef(null)

  function aplicarRecargaEnMesa(monto) {
    // §1 de la ficha: la recarga REUTILIZA `chipsCollect`. Es el sonido de
    // fichas que llegan, y eso es exactamente lo que pasa.
    play('chipsCollect')
    setGame(prev => {
      // §5.3 · ASIENTO POR ASIENTO, y por la puerta del motor. Primero el
      // humano —que es quien fija la referencia— y después cada IA viva, que se
      // COMPLETA HACIA ARRIBA: a la que ya va por encima no se le quita nada,
      // porque la pila de una IA no se reduce por regla, sólo por perder. Las
      // eliminadas no vuelven: `nivelarLasIAS` las deja fuera.
      //
      // `aplicarRecarga` sube también la `entrada` de cada asiento, y eso es lo
      // que hace que la cuenta final siga siendo honesta: lo recargado es dinero
      // PUESTO, no ganado, y `fichasNetas` lo resta como tal.
      let g = aplicarRecarga(prev, ASIENTO_HUMANO, monto)
      for (const { seat, monto: cuanto } of nivelarLasIAS(g)) g = aplicarRecarga(g, seat, cuanto)
      return g
    })
    setRecargaHecha(n => n + 1)
    setRecarga(null)
  }

  function confirmarRecarga(monto) {
    if (!recargaValida(monto, human.chips, unit, saldo).ok) return
    if (recargaVueloRef.current) return
    if (!control) { aplicarRecargaEnMesa(monto); return }
    const seq = control.recargar(monto)
    if (seq === null) return
    recargaVueloRef.current = { seq, monto }
    setRecargaFallo(null)
    setRecargaVuelo({ seq, monto, estado: 'enviando', tope: false })
  }

  function reintentarRecarga() {
    control?.reintentarAhora({ forzar: true })
    setRecargaVuelo(v => (v ? { ...v, estado: 'enviando' } : v))
  }

  const vueloSeq = recargaVuelo?.seq ?? null
  useEffect(() => {
    if (vueloSeq === null) return undefined
    const t = setTimeout(() => {
      setRecargaVuelo(v => (v && v.seq === vueloSeq ? { ...v, tope: true } : v))
    }, TOPE_RECARGA_MS)
    return () => clearTimeout(t)
  }, [vueloSeq])

  useEffect(() => {
    if (!control) return undefined
    return control.suscribir((ev) => {
      const vuelo = recargaVueloRef.current
      if (!vuelo) return
      if (ev.tipo === 'red' && ev.item?.seq === vuelo.seq) {
        setRecargaVuelo(v => (v ? { ...v, estado: 'red' } : v))
        return
      }
      if (ev.tipo !== 'recarga' || ev.seq !== vuelo.seq) return
      recargaVueloRef.current = null
      setRecargaVuelo(null)
      if (ev.ok) aplicarRecargaEnMesa(ev.monto)
      else setRecargaFallo(ev.respuesta?.codigo ?? 'otro')
    })
  }, [control]) // eslint-disable-line react-hooks/exhaustive-deps

  function rechazarRecarga() {
    const eraForzosa = recarga?.motivo === RECARGA.FORZOSA
    setRecarga(null)
    // v1.2 §5.1 · «Rechazarla o dejar vencer el plazo […] termina la mesa y
    // devuelve las fichas al saldo.» Se termina por la MISMA puerta
    // que la ✕ de la cabecera (y que el modal de bancarrota, que salía por ella
    // hasta que ARN-3d lo retiró por inalcanzable), así que las fichas
    // que queden vuelven al bolsillo (§2.5). No se pierde nada por decir que no:
    // se pierde la mano que no se llegó a jugar.
    if (eraForzosa) salir()
  }

  // La pregunta se hace UNA VEZ POR MANO. Sin esta memoria, decir «no» cerraba
  // el panel y el efecto lo volvía a abrir en el render siguiente —la condición
  // que lo dispara sigue siendo verdad—, que es una pregunta que no se puede
  // responder. `handCount` es la identidad de la mano, la misma que `sesionCore`
  // usa para no contar dos veces.
  //
  // Las dos funciones de arriba van DELANTE de los efectos que las llaman, y no
  // por gusto: con la declaración detrás, el compilador de `react-hooks` se
  // rendía con el componente entero y sus DOCE diagnósticos de la familia `refs`
  // desaparecían sin decir palabra. Ver §E-11 del informe.
  const recargaPedidaRef = useRef(-1)

  useEffect(() => {
    if (recarga) return
    if (motivoRec !== RECARGA.AUTOMATICA && motivoRec !== RECARGA.FORZOSA) return
    // §5.1: la automática sale AL TERMINAR UNA MANO. En `WAITING` no terminó
    // ninguna, así que ahí sólo se abre la forzosa —que no es una oferta sino
    // un hecho: con esas fichas no se puede repartir—.
    if (phase === PHASES.WAITING && motivoRec !== RECARGA.FORZOSA) return
    if (recargaPedidaRef.current === game.handCount) return
    recargaPedidaRef.current = game.handCount
    // REC-1 · nace PLEGADA: sin `abierta` y antes de que acabe la revelación
    // no se pinta nada (§5.5.1), y después, burbuja. El reloj se carga aquí a
    // 15 pero NO corre hasta `recargaLista` (el tic de abajo), así que el
    // primer segundo que se ve es el 15 y cae al terminar la revelación.
    setRecarga({ motivo: motivoRec, monto: tarjRec.monto, abierta: false })
    setRecargaSeg(Math.round(plazoRecarga() / 1000))
  }, [motivoRec, phase, game.handCount, recarga]) // eslint-disable-line

  // ── REC-1 · ¿Terminó la revelación? (normativo v1.2 §5.5.1) ─────────────
  // Se deriva de la celebración, que ya sabe cuándo aterriza el vuelo: se
  // anota si llegó a armarse y si después se descargó, y `recargaLista` (pura)
  // decide. Sin vuelo previsto —mano ganada por retiros, o la forzosa entre
  // manos, que no viene de ningún pago— lista en el acto.
  const enPago     = phase === PHASES.PAYOUT
  // VOZ-3 · el nivel de la lectura: el mismo decisor con el principal.
  const vueloMano  = enPago && llevaViaje(lectura?.nivel ?? null)
  const celebrando = !!celebracion.activa
  // Se anota DURANTE el render y no en un efecto: es el molde de React para
  // guardar algo del render anterior, y un `setState` síncrono en un efecto
  // encadena un render de más (`react-hooks/set-state-in-effect`). Converge
  // en una vuelta: cada rama sólo escribe si el valor cambia.
  if (enPago) {
    const mano = game.handCount
    const base = revelacion.mano === mano ? revelacion : { mano, armada: false, descargada: false, red: false }
    let siguiente = base
    if (celebrando && !base.armada) siguiente = { ...base, armada: true }
    else if (!celebrando && base.armada && !base.descargada) siguiente = { ...base, descargada: true }
    if (siguiente !== revelacion) setRevelacion(siguiente)
  }

  // La red: 6 s desde el primer render del pago. Si la celebración no llegó a
  // armarse (sin geometría) o no avisó, la pregunta sale igual y el reloj no se
  // queda colgado. `data-rec-red` lo publica para el arnés.
  useEffect(() => {
    if (!enPago) return
    const mano = game.handCount
    const t = setTimeout(() => {
      setRevelacion(r => (r.mano === mano ? { ...r, red: true } : { mano, armada: false, descargada: false, red: true }))
    }, RED_REVELACION_MS)
    return () => clearTimeout(t)
  }, [enPago, game.handCount])

  const revMano = revelacion.mano === game.handCount ? revelacion : { armada: false, descargada: false, red: false }
  const recListaRevelacion = !enPago || recargaLista({
    vuelo: vueloMano, armada: revMano.armada, descargada: revMano.descargada,
    ms: revMano.red ? RED_REVELACION_MS : 0,
  })
  // La voluntaria la pide el jugador con la mano ya leída: no espera a nada.
  const recLista = !!recarga && (recarga.motivo === RECARGA.VOLUNTARIA || recListaRevelacion)
  const recForma = recLista ? formaRecarga({ seg: recargaSeg, abierta: recarga.abierta, motivo: recarga.motivo }) : null

  // ── VOZ-2 · 1b · La frase desplegada (D3, D10, D12, D13) ─────────────────
  // Abierta = hay resultado, la frase está recortada (si cabe no hay nada que
  // desplegar), se abrió en ESTA mano y no hay tarjeta de recarga encima.
  // D10 · al abrirse la tarjeta —voluntaria, automática o forzosa— la capa se
  // RECOGE: no basta con esconderla mientras la tarjeta esté, porque al plegarla
  // («Ver la mesa») volvería a salir sin que nadie la pidiera. Se anota durante
  // el render, el mismo molde que `revelacion` arriba: converge en una vuelta.
  // La burbuja no la toca (D10): vive en la barra del jugador, fuera del óvalo.
  const tarjetaRecargaAbierta = !!recarga && recForma?.forma === 'tarjeta'
  if (tarjetaRecargaAbierta && vozAbierta !== null) setVozAbierta(null)
  const voz2Abierta = !!resultado && voz2Recortada && vozAbierta === game.handCount && !tarjetaRecargaAbierta
  // Un toque, UNA alternancia (D12). El único manejador de toque es el del
  // óvalo: el texto está dentro y su clic sube hasta él, así que no lleva otro
  // (dos manejadores en la cadena alternarían dos veces y no pasaría nada).
  const alternaVoz2 = () => {
    if (!resultado || !voz2Recortada) return
    setVozAbierta(voz2Abierta ? null : game.handCount)
  }
  const cierraVoz2 = () => setVozAbierta(null)
  // Teclado (D13): Enter y Espacio alternan sobre el texto, que sólo con
  // recorte es un botón. Espacio no desplaza la página.
  const teclaVoz2 = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternaVoz2() }
    else if (e.key === 'Escape') cierraVoz2()
  }
  // Esc cierra desde cualquier sitio, no sólo con el foco en el texto. El
  // `setState` va dentro del manejador, no en el cuerpo del efecto.
  useEffect(() => {
    if (!voz2Abierta) return undefined
    const alPulsar = (e) => { if (e.key === 'Escape') setVozAbierta(null) }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [voz2Abierta])

  // §5.1 · QUINCE SEGUNDOS Y «No» POR DEFECTO. El plazo corre igual en la
  // automática y en la forzosa (v1.2 §5.1: «el mismo plazo de 15 segundos
  // contado desde que termina la revelación»); lo que cambia es lo que
  // significa que venza. Aquí, seguir jugando; allá, levantarse de la mesa con
  // lo que se tenga, que por §2.5 vuelve entero al bolsillo.
  //
  // FRZ-1 · a oscuras NO corre, por la misma razón que el reloj de turno: volver
  // y encontrarse la mesa terminada porque el plazo se consumió en segundo plano
  // es justo el defecto que aquella campaña midió y cerró.
  //
  // REC-1 · y NO corre antes de que termine la revelación (§5.5.1). Es el único
  // cambio del tic: abrir o plegar la tarjeta no lo tocan, así que burbuja y
  // tarjeta leen un solo reloj (§5.5.4).
  useEffect(() => {
    // ECO-1c · y NO corre mientras el servidor contesta una recarga: una
    // forzosa que venciera a mitad de la llamada echaría al jugador de la mesa
    // con su recarga quizá ya cobrada.
    if (!recarga || congelado || !recLista || recargaVuelo) return
    // La voluntaria no tiene plazo: la abrió él y se cierra cuando él quiera.
    if (recarga.motivo === RECARGA.VOLUNTARIA) return
    if (recargaSeg <= 0) return
    // El vencimiento se decide DENTRO del tic, no en el cuerpo del efecto, que
    // es el mismo molde del reloj de turno doce líneas más arriba: un `setState`
    // síncrono aquí encadena un render de más y `react-hooks` lo dice.
    const t = setTimeout(() => {
      const quedan = recargaSeg - 1
      setRecargaSeg(quedan)
      if (quedan <= 0) rechazarRecarga()
    }, 1000)
    return () => clearTimeout(t)
  }, [recarga, recargaSeg, congelado, recLista, recargaVuelo]) // eslint-disable-line

  // ── Discard (secuencial, jugador por jugador en orden Mano→Pie) ───────────
  // Por jugador: cartas vuelan boca abajo hacia el mazo → slots vacíos un
  // instante → reposiciones llegan una a una desde el mazo. ~0,5s por jugador.
  function launchDiscardOut(seat, idx) {
    const key = `${seat}:${idx}`
    setDiscardAnim(prev => prev && ({ ...prev, emptied: new Set(prev.emptied).add(key) }))
    const slotEl = slotRefs[seat][idx]?.current
    const deckEl = deckRefs[gameRef.current.pieIndex]?.current
    if (!slotEl || !deckEl) return
    // TAB-1 · px propios al crear el vuelo (ver `launchFlyingCard`).
    const f = escalaActual()
    const sr = aPropios(slotEl.getBoundingClientRect(), f)
    const dr = aPropios(deckEl.getBoundingClientRect(), f)
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
    const deckEl = deckRefs[gameRef.current.pieIndex]?.current
    const slotEl = slotRefs[seat][idx]?.current
    if (!deckEl || !slotEl) { markRefilled(seat, idx); return }
    // TAB-1 · px propios al crear el vuelo (ver `launchFlyingCard`).
    const f = escalaActual()
    const dr = aPropios(deckEl.getBoundingClientRect(), f)
    const sr = aPropios(slotEl.getBoundingClientRect(), f)
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
      refillTimersRef.current.push(setTimeout(() => {
        setDiscardAnim(prev => prev && ({ ...prev, revealed: new Set(prev.revealed).add(key) }))
        // El flip de la reposición es el volteo: si la carta repuesta del
        // humano es el comodín, suena (leído del ref, no del updater).
        if (comodinActive && isComodin(discardNextRef.current?.players[0].cards[idx])) play('comodin')
      }, 350))
    }
  }

  // FRZ-1 §2.5: secuencia en vuelo, se deja terminar; estado ya sentenciado.
  function startDiscardAnim(g, humanDiscardIndices) {
    const nextGame = applyDiscard(g, humanDiscardIndices)
    discardNextRef.current = nextGame
    // La reentrada se cancela por SECUENCIA, no por carta: una tanda nueva de
    // descartes deja sin sentido los revelados pendientes de la anterior, que
    // escribirían su clave vieja sobre el `revealed` del estado recién creado.
    refillTimersRef.current.forEach(clearTimeout)
    refillTimersRef.current = []
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
    // MES-PvP 3 · contra personas se mandan los índices con la mano; repone el servidor.
    if (partida) { partida.enviar('descartar', { mano: game.handCount, indices: [...game.selectedDiscards] }); return }
    startDiscardAnim(game, [...game.selectedDiscards])
  }

  // ── MES-PvP 3 · La reposición en paralelo (P-3) ───────────────────────────
  // Contra personas el servidor ya repuso: la vista trae las cartas nuevas y cuántas
  // descartó cada uno, y espera `esperaReposicion` (120 + mayor × 595 + 400 ms) a que
  // se vea. Todos reponen a la vez y con vuelos cortos: la secuencia de las IAS, asiento
  // por asiento, no cabe ni con una carta. Salen las cartas de la vista anterior, con su
  // selección (la nueva ya llega vacía, `vistaAMesa`); de un rival solo se sabe cuántas,
  // así que salen sus primeras. Al acabar no se toca el
  // estado: ya es el del servidor. Una carta: 1.100 ms contra 1.115 de espera.
  function startReposicionPvP(previa, next) {
    const cuantas = next.descarte.cuantas ?? []
    const propias = [...previa.selectedDiscards].sort((a, b) => a - b)
    const indicesDe = (seat) => (seat === 0 && propias.length === (cuantas[0] ?? 0)
      ? propias
      : Array.from({ length: cuantas[seat] ?? 0 }, (_, k) => k))
    const plan = next.players.map((_, seat) => ({ seat, indices: indicesDe(seat) })).filter(p => p.indices.length > 0)
    if (plan.length === 0) return
    discardNextRef.current = next
    refillTimersRef.current.forEach(clearTimeout)
    refillTimersRef.current = []
    const allKeys = new Set(plan.flatMap(p => p.indices.map(i => `${p.seat}:${i}`)))
    setDiscardAnim({ nextGame: next, oldGame: previa, allKeys, emptied: new Set(), refilled: new Set(), revealed: new Set() })
    const SALE_MS = 250, SALE_PASO = 40, PAUSA = 50, ENTRA_MS = 400, ENTRA_PASO = 120
    const mayor = Math.max(...plan.map(p => p.indices.length))
    const entra = (mayor - 1) * SALE_PASO + SALE_MS + PAUSA
    // Los vuelos son los del descarte (`launchDiscardOut` / `launchDiscardIn`) con su duración;
    // se crean aquí y no llamándolas: con la llamada, el compilador de `react-hooks` dejaba de
    // ver el acceso adelantado a `startDiscardAnim` del reloj de turno (STOP-V).
    const vuela = (seat, idx, sale) => {
      const slotEl = slotRefs[seat][idx]?.current
      const deckEl = deckRefs[gameRef.current.pieIndex]?.current
      if (sale) setDiscardAnim(prev => prev && ({ ...prev, emptied: new Set(prev.emptied).add(`${seat}:${idx}`) }))
      if (!slotEl || !deckEl) {
        if (!sale) setDiscardAnim(prev => prev && ({ ...prev, refilled: new Set(prev.refilled).add(`${seat}:${idx}`) }))
        return
      }
      const f = escalaActual()
      const sr = aPropios(slotEl.getBoundingClientRect(), f)
      const dr = aPropios(deckEl.getBoundingClientRect(), f)
      const [desde, hasta] = sale ? [sr, dr] : [dr, sr]
      play('cardDeal')
      setFlyingCards(prev => [...prev, {
        id: `${sale ? 'rout' : 'rin'}-${seat}-${idx}`,
        fromX: desde.left, fromY: desde.top, toX: hasta.left, toY: hasta.top, w: hasta.width, h: hasta.height,
        dur: (sale ? SALE_MS : ENTRA_MS) / 1000,
        ...(sale ? { isDiscardOut: true } : { isDiscardIn: true, seat, slotIdx: idx }),
      }])
    }
    const timers = []
    plan.forEach(({ seat, indices }) => indices.forEach((idx, k) => {
      timers.push(setTimeout(() => vuela(seat, idx, true), k * SALE_PASO))
      timers.push(setTimeout(() => vuela(seat, idx, false), entra + k * ENTRA_PASO))
    }))
    const propio = plan.some(p => p.seat === 0)
    timers.push(setTimeout(() => setDiscardAnim(null), entra + (mayor - 1) * ENTRA_PASO + ENTRA_MS + (propio ? 350 : 0) + 50))
    discardTimersRef.current = timers
  }

  // La vista anterior, para saber qué cartas salen y cuándo empieza la reposición. Aquí
  // se fija también el ritmo de la mesa, que escala el reparto como «Partida rápida».
  const previaPvPRef = useRef(null)
  useEffect(() => {
    if (!partida) return
    const previa = previaPvPRef.current
    previaPvPRef.current = game
    factorManoRef.current = partida.factorReparto
    if (game.reponiendo && previa && !previa.reponiendo && previa.handCount === game.handCount) startReposicionPvP(previa, game)
  }, [game]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDiscardPhase = phase === PHASES.DISCARD
  const isPayoutPhase  = phase === PHASES.PAYOUT

  // ── APU-1 §4.2 · LAS CAPAS DEL POZO, Y LA FRASE QUE LAS CUENTA ─────────
  // Sólo en el pago: durante la mano el pozo se enseña entero, que es como se
  // apuesta. `capasDe` lee `contribMano`, que el motor NO resetea al pagar —se
  // resetea en la mano siguiente—, así que en `PAYOUT` la cuenta sigue en pie.
  //
  // VA AQUÍ Y NO ARRIBA, junto al pozo que enseña. Nació trescientas líneas más
  // arriba, al lado de `pozoMostrado`, que es donde temáticamente pertenece —y
  // leía `isPayoutPhase` antes de esta línea. Eso no es un detalle de estilo:
  // es la zona muerta temporal de un `const`, o sea un ReferenceError en cada
  // render de la mesa. No lo cazó ni `vitest` (no hay jsdom) ni el `build` (Vite
  // no lo mira), sino el LINTER —y de la forma más callada posible: el
  // compilador de `react-hooks` dejó de poder compilar el componente y sus
  // dieciocho diagnósticos desaparecieron de golpe. Una vara que BAJA sin que
  // nadie haya arreglado nada es una vara que hay que ir a mirar.
  const capasPozo  = isPayoutPhase ? repartoPorCapas(game) : []
  // VOZ-3 · la cola sale de la lectura: lo de los demás y las devoluciones (D5–D8).
  const capasTexto = isPayoutPhase ? componeCapas(lectura, game.players) : null

  // ── Showdown winner emphasis ──────────────────────────────────────────────
  // Active until "Siguiente mano" (isClearing). Only when the hand reached
  // showdown (winner has a score) — fold-wins reveal nothing.
  // VOZ-3 · el asiento es el PRINCIPAL: la mano en grande, las cartas
  // resaltadas, el chip de puntos y `opp-winner` son los de quien ganó la mano,
  // no los de quien recuperó su vuelto.
  const showdownWinnerSeat =
    isPayoutPhase && !isClearing && lectura && game.players[lectura.principal].score
      ? lectura.principal
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- MOT-1 reescribe este flujo
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- MOT-1 reescribe este flujo
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
  function beginHand() {
    setLastActions({})
    const prev = gameRef.current
    const next = startHand(prev)
    if (next.phase === PHASES.GAME_OVER) {
      setGame(next)
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
  // FRZ-1 §2.5: secuencia en vuelo, se deja terminar; estado ya sentenciado.
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
    clearTimeout(reflowTimerRef.current)
    reflowTimerRef.current = setTimeout(() => setReflowing(false), 600)
    commitNewHand(next)
  }

  // FRZ-1 §2.4 · Aquí está el disparo del reparto: apagar `isShuffling` es lo que
  // pone en marcha la mano nueva. Dos cambios y ninguno más — el reloj gana
  // handle (era uno de los nueve sin él, y la guarda lo exige cancelable) y, si
  // al vencer estamos a oscuras, el disparo se DIFIERE. La duración del barajado
  // no se toca: la baraja sigue durando sus 1950 ms.
  function commitNewHand(next) {
    // CFG-1 1e · «Partida rápida» se lee UNA vez por mano, aquí, del aparato
    // (no del estado del ⋮, que puede ir por delante), y queda congelada en el
    // ref para toda la mano. El barajado de abajo no la mira: sus 1950 ms van
    // sincronizados con `gameTable.css` (protegido) y no cambian.
    factorManoRef.current = factorDeMano(contraIAS, partidaRapida.leer())
    setGame(next)            // cobro del ante visible (saldos descontados, pozo armado)
    setIsShuffling(true)     // baraja sobre el estado ya cobrado
    clearTimeout(barajaTimerRef.current)
    barajaTimerRef.current = setTimeout(() => {
      const reparte = () => setIsShuffling(false)
      if (congeladoRef.current) { diferir(reparte); return }
      reparte()
    }, 1950)
  }

  // ── Card render helpers ───────────────────────────────────────────────────
  function renderOpponentCard(seat, i) {
    if (discardAnim) {
      const key  = `${seat}:${i}`
      const card = (discardAnim.oldGame ?? game).players[seat].cards[i]
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
      const ref = slotRefs[0][i]
      if (discardAnim) {
        const key     = `0:${i}`
        const oldCard = (discardAnim.oldGame ?? game).players[0].cards[i]
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
                onClick={isDiscardPhase && !human.folded
                  ? () => (partida ? partida.alternarDescarte(i) : setGame(prev => toggleDiscard(prev, i)))
                  : undefined}
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
            <div key={`as-${i}`} ref={slotRefs[seat][i]} className={`card-slot-wrapper${rivalWon ? ' card-slot-winner' : ''}`}>
              {renderOpponentCard(seat, i)}
            </div>
          ))}
          <div className="deck-shuffle-wrapper">
            <div
              ref={deckRefs[seat]}
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
        {/* §4.3 · la misma marca por la vía legacy `.ai-zone` de la mesa de 2.
            Las dos rutas de render del rival llevan la misma línea y el mismo
            orden —retirado, all-in, turno, última acción— porque son la misma
            regla contada dos veces por una división que es de layout, no de
            producto. Aquí el hueco mide 726 px: sobra sitio. */}
        {(isPortraitTable || isDesktopTable) && (
          <span className={`opp-status${turnSeat === seat ? ' opp-status-turn' : ''}${(partida ? rival.estado.tipo === 'allin' : marcadoAllIn(rival)) && !inReset ? ' opp-status-allin' : ''}`}>
            {/* MES-PvP 3 · contra personas manda `estadoDeAsiento`; «En anuncio» y «Abandonó» se
                ven también en el pago, que es cuando ocurren. */}
            {inReset || (isPayoutPhase && rival.score && !(partida && ['anuncio', 'abandono', 'recarga'].includes(rival.estado.tipo)))
              ? ' '
              : partida
                ? (rival.estado.texto || ' ')
                : rival.folded
                ? 'Se retiró'
                : marcadoAllIn(rival)
                  ? t('ia.mesa.marca.allin')
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
        rotulo={partida ? game.players[seat].estado : null}
        renderCard={i => renderOpponentCard(seat, i)}
        score={game.players[seat].score}
        showScore={isPayoutPhase && !inReset}
        resetting={inReset}
        slotRefs={slotRefs[seat]}
        deckRef={deckRefs[seat]}
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

  // VOZ-2 · El contenido del `<p>` del óvalo, UNO para sus dos rutas
  // (center-zone y two-ovals), como `claseDelMensaje` (MSG-U1). Con resultado
  // el texto va dentro de `.voz2-texto`, que es quien recorta (voz2.css): el
  // `<p>` no cambia de caja ni de clases. Sin resultado —crónica, descarte— el
  // marcado es exactamente el de antes de VOZ-2: el texto a pelo.
  //
  // 1b · Con recorte el texto es además un BOTÓN para la accesibilidad (D13):
  // `role`, `tabIndex`, `aria-expanded` y `aria-controls` (la capa). Sin
  // recorte no lleva ninguno de los cuatro. Lo que cambia con el recorte son
  // ATRIBUTOS: los elementos son los mismos y la geometría también.
  // El indicio de toque (Victor: «…» + flechita de oro) es un hermano del texto
  // que existe siempre que hay resultado y sólo se VE con recorte y recogida
  // (voz2.css lo decide por los atributos del texto). Va fuera de flujo: el
  // `<p>` no cambia de caja. Lo coloca `useVoz2Recorte`, que ya mide.
  function contenidoFrase(texto) {
    if (!resultado) return texto
    const boton = voz2Recortada
      ? { role: 'button', tabIndex: 0, 'aria-expanded': voz2Abierta, 'aria-controls': voz2CapaId, onKeyDown: teclaVoz2 }
      : null
    return (
      <>
        <span ref={voz2Ref} className="voz2-texto" data-voz2-recortada={voz2Recortada ? '1' : undefined} {...boton}>
          {texto}
        </span>
        <svg className="voz2-indicio" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          <path d="M2 3.2 L5 6.6 L8 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </>
    )
  }

  // VOZ-2 · 1b · El toque del óvalo (D12). La zona es el óvalo ENTERO, y sólo
  // con resultado y con la frase recortada: sin esas dos, el manejador ni se
  // pone. Va en el JSX y ninguna regla CSS apunta al óvalo (D1). El nombre de
  // los rivales no es hijo del óvalo, así que su toque no llega aquí: en la
  // frontera gana él por construcción.
  const toqueOvaloVoz2 = resultado && voz2Recortada ? alternaVoz2 : undefined

  function renderCenterZone() {
    // MSG-U1/MSG-U2 · en resultado manda `resultadoCore`; fuera de él, la
    // crónica compuesta por `cronicaCore` con su estilo por tipo de acción
    // (Tanda C4.3). Una sola función de clase para las dos rutas — el aviso del
    // censo, saldado. Ninguna de las dos ramas lee ya `game.message`.
    // §4.2 · la cola de capas se AÑADE al resultado, no lo sustituye: quien ganó
    // la mano sigue siendo la cabeza de la frase y lo que se suma es el resto
    // del dinero, que es justo lo que el jugador no puede deducir mirando.
    const centerMsg  = resultado ? [resultado.texto, capasTexto].filter(Boolean).join(' ') : (discardMsg ?? cronica)
    const actionKind = resultado ? null : messageActionKind(centerMsg)
    const msgClass   = claseDelMensaje(resultado, centerMsg)
    return (
      <section className="center-zone" onClick={toqueOvaloVoz2}>
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
            <p className={`game-message${msgClass}`} data-tono={resultado?.tono ?? ''} data-capas={capasPozo.length} key={actionKind ? centerMsg : 'msg'}>
              {contenidoFrase(centerMsg)}
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
    // §4.2 · la cola de capas se AÑADE al resultado, no lo sustituye: quien ganó
    // la mano sigue siendo la cabeza de la frase y lo que se suma es el resto
    // del dinero, que es justo lo que el jugador no puede deducir mirando.
    const centerMsg  = resultado ? [resultado.texto, capasTexto].filter(Boolean).join(' ') : (discardMsg ?? cronica)
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
        <section className="felt-oval oval-right" onClick={toqueOvaloVoz2}>
          <p className={`game-message${msgClass}`} data-tono={resultado?.tono ?? ''} data-capas={capasPozo.length} key={actionKind ? centerMsg : 'msg'}>
            {contenidoFrase(centerMsg)}
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
      {/* ── AFIDÁVITS DE APU-1 PARA EL ARNÉS ────────────────────────
          Mismo molde que `data-tono` (U3): un atributo no mueve un píxel y
          permite verificar un hecho sin leer prosa ni deducirlo de la pantalla.

          `data-clavada` es el más importante de los tres y ojalá valga siempre
          `0`: dice que la fase de apuesta abierta no tiene un solo asiento que
          pueda hablar. Es D-12, y el arnés lo vigila en cada mano que juega
          porque es la única forma de que, si alguna vez ocurre, salga en un
          informe y no en un jugador mirando una mesa que no avanza. */}
      <section
        className={`game-table${aliveN >= 4 ? ' table-wide' : ''}${aliveN === 5 ? ' table-five' : ''}${aliveN === 4 ? ' table-four' : ''}${aliveN === 3 ? ' table-three' : ''}${aliveN === 2 ? ' table-two' : ''}`}
        data-clavada={mesaClavada(game) ? '1' : '0'}
        data-recargas={recargaHecha}
        data-rec-motivo={recarga?.motivo}
        data-rec-lista={recarga ? (recLista ? 1 : 0) : undefined}
        data-rec-red={enPago && vueloMano && revMano.red && !(revMano.armada && revMano.descargada) ? 1 : undefined}
        data-allin={game.players.filter(marcadoAllIn).length}
      >

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
            /* §2.5 · `netas` se mide CONTRA LA ENTRADA, ya no contra los 5.000 de
               `economy.saldoInicial`. Con las entradas de APU-1 esa resta había
               pasado a mentir en las dos direcciones: quien entra con 750 y se
               levanta con 900 había «perdido 4.100». `entrada` la escribe el
               motor al sentar el asiento y la sube cada recarga, así que una
               mesa con segundo round también cuadra. */
            <>
            <PantallaVictoria
              sesion={sesion}
              netas={fichasNetas(human.chips, human.entrada)}
              saldo={control ? saldoFinal : partida ? saldo : human.chips}
              puntos={sesion.puntos}
              precedente={precedenteToc}
              onLeave={salir}
              listoRanking={listoRanking}
              abrirRanking={abrirRanking}
              frase={finPvP?.frase ?? null}
            />
            {/* RNK-1d · tu tarjeta, sin `onNoHay`: si el banco no te tiene, las
                líneas dicen «No se pudo cargar el ranking.» y la tarjeta se queda. */}
            {perfilVictoria && apiRanking && (
              <MiniPerfil
                api={apiRanking}
                username={cuenta?.username ?? ''}
                inicial={inicialDe(cuenta?.username ?? '')}
                propio
                correo={cuenta?.correo ?? ''}
                onCerrar={cerrarRanking}
              />
            )}
            </>
          ) : (
          <div className="game-over-screen">
            {/* MSG-U1 · el TEXTO sale del compositor, no del motor; desde
                REN-2 tampoco el de la rama sin resultado (`cronica`).
                Lo que cambia es el tono: el oro de marca queda RESERVADO a la
                victoria; la derrota pasa a neutro sobrio. Antes las dos se
                pintaban en el mismo oro, sin consultar winner para nada. */}
            {/* MES-PvP 3-A · contra personas: la frase por cómo terminó y, debajo, el
                resultado, en rojo si es negativo (Reglas v1.7 §8.3). Sin lluvia: la lluvia es
                de `PantallaVictoria`. Forma mínima hasta la lámina L-M. */}
            {finPvP ? (
              <>
                <p className="game-over-msg game-over-msg-neutro" data-tono={finPvP.tono} data-caso={finPvP.caso}>
                  {finPvP.frase}
                </p>
                <p className="pvp-fin-cifra" data-tono={finPvP.tono}>{finPvP.cifra}</p>
              </>
            ) : (
              <p
                className={`game-over-msg${resultado?.tono === 'neutro' ? ' game-over-msg-neutro' : ''}`}
                data-tono={resultado?.tono ?? ''}
              >
                {resultado ? resultado.texto : cronica}
              </p>
            )}
            <SoundButton className="btn btn-primary" onClick={salir}>Salir de la mesa</SoundButton>
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
                ref={deckHumano}
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
              {/* REC-1 · con una recarga pendiente tampoco se ofrece «Iniciar
                  mano». La forzosa entre manos (v1.2 §5.1) la tapaba el velo de
                  la tarjeta; como burbuja no hay velo y el botón quedaría vivo al
                  lado de la ranura reservada, ofreciendo repartir con una pila
                  que no cubre el ante. Mismo gate que «Siguiente mano». */}
              {/* MES-PvP 3 · contra personas la mano arranca sola: ni este botón ni «Siguiente mano». */}
              {!partida && phase === PHASES.WAITING && !isShuffling && !recarga && (
                <div className="action-area">
                  {/* PAN-1 1c · R4: dentro de la mesa, la pantalla completa solo
                      vuelve aquí y en «Siguiente mano», síncrona y lo primero. */}
                  <SoundButton className="btn btn-primary" onClick={() => {
                    reentrarPantallaCompleta(document, window)
                    beginHand()
                  }}>
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

              {/* §4.3 · EL HUMANO EN ALL-IN TAMBIÉN VA MARCADO, y su marca no es un
                  badge: es esta línea. Un rival en all-in se reconoce porque su
                  ranura de estado lo dice; el humano no tiene ranura, tiene la
                  fila de botones — y en all-in la fila está vacía. Sin esto ve
                  «La IA está pensando…» y ninguna explicación de por qué a él no
                  le toca, que es exactamente el momento en que hay que decirle
                  que sus cartas siguen jugando por lo que ya puso. Ocupa el
                  mismo hueco que el «pensando» al que releva: ni una caja más. */}
              {isBetPhase && marcadoAllIn(human) && (
                <div className="action-area thinking" data-accion="allin-humano">
                  {t('ia.mesa.humano.allin')}
                </div>
              )}

              {isBetPhase && !marcadoAllIn(human) && !humanIsTurn && !human.folded && !game.players[game.activePlayerIndex].folded && (
                <div className="action-area thinking">
                  {partida
                    ? t('pvp.mesa.pensando', { nombre: game.players[game.activePlayerIndex].name })
                    : numPlayers === 2
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
                    {/* §3.1 · el gris del multiplicador también lo dice el árbitro.
                        `val > playerChips` preguntaba si la pila cubre el MONTO, y
                        el monto no es lo que cuesta: subir cuesta la diferencia con
                        lo ya puesto, no el multiplicador entero, así que un ×10 que
                        sí se podía pagar salía en gris. `multiplicadoresDe` le
                        pregunta a la acción que ese multiplicador va a servir. */}
                    {mults.map((m) => (
                      <SoundButton
                        key={m.k}
                        className={`btn btn-mult${betAmount === m.monto ? ' btn-mult-active' : ''}`}
                        onClick={() => setBetAmount(m.monto)}
                        disabled={!m.disponible}
                      >
                        ×{m.k}
                      </SoundButton>
                    ))}
                  </div>
                  <div className="action-buttons">
                    {puedeHacer('pasar')   && <SoundButton className="btn btn-pass"  data-accion="pasar"   onClick={() => act('pasar')}>Pasar</SoundButton>}
                    {puedeHacer('apostar') && <SoundButton className="btn btn-bet"   data-accion="apostar" onClick={() => act('apostar')}>Apostar {betAmount}</SoundButton>}
                    {puedeHacer('igualar') && <SoundButton className="btn btn-call"  data-accion="igualar" onClick={() => act('igualar')}>Igualar ({toCall})</SoundButton>}
                    {/* §4.1 · EN EL SITIO DE «Igualar», y no al lado. Es el botón de
                        PAGAR cuando la pila no llega: hereda `btn-call` —el verde
                        del pago, y con él el `order: -1` que gameTable.css le da en
                        las mesas anchas— y añade lo suyo en `apu.css`, que es hoja
                        nueva. Ninguna regla se escribe en la protegida. */}
                    {puedeHacer('allIn')   && <SoundButton className="btn btn-call btn-allin" data-accion="allin" onClick={() => act('allIn')}>{t('ia.mesa.allin', { hc: costoAccion('allIn') })}</SoundButton>}
                    {puedeHacer('subir')   && <SoundButton className="btn btn-raise" data-accion="subir"   onClick={() => act('subir')}>Subir a {raiseTo}</SoundButton>}
                    {puedeHacer('retirarse') && <SoundButton className="btn btn-fold" data-accion="retirarse" onClick={() => act('retirarse')}>Retirarse</SoundButton>}
                  </div>
                </div>
              )}

              {isBetPhase && human.folded && (
                <div className="action-area thinking">{partida ? t(human.recarga === 'fuera' ? 'pvp.asiento.fuera' : 'pvp.mesa.retirado') : 'Te retiraste — los rivales siguen jugando…'}</div>
              )}

              {isDiscardPhase && !discardAnim && !human.folded && !yaDescarte && (
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
                <div className="action-area thinking">{partida ? t('pvp.mesa.descartan') : 'Los rivales descartan…'}</div>
              )}

              {isDiscardPhase && !discardAnim && !human.folded && yaDescarte && (
                <div className="action-area thinking">{t('pvp.mesa.espera')}</div>
              )}

              {isDiscardPhase && discardAnim && (
                <div className="action-area thinking">Reponiendo…</div>
              )}

              {/* C4.5: durante la salida digna (ceremony) no se ofrece
                  "Siguiente mano" — la mesa no continúa. */}
              {/* §5.1 · LA QUINTA CONDICIÓN DEL GATE. «Bloquea Siguiente mano», dice
                  el normativo, y no es un detalle de cortesía: la recarga sólo
                  existe ENTRE manos, así que dejar el botón vivo mientras la
                  pregunta está abierta es ofrecer la única acción que la anula. */}
              {!partida && isPayoutPhase && !isClearing && !isShuffling && !ceremony && !recarga && (
                <div className="action-area">
                  {/* FRZ-1 §2.4 · El otro extremo del arranque de mano. Handle
                      para poder cancelarlo, y si al vencer estamos a oscuras la
                      mano nueva se difiere ENTERA —`isClearing` incluido— para
                      que la mesa no vuelva a ofrecer el botón en segundo plano.
                      Solo alcanzable ocultándose dentro de los 300 ms
                      siguientes al clic; se guarda igual porque la ventana
                      existe. */}
                  <SoundButton className="btn btn-primary" onClick={() => {
                    reentrarPantallaCompleta(document, window)  // PAN-1 1c · R4
                    setIsClearing(true)
                    setGame(prev => ({ ...prev, message: '', winner: null }))
                    clearTimeout(siguienteManoTimerRef.current)
                    siguienteManoTimerRef.current = setTimeout(() => {
                      const sigue = () => {
                        setIsClearing(false)
                        beginHand()
                      }
                      if (congeladoRef.current) { diferir(sigue); return }
                      sigue()
                    }, esperaSiguienteMano())  // L-M 3 · §2 · la recogida (300 ms hasta hoy)
                  }}>
                    Siguiente mano
                  </SoundButton>
                  {/* §5.1 · la VOLUNTARIA: «el jugador la pide entre manos, cuando
                      quiera». Sólo se monta cuando de verdad hay algo que
                      recargar —`pideRecarga` devuelve `NINGUNA` sin bolsillo o
                      con la pila ya en el techo—, porque un botón que no puede
                      hacer nada es peor que ninguno. */}
                  {motivoRec === RECARGA.VOLUNTARIA && (
                    <SoundButton className="btn btn-recarga" data-accion="recargar" onClick={() => {
                      setRecarga({ motivo: RECARGA.VOLUNTARIA, monto: tarjRec.monto, abierta: true })
                      setRecargaSeg(0)
                    }}>
                      {t('ia.recarga.pedir')}
                    </SoundButton>
                  )}
                </div>
              )}

              {/* O1 · LA CAJA SE RESERVA TAMBIÉN CON LA RECARGA ABIERTA. La quinta
                  condición del gate quita «Siguiente mano» mientras la pregunta
                  vive, y sin este `|| recarga` no quedaba nadie pintando esa
                  ranura: la barra del jugador la perdía entera y todo lo de al
                  lado se movía justo cuando el dedo va hacia los botones del
                  panel. Es la misma regla que ya cubría el barajado y la
                  ceremonia de eliminación, con un caso más. */}
              {((isPayoutPhase && isClearing) || ceremony || !!recarga) && (
                <div className="action-area rec-ranura">
                  {/* REC-1 · la burbuja vive DENTRO de la ranura que O1 ya
                      reservaba, en absoluto (rec.css): la ranura no cambia de
                      tamaño y no se mueve nada (normativo v1.2 §5.5.2). */}
                  {recForma?.forma === 'burbuja' && (
                    <BurbujaRecarga
                      motivo={recarga.motivo}
                      seg={recargaSeg}
                      total={Math.round(plazoRecarga() / 1000)}
                      onAbrir={() => setRecarga(abrirRecarga)}
                    />
                  )}
                </div>
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
          duration={fc.fast ? 0.75 : (fc.dur ?? VUELO_REPARTO_S)}
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
        etiquetaMano={etiquetaConsulta(consultas.estado, mesaServidor, game.handCount)}
        manoDisponible={manoDisponible}
        onManoActual={pedirManoActual}
        rapida={rapida}
        onRapida={alternarRapida}
        vivas={isDesktopTable ? VIVAS_ESCRITORIO : VIVAS_MOVIL}
        // El CSS no puede elegir QUÉ componente monta React —la doctrina que
        // abre este archivo en su hook de orientación—, así que la ausencia de
        // «Partida rápida» contra humanos se decide aquí (CFG-1 1e, INV-70).
        // `null` = montan todas.
        presentes={presentesDe(contraIAS)}
      />

      {/* DSK-U3 · popup del valor de "Mano actual". Vive AQUÍ y no dentro del
          panel porque la entrada cierra al ejecutar: cuando esto se pinta, el
          panel ya se desmontó con su ancla. Overlay puro, Δ=0. */}
      {/* MOV-1b-a · monta en las dos pieles. Su piel móvil son las diez reglas
          copiadas en menuMovil.css; su colocación, D6. */}
      <ManoActualPopup popup={consultas.popup} />

      {/* CFG-1 1e · la confirmación del primer cobro de la sesión (§0-4). Va
          por portal a `body`, como «Eliminar cuenta»: fuera de la escala de la
          mesa y con `#root` inerte mientras pregunta. */}
      {consultas.confirmacion && (
        <ConfirmarConsulta
          precio={consultas.confirmacion.precio}
          onConsultar={consultas.confirmar}
          onCancelar={consultas.cancelar}
        />
      )}

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

      {/* VOZ-2 · 1b · la frase entera, desplegada. Hermana de la mesa y `fixed`,
          molde `.vc-capa` (D2); z 20, por debajo del vuelo de la celebración, que
          va justo detrás (D9). Montada mientras la frase esté recortada: es el destino
          del `aria-controls` del texto (D13). */}
      {resultado && voz2Recortada && (
        <Voz2Capa
          id={voz2CapaId}
          texto={[resultado.texto, capasTexto].filter(Boolean).join(' ')}
          abierta={voz2Abierta}
          onCerrar={cierraVoz2}
        />
      )}

      {/* DSK-VC2 · celebración de mesa. Hermanas del área, como el panel de
          utilidades y las burbujas: overlays puros `fixed`, jamás dentro de un
          panel. Δ=0 por construcción — no ocupan una celda del flujo. */}
      {/* L-M 3 · §2 · la transición entre manos, en las dos mesas: contra las IAS, al pulsar
          «Siguiente mano»; contra personas, al final de la pausa entre manos. */}
      <TransicionMano game={game} recoger={!partida && isPayoutPhase && isClearing} recogerA={partida ? recogerEnPvP(game.vencimiento, partida.desfase ?? 0) : null} />
      <CelebracionMesa activa={celebracion.activa} />
      <AjileiOverlay activa={celebracion.activa} />

      {/* Confirmación abandonar mesa */}
      {confirmLeave && (
        <div className="leave-overlay" onClick={() => setConfirmLeave(false)}>
          <div className="leave-modal" onClick={e => e.stopPropagation()}>
            <p className="leave-modal-title">{partida ? t('pvp.salir.titulo') : '¿Abandonar la mesa?'}</p>
            <p className="leave-modal-sub">{partida ? t('pvp.salir.texto') : 'Perderás el progreso de esta mano.'}</p>
            <div className="leave-modal-actions">
              <SoundButton className="btn btn-pass" onClick={() => setConfirmLeave(false)}>
                Cancelar
              </SoundButton>
              <SoundButton
                className="btn btn-fold"
                onClick={() => {
                  // TODO: sync balance to Supabase (Step 7)
                  setConfirmLeave(false)
                  // MES-PvP 3 · contra personas se deja el asiento; la salida la da la vista.
                  if (partida) partida.enviar('abandonar')
                  else salir()
                }}
              >
                {partida ? t('pvp.salir.si') : 'Abandonar mesa'}
              </SoundButton>
            </div>
          </div>
        </div>
      )}

      {/* ── APU-1 §5 · LA RECARGA ────────────────────────────────
          Hereda la CAJA del modal de bancarrota —`bankrupt-overlay`/`-modal`/
          `-title`/`-sub`/`-actions`, que gameTable.css ya define y que §5.4
          señala como la superficie a reemplazar— y añade lo suyo en `apu.css`,
          que es hoja NUEVA. Así la lámina es la que Victor ya aprobó para un
          modal bloqueante de esta mesa y no hay una regla en hoja protegida.

          Los tres montos tienen la misma forma que los de la entrada (§5.2: «se
          elige como una entrada») y se APAGAN en vez de esconderse: es E-2 otra
          vez —una fila que cambia de número de botones mueve lo que hay debajo
          justo cuando el dedo va bajando—. */}
      {/* REC-1 · la tarjeta se MONTA sólo cuando su forma es tarjeta. Mientras
          es burbuja, o antes de que acabe la revelación, el overlay no existe:
          se desmonta, no se esconde, porque el cronómetro lleva `visibility`
          en línea y sobreviviría a un `visibility: hidden` heredado (Fase 0
          §J-8). Sin overlay no hay velo y la mesa queda tocable (§5.5.3). */}
      {recarga && recForma?.forma === 'tarjeta' && (
        <div
          className={`bankrupt-overlay${recarga.motivo === RECARGA.FORZOSA ? '' : ' apu-suave'}`}
          data-accion="recarga"
          data-motivo={recarga.motivo}
          data-plegable={recForma.plegable ? '1' : '0'}
          data-rec-caso={tarjRec.caso}
        >
          <div className="bankrupt-modal apu-recarga">
            <p className="bankrupt-title">{t('ia.recarga.titulo')}</p>
            <p className="bankrupt-sub" data-accion="recarga-sub" data-rec-servidor={recargaVuelo?.tope ? 'tope' : recargaVuelo?.estado ?? (sinRecargaHoy ? 'tope_diario' : recargaFallo ? 'no' : '')}>
              {recargaVuelo?.tope
                ? t('ia.recarga.error.tope')
                : sinRecargaHoy
                ? t(recarga.motivo === RECARGA.FORZOSA ? 'ia.recarga.error.tope_diario.forzosa' : 'ia.recarga.error.tope_diario')
                : recargaVuelo?.estado === 'red'
                ? t('ia.recarga.error.red')
                : recargaFallo
                  ? t(recargaFallo === 'saldo_insuficiente' ? 'ia.recarga.error.saldo' : 'ia.recarga.error.otro')
                  : recarga.motivo === RECARGA.FORZOSA
                ? t(tarjRec.caso === CASOS_RECARGA.SIN_SALDO ? 'ia.recarga.sub.sinsaldo' : 'ia.recarga.sub.forzosa')
                : recarga.motivo === RECARGA.AUTOMATICA
                  ? t('ia.recarga.sub.automatica', { hc: human.chips })
                  : t('ia.recarga.sub.voluntaria', { hc: topeRec })}
            </p>

            {/* REC-2 · la fila sólo existe en el caso 1. En el 2 la sustituye el
                primario —un único monto, todo el saldo usable—, y en el 3 no hay
                nada que ofrecer. Dentro del caso 1 sigue valiendo E-2: los tres
                están siempre y los inalcanzables se apagan (v1.3 §5.2). */}
            {tarjRec.caso === CASOS_RECARGA.FILA && !sinRecargaHoy && (
            <div className="apu-montos">
              {tarjRec.opciones.map((o) => (
                <SoundButton
                  key={o.id}
                  className={`btn btn-mult apu-monto${recarga.monto === o.monto ? ' btn-mult-active' : ''}`}
                  data-accion="recarga-monto"
                  disabled={o.disabled || !!recargaVuelo}
                  onClick={() => setRecarga(r => ({ ...r, monto: o.monto }))}
                >
                  {t(`ia.recarga.opcion.${o.id}`, { hc: o.monto })}
                </SoundButton>
              ))}
            </div>
            )}

            {/* 1f-A4 · Aquí vivía la nota de §5.3, en su propio renglón. La
                promesa se dice ahora en el SUBTÍTULO de las dos recargas
                blandas (A3), que siempre se pinta; este párrafo sólo se veía en
                escritorio y repetía la misma frase dos renglones más abajo
                (E-31). Se retira con su clave y con sus reglas de `apu.css`. */}

            <div className="bankrupt-actions">
              {/* REC-2 · sin monto no hay primario (caso 3): la tarjeta es de
                  sólo salida. En el caso 2 el primario dice «todo» cuando es
                  todo el saldo usable, y lleva la nota debajo; si lo cortara el
                  techo —rama defensiva, ver `tarjetaRecarga`— dice la cifra. */}
              {tarjRec.caso === CASOS_RECARGA.FILA && !sinRecargaHoy && (
                <SoundButton
                  className="btn btn-primary"
                  data-accion="recarga-si"
                  disabled={(recargaVuelo?.estado === 'enviando' && !recargaVuelo.tope) || (!recargaVuelo && !recargaValida(recarga.monto, human.chips, unit, saldo).ok)}
                  onClick={() => (recargaVuelo ? reintentarRecarga() : confirmarRecarga(recarga.monto))}
                >
                  {recargaVuelo
                    ? t(recargaVuelo.estado === 'red' || recargaVuelo.tope ? 'ia.recarga.reintentar' : 'ia.recarga.enviando')
                    : t('ia.recarga.si', { hc: recarga.monto })}
                </SoundButton>
              )}
              {tarjRec.caso === CASOS_RECARGA.TODO && !sinRecargaHoy && (
                <div className="rec-todo">
                  <SoundButton
                    className="btn btn-primary"
                    data-accion="recarga-si"
                    disabled={(recargaVuelo?.estado === 'enviando' && !recargaVuelo.tope) || (!recargaVuelo && !recargaValida(recarga.monto, human.chips, unit, saldo).ok)}
                    onClick={() => (recargaVuelo ? reintentarRecarga() : confirmarRecarga(recarga.monto))}
                  >
                    {recargaVuelo
                      ? t(recargaVuelo.estado === 'red' || recargaVuelo.tope ? 'ia.recarga.reintentar' : 'ia.recarga.enviando')
                      : t(tarjRec.todo ? 'ia.recarga.si.todo' : 'ia.recarga.si', { hc: recarga.monto })}
                  </SoundButton>
                  {tarjRec.todo && <p className="rec-todo-nota" data-accion="recarga-nota">{t('ia.recarga.todo.nota')}</p>}
                </div>
              )}
              {recargaVuelo?.tope ? (
                <SoundButton className="btn btn-pass" data-accion="recarga-salir" onClick={salir}>
                  {t('ia.recarga.no.forzosa')}
                </SoundButton>
              ) : sinRecargaHoy && recarga.motivo !== RECARGA.FORZOSA ? (
                <>
                  <SoundButton className="btn btn-pass" data-accion="recarga-no" onClick={rechazarRecarga}>
                    {t('ia.recarga.seguir')}
                  </SoundButton>
                  <SoundButton className="btn btn-pass" data-accion="recarga-salir" onClick={salir}>
                    {t('ia.recarga.no.forzosa')}
                  </SoundButton>
                </>
              ) : (
                <SoundButton className="btn btn-pass" data-accion="recarga-no" disabled={!!recargaVuelo} onClick={rechazarRecarga}>
                  {recarga.motivo === RECARGA.FORZOSA ? t('ia.recarga.no.forzosa') : t('ia.recarga.no')}
                </SoundButton>
              )}
            </div>

            {/* O1 · el plazo RESERVA su renglón aunque la voluntaria no lo use: sin
                la reserva, los dos botones de arriba bailarían 20 px entre una
                forma de la pregunta y otra.
                REC-1 · el renglón pasa a FILA: el cronómetro a la izquierda y, a
                su derecha, «Ver la mesa» mientras la tarjeta se pueda plegar
                (v1.2 §5.4). La fila no hereda `visibility` de nadie: el
                cronómetro conserva su estilo en línea y el botón se monta o no.
                La fila de la automática y la forzosa guarda el alto del botón
                aunque no esté (rec.css), para que a los 5 s, cuando se va, la
                tarjeta no cambie de tamaño. */}
            <div className={`apu-plazo-fila${recarga.motivo === RECARGA.VOLUNTARIA ? '' : ' rec-plazo-fila'}`}>
              <p className="apu-plazo" data-accion="recarga-plazo" style={{ visibility: recarga.motivo === RECARGA.VOLUNTARIA ? 'hidden' : 'visible' }}>
                {t('ia.recarga.plazo', { s: Math.max(0, recargaSeg) })}
              </p>
              {recForma.plegable && (
                <SoundButton
                  type="button"
                  className="btn rec-ver-mesa"
                  data-accion="recarga-ver-mesa"
                  onClick={() => setRecarga(r => plegarRecarga(r, recargaSeg))}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  {t('ia.recarga.vermesa')}
                </SoundButton>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
