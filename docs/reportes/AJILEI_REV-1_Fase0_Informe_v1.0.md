# AJILEI · REV-1 · Reverso único
## Fase 0 · Informe de diagnóstico · v1.0

**Fecha:** 2026-09-25 · **Ejecuta:** Claude Code · **Rector:** Claude (chat) · **Decide:** Victor
**Ficha:** `AJILEI_REV-1_Fase0_v1.0.md` · **Base:** `main` en `808b580` · **Solo lectura:** sin commits ni `git add`; no se tocó ningún archivo de `src/`, `scripts/` ni `.gitignore`

---

## Resumen

**Hay un solo archivo de reverso.** Es `src/assets/cards/reverso_carta.svg` (6 994 B, md5 `6ff98a5428e272a35cc3dab22c13ff94`) y todos los lugares de la mesa lo pintan. La nota 2 del §12 acierta en lo esencial: un solo SVG y dos rutas de pintado.

Lo que Victor ve se explica por dos causas medidas. Ninguna es un segundo diseño:

1. **Encaje (b).** El SVG tiene proporción 910:1420 = **0,641**, y su propio comentario declara que soporta el recorte `cover` hasta **0,693**. En escritorio y en S25 horizontal, la caja de las cartas del humano tiene la proporción de las caras de la baraja, 1055:1491 = **0,699–0,708**. Con `cover`, el dibujo se escala al ancho y **pierde el 8–9 % del alto**: los broches de arriba y abajo quedan fuera, el marco toca el filo y el isotipo se ve más grande. La carta voladora que va hacia el humano hereda esa misma caja.
2. **Escala (c) más capas (d) en el mazo.**
   - **Escala:** en mesa 2 de escritorio, el mazo mide la mitad de una carta (`--dsk-deck-w: calc(var(--card-w) / 2 - 2px)`, `gameTable.css:4691`), así que las 8 estrellas miden **2,0 px** de ancho, frente a 4,2 px en la IA de al lado. A DPR 1 cada estrella se dibuja como un cuadradito de 2 px y la fila se lee como un **arco punteado**. El laboratorio lo reproduce con el archivo solo, sin la mesa.
   - **Capas:** el borde dorado al 45 % del mazo se pinta sobre fieltro verde, porque el fondo del mazo es `transparent`. En la carta de la IA, ese mismo borde se pinta sobre el campo `#41101c`. Por eso el anillo del mazo sale verdoso-oliva y el de la IA, marrón.

| Lugar | Archivo | Ruta | Δ (Δ contenido) contra el canónico | Causa | Arreglo propuesto (Fase 1) |
|---|---|---|---|---|---|
| IA · `opp-panel` (m5, m2 s25h) | `reverso_carta.svg?no-inline` | `<img>` `object-fit: cover` (inline, `PlayingCard.jsx:9`) | 0 (canónico) · 12,5–15,4 (9,7–13,2) en móvil · **m2 s25h: 20,9 (16,5)** | Igual al canónico (solo tamaño). **m2 s25h: (b)**, caja de 0,707 | La regla de `contain` del humano la cubre |
| IA · `.ai-zone` (m2 pc, m2 vertical) | ídem | ídem | 6,3–13,2 (**3,0**–6,3) | Igual al canónico (control) | — |
| Humano boca abajo, escritorio y S25 horizontal | ídem | ídem | **20,6–21,0 (15,6–16,6)** | **(b)** caja de 0,699–0,700: recorta el 8,3 % del alto | `object-fit: contain` en `.card-back > img` (tiras de campo a los lados) |
| Humano boca abajo, vertical | ídem | ídem | 9,1–10,6 (6,0–10,4) | Igual al canónico (solo tamaño) | — |
| Mazo (`.deck-pile`, `.opp-deck`, variantes D) | `reverso_carta.svg` (url en CSS, emitido con hash, no incrustado) | `background` `center / cover no-repeat` (`gameTable.css:642`) | 11,4–20,6 (7,1–17,2) | **(c)** escala: estrellas de 1,0–2,0 px · **(d)** borde sobre fieltro · sombra de pila (fuera del reverso) | `background-color: #41101c` para (d). Para (c) no hay arreglo CSS con Δ = 0 en la caja → **§K-2** |
| Carta voladora hacia el humano (escritorio y S25 horizontal) | ídem | `background` (`gameTable.css:664`) | **19,7–20,6 (16,5–17,2)** | **(b)** caja de 0,707–0,708 | `background-size: contain` + `background-color: #41101c` |
| Carta voladora, resto | ídem | ídem | 8,9–14,4 (5,2–10,0) | Igual al canónico (solo tamaño) | La misma regla (inocua a 0,641) |
| Abanico del barajado | ídem | `background` (`gameTable.css:1080`) | 16,3–28,8 (7,1–16,5) | Igual que el mazo: **(c) + (d)**, más su sombra 2px 4px 14px | Igual que el mazo |

