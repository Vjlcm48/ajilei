# AJILEI · TAB-3 · La frase en la tableta · Fase 1 · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Fecha:** 2026-10-24
**Ficha:** `AJILEI_TAB-3_Fase1_v1.0.md` · **Parte de:** `main` en `260ab9f`, con la Fase 0 aceptada (`AJILEI_TAB-3_Fase0_Informe_v1.0.md`).
**Estado:** STOP-A. Sin commits, sin `git add`, sin `git stash`, sin uniones `node_modules`, ningún protegido abierto.

---

## 1. Resumen

- **La frase del pago ya se lee en la tableta.** En las mesas 4 y 5 en vertical (`tv`), el óvalo ocupa su pista y la frase va en su propia fila, debajo del pozo y el comodín (S5). En los 16 tamaños `tv` de la matriz se leen enteras la frase real, C1 y el titular largo. El óvalo y el pozo tienen un solo ancho y un solo sitio durante toda la mano: se acabó el vaivén (O1).
- **El iPhone grande en Safari vertical (440×763), también.** La banda P lleva la misma regla al teléfono vertical en las dos franjas donde su pista cubre el contenido del óvalo. De los 85 tamaños de la Fase 0 solo alcanza a 440×763; 440×956 queda fuera.
- **La laptop (D3h).** «Pozo» y la nota del comodín se ven a 10 px en vez de 8,7 y 9,6. No se mueve nada.
  - V-borde cazó un fallo del prototipo de la Fase 0: agrandaba también la etiqueta oculta «A igualar» y empujaba 6,6 px la frase de las mesas 2 y 3.
  - La regla queda en el rótulo del pozo, que es lo que dice D4. Hallazgo H-1, en el §8.3.
- **La matriz de 340 celdas con el producto:** se pasa de 56 celdas que fallaban D2 a 22. Las 22 son la mesa de 2 en «dos óvalos», y solo fallan contra el 360×640; contra el acostado 915×412 (D3) pasan todas.
- **Producto frente a prototipo:** 280 celdas iguales al prototipo de la lámina. Las 60 celdas `h` con f < 1 son iguales a hoy, salvo la letra de «Pozo» y del comodín.
- **Arnés:** dos varas nuevas en `diagDSK tab`, V-frase y V-óvalo-fases, con el argumento `frase` para correrlas solas y el control rojo `TAB_CONTROL=sin-frase`.
  - Las dos salen verdes con el producto y rojas con el control.
  - V-h vigila además «Pozo» y el comodín.
- **Registro:** INV-64 es nueva e INV-57 lleva la excepción de la banda P. La fila de `diagDSK tab` de la §6 está al día.
- **Corridas:**

| Corrida | Resultado |
|---|---|
| vitest | 73 / 1.783 |
| lint | 21 (línea base) |
| build | verde |
| `tab frase` | VERDE (566 s) |
| las otras nueve varas de `tab` | VERDE, después de corregir D3h (H-1) |
| control `sin-frase` | ROJO, como debe |
| `voz2` | 222 medidas, 0 en rojo |
| `webkit` | VERDE |

## 2. La elección de Victor (STOP-L)

Victor vio la lámina (`laminas/tab3/`) y eligió:

| | Elección |
|---|---|
| Tableta | **S5** |
| P | **sí**, con la `@media` propuesta para 440×763 |
| La segunda franja de P | **sí**: vertical, de 444 a 599 de ancho y más de 772 de alto. Con la condición de demostrar sobre los 85 tamaños que no alcanza a ninguno de hoy y que 440×956 queda fuera, y de añadir a V-frase una celda sintética que salga verde con la regla y roja con el control |
| D3h | **sí**, en `h` con factor < 1 |
| Varas | Comparan por geometría, no por píxeles |
| V-cel | Re-sella solo la banda de P |
| INV-64 | Recoge P como banda arreglada |
| «Tú abre» de la crónica | Fuera de TAB-3, sin tocar |

## 3. Línea base y huellas

- **Al empezar:**
  - vitest 73 / 1.781 · lint 21 · build verde.
  - `tab` VERDE 9/9 (Fase 0 y ficha).
