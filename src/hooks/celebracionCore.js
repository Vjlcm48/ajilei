import { PHASES } from '../engine/gameEngine'
import { isAjilei } from '../engine/handEvaluator'

// ── DSK-VC2 · El decisor de celebración ─────────────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §2.
// Función PURA y única: toda la lógica de "¿se celebra, y qué?" vive aquí y en
// ningún otro sitio. Sin React, sin DOM, sin audio — Vitest la sella entera.

// VIS-3 · 'recoleccion' es el cuarto nivel: gana una IA. Se llama así y no
// "derrota" porque lo que describe no es el resultado sino el GESTO — alguien
// recoge el pozo. Es el nivel más callado de los cuatro: vuela y suena el roce
// de fichas, nada más.
export const NIVELES = ['ajilei', 'mano', 'recoleccion', 'partida']

// Techo de duración de las celebraciones EN MESA (v1.0 §3). La tarjeta de fin
// de partida está exenta: es pantalla terminal, no interrumpe nada.
export const CELEBRACION_TOPE_MS = 2500
export const VIAJE_MS = 1100      // el pozo deslizándose hasta la pila
export const VIAJE_ESCALON_MS = 90 // desfase entre fichas del reguero
// VIS-3 · Siete monedas SIEMPRE. 7 = hepta; decisión de Victor. Sustituye a la
// fórmula que las contaba según el tamaño del pozo (3–7 según `ultimoPozo`): el
// reguero era una lectura del bote, y pasa a ser una firma de la casa.
// Siete son VIAJE_MS + 6·VIAJE_ESCALON_MS = 1640 ms, bajo el techo de 2500.
export const VIAJE_N = 7
// El desvanecido final del reguero. No es una constante nueva: es el 240 que ya
// vivía suelto en la transición de FichaViajera, con nombre. VIS-3 lo necesita
// nombrado porque el micro-ajuste de escala se acompasa a él.
export const VIAJE_DESVANECIDO_MS = 240
export const PULSO_MS = 900        // un ciclo, uno solo
export const AJILEI_MS = 2000      // aparición breve de la palabra

// Reglas, en el orden EXACTO en que se aplican:
//
//   1. SIN GANADOR NO HAY NADA. `winner === null` es el primer filtro, y ahora
//      es indispensable: desde VIS-3 un `winner` que no sea 0 ya no cae en el
//      mismo saco que "no hay ganador", y `null !== 0` es cierto.
//
//   2. GAME_OVER antes que PAYOUT. Son fases distintas y no compiten (media un
//      clic humano en "Siguiente mano"), pero el orden lo deja explícito. La
//      partida sólo se celebra si la gana el humano: la mesa que pierde el
//      humano NO estrena nada, y eso no lo toca VIS-3.
//
//   3. VIS-3 · winner !== 0 en PAGO deja de ser `null` y pasa a 'recoleccion'.
//      Ésta era la guarda "sin excepción" de v1.0 y se reabre con contabilidad:
//      lo que aquella guarda protegía era que una DERROTA no se subrayara, y
//      'recoleccion' no la subraya —ni overlay ni pulso ni fanfarria—, sólo
//      mueve el pozo a quien se lo llevó. El caso que la guarda vigilaba, un
//      AJILEI del humano que PIERDE, sigue cubierto y por la misma razón: se
//      resuelve aquí, antes de mirar las cartas, así que jamás llega a 'ajilei'.
//      (Ocurre de verdad: con dos AJILEI en mesa el desempate lo gana el más
//      cercano a la Mano, así que el humano puede tener mano perfecta y perder.)
//
//   4. AJILEI por RECÁLCULO, jamás leyendo el estado ni el mensaje. La bandera
//      `ajilei` que doShowdown calcula muere en su variable local: newPlayers
//      sólo arrastra `score`. Se recalcula con isAjilei —exportada y pura—
//      contra el ruleN CONGELADO de la mano, nunca un recuento vivo. Acepta las
//      DOS variantes que el motor reconoce: la natural (5 del palo, 51) y la de
//      comodín (mesa 5: 4 del palo + 7 de Oros, 52).
//
//   5. AJILEI SUSTITUYE a mano. Juega sólo la mayor, nunca encadenadas.
export function decideCelebracion({ phase, winner, humanCards, ruleN }) {
  if (winner === null || winner === undefined) return null
  if (phase === PHASES.GAME_OVER) return winner === 0 ? 'partida' : null
  if (phase !== PHASES.PAYOUT) return null
  if (winner !== 0) return 'recoleccion'
  if (Array.isArray(humanCards) && isAjilei(humanCards, ruleN)) return 'ajilei'
  return 'mano'
}

