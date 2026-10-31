// ── DSK-U3 · "Mano actual": constantes selladas ──────────────────────────────
// Documento rector: docs/AJILEI_Menu_Utilidades_v1.6.md §3 (antes v1.3 §2 y §3).
// FUENTE ÚNICA que consumen la app Y el arnés (modo u3), nunca una copia
// paralela — la lección que dejó U2 con las 12 frases. Un módulo sin React ni
// DOM, para que `node` pueda importarlo tal cual.

// ── CFG-1 1e · el contador vive en el servidor ──────────────────────────────
// Las 20 gratis y el cobro por mano los decide `consultar_mano` (migración
// `20261030193000_cfg1e_mano_actual.sql`, INV-75): el cliente sólo pinta lo que
// contesta. La clave `ajilei.consultas` del aparato se retira con esta tanda.
// Estas cifras son ESPEJO de `consultas_gratis()` y `precio_consulta(text)`: el
// menú las usa para pintar antes de la primera respuesta, y
// `src/dev/bancoImitado.test.js` las compara con la migración.
export const CONSULTAS_GRATIS = 20
export const PRECIOS_CONSULTA = Object.freeze({ basico: 100, avanzado: 200, pro: 300, humanos: 500 })

/** El precio de una mano en una mesa de ese nivel, o `null` si el nivel no tiene precio. */
export const precioConsulta = (nivel) => PRECIOS_CONSULTA[nivel] ?? null

// Autocierre de lectura del popup del VALOR. Es la única pausa que la campaña
// admite (v1.1 §5): tiempo de leer dos líneas sin quedarse colgado en la mesa.
export const CONSULTA_POPUP_MS = 4000

// Autocierre del popup del CONTADOR (badge). Sellado en U1b y NO se toca aquí:
// se muda a este módulo para que el arnés lo lea de la misma fuente que la app.
export const BADGE_POPUP_MS = 2000
