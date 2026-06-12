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

export function isAjilei(cards) {
  if (cards.length !== 5) return false
  const firstSuit = cards[0].palo
  if (!cards.every((c) => c.palo === firstSuit)) return false
  return cards.reduce((sum, c) => sum + c.points, 0) === 51
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
