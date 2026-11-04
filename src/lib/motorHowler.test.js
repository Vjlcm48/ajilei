import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// PES-1 §3-E · el motor de sonido, con el `import()` de verdad sobre un Howler falso.
// Lo que importa: nada viaja antes de pintar, y lo pedido antes de llegar no se pierde.
class HowlFalso {
  constructor(o) { this.o = o; HowlFalso.creados.push(o.src[0]) }
  play() { HowlFalso.sonados.push(this.o.src[0]); return 1 }
}
const HowlerFalso = { mute: vi.fn() }
vi.mock('howler', () => ({ Howl: HowlFalso, Howler: HowlerFalso }))

async function fresco() {
  vi.resetModules()
  HowlFalso.creados = []
  HowlFalso.sonados = []
  HowlerFalso.mute.mockClear()
  const motor = await import('./motorHowler.js')
  const sonidos = await import('../hooks/useSounds.js')
  return { ...motor, ...sonidos }
}

describe('PES-1 · motorHowler', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('sin navegador que cuente el pintado, no pide nada hasta el reloj de 900 ms', async () => {
    const m = await fresco()
    m.arrancarHowler()
    await vi.advanceTimersByTimeAsync(899)
    expect(m.howlerYa()).toBe(null)
    await vi.advanceTimersByTimeAsync(1)
    await vi.dynamicImportSettled()
    expect(m.howlerYa()?.Howl).toBe(HowlFalso)
  })

  it('lo pedido antes de llegar corre al llegar, en orden: primero el mute guardado', async () => {
    const m = await fresco()
    const orden = []
    m.conHowler(() => orden.push('mute'))
    m.conHowler(() => orden.push('precarga'))
    m.arrancarHowler()
    expect(orden).toEqual([])
    await vi.advanceTimersByTimeAsync(900)
    await vi.dynamicImportSettled()
    expect(orden).toEqual(['mute', 'precarga'])
    m.conHowler(() => orden.push('después'))
    expect(orden.at(-1)).toBe('después')
  })

  it('un sonido antes del motor suena al llegar, una sola vez aunque se toque diez veces', async () => {
    const m = await fresco()
    for (let i = 0; i < 10; i++) expect(m.reproducir('buttonClick', true)).toBe(null)
    expect(HowlFalso.sonados).toEqual([])
    m.arrancarHowler()
    await vi.advanceTimersByTimeAsync(900)
    await vi.dynamicImportSettled()
    expect(HowlFalso.sonados).toEqual(['/sounds/button-click.mp3'])
    // Ya con motor, como siempre: suena en el acto y devuelve su id.
    expect(m.reproducir('buttonClick', true)).toMatchObject({ id: 1 })
    expect(HowlFalso.sonados).toHaveLength(2)
  })

  it('con el sonido apagado no se encola nada', async () => {
    const m = await fresco()
    expect(m.reproducir('buttonClick', false)).toBe(null)
    m.arrancarHowler()
    await vi.advanceTimersByTimeAsync(900)
    await vi.dynamicImportSettled()
    expect(HowlFalso.sonados).toEqual([])
  })

  it('precargar antes del motor no construye nada hasta que llega', async () => {
    const m = await fresco()
    m.precargarSonidos(['tableKnock'])
    expect(HowlFalso.creados).toEqual([])
    m.arrancarHowler()
    await vi.advanceTimersByTimeAsync(900)
    await vi.dynamicImportSettled()
    expect(HowlFalso.creados).toEqual(['/sounds/table-knock.mp3'])
  })
})
