import { useState } from 'react'
import { createPortal } from 'react-dom'
import { SoundButton } from '../components/SoundButton'
import { t } from '../config/textos'
import { reentrar as reentrarPantallaCompleta } from '../lib/pantallaCompletaCore'
import { textoEnAnuncio } from '../lib/entreManosCore'

// ── MES-PvP L-M 3 · §3 · La pausa de anuncio con su tarjeta ─────────
// Sellado por Victor (2026-11-04 y 2026-11-05): la pausa cae antes de las manos 6, 12, 17, 23…
// y dura hasta que todos vuelven o vencen 45 s.
//   · Tu anuncio: simulado (todavía no hay red de anuncios), con «Omitir».
//   · Si vuelves antes: una tarjeta que dice quién sigue en el anuncio, la frase sellada y
//     «Quitar publicidad», que abre ahí mismo «Premium · Pronto», sin salir de la mesa.
//     Centrada sobre la mesa, con velo (variante a, elegida por Victor en el STOP-L).
// Releva a la capa mínima de la sub-tanda 3 (`CapaAnuncio`).

export function AnuncioSimulado({ game, enviar }) {
  const omitir = () => {
    reentrarPantallaCompleta(document, window)   // §3.1 de la sub-tanda 3: y al cerrar el anuncio
    enviar('volver_anuncio', { mano: game.handCount })
  }
  return (
    <div className="pvp-capa pvp-anu" role="dialog" aria-modal="true" data-pvp="anuncio">
      <div className="pvp-anu-pieza" aria-hidden="true">
        <span className="pvp-anu-etiqueta">{t('pvp.anuncio.publicidad')}</span>
      </div>
      <SoundButton className="btn btn-pass pvp-anu-omitir" data-accion="volver-anuncio" onClick={omitir}>
        {t('rnk.suma.omitir')}
      </SoundButton>
    </div>
  )
}

export function EsperaAnuncio({ game, premiumInicial = false }) {
  const [premium, setPremium] = useState(premiumInicial)
  const quien = textoEnAnuncio(game.players)
  const raiz = document.querySelector('.game-table-screen')
  if (!quien || !raiz) return null
  return createPortal(
    <div className="pvp-anu-espera" data-pvp="anuncio-espera">
      <div className="pvp-anu-tarjeta" role="status">
        <p className="pvp-anu-quien">{quien}</p>
        <p className="pvp-anu-frase" data-pvp="anuncio-frase">{t('pvp.anuncio.frase')}</p>
        <button type="button" className="pvp-anu-quitar" data-accion="quitar-publicidad" onClick={() => setPremium(true)}>
          {t('pvp.anuncio.quitar')}
        </button>
        {premium && (
          <div className="pvp-anu-premium" role="dialog" data-pvp="premium">
            <p className="pvp-anu-premium-titulo">{t('pvp.anuncio.premium')}</p>
            <SoundButton className="btn btn-pass" data-accion="cerrar-premium" onClick={() => setPremium(false)}>
              {t('lob.eliminar.cerrar')}
            </SoundButton>
          </div>
        )}
      </div>
    </div>,
    raiz,
  )
}