*Δ es la diferencia media absoluta por canal (0–255) del recorte entero a DPR 3, reescalado a la altura del canónico. «Δ contenido» quita el borde de 2 px, que es lo que compara el dibujo. **Control** (el mismo dibujo con el mismo encaje, a otro tamaño): Δ contenido entre 3,0 y 13,2. La métrica a DPR 3 separa bien la causa (b) (15,6–17,2) del control, pero **no separa la (c)**: la escala solo se ve a DPR 1 (§C).*

**Hoja:** `capturas-rev/hoja.html`. Mide 4,8 MB, es autocontenida y está pensada para el teléfono. Su bloque 1 es el caso de Victor, mesa 2 de escritorio a DPR 1, píxel a píxel.

---

## §0 · Línea base

| Punto | Esperado | Medido |
|---|---|---|
| `HEAD` | `808b580` | `808b580ea9d6a8c7923b318aa820903eabc4da19` ✔ |
| `git status --short` | residuos conocidos | Los 6 `??` conocidos: 2 informes MOT-1, `laminas/mon1/` ×3 y `scripts/_cel1bFila.mjs` ✔. Al terminar se suma solo `capturas-rev/` y este informe. |
| Pruebas | 993 | 35 archivos, **993 passed** ✔ |
| Lint | 20 errores y 1 aviso | **21 problemas (20 errores, 1 aviso)** ✔ |
| `gate` | 6/6 | **No se corrió.** La fase no toca `src/` y el árbol es `808b580` sin cambios, así que es el `gate` 6/6 que selló LUZ-1d. Si el rector lo quiere en vivo, es `node scripts/diagDSK.mjs gate` (~2 min). |
| Protegidos | 6 | `gameEngine.js`, `aiPlayer.js` y `deck.js` **no se abrieron**. `gameTable.css` y `opponentPanel.css` se leyeron para citarlos. `seatLayouts.js` no hizo falta. No se editó ninguno. |
| Navegador | — | Edge **153.0.4234.48** con playwright-core 1.62.1. Servidor: Vite 8.0.14 en 5173 con `VITE_AUTH_BYPASS=1` (el del modo `luz`). |

---

## §A · Inventario de reversos dentro de la mesa

Todos los lugares usan el mismo archivo y el mismo borde, `2px solid rgba(232,184,75,0.45)`, con `border-radius: 8px`. No hay `filter` en ningún antepasado y la `opacity` propia es 1 en todos.

