import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import '../styles/salas.css'
import '../styles/panelMot1.css'

import BarraSuperior from '../components/BarraSuperior'
import HojaConfiguracion from '../components/HojaConfiguracion'
import { IconoCasa } from '../components/IconosSalas'
import { useIdioma } from '../hooks/useIdioma'
import { montoTexto } from '../config/tapetes'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
import { costoDe, esLegal } from '../engine/pozos'
import { supabase } from '../lib/supabase'
import {
  CLASE_PAUSA_ANUNCIO, ETAPA_ELECCION, FASE_DESCARTE, FASE_FIN, FASE_SORTEO, crearClientePartida, leerMarcaMot1,
} from '../lib/partidaCliente'

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
//
// ── MOT-1 1f · El panel de prueba ──────────────────────────────────────────
// Ficha: AJILEI_MOT-1_Fase1f_v1.0.md §3. Con la marca `?mot1=1`, el cuerpo del stub
// cede su sitio a un panel, feo a propósito, para jugar por el servidor con dos
// teléfonos. No es la mesa: la mesa es de MES-PvP, y entonces este panel se va.
//
// Sus textos viven aquí y no en `textos.es.js`, que viaja en la entrada (INV-84): son
// de una herramienta que nunca ve un jugador sin la marca.

const carta = (c) => `${c.name} de ${c.palo}`
const cartas = (lista) => lista.map(carta).join(' · ')

const SIN_K = [
  ['pasar', 'Pasar'], ['igualar', 'Igualar'], ['allIn', 'All-in'], ['retirarse', 'Retirarse'],
]
const CON_K = [['apostar', 'Apostar'], ['subir', 'Subir']]
const FASES_APUESTA = ['BET_1', 'BET_2', 'BET_3']

function BotonApuesta({ vista, tipo, k, rotulo, enviar }) {
  const juicio = esLegal(vista, vista.asiento, tipo, k)
  const costo = costoDe(vista, vista.asiento, tipo, k)
  return (
    <button
      type="button"
      className={juicio.ok ? '' : 'es-ilegal'}
      data-mot1={k === undefined ? tipo : `${tipo}-${k}`}
      onClick={() => enviar('apostar', k === undefined ? { tipo } : { tipo, k })}
    >
      {rotulo}{costo > 0 ? ` (${montoTexto(costo)})` : ''}
    </button>
  )
}

function Apuestas({ vista, enviar }) {
  return (
    <section className="mot1-bloque" data-mot1="apuestas">
      <h2>Apuesta</h2>
      <div className="mot1-botones">
        {SIN_K.map(([tipo, rotulo]) => (
          <BotonApuesta key={tipo} vista={vista} tipo={tipo} rotulo={rotulo} enviar={enviar} />
        ))}
      </div>
      {CON_K.map(([tipo, rotulo]) => (
        <div key={tipo} className="mot1-botones">
          {AJILEI_CONFIG.betting.multiplicadores.map((k) => (
            <BotonApuesta key={k} vista={vista} tipo={tipo} k={k} rotulo={`${rotulo} ×${k}`} enviar={enviar} />
          ))}
        </div>
      ))}
    </section>
  )
}

function Descarte({ vista, propio, enviar }) {
  const [marcadas, setMarcadas] = useState([])
  const yaDescarto = vista.descarte.yaDescartaron.includes(vista.asiento)
  const alternar = (i) => setMarcadas((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))
  return (
    <section className="mot1-bloque" data-mot1="descarte">
      <h2>Descarte · hasta {vista.handRules.maxDiscard}</h2>
      <div className="mot1-botones">
        {(propio.cards ?? []).map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={marcadas.includes(i) ? 'es-marcada' : ''}
            data-mot1={`marcar-${i}`}
            onClick={() => alternar(i)}
          >
            {carta(c)}
          </button>
        ))}
      </div>
      <div className="mot1-botones">
        <button
          type="button"
          data-mot1="descartar"
          disabled={yaDescarto}
          onClick={() => enviar('descartar', { mano: vista.handCount, indices: marcadas })}
        >
          {yaDescarto ? 'Ya descartaste' : `Descartar ${marcadas.length}`}
        </button>
      </div>
      <p className="mot1-tenue">Ya descartaron: {vista.descarte.yaDescartaron.map((i) => `#${i}`).join(' ') || 'nadie'}</p>
    </section>
  )
}

