# AJILEI · VOZ-2 · La frase del óvalo · Fase 1 · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_VOZ-2_Fase1_v1.0.md`, sub-tandas 1a y 1b.
**Punto de partida:** `main` en `422f83b` (BIE-1d). Fase 0 aceptada (`docs/reportes/AJILEI_VOZ-2_Fase0_Informe_v1.0.md`, sin commitear).
**Estado:** STOP-2. Sin commits y sin `git add`. Servidores cerrados.
**Instrumento:** Edge **154.0.4258.37** · playwright-core del repo · `vite preview` 4173 tras `npm run build`, con la sesión simulada de CAP-1 (`contextoCap`, semilla 5) y la ruta de `rutaMesa.mjs` (`basico`, apuesta 0, entrada `medio`). `voz2.burbuja`, `msg`, `rec`, `o1`, `o2`, `diagSAL` y `lob` corren contra el servidor de desarrollo 5173 con bypass; `luz` necesita además el 5174 sin bypass (ver §E).

## Resumen

- **El óvalo no se mueve.** En las 20 celdas, con las 9 formas de la Fase 0, con la capa abierta y después de cerrarla, el óvalo, el pozo, «A igualar», el comodín, el `<p>`, las cartas del jugador y su barra dan **Δ 0 px**. El óvalo sigue en la posición de la tabla C1 de la Fase 0.
- **Lo que eligió Victor está en la mesa:**
  - 2 líneas con el interlineado de hoy, igual en todas las vistas;
  - «…» más una flechita de oro detrás;
  - capa «C · globo», sobre el óvalo.
- **Tocar el óvalo abre la frase entera.** Solo con resultado y con la frase recortada. Tocar otra vez, Esc o «Siguiente mano» la cierran. La tarjeta de recarga la recoge.
- **Las dos exigencias de Victor:**
  - **(a)** con la capa abierta, «Siguiente mano» y la burbuja reciben exactamente los mismos toques que sin capa, con 0 px² de solape, en las 20 celdas. No hubo que parar;
  - **(b)** lo que tapa la capa está por celda en §C.3. No tapa nunca las cartas del jugador.
- **Modo `voz2` completo: 222/222 en verde.** Tiene tres controles, y los tres ven lo que deben ver.
- **`msg` recableado: verde.** Lee el texto del `span`, comprueba que lo visible es prefijo de la frase compuesta, y su sonda «Δ larga» escribe dentro del `span`.
- **Créditos:** los dos IDs cruzados de `AJILEI_Victory_Celebration_v1.0.md` están corregidos.
- **Varas finales:** vitest **1089/1089** (1073 + 16), eslint **21**, build limpio. `diagPUE` 194 verdes, `dis` 68/68, `diagSAL` 102/102, `lob` 6/6, y `rec`, `luz`, `o1` y `o2` en verde.
- **Una decisión para el rector:** `1.8b` sube a **222,0 KiB** (+1,6 KiB). Es más que los «cientos de bytes» que la ficha aceptaba: +1,38 KiB son el JS de la capa y el toque (§E).
- **Cada commit del mapa compila solo** (§F). Protegidos abiertos: **ninguno**. Reglas CSS nuevas que apuntan al óvalo: **ninguna**.

---

## §A · Sub-tanda 1a (resumen; detalle en el STOP-1)

