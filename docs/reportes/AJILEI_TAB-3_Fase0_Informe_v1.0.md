# AJILEI · TAB-3 · La frase en la tableta · Fase 0 · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Fecha:** 2026-10-23 (corridas hasta las 00:05 del 24)
**Ficha:** `AJILEI_TAB-3_Fase0_v1.0.md` · **Punto de partida:** `main` en `260ab9f`
**Tipo:** diagnóstico, solo lectura. Sin cambios en `src/`, `scripts/` ni configuración, sin commits. La única escritura en el repo es este informe.

---

## 1. Resumen para Victor

- **Lo de la tableta pasa en todas las tabletas en vertical, no solo en el iPad mini.** He medido 85 tamaños × 4 mesas (340 celdas). En las mesas de 4 y 5, las **16 ventanas verticales con clase `tv`** (de 744×1026 a 1024×1366) tienen la frase a **0 px**: no se lee ni una letra.
- **La causa es sencilla.** En vertical, el óvalo de 4 y 5 jugadores **mide lo que mide lo que lleva dentro**: pozo + «A igualar» + comodín. La frase (desde VOZ-2) no pide sitio, así que el óvalo no le deja ninguno. En el celular de 360 el óvalo no cabe en la pantalla y se recorta al ancho disponible. Entonces el comodín baja a otra fila y a la frase le quedan 73 px. En la tableta todo cabe en una fila y la frase se queda en 0.
- **Hay un segundo fallo en la tableta, que nadie había visto.** El óvalo de 4 y 5 **cambia de ancho en cada fase de la mano**: entre 8 y 15 anchos distintos en una mano, porque la crónica de apuestas lo ensancha. Con él se mueve el pozo. En el celular no pasa.
- **Arreglo propuesto (S5):** que en la tableta el óvalo ocupe todo el ancho de su sitio, como en el celular, y que la frase vaya en su propia fila, debajo del pozo y el comodín. Se lee **la frase entera** en las 32 celdas que fallan, el óvalo deja de cambiar de ancho y **el celular no cambia ni un píxel**. Va en `escala.css`, que no es protegido. Una alternativa más discreta es S3: solo el óvalo a lo ancho, con la frase al lado del pozo en 2 líneas.
- **Tres cosas para decidir (§9):**
  1. En el **iPhone grande en Safari vertical (440×763)** la frase también mide 0. Es un teléfono, así que según D4 no lo he tocado.
  2. En la **mesa de 2 acostada** («dos óvalos») se leen 41 de 67 letras frente a las 67 del celular vertical. El sujeto sí se lee entero.
  3. La **letra de 8 px**: en la laptop (`h` con factor < 1) se puede subir a 10 sin mover nada. En `hb`, subirla hace crecer el óvalo 2 px.
- **Para verlo en tu PC (D7):** Chrome, F12, modo dispositivo, 744×1100. **Reproduce el fallo**: medido con ratón y con dedo, clase `tv` ×1,301, frase a 0 px.

---

## 2. Línea base y huellas

| Medida | Esperada | Medida al empezar |
|---|---|---|
| vitest | 73 archivos / 1.781 | **73 / 1.781**, verde a la primera (6,7 s) |
| lint | 21 (20 errores + 1 aviso) | **21 (20 + 1)** |
| build | verde | **verde** |
| `diagDSK tab` | VERDE 9/9 | **VERDE 9/9** en 1.109 s, código 0, aislamiento verde (312 contextos). V-cel 25/25 (15 idénticos al píxel) y t3 88/88 · V-tv 48/48 · V-h 24/24 · V-vuelo ✓ · V-fuera 12/12 · V-giro ✓ · V-borde 40/40 · V-hb 48/48 · V-frontera 16/16 |

**Huellas de los protegidos** (lista canónica v1.8; blob, sha256 entero y líneas). Al empezar y al terminar son idénticas entre sí y a las de VOZ-3 (`diff` vacío):

