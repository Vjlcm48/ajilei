import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import '../styles/salas.css'
import '../styles/pvp.css'

import CardImage from '../components/CardImage'
import { useIdioma } from '../hooks/useIdioma'
import { useMesaPvP } from '../hooks/useMesaPvP'
import { useSounds } from '../hooks/useSounds'
import { listaDeNombres, sonidoDe } from '../hooks/vozHumanos'
import { montoTexto } from '../config/tapetes'
import { cargarMesa, fabricaMesa } from '../lib/cargarMesa'
import { CLASE_DESCARTE, CLASE_TURNO, ETAPA_ELECCION } from '../lib/partidaCliente'
import { reentrar as reentrarPantallaCompleta } from '../lib/pantallaCompletaCore'
import reversoUrl from '../assets/cards/reverso_carta_mesa.svg?no-inline'

// ── MES-PvP 3 · La partida entre personas ───────────────────────────────────
// Ficha: AJILEI_MES-PvP_Fase1-3_v1.0.md §3. Diagnóstico: informe de la Fase 0, §B y §D.
// Releva al stub de SAL-B2 y al panel `?mot1` de MOT-1: aquí se monta LA MESA de las IAS
// (`GameTable`, pedida por `cargarMesa`) con la foto de `useMesaPvP`, y alrededor las capas
// mínimas que la mesa no tiene: el sorteo, la pausa de anuncio, la salida con la mesa viva
// y la partida muerta. El fin de la mesa lo pinta la propia mesa, con su victoria.
//
// Lo que la escena decide (`mesaPvPCore.escenaDe`):
//   arrancando · sorteo · mesa · anuncio (la mesa, con su capa encima) · final (la mesa) ·
//   fuera (quien ya no juega y la mesa sigue) · muerta.
//
// El árbitro imitado (`?pvp=<escena>`) entra solo con la puerta doble DEV + bypass, y por un
// `import()` dentro de ella: en producción la rama es falsa y el módulo no se empaqueta.

const GameTable = lazy(fabricaMesa)

