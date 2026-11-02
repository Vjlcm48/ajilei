import { supabase } from './supabase'
import { TOPE_ESPERA_MS, conTope } from './red'
import { normalizarCorreo, correoValido, esMismoCorreo, instanteDe, estadoFila, motivoDeEnvio, motivoDeCodigo } from './correoCore'

// ── CFG-1 1d · La puerta del cliente al cambio de correo ────────────────────
// Rector: AJILEI_CFG-1_Fase1d_v1.0.md §4, con lo resuelto en STOP-0 y STOP-L.
//
// NUNCA LANZA: toda llamada contesta `{ ok: true, … }` o `{ ok: false, motivo }`
// con un motivo de `correoCore.MOTIVOS`. El cliente entra por parámetro para que
// el banco imitado del bypass cambie SÓLO la fuente (contrato único, ECO-1c).
//
// EL CORREO PROPIO SALE DE LA SESIÓN (`auth.users`), nunca de `profiles`.
//
// LO QUE ESTA CAPA TIENE QUE SABER DE GOTRUE (sonda §1 y §2):
//   · `verifyOtp` lleva el correo de quien recibió ESE código: el hash es correo
//     más código. Cruzados, el servidor contesta «inválido».
//   · El primer código bueno devuelve `{ user: null, session: null }` sin error;
//     el segundo, la sesión nueva. El cambio está hecho SOLO si vuelve sesión.
//   · El cliente no puede preguntar si un código ya se aceptó
//     (`email_change_confirm_status` no sale en la API).
//   · `resend` lleva el correo ACTUAL. Con el nuevo no encuentra a nadie y
//     contesta 200 sin mandar nada.
//
// NO HAY `cancelar`: la API de GoTrue no lo ofrece al cliente (Decisión 1 del
// STOP-0). El cambio se anula solo cuando el código vence.

const TOPE = Symbol('tope')
const falla = (motivo, extra) => ({ ok: false, motivo, ...extra })
const pide = (trabajo) => conTope(trabajo, TOPE_ESPERA_MS, TOPE)
// Lo que corta `confirmar` en vez de probar el otro código.
const CORTA = new Set(['codigo_vencido', 'limite', 'red', 'desconocido'])

