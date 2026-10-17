# AJILEI · IOS-1 · Cierre de la campaña · v1.0

**Campaña:** IOS-1 · Arreglos de iOS y de tamaños · **Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Fecha:** 2026-10-17 · **Base del cierre:** `8d0fe25` + la 1f.

IOS-1 nació de una sesión de pruebas de Victor con el iPhone y el iPad de su hijo (Fase 0, 2026-10-13): ocho hallazgos (F-1 a F-8) y uno heredado de ECO-1 (G-1). Se cierra con todos resueltos, descartados o con dueño.

---

## 1 · Cada sub-tanda

| Sub-tanda | Qué arregló | SHA | Hallazgos que cerró |
|---|---|---|---|
| **Fase 0** | Solo diagnóstico: causa de cada hallazgo, la lista de tamaños con barras, los barridos de alto y las cifras de la mesa para TAB-1 | `65ad9eb` (el informe) | F-1 (no era fallo); F-5 (era efecto de F-3); F-6 pasa a TAB-1 |
| **1a** | La pantalla completa en Safari del iPad, solo en la mesa y en horizontal | `6dfae44` | F-3 y, con él, F-5 |
| **1b** | Retar, Salas y Armar mesa desplazan en horizontal bajo (parche temporal); el traje del lobby de 661 a 749; el «…» de la barra; el modo `tam` | `0f73af5`, `6b1d371`, `65ad9eb` | F-8 y G-1; F-4 a medias (alcanzable con la rueda) |
| **1c** | Tope de red de 8 s, la cifra recordada, la píldora y Retar sin «—» largo, el Bautizo y la tarjeta «No pudimos cargar tu cuenta» | `eab88b3`, `7650ba5`, `d7b5abb`, `eb37d84` | F-7; F-2 queda en vigilancia |
| **1d** | La lámina del botón fijo: cuatro variantes medidas en 404 casos; Victor elige | — (lámina fuera de commits) | — |
| **1e** | El botón anclado al pie en las tres pantallas, la caja de nota o resumen, la casa en la cabecera, dos columnas en horizontal ancho y bajo; `tam` recableado | `91e454f`, `a8b0183`, `7aa0559`, `8d0fe25` | F-4 del todo; el «Pronto» que tapaba el botón |
| **1f** | La línea de los 860, el diagnóstico del iPhone acostado, `tam` completo, el modo `webkit`, «Reintentar» que recarga, `.bautizo-regla` borrada, el diagnóstico del logotipo sin red | los cuatro commits «IOS-1f» que siguen a `8d0fe25` | La franja de 831 a 860 de la 1e |

---

## 2 · Decisiones selladas

- **1a** · Pantalla completa en el iPad (Safari): solo en la mesa y en horizontal.
- **1b** · El techo del parche de desplazamiento es 830 de alto.
- **1c** · Tope de red de 8 s en un solo sitio (`src/lib/red.js`).
- **1c** · La cifra recordada enciende el botón de Retar, pero no juzga.
- **1c** · La caché de 60 s del SDK se acepta tal cual.
- **1c** · La regla del Bautizo sale solo cuando el nombre no vale (f2).
- **1c** · La tarjeta «No pudimos cargar tu cuenta» sustituye a la Portada y al Bautizo cuando falla la red (g).
- **1e** · Dos columnas solo en horizontal de 900 o más de ancho y 830 o menos de alto; fuera, una columna.
- **1e** · El botón de Retar dice siempre «Sentarme a la mesa».
- **1e** · Una sola caja con prioridad (error > cobrando > cargando > «Elige…» > no alcanza > resumen).
- **1e** · El bloque del video va dentro de la zona anclada.
- **1e** · La casa va en la cabecera; el «Pronto», encima de la zona.
- **1e** · El teléfono acostado lleva dos columnas; el vertical, el botón anclado.
- **1e** · Fuera el parche de la 1b en las tres pantallas.
- **1e** · Se reabren las dos columnas, con la condición de arriba.
- **1f** · El iPhone acostado: solo diagnóstico, no se arregla (las pantallas previas a la mesa se usan en vertical).
- **1f** · El traje apretado de una columna llega a 860.
- **1f** · WebKit entra en el arnés como modo con nombre.
- **1f** · La casa, la flecha y el ⚙ se agrandan juntos en una pasada propia, fuera de IOS-1.
- **1f** · El logotipo sin red: se arregla solo si basta con guardar las imágenes (no bastaba: §3).

---

## 3 · Limitaciones conocidas

