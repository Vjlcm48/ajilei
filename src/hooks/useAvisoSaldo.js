import { useState, useEffect, useRef, useCallback } from 'react'
import { TIEMPOS_AVISO, cifraAviso, brillaAviso, suenaAviso, desdeAlSustituir } from './avisoSaldoCore'
import { useSounds } from './useSounds'

// ── ECO-1c · El reloj del aviso de saldo ────────────────────────────────────
// Las reglas viven en `avisoSaldoCore.js`; aquí sólo corre el tiempo. Un rAF
// desde que nace el aviso (cambia su `id`) hasta que muere su `vida`, y en cada
// cuadro la cifra de la píldora y si brilla la moneda. El `setState` va en el
// rAF, nunca en el cuerpo del efecto (`react-hooks/set-state-in-effect`).
//
// El sonido: `chipsCollect` a 0,35 (en la mesa suena a 0,7), una vez. Pasa por
// `useSounds`, así que respeta el ajuste de sonido como todo lo demás.
//
// Un toque cierra el aviso antes: `cerrar` adelanta la salida.
//
// ECO-1d · LA FILA (avisoSaldoCore §«la fila»). Dos campos del aviso:
//   · `espera`: los ms antes de entrar (el hueco entre dos avisos de la fila).
//     Mientras, el aviso ya es el vivo —la píldora se queda en su `desde`, que
//     es donde acabó el anterior— pero la cápsula no se pinta (`oculto`).
//   · `sustituye`: C5/C6 cambiaron la fila a medio aviso. Al nacer cuenta desde
//     la cifra que se estaba viendo, no desde la suya: la píldora no retrocede.
// Y devuelve `contando` (ya pasó `cuentaIni`), que la ficha de la constancia
// usa para posar la moneda del día a la vez que la píldora sube.

const VOLUMEN_SUAVE = 0.35
const reducidoAhora = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/**
 * @param {{id:*, desde:number, hasta:number}|null} aviso
 * @param {number} vida  ms que vive (de `vidaAviso(texto)`)
 * @param {(id) => void} onFin
 */
export function useAvisoSaldo(aviso, vida, onFin) {
  const [cuadro, setCuadro] = useState(null)   // { id, cifra, brilla, saliendo, terminado }
  const cerradoEn = useRef(null)
  const reloj = useRef(null)
  const finRef = useRef(onFin)
  const cuadroRef = useRef(null)   // el último cuadro pintado, de cualquier aviso
  const { play } = useSounds()
  useEffect(() => { finRef.current = onFin }, [onFin])

  const id = aviso?.id ?? null
  useEffect(() => {
    if (!aviso) return undefined
    const reducido = reducidoAhora()
    const t0 = performance.now()
    const espera = Math.max(0, aviso.espera ?? 0)
    // `sustituye`: desde la cifra del cuadro que se estaba pintando, si era de
    // otro aviso y no había terminado.
    const previo = cuadroRef.current
    const efectivo = aviso.sustituye && previo && previo.id !== aviso.id && !previo.terminado
      ? { ...aviso, desde: desdeAlSustituir(previo.cifra, aviso) }
      : aviso
    let sono = false
    let raf = 0
    cerradoEn.current = null
    const pinta = (c) => { cuadroRef.current = c; setCuadro(c) }
    const paso = () => {
      const t = performance.now() - t0 - espera
      if (t < 0) {
        pinta({ id: aviso.id, cifra: efectivo.desde, brilla: false, saliendo: false, oculto: true, contando: false })
        raf = requestAnimationFrame(paso)
        return
      }
      const fin = cerradoEn.current !== null ? Math.min(vida, cerradoEn.current + TIEMPOS_AVISO.sale) : vida
      reloj.current = t
      if (!sono && suenaAviso(efectivo, t) && !reducido) {
        sono = true
        const r = play('chipsCollect')
        try { r?.sound?.volume(VOLUMEN_SUAVE, r.id) } catch { /* sin sonido */ }
      }
      if (t >= fin) {
        pinta({ id: aviso.id, terminado: true })
        finRef.current?.(aviso.id)
        return
      }
      pinta({
        id: aviso.id,
        cifra: cifraAviso(efectivo, t, reducido),
        brilla: brillaAviso(efectivo, t, reducido),
        saliendo: t >= fin - TIEMPOS_AVISO.sale,
        oculto: false,
        contando: t >= TIEMPOS_AVISO.cuentaIni,
      })
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
    // El aviso entero está fijado por su `id`: uno nuevo es otro `id`.
  }, [id, vida]) // eslint-disable-line react-hooks/exhaustive-deps

  const cerrar = useCallback(() => {
    if (cerradoEn.current === null && reloj.current !== null) cerradoEn.current = reloj.current
  }, [])

  // Tres momentos: antes del primer cuadro (la cifra ya es la de antes, para
  // que la píldora no enseñe un fotograma la nueva), vivo, y terminado (la
  // píldora vuelve al saldo aunque el padre aún no haya soltado el aviso).
  const propio = cuadro !== null && cuadro.id === id
  const vivo = aviso !== null && aviso !== undefined && !(propio && cuadro.terminado)
  const enCurso = vivo && propio
  // Antes de su primer cuadro, un aviso que sustituye a otro a medio pintar ya
  // enseña la cifra que se veía (la misma cuenta que hará el efecto al nacer).
  const desdeAntes = !vivo || enCurso ? null
    : aviso.sustituye && cuadro && !cuadro.terminado && Number.isFinite(cuadro.cifra)
      ? desdeAlSustituir(cuadro.cifra, aviso) : aviso.desde
  return {
    vivo,
    cifra: vivo ? (enCurso ? cuadro.cifra : desdeAntes) : null,
    brilla: enCurso && cuadro.brilla,
    saliendo: enCurso && cuadro.saliendo,
    // La cápsula no se pinta mientras el aviso espera su hueco en la fila.
    oculto: vivo && (enCurso ? cuadro.oculto === true : (aviso.espera ?? 0) > 0),
    contando: enCurso && cuadro.contando === true,
    cerrar,
  }
}
