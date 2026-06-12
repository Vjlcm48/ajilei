export const STAKE_OPTIONS = [100, 200, 300, 500]

export const AJILEI_CONFIG = {
  game: {
    playersMin: 2,
    playersMax: 5,
    deck: 'SPANISH_40',
    handSize: 5,
    maxBettingRounds: 3,
  },

  betting: {
    entrada: 10,
    apuestaMinima: 10,
    subidaMinima: 10,
    subidaMaximaPorAccion: 50,
    maximoPorRonda: 100,
    allInEnabled: false,
  },

  economy: {
    saldoInicial: 5000,
    bonoDiario: 50,
    videoReward: 25,
    maxVideosPerDay: 5,
  },
}