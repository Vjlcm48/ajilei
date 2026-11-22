// ── TUT-1 · La geometría de la capa de señalización, pura ───────────────────
// Rector: AJILEI_TUT-1_T1_v1.0.md §1.1 (forma elegida en la lámina, normativo
// `AJILEI_Tutorial_v1.4.md`). Molde de `miniPerfilCore.js` y de `colocaCapa`
// (VOZ-2): las cuentas viven aquí, sin React ni DOM, para que Vitest las pruebe
// sin jsdom (que este proyecto no tiene, hallazgo de FRZ-1). `CapaSenal.jsx`
// mide con `getBoundingClientRect` y le pasa cajas planas.
//
// Las cajas son `{left, top, width, height}` en px de la VENTANA: la capa va por
// portal a `body`, fuera del `zoom` de `#root` (INV-59), así que lo que devuelve
// `getBoundingClientRect` ya es lo que hay que pintar — no se divide por la
// escala (eso es `aPropios`, para quien vive DENTRO del árbol ampliado).
//
// ── UN HUECO POR ANCLA (hallazgo 5 de la lámina) ─────────────────────────────
// La lámina abría UN hueco con la caja que envolvía a todas las anclas, y en la
// PC el del paso 2 (Apostar y los multiplicadores) dejaba ver media «Pasar» y
// media «Retirarse». Ahora cada ancla tiene su hueco. Dos que se pisan (botones
// pegados, a menos de dos márgenes) se funden en su unión SOLO si esa unión no
// destapa otro control (`evitar`): los cuatro multiplicadores, sí; «Apostar» con
// la fila de multiplicadores, no, porque la caja de los dos cubre «Retirarse»
// (lo encontró `diagDSK tut`). Los que se pisan sin fundirse los pinta bien la
// máscara del velo y las bandas los recortan igual.

/** El margen del hueco alrededor del ancla («más un margen de 6 px»). */
export const MARGEN_HUECO = 6
/** Lo que se respeta a cada lado de la ventana. */
export const BORDE = 12
/** La separación entre el rótulo y lo que señala. */
export const SEPARACION = 10
/** Por encima de esto entre la tarjeta de respaldo y el ancla, se dibuja la flecha. */
export const FLECHA_DESDE = 36
/** El techo del rótulo (normativo, «regla de escritura»): dos líneas en 360 × 640. */
export const MAX_LINEAS = 2
/** El radio de las esquinas del hueco (el de los botones de la mesa). */
export const RADIO_HUECO = 12

const caja = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height })

/** La caja que envuelve a todas. Ignora las de tamaño 0. */
export function union(cajas) {
  const vivas = (cajas ?? []).filter((c) => c && c.width > 0 && c.height > 0)
  if (vivas.length === 0) return null
  const l = Math.min(...vivas.map((c) => c.left))
  const t = Math.min(...vivas.map((c) => c.top))
  const r = Math.max(...vivas.map((c) => c.left + c.width))
  const b = Math.max(...vivas.map((c) => c.top + c.height))
  return caja(l, t, r - l, b - t)
}

/** El hueco de un ancla: el ancla más el margen, recortado a la ventana. */
export function huecoDe(ancla, vista, margen = MARGEN_HUECO) {
  if (!ancla || !(ancla.width > 0 && ancla.height > 0)) return null
  const l = Math.max(0, ancla.left - margen)
  const t = Math.max(0, ancla.top - margen)
  const r = Math.min(vista.w, ancla.left + ancla.width + margen)
  const b = Math.min(vista.h, ancla.top + ancla.height + margen)
  if (r <= l || b <= t) return null
  return caja(l, t, r - l, b - t)
}

/** Área común de dos cajas (0 si no se tocan). */
export function solape(a, b) {
  if (!a || !b) return 0
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

/** ¿El centro de `c` cae dentro de `h`? (lo que un hueco «destapa») */
export const destapa = (h, c) => {
  const x = c.left + c.width / 2
  const y = c.top + c.height / 2
  return x > h.left && x < h.left + h.width && y > h.top && y < h.top + h.height
}

/**
 * Los huecos de una lista de anclas: uno por ancla. Dos que se pisan se funden en
 * su unión mientras esa unión no destape ninguna caja de `evitar` (los demás
 * controles de la pantalla). Pueden quedar huecos que se pisan: el velo es una
 * máscara y las bandas se recortan por franjas, así que no se vuelven a tapar.
 * @param {object[]} anclas  las cajas de las anclas
 * @param {{margen?:number, evitar?:object[]}} [opc]
 */
export function huecosDe(anclas, vista, { margen = MARGEN_HUECO, evitar = [] } = {}) {
  let huecos = (anclas ?? []).map((a) => huecoDe(a, vista, margen)).filter(Boolean)
  const fundible = (u) => !evitar.some((c) => c && destapa(u, c))
  for (let p = parFundible(huecos, fundible); p; p = parFundible(huecos, fundible)) {
    const [i, j, u] = p
    huecos = [...huecos.filter((_, k) => k !== i && k !== j), u]
  }
  return huecos.sort((a, b) => a.top - b.top || a.left - b.left)
}

// De los pares que se pisan y se pueden fundir, el de unión más pequeña: así los
// multiplicadores se juntan entre ellos antes de que «×1» se vaya con «Apostar».
function parFundible(lista, fundible) {
  let mejor = null
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      if (solape(lista[i], lista[j]) === 0) continue
      const u = union([lista[i], lista[j]])
      if (fundible(u) && (!mejor || u.width * u.height < mejor[2].width * mejor[2].height)) mejor = [i, j, u]
    }
  }
  return mejor
}