- **Huellas de los protegidos** (lista canónica v1.8): idénticas al empezar, al terminar el Tramo L y al terminar el Tramo A.
  - `gameTable.css` sigue en `9b6b716f…`, con 6.289 líneas.
  - Las seis filas están en el §9.

## 4. Lo hecho, por archivo

### 4.1 `src/styles/escala.css` (producto)

- **Cabecera:** la hoja ya no dice que el celular no evalúa ni una regla. Ahora nombra la única excepción, que es la §8.
- **§2, la gemela S5:** dos reglas bajo `html[data-escala="tv"] .game-table-screen .table-wide`.
  - El óvalo pasa a `justify-self: stretch`.
  - La frase pasa a `flex-basis: 100%; order: 1`.
  - El comentario cita TAB-3 y la causa: la rejilla con `justify-items: center` (gameTable.css:1348) y la frase con `contain`, que no aporta ancho (Fase 0, §B.3).
  - `.table-wide` solo existe con 4 o 5 vivos (GameTable.jsx:2285). Con 3 vivos la mesa es `table-three` y la regla no la alcanza, que es lo que la lámina enseñó con la mesa reducida.
- **§5, D3h:** dos reglas bajo `html[data-escala="h"] .game-table-screen`, con el patrón de las insignias.
  - `.pot-box .pot-label`, solo el rótulo del pozo (H-1): `max(10px, 10px / f)`.
  - `.comodin-note`: `max(11px, 10px / f)`.
  - En `h` miden hoy 10 y 11 px propios (gameTable.css:134 y :897; las demás reglas de esos tamaños son del traje B o del vertical), así que con f ≥ 1 no cambian.
- **§8 nueva, la banda P:**

  ```css
  @media (orientation: portrait) and (min-width: 410px) and (max-width: 599px) and (max-height: 772px),
         (orientation: portrait) and (min-width: 444px) and (max-width: 599px) and (min-height: 772.01px) {
    html:not([data-escala]) .game-table-screen .table-wide .center-zone { justify-self: stretch; }
    html:not([data-escala]) .game-table-screen .table-wide .center-zone .game-message { flex-basis: 100%; order: 1; }
  }
  ```

  - **Por qué esos umbrales:** la pista del teléfono mide el ancho − 42. El contenido del óvalo mide 367,6 con alto ≤ 772 (gameTable.css:2158 y :2174 encogen el hueco y el comodín) y 401,75 por encima. 410 − 42 = 368 y 444 − 42 = 402 son los primeros anchos enteros que lo cubren.
  - **Por qué 599:** a partir de 600 la vertical es `tv` (§2).
  - **Por qué `772.01px`:** es el complemento de `max-height: 772px` sin la sintaxis de rango, que el minificador ya rompió una vez en TAB-2.
- **Sin `!important`.** Cada regla gana por especificidad: 0,4,1 y 0,5,1, frente a 0,3,0 y 0,4,0.

### 4.2 `src/styles/escala.test.js`

- La prueba de «cada selector lleva `[data-escala]`» ya no se deja engañar por `:not([data-escala])`.
- Una prueba nueva exige que las dos reglas de P sean lo único sin atributo de toda la hoja y que vivan dentro de su `@media` exacta.
- 3 pruebas en verde. Antes eran 2.

### 4.3 `scripts/tab/tab.mjs` (arnés)

- **V-frase.** Se mide en el pago con `V.abrirCeldaEnPago` y `V.MEDIR_VOZ2`, sin cambiarlas.
  - **Qué se mide:** la frase real, C1 y el titular largo. Juzga:
    - la caja de la frase > 0;
    - (a) que se lea el sujeto entero;
    - (b) que se lean al menos tantas letras como en la referencia de la misma corrida.
  - **Qué referencia:** la decide la ruta, medida en la página.
    - En «dos óvalos», el 915×412 m2 (D3).
    - En los demás casos, el 360×640 de la misma mesa.
    - Si la frase real de la celda no coincide con la de su referencia, se mide además la de la referencia en la celda (`ref:360x640`, `ref:915x412`) y (b) se juzga con esa.
  - **Celdas** (`FRASE`):
    - **5 referencias:** 360×640 × m2–m5 y 915×412 m2.
    - **50 normativas:**
      - `TV.tamanos` × m2–m5 (16);
      - `HB.tamanos` × m2–m5 (16);
      - `HZ` sin la pantalla completa × m2, m4 y m5 (15);
      - 440×763 × m2, m4 y m5 (3).
    - **7 informativas**, que se dicen pero no tiñen:
      - 440×956 × m2, m4 y m5;
      - 915×412 m4 y m5;
      - la sintética 450×980 m4 y m5, de la segunda franja de P.
