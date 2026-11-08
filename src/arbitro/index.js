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
export { CLAVES_MENSAJE, puedeMandarMensaje } from './mensaje.js'
export { MOTIVOS, MOTIVOS_APUESTA, MOTIVOS_ARBITRO } from './motivos.js'
export {
  ACCIONES_ARBITRO, APUESTAS, CANCELADA_SALDO, ENTRADAS, FUERA, abandonarPorServidor, aplicarAccion, crearPartida,
  enPausaEntreManos, partidaTerminada, recargaActiva, sorteoAbierto,
} from './partida.js'
export {
  CLASES, RITMOS, esperaManoSiguiente, esperaPrimerReparto, esperaRepartoSorteo, esperaReposicion, esperaSegundoReparto,
  factorDe, llevaAnuncio,
} from './reloj.js'
export { CARTAS_POR_ASIENTO, ETAPAS, TOPE_RONDAS } from './sorteo.js'
export { FASE_SORTEO, RECARGA_VISTA, vistaDe } from './vista.js'
