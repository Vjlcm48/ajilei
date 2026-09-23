import { describe, it, expect } from 'vitest'
import {
  decideCelebracion, llevaViaje, llevaPulso, sonidoDe, duracionDe, banderasDe,
  CELEBRACION_TOPE_MS, VIAJE_MS, VIAJE_ESCALON_MS, AJILEI_MS,
  VIAJE_N, VIAJE_DESVANECIDO_MS,
  esperaPrecedente, ESPERA_MARGEN_MS, ESPERA_TOPE_MS,
} from '../src/hooks/celebracionCore.js'
import {
  sesionInicial, anotarMano, fichasNetas, valorConteo, CONTEO_MS,
} from '../src/hooks/sesionCore.js'
import { PHASES } from '../src/engine/gameEngine.js'
import { AJILEI_CONFIG } from '../src/config/ajileiConfig.js'

// ── DSK-VC2 · Los dos núcleos puros ─────────────────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §2 y §5.
// Aquí vive lo que debe ser cierto sin un navegador delante. Lo que sólo existe
// en la página —Δ=0, capas, el toque que corta, el mute— lo cubre el modo vc
// del arnés.

const carta = (palo, points, value = 10) => ({ palo, points, value })

// AJILEI natural: cinco del mismo palo sumando 51.
const AJILEI_NATURAL = [
  carta('Oros', 11, 1), carta('Oros', 10, 12), carta('Oros', 10, 11),
  carta('Oros', 10, 10), carta('Oros', 10, 3),
]
// AJILEI de comodín (SÓLO mesa 5): cuatro del palo + 7 de Oros, 41 + 11 = 52.
const AJILEI_COMODIN = [
  carta('Espadas', 11, 1), carta('Espadas', 10, 12),
  carta('Espadas', 10, 11), carta('Espadas', 10, 10),
  carta('Oros', 7, 7),
]
const MANO_NORMAL = [
  carta('Copas', 11, 1), carta('Copas', 10, 12),
  carta('Espadas', 10, 11), carta('Bastos', 10, 10), carta('Bastos', 6, 6),
]

// VIS-3 · Este bloque se llamaba "winner === 0 sin excepción" y sellaba que una
// victoria de IA no produjera NADA. La guarda se reabre con contabilidad: lo que
// protegía era que una DERROTA no se subrayara, y eso sigue sellado abajo — lo
// que cambia es que el dinero ahora se ve moverse hacia quien se lo llevó.
describe('VC2/VIS-3 · el decisor · la victoria de IA recolecta, no celebra', () => {
  it('gana una IA → recoleccion, en cualquier asiento', () => {
    for (const seat of [1, 2, 3, 4]) {
      expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: seat, humanCards: MANO_NORMAL, ruleN: 5 })).toBe('recoleccion')
    }
  })

  // Lo que la guarda de v1.0 protegía de verdad, y sigue protegido: recolectar
  // NO es celebrar. Ni overlay, ni pulso, ni fanfarria — sólo el vuelo y el roce.
  it('recoleccion vuela pero no celebra', () => {
    expect(banderasDe('recoleccion')).toEqual({ vuelo: true, overlay: false, fanfarria: false })
    expect(llevaViaje('recoleccion')).toBe(true)
    expect(llevaPulso('recoleccion')).toBe(false)
    expect(sonidoDe('recoleccion')).toBe('chipsCollect')
  })

  it('las banderas de los otros tres niveles no se mueven', () => {
    expect(banderasDe('mano')).toEqual({ vuelo: true, overlay: false, fanfarria: true })
    expect(banderasDe('ajilei')).toEqual({ vuelo: true, overlay: true, fanfarria: true })
    expect(banderasDe('partida')).toEqual({ vuelo: false, overlay: false, fanfarria: false })
    expect(banderasDe(null)).toEqual({ vuelo: false, overlay: false, fanfarria: false })
  })

  it('no celebra con winner null (mesa terminada sin superviviente, humano en quiebra)', () => {
    expect(decideCelebracion({ phase: PHASES.GAME_OVER, winner: null, humanCards: MANO_NORMAL, ruleN: 2 })).toBe(null)
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: null, humanCards: MANO_NORMAL, ruleN: 2 })).toBe(null)
    // VIS-3 hace esta guarda INDISPENSABLE: con `winner !== 0` ya no cayendo en
    // null, un `winner` nulo sin filtrar se leería como "ganó una IA".
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: undefined, humanCards: MANO_NORMAL, ruleN: 2 })).toBe(null)
  })

  it('la PARTIDA ajena sigue sin celebrarse: recoleccion es sólo de la mano', () => {
    for (const seat of [1, 2, 3, 4]) {
      expect(decideCelebracion({ phase: PHASES.GAME_OVER, winner: seat, humanCards: MANO_NORMAL, ruleN: 5 })).toBe(null)
    }
  })

  // ── BLINDAJE EXPLÍCITO ────────────────────────────────────────────────────
  // Un AJILEI del humano que PIERDE existe de verdad: con dos AJILEI en mesa el
  // desempate lo gana el más cercano a la Mano, así que el humano puede tener
  // mano perfecta y perder. Mano perfecta y derrota siguen siendo derrota: NO
  // se celebra. Sigue resolviéndose ANTES de mirar las cartas, así que jamás
  // llega a 'ajilei' — lo único que cambia es que ahora se ve el pozo irse.
  it('AJILEI PERDIDO no celebra — ni natural ni de comodín', () => {
    for (const c of [{ w: 1, m: AJILEI_NATURAL, r: 2 }, { w: 1, m: AJILEI_COMODIN, r: 5 }, { w: 3, m: AJILEI_NATURAL, r: 5 }]) {
      const nivel = decideCelebracion({ phase: PHASES.PAYOUT, winner: c.w, humanCards: c.m, ruleN: c.r })
      expect(nivel).toBe('recoleccion')
      expect(nivel).not.toBe('ajilei')
      expect(banderasDe(nivel).overlay).toBe(false)
      expect(banderasDe(nivel).fanfarria).toBe(false)
    }
  })
})

