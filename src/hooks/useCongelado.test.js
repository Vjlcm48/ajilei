// Mide la respuesta del hook al evento de visibilidad. NO mide el
// estrangulamiento de temporizadores del navegador, que solo se observa en
// aparato o con CDP crudo (cola ARN).
//
// ── Y una segunda honestidad, sobre el MÉTODO ───────────────────────────────
// La ficha de la Fase 1 pedía entorno `jsdom`. Este proyecto no lo tiene
// instalado (ni `jsdom`, ni `happy-dom`, ni `@testing-library`) y el mandato
// prohíbe dependencias nuevas, así que no se monta React aquí.
//
// Lo que se recorre en su lugar es EL CAMINO REAL: `enganchaVisibilidad` recibe
// el `document` y el `window` por parámetro justamente para esto, de modo que
// los siete casos pasan por los listeners de verdad, por el controlador de
// verdad y por su memoria de volumen de verdad — con un par de objetos falsos
// en el sitio del DOM. Lo único que queda fuera del sello es el espejo de React
// (`useState`/`useRef` reflejando la misma verdad), que no decide nada: son las
// dos líneas de `alCambiar` dentro del `useEffect`.
//
// Es el molde de la casa: `coreografiaCore` y `celebracionCore` se sellan con
// Vitest y sus hooks solo ejecutan.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// El módulo del hook importa `howler`, que al cargarse toca el AudioContext.
// Se sustituye por un singleton mínimo para que el import no arrastre el motor
// de audio a un proceso de node. Las aserciones NO usan este doble: cada caso
// construye el suyo y se lo pasa a `creaCongelador`.
vi.mock('howler', () => ({ Howler: { volume: () => 1 } }))

const { creaCongelador, enganchaVisibilidad } = await import('./useCongelado')

// ── Dobles del DOM ──────────────────────────────────────────────────────────
function creaObjetivo() {
  const oyentes = {}
  return {
    addEventListener(tipo, fn) { (oyentes[tipo] ||= []).push(fn) },
    removeEventListener(tipo, fn) { oyentes[tipo] = (oyentes[tipo] || []).filter(f => f !== fn) },
    despacha(tipo) { (oyentes[tipo] || []).slice().forEach(fn => fn()) },
    cuantos(tipo) { return (oyentes[tipo] || []).length },
  }
}

// `volume()` leíble y escribible, que es el contrato exacto que el controlador
// usa de Howler. El valor de partida NO es 1 a propósito: el caso 3 tiene que
// poder distinguir "restauró el previo" de "puso el default".
function creaAudio(inicial = 0.65) {
  let v = inicial
  return {
    volume(x) { if (x === undefined) return v; v = x; return v },
    lee() { return v },
  }
}

// El montaje completo: controlador + enganche + espejo del estado, como lo hace
// el hook. Devuelve además el `desmonta` para el caso 6.
function monta({ oculto = false, volumen = 0.65 } = {}) {
  const doc = creaObjetivo()
  const win = creaObjetivo()
  doc.hidden = oculto
  const audio = creaAudio(volumen)
  const ctrl = creaCongelador(audio)
  const vistos = []
  let congelado = doc.hidden === true
  ctrl.alCambiar((v) => { congelado = v; vistos.push(v) })
  const desengancha = enganchaVisibilidad(ctrl, doc, win)
  return {
    doc, win, audio, ctrl, vistos, desengancha,
    congelado: () => congelado,
    oculta() { doc.hidden = true; doc.despacha('visibilitychange') },
    muestra() { doc.hidden = false; doc.despacha('visibilitychange') },
    desmonta() { desengancha(); ctrl.alCambiar(null); ctrl.suelta() },
  }
}

