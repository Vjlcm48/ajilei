// ── SAL-B1 · Los nueve estados que el arnés puede pedir ─────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §8.2 y §8.3.
//
// ── QUÉ RESUELVE ───────────────────────────────────────────────────────────
// Medir «Mesas formándose ahora» con cinco mesas, una de ellas fuera de alcance,
// exige que existan cinco mesas y un jugador pobre. Con backend de verdad eso
// significa cinco cuentas, cinco sesiones y tres minutos de vida por mesa: la
// ventanilla de tres tarjetas no se podría fotografiar dos veces igual, que es
// justo lo que un arnés necesita. Estos fixtures son la puerta.
//
// ── LA PUERTA ES DOBLE, COMO LA DEL BYPASS ─────────────────────────────────
// Molde literal de `siembraCEL.js` y de `AUTH_BYPASS` en `useAuth.js:50`:
//
//     import.meta.env.DEV   Y   import.meta.env.VITE_AUTH_BYPASS
//
// `import.meta.env.DEV` es `false` bajo `vite build`, así que la primera línea
// de `simulacionSalas` se compila a `if (true) return null` y el minificador se
// lleva por delante TODO lo que viene detrás —los nueve estados, los datos y el
// nombre del parámetro—. Por eso `?sal=` no significa nada en producción: no es
// que esté apagado, es que no existe. §9.3 lo comprueba con un `grep` sobre
// `dist/`, y ése es el único veredicto que cuenta: este comentario es una
// intención, el grep es una medida.
//
// La segunda mitad de la puerta no es redundante. Un despiste que hiciera un
// build en modo desarrollo seguiría necesitando `VITE_AUTH_BYPASS` en el
// entorno, y ésa es la variable que Victor sabe que nunca va a un despliegue.
//
// ── LO QUE ESTOS DATOS NO SON ──────────────────────────────────────────────
// No son una simulación del servidor. No comprueban la regla 5×, ni el límite
// de intentos, ni el índice parcial: eso vive en SQL y se prueba con dos
// teléfonos (§9.5). Lo que sostienen es la GEOMETRÍA —que la ventanilla mida
// tres tarjetas, que el CTA mida lo que la lámina dice, que nada desborde en
// seis viewports—, y para eso lo que hace falta es que los datos sean FIJOS.

// A2 · los fixtures ya no fabrican una API a mano: fabrican un CLIENTE falso con
// la forma de PostgREST y lo pasan por `crearSalasApi`, que es la capa real. Lo
// que el arnés mide así es la pantalla Y la traducción, no un doble de las dos.
import { crearSalasApi } from '../lib/salasApi'

export const PARAM_SAL = 'sal'

// Los nueve nombres de §8.3, en un solo sitio: el arnés los recorre desde aquí
// y así no puede pedir uno que no exista ni olvidarse de uno que sí.
export const ESTADOS_SAL = [
  'opciones-vacio',
  'opciones-3',
  'opciones-mas',
  'opciones-fuera-alcance',
  'opciones-error',
  // A1 §5 · el décimo: campo LLENO por el camino real del enlace (código
  // precargado, intento automático, fallo, foco) — la secuencia con la que el
  // Motorola escondió la primera letra.
  'opciones-codigo-lleno',
  'armar',
  'armar-aviso',
  'armar-unirme',
  'espera-stub',
  // A2 §3 · la prueba NEGATIVA: `mi_sala()` devuelve la fila de nulos de
  // PostgREST y el stub NO debe pintarse.
  'espera-fantasma',
]

/**
 * La simulación pedida por la URL, o `null` si no hay ninguna.
 *
 * Devuelve UN objeto con todo lo que las pantallas necesitan —qué pantalla
 * abrir, con qué API hablar y con qué configuración nacer— en vez de tres
 * funciones sueltas: así una pantalla no puede quedarse con la API simulada y
 * la configuración real, que es la clase de mezcla que produce un verde falso.
 *
 * @returns {{estado:string, pantalla:string, api:object, config:object|null, codigo:string|null, sala:object|null}|null}
 */
