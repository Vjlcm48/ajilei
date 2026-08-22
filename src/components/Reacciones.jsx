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
      // `top` llega YA en unidades desde el hook (px en escritorio, `clamp()`
      // con `env()` en el móvil de D6): aquí no se le añade sufijo.
      style={{ right: `${anchor.right}px`, top: anchor.top }}
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

// Caja de un elemento SÓLO si está pintada: `display: contents` y los ocultos
// devuelven 0×0, y una caja de cero es una medida que miente.
function filoDe(sel) {
  const e = document.querySelector(sel)
  const b = e && e.getBoundingClientRect()
  return b && b.width > 0 && b.height > 0 ? b : null
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
    abajo: r.bottom - parseFloat(cs.borderBottomWidth),
  }
}

// La rama VERTICAL del móvil (MOV-1b-c, opción E de Victor). No es una variante
// estética: encima de la tinta del nombre NO HAY SITIO y está medido —los
// botones del turno ocupan la banda entera justo encima, y los 44px que quedan
// entre el pie de los botones y la tinta son las propias pastillas Mano/Pie del
// jugador, que en vertical van ENCIMA del nombre—. La burbuja mínima (91,56×81)
// se comía 5 646 px² de la guardia en las ocho celdas verticales.
// El sitio que sí existe es la banda libre de la propia fila, entre el bloque
// del nombre y el del saldo: 174,34×64,38 a 375×812 y 159,34×64,38 a 360×640.
// Ahí la burbuja pasa a DOS COLUMNAS (emoji a la izquierda, texto a la derecha)
// y el pico sale por el costado izquierdo, a la altura de la tinta.
const VERTICAL_MQ = '(orientation: portrait)'
// El aire de la burbuja a los dos filos de la banda. Baja de los 6 de
// `REACCION_GAP_PX` a 4 por la regla explícita de Victor —"si a 360×640 alguna
// frase rompe la holgura, baja el relleno de 6 a 4"—, y rompía: a 6 la banda
// más estrecha daba 139,34 de tope y cuatro frases se iban a cuatro renglones.
// La constante compartida no se toca: es la del corredor de escritorio.
const AIRE_VERTICAL = 4

// La rama HORIZONTAL del móvil. NO estaba prevista —la comprobación previa de
// esta tanda dio 0 px² aquí y por eso el encargo decía "horizontal no cambia"—,
// y la midió mal: `.timer-display` sólo existe MIENTRAS CORRE EL RELOJ DEL
// TURNO, así que la sonda, que medía en una fase sin cuenta atrás, fotografió
// un corredor que no existe cuando el jugador puede reaccionar.
// Con el temporizador vivo, encima de la tinta del nombre quedan 10,41px
// (temporizador 12..60,81 × 198,91..222,11; tinta a y 232,52), y la burbuja más
// corta mide 76. Cualquier colocación encima choca; a los lados tampoco hay
// banda: el raíl del humano apila temporizador, nombre y saldo en 80px de ancho
// y entre el saldo y las cartas quedan 37.
// Así que en horizontal la burbuja se comporta como sus tres hermanas y cuelga
// del ⋮ con la regla D6 —6px a su izquierda, pegada al techo derivado—, sin
// pico: un pico que no alcanza la tinta señalaría a otra cosa, y eso es peor
// que no tenerlo. Queda REPORTADO para que Victor decida si se queda así.
const HORIZONTAL_MQ = '(orientation: landscape) and (max-height: 600px)'
// Los mismos filos vivos que `techoFilaDeJuego` (useUtilitiesMenu.js). No se
// importan: aquélla es una función privada del hook del menú y duplicar cuatro
// selectores es más barato que abrir una dependencia entre dos módulos que no
// se conocen. Si se mueve uno, se mueve el otro — queda dicho.
const TECHOS_H = ['.timer-display', '.player-zone .cards-row', '.action-area', '.player-bar-right']
const MARGEN_H = 8

