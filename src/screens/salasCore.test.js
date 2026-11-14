import { describe, it, expect } from 'vitest'
import {
  CONFIG_POR_DEFECTO,
  LARGO_CODIGO,
  alcanza,
  arranqueDeSesion,
  buscarCombinacion,
  codigoListo,
  faltanPara,
  filtrarCodigo,
  fueraDelAlcanceDeNuevos,
  normalizarConfig,
  normalizarMesa,
  ordenarMesas,
  otraMesaAlAlcance,
} from './salasCore.js'
import { ALFABETO_CODIGO, APUESTAS_PVP, BONO_BIENVENIDA, JUGADORES_PVP } from '../config/salas.js'

// ── SAL-B1 · La semántica de las dos pantallas ──────────────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §9.2, que enumera lo que hay que sellar:
// la máscara del código, el orden de las mesas, el cálculo de «Te faltan» y la
// guarda de §4.4.
//
// Se prueba el NÚCLEO y no las pantallas, y no es un atajo: el proyecto no tiene
// jsdom (hallazgo de FRZ-1), así que montar un `.jsx` en Vitest no es posible.
// Por eso todo lo que estas pruebas cubren vive fuera del JSX — que es la razón
// de que `salasCore.js` exista.
//
// El saldo entra por parámetro en todas: ninguna lee la billetera, de modo que
// el saldo real de ECO-1 (1b) no cambió ninguna de estas pruebas.

describe('SAL-B1 · la máscara del código', () => {
  it('deja pasar el alfabeto sellado entero', () => {
    // Carácter a carácter contra `ALFABETO_CODIGO`, que es la misma cadena que
    // el `check` de la base. Si alguien quitara una letra de una de las dos,
    // esto lo dice.
    for (const c of ALFABETO_CODIGO) {
      expect(filtrarCodigo(c)).toBe(c)
    }
  })

  it('se traga O, 0, I y 1 — los cuatro que no se emiten nunca', () => {
    // Son los dos pares que se confunden a la vista, y por eso salieron de la
    // baraja. Aceptarlos sería prometer una búsqueda que la base no puede
    // satisfacer, porque ningún código emitido los lleva.
    expect(filtrarCodigo('O0I1')).toBe('')
    expect(filtrarCodigo('7O2K')).toBe('72K')
    expect(filtrarCodigo('0I')).toBe('')
  })

  it('sube a mayúsculas y tira lo que no es del alfabeto', () => {
    expect(filtrarCodigo('7k2m')).toBe('7K2M')
    expect(filtrarCodigo('7-k 2#m')).toBe('7K2M')
    expect(filtrarCodigo('  ')).toBe('')
  })

  it('corta a cuatro y ni uno más', () => {
    expect(filtrarCodigo('7K2M9')).toBe('7K2M')
    expect(filtrarCodigo('ABCDEFGH')).toBe('ABCD')
    expect(filtrarCodigo('7K2M9').length).toBe(LARGO_CODIGO)
  })

  it('el prefijo pegado NO se descuenta aquí', () => {
    // `AJ` son dos caracteres válidos del alfabeto, así que pegar `AJ7K2M` en el
    // campo entra como `AJ7K`. Es el precio de tener el `AJ-` dibujado FUERA del
    // campo, que es lo que la lámina selló; quien distingue prefijo de cuerpo es
    // `normalizarCodigo`, y lo hace por longitud. Se sella el comportamiento
    // para que nadie lo "arregle" comiéndose las dos primeras letras de un
    // código legítimo que empiece por AJ.
    expect(filtrarCodigo('AJ-7K2M')).toBe('AJ7K')
  })

  it('«Entrar» sólo se enciende con cuatro exactos', () => {
    expect(codigoListo('')).toBe(false)
    expect(codigoListo('7K2')).toBe(false)
    expect(codigoListo('7K2M')).toBe(true)
    expect(codigoListo(null)).toBe(false)
  })
})

