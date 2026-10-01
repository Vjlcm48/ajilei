import '../styles/cargando.css'
import { useIdioma } from '../hooks/useIdioma'
// `?no-inline` por el mismo motivo que el lobby: el nombre del activo es ID de
// contrato (Identidad A §5.4) y un data URI lo disuelve. Es además el MISMO
// archivo que el lobby pide a continuación, así que lo encuentra en la caché.
import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline'

// ── BIE-1 · El indicador «Cargando» ─────────────────────────────────────────
// Documento rector: AJILEI_BIE-1_Fase1_v1.0 §3.1. Forma elegida por Victor en
// la lámina `laminas/bie1/lamina.html`: **P con isotipo** — el isotipo pequeño
// encima y debajo «Cargando» con tres puntos de oro que laten en secuencia.
// Indeterminado a propósito (D10): no hay progreso que medir.
//
// Lo pinta la rama `CARGANDO` de `App.jsx` y lo gobierna la regla D5
// (`useEsperaVisible`): aparece pasados 300 ms y, si aparece, se queda 500.
//
// SOBRE EL MISMO VERDE. Fondo `--green-abyss` a pantalla completa, el del
// `body`: al aparecer no cambia el color de nada, sólo aparece él. Y no mueve
// nada al aparecer: la caja del isotipo tiene alto y proporción declarados, así
// que si la imagen llega un instante después no empuja el texto.
//
// ACCESIBILIDAD. El contenedor es `role="status"` con `aria-live="polite"`: un
// lector de pantalla anuncia «Cargando» sin interrumpir. El isotipo y los puntos
// son `aria-hidden`: el isotipo es la marca que el lobby nombra un instante
// después, y tres puntos no son texto.
export default function Cargando() {
  const { t } = useIdioma()
  return (
    <div className="cargando">
      <div className="cargando-indicador" role="status" aria-live="polite">
        <img className="cargando-iso" src={isotipoUrl} alt="" aria-hidden="true" draggable="false" />
        <div className="cargando-fila">
          <span className="cargando-texto">{t('app.cargando')}</span>
          <span className="cargando-puntos" aria-hidden="true">
            <span className="cargando-punto" />
            <span className="cargando-punto" />
            <span className="cargando-punto" />
          </span>
        </div>
      </div>
    </div>
  )
}