| # | Cambio | Dónde |
|---|---|---|
| 1 | Con resultado, el texto del `<p>` va en `<span class="voz2-texto">` por las dos rutas. Sin resultado, el marcado de siempre | `src/components/GameTable.jsx:1963` (`contenidoFrase`), llamada en `:2030` y `:2094` |
| 2 | Recorte con `-webkit-line-clamp` gobernado por `--voz2-lineas` / `--voz2-interlinea`, con `contain: inline-size; width: 100%` | `src/styles/voz2.css:47` |
| 3 | Escritorio 4/5: el `<p>` se estira a su pista. Selector **0,5,0** y no 0,4,0: lleva `:has(> .voz2-texto)` para que la crónica quede como hoy | `voz2.css:72-77` |
| 4 | Detección del recorte por la caja (D4): `estaRecortada`, pura, con holgura de 1 px | `src/hooks/voz2Core.js:29` |
| 5 | `useVoz2Recorte`: ResizeObserver + MutationObserver en un ref de callback, sin efecto (lint en 21). Publica `data-voz2-recortada` | `src/hooks/useVoz2Recorte.js:72` |
| 6 | Puertas `voz2.c1`, `voz2.ovalo`, `voz2.recorte` y `voz2.contencion`, con los controles `contain` y `nowrap` | `scripts/diagPUE.mjs:1831` y siguientes · `scripts/voz2/voz2Mesa.mjs` |
| 7 | Lámina de la capa y hoja de contacto | `laminas/voz2/lamina.html` · `laminas/voz2/capturar.mjs` · `laminas/voz2/capturas/hoja.png` |

---

## §B · Sub-tanda 1b · La capa, el toque y la accesibilidad

### B1 · Valores elegidos en la lámina (1b-i)

Victor eligió lo mismo para todas las vistas y mesas:

| Interruptor | Elegido | Cómo queda |
|---|---|---|
| 1 · Líneas recogidas | **2 líneas**, sin interlineado ajustado | `--voz2-lineas: 2` y `--voz2-interlinea` sin valor. Es lo que ya decía el bloque 1 de `voz2.css`; no hace falta bloque por vista (`voz2.css`, §3 de la hoja) |
| 2 · Indicio | **«…» + flechita de oro** | `<svg class="voz2-indicio">` detrás de lo que se lee (§B3) |
| 3 · Forma de la capa | **C · globo con pico** | Oscura, borde de oro 1,5 px, radio 10 y la misma sombra que la lámina. Letra de 14 px en móvil y 15 en escritorio, interlineado 1,35 y centrada |
| 4 · Posición | **Sobre el óvalo** | Centrada sobre el óvalo y empujada dentro del viewport, con las mismas cuentas que dibujó la lámina (§B4) |

**Sin pico.** En la posición elegida la capa queda encima del óvalo, no a su lado, y la lámina no pinta el pico en ese caso (`lamina.html`, `colocaCapa`: `pico-no` en «Sobre el óvalo»). Se reproduce lo que Victor vio: el globo sin pico. Si lo quiere con pico aun estando encima, es una regla de `voz2.css`.

### B2 · Cambios

