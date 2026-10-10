// ── ECO-1c · El aviso de saldo: tiempos y cifra, puros ──────────────────────
// Lámina `laminas/eco1c/lamina.html`, aprobada por Victor tal cual (STOP-2).
// Un aviso único e identificable para el dinero que vuelve FUERA de la mesa,
// anclado a la píldora del saldo de `BarraSuperior`: la cápsula con la moneda y
// un texto corto, la píldora que cuenta de la cifra vieja a la nueva con el
// brillo de LOB-1, y `chipsCollect` suave al empezar a subir.
//
// Genérico a propósito: en la 1d lo reutiliza la constancia. El video de
// recompensa NO lo usa (rector, cambio de P-5).
//
// Todo es función del tiempo desde que el aviso nace (t = 0), igual que en la
// lámina, para que Vitest lo selle sin DOM.

/** Los tiempos de la lámina, en ms desde t = 0. */
export const TIEMPOS_AVISO = Object.freeze({
  entra: 200,        // aparece
  cuentaIni: 250,    // la píldora empieza a contar (y suena)
  cuentaDur: 900,    // lo que dura la cuenta
  brilloDur: 1100,   // el halo y el destello, una vez
  sale: 300,         // se desvanece
})

/** Vive entre 3,2 y 4 s: 3.200 ms y 25 por carácter por encima de 40. */
export function vidaAviso(texto) {
  const n = typeof texto === 'string' ? texto.length : 0
  return Math.min(4000, 3200 + Math.max(0, n - 40) * 25)
}

const subida = (x) => 1 - Math.pow(1 - x, 3)
const tramo = (t, a, dur) => Math.max(0, Math.min(1, (t - a) / dur))

/**
 * La cifra de la píldora en el instante t. Con 0 HC no cuenta (se queda en la
 * de antes); con movimiento reducido salta a la nueva al llegar a la cuenta.
 */
export function cifraAviso(aviso, t, reducido = false) {
  const { desde, hasta } = aviso
  if (!(hasta > desde) || t < TIEMPOS_AVISO.cuentaIni) return desde
  if (reducido) return hasta
  const x = tramo(t, TIEMPOS_AVISO.cuentaIni, TIEMPOS_AVISO.cuentaDur)
  return Math.round(desde + (hasta - desde) * subida(x))
}

/** ¿Brilla la moneda de la píldora en t? Nunca con 0 HC ni con movimiento reducido. */
export function brillaAviso(aviso, t, reducido = false) {
  if (reducido || !(aviso.hasta > aviso.desde)) return false
  return t >= TIEMPOS_AVISO.cuentaIni && t < TIEMPOS_AVISO.cuentaIni + TIEMPOS_AVISO.brilloDur
}

/** ¿Suena ya? Una vez, al empezar a subir; nunca con 0 HC. */
export function suenaAviso(aviso, t) {
  return aviso.hasta > aviso.desde && t >= TIEMPOS_AVISO.cuentaIni
}

/**
 * El aviso de una mesa que volvió: `cobrado` es lo que volvió y `saldo` la
 * billetera DESPUÉS. La píldora cuenta de `saldo − cobrado` a `saldo`.
 * `clave` es la de 0 HC si no volvió nada.
 */
export function avisoDeVuelta({ cobrado, saldo }, claves, id = nuevoIdAviso()) {
  const monto = Math.max(0, Number(cobrado) || 0)
  return {
    id,
    clave: monto > 0 ? claves.conMonto : claves.cero,
    monto,
    desde: saldo - monto,
    hasta: saldo,
  }
}

// ── ECO-1d · LA FILA DE AVISOS ──────────────────────────────────────────────
// Rector 1d §2.2 y el plan del STOP-1 §4, con la precisión del STOP-1: el
// dinero que vuelve en el mismo arranque —la mesa recogida y la constancia—
// sale en FILA, uno tras otro, nunca a la vez, y la píldora cuenta cada subida
// por separado. Entre uno y otro, el hueco de la lámina (250 ms).
//
// Los avisos que van atados a un cambio de pantalla (C5 al sentarse, C6 al
// perder la mesa) NO esperan: SUSTITUYEN la fila. Y la píldora no retrocede ni
// pierde lo ya cobrado: el aviso nuevo arranca desde la cifra que se está
// mostrando (`desdeAlSustituir`, que aplica `useAvisoSaldo` al nacer).

/** El hueco entre dos avisos de la fila. */
export const HUECO_FILA_MS = 250

// Ids que no chocan: dos avisos nacidos en el mismo milisegundo (la recogida y
// la constancia, que van seguidas) tendrían el mismo `Date.now()`.
let ultimoIdAviso = 0
export const nuevoIdAviso = () => `aviso-${++ultimoIdAviso}`

/** La fila con un aviso más al final. */
export function encolarAviso(fila, aviso) {
  return aviso ? [...fila, aviso] : fila
}

/**
 * El aviso `id` terminó: sale de la fila. El siguiente, si lo hay, espera el
 * hueco antes de entrar. Si `id` no es el primero, nada cambia.
 */
export function sacarAviso(fila, id) {
  if (!fila.length || fila[0].id !== id) return fila
  const [siguiente, ...resto] = fila.slice(1)
  return siguiente ? [{ ...siguiente, espera: HUECO_FILA_MS }, ...resto] : []
}

/** C5/C6: la fila entera se cambia por este aviso, que hereda la cifra visible. */
export function sustituirFila(aviso) {
  return aviso ? [{ ...aviso, sustituye: true }] : []
}

/**
 * Desde dónde cuenta un aviso que sustituye a otro a medio pintar: desde la
 * cifra que se está viendo (nunca hacia atrás, nunca más allá de su `hasta`).
 * Sin cifra visible, desde el suyo.
 */
export function desdeAlSustituir(cifraVisible, aviso) {
  return Number.isFinite(cifraVisible) ? Math.min(cifraVisible, aviso.hasta) : aviso.desde
}
