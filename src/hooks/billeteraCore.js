// ── ECO-1b · Núcleo puro de la billetera del cliente ────────────────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §1 (B1, B2) y el plan aprobado del
// STOP-1. Molde de `salasCore.js` y `retarCore.js`: sin React, sin DOM, sin red.
// Toda decisión sobre el saldo vive aquí y Vitest la sella; `useBilletera` sólo
// la cablea a React, y este proyecto no tiene jsdom.
//
// ── UNA SOLA CIFRA ──────────────────────────────────────────────────────────
// Hasta la 1b el teléfono tenía dos saldos que no se hablaban: `saldoSesion`
// (vs-IA) y la constante 5.000 (PvP). La 1b los juntó en «billetera del
// servidor + ajuste local», y la 1c (AJILEI_ECO-1_Fase1c_v1.0.md §2.2) retira
// el ajuste: la entrada, las recargas y la salida contra las IAS son ya
// movimientos del libro, así que
//
//     saldo = billetera del servidor
//
// y llega por dos caminos: la lectura de `mi_billetera()` y el saldo que
// devuelve cada función de dinero (`tomarSaldo`), sin relectura extra.
//
// ── PENDIENTE ───────────────────────────────────────────────────────────────
// Mientras se cobra una salida, la cifra vieja ya no es verdad (le faltan las
// fichas de la mesa) y la nueva aún no llegó: la píldora enseña «—», como en
// la carga, y nadie juzga contra ella (`saldoParaJuzgar` → sin juicio).
//
// ── LA GENERACIÓN ───────────────────────────────────────────────────────────
// Una lectura de `mi_billetera()` que salió ANTES de un `tomarSaldo` puede
// llegar DESPUÉS con la cifra vieja (al arrancar, la recogida de la mesa
// abandonada y la lectura corren a la vez). Cada `tomarSaldo` sube la
// generación del control del hook, y una lectura de una generación anterior se
// tira (`lecturaVigente`).
//
// ── LA BILLETERA ES DE UNA CUENTA ───────────────────────────────────────────
// El estado guarda el `uid` al que pertenece, igual que `useAuth` guarda el
// perfil con su dueño. Si se cierra sesión y entra otra cuenta en la misma carga
// de página, `paraCuenta` empieza de cero: la cifra de la anterior no se cuela.
//
// ── IOS-1c · NINGUNA LECTURA SIN SALIDA ─────────────────────────────────────
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.2. Una lectura colgada bloqueaba a
// todas las demás (`enVuelo`) y un fallo no se reintentaba hasta otro cambio de
// visibilidad. Ahora una lectura en vuelo CADUCA pasado el tope de red (la
// espera de un refresco de sesión no la cubre el tope del transporte: informe
// de la 1c, §1), y tras un fallo la lectura se reintenta sola, con la escalera
// de la mesa, mientras la app se ve.
//
// ── IOS-1c · LA CIFRA RECORDADA ─────────────────────────────────────────────
// Al arrancar (V-1) la píldora enseña, atenuada, la última cifra que este
// aparato vio DEL SERVIDOR para esta cuenta (`lib/saldoRecordado.js`). Es sólo
// para la vista: `saldoMostrado` sigue nulo, y por eso ningún juez la ve —ni
// mesas en gris, ni «no te alcanza», ni el bloque del video—. Al cobrar una
// salida (V-2) no hay cifra recordada: la de antes de sentarse sería falsa.

/** Los tres estados de la lectura. */
import { TOPE_RED_MS } from '../lib/red'
import { ESPERAS_RED_MS } from '../lib/controlMesaIA'

export const CARGANDO = 'cargando'
export const LISTO = 'listo'
export const ERROR = 'error'

// ── Por qué se vuelve a leer ────────────────────────────────────────────────
//   ARRANQUE      la cuenta acaba de llegar a `COMPLETO` (o cambió)
//   PRIMER_PLANO  la app vuelve a verse (`visibilitychange`)
//   INSUFICIENTE  el servidor rechazó una mesa con `saldo_insuficiente`: la
//                 cifra que enseñamos era más alta que la suya
//   REINTENTO     el jugador lo pide (el botón de Retar tras un fallo), o una
//                 salida no contestó y hay que enseñar lo que diga el servidor
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

