import { Component, Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import PantallaDiferida from '../components/PantallaDiferida'
import CapaSenal from '../components/CapaSenal'
import { CAPITULOS, PANTALLAS, anclasDe } from './capitulos'
import { momentoGuiada } from './momento'
import { guia } from '../lib/guia'
import { volverAlIndice, pasoEnCurso, anotarPaso, soltarCapitulo } from './vuelta'
import { soltarMazo } from '../lib/mazoDado'
import { APUESTA, ASIENTOS, NIVEL, MANOS, decidirRival } from '../lib/guiaManos'
import { fabricaMesa, trozoMesa } from '../lib/cargarMesa'
import { sumarTextos } from '../config/textos'
import { TEXTOS_TUT_COMUNES, TEXTOS_TUT_CAP5, TEXTOS_TUT_TEMAS } from '../config/textos.tut.es'

sumarTextos('es', { ...TEXTOS_TUT_COMUNES, ...TEXTOS_TUT_TEMAS, ...TEXTOS_TUT_CAP5 })

// La mesa, por su trozo (INV-29): nadie la importa de forma estática.
const GameTable = lazy(fabricaMesa)
// La muestra (P-4) viaja con la MESA, donde ya viven `PlayingCard` y la caja del pozo: si
// viajara aquí, `PlayingCard` se partiría en un trozo compartido y la entrada cargaría su
// nombre (`1.8b`). Cuando un capítulo la pinta, la mesa ya está cargada.
const MuestraCartas = lazy(() => Promise.resolve(fabricaMesa()).then((m) => ({ default: m.MuestraCartas })))

// ── TUT-1 T4 · Un capítulo de «Aprender por tema» ───────────────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.3, §0 y P-1 a P-5; T5: AJILEI_TUT-1_T5_v1.0.md
// §1.1 y P-1 a P-4; normativo AJILEI_Tutorial_v1.5.md §2.1 y §2.2.
//
// TRES SITIOS, LOS MISMOS PASOS.
//   · Desde el índice: la mesa de la guiada CONGELADA en el momento del paso
//     (`momento.js`, el motor real). Es `GameTable` con un `guion` que nace en ese
//     estado, sin barajar nunca (`armar` vacío), con la máquina de turnos en pausa
//     (`pausa`: `useCongelado`) y la capa como su `Control`. Un momento nuevo es una
//     mesa nueva (`key`): mismo mazo, mismas manos.
//   · Desde el ⋮ de una mesa (P-2): sobre la mesa VIVA (`vivo`), sin segunda mesa ni
//     segundo mazo; el aro va al ancla que exista y, si no hay ninguna, la tarjeta
//     fija. Entre personas, el primer paso dice «Tu reloj sigue corriendo» (P-1).
//   · T5 · la Pista C, sobre la PANTALLA VIVA de la app (`pantalla` en el paso): el
//     capítulo navega con la ruta de `App` (`onPantalla`, sin escribir nada) y se posa
//     sobre la pantalla que monta `App` (`enApp`: este componente va encima, en el marco
//     de las pantallas con barra). La capa espera a que el ancla nazca (la pantalla llega
//     por su trozo) y la burbuja va pegada a ella. Un paso con `momento` vuelve a la
//     mesa congelada (`screen` = `capitulo`). Cada sitio monta su `Capitulo`; el paso en
//     curso viaja de uno a otro por `vuelta.js` (`pasoEnCurso`).
//
// EN EL CAPÍTULO NADA RESPONDE: el velo no deja pasar el toque (`pasa = false`); la
// capa sólo señala (P-3: los botones se ven con su disponibilidad real). Se avanza con
// «Siguiente» o tocando la pantalla fuera de la burbuja; «Volver» siempre; «Cerrar»
// arriba a la derecha, sin pregunta y sin ✓; «Terminar» en el último paso pone el ✓
// (`ajilei.guia.vistos`, P-5). Ninguna llamada al servidor.
//
// R-2 · Al cerrarse, por cualquier puerta, `soltarMazo()`: el generador queda en el
// azar de verdad aunque ningún momento lo haya dejado tomado.

const PasoActual = createContext(null)

/**
 * @param {object}   p
 * @param {number}   p.n           el capítulo (1–10)
 * @param {number}  [p.inicio]     el paso por el que abre (índice desde 0)
 * @param {object}  [p.vivo]       la mesa viva (`game`) si se abre desde el ⋮
 * @param {boolean} [p.pvp]        la mesa viva es entre personas (P-1)
 * @param {boolean} [p.enApp]      (T5) va encima de una pantalla de la app que monta `App`
 * @param {(s:string) => void} [p.onPantalla]  (T5) navega a `screen` sin escribir nada
 * @param {Function} p.onCerrar    «Cerrar» (y Escape)
 * @param {Function} [p.onTerminar] «Terminar», ya con el ✓ puesto (sin él, `onCerrar`)
 */
// ── T5 · STOP-T · NUNCA LA PANTALLA EN VERDE ──────────────────────────────────
// En el S25, el capítulo 9 dejó una vez la app entera en verde al pasar del 1 al 2 (no se
// reprodujo con el banco imitado ni sobre el bundle real con sesión simulada). Un error en el
// capítulo desmontaría la app; algo que suspende dentro, el `Suspense` de la raíz la cambiaría
// por su espera (verde). Por eso el capítulo lleva su propia red: un `Suspense` sin respaldo
// (si algo suspende, sólo falta la capa un instante; la pantalla sigue) y un límite de error
// que, si algo falla, cierra el capítulo y vuelve al índice.
//
// `VITE_TUT_DIAG` (SÓLO el build del túnel; fuera de él, este código no existe): un registro de
// los últimos diez eventos del capítulo —milisegundo desde que se abrió, paso y qué pasó: cada
// navegación, la espera del ancla y lo que tardó, el ancla perdida, el `Suspense` propio, los
// errores atrapados y los de ventana o consola— en una caja que se QUEDA a la vista hasta su
// «Cerrar», para fotografiarla en el aparato. Se pinta fuera de React (un nodo en `body`), para
// que ningún montaje ni cambio de pantalla la borre.
const DIAG = !!import.meta.env.VITE_TUT_DIAG
const diagLista = []
let diagT0 = 0
let diagOyendo = false

function diag(paso, texto) {
  if (!DIAG) return
  // El reloj de cada caja empieza con su primer evento.
  if (!document.getElementById('tut-diag')) diagT0 = performance.now()
  diagLista.push(`${String(Math.round(performance.now() - diagT0)).padStart(6)} ms · ${paso} · ${texto}`)
  if (diagLista.length > 10) diagLista.shift()
  let caja = document.getElementById('tut-diag')
  if (!caja) {
    caja = document.createElement('div')
    caja.id = 'tut-diag'
    caja.setAttribute('role', 'log')
    caja.style.cssText = 'position:fixed;left:8px;right:8px;top:60px;z-index:2147483647;padding:8px 10px;border-radius:8px;background:#3a0d16;color:#fff;font:11px/1.35 monospace;white-space:pre-wrap;word-break:break-all'
    const pre = document.createElement('div')
    const cerrar = document.createElement('button')
    cerrar.type = 'button'
    cerrar.textContent = 'Cerrar'
    cerrar.style.cssText = 'display:block;margin-top:6px;min-height:44px;padding:0 16px'
    cerrar.addEventListener('click', (ev) => { ev.stopPropagation(); diagLista.length = 0; caja.remove() })
    caja.append(pre, cerrar)
    document.body.append(caja)
  }
  caja.firstChild.textContent = `[diag] ${diagLista.join('\n')}`
}

// Los errores que no pasan por el límite (los de la ventana y los que React cuenta por consola).
function oirErrores() {
  if (!DIAG || diagOyendo) return
  diagOyendo = true
  const corto = (x) => String(x?.message ?? x).slice(0, 160)
  window.addEventListener('error', (ev) => diag('—', `error de ventana: ${corto(ev.error ?? ev.message)}`))
  window.addEventListener('unhandledrejection', (ev) => diag('—', `promesa rechazada: ${corto(ev.reason)}`))
  const original = console.error
  console.error = (...args) => { diag('—', `consola: ${args.map(corto).join(' ').slice(0, 200)}`); original(...args) }
}

function DiagSuspendio({ n }) {
  useEffect(() => { diag(`${n}`, 'el capítulo SUSPENDIÓ (su Suspense propio)') }, [n])
  return null
}

export default function Capitulo(props) {
  return (
    <RedCapitulo onCerrar={props.onCerrar} n={props.n}>
      <Suspense fallback={DIAG ? <DiagSuspendio n={props.n} /> : null}>
        <CapituloDentro {...props} />
      </Suspense>
    </RedCapitulo>
  )
}

class RedCapitulo extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error) {
    diag(`${this.props.n}`, `ERROR atrapado por el límite: ${String(error?.message ?? error).slice(0, 200)}`)
    console.error('[tut] el capítulo falló', error)
    soltarCapitulo()
    soltarMazo()
    volverAlIndice()
    this.props.onCerrar?.()
  }

  render() {
    return this.state.error ? null : this.props.children
  }
}

