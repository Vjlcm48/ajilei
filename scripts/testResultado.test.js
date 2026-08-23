import { describe, it, expect } from 'vitest'
import { composeResultado, claseTono, voz, vozResto } from '../src/hooks/resultadoCore.js'
import { PHASES } from '../src/engine/gameEngine.js'

// ── MSG-U1 · El compositor de resultados ────────────────────────────────────
// Documento rector: docs/AJILEI_Mensajes_Resultado_v1.0.md.
// Aquí vive la voz entera del juego cuando una mano se cierra. Lo que sólo
// existe en la página —el color aplicado, Δ=0, las dos rutas de render— lo
// cubre el modo msg del arnés.

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

const score = (palo, points) => ({ palo, points, suitScores: { [palo]: points } })

// Constructor de estados: el peor caso se CONSTRUYE, no se juega (receta O2).
function mesa({ n = 2, winner = 0, manoIndex = 0, ruleN = null, phase = PHASES.PAYOUT, asientos }) {
  const players = asientos.map((a, i) => ({
    id: i,
    name: i === 0 ? 'Tú' : (n === 2 ? 'IA' : `IA ${i}`),
    isHuman: i === 0,
    cards: a.cards ?? MANO_NORMAL,
    score: a.score ?? null,
    eliminated: !!a.eliminated,
  }))
  return composeResultado({ phase, winner, players, numPlayers: n, manoIndex, ruleN: ruleN ?? n })
}

describe('MSG-U1 · la puerta: sólo resultados', () => {
  it('fuera de PAYOUT y GAME_OVER no compone nada — ahí manda game.message', () => {
    for (const f of [PHASES.WAITING, PHASES.DEAL_2, PHASES.BET_1, PHASES.DEAL_3,
      PHASES.BET_2, PHASES.DISCARD, PHASES.BET_3, PHASES.SHOWDOWN]) {
      expect(mesa({ phase: f, asientos: [{ score: score('Oros', 27) }, { score: score('Copas', 20) }] })).toBe(null)
    }
  })

  it('PAYOUT sin ganador no compone (no debería ocurrir, pero no revienta)', () => {
    expect(mesa({ winner: null, asientos: [{}, {}] })).toBe(null)
  })
})

describe('MSG-U1 · victoria corriente · sin contraste y con la voz de la casa', () => {
  const normal = (n, winner) => mesa({
    n, winner,
    asientos: Array.from({ length: n }, (_, i) => ({
      score: i === winner ? score('Espadas', 31) : score('Bastos', 27),
    })),
  })

  it('gana el humano — segunda persona, sólo su mano', () => {
    expect(normal(2, 0).texto).toBe('¡Ganas con Espadas, 31 pts!')
    expect(normal(5, 0).texto).toBe('¡Ganas con Espadas, 31 pts!')
  })

  it('gana la IA — mesa 2 la nombra "La IA"; 3/4/5 usan su nombre propio', () => {
    expect(normal(2, 1).texto).toBe('La IA gana con Espadas, 31 pts.')
    expect(normal(5, 2).texto).toBe('IA 2 gana con Espadas, 31 pts.')
  })

  it('NUNCA se nombra la mano del perdedor — el contraste está prohibido', () => {
    for (const n of [2, 3, 4, 5]) for (const w of [0, 1]) {
      expect(normal(n, w).texto).not.toMatch(/vs |tu Bastos|Bastos/)
    }
  })

  it('la voz es "Palo, N pts" — la de Mano actual y la tarjeta de sesión', () => {
    expect(voz(score('Oros', 27))).toBe('Oros, 27 pts')
    expect(normal(2, 0).texto).not.toMatch(/\(\d+ pts\)/)
  })
})

