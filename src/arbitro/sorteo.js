// ── MOT-1 1b · El sorteo de la primera Mano ─────────────────────────────────
// Normativo: contrato §6, «El sorteo». Cada ronda baraja las 40 y reparte 5 a cada
// asiento que participa; no arrastra nada de la anterior, así que de las no elegidas
// no queda ni rastro. Tope: 3 rondas, y en la tercera empatada decide el azar.

import { createDeck, drawRank, shuffleDeck } from '../engine/deck.js'

export const CARTAS_POR_ASIENTO = 5
export const TOPE_RONDAS = 3

export const ETAPAS = Object.freeze({
  REPARTO: 'reparto', ELECCION: 'eleccion', VOLTEO: 'volteo', CERRADO: 'cerrado',
})

// `cartas` y `elecciones` son listas por asiento, con `null` en quien no participa:
// el estado se guarda en JSON y un mapa con claves numéricas no sobrevive igual.
export function abrirRonda(numAsientos, ronda, participan, rondas = []) {
  const mazo = shuffleDeck(createDeck())
  const cartas = Array(numAsientos).fill(null)
  participan.forEach((asiento, i) => {
    cartas[asiento] = mazo.slice(i * CARTAS_POR_ASIENTO, (i + 1) * CARTAS_POR_ASIENTO)
  })
  return {
    ronda,
    etapa: ETAPAS.REPARTO,
    participan,
    cartas,
    elecciones: Array(numAsientos).fill(null),
    rondas,
    mano: null,
  }
}

export const eligieronTodos = (sorteo) => sorteo.participan.every((a) => sorteo.elecciones[a] !== null)

// Voltea a la vez. Quien no eligió se queda con la posición 0 (el vencimiento). Se
// olvidan las cinco: lo único que sobrevive es la carta elegida de cada uno.
export function voltear(sorteo) {
  const volteo = sorteo.participan.map((asiento) => ({
    asiento,
    carta: sorteo.cartas[asiento][sorteo.elecciones[asiento] ?? 0],
  }))
  const mejor = Math.max(...volteo.map(({ carta }) => drawRank(carta.value)))
  const empatados = volteo.filter(({ carta }) => drawRank(carta.value) === mejor).map(({ asiento }) => asiento)
  const azar = empatados.length > 1 && sorteo.ronda >= TOPE_RONDAS
  const mano = empatados.length === 1 ? empatados[0] : azar ? shuffleDeck(empatados)[0] : null
  return {
    ...sorteo,
    etapa: ETAPAS.VOLTEO,
    cartas: sorteo.cartas.map(() => null),
    rondas: [...sorteo.rondas, { ronda: sorteo.ronda, volteo, empatados, azar, mano }],
    participan: mano === null ? empatados : sorteo.participan,
    mano,
  }
}

export const siguienteRonda = (sorteo) => abrirRonda(sorteo.cartas.length, sorteo.ronda + 1, sorteo.participan, sorteo.rondas)

export const cerrar = (sorteo) => ({ ...sorteo, etapa: ETAPAS.CERRADO })
