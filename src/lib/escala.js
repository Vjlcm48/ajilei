// ── TAB-1 · La mesa según el tamaño: clase y factor ─────────────────────────
// Rector: AJILEI_TAB-1_Fase1b-1e_Codigo_v1.0.md §0–§2. Viene del borrador de la
// lámina (`laminas/tab1/escala.js`) con las decisiones selladas del 18 al 20 de
// octubre: «traje + escala». Un solo factor (`zoom` sobre `#root`, en
// `src/styles/escala.css`) amplía o reduce la mesa entera sin deformarla.
//
//   Celular (lado corto < 600)            → nada: ni atributo ni variable
//   Vertical de lado corto ≥ 600          → `tv`: el traje A del teléfono ×f
//   Horizontal de alto > 600 (traje C)    → `h`: se reduce hasta caber o crece
//   Horizontal de alto ≤ 600 (traje B)    → nada (R-2, sub-tanda propia)
//
// Reglas que esto cumple por construcción:
//  · O1: el factor depende SOLO de la ventana (y de la pantalla completa, que
//    cambia la ventana útil), nunca del contenido ni del número de asientos. Se
//    calcula para la mesa de 5, la peor, y no salta al eliminarse un asiento.
//  · El celular no recibe nada, así que no evalúa ni una regla de escala.css y
//    queda idéntico al píxel (Grupo 1 de la lámina; vara V-cel del modo `tab`).
//  · La escala vive SOLO en la mesa (§1.4): el hook `useEscalaMesa` la escribe
//    al montar la mesa y la borra al desmontarla. Fuera de la mesa, el lobby,
//    Retar y Salas ya escalan solos con `--u` en `vmin`; bajo `zoom` crecerían
//    dos veces.
//
// Todo lo de este archivo es puro salvo `enganchaEscala`, que recibe el
// `window` por parámetro (el molde de `useCongelado`: el test recorre los
// oyentes de verdad con un DOM falso; el proyecto no tiene jsdom).

// Las referencias, medidas en la Fase 0 y en la lámina (1a §3.2–§3.5):
//  · tv  572×812: la ventana propia en que el traje A cabe entero en la mesa
//    de 5 (805 dejaba 3–4 px; 812 es la decisión del rector, §1.2.3).
//  · h   713: el alto propio en que la mesa de 5 del traje C cabe SIN desplazar
//    (697 de mesa + 16 de pantalla; 677 era solo «controles a la vista»).
//  · h   1126×830: `#root` y el mínimo de `.game-table` a partir del cual crece.
export const REF = Object.freeze({
  tv: Object.freeze({ ancho: 572, alto: 812, max: 1.6 }),
  hBaja: Object.freeze({ alto: 713, min: 0.87 }),
  hAlta: Object.freeze({ ancho: 1126, alto: 830, max: 1.3 }),
})

// Por debajo de este lado corto la ventana es un celular. 600 es el corte en
// que hoy acaba el teléfono acostado (traje B, `max-height: 600px`).
export const LADO_CELULAR = 600

// R-7 · La banda oscura que Safari pinta sobre el pie en pantalla completa
// horizontal (Fase 0, TF-11: ≈28 px CSS). Es VISUAL: no escala con el factor.
// Se descuenta del alto útil para que la mesa entera quede por encima.
export const RESERVA_PIE_FS = 28

const clamp = (lo, x, hi) => Math.min(hi, Math.max(lo, x))
const r3 = (x) => Math.round(x * 1000) / 1000

/** La orientación que ve el CSS: `portrait` cuando el alto es ≥ el ancho. */
export const orientacionDe = (ancho, alto) => (alto >= ancho ? 'vertical' : 'horizontal')

/**
 * La clase de la ventana y el atributo que le toca.
 * @param {{ancho:number, alto:number, orientacion?:'vertical'|'horizontal'}} v
 * @returns {{clase:'celular'|'vertical-ancha'|'horizontal'|'horizontal-b', atributo:'tv'|'h'|null}}
 */
export function clasificar({ ancho, alto, orientacion = orientacionDe(ancho, alto) }) {
  if (Math.min(ancho, alto) < LADO_CELULAR) return { clase: 'celular', atributo: null }
  if (orientacion === 'vertical') return { clase: 'vertical-ancha', atributo: 'tv' }
  // R-2 sigue aplazada: la ventana horizontal que hoy cae en el traje del
  // teléfono acostado (alto ≤ 600) queda exactamente como hoy.
  if (alto <= 600) return { clase: 'horizontal-b', atributo: null }
  return { clase: 'horizontal', atributo: 'h' }
}

/** El alto útil de la clase `h`: sin la banda del pie en pantalla completa. */
export const altoEfectivo = ({ alto, orientacion, pantallaCompleta }) =>
  (pantallaCompleta && orientacion === 'horizontal' ? alto - RESERVA_PIE_FS : alto)

