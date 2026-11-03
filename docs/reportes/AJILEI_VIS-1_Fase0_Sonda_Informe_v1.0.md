# AJILEI · VIS-1 · Pulido visual corto · Fase 0 (STOP-0) · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Fecha:** 2026-11-02
**Ficha:** `AJILEI_VIS-1_v1.0.md` · **Punto de partida:** `main` en `3e6f606`
**Tipo:** sonda de solo lectura. Sin cambios en `src/`, `scripts/` ni configuración, sin commits. La única escritura en el repo es este informe. Lo de MOT-1 sin seguimiento no se tocó.

---

## 1. Resumen para Victor

Los cinco puntos caben en VIS-1 y ninguno abre un archivo protegido. Lo que queda fuera son hallazgos nuevos, listados en §8.

| Punto | Qué pasa de verdad | Propuesta | Tamaño |
|---|---|---|---|
| **P1** Botones de la victoria | «Salir» mide 28 y 33; «Ranking», 30 y 35. A INV-07 le basta una **zona de 40** en la mesa. Subir la caja a 44 en 1366×768 saca «Ranking» 13,39 px de la vista | Caja de 44 en vertical; en horizontal alto, solo zona de 44 | ~10 líneas de CSS y una puerta |
| **P2** Texto atenuado | Peor caso medido: **3,85** sobre vino y **3,97** sobre verde. **En el lobby mismo no hay ningún texto a α 0,55:** está en Salas, Retar, Armar, Perfil, Rankings, Tienda y Sala de espera | **α 0,65**, solo dentro de `.lobby` y `.sal` | ~3 líneas y una puerta |
| **P3** Texto al 64 % | **Nunca cae sobre el óvalo ni sobre el fieltro desnudo:** el 3,80 no se da. Pero ese texto se atenúa con su panel: **5,06 normal, 3,70 atenuado, 2,48 retirado** | Decide el rector (§4). Mi recomendación es subirlo a 0,75 | 1 número |
| **P4** Hilo azul | Es el **trazo del arco de las 8 estrellas**. Es intencional: Sistema de Diseño lo llama «la firma» | No tocarlo. Victor confirma que es ese hilo | 0 |
| **P5** Clic del sonido | `play` se pide con el sonido aún apagado y se descarta. **El contexto de audio no estaba suspendido** | Una línea en la fila de la hoja; probada con audio real | ~2 líneas y ampliar una puerta |

**Decisiones que hacen falta:** §9.

**Tres cosas de la ficha que no coinciden con lo medido:**
- **Las mesas de 2 a 7 no existen.** Son de 2 a 5 (`SEAT_LAYOUTS`, `src/config/salas.js:155`, y el `check` de la base). Medí esas cuatro.
- **El 3,90 no es «la parada más clara» del verde.** Es `--green-base` (`#1b482c`), lo más claro que tiene el fondo de esas pantallas. La parada `--green-bright` (`#235c38`, 3,23) es la del centro del óvalo y no está en el fondo de esas pantallas (`salas.css:157`).
- **«Es de todo el lobby» se queda corto y largo a la vez.** La pantalla del lobby tiene 0 textos a α 0,55, y el token llega también a la mesa y a la Portada.

---

## 2. P1 · Los botones de la victoria

**Dónde vive.** `src/components/Celebracion.jsx:401-415` y `src/styles/celebracion.css:191-218` y `:457-468`. La caja sale de `.btn` en `gameTable.css:487` y `:1931` (protegido, solo leído).

**Qué piso aplica.** La victoria vive dentro de `.game-table-screen`, así que le toca el de la mesa: **zona de 40 por eje, medida como zona y no como caja** (INV-07, Sistema de Diseño §14: «una caja de 28 con una zona transparente de 40 cumple»). El 44 del apaisado viene de CEL-2e, cuyo comentario lo llama «el mínimo de la casa», y es más de lo que pide INV-07.

**Qué mide hoy** (`?cel`, escala real, barrido con `elementFromPoint`):

| Ventana | Escala | Salir / Ranking (px) | Zona hoy, en alto | ¿Piso 40? |
|---|---|---|---|---|
| 360×640 | sin escala | 28 / 30 | 29 / 31 | **no** |
| 412×915 | sin escala | 28 / 30 | 29 / 31 | **no** |
| 915×412 | sin escala | 44 / 44 | 45 / 45 | sí |
| 1366×768 | `h` ×1 | 33 / 35 | 34 / 36 | **no** |
| 1920×1080 | `h` ×1,3 | 43,38 / 45,38 | 44 / 46 | sí, por la escala |
| 768×1024 | `tv` ×1,261 | 34,63 / 36,63 | 35 / 38 | **no** |
| 744×1133 | `tv` ×1,301 | 36,19 / 38,19 | sin barrido | **no** (por caja) |
| 1920×937 | `h` ×1,129 | 36,31 / 38,31 | sin barrido | **no** (por caja) |
| 1280×650 | `h` ×0,912 | 30,41 / 32,41 | 31 / fuera de vista | **no** |
| 1024×620 | `h` ×0,87 | 27,66 / 29,66 | 29 / fuera de vista | **no** |

