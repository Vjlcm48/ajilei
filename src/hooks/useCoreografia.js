import { useState, useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { useSoundContext } from '../context/SoundContext'
import { melodiaPara, recuerdaMelodia, fuentesDe, MELODIA_VOLUMEN } from '../config/melodiasCelebracion'
import { melodiaForzadaCEL } from '../dev/siembraCEL'
import { marcaCEL, limpiaArcoCEL } from '../dev/arcoCEL'
import {
  ANCLA_TOPE_MS, CALMA_MS, FADE_CORTE_MS,
  TRASPASO_MS, ASIENTO_MS,
  avanceDe, duracionCascada, duracionConteo, esperaRevienta, esperaFinMelodia,
} from './coreografiaCore'
import { MELODIA_MS } from '../config/melodiasCelebracion'

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
  const [oculta, setOculta] = useState(false)

  // ── CEL-2g · El relato de los números ─────────────────────────────────────
  // Un segundo tiempo, DENTRO de la fiesta y con su propio reloj. El arco lo
  // mide la melodía; esto lo miden las cifras, y por eso no comparten estado:
  // la lluvia no debe esperar a que un contador termine, ni al revés.
  // Con movimiento reducido nace en `fin`, que es "todo puesto desde el primer
  // fotograma" — lo que pide la instrucción.
  const [tramo, setTramo] = useState(() => (quietud ? 'fin' : 'espera'))
  const [premioVivo, setPremioVivo] = useState(0)
  const [saldoVivo, setSaldoVivo] = useState(0)
  const [asiento, setAsiento] = useState(false)
  const tramoRef = useRef('espera')
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
  const esperaRef = useRef(null)       // { sound, id, fin, timer } · sobria -> fiesta
  const fiestaRef = useRef(null)       // { sound, id, fin, timer } · fiesta -> calma
  const arrancadoRef = useRef(false)
  const saltadoRef = useRef(false)
  const vivoRef = useRef(true)

  const vaA = useCallback((f) => { faseRef.current = f; setFase(f) }, [])
  const vaAlTramo = useCallback((t) => { tramoRef.current = t; setTramo(t) }, [])

  // El motor de una cuenta, uno solo para los dos tramos: misma curva y —lo que
  // importa— mismo acotado del delta, que es lo que hace que la pestaña oculta
  // pause en vez de aterrizar de golpe al volver.
  const cuenta = useCallback((dur, pinta, alAcabar) => {
    let acumulado = 0
    let ultimo = null
    let id = 0
    const paso = (t) => {
      if (ultimo === null) ultimo = t
      acumulado += Math.min(t - ultimo, 100)
      ultimo = t
      const p = Math.min(1, acumulado / dur)
      pinta(p)
      if (p < 1) { id = requestAnimationFrame(paso); return }
      alAcabar()
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [])

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

  // Lo mismo para el segundo encadenado, el que cierra la fiesta.
  const soltarFiesta = useCallback(() => {
    const e = fiestaRef.current
    if (e) {
      clearTimeout(e.timer)
      if (e.sound && typeof e.sound.off === 'function') e.sound.off('end', e.fin, e.id)
    }
    fiestaRef.current = null
  }, [])

  // ── CEL-2c · La fiesta acaba cuando calla la música ───────────────────────
  // Decisión de Victor en vivo, y sustituye a la de la lámina: la calma ya no se
  // ancla al contador —que aterriza a los ~1,5 s y dejaba diez segundos de
  // melodía sobre una pantalla quieta— sino al `end` de la melodía.
  // Mismo molde que el estallido: manda el evento, el temporizador es la red.
  // Se programa DOS VECES a propósito: una al reventar, con el reloj nominal de
  // los 12 s sellados por CEL-A —que cubre el mute y la melodía que no carga—, y
  // otra cuando la pieza arranca de verdad, ya contra su duración real. La
  // segunda sustituye a la primera; sin eso, una melodía que empezara tarde se
  // vería cortada por una red armada antes de que sonase.
  const programaFinFiesta = useCallback((howl, id) => {
    soltarFiesta()
    const fin = () => {
      soltarFiesta()
      if (!vivoRef.current || saltadoRef.current || faseRef.current !== 'fiesta') return
      marcaCEL('melodia-fin')
      vaA('calma')
    }
    if (!howl) { fiestaRef.current = { timer: setTimeout(fin, MELODIA_MS) }; return }
    const dur = typeof howl.duration === 'function' ? Number(howl.duration()) : 0
    fiestaRef.current = { sound: howl, id, fin, timer: setTimeout(fin, esperaFinMelodia(dur)) }
    howl.once('end', fin, id)
  }, [soltarFiesta, vaA])

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
      marcaCEL('melodia-suena', { melodia: mm.nombre, dur: Math.round(Number(mm.howl.duration()) * 1000) })
      programaFinFiesta(mm.howl, mm.sonando)
    }
    if (m.howl.state() === 'loaded') suena()
    else { marcaCEL('melodia-tarde', { estado: m.howl.state() }); m.howl.once('load', suena) }
  }, [programaFinFiesta])

  // ── El encadenado ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (arrancadoRef.current) return undefined

    const revienta = () => {
      soltarEspera()
      if (!vivoRef.current || saltadoRef.current || faseRef.current !== 'sobria') return
      marcaCEL('revienta')
      vaA('fiesta')
      // Y con la fiesta arranca el relato de los números, salvo con movimiento
      // reducido, donde ya estaba todo puesto.
      vaAlTramo(quietud ? 'fin' : 'premio')
      // La red primero y la melodía después: si el archivo no llegara a sonar,
      // la fiesta dura los 12 s nominales igual y la pantalla no se queda
      // lloviendo para siempre.
      programaFinFiesta(null, null)
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
  }, [precedente, arrancaMelodia, programaFinFiesta, soltarEspera, vaA, vaAlTramo, quietud])

  // ── El premio ─────────────────────────────────────────────────────────────
  // La primera cuenta, y la única que corre sola: el saldo espera su turno.
  useEffect(() => {
    if (tramo !== 'premio') return undefined
    const dur = duracionConteo(Math.abs(netas))
    marcaCEL('premio-ini', { dur })
    return cuenta(dur, setPremioVivo, () => {
      marcaCEL('premio-fin')
      vaAlTramo('traspaso')
    })
  }, [tramo, netas, cuenta, vaAlTramo])

  // ── El traspaso ───────────────────────────────────────────────────────────
  // Lo cierra el ATERRIZAJE de la moneda, que la tarjeta avisa: el conteo del
  // saldo no arranca por un cronómetro paralelo sino porque la moneda llegó, que
  // es la misma doctrina con la que el estallido espera al `end` del toc-toc.
  // El temporizador de aquí es la RED: si el `transitionend` no llegara —una
  // geometría que no se pudo medir, un navegador que no lo dispara— el relato
  // no se queda colgado a media tarjeta.
  const aterrizaTraspaso = useCallback(() => {
    if (tramoRef.current !== 'traspaso') return
    marcaCEL('traspaso-fin')
    vaAlTramo('saldo')
  }, [vaAlTramo])

  useEffect(() => {
    if (tramo !== 'traspaso') return undefined
    marcaCEL('traspaso-ini')
    const t = setTimeout(() => {
      marcaCEL('traspaso-red')
      aterrizaTraspaso()
    }, TRASPASO_MS + 300)
    return () => clearTimeout(t)
  }, [tramo, aterrizaTraspaso])

  // ── El saldo ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tramo !== 'saldo') return undefined
    const dur = duracionConteo(Math.abs(saldo))
    marcaCEL('saldo-ini', { dur })
    return cuenta(dur, setSaldoVivo, () => {
      marcaCEL('saldo-fin')
      // El pulso de llegada se enciende AQUÍ y no se apaga: la animación tiene
      // una sola iteración, así que el estado pegado es la garantía de que se
      // dispara una vez y nada más. Un salto por toque no lo enciende — quien
      // pide parar no quiere una celebración de propina.
      setAsiento(true)
      vaAlTramo('asiento')
    })
  }, [tramo, saldo, cuenta, vaAlTramo])

  useEffect(() => {
    if (tramo !== 'asiento') return undefined
    const t = setTimeout(() => {
      marcaCEL('cascada-ini')
      vaAlTramo('rubros')
    }, ASIENTO_MS)
    return () => clearTimeout(t)
  }, [tramo, vaAlTramo])

  useEffect(() => {
    if (tramo !== 'rubros') return undefined
    const t = setTimeout(() => {
      marcaCEL('relato-fin')
      vaAlTramo('fin')
    }, duracionCascada())
    return () => clearTimeout(t)
  }, [tramo, vaAlTramo])

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
    marcaCEL('salto', { desde: faseRef.current, tramo: tramoRef.current })
    soltarEspera()
    soltarFiesta()
    // Todo al final, rubros incluidos. `fin` es el último tramo, así que las
    // cifras y la cascada se derivan puestas sin tocar un estado por pieza.
    vaAlTramo('fin')
    if (faseRef.current !== 'reposo') vaA('calma')
    const m = melodiaRef.current
    if (m && m.sonando != null) {
      m.howl.fade(m.howl.volume(), 0, FADE_CORTE_MS, m.sonando)
      setTimeout(() => { try { m.howl.stop(m.sonando) } catch { /* ya parada */ } }, FADE_CORTE_MS)
    }
  }, [soltarEspera, soltarFiesta, vaA, vaAlTramo])

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
    soltarFiesta()
  }, [soltarEspera, soltarFiesta])

  // Los progresos se DERIVAN del tramo, no se escriben: pasado el tramo de una
  // cuenta, su progreso es 1 por definición. Eso hace que el salto por toque sea
  // una sola línea (`fin`) y que el movimiento reducido sea otra (el último
  // índice), sin un estado por cifra que haya que acordarse de poner.
  const av = quietud ? avanceDe('fin') : avanceDe(tramo)
  const numeros = {
    tramo: quietud ? 'fin' : tramo,
    premio: av >= 2 ? 1 : (av === 1 ? premioVivo : 0),
    saldo: av >= 4 ? 1 : (av === 3 ? saldoVivo : 0),
    // 'no' = invisibles con su sitio reservado · 'si' = entrando en cascada ·
    // 'fin' = puestos, sin animación.
    rubros: av >= 6 ? 'fin' : (av === 5 ? 'si' : 'no'),
    asiento: asiento && !quietud,
    pausada: oculta,
    aterriza: aterrizaTraspaso,
  }
  return { fase, numeros, melodia, oculta, quietud, saltar }
}