// La caja REAL, sin la escala de la animación de entrada. `u2Burbuja` arranca en
// `scale(0.94)` y `getBoundingClientRect` devuelve la caja TRANSFORMADA, así que
// medir al montar da el 94% —81 se lee 76,14— y las cuentas de colocación salen
// 4,86px cortas. Se apaga la animación, se mide y se devuelve: esto corre dentro
// de un `useLayoutEffect`, o sea ANTES de pintar, así que el ciclo empieza donde
// siempre y el jugador no ve nada distinto.
// Sólo lo usan las dos ramas móviles. La rama sellada de escritorio sigue
// midiendo como siempre —con la escala puesta— porque cambiarlo la movería
// 4,86px hacia arriba, y esta tanda no toca escritorio. Queda REPORTADO: ese
// desfase existe allí desde U2c y no es de aquí.
function cajaSinEntrada(el) {
  const previo = el.style.animation
  el.style.animation = 'none'
  const caja = el.getBoundingClientRect()
  el.style.animation = previo
  return caja
}

// Colocación como SATÉLITE del ⋮ (D6), la misma de sus tres hermanas. La usan
// dos caminos: el horizontal, donde es la única posible, y el RESPALDO del
// vertical, cuando la frase no cabe en la banda del jugador. Sin pico: cuelga
// del menú, no del nombre.
function anclaDelDisparador(el, area) {
  const disp = filoDe('.utilities-trigger')
  if (!disp) return null
  const horizontal = window.matchMedia(HORIZONTAL_MQ).matches
  const borde = horizontal ? disp.left - REACCION_GAP_PX : disp.right
  const tope = Math.max(REACCION_MIN_W_PX, borde - area.izq - MARGEN_H)
  el.style.maxWidth = `${tope}px`
  const caja = cajaSinEntrada(el)
  let techo = Infinity
  for (const sel of TECHOS_H) {
    for (const e of document.querySelectorAll(sel)) {
      const b = e.getBoundingClientRect()
      if (b.width <= 0 || b.height <= 0) continue
      if (b.top < techo) techo = b.top
    }
  }
  const tapa = Number.isFinite(techo) ? techo - caja.height : Infinity
  const nominal = horizontal ? MARGEN_H : disp.bottom + REACCION_GAP_PX
  return {
    left: Math.max(borde - caja.width, MARGEN_H),
    top: Math.max(MARGEN_H, Math.min(nominal, tapa)),
    maxW: tope, picoX: null, picoY: null, satelite: true,
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

    // ── Rama VERTICAL del móvil · opción E ────────────────────────────────
    // Los tres filos que definen la banda se miden VIVOS. `.player-bar-center`
    // es la caja de los botones del turno (misma caja que `.action-area`) y da
    // el techo hasta el que Victor autorizó subir; `.player-bar-left` da la
    // fila y el filo por el que sale el pico; `.player-bar-right` (el saldo)
    // cierra la banda por la derecha.
    if (window.matchMedia(VERTICAL_MQ).matches) {
      const barL = filoDe('.player-bar-left')
      const barR = filoDe('.player-bar-right')
      const botones = filoDe('.player-bar-center')
      if (barL && barR && botones) {
        const izq = barL.right + REACCION_PICO_PX + AIRE_VERTICAL
        // SIN el suelo de `REACCION_MIN_W_PX`, y no es un olvido. Ese suelo
        // protege el corredor de escritorio, donde estrechar de más haría la
        // burbuja ilegible; aquí el límite es una CAJA DE LA GUARDIA, y un
        // suelo que la ignora la invade: con la mano repartida el bloque del
        // nombre crece con sus pastillas y la banda baja a 119,92 — 0,08 por
        // debajo de los 120 del suelo—, y la burbuja se metía 4,08px en el
        // saldo. Un mínimo no puede ganarle a un filo intocable.
        const tope = Math.max(0, barR.left - AIRE_VERTICAL - izq)
        el.style.maxWidth = `${tope}px`
        const caja = cajaSinEntrada(el)
        // Centrada en la fila. Cuando el contenido no cabe en los 64,38 de la
        // fila, sube hasta el pie de los botones —el permiso de Victor— y lo
        // que aún sobre lo da hacia ABAJO, contra el margen muerto del área:
        // ahí no hay una sola caja de la guardia, y bajar es lo único que no
        // toca ni botones ni saldo ni el propio nombre.
        // EL TECHO MANDA SIEMPRE, y el orden de las pinzas lo dice: el pie de
        // los botones es guardia y el filo inferior del área es sólo estética.
        // Al revés, la pinza de abajo empujaba el techo 0,375px arriba en la
        // celda más apretada y se comía 55,25 px² de los botones — un rojo por
        // un tercio de píxel, que es exactamente el error que un orden de
        // pinzas mal escrito produce.
        const centrado = barL.top + (barL.height - caja.height) / 2
        const sube = Math.max(botones.bottom, Math.min(centrado, barL.bottom - caja.height))
        const top = Math.max(botones.bottom, Math.min(sube, area.abajo - caja.height))
        // El pico apunta a la MITAD de la tinta, y se queda dentro del cuerpo:
        // un triángulo colgando del filo no señala nada.
        // ¿CABE ENTERA? La banda no da para las doce frases y hay que decirlo
        // con números: con la mano repartida, las pastillas Mano/Pie/Turno
        // ensanchan el bloque del nombre y la banda cae de 159,34 a 131,92 a
        // 360×640, así que a la columna de texto le quedan ~50px y las frases
        // largas se van a seis renglones — 106,94 de alto contra los 88,37 que
        // hay del pie de los botones al filo del área. Se salían de la pantalla.
        // Cuando no cabe, la burbuja NO se recorta ni se sale: cuelga del ⋮ como
        // en horizontal. Es una degradación medida y declarada, no un apaño; el
        // arnés manda la frase más larga a propósito para que se vea siempre.
        const cabe = top >= botones.bottom - 0.01 && top + caja.height <= area.abajo + 0.01
        if (cabe) {
          const picoY = Math.min(
            Math.max(tinta.top + tinta.height / 2 - top, REACCION_PICO_PX + 2),
            caja.height - REACCION_PICO_PX - 2,
          )
          setPos({ left: izq, top, maxW: tope, picoX: 0, picoY, satelite: false })
          return
        }
        const ancla = anclaDelDisparador(el, area)
        if (ancla) { setPos(ancla); return }
      }
    }

    // ── Rama HORIZONTAL del móvil · satélite del ⋮ ────────────────────────
    if (window.matchMedia(HORIZONTAL_MQ).matches) {
      const ancla = anclaDelDisparador(el, area)
      if (ancla) { setPos(ancla); return }
    }

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
      // El pico se queda DENTRO del cuerpo, igual que en la rama vertical.
      // No es una pinza de adorno: cuando el cuerpo se topa con el filo
      // izquierdo del área —lo que pasa en las cuatro celdas horizontales del
      // móvil, donde el nombre vive pegado a ese filo— el centro de la tinta
      // cae FUERA de la burbuja y el triángulo se pintaba a −2,09px de su
      // borde, colgando en el aire. En escritorio nunca se activa: allí el
      // nombre está lejos del filo y el pico ya cae dentro (Δ=0 medido).
      picoX: Math.min(
        Math.max(centroTinta - izq, REACCION_PICO_PX + 2),
        caja.width - REACCION_PICO_PX - 2,
      ),
      picoY: null,
      satelite: false,
    })
  }, [id, anchorSel])

  if (!activa) return null

  return (
    <div
      ref={ref}
      className="u2-burbuja"
      role="status"
      // De qué cuelga la burbuja, para que el CSS sepa si hay pico que pintar.
      // Es DATO y no estilo: la decisión la toma la medida, no la media query.
      data-ancla={pos && pos.satelite ? 'satelite' : 'tinta'}
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
        '--u2-pico-x': pos && pos.picoX != null ? `${pos.picoX}px` : '50%',
        // Sólo la rama vertical del móvil lo usa; en las demás queda declarado
        // y sin consumidor, que es más barato que una segunda rama de render.
        '--u2-pico-y': pos && pos.picoY != null ? `${pos.picoY}px` : '50%',
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