// ── El sorteo, en su forma mínima (§3.2) ───────────────────────────────────
// Cinco cartas boca abajo propias, tocar una, el volteo de cada ronda y su mensaje. Sin
// oleadas ni animación fina: eso es de la sub-tanda 5, tras la lámina. Los textos son los
// sellados (cierre de la sub-tanda 3): quien debe elegir ve la llamada, con su nombre, hasta
// que su ronda tiene veredicto; quien no empató se queda con el texto del empate, en la lista.
function CapaSorteo({ game, reloj, enviar, t }) {
  const { sorteo, players } = game
  const [elegida, setElegida] = useState(null)
  const participo = sorteo.participan.includes(0)
  const yaElegi = sorteo.yaEligieron.includes(0)
  const eligiendo = sorteo.etapa === ETAPA_ELECCION && participo && !yaElegi
  const sinVeredicto = !sorteo.rondas.some((r) => r.ronda === sorteo.ronda)
  const nombre = (i) => players[i].name

  const elegir = (p) => {
    if (!eligiendo) return
    reentrarPantallaCompleta(document, window)   // §3.1: vuelve con el toque de elegir carta
    setElegida({ ronda: sorteo.ronda, p })
    enviar('elegir_carta_sorteo', { ronda: sorteo.ronda, carta: p })
  }

  const mensajeDe = (r) => {
    if (r.mano === null) return t('pvp.sorteo.empate', { lista: listaDeNombres(r.empatados.map(nombre)) })
    if (r.azar) return r.mano === 0 ? t('pvp.sorteo.azar.tu') : t('pvp.sorteo.azar', { nombre: nombre(r.mano) })
    return r.mano === 0 ? t('pvp.sorteo.mano.tu') : t('pvp.sorteo.mano', { nombre: nombre(r.mano) })
  }

  return (
    <div className="sal-cuerpo pvp-sorteo" data-pvp="sorteo">
      {participo && sinVeredicto && (
        <p className="pvp-sorteo-titulo" role="status">
          {t('pvp.sorteo.elige', { nombre: nombre(0) })}
          {eligiendo && reloj.timeLeft !== null ? <span className="pvp-sorteo-reloj"> {reloj.timeLeft}s</span> : null}
        </p>
      )}
      {participo && (
        <div className="pvp-sorteo-cartas" data-pvp="sorteo-cartas">
          {sorteo.posiciones.map((p) => {
            const marcada = elegida?.ronda === sorteo.ronda && elegida.p === p
            return (
              <button
                key={p}
                type="button"
                className={`pvp-carta${marcada ? ' is-elegida' : ''}`}
                data-pvp={`sorteo-carta-${p}`}
                disabled={!eligiendo}
                onClick={() => elegir(p)}
              >
                <img src={reversoUrl} alt="" draggable="false" />
              </button>
            )
          })}
        </div>
      )}
      <ol className="pvp-sorteo-rondas" data-pvp="sorteo-rondas">
        {sorteo.rondas.map((r) => (
          <li key={r.ronda}>
            <div className="pvp-sorteo-volteo">
              {r.volteo.map((v) => (
                <figure key={v.asiento} className="pvp-volteo">
                  <span className="pvp-carta pvp-carta-cara"><CardImage card={v.carta} /></span>
                  <figcaption>{nombre(v.asiento)}</figcaption>
                </figure>
              ))}
            </div>
            <p className="pvp-sorteo-mensaje">{mensajeDe(r)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── La pausa de anuncio, en su forma mínima (§3.2) ─────────────────────────
function CapaAnuncio({ game, enviar, t }) {
  const volver = () => {
    reentrarPantallaCompleta(document, window)   // §3.1: y al cerrar el anuncio
    enviar('volver_anuncio', { mano: game.handCount })
  }
  return (
    <div className="pvp-capa" role="dialog" aria-modal="true" data-pvp="anuncio">
      <p className="pvp-capa-titulo">{t('pvp.anuncio.titulo')}</p>
      <button type="button" className="sal-cta" data-accion="volver-anuncio" onClick={volver}>
        {t('pvp.anuncio.volver')}
      </button>
    </div>
  )
}

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
  // Solo en la primera lectura; si abandona aquí, ve su pantalla de salida.
  const primera = useRef(true)
  useEffect(() => {
    if (!game) return
    if (primera.current && escena === 'fuera' && game.players[0].abandonado) onLobby?.()
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
  const tl = reloj.timeLeft
  useEffect(() => {
    if (propio && tl !== null && tl > 0 && tl <= 5) play('timerWarning')
  }, [propio, tl, play])

  if (escena === 'arrancando' || !game) {
    return <Traje sala={sala} t={t}><Aviso texto={t('pvp.arrancando')} t={t} pvp="arrancando" /></Traje>
  }
  if (escena === 'sorteo') {
    return <Traje sala={sala} t={t}><CapaSorteo game={game} reloj={reloj} enviar={foto.enviar} t={t} /></Traje>
  }
  if (escena === 'muerta') {
    return <Traje sala={sala} t={t}><Aviso texto={t('pvp.muerta')} onLobby={onLobby} t={t} pvp="muerta" /></Traje>
  }
  if (escena === 'fuera') {
    const cobrado = game.players[0].cobrado
    const texto = cobrado === null
      ? t('pvp.fuera.cobrando')
      : cobrado > 0 ? t('pvp.fuera.cobrado', { hc: montoTexto(cobrado) }) : t('pvp.fuera.sin')
    return <Traje sala={sala} t={t}><Aviso texto={texto} onLobby={onLobby} t={t} pvp="fuera" /></Traje>
  }

  // mesa · anuncio · final: la misma mesa, montada una sola vez.
  return (
    <Suspense fallback={<Traje sala={sala} t={t}><Aviso texto={t('pvp.arrancando')} t={t} pvp="arrancando" /></Traje>}>
      <GameTable
        stake={game.unit}
        numPlayers={game.numPlayers}
        cuenta={cuenta ? { username: cuenta.username, correo: cuenta.correo } : null}
        saldo={billetera?.saldo ?? 0}
        tapetes={tapetes}
        partida={foto}
        onLeave={onLobby}
      />
      {escena === 'anuncio' && <CapaAnuncio game={game} enviar={foto.enviar} t={t} />}
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
