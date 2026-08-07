import { useState, useRef, useEffect, useCallback } from 'react'
import { readConsultas, writeConsultas } from './useUtilitiesMenu'
import { estadoInicial, pedirConsulta } from './consultasCore'
import { CONSULTA_POPUP_MS } from '../config/consultas'

// ── DSK-U3 · Estado de "Mano actual" ─────────────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.3.md §2 y §3.
// Hook HERMANO de useUtilitiesMenu y useReacciones (molde U1): un solo estado,
// dos consumidores —el badge dentro del panel y el popup del valor, que vive
// fuera de él porque el panel CIERRA AL EJECUTAR y se desmonta con su ancla.
// Toda la decisión vive en consultasCore (puro y sellado por Vitest); aquí sólo
// se sostiene el estado, se persiste y se gobierna el ciclo del popup.
//
// El saldo se LEE SIEMPRE al montar (readConsultas inicializa a 20 la primera
// vez) y se ESCRIBE sólo al consumir. Con login migrará al ledger de Supabase
// (v1.1 §3.6) — fuera de alcance.

export function useConsultas(enabled = true) {
  const [estado, setEstado] = useState(() => estadoInicial(readConsultas()))
  const [popup, setPopup] = useState(null)   // null | {id, tipo, anchor, desglose}
  const timerRef = useRef(null)
  const seqRef = useRef(0)

  // El gate se DERIVA igual que en useUtilitiesMenu: fuera de escritorio no hay
  // popup, y con él se van sus listeners.
  const abierto = enabled && popup !== null
  const vivo = abierto ? popup : null

  const cerrarPopup = useCallback(() => setPopup(null), [])

  // `desglose` llega ya calculado por el consumidor desde el estado VIVO en el
  // instante del press: el hook no conoce el motor, y así el valor de un
  // re-press refleja las cartas de ahora, no las de la primera consulta.
  // El cobro NO vive dentro de un updater de setState: en StrictMode los
  // updaters corren dos veces, y persistir (o abrir el popup) desde ahí es
  // justo el doble disparo que el resto del árbol evita. El press es un evento
  // de usuario, así que leer `estado` del cierre es exacto — no hay dos presses
  // en el mismo frame.
  const consultar = useCallback((handCount, desglose, anchor) => {
    const { estado: next, cobro, resultado } = pedirConsulta(estado, handCount)
    if (cobro > 0) writeConsultas(next.saldo)
    setEstado(next)   // misma referencia si no cambió → React no re-renderiza
    setPopup({
      id: ++seqRef.current,
      tipo: resultado === 'agotadas' ? 'agotadas' : 'valor',
      anchor,
      desglose,
    })
  }, [estado])

  // Cierre por las DOS vías exactas: autocierre a los 4s o clic en cualquier
  // otra parte, lo que llegue primero. Molde H4 (setTimeout en ref + pointerdown
  // en captura, sin overlay): un overlay se tragaría el primer clic sobre los
  // botones de acción, y esta lectura ocurre DURANTE la mano.
  useEffect(() => {
    if (!abierto) return
    timerRef.current = setTimeout(cerrarPopup, CONSULTA_POPUP_MS)
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.u3-popup')) return
      cerrarPopup()
    }
    document.addEventListener('pointerdown', onDown, true)
    // el ancla se midió una vez: si la ventana cambia de tamaño deja de ser
    // válida, y un popup mal anclado es peor que un popup cerrado
    window.addEventListener('resize', cerrarPopup)
    return () => {
      clearTimeout(timerRef.current)
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('resize', cerrarPopup)
    }
  }, [abierto, cerrarPopup])

  return { saldo: estado.saldo, manoConsultada: estado.manoConsultada, popup: vivo, consultar, cerrarPopup }
}
