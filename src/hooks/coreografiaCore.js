import { CONTEO_MS, valorConteo } from './sesionCore'
import { esperaPrecedente, ESPERA_MARGEN_MS } from './celebracionCore'
import { MELODIA_MS } from '../config/melodiasCelebracion'

// ── CEL-2 · El núcleo del arco de celebración ───────────────────────────────
// Documento rector: lámina CEL-2, validada por Victor.
// Función y constantes PURAS: sin React, sin DOM, sin audio. Aquí vive el
// "cuánto dura cada cosa y qué va después de qué"; el hook de al lado sólo lo
// ejecuta. Vitest sella este archivo entero.
//
// EL ARCO, en una línea por tiempo:
//   sobria  · fieltro, AJILEI sin resplandor, frase invisible, cifras en 0.
//   fiesta  · al terminar el toc-toc: melodía + lluvia + resplandor + frase,
//             y los dos contadores subiendo.
//   calma   · al detenerse el contador: la lluvia deja de EMITIR y las monedas
//             en vuelo terminan su caída.
//   reposo  · pantalla quieta; la melodía acaba sus 12 s por su cuenta.

export const FASES = ['sobria', 'fiesta', 'calma', 'reposo']

// ── El ancla ────────────────────────────────────────────────────────────────
// La duración MEDIDA de `table-knock.mp3` (arnés CEL-0: 1,896 s de archivo, dos
// nudillos en 0,12 y 0,51, útil hasta 0,66). No es el reloj del arco —manda el
// `end` de Howler— sino la RED para cuando no hay `end` que escuchar: con el
// sonido apagado el toc-toc no llega a sonar y `play()` devuelve null, y el
// arco visual tiene que correr con los mismos tiempos igualmente.
export const TOC_NOMINAL_MS = 1896

// Y la red del ancla misma: el arco arranca cuando el disparo del toc-toc ha
// ocurrido (el padre lo comunica), o a los 500 ms pase lo que pase. Una fiesta
// que espera para siempre a que alguien le avise es peor que una que empieza
// sola un poco antes.
export const ANCLA_TOPE_MS = 500

// ── El conteo ───────────────────────────────────────────────────────────────
// El mínimo es `CONTEO_MS`, el 1400 que VC2 selló y que esta tanda no reabre:
// las cifras pequeñas siguen contando exactamente como contaban. Lo que CEL-2
// añade es el techo, para que un botín de cinco asientos no suba a la misma
// velocidad que una ganancia de tres Heptacoins.
// ── CEL-2g · El mando del ritmo ─────────────────────────────────────────────
// Victor, tras jugar una partida entera: las dos cuentas al DOBLE. La escala por
// magnitud no cambia —misma curva, mismas puntas planas—, se multiplica entera.
// Un solo número manda, como el factor de la caída de la lluvia.
export const CONTEO_FACTOR = 2
const CONTEO_BASE_MIN_MS = CONTEO_MS        // 1400, el de VC2
const CONTEO_BASE_MAX_MS = 1800             // el techo que puso CEL-2

export const CONTEO_MIN_MS = CONTEO_BASE_MIN_MS * CONTEO_FACTOR   // 2800
export const CONTEO_MAX_MS = CONTEO_BASE_MAX_MS * CONTEO_FACTOR   // 3600
export const CONTEO_PISO = 1000             // hasta aquí, el mínimo entero
export const CONTEO_TECHO = 25000           // 5 asientos × 5000: el mayor botín de hoy

// Interpolación lineal entre los dos pares, con las puntas planas. Se redondea
// a ms enteros: una duración con decimales no significa nada para un rAF.
export function duracionConteo(magnitud) {
  const m = Number.isFinite(magnitud) ? Math.abs(magnitud) : 0
  if (m <= CONTEO_PISO) return CONTEO_MIN_MS
  if (m >= CONTEO_TECHO) return CONTEO_MAX_MS
  const t = (m - CONTEO_PISO) / (CONTEO_TECHO - CONTEO_PISO)
  return Math.round(CONTEO_MIN_MS + t * (CONTEO_MAX_MS - CONTEO_MIN_MS))
}

// CEL-2g · Los dos contadores DEJARON de compartir reloj: el premio cuenta
// primero y el saldo espera a que asiente. La función se conserva porque sigue
// siendo la magnitud del relato entero —la mayor de las dos— y con ella se
// dimensiona lo que dura la historia completa; cada cuenta pide la suya por
// separado con `duracionConteo(Math.abs(...))`.
export function magnitudConteo(netas, saldo) {
  return Math.max(Math.abs(Number(netas) || 0), Math.abs(Number(saldo) || 0))
}