- **Los dos botones no miden igual:** se llevan 2 px por el borde de 1 px de «Ranking». El 30 y el 35 de la ficha son los de «Ranking».
- **La escala sí importa:** `min-height: 44px` a ×1,3 da 57,19 px reales y a ×0,87 da 38,27. Hay que escribir `calc(44px / var(--escala, 1))`. Medido así: 44 / 44 a ×1,261 y a ×0,87.
- **El pendiente de RNK-1 queda explicado:** el arnés fuerza escala 1 (INV-59), así que esto nunca se había medido con factor distinto de 1.

**Cuánto crece.** La tarjeta (`.cel-tarjeta`) **no crece**: lo que crece es la columna, porque los botones van debajo.

| Ventana | Grupo de botones hoy → 40 → 44 | Fondo de «Ranking» hoy → 40 → 44 | Resultado con 44 |
|---|---|---|---|
| 360×640 | 72 → 94 → 102 | 608,61 → 630,61 → 638,61 (vista 640) | cabe con 1,39 de margen; el documento ya desplazaba 3 px y pasa a 33 |
| 412×915 | 72 → 94 → 102 | 733,66 → 744,66 → 748,66 | cabe; la tarjeta sube 15 px al recentrarse |
| 915×412 | 44, sin cambio | 373,19 | Δ = 0 |
| 1366×768 | 86 → 98 → 106 | 761,39 → 773,39 → 781,39 (vista 768) | **«Ranking» sale 13,39 px de la vista** (con 40, 5,39) |
| 1920×1080 | 112,14; con 44 reales, «Salir» pasa de 43,38 a 44 | 1015,39 → 1015,70 | cabe |

La frase más larga (`frase=4`) no cambia estos resultados: en 360×640 ya ocupa dos líneas, y en 412×915 baja la columna 12 px y sigue cabiendo.

**Variantes:**
- **V1 · Caja de 44 en todos los tamaños.** Es lo más parecido a la ficha, pero en 1366×768 hay que desplazar para ver «Ranking».
- **V2 · Caja de 40.** Cumple INV-07 justo, y 1366×768 también se sale, 5,39 px.
- **V3 · Solo zona de 44 con `::after`.** No se mueve ni un píxel. Medido: 45 / 45 en 1366×768. En vertical da 43 / 45 con el `::after` simétrico (las dos zonas chocan 1 px) y se arregla repartiéndolo. Los botones se siguen viendo igual de pequeños.
- **V4 · Mixta (mi recomendación).** En vertical, caja de 44 reales. En horizontal alto (`orientation: landscape` y `min-height: 601px`), caja intacta y zona de 44 reales. El apaisado bajo ya está en 44. Da el botón grande donde se toca con el dedo y deja 1366×768 sin desplazamiento.

**Archivos:** `celebracion.css`, no protegido. Gana a `.btn` por especificidad (0,2,0), como la regla existente de `:463`. **Sin apertura de protegidos.**

---

## 3. P2 · El texto atenuado

**De dónde sale.** Del token `--text-muted` (`src/styles/theme.css:81`): `rgba(245, 237, 216, 0.55)`. No hay copias literales: la búsqueda del valor solo da el token y un comentario de `luz.css`.

**Dónde se usa: 68 apariciones de `var(--text-muted)`.**

| Zona | Usos | Archivos |
|---|---|---|
| Dentro de `.lobby` o `.sal` | 38 | `salas.css` 14, `video.css` 8, `hojaConfiguracion.css` 5, `perfil.css` 5, `rankings.css` 4, `tienda.css` 1, `tactilLobby.css` 1 |
| Otras pantallas o portales | 12 | `miniPerfil.css` 4, `portada.css` 3, `puerta.css` 3, `bautizo.css` 1, `entrada.css` 1 |
| **La mesa y alrededores** | 15 | **`gameTable.css` 8 (protegido)**, `menuMovil.css` 4, **`opponentPanel.css` 1 (protegido)**, `celebracion.css` 1, `vitrina.css` 1 |
| Sin pantalla viva | 2 | `welcome.css` (sin medir) |
| Comentario | 1 | `luz.css:117` |

Seis no son texto: bordes en `salas.css:511`, `:973` y `:1167`, iconos en `video.css:146` y `:151`, y el ojito en `tactilLobby.css:53`.

**Qué mide hoy.** Cada texto visible, en los cinco tamaños, sobre su fondo real y **solo bajo la tinta de sus letras**: dos fotos congeladas, con texto y sin él, y la diferencia marca qué píxeles cuentan. 600 lecturas a α 0,55, de las que **86 quedan bajo 4,5**.

