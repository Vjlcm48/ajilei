import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import '../styles/salas.css'
import '../styles/pvp.css'

import { useIdioma } from '../hooks/useIdioma'
import { useMesaPvP } from '../hooks/useMesaPvP'
import { useSounds } from '../hooks/useSounds'
import { sonidoDe } from '../hooks/vozHumanos'
import { montoTexto } from '../config/tapetes'
import { cargarMesa, fabricaMesa } from '../lib/cargarMesa'
import { CLASE_DESCARTE, CLASE_ELECCION, CLASE_PAUSA_ANUNCIO, CLASE_TURNO } from '../lib/partidaCliente'
import SorteoMesa from './SorteoMesa'
import MensajesMesa from './MensajesMesa'
import { AVISO_RELOJ_S } from '../lib/sorteoMesaCore'
import RecargaPvP from './RecargaPvP'
import { AnuncioSimulado, EsperaAnuncio } from './AnuncioPvP'

// ── MES-PvP 3 · La partida entre personas ───────────────────────────────────
// Ficha: AJILEI_MES-PvP_Fase1-3_v1.0.md §3. Diagnóstico: informe de la Fase 0, §B y §D.
// Releva al stub de SAL-B2 y al panel `?mot1` de MOT-1: aquí se monta LA MESA de las IAS
// (`GameTable`, pedida por `cargarMesa`) con la foto de `useMesaPvP`, y alrededor las capas
// mínimas que la mesa no tiene: el sorteo, la pausa de anuncio, la salida con la mesa viva
// y la partida muerta. El fin de la mesa lo pinta la propia mesa, con su victoria.
//
// Lo que la escena decide (`mesaPvPCore.escenaDe`):
//   arrancando · sorteo · mesa · anuncio (la mesa, con su capa encima) · final (la mesa) ·
//   muerta. Quien ya no juega (abandonó o quebró) va a `final` en el acto (MES-PvP 3-A).
//
// El árbitro imitado (`?pvp=<escena>`) entra solo con la puerta doble DEV + bypass, y por un
// `import()` dentro de ella: en producción la rama es falsa y el módulo no se empaqueta.

const GameTable = lazy(fabricaMesa)

// ── El sorteo, sobre la mesa (lámina L-M 1) ─────────────────────────────────
// La capa del centro se fue: la mesa se monta ya en el sorteo y `SorteoMesa` pinta encima el
// mazo del anfitrión, las cartas y el mensaje, en una franja propia sobre el centro de la mesa.

// ── La pausa de anuncio: la forma de la lámina L-M 3 (`AnuncioPvP.jsx`) ─────

// Las pantallas en el traje de las salas: arrancar, salir con la mesa viva y la mesa muerta.
function Traje({ sala, t, children }) {
  useEffect(() => {
    document.body.classList.add('sal-activa')
    return () => { document.body.classList.remove('sal-activa') }
  }, [])
  return (
    <main className="sal">
      <div className="sal-fondo" aria-hidden="true" />
      <div className="sal-cab">
        <h1>{sala ? t('sal.espera.titulo', { n: sala.jugadores, hc: montoTexto(sala.apuesta) }) : ' '}</h1>
      </div>
      {children}
    </main>
  )
}

function Aviso({ texto, onLobby, t, pvp }) {
  return (
    <div className="sal-cuerpo sal-partida" data-pvp={pvp}>
      <p className="sal-partida-pronto" role="status">{texto}</p>
      {onLobby && (
        <section className="sal-accion">
          <button type="button" className="sal-cta" data-accion="cta" onClick={onLobby}>{t('sal.partida.volver')}</button>
        </section>
      )}
    </div>
  )
}

