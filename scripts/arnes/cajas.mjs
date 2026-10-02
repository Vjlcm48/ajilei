// ── arnes/cajas.mjs · ARN-3c · ¿cabe el texto en su caja? (lo PURO) ──────────
// Rector: AJILEI_ARN-3c_v1.0.md D4. `verifyREN1` preguntaba, una sola vez y
// contra la palabra vieja, si «Heptacoins» se salía de alguna caja. La pregunta
// pasa a ser permanente dentro de `msg`: la página MIDE (rectángulos) y aquí se
// JUZGA, sin navegador, para poder probarlo en vitest (`cajas.test.js`).
//
// Qué es «la caja» de un texto: el primer antepasado (o él mismo) que no es
// `inline` ni `contents`, porque un `<span>` en línea no tiene caja propia que
// desbordar. Y qué es «salirse»:
//   · en horizontal, salir de su caja de CONTENIDO (es lo que crece con una
//     palabra más larga);
//   · en vertical, salir de su caja de RELLENO: la caja de línea puede invadir
//     el relleno vertical sin que se vea nada (la altura de línea manda);
//   · que la caja tenga desplazamiento interno (scroll > client);
//   · o que un antepasado que RECORTA (overflow hidden/clip) lo deje fuera. Los
//     que desplazan (auto/scroll) no cuentan: estar fuera de su vista es estar
//     más abajo en la página, no estar cortado.
// Un recorte con `text-overflow: ellipsis` es la marca del propio producto
// (VOZ-2): se informa como «recorta», no como rojo.

export const HOLGURA_CAJA = 0.5

const excesoFuera = (r, c) => Math.max(r.right - c.right, c.x - r.x, r.bottom - c.bottom, c.y - r.y)

/**
 * @param {object} m
 *   rango    {x,y,right,bottom} del texto
 *   contenido {x,right}        caja de contenido (horizontal)
 *   relleno   {y,bottom}       caja de relleno (vertical)
 *   scroll    {w,cw,h,ch}      de la caja
 *   recortes  [{x,y,right,bottom}] antepasados que recortan
 *   elipsis   boolean          la caja o un recorte pone «…»
 * @returns {{ estado: 'cabe'|'desborda'|'recorta', exceso: number }}
 */
export function juzgaCajaTexto(m, E = HOLGURA_CAJA) {
  const { rango, contenido, relleno, scroll, recortes = [], elipsis = false } = m
  const caja = { x: contenido.x, right: contenido.right, y: relleno.y, bottom: relleno.bottom }
  const exceso = Math.max(
    excesoFuera(rango, caja),
    scroll ? Math.max(scroll.w - scroll.cw, scroll.h - scroll.ch) : 0,
    ...recortes.map((c) => excesoFuera(rango, c)),
  )
  const r = Math.round(exceso * 100) / 100
  if (exceso <= E) return { estado: 'cabe', exceso: r }
  return { estado: elipsis ? 'recorta' : 'desborda', exceso: r }
}

// ── ARN-3c-ii · D8 · `vuelos.sobrante`: ¿hay algo visible bajo la carta? ────
// La reposición del descarte nace en el mazo del Pie con el tamaño de su
// ranura y cuelga 23 o 29 px por debajo de la fila de cartas (ARN-3b-ii §1).
// La regla con alcance (`vuelos.zona`) la acepta porque ahí solo hay tapete. Lo
// que vigila esta puerta es justo eso: en cada caso, con las voladoras ocultas
// un instante, se sondea la franja que la carta cubre por debajo de la fila
// (rejilla de 5×3 con `elementFromPoint`) y se pregunta si lo que hay debajo
// PINTA algo. La zona del humano es el tapete; cualquier otra cosa con texto,
// imagen, fondo propio, borde, sombra o contorno, visible, es rojo.

/** ¿Pinta algo este punto? `p` es lo que la página describió del elemento. */
export function puntoPinta(p) {
  if (!p || !p.el || p.esZona) return false
  if (p.visibility !== 'visible' || !(p.opacity > 0)) return false
  const x = p.pinta || {}
  return !!(x.texto || x.imagen || x.fondo || x.borde || x.sombra || x.contorno)
}

/**
 * El veredicto de una celda: `null` si no hubo ningún caso (en una mano sin
 * reposición desde el Pie no hay sobrante que mirar), `true` si en todos los
 * casos la franja es tapete, `false` si algún punto pinta. `culpables` dice
 * qué elemento y en qué caso.
 */
export function juzgaSobrante(casos) {
  if (!Array.isArray(casos) || casos.length === 0) return { ok: null, culpables: [] }
  const culpables = []
  casos.forEach((c, i) => {
    for (const p of c.pts || []) if (puntoPinta(p)) culpables.push({ caso: i, el: p.el, x: p.x, y: p.y, pinta: p.pinta })
  })
  return { ok: culpables.length === 0, culpables }
}
