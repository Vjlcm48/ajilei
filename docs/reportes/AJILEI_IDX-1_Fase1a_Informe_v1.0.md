# AJILEI · IDX-1 · Fase 1a · Informe v1.0

**Ficha:** `AJILEI_IDX-1_Fase1a_v1.0.md` (2026-09-25) · **Fecha:** 2026-09-25 · **Base:** `5311a32` (main)
**Ejecución:** Claude Code · sin commits · **Lámina de referencia:** `laminas/idx1/AJILEI_IDX1_lamina_v1.2.html`

---

## Resumen

El generador `scripts/gen-idx.mjs` produce las 40 cartas con el índice nuevo en `capturas-idx/`, junto con `informe.json` y `hoja.html`. Los maestros no se modifican.

**Estados de las 40 cartas:**

| Estado | Cartas |
|---|---|
| ok | **24** |
| encogida | **15** (factor entre 0,88 y 0,99) |
| necesita decisión | **0** (ninguna llegó al suelo de 0,85) |
| borrado incompleto | **1**: el 4 de oros, que es un falso positivo por el oro de sus monedas (§3) |

**Lo que el rector tiene que saber antes de mirar la hoja:**

1. **La ficha y la lámina no colocan el número igual.** La ficha (D-7 y §3.7.3) pide el borde derecho de la *tinta* en x = 976. La lámina lo tiene en x = 976 menos el apoyo lateral derecho del glifo, que es lo que da `textAlign: 'right'` sobre la *caja de avance*. Lo medí en sus seis cartas: el número acaba 10–15 px antes de 976, y en el 11, 41 px antes. Seguí **la lámina**, por tres razones: es lo que Victor aprobó viendo las cartas, la ficha exige que las cartas coincidan con ella (§5.3), y solo así salen las holguras de referencia que la propia ficha da (§3.5 y §3.6). La lectura literal queda disponible con `--anclaje=tinta`, y sus cifras van en la tabla. **Cambia el recuento: 24/15 con el anclaje de la lámina frente a 31/8 con la tinta en 976.** Ver §2 y la pregunta 1.
2. **Queda una diferencia sistemática de ≈ 2 px con las holguras de la lámina.** El 7 de copas se queda en 0,96 (18,7 px); la lámina pone 0,94 (19,9 px). El 4 de oros queda en 27,3 px; la lámina, 25,5 px. Sigo la máscara del dibujo tal como la define §3.4. La diferencia cuadra con que la lámina midiera contra el dibujo dilatado 2 px. Ver la pregunta 4.
3. **Reproducibilidad:** cuatro corridas completas. Las tres últimas son idénticas al byte. La primera difería en **un solo píxel** de una carta: `uno_espada`, en (865,116), en el borde del «1», **1 nivel sobre 255**. Edge 153.0.4234.48. Ver §4.

---

## 1 · Tareas previas

| Tarea | Resultado |
|---|---|
| ¿IDX-1 está libre? | `git grep -i "IDX-?1"`: **0 coincidencias** en archivos rastreados y 0 en commits (`git log --all`). Solo aparece en `laminas/idx1/`, sin rastrear, que es la lámina de esta misma campaña. No hubo que parar |
| Renombrar el informe de la Fase 0 | `docs/reportes/AJILEI_CAR-1_Fase0_Informe_v1.0.md` → `AJILEI_IDX-1_Fase0_Informe_v1.0.md`, con la línea «Campaña renombrada IDX-1 el 2026-09-25 (CAR-1 ya existía)» bajo el título. Ningún otro cambio |
| Fuente | `scripts/fonts/RobotoCondensed-wght.ttf` (371 616 B, variable con eje `wght`) y `scripts/fonts/OFL.txt` (SIL OFL 1.1), bajados de `github.com/google/fonts` (`ofl/robotocondensed/`). El generador la carga con `FontFace` desde el origen ficticio; **la página aborta cualquier petición a la red** |
| `.gitignore` | Una línea: `capturas-idx/` |

