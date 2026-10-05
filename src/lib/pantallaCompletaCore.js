// PAN-1 1c · LA PANTALLA COMPLETA EN LOS TELÉFONOS (regla R1–R9, Victor,
// 2026-10-03; INV-45).
//
// Núcleo puro: sin React y con `doc`/`win` por parámetro, para que la prueba
// recorra el camino real con un `document` y un `window` falsos (el molde de
// `useCongelado.test.js`; el proyecto no tiene jsdom). `App.jsx` monta el
// oyente una vez y fija «dentro de la mesa»; `GameTable.jsx` llama a
// `reentrar` en «Iniciar mano» y «Siguiente mano».
//
// Lo que la regla pide, y dónde vive aquí:
//   R1 · solo táctil, y nunca en el computador aunque tenga pantalla táctil
//        (su entrada principal tiene `hover`) → `aplica`.
//   R2 · entra con el primer toque en la app, antes de la mesa, y la llamada es
//        SÍNCRONA dentro del gesto: sin `await` ni temporizador delante, o el
//        navegador ya no ve la activación y la rechaza → `pedir`.
//   R3 · la app no sale nunca: aquí no hay ninguna llamada de salida.
//   R4 · si algo la saca: fuera de la mesa vuelve con el siguiente toque; dentro,
//        solo con «Iniciar mano» o «Siguiente mano», nunca en mitad de una mano
//        (un reacomodo a medias puede mandar el siguiente toque a otro botón)
//        → `creaPantallaCompleta`.
//   R5 · instalada como PWA ya nace a pantalla completa (manifiesto) y esto no
//        hace nada → `instalada`.
//   R6 · sin bloqueo del giro; R7 · Safari no tiene la API y esto no hace nada.
//   Y la exclusión: un toque dentro de `[data-sin-pantalla-completa]` no pide
//   → `SIN_PANTALLA_COMPLETA`.

export const CONSULTA_TACTIL = '(hover: none) and (pointer: coarse)'

const coincide = (win, consulta) => !!win?.matchMedia?.(consulta)?.matches

// R5 · la PWA instalada. `navigator.standalone` es la señal de iOS.
export function instalada(win) {
  return coincide(win, '(display-mode: standalone)')
    || coincide(win, '(display-mode: fullscreen)')
    || win?.navigator?.standalone === true
}

// R1 + R5 + R7: entrada principal táctil, API disponible y no instalada.
export function aplica(win) {
  const doc = win?.document
  return coincide(win, CONSULTA_TACTIL)
    && typeof doc?.documentElement?.requestFullscreen === 'function'
    && doc.fullscreenEnabled !== false
    && !instalada(win)
}

// R2 · pide la pantalla completa ANTES de devolver. Si ya la hay, nada. La
// promesa rechazada (sin activación, permiso denegado) se traga: no es un
// error de la app y no debe llegar a `unhandledrejection`. Devuelve si pidió.
export function pedir(doc, win) {
  if (!aplica(win)) return false
  if (doc.fullscreenElement) return false
  let promesa
  try {
    promesa = doc.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    return false
  }
  if (promesa && typeof promesa.catch === 'function') promesa.catch(() => {})
  return true
}

// El atributo que excluye un toque. `requestFullscreen` gasta la activación del
// gesto, y lo que comparte, copia o abre otra app la necesita para sí: esos
// botones lo llevan y su toque no pide (la pantalla completa vuelve con el
// siguiente). El núcleo no conoce botones, solo el atributo.
export const SIN_PANTALLA_COMPLETA = '[data-sin-pantalla-completa]'

const excluido = (e) => !!e?.target?.closest?.(SIN_PANTALLA_COMPLETA)

// R4 · la política. Fuera de la mesa, cualquier gesto pide; dentro, el gesto no
// pide y solo `reentrar` lo hace. El estado lo fija la app con `fijaDentroMesa`.
export function creaPantallaCompleta(doc, win) {
  let dentroMesa = false
  const alGesto = (e) => { if (!dentroMesa && !excluido(e)) pedir(doc, win) }
  return {
    fijaDentroMesa(v) { dentroMesa = !!v },
    estaDentroMesa: () => dentroMesa,
    alGesto,
    reentrar: () => pedir(doc, win),
    // `pointerup` activa la página según la especificación cuando el puntero no
    // es un ratón (en táctil, siempre). En CAPTURA, para que llegue antes que
    // cualquier `stopPropagation` de la pantalla y antes de que el clic cambie
    // de pantalla: el toque que lleva a la mesa todavía cuenta como de fuera.
    engancha() {
      doc.addEventListener('pointerup', alGesto, true)
      return () => doc.removeEventListener('pointerup', alGesto, true)
    },
  }
}

// La reentrada explícita de la mesa. No depende de la política: la mesa la
// llama solo donde R4 lo permite.
export const reentrar = (doc, win) => pedir(doc, win)
