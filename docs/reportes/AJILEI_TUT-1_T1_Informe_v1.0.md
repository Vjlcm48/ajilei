# AJILEI · TUT-1 / GUI-1 · Tanda 1 · Lo común · Informe · v1.0

- **Fecha:** 2026-11-20. **Base:** `c83776e`, con la lámina sin commitear encima (STOP-L aprobado).
- **Ficha:** `AJILEI_TUT-1_T1_v1.0.md`. **Normativo:** `AJILEI_Tutorial_v1.0.md` (entra en `docs/` con esta tanda).
- **Protegidos:** no se abrió ninguno.
- **Lo visible para el jugador:** nada nuevo. La capa, la oferta, las marcas y los textos del tutorial no los monta ninguna pantalla todavía. La mesa cambia atributos y pasa sus literales a `t()` con el texto idéntico al byte.

---

## 1 · De la lámina a lo definitivo

### 1.1 El mando, retirado

Se fueron `src/dev/laminaTut.js`, `src/dev/LaminaTut.jsx` y `src/dev/montarLaminaTut.js` (nunca se commitearon), el `import()` de `main.jsx` y el efecto de `App.jsx` que se sentaba solo en la mesa de 3, con su `useRef` y su `useEffect`. `App.jsx` y `main.jsx` quedan idénticos a `c83776e`.

**La guarda `relojQuietoTut()` de `GameTable.jsx` también se fue.** No sirve de molde: en la guiada el reloj se apaga por una propiedad de la mesa en modo guion (tanda 2), no por una función de desarrollo que lee la URL. Dejarla apagada con otro nombre sería dejar una rama muerta en el efecto del reloj.

### 1.2 `CapaSenal`, definitivo

Lo que se quitó, por no elegido: la tarjeta fija como colocación principal, el velo oscuro (la propiedad `tono`), la zona de la tarjeta (`zona`), la flecha a voluntad (`flecha`) y el rótulo «solo sombra» (`fondo`).

Lo que queda:

| Pieza | Cómo es |
|---|---|
| Colocación | **`burbuja`** (capítulos y guiada): pegada al ancla, con pico y «paso n de m» dentro; los botones, en una barra aparte abajo. **`libre`** (señales de primera vez): sin velo ni controles, con fondo, donde no tape nada (`colocarLibre`) |
| Respaldo | Si la burbuja no tiene sitio, va la **tarjeta de respaldo**, fija abajo (arriba si abajo hay un hueco), con el paso y los botones dentro y una flecha al ancla. No tener sitio quiere decir pasar de dos líneas, salirse de la ventana o pisar un hueco (`burbujaCabe`). La burbuja se mide en una copia invisible con sus mismas clases, así que se decide antes de pintarla en su sitio |
| Velo | **35 %**, una sola cifra, en `senal.css` (`--tut-velo`). Lo que se ve es un rectángulo SVG con una **máscara** agujereada en cada hueco; lo que recibe el toque son bandas transparentes recortadas por franjas (`bandas`) |
| Huecos | **Uno por ancla** (`huecosDe`). Dos que se pisan se funden solo si la caja de los dos no destapa otro control de la pantalla, y primero el par de unión más pequeña (ver §5, hallazgo 1) |
| Aro | Uno por hueco, con pulso; quieto con `prefers-reduced-motion` |
| Botones | `SoundButton`: suenan como los demás. La capa se monta dentro del árbol de `App` y el portal conserva el contexto del sonido |
| Lo demás | Igual que en la lámina: portal a `body`, `z-index` 40, trampa de foco con velo, Escape cierra, `unico` y `alTocar`, medida por `requestAnimationFrame` sin temporizadores |

La capa no se monta desde ningún sitio. La geometría vive en `capaSenalCore.js`, que es pura, y la prueba `capaSenalCore.test.js` (22 casos).

### 1.3 `OfertaGuiada`

Queda solo la variante a, centrada sobre el lobby atenuado, con el velo del 35 %. Se quitaron `variante`, `encima` y la medida del pie. Los botones son `SoundButton` y nadie la monta: lo hace la tanda 3.

### 1.4 `textos.tut.es.js`

Tiene **24 claves**: las 21 de la lámina y tres comunes del normativo §3, `tut.guiada.nombre` («Partida guiada»), `tut.indice.guiada` («Partida guiada · 2 min») y `tut.indice.visto` («Visto»). «Cómo se juega» ya existía: es `tut.capa.aria`, el nombre accesible de la capa.

`tut.cap5.p2` dice ya lo del normativo v1.0: «… ×1, ×2, ×5 y ×10 son cuántas apuestas pones.» Con eso se cierra el hallazgo 2 de la lámina. Las claves de la oferta siguen en el diccionario diferido; la tanda 3 decide si van a la entrada. Una prueba nueva de `textos.test.js` comprueba cuatro cosas:
- el prefijo, y que ninguna clave está también en la entrada;
- que no hay textos repetidos;
- que las negritas van por pares;
- que las claves solo existen sumadas.

