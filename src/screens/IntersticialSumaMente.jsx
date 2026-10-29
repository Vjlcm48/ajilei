import { useCallback, useEffect, useRef, useState } from 'react'

import '../styles/sumamente.css'
import { useIdioma } from '../hooks/useIdioma'
import { ENLACE_PLAY, OMITIR_MS, RESCATE_MS, videoDe } from '../lib/sumaCore'
import { iconoSumaMente512 as iconoCarga, iconoSumaMente64 as iconoFamilia } from '../lib/sumaIconos'

// ── RNK-1 1e · El intersticial de SumaMente ─────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1e_v1.0.md §0 («La pantalla») y §2.3. Autoridad
// visual: la lámina `laminas/rnk1e/pantalla.html` sellada con V1 B · V2 A ·
// V3 A · «Continuar» en fila; medidas del informe 1e-L §4 («Lo que la 1e
// debería sellar»), con la caja a la proporción REAL del video (580:1280).
//
// UNA PANTALLA, NO UNA CAPA: `App` la monta como `screen === 'sumamente'`
// entre el lobby y Rankings, fuera de `conVideo` y sin `data-escala`. No sabe
// del contador (eso es `App` + `sumaCore`): cuando se monta, el video sale.
// Termina por tres caminos y los tres llaman a `onFin` una sola vez:
// «Omitir», «Continuar a Rankings» y el botón «atrás» pasados los 5 s.
//
// ── EL RECORRIDO ────────────────────────────────────────────────────────────
//   cargando  la caja ya reservada, con el icono al 34 % sobre el abisal;
//             el botón de Google Play ya está; el sitio de «Omitir», vacío.
//   antes5    el video suena (o en silencio con el botón de sonido).
//   despues5  a los 5 s de video aparece «Omitir» (fundido de 200 ms).
//   fin       el último fotograma se queda; «Omitir» sigue; «Continuar» se
//             enciende en el sitio que tenía reservado desde el principio (O1).
// `data-suma-estado` lo dice en la raíz, para el arnés.
//
// ── EL SONIDO ───────────────────────────────────────────────────────────────
// `play()` con sonido: el toque de «Rankings» en el lobby es el gesto que lo
// permite. Si el navegador lo rechaza (`NotAllowedError`), arranca en silencio
// y aparece el botón de sonido (la forma de la ✕ de ECO-1g); tocarlo enciende
// el sonido y lo quita. Si ni en silencio deja arrancar, el mismo botón
// arranca el video con sonido (su toque sí es un gesto).
//
// ── EL BOTÓN «ATRÁS» DE ANDROID ─────────────────────────────────────────────
// Al montar se empuja UNA entrada al historial (marcada). Antes de los 5 s,
// «atrás» la consume y se vuelve a empujar: no pasa nada. Después cuenta como
// «Omitir». Al salir por un botón se consume la entrada con `history.back()`
// para no dejar una muerta detrás de Rankings. Con `StrictMode` el efecto
// corre dos veces: la marca impide empujar dos.

const MARCA = 'ajileiSumaMente'
const MARCA_TEXTO = 'HEPTACREATION'

