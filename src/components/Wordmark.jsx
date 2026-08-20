// Mismo criterio que ChipToken (IDN-1 F2): URL, no componente, y `?no-inline`
// para que el nombre del activo —ID de contrato, Identidad A §5.4— sobreviva a
// `vite build` en vez de disolverse en un data URI.
import isotipoUrl from '../assets/ajilei-isotipo.svg?no-inline';

// ── Wordmark.jsx · [letra doble] + ILEI ─────────────────────────────────────
// Documento rector: docs/AJILEI_Identidad_A_v1.0.md §1 y §6.
// El isotipo es una "letra doble": la fusión deconstruida de la A y la J con la
// Heptacoin en el vano. En el wordmark SUSTITUYE a la secuencia "AJ", no la
// acompaña — por eso aquí sólo quedan cuatro letras.
//
// Fuente ÚNICA de las tres apariciones sustituibles del censo de la Fase 0:
// la bienvenida, la cabecera de mesa y el overlay de celebración. Las tres
// tienen tamaños distintos (72/56 · 22/18/16 · clamp 44–132) y ninguna cifra
// se cablea aquí: todo el dimensionado es en `em` y cuelga del `font-size` que
// ya tiene cada sitio. Ver el bloque IDN-1 de styles/embellecimiento.css.
//
// ── El nombre accesible NO es decorativo ────────────────────────────────────
// Al convertir "AJ" en un símbolo, el texto del elemento pasa a leerse "ILEI".
// Para un lector de pantalla eso sería perder la marca, no rediseñarla. Por
// eso el ANFITRIÓN (el <h1> o el <span> que envuelve) lleva `aria-label`
// —"AJILEI"— y el isotipo va `alt=""` + `aria-hidden`: la marca se anuncia una
// vez y entera, no dos veces a medias.
//
// ── Por qué hay un <span> vacío alrededor del <img> ─────────────────────────
// MEDIDO, y es la trampa de esta fase. Un <img> en línea es un elemento
// REEMPLAZADO: su caja de margen entra en la caja de línea entera, a
// diferencia de las letras, que sólo aportan su `line-height`. Los tres sitios
// heredan una interlínea de 26,09px con letras de hasta 72px — es decir, el
// texto YA desborda su propia caja de línea sin que a nadie le importe. Meter
// ahí un <img> de 1,05em lo haría importar de golpe: la caja de línea saltaría
// de 26px a ~76px y arrastraría todo lo de abajo.
//
// La solución es FL-1, la misma técnica con la que EMB-1 agrandó la caja de
// pintura del título sin mover su huella: el hueco se reserva EN FLUJO con
// exactamente lo que hace falta (el ancho), y lo que sobra sale DEL flujo. La
// ranura es un `display: inline` —no reemplazado, luego sólo aporta
// `line-height`, igual que una letra— que reserva el ancho con `padding-left`;
// el <img> vive absoluto dentro de ella y cuelga por debajo de la línea base
// sin pedirle permiso a la caja de línea. El porqué exacto, con las cifras del
// intento que falló antes, está en el bloque IDN-1 de embellecimiento.css.
export function Wordmark() {
  return (
    <>
      <span className="wm-slot">
        <img
          className="wm-iso"
          src={isotipoUrl}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </span>
      <span className="wm-ilei">ILEI</span>
    </>
  );
}
