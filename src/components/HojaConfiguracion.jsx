import { useEffect, useRef, useState } from 'react'
import '../styles/hojaConfiguracion.css'

import { SoundButton } from './SoundButton'
import { IconoUsuario } from './IconosLobby'
import { CREDITOS_EMOJI, AUTORES_PIXABAY, LICENCIA_PIXABAY } from '../config/creditos'
import { CORREO_SOPORTE } from '../config/soporte'
import { VERSION, COMMIT } from '../config/version'
import { useIdioma } from '../hooks/useIdioma'
import { useSounds } from '../hooks/useSounds'
import { useSoundContext } from '../context/SoundContext'
import { enmascararCorreo, atributosHoja } from '../hooks/lobbyCore'
import { copiarTexto } from '../lib/copiarTexto'

// ── CFG-1 1a · La hoja del ⚙, una sola para todas las pantallas ────────────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §2 y §3.2. Lámina `laminas/cfg1a`
// (V2 A · V3 A · V4 A), elegidas por Victor.
//
// ── DE DÓNDE SALE ──────────────────────────────────────────────────────────
// Es la hoja que vivía escrita dentro de `Lobby.jsx` (LOB-1, v1.4 de la
// lámina), movida aquí con sus clases `lob-*` intactas: el arnés `lob` la lee
// por `.lob-hoja` y `.lob-acerca`, e `ios/tam` abre el ⚙ por `.lob-ajustes`.
// Lo que cambia es que ahora la montan el lobby Y las pantallas de `.sal`
// (Retar, Armar mesa, Rankings, Salas, Sala de espera, PvP), donde el ⚙ decía
// «Pronto». Su hoja de estilo (`hojaConfiguracion.css`) vale bajo `.lobby` y
// bajo `.sal`, y se ancla al relleno de la pantalla que la monta.
//
// ── LO QUE TRAE LA 1a ──────────────────────────────────────────────────────
//   · Sonido: el MISMO estado que el ⋮ de la mesa (`SoundContext`, INV-68);
//     la pastilla dice «Sí» / «No».
//   · Idioma: «Español» + «Pronto».
//   · Enviar sugerencia: se despliega como «Acerca de», con la dirección a la
//     vista, «Escribir correo» (`mailto:`) y «Copiar correo». Sin uuid.
//   · Acerca de: la primera línea es `AJILEI {versión} · {commit}`.
//   · Cabecera fija (título y cuenta) y cuerpo desplazable; en el apaisado bajo
//     se desplaza la hoja entera, como antes (la hoja de estilo lo decide).
//
// ── EL TOAST ES DE LA HOJA ─────────────────────────────────────────────────
// La hoja trae su propio aviso («Copiado», y el «Pronto» de Idioma y Eliminar),
// por encima del velo. El de las pantallas de `.sal` vive DENTRO de
// `.sal-cuerpo`, que es un contexto de apilamiento por debajo del velo: ningún
// `z-index` lo sacaría de ahí (Desviación D-3 del informe).
//
// ── FOCO ───────────────────────────────────────────────────────────────────
// Igual que en el lobby desde LOB-1: al abrir, el foco entra en el título
// (`tabIndex={-1}`); al cerrar, vuelve al ⚙ que la abrió (`ajustesRef`), o
// la siguiente tabulación empezaría por la esquina de la página. `Escape`
// cierra, y sólo se escucha mientras está abierta.

