import { useLayoutEffect, useState } from 'react'
import { sumarTextos } from '../config/textos'
import { TEXTOS_TUT_COMUNES, TEXTOS_TUT_RUTA } from '../config/textos.tut.es'
import { guia } from '../lib/guia'
import Capitulo from './Capitulo'
import RutaIntro from './RutaIntro'
import RutaPuente from './RutaPuente'

sumarTextos('es', { ...TEXTOS_TUT_COMUNES, ...TEXTOS_TUT_RUTA })

// ── TUT-1 T6 · La ruta de la primera vez ─────────────────────────────────────
// Rector: AJILEI_TUT-1_T6_v1.0.md §1.2; normativo AJILEI_Tutorial_v1.5.md §1.2.1.
// La pantalla `ruta` de `App`: a ella llevan las DOS entradas de «Jugar la guiada» (la tarjeta
// del primer login y la de «Cómo se juega»). Cuatro tramos, todos tocables:
//   intro («¿En qué consiste el juego?») → el capítulo 2 entero (`enRuta`: «Salir» arriba y
//   «Siguiente» al final, que pone su ✓) → el puente («Ahora, a jugar») → la mesa guiada (la
//   rama `guiada` de la tanda 2, sin tocar: su cierre y su premio).
// Con el ✓ del capítulo 2 ya en el aparato (`guia.rutaPendiente()` falso), directo a la mesa:
// quien ya aprendió no la repite. «Salir» en cualquier tramo: el lobby, sin pago ni marca (el
// capítulo suelta el mazo al cerrarse). Sin marca intermedia: recargar a mitad vuelve al lobby
// y la próxima vez la ruta empieza de nuevo. Ninguna llamada al servidor.

/**
 * @param {object} p
 * @param {Function} p.onMesa  la mesa guiada
 * @param {Function} p.onLobby «Salir»
 */
export default function Ruta({ onMesa, onLobby }) {
  const [tramo, setTramo] = useState(() => (guia.rutaPendiente() ? 'intro' : 'mesa'))
  useLayoutEffect(() => { if (tramo === 'mesa') onMesa?.() }, [tramo, onMesa])

  if (tramo === 'intro') return <RutaIntro onEmpezar={() => setTramo('capitulo')} onSalir={onLobby} />
  if (tramo === 'capitulo') return <Capitulo n={2} enRuta onCerrar={onLobby} onTerminar={() => setTramo('puente')} />
  if (tramo === 'puente') return <RutaPuente onJugar={() => setTramo('mesa')} onSalir={onLobby} />
  return null
}