- **V-óvalo-fases** (`FASES_OVALO`). Una mano entera jugada, del reposo al pago, con una muestra cada 150 ms, en los 4 tamaños `tv` y en 440×763, mesas 4 y 5.
  - **Exige:** un solo ancho de óvalo y un solo sitio del pozo, con 0,1 px de holgura, y una mano de verdad: ≥ 10 muestras y ≥ 3 frases.
- **`frase` en `VARAS_TAB`:** con `diagDSK tab frase` las dos corren solas. `tab` sin argumentos corre las once.
- **`TAB_CONTROL=sin-frase`** apaga S5 y P con una hoja inyectada:
  - especificidad 0,4,2 y 0,5,2;
  - devuelve `justify-self: auto`, `flex-basis: 0%` y `order: 0`.
- **V-h:** las etiquetas de 10 px incluyen ahora `.pot-label` y `.comodin-note`. Su O1, que compara la maqueta con las letras de hoy, fuerza también «Pozo» a 10 y el comodín a 11.
- **V-cel:** sin cambios en el código. Lo que dice su corrida está en el §8.2.

### 4.4 `docs/AJILEI_Invariantes_v1.0.md`

- **INV-64**, nueva y vigilada:
  - la frase del pago se lee en toda mesa con tamaño;
  - la mesa de 2 en «dos óvalos» se compara con 915×412;
  - el óvalo de 4 y 5 en `tv` va a su pista, con la frase en su fila, y su ancho no cambia en la mano;
  - la banda P es **banda arreglada**;
  - D3h.
- **INV-57:** la excepción declarada de la banda P.
- **§6**, la fila de `diagDSK tab`: V-frase, V-óvalo-fases, el argumento frase y el control `sin-frase`. La duración pasa de unos 25 min a unos 28 min con las once varas, corridas en dos partes.
- **Recuento y fecha:** 64 filas y 57 vigiladas.

## 5. La matriz de 340 celdas, con el producto

La sonda de la Fase 0 es `tab3.mjs` en el scratchpad. Esta vez no inyecta nada y corre contra el `dist` compilado con el producto: 85 tamaños × mesas 2–5, en el pago y con la escala real. Las 340 celdas quedaron medidas en una sola corrida de 29 min, con paralelismo 8.

### 5.1 Producto frente a prototipo

Cada celda se compara con la variante que le toca:

| Variante esperada | Celdas | Con qué se compara |
|---|---|---|
| S5 (`tv` m4/m5) | 32 | S5 de la Fase 0 |
| P (440×763 m4/m5) | 2 | la P de la lámina |
| hoy (el resto, sin `h` con f < 1) | 246 | hoy de la Fase 0 |
| D3h (`h` con f < 1) | 60 | hoy de la Fase 0, salvo la letra de «Pozo» y del comodín |

- **Primera corrida, 340 celdas.**
  - **Criterio:** la misma caja de la frase, las mismas letras leídas en las tres frases, las anclas de la mesa a ≤ 0,01 px, el mismo tamaño de letra de «Pozo» y del comodín, y la misma frase real.
  - **Las 280 de S5, P y hoy, iguales al prototipo.** Ninguna distinta y ninguna caja de frase a 0.
  - En esa corrida, D3h llevaba todavía el selector del prototipo (`.pot-label`), y así lo daba: igual al D3h de la Fase 0 en las 48 celdas con par.
