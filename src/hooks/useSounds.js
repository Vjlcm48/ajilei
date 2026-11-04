import { useCallback, useEffect, useRef } from 'react'
import { useSoundContext } from '../context/useSoundContext'
import { conHowler, howlerYa } from '../lib/motorHowler'

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
  // PES-1 §3-E · sin motor todavía no hay `Howl`: `precargarSonidos` y `reproducir`
  // lo dejan pendiente en `motorHowler`.
  const motor = howlerYa()
  if (!motor) return null
  if (!vivos[nombre]) vivos[nombre] = new motor.Howl({ ...receta, preload: true })
  return vivos[nombre]
}

// ── Los dos grupos que alguien precarga a propósito ─────────────────────────
// LA PORTADA NO PRECARGA LOS DE LA MESA, y es el punto entero de esta tanda:
// en la puerta el único sonido posible es el rasgueo del primer toque.
//
// BIE-1 · Ya no: el rasgueo sale de la puerta (Victor, 2026-10-01: «el clic
// tradicional que usa el resto de la app») y suenan los BOTONES, con el clic.
// Se sigue precargando UNO, y no ninguno, a propósito: Howler arma su
// desbloqueo de audio (`autoUnlock`) al construirse el PRIMER `Howl`. Sin
// ninguno construido, el primero nacería dentro del primer clic y en iOS ese
// clic podría salir mudo. 16 896 B en vez de los ~114 KB del rasgueo.
export const SONIDOS_PORTADA = ['buttonClick']

// La mesa sí precarga los suyos: el primer `cardDeal` cae a los pocos
// fotogramas de montar y tiene que sonar en su instante. `ajileiStrum` y
// `tableKnock` NO entran aquí: el rasgueo es del AJILEI (raro) y el golpe de
// mesa ya lo precarga el lobby (`SONIDOS_LOBBY`).
//
// ARN-3d §2.5 (D14) · `chipsCollect` SÍ entra. Es el roce de fichas de CADA
// mano que se cobra —la gane el humano o una IA—, no un sonido de fiesta rara:
// el primero cae en la primera mano. Fuera de esta lista nacía en su primer
// `play` (`loading`) y, con red real, el primer roce de la partida llegaba
// tarde respecto a las monedas (~0,73 s con 4G lento; Fase 0 §C4). 30 929 B.
export const SONIDOS_MESA = [
  'cardDeal', 'coinBet', 'cardFold', 'cardShuffle',
  'timerWarning', 'showdown', 'comodin', 'buttonClick',
  'chipsCollect',
]

// LOB-1 · El lobby precarga UNO, y es el que él mismo dispara: el golpe de mesa
// del CTA. `tableKnock` ya estaba en la tabla —lo trajo DSK-VC2 para la
// celebración— y aquí estrena un segundo consumidor sin cambiar una cifra suya.
//
// UNO Y NO NUEVE. La tentación era adelantar aquí `SONIDOS_MESA`, ya que del
// lobby se sale hacia la mesa; sería deshacer PUE-1.2 por la puerta de atrás.
// El lobby es la primera pantalla que ve alguien que ya entró, y bajarle 380 KiB
// de audio de partida para un jugador que quizá sólo viene a mirar su saldo es
// exactamente el gasto que aquella tanda quitó del arranque. Los de la mesa se
// piden donde se pedían: al ENCAMINARSE a la mesa (App.jsx), que sigue siendo el
// mismo instante que antes de esta campaña.
//
// `buttonClick` tampoco entra: lo usa `SoundButton` en los diez controles
// secundarios del lobby, pero son 16 896 B y ninguno de ellos es un momento
// crítico — si el primer clic de «Rankings» suena un pelo tarde, no pasa nada.
// El golpe de mesa sí lo es: cae en el mismo fotograma en que la pantalla cambia.
export const SONIDOS_LOBBY = ['tableKnock']

// ── SAL-A · Los tres de las salas ───────────────────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §5.3. La lista nace aquí y SAL-B la pide al
// montar la sala de espera; esta tanda no precarga nada, porque no hay todavía
// ninguna pantalla que los dispare.
//
// LOS TRES, Y POR QUÉ CADA UNO:
//   · `chipsCollect` — el anfitrión pulsa «Jugar ya»: las fichas suenan cuando
//     la apuesta entra en juego. Cuando nació esta lista era el único de los
//     tres que no estaba en ninguna otra (la Fase 0 §3.4 lo midió); desde
//     ARN-3d viaja también en `SONIDOS_MESA`, y pedirlo dos veces no cuesta
//     nada. Aquí estrena segundo consumidor sin cambiar una cifra suya.
//   · `cardShuffle` — el barajado de fondo del mazo en el fieltro, a 0,15. Ya
//     viaja en `SONIDOS_MESA`, así que en el camino sala → mesa se pide dos
//     veces y no pasa nada: `precargarSonidos` es idempotente.
//   · `tableKnock` — alguien se sienta: el golpe en la mesa es «ya llegué»,
//     corto y seco. Mismo sonido que el CTA del lobby.
//
// SAL-B2 (ajustes, 12-sep-2026): `chipsCollect` y `tableKnock` INTERCAMBIARON
// su momento por decisión de Victor. La receta de los tres no cambia —mismos
// archivos, mismos volúmenes, misma lista—; lo que cambió es quién llama a
// cuál, en `SalaEspera.jsx`. Este comentario se actualiza para que no mienta.
//
// TRES Y NO NUEVE, por la misma razón que `SONIDOS_LOBBY` es uno solo: una sala
// de espera es una pantalla donde se aguarda, y bajarle los 380 KiB de audio de
// partida a alguien que quizá salga antes de que arranque es el gasto que
// PUE-1.2 sacó del arranque. Los de la mesa se siguen pidiendo donde se pedían.
export const SONIDOS_SALAS = ['chipsCollect', 'cardShuffle', 'tableKnock']