| # | Cambio | Dónde |
|---|---|---|
| 1 | Estado de la capa: `vozAbierta` guarda la **mano** en que se abrió (D3) | `GameTable.jsx:492` |
| 2 | `voz2Abierta` se **deriva**: resultado, recortada, abierta en esta mano y sin tarjeta de recarga. Sin `useEffect`: mano nueva = capa cerrada | `GameTable.jsx:1244` |
| 3 | D10: al abrirse la tarjeta, la capa se **recoge**. Se anota durante el render, con el mismo molde que `revelacion`, para que al plegar la tarjeta («Ver la mesa») no vuelva sola | `GameTable.jsx:1242-1243` |
| 4 | Alternancia única (D12) y teclado (D13): Enter y Espacio alternan, Esc cierra. El manejador de toque está solo en el óvalo; el texto no lleva otro | `GameTable.jsx:1248-1258` |
| 5 | Esc cierra desde cualquier sitio: escuchador de `keydown` mientras la capa está abierta. El `setState` va en el manejador | `GameTable.jsx:1261-1266` |
| 6 | Con recorte, el texto recibe `role="button"`, `tabIndex={0}`, `aria-expanded` y `aria-controls`, y nada más. Solo cambian atributos | `GameTable.jsx:1963` (`contenidoFrase`) |
| 7 | Flechita: `<svg>` hermano del texto, fuera de flujo, `aria-hidden`. Existe siempre que hay resultado y solo se ve con recorte y recogida | `GameTable.jsx:1973` |
| 8 | Toque del óvalo (D12): `onClick` en `.center-zone` y en `.felt-oval.oval-right`, solo con resultado y recorte. Ninguna regla CSS lo toca | `GameTable.jsx:1985`, `:1999`, `:2092` |
| 9 | Montaje de la capa: hermana de la mesa, junto al vuelo de la celebración (molde `.vc-capa`, D2). Se monta mientras la frase esté recortada, con `hidden` si está cerrada, porque es el destino de `aria-controls` | `GameTable.jsx:2676` |
| 10 | Componente `Voz2Capa`: `fixed`, z 20. Se coloca **midiendo** el óvalo de su texto; se recoloca con ResizeObserver (capa y óvalo), `resize` y cualquier `scroll` en captura. Tocarla la cierra | `src/components/Voz2Capa.jsx:31` |
| 11 | Pieza pura de colocación: `anchoCapa` y `colocaCapa` (ancho del óvalo entre 260 y 520, márgenes 12/6) | `src/hooks/voz2Core.js:87`, `:91` |
| 12 | Pieza pura del indicio: `finDeLoLeido(cajas, marco, elipsis)` | `voz2Core.js:56` |
| 13 | `useVoz2Recorte` coloca la flechita en la misma medida: `style` del `svg`, sin estado. Corrige la escala de `msgPop` y vuelve a medir con `document.fonts.ready` | `useVoz2Recorte.js:47` |
| 14 | `voz2.css`: el `<p>` con resultado pasa a `position: relative` (bloque contenedor de la flechita; sin desplazamientos no cambia su caja). Además, la flechita, la mano solo con `pointer: fine` (D14), el foco visible en oro y la capa | `voz2.css:101-174` |
| 15 | Pruebas: 10 casos nuevos (`finDeLoLeido` 6 y la capa 3, más el ajuste de 1). Total del archivo: 16 | `src/hooks/voz2Core.test.js` |

### B3 · La flechita detrás del «…»

El primer intento la ponía tras el borde derecho del último glifo de la última línea, y en 360×640 pisaba el tercer punto del «…» («con Oros..⌄»). Medido en 360×640 y 844×390, Chromium hace esto:

- maqueta la última línea visible como si no hubiera recorte (centrada, con sus glifos en su sitio);
- dibuja el «…» **detrás** del último glifo que, con el «…» a continuación, todavía cabe;
- deja con caja a los glifos que quedan bajo el «…» (el mismo efecto que la 1a encontró en el conteo).

Por eso `finDeLoLeido` recibe el ancho del «…», que se mide en la letra del texto con un lienzo sin tocar el DOM, y coloca la flecha tras el final del «…».

Queda una rareza de Chromium, no de VOZ-2. Cuando la segunda línea acaba justo en un salto de palabra y el «…» no cabe detrás, el navegador lo dibuja igual y lo corta en el borde. Pasa en 1920 m5 con «… otros 1500..»; ya estaba en las capturas de la 1a. La flecha queda pegada a ese borde.

### B4 · La capa: dónde cae

| Celda | Capa (peor caso), ancho × alto en (x, y) |
|---|---|
| 1920×1080 m5 / m4 / m3 | 463,56×101 · 463,56×80,75 · 520×80,75 |
| 1920×1080 m2 | 520×101 (forma «peor ×2», ver §C.1) |
| S25 m5 / m4 / m3 / m2 | 370 de ancho, 76,67–95,56 de alto, centrada en su óvalo |
| 390×844 | 348 de ancho, 76,67–114,45 de alto |
| 360×640 m5 | 318×114,45 en (21, 265,81) |
| 360×640 m4 / m3 / m2 | 318 de ancho, 76,67–95,56 de alto |
| 844×390 m5 / m4 / m3 | 486×76,67 en (186, 146,5) |
| 844×390 m2 (`two-ovals`) | 260×95,56 en (572, 121,41): el óvalo derecho mide 157 y la capa se empuja dentro del viewport |

