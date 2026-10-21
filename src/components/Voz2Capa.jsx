import { useCallback } from 'react'
import { anchoCapa, colocaCapa } from '../hooks/voz2Core'
import { aPropios, escalaActual } from '../lib/escala'

// ── VOZ-2 · La frase entera, desplegada ─────────────────────────────────────
// Rector: AJILEI_VOZ-2_Fase1_v1.0.md (D2, D3, D9, D10, D13). Forma y sitio, los
// que Victor eligió en la lámina de la 1a: «C · globo» (oscuro, borde de oro,
// el lenguaje de la burbuja de REC-1) «sobre el óvalo».
//
// OVERLAY PURO, MOLDE `.vc-capa`: `position: fixed`, hermana de la mesa y no
// metida en el óvalo (D2). Así no ocupa sitio en ningún flujo y abrirla o
// cerrarla no mueve ni un ancla: la puerta `voz2.capa` lo mide. `z-index: 20`
// (D9): sobre la mesa, bajo el vuelo de monedas (26), los popups (30/31), la
// celebración AJILEI (32) y los modales (100/120).
//
// Se MONTA mientras la frase esté recortada —aunque esté cerrada, con
// `hidden`— porque es el elemento al que apunta el `aria-controls` del texto
// (D13): una referencia a un id que no existe no le sirve a nadie. El texto
// completo, además, sigue siempre en el propio `.voz2-texto`.
//
// SE COLOCA MIDIENDO, no con reglas: el ancla es el texto que la controla
// (`[aria-controls=<id>]`) y la caja es la de SU óvalo (`.center-zone`, o el
// `.felt-oval` derecho en la ruta de dos óvalos). Las cuentas son la pieza pura
// `colocaCapa`. Se recoloca cuando cambia el tamaño de la capa o del óvalo, al
// redimensionar la ventana y con cualquier scroll (en captura: el scroller de
// la mesa es `.game-table-screen`, no la ventana). Mientras está `hidden` no
// se coloca: al mostrarse, su ResizeObserver avisa antes del primer pintado.
//
// Tocarla la cierra (D3): el `onClick` es suyo y no llega al óvalo, porque la
// capa no es hija del óvalo. El toque que corta la celebración (molde H4) es un
// `pointerdown` del documento en captura: no se ve afectado (D11).
export function Voz2Capa({ id, texto, abierta, onCerrar }) {
  const ref = useCallback((el) => {
    if (!el) return undefined
    const ancla = () => document.querySelector(`[aria-controls="${CSS.escape(id)}"]`)
    const ovaloDe = (a) => a && a.closest('.center-zone, .felt-oval')
    const colocar = () => {
      if (el.hidden) return
      const ov = ovaloDe(ancla())
      if (!ov) return
      // TAB-1 · la capa es `fixed` dentro de `#root` ampliado: el óvalo Y la
      // ventana pasan a px propios ANTES de las cuentas (el alto de la capa,
      // `offsetHeight`, ya es propio). Dividir solo la salida mezclaba una caja
      // visual con un alto propio (lámina 1a §5).
      const f = escalaActual()
      const o = aPropios(ov.getBoundingClientRect(), f)
      const vp = { width: document.documentElement.clientWidth / f, height: window.innerHeight / f }
      const ancho = anchoCapa(o, vp)
      el.style.width = `${ancho}px`
      const { x, y } = colocaCapa({ ovalo: o, vp, ancho, alto: el.offsetHeight })
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
    const ro = new ResizeObserver(colocar)
    ro.observe(el)
    const ov = ovaloDe(ancla())
    if (ov) ro.observe(ov)
    window.addEventListener('resize', colocar)
    document.addEventListener('scroll', colocar, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', colocar)
      document.removeEventListener('scroll', colocar, true)
    }
  }, [id])
  return (
    <div ref={ref} id={id} className="voz2-capa" hidden={!abierta} onClick={onCerrar}>
      {texto}
    </div>
  )
}