// ── VIS-3 · Las tres banderas de un nivel ───────────────────────────────────
// El contrato de qué monta cada nivel, dicho UNA vez y en un solo sitio. No es
// una cuarta fuente de verdad: se compone de las tres funciones puras que ya
// existían, así que no puede desincronizarse de ellas.
//   · vuelo     — corren las monedas.
//   · overlay   — la palabra ¡AJILEI! en grande.
//   · fanfarria — el subrayado de victoria: el pulso dorado del nombre, o el
//                 rasgueo. El roce de fichas NO es fanfarria: es el sonido de
//                 mover dinero, y suena también cuando lo recoge una IA.
export function banderasDe(nivel) {
  return {
    vuelo: llevaViaje(nivel),
    overlay: nivel === 'ajilei',
    fanfarria: llevaPulso(nivel) || nivel === 'ajilei',
  }
}

// El viaje del pozo corre en los TRES niveles de mesa: el pozo se ganó igual, y
// desde VIS-3 también cuando quien se lo lleva es una IA — el dinero se mueve
// gane quien gane, y verlo moverse es información, no celebración.
// Lo que AJILEI se lleva por delante es el pulso y el roce de fichas — el
// rasgueo es el sonido de ese momento y no comparte.
export const llevaViaje = (nivel) => nivel === 'mano' || nivel === 'ajilei' || nivel === 'recoleccion'
export const llevaPulso = (nivel) => nivel === 'mano'

// Sonido de cada nivel. `null` = silencio propio (AJILEI no suma el roce).
// 'recoleccion' suena a `chipsCollect` y no a otra cosa: es el MISMO gesto que
// en 'mano' —fichas que se deslizan— y el roce es de quien recoge, no de quien
// gana. Que suene igual gane quien gane es deliberado.
export function sonidoDe(nivel) {
  if (nivel === 'mano' || nivel === 'recoleccion') return 'chipsCollect'
  if (nivel === 'ajilei') return 'ajileiStrum'
  if (nivel === 'partida') return 'tableKnock'
  return null
}

// ── DSK-VC2b · La espera al sonido del ganador ──────────────────────────────
// El viaje del pozo deja de arrancar EN PARALELO con showdown.mp3 y arranca en
// su `end`. La condición de un visual, sin embargo, no puede ser el final de un
// sonido que nunca empezó: en las manos ganadas por retiros no hay volteo y no
// suena nada, y con el mute puesto play() devuelve null. En esos casos la
// espera es CERO y el viaje sale de inmediato.
//
// El temporizador que devuelve esta función es la RED, no el reloj: manda el
// evento `end` de Howler, y esto sólo cubre que el evento no llegue nunca (un
// archivo que no carga, un stop externo). Por eso el margen sobre la duración.
export const ESPERA_MARGEN_MS = 250
export const ESPERA_TOPE_MS = 3000

// Devuelve los ms de la red de seguridad, o 0 = «no hay a qué esperar».
export function esperaPrecedente(audio) {
  if (!audio || !audio.sound || audio.id == null) return 0
  const s = audio.sound
  // Un sonido que ya terminó (o que jamás llegó a sonar) no encadena nada.
  if (typeof s.playing === 'function' && !s.playing(audio.id)) return 0
  const dur = typeof s.duration === 'function' ? Number(s.duration()) * 1000 : 0
  if (!Number.isFinite(dur) || dur <= 0) return ESPERA_TOPE_MS
  return Math.min(ESPERA_TOPE_MS, dur + ESPERA_MARGEN_MS)
}

// Duración total de la celebración en mesa, para el arnés y para el temporizador.
export function duracionDe(nivel, nFichas = 1) {
  if (nivel === 'ajilei') return AJILEI_MS
  if (nivel === 'mano' || nivel === 'recoleccion') return VIAJE_MS + (nFichas - 1) * VIAJE_ESCALON_MS
  return null   // 'partida' es pantalla terminal: sin techo
}
