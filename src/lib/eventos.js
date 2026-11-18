// ── MED-1a T2 · Los eventos del cliente (`registrar_evento`) ────────────────
// Rector: AJILEI_MED-1a_T2_v1.0.md §2 y §5; Fase 0 §B.3. Hoy uno solo:
// `pvp_reconexion`, por dos sitios (`App` al arrancar, `partidaCliente` al
// recuperar el canal). Dispara y olvida: un `false` de la base o un fallo de
// red se ignoran, sin reintento ni cola. Es medición, no dinero.
//
// Módulo aparte y diminuto porque lo importan la entrada (`App`) y el trozo de
// la partida (`partidaCliente`): ni `App` arrastra el cliente de la partida a
// la primera descarga, ni la regla del arranque queda sin prueba (sin jsdom).

/** `cliente.rpc('registrar_evento', …)` sin esperar ni lanzar. */
export function registrarEvento(cliente, tipo, datos = {}) {
  try {
    cliente.rpc('registrar_evento', { p_tipo: tipo, p_datos: datos }).then(() => {}, () => {})
  } catch { /* sin cliente: se pierde */ }
}

/**
 * El arranque recibe de `mi_sala` la mesa de este jugador. Si trae la partida
 * viva, recargó o reabrió en mitad de ella: eso es una reconexión. El paso
 * normal desde `SalaEspera` no pasa por aquí.
 */
export function reconexionAlArrancar(cliente, mesa) {
  if (mesa?.estado !== 'activa' || !mesa.id) return
  registrarEvento(cliente, 'pvp_reconexion', { via: 'arranque', sala: mesa.id })
}
