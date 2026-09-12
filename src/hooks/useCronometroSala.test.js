import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { creaCronometro } from './useCronometroSala.js'
import { DURACION_SALA_SEG, LLENA_SEG } from '../config/salas.js'

// ── SAL-B2 · El cronómetro de la sala ───────────────────────────────────────
// Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §7.
//
// ── EL MÉTODO, DECLARADO ──────────────────────────────────────────────────
// No hay jsdom ni `@testing-library` en el proyecto, y la ficha prohíbe
// instalar. Se sigue la receta de la casa (`useCongelado.test.js`): lo que
// decide vive en `creaCronometro`, y aquí se recorre EL CAMINO REAL —la medida
// del desfase, el latido, el recálculo, la limpieza— con `vi.useFakeTimers()`,
// que falsea `Date.now` y los temporizadores a la vez. Lo único que queda fuera
// del sello es el espejo de React (`useState` reflejando lo que el controlador
// avisa), que no decide nada.

const T0 = Date.parse('2026-09-11T12:00:00.000Z')
const iso = (ms) => new Date(ms).toISOString()

// Un `api` con sólo `ahora()`, que es lo único que el cronómetro toca. Responde
// con la hora del servidor que el caso quiera, o falla.
function apiFalsa({ servidor = null, error = null, tarda = 0 } = {}) {
  const registro = { llamadas: 0 }
  return {
    registro,
    ahora() {
      registro.llamadas += 1
      return new Promise((resolve) => setTimeout(() => resolve(
        error ? { data: null, error } : { data: iso(servidor ?? Date.now()), error: null }
      ), tarda))
    },
  }
}

// Monta el controlador como lo hace el hook: aviso enganchado y arrancado.
function monta({ expiraEn = iso(T0 + DURACION_SALA_SEG * 1000), ...opciones } = {}) {
  const api = apiFalsa(opciones)
  const ctrl = creaCronometro(api, expiraEn)
  const vistos = []
  ctrl.alCambiar((e) => vistos.push(e))
  ctrl.arranca()
  return { api, ctrl, vistos, ultimo: () => vistos[vistos.length - 1] }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0) })
afterEach(() => { vi.useRealTimers() })

describe('SAL-B2 · creaCronometro · la medida', () => {
  it('antes de medir, el estado ya enseña la cuenta con el reloj local', () => {
    const { ctrl } = monta()
    expect(ctrl.estado()).toEqual({ segundos: 180, texto: '3:00', medido: false })
  })

  it('pide la hora UNA sola vez y aplica el desfase', async () => {
    // El servidor va 30 s por delante: quedan 150, no 180.
    const { api, ultimo } = monta({ servidor: T0 + 30_000 })
    await vi.advanceTimersByTimeAsync(0)
    expect(api.registro.llamadas).toBe(1)
    expect(ultimo()).toEqual({ segundos: 150, texto: '2:30', medido: true })
    await vi.advanceTimersByTimeAsync(5_000)
    expect(api.registro.llamadas).toBe(1)
  })

  it('un reloj local ADELANTADO también se corrige', async () => {
    const { ultimo } = monta({ servidor: T0 - 60_000 })
    await vi.advanceTimersByTimeAsync(0)
    expect(ultimo().segundos).toBe(240)
  })

  it('si ahora() falla: medido false, desfase 0 y la cuenta sigue', async () => {
    const { ultimo, ctrl } = monta({ error: { message: 'Failed to fetch' } })
    await vi.advanceTimersByTimeAsync(0)
    expect(ultimo().medido).toBe(false)
    expect(ultimo().segundos).toBe(180)
    await vi.advanceTimersByTimeAsync(2_000)
    expect(ctrl.estado()).toEqual({ segundos: 178, texto: '2:58', medido: false })
  })

  it('un dato vacío también es «sin medida», y no envenena con NaN', async () => {
    const api = { ahora: () => Promise.resolve({ data: null, error: null }) }
    const ctrl = creaCronometro(api, iso(T0 + 10_000))
    ctrl.arranca()
    await vi.advanceTimersByTimeAsync(0)
    expect(ctrl.estado()).toEqual({ segundos: 10, texto: '0:10', medido: false })
    ctrl.para()
  })

  it('la medida que llega tarde se aplica igual, y la que llega tras parar, no', async () => {
    const { ctrl, ultimo } = monta({ servidor: T0 + 30_000, tarda: 2_500 })
    await vi.advanceTimersByTimeAsync(2_000)
    expect(ultimo().medido).toBe(false)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(ultimo().medido).toBe(true)

    const tarde = monta({ servidor: T0 + 30_000, tarda: 2_500 })
    tarde.ctrl.para()
    const antes = tarde.vistos.length
    await vi.advanceTimersByTimeAsync(5_000)
    expect(tarde.vistos.length).toBe(antes)
    ctrl.para()
  })
})

