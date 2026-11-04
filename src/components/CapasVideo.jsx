import { createPortal } from 'react-dom'
import '../styles/video.css'

import CapaVideo from './CapaVideo'
import GuardandoVideo from './GuardandoVideo'
import SinVideo from './SinVideo'
import CelebracionVideo from './CelebracionVideo'
import { FASES_CONTROL } from '../lib/controlVideo'

// ── PES-1 · Las capas del video de recompensa, en su trozo ──────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §3-B. Salen de `MarcoVideo`, que se queda en
// la entrada como cascarón: el contexto y la suscripción al canal. Se pide el
// trozo al pedir el video (`precargar` del canal, `App`), y el canal no arranca
// el reloj hasta tenerlo.
//
// LAS CAPAS VAN EN <body> (portal), como la cápsula del aviso de saldo: son
// `position: fixed`, y un antecesor con `transform` las anclaría a él.
export default function CapasVideo({ control, foto, sesion, cel, avisoEnCurso, premio, tope, contador, onPildora }) {
  return createPortal(
    <div className="vid-raiz">
      {sesion && <CapaVideo key={sesion.id} reproductor={control.reproductor} sesion={sesion} premio={premio} />}
      {foto.fase === FASES_CONTROL.COBRANDO && (
        <GuardandoVideo premio={premio} salible={foto.salible} onSalir={control.salirDelCobro} />
      )}
      {foto.fase === FASES_CONTROL.SIN && <SinVideo total={tope} onVolver={control.cerrarSin} />}
      {/* Si hay un aviso de saldo en curso, espera a que termine: nunca los
          dos a la vez sobre la píldora. */}
      {cel && !avisoEnCurso && (
        <CelebracionVideo key={cel.id} cel={cel} contador={contador} onPildora={onPildora} onFin={control.finCelebracion} />
      )}
    </div>,
    document.body,
  )
}