let avisos
beforeEach(() => { avisos = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { avisos.mockRestore() })

describe('useCongelado · el freeze de visibilidad (FRZ-1)', () => {
  test('1 · al montar visible: no congelado y el volumen intacto', () => {
    const m = monta({ oculto: false, volumen: 0.65 })
    expect(m.congelado()).toBe(false)
    expect(m.ctrl.estaOculto()).toBe(false)
    expect(m.audio.lee()).toBe(0.65)
    // Y engancha donde debe: la vuelta por `document`, el ocultarse también por
    // `window` (iOS puede mandar solo `pagehide`).
    expect(m.doc.cuantos('visibilitychange')).toBe(1)
    expect(m.win.cuantos('pagehide')).toBe(1)
  })

  test('1b · al montar YA oculto: nace congelado, sin asumir visible', () => {
    const m = monta({ oculto: true, volumen: 0.4 })
    expect(m.ctrl.estaOculto()).toBe(true)
    expect(m.congelado()).toBe(true)
    expect(m.audio.lee()).toBe(0)
  })

  test('2 · al ocultar: congelado, volumen a 0 y el previo recordado', () => {
    const m = monta({ volumen: 0.65 })
    m.oculta()
    expect(m.congelado()).toBe(true)
    expect(m.audio.volume()).toBe(0)
    // El previo se recuerda de verdad: volver lo devuelve.
    m.muestra()
    expect(m.audio.lee()).toBe(0.65)
  })

  test('2b · ocultarse dos veces no borra la memoria del volumen', () => {
    // Es el caso de iOS: `pagehide` y `visibilitychange` por el mismo hecho. Sin
    // la guarda de reentrada, el segundo recordaría como previo el 0 del primero
    // y la mesa se quedaría muda para siempre.
    const m = monta({ volumen: 0.8 })
    m.win.despacha('pagehide')
    m.oculta()
    expect(m.audio.lee()).toBe(0)
    m.muestra()
    expect(m.audio.lee()).toBe(0.8)
  })

  test('3 · al volver: volumen al previo EXACTO (no a 1) y descongelado', () => {
    const m = monta({ volumen: 0.35 })
    m.oculta()
    m.muestra()
    expect(m.audio.lee()).toBe(0.35)
    expect(m.audio.lee()).not.toBe(1)
    expect(m.congelado()).toBe(false)
    expect(m.ctrl.estaOculto()).toBe(false)
    expect(m.vistos).toEqual([true, false])
  })

  test('4 · diferir en oculto: no corre; al volver corre UNA vez y no se repite', () => {
    const m = monta()
    const fn = vi.fn()
    m.oculta()
    m.ctrl.diferir(fn)
    expect(fn).not.toHaveBeenCalled()
    expect(m.ctrl.hayDiferido()).toBe(true)

    m.muestra()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(m.ctrl.hayDiferido()).toBe(false)

    // Un segundo 'visible' no la repite: el slot ya se vació.
    m.doc.despacha('visibilitychange')
    m.oculta()
    m.muestra()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('4b · la continuación encuentra el estado YA descongelado', () => {
    // El orden del contrato: audio, estado, slot. Si la continuación viera
    // `congelado` todavía en true, la guarda que la difirió volvería a diferirla
    // y la mesa esperaría a una vuelta que ya ocurrió.
    const m = monta({ volumen: 0.5 })
    let vioCongelado = null
    let vioVolumen = null
    m.oculta()
    m.ctrl.diferir(() => { vioCongelado = m.congelado(); vioVolumen = m.audio.lee() })
    m.muestra()
    expect(vioCongelado).toBe(false)
    expect(vioVolumen).toBe(0.5)
  })

  test('5 · diferir dos veces: corre la última y avisa una sola vez', () => {
    const m = monta()
    const primera = vi.fn()
    const segunda = vi.fn()
    m.oculta()
    m.ctrl.diferir(primera)
    expect(avisos).not.toHaveBeenCalled()
    m.ctrl.diferir(segunda)
    expect(avisos).toHaveBeenCalledTimes(1)

    m.muestra()
    expect(primera).not.toHaveBeenCalled()
    expect(segunda).toHaveBeenCalledTimes(1)
  })

  test('6 · desmontar estando oculto: el volumen se restaura', () => {
    // Una mesa que se va en segundo plano no puede dejar el motor mudo para la
    // pantalla siguiente.
    const m = monta({ volumen: 0.7 })
    m.oculta()
    expect(m.audio.lee()).toBe(0)
    m.desmonta()
    expect(m.audio.lee()).toBe(0.7)
    // Y se lleva sus listeners y su slot consigo.
    expect(m.doc.cuantos('visibilitychange')).toBe(0)
    expect(m.win.cuantos('pagehide')).toBe(0)
    expect(m.ctrl.hayDiferido()).toBe(false)
  })

  test('7 · pagehide equivale a ocultarse', () => {
    const m = monta({ volumen: 0.6 })
    m.win.despacha('pagehide')
    expect(m.congelado()).toBe(true)
    expect(m.ctrl.estaOculto()).toBe(true)
    expect(m.audio.lee()).toBe(0)
    // Y la vuelta la sigue dando `visibilitychange`: `pageshow` no se escucha.
    m.muestra()
    expect(m.congelado()).toBe(false)
    expect(m.audio.lee()).toBe(0.6)
  })
})
