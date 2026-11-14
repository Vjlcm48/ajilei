// ── APU-1 1e · La POLÍTICA de memoria de las pantallas de chips ─────────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §0 (L-6 / K-3a) y §2.1.
//
// «Retar a las IAS» y «Armar una mesa» comparten carcasa y filas de chips, pero
// NO comparten qué se recuerda, y ésa es la única diferencia real entre las dos:
//
//   · PvP   recuerda jugadores, apuesta, tipo y ritmo — y JAMÁS la entrada
//           (MES-PvP 7b: la Corta o la Llena se eligen cada vez).
//   · vs IA recuerda reto, jugadores y apuesta — y JAMÁS la entrada.
//
// La entrada no se recuerda por la misma razón por la que `salaRecordada` no
// guarda el saldo: es la única de las cuatro que gasta dinero. Un jugador que
// ayer entró al techo y hoy abre la pantalla con el techo puesto puede pulsar
// «Retar» sin mirar y sentarse con cincuenta veces la apuesta sin haberlo
// decidido hoy. Las otras tres eligen la mesa; ésta elige cuánto se arriesga.
//
// ── POR QUÉ ES UN MÓDULO Y NO UN PARÁMETRO DE `PantallaChips` ───────────────
// §2.1 la describe como un campo del contrato de la carcasa. No puede vivir
// ahí: la carcasa RENDERIZA, y quien decide CUÁNDO se guarda es la pantalla —en
// `ArmarMesa` es el CTA con la respuesta del servidor ya en la mano, y esa
// espera es asíncrona—. Una `memoria` colgada de la carcasa sería un parámetro
// que nadie llega a leer. Así que la política es lo que se comparte, y se
// comparte entera: `crearMemoria` es el molde, y las dos pantallas declaran la
// suya con dos listas de campos distintas. Queda consignado en el informe §E.
//
// Módulo SIN React ni DOM: el almacén entra por parámetro (molde de
// `leerConfig(saldo)`, que tampoco lee el saldo por su cuenta). Eso es lo que
// permite que Vitest lo selle sin jsdom, que este proyecto no tiene (FRZ-1).

/**
 * Se queda con los campos declarados y tira el resto. Es la política en una
 * línea: lo que no está en `campos` no llega nunca al almacenamiento.
 *
 * Un campo ausente en el objeto tampoco se escribe —no se siembra `undefined`—,
 * para que lo guardado siempre parsee a algo que `normalizar` pueda juzgar.
 */
export function proyectar(config, campos) {
  const fuera = {}
  if (!config || typeof config !== 'object') return fuera
  for (const campo of campos) {
    if (config[campo] !== undefined && config[campo] !== null) fuera[campo] = config[campo]
  }
  return fuera
}

// El almacén del navegador, envuelto en los dos `try/catch` de la casa: una
// ventana privada o unas cookies bloqueadas no pueden tumbar una pantalla, y lo
// peor que produce el fallo es que el jugador vuelva a tocar tres chips.
export const almacenNavegador = {
  leer(clave) {
    try { return window.localStorage.getItem(clave) } catch { return null }
  },
  escribir(clave, valor) {
    try { window.localStorage.setItem(clave, valor) } catch { /* sin sitio: la mesa ya se armó */ }
  },
  borrar(clave) {
    try { window.localStorage.removeItem(clave) } catch { /* nada que limpiar */ }
  },
}

/**
 * Una memoria de pantalla de chips.
 *
 * @param {string}   clave       `ajilei.<cosa>`, convención de la casa
 * @param {string[]} campos      LO ÚNICO que esta pantalla recuerda
 * @param {Function} normalizar  `(crudo, ctx) => config` — pasa las guardas
 * @param {object}   [almacen]   inyectable; por defecto el del navegador
 * @param {string}   [legado]    clave vieja que se absorbe una vez y se borra
 */
export function crearMemoria({ clave, campos, normalizar, almacen = almacenNavegador, legado = null }) {
  return {
    clave,
    campos,

    // SIEMPRE devuelve algo usable: sin nada guardado, con basura dentro o con
    // un valor que ya no vale para este contexto, sale el defecto que decida
    // `normalizar`. Quien llama no comprueba nada.
    leer(ctx) {
      const crudo = almacen.leer(clave)
      let objeto = null
      if (crudo !== null) {
        // Basura en la clave —una mano editando el almacenamiento, una campaña
        // anterior que guardó otra cosa—. Cae al defecto SIN avisar por
        // consola: no es un fallo del programa y el arnés exige consola limpia.
        try { objeto = JSON.parse(crudo) } catch { objeto = null }
      }
      // ── La migración de la clave vieja, UNA vez ────────────────────────────
      // `ajilei.nivel` guardaba un id de reto suelto. Se absorbe como si fuera
      // el campo que ahora es, y se BORRA en el mismo gesto: dejarla viva sería
      // mantener dos fuentes para el mismo dato, y la vieja no se actualiza
      // nunca más.
      if (legado) {
        const viejo = almacen.leer(legado.clave)
        if (viejo !== null) {
          // La clave NUEVA manda: si ya hay algo guardado con el formato de
          // hoy, la vieja no lo pisa — sólo se borra.
          if (objeto === null) objeto = { [legado.campo]: viejo }
          almacen.borrar(legado.clave)
        }
      }
      return normalizar(objeto, ctx)
    },

    // Se llama al pulsar un CTA CON ÉXITO y no al tocar un chip: lo que se
    // recuerda es lo que el jugador llegó a USAR, no por dónde paseó el dedo.
    guardar(config) {
      almacen.escribir(clave, JSON.stringify(proyectar(config, campos)))
    },
  }
}
