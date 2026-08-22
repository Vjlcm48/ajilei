import { useState, useRef, useEffect, useCallback } from 'react'
import { CONSULTAS_KEY, CONSULTAS_GRATIS } from '../config/consultas'

// ── DSK-U1 · Estado y protocolo de cierre del menú de utilidades ─────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md (+ enmienda 2026-08-04).
// Vive aparte de los componentes porque el disparador y el panel se montan en
// dos sitios distintos del árbol: el ⋮ en la cabecera y el panel fuera del área,
// vecino de las cartas voladoras. Un solo estado, dos consumidores.

// Geometría del panel — números del ensayo de medición del diagnóstico U1
// (tipografía viva: 4 entradas, icono 18 + gap 10 + padding 12, font-size 14 →
// ancho natural 223,89 en el peor caso). El CSS los espeja en sus tokens.
// U1b · el panel pasa a SOLO-ICONO y se recompacta: 64px de ancho, medidos
// contra el contenido nuevo (icono centrado en una fila que conserva sus 44px
// de alto). Espeja --dsk-u1-panel-w del bloque DSK; el arnés contrasta los dos.
const PANEL_W = 64
const PANEL_GAP = 6   // aire entre el pie del disparador y el techo del panel

// ── MOV-1a · D4 · Pinza vertical del panel ───────────────────────────────────
// El alto del panel es CONSTANTE en las dos pieles (5 filas de 44 + filete 6 +
// padding 8+8 + bordes 1+1 = 244) y lo espejan `--dsk-u1-item-h` y
// `--dsk-u1-sep-gap` en ambas hojas. Aquí se declara porque el ancla se calcula
// ANTES de que el panel exista: no hay caja que medir todavía.
//
// POR QUÉ LA PINZA VIVE EN UNA CADENA CSS Y NO EN ARITMÉTICA DE JS.
// El área segura sólo se conoce desde CSS (`env(safe-area-inset-*)`); JS no
// puede leerla sin montar un nodo sonda, y `getPropertyValue` de una custom
// property devuelve el token sin resolver. Y la hoja no puede corregir un
// `top` en línea sin `!important`, que está prohibido. Emitiendo el `clamp()`
// COMO valor en línea, el cálculo lo hace el navegador: área segura incluida,
// cero `!important`, y una sola expresión para las dos pieles.
// En escritorio la pinza NO MUERDE por construcción —el panel abre a ~60px del
// techo con 460..582px libres por debajo (medida de U1)— y por eso esta tanda
// no toca su geometría; la celda 1920×1080 de la Fase 2 lo prueba en lugar de
// suponerlo. `clamp(a,b,c)` es `max(a, min(b,c))`: si el viewport bajara de
// 260px el panel quedaría clavado arriba y desbordaría, caso borde aceptado.
const PANEL_H = 244
const PANEL_MARGIN = 8   // aire mínimo a los filos del área segura

// ── MOV-1a-c · La rama de colocación es por ORIENTACIÓN, nunca por ancho ─────
// Espejo LITERAL de `LANDSCAPE_TABLE_MQ` (GameTable.jsx:66), que es la
// orientación horizontal DENTRO del complemento de `DESKTOP_TABLE_MQ`: el
// `max-height: 600px` es lo que deja fuera al escritorio, que también es
// landscape y no debe moverse un píxel. Se espeja en vez de importarse porque
// GameTable ya importa este hook y el ciclo sería peor que la copia; si alguien
// mueve aquel corte, este de aquí va con él.
const HORIZONTAL_MQ = '(orientation: landscape) and (max-height: 600px)'
// ── Los obstáculos que el panel esquiva en horizontal ───────────────────────
// D4.1 decía «a la izquierda de la columna de acción». MEDIDO, eso no basta:
// entre el abanico del humano y esa columna hay 6px a 640x360 (mano hasta 472,
// columna desde 478) y 38,8px a 812x375 — en ninguno de los dos cabe un panel
// de 64. Colocarlo ahí libra los botones y aterriza sobre las cartas, que es el
// otro invariante de la tanda y también es puerta.
// Se toma el filo IZQUIERDO más pequeño de los dos, así que el panel queda a la
// izquierda de la columna de acción *y* de la mano: la letra de D4.1 se cumple
// de sobra, y el invariante también. El corredor que queda —entre el
// temporizador (acaba en 60,8) y la primera carta— mide 85,2px a 640 y 118 a
// 812; el panel usa 64 y sobran 21,2 y 54.
// Se eligen CONTENEDORES y no los hijos (`.action-buttons`, `.card-slot-wrapper`)
// porque aquéllos existen en todas las fases y éstos sólo con turno vivo: un
// ancla que desaparece a media mano no es un ancla.
const OBSTACULOS_H = ['.action-area', '.player-zone .cards-row']
const TOP_MIN = `calc(${PANEL_MARGIN}px + env(safe-area-inset-top, 0px))`
// Tope inferior de cualquier superficie de esta familia: que su pie no pase del
// filo del área segura. Es función del alto porque cada satélite mide lo suyo.
const topeInferior = (alto) =>
  `calc(100dvh - ${alto + PANEL_MARGIN}px - env(safe-area-inset-bottom, 0px))`
