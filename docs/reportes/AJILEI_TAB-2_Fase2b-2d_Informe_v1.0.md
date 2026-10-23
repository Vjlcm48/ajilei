# AJILEI · TAB-2 · Fases 2b–2d · Código · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Base:** `main` en `abc2ebc`
**Tipo:** código en el árbol de trabajo, **sin commits** ni `git add`. **STOP.**
**Ficha:** `AJILEI_TAB-2_Fase2b-2d_Codigo_v1.0.md` · **Reloj:** 15:53 → 16:57 según `date`.

---

## 1. Resumen para Victor

1. **Los lados de la mesa ya se llenan.** En tu monitor y en tu laptop la mesa queda donde estaba, y los lados se oscurecen hacia el borde con la filigrana, como elegiste («esa oscuridad realza el centro»). El arnés mide 0 px de franja y ninguna costura en 10 tamaños, con verde y tricolor, y la mesa no se mueve más de medio píxel.
2. **Las ventanas bajas con ratón tienen su clase, `hb`.** Por ejemplo, tu laptop con el zoom al 110 % o un monitor a 175 %. Llevan la mesa del teléfono acostado, igual que hoy, con los lados llenos y la frase del óvalo de 9 a 10 px en las mesas de 3, 4 y 5. La frase más larga de la crónica cabe en el óvalo.
3. **El teléfono no se entera.** Los 16 casos de la frontera hacen lo previsto: ningún teléfono, ni el que se conecta a un ratón, ni el iPad en ventana, recibe nada, y sus mesas son las de hoy al byte.
4. **`gameTable.css` solo cambió en dos comentarios**, con el mismo número de líneas; sin comentarios, el archivo es idéntico. Protegidos pasa a la v1.8.
5. **Encontré dos trampas y las cerré.**
   - Sin un `@supports`, un navegador antiguo habría dejado el fondo de la mesa vacío.
   - Las reglas de pantalla completa del iPad habrían pisado el traje B de `hb`.
6. **Todo verde:** las 9 varas de `tab`, más `tam`, `retar` y `webkit`. Cada vara nueva sabe ponerse roja cuando debe. Te toca la prueba del §8 (unos 25 minutos).

---

## 2. Hallazgos

**H-1 · La pantalla completa de TAB-1 habría pisado el traje B de `hb`.** Las tres reglas de §4 de `escala.css` (R-7, la banda del pie de Safari) colgaban de `:root:fullscreen[data-escala]`, o sea, de **cualquier** atributo. Con `hb` en pantalla completa habrían cambiado el relleno de B: el de abajo, de 6 a 36 px, y la cabecera, 64 px a la izquierda. Ahora cuelgan de `[data-escala="h"]`, con la misma especificidad. Para `h` y `tv` no cambia nada: `tv` solo existe en vertical, y las tres reglas viven en `@media (orientation: landscape)`. Las otras reglas generales de `escala.css` (§1: `zoom`, `min-height`, `height`, las gemelas de `.vc-ajilei` y `.cel-gota`) valen lo mismo con f = 1. Lo comprobé una a una contra sus originales (`index.css:63`, `gameTable.css:6`, `:373` y `celebracion.css:404`), y V-hb lo mide: **0,00 px** de deriva frente a B en las 16 celdas en reposo. El STOP de la ficha §3.5 no se disparó.

**H-2 · El respaldo de `hypot()` necesita `@supports`: sin él, el fondo se queda vacío.** La ficha esperaba que un navegador sin `hypot()` descartara la declaración y se quedara con el fondo de hoy estirado. **No pasa así**: una declaración con `var()` se acepta al leerla, y si su valor no se puede calcular queda inválida en el momento del cálculo. El `background` vuelve entonces a su valor inicial, sin imagen y transparente: la pantalla quedaría del color del `body` (`--green-abyss`), sin filigrana ni tapete, y el tricolor sin bandas. Lo simulé en Chromium cambiando `hypot(` por una función desconocida sobre la cascada real (`gameTable.css:5-17` y `tapetes.css:288-301`; sonda `respaldo_hypot.mjs`, en el scratchpad):

| Caso | Verde | Tricolor |
|---|---|---|
| Con `hypot()` (Chrome de hoy) | 2 capas, radio 698,68 px | 3 capas, radio 698,68 px |
| Sin `hypot()`, **con** `@supports` (lo que va en el código) | 2 capas, `circle` de hoy (variante b) | 3 capas, `circle` de hoy |
| Sin `hypot()`, sin `@supports` | **0 capas: vacío** | **0 capas: vacío** |

El radial acotado va dentro de `@supports (width: hypot(1px, 1px))`. M2b va fuera, porque no usa `hypot()`, así que el respaldo es la variante b: ni franja ni tricolor roto. `hypot()` está desde Chrome 120, Safari 15.4 y Firefox 118.

**H-3 · El radio de la lámina no era el de hoy en las ventanas estrechas.** La 2a usaba `hypot(562px, …)`, el medio ancho de la caja de 1.124. Pero en una ventana de menos de 1.126 px propios, la caja de hoy es la ventana menos el borde de `#root`, y su radio es menor. Afecta a dos de las cuatro ventanas `hb` (1093 y 1024) y a cualquier `h` estrecha (1024×768 da f = 1). El código usa `hypot(min(562px, calc(50vw / var(--escala) - 1px)), calc(50dvh / var(--escala)))`, que da el radio de hoy a cualquier ancho y no cambia nada de 1.126 en adelante.

**H-4 · El instrumento de costura de la 2a fallaba a 820 de alto.** La primera corrida de V-borde salió roja en 1180×820 (mediana 4,6–7,1). La causa no era una costura: era la filigrana. Sus líneas de ±45° cada 29 px se repiten cada 29·√2 ≈ 41 px en vertical, y a 820 de alto las 9 alturas de la sonda (82, 164, … 738) son múltiplos de 82 = 2 × 41. Las nueve caían en la misma fase del dibujo y la mediana dejaba de filtrar el cruce de una línea. Con M2b la filigrana empieza en x = 0 en vez de en 27, y en esa celda el cruce cae justo en x0 + 4 (la luz del píxel 31 sube de 26,8 a 33,4 en las cinco alturas medidas). Ahora cada columna se **promedia sobre un periodo vertical entero** (41 px) en cada una de las 9 alturas: 1180×820 da una mediana de 0,83. La vara sigue viendo un escalón real: con M2b quitado, la mediana sube a 4,3–16,3 (§4).

**H-5 · La referencia sellada es determinista.** `scripts/tab/ref/t2_geometria.json` se midió con `sellarT2()` contra un `vite preview` de `abc2ebc`, una copia por `git archive` servida en el 4192. Contiene 28 juegos de anclas (V-borde, más las mesas 3 y 4 de V-hb) y 11 filas de V-frontera. Tres sellados seguidos dieron el mismo contenido.

**H-6 · El hook no cambia.** `useEscalaMesa` llama a `enganchaEscala`, que ya escribe y borra cualquier atributo. Basta con que `clasificar` devuelva `hb` y con que `enganchaEscala` escuche la media del ratón: 5 oyentes en vez de 4, y la prueba lo cuenta.

**H-8 · La frase larga de la crónica es de la mesa de 2; la de las mesas 3–5 cabe con margen.** Las cuatro frases de la 2a (y de V-hb) incluyen «La IA sube a 1000. ¿Qué haces?», que en el código es la plantilla de la **mesa de 2** (`cronicaCore.js:95-103`). Esa frase sigue a 12 px y TAB-2 no la cambia. En las mesas 3–5 la crónica es «`<nombre>` sube a `<n>`.» (`:107-113`), y allí el humano se llama «Tú». Medí el peor caso con un nombre de 15 «W» y 12.500 (sonda `cronica_nombres.mjs`, 3 ventanas × mesas 5, 4 y 3, a 9 y a 10 px): **2 líneas como mucho y 0 px fuera del óvalo** en todos los casos. V-hb sigue midiendo las cuatro frases de la 2a, que son más exigentes que las reales: es la vara del lado seguro.

**H-7 · Higiene.**
- **Vitest:** la primera corrida completa dio «71 failed, no tests» en 1,5 s. La siguiente, sin tocar nada, pasó 71/71 archivos y 1.677 pruebas, y las siguientes también. Encaja con la sospecha de `.vite-temp` de ARN-3e (H3e-i-3).
- **Lint:** 22 problemas, pero el número 22 es de `laminas/tab2/pre.js`, la lámina de la 2a, que no se commitea. El árbol con seguimiento da 21 (20 errores y 1 aviso), los de la base, en los mismos archivos. Ninguno nuevo.
- **Compilación:** `diagDSK` compila el `dist/` en cada corrida (`decidirBuild`). El punto de control midió el árbol de ese momento (2b más el núcleo de la 2c), y cada corrida final, el árbol entero.

---

## 3. La apertura de `gameTable.css`: solo comentarios