| # | Lugar | Dibuja | Ruta | Archivo | Encaje (archivo:línea) | Fondo bajo el dibujo | Capas propias |
|---|---|---|---|---|---|---|---|
| A1 | IA, vía `opp-panel` | `OpponentPanel.jsx` → `PlayingCard faceDown` (`GameTable.jsx:1583–1598`) → `PlayingCard.jsx:8–9` | `<img>` | `reverso_carta.svg?no-inline` (`PlayingCard.jsx:3`) | `object-fit: cover`, `object-position: 50% 50%`, **en `style` inline** (`PlayingCard.jsx:9`) · caja: `.opp-card-slot` `--opp-card-w/h` (`opponentPanel.css:116–119`, `:170–173`) | `.card-back { background: #41101c }` (`playingCard.css:50–53`) | Solape −0,35 (`opponentPanel.css:122`). `turn-dimmed` → opacidad efectiva **0,8** fuera de turno. Sombra de contacto de LUZ (`luz.css:204`) en móvil; en escritorio va a 0. |
| A2 | IA, vía `.ai-zone` (mesa 2, salvo S25 horizontal) | `GameTable.jsx:1702–1705` → `renderOpponentCard` | `<img>` | ídem | ídem · caja `.card-slot-wrapper` `--card-w/h` (`gameTable.css:630–634`) | ídem | `turn-dimmed` 0,8 igual que A1 |
| A3 | Humano boca abajo: reparto de las cartas 3–5 (`DEAL_3`, `GameTable.jsx:1628–1634`) y reposición tras el descarte hasta que se revela (`:1616–1617`) | `renderPlayerCards` → `PlayingCard faceDown` | `<img>` | ídem | ídem · caja `--card-w: calc(var(--card-h) * 1055 / 1491)` (`gameTable.css:2894`), la **proporción de las caras** | ídem | — |
| A4 | Mazo `.deck-pile` (centro en 3/4/5 y mesa 2 móvil; `player-zone`/`ai-zone` en mesa 2 escritorio) | `GameTable.jsx:1705`, `:2092` | `background` | `url('../assets/cards/reverso_carta.svg')` (`gameTable.css:642`) | `center / cover no-repeat` (`gameTable.css:642`) · caja D: `--dsk-deck-w/h = card/2 − 2px` (`gameTable.css:4691–4702`) | **`transparent`**: el shorthand `background:` resetea el color y el borde al 45 % deja ver el fieltro | Sombra de pila: `box-shadow` 2/4/6 px vinotinto (`gameTable.css:643–647`), reescrita por `luz.css:218–245`. **No es parte del reverso** y queda fuera del border-box recortado. |
| A5 | Mazo `.opp-deck` (asiento Pie en 3/4/5 y mesa 2 S25 horizontal) | `OpponentPanel.jsx:121` | `background` | ídem (hereda `.deck-pile`) | ídem · caja `--opp-card-w/h` (`opponentPanel.css:200–203`) y variantes `table-five` ×0,85 (`:216–218`), `gameTable.css:1656–1662`, `2245–2247`, `2545–2551`, `4229–4237` | `transparent` | Pila 1/2/3 px (`luz.css:226`) |
| A6 | Carta voladora `.flying-card` (reparto mazo→slot y vuelos del descarte) | `FlyingCard`, `GameTable.jsx:268–293` | `background` | `url(...)` (`gameTable.css:664`) | `center / cover no-repeat` · caja `--card-w/h` o `w/h` inline del slot de destino (`GameTable.jsx:283–284`) | `transparent` | `box-shadow: 2px 4px 14px rgba(0,0,0,.45)` (`gameTable.css:666`). Transform de traslación. |
| A7 | Abanico `.shuffle-fan-card` ×5 | `ShuffleDeck`, `GameTable.jsx:252–265` | `background` | `url(...)` (`gameTable.css:1080`) | `center / cover no-repeat` · `inset: 0` sobre la caja del mazo | `transparent` | `box-shadow: 2px 4px 14px`; `fanOut` gira ±11° y ±22° y sube 16 px (`gameTable.css:1082–1091`) |

No apareció ningún otro lugar dentro de la mesa. Revisé también la celebración, el zoom Z1 y el showdown: la ganadora muestra caras, y las retiradas siguen siendo A1/A2 con `faceDown`.

**Proporción de la caja de contenido frente al `viewBox` (0,6408), medida:**

| Lugar | pc 1920×1080 | S25 vertical | S25 horizontal | 390×844 | 360×640 |
|---|---|---|---|---|---|
| IA m5 (`opp`) | 50,05×78,09 = 0,641 | 35,6×55,7 = 0,638 | 45,2×70,7 = 0,640 | 33,2×52,0 = 0,638 | 30×47 = 0,638 |
| IA m2 | `ai-zone` 91×142 = 0,641 | `ai-zone` 61×95 = 0,642 | **`opp` 99,5×140,6 = 0,707** | `ai-zone` 61×95 = 0,642 | `ai-zone` 51×80 = 0,638 |
| Humano m5 | **111,3×159,0 = 0,700** | 66,4×103,4 = 0,642 | **95,5×136,6 = 0,699** | 62×96,6 = 0,642 | 56×87,8 = 0,638 |
| Humano m2 | **96,6×138,2 = 0,699** | 66,4×103,4 = 0,642 | **95,5×136,6 = 0,699** | 62×96,6 = 0,642 | 56×87,8 = 0,638 |
| Mazo m5 | 42,5×66,4 = 0,641 | 24,9×37,9 = 0,656 | 27×42 = 0,643 | 23,3×35,4 = 0,656 | 21×32 = 0,656 |
| Mazo m2 | 43,5×69 = 0,630 | 27×42 = 0,643 | 27×42 = 0,643 | 27×42 = 0,643 | 27×42 = 0,643 |
| Voladora (vuelo capturado) | m5 **115,3×163,0 = 0,708** · m2 **100,6×142,2 = 0,708** | 66,4×103,4 = 0,642 | **99,5×140,6 = 0,707** | 62×96,6 = 0,642 | 56×87,8 = 0,638 |
| Abanico | = mazo | = mazo | = mazo | = mazo | = mazo |