// IOS-1c · una lectura que lleva más que esto en vuelo se da por perdida: la
// siguiente sale aunque aquélla no haya contestado (y su respuesta, si llega,
// se tira: ya no es la vigente).
export const CADUCIDAD_LECTURA_MS = TOPE_RED_MS

/** IOS-1c · cuánto se espera para reintentar tras `fallos` lecturas fallidas seguidas. */
export function esperaReintento(fallos) {
  const i = Math.max(0, Math.min(fallos - 1, ESPERAS_RED_MS.length - 1))
  return ESPERAS_RED_MS[i]
}

/** La billetera de una cuenta que todavía no se ha leído. */
export function billeteraNueva(uid, servidor = null) {
  const conocido = esSaldoValido(servidor)
  return {
    uid: uid ?? null,
    servidor: conocido ? servidor : null,
    estado: conocido ? LISTO : CARGANDO,
    pendiente: false,
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
 *   · nunca dos lecturas a la vez, sea cual sea el motivo, salvo que la que
 *     vuela haya caducado (IOS-1c);
 *   · el arranque, una sola vez por cuenta (StrictMode monta dos veces);
 *   · primer plano, como mucho una vez cada 15 s, salvo tras un fallo;
 *   · un `saldo_insuficiente` o un reintento, siempre que no haya otra en vuelo.
 */
export function debeLeer(control, motivo, ahora) {
  if (!control || !control.uid) return false
  // IOS-1c · en vuelo, sí; colgada más allá de la caducidad, ya no bloquea.
  if (control.enVuelo && !(ahora - (control.enVueloDesde ?? ahora) >= CADUCIDAD_LECTURA_MS)) return false
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
 *
 * Una lectura no quita el «pendiente» de una salida: la cifra que trae puede
 * ser de antes del cobro.
 */
export function alResponder(billetera, uid, respuesta) {
  const propia = paraCuenta(billetera, uid)
  if (respuestaValida(respuesta)) {
    return { ...propia, servidor: respuesta.data, estado: LISTO }
  }
  return { ...propia, estado: ERROR }
}

/**
 * IOS-1c · la cifra recordada que se puede enseñar, o `null`.
 * Sólo en V-1 (sin cifra del servidor y sin cobro en curso) y sólo si el
 * recuerdo es de ESTA cuenta y es un saldo válido.
 */
export function recordadoPara(billetera, recuerdo) {
  if (!billetera || billetera.servidor !== null || billetera.pendiente) return null
  if (!recuerdo || recuerdo.uid !== billetera.uid || !billetera.uid) return null
  return esSaldoValido(recuerdo.saldo) ? recuerdo.saldo : null
}

/** La cifra que se enseña, o `null` si todavía no se sabe o se está cobrando. */
export function saldoMostrado(billetera) {
  if (!billetera || billetera.servidor === null || billetera.pendiente) return null
  return billetera.servidor
}

// ── ECO-1c · El saldo que devuelven las funciones de dinero ─────────────────
// `sentarse_ia`, `recargar_ia`, `salir_ia` y `recoger_mesa_ia` devuelven el
// saldo de la billetera tras moverla: se toma tal cual, sin releer.

/** El saldo que acaba de devolver el servidor. Lo que no es un saldo no toca nada. */
export function tomarSaldo(billetera, uid, saldo) {
  const propia = paraCuenta(billetera, uid)
  if (!esSaldoValido(saldo)) return propia
  return { ...propia, servidor: saldo, estado: LISTO, pendiente: false }
}

/** Se está cobrando una salida: la píldora enseña «—» hasta que llegue la cifra. */
export function esperarSaldo(billetera, uid) {
  return { ...paraCuenta(billetera, uid), pendiente: true }
}

/** La salida no contestó: se deja de esperar y se enseña lo que diga la lectura. */
export function soltarEspera(billetera, uid) {
  return { ...paraCuenta(billetera, uid), pendiente: false }
}

/** ¿Sigue valiendo una lectura pedida en la generación `deLaLectura`? */
export function lecturaVigente(control, deLaLectura) {
  return (control?.generacion ?? 0) === deLaLectura
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
