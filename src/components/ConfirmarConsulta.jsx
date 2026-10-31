import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import '../styles/eliminarCuenta.css'
import '../styles/utilidadesMesa.css'

import { useIdioma } from '../hooks/useIdioma'

// ── CFG-1 1e · La confirmación del primer cobro de Mano actual ──────────────
// Rector: AJILEI_CFG-1_Fase1e_v1.0.md §0-4 y §2.3.
//
// La abre `useConsultas` cuando la consulta va a cobrar y es el primer cobro de
// la sesión (`lib/consultaConfirmada`); los siguientes de la misma sesión
// cobran directo. Un toque: «Consultar» o «Cancelar», sin escribir nada.
//
// DE LA FAMILIA DE «ELIMINAR CUENTA» (`EliminarCuenta.jsx`): la misma tarjeta,
// el mismo velo, la misma ✕, en `body` por portal (fuera de `#root` y de su
// escala), con `#root` `inert` mientras está abierta y `Escape` para cerrar.
// SIN EL ROJO: no destruye nada. El botón de consultar lleva el filete del oro
// de la casa sobre la superficie del sistema (`utilidadesMesa.css`), el mismo
// lenguaje que el badge del ⋮; ningún oro nuevo (INV-08).
//
// La mesa sigue corriendo detrás, como con el Bautizo en edición que vivía
// aquí antes: es una pregunta de un toque.

export default function ConfirmarConsulta({ precio, onConsultar, onCancelar }) {
  const { t } = useIdioma()
  const idTitulo = useId()
  const idTexto = useId()
  const boton = useRef(null)
  const cb = useRef({ onCancelar })
  useEffect(() => { cb.current = { onCancelar } })

  useEffect(() => {
    const raiz = document.getElementById('root')
    raiz?.setAttribute('inert', '')
    boton.current?.focus()
    const alPulsar = (e) => { if (e.key === 'Escape') cb.current.onCancelar?.() }
    document.addEventListener('keydown', alPulsar)
    return () => {
      raiz?.removeAttribute('inert')
      document.removeEventListener('keydown', alPulsar)
    }
  }, [])

  return createPortal(
    <div
      className="elc-velo"
      data-accion="cmc-velo"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar?.() }}
    >
      <div
        className="elc-tarjeta cmc-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
        data-cmc-precio={precio ?? ''}
      >
        <button
          type="button"
          className="elc-cerrar"
          data-accion="cmc-cerrar"
          aria-label={t('ia.mesa.consulta.cerrar')}
          onClick={onCancelar}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <h2 id={idTitulo} className="elc-titulo">{t('ia.mesa.menu.mano')}</h2>
        <p id={idTexto} className="cmc-texto">{t('ia.mesa.consulta.confirmar.texto', { hc: precio ?? '' })}</p>

        <div className="elc-botones">
          <button type="button" className="elc-btn elc-cancelar" data-accion="cmc-cancelar" onClick={onCancelar}>
            {t('ia.mesa.consulta.cancelar')}
          </button>
          <button ref={boton} type="button" className="elc-btn cmc-consultar" data-accion="cmc-consultar" onClick={onConsultar}>
            {t('ia.mesa.consulta.confirmar.ok')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
