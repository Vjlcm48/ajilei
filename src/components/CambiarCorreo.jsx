import { useEffect, useRef, useState } from 'react'
import '../styles/puerta.css'
import '../styles/bautizo.css'
import '../styles/correo.css'
import { SoundButton } from './SoundButton'
import { useIdioma } from '../hooks/useIdioma'
import { claveDeMotivo, esperaEnvio } from '../lib/correoCore'

// ── CFG-1 1d · La tarjeta del cambio de correo ──────────────────────────────
// Rector: AJILEI_CFG-1_Fase1d_v1.0.md §3–§4. Autoridad visual: la lámina
// `laminas/cfg1d` (V2 y V3-A, sellados en STOP-L). Molde: el Bautizo en modo
// edición, arriba en el teléfono (`puerta-overlay` + `bautizo-card is-edicion`).
//
// DOS PASOS: el editor (pide el correo nuevo) y los códigos (uno por dirección,
// en la misma tarjeta). Con un cambio pendiente se abre en los códigos.
//
// SIN «CANCELAR» UN CAMBIO (Decisión 1 del STOP-0): el servidor no lo permite y
// un botón que solo escondiera mentiría. Por eso:
//   · «Cerrar» solo cierra: el cambio sigue pendiente hasta que venza.
//   · En el editor, «Cancelar» solo sale si no hay nada pendiente; con algo
//     pendiente dice «Cerrar» y tampoco lo apaga.
//   · Pedir otra dirección antes de 60 s es un 429 seguro: «Continuar en N s»
//     enseña la espera en vez de dejar chocar.

// Sin `maxLength`: el navegador cortaría lo pegado ANTES de este filtro, y
// «123 456» se quedaría en cinco dígitos.
const soloDigitos = (v) => v.replace(/\D/g, '').slice(0, 6)

function CampoCodigo({ id, rotulo, direccion, valor, onCambio, error, campoRef, deshabilitado }) {
  return (
    <div className="cor-campo">
      <label className="bautizo-etiqueta" htmlFor={id}>{rotulo}</label>
      <span className="cor-dir" data-accion={`${id}-dir`}>{direccion}</span>
      <input
        id={id}
        ref={campoRef}
        className={`puerta-campo puerta-campo-codigo${error ? ' is-error' : ''}`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        enterKeyHint="go"
        placeholder="······"
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onCambio(soloDigitos(e.target.value))}
      />
    </div>
  )
}