describe('SAL-B1 · la entrada Corta y el «Te faltan»', () => {
  it('alcanza exige QUINCE veces la apuesta, no una', () => {
    expect(alcanza(100, 1499)).toBe(false)
    expect(alcanza(100, 1500)).toBe(true)   // el borde exacto entra
    expect(alcanza(100, 1501)).toBe(true)
    expect(alcanza(100, 1500, 'corta')).toBe(true)
  })

  it('MES-PvP 7b · con la Llena, CINCUENTA veces; y el «Te faltan» cuenta con ella', () => {
    expect(alcanza(100, 4999, 'llena')).toBe(false)
    expect(alcanza(100, 5000, 'llena')).toBe(true)   // el borde exacto entra
    expect(alcanza(5000, 75000, 'llena')).toBe(false) // lo que alcanza la Corta, no
    expect(alcanza(5000, Infinity, 'llena')).toBe(true)
    expect(faltanPara(200, 5000, 'llena')).toBe(5000)
    expect(faltanPara(5000, 5000, 'llena')).toBe(245000)
    expect(faltanPara(100, 5000, 'llena')).toBe(0)
  })

  it('MES-PvP 7b · el listado ordena cada mesa con SU entrada', () => {
    // Saldo 5.000: la Llena de 200 (10.000) baja al final aunque la Corta de 200 (3.000) no.
    const orden = ordenarMesas([
      { id: 'llena', jugadores: 4, apuesta: 200, sentados: 3, entrada: 'llena' },
      { id: 'corta', jugadores: 4, apuesta: 200, sentados: 1 },
    ], 5000)
    expect(orden.map((m) => m.id)).toEqual(['corta', 'llena'])
  })

  it('un saldo que no es número no alcanza nada', () => {
    // Un `null` o un `NaN` es un fallo de quien llama, no un saldo por llegar:
    // los botones nacen apagados en vez de encendidos por accidente.
    expect(alcanza(100, undefined)).toBe(false)
    expect(alcanza(100, NaN)).toBe(false)
    expect(alcanza(100, null)).toBe(false)
  })

  it('ECO-1b · Infinity es «todavía no se sabe»: no se juzga', () => {
    // Mientras la billetera no contesta, las pantallas pasan `Infinity`
    // (`billeteraCore.SIN_JUICIO`): nada se apaga, nada se atenúa y no hay
    // «Te faltan». Decide el servidor.
    expect(alcanza(5000, Infinity)).toBe(true)
    expect(faltanPara(5000, Infinity)).toBe(0)
    const orden = ordenarMesas([
      { id: 'a', jugadores: 2, apuesta: 5000, sentados: 1 },
      { id: 'b', jugadores: 2, apuesta: 100, sentados: 1 },
    ], Infinity)
    expect(orden.map((m) => m.id)).toEqual(['b', 'a'])
    expect(normalizarConfig({ jugadores: 5, apuesta: 5000, tipo: 'abierta' }, Infinity).apuesta).toBe(5000)
  })

  it('5.000 de saldo, mesa de 5.000 → faltan 70.000', () => {
    // El estado `opciones-fuera-alcance` del arnés (§8.3), con la Corta de MOT-1:
    // 15 × 5.000 = 75.000, menos los 5.000 que hay, son 70.000.
    expect(faltanPara(5000, 5000)).toBe(70000)
  })

  it('nunca es negativo: a quien le sobra no le falta', () => {
    expect(faltanPara(100, 5000)).toBe(0)
    expect(faltanPara(100, 1500)).toBe(0)
  })
})

