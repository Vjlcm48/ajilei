import { useCallback, useEffect, useRef, useState } from 'react'

// `rankings.css` DESPUÉS de la carcasa, que trae `salas.css`: así la hoja de la
// pantalla va detrás en la cascada.
import PantallaChips from '../components/PantallaChips'
import '../styles/rankings.css'
import FilaChips from '../components/FilaChips'
import MiniPerfil from '../components/MiniPerfil'
import { esPropio } from '../components/miniPerfilCore'
import { IconoTrofeo } from '../components/IconosLobby'
import { useIdioma } from '../hooks/useIdioma'
import { inicialDe } from './salaEsperaCore'
import { PESTANA_INICIAL, estadoDe, textoBanda, cifraTexto, esTu, muestraFin, debeRefrescar } from './rankingsCore'
import heptacoinUrl from '../assets/heptacoin.svg?no-inline'

// ── RNK-1c · La pantalla «Rankings» ─────────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §2.3. Autoridad visual: la lámina
// `laminas/rnk1` con V1 A (banda «Tu posición» fija al pie) y V3 B (filas de
// 56 px con podio), selladas por Victor el 2026-10-24.
//
// La carcasa es `PantallaChips` SIN botón dorado (`cta={null}`) y con la lista
// por dentro (`listaInterna`): barra, cabecera, pestañas, subtítulo y banda
// quietos; desplaza sólo la lista. La banda ocupa la zona anclada (`pie`).
//
// ── LO QUE PIDE Y CUÁNDO ────────────────────────────────────────────────────
// Al montar y en cada cambio de pestaña, `top` y `mio` A LA VEZ. Sin botón de
// refrescar. La respuesta se guarda con la clave de la petición que la pidió
// (pestaña + intento): si cambia la pestaña antes de que llegue, la vieja ni
// se pinta (la limpieza del efecto la descarta) ni se confunde con la nueva.
//
// ── RNK-1d · LA FRESCURA ────────────────────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1d_v1.0.md §2.3. Además, al volver al primer plano
// (`visibilitychange`) se vuelve a pedir la pestaña activa si su última
// consulta tiene un minuto o más (`debeRefrescar`). Es un refresco CALLADO: la
// respuesta entra con la clave que ya se ve, así que no pasa por «Cargando…»,
// las filas siguen montadas (`key` = username) y el `scrollTop` de la lista no
// se toca; si falla, se queda lo que había. Con la tarjeta abierta se refresca
// igual la lista de detrás. El escucha vive aquí y no en `App`: la pantalla es
// dueña de su frescura, y al desmontar se quita. Sin reloj mientras se ve.
//
// ── LO QUE NO HACE ──────────────────────────────────────────────────────────
// No calcula puestos ni franjas, no reordena y no recuerda la pestaña.
//
// ── RNK-1c-ii · EL MINI-PERFIL ──────────────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §2.2. Tocar cualquier fila abre la
// tarjeta de ese jugador (la tuya → la propia); tocar la banda abre la propia,
// también cuando dice «Gana tu primera mano para entrar». Una sola a la vez:
// es un estado de esta pantalla, no un `screen`. Si el jugador ya no existe,
// la tarjeta se va, el toast de la carcasa dice «Jugador no encontrado» y se
// vuelven a pedir `top` y `mio`. Al cerrar, el foco vuelve a lo que la abrió.

// El hueco de la corona Premium (O1): caja reservada e invisible detrás del
// nombre, para que el día que exista no mueva ninguno. Geometría de la lámina.
function Corona() {
  return (
    <svg className="rnk-corona" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
    </svg>
  )
}

function Moneda() {
  return <img className="rnk-moneda" src={heptacoinUrl} alt="" draggable="false" />
}

function Fila({ puesto, username, cifra, fortunas, yo, onJugador, t }) {
  const podio = puesto <= 3
  return (
    <button
      type="button"
      className={`rnk-fila${podio ? ' es-podio' : ''}${yo ? ' es-yo' : ''}`}
      data-accion="rnk-fila"
      data-puesto={puesto}
      onClick={(e) => onJugador?.(username, e.currentTarget)}
    >
      <span className="rnk-pos">
        {podio ? <span className="rnk-medalla">{puesto}</span> : cifraTexto(puesto)}
      </span>
      <span className="rnk-av" aria-hidden="true">{inicialDe(username)}</span>
      <span className="rnk-nom">
        <b>{username}</b>
        {yo && <span className="rnk-yo">{t('rnk.tu.yo')}</span>}
        <Corona />
      </span>
      <span className="rnk-cifra">
        {fortunas && <Moneda />}
        <span>{cifraTexto(cifra)}</span>
      </span>
    </button>
  )
}