describe('SAL-B2 · creaCronometro · el latido', () => {
  it('cuenta hacia abajo un segundo por pulso, recalculando y no restando', async () => {
    const { ultimo, ctrl } = monta()
    await vi.advanceTimersByTimeAsync(3_000)
    expect(ultimo()).toEqual({ segundos: 177, texto: '2:57', medido: true })
    ctrl.para()
  })

  it('una pestaña que vuelve de dormir se pone al día en el primer pulso', async () => {
    // Se adelanta el reloj 100 s SIN pulsos (como un navegador que estranguló el
    // intervalo) y el siguiente pulso ya dice la verdad, no «un segundo menos».
    const { ultimo, ctrl } = monta()
    await vi.advanceTimersByTimeAsync(0)
    vi.setSystemTime(T0 + 100_000)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(ultimo().segundos).toBe(79)
    ctrl.para()
  })

  it('nunca baja de cero, y a cero se queda', async () => {
    const { ultimo, ctrl } = monta({ expiraEn: iso(T0 + 2_000) })
    await vi.advanceTimersByTimeAsync(5_000)
    expect(ultimo()).toEqual({ segundos: 0, texto: '0:00', medido: true })
    ctrl.para()
  })

  it('para() cancela el latido: ni un aviso después', async () => {
    const { vistos, ctrl } = monta()
    await vi.advanceTimersByTimeAsync(2_000)
    const antes = vistos.length
    ctrl.para()
    expect(ctrl.estaVivo()).toBe(false)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(vistos.length).toBe(antes)
  })

  it('arrancar dos veces no abre dos latidos', async () => {
    const { vistos, ctrl } = monta()
    ctrl.arranca()
    await vi.advanceTimersByTimeAsync(0)
    const trasMedida = vistos.length
    await vi.advanceTimersByTimeAsync(1_000)
    expect(vistos.length).toBe(trasMedida + 1)
    ctrl.para()
  })
})

describe('SAL-B2 · creaCronometro · la mesa llena', () => {
  it('un expira_en nuevo se recalcula en el acto, sin esperar al pulso', async () => {
    const { ultimo, ctrl } = monta()
    await vi.advanceTimersByTimeAsync(0)
    expect(ultimo().segundos).toBe(180)
    // Llega la fila con la cuenta corta (unirse_sala acortó a 10 s).
    ctrl.cambiaExpira(iso(T0 + LLENA_SEG * 1000))
    expect(ultimo()).toEqual({ segundos: LLENA_SEG, texto: '0:10', medido: true })
    ctrl.para()
  })

  it('y si alguien se levanta, el plazo restituido también se recalcula', async () => {
    const { ultimo, ctrl } = monta({ expiraEn: iso(T0 + LLENA_SEG * 1000) })
    await vi.advanceTimersByTimeAsync(3_000)
    expect(ultimo().segundos).toBe(7)
    ctrl.cambiaExpira(iso(T0 + DURACION_SALA_SEG * 1000))
    expect(ultimo().segundos).toBe(177)
    ctrl.para()
  })

  it('el cambio respeta el desfase medido', async () => {
    const { ultimo, ctrl } = monta({ servidor: T0 + 30_000 })
    await vi.advanceTimersByTimeAsync(0)
    ctrl.cambiaExpira(iso(T0 + 30_000 + LLENA_SEG * 1000))
    expect(ultimo().segundos).toBe(LLENA_SEG)
    ctrl.para()
  })

  it('un expira_en ilegible cuenta cero, no NaN', async () => {
    const { ultimo, ctrl } = monta()
    await vi.advanceTimersByTimeAsync(0)
    ctrl.cambiaExpira(null)
    expect(ultimo()).toEqual({ segundos: 0, texto: '0:00', medido: true })
    ctrl.para()
  })
})

describe('SAL-B2 · creaCronometro · los temporizadores entran por parámetro', () => {
  it('usa los que se le dan, con el periodo que se le da', () => {
    const puestos = []
    const quitados = []
    const ctrl = creaCronometro({ ahora: () => Promise.resolve({ data: iso(T0), error: null }) }, iso(T0 + 5_000), {
      now: () => T0,
      setInterval: (fn, ms) => { puestos.push(ms); return 'id-1' },
      clearInterval: (id) => quitados.push(id),
      periodoMs: 250,
    })
    ctrl.arranca()
    expect(puestos).toEqual([250])
    ctrl.para()
    expect(quitados).toEqual(['id-1'])
  })
})
