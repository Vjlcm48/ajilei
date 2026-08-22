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
const TOP_MIN = `calc(${PANEL_MARGIN}px + env(safe-area-inset-top, 0px))`
const TOP_MAX = `calc(100dvh - ${PANEL_H + PANEL_MARGIN}px - env(safe-area-inset-bottom, 0px))`

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
      // `left` sigue siendo un número (nunca ha necesitado pinza: el mínimo
      // medido en las 16 celdas móviles es 236,4px). `top` sale ya como
      // longitud CSS — ver la nota de la pinza arriba.
      return {
        left: r.right - PANEL_W,
        top: `clamp(${TOP_MIN}, ${r.bottom + PANEL_GAP}px, ${TOP_MAX})`,
      }
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
