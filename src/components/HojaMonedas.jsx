import { useEffect, useLayoutEffect, useRef } from 'react'
import ChipToken from './ChipToken'
import { IconoPlay, IconoBolsa } from './IconosVideo'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds } from '../hooks/useSounds'
import { montoTexto } from '../config/tapetes'

// ── ECO-1g · La hoja «Conseguir monedas» (G3 b) ─────────────────────────────
// Lámina `laminas/eco1f`, escenas b y g. La abre el «+» dorado de la píldora y
// cuelga de ella, 9 px debajo, como la cápsula del aviso de saldo. Dos filas:
// el video con su contador y su premio, y los paquetes de monedas, apagados con
// «Pronto» hasta que la tienda los llene.
//
// SE COLOCA CONTRA LA PÍLDORA que haya en pantalla (hay una, la de
// `BarraSuperior`): centrada en ella y sin salirse de los márgenes. Con nombres
// largos la píldora se mueve y la hoja la sigue (H-3 de la 1f; lo mide el modo
// `video` del arnés con el peor nombre).
//
// O1 · el contador tiene su renglón siempre: «Te quedan N de 8 hoy», «Vuelven
// en …» y el hueco de «aún no se sabe» ocupan la misma caja.
//
// Se cierra tocando fuera o con Escape.

export default function HojaMonedas({ contador, apagada, premio, onCerrar, onVideo }) {
  const { t } = useIdioma()
  const { play } = useSounds()
  const hoja = useRef(null)
  const titulo = useRef(null)

  useLayoutEffect(() => {
    const el = hoja.current
    if (!el) return undefined
    const colocar = () => {
      const pildora = document.querySelector('.lob-pildora')
      const vw = document.documentElement.clientWidth
      const margen = parseFloat(getComputedStyle(el).getPropertyValue('--vid-margen')) || 16
      const ancho = el.getBoundingClientRect().width
      const pr = pildora?.getBoundingClientRect()
      const centro = pr ? pr.left + pr.width / 2 : vw / 2
      el.style.top = `${((pr ? pr.bottom : 56) + 9).toFixed(1)}px`
      el.style.left = `${Math.max(margen, Math.min(vw - margen - ancho, centro - ancho / 2)).toFixed(1)}px`
    }
    colocar()
    window.addEventListener('resize', colocar)
    return () => window.removeEventListener('resize', colocar)
  }, [])

  useEffect(() => {
    titulo.current?.focus({ preventScroll: true })
    const alPulsar = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onCerrar])

  return (
    <>
      <div className="vid-velo" data-accion="hoja-monedas-velo" onClick={onCerrar} aria-hidden="true" />
      <aside ref={hoja} className="vid-hoja" role="dialog" aria-modal="true" aria-labelledby="vid-hoja-t" data-accion="hoja-monedas">
        <h2 id="vid-hoja-t" className="vid-hoja-t" tabIndex={-1} ref={titulo}>{t('video.hoja.titulo')}</h2>

        <button
          type="button"
          className="vid-fila"
          data-accion="video-pedir"
          disabled={apagada}
          onClick={() => { play('buttonClick'); onVideo() }}
        >
          <span className="vid-fila-ico"><IconoPlay /></span>
          <span className="vid-fila-txt">
            <b>{t('video.hoja.video')}</b>
            <small className="vid-quedan" data-accion="video-quedan">{contador ?? ' '}</small>
          </span>
          <span className="vid-fila-premio"><ChipToken size="icon" />{t('video.premio.corto', { hc: montoTexto(premio) })}</span>
        </button>

        <div className="vid-fila vid-fila-off" data-accion="paquetes" aria-disabled="true">
          <span className="vid-fila-ico"><IconoBolsa /></span>
          <span className="vid-fila-txt"><b>{t('video.hoja.paquetes')}</b></span>
          <span className="vid-pastilla">{t('lob.toast.pronto')}</span>
        </div>
      </aside>
    </>
  )
}
