import { supabase } from './supabase'
import { conTope, TOPE_ESPERA_MS } from './red'
import { lugarValido } from './lugarCore'

// ── RNK-1c · La puerta del cliente a los rankings ───────────────────────────
// Rector: AJILEI_RNK-1_Fase1c-i_v1.0.md §2.4. Molde de `mesaIAApi.js`:
// envoltorio delgado, sin estado y sin reglas. Llama a `ranking_top` y
// `ranking_mio` de la migración `20261024191731_rnk1a_libro_puntos.sql` y
// traduce sus filas a camelCase; la 1c-ii suma `mini_perfil` (`perfil`). El
// cliente NO calcula puestos ni franjas: devuelve lo que dice el servidor, en
// su orden.
//
// NUNCA RECHAZA. Una red caída, un error de la base, una excepción del SDK o
// una espera que pasa del tope llegan como `{ ok: false, motivo: 'sinred' }`,
// que la pantalla pinta con «Reintentar». El tope es el de las esperas de
// pantalla (`TOPE_ESPERA_MS`, INV-56): el `fetch` del SDK ya corta a los 8 s,
// y esto cubre además lo que no pase por él.
//
// «HAY FILA» SE DECIDE POR EL CONTENIDO (lección SAL-B1 A2): una fila sin
// `puesto` entero no es una fila, venga como venga.
//
// El cliente entra por parámetro para que el banco imitado del bypass
// (`dev/bancoImitado.js`, vía `dev/billeteraFalsa.js`) cambie SÓLO la fuente:
// el mismo interruptor que la billetera y las mesas (contrato único, ECO-1c).

export const RANKINGS = Object.freeze(['maestros', 'fortunas'])
export const SIN_RED = 'sinred'
export const INVALIDO = 'invalido'

const num = (v) => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const entero = (v) => {
  const n = num(v)
  return Number.isInteger(n) ? n : null
}

// CFG-1 1b · `ranking_top` y `mini_perfil` traen `pais` y `estado` (migración
// `20261030013000_cfg1b_perfil.sql`). Se copian validados contra las listas
// (`lugarValido`, INV-74): lo que no está en ellas se lee como «sin lugar».

/** Una fila de `ranking_top` → `{ puesto, username, cifra, esTu, pais, estado }`, o `null`. */
export function traducirFilaTop(f) {
  if (!f || typeof f !== 'object' || typeof f.username !== 'string') return null
  const puesto = entero(f.puesto)
  const cifra = num(f.cifra)
  if (puesto === null || cifra === null) return null
  return { puesto, username: f.username, cifra, esTu: f.es_tu === true, ...lugarValido(f.pais, f.estado) }
}

/** La respuesta de `ranking_mio` → `{ puesto, total, franja, cifra }`, o `null` (sin fila). */
export function traducirMio(data) {
  const f = Array.isArray(data) ? data[0] : data
  if (!f || typeof f !== 'object') return null
  const puesto = entero(f.puesto)
  if (puesto === null) return null
  return { puesto, total: entero(f.total), franja: entero(f.franja), cifra: num(f.cifra) }
}

// RNK-1c-ii · el patrón del nombre, el del servidor (CHECK de `profiles` y
// `REGLA_USERNAME` de `useAuth.js`). Copia a propósito, como allí: un nombre
// que no puede existir no sale a la red (§2.3 de la ficha).
const REGLA_NOMBRE = /^[A-Za-z0-9_]{6,15}$/

/**
 * La respuesta de `mini_perfil` → `{ username, puestoMaestros, puntos,
 * puestoFortunas, saldo }`, o `null` (no encontrado: la RPC es `setof` y
 * devuelve `[]`). Sin puntos, puesto y puntos de Maestros llegan nulos. Nunca
 * un uuid ni un correo: sólo se copian estos cinco campos.
 */
export function traducirPerfil(data) {
  const f = Array.isArray(data) ? data[0] : data
  if (!f || typeof f !== 'object' || typeof f.username !== 'string' || f.username === '') return null
  return {
    username: f.username,
    puestoMaestros: entero(f.puesto_maestros),
    puntos: num(f.puntos),
    puestoFortunas: entero(f.puesto_fortunas),
    saldo: num(f.saldo),
    ...lugarValido(f.pais, f.estado),
  }
}

export function crearRankingApi(cliente = supabase, { tope = TOPE_ESPERA_MS, reloj = globalThis } = {}) {
  const fallo = { ok: false, motivo: SIN_RED }

  const llamar = (nombre, ranking, traducir) => {
    // Un ranking que no existe no sale a la red: es un error del que llama.
    if (!RANKINGS.includes(ranking)) return Promise.resolve({ ok: false, motivo: INVALIDO })
    return pedir(nombre, { p_ranking: ranking }, traducir)
  }

  const pedir = (nombre, params, traducir) => {
    let llamada
    try {
      llamada = cliente.rpc(nombre, params)
    } catch (e) {
      console.warn(`RNK-1c: ${nombre} no salió —`, String(e?.message ?? e))
      return Promise.resolve(fallo)
    }
    const trabajo = Promise.resolve(llamada)
      .then(({ data, error } = {}) => {
        if (error) {
          console.warn(`RNK-1c: ${nombre} falló —`, error.code ?? '(sin código)', error.message)
          return fallo
        }
        return traducir(data)
      })
      .catch((e) => {
        console.warn(`RNK-1c: ${nombre} no contestó —`, String(e?.message ?? e))
        return fallo
      })
    return conTope(trabajo, tope, fallo, reloj)
  }

  return {
    /** El top 100: `{ ok: true, filas: [{ puesto, username, cifra, esTu }] }`, en el orden del servidor. */
    top(ranking) {
      return llamar('ranking_top', ranking, (data) => ({
        ok: true,
        filas: (Array.isArray(data) ? data : []).map(traducirFilaTop).filter(Boolean),
      }))
    },
    /** Tu puesto: `{ ok: true, mio: { puesto, total, franja, cifra } }`, o `mio: null` sin fila. */
    mio(ranking) {
      return llamar('ranking_mio', ranking, (data) => ({ ok: true, mio: traducirMio(data) }))
    },
    /**
     * RNK-1c-ii · lo público de un jugador, por su nombre: `{ ok: true, perfil }`,
     * con `perfil: null` si no existe (o si el nombre no cumple la regla: entonces
     * ni se llama). Sin red, `{ ok: false, motivo: 'sinred' }`, como las otras dos.
     */
    perfil(username) {
      if (typeof username !== 'string' || !REGLA_NOMBRE.test(username)) return Promise.resolve({ ok: true, perfil: null })
      return pedir('mini_perfil', { p_username: username }, (data) => ({ ok: true, perfil: traducirPerfil(data) }))
    },
  }
}

export const rankingApi = crearRankingApi()
