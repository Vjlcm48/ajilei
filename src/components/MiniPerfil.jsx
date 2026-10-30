import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/miniPerfil.css'

import { useIdioma } from '../hooks/useIdioma'
import { lineasDe, estadoPerfil } from './miniPerfilCore'
import Bandera from './Bandera'
import { textoLugar } from '../lib/lugarCore'
import heptacoinUrl from '../assets/heptacoin.svg?no-inline'

// ── RNK-1c-ii · El mini-perfil ──────────────────────────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-ii_v1.0.md §2.1. Autoridad visual: la lámina
// `laminas/rnk1` (vistas `perfil-ajeno` y `perfil-propio`), medidas del
// informe 1-L §4.
//
// UNA SOLA TARJETA. La abre Rankings (filas y banda) y la abrirá la victoria
// (1d) con este mismo componente; por eso su hoja (`miniPerfil.css`) se vale
// sola con los tokens de `theme.css` y no cuelga de `salas.css`.
//
// VA EN `body` (portal, molde de `AvisoSaldo` y `MarcoVideo`): es una capa
// fija y fuera de `#root` no hereda el `zoom` de la mesa (INV-59). No es un
// `screen`: no navega ni cambia `screen` en `App`.
//
// SE ABRE YA, con el nombre y la inicial que trae quien la abre (la fila); las
// dos líneas quedan en hueco hasta que contesta `mini_perfil`, y sin red dicen
// «No se pudo cargar el ranking.» en pequeño. Si el jugador no existe, la
// tarjeta no se queda: avisa con `onNoHay` y quien la abrió la cierra, pone el
// toast y vuelve a pedir la lista. RNK-1d · quien no pasa `onNoHay` (la
// victoria, que abre la tuya) se queda con la tarjeta y las líneas dicen lo
// mismo que sin red: no hay lista que volver a pedir.
//
// LO AJENO NUNCA LLEVA CORREO. El propio enseña el de la sesión (`correo`, que
// el cliente ya tiene: no viaja por la RPC) y «Editar · Pronto» apagado.
//
// Se cierra con la ✕, tocando el velo o con `Escape`. El foco entra en la ✕ al
// abrir; devolverlo a la fila que la abrió es de quien la abrió.
//
// CFG-1 1b · EL LUGAR. La pastilla «País y estado» (rayada, el hueco de
// RNK-1) se llena cuando contesta `mini_perfil`: filete liso, la bandera y el
// texto, que cede con «…»; sin país, solo el isotipo en tenue y sin filete.
// Misma caja de 28 de alto (O1): mientras carga sigue el hueco rayado.
//
// CFG-1 1b · «EDITAR» ES UNA PUERTA DEL PERFIL (R-10). En la tarjeta propia,
// con `onEditar` el botón se enciende (sin «Pronto») y lleva al perfil; sin
// él no se pinta: la victoria (`GameTable`) no lo pasa, porque desde dentro de
// la mesa no se va al perfil.

// Los huecos de la frase que llevan otra cara: el puesto en oro y el saldo con
// su moneda delante (lámina). El texto entero sigue saliendo de `t()`.
const MARCA = '\u0001'

function Moneda() {
  return <img className="mp-moneda" src={heptacoinUrl} alt="" draggable="false" />
}

function Linea({ linea, estado, t }) {
  if (estado === 'sinred') return <span className="mp-linea mp-nada mp-chica">{t('rnk.sinred')}</span>
  // Cargando: la línea reserva su alto (O1).
  if (!linea) return <span className="mp-linea">{' '}</span>
  // Sin puesto (la frase sin cifras, propia o ajena): en gris.
  if (!Object.keys(linea.vars).length) return <span className="mp-linea mp-nada">{t(linea.clave)}</span>
  const marcas = Object.fromEntries(Object.keys(linea.vars).map((k) => [k, `${MARCA}${k}${MARCA}`]))
  const trozos = t(linea.clave, marcas).split(new RegExp(`${MARCA}(\\w+)${MARCA}`))
  return (
    <span className="mp-linea">
      {trozos.map((x, i) => {
        if (i % 2 === 0) return x
        if (x === 'n') return <em key={i}>{linea.vars.n}</em>
        if (x === 's') return <span key={i} className="mp-hc"><Moneda />{linea.vars.s}</span>
        return linea.vars[x]
      })}
    </span>
  )
}