export function simulacionSalas() {
  // ── La primera línea es la que borra el archivo en producción ────────────
  if (!import.meta.env.DEV) return null
  if (!import.meta.env.VITE_AUTH_BYPASS) return null
  if (typeof window === 'undefined') return null

  let estado
  try {
    estado = new URLSearchParams(window.location.search).get(PARAM_SAL)
  } catch {
    return null
  }
  if (estado === null || !ESTADOS_SAL.includes(estado)) return null

  return {
    estado,
    pantalla: pantallaDe(estado),
    api: apiDe(estado),
    config: configDe(estado),
    // A1 · el código con el que `SalaOpciones` nace, o `null`. Cuando lo hay,
    // `App` enciende el intento automático como si viniera de un enlace.
    codigo: codigoDe(estado),
    // A2 · la mesa con la que la app nace, como si se hubiera entrado por una
    // RPC. En `espera-fantasma` es la fila de nulos: `App` tiene que rechazarla.
    sala: salaDe(estado),
  }
}

function salaDe(estado) {
  if (estado === 'espera-stub') return salaFalsa()
  if (estado === 'espera-fantasma') return filaDeNulos()
  return null
}

// ── Qué código trae cada estado ─────────────────────────────────────────────
// `LHQH` es literal: el código con el que el Motorola mostró `.HQH`. La `L` es
// además una letra ESTRECHA, así que si se esconde ella se esconde cualquiera.
function codigoDe(estado) {
  return estado === 'opciones-codigo-lleno' ? 'AJ-LHQH' : null
}

// ── Qué pantalla abre cada estado ───────────────────────────────────────────
function pantallaDe(estado) {
  if (estado.startsWith('armar')) return 'armar-mesa'
  if (estado.startsWith('espera')) return 'sala-espera'
  return 'sala-opciones'
}

// ── Los datos ───────────────────────────────────────────────────────────────
// Viven DENTRO de funciones y no en constantes de módulo, y es a propósito: una
// constante de nivel superior que nadie usa la elimina el empaquetador casi
// siempre, pero «casi siempre» no es una garantía que se pueda escribir en un
// informe. Dentro de una función que el `return null` de arriba deja inalcanzable,
// se van con ella por construcción.
//
// El saldo contra el que se juzgan es `AJILEI_CONFIG.economy.saldoInicial` =
// 5.000, que es lo que devuelve `saldoDelJugador()`. De ahí salen las cifras de
// §8.3: alcanzan 100/200/500/1000; no alcanzan 2000 ni 5000; y una mesa de 5000
// pide 25.000, así que faltan exactamente 20.000.

const uuid = (n) => `00000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`

// `expira_en` se fabrica siempre en el futuro para que la fila sea coherente con
// una sala viva. En B1 no se pinta —la tarjeta no lleva cronómetro— pero el dato
// viaja igual, porque el contrato de `salas_abiertas()` lo incluye y un fixture
// que omitiera columnas dejaría de ser un ensayo de lo real.
const enUnRato = (seg) => new Date(Date.now() + seg * 1000).toISOString()

function mesa(n, jugadores, apuesta, sentados, seg = 150) {
  return {
    id: uuid(n),
    jugadores,
    apuesta,
    sentados,
    expira_en: enUnRato(seg),
  }
}

function abiertasDe(estado) {
  switch (estado) {
    case 'opciones-vacio':
      return []

    // Tres exactas: la ventanilla llena y sin desplazamiento. Es la referencia
    // contra la que se compara `opciones-mas`.
    case 'opciones-3':
      return [mesa(1, 4, 200, 3), mesa(2, 2, 100, 1), mesa(3, 5, 200, 1)]

    // Cinco: la ventanilla sigue midiendo tres tarjetas y desplaza por dentro.
    // Deliberadamente DESORDENADAS respecto al orden final, para que el punto
    // del arnés que mide el orden esté midiendo el `sort` y no la suerte.
    case 'opciones-mas':
      return [
        mesa(1, 3, 1000, 1),
        mesa(2, 4, 200, 3),
        mesa(3, 5, 500, 2),
        mesa(4, 2, 100, 1),
        mesa(5, 4, 500, 2),
      ]

    // Una fuera de alcance entre dos que sí: se atenúa Y baja al final.
    case 'opciones-fuera-alcance':
      return [mesa(1, 5, 5000, 1), mesa(2, 4, 200, 3), mesa(3, 2, 100, 1)]

    case 'opciones-error':
    case 'opciones-codigo-lleno':
      return [mesa(1, 4, 200, 3)]

    // La combinación 4×200 existe: es lo que convierte «Abrir mesa» en
    // «Unirme a esa mesa» con su nota.
    case 'armar-unirme':
      return [mesa(1, 4, 200, 3), mesa(2, 2, 100, 1)]

    // `armar` y `armar-aviso` nacen SIN mesas para que el estado base esté
    // limpio: sin recordatorio suave, sin nota, sólo los cuatro bloques y el
    // CTA. Lo que `armar-aviso` mide es el aviso al anfitrión, y mezclarlo con
    // un recordatorio de otra mesa haría la captura ilegible.
    default:
      return []
  }
}

