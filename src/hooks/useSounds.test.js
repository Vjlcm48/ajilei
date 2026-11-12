// BIE-1 · `reproducir`, la pieza pura que hay debajo de `useSounds().play`.
//
// ── Lo que se sella y lo que no ─────────────────────────────────────────────
// El defecto de la Fase 0 era de IDENTIDAD: `play` nacía nuevo en cada render y
// el efecto de la Portada que dependía de él se rearmaba cada vez. Esa
// identidad la da React (`useCallback` sin dependencias) y montar React aquí no
// se puede sin instalar nada: el proyecto no tiene `jsdom`, ni `happy-dom`, ni
// `@testing-library` (lo mismo que dice `useCongelado.test.js`). La prueba de la
// identidad la hace el modo `bie` de `diagPUE` en un navegador de verdad: con
// la Portada repintándose entre gesto y gesto, el rasgueo viejo tiene que salir
// CERO veces y cada botón UN clic.
//
// Lo que sí se sella aquí es la propiedad que hace SEGURO quitarle las
// dependencias a `useCallback`: que la decisión de sonar se toma con el ajuste
// que llega EN CADA LLAMADA y no con uno capturado al crear. Más las tres ramas
// del reproductor, que pasan intactas de la flecha vieja a la pieza nueva.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// El módulo importa `howler` (y `SoundContext`, que también lo importa). Se
// sustituye por un doble mínimo para que el import no arrastre el motor de
// audio a node; las aserciones no lo usan: cada caso pasa su propio `sonido`.
vi.mock('howler', () => ({ Howl: class {}, Howler: { mute: () => {} } }))

const { cortarSonido, reproducir, STRUM_CORTE_MS, STRUM_FADE_MS, SONIDOS_PORTADA } = await import('./useSounds')

// Un `Howl` falso que apunta lo que le piden.
function sonidoFalso({ duracion = 0 } = {}) {
  const s = {
    llamadas: [],
    siguienteId: 1,
    play() { const id = s.siguienteId++; s.llamadas.push(['play', id]); return id },
    duration() { return duracion },
    volume() { return 0.8 },
    fade(...a) { s.llamadas.push(['fade', ...a]) },
    stop(id) { s.llamadas.push(['stop', id]) },
    playing() { return true },
  }
  return s
}

describe('BIE-1 · reproducir', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  test('con el sonido apagado no pide el sonido ni suena', () => {
    const pide = vi.fn(() => sonidoFalso())
    expect(reproducir('buttonClick', false, pide)).toBe(null)
    expect(pide).not.toHaveBeenCalled()
  })

  test('con el sonido encendido suena una vez y devuelve el id', () => {
    const s = sonidoFalso()
    const r = reproducir('buttonClick', true, () => s)
    expect(r).toEqual({ sound: s, id: 1 })
    expect(s.llamadas).toEqual([['play', 1]])
  })

  test('el ajuste se lee en CADA llamada: el mismo envoltorio obedece al cambio', () => {
    // Es lo que hace el hook: una sola función, creada una vez, que lee el
    // ajuste vivo al sonar. Si capturara el de su creación, apagar el sonido no
    // la callaría y encenderlo no la despertaría.
    const s = sonidoFalso()
    let encendido = true
    const play = (n) => reproducir(n, encendido, () => s)
    expect(play('buttonClick')).not.toBe(null)
    encendido = false
    expect(play('buttonClick')).toBe(null)
    encendido = true
    expect(play('buttonClick')).not.toBe(null)
    expect(s.llamadas.filter(([q]) => q === 'play')).toHaveLength(2)
  })

  test('un nombre que no existe no suena', () => {
    expect(reproducir('noExiste', true, () => null)).toBe(null)
  })

  test('el rasgueo conserva su recorte: cortina a los 1300 ms y parada tras 130', () => {
    const s = sonidoFalso()
    reproducir('ajileiStrum', true, () => s)
    vi.advanceTimersByTime(STRUM_CORTE_MS - 1)
    expect(s.llamadas.some(([q]) => q === 'fade')).toBe(false)
    vi.advanceTimersByTime(1)
    expect(s.llamadas).toContainEqual(['fade', 0.8, 0, STRUM_FADE_MS, 1])
    vi.advanceTimersByTime(STRUM_FADE_MS)
    expect(s.llamadas).toContainEqual(['stop', 1])
  })

  test('el barajado se recorta al 49 % cuando conoce su duración', () => {
    const s = sonidoFalso({ duracion: 5.208 })
    reproducir('cardShuffle', true, () => s)
    // 5208 · 0,49 − 130 = 2421,92 ms; el reloj falso lo trunca a 2421, como el
    // navegador. Un milisegundo antes no hay cortina; tres después, sí.
    const corte = Math.floor(5208 * 0.49 - 130)
    vi.advanceTimersByTime(corte - 1)
    expect(s.llamadas.some(([q]) => q === 'fade')).toBe(false)
    vi.advanceTimersByTime(3)
    expect(s.llamadas.some(([q]) => q === 'fade')).toBe(true)
  })

  test('5a · el sorteo corta el barajado al terminar su etapa, con su desvanecido y sin el recorte', () => {
    const s = sonidoFalso()   // sin duración: el archivo aún no había llegado, no hay recorte
    reproducir('cardShuffle', true, () => s)
    vi.advanceTimersByTime(1000)
    cortarSonido('cardShuffle')
    expect(s.llamadas).toContainEqual(['fade', 0.8, 0, 130, 1])
    vi.advanceTimersByTime(130)
    expect(s.llamadas).toContainEqual(['stop', 1])
    const antes = s.llamadas.length
    vi.advanceTimersByTime(5000)
    cortarSonido('cardShuffle')   // ya cortado: nada más
    expect(s.llamadas).toHaveLength(antes)
  })

  test('la Portada precarga el clic y no el rasgueo (D2/D9 de BIE-1)', () => {
    expect(SONIDOS_PORTADA).toEqual(['buttonClick'])
  })
})
