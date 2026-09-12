// ── SAL-B1 · La semántica de las dos pantallas, sin React y sin DOM ─────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §3 y §4. Autoridad visual: las láminas
// SAL-1 v1.2 y SAL-2 v1.2, selladas.
//
// Módulo SIN React ni DOM, molde de `lobbyCore.js` y `relojCore.js`. La razón es
// la de siempre en esta casa y esta vez pesa más que nunca: el proyecto NO tiene
// jsdom (hallazgo de FRZ-1), así que un `.jsx` no se puede montar en Vitest.
// Todo lo que este archivo contiene —el orden del listado, la resta del «Te
// faltan», la máscara del código, la guarda de la configuración recordada— es
// exactamente lo que §9.2 exige probar, y vive aquí para que se pueda.
//
// Lo que NO está aquí: nada que llame a la red, lea `localStorage` o mire el
// reloj. Las pantallas ponen eso; este archivo sólo decide.

import {
  ALFABETO_CODIGO,
  APUESTAS_PVP,
  JUGADORES_PVP,
  saldoMinimo,
} from '../config/salas'

// ── La máscara del código ───────────────────────────────────────────────────
// El campo de la lámina son cuatro casillas detrás de un `AJ-` fijo, así que lo
// que se teclea es SÓLO el cuerpo. Esta función es el filtro de cada pulsación.
//
// FILTRA EN VEZ DE RECHAZAR, y la diferencia se nota en el dedo: rechazar la
// tecla entera dejaría al jugador que escribe «AJ-7K2M» de una captura viendo
// cómo su `A` y su `J` no entran y sin saber por qué. Filtrar deja pasar lo que
// sirve y se traga en silencio lo que no —el guion, el espacio, la O y el cero—,
// que es lo que hace que pegar el código completo funcione sin instrucciones.
//
// El prefijo `AJ` que venga pegado NO se descuenta aquí: `normalizarCodigo` de
// `salas.js` es quien sabe distinguir prefijo de cuerpo, y lo hace por longitud.
// Aquí sólo se limpia y se corta a cuatro. Quien pega `AJ-7K2M` ve entrar `AJ7K`
// y corrige; quien pega `7K2M` acierta a la primera. Es el precio de tener el
// `AJ-` dibujado fuera del campo, que es lo que la lámina selló.
export const LARGO_CODIGO = 4

export function filtrarCodigo(texto) {
  if (typeof texto !== 'string') return ''
  let salida = ''
  for (const caracter of texto.toUpperCase()) {
    if (ALFABETO_CODIGO.includes(caracter)) salida += caracter
    if (salida.length === LARGO_CODIGO) break
  }
  return salida
}

/** El botón «Entrar» se enciende con exactamente cuatro caracteres válidos. */
export function codigoListo(cuerpo) {
  return typeof cuerpo === 'string' && cuerpo.length === LARGO_CODIGO
}

// ── La regla del 5×, del lado de la cortesía ────────────────────────────────
// §3.5 lo deja escrito y conviene repetirlo aquí, donde se ejecuta: esto NO
// valida. El servidor comprueba la misma regla en `crear_sala` y `unirse_sala` y
// su `saldo_insuficiente` se pinta igual que cualquier otro error. Lo que estas
// dos funciones deciden es qué botón enseñar apagado para no gastar un viaje de
// red en algo que el cliente ya sabe.

export function alcanza(apuesta, saldo) {
  return Number.isFinite(saldo) && saldo >= saldoMinimo(apuesta)
}

/**
 * Lo que le falta a este saldo para sentarse a esa apuesta. Nunca negativo.
 *
 * Es la cifra del «Te faltan {hc} HC» de la lámina, y se calcula y no se guarda:
 * el día que ECO-1 mueva el saldo, el número cambia solo.
 */
export function faltanPara(apuesta, saldo) {
  const falta = saldoMinimo(apuesta) - (Number.isFinite(saldo) ? saldo : 0)
  return falta > 0 ? falta : 0
}

