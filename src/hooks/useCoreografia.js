import { useState, useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { useSoundContext } from '../context/SoundContext'
import { melodiaPara, recuerdaMelodia, fuentesDe, MELODIA_VOLUMEN } from '../config/melodiasCelebracion'
import { melodiaForzadaCEL } from '../dev/siembraCEL'
import { marcaCEL, limpiaArcoCEL } from '../dev/arcoCEL'
import {
  ANCLA_TOPE_MS, CALMA_MS, FADE_CORTE_MS,
  duracionConteo, esperaRevienta, magnitudConteo,
} from './coreografiaCore'

// ── CEL-2 · El arco de la pantalla de victoria ──────────────────────────────
// Documento rector: lámina CEL-2. El "cuánto dura" vive en `coreografiaCore.js`
// y está sellado por Vitest; aquí sólo se ejecuta.
//
// ENCADENADO POR SONIDO, no por cronómetro. Es la doctrina de VC2b y se repite
// literalmente: manda el `end` de Howler del sonido precedente y el
// temporizador es la RED por si ese evento no llega nunca (archivo que no
// carga, un stop externo). Un cronómetro ciego donde hay un sonido que escuchar
// se desincroniza el día que alguien recorta el archivo.
//
// EL ANCLA ES EL TOC-TOC QUE YA EXISTÍA. `GameTable` lo dispara al entrar en
// GAME_OVER desde DSK-VC2 y esta tanda no lo duplica ni lo mueve: lo único que
// cambia allí es que el disparo se GUARDA para poder encadenarse a él.
//
// ── Por qué el ancla se lee en el primer CUADRO y no al montar ──────────────
// Los efectos de un hijo corren ANTES que los del padre en el mismo commit, así
// que en el montaje de esta pantalla el `play('tableKnock')` del padre todavía
// no ha ocurrido: preguntar ahí por el sonido precedente daría null SIEMPRE y el
// encadenado no existiría — el arco entero caería en su red temporal sin que
// nadie lo notara, porque los tiempos se parecen.
// Así que se pregunta un cuadro después, cuando el disparo ya ocurrió con
// certeza. `precedente` es un getter sobre una ref, el mismo molde con el que
// VC2b le pasa `precedenteViaje` a `useCelebracion`.
// Y ahí está la razón de `ANCLA_TOPE_MS`: `requestAnimationFrame` NO corre con
// la pestaña en segundo plano, y ganar la mesa y cambiar de pestaña en el mismo
// segundo es raro pero posible. El temporizador es la red de esa red: quien
// llegue primero arranca el arco, y la guarda de `arrancadoRef` impide que
// arranque dos veces.

function usePrefiereQuietud() {
  const [quieto, setQuieto] = useState(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches }
    catch { return false }
  })
  useEffect(() => {
    let mq
    try { mq = window.matchMedia('(prefers-reduced-motion: reduce)') } catch { return undefined }
    const f = (e) => setQuieto(e.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return quieto
}

export function useCoreografia({ precedente, netas, saldo }) {
  const { soundEnabled } = useSoundContext()
  const quietud = usePrefiereQuietud()

  const [fase, setFase] = useState('sobria')
  const [progresoVivo, setProgreso] = useState(0)
  const [oculta, setOculta] = useState(false)
  // La pieza se sortea AL MONTAR LA PANTALLA, en el inicializador, exactamente
  // como CEL-1 sortea la frase: si el sorteo viviera en un efecto, el primer
  // render iría sin melodía y el atributo `data-melodia` aparecería un cuadro
  // tarde — y con el sonido apagado no se sortea nada, porque no va a sonar.
  const [pieza] = useState(() => (soundEnabled ? melodiaPara(melodiaForzadaCEL()) : null))
  const melodia = pieza ? pieza.nombre : null

  // Y se RECUERDA aparte, desde un efecto: lo que queda guardado es lo que de
  // verdad sonó, no lo que sorteó una invocación de más de StrictMode.
  useEffect(() => { if (pieza) recuerdaMelodia(pieza.indice) }, [pieza])

  const faseRef = useRef('sobria')
  const melodiaRef = useRef(null)      // { howl, nombre, sonando }
  const esperaRef = useRef(null)       // { sound, id, fin, timer }
  const arrancadoRef = useRef(false)
  const saltadoRef = useRef(false)
  const vivoRef = useRef(true)

  const vaA = useCallback((f) => { faseRef.current = f; setFase(f) }, [])

  // Desengancha la espera: el temporizador-red Y el listener `end` de Howler.
  // Sin quitar el listener, un `end` tardío reventaría una fiesta ya saltada.
  const soltarEspera = useCallback(() => {
    const e = esperaRef.current
    if (e) {
      clearTimeout(e.timer)
      if (e.sound && typeof e.sound.off === 'function') e.sound.off('end', e.fin, e.id)
    }
    esperaRef.current = null
  }, [])

  // La pizarra del arnés, limpia por pantalla: unas marcas heredadas de la
  // celda anterior describirían un arco que no ocurrió. No-op fuera de `dev`.
  useEffect(() => {
    limpiaArcoCEL()
    marcaCEL('monta')
  }, [])

  // ── La melodía ────────────────────────────────────────────────────────────
  // CARGA PEREZOSA, y aquí: al montar LA PANTALLA, no al arrancar el juego. Son
  // ~380 KB que sólo hacen falta cuando alguien gana una mesa, y el toc-toc con
  // su cola da ~1,9 s de margen para que llegue.
  // Con el sonido apagado ni siquiera se crea: descargar un archivo que nadie
  // va a oír es gasto de datos de alguien, normalmente en un móvil.
  useEffect(() => {
    vivoRef.current = true
    if (!melodia) { marcaCEL('melodia-muda'); return undefined }
    const howl = new Howl({ src: fuentesDe(melodia), volume: MELODIA_VOLUMEN, preload: true })
    melodiaRef.current = { howl, nombre: melodia, sonando: null }
    marcaCEL('melodia-elegida', { melodia })
    return () => {
      try { howl.stop(); howl.unload() } catch { /* Howler ya la soltó */ }
      melodiaRef.current = null
    }
  }, [melodia])

  // Arranca la melodía si está cargada; si no, se engancha a su `load`. Lo que
  // JAMÁS hace es esperarla: el arco visual sigue su curso pase lo que pase, y
  // una melodía que llega tarde no entra si la pantalla ya está en reposo —
  // música que empieza cuando la fiesta acabó es peor que no tener música.
  const arrancaMelodia = useCallback(() => {
    const m = melodiaRef.current
    if (!m || saltadoRef.current) return
    const suena = () => {
      const mm = melodiaRef.current
      if (!mm || !vivoRef.current || saltadoRef.current || faseRef.current === 'reposo') return
      mm.sonando = mm.howl.play()
      marcaCEL('melodia-suena', { melodia: mm.nombre })
    }
    if (m.howl.state() === 'loaded') suena()
    else { marcaCEL('melodia-tarde', { estado: m.howl.state() }); m.howl.once('load', suena) }
  }, [])

  // ── El encadenado ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (arrancadoRef.current) return undefined

    const revienta = () => {
      soltarEspera()
      if (!vivoRef.current || saltadoRef.current || faseRef.current !== 'sobria') return
      marcaCEL('revienta')
      vaA('fiesta')
      arrancaMelodia()
    }

    const lanza = () => {
      if (arrancadoRef.current) return
      arrancadoRef.current = true
      // El ancla llega como `{ sound, id }` cuando el toc-toc sonó, y como
      // `{ mudo: true }` cuando no llegó a sonar (sonido apagado). Las dos
      // cosas significan "el disparo ya ocurrió"; sólo la primera tiene `end`.
      const toc = typeof precedente === 'function' ? precedente() : null
      const audio = toc && toc.sound ? toc : null
      const espera = esperaRevienta(audio)
      marcaCEL('ancla', { encadenado: !!audio, espera })
      if (!audio) { esperaRef.current = { timer: setTimeout(revienta, espera) }; return }
      const fin = () => revienta()
      // El reloj es el evento; el temporizador es la red, con el margen que
      // `esperaPrecedente` ya define.
      esperaRef.current = { sound: audio.sound, id: audio.id, fin, timer: setTimeout(fin, espera) }
      audio.sound.once('end', fin, audio.id)
    }

    // El cuadro y la red. El primero que llegue arranca; el otro se encuentra
    // `arrancadoRef` puesto y no hace nada.
    const cuadro = requestAnimationFrame(lanza)
    const red = setTimeout(lanza, ANCLA_TOPE_MS)
    return () => { cancelAnimationFrame(cuadro); clearTimeout(red) }
  }, [precedente, arrancaMelodia, soltarEspera, vaA])

  // ── Los contadores ────────────────────────────────────────────────────────
  // Un solo reloj para los dos: suben juntos y aterrizan juntos. El progreso
  // sale de aquí y la curva —easeOutCubic, sellada por VC2— la aplica la
  // tarjeta con `valorConteo`, que ya existía y no se toca.
  useEffect(() => {
    if (fase !== 'fiesta') return undefined

    if (quietud) {
      // Movimiento reducido: los valores finales, directos y sin cuenta. El 1 no
      // se ESCRIBE en el estado, se deriva en el retorno del hook: un setState
      // dentro del cuerpo de un efecto encadena renders, y aquí no hace ninguna
      // falta porque el valor no depende de nada que cambie.
      // El paso a `calma` se aplaza a la siguiente tarea por lo mismo: no es un
      // rodeo, es la diferencia entre encadenar dos renders y hacer uno. Con el
      // movimiento reducido la fiesta dura lo que dura ese aplazamiento, que es
      // lo que se pide — valores finales y nada de coreografía.
      marcaCEL('conteo-fin', { directo: true })
      const ya = setTimeout(() => vaA('calma'), 0)
      return () => clearTimeout(ya)
    }

    const dur = duracionConteo(magnitudConteo(netas, saldo))
    marcaCEL('conteo-ini', { dur })
    let acumulado = 0
    let ultimo = null
    let id = 0
    const paso = (t) => {
      if (ultimo === null) ultimo = t
      // El delta va ACOTADO, y ahí está la pausa por pestaña oculta: con la
      // pestaña en segundo plano el rAF no corre, y al volver el primer salto
      // valdría los segundos enteros que estuvo fuera — el contador aterrizaría
      // de golpe y el jugador se habría perdido justo lo que vino a ver.
      // Acotando el paso, el tiempo que no se pintó tampoco cuenta.
      acumulado += Math.min(t - ultimo, 100)
      ultimo = t
      const p = Math.min(1, acumulado / dur)
      setProgreso(p)
      if (p < 1) { id = requestAnimationFrame(paso); return }
      marcaCEL('conteo-fin')
      vaA('calma')
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [fase, netas, saldo, quietud, vaA])

  // ── De la calma al reposo ─────────────────────────────────────────────────
  // Lo que dura la calma es lo que tarda en caer la moneda más lenta: ni un ms
  // más (sería pantalla muerta) ni uno menos (se desvanecería a media caída).
  useEffect(() => {
    if (fase !== 'calma') return undefined
    marcaCEL('calma')
    const t = setTimeout(() => {
      marcaCEL('reposo')
      vaA('reposo')
    }, quietud ? 0 : CALMA_MS)
    return () => clearTimeout(t)
  }, [fase, quietud, vaA])

  // ── El toque que salta al reposo ──────────────────────────────────────────
  // `pointerdown` en CAPTURA y sin overlay, molde H4: un overlay se tragaría el
  // primer clic, y aquí debajo está el botón de salir de la mesa. El gesto
  // corta el arco Y sigue su curso — el botón funciona en todo momento, sin
  // esperar a nada.
  const saltar = useCallback(() => {
    if (saltadoRef.current) return
    saltadoRef.current = true
    marcaCEL('salto', { desde: faseRef.current })
    soltarEspera()
    setProgreso(1)
    if (faseRef.current !== 'reposo') vaA('calma')
    const m = melodiaRef.current
    if (m && m.sonando != null) {
      m.howl.fade(m.howl.volume(), 0, FADE_CORTE_MS, m.sonando)
      setTimeout(() => { try { m.howl.stop(m.sonando) } catch { /* ya parada */ } }, FADE_CORTE_MS)
    }
  }, [soltarEspera, vaA])

  useEffect(() => {
    if (fase === 'reposo') return undefined
    document.addEventListener('pointerdown', saltar, true)
    return () => document.removeEventListener('pointerdown', saltar, true)
  }, [fase, saltar])

  // ── Pestaña oculta ────────────────────────────────────────────────────────
  // La lluvia se congela y los contadores dejan de avanzar (lo hace el acotado
  // del delta, arriba). La melodía NO se toca: el audio sigue sonando en
  // segundo plano por decisión del navegador, y pararlo aquí le dejaría al que
  // cambia de pestaña una melodía cortada a la vuelta.
  useEffect(() => {
    const f = () => setOculta(document.hidden === true)
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])

  useEffect(() => () => {
    vivoRef.current = false
    soltarEspera()
  }, [soltarEspera])

  // Con movimiento reducido no hay cuenta: el progreso es 1 desde el principio.
  const progreso = quietud ? 1 : progresoVivo
  return { fase, progreso, melodia, oculta, quietud, saltar }
}
