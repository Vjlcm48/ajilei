import {
  TIPOS, CODIGOS, DESTINOS, destinoDe, colaNueva, encolarPila, encolarRecarga, encolarSalida,
  proximo, enviando, alResponder, anotarPila,
} from '../hooks/mesaIACore'

// ── ECO-1c · El canal de UNA mesa contra las IAS con el servidor ────────────
// Rector: AJILEI_ECO-1_Fase1c_v1.0.md §2.2 y el plan aprobado del STOP-1 (§1,
// §3). Une la cola pura (`hooks/mesaIACore.js`) con la API (`mesaIAApi.js`):
// manda lo siguiente cuando no hay nada en vuelo, reintenta lo mismo si la red
// no contesta, y avisa a quien escuche de lo que pasa.
//
// ── POR QUÉ NO ES UN HOOK DE LA MESA ────────────────────────────────────────
// Lo crea `App` al sentarse y lo guarda en un `ref`, no `GameTable`. La mesa se
// desmonta en cuanto el jugador sale (la salida no espera a la red: el plan del
// STOP-1 §3), y la salida —y los avisos que lleve delante— se tienen que seguir
// mandando después. Si la página se cierra con algo pendiente, la mesa queda
// abierta con su última pila avisada y la recoge el arranque (P-4) o la regla
// C4 al sentarse otra vez.
//
// ── LA RECARGA QUE CONTESTA CUANDO LA MESA YA NO ESTÁ ──────────────────────
// Una recarga cuya respuesta se perdió puede haberse cobrado. Por eso no se
// abandona nunca: se reintenta con su `seq` hasta tener respuesta (el servidor
// es idempotente por `seq`). La salida que se pida mientras la espera detrás,
// y lo que haga con sus fichas lo decide el núcleo (`alResponder`, P-2a).
//
// Los reintentos esperan 1, 2, 4, 8 y luego 15 s; `reintentarAhora` (volver a
// primer plano) se salta la espera. Con `{ forzar: true }` (el «Reintentar» de
// la tarjeta tras el tope de P-2b) vuelve a mandar también lo que sigue EN
// VUELO sin contestar: una petición colgada no falla, y sin esto el botón no
// haría nada. Es el mismo `seq`, así que no cobra dos veces; de las dos
// respuestas cuenta la primera, y el fallo de un envío ya reemplazado no
// programa otro reintento.
//
// IOS-1c · con `{ forzarTrasMs }` (volver a primer plano) se fuerza sólo lo que
// lleve EN VUELO más de ese tiempo: lo colgado de verdad, no lo que acaba de
// salir. Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.2.

export const ESPERAS_RED_MS = Object.freeze([1000, 2000, 4000, 8000, 15000])

/**
 * @param {object} o
 * @param {object} o.api       la de `crearMesaIAApi`
 * @param {string} o.mesaId
 * @param {number} o.pilaInicial  la entrada: lo que el servidor ya sabe (seq 0)
 * @param {object} [o.reloj]   `setTimeout`/`clearTimeout` y, si lo trae, `now()` (las pruebas dan uno falso)
 */