describe('SAL-B1 · el orden del listado', () => {
  const mesa = (id, jugadores, apuesta, sentados) => ({
    id, jugadores, apuesta, sentados, expira_en: '2026-09-07T12:00:00Z',
  })

  it('más llenas primero; a igual llenado, la apuesta menor', () => {
    const orden = ordenarMesas([
      mesa('a', 4, 1000, 1),
      mesa('b', 4, 200, 3),
      mesa('c', 5, 500, 1),
      mesa('d', 2, 100, 1),
    ], 5000)
    expect(orden.map((m) => m.id)).toEqual(['b', 'd', 'c', 'a'])
  })

  it('las que no alcanzo van AL FINAL, aunque estén más llenas', () => {
    // La de 5.000 tiene cuatro sentados y sería la primera por llenado; el saldo
    // la manda al fondo. Es §3.3, y es lo que hace que la ventanilla de tres
    // enseñe mesas a las que uno puede sentarse.
    const orden = ordenarMesas([
      mesa('rica', 5, 5000, 4),
      mesa('pobre', 2, 100, 1),
    ], 5000)
    expect(orden.map((m) => m.id)).toEqual(['pobre', 'rica'])
  })

  it('dentro del grupo de fuera de alcance también se ordena', () => {
    const orden = ordenarMesas([
      mesa('x', 4, 5000, 1),
      mesa('y', 4, 2000, 3),
      mesa('z', 4, 100, 0),
    ], 1500)
    expect(orden.map((m) => m.id)).toEqual(['z', 'y', 'x'])
  })

  it('un `sentados` que llegara como cadena no invierte el orden', () => {
    // `count(*)` es `bigint`. Hoy PostgREST lo entrega como número, pero
    // `'3' > '10'` es `true` en JS y esa comparación pondría la mesa más vacía
    // arriba sin un solo error en consola. `Number()` en `normalizarMesa` es lo
    // que lo impide, y esto es lo que lo comprueba.
    const orden = ordenarMesas([
      { id: 'tres', jugadores: 5, apuesta: 100, sentados: '3' },
      { id: 'diez', jugadores: 5, apuesta: 100, sentados: '10' },
    ], 5000)
    expect(orden.map((m) => m.id)).toEqual(['diez', 'tres'])
  })

  it('no revienta con basura ni con ausencia', () => {
    expect(ordenarMesas(null, 5000)).toEqual([])
    expect(ordenarMesas(undefined, 5000)).toEqual([])
    expect(ordenarMesas([], 5000)).toEqual([])
  })

  it('normalizarMesa traduce `expira_en` sin perderlo', () => {
    // En B1 nadie lo pinta —la tarjeta no lleva cronómetro— pero viaja, porque
    // es lo que B2 necesita para el latido y perderlo aquí obligaría a B2 a
    // volver a tocar este archivo.
    expect(normalizarMesa({ id: 'u', jugadores: 4, apuesta: 200, sentados: 2, expira_en: 'X' }))
      .toEqual({ id: 'u', jugadores: 4, apuesta: 200, sentados: 2, expiraEn: 'X', entrada: 'corta' })
  })

  it('MES-PvP 7b · normalizarMesa lleva la entrada; la que falta o no existe es Corta', () => {
    // `salas_abiertas()` no la devuelve: `salasApi` la lee de `salas` y, si esa
    // lectura falla, la mesa llega sin ella. Y una clave del prototipo no cuela.
    const con = (entrada) => normalizarMesa({ id: 'u', jugadores: 2, apuesta: 100, sentados: 1, entrada }).entrada
    expect(con('llena')).toBe('llena')
    expect(con('corta')).toBe('corta')
    expect(con(undefined)).toBe('corta')
    expect(con('media')).toBe('corta')
    expect(con('toString')).toBe('corta')
  })
})

describe('SAL-B1 · lo que ArmarMesa le pregunta al listado', () => {
  const mesas = ordenarMesas([
    { id: 'a', jugadores: 4, apuesta: 200, sentados: 3 },
    { id: 'b', jugadores: 2, apuesta: 100, sentados: 1 },
  ], 5000)

  it('buscarCombinacion exige que coincidan LAS DOS cosas', () => {
    expect(buscarCombinacion(mesas, 4, 200)?.id).toBe('a')
    expect(buscarCombinacion(mesas, 4, 100)).toBe(null)   // misma mesa, otra apuesta
    expect(buscarCombinacion(mesas, 5, 200)).toBe(null)   // misma apuesta, otra mesa
  })

  it('MES-PvP 7b · y la entrada: la identidad de una pública es jugadores × apuesta × entrada', () => {
    const conLlena = ordenarMesas([
      { id: 'c', jugadores: 4, apuesta: 200, sentados: 3, entrada: 'corta' },
      { id: 'l', jugadores: 4, apuesta: 200, sentados: 1, entrada: 'llena' },
    ], Infinity)
    expect(buscarCombinacion(conLlena, 4, 200, 'corta')?.id).toBe('c')
    expect(buscarCombinacion(conLlena, 4, 200, 'llena')?.id).toBe('l')
    expect(buscarCombinacion(mesas, 4, 200, 'llena')).toBe(null)   // sólo hay una Corta igual
    expect(buscarCombinacion(conLlena, 4, 200)?.id).toBe('c')      // sin decirla, Corta
    // Y el recordatorio no señala como «otra» la mía con la misma entrada, pero sí la de la otra.
    expect(otraMesaAlAlcance(conLlena, Infinity, 4, 200, 'corta')?.id).toBe('l')
    expect(otraMesaAlAlcance(conLlena, Infinity, 4, 200, 'llena')?.id).toBe('c')
  })

  it('otraMesaAlAlcance excluye la mía y coge la más llena', () => {
    // La más llena es la que antes va a arrancar, y es la única que merece la
    // pena señalar. Como la lista llega ordenada, es la primera que casa.
    expect(otraMesaAlAlcance(mesas, 5000, 3, 500)?.id).toBe('a')
    expect(otraMesaAlAlcance(mesas, 5000, 4, 200)?.id).toBe('b')
  })

  it('no señala una mesa a la que no me puedo sentar', () => {
    const caras = ordenarMesas([{ id: 'cara', jugadores: 5, apuesta: 5000, sentados: 4 }], 500)
    expect(otraMesaAlAlcance(caras, 500, 2, 100)).toBe(null)
  })
})

