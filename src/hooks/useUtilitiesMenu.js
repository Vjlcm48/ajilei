import { useState, useRef, useEffect, useCallback } from 'react'
import { aPropios, escalaActual } from '../lib/escala'
import { altoPanel } from '../config/menuEntradas'

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
// El alto del panel es CONSTANTE en las dos pieles y lo espejan `--dsk-u1-item-h`
// y `--dsk-u1-sep-gap` en ambas hojas. Aquí se declara porque el ancla se calcula
// ANTES de que el panel exista: no hay caja que medir todavía.
//
// SUP-2b · la cuenta pasó de 5 filas a 6 con la entrada "Cuenta" (288).
// CFG-1 1e · salen "Cuenta" y "Saldo" y entra "Partida rápida", que sólo monta
// contra las IAS (`presentesDe`, config/menuEntradas.js). El alto es función de
// las filas que montan:
//   filas × 44 + 6 (filete que separa "Mano actual") + 8 + 8 (relleno)
//   + 1 + 1 (bordes)  →  5 filas = 244 · 4 filas = 200
// Ninguna de las dos hojas declara este alto —sólo el ancho—, así que las filas
// se pintan solas y `gameTable.css`, que es protegido, no se abre. Lo único que
// hay que mover es este espejo, porque de él sale la pinza vertical: con un alto
// de menos el pie del panel se metería en la fila de juego.
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
// La fórmula vive en config/menuEntradas.js (`altoPanel`), junto a las filas:
// así el arnés la importa con `node` sin pasar por React.

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
const topeInferior = (alto, f = 1) => (f === 1
  ? `calc(100dvh - ${alto + PANEL_MARGIN}px - env(safe-area-inset-bottom, 0px))`
  : `calc(100dvh / ${f} - ${alto + PANEL_MARGIN}px - env(safe-area-inset-bottom, 0px) / ${f})`)
// TAB-1 · Bajo la escala de la mesa (`zoom` en #root, src/lib/escala.js) el
// panel y sus satélites son `fixed` DENTRO del árbol ampliado: lo que escriben
// se vuelve a ampliar. Por eso las cajas medidas pasan a px propios al medir
// (`aPropios`) y la ventana y el área segura —visuales— se dividen por el
// factor dentro de la pinza. Con f = 1 (el celular) las cadenas son las de
// siempre, carácter a carácter.
const topMin = (f = 1) => (f === 1
  ? TOP_MIN
  : `calc(${PANEL_MARGIN}px + env(safe-area-inset-top, 0px) / ${f})`)

// ── SUP-2b · El alto en MÓVIL HORIZONTAL era OTRO ──────────────────────
// Allí el panel medía 244 y no 288, porque "Cuenta" no montaba en esa piel: el
// corredor izquierdo sólo deja 245,72px libres en la celda peor (640×360)
// antes del bloque de saldo del humano. CFG-1 1e · con "Cuenta" fuera el alto es
// el mismo en todas las pieles (`altoPanel(filas)`), y cinco filas siguen
// cabiendo en ese corredor.

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