Los 185 glifos del peor caso quedan **dentro del viewport y sin tapar** en todas las celdas, medidos con `elementFromPoint` en el centro de cada glifo.

---

## §C · Arnés: modo `voz2`, parte 2

`node scripts/diagPUE.mjs voz2` hace la parte 2 en la misma página que la parte 1, que antes deja restaurado el texto real. `voz2.burbuja` corre después contra el 5173. Opciones nuevas:

- `--control=capa`;
- `--sin-burbuja`, que salta la pasada del 5173 (`VOZ2_DEV` cambia la dirección).

### C.1 · Resultado (corrida final)

| Puerta | Celdas | Qué exige |
|---|---|---|
| `voz2.c1` | **20/20** | El óvalo en la posición de la tabla C1 (Δ 0) |
| `voz2.ovalo` | **20/20** | 9 formas: óvalo, pozo, «A igualar» y comodín con Δ 0. El `<p>` también da Δ 0 en todas |
| `voz2.recorte` | **20/20** | Hay marca ⇔ hay glifos que no se ven (`Range`), también con la frase real |
| `voz2.contencion` | **2/2** | 360×640 m5/m4, con «… Heptacoins» y con el peor caso: `<p>` Δ 0 (C-2 corregido) |
| `voz2.capa` | **20/20** | Tocar el texto la abre (fixed, z 20) con la frase entera: todos los glifos dentro del viewport y sin tapar. Tocarla la cierra. Dos alternancias y Δ 0 de 8 anclas, abierta y después. En 360×640 m5/m4, donde la frase **real** viene recortada, además con ella |
| `voz2.capa(a)` «Siguiente mano» | **20/20** | Con la capa abierta: el centro y los mismos toques de la rejilla 3×3 que sin capa (9/9 en todas), ninguno para la capa, 0 px² de solape y dentro del viewport |
| `voz2.capa(a)` burbuja | **20/20** | Igual, con la burbuja en el 5173 (6/9 con capa y 6/9 sin ella, ver C.2) |
| `voz2.indicio` | **20/20** | La flechita se ve recogida, no se ve desplegada ni sin recorte, y ningún ancestro la recorta |
| `voz2.toque` | **20/20** | Ver la lista debajo de esta tabla |
| `voz2.a11y` | **20/20** | Ver la lista debajo de esta tabla |
| `voz2.siguiente` | **20/20** | Con la capa abierta, el toque **real** a «Siguiente mano» llega al botón. La capa se va en el **1.er fotograma** («000» en los tres siguientes) y no vuelve. La mano nueva se ve: TURNO entre 5,3 y 9,1 s |
| `voz2.burbuja` | **20/20** | Ver la lista debajo de esta tabla |
| **Total** | **222/222** | |

`voz2.toque` comprueba:

- una rejilla de 5×3 puntos del óvalo más el texto; cada punto que recibe el óvalo abre con **una** alternancia y Esc lo cierra;
- tocar el óvalo con la capa abierta la cierra donde la capa deja óvalo a la vista;
- los nombres de rival no alternan;
- sin recorte y fuera del resultado, el óvalo no responde.

`voz2.a11y` comprueba:

- con recorte hay **un** botón cuyo nombre accesible es la frase **entera**;
- la secuencia `false → Enter true → Espacio false → Enter true → Esc false`;
- `aria-controls` es el id de la capa y `tabindex` es 0;
- ningún ancestro lleva `disabled`, `aria-disabled` ni `inert`;
- sin recorte no hay rol, ni `tabindex`, ni `aria-*`.

`voz2.burbuja` comprueba:

- la capa se abre **antes** de la burbuja, y sigue abierta cuando la burbuja sale (D10);
- tocar la burbuja abre la tarjeta, que queda encima (`elementFromPoint`);
- la capa se recoge (`aria-expanded="false"`);
- con «Ver la mesa», la burbuja vuelve y la capa **no** vuelve.

