// ── cargarMesa.js · ARN-3d §2.4 (B11) · la mesa en su propio chunk ──────────
// Rector: AJILEI_ARN-3d_v1.0.md §2.4 · base técnica: Fase 0 §B2–B5.
//
// `GameTable` y todo lo que sólo ella importa (36,3 KiB de JS y 18,5 de CSS en
// el cable) salen del paquete principal: la Portada deja de pagarlos antes de
// su primera pintura (`1.8b`, 222,0 → 168,8 KiB). La mesa se pide desde UN solo
// sitio —este— para que `App` y `Lobby` pidan el mismo especificador.
//
// ── TRES PIEZAS, Y POR QUÉ LAS TRES ─────────────────────────────────────────
//   · `cargarMesa()` — el `import()`. Pasa por el `__vitePreload` de Vite, que
//     trae TAMBIÉN la hoja CSS del chunk y la inserta antes de resolver: cuando
//     `.game-table` existe, su CSS ya está (Fase 0 §B7). Por eso `import()` y no
//     `<link rel="modulepreload">`, que sólo trae el JS y pediría escribir en
//     `index.html` un nombre con hash.
//   · `fabricaMesa()` — lo que recibe `React.lazy`. Si el módulo YA llegó,
//     devuelve un *thenable* SÍNCRONO: `lazy` lo da por resuelto en el acto y no
//     suspende. Sin esto, `lazy` suspende siempre en su primer render aunque el
//     chunk esté en memoria, y React retiene el `fallback` 300 ms: ~330 ms de
//     pantalla vacía medidos con un `Suspense` local (hallazgo H3d-2).
//   · `precargarMesa()` — el `import()` adelantado, en un momento ocioso. Lo
//     llama el MONTAJE de `Lobby`, que sólo existe con sesión: en `App`, `screen`
//     vale 'lobby' también mientras se ve la Portada, y una precarga colgada de
//     ahí se pedía a los 167 ms, antes del FCP (`1.8b` 223,7, rojo; H3d-1).
//
// La pieza que falta está en `App`: el cambio a la mesa va en `startTransition`
// y hay UN `Suspense` en la raíz (`main.jsx`). Si el chunk aún no llegó, React
// deja Retar puesta hasta que la mesa está lista, en vez de pintar el
// `fallback` (D12: ~1 s quieta con 4G lento y entrada inmediata, aceptado).
//
// LO QUE NO HACE, A PROPÓSITO. No reintenta y no recuerda un fallo: guarda el
// módulo YA llegado y una sola marca más, «entrando a la mesa». Un `import()`
// que falla devuelve su rechazo a quien lo pidió (la precarga lo traga; `lazy`
// lo propaga) y el siguiente `cargarMesa()` vuelve a llamar al importador. Lo
// que pase con un chunk que no llega lo decide el escuchador de
// `vite:preloadError` de `main.jsx` (D11) con `decidirFalloChunk`, abajo.
//
// ── STOP-2 · LA PRECARGA NUNCA RECARGA ──────────────────────────────────────
// Vite anuncia `vite:preloadError` con CUALQUIER fallo de su `__vitePreload`,
// también el de la precarga ociosa del lobby. Recargar ahí, sin red, mandaba al
// jugador a la página de error del navegador desde un lobby que funcionaba
// (H3d-ii-2). Por eso el escuchador pregunta DE DÓNDE viene el fallo: si nadie
// ha tocado aún «Jugar», es la precarga y se calla; si `onRetar` ya marcó la
// entrada, el jugador está esperando la mesa y se recarga (una vez).
//
// Por qué una marca y no el error: Chromium deja en caché un `import()`
// fallido y no lo vuelve a pedir aunque vuelva la red. Tras una precarga
// cortada, la entrada falla AL ACTO con el mismo error; sólo la recarga trae un
// documento limpio que pida el chunk otra vez.
//
// ── PES-1 · EL MOLDE ES DE TODOS ─────────────────────────────────────────────
// Rector: AJILEI_PES-1_Fase1_v1.0.md §1. `creaCargador` es la fábrica de todo
// trozo diferido, y `lib/trozos.js` guarda los demás. Con varios trozos, «ya tocó
// Jugar» no basta para clasificar un fallo: por eso `esperando()`, que es la marca
// mientras el módulo no ha llegado. La pregunta es `origenFalloChunk` (`trozos`).

