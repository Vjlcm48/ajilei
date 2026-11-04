import { describe, it, expect, vi } from 'vitest'
import { creaCargador, decidirFalloChunk } from './cargarMesa.js'

// ARN-3d §2.4 (B11) · la fábrica, con su importador y su reloj inyectados. En
// Node pelado: el `import()` real y `requestIdleCallback` no entran aquí.
const MOD = { default: function GameTable() {} }

function cargador() {
  let resolver, rechazar
  const importar = vi.fn(() => new Promise((ok, ko) => { resolver = ok; rechazar = ko }))
  const pendientes = []
  const ocioso = vi.fn((f) => { pendientes.push(f) })
  const c = creaCargador(importar, ocioso)
  return {
    c, importar, ocioso,
    llega: () => resolver(MOD),
    falla: () => rechazar(new Error('chunk')),
    ociosoCorre: () => pendientes.splice(0).forEach((f) => f()),
  }
}

describe('ARN-3d · fabricaMesa', () => {
  it('antes de que llegue el módulo devuelve la promesa del import()', async () => {
    const k = cargador()
    const p = k.c.fabrica()
    expect(p).toBeInstanceOf(Promise)
    expect(k.importar).toHaveBeenCalledTimes(1)
    k.llega()
    await expect(p).resolves.toBe(MOD)
  })

  it('cuando ya llegó, un thenable SÍNCRONO: resuelve en el mismo tick y sin import nuevo', async () => {
    const k = cargador()
    const p = k.c.cargar()
    k.llega()
    await p
    const t = k.c.fabrica()
    expect(t).not.toBeInstanceOf(Promise)
    let visto = null
    t.then((m) => { visto = m })
    // Síncrono: el valor está ANTES de ceder el turno. Es lo que hace que
    // `React.lazy` no suspenda (H3d-2).
    expect(visto).toBe(MOD)
    expect(k.importar).toHaveBeenCalledTimes(1)
  })

  it('dos peticiones en vuelo son UN solo import()', () => {
    const k = cargador()
    const a = k.c.cargar()
    const b = k.c.fabrica()
    expect(a).toBe(b)
    expect(k.importar).toHaveBeenCalledTimes(1)
  })

  it('un import() que falla se propaga y NO se recuerda: la siguiente petición vuelve a importar', async () => {
    const k = cargador()
    const p = k.c.fabrica()
    k.falla()
    await expect(p).rejects.toThrow('chunk')
    k.c.cargar()
    expect(k.importar).toHaveBeenCalledTimes(2)
  })
})

describe('ARN-3d · precargarMesa', () => {
  it('se programa en el reloj ocioso, no en el acto', () => {
    const k = cargador()
    k.c.precargar()
    expect(k.ocioso).toHaveBeenCalledTimes(1)
    expect(k.importar).not.toHaveBeenCalled()
    k.ociosoCorre()
    expect(k.importar).toHaveBeenCalledTimes(1)
  })

  it('es idempotente: pedirla otra vez no programa nada más', () => {
    const k = cargador()
    k.c.precargar()
    k.c.precargar()
    k.ociosoCorre()
    k.c.precargar()
    expect(k.ocioso).toHaveBeenCalledTimes(1)
    expect(k.importar).toHaveBeenCalledTimes(1)
  })

  it('traga su propio fallo: la precarga es un adelanto, no una dependencia', async () => {
    const k = cargador()
    k.c.precargar()
    k.ociosoCorre()
    k.falla()
    // Sin un rechazo sin atender: si lo hubiera, vitest fallaría la prueba.
    await new Promise((r) => setTimeout(r, 0))
    // Y la mesa se puede pedir otra vez al entrar.
    k.c.fabrica()
    expect(k.importar).toHaveBeenCalledTimes(2)
  })
})

// STOP-2 · la precarga nunca recarga; la entrada, una vez.
describe('ARN-3d · de dónde viene un fallo del chunk', () => {
  it('hasta que onRetar marca la entrada, el fallo es de la precarga', () => {
    const k = cargador()
    expect(k.c.origenFallo()).toBe('precarga')
    k.c.marcarEntrada()
    expect(k.c.origenFallo()).toBe('entrada')
  })

  it('la marca no depende de que el módulo llegue ni de que falle', async () => {
    const k = cargador()
    k.c.precargar()
    k.ociosoCorre()
    k.falla()
    await new Promise((r) => setTimeout(r, 0))
    expect(k.c.origenFallo()).toBe('precarga')
    k.c.marcarEntrada()
    const p = k.c.fabrica()
    k.falla()
    await expect(p).rejects.toThrow('chunk')
    expect(k.c.origenFallo()).toBe('entrada')
  })
})

describe('ARN-3d · decidirFalloChunk(origen, guarda)', () => {
  it.each([
    ['precarga', 'libre', 'silencio'],
    ['precarga', 'usada', 'silencio'],
    ['precarga', 'rota', 'silencio'],
    ['entrada', 'libre', 'recargar'],
    ['entrada', 'usada', 'dejar'],
    ['entrada', 'rota', 'dejar'],
  ])('%s con la guarda %s → %s', (origen, guarda, esperado) => {
    expect(decidirFalloChunk(origen, guarda)).toBe(esperado)
  })

  it('la precarga NUNCA recarga, sea cual sea la guarda', () => {
    for (const g of ['libre', 'usada', 'rota', undefined]) {
      expect(decidirFalloChunk('precarga', g)).not.toBe('recargar')
    }
  })

  it('un origen desconocido se trata como precarga: no recarga', () => {
    expect(decidirFalloChunk(undefined, 'libre')).toBe('silencio')
  })
})

describe('PES-1 · llego y esperando, para clasificar con varios trozos', () => {
  it('esperando es la marca mientras el módulo no ha llegado', async () => {
    const k = cargador()
    expect(k.c.llego()).toBe(false)
    expect(k.c.esperando()).toBe(false)
    k.c.marcarEntrada()
    expect(k.c.esperando()).toBe(true)
    const p = k.c.cargar()
    k.llega()
    await p
    expect(k.c.llego()).toBe(true)
    expect(k.c.esperando()).toBe(false)
  })

  it('un import() que Vite resuelve sin módulo no cuenta como llegado', async () => {
    const importar = vi.fn(() => Promise.resolve(undefined))
    const c = creaCargador(importar, vi.fn())
    c.marcarEntrada()
    await c.cargar()
    expect(c.llego()).toBe(false)
    expect(c.esperando()).toBe(true)
  })
})