// ── MSG-U1b · las bandas de puntaje entran en la misma voz ──────────────────
// "Tu mejor palo:" y "Mejor palo:" ponen el PALO en negrita, así que renderizan
// la voz en dos piezas. Esta prueba ata las dos formas: si alguien retoca el
// formato en un sitio y no en el otro, aquí se parte.
describe('MSG-U1b · vozResto · la forma partida y la entera son la MISMA', () => {
  it('palo + vozResto reconstruye voz al carácter', () => {
    for (const [palo, pts] of [['Oros', 27], ['Espadas', 999], ['Copas', 0], ['Bastos', 7]]) {
      const s = score(palo, pts)
      expect(s.palo + vozResto(s)).toBe(voz(s))
    }
  })

  it('la cola no lleva paréntesis: es la coma de la casa', () => {
    expect(vozResto(score('Oros', 27))).toBe(', 27 pts')
    expect(vozResto(score('Oros', 27))).not.toMatch(/[()]/)
  })
})

describe('MSG-U1 · empate', () => {
  const empate = (n, winner, manoIndex) => mesa({
    n, winner, manoIndex,
    asientos: Array.from({ length: n }, () => ({ score: score('Oros', 27) })),
  })

  it('gana el humano siendo Mano', () => {
    expect(empate(2, 0, 0).texto).toBe('Empate, 27 pts. Ganas por ser la Mano.')
  })

  it('gana una IA no siendo Mano — el sujeto va EN MEDIO, en minúscula si es "la IA"', () => {
    expect(empate(5, 2, 1).texto).toBe('Empate, 27 pts. Gana IA 2 por ser el más cercano a la Mano.')
    expect(empate(2, 1, 0).texto).toBe('Empate, 27 pts. Gana la IA por ser el más cercano a la Mano.')
  })

  it('gana una IA SIENDO Mano', () => {
    expect(empate(2, 1, 1).texto).toBe('Empate, 27 pts. Gana la IA por ser la Mano.')
  })

  it('un empate entre DOS con un tercero por debajo sigue siendo empate', () => {
    const r = mesa({
      n: 3, winner: 0, manoIndex: 0,
      asientos: [{ score: score('Oros', 27) }, { score: score('Copas', 27) }, { score: score('Bastos', 20) }],
    })
    expect(r.texto).toBe('Empate, 27 pts. Ganas por ser la Mano.')
  })
})

describe('MSG-U1 · AJILEI', () => {
  it('mano perfecta natural del humano', () => {
    const r = mesa({
      n: 2, winner: 0,
      asientos: [{ cards: AJILEI_NATURAL, score: score('Oros', 51) }, { score: score('Copas', 27) }],
    })
    expect(r.texto).toBe('¡AJILEI! Ganas con mano perfecta.')
  })

  it('mano perfecta de una IA', () => {
    const r = mesa({
      n: 5, winner: 2, ruleN: 5,
      asientos: [{ score: score('Copas', 27) }, { score: score('Copas', 20) },
        { cards: AJILEI_NATURAL, score: score('Oros', 51) }, { score: score('Copas', 20) }, { score: score('Copas', 20) }],
    })
    expect(r.texto).toBe('¡AJILEI! IA 2 gana con mano perfecta.')
  })

  it('la variante de COMODÍN se distingue, y sólo existe en mesa 5', () => {
    const enCinco = mesa({
      n: 5, winner: 0, ruleN: 5,
      asientos: [{ cards: AJILEI_COMODIN, score: score('Espadas', 52) },
        { score: score('Copas', 20) }, { score: score('Copas', 20) }, { score: score('Copas', 20) }, { score: score('Copas', 20) }],
    })
    expect(enCinco.texto).toBe('¡AJILEI! Ganas con mano perfecta (comodín).')

    // La MISMA mano en mesa 4 no es AJILEI: se compone como victoria corriente.
    const enCuatro = mesa({
      n: 4, winner: 0, ruleN: 4,
      asientos: [{ cards: AJILEI_COMODIN, score: score('Espadas', 41) },
        { score: score('Copas', 20) }, { score: score('Copas', 20) }, { score: score('Copas', 20) }],
    })
    expect(enCuatro.texto).toBe('¡Ganas con Espadas, 41 pts!')
  })
})

