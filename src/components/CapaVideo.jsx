import { useEffect, useState } from 'react'
import ChipToken from './ChipToken'
import { IconoX, IconoPlay } from './IconosVideo'
import { useIdioma } from '../hooks/useIdioma'
import { useCongelado } from '../hooks/useCongelado'
import { montoTexto } from '../config/tapetes'
import { ESTADOS } from '../lib/reproductor'
import { FASES, TIC_MS, sumarVisible, consejoDe, faltanS, progreso, daTiempo } from '../hooks/videoCore'
import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline'

// ── ECO-1g · La capa del video de recompensa: LO DE DENTRO del reproductor ──
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §1.1 (G4, G7, G8, G10) y la lámina
// aprobada `laminas/eco1f` (escenas c, d y e).
//
// Es el video SIMULADO: los consejos rotativos, el isotipo de marca de agua, la
// barra, «Faltan N s», la ✕ con su confirmación y la pausa. El día del anuncio
// real esta pieza (y `lib/reproductor.empezar`) es lo único que cambia; el
// boleto, el contador y la celebración viven fuera (`lib/controlVideo`).
//
// SÓLO CUENTA EL TIEMPO VISIBLE. Un tic de 100 ms suma mientras la fase es
// «corriendo» y la pestaña está a la vista (`useCongelado`, FRZ-1); con la
// confirmación de la ✕ abierta o en pausa, no corre. Al volver de la pantalla
// bloqueada el video está EN PAUSA donde quedó y sigue con un toque: no se
// reanuda solo.
//
// A pantalla entera y `position: fixed`. NO lleva `data-sin-pantalla-completa`
// (Fase 0 P.7): un toque aquí puede devolver la pantalla completa, como en
// cualquier otro sitio de la app.

export default function CapaVideo({ reproductor, sesion, premio }) {
  const { t } = useIdioma()
  const { congelado, congeladoRef } = useCongelado()
  const [ms, setMs] = useState(0)
  const fase = sesion.fase

  useEffect(() => {
    if (fase !== FASES.CORRIENDO) return undefined
    let previo = performance.now()
    const id = setInterval(() => {
      const ahora = performance.now()
      const delta = ahora - previo
      previo = ahora
      setMs((m) => sumarVisible(m, delta, { fase: FASES.CORRIENDO, oculto: congeladoRef.current }))
    }, TIC_MS)
    return () => clearInterval(id)
  }, [fase, congeladoRef])

  useEffect(() => {
    if (ms >= sesion.duracionMs) reproductor.terminar(ESTADOS.COMPLETADO)
  }, [ms, sesion.duracionMs, reproductor])

  // G8 · la pantalla se bloqueó o la pestaña se ocultó: en pausa donde quedó.
  useEffect(() => {
    if (congelado && fase === FASES.CORRIENDO) reproductor.fase(FASES.PAUSA)
  }, [congelado, fase, reproductor])

  // Tras una pausa larga puede no dar tiempo a terminar antes de que el boleto
  // venza: en vez de hacer ver el resto para nada, se cierra como «no hay video».
  const seguir = () => {
    if (!daTiempo(sesion.caducaEn, Date.now(), sesion.duracionMs, ms)) {
      reproductor.terminar(ESTADOS.NO_DISPONIBLE)
      return
    }
    reproductor.fase(FASES.CORRIENDO)
  }

  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key !== 'Escape') return
      const f = reproductor.leer()?.fase
      if (f === FASES.CORRIENDO) reproductor.fase(FASES.CONFIRMA)
      else if (f === FASES.CONFIRMA) reproductor.fase(FASES.CORRIENDO)
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [reproductor])

  // Sólo el mando de desarrollo `?apu=video:cierra`: se cierra antes de tiempo
  // sin que nadie toque, para que el arnés mida ese final.
  useEffect(() => {
    if (!sesion.cierraSolo) return undefined
    const id = setTimeout(() => reproductor.terminar(ESTADOS.CERRADO_ANTES), 800)
    return () => clearTimeout(id)
  }, [sesion.cierraSolo, reproductor])

  const consejo = consejoDe(sesion.inicio, ms)
  const avance = progreso(sesion.duracionMs, ms)
  const hc = montoTexto(premio)

  return (
    <div className="vid-capa" role="dialog" aria-modal="true" aria-label={t('video.marca')} data-accion="video" data-fase={fase}>
      <img className="vid-iso" src={isotipoUrl} alt="" aria-hidden="true" draggable="false" />

      <header className="vid-cab">
        <span className="vid-marca" data-accion="video-marca">{t('video.marca')}</span>
        <button
          type="button"
          className="vid-x"
          data-accion="video-cerrar"
          aria-label={t('video.cerrar.aria')}
          onClick={() => reproductor.fase(FASES.CONFIRMA)}
        >
          <IconoX />
        </button>
      </header>

      <div className="vid-centro">
        <span className="vid-rotulo">{t('video.consejo.rotulo')}</span>
        {/* O1 · la caja del consejo se RESERVA al alto del más largo: el cambio
            de un consejo a otro no mueve nada. */}
        <div className="vid-consejo-caja" data-accion="video-consejo" data-consejo={consejo + 1}>
          <p className="vid-consejo" key={consejo}>{t(`video.consejo.${consejo + 1}`)}</p>
        </div>
      </div>

      <footer className="vid-pie">
        <div className="vid-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
          <span style={{ transform: `scaleX(${avance})` }} />
        </div>
        <div className="vid-pie-fila">
          <span className="vid-premio"><ChipToken size="icon" />{t('video.premio', { hc })}</span>
          <span className="vid-falta" data-accion="video-falta">{t('video.falta', { s: faltanS(sesion.duracionMs, ms) })}</span>
        </div>
      </footer>

      {fase === FASES.PAUSA && (
        <button type="button" className="vid-pausa" data-accion="video-seguir" onClick={seguir}>
          <span className="vid-pausa-ico"><IconoPlay /></span>
          <b>{t('video.pausa')}</b>
          <span>{t('video.pausa.seguir')}</span>
        </button>
      )}

      {fase === FASES.CONFIRMA && (
        <div className="vid-velo-int">
          <div className="vid-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="vid-salir-t" data-accion="video-confirma">
            <p id="vid-salir-t" className="vid-dialogo-t">{t('video.salir.aviso', { hc })}</p>
            <div className="vid-dialogo-acciones">
              <button type="button" className="vid-btn vid-btn-oro" data-accion="video-seguir" autoFocus onClick={seguir}>
                {t('video.salir.seguir')}
              </button>
              <button type="button" className="vid-btn" data-accion="video-salir" onClick={() => reproductor.terminar(ESTADOS.CERRADO_ANTES)}>
                {t('video.salir.salir')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