En negrita, las cajas por encima del límite de 0,693 del SVG. Todas son de **orientación apaisada**, que es donde la carta humana toma la proporción de las caras.

## §B · ¿Uno o varios diseños?

1. **Búsqueda.** Por nombre (`reverso|back|dorso`), por referencias en código y CSS, y por contenido (`rvIso`, `rv_ajStar`, `Reverso AJILEI`, `Greca`) en `src/` y `public/`. **Un solo archivo vectorial:** `src/assets/cards/reverso_carta.svg`, 6 994 B, md5 `6ff98a5428e272a35cc3dab22c13ff94`. En `public/` no hay ningún reverso vectorial.
2. **Todos los lugares del §A usan ese archivo.** El `<img>` lo importa con `?no-inline` y el CSS con `url()`. En el build, Vite emite **un único** `assets/reverso_carta-DpY1CyS5.svg` (6 994 B), referenciado 3 veces desde el CSS y 1 desde el JS. No se incrusta en ninguna de las dos rutas porque supera el `assetsInlineLimit` por defecto de 4 096 B. Esto se comprobó en `dist/`, construido hoy a las 16:29.
3. **Historia.** `git log --follow` da un solo commit: `9945335` (2026-08-21, VIS-2b, «el reverso oficial R-2 "Greca" jubila al PNG provisional»). El archivo no ha cambiado desde entonces. **La nota 2 no está desactualizada** en lo que afirma; solo le faltan cosas (§J-1).
4. No hay diferencias de diseño entre archivos porque no hay dos. El «arco punteado» del mazo **son las mismas 8 estrellas del arco**, que tiene una flecha de 50 u: a 43,5 px de ancho, esa flecha queda en 2,4 px y cada estrella, de 41,8 u, en 2,0 px (§C).

## §C · La causa de cada diferencia

**Método.** Tres comparaciones por lugar, todas a DPR 3:
- **Δ contra el canónico:** el recorte real frente a la IA de m5 pc.
- **lab↔real:** el mismo SVG rasterizado solo, en una página en blanco, a la caja de contenido de ese lugar con `cover`, frente al recorte real sin su borde. Si el valor es bajo, lo que se ve es el archivo a ese tamaño y con ese encaje, sin nada más.
- **lab↔lab canónico:** el archivo a la caja del lugar frente al archivo a la caja canónica. Aísla lo que aportan la caja y el encaje por sí solos.