/**
 * Las bandas del velo: rectángulos que cubren TODA la ventana salvo los huecos,
 * sin pisarse (los que reciben el toque). Se corta la ventana en franjas
 * horizontales por los bordes de los huecos y en cada franja se toma lo que no es
 * hueco. Con un hueco salen cuatro: arriba, izquierda, derecha y abajo.
 * @param {object|object[]|null} huecos  uno o varios (pueden pisarse)
 */
export function bandas(huecos, vista) {
  const lista = (Array.isArray(huecos) ? huecos : [huecos]).filter(Boolean)
  if (lista.length === 0) return [caja(0, 0, vista.w, vista.h)]
  const ys = [...new Set([0, vista.h, ...lista.flatMap((h) => [h.top, h.bottom])])]
    .filter((y) => y >= 0 && y <= vista.h).sort((a, b) => a - b)
  const out = []
  for (let k = 0; k < ys.length - 1; k++) {
    const y0 = ys[k]
    const y1 = ys[k + 1]
    if (y1 <= y0) continue
    const cortan = lista.filter((h) => h.top < y1 && h.bottom > y0).sort((a, b) => a.left - b.left)
    let x = 0
    for (const h of cortan) {
      if (h.left > x) out.push(caja(x, y0, h.left - x, y1 - y0))
      x = Math.max(x, h.right)
    }
    if (x < vista.w) out.push(caja(x, y0, vista.w - x, y1 - y0))
  }
  // Una franja entera seguida de otra igual de ancha es la misma banda.
  const juntas = []
  for (const b of out) {
    const previa = juntas.find((p) => p.left === b.left && p.width === b.width && p.bottom === b.top)
    if (previa) Object.assign(previa, caja(previa.left, previa.top, previa.width, b.bottom - previa.top))
    else juntas.push({ ...b })
  }
  return juntas
}

/** El radio de las esquinas de un hueco: el de la casa, sin pasar de la mitad del lado corto. */
export const radioDe = (h, radio = RADIO_HUECO) => Math.max(0, Math.min(radio, h.width / 2, h.height / 2))

const encajar = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max))

/** Cuántas líneas ocupa un texto de `alto` px con su interlineado `linea` px. */
export function lineasDe(alto, linea) {
  if (!(alto > 0) || !(linea > 0)) return 0
  return Math.max(1, Math.round(alto / linea))
}

/**
 * La BURBUJA pegada al ancla, con pico: encima si cabe, si no debajo. El pico
 * apunta al centro del ancla y nunca sale de las esquinas.
 * @param {{w:number,h:number}} tam  el tamaño medido de la burbuja
 * @param {object} hueco             lo que señala (la unión de sus huecos)
 * @returns {{caja:object, lado:'arriba'|'abajo', picoX:number}}
 */
export function colocarBurbuja({ tam, hueco, vista, radio = 12 }) {
  const cx = hueco.left + hueco.width / 2
  const left = encajar(cx - tam.w / 2, BORDE, vista.w - BORDE - tam.w)
  const arriba = hueco.top - SEPARACION - tam.h
  const cabeArriba = arriba >= BORDE
  const top = cabeArriba ? arriba : Math.min(hueco.bottom + SEPARACION, vista.h - BORDE - tam.h)
  const picoX = encajar(cx - left, radio + 8, tam.w - radio - 8)
  return { caja: caja(left, top, tam.w, tam.h), lado: cabeArriba ? 'arriba' : 'abajo', picoX }
}

/**
 * ¿Tiene sitio la burbuja? No, si pasa de `MAX_LINEAS`, si se sale de la ventana
 * o si pisa algún hueco (taparía lo que señala). Entonces va la tarjeta de
 * respaldo (`colocarRespaldo`).
 */
export function burbujaCabe({ caja: c, huecos, vista, lineas, maxLineas = MAX_LINEAS }) {
  if (!c) return false
  if (lineas > maxLineas) return false
  const dentro = c.left >= BORDE - 0.5 && c.top >= BORDE - 0.5
    && c.left + c.width <= vista.w - BORDE + 0.5 && c.top + c.height <= vista.h - BORDE + 0.5
  if (!dentro) return false
  return !(huecos ?? []).some((h) => solape(c, h) > 0)
}

