import { t } from '../config/textos'
import { BotonSalir } from '../components/CapaSenal'
import { SoundButton } from '../components/SoundButton'
import IconoTema from './IconosTemas'
import { CAPITULOS } from './capitulos'
import { Rico } from './RutaIntro'
import '../styles/ruta.css'

// ── TUT-1 T6 · «Ahora, a jugar» (la ruta de la primera vez, 3 de 4) ───────────
// Rector: AJILEI_TUT-1_T6_v1.0.md §1.1; normativo AJILEI_Tutorial_v1.5.md §1.2.1.
// Entre el capítulo 2 (ya con su ✓) y la mesa guiada. Un solo icono (el de la mesa, el del
// capítulo 3), sin emojis; «Jugar» espera su toque. «Salir» arriba a la derecha: el lobby.

/**
 * @param {object} p
 * @param {Function} p.onJugar «Jugar»: la mesa guiada
 * @param {Function} p.onSalir «Salir»: el lobby
 */
export default function RutaPuente({ onJugar, onSalir }) {
  return (
    <main className="ruta ruta--puente" data-ruta="puente">
      <div className="ruta-tarjeta">
        <IconoTema icono={CAPITULOS[3].icono} n={3} />
        <h1 className="ruta-titulo">{t('tut.ruta.puente.titulo')}</h1>
        <div className="ruta-texto">
          <p className="ruta-frase"><Rico clave="tut.ruta.puente.texto" /></p>
          <p className="ruta-nota">{t('tut.ruta.puente.nota')}</p>
        </div>
        <SoundButton type="button" className="ruta-btn" data-accion="ruta-jugar" onClick={() => onJugar?.()}>
          {t('tut.ctl.jugar')}
        </SoundButton>
      </div>
      <BotonSalir onClick={() => onSalir?.()} />
    </main>
  )
}