describe('VC2 · el decisor · niveles y jerarquía', () => {
  it('una mano ganada normal es "mano"', () => {
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: 0, humanCards: MANO_NORMAL, ruleN: 5 })).toBe('mano')
  })

  it('AJILEI natural (51) SUSTITUYE a mano', () => {
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: 0, humanCards: AJILEI_NATURAL, ruleN: 2 })).toBe('ajilei')
  })

  it('AJILEI de comodín (52, mesa 5) también es AJILEI', () => {
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: 0, humanCards: AJILEI_COMODIN, ruleN: 5 })).toBe('ajilei')
  })

  it('esa MISMA mano en mesa 4 no es AJILEI — la variante de comodín es sólo de 5', () => {
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: 0, humanCards: AJILEI_COMODIN, ruleN: 4 })).toBe('mano')
  })

  it('GAME_OVER con el humano en pie es "partida"', () => {
    expect(decideCelebracion({ phase: PHASES.GAME_OVER, winner: 0, humanCards: MANO_NORMAL, ruleN: 2 })).toBe('partida')
  })

  it('ninguna otra fase celebra', () => {
    for (const f of [PHASES.WAITING, PHASES.DEAL_2, PHASES.BET_1, PHASES.DEAL_3,
      PHASES.BET_2, PHASES.DISCARD, PHASES.BET_3, PHASES.SHOWDOWN]) {
      expect(decideCelebracion({ phase: f, winner: 0, humanCards: AJILEI_NATURAL, ruleN: 2 })).toBe(null)
    }
  })

  it('sin cartas no revienta ni inventa un AJILEI', () => {
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: 0, humanCards: null, ruleN: 2 })).toBe('mano')
    expect(decideCelebracion({ phase: PHASES.PAYOUT, winner: 0, humanCards: [], ruleN: 2 })).toBe('mano')
  })
})

