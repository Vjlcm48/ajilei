import { useState, useEffect, useRef } from 'react'
import { useSoundContext } from '../context/SoundContext'
import { readConsultas } from '../hooks/useUtilitiesMenu'
import ChipToken from './ChipToken'

// ── DSK-U1 / U1b · Menú de utilidades (SOLO gate de escritorio) ─────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.1.md (+ enmienda y apéndices).
// El estado del menú vive en useUtilitiesMenu.
//
// El disparador ⋮ ocupa la caja EXACTA del botón de sonido de hoy; la reserva la
// pone el CSS (ley E2 del diagnóstico U1: sin ancho y alto explícitos el glifo
// encoge el botón 15,61px y arrastra .header-right en las 20 celdas).
//
// El panel es fuera de flujo y se monta como HERMANO del área, junto a las
// cartas voladoras: `fixed` sin ancestro con transform → ancla al viewport, así
// que no necesita portal (ensayo E3b: Δ=0 en 11 anclas y overflow +0 en 20/20).
//
// U1b · las entradas pierden la palabra y se quedan en ICONO + tooltip nativo.
// El panel encoge en ANCHO, nunca en área táctil: cada fila conserva sus 44px.

// Silueta de carta con "?" — icono propio de "Mano actual". Proporción del
// sistema: los assets son 1055×1491 (ratio 0,7076); 22×31 es su simplificación
// entera más cercana (0,7097), la misma familia de proporción que --card-w/h.
// Trazo en currentColor → hereda --text-primary de la entrada: el ÚNICO oro
// sólido del panel es la ficha de Saldo (glifo de moneda ya establecido en la
// app) y el único acento dorado nuevo es el filete del badge. Single-gold intacto.
function CardQueryIcon() {
  return (
    <svg
      className="util-ico util-ico-card"
      viewBox="0 0 22 31"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1" y="1" width="20" height="29" rx="3"
        fill="none" stroke="currentColor" strokeWidth="1.75"
      />
      <text
        x="11" y="22" textAnchor="middle"
        fontSize="16" fontWeight="700" fill="currentColor"
      >?</text>
    </svg>
  )
}

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

// Entradas inertes: presentes, visibles y sin respuesta al clic — el estado de
// no habilitados que la v1.1 §6 hereda de la v1.0 §3.
// DSK-U2 · "Mensajes" SALE de aquí: pasa a ser Reacciones, entrada viva. Queda
// sola "Saldo", que reutiliza el ChipToken del cornerChip (el glifo de moneda
// de la app ya existe y es SVG dorado plano — inventar otro rompería el
// lenguaje).
const INERTES = [
  { key: 'saldo', title: 'Saldo', ico: <span className="util-ico util-ico-chip" aria-hidden="true"><ChipToken size="compact" /></span> },
]

const POPUP_MS = 2000

