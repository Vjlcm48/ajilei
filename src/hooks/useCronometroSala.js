import { useEffect, useRef, useState } from 'react'
import { calcularDesfase, ahoraServidor, restante, comoReloj } from './relojCore'

// ── SAL-B2 · El cronómetro de la sala de espera ─────────────────────────────
// Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §7, sobre el informe de Fase 0 §3.7 y
// §7.7-2. Decisión de Victor (11-sep-2026): hook NUEVO; `useReloj` y
// `relojCore` no se editan. `relojCore` se consume entero: aquí no hay una sola
// resta de fechas.
//
// ── POR QUÉ NO `useReloj` ─────────────────────────────────────────────────
// Aquel hook mide el desfase llamando a `supabase.rpc('ahora')` por su cuenta,
// no a `api.ahora()`. Bajo el bypass del arnés no hay sesión y `ahora()` está
// revocada a `anon` (SAL-A §15): la llamada fallaría, escupiría un `warn` y
// pondría en rojo `sal.2` (consola limpia). Todo lo que la sala de espera
// necesita de la red tiene que entrar por `api`, que es el único punto de
// inyección (App.jsx) y lo que permite que las fixtures respondan por él.
//
// ── EL DISEÑO, EN TRES FRASES ─────────────────────────────────────────────
// La hora del servidor se pide UNA vez al montar y se guarda como desfase. Un
// latido de un segundo repinta, y en cada pulso se vuelve a CALCULAR el restante
// contra el reloj local corregido: no se le resta uno al número anterior. Por
// eso una pestaña que vuelve de dormir se pone al día en el primer pulso sin
// escuchar `visibilitychange` (relojCore.js:29-33).
//
// ── EL NÚCLEO SE PRUEBA, EL HOOK SOLO EJECUTA ─────────────────────────────
// Molde de `useCongelado` (`creaCongelador` + `enganchaVisibilidad`): el
// proyecto no tiene jsdom ni `@testing-library`, así que lo que decide vive en
// `creaCronometro`, que recibe el reloj y los temporizadores por parámetro y
// se sella en Vitest con `vi.useFakeTimers()`. El hook es el espejo de React:
// un `useState` que refleja lo que el controlador avisa.

/** El estado que el hook devuelve, calculado desde el instante y el desfase. */
function estadoDe(expiraEn, ahoraLocal, desfase, medido) {
  const segundos = restante(expiraEn, ahoraServidor(ahoraLocal, desfase))
  return { segundos, texto: comoReloj(segundos), medido }
}

/**
 * El controlador puro del cronómetro.
 *
 * @param {object}   api                      `salasApi` o un doble: sólo se usa `api.ahora()`
 * @param {string|number|Date} expiraEn       el `expira_en` de la sala
 * @param {object}   [deps]                   el reloj y los temporizadores, inyectables para probar
 * @param {() => number} [deps.now]           `Date.now`
 * @param {Function} [deps.setInterval]
 * @param {Function} [deps.clearInterval]
 * @param {number}   [deps.periodoMs]         el latido; 1000 en la app
 */
export function creaCronometro(api, expiraEn, deps = {}) {
  const now = deps.now ?? (() => Date.now())
  const poner = deps.setInterval ?? ((fn, ms) => setInterval(fn, ms))
  const quitar = deps.clearInterval ?? ((id) => clearInterval(id))
  const periodoMs = deps.periodoMs ?? 1000

  let expira = expiraEn
  let desfase = 0
  let medido = false
  let pulso = null
  let vivo = false
  let avisa = () => {}

  const estado = () => estadoDe(expira, now(), desfase, medido)
  const notifica = () => { if (vivo) avisa(estado()) }

  // El instante local se toma JUSTO ANTES de mandar, no al recibir: entre las
  // dos cosas está la latencia del viaje, y anclarla al envío deja el error
  // acotado por debajo (la nota de `calcularDesfase`). Sin medida —red caída,
  // RPC que falla— se cuenta con el reloj local a pelo: lo peor que pasa es que
  // la cuenta atrás mienta unos segundos, porque el vencimiento de verdad lo
  // decide `resolver_sala`. Sin `console.warn`: el arnés exige consola limpia y
  // el estado `medido: false` ya lo dice.
  const arranca = () => {
    if (vivo) return
    vivo = true
    const antes = now()
    Promise.resolve()
      .then(() => api.ahora())
      .then(({ data, error } = {}) => {
        if (!vivo) return
        if (!error && data) {
          desfase = calcularDesfase(data, antes)
          medido = true
        }
        notifica()
      })
      .catch(() => { /* sin medida: desfase 0, medido false */ })
    pulso = poner(notifica, periodoMs)
  }

  // Realtime trae la fila con la cuenta corta (o restituida): se recalcula en
  // el acto, sin esperar al siguiente pulso.
  const cambiaExpira = (nuevo) => {
    expira = nuevo
    notifica()
  }

  // GT-HIG: el latido se cancela y ningún aviso sale después.
  const para = () => {
    vivo = false
    if (pulso !== null) { quitar(pulso); pulso = null }
  }

  return {
    arranca,
    para,
    cambiaExpira,
    estado,
    alCambiar: (fn) => { avisa = typeof fn === 'function' ? fn : () => {} },
    estaVivo: () => vivo,
  }
}

/**
 * El cronómetro de la sala, para la pantalla.
 *
 * @param {object} api                     `salasApi` (entra por App, como todo)
 * @param {string|number|Date} expiraEn    el `expira_en` de la sala; puede cambiar
 * @returns {{ segundos: number, texto: string, medido: boolean }}
 */
export function useCronometroSala(api, expiraEn) {
  // El primer render ya enseña la cuenta con el reloj local sin corregir: un
  // «3:00» honesto en vez de un «0:00» de un fotograma. Es una lectura de un
  // solo uso en el inicializador, como la de la URL en `App`.
  const [estado, setEstado] = useState(() => creaCronometro(api, expiraEn).estado())
  const ctrlRef = useRef(null)

  // Una sola medida y un solo latido por montaje. `api` es estable (viene de
  // un `useState` perezoso en App); si cambiara, es otra sesión y se vuelve a
  // medir.
  useEffect(() => {
    const ctrl = creaCronometro(api, expiraEn)
    ctrlRef.current = ctrl
    ctrl.alCambiar(setEstado)
    ctrl.arranca()
    return () => {
      ctrl.alCambiar(null)
      ctrl.para()
      ctrlRef.current = null
    }
    // `expiraEn` NO va aquí a propósito: sus cambios los atiende el efecto de
    // abajo sin volver a medir ni reiniciar el latido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api])

  useEffect(() => {
    ctrlRef.current?.cambiaExpira(expiraEn)
  }, [expiraEn])

  return estado
}
