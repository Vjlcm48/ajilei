// ── siembraSuma.js · El mando `?suma`: el intersticial en la siguiente entrada ──
// Rector: AJILEI_RNK-1_Fase1e_v1.0.md §2.5. Molde de `siembraCEL.js`.
//
// Ver el intersticial de SumaMente cuesta, de verdad, ocho entradas a Rankings
// y un día de Chicago sin gastar. Para probarlo a mano, este mando deja el
// contador del aparato justo antes del turno al arrancar la app:
//
//   ?suma       → n = 7 y ningún día gastado: la SIGUIENTE entrada a Rankings
//                 enseña el video (y gasta el día, como siempre).
//   ?suma=fin   → n = 7 con el día de HOY gastado: la siguiente entrada no lo
//                 enseña y el contador vuelve a 0 (la regla 3).
//
// Siembra al ARRANCAR (al cargar la página), no en cada entrada: con `?suma`
// en la barra, la primera entrada enseña el video y las siguientes siguen las
// reglas de verdad. Para repetir, se recarga la página.
//
// SÓLO EN DESARROLLO. `import.meta.env.DEV` lo apaga en cualquier build: allí
// la función no hace nada y el parámetro no significa nada. La puerta es
// doble —el build Y el parámetro—, como la de `?cel`. La guardia sobre `dist/`
// (`scripts/testDistSinMoldes.test.js`) busca la huella de abajo.

import { CADA_ENTRADAS, diaChicago } from '../lib/sumaCore'
import { sumaContador } from '../lib/sumaContador'

export const SUMA_PARAM = 'suma'

export function siembraSuma(contador = sumaContador) {
  if (!import.meta.env.DEV) return
  if (typeof window === 'undefined') return
  let crudo
  try { crudo = new URLSearchParams(window.location.search).get(SUMA_PARAM) } catch { return }
  if (crudo == null) return
  const gastado = crudo === 'fin'
  contador.escribir({ n: CADA_ENTRADAS - 1, dia: gastado ? diaChicago() : null })
  // La huella que busca la guardia de `dist/`: sólo existe detrás de la puerta.
  console.info(`[molde-suma] contador en ${CADA_ENTRADAS - 1}${gastado ? ' con el día de hoy gastado' : ''}`)
}
