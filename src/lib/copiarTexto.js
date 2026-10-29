// ── CFG-1 1a · Copiar un texto al portapapeles ───────────────────────────────
// Rector: AJILEI_CFG-1_Fase1a_v1.0.md §2.3 («Copiar correo»).
//
// Primero la API moderna (`navigator.clipboard.writeText`), que pide contexto
// seguro (https o localhost) y en algunos navegadores el foco del documento.
// Si no está o la rechaza, el respaldo de siempre: un `<textarea>` fuera de la
// vista, seleccionado, y `execCommand('copy')`. Está obsoleto pero sigue vivo
// en todos los navegadores que la casa mide, y es lo único que funciona por
// http plano (la prueba en el S25 por la red local).
//
// Devuelve si pudo. Quien llama decide qué decir; nunca lanza.

/** @param {string} texto @returns {Promise<boolean>} */
export async function copiarTexto(texto) {
  try {
    if (globalThis.navigator?.clipboard?.writeText) {
      await globalThis.navigator.clipboard.writeText(texto)
      return true
    }
  } catch { /* sin permiso o sin contexto seguro: al respaldo */ }
  return copiarConTextarea(texto)
}

function copiarConTextarea(texto) {
  const doc = globalThis.document
  if (!doc?.body) return false
  const area = doc.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  // Fuera de la vista y sin tamaño que empuje nada; `fixed` para que la
  // selección no haga saltar el desplazamiento de la página.
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none'
  const foco = doc.activeElement
  doc.body.appendChild(area)
  let pudo
  try {
    area.select()
    pudo = doc.execCommand('copy') === true
  } catch { pudo = false }
  area.remove()
  // El foco vuelve a donde estaba (el botón «Copiar correo»), no al <body>.
  if (foco && typeof foco.focus === 'function') foco.focus()
  return pudo
}
