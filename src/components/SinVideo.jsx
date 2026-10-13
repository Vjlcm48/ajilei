import { useEffect } from 'react'
import { useIdioma } from '../hooks/useIdioma'

// ── ECO-1g · «Ahora no hay videos disponibles» (G2, texto T7) ───────────────
// Lámina `laminas/eco1f`, escena f. NO abre la capa: un mensaje corto sobre la
// pantalla desde la que se pidió, y volver. Sale cuando no se pudo emitir el
// boleto (sin red, límite), cuando el reproductor no tiene video que enseñar, o
// cuando el boleto ya no sirve al cobrar (anulado, vencido). En los tres casos
// no se cobró nada y no se descontó ninguno de los videos del día.

export default function SinVideo({ total, onVolver }) {
  const { t } = useIdioma()

  useEffect(() => {
    const alPulsar = (e) => { if (e.key === 'Escape') onVolver() }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onVolver])

  return (
    <div className="vid-velo vid-velo-oscuro" data-accion="video-sin">
      <div className="vid-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="vid-sin-t" aria-describedby="vid-sin-s">
        <p id="vid-sin-t" className="vid-dialogo-t">{t('video.sin')}</p>
        <p id="vid-sin-s" className="vid-dialogo-sub">{t('video.sin.sub', { total })}</p>
        <div className="vid-dialogo-acciones">
          <button type="button" className="vid-btn vid-btn-oro" data-accion="video-volver" autoFocus onClick={onVolver}>
            {t('video.sin.volver')}
          </button>
        </div>
      </div>
    </div>
  )
}
