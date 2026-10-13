import { useEffect, useRef, useState } from 'react'
import ChipToken from './ChipToken'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds } from '../hooks/useSounds'
import { montoTexto } from '../config/tapetes'
import { valorEntre, TRASPASO_MS } from '../hooks/coreografiaCore'
import { TIEMPOS_CEL } from '../hooks/videoCore'

// ── ECO-1g · La celebración del video completado (G5) ───────────────────────
// Lámina `laminas/eco1f`, escena h, variante sobria (Victor: 3 = A). Unos 2,2 s:
// una tarjeta centrada «+500 HC · ¡Video completado!», la moneda vuela a la
// píldora, la píldora cuenta el premio y suenan las fichas (`chipsCollect`).
//
// NO ES EL AVISO DE SALDO. Aquél es una cápsula con pico pegada a la píldora y
// queda para el dinero que vuelve y la constancia; ésta es propia, centrada y
// sin pico, y no entra en su fila. Si hay un aviso en curso, `MarcoVideo` no la
// monta hasta que termina.
//
// LA PÍLDORA NO SALTA NI RETROCEDE. El cobro ya está en la billetera cuando
// esto empieza; mientras dura, la píldora no enseña el saldo sino la cifra que
// esta pieza le dicta por `onPildora` (de `cel.desde` a `cel.hasta`), y al
// terminar el saldo es justo esa cifra.
//
// MOVIMIENTO REDUCIDO: sin vuelo, sin cuenta y sin fundidos. Suena, y la cifra
// cambia de una vez.
//
// No atrapa toques (`pointer-events: none`): la pantalla de debajo sigue viva.

const BRILLO_MS = 1150
const reducidoAhora = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export default function CelebracionVideo({ cel, contador, onPildora, onFin }) {
  const { t } = useIdioma()
  const { play } = useSounds()
  const moneda = useRef(null)
  const vuelo = useRef(null)
  const [saliendo, setSaliendo] = useState(false)
  const [fuera, setFuera] = useState(false)
  const [volando, setVolando] = useState(false)
  // Lo que cambia de identidad en cada render no rearma la celebración.
  const manos = useRef({ play, onPildora, onFin })
  useEffect(() => { manos.current = { play, onPildora, onFin } })

  useEffect(() => {
    const relojes = []
    let raf = 0
    let brilla = false
    const en = (ms, fn) => relojes.push(setTimeout(fn, ms))
    const pinta = (cifra) => manos.current.onPildora?.({ id: cel.id, cifra, brilla })
    const destino = () => document.querySelector('.lob-pildora .lob-moneda .chip-token')
    const conVuelo = !reducidoAhora() && destino() !== null

    const lanzar = () => {
      const origen = moneda.current?.getBoundingClientRect()
      const fin = destino()?.getBoundingClientRect()
      const el = vuelo.current
      if (!origen || !fin || !el) return
      setVolando(true)
      el.style.left = `${origen.left}px`
      el.style.top = `${origen.top}px`
      el.style.width = `${origen.width}px`
      el.style.height = `${origen.height}px`
      const dx = fin.left + fin.width / 2 - (origen.left + origen.width / 2)
      const dy = fin.top + fin.height / 2 - (origen.top + origen.height / 2)
      const k = fin.width / origen.width
      const arco = Math.min(60, Math.abs(dx) * 0.25 + 18)
      el.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5 - arco}px, ${dy * 0.5}px) scale(${(1 + k) / 2})`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0.9 },
      ], { duration: TRASPASO_MS, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' })
    }

    const contar = () => {
      const t0 = performance.now()
      const paso = () => {
        const p = Math.min(1, (performance.now() - t0) / TIEMPOS_CEL.conteo)
        pinta(valorEntre(cel.desde, cel.hasta, p))
        if (p < 1) raf = requestAnimationFrame(paso)
      }
      paso()
    }

    if (conVuelo) {
      en(TIEMPOS_CEL.vuelo, lanzar)
      en(TIEMPOS_CEL.vuelo + TRASPASO_MS, () => {
        setVolando(false)
        manos.current.play('chipsCollect')
        brilla = true
        contar()
        en(BRILLO_MS, () => { brilla = false; pinta(cel.hasta) })
      })
    } else {
      en(TIEMPOS_CEL.sinVuelo, () => {
        manos.current.play('chipsCollect')
        pinta(cel.hasta)
      })
    }
    en(TIEMPOS_CEL.sale, () => setSaliendo(true))
    en(TIEMPOS_CEL.fin, () => { setFuera(true); manos.current.onFin?.(cel.id) })
    return () => { relojes.forEach(clearTimeout); cancelAnimationFrame(raf) }
  }, [cel])

  return (
    <div className={`vid-cel${saliendo ? ' is-sale' : ''}`} data-accion="video-celebracion" role="status" aria-live="polite">
      {!fuera && (
        <div className="vid-cel-tarjeta">
          <span className="vid-cel-moneda" ref={moneda}><ChipToken size="hero" /></span>
          <b className="vid-cel-premio" data-accion="video-cel-premio">{t('video.premio.corto', { hc: montoTexto(cel.premio) })}</b>
          <span className="vid-cel-sub">{t('video.cel.sub')}</span>
          <span className="vid-quedan" data-accion="video-quedan">{contador ?? ' '}</span>
        </div>
      )}
      <span className="vid-cel-vuelo" ref={vuelo} style={{ visibility: volando ? 'visible' : 'hidden' }} aria-hidden="true">
        <ChipToken size="hero" />
      </span>
    </div>
  )
}
