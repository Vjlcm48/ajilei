import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MOTIVOS, billeteraNueva, paraCuenta, debeLeer, alResponder, respuestaValida, saldoMostrado,
  tomarSaldo, esperarSaldo, soltarEspera, lecturaVigente,
} from './billeteraCore'

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

const controlNuevo = (uid) => ({ uid, enVuelo: false, ultima: null, fallo: false, generacion: 0 })

/**
 * @param {{inicial:number|null, leer:() => Promise<{data:number|null, error:string|null}>}} api
 * @param {string|null} uid  la cuenta en `COMPLETO`, o `null`
 */
export function useBilletera(api, uid) {
  const [guardada, setGuardada] = useState(() => billeteraNueva(uid, api.inicial))
  const control = useRef(controlNuevo(null))

  // La billetera de ESTA cuenta, derivada en cada render y no sincronizada con
  // un efecto: si la guardada es de otra cuenta, se pinta una nueva.
  const billetera = paraCuenta(guardada, uid)

  const leer = useCallback((motivo) => {
    const ctl = control.current
    const ahora = Date.now()
    if (!debeLeer(ctl, motivo, ahora)) return
    ctl.enVuelo = true
    ctl.ultima = ahora
    const deQuien = ctl.uid
    const generacion = ctl.generacion
    api.leer().then((respuesta) => {
      ctl.enVuelo = false
      ctl.fallo = !respuestaValida(respuesta)
      // Una respuesta que llega cuando ya es otra la cuenta se tira: era de la
      // anterior y aplicarla aquí le daría a una cuenta la cifra de otra. Y una
      // que salió antes de un `tomar` trae una cifra vieja (la generación).
      if (control.current.uid !== deQuien) return
      if (!lecturaVigente(control.current, generacion)) return
      setGuardada((previa) => alResponder(previa, deQuien, respuesta))
    })
  }, [api])

  // ── El arranque, una vez por cuenta ─────────────────────────────────────
  // StrictMode monta dos veces: la segunda encuentra la misma cuenta y
  // `debeLeer(ARRANQUE)` dice que ya se pidió.
  useEffect(() => {
    if (control.current.uid !== uid) control.current = controlNuevo(uid)
    if (!uid) return
    leer(MOTIVOS.ARRANQUE)
  }, [uid, leer])

  // ── Volver a primer plano ───────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return
    const alCambiar = () => {
      if (document.visibilityState === 'visible') leer(MOTIVOS.PRIMER_PLANO)
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [uid, leer])

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