export default function HojaConfiguracion({ abierta, onCerrar, ajustesRef, cuenta, onCerrarSesion }) {
  const { t, idioma } = useIdioma()
  const { play } = useSounds()
  const { soundEnabled, toggle: alternarSonido } = useSoundContext()

  const [acercaAbierto, setAcercaAbierto] = useState(false)
  const [sugAbierta, setSugAbierta] = useState(false)
  const [toast, setToast] = useState(null)

  const tituloRef = useRef(null)
  const acercaRef = useRef(null)
  const sugRef = useRef(null)
  // GT-HIG · todo reloj lleva handle y se cancela.
  const relojToast = useRef(null)
  useEffect(() => () => clearTimeout(relojToast.current), [])

  useEffect(() => {
    if (abierta) tituloRef.current?.focus()
    else if (document.body.classList.contains('lobby-hoja-abierta')) ajustesRef?.current?.focus()
    document.body.classList.toggle('lobby-hoja-abierta', abierta)
  }, [abierta, ajustesRef])
  // Si la pantalla se va con la hoja abierta (cerrar sesión, la casa), la
  // clase del <body> se va con ella: la pantalla siguiente no hereda un toast
  // subido ni un velo que no existe.
  useEffect(() => () => document.body.classList.remove('lobby-hoja-abierta'), [])

  useEffect(() => {
    if (!abierta) return
    const alPulsar = (e) => { if (e.key === 'Escape') onCerrar?.() }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierta, onCerrar])

  // R-3 de la lámina · al desplegar, el panel entra en la vista. En el
  // apaisado bajo (915×412) la hoja se desplaza y lo desplegado quedaba
  // debajo del borde. `nearest`: si ya se ve, no se mueve nada.
  useEffect(() => { if (acercaAbierto) acercaRef.current?.scrollIntoView({ block: 'nearest' }) }, [acercaAbierto])
  useEffect(() => { if (sugAbierta) sugRef.current?.scrollIntoView({ block: 'nearest' }) }, [sugAbierta])

  const avisar = (clave) => {
    setToast(clave)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), 1200)
  }
  const pronto = () => avisar('lob.toast.pronto')

  const cerrarSesion = () => {
    onCerrar?.()
    ;(onCerrarSesion ?? cuenta?.cerrarSesion)?.()
  }

  const copiar = async () => {
    // Si no se pudo copiar no se dice «Copiado»: la dirección está a la vista
    // y se puede seleccionar entera de un toque (`user-select: all`).
    if (await copiarTexto(CORREO_SOPORTE)) avisar('lob.toast.copiado')
  }

  // O1 · el bloque de cuenta RESERVA SU CAJA aunque no haya cuenta (bypass):
  // nombre y correo se apagan con `visibility` y el alto no cambia.
  const usuario = cuenta?.username ?? ''
  const correo = enmascararCorreo(cuenta?.correo)

  // El `mailto:` · sin uuid (decisión sellada): quién, qué versión, qué aparato
  // y en qué idioma, y dos líneas en blanco para que escriba.
  const asunto = t('lob.cfg.sugerencia.asunto', { version: VERSION })
  const cuerpo = t('lob.cfg.sugerencia.cuerpo', {
    jugador: usuario || '—',
    version: VERSION,
    commit: COMMIT,
    aparato: globalThis.navigator?.userAgent ?? '—',
    idioma,
  })
  const mailto = `mailto:${CORREO_SOPORTE}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`

  // La versión con el commit en `<code>`: el hueco `{commit}` se deja como
  // marca y se parte por ella (molde del `{hc}` del aviso de saldo).
  const [antesCommit, despuesCommit = ''] = t('lob.acerca.version', { version: VERSION, commit: '{commit}' }).split('{commit}')

  return (
    <>
      {/* El velo NO es un botón y por eso no anuncia nada: cerrar tocando fuera
          es un atajo de puntero, y el camino accesible equivalente —`Escape` y
          el propio foco atrapado en la hoja— ya existe. */}
      <div className={`lob-velo${abierta ? ' is-on' : ''}`} onClick={() => onCerrar?.()} aria-hidden="true" />
      <aside
        className={`lob-hoja${abierta ? ' is-on' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lob-hoja-t"
        // La hoja existe SIEMPRE en el DOM —se mueve con `transform`, que es lo
        // que le da su transición— así que cerrada se retira del árbol de
        // accesibilidad y del orden de tabulación (`atributosHoja`, lobbyCore).
        {...atributosHoja(abierta)}
      >
        <h2 id="lob-hoja-t" className="lob-hoja-t" tabIndex={-1} ref={tituloRef}>
          {t('lob.cfg.titulo')}
        </h2>

        <div className="lob-hoja-cuenta">
          <span className="lob-avatar" aria-hidden="true"><IconoUsuario /></span>
          <span>
            <b className={usuario ? '' : 'lob-hueco'}>{usuario || ' '}</b>
            <br />
            <span className={`lob-hoja-correo${correo ? '' : ' lob-hueco'}`}>{correo || ' '}</span>
          </span>
        </div>

        {/* Lo que se desplaza: la lista, no la cabecera (V2 de la lámina). */}
        <div className="cfg-hoja-cuerpo">
          {/* Sonido · el clic de `SoundButton` suena ANTES del `onClick`: al
              apagar, arranca y `Howler.mute` lo corta en el render siguiente;
              al encender, no suena (aún estaba apagado). Ver el informe. */}
          <SoundButton className="lob-fila" data-accion="cfg-sonido" aria-pressed={soundEnabled} onClick={alternarSonido}>
            <span>{t('lob.cfg.sonido')}</span>
            <span className={`lob-pastilla${soundEnabled ? ' cfg-si' : ''}`}>{t(soundEnabled ? 'lob.cfg.si' : 'lob.cfg.no')}</span>
          </SoundButton>

          <SoundButton className="lob-fila" data-accion="cfg-idioma" onClick={pronto}>
            <span>{t('lob.cfg.idioma')}</span>
            <span className="cfg-valor">{t('lob.cfg.idioma.actual')}</span>
            <span className="lob-pastilla">{t('lob.toast.pronto')}</span>
          </SoundButton>

          <SoundButton
            className="lob-fila"
            data-accion="cfg-sugerencias"
            aria-expanded={sugAbierta}
            aria-controls="cfg-sug"
            onClick={() => setSugAbierta(v => !v)}
          >
            <span>{t('lob.cfg.sugerencias')}</span>
            <span className="lob-chev" aria-hidden="true">›</span>
          </SoundButton>
          <div className="cfg-sug" id="cfg-sug" hidden={!sugAbierta} ref={sugRef}>
            <p className="cfg-sug-dir">{CORREO_SOPORTE}</p>
            <div className="cfg-sug-btns">
              <a
                className="cfg-sug-btn"
                data-accion="cfg-escribir"
                data-sin-pantalla-completa=""
                href={mailto}
                onClick={() => play('buttonClick')}
              >
                {t('lob.cfg.sugerencia.escribir')}
              </a>
              <SoundButton
                type="button"
                className="cfg-sug-btn"
                data-accion="cfg-copiar"
                data-sin-pantalla-completa=""
                onClick={copiar}
              >
                {t('lob.cfg.sugerencia.copiar')}
              </SoundButton>
            </div>
          </div>

          <SoundButton className="lob-fila" data-accion="cerrar-sesion" onClick={cerrarSesion}>
            <span>{t('lob.cfg.salir')}</span>
          </SoundButton>

          <SoundButton
            className="lob-fila"
            data-accion="acerca"
            aria-expanded={acercaAbierto}
            aria-controls="lob-acerca"
            onClick={() => setAcercaAbierto(v => !v)}
          >
            <span>{t('lob.cfg.acerca')}</span>
            <span className="lob-chev" aria-hidden="true">›</span>
          </SoundButton>

          {/* ── Los créditos, con la licencia dentro ─────────────────────
              El CC BY de los emoji NO es adorno: la licencia lo exige y un
              comentario en código no la cumple (Diseno_Landscape §10.3). */}
          <div className="lob-acerca" id="lob-acerca" hidden={!acercaAbierto} ref={acercaRef}>
            <p className="cfg-version" data-accion="version">
              {antesCommit}<code>{COMMIT}</code>{despuesCommit}
            </p>
            <p>by HEPTACREATION</p>
            <p>
              {CREDITOS_EMOJI.etiqueta}{' '}
              {/* INV-45 · sale a otra pestaña: no pide pantalla completa. */}
              <a href={CREDITOS_EMOJI.url} target="_blank" rel="noopener noreferrer" data-sin-pantalla-completa="">
                {CREDITOS_EMOJI.obra}
              </a>
              {' '}· {CREDITOS_EMOJI.licencia}
            </p>
            <p>
              {t('lob.acerca.sonidos')}{' '}
              {AUTORES_PIXABAY.join(', ')} — {LICENCIA_PIXABAY}.
            </p>
          </div>

          <SoundButton className="lob-fila lob-fila-peligro" data-accion="eliminar-cuenta" onClick={pronto}>
            {/* CUENTA-DEL: es la 1c de CFG-1. */}
            <span>{t('lob.cfg.eliminar')}</span><span className="lob-pastilla">{t('lob.toast.pronto')}</span>
          </SoundButton>
        </div>
      </aside>

      {/* El aviso de la hoja. Caja reservada siempre y `visibility` (O1). */}
      <div className={`cfg-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite" data-accion="cfg-toast">
        {toast !== null ? t(toast) : ' '}
      </div>
    </>
  )
}