## 2 · El generador

**Archivos:**

| Archivo | Contenido |
|---|---|
| `scripts/idx/idxCore.mjs` | Módulo puro: tablas, colores, alturas, cajas, factores, estados, y las operaciones de píxel (aplanar, borrar, máscaras, transformada de distancia euclídea exacta, dilatación, componentes, relleno de huecos). Lo importan tanto Vitest como la página de Edge, así que se prueba la misma regla que se ejecuta |
| `scripts/idx/idxPagina.mjs` | La parte que necesita el navegador: decodificar, rasterizar Roboto Condensed, remuestrear, codificar PNG y WebP |
| `scripts/idx/pagina.html` | La página vacía donde se monta |
| `scripts/gen-idx.mjs` | Lanza Edge, sirve los archivos por `page.route`, recorre las 40, escribe la salida y compone la hoja |

**Uso:** `node scripts/gen-idx.mjs` (las 40 y la hoja), `node scripts/gen-idx.mjs siete_copa …` (solo esas cartas, sin hoja), `--anclaje=tinta` (lectura literal de D-7).

**Una corrida completa tarda ≈ 70 s.** La salida es `maestros/` con 40 PNG de 1055×1491, `informe.json` y `hoja.html` (6,35 MB). En total, 37 MB en `capturas-idx/`.

**Cómo se aplicó cada punto de §3:**

- **§3.2 Aplanar:** tal cual, con desviación ≤ 12 en x 54–1000 × y 71–1419. Cambia entre 1 424 y 528 024 píxeles por carta (mediana 5 355). El máximo es `siete_basto`, que tiene el parche ruidoso más grande. Las estrellas no cambian: están a más de 12 de la crema.
- **§3.3 Borrar:** tal cual. Las 80 cajas del código coinciden una a una con la medición de la Fase 0; lo compruebo contra sus datos brutos y con una prueba de la simetría de 180°. El margen es de 3 px, y de 2 px en el índice inferior del 4 de oros.
- **§3.4 Holgura:** la máscara del dibujo es la de la ficha (desviación > 18 en x 60–995 × y 78–1300). La máscara del número es el render sin contorno, con toda su tinta (alfa > 0). La distancia se calcula con una transformada de distancia euclídea exacta (Felzenszwalb) desde el número, entre centros de píxel.
- **§3.5 Encoger:** tal cual, salvo una ampliación que explico abajo. Dilato 2 px, borro con crema y vuelvo a pegar escalado en torno al centro de la caja con `imageSmoothingQuality = 'high'`, bajando de 0,99 en 0,01 hasta 0,85.
- **§3.6 4 de oros:** tal cual. Salen **exactamente 4 componentes de más de 50 000 px**, las monedas, de 76 609 a 76 744 px cada una. Se rellenan huecos (2 a 8 px por moneda), se dilatan 2 px y se colocan a 0,84 con su centro x en 527 ∓ (8 + r) (387,1 y 667,3), la y conservada y 16 px entre monedas.
- **§3.7 Número:** el cuerpo se ajusta **por la tinta** (render a 1000 px, altura de la tinta con cobertura ≥ 50 %, y escala). Resultado: tinta de 238–239 px en el 1–7 (objetivo 238,6) y de 178 px en el 10–12 (objetivo 178,9). La tinta empieza en **y = 93** en las 40. Primero `strokeText` en crema con `lineWidth = 18` y `lineJoin = 'round'`, luego `fillText` con el color del palo. La colocación es una traslación entera del raster: lo que se mide es exactamente lo que se pinta.

**Desviaciones de la ficha**, cada una anotada en el código donde ocurre:

| # | Qué dice la ficha | Qué hace el generador | Por qué |
|---|---|---|---|
| V-1 | D-7 y §3.7.3: tinta derecha en **x = 976** | Borde de la **caja de avance** en x = 976, es decir tinta en 976 − apoyo lateral: 965 en el 2, 4, 5, 6, 7 y 10; 960 en el 3; 967 en el 12; **937 en el 11**; **923 en el 1** | Es lo que tiene la lámina, medido en sus seis cartas: acaban a 11,7 / 13,3 / 15,0 / 11,7 / **41,3** / 10,0 px de 976, contra los apoyos de la fuente de 11,5 / 11,2 / 11,5 / 11,1 / **39,2** / 8,8. Solo así salen las holguras de referencia de §3.5 y §3.6. La lectura literal sigue disponible con `--anclaje=tinta` |
| V-2 | §3.5.1: encoger «la máscara del dibujo» (la de §3.4, cortada en **y = 1300**) | Para **medir**, la de §3.4 tal cual. Para **encoger**, la misma prolongada hasta y = 1416 **y sin las estrellas** (por color, dentro de su caja) | En 12 cartas el dibujo baja de 1300 (hasta 1356 en el 1 de bastos). Encogiendo con el corte, el trozo de abajo se quedaría quieto y la figura se partiría. Entre las 15 encogidas afecta a `doce_oro` (157 px bajo 1300), `tres_espada` (48) y `uno_espada` (858). Comprobado a resolución completa: los pies del 12 de oros salen enteros y sin costura |

## 3 · El borrado incompleto del 4 de oros

- **Qué atrapó §3.3:** 13 píxeles «rojizos» en el anillo del índice superior, en x 856–857 × y 246–253. Por ejemplo `rgb(236,190,51)` y `rgb(247,204,81)`: son el **canto dorado de la moneda de arriba a la derecha**, a 6 px del «4» viejo (la Fase 0 ya lo había medido). El oro cumple R > G + 40 y R > B + 40.
- **Diagnóstico añadido** (en `informe.json` y en la hoja, sin cambiar el estado):
  - **0 de los 13 tienen el color del número viejo**, es decir, ninguno está en la mezcla crema → #CF142B.
  - En la carta final, con las monedas ya movidas, **el anillo tiene 0 píxeles rojizos**.
- Mantengo el estado `borrado-incompleto` porque es lo que dice la ficha y es lo más conservador. Lo decide el rector (pregunta 2).
- En las otras 39 cartas el anillo sale limpio en los dos índices, incluidas las que la Fase 0 señaló por tener el dibujo cerca: `once_copa`, `cinco_oro`, `diez_espada` y `siete_copa`.

## 4 · Reproducibilidad

| Corrida | Frente a la anterior |
|---|---|
| 1 | — |
| 2 | 39 de 40 PNG iguales al byte. **`uno_espada` difiere en 1 píxel**, en (865,116), por 1 nivel |
| 3 | **40/40 iguales** a la 2 |
| 4 | **40/40 iguales** a la 3 (y la misma diferencia de 1 píxel frente a la 1) |

Todas con Edge **153.0.4234.48**, registrado en `informe.json` en cada corrida. El píxel cae en el borde antialiasado del «1», donde se juntan contorno y relleno, así que la variación sale del rasterizador de texto de Edge y no del algoritmo, que es determinista. Por qué ocurre solo en la primera corrida de la sesión no está aislado. **No es idempotente al byte garantizado**, a diferencia de `gen-cards.mjs`, que no rasteriza texto: la diferencia máxima medida es de 1 píxel en 63 millones, por 1/255 (pregunta 5).

## 5 · Comparación con la lámina (§5.3)

Comparé las seis cartas de la lámina con las generadas, a 640 px, lado a lado y midiendo la tinta del número.

| Carta | Tamaño y posición | Color | Dibujo |
|---|---|---|---|
| 4 de oros | Igual. Borde derecho 966 frente a 964 (±1,6 px de muestreo) | Igual | Monedas al 84 %, simétricas: igual a la vista |
| 6 de espadas | Igual (966 frente a 963) | Igual | Sin tocar en los dos |
| **7 de copas** | Igual (966 frente a 961) | Igual | **Al 96 %; la lámina, al 94 %.** Las copas quedan un pelo más grandes. Es la diferencia de ≈ 2 px del resumen |
| 10 de bastos | Mismo borde derecho. **La cifra de la lámina es ≈ 5 px más alta** (≈ 184 frente a 178) | Igual | Sin tocar |
| 11 de copas | Igual (938 frente a 935) | Igual | Sin tocar |
| 12 de espadas | Igual (968 frente a 966). La lámina, ≈ 5 px más alta | Igual | Sin tocar |