describe('SAL-B1 · el aviso al anfitrión', () => {
  it('se enciende justo donde el bono deja de alcanzar', () => {
    // La ficha lo enunciaba como «apuesta > 200» y la lámina como
    // `apuesta × regla > bono`, y se implementó la fórmula. MOT-1 re-sella: con
    // la Corta (15×) la frontera pasó sola de la mesa de 500 a la de 200, que es
    // justo lo que la fórmula prometía.
    expect(fueraDelAlcanceDeNuevos(100, BONO_BIENVENIDA)).toBe(false)
    expect(fueraDelAlcanceDeNuevos(200, BONO_BIENVENIDA)).toBe(true)
    expect(fueraDelAlcanceDeNuevos(500, BONO_BIENVENIDA)).toBe(true)
    expect(fueraDelAlcanceDeNuevos(1000, BONO_BIENVENIDA)).toBe(true)
    expect(fueraDelAlcanceDeNuevos(5000, BONO_BIENVENIDA)).toBe(true)
  })

  it('la frontera se mueve con el bono, no con una cifra escrita', () => {
    // Con un bono de 7.500, la mesa de 500 pasa a estar al alcance de un
    // invitado nuevo y el aviso se apaga solo.
    expect(fueraDelAlcanceDeNuevos(500, 7500)).toBe(false)
  })
})

describe('SAL-B1 · §4.4 · la guarda de la configuración recordada', () => {
  const SALDO = 5000

  it('lo que no parsea o no tiene forma cae al defecto ENTERO', () => {
    for (const basura of [null, undefined, 'AJ-7K2M', 42, [], true]) {
      expect(normalizarConfig(basura, SALDO)).toEqual(CONFIG_POR_DEFECTO)
    }
  })

  it('el defecto es el de la lámina SAL-2, y el ritmo Normal (MES-PvP 7b)', () => {
    expect(CONFIG_POR_DEFECTO).toEqual({ jugadores: 4, apuesta: 100, tipo: 'privada', ritmo: 'normal' })
    expect(JUGADORES_PVP).toContain(CONFIG_POR_DEFECTO.jugadores)
    expect(APUESTAS_PVP).toContain(CONFIG_POR_DEFECTO.apuesta)
  })

  it('una configuración buena pasa entera', () => {
    expect(normalizarConfig({ jugadores: 5, apuesta: 200, tipo: 'abierta', ritmo: 'rapido' }, SALDO))
      .toEqual({ jugadores: 5, apuesta: 200, tipo: 'abierta', ritmo: 'rapido' })
  })

  it('MES-PvP 7b · un ritmo desconocido o ausente cae a Normal, y la entrada no se conserva', () => {
    expect(normalizarConfig({ jugadores: 5, apuesta: 200, tipo: 'abierta', ritmo: 'lento' }, SALDO).ritmo).toBe('normal')
    expect(normalizarConfig({ jugadores: 5, apuesta: 200, tipo: 'abierta' }, SALDO).ritmo).toBe('normal')
    expect(normalizarConfig({ jugadores: 5, apuesta: 200, tipo: 'abierta', ritmo: 'rapido', entrada: 'llena' }, SALDO))
      .not.toHaveProperty('entrada')
  })

  it('un valor fuera de las listas selladas NO se aproxima: cae al defecto', () => {
    // Aproximar al más cercano sería inventarse una séptima apuesta o una mesa
    // de seis, y las dos listas son contrato con los `check` de la base.
    expect(normalizarConfig({ jugadores: 6, apuesta: 100, tipo: 'privada' }, SALDO).jugadores).toBe(4)
    expect(normalizarConfig({ jugadores: 4, apuesta: 300, tipo: 'privada' }, SALDO).apuesta).toBe(100)
    expect(normalizarConfig({ jugadores: 4, apuesta: 100, tipo: 'publica' }, SALDO).tipo).toBe('privada')
  })

  it('una apuesta que ya no alcanza cae SOLA, sin arrastrar lo demás', () => {
    // El caso real: el jugador se gastó el saldo entre dos sesiones. Perder
    // también «mesa de 5, abierta» sería castigarle dos veces por lo mismo.
    expect(normalizarConfig({ jugadores: 5, apuesta: 5000, tipo: 'abierta', ritmo: 'rapido' }, SALDO))
      .toEqual({ jugadores: 5, apuesta: 100, tipo: 'abierta', ritmo: 'rapido' })
  })

  it('la que la releva es la del defecto, no la mayor que alcance', () => {
    // Con 5.000 de saldo alcanzan hasta 200. Elegir 200 por él sería decidir
    // cuánto se juega, que no es una decisión del programa.
    expect(normalizarConfig({ jugadores: 4, apuesta: 2000, tipo: 'privada' }, SALDO).apuesta)
      .toBe(CONFIG_POR_DEFECTO.apuesta)
  })

  it('sin saldo conocido, la apuesta recordada no se conserva', () => {
    expect(normalizarConfig({ jugadores: 3, apuesta: 500, tipo: 'abierta' }, undefined))
      .toEqual({ jugadores: 3, apuesta: 100, tipo: 'abierta', ritmo: 'normal' })
  })
})

