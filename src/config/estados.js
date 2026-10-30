// ── CFG-1 1b · Los estados de Venezuela ─────────────────────────────────────
// Rector: AJILEI_CFG-1_Fase1b_v1.0.md §0-8 y §2.1. 23 estados + Distrito
// Capital, en orden alfabético (lámina `laminas/cfg1b/datos/estados.js`).
// «La Guaira» es el nombre oficial desde 2019; «Vargas», el de antes, se busca
// como alias. Fuera: las Dependencias Federales (islas sin población estable)
// y Guayana Esequiba (decisión de Victor).
//
// LOS CÓDIGOS SON CONTRATO con la base: los mismos 24 de la migración
// `20261030013000_cfg1b_perfil.sql` (`profiles_estado_lista_chk`), de tres
// letras y no los de ISO 3166-2 (decisión D-5 del STOP-B1). Un código nuevo
// aquí sin su migración lo rechaza el CHECK (23514).
export const ESTADOS_VE = Object.freeze([
  Object.freeze({ c: 'AMA', n: 'Amazonas', a: [] }),
  Object.freeze({ c: 'ANZ', n: 'Anzoátegui', a: [] }),
  Object.freeze({ c: 'APU', n: 'Apure', a: [] }),
  Object.freeze({ c: 'ARA', n: 'Aragua', a: [] }),
  Object.freeze({ c: 'BAR', n: 'Barinas', a: [] }),
  Object.freeze({ c: 'BOL', n: 'Bolívar', a: [] }),
  Object.freeze({ c: 'CAR', n: 'Carabobo', a: [] }),
  Object.freeze({ c: 'COJ', n: 'Cojedes', a: [] }),
  Object.freeze({ c: 'DEL', n: 'Delta Amacuro', a: [] }),
  Object.freeze({ c: 'DC', n: 'Distrito Capital', a: ['Caracas'] }),
  Object.freeze({ c: 'FAL', n: 'Falcón', a: [] }),
  Object.freeze({ c: 'GUA', n: 'Guárico', a: [] }),
  Object.freeze({ c: 'LGU', n: 'La Guaira', a: ['Vargas'] }),
  Object.freeze({ c: 'LAR', n: 'Lara', a: [] }),
  Object.freeze({ c: 'MER', n: 'Mérida', a: [] }),
  Object.freeze({ c: 'MIR', n: 'Miranda', a: [] }),
  Object.freeze({ c: 'MON', n: 'Monagas', a: [] }),
  Object.freeze({ c: 'NES', n: 'Nueva Esparta', a: ['Margarita'] }),
  Object.freeze({ c: 'POR', n: 'Portuguesa', a: [] }),
  Object.freeze({ c: 'SUC', n: 'Sucre', a: [] }),
  Object.freeze({ c: 'TAC', n: 'Táchira', a: [] }),
  Object.freeze({ c: 'TRU', n: 'Trujillo', a: [] }),
  Object.freeze({ c: 'YAR', n: 'Yaracuy', a: [] }),
  Object.freeze({ c: 'ZUL', n: 'Zulia', a: [] }),
])