**La forma de prueba.** La parte 2 inyecta el peor caso en el texto y en la capa, para que haya recorte en las 20 celdas. React no reescribe un texto que no ha cambiado, así que la capa enseña lo inyectado. En **1920×1080 m2** el peor caso cabe entero (0/9 recortadas, ya en la 1a). Ahí se usa el peor caso dos veces y la salida lo declara como «peor ×2». La primera corrida no lo hacía: las puertas salieron rojas en esa celda porque no había capa que abrir, y además `capa(a)` daba un verde vacío. Las dos cosas se corrigieron.

**Nombres de rival en la frontera.** La ficha pide que el nombre gane en la frontera del óvalo en 360×640 m5. Medido: **en ninguna de las 20 celdas** hay un nombre a 16 px o menos del óvalo; el más cercano en 360×640 m5 está a 83 px. El nombre gana por construcción: no es hijo del óvalo y su toque no sube hasta él. La puerta toca **todos** los nombres visibles y exige 0 alternancias. Los que están en la frontera tienen además que recibir el toque, y no hay ninguno. Algunos nombres no reciben el toque en su centro porque los tapan las cartas reveladas de otro rival. Es así desde antes de VOZ-2, y también ahí hay 0 alternancias.

**Puntos del óvalo que reciben otros.** Las esquinas de la caja del óvalo caen fuera de su forma redondeada, y el navegador respeta el redondeo al repartir los toques. Esos puntos los reciben `table-mid`, `mid-center` o `game-table`, y no se tocan. En las vistas verticales m3/m2 son 8 de 15 (el óvalo es casi un círculo).

### C.2 · Corrección de la vara de (a)

La primera corrida dio `capa(a) burbuja` **rojo en las 20 celdas**: la burbuja recibía 6 de 9 toques. No era la capa:

- el solape con ella era 0 px²;
- los tres toques que faltaban se los llevaba la ranura de detrás (`rec-ranura`, `player-bar` o `player-zone`).

La burbuja es una píldora redondeada, y las esquinas de la rejilla caen fuera de su forma. La vara pasó a comparar contra la **misma medida sin capa**: el centro, el mismo número de toques, ninguno para la capa y 0 px² de solape. Medido así: burbuja **6/9 con capa y 6/9 sin ella** en las 20 celdas, y «Siguiente mano» 9/9 y 9/9.

### C.3 · (b) Qué tapa la capa abierta, por celda (peor caso, sin veredicto)

Porcentaje del elemento más tapado de cada grupo; entre paréntesis, cuántos elementos del grupo toca.

| Celda | Pozo | Comodín | Paneles | Cartas reveladas | Cartas del jugador |
|---|---|---|---|---|---|
| 1920×1080 m5 | 68,52 % | 77,06 % | — | — | — |
| 1920×1080 m4 | 55,62 % | 48,66 % | — | — | — |
| 1920×1080 m3 | 63,43 % | — | — | — | — |
| 1920×1080 m2 («peor ×2») | — | — | — | — | — |
| S25 m5 / m4 | 93,26 % | 84,48 % | — | — | — |
| S25 m3 / m2 | 89,75 % / 81,34 % | — | — | — | — |
| 390×844 m5 | 100 % | 100 % | — | — | — |
| 390×844 m4 | 93,26 % | 84,48 % | — | — | — |
| 390×844 m3 / m2 | 89,75 % / 81,34 % | — | — | — | — |
| 360×640 m5 | 100 % | 100 % | 6,3 % (2) | — | — |
| 360×640 m4 | 100 % | 100 % | — | — | — |
| 360×640 m3 / m2 | 89,75 % / 81,34 % | — | — | — | — |
| 844×390 m5 | 100 % | 100 % | 7,63 % (4) | 8,68 % (5) | — |
| 844×390 m4 | 100 % | 100 % | 7,63 % (3) | 8,68 % (5) | — |
| 844×390 m3 | 100 % | — | 7,63 % (2) | 8,68 % (5) | — |
| 844×390 m2 | — | — | 3,11 % | 14,88 % | — |

