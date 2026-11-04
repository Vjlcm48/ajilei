import { lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../styles/hojaMarco.css'
// La vitrina y su luz se quedan en la entrada, y justo aquí, aunque `Vitrina` viaje con
// la Tienda y las filas de la hoja. `luz.css` también la importa la mesa, y un CSS
// repartido entre trozos cargaría en el orden en que lleguen. Es el sitio que tenían en
// la cascada: `luz.css` empata con `vitrina.css` y con `ChipToken.css` y gana por ir
// detrás (es el riesgo de D-21, TIE-1). Más arriba, en `main.jsx`, la ficha pierde su
// `filter` en la mesa (`diagDSK luz`, `p5_token`).
import '../styles/vitrina.css'
import '../styles/luz.css'

import { useIdioma } from '../hooks/useIdioma'
import { atributosHoja } from '../hooks/lobbyCore'
import { trozos } from '../lib/trozos'

// ── CFG-1 1a · La hoja del ⚙, una sola para todas las pantallas ────────────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §2 y §3.2. Lámina `laminas/cfg1a`.
//
// ── PES-1 §3-C · AQUÍ QUEDA EL MARCO ───────────────────────────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §3-C. La hoja ya no se monta cerrada en cada
// pantalla: nace al primer toque del ⚙ y se queda. Este archivo es lo que viaja en
// la entrada, el velo, la caja, el título, el foco y el aviso; las filas son
// `HojaContenido`, con `trozos.hoja`, que el lobby precarga. Si el trozo no ha
// llegado, la hoja abre igual, con las mismas cajas vacías (`FilasReservadas`), y las
// filas entran sin salto (O1).
//
// LA ANIMACIÓN ES LA DE SIEMPRE. El navegador solo anima desde un estado que ya
// haya calculado: se monta cerrada, se fuerza ese cálculo y se abre en el fotograma
// siguiente.
//
// ── EL TOAST ES DE LA HOJA ─────────────────────────────────────────────────
// La hoja trae su propio aviso («Copiado», y el «Pronto» de Idioma y Eliminar),
// por encima del velo. El de las pantallas de `.sal` vive DENTRO de
// `.sal-cuerpo`, que es un contexto de apilamiento por debajo del velo: ningún
// `z-index` lo sacaría de ahí (Desviación D-3 del informe). Fuera de `.lob-hoja`,
// que lleva `transform`: dentro, `fixed` se anclaría a ella.
//
// ── FOCO ───────────────────────────────────────────────────────────────────
// Igual que en el lobby desde LOB-1: al abrir, el foco entra en el título
// (`tabIndex={-1}`); al cerrar, vuelve al ⚙ que la abrió (`ajustesRef`), o
// la siguiente tabulación empezaría por la esquina de la página. `Escape`
// cierra, y sólo se escucha mientras está abierta: con las filas ya aquí lo
// escucha `HojaContenido`, que sabe si la ventana de eliminar está encima.

const Contenido = lazy(trozos.hoja.fabrica)

const HUECO = '\u00a0'

// Las cajas de `HojaContenido`, con las mismas clases y los mismos elementos: miden
// lo mismo en toda vista y en las dos familias, sin una cifra que mantener. Si
// `HojaContenido` cambia sus filas, `espera.hoja` lo dice.
function FilasReservadas() {
  const fila = (clase, ...hijos) => <button type="button" className={clase} tabIndex={-1}><span>{HUECO}</span>{hijos}</button>
  const chev = <span key="c" className="lob-chev">›</span>
  return (
    <>
      <button type="button" className="lob-hoja-cuenta cfg-tocable cfg-reserva" tabIndex={-1} aria-hidden="true">
        <span className="lob-avatar" />
        <span><b>{HUECO}</b><br /><span className="lob-hoja-correo">{HUECO}</span></span>
        <span className="lob-chev cfg-chev">›</span>
      </button>
      <div className="cfg-hoja-cuerpo cfg-reserva" aria-hidden="true">
        {fila('lob-fila', <span key="p" className="lob-pastilla">{HUECO}</span>)}
        <button type="button" className="lob-fila tie-cfg-fila" tabIndex={-1}>
          <span className="tie-cfg-txt"><span>{HUECO}</span><small>{HUECO}</small></span>
          <span className="vit vit-disco" />
          <span className="lob-chev">›</span>
        </button>
        {fila('lob-fila', <span key="v" className="cfg-valor">{HUECO}</span>, <span key="p" className="lob-pastilla">{HUECO}</span>)}
        {fila('lob-fila', chev)}
        {fila('lob-fila')}
        {fila('lob-fila', chev)}
        {fila('lob-fila lob-fila-peligro')}
      </div>
    </>
  )
}

export default function HojaConfiguracion({ abierta, ...resto }) {
  const [pedida, setPedida] = useState(abierta)
  if (abierta && !pedida) setPedida(true)
  return pedida ? <Marco abierta={abierta} {...resto} /> : null
}

function Marco({ abierta, onCerrar, ajustesRef, cuenta, onCerrarSesion }) {
  const { t } = useIdioma()
  const [llegado, setLlegado] = useState(trozos.hoja.llego)
  const [armada, setArmada] = useState(false)
  const visible = abierta && armada
  const [toast, setToast] = useState(null)
  const hojaRef = useRef(null)
  const tituloRef = useRef(null)
  // GT-HIG · todo reloj lleva handle y se cancela.
  const relojToast = useRef(null)
  useEffect(() => () => clearTimeout(relojToast.current), [])

  useLayoutEffect(() => {
    hojaRef.current?.getBoundingClientRect()
    const id = requestAnimationFrame(() => setArmada(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Si no ha llegado: el jugador ya la está esperando, así que un fallo recarga,
  // como la mesa (`origenFalloChunk`).
  useEffect(() => {
    if (llegado) return undefined
    let vivo = true
    trozos.hoja.marcarEntrada()
    trozos.hoja.cargar().then(() => { if (vivo && trozos.hoja.llego()) setLlegado(true) }, () => {})
    return () => { vivo = false }
  }, [llegado])

  useEffect(() => {
    if (visible) tituloRef.current?.focus()
    else if (document.body.classList.contains('lobby-hoja-abierta')) ajustesRef?.current?.focus()
    document.body.classList.toggle('lobby-hoja-abierta', visible)
  }, [visible, ajustesRef])
  // Si la pantalla se va con la hoja abierta (cerrar sesión, la casa), la
  // clase del <body> se va con ella: la pantalla siguiente no hereda un toast
  // subido ni un velo que no existe.
  useEffect(() => () => document.body.classList.remove('lobby-hoja-abierta'), [])

  useEffect(() => {
    if (!visible || llegado) return undefined
    const alPulsar = (e) => { if (e.key === 'Escape') onCerrar?.() }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [visible, llegado, onCerrar])

  const avisar = (clave, ms = 1200) => {
    setToast(clave)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToast(null), ms)
  }

  return (
    <>
      {/* El velo NO es un botón y por eso no anuncia nada: cerrar tocando fuera
          es un atajo de puntero, y el camino accesible equivalente —`Escape` y
          el propio foco atrapado en la hoja— ya existe. */}
      <div className={`lob-velo${visible ? ' is-on' : ''}`} onClick={() => onCerrar?.()} aria-hidden="true" />
      <aside
        ref={hojaRef}
        className={`lob-hoja${visible ? ' is-on' : ''}${llegado ? '' : ' es-reservada'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lob-hoja-t"
        // Una vez nacida se queda en el DOM —se mueve con `transform`, que es lo
        // que le da su transición— así que cerrada se retira del árbol de
        // accesibilidad y del orden de tabulación (`atributosHoja`, lobbyCore).
        {...atributosHoja(visible)}
      >
        <h2 id="lob-hoja-t" className="lob-hoja-t" tabIndex={-1} ref={tituloRef}>
          {t('lob.cfg.titulo')}
        </h2>
        {llegado
          ? <Contenido abierta={visible} onCerrar={onCerrar} avisar={avisar} cuenta={cuenta} onCerrarSesion={onCerrarSesion} />
          : <FilasReservadas />}
      </aside>

      {/* El aviso de la hoja. Caja reservada siempre y `visibility` (O1). Su regla
          viaja con las filas, y sin ellas nadie lo pide. */}
      {llegado && (
        <div className={`cfg-toast${toast !== null ? ' is-on' : ''}`} role="status" aria-live="polite" data-accion="cfg-toast">
          {toast !== null ? t(toast) : ' '}
        </div>
      )}
    </>
  )
}