- **Segunda corrida, las 60 celdas `h` con f < 1, con el D3h final.**
  - Son 15 tamaños × mesas 2–5: 1366×623, 1366×633, 1400×724, 1280×714, 1280×648, 1180×713, 1133×720, 1133×716, 1133×658, 1133×641, 1133×637, 1024×682, 823×707, 800×611 y 800×601.
  - **60 de 60 iguales a hoy:** la misma caja de la frase, las mismas letras leídas, anclas Δ ≤ 0,01 y «A igualar» con su letra de hoy.
  - Solo cambian «Pozo», a 10,00 px visibles, y el comodín, de 10,00 a 10,74 px visibles.
- **El celular fuera de la banda:** todas las celdas sin atributo salvo 440×763 m4/m5 son iguales a «hoy» de la Fase 0, con anclas Δ 0.

### 5.2 Antes y después (D2)

| | Fallan D2 | Cuáles |
|---|---|---|
| Fase 0 (hoy) | 56 | 32 de `tv` m4/m5, 2 de 440×763 m4/m5 y 22 de la mesa de 2 en «dos óvalos», que solo fallan (b) |
| Producto, (b) contra el 360 | 22 | solo las de «dos óvalos»: 41/67 frente a 67/67 |
| Producto, (b) como manda D3 | **0** | las de «dos óvalos» leen 41/67, igual que 915×412 |

La tabla entera está en `tabla_producto.md`, en el scratchpad (§11).

## 6. La banda P

- **Alcance sobre los 85 tamaños de la Fase 0.** Se evaluó la `@media` leída del propio `escala.css` con `matchMedia`, en un contexto con dedo y en otro con ratón. Son 84 tamaños distintos más 744×1100 con ratón.
  - **Alcanza solo a 440×763.**
  - Ningún otro tamaño de los que hoy pasan D2.
  - **440×956 queda fuera**: hoy se lee, por 3,75 px de margen.
- **Los bordes de cada franja**, con dedo y con ratón:

| Tamaño | ¿Dentro de P? | Por qué |
|---|---|---|
| 409×772 | no | por debajo de la primera franja |
| 410×772 | sí | primer ancho de la primera franja |
| 410×773 | no | a ese alto se necesita la segunda franja, y empieza en 444 |
| 443×773 | no | por debajo de la segunda franja |
| 444×773 | sí | primer ancho de la segunda franja |
| 444×772 | sí | primera franja |
| 599×1000 | sí | último ancho de la banda |
| 599×700 | sí | último ancho de la banda |
| 600×1000 | no | ya es `tv` |
| 440×956 | no | por debajo de la segunda franja |
| 450×980 | sí | la celda sintética |

- **La celda sintética 450×980** (m4 y m5, informativa):
  - con la regla, caja de 362 px y las tres frases enteras;
  - con `TAB_CONTROL=sin-frase`, caja 0 y 0 letras (§8).
- **Con 3 vivos** (la mesa reducida, `table-three`), la regla no alcanza a nada. Lámina, §4.

## 7. Las medidas de D9

Vienen de la lámina (Tramo L) y quedaron en el resumen del STOP-L. El producto las repite: §5.1 y V-óvalo-fases.

- **(a) La crónica más larga.**
  - **Cuál es:** en las mesas 4 y 5 es «Selecciona hasta 3 cartas a descartar.». «La IA sube a 1000. ¿Qué haces?» solo existe en la mesa de 2; en la lámina se inyectó a la fuerza.
  - **Hoy y con S4,** el óvalo cambia de ancho con cada crónica; en 768×938 va de 511 a 624 px propios.
  - **Con S5,** un solo ancho.
  - **En una mano entera,** V-óvalo-fases da con el producto 1 ancho y 1 sitio del pozo en las 10 manos (§8). Con el control, entre 3 y 15.
- **(b) La mesa reducida** (arranca con 5 y quedan 3, «Sin comodín»). La mesa pasa a `table-three`, el óvalo ya va a toda su pista y la frase se lee entera hoy, con cualquier variante. Δ 0.
- **(c) WebKit** (Playwright 26.5, con los tamaños medidos de Apple: 744×1100, 744×1047 y 440×763). Las mismas cifras que Chromium, al decimal:

| Variante | Frase real | C1 | Titular largo |
|---|---|---|---|
| hoy | 0 letras | 0 | 0 |
| S5 y P | entera | 66/66 | 59/59 |

## 8. Las corridas

### 8.1 Resumen

| Corrida | Resultado |
|---|---|
| vitest | **73 archivos / 1.783 pruebas**, verde. Son dos más que la línea base: la prueba nueva de la banda P en `src/styles/escala.test.js` y la fila de INV-64 en `scripts/testInvariantes.test.js`. La primera tirada dio el falso «73 failed, no tests» (1,8 s, `Cannot read properties of undefined (reading 'config')`, con la compilación de `diagDSK` en marcha); repetida una vez, verde (§1.7 de la ficha) |
| lint | **21** (20 errores + 1 aviso), la línea base. Nada nuevo |
| build | **verde** (`npm run build`, con el producto final) |
| `diagDSK tab frase` | **VERDE**, 566 s · V-frase 50/50 normativas, 5/5 referencias, 7/7 informativas · V-óvalo-fases 10/10, todas con 1 ancho y el pozo en 1 sitio |
| `TAB_CONTROL=sin-frase diagDSK tab frase` | **ROJO**, que es lo que debe salir · V-frase 40/50: caen las 10 que la regla arregla (`tv` m4/m5 × 4 y 440×763 m4/m5), con caja 0 y 0 letras; la sintética 450×980, también · V-óvalo-fases 0/10, con 3 a 15 anchos y otros tantos sitios del pozo |
| `diagDSK tab` (cel tv h vuelo fuera giro borde hb frontera), primera vez | **ROJO** en V-borde (38/40: 1366×623 m2, verde y tricolor, deriva 6,66 px > 0,75): el hallazgo H-1 (§8.3). Las otras ocho, verdes: V-cel 25/25 pares (14 idénticos al píxel) y t3 88/88 al byte; V-tv 48/48; V-h 24/24; V-vuelo 4 + 2 globos; V-fuera 12/12 y 3/3; V-giro 2/2; V-hb 48/48; V-frontera 16/16 · 1.106 s |
| `diagDSK tab h borde vuelo frase`, con D3h corregido | **VERDE**, 805 s · V-h 24/24 · V-vuelo 4 + 2 globos · V-borde 40/40 · V-frase 50/50 normativas, 5/5 referencias y 7/7 informativas · V-óvalo-fases 10/10. Las otras seis varas (cel, tv, fuera, giro, hb, frontera) no ven D3h: no llevan `h` con f < 1. V-giro pasa por 1100×744, que es `h` con ×1, y allí el `max` deja la letra igual |
| `diagPUE voz2` | **222 medidas, 0 en rojo** (código 0): voz2.ovalo, recorte, capa, indicio, toque, a11y y siguiente, en 1920×1080, 412×915, 390×844, 360×640 y 844×390, mesas 5–2, más la burbuja del 5173. VOZ-2 y O1, intactos |
| `diagDSK webkit` | **VERDE** (WebKit 26.5): webkit.1, webkit.2 y consola; 40 celdas que cuentan y 10 con la LIMITACIÓN de siempre (el iPhone acostado) |

`tab` con las once varas tardaría unos 28 min (1.106 s + 566 s): roza el tope de 30 min de las tareas de fondo. Por eso se corrió en dos partes, `tab frase` y las otras nueve, como manda la ficha (§1.6).

Los anchos de V-óvalo-fases con el producto (px de pantalla):

| Tamaño | Ancho del óvalo |
|---|---|
| 744×1100 | 691,19 |
| 744×1047 | 691,66 |
| 834×1108 | 778,91 |
| 1024×1259 | 960,22 |
| 440×763 | 398 |

### 8.2 V-cel y la banda P

**V-cel no re-sella nada.** La matriz de la Fase 0 de TAB-1 (`scripts/tab/ref/t3_matriz.csv`) lleva 8 filas de 440×763, mesas 2–5, en reposo y en turno, y salen **al byte**: t3 88/88.

