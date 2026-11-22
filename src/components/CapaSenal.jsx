import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/senal.css'
import { t } from '../config/textos'
import { SoundButton } from './SoundButton'
import {
  union, huecosDe, bandas, radioDe, lineasDe, colocarBurbuja, burbujaCabe, colocarRespaldo, colocarBarra,
  colocarLibre, flechaEntre, trozosRotulo, SEPARACION,
} from './capaSenalCore'

// ── TUT-1 · La capa de señalización ─────────────────────────────────────────
// Rector: AJILEI_TUT-1_T1_v1.0.md §0 y §1.1; normativo `AJILEI_Tutorial_v1.4.md`
// («La forma elegida en la lámina»). UNA capa para las tres piezas: la partida
// guiada (GUI-1), las señales de primera vez y los capítulos de la serie (TUT-1).
// En esta tanda no la monta nadie: la montan las tandas 2 a 5.
//
// VA EN `body` (portal, molde de `MiniPerfil` y `AvisoSaldo`): `fixed` y fuera de
// `#root`, no hereda el `zoom` de la mesa (INV-59), y lo que mide
// `getBoundingClientRect` es lo que pinta. No es un `screen`: no navega.
//
// PINTA ENCIMA Y NUNCA EMPUJA (INV-05, INV-89). No reserva caja en ningún flujo,
// no toca el estilo de nadie salvo dos atributos de datos (`data-tut-unico` en
// `<html>` y `data-tut-activo` en el ancla) que `senal.css` lee para el gris de
// `unico`, sin geometría (opacidad). Δ 0 lo vigila `diagDSK tut`.
//
// LA FORMA (Victor, 2026-11-20, PC y S25):
//   · `burbuja` (capítulos y guiada): el rótulo pegado al ancla con pico y el
//     «paso n de m» dentro; los botones en una barra aparte, abajo. Si la
//     burbuja no tiene sitio —pasa de dos líneas, se sale o pisa un hueco— va la
//     TARJETA DE RESPALDO, fija abajo (o arriba si abajo hay un hueco), con el
//     paso y los botones dentro y una flecha al ancla.
//   · `libre` (señales de primera vez): sin velo ni controles, el rótulo con
//     fondo donde no tape nada (`colocarLibre`).
//   · Velo suave, 35 %, una sola cifra (`senal.css`). UN HUECO POR ANCLA.
//   · «SALIR» (v1.3 §1.1, tras la prueba del S25): arriba a la derecha, aparte
//     de «Siguiente», vinotinto con borde de oro, sin pregunta. En los capítulos
//     el mismo botón, en el mismo sitio, dice «Cerrar» (`controles.salir:
//     'cerrar'`). La burbuja, la tarjeta y la barra no lo pisan.
//
// EL TOQUE ES DEL JUGADOR (INV-45). El velo que se VE es un rectángulo SVG con
// una máscara que lo agujerea en cada hueco (los huecos pueden pisarse); lo que
// RECIBE el toque son bandas transparentes alrededor de los huecos. Un hueco
// nunca destapa otro control: dos anclas pegadas sólo comparten hueco si la caja
// de las dos no cubre nada más (`huecosDe`, con `evitar`). Sobre un hueco no hay nada, así que el dedo llega al ancla de
// verdad, con su activación de usuario (la pantalla completa se pide dentro de
// ese gesto). Nunca se reenvía un clic por código. Con `pasa = false` (un paso
// que sólo explica), otra banda transparente tapa cada hueco.
//
// SIN TEMPORIZADORES: todo avanza por toque. La medida se rehace con
// `requestAnimationFrame` cuando algo cambia (ventana, giro, desplazamiento,
// tamaño del ancla o del DOM): es medir, no programar el flujo.
//
// LOS BOTONES SUENAN como los demás (`SoundButton`): la capa se monta dentro del
// árbol de `App` (el portal conserva el contexto del sonido).

