// ── MES-PvP · árbitro v1.3 · Los ids de los mensajes de la mesa ──────────────
// Ficha AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md §2.3. Las frases entre personas viajan como
// CLAVE, y el árbitro la valida: esta lista es contrato (Contrato v1.3). Un id no cambia
// aunque cambie la frase o su emoji; una frase nueva lleva un id nuevo al final.
//
// Van en el ORDEN de `REACCIONES` (`config/reacciones.js`), que no se toca: ese archivo es de
// la mesa contra las IAS. El mapa id → frase vive en el trozo PvP (`lib/mensajesMesaCore.js`)
// y `mensajesMesaCore.test.js` ancla que los dos casan.
//
// PURO y sin dependencias: lo importan también la función `partida` (Deno) y el árbitro.

export const CLAVES_MENSAJE = Object.freeze([
  'ajilei',
  'eso_chamo',
  'estuvo_fino',
  'suerte',
  'me_lleva',
  'fue_trampa',
  'no_se_regala',
  'te_miro',
  'que_mano',
  'sabemos',
  'que_va',
  'no_me_hagas',
])

export const esClaveMensaje = (clave) => typeof clave === 'string' && CLAVES_MENSAJE.includes(clave)
