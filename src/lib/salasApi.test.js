import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── SAL-A · La API de salas ─────────────────────────────────────────────────
// Rector: AJILEI_SALA_Fase1_v1.0.md §5.2.
//
// ── POR QUÉ SE SUSTITUYE `lib/supabase.js` ──────────────────────────────────
// Ese módulo LANZA al importarse si faltan `VITE_SUPABASE_URL` y
// `VITE_SUPABASE_PUBLISHABLE_KEY` (es su doctrina: fallar ruidoso y temprano).
// Esas variables viven en `.env.local`, que git ignora — así que un test que
// dependiera de ellas pasaría en la máquina de Victor y reventaría en un clon
// recién hecho, que es la peor clase de prueba.
//
// Se sustituye por un objeto mínimo. Molde de `useCongelado.test.js:26`, que
// hace lo mismo con `howler` para que el import no arrastre el motor de audio a
// un proceso de node. Ninguna aserción usa este doble: cada caso construye su
// propio cliente falso y se lo pasa a `crearSalasApi`.
vi.mock('./supabase', () => ({ supabase: { rpc: () => {}, channel: () => {}, removeChannel: () => {} } }))

const { crearSalasApi, CLAVES_ERROR, ERROR_INESPERADO } = await import('./salasApi.js')

// ── El cliente falso ────────────────────────────────────────────────────────
// Registra lo que se le pidió y devuelve lo que el caso quiera. No simula
// Postgres: lo que se sella aquí es la FRONTERA —qué se llama, con qué
// argumentos, y en qué se convierte lo que vuelve—, no las reglas de la base,
// que viven en SQL y se prueban en SQL.
function clienteFalso(respuestas = {}) {
  const registro = { rpc: [], canales: [], bajas: [] }
  return {
    registro,
    rpc(nombre, args) {
      registro.rpc.push({ nombre, args })
      return Promise.resolve(respuestas[nombre] ?? { data: null, error: null })
    },
    channel(nombre) {
      const canal = { nombre, escuchas: [] }
      registro.canales.push(canal)
      const api = {
        on(tipo, filtro, fn) { canal.escuchas.push({ tipo, filtro, fn }); return api },
        subscribe() { canal.suscrito = true; return canal },
      }
      return api
    },
    removeChannel(canal) { registro.bajas.push(canal) },
  }
}

