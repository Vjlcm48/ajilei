// ── TUT-1 T4 · Los capítulos de «Aprender por tema», en datos ────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.3 (el mapa de momentos) y §P; normativo
// AJILEI_Tutorial_v1.4.md §2.2 (los rótulos) y §2.1 (la forma). Módulo PURO, sin
// React ni DOM: lo leen `Capitulo.jsx`, el índice, la fila del ⋮ y las varas.
//
// POR PASO:
//   · `momento`: `[mano, paso]` de la partida guiada sobre el que se posa el paso
//     (`guia/momento.js`). Desde el ⋮ (P-2) no se usa: el paso corre sobre la mesa
//     viva y el aro va al ancla que exista en ese instante;
//   · `ancla`: selectores (o una función de la mesa que los da), de las anclas de la
//     tanda 1 (`data-ancla`, `data-accion`) más el mazo y la pila; `[]` = ninguna;
//   · `clave`: el rótulo en `t()`; `vars(game)` sus variables;
//   · `nota(game)`: una línea pequeña bajo el rótulo (`{ clave, vars }`);
//   · `muestra`: lo que la guiada no reparte (P-4), pintado con los componentes reales
//     en el centro de la mesa (`MuestraCartas`); el aro va a la muestra. Su tamaño lo da
//     la cuenta de cartas (`tamanoMuestra`: una, grande; dos, media; más, chica);
//   · `hueco` (desde el ⋮): si el ancla no está montada, `{ ancla, clave }` en su lugar.
// Las cartas de cada muestra se fijan aquí, nunca en el componente.
import { indicesDelPalo, sumaDe } from '../lib/guiaManos'

const S = {
  carta: (i) => `[data-ancla="carta"][data-i="${i}"]`,
  rival: (s) => `[data-ancla="rival"][data-asiento="${s}"]`,
  rivales: '[data-ancla="rival"]',
  // La mano de un rival (STOP-T): sus cinco huecos de carta, no el panel —revelada, la
  // mano ganadora crece y sale del panel—. En la mesa de 2, la fila de la zona del rival.
  mano: (s) => [`[data-ancla="rival"][data-asiento="${s}"] .opp-card-slot`, `[data-ancla="rival"][data-asiento="${s}"] .cards-row .card-slot-wrapper`],
  // Las manos REVELADAS de los rivales (STOP-T): sólo los huecos de carta boca arriba. En la
  // revelación la mesa abre la mano del ganador; la del que no gana sigue boca abajo (se abre
  // tocando su nombre) y queda detrás de la ganadora: no es mano revelada y no lleva hueco.
  // Cada mano funde sus cinco cartas en un hueco (`huecosDe`); las manos no se pisan.
  reveladas: [
    '[data-ancla="rival"] .opp-card-slot:has(> .playing-card:not(.card-back))',
    '[data-ancla="rival"] .cards-row .card-slot-wrapper:has(.playing-card:not(.card-back))',
  ],
  pozo: '[data-ancla="pozo"]',
  fila: '[data-ancla="fila-acciones"]',
  mazo: '.deck-pile:not(.deck-hidden)',
  pila: '.player-bar .pbr-chips',
  pasar: '[data-accion="pasar"]',
  apostar: '[data-accion="apostar"]',
  igualar: '[data-accion="igualar"]',
  subir: '[data-accion="subir"]',
  retirarse: '[data-accion="retirarse"]',
  descartar: '[data-accion="descartar"]',
  mults: '[data-accion="mult"]',
  muestra: '[data-muestra]',
}
const CINCO = [0, 1, 2, 3, 4].map(S.carta)
const DOS = [0, 1].map(S.carta)
const delPalo = (g) => indicesDelPalo(g?.players?.[0]?.cards ?? []).map(S.carta)

/** Las pistas del índice (normativo §2.2). */
export const PISTAS = Object.freeze([
  { id: 'a', clave: 'tut.temas.pista.a', capitulos: [1, 2, 3, 4] },
  { id: 'b', clave: 'tut.temas.pista.b', capitulos: [5, 6] },
  { id: 'c', clave: 'tut.temas.pista.c', capitulos: [7, 8, 9, 10] },
])