- **Diferencias visibles: ninguna**, salvo el 94/96 % del 7 de copas, que se nota solo lado a lado.
- **En las figuras, las cifras de la lámina miden ≈ 184 px (12,3 %), no 178,9.** Sigo D-6 (12 %). A 45 px de ancho de pantalla son 0,2 px.

## 6 · Las 40 cartas

La holgura se mide en px del maestro y la regla es ≥ 18. «Tinta» es la caja del número pintado. La última columna es la lectura literal de D-7 (`--anclaje=tinta`), solo para comparar; **no** es lo que hay en `capturas-idx/`.

| Carta | Holgura antes | Holgura después | Factor | Estado | Tinta del número (x0,y0–x1,y1) | Variante «tinta en 976» |
|---|---|---|---|---|---|---|
| 1 de Oros | 36,2 px | 36,2 px | 1 (sin tocar) | ok | 836,93–923,331 | 1 (sin tocar) · ok |
| 2 de Oros | 106,4 px | 106,4 px | 1 (sin tocar) | ok | 826,93–965,331 | 1 (sin tocar) · ok |
| 3 de Oros | 207,6 px | 207,6 px | 1 (sin tocar) | ok | 826,93–960,330 | 1 (sin tocar) · ok |
| 4 de Oros | 0 px | 27,3 px | monedas 0,84 | **borrado incompleto** (ver §3) | 818,93–965,331 | monedas 0,84 · borrado-incompleto |
| 5 de Oros | 0 px | 22,5 px | 0,88 | encogida | 831,93–965,330 | 0,90 · encogida |
| 6 de Oros | 12 px | 22 px | 0,98 | encogida | 831,93–965,330 | 1 (sin tocar) · ok |
| 7 de Oros | 19,2 px | 19,2 px | 1 (sin tocar) | ok | 824,93–965,331 | 1 (sin tocar) · ok |
| 10 de Oros | 124 px | 124 px | 1 (sin tocar) | ok | 751,93–965,270 | 1 (sin tocar) · ok |
| 11 de Oros | 105 px | 105 px | 1 (sin tocar) | ok | 745,93–937,270 | 1 (sin tocar) · ok |
| 12 de Oros | 17 px | 19 px | 0,99 | encogida | 747,93–967,270 | 1 (sin tocar) · ok |
| 1 de Copas | 36 px | 36 px | 1 (sin tocar) | ok | 836,93–923,331 | 1 (sin tocar) · ok |
| 2 de Copas | 154 px | 154 px | 1 (sin tocar) | ok | 826,93–965,331 | 1 (sin tocar) · ok |
| 3 de Copas | 149,9 px | 149,9 px | 1 (sin tocar) | ok | 826,93–960,330 | 1 (sin tocar) · ok |
| 4 de Copas | 0 px | 20,6 px | 0,89 | encogida | 818,93–965,331 | 0,90 · encogida |
| 5 de Copas | 0 px | 18 px | 0,89 | encogida | 831,93–965,330 | 0,93 · encogida |
| 6 de Copas | 15 px | 18 px | 0,99 | encogida | 831,93–965,330 | 1 (sin tocar) · ok |
| 7 de Copas | 7,6 px | 18,7 px | 0,96 | encogida | 824,93–965,331 | 1 (sin tocar) · ok |
| 10 de Copas | 46 px | 46 px | 1 (sin tocar) | ok | 751,93–965,270 | 1 (sin tocar) · ok |
| 11 de Copas | 83,8 px | 83,8 px | 1 (sin tocar) | ok | 745,93–937,270 | 1 (sin tocar) · ok |
| 12 de Copas | 110,4 px | 110,4 px | 1 (sin tocar) | ok | 747,93–967,270 | 1 (sin tocar) · ok |
| 1 de Espadas | 0 px | 259,2 px | 0,99 | encogida | 836,93–923,331 | 1 (sin tocar) · ok |
| 2 de Espadas | 115 px | 115 px | 1 (sin tocar) | ok | 826,93–965,331 | 1 (sin tocar) · ok |
| 3 de Espadas | 11,3 px | 21,3 px | 0,98 | encogida | 826,93–960,330 | 1 (sin tocar) · ok |
| 4 de Espadas | 0 px | 18 px | 0,90 | encogida | 818,93–965,331 | 0,90 · encogida |
| 5 de Espadas | 104 px | 104 px | 1 (sin tocar) | ok | 831,93–965,330 | 1 (sin tocar) · ok |
| 6 de Espadas | 26,8 px | 26,8 px | 1 (sin tocar) | ok | 831,93–965,330 | 1 (sin tocar) · ok |
| 7 de Espadas | 50 px | 50 px | 1 (sin tocar) | ok | 824,93–965,331 | 1 (sin tocar) · ok |
| 10 de Espadas | 133,8 px | 133,8 px | 1 (sin tocar) | ok | 751,93–965,270 | 1 (sin tocar) · ok |
| 11 de Espadas | 125,9 px | 125,9 px | 1 (sin tocar) | ok | 745,93–937,270 | 1 (sin tocar) · ok |
| 12 de Espadas | 113,7 px | 113,7 px | 1 (sin tocar) | ok | 747,93–967,270 | 1 (sin tocar) · ok |
| 1 de Bastos | 323,3 px | 323,3 px | 1 (sin tocar) | ok | 836,93–923,331 | 1 (sin tocar) · ok |
| 2 de Bastos | 44 px | 44 px | 1 (sin tocar) | ok | 826,93–965,331 | 1 (sin tocar) · ok |
| 3 de Bastos | 7,3 px | 19 px | 0,93 | encogida | 826,93–960,330 | 1 (sin tocar) · ok |
| 4 de Bastos | 0 px | 23,3 px | 0,88 | encogida | 818,93–965,331 | 0,91 · encogida |
| 5 de Bastos | 0 px | 18,4 px | 0,89 | encogida | 831,93–965,330 | 0,91 · encogida |
| 6 de Bastos | 0 px | 19,9 px | 0,94 | encogida | 831,93–965,330 | 0,96 · encogida |
| 7 de Bastos | 3,6 px | 20,4 px | 0,91 | encogida | 824,93–965,331 | 0,96 · encogida |
| 10 de Bastos | 110 px | 110 px | 1 (sin tocar) | ok | 751,93–965,270 | 1 (sin tocar) · ok |
| 11 de Bastos | 25 px | 25 px | 1 (sin tocar) | ok | 745,93–937,270 | 1 (sin tocar) · ok |
| 12 de Bastos | 128 px | 128 px | 1 (sin tocar) | ok | 747,93–967,270 | 1 (sin tocar) · ok |