| Archivo | blob | sha256 (16) | líneas |
|---|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | `317452ec5b57408a` | 748 |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `3a8ea7b0386c7ddf` | 1445 |
| `src/engine/deck.js` | `eb61426083ca` | `69f92d6b9aac433c` | 69 |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0049051fd4b8b891` | 59 |
| `src/styles/opponentPanel.css` | `fbc9f3d08ede` | `4b91338a205e4a6a` | 1084 |
| `src/styles/gameTable.css` | `87c9cb519bdb` | `9b6b716f23ade19a` | 6289 |

---

## 3. §A · La matriz: ¿dónde tiene sitio la frase?

**Tamaños (D1).** Uso **los 64 de la Fase 0 de TAB-1** (`scripts/tab/ref/t3_matriz.csv`) **más los 20 de la lista vigente de `tab`** que no estaban allí (1133×716, 1920×929, 3440×1290, 3840×1960, 1280×577, 1242×566, 1093×498, 1024×600, 956×402, 932×390, 891×370, 960×411, 1006×411 con dedo y con ratón, 905×369, 1030×420, 823×707, 980×560, 1133×500, 744×1100). Les sumo **744×1100 con ratón** para §F. En total, **85 tamaños × mesas 2, 3, 4 y 5 = 340 celdas**: 0 sin medir, 0 errores. El puntero sale de `tam` (`tactil`), de las listas de `tab` (`movil`) y, si no, de la clase del CSV (celular/tableta = dedo; laptop/escritorio = ratón). La celda 1133×716 en pantalla completa de `HZ` no entra: su pantalla completa no cambia el óvalo.

**Cómo se mide.** Sonda `tab3.mjs` del scratchpad, contra `vite preview` en el 4173 (el `dist` de `260ab9f`) y con la escala REAL (`escalaReal(true)`). Cada celda llega al pago con `voz2Mesa.abrirCeldaEnPago`, sin tocarlo: semilla 5, pago reconocido por `data-tono` y mesa quieta. Mide con `MEDIR_VOZ2` (lo que se LEE antes del «…», el de VOZ-3), en una página, con las formas:
- **real**: la de la mano, igual en todos los tamaños de una misma mesa: m2 «¡Ganas con Bastos, 30 pts!», m3 «IA 1 gana con Copas, 31 pts.», m4 «IA 2 gana con Bastos, 30 pts.», m5 «IA 3 gana con Oros, 42 pts.»;
- **C1** de VOZ-3, en su forma de mesa («¡Ganas con Espadas, 41 pts! A IA 1 se le devuelven 350 Heptacoins.», 66–67 car.);
- **titular largo**: el empate resuelto por cercanía a la Mano («Empate, 31 pts. Gana IA 4 por ser el más cercano a la Mano.», 59–60 car.);
- también `multi-ajilei` y `peor`, solo para informar.

**El sujeto (D2 a)** se cuenta por prefijo: «¡Ganas», «La IA gana», «IA n gana», «Empate», «¡Cuatro con AJILEI!»… **D2 (b)** compara con 360×640 de la misma mesa y la misma frase.

**Tabla completa:** `tabla_hoy.md` del scratchpad (340 filas: clase y factor, caja de la frase en px CSS y de pantalla, comodín en la misma fila o en otra, y leídos/total con (a) y (b) para las tres frases). Ruta completa en el §12.

### A.1 · Resumen: las 56 celdas que fallan D2

**(i) La tableta vertical, mesas 4 y 5: 32 celdas, todas con caja 0.** Falla todo: 0 leídos, ni el sujeto. El comodín va en la misma fila que la frase.

| Tamaño | Clase ×f | m4 | m5 |
|---|---|---|---|
| 744×1026 · 744×1047 · 744×1100 (dedo y ratón) · 744×1133 | tv ×1,264 · ×1,289 · ×1,301 · ×1,301 | 0 px · 0/29 · C1 0/66 · titular 0/59 | 0 px · 0/27 · 0/66 · 0/59 |
| 768×938 · 768×1024 | tv ×1,155 · ×1,261 | ídem | ídem |
| 800×1128 · 800×1280 | tv ×1,389 · ×1,399 | ídem | ídem |
| 820×1073 · 820×1180 | tv ×1,321 · ×1,434 | ídem | ídem |
| 834×1108 · 834×1194 | tv ×1,365 · ×1,458 | ídem | ídem |
| 876×1248 | tv ×1,531 | ídem | ídem |
| 1024×1259 · 1024×1366 | tv ×1,55 · ×1,6 | ídem | ídem |

La referencia del 360 lee 18 de la real, 19 de C1 y 19 del titular.

**(ii) Un teléfono, mesas 4 y 5: 2 celdas.** **440×763** (iPhone 16/17 Pro Max en Safari vertical), sin atributo: **caja 0**, 0 leídos. Lo mismo que la tableta, por el mismo mecanismo (§B.3). Según D4 solo se informa (pregunta P-2).

**(iii) La mesa de 2 en «dos óvalos», horizontal ≤ 600: 22 celdas, solo falla (b).** La caja mide 135 px CSS. La real se lee entera (26/26). C1 da **41/67 frente a 67/67** del 360 vertical y el titular **41/60 frente a 60/60**, pero el sujeto se lee entero en todas. Celdas: teléfonos acostados 744×384, 832×390, 832×440, 891×370, 905×369, 915×412, 932×390, 956×402, 960×411, 1006×411 (dedo y ratón), 1030×420; ventanas sin atributo 899×600 🖱, 900×600 🖱, 980×560, 1133×500; y `hb` 1024×600, 1093×498, 1242×566, 1280×577, 1280×585, 1280×600. Pregunta P-3.

**Lo que pasa D2.** Las 284 celdas restantes:
- todas las mesas 2 y 3 en vertical;
- todo el escritorio `h`: la frase de 4 y 5 en la rejilla 2×2 mide 303–361 px CSS;
- el traje B y `hb` en las mesas 3–5 (113 px y 9–10 px de letra);
- los teléfonos verticales salvo 440×763.

Dos pasan **justas**:
- **823×707 m4/m5** (Fold interior, `h` ×0,952): caja 86 px CSS y 19 leídos de C1, los mismos que el 360;
- **440×956**: el comodín salta por 3,75 px (§B.3).

---

## 4. §B · El centro del óvalo, por dentro

### B.1 · Los hijos de `.center-zone` (pago y resto de fases)

En el pago y en todas las fases de la mano son los mismos cuatro, en este orden (`GameTable.jsx:2165-2211`):
1. `.pot-box`;
2. `.call-box`, **siempre en la fila**: fuera de las apuestas va con `visibility: hidden` y ocupa sitio;
3. `p.game-message`, con `span.voz2-texto` y `svg.voz2-indicio` en el pago;
4. `span.comodin-note`.

Con aviso de reducción, `.elim-notice-inline` **sustituye** a los cuatro (`GameTable.jsx:2213-2219`, `gameTable.css:924`).

**Vertical, mesas 4 y 5 (traje A; en `tv` el mismo ×f):**

| Pieza | Regla | Dónde |
|---|---|---|
| El óvalo es una celda de la rejilla de `.table-mid` que **se centra y no se estira** | `.table-wide .table-mid { display: grid; grid-template-columns: 1fr 1fr; justify-items: center }` · `.table-wide .center-zone { grid-column: 1 / -1 }` | `gameTable.css:1343-1353` (protegido) |
| Alto fijo O1 | `.table-wide .center-zone { height: var(--o1-oval-h) }` | `gameTable.css:1486-1490` |
| Flex con salto de línea, anclado a la izquierda | `flex-wrap: wrap; justify-content: flex-start; gap: 8px 12px; padding: 6px 22px` | `gameTable.css:1274-1293` |
| Con alto ≤ 772 | `gap: 5px 12px; padding: 4px 22px` · comodín a **8 px** | `gameTable.css:2158, 2174` |
| Pozo | `min-width: 64px; padding: 5px 12px; flex-shrink: 0` (en el pago: 86–90 px) | `gameTable.css:123-132, 1321` |
| Frase | `flex: 1` (= `1 1 0%`), `height: 28px; font-size: 13px` | `gameTable.css:186-198, 1325` |
| El texto del pago | `contain: inline-size; width: 100%`: **no aporta ancho** | `voz2.css:47-57` |
| Comodín | `flex-shrink: 0; white-space: nowrap` · 10 px (8 px con alto ≤ 772) | `gameTable.css:897-907, 1958, 2174` |

**Escritorio y tableta horizontal `h` (4 y 5):** rejilla 2×2 `auto minmax(0, 360px)` con el comodín bajo la frase (`gameTable.css:1130-1151`), y la frase estirada a su pista (`voz2.css:72-77`). **Traje B y `hb`:** `flex-wrap: nowrap`; la frase (`flex: 1`) se queda lo que sobra (`gameTable.css:2641-2670`).

### B.2 · Cuándo aparece la pastilla del comodín

Siempre que la mesa **arrancó** con 4 o más (`numPlayers >= 4`, `GameTable.jsx:2203`), en todas las fases, y nunca en mesas que arrancan con 2 o 3. El texto depende de los vivos (`handRules.comodinValue`, `handEvaluator.js:2-6`):
- «Comodín activo · vale 10» con 4;
- «· vale 11» con 5;
- «Sin comodín» al bajar a 3, con la pastilla aún montada (comentario en `gameTable.css:2167-2173`).

`handRules` no la enciende en las mesas de 2 y 3.

### B.3 · El umbral exacto: cuándo salta el comodín

El óvalo de 4/5 en vertical **mide lo que mide su contenido, sin pasar del ancho de su pista**, porque `justify-items: center` no lo estira. La frase con `contain` aporta 0. Por tanto:

> **contenido** = pozo + «A igualar» + comodín + 3 huecos de 12 + 44 de relleno (+2 de borde)
> si **pista ≥ contenido** → todo en una fila y la frase = **0**;
> si **pista < contenido** → el óvalo se recorta a la pista, el comodín salta a la 2.ª fila y la frase = pista − (pozo + «A igualar» + 2 huecos + relleno).

Medido en el pago, que es el peor caso: el pozo vale 0, su caja está en el mínimo y la frase lleva su contenido:

| Ventana | Comodín | Contenido | Pista | Resultado |
|---|---|---|---|---|
| 360×640 / 360×704 | 8 px (110,8) | 367,6 | 318 | salta · frase **73** |
| 384×744 | 8 px | 367,6 | 342 | salta · frase 97 |
| 390×844 | 10 px (136,9) | 401,8 | 348 | salta · frase 95 |
| 412×915 (S25) | 10 px | 401,8 | 370 | salta · frase 117 |
| 440×956 | 10 px | 401,8 | 398 | salta por **3,75 px** · frase 145 |
| **440×763** | 8 px | 367,6 | 398 | **no salta · frase 0** |
| **`tv` (todos)** | 10 px (≈136,5) | ≈400 | 531–624 | **no salta · frase 0** |

Expresado en ancho de ventana, el teléfono cae en 0 con alto ≤ 772 desde un ancho de **≈ 410**, y con alto > 772 desde **≈ 444**. Ningún teléfono vertical de hoy llega a 444. El que más se acerca es 440×956, con 3,75 px de margen.

### B.4 · Lo transitorio y el peor caso (O1)

En esa fila **no entra nada transitorio**:
- `.pot-float` y la flechita de VOZ-2 son absolutos;
- la insignia TURNO vive en los paneles;
- el aviso de reducción sustituye a los cuatro hijos.

**El peor caso es el pago**: pozo a 0 (su caja más estrecha) y «A igualar» oculto pero presente.

**Hallazgo nuevo, O1 en `tv` (preexistente).** La sonda `fases.mjs` muestrea el óvalo en cada paso de una mano entera. Fuera del pago, el `<p>` lleva la crónica **sin** `contain`, así que su ancho máximo es el texto y el óvalo se ensancha con él.

| Celda | Anchos del óvalo en una mano (px de pantalla) | Sitios del pozo |
|---|---|---|
| 744×1100 m4 | 8 anchos: 520,16 – 691,19 | 8 |
| 744×1100 m5 | 9 anchos: 519,19 – 691,19 | 9 |
| 1024×1259 m4 | 10 anchos: 618,25 – 960,22 | 10 |
| 1024×1259 m5 | 15 anchos: 617,09 – 960,22 | 15 |
| 360×640 m4 / m5 | 1 ancho (318) | 2 (el vaivén vertical de siempre) |

`tab` no lo ve: V-tv mide reposo, turno y entre manos, y en cada uno el óvalo tiene un ancho; nadie compara un estado con otro.

---

## 5. §C · Las salidas

Todas se inyectaron con `<style>` **desde la sonda** sobre el `dist` del 4173, bajo `html[data-escala="tv"] .game-table-screen`. El celular no las evalúa: no hay atributo (D4). Vivirían como gemelas en **`escala.css` §2** (no protegido, D5), después de `:90`. Ninguna toca un protegido.

| | Qué hace (CSS) |
|---|---|
| **S1** | El comodín a su propia fila, como en el celular: `.center-zone::after { content: ''; flex-basis: 100%; height: 0; order: 1; margin-top: -8px }` + `.comodin-note { order: 2 }` |
| **S2** | Un mínimo para la frase: `.game-message { min-width: 120px }` |
| **S3** | El óvalo a lo ancho de su pista, como en el celular: `.table-wide .center-zone { justify-self: stretch }` |
| **S4** | La frase en su propia fila, debajo de pozo + comodín: `.game-message { flex-basis: 100%; order: 1 }`. La primera versión, sin `order`, dejaba el comodín 36 px fuera del óvalo y se descartó |
| **S5** | S3 + S4 |

**Medido en las 340 celdas.** Cada salida, en la misma página que la medida de hoy:

| Salida | Arregla (de las 56) | Δ óvalo máx (px pantalla) | Δ fuera del óvalo | Algo sale del óvalo | Crece con el texto | Desplaza | Teléfono | O1 entre fases (`fases.mjs`) |
|---|---|---|---|---|---|---|---|---|
| S1 | 32 (las de `tv`) | 19,19 | 0 | **sí**: el comodín en 768×938 m4 | 0 | no | 0 px | **no**: sigue con 8–15 anchos |
| S2 | 32 | 192 | 0 | no | 0 | no | 0 px | **no**: 2–9 anchos |
| S3 | 32 | 343,13 (ancho y x; el alto no cambia) | 0 | no | 0 | no | 0 px | **sí**: 1 ancho, pozo en 1 sitio |
| S4 | 32 | **0** | 0 | no | 0 | no | 0 px | **no**: los mismos 8–15 anchos de hoy |
| S5 | 32 | 343,13 | 0 | no | 0 | no | 0 px | **sí**: 1 ancho, pozo en 1 sitio |

Ninguna alcanza las 24 restantes: 440×763 no tiene atributo, y la mesa de 2 horizontal es otra ruta.

**Lectura en `tv` (C1 y titular frente a la referencia de 19/19):**

| | Caja de la frase (px CSS) | real | C1 | titular | Comodín |
|---|---|---|---|---|---|
| S1 | 159–161 | entera | 47/66 | 46/59 | otra fila |
| S2 | 120 | entera | 27/66 | 32/59 | misma fila |
| S3 | 131–133 en ×1,30–1,53 · 200–224 en 768×938, 1024×1259 y 1024×1366 | entera | 27–66/66 | 33–59/59 | misma fila |
| S4 | 353–355 | entera | **66/66** | **59/59** | otra fila (va encima de la frase) |
| S5 | 486–578 | entera | **66/66** | **59/59** | otra fila |

**El óvalo con S3/S5 (regla v2).** Pasa de ≈ 400 px propios a **toda su pista**:
- 531 en 744×1100;
- 548 en 744×1026;
- 624 en 768×938, el que más (factor 1,155, pista ancha).

Es la misma regla que ya cumple el celular, donde el óvalo llena su pista (318 de 360). En proporción, el celular da 318/360 = 0,88 y `tv` 531/572 = 0,93. El alto no cambia (`--o1-oval-h`) y nada fuera del óvalo se mueve (Δ 0 en paneles, cartas, barra, cabecera y acciones). El pozo se desplaza dentro del óvalo: **66 px propios hacia la izquierda** con S3/S5 (el óvalo ensancha y el pozo va anclado a su borde) y **19,1 px propios hacia arriba** con S4/S5 (dos filas en vez de una).

**El celular, al píxel (D4).** En las 340 celdas, las de teléfono (sin atributo) dan **Δ 0 en todas las anclas** con las cinco salidas. Capturas en la misma página, hoy frente a cada salida:
- 360×640 m4: **idéntica al byte** con las cinco;
- 360×640 m5: idéntica con S1, S3, S4 y S5, y **8.944 px distintos con S2**.

S2 no puede actuar allí: no hay atributo y las anclas dan Δ 0. Por eso lo tomo por ruido de raster o de una animación que la pausa no fija, no por un cambio. No repetí esa captura; la Fase 1 la repite con la vara de `cap`.

**Capturas para la lámina** (scratchpad `fotos/`):
- `744x1100_m4_{hoy,S1,S2,S3,S4,S5}.png` y `744x1100_m5_…`;
- el testigo `360x640_m4_…` / `m5_…`.

Las de 1280×577, 1366×623, 1920×1080 y 915×412 son del primer piloto (S4 viejo) y solo sirven de contexto.

**Recomendación: S5**, con S3 como alternativa mínima.
- S5 deja leer la frase entera en todas las tabletas y arregla además el vaivén del óvalo (O1).
- Su apariencia es la de la mesa de 2 y 3 en vertical: pozo arriba y frase abajo, a todo lo ancho.
- S3 es el cambio más pequeño, una sola declaración. Arregla D2 y O1, pero en 744 lee solo 27–29 de C1 (2 líneas de 131 px).
- S1, S2 y S4 quedan descartadas: no arreglan O1, y S1 además saca el comodín del óvalo en 768×938.

---

## 6. §D · La letra de 8 px (D3)

**Dónde es pequeña, en px de pantalla:**

| Clase | Ventanas medidas | Rótulo «Pozo» / «A igualar» | Comodín | Frase | Regla |
|---|---|---|---|---|---|
| Teléfono vertical, alto ≤ 772 | 360×640, 360×704, 384×744, 440×763 | 10 | **8** | 13 | `gameTable.css:2165, 2174` |
| Teléfono acostado (B, sin atributo) | 744×384 … 1030×420 | **8** | **8** | 9 | `gameTable.css:2715-2717, 2727-2729` |
| B sin atributo, ventanas no teléfono | 899×600 🖱, 900×600 🖱, 980×560, 1133×500 | **8** | **8** | 9 | ídem |
| `hb` | 1024×600, 1093×498, 1242×566, 1280×577/585/600 | **8** | **8** | 10 (TAB-2) | ídem |
| `h` con f < 1 | 800×601 ×0,87 · 1133×658 ×0,884 · 1366×623 ×0,874 · 1024×682 ×0,917 · 823×707 ×0,952 · 1133×716/720 ×0,965/0,971 · 1180×713 ×0,961 | **8,70 – 9,71** | 9,57 – 10,68 | 13–14,5 | 10 y 11 propios × f (`gameTable.css:134-140, 897-907`) |

**Fuera del teléfono, sin protegidos:**
- **`h` (prototipo D3h)**: `max(10px, 10px / f)` en `.pot-label` y `max(11px, 10px / f)` en `.comodin-note`, el mismo patrón que `escala.css` §5 con las insignias. Resultado: 10 px visibles en todas las celdas `h`, **0 px de movimiento** en todas las anclas y el óvalo intacto. La caja de la frase de las mesas 3 pierde 2–7 px y sigue leyéndose entera.
- **`hb` (prototipo D3hb)**: 8 → 10 en rótulo y comodín. **El óvalo crece 2 px** (37,8 → 39,8, Δ anclas 3,31) y la frase de 4/5 pasa de 113 a 77 px CSS (C1 de 42 a 22 leídos, aún ≥ 19). **Rompe O1 tal cual.** Para que valga haría falta otra forma, por ejemplo subir solo el rótulo o fijar el interlineado, con su lámina.
- **El teléfono acostado y el vertical bajo** quedan fuera por D4: arreglarlos es tocar el óvalo del teléfono. Las 4 ventanas B sin atributo (899/900×600, 980×560, 1133×500) **tampoco se alcanzan sin tocar el teléfono**: comparten media y no tienen atributo.

**Recomendación:** D3h **dentro de TAB-3**, si el rector lo acepta: es pequeña, aditiva, sin movimiento y del mismo archivo. `hb` y lo demás, **aparte**.

---

## 7. §E · La vara nueva

**V-frase** (modo `tab`, `diagDSK tab frase`). En el pago (`abrirCeldaEnPago`, sin tocarlo), con la escala real, para cada celda y las tres frases (real, C1 y titular largo inyectadas con `MEDIR_VOZ2`):
1. la caja de la frase mide más de 0;
2. (a) el sujeto entero antes del «…»;
3. (b) leídos ≥ los del 360×640 de la misma mesa y frase, medidos en la misma corrida.

Las celdas normativas son las que el producto puede arreglar: `tv` (los 4 de `TV.tamanos`) × m2–m5 y `h`/`hb`. Las celdas de teléfono y de B sin atributo van **informativas** (no tiñen) hasta que el rector decida P-2 y P-3. Así la vara sería verde con S5 sin esconder 440×763 ni los dos óvalos.

**V-óvalo-fases** (pareja de V-frase, por el hallazgo de B.4). En `tv` m4/m5, durante una mano entera, el óvalo tiene **un solo ancho** y el pozo **un solo sitio**. Se mide en la misma visita, muestreando como `fases.mjs`.

**Hoy falla:**
- V-frase, rojo en las 8 celdas `tv` m4/m5 de `TV.tamanos`: caja 0, 0 leídos;
- V-óvalo-fases, roja con 8–15 anchos.

Con S5, las dos verdes. Con S1/S2/S4, V-óvalo-fases sigue roja. **Un verde mide lo que dice.**

**Coste.** En la matriz, una celda de pago costó ≈ 6–7 s efectivos con paralelismo 8 (340 celdas en ≈ 37 min). Propuesta de celdas:
- `TV` 4 × 4 = 16;
- `HB` 4 × 4 = 16;
- `HZ` 5 × {2, 4, 5} = 15;
- la referencia 360×640 × 4;
- informativas 440×763, 440×956 y 915×412 × {2, 4, 5} = 9.

Son **60 celdas, unos 8–9 min** con paralelismo 6, más V-óvalo-fases (4 manos, ≈ 1 min). **`tab` pasaría de ≈ 18,5 a ≈ 28 min.** Eso roza el tope de 30 min de las tareas de fondo, así que hay que poder correr V-frase sola (`tab frase`).

**INV-64 (propuesta):**

> **La frase del pago se lee en toda mesa con tamaño (TAB-3).** En el pago, la caja de la frase del óvalo nunca mide 0. En cada tamaño y mesa se leen antes del «…» el sujeto entero del titular y al menos tantos caracteres como en el celular de referencia (360×640, misma mesa, misma frase). Fuera del celular, el óvalo de las mesas 4 y 5 en vertical ocupa su pista, como en el celular, y su ancho no cambia de una fase a otra de la mano (O1). El celular no cambia (INV-57). Excepciones declaradas, si el rector las acepta: el teléfono en la banda en que su pista ≥ contenido (440×763) y la mesa de 2 en dos óvalos para (b).
> *Fuente:* `src/styles/escala.css` §2 (la gemela) · *Vigilante:* `diagDSK tab` (V-frase, V-óvalo-fases) · *Estado:* vigilado.

---

## 8. §F · La prueba de Victor (D7)

La sonda abrió **744×1100 sin dedo**: contexto de escritorio, `hover: hover` y `pointer: fine`, como Chrome F12 en modo «Responsive» con tipo escritorio. Resultado: **clase `tv`, ×1,301**, caja de la frase **0 px** en m4 y m5, idéntica a la celda con dedo (mismas cajas, mismos 0 leídos). La clase no depende del puntero (`escala.js:75-84`: vertical con lado corto ≥ 600 → `tv`). **F12 a 744×1100 reproduce de verdad la frase invisible.**

Cómo verlo:
1. Chrome, F12, icono de dispositivo, «Dimensions: Responsive», 744 × 1100.
2. Entra en una mesa de 4 o 5 y juega una mano hasta el resultado.
3. En el óvalo solo hay pozo, «⌄» y comodín.

Sin dispositivo con dedo también vale. Con S5 en la Fase 1 se verá la frase en su fila.

---

## 9. Riesgos

1. **S3/S5 ensanchan el óvalo de la tableta** (hasta 624 px propios en 768×938). Lo permite la regla v2, pero cambia el aspecto. La lámina tiene que enseñarlo en 744×1100, 768×938 y 1024×1366.
2. **El pozo se mueve dentro del óvalo** con S3/S5 (66 px propios a la izquierda; con S5 además 19,1 arriba). Es un cambio único: con S5 el pozo queda luego fijo toda la mano, cuando hoy cambia de sitio en cada fase.
3. **440×956 pasa por 3,75 px.** Cualquier cambio futuro que estreche el pozo, «A igualar» o el comodín en el teléfono de alto > 772, o un teléfono un poco más ancho, lo lleva a frase 0. V-frase debería tener 440×956 entre sus informativas.
4. **823×707 (Fold interior) pasa justo** (19 = 19).
5. **Un óvalo de mesa reducida** (5 → 3 vivos, «Sin comodín» montado en `.table-three`) no se midió. La pastilla es más corta y la ruta es la de la mesa de 3. Queda para la Fase 1.
6. **La gemela pisa reglas del traje A en `tv`.** S4/S5 cambian el orden de la crónica también fuera del pago (frase siempre en su fila). Medido: sin desbordes en las fases de la mano en 744 y 1024, pero la crónica más larga de TAB-2 («La IA sube a 1000. ¿Qué haces?») no se probó en `tv` m4/m5.
7. **Edge/Chromium 151** de la sonda. El reparto de flex es estándar y no esperaría diferencias en Safari, pero el iPad no se ha medido. WebKit de Windows en la Fase 1, si el rector lo pide.

---

## 10. Preguntas al rector

1. **P-1 · ¿S5 o S3?** Recomiendo **S5**: frase entera, óvalo fijo toda la mano y el aspecto de las mesas 2/3 en vertical. S3 si se prefiere el cambio mínimo. Las dos van a la lámina.
2. **P-2 · El teléfono de 440×763 (iPhone Pro Max en Safari vertical) tiene la frase en 0.** D4 prohíbe tocarlo. Recomiendo **excepción declarada** en INV-64 y V-frase informativa allí, con una decisión aparte de Victor si quiere abrir el teléfono solo en esa banda. Ojo: cambiaría la matriz t3 de V-cel en 440×763.
3. **P-3 · La mesa de 2 en «dos óvalos» falla solo D2 (b)** frente al 360 vertical (41 de 67). Su referencia natural sería el teléfono acostado. Recomiendo que en esa ruta (b) se compare con 915×412, que lee lo mismo, o que valga solo (a). En `hb` se podría ensanchar el óvalo derecho desde `escala.css`, pero no lo he probado.
4. **P-4 · D3:** ¿D3h (laptop `h`, rótulo y comodín a ≥ 10 px visibles, 0 px de movimiento) dentro de TAB-3? Recomiendo **sí**. `hb` (crece 2 px) y B sin atributo, aparte.
5. **P-5 · El vaivén del óvalo en `tv` (B.4)** entra en TAB-3 y en INV-64. Recomiendo **sí**: lo arregla la misma regla de S3/S5 y la vara cuesta 1 min.

---

## 11. Plan de la Fase 1

**Lámina** (`laminas/tab3/`, prototipos inyectados sobre la app real, receta de TAB-1/TAB-2):
- variantes: hoy · S3 · S5, y S4 de referencia de la frase entera sin ensanchar;
- vistas: 744×1100, 768×938 (la pista más ancha en px propios) y 1024×1366 (×1,6), en m4 y m5;
- en tres momentos: pago con la real, pago con C1/titular y un turno con crónica larga (para ver el ancho fijo);
- testigo: 360×640 y 440×763, idénticos.

**Sub-tandas:**
- **3a · producto:** la gemela elegida en `escala.css` §2 (2–4 líneas), con D3h en §5 si se acepta. Ningún protegido.
- **3b · arnés:** V-frase y V-óvalo-fases en `scripts/tab/tab.mjs`, filtro `tab frase`, control rojo `TAB_CONTROL=sin-frase` (la gemela apagada).
- **3c · registro:** INV-64, la fila de `diagDSK tab` en §6 de Invariantes, `src/styles/escala.test.js` si comprueba el atributo de las reglas nuevas, e informe.

**Estimación (minutos de Claude Code):**

| Tarea | Minutos |
|---|---|
| Lámina | 60 |
| 3a | 25 |
| 3b | 90 |
| `tab` completo y `tab frase` + control rojo | ≈ 45 de corrida |
| 3c | 30 |
| **Total** | **≈ 4 h** |

---

## 12. Cierre

- **Huellas al terminar:** idénticas a las del inicio (`diff` vacío).
- **Procesos y puertos:** cada sonda levantó su `vite preview` dentro de su proceso (`servidorArnes`) y lo cerró con `terminar`. Al acabar no queda ningún `node` vivo ni nada escuchando en 4173/4174/5173 (comprobado con `netstat` y `tasklist`).
- **`git status`:** solo este informe nuevo, más los residuos conocidos que ya estaban (`docs/reportes/AJILEI_MOT-1_*`, `laminas/mon1/*`). Sin `git add` ni commits.
- **Copias del árbol:** ninguna. **Uniones `node_modules`:** ninguna. Las sondas importan los módulos del repo por `file:///`.
- **Tope:** el trabajo activo pasó de los 60 min de la ficha por unos 20–25 min. La matriz completa (340 celdas en dos mitades, por el límite de 30 min de las tareas de fondo) y la línea base de `tab` (18,5 min) fueron casi todo el tiempo de corrida. No queda nada de la ficha sin hacer.

**En el scratchpad** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\1d8fe332-0395-44a2-906e-90067ab4fc7a\scratchpad\`), sin borrar nada:
- las sondas `tab3.mjs`, `salidas.mjs`, `fases.mjs`, `analizar.mjs`, `ver.mjs` y `frases.mjs`;
- los datos `crudo_piloto.json`, `crudo_A.json`, `crudo_B.json`, `crudo_fotos.json`, `ref360.json` y `fases.json`;
- las tablas `tabla_hoy.md` (la completa, 340 filas), `fallan_hoy.md` y `salidas.md` (detalle por salida y celda);
- los registros `vitest.txt`, `lint.txt`, `build.txt`, `tab_base.txt`, `matriz_A.txt`, `matriz_B.txt` y `fases.txt`;
- `huellas_inicio.txt` / `huellas_fin.txt`;
- las capturas, en `fotos/` (94 PNG).

**STOP.**
