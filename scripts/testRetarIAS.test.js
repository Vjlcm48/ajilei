// ── APU-1 1e · «Retar a las IAS» y la política de memoria compartida ────────
// Rector: AJILEI_APU-1_Fase1e_v1.0.md §2.1, §2.2 y §2.5.
//
// Lo que se sella aquí son las REGLAS de la pantalla, no su pintura: este
// proyecto no tiene jsdom (FRZ-1), así que el JSX lo mide el arnés y la decisión
// la mide Vitest. Por eso `RetarIAS.jsx` es una cáscara y `retarCore.js` tiene
// todo lo que se puede equivocar.

import { describe, it, expect } from 'vitest'

import { proyectar, crearMemoria } from '../src/config/memoriaChips.js'
import {
  CLAVE_RETO, CLAVE_RETO_LEGADO, JUGADORES_IA, CONFIG_RETO_DEFECTO, ORDEN_FILAS,
  MOTIVO_SIN_SALDO, MEMORIA_RETO,
  normalizarReto, alcanzaMesa, elegir, filaHabilitada, listo, hayComodin,
  opcionesReto, opcionesJugadores, opcionesApuesta, opcionesEntrada,
  topeEntrada, idEntrada, pasoEntrada, entradaDeLaSesion, pilaDeCadaIA,
} from '../src/screens/retarCore.js'
import { CLAVE_CONFIG_SALA } from '../src/config/salas.js'
import { normalizarConfig } from '../src/screens/salasCore.js'
import { pisoDe, medioDe, techoDe, pilaIA, MOTIVOS_ENTRADA } from '../src/engine/entrada.js'
import { apuestasDe, NIVELES } from '../src/config/niveles.js'

// Un almacén de mentira, del mismo tamaño que el contrato: tres métodos. Es lo
// que permite probar la memoria sin navegador — y, de paso, lo que probaría que
// el día que el almacén sea otro (una tabla de Supabase) el resto no se entera.
function almacenFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial))
  return {
    datos,
    leer: (k) => (datos.has(k) ? datos.get(k) : null),
    escribir: (k, v) => datos.set(k, v),
    borrar: (k) => datos.delete(k),
  }
}

// Un almacén que se niega a todo, como una ventana privada.
const almacenDenegado = {
  leer() { throw new Error('denegado') },
  escribir() { throw new Error('denegado') },
  borrar() { throw new Error('denegado') },
}