| Pantalla | Texto | Peor | Fondo | Tamaño |
|---|---|---|---|---|
| Rankings Fortunas (vino) | `.rnk-lugar-t` | **3,85** | `#721b2d` | 360×640 |
| Salas | rótulo `h2` | **3,97** | `#1b462a` | 360×640 |
| Rankings Fortunas (vino) | «· tú» `.rnk-yo` | 4,07 | `#642528` | 412×915 |
| Rankings Maestros | `.rnk-lugar-t` | 4,08 | `#194329` | 412×915 |
| Retar | rótulo `h2` | 4,11 | `#194229` | 915×412 |
| Tienda | subtítulo de `.vid-fila` | 4,11 | `#194228` | 1366×768 |
| Armar mesa | rótulo `h2` | 4,18 | `#194028` | 1920×1080 |
| Tienda | `.vid-quedan` | 4,22 | `#183f27` | 1366×768 |
| Salas | `.sal-vacio` | 4,26 | `#173e26` | 1366×768 |
| Portada | `.pue-cta-vacuna` | 4,32 | `#1f3c22` | 412×915 |
| Perfil | `.pf-tenue` | 4,37 | `#163b24` | 1920×1080 |
| Sala de espera | «Libre» `.sal-esp-n` | 4,44 | `#163923` | 1920×1080 |
| Tienda | `.vid-pastilla` | 4,44 | `#163923` | 1920×1080 |
| Perfil | `.lob-chev` | 4,48 | `#153822` | 1920×1080 |

**Ya pasan a α 0,55:** la hoja ⚙ y el mini-perfil (5,31, sobre `#0c1d13`), la cabecera de la lista de Rankings (5,39), el Bautizo (4,75), `.sal-caja.is-nota` (4,59), `.sal-esp-sub` (4,69). **El lobby: 0 textos a α 0,55.**

Tampoco cuento 15 lecturas apagadas a propósito (opacidad de grupo menor que 0,9): las filas en cascada de Retar (1,96) y el código de una sala vencida (1,71).

**El α mínimo:**

| α | Peor medido | Bajo 4,5 | Centro del vino `#7c1d30` | Centro del verde `#1b482c` |
|---|---|---|---|---|
| 0,55 | 3,85 | 86 | 3,63 | 3,90 |
| 0,60 | 4,31 | 11 | 4,05 | 4,33 |
| 0,62 | 4,51 | 0 | **4,23** | 4,51 |
| 0,64 | 4,71 | 0 | 4,41 | 4,69 |
| **0,65** | **4,81** | **0** | **4,50** | **4,79** |
| 0,72 (`--text-secondary`) | 5,57 | 0 | 5,19 | 5,49 |

**Propongo 0,65.** Con 0,62 pasa todo lo medido hoy, pero una fila que caiga en el centro del vino se queda en 4,23, y qué fila cae ahí depende del largo de la lista. Con 0,65 ninguna posición sobre el fondo de la pantalla baja de 4,50 (los `:hover` no los barrí, §8). Queda a 0,07 de `--text-secondary`: la jerarquía se estrecha, y eso hay que verlo en la lámina.

**Dos formas de hacerlo:**
- **Variante B · Dentro de `.lobby` y `.sal` (mi recomendación).** `--text-muted` se redeclara a 0,65 en esos dos contenedores y todo lo de dentro lo hereda. La hoja ⚙, Retar, Salas, Armar, Sala de espera, Rankings, Perfil y Tienda suben de una vez; la mesa no se entera. Un detalle: **la vitrina vive dentro de `.sal`**, así que heredaría el 0,65 en `.vit-pozo-l` y dejaría de parecerse a la mesa. Hay que devolverle el 0,55 en `.vit`.
- **Variante A · En el token, para toda la app.** La rechazo por tres motivos:
  1. Mueve píxeles de la mesa, que no lo necesita: `.pot-label` da 4,62 y `.thinking`, 4,62.
  2. Cambia el color del rótulo «Pozo» dentro del óvalo, que INV-04 declara intocable «ni por CSS».
  3. Contradice Sistema de Diseño `:422` («El token `--text-muted` no cambia: es compartido») y obligaría a revisar y quizá resellar las maestras de `diagPUE cap`.

**Aviso de la mesa:** bajo B el rótulo «Pozo» sigue a α 0,55 en la mesa, con 4,62 en el verde y 4,64 en vinotinto claro. Ya cumple.

**Archivos:** `theme.css` y `vitrina.css`, no protegidos. **Sin apertura de protegidos.**

---

## 4. P3 · El texto al 64 %

**Qué textos son.** Una sola regla: `src/styles/luz.css:126-128`, `.opp-status` sin las variantes de turno, all-in o eliminación. Son «Pasó», «Apostó», «Igualó», «Subió», «Descartó N» y «Se retiró». No hay otro 0,64 en `src/`.

