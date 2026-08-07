import { useState, useRef, useLayoutEffect } from 'react'
import {
  REACCIONES,
  REACCION_TOTAL_MS,
  REACCION_PICO_PX,
  REACCION_GAP_PX,
  REACCION_MIN_W_PX,
} from '../config/reacciones'

// ── DSK-U2 · Selector de reacciones y burbuja ────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.2.md §3 y §4.
// Ambas superficies se montan como HERMANAS DEL ÁREA (vecinas del panel de
// utilidades y de las cartas voladoras), nunca dentro de un panel de jugador:
// .opp-panel es position:relative con z-index (1, y 7 revelado) —o sea, un
// contexto de apilamiento que atraparía la burbuja— y además la coreografía R2
// le aplica `transform`, lo que anclaría un `fixed` descendiente al panel en
// vez de al viewport. Colgando del <main> el `fixed` ancla al viewport (cadena
// sin transform, verificada en el diagnóstico) y los tokens --dsk-* del bloque
// DSK siguen heredando.

// ── Selector ─────────────────────────────────────────────────────────────────
// Rejilla 3×4 para las 12 frases, en el orden sellado de config/reacciones.js.
// Elegida sobre 2×6 por el criterio del encargo: ninguna de las dos toca cartas
// ni botones del humano en ninguna de las 20 celdas (0,00% ambas), y el empate
// lo rompe la oclusión total — 3×4 es menor en 19 de las 20.
// Anclado por su borde DERECHO al filo derecho del ⋮ (molde del popup del
// contador): el ancho puede crecer con la rejilla sin recalcular el ancla.
export function ReaccionesSelector({ anchor, bloqueado, onElegir }) {
  if (!anchor) return null
  return (
    <div
      className="u2-selector"
      role="menu"
      aria-label="Reacciones"
      style={{ right: `${anchor.right}px`, top: `${anchor.top}px` }}
    >
      {REACCIONES.map((frase) => (
        <button
          key={frase}
          type="button"
          role="menuitem"
          className="u2-frase"
          disabled={bloqueado}
          onClick={() => onElegir(frase)}
        >
          {frase}
        </button>
      ))}
    </div>
  )
}

// Filos ÚTILES del área (border-box menos borde y padding vivos). No se cablea
// ningún número: se leen del elemento en el momento de colocar.
function filosArea() {
  const el = document.querySelector('.game-table')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  return {
    izq: r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft),
    der: r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight),
  }
}

// ── Burbuja ──────────────────────────────────────────────────────────────────
// Overlay puro: fuera de flujo, `fixed`, pointer-events:none salvo la X. Δ=0 de
// layout por construcción — no ocupa una sola celda del flujo.
//
// ANCLAJE POR TINTA, no por caja. Los nombres llevan reserva fija de 12ch
// (DSK-P1/H1/H2) con el texto a la izquierda: el centro de la CAJA queda a
// 31,80px (paneles de IA), 37,05 (mesa 2) y 37,98 (banda humana) del centro de
// la TINTA — más que el ancho del propio nombre. Un pico centrado en la caja
// apuntaría a espacio vacío. El rect bueno es el del Range sobre el contenido.
//
// El emoji es PARTE de la frase (v1.2 §2), así que no puede quedarse huérfano
// en una línea propia cuando el corredor obliga a envolver — que es justo lo
// que hacía la frase más larga en mesa 2. Se une al último término con un
// espacio duro EN EL RENDER: el contenido sellado no se toca, sólo se pinta sin
// dejar que el salto lo separe.
const sinHuerfano = (t) => t.replace(/\s+(\S+)$/u, '\u00A0$1')

// TOPE DE ANCHO POR CORREDOR VIVO. Las cartas propias son inocluibles, así que
// la burbuja del humano no puede pasar de la primera carta: su tope sale de
// medir el corredor real (filo útil izquierdo del área → primera carta) menos
// el aire. Medido 136,5..289,73px según mesa y viewport; con ese tope la
// oclusión de cartas propias es 0,00% en las 20 celdas y el pico sigue dentro.
// Las frases largas envuelven — encoger es la mitigación, y es deliberada.
export function ReaccionBurbuja({ activa, anchorSel, onCerrar }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)

  const id = activa?.id

  useLayoutEffect(() => {
    const el = ref.current
    const nodo = anchorSel ? document.querySelector(anchorSel) : null
    const area = filosArea()
    if (!el || !nodo || !area) { setPos(null); return }

    const rango = document.createRange()
    rango.selectNodeContents(nodo)
    const tinta = rango.getBoundingClientRect()

    // Corredor del humano. El wrapper de la primera carta existe siempre (los 5
    // slots se montan aunque estén vacíos), así que no hace falta suponer nada.
    const slot1 = document.querySelector('.player-zone .card-slot-wrapper')
    const corredor = slot1
      ? slot1.getBoundingClientRect().left - area.izq
      : area.der - area.izq
    const tope = Math.max(REACCION_MIN_W_PX, corredor - REACCION_GAP_PX)

    // Dos fases dentro del MISMO frame (useLayoutEffect corre antes de pintar):
    // se aplica el tope, se mide la caja resultante y recién entonces se coloca.
    el.style.maxWidth = `${tope}px`
    const caja = el.getBoundingClientRect()

    const centroTinta = tinta.left + tinta.width / 2
    const izq = Math.min(Math.max(centroTinta - caja.width / 2, area.izq), area.der - caja.width)

    setPos({
      left: izq,
      top: tinta.top - REACCION_PICO_PX - 2 - caja.height,
      maxW: tope,
      picoX: centroTinta - izq,
    })
  }, [id, anchorSel])

  if (!activa) return null

  return (
    <div
      ref={ref}
      className="u2-burbuja"
      role="status"
      style={{
        // La duración vive UNA sola vez, en config/reacciones.js; el keyframe
        // sólo reparte los tramos (ver su comentario en gameTable.css).
        '--u2-dur': `${REACCION_TOTAL_MS}ms`,
        '--u2-pico': `${REACCION_PICO_PX}px`,
        '--u2-pico-x': pos ? `${pos.picoX}px` : '50%',
        left: pos ? `${pos.left}px` : 0,
        top: pos ? `${pos.top}px` : 0,
        maxWidth: pos ? `${pos.maxW}px` : undefined,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <span className="u2-texto">{sinHuerfano(activa.frase)}</span>
      <button
        type="button"
        className="u2-cerrar"
        onClick={() => onCerrar(activa.id)}
        aria-label="Cerrar reacción"
        title="Cerrar"
      >
        ✕
      </button>
    </div>
  )
}
