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
    puntos: 0,              // RNK-1b · Σ de los puntos de las manos ganadas
    ajileis: 0,             // RNK-1b · cuántas manos ganadas con AJILEI
    mejorMano: null,        // { palo, pts } — la mejor del humano en la partida
    ultimaManoContada: null, // identidad (handCount) de la última mano sumada
  }
}

// Se llama en cada transición a PAYOUT. `handCount` es la identidad de la mano
// del marcador: la GUARDA de idempotencia. Sin ella, cualquier re-render o
// doble disparo de StrictMode contaría la misma mano dos veces — y una cifra de
// "manos jugadas" inflada es peor que no mostrarla.
//
// RNK-1b · `puntos` y `ajilei` llegan ya calculados del MISMO fin de mano que
// viaja al servidor (`finDeMano` → `puntosDeMano`, en `GameTable`): la sesión
// suma, no decide. Sólo cuentan en una mano ganada, como en el libro (§2.1).
export function anotarMano(sesion, { handCount, gano, puntos = 0, ajilei = 0, score }) {
  if (sesion.ultimaManoContada === handCount) return sesion
  const mejor = mejorDe(sesion.mejorMano, score)
  return {
    manosJugadas: sesion.manosJugadas + 1,
    manosGanadas: sesion.manosGanadas + (gano ? 1 : 0),
    puntos: sesion.puntos + (gano ? puntos : 0),
    ajileis: sesion.ajileis + (gano && ajilei > 0 ? 1 : 0),
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

// Fichas netas CONTRA LA ENTRADA (APU-1 §2.5, 1e-ii §3.6). Es un delta con
// signo: perder también se informa, sin adornos.
//
// Hasta aquí la vara era `economy.saldoInicial` —5.000— y era la vara correcta
// mientras TODO EL MUNDO se sentaba con esa cifra: no había entrada, así que
// restar la constante y restar lo que pusiste eran la misma resta. Desde 1e el
// jugador elige con cuánto se sienta, entre 5 y 50 apuestas, y esa resta pasó a
// mentir en las dos direcciones: quien entra con 750 y sale con 900 había
// «perdido 4.100».
//
// `entrada` la escribe `makePlayer` al sentar el asiento y la sube
// `aplicarRecarga`, así que una mesa con recargas también cuadra: lo recargado
// es dinero puesto, no ganado.
//
// El segundo argumento es OPCIONAL y cae a `economy.pilaPruebas` a propósito:
// las mesas del banco y las pruebas del motor siguen naciendo por la forma
// numérica de `createInitialState`, donde todos se sientan con esa pila y no hay
// `entrada` que leer. Ahí las dos varas dan lo mismo, que es lo que hace segura
// la caída.
export function fichasNetas(chips, entrada = AJILEI_CONFIG.economy.pilaPruebas) {
  return chips - (Number.isFinite(entrada) ? entrada : AJILEI_CONFIG.economy.pilaPruebas)
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