/** Construye y arranca la descarga de los sonidos nombrados. Idempotente. */
export function precargarSonidos(nombres) {
  if (!Array.isArray(nombres)) return
  conHowler(() => nombres.forEach(obtener))
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

// ── GT-HIG · handle para los cuatro relojes del recorte ─────────────────────
// Los dos relojes de cada recorte —la espera hasta el corte y el apagado tras
// la cortina— eran cuatro de los nueve sin handle del censo de FRZ-1 §1.3.
//
// AQUÍ "DESMONTAR" NO EXISTE: `vivos` es caché de módulo y no se descarga
// nunca a propósito (es la decisión de PUE-1.2, aquí arriba). Así que el punto
// de cancelación correcto no es el desmontaje sino la REENTRADA: volver a
// disparar el mismo sonido antes de que venza su recorte anterior.
//
// Y al cancelar se para la instancia anterior EN EL MISMO GESTO. Cancelar el
// reloj a secas dejaría a la anterior sonando entera —el segundo racimo del
// rasgueo en 1,59 s—, que es exactamente el defecto que el recorte existe para
// quitar. Cancelar sin parar no sería higiene: sería devolver el defecto.
//
// En el juego los dos sonidos no se solapan (el barajado va uno por mano, el
// rasgueo uno por celebración), así que este camino no se recorre hoy: lo que
// cambia es que ahora SE PUEDE cancelar.
const recortes = {}

function cancelaRecorte(nombre) {
  const r = recortes[nombre]
  if (!r) return
  clearTimeout(r.corte)
  clearTimeout(r.apagado)
  try { r.sound.stop(r.id) } catch { /* esa instancia ya no existe */ }
  recortes[nombre] = null
}

/** Programa el recorte de esta instancia y cancela el de la anterior, si la hay. */
function programaRecorte(nombre, sound, id, esperaMs, fadeMs) {
  cancelaRecorte(nombre)
  const r = { sound, id, corte: null, apagado: null }
  r.corte = setTimeout(() => {
    sound.fade(sound.volume(), 0, fadeMs, id)
    r.apagado = setTimeout(() => {
      sound.stop(id)
      if (recortes[nombre] === r) recortes[nombre] = null
    }, fadeMs)
  }, esperaMs)
  recortes[nombre] = r
}

// ── BIE-1 · El reproductor, sin React ───────────────────────────────────────
// `play` era una flecha declarada DENTRO del hook: una función nueva en cada
// render. Cualquier efecto que dependiera de `[play]` se volvía a ejecutar en
// cada render, y el de la Portada —un `pointerdown` de un solo uso— se rearmaba
// cada vez: el rasgueo «del primer toque» sonaba en el primer toque DE CADA
// repintado (medido en la Fase 0 de BIE-1: tres rasgueos en un recorrido).
//
// La decisión de sonar vive aquí, en una pieza pura que se prueba sin montar
// nada (molde `creaCongelador`): recibe el ajuste de sonido EN CADA LLAMADA, no
// lo captura, y por eso el hook puede envolverla una sola vez y no rehacerla
// cuando el jugador apaga el sonido. `sonido` es `obtener` en la app; el test
// le da uno falso.
//
// DSK-VC2 · play() DEVUELVE el id de Howler. Sin él no se puede llamar a
// stop(id), y sin stop(id) el toque que corta una celebración cortaría el
// dibujo pero no el sonido. Una línea, aditiva: quien no lo usa —todas las
// llamadas anteriores— no se entera.
const enEspera = new Set()

export function reproducir(soundName, activo, sonido = obtener) {
  if (!activo) return null
  // PES-1 §3-E · antes del motor, como hoy con un archivo que aún carga: suena al
  // llegar. Una vez por sonido: diez toques de espera no son diez clics seguidos.
  if (sonido === obtener && !howlerYa()) {
    if (FUENTES[soundName] && !enEspera.has(soundName)) {
      enEspera.add(soundName)
      conHowler(() => { enEspera.delete(soundName); reproducir(soundName, true) })
    }
    return null
  }
  const sound = sonido(soundName)
  if (!sound) return null

  if (soundName === 'ajileiStrum') {
    const id = sound.play()
    programaRecorte(soundName, sound, id, STRUM_CORTE_MS, STRUM_FADE_MS)
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
      programaRecorte(soundName, sound, id, Math.max(0, triggerAt), fadeLen)
    }
    return { sound, id }
  }

  return { sound, id: sound.play() }
}

export function useSounds() {
  const { soundEnabled } = useSoundContext()

  // BIE-1 · `play` con IDENTIDAD ESTABLE: `useCallback` sin dependencias. El
  // ajuste de sonido viaja por una ref que sincroniza un efecto, y la ref se lee
  // DENTRO de `play` —en el manejador, al sonar—, nunca durante el render: es la
  // única forma que `react-hooks/refs` acepta (pasarle la ref a una función en
  // el render, aunque sea dentro de un inicializador, la rechaza). El objeto
  // `{ play }` sí es nuevo en cada render; quien lo desestructura recibe siempre
  // la MISMA función.
  //
  // Entre que el jugador apaga el sonido y que corre el efecto hay, como mucho,
  // el render del cambio; y en ese hueco `SoundContext` ya ha hecho
  // `Howler.mute(true)`, que es la capa que de verdad silencia (SoundContext.jsx
  // l. 26-35). Este `if` sigue siendo la segunda capa, como siempre.
  const activo = useRef(soundEnabled)
  useEffect(() => { activo.current = soundEnabled }, [soundEnabled])
  const play = useCallback((soundName) => reproducir(soundName, activo.current), [])

  return { play }
}
