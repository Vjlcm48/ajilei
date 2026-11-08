import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { aPropios, escalaActual } from '../lib/escala'
import { DESLIZA_MS, PASTILLA_MS, RECOGE_MS, textoPastilla } from '../lib/transicionCore'

// ── MES-PvP L-M 3 · §2 · La transición entre manos ───────────────────────────────────────
// Ficha AJILEI_MES-PvP_LM-3_v1.0.md §2; variante b (Victor, STOP-L). Las dos mesas, la de
// personas y la de las IAS (la excepción consciente de Victor del 2026-11-06). La monta
// `GameTable` en las dos. Una capa que no toca la maqueta:
//   1. La recogida (`recoger`, o a la hora `recogerA`): las cartas de todos se desvanecen en su
//      sitio. Se animan los nodos reales con `opacity` (Web Animations): Δ = 0 de layout.
//   2. Al cambiar de mano (`handCount`, desde la 2): la marca de Mano se desliza desde su asiento
//      anterior (FLIP sobre el nodo nuevo) y sale la pastilla «Mano 7 · Es Mano Ana» sobre el
//      óvalo, que no se mueve.
// Contra las IAS la recogida arranca al pulsar «Siguiente mano» y la mano nueva espera lo que
// dura (`esperaSiguienteMano`); en PvP cabe dentro de la pausa entre manos.

const visible = (el) => !!el && el.offsetWidth > 0 && el.getClientRects().length > 0
const caja = (el) => aPropios(el.getBoundingClientRect(), escalaActual())
const centro = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
const marca = (clase) => [...document.querySelectorAll(`.game-table-screen .${clase}`)].find(visible) ?? null

export default function TransicionMano({ game, recoger = false, recogerA = null }) {
  const [pastilla, setPastilla] = useState(null)
  const antes = useRef(null)          // la marca de Mano antes de la mano nueva
  const animadas = useRef([])
  const manoVista = useRef(game?.handCount ?? null)

  // 1 · La recogida. En PvP, a su hora: la marca del temporizador es la hora misma, así que una
  // pausa nueva (otra hora) no hereda la recogida de la anterior.
  const [recogidaA, setRecogidaA] = useState(null)
  useEffect(() => {
    if (recogerA === null) return undefined
    const id = setTimeout(() => setRecogidaA(recogerA), Math.max(0, recogerA - Date.now()))
    return () => clearTimeout(id)
  }, [recogerA])
  const activa = recoger || (recogerA !== null && recogidaA === recogerA)

  useLayoutEffect(() => {
    if (!activa) return
    const m = marca('seat-badge-gold')
    antes.current = m && caja(m)
    for (const el of document.querySelectorAll('.game-table-screen .card-slot-wrapper')) {
      if (!visible(el)) continue
      animadas.current.push(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: RECOGE_MS, easing: 'ease-in', fill: 'forwards' }))
    }
    document.querySelector('.game-table-screen')?.setAttribute('data-trans', 'recoge')
  }, [activa])

  // 2 · La mano nueva: se sueltan las cartas, se desliza la marca y sale la pastilla.
  const hand = game?.handCount ?? null
  useLayoutEffect(() => {
    const previa = manoVista.current
    manoVista.current = hand
    if (hand === null || previa === null || hand <= previa) return
    animadas.current.forEach((a) => a.cancel())
    animadas.current = []
    document.querySelector('.game-table-screen')?.removeAttribute('data-trans')
    const desde = antes.current
    antes.current = null
    const el = marca('seat-badge-gold')
    if (el && desde) {
      const ahora = caja(el)
      const f = escalaActual()
      const dx = (centro(desde).x - centro(ahora).x) * f
      const dy = (centro(desde).y - centro(ahora).y) * f
      if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: DESLIZA_MS, easing: 'cubic-bezier(.2,.7,.2,1)' })
      }
    }
    const texto = textoPastilla(game)
    const ovalo = marca('center-zone')
    // La mesa de 2 apaisada no tiene óvalo (`.center-zone`): la franja del pozo y la crónica.
    const franja = !ovalo && [marca('pot-box'), marca('game-message')].filter(Boolean).map(caja)
    if (texto && (ovalo || franja?.length)) {
      // En el cuarto alto del óvalo: lejos de la caja del pozo y de la línea de la crónica. Sin
      // óvalo, en el centro de la franja.
      const o = ovalo ? caja(ovalo) : null
      const x = o ? o.left + o.width / 2 : (Math.min(...franja.map((r) => r.left)) + Math.max(...franja.map((r) => r.right))) / 2
      const y = o ? o.top + o.height * 0.25 : (Math.min(...franja.map((r) => r.top)) + Math.max(...franja.map((r) => r.bottom))) / 2
      requestAnimationFrame(() => setPastilla({ texto, x, y, id: hand }))
    }
  }, [hand, game])

  useEffect(() => {
    if (!pastilla) return undefined
    const id = setTimeout(() => setPastilla(null), PASTILLA_MS)
    return () => clearTimeout(id)
  }, [pastilla])

  const raiz = typeof document !== 'undefined' ? document.querySelector('.game-table-screen') : null
  if (!pastilla || !raiz) return null
  return createPortal(
    <div className="tm-pastilla" role="status" data-trans-pastilla={pastilla.id} style={{ left: pastilla.x, top: pastilla.y }}>
      {pastilla.texto}
    </div>,
    raiz,
  )
}