describe('1. La política de memoria (§2.1 · L-6 / K-3a)', () => {
  it('`proyectar` se queda con los campos declarados y tira el resto', () => {
    expect(proyectar({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('un campo nulo o ausente no se siembra', () => {
    expect(proyectar({ a: 1, b: null }, ['a', 'b', 'z'])).toEqual({ a: 1 })
  })

  it('PvP recuerda las TRES decisiones', () => {
    const almacen = almacenFalso()
    const memoria = crearMemoria({
      clave: CLAVE_CONFIG_SALA,
      campos: ['jugadores', 'apuesta', 'tipo'],
      normalizar: normalizarConfig,
      almacen,
    })
    memoria.guardar({ jugadores: 4, apuesta: 500, tipo: 'abierta' })
    expect(JSON.parse(almacen.leer(CLAVE_CONFIG_SALA)))
      .toEqual({ jugadores: 4, apuesta: 500, tipo: 'abierta' })
  })

  it('vs IAS recuerda reto, jugadores y apuesta — y JAMÁS la entrada', () => {
    const almacen = almacenFalso()
    const memoria = crearMemoria({
      clave: CLAVE_RETO, campos: ['reto', 'jugadores', 'apuesta'],
      normalizar: normalizarReto, almacen,
    })
    memoria.guardar({ reto: 'pro', jugadores: 5, apuesta: 400, entrada: 20000 })
    const guardado = JSON.parse(almacen.leer(CLAVE_RETO))
    expect(guardado).toEqual({ reto: 'pro', jugadores: 5, apuesta: 400 })
    expect(guardado.entrada).toBeUndefined()
  })

  it('y lo que no se guardó no vuelve: la entrada nace sin elegir en cada visita', () => {
    const almacen = almacenFalso()
    const memoria = crearMemoria({
      clave: CLAVE_RETO, campos: ['reto', 'jugadores', 'apuesta'],
      normalizar: normalizarReto, almacen,
    })
    memoria.guardar({ reto: 'pro', jugadores: 5, apuesta: 400, entrada: 20000 })
    expect(memoria.leer(Infinity).entrada).toBeUndefined()
    expect(listo(memoria.leer(Infinity))).toBe(false)
  })

  it('`ajilei.nivel` se absorbe UNA vez y se borra', () => {
    const almacen = almacenFalso({ [CLAVE_RETO_LEGADO]: 'avanzado' })
    const memoria = crearMemoria({
      clave: CLAVE_RETO, campos: ['reto', 'jugadores', 'apuesta'],
      normalizar: normalizarReto, almacen,
      legado: { clave: CLAVE_RETO_LEGADO, campo: 'reto' },
    })
    expect(memoria.leer(Infinity).reto).toBe('avanzado')
    expect(almacen.leer(CLAVE_RETO_LEGADO)).toBe(null)
  })

  it('la clave nueva MANDA sobre la vieja, que igualmente se borra', () => {
    const almacen = almacenFalso({
      [CLAVE_RETO]: JSON.stringify({ reto: 'pro' }),
      [CLAVE_RETO_LEGADO]: 'basico',
    })
    const memoria = crearMemoria({
      clave: CLAVE_RETO, campos: ['reto', 'jugadores', 'apuesta'],
      normalizar: normalizarReto, almacen,
      legado: { clave: CLAVE_RETO_LEGADO, campo: 'reto' },
    })
    expect(memoria.leer(Infinity).reto).toBe('pro')
    expect(almacen.leer(CLAVE_RETO_LEGADO)).toBe(null)
  })

  it('basura en la clave cae al defecto sin lanzar ni ensuciar la consola', () => {
    const almacen = almacenFalso({ [CLAVE_RETO]: '{no soy json' })
    const memoria = crearMemoria({
      clave: CLAVE_RETO, campos: ['reto'], normalizar: normalizarReto, almacen,
    })
    expect(memoria.leer(Infinity)).toEqual({ ...CONFIG_RETO_DEFECTO })
  })

  it('un almacenamiento denegado no tumba la pantalla', () => {
    const memoria = crearMemoria({
      clave: CLAVE_RETO, campos: ['reto'], normalizar: normalizarReto,
      almacen: {
        leer: () => { try { return almacenDenegado.leer() } catch { return null } },
        escribir: () => {},
        borrar: () => {},
      },
    })
    expect(() => memoria.guardar({ reto: 'pro' })).not.toThrow()
    expect(memoria.leer(Infinity)).toEqual({ ...CONFIG_RETO_DEFECTO })
  })

  it('la memoria real de la pantalla declara la clave y los campos de §2.2', () => {
    expect(MEMORIA_RETO.clave).toBe('ajilei.retoConfig')
    expect(MEMORIA_RETO.campos).toEqual(['reto', 'jugadores', 'apuesta'])
    expect(MEMORIA_RETO.campos).not.toContain('entrada')
  })
})

describe('2. Lo guardado, pasado por sus guardas', () => {
  it('sin nada guardado → Básico y las otras dos SIN decidir', () => {
    expect(normalizarReto(null)).toEqual({ reto: NIVELES[0].id, jugadores: null, apuesta: null })
  })

  it('un reto desconocido cae a Básico', () => {
    expect(normalizarReto({ reto: 'imposible' }).reto).toBe('basico')
  })

  it('una apuesta que no es del reto resultante no sobrevive', () => {
    // 1000 es de Pro. Si el reto cae a Básico, la apuesta no puede quedarse.
    expect(normalizarReto({ reto: 'basura', apuesta: 1000 }).apuesta).toBe(null)
  })

  it('una apuesta del reto sí sobrevive', () => {
    expect(normalizarReto({ reto: 'pro', apuesta: 1000 }, Infinity).apuesta).toBe(1000)
  })

  it('una apuesta fuera del bolsillo no se preselecciona', () => {
    // Pro 1000 pide 5.000 de piso; con 4.000 no se puede sentar.
    expect(normalizarReto({ reto: 'pro', apuesta: 1000 }, 4000).apuesta).toBe(null)
  })

  it('un tamaño de mesa fuera de rango no se cuela', () => {
    expect(normalizarReto({ jugadores: 9 }).jugadores).toBe(null)
    expect(normalizarReto({ jugadores: 1 }).jugadores).toBe(null)
    expect(normalizarReto({ jugadores: 3 }).jugadores).toBe(3)
  })

  it('los cuatro tamaños son los que el motor admite', () => {
    expect(JUGADORES_IA).toEqual([2, 3, 4, 5])
  })
})

describe('3. La cascada de §2.2', () => {
  const lleno = { reto: 'pro', jugadores: 5, apuesta: 400, entrada: 2000 }

  it('el orden de las filas es reto → jugadores → apuesta → entrada', () => {
    expect(ORDEN_FILAS).toEqual(['reto', 'jugadores', 'apuesta', 'entrada'])
  })

  // E-6, sellada por Victor: el reto limpia lo que DEPENDE de él —la apuesta sale
  // de `apuestasDe(reto)` y la entrada de la apuesta— y respeta lo que no —el
  // tamaño de la mesa—. Curiosear los tres retos no cuesta volver a elegir mesa.
  it('cambiar el reto limpia apuesta y entrada, y CONSERVA los jugadores', () => {
    expect(elegir(lleno, 'reto', 'basico'))
      .toEqual({ reto: 'basico', jugadores: 5, apuesta: null, entrada: null })
  })

  it('ir y volver entre dos retos deja la mesa donde estaba', () => {
    const ida = elegir(lleno, 'reto', 'basico')
    expect(elegir(ida, 'reto', 'pro').jugadores).toBe(5)
  })

  it('cambiar los jugadores limpia apuesta y entrada, no el reto', () => {
    expect(elegir(lleno, 'jugadores', 2))
      .toEqual({ reto: 'pro', jugadores: 2, apuesta: null, entrada: null })
  })

  it('cambiar la apuesta limpia sólo la entrada', () => {
    expect(elegir(lleno, 'apuesta', 200))
      .toEqual({ reto: 'pro', jugadores: 5, apuesta: 200, entrada: null })
  })

  it('elegir la entrada no limpia nada', () => {
    expect(elegir(lleno, 'entrada', 1000)).toEqual({ ...lleno, entrada: 1000 })
  })

  it('un campo que no es fila devuelve la misma configuración', () => {
    expect(elegir(lleno, 'tipo', 'abierta')).toBe(lleno)
  })

  it('una fila se habilita cuando todas las de arriba están decididas', () => {
    const vacio = { reto: 'basico', jugadores: null, apuesta: null, entrada: null }
    expect(filaHabilitada(vacio, 'reto')).toBe(true)
    expect(filaHabilitada(vacio, 'jugadores')).toBe(true)
    expect(filaHabilitada(vacio, 'apuesta')).toBe(false)
    expect(filaHabilitada(vacio, 'entrada')).toBe(false)
    expect(filaHabilitada({ ...vacio, jugadores: 4 }, 'apuesta')).toBe(true)
  })

  it('el CTA sólo se enciende con las cuatro puestas', () => {
    expect(listo(lleno)).toBe(true)
    expect(listo({ ...lleno, entrada: null })).toBe(false)
    expect(listo({ ...lleno, jugadores: null })).toBe(false)
  })
})

describe('4. Las cuatro filas, como datos', () => {
  it('la fila de reto son los tres niveles, en su orden de contrato', () => {
    expect(opcionesReto().map((o) => o.id)).toEqual(['basico', 'avanzado', 'pro'])
  })

  it('la nota de comodín es la de ModeSelect: mesas de 4 y 5', () => {
    expect(opcionesJugadores().map((o) => o.comodin)).toEqual([false, false, true, true])
    expect(hayComodin(3)).toBe(false)
    expect(hayComodin(4)).toBe(true)
  })

  it('las cuatro mesas salen de la tabla del reto, nunca de un literal', () => {
    expect(opcionesApuesta('avanzado', Infinity).map((o) => o.id)).toEqual(apuestasDe('avanzado'))
  })

  it('una mesa va en gris cuando el saldo no cubre su PISO, no su apuesta', () => {
    // Básico: 50 · 100 · 150 · 250. Pisos 10× (1f-A4): 500 · 1.000 · 1.500 · 2.500.
    const filas = opcionesApuesta('basico', 1200)
    expect(filas.map((o) => o.disabled)).toEqual([false, false, true, true])
    // Y lleva escrito cuánto hace falta, derivado y no a mano.
    expect(filas[2].minimo).toBe(pisoDe(150))
  })

  it('el alcance es el piso 10×, coherente con `entrada.pisoDe`', () => {
    expect(alcanzaMesa(250, 2500)).toBe(true)
    expect(alcanzaMesa(250, 2499)).toBe(false)
  })

  it('los tres montos con nombre salen de `entrada.js`', () => {
    const e = opcionesEntrada(100, Infinity)
    expect(e.map((o) => o.monto)).toEqual([pisoDe(100), medioDe(100), techoDe(100), null])
    expect(e.map((o) => o.id)).toEqual(['piso', 'medio', 'techo', 'otra'])
  })

  it('el techo de la sesión es el menor entre el de la mesa y el bolsillo', () => {
    expect(topeEntrada(100, Infinity)).toBe(techoDe(100))   // 5.000
    expect(topeEntrada(100, 5000)).toBe(5000)
    expect(topeEntrada(100, 2350)).toBe(2300)               // cuantizado a la apuesta
    expect(topeEntrada(250, 5000)).toBe(5000)               // techo 12.500 > bolsillo
  })

  it('sin mesa elegida la fila sigue teniendo sus CUATRO chips, apagados', () => {
    // La caja se reserva con los chips puestos: una lista vacía dejaba la fila
    // sin un botón y, al elegir mesa, aparecían cuatro de golpe empujando el CTA.
    const e = opcionesEntrada(0, 5000)
    expect(e.map((o) => o.id)).toEqual(['piso', 'medio', 'techo', 'otra'])
    expect(e.every((o) => o.disabled)).toBe(true)
    expect(e.every((o) => o.monto === null)).toBe(true)
  })

  it('con el bolsillo justo para el piso, sólo el mínimo queda encendido', () => {
    const e = opcionesEntrada(100, 1000)
    expect(e.map((o) => o.disabled)).toEqual([false, true, true, true])
  })

  it('«Otra…» se apaga cuando no queda un múltiplo entre el piso y el tope', () => {
    expect(opcionesEntrada(100, 1000).find((o) => o.id === 'otra').disabled).toBe(true)
    expect(opcionesEntrada(100, 1100).find((o) => o.id === 'otra').disabled).toBe(false)
  })

  it('el chip que se enciende lo decide el MONTO, no el camino', () => {
    expect(idEntrada(null, 100)).toBe(null)
    expect(idEntrada(1000, 100)).toBe('piso')
    expect(idEntrada(2000, 100)).toBe('medio')
    expect(idEntrada(5000, 100)).toBe('techo')
    expect(idEntrada(700, 100)).toBe('otra')
  })

  it('el contador se mueve de apuesta en apuesta y nunca sale del rango', () => {
    expect(pasoEntrada(null, 100, 5000, +1)).toBe(1100)  // arranca en el piso
    expect(pasoEntrada(1000, 100, 5000, -1)).toBe(1000)  // no baja del piso
    expect(pasoEntrada(5000, 100, 5000, +1)).toBe(5000)  // no sube del tope
    expect(pasoEntrada(2300, 100, 2350, +1)).toBe(2300)  // tope por bolsillo
  })
})

describe('5. La entrada, validada contra la sesión', () => {
  it('lo que `entrada.js` ya juzga sigue juzgándolo', () => {
    expect(entradaDeLaSesion(450, 100, Infinity).motivo).toBe(MOTIVOS_ENTRADA.MONTO_INVALIDO)
    expect(entradaDeLaSesion(400, 100, Infinity).motivo).toBe(MOTIVOS_ENTRADA.BAJO_PISO)
    expect(entradaDeLaSesion(5100, 100, Infinity).motivo).toBe(MOTIVOS_ENTRADA.SOBRE_TECHO)
    expect(entradaDeLaSesion(1500, 100, Infinity)).toEqual({ ok: true, motivo: null })
  })

  it('y la pantalla añade el motivo que el motor no puede juzgar: el bolsillo', () => {
    expect(entradaDeLaSesion(3000, 100, 2000).motivo).toBe(MOTIVO_SIN_SALDO)
    expect(entradaDeLaSesion(2000, 100, 2000).ok).toBe(true)
  })

  it('el orden manda: un monto ilegal se rechaza por ilegal, no por saldo', () => {
    expect(entradaDeLaSesion(450, 100, 10).motivo).toBe(MOTIVOS_ENTRADA.MONTO_INVALIDO)
  })
})

describe('6. Lo que el aviso de la cuarta fila promete', () => {
  it('la pila de cada IA sale de `entrada.pilaIA`, no de una copia', () => {
    expect(pilaDeCadaIA(2500, 100)).toBe(pilaIA(2500, 100))
    expect(pilaDeCadaIA(2500, 100)).toBe(3750)
  })

  it('el ejemplo del normativo §2.3: entrar al techo sienta a las IAS igual', () => {
    expect(pilaDeCadaIA(5000, 100)).toBe(5000)
  })

  it('sin entrada elegida no hay promesa que enseñar', () => {
    expect(pilaDeCadaIA(null, 100)).toBe(null)
  })
})
