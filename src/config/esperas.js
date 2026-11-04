// ── MOT-1 · Las esperas de la mesa, sin dependencias ────────────────────────
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §6. Una constante no arrastra un
// módulo (PES-1): la mesa y el árbitro leen de aquí sin cargar nada más.
//
// Salen de lo que hoy mide la mesa contra las IAS. Sólo `TURN_TIME` se mudó: las
// demás siguen también en `GameTable.jsx` y `src/arbitro/esperas.test.js` confronta
// las dos copias. El reparto y su escala los calcula `src/arbitro/reloj.js`.

// El único que hay: el factor no se duplica, y `partidaRapida.js` no importa nada.
export { FACTOR_RAPIDA } from '../lib/partidaRapida.js'

// El reloj de turno y el de descarte, en SEGUNDOS: así lo cuenta la mesa.
export const TURN_TIME = 20

// El barajado, atado a `gameTable.css`. No lo escala el ritmo.
export const BARAJADO_MS = 1950

// El reparto: un respiro, cada carta por turno y el cierre. Sólo escalan el vuelo
// y las esperas del segundo reparto, que es lo que escala hoy «Partida rápida».
export const ANTES_DEL_REPARTO_MS = 120
export const VUELO_REPARTO_MS = 595
export const TRAS_PRIMER_REPARTO_MS = 400
export const VOLTEOS_SEGUNDO_REPARTO_MS = Object.freeze([300, 600, 900])
export const FIN_SEGUNDO_REPARTO_MS = 2000

// La coreografía de revelación entera (`REVEAL_CHOREO`): cerrar 320, recoger 120,
// crecer 200 y abrir 320. No la escala el ritmo.
export const REVELACION_MS = 960

// La elección del sorteo, por ronda (contrato §6).
export const ELECCION_SORTEO_MS = 10000

// provisional · se ajusta en MES-PvP. El volteo y el resultado de cada ronda.
export const VOLTEO_SORTEO_MS = 3000

// provisional · se ajusta en MES-PvP. La pausa antes de la mano siguiente, desde el
// fin de la revelación o desde el cierre si se ganó por retirada.
export const MANO_SIGUIENTE_MS = 4000