**El iPhone acostado sale en una columna** (validación física de la 1e).
- **Causa, confirmada en el código:** `index.html:9` no lleva `viewport-fit=cover`. Sin eso, Safari en horizontal no deja a la página las franjas de la isla de la cámara: la ventana de la página mide 956 menos unos 62 px por lado, **≈ 832 de ancho**. La regla de las dos columnas es un `@media` sobre esa ventana (`min-width: 900px`), así que no se cumple.
- **No es un relleno:** el `env(safe-area-inset-*)` de `.sal` vale 0 sin `cover` y, en todo caso, va por dentro de la ventana. No hay ningún `@container` ni relleno lateral en `#root` o `body`.
- Encaja con la segunda captura de Victor: con la barra de Safari escondida (≈ 440 de alto, dentro del techo de 830) también sale una columna. Lo que falla es el ancho, no el alto.
- **No medido en el aparato:** Playwright no simula esas franjas. Para confirmarlo, basta abrir en ese iPhone, acostado y en Safari, cualquier página que diga el ancho de la ventana: debería decir unos 832.
- **El arreglo sería de una línea** (no se aplica, decisión 1 de Victor): bajar el ancho de la regla a 820, o añadir `viewport-fit=cover`. Este último es más amplio: la página ocuparía las franjas y habría que revisar los rellenos de área segura de todas las pantallas.

**Las medidas reales del iPhone 17 Pro Max en Safari**, para campañas futuras:
- **956×440:** la ventana completa en horizontal. La página ve ≈ 832 de ancho sin `viewport-fit=cover`.
- **≈ 330 de alto útil** con la barra de direcciones y la fila de pestañas (de las capturas de Victor, ± 10).
- **440×956** en vertical.

**El parche de la 1b, acotado y no borrado.** La sala de espera y la partida comparten la carcasa `.sal`. Para ellas siguen el parche (desplazar la pantalla de 521 a 830 de alto) y el traje del acostado (`.sal:not(.es-anclada)`).

**F-2 (el Bautizo colgado la primera vez), en vigilancia.** No se ha repetido. La 1c le puso tope de red y el reintento solo.

**El logotipo del lobby sin red** (diagnóstico de la 1f, sin arreglo).
- **Por qué no aparece:** la app **no tiene service worker**, así que no guarda nada para el uso sin conexión. El isotipo (`ajilei-isotipo-*.svg`, 4 KB) y la moneda de la barra son archivos sueltos de `/assets/` que el `<img>` pide la primera vez que se monta. Sin red, solo los salva la caché HTTP del navegador (un año, `immutable`), que el sistema puede no tener o haber vaciado.
- **Por qué no se arregló:** guardar las imágenes exige crear un service worker (un archivo nuevo, su registro al arrancar y una política de versiones), que es más que «incluirlas en lo que la app guarda».
- **Propuesta, para una tanda propia:** un service worker mínimo que guarde al instalar el esqueleto de la app (el HTML, el JS y el CSS principales, ≈ 930 KB) y las imágenes del lobby y de la barra (≈ 26 KB). La pila animada de la moneda (1 MB) se dejaría fuera.
- **Alternativa de una línea, sin red de seguridad completa:** incrustar el isotipo en el JS (`?inline`, 4 KB). Eso toca el lobby y deshace una decisión de IDN-1.

---

## 4 · Pendientes con dueño

| Pendiente | Dueño |
|---|---|
| **TAB-1**, tres casos: el iPad mini en vertical (F-6, la mesa de 5 estirada); las tabletas verticales de 768 o más (ninguna disposición de la mesa casa: corte exacto 767/768); y la banda horizontal de 601 a 676 de alto, donde hay que desplazar para «Iniciar mano» | TAB-1 |
| La pasada de los tocables de menos de 44 que vienen de PAN-1: la casa, la flecha y el ⚙ (31–38), el «+» de la píldora (18–31), el avatar (38–42), los chips en vertical (40–42), el campo de código (21–34), «Unirme» en vertical (35) y el ± del contador (40–42) | Pasada propia (decisión 5 de la 1f) |
| Que `SalaOpciones` use `PantallaChips` (hoy repite su marcado a mano) | Propuesta, sin tanda |
| Las pruebas «deseables» de la 1c que no se hicieron: la misma cuenta en el iPhone y el iPad a la vez, y los 10 minutos en segundo plano en el iPhone | Victor, cuando tenga los aparatos |
| El service worker, y con él el logotipo sin red (§3) | Campaña propia, casi al final del cronograma, justo antes de los testers (decisión de Victor, 2026-10-17) |
| `viewport-fit=cover` (R-1 de la sesión iOS 1) y el iPhone acostado | Sin tanda: decisión 1 de la 1f |

---

## 5 · Lecciones para la doctrina

