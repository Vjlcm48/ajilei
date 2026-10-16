import { useCallback, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'

import BarraSuperior from '../components/BarraSuperior'
import { IconoCasa } from '../components/IconosSalas'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'

// ── SAL-B2 F1b · PartidaPvP · STUB ──────────────────────────────────────────
// Rector: AJILEI_SAL-B2_Fase1b_v1.0.md §5. Decisión de Victor (11-sep-2026):
// el destino de una mesa que arrancó es una PANTALLA propia (`screen
// 'partida-pvp'`), no un estado más de la sala de espera, para que MES-PvP la
// releve con su propio nombre y su propio motor sin tocar la sala.
//
// ── LO QUE ES Y LO QUE NO ES ───────────────────────────────────────────────
// Es el mismo traje de las pantallas de salas —fondo, barra, cabecera, casa,
// toast— con un solo rótulo en el centro y un solo CTA. No reparte cartas, no
// lee `estado_partida`, no se suscribe a nada: una mesa 'activa' sin partida
// es, hasta MES-PvP, una mesa muerta que el barrido cancela a los diez minutos
// (`ACTIVA_SIN_PARTIDA_MIN`), y este stub no finge lo contrario.

export default function PartidaPvP({ cuenta, billetera = null, sala = null, onLobby }) {
  const { t } = useIdioma()
  // ECO-1b · la cifra única de `useBilletera` (App); sólo la pinta la píldora.
  const saldo = billetera?.saldo ?? null

  const [toast, setToast] = useState(null)
  const relojToast = useRef(null)

  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])

  useEffect(() => () => clearTimeout(relojToast.current), [])

  const avisar = useCallback((claveTexto) => {
    setToast(claveTexto)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <main className="sal">
      <div className="sal-fondo" aria-hidden="true" />

      <BarraSuperior
        usuario={cuenta?.username ?? ''}
        saldo={saldo}
        estadoSaldo={billetera?.estado}
        recordado={billetera?.recordado ?? null}
        cobrando={billetera?.pendiente === true}
        onPerfil={() => avisar('lob.toast.pronto')}
        onAjustes={() => avisar('lob.toast.pronto')}
      />

      <div className="sal-cab">
        <h1>
          {sala
            ? t('sal.espera.titulo', { n: sala.jugadores, hc: montoTexto(sala.apuesta) })
            : ' '}
        </h1>
      </div>

      <div className="sal-cuerpo sal-partida">
        <p className="sal-partida-pronto" data-accion="pronto" role="status">
          {t('sal.partida.pronto')}
        </p>
        <section className="sal-accion">
          <button type="button" className="sal-cta" data-accion="cta" onClick={() => onLobby?.()}>
            {t('sal.partida.volver')}
          </button>
          <small data-accion="cta-nota"> </small>
        </section>
      </div>

      <button
        type="button"
        className="sal-casa"
        data-accion="casa"
        aria-label={t('sal.casa.aria')}
        onClick={() => onLobby?.()}
      >
        <IconoCasa />
      </button>

      <div className={`sal-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast !== null ? t(toast) : ' '}
      </div>
    </main>
  )
}
