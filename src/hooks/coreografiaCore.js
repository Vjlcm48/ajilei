import { CONTEO_MS } from './sesionCore'
import { esperaPrecedente } from './celebracionCore'

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
export const CONTEO_MIN_MS = CONTEO_MS      // 1400
export const CONTEO_MAX_MS = 1800
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

// Los DOS contadores comparten reloj —suben juntos y aterrizan juntos—, así que
// la magnitud que fija la duración es la mayor de las dos. Con el saldo en
// 5.000 y unas netas de 0, manda el saldo: lo que se mira subir es él.
export function magnitudConteo(netas, saldo) {
  return Math.max(Math.abs(Number(netas) || 0), Math.abs(Number(saldo) || 0))
}

// ── La lluvia ───────────────────────────────────────────────────────────────
// El techo de la lámina: 18 monedas vivas a la vez, jamás una más. La cadencia
// sale de ahí y no al revés: con una vida media de 1,3 s, emitir cada 90 ms
// deja ~14 en el aire en régimen —dentro del 12-18 pedido— y el tope de 18 sólo
// actúa como tope.
export const GOTAS_MAX = 18
export const EMISION_MS = 90
export const CAIDA_MIN_MS = 1100
export const CAIDA_MAX_MS = 1500

// La calma dura exactamente lo que la caída MÁS LARGA. No es un número
// aproximado que quede bonito: es la única cifra con la que se puede prometer
// que ninguna moneda se desvanece a media caída, ni siquiera la que nació en el
// último milisegundo de la fiesta.
export const CALMA_MS = CAIDA_MAX_MS

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
    opacidad: Math.round((0.55 + cerca * 0.45) * 100) / 100,
  }
}