- **Nunca tapa las cartas del jugador, ni «Siguiente mano», ni la burbuja.**
- Con la frase **real** recortada (360×640 m5/m4), la capa es de 318×38,89 y tapa el pozo al 60,75 %.
- En 844×390 la capa del peor caso roza la franja baja de las cartas reveladas (8,68 %; 14,88 % en m2, donde se empuja a la izquierda del óvalo derecho).
- En la pasada de la burbuja, 360×640 m5 también roza las cartas reveladas (11,82 %, cinco cartas): en esa mano hay otro rival destapado.

### C.4 · Los tres controles

La hoja de control entra por la página, no por el repo (`HOJAS_CONTROL` en `voz2Mesa.mjs`). Se exige que la puerta **vea** el fallo.

| Control | Qué hace | Resultado |
|---|---|---|
| `contain` | Quita `contain: inline-size` | **2/2**: en 360×640 m5 el `<p>` se mueve 198,81, el comodín 161,78 y el pozo 3,09 (m4: comodín 161,19). Es C-2 al centésimo, como en la 1a |
| `nowrap` | El recorte ingenuo a una línea | **6/6**: el óvalo se mueve **906,36** (360 m5), 876,36 (390 m5), 854,36 (S25 m5), 780,19 / 750,19 / 728,19 (m4) |
| `capa` | Una capa de al menos 200vw × 200vh | **20/20** ven el bloqueo: «Siguiente mano» recibe 0/9 toques con la capa y 9/9 sin ella, y la frase se sale del viewport |

El primer control `capa` usaba `scale(4)`. En 1920 m5/m4/m2 no llegaba a tapar «Siguiente mano», y la puerta lo dijo (17/20): allí de verdad no lo tapaba. Se cambió por el control de 200vw × 200vh.

### C.5 · `msg` recableado (`scripts/diagDSK.mjs`)

| Punto | Antes | Ahora | Dónde |
|---|---|---|---|
| P2 · texto | `textContent` del `<p>` | El del `.voz2-texto`. Además, `visto`: cuántos glifos se ven con `Range` contra el recorte del `span` y de sus ancestros | `diagDSK.mjs:9557` (`msgLee`), `:9711` (`msgTexto`) |
| P2 · puerta nueva | — | `vistoEsPrefijo`: lo visible es un **prefijo contiguo** de la frase compuesta (con capas, de la cabeza), y «se ve menos que el total» coincide con la marca del producto. Dos fotogramas antes de leer, para que la marca se asiente | `diagDSK.mjs:9804`, `:10002` |
| P4 · «Δ larga» | Inyectaba **sobre el `<p>`** durante la apuesta, borraba el `span` y en 360×640 veía los 3,11 px de C-2 por el camino viejo | Juega la mano **hasta el pago** y escribe **dentro del `span`**. «Desborda» pasa a ser «se recorta» | `diagDSK.mjs:10403` |

**Resultado:** compositor OK (92 casos), jugado 7/7, fin 1/1, Δ larga **7/7**, caza 2/2, **VERDE**.

- En 360×640 m5 lo visto da 14/30 «recortada ✓».
- La Δ larga de 360×640 m5 es ahora **0** (era 3,11).
- El recorte hoy/mañana coincide en las 7 celdas: sí/sí en 360×640 m5 y 740×360 m2, y no/no en las demás.

**Nota para la higiene del arnés.** `msg` corre contra el **5173** (servidor de desarrollo con bypass), porque `gotoMesa` necesita el lobby sin puerta. VOZ-2 mide la mesa en el 4173 con `contextoCap`. Conviene llevar `msg` al 4173 con esa misma sesión: mediría el bundle de producción y no dependería del bypass. Su caza dirigida siembra `Math.random` en la página, y eso funciona igual en los dos servidores.

---