Autorización: decisión 8 de Victor (ficha §4). Rangos: `gameTable.css:1119-1129` y `:1153-1164`. El texto es el de la §7 de la Fase 0, sin la coletilla «o de 1024 de ancho en adelante», porque la puerta de C no se abre, y con una frase sobre `hb`. El diff entero, sin contexto (`git diff -U0`):

```diff
@@ -1127,3 +1127,3 @@
-   Scope: (min-width:768) and (min-height:601) → cubre escritorio, laptop landscape
-   >600px y tablets, y NO solapa con los bloques móviles (portrait max-width:767 /
-   landscape max-height:600). 2 y 3 jug no se tocan. */
+   Scope: (min-width:768) and (min-height:601) and (orientation:landscape) → escritorio,
+   laptop y tableta EN HORIZONTAL de más de 600 de alto (la tableta vertical va al traje A
+   ×f, TAB-1 1d). NO solapa con portrait ni con B (max-height:600). 2 y 3 jug no se tocan. */
@@ -1153 +1153 @@
-/* ── Móvil vertical (<768px) — Tanda C4.2 ────────────────────────────────────
+/* ── Vertical (traje A) — Tanda C4.2 · TAB-1 1d ─────────────────────────────
@@ -1157,3 +1157,3 @@
-   la mesa → cero impacto en desktop (≥768px) ni en otras pantallas. El mazo
-   (Pie) sigue anclado a su asiento, como en desktop — no se reubica (eso exigiría
-   tocar la lógica de vuelo).
+   la mesa → cero impacto en horizontal (escritorio, laptop, teléfono acostado) ni en
+   otras pantallas. El mazo (Pie) sigue anclado a su asiento, como en desktop — no se
+   reubica (eso exigiría tocar la lógica de vuelo).
@@ -1161,4 +1161,4 @@
-   que filtraba a teléfonos pequeños EN HORIZONTAL (ancho <768 en landscape) y les
-   imponía el layout vertical. Con esta condición el bloque vertical es exclusivo
-   de portrait y el nuevo bloque landscape (abajo) gobierna el horizontal. El
-   comportamiento en portrait queda idéntico (misma regla, condición más estrecha). */
+   que filtraba a teléfonos pequeños EN HORIZONTAL y les imponía el layout vertical.
+   TAB-1 1d (Protegidos v1.7 §7.5): sin el max-width, el traje A vale para TODA ventana
+   vertical; de 600 de lado corto en adelante lo amplía escala.css (data-escala="tv").
+   El horizontal lo gobierna el bloque landscape (abajo); `hb` es TAB-2 (escala.css). */
```

**La vara del §4, medida:**

| Prueba | Resultado |
|---|---|
| Líneas | 6.289 antes y 6.289 después. Las 11 líneas cambiadas (3 + 1 + 3 + 4) están dentro de los dos rangos (los cuatro bloques del diff) |
| `gameTable.css` sin comentarios (quitados con `/\*[\s\S]*?\*/`), antes (`HEAD`) y después | **idéntico al byte**: `sha256` `844124febd60dd2ab3056094b77c3fdc5734963f8b63eabfd13b79526c3e3b20` en los dos |
| Cada rango sigue siendo un solo comentario | abre en 1119 y 1153 y cierra en 1129 y 1164 (lo comprueba el guion que los escribió) |
| Finales de línea | LF, 0 `\r`; escrito en bytes, sin pasar por el editor |
| Huella antes (`abc2ebc`) | blob `6eedfa949259` · `sha256` `e97a1565c29bc5a6ebb846d65bfdb6770de05e48f9f67210cc93479a28103a4b` |
| Huella después | blob `87c9cb519bdb` · `sha256` `9b6b716f23ade19aaf0a6941efbc3c2bc219b4eca9cbf451dda9181c5ac47306` |

**Protegidos v1.8:** cabecera con la actualización, la fila de `gameTable.css` de la §3 re-medida (blob, `sha256` de 16 y líneas, «abierto en» con TAB-2 2c) y la §7.6 nueva con la autorización, los rangos, el motivo, la vara y las dos huellas. `scripts/testProtegidos.test.js`: 8/8.

---

## 4. Las varas

### 4.1 Punto de control (tras la 2b), 16:04 → 16:21

Árbol de ese momento: 2b entera más el núcleo de la 2c (la clase `hb` sin hoja), que no actúa en ninguna de estas varas. V-borde en su versión de esa hora: solo las celdas `h`.

