// ── MOT-1 1e · La función `partida`: el recorrido ───────────────────────────
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §2, §5 y §7. `index.ts` lee el entorno
// y crea los clientes; todo lo demás vive aquí, con sus dependencias inyectadas, para
// probarlo en vitest sin Deno ni Supabase (`scripts/testFuncionPartida.test.js`).
//
// cliente → token → leer_partida → árbitro → guardar_jugada → Broadcast { version }
// v1.3 · el mensaje: cliente → token → leer_partida → puedeMandarMensaje → anotar_mensaje →
// Broadcast `mensaje` { asiento, clave }, sin tocar el estado (`mandarMensaje`).
//
// UNA VERSIÓN POR LLAMADA. `guardar_jugada` solo admite un estado con la versión leída
// + 1, y `abandonarPorServidor` y `aplicarAccion` suben una cada uno. Si en la misma
// llamada se aplican abandonos pedidos y una acción, todo va en una transacción y la
// versión sube una sola vez: `jugar` la deja en la leída + 1.

import {
  MOTIVOS as M, abandonarPorServidor, aplicarAccion, azarSeguro, crearPartida, partidaTerminada, puedeMandarMensaje, vistaDe,
} from '../../../src/arbitro/index.js'
import { setRng } from '../../../src/engine/deck.js'

// C-4: las únicas que reintentan al chocar con otra escritura (contrato §5, paso 3). Con
// 5 asientos a la vez, el último choca hasta 4 veces y acierta en la quinta: nadie recibe
// `version_vieja` por elegir, descartar o volver del anuncio a la vez que otro (§2).
const SIMULTANEAS = ['elegir_carta_sorteo', 'descartar', 'volver_anuncio']
export const INTENTOS_SIMULTANEAS = 5

// Lo que `abandonarPorServidor` puede responder sin que nada vaya mal: el asiento sigue
// en `abandonos` hasta que cobra (informe 1d-ii §7), y un abandono anterior de la misma
// llamada puede haber terminado la partida.
const ABANDONO_TOLERADO = [M.ASIENTO_ABANDONADO, M.PARTIDA_TERMINADA]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const rechazo = (motivo, version = null) => ({ ok: false, motivo, version })

const err = (e) => String(e?.message ?? e).slice(0, 400)

// ── CORS ────────────────────────────────────────────────────────────────────
const ORIGENES = new Set(['https://ajilei.io', 'https://www.ajilei.io', 'http://localhost:5173', 'http://localhost:4173'])
const TUNELES = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/

export function cabecerasCors(origen) {
  const base = { Vary: 'Origin' }
  if (!origen || !(ORIGENES.has(origen) || TUNELES.test(origen))) return base
  return {
    ...base,
    'Access-Control-Allow-Origin': origen,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '600',
  }
}

// ── El token ────────────────────────────────────────────────────────────────
// Solo firmas asimétricas, y por eso un token HS256 se rechaza sin llegar a mirar sus
// llaves. El uid sale de `sub`, nunca del cuerpo.
//
// Un JWKS sin llaves lanza, no rechaza: es la huella de un proyecto que firma con el
// secreto heredado (el JWKS público de esos proyectos viene vacío) o de un entorno mal
// puesto, y no puede confundirse con un token malo. Da 500 con cualquier token.
export const ALGORITMOS_TOKEN = Object.freeze(['ES256', 'RS256', 'EdDSA'])

/**
 * @param {{ jwks: string|null, createLocalJWKSet: Function, jwtVerify: Function }} partes
 *   `jwks` es el texto de `SUPABASE_JWKS`; las otras dos, las de `jose`.
 * @returns {(token: string) => Promise<string|null>} el uid, o null si el token no vale
 */
export function crearVerificador({ jwks, createLocalJWKSet, jwtVerify }) {
  let llaves = null
  const cargar = () => {
    if (llaves) return llaves
    if (!jwks) throw new Error('falta SUPABASE_JWKS')
    const crudo = JSON.parse(jwks)
    const lista = Array.isArray(crudo) ? crudo : crudo?.keys
    if (!Array.isArray(lista) || lista.length === 0) throw new Error('SUPABASE_JWKS no trae llaves')
    llaves = createLocalJWKSet({ keys: lista })
    return llaves
  }
  return async (token) => {
    const conjunto = cargar()
    try {
      const { payload } = await jwtVerify(token, conjunto, {
        algorithms: [...ALGORITMOS_TOKEN],
        audience: 'authenticated',
        requiredClaims: ['sub', 'exp'],
      })
      return payload.role === 'authenticated' ? payload.sub : null
    } catch {
      return null
    }
  }
}

