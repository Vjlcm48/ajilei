// MES-PvP 2 §3 · La voz entre personas: una tabla de casos, mesa de 2 y de 5, propio y
// ajeno, cada tipo de acción, por reloj y capas con devolución. La voz contra las IAS la
// sellan, sin cambios, `testVoz3`, `testCronica` y `testResultado`.
import { describe, expect, it } from 'vitest'
import { PHASES } from '../engine/gameEngine'
import { VOZ, componeCapas } from './cronicaCore'
import { lecturaDeMano, resultadoDeMano } from './manoCore'
import { composeResultado } from './resultadoCore'
import {
  TONOS_FIN, avisoDeAbandono, cronicaDe, faseHumanos, finDePartida, fraseDeAccion, listaDeNombres, nuevosAbandonos, sonidoDe,
} from './vozHumanos'
import { FRASES_VICTORIA } from '../config/frasesVictoria'

const NOMBRES = ['Yo', 'Ana', 'Beto', 'Caro', 'Dani']
const mesa = (n, extra = {}) => ({
  voz: VOZ.HUMANOS,
  phase: PHASES.BET_1,
  numPlayers: n,
  handRules: { ruleN: n, maxDiscard: 3 },
  players: NOMBRES.slice(0, n).map((name, id) => ({ id, name, eliminated: false, folded: false, chips: 1000, contribMano: 100, allIn: false, score: null, cards: [] })),
  activePlayerIndex: 0,
  manoIndex: 0,
  vencimiento: null,
  descarte: { yaDescartaron: [], cuantas: null },
  ultimaAccion: null,
  ...extra,
})
const accion = (asiento, tipo, extra = {}) => ({ asiento, tipo, puesto: 0, apuestaAntes: 0, apuestaDespues: 0, porReloj: false, ...extra })

const CON_DINERO = {
  apostar: { puesto: 200, apuestaDespues: 200 },
  igualar: { puesto: 200, apuestaAntes: 300, apuestaDespues: 300 },
  subir: { puesto: 700, apuestaAntes: 300, apuestaDespues: 800 },
  allIn: { puesto: 1500, apuestaAntes: 2000, apuestaDespues: 2000 },
}

describe('MES-PvP 2 · la línea de una jugada', () => {
  it.each([
    // Propio: igual en toda mesa.
    [2, 0, 'pasar', {}, 'Pasas.'],
    [2, 0, 'apostar', CON_DINERO.apostar, 'Apuestas 200 Heptacoins.'],
    [2, 0, 'igualar', CON_DINERO.igualar, 'Igualas con 200.'],
    [2, 0, 'subir', CON_DINERO.subir, 'Subes a 800.'],
    [2, 0, 'allIn', CON_DINERO.allIn, 'Vas all-in con 1.500 Heptacoins.'],
    [2, 0, 'retirarse', {}, 'Te retiras.'],
    [5, 0, 'pasar', {}, 'Pasas.'],
    [5, 0, 'allIn', CON_DINERO.allIn, 'Vas all-in con 1.500 Heptacoins.'],
    [5, 0, 'retirarse', {}, 'Te retiras.'],
    // Por reloj.
    [2, 0, 'pasar', { porReloj: true }, 'Pasaste por tiempo.'],
    [5, 0, 'retirarse', { porReloj: true }, 'Te retiraste por tiempo.'],
    [2, 1, 'pasar', { porReloj: true }, 'Ana pasa por tiempo.'],
    [5, 3, 'retirarse', { porReloj: true }, 'Caro se retira por tiempo.'],
    // Ajeno, mesa de 2: como la IA, pregunta.
    [2, 1, 'pasar', {}, 'Ana pasa.'],
    [2, 1, 'apostar', CON_DINERO.apostar, 'Ana apuesta 200. ¿Qué haces?'],
    [2, 1, 'igualar', CON_DINERO.igualar, 'Ana iguala con 200.'],
    [2, 1, 'subir', CON_DINERO.subir, 'Ana sube a 800. ¿Qué haces?'],
    [2, 1, 'allIn', CON_DINERO.allIn, 'Ana va all-in con 1.500.'],
    [2, 1, 'retirarse', {}, 'Ana se retira.'],
    // Ajeno, mesa de 5.
    [5, 2, 'pasar', {}, 'Beto pasa.'],
    [5, 2, 'apostar', CON_DINERO.apostar, 'Beto apuesta 200.'],
    [5, 2, 'igualar', CON_DINERO.igualar, 'Beto iguala con 200.'],
    [5, 2, 'subir', CON_DINERO.subir, 'Beto sube a 800.'],
    [5, 4, 'allIn', CON_DINERO.allIn, 'Dani va all-in con 1.500.'],
    [5, 4, 'retirarse', {}, 'Dani se retira.'],
  ])('mesa de %i, asiento %i, %s %j → «%s»', (n, asiento, tipo, extra, frase) => {
    expect(fraseDeAccion(accion(asiento, tipo, extra), mesa(n))).toBe(frase)
  })

  it('una mesa de cinco que se quedó en dos ya habla como la de dos', () => {
    const quedan = mesa(5, { handRules: { ruleN: 2, maxDiscard: 3 } })
    expect(fraseDeAccion(accion(3, 'apostar', CON_DINERO.apostar), quedan)).toBe('Caro apuesta 200. ¿Qué haces?')
  })

  it('«la IA» y «IA k» no aparecen en ninguna', () => {
    for (const n of [2, 5]) {
      for (const tipo of ['pasar', 'apostar', 'igualar', 'subir', 'allIn', 'retirarse']) {
        for (const asiento of [0, 1]) expect(fraseDeAccion(accion(asiento, tipo), mesa(n))).not.toMatch(/\bIA\b/)
      }
    }
  })
})

