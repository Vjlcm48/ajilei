import { useState, useRef, useEffect, useCallback } from 'react'
import { REACCION_TOTAL_MS, REACCION_COOLDOWN_MS, REACCION_GAP_PX } from '../config/reacciones'

// ── DSK-U2 · Estado del circuito de reacciones ───────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.2.md §3 y §4.
//
// Vive aparte por la MISMA razón que useUtilitiesMenu: hay dos consumidores en
// dos sitios distintos del árbol. La entrada 💬 abre el selector desde dentro
// del panel de utilidades; la burbuja se monta como hermana del área, junto a
// las cartas voladoras. Un solo estado, dos consumidores.
//
// Tres piezas de estado y ninguna más:
//   · selector  → null = cerrado; {right, top} = abierto y anclado al ⋮
//   · activa    → null = sin burbuja; {id, frase} = burbuja viva
//   · enfriando → cooldown corriendo (independiente de la burbuja)
//
// `bloqueado` es la unión: mientras hay burbuja NO se envía (una a la vez), y
// tras enviar tampoco durante el cooldown. Como el cooldown (5s) es más largo
// que el ciclo de la burbuja (3s), en la práctica manda él — pero las dos
// guardas se declaran por separado porque dicen cosas distintas y la constante
// del cooldown es ajustable.

export function useReacciones(enabled = true) {
  const [selector,  setSelector]  = useState(null)
  const [activa,    setActiva]    = useState(null)
  const [enfriando, setEnfriando] = useState(false)

  // {id, timer} de la burbuja viva — la guardia de id del molde `potFloat`
  // (GameTable.jsx:296-305): un temporizador viejo jamás mata una burbuja nueva.
  const burbujaRef = useRef(null)
  const coolRef    = useRef(null)
  const seqRef     = useRef(0)

  // ── DSK-U2c · veto externo (v1.4 §7) ──────────────────────────────────────
  // La celebración manda el lenguaje de movimiento: con una viva, no se envía.
  // El veto vive EN UN REF Y NO EN ESTADO a propósito. `useCelebracion` se
  // declara MÁS ABAJO en GameTable y el orden de los hooks de ese archivo es
  // portante (Victory_Celebration §3.0), así que el dato no puede llegar como
  // argumento sin reordenarlos. Un ref propio lo resuelve sin mover nada: se
  // escribe desde un efecto —jamás durante el render— y se lee en `enviar`,
  // que es un manejador. Y siendo del hook, el compilador lo reconoce como ref
  // y no lo pide en las dependencias.
  // La cara VISIBLE del bloqueo viaja aparte, por prop, porque un ref no
  // repinta: `bloqueado` sigue diciendo lo suyo y GameTable une los dos.
  const vetoRef = useRef(false)
  const vetar = useCallback((v) => { vetoRef.current = !!v }, [])

  // El gate de escritorio se DERIVA, no se sincroniza: fuera de él el selector
  // simplemente no está abierto y se lleva sus listeners consigo (molde U1).
  const abierto = enabled && selector !== null
  const bloqueado = activa !== null || enfriando

  useEffect(() => () => {
    if (burbujaRef.current) clearTimeout(burbujaRef.current.timer)
    clearTimeout(coolRef.current)
  }, [])

  const cerrarSelector = useCallback(() => setSelector(null), [])

  // Anclado por su borde DERECHO al filo derecho del ⋮ (molde del popup del
  // contador): así el ancho puede crecer con la rejilla sin recalcular nada.
  const abrirSelector = useCallback((rect) => {
    if (!rect) return
    setSelector({ right: window.innerWidth - rect.right, top: rect.bottom + REACCION_GAP_PX })
  }, [])

  // Guarda real del candado. El selector ya deshabilita sus entradas, pero el
  // envío se protege también aquí: la UI puede fallar, la regla no.
  const enviar = useCallback((frase) => {
    if (bloqueado || vetoRef.current) return

    const id = ++seqRef.current
    setSelector(null)
    setActiva({ id, frase })

    const timer = setTimeout(() => {
      setActiva(a => (a && a.id === id ? null : a))
      if (burbujaRef.current && burbujaRef.current.id === id) burbujaRef.current = null
    }, REACCION_TOTAL_MS)
    burbujaRef.current = { id, timer }

    setEnfriando(true)
    clearTimeout(coolRef.current)
    coolRef.current = setTimeout(() => setEnfriando(false), REACCION_COOLDOWN_MS)
  }, [bloqueado])

  // La X cierra SÓLO lo visual. El cooldown ni se entera: molde de
  // handleChipTap (clearTimeout + conmutar) con guardia de id.
  const cerrarBurbuja = useCallback((id) => {
    const b = burbujaRef.current
    if (b && b.id === id) { clearTimeout(b.timer); burbujaRef.current = null }
    setActiva(a => (a && a.id === id ? null : a))
  }, [])

  // Cierre del selector por clic fuera y por Esc. Listener de puntero NO
  // BLOQUEANTE en captura (molde H4 / U1: nada de overlay) — con el selector
  // abierto, un clic sobre un botón de acción lo cierra Y ejecuta el botón.
  // Ambos listeners se montan sólo mientras el selector vive.
  useEffect(() => {
    if (!abierto) return
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.u2-selector')) return
      cerrarSelector()
    }
    const onKey = (e) => { if (e.key === 'Escape') cerrarSelector() }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    // el ancla se midió una vez: si la ventana cambia de tamaño deja de ser
    // válida, y un selector mal anclado es peor que un selector cerrado
    window.addEventListener('resize', cerrarSelector)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', cerrarSelector)
    }
  }, [abierto, cerrarSelector])

  return {
    selector: abierto ? selector : null,
    activa: enabled ? activa : null,
    bloqueado,
    abrirSelector,
    cerrarSelector,
    enviar,
    cerrarBurbuja,
    vetar,
  }
}