// ── El orden del listado ────────────────────────────────────────────────────
// `salas_abiertas()` ya devuelve ordenado por «más llenas primero, y a igualdad
// la apuesta más baja» (migración §13). Lo que el servidor NO hace —y no puede
// hacer, porque el saldo del que mira no entra en esa consulta— es empujar al
// final las mesas fuera de alcance. Eso es §3.3 y se hace aquí.
//
// EL ORDEN DEL SERVIDOR NO SE REPITE A CIEGAS: se vuelve a aplicar dentro de
// cada uno de los dos grupos. Sin eso, el reparto en dos montones conservaría el
// orden relativo (`sort` es estable en JS desde ES2019) y funcionaría igual
// HOY —porque llega ordenado—, pero se rompería en silencio el día que alguien
// añada un filtro, una fuente de fixtures o una segunda página. Reordenar cuesta
// nada y hace que la promesa del listado sea de esta función y no de la suerte.
//
// `sentados` llega de un `count(*)`, que en Postgres es `bigint`. PostgREST lo
// entrega como número, pero se pasa por `Number()` igualmente: si algún día
// llegara como cadena —un cambio de configuración, un fixture escrito a mano—,
// `'3' - '10'` seguiría funcionando pero `'3' > '10'` sería `true` y el orden se
// invertiría sin un solo error en consola.
export function normalizarMesa(fila) {
  return {
    id: fila?.id ?? null,
    jugadores: Number(fila?.jugadores),
    apuesta: Number(fila?.apuesta),
    sentados: Number(fila?.sentados ?? 0),
    expiraEn: fila?.expira_en ?? null,
  }
}

export function ordenarMesas(filas, saldo) {
  if (!Array.isArray(filas)) return []
  const mesas = filas.map(normalizarMesa)

  const porLlenado = (a, b) => (b.sentados - a.sentados) || (a.apuesta - b.apuesta)

  const dentro = mesas.filter((m) => alcanza(m.apuesta, saldo)).sort(porLlenado)
  const fuera = mesas.filter((m) => !alcanza(m.apuesta, saldo)).sort(porLlenado)
  return [...dentro, ...fuera]
}

// ── Las dos preguntas que ArmarMesa le hace al listado ──────────────────────
// §4.3 pedía «la función de SAL-A que lo resuelva si existe». No existe: el
// informe de SAL-A lista las trece y ninguna responde «¿hay una abierta de N×X?».
// Se filtra en cliente sobre `salas_abiertas()`, que es la otra vía que la
// propia ficha autoriza. Queda anotado en el informe.

/** La mesa abierta con EXACTAMENTE esta combinación, o `null`. */
export function buscarCombinacion(mesas, jugadores, apuesta) {
  if (!Array.isArray(mesas)) return null
  return mesas.find((m) => m.jugadores === jugadores && m.apuesta === apuesta) ?? null
}

/**
 * La mesa que el recordatorio suave señala en modo ABIERTA: una a mi alcance
 * que NO sea mi combinación —si fuera la mía, el CTA ya habría cambiado a
 * «Unirme a esa mesa» y el recordatorio sobraría—.
 *
 * Se toma la primera del listado ya ordenado, que por §3.3 es la más llena: la
 * que antes va a arrancar, que es la que merece la pena señalar.
 */
export function otraMesaAlAlcance(mesas, saldo, jugadores, apuesta) {
  if (!Array.isArray(mesas)) return null
  return mesas.find(
    (m) => alcanza(m.apuesta, saldo) && !(m.jugadores === jugadores && m.apuesta === apuesta)
  ) ?? null
}

// ── La configuración recordada · §4.4 ───────────────────────────────────────
// El valor por defecto es el que marca la lámina SAL-2: `{ n: 4, apuesta: 100,
// modo: 'privada' }`. Se escribe con los nombres del contrato de la base
// (`jugadores`, `apuesta`, `tipo`) y no con los de la lámina, para que lo que se
// recuerda tenga la misma forma que lo que se envía.
export const CONFIG_POR_DEFECTO = { jugadores: 4, apuesta: 100, tipo: 'privada' }

export const TIPOS_SALA = ['privada', 'abierta']

