// ── SAL-A · El código que sobrevive al registro ─────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §4.3.
//
// ── EL PROBLEMA QUE RESUELVE ────────────────────────────────────────────────
// La Fase 0 §1.6 midió que el proyecto NO admite invitados: `anonymous_users` es
// `false`, así que todo el que entra a una sala tiene cuenta. Consecuencia: un
// `AJ-7K3M` compartido por WhatsApp a alguien que todavía no es jugador lo
// deposita en la Portada, no en la sala. Si el código no sobrevive a la puerta
// —correo, código de seis dígitos, bautizo—, cuando por fin llegue al lobby ya
// no queda ni rastro de a qué venía, y la sala que lo esperaba se habrá vencido.
//
// Este módulo es la memoria de ese trayecto. Guarda el código al llegar y lo
// devuelve cuando el jugador está dentro.
//
// ── QUÉ HACE ESTA TANDA Y QUÉ NO ────────────────────────────────────────────
// Aquí sólo se RECUERDA. Consumir la memoria —unirse a la sala al alcanzar
// `COMPLETO`— es de SAL-B, porque necesita las pantallas y la API en pie. Se
// separa a propósito: la mitad que recuerda se puede probar sola y hoy; la que
// consume necesita dos teléfonos.
//
// ── POR QUÉ `localStorage` Y NO `sessionStorage` ────────────────────────────
// Porque el trayecto puede cruzar de pestaña. El código de seis dígitos llega
// por correo, y en un móvil abrir ese correo puede significar volver a la app en
// otra pestaña o incluso reabrir la PWA. `sessionStorage` no sobrevive a eso;
// `localStorage` sí. El precio es que hay que BORRARLO explícitamente cuando se
// consume o cuando la sala ya no sirve, y por eso `borrar()` es parte del
// contrato y no un detalle.
//
// Módulo SIN React. El `try/catch` es el molde exacto de `readNivel` y
// `readIdioma`: un almacenamiento denegado —ventana privada, cookies
// bloqueadas— no puede tumbar el arranque de la app.

import { normalizarCodigo } from './salas'

// Convención de la casa `ajilei.<cosa>`, la misma de `ajilei.nivel`,
// `ajilei.tapete`, `ajilei.idioma` y `ajilei.sound`.
export const CLAVE_SALA_PENDIENTE = 'ajilei.salaPendiente'

/**
 * Recuerda un código de sala para después de la puerta.
 *
 * NORMALIZA antes de guardar, y ésa es la razón de que la escritura pase por
 * aquí en vez de por un `setItem` suelto: lo que entra es un parámetro de URL
 * escrito por quien sea —`?sala=aj7k2m`, `?sala=basura`— y lo que sale de
 * `leer()` tiene que ser un código canónico o nada. Validar en la escritura Y en
 * la lectura no es redundante: entre las dos puede haber pasado cualquier cosa,
 * incluida una mano editando el almacenamiento.
 *
 * @param {string} texto  el código tal como llegó
 * @returns {string|null} el código canónico guardado, o `null` si no era uno
 */
export function guardar(texto) {
  const codigo = normalizarCodigo(texto)
  if (codigo === null) return null
  try {
    window.localStorage.setItem(CLAVE_SALA_PENDIENTE, codigo)
  } catch {
    // Almacenamiento denegado. Se pierde la invitación, no la app: el jugador
    // aterriza en el lobby y puede pegar el código a mano. Sin aviso en consola
    // porque `puerta.5` del arnés exige silencio al cruzar la puerta, y éste es
    // exactamente el momento en que se cruza.
    return null
  }
  return codigo
}

/**
 * El código recordado, o `null`.
 *
 * Vuelve a normalizar lo leído en vez de fiarse de lo que se escribió: el
 * almacenamiento es un sitio que el jugador puede editar y una campaña anterior
 * pudo dejar ahí otra cosa. Basura conocida cae a `null`, misma doctrina que
 * `normalizarNivel`.
 *
 * @returns {string|null}
 */
export function leer() {
  try {
    return normalizarCodigo(window.localStorage.getItem(CLAVE_SALA_PENDIENTE))
  } catch {
    return null
  }
}

/**
 * Olvida el código. Se llama al consumirlo (SAL-B) y también cuando la sala
 * resulta no servir —vencida, llena, cancelada—: una invitación muerta que se
 * queda guardada reintenta sola en cada arranque y confunde al jugador con un
 * error que no provocó.
 */
export function borrar() {
  try {
    window.localStorage.removeItem(CLAVE_SALA_PENDIENTE)
  } catch {
    // Nada que hacer y nada que reportar: si no se pudo escribir, tampoco había
    // nada guardado que borrar.
  }
}

// ── El parámetro de la URL ──────────────────────────────────────────────────
// `?sala=AJ7K2M`, y no `/sala/AJ-7K2M`. La Fase 0 §6.2 dejó dicho por qué: el
// proyecto NO tiene router —es un `useState` y una cascada de `if`— así que una
// ruta con path aterriza en un `App` que no sabe leerla, mientras que el
// parámetro de consulta funciona con lo que ya hay. El `scope: "/"` del
// manifest hace además que el enlace abra la PWA instalada si la hay.
export const PARAM_SALA = 'sala'

/**
 * Lee `?sala=` de una URL, lo recuerda y LIMPIA el parámetro de la barra de
 * direcciones.
 *
 * La limpieza no es cosmética. Sin ella el código se queda en la URL y vuelve a
 * leerse en cada recarga, así que una invitación ya consumida o ya vencida
 * resucita sola cada vez que el jugador refresca. `history.replaceState` la
 * quita sin añadir una entrada al historial —un `pushState` haría que el botón
 * «atrás» devolviera al jugador a la invitación fantasma—.
 *
 * Devuelve el código recordado para que quien la llame pueda decidir, pero el
 * consumo de verdad es de SAL-B.
 *
 * @returns {string|null}
 */
export function recogerDeLaUrl() {
  // Sin valor inicial: el `catch` sale por su cuenta, así que un `= null` aquí
  // sería una asignación que nadie llega a leer (`no-useless-assignment`).
  let crudo
  try {
    crudo = new URL(window.location.href).searchParams.get(PARAM_SALA)
  } catch {
    return null
  }
  if (crudo === null) return null

  const codigo = guardar(crudo)

  try {
    const url = new URL(window.location.href)
    url.searchParams.delete(PARAM_SALA)
    // `url.search` queda vacío si era el único parámetro, y entonces `pathname`
    // + `hash` es exactamente la URL limpia. Se reconstruye a mano en vez de
    // usar `url.toString()` para no dejar un `?` colgando.
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    // Si `replaceState` no está disponible el código ya quedó guardado; lo único
    // que se pierde es la limpieza de la barra.
  }

  return codigo
}