## §D · Créditos (D5)

`docs/AJILEI_Victory_Celebration_v1.0.md:345-346`: `ajilei-strum.mp3` → **504874** y `table-knock.mp3` → **85867**. No cambia nada más del archivo (`git diff --stat`: 2 inserciones y 2 borrados). `creditos.js` ya estaba bien y no se tocó.

---

## §E · Varas finales

| Vara | Línea base (`422f83b`) | Al cerrar la 1b | |
|---|---|---|---|
| build | limpio | limpio | ✔ |
| vitest | 1073/1073 (39 archivos) | **1089/1089** (40 archivos: +16 de `voz2Core.test.js`) | ✔ |
| eslint | 21 | **21**, el mismo conjunto (solo cambian números de línea) | ✔ |
| `diagPUE` completo (4173) | 194 verdes + `1.8b` rojo conocido, 220,4 KiB | 194 verdes + `1.8b` rojo conocido, **222,0 KiB** (ver la nota) | ⚠ |
| `dis` (dentro de `diagPUE`) | 68/68 | 68/68 | ✔ |
| `diagPUE voz2` (4173 + 5173) | — | **222/222**, más los controles `contain` 2/2, `nowrap` 6/6 y `capa` 20/20 | ✔ |
| `diagSAL sal` (5173) | 102/102 | **102/102** | ✔ |
| `diagDSK lob` (5173) | 6/6 | **6/6** | ✔ |
| `diagDSK msg` (5173), recableado | verde | **verde** (§C.5) | ✔ |
| `diagDSK rec` (5173) | verde | **verde**: p1–p7 y anillo | ✔ |
| `diagDSK luz` (5173 + 5174 sin bypass) | verde | **verde**: 20 celdas + 4 tapetes, p1–p5 y extras | ✔ |
| `diagDSK o1` (5173) | — | **16/16**: óvalo estable, la frase más larga cabe, estrés ok | ✔ |
| `diagDSK o2` (5173) | — | **15/15**: óvalo Δ 0 y vecinos Δ 0 en T4/T3/T2 × 5 vistas | ✔ |

**Deriva de Edge.** `o1` y `o2` avisan: baselines tomadas con Chromium **151.0.4129.93** y, en vivo, Edge **154.0.4258.48**. Edge se actualizó durante la sesión: la 1a y la primera corrida de la 1b midieron con la .37. Todas las medidas de VOZ-2 son relacionales (antes/después en la misma página) o nuevas, y `o1`/`o2` salieron verdes con la deriva. Queda para la higiene del arnés, como dice la ficha.

**Nota sobre `1.8b`. Decide el rector.** El camino crítico hasta el primer pintado pasa de 220,4 KiB a **222,0 KiB**: +1,6 KiB en el cable (la 1a dejó 220,7). La ficha aceptaba una subida «del orden de cientos de bytes» por `voz2.css`; esta la supera. Medido compilando `HEAD` y el árbol final con las mismas variables:

- el CSS sube +1 408 B en crudo, **+0,29 KiB** en gzip: es lo que la ficha preveía;
- el JS sube +3 869 B en crudo, **+1,38 KiB** en gzip: la capa, el toque, el teclado, la flechita y sus piezas puras.

El bundle de la app es **un solo trozo**, así que todo lo nuevo de la mesa viaja con la Portada. No se dividió el código: sería un cambio de arquitectura fuera de esta ficha. Si el rector no lo acepta, la vía es cargar la mesa aparte, con `import()` diferido de `GameTable`, en una tanda propia junto con el rojo conocido de `1.8b`.

---

## §F · Mapa archivo → commit propuesto