**Sobre qué cae.** Los 10 asientos de las mesas de 2 a 5, en los cinco tamaños (50 lecturas):
- **Ninguno cruza el óvalo.** Todos caen sobre su panel de asiento (`.opp-panel` o, en la mesa 2, `.ai-zone`), con `rgba(9, 23, 14, 0.3)` sobre el fieltro.
- **La premisa de (b) se confirma.** El 3,80 de TIE-1 mide contra el centro del óvalo, donde este texto no aparece nunca.

**Pero el texto hereda la opacidad de su panel,** y eso es lo que la ficha no contemplaba:

| Estado | Cuándo | Opacidad del panel | Regla |
|---|---|---|---|
| **normal** | el panel no está atenuado | 1 | — |
| **atenuado** | otro asiento tiene el turno | 0,8 | `gameTable.css:1035` (protegido) |
| **retirado** | el rival se retiró (mesas 3–5 y mesa 2 apaisada) | 0,55 | `opponentPanel.css:26` (protegido) |

**Contraste real, bajo la tinta. Peor de los cinco tamaños, mesas 3 a 5:**

| Tapete | Tono | Normal | Atenuado | Retirado |
|---|---|---|---|---|
| verde | — | 5,06 | **3,70** | **2,48** |
| tricolor | — | 5,80 | **4,22** | **2,73** |
| grafito | claro | 5,53 | **4,06** | **2,65** |
| grafito | medio | 5,97 | **4,30** | **2,77** |
| grafito | oscuro | 6,23 | 4,50 | **2,85** |
| azul | claro | 5,38 | **3,92** | **2,58** |
| azul | medio | 5,78 | **4,17** | **2,71** |
| azul | oscuro | 6,12 | **4,39** | **2,81** |
| vinotinto | claro | 5,29 | **3,81** | **2,48** |
| vinotinto | medio | 5,75 | **4,12** | **2,64** |
| vinotinto | oscuro | 6,10 | **4,34** | **2,74** |

**Por tamaño (peor de los 11 tapetes):**

| Tamaño | Letra | Normal | Atenuado | Retirado | Mesa 2: normal / atenuado / retirado |
|---|---|---|---|---|---|
| 360×640 | 13 px | 5,17 | 3,77 | 2,49 | 5,12 / 3,73 / 5,12 |
| 412×915 | 13 px | 5,22 | 3,80 | 2,51 | 5,22 / 3,83 / 5,22 |
| 915×412 | 15 px | 5,06 | 3,70 | 2,48 | 2,50 / 2,30 / 1,96 (solape, ver abajo) |
| 1366×768 | 22 px | 5,12 | 3,73 | 2,49 | 5,06 / 3,70 / 5,06 |
| 1920×1080 | 22 px ×1,3 | 5,17 | 3,77 | 2,49 | 5,06 / 3,70 / 5,01 |

- **Mesa 2 en vertical y escritorio:** `.ai-zone` no tiene `.opp-folded`, así que «Se retiró» no se atenúa.
- **Mesa 2 apaisada (915×412):** las cifras bajas son de un solape, no de color. «Se retiró» pisa unos 5 px el borde inferior de los huecos de carta. Ver §8.
- **Comprobación física.** A 3× hay píxeles de tinta plenos, y su contraste directo con el fondo da **5,19–5,42 normal, 3,84–3,98 atenuado y 2,58–2,66 retirado**. La tabla es algo pesimista porque usa la fórmula sobre el peor píxel; las dos cuentan lo mismo.
- **Cuánto se ve cada estado.** Jugando de verdad, con el espía sobre las clases reales: 72 % normal y 28 % atenuado (1366×768, mesa 5), y 79 % y 21 % (412×915, mesa 4). **Esa cifra subestima el atenuado:** mi bot actúa al instante y una persona que piensa alarga el turno. En esa muestra ninguna IA se retiró, así que «retirado» se midió aplicando la clase real, no jugando.

**Qué haría falta para cada estado:**

| Objetivo | α de `.opp-status` | Peor resultado |
|---|---|---|
| Normal ≥ 4,5 | ya cumple con 0,64 | 5,06 |
| Atenuado ≥ 4,5 en los 11 casos | **0,75** | 4,50 |
| Atenuado, con margen | 0,80 | 4,86 |
| Retirado ≥ 4,5 | **imposible**: con α = 1 el verde da 3,88 | — |

**Las dos opciones de la ficha, con esta evidencia:**
- **(a) Subirlo a 0,75.** Un número en `luz.css:127`. Atenuado queda ≥ 4,50 en todos los tapetes. Retirado mejora poco (con 0,80 llega a 3,05) y se queda como estado apagado a propósito.
- **(b) Aceptarlo.** Su premisa es cierta, pero lo que se acepta no es 5,06: es **3,70 mientras otro asiento tiene el turno y 2,48 en un rival retirado**.

**Mi recomendación, sin que la sonda decida: (a) con 0,75,** y dejar por escrito que «Se retiró» es un estado apagado a propósito, exento del piso. Subirlo de verdad exige abrir un protegido (§8).

