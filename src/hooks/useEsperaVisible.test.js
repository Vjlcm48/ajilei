// BIE-1 · La regla D5 del «Cargando», sellada con temporizadores falsos.
//
// Molde de `useCongelado.test.js`: el proyecto no tiene jsdom ni
// `@testing-library` y la ficha prohíbe dependencias nuevas, así que no se monta
// React. Se recorre el controlador de verdad con los relojes de verdad —los de
// `setTimeout` y `Date.now`, que Vitest sustituye— y el hook queda fuera del
// sello: son dos `useLayoutEffect` que no deciden nada. El camino entero, con la
// red simulada, lo miden las puertas `bie.c*` de `diagPUE`.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { creaEsperaVisible, liberado, RETARDO_MS, MINIMO_MS } from './useEsperaVisible'

// El montaje: controlador + espejo de lo que avisa, como lo hace el hook.
function monta() {
  const ctrl = creaEsperaVisible()
  const vistos = []
  ctrl.alCambiar((v) => vistos.push([v, Date.now()]))
  return { ctrl, vistos, mostrar: () => ctrl.estado().mostrar, liberar: () => ctrl.estado().liberar }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0) })
afterEach(() => { vi.useRealTimers() })

describe('useEsperaVisible · la regla D5 (BIE-1)', () => {
  test('0 · las cifras son las selladas: 300 ms de retardo, 500 ms de mínimo', () => {
    expect(RETARDO_MS).toBe(300)
    expect(MINIMO_MS).toBe(500)
  })

  test('1 · carga que resuelve antes de 300 ms: no se muestra y libera al instante', () => {
    const m = monta()
    m.ctrl.cambia(true)
    expect(m.liberar()).toBe(false)
    vi.advanceTimersByTime(299)
    expect(m.mostrar()).toBe(false)
    m.ctrl.cambia(false)
    expect(m.liberar()).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(m.vistos).toEqual([])
    expect(m.ctrl.relojesVivos()).toBe(0)
  })

  test('2 · antes de 300 ms no aparece; a los 300 ms, sí', () => {
    const m = monta()
    m.ctrl.cambia(true)
    vi.advanceTimersByTime(299)
    expect(m.mostrar()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(m.mostrar()).toBe(true)
    expect(m.vistos).toEqual([[true, 300]])
  })

  test('3 · si se mostró, no libera antes de 500 ms aunque la carga ya terminó', () => {
    const m = monta()
    m.ctrl.cambia(true)
    vi.advanceTimersByTime(350)          // aparece a los 300
    m.ctrl.cambia(false)                 // termina a los 350: 50 ms visible
    expect(m.mostrar()).toBe(true)
    expect(m.liberar()).toBe(false)
    vi.advanceTimersByTime(449)          // 799: 499 ms visible
    expect(m.liberar()).toBe(false)
    vi.advanceTimersByTime(1)            // 800: 500 ms visible
    expect(m.mostrar()).toBe(false)
    expect(m.liberar()).toBe(true)
    expect(m.vistos).toEqual([[true, 300], [false, 800]])
  })

  test('4 · carga larga: libera en cuanto termina, sin esperar más', () => {
    const m = monta()
    m.ctrl.cambia(true)
    vi.advanceTimersByTime(4000)
    m.ctrl.cambia(false)
    expect(m.mostrar()).toBe(false)
    expect(m.liberar()).toBe(true)
    expect(m.vistos).toEqual([[true, 300], [false, 4000]])
    expect(m.ctrl.relojesVivos()).toBe(0)
  })

  test('5 · vuelve a cargar durante el mínimo: sigue visible, sin rearmar el retardo', () => {
    const m = monta()
    m.ctrl.cambia(true)
    vi.advanceTimersByTime(400)
    m.ctrl.cambia(false)                 // empieza el mínimo (faltan 400)
    vi.advanceTimersByTime(100)
    m.ctrl.cambia(true)                  // otra carga: el mínimo se cancela
    vi.advanceTimersByTime(2000)
    expect(m.mostrar()).toBe(true)
    expect(m.vistos).toEqual([[true, 300]])
    m.ctrl.cambia(false)                 // ya lleva 2,2 s visible: libera ya
    expect(m.liberar()).toBe(true)
  })

  test('6 · la repetición del mismo valor no rearma nada', () => {
    const m = monta()
    m.ctrl.cambia(true)
    vi.advanceTimersByTime(200)
    m.ctrl.cambia(true)                  // un render más con CARGANDO
    vi.advanceTimersByTime(100)
    expect(m.vistos).toEqual([[true, 300]])
  })

  test('7 · al desmontar no queda ningún reloj ni aviso pendiente', () => {
    const a = monta()
    a.ctrl.cambia(true)
    a.ctrl.suelta()
    expect(a.ctrl.relojesVivos()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(a.vistos).toEqual([])

    vi.setSystemTime(0)
    const b = monta()                    // desmontar en pleno mínimo
    b.ctrl.cambia(true)
    vi.advanceTimersByTime(300)
    b.ctrl.cambia(false)
    b.ctrl.suelta()
    expect(b.ctrl.relojesVivos()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(b.vistos).toEqual([[true, 300]])
  })

  test('8 · tras soltar, un segundo montaje arranca limpio (doble montaje de StrictMode)', () => {
    const m = monta()
    m.ctrl.cambia(true)
    vi.advanceTimersByTime(100)
    m.ctrl.suelta()
    m.ctrl.cambia(true)                  // el efecto vuelve a correr
    vi.advanceTimersByTime(299)
    expect(m.mostrar()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(m.mostrar()).toBe(true)
    expect(m.vistos).toEqual([[true, 400]])
  })

  test('9 · `liberar` es exactamente «ni cargando ni mostrando»', () => {
    expect(liberado(false, false)).toBe(true)
    expect(liberado(true, false)).toBe(false)
    expect(liberado(false, true)).toBe(false)
    expect(liberado(true, true)).toBe(false)
  })
})
