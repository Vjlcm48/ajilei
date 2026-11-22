import { supabase } from './supabase'
import { clienteGuiadaDev } from '../dev/guiadaFalsa'

// ── TUT-1 T3 · La puerta del cliente al premio de la guiada ─────────────────
// Rector: AJILEI_TUT-1_T3_v1.0.md §2.1–§2.3; normativo AJILEI_Tutorial_v1.4.md
// §1.5. Molde de `constanciaApi.js`: envoltorio delgado, sin estado y sin reglas.
// Llama a `premio_guiada_estado()` y `cobrar_guiada()` (migración
// `20261121150000_tut1_guiada.sql`), que devuelven un objeto `jsonb`.
//
// EL CLIENTE SOLO PIDE. La cifra y el tramo los decide el servidor; aquí no hay
// ningún 2.000 ni 1.000 escrito: lo que se enseña es lo que contestó.
//
// NUNCA RECHAZA. Una red caída, un 500, una respuesta sin forma o una excepción
// del SDK llegan como `{ estado: 'red' }`. `cobrar_guiada` paga una vez por
// correo: preguntar otra vez nunca paga dos veces.
//
// No viaja en la entrada: lo importan los trozos que lo usan (la puerta del
// lobby, «Cómo se juega» y el cierre de la guiada). El cliente entra por
// parámetro; sin él, el del banco imitado si es desarrollo con bypass
// (`dev/guiadaFalsa.clienteGuiadaDev`, `null` en la build) y si no, Supabase:
// el bypass cambia SÓLO la fuente.

export const ESTADO_RED = 'red'

const num = (v) => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Lo que devolvió una de las dos funciones → `{ estado, monto, tramo, saldo }`. Pura. */
export function traducirPremio(data) {
  const fila = Array.isArray(data) ? data[0] : data
  if (!fila || typeof fila !== 'object' || typeof fila.estado !== 'string') return { estado: ESTADO_RED, monto: 0, tramo: null, saldo: null }
  return {
    estado: fila.estado,
    monto: num(fila.monto) ?? 0,
    tramo: typeof fila.tramo === 'string' ? fila.tramo : null,
    saldo: num(fila.saldo),
  }
}

/** ¿Hay una cifra que prometer? Sólo con `disponible` y un monto positivo. */
export const premioDisponible = (r) => r?.estado === 'disponible' && r.monto > 0

export function crearGuiadaApi(cliente = clienteGuiadaDev() ?? supabase) {
  const llamar = (nombre) => {
    let llamada
    try {
      llamada = cliente.rpc(nombre)
    } catch (e) {
      console.warn(`TUT-1: ${nombre} no salió —`, String(e?.message ?? e))
      return Promise.resolve(traducirPremio(null))
    }
    return Promise.resolve(llamada)
      .then(({ data, error } = {}) => {
        if (error) {
          console.warn(`TUT-1: ${nombre} falló —`, error.code ?? '(sin código)', error.message)
          return traducirPremio(null)
        }
        return traducirPremio(data)
      })
      .catch((e) => {
        console.warn(`TUT-1: ${nombre} no contestó —`, String(e?.message ?? e))
        return traducirPremio(null)
      })
  }
  return {
    /** `premio_guiada_estado()`: disponible (con la cifra) o cobrado. */
    estado: () => llamar('premio_guiada_estado'),
    /** `cobrar_guiada()`: pagado, cobrado, limite, … o red. */
    cobrar: () => llamar('cobrar_guiada'),
  }
}
