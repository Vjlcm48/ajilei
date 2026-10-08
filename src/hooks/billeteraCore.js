// ── ECO-1b · Núcleo puro de la billetera del cliente ────────────────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §1 (B1, B2) y el plan aprobado del
// STOP-1. Molde de `salasCore.js` y `retarCore.js`: sin React, sin DOM, sin red.
// Toda decisión sobre el saldo vive aquí y Vitest la sella; `useBilletera` sólo
// la cablea a React, y este proyecto no tiene jsdom.
//
// ── UNA SOLA CIFRA ──────────────────────────────────────────────────────────
// Hasta la 1b el teléfono tenía dos saldos que no se hablaban: `saldoSesion`
// (vs-IA) y la constante 5.000 (PvP). Ahora hay uno:
//
//     saldo = billetera del servidor + ajuste local de sesión
//
// La billetera la lee `mi_billetera()` (migración de la 1a). El ajuste es lo
// que las partidas contra las IAS mueven mientras el servidor no las conoce.
//
// TRANSITORIO hasta ECO-1c: el ajuste vive en memoria, no se persiste en ningún
// almacenamiento y se pierde al recargar la página (B2, camino A aprobado por
// Victor). En la 1c la entrada, las recargas y la salida pasan a ser
// movimientos del libro y el ajuste desaparece entero.
//
// ── LA BILLETERA ES DE UNA CUENTA ───────────────────────────────────────────
// El estado guarda el `uid` al que pertenece, igual que `useAuth` guarda el
// perfil con su dueño. Si se cierra sesión y entra otra cuenta en la misma carga
// de página, `paraCuenta` empieza de cero: ni la cifra ni el ajuste de la
// anterior se cuelan.

/** Los tres estados de la lectura. */
export const CARGANDO = 'cargando'
export const LISTO = 'listo'
export const ERROR = 'error'

// ── Por qué se vuelve a leer ────────────────────────────────────────────────
//   ARRANQUE      la cuenta acaba de llegar a `COMPLETO` (o cambió)
//   PRIMER_PLANO  la app vuelve a verse (`visibilitychange`)
//   INSUFICIENTE  el servidor rechazó una mesa PvP con `saldo_insuficiente`:
//                 la cifra que enseñamos era más alta que la suya
//   REINTENTO     el jugador lo pide (el botón de Retar tras un fallo)
export const MOTIVOS = Object.freeze({
  ARRANQUE: 'arranque',
  PRIMER_PLANO: 'primer-plano',
  INSUFICIENTE: 'insuficiente',
  REINTENTO: 'reintento',
})

// Entre dos lecturas por volver a primer plano pasan al menos 15 s. Cambiar de
// app y volver diez veces seguidas no son diez lecturas: el saldo no cambia tan
// deprisa, y `mi_billetera` no lleva límite de frecuencia en el servidor (Reglas
// §7: las lecturas no lo llevan), así que el freno es éste. Si la última
// lectura FALLÓ no hay espera: quien vuelve a la app tras cortarse la red tiene
// que ver su saldo ya, no dentro de quince segundos.
export const INTERVALO_PRIMER_PLANO_MS = 15000

/** La billetera de una cuenta que todavía no se ha leído. */
export function billeteraNueva(uid, servidor = null) {
  const conocido = esSaldoValido(servidor)
  return {
    uid: uid ?? null,
    servidor: conocido ? servidor : null,
    estado: conocido ? LISTO : CARGANDO,
    // TRANSITORIO hasta ECO-1c
    ajuste: 0,
  }
}

/**
 * La billetera de ESTA cuenta. Si la guardada es de otra, se empieza de cero.
 * Devuelve el mismo objeto cuando no hay nada que cambiar, para que React no
 * vea un estado nuevo donde no lo hay.
 */
export function paraCuenta(billetera, uid) {
  if (billetera && billetera.uid === (uid ?? null)) return billetera
  return billeteraNueva(uid)
}