En reposo y en turno, el pozo de 440×763 no está a 0 y «A igualar» se ve. El contenido del óvalo ya desborda la pista y el óvalo mide 398, que es su pista. P lo estira a ese mismo ancho, así que la fila no cambia. P solo cambia algo en el pago, y V-cel no mide el pago.

Los 25 pares del Grupo 1 (360×640, 390×844, 412×915 y 915×412) están fuera de la banda: 25/25, con 14 idénticos al píxel.

No hay ningún cambio en V-cel, ni dentro ni fuera de la banda.

### 8.3 Hallazgo H-1 · D3h empujaba la frase de las mesas 2 y 3

- **Qué pasó.** La primera tirada de las nueve varas salió con V-borde en rojo en 1366×623, mesa 2, con 6,66 px de deriva frente a la geometría sellada de TAB-2.
- **Por qué.** «A igualar» lleva la misma clase que «Pozo» (`.pot-label`, GameTable.jsx:2180 y :2188). D3h, con el selector del prototipo de la Fase 0, agrandaba las dos. La caja de «A igualar» está oculta en el pago, pero ocupa su sitio en la fila de la frase. Al crecer 6,64 px, empujaba y estrechaba la frase en las mesas 2 y 3.
- **Por qué no se vio antes.** La matriz de la Fase 0 vigilaba las anclas de la mesa sin la caja de la frase, y la lámina solo midió la laptop en las mesas 4 y 5.
- **La medida** (1366×623 en reposo, en px de pantalla):

| Caja | D3h del prototipo | D3h en `.pot-box .pot-label` |
|---|---|---|
| «A igualar» | +6,64 | 0 |
| La frase, mesas 2 y 3 | 6,64 | 0 |
| El pozo, el óvalo y la franja central | 0 | 0 |
| El comodín (m4 y m5) | +4,3 de ancho, en su propia fila | +4,3 de ancho, en su propia fila |

- **El arreglo.** El selector pasa a `.pot-box .pot-label`, que es lo que D4 decía: el rótulo del pozo. V-h mira ese mismo rótulo, y su O1 fuerza las mismas letras que hoy.
- **Lo que queda.** «A igualar» sigue a 8,7 px visibles en la laptop (riesgo 4).
- **Comprobado** con las 60 celdas `h` con f < 1 de la matriz (§5.1) y con `tab h borde vuelo frase`, todo verde (§8.1).

### 8.4 INV-04 (los óvalos, intocables)

S5 cambia el ancho del óvalo de 4 y 5 en `tv`. INV-04 lo permite por su precisión de PAN-1: «el óvalo no se toca por diseño ni por contenido; se adapta al tamaño de la pantalla». Con S5 el óvalo pasa a depender de su pista, el tamaño de la pantalla, y deja de depender de su texto, que es lo que hacía mal. Su alto sigue siendo el fijo de O1. INV-04 no cambia.

## 9. Huellas de los protegidos (al byte)