// ── SAL-B1 · Ajuste A2 §6.1 · la guardia del arranque, como secuencia ──────
// Se prueba la SECUENCIA que `App` vive de verdad, no tres casos sueltos: es la
// diferencia entre «la función devuelve lo esperado» y «el segundo login en la
// misma carga de página vuelve a preguntar mi_sala()», que es el defecto.
describe('SAL-B1 A2 · arranqueDeSesion', () => {
  const A = '11111111-1111-4111-8111-111111111111'
  const B = '22222222-2222-4222-8222-222222222222'

  // Reproduce lo que hace el efecto: decide, recuerda, y devuelve si arrancó.
  function sesion() {
    let guardia = null
    return (uid) => {
      const d = arranqueDeSesion(guardia, uid)
      guardia = d.arrancado
      return d.arrancar
    }
  }

  it('sin sesión no arranca y no recuerda nada', () => {
    expect(arranqueDeSesion(null, null)).toEqual({ arrancar: false, arrancado: null })
    expect(arranqueDeSesion(A, undefined)).toEqual({ arrancar: false, arrancado: null })
  })

  it('el primer perfil arranca UNA vez, aunque el efecto corra varias veces', () => {
    // CARGANDO → perfil → remontaje de StrictMode → un re-render cualquiera.
    const paso = sesion()
    expect(paso(null)).toBe(false)
    expect(paso(A)).toBe(true)
    expect(paso(A)).toBe(false)
    expect(paso(A)).toBe(false)
  })

  it('cerrar sesión desarma: el siguiente login arranca, sea la misma cuenta u otra', () => {
    // El defecto del S25: A entra, cierra sesión, B entra en la misma carga de
    // página. Con el booleano, B nunca preguntaba mi_sala().
    const paso = sesion()
    expect(paso(A)).toBe(true)
    expect(paso(null)).toBe(false)
    expect(paso(B)).toBe(true)
    expect(paso(B)).toBe(false)
    // Y la MISMA cuenta que vuelve a entrar también arranca: una sesión nueva
    // es un arranque nuevo, aunque el uid coincida.
    expect(paso(null)).toBe(false)
    expect(paso(A)).toBe(true)
  })

  it('un cambio de uid sin pasar por null también arranca', () => {
    // No ocurre con el flujo de la Portada, pero si un día el SDK cambiara de
    // sesión sin emitir el cierre, la guardia no debe quedarse con la vieja.
    const paso = sesion()
    expect(paso(A)).toBe(true)
    expect(paso(B)).toBe(true)
    expect(paso(B)).toBe(false)
  })

  it('con simulación, App ni siquiera pregunta: la función no se llama', () => {
    // Documental: el `if (simulacion) return` va ANTES de la decisión, así que
    // el arnés no rearma ni desarma nada. Aquí sólo se deja escrito.
    expect(typeof arranqueDeSesion).toBe('function')
  })
})
