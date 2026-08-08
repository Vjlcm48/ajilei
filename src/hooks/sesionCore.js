import { AJILEI_CONFIG } from '../config/ajileiConfig'

// ── DSK-VC2 · Acumulados de sesión ──────────────────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §5.
// El motor NO lleva estadística y no se toca ni para eso (restricción general
// del sistema de diseño). Se acumula en la capa de presentación, con un núcleo
// puro que Vitest sella.
//
// SIN PERSISTENCIA, deliberado: la tarjeta resume LA PARTIDA que acaba de
// terminar, no la vida del jugador. Un acumulado que sobreviva a la recarga
// contaría manos de otra mesa y la cifra dejaría de significar lo que dice.

export function sesionInicial() {
  return {
    manosJugadas: 0,
    manosGanadas: 0,
    mejorMano: null,        // { palo, pts } — la mejor del humano en la partida
    ultimaManoContada: null, // identidad (handCount) de la última mano sumada
  }
}

// Se llama en cada transición a PAYOUT. `handCount` es la identidad de la mano
// del marcador: la GUARDA de idempotencia. Sin ella, cualquier re-render o
// doble disparo de StrictMode contaría la misma mano dos veces — y una cifra de
// "manos jugadas" inflada es peor que no mostrarla.
export function anotarMano(sesion, { handCount, gano, score }) {
  if (sesion.ultimaManoContada === handCount) return sesion
  const mejor = mejorDe(sesion.mejorMano, score)
  return {
    manosJugadas: sesion.manosJugadas + 1,
    manosGanadas: sesion.manosGanadas + (gano ? 1 : 0),
    mejorMano: mejor,
    ultimaManoContada: handCount,
  }
}

// La mejor mano se mide por puntaje, y se guarda con su palo: es la voz de
// "Mano actual" (v1.3 §3.1) — palo y puntaje relativo, jamás el nominal.
// Empate a puntos: se conserva la PRIMERA, que es la que el jugador vio antes.
function mejorDe(actual, score) {
  if (!score || !score.palo) return actual
  const cand = { palo: score.palo, pts: score.points }
  if (!actual || cand.pts > actual.pts) return cand
  return actual
}

// Fichas netas contra el saldo con el que se entra a la mesa. Es un delta con
// signo: perder también se informa, sin adornos.
export function fichasNetas(chips) {
  return chips - AJILEI_CONFIG.economy.saldoInicial
}

// ── Conteo ascendente sereno ────────────────────────────────────────────────
// Interpolación con salida suave (easeOutCubic): arranca rápido y ATERRIZA, en
// vez del giro plano y sin fin del odómetro de tragamonedas — vetado por
// posicionamiento (v1.0 §4). Puro: recibe el progreso, devuelve el valor.
export const CONTEO_MS = 1400

export function valorConteo(destino, t) {
  if (t <= 0) return 0
  if (t >= 1) return destino
  const suave = 1 - Math.pow(1 - t, 3)
  return Math.round(destino * suave)
}
