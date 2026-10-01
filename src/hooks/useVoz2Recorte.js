import { useCallback, useState } from 'react'
import { estaRecortada, finDeLoLeido } from './voz2Core'

// ── VOZ-2 · ¿Se recortó la frase del óvalo? ─────────────────────────────────
// Devuelve `[ref, recortada]`. El `ref` va en el `.voz2-texto` (que sólo existe
// con resultado), y `recortada` sigue a la caja maquetada, no al texto.
//
// POR QUÉ OBSERVADORES Y NO UN EFECTO. Medir en un `useLayoutEffect` y guardar
// en estado es el `set-state-in-effect` que el lint de la casa marca (molde U1:
// el lint se queda en paridad). Y además se quedaría corto: la caja cambia sin
// que cambie ningún prop (rotar el teléfono, cargar la fuente). Dos
// observadores cubren los dos motivos de cambio:
//   · ResizeObserver — el tamaño de la caja (vista, orientación). Notifica
//     también al empezar a observar, así que la primera medida sale sola.
//   · MutationObserver — el texto (otra frase en la misma caja). Con el
//     recorte, la caja casi nunca cambia de tamaño al cambiar el texto: sin
//     este segundo observador una frase larga tras una corta pasaría sin medir.
// Los dos notifican fuera del render; el estado se fija en su callback.
//
// Ref de callback con limpieza (React 19): se arma al montarse el elemento y
// se desarma al desmontarse. Al desmontarse se vuelve a `false`, para que la
// frase de la mano siguiente no herede el recorte de la anterior.

// El ancho del «…» en la letra del texto, medido en un lienzo (sin tocar el DOM).
let lienzo = null
function anchoElipsis(el) {
  lienzo ??= document.createElement('canvas')
  const ctx = lienzo.getContext('2d')
  if (!ctx) return 0
  const cs = getComputedStyle(el)
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  return ctx.measureText('…').width
}

// ── 1b · Y COLOCA LA FLECHITA ───────────────────────────────────────────────
// En la misma medida se coloca el indicio de toque (`.voz2-indicio`, hermano
// del texto dentro del `<p>`) detrás de lo que se lee: `finDeLoLeido` sobre las
// cajas de los glifos. Se escribe en su `style` y no en estado: es una posición,
// no algo que React tenga que decidir, y así no hay render de más. El `<p>` es
// su bloque contenedor (voz2.css), y las coordenadas se pasan a las del `<p>`
// SIN su transformación: `msgPop` lo escala al aparecer y lo medido en ese
// instante vendría encogido; dividir por la escala lo deja en su sitio final.
// El final es el del «…» (ver `finDeLoLeido`), y su ancho se mide en la letra
// del texto con un lienzo, sin tocar el DOM.
// La fuente puede llegar después de la primera medida y mover los glifos sin
// cambiar la caja: por eso se vuelve a medir cuando `document.fonts` está listo.
function colocaIndicio(el) {
  const p = el.parentElement
  const ind = p && p.querySelector(':scope > .voz2-indicio')
  if (!ind) return
  const tn = el.firstChild
  const cajas = []
  if (tn && tn.nodeType === Node.TEXT_NODE) {
    const rg = document.createRange()
    for (let i = 0; i < tn.length; i++) {
      rg.setStart(tn, i); rg.setEnd(tn, i + 1)
      cajas.push(rg.getBoundingClientRect())
    }
  }
  const pr = p.getBoundingClientRect()
  const escala = p.offsetWidth > 0 ? pr.width / p.offsetWidth : 1
  if (!(escala > 0)) return
  // Las cajas llegan con la escala de `msgPop` aplicada; el «…» se mide sin ella.
  const fin = finDeLoLeido(cajas, el.getBoundingClientRect(), anchoElipsis(el) * escala)
  if (!fin) return
  const izq = (fin.x - pr.left) / escala - p.clientLeft
  const centro = (fin.y + fin.alto / 2 - pr.top) / escala - p.clientTop
  ind.style.left = `${izq}px`
  ind.style.top = `${centro}px`
}

export function useVoz2Recorte() {
  const [recortada, setRecortada] = useState(false)
  const ref = useCallback((el) => {
    if (!el) return undefined
    let vivo = true
    const medir = () => {
      if (!vivo) return
      const r = estaRecortada(el)
      setRecortada(r)
      if (r) colocaIndicio(el)
    }
    const ro = new ResizeObserver(medir)
    const mo = new MutationObserver(medir)
    ro.observe(el)
    mo.observe(el, { childList: true, characterData: true, subtree: true })
    document.fonts?.ready?.then(medir)
    return () => {
      vivo = false
      ro.disconnect()
      mo.disconnect()
      setRecortada(false)
    }
  }, [])
  return [ref, recortada]
}
