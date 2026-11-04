// ── MOT-1 1b · El árbitro, sin red y sin base ───────────────────────────────
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md. Es la entrada que la Edge Function
// de la 1e importa. Ningún archivo del cliente lo importa (INV-84): el cliente, en
// MES-PvP, sólo leerá `motivos.js`.
//
// ESM puro, todos los especificadores con `.js`, porque Supabase no resuelve otra
// cosa. No toca navegador, React, Howler, Supabase ni Node.

export { compactarAsientos } from './asientos.js'
export { azarSeguro } from './azar.js'
export { ajileiDe, ganadorDeMano, huboRevelacion } from './ganador.js'
export { MOTIVOS, MOTIVOS_APUESTA, MOTIVOS_ARBITRO } from './motivos.js'
export {
  ACCIONES_ARBITRO, APUESTAS, ENTRADAS, abandonarPorServidor, aplicarAccion, crearPartida,
  partidaTerminada, sorteoAbierto,
} from './partida.js'
export {
  CLASES, ESPERA_REPARTO_SORTEO_MS, RITMOS, esperaManoSiguiente, esperaPrimerReparto, esperaSegundoReparto, factorDe,
} from './reloj.js'
export { CARTAS_POR_ASIENTO, ETAPAS, TOPE_RONDAS } from './sorteo.js'
export { FASE_SORTEO, vistaDe } from './vista.js'