const TOP_MAX = topeInferior(PANEL_H)

// ── MOV-1b-a · D6 · Satélites del ⋮ ──────────────────────────────────────────
// El aviso de "Mano actual" y el panel de Tapetes (y en MOV-1b-c el selector de
// Reacciones) no son el menú: son superficies que NACEN de él y lo relevan —la
// entrada cierra al ejecutar—, así que se anclan al DISPARADOR y no al panel,
// que para entonces ya se desmontó. Comparten una sola regla de colocación
// porque comparten el problema, y tenerla en tres sitios era pedir que se
// separaran.
//
// El TECHO se deriva de los filos VIVOS y no de una tabla por celda: es el
// borde superior de la fila de juego, o sea lo primero que un satélite no puede
// tapar. `.player-bar-right` entra por su nombre y no por `.player-bar` porque
// esa caja es `display: contents` en landscape móvil (gameTable.css:2950-2952)
// y mide 0×0 — mirarla directamente es no ver nada, que es como se coló el
// saldo tapado en MOV-1a-c.
const TECHOS_SATELITE = [
  '.timer-display', '.player-zone .cards-row', '.action-area', '.player-bar-right',
]

function techoFilaDeJuego() {
  let techo = Infinity
  for (const sel of TECHOS_SATELITE) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) continue   // ocultos y `display: contents`
      if (r.top < techo) techo = r.top
    }
  }
  return Number.isFinite(techo) ? techo : null
}

// `alto` admite un número o `{ v, h }` cuando la superficie mide distinto por
// orientación (el panel de Tapetes pasa a fila en horizontal). La orientación se
// resuelve AQUÍ para que ningún consumidor tenga que repetir la media query.
//
// Devuelve `right` como número y `top` como longitud CSS: la pinza se emite como
// `clamp()` en línea por la misma razón que la del panel —el área segura sólo se
// conoce desde CSS y una hoja no corrige un valor en línea sin `!important`—.
export function anclaSatelite(rect, alto) {
  const horizontal = window.matchMedia(HORIZONTAL_MQ).matches
  const h = typeof alto === 'number' ? alto : (horizontal ? alto.h : alto.v)
  if (!rect) return { right: PANEL_MARGIN, top: TOP_MIN }
  // Vertical: nace bajo el disparador, como en escritorio. Horizontal: a su
  // izquierda y pegado al techo, porque debajo del ⋮ no hay banda libre —en
  // mesas 5 y 4 vive a media altura, sobre la fila de juego.
  const right = horizontal
    ? window.innerWidth - (rect.left - PANEL_GAP)
    : window.innerWidth - rect.right
  const nominal = horizontal ? PANEL_MARGIN : rect.bottom + PANEL_GAP
  const techo = techoFilaDeJuego()
  const tope = techo == null
    ? topeInferior(h)
    : `min(calc(${techo - h}px - env(safe-area-inset-bottom, 0px)), ${topeInferior(h)})`
  return { right, top: `clamp(${TOP_MIN}, ${nominal}px, ${tope})` }
}