function configDe(estado) {
  // 500 HC: 5×500 = 2.500 > 1.200 de bono, así que el aviso al anfitrión se
  // enciende. Es la frontera exacta que §4.2 describe.
  if (estado === 'armar-aviso') return { jugadores: 4, apuesta: 500, tipo: 'privada' }
  // Abierta y con la combinación que sí existe en el listado.
  if (estado === 'armar-unirme') return { jugadores: 4, apuesta: 200, tipo: 'abierta' }
  if (estado.startsWith('armar')) return { jugadores: 4, apuesta: 100, tipo: 'privada' }
  return null
}

function salaFalsa({ tipo = 'privada', jugadores = 4, apuesta = 200 } = {}) {
  return {
    id: uuid(9),
    codigo: tipo === 'privada' ? 'AJ-7K2M' : null,
    tipo,
    jugadores,
    apuesta,
    anfitrion_id: '00000000-0000-4000-8000-000000000000',
    estado: 'esperando',
    creada_en: new Date().toISOString(),
    expira_en: enUnRato(150),
    iniciada_en: null,
    estado_partida: null,
  }
}

// ── A2 · La fila de nulos, tal como la entrega PostgREST ────────────────────
// Una función que `returns public.salas` y hace `return null` no llega como
// JSON `null`: PostgREST la llama con `select * from f()` y Postgres expande el
// compuesto nulo en UNA fila con todas las columnas en null. Es la forma que el
// cliente tomó por mesa, y por eso el mock la produce tal cual —imita a
// PostgREST, no a SQL—.
function filaDeNulos() {
  return {
    id: null, codigo: null, tipo: null, jugadores: null, apuesta: null,
    anfitrion_id: null, estado: null, creada_en: null, expira_en: null,
    iniciada_en: null, estado_partida: null,
  }
}

// ── El CLIENTE simulado ─────────────────────────────────────────────────────
// Imita al SDK de Supabase en lo que `crearSalasApi` toca: `rpc(nombre, args)`,
// `from(...).select(...).eq(...)` para el recuento de sentados, y un canal que
// no hace nada. Devuelve lo que PostgREST devolvería, con `error: null`; la
// traducción a claves y la normalización de «no hay mesa» las hace la capa
// real, que es justo lo que A2 quiere medir.
//
// Los estados que rechazan el código (`opciones-error`, `opciones-codigo-lleno`)
// responden con la FILA DE NULOS, que es lo que `unirse_sala` devuelve desde A1
// para un código que no encuentra mesa viva; `salasApi` la convierte en
// `codigo_invalido`. Y `mi_sala` sin mesa responde también con ella —salvo en
// `espera-stub`—, porque eso es lo que la base hace de verdad.
function clienteDe(estado) {
  const abiertas = abiertasDe(estado)
  const fila = (data) => Promise.resolve({ data, error: null })
  const sinMesa = estado === 'opciones-error' || estado === 'opciones-codigo-lleno'

  const rpc = (nombre, args = {}) => {
    switch (nombre) {
      case 'ahora':         return fila(new Date().toISOString())
      case 'salas_abiertas': return fila(abiertas)
      case 'unirse_sala':
        return sinMesa
          ? fila(filaDeNulos())
          : fila(salaFalsa({ tipo: args.p_codigo ? 'privada' : 'abierta' }))
      case 'crear_sala':
        return fila(salaFalsa({ tipo: args.p_tipo, jugadores: args.p_jugadores, apuesta: args.p_apuesta }))
      case 'salir_sala':    return fila(null)
      case 'jugar_ya':
      case 'resolver_sala': return fila(salaFalsa())
      case 'mi_sala':       return fila(estado === 'espera-stub' ? salaFalsa() : filaDeNulos())
      default:              return fila(null)
    }
  }

  // Dos de cuatro: la sala de espera enseña «2/4 sentados» y el botón
  // «Actualizar» devuelve el mismo número, que es lo que hace la captura
  // repetible.
  const from = () => ({ select: () => ({ eq: () => Promise.resolve({ count: 2, error: null }) }) })

  const channel = () => {
    const canal = { on: () => canal, subscribe: () => canal }
    return canal
  }

  return { rpc, from, channel, removeChannel: () => {} }
}

function apiDe(estado) {
  return crearSalasApi(clienteDe(estado))
}