export function UtilitiesPanel({ anchor, onClose, onReacciones, reaccionesBloqueadas }) {
  const { soundEnabled, toggle: toggleSound } = useSoundContext()
  // Saldo de consultas de "Mano actual". Se lee (e inicializa a 20) la primera
  // vez que el panel se monta. Sin lógica de consumo: eso es U3 — aquí la cifra
  // sólo se pinta, y hasta entonces será 20 fija.
  const [consultas] = useState(readConsultas)
  const [popup, setPopup] = useState(null)   // null = cerrado; {top,right} = abierto
  const badgeRef = useRef(null)
  const popupTimer = useRef(null)

  // Cierre del popup por sus DOS vías exactas: clic en cualquier otra parte o
  // autocierre a los 2s, lo que llegue primero. Molde H4 (setTimeout en ref +
  // pointerdown en captura, sin overlay).
  // INVARIANTE SELLADO: presionar el badge NO es "ejecutar" — el menú sigue
  // abierto. Se cumple sin código extra: el badge vive DENTRO de .utilities-panel
  // y el listener del menú ignora todo lo que caiga ahí. Un clic fuera del panel
  // cierra ambos, que es lo coherente.
  useEffect(() => {
    if (!popup) return
    popupTimer.current = setTimeout(() => setPopup(null), POPUP_MS)
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.util-badge, .utilities-popup')) return
      setPopup(null)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      clearTimeout(popupTimer.current)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [popup])

  if (!anchor) return null

  // El popup se ancla al badge y se mide al abrir, igual que el panel al ⋮. Se
  // posiciona por su borde DERECHO (a la izquierda del badge) para no depender
  // de un ancho que cambia con la cifra; el centrado vertical lo hace el CSS.
  const pressBadge = () => {
    setPopup(prev => {
      if (prev) return null
      const el = badgeRef.current
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { right: window.innerWidth - r.left + 8, top: r.top + r.height / 2 }
    })
  }

  return (
    <>
      <div
        className="utilities-panel"
        role="menu"
        style={{ left: `${anchor.left}px`, top: `${anchor.top}px` }}
      >
        {/* Sonido · único toggle vivo. Cierra al ejecutar (v1.1 §1.3.1): el
            efecto es inmediato y audible, el panel no tiene nada más que decir.
            Sin palabra, el estado lo porta el propio glifo (más la clase). */}
        <button
          type="button"
          role="menuitem"
          className={`util-item util-item-sound${soundEnabled ? '' : ' is-off'}`}
          onClick={() => { toggleSound(); onClose() }}
          title="Sonido"
        >
          <span className="util-ico" aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        {/* DSK-U2 · Reacciones · segunda entrada VIVA. Cierra al ejecutar, como
            su hermana Sonido (v1.1 §1.3.1): el panel no tiene nada más que
            decir, el selector toma el relevo. Durante el cooldown queda inerte
            con clase PROPIA (`is-cooling`), nunca con `is-disabled`: aquélla es
            la lengua de "no habilitado" —permanente— y esto es un estado
            temporal de una entrada que sí está habilitada. */}
        <button
          type="button"
          role="menuitem"
          className={`util-item util-item-reacciones${reaccionesBloqueadas ? ' is-cooling' : ''}`}
          onClick={() => { onClose(); onReacciones() }}
          disabled={reaccionesBloqueadas}
          title={reaccionesBloqueadas ? 'Reacciones (espera un momento)' : 'Reacciones'}
        >
          <span className="util-ico" aria-hidden="true">💬</span>
        </button>

        {INERTES.map(e => (
          <button
            key={e.key}
            type="button"
            role="menuitem"
            className="util-item is-disabled"
            title={e.title}
            disabled
          >
            {e.ico}
          </button>
        ))}

        {/* "Mano actual" · última y separada por el filete del sistema: es la
            entrada premium y no pertenece al grupo de las tres.
            Va en <div>, no en <button disabled>: un botón deshabilitado bloquea
            los eventos de sus hijos y el badge quedaría muerto. La entrada sigue
            inerte (sin handler); el badge es lo único interactivo. */}
        <div className="util-item util-item-mano is-disabled" title="Mano actual">
          {/* El rol de menú y su estado deshabilitado viven en el ICONO, no en
              el contenedor: un control vivo —el badge— no puede colgar de un
              subárbol `aria-disabled`. Las herramientas de accesibilidad lo
              tratarían como muerto, y con razón (Playwright se niega a pulsarlo,
              que fue justo como salió esto). */}
          <span className="util-ico-slot" role="menuitem" aria-disabled="true" aria-label="Mano actual">
            <CardQueryIcon />
          </span>
          <button
            ref={badgeRef}
            type="button"
            className="util-badge"
            onClick={pressBadge}
            aria-label={`${consultas} consultas gratis`}
          >
            {consultas}
          </button>
        </div>
      </div>

      {popup && (
        <div
          className="utilities-popup"
          role="status"
          style={{ right: `${popup.right}px`, top: `${popup.top}px` }}
        >
          Tienes {consultas} consultas gratis
        </div>
      )}
    </>
  )
}