/**
 * El factor (§2). 1 en las clases sin atributo.
 * @param {{ancho:number, alto:number, orientacion?:string, pantallaCompleta?:boolean}} v
 */
export function factorDe(v) {
  const orientacion = v.orientacion ?? orientacionDe(v.ancho, v.alto)
  const { atributo } = clasificar({ ...v, orientacion })
  if (atributo === 'tv') {
    const { ancho, alto, max } = REF.tv
    return r3(clamp(1, Math.min(v.ancho / ancho, v.alto / alto), max))
  }
  if (atributo === 'h') {
    const hEf = altoEfectivo({ alto: v.alto, orientacion, pantallaCompleta: !!v.pantallaCompleta })
    if (hEf < REF.hAlta.alto) return r3(clamp(REF.hBaja.min, hEf / REF.hBaja.alto, 1))
    return r3(clamp(1, Math.min(v.ancho / REF.hAlta.ancho, hEf / REF.hAlta.alto), REF.hAlta.max))
  }
  return 1
}

/** Clase, atributo y factor de una ventana, de una vez. */
export function escalaDe(v) {
  const orientacion = v.orientacion ?? orientacionDe(v.ancho, v.alto)
  const { clase, atributo } = clasificar({ ...v, orientacion })
  return { clase, atributo, f: atributo ? factorDe({ ...v, orientacion }) : 1 }
}

// ── Cajas visuales → px propios ─────────────────────────────────────────────
// Bajo `zoom` en `#root`, `getBoundingClientRect` da la caja VISUAL (ampliada),
// pero lo que un componente escribe en `left/top/width/height` (y en un
// `translate`) se vuelve a ampliar. Quien coloque algo midiendo convierte la
// caja UNA vez, al medir, y escribe en px propios. Dividir la salida además
// divide dos veces (el error que la lámina encontró: 1a §5).
/** Una caja (DOMRect o similar) en px propios del árbol ampliado. */
export function aPropios(rect, f = 1) {
  if (!rect) return rect
  if (f === 1) return rect
  const left = rect.left / f, top = rect.top / f, width = rect.width / f, height = rect.height / f
  return { left, top, width, height, x: left, y: top, right: left + width, bottom: top + height }
}

/** El factor vigente en este documento: el que escribió el hook, o 1. */
export function escalaActual(doc = globalThis.document) {
  const v = Number.parseFloat(doc?.documentElement?.style?.getPropertyValue('--escala'))
  return Number.isFinite(v) && v > 0 ? v : 1
}

// ── Escribir y borrar ───────────────────────────────────────────────────────
/** Escribe (o borra) `data-escala` y `--escala` en `<html>`. Idempotente. */
export function aplicarEscala(doc, { atributo, f }) {
  const html = doc.documentElement
  if (!atributo) { quitarEscala(doc); return }
  if (html.getAttribute('data-escala') !== atributo) html.setAttribute('data-escala', atributo)
  if (html.style.getPropertyValue('--escala') !== String(f)) html.style.setProperty('--escala', String(f))
}

/** Deja `<html>` como si la escala no existiera. */
export function quitarEscala(doc) {
  const html = doc.documentElement
  if (html.hasAttribute('data-escala')) html.removeAttribute('data-escala')
  if (html.style.getPropertyValue('--escala')) html.style.removeProperty('--escala')
}

/** Lo que el hook lee de la ventana. */
export function ventanaDe(win) {
  const doc = win.document
  return {
    ancho: win.innerWidth,
    alto: win.innerHeight,
    // La misma condición que el CSS (`orientation: portrait` = alto ≥ ancho):
    // así JSX, CSS y escala no se desincronizan.
    orientacion: win.matchMedia('(orientation: portrait)').matches ? 'vertical' : 'horizontal',
    pantallaCompleta: !!doc.fullscreenElement,
  }
}

/**
 * Engancha la escala a una ventana: la escribe ya, la recalcula con `resize`,
 * `orientationchange`, el cambio de orientación de `matchMedia` y
 * `fullscreenchange`, y devuelve la función que la desengancha Y la borra.
 */
export function enganchaEscala(win) {
  const doc = win.document
  const recalcular = () => aplicarEscala(doc, escalaDe(ventanaDe(win)))
  const mq = win.matchMedia('(orientation: portrait)')
  recalcular()
  win.addEventListener('resize', recalcular)
  win.addEventListener('orientationchange', recalcular)
  mq.addEventListener('change', recalcular)
  doc.addEventListener('fullscreenchange', recalcular)
  return () => {
    win.removeEventListener('resize', recalcular)
    win.removeEventListener('orientationchange', recalcular)
    mq.removeEventListener('change', recalcular)
    doc.removeEventListener('fullscreenchange', recalcular)
    quitarEscala(doc)
  }
}