**Recuento con el anclaje de la lámina:** 24 ok, 15 encogidas, 1 con borrado incompleto. **Con la tinta en 976:** 31 ok, 8 encogidas, 1 con borrado incompleto. Ninguna de las dos variantes deja una carta por debajo de 0,85.

**`uno_espada` (0,99):** la encoge **un solo píxel suelto** de antialias en (860,128), con `rgb(237,217,217)`, que la Fase 0 ya había aislado (§B.6, nota de la tabla). Con el anclaje de la lámina, el «1» (53 px de apoyo) queda encima de ese píxel, la holgura inicial sale 0 y la regla encoge el dibujo al 99 %. Después de encoger, la holgura salta a 259 px porque el píxel se diluye al remuestrear. A la vista no cambia nada, pero la carta cuenta como encogida por un píxel (pregunta 3).

## 7 · La hoja de contacto

`capturas-idx/hoja.html`, autocontenida, de 6,35 MB, con 280 imágenes WebP q80 embebidas:

1. **Arriba, el resumen:** las cuatro cifras de estado y la lista «Para revisar», ordenada con el borrado incompleto primero, luego las que necesitan decisión y luego las encogidas por holgura. El 4 de oros lleva el diagnóstico del anillo.
2. **Las 40 hoy y nuevas, por palo, a 45, 56 y 66,4 px** de ancho CSS explícito, con `width=device-width, initial-scale=1`. «Hoy» son **los derivados que el juego sirve de verdad** (`src/assets/cards/webp/`, solo leídos); «nueva» es el mismo derivado (320 px, q80), hecho con el mismo método que `gen-cards.mjs`.
3. **Las 40 nuevas a 240 px** (fuente de 640 px, para pantallas de alta densidad), con el factor, la holgura y el estado debajo.