export default function Rankings({
  api,
  cuenta,
  billetera = null,
  aviso = null,
  onAvisoFin,
  onVolver,
  onLobby,
}) {
  const { t } = useIdioma()
  const [pestana, setPestana] = useState(PESTANA_INICIAL)
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  // RNK-1c-ii · la tarjeta abierta (`{ username, inicial, propio }`) y lo que la abrió.
  const [perfil, setPerfil] = useState(null)
  const origen = useRef(null)
  const carcasa = useRef(null)

  const clave = `${pestana}:${intento}`
  // RNK-1d · cuándo se pidió por última vez cada pestaña (`Date.now()`).
  const ultimaConsulta = useRef({})
  useEffect(() => {
    let vigente = true
    ultimaConsulta.current[pestana] = Date.now()
    Promise.all([api.top(pestana), api.mio(pestana)]).then(([top, mio]) => {
      if (vigente) setRespuesta({ clave, ranking: pestana, top, mio })
    })
    return () => { vigente = false }
  }, [api, pestana, clave])

  // RNK-1d · la frescura al volver al primer plano (ver la cabecera). El
  // escucha lee la pestaña y la clave de ESTE render por referencia, para no
  // renovarse en cada cambio de pestaña.
  const vista = useRef({ pestana, clave })
  useEffect(() => { vista.current = { pestana, clave } })
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState !== 'visible') return
      const { pestana: p, clave: k } = vista.current
      const ahora = Date.now()
      if (!debeRefrescar({ ultimaConsulta: ultimaConsulta.current[p], ahora })) return
      ultimaConsulta.current[p] = ahora
      Promise.all([api.top(p), api.mio(p)]).then(([top, mio]) => {
        const nueva = { clave: k, ranking: p, top, mio }
        if (vista.current.clave === k && estadoDe(nueva) !== 'sinred') setRespuesta(nueva)
      })
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [api])

  // La respuesta de OTRA petición (la pestaña de antes, el intento de antes)
  // no vale: mientras llega la nueva, «Cargando…».
  const actual = respuesta?.clave === clave ? respuesta : null
  const estado = estadoDe(actual)
  const fortunas = pestana === 'fortunas'
  const usuario = cuenta?.username ?? ''
  const mio = estado === 'listo' || estado === 'vacio' ? actual.mio.mio : null
  const banda = estado === 'listo' || estado === 'vacio' ? textoBanda({ ranking: pestana, mio }) : null

  const onJugador = useCallback((username, el) => {
    origen.current = el ?? null
    setPerfil({ username, inicial: inicialDe(username), propio: esPropio(username, usuario) })
  }, [usuario])
  const cerrarPerfil = useCallback(() => {
    setPerfil(null)
    if (origen.current?.isConnected) origen.current.focus()
  }, [])
  const noHay = useCallback(() => {
    cerrarPerfil()
    carcasa.current?.avisar('rnk.perfil.nohay')
    setIntento((n) => n + 1)
  }, [cerrarPerfil])

  const opciones = [
    { id: 'maestros', etiqueta: <><IconoTrofeo className="rnk-ico" /><span>{t('rnk.pestana.maestros')}</span></> },
    { id: 'fortunas', etiqueta: <><Moneda /><span>{t('rnk.pestana.fortunas')}</span></> },
  ]

  return (
    <PantallaChips
      titulo={t('rnk.titulo')}
      clase="es-rnk"
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
      listaInterna
      raiz={{ 'data-ranking': pestana, 'data-rnk-estado': estado }}
      avisoRef={carcasa}
      pie={(
        <section className="rnk-tu" data-accion="rnk-tu">
          <div className="rnk-tu-l">
            <span>{t('rnk.tu')}</span>
            {/* La línea reserva su alto con o sin frase (O1). */}
            <strong>{banda && mio ? t(banda.clave, banda.vars) : ' '}</strong>
          </div>
          {mio ? (
            <Fila puesto={mio.puesto} username={usuario} cifra={mio.cifra} fortunas={fortunas} yo onJugador={onJugador} t={t} />
          ) : banda ? (
            // Sin puntos todavía, la banda también abre tu tarjeta (§0).
            <button type="button" className="rnk-vacio" data-accion="rnk-tu-abre" onClick={(e) => onJugador(usuario, e.currentTarget)}>
              {t(banda.clave, banda.vars)}
            </button>
          ) : (
            <div className="rnk-hueco" aria-hidden="true" />
          )}
        </section>
      )}
    >
      <FilaChips
        titulo={t('rnk.titulo')}
        accion="rnk-pestana"
        claseChips="rnk-pestanas"
        opciones={opciones}
        valor={pestana}
        onChange={setPestana}
      />

      <p className="rnk-sub">{t(fortunas ? 'rnk.sub.fortunas' : 'rnk.sub.maestros')}</p>

      <div className="rnk-lista sal-desplaza" data-accion="rnk-lista">
        <div className="rnk-cab-lista" aria-hidden="true">
          <span>{t('rnk.col.puesto')}</span>
          <span>{t('rnk.col.jugador')}</span>
          <span>{t(fortunas ? 'rnk.col.hc' : 'rnk.col.puntos')}</span>
        </div>

        {estado === 'cargando' && <p className="rnk-estado" role="status">{t('rnk.cargando')}</p>}

        {estado === 'sinred' && (
          <div className="rnk-estado" role="status">
            <p>{t('rnk.sinred')}</p>
            <button type="button" className="rnk-reintentar" data-accion="rnk-reintentar" onClick={() => setIntento((n) => n + 1)}>
              {t('ia.retar.saldo.reintentar')}
            </button>
          </div>
        )}

        {estado === 'listo' && (
          <>
            <ol className="rnk-filas">
              {actual.top.filas.map((f) => (
                <li key={f.username}>
                  <Fila
                    puesto={f.puesto}
                    username={f.username}
                    cifra={f.cifra}
                    fortunas={fortunas}
                    yo={f.esTu || esTu(f, usuario)}
                    onJugador={onJugador}
                    t={t}
                  />
                </li>
              ))}
            </ol>
            {/* Ajuste A (M-4): sólo con la lista llena, 100 filas exactas. */}
            {muestraFin(actual.top.filas) && <p className="rnk-fin">{t('rnk.fin')}</p>}
            {/* El hueco de la línea Premium (1e): reservado e invisible (O1). */}
            <div className="rnk-premium" aria-hidden="true" />
          </>
        )}
      </div>

      {perfil && (
        <MiniPerfil
          key={perfil.username}
          api={api}
          username={perfil.username}
          inicial={perfil.inicial}
          propio={perfil.propio}
          correo={perfil.propio ? (cuenta?.correo ?? '') : ''}
          onCerrar={cerrarPerfil}
          onNoHay={noHay}
        />
      )}
    </PantallaChips>
  )
}
