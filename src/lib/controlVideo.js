import { ESTADOS } from './reproductor'
import {
  estadoTras, alPedir, AL_PEDIR, alCobrar, AL_COBRAR, cobroSalible, celebracionDe, sinVideosHoy,
} from '../hooks/videoCore'

// ── ECO-1g · El canal del video de recompensa con el servidor ───────────────
// Rector: AJILEI_ECO-1_Fase1g_v1.0.md §2.2 y el plan aprobado del STOP-1 (§3 a
// §6), con las respuestas P-1 a P-4. Es LO DE FUERA del reproductor: pide el
// boleto, deja correr el video, cobra el boleto y decide qué se ve después.
//
//   tocar → `pedir_boleto` → el reproductor (~40 s visibles) → `cobrar_boleto`
//         → la celebración
//
// EL TELÉFONO NUNCA DECIDE CUÁNTO COBRA. El saldo es el que devuelve el cobro
// (`tomarSaldo`), y el premio que se celebra y se pinta es el que dice el
// servidor (`premio`); el del espejo sólo mientras no ha contestado.
//
// ── POR QUÉ NO ES UN HOOK ───────────────────────────────────────────────────
// Molde de `controlMesaIA`: un objeto sin React, creado UNA vez en `App`. Así
// `App` no se repinta con cada cambio del video (sólo lo hace `MarcoVideo`,
// que se suscribe), puede preguntar `ocupado()` desde un manejador, y la regla
// entera se prueba en Vitest con una API y un reloj falsos.
//
// ── K7 · EL COBRO NO SE ABANDONA SOLO ───────────────────────────────────────
// Con `limite` o sin red, se reintenta EL MISMO boleto (1, 2, 4, 8 y luego 15 s)
// hasta tener respuesta. P-2: durante la primera tanda la ✕ no está; si tras
// ella el cobro sigue sin entrar, `salible` pasa a verdadero y «Salir» lo
// abandona: el video se pierde sin contar. Si la respuesta de un cobro se
// perdió pero el cobro entró, el reintento recibe `ya_cobrado` con el saldo ya
// subido (S3) y se celebra igual, una vez.

export const FASES_CONTROL = Object.freeze({
  PIDIENDO: 'pidiendo',   // `pedir_boleto` en vuelo: nada a la vista todavía
  VIENDO: 'viendo',       // el reproductor tiene la pantalla
  COBRANDO: 'cobrando',   // «Guardando tu premio…»
  SIN: 'sin',             // el mensaje «Ahora no hay videos disponibles»
})

// La foto que leen las piezas que pintan. `en` es el instante (reloj local) en
// que se tomó: «Vuelven en…» se resta contra él y no contra un reloj leído en
// el render.
//
// TIE-1 1a · sale `hoja`: la hoja «Conseguir monedas» del «+» se retiró (el «+»
// abre la tienda en el estante Monedas, que llama a `mirar` al montarse), y con
// ella `abrirHoja` y `cerrarHoja`.
const FOTO_VACIA = Object.freeze({ estado: null, fase: null, salible: false, cel: null, en: 0 })

/**
 * @param {object} o
 * @param {object} o.api          la de `crearVideoApi`
 * @param {object} o.reproductor  la costura (`lib/reproductor`)
 * @param {number} o.duracionMs   los ~40 s visibles (`ajileiConfig`)
 * @param {number} o.premioEspejo `videoReward`: sólo si el servidor no dijo el suyo
 * @param {object|null} [o.mandos] SÓLO desarrollo (`?apu=video:`): `{ duracionMs }`,
 *   `{ disponible: false }` o `{ cierra: true }`
 * @param {object} [o.reloj]      `setTimeout`/`clearTimeout` (las pruebas dan uno falso)
 * @param {() => number} [o.ahora]
 * @param {() => void} [o.precargar]  lo que se pide por adelantado al tocar (el sonido del cobro)
 */
