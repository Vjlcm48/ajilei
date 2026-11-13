import { TAPETE_POR_DEFECTO, tapetePorId, conTonos, esGratuito } from '../config/tapetes'
import { estaComprado, normalizarTapete, normalizarTono } from './tapetesCore'

// ── TIE-1 1a · Núcleo puro de la tienda ──────────────────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.4; lámina `laminas/tie1a` (V2–V5).
// Sin React ni DOM: qué enseña la vista de un artículo, qué hace cada motivo del
// servidor y en qué orden van los estantes. `Tienda.jsx` sólo pinta y llama.

// Los cinco estantes de V2-B, en su orden. Los tres últimos, «Pronto».
export const ESTANTES = Object.freeze([
  Object.freeze({ id: 'monedas' }),
  Object.freeze({ id: 'tapetes' }),
  Object.freeze({ id: 'reversos', pronto: true }),
  Object.freeze({ id: 'avatares', pronto: true }),
  Object.freeze({ id: 'premium', pronto: true }),
])
export const ESTANTE_POR_DEFECTO = 'tapetes'

/** Un estante vivo que se puede abrir; cualquier otra cosa, el de por defecto. */
export function normalizarEstante(id) {
  return ESTANTES.some((e) => e.id === id && !e.pronto) ? id : ESTANTE_POR_DEFECTO
}

// ── La fila «Tapetes» del ⚙ (V6) ─────────────────────────────────────────────
// Lo que está en uso según la foto del canal (sin canal, el verde): el id que
// nombra la fila y pinta el disco, y su tono (`null` sin tonos: la fila dice
// sólo el nombre, «Verde clásico»).
export function enUsoFila(foto) {
  const id = normalizarTapete(foto?.enUso)
  return { id, tono: normalizarTono(id, foto?.tono) }
}

// MES-PvP 7a · INV-76 · qué hace la fila al tocarla. En la sala de espera la entrada ya está
// cobrada y el reloj corre (y con la mesa llena son 10 s): ir a la tienda desmontaba la sala y la
// mesa arrancaba sin el jugador. Ahí la fila se queda en su sitio, apagada, y avisa
// (`cuenta.tapetesApagados`, lo pone `SalaEspera`). Fuera, abre la tienda; sin la puerta, «Pronto».
//   { apagada, aviso }: `aviso` es la clave del toast, o `null` si abre la tienda.
export function filaTapetes(cuenta) {
  if (cuenta?.tapetesApagados) return { apagada: true, aviso: 'tie.cfg.fuera' }
  if (cuenta?.abrirTapetes) return { apagada: false, aviso: null }
  return { apagada: false, aviso: 'lob.toast.pronto' }
}

// ── La vista de un artículo (V4-A) ───────────────────────────────────────────
// `foto` es la del canal (`lib/controlTapetes`); `saldo`, el de la billetera
// (`null` mientras no se sabe); `previa`, el tono que el jugador tocó en un
// tapete que NO tiene (sólo vista previa: viaja en la compra).
//
//   comprado  lo tiene (el verde, siempre)
//   enUso     es el que lleva la mesa
//   tono      el que pinta la vitrina: el suyo si lo tiene, la previa si no;
//             `null` en los que no tienen tonos
//   cta       'en_uso' (sin botón) · 'usar' · 'comprar' · 'falta' (atenuado,
//             con «No te alcanza») · 'esperando' (aún no se sabe lo comprado o
//             el saldo: atenuado y sin nota)
//   falta     los HC que faltan en 'falta'; 0 en los demás
export function vistaArticulo({ id, foto, saldo, previa = null }) {
  const tap = tapetePorId(id)
  if (!tap) return null
  const comprados = foto?.comprados ?? {}
  const sabido = foto?.cargado === true
  const comprado = esGratuito(id) || (sabido && estaComprado(id, comprados))
  const enUso = (foto?.enUso ?? TAPETE_POR_DEFECTO) === id
  const tono = !conTonos(id) ? null
    : comprado ? normalizarTono(id, comprados[id]) : normalizarTono(id, previa)
  let cta
  let falta = 0
  if (enUso && (comprado || esGratuito(id))) cta = 'en_uso'
  else if (comprado) cta = 'usar'
  else if (!sabido || !Number.isFinite(saldo)) cta = 'esperando'
  else if (saldo < tap.precio) { cta = 'falta'; falta = tap.precio - saldo }
  else cta = 'comprar'
  return { tap, comprado, enUso, tono, cta, falta }
}

// ── Lo que hace la ventana de compra con cada respuesta (V5-A) ───────────────
//   'listo'       'ok': la vista pasa a «✓ En uso» y sale el aviso
//   'sin_saldo'   se cierra y la billetera se relee: la vista recalcula «No te alcanza»
//   'ya_comprado' se cierra sin error: el canal ya releyó el inventario
//   'error'       se queda abierta con «No se pudo comprar. Tu saldo no cambió.»
// `null` (no contestó, o el tope de 20 s) y cualquier otro motivo son 'error'.
export function trasCompra(motivo) {
  if (motivo === 'ok') return 'listo'
  if (motivo === 'sin_saldo') return 'sin_saldo'
  if (motivo === 'ya_comprado') return 'ya_comprado'
  return 'error'
}

/** Lo que te quedaría tras comprar: nunca negativo (con saldo de sobra, la resta). */
export const teQuedaran = (saldo, precio) => Math.max(0, (Number.isFinite(saldo) ? saldo : 0) - precio)

// El tope de la espera de una compra (molde de la 1c): pasado, la ventana dice
// error y deja volver a intentar. El servidor, si llegó, no cobra dos veces.
export const TOPE_COMPRA_MS = 20000
