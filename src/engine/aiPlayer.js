import { getBestSuitScore, isAjilei } from './handEvaluator'

function maxDiscardCards(numPlayers) {
  return numPlayers <= 4 ? 5 : 3
}

export function aiSelectDiscards(cards, numPlayers = 2) {
  const { palo } = getBestSuitScore(cards)
  const indices = []
  cards.forEach((card, i) => {
    if (card.palo !== palo) indices.push(i)
  })
  return indices.slice(0, maxDiscardCards(numPlayers))
}

// Returns { action: 'pasar' | 'apostar' | 'igualar' | 'subir' | 'retirarse' }
export function aiBettingDecision(cards, currentBet, aiContrib, aiChips, phase) {
  if (isAjilei(cards)) return { action: currentBet > 0 ? 'subir' : 'apostar' }

  const { points: score } = getBestSuitScore(cards)
  const toCall     = currentBet - aiContrib
  const betInUnits = currentBet  // caller divides by unit if needed; we compare score

  if (aiChips < toCall && toCall > 0) return { action: 'retirarse' }

  // ── Opening (no bet yet) ────────────────────────────────────────────────
  if (currentBet === 0) {
    if (score >= 28)                          return { action: 'apostar' }
    if (score >= 20 && Math.random() < 0.4)  return { action: 'apostar' }
    return { action: 'pasar' }
  }

  // ── Facing a bet ────────────────────────────────────────────────────────
  if (phase === 'BET_1') {
    // Only 2 cards — enormous potential, fold rarely
    if (toCall <= currentBet * 2)   return { action: 'igualar' }  // cheap call: always
    if (score < 7)                  return { action: 'retirarse' } // terrible hand + expensive
    return { action: 'igualar' }
  }

  if (phase === 'BET_2') {
    // 5 cards — real hand evaluation
    if (score >= 25) return Math.random() < 0.6 ? { action: 'subir' } : { action: 'igualar' }
    if (score >= 20) return { action: 'igualar' }
    if (score >= 15) return toCall <= betInUnits * 2 ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  if (phase === 'BET_3') {
    // Final hand post-discard — higher bar
    if (score >= 30) return Math.random() < 0.7 ? { action: 'subir' } : { action: 'igualar' }
    if (score >= 25) return { action: 'igualar' }
    if (score >= 20) return toCall <= betInUnits ? { action: 'igualar' } : { action: 'retirarse' }
    return { action: 'retirarse' }
  }

  // Fallback for any unexpected phase
  if (score >= 20) return { action: 'igualar' }
  return { action: 'retirarse' }
}
