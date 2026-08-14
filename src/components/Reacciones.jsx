import { useState, useRef, useLayoutEffect } from 'react'
import {
  REACCIONES,
  REACCION_TOTAL_MS,
  REACCION_PICO_PX,
  REACCION_GAP_PX,
  REACCION_MIN_W_PX,
  textoDe,
  rutaEmoji,
} from '../config/reacciones'

// ── DSK-U2 · Selector de reacciones y burbuja ────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.4.md §2, §4 y §5.
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
          // La frase SELLADA COMPLETA, emoji incluido, vive en el nombre
          // accesible. Es lo que oye un lector de pantalla y lo que lee el
          // arnés: `textContent` ya no la contiene entera, porque el emoji
          // dejó de ser texto (v1.4 §5.3).
          aria-label={frase}
          disabled={bloqueado}
          onClick={() => onElegir(frase)}
        >
          {textoDe(frase)}
          {/* Glifo de Noto, ESTÁTICO en el selector: doce bucles en una
              rejilla 3×4 son ruido, y el peso de doce animados no se paga por
              una superficie que se lee de un vistazo (v1.4 §4). */}
          <img className="u2-glifo" src={rutaEmoji(frase, 'svg')} alt="" />
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
// ── DSK-U2c · el emoji tiene piso propio ─────────────────────────────────────
// Aquí vivía `sinHuerfano`, que soldaba el emoji al último término con un
// espacio duro para que no quedara solo al envolver. La v1.4 §1.1 lo ARCHIVA
// con contabilidad: aquel remedio hacía del par `término + emoji` un bloque
// INDIVISIBLE, y ese bloque fijaba el techo de tamaño del emoji en 17,03px
// medidos en la celda más estrecha — ilegible para cualquier animación.
// Sin soldadura no hay huérfano posible: el emoji ya no comparte renglón, y el
// texto envuelve MEJOR que antes: el bloque indivisible más ancho de una frase
// vuelve a ser una palabra normal.

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
      // La frase SELLADA COMPLETA, emoji incluido. El texto pintado ya no la
      // contiene entera —el emoji dejó de ser texto—, así que aquí es donde
      // viven el anuncio del lector de pantalla y la lectura del arnés
      // (v1.4 §5.3). El `alt=""` de la imagen es deliberado: repetirlo la
      // anunciaría dos veces.
      aria-label={activa.frase}
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
      {/* Piso 1 · la frase, texto puro */}
      <span className="u2-texto">{textoDe(activa.frase)}</span>
      <button
        type="button"
        className="u2-cerrar"
        onClick={() => onCerrar(activa.id)}
        aria-label="Cerrar reacción"
        title="Cerrar"
      >
        ✕
      </button>
      {/* Piso 2 · el emoji, centrado y vivo.
          EL INTERCAMBIO SE ESCRIBE. Un WebP/AVIF/GIF animado IGNORA
          `prefers-reduced-motion` —medido: 9 de 10 cuadros distintos con la
          preferencia puesta—, porque la media query es una CONSULTA y no un
          comportamiento. Sin este <source> no habría forma de respetarla
          (v1.4 §5.1).
          La caja va en el CSS y es innegociable: el `top` de la burbuja se
          calcula UNA sola vez, arriba, al montar. Un <img> sin caja mide 0
          antes de decodificar y 512 después — +515,38px de estirón medidos
          sobre el nombre (v1.4 §5.2). */}
      <picture className="u2-emoji">
        <source media="(prefers-reduced-motion: reduce)" srcSet={rutaEmoji(activa.frase, 'svg')} />
        <img src={rutaEmoji(activa.frase, 'avif')} alt="" />
      </picture>
    </div>
  )
}