**INV-77 y la vitrina.** La vitrina **no pinta este texto**: sus asientos son huecos vacíos (`Vitrina.jsx`), y los nueve valores de INV-77 no incluyen este alfa. Con (a), Δ = 0 entre vitrina y mesa se cumple por construcción, y `tie.puerta` y `diagDSK tapetes` lo comprobarán.

**Efecto colateral de (a):** puede cambiar lo que se ve en la mesa fotografiada de `diagPUE cap`, que hay que correr. Si sale rojo y el cambio es querido, se resella en el mismo commit (Invariantes, nota sobre `diagPUE cap`).

**Archivos:** `luz.css`, no protegido. **Sin apertura de protegidos.**

---

## 5. P4 · El hilo azul

**Qué es.** El trazo del arco de las ocho estrellas: `src/components/ArcoEstrellas.jsx:48-51`, un `<path>` con `stroke="var(--flag-blue)"` (`#003893`), `strokeWidth="1.2"` y `strokeOpacity="0.38"`, dentro de `.lob-arco` (`lobby.css:332`, opacidad 0,9). Solo está en el lobby.

**Cómo lo sé.** Busqué por píxeles todo lo azul del lobby, sin partir de esa hipótesis, y luego quité solo ese trazo:

| Tamaño | Px azules en reposo | Sin el trazo | Ancho real del trazo | Contraste con el fondo |
|---|---|---|---|---|
| 360×640 | 21 | 0 | 0,81 px | 1,11 |
| 412×915 | 157 | 0 | 1,43 px | 1,93 |
| 915×412 | 92 | 0 | 1,08 px | 1,81 |
| 1366×768 | 424 | 3 | 2,09 px | 2,19 |
| 1920×1080 | 393 | 3 | 2,09 px | 2,07 |

Los 3 px que quedan son píxeles sueltos de la moneda y del isotipo. Los cinco tamaños lo pintan en reposo y con el foco en cualquier botón; con la hoja ⚙ abierta, el velo lo tapa.

**¿Es intencional? Sí.** `AJILEI_Sistema_Diseno_v1.2.md:27`: «**Arco de 8 estrellas** — LA firma. Estrellas blancas/crema sobre trazo `--flag-blue`». Viene de la bienvenida de junio (`819e276` ya lo traía) y LOB-1 lo pasó a componente sin cambiar la geometría (`36c6edd`). No es un resto de depurado. Por eso nadie lo explicó: es muy tenue, y en un teléfono pequeño casi no se distingue del fondo.

**No es el anillo de foco.** Recorrí con el tabulador las 9 paradas del lobby en los cinco tamaños: **0 px azules de más en todas**. Siete botones usan el anillo de fábrica (`outline: auto`, `rgb(16, 16, 16)`) y los dos grandes, su contorno dorado; ninguno sale fuera de `:focus-visible`. Nada que tocar.

**Un segundo azul, solo al tocar.** En los contextos táctiles los botones del lobby tienen el resaltado de toque de fábrica, **`rgba(51, 181, 229, 0.4)`, un azul claro**. En contextos con ratón vale `rgba(0, 0, 0, 0.18)`. El lobby no lo apaga; otras hojas sí (`rec.css:52`, `video.css:34`). Es un destello con la forma del botón, no un hilo, pero un destello azul en el S25 también podría ser «el azul que nadie explicó». Una captura no lo registra, así que **no pude verlo pintado**.

**Propuesta.** No tocar el arco. Que Victor confirme en la lámina cuál de los dos vio. Si fue el destello, se apaga con una línea (`-webkit-tap-highlight-color: transparent`), como hacen esas hojas.

**Archivos:** ninguno, o `lobby.css` y `salas.css` si se apaga el destello. **Sin apertura de protegidos.**

---

## 6. P5 · El clic al encender el sonido

**Dónde vive.** `src/components/HojaConfiguracion.jsx:215` (la fila, un `SoundButton`), `src/components/SoundButton.jsx:7`, `src/hooks/useSounds.js` (`reproducir`) y `src/context/SoundContext.jsx`.

**La causa.** La primera hipótesis de la ficha. `SoundButton` llama a `play('buttonClick')` antes de `onClick`, y `play` lee `activo.current`, que sigue en `false` porque el estado cambia después. `reproducir` sale en su primera línea (`if (!activo) return null`) y **no llega a pedirse sonido**.

**La segunda hipótesis, descartada.** El contexto de audio de reproducción está en `running` antes y después del clic.

**Medido con audio real** (espía sobre `AudioBufferSourceNode.start` y un analizador colgado de la salida):