| Prueba | Resultado |
|---|---|
| vitest | 71/71 archivos · **1.677** pruebas (la primera corrida, «71 failed, no tests», H-7) |
| build | correcto |
| lint | 21 en el árbol con seguimiento, los de la base (H-7) |
| V-cel (frente a `--ref`, la base en el 4192) | pares **25/25** (16 idénticos al píxel, el resto equivalentes) · T3 **88/88** byte a byte |
| V-fuera (frente a `--ref`) | **12/12** pantallas (11 idénticas al píxel) · entrar y salir 3/3 |
| V-h | **24/24** |
| V-tv | **48/48** |
| V-borde (`h`, 6 tamaños × 2 mesas × 2 tapetes) | **24/24**, después de corregir el instrumento (H-4) |

**Todo verde:** la 2c siguió sin parar.

### 4.2 Las varas nuevas sobre el árbol completo

**V-borde, 40/40.** 10 tamaños × mesas 2 y 5 × verde y tricolor (el peor de las cuatro celdas de cada tamaño):

| Tamaño | Clase · f | Franja | Costura (mediana · máx.) | Deriva frente a hoy |
|---|---|---|---|---|
| 1366×623 | `h` · 0,874 | 0 | 0,70 · 1,00 | 0,27 |
| 1920×929 | `h` · 1,119 | 0 | 0,68 · 0,97 | 0,24 |
| 3440×1290 | `h` · 1,3 | 0 | 0,51 · 0,86 | 0,58 |
| 1133×716 (táctil) | `h` · 1 | 0 | no aplica (el borde antiguo a 3,5 px) | **0** |
| 1180×820 (táctil) | `h` · 1 | 0 | 0,83 · 0,95 | **0** |
| 3840×1960 | `h` · 1,3 | 0 | 0,68 · 1,15 | 0,58 |
| 1280×577 | `hb` · 1 | 0 | 0,86 · 0,94 | **0** |
| 1242×566 | `hb` · 1 | 0 | 0,81 · 0,92 | **0** |
| 1093×498 | `hb` · 1 | 0 | no aplica | **0** |
| 1024×600 | `hb` · 1 | 0 | no aplica | **0** |

**V-hb, 48/48.** 4 ventanas × mesas 5, 4, 3 y 2 × reposo, turno y resultado. En todas:
- clase `hb` con f = 1, y la pantalla sin desplazar;
- la frase a **10 px** en las mesas 3, 4 y 5 y a **12** en la de 2;
- **O1 al byte**: el óvalo y `.table-mid`, con la frase de `hb` y con la de 9 px;
- el turno con TURNO y cronómetro, y el resultado recortado con «…» (`data-voz2-recortada="1"`);
- deriva **0** frente a B (fuera de la frase) en las 16 celdas en reposo;
- la carta del jugador de 143 px, como en B.

Crónica (turno, mesas 3–5), las cuatro frases **dentro** del óvalo (sale 0):
- en las mesas 4 y 5: 2, 2, 2 y 1 líneas;
- en la de 3: una línea cada una.

**V-frontera, 16/16.**
- Los siete teléfonos, la trampa de 1030×420 táctil, el teléfono con ratón (1006×411, `hover: hover` y `pointer: fine` comprobados en la página) y los dos iPad en ventana quedan **sin atributo**, sin escrituras, y con su fila **byte a byte** igual a la de hoy.
- El Fold interior es `h`.
- Las cuatro laptops son `hb`.

### 4.3 Los controles rojos

