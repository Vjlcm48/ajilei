import { useEffect, useMemo, useState } from 'react'
import OfertaGuiada from './OfertaGuiada'
import { sumarTextos } from '../config/textos'
import { TEXTOS_TUT_OFERTA } from '../config/textos.tut.es'
import { guia } from '../lib/guia'
import { crearGuiadaApi, premioDisponible } from '../lib/guiadaApi'
import { hayCapitulo } from '../guia/vuelta'

// ── TUT-1 T3 · La puerta de la guiada en el lobby ───────────────────────────
// Rector: AJILEI_TUT-1_T3_v1.0.md §2.1 y §2.3; normativo AJILEI_Tutorial_v1.5.md
// §1.2 y §1.5. Viaja en el trozo de la guiada (`lib/trozos.guiada`), que el lobby pide
// al aterrizar: la entrada sólo lleva el `import()` y una ranura; la oferta, sus textos, la API
// del premio y las marcas viajan aquí (`1.8b`, Fase 0 §C.5). No pinta nada propio.
//
// HACE DOS COSAS, EN ESTE ORDEN:
//   1. EL REINTENTO. Si el cierre de la guiada no pudo confirmar el premio (sin red,
//      `pendientePago` en el aparato), pide `cobrar_guiada()` otra vez. Con
//      `pagado` la píldora toma el saldo que devolvió; con `pagado` o `cobrado`
//      la marca se quita. Cualquier otra respuesta la deja para la próxima visita.
//   2. LA OFERTA. Sólo en una visita sin la marca `ofrecida` —la del recién
//      bautizado y la de las cuentas que ya existían— y sin sala pendiente (quien
//      llega por un enlace va a su mesa; la tarjeta espera a su siguiente visita).
//      La cifra es la de `premio_guiada_estado()`: si no dice `disponible`
//      (cobrado, sin red, sin sesión), la tarjeta no sale. Mejor no prometer.
//      «Jugar la guiada» y «Ahora no» ponen la marca: sale UNA vez.
//
// La marca no se pone al pintar la tarjeta: quien cierra la app con ella delante no
// la contestó, y la vuelve a ver.

sumarTextos('es', TEXTOS_TUT_OFERTA)

/**
 * @param {object} p
 * @param {object|null} [p.cliente]     `{ rpc }` del bypass; sin él, Supabase
 * @param {boolean} [p.salaPendiente]   llegó con una invitación: sin oferta en esta visita
 * @param {Function} p.onJugar          a la mesa guiada
 * @param {Function} [p.onSaldo]        el saldo que devolvió un pago (la píldora lo toma)
 */
export default function PuertaGuiada({ cliente = null, salaPendiente = false, onJugar, onSaldo }) {
  const api = useMemo(() => crearGuiadaApi(cliente ?? undefined), [cliente])
  const [oferta, setOferta] = useState(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      // TUT-1 T5 · el lobby bajo un capítulo (8 y 9): nada escribe ni se ofrece.
      if (hayCapitulo()) return
      if (guia.leer().pendientePago) {
        const r = await api.cobrar()
        if (r.estado === 'pagado' || r.estado === 'cobrado') guia.quitarPendiente()
        if (r.estado === 'pagado' && r.saldo !== null) onSaldo?.(r.saldo)
      }
      if (salaPendiente || guia.leer().ofrecida) return
      const e = await api.estado()
      if (vivo && premioDisponible(e)) setOferta(e)
    })()
    return () => { vivo = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- una vez por visita al lobby

  if (!oferta) return null
  const cerrar = () => { guia.marcarOfrecida(); setOferta(null) }
  return (
    <OfertaGuiada
      monto={oferta.monto}
      limpio={oferta.tramo === 'limpio'}
      onJugar={() => { cerrar(); onJugar?.() }}
      onAhoraNo={cerrar}
    />
  )
}
