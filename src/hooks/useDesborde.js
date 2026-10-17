import { useEffect } from 'react'

// ── IOS-1 1e · ¿Pasan filas por debajo de la zona anclada? ──────────────────
// Rector: AJILEI_IOS-1_Fase1e_v1.0.md §2.1. El cuerpo de Retar, Salas y Armar
// mesa desplaza por dentro cuando las filas no caben, y la zona del botón queda
// fija al pie (`sticky`). Sólo entonces la zona necesita un fondo que apague las
// filas que pasan por debajo; si todo cabe, ese fondo sería una franja oscura
// sin motivo. Este vigía marca el cuerpo con `data-desborda` mientras desborde.
//
// Escribe el atributo en el DOM y no en el estado de React a propósito: es
// pintura, no decisión, y un render por cada cambio de alto sería trabajo
// inútil. Mira el cuerpo y cada hijo directo (lo que cambia de alto es una fila
// o la zona), y se vuelve a enganchar en cada render por si cambiaron los hijos.
export function useDesborde(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const mirar = () => {
      const desborda = el.scrollHeight > el.clientHeight + 0.5
      if (desborda !== el.hasAttribute('data-desborda')) el.toggleAttribute('data-desborda', desborda)
    }
    const vigia = new ResizeObserver(mirar)
    vigia.observe(el)
    for (const hijo of el.children) vigia.observe(hijo)
    mirar()
    return () => vigia.disconnect()
  })
}