function CapituloDentro({ n, inicio = 0, vivo = null, pvp = false, enApp = false, onPantalla, onCerrar, onTerminar = onCerrar }) {
  const cap = CAPITULOS[n]
  const total = cap?.pasos.length ?? 0
  // Desde el índice, sigue por el paso en que iba el capítulo en la pantalla anterior (T5).
  const [i, setI] = useState(() => Math.min(Math.max((vivo ? null : pasoEnCurso(n)) ?? inicio, 0), Math.max(total - 1, 0)))
  useEffect(() => {
    if (!DIAG) return
    oirErrores()
    diag(`${n}.${i + 1}`, `monta el capítulo ${enApp ? 'sobre la pantalla' : vivo ? 'sobre la mesa viva' : 'en la rama de la mesa'}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- un registro por montaje

  useEffect(() => soltarMazo, [])
  useEffect(() => { if (!vivo) anotarPaso(n, i) }, [n, i, vivo])

  // Desde el índice, el capítulo vuelve al índice (P-5); desde el ⋮ no hay índice al que volver.
  const cerrar = useCallback(() => { soltarCapitulo(); soltarMazo(); if (!vivo) volverAlIndice(); onCerrar?.() }, [onCerrar, vivo])
  const terminar = useCallback(() => { guia.marcarVisto(n); soltarCapitulo(); soltarMazo(); if (!vivo) volverAlIndice(); onTerminar?.() }, [n, onTerminar, vivo])
  // El paso se anota ANTES de cambiar de pantalla: el `Capitulo` del otro sitio lo lee al montarse.
  const ir = useCallback((k) => { if (!vivo) anotarPaso(n, k); setI(k) }, [n, vivo])
  const volver = useCallback(() => ir(Math.max(0, i - 1)), [ir, i])
  const siguiente = useCallback(() => ir(Math.min(total - 1, i + 1)), [ir, i, total])

  const ctx = { cap, n, i, total, pvp, vivo: !!vivo, volver, siguiente, terminar, cerrar }

  // T5 · dónde vive el paso: una pantalla de la app (`pantalla`) o la mesa congelada.
  const paso = cap?.pasos[i]
  const destino = paso?.pantalla ?? 'capitulo'
  const aqui = !!vivo || !paso || (paso.pantalla ? enApp : !enApp)
  useEffect(() => {
    if (!vivo && paso && (paso.pantalla || !aqui)) {
      if (DIAG && !aqui) diag(`${n}.${i + 1}`, `navega a «${destino}»`)
      onPantalla?.(destino)
    }
  }, [vivo, paso, aqui, destino, onPantalla]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!cap || total === 0 || !aqui) return null
  if (vivo) return <PasoCapitulo ctx={ctx} game={vivo} />
  if (enApp) return <PasoCapitulo ctx={ctx} game={null} />
  return (
    <PasoActual.Provider value={ctx}>
      <MesaDelMomento momento={cap.pasos[i].momento} onCerrar={cerrar} />
    </PasoActual.Provider>
  )
}

// DIAG · la espera del ancla de un paso de la Pista C: cuándo empieza, cuánto dura, si se pierde.
function DiagAncla({ paso, def, esperando, perdida }) {
  const desde = useRef(null)
  useEffect(() => {
    const pantalla = document.querySelector(PANTALLAS[def.pantalla]) ? 'montada' : 'sin montar'
    if (perdida) diag(paso, `ANCLA PERDIDA (${(def.ancla ?? []).join(' · ')}) · pantalla ${pantalla}`)
    else if (esperando) {
      desde.current = performance.now()
      diag(paso, `espera el ancla · pantalla ${pantalla}`)
    } else if (desde.current !== null) {
      diag(paso, `ancla a la vista tras ${Math.round(performance.now() - desde.current)} ms`)
      desde.current = null
    }
  }, [paso, esperando, perdida]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// La mesa de la guiada en un momento. Se rehace sólo cuando el momento cambia.
function MesaDelMomento({ momento, onCerrar }) {
  const [mano, paso] = momento
  const guion = useMemo(() => ({
    manos: MANOS,
    estadoInicial: () => momentoGuiada(mano, paso),
    // Un momento nunca empieza otra mano: no hay orden que armar.
    armar: () => {},
    decidir: decidirRival,
    pausa: true,
    Control: ControlDelMomento,
    alTerminar: () => {},
    alSalir: onCerrar,
  }), [mano, paso, onCerrar])
  return (
    <PantallaDiferida trozo={trozoMesa} familia="abismo">
      <GameTable key={`${mano}-${paso}`} stake={APUESTA} numPlayers={ASIENTOS} nivel={NIVEL} guion={guion} onLeave={onCerrar} />
    </PantallaDiferida>
  )
}

// El `Control` del guion: lo monta la mesa con su `game`; el paso lo lee del contexto.
function ControlDelMomento({ game }) {
  const ctx = useContext(PasoActual)
  if (!ctx) return null
  return <PasoCapitulo ctx={ctx} game={game} />
}

// ── T5 · Pista C: el ancla, a la vista ──────────────────────────────────────
// Las pantallas con barra (`PantallaChips`) desplazan su cuerpo (`.sal-cuerpo`) con la zona
// del botón anclada al pie (`.sal-accion`, `sticky`): en un acostado bajo la fila del paso
// puede quedar debajo. Cuando el ancla nace (la pantalla llega por su trozo), el cuerpo se
// desplaza lo justo para verla entera sobre la zona del pie; desplazar no mueve ninguna caja
// (Δ 0 se mide en la misma posición). Si las anclas de un paso no caben juntas (los mandos del
// 8.3 en un acostado), se ven desde la primera, y las que quedan debajo no llevan hueco: un
// hueco sobre la zona del pie señalaría el botón. En el lobby (sin `.sal-cuerpo`), tal cual.
// Hasta que las anclas existen, ninguna: la capa vela la pantalla entera y espera a que la
// pantalla del paso se monte (`PANTALLAS`). STOP-T · si la pantalla ya está y el ancla no
// (`perdida`), el paso cae a la tarjeta sin flecha y sigue: nunca se queda esperando.
const MARGEN = 12

function useALaVista(paso) {
  const [vistas, setVistas] = useState(null)
  useEffect(() => {
    if (!paso.pantalla) return undefined
    const sels = paso.ancla ?? []
    let llevado = false
    let cuadro = 0
    const fijar = (ok, perdida = false) => setVistas((v) => (
      v?.paso === paso && v.perdida === perdida && v.ok.join('|') === ok.join('|') ? v : { paso, ok, perdida }))
    const medir = () => {
      cuadro = 0
      const els = sels.map((s) => document.querySelector(s))
      if (els.some((e) => !e)) {
        // La pantalla del paso está y el ancla no: la tarjeta (y la vara, roja).
        if (document.querySelector(PANTALLAS[paso.pantalla] ?? 'main')) fijar([], true)
        return
      }
      const cuerpo = els[0].closest('.sal-cuerpo')
      if (!cuerpo) { fijar(sels); return }
      const pie = cuerpo.querySelector(':scope > .sal-accion')
      const enPie = (e) => !!pie && pie.contains(e)
      const c = cuerpo.getBoundingClientRect()
      const bajo = pie ? Math.min(c.bottom, pie.getBoundingClientRect().top) : c.bottom
      const rs = els.map((e) => e.getBoundingClientRect())
      const libres = rs.filter((_, k) => !enPie(els[k]))
      if (!llevado && libres.length) {
        llevado = true
        const top = Math.min(...libres.map((r) => r.top))
        const fondo = Math.max(...libres.map((r) => r.bottom))
        const d = fondo - top > bajo - c.top - 2 * MARGEN || top < c.top ? top - c.top - MARGEN
          : fondo > bajo ? fondo - bajo + MARGEN : 0
        if (Math.abs(d) >= 1) { cuerpo.scrollTop += d; pedir(); return }
      }
      const ok = sels.filter((_, k) => enPie(els[k]) || (rs[k].top >= c.top - 1 && rs[k].bottom <= bajo + 1))
      fijar(ok.length ? ok : sels.slice(0, 1))
    }
    const pedir = () => { if (!cuadro) cuadro = requestAnimationFrame(medir) }
    const girar = () => { llevado = false; pedir() }
    const mo = new MutationObserver(pedir)
    mo.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', girar)
    pedir()
    return () => {
      if (cuadro) cancelAnimationFrame(cuadro)
      mo.disconnect()
      window.removeEventListener('resize', girar)
    }
  }, [paso])
  // Las de OTRO paso no valen (un paso nuevo en la misma pantalla espera a su medida).
  if (!paso.pantalla) return null
  return vistas?.paso === paso ? vistas : { ok: [], perdida: false }
}

function PasoCapitulo({ ctx, game }) {
  const { cap, n, i, total, pvp, vivo, volver, siguiente, terminar, cerrar } = ctx
  const paso = cap.pasos[i]
  const vistas = useALaVista(paso)
  let ancla = vistas ? vistas.ok : anclasDe(paso, game)
  let clave = paso.clave
  // Desde el ⋮: si el botón del paso no está montado, su hueco en la fila (`hueco`).
  if (vivo && paso.hueco && !ancla.some((s) => document.querySelector(s))) {
    ancla = paso.hueco.ancla
    clave = paso.hueco.clave
  }
  const nota = pvp && i === 0 ? { clave: 'tut.temas.reloj' } : paso.nota?.(game) ?? null
  const ultimo = i === total - 1
  // T5 · sobre una pantalla de la app, la capa espera a que el ancla nazca (la pantalla llega
  // por su trozo): sin `sinAncla`, que pintaría la tarjeta un instante y luego la burbuja.
  const app = !!paso.pantalla
  const perdida = !!vistas?.perdida
  return (
    <>
      {paso.muestra && <Suspense fallback={null}><MuestraCartas {...paso.muestra} /></Suspense>}
      {DIAG && app && <DiagAncla paso={`${n}.${i + 1}`} def={paso} esperando={!perdida && ancla.length === 0} perdida={perdida} />}
      <CapaSenal
        key={`${n}-${i}`}
        ancla={ancla}
        rotulo={clave}
        vars={paso.vars?.(game)}
        nota={nota?.clave ?? null}
        varsNota={nota?.vars}
        velo
        pasa={false}
        sinAncla={!app || perdida}
        barraFija
        colocacion="burbuja"
        aria={cap.titulo}
        controles={{ volver: i > 0, siguiente: !ultimo, terminar: true, salir: 'cerrar', paso: { n: i + 1, m: total } }}
        onVolver={volver}
        onSiguiente={siguiente}
        onTerminar={terminar}
        onSalir={cerrar}
        onCerrar={cerrar}
        onFondo={ultimo ? undefined : siguiente}
      />
    </>
  )
}