| Lugar | Categoría | Prueba |
|---|---|---|
| Humano apaisado (m5 pc, m2 pc, S25 horizontal) | **(b) encaje** | Proporción 0,699–0,700 > 0,693. `cover` escala por el ancho: 111,33/910 → alto 173,7 px en una caja de 159,0 px, así que se pierde el 8,5 % del alto (4,2 % arriba y 4,2 % abajo). El recorte muestra los broches cortados. **lab↔lab canónico = 15,8–17,1**, igual que el Δ real (15,6–16,6), y **lab↔real = 4,5–8,9**: el archivo solo, en esa caja, reproduce toda la diferencia. En la IA de m2 pc, con caja del mismo tamaño pero a 0,641, el Δ contenido es **3,0**. |
| Voladora hacia el humano | **(b) encaje** | Mismo mecanismo con 0,707–0,708: lab↔lab canónico 16,4–17,8, Δ real 16,5–17,2, lab↔real 3,9–6,7. |
| IA de m2 en S25 horizontal (`opp-panel`) | **(b) encaje** | Caja 99,5×140,6 = 0,707: Δ contenido 16,5, lab↔lab canónico 16,4. **En esa celda la IA tampoco se ve como el canónico** (§J-4). |
| Mazo (todas las celdas) | **(c) escala + (d) capas** | **(c)** El canónico mide 50 px de ancho en m5 pc, y ahí las estrellas son de 2,3 px, así que en mesa 5 el mazo y la IA casi coinciden (mazo m5 pc: 42,5 px, estrellas de 2,0 px). **En mesa 2 de escritorio la IA mide 91 px (estrellas de 4,2 px) y el mazo 43,5 px (2,0 px).** Prueba a DPR 1, en el bloque 1 de la hoja: la captura real `m2_pc_dpr1` muestra el mazo con la fila de estrellas convertida en cuadraditos de 2 px en arco, y la IA con estrellas de 5 puntas. El laboratorio `lab/svg_43.5x69_dpr1.png` frente a `lab/svg_91x142_dpr1.png`, con el archivo solo, **reproduce las dos cosas**. A DPR 3 el mazo todavía conserva estrellas legibles, así que la métrica del §D **no separa (c) del control** (mazo 7,1–17,2 frente a IA 3,0–13,2). La escala es una diferencia de lectura a DPR 1–1,5, no de dibujo. **(d)** El borde al 45 % sobre fondo transparente deja ver el fieltro: el anillo sale oliva y no marrón. Se ve en el Δ entero frente al Δ contenido (m2 pc: 11,35 frente a 9,34; m2 móvil: 16,7 frente a 7,1). La sombra de pila (`box-shadow`) queda fuera de la caja: **no es parte del reverso** y no entra en la cifra. |
| Abanico | **(c) + (d)** | Misma caja que el mazo (recorte a 0 ms, las cinco a 0°). Suma la sombra 2px 4px 14px. A 975 ms la caja girada mide 0,84–0,86, pero es el bounding box de una carta rotada, no un encaje. |
| IA fuera de turno | **(d)** | `.opp-panel/.ai-zone.turn-dimmed` → opacidad efectiva 0,8, también sobre el mazo anclado a esa IA. Es un estado de juego y no afecta al diseño del reverso. |
| Humano en vertical, IA restante y voladora a 0,64 | igual | Δ contenido 5,2–13,2, dentro del control; lab↔lab canónico 1,1–11,2, y es solo tamaño. |

## §D · Medición objetiva

- **Canónico:** `recortes/m5_pc_reparto_ia_opp.png`, la IA de mesa 5 a 1920×1080 dentro de `opp-card-slot`, con DPR 3, border-box de 54,05×82,09 y opacidad efectiva 1. Se tomó en el estado «reparto» y no en «reposo» porque en reposo la IA lleva `turn-dimmed` (0,8). Se eligió la instancia más expuesta: la última de su fila, sin solape por encima.
- **Recortes:** border-box de cada lugar a DPR 3, reescalado a la altura del canónico (246 px) con suavizado alto. Cuando la proporción difiere se compara la franja central común; `recorteB` va de 0 a 14 px (en el JSON).
- **Métrica:** media de |Δ| por canal RGB (0–255). Los mapas guardan |Δ|×4 en gris: `mapas/<celda>_<lugar>.png` para el recorte entero y `…__cont.png` para el contenido.
- **Control** del solo cambio de tamaño: las IAS de las demás celdas, con el mismo dibujo y el mismo encaje. El rango es **3,0 (m2 pc, 91 px) – 13,2 (m5 S25 vertical, 35,6 px)** en Δ contenido. El control crece al encoger la caja, porque reescalar ×4–×7 un recorte pequeño lo emborrona.
- **Datos completos:** `capturas-rev/json/_comparacion.json`, con 50 filas: caja, contenido, proporción, ruta, encaje, borde, sombra, opacidad y las tres Δ.

**Congelación y estados** (azar sembrado con 20260925 tras llegar a la mesa, como en LUZ-1). Un `MutationObserver` detecta la primera aparición de cada estado y, en el mismo microtask, pone en pausa todas las animaciones de `document.getAnimations()`:

| Estado | Instante | Aparece a (desde «Iniciar mano») |
|---|---|---|
| Abanico | `fanOut` de 1 950 ms: foto a **975 ms** (meseta), recorte a **0 ms** | 27–100 ms |
| Vuelo | transición de `transform` de la `.flying-card` (595 ms): **40 %** = 238 ms | 2 123–2 229 ms (primera voladora del reparto) |
| Reparto | primera `.player-zone .card-back`: pausa sin mover el reloj | 6,9–16,3 s |
| Reposo | turno de apuesta del humano, 5+ dorsos de IA y mazo a la vista: pausa tras 600 ms | — |

Los cuatro estados se congelaron en **las 10 celdas**. Al pausar, los temporizadores JS del juego siguen corriendo; por eso la foto se toma dentro de la ventana del estado y luego se reanuda con `play()`. La voladora del descarte no se capturó por separado: es el mismo componente `FlyingCard` con la misma regla, y lo que cambia es la caja de destino, que ya cubre la del reparto (slot humano o de IA).

## §E · Fuera de la mesa (solo inventario)

| Pantalla | Dónde | Archivo | Encaje | ¿Coincide con el canónico? |
|---|---|---|---|---|
| Portada · abanico | `Portada.jsx:420`, `portada.css:172–178` | `reverso_carta.svg` (import normal, mismo asset emitido) | `<img>` con `aspect-ratio: 910/1420` | **Sí**: la caja tiene la proporción exacta |
| Portada · mano que se voltea | `Portada.jsx:430`, `portada.css:276–277`, `296–307` | ídem | `object-fit: cover` en `.pue-carta` de proporción **1055/1491 = 0,708** | **No**: el mismo recorte (b) que el humano |
| Portada · trío | `Portada.jsx:460`, `portada.css:378–380` | ídem | `aspect-ratio: 910/1420` | **Sí** |
| Sala de espera · mazo | `SalaEspera.jsx:3`, `:550–552`, `salas.css:~1000–1022` | `reverso_carta.svg?no-inline` | `object-fit: cover` en caja de `aspect-ratio: 2/3` = 0,667, `border-radius: 8%` | Casi: 0,667 < 0,693, recorta un 4 % del alto sin perder los broches |
| `og-image.jpg` (`public/`, 109 974 B, md5 `59b4621e…`) | meta OG | captura **rasterizada** de una mesa de 5 | — | Contiene el diseño actual a tamaño pequeño; las estrellas ya se ven como puntos. No se actualiza sola si cambia el SVG. |
| `portada/mesapc.webp` y `mesav.webp` | `Portada.jsx:16–17` | capturas rasterizadas (PUE-1.3, `3b8c55e`) | — | Ídem |
| Tutorial o partida guiada | — | no hay componentes con reverso propio | — | — |

## §F · Propuesta para la Fase 1

**Principio.** El dibujo tiene que verse **entero** en todas las cajas, como en la IA. No se toca ninguna caja (Δ = 0). No se sustituye ningún `url()`: el archivo ya es el correcto. Solo cambian el encaje y el fondo.

1. **Humano boca abajo, más la IA de m2 en S25 horizontal (A1–A3).**
   - **Obstáculo:** el `object-fit: cover` está en `style` inline (`PlayingCard.jsx:9`). Ninguna hoja CSS lo vence sin `!important`, así que **hay que tocar el JSX**. `PlayingCard.jsx` no está protegido.
   - **Propuesta:** quitar `objectFit` del inline, dejando `width`, `height` y `display`, y declarar en la hoja nueva `.game-table-screen .card-back > img { object-fit: contain; }`, con especificidad (0,2,1).
   - **Qué se pierde con `contain`:** en las cajas de 0,70 aparecen **dos tiras verticales de ~4,2 % del ancho**, unos 4–5 px por lado a 100–115 px. Las pinta el fondo `#41101c` de `.card-back`, así que son del color del campo pero **sin la raya diplomática**, y el marco queda algo más separado del borde en horizontal que en la IA. En las cajas de 0,638–0,642 la diferencia es inferior a 0,3 px, prácticamente nula.
   - **Alternativas:** `cover` con otra `object-position` no sirve, porque solo reparte el recorte. `fill` deforma el dibujo un 9 %. **Una variante del SVG** con lienzo de 1055×1491, campo y raya extendidos y el mismo marco centrado daría el resultado exacto, sin tiras. **Sería un archivo nuevo: se señala y no se crea** (§K-1).