export function crearControlMesa({ api, mesaId, pilaInicial, reloj = globalThis }) {
  let cola = colaNueva(pilaInicial)
  let espera = null
  let intentos = 0
  let terminado = false
  let ultimaRespuesta = null
  let salida = null
  let envio = 0              // el número del último envío: los anteriores ya no mandan
  let enviadoEn = null       // IOS-1c · cuándo salió lo que está en vuelo
  const ahora = () => (typeof reloj.now === 'function' ? reloj.now() : Date.now())
  const oyentes = new Set()

  const emitir = (ev) => {
    for (const f of oyentes) {
      try { f(ev) } catch (e) { console.error('ECO-1c: un oyente de la mesa falló', e) }
    }
  }

  function mandar(it) {
    if (it.tipo === TIPOS.AVISO) return api.informar(mesaId, it.seq, it.pila, it.fin)
    if (it.tipo === TIPOS.RECARGA) return api.recargar(mesaId, it.monto, it.seq)
    return api.salir(mesaId, it.fichas, it.seq)
  }

  function bombear() {
    if (espera !== null || terminado) return
    const it = proximo(cola)
    if (!it) return
    cola = enviando(cola, it.seq)
    const id = ++envio
    enviadoEn = ahora()
    mandar(it).then((r) => responder(it, r ?? { codigo: CODIGOS.RED }, id))
  }

  function terminar(r) {
    terminado = true
    ultimaRespuesta = r
    if (espera !== null) { reloj.clearTimeout(espera); espera = null }
    salida?.resolver(r)
  }

  function responder(it, r, id) {
    if (terminado) return
    // El fallo de un envío que un reintento forzado ya reemplazó: el nuevo sigue
    // en vuelo y contestará él.
    if (id !== envio && destinoDe(r.codigo) === DESTINOS.REINTENTAR) return
    const res = alResponder(cola, it.seq, r.codigo)
    // Ya no estaba pendiente: la otra respuesta del mismo `seq` llegó antes.
    if (res.destino === null) return
    cola = res.cola

    if (res.destino === DESTINOS.REINTENTAR) {
      emitir({ tipo: 'red', item: it })
      const ms = ESPERAS_RED_MS[Math.min(intentos, ESPERAS_RED_MS.length - 1)]
      intentos += 1
      espera = reloj.setTimeout(() => { espera = null; bombear() }, ms)
      return
    }
    intentos = 0

    if (res.destino === DESTINOS.CERRADA) {
      // C6 · la cerró otro dispositivo (o el arranque de otro): su dinero ya
      // volvió a la billetera, y la respuesta trae el saldo y lo cobrado.
      terminar(r)
      emitir({ tipo: 'cerrada', respuesta: r, item: it })
      return
    }

    if (it.tipo === TIPOS.RECARGA) {
      const ok = res.destino === DESTINOS.HECHO
      if (ok) cola = anotarPila(cola, r.pila)
      emitir({ tipo: 'recarga', seq: it.seq, monto: it.monto, ok, respuesta: r })
    }

    if (it.tipo === TIPOS.SALIDA) {
      terminar(r)
      emitir({ tipo: 'salida', respuesta: r })
      return
    }

    bombear()
  }

  return {
    mesaId,
    /** La pila del humano cambió, o terminó una mano (`fin`). */
    pila(p, fin = null) {
      if (terminado || salida) return
      cola = encolarPila(cola, p, fin)
      bombear()
    },
    /** Pide una recarga y devuelve su `seq`; el resultado llega por `suscribir`. */
    recargar(monto) {
      if (terminado || salida) return null
      cola = encolarRecarga(cola, monto)
      const seq = cola.seq
      bombear()
      return seq
    },
    /**
     * Cobra la salida. Idempotente: la segunda llamada devuelve la MISMA
     * promesa (la ✕ y el vencimiento del plazo en el mismo fotograma, o la
     * celebración que ya cobró y su botón «Salir»). La promesa se resuelve con
     * la respuesta definitiva; mientras la red no conteste, sigue pendiente y
     * se reintenta sola.
     */
    salir(fichas) {
      if (salida) return salida.promesa
      let resolver
      const promesa = new Promise((r) => { resolver = r })
      salida = { promesa, resolver }
      if (terminado) { resolver(ultimaRespuesta); return promesa }
      cola = encolarSalida(cola, fichas)
      bombear()
      return promesa
    },
    reintentarAhora({ forzar = false, forzarTrasMs = null } = {}) {
      if (terminado) return
      const colgado = forzarTrasMs !== null && enviadoEn !== null && ahora() - enviadoEn >= forzarTrasMs
      if (espera !== null) {
        reloj.clearTimeout(espera)
        espera = null
      } else if ((forzar || colgado) && cola.enVuelo !== null) {
        cola = { ...cola, enVuelo: null }
      } else {
        return
      }
      bombear()
    },
    suscribir(f) {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    get terminado() { return terminado },
    /** ¿Ya se pidió la salida? (el jugador se levantó: C6 ya no lo saca de ninguna pantalla) */
    get saliendo() { return salida !== null },
    get pendientes() { return cola.pendientes.length },
    get esperandoRed() { return espera !== null },
    destruir() {
      if (espera !== null) reloj.clearTimeout(espera)
      espera = null
      oyentes.clear()
    },
  }
}