describe('MES-PvP 2 · la línea de una fase', () => {
  it('quien abre, y el propio en segunda persona', () => {
    expect(faseHumanos(mesa(2))).toBe('A las 2 — Tu turno.')
    expect(faseHumanos(mesa(5, { phase: PHASES.BET_2, activePlayerIndex: 3 }))).toBe('A las 3 — Caro abre.')
    expect(faseHumanos(mesa(2, { phase: PHASES.DEAL_2 }))).toBe('Repartiendo...')
  })

  it('el descarte: elegir, esperar, retirado y reposición', () => {
    expect(faseHumanos(mesa(5, { phase: PHASES.DISCARD }))).toBe('Selecciona hasta 3 cartas a descartar.')
    expect(faseHumanos(mesa(5, { phase: PHASES.DISCARD, descarte: { yaDescartaron: [0], cuantas: null } }))).toBe('Esperando el descarte de la mesa.')
    const retirado = mesa(5, { phase: PHASES.DISCARD })
    retirado.players[0].folded = true
    expect(faseHumanos(retirado)).toBe('La mesa descarta.')
    const repone = { phase: PHASES.DISCARD, vencimiento: { clase: 'reposicion', hora: 0 }, descarte: { yaDescartaron: [0, 1], cuantas: [2, 1] } }
    expect(faseHumanos(mesa(2, repone))).toBe('Descartaste 2, Ana descartó 1.')
    expect(faseHumanos(mesa(5, repone))).toBe('Descarte completado.')
  })

  it('al descarte', () => {
    expect(faseHumanos(mesa(2, { phase: PHASES.BET_3, activePlayerIndex: 1, descarte: { yaDescartaron: [], cuantas: [2, 1] } })))
      .toBe('Descartaste 2, Ana descartó 1. Al descarte — Ana abre.')
    expect(faseHumanos(mesa(5, { phase: PHASES.BET_3, descarte: { yaDescartaron: [], cuantas: [2, 1, 0, 0, 3] } })))
      .toBe('Descarte completado. Al descarte — Tu turno.')
  })
})

describe('MES-PvP 2 · la crónica de una lectura', () => {
  const pasa = accion(1, 'pasar')

  it('primera lectura: la fase', () => {
    expect(cronicaDe(mesa(2))).toBe('A las 2 — Tu turno.')
  })

  it('misma fase y jugada nueva: la jugada. Fase nueva: la fase', () => {
    const antes = mesa(5)
    expect(cronicaDe(mesa(5, { ultimaAccion: pasa }), antes, 'x')).toBe('Ana pasa.')
    expect(cronicaDe(mesa(5, { phase: PHASES.BET_2, ultimaAccion: pasa }), mesa(5, { ultimaAccion: pasa }), 'x')).toBe('A las 3 — Tu turno.')
  })

  it('una lectura sin jugada nueva no borra la línea', () => {
    const antes = mesa(5, { ultimaAccion: pasa })
    expect(cronicaDe(mesa(5, { ultimaAccion: pasa }), antes, 'Ana pasa.')).toBe('Ana pasa.')
  })

  it('lo que el reloj hizo por el jugador se dice aunque cierre la ronda', () => {
    const porReloj = accion(0, 'pasar', { porReloj: true })
    expect(cronicaDe(mesa(2, { phase: PHASES.DEAL_3, ultimaAccion: porReloj }), mesa(2), 'x')).toBe('Pasaste por tiempo.')
    expect(cronicaDe(mesa(2, { ultimaAccion: porReloj }))).toBe('Pasaste por tiempo.')
  })

  it('en el sorteo, el pago y el fin, nada: tienen su capa y su resultado', () => {
    for (const phase of ['SORTEO', PHASES.PAYOUT, PHASES.GAME_OVER]) {
      expect(cronicaDe(mesa(2, { phase, ultimaAccion: accion(0, 'retirarse', { porReloj: true }) }), mesa(2), 'x')).toBe('')
    }
  })
})