2. **Carta voladora (A6):** `.game-table-screen .flying-card { background-size: contain; background-color: #41101c; }`, con especificidad (0,2,0) frente a (0,1,0) de `gameTable.css:657`. Tiene la misma pérdida que el punto 1 cuando va hacia el humano, y es inocua cuando va hacia la IA.
3. **Mazo y abanico (A4, A5, A7):**
   - **(d)** `.game-table-screen :is(.deck-pile, .shuffle-fan-card) { background-color: #41101c; }`. El anillo pasa a leerse como el de la IA. Las variantes D y `.opp-deck` no redeclaran `background` y quedan cubiertas. La sombra de pila de LUZ-1 (`luz.css:218–245`) es `box-shadow`, otra propiedad: no se cruza.
   - **(c)** **No tiene arreglo CSS con Δ = 0.** Las opciones son:
     - (i) aceptarlo: en mesa 5 el canónico ya tiene estrellas de 2,3 px;
     - (ii) una variante «pequeña» del SVG con menos estrellas y más grandes, o sin la fila, para cajas de menos de 60 px de ancho: **archivo nuevo, se señala y no se crea**;
     - (iii) agrandar el mazo de escritorio, lo que reabre DSK A2 y rompe Δ = 0.

     Es una decisión del rector (§K-2).
4. **Dónde van las reglas.** Propongo una hoja propia, `src/styles/rev.css`, importada como **último** import de `GameTable.jsx`, justo después de `luz.css`. Seguiría el mismo precedente de hoja aditiva sin tocar las protegidas, pero no conviene mezclar campañas: `luz.css` tiene su propio modo del arnés, con una puerta de «hoja encendida y apagada», y meter aquí reglas de otra campaña la contaminaría. Tampoco hace falta referenciar el SVG: si en algún momento se usara la variante del punto 1, se importaría desde `src/assets/cards/` para que Vite le ponga hash, no desde `public/`.
5. **Riesgos:**
   - **Cargas:** no cambian. Se siguen emitiendo el mismo asset y los mismos dos `url()`.
   - **Animaciones:** reparto, vuelo y `fanOut` solo animan `transform`. `card-flip-anim` canjea el dorso por la cara a 90°, así que `contain` no se ve en ese instante.
   - **Vías y orientaciones:** hay que verificar las dos vías (`opp-panel` y `.ai-zone`) en las dos orientaciones. La IA de m2 en S25 horizontal (`opp-panel`, 0,707) **cambia de aspecto a propósito**.
   - **Selector:** la regla del `<img>` debe ir acotada a `.card-back > img` para no alcanzar las caras.
   - **Fuera de alcance:** la Portada (`.pue-dorso`) sufre el mismo recorte, pero queda fuera.
6. **Estimación de la Fase 1:** unos **60 min** de Claude Code. Son 15 para el JSX, la hoja y la verificación visual en las 10 celdas; 30 para el modo `rev`; y 15 para el informe y los commits.
7. **Modo permanente `rev` del arnés.** Mismas celdas y mismos estados que esta fase, con cuatro puertas por celda:
   - (1) **Δ = 0** en el border-box de cada lugar contra la línea base de `808b580`;
   - (2) **fracción visible del `viewBox` ≥ 0,999** en cada lugar. Es geométrica y exacta: se calcula con la proporción de la caja y el `object-fit` o `background-size` computado, y es la que de verdad discrimina la causa (b). Hoy fallan humano, voladora e IA de m2 en S25 horizontal, con 0,915–0,906;
   - (3) **fondo computado `#41101c`** en mazo, voladora y abanico;
   - (4) **Δ contenido contra el SVG rasterizado a su propia caja** (lab↔real) **≤ 12** a DPR 3. Hoy va de 2,2 a 11,3 en los recortes limpios, así que el umbral queda justo por encima del máximo observado. La comparación directa contra el canónico se conserva como informativa, porque su control llega a 13,2 y queda demasiado cerca de la (b), que empieza en 15,6, para ser una puerta.

   Además guarda las capturas de cada lugar.

---

## §J · Hallazgos y contradicciones