export function crearCorreoApi(cliente = supabase, { ahora = () => Date.now() } = {}) {
  const auth = cliente.auth
  // Los códigos que este aparato ya vio aceptar en este envío: si se vuelven a
  // mandar, el servidor los rechaza, y eso no es que estén mal.
  let aceptados = { envio: null, campos: new Set() }

  const leer = async () => {
    const r = await pide(auth.getUser())
    if (r === TOPE) return falla('red')
    if (r.error) return falla(motivoDeEnvio(r.error))
    if (!r.data?.user) return falla('desconocido')
    return { ok: true, usuario: r.data.user }
  }

  const sinLanzar = (trabajo) => async (...args) => {
    try {
      return await trabajo(...args)
    } catch (e) {
      console.warn('CFG-1d: el cambio de correo falló —', String(e?.message ?? e))
      return falla('desconocido')
    }
  }

  return {
    /** Lo que hay en el servidor: `{ ok, correo, estado, nuevo, enviadoEn }`. */
    estado: sinLanzar(async () => {
      const r = await leer()
      if (!r.ok) return r
      return { ok: true, correo: r.usuario.email ?? null, ...estadoFila(r.usuario, ahora()) }
    }),

    /** `{ ok: true, motivo: 'pendiente', nuevo, enviadoEn }`: ya salieron los dos correos. */
    pedirCambio: sinLanzar(async (correoNuevo) => {
      const nuevo = normalizarCorreo(correoNuevo)
      if (!correoValido(nuevo)) return falla('invalido')
      const sesion = await pide(auth.getSession())
      if (sesion !== TOPE && esMismoCorreo(nuevo, sesion.data?.session?.user?.email)) return falla('mismo')
      const r = await pide(auth.updateUser({ email: nuevo }))
      if (r === TOPE) return falla('red')
      const motivo = motivoDeEnvio(r.error)
      if (motivo !== 'ok') return falla(motivo)
      // El mismo correo es un 200 sin efecto: sin `new_email` no salió nada.
      if (!r.data?.user?.new_email) return falla('mismo')
      return { ok: true, motivo: 'pendiente', nuevo: r.data.user.new_email, enviadoEn: instanteDe(r.data.user.email_change_sent_at) ?? ahora() }
    }),

    /**
     * Manda SIEMPRE los dos códigos y el éxito es que vuelva una sesión: así un
     * código aceptado en un intento anterior no estorba. Si fallan los dos, se
     * prueban cruzados una vez (con dos alias, los dos llegan al mismo buzón).
     * Falla con `{ motivo, campos }`: `campos` son los que hay que corregir.
     */
    confirmar: sinLanzar(async (codigoActual, codigoNuevo) => {
      const leido = await leer()
      if (!leido.ok) return leido
      const { email: actual, new_email: nuevo, email_change_sent_at: enviado } = leido.usuario
      if (!actual || !nuevo) return falla('desconocido')
      const enviadoEn = instanteDe(enviado)
      if (aceptados.envio !== enviado) aceptados = { envio: enviado, campos: new Set() }

      const prueba = async (correo, token) => {
        const r = await pide(auth.verifyOtp({ email: correo, token, type: 'email_change' }))
        if (r === TOPE) return 'red'
        const motivo = motivoDeCodigo(r.error, enviadoEn, ahora())
        if (motivo !== 'ok') return motivo
        return r.data?.session?.access_token ? 'hecho' : 'aceptado'
      }
      const hecho = () => ({ ok: true, motivo: 'ok', correo: nuevo })

      const a = await prueba(actual, codigoActual)
      if (a === 'hecho') return hecho()
      if (CORTA.has(a)) return falla(a)
      const n = await prueba(nuevo, codigoNuevo)
      if (n === 'hecho') return hecho()
      if (CORTA.has(n)) return falla(n)

      const malos = new Set(['actual', 'nuevo'])
      if (a === 'aceptado') { aceptados.campos.add('actual'); malos.delete('actual') }
      if (n === 'aceptado') { aceptados.campos.add('nuevo'); malos.delete('nuevo') }

      if (a === 'codigo_mal' && n === 'codigo_mal') {
        const c1 = await prueba(actual, codigoNuevo)
        if (c1 === 'hecho') return hecho()
        if (CORTA.has(c1)) return falla(c1)
        const c2 = await prueba(nuevo, codigoActual)
        if (c2 === 'hecho') return hecho()
        if (CORTA.has(c2)) return falla(c2)
        // Cruzado, el del campo «nuevo» era el del actual: lo que queda mal es el otro.
        if (c1 === 'aceptado') { aceptados.campos.add('actual'); malos.delete('nuevo') }
        if (c2 === 'aceptado') { aceptados.campos.add('nuevo'); malos.delete('actual') }
      }
      // Un código aceptado antes y rechazado ahora no está mal: ya no hace falta.
      for (const c of aceptados.campos) if (malos.size > 1) malos.delete(c)
      return falla('codigo_mal', { campos: [...malos] })
    }),

    /** Dos códigos nuevos: los anteriores dejan de valer, también uno ya aceptado. */
    reenviar: sinLanzar(async () => {
      const leido = await leer()
      if (!leido.ok) return leido
      const { email: actual, new_email: nuevo } = leido.usuario
      if (!actual || !nuevo) return falla('desconocido')
      const r = await pide(auth.resend({ type: 'email_change', email: actual }))
      if (r === TOPE) return falla('red')
      const motivo = motivoDeEnvio(r.error)
      if (motivo !== 'ok') return falla(motivo)
      const tras = await leer()
      const enviadoEn = tras.ok ? instanteDe(tras.usuario.email_change_sent_at) : null
      return { ok: true, motivo: 'pendiente', nuevo, enviadoEn: enviadoEn ?? ahora() }
    }),
  }
}

export const correoApi = crearCorreoApi()