// ── BLINDAJE EXPLÍCITO ──────────────────────────────────────────────────────
// El bug del motor: en mesa 2, con ambos en AJILEI, la cadena afirma "Ganas por
// ser el mano" SIN consultar quién ganó. Y el color SÍ lo consultaba, así que la
// misma línea salía en rojo diciendo que ganabas. Compuesto desde `winner`,
// texto y tono son el mismo hecho y no pueden contradecirse.
describe('MSG-U1 · doble AJILEI · veraz en las DOS direcciones', () => {
  const doble = (winner, manoIndex) => mesa({
    n: 2, winner, manoIndex,
    asientos: [
      { cards: AJILEI_NATURAL, score: score('Oros', 51) },
      { cards: AJILEI_NATURAL, score: score('Copas', 51) },
    ],
  })

  it('gana el humano', () => {
    const r = doble(0, 0)
    expect(r.texto).toBe('¡Ambos con AJILEI! Ganas por ser la Mano.')
    expect(r.tono).toBe('gana')
  })

  it('gana la IA — el caso que el motor pintaba al revés', () => {
    const r = doble(1, 1)
    expect(r.texto).toBe('¡Ambos con AJILEI! La IA gana por ser la Mano.')
    expect(r.tono).toBe('pierde')
    expect(r.texto).not.toMatch(/Ganas/)
  })

  it('texto y tono JAMÁS se contradicen: si el texto dice "Ganas", el tono gana', () => {
    for (const [w, m] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      const r = doble(w, m)
      expect(/\bGanas\b/.test(r.texto)).toBe(r.tono === 'gana')
    }
  })

  it('"Ambos" no sobrevive a una mesa de cinco: se cuenta de verdad', () => {
    const r = mesa({
      n: 5, winner: 0, manoIndex: 0, ruleN: 5,
      asientos: [
        { cards: AJILEI_NATURAL, score: score('Oros', 51) },
        { cards: AJILEI_NATURAL, score: score('Copas', 51) },
        { cards: AJILEI_NATURAL, score: score('Bastos', 51) },
        { score: score('Copas', 20) }, { score: score('Copas', 20) },
      ],
    })
    expect(r.texto).toBe('¡Tres con AJILEI! Ganas por ser la Mano.')
  })

  it('dos AJILEI SIN empate (51 vs 52 de comodín) no es doble: gana por puntos', () => {
    const r = mesa({
      n: 5, winner: 0, manoIndex: 3, ruleN: 5,
      asientos: [
        { cards: AJILEI_COMODIN, score: score('Espadas', 52) },
        { cards: AJILEI_NATURAL, score: score('Oros', 51) },
        { score: score('Copas', 20) }, { score: score('Copas', 20) }, { score: score('Copas', 20) },
      ],
    })
    expect(r.texto).toBe('¡AJILEI! Ganas con mano perfecta (comodín).')
  })
})

describe('MSG-U1 · manos ganadas por retiros · textos conservados', () => {
  // Se reconocen porque el ganador NO tiene score: no hubo comparación.
  const retiro = (n, winner) => mesa({
    n, winner,
    asientos: Array.from({ length: n }, () => ({ score: null })),
  })

  it('mesa 2', () => {
    expect(retiro(2, 0).texto).toBe('¡La IA se retira! Ganaste el pozo.')
    expect(retiro(2, 1).texto).toBe('Te retiras. La IA gana el pozo.')
  })

  it('mesas 3/4/5', () => {
    expect(retiro(4, 0).texto).toBe('Los demás se retiran. ¡Ganaste el pozo!')
    expect(retiro(4, 2).texto).toBe('Los demás se retiran. Gana IA 2.')
  })

  it('el tono sigue a winner, no al texto', () => {
    expect(retiro(2, 0).tono).toBe('gana')
    expect(retiro(2, 1).tono).toBe('pierde')
  })
})

