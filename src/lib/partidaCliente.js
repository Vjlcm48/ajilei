// ── MOT-1 1f · El cliente de la partida ─────────────────────────────────────
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §2 y §5. Ficha: AJILEI_MOT-1_Fase1f_v1.0.md §2.
//
// Tres cosas y nada más: mandar una acción a la función `partida`, leer la vista
// propia y escuchar el canal privado de la mesa. No decide reglas ni guarda dinero:
// el servidor manda, y aquí solo se le pregunta. Nace en el trozo de la partida
// (`trozos.partidaPvP`), nunca en la entrada (INV-84).
//
// EL BUS NO MANDA. El aviso solo adelanta la relectura: también se relee al volver a
// primer plano, al quedar suscrito y si el vencimiento se cumplió y nadie avisa. Un
// aviso perdido cuesta unos segundos, no la partida.
//
// EL RELOJ LO MUEVEN LOS TELÉFONOS (K-7). Con la hora cumplida, cada cliente reclama, y
// el servidor decide con su reloj. Si dos reclaman a la vez, uno recibe `version_vieja`.
//
// EL CLIENTE ENTRA POR PARÁMETRO, como en `crearSalasApi`: las pruebas le pasan un doble
// y no se abre ningún socket.

import { MOTIVOS as M } from '../arbitro/motivos.js'

export const FUNCION_PARTIDA = 'partida'
// Literales de contrato, sin importarlos: `supabase/functions/partida/nucleo.js` y
// `arbitro/vista.js` arrastran el motor. `partidaCliente.test.js` comprueba que coinciden.
export const EVENTO_AVISO = 'version'
export const FASE_SORTEO = 'SORTEO'
export const FASE_DESCARTE = 'DISCARD'
export const FASE_FIN = 'GAME_OVER'
export const ETAPA_ELECCION = 'eleccion'
export const CLASE_PAUSA_ANUNCIO = 'pausa_anuncio'

export const MARGEN_VENCIMIENTO_MS = 300
export const REINTENTO_RECLAMO_MS = 1000
export const RELECTURA_MS = 3000
export const REVISION_MS = 250

// Se toleran en silencio (ficha §2): el reloj del teléfono y el del servidor no son el
// mismo, y otro teléfono pudo reclamar antes.
const TOLERADOS = [M.VENCIMIENTO_NO_CUMPLIDO, M.VERSION_VIEJA]
// Lo único que se reintenta sin que nadie toque nada. El resto (partida terminada, no
// es de esta mesa…) no se arregla repitiendo: se enseña y se deja de reclamar.
const PASAJEROS = ['red', 'servidor']

const fallo = (motivo) => ({ ok: false, motivo, version: null })

// ── La marca del panel de prueba ────────────────────────────────────────────
// `?mot1=1` la enciende y `?mot1=0` la apaga. Vive en el trozo de la partida, así que
// se lee al llegar a esta pantalla y no al abrir la app: con la marca ya guardada no
// hace falta el parámetro; la primera vez, sí.
const CLAVE_MARCA = 'ajilei.mot1'

export function leerMarcaMot1() {
  const pedida = new URLSearchParams(globalThis.location?.search ?? '').get('mot1')
  try {
    if (pedida === '1') globalThis.localStorage.setItem(CLAVE_MARCA, '1')
    if (pedida === '0') globalThis.localStorage.removeItem(CLAVE_MARCA)
    if (pedida === null) return globalThis.localStorage.getItem(CLAVE_MARCA) === '1'
  } catch {
    // Sin almacenamiento, la marca vale mientras siga en la dirección.
  }
  return pedida === '1'
}

// ── El cliente ──────────────────────────────────────────────────────────────
/**
 * @param {{ cliente: object, mesa: string, ahora?: () => number, documento?: object|null }} partes
 * @returns {{
 *   iniciar: () => Promise<void>, parar: () => void, revisar: () => void,
 *   enviar: (accion: string, campos?: object) => Promise<object>, releer: () => Promise<void>,
 *   suscribir: (avisar: () => void) => () => void, foto: () => object,
 * }}
 */
