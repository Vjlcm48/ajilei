// ── MOT-1 1b · El azar del servidor (K-5) ───────────────────────────────────
// Lo que la 1e le pasa a `setRng` (`deck.js:59`). El árbitro no sabe cuál le dieron:
// baraja con `shuffleDeck`, y las pruebas le ponen una semilla.

/** Un número en [0, 1) sacado del CSPRNG: 32 bits / 2³². */
export function azarSeguro() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
}
