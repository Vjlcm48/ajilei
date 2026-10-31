import { supabase } from './supabase'

// ── CFG-1 1e · La puerta del cliente a Mano actual ──────────────────────────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §2.3. Envoltorio delgado sobre las dos
// RPC de la migración `20261030193000_cfg1e_mano_actual.sql`:
//   · `consultar_mano(p_mesa, p_mano)` → (resultado, precio, gratis_restantes, saldo)
//   · `mi_consulta()`                  → (gratis_restantes, ultima_mesa, ultima_mano)
// Devuelve la fila ya validada, o `null` si no llegó (red, error o una forma
// que no es la del contrato): quien llama lo trata como «No se pudo consultar».
//
// El cliente entra por parámetro para que el banco imitado del bypass
// (`dev/bancoImitado.js`, vía `dev/billeteraFalsa.js`) cambie SÓLO la fuente,
// como en las demás capas (contrato único, ECO-1c).

const fila = (data) => (Array.isArray(data) ? data[0] : data) ?? null

/** La fila de `consultar_mano`, o `null` si no tiene la forma del contrato. */
export function traducirConsulta(data) {
  const f = fila(data)
  if (!f || typeof f.resultado !== 'string') return null
  return {
    resultado: f.resultado,
    precio: Number.isInteger(f.precio) ? f.precio : 0,
    gratis_restantes: Number.isInteger(f.gratis_restantes) ? f.gratis_restantes : null,
    saldo: Number.isFinite(Number(f.saldo)) ? Number(f.saldo) : null,
  }
}

/** La fila de `mi_consulta`, o `null`. Sin `gratis_restantes` entero no es la del contrato. */
export function traducirMiConsulta(data) {
  const f = fila(data)
  if (!f || !Number.isInteger(f.gratis_restantes)) return null
  return {
    gratis_restantes: f.gratis_restantes,
    ultima_mesa: typeof f.ultima_mesa === 'string' ? f.ultima_mesa : null,
    ultima_mano: Number.isInteger(f.ultima_mano) ? f.ultima_mano : null,
  }
}

export function crearConsultaApi(cliente = supabase) {
  const llamar = async (nombre, params, traducir) => {
    try {
      const { data, error } = await cliente.rpc(nombre, params)
      return error ? null : traducir(data)
    } catch {
      return null
    }
  }
  return {
    mi: () => llamar('mi_consulta', undefined, traducirMiConsulta),
    consultar: (mesa, mano) => llamar('consultar_mano', { p_mesa: mesa, p_mano: mano }, traducirConsulta),
  }
}

export const consultaApi = crearConsultaApi()
