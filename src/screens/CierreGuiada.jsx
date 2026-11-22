import { useEffect } from 'react'
import { SoundButton } from '../components/SoundButton'
import { t } from '../config/textos'
import { guia } from '../lib/guia'
import '../styles/senal.css'
import '../styles/guiada.css'

// ── GUI-1 · El cierre de la partida guiada ──────────────────────────────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §1.3; normativo §1.3, mano 3, paso 9. Viaja en el
// trozo de la guiada (`screens/Guiada.jsx`), diferido como ella.
//
// Al montarse marca la guiada como hecha en ESTE aparato (`ajilei.guia`, INV-12):
// la oferta del primer login (tanda 3) ya no insiste. «Salir» no llega aquí y
// no la marca.
export default function CierreGuiada({ onJugar, onLobby }) {
  useEffect(() => { guia.marcarHecha() }, [])
  return (
    <main className="guia-cierre" data-guia-cierre="">
      <section className="guia-cierre-tarjeta" aria-labelledby="guia-cierre-titulo">
        <h1 id="guia-cierre-titulo" className="guia-cierre-titulo">{t('tut.cierre.titulo')}</h1>
        <p className="guia-cierre-texto">{t('tut.cierre.texto')}</p>
        {/* Tanda 3 · el hueco de la recompensa al completar (§1.5): vacío hasta que
            la tanda 3 la encienda. No reserva alto. */}
        <div className="guia-cierre-recompensa" data-guia-recompensa="" />
        <div className="guia-cierre-botones">
          <SoundButton type="button" className="tut-btn tut-btn--pri" data-accion="guia-jugar" onClick={onJugar}>{t('tut.cierre.jugar')}</SoundButton>
          <SoundButton type="button" className="tut-btn tut-btn--sec" data-accion="guia-lobby" onClick={onLobby}>{t('tut.cierre.lobby')}</SoundButton>
        </div>
      </section>
    </main>
  )
}