// ── CEL-2g · El relato de los números, tramo a tramo ────────────────────────
// El arco (sobria/fiesta/calma/reposo) manda sobre la PANTALLA; esto manda
// sobre la TARJETA, y corre entero dentro de la fiesta. Se separan porque duran
// cosas distintas: la fiesta la mide la melodía y el relato lo miden las cifras.
//
//   espera   · entrada sobria: premio en 0, saldo en su cifra de entrada y los
//              cuatro rubros invisibles PERO con su sitio ocupado.
//   premio   · sube "+N".
//   traspaso · una moneda vuela de la fila del premio a la del saldo.
//   saldo    · el aterrizaje lo dispara; sube de la cifra de entrada a la real.
//   asiento  · pulso y destello sobre la cifra, un solo disparo.
//   rubros   · los cuatro entran en cascada.
//   fin      · todo puesto.
//
// El orden es un ARRAY y no una cadena de `if`: así "¿ya pasó el premio?" es
// una comparación de índices, y el salto por toque es poner el último.
export const TRAMOS = ['espera', 'premio', 'traspaso', 'saldo', 'asiento', 'rubros', 'fin']

export function avanceDe(tramo) {
  const i = TRAMOS.indexOf(tramo)
  return i < 0 ? 0 : i
}

export const TRASPASO_MS = 520     // el vuelo de la moneda del premio al saldo
export const ASIENTO_MS = 520      // el pulso de la cifra al llegar
export const CASCADA_PASO_MS = 250 // entre rubro y rubro
export const CASCADA_ENTRADA_MS = 380
export const RUBROS = 4            // puntos · jugadas · ganadas · mejor mano

export function duracionCascada(n = RUBROS) {
  return Math.max(0, n - 1) * CASCADA_PASO_MS + CASCADA_ENTRADA_MS
}

// Lo que dura el relato entero, para el arnés y para poder afirmar que cabe
// dentro de la fiesta: si algún día no cupiera, la cascada se vería empezar
// sobre una pantalla que ya se apagó.
export function duracionRelato(netas, saldo) {
  return duracionConteo(Math.abs(Number(netas) || 0))
    + TRASPASO_MS
    + duracionConteo(Math.abs(Number(saldo) || 0))
    + ASIENTO_MS
    + duracionCascada()
}

// ── El saldo no cuenta desde cero ───────────────────────────────────────────
// Cuenta desde la cifra con la que el jugador entró a la mesa hasta la que
// tiene ahora. `valorConteo` —la curva sellada por VC2— interpola de 0 a un
// destino, así que se le pasa el DELTA y se le suma el origen: la curva es la
// misma, sin copiarla ni tocarla.
export function valorEntre(desde, hasta, t) {
  const a = Number(desde) || 0
  return a + valorConteo((Number(hasta) || 0) - a, t)
}

// ── La lluvia ───────────────────────────────────────────────────────────────
// El techo de la lámina: 18 monedas vivas a la vez, jamás una más. La cadencia
// sale de ahí y no al revés: con la vida media de una moneda, emitir cada
// `EMISION_MS` deja ~14 en el aire en régimen —dentro del 12-18 pedido— y el
// tope de 18 sólo actúa como tope.
export const GOTAS_MAX = 18

// ── CEL-2c · El mando de la caída ───────────────────────────────────────────
// Victor, tras verlo en vivo: las monedas caen más lento. UN SOLO NÚMERO manda,
// y de él salen las tres cifras que tienen que moverse juntas — si el factor se
// recalibra otra vez, se toca aquí y nada más.
//
// La cadencia de emisión escala con el factor, y no es un detalle: la densidad
// de la lluvia es vida/cadencia. Alargando la caída sin alargar la cadencia,
// las monedas vivas pasarían de ~14 a ~20 y romperían el techo de 18 — que la
// instrucción manda respetar, no subir. Escalando las dos, la densidad queda
// EXACTAMENTE igual que la que Victor vio; lo único que cambia es la velocidad.
export const CAIDA_FACTOR = 1.4
const CAIDA_BASE_MIN_MS = 1100      // lo que medía en CEL-2
const CAIDA_BASE_MAX_MS = 1500
const EMISION_BASE_MS = 90

export const CAIDA_MIN_MS = Math.round(CAIDA_BASE_MIN_MS * CAIDA_FACTOR)   // 1540
export const CAIDA_MAX_MS = Math.round(CAIDA_BASE_MAX_MS * CAIDA_FACTOR)   // 2100
export const EMISION_MS   = Math.round(EMISION_BASE_MS * CAIDA_FACTOR)     // 126