// El hueco de la corona Premium: caja reservada e invisible (O1), en contorno.
function Corona() {
  return (
    <svg className="mp-corona" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
    </svg>
  )
}

export default function MiniPerfil({ username, inicial, propio = false, correo = '', onCerrar, onNoHay, onEditar, api }) {
  const { t } = useIdioma()
  const idNombre = useId()
  const cerrar = useRef(null)
  const [respuesta, setRespuesta] = useState(null)

  useEffect(() => {
    let vigente = true
    api.perfil(username).then((r) => { if (vigente) setRespuesta(r) })
    return () => { vigente = false }
  }, [api, username])

  const estado = estadoPerfil(respuesta)
  useEffect(() => {
    if (estado === 'nohay') onNoHay?.(username)
  }, [estado, onNoHay, username])

  // El foco entra en la ✕ UNA vez, al abrir; `Escape` cierra, con un oyente
  // sólo mientras vive. `onCerrar` va por referencia: si quien abre la
  // rehace en cada render, ni el foco salta ni el oyente se renueva.
  const alCerrar = useRef(onCerrar)
  useEffect(() => { alCerrar.current = onCerrar })
  useEffect(() => {
    cerrar.current?.focus()
    const alPulsar = (e) => { if (e.key === 'Escape') alCerrar.current?.() }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [])

  const { maestros, fortunas } = lineasDe(estado === 'listo' ? respuesta.perfil : null, propio)
  const estadoLineas = estado === 'nohay' && !onNoHay ? 'sinred' : estado
  // El nombre lo pone el servidor cuando contesta (las mayúsculas de verdad);
  // hasta entonces, el de la fila.
  const nombre = estado === 'listo' ? respuesta.perfil.username : username
  const lugar = estado === 'listo' ? textoLugar(respuesta.perfil.pais, respuesta.perfil.estado) : ''

  return createPortal(
    <div
      className="mp-velo"
      data-mp-estado={estado}
      data-mp-propio={propio ? '' : undefined}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar?.() }}
    >
      <div className="mp-tarjeta" role="dialog" aria-modal="true" aria-labelledby={idNombre}>
        <button
          ref={cerrar}
          type="button"
          className="mp-cerrar"
          data-accion="mp-cerrar"
          aria-label={t('rnk.perfil.cerrar')}
          onClick={() => onCerrar?.()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="mp-id">
          {/* El sitio de la imagen de AVA-1: hoy, la inicial. */}
          <div className="mp-av" aria-hidden="true">{inicial}</div>
          <div className="mp-nom">
            <b id={idNombre}>{nombre}</b>
            <Corona />
          </div>
          {/* País y estado: hueco hasta que haya datos. */}
          {estado === 'listo' ? (
            <div className={`mp-pais es-lleno${lugar ? '' : ' es-sin'}`} data-accion="mp-lugar">
              <Bandera pais={respuesta.perfil.pais} />
              {lugar ? <span className="mp-pais-t">{lugar}</span> : null}
            </div>
          ) : (
            <div className="mp-pais"><i aria-hidden="true" />{t('rnk.perfil.pais')}</div>
          )}
        </div>

        <div className="mp-datos">
          <hr className="mp-sep mp-sep1" />
          <div className="mp-rk" data-mp-linea="maestros">
            <small>{t('rnk.pestana.maestros')}</small>
            <Linea linea={maestros} estado={estadoLineas} t={t} />
          </div>
          <div className="mp-rk" data-mp-linea="fortunas">
            <small>{t('rnk.pestana.fortunas')}</small>
            <Linea linea={fortunas} estado={estadoLineas} t={t} />
          </div>
          {propio && (
            <>
              <hr className="mp-sep" />
              <div className="mp-correo">
                <small>{t('rnk.perfil.correo')}</small>
                {/* Sin correo (el bypass) la línea reserva su caja (O1), como la hoja ⚙. */}
                <span>{correo || ' '}</span>
                <span className="mp-solo">{t('rnk.perfil.solo_tu')}</span>
              </div>
              {onEditar && (
                <button type="button" className="mp-editar" data-accion="mp-editar" onClick={onEditar}>
                  {t('rnk.perfil.editar')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
