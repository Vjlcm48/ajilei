import { useRef, useState } from 'react'
import PantallaChips from '../components/PantallaChips'
import ListaTemas from '../guia/ListaTemas'
import { t } from '../config/textos'
import { guia } from '../lib/guia'

// ── TUT-1 T4 · «Aprender por tema»: el índice ───────────────────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.4; normativo AJILEI_Tutorial_v1.5.md §2.1.
// Una vista de «Cómo se juega» (la monta `ComoSeJuega`, en el trozo del tutorial), con
// su carcasa (`PantallaChips`, sin botón dorado): la barra, el ⚙, la flecha (vuelve a
// las tres tarjetas) y la casa (al lobby), como en Retar.
// Las filas 7–10 dijeron «Pronto» hasta la tanda 5; ya abren las diez (`onPronto` queda
// para lo que un día vuelva a faltar). Al terminar un capítulo (P-5) se vuelve aquí, con su ✓.
export default function IndiceTemas({ cuenta, billetera, aviso, onAvisoFin, onVolver, onLobby, onCapitulo }) {
  const carcasa = useRef(null)
  // Se lee al montar: volver de un capítulo terminado monta la pantalla otra vez.
  const [vistos] = useState(() => guia.leer().vistos)
  return (
    <PantallaChips
      titulo={t('tut.hub.temas.titulo')}
      clase="es-tem"
      cuenta={cuenta}
      saldo={billetera?.saldo ?? null}
      estadoSaldo={billetera?.estado}
      recordado={billetera?.recordado ?? null}
      cobrando={billetera?.pendiente === true}
      aviso={aviso}
      onAvisoFin={onAvisoFin}
      onVolver={onVolver}
      onLobby={onLobby}
      cta={null}
      avisoRef={carcasa}
      raiz={{ 'data-tem-vistos': vistos.join(',') }}
    >
      <ListaTemas vistos={vistos} onElegir={(n) => onCapitulo?.(n)} onPronto={() => carcasa.current?.avisar('lob.toast.pronto')} />
    </PantallaChips>
  )
}