// Altos MÁXIMOS de cada satélite. Se declaran porque el ancla se calcula ANTES
// de que la superficie exista: no hay caja que medir todavía. Se usa el peor
// caso a propósito —`top ≤ techo − altoMáx` garantiza que el pie quepa aunque
// el contenido sea más corto—, y el arnés contrasta cada uno contra su caja viva.
//   · Aviso de "Mano actual": 104,42 medido en las 16 celdas (desglose completo
//     de los cuatro palos + nota del comodín + saldo). La variante "agotadas"
//     mide 59,73 y le sobra sitio.
//   · Tapetes: 270,98 en rejilla 3×2 (vertical) y 161,59 en la fila de cinco
//     del horizontal. Los dos MEDIDOS sobre el panel vivo, no estimados: el
//     cálculo a mano daba 153 para la fila y se quedaba 8,59 corto, que es
//     exactamente el error que un techo derivado no perdona.
//   · Selector de reacciones: 186 EXACTO en las dos orientaciones, y es el
//     único de los tres que no depende del contenido — la lista muestra cuatro
//     filas de 44 con separación 2 y relleno 2 (4·44 + 3·2 + 2·2 = 186) y las
//     otras ocho se alcanzan desplazando. Un alto sellado es también la única
//     forma de que el techo derivado no cambie con la longitud de las frases,
//     que son copy declarado provisional.
export const ALTO_AVISO_MANO = 105
export const ALTO_TAPETES = { v: 271, h: 162 }
export const ALTO_SELECTOR_REACCIONES = 186

// ── Contador de consultas de "Mano actual" (v1.1 §3.4 y §3.6) ───────────────
// Infraestructura, no lógica: la clave se crea con las 20 gratis y se lee para
// pintar el badge. El CONSUMO llega en su propio ciclo — aquí nadie decrementa.
// Contador GLOBAL único (acumulable entre escenarios, mesas y dificultades), en
// localStorage mientras no haya login; con login migra al ledger de Supabase.
// Se inicializa al montar el panel, no al arrancar la app: es el primer momento
// en que la función existe, y así móvil —donde el menú no se monta— no estrena
// una clave que nunca va a leer.
// DSK-U3 · la clave y las 20 gratis se mudan a config/consultas.js: el arnés
// necesita leerlas de la MISMA fuente que la app para sembrar el saldo y para
// derivar sus expectativas (molde de config/reacciones.js en U2).

export function readConsultas() {
  try {
    const raw = window.localStorage.getItem(CONSULTAS_KEY)
    const n = Number(raw)
    if (raw !== null && Number.isInteger(n) && n >= 0) return n
    window.localStorage.setItem(CONSULTAS_KEY, String(CONSULTAS_GRATIS))
    return CONSULTAS_GRATIS
  } catch {
    return CONSULTAS_GRATIS   // storage denegado: la cifra se muestra igual
  }
}

// DSK-U3 · el consumo ya vive (useConsultas). Se escribe SÓLO al cobrar, nunca
// al leer: si el storage está denegado la sesión sigue contando en memoria y la
// cifra mostrada no miente — simplemente no sobrevive al cierre del navegador.
export function writeConsultas(n) {
  try {
    window.localStorage.setItem(CONSULTAS_KEY, String(n))
  } catch { /* storage denegado: el contador vive sólo en memoria */ }
}