Comprobada en Edge a 412×915 con DPR 2,625 y modo móvil: 280 imágenes y **ninguna rota**; el ancho del documento es 412 (sin desplazamiento horizontal de la página; las franjas se desplazan dentro de su fieltro, como en la lámina).

## 8 · Línea base

| Qué | Cifra |
|---|---|
| `npm test` | **35 archivos · 988 pruebas · 988 aprobadas** (963 anteriores + **25 nuevas** en `scripts/testIdxCore.test.js`) |
| `npx eslint .` | **21 problemas (20 errores, 1 aviso)**, los mismos que la línea base. Los archivos nuevos no tienen ninguno |
| Protegidos (Protegidos v1.5 §3) | Los seis blobs sin cambios: `gameEngine.js` `21c4d3f56318`, `aiPlayer.js` `8cfc3736cba2`, `deck.js` `eb61426083ca`, `seatLayouts.js` `0d1bb8ea66a8`, `opponentPanel.css` `3ce6383eec0d`, `gameTable.css` `1e21371c8543` |

**Qué cubren las pruebas nuevas:**
- La tabla de rango → texto y altura (sin 8 ni 9).
- Palo → color, y que ninguno sea el oro de marca.
- Las 40 cartas, cada una una sola vez.
- Las cajas de borrado con sus márgenes, incluido el 4 de oros, y la simetría de 180°.
- La verificación del anillo, el criterio rojizo y el diagnóstico de color.
- Los factores (15, de 0,99 a 0,85) y la prioridad de los estados.
- La geometría de las monedas: 16 px entre ellas y simetría.
- El anclaje.
- Aplanar, las máscaras, la transformada de distancia (valores exactos), la holgura, la dilatación, las componentes y el relleno de huecos.

---

## 9 · Riesgos

1. **Anclaje.** Si el rector confirma la lectura literal de D-7, cambian 7 cartas (de encogidas a ok) y todos los números se mueven entre 8,8 y 53 px a la derecha. No hace falta rehacer nada: es `--anclaje=tinta` o cambiar `ANCLAJE_POR_DEFECTO`.
2. **El «1» y el «11» quedan descolgados.** Con el anclaje de la lámina, la tinta del 1 acaba en x = 923 y la del 11 en x = 937, frente a 960–967 en los demás. En la franja de 45 px, el «1» queda ≈ 2 px más a la izquierda que el resto de los números. La causa es que las cifras de Roboto Condensed son tabulares (todas con el mismo avance), y el canvas no ofrece cifras proporcionales. En la lámina no había ningún «1» sencillo, así que Victor no lo ha visto.
3. **Un píxel suelto basta para encoger una carta** (`uno_espada`). La regla no filtra el ruido, y cualquier otro píxel suelto del arte podría hacer lo mismo con otro anclaje.
4. **Reproducibilidad no garantizada al byte** (§4), y seguirá dependiendo de la versión de Edge, como todo lo que rasteriza este proyecto. Para la Fase 1b hay que decidir si una diferencia de ±1 en un píxel cuenta como «igual».
5. **El aplanado toca el arte, no solo el fondo.** Todo píxel a ≤ 12 de la crema dentro del marco pasa a ser crema exacta, lo que incluye brillos muy claros del dibujo, si los hay. No se ve nada a la vista, pero en `siete_basto` el aplanado cambia 528 024 píxeles, casi todos del parche ruidoso.
6. **`capturas-idx/` es la única salida y está ignorada por git.** Nada de esto llega al juego hasta la Fase 1b, que tendrá que decidir de dónde salen los WebP servidos sin tocar los maestros (D-2).