/** Los que ya tienen pasos (1–6); 7–10, con la tanda 5. */
export const CONSTRUIDOS = Object.freeze([1, 2, 3, 4, 5, 6])

const m = (mano, paso) => [mano, paso]

export const CAPITULOS = Object.freeze({
  1: {
    titulo: 'tut.cap1.titulo', icono: 'ajilei',
    pasos: [
      { momento: m(3, 3), ancla: CINCO, clave: 'tut.cap1.p1' },
      { momento: m(3, 3), ancla: [S.mazo], clave: 'tut.cap1.p2' },
      { momento: m(3, 3), ancla: [S.rivales], clave: 'tut.cap1.p3' },
      { momento: m(3, 3), ancla: [S.pila], clave: 'tut.cap1.p4' },
    ],
  },
  2: {
    titulo: 'tut.cap2.titulo', icono: 'valor',
    pasos: [
      { momento: m(3, 3), muestra: { tipo: 'cartas', cartas: ['1-Copas'], valores: true }, clave: 'tut.cap2.p1' },
      { momento: m(3, 3), muestra: { tipo: 'cartas', cartas: ['6-Bastos', '7-Espadas'], valores: true }, clave: 'tut.cap2.p2' },
      {
        momento: m(3, 3), clave: 'tut.cap2.p3',
        muestra: { tipo: 'cartas', cartas: ['10-Oros', '11-Copas', '12-Espadas', '2-Bastos', '3-Oros', '4-Copas', '5-Espadas'], valores: true },
      },
      { momento: m(1, 2), muestra: { tipo: 'cartas', cartas: ['12-Copas', '5-Espadas'], tachadas: true }, clave: 'tut.cap2.p4' },
      {
        momento: m(1, 4), ancla: delPalo, clave: 'tut.cap2.p5',
        nota: (g) => ({ clave: 'tut.temas.suma', vars: { n: sumaDe(g?.players?.[0]?.cards ?? []).points } }),
      },
      // STOP-T: el paso 6 de la v1.4 se parte en dos, con la misma carta (grande: es una) en los dos.
      { momento: m(3, 3), muestra: { tipo: 'cartas', cartas: ['7-Oros'] }, clave: 'tut.cap2.p6' },
      { momento: m(3, 3), muestra: { tipo: 'cartas', cartas: ['7-Oros'] }, clave: 'tut.cap2.p7' },
    ],
  },
  3: {
    titulo: 'tut.cap3.titulo', icono: 'mano',
    pasos: [
      { momento: m(1, 2), ancla: DOS, clave: 'tut.cap3.p1' },
      { momento: m(1, 3), ancla: [S.fila], clave: 'tut.cap3.p2' },
      { momento: m(1, 4), ancla: CINCO, clave: 'tut.cap3.p3' },
      // `{tope}` según la mesa (5 en las de 2 a 4, 3 en la de 5): lo dice la mano en curso.
      { momento: m(1, 6), ancla: delPalo, clave: 'tut.cap3.p4', vars: (g) => ({ tope: g?.handRules?.maxDiscard ?? 5 }) },
      { momento: m(1, 7), ancla: [S.descartar], clave: 'tut.cap3.p5' },
      { momento: m(1, 9), ancla: [S.fila], clave: 'tut.cap3.p6' },
      // En una revelación el ancla es la mano revelada entera, no el panel (STOP-T, como el 4.3).
      // IA 1 llega a la revelación pero su mano sigue boca abajo: la mesa sólo abre la del ganador
      // (IA 2) y el capítulo enseña lo que la mesa hace (decisión de Victor en el STOP-T). Su mano
      // no lleva hueco; si un día la mesa la abre, `S.reveladas` la recoge sola.
      { momento: m(1, 11), ancla: [...S.reveladas, ...CINCO], clave: 'tut.cap3.p7' },
    ],
  },
  4: {
    titulo: 'tut.cap4.titulo', icono: 'gana',
    pasos: [
      { momento: m(3, 3), ancla: CINCO, clave: 'tut.cap4.p1' },
      { momento: m(3, 3), muestra: { tipo: 'cartas', cartas: ['1-Copas', '10-Copas', '11-Copas', '12-Copas', '7-Oros'], suma: 52 }, clave: 'tut.cap4.p2' },
      { momento: m(1, 11), ancla: (g) => [...S.mano(g?.winner ?? 1), ...CINCO], clave: 'tut.cap4.p3' },
      { momento: m(1, 11), muestra: { tipo: 'empate' }, clave: 'tut.cap4.p4' },
      { momento: m(1, 11), ancla: [S.pila], clave: 'tut.cap4.p5' },
    ],
  },
  5: {
    titulo: 'tut.cap5.titulo', icono: 'apuesta',
    pasos: [
      { momento: m(1, 3), ancla: [S.pasar], clave: 'tut.cap5.p1' },
      // STOP-T: el paso 2 de la v1.4 se parte en dos (un aro cada uno; juntos se montaban).
      { momento: m(2, 4), ancla: [S.apostar], clave: 'tut.cap5.p2' },
      { momento: m(2, 4), ancla: [S.mults], clave: 'tut.cap5.p3' },
      // P-3: con su disponibilidad real (la apuesta viva de IA 1 en la mano 1).
      { momento: m(1, 10), ancla: [S.igualar], clave: 'tut.cap5.p4', hueco: { ancla: [S.fila], clave: 'tut.cap5.p4.hueco' } },
      { momento: m(1, 10), ancla: [S.subir], clave: 'tut.cap5.p5', hueco: { ancla: [S.fila], clave: 'tut.cap5.p5.hueco' } },
      { momento: m(1, 10), ancla: [S.retirarse], clave: 'tut.cap5.p6' },
      { momento: m(1, 10), muestra: { tipo: 'mults', gris: [10] }, clave: 'tut.cap5.p7' },
    ],
  },
  6: {
    titulo: 'tut.cap6.titulo', icono: 'pozo',
    pasos: [
      { momento: m(1, 10), muestra: { tipo: 'allin' }, clave: 'tut.cap6.p1' },
      { momento: m(1, 10), muestra: { tipo: 'pozos' }, clave: 'tut.cap6.p2' },
      { momento: m(1, 10), muestra: { tipo: 'sobrante' }, clave: 'tut.cap6.p3' },
      { momento: m(1, 10), ancla: [S.pila], clave: 'tut.cap6.p4' },
    ],
  },
  7: { titulo: 'tut.cap7.titulo', icono: 'ias', pasos: [] },
  8: { titulo: 'tut.cap8.titulo', icono: 'personas', pasos: [] },
  9: { titulo: 'tut.cap9.titulo', icono: 'ajustes', pasos: [] },
  10: { titulo: 'tut.cap10.titulo', icono: 'consejos', pasos: [] },
})