describe('MES-PvP 2 · el resultado y las capas', () => {
  const score = (palo, points) => ({ palo, points, suitScores: { [palo]: points } })
  const conScores = (n, puntos) => {
    const m = mesa(n, { phase: PHASES.PAYOUT, manoIndex: 0 })
    m.players = m.players.map((p, i) => ({ ...p, score: puntos[i] === null ? null : score('Copas', puntos[i]), folded: puntos[i] === null }))
    return m
  }
  const resultado = (m, winner) => composeResultado({
    phase: PHASES.PAYOUT, winner, players: m.players, numPlayers: m.numPlayers, manoIndex: m.manoIndex, ruleN: m.handRules.ruleN, voz: VOZ.HUMANOS,
  }).texto

  it.each([
    [2, [41, 30], 1, 'Ana gana con Copas, 30 pts.'],
    [2, [41, 30], 0, '¡Ganas con Copas, 41 pts!'],
    [5, [20, 30, 41, 10, 5], 2, 'Beto gana con Copas, 41 pts.'],
    [2, [30, 30], 1, 'Empate, 30 pts. Gana Ana por estar más cerca de la Mano.'],
  ])('volteo, mesa de %i %j, gana %i → «%s»', (n, puntos, winner, frase) => {
    expect(resultado(conScores(n, puntos), winner)).toBe(frase)
  })

  it('por retiros, con su texto para dos', () => {
    expect(resultado(mesa(2, { phase: PHASES.PAYOUT }), 0)).toBe('¡Ana se retira! Ganas el pozo.')
    expect(resultado(mesa(2, { phase: PHASES.PAYOUT }), 1)).toBe('Te retiras. Ana gana el pozo.')
    expect(resultado(mesa(5, { phase: PHASES.PAYOUT }), 0)).toBe('Los demás se retiran. ¡Ganas el pozo!')
    expect(resultado(mesa(5, { phase: PHASES.PAYOUT }), 3)).toBe('Los demás se retiran. Gana Caro.')
    // Cinco sillas, dos sentados: el rival es el que queda.
    const quedan = mesa(5, { phase: PHASES.PAYOUT, handRules: { ruleN: 2, maxDiscard: 3 } })
    quedan.players = quedan.players.map((p, i) => ({ ...p, eliminated: i !== 0 && i !== 3 }))
    expect(resultado(quedan, 0)).toBe('¡Caro se retira! Ganas el pozo.')
  })

  it('el fin de partida, con nombre', () => {
    const m = mesa(3, { phase: PHASES.GAME_OVER })
    const fin = (chips) => composeResultado({
      phase: PHASES.GAME_OVER, winner: 2, players: m.players.map((p, i) => (i === 0 ? { ...p, chips } : p)), voz: VOZ.HUMANOS,
    }).texto
    expect(fin(0)).toBe('Beto gana la mesa. Te quedaste sin Heptacoins.')
    // MES-PvP 3 · quien abandonó con pila no se quedó sin nada: se lleva lo que cobró.
    expect(fin(1200)).toBe('Beto gana la mesa. Te llevas 1.200 Heptacoins.')
  })

  it('`resultadoDeMano` toma la voz del `game` y, sin ella, es la de las IAS', () => {
    const m = conScores(2, [41, 30])
    m.players = m.players.map((p) => ({ ...p, contribMano: 200 }))
    m.winner = 1
    m.manoIndex = 1
    m.players[1].score = score('Oros', 50)
    const lectura = lecturaDeMano(m)
    expect(resultadoDeMano(m, lectura).texto).toBe('Ana gana con Oros, 50 pts.')
    expect(resultadoDeMano({ ...m, voz: undefined }, lectura).texto).toBe('La IA gana con Oros, 50 pts.')
  })

  it('capas con devolución: nombres en vez de «la IA» y punto de millar', () => {
    const lectura = {
      principal: 1,
      numPlayers: 2,
      otras: [{ asiento: 2, monto: 1500 }],
      devoluciones: [{ asiento: 0, monto: 1200 }, { asiento: 3, monto: 2000 }],
    }
    const { players } = mesa(5)
    expect(componeCapas(lectura, players, VOZ.HUMANOS))
      .toBe('El pozo se partió: Beto se lleva 1.500. Se te devuelven 1.200 Heptacoins. A Caro se le devuelven 2.000 Heptacoins.')
    expect(componeCapas({ ...lectura, otras: [], devoluciones: [{ asiento: 1, monto: 1 }], principal: 0 }, players, VOZ.HUMANOS))
      .toBe('A Ana se le devuelve 1 Heptacoin.')
    // Contra las IAS, lo de siempre.
    expect(componeCapas({ ...lectura, otras: [], devoluciones: [{ asiento: 1, monto: 1200 }], principal: 0 }, players))
      .toBe('A la IA se le devuelven 1200 Heptacoins.')
  })
})