/**
 * Devuelve una configuración USABLE a partir de lo que se leyó del
 * almacenamiento, que puede ser cualquier cosa.
 *
 * Las tres guardas de §4.4, y por qué cada una:
 *
 *   · lo que no parsea o no tiene forma se ignora ENTERO y cae al defecto. No se
 *     rescatan campos sueltos de un objeto medio roto: un `{jugadores: 3}` sin
 *     apuesta rescatado a medias dejaría al jugador con una mesa que él no
 *     eligió y sin manera de saber de dónde salió;
 *   · un valor fuera de las listas selladas cae al defecto — no se «acerca» al
 *     más próximo, porque `APUESTAS_PVP` y `JUGADORES_PVP` son el contrato con
 *     los `check` de la base y aproximar sería inventarse una séptima apuesta;
 *   · una apuesta recordada que YA NO alcanza cae SÓLO ella, y no arrastra a los
 *     jugadores ni al tipo. Es el caso real —el jugador se gastó el saldo entre
 *     dos sesiones— y perder también «mesa de 5, privada» por eso sería castigar
 *     dos veces. La apuesta que la releva es la del defecto, no la mayor que
 *     alcance: elegir por él sería decidir cuánto se juega.
 */
export function normalizarConfig(crudo, saldo) {
  if (!crudo || typeof crudo !== 'object') return { ...CONFIG_POR_DEFECTO }

  const jugadores = JUGADORES_PVP.includes(crudo.jugadores)
    ? crudo.jugadores
    : CONFIG_POR_DEFECTO.jugadores

  const tipo = TIPOS_SALA.includes(crudo.tipo) ? crudo.tipo : CONFIG_POR_DEFECTO.tipo

  const apuestaValida = APUESTAS_PVP.includes(crudo.apuesta)
  const apuesta = apuestaValida && alcanza(crudo.apuesta, saldo)
    ? crudo.apuesta
    : CONFIG_POR_DEFECTO.apuesta

  return { jugadores, apuesta, tipo }
}

// ── El aviso al anfitrión · §4.2 ────────────────────────────────────────────
// «Con 500 HC, un invitado nuevo (1.200 HC de bienvenida) no podrá sentarse.»
//
// La ficha lo enuncia como «cuando apuesta > 200» y la lámina como
// `apuesta * REGLA > BONO`. Son la misma frontera dicha de dos maneras —5×240 =
// 1200— y se implementa la SEGUNDA, que es la fórmula: escrita como «> 200», el
// día que el bono suba a 2.000 el aviso seguiría saliendo en la mesa de 500 y
// mintiendo. Escrita como fórmula, se corrige sola. Regla de la casa: fórmula
// sobre constante.
export function fueraDelAlcanceDeNuevos(apuesta, bono) {
  return saldoMinimo(apuesta) > bono
}

// ── SAL-B1 · Ajuste A2 §6.1 · ¿Este uid ya arrancó? ─────────────────────────
// La guardia del arranque de salas de `App`, como función pura. Recibe lo que
// la guardia recuerda (el uid que ya arrancó, o `null`) y el uid actual, y
// devuelve qué hacer y qué recordar. Vive aquí, y no como un booleano dentro
// del efecto, por dos razones: para que se pueda PROBAR la secuencia completa
// sin jsdom, y porque la versión booleana ya se equivocó una vez —no se
// rearmaba al cerrar sesión, y el segundo login en la misma carga de página
// nunca preguntaba `mi_sala()`—.
//
// Las tres reglas:
//   · sin sesión (`uid` nulo) NO se arranca y la guardia SE DESARMA: cerrar
//     sesión es lo que permite que el siguiente login arranque, sea la misma
//     cuenta u otra;
//   · el mismo uid no arranca dos veces seguidas: es lo que absorbe el
//     remontaje de StrictMode y los re-renders que traen el mismo perfil;
//   · un uid distinto del recordado arranca. Una sesión nueva es un arranque
//     nuevo.
//
// @param {string|null} arrancado  el uid que la guardia recuerda, o `null`
// @param {string|null} uid        el uid de la sesión actual, o `null`
// @returns {{arrancar:boolean, arrancado:string|null}}
export function arranqueDeSesion(arrancado, uid) {
  if (uid == null) return { arrancar: false, arrancado: null }
  if (arrancado === uid) return { arrancar: false, arrancado }
  return { arrancar: true, arrancado: uid }
}