/** Las anclas de un paso sobre una mesa (con la muestra, la muestra). */
export function anclasDe(paso, game) {
  if (paso.muestra) return [S.muestra]
  return typeof paso.ancla === 'function' ? paso.ancla(game) : (paso.ancla ?? [])
}

// ── El ⋮ de la mesa (§0 de la ficha; normativo §2.1) ─────────────────────────
// reparto → 3 · apuesta → 5 · descarte → 3, en su paso del descarte · revelación → 4;
// fuera de esas fases, el índice (`null`).
const DESCARTE_CAP3 = CAPITULOS[3].pasos.findIndex((p) => p.clave === 'tut.cap3.p5')

/**
 * El capítulo que abre la fila «Cómo se juega» del ⋮ en esta fase.
 * @param {string} fase  `game.phase`
 * @param {boolean} [barajando]  el barajado de una mano nueva (ya es reparto)
 * @returns {{ n: number, inicio: number }|null}
 */
export function capituloDeFase(fase, barajando = false) {
  if (barajando || fase === 'DEAL_2' || fase === 'DEAL_3') return { n: 3, inicio: 0 }
  if (fase === 'BET_1' || fase === 'BET_2' || fase === 'BET_3') return { n: 5, inicio: 0 }
  if (fase === 'DISCARD') return { n: 3, inicio: DESCARTE_CAP3 }
  if (fase === 'PAYOUT') return { n: 4, inicio: 0 }
  return null
}
