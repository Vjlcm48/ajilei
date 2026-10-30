import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/eliminarCuenta.css'

import { useIdioma } from '../hooks/useIdioma'

// ── CFG-1 1c · La ventana «Eliminar cuenta» ─────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1c_v1.0.md §0 y §2.1.
//
// LA ABRE la fila «Eliminar cuenta» de la hoja ⚙ (`HojaConfiguracion`), en las
// siete pantallas que la montan. VA EN `body` por portal (molde de
// `MiniPerfil`): una capa fija por encima de la hoja (z 7) y de su toast (z 8),
// con velo propio, y fuera de `#root`, que queda `inert` mientras está abierta.
//
// CONFIRMAR ES ESCRIBIR. El botón de borrar está apagado hasta que el campo
// diga la palabra (`lob.eliminar.palabra`, «ELIMINAR») exactamente: sin
// espacios, y comparada en mayúsculas, así que «eliminar» también vale.
//
// CUATRO ESTADOS (`data-elc-estado`):
//   normal    el campo y los dos botones;
//   enviando  los dos botones apagados y el de borrar con los puntos vivos del
//             «Cargando» de BIE-1; no se cierra (ni ✕, ni velo, ni `Escape`):
//             lo que conteste el servidor tiene que llegar a alguien;
//   error     el texto bajo los botones; el campo se conserva;
//   (ok)      no hay estado: `App` limpia el aparato y cierra la sesión, y la
//             ventana se va con la pantalla.
// La mesa abierta no es un estado: quien la abrió la cierra y lo dice en su
// toast (`onMesaAbierta`).
//
// SIN UUID (INV-67) y SIN ORO: el botón de borrar lleva el rojo de
// `lob-fila-peligro` (`--loss-red`), y el foco, anillo crema.

export default function EliminarCuenta({ onCerrar, onEliminar, onMesaAbierta }) {
  const { t } = useIdioma()
  const idTitulo = useId()
  const idCampo = useId()
  const campo = useRef(null)
  const tarjeta = useRef(null)
  const [valor, setValor] = useState('')
  const [estado, setEstado] = useState('normal')

  const palabra = t('lob.eliminar.palabra')
  const listo = valor.toLocaleUpperCase('es') === palabra
  const enviando = estado === 'enviando'

  // Las funciones de quien abre van por referencia: los efectos de abajo
  // corren una vez, aunque el padre las rehaga en cada render.
  const cb = useRef({ onCerrar, onEliminar, onMesaAbierta })
  useEffect(() => { cb.current = { onCerrar, onEliminar, onMesaAbierta } })
  const enviandoRef = useRef(false)
  const vigente = useRef(true)

  const cerrar = () => { if (!enviandoRef.current) cb.current.onCerrar?.() }

  // Al abrir: lo de detrás, `inert`; el foco, al campo; `Escape` cierra.
  useEffect(() => {
    vigente.current = true
    const raiz = document.getElementById('root')
    raiz?.setAttribute('inert', '')
    campo.current?.focus()
    const alPulsar = (e) => { if (e.key === 'Escape' && !enviandoRef.current) cb.current.onCerrar?.() }
    document.addEventListener('keydown', alPulsar)
    return () => {
      vigente.current = false
      raiz?.removeAttribute('inert')
      document.removeEventListener('keydown', alPulsar)
    }
  }, [])

  const confirmar = async (e) => {
    e?.preventDefault()
    // Doble toque: el botón se apaga al enviar, y esta guarda llega antes que
    // el render siguiente.
    if (!listo || enviandoRef.current) return
    enviandoRef.current = true
    // El botón pulsado se apaga y el foco caería al <body>: pasa a la ventana.
    // Al campo no (en el teléfono abriría el teclado); si ya estaba en él (se
    // envió con Intro), se queda.
    if (document.activeElement !== campo.current) tarjeta.current?.focus()
    setEstado('enviando')
    const r = await cb.current.onEliminar?.() ?? { ok: false, motivo: 'servidor' }
    if (!vigente.current || r.ok) return
    enviandoRef.current = false
    if (r.motivo === 'mesa_abierta') { cb.current.onMesaAbierta?.(); return }
    setEstado('error')
  }

  return createPortal(
    <div
      className="elc-velo"
      data-accion="elc-velo"
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        ref={tarjeta}
        tabIndex={-1}
        className="elc-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        data-elc-estado={estado}
      >
        <button
          type="button"
          className="elc-cerrar"
          data-accion="elc-cerrar"
          aria-label={t('lob.eliminar.cerrar')}
          disabled={enviando}
          onClick={cerrar}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <h2 id={idTitulo} className="elc-titulo">{t('lob.eliminar.titulo')}</h2>

        <div className="elc-aviso">
          <p>{t('lob.eliminar.aviso.saldo')}</p>
          <p className="elc-fuerte">{t('lob.eliminar.aviso.deshacer')}</p>
          <p>{t('lob.eliminar.aviso.correo')}</p>
        </div>

        <form className="elc-form" onSubmit={confirmar} noValidate>
          <label className="elc-instruccion" htmlFor={idCampo}>
            {t('lob.eliminar.instruccion', { palabra })}
          </label>
          <input
            ref={campo}
            id={idCampo}
            className="elc-campo"
            data-accion="elc-campo"
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            readOnly={enviando}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          <div className="elc-botones">
            <button
              type="button"
              className="elc-btn elc-cancelar"
              data-accion="elc-cancelar"
              disabled={enviando}
              onClick={cerrar}
            >
              {t('lob.eliminar.cancelar')}
            </button>
            <button
              type="submit"
              className="elc-btn elc-borrar"
              data-accion="elc-borrar"
              disabled={!listo || enviando}
            >
              {enviando ? (
                <>
                  {t('lob.eliminar.enviando')}
                  <span className="elc-puntos" aria-hidden="true">
                    <span className="elc-punto" />
                    <span className="elc-punto" />
                    <span className="elc-punto" />
                  </span>
                </>
              ) : t('lob.eliminar.confirmar')}
            </button>
          </div>
          {/* O1 · la ranura del error reserva su alto siempre. */}
          <p className={`elc-error${estado === 'error' ? ' is-on' : ''}`} role="status" aria-live="polite" data-accion="elc-error">
            {estado === 'error' ? t('lob.eliminar.error') : ' '}
          </p>
        </form>
      </div>
    </div>,
    document.body,
  )
}