export function crearControlVideo({
  api, reproductor, duracionMs, premioEspejo, mandos = null,
  reloj = globalThis, ahora = () => Date.now(), precargar = () => {},
}) {
  let foto = FOTO_VACIA
  let cuenta = null
  let generacion = 0        // sube al cambiar de cuenta: lo que conteste después ya no es de nadie
  let abiertos = 0          // los videos abiertos en esta carga de página (rota el primer consejo)
  let serieCel = 0
  let mirando = false
  let cobro = null          // { abandonado, despertar } — el cobro en curso
  let enchufes = { tomarSaldo: () => {}, alLibre: () => {} }
  const oyentes = new Set()

  const ocupadoEn = (f) => f.fase !== null || f.cel !== null

  function fija(parcial) {
    const antes = ocupadoEn(foto)
    foto = { ...foto, ...parcial, en: ahora() }
    for (const fn of oyentes) {
      try { fn() } catch (e) { console.error('ECO-1g: un oyente del video falló', e) }
    }
    // Lo que se pospuso mientras había un video (la constancia) toca ahora.
    if (antes && !ocupadoEn(foto)) enchufes.alLibre()
  }
  const liberar = (parcial = {}) => fija({ ...parcial, fase: null, salible: false })

  function dormir(ms, mio) {
    return new Promise((ok) => {
      const id = reloj.setTimeout(() => { mio.despertar = null; ok() }, ms)
      mio.despertar = () => { reloj.clearTimeout(id); mio.despertar = null; ok() }
    })
  }

  // ── `mi_video`: lo que pinta el contador ──────────────────────────────────
  // Se pregunta cuando hace falta (al abrir el estante Monedas de la tienda, al
  // salir el bloque de Retar), no al arrancar: sin límite y sin efectos.
  function mirar() {
    if (mirando || cuenta === null) return
    mirando = true
    const g = generacion
    api.estado().then((r) => {
      mirando = false
      if (g !== generacion) return
      const estado = estadoTras(foto.estado, r, ahora())
      if (estado !== foto.estado) fija({ estado })
    })
  }

  async function cobrar(boletoId, g) {
    const mio = { abandonado: false, despertar: null }
    cobro = mio
    fija({ fase: FASES_CONTROL.COBRANDO, salible: false })
    let reintentos = 0
    for (;;) {
      const r = await api.cobrar(boletoId)
      if (g !== generacion || mio.abandonado) return
      const estado = estadoTras(foto.estado, r, ahora())
      const d = alCobrar(r, reintentos)
      if (d.accion === AL_COBRAR.CELEBRAR) {
        cobro = null
        // La billetera toma el saldo devuelto, sin relectura. La píldora no
        // salta: mientras dura la celebración enseña la cifra que cuenta.
        enchufes.tomarSaldo(r.saldo)
        fija({ estado, fase: null, salible: false, cel: { id: ++serieCel, ...celebracionDe(r, premioEspejo) } })
        return
      }
      if (d.accion === AL_COBRAR.TOPE) { cobro = null; liberar({ estado }); return }
      if (d.accion === AL_COBRAR.SIN) { cobro = null; fija({ estado, fase: FASES_CONTROL.SIN, salible: false }); return }
      const salible = d.accion === AL_COBRAR.REINTENTAR && cobroSalible(reintentos)
      if (estado !== foto.estado || salible !== foto.salible) fija({ estado, salible })
      await dormir(d.esperaMs, mio)
      if (g !== generacion || mio.abandonado) return
      if (d.accion === AL_COBRAR.REINTENTAR) reintentos += 1
    }
  }

  async function pedir() {
    if (cuenta === null || ocupadoEn(foto) || sinVideosHoy(foto.estado)) return
    const g = generacion
    fija({ fase: FASES_CONTROL.PIDIENDO })
    // PES-1 §3-B · el reloj del video no arranca sin sus capas: con red lenta, el
    // jugador vería menos video del que se le cuenta. Si el trozo falla, sigue.
    const [r] = await Promise.all([api.pedir(), Promise.resolve(precargar()).catch(() => {})])
    if (g !== generacion) return
    const estado = estadoTras(foto.estado, r, ahora())
    const que = alPedir(r)
    if (que === AL_PEDIR.TOPE) { liberar({ estado }); return }
    if (que === AL_PEDIR.SIN) { fija({ estado, fase: FASES_CONTROL.SIN }); return }

    // El boleto vence en el reloj del SERVIDOR; el reproductor mira el local.
    const caducaEn = Number.isFinite(r.venceEn) ? r.venceEn - (estado?.desfase ?? 0) : null
    const vistos = estado && Number.isFinite(estado.tope) ? estado.tope - estado.quedan : 0
    fija({ estado, fase: FASES_CONTROL.VIENDO })
    const fin = await reproductor.empezar({
      disponible: mandos?.disponible !== false,
      duracionMs: mandos?.duracionMs ?? duracionMs,
      caducaEn,
      inicio: vistos + abiertos++,
      cierraSolo: mandos?.cierra === true,
    })
    if (g !== generacion) return
    // G2 · tres finales. Sin video y cerrado antes: ni cobra ni cuenta (el
    // boleto queda sin cobrar y lo anula el siguiente pedido).
    if (fin.estado === ESTADOS.NO_DISPONIBLE) { fija({ fase: FASES_CONTROL.SIN }); return }
    if (fin.estado !== ESTADOS.COMPLETADO) { liberar(); return }
    await cobrar(r.boletoId, g)
  }

  return {
    /** La costura que este canal usa: `MarcoVideo` monta la capa de ESTE reproductor. */
    reproductor,
    suscribir(fn) { oyentes.add(fn); return () => oyentes.delete(fn) },
    leer: () => foto,
    /** ¿Hay un video pedido, a la vista, cobrándose o celebrándose? */
    ocupado: () => ocupadoEn(foto),

    /** La cuenta en `COMPLETO`, o `null`. Otra cuenta no hereda nada de la anterior. */
    cuenta(uid) {
      if (uid === cuenta) return
      cuenta = uid
      generacion += 1
      mirando = false
      if (cobro) { cobro.abandonado = true; cobro.despertar?.(); cobro = null }
      reproductor.terminar(ESTADOS.CERRADO_ANTES)
      foto = FOTO_VACIA
      for (const fn of oyentes) fn()
    },
    /** Lo que `App` le presta: quién toma el saldo cobrado y qué se hace al quedar libre. */
    enchufar({ tomarSaldo, alLibre }) {
      enchufes = { tomarSaldo: tomarSaldo ?? (() => {}), alLibre: alLibre ?? (() => {}) }
    },

    mirar,
    /** La única entrada, para los dos sitios (Retar y el estante Monedas). */
    pedir,
    /** «Volver» del mensaje de «no hay video». */
    cerrarSin() { if (foto.fase === FASES_CONTROL.SIN) liberar() },
    /** P-2 · «Salir» durante el cobro, sólo cuando ya se puede. */
    salirDelCobro() {
      if (foto.fase !== FASES_CONTROL.COBRANDO || !foto.salible || !cobro) return
      cobro.abandonado = true
      cobro.despertar?.()
      cobro = null
      liberar()
    },
    /** Volver a primer plano: el reintento del cobro no espera su cuenta atrás. */
    reintentarAhora() { cobro?.despertar?.() },
    finCelebracion(id) { if (foto.cel && (id === undefined || foto.cel.id === id)) fija({ cel: null }) },
    /** MES-PvP 3 · la mesa entre personas entra sola (la sala arrancó) y en la mesa no hay
     *  video (G3): el que estaba a la vista se cierra antes de tiempo, que no cobra el boleto
     *  (G2) ni vuelve a salir al regresar. El cobro ya en curso sigue: el video ya se vio. */
    cerrarPorMesa() {
      if (foto.fase === FASES_CONTROL.VIENDO) reproductor.terminar(ESTADOS.CERRADO_ANTES)
    },
    /** El marco se desmonta (se entra en la mesa): lo que sólo era pintura se
     *  recoge, para que no reaparezca al volver. El saldo ya se tomó al cobrar;
     *  un video a la vista o un cobro en curso no se tocan. */
    recoger() {
      const sin = foto.fase === FASES_CONTROL.SIN
      if (!foto.cel && !sin) return
      fija({ cel: null, ...(sin ? { fase: null, salible: false } : {}) })
    },
  }
}
