import { Howl } from 'howler'
import { useSoundContext } from '../context/SoundContext'

// ── PUE-1.2 · El audio deja de viajar en el arranque ────────────────────────
// Documento rector: AJILEI_PUE_Fase1_v1.0 §1.2, sobre el hallazgo de la Fase 0
// §4.4: los once `Howl` se construían a NIVEL DE MÓDULO, y Howler precarga por
// defecto. Resultado medido: **525,7 KiB de audio** bajando antes de que la
// portada pintara, de un camino crítico de 706,2 — audio que nadie oye en la
// puerta, en el terreno declarado de datos móviles.
//
// EL CAMBIO ES DÓNDE SE CONSTRUYE, NO CÓMO SUENA. La tabla de abajo es la misma
// de siempre —mismas rutas, mismos volúmenes, mismas notas de licencia— pero
// vive como DATOS. El `Howl` nace la primera vez que alguien pide ese sonido, o
// cuando una pantalla lo precarga a propósito. Es el molde de `useCoreografia`,
// que ya difiere sus ~380 KB de melodía al montar la pantalla de victoria.
//
// Y POR ESO EXISTE `precargar`. Howler encola un `play()` sobre un `Howl` que
// aún carga y lo dispara al terminar: no se pierde el sonido, pero el primer
// `cardDeal` llegaría tarde. Así que quien sabe que va a necesitar un sonido lo
// pide antes de necesitarlo — la mesa, sus efectos al encaminarse a la mesa; la
// portada, sólo su rasgueo. Nadie más descarga nada.
const FUENTES = {
  cardDeal:     { src: ['/sounds/card-deal.mp3'],     volume: 0.6 },
  coinBet:      { src: ['/sounds/coin-bet.mp3'],      volume: 0.7 },
  cardFold:     { src: ['/sounds/card-fold.mp3'],     volume: 0.5 },
  cardShuffle:  { src: ['/sounds/card-shuffle.mp3'],  volume: 0.6 },
  timerWarning: { src: ['/sounds/timer-warning.mp3'], volume: 0.5 },
  showdown:     { src: ['/sounds/showdown.mp3'],      volume: 0.7 },
  comodin:      { src: ['/sounds/comodin.mp3'],       volume: 0.8 },
  buttonClick:  { src: ['/sounds/button-click.mp3'],  volume: 0.4 },
  // ── DSK-VC2 · Victory Celebration ──────────────────────────────────────────
  // Los tres son Pixabay Content License (IDs 96121, 85867, 504874); ver
  // docs/AJILEI_Victory_Celebration_v1.0.md §7. Volúmenes elegidos contra el
  // PICO MEDIDO de cada archivo, no a ojo: knock 0,383 (el más fuerte de los
  // tres, dos golpes secos no deben sobresaltar), chips 0,249, strum 0,188 (el
  // más flojo y el momento héroe). Los tres dentro del rango de la casa 0,4-0,8.
  chipsCollect: { src: ['/sounds/chips-collect.mp3'], volume: 0.7 },
  ajileiStrum:  { src: ['/sounds/ajilei-strum.mp3'],  volume: 0.8 },
  tableKnock:   { src: ['/sounds/table-knock.mp3'],   volume: 0.6 },
}

// Los `Howl` ya construidos. Módulo y no `useRef`: el juego monta y desmonta
// pantallas, y un sonido descargado no tiene por qué volver a descargarse
// porque alguien salió de la mesa y entró otra vez.
const vivos = {}

function obtener(nombre) {
  const receta = FUENTES[nombre]
  if (!receta) return null
  if (!vivos[nombre]) vivos[nombre] = new Howl({ ...receta, preload: true })
  return vivos[nombre]
}

// ── Los dos grupos que alguien precarga a propósito ─────────────────────────
// LA PORTADA NO PRECARGA LOS DE LA MESA, y es el punto entero de esta tanda:
// en la puerta el único sonido posible es el rasgueo del primer toque.
export const SONIDOS_PORTADA = ['ajileiStrum']

// La mesa sí precarga los suyos: el primer `cardDeal` cae a los pocos
// fotogramas de montar y tiene que sonar en su instante. `ajileiStrum`,
// `chipsCollect` y `tableKnock` NO entran aquí — son de la celebración, que
// llega minutos después y tiene su propio momento para pedirlos.
export const SONIDOS_MESA = [
  'cardDeal', 'coinBet', 'cardFold', 'cardShuffle',
  'timerWarning', 'showdown', 'comodin', 'buttonClick',
]

/** Construye y arranca la descarga de los sonidos nombrados. Idempotente. */
export function precargarSonidos(nombres) {
  if (!Array.isArray(nombres)) return
  nombres.forEach(obtener)
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
export const STRUM_CORTE_MS = 1300   // antes del segundo rasgueo (1,59s)
export const STRUM_FADE_MS  = 130    // misma cortina que cardShuffle

export function useSounds() {
  const { soundEnabled } = useSoundContext()

  // DSK-VC2 · play() DEVUELVE el id de Howler. Sin él no se puede llamar a
  // stop(id), y sin stop(id) el toque que corta una celebración cortaría el
  // dibujo pero no el sonido. Una línea, aditiva: quien no lo usa —todas las
  // llamadas anteriores— no se entera.
  const play = (soundName) => {
    if (!soundEnabled) return null
    const sound = obtener(soundName)
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
      // `duration()` es 0 mientras el archivo no ha llegado — y desde esta
      // tanda eso puede pasar de verdad en la PRIMERA reproducción, no sólo en
      // teoría. La guarda de `> 0` ya existía y ahora es la que trabaja: sin
      // duración no hay recorte, y el barajado suena entero esa vez. Es la
      // degradación correcta: nunca un silencio, como mucho un segundo de más.
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
