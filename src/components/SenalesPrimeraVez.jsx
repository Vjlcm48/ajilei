import { useEffect, useRef } from 'react'
import CapaSenal from './CapaSenal'
import { sumarTextos } from '../config/textos'
import { TEXTOS_TUT_COMUNES, TEXTOS_TUT_SENALES } from '../config/textos.tut.es'
import { guia } from '../lib/guia'

// ── TUT-1 T3 · Las señales de primera vez ───────────────────────────────────
// Rector: AJILEI_TUT-1_T3_v1.0.md §2.4; normativo AJILEI_Tutorial_v1.5.md §1.6.
// Tres pistas, en la mesa REAL contra las IAS (con `control` y sin `guion` ni
// `partida`: contra personas no hay señales en esta tanda). La monta `GameTable`
// desde el trozo de la guiada (`screens/Guiada.jsx` la reexporta): la capa y sus
// textos no viajan con la mesa.
//
// UNA SOLA VEZ CADA UNA. Sale cuando toca; se apaga al hacer la acción, y no vuelve
// (`ajilei.guia.senales`, INV-12). «Hacer la acción» se lee en la mesa, no en el
// dedo: la pista se marca cuando su momento TERMINA —«Iniciar mano» deja de
// ofrecerse (`beginHand`), el turno de apuesta pasa (`act`, también el pase por
// tiempo) o el descarte se manda (`handleDiscard`)—. Si el jugador se va de la mesa
// con la pista delante, no se marca: la verá la próxima vez.
//
// SIN VELO: el aro y el rótulo con fondo, colocado donde no tape nada (`libre`).
// El reloj de turno SIGUE CORRIENDO (es la mesa real): la pista no lo tapa, ni las
// cartas, ni la fila de acciones (`EVITA`). La capa es `pointer-events: none` en su
// modo libre: el dedo llega a la mesa como siempre. Δ 0 (portal a `body`).

sumarTextos('es', { ...TEXTOS_TUT_COMUNES, ...TEXTOS_TUT_SENALES })

const PISTAS = Object.freeze({
  iniciar:   { ancla: '[data-accion="iniciar-mano"]', rotulo: 'tut.senal.iniciar' },
  apostar:   { ancla: '[data-ancla="fila-acciones"]', rotulo: 'tut.senal.turno' },
  descartar: { ancla: '[data-accion="descartar"]',    rotulo: 'tut.senal.descartar' },
})

// Lo que el rótulo no debe tapar, con su peso (`colocarLibre`): el reloj antes que nada.
const EVITA = Object.freeze([
  { selector: '.timer-display', peso: 8 },
  { selector: '.action-area', peso: 4 },
  { selector: '[data-ancla="carta"]', peso: 3 },
  { selector: '[data-ancla="pozo"]', peso: 2 },
  { selector: '.player-bar', peso: 2 },
])

/**
 * @param {object} p
 * @param {boolean} p.iniciable  «Iniciar mano» está a la vista
 * @param {boolean} p.turno      turno de apuesta del jugador
 * @param {boolean} p.descarte   descarte del jugador en curso
 * @param {number}  p.segundos   los del reloj de turno (`TURN_TIME`)
 */
export default function SenalesPrimeraVez({ iniciable, turno, descarte, segundos }) {
  const activa = iniciable ? 'iniciar' : turno ? 'apostar' : descarte ? 'descartar' : null
  const previa = useRef(null)

  // El momento de una pista terminó: se marca, si no lo estaba (sólo escribe el aparato).
  useEffect(() => {
    const p = previa.current
    if (p && p !== activa && !guia.leer().senales[p]) guia.marcarSenal(p)
    previa.current = activa
  }, [activa])

  if (!activa || guia.leer().senales[activa]) return null
  const pista = PISTAS[activa]
  return (
    <CapaSenal
      key={activa}
      ancla={pista.ancla}
      rotulo={pista.rotulo}
      vars={{ s: segundos }}
      colocacion="libre"
      evita={EVITA}
    />
  )
}
