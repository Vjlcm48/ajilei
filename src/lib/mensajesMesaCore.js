// ── MES-PvP L-M 2 · Los mensajes de la mesa entre personas (lámina) ─────────
// Ficha AJILEI_MES-PvP_LM-2_v1.0.md §2. Puro, sin React ni DOM: lo usan la capa
// (`screens/MensajesMesa.jsx`), el árbitro imitado y las pruebas.
//
// Lo sellado por Victor (2026-11-05/06):
//   · son las 12 frases de `config/reacciones.js`, sin texto libre;
//   · viajan como CLAVE y cada pantalla las pinta en su idioma. La clave sale del emoji de la
//     frase (`codepointDe`), la misma derivación que ya nombra el recurso de Noto: ninguna
//     lista paralela que se desincronice al primer retoque de redacción;
//   · freno de 10 s POR JUGADOR, contado desde que se publica su mensaje; no limita a los
//     demás, y puede haber una burbuja viva por jugador.
// Contra las IAS no cambia nada: el freno de allí («una a la vez» + 5 s) vive en
// `hooks/useReacciones.js` y esto no lo importa.
import { REACCIONES, REACCION_TOTAL_MS, codepointDe } from '../config/reacciones'

export const FRENO_MENSAJE_MS = 10000

export const claveDeFrase = (frase) => (REACCIONES.includes(frase) ? codepointDe(frase) : null)
export const fraseDeClave = (clave) => REACCIONES.find((f) => codepointDe(f) === clave) ?? null
export const CLAVES_MENSAJE = Object.freeze(REACCIONES.map(codepointDe))

// Las burbujas vivas a la hora `ahora`: la última publicada de cada asiento, mientras dura su
// ciclo (0,3 + 2,4 + 0,3 s). `lista` = [{ asiento, clave, hora, id }], asientos ya rotados.
export function burbujasVivas(lista, ahora) {
  const ultima = new Map()
  for (const m of lista) {
    if (!fraseDeClave(m.clave) || m.hora > ahora) continue
    const previa = ultima.get(m.asiento)
    if (!previa || m.hora >= previa.hora) ultima.set(m.asiento, m)
  }
  return [...ultima.values()]
    .filter((m) => ahora - m.hora < REACCION_TOTAL_MS)
    .sort((a, b) => a.asiento - b.asiento)
}

// Los ms que le quedan al freno de `asiento` (0 = puede mandar).
export function frenoRestante(lista, asiento, ahora) {
  const propias = lista.filter((m) => m.asiento === asiento && m.hora <= ahora)
  if (!propias.length) return 0
  const ultima = Math.max(...propias.map((m) => m.hora))
  return Math.max(0, FRENO_MENSAJE_MS - (ahora - ultima))
}

// La regla, del lado de quien publica (el árbitro, en la sub-tanda 5): una clave conocida y el
// freno del que la manda. Devuelve el motivo del rechazo o null.
export function rechazoDeMensaje(lista, asiento, clave, ahora) {
  if (!fraseDeClave(clave)) return 'clave_desconocida'
  if (frenoRestante(lista, asiento, ahora) > 0) return 'freno'
  return null
}

// ── La colocación de las burbujas ajenas ────────────────────────────────────
// Bajo el nombre de quien la manda, con el pico hacia arriba, dentro del ancho de su recuadro
// (así dos recuadros vecinos no se pisan). Si choca con una burbuja ya puesta (la propia, que es
// satélite del ⋮ en el teléfono), baja lo justo.
// `nombre` y `recuadro`: cajas {left, top, right, bottom}; `caja`: {width, height} medida con el
// tope ya aplicado; `puestas`: cajas ya colocadas; `area`: {izq, der}.
export const PICO_PX = 8
export const AIRE_PX = 4

export function colocarAjena({ nombre, recuadro, caja, puestas = [], area }) {
  const izqMin = Math.max(area.izq, recuadro.left + AIRE_PX)
  const derMax = Math.min(area.der, recuadro.right - AIRE_PX)
  const centro = (nombre.left + nombre.right) / 2
  const left = Math.min(Math.max(centro - caja.width / 2, izqMin), Math.max(izqMin, derMax - caja.width))
  let top = nombre.bottom + PICO_PX + 2
  for (let k = 0; k < puestas.length; k++) {
    const p = puestas.find((q) => corta({ left, top, right: left + caja.width, bottom: top + caja.height }, q))
    if (!p) break
    top = p.bottom + AIRE_PX
  }
  const picoX = Math.min(Math.max(centro - left, PICO_PX + 2), caja.width - PICO_PX - 2)
  return { left, top, picoX, desplazada: top > nombre.bottom + PICO_PX + 2 }
}

export function corta(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0.5 && h > 0.5
}

// El tope de ancho de una ajena: su recuadro menos el aire, sin bajar del suelo de la familia.
export const topeAjena = (recuadro, suelo) => Math.max(suelo, recuadro.right - recuadro.left - 2 * AIRE_PX)