describe('MSG-U1 · fin de partida · el oro es de la victoria', () => {
  const fin = (winner, vivos = 1, n = 2) => mesa({
    n, winner, phase: PHASES.GAME_OVER,
    asientos: Array.from({ length: n }, (_, i) => ({ eliminated: i >= vivos })),
  })

  it('los TEXTOS no cambian', () => {
    expect(fin(0).texto).toBe('¡Ganaste la mesa! Eres el último con Heptacoins.')
    expect(fin(1, 2, 3).texto).toBe('IA 1 gana la mesa. Te quedaste sin Heptacoins.')
  })

  it('oro SÓLO en la victoria del humano; la derrota, neutro', () => {
    expect(fin(0).tono).toBe('oro')
    expect(fin(1, 2, 3).tono).toBe('neutro')
  })

  it('sin ganador: se distingue por los vivos, no por el mensaje heredado', () => {
    expect(fin(null, 0, 2).texto).toBe('Mesa terminada.')
    expect(fin(null, 2, 3).texto).toBe('Te quedaste sin Heptacoins.')
    expect(fin(null, 2, 3).tono).toBe('neutro')
  })
})

describe('MSG-U1 · invariantes de toda la voz', () => {
  // Barrido por las CUATRO mesas y todos los escenarios componibles.
  const todos = []
  for (const n of [2, 3, 4, 5]) {
    for (let w = 0; w < n; w++) {
      const llenos = Array.from({ length: n }, () => ({ score: score('Bastos', 27) }))
      const gana   = llenos.map((a, i) => (i === w ? { score: score('Espadas', 31) } : a))
      todos.push(mesa({ n, winner: w, asientos: gana }))                              // corriente
      todos.push(mesa({ n, winner: w, manoIndex: w, asientos: llenos }))              // empate (Mano)
      todos.push(mesa({ n, winner: w, manoIndex: (w + 1) % n, asientos: llenos }))    // empate (cercanía)
      todos.push(mesa({ n, winner: w, ruleN: n, asientos: llenos.map((a, i) =>
        (i === w ? { cards: AJILEI_NATURAL, score: score('Oros', 51) } : a)) }))      // AJILEI
      todos.push(mesa({ n, winner: w, asientos: Array.from({ length: n }, () => ({ score: null })) })) // retiros
      todos.push(mesa({ n, winner: w, phase: PHASES.GAME_OVER, asientos: llenos }))   // fin de partida
    }
  }

  it('"Pierdes." no aparece en NINGÚN resultado', () => {
    for (const r of todos) expect(r.texto).not.toMatch(/Pierdes/)
  })

  it('ningún resultado sale con la voz vieja "(N pts)"', () => {
    for (const r of todos) expect(r.texto).not.toMatch(/\(\d+ pts\)/)
  })

  it('todo resultado trae texto no vacío y un tono conocido', () => {
    for (const r of todos) {
      expect(typeof r.texto).toBe('string')
      expect(r.texto.length).toBeGreaterThan(0)
      expect(['gana', 'pierde', 'oro', 'neutro']).toContain(r.tono)
    }
  })

  it('el tono de mesa sigue a winner en las cuatro mesas', () => {
    for (const n of [2, 3, 4, 5]) for (let w = 0; w < n; w++) {
      const r = mesa({ n, winner: w, asientos: Array.from({ length: n }, () => ({ score: score('Oros', 27) })) })
      expect(r.tono).toBe(w === 0 ? 'gana' : 'pierde')
    }
  })

  it('claseTono traduce el tono a la clase viva del óvalo', () => {
    expect(claseTono('gana')).toBe(' msg-win')
    expect(claseTono('pierde')).toBe(' msg-lose')
    expect(claseTono('oro')).toBe('')
    expect(claseTono('neutro')).toBe('')
  })
})
