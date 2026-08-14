import { PHASES } from '../engine/gameEngine'
import { isAjilei } from '../engine/handEvaluator'

// ── MSG-U1 · El compositor de resultados ────────────────────────────────────
// Documento rector: docs/AJILEI_Mensajes_Resultado_v1.0.md.
//
// LA DECISIÓN: los mensajes de RESULTADO —showdown, manos ganadas por retiros y
// fin de partida— dejan de pintarse desde `game.message` y se COMPONEN aquí,
// desde el estado. El motor no se toca y sigue emitiendo sus cadenas; nadie las
// pinta para resultados. La crónica de apuestas y todo lo demás siguen saliendo
// de `game.message` exactamente como hoy.
//
// El interruptor es por FASE Y EMISOR, jamás por regex: esta función devuelve
// null fuera de PAYOUT/GAME_OVER, y ése es todo el criterio. El censo MSG-C0
// demostró que la UI ya tiene en el pago TODO lo necesario para escribir la
// frase por su cuenta —winner, players[].score con palo y puntos, las cartas
// reveladas, handRules.ruleN para recalcular AJILEI con isAjilei (molde VC2),
// manoIndex para el desempate, y el score === null del ganador que delata una
// mano ganada por retiros—, así que la unificación NUNCA necesitó que se
// abrieran los protegidos.
//
// Función PURA: sin React, sin DOM. Vitest la sella entera.

// Voz de la casa, la misma que Mano actual (U3) y la tarjeta de sesión (VC2):
// "Oros, 27 pts". El motor decía "Oros (27 pts)" y las dos convivían en el pago.
export const voz = (score) => `${score.palo}, ${score.points} pts`

// Segunda persona para el humano, tercera para las IAs. Dos formas porque el
// castellano las distingue: al inicio de frase "La IA gana…", en medio "Gana la
// IA…". En mesas de 3+ el nombre propio ("IA 2") vale para las dos.
const sujetoInicial = (p, numPlayers) => (numPlayers === 2 ? 'La IA' : p.name)
const sujetoMedio   = (p, numPlayers) => (numPlayers === 2 ? 'la IA' : p.name)

// "Ambos" no sobrevive a una mesa de cinco. Improbable no es imposible: hay un
// AJILEI natural por palo (as + tres + las tres figuras = 51) más la variante de
// comodín de mesa 5, así que hasta cinco manos perfectas caben en un reparto.
const CUANTOS = { 2: 'Ambos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco' }

export const TONOS = ['gana', 'pierde', 'oro', 'neutro']

// Clase CSS del óvalo a partir del tono. El fin de partida NO pasa por aquí:
// vive en su propia superficie (.game-over-msg) con su propio tratamiento.
export function claseTono(tono) {
  if (tono === 'gana')   return ' msg-win'
  if (tono === 'pierde') return ' msg-lose'
  return ''
}

// ── Fin de partida ──────────────────────────────────────────────────────────
// Los TEXTOS no cambian (decisión de Victor): se reproducen literales para que
// también salgan del compositor y nadie tenga que pintar game.message nunca.
// Lo que cambia es el tono: el oro de marca queda RESERVADO a la victoria; la
// derrota pasa a neutro sobrio. Antes las dos se pintaban en el mismo oro.
function finDePartida({ winner, players }) {
  if (winner === 0) {
    return { texto: '¡Ganaste la mesa! Eres el último con fichas.', tono: 'oro' }
  }
  if (winner != null) {
    return { texto: `${players[winner].name} gana la mesa. Te quedaste sin fichas.`, tono: 'neutro' }
  }
  // Sin ganador: o no queda nadie en pie, o el humano quebró con la mesa viva.
  // El motor los distingue por su rama; aquí se deriva de los vivos, que es el
  // mismo hecho leído del estado en vez de heredado del mensaje.
  const vivos = players.filter(p => !p.eliminated).length
  return { texto: vivos === 0 ? 'Mesa terminada.' : 'Te quedaste sin fichas.', tono: 'neutro' }
}

// ── Manos ganadas por retiros ───────────────────────────────────────────────
// Los textos actuales YA cumplen el criterio sellado —anuncian al ganador, sin
// "Pierdes." y sin contraste— así que se conservan al pie de la letra. Cambia
// sólo de dónde salen. Se reconocen porque el ganador NO tiene score: no hubo
// comparación, luego no hubo volteo.
function porRetiros({ winner, players, numPlayers }) {
  const tono = winner === 0 ? 'gana' : 'pierde'
  if (numPlayers === 2) {
    return {
      texto: winner === 0 ? '¡La IA se retira! Ganaste el pozo.' : 'Te retiras. La IA gana el pozo.',
      tono,
    }
  }
  return {
    texto: winner === 0
      ? 'Los demás se retiran. ¡Ganaste el pozo!'
      : `Los demás se retiran. Gana ${players[winner].name}.`,
    tono,
  }
}