function IconoSonido() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function IntersticialSumaMente({ idioma, onFin }) {
  const { t } = useIdioma()
  const video = useRef(null)
  const [estado, setEstado] = useState('cargando')
  const [mudo, setMudo] = useState(false)
  // El reloj de «Omitir»: los 5 s cuentan desde que el video ARRANCA.
  const [cinco, setCinco] = useState(false)
  // Y el rescate: si no arranca nunca, «Omitir» sale a los 8 s de montar.
  const [rescate, setRescate] = useState(false)
  const omitible = cinco || rescate || estado === 'fin'

  // `onFin` una sola vez, salga por donde salga.
  const salido = useRef(false)
  const terminar = useCallback((consumirHistoria) => {
    if (salido.current) return
    salido.current = true
    video.current?.pause()
    if (consumirHistoria && window.history.state?.[MARCA]) window.history.back()
    onFin?.()
  }, [onFin])

  // El arranque: con sonido; si no lo dejan, en silencio con el botón.
  useEffect(() => {
    const v = video.current
    if (!v) return undefined
    let vivo = true
    v.muted = false
    v.play()?.catch((e) => {
      if (!vivo || e?.name !== 'NotAllowedError') return
      v.muted = true
      setMudo(true)
      v.play()?.catch(() => { /* ni en silencio: el botón de sonido lo arranca */ })
    })
    const r = setTimeout(() => setRescate(true), RESCATE_MS)
    return () => { vivo = false; clearTimeout(r); v.pause() }
  }, [])

  // Los 5 s, desde el primer fotograma en marcha. Un temporizador de 100 ms,
  // como la lámina: con el video a velocidad 1 coincide con `currentTime`, y
  // si el video se atasca el reloj sigue (nadie se queda esperando un búfer).
  const inicio = useRef(null)
  useEffect(() => {
    if (estado !== 'antes5' || cinco) return undefined
    const tic = setInterval(() => {
      if (inicio.current !== null && performance.now() - inicio.current >= OMITIR_MS) setCinco(true)
    }, 100)
    return () => clearInterval(tic)
  }, [estado, cinco])

  // El historial: una entrada marcada para el botón «atrás».
  const omitibleRef = useRef(omitible)
  useEffect(() => { omitibleRef.current = omitible }, [omitible])
  useEffect(() => {
    if (!window.history.state?.[MARCA]) window.history.pushState({ ...window.history.state, [MARCA]: true }, '')
    const alAtras = () => {
      if (salido.current) return
      if (omitibleRef.current) terminar(false)
      else window.history.pushState({ ...window.history.state, [MARCA]: true }, '')
    }
    window.addEventListener('popstate', alAtras)
    return () => window.removeEventListener('popstate', alAtras)
  }, [terminar])

  // En segundo plano (el enlace de Google Play abre otra pestaña o la app de
  // Play Store) el video se para, para que no suene encima; al volver, sigue.
  useEffect(() => {
    const alCambiar = () => {
      const v = video.current
      if (!v || v.ended) return
      if (document.visibilityState === 'hidden') v.pause()
      else if (!salido.current && inicio.current !== null) v.play()?.catch(() => {})
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  const alArrancar = () => {
    if (inicio.current === null) inicio.current = performance.now()
    setEstado((e) => (e === 'cargando' ? 'antes5' : e))
  }
  const alSonido = () => {
    const v = video.current
    if (!v) return
    v.muted = false
    setMudo(false)
    if (v.paused && !v.ended) v.play()?.catch(() => {})
  }

  const [antesMarca, despuesMarca] = t('rnk.suma.familia', { marca: MARCA_TEXTO }).split(MARCA_TEXTO)
  const estadoVisto = estado === 'antes5' && cinco ? 'despues5' : estado

  return (
    <main
      className="sm"
      data-accion="sumamente-intersticial"
      data-suma-estado={estadoVisto}
      data-suma-sonido={mudo ? 'no' : 'si'}
    >
      <p className="sm-fam">
        <img src={iconoFamilia} alt="" draggable="false" />
        <span>{antesMarca}<b>{MARCA_TEXTO}</b>{despuesMarca}</span>
      </p>

      {/* El sitio de «Omitir» está siempre (O1); el botón, sólo a los 5 s. */}
      <div className="sm-omi">
        {omitible && (
          <button type="button" className="sm-omitir" data-accion="sm-omitir" onClick={() => terminar(true)}>
            <span>{t('rnk.suma.omitir')}</span>
            <Chevron />
          </button>
        )}
      </div>

      <div className="sm-esc">
        <div className="sm-caja" data-accion="sm-video">
          <video
            ref={video}
            src={videoDe(idioma)}
            playsInline
            preload="auto"
            aria-label={t('rnk.suma.titulo')}
            onPlaying={alArrancar}
            onEnded={() => setEstado('fin')}
            onError={() => setEstado('fin')}
          />
          <div className="sm-carga" aria-hidden="true">
            <img src={iconoCarga} alt="" draggable="false" />
          </div>
          {mudo && (
            <button type="button" className="sm-sonido" data-accion="sm-sonido" aria-label={t('rnk.suma.sonido.aria')} onClick={alSonido}>
              <IconoSonido />
            </button>
          )}
        </div>
      </div>

      <div className="sm-acc">
        {/* CFG-1 1a · INV-45: abre la tienda; el toque no pide pantalla completa. */}
        <a className="sm-play" data-accion="sm-play" href={ENLACE_PLAY} target="_blank" rel="noopener noreferrer" data-sin-pantalla-completa="">
          <b>{t('rnk.suma.boton')}</b>
          <small>{t('rnk.suma.boton.sub')}</small>
        </a>
        <div className="sm-cont-sitio">
          <button
            type="button"
            className="sm-cont"
            data-accion="sm-continuar"
            disabled={estado !== 'fin'}
            onClick={() => terminar(true)}
          >
            {t('rnk.suma.continuar')}
          </button>
        </div>
      </div>
    </main>
  )
}
