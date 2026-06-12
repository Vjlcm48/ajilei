import { Howl } from 'howler'
import { useSoundContext } from '../context/SoundContext'

const sounds = {
  cardDeal:     new Howl({ src: ['/sounds/card-deal.mp3'],     volume: 0.6 }),
  coinBet:      new Howl({ src: ['/sounds/coin-bet.mp3'],      volume: 0.7 }),
  cardFold:     new Howl({ src: ['/sounds/card-fold.mp3'],     volume: 0.5 }),
  cardShuffle:  new Howl({ src: ['/sounds/card-shuffle.mp3'],  volume: 0.6 }),
  win:          new Howl({ src: ['/sounds/win.mp3'],           volume: 0.8 }),
  timerWarning: new Howl({ src: ['/sounds/timer-warning.mp3'], volume: 0.5 }),
  showdown:     new Howl({ src: ['/sounds/showdown.mp3'],      volume: 0.7 }),
  comodin:      new Howl({ src: ['/sounds/comodin.mp3'],       volume: 0.8 }),
  buttonClick:  new Howl({ src: ['/sounds/button-click.mp3'],  volume: 0.4 }),
}

export function useSounds() {
  const { soundEnabled } = useSoundContext()

  const play = (soundName) => {
    if (!soundEnabled) return
    const sound = sounds[soundName]
    if (!sound) return

    if (soundName === 'cardShuffle') {
      const id = sound.play()
      const totalMs = sound.duration() * 1000
      if (totalMs > 0) {
        const fadeLen = 130
        const triggerAt = totalMs * 0.49 - fadeLen
        setTimeout(() => {
          sound.fade(sound.volume(), 0, fadeLen, id)
          setTimeout(() => sound.stop(id), fadeLen)
        }, Math.max(0, triggerAt))
      }
      return
    }

    sound.play()
  }

  return { play }
}