describe('VC2 · qué acompaña a cada nivel', () => {
  it('el viaje del pozo corre en los dos niveles de mesa — el pozo se ganó igual', () => {
    expect(llevaViaje('mano')).toBe(true)
    expect(llevaViaje('ajilei')).toBe(true)
    expect(llevaViaje('partida')).toBe(false)
  })

  it('el pulso es SÓLO de mano: AJILEI se lleva el momento entero', () => {
    expect(llevaPulso('mano')).toBe(true)
    expect(llevaPulso('ajilei')).toBe(false)
  })

  it('cada nivel tiene su sonido y ninguno comparte', () => {
    expect(sonidoDe('mano')).toBe('chipsCollect')
    expect(sonidoDe('ajilei')).toBe('ajileiStrum')
    expect(sonidoDe('partida')).toBe('tableKnock')
    expect(sonidoDe(null)).toBe(null)
  })

  it('las celebraciones de mesa caben en el techo de 2,5s', () => {
    expect(duracionDe('ajilei')).toBe(AJILEI_MS)
    expect(AJILEI_MS).toBeLessThanOrEqual(CELEBRACION_TOPE_MS)
    // VIS-3 · el reguero ya no es "hasta 7": son 7 SIEMPRE, así que el peor caso
    // pasó a ser el ÚNICO caso. Se comprueba contra la constante, no contra un 7
    // escrito aquí: si alguien la mueve, esta prueba lo mide, no lo repite.
    const real = duracionDe('mano', VIAJE_N)
    expect(real).toBe(VIAJE_MS + (VIAJE_N - 1) * VIAJE_ESCALON_MS)
    expect(real).toBeLessThanOrEqual(CELEBRACION_TOPE_MS)
    // Recolectar dura exactamente lo mismo: es el mismo vuelo.
    expect(duracionDe('recoleccion', VIAJE_N)).toBe(real)
  })

  it('VIS-3 · siete monedas, y el desvanecido cabe dentro del vuelo', () => {
    expect(VIAJE_N).toBe(7)
    // El desvanecido y el micro-ajuste de escala viven DENTRO del trayecto de
    // una moneda: si no cupieran, la moneda se apagaría antes de llegar.
    expect(VIAJE_DESVANECIDO_MS).toBeLessThan(VIAJE_MS)
    expect(VIAJE_MS / 2 + VIAJE_MS / 2).toBe(VIAJE_MS)
  })

  it('la partida está EXENTA del techo: es pantalla terminal', () => {
    expect(duracionDe('partida')).toBe(null)
  })
})

// ── DSK-VC2b · la espera al sonido del ganador ──────────────────────────────
// La regla entera: 0 = «arranca YA». Todo lo demás es la red de seguridad, y la
// red nunca es la que manda — manda el `end` de Howler.
describe('VC2b · esperaPrecedente', () => {
  // Doble mínimo de un Howl: sólo lo que la función consulta.
  const howl = ({ suena = true, dur = 2.088 } = {}) => ({
    sound: { playing: () => suena, duration: () => dur },
    id: 7,
  })

  it('sin sonido precedente arranca de inmediato — el mute pasa por aquí', () => {
    // Con el mute puesto, play() devuelve null: ése es el único aviso que llega,
    // y es suficiente. Un onend de un sonido que no sonó no puede ser condición.
    expect(esperaPrecedente(null)).toBe(0)
    expect(esperaPrecedente(undefined)).toBe(0)
  })

  it('un asa sin id no encadena', () => {
    expect(esperaPrecedente({ sound: { playing: () => true, duration: () => 2 } })).toBe(0)
    expect(esperaPrecedente({ sound: null, id: 3 })).toBe(0)
  })

  it('sin comparación no hay volteo: si ya no suena, arranca de inmediato', () => {
    expect(esperaPrecedente(howl({ suena: false }))).toBe(0)
  })

  it('con showdown sonando espera su duración más el margen', () => {
    expect(esperaPrecedente(howl({ dur: 2.088 }))).toBe(2088 + ESPERA_MARGEN_MS)
  })

  it('la red está ACOTADA: un archivo largo no deja la celebración colgada', () => {
    expect(esperaPrecedente(howl({ dur: 60 }))).toBe(ESPERA_TOPE_MS)
  })

  it('una duración inservible cae al tope, no a cero: el end sigue mandando', () => {
    expect(esperaPrecedente(howl({ dur: 0 }))).toBe(ESPERA_TOPE_MS)
    expect(esperaPrecedente(howl({ dur: NaN }))).toBe(ESPERA_TOPE_MS)
  })

  it('la espera JAMÁS se cuenta contra el techo de la celebración', () => {
    // El techo mide el dibujo, que arranca cuando la espera acaba. Que la suma
    // de ambos supere 2,5s es lo esperado y no infringe nada.
    expect(esperaPrecedente(howl()) + duracionDe('mano', 7)).toBeGreaterThan(CELEBRACION_TOPE_MS)
    expect(duracionDe('mano', 7)).toBeLessThanOrEqual(CELEBRACION_TOPE_MS)
  })
})