let avisos
beforeEach(() => { avisos = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { vi.restoreAllMocks() })

describe('SAL-A · las RPC y sus argumentos', () => {
  it('crearSala manda los tres parámetros con los nombres de la base', () => {
    // Los nombres `p_tipo`/`p_jugadores`/`p_apuesta` son CONTRATO con la
    // migración: PostgREST resuelve la función por sus argumentos con nombre, y
    // uno mal escrito no da un error de tipo — da un 404 «no such function».
    const c = clienteFalso()
    crearSalasApi(c).crearSala('abierta', 4, 500)
    expect(c.registro.rpc).toEqual([
      { nombre: 'crear_sala', args: { p_tipo: 'abierta', p_jugadores: 4, p_apuesta: 500 } },
    ])
  })

  it('unirseSala manda los dos huecos, uno en null', () => {
    const c = clienteFalso()
    const api = crearSalasApi(c)
    api.unirseSala({ codigo: 'AJ-7K2M' })
    api.unirseSala({ salaId: 'uuid-1' })
    api.unirseSala()
    expect(c.registro.rpc.map(r => r.args)).toEqual([
      { p_codigo: 'AJ-7K2M', p_sala: null },
      { p_codigo: null, p_sala: 'uuid-1' },
      { p_codigo: null, p_sala: null },
    ])
  })

  it('las demás llamadas van a su función', () => {
    const c = clienteFalso()
    const api = crearSalasApi(c)
    api.ahora()
    api.salirSala('u1')
    api.jugarYa('u1')
    api.resolverSala('u1')
    api.salasAbiertas()
    api.miSala()
    expect(c.registro.rpc.map(r => r.nombre)).toEqual([
      'ahora', 'salir_sala', 'jugar_ya', 'resolver_sala', 'salas_abiertas', 'mi_sala',
    ])
  })
})

describe('SAL-A · traducción de errores', () => {
  it('una respuesta buena pasa el dato y error null', async () => {
    const sala = { id: 'u1', codigo: 'AJ-7K2M', estado: 'esperando' }
    const c = clienteFalso({ crear_sala: { data: sala, error: null } })
    await expect(crearSalasApi(c).crearSala('privada', 2, 100))
      .resolves.toEqual({ data: sala, error: null })
  })

  it('un P0001 con clave conocida se devuelve como clave', async () => {
    for (const clave of CLAVES_ERROR) {
      const c = clienteFalso({ crear_sala: { data: null, error: { code: 'P0001', message: clave } } })
      await expect(crearSalasApi(c).crearSala('abierta', 2, 100))
        .resolves.toEqual({ data: null, error: clave })
    }
  })

  it('el consumidor JAMÁS ve el objeto de error crudo', async () => {
    // Sin esto, antes o después alguien pinta `error.message` en pantalla y el
    // jugador lee una excepción de Postgres.
    const c = clienteFalso({ jugar_ya: { data: null, error: { code: '42501', message: 'permission denied for table salas' } } })
    const { error } = await crearSalasApi(c).jugarYa('u1')
    expect(typeof error).toBe('string')
    expect(error).toBe(ERROR_INESPERADO)
  })

  it('un P0001 con prosa NO se pinta: cae a error inesperado y avisa', async () => {
    // La red de seguridad contra una función futura que olvide la convención de
    // claves y lance una frase. Se prefiere un mensaje genérico a enseñarle al
    // jugador el texto de una excepción.
    const c = clienteFalso({ unirse_sala: { data: null, error: { code: 'P0001', message: 'algo salió mal en el trigger' } } })
    await expect(crearSalasApi(c).unirseSala({ codigo: 'AJ-7K2M' }))
      .resolves.toEqual({ data: null, error: ERROR_INESPERADO })
    expect(avisos).toHaveBeenCalledTimes(1)
  })

  it('un fallo de red también es error inesperado', async () => {
    const c = clienteFalso({ salas_abiertas: { data: null, error: { message: 'Failed to fetch' } } })
    await expect(crearSalasApi(c).salasAbiertas())
      .resolves.toEqual({ data: null, error: ERROR_INESPERADO })
  })

  it('un dato ausente sin error se normaliza a null, no a undefined', async () => {
    const c = clienteFalso({ mi_sala: { data: undefined, error: null } })
    await expect(crearSalasApi(c).miSala()).resolves.toEqual({ data: null, error: null })
  })

  it('las claves de error son las que lanza la migración', () => {
    // Recordatorio deliberado: si la base gana un `raise` nuevo, esta lista y
    // las claves `sal.error.*` del diccionario tienen que crecer con él.
    expect(CLAVES_ERROR).toEqual([
      'no_autenticado', 'ya_en_sala', 'saldo_insuficiente', 'sala_no_disponible',
      'sala_llena', 'demasiados_intentos', 'no_eres_anfitrion', 'faltan_jugadores',
      'codigo_invalido',
    ])
    expect(CLAVES_ERROR).not.toContain(ERROR_INESPERADO)
  })
})

describe('SAL-A · suscripciones', () => {
  it('suscribirSala escucha las DOS tablas, filtradas por esa sala', () => {
    const c = clienteFalso()
    crearSalasApi(c).suscribirSala('u1', () => {})
    const canal = c.registro.canales[0]
    expect(canal.nombre).toBe('sala:u1')
    expect(canal.suscrito).toBe(true)
    expect(canal.escuchas.map(e => [e.filtro.table, e.filtro.filter])).toEqual([
      ['salas', 'id=eq.u1'],
      ['sala_jugadores', 'sala_id=eq.u1'],
    ])
  })

  it('suscribirAbiertas escucha SIN filtro, y ésa es la decisión', () => {
    // Un filtro `estado=eq.esperando` dejaría fuera justo el evento que más
    // importa: la sala que SALE de espera y hay que quitar del listado.
    const c = clienteFalso()
    crearSalasApi(c).suscribirAbiertas(() => {})
    const canal = c.registro.canales[0]
    expect(canal.escuchas.every(e => e.filtro.filter === undefined)).toBe(true)
    expect(canal.escuchas.map(e => e.filtro.table)).toEqual(['salas', 'sala_jugadores'])
  })

  it('devuelven una función de BAJA que cierra el canal', () => {
    // Devolver la baja y no el canal es lo que hace que un `useEffect` no pueda
    // olvidarse de cerrarlo: es exactamente lo que sabe devolver.
    const c = clienteFalso()
    const api = crearSalasApi(c)
    const bajaSala = api.suscribirSala('u1', () => {})
    const bajaAbiertas = api.suscribirAbiertas(() => {})
    expect(typeof bajaSala).toBe('function')
    expect(c.registro.bajas).toHaveLength(0)
    bajaSala()
    bajaAbiertas()
    expect(c.registro.bajas).toEqual(c.registro.canales)
  })

  it('el evento de sala llega etiquetado con su tabla', () => {
    // El consumidor tiene que poder distinguir «cambió la sala» de «cambió un
    // asiento» sin adivinar por la forma del payload.
    const c = clienteFalso()
    const vistos = []
    crearSalasApi(c).suscribirSala('u1', (e) => vistos.push(e.tabla))
    for (const escucha of c.registro.canales[0].escuchas) escucha.fn({ eventType: 'UPDATE' })
    expect(vistos).toEqual(['salas', 'sala_jugadores'])
  })

  it('suscribirAbiertas avisa sin payload: el contrato es «vuelve a pedir»', () => {
    const c = clienteFalso()
    const llamadas = []
    crearSalasApi(c).suscribirAbiertas((...args) => llamadas.push(args))
    for (const escucha of c.registro.canales[0].escuchas) escucha.fn({ eventType: 'INSERT' })
    expect(llamadas).toEqual([[], []])
  })
})

describe('SAL-A · el cliente por defecto', () => {
  it('no se llama a createClient: la API usa el singleton', () => {
    // La doctrina de `lib/supabase.js`: dos instancias del SDK sobre el mismo
    // proyecto se pisan la sesión y abren dos sockets de tiempo real, que es
    // justo lo que un PvP no puede permitirse. Si alguien metiera un
    // `createClient` aquí, este import fallaría o abriría un segundo cliente.
    expect(typeof crearSalasApi).toBe('function')
    expect(() => crearSalasApi()).not.toThrow()
  })
})