function Sorteo({ vista, enviar }) {
  const { sorteo, players } = vista
  const nombre = (i) => `#${i} ${players[i].name}`
  const yaElegi = sorteo.yaEligieron.includes(vista.asiento)
  return (
    <section className="mot1-bloque" data-mot1="sorteo">
      <h2>Sorteo · ronda {sorteo.ronda} · {sorteo.etapa}</h2>
      <div className="mot1-botones">
        {sorteo.posiciones.map((p) => (
          <button
            key={p}
            type="button"
            data-mot1={`posicion-${p}`}
            disabled={sorteo.etapa !== ETAPA_ELECCION || yaElegi}
            onClick={() => enviar('elegir_carta_sorteo', { ronda: sorteo.ronda, carta: p })}
          >
            {p + 1}
          </button>
        ))}
      </div>
      <p className="mot1-tenue">Ya eligieron: {sorteo.yaEligieron.map(nombre).join(' · ') || 'nadie'}</p>
      <ul className="mot1-lista" data-mot1="rondas">
        {sorteo.rondas.map((r) => (
          <li key={r.ronda}>
            Ronda {r.ronda}: {r.volteo.map((v) => `${nombre(v.asiento)} ${carta(v.carta)}`).join(' · ')}
            {' → '}
            {r.mano === null ? `empate: ${r.empatados.map(nombre).join(' · ')}` : `Mano: ${nombre(r.mano)}${r.azar ? ' (al azar)' : ''}`}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Resultado({ vista }) {
  const { resultado, players } = vista
  return (
    <section className="mot1-bloque" data-mot1="resultado">
      <h2>Resultado · gana #{resultado.ganador} {players[resultado.ganador]?.name}</h2>
      {resultado.revelacion
        ? (
          <ul className="mot1-lista" data-mot1="revelacion">
            {resultado.revelacion.map((r) => (
              <li key={r.asiento}>#{r.asiento} {players[r.asiento].name}: {cartas(r.cards)}</li>
            ))}
          </ul>
        )
        : <p className="mot1-tenue">Sin revelación: los demás se retiraron.</p>}
    </section>
  )
}

function estadoDeAsiento(p, i, vista) {
  return [
    i === vista.asiento ? 'yo' : null,
    i === vista.manoIndex ? 'Mano' : null,
    i === vista.pieIndex ? 'Pie' : null,
    p.folded ? 'retirado' : null,
    p.allIn ? 'all-in' : null,
    p.eliminated ? 'eliminado' : null,
    p.abandonado ? 'abandonó' : null,
    p.enAnuncio ? 'en anuncio' : null,
    p.ausente ? 'ausente' : null,
    p.cobrado !== null ? `cobró ${montoTexto(p.cobrado)}` : null,
  ].filter(Boolean).join(' · ')
}

function Vista({ vista, ahora, enviar }) {
  const propio = vista.players[vista.asiento]
  const apostando = FASES_APUESTA.includes(vista.phase)
  // Fuera de las rondas de apuesta, `activePlayerIndex` es el último que habló, no un turno.
  const turno = apostando ? vista.players[vista.activePlayerIndex] : null
  const restan = vista.vencimiento ? Math.max(0, Math.ceil((vista.vencimiento.hora - ahora) / 1000)) : null
  return (
    <>
      <section className="mot1-bloque" data-mot1="estado">
        <p>Asiento #{vista.asiento} · versión <b data-mot1="version">{vista.version}</b> · mano {vista.handCount}</p>
        <p>Fase <b data-mot1="fase">{vista.phase}</b>{turno ? <> · turno de #{vista.activePlayerIndex} {turno.name}</> : null}</p>
        <p data-mot1="vencimiento">{vista.vencimiento ? `${vista.vencimiento.clase}: ${restan} s` : 'Sin vencimiento'}</p>
        <p>Pozo {montoTexto(vista.pot)} · apuesta viva {montoTexto(vista.currentBet)} · unidad {montoTexto(vista.unit)}</p>
        <p data-mot1="ultima-accion">Última acción: {vista.ultimaAccion ? JSON.stringify(vista.ultimaAccion) : 'ninguna'}</p>
        {vista.vencimiento?.clase === CLASE_PAUSA_ANUNCIO && propio.enAnuncio
          ? (
            <div className="mot1-botones">
              <button type="button" data-mot1="volver-anuncio" onClick={() => enviar('volver_anuncio', { mano: vista.handCount })}>
                Volví del anuncio
              </button>
            </div>
          )
          : null}
      </section>

      <section className="mot1-bloque" data-mot1="cartas">
        <h2>Mis cartas</h2>
        <p data-mot1="mis-cartas">{propio.cards?.length ? cartas(propio.cards) : 'Ninguna'}</p>
      </section>

      <section className="mot1-bloque" data-mot1="asientos">
        <h2>Mesa</h2>
        <ul className="mot1-lista">
          {vista.players.map((p, i) => (
            <li key={i} data-mot1={`asiento-${i}`}>
              #{i} {p.name}: pila {montoTexto(p.chips)} · puso {montoTexto(p.contrib)} · {p.numCartas} cartas
              {estadoDeAsiento(p, i, vista) ? ` · ${estadoDeAsiento(p, i, vista)}` : ''}
            </li>
          ))}
        </ul>
      </section>

      {vista.phase === FASE_SORTEO || vista.handCount === 1 ? <Sorteo vista={vista} enviar={enviar} /> : null}
      {apostando ? <Apuestas vista={vista} enviar={enviar} /> : null}
      {vista.phase === FASE_DESCARTE && !propio.folded
        ? <Descarte key={vista.handCount} vista={vista} propio={propio} enviar={enviar} />
        : null}
      {vista.resultado ? <Resultado vista={vista} /> : null}
    </>
  )
}

function PanelMot1({ mesa, refrescarSaldo }) {
  const control = useMemo(() => crearClientePartida({ cliente: supabase, mesa }), [mesa])
  const foto = useSyncExternalStore(control.suscribir, control.foto, control.foto)
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    control.iniciar()
    return control.parar
  }, [control])

  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 250)
    return () => clearInterval(reloj)
  }, [])

  // La píldora no relee sola al sentarse ni al cobrar: con esto, el saldo de la barra
  // es el del servidor al entrar y al salir de la mesa.
  const { vista } = foto
  const cobrado = vista?.players?.[vista.asiento]?.cobrado ?? null
  useEffect(() => { refrescarSaldo?.() }, [cobrado, refrescarSaldo])

  const medida = (ms) => (ms === null ? '—' : `${ms} ms`)
  const terminada = vista?.phase === FASE_FIN

  return (
    <div className="sal-cuerpo mot1" data-mot1="panel">
      <section className="mot1-bloque" data-mot1="red">
        <p className="mot1-tenue">Mesa {mesa}</p>
        <p>Mi última acción: <b data-mot1="ms-accion">{medida(foto.msAccion)}</b> · su aviso: <b data-mot1="ms-eco">{medida(foto.msEco)}</b></p>
        <p>Aviso → vista nueva: <b data-mot1="ms-aviso">{medida(foto.msAviso)}</b></p>
        <p className="mot1-tenue">Canal <span data-mot1="canal">{foto.canal}</span> · avisos <span data-mot1="avisos">{foto.avisos}</span></p>
        <p className="mot1-rechazo" data-mot1="rechazo">
          {foto.rechazo ? `Último rechazo: ${foto.rechazo.accion} → ${foto.rechazo.motivo}` : 'Sin rechazos'}
        </p>
      </section>

      {vista
        ? <Vista vista={vista} ahora={ahora} enviar={control.enviar} />
        : <section className="mot1-bloque"><p>Arrancando la partida…</p></section>}

      <section className="mot1-bloque">
        <div className="mot1-botones">
          <button type="button" data-mot1="releer" onClick={() => control.releer()}>Releer</button>
          <button
            type="button"
            data-mot1="abandonar"
            disabled={!vista || terminada || vista.players[vista.asiento].abandonado}
            onClick={() => control.enviar('abandonar')}
          >
            Abandonar
          </button>
        </div>
      </section>
    </div>
  )
}

export default function PartidaPvP({ cuenta, billetera = null, sala = null, onLobby }) {
  const { t } = useIdioma()
  // CFG-1 1a · el ⚙ abre la hoja de configuración (antes, «Pronto»).
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const ajustesRef = useRef(null)
  // ECO-1b · la cifra única de `useBilletera` (App); sólo la pinta la píldora.
  const saldo = billetera?.saldo ?? null

  const [toast, setToast] = useState(null)
  const relojToast = useRef(null)
  const [conMarca] = useState(leerMarcaMot1)

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
        onPerfil={cuenta?.abrirPerfil ?? (() => avisar('lob.toast.pronto'))}
        onAjustes={() => setHojaAbierta(true)}
        ajustesRef={ajustesRef}
        ajustesExpandido={hojaAbierta}
      />

      <div className="sal-cab">
        <h1>
          {sala
            ? t('sal.espera.titulo', { n: sala.jugadores, hc: montoTexto(sala.apuesta) })
            : ' '}
        </h1>
      </div>

      {conMarca && sala
        ? <PanelMot1 mesa={sala.id} refrescarSaldo={billetera?.refrescar} />
        : (
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
        )}

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
      {/* CFG-1 1a · la hoja del ⚙, la misma del lobby (`HojaConfiguracion`),
          hija directa de `main.sal` y anclada a su relleno. */}
      <HojaConfiguracion
        abierta={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        ajustesRef={ajustesRef}
        cuenta={cuenta}
      />
    </main>
  )
}