// `enabled` es el gate de escritorio: si el viewport deja de cumplirlo, el menú
// deja de estar abierto — el disparador desaparece y un panel huérfano no debe
// sobrevivirle.
export function useUtilitiesMenu(enabled = true) {
  const [stored, setAnchor] = useState(null)   // null = cerrado
  const triggerRef = useRef(null)
  // El gate se DERIVA, no se sincroniza con un efecto: fuera de escritorio el
  // menú simplemente no está abierto, y con él se van sus listeners y su ancla.
  const open = enabled && stored !== null
  const anchor = open ? stored : null

  // Ref de callback en vez de exponer el objeto ref: lo que sale del hook es una
  // función estable, así que ningún consumidor toca un ref durante el render.
  const registerTrigger = useCallback((node) => { triggerRef.current = node }, [])

  const close = useCallback(() => setAnchor(null), [])

  // DSK-U2 · El selector de reacciones se ancla al MISMO ⋮ que el panel, pero
  // se monta cuando el panel ya se ha cerrado (la entrada 💬 cierra al ejecutar,
  // como sus hermanas). Se expone la medida, no el ref: quien la pide la llama
  // desde un manejador de evento, nunca durante el render.
  const triggerRect = useCallback(() => {
    const el = triggerRef.current
    return el ? el.getBoundingClientRect() : null
  }, [])

  // Se mide al abrir, no al renderizar: el disparador vive en flujo y su x
  // depende del ancho del área (cinco valores según mesa y viewport). Apertura
  // ABAJO-DERECHA alineada al filo derecho del ⋮ — decisión sellada: junto con
  // izq-arriba es la única que cabe en las 20 celdas, y la que menos toca las
  // cartas de los rivales.
  const toggle = useCallback(() => {
    setAnchor(prev => {
      if (prev) return null
      const el = triggerRef.current
      if (!el) return null
      const r = el.getBoundingClientRect()
      // `left` sigue siendo un número; `top` sale ya como longitud CSS con la
      // pinza dentro — ver la nota de arriba.
      const pinza = (px) => `clamp(${TOP_MIN}, ${px}px, ${TOP_MAX})`

      // MOV-1a-c · D4.1 · en MÓVIL HORIZONTAL el panel no cuelga del
      // disparador: se aparta a la izquierda de la columna de acción. Abajo no
      // hay sitio y arriba faltan 41..53px, así que la única colocación que
      // deja los controles del turno libres es ésta. Alineado por ARRIBA al
      // disparador (no por abajo: en mesas 5 y 4 el disparador vive a media
      // altura y colgarlo lo hundía en la fila de cartas).
      if (window.matchMedia(HORIZONTAL_MQ).matches) {
        // Se miden los obstáculos VIVOS en vez de cablear sus anchos: los 150px
        // de la columna y los márgenes viven en gameTable.css, que es protegido,
        // y una copia aquí envejecería en silencio la próxima vez que se muevan.
        const filos = OBSTACULOS_H
          .map(sel => document.querySelector(sel))
          .filter(Boolean)
          .map(el => el.getBoundingClientRect().left)
        if (filos.length) {
          const izq = Math.min(...filos) - PANEL_GAP - PANEL_W
          // El techo, y no el filo del disparador. D4.1 pedía alinearlo con el
          // disparador, pero el corredor libre no da para eso: el bloque de
          // saldo del humano (`.player-bar-right`) arranca en y 253,7 a
          // 360 de alto, y un panel de 244 sólo cabe por encima si empieza
          // arriba del todo. Colgarlo del disparador lo hundía 4,3px dentro del
          // saldo en mesas 3 y 2. Es el mismo `clamp()` de siempre —área segura
          // incluida—, sólo que su tope inferior manda siempre.
          return { left: Math.max(izq, PANEL_MARGIN), top: pinza(PANEL_MARGIN) }
        }
        // Sin obstáculos (GAME_OVER y pantallas terminales) no hay nada que
        // esquivar: vale la colocación de siempre.
      }
      return { left: r.right - PANEL_W, top: pinza(r.bottom + PANEL_GAP) }
    })
  }, [])

  // Cierre por clic fuera y por Esc. El listener de puntero es NO BLOQUEANTE
  // (molde del toggle de ficha H4 en GameTable: nada de overlay). Un overlay se
  // tragaría el primer clic sobre los botones de acción, y este menú vive
  // DURANTE la mano, no en un modal: el clic fuera cierra Y su acción procede.
  // Esc es terreno virgen — a HEAD 7ef28c9 no había un solo keydown en src/.
  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      // el propio disparador lo resuelve su onClick (toggle); dentro del panel,
      // cada entrada decide (los toggles cierran al ejecutar).
      // U1b · el popup del contador entra en la lista por el invariante sellado:
      // presionar el badge —o el propio popup— no cierra el menú. El badge ya
      // está cubierto por vivir dentro del panel; el popup no, porque se monta
      // fuera de él (es flotante), así que hay que nombrarlo.
      if (e.target.closest && e.target.closest('.utilities-trigger, .utilities-panel, .utilities-popup')) return
      close()
    }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', onDocDown, true)
    document.addEventListener('keydown', onKey, true)
    // el ancla se midió una vez: si la ventana cambia de tamaño deja de ser
    // válida, y un panel mal anclado es peor que un panel cerrado
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDocDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  return { open, anchor, toggle, close, registerTrigger, triggerRect }
}
