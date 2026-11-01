import { supabase } from './supabase'

// ── TIE-1 1a · La puerta del cliente a la tienda ─────────────────────────────
// Rector: AJILEI_TIE-1_Fase1a_v1.0.md §3.2. Envoltorio delgado sobre las cuatro
// RPC de la migración `20261031150000_tie1a_inventario.sql`:
//   · `mi_inventario(p_tipo)`                    → setof inventario
//   · `comprar_articulo(p_tipo, p_articulo, p_tono)` → text (motivo cerrado)
//   · `usar_articulo(p_tipo, p_articulo)`        → text
//   · `elegir_tono(p_tipo, p_articulo, p_tono)`  → text
// Las tres que escriben devuelven el motivo tal cual, o `null` si no llegó
// (red, error o una respuesta que no es texto): quien llama lo trata como «No se
// pudo». `inventario` devuelve la lista de filas, o `null`.
//
// El cliente entra por parámetro para que el banco imitado del bypass
// (`dev/bancoImitado.js`, vía `dev/billeteraFalsa.js`) cambie SÓLO la fuente,
// como en las demás capas (contrato único, ECO-1c).

/** Las filas de `mi_inventario`, o `null` si no es una lista de filas del contrato. */
export function traducirInventario(data) {
  if (!Array.isArray(data)) return null
  return data
    .filter((f) => f && typeof f.tipo === 'string' && typeof f.articulo === 'string')
    .map((f) => ({
      tipo: f.tipo,
      articulo: f.articulo,
      tono: typeof f.tono === 'string' ? f.tono : null,
      en_uso: f.en_uso === true,
    }))
}

/** El motivo de una de las tres que escriben, o `null`. */
export const traducirMotivo = (data) => (typeof data === 'string' && data !== '' ? data : null)

export function crearTiendaApi(cliente = supabase) {
  const llamar = async (nombre, params, traducir) => {
    try {
      const { data, error } = await cliente.rpc(nombre, params)
      return error ? null : traducir(data)
    } catch {
      return null
    }
  }
  return {
    inventario: (tipo = 'tapete') => llamar('mi_inventario', { p_tipo: tipo }, traducirInventario),
    comprar: (tipo, articulo, tono = null) =>
      llamar('comprar_articulo', { p_tipo: tipo, p_articulo: articulo, p_tono: tono }, traducirMotivo),
    usar: (tipo, articulo) => llamar('usar_articulo', { p_tipo: tipo, p_articulo: articulo }, traducirMotivo),
    elegirTono: (tipo, articulo, tono) =>
      llamar('elegir_tono', { p_tipo: tipo, p_articulo: articulo, p_tono: tono }, traducirMotivo),
  }
}

export const tiendaApi = crearTiendaApi()