| Caso | Sonidos arrancados | Pico en la salida |
|---|---|---|
| Control: otra fila de la hoja («Acerca de») | 1 | **0,2552** |
| Hoy · apagar | 1 | 0,0001 (`Howler.mute` lo corta antes de oírse) |
| **Hoy · encender** | **0** | **0** |
| Hoy, entrando con `ajilei.sound = off` · encender | 0 | 0 |
| **Propuesta · encender** | 1 | **0,2552** |
| Propuesta, entrando con `off` · encender (el `Howl` nace en ese clic) | 1 | **0,2552** |
| Propuesta · apagar | 1 | 0 a 0,0001, igual que hoy |

**El arreglo mínimo.** `reproducir` ya recibe el ajuste en cada llamada (BIE-1), justo para poder decidir sin React. En la fila:

```jsx
onClick={() => { if (!soundEnabled) reproducir('buttonClick', true); alternarSonido() }}
```

- **Ningún otro sonido cambia.** Solo esta fila, solo al encender. La entrada de sonido del ⋮ no lleva clic hoy y sigue sin llevarlo.
- **Lo probado es una emulación.** Sin tocar `src/`, un oyente en captura sobre la fila llama al `reproducir` real en el mismo gesto. El orden es el del arreglo: pedir, y luego cambiar el estado.
- **No hace falta `Howler.mute(false)`.** El efecto que quita el silencio corre en el mismo clic, y el pico sale igual que el del control.
- **Primera vez sin sonido cargado.** Si la sesión entró apagada, el `buttonClick` (16,9 KB) se descarga en ese clic. En local no se nota; con red lenta ese primer clic puede llegar tarde, como ya admite `useSounds.js` para otros.

**Archivos:** `HojaConfiguracion.jsx`, no protegido. **Sin apertura de protegidos.**

---

## 7. Protegidos, arnés, invariantes y normativos

**Protegidos.** Ninguna propuesta abre ninguno de los seis.

| Punto | Toca | Lee sin tocar |
|---|---|---|
| P1 | `celebracion.css` | `gameTable.css` (`.btn`) |
| P2 | `theme.css`, `vitrina.css` | `gameTable.css` y `opponentPanel.css` (consumidores del token, sin efecto bajo B) |
| P3 (a) | `luz.css` | `opponentPanel.css:26`, `gameTable.css:1035` |
| P4 | nada, o `lobby.css` y `salas.css` | — |
| P5 | `HojaConfiguracion.jsx` | — |

**Arnés: qué mide cada punto hoy y qué falta.**

| Punto | Hoy | Falta |
|---|---|---|
| P1 | **Nadie.** `diagDSK tactil` no visita la victoria; `diagCEL0 celebracion` mira el botón, no su alto | Puerta nueva `cfg.victoria`: zona ≥ piso por barrido, cinco tamaños, escala real, en el carril de desarrollo que `cfg` ya tiene (`?cel` no existe en el bundle) |
| P2 | Solo la píldora sobre vino (`rnk-vino`). **`lob` no sirve aquí:** la ficha lo pedía, pero el lobby no tiene estos textos | Puerta nueva `cfg.contraste`, con el método de la tinta, en las pantallas donde `cfg` ya entra, y su gemela en `tienda` |
| P3 | `diagDSK luz` p2 mide con y sin luz, en estado normal; no ve los estados atenuado y retirado | Ampliar `luz` p2 con los dos estados, si se elige (a) |
| P4 | Nadie, y no hace falta si no se toca | — |
| P5 | `cfg.sonido` mira `ajilei.sound`, no el audio. CFG-1 1a anotó que el arnés no podía ver el clic; **ahora sí puede** | Ampliar `cfg.sonido` con el espía: 1 arranque y pico > 0 al encender |

**Invariantes.**

| INV | Relación |
|---|---|
| INV-07 | P1: añadir la victoria a sus vigilantes y decir que la zona se mide en px reales bajo escala |
| INV-04 | P2: es el motivo principal contra la variante A (el rótulo «Pozo» del óvalo) |
| INV-59 | P1: la escala obliga a dividir por `--escala`; el arnés fuerza 1, y la puerta nueva debe pedir la real |
| INV-77 | P2: la vitrina debe seguir con el 0,55 en `.vit-pozo-l`. P3: sin efecto |
| INV-68 | P5: sigue habiendo un solo estado; el vigilante gana el clic |
| INV-03 | Todas: sin `!important` |
| INV-41 | Este informe marca sus pendientes de iOS (§10) |
| Nueva, propuesta | «El texto atenuado de las pantallas del lobby da ≥ 4,5 sobre su fondo real», con `cfg.contraste` de vigilante |

No hay ninguna invariante de contraste hoy.

**Normativos que suben.**
- **`AJILEI_Sistema_Diseno`** v1.2 → v1.3: el α del lobby y, si se elige (a), la tabla de LUZ-1 (`:420`). **Cuidado:** `testInvariantes` y las fuentes de INV-03 citan `:432`, así que no se añaden líneas antes de esa altura sin reescribir la cita.
- **`AJILEI_Victory_Celebration`** v1.1 → v1.2: los botones (hoy solo tiene su historia en la fila CEL-2e).
- **`AJILEI_Configuracion`** v1.4 → v1.5: §3 (líneas 58-60) dice que al encender no suena.
- **`AJILEI_Invariantes`:** en el mismo archivo, como siempre.
- **`AJILEI_Tienda`** v1.2 → v1.3, solo por la línea de la vitrina si se usa B.

