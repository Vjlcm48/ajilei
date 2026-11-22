import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import '../styles/ofertaGuiada.css'
import { t } from '../config/textos'
import { SoundButton } from './SoundButton'

// ── GUI-1 · La oferta del primer login ──────────────────────────────────────
// Normativo: AJILEI_Tutorial_v1.3.md §1.2. Una tarjeta pequeña, no una
// pantalla: «¿Aprendemos en dos minutos?». La forma la eligió Victor en la
// lámina (2026-11-20): CENTRADA SOBRE EL LOBBY ATENUADO (la variante a; la b,
// anclada abajo, tapaba la entrada a jugar y dejaba dos oros sólidos a la vista).
// En esta tanda no la monta nadie: la monta la tanda 3.
//
// Portal a `body` y `fixed` (molde de `AvisoSaldo`): el lobby no se mueve ni un
// píxel (INV-05) y la tarjeta no toca la píldora de saldo, que vive arriba.
// Diálogo: el foco entra en la tarjeta, no sale de ella y vuelve al cerrar;
// Escape = «Ahora no». Los botones suenan como los demás (`SoundButton`).

/**
 * @param {object} p
 * @param {Function} p.onJugar
 * @param {Function} p.onAhoraNo
 */
export default function OfertaGuiada({ onJugar, onAhoraNo }) {
  const idTitulo = useId()
  const idTexto = useId()
  const tarjetaRef = useRef(null)

  useEffect(() => {
    const previo = document.activeElement
    tarjetaRef.current?.querySelector('[data-accion="guiada-jugar"]')?.focus({ preventScroll: true })
    const tecla = (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); onAhoraNo?.(); return }
      if (ev.key !== 'Tab') return
      const lista = [...(tarjetaRef.current?.querySelectorAll('button') ?? [])]
      if (lista.length === 0) return
      const i = lista.indexOf(document.activeElement)
      ev.preventDefault()
      lista[ev.shiftKey ? (i <= 0 ? lista.length - 1 : i - 1) : (i + 1) % lista.length].focus({ preventScroll: true })
    }
    document.addEventListener('keydown', tecla, true)
    return () => {
      document.removeEventListener('keydown', tecla, true)
      if (previo instanceof HTMLElement && previo.isConnected) previo.focus({ preventScroll: true })
    }
  }, [onAhoraNo])

  return createPortal(
    <div className="ofg-raiz">
      <div className="ofg-velo" aria-hidden="true" />
      <div
        ref={tarjetaRef}
        className="ofg-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
      >
        <h2 id={idTitulo} className="ofg-titulo">{t('tut.oferta.titulo')}</h2>
        <p id={idTexto} className="ofg-texto">{t('tut.oferta.texto')}</p>
        <div className="ofg-botones">
          <SoundButton type="button" className="ofg-btn ofg-btn--pri" data-accion="guiada-jugar" onClick={onJugar}>
            {t('tut.oferta.jugar')}
          </SoundButton>
          <SoundButton type="button" className="ofg-btn ofg-btn--sec" data-accion="guiada-ahora-no" onClick={onAhoraNo}>
            {t('tut.oferta.ahorano')}
          </SoundButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
