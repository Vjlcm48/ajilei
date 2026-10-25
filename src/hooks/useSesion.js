import { useReducer, useRef, useEffect } from 'react'
import { sesionInicial, anotarMano } from './sesionCore'

// ── DSK-VC2 · Acumulados de la partida en curso ─────────────────────────────
// Cuarto hook de la familia (useUtilitiesMenu, useReacciones, useConsultas):
// un solo estado, consumidores fuera. Toda la decisión vive en sesionCore, que
// es puro y está sellado por Vitest; aquí sólo se observa la transición.
//
// useReducer y no useState: acumular es exactamente lo que un reductor hace, y
// `anotarMano` YA es su función reductora —pura, con la guarda de idempotencia
// por handCount dentro—. Además evita el setState síncrono dentro del efecto,
// que dispara renders en cascada.
//
// Observa la ENTRADA en PAYOUT, no cada render en PAYOUT: la guarda por
// handCount vive en el núcleo, pero además se dispara una sola vez por
// transición para no depender sólo de ella.
//
// RNK-1b · I-7 · «ganó» y los puntos salen del MISMO `fin` (`finDeMano`) que
// `GameTable` manda al servidor, calculado una vez por mano. Ya no se lee un
// asiento ganador aquí: `fin.ganoHumano` es la capa principal (INV-63) y
// `puntos` es el `total` de `puntosDeMano` para esa mano.

export function useSesion({ phase, handCount, fin, puntos, humanScore, enPayout }) {
  const [sesion, anotar] = useReducer(anotarMano, undefined, sesionInicial)
  const faseAnteriorRef = useRef(phase)

  useEffect(() => {
    const antes = faseAnteriorRef.current
    faseAnteriorRef.current = phase
    if (antes === phase) return
    if (!enPayout || !fin) return
    anotar({ handCount, gano: fin.ganoHumano, puntos, ajilei: fin.ajilei, score: humanScore })
  }, [phase, enPayout, handCount, fin, puntos, humanScore])

  return sesion
}