// ── El aviso ────────────────────────────────────────────────────────────────
// El camino de la sonda (llave de servicio, 202) con la marca de canal privado. El aviso solo
// lleva la versión (contrato §5). El tope es para que un Realtime colgado no retenga la
// respuesta de una jugada ya guardada.
//
// v1.3 · por el mismo canal viaja también el MENSAJE de la mesa, `{ asiento, clave }`: la
// excepción escrita a «por el canal solo versiones» (decisión P-1 de Victor). Es contenido
// público y efímero, no estado: nadie lo reconcilia y perderlo no rompe nada.
export const EVENTO_AVISO = 'version'
export const EVENTO_MENSAJE = 'mensaje'
const TOPE_AVISO_MS = 3000

/** Lo común: un evento con su carga al canal privado `partida:<mesa>`. */
export function crearDifusor({ base, secreta, fetch: pedir = fetch }) {
  return async (mesa, evento, payload) => {
    const cabeceras = { apikey: secreta, 'Content-Type': 'application/json' }
    if (!secreta.startsWith('sb_')) cabeceras.Authorization = `Bearer ${secreta}`
    const r = await pedir(`${base}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify({
        messages: [{ topic: `partida:${mesa}`, event: evento, payload, private: true }],
      }),
      signal: AbortSignal.timeout(TOPE_AVISO_MS),
    })
    if (!r.ok) throw new Error(`Broadcast contestó ${r.status}`)
  }
}

export function crearEmisor(partes) {
  const difundir = crearDifusor(partes)
  return (mesa, version) => difundir(mesa, EVENTO_AVISO, { version })
}

/** v1.3 · el mensaje: el asiento (índice de la mesa) y la clave, y nada más. */
export function crearEmisorMensaje(partes) {
  const difundir = crearDifusor(partes)
  return (mesa, { asiento, clave }) => difundir(mesa, EVENTO_MENSAJE, { asiento, clave })
}

// ── Las sillas ──────────────────────────────────────────────────────────────
/** De una fila de `sala_jugadores` con `profiles(username)`, a lo que pide el árbitro. */
export function sillaDeFila({ asiento, jugador_id: uid, profiles }) {
  const perfil = Array.isArray(profiles) ? profiles[0] : profiles
  return { asiento, uid, nombre: perfil?.username ?? null }
}

// ── La jugada, sin red ──────────────────────────────────────────────────────
const vistasDe = (estado) => estado.asientos.map((_, asiento) => ({ asiento, vista: vistaDe(estado, asiento) }))

const horaDe = (vencimiento) => (vencimiento ? new Date(vencimiento.hora).toISOString() : null)

// Quien llama no es de la mesa: «no se aplica nada» (§2), tampoco los abandonos de los demás.
function aplicarAbandonos(estado, { uid }, abandonos, ahora) {
  const efectos = []
  if (!estado.asientos.some((a) => a.uid === uid)) return { estado, efectos }
  let actual = estado
  for (const asiento of abandonos ?? []) {
    const hecho = abandonarPorServidor(actual, actual.asientos[asiento]?.uid, { ahora })
    if (hecho.respuesta.ok) {
      actual = hecho.estado
      efectos.push(...hecho.efectos)
    } else if (!ABANDONO_TOLERADO.includes(hecho.respuesta.motivo)) {
      throw new Error(`abandono del asiento ${asiento}: ${hecho.respuesta.motivo}`)
    }
  }
  return { estado: actual, efectos }
}

// Síncrona de punta a punta: `setRng` es global del módulo y entre él y el árbitro no
// puede colarse otra petición.
//
// El cliente dice qué versión cree vigente, y esa es la leída: los abandonos que se
// aplican aquí no se la pueden dejar vieja.
function jugar(fila, peticion, { ahora, azar }) {
  const hora = ahora()
  setRng(azar)
  const previo = aplicarAbandonos(fila.estado, peticion, fila.abandonos, hora)
  const version = peticion.version === fila.version ? previo.estado.version : null
  const accion = aplicarAccion(previo.estado, { ...peticion, version }, { ahora: hora })

  if (accion.estado === fila.estado) return { aplicada: false, respuesta: accion.respuesta }
  const nueva = fila.version + 1
  return {
    aplicada: accion.respuesta.ok,
    estado: { ...accion.estado, version: nueva },
    efectos: [...previo.efectos, ...accion.efectos],
    respuesta: { ...accion.respuesta, version: nueva },
  }
}

// ── Lo que pasa con la base ─────────────────────────────────────────────────
async function avisar(deps, mesa, version) {
  try {
    await deps.emitir(mesa, version)
  } catch (e) {
    // El bus no manda (contrato §5): la jugada ya está guardada.
    deps.registrar(`MOT-1 1e: el aviso de la mesa ${mesa}, versión ${version}, falló —`, err(e))
  }
}

// §2, «Arranque»: una sala `activa` sin partida cuenta como vencimiento cumplido.
async function arrancar(deps, mesa, peticion) {
  const sala = await deps.leerSala(mesa)
  if (sala?.estado === 'terminada') return rechazo(M.PARTIDA_TERMINADA)
  if (sala?.estado !== 'activa' || peticion.accion !== 'reclamar_vencimiento' || peticion.version !== 0) {
    return rechazo(M.NO_ES_DE_ESTA_MESA)
  }
  const sillas = await deps.leerSillas(mesa)
  if (sillas.length < 2 || !sillas.some((s) => s.uid === peticion.uid)) return rechazo(M.NO_ES_DE_ESTA_MESA)

  setRng(deps.azar)
  const estado = crearPartida(sala, sillas, deps.ahora())
  const hecho = await deps.rpc('crear_partida', {
    p_sala: mesa,
    p_estado: estado,
    p_vencimiento: horaDe(estado.vencimiento),
    p_correspondencia: Object.fromEntries(estado.asientos.map((a, i) => [a.uid, i])),
    p_vistas: vistasDe(estado),
  })
  // `asientos_distintos`: alguien se levantó entre la lectura y este momento. El cliente
  // repite y `crear_partida` vuelve a mirar las sillas.
  if (!hecho.ok) return hecho.motivo === 'asientos_distintos' ? rechazo(M.VERSION_VIEJA, 0) : rechazo(M.NO_ES_DE_ESTA_MESA)
  // Otro llegó antes: «el segundo recibe `version_vieja` y no pasa nada» (§2).
  if (!hecho.creada) return rechazo(M.VERSION_VIEJA, hecho.version)

  await avisar(deps, mesa, hecho.version)
  return { ok: true, version: hecho.version }
}

function guardar(deps, mesa, versionLeida, jugada) {
  const { estado, efectos } = jugada
  return deps.rpc('guardar_jugada', {
    p_sala: mesa,
    p_version_leida: versionLeida,
    p_estado: estado,
    p_vencimiento: horaDe(estado.vencimiento),
    p_vistas: vistasDe(estado),
    p_terminada: partidaTerminada(estado),
    p_efectos: efectos,
  })
}

// ── El mensaje (v1.3, ruta B) ───────────────────────────────────────────────
// No pasa por `jugar`: no es una acción del árbitro, no escribe el estado ni sube la versión.
// El asiento sale del uid del token (`puedeMandarMensaje`); el freno de 10 s lo impone
// `anotar_mensaje`, atómico en SQL. Si el aviso falla, el mensaje se pierde y el freno queda
// anotado: es efímero, como el que se pierde quien se reconecta.
async function mandarMensaje(deps, mesa, uid, clave) {
  const [fila] = await deps.rpc('leer_partida', { p_sala: mesa })
  if (!fila) return rechazo(M.NO_ES_DE_ESTA_MESA)
  const puede = puedeMandarMensaje(fila.estado, uid, clave)
  if (!puede.ok) return rechazo(puede.motivo, fila.version)
  const anotado = await deps.rpc('anotar_mensaje', { p_sala: mesa, p_uid: uid })
  if (!anotado?.ok) return rechazo(anotado?.motivo ?? M.NO_ES_DE_ESTA_MESA, fila.version)
  try {
    await deps.emitirMensaje(mesa, { asiento: puede.asiento, clave })
  } catch (e) {
    deps.registrar(`MES-PvP v1.3: el mensaje de la mesa ${mesa}, asiento ${puede.asiento}, falló —`, err(e))
  }
  return { ok: true, version: fila.version }
}

async function recorrer(deps, uid, cuerpo) {
  const { mesa, ...campos } = cuerpo
  if (typeof mesa !== 'string' || !UUID.test(mesa)) return rechazo(M.NO_ES_DE_ESTA_MESA)
  if (campos.accion === 'mensaje') return mandarMensaje(deps, mesa, uid, campos.clave)
  // El `uid` del token, el último: si el cuerpo trae otro, no cuenta.
  const peticion = { ...campos, uid }

  for (let intento = 1; ; intento += 1) {
    const [fila] = await deps.rpc('leer_partida', { p_sala: mesa })
    if (!fila) return arrancar(deps, mesa, peticion)

    const jugada = jugar(fila, peticion, deps)
    if (!jugada.estado) return jugada.respuesta

    const guardado = await guardar(deps, mesa, fila.version, jugada)
    if (guardado.ok) {
      await avisar(deps, mesa, guardado.version)
      return jugada.respuesta
    }
    if (guardado.motivo === 'sin_partida') return rechazo(M.NO_ES_DE_ESTA_MESA)
    if (guardado.motivo === M.PARTIDA_TERMINADA) return rechazo(M.PARTIDA_TERMINADA, guardado.version)
    // Solo llevaba abandonos: los hará la llamada siguiente, y el rechazo de la acción sigue valiendo.
    if (!jugada.aplicada) return { ...jugada.respuesta, version: guardado.version }
    const reintenta = SIMULTANEAS.includes(peticion.accion) && intento < INTENTOS_SIMULTANEAS
    if (!reintenta) return rechazo(M.VERSION_VIEJA, guardado.version)
  }
}

// ── La puerta ───────────────────────────────────────────────────────────────
const tokenDe = (req) => {
  const cab = req.headers.get('Authorization') ?? ''
  return cab.startsWith('Bearer ') ? cab.slice(7).trim() : ''
}

// Un cuerpo que no es JSON no lleva `mesa`, y eso ya tiene motivo.
const cuerpoDe = async (req) => {
  const cuerpo = await req.json().catch(() => null)
  return cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo) ? cuerpo : {}
}

/**
 * @param {{
 *   verificarToken: (token: string) => Promise<string|null>,
 *   rpc: (nombre: string, args: object) => Promise<any>,
 *   leerSala: (mesa: string) => Promise<{ estado: string, apuesta: number, entrada: string, ritmo: string }|null>,
 *   leerSillas: (mesa: string) => Promise<{ asiento: number, uid: string, nombre: string|null }[]>,
 *   emitir: (mesa: string, version: number) => Promise<void>,
 *   emitirMensaje: (mesa: string, mensaje: { asiento: number, clave: string }) => Promise<void>,
 *   registrar?: (...cosas: unknown[]) => void,
 *   ahora?: () => number,
 *   azar?: () => number,
 * }} partes
 * @returns {(req: Request) => Promise<Response>} lo que recibe `Deno.serve`
 */
export function crearManejador(partes) {
  const deps = { registrar: console.error, ahora: () => Date.now(), azar: azarSeguro, ...partes }

  return async (req) => {
    const cors = cabecerasCors(req.headers.get('Origin'))
    // `ahora` en toda respuesta (§2): el cliente corrige con ella el desfase de su reloj.
    const responder = (status, cuerpo) => new Response(JSON.stringify({ ...cuerpo, ahora: deps.ahora() }), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    })

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (req.method !== 'POST') return responder(405, rechazo('metodo'))

    try {
      const token = tokenDe(req)
      const uid = token ? await deps.verificarToken(token) : null
      if (!uid) return responder(401, rechazo(M.NO_AUTENTICADO))
      return responder(200, await recorrer(deps, uid, await cuerpoDe(req)))
    } catch (e) {
      deps.registrar('MOT-1 1e: error inesperado —', err(e))
      return responder(500, rechazo('servidor'))
    }
  }
}