/**
 * @param {object}   p
 * @param {string|string[]} p.ancla   selector(es); cada elemento que case tiene su hueco
 * @param {string}   p.rotulo         clave de `t()`
 * @param {object}  [p.vars]          variables del rótulo
 * @param {boolean} [p.velo]          atenúa el resto (con un hueco por ancla)
 * @param {boolean} [p.pasa]          el hueco deja pasar el toque (por defecto, si hay `unico`)
 * @param {boolean} [p.aro]           anillo dorado con pulso alrededor de cada hueco
 * @param {'burbuja'|'libre'} [p.colocacion]
 * @param {{selector:string, peso?:number}[]} [p.evita]  (libre) lo que el rótulo no debe tapar
 * @param {{siguiente?:boolean, volver?:boolean, cerrar?:boolean, salir?:boolean|'cerrar', paso?:{n:number,m:number}}} [p.controles]
 * @param {boolean} [p.unico]         apaga a la vista el resto de controles y deja pasar sólo el ancla
 * @param {string|string[]} [p.alTocar]  selector(es) cuyo toque llama a `onAncla` (la señal se apaga)
 * @param {string}  [p.aria]          clave de `t()` del nombre accesible de la capa
 * @param {Function} [p.onSiguiente] @param {Function} [p.onVolver] @param {Function} [p.onCerrar]
 * @param {Function} [p.onSalir]     @param {Function} [p.onAncla]
 */
