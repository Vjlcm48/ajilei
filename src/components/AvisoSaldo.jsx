import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ChipToken from './ChipToken'
import '../styles/avisoSaldo.css'

// ── ECO-1c · La cápsula del aviso de saldo ──────────────────────────────────
// Lámina `laminas/eco1c/lamina.html`, aprobada tal cual. La monta
// `BarraSuperior`, que es quien tiene la píldora y su cuenta; esto sólo pinta
// la cápsula y la coloca.
//
// SE COLOCA CONTRA LA PÍLDORA, NO CONTRA LA PANTALLA: 9 px bajo ella, centrada
// en ella y sin salirse de los márgenes de 16 px, con el pico apuntando al
// centro de la moneda. Se mide en un `useLayoutEffect` y se escribe en el
// estilo del nodo (no en un estado: así no hay render de más ni un fotograma
// en el sitio equivocado).
//
// VA EN `body` (portal) porque es `position: fixed` y un antecesor con
// `transform` la anclaría a él y no a la ventana.
//
// NO BLOQUEA: sólo la cápsula recibe el toque, y el toque la cierra antes.
// `role="status"` la anuncia sin robar el foco.

const MARCA = '{hc}'

export default function AvisoSaldo({ texto, monto, montoTexto, pildoraRef, monedaRef, saliendo, onCerrar }) {
  const capsula = useRef(null)

  useLayoutEffect(() => {
    const el = capsula.current
    const pildora = pildoraRef?.current
    if (!el || !pildora) return
    const colocar = () => {
      const pr = pildora.getBoundingClientRect()
      const mr = (monedaRef?.current ?? pildora).getBoundingClientRect()
      const fs = parseFloat(getComputedStyle(pildora).fontSize) || 16
      el.style.fontSize = `${Math.max(12.5, Math.min(15, fs * 0.82)).toFixed(2)}px`
      el.style.top = `${(pr.bottom + 9).toFixed(1)}px`
      el.style.left = '0px'
      const vw = document.documentElement.clientWidth
      const ancho = el.getBoundingClientRect().width
      const x = Math.max(16, Math.min(vw - 16 - ancho, pr.left + pr.width / 2 - ancho / 2))
      el.style.left = `${x.toFixed(1)}px`
      const pico = Math.max(14, Math.min(ancho - 14, mr.left + mr.width / 2 - x))
      el.style.setProperty('--avs-pico', `${pico.toFixed(1)}px`)
    }
    colocar()
    window.addEventListener('resize', colocar)
    return () => window.removeEventListener('resize', colocar)
  }, [pildoraRef, monedaRef, texto])

  // El monto va en oro, partido del resto del texto por la marca `{hc}`.
  const [antes, despues] = texto.includes(MARCA) ? texto.split(MARCA) : [texto, null]

  return createPortal(
    <div
      ref={capsula}
      className={`avs${saliendo ? ' is-sale' : ''}`}
      role="status"
      aria-live="polite"
      data-accion="aviso-saldo"
      data-monto={monto}
      {...(monto > 0 ? {} : { 'data-sin-moneda': '' })}
      onClick={onCerrar}
    >
      {monto > 0 && <span className="avs-moneda" aria-hidden="true"><ChipToken size="icon" /></span>}
      <span className="avs-texto">
        {antes}
        {despues !== null && <><span className="avs-hc">{montoTexto}</span>{despues}</>}
      </span>
    </div>,
    document.body,
  )
}