### 1.5 Las marcas locales

`src/lib/guia.js` sigue el molde de `partidaRapida.js`: un almacén inyectable y todo dentro de `try`.
- **Clave y forma:** una sola clave, `ajilei.guia`, con `{ ofrecida, hecha, senales: { iniciar, apostar, descartar }, vistos: [1…10] }`.
- **Lectura:** lo que no tiene esa forma se lee como «nada hecho». Un capítulo fuera de 1–10 o una señal que no es de las tres no entran.
- **Escritura:** marcar suma a lo que ya había.
- **Censo:** entra en el de INV-12 (`testClavesAlmacen`: 21 claves y 17 accesores).
- **Borrado:** `limpiarAparato` la borra con todas las `ajilei.*`, sin cambiar su código. Su cabecera lo dice y `guia.test.js` lo prueba.
- **Uso:** nadie la lee todavía.

## 2 · Las anclas de la mesa

Son solo atributos, sin CSS. Las zonas llevan `data-ancla` y los botones `data-accion`. El arnés recorre `.action-buttons [data-accion]` (`autojuego.mjs:40`).

| Ancla | Dónde | Nota |
|---|---|---|
| `iniciar-mano`, `siguiente-mano`, `mult` + `data-k`, `descartar`, `fila-acciones`, `carta` + `data-i` | De la lámina | Sin cambios |
| `data-ancla="ovalo"` | `.center-zone` y, en la mesa de 2 apaisada, `.felt-oval.oval-right` (el óvalo de la crónica) | Dos rutas de la misma zona; nunca coexisten |
| `data-ancla="pozo"` | Las dos `.pot-box` (las mismas dos rutas), junto a `data-coin-source="pot"` | — |
| `data-ancla="a-igualar"` | Las dos `.call-box` | — |
| `data-ancla="comodin"` | `.comodin-note` | Solo en mesas de 4 y 5 |
| `data-ancla="rival"` + `data-asiento` | `OpponentPanel` (`.opp-panel`) y `.ai-zone` de la mesa de 2: los dos caminos de render (INV-10) | `data-asiento` es el índice del motor |
| `data-ancla="barra-propia"` | `.player-bar` | — |
| `data-ancla="menu"` | El disparador del ⋮ (`UtilitiesTrigger`, en `UtilitiesMenu.jsx`) | Solo lo usa la mesa |

**Δ geométrico 0**, medido por `diagDSK tut` (§4).

## 3 · Los literales de la mesa, a `t()`

Hay 18 claves `mesa.*` en `textos.es.js`, con el texto idéntico al byte:
- los botones: «Pasar», «Apostar {n}», «Igualar ({n})», «Subir a {n}», «Retirarse», «Iniciar mano», «Siguiente mano», «Descartar {n}» y «Sin descartar»;
- la pista del descarte en sus dos formas, la de una línea y la de dos con su `<br />` entre las dos claves;
- los recuentos «{n} de {max} seleccionada(s).» y «{n} carta(s) seleccionada(s).»;
- «Pozo» y «A igualar», en las dos rutas;
- «Barajando…», en las dos ramas, y «Repartiendo cartas…».

Ninguno de esos literales está en un protegido. El prefijo `mesa.` entra en la puerta de prefijos de `textos.test.js` (la décima campaña).

**`1.8b`: 179,4 → 179,6 KiB.** Son +243 B en el cable (183 714 → 183 957), 0,24 KiB, por debajo del umbral de 0,3. Por eso las claves se quedan en `textos.es.js` y no hace falta un `textos.mesa.es.js`. La cifra de antes se midió compilando `c83776e` en una copia aparte.

**Los nodos de texto, como antes.** «Apostar {n}», «Igualar ({n})», «Subir a {n}» y la pista del descarte se pintan con `tTrozos` (en `GameTable.jsx`). El texto sale de la clave, pero cada variable vuelve a ser su propio nodo de texto, como en el JSX de antes. Con un solo nodo, Chromium colocaba los glifos de «Apostar 2000» medio píxel distinto y `cap.regresion` salía rojo (§5, hallazgo 6).

Las varas que leen esos textos están en §6. Ninguna referencia de vara se tocó.

## 4 · La vara `tut`

`diagDSK tut` (`scripts/tut/tut.mjs`) va en el perfil **`commit`** porque tarda **3 s**. También está en `completo`.

**Cómo se monta.** El mando `?tut=` ya no existe. La vara importa dentro de la página `scripts/tut/montaCapa.mjs`, que sirve el servidor de desarrollo, y ese módulo monta la `CapaSenal` real en una raíz propia, con el contexto del sonido apagado. Nadie de `src/` lo importa, así que no llega a `dist/`.