/** Un saldo del servidor que se puede enseñar: entero, finito y no negativo. */
export function esSaldoValido(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

/** ¿Esta respuesta de `mi_billetera()` trae un saldo que se puede enseñar? */
export function respuestaValida(respuesta) {
  return Boolean(respuesta) && !respuesta.error && esSaldoValido(respuesta.data)
}

/**
 * ¿Toca leer la billetera ahora?
 *
 * `control` es lo que el hook guarda fuera del render: la cuenta, si hay una
 * lectura en vuelo, cuándo se pidió la última y si falló. Las reglas:
 *   · sin cuenta, nunca;
 *   · nunca dos lecturas a la vez, sea cual sea el motivo;
 *   · el arranque, una sola vez por cuenta (StrictMode monta dos veces);
 *   · primer plano, como mucho una vez cada 15 s, salvo tras un fallo;
 *   · un `saldo_insuficiente` o un reintento, siempre que no haya otra en vuelo.
 */
export function debeLeer(control, motivo, ahora) {
  if (!control || !control.uid) return false
  if (control.enVuelo) return false
  switch (motivo) {
    case MOTIVOS.ARRANQUE:
      return control.ultima === null
    case MOTIVOS.PRIMER_PLANO:
      return control.ultima === null || control.fallo === true
        || ahora - control.ultima >= INTERVALO_PRIMER_PLANO_MS
    case MOTIVOS.INSUFICIENTE:
    case MOTIVOS.REINTENTO:
      return true
    default:
      return false
  }
}

/**
 * Aplica la respuesta de `mi_billetera()` a la billetera de `uid`.
 *
 * `respuesta` es `{ data, error }` de `billeteraApi.leer()`. Una cifra que no
 * sea un saldo válido —`null`, un texto, un negativo— cuenta como fallo: el
 * servidor real nunca la da (`coalesce(…, 0)`), así que si llega es que algo
 * en medio no es el servidor, y enseñarla sería inventar.
 *
 * Con fallo, la cifra que ya se conocía SE CONSERVA: tras un corte de red la
 * píldora sigue diciendo lo último que sabía en vez de quedarse vacía o en 0.
 */
export function alResponder(billetera, uid, respuesta) {
  const propia = paraCuenta(billetera, uid)
  if (respuestaValida(respuesta)) {
    return { ...propia, servidor: respuesta.data, estado: LISTO }
  }
  return { ...propia, estado: ERROR }
}

/**
 * La cifra que se enseña, o `null` si todavía no se sabe.
 * Nunca negativa: si el ajuste local dejara la suma bajo cero (un ajuste del
 * administrador a la baja mientras se juega), se enseña 0.
 */
export function saldoMostrado(billetera) {
  if (!billetera || billetera.servidor === null) return null
  return Math.max(0, billetera.servidor + billetera.ajuste)
}

// ── Las tres operaciones del ajuste local · TRANSITORIO hasta ECO-1c ────────
// Son las mismas cuentas que hacía `saldoSesion` en `App.jsx` hasta la 1b, en
// los mismos sitios (B2): la entrada resta al sentarse, la recarga resta al
// confirmarse y la salida suma lo que el jugador se lleva.

/** Al sentarse: la entrada sale del bolsillo (era `App.jsx:571`). */
export function entrar(billetera, entrada) {
  const monto = Number.isFinite(entrada) ? entrada : 0
  return { ...billetera, ajuste: billetera.ajuste - monto }
}

/**
 * Al confirmar una recarga (era `App.jsx:542`): `max(0, saldo − monto)`. Se
 * resta como mucho lo que hay, para que la suma no baje de cero y la salida
 * posterior sume sobre 0, igual que antes.
 */
export function recargar(billetera, monto) {
  const m = Number.isFinite(monto) ? monto : 0
  const actual = saldoMostrado(billetera)
  const quitar = actual === null ? m : Math.min(m, actual)
  return { ...billetera, ajuste: billetera.ajuste - quitar }
}

/**
 * Al levantarse de la mesa (era `App.jsx:543-547`): vuelven las fichas con las
 * que se sale, o la entrada si la mesa no supo decirlas.
 */
export function salir(billetera, fichas, entrada) {
  const vuelven = Number.isFinite(fichas) ? fichas : (Number.isFinite(entrada) ? entrada : 0)
  return { ...billetera, ajuste: billetera.ajuste + vuelven }
}

// ── El saldo con el que se JUZGA ────────────────────────────────────────────
// Mientras la cifra no ha llegado no se apaga nada por saldo: ni mesas en gris,
// ni «No te alcanza», ni «Te faltan». Juzgar contra un saldo que no se sabe
// sería castigar al jugador por la red. `Infinity` es la convención que ya usaba
// `retarCore.normalizarReto` («sin saldo que juzgar») y la que `salasCore`
// acepta desde la 1b; quien decide de verdad es el servidor.
export const SIN_JUICIO = Infinity

export function saldoParaJuzgar(saldo) {
  return saldo === null || saldo === undefined ? SIN_JUICIO : saldo
}
