// numPlayers 2-3: no comodín | 4: comodín=10 | 5: comodín=11
export function getComodinValue(numPlayers) {
  if (numPlayers === 4) return 10
  if (numPlayers === 5) return 11
  return null
}

export function getBestSuitScore(cards, numPlayers = 2, comodinEnabled = false) {
  const comodinValue = comodinEnabled ? getComodinValue(numPlayers) : null
  const hasComodin = comodinValue !== null && cards.some(c => c.palo === 'Oros' && c.value === 7)

  const suitScores = {}
  cards.forEach((card) => {
    if (hasComodin && card.palo === 'Oros' && card.value === 7) return
    if (!suitScores[card.palo]) suitScores[card.palo] = 0
    suitScores[card.palo] += card.points
  })

  let bestSuit = ''
  let bestScore = 0
  Object.entries(suitScores).forEach(([palo, score]) => {
    if (score > bestScore) {
      bestSuit = palo
      bestScore = score
    }
  })

  if (hasComodin) bestScore += comodinValue

  return { palo: bestSuit, points: bestScore, suitScores }
}

// Natural Ajilei: all 5 same suit, sum = 51.
// Comodín Ajilei (numPlayers=5 only): 4 same suit + 7 de Oros, where 4-card sum + 11 = 52.
export function isAjilei(cards, numPlayers = 2) {
  if (cards.length !== 5) return false

  // Natural: all same suit, total = 51
  const firstSuit = cards[0].palo
  if (cards.every(c => c.palo === firstSuit)) {
    if (cards.reduce((sum, c) => sum + c.points, 0) === 51) return true
  }

  // Comodín Ajilei — strictly N=5 with 7 de Oros present
  if (numPlayers === 5) {
    const comodinIdx = cards.findIndex(c => c.palo === 'Oros' && c.value === 7)
    if (comodinIdx !== -1) {
      const rest = cards.filter((_, i) => i !== comodinIdx)
      const suit  = rest[0].palo
      if (rest.every(c => c.palo === suit)) {
        const restSum = rest.reduce((sum, c) => sum + c.points, 0)
        if (restSum + 11 === 52) return true
      }
    }
  }

  return false
}

export function compareHands(playerA, playerB) {
  const handA = getBestSuitScore(playerA.cards)
  const handB = getBestSuitScore(playerB.cards)
  if (handA.points > handB.points) return playerA
  if (handB.points > handA.points) return playerB
  if (playerA.isMano) return playerA
  if (playerB.isMano) return playerB
  return playerA
}
