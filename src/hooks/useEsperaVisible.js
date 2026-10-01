import { useLayoutEffect, useState } from 'react'

// ── BIE-1 · La regla D5 del «Cargando» ──────────────────────────────────────
// Documento rector: AJILEI_BIE-1_Fase1_v1.0 §3.2, sobre el informe de la Fase 0.
//
// LO QUE ESTO DECIDE. La rama `CARGANDO` de `App.jsx` era un vacío verde que en
// el paso del código dura lo que tarde la lectura de `profiles` (Fase 0 §B). La
// regla sellada (D5) tiene dos mitades, y las dos existen contra un parpadeo:
//   · ANTES de 300 ms no se enseña nada. La inmensa mayoría de los arranques
//     resuelve antes, y un indicador que aparece y desaparece en un suspiro es
//     peor que el vacío (era el argumento del comentario viejo de App.jsx).
//   · UNA VEZ VISIBLE, se queda al menos 500 ms. Si no, una espera de 320 ms
//     enseñaría el indicador durante 20 — un destello, no un aviso. El coste lo
//     aceptó D5: mientras dura el mínimo, la pantalla siguiente espera.
//
// ENTRA un booleano, `cargando`; SALEN dos: `mostrar` (pintar el indicador) y
// `liberar` (la pantalla siguiente puede pintarse). `liberar` no es un estado
// propio: es `!cargando && !mostrar`, y por eso se calcula y no se guarda.

export const RETARDO_MS = 300
export const MINIMO_MS = 500

export const liberado = (cargando, mostrar) => !cargando && !mostrar

// ── El controlador ──────────────────────────────────────────────────────────
// Sin React y sin DOM a propósito, molde de `creaCongelador`: aquí vive todo lo
// que decide y por eso es lo que el test sella con temporizadores falsos. Los
// relojes llegan por parámetro; en la app son los del navegador.
export function creaEsperaVisible({
  retardoMs = RETARDO_MS,
  minimoMs = MINIMO_MS,
  reloj = { poner: (fn, ms) => setTimeout(fn, ms), quitar: (id) => clearTimeout(id), ahora: () => Date.now() },
} = {}) {
  let cargando = false
  let mostrar = false
  let desde = 0
  let tRetardo = null
  let tMinimo = null
  let avisa = () => {}

  const quitaRetardo = () => { if (tRetardo !== null) { reloj.quitar(tRetardo); tRetardo = null } }
  const quitaMinimo = () => { if (tMinimo !== null) { reloj.quitar(tMinimo); tMinimo = null } }
  const pon = (v) => { if (v === mostrar) return; mostrar = v; avisa(v) }

  const cambia = (valor) => {
    const v = valor === true
    if (v === cargando) return
    cargando = v
    if (v) {
      // Vuelve a cargar mientras se cumplía el mínimo: el indicador ya está
      // visible y se queda; no se rearma el retardo, que es para APARECER.
      quitaMinimo()
      if (!mostrar) {
        tRetardo = reloj.poner(() => { tRetardo = null; desde = reloj.ahora(); pon(true) }, retardoMs)
      }
      return
    }
    // Terminó antes del retardo: nunca se enseñó, se libera ya.
    quitaRetardo()
    if (!mostrar) return
    const falta = desde + minimoMs - reloj.ahora()
    if (falta <= 0) { pon(false); return }
    tMinimo = reloj.poner(() => { tMinimo = null; pon(false) }, falta)
  }

  // Al desmontar: ningún reloj sobrevive a la app que lo pidió. Vuelve al estado
  // de partida sin avisar —no queda nadie a quien avisar— para que un segundo
  // montaje (el doble montaje de StrictMode en desarrollo) arranque limpio.
  const suelta = () => {
    quitaRetardo()
    quitaMinimo()
    cargando = false
    mostrar = false
  }

  return {
    cambia,
    suelta,
    alCambiar: (fn) => { avisa = typeof fn === 'function' ? fn : () => {} },
    estado: () => ({ cargando, mostrar, liberar: liberado(cargando, mostrar) }),
    relojesVivos: () => (tRetardo !== null) + (tMinimo !== null),
  }
}

// ── El hook ─────────────────────────────────────────────────────────────────
// Envoltorio sin decisiones. Dos detalles que sí importan:
//
// `liberar` se calcula con el `cargando` DE ESTE RENDER, no con el que el
// controlador vio en el efecto anterior. Así, cuando la carga termina antes del
// retardo, la pantalla siguiente se pinta en el mismo render en que `useAuth`
// sale de CARGANDO — sin un fotograma de vacío añadido por esperar al efecto.
//
// `useLayoutEffect` y no `useEffect`: el controlador tiene que enterarse de que
// la carga terminó ANTES de que pueda correr cualquier otra tarea. Con un efecto
// pasivo, el reloj de los 300 ms podría dispararse entre el commit de la
// pantalla siguiente y el efecto, y el indicador taparía la pantalla ya pintada.
export function useEsperaVisible(cargando) {
  const [ctrl] = useState(() => creaEsperaVisible())
  const [mostrar, setMostrar] = useState(false)

  useLayoutEffect(() => {
    ctrl.alCambiar(setMostrar)
    return () => {
      ctrl.alCambiar(null)
      ctrl.suelta()
    }
  }, [ctrl])

  useLayoutEffect(() => { ctrl.cambia(cargando) }, [ctrl, cargando])

  return { mostrar, liberar: liberado(cargando, mostrar) }
}
