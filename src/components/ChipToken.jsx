import './ChipToken.css';
// IDN-1 · el dibujo ya no vive aquí: vive en el activo maestro.
// Se importa como URL y no como componente porque el proyecto no tiene —ni
// estrena aquí— convención de SVG-como-componente: no hay un solo
// `import … .svg` en todo `src/`, y vite.config.js es `@vitejs/plugin-react`
// pelado, sin svgr.
//
// `?no-inline` y no `?url`, por dos razones MEDIDAS:
//   · `?url` devuelve un data URI (Vite inlinea por debajo de 4096 B y el
//     maestro pesa 3103). Eso mete ~4,2 KB de texto en el atributo `src` de
//     CADA moneda: con el reguero del pozo en vuelo hay hasta 14 a la vez.
//   · Con el data URI, el nombre del archivo DESAPARECE del build. Identidad A
//     §5.4 declara `heptacoin.svg` un ID de activo de contrato; un contrato que
//     no sobrevive a `vite build` no es un contrato.
// Con `?no-inline` cada moneda lleva una URL corta, el navegador pide y decodifica
// el dibujo UNA vez, y el activo sigue siendo un archivo inspeccionable.
import heptacoinUrl from '../assets/heptacoin.svg?no-inline';

// ChipToken.jsx
// Token de moneda de AJILEI — la Heptacoin oficial de HEPTACREATION.
// Rector: docs/AJILEI_Identidad_A_v1.0.md §4 (diseño HC-1 "Grabada") y §6.
// Sustituye al disco plano de docs/AJILEI_Componente_Fichas_v2.0.md §2/§3, que
// quedó SUPERSEDED el 2026-08-20 (ver la nota de cabecera de aquel documento):
// la moneda grabada lleva gradiente, relieve y canto estriado, que la v2.0
// prohibía expresamente. La excepción está sancionada en Identidad A §4 y
// alcanza SÓLO al interior del activo — fuera de la moneda sigue rigiendo el
// dorado único #e8b84b.
//
// Props:
//   size: 'full' | 'compact' | 'icon'  (default: 'compact')
//
// ── Por qué <img> y no un <svg> en línea ────────────────────────────────────
// 1. FUENTE ÚNICA DEL DIBUJO. Pegar el trazado aquí lo duplicaría respecto de
//    `src/assets/heptacoin.svg`, que es el maestro sellado. Dos copias del
//    mismo dibujo son dos dibujos, y el segundo envejece.
// 2. COLISIÓN DE ids. El maestro define `hpcFld`, `hpcH` y `hpcStar` en
//    <defs>. En pantalla puede haber ~14 monedas a la vez (hasta 7 asientos
//    más el reguero del pozo que viaja): catorce copias de los mismos ids en
//    un solo documento. Cada <img> es su PROPIO documento SVG, así que los
//    ids quedan aislados por construcción y no por disciplina.
// 3. COSTE. Una petición cacheada y UNA decodificación, contra catorce
//    subárboles DOM de ~30 nodos cada uno.
//    El §8 de Fichas v2.0 —que en esto sigue vigente— pide pensar en el
//    Android de gama media de la diáspora.
//
// ── Por qué la caja va en ATRIBUTOS y no en CSS ─────────────────────────────
// El censo de IDN-1 (Fase 0, sobre las 12 hojas vivas) encontró UNA sola regla
// en toda la app que dimensiona `.chip-token`: gameTable.css §landscape móvil
// achica la del pozo a 11×11 en las mesas 5/4/3. Manteniendo el ancho y el
// alto como atributos —igual que hacía el <svg>— esa regla la sigue pisando
// exactamente igual, y las otras doce apariciones conservan su caja al píxel
// sin tocar una línea de CSS. La sustitución es de tinta, no de caja.
//
// ── Lo que esta tanda SÍ cambia, y está aceptado ────────────────────────────
// El disco anterior se pintaba con `var(--gold-brand)` y aro `var(--green-deep)`,
// y `--green-deep` lo retiñe EMB-2 en los cuatro tapetes: la ficha cambiaba de
// tono con el fieltro. La Heptacoin trae su rampa propia fija y deja de
// hacerlo. Es regresión sancionada (Identidad A §5.2, "no recolorear"),
// aceptada explícitamente por Victor el 2026-08-20.

const SIZES = {
  full:    36,
  compact: 24,
  icon:    16,
};

export default function ChipToken({ size = 'compact' }) {
  const lado = SIZES[size];

  return (
    <img
      className={`chip-token chip-token--${size}`}
      src={heptacoinUrl}
      width={lado}
      height={lado}
      // Decorativa: el valor lo dice siempre el número que va al lado
      // (Fichas v2.0 §4, "la pila es ícono, el número es la contabilidad").
      alt=""
      aria-hidden="true"
      // Un <svg> no se arrastra; un <img> sí, y por defecto. Sin esto la
      // moneda del pozo estrenaría un gesto de arrastre que nadie pidió.
      draggable="false"
    />
  );
}
