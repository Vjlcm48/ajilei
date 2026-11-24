import { useEffect, useMemo, useRef, useState } from 'react'
import { SoundButton } from '../components/SoundButton'
import ChipToken from '../components/ChipToken'
import { t } from '../config/textos'
import { montoTexto } from '../config/tapetes'
import { guia } from '../lib/guia'
import { crearGuiadaApi } from '../lib/guiadaApi'
import { useSounds, precargarSonidos } from '../hooks/useSounds'
import '../styles/senal.css'
import '../styles/guiada.css'

// ── GUI-1 · El cierre de la partida guiada ──────────────────────────────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §1.3 y AJILEI_TUT-1_T3_v1.0.md §2.1; normativo
// AJILEI_Tutorial_v1.5.md §1.4 (mano 3, paso 11) y §1.5. Viaja en el trozo de la
// guiada (`screens/Guiada.jsx`), diferido como ella.
//
// AL MONTARSE PIDE EL PREMIO (`cobrar_guiada()`), y lo pide UNA vez aunque el modo
// estricto de React monte el efecto dos veces: la promesa se guarda en una ref, y el
// segundo montaje escucha la misma. Mientras responde ya se ven «¡Ya sabes jugar!»,
// la frase y los botones. La cifra la decide el servidor:
//   · `pagado`  → LA CELEBRACIÓN: «+2.000 HC» (o «+1.000 HC») grande, con la moneda y
//                 el sonido de las monedas, breve y a la vista; la píldora toma el saldo
//                 que devolvió; la marca `pendientePago` se quita;
//   · `cobrado` → ya lo tenía (segunda guiada): sin cifra y sin celebración;
//   · cualquier otra (sin red, el límite, un error) → «Te lo acreditamos en cuanto
//                 vuelva la conexión»; `pendientePago` se queda y el lobby reintenta
//                 en su siguiente visita (`components/PuertaGuiada.jsx`).
// «Salir» antes del cierre no llega aquí: no pide ni marca nada.
//
// O1: la ranura del premio tiene su alto desde el primer pintado (`visibility`), así
// que la cifra al llegar no mueve los botones.

/**
 * @param {object} p
 * @param {object|null} [p.cliente]  `{ rpc }` del bypass; sin él, Supabase
 * @param {Function} [p.onSaldo]     el saldo que devolvió el pago (la píldora lo toma)
 * @param {Function} p.onJugar  @param {Function} p.onLobby
 */
export default function CierreGuiada({ cliente = null, onSaldo, onJugar, onLobby }) {
  const api = useMemo(() => crearGuiadaApi(cliente ?? undefined), [cliente])
  const { play } = useSounds()
  const [premio, setPremio] = useState({ fase: 'pidiendo', monto: 0 })
  const pedido = useRef(null)
  const salidas = useRef({ onSaldo, play })
  useEffect(() => { salidas.current = { onSaldo, play } })

  useEffect(() => {
    precargarSonidos(['chipsCollect'])
    if (!pedido.current) {
      guia.marcarPendiente()
      // Lo que hace el resultado con el aparato y la píldora pasa UNA vez, aunque la
      // pantalla ya no esté (se volvió al lobby antes de que contestara).
      pedido.current = api.cobrar().then((r) => {
        if (r.estado === 'pagado' || r.estado === 'cobrado') guia.quitarPendiente()
        if (r.estado === 'pagado' && r.saldo !== null) salidas.current.onSaldo?.(r.saldo)
        return r
      })
    }
    let vivo = true
    pedido.current.then((r) => {
      if (!vivo) return
      if (r.estado === 'pagado') {
        setPremio({ fase: 'pagado', monto: r.monto })
        salidas.current.play('chipsCollect')
      } else {
        setPremio({ fase: r.estado === 'cobrado' ? 'cobrado' : 'sinred', monto: 0 })
      }
    })
    return () => { vivo = false }
  }, [api])

  const cifra = premio.fase === 'pagado' ? montoTexto(premio.monto) : '0'
  return (
    <main className="guia-cierre" data-guia-cierre="" data-guia-premio={premio.fase}>
      <section className="guia-cierre-tarjeta" aria-labelledby="guia-cierre-titulo">
        <h1 id="guia-cierre-titulo" className="guia-cierre-titulo">{t('tut.cierre.titulo')}</h1>
        <p className="guia-cierre-texto">{t('tut.cierre.texto')}</p>
        {/* La ranura del premio: con alto desde el principio, la cifra o el aviso dentro. */}
        <div className={`guia-cierre-recompensa is-${premio.fase}`} data-guia-recompensa="" role="status" aria-live="polite">
          {premio.fase === 'sinred'
            ? <p className="guia-premio-aviso">{t('tut.cierre.sinred')}</p>
            : (
              <p className="guia-premio" aria-label={premio.fase === 'pagado' ? t('tut.cierre.premio.aria', { monto: cifra }) : undefined}
                style={premio.fase === 'pagado' ? undefined : { visibility: 'hidden' }} aria-hidden={premio.fase === 'pagado' ? undefined : 'true'}>
                <ChipToken size="full" />
                <span className="guia-premio-cifra">{t('tut.cierre.premio', { monto: cifra })}</span>
              </p>
            )}
        </div>
        <div className="guia-cierre-botones">
          <SoundButton type="button" className="tut-btn tut-btn--pri" data-accion="guia-jugar" onClick={onJugar}>{t('tut.cierre.jugar')}</SoundButton>
          <SoundButton type="button" className="tut-btn tut-btn--sec" data-accion="guia-lobby" onClick={onLobby}>{t('tut.cierre.lobby')}</SoundButton>
        </div>
      </section>
    </main>
  )
}