1. **La nota 2 del §12 es correcta pero incompleta.**
   - Hay un **tercer consumidor `<img>`**: `SalaEspera.jsx:3`, con `?no-inline`, que la nota no nombra.
   - Atribuye `gameTable.css` 642, 664 y 1080 a «mazo y carta voladora», pero la **1080 es el abanico** (`.shuffle-fan-card`). La ficha REV-1 sí lo dice bien.
   - Los números de línea siguen vigentes. El commit `9945335` citaba 1051 para el abanico, que hoy es 1080.
2. **El comentario del propio SVG** («sobrevive al recorte cover hasta ratio 0,693 (mazo movil)») no contempló las cajas humanas apaisadas, que tienen la proporción de las caras (0,699–0,708). El SVG se diseñó para la caja de 91:142 y la carta humana usa la de 1055:1491 desde CH-L2 (`gameTable.css:2894`).
3. **Primer frame de la voladora.** Congelada en el estado «reparto», una `.flying-card` recién creada tenía caja (104,6×146,2) pero no pintaba nada: se veía el mazo debajo, en `recortes/m2_pc_reparto_vuelo.png`. **No verifiqué** si pasa en tiempo real, donde sería un solo frame, ni si es un efecto de la pausa. Se anota como observación, sin afirmarlo.
4. **En mesa 2 con S25 horizontal, la IA (`opp-panel`, 99,5×140,6 = 0,707) tampoco se ve como el canónico:** sufre el mismo recorte (b) que el humano. La decisión de Victor («el diseño de las IAS») hay que leerla como «el dibujo completo de la IA de mesa 5», y el arreglo del punto 1 la cubre.
5. **`turn-dimmed`** atenúa a 0,8 los dorsos de las IAS fuera de turno y **también el mazo anclado a ellas**. Es un estado de juego, no del reverso, pero cualquier medición de reverso tomada en reposo sale atenuada. El modo `rev` debe medir con opacidad efectiva 1.
6. **Punto ciego del instrumento:** `elementFromPoint` ignora `pointer-events: none`. Ni la voladora, ni el abanico, ni el propio mazo cuentan como oclusores, y hubo que priorizar estados (mazo en «vuelo», IA en «reparto») para tener recortes limpios. El modo `rev` debe detectar la oclusión por intersección de cajas. Mi primer intento por esa vía tampoco atrapó el caso del mazo en «reparto», así que la puerta tiene que validarse.
7. **Residuos dentro de `capturas-rev/`.** El borrado de archivos quedó denegado en esta sesión (`rm`), así que la carpeta conserva los productos de una pasada de prueba descartada: 120 mapas con el estado en el nombre y ~145 PNG de laboratorio de la primera comparación. No los usa ni el JSON ni la hoja. Se pueden borrar sin riesgo.
8. **Deriva del navegador:** Edge 153.0.4234.48 frente a `chromiumBaselines` 151.0.4129.93 del arnés. Ya estaba anotada en DSK; aquí no afecta, porque se mide todo en la misma corrida.
9. **`og-image.jpg` y los `mesa*.webp` de la Portada** llevan el reverso horneado en raster. Si la Fase 1 cambia el aspecto del humano o del mazo, esas imágenes no se actualizan solas.

## §K · Preguntas al rector

1. **(Bloquea la Fase 1) Humano y voladora apaisados:** ¿`object-fit` / `background-size: contain`, con tiras lisas de campo de ~4–5 px por lado, o una **variante del SVG a 1055:1491** (archivo nuevo, raya y campo hasta el filo, resultado exacto)?
2. **(Bloquea la Fase 1) Mazo y abanico, escala (c):** ¿se acepta que a menos de 50 px las estrellas se lean como puntos (ya pasa en la IA de mesa 5) y solo se corrige (d), o se encarga una variante «pequeña» del reverso para esas cajas? Agrandar el mazo de escritorio rompería Δ = 0 y reabriría DSK A2.

---

### Comandos

```
node capturas-rev/capturaRev.mjs celdas 5,2                         # 10 celdas × 4 estados, DPR 3
REV_DPR=1 REV_SUF=_dpr1 node capturas-rev/capturaRev.mjs celdas 2 pc  # caso de Victor a DPR 1
REV_DPR=2 REV_SUF=_dpr2 node capturas-rev/capturaRev.mjs celdas 2 pc
node capturas-rev/capturaRev.mjs comparar                            # §D + laboratorio
node capturas-rev/capturaRev.mjs hoja                                # hoja.html
```
