import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  MOTIVOS, billeteraNueva, paraCuenta, debeLeer, alResponder, respuestaValida, saldoMostrado,
  tomarSaldo, esperarSaldo, soltarEspera, lecturaVigente, esSaldoValido, esperaReintento, recordadoPara,
} from './billeteraCore'
import { saldoRecordado } from '../lib/saldoRecordado'

// ── ECO-1b · La fuente única del saldo en el cliente ────────────────────────
// Rector: AJILEI_ECO-1_Fase1b_v1.0.md §1 (B1–B3) y el plan aprobado del STOP-1:
// un hook que se llama UNA vez, en `App`, y cuya cifra baja por props a las seis
// pantallas que la enseñan. Sin contexto, por las mismas razones que `useAuth`
// dejó escritas: un segundo consumidor abriría una segunda lectura, y un
// Provider en `.jsx` estrenaría el error de `react-refresh` de SoundContext.
//
// Las reglas viven en `billeteraCore.js` (Vitest las sella); aquí sólo se
// cablean a React. Lo único propio de este archivo es CUÁNDO se lee:
//   · al llegar la cuenta a `COMPLETO` (y si cambia de cuenta);
//   · al volver la app a primer plano;
//   · cuando una pantalla avisa de un `saldo_insuficiente` del servidor;
//   · cuando el jugador pide reintentar.
// Sin cuenta no se llama nunca: `uid` llega `null` fuera de `COMPLETO`.
//
// ECO-1c · y lo que el servidor CONTESTA al mover dinero se toma sin releer
// (`tomar`). Mientras se cobra una salida, `esperar` deja la píldora en «—»;
// si la salida no contesta, `soltar` relee y enseña lo que haya.
//
// ── ESTADO DE PINTURA EN `useState`, CONTROL EN UN `ref` ────────────────────
// Lo que se pinta (la cifra, el estado) es estado de React. Lo que sólo decide
// si toca leer (si hay una lectura en vuelo, cuándo fue la última, la
// generación) vive en un `ref`: escribirlo no es un render, y por eso el efecto
// de arranque puede pedir la lectura sin un `setState` síncrono en su cuerpo,
// que es lo que `react-hooks/set-state-in-effect` prohíbe.
//
// ── IOS-1c · lo colgado caduca, lo fallido se reintenta, lo visto se recuerda
// Rector: AJILEI_IOS-1_Fase1c_v1.0.md §3.2 y §3.3. Cada lectura lleva su número
// (`lectura`): una que caducó y contesta tarde ya no es la vigente y se tira.
// Tras un fallo, con la app a la vista, se vuelve a leer sola con la escalera
// de la mesa (1, 2, 4, 8 y 15 s); oculta, se para, y al volver la lectura de
// primer plano ya lee porque la anterior falló. Cada cifra del servidor se
// guarda para esta cuenta (`saldoRecordado`), y al arrancar se enseña la
// guardada como `recordado`, aparte de `saldo`.

const controlNuevo = (uid) => ({
  uid, enVuelo: false, enVueloDesde: null, lectura: 0, ultima: null, fallo: false, fallos: 0, generacion: 0,
})
const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'

/**
 * @param {{inicial:number|null, leer:() => Promise<{data:number|null, error:string|null}>}} api
 * @param {string|null} uid  la cuenta en `COMPLETO`, o `null`
 * @param {object} [o]
 * @param {object} [o.recuerdo]  el de `lib/saldoRecordado` (las pruebas dan otro)
 * @param {object} [o.reloj]     `setTimeout`/`clearTimeout`
 */