1. **Medir con las barras reales del navegador.** El arnés medía 768 «limpio» y todos los fallos de alto vivían entre 521 y 760: una laptop 1366×768 en ventana deja 623 útiles; el iPad en Safari, 641; el iPhone acostado, unos 330. Hay que sacar el alto de la ventana por dentro del aparato real, y barrer el alto de 10 en 10 para que la conclusión no dependa de la estimación.
2. **WebKit no simula el área segura.** El WebKit de Playwright da al iPhone acostado sus 956 de ancho; Safari le da a la página unos 832. Toda medida del iPhone acostado en el arnés es una cota, no el aparato. El modo `webkit` lo dice en su salida y marca esas celdas.
3. **Un botón que no se alcanza no se arregla apretando la columna sin fin.** Anclarlo y dejar que desplacen las filas convierte «no cabe» en «hay que desplazar las filas», que siempre tiene salida.
4. **Una lámina sobre la app real ahorra sorpresas.** La 1d midió 404 casos antes de escribir una línea. El código de la 1e dio las mismas cifras salvo en un caso que se explica (una fila vacía de la rejilla de la lámina).

---

## 6 · La 1f en cifras

**Qué hizo la 1f:**

| Tarea | Qué | Archivos |
|---|---|---|
| T1 | El traje apretado de una columna llega a 860 de alto. La banda de dos columnas no cambia (de 801 a 830 sigue sin traje): la línea es una lista de tres condiciones | `src/styles/salas.css` (§16) |
| T2 | Diagnóstico del iPhone acostado (§3); sin código | — |
| T3 | `tam` completo: 39 tamaños (la lámina, la Fase 0, las fronteras, la línea de los 860 y la casa a 800) en siete estados. El barrido gana una ventana estrecha (820) que es la que deja filas bajo el botón, y los tocables del cuerpo se miden recortados a su caja | `scripts/ios/tam.mjs` |
| T4 | El modo `diagDSK webkit` | `scripts/ios/webkit.mjs` (nuevo), `scripts/diagDSK.mjs`, `scripts/arnes/nucleo.mjs` |
| T5 | `.bautizo-regla` borrada (sin uso desde la 1c) | `src/styles/bautizo.css` |
| T6 | «Reintentar» de «No pudimos cargar tu cuenta» recarga la página | `src/hooks/useAuth.js` |
| T7 | Diagnóstico del logotipo sin red (§3); sin código | — |
| T8 | Este informe y el registro de invariantes (INV-55, INV-56, §3 y §6) | `docs/` |

**La línea de los 860** (`tam`, Chromium 151):
- de 831 a 860 de alto en horizontal ancho, las tres pantallas en los siete estados caben (0 px; antes de la 1f, a 1366×831: 7 px en Retar y 24 con el video);
- 1366×861 ya no lleva traje y también cabe;
- de las 154 celdas que la 1e ya medía, 147 salen idénticas al píxel (botón, filas, columnas y tocable menor), y las 7 que cambian son las de 1366×831, la franja que se quería arreglar.

**Los tamaños nuevos de la Fase 0:** todos caben, salvo el iPhone acostado estimado (832×440 y 832×390), que va en una columna y deja 25–152 px de filas bajo el botón según la pantalla (Retar 127–152, Salas 62–76, Armar mesa 25–38), siempre con el botón entero (se informa, como todo teléfono acostado).

**El modo `webkit`** (WebKit 26.5): verde en las 20 celdas que cuentan (iPad mini 6 en vertical y horizontal, iPad 11" horizontal, iPhone 17 Pro Max vertical: botón entero, 0 px de filas, ningún tocable movido bajo 44, el lobby sin solapes). Las 10 del iPhone acostado salen como LIMITACIÓN: WebKit le da 956 de ancho y dos columnas, que no es lo que pasa en el aparato.

---

## 7 · Validación física (2026-10-17)

Victor probó la 1f por el túnel. Él y el rector la aprueban.

**Bien en:**
- **La laptop HP:** Retar en dos columnas, sin desplazar.
- **El iPad, en Safari:** en horizontal y en vertical.

**«Reintentar», probado en la laptop** bloqueando `*://*.supabase.co/*` en las herramientas de desarrollo:
- con el bloqueo, entró al lobby al instante y sin problemas;
- al intentar sentarse con el bloqueo puesto, salió el mensaje correcto de falta de conexión;
- al quitar el bloqueo, todo siguió funcionando y pudo sentarse de inmediato.

**Las pruebas con modo avión no sirven todavía:** mientras no haya service worker, sin red la página no carga, así que no se puede llegar a la tarjeta «No pudimos cargar tu cuenta» por esa vía.

**El service worker** será una campaña propia, casi al final del cronograma, justo antes de los testers. De ella sale también el logotipo del lobby sin red (§3).
