// ── MOT-1 · Las esperas de la mesa, sin dependencias ────────────────────────
// Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md §6. Una constante no arrastra un
// módulo (PES-1): la mesa y el árbitro leen de aquí sin cargar nada más.
//
// Salen de lo que hoy mide la mesa contra las IAS. Sólo `TURN_TIME` se mudó: las
// demás siguen también en `GameTable.jsx` y `src/arbitro/esperas.test.js` confronta
// las dos copias. El reparto y su escala los calcula `src/arbitro/reloj.js`.

// El único que hay: el factor no se duplica, y `partidaRapida.js` no importa nada.
import { FACTOR_RAPIDA } from '../lib/partidaRapida.js'

export { FACTOR_RAPIDA }

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

// Árbitro v1.3 · el volteo y el resultado de cada ronda: 5 s (Reglas de APU-1 v1.9 §8). Lo leen
// el árbitro (`arbitro/reloj.js`) y la capa del sorteo (`screens/SorteoMesa.jsx`).
export const VOLTEO_SORTEO_MS = 5000

// Árbitro v1.3 · el reparto del sorteo sobre la mesa (Reglas v1.9 §8.4): 5 cartas a cada
// participante, de una en una y SIEMPRE en Rápido (cada carta sale cuando aterriza la
// anterior), con el respiro de antes y el cierre del primer reparto. Dura según cuántos
// participan en la ronda: 3.495 · 4.983 · 6.470 · 7.958 ms con 2…5. Una sola fuente: la leen
// el árbitro (`arbitro/reloj.js`) y la capa (`lib/sorteoMesaCore.js`).
export const CARTAS_SORTEO = 5
export const PASO_SORTEO_MS = VUELO_REPARTO_MS * FACTOR_RAPIDA   // 297,5
export const esperaRepartoSorteo = (participantes) => Math.round(
  ANTES_DEL_REPARTO_MS + CARTAS_SORTEO * participantes * PASO_SORTEO_MS + TRAS_PRIMER_REPARTO_MS,
)

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

// provisional · se cierra con los teléfonos. Árbitro v1.3 · la retención de la oferta de recarga
// (Reglas de APU-1 v1.9 §8.1, «Fin de partida»; decisión P-3 de Victor): sin quien quebró quedaría
// uno solo con fichas, y la mesa le espera esto desde que vence la pausa entre manos. La misma
// cifra que la pregunta de REC-1 contra las IAS (Reglas §10).
export const OFERTA_RECARGA_MS = 15000

// provisional · se cierra con los teléfonos. Vencimientos propios seguidos de apuesta o
// descarte resueltos por el reloj: desde `AUSENTE_DESDE` la mesa lo ve ausente, y en
// `N_AUSENCIA` el árbitro lo abandona (contrato §6, «Ausencia»).
export const AUSENTE_DESDE = 2
export const N_AUSENCIA = 3