/**
 * La TARJETA DE RESPALDO, fija: abajo y centrada; si pisa un hueco, arriba. Lleva
 * dentro el «paso n de m» y los botones (sin barra aparte). `techo`: lo más
 * arriba que puede ir (bajo «Salir», que vive arriba a la derecha).
 */
export function colocarRespaldo({ tam, huecos, vista, techo = BORDE }) {
  const left = encajar((vista.w - tam.w) / 2, BORDE, vista.w - BORDE - tam.w)
  const abajo = caja(left, Math.max(BORDE, vista.h - BORDE - tam.h), tam.w, tam.h)
  if (!(huecos ?? []).some((h) => solape(abajo, h) > 0)) return abajo
  return caja(left, Math.max(BORDE, techo), tam.w, tam.h)
}

/**
 * La barra de controles de la burbuja: abajo, salvo que pise un hueco o la
 * burbuja; entonces arriba (no más arriba que `techo`).
 */
export function colocarBarra({ tam, evitar, vista, techo = BORDE }) {
  const left = encajar((vista.w - tam.w) / 2, BORDE, vista.w - BORDE - tam.w)
  const abajo = caja(left, vista.h - BORDE - tam.h, tam.w, tam.h)
  if (!(evitar ?? []).some((c) => solape(abajo, c) > 0)) return abajo
  return caja(left, Math.max(BORDE, techo), tam.w, tam.h)
}

/**
 * La señal SIN velo (señales de primera vez): el sitio libre más cercano al
 * ancla. Recorre la ventana en una rejilla de `paso` px y puntúa cada sitio: lo
 * que pisa de los obstáculos (con su peso) pesa mucho más que la distancia al
 * ancla. Así no tapa el óvalo, las cartas, la fila ni la barra propia si hay
 * sitio, y si no lo hay pisa lo menos posible.
 * @param {{caja:object, peso?:number}[]} obstaculos
 */
export function colocarLibre({ tam, ancla, obstaculos, vista, paso = 8 }) {
  const cx = ancla.left + ancla.width / 2
  const cy = ancla.top + ancla.height / 2
  let mejor = null
  for (let top = BORDE; top <= vista.h - BORDE - tam.h; top += paso) {
    for (let left = BORDE; left <= vista.w - BORDE - tam.w; left += paso) {
      const c = caja(left, top, tam.w, tam.h)
      let pisa = solape(c, ancla) * 4
      for (const o of obstaculos ?? []) pisa += solape(c, o.caja) * (o.peso ?? 1)
      const dist = Math.hypot(left + tam.w / 2 - cx, top + tam.h / 2 - cy)
      const nota = pisa * 50 + dist
      if (mejor === null || nota < mejor.nota) mejor = { nota, c, pisa }
    }
  }
  return mejor ? { caja: mejor.c, pisa: mejor.pisa } : { caja: caja(BORDE, BORDE, tam.w, tam.h), pisa: 0 }
}

// El punto del borde de `c` en la recta que va de su centro hacia (x, y).
function bordeHacia(c, x, y) {
  const cx = c.left + c.width / 2
  const cy = c.top + c.height / 2
  const dx = x - cx
  const dy = y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const tx = dx !== 0 ? (c.width / 2) / Math.abs(dx) : Infinity
  const ty = dy !== 0 ? (c.height / 2) / Math.abs(dy) : Infinity
  const t = Math.min(tx, ty)
  return { x: cx + dx * t, y: cy + dy * t }
}

/**
 * La flecha de la tarjeta de respaldo al ancla, de borde a borde, o `null` si
 * quedan cerca (menos de `FLECHA_DESDE`) o se pisan.
 */
export function flechaEntre(tarjeta, hueco) {
  if (!tarjeta || !hueco || solape(tarjeta, hueco) > 0) return null
  const hx = hueco.left + hueco.width / 2
  const hy = hueco.top + hueco.height / 2
  const a = bordeHacia(tarjeta, hx, hy)
  const b = bordeHacia(hueco, tarjeta.left + tarjeta.width / 2, tarjeta.top + tarjeta.height / 2)
  const largo = Math.hypot(b.x - a.x, b.y - a.y)
  if (largo < FLECHA_DESDE) return null
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
}

/**
 * Un rótulo con `**negrita**` en trozos: `[{texto, fuerte}]`. El texto sigue
 * siendo UNO en el diccionario (IDI-1 lo traduce entero); aquí sólo se corta.
 */
export function trozosRotulo(texto) {
  return String(texto ?? '').split('**').map((t, i) => ({ texto: t, fuerte: i % 2 === 1 })).filter((t) => t.texto !== '')
}
