import { useEffect } from 'react'
import '../styles/cuenta.css'

// ── SUP-2b · Panel de Cuenta ─────────────────────────────────────────────────
// Documento rector: docs/AJILEI_SUP-2b_Puerta_v1.0.md §1.5.
//
// Cuarto satélite del ⋮, con el molde EXACTO de TapetesPanel (EMB-2) y del
// popup de "Mano actual" (U3): la entrada CIERRA AL EJECUTAR, así que cuando
// esto se pinta el panel de utilidades ya se desmontó con su ancla. Por eso se
// ancla al DISPARADOR y no al panel muerto, por su borde derecho, y por eso el
// `ancla` llega HECHA desde `anclaSatelite` (D6) en vez de calcularse aquí —
// tres copias de la misma regla de colocación divergían a la primera celda que
// alguien midiera de más.
//
// `fixed` y fuera de flujo estricto: Δ=0 de layout por construcción, el juego
// sigue corriendo detrás y el panel no pausa nada. Lo que sí pausa —el modal de
// cambiar nombre— es otra superficie y la monta quien abre ésta.
//
// No sabe de Supabase ni de estados de sesión: recibe un nombre y dos funciones.
export function CuentaPanel({
  ancla, username, onCerrar, onCambiarNombre, onCerrarSesion, avisoMano = false,
}) {
  // ── El protocolo de cierre, molde H4 ──────────────────────────────────────
  // Vive AQUÍ y no en el consumidor porque es del panel, no de la mesa: quien lo
  // abre sólo tiene que saber dónde ponerlo. Listener de puntero en CAPTURA y NO
  // BLOQUEANTE —nada de overlay—, exactamente como el menú que lo abre y como el
  // panel de tapetes: este satélite vive DURANTE la mano, así que el clic fuera
  // cierra Y su acción procede.
  //
  // El efecto va ANTES del retorno temprano porque un hook no puede vivir detrás
  // de un `if`. Se apaga solo cuando no hay ancla, que es como está cerrado.
  useEffect(() => {
    if (!ancla) return
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.cuenta-panel, .utilities-trigger')) return
      onCerrar()
    }
    const onKey = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    // el ancla se midió una vez: si la ventana cambia de tamaño deja de ser
    // válida, y un panel mal anclado es peor que un panel cerrado
    window.addEventListener('resize', onCerrar)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onCerrar)
    }
  }, [ancla, onCerrar])

  if (!ancla) return null

  return (
    <div
      className="cuenta-panel"
      role="menu"
      aria-label="Cuenta"
      // `ancla.right` llega como número; `ancla.top` como longitud CSS con la
      // pinza del área segura ya dentro (D4). Mismo par que TapetesPanel.
      style={{ right: `${ancla.right}px`, top: ancla.top }}
    >
      <p className="cuenta-rotulo">Tu nombre</p>
      <p className="cuenta-nombre">{username}</p>

      <button type="button" role="menuitem" className="cuenta-accion" onClick={onCambiarNombre}>
        Cambiar nombre
      </button>
      <button
        type="button"
        role="menuitem"
        className="cuenta-accion is-salir"
        onClick={onCerrarSesion}
      >
        Cerrar sesión
      </button>

      {/* El aviso vive SIEMPRE en la variante de mesa, nunca aparece al pulsar.
          Un renglón que nace debajo del dedo empuja el botón que el dedo acaba
          de soltar — el defecto que O1 nombra por su nombre. */}
      {avisoMano && <p className="cuenta-nota">Salir abandona la mano en curso.</p>}
    </div>
  )
}
