// ── PES-1 · Howler llega después de pintar ──────────────────────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §3-E. Son ~10 KiB que nadie oye antes del
// primer pintado: el primer sonido de la Portada, el clic, ya se pide un segundo
// después (`Portada.jsx`, BIE-1). Se carga con el molde de la casa justo tras el
// primer pintado, y antes de ese segundo.
//
// LO QUE SE PIDA ANTES se guarda en orden y corre al llegar. Es lo que hace
// Howler hoy con un `play()` sobre un archivo que aún carga: no se pierde, llega
// tarde. El mute guardado de `SoundContext` entra el primero, porque su efecto
// corre al montar la app.
import { creaCargador } from './cargarMesa'

// El primer pintado con contenido, o 900 ms si el navegador no lo cuenta. La
// petición nace siempre después del corte de `diagPUE 1.8`: no es camino crítico.
function trasPrimerPintado(f) {
  let hecho = false
  const una = () => { if (!hecho) { hecho = true; f() } }
  try {
    const po = new PerformanceObserver((lista) => {
      if (lista.getEntriesByName('first-contentful-paint').length === 0) return
      po.disconnect()
      una()
    })
    po.observe({ type: 'paint', buffered: true })
  } catch { /* sin Paint Timing queda el reloj */ }
  setTimeout(una, 900)
}

let motor = null
const pendientes = []

// Con el evento de Vite prevenido el `import()` se resuelve sin módulo: no hay
// motor, y lo pendiente se queda sin sonar, como con la red caída hoy.
function llega(m) {
  if (!m) return m
  motor = { Howl: m.Howl ?? m.default?.Howl, Howler: m.Howler ?? m.default?.Howler }
  pendientes.splice(0).forEach((f) => f(motor))
  return m
}

const trozo = creaCargador(() => import('howler').then(llega), trasPrimerPintado)

/** Programa la carga tras el primer pintado. Idempotente: lo llama `main.jsx`. */
export const arrancarHowler = trozo.precargar

/** `{ Howl, Howler }` si ya llegó, o `null`. */
export const howlerYa = () => motor

/** Corre `f(motor)` ahora, si ya llegó, o al llegar. */
export function conHowler(f) {
  if (motor) f(motor)
  else pendientes.push(f)
}
