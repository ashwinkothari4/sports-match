export const calculateELO = (player1ELO, player2ELO, outcome, kFactor = 32) => {
  // outcome: 1 = player1 wins, 0 = player2 wins, 0.5 = draw
  
  const expected1 = 1 / (1 + Math.pow(10, (player2ELO - player1ELO) / 400))
  const expected2 = 1 / (1 + Math.pow(10, (player1ELO - player2ELO) / 400))
  
  const newELO1 = Math.round(player1ELO + kFactor * (outcome - expected1))
  const newELO2 = Math.round(player2ELO + kFactor * ((1 - outcome) - expected2))
  
  return {
    player1: newELO1,
    player2: newELO2,
    change1: newELO1 - player1ELO,
    change2: newELO2 - player2ELO
  }
}

export const getELOTier = (elo) => {
  if (elo >= 2000) return { name: 'Grandmaster', color: 'text-purple-600' }
  if (elo >= 1800) return { name: 'Master', color: 'text-red-600' }
  if (elo >= 1600) return { name: 'Expert', color: 'text-orange-600' }
  if (elo >= 1400) return { name: 'Rising Star', color: 'text-yellow-600' }
  if (elo >= 1200) return { name: 'Competitor', color: 'text-green-600' }
  return { name: 'Rookie', color: 'text-blue-600' }
}
