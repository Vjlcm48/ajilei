import { Howl } from 'howler'
import { useSoundContext } from '../context/SoundContext'

const sounds = {
  cardDeal:     new Howl({ src: ['/sounds/card-deal.mp3'],     volume: 0.6 }),
  coinBet:      new Howl({ src: ['/sounds/coin-bet.mp3'],      volume: 0.7 }),
  cardFold:     new Howl({ src: ['/sounds/card-fold.mp3'],     volume: 0.5 }),
  cardShuffle:  new Howl({ src: ['/sounds/card-shuffle.mp3'],  volume: 0.6 }),
  timerWarning: new Howl({ src: ['/sounds/timer-warning.mp3'], volume: 0.5 }),
  showdown:     new Howl({ src: ['/sounds/showdown.mp3'],      volume: 0.7 }),
  comodin:      new Howl({ src: ['/sounds/comodin.mp3'],       volume: 0.8 }),
  buttonClick:  new Howl({ src: ['/sounds/button-click.mp3'],  volume: 0.4 }),
  // ── DSK-VC2 · Victory Celebration ──────────────────────────────────────────
  // Los tres son Pixabay Content License (IDs 96121, 85867, 504874); ver
  // docs/AJILEI_Victory_Celebration_v1.0.md §7. Volúmenes elegidos contra el
  // PICO MEDIDO de cada archivo, no a ojo: knock 0,383 (el más fuerte de los
  // tres, dos golpes secos no deben sobresaltar), chips 0,249, strum 0,188 (el
  // más flojo y el momento héroe). Los tres dentro del rango de la casa 0,4-0,8.
  chipsCollect: new Howl({ src: ['/sounds/chips-collect.mp3'], volume: 0.7 }),
  ajileiStrum:  new Howl({ src: ['/sounds/ajilei-strum.mp3'],  volume: 0.8 }),
  tableKnock:   new Howl({ src: ['/sounds/table-knock.mp3'],   volume: 0.6 }),
}

// ── Recorte del rasgueo, en reproducción ────────────────────────────────────
// ajilei-strum.mp3 trae 3,657s de archivo y 2,8s útiles, con DOS rasgueos: uno
// en 0,21 y un segundo racimo en 1,59/1,72/1,84 (medido decodificando el mp3 —
// scripts/_vc2audio.mjs). El diseño sellado pide UNO solo y ≤2s, así que el
// segundo sobra.
//
// Se recorta al REPRODUCIR, no en el archivo: es el molde que cardShuffle ya
// usa aquí abajo desde su tanda, no requiere herramienta externa (no hay ffmpeg
// en el entorno) y deja el archivo licenciado exactamente como Pixabay lo
// distribuye — que para una licencia es lo preferible, no un mal menor.
const STRUM_CORTE_MS = 1300   // antes del segundo rasgueo (1,59s)
const STRUM_FADE_MS  = 130    // misma cortina que cardShuffle

export function useSounds() {
  const { soundEnabled } = useSoundContext()

  // DSK-VC2 · play() DEVUELVE el id de Howler. Sin él no se puede llamar a
  // stop(id), y sin stop(id) el toque que corta una celebración cortaría el
  // dibujo pero no el sonido. Una línea, aditiva: quien no lo usa —todas las
  // llamadas anteriores— no se entera.
  const play = (soundName) => {
    if (!soundEnabled) return null
    const sound = sounds[soundName]
    if (!sound) return null

    if (soundName === 'ajileiStrum') {
      const id = sound.play()
      setTimeout(() => {
        sound.fade(sound.volume(), 0, STRUM_FADE_MS, id)
        setTimeout(() => sound.stop(id), STRUM_FADE_MS)
      }, STRUM_CORTE_MS)
      return { sound, id }
    }

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
      return { sound, id }
    }

    return { sound, id: sound.play() }
  }

  return { play }
}
