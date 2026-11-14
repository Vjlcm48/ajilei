// ── SAL-B1 · Los estados que el arnés puede pedir ───────────────────────────
// Rector: AJILEI_SAL-B1_Fase1_v1.0.md §8.2 y §8.3; SAL-B2 F1b §8 añade los
// siete estados `espera-*` de la sala de espera real y retira el del stub.
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
// lleva por delante TODO lo que viene detrás —los estados, los datos, el nombre
// del parámetro y el emisor de eventos—. Por eso `?sal=` no significa nada en
// producción: no es que esté apagado, es que no existe. §9.3 lo comprueba con
// un `grep` sobre `dist/`, y ése es el único veredicto que cuenta: este
// comentario es una intención, el grep es una medida.
//
// La segunda mitad de la puerta no es redundante. Un despiste que hiciera un
// build en modo desarrollo seguiría necesitando `VITE_AUTH_BYPASS` en el
// entorno, y ésa es la variable que Victor sabe que nunca va a un despliegue.
//
// ── LO QUE ESTOS DATOS NO SON ──────────────────────────────────────────────
// No son una simulación del servidor. No comprueban la regla 5×, ni el límite
// de intentos, ni el índice parcial, ni la cuenta corta de la mesa llena: eso
// vive en SQL y se prueba en SQL y con dos teléfonos. Lo que sostienen es la
// GEOMETRÍA y la CONDUCTA DE PANTALLA —que la ventanilla mida tres tarjetas,
// que las sillas estén en su anillo, que una llegada por Realtime pinte una
// silla nueva—, y para eso lo que hace falta es que los datos sean FIJOS.

// A2 · los fixtures no fabrican una API a mano: fabrican un CLIENTE falso con
// la forma de PostgREST y lo pasan por `crearSalasApi`, que es la capa real. Lo
// que el arnés mide así es la pantalla Y la traducción, no un doble de las dos.
import { crearSalasApi } from '../lib/salasApi'
import { LLENA_SEG } from '../config/salas'

export const PARAM_SAL = 'sal'

// Los nombres, en un solo sitio: el arnés los recorre desde aquí y así no puede
// pedir uno que no exista ni olvidarse de uno que sí.
export const ESTADOS_SAL = [
  'opciones-vacio',
  'opciones-3',
  'opciones-mas',
  'opciones-fuera-alcance',
  'opciones-error',
  // A1 §5 · campo LLENO por el camino real del enlace (código precargado,
  // intento automático, fallo, foco) — la secuencia con la que el Motorola
  // escondió la primera letra.
  'opciones-codigo-lleno',
  // MES-PvP 7b · dos mesas Llenas (una a mi alcance y otra no) y una Corta: el
  // rótulo «Entrada … HC» y el «Te faltan» con la entrada de cada mesa.
  'opciones-llena',
  'armar',
  'armar-aviso',
  'armar-unirme',
  // ── SAL-B2 F1b · la sala de espera real, un estado por vista de la lámina ──
  'espera-anfitrion',
  'espera-invitado',
  'espera-abierta',
  'espera-llena',
  'espera-fin-cancelada',
  'espera-fin-vencida',
  'espera-fin-activa',
  // MES-PvP 7b · 3 de 5 con nombres largos del banco imitado: la sala anclada,
  // la silla que abre el mini-perfil (ajeno y propio) y el diálogo «Cancelar».
  'espera-nombres',
  // A2 §3 · la prueba NEGATIVA: `mi_sala()` devuelve la fila de nulos de
  // PostgREST y la sala NO debe pintarse.
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

  // F1b · los datos VIVOS del estado: la mesa y sus asientos. Son un solo
  // objeto compartido por la mesa con la que `App` nace y por el cliente falso
  // que la relee, para que lo que el emisor de eventos cambie sea lo que la
  // siguiente lectura devuelva.
  const datos = datosDe(estado)

  return {
    estado,
    pantalla: pantallaDe(estado),
    api: crearSalasApi(clienteDe(estado, datos)),
    config: configDe(estado),
    // A1 · el código con el que `SalaOpciones` nace, o `null`. Cuando lo hay,
    // `App` enciende el intento automático como si viniera de un enlace.
    codigo: codigoDe(estado),
    // A2 · la mesa con la que la app nace, como si se hubiera entrado por una
    // RPC. En `espera-fantasma` es la fila de nulos: `App` tiene que rechazarla.
    sala: datos.sala,
  }
}

/**
 * ARN-4 C6 · La API de salas del bypass sin `?sal=`: la misma capa real sobre el
 * cliente falso, sin mesa y sin mesas abiertas. Misma puerta doble que
 * `simulacionSalas`, y aparte de ella: esto no es una simulación pedida, y `App`
 * usa `simulacion` para saber si la hay.
 *
 * @returns {object|null}
 */