// MES-PvP 5a · E.3 · la voz del pago entre personas, por el mismo camino que `GameTable`: la
// lectura de la mano, `resultadoDeMano(game, lectura)` y `componeCapas(lectura, game.players,
// game.voz)`, con un rival de nombre largo. Los cuatro casos del informe de la Fase 0 (§E.3).
describe('MES-PvP 5a · la voz del pago, por el camino de la mesa', () => {
  const LARGO = ['Yo', 'Maximiliano Rodríguez', 'Beto']
  const pago = (n, contrib, puntos, winner, allIn) => ({
    voz: VOZ.HUMANOS,
    phase: PHASES.PAYOUT,
    numPlayers: n,
    handRules: { ruleN: n, maxDiscard: 3 },
    manoIndex: 0,
    winner,
    players: LARGO.slice(0, n).map((name, id) => ({
      id, name, eliminated: false, folded: false, chips: 0, contribMano: contrib[id], allIn: allIn.includes(id),
      score: { palo: 'Copas', points: puntos[id], suitScores: { Copas: puntos[id] } }, cards: [],
    })),
  })
  const enLaMesa = (game) => {
    const lectura = lecturaDeMano(game)
    return [resultadoDeMano(game, lectura).texto, componeCapas(lectura, game.players, game.voz)]
  }
  const CASOS = [
    ['mesa de 2 · gano yo con all-in corto; al rival le vuelve', [2, [1200, 3000], [41, 30], 0, [0]],
      ['¡Ganas con Copas, 41 pts!', 'A Maximilian… se le devuelven 1.800 Heptacoins.']],
    ['mesa de 2 · gana el rival con all-in corto; me vuelve', [2, [3000, 1200], [30, 41], 1, [1]],
      ['Maximilian… gana con Copas, 41 pts.', 'Se te devuelven 1.800 Heptacoins.']],
    ['mesa de 3 · gana Maximiliano con all-in corto; Beto se lleva la capa 2; me vuelve', [3, [5000, 1200, 2600], [30, 41, 35], 1, [1, 2]],
      ['Maximilian… gana con Copas, 41 pts.', 'El pozo se partió: Beto se lleva 2.800. Se te devuelven 2.400 Heptacoins.']],
    ['mesa de 3 · gano yo; la capa 2 a Maximiliano; a Beto le vuelve', [3, [1200, 2600, 5000], [41, 35, 30], 0, [0, 1]],
      ['¡Ganas con Copas, 41 pts!', 'El pozo se partió: Maximilian… se lleva 2.800. A Beto se le devuelven 2.400 Heptacoins.']],
  ]
  it.each(CASOS)('%s', (_caso, mesaDelCaso, frases) => {
    expect(enLaMesa(pago(...mesaDelCaso))).toEqual(frases)
  })

  it('contra las IAS (`voz` indefinida), las capas y el titular de siempre: «la IA», sin punto y sin corte', () => {
    const ias = (i) => enLaMesa({ ...pago(...CASOS[i][1]), voz: undefined })
    expect(ias(0)[1]).toBe('A la IA se le devuelven 1800 Heptacoins.')
    expect(ias(1)).toEqual(['La IA gana con Copas, 41 pts.', 'Se te devuelven 1800 Heptacoins.'])
    expect(ias(2)[1]).toBe('El pozo se partió: Beto se lleva 2800. Se te devuelven 2400 Heptacoins.')
    expect(ias(3)[1]).toBe('El pozo se partió: Maximiliano Rodríguez se lleva 2800. A Beto se le devuelven 2400 Heptacoins.')
  })
})

