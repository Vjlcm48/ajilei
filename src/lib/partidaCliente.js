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
// MES-PvP 2 · EL RELOJ DEL TELÉFONO NO ES EL DEL SERVIDOR. Toda respuesta trae `ahora`, y
// con ella se corrige el desfase (`desfaseDe`). Y para que cinco asientos no reclamen a la
// vez el mismo vencimiento, cada uno espera su escalón.
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
export const CLASE_TURNO = 'turno'
export const CLASE_DESCARTE = 'descarte'
export const CLASE_ELECCION = 'eleccion_sorteo'
export const CLASE_BARAJADO = 'barajado'
export const CLASE_REPOSICION = 'reposicion'
export const CLASE_AVISO_SALIDA = 'aviso_salida'
export const CLASE_MANO_SIGUIENTE = 'mano_siguiente'

export const MARGEN_VENCIMIENTO_MS = 300
export const ESCALON_RECLAMO_MS = 200
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

// ── El desfase ──────────────────────────────────────────────────────────────
// Una muestra por respuesta: `desfase = ahora + rtt/2 − local`. Se usa la de menor rtt de
// las últimas, no un promedio. El error de una muestra está acotado por su rtt/2 (la red
// no es simétrica, y `ahora` se toma al responder, tras el trabajo de la función), así que
// la más rápida es la mejor, y promediar solo mezclaría el ruido de las lentas. Como la
// ventana se renueva, si el teléfono cambia de hora se corrige en `VENTANA_DESFASE` respuestas.
export const VENTANA_DESFASE = 8

export const desfaseDe = (muestras) => (
  muestras.length === 0 ? 0 : muestras.reduce((mejor, m) => (m.rtt < mejor.rtt ? m : mejor)).desfase
)

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
    msAccion: null, msAviso: null, msEco: null, rechazo: null, desfase: 0, muerta: false,
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
  let muestras = []
  let terminada = false

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
      // El servidor dijo `partida_terminada`: si tras releer la vista sigue viva, no terminó
      // en una mano. Murió (contrato §6). Si otro teléfono la acabó, ya se ve `GAME_OVER`.
      if (terminada && !foto.muerta && foto.vista && foto.vista.phase !== FASE_FIN) poner({ muerta: true })
    } catch (e) {
      console.warn('MOT-1 1f: no se pudo leer la vista —', String(e?.message ?? e))
    } finally {
      leyendo = false
    }
  }

  // ── Mandar ──
  function anotarDesfase(servidor, salio) {
    if (typeof servidor !== 'number') return
    const llego = ahora()
    const rtt = llego - salio
    muestras = [...muestras, { rtt, desfase: Math.round(servidor + rtt / 2 - llego) }].slice(-VENTANA_DESFASE)
    const desfase = desfaseDe(muestras)
    if (desfase !== foto.desfase) poner({ desfase })
  }

  async function llamar(cuerpo) {
    try {
      const { data: { session } = {} } = await cliente.auth.getSession()
      if (!session?.access_token) return fallo(M.NO_AUTENTICADO)
      const salio = ahora()
      const { data, error } = await cliente.functions.invoke(FUNCION_PARTIDA, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { mesa, ...cuerpo },
      })
      if (error && error.name !== 'FunctionsHttpError') return fallo('red')
      // El 401 y el 500 de la función también traen `{ ok, motivo, version }`.
      const r = error ? await Promise.resolve().then(() => error.context.json()).catch(() => null) : data
      if (!r) return fallo('servidor')
      anotarDesfase(r.ahora, salio)
      return r
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
    if (r.motivo === M.PARTIDA_TERMINADA) terminada = true
    if (hayNueva(r) || r.motivo === M.VERSION_VIEJA || terminada) await leer()
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
    // Con el canal caído no llega ningún aviso: se relee por si acaso (el bus no manda).
    const viva = !detenido && foto.vista.phase !== FASE_FIN
    if (viva && foto.canal !== 'SUBSCRIBED' && t - ultimaLectura >= RELECTURA_MS) leer()

    const v = foto.vista.vencimiento
    const margen = MARGEN_VENCIMIENTO_MS + foto.vista.asiento * ESCALON_RECLAMO_MS
    if (!v || t + foto.desfase < v.hora + margen) return
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
    terminada = false
    if (foto.muerta) poner({ muerta: false })
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
