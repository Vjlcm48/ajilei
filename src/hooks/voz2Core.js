// ── VOZ-2 · La frase del óvalo, recogida ────────────────────────────────────
// Rector: AJILEI_VOZ-2_Fase1_v1.0.md (decisiones D4, D6). Informe de la Fase 0:
// docs/reportes/AJILEI_VOZ-2_Fase0_Informe_v1.0.md §B y §D.
//
// La frase de resultado se pinta recortada (`.voz2-texto`, hoja `voz2.css`) y
// la mesa necesita saber SI se recortó: con recorte la frase se puede tocar y
// desplegar; sin él, no hay nada que desplegar y el óvalo no responde.
//
// SE MIDE POR ANCHO REAL, NUNCA POR CARACTERES (D4). La misma frase cabe en
// 1920 y no cabe en 360×640, y con IDI-1 llegarán lenguas más largas que el
// castellano: cualquier umbral de longitud se rompería en silencio. La única
// fuente de verdad es la caja ya maquetada, y la pregunta es la de siempre:
// ¿el contenido desborda su caja de recorte?
//
// Función PURA: recibe las cuatro medidas (un elemento del DOM las tiene todas,
// así que se le puede pasar tal cual) y Vitest la sella sin navegador.

// Un píxel de holgura. `scrollHeight`/`clientHeight` son enteros redondeados y
// el interlineado de la casa da fracciones (16,9 · 2 = 33,8 → 34 contra 34):
// sin holgura un redondeo distinto en cada lado inventaría un recorte. Una
// línea de más, la más pequeña de la casa, son 11,7 px: no se confunden.
export const HOLGURA_RECORTE_PX = 1

/**
 * ¿Está recortado el texto? `-webkit-line-clamp` recorta en vertical (la
 * línea de más queda bajo la caja), y una línea sin cortes recortaría en
 * horizontal: se miran los dos ejes.
 */
export function estaRecortada({ scrollWidth, clientWidth, scrollHeight, clientHeight }) {
  if (![scrollWidth, clientWidth, scrollHeight, clientHeight].every(Number.isFinite)) return false
  return scrollHeight > clientHeight + HOLGURA_RECORTE_PX ||
         scrollWidth  > clientWidth  + HOLGURA_RECORTE_PX
}

// ── El indicio de toque: dónde acaba lo que se lee ──────────────────────────
// Victor eligió en la lámina «…» MÁS una flechita de oro detrás. El «…» lo pinta
// el propio `-webkit-line-clamp` y no tiene caja propia que medir, así que su
// final se deduce de los glifos y de lo que mide el «…» en esa letra.
//
// Cómo lo pone Chromium (medido en la 1b, 360×640 y 844×390): la última línea
// visible se maqueta como sin recorte —centrada, con sus glifos en su sitio—,
// y el «…» se dibuja DETRÁS del último glifo que, con el «…» a continuación,
// todavía cabe en la caja. Los glifos que quedan bajo el «…» conservan su caja
// (1a: «¡Ganas c…» daba 12 cajas para 8 leídos), así que no basta con tomar el
// borde derecho más lejano: en «con Oros…» la flecha caía encima del tercer
// punto. La cuenta es la del recorte:
//   1. la última línea = la de `top` mayor entre los glifos dentro del marco;
//   2. el último glifo leído = el último de esa línea cuyo borde derecho, más
//      el ancho del «…», no se pasa del marco;
//   3. el final = ese borde más el «…».
//
// Entran las cajas de los caracteres (`Range` de uno en uno, en el orden del
// texto), el marco de recorte (la caja del `.voz2-texto`) y el ancho del «…»
// en la letra del texto. Devuelve `{ x, y, alto }` —x del final del «…», y y
// alto de esa línea— o `null` si no hay ningún glifo dentro.
export function finDeLoLeido(cajas, marco, elipsis = 0) {
  if (!marco || !Array.isArray(cajas)) return null
  const dentro = cajas.filter((c) => c && c.width > 0 &&
    c.top >= marco.top - 0.5 && c.bottom <= marco.bottom + 0.5)
  if (!dentro.length) return null
  // Las de una misma línea comparten `top` salvo fracciones de la fuente.
  const ultimaTop = Math.max(...dentro.map((c) => c.top))
  const linea = dentro.filter((c) => c.top >= ultimaTop - 0.5)
  const leidos = linea.filter((c) => c.right + elipsis <= marco.right + 0.5)
  const fin = leidos.length ? leidos[leidos.length - 1].right : linea[0].left
  const top = Math.min(...linea.map((c) => c.top))
  const bottom = Math.max(...linea.map((c) => c.bottom))
  return { x: Math.min(fin + elipsis, marco.right), y: top, alto: bottom - top }
}

// ── La capa desplegada: dónde va ────────────────────────────────────────────
// Victor eligió «C · globo» en la posición «sobre el óvalo» (lámina de la 1a,
// laminas/voz2/lamina.html, `colocaCapa`): centrada sobre el óvalo y, si no
// cabe, empujada hacia dentro del viewport. Son las mismas cuentas que dibujó
// la lámina, para que lo que se ve en la mesa sea lo que se eligió:
//   · ancho: el del óvalo, nunca menos de 260 ni más de 520, y nunca más que
//     el viewport menos 12 px por lado;
//   · x: centrada en el óvalo, con 12 px de margen a cada borde del viewport;
//   · y: centrada en el óvalo, con 6 px de margen arriba y abajo.
// Dos pasos porque el alto depende del ancho (el texto se reparte en él): se
// fija el ancho, se maqueta y con el alto ya medido se coloca.
export const CAPA_ANCHO_MIN = 260
export const CAPA_ANCHO_MAX = 520
export const CAPA_MARGEN_X = 12
export const CAPA_MARGEN_Y = 6

export function anchoCapa(ovalo, vp) {
  return Math.min(Math.max(ovalo.width, CAPA_ANCHO_MIN), vp.width - 2 * CAPA_MARGEN_X, CAPA_ANCHO_MAX)
}

export function colocaCapa({ ovalo, vp, ancho, alto }) {
  const x = ovalo.left + ovalo.width / 2 - ancho / 2
  const y = ovalo.top + ovalo.height / 2 - alto / 2
  return {
    x: Math.max(CAPA_MARGEN_X, Math.min(vp.width - CAPA_MARGEN_X - ancho, x)),
    y: Math.max(CAPA_MARGEN_Y, Math.min(vp.height - CAPA_MARGEN_Y - alto, y)),
  }
}
