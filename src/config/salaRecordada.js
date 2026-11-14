// ── SAL-B1 · La última mesa que armaste, puesta de nuevo ────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §4.4, sellada en esa ficha.
//
// ── QUÉ RESUELVE ───────────────────────────────────────────────────────────
// Armar una mesa son tres decisiones —cuántos, cuánto y cómo se llena— y las
// tres se repiten casi siempre. Sin memoria, el jugador que abre su segunda mesa
// de la tarde vuelve a tocar tres veces lo mismo. Con ella, entra y el CTA ya
// dice lo que quería.
//
// ── APU-1 1e · LO QUE ERA CÓDIGO PASA A SER UNA DECLARACIÓN ────────────────
// Rector 1e §2.1 (L-6 / K-3a). Este archivo tenía escritos a mano los dos
// `try/catch`, el `JSON.parse` defensivo y la llamada a las guardas; «Retar a
// las IAS» necesitaba exactamente lo mismo con otros campos y otra clave. Eso
// que se repetía es `config/memoriaChips.js`, y lo único que de verdad
// distingue a las dos pantallas —QUÉ se recuerda— queda aquí en una línea:
//
//   PvP   → jugadores, apuesta, tipo, ritmo   (y JAMÁS la entrada, MES-PvP 7b)
//   vs IA → reto, jugadores, apuesta     (y JAMÁS la entrada)
//
// ── POR QUÉ SIGUE SEPARADO DE `salaPendiente.js` ───────────────────────────
// Porque son dos memorias con vidas distintas y mezclarlas las ataría. La del
// código pendiente es de UN solo uso y hay que BORRARLA al consumirla; ésta es
// permanente y se pisa cada vez. Compartir archivo significaría que un `borrar()`
// pensado para una acabara vaciando la otra.
//
// NUNCA VIAJA AL SERVIDOR. Es comodidad del dedo, no dato de partida: lo que se
// envía es lo que el jugador tiene delante al pulsar, no lo que este archivo
// recuerda. La distinción importa porque significa que corromper esta clave a
// mano no puede crear una mesa que el jugador no viera en la pantalla.

import { CLAVE_CONFIG_SALA } from './salas'
import { normalizarConfig } from '../screens/salasCore'
import { crearMemoria } from './memoriaChips'

/**
 * LA POLÍTICA del PvP: jugadores, apuesta, tipo y ritmo. La entrada no: es la
 * que gasta dinero (Reglas §7), y la pantalla la abre siempre en Corta.
 *
 * `leer(saldo)` siempre devuelve algo usable: si no hay nada guardado, si lo
 * guardado no parsea, o si la apuesta recordada ya no alcanza este saldo, sale
 * el defecto de la lámina. Quien llame no tiene que comprobar nada, que es justo
 * lo que evita que la pantalla nazca con `undefined` en un chip.
 *
 * El saldo entra por parámetro y no se lee aquí: desde ECO-1b es la billetera
 * del servidor (`useBilletera`), que llega cuando llega, y este módulo
 * no puede ser uno de los que ese cambio arrastre.
 */
export const MEMORIA_PVP = crearMemoria({
  clave: CLAVE_CONFIG_SALA,
  campos: ['jugadores', 'apuesta', 'tipo', 'ritmo'],
  normalizar: normalizarConfig,
})

/** @param {number} saldo  el saldo con el que se juzga la apuesta recordada */
export function leerConfig(saldo) {
  return MEMORIA_PVP.leer(saldo)
}

/**
 * Recuerda esta configuración. Se llama al pulsar un CTA CON ÉXITO y no al
 * tocar un chip, y ésa es la decisión: lo que se recuerda es lo que el jugador
 * llegó a usar, no por dónde paseó el dedo. Un jugador que mira la mesa de 5.000
 * y se echa atrás no debe encontrársela puesta mañana.
 */
export function guardarConfig(config) {
  MEMORIA_PVP.guardar(config)
}
