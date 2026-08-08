import { useState, useRef, useEffect, useCallback } from 'react'
import { decideCelebracion, sonidoDe, duracionDe, llevaViaje } from './celebracionCore'

// ── DSK-VC2 · Ciclo de vida de la celebración ───────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §3 y §6.
// El hook NO decide: pregunta a decideCelebracion (puro, sellado) y se limita a
// sostener el estado, disparar el sonido, medir la geometría y morir a tiempo.
//
// El nivel 'partida' NO pasa por aquí como overlay efímero: es pantalla
// terminal, sin techo de duración. Aquí sólo viven los dos de mesa.



export function useCelebracion({ enabled, phase, winner, humanCards, ruleN, play, geometria }) {
  const [activa, setActiva] = useState(null)   // {id, nivel, desde, hasta}
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const seqRef = useRef(0)
  const faseAnteriorRef = useRef(phase)

  // Corta VISUAL Y AUDIO de un golpe. El audio necesita el id que play()
  // devuelve desde VC2 — sin él se cortaría el dibujo y el sonido seguiría.
  const cortar = useCallback(() => {
    clearTimeout(timerRef.current)
    const a = audioRef.current
    if (a && a.sound && a.id != null) a.sound.stop(a.id)
    audioRef.current = null
    setActiva(null)
  }, [])

  // Se dispara en la TRANSICIÓN de fase, jamás en cada render de la fase: una
  // celebración que se re-arma sola sería eterna.
  useEffect(() => {
    const antes = faseAnteriorRef.current
    faseAnteriorRef.current = phase
    if (!enabled || antes === phase) return

    const nivel = decideCelebracion({ phase, winner, humanCards, ruleN })
    if (nivel !== 'mano' && nivel !== 'ajilei') return

    const geo = geometria()
    if (!geo) return

    const id = ++seqRef.current
    setActiva({ id, nivel, ...geo })

    const s = sonidoDe(nivel)
    audioRef.current = s ? play(s) : null

    // Guardia de id (molde potFloat): un temporizador viejo jamás mata una
    // celebración más nueva.
    const dur = duracionDe(nivel, llevaViaje(nivel) ? geo.fichas : 1)
    timerRef.current = setTimeout(() => {
      setActiva(a => (a && a.id === id ? null : a))
      audioRef.current = null
    }, dur)
  }, [phase, enabled, winner, humanCards, ruleN, play, geometria])

  // El toque que corta · pointerdown en CAPTURA y sin overlay (molde H4): un
  // overlay se tragaría el primer clic sobre "Siguiente mano", y esto ocurre
  // justo encima de ese botón. El clic corta la celebración Y sigue su curso.
  useEffect(() => {
    if (!activa) return
    document.addEventListener('pointerdown', cortar, true)
    // Un cambio de tamaño invalida la geometría medida al disparar.
    window.addEventListener('resize', cortar)
    return () => {
      document.removeEventListener('pointerdown', cortar, true)
      window.removeEventListener('resize', cortar)
    }
  }, [activa, cortar])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { activa, cortar }
}