**La mesa no es la de `?apu=`, sino la quieta del árbitro imitado** (`?pvp=turno-propio&n=3`). Sin el mando, la mesa contra las IAS corre su reloj de turno. Esta, en cambio, se queda en el turno del humano sin ninguna guarda nueva, y es el mismo `GameTable` con la misma fila.

| Puerta | Qué comprueba | Tamaños |
|---|---|---|
| tut.delta | Δ 0 de todas las cajas de `#root` (120 en el teléfono, 122 en la PC) sin capa, con capa y otra vez sin ella. Si la mesa se mueve sola, es error de instrumento | 360×640 · 640×360 · 1920×1080 |
| tut.hueco | Dentro de cada hueco, los píxeles son los de sin capa: ningún canal cambia más de 24 y la media queda bajo 4. Lo medido es una media ≤ 2,1 y un máximo de 15, el suavizado del texto al cambiar la composición; el velo da medias de 19 a 67. Además, ningún hueco destapa el centro de otro botón de la fila | las tres |
| tut.toque | Con `unico`, el toque real (`touchscreen.tap` en el teléfono, clic en la PC) en «Pasar» llega a «Pasar», y en «Retirarse» lo recibe una banda. El resto se ve con opacidad 0,4. Al irse la capa no quedan `data-tut-unico` ni `data-tut-activo` | las tres |
| tut.44 | Los botones de la capa miden 44 × 44 o más (Volver 72,8, Cerrar 73, Siguiente 95,5, de alto 44) | las tres |
| tut.contraste | El rótulo sobre su fondo, con lo peor que pueda haber detrás: texto 14,39, negrita 10,98, «paso n de m» 8,01 | las tres |
| tut.respaldo | Con un ancla que ocupa la pantalla entera, la tarjeta de respaldo lleva dentro el paso y los tres botones, no lleva barra aparte y cabe en la ventana | las tres |
| tut.lineas | Ningún rótulo de `textos.tut.es.js` pasa de dos líneas: las dos señales, los ocho pasos del capítulo 5 y sus dos `.hueco` | 360×640 (en 1920 se apuntan) |
| tut.consola | Sin errores en la página | las tres |

**Control rojo.** Con `TUT_CONTROL=sin-hueco` se cierran los agujeros de la máscara y el velo recibe el toque. Sale **rojo** en los tres tamaños: tut.hueco da medias de 21 a 67 y tut.toque da «rect» en vez de «pasar».

**La lámina fuera de `dist/` es prueba permanente** de `testDistSinMoldes`, pero repartida en dos listas:

- **Para siempre:** las cinco marcas del mando (`TUT-1 · lámina`, `tut-lamina`, `montarLaminaTut`, `relojQuietoTut` y `mesaTut`).
- **Hasta montar:** las otras seis (`tut-capa`, `data-tut-unico`, `ofg-tarjeta`, `tut.oferta`, «Aprendemos» y `tut.cap5`). No pueden ser para siempre, porque las tandas 2 a 4 montarán la capa, la oferta y el capítulo 5. La tanda que monte cada pieza saca su marca de la lista en el mismo commit.

Hoy no aparece ninguna de las once.

## 5 · Lo que salió al construirla

1. **La primera fusión de huecos repetía el hallazgo 5.**
   - **Qué pasó:** con «un hueco por ancla, y se funden los que se pisan», «Apostar» (a 8 px de la fila de multiplicadores) se fundía con la fila. La caja de los dos cubría el centro de «Retirarse» en 360×640 y en 1920×1080. Lo vio `tut` en su primera corrida.
   - **Cómo quedó:**
     - Solo se funde lo que no destapa otro control.
     - Primero se funde el par de unión más pequeña: así «×1» se queda con los demás multiplicadores y no se va con «Apostar».
     - El velo pasó de un trazado par-impar a una máscara, que admite huecos que se pisan.
   - **El aro:** los aros de dos huecos que se pisan se cruzan unos píxeles; tut.hueco los oculta para la foto, porque mide el velo.
2. **El paso 4 en 1920 no cae en el respaldo con el texto de hoy.** En la mesa de verdad, «Cuando alguien apuesta, aquí sale Subir…» ocupa dos líneas en la burbuja de 380 (la lámina contó tres). El respaldo queda probado de dos maneras:
   - con las cifras de la lámina, en `capaSenalCore.test.js` (tres líneas en la burbuja → tarjeta abajo, con flecha);
   - en el navegador, con tut.respaldo.