// La fábrica, separada de los dos efectos del navegador (el `import()` y el
// reloj ocioso) para que vitest la pruebe en Node pelado con los suyos.
export function creaCargador(importar, ocioso) {
  let modulo = null
  let entrando = false
  // La promesa EN VUELO, para que dos peticiones seguidas (el lobby y el efecto
  // de `App`) sean una sola. Se suelta al terminar, salga bien o mal: si salió
  // bien manda `modulo`, y si salió mal la próxima petición vuelve a pedir.
  let enVuelo = null

  const cargar = () => {
    if (modulo) return Promise.resolve(modulo)
    if (!enVuelo) {
      enVuelo = importar().then(
        (m) => { modulo = m; enVuelo = null; return m },
        (e) => { enVuelo = null; throw e },
      )
    }
    return enVuelo
  }

  const fabrica = () => (modulo ? { then: (ok) => ok(modulo) } : cargar())

  // Idempotente: una vez pedida no se vuelve a programar. El rechazo se traga
  // aquí porque la precarga es un adelanto, no una dependencia: si falla, la
  // mesa se pedirá otra vez al entrar.
  let pedida = false
  const precargar = () => {
    if (pedida) return
    pedida = true
    ocioso(() => { cargar().catch(() => {}) })
  }

  // `onRetar` la pone justo antes de su `startTransition`. No se quita nunca:
  // una vez el módulo llega, ya no hay fallo que clasificar, y si no llega, la
  // recarga trae un módulo nuevo con la marca a cero.
  const marcarEntrada = () => { entrando = true }
  const origenFallo = () => (entrando ? 'entrada' : 'precarga')
  const llego = () => Boolean(modulo)
  const esperando = () => entrando && !modulo

  return { cargar, fabrica, precargar, marcarEntrada, origenFallo, llego, esperando }
}

// ── La decisión del escuchador, pura ────────────────────────────────────────
// `origen`: 'precarga' | 'entrada' (de `origenFallo`).
// `guarda`: lo que dice `sessionStorage` de la recarga de esta pestaña:
//   'libre' (aún no recargó), 'usada' (ya recargó) o 'rota' (no se puede leer).
// Devuelve qué hacer con el evento:
//   · 'silencio' — `preventDefault` y nada más: la precarga falla sin que se
//     vea. Vite, con el evento prevenido, resuelve el `import()` sin módulo, y
//     el cargador no lo guarda: la entrada lo volverá a pedir.
//   · 'recargar' — `preventDefault` y `location.reload()`, una vez por sesión.
//   · 'dejar'    — nada: el error sigue su curso. Sin guarda que leer no se
//     recarga (no se podría impedir el bucle).
export function decidirFalloChunk(origen, guarda) {
  if (origen !== 'entrada') return 'silencio'
  return guarda === 'libre' ? 'recargar' : 'dejar'
}

// `requestIdleCallback` donde exista; Safari no lo tiene, y allí un `setTimeout`
// corto deja pasar el pintado del lobby antes de pedir nada.
export const ociosoDelNavegador = (f) => (
  typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(f)
    : setTimeout(f, 1)
)

const mesa = creaCargador(() => import('../components/GameTable'), ociosoDelNavegador)

export const trozoMesa = mesa

export const cargarMesa = mesa.cargar
export const fabricaMesa = mesa.fabrica
export const precargarMesa = mesa.precargar
export const marcarEntradaMesa = mesa.marcarEntrada
