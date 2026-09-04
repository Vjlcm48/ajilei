import { useState, useRef, useEffect, useCallback } from 'react'
import { Howler } from 'howler'

// ── FRZ-1 · El freeze de visibilidad ────────────────────────────────────────
// Documento rector: AJILEI_FRZ1_Fase1_v1.0, sobre el informe de la Fase 0.
//
// EL FALLO QUE ESTO CIERRA. La mesa no escuchaba la visibilidad, ni una línea, y
// el navegador no es un freno: es un aviso. Medido en la Fase 0 (corrida C, mesa
// 5, Edge real por CDP crudo): con el audio sonando **Chrome exime a la pestaña
// del estrangulamiento**, así que la partida corría a TIEMPO REAL en segundo
// plano — se agotaba el turno del humano, jugaban las cuatro IA, sonaban los
// avisos de los últimos cinco segundos con la pestaña oculta, y al volver la
// mano era otra. Sin audio corría a media velocidad. Avanzar, avanzaba siempre.
//
// ── Arquitectura (c) con (a) dentro ─────────────────────────────────────────
// Se congela en la MÁQUINA DE TURNOS, no en cada reloj. Se silencia ya, se deja
// terminar la secuencia en vuelo —su estado ya está sentenciado y su coreografía
// dura segundos— y lo único que no se hace es PROGRAMAR EL PASO SIGUIENTE hasta
// recuperar la visibilidad. Es viable por una propiedad que la Fase 0 verificó:
// el reloj de turno y el efecto de la IA se reprograman ENTEROS y leen
// `gameRef.current` fresco, así que una jugada cancelada no vuelve obsoleta ni
// doble.
//
// UN SLOT, NO UNA COLA. `diferir` guarda UNA continuación. Por diseño no puede
// haber dos a la vez —las cuatro guardas que lo usan viven en fases del juego
// mutuamente excluyentes— y por eso una segunda escritura sobrescribe Y LO
// DECLARA en consola de desarrollo: si eso ocurre alguna vez es un hallazgo, y
// un hallazgo callado es peor que ninguno. Una cola, en cambio, resolvería el
// síntoma escondiendo que el diseño no se cumplió.
//
// ── Por qué `Howler.volume(0)` y no las otras dos palancas ──────────────────
// `Howler.mute()` NO: es la preferencia del usuario y persiste en localStorage
// (SoundContext.jsx:15/32) — usarla aquí escribiría 'off' en un ajuste que el
// jugador no tocó. `Howler.ctx.suspend()` tampoco: Howler tiene autosuspend a
// los 30 s sin reproducción y su propio auto-resume (medido en la Fase 0), y dos
// dueños del mismo interruptor acaban discrepando. Queda el volumen global, con
// MEMORIA del valor previo: se restaura el que había, no un 1 supuesto.

// El aviso del slot ocupado es de desarrollo. En un build `DEV` es `false` y
// esto calla; bajo Vitest vale `true`, que es lo que sella el caso 5.
const EN_DEV = import.meta.env?.DEV ?? true

