import { getBestSuitScore, isAjilei } from './handEvaluator.js'

// Local copy to avoid circular import with gameEngine.js (which also exports maxDiscard)
function _maxDiscard(numPlayers) {
  return numPlayers <= 4 ? 5 : 3
}

// ── Personality profiles ──────────────────────────────────────────────────────
// openMin: minimum score to open betting (no bet yet)
// callMin: minimum score to call/stay in
// raiseMin: minimum score to raise
// noise: fraction of threshold randomised per decision (IMPREDECIBLE only)

const PROFILE_NAMES = ['CONSERVADORA', 'EQUILIBRADA', 'AGRESIVA', 'IMPREDECIBLE']

const PROFILES = {
  CONSERVADORA: { openMin: 32, callMin: 22, raiseMin: 40, noise: 0 },
  EQUILIBRADA:  { openMin: 28, callMin: 18, raiseMin: 34, noise: 0 },
  AGRESIVA:     { openMin: 22, callMin: 13, raiseMin: 28, noise: 0 },
  IMPREDECIBLE: { openMin: 28, callMin: 18, raiseMin: 34, noise: 0.15 },
}

// ── Personality module state ──────────────────────────────────────────────────
// Keyed by seat index → profile name.  Re-initialised on new session detection.

let _assignments    = null   // { [seatIndex]: profileName }
let _lastNumPlayers = 0
let _lastHandCount  = -1     // -1 = never seen; tracks session boundary

function _shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Public — also called directly by tests
export function initPersonalities(numPlayers) {
  const numAIs   = numPlayers - 1       // seat 0 is the human
  const shuffled = _shuffled(PROFILE_NAMES)
  _assignments    = {}
  _lastNumPlayers = numPlayers
  for (let i = 0; i < numAIs; i++) {
    _assignments[i + 1] = shuffled[i]  // AI seats: 1 … N-1
  }
}

// Returns the profile name for a given AI seat (null if not yet initialised)
export function getPersonalityName(aiIndex) {
  return _assignments ? (_assignments[aiIndex] ?? null) : null
}

// Resets all module state — for test isolation only
export function _resetForTesting() {
  _assignments    = null
  _lastNumPlayers = 0
  _lastHandCount  = -1
}

function _ensurePersonalities(state) {
  const isNewSession = state.handCount === 0 && _lastHandCount > 0
  if (_assignments === null || state.numPlayers !== _lastNumPlayers || isNewSession) {
    initPersonalities(state.numPlayers)
  }
  _lastHandCount = state.handCount
}

// Apply ±noise% variance to a threshold — called once per decision, not at assignment
function _jitter(value, noise) {
  if (noise === 0) return value
  const factor = 1 + (Math.random() * 2 - 1) * noise
  return value * factor
}

// ── Core decision functions ───────────────────────────────────────────────────

export function decideBetAction(state, aiIndex) {
  const { players, currentBet, phase, manoIndex, pieIndex, numPlayers, unit } = state
  const ai = players[aiIndex]

  if (ai.folded) return { action: 'pasar' }

  // C4.4: el comodín/valor/ajilei dependen de los jugadores VIVOS, no del tamaño
  // fijo. Solo se reconecta el conteo; la estrategia (umbrales) no cambia.
  const ruleN = state.aliveCount ?? numPlayers
  const comodinEnabled = ruleN >= 4
  const { points: score } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)
  const toCall = currentBet - ai.contrib

  // Engine will force-fold if chips < toCall, but we mirror it here for safety
  if (toCall > 0 && ai.chips < toCall) return { action: 'retirarse' }

  // Saldo (defensa en profundidad): solo intentar 'subir' si alcanza para el
  // monto TOTAL de la subida (toCall + unit). Si no, se degrada a 'igualar'
  // (la igualada ya está garantizada por la guarda de arriba). No se intenta
  // ninguna acción impagable; el motor es la garantía dura de saldo ≥ 0.
  const canAffordRaise = ai.chips >= toCall + unit

  // Ajilei always plays aggressively regardless of profile
  if (isAjilei(ai.cards, ruleN)) {
    return { action: currentBet > 0 ? 'subir' : 'apostar' }
  }

  _ensurePersonalities(state)
  const profile = PROFILES[_assignments[aiIndex]]

  // ── Threshold adjustments ─────────────────────────────────────────────────
  // More active opponents → raise the bar (each extra opponent adds 2 pts)
  const activeOpponents = players.filter((p, i) => i !== aiIndex && !p.folded).length
  const opponentAdj     = (activeOpponents - 1) * 2  // 0 at N=2

  // Position: Pie (acts last, most info) → slightly lower bar; Mano (opens blind) → slightly higher
  const posAdj = pieIndex === aiIndex ? -2 : (manoIndex === aiIndex ? 1 : 0)

  // Noise applied per decision (IMPREDECIBLE: ±15% per call)
  const openMin  = _jitter(profile.openMin  + opponentAdj + posAdj, profile.noise)
  const callMin  = _jitter(profile.callMin  + opponentAdj + posAdj, profile.noise)
  const raiseMin = _jitter(profile.raiseMin + opponentAdj + posAdj, profile.noise)

  // ── No bet yet: open or pass ──────────────────────────────────────────────
  if (currentBet === 0) {
    // Saldo: no abrir si no se puede cubrir la apuesta de apertura (unit) → pasar.
    if (score >= openMin && ai.chips >= unit) return { action: 'apostar' }
    return { action: 'pasar' }
  }

  // ── BET_1: only 2 cards — call liberally; fold only on big raise + weak hand
  if (phase === 'BET_1') {
    if (score >= raiseMin)               return canAffordRaise ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin)                return { action: 'igualar' }
    if (toCall <= unit * 2)              return { action: 'igualar' }  // cheap-call safety
    return { action: 'retirarse' }
  }

  // ── BET_2: 5 cards — real hand evaluation ────────────────────────────────
  if (phase === 'BET_2') {
    if (score >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin + 4)            return { action: 'igualar' }
    if (score >= callMin) return toCall <= unit * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  // ── BET_3: post-discard — highest bar ────────────────────────────────────
  if (phase === 'BET_3') {
    if (score >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? { action: 'subir' } : { action: 'igualar' }
    if (score >= callMin + 4)            return { action: 'igualar' }
    if (score >= callMin) return toCall <= unit ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  return score >= callMin ? { action: 'igualar' } : { action: 'retirarse' }
}

export function decideDiscard(state, aiIndex) {
  const { players, numPlayers } = state
  const ai = players[aiIndex]
  // C4.4: comodín y límite de descarte según jugadores vivos (no el tamaño fijo)
  const ruleN = state.aliveCount ?? numPlayers
  const comodinEnabled = ruleN >= 4

  const { palo: bestSuit } = getBestSuitScore(ai.cards, ruleN, comodinEnabled)

  const indices = []
  ai.cards.forEach((card, i) => {
    // In N=5 the comodín (7 de Oros) is worth 11 pts and enables the 52-Ajilei — keep it
    if (ruleN === 5 && card.palo === 'Oros' && card.value === 7) return
    if (card.palo !== bestSuit) indices.push(i)
  })

  return indices.slice(0, _maxDiscard(ruleN))
}