| Archivo | blob | sha256 | líneas |
|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `317452ec5b57408a9010c727c5da4e1af039462d7aec58925bff7bf96719f6e0` | 748 |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `3a8ea7b0386c7ddfa5e85d849ddfa1204113740da7a97b5bfce0f75714400801` | 1445 |
| `src/engine/deck.js` | `eb61426083ca` | `69f92d6b9aac433cb99e7ec23d6052af1a6aa66c0f61eee180ba8f045911aa82` | 69 |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0049051fd4b8b891deb86066bb1eb89669e3509f18bb995d288232636b3ee30c` | 59 |
| `src/styles/opponentPanel.css` | `fbc9f3d08ede` | `4b91338a205e4a6a489466aa9d07ac7c263ca137b3ee12177812ad9a62833f5a` | 1084 |
| `src/styles/gameTable.css` | `87c9cb519bdb` | `9b6b716f23ade19aaf0a6941efbc3c2bc219b4eca9cbf451dda9181c5ac47306` | 6289 |

Idénticas a las de la Fase 0 y a las del arranque de cada tramo. Ningún protegido se abrió.

## 10. Riesgos

1. **El aparato real.**
   - Chromium y el WebKit de Playwright dan las mismas cifras, pero ninguno es un iPad ni un iPhone.
   - La banda P depende del ancho que Safari deje a la página: 440 en el iPhone 17 Pro Max vertical.
   - Si una versión de Safari cambiara ese ancho o el alto útil de 763, el teléfono podría salir de la banda. Volvería a lo de hoy (la frase a 0), no a algo peor.
2. **La segunda franja no tiene aparato medido.**
   - Ningún teléfono de los 85 la alcanza. Solo la vigila la celda sintética 450×980.
   - Si un plegable o un teléfono futuro cayera ahí, recibiría la regla. Es la misma que ya se mide en 440×763.
3. **El umbral depende del contenido.**
   - Los 410 y 444 salen de la pastilla «Comodín activo · vale 10/11» y del pozo a 0 en el pago. Con un texto de comodín más largo (otra lengua, otro valor), el umbral subiría.
   - Un teléfono de 410–443 px que dejara de necesitar la regla la recibiría igual. El daño sería pequeño: el óvalo a su pista, como en el 360.
   - Uno que la necesitara y no la tuviera volvería a la frase en 0.
   - V-frase lo vería en 440×763 y en 450×980, pero no en un tamaño que no mide.
4. **«A igualar» sigue a 8,7 px visibles en la laptop.** Lleva la misma clase que «Pozo», pero agrandarla empuja la frase (H-1). Si se quiere legible, necesita una salida propia que no toque la fila de la frase; es una idea anotada, fuera de TAB-3.
5. **V-óvalo-fases no ve dos manos.** Mide una mano por celda con la semilla del arnés; una mano con otras fases, como un All-in, no se recorre.

## 11. Lo que queda sin borrar

- **`laminas/tab3/`** (74 MB, sin commitear): la lámina del Tramo L, con `lamina.html`, `datos.js`, `capturar.mjs`, `armar.mjs`, `variantes.mjs`, las medidas y 424 capturas. Victor la borra a mano.
- **El scratchpad de la sesión**, en `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\1d8fe332-0395-44a2-906e-90067ab4fc7a\scratchpad\`:
  - las sondas de la Fase 0 (`tab3.mjs`, `salidas.mjs`, `fases.mjs`, `fases_L.mjs`, `analizar.mjs`);
  - `comparar.mjs` y `alcanceP.mjs`;
  - los datos: `crudo_producto.json`, `comparar.json`, `tabla_producto.md` y `fallan_producto.md`;
  - las salidas de las corridas: `A_*.txt` y `L_*.txt`.

## 12. Pruebas para Victor

En la PC, en la carpeta del repo, deja levantado el servidor de prueba con la versión nueva. En una ventana de PowerShell:

```
npm run build
npx vite preview --port 4173
```

El segundo comando lleva guiones dobles (`--port`). Si prefieres no escribirlos, `npx vite preview` usa el 4173 por defecto. Espera a que diga `Local: http://localhost:4173/`; tarda menos de 1 min.

### Prueba 1 · Tableta en la PC, sin túnel (unos 6 min)

1. Abre Chrome en `http://localhost:4173` y entra con tu cuenta.
2. Pulsa F12 y después el icono de dispositivo (o `Ctrl + Mayús + M`). En «Dimensions» elige «Responsive» y escribe 744 × 1100.
3. Pulsa F5 para recargar con ese tamaño.
4. Entra en una mesa de 4. Pulsa «Iniciar mano» y juega la mano hasta el resultado (Pasar o Igualar y «Sin descartar»). Son unos 40 s.
5. Mientras juegas, mira el óvalo verde del centro: no debe cambiar de ancho, y el pozo no debe moverse.
6. En el resultado, la frase («IA 2 gana con…», «¡Ganas con…!») se lee en su propia fila, debajo de «Pozo» y de «Comodín activo».
7. Sal de la mesa y repite con una mesa de 5.
8. Cambia a 1024 × 1366, recarga y repite con la mesa de 4.

| Qué ves | Qué quiere decir |
|---|---|
| La frase debajo del pozo, entera o con «…» | Bien |
| El óvalo con solo pozo, «⌄» y comodín | Mal: la regla no llegó. Anota el tamaño |
| El óvalo cambia de ancho durante la mano | Mal (O1). Anota en qué momento |