| Control | Cómo | Resultado |
|---|---|---|
| V-borde sin M2b | `TAB_CONTROL=sin-m2b`: la sonda devuelve la jaula a la mesa (especificidad 1,1,2, sin `!important`) | **ROJO, 0/40.** Franja de 191 · 330 · 988 · 1.188 px en `h`, de 77 y 58 en `hb`, de 4 en 1133×716 y de **1 px** en 1093 y 1024 (el borde de `#root`, que es justo lo que la 2a enseñó a buscar). Costura de mediana 4,3–16,3 donde aplica |
| V-hb con la frase a 12 | `TAB_CONTROL=frase12` | **ROJO, 40/48.** Las 8 celdas de turno de las mesas 4 y 5: «La IA sube a 1000. ¿Qué haces?» y «La IA apuesta 1000. ¿Qué haces?» hacen 3 líneas y salen **4,5 px** del óvalo, la cifra de la 2a |
| V-frontera con el umbral a 1.000 | Una copia del árbol (scratchpad `umbral1000\`) con `ANCHO_HB = 1000` en el PRODUCTO, compilada y servida en el 4195; `diagDSK tab frontera --servidor=externo` | **ROJO, 15/16.** El teléfono con ratón (1006×411) recibe `hb`, con 2 escrituras y su fila distinta de hoy |

### 4.4 Verde final (todo, sobre el árbol completo)

Corrida de 16:28 a 16:53, en este orden y sin tocar `src/` entre medias. Cada modo compila su `dist/` del árbol completo.

| Prueba | Resultado |
|---|---|
| vitest | 71/71 archivos · **1.680** pruebas (> 1.654) |
| lint | 21 en el árbol con seguimiento (≤ 21), los mismos de la base; el 22.º es la lámina sin seguimiento (H-7) |
| build | correcta |
| `diagDSK tab --ref=http://localhost:4192` | **VERDE**, código 0, 1.112 s, aislamiento verde. Las seis varas de siempre: V-cel 25/25 pares (17 idénticos al píxel) y T3 88/88 byte a byte · V-fuera 12/12 (12 idénticas al píxel) y entrar y salir 3/3 · V-h 24/24 · V-tv 48/48 · V-vuelo, cartas y monedas a ≤ 0,02 px y globo a ≤ 0,02 · V-giro 2/2. Las tres nuevas: V-borde 40/40 · V-hb 48/48 · V-frontera 16/16 |
| `diagDSK tam` | **VERDE**, código 0 |
| `diagDSK retar` | **VERDE**, código 0 |
| `diagDSK webkit` | **VERDE**, código 0 |
| Huellas | cinco protegidos **idénticos** a los del arranque. `gameTable.css` cambia **solo en comentarios** (§3): `9b6b716f23ade19a…`, 6.289 líneas |

`--ref` es un `vite preview` de `abc2ebc` (copia por `git archive` en el scratchpad, `refabc\`), levantado a mano en el 4192, como en TAB-1.

---

## 5. Mapa archivo → commit propuesto

El orden de la ficha. Comprobado en una copia de `HEAD` (`git archive`, en el scratchpad) a la que se sumaron los archivos de cada commit en orden: **los cinco pasan vitest y build cada uno por su cuenta.**

| Paso | vitest | build |
|---|---|---|
| `HEAD` (`abc2ebc`) | 71/71 archivos · 1.653 + 1 omitida (1.654) | — |
| + commit 1 | 71/71 · 1.676 + 1 (1.677) | correcto |
| + commit 2 | 71/71 · 1.676 + 1 (1.677) | correcto |
| + commit 3 | 71/71 · 1.676 + 1 (1.677) | correcto |
| + commit 4 | 71/71 · 1.679 + 1 (1.680) | correcto |
| + commit 5 | 71/71 · 1.679 + 1 (1.680) | correcto |

La copia necesita los `.env` del proyecto: sin ellos fallan 8 pruebas de `dist/` y no cargan 4 archivos de la billetera y el video, en `HEAD` igual que en cada paso. Es del entorno de la copia, no de los commits.

| # | Commit propuesto | Archivos | Por qué así |
|---|---|---|---|
| 1 | **TAB-2c: la clase `hb` con la doble llave** | `src/lib/escala.js` · `src/lib/escala.test.js` | El núcleo puro con su prueba. Solo, escribe `hb` en las laptops bajas sin hoja que lo lea: las reglas generales de `escala.css` valen lo mismo con f = 1 (medido: 0,00 px), así que la mesa queda como hoy salvo en pantalla completa, que arregla el commit 2 |
| 2 | **TAB-2b/2c: la mesa hasta los bordes y la frase de `hb`** | `src/styles/escala.css` | M2b y el radial acotado (§6, `h` y `hb`), la frase de `hb` (§7) y la pantalla completa de §4 acotada a `h` (H-1). `src/styles/escala.test.js` (sin cambios) la lee entera |
| 3 | **TAB-2: dos comentarios de `gameTable.css` (Protegidos v1.8)** | `src/styles/gameTable.css` · `docs/AJILEI_Protegidos_v1.0.md` | La huella se re-mide en el mismo commit que el archivo (Protegidos §5): `scripts/testProtegidos.test.js` es rojo si van separados |
| 4 | **TAB-2d: V-borde, V-hb y V-frontera; INV-60 a INV-62** | `scripts/tab/tab.mjs` · `scripts/tab/ref/t2_geometria.json` · `docs/AJILEI_Invariantes_v1.0.md` | El registro cita `scripts/tab/ref/t2_geometria.json` y Protegidos §7.6, que ya existen en este punto (`scripts/testInvariantes.test.js` comprueba cada cita) |
| 5 | **TAB-2: informes de la Fase 0, la 2a y la 2b–2d** | `docs/reportes/AJILEI_TAB-2_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_TAB-2_Fase2a_Lamina_Informe_v1.0.md` · `docs/reportes/AJILEI_TAB-2_Fase2b-2d_Informe_v1.0.md` | Ningún invariante cita los informes de TAB-2, a propósito: así el commit 4 no depende del 5 |

**No se commitea:** `laminas/tab2/` (decisión de la ficha), ni los ajenos que ya estaban (`docs/reportes/AJILEI_MOT-1_*` × 2 y `laminas/mon1/`).

---

## 6. Preguntas al rector

1. **¿Se ratifica H-1?** Las tres reglas de pantalla completa de TAB-1 pasan de `[data-escala]` a `[data-escala="h"]`. Para `h` y `tv` es el mismo comportamiento (`tv` no existe en horizontal) y protege el traje B de `hb`. **Recomiendo ratificarlo:** sin ello, una laptop baja con ratón en pantalla completa (el ⋮ lo permite) perdería 30 px de alto de mesa.
2. **¿Se ratifica H-3?** El radio acotado sigue a la ventana por debajo de 1.126 px propios (`min(562px, 50vw/f − 1px)`), en vez del 562 fijo de la lámina. **Recomiendo ratificarlo:** es la definición de la variante c («el radial con el tamaño de hoy»), y de 1.126 en adelante es idéntico a lo que vio Victor.
3. **INV-62 queda parcial:** que `gameTable.css` sin comentarios no cambió se midió una vez (§3), y ninguna prueba lo repite. La huella de la §3 ya caza cualquier cambio del archivo, comentario o no. **Recomiendo no añadir otra prueba:** solo distinguiría «comentario» de «código» en una apertura futura, y esa la mide su propia ficha.
4. **La crónica de V-hb** mide las cuatro frases de la 2a, más largas que las reales de las mesas 3–5 (H-8). **Recomiendo dejarla así** (es la vara del lado seguro) y, si la crónica cambia sus plantillas, medir de nuevo con `cronica_nombres.mjs` como molde.
5. **Para anotar, sin pregunta:**
   - el rótulo del pozo y la nota del comodín siguen a 8 px en B (decisión 5);
   - el iPad con trackpad es un riesgo conocido para la sesión con tester (decisión 6; escrito en INV-61);
   - el lienzo blanco de `html` sigue pendiente para ARN-4 (decisión 7 de la 2a). Con M2b no se ve en la mesa: V-borde da franja 0 en todas las celdas.

---

## 7. Cierre

**Procesos y puertos:** 0 `node.exe` vivos. 4173, 4174, 4191, 4192, 4195, 5173 y 5174 libres. Los `vite preview` de 4192 (la base) y 4195 (el umbral a 1.000) se pararon por su PID (salida 127, esperada); el 4173 lo levanta y lo apaga `diagDSK` en su proceso. No se usó el servidor de desarrollo.

**En el proyecto, sin commits ni `git add`:**
```
 M docs/AJILEI_Invariantes_v1.0.md          INV-60 a INV-62, recuento, §6
 M docs/AJILEI_Protegidos_v1.0.md           v1.8: fila de §3 y §7.6
 M scripts/tab/tab.mjs                      V-borde, V-hb, V-frontera, sellarT2
 M src/lib/escala.js                        la clase hb
 M src/lib/escala.test.js                   23 casos nuevos
 M src/styles/escala.css                    §4 acotada a h, §6 bordes, §7 hb
 M src/styles/gameTable.css                 SOLO dos comentarios (§3)
?? scripts/tab/ref/t2_geometria.json        la geometría de antes, sellada
?? docs/reportes/AJILEI_TAB-2_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-2_Fase2a_Lamina_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-2_Fase2b-2d_Informe_v1.0.md   (este)
?? laminas/tab2/                            la lámina (no se commitea)
?? docs/reportes/AJILEI_MOT-1_*  ×2, laminas/mon1/ ×3   ajenos, de antes
```
`capturas-dsk/` y `dist/` los regeneró el arnés; están ignorados.

**En el scratchpad** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\d970e55e-5c62-4e74-a6db-a1fdf923456f\scratchpad\`):
- **Sondas y guiones:**
  - `sellar_t2.mjs`, `respaldo_hypot.mjs` (H-2), `foto_borde.mjs` y `q_linea.mjs` (H-4), `cronica_nombres.mjs` (H-8);
  - `comentarios.py` (§3), `invariantes.py`, `t2_parche.py`, `t2_bloque.mjs.txt` e `informe_relleno.py`;
  - `commits_uno_a_uno.sh` y `commits_uno_a_uno2.sh` (§5).
- **Registros:** `pc_*.json/log` (punto de control), `c2_tab.*`, `rojo_*.*`, `final*.log/json`, `t2_sello1.json` y `t2_sello2.json`, y `fb_1180_*.png`.
- **Copias con unión `node_modules`** → `C:\Users\victo\OneDrive\Documents\ajilei\node_modules`. ⚠ **Quita cada unión con `rmdir` antes de borrar su carpeta**; un borrado recursivo atravesaría la unión y vaciaría el `node_modules` del proyecto:
  - `refabc\node_modules` (la base `abc2ebc` para `--ref` y el sello);
  - `umbral1000\node_modules` (el control rojo de V-frontera);
  - `commits\node_modules` y `commits2\node_modules` (la comprobación de los commits; `commits2` lleva copia de `.env.local`);
  - y la de la Fase 0, `ref9fef\node_modules`, intacta.

---

## 8. Guía para la prueba de Victor

Para pegar tal cual. Lo que se prueba:
- que los lados de la mesa se llenen con la oscuridad del tapete, sin línea;
- que una ventana baja con ratón (clase `hb`) lleve la mesa del teléfono acostado con la frase un poco mayor y los lados llenos;
- que el teléfono NO cambie.

**Cómo se llega a `hb` en tu monitor.** La ventana maximizada mide 1920×929. Con el zoom de Chrome la ventana «se encoge» para la página: a 150 % mide 1280×619 (más de 600 de alto: sigue siendo `h`), y a **175 % mide 1097×531**, que ya es una ventana baja de más de 1.024 de ancho: **`hb`**. A 200 % mediría 960×464 (menos de 1.024 de ancho): vuelve a ser el traje B de hoy. Desde el 100 %, **Ctrl + cuatro veces** (110 → 125 → 150 → 175).

```
PRUEBA DE TAB-2 (la mesa hasta los bordes y las ventanas bajas)

PREPARAR (en la PC, carpeta ajilei). Unos 2 minutos.
 1. Terminal 1:  npm run build
      Espera ~1 minuto, hasta que diga «built in ...».
 2. Terminal 1:  npx vite preview --host
      Déjala abierta. Dirección en la PC: http://localhost:4173
 3. Terminal 2 (solo para la laptop y el S25):
      npx cloudflared tunnel --url http://localhost:4173
      Espera 10-20 segundos. Copia la dirección https://....trycloudflare.com
      que aparece en un recuadro. La primera carga por el túnel tarda
      5-10 segundos; si se queda en blanco más de 30 segundos, recarga una vez.

A · MONITOR DE TU PC, por http://localhost:4173 (SIN túnel). 8 min.
    Chrome maximizado y el zoom en 100 % (Ctrl + 0 si no lo sabes).
 1. Entra con tu cuenta. Retar → mesa de 5 → «Sentarme a la mesa».
    Espera 2-3 s a que salga la mesa.
    DEBES VER: la mesa del mismo tamaño que ayer, en el centro, y los
    LADOS llenos de verde oscuro con la filigrana hasta el borde de la
    pantalla. NINGUNA línea vertical donde antes acababa la mesa, ni
    franja más oscura pegada al borde.
 2. Sal (✕ → «Abandonar mesa») y repite con la mesa de 2: lo mismo.
 3. Cambia el tapete a TRICOLOR (⋮ → Tapetes) y vuelve a la mesa de 5.
    DEBES VER: las tres bandas (amarillo, azul, rojo) de borde a borde,
    oscureciéndose hacia los lados, sin línea.
 4. Vuelve a ponerte el tapete VERDE.

B · LA CLASE hb EN EL MONITOR (el «teléfono acostado» con ratón). 5 min.
 1. Con la mesa de 5 abierta, pulsa Ctrl + cuatro veces, mirando el
    número que sale arriba a la derecha: 110 %, 125 %, 150 %, 175 %.
    En cada paso la mesa se reacomoda (1-2 s).
    DEBES VER a 175 %: la mesa del teléfono acostado (cartas grandes en
    una fila abajo, rivales arriba, el óvalo en medio), SIN desplazar, con
    los lados llenos de verde oscuro hasta el borde. La frase del óvalo
    («Iniciar mano», «La IA sube a…») un poco mayor que en el teléfono.
 2. «Iniciar mano» y juega una mano entera. Cuando una IA suba, lee la
    frase del óvalo: debe caber DENTRO del óvalo (dos líneas como mucho).
 3. Repite con la mesa de 2 (la frase ya era grande; no cambia).
 4. Ctrl + 0: vuelves al 100 % y a la mesa de A.

C · LAPTOP HP, por el túnel. 6 min.
 1. Chrome maximizado, zoom 100 %. Abre la dirección del túnel. Mesa de 5.
    DEBES VER: la mesa como ayer (×0,87, sin desplazar) y los lados
    llenos de oscuridad, sin línea.
 2. Ctrl + una vez: 110 %. Espera 1-2 s.
    DEBES VER: la mesa del teléfono acostado con los lados llenos, sin
    desplazar, la frase del óvalo un poco mayor. Juega un turno.
 3. Ctrl + 0.

D · S25, por el túnel. 4 min.
 1. Mesa de 5 en vertical y luego gira a horizontal; después mesa de 2
    en las dos orientaciones.
    DEBES VER: EXACTAMENTE la mesa de hoy. Nada más grande ni más
    pequeño, nada movido, la frase igual.

DEJARLO TODO COMO ESTABA. 1 min.
 1. En cada Chrome que tocaste (PC y laptop): Ctrl + 0 con la mesa o la
    página del túnel abierta (Chrome recuerda el zoom por dirección).
 2. Ctrl+C en las dos terminales. Si pregunta «¿Desea terminar el trabajo
    por lotes (S/N)?», escribe S y Enter.
```

| Lo que ves | Qué significa | Qué haces |
|---|---|---|
| Todo como dice arriba | La tanda funciona | Avísale al rector: «TAB-2 bien» → ficha de commits |
| Una línea vertical clara u oscura donde antes acababa la mesa | Queda costura (no la vio el arnés) | Foto a pantalla completa + qué tapete |
| Una franja negra fina pegada a un borde | Queda franja | Foto con zoom de Windows (Win + «+») sobre el borde |
| A 175 % la mesa no cambia de traje (sigue la de escritorio) | La ventana no bajó de 600 de alto: quizá hay barra de marcadores o descargas | Mira el número de zoom; prueba un Ctrl + más (200 %): a 200 % debe salir el traje B de hoy |
| A 175 % hay barra de desplazamiento | El traje B no cabe en esa ventana | Foto + dime el zoom |
| La frase del óvalo se sale del óvalo | La vara de 10 px no basta con esa frase | Foto con la frase leída en voz alta (cuál era) |
| Laptop a 110 %: sale la mesa de escritorio | El touchpad no cuenta como ratón para Chrome en esa máquina | Dime si la laptop tiene pantalla táctil |
| S25: algo cambió, por poco que sea | Rompe la regla del celular | Foto de hoy (ajilei.io) y la del túnel, lado a lado |

---

## 9. Validación física

**Victor validó la tanda el 2026-10-23**, con la guía del §8. Todo salió bien:

| Aparato | Prueba | Resultado |
|---|---|---|
| PC con monitor, por `localhost:4173` sin túnel | **A:** los bordes en las mesas de 5 y 2, con verde y tricolor | Bien |
| PC con monitor | **B:** la clase `hb` con el zoom de Chrome al 175 % | Bien |
| Laptop HP, por túnel | al 100 % (clase `h`) y al 110 % (clase `hb`) | Bien |
| S25, por túnel | mesas de 5 y 2 en vertical y en horizontal | Bien, idénticas a hoy |

---

## 10. Resoluciones del rector

Ficha de commits v1.0, a las preguntas del §6:

| # | Resolución |
|---|---|
| 1 | **H-1, ratificado:** la pantalla completa de §4 de `escala.css` queda solo para `[data-escala="h"]` |
| 2 | **H-3, ratificado:** el radio acotado sigue a la ventana por debajo de 1.126 px propios |
| 3 | **INV-62, sin prueba nueva:** basta la huella de Protegidos |
| 4 | **La crónica de V-hb se queda** con las cuatro frases de la 2a, el lado seguro. Si cambian las plantillas, se mide de nuevo con `cronica_nombres.mjs` como molde |
| 5 | **Anotados por el rector para la lista de pendientes:** la letra de 8 px del pozo y del comodín en B; el iPad con trackpad; el lienzo blanco de `html`, para ARN-4; y el falso «71 failed» de vitest en la primera corrida, como una prueba más de T3 en ARN-4 |