## 10 · Preguntas al rector

1. **Anclaje del número: ¿el de la lámina (caja de avance en 976, lo aplicado) o el literal de D-7 (tinta en 976)?** Con el de la lámina el 1 y el 11 quedan más a la izquierda que el resto (riesgo 2).
2. **4 de oros:** ¿se da por bueno el borrado, visto el diagnóstico (0 píxeles con color de número y anillo limpio en la carta final)? ¿Y se cambia la regla de §3.3 para no contar el oro, o para verificar sobre la carta final?
3. **¿Se ignoran los píxeles sueltos** (por ejemplo, componentes de menos de 10 px) al medir la holgura? Hoy solo afecta a `uno_espada` (0,99 → 1).
4. **¿Se mide como la ficha (lo aplicado) o como la lámina** (dibujo dilatado 2 px, que coincide con sus referencias)? Con la de la lámina, el 7 de copas pasaría a 0,94 y previsiblemente algunas encogidas bajarían uno o dos puntos más.
5. **Reproducibilidad:** ¿es suficiente una diferencia de ≤ 1/255 en ≤ 1 píxel para la Fase 1b, o hay que buscar un rasterizado determinista (Edge sin GPU u otras banderas) y medirlo?
6. **Figuras:** ¿12 % exacto (lo aplicado, 178 px) o el ≈ 12,3 % que tienen de hecho las cartas de la lámina (≈ 184 px)?
7. **Para la Fase 1b:** ¿los WebP servidos los genera `gen-cards.mjs` llamando a la lógica IDX en memoria desde los maestros (sin PNG nuevos en el repositorio, fiel a D-2), o se guardan en el repositorio los 40 PNG con índice como segundo maestro?

## 11 · Estimación para la Fase 1b

**120–180 min de Claude Code**, repartidos así:

| Tarea | Minutos |
|---|---|
| Integrar el índice en la cadena de derivados según la respuesta a la pregunta 7 | 40–60 |
| Regenerar `webp/` y `portada/` con el techo de peso (el contorno y el número añaden algo de peso) | 20 |
| Capturas del arnés en los 5 viewports × 2 vías, incluida la **revelación de perdedoras** (D-15) | 40–60 |
| Pruebas, lint y verificación de que el `alt` no cambia (el arnés lee por `alt`) | 20–40 |

Las tres capturas de D-14 (`mesav`, `mesapc`, `og-image`) quedan fuera de esta cifra, como pide la ficha.

---

**Confirmaciones:**

- **Sin commits.**
- **Protegidos intactos:** los seis blobs coinciden (§8).
- **Ni una escritura** en `src/`, en los maestros ni en los derivados.
- **Lo nuevo en el árbol es solo lo permitido:**
  - `scripts/gen-idx.mjs`
  - `scripts/idx/` (`idxCore.mjs`, `idxPagina.mjs`, `pagina.html`)
  - `scripts/fonts/` (TTF + OFL)
  - `scripts/testIdxCore.test.js`
  - una línea en `.gitignore`
  - el informe de la Fase 0 renombrado y este informe
- **Sin dependencias nuevas.**
- La salida vive en `capturas-idx/` (ignorada), y las sondas y comparaciones, en la carpeta temporal de la sesión.

**STOP.** Victor revisa `capturas-idx/hoja.html` en el teléfono antes de la Fase 1b.