export function crearClientePartida({ cliente, mesa, ahora = Date.now, documento = globalThis.document ?? null }) {
  let foto = Object.freeze({
    vista: null, version: null, canal: 'SIN_ABRIR', avisos: 0,
    msAccion: null, msAviso: null, msEco: null, rechazo: null,
  })
  const oyentes = new Set()
  const poner = (cambios) => {
    foto = Object.freeze({ ...foto, ...cambios })
    oyentes.forEach((o) => o())
  }

  let generacion = 0
  let vivo = false
  let canal = null
  let reloj = null
  let leyendo = false
  let otraVez = false
  let leida = false
  let ultimaLectura = -Infinity
  let reclamando = false
  let proximoReclamo = -Infinity
  let detenido = false
  let avisoPendiente = null
  let ultimoAviso = null
  let ecoPendiente = null

  // ── Leer ──
  // Una lectura a la vez. Lo que se pida mientras tanto repite al acabar: el aviso de
  // la versión N+1 puede llegar con la lectura de la N ya en el aire.
  const aplicarFila = (fila) => {
    leida = true
    const cambios = {}
    if (fila && fila.version > (foto.version ?? -1)) {
      cambios.version = fila.version
      cambios.vista = fila.vista
    }
    if (fila && avisoPendiente && fila.version >= avisoPendiente.version) {
      cambios.msAviso = ahora() - avisoPendiente.en
      avisoPendiente = null
    }
    if (Object.keys(cambios).length > 0) poner(cambios)
  }

  async function leer() {
    if (leyendo) { otraVez = true; return }
    leyendo = true
    const yo = generacion
    try {
      do {
        otraVez = false
        ultimaLectura = ahora()
        const { data, error } = await cliente
          .from('partida_vistas')
          .select('version, asiento, vista')
          .eq('sala_id', mesa)
          .maybeSingle()
        if (yo !== generacion) return
        ultimaLectura = ahora()
        if (error) console.warn('MOT-1 1f: no se pudo leer la vista —', error.message ?? error)
        else aplicarFila(data)
      } while (otraVez)
    } catch (e) {
      console.warn('MOT-1 1f: no se pudo leer la vista —', String(e?.message ?? e))
    } finally {
      leyendo = false
    }
  }

  // ── Mandar ──
  async function llamar(cuerpo) {
    try {
      const { data: { session } = {} } = await cliente.auth.getSession()
      if (!session?.access_token) return fallo(M.NO_AUTENTICADO)
      const { data, error } = await cliente.functions.invoke(FUNCION_PARTIDA, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { mesa, ...cuerpo },
      })
      if (!error) return data ?? fallo('servidor')
      if (error.name !== 'FunctionsHttpError') return fallo('red')
      // El 401 y el 500 de la función también traen `{ ok, motivo, version }`.
      return (await Promise.resolve().then(() => error.context.json()).catch(() => null)) ?? fallo('servidor')
    } catch (e) {
      console.warn('MOT-1 1f: la función no contestó —', String(e?.message ?? e))
      return fallo('red')
    }
  }

  const hayNueva = (r) => typeof r.version === 'number' && r.version > (foto.version ?? -1)

  async function reclamar() {
    reclamando = true
    proximoReclamo = ahora() + REINTENTO_RECLAMO_MS
    const yo = generacion
    const r = await llamar({ accion: 'reclamar_vencimiento', version: foto.version ?? 0 })
    if (yo !== generacion) return
    reclamando = false
    if (!r.ok && !TOLERADOS.includes(r.motivo)) {
      if (!PASAJEROS.includes(r.motivo)) detenido = true
      poner({ rechazo: { accion: 'reclamar_vencimiento', motivo: r.motivo } })
    }
    if (hayNueva(r) || r.motivo === M.VERSION_VIEJA) await leer()
  }

  /** Una acción del jugador: la mide y deja su rechazo a la vista. */
  async function enviar(accion, campos = {}) {
    const enviadaEn = ahora()
    const r = await llamar({ accion, version: foto.version ?? 0, ...campos })
    const cambios = { msAccion: ahora() - enviadaEn }
    if (!r.ok) cambios.rechazo = { accion, motivo: r.motivo }
    if (r.ok && ultimoAviso?.version === r.version && ultimoAviso.en >= enviadaEn) {
      cambios.msEco = ultimoAviso.en - enviadaEn
    } else if (r.ok) {
      ecoPendiente = { version: r.version, enviadaEn }
    }
    poner(cambios)
    if (hayNueva(r) || r.motivo === M.VERSION_VIEJA) await leer()
    return r
  }

  // ── Escuchar ──
  function alAviso(version) {
    if (typeof version !== 'number') return
    const en = ahora()
    ultimoAviso = { version, en }
    const cambios = { avisos: foto.avisos + 1 }
    if (ecoPendiente?.version === version) {
      cambios.msEco = en - ecoPendiente.enviadaEn
      ecoPendiente = null
    }
    poner(cambios)
    if (version <= (foto.version ?? -1)) return
    avisoPendiente = { version, en: avisoPendiente?.en ?? en }
    leer()
  }

  const alVolver = () => {
    if (documento?.visibilityState !== 'visible') return
    leer()
    revisar()
  }

  async function abrirCanal(yo) {
    try {
      const { data: { session } = {} } = await cliente.auth.getSession()
      if (yo !== generacion) return
      if (!session?.access_token) { poner({ canal: 'SIN_SESION' }); return }
      // Un canal privado se autoriza con el token que lleve el cliente de Realtime al
      // entrar: la política de `realtime.messages` mira `auth.uid()`.
      await cliente.realtime.setAuth(session.access_token)
      if (yo !== generacion) return
      canal = cliente
        .channel(`partida:${mesa}`, { config: { private: true } })
        .on('broadcast', { event: EVENTO_AVISO }, ({ payload }) => alAviso(payload?.version))
        .subscribe((estado, error) => {
          if (yo !== generacion) return
          if (error) console.warn('MOT-1 1f: el canal —', estado, String(error?.message ?? error))
          poner({ canal: estado })
          // Lo que pasó antes de quedar suscrito no avisó a nadie.
          if (estado === 'SUBSCRIBED') leer()
        })
    } catch (e) {
      console.warn('MOT-1 1f: no se pudo abrir el canal —', String(e?.message ?? e))
      poner({ canal: 'SIN_ABRIR' })
    }
  }

  // ── El reloj ──
  function revisar() {
    if (!vivo) return
    const t = ahora()
    const toca = () => !detenido && !reclamando && t >= proximoReclamo

    if (!foto.vista) {
      if (!leida) {
        if (t - ultimaLectura >= RELECTURA_MS) leer()
      } else if (toca()) {
        // §2, «Arranque»: a esta pantalla solo se llega con la sala `activa`, y una sala
        // activa sin partida cuenta como vencimiento cumplido.
        reclamar()
      }
      return
    }

    // Un aviso cuya lectura no trajo su versión: se insiste sin esperar a otro aviso.
    if (avisoPendiente && t - ultimaLectura >= RELECTURA_MS) leer()

    const v = foto.vista.vencimiento
    if (!v || t < v.hora + MARGEN_VENCIMIENTO_MS) return
    if (t - ultimaLectura >= RELECTURA_MS) leer()
    // El árbitro rechaza al abandonado con `asiento_abandonado`: no reclama (§2).
    const propio = foto.vista.players?.[foto.vista.asiento]
    if (!propio?.abandonado && toca()) reclamar()
  }

  // ── Lo público ──
  async function iniciar() {
    generacion += 1
    const yo = generacion
    vivo = true
    leyendo = false
    reclamando = false
    reloj = setInterval(revisar, REVISION_MS)
    documento?.addEventListener?.('visibilitychange', alVolver)
    await Promise.all([leer(), abrirCanal(yo)])
  }

  function parar() {
    generacion += 1
    vivo = false
    clearInterval(reloj)
    documento?.removeEventListener?.('visibilitychange', alVolver)
    if (canal) cliente.removeChannel(canal)
    canal = null
  }

  async function releer() {
    detenido = false
    await leer()
  }

  return {
    iniciar,
    parar,
    revisar,
    enviar,
    releer,
    suscribir: (avisar) => {
      oyentes.add(avisar)
      return () => oyentes.delete(avisar)
    },
    foto: () => foto,
  }
}
