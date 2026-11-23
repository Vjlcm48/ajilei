import { Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PantallaDiferida from '../components/PantallaDiferida'
import CapaSenal from '../components/CapaSenal'
import { CAPITULOS, anclasDe } from './capitulos'
import { momentoGuiada } from './momento'
import { guia } from '../lib/guia'
import { volverAlIndice } from './vuelta'
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
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.3, §0 y P-1 a P-5; normativo
// AJILEI_Tutorial_v1.4.md §2.1 y §2.2.
//
// DOS SITIOS, LOS MISMOS PASOS.
//   · Desde el índice: la mesa de la guiada CONGELADA en el momento del paso
//     (`momento.js`, el motor real). Es `GameTable` con un `guion` que nace en ese
//     estado, sin barajar nunca (`armar` vacío), con la máquina de turnos en pausa
//     (`pausa`: `useCongelado`) y la capa como su `Control`. Un momento nuevo es una
//     mesa nueva (`key`): mismo mazo, mismas manos.
//   · Desde el ⋮ de una mesa (P-2): sobre la mesa VIVA (`vivo`), sin segunda mesa ni
//     segundo mazo; el aro va al ancla que exista y, si no hay ninguna, la tarjeta
//     fija. Entre personas, el primer paso dice «Tu reloj sigue corriendo» (P-1).
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
 * @param {number}   p.n           el capítulo (1–6)
 * @param {number}  [p.inicio]     el paso por el que abre (índice desde 0)
 * @param {object}  [p.vivo]       la mesa viva (`game`) si se abre desde el ⋮
 * @param {boolean} [p.pvp]        la mesa viva es entre personas (P-1)
 * @param {Function} p.onCerrar    «Cerrar» (y Escape)
 * @param {Function} p.onTerminar  «Terminar», ya con el ✓ puesto
 */
export default function Capitulo({ n, inicio = 0, vivo = null, pvp = false, onCerrar, onTerminar }) {
  const cap = CAPITULOS[n]
  const total = cap?.pasos.length ?? 0
  const [i, setI] = useState(() => Math.min(Math.max(inicio, 0), Math.max(total - 1, 0)))

  useEffect(() => soltarMazo, [])

  // Desde el índice, el capítulo vuelve al índice (P-5); desde el ⋮ no hay índice al que volver.
  const cerrar = useCallback(() => { soltarMazo(); if (!vivo) volverAlIndice(); onCerrar?.() }, [onCerrar, vivo])
  const terminar = useCallback(() => { guia.marcarVisto(n); soltarMazo(); if (!vivo) volverAlIndice(); onTerminar?.() }, [n, onTerminar, vivo])
  const volver = useCallback(() => setI((x) => Math.max(0, x - 1)), [])
  const siguiente = useCallback(() => setI((x) => Math.min(total - 1, x + 1)), [total])

  const ctx = { cap, n, i, total, pvp, vivo: !!vivo, volver, siguiente, terminar, cerrar }

  if (!cap || total === 0) return null
  if (vivo) return <PasoCapitulo ctx={ctx} game={vivo} />
  return (
    <PasoActual.Provider value={ctx}>
      <MesaDelMomento momento={cap.pasos[i].momento} onCerrar={cerrar} />
    </PasoActual.Provider>
  )
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

function PasoCapitulo({ ctx, game }) {
  const { cap, n, i, total, pvp, vivo, volver, siguiente, terminar, cerrar } = ctx
  const paso = cap.pasos[i]
  let ancla = anclasDe(paso, game)
  let clave = paso.clave
  // Desde el ⋮: si el botón del paso no está montado, su hueco en la fila (`hueco`).
  if (vivo && paso.hueco && !ancla.some((s) => document.querySelector(s))) {
    ancla = paso.hueco.ancla
    clave = paso.hueco.clave
  }
  const nota = pvp && i === 0 ? { clave: 'tut.temas.reloj' } : paso.nota?.(game) ?? null
  const ultimo = i === total - 1
  return (
    <>
      {paso.muestra && <Suspense fallback={null}><MuestraCartas {...paso.muestra} /></Suspense>}
      <CapaSenal
        key={`${n}-${i}`}
        ancla={ancla}
        rotulo={clave}
        vars={paso.vars?.(game)}
        nota={nota?.clave ?? null}
        varsNota={nota?.vars}
        velo
        pasa={false}
        sinAncla
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
