// PAN-2 · EL HUECO DE LA CÁMARA EN LA APP INSTALADA (2026-11-26; nota bajo INV-45).
//
// En el WebAPK de Android, Chrome reserva el margen del recorte de la cámara si
// la página no declara `viewport-fit=cover`; desde Chrome 158 / Android 17 lo
// pinta BLANCO (la franja del S25), y al girar lo pierde. La cura mínima de
// FS-1: declarar `cover` SOLO instalada (`display-mode: fullscreen`), en vivo al
// arrancar. `index.html` no cambia, así que la pestaña de Chrome (PAN-1, que
// entra en pantalla completa DESPUÉS del arranque) e iOS (instalado es
// `standalone`) siguen sin `cover`: FS-1 completo sigue abierto.
//
// Con `cover`, `env(safe-area-inset-*)` deja de valer 0 en el WebAPK: en
// inmersivo es solo el recorte de la cámara. Las reservas ya escritas (lobby,
// `.sal`, hojas, SumaMente, video, tutorial, panel ⋮) se encienden solas.
//
// Núcleo puro, sin React y con `doc`/`win` por parámetro (el molde de
// `pantallaCompletaCore.js`). `main.jsx` lo llama una vez, antes de montar.
// Vigilante: `viewportCover.test.js`.

export const CONSULTA_INSTALADA = '(display-mode: fullscreen)'
export const COVER = 'viewport-fit=cover'

// Instalada en Android: el manifiesto pide `fullscreen` y solo el WebAPK lo da
// al arrancar. Ni `standalone`, ni iOS, ni la pestaña.
export function debeCubrir(win) {
  try {
    return !!win?.matchMedia?.(CONSULTA_INSTALADA)?.matches
  } catch {
    return false
  }
}

// Añade `, viewport-fit=cover` a la meta del viewport una sola vez. Devuelve si
// lo aplicó. Nunca lanza: si algo falta, la app arranca como antes.
export function aplicarCover(doc, win) {
  try {
    if (!debeCubrir(win)) return false
    const meta = doc?.querySelector?.('meta[name="viewport"]')
    if (!meta) return false
    const content = meta.getAttribute('content') ?? ''
    if (/viewport-fit\s*=/.test(content)) return false
    meta.setAttribute('content', content.trim() ? `${content}, ${COVER}` : COVER)
    return true
  } catch {
    return false
  }
}