export default function CambiarCorreo({ api, actual, pendiente, onPedido, onCompletado, onCerrar }) {
  const { t } = useIdioma()
  const [paso, setPaso] = useState(pendiente ? 'codigos' : 'editor')
  // El envío en curso: se queda aunque el «Pendiente» de la fila venza con la
  // tarjeta abierta, porque «Reenviar» sigue sirviendo.
  const [envio, setEnvio] = useState(pendiente)
  const [escrito, setEscrito] = useState('')
  const [codigoActual, setCodigoActual] = useState('')
  const [codigoNuevo, setCodigoNuevo] = useState('')
  const [error, setError] = useState(null)
  const [marcados, setMarcados] = useState([])
  const [reenviado, setReenviado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())
  const campoCorreo = useRef(null)
  const campoCodigo = useRef(null)

  const espera = esperaEnvio(envio?.enviadoEn ?? null, ahora)
  const frenado = !!pendiente && espera > 0

  useEffect(() => {
    (paso === 'editor' ? campoCorreo : campoCodigo).current?.focus({ preventScroll: true })
  }, [paso])

  useEffect(() => {
    if (espera <= 0) return undefined
    const id = setInterval(() => setAhora(Date.now()), 250)
    return () => clearInterval(id)
  }, [espera])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !ocupado) onCerrar() }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onCerrar, ocupado])

  const limpiarAvisos = () => { setError(null); setMarcados([]); setReenviado(false) }
  const nuevoEnvio = (r) => {
    setEnvio({ nuevo: r.nuevo, enviadoEn: r.enviadoEn })
    setAhora(Date.now())
    setCodigoActual('')
    setCodigoNuevo('')
    onPedido(r.nuevo, r.enviadoEn)
  }

  const pedir = async (e) => {
    e.preventDefault()
    if (ocupado || frenado || escrito.trim() === '') return
    limpiarAvisos()
    setOcupado(true)
    const r = await api.pedirCambio(escrito)
    setOcupado(false)
    if (!r.ok) { setError(claveDeMotivo(r.motivo)); return }
    nuevoEnvio(r)
    setPaso('codigos')
  }

  const confirmar = async (e) => {
    e.preventDefault()
    if (ocupado || codigoActual.length !== 6 || codigoNuevo.length !== 6) return
    limpiarAvisos()
    setOcupado(true)
    const r = await api.confirmar(codigoActual, codigoNuevo)
    if (r.ok) { onCompletado(r.correo); return }
    setOcupado(false)
    setError(claveDeMotivo(r.motivo, r.campos))
    setMarcados(r.motivo === 'codigo_vencido' ? ['actual', 'nuevo'] : (r.campos ?? []))
    setAhora(Date.now())
  }

  const reenviar = async () => {
    if (ocupado) return
    limpiarAvisos()
    setOcupado(true)
    const r = await api.reenviar()
    setOcupado(false)
    if (!r.ok) { setError(claveDeMotivo(r.motivo)); return }
    nuevoEnvio(r)
    setReenviado(true)
    campoCodigo.current?.focus({ preventScroll: true })
  }

  const usarOtro = () => { limpiarAvisos(); setEscrito(''); setPaso('editor') }

  const cuerpo = paso === 'editor' ? (
    <form onSubmit={pedir} noValidate>
      <span className="bautizo-etiqueta">{t('perfil.correo.actual')}</span>
      <p className="cor-actual" data-accion="cor-actual">{actual}</p>
      <label className="bautizo-etiqueta" htmlFor="cor-nuevo">{t('perfil.correo.nuevo')}</label>
      <input
        id="cor-nuevo"
        ref={campoCorreo}
        className={`puerta-campo${error ? ' is-error' : ''}`}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        enterKeyHint="go"
        maxLength={255}
        placeholder={t('perfil.correo.nuevo_ph')}
        value={escrito}
        disabled={ocupado}
        onChange={(e) => { setEscrito(e.target.value); limpiarAvisos() }}
      />
      <p className={`puerta-aviso${error ? '' : ' is-info'}`} role="status" data-accion="cor-aviso">
        {error ? t(error) : t('perfil.correo.ayuda')}
      </p>
      <SoundButton type="submit" className="puerta-btn" data-accion="cor-continuar" disabled={ocupado || frenado || escrito.trim() === ''}>
        {ocupado ? t('perfil.correo.enviando') : frenado ? t('perfil.correo.continuar_espera', { n: espera }) : t('perfil.correo.continuar')}
      </SoundButton>
      <div className="puerta-links">
        <SoundButton type="button" className="puerta-link" data-accion="cor-cancelar" disabled={ocupado} onClick={onCerrar}>
          {pendiente ? t('perfil.nombre.cerrar') : t('perfil.nombre.cancelar')}
        </SoundButton>
      </div>
    </form>
  ) : (
    <form onSubmit={confirmar} noValidate>
      <div className="cor-dos">
        <CampoCodigo
          id="cor-c1"
          campoRef={campoCodigo}
          rotulo={t('perfil.correo.codigo_actual')}
          direccion={actual}
          valor={codigoActual}
          error={marcados.includes('actual')}
          deshabilitado={ocupado}
          onCambio={(v) => { setCodigoActual(v); limpiarAvisos() }}
        />
        <CampoCodigo
          id="cor-c2"
          rotulo={t('perfil.correo.codigo_nuevo')}
          direccion={envio?.nuevo ?? ''}
          valor={codigoNuevo}
          error={marcados.includes('nuevo')}
          deshabilitado={ocupado}
          onCambio={(v) => { setCodigoNuevo(v); limpiarAvisos() }}
        />
      </div>
      <p className={`puerta-aviso${error ? '' : ' is-info'}`} role="status" data-accion="cor-aviso">
        {error ? t(error) : t(reenviado ? 'perfil.correo.reenviado' : 'perfil.correo.vence')}
      </p>
      <SoundButton type="submit" className="puerta-btn" data-accion="cor-confirmar" disabled={ocupado || codigoActual.length !== 6 || codigoNuevo.length !== 6}>
        {ocupado ? t('perfil.correo.comprobando') : t('perfil.correo.confirmar')}
      </SoundButton>
      <div className="puerta-links cor-links">
        <SoundButton type="button" className="puerta-link cor-reenviar" data-accion="cor-reenviar" disabled={espera > 0 || ocupado} onClick={reenviar}>
          {espera > 0 ? t('perfil.correo.reenviar_espera', { n: espera }) : t('perfil.correo.reenviar')}
        </SoundButton>
        <SoundButton type="button" className="puerta-link" data-accion="cor-otro" disabled={ocupado} onClick={usarOtro}>{t('perfil.correo.otro')}</SoundButton>
        <SoundButton type="button" className="puerta-link" data-accion="cor-cerrar" disabled={ocupado} onClick={onCerrar}>{t('perfil.nombre.cerrar')}</SoundButton>
      </div>
    </form>
  )

  return (
    <div className="puerta-overlay bautizo-overlay cor-overlay" onClick={() => { if (!ocupado) onCerrar() }}>
      <div onClick={(e) => e.stopPropagation()}>
        <section className="puerta-card bautizo-card is-edicion cor-card" data-cor={paso}>
          <h2 className="bautizo-titulo">{t('perfil.correo.titulo')}</h2>
          {cuerpo}
        </section>
      </div>
    </div>
  )
}
