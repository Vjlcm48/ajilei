import { supabase } from './supabase'
import { lugarValido } from './lugarCore'

// ── CFG-1 1b · La puerta del cliente al perfil propio ───────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.3 (R-6). Envoltorio delgado sobre
// `profiles` y las dos RPC de la migración `20261030013000_cfg1b_perfil.sql`
// (`nombre_libre`, `mi_proximo_cambio`). DEVUELVE LO QUE DEVUELVE EL SDK
// (`{ data, error }`): quien decide qué significa cada código es `useAuth`,
// que ya traducía los tres de SUP-2a y ahora traduce también el del freno.
//
// El cliente entra por parámetro para que el banco imitado del bypass
// (`dev/bancoImitado.js`, vía `dev/billeteraFalsa.js`) cambie SÓLO la fuente,
// como en las demás capas (contrato único, ECO-1c).

/** Las columnas del perfil propio. `nombre_cambiado_en` no viaja: la fecha la da `mi_proximo_cambio`. */
export const COLUMNAS_PERFIL = 'id, username, pais, estado'

/** El código del freno de 30 días (el `raise` de `profiles_freno_nombre`). */
export const CODIGO_FRENO = 'AJ030'

/** La fila de `profiles` → el perfil, con el lugar validado contra las listas (INV-74). */
export function traducirPerfilPropio(f) {
  if (!f || typeof f !== 'object' || typeof f.username !== 'string') return null
  return { id: f.id, username: f.username, ...lugarValido(f.pais, f.estado) }
}

/** Un instante ISO del servidor → `Date`, o `null` si no lo es. */
export function fechaDelServidor(v) {
  if (typeof v !== 'string' || v === '') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** El error del freno → la fecha desde la que se puede (va en el `hint`), o `null`. */
export function fechaDelFreno(error) {
  return error?.code === CODIGO_FRENO ? fechaDelServidor(error.hint) : null
}

/** «28 de noviembre», en la zona del aparato (§0-13). */
export function fechaCorta(fecha, idioma = 'es') {
  return new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'long' }).format(fecha)
}

export function crearPerfilApi(cliente = supabase) {
  const tabla = () => cliente.from('profiles')
  return {
    leer: (uid) => tabla().select(COLUMNAS_PERFIL).eq('id', uid).maybeSingle(),
    crear: (uid, username) => tabla().insert({ id: uid, username }).select(COLUMNAS_PERFIL).single(),
    /** `campos` ⊂ { username, pais, estado }: las tres columnas del `grant`. */
    actualizar: (uid, campos) => tabla().update(campos).eq('id', uid).select(COLUMNAS_PERFIL).single(),
    nombreLibre: (nombre) => cliente.rpc('nombre_libre', { p: nombre }),
    proximoCambio: () => cliente.rpc('mi_proximo_cambio'),
  }
}

export const perfilApi = crearPerfilApi()
