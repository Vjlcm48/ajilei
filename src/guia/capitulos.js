// ── TUT-1 T4 · Los capítulos de «Aprender por tema», en datos ────────────────
// Rector: AJILEI_TUT-1_T4_v1.0.md §1.3 (el mapa de momentos) y §P; T5 (capítulos 7 a
// 10): AJILEI_TUT-1_T5_v1.0.md §1.1 y P-1 a P-4; normativo AJILEI_Tutorial_v1.5.md
// §2.2 (los rótulos) y §2.1 (la forma). Módulo PURO, sin React ni DOM: lo leen
// `Capitulo.jsx`, el índice, la fila del ⋮ y las varas.
//
// POR PASO:
//   · `momento`: `[mano, paso]` de la partida guiada sobre el que se posa el paso
//     (`guia/momento.js`). Desde el ⋮ (P-2) no se usa: el paso corre sobre la mesa
//     viva y el aro va al ancla que exista en ese instante;
//   · `pantalla` (T5, la Pista C): en lugar de un momento, la pantalla VIVA de la app
//     a la que el capítulo navega (el nombre de `screen` en `App`: `lobby`,
//     `retar-ias`, `sala-opciones`, `armar-mesa`). Navegar no escribe nada; el paso
//     señala el botón que escribe («Sentarme a la mesa», «Armar la mesa») sin tocarlo;
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
  // T5 · las anclas de la app: `data-ancla` donde la pantalla no tenía nombre propio (las
  // filas de `FilaChips`, el bloque del código), `data-accion` o su clase donde ya lo tenía
  // (la píldora es `.lob-pildora`: un atributo más en la barra pesaría en la entrada, `1.8b`).
  // Cada una, dentro de SU pantalla: las filas de Retar y de Armar mesa se llaman igual.
  retar: (f) => `.sal-cuerpo.es-retar [data-ancla="${f}"]`,
  sentarme: '.sal-cuerpo.es-retar .sal-cta',
  armar: (f) => `.sal-cuerpo.es-armar [data-ancla="${f}"]`,
  armarLa: '.sal-cuerpo.es-armar .sal-cta',
  armarMesa: 'main.sal [data-accion="armar"]',
  codigo: 'main.sal [data-ancla="codigo"]',
  pvp: 'main.lobby [data-accion="jugar-pvp"]',
  saldo: 'main.lobby .lob-pildora',
  ajustes: 'main.lobby [data-accion="ajustes"]',
  rankings: 'main.lobby [data-accion="rankings"]',
  tienda: 'main.lobby .lob-nav [data-accion="tienda"]',
  // El ⋮ de la mesa, cerrado (P-4): el de la mesa guiada congelada.
  menu: '[data-ancla="menu"]',
}

/**
 * T5 · la marca de cada pantalla de la Pista C: está montada cuando esto existe. Con la
 * pantalla montada y sin el ancla del paso, el paso cae a la tarjeta sin flecha (nunca se
 * queda esperando con la pantalla velada); la vara lo marca rojo (`tut.app`).
 */
export const PANTALLAS = Object.freeze({
  lobby: 'main.lobby',
  'retar-ias': '.sal-cuerpo.es-retar',
  'sala-opciones': 'main.sal [data-accion="armar"]',
  'armar-mesa': '.sal-cuerpo.es-armar',
})
const CINCO = [0, 1, 2, 3, 4].map(S.carta)
const DOS = [0, 1].map(S.carta)
const delPalo = (g) => indicesDelPalo(g?.players?.[0]?.cards ?? []).map(S.carta)

/** Las pistas del índice (normativo §2.2). */
export const PISTAS = Object.freeze([
  { id: 'a', clave: 'tut.temas.pista.a', capitulos: [1, 2, 3, 4] },
  { id: 'b', clave: 'tut.temas.pista.b', capitulos: [5, 6] },
  { id: 'c', clave: 'tut.temas.pista.c', capitulos: [7, 8, 9, 10] },
])

/** Los que tienen pasos: los diez desde la tanda 5. */
export const CONSTRUIDOS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

const m = (mano, paso) => [mano, paso]
// T5 · un paso sobre una pantalla viva de la app (sin momento).
const en = (pantalla, ancla, clave) => ({ pantalla, ancla, clave })

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
  // ── Pista C · la app (T5) ──
  // En Retar las filas y el botón anclado al pie, en una columna o en las dos de INV-55.
  7: {
    titulo: 'tut.cap7.titulo', icono: 'ias',
    pasos: [
      en('retar-ias', [S.retar('reto')], 'tut.cap7.p1'),
      en('retar-ias', [S.retar('apuesta')], 'tut.cap7.p2'),
      en('retar-ias', [S.retar('entrada')], 'tut.cap7.p3'),
      // Señalado, nunca tocado: el hueco no deja pasar el toque (P-2) y aquí se termina.
      en('retar-ias', [S.sentarme], 'tut.cap7.p4'),
    ],
  },
  // P-1 · sin sala de espera: mostrarla obligaría a armar una mesa de verdad.
  // STOP-T (Victor): el paso 3 de la v1.5 se parte en dos —en el acostado los tres mandos no
  // caben juntos—: cuántos y la apuesta, y después el ritmo. Seis pasos (v1.5).
  8: {
    titulo: 'tut.cap8.titulo', icono: 'personas',
    pasos: [
      en('lobby', [S.pvp], 'tut.cap8.p1'),
      en('sala-opciones', [S.armarMesa], 'tut.cap8.p2'),
      en('armar-mesa', [S.armar('jugadores'), S.armar('apuesta')], 'tut.cap8.p3'),
      en('armar-mesa', [S.armar('ritmo')], 'tut.cap8.p4'),
      en('armar-mesa', [S.armarLa], 'tut.cap8.p5'),
      en('sala-opciones', [S.codigo], 'tut.cap8.p6'),
    ],
  },
  9: {
    titulo: 'tut.cap9.titulo', icono: 'ajustes',
    pasos: [
      en('lobby', [S.saldo], 'tut.cap9.p1'),
      en('lobby', [S.ajustes], 'tut.cap9.p2'),
      en('lobby', [S.rankings], 'tut.cap9.p3'),
      en('lobby', [S.tienda], 'tut.cap9.p4'),
      // P-4 · el ⋮ de la mesa guiada congelada, señalado y cerrado: nada se abre.
      { momento: m(3, 3), ancla: [S.menu], clave: 'tut.cap9.p5' },
    ],
  },
  // P-3 · la escalera es una muestra (seis filas); los otros cuatro consejos, tarjeta sin ancla.
  10: {
    titulo: 'tut.cap10.titulo', icono: 'consejos',
    pasos: [
      { momento: m(3, 3), muestra: { tipo: 'escalera' }, clave: 'tut.cap10.p1' },
      { momento: m(3, 3), ancla: [], clave: 'tut.cap10.p2' },
      { momento: m(3, 3), ancla: [], clave: 'tut.cap10.p3' },
      { momento: m(3, 3), ancla: [], clave: 'tut.cap10.p4' },
      { momento: m(3, 3), ancla: [], clave: 'tut.cap10.p5' },
    ],
  },
})

/** T5 · los capítulos que navegan por la app: desde el ⋮ de una mesa no se abren. */
export const DE_LA_APP = Object.freeze(Object.keys(CAPITULOS).map(Number).filter((n) => CAPITULOS[n].pasos.some((p) => p.pantalla)))

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