export function useBilletera(api, uid, { recuerdo = saldoRecordado, reloj = globalThis } = {}) {
  const [guardada, setGuardada] = useState(() => billeteraNueva(uid, api.inicial))
  const control = useRef(controlNuevo(null))
  const reintento = useRef(null)

  // La billetera de ESTA cuenta, derivada en cada render y no sincronizada con
  // un efecto: si la guardada es de otra cuenta, se pinta una nueva.
  const billetera = paraCuenta(guardada, uid)

  const quitarReintento = useCallback(() => {
    if (reintento.current !== null) reloj.clearTimeout(reintento.current)
    reintento.current = null
  }, [reloj])

  const leer = useCallback(function leer(motivo) {
    const ctl = control.current
    const ahora = Date.now()
    if (!debeLeer(ctl, motivo, ahora)) return
    quitarReintento()
    ctl.enVuelo = true
    ctl.enVueloDesde = ahora
    ctl.ultima = ahora
    ctl.lectura += 1
    const estaLectura = ctl.lectura
    const deQuien = ctl.uid
    const generacion = ctl.generacion
    api.leer().then((respuesta) => {
      // IOS-1c · la que caducó y otra la sustituyó: ya no manda nada.
      if (ctl.lectura !== estaLectura) return
      ctl.enVuelo = false
      ctl.fallo = !respuestaValida(respuesta)
      ctl.fallos = ctl.fallo ? ctl.fallos + 1 : 0
      // Una respuesta que llega cuando ya es otra la cuenta se tira: era de la
      // anterior y aplicarla aquí le daría a una cuenta la cifra de otra. Y una
      // que salió antes de un `tomar` trae una cifra vieja (la generación).
      if (control.current.uid !== deQuien) return
      // IOS-1c · tras un fallo, y con la app a la vista, se reintenta sola.
      if (ctl.fallo && visible()) {
        reintento.current = reloj.setTimeout(() => {
          reintento.current = null
          if (control.current === ctl && visible()) leer(MOTIVOS.REINTENTO)
        }, esperaReintento(ctl.fallos))
      }
      if (!lecturaVigente(control.current, generacion)) return
      setGuardada((previa) => alResponder(previa, deQuien, respuesta))
    })
  }, [api, reloj, quitarReintento])

  // ── El arranque, una vez por cuenta ─────────────────────────────────────
  // StrictMode monta dos veces: la segunda encuentra la misma cuenta y
  // `debeLeer(ARRANQUE)` dice que ya se pidió.
  useEffect(() => {
    if (control.current.uid !== uid) {
      quitarReintento()
      control.current = controlNuevo(uid)
    }
    if (!uid) return
    leer(MOTIVOS.ARRANQUE)
  }, [uid, leer, quitarReintento])
  useEffect(() => quitarReintento, [quitarReintento])

  // ── Volver a primer plano ───────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return
    // IOS-1c · oculta, el reintento se para; al volver, la lectura de primer
    // plano lee ya si la anterior falló (`debeLeer`).
    const alCambiar = () => {
      if (document.visibilityState === 'visible') leer(MOTIVOS.PRIMER_PLANO)
      else quitarReintento()
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [uid, leer, quitarReintento])

  // ── IOS-1c · La cifra recordada ─────────────────────────────────────────
  // Se escribe con cada cifra del servidor (y sólo con ésas: `servidor` sólo lo
  // cambian la lectura y las funciones de dinero). Se lee una vez por cuenta.
  const servidor = billetera.servidor
  useEffect(() => {
    if (uid && esSaldoValido(servidor)) recuerdo.guardar(uid, servidor)
  }, [uid, servidor, recuerdo])
  const recordadoDeLaCuenta = useMemo(() => recuerdo.leer(uid), [uid, recuerdo])

  const refrescar = useCallback(() => leer(MOTIVOS.REINTENTO), [leer])
  const alSaldoInsuficiente = useCallback(() => leer(MOTIVOS.INSUFICIENTE), [leer])

  // ── ECO-1c · Lo que contesta el servidor al mover dinero ────────────────
  const tomar = useCallback((saldo) => {
    control.current.generacion += 1
    setGuardada((previa) => tomarSaldo(previa, uid, saldo))
  }, [uid])
  const esperar = useCallback(() => {
    control.current.generacion += 1
    setGuardada((previa) => esperarSaldo(previa, uid))
  }, [uid])
  const soltar = useCallback(() => {
    setGuardada((previa) => soltarEspera(previa, uid))
    leer(MOTIVOS.REINTENTO)
  }, [uid, leer])

  return {
    saldo: saldoMostrado(billetera),
    // IOS-1c · sólo para la vista (la píldora y el botón de Retar): nadie
    // juzga con ella. `null` fuera de V-1 o sin recuerdo de esta cuenta.
    recordado: recordadoPara(billetera, recordadoDeLaCuenta),
    servidor: billetera.servidor,
    estado: billetera.estado,
    pendiente: billetera.pendiente,
    refrescar,
    alSaldoInsuficiente,
    tomar,
    esperar,
    soltar,
  }
}