| Commit | Rutas (explícitas) |
|---|---|
| **(a)** `VOZ-2a: núcleo — detección del recorte, colocación de la capa y del indicio` | `src/hooks/voz2Core.js` · `src/hooks/voz2Core.test.js` |
| **(b)** `VOZ-2b: pantalla — la frase recogida, su capa y su toque` | `src/hooks/useVoz2Recorte.js` · `src/components/Voz2Capa.jsx` · `src/components/GameTable.jsx` · `src/styles/voz2.css` |
| **(c)** `VOZ-2c: arnés — modo voz2 y msg recableado` | `scripts/diagPUE.mjs` · `scripts/voz2/voz2Mesa.mjs` · `scripts/diagDSK.mjs` |
| **(d)** `VOZ-2d: créditos — los dos IDs cruzados del documento de celebración` | `docs/AJILEI_Victory_Celebration_v1.0.md` |
| **(e)** `VOZ-2e: informes de las Fases 0 y 1 y lámina` | `docs/reportes/AJILEI_VOZ-2_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_VOZ-2_Fase1_Informe_v1.0.md` · `laminas/voz2/lamina.html` · `laminas/voz2/capturar.mjs` · `laminas/voz2/capturas/medidas.json` · `laminas/voz2/capturas/hoja.png` |

Notas:

- **(a) son piezas puras y sus pruebas.** Nadie las importa todavía; compilan solas.
- **El gancho y el componente van en (b), no en (a).** No son puros: usan React y el DOM, y quien los usa es la pantalla. `useVoz2Recorte.js` ya existía en la 1a, sin commitear.
- **(c)** lleva `voz2Mesa.mjs`, que importan `diagPUE.mjs` y `laminas/voz2/capturar.mjs`, por eso va antes de (e).
- **(e):** de `laminas/voz2/` solo entran `capturar.mjs`, `lamina.html`, `capturas/medidas.json` y `capturas/hoja.png`, como pidió Victor. Las 540 capturas del óvalo, las 20 de mesa y `capturas/medidas.js` no entran (unos 18 MB). Se regeneran con `node laminas/voz2/capturar.mjs`.
- **Los seis residuos conocidos no entran en ningún commit:** `docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md`, `docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md`, `laminas/mon1/*` y `scripts/_cel1bFila.mjs`.

**Comprobado que cada commit compila solo, sin tocar el área de preparación:**

- **Montaje.** `HEAD` se sacó con `git archive` a un directorio del scratchpad, con `node_modules` enlazado por una unión.
- **Pasadas.** Las capas se aplicaron una a una: (a), luego (a)+(b), luego (a)+(b)+(c). En cada una: `vite build` limpio, vitest **1089/1089** y eslint **21**. En (c), además, `node --check` de `diagPUE.mjs` y `diagDSK.mjs`, y la importación de `voz2Mesa.mjs` (24 exportaciones). (d) y (e) son documentos, la lámina y su script; no entran en el build.
- **Árbol final.** La copia coincide byte a byte con el árbol de trabajo en los 9 archivos de código de (a)–(c).
- **El aviso de BIE-1 sigue igual.** `scripts/testBancoBandas.test.js` lee volcados que git ignora. En la copia limpia falla aunque no se toque nada (1088/1089), así que se copiaron esos volcados (§G.1 de BIE-1).

---

## §G · Hallazgos y notas

1. **Los servidores de fondo sobreviven al límite de tiempo de la tarea** (ya visto en la 1a): el `node` de vite sigue escuchando. Al cerrar se comprobó con `netstat` y se cerró por PID.
2. **`?apu=` no existe en `dist/`** (`siembraAPU.js`: la puerta del build). Por eso `voz2.burbuja` corre contra el 5173, igual que el modo `rec`. El resto de `voz2` corre contra el 4173.
3. **Los nombres de rival no tocan nunca el óvalo** en las 20 celdas (§C.1). Si un cambio futuro los acerca, la puerta ya mide la distancia y exige que el nombre reciba el toque en la frontera.
4. **El «…» cortado de Chromium** (§B3) es del navegador y no de VOZ-2. Se ve cuando la segunda línea acaba justo en un salto de palabra.
5. **El pico del globo** no asoma en la posición elegida (§B1). Es lo que mostró la lámina.