describe('MES-PvP 2 · sonidoDe', () => {
  it.each([
    [accion(1, 'pasar'), null],
    [accion(1, 'retirarse'), 'cardFold'],
    [accion(1, 'apostar', { puesto: 100 }), 'coinBet'],
    [accion(1, 'igualar', { puesto: 100 }), 'coinBet'],
    [accion(1, 'subir', { puesto: 300 }), 'coinBet'],
    [accion(1, 'allIn', { puesto: 300 }), 'coinBet'],
    [accion(0, 'apostar', { puesto: 100 }), null],
    [accion(0, 'retirarse'), null],
    [accion(0, 'retirarse', { porReloj: true }), 'cardFold'],
    [null, null],
  ])('%j → %s', (a, sonido) => {
    expect(sonidoDe(a)).toBe(sonido)
  })
})

describe('MES-PvP 3 · alguien deja la mesa', () => {
  it('el aviso de salida lo dice con su texto, y la mesa nueva', () => {
    const aviso = (eliminatedNames, aliveCount) => faseHumanos(mesa(5, {
      phase: PHASES.DEAL_2, vencimiento: { clase: 'aviso_salida', hora: 0 }, eliminatedNames, aliveCount,
    }))
    expect(aviso(['Pepito'], 4)).toBe('Pepito dejó la mesa · la mesa ahora es de 4')
    expect(aviso(['Pepito', 'Ana', 'Beto'], 2)).toBe('Pepito, Ana y Beto dejaron la mesa · la mesa ahora es de 2')
    expect(aviso([], 5)).toBe('Repartiendo...')
  })

  it('la lista de nombres: comas y «y» antes del último (también el empate del sorteo)', () => {
    expect(listaDeNombres(['Juan'])).toBe('Juan')
    expect(listaDeNombres(['Juan', 'Ana'])).toBe('Juan y Ana')
    expect(listaDeNombres(['Juan', 'Ana', 'María'])).toBe('Juan, Ana y María')
  })
})