function MesaViva({ sala, partida, cuenta, billetera, tapetes, onLobby }) {
  const { t } = useIdioma()
  const { play } = useSounds()
  const foto = useMesaPvP({ sala, partida, alCobrar: billetera?.refrescar ?? null })
  const { game, escena, reloj } = foto

  useEffect(() => { cargarMesa().catch(() => {}) }, [])

  // §3.3 · quien vuelve a una partida en la que ya abandonó no tiene nada que ver: al lobby.
  // Solo en la primera lectura; si abandona aquí, ve su pantalla final (MES-PvP 3-A).
  const primera = useRef(true)
  useEffect(() => {
    if (!game) return
    if (primera.current && escena === 'final' && game.players[0].abandonado) onLobby?.()
    primera.current = false
  }, [game, escena, onLobby])

  // La partida muerta devolvió la pila: la píldora relee.
  const refrescar = billetera?.refrescar
  useEffect(() => { if (escena === 'muerta') refrescar?.() }, [escena, refrescar])

  // §3.1 · las jugadas ajenas suenan; las propias ya sonaron al tocar el botón.
  const ultima = game?.ultimaAccion ?? null
  const sonadaRef = useRef(null)
  useEffect(() => {
    if (!ultima || JSON.stringify(ultima) === sonadaRef.current) return
    sonadaRef.current = JSON.stringify(ultima)
    const sonido = sonidoDe(ultima)
    if (sonido) play(sonido)
  }, [ultima, play])

  // Los avisos de ≤ 5 s del reloj propio, al cruzar cada segundo (§B.10).
  const propio = game && (
    (reloj.clase === CLASE_TURNO && game.activePlayerIndex === 0)
    || (reloj.clase === CLASE_DESCARTE && !game.players[0].folded && !game.descarte.yaDescartaron.includes(0))
  )
  // L-M 1 · 3.ª vuelta · y los del sorteo, a los 3 s, mientras te falta elegir (el aviso del
  // turno: el pulso rojo de `.timer-warning` en la capa y este sonido).
  const eligeSorteo = !!game?.sorteo && reloj.clase === CLASE_ELECCION
    && game.sorteo.participan.includes(0) && !game.sorteo.yaEligieron.includes(0)
  const umbral = eligeSorteo ? AVISO_RELOJ_S : 5
  const tl = reloj.timeLeft
  useEffect(() => {
    if ((propio || eligeSorteo) && tl !== null && tl > 0 && tl <= umbral) play('timerWarning')
  }, [propio, eligeSorteo, umbral, tl, play])

  // L-M 1 · en el sorteo el mensaje va en la franja de la capa; la línea de la crónica del
  // óvalo se queda vacía.
  const enSorteo = escena === 'sorteo' && !!game
  // L-M 2 · §4 · tú, ausente (desde el 2.º vencimiento propio seguido): el aviso va en la línea
  // de la crónica hasta que juegues (variante a, elegida por Victor en el STOP-L de la tanda 2).
  const yo = game?.players[0]
  const yoAusente = !!yo?.ausente && !yo.abandonado && escena === 'mesa'
  const cronicaAusente = yoAusente ? t('pvp.ausente.aviso') : null
  // L-M 3 · §2 · la transición la monta `GameTable` (su núcleo vive solo en el trozo de la mesa):
  // aquí solo va el desfase con la hora del árbitro, para que la recogida caiga a su hora.
  const desfase = partida?.foto?.().desfase ?? foto.desfase ?? 0
  const partidaMesa = useMemo(() => ({
    ...foto,
    desfase,
    ...(enSorteo ? { cronica: '' } : cronicaAusente ? { cronica: cronicaAusente } : {}),
  }), [foto, desfase, enSorteo, cronicaAusente])
  const lamina = partida?.lamina ?? null

  if (escena === 'arrancando' || !game) {
    return <Traje sala={sala} t={t}><Aviso texto={t('pvp.arrancando')} t={t} pvp="arrancando" /></Traje>
  }
  if (escena === 'muerta') {
    return <Traje sala={sala} t={t}><Aviso texto={t('pvp.muerta')} onLobby={onLobby} t={t} pvp="muerta" /></Traje>
  }

  // sorteo · mesa · anuncio · final: la misma mesa, montada una sola vez.
  return (
    <Suspense fallback={<Traje sala={sala} t={t}><Aviso texto={t('pvp.arrancando')} t={t} pvp="arrancando" /></Traje>}>
      <GameTable
        stake={game.unit}
        numPlayers={game.numPlayers}
        cuenta={cuenta ? { username: cuenta.username, correo: cuenta.correo } : null}
        saldo={billetera?.saldo ?? 0}
        tapetes={tapetes}
        partida={partidaMesa}
        onLeave={onLobby}
      />
      {enSorteo && <SorteoMesa game={game} reloj={reloj} enviar={foto.enviar} anfitrion={foto.anfitrion} lamina={partida?.lamina ?? null} />}
      {escena === 'anuncio' && <AnuncioSimulado game={game} enviar={foto.enviar} />}
      {/* L-M 3 · §3 · quien volvió antes (centrada con velo); §1 · la recarga. */}
      {escena === 'mesa' && game.vencimiento?.clase === CLASE_PAUSA_ANUNCIO && (
        <EsperaAnuncio game={game} premiumInicial={!!lamina?.premium} />
      )}
      {/* v1.3-b · la recarga lee la vista del árbitro real (o la del imitado, con su misma forma). */}
      {escena === 'mesa' && foto.vista?.recarga && (
        <RecargaPvP foto={foto} saldo={billetera?.saldo ?? 0} lamina={lamina} desfase={desfase} alRecargar={billetera?.refrescar ?? null} />
      )}
      {/* L-M 2 · §2 · los mensajes; durante tu pausa de anuncio no se pintan (Reglas v1.9 §8.6).
          v1.3 · en la mesa real llegan por la foto (`partidaCliente.mensajes`). */}
      <MensajesMesa partida={partida ?? foto} oculta={escena === 'anuncio'} />
    </Suspense>
  )
}