export default function CapaSenal({
  ancla, rotulo, vars, velo = false, pasa, aro = true, colocacion = 'burbuja', evita = [], controles = {},
  unico = false, alTocar = null, aria = 'tut.capa.aria',
  onSiguiente, onVolver, onCerrar, onSalir, onAncla,
}) {
  const idRotulo = useId()
  const raizRef = useRef(null)
  const rotuloRef = useRef(null)
  const medidaRef = useRef(null)
  const barraRef = useRef(null)
  const salirRef = useRef(null)
  const [geo, setGeo] = useState(null)
  const selectores = Array.isArray(ancla) ? ancla : [ancla]
  const clave = selectores.join('|')
  const dejaPasar = pasa ?? unico
  const conBotones = hayBotones(controles)
  const libre = colocacion === 'libre'

  // ── Medir ────────────────────────────────────────────────────────────────
  const medir = useCallback(() => {
    const vista = { w: window.innerWidth, h: window.innerHeight }
    const els = selectores.flatMap((s) => [...document.querySelectorAll(s)])
    // Los demás controles de la pantalla: lo que un hueco fundido no puede destapar.
    const evitar = [...document.querySelectorAll(CONTROLES)]
      .filter((e) => !raizRef.current?.contains(e) && !els.some((a) => a === e || a.contains(e) || e.contains(a)))
      .map((e) => e.getBoundingClientRect())
    const huecos = huecosDe(els.map((e) => e.getBoundingClientRect()), vista, { evitar })
    const envolvente = union(huecos)
    const rv = rotuloRef.current
    // «Salir»: lo que la burbuja, la tarjeta y la barra no pueden pisar.
    const sr = salirRef.current?.getBoundingClientRect()
    const salir = sr ? [{ left: sr.left, top: sr.top, width: sr.width, height: sr.height }] : []
    const techo = sr ? sr.bottom + SEPARACION : undefined
    const tamDe = (el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height } }
    let modo = libre ? 'libre' : 'burbuja'
    let rot = null
    let lado = null
    let picoX = null
    let fl = null
    let barra = null
    if (envolvente && libre && rv) {
      const obst = evita.flatMap((o) => [...document.querySelectorAll(o.selector)]
        .map((e) => ({ caja: e.getBoundingClientRect(), peso: o.peso ?? 1 })))
      rot = colocarLibre({ tam: tamDe(rv), ancla: envolvente, obstaculos: obst, vista }).caja
    } else if (envolvente && !libre && medidaRef.current) {
      // La burbuja se mide en su copia invisible (mismas clases, mismo texto):
      // así se sabe si cabe sin tener que pintarla antes en su sitio.
      const m = medidaRef.current
      const p = m.querySelector('p')
      const lineas = p ? lineasDe(p.getBoundingClientRect().height, parseFloat(getComputedStyle(p).lineHeight)) : 0
      const b = colocarBurbuja({ tam: tamDe(m), hueco: envolvente, vista })
      if (burbujaCabe({ caja: b.caja, huecos: [...huecos, ...salir], vista, lineas })) {
        rot = b.caja; lado = b.lado; picoX = b.picoX
        const br = barraRef.current
        if (conBotones && br) barra = colocarBarra({ tam: tamDe(br), evitar: [...huecos, rot], vista, techo })
      } else {
        modo = 'tarjeta'
        // La tarjeta se coloca con SU tamaño: si el rótulo aún se pinta como burbuja,
        // se espera al siguiente render (el efecto de diseño vuelve a medir).
        if (rv && rv.dataset.modo === 'tarjeta') {
          rot = colocarRespaldo({ tam: tamDe(rv), huecos, vista, techo })
          fl = flechaEntre(rot, envolvente)
        }
      }
    }
    const nuevo = { vista, huecos, modo, rot, lado, picoX, fl, barra, n: els.length }
    setGeo((viejo) => (igual(viejo, nuevo) ? viejo : nuevo))
  }, [clave, libre, conBotones, evita]) // eslint-disable-line react-hooks/exhaustive-deps

  // Antes de pintar, y otra vez tras cada render (el rótulo cambia de forma o de texto).
  useLayoutEffect(() => { medir() })

  useEffect(() => {
    let cuadro = 0
    const pedir = () => {
      if (cuadro) return
      cuadro = requestAnimationFrame(() => { cuadro = 0; medir() })
    }
    window.addEventListener('resize', pedir)
    window.addEventListener('orientationchange', pedir)
    window.addEventListener('scroll', pedir, true)
    window.visualViewport?.addEventListener('resize', pedir)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(pedir) : null
    ro?.observe(document.documentElement)
    selectores.forEach((s) => document.querySelectorAll(s).forEach((e) => ro?.observe(e)))
    // El ancla puede nacer, morir o moverse con el DOM (la fila de acciones aparece en el turno).
    const mo = new MutationObserver(pedir)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'disabled'] })
    return () => {
      if (cuadro) cancelAnimationFrame(cuadro)
      window.removeEventListener('resize', pedir)
      window.removeEventListener('orientationchange', pedir)
      window.removeEventListener('scroll', pedir, true)
      window.visualViewport?.removeEventListener('resize', pedir)
      ro?.disconnect()
      mo.disconnect()
    }
  }, [medir]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── `unico`: el resto de controles, en gris (hoja aditiva, sólo opacidad) ──
  useEffect(() => {
    if (!unico) return undefined
    const html = document.documentElement
    const marcados = selectores.flatMap((s) => [...document.querySelectorAll(s)])
    html.setAttribute('data-tut-unico', '')
    marcados.forEach((e) => e.setAttribute('data-tut-activo', ''))
    return () => {
      html.removeAttribute('data-tut-unico')
      marcados.forEach((e) => e.removeAttribute('data-tut-activo'))
    }
  }, [unico, clave, geo?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── La señal se apaga al hacer la acción (el toque real, en captura) ───────
  useEffect(() => {
    if (!alTocar || !onAncla) return undefined
    const sel = (Array.isArray(alTocar) ? alTocar : [alTocar]).join(',')
    const oir = (ev) => { if (ev.target instanceof Element && ev.target.closest(sel)) onAncla() }
    document.addEventListener('click', oir, true)
    return () => document.removeEventListener('click', oir, true)
  }, [alTocar, onAncla])

  // ── Teclado: el foco no se escapa por detrás del velo; Escape cierra ──────
  useEffect(() => {
    if (!velo) return undefined
    const raiz = raizRef.current
    const enfocables = () => {
      const propios = raiz ? [...raiz.querySelectorAll('button:not([disabled])')] : []
      const ajenos = dejaPasar ? selectores.flatMap((s) => [...document.querySelectorAll(s)]) : []
      return [...ajenos, ...propios]
    }
    const previo = document.activeElement
    const primero = raiz?.querySelector('[data-tut-primario]') ?? enfocables()[0]
    primero?.focus({ preventScroll: true })
    const tecla = (ev) => {
      if (ev.key === 'Escape' && onCerrar) { ev.preventDefault(); onCerrar(); return }
      if (ev.key !== 'Tab') return
      const lista = enfocables()
      if (lista.length === 0) { ev.preventDefault(); return }
      const i = lista.indexOf(document.activeElement)
      const sig = ev.shiftKey ? (i <= 0 ? lista.length - 1 : i - 1) : (i === -1 || i === lista.length - 1 ? 0 : i + 1)
      ev.preventDefault()
      lista[sig].focus({ preventScroll: true })
    }
    document.addEventListener('keydown', tecla, true)
    return () => {
      document.removeEventListener('keydown', tecla, true)
      if (previo instanceof HTMLElement && previo.isConnected) previo.focus({ preventScroll: true })
    }
  }, [velo, dejaPasar, clave, onCerrar, rotulo]) // eslint-disable-line react-hooks/exhaustive-deps

  const modo = geo?.modo ?? (libre ? 'libre' : 'burbuja')
  const huecos = geo?.huecos ?? []
  const listo = !!(geo?.rot && (modo !== 'burbuja' || !conBotones || geo.barra))
  const texto = trozosRotulo(t(rotulo, vars)).map((tr, i) => (tr.fuerte ? <strong key={i}>{tr.texto}</strong> : <span key={i}>{tr.texto}</span>))
  const paso = controles.paso ? <span className="tut-paso tut-paso--burbuja">{t('tut.ctl.paso', controles.paso)}</span> : null
  const oculto = { left: 0, top: 0, visibility: 'hidden' }

  return createPortal(
    <div
      ref={raizRef}
      className={`tut-capa tut-capa--${colocacion}${velo ? ' con-velo' : ''}`}
      role={velo ? 'dialog' : 'note'}
      aria-modal={velo ? 'true' : undefined}
      aria-label={t(aria)}
      aria-describedby={idRotulo}
      data-listo={listo ? '' : undefined}
      data-modo={modo}
    >
      {velo && geo && huecos.length > 0 && (
        <>
          {/* Lo que se VE: la ventana velada, con la máscara agujereada en cada hueco. */}
          <svg className="tut-velo" width={geo.vista.w} height={geo.vista.h} aria-hidden="true">
            <defs>
              <mask id={`${idRotulo}-velo`} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.vista.w} height={geo.vista.h}>
                <rect width={geo.vista.w} height={geo.vista.h} fill="white" />
                {huecos.map((h, i) => (
                  <rect key={i} className="tut-velo-hueco" x={h.left} y={h.top} width={h.width} height={h.height} rx={radioDe(h)} fill="black" />
                ))}
              </mask>
            </defs>
            <rect className="tut-velo-fondo" width={geo.vista.w} height={geo.vista.h} mask={`url(#${idRotulo}-velo)`} />
          </svg>
          {/* Lo que RECIBE el toque: las bandas alrededor; los huecos, libres (o tapados). */}
          {bandas(huecos, geo.vista).map((b, i) => <div key={`b${i}`} className="tut-banda" style={estiloCaja(b)} aria-hidden="true" />)}
          {!dejaPasar && huecos.map((h, i) => <div key={`h${i}`} className="tut-banda" style={estiloCaja(h)} aria-hidden="true" />)}
        </>
      )}
      {velo && (!geo || huecos.length === 0) && <div className="tut-banda tut-banda--entera" aria-hidden="true" />}
      {aro && huecos.map((h, i) => <div key={`a${i}`} className="tut-aro" style={estiloCaja(h)} aria-hidden="true" />)}
      {geo?.fl && (
        <svg className="tut-flecha" width={geo.vista.w} height={geo.vista.h} aria-hidden="true">
          <defs>
            <marker id={`${idRotulo}-punta`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" />
            </marker>
          </defs>
          <line x1={geo.fl.x1} y1={geo.fl.y1} x2={geo.fl.x2} y2={geo.fl.y2} markerEnd={`url(#${idRotulo}-punta)`} />
        </svg>
      )}
      {/* La copia invisible de la burbuja: sólo para medirla (cabe o no cabe). */}
      {!libre && (
        <div ref={medidaRef} className="tut-rotulo tut-rotulo--burbuja tut-rotulo--medida" aria-hidden="true">
          <p className="tut-rotulo-texto">{texto}</p>
          {paso}
        </div>
      )}
      <div
        ref={rotuloRef}
        className={`tut-rotulo tut-rotulo--${modo}${modo === 'burbuja' && geo?.lado ? ` lado-${geo.lado}` : ''}`}
        data-modo={modo}
        style={geo?.rot ? { left: geo.rot.left, top: geo.rot.top, '--pico-x': `${geo.picoX ?? 0}px` } : oculto}
      >
        <p id={idRotulo} className="tut-rotulo-texto">{texto}</p>
        {modo === 'burbuja' && paso}
        {modo !== 'burbuja' && hayControles(controles) && (
          <Controles c={controles} onSiguiente={onSiguiente} onVolver={onVolver} onCerrar={onCerrar} />
        )}
      </div>
      {modo === 'burbuja' && conBotones && (
        <div ref={barraRef} className="tut-barra" style={geo?.barra ? { left: geo.barra.left, top: geo.barra.top } : oculto}>
          <Controles c={{ ...controles, paso: null }} onSiguiente={onSiguiente} onVolver={onVolver} onCerrar={onCerrar} />
        </div>
      )}
      {controles.salir && <BotonSalir ref={salirRef} cerrar={controles.salir === 'cerrar'} onClick={onSalir} />}
    </div>,
    document.body,
  )
}

/**
 * «Salir» (guiada) o «Cerrar» (capítulos): arriba a la derecha, fijo, fuera de la
 * barra. Lo usa también la espera de la guiada entre pasos (`GuiaControl`).
 */
export function BotonSalir({ ref, cerrar = false, onClick }) {
  return (
    <SoundButton ref={ref} type="button" className="tut-salir" data-accion="tut-salir" onClick={onClick}>
      {t(cerrar ? 'tut.ctl.cerrar' : 'tut.ctl.salir')}
    </SoundButton>
  )
}

function Controles({ c, onSiguiente, onVolver, onCerrar }) {
  const ultimo = c.paso && c.paso.n >= c.paso.m
  const cerrarEsPrincipal = ultimo || !c.siguiente
  return (
    <div className="tut-controles">
      {c.paso && <span className="tut-paso">{t('tut.ctl.paso', { n: c.paso.n, m: c.paso.m })}</span>}
      <span className="tut-controles-botones">
        {c.volver && <SoundButton type="button" className="tut-btn tut-btn--sec" data-accion="tut-volver" onClick={onVolver}>{t('tut.ctl.volver')}</SoundButton>}
        {c.cerrar && (
          <SoundButton type="button" className={`tut-btn ${cerrarEsPrincipal ? 'tut-btn--pri' : 'tut-btn--sec'}`} data-accion="tut-cerrar"
            data-tut-primario={cerrarEsPrincipal ? '' : undefined} onClick={onCerrar}>{t('tut.ctl.cerrar')}</SoundButton>
        )}
        {c.siguiente && !ultimo && (
          <SoundButton type="button" className="tut-btn tut-btn--pri" data-accion="tut-siguiente" data-tut-primario="" onClick={onSiguiente}>{t('tut.ctl.siguiente')}</SoundButton>
        )}
      </span>
    </div>
  )
}

// Lo que cuenta como «otro control» para no destaparlo.
const CONTROLES = 'button, a[href], input, select, textarea, [role="button"], [data-accion]'

// «Salir» no cuenta: va aparte, arriba a la derecha.
const hayBotones = (c) => !!(c && (c.siguiente || c.volver || c.cerrar))
const hayControles = (c) => hayBotones(c) || !!c?.paso
const estiloCaja = (c) => ({ left: c.left, top: c.top, width: c.width, height: c.height })

function igual(a, b) {
  if (!a || !b) return a === b
  return JSON.stringify(a) === JSON.stringify(b)
}