// ── Showdown ────────────────────────────────────────────────────────────────
// Mismo criterio en las CUATRO mesas: se anuncia al ganador y su mano, nunca la
// del perdedor. La palabra "Pierdes." no existe en ninguna plantilla.
function deShowdown({ winner, players, numPlayers, manoIndex, ruleN }) {
  const g       = players[winner]
  const humano  = winner === 0
  const tono    = humano ? 'gana' : 'pierde'
  const suIni   = sujetoInicial(g, numPlayers)
  const suMed   = sujetoMedio(g, numPlayers)

  // Sólo cuentan los que llegaron a comparación: el motor deja score en null a
  // quien se retiró.
  const enJuego    = players.filter(p => p.score)
  const max        = Math.max(...enJuego.map(p => p.score.points))
  const empatados  = enJuego.filter(p => p.score.points === max)
  // AJILEI por RECÁLCULO, jamás leído del estado ni del mensaje (doctrina VC2):
  // la bandera que doShowdown calcula muere en su variable local.
  const ajileis    = enJuego.filter(p => Array.isArray(p.cards) && isAjilei(p.cards, ruleN))

  // El desempate lo gana el más cercano a la Mano; si el ganador ES la Mano, se
  // dice así. Se deriva de manoIndex, no se supone.
  const desempate = winner === manoIndex ? 'por ser la Mano' : 'por ser el más cercano a la Mano'

  // 1 · Varias manos perfectas Y empate: el caso que en mesa 2 mentía. Ahora se
  //     compone desde `winner`, así que es veraz en las DOS direcciones y el
  //     color no puede contradecir al texto: los dos salen del mismo tono.
  if (ajileis.length >= 2 && empatados.length > 1) {
    const cuantos = CUANTOS[ajileis.length] ?? String(ajileis.length)
    const cabeza  = `¡${cuantos} con AJILEI!`
    return {
      texto: humano ? `${cabeza} Ganas ${desempate}.` : `${cabeza} ${suIni} gana ${desempate}.`,
      tono,
    }
  }

  // 2 · Mano perfecta del ganador. Un AJILEI siempre tiene la puntuación máxima
  //     (51 natural, 52 con comodín) y ninguna mano corriente los alcanza, así
  //     que si hay AJILEI en mesa el ganador lo tiene. La distinción "(comodín)"
  //     se conserva del motor.
  if (ajileis.some(p => p.id === winner)) {
    const comodin = g.score.points >= 52 ? ' (comodín)' : ''
    return {
      texto: humano
        ? `¡AJILEI! Ganas con mano perfecta${comodin}.`
        : `¡AJILEI! ${suIni} gana con mano perfecta${comodin}.`,
      tono,
    }
  }

  // 3 · Empate a puntos resuelto por cercanía a la Mano.
  if (empatados.length > 1) {
    return {
      texto: humano
        ? `Empate, ${max} pts. Ganas ${desempate}.`
        : `Empate, ${max} pts. Gana ${suMed} ${desempate}.`,
      tono,
    }
  }

  // 4 · Victoria corriente: se nombra SÓLO la mano ganadora. Antes mesa 2
  //     contrastaba ("vs tu Bastos, 27 pts"), que es justo lo que el criterio
  //     prohíbe, y 3/4/5 ya no lo hacían.
  return {
    texto: humano
      ? `¡Ganas con ${voz(g.score)}!`
      : `${suIni} gana con ${voz(g.score)}.`,
    tono,
  }
}

// ── La puerta ───────────────────────────────────────────────────────────────
// Devuelve null fuera de resultado: ahí el óvalo sigue pintando game.message.
export function composeResultado({ phase, winner, players, numPlayers, manoIndex, ruleN }) {
  if (!Array.isArray(players) || players.length === 0) return null
  if (phase === PHASES.GAME_OVER) return finDePartida({ winner, players })
  if (phase !== PHASES.PAYOUT || winner == null) return null
  if (!players[winner]) return null
  if (!players[winner].score) return porRetiros({ winner, players, numPlayers })
  return deShowdown({ winner, players, numPlayers, manoIndex, ruleN })
}