---

## 8. «No cabe en VIS-1»

Hallazgos que no pertenecen a esta tanda, o que la estirarían. Los dejo anotados, sin tocarlos.

1. **«Se retiró» a 2,48.** Subirlo a 4,5 no se puede con el color: hay que cambiar la opacidad del panel (`opponentPanel.css:26`, protegido) o rediseñar cómo se atenúa un rival. Pide autorización y una lámina propia.
2. **Mesa 2 apaisada: la marca del rival pisa los huecos de carta** unos 5 px (915×412; `gameTable.css:2519`, protegido). Es de geometría, no de color. Pendiente de ver con cartas reales encima.
3. **La victoria ya no cabe en ventanas de poco alto.** Hoy mismo el fondo de «Ranking» cae fuera de la vista en 1280×720 (761,39 de 720), 1280×650 y 1024×620: hay que desplazar. Es anterior a VIS-1, y arreglarlo pide reordenar la columna.
4. **La derrota también tiene «Salir de la mesa» pequeño.** Mismas clases (`GameTable.jsx:2449`), así que por lectura mide 28 y 33. **No lo medí:** `?cel` solo lleva a la victoria. La ficha habla de la victoria. Añadir un selector es trivial; decide el rector.
5. **«Eliminar cuenta» en la hoja ⚙ da 2,66.** `--loss-red` sobre `#0c1d13`, medido en todos los tamaños. Con `--lose-red`, el que ya usa el error de esa ventana, daría 5,02. Es de una línea, pero el ⚙ está fuera de alcance salvo P5.
6. **Portada: `.pue-cta-vacuna` da 4,32** (`.pue-by`, 4,61). No es el lobby y la variante B no la alcanza.
7. **Los controles apagados** (chips, CTA y ± a opacidad parcial) dan entre 1,64 y 3,06. Es el estado apagado a propósito, y lo dejo así.

**Sin revisar:** los estados `:hover` de cada fila, `welcome.css`, y varios textos de la Portada donde la medida es dudosa porque la imagen de fondo se mueve (no atribuyo cifras a esos).

---

## 9. Decisiones para el rector y Victor

| # | Decisión | Mi recomendación |
|---|---|---|
| **D-P1** | ¿V1 (caja 44), V2 (caja 40), V3 (solo zona) o V4 (mixta)? | **V4** |
| **D-P1b** | ¿La derrota entra en P1? | Sí: un selector y el mismo problema |
| **D-P2a** | ¿α 0,65 o 0,62? | **0,65** |
| **D-P2b** | ¿Variante B (`.lobby` y `.sal`) o A (token global)? | **B** |
| **D-P2c** | ¿Se suma la Portada al alcance? | No: fuera de la ficha |
| **D-P3** | ¿(a) subir a 0,75 o (b) aceptar? | **(a)**, con «Se retiró» exento y por escrito |
| **D-P4** | Victor mira la lámina: ¿es el arco o el destello? | Arco: se queda. Destello: se apaga |
| **D-P5** | ¿El arreglo de una línea? | Sí |
| **D-Extra** | ¿«Eliminar cuenta» entra en VIS-1? | Sí, si el rector amplía el alcance a esa línea; si no, a otra tanda |

**Si se elige (a) en P3, la lámina lleva el punto P3.** La ficha lo pide así, y conviene añadir el estado atenuado, que es donde se ve el cambio.

---

## 10. Cómo se midió y qué no se pudo medir

