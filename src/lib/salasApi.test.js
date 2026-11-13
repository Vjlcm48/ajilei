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

  it('5b · en desarrollo, `?ritmo=rapido` arma la mesa en Rápido (en `dist/` no existe: testDistSinMoldes)', () => {
    vi.stubGlobal('location', { search: '?ritmo=rapido' })
    const c = clienteFalso()
    crearSalasApi(c).crearSala('abierta', 3, 100)
    vi.unstubAllGlobals()
    expect(c.registro.rpc[0].args).toEqual({ p_tipo: 'abierta', p_jugadores: 3, p_apuesta: 100, p_ritmo: 'rapido' })
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

  // ── SAL-B1 · Ajuste A1 · el nuevo camino del código no encontrado ────────
  // Rector: AJILEI_SAL-B1_AjusteA1_v1.0.md §3. La base ya no LANZA cuando un
  // código bien formado no encuentra mesa viva: devuelve NULL, porque un `raise`
  // deshacía la anotación del intento y el límite de cinco por minuto nunca
  // contaba. Esta capa convierte ese NULL en la misma clave de siempre.
  it('unirseSala por CÓDIGO traduce el null de la base a codigo_invalido', async () => {
    const c = clienteFalso({ unirse_sala: { data: null, error: null } })
    await expect(crearSalasApi(c).unirseSala({ codigo: 'AJ-7K2M' }))
      .resolves.toEqual({ data: null, error: 'codigo_invalido' })
  })

  it('unirseSala por ID deja pasar el null tal cual: ahí no hay intento que persistir', async () => {
    // Por id la base sigue lanzando `sala_no_disponible`; un null por ese camino
    // no significa «código malo» y no se disfraza de tal.
    const c = clienteFalso({ unirse_sala: { data: null, error: null } })
    await expect(crearSalasApi(c).unirseSala({ salaId: 'u1' }))
      .resolves.toEqual({ data: null, error: null })
  })

  it('unirseSala por código con sala devuelta no toca nada', async () => {
    const sala = { id: 'u1', codigo: 'AJ-7K2M', estado: 'esperando' }
    const c = clienteFalso({ unirse_sala: { data: sala, error: null } })
    await expect(crearSalasApi(c).unirseSala({ codigo: 'AJ-7K2M' }))
      .resolves.toEqual({ data: sala, error: null })
  })

  it('unirseSala por código con un raise de la base conserva ESA clave', async () => {
    // `demasiados_intentos` sigue siendo un `raise` (§3): el sexto en un minuto
    // tiene que llegar con su propia clave, no disfrazado de código malo.
    const c = clienteFalso({ unirse_sala: { data: null, error: { code: 'P0001', message: 'demasiados_intentos' } } })
    await expect(crearSalasApi(c).unirseSala({ codigo: 'AJ-7K2M' }))
      .resolves.toEqual({ data: null, error: 'demasiados_intentos' })
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

// ── SAL-B1 · El mapa de errores: nueve claves y un genérico ─────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §6.3 y §9.2 («mapa de errores completo, 9
// + desconocido»).
//
// Vive AQUÍ y no en un archivo aparte porque la lista de la que depende
// —`CLAVES_ERROR`— está veinte líneas más arriba: el día que la base gane un
// `raise` nuevo, quien toque la lista se tropieza con estas pruebas.
describe('SAL-B1 · claveDeError', () => {
  it('las nueve claves de la base tienen su texto en el diccionario', async () => {
    const { claveDeError } = await import('./salasApi.js')
    const { TEXTOS_ES } = await import('../config/textos.es.js')

    // El bucle recorre `CLAVES_ERROR`, no una lista escrita a mano: si mañana
    // hay una décima clave y nadie escribe su texto, esto cae. Es el único
    // mecanismo que impide que un error del servidor salga a pantalla como
    // `⟦sal.error.lo_que_sea⟧`.
    for (const clave of CLAVES_ERROR) {
      const claveTexto = claveDeError(clave)
      expect(claveTexto).toBe(`sal.error.${clave}`)
      expect(typeof TEXTOS_ES[claveTexto]).toBe('string')
      expect(TEXTOS_ES[claveTexto].length).toBeGreaterThan(0)
    }
    expect(CLAVES_ERROR).toHaveLength(9)
  })

  it('ninguno de los nueve textos enseña el nombre técnico', async () => {
    const { TEXTOS_ES } = await import('../config/textos.es.js')
    // `sala_llena` es un identificador para el programa. Lo que el jugador tiene
    // que leer es «Esa mesa ya está llena»; una clave filtrada a la pantalla es
    // el defecto que §6.3 nombra con ese ejemplo exacto.
    for (const clave of CLAVES_ERROR) {
      expect(TEXTOS_ES[`sal.error.${clave}`]).not.toContain(clave)
      expect(TEXTOS_ES[`sal.error.${clave}`]).not.toContain('_')
    }
  })

  it('el décimo texto es el genérico, y NO se llama como el estado', async () => {
    const { claveDeError, CLAVE_TEXTO_DESCONOCIDO } = await import('./salasApi.js')
    const { TEXTOS_ES } = await import('../config/textos.es.js')

    // `ERROR_INESPERADO` es `'error_inesperado'` —el nombre del estado— y su
    // texto vive en `sal.error.desconocido`, que es como lo bautizó §6.3. La
    // traducción entre los dos nombres ocurre en `claveDeError` y en ningún otro
    // sitio; esto lo sella.
    expect(CLAVE_TEXTO_DESCONOCIDO).toBe('sal.error.desconocido')
    expect(claveDeError(ERROR_INESPERADO)).toBe(CLAVE_TEXTO_DESCONOCIDO)
    expect(typeof TEXTOS_ES[CLAVE_TEXTO_DESCONOCIDO]).toBe('string')
  })

  it('cualquier cosa que no sea una de las nueve cae al genérico', async () => {
    const { claveDeError } = await import('./salasApi.js')
    // Fabricar `sal.error.<lo que llegue>` sería inventar claves inexistentes y
    // convertir un error del servidor en un `⟦…⟧` en la cara del jugador.
    for (const raro of [null, undefined, '', 'sala_incendiada', 42, {}]) {
      expect(claveDeError(raro)).toBe('sal.error.desconocido')
    }
  })
})

// ── SAL-B1 · Ajuste A2 · La fila de nulos de PostgREST ──────────────────────
// Rector: AJILEI_SAL-B1_AjusteA2_v1.0.md §3. EL MOCK IMITA A POSTGREST, NO A
// SQL: una función que `returns public.salas` y devuelve `null` llega al
// cliente como un objeto con todas las columnas en null, porque PostgREST la
// llama con `select * from f()` y Postgres expande el compuesto nulo en una
// fila de nulos. Es lo que dos teléfonos tomaron por mesa el 2026-09-11.
describe('SAL-B1 A2 · la fila de nulos', () => {
  const filaDeNulos = () => ({
    id: null, codigo: null, tipo: null, jugadores: null, apuesta: null,
    anfitrion_id: null, estado: null, creada_en: null, expira_en: null,
    iniciada_en: null, estado_partida: null,
  })
  const mesa = () => ({ id: 'u1', codigo: 'AJ-7K2M', tipo: 'privada', jugadores: 4, apuesta: 200, estado: 'esperando' })
  // La traza `console.log` de A2 se retiró en la ficha de commits (§0.6), y con
  // ella las aserciones que la medían. Lo que queda aquí es la conducta.

  it('esMesa: sólo un objeto con id es una mesa', async () => {
    const { esMesa } = await import('./salasApi.js')
    expect(esMesa(mesa())).toBe(true)
    for (const no of [null, undefined, filaDeNulos(), {}, { id: undefined }, 'u1', 42, []]) {
      expect(esMesa(no)).toBe(false)
    }
  })

  it('unirseSala por CÓDIGO con la fila de nulos → codigo_invalido', async () => {
    const c = clienteFalso({ unirse_sala: { data: filaDeNulos(), error: null } })
    await expect(crearSalasApi(c).unirseSala({ codigo: 'AJ-ZZZZ' }))
      .resolves.toEqual({ data: null, error: 'codigo_invalido' })
  })

  it('miSala con la fila de nulos → null', async () => {
    const c = clienteFalso({ mi_sala: { data: filaDeNulos(), error: null } })
    await expect(crearSalasApi(c).miSala()).resolves.toEqual({ data: null, error: null })
  })

  it('un null de verdad también es «sin mesa»', async () => {
    const c = clienteFalso({ mi_sala: { data: null, error: null } })
    await expect(crearSalasApi(c).miSala()).resolves.toEqual({ data: null, error: null })
  })

  it('una fila CON id pasa intacta por las cinco', async () => {
    const respuestas = {}
    for (const fn of ['crear_sala', 'unirse_sala', 'jugar_ya', 'resolver_sala', 'mi_sala']) {
      respuestas[fn] = { data: mesa(), error: null }
    }
    const api = crearSalasApi(clienteFalso(respuestas))
    for (const llamada of [
      api.crearSala('privada', 4, 200),
      api.unirseSala({ codigo: 'AJ-7K2M' }),
      api.unirseSala({ salaId: 'u1' }),
      api.jugarYa('u1'),
      api.resolverSala('u1'),
      api.miSala(),
    ]) {
      await expect(llamada).resolves.toEqual({ data: mesa(), error: null })
    }
  })

  it('unirseSala por ID con la fila de nulos → null sin error (lo que ya hacía con null)', async () => {
    const c = clienteFalso({ unirse_sala: { data: filaDeNulos(), error: null } })
    await expect(crearSalasApi(c).unirseSala({ salaId: 'u1' }))
      .resolves.toEqual({ data: null, error: null })
  })

  it('un raise de la base sigue ganando a la normalización', async () => {
    const c = clienteFalso({ mi_sala: { data: null, error: { code: 'P0001', message: 'no_autenticado' } } })
    await expect(crearSalasApi(c).miSala()).resolves.toEqual({ data: null, error: 'no_autenticado' })
  })
})

// ── SAL-B2 · asientosDe: los sentados con su nombre, sin SQL ────────────────
// Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §4. Lo que se sella es la FRONTERA: qué
// consulta se manda (tabla, columnas con la incrustación, filtro, orden) y en
// qué se convierte lo que vuelve. La RLS que lo permite vive en la base y la
// documenta el informe de Fase 0 §2.3.
describe('SAL-B2 · asientosDe', () => {
  // Un cliente con `from(...).select(...).eq(...).order(...)` que registra la
  // cadena entera y responde con lo que el caso quiera. Distinto de
  // `clienteFalso` porque aquél no tiene tabla: `asientosDe` no pasa por `rpc`.
  function clienteConTabla(respuesta = { data: [], error: null }) {
    const registro = {}
    const cadena = {
      select(columnas, opciones) { registro.select = { columnas, opciones }; return cadena },
      eq(columna, valor) { registro.eq = { columna, valor }; return cadena },
      order(columna) { registro.order = columna; return cadena },
      then(fn) { return Promise.resolve(respuesta).then(fn) },
    }
    return {
      registro,
      from(tabla) { registro.from = tabla; return cadena },
      rpc() { return Promise.resolve({ data: null, error: null }) },
      channel() { return { on() { return this }, subscribe() { return this } } },
      removeChannel() {},
    }
  }

  it('manda la consulta con la incrustación de profiles, filtrada y ordenada por asiento', async () => {
    const c = clienteConTabla()
    await crearSalasApi(c).asientosDe('u1')
    expect(c.registro.from).toBe('sala_jugadores')
    expect(c.registro.select.columnas).toBe('asiento, jugador_id, profiles(username)')
    expect(c.registro.eq).toEqual({ columna: 'sala_id', valor: 'u1' })
    expect(c.registro.order).toBe('asiento')
  })

  it('devuelve la forma del cliente: asiento, jugadorId, username', async () => {
    const c = clienteConTabla({
      data: [
        { asiento: 0, jugador_id: 'a', profiles: { username: 'carlos_vzla' } },
        { asiento: 1, jugador_id: 'b', profiles: { username: 'maria_ccs' } },
      ],
      error: null,
    })
    await expect(crearSalasApi(c).asientosDe('u1')).resolves.toEqual({
      data: [
        { asiento: 0, jugadorId: 'a', username: 'carlos_vzla' },
        { asiento: 1, jugadorId: 'b', username: 'maria_ccs' },
      ],
      error: null,
    })
  })

  it('el orden lo pide la consulta; la capa no reordena ni pierde filas', async () => {
    // Si PostgREST devolviera desordenado (no lo hace con `order`), la capa lo
    // pasa tal cual: reordenar aquí escondería un `order` que dejó de mandarse.
    const c = clienteConTabla({
      data: [
        { asiento: 2, jugador_id: 'c', profiles: { username: 'ana_bcn' } },
        { asiento: 0, jugador_id: 'a', profiles: { username: 'carlos_vzla' } },
      ],
      error: null,
    })
    const { data } = await crearSalasApi(c).asientosDe('u1')
    expect(data.map((f) => f.asiento)).toEqual([2, 0])
  })

  it('una incrustación ausente da username null, no un error', async () => {
    const c = clienteConTabla({
      data: [
        { asiento: 0, jugador_id: 'a', profiles: null },
        { asiento: 1, jugador_id: 'b' },
        // Y si un día llegara como array de uno, también se lee.
        { asiento: 2, jugador_id: 'c', profiles: [{ username: 'luis_mia' }] },
      ],
      error: null,
    })
    const { data, error } = await crearSalasApi(c).asientosDe('u1')
    expect(error).toBeNull()
    expect(data.map((f) => f.username)).toEqual([null, null, 'luis_mia'])
  })

  it('sin filas devuelve un array vacío, nunca null', async () => {
    const c = clienteConTabla({ data: null, error: null })
    await expect(crearSalasApi(c).asientosDe('u1')).resolves.toEqual({ data: [], error: null })
  })

  it('un error del SDK pasa por la misma traducción que el resto', async () => {
    const c = clienteConTabla({ data: null, error: { code: '42501', message: 'permission denied' } })
    await expect(crearSalasApi(c).asientosDe('u1')).resolves.toEqual({ data: null, error: ERROR_INESPERADO })
    expect(avisos).toHaveBeenCalledTimes(1)
  })
})

// ── SAL-B2 F1b · leerSala: la fila de mi sala, en el estado que esté ────────
// Rector: AJILEI_SAL-B2_Fase1b_v1.0.md §3.2. Misma frontera que `asientosDe`:
// qué consulta se manda y en qué se convierte lo que vuelve.
describe('SAL-B2 · leerSala', () => {
  function clienteConSalas(respuesta = { data: null, error: null }) {
    const registro = {}
    const cadena = {
      select(columnas) { registro.select = columnas; return cadena },
      eq(columna, valor) { registro.eq = { columna, valor }; return cadena },
      maybeSingle() { registro.maybeSingle = true; return cadena },
      then(fn) { return Promise.resolve(respuesta).then(fn) },
    }
    return {
      registro,
      from(tabla) { registro.from = tabla; return cadena },
      rpc() { return Promise.resolve({ data: null, error: null }) },
      channel() { return { on() { return this }, subscribe() { return this } } },
      removeChannel() {},
    }
  }

  it('lee la fila entera de salas por id, una como mucho', async () => {
    const c = clienteConSalas()
    await crearSalasApi(c).leerSala('u1')
    expect(c.registro.from).toBe('salas')
    expect(c.registro.select).toBe('*')
    expect(c.registro.eq).toEqual({ columna: 'id', valor: 'u1' })
    expect(c.registro.maybeSingle).toBe(true)
  })

  it('devuelve la fila tal cual, en cualquier estado', async () => {
    const fila = { id: 'u1', estado: 'cancelada', jugadores: 4, expira_en: '2026-09-11T12:00:00+00:00' }
    const c = clienteConSalas({ data: fila, error: null })
    await expect(crearSalasApi(c).leerSala('u1')).resolves.toEqual({ data: fila, error: null })
  })

  it('sin fila —o con una sin id— es null, no una mesa', async () => {
    await expect(crearSalasApi(clienteConSalas({ data: null, error: null })).leerSala('u1'))
      .resolves.toEqual({ data: null, error: null })
    await expect(crearSalasApi(clienteConSalas({ data: { id: null, estado: null }, error: null })).leerSala('u1'))
      .resolves.toEqual({ data: null, error: null })
  })

  it('un error del SDK se traduce como el resto', async () => {
    const c = clienteConSalas({ data: null, error: { code: '42501', message: 'permission denied' } })
    await expect(crearSalasApi(c).leerSala('u1')).resolves.toEqual({ data: null, error: ERROR_INESPERADO })
    expect(avisos).toHaveBeenCalledTimes(1)
  })
})
