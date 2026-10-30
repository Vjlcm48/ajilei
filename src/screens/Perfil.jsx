import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PantallaChips from '../components/PantallaChips'
import '../styles/perfil.css'

import Bautizo from './Bautizo'
import Bandera from '../components/Bandera'
import { SoundButton } from '../components/SoundButton'
import { useIdioma } from '../hooks/useIdioma'
import { enmascararCorreo } from '../hooks/lobbyCore'
import { inicialDe } from './salaEsperaCore'
import { PAISES } from '../config/paises'
import { ESTADOS_VE } from '../config/estados'
import { buscarPaises, textoLugar, paisDe, DIASPORA } from '../lib/lugarCore'
import { fechaCorta } from '../lib/perfilApi'

// ── CFG-1 1b · La pantalla de perfil ────────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §2.5–§2.6, con lo decidido por Victor
// (§0): V1-A, V3-A, la fila «Correo · Pronto» y el avatar sin columna (V4).
// Autoridad visual: la lámina `laminas/cfg1b` (`perfil.jsx`), copiada y
// recableada a `cuenta`. Lo que no se copia es lo de las variantes no
// elegidas (V1-B, V3-B, V7-B/C) y los mandos de la lámina.
//
// LA CARCASA ES `PantallaChips` (familia `.sal`): barra, ⚙, flecha y casa de
// siempre. La flecha deshace un paso (el selector vuelve a las filas, el
// estado vuelve al país) y desde las filas vuelve a la pantalla de ORIGEN
// (`onVolver`, lo decide `App` con su `desde`); la casa va al lobby.
//
// QUÉ SE GUARDA Y CUÁNDO (§0-1). El país y el estado se guardan solos al
// elegir (`cuenta.cambiarLugar`), con el toast «Guardado»; al elegir
// Venezuela la lista de estados sale enseguida, con «Sin estado» arriba y
// marcado (V3-A, §0-2). El nombre tiene su propia confirmación: es el Bautizo
// real en modo edición, con el freno de 30 días dentro (`Bautizo.jsx`).
//
// SIN PAÍS («Prefiero no decirlo», §0-10) el país queda vacío y se ve el
// isotipo de AJILEI en tenue.

function Chev() { return <span className="lob-chev" aria-hidden="true">›</span> }

// ── V4 · el avatar ─────────────────────────────────────────────────────────
// La cuadrícula ES la de AVA-1: la primera celda es el círculo de hoy (la única
// opción, marcada) y las demás son huecos del mismo tamaño. AVA-1 cambia los
// huecos por avatares y no toca la pantalla.
function Avatares({ inicial, t }) {
  return (
    <div className="pf-avatares">
      <div className="pf-av-rejilla" role="radiogroup" aria-label={t('perfil.fila.avatar')}>
        <button type="button" className="pf-av-celda is-elegida" role="radio" aria-checked="true" data-accion="pf-av-inicial">
          <span className="pf-av pf-av-c">{inicial}</span>
          <span className="pf-av-marca" aria-hidden="true">✓</span>
        </button>
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="pf-av-celda is-hueco" aria-hidden="true"><span className="pf-av pf-av-c" /></span>
        ))}
      </div>
      <p className="pf-av-pronto"><span>{t('perfil.avatar.pronto')}</span><span className="lob-pastilla">{t('lob.toast.pronto')}</span></p>
    </div>
  )
}

function Opcion({ elegida, onElegir, children, accion, pais }) {
  return (
    <button
      type="button"
      className={`pf-op${elegida ? ' is-elegida' : ''}`}
      role="option"
      aria-selected={elegida}
      data-accion={accion}
      data-pais={pais}
      onClick={onElegir}
    >
      {children}
      <span className="pf-op-marca" aria-hidden="true">{elegida ? '✓' : ''}</span>
    </button>
  )
}

