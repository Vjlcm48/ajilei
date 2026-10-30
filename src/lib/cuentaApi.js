import { supabase } from './supabase'
import { CABECERA_TOPE } from './red'

// ── CFG-1 1c · Eliminar la cuenta: la llamada a la Edge Function ────────────
// Rector: AJILEI_CFG-1_Fase1c_v1.0.md §2.2 y §3.2.
//
// El borrado NO es una RPC: lo hace la Edge Function `eliminar_cuenta` con la
// llave de servicio (`auth.admin.deleteUser`), y la cascada se lleva todo salvo
// la huella de `bonos_bienvenida`. Aquí sólo se llama y se traduce. El SDK
// manda el JWT de la sesión en `Authorization`; la función saca el uid de ahí,
// nunca del cuerpo, y por eso el cuerpo va vacío.
//
// LA RESPUESTA SE CIERRA EN CUATRO MOTIVOS y nunca lanza:
//   200 { ok: true }                 → { ok: true }
//   409 { motivo: 'mesa_abierta' }   → mesa_abierta (mesa IA o sala, esperando o activa)
//   401                              → sin_sesion (el token no vale en el servidor)
//   sin respuesta (red, tope de 20 s) → red
//   cualquier otra cosa              → servidor
//
// EL TOPE ES DE 20 s, no los 8 del resto del SDK (Ajuste A de STOP-B1): la
// función borra en cascada todo lo de la cuenta. Se pide con la cabecera de
// `red.js`, que no sale del aparato.
//
// El 401 lo trata `App` COMO EL OK (Ajuste A): la sesión ya no vale en el
// servidor. El caso de verdad es un borrado que tardó más que el tope: la
// cuenta ya no existe y el reintento contesta 401.

export const MOTIVOS = Object.freeze(['mesa_abierta', 'sin_sesion', 'red', 'servidor'])
export const TOPE_ELIMINAR_MS = 20_000

const falla = (motivo) => ({ ok: false, motivo })

/**
 * `{ data, error }` de `functions.invoke` → `{ ok: true }` o `{ ok: false, motivo }`.
 * El error HTTP del SDK (`FunctionsHttpError`) trae la `Response` en `context`.
 */
export async function traducirEliminar({ data, error } = {}) {
  if (!error) return data && data.ok === true ? { ok: true } : falla('servidor')
  if (error.name === 'FunctionsFetchError') return falla('red')
  if (error.name !== 'FunctionsHttpError') return falla('servidor')
  const status = error.context?.status
  if (status === 401) return falla('sin_sesion')
  if (status === 409) {
    const cuerpo = await Promise.resolve().then(() => error.context.json()).catch(() => null)
    return cuerpo?.motivo === 'mesa_abierta' ? falla('mesa_abierta') : falla('servidor')
  }
  return falla('servidor')
}

export function crearCuentaApi(cliente = supabase) {
  return {
    async eliminar() {
      let r
      try {
        r = await cliente.functions.invoke('eliminar_cuenta', {
          method: 'POST',
          headers: { [CABECERA_TOPE]: String(TOPE_ELIMINAR_MS) },
        })
      } catch (e) {
        console.warn('CFG-1c: eliminar_cuenta no salió —', String(e?.message ?? e))
        return falla('red')
      }
      const traducida = await traducirEliminar(r)
      if (!traducida.ok) console.warn('CFG-1c: eliminar_cuenta →', traducida.motivo)
      return traducida
    },
  }
}

export const cuentaApi = crearCuentaApi()