// ── El controlador ──────────────────────────────────────────────────────────
// Sin React y sin DOM a propósito: aquí vive TODO lo que decide (la memoria del
// volumen, el slot, el orden de la vuelta) y por eso es lo que el test sella.
// Es el molde de la casa —`coreografiaCore`/`useCoreografia`,
// `celebracionCore`/`useCelebracion`—: el núcleo se prueba, el hook solo ejecuta.
export function creaCongelador(audio = Howler) {
  let oculto = false
  let volumenPrevio = null
  let diferido = null
  let avisa = () => {}

  // La guarda de reentrada NO es cosmética: en iOS pueden llegar `pagehide` y
  // `visibilitychange` por el mismo hecho, y sin ella el segundo ocultamiento
  // recordaría como "volumen previo" el 0 que acaba de poner el primero — la
  // vuelta dejaría la mesa muda para siempre.
  const ocultar = () => {
    if (oculto) return
    oculto = true
    volumenPrevio = typeof audio.volume === 'function' ? audio.volume() : null
    if (typeof audio.volume === 'function') audio.volume(0)
    avisa(true)
  }

  const restauraVolumen = () => {
    if (volumenPrevio == null) return
    if (typeof audio.volume === 'function') audio.volume(volumenPrevio)
    volumenPrevio = null
  }

  // EL ORDEN ES EL CONTRATO, y siempre éste: audio, estado, slot. El audio
  // primero porque la continuación puede sonar y tiene que oírse. El estado
  // antes que el slot porque la continuación va a leer `congeladoRef` y lo tiene
  // que encontrar ya en `false` — si no, la guarda que la difirió volvería a
  // diferirla y la mesa se quedaría esperando a una vuelta que ya ocurrió.
  const mostrar = () => {
    if (!oculto) return
    oculto = false
    restauraVolumen()
    avisa(false)
    const fn = diferido
    diferido = null
    if (fn) fn()
  }

  const diferir = (fn) => {
    if (typeof fn !== 'function') return
    if (diferido && EN_DEV) {
      console.warn('[FRZ-1] slot de continuación ocupado: se sobrescribe. Por diseño no debería pasar.')
    }
    diferido = fn
  }

  // Al desmontar: una mesa que se va estando oculta NO puede dejar el motor mudo
  // para la pantalla siguiente. El slot se tira: su continuación pertenecía a
  // una mesa que ya no existe.
  const suelta = () => {
    restauraVolumen()
    oculto = false
    diferido = null
  }

  return {
    ocultar,
    mostrar,
    diferir,
    suelta,
    alCambiar: (fn) => { avisa = typeof fn === 'function' ? fn : () => {} },
    estaOculto: () => oculto,
    hayDiferido: () => diferido !== null,
  }
}

// ── El enganche ─────────────────────────────────────────────────────────────
// `doc` y `win` llegan por parámetro para que el test pueda darle un par falso
// y recorrer el CAMINO REAL de los listeners. No hay render de servidor en este
// proyecto, así que en la app son siempre `document` y `window`.
//
// Se LEE AL ENGANCHAR y no se asume visible: una mesa que monta con la pestaña
// ya oculta —volver a una app en segundo plano, un bfcache de WebKit que
// restaura sin `visibilitychange`— tiene que nacer congelada.
//
// `pagehide` cuenta como ocultarse porque iOS puede mandarlo SIN su
// `visibilitychange` (§7 del informe de Fase 0). `pageshow` no se escucha: la
// vuelta la da `visibilitychange`, y si WebKit restaura desde bfcache lo que
// decide es la lectura de `document.hidden` al enganchar.
export function enganchaVisibilidad(ctrl, doc, win) {
  const alCambio = () => { if (doc.hidden === true) ctrl.ocultar(); else ctrl.mostrar() }
  const alOcultarse = () => ctrl.ocultar()

  alCambio()
  doc.addEventListener('visibilitychange', alCambio)
  win.addEventListener('pagehide', alOcultarse)

  return () => {
    doc.removeEventListener('visibilitychange', alCambio)
    win.removeEventListener('pagehide', alOcultarse)
  }
}

// ── El hook ─────────────────────────────────────────────────────────────────
// Envoltorio delgado y sin decisiones: engancha, desengancha, y espeja la verdad
// del controlador en un estado (para las dependencias de los efectos que tienen
// que rearmarse) y en una ref (para leerla DENTRO de un timer o un manejador,
// donde un `congelado` capturado sería el de otro render).
export function useCongelado() {
  const [congelado, setCongelado] = useState(() => (typeof document !== 'undefined' && document.hidden === true))
  const congeladoRef = useRef(congelado)

  // El controlador nace UNA vez, en un inicializador perezoso de estado y no en
  // una ref: leer `ref.current` durante el render es un error de lint en este
  // repo (`react-hooks/refs`), y aquí no hace falta — el valor no cambia jamás,
  // así que un estado que nunca se escribe dice exactamente lo mismo.
  const [ctrl] = useState(() => creaCongelador(Howler))

  useEffect(() => {
    ctrl.alCambiar((v) => { congeladoRef.current = v; setCongelado(v) })
    const desengancha = enganchaVisibilidad(ctrl, document, window)
    return () => {
      desengancha()
      ctrl.alCambiar(null)
      ctrl.suelta()
    }
  }, [ctrl])

  const diferir = useCallback((fn) => ctrl.diferir(fn), [ctrl])

  return { congelado, congeladoRef, diferir }
}
