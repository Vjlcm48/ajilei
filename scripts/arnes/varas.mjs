// ── arnes/varas.mjs · ARN-3c-ii · las varas de tiempo y el encadenado (lo PURO)
// Rector: AJILEI_ARN-3c-ii_v1.0.md D9 y §1.1.1. Probado en `varas.test.js`.
//
// ── LA MEDIANA DE 3 ES UNA MAYORÍA POR PUERTA ────────────────────────────────
// Las varas de tiempo (`diagCEL0 celebracion`, `diagPUE dis`) miden con el reloj
// de pared y sus umbrales no se aflojan (D9). Lo que se cambia es CUÁNTAS veces
// se mide: tres repeticiones en la misma corrida, y el veredicto de cada puerta
// es el de su mediana. Para una puerta de umbral (x ≤ T, o x ≥ T) «la mediana
// de tres cumple» es EXACTAMENTE «al menos dos de las tres cumplen»: la mediana
// es el segundo valor ordenado. Por eso aquí se cuenta por puerta, sin leer el
// número —que cada puerta escribe a su manera— y sin aflojar nada.
//
// Un fallo es una frase con números («el saldo duró 4138 y pedía 2800»). Para
// saber si es «el mismo fallo» en las tres repeticiones se compara su CLAVE: la
// frase con cada número cambiado por «#».

/** La clave de un fallo: la frase sin sus cifras. */
export const claveFallo = (texto) => String(texto).replace(/-?\d+(?:[.,]\d+)?/g, '#')

/**
 * Los fallos que salen en al menos `quorum` de las repeticiones (mayoría = la
 * mediana de 3). Devuelve, por clave, cuántas veces salió y el texto de cada
 * repetición donde salió (para el informe: la cifra de cada una).
 */
export function mayoriaDeFallos(repeticiones, quorum = 2) {
  const porClave = new Map()
  repeticiones.forEach((fallos, i) => {
    for (const f of new Set(fallos)) {
      const k = claveFallo(f)
      if (!porClave.has(k)) porClave.set(k, { clave: k, veces: 0, textos: [] })
      const e = porClave.get(k)
      if (e.textos.some((t) => t.rep === i)) continue
      e.veces++
      e.textos.push({ rep: i, texto: f })
    }
  })
  const todos = [...porClave.values()]
  return { mantenidos: todos.filter((e) => e.veces >= quorum), sueltos: todos.filter((e) => e.veces < quorum) }
}

/**
 * Lo mismo para puertas con nombre y booleano (las `anota` de `diagPUE`): cada
 * repetición es una lista de `{ clave, ok, det }`. Una puerta es verde si lo es
 * en al menos `quorum` repeticiones; una que falta en una repetición cuenta
 * como roja ahí (no medir no es pasar).
 */
export function mayoriaDePuertas(repeticiones, quorum = 2) {
  const claves = [...new Set(repeticiones.flatMap((r) => r.map((p) => p.clave)))]
  return claves.map((clave) => {
    const vistas = repeticiones.map((r) => r.find((p) => p.clave === clave) || null)
    const verdes = vistas.filter((p) => p && p.ok).length
    return { clave, ok: verdes >= quorum, verdes, de: repeticiones.length, dets: vistas.map((p) => (p ? p.det : '(no medida)')) }
  })
}

/**
 * Separa los fallos en conocidos con dueño y nuevos. `conocidos` es una lista
 * de `{ patron: RegExp, dueno: string }`. Un rojo conocido sigue siendo rojo
 * (código 1): lo que cambia es que se dice de quién es.
 */
export function separarConocidos(fallos, conocidos) {
  const out = { conocidos: [], nuevos: [] }
  for (const f of fallos) {
    const c = conocidos.find((k) => k.patron.test(f))
    if (c) out.conocidos.push({ fallo: f, dueno: c.dueno })
    else out.nuevos.push(f)
  }
  return out
}

// ── §1.1.1 · El encadenado honesto ───────────────────────────────────────────
// `useCoreografia` marca `encadenado: !!audio`: verdadero con que el toc-toc se
// haya PEDIDO, suene o no. Lo que de verdad encadena la fiesta al `end` de
// Howler es `esperaPrecedente(audio) > 0` —el sonido está sonando y tiene
// duración—; si da 0, `esperaRevienta` cae al reloj nominal (`TOC_NOMINAL_MS`)
// y la fiesta revienta por temporizador aunque `encadenado` diga que no. El
// producto no se toca (D1): el arnés lo deduce de lo que ya publica, porque
// `espera` vale EXACTAMENTE `TOC_NOMINAL_MS` cuando `esperaPrecedente` dio 0, y
// en otro caso vale `min(ESPERA_TOPE_MS, duración + ESPERA_MARGEN_MS)`.
export function encadenadoHonesto(ancla, tocNominalMs) {
  if (!ancla || ancla.encadenado !== true) return false
  return ancla.espera !== tocNominalMs
}
