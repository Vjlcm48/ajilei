import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ── MED-1a T2 · El latido de sesión ─────────────────────────────────────────
// Rector: AJILEI_MED-1a_T2_v1.0.md §2 y §4; Fase 0 §B.4. Cuánto se queda cada
// quien: `latido_sesion(p_sesion)` cada 60 s mientras la app está visible. La
// duración es `ultimo_latido − inicio` en la base; no hay «fin de sesión».
//
//   · el id vive en memoria (nunca en el almacén): una recarga es sesión nueva;
//   · con la app oculta se para; al volver, menos de 5 min oculta sigue la
//     misma sesión, y más, una nueva;
//   · un `false` de la base (sesión ajena, más de 10 min sin latir, o aún sin
//     perfil) abre sesión nueva en el siguiente latido;
//   · lo que falla se pierde: sin reintentos ni cola. Es medición, no dinero.
//
// `App` lo monta con la condición de `marcar_ingreso` y lo apaga con el bypass.
// Sin jsdom: lo que decide es `crearLatido`, que es lo que se prueba.

export const LATIDO_MS = 60 * 1000
export const OCULTA_MAX_MS = 5 * 60 * 1000

/** Un uuid v4 (`crypto.randomUUID`, o a mano en un contexto no seguro). */
export function idSesion() {
  try { return crypto.randomUUID() } catch {
    const h = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16))
    h[12] = '4'; h[16] = ((parseInt(h[16], 16) & 3) | 8).toString(16)
    const x = h.join('')
    return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`
  }
}

/**
 * @param {{ latir: (id: string) => Promise<boolean|null>, sesion: { id: string }, nuevoId?: () => string,
 *           documento?: object|null, ahora?: () => number }} partes
 *   `sesion` es el objeto de la carga (`sesionPara`): sobrevive a cualquier remontaje, el mismo id.
 */
export function crearLatido({ latir, sesion, nuevoId = idSesion, documento = globalThis.document ?? null, ahora = Date.now }) {
  let reloj = null
  let ocultaDesde = null
  let vivo = false
  const visible = () => documento?.visibilityState !== 'hidden'

  const latido = () => {
    const id = sesion.id
    let p
    try { p = latir(id) } catch { return }
    Promise.resolve(p).then((ok) => { if (ok === false && sesion.id === id) sesion.id = nuevoId() }, () => {})
  }
  // Late EN EL ACTO y reinicia la cadencia desde ahí, aunque el reloj siguiera
  // en marcha (un `visible` sin el `hidden` antes, porque el teléfono congeló la
  // pestaña sin avisar): la base ignora lo que llegue a menos de 20 s.
  const arrancar = () => {
    detener()
    latido()
    reloj = setInterval(latido, LATIDO_MS)
  }
  const detener = () => {
    clearInterval(reloj)
    reloj = null
  }
  const alCambiar = () => {
    if (!vivo) return
    if (!visible()) {
      if (ocultaDesde === null) ocultaDesde = ahora()
      detener()
      return
    }
    // Sin hora de ocultación (no llegó el `hidden`), el id se conserva.
    if (ocultaDesde !== null && ahora() - ocultaDesde >= OCULTA_MAX_MS) sesion.id = nuevoId()
    ocultaDesde = null
    arrancar()
  }

  return {
    iniciar() {
      vivo = true
      documento?.addEventListener?.('visibilitychange', alCambiar)
      if (visible()) arrancar()
      else ocultaDesde = ahora()
    },
    parar() {
      vivo = false
      documento?.removeEventListener?.('visibilitychange', alCambiar)
      detener()
    },
  }
}

const latirEnLaBase = (id) => supabase.rpc('latido_sesion', { p_sesion: id }).then(({ data, error }) => (error ? null : data))

// La sesión es de la CARGA de la página, no del componente: vive en el módulo,
// así que ningún remontaje (StrictMode, un `Suspense`, la cuenta que va y
// vuelve) abre otra. Una recarga evalúa el módulo de nuevo: sesión nueva.
let sesionDeLaCarga = null

/** La sesión de esta carga para `uid`: la misma mientras sea la misma cuenta; otra cuenta, otra. */
export function sesionPara(uid, nuevoId = idSesion) {
  if (sesionDeLaCarga?.uid !== uid) sesionDeLaCarga = { uid, id: nuevoId() }
  return sesionDeLaCarga
}

/** `uid`: la cuenta con perfil y billetera, o `null` (apagado). */
export function useLatidoSesion(uid) {
  useEffect(() => {
    if (!uid) return
    const latido = crearLatido({ latir: latirEnLaBase, sesion: sesionPara(uid) })
    latido.iniciar()
    return () => latido.parar()
  }, [uid])
}
