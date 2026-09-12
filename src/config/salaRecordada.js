// ── SAL-B1 · La última mesa que armaste, puesta de nuevo ────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §4.4, sellada en esa ficha.
//
// ── QUÉ RESUELVE ───────────────────────────────────────────────────────────
// Armar una mesa son tres decisiones —cuántos, cuánto y cómo se llena— y las
// tres se repiten casi siempre. Sin memoria, el jugador que abre su segunda mesa
// de la tarde vuelve a tocar tres veces lo mismo. Con ella, entra y el CTA ya
// dice lo que quería.
//
// ── POR QUÉ ESTÁ SEPARADO DE `salaPendiente.js` ────────────────────────────
// Porque son dos memorias con vidas distintas y mezclarlas las ataría. La del
// código pendiente es de UN solo uso y hay que BORRARLA al consumirla; ésta es
// permanente y se pisa cada vez. Compartir archivo significaría que un `borrar()`
// pensado para una acabara vaciando la otra.
//
// Módulo SIN React. El `try/catch` es el molde exacto de `readNivel`,
// `readIdioma` y `salaPendiente`: un almacenamiento denegado —ventana privada,
// cookies bloqueadas— no puede tumbar el arranque de la app. Aquí, además, lo
// peor que produce es que el jugador vuelva a tocar tres botones.
//
// NUNCA VIAJA AL SERVIDOR. Es comodidad del dedo, no dato de partida: lo que se
// envía es lo que el jugador tiene delante al pulsar, no lo que este archivo
// recuerda. La distinción importa porque significa que corromper esta clave a
// mano no puede crear una mesa que el jugador no viera en la pantalla.

import { CLAVE_CONFIG_SALA } from './salas'
import { normalizarConfig } from '../screens/salasCore'

/**
 * La configuración recordada, ya pasada por las guardas de §4.4.
 *
 * SIEMPRE devuelve algo usable: si no hay nada guardado, si lo guardado no
 * parsea, o si la apuesta recordada ya no alcanza este saldo, sale el defecto de
 * la lámina. Quien llame no tiene que comprobar nada, que es justo lo que evita
 * que la pantalla nazca con `undefined` en un chip.
 *
 * El saldo entra por parámetro y no se lee aquí: `saldoDelJugador()` es hoy
 * síncrono y mañana será una promesa (lo declara `lib/saldo.js`), y este módulo
 * no puede ser uno de los que ese cambio arrastre.
 *
 * @param {number} saldo  el saldo con el que se juzga la apuesta recordada
 * @returns {{jugadores:number, apuesta:number, tipo:string}}
 */
export function leerConfig(saldo) {
  // Sin valor inicial: los dos `catch` salen por su cuenta, asi que un `= null`
  // aqui seria una asignacion que nadie llega a leer (`no-useless-assignment`).
  // Misma trampa que `salaPendiente.js` ya documenta en `recogerDeLaUrl`.
  let crudo
  try {
    crudo = window.localStorage.getItem(CLAVE_CONFIG_SALA)
  } catch {
    // Almacenamiento denegado. Se pierde la comodidad, no la pantalla.
    return normalizarConfig(null, saldo)
  }

  let objeto
  try {
    objeto = crudo === null ? null : JSON.parse(crudo)
  } catch {
    // Basura en la clave —una mano editando el almacenamiento, una campaña
    // anterior que guardó otra cosa—. Cae al defecto SIN avisar por consola: no
    // es un fallo del programa y el arnés exige consola limpia.
    objeto = null
  }

  return normalizarConfig(objeto, saldo)
}

/**
 * Recuerda esta configuración. Se llama al pulsar un CTA CON ÉXITO y no al
 * tocar un chip, y ésa es la decisión: lo que se recuerda es lo que el jugador
 * llegó a usar, no por dónde paseó el dedo. Un jugador que mira la mesa de 5.000
 * y se echa atrás no debe encontrársela puesta mañana.
 */
export function guardarConfig({ jugadores, apuesta, tipo }) {
  try {
    window.localStorage.setItem(
      CLAVE_CONFIG_SALA,
      JSON.stringify({ jugadores, apuesta, tipo })
    )
  } catch {
    // Sin sitio donde guardar. Nada que reportar: la mesa ya se creó.
  }
}