3. **La vara corre con la escala forzada a 1**, como todos los modos menos `tab`. En 1920 la mesa real lleva `zoom` 1,3. La capa no hereda ese `zoom` (va fuera de `#root`), así que Δ y huecos no dependen de él. Las líneas del rótulo en 1920 sí podrían cambiar algo con el `zoom` real de la mesa: no cambia la letra de la capa, pero sí dónde queda el ancla.
4. **«Cómo se juega» se repite** entre `tut.capa.aria` y `lob.nav.reglas`, a propósito: son diccionarios distintos (el diferido y la entrada), y la prueba nueva solo prohíbe repetir dentro del de `tut.*`.
6. **«Texto idéntico al byte» no basta para que la mesa pinte idéntico.**
   - **Qué pasó:** con los literales en `t()`, `diagPUE cap` salió rojo dos veces seguidas, también corriendo solo. `cap.regresion` dio Δmáx 77 en v (335 px) y Δmáx 128 en pc. `c83776e`, en una copia compilada y con la misma vara, daba verde.
   - **La causa:** en la diferencia contra la maestra, la única zona cambiada era el texto de «Apostar 2000». `Apostar {betAmount}` eran dos nodos de texto y `t()` devolvía uno; Chromium coloca los glifos de forma distinta según el nodo.
   - **El arreglo:** `tTrozos` (§3). Con él, `cap` da 0 px contra la maestra en v y en h, y en pc la misma cifra que `c83776e` (637 519 px, Δmáx 16).
7. **Retirar sin borrar:** el clasificador de permisos no deja `rm` en el repo. Los tres archivos del mando se movieron al scratchpad de la sesión; como nunca se commitearon, git no ve nada.

## 6 · Las varas

Todas se corrieron sobre el árbol final de la tanda, con `dist/` compilado una vez (`--sin-build`). Las largas fueron en tres corrientes en paralelo, con puertos propios (5173, 5175 y 4191–4193; el 4173 no se tocó).

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 115 archivos, 3 110 pruebas, verde | Incluye `testDistSinMoldes` (las 11 marcas de la lámina: 0), `testInvariantes`, `testClavesAlmacen`, `orquesta.test` y las pruebas nuevas |
| `1.8b` | 179,6 KiB, verde | Antes 179,4 (`c83776e`): +243 B |
| `diagDSK tut` | verde, 3 s | Control `TUT_CONTROL=sin-hueco`: rojo, como debe |
| `diagDSK lec` (lec.mapa) | verde, 29 pisos y 19 excepciones | Las anclas y los textos no mueven la letra |
| `diagDSK apu` | 9 de 9 con código 0 | 7 celdas, rec2 y voz3 |
| `diagDSK h1` | mesas 5, 4, 3 y 2 con código 0 | — |
| `diagDSK z1` | código 0 | — |
| `diagDSK rec` | código 0 | — |
| `diagDSK msg` | código 0 | — |
| `diagPUE cap` | 31 mediciones, 0 en rojo | `cap.regresion` sin resellar: v y h a 0 px de la maestra; pc igual que `c83776e`. La primera pasada dio 2 rojos (§5, hallazgo 6) |

Las varas de pantalla (`apu`, `h1`, `z1`, `rec` y `msg`) se corrieron dos veces, las dos en verde: antes y después de `tTrozos`. Las cifras de arriba son de la segunda pasada.

## 7 · Lo que no se hizo

- **El control de las IAS** no se corre en esta tanda: va una sola vez al cerrar la tanda 5 (ficha §3).
- **El S25:** lo mira Victor por túnel. Una mesa contra las IAS de 3, una mano completa, tiene que verse idéntica a la de ayer.
- **Nada en la nube** y ninguna migración.

## 8 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **1-a** capa y anclas | `src/components/CapaSenal.jsx` · `src/components/capaSenalCore.js` · `src/styles/senal.css` · `src/components/OfertaGuiada.jsx` · `src/styles/ofertaGuiada.css` · `src/components/GameTable.jsx` (las anclas, sin la guarda de la lámina, con los literales todavía) · `src/components/OpponentPanel.jsx` · `src/components/UtilitiesMenu.jsx`. La retirada del mando no deja diff: lo retirado nunca se commiteó |
| **1-b** textos | `src/config/textos.tut.es.js` · `src/config/textos.es.js` · `src/config/textos.test.js` · `src/components/GameTable.jsx` (los literales a `t()`) |
| **1-c** marcas y vara | `src/lib/guia.js` · `src/lib/guia.test.js` · `scripts/testClavesAlmacen.test.js` · `src/lib/limpiarAparato.js` · `scripts/tut/tut.mjs` · `scripts/tut/montaCapa.mjs` · `scripts/diagDSK.mjs` · `scripts/arnes/nucleo.mjs` · `scripts/arnes/orquestaCore.mjs` · `scripts/arnes/orquesta.test.js` · `src/components/capaSenalCore.test.js` · `scripts/testDistSinMoldes.test.js` |
| **1-d** documentos | `docs/AJILEI_Tutorial_v1.0.md` · `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_TUT-1_Lamina_Informe_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T1_Informe_v1.0.md` |
