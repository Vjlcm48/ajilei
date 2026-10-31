import { useState, useRef, useEffect, useCallback } from 'react'
import { estadoConsultas, conMiConsulta, decidirConsulta, responderConsulta } from './consultasCore'
import { CONSULTA_POPUP_MS, precioConsulta } from '../config/consultas'
import { consultaConfirmada } from '../lib/consultaConfirmada'

// ── DSK-U3 · Estado de "Mano actual" ─────────────────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.6.md §3.
// Hook HERMANO de useUtilitiesMenu y useReacciones (molde U1): un solo estado,
// varios consumidores —la entrada y su badge dentro del panel, la ventana del
// valor y la de confirmación, que viven fuera de él porque el panel CIERRA AL
// EJECUTAR y se desmonta con su ancla—. Toda la decisión vive en consultasCore
// (puro y sellado por Vitest); aquí sólo se sostiene el estado, se llama y se
// gobierna el ciclo de la ventana.
//
// CFG-1 1e · EL CONTADOR VIVE EN EL SERVIDOR (INV-75). `mi_consulta()` se lee
// al entrar a la mesa y cada `consultar_mano` trae el contador al día; el
// aparato ya no guarda nada salvo la confirmación de la sesión
// (`lib/consultaConfirmada`). La mano es (mesa del servidor, número de mano).
//
// @param {object} o
// @param {{ mi: Function, consultar: Function }|null} o.api  `lib/consultaApi`
// @param {string|null} o.mesaId  la mesa contra las IAS del servidor (`control.mesaId`)
// @param {string|null} o.nivel   'basico' · 'avanzado' · 'pro': el precio antes de la primera respuesta
// @param {number|null} o.saldo   la billetera que la mesa conoce: sin gratis y sin
//   saldo para el precio, el aviso sale sin preguntar ni llamar
// @param {(saldo:number) => void} [o.onSaldo]  el saldo que contesta el servidor,
//   para la billetera (`tomar`): tras un cobro, la mesa y la píldora lo saben
export function useConsultas({ api = null, mesaId = null, nivel = null, saldo = null, onSaldo = null } = {}) {
  const [estado, setEstado] = useState(() => estadoConsultas({ precio: precioConsulta(nivel) }))
  const [popup, setPopup] = useState(null)   // null | {id, tipo, anchor, desglose, pagada, clave, vars, gratis}
  const [confirmacion, setConfirmacion] = useState(null)   // null | {precio, pedido}
  const timerRef = useRef(null)
  const seqRef = useRef(0)
  const enCurso = useRef(false)
  // El estado más reciente, para los manejadores que esperan al servidor: una
  // respuesta que llega tras otro render no puede trabajar sobre un cierre viejo.
  const estadoRef = useRef(estado)
  useEffect(() => { estadoRef.current = estado })

  // Al entrar a la mesa: cuántas gratis quedan. Si no contesta, la entrada no
  // dice cifra y el primer toque pregunta al servidor (`decidirConsulta`).
  useEffect(() => {
    if (!api || !mesaId) return undefined
    let vigente = true
    api.mi().then((r) => { if (vigente && r) setEstado((e) => conMiConsulta(e, r, mesaId)) })
    return () => { vigente = false }
  }, [api, mesaId])

  const cerrarPopup = useCallback(() => setPopup(null), [])
  const abrir = useCallback((p) => setPopup({ id: ++seqRef.current, ...p }), [])

  const llamar = useCallback(async (pedido) => {
    if (enCurso.current) return
    enCurso.current = true
    const r = api && mesaId ? await api.consultar(mesaId, pedido.mano) : null
    enCurso.current = false
    if (Number.isFinite(r?.saldo) && r.resultado !== 'sin_sesion') onSaldo?.(r.saldo)
    const { estado: next, popup: p } = responderConsulta(estadoRef.current, { mesa: mesaId, mano: pedido.mano }, r)
    estadoRef.current = next
    setEstado(next)
    abrir({ ...p, anchor: pedido.anchor, desglose: pedido.desglose, gratis: next.gratis })
  }, [api, mesaId, abrir, onSaldo])

  // `desglose` llega ya calculado por el consumidor desde el estado VIVO en el
  // instante del press: el hook no conoce el motor, y así el valor de un
  // re-press refleja las cartas de ahora, no las de la primera consulta.
  // El press es un evento de usuario: nada de esto vive dentro de un updater
  // de setState (en StrictMode correrían dos veces).
  const consultar = useCallback((mano, desglose, anchor) => {
    const pedido = { mano, desglose, anchor }
    const e = estadoRef.current
    const que = decidirConsulta(e, { mesa: mesaId, mano, confirmada: consultaConfirmada.leer(), saldo })
    if (que === 'sin_mesa') {
      abrir({ tipo: 'aviso', clave: 'ia.mesa.consulta.error', vars: {}, anchor })
    } else if (que === 'sin_saldo') {
      abrir({ tipo: 'aviso', clave: 'ia.mesa.consulta.sin_saldo', vars: { hc: e.precio }, anchor })
    } else if (que === 'repetida') {
      abrir({ tipo: 'valor', pagada: e.ultima.pagada, anchor, desglose, gratis: e.gratis })
    } else if (que === 'confirmar') {
      setConfirmacion({ pedido, precio: e.precio ?? precioConsulta(nivel) })
    } else {
      llamar(pedido)
    }
  }, [mesaId, nivel, saldo, abrir, llamar])

  // La ventana de confirmación: «Consultar» marca la sesión y cobra; «Cancelar»
  // no escribe nada.
  const confirmar = useCallback(() => {
    const c = confirmacion
    setConfirmacion(null)
    if (!c) return
    consultaConfirmada.marcar()
    llamar(c.pedido)
  }, [confirmacion, llamar])
  const cancelar = useCallback(() => setConfirmacion(null), [])

  // Cierre por las DOS vías exactas: autocierre a los 4s o clic en cualquier
  // otra parte, lo que llegue primero. Molde H4 (setTimeout en ref + pointerdown
  // en captura, sin overlay): un overlay se tragaría el primer clic sobre los
  // botones de acción, y esta lectura ocurre DURANTE la mano.
  // Por `id`: una ventana nueva (otra consulta, o el aviso tras el valor)
  // vuelve a contar sus 4 s.
  const popupId = popup?.id ?? null
  useEffect(() => {
    if (popupId === null) return undefined
    timerRef.current = setTimeout(cerrarPopup, CONSULTA_POPUP_MS)
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.u3-popup')) return
      cerrarPopup()
    }
    document.addEventListener('pointerdown', onDown, true)
    // el ancla se midió una vez: si la ventana cambia de tamaño deja de ser
    // válida, y un popup mal anclado es peor que un popup cerrado
    window.addEventListener('resize', cerrarPopup)
    return () => {
      clearTimeout(timerRef.current)
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('resize', cerrarPopup)
    }
  }, [popupId, cerrarPopup])

  return { estado, popup, confirmacion, consultar, confirmar, cancelar, cerrarPopup }
}