// ── MES-PvP 3-A · El abandono y la pantalla final (Reglas v1.7 §8.2 y §8.3) ───────────
describe('MES-PvP 3-A · la pantalla final: el tono por el resultado, la frase por cómo terminó', () => {
  // En el fin, `chips` es lo cobrado (`vistaAMesa`). Entrada corta de mesa 100: 1.500.
  const fin = (yo, rivales) => mesa(1 + rivales.length, {
    phase: PHASES.GAME_OVER,
    players: [{ name: 'Yo', chips: 1500, entrada: 1500, abandonado: false, eliminated: false, ...yo },
      ...rivales.map((r, k) => ({ name: NOMBRES[k + 1], chips: 0, entrada: 1500, abandonado: false, eliminated: true, ...r }))],
  })
  const SE_FUE = { abandonado: true }
  const QUEBRO = {}

  it.each([
    // caso, quien mira, rivales, cobrado → tono, frase
    [1, { abandonado: true, eliminated: true }, [{ eliminated: false }], 1800, TONOS_FIN.CELEBRACION, 'Saliste de la mesa'],
    [1, { abandonado: true, eliminated: true }, [{ eliminated: false }], 1500, TONOS_FIN.NEUTRO, 'Saliste de la mesa'],
    [1, { abandonado: true, eliminated: true }, [{ eliminated: false }], 200, TONOS_FIN.SOBRIO, 'Saliste de la mesa'],
    [2, { eliminated: true }, [{ eliminated: false }], 0, TONOS_FIN.SOBRIO, 'Te quedaste sin fichas'],
    [2, { eliminated: true }, [{ eliminated: false }, SE_FUE], 40, TONOS_FIN.SOBRIO, 'Te quedaste sin fichas'],
    [3, {}, [SE_FUE], 200, TONOS_FIN.SOBRIO, 'Te quedaste solo en la mesa'],
    [3, {}, [SE_FUE], 1500, TONOS_FIN.NEUTRO, 'Te quedaste solo en la mesa'],
    [3, {}, [QUEBRO, SE_FUE], 2900, TONOS_FIN.CELEBRACION, 'Te quedaste solo en la mesa'],
    [4, {}, [SE_FUE, SE_FUE], 1000, TONOS_FIN.SOBRIO, 'Te quedaste solo en la mesa'],
    [4, {}, [SE_FUE, SE_FUE, QUEBRO], 1500, TONOS_FIN.NEUTRO, 'Te quedaste solo en la mesa'],
    [4, {}, [SE_FUE, QUEBRO, SE_FUE], 3100, TONOS_FIN.CELEBRACION, 'Te quedaste solo en la mesa'],
    [5, {}, [QUEBRO, QUEBRO], 4500, TONOS_FIN.CELEBRACION, null],
  ])('caso %i · %o, %o, cobra %i → %s', (caso, yo, rivales, chips, tono, frase) => {
    const r = finDePartida(fin({ ...yo, chips }, rivales))
    expect(r).toMatchObject({ caso, tono, frase })
  })

  it('el caso 5 deja la frase a las de victoria, que solo se dicen con resultado positivo', () => {
    const r = finDePartida(fin({ chips: 4500 }, [QUEBRO, QUEBRO]))
    expect(r.frase).toBe(null)
    expect(FRASES_VICTORIA).toContain('¡Qué molleja! Arrasaste con la mesa.')
    // Si no fuera positivo, nunca una de victoria (no se alcanza: quien se queda con todo gana).
    expect(finDePartida(fin({ chips: 1500 }, [QUEBRO])).frase).toBe('Te quedaste solo en la mesa')
  })

  it('la cifra: con su signo y su punto de millar', () => {
    expect(finDePartida(fin({ chips: 200 }, [SE_FUE])).cifra).toBe('−1.300 Heptacoins')
    expect(finDePartida(fin({ chips: 1500 }, [SE_FUE])).cifra).toBe('0 Heptacoins')
    expect(finDePartida(fin({ chips: 2800 }, [SE_FUE])).cifra).toBe('+1.300 Heptacoins')
  })

  it('el caso de Victor: solo, con −1.300, no celebra ni dice «Arrasaste»', () => {
    const r = finDePartida(fin({ chips: 200 }, [{ ...SE_FUE, name: 'ticotest2022' }]))
    expect(r.tono).toBe(TONOS_FIN.SOBRIO)
    expect(r.frase).toBe('Te quedaste solo en la mesa')
    expect(FRASES_VICTORIA).not.toContain(r.frase)
  })
})

describe('MES-PvP 3-A · el aviso del abandono, en el óvalo', () => {
  const con = (abandonos) => mesa(3, { players: mesa(3).players.map((p, i) => ({ ...p, abandonado: abandonos.includes(i) })) })

  it('solo los de esta lectura, y nunca el propio', () => {
    expect(nuevosAbandonos(con([1]), con([]))).toEqual(['Ana'])
    expect(nuevosAbandonos(con([1, 2]), con([1]))).toEqual(['Beto'])
    expect(nuevosAbandonos(con([0, 1]), con([1]))).toEqual([])
    expect(nuevosAbandonos(con([1]), null)).toEqual([])
  })

  it('el texto sellado, y el de «la partida termina»', () => {
    expect(avisoDeAbandono(['Ana'], false)).toBe('Ana abandonó la mesa.')
    expect(avisoDeAbandono(['Ana'], true)).toBe('Ana abandonó la mesa. La partida termina.')
    expect(avisoDeAbandono(['Ana', 'Beto'], true)).toBe('Ana y Beto abandonaron la mesa. La partida termina.')
    expect(avisoDeAbandono([], true)).toBe(null)
  })

  it('si el abandono cerró la mano, el titular del pago es el aviso, con su tono', () => {
    const pago = mesa(2, {
      phase: PHASES.PAYOUT, winner: 0, pot: 0,
      players: mesa(2).players.map((p, i) => (i === 1 ? { ...p, folded: true, abandonado: true } : { ...p, chips: 1200 })),
    })
    const lectura = lecturaDeMano(pago)
    expect(resultadoDeMano(pago, lectura).texto).not.toContain('abandonó')
    const conAviso = resultadoDeMano({ ...pago, aviso: 'Ana abandonó la mesa. La partida termina.' }, lectura)
    expect(conAviso).toEqual({ ...resultadoDeMano(pago, lectura), texto: 'Ana abandonó la mesa. La partida termina.' })
  })
})
