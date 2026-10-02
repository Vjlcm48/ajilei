// ── arnes/juego.mjs · ARN-3b · lo PURO del bucle de autojuego ────────────────
// Rector: AJILEI_ARN-3b_v1.0.md §0. El bucle que juega las manos vive en
// `autojuego.mjs` (necesita la página); aquí está lo que DECIDE, sin navegador,
// para poder probarlo en vitest (`juego.test.js`):
//   · qué botón pulsa el humano                                      (D2)
//   · cuándo la mesa se redujo y desde qué fotograma                  (D3)
//   · por qué una mano no cerró                                       (D5)
//   · si un fotograma rompe la invariante del turno fantasma          (D8)
//   · en qué estado queda una celda: medida, sin cobertura o error    (D4)

// ── D2 · la decisión del humano ──────────────────────────────────────────────
// El orden histórico de los bucles —Pasar, Igualar, Apostar— se conserva tal
// cual: es el que produjo las líneas base (D9). Lo nuevo es el caso que APU-1
// abrió y ningún bucle contestaba: cuando la pila no llega, la fila es
// «All-in (X)» y «Retirarse» (GameTable.jsx:2367-2369). Sin respuesta, el reloj
// de 20 s retiraba al humano (GameTable.jsx:792-794) y una mano con varias de
// esas esperas pasaba del tope: el `SINCERRAR` de a2 (ARN-3 Fase 0 §B4).
// Por defecto se RETIRA: es lo mismo que hacía el reloj, solo que sin esperar,
// y deja la pila del humano viva, que es lo que quieren los modos que miden la
// mesa tres manos seguidas. `sinPila: 'allin'` empuja la mano al pago.
export const ORDEN_ACCIONES = Object.freeze(['pasar', 'igualar', 'apostar'])
export const SIN_PILA = Object.freeze(['allin', 'retirarse'])

/**
 * `acciones`: los `data-accion` visibles y habilitados de la fila del humano.
 * Devuelve la acción a pulsar, o null si no hay fila.
 */
export function elegirAccion(acciones, { sinPila = 'retirarse' } = {}) {
  if (!Array.isArray(acciones) || acciones.length === 0) return null
  for (const a of ORDEN_ACCIONES) if (acciones.includes(a)) return a
  if (sinPila !== 'allin' && sinPila !== 'retirarse') throw new Error(`sinPila: «${sinPila}» (valen allin y retirarse)`)
  if (acciones.includes(sinPila)) return sinPila
  const otra = SIN_PILA.find((a) => a !== sinPila)
  return acciones.includes(otra) ? otra : null
}

// ── D8 · el turno fantasma (verifyC441b, fusionado) ──────────────────────────
// Ninguna IA puede aparecer «X está pensando…» con su panel en «Se retiró». En
// la mesa de 2 la frase es «La IA está pensando…», sin nombre: allí hay un solo
// rival, así que basta con que ese rival esté retirado.
/**
 * `pensando`: el texto de la franja «… está pensando…» (o null).
 * `retirados`: nombres de los paneles rivales que dicen «Se retiró».
 * Devuelve el nombre del fantasma, o null.
 */
export function violacionFantasma({ pensando, retirados }) {
  if (!pensando || !Array.isArray(retirados) || retirados.length === 0) return null
  const m = String(pensando).trim().match(/^(.*?) está pensando/)
  if (!m) return null
  const quien = m[1].trim()
  if (quien === 'La IA') return retirados[0]
  return retirados.includes(quien) ? quien : null
}

// ── El estado de una celda a lo largo de sus manos ───────────────────────────
/** Lo que el bucle va sabiendo de la mesa, mano tras mano, dentro de una celda. */
export function nuevoJuego() {
  return {
    vivos0: null, vivos: null, reducida: false, reducidaDesde: null, framesReducida: 0,
    ceremonias: 0, eliminandoAntes: 0,
    fantasmas: [], ausente: false, sinPila: 0,
    manos: 0, cerradas: 0, sinCerrar: [],
  }
}

/**
 * D3 + D8 · mira UN fotograma ya leído y actualiza el juego. `lectura` trae
 * `vivos` (1 + rivales con panel que no están saliendo), `eliminando` (paneles
 * en `.opp-eliminating`), `pensando` y `retirados`. Devuelve lo que pasó en
 * este fotograma: `{ reducida, nuevaReduccion, fantasma, ceremonia }`.
 */