export function apiSinMesa() {
  if (!import.meta.env.DEV) return null
  if (!import.meta.env.VITE_AUTH_BYPASS) return null

  return crearSalasApi(clienteDe('sin-mesa', datosDe('sin-mesa')))
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
// El saldo contra el que se juzgan es el de la billetera falsa del bypass
// (`dev/billeteraFalsa.js`, ECO-1b): 5.000 si `?apu=saldo:<n>` no dice otra
// cosa, la misma cifra que daba la constante de antes. De ahí salen las cifras de
// §8.3: alcanzan 100/200/500/1000; no alcanzan 2000 ni 5000; y una mesa de 5000
// pide 25.000, así que faltan exactamente 20.000.

const uuid = (n) => `00000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`

// El uuid del perfil del bypass (`PERFIL_DEV` en `useAuth.js:54`, no exportado
// a propósito). Con él como `anfitrion_id` la sala se ve como ANFITRIÓN; con
// otro, como INVITADO. Se escribe aquí igual que allí, y el arnés lo mide.
const UID_DEV = '00000000-0000-4000-8000-000000000000'

// `expira_en` se fabrica siempre en el futuro para que la fila sea coherente con
// una sala viva —o en el pasado, para los finales que el reloj decide—.
const enUnRato = (seg) => new Date(Date.now() + seg * 1000).toISOString()

// MES-PvP 7b · `entrada` NO viaja en `salas_abiertas()`: la sirve `from('salas')`
// cuando `salasApi` la pide por `id` (ver `clienteDe`).
function mesa(n, jugadores, apuesta, sentados, seg = 150, entrada = 'corta') {
  return {
    id: uuid(n),
    jugadores,
    apuesta,
    sentados,
    expira_en: enUnRato(seg),
    entrada,
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

    // 7b · con el saldo del bypass (5.000): la Llena de 100 pide 5.000 y alcanza;
    // la de 3 a 200 pide 10.000 y faltan 5.000 (con la regla de la Corta
    // alcanzaría: es la que separa las dos reglas); la de 5 a 5.000 pide 250.000
    // y es el PEOR caso de la línea 2 («Te faltan 245.000 HC · Entrada 250.000
    // HC», cinco sillas), la que obliga a apretar. Cuatro mesas: la lista
    // desplaza por dentro, como con `opciones-mas`.
    case 'opciones-llena':
      return [
        mesa(1, 4, 100, 2, 150, 'llena'), mesa(2, 3, 200, 1, 150, 'llena'),
        mesa(3, 5, 5000, 1, 150, 'llena'), mesa(4, 2, 100, 1),
      ]

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
  // 200 HC: 15×200 = 3.000 > 2.500 de bono, así que el aviso al anfitrión se
  // enciende. Es la frontera exacta que §4.2 describe. ECO-1b (B4) la había
  // movido a 1.000 con el 5×; con el 15× de MOT-1 la mesa de 1.000 ya no alcanza
  // al saldo del bypass (5.000) y la pantalla la caía a 100 (MES-PvP 7b). Con
  // 200, además, la Llena (50×200 = 10.000) se ve apagada.
  if (estado === 'armar-aviso') return { jugadores: 4, apuesta: 200, tipo: 'privada' }
  // Abierta y con la combinación que sí existe en el listado.
  if (estado === 'armar-unirme') return { jugadores: 4, apuesta: 200, tipo: 'abierta' }
  if (estado.startsWith('armar')) return { jugadores: 4, apuesta: 100, tipo: 'privada' }
  return null
}

function salaFalsa({
  tipo = 'privada', jugadores = 4, apuesta = 200, anfitrionId = UID_DEV, estado = 'esperando', expiraEn = enUnRato(150),
} = {}) {
  return {
    id: uuid(9),
    codigo: tipo === 'privada' ? 'AJ-7K2M' : null,
    tipo,
    jugadores,
    apuesta,
    anfitrion_id: anfitrionId,
    estado,
    creada_en: new Date().toISOString(),
    expira_en: expiraEn,
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

// ── F1b · Los asientos, en la forma del CLIENTE ─────────────────────────────
// `{ asiento, jugadorId, username }`, lo que `asientosDe` devuelve; el cliente
// falso los traduce a la forma de PostgREST al servirlos. Los nombres son los de
// la lámina; `DevLocal` es el username de `PERFIL_DEV`.
const OTRO = uuid(7)
const silla = (asiento, jugadorId, username) => ({ asiento, jugadorId, username })
const ANFITRION_DEV = silla(0, UID_DEV, 'DevLocal')
const ANFITRION_OTRO = silla(0, OTRO, 'carlos_vzla')
const INVITADOS = [silla(1, uuid(11), 'maria_ccs'), silla(2, uuid(12), 'jose_mad'), silla(3, uuid(13), 'ana_bcn'), silla(4, uuid(14), 'luis_mia')]

// ── F1b · La mesa y los asientos de cada estado ─────────────────────────────
//   anfitrión     · privada de 4, yo en la 0 con una invitada
//   invitado      · privada de 4, otro anfitrión en la 0 y yo en la 1
//   abierta       · como anfitrión, sin código
//   llena         · 5 de 5 y la cuenta corta (`LLENA_SEG`)
//   fin-cancelada · invitado; la fila ya dice 'cancelada' (el anfitrión cerró)
//   fin-vencida   · ANFITRIÓN solo, reloj en el pasado y la fila YA en
//                   'cancelada': es exactamente lo que E5 vivió en el teléfono
//                   (el barrido la cerró y Realtime trajo la fila antes de que
//                   este cliente resolviera). Con la regla de los ajustes el
//                   anfitrión lee «no llegó gente a tiempo», no «el anfitrión
//                   cerró la mesa»: la fila es la misma, quien mira no.
//   fin-activa    · dos sentados, reloj en el pasado; `resolver_sala` → activa
function datosDe(estado) {
  switch (estado) {
    case 'espera-anfitrion':
      return { sala: salaFalsa(), asientos: [ANFITRION_DEV, INVITADOS[0]] }
    case 'espera-invitado':
      return { sala: salaFalsa({ anfitrionId: OTRO }), asientos: [ANFITRION_OTRO, silla(1, UID_DEV, 'DevLocal')] }
    case 'espera-abierta':
      return { sala: salaFalsa({ tipo: 'abierta' }), asientos: [ANFITRION_DEV, INVITADOS[0]] }
    case 'espera-llena':
      return { sala: salaFalsa({ jugadores: 5, expiraEn: enUnRato(LLENA_SEG) }), asientos: [ANFITRION_DEV, ...INVITADOS] }
    case 'espera-fin-cancelada':
      return { sala: salaFalsa({ anfitrionId: OTRO, estado: 'cancelada' }), asientos: [ANFITRION_OTRO, silla(1, UID_DEV, 'DevLocal')] }
    case 'espera-fin-vencida':
      return { sala: salaFalsa({ expiraEn: enUnRato(-5), estado: 'cancelada' }), asientos: [ANFITRION_DEV] }
    case 'espera-fin-activa':
      return { sala: salaFalsa({ expiraEn: enUnRato(-5) }), asientos: [ANFITRION_DEV, INVITADOS[0]] }
    case 'espera-fantasma':
      return { sala: filaDeNulos(), asientos: [] }
    // 7b · los nombres son del banco imitado (`sembradosRanking.js`), para que
    // el mini-perfil los encuentre; el de 15 caracteres es el más largo.
    case 'espera-nombres':
      return {
        sala: salaFalsa({ jugadores: 5 }),
        asientos: [ANFITRION_DEV, silla(1, uuid(15), 'MaracuchaBrava_'), silla(2, uuid(16), 'Cocuy_Pecayero')],
      }
    default:
      return { sala: null, asientos: [] }
  }
}

// ── El CLIENTE simulado ─────────────────────────────────────────────────────
// Imita al SDK de Supabase en lo que `crearSalasApi` toca: `rpc(nombre, args)`,
// `from(...).select(...).eq(...)[.order() | .maybeSingle()]` para los asientos,
// el recuento y la fila de la sala, y un canal que GUARDA sus handlers.
// Devuelve lo que PostgREST devolvería, con `error: null`; la traducción a
// claves y la normalización de «no hay mesa» las hace la capa real, que es
// justo lo que A2 quiere medir.
//
// Los estados que rechazan el código (`opciones-error`, `opciones-codigo-lleno`)
// responden con la FILA DE NULOS, que es lo que `unirse_sala` devuelve desde A1
// para un código que no encuentra mesa viva; `salasApi` la convierte en
// `codigo_invalido`. Y `mi_sala` sin mesa responde también con ella, porque eso
// es lo que la base hace de verdad.
//
// ── F1b · `window.__salEmitir`: Realtime sin backend ───────────────────────
// El canal falso guarda los handlers que `suscribirSala` registra, y el arnés
// dispara uno con `window.__salEmitir({ tabla, evento, sala, asientos })`:
// primero muta los datos vivos (una silla más, la fila en 'cancelada'), luego
// llama a los handlers de esa tabla con `{ eventType }`. La pantalla, por
// contrato, no mira el payload: relee. Es la única forma de medir sin backend
// que la pantalla relee al recibir. Vive DENTRO de esta función, tras la puerta
// doble: en producción no existe, y el `grep` de `dist/` lo comprueba.
function clienteDe(estado, datos) {
  const abiertas = abiertasDe(estado)
  const fila = (data) => Promise.resolve({ data, error: null })
  const sinMesa = estado === 'opciones-error' || estado === 'opciones-codigo-lleno'
  const hayMesa = () => datos.sala !== null && datos.sala.id !== null

  const rpc = (nombre, args = {}) => {
    switch (nombre) {
      case 'ahora':         return fila(new Date().toISOString())
      // 7b · sin `entrada`, como la función de verdad.
      case 'salas_abiertas': return fila(abiertas.map((m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'entrada'))))
      case 'unirse_sala':
        return sinMesa
          ? fila(filaDeNulos())
          : fila(salaFalsa({ tipo: args.p_codigo ? 'privada' : 'abierta' }))
      case 'crear_sala':
        return fila(salaFalsa({ tipo: args.p_tipo, jugadores: args.p_jugadores, apuesta: args.p_apuesta }))
      case 'salir_sala':    return fila(null)
      case 'jugar_ya':
        return fila(hayMesa() ? { ...datos.sala, estado: 'activa', iniciada_en: new Date().toISOString() } : salaFalsa())
      // Los dos finales que el reloj decide: la fila resuelta dice lo que el
      // barrido diría con esos sentados (< 2 cancela, ≥ 2 arranca).
      case 'resolver_sala':
        if (!hayMesa()) return fila(salaFalsa())
        if (estado === 'espera-fin-vencida') return fila({ ...datos.sala, estado: 'cancelada' })
        if (estado === 'espera-fin-activa') return fila({ ...datos.sala, estado: 'activa', iniciada_en: new Date().toISOString() })
        return fila(datos.sala)
      case 'mi_sala':       return fila(hayMesa() ? datos.sala : filaDeNulos())
      default:              return fila(null)
    }
  }

  // `from`: la fila de `salas` para `leerSala`, los asientos (forma PostgREST,
  // con `profiles` incrustado) para `asientosDe`, y el `count` para
  // `contarSentados` cuando el `select` pide `head: true`.
  const from = (tabla) => {
    let soloCuenta = false
    let porIds = null
    const responder = () => {
      // 7b · la entrada de las abiertas, pedida por `id` (`salasApi.salasAbiertas`).
      if (tabla === 'salas' && porIds) {
        return { data: abiertas.filter((m) => porIds.includes(m.id)).map((m) => ({ id: m.id, entrada: m.entrada })), error: null }
      }
      if (tabla === 'salas') return { data: hayMesa() ? datos.sala : null, error: null }
      if (soloCuenta) return { count: datos.asientos.length, error: null }
      return {
        data: datos.asientos.map((a) => ({ asiento: a.asiento, jugador_id: a.jugadorId, profiles: { username: a.username } })),
        error: null,
      }
    }
    const cadena = {
      select(columnas, opciones) { soloCuenta = Boolean(opciones?.head); return cadena },
      eq() { return cadena },
      in(columna, valores) { porIds = valores; return cadena },
      order() { return cadena },
      maybeSingle() { return cadena },
      then(fn) { return Promise.resolve(responder()).then(fn) },
    }
    return cadena
  }

  const escuchas = []
  const emitir = ({ tabla, evento = 'UPDATE', sala = null, asientos = null } = {}) => {
    if (sala && datos.sala) Object.assign(datos.sala, sala)
    if (Array.isArray(asientos)) datos.asientos = asientos
    let avisados = 0
    for (const e of escuchas) {
      if (e.tabla === tabla) { e.fn({ eventType: evento }); avisados += 1 }
    }
    return avisados
  }
  // El emisor se cuelga de `window` AL SUSCRIBIR, no al construir el cliente:
  // en desarrollo React invoca dos veces el inicializador de `useState` que
  // llama a `simulacionSalas()` (StrictMode) y se queda con uno de los dos
  // clientes. Colgarlo aquí garantiza que el emisor sea el del cliente que la
  // pantalla usa de verdad, con SUS handlers y SUS datos.
  const channel = () => {
    const canal = {
      on(tipo, filtro, fn) { escuchas.push({ tabla: filtro?.table, fn }); return canal },
      subscribe() { window.__salEmitir = emitir; return canal },
    }
    return canal
  }
  const removeChannel = () => { escuchas.length = 0 }

  return { rpc, from, channel, removeChannel }
}
