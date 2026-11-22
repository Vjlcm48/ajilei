import { useEffect, useMemo, useRef, useState } from 'react'
import PantallaChips from '../components/PantallaChips'
import { IconoLibro } from '../components/IconosLobby'
import { sumarTextos, t } from '../config/textos'
import { TEXTOS_TUT_COMUNES, TEXTOS_TUT_HUB } from '../config/textos.tut.es'
import { montoTexto } from '../config/tapetes'
import { crearGuiadaApi, premioDisponible } from '../lib/guiadaApi'
import '../styles/comoSeJuega.css'

// ── TUT-1 T3 · La pantalla «Cómo se juega» ─────────────────────────────────
// Rector: AJILEI_TUT-1_T3_v1.0.md §2.2; normativo AJILEI_Tutorial_v1.4.md §2.1.
// Pantalla diferida (viaja en el trozo de la guiada, `lib/trozos.guiada`), con la carcasa de Rankings
// (`PantallaChips` sin botón dorado): la barra, el ⚙, la flecha y la casa.
// Sustituye la entrada directa a la guiada de la tanda 2: el botón del lobby abre esto.
//
// TRES TARJETAS GRANDES: una por fila en el teléfono vertical, en fila en el acostado
// y la PC (`comoSeJuega.css`).
//   1. «Partida guiada» · «3 manos · 2 min» · la cifra del servidor («Gana 2.000 HC»)
//      o «✓ Hecha». Toca → la mesa guiada (la rama `guiada` de la tanda 2). Es la única
//      con el oro sólido (regla del oro único).
//   2. «Aprender por tema» · «Pronto» (los diez capítulos, tanda 4).
//   3. «Pregúntale a Mia» · «Pronto» (ASI-1).
// Lo que aún no existe dice «Pronto» en la tarjeta y con el toast del lobby al tocarla.
//
// La línea del premio reserva su caja desde el primer pintado (O1): la cifra llega
// sin mover nada. Si el servidor no contesta, la tarjeta sale sin cifra.

sumarTextos('es', { ...TEXTOS_TUT_COMUNES, ...TEXTOS_TUT_HUB })

export default function ComoSeJuega({ cliente = null, cuenta, billetera, aviso, onAvisoFin, onVolver, onLobby, onGuiada }) {
  const api = useMemo(() => crearGuiadaApi(cliente ?? undefined), [cliente])
  const [estado, setEstado] = useState(null)
  const carcasa = useRef(null)

  useEffect(() => {
    let vivo = true
    api.estado().then((r) => { if (vivo) setEstado(r) })
    return () => { vivo = false }
  }, [api])

  const pronto = () => carcasa.current?.avisar('lob.toast.pronto')
  const premio = premioDisponible(estado)
    ? t('tut.hub.guiada.premio', { monto: montoTexto(estado.monto) })
    : estado?.estado === 'cobrado' ? t('tut.hub.guiada.hecha') : null

  return (
    <PantallaChips
      titulo={t('tut.capa.aria')}
      clase="es-csj"
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
      raiz={{ 'data-csj-premio': estado === null ? 'esperando' : (premioDisponible(estado) ? 'disponible' : estado.estado) }}
    >
      <ul className="csj-tarjetas">
        <li>
          <button type="button" className="csj-tarjeta csj-tarjeta--guiada" data-accion="csj-guiada" onClick={() => onGuiada?.()}>
            <IconoGuiada />
            <span className="csj-tarjeta-txt">
              <span className="csj-tarjeta-titulo">{t('tut.guiada.nombre')}</span>
              <span className="csj-tarjeta-sub">{t('tut.hub.guiada.sub')}</span>
              <span className="csj-tarjeta-premio" style={premio ? undefined : { visibility: 'hidden' }}>{premio ?? ' '}</span>
            </span>
          </button>
        </li>
        <li>
          <button type="button" className="csj-tarjeta" data-accion="csj-temas" onClick={pronto}>
            <IconoLibro className="csj-ico" />
            <span className="csj-tarjeta-txt">
              <span className="csj-tarjeta-titulo">{t('tut.hub.temas.titulo')}</span>
              <span className="csj-tarjeta-sub">{t('tut.hub.temas.sub')}</span>
              <span className="csj-pronto">{t('tut.hub.pronto')}</span>
            </span>
          </button>
        </li>
        <li>
          <button type="button" className="csj-tarjeta" data-accion="csj-mia" onClick={pronto}>
            <IconoMia />
            <span className="csj-tarjeta-txt">
              <span className="csj-tarjeta-titulo">{t('tut.hub.mia.titulo')}</span>
              <span className="csj-tarjeta-sub">{t('tut.hub.mia.sub')}</span>
              <span className="csj-pronto">{t('tut.hub.pronto')}</span>
            </span>
          </button>
        </li>
      </ul>
    </PantallaChips>
  )
}

// Los dos iconos propios, del trazo de `IconosLobby` (currentColor, 24 de caja).
function IconoGuiada() {
  return (
    <svg className="csj-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.5" y="4.5" width="10" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(-8 8.5 11.5)" />
      <rect x="10.5" y="5.5" width="10" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(8 15.5 12.5)" />
      <path d="M14 10.2v5.2l4-2.6z" fill="currentColor" />
    </svg>
  )
}

function IconoMia() {
  return (
    <svg className="csj-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="8.5" cy="11" r="1.2" fill="currentColor" />
      <circle cx="12" cy="11" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="11" r="1.2" fill="currentColor" />
    </svg>
  )
}
