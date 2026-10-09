import { useState, useEffect, useRef, useCallback } from 'react'
import { TIEMPOS_AVISO, cifraAviso, brillaAviso, suenaAviso } from './avisoSaldoCore'
import { useSounds } from './useSounds'

// ── ECO-1c · El reloj del aviso de saldo ────────────────────────────────────
// Las reglas viven en `avisoSaldoCore.js`; aquí sólo corre el tiempo. Un rAF
// desde que nace el aviso (cambia su `id`) hasta que muere su `vida`, y en cada
// cuadro la cifra de la píldora y si brilla la moneda. El `setState` va en el
// rAF, nunca en el cuerpo del efecto (`react-hooks/set-state-in-effect`).
//
// El sonido: `chipsCollect` a 0,35 (en la mesa suena a 0,7), una vez. Pasa por
// `useSounds`, así que respeta el ajuste de sonido como todo lo demás.
//
// Un toque cierra el aviso antes: `cerrar` adelanta la salida.

const VOLUMEN_SUAVE = 0.35
const reducidoAhora = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/**
 * @param {{id:*, desde:number, hasta:number}|null} aviso
 * @param {number} vida  ms que vive (de `vidaAviso(texto)`)
 * @param {(id) => void} onFin
 */
export function useAvisoSaldo(aviso, vida, onFin) {
  const [cuadro, setCuadro] = useState(null)   // { id, cifra, brilla, saliendo, terminado }
  const cerradoEn = useRef(null)
  const reloj = useRef(null)
  const finRef = useRef(onFin)
  const { play } = useSounds()
  useEffect(() => { finRef.current = onFin }, [onFin])

  const id = aviso?.id ?? null
  useEffect(() => {
    if (!aviso) return undefined
    const reducido = reducidoAhora()
    const t0 = performance.now()
    let sono = false
    let raf = 0
    cerradoEn.current = null
    const paso = () => {
      const t = performance.now() - t0
      const fin = cerradoEn.current !== null ? Math.min(vida, cerradoEn.current + TIEMPOS_AVISO.sale) : vida
      reloj.current = t
      if (!sono && suenaAviso(aviso, t) && !reducido) {
        sono = true
        const r = play('chipsCollect')
        try { r?.sound?.volume(VOLUMEN_SUAVE, r.id) } catch { /* sin sonido */ }
      }
      if (t >= fin) {
        setCuadro({ id: aviso.id, terminado: true })
        finRef.current?.(aviso.id)
        return
      }
      setCuadro({
        id: aviso.id,
        cifra: cifraAviso(aviso, t, reducido),
        brilla: brillaAviso(aviso, t, reducido),
        saliendo: t >= fin - TIEMPOS_AVISO.sale,
      })
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
    // El aviso entero está fijado por su `id`: uno nuevo es otro `id`.
  }, [id, vida]) // eslint-disable-line react-hooks/exhaustive-deps

  const cerrar = useCallback(() => {
    if (cerradoEn.current === null && reloj.current !== null) cerradoEn.current = reloj.current
  }, [])

  // Tres momentos: antes del primer cuadro (la cifra ya es la de antes, para
  // que la píldora no enseñe un fotograma la nueva), vivo, y terminado (la
  // píldora vuelve al saldo aunque el padre aún no haya soltado el aviso).
  const propio = cuadro !== null && cuadro.id === id
  const vivo = aviso !== null && aviso !== undefined && !(propio && cuadro.terminado)
  const enCurso = vivo && propio
  return {
    vivo,
    cifra: vivo ? (enCurso ? cuadro.cifra : aviso.desde) : null,
    brilla: enCurso && cuadro.brilla,
    saliendo: enCurso && cuadro.saliendo,
    cerrar,
  }
}
