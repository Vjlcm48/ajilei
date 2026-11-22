import { useEffect, useMemo } from 'react'
import { guia } from '../lib/guia'
import { crearGuiadaApi } from '../lib/guiadaApi'

// ── TUT-1 T3 · La puerta de la guiada en el lobby ───────────────────────────
// Rector: AJILEI_TUT-1_T3_v1.0.md §2.1; normativo AJILEI_Tutorial_v1.4.md §1.5. Viaja en
// el trozo de la guiada (`lib/trozos.guiada`), que el lobby pide al aterrizar: la entrada
// sólo lleva el `import()` y una ranura; la API del premio y las marcas viajan aquí
// (`1.8b`, Fase 0 §C.5). No pinta nada.
//
// EL REINTENTO. Si el cierre de la guiada no pudo confirmar el premio (sin red,
// `pendientePago` en el aparato), pide `cobrar_guiada()` otra vez. Con `pagado` la
// píldora toma el saldo que devolvió; con `pagado` o `cobrado` la marca se quita.
// Cualquier otra respuesta la deja para la próxima visita.

/**
 * @param {object} p
 * @param {object|null} [p.cliente]     `{ rpc }` del bypass; sin él, Supabase
 * @param {Function} [p.onSaldo]        el saldo que devolvió un pago (la píldora lo toma)
 */
export default function PuertaGuiada({ cliente = null, onSaldo }) {
  const api = useMemo(() => crearGuiadaApi(cliente ?? undefined), [cliente])

  useEffect(() => {
    if (!guia.leer().pendientePago) return
    api.cobrar().then((r) => {
      if (r.estado === 'pagado' || r.estado === 'cobrado') guia.quitarPendiente()
      if (r.estado === 'pagado' && r.saldo !== null) onSaldo?.(r.saldo)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- una vez por visita al lobby

  return null
}
