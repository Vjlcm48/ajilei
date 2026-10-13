import { useState } from 'react'
import ChipToken from './ChipToken'
import { IconoX } from './IconosVideo'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'
import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline'

// ── ECO-1g · «Guardando tu premio…»: el cobro que se reintenta (P-2, K7) ────
// Respuesta P-2 del rector al plan del STOP-1. El video ya terminó y el cobro
// del boleto está en camino: se ve la MISMA capa, con la barra llena y, en el
// sitio de «Faltan N s», «Guardando tu premio…». Es de FUERA del reproductor:
// el día del anuncio real el anuncio se habrá cerrado y esto seguirá igual.
//
// Lo normal es que no llegue a leerse: el cobro contesta en décimas y el texto
// entra con medio segundo de retraso (`video.css`).
//
// LA ✕ NO ESTÁ durante la primera tanda de reintentos (1, 2, 4, 8 y 15 s): un
// límite o un corte de red no deben hacer perder un video ya visto (K7), y con
// la ✕ a mano se perdería por impaciencia. Si tras esa tanda el cobro sigue sin
// entrar, `salible` la enseña: «Salir» abandona el cobro y el video se pierde
// sin contar. Mientras no se salga, se sigue reintentando el mismo boleto.

export default function GuardandoVideo({ premio, salible, onSalir }) {
  const { t } = useIdioma()
  const [confirma, setConfirma] = useState(false)
  const hc = montoTexto(premio)

  return (
    <div className="vid-capa" role="dialog" aria-modal="true" aria-label={t('video.marca')} data-accion="video" data-fase="cobrando">
      <img className="vid-iso" src={isotipoUrl} alt="" aria-hidden="true" draggable="false" />

      <header className="vid-cab">
        <span className="vid-marca" data-accion="video-marca">{t('video.marca')}</span>
        {salible ? (
          <button
            type="button"
            className="vid-x"
            data-accion="video-cobro-cerrar"
            aria-label={t('video.cerrar.aria')}
            onClick={() => setConfirma(true)}
          >
            <IconoX />
          </button>
        ) : (
          /* O1 · el hueco de la ✕ se conserva: cuando aparece, nada se mueve. */
          <span className="vid-x-hueco" aria-hidden="true" />
        )}
      </header>

      <div className="vid-centro" />

      <footer className="vid-pie">
        <div className="vid-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}>
          <span style={{ transform: 'scaleX(1)' }} />
        </div>
        <div className="vid-pie-fila">
          <span className="vid-premio"><ChipToken size="icon" />{t('video.premio', { hc })}</span>
          <span className="vid-guardando" role="status" data-accion="video-guardando">{t('video.guardando')}</span>
        </div>
      </footer>

      {salible && confirma && (
        <div className="vid-velo-int">
          <div className="vid-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="vid-cobro-t" data-accion="video-cobro-confirma">
            <p id="vid-cobro-t" className="vid-dialogo-t">{t('video.salir.aviso', { hc })}</p>
            <div className="vid-dialogo-acciones">
              <button type="button" className="vid-btn vid-btn-oro" data-accion="video-cobro-volver" autoFocus onClick={() => setConfirma(false)}>
                {t('video.sin.volver')}
              </button>
              <button type="button" className="vid-btn" data-accion="video-cobro-salir" onClick={onSalir}>
                {t('video.salir.salir')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