// ── V3-A · el país: buscador fijo, la diáspora, «Prefiero no decirlo» ──────
function ElegirPais({ pais, busqueda, setBusqueda, guardando, onElegir, t }) {
  const campo = useRef(null)
  const vacia = busqueda.trim() === ''
  const res = vacia ? [] : buscarPaises(busqueda)
  const marcado = guardando !== undefined ? guardando : pais
  const fila = (p, lazy) => (
    <Opcion key={p.c} pais={p.c} accion="pf-op" elegida={marcado === p.c} onElegir={() => onElegir(p.c)}>
      <Bandera pais={p.c} lazy={lazy} />
      <span className="pf-op-n">{p.n}</span>
    </Opcion>
  )
  return (
    <>
      <div className="pf-buscar">
        <input
          ref={campo}
          id="pf-buscar"
          className="pf-campo"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder={t('perfil.lugar.buscar')}
          aria-label={t('perfil.lugar.buscar')}
          aria-controls="pf-lista"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {!vacia && (
          <button
            type="button"
            className="pf-borrar"
            data-accion="pf-borrar"
            aria-label={t('perfil.lugar.borrar')}
            onClick={() => { setBusqueda(''); campo.current?.focus() }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
      <div
        className="pf-lista sal-desplaza"
        id="pf-lista"
        role="listbox"
        aria-label={t('perfil.lugar.paises')}
        aria-busy={guardando !== undefined}
        data-accion="pf-lista"
      >
        {vacia && (
          <>
            <Opcion accion="pf-op-nada" elegida={marcado === null} onElegir={() => onElegir(null)}>
              <Bandera pais={null} />
              <span className="pf-op-n">{t('perfil.lugar.nada')}</span>
            </Opcion>
            <p className="pf-grupo">{t('perfil.lugar.diaspora')}</p>
            {DIASPORA.map((c) => fila(paisDe(c), false))}
            <p className="pf-grupo">{t('perfil.lugar.todos')}</p>
            {PAISES.map((p) => fila(p, true))}
          </>
        )}
        {!vacia && res.map((p) => fila(p, true))}
        {!vacia && res.length === 0 && <p className="pf-vacio" role="status">{t('perfil.lugar.vacio')}</p>}
      </div>
    </>
  )
}

// ── V3-A · el estado de Venezuela, con «Sin estado» arriba ─────────────────
function ElegirEstado({ estado, guardando, onElegir, t }) {
  const venezuela = paisDe('VE').n
  const marcado = guardando !== undefined ? guardando : estado
  return (
    <div
      className="pf-lista sal-desplaza"
      id="pf-lista"
      role="listbox"
      aria-label={t('perfil.lugar.estados', { pais: venezuela })}
      aria-busy={guardando !== undefined}
      data-accion="pf-lista"
    >
      <p className="pf-paso"><Bandera pais="VE" /><span>{t('perfil.lugar.estado', { pais: venezuela })}</span></p>
      <Opcion accion="pf-op-sinestado" elegida={!marcado} onElegir={() => onElegir(null)}>
        <span className="pf-op-n">{t('perfil.lugar.sin_estado')}</span>
      </Opcion>
      {ESTADOS_VE.map((x) => (
        <Opcion key={x.c} accion="pf-op-estado" elegida={marcado === x.c} onElegir={() => onElegir(x.c)}>
          <span className="pf-op-n">{x.n}</span>
        </Opcion>
      ))}
    </div>
  )
}

// ── La cabecera: el círculo, el nombre y el lugar ──────────────────────────
function Cabecera({ cuenta }) {
  const lugar = textoLugar(cuenta.pais, cuenta.estado)
  return (
    <section className="pf-cab" data-accion="pf-cab">
      <div className="pf-av pf-av-grande" aria-hidden="true">{inicialDe(cuenta.username)}</div>
      <b className="pf-nom pf-trunca">{cuenta.username}</b>
      <span className="pf-lugar">
        <Bandera pais={cuenta.pais} />
        {lugar ? <span className="pf-trunca">{lugar}</span> : null}
      </span>
    </section>
  )
}

// ── V1-A · filas que abren su editor ───────────────────────────────────────
function Filas({ cuenta, abrir, avisar, t }) {
  const lugar = textoLugar(cuenta.pais, cuenta.estado)
  const correo = enmascararCorreo(cuenta.correo)
  const hasta = cuenta.proximoCambio instanceof Date ? cuenta.proximoCambio : null
  return (
    <div className="pf-filas">
      <SoundButton className="lob-fila pf-fila" data-accion="pf-fila-avatar" onClick={() => abrir('avatar')}>
        <span className="pf-fila-l">{t('perfil.fila.avatar')}</span>
        <span className="pf-valor"><span className="pf-av pf-av-mini" aria-hidden="true">{inicialDe(cuenta.username)}</span></span>
        <Chev />
      </SoundButton>
      <SoundButton className="lob-fila pf-fila" data-accion="pf-fila-nombre" onClick={() => abrir('nombre')}>
        <span className="pf-fila-l">{t('perfil.fila.nombre')}</span>
        <span className="pf-valor pf-valor-2">
          <span className="pf-trunca">{cuenta.username}</span>
          {hasta && <small>{t('perfil.proximo', { fecha: fechaCorta(hasta) })}</small>}
        </span>
        <Chev />
      </SoundButton>
      <SoundButton className="lob-fila pf-fila" data-accion="pf-fila-pais" onClick={() => abrir('pais')}>
        <span className="pf-fila-l">{t('perfil.fila.lugar')}</span>
        <span className="pf-valor">
          {cuenta.pais ? <Bandera pais={cuenta.pais} /> : null}
          <span className={`pf-trunca${lugar ? '' : ' pf-tenue'}`}>{lugar || t('perfil.sin_elegir')}</span>
        </span>
        <Chev />
      </SoundButton>
      {/* El correo enmascarado y «Pronto» (§0-5): la 1d la enciende. Sin
          correo (el bypass) la fila reserva su caja (O1). */}
      <SoundButton className="lob-fila pf-fila" data-accion="pf-fila-correo" onClick={() => avisar('lob.toast.pronto')}>
        <span className="pf-fila-l">{t('perfil.fila.correo')}</span>
        <span className="pf-valor"><span className="pf-trunca">{correo || ' '}</span></span>
        <span className="lob-pastilla">{t('lob.toast.pronto')}</span>
      </SoundButton>
    </div>
  )
}

const TITULO = { inicio: 'perfil.titulo', nombre: 'perfil.titulo', avatar: 'perfil.fila.avatar', pais: 'perfil.fila.lugar', estado: 'perfil.fila.lugar' }

export default function Perfil({ cuenta, billetera, aviso, onAvisoFin, onVolver, onLobby }) {
  const { t } = useIdioma()
  const [sub, setSub] = useState('inicio')
  const [busqueda, setBusqueda] = useState('')
  // El estado vino de elegir Venezuela en la lista: la flecha vuelve a ella.
  const [desdePais, setDesdePais] = useState(false)
  // Lo que se está guardando (`undefined` = nada): la opción tocada se queda
  // marcada mientras el servidor contesta.
  const [guardando, setGuardando] = useState(undefined)
  const toast = useRef(null)
  const avisar = (clave, vars) => toast.current?.avisar(clave, vars)

  const abrir = (s) => { setBusqueda(''); setDesdePais(false); setSub(s) }
  const volver = () => {
    if (sub === 'estado' && desdePais) return abrir('pais')
    if (sub !== 'inicio') return abrir('inicio')
    onVolver?.()
  }

  const guardar = async (pais, estado, despues) => {
    if (guardando !== undefined) return
    setGuardando(pais)
    const r = await cuenta.cambiarLugar(pais, estado)
    setGuardando(undefined)
    if (!r.ok) { avisar('perfil.error'); return }
    despues()
  }
  // Venezuela se guarda ya (con el estado vacío) y abre los estados; los
  // demás se guardan y vuelven a las filas.
  const elegirPais = (c) => guardar(c, null, () => {
    if (c === 'VE') { setBusqueda(''); setDesdePais(true); setSub('estado'); return }
    abrir('inicio')
    avisar('perfil.guardado')
  })
  const elegirEstado = (c) => {
    if (guardando !== undefined) return
    setGuardando(c)
    cuenta.cambiarLugar('VE', c).then((r) => {
      setGuardando(undefined)
      if (!r.ok) { avisar('perfil.error'); return }
      abrir('inicio')
      avisar('perfil.guardado')
    })
  }

  const confirmarNombre = async (nuevo) => {
    const r = await cuenta.cambiarNombre(nuevo)
    if (r.ok) avisar('perfil.listo', { nombre: nuevo })
    return r
  }

  const lista = sub === 'pais' || sub === 'estado'
  return (
    <PantallaChips
      titulo={t(TITULO[sub])}
      clase={`es-perfil${lista ? ' es-lista' : ''}`}
      cuenta={cuenta}
      saldo={billetera?.saldo ?? null}
      estadoSaldo={billetera?.estado}
      recordado={billetera?.recordado ?? null}
      cobrando={billetera?.pendiente === true}
      aviso={aviso}
      onAvisoFin={onAvisoFin}
      onVolver={volver}
      onLobby={onLobby}
      cta={null}
      listaInterna={lista}
      raiz={{ 'data-perfil': sub }}
      avisoRef={toast}
    >
      {!lista && sub !== 'avatar' && <Cabecera cuenta={cuenta} />}
      {!lista && sub !== 'avatar' && <Filas cuenta={cuenta} abrir={abrir} avisar={avisar} t={t} />}
      {sub === 'avatar' && (
        <section className="pf-sec pf-sec-avatar">
          <Avatares inicial={inicialDe(cuenta.username)} t={t} />
        </section>
      )}
      {sub === 'pais' && (
        <ElegirPais pais={cuenta.pais} busqueda={busqueda} setBusqueda={setBusqueda} guardando={guardando} onElegir={elegirPais} t={t} />
      )}
      {sub === 'estado' && <ElegirEstado estado={cuenta.estado} guardando={guardando} onElegir={elegirEstado} t={t} />}

      {/* El editor del nombre: el Bautizo real en modo edición, en `body`
          (fuera de `.sal-cuerpo`, que es un contexto de apilamiento por
          debajo de la barra). */}
      {sub === 'nombre' && createPortal(
        <Bautizo
          modo="edicion"
          actual={cuenta.username}
          bloqueadoHasta={cuenta.proximoCambio instanceof Date ? cuenta.proximoCambio : null}
          onComprobar={cuenta.comprobarNombre}
          onConfirmar={confirmarNombre}
          onCancelar={() => abrir('inicio')}
        />,
        document.body,
      )}
    </PantallaChips>
  )
}
