import { describe, it, expect, vi } from 'vitest'

// `supabase.js` lanza al importarse si faltan las variables de entorno: el
// cliente real no se usa aquí (molde de `salasApi.test.js`).
vi.mock('./supabase', () => ({ supabase: { functions: { invoke: () => {} } } }))

const { traducirEliminar, crearCuentaApi, MOTIVOS, TOPE_ELIMINAR_MS } = await import('./cuentaApi.js')
const { CABECERA_TOPE } = await import('./red.js')

// La forma de los errores de `@supabase/functions-js` 2.112.4: el HTTP trae la
// `Response` en `context`; el de red, el error del `fetch`.
const http = (status, cuerpo) => ({
  name: 'FunctionsHttpError',
  context: { status, json: async () => { if (cuerpo === undefined) throw new SyntaxError('sin json'); return cuerpo } },
})
const red = { name: 'FunctionsFetchError', context: new TypeError('Failed to fetch') }
const relevo = { name: 'FunctionsRelayError', context: { status: 502 } }

describe('CFG-1 1c · traducirEliminar', () => {
  it('200 { ok: true } → ok', async () => {
    expect(await traducirEliminar({ data: { ok: true }, error: null })).toEqual({ ok: true })
  })
  it('un 200 que no dice ok → servidor (nunca se da por borrada a ciegas)', async () => {
    for (const data of [null, {}, { ok: 'true' }, 'ok', []]) {
      expect(await traducirEliminar({ data, error: null })).toEqual({ ok: false, motivo: 'servidor' })
    }
  })
  it('409 { motivo: mesa_abierta } → mesa_abierta', async () => {
    expect(await traducirEliminar({ data: null, error: http(409, { motivo: 'mesa_abierta' }) })).toEqual({ ok: false, motivo: 'mesa_abierta' })
  })
  it('un 409 con otro cuerpo, o sin JSON → servidor', async () => {
    expect((await traducirEliminar({ error: http(409, { motivo: 'otra' }) })).motivo).toBe('servidor')
    expect((await traducirEliminar({ error: http(409) })).motivo).toBe('servidor')
  })
  it('401 → sin_sesion', async () => {
    expect(await traducirEliminar({ error: http(401, { motivo: 'sin_sesion' }) })).toEqual({ ok: false, motivo: 'sin_sesion' })
  })
  it('red → red; relevo, 500, 403, 404 y errores sin forma → servidor', async () => {
    expect((await traducirEliminar({ error: red })).motivo).toBe('red')
    for (const error of [relevo, http(500, { motivo: 'servidor' }), http(403, {}), http(404), { name: 'Error' }, {}]) {
      expect((await traducirEliminar({ error })).motivo).toBe('servidor')
    }
  })
  it('los motivos son cerrados: sólo salen los cuatro', () => {
    expect(MOTIVOS).toEqual(['mesa_abierta', 'sin_sesion', 'red', 'servidor'])
  })
})

describe('CFG-1 1c · crearCuentaApi', () => {
  it('llama a eliminar_cuenta por POST, sin cuerpo y con el tope de 20 s', async () => {
    const invoke = vi.fn(async () => ({ data: { ok: true }, error: null }))
    expect(await crearCuentaApi({ functions: { invoke } }).eliminar()).toEqual({ ok: true })
    expect(TOPE_ELIMINAR_MS).toBe(20000)
    expect(invoke).toHaveBeenCalledWith('eliminar_cuenta', { method: 'POST', headers: { [CABECERA_TOPE]: '20000' } })
  })
  it('si la llamada lanza o rechaza, red; nunca lanza', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await crearCuentaApi({ functions: { invoke: () => { throw new Error('x') } } }).eliminar()).toEqual({ ok: false, motivo: 'red' })
    expect(await crearCuentaApi({ functions: { invoke: async () => { throw new Error('x') } } }).eliminar()).toEqual({ ok: false, motivo: 'red' })
    warn.mockRestore()
  })
})