// La calma dura exactamente lo que la caída MÁS LARGA. No es un número
// aproximado que quede bonito: es la única cifra con la que se puede prometer
// que ninguna moneda se desvanece a media caída, ni siquiera la que nació en el
// último milisegundo de la fiesta.
export const CALMA_MS = CAIDA_MAX_MS

// ── CEL-2c · La lluvia dura lo que la melodía ───────────────────────────────
// Segunda decisión de Victor en vivo, y sustituye a la de la lámina: la fiesta
// ya NO termina cuando se para el contador —que aterrizaba a los ~1,5 s y
// dejaba doce segundos de música sobre una pantalla quieta— sino cuando calla
// la música.
//
// Y se encadena igual que el estallido: manda el `end` de Howler y el
// temporizador es la red. Lo que no se puede reutilizar es `esperaPrecedente`,
// porque su tope son 3 s —correcto para el volteo de VC2, absurdo para una
// pieza de 12— así que esta espera tiene el suyo.
export const FIESTA_TOPE_MS = 15000

export function esperaFinMelodia(duracionSegundos) {
  const ms = Number(duracionSegundos) * 1000
  if (!Number.isFinite(ms) || ms <= 0) return MELODIA_MS + ESPERA_MARGEN_MS
  return Math.min(FIESTA_TOPE_MS, ms + ESPERA_MARGEN_MS)
}

// El desvanecido de la melodía cuando el jugador toca para saltar al reposo.
export const FADE_CORTE_MS = 300

// ── Espera hasta "revienta" ─────────────────────────────────────────────────
// `esperaPrecedente` (VC2, sellado) da la red de seguridad cuando SÍ hay un
// sonido sonando: la duración del archivo más un margen. Devuelve 0 cuando no
// hay a qué esperar —mute, archivo que no arrancó—, y ahí es donde CEL-2 se
// separa de VC2: el arco VISUAL no puede colapsar a cero porque el sonido esté
// apagado, o el jugador con mute vería la fiesta empezar antes de que la
// pantalla haya terminado de aparecer. Sin `end` que escuchar, manda el reloj
// nominal del toc-toc.
export function esperaRevienta(audio) {
  const e = esperaPrecedente(audio)
  return e > 0 ? e : TOC_NOMINAL_MS
}

// ── El perfil de una moneda ─────────────────────────────────────────────────
// Todo lo que distingue a una gota de otra, decidido de una vez y en función
// pura: el componente no llama a `Math.random` ni una vez, así que una prueba
// puede alimentar la secuencia que quiera y comprobar que ningún valor se sale
// de su rango.
//   izq    · % del ancho donde nace
//   lado   · px de la moneda (las de atrás, pequeñas; las de delante, grandes)
//   caida  · ms que tarda en cruzar
//   giro   · ms por vuelta, con signo (sentido)
//   deriva · px de desplazamiento lateral en toda la caída
//   opacidad · las pequeñas van más apagadas: profundidad sin una capa extra
export const LADO_MIN = 14
export const LADO_MAX = 30

// CEL-2c · El techo de opacidad baja de 1 a 0,7, con su motivo registrado: una
// moneda a plena opacidad cruzando la frase del ganador es oro sobre oro, y
// durante medio segundo la frase deja de leerse (capturado en
// `arco-2b-fiesta-plena` de la corrida de CEL-2). Al 0,7 la moneda sigue siendo
// una moneda y la frase sigue siendo legible. Constante única y ajustable.
export const OPACIDAD_MIN = 0.55
export const OPACIDAD_MAX = 0.7

export function perfilGota(rnd) {
  const r = () => {
    const v = rnd()
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 0.999999999) : 0
  }
  const lado = Math.round(LADO_MIN + r() * (LADO_MAX - LADO_MIN))
  // La caída y el tamaño van EMPAREJADOS y no sorteados por separado: lo que se
  // ve como profundidad es que lo pequeño (lejos) baje despacio y lo grande
  // (cerca) baje deprisa. Sorteando las dos cosas aparte salen monedas grandes
  // y lentas, que es exactamente lo que rompe la ilusión.
  const cerca = (lado - LADO_MIN) / (LADO_MAX - LADO_MIN)
  const caida = Math.round(CAIDA_MAX_MS - cerca * (CAIDA_MAX_MS - CAIDA_MIN_MS))
  const sentido = r() < 0.5 ? -1 : 1
  return {
    izq: Math.round(r() * 10000) / 100,
    lado,
    caida,
    giro: sentido * Math.round(900 + r() * 700),
    deriva: Math.round((r() * 2 - 1) * 40),
    opacidad: Math.round((OPACIDAD_MIN + cerca * (OPACIDAD_MAX - OPACIDAD_MIN)) * 100) / 100,
  }
}
