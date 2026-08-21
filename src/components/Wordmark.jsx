// Mismo criterio que ChipToken (IDN-1 F2): URL, no componente, y `?no-inline`
// para que el nombre del activo —ID de contrato, Identidad A §5.4— sobreviva a
// `vite build` en vez de disolverse en un data URI.
import { useLayoutEffect, useRef } from 'react';
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
// ── VIS-4b · Las dos longitudes que la luz necesita y el CSS no puede saber ──
// El brillo del título recorre [letra doble] + ILEI como una sola pieza, y para
// eso hace falta el ancho del CONJUNTO y dónde empieza dentro del <h1>. Ninguna
// de las dos es expresable en CSS: el ancho depende de cuánto mide "ILEI" con la
// fuente que el navegador resuelva de verdad, y el desplazamiento depende de que
// el rótulo va centrado.
//
// NO ES SLOT + ILEI. Entre los dos hay el hueco de `--wm-track` —la traza que
// repone el letter-spacing que un inline atómico no hereda—, que vale 12px en la
// bienvenida y 8 a ≤680. Por eso se mide de borde a borde y no se suman anchos:
// sumarlos daba 212,85 donde la medida da 224,84.
//
// SE ESCRIBEN COMO CUSTOM PROPERTIES SOBRE EL ANFITRIÓN, que es cero layout: una
// variable no pinta ni empuja nada. El anfitrión es el padre, porque este
// componente devuelve un fragmento y no tiene caja propia — y es además quien
// lleva la animación, así que es exactamente el elemento desde el que las dos
// longitudes tienen que heredar hacia el fondo del texto y hacia el pseudo.
//
// LOS TRES ANFITRIONES LO RECIBEN, y está bien: sólo la bienvenida tiene brillo,
// y en los otros dos las variables quedan declaradas sin consumidor. Medir en
// los tres cuesta dos `getBoundingClientRect` por resize y evita una rama que
// tendría que saber en qué anfitrión vive — que es justo el acoplamiento que
// IDN-1 quitó de en medio.
function useMedidaDelConjunto(slotRef, ileiRef) {
  useLayoutEffect(() => {
    const slot = slotRef.current;
    const ilei = ileiRef.current;
    if (!slot || !ilei) return;
    const host = slot.parentElement;
    if (!host) return;

    const medir = () => {
      const s = slot.getBoundingClientRect();
      const i = ilei.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      const cs = getComputedStyle(host);
      // El origen del fondo es el padding-box (`background-origin` por defecto),
      // así que el borde de referencia es el de borde MÁS el ancho del borde.
      const origenX = h.left + parseFloat(cs.borderLeftWidth || 0);
      host.style.setProperty('--brillo-ancho', `${i.right - s.left}px`);
      host.style.setProperty('--brillo-slot-dx', `${s.left - origenX}px`);
    };

    // En un efecto de LAYOUT: corre antes de pintar, así que el primer fotograma
    // ya sale con la luz bien dimensionada en vez de con la banda a cero.
    medir();

    // El <h1> es un bloque y sí lo observa un ResizeObserver; `.wm-slot` y
    // `.wm-ilei` son inlines NO reemplazados y el observador los ignora por
    // especificación, así que observar al anfitrión es la única vía. Cubre lo
    // que de verdad cambia estas medidas: el ancho de la ventana, que es lo que
    // dispara el breakpoint de 680px que baja la letra de 72 a 56.
    const ro = new ResizeObserver(medir);
    ro.observe(host);

    // La fuente del sistema puede resolverse después del primer pintado, y el
    // ancho de "ILEI" cambia con ella. `document.fonts` no existe en todos los
    // terrenos, de ahí la guarda.
    let vivo = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (vivo) medir(); });
    }
    return () => { vivo = false; ro.disconnect(); };
  }, [slotRef, ileiRef]);
}

export function Wordmark() {
  const slotRef = useRef(null);
  const ileiRef = useRef(null);
  useMedidaDelConjunto(slotRef, ileiRef);
  return (
    <>
      <span className="wm-slot" ref={slotRef}>
        <img
          className="wm-iso"
          src={isotipoUrl}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </span>
      <span className="wm-ilei" ref={ileiRef}>ILEI</span>
    </>
  );
}