// La fuente de la partida: la mesa real de `sala`, o el árbitro imitado del mando. La URL se
// lee al montar, antes de que nadie limpie la barra.
function leeMandoDev() {
  if (!import.meta.env.DEV || !import.meta.env.VITE_AUTH_BYPASS) return null
  return new URLSearchParams(window.location.search).has('pvp') ? window.location.search : null
}

export default function PartidaPvP({ cuenta, billetera = null, sala = null, tapetes = null, onLobby }) {
  const { t } = useIdioma()
  const [mando] = useState(leeMandoDev)
  const conMando = mando !== null
  const [imitada, setImitada] = useState(null)

  useEffect(() => {
    let vivo = true
    // La condición es constante en producción (`DEV` es `false`): la rama y su `import()` no se
    // empaquetan, y `testDistSinMoldes` lo comprueba sobre `dist/`.
    if (import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS && mando !== null) {
      import('../dev/partidaImitada').then(({ crearPartidaImitada, leerMandoPvP }) => {
        const pedido = leerMandoPvP(mando)
        if (!vivo || !pedido) return
        const p = crearPartidaImitada(pedido)
        window.__pvpImitada = p   // el arnés (`diagDSK pvp`) avanza el guion desde aquí
        setImitada(p)
      })
    }
    return () => { vivo = false }
  }, [mando])

  if (conMando) {
    if (!imitada) return <Traje sala={null} t={t}><Aviso texto={t('pvp.arrancando')} t={t} pvp="arrancando" /></Traje>
    return <MesaViva sala={imitada.sala} partida={imitada} cuenta={cuenta} billetera={billetera} tapetes={tapetes} onLobby={onLobby} />
  }
  if (!sala) return <Traje sala={null} t={t}><Aviso texto={t('pvp.arrancando')} onLobby={onLobby} t={t} pvp="arrancando" /></Traje>
  return <MesaViva sala={sala} partida={null} cuenta={cuenta} billetera={billetera} tapetes={tapetes} onLobby={onLobby} />
}
