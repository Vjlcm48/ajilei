import { useState } from 'react'
import Capitulo from './Capitulo'
import { IndiceCapa } from './ListaTemas'
import { capituloDeFase } from './capitulos'

// ── TUT-1 T4 · Lo que abre la fila «Cómo se juega» del ⋮ ────────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.5 y P-1/P-2. La mesa sólo dice en qué fase se tocó
// la fila; aquí se decide qué se abre: el capítulo de la fase sobre la mesa viva, o el
// índice en una capa (entre manos), y desde el índice, el capítulo elegido.
/**
 * @param {object} p
 * @param {string} p.fase         `game.phase` al tocar la fila
 * @param {boolean} p.barajando   la mano nueva se estaba barajando (ya es reparto)
 * @param {object} p.game         la mesa viva
 * @param {boolean} p.pvp         entre personas (P-1)
 * @param {() => void} p.onCerrar
 */
export default function TutorialMesa({ fase, barajando, game, pvp, onCerrar }) {
  const [abierto, setAbierto] = useState(() => capituloDeFase(fase, barajando))
  if (!abierto) return <IndiceCapa onElegir={(n) => setAbierto({ n, inicio: 0 })} onCerrar={onCerrar} />
  return (
    <Capitulo key={`${abierto.n}-${abierto.inicio}`} n={abierto.n} inicio={abierto.inicio}
      vivo={game} pvp={pvp} onCerrar={onCerrar} onTerminar={onCerrar} />
  )
}