function techoFilaDeJuego(f = 1) {
  let techo = Infinity
  for (const sel of TECHOS_SATELITE) {
    for (const el of document.querySelectorAll(sel)) {
      const r = aPropios(el.getBoundingClientRect(), f)
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
export function anclaSatelite(rectVisual, alto) {
  const horizontal = window.matchMedia(HORIZONTAL_MQ).matches
  const h = typeof alto === 'number' ? alto : (horizontal ? alto.h : alto.v)
  const f = escalaActual()
  if (!rectVisual) return { right: PANEL_MARGIN, top: topMin(f) }
  const rect = aPropios(rectVisual, f)
  const anchoVentana = window.innerWidth / f
  // Vertical: nace bajo el disparador, como en escritorio. Horizontal: a su
  // izquierda y pegado al techo, porque debajo del ⋮ no hay banda libre —en
  // mesas 5 y 4 vive a media altura, sobre la fila de juego.
  const right = horizontal
    ? anchoVentana - (rect.left - PANEL_GAP)
    : anchoVentana - rect.right
  const nominal = horizontal ? PANEL_MARGIN : rect.bottom + PANEL_GAP
  const techo = techoFilaDeJuego(f)
  const seguraAbajo = f === 1 ? 'env(safe-area-inset-bottom, 0px)' : `env(safe-area-inset-bottom, 0px) / ${f}`
  const tope = techo == null
    ? topeInferior(h, f)
    : `min(calc(${techo - h}px - ${seguraAbajo}), ${topeInferior(h, f)})`
  return { right, top: `clamp(${topMin(f)}, ${nominal}px, ${tope})` }
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
//   · Panel de Cuenta (SUP-2b): 220, MEDIDO sobre la caja viva y no calculado
//     —el cálculo a mano daba 190 y se quedaba 29,92 corto, que es justo el
//     error que un techo derivado no perdona (misma lección que la fila de
//     Tapetes)—. El peor caso es el de ESCRITORIO, 219,92; en móvil horizontal
//     mide 196,94 porque el aviso de la mano cabe en un renglón menos. Su
//     contenido es fijo salvo el propio nombre, y el nombre no puede pasar de 15
//     caracteres (CHECK de SUP-2a), así que no hay peor caso que no esté dentro.
//     CFG-1 1e · el panel de Cuenta sale con su entrada: su alto se retira.
export const ALTO_AVISO_MANO = 105
export const ALTO_TAPETES = { v: 271, h: 162 }
export const ALTO_SELECTOR_REACCIONES = 186

// ── Contador de consultas de "Mano actual" ──────────────────────────────────
// Vivía aquí, en `localStorage` (`ajilei.consultas`), desde U1. CFG-1 1e lo
// muda al servidor (`consultar_mano`, INV-75): la clave del aparato se retira y
// el contador llega a `useConsultas` por `mi_consulta()`.

// `enabled` es el gate de escritorio: si el viewport deja de cumplirlo, el menú
// deja de estar abierto — el disparador desaparece y un panel huérfano no debe
// sobrevivirle.
// CFG-1 1e · `filas` es lo que monta el panel (`filasDelPanel`): de ahí sale su
// alto, y con él la pinza.
export function useUtilitiesMenu(enabled = true, filas = 5) {
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
      const f = escalaActual()
      const r = aPropios(el.getBoundingClientRect(), f)
      // `left` sigue siendo un número; `top` sale ya como longitud CSS con la
      // pinza dentro — ver la nota de arriba.
      const alto = altoPanel(filas)
      const pinza = (px, tope = topeInferior(alto, f)) => `clamp(${topMin(f)}, ${px}px, ${tope})`

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
          .map(el => aPropios(el.getBoundingClientRect(), f).left)
        if (filos.length) {
          const izq = Math.min(...filos) - PANEL_GAP - PANEL_W
          // El techo, y no el filo del disparador. D4.1 pedía alinearlo con el
          // disparador, pero el corredor libre no da para eso: el bloque de
          // saldo del humano (`.player-bar-right`) arranca en y 253,7 a
          // 360 de alto, y un panel de 244 sólo cabía por encima si empezaba
          // arriba del todo. Colgarlo del disparador lo hundía 4,3px dentro del
          // saldo en mesas 3 y 2. Es el mismo `clamp()` de siempre —área segura
          // incluida—, sólo que su tope inferior manda siempre.
          //
          // SUP-2b · la nota sigue valiendo TAL CUAL, y la medición de esta
          // tanda la confirmó: el bloque de saldo va de x 12 a 92,77, o sea que
          // invade el corredor donde vive el panel, y con seis filas éste le
          // habría tapado 514,17px² a 812×375 y 709,04 a 640×360. Por eso en
          // esta piel "Cuenta" no montaba y el panel se quedaba en 244. Desde
          // CFG-1 1e "Cuenta" ya no existe y el alto es el de todas las pieles.
          return { left: Math.max(izq, PANEL_MARGIN), top: pinza(PANEL_MARGIN) }
        }
        // Sin obstáculos (GAME_OVER y pantallas terminales) no hay nada que
        // esquivar: vale la colocación de siempre.
      }
      return { left: r.right - PANEL_W, top: pinza(r.bottom + PANEL_GAP) }
    })
  }, [filas])

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
