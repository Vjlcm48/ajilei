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

// La elección del sorteo, por ronda (contrato §6).
export const ELECCION_SORTEO_MS = 10000

// provisional · se cierra con los teléfonos. El volteo y el resultado de cada ronda.
export const VOLTEO_SORTEO_MS = 4000

// provisional · se cierra con los teléfonos. La mano siguiente con revelación: el tope
// de red de la celebración (`mesaCore.js`), porque el cambio de fase la apaga, y la
// lectura. Sin revelación, desde el cierre de la mano.
export const RED_REVELACION_MS = 6000
export const LECTURA_TRAS_REVELACION_MS = 2000
export const MANO_SIGUIENTE_MS = 4000

// provisional · la animación en paralelo nace en la sub-tanda 3 y debe caber aquí. La
// reposición usa la fórmula del reparto (`reloj.js`); ésta es la de nadie descartó.
export const REPOSICION_SIN_CARTAS_MS = 600

// provisional · se cierra con los teléfonos. Quién sale antes del barajado.
export const AVISO_SALIDA_MS = 3000

// El tope de la pausa de anuncio (contrato §6, «Publicidad»).
export const PAUSA_ANUNCIO_MS = 45000

// provisional · se cierra con los teléfonos. Vencimientos propios seguidos de apuesta o
// descarte resueltos por el reloj: desde `AUSENTE_DESDE` la mesa lo ve ausente, y en
// `N_AUSENCIA` el árbitro lo abandona (contrato §6, «Ausencia»).
export const AUSENTE_DESDE = 2
export const N_AUSENCIA = 3