describe('VC2 · sesión', () => {
  const score = (palo, points) => ({ palo, points, suitScores: { [palo]: points } })

  it('anota manos jugadas y ganadas', () => {
    let s = sesionInicial()
    s = anotarMano(s, { handCount: 1, gano: true, score: score('Oros', 30) })
    s = anotarMano(s, { handCount: 2, gano: false, score: score('Copas', 20) })
    s = anotarMano(s, { handCount: 3, gano: true, score: score('Bastos', 25) })
    expect(s.manosJugadas).toBe(3)
    expect(s.manosGanadas).toBe(2)
  })

  it('la MISMA mano no se cuenta dos veces (guarda de idempotencia)', () => {
    let s = sesionInicial()
    s = anotarMano(s, { handCount: 1, gano: true, score: score('Oros', 30) })
    const repetida = anotarMano(s, { handCount: 1, gano: true, score: score('Oros', 30) })
    expect(repetida).toBe(s)          // misma referencia: React ni re-renderiza
    expect(repetida.manosJugadas).toBe(1)
  })

  it('la mejor mano es la de más puntos, con su palo', () => {
    let s = sesionInicial()
    s = anotarMano(s, { handCount: 1, gano: false, score: score('Copas', 20) })
    s = anotarMano(s, { handCount: 2, gano: true, score: score('Oros', 41) })
    s = anotarMano(s, { handCount: 3, gano: false, score: score('Bastos', 31) })
    expect(s.mejorMano).toEqual({ palo: 'Oros', pts: 41 })
  })

  it('empate a puntos conserva la primera — la que el jugador vio antes', () => {
    let s = sesionInicial()
    s = anotarMano(s, { handCount: 1, gano: true, score: score('Copas', 30) })
    s = anotarMano(s, { handCount: 2, gano: true, score: score('Oros', 30) })
    expect(s.mejorMano).toEqual({ palo: 'Copas', pts: 30 })
  })

  it('una mano sin score (ganada por retiros) cuenta pero no toca la mejor', () => {
    let s = sesionInicial()
    s = anotarMano(s, { handCount: 1, gano: true, score: score('Oros', 30) })
    s = anotarMano(s, { handCount: 2, gano: true, score: null })
    expect(s.manosJugadas).toBe(2)
    expect(s.manosGanadas).toBe(2)
    expect(s.mejorMano).toEqual({ palo: 'Oros', pts: 30 })
  })

  it('fichas netas es un delta con signo contra el saldo de entrada', () => {
    const inicial = AJILEI_CONFIG.economy.pilaPruebas
    expect(fichasNetas(inicial)).toBe(0)
    expect(fichasNetas(inicial + 1200)).toBe(1200)
    expect(fichasNetas(inicial - 800)).toBe(-800)
  })
})

describe('VC2 · conteo sereno, jamás odómetro', () => {
  it('empieza en 0 y aterriza EXACTO en el destino', () => {
    expect(valorConteo(1200, 0)).toBe(0)
    expect(valorConteo(1200, 1)).toBe(1200)
    expect(valorConteo(1200, 1.5)).toBe(1200)
    expect(valorConteo(1200, -0.2)).toBe(0)
  })

  it('desacelera al final — es una salida suave, no un giro plano', () => {
    // A mitad de tiempo ya lleva MÁS de la mitad del recorrido: eso es lo que
    // distingue el aterrizaje sereno del odómetro, que avanza a ritmo constante.
    const mitad = valorConteo(1000, 0.5)
    expect(mitad).toBeGreaterThan(500)
    // Y el último tramo aporta muy poco: casi ha llegado.
    const casi = valorConteo(1000, 0.9)
    expect(casi).toBeGreaterThan(990)
  })

  it('es monótono: nunca retrocede', () => {
    let prev = -1
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = valorConteo(3000, t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('sabe contar hacia abajo un neto negativo sin romperse', () => {
    expect(valorConteo(-800, 0)).toBe(0)
    expect(valorConteo(-800, 1)).toBe(-800)
  })

  it('el conteo dura menos que la paciencia de nadie', () => {
    expect(CONTEO_MS).toBeLessThanOrEqual(2000)
  })
})