### Prueba 2 · iPhone grande en la PC (unos 4 min)

1. En el mismo modo dispositivo, escribe 440 × 763 y recarga.
2. Mesa de 4, una mano hasta el resultado: la frase se lee en su fila, como en la tableta.
3. Cambia a 412 × 915 (el S25) y recarga. Mesa de 4 hasta el resultado: debe verse **como hoy**, con la frase al lado del pozo y el comodín debajo.

| Qué ves | Qué quiere decir |
|---|---|
| 440×763 con la frase en su fila | Bien |
| 412×915 como hoy | Bien |
| 412×915 con la frase en su propia fila | Mal: la banda alcanzó un teléfono que no debía |

### Prueba 3 · Laptop HP (unos 3 min)

1. En la laptop, Chrome por el túnel de siempre hacia el 4173 de la PC (la laptop no tiene el repo), sin F12 y con el zoom del navegador al 100 % (`Ctrl + 0`).
2. Mesa de 4, una mano hasta el resultado.
3. Mira «POZO», encima de la moneda, y la pastilla «Comodín activo · vale 10»: se leen algo más grandes que antes y nada más se ha movido.

| Qué ves | Qué quiere decir |
|---|---|
| Letra algo mayor y nada desplazado | Bien |
| Algo se mueve o se corta | Mal: anota qué |

### Prueba 4 · S25 por el túnel (unos 4 min)

1. Abre el túnel de siempre hacia el 4173 y entra desde el S25 en vertical.
2. Mesa de 4 y mesa de 5, una mano cada una hasta el resultado.
3. Todo debe verse **idéntico a hoy**: el S25 no está en la banda P.

| Qué ves | Qué quiere decir |
|---|---|
| Idéntico a hoy | Bien |
| La frase en su propia fila | Mal: anótalo con una captura |

### Prueba 5 · Dejarlo todo como estaba (1 min)

1. En Chrome: cierra F12 y el modo dispositivo (`Ctrl + Mayús + M` y F12). Si tocaste el zoom, `Ctrl + 0`.
2. Cierra el túnel.
3. En la ventana de PowerShell del servidor, pulsa `Ctrl + C`.
4. Cuando termines de mirar la lámina, borra a mano la carpeta `laminas\tab3`.

## 13. Mapa de commits (orientativo, para la ficha del rector)

| Commit | Archivos | Comprobación |
|---|---|---|
| a) producto | `src/styles/escala.css` y `src/styles/escala.test.js` | vitest y build por sí solo |
| b) arnés | `scripts/tab/tab.mjs` | La prueba del registro no lo lee, pero la fila de la §6 lo nombra |
| c) registro y documentos | `docs/AJILEI_Invariantes_v1.0.md`, `docs/reportes/AJILEI_TAB-3_Fase0_Informe_v1.0.md` y este informe | Juntos, porque INV-64 cita los dos informes: `scripts/testInvariantes.test.js` falla si el registro viaja sin ellos |

Antes de cada commit, vitest y build sobre una copia de su árbol, como en VOZ-3. Fuera de los commits quedan `laminas/tab3/` y los residuos de MOT-1 y `laminas/mon1`.

**STOP-A.**

## 14. La validación de Victor (2026-10-24)

Las cuatro pruebas del §12, en verde:

| Prueba | Resultado |
|---|---|
| 1 · Tableta en la PC (F12 a 744×1100 y 1024×1366, mesas 4 y 5) | La frase en su fila y el óvalo sin vaivén |
| 2 · iPhone grande en la PC (F12 a 440×763) | La frase en su fila; 412×915, idéntico a hoy |
| 3 · Laptop HP por el túnel | «Pozo» y el comodín más legibles, y nada movido |
| 4 · S25 por el túnel | Las mesas 4 y 5, idénticas a hoy |

El rector aceptó el STOP-A con H-1 (D3h acotado a `.pot-box .pot-label`). Los tres commits los describe `AJILEI_TAB-3_Commits_v1.0.md`.
