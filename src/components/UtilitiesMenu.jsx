import { useSoundContext } from '../context/SoundContext'

// ── DSK-U1 · Menú de utilidades (SOLO gate de escritorio) ────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md (+ enmienda y apéndice
// de decisiones de implementación). El estado vive en useUtilitiesMenu.
//
// El disparador ⋮ ocupa la caja EXACTA del botón de sonido de hoy; la reserva la
// pone el CSS (ley E2 del diagnóstico U1: sin ancho y alto explícitos el glifo
// encoge el botón 15,61px y arrastra .header-right en las 20 celdas).
//
// El panel es fuera de flujo y se monta como HERMANO del área, junto a las
// cartas voladoras: `fixed` sin ancestro con transform → ancla al viewport, así
// que no necesita portal (ensayo E3b: Δ=0 en 11 anclas y overflow +0 en 20/20).

// Disparador — hereda la clase .mute-button para conservar borde, radio, color y
// transición EXACTOS del botón de hoy; .utilities-trigger sólo añade la reserva
// de caja y el glifo. La reserva de badge de notificación (v1.0 §5) sigue sin
// implementar, pero la caja fija es justo lo que la hará posible sin mover nada.
export function UtilitiesTrigger({ open, onToggle, registerTrigger }) {
  return (
    <button
      ref={registerTrigger}
      className={`mute-button utilities-trigger${open ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={open}
      title="Utilidades"
    >
      ⋮
    </button>
  )
}

// Entradas 2-4: presentes, visibles e INERTES — el estado de no habilitados que
// la v1.1 §6 hereda de la v1.0 §3 (atenuados y sin respuesta al clic). Cero
// lógica: "Mano actual" no muestra aún su saldo de consultas (v1.1 §3.5) porque
// el contador no existe, y anunciar una cifra sin ledger detrás sería inventarla.
const ENTRADAS_INERTES = [
  { key: 'mensajes', ico: '💬', label: 'Mensajes' },
  { key: 'mano',     ico: '♠',  label: 'Mano actual' },
  { key: 'saldo',    ico: '👁',  label: 'Saldo: visible/oculto' },
]

export function UtilitiesPanel({ anchor, onClose }) {
  const { soundEnabled, toggle: toggleSound } = useSoundContext()
  if (!anchor) return null
  return (
    <div
      className="utilities-panel"
      role="menu"
      style={{ left: `${anchor.left}px`, top: `${anchor.top}px` }}
    >
      {/* Sonido · único toggle vivo. Cierra al ejecutar (v1.1 §1.3.1): el efecto
          es inmediato y audible, el panel no tiene nada más que decir. */}
      <button
        type="button"
        role="menuitem"
        className={`util-item util-item-sound${soundEnabled ? '' : ' is-off'}`}
        onClick={() => { toggleSound(); onClose() }}
      >
        <span className="util-ico" aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
        <span className="util-label">Sonido</span>
        <span className="util-state">{soundEnabled ? 'Activado' : 'Silenciado'}</span>
      </button>

      {ENTRADAS_INERTES.map(e => (
        <button key={e.key} type="button" role="menuitem" className="util-item is-disabled" disabled>
          <span className="util-ico" aria-hidden="true">{e.ico}</span>
          <span className="util-label">{e.label}</span>
        </button>
      ))}
    </div>
  )
}
