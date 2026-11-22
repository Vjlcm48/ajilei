// ── TUT-1 · El mazo dado ─────────────────────────────────────────────────────
// Rector: AJILEI_TUT-1_T2_v1.0.md §1.1; Fase 0 §A.1 y §A.6. Sale de
// `src/dev/repartoGanador.js` (ARN-3d D14), que lo sigue usando desde aquí: la
// carpeta `dev` no viaja en la build y la partida guiada sí (GUI-1).
//
// QUÉ HACE. Prepara el ORDEN en que sale la baraja de la próxima mano y nada
// más. No abre ningún protegido: usa `setRng`, la API que `deck.js` exporta
// para inyectar el generador del barajado (Protegidos §6, la excepción de APU-1
// §6.11). El barajado es el de siempre, con sus mismas 39 tiradas: lo que cambia
// es qué devuelven, UNA vez. La mano siguiente baraja con el azar de verdad.
//
// R-2 DE LA FASE 0. Un orden armado que no se llega a consumir (la mesa se
// desmonta antes de repartir) dejaría el generador sembrado para la PRÓXIMA
// mesa, que sería una mesa real. `soltarMazo` lo devuelve al azar de verdad
// haya o no consumido sus tiradas, y la mesa guiada lo llama al desmontar, al
// «Salir» y al terminar (`screens/Guiada.jsx`).
import { createDeck, setRng, resetRng } from '../engine/deck.js'

/**
 * Las 39 tiradas que hacen que el barajado de `deck.js` (Fisher-Yates de atrás
 * adelante, `j = floor(rng() * (i + 1))`) devuelva exactamente `orden`. Puro.
 * @param {string[]} orden  los 40 ids, de arriba abajo
 * @returns {number[]}
 */
export function tiradasPara(orden) {
  const cur = createDeck().map((c) => c.id)
  const tiradas = []
  for (let i = cur.length - 1; i > 0; i--) {
    const j = cur.indexOf(orden[i])
    if (j < 0 || j > i) throw new Error(`tiradasPara: ${orden[i]} fuera de alcance en i=${i}`)
    // El centro del intervalo [j, j+1) / (i+1): sin riesgo de redondeo.
    tiradas.push((j + 0.5) / (i + 1))
    ;[cur[i], cur[j]] = [cur[j], cur[i]]
  }
  return tiradas
}

/**
 * Arma el barajado de la PRÓXIMA mano y se desarma solo al consumirlo: tras la
 * tirada 39, `resetRng()` devuelve el azar de verdad. Armarlo otra vez antes de
 * que se consuma lo reemplaza.
 * @param {string[]} orden
 */
export function armarOrden(orden) {
  const tiradas = tiradasPara(orden)
  let k = 0
  setRng(() => {
    const v = tiradas[k++]
    if (k >= tiradas.length) resetRng()
    return v
  })
}

/** El azar de verdad, se haya consumido o no el orden armado (R-2). */
export function soltarMazo() {
  resetRng()
}