- **Instrumento.** Chromium sellado 151.0.7922.34 en modo headless, escala real salvo donde lo digo. Aislamiento verde en todas las corridas: 0 escapadas a Supabase.
- **Dos servidores propios,** en 5174 (desarrollo con bypass, para `?cel` y `?sal=`) y 4174 (el bundle, compilado **en el scratchpad**, con `contextoCap` y el banco imitado). Los dos, cerrados. `dist/` no se tocó.
- **Las sondas no están en el repo:** viven en `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\71914051-e25b-4fc5-ac71-484fe3ef7233\scratchpad\sonda\`, con sus JSON en `salida\`. Se perderán con la sesión; el método de la tinta hay que reescribirlo en el arnés si se aprueban las puertas.
- **Un primer método se descartó.** Medir bajo la caja de línea entera daba cifras falsas (1,72 en 915×412 por el borde punteado de los huecos de carta). Todas las cifras de este informe son bajo la tinta. La pasada de 1924 textos se repitió por eso.
- **Lo que se forzó.** En P3, los textos «Pasó» y «Se retiró» y las clases de estado se pusieron a mano sobre la mesa antes de repartir, en cajas reales. La muestra jugando confirmó las clases y los colores, pero no vio un rival retirado. En P1 y P2, las variantes se inyectaron como CSS en la página.
- **Lo que no llega al altavoz.** P5 mide la señal en la salida del grafo de audio, no el sonido. Falta que Victor lo oiga en la prueba B.
- **Una falsa alarma descartada.** Con la hoja abierta en 915×412 salen 1.099 px «azules»; todos los grupos caen sobre filas de texto de la hoja y no hay ningún elemento azul. Es compatible con el suavizado de letra a densidad 1, sin demostrarlo.
- **iOS (INV-41), pendiente de validar:**
  - P5: que el clic suene en Safari cuando el `Howl` nace dentro de ese mismo clic (BIE-1 avisa de ese riesgo). En la sesión normal, `tableKnock` ya armó el desbloqueo en el lobby.
  - P1: `calc(44px / var(--escala, 1))` bajo `zoom` en el iPad.
  - P2, P3 y P4: nada que validar de iOS, salvo que el destello de P4 es propio de cada navegador.

**Para aquí.** El rector y Victor deciden P3 y las variantes de §9. No se ha creado `laminas/vis1/`.

---

## 11. Lo que se decidió (añadido tras el STOP-0)

**STOP-0 aprobado por el rector y Victor.** Lo de arriba queda como se entregó; donde difiera, manda esta sección.

| # | Decisión |
|---|---|
| **D-P1** | V4: caja de 44 reales en vertical, zona de 44 en horizontal alto y apaisado bajo intacto, con `calc(44px / var(--escala, 1))` |
| **D-P1b** | La derrota entra en P1, y su selector se añade al carril de desarrollo |
| **D-P2a** | α 0,65 |
| **D-P2b** | Variante B (`.lobby` y `.sal`); la vitrina vuelve a 0,55 en `.vit` |
| **D-P2c** | La Portada no entra |
| **D-P3** | (a): `.opp-status` a 0,75. «Se retiró» queda exento del piso, por escrito, como estado apagado a propósito. La lámina enseña normal, atenuado y retirado |
| **D-P4** | **P4 queda fuera del todo** (nota de Victor, posterior y por encima de la primera decisión de enseñarlo en la lámina). Ni el arco ni el destello de toque se tocan, y la lámina no lleva P4 |
| **D-P5** | Sí, el arreglo de una línea |
| **D-Extra** | «Eliminar cuenta» pasa a `--lose-red` y entra en VIS-1 |

**Puertas aprobadas:** `cfg.victoria`, `cfg.contraste` con el método de la tinta y su gemela en `tienda`, `luz` p2 con los estados atenuado y retirado, y `cfg.sonido` con el espía de audio. **Invariante nueva de contraste:** aprobada.

**Lo que esto deja sin efecto en el cuerpo del informe:** la propuesta de §5 de que Victor confirme cuál de los dos azules vio, y la línea de P4 de §7. No se apaga el destello de toque en `lobby.css` ni en `salas.css`.

### Pendientes de §8

Los puntos 4 (la derrota) y 5 («Eliminar cuenta») entran en VIS-1. Los otros cinco quedan fuera, sin tocar. El rector fijó los dos destinos; **el reparto entre ellos es mío** y el rector puede corregirlo.

| §8 | Pendiente | Para | Por qué ahí |
|---|---|---|---|
| 1 | «Se retiró» a 2,48 (2,86 con α 0,75). Subirlo pide cambiar la opacidad del panel, en un protegido | **MES-PvP** | Es el aspecto de un rival en la mesa, y pide autorización y lámina propia |
| 2 | Mesa 2 apaisada: la marca del rival pisa los huecos de carta unos 5 px | **MES-PvP** | Es geometría de la mesa, en un protegido |
| 3 | La victoria no cabe en ventanas de poco alto (1280×720, 1280×650, 1024×620) | **MES-PvP** | Pide reordenar la columna de fin de mesa, que PvP tendrá que revisar |
| 6 | Portada: `.pue-cta-vacuna` a 4,32 | **ARN-4** | Fuera de `.lobby` y `.sal`. Conviene que el orquestador la mida antes de decidir |
| 7 | Controles apagados, de 1,64 a 3,06 | **ARN-4** | Se dejan así. Lo que falta es declararlos exentos en la vara de contraste |

**Sigue sin revisar** lo que §8 ya decía: los `:hover`, `welcome.css` y parte de la Portada.

### Una corrección a §4

La tabla de §4 dice que α 0,75 deja el atenuado en 4,50 como peor caso, y su texto, que queda «≥ 4,50 en todos los tapetes». **No es exacto: la lámina midió 4,47** en el verde, en 3 de 539 lecturas. El error es mío; lo más probable es que redondeara el α mínimo a dos decimales en vez de comprobarlo. Las cifras y lo que hay que decidir están en `AJILEI_VIS-1_FaseL_Lamina_Informe_v1.0.md`.
