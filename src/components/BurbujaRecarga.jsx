// ── REC-1 · La burbuja de la recarga ───────────────────────────────────────
// Normativo: docs/AJILEI_APU-1_Reglas_v1.2.md §5.5. Ficha: AJILEI_REC-1_Fase1
// §3.3. Lámina: REC-1 v1.0, variante C (oscura, filo dorado, reloj en anillo).
//
// La automática y la forzosa ya no se presentan con la tarjeta encima del
// resultado: al terminar la revelación aparece esto, en la ranura reservada de
// «Siguiente mano» y SIN velo, para que la mesa siga a la vista y tocable. Un
// toque abre la tarjeta con el tiempo que quede.
//
// El componente no sabe nada del reloj salvo lo que se le pasa: `seg` es el
// MISMO `recargaSeg` que lee la tarjeta (§5.5.4), así que abrir o plegar no
// puede reiniciar nada.
//
// Sin transición en el anillo, a propósito: se actualiza una vez por segundo y
// un trazo que se desliza entre dos segundos diría un tiempo que no es.

import { SoundButton } from './SoundButton'
import { t } from '../config/textos'
import { RECARGA } from '../hooks/mesaCore'
// La Heptacoin del juego, por el mismo import que `ChipToken` (IDN-1: URL
// corta y el archivo sigue siendo un activo de contrato en el build).
import heptacoinUrl from '../assets/heptacoin.svg?no-inline'

// Geometría del anillo, en unidades del viewBox (= px CSS: se pinta a 34 px).
// Vara de la ficha: diámetro ≥ 32 → 34 por E-32.
const LADO = 34
const R = 15
const L = 2 * Math.PI * R

export default function BurbujaRecarga({ motivo, seg, total, onAbrir }) {
  const forzosa = motivo === RECARGA.FORZOSA
  const s = Math.max(0, seg)
  const frac = total > 0 ? Math.min(1, s / total) : 0
  return (
    <SoundButton
      type="button"
      className={`rec-burbuja ${forzosa ? 'rec-forzosa' : 'rec-automatica'}`}
      data-accion="recarga-burbuja"
      data-motivo={motivo}
      data-seg={s}
      aria-label={t(forzosa ? 'ia.recarga.aria.forzosa' : 'ia.recarga.aria.automatica', { s })}
      onClick={onAbrir}
    >
      <span className="rec-anillo" aria-hidden="true">
        <svg viewBox={`0 0 ${LADO} ${LADO}`} width={LADO} height={LADO}>
          <circle className="rec-anillo-fondo" cx={LADO / 2} cy={LADO / 2} r={R} />
          {/* Arranca ARRIBA: el trazo nace a las 3 y se gira −90°. */}
          <circle
            className="rec-anillo-trazo"
            cx={LADO / 2} cy={LADO / 2} r={R}
            strokeDasharray={L}
            strokeDashoffset={L * (1 - frac)}
            transform={`rotate(-90 ${LADO / 2} ${LADO / 2})`}
          />
        </svg>
        <span className="rec-seg">{s}</span>
      </span>
      <span className="rec-icono" aria-hidden="true">
        {forzosa ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M12 3.2 22 20H2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M12 9.5v4.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
            <circle cx="12" cy="17.2" r="1.35" fill="currentColor" />
          </svg>
        ) : (
          <img src={heptacoinUrl} alt="" width="20" height="20" draggable="false" />
        )}
      </span>
      <span className="rec-rotulo">{t('ia.recarga.pedir')}</span>
    </SoundButton>
  )
}