export function vigilarFotograma(juego, lectura, tag) {
  const ev = { reducida: false, nuevaReduccion: false, fantasma: null, ceremonia: false }
  if (Number.isFinite(lectura.vivos)) {
    if (juego.vivos0 == null) juego.vivos0 = lectura.vivos
    // D3 · desde que CAMBIA el número de vivos, la mesa es otra: lo que se mida
    // desde ahí es de una mesa más pequeña, no un desplazamiento de esta.
    if (!juego.reducida && lectura.vivos !== juego.vivos0) {
      juego.reducida = true; juego.reducidaDesde = tag; ev.nuevaReduccion = true
    }
    juego.vivos = lectura.vivos
  }
  ev.reducida = juego.reducida
  // La ceremonia de encogimiento (la vigilancia viva de verifyShrink): se
  // cuenta cada vez que aparece al menos un panel saliendo donde no había.
  const elim = lectura.eliminando || 0
  if (elim > 0 && juego.eliminandoAntes === 0) { juego.ceremonias++; ev.ceremonia = true }
  juego.eliminandoAntes = elim
  const f = violacionFantasma(lectura)
  if (f) { ev.fantasma = f; juego.fantasmas.push({ tag, quien: f, pensando: lectura.pensando }) }
  return ev
}

// ── D5 · por qué una mano no cerró ───────────────────────────────────────────
/**
 * `ultimos`: los últimos fotogramas que vio el bucle, cada uno con
 * `{ tag, presente, recarga: { tarjeta, burbuja, motivo }, botones, acciones, pensando }`.
 * Devuelve una causa con nombre; nunca vacía.
 */
export function causaSinCerrar(ultimos) {
  if (!Array.isArray(ultimos) || ultimos.length === 0) return 'sin-fotogramas'
  const u = ultimos[ultimos.length - 1]
  if (u.presente === false) return 'mesa-ausente'
  if (ultimos.some((f) => f.recarga && (f.recarga.tarjeta || f.recarga.burbuja || f.recarga.motivo))) return 'recarga-pendiente'
  if ((u.acciones || []).length) {
    return (u.acciones || []).every((a) => SIN_PILA.includes(a)) ? 'sin-pila-sin-contestar' : 'humano-con-fila'
  }
  if ((u.botones || []).some((b) => /^(Descartar|Sin descartar)/.test(b))) return 'descarte-sin-contestar'
  if (u.pensando) return 'tope-con-ia-pensando'
  return 'tope'
}

// ── D4 · tres estados por celda ──────────────────────────────────────────────
export const ESTADO = Object.freeze({ MEDIDA: 'medida', SIN_COBERTURA: 'sinCobertura', ERROR: 'error' })
export const INTENTOS_COBERTURA = 3

/**
 * El estado de una celda tras sus intentos. `cubierta`: el caso que la celda
 * existe para medir se dio. `error`: la celda no terminó. Un caso que no se dio
 * NO es verde ni rojo de producto: es «sin cobertura» (D4).
 */
export function estadoCelda({ error = null, cubierta = true } = {}) {
  if (error) return ESTADO.ERROR
  return cubierta ? ESTADO.MEDIDA : ESTADO.SIN_COBERTURA
}

/** ¿Hay que volver a intentar la celda con otra mano? */
export function reintentar(estado, intento, intentos = INTENTOS_COBERTURA) {
  return estado === ESTADO.SIN_COBERTURA && intento < intentos
}

/** D3 · separa los fotogramas de la mesa reducida de los que miden la mesa entera. */
export function separarReducida(fotogramas) {
  const medidos = [], reducidos = []
  for (const f of fotogramas || []) (f && f.mesaReducida ? reducidos : medidos).push(f)
  return { medidos, reducidos }
}

/** El resumen que cada celda vuelca en su JSON. */
export function resumenJuego(juego) {
  return {
    manos: juego.manos, cerradas: juego.cerradas,
    sinCerrar: juego.sinCerrar,
    mesaReducida: juego.reducida ? { desde: juego.reducidaDesde, vivos: `${juego.vivos0}→${juego.vivos}`, frames: juego.framesReducida } : null,
    ausente: juego.ausente,
    turnoFantasma: juego.fantasmas.length, fantasmas: juego.fantasmas.slice(0, 5),
    ceremonias: juego.ceremonias, sinPila: juego.sinPila,
  }
}
