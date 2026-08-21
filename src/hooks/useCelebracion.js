import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { decideCelebracion, sonidoDe, duracionDe, llevaViaje, esperaPrecedente } from './celebracionCore'

// ── DSK-VC2 · Ciclo de vida de la celebración ───────────────────────────────
// Documento rector: docs/AJILEI_Victory_Celebration_v1.0.md §3 y §6.
// El hook NO decide: pregunta a decideCelebracion (puro, sellado) y se limita a
// sostener el estado, disparar el sonido, medir la geometría y morir a tiempo.
//
// El nivel 'partida' NO pasa por aquí como overlay efímero: es pantalla
// terminal, sin techo de duración. Aquí sólo viven los dos de mesa.
//
// ── DSK-VC2b · La celebración tiene DOS tiempos ─────────────────────────────
// `activa` nace con `esperando: true` y todavía no dibuja nada: el disparo
// (decidir el nivel, medir la geometría) ocurre en la transición de fase, pero
// el dibujo y su sonido esperan al `end` de showdown.mp3. Un solo estado para
// los dos tiempos, a propósito: así el toque que corta, el corte por resize y
// la guardia de id que ya existían cubren la ESPERA sin una sola línea nueva —
// la secuencia entera se corta desde cualquier punto, que es lo pedido.
//
// La geometría se mide al DISPARAR y no al dibujar: el tablero no se mueve
// entre ambos instantes (la fase de pago está quieta) y un resize, que sí lo
// movería, corta la celebración entera.

export function useCelebracion({ enabled, phase, winner, humanCards, ruleN, play, geometria, precedente }) {
  const [activa, setActiva] = useState(null)   // {id, nivel, desde, hasta, esperando}
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const esperaRef = useRef(null)
  const seqRef = useRef(0)
  const faseAnteriorRef = useRef(phase)

  // Desengancha la espera: el temporizador-red Y el listener `end` de Howler.
  // Sin quitar el listener, un `end` tardío resucitaría una celebración cortada.
  const soltarEspera = useCallback(() => {
    const e = esperaRef.current
    if (e) {
      clearTimeout(e.timer)
      if (e.sound && typeof e.sound.off === 'function') e.sound.off('end', e.fin, e.id)
    }
    esperaRef.current = null
  }, [])

  // Corta VISUAL Y AUDIO de un golpe, en cualquier punto de la secuencia. El
  // audio necesita el id que play() devuelve desde VC2 — sin él se cortaría el
  // dibujo y el sonido seguiría. El ++seqRef invalida cualquier arranque
  // pendiente: quien tenga un id viejo ya no dibuja.
  const cortar = useCallback(() => {
    seqRef.current++
    soltarEspera()
    clearTimeout(timerRef.current)
    const a = audioRef.current
    if (a && a.sound && a.id != null) a.sound.stop(a.id)
    audioRef.current = null
    setActiva(null)
  }, [soltarEspera])

  // Se dispara en la TRANSICIÓN de fase, jamás en cada render de la fase: una
  // celebración que se re-arma sola sería eterna.
  //
  // VIS-3c · `useLayoutEffect` y no `useEffect`, por una razón MEDIDA. Desde que
  // el saldo del ganador y el pozo se muestran diferidos, el instante en que
  // esta celebración se arma dejó de ser sólo cosa suya: es el instante en que
  // las cifras pasan a retenerse. Con un efecto normal, React pinta primero el
  // render de PAYOUT —con los valores crudos del motor, que ya liquidó— y sólo
  // después corre el efecto y vuelve a pintar con los valores retenidos. Eso deja
  // UN FOTOGRAMA con el resultado destapado: medido, 19 ms enseñando "pozo 0 ·
  // saldo 5050" antes de volver a "pozo 100 · saldo 4950" y empezar el vuelo. El
  // número rebotaba a la vista.
  // Un efecto de LAYOUT corre antes de que el navegador pinte, así que el primer
  // fotograma de la fase de pago ya sale retenido y no hay rebote. La lógica no
  // cambia ni una línea: sólo cambia si esto ocurre antes o después de pintar.
  // `getBoundingClientRect` es válido aquí —el layout ya está calculado— y no hay
  // render de servidor en este proyecto.
  useLayoutEffect(() => {
    const antes = faseAnteriorRef.current
    faseAnteriorRef.current = phase
    if (!enabled || antes === phase) return

    const nivel = decideCelebracion({ phase, winner, humanCards, ruleN })
    // VIS-3 · la guarda deja de enumerar niveles y pregunta por la BANDERA: lo
    // que este hook sostiene son las celebraciones que vuelan. Enumerar era
    // correcto con dos y se volvió una lista que hay que recordar ampliar con
    // el tercero ('recoleccion'). `llevaViaje(null)` y `llevaViaje('partida')`
    // son false, así que las dos salidas de antes se conservan exactas.
    if (!llevaViaje(nivel)) return

    const geo = geometria()
    if (!geo) return

    soltarEspera()
    clearTimeout(timerRef.current)
    const id = ++seqRef.current

    // Segundo tiempo: dibujo + sonido propio + reloj de muerte.
    const arrancar = () => {
      soltarEspera()
      if (seqRef.current !== id) return   // cortada o sustituida mientras esperaba
      setActiva(a => (a && a.id === id ? { ...a, esperando: false } : a))

      const s = sonidoDe(nivel)
      audioRef.current = s ? play(s) : null

      // Guardia de id (molde potFloat): un temporizador viejo jamás mata una
      // celebración más nueva.
      const dur = duracionDe(nivel, llevaViaje(nivel) ? geo.fichas : 1)
      timerRef.current = setTimeout(() => {
        setActiva(a => (a && a.id === id ? null : a))
        audioRef.current = null
      }, dur)
    }

    const prev = precedente ? precedente() : null
    const espera = esperaPrecedente(prev)

    setActiva({ id, nivel, ...geo, esperando: espera > 0 })
    if (espera === 0) { arrancar(); return }

    const fin = () => arrancar()
    esperaRef.current = { sound: prev.sound, id: prev.id, fin, timer: setTimeout(fin, espera) }
    prev.sound.once('end', fin, prev.id)
  }, [phase, enabled, winner, humanCards, ruleN, play, geometria, precedente, soltarEspera])

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

  useEffect(() => () => { clearTimeout(timerRef.current); soltarEspera() }, [soltarEspera])

  return { activa, cortar }
}
