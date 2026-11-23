# AJILEI · TUT-1 / GUI-1 · Tanda 4 · Aprender por tema · Informe · v1.0

- **Fecha:** 2026-11-22. **Base:** `a8ec5fb` (tandas 1 a 3, sin push de `main`; respaldo `respaldo-tut-1`).
- **Ficha:** `AJILEI_TUT-1_T4_v1.0.md`, con las seis decisiones de §P confirmadas por Victor. **Normativo:** `AJILEI_Tutorial_v1.4.md` §2 (no cambia en esta tanda; lo que cambia de sus rótulos va a la v1.5, §3).
- **Protegidos:** no se editó ninguno; el motor, la IA, la baraja, los asientos, los pozos y sus dos hojas de estilo solo se ejecutan. `GameTable.jsx` se tocó (no es protegido). **Un tropiezo:** buscando dónde se dimensionan las filas del ⋮, un `grep` sobre `src/styles` sacó dos líneas de `gameTable.css` (dos selectores de «Mano actual»). No se siguió leyendo; las búsquedas siguientes excluyen los protegidos.
- **Nube:** nada. Ninguna migración, ninguna Edge Function, sin deploy. Un capítulo no llama al servidor (`tut.red`).
- **Lo visible para el jugador:**
  - «Aprender por tema» deja de decir «Pronto»: abre un índice de diez capítulos en tres pistas; del 1 al 6 se juegan, del 7 al 10 dicen «Pronto»;
  - cada capítulo enseña su tema sobre la mesa de la guiada, congelada en el momento justo, con velo, aro y burbuja, y a veces una muestra de cartas;
  - «Terminar» pone el ✓ del capítulo en el índice; «Cerrar» no;
  - en las dos mesas (IAS y personas), el ⋮ lleva una fila nueva, «Cómo se juega», que abre el capítulo de la fase en curso sobre la mesa viva.

---

## 1 · Lo que se construyó

### 1.1 El momento (`src/guia/momento.js`)

Un capítulo de mesa se enseña sobre la partida guiada **jugada con el motor de verdad** hasta el paso que toca. No hay ningún estado escrito a mano.

- **`momentoGuiada(mano, paso)`** juega enteras las manos anteriores y la de ahora hasta su parada, por la misma vía que el buscador de órdenes y la prueba de las tres manos (`jugarMano`, con los órdenes de `guiaManos`). En el descarte aplica la selección del paso anterior con `toggleDiscard`, la función exportada del motor.
- **La parada** (`paradaDePaso`, en `src/lib/guiaManos.js`, fuera del bloque de órdenes) sale de `PASOS`:
  - la fase del paso;
  - el turno: cuántos toques previos de pasar, igualar o apostar hay en esa fase;
  - en el descarte basta la fase; en la revelación, la mano entera (`r.pago`).
- **`jugarMano`** recibe un quinto argumento, `parar`. Sin él se comporta como antes; con él, devuelve el estado de la parada en `r.momento`.
- **El azar:** el barajado que arma un momento se consume dentro de la función, y `soltarMazo` devuelve el azar de verdad en un `finally` (INV-90).
- **El tiempo:** el refactor del reproductor fueron minutos; la ficha ponía el tope en 1 h.

### 1.2 La mesa del momento (`src/guia/Capitulo.jsx`)

- **La mesa** es la `GameTable` de siempre en modo guion: `estadoInicial` devuelve el momento, `armar` no hace nada, `pausa: true` y el `Control` es la capa del paso. Cada paso con otro momento es una `key` nueva de la mesa.
- **La pausa:** `useCongelado(pausa)` gana el estado `pausado` (el controlador tiene `pausar(v)`). Congelado es oculto o pausado. El audio solo lo tocan ocultar y mostrar, así que pausar la mesa no apaga el sonido.
- **Los pasos** viven en `src/guia/capitulos.js`: momento, ancla, clave del rótulo y, si hace falta, nota, variables o muestra.
  - Las anclas son atributos de la mesa (`data-ancla`, `data-accion`), sin CSS (INV-89).
  - El capítulo 2 y el 5 tienen siete pasos (STOP-T, §3).
- **Cerrar y terminar:** los dos sueltan el mazo y vuelven al índice. «Terminar» pone el ✓ (`guia.marcarVisto(n)`); «Cerrar» no (P-5).
- **En PvP** (P-1), el primer paso lleva la nota «Tu reloj sigue corriendo.»: la mesa de personas no se pausa.

### 1.3 La muestra de cartas (`src/guia/MuestraCartas.jsx`, `src/styles/muestra.css`)

Lo que la mesa no puede enseñar en ese momento (el valor de cada carta, un empate, los multiplicadores, el all-in, los pozos) sale en una muestra hecha con los componentes reales: `PlayingCard`, `ChipToken` y los textos de la mesa (P-4).

- Va por portal, fija y centrada, encima de la mesa congelada. No mueve ninguna caja (`tut.delta`).
- **La regla de tamaños** (STOP-T, ronda 3) vive en un solo sitio, `tamanoMuestra`, con un nombre por tamaño:

| Cartas | Tamaño | Medida |
|---|---|---|
| 1 | grande | `clamp(84px, min(30vw, 30vh), 160px)`: 110 px en el teléfono, 160 en el escritorio |
| 2 | media | `clamp(56px, min(26vw, 24vh), 120px)`: 94 px en el teléfono |
| 3 o más | chica | lo más grande que cabe a lo ancho (`--n` columnas, con lo que la carta pinta de más) |

- **Más de cinco cartas en vertical:** dos filas, 4 arriba y 3 abajo (`muestra--dos-filas`).
- **Acostado de menos de 600 de alto:** una fila, limitada también por el alto y bajada bajo el rótulo, para no tocar ni la burbuja ni la barra.
- **Las aspas** del capítulo 2 paso 4 (las cartas que no suman) son finas, de 2 px, más claras, y no tapan la carta.

### 1.4 La capa en los capítulos (`src/components/CapaSenal.jsx`, `capaSenalCore.js`)

La capa de siempre, con cuatro piezas nuevas de la tanda:

- **`terminar`, `nota`, `onFondo` y `sinAncla`:** el botón «Terminar» del último paso; una línea pequeña bajo el rótulo, fuera del techo de dos líneas (la suma del 2.5, el reloj de PvP); el toque en el velo pasa de paso; y un paso sin ancla lleva velo entero y la tarjeta sin flecha.
- **La barra fija** (`barraFija`, solo en los capítulos; la guiada no cambia), STOP-T ronda 1:
  - su sitio depende solo de la ventana (`colocarBarraFija`): en acostado de menos de 600 de alto, columna arriba a la izquierda, con «Siguiente» o «Terminar» encima de «Volver»; si no, fila abajo a la izquierda. No se mueve de paso en paso (`tut.barra`);
  - es un obstáculo de la burbuja, como el reloj lo es para las señales: si un lado del ancla choca, la burbuja prueba el otro (`colocarBurbuja`, con `lado`);
  - si ninguno sirve, va la tarjeta (`colocarTarjeta`): abajo, arriba o en la franja libre que encuentre. La tarjeta no lleva botones, así que el texto y «Paso n de m» van en una fila.
- **Las manos reveladas** (STOP-T rondas 1 y 4): en una revelación el ancla es la mano revelada entera, no el panel.
  - El 4.3 apunta a la mano del ganador.
  - El 3.7 apunta a las manos boca arriba (`S.reveladas`).
  - Cada mano funde sus cinco cartas en un hueco, y ningún hueco pisa a otro.

### 1.5 El índice y las pantallas

- **`src/guia/ListaTemas.jsx`:** las tres pistas (El juego, Apostar, La app) y las diez filas. Cada una lleva su icono (`IconosTemas.jsx`, diez trazos SVG de menos de 300 B cada uno, P-6), el ✓ de `vistos` y «Pronto» en las que no existen. Exporta también `IndiceCapa`, el índice en una capa sobre la mesa.
- **`src/screens/IndiceTemas.jsx`:** el índice como vista de «Cómo se juega» (no como pantalla de `App`), con el aviso `lob.toast.pronto` en el 7 a 10. `temas.css`: una columna en el teléfono, rejilla `auto-fit` de 260 px en lo demás.
- **`ComoSeJuega.jsx`:** la tarjeta «Aprender por tema» abre el índice; «Pronto» queda solo en «Pregúntale a Mia».
- **`App.jsx`:** la pantalla `capitulo`. Al cerrar o terminar vuelve a «Cómo se juega», que abre el índice (`vuelta.js`: una marca en memoria que se consume al leerla).

### 1.6 La fila del ⋮ (`UtilitiesMenu.jsx`, `menuEntradas.js`, `GameTable.jsx`)

- **La fila «Cómo se juega»** (`data-entrada="tutorial"`) va en las dos mesas (P-1), antes de «Mano actual». El orden queda: Sonido · Reacciones · Partida rápida · Cómo se juega · Mano actual. El panel mide 244 de alto y cabe en 360×640.
- **Qué abre** (P-2), según la fase de la mesa viva (`capituloDeFase`):

| Fase | Abre |
|---|---|
| Antes de la primera mano o entre manos | el índice, en una capa |
| Reparto o barajado | el capítulo 3, paso 1 |
| Apuesta | el capítulo 5 |
| Descarte | el capítulo 3, en su paso del descarte (5 de 7) |
| Revelación | el capítulo 4 |

- **La pausa:** contra las IAS, la mesa se congela mientras el capítulo está abierto: ni el reloj ni la IA avanzan. En PvP no se congela (el reloj del servidor sigue): lo dice la nota del primer paso.
- **El trozo:** `GameTable` pide `TutorialMesa` al trozo de la guiada solo al tocar la fila. Las señales de primera vez se esconden mientras hay un capítulo abierto.
- **En la guiada** la fila no sale (`filasDelPanel(contraIAS, !guion)`).
- **El icono** es un «?» de trazo, de 18 × 18 como el de «Partida rápida» (`utilidadesMesa.css`; §5).

### 1.7 Los textos (`src/config/textos.tut.es.js`)

- `TEXTOS_TUT_TEMAS`: las pistas, «Capítulo {n}», la suma, el reloj, los rótulos de los capítulos 1 a 6, los títulos del 1 al 10 y las etiquetas de la muestra.
- `tut.ctl.terminar`.
- Los rótulos que cambian respecto del v1.4 llevan su comentario «v1.5» con el texto de antes; la lista completa, en §3.

### 1.8 `1.8b`

- **180,0 KiB**, sobre 179,9 de la base: la entrada pasa de 156,73 a 156,82 kB comprimidos, **+90 B**, dentro del tope de la ficha (+0,1 KiB).
- **Qué hizo falta:**
  - una pieza del trozo de la guiada que importe `PlayingCard` lo parte en un trozo compartido, y la entrada gana dos nombres en `__vite__mapDeps`. Por eso `MuestraCartas` se reexporta desde `GameTable.jsx` y el capítulo la pide por `fabricaMesa`, con su propio `Suspense`;
  - el índice es una vista de «Cómo se juega» y no una pantalla más de `App`: una rama menos en la entrada.

---

## 2 · Las decisiones de §P, como quedaron

| | Decisión | En el árbol |
|---|---|---|
| P-1 | La fila en las dos mesas | Contra las IAS pausa con `useCongelado`; en PvP, la nota del reloj en el primer paso |
| P-2 | Desde el ⋮, el capítulo sobre la mesa viva | `TutorialMesa`, con `capituloDeFase` (§1.6) |
| P-3 | Los botones, con su disponibilidad real | El 5.4 y el 5.5 llevan su variante `.hueco` cuando el botón no está en la mesa |
| P-4 | La muestra con componentes reales | `MuestraCartas` (§1.3) |
| P-5 | «Terminar» pone el ✓; «Cerrar» no | `guia.marcarVisto`, `tut.marca` |
| P-6 | Iconos SVG de 300 B o menos | `IconosTemas.jsx` |

---

## 3 · Para la v1.5 del normativo: los rótulos cambiados y los pasos partidos

El normativo v1.4 no se toca en esta tanda. Esto es lo que la v1.5 tiene que recoger, todo aprobado por Victor en el STOP-T. Cada clave lleva en `textos.tut.es.js` un comentario «v1.5» con el texto anterior.

### 3.1 Los seis rótulos acortados

En 360×640 daban tres líneas. La sonda de líneas buscó el texto más corto que dijera lo mismo.

| Paso | v1.4 | Ahora |
|---|---|---|
| 2.6 | «En las mesas de 4 y 5, el 7 de Oro es **comodín**: se junta con cualquier palo. Vale 10 con 4 y 11 con 5.» | Se acortó a «Con 4 y 5, el 7 de Oro es **comodín** de cualquier palo: vale 10 con 4 y 11 con 5.», y en la ronda 2 se **partió en dos pasos** (§3.3), que sustituyen al acortado |
| 4.2 | «En la mesa de 5, As, tres de diez y el 7 de Oro suman 52. Solo hay uno. Nadie lo iguala.» | «En la mesa de 5, As, tres de diez y el 7 de Oro suman **52**. Nadie lo iguala.» |
| 4.5 | «Pierdes cuando tu pila se queda en cero. Contra las IAS puedes recargar; entre personas, hasta la entrada.» | «Sin pila, pierdes. Recargas contra las IAS; entre personas, hasta la entrada.» |
| 6.1 | «Si te piden más de lo que tienes, puedes ir all-in: pones toda tu pila y tus cartas siguen jugando.» | «Si no te alcanza, puedes ir **all-in**: pones toda tu pila y tus cartas siguen jugando.» |
| 6.2 | «Con all-in solo puedes ganar lo que igualaste. El resto es otro pozo para los demás.» | «Con all-in solo ganas lo que igualaste. El resto es otro pozo para los demás.» |
| 6.4 | «Con la pila baja, puedes recargar. Contra las IAS, ellas se nivelan contigo; entre personas, hasta la entrada.» | «Con poca pila, **recarga**: las IAS se nivelan contigo; entre personas, hasta la entrada.» |

### 3.2 El 5.2, partido en dos (ronda 1)

Los dos aros, el de «Apostar» y el de los multiplicadores, se montaban. El capítulo 5 pasa de 6 a **7 pasos**; los siguientes se renumeran (el 5.3 del v1.4 es ahora el 5.4, y así hasta el 5.7).

| | Texto |
|---|---|
| v1.4, un paso | «**Apostar** mete monedas al pozo. ×1, ×2, ×5 y ×10 son cuántas apuestas pones.» |
| 5.2 (ancla: «Apostar») | «**Apostar** mete monedas al pozo.» |
| 5.3 (ancla: los multiplicadores) | «**×1, ×2, ×5 y ×10** son cuántas apuestas pones.», con los multiplicadores en negrita |

### 3.3 El 2.6, partido en dos (ronda 2)

Victor quiso el texto completo, en dos pasos de dos líneas cada uno, y la carta del 7 de Oro grande. El capítulo 2 pasa de 6 a **7 pasos**. Las dos cifras llevan espacio duro: no se quedan solas al final de una línea.

| | Texto |
|---|---|
| v1.4, un paso | «En las mesas de 4 y 5, el 7 de Oro es **comodín**: se junta con cualquier palo. Vale 10 con 4 y 11 con 5.» |
| 2.6 | «**En mesas de 4 y 5 jugadores**, el 7 de Oro es comodín de cualquier palo.» |
| 2.7 | «Vale **10 puntos** con 4 jugadores y **11 puntos** con 5.» |

### 3.4 Los tres primeros pasos del capítulo 2 (ronda 3)

| Paso | v1.4 | Ahora |
|---|---|---|
| 2.1 (el As) | «El As vale **11**.» | «El As, de cualquier palo, vale **11**.» La carta, grande |
| 2.2 (el 6 y el 7) | «El 6 vale 6 y el 7 vale 7.» | «El 6 vale **6** y el 7 vale **7**, de cualquier palo.», con negrita en las cifras que siguen a «vale». Las dos cartas, medianas |
| 2.3 (todo lo demás) | «Todo lo demás vale **10**: las figuras y también el 2, el 3, el 4 y el 5.» | El texto no cambia. Cambia la muestra: en vertical, las siete cartas en dos filas (4 y 3); en acostado, una fila con las cartas tan grandes como quepan. El «10» bajo cada carta se queda |

### 3.5 Lo demás que la v1.5 tiene que decir

- **La regla de tamaños de la muestra** (§1.3): una carta, grande; dos, media; más, chica.
- **La barra fija de los capítulos** y su prioridad sobre la burbuja (§1.4).
- **El ancla de una revelación:** la mano revelada entera, no el panel (4.3 y 3.7). En el 3.7, IA 1 llega a la revelación pero su mano sigue boca abajo: la mesa solo abre la del ganador (IA 2), y la de IA 1 se abre tocando su nombre. **El capítulo enseña lo que la mesa hace** (decisión de Victor): IA 1 no lleva hueco, y así queda escrito en `capitulos.js`.
- **La fila del ⋮ antes de «Mano actual»:** la ficha la ponía la última, pero `u1` sella «Mano actual» la última (EMB-2).
- **La suma del 2.5** va como nota bajo el rótulo, no dentro de él, y el **3.4 no lleva aspas**.
- **«Entre manos»** abre el índice solo antes de la primera mano. Con la mano cerrada y «Siguiente mano» delante, la fase sigue siendo la revelación y abre el capítulo 4.

---

## 4 · El STOP-T (Victor en el S25, 2026-11-22)

Producción compilada aparte de `dist/`, servida con `vite preview` en 4174 y túnel. Hubo cuatro rondas de arreglos; en cada una se volvió a compilar y a pasar `tut.temas`.

| Ronda | Lo que pidió Victor | Lo que se hizo |
|---|---|---|
| 1 | Las cartas del 2.4 más grandes y las aspas más finas; en acostado, la barra pisaba la burbuja; en el 4.3 vertical, el hueco no abrazaba la mano revelada; el 5.2, partido | Aspas de 2 px que no tapan la carta; la barra fija como obstáculo (§1.4), con `tut.solape` y `tut.barra`; el ancla del 4.3 en la mano del ganador; el 5.2 y el 5.3 (§3.2) |
| 2 | El 7 de Oro mucho más grande; el 2.6 partido | La carta grande, con `tut.grande` (no menor que las de la mano propia); el 2.6 y el 2.7 (§3.3) |
| 3 | La regla de tamaños; textos nuevos del 2.1 y el 2.2; el 2.3 en dos filas en vertical | `tamanoMuestra` (§1.3), §3.4, y `tut.temas` en 780×360 (el S25 acostado) |
| 4 | En el 3.7 acostado, los huecos señalaban los paneles y el de IA 1 pisaba el As de espadas de IA 2 | El ancla de la revelación (§1.4); `tut.solape` mide también que ningún hueco pise a otro ni pise a medias una carta revelada |

**El control de la ronda 4.** Antes de cambiar el ancla, la medida nueva de `tut.solape` se pasó sobre el árbol anterior. Salió roja solo en el 3.7 (640×360, 780×360 y escritorio): ningún otro paso señalaba un panel con cartas reveladas. Con el ancla nueva, verde en los cuatro tamaños.

**Lo aprobado sin cambios:** la fila del ⋮ antes de «Mano actual», los seis rótulos acortados, «entre manos» como está, la suma bajo el rótulo, el 3.4 sin aspas y la negrita de los multiplicadores. En el 3.7, IA 1 se queda boca abajo (§3.5).

---

## 5 · Lo que salió al construirla

- **La carta pinta más que su `--card-w`.** Unos 2 px por carta (el borde y la sombra). Con el ancho justo, las siete cartas del 2.3 se iban a tres filas en vertical. La fila cuenta 4 px más por carta.
- **La muestra llega un cuadro después de la capa** (viaja con el trozo de la mesa). La primera medida del 2.1 salía sin ella; `tut.temas` espera ahora a la muestra con su aro antes de medir.
- **`tocarFondo` de la vara** tocaba la barra fija en 640×360 (la barra está arriba a la izquierda en acostado bajo). Ahora busca un punto libre del velo en una rejilla de 20 px.
- **`mi_proximo_cambio` y `mi_inventario`** se piden en cada cambio de pantalla de la app (`useAuth` y `App`, de antes de la tanda), también al abrir «Cómo se juega» o el índice. `tut.red` las admite por su nombre; cualquier otra llamada dentro de un capítulo es roja.
- **`u1` sella «Mano actual» la última** (EMB-2). La fila del tutorial va antes (§3.5), y `u1` y `menu-movil` se re-sellan con cinco entradas en el mismo cambio.
- **El «?» del ⋮ medía 62 × 62** (defecto de producto, arreglado después del STOP-T). Sin regla de tamaño, el SVG tomaba el ancho de la fila y desbordaba 9 px por arriba y por abajo. En táctil le robaba a «Partida rápida» 9 px de toque (35 de alto, bajo el piso de 44): lo vio `diagDSK u1` en la serie final (`hits` 0/8). Victor lo vio en el S25 más grande que sus hermanos. Ahora mide 18 × 18, como el de «Partida rápida»; con una sonda de `elementFromPoint`, cada fila es dueña de sus 44 px en 1024×768, 360×640 y 640×360.
- **El sello del panel en `menu-movil` seguía en cuatro filas** (andamio, arreglado): `MOVMENU_PANEL` medía 200, el de TIE-1 1a. Con la fila nueva son cinco, 244 en las dos orientaciones, como desde CFG-1 1e hasta TIE-1 1a. Se re-sella en 4-b, con la fila.
- **Seis rótulos daban tres líneas** en 360×640 (§3.1). Se midieron con una sonda que pinta cada rótulo en la capa real.
- **`git stash -u` en OneDrive no borra las carpetas nuevas** («Permission denied» en `src/guia/`), y el `pop` deja la entrada. Se comprobó archivo por archivo que el árbol estaba entero antes de soltar el stash, y la base de `1.8b` se midió con la línea `gzip:` de vite, no con un árbol guardado.
- **La primera serie de varas** se cortó a mano al tocar `src` en el STOP-T, y la segunda la cortó el apagado de la PC. La de §6 es una corrida entera sobre el árbol final.

---

## 6 · Las varas

Todas sobre el árbol final, en serie con el orquestador (`--solo`), que compila `dist/` primero. El 4173 no se tocó.

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 119 archivos, 3 178 pruebas, verde | Incluye `momento.test`, `useCongelado.test`, `partidaRapida.test` (el orden de cinco filas y la mesa guiada sin fila), `textos.test`, `testDistSinMoldes` (`PROHIBIDAS_HASTA_MONTAR` queda vacía), `testInvariantes` y `orquesta.test` |
| `1.8b` | 180,0 KiB, verde | +90 B comprimidos en la entrada sobre la base (179,9); tope de la ficha +0,1 KiB |
| `diagDSK lec` (lec.mapa) | 0, 40 s | — |
| `diagDSK apu` | 9 de 9 con código 0 | Las 7 celdas, rec2 y voz3 |
| `diagDSK h1` | mesas 5, 4, 3 y 2 con código 0 | — |
| `diagDSK z1` | 0 | — |
| `diagDSK rec` | 0 | — |
| `diagDSK msg` | 0 | — |
| `diagDSK pvp` (pvp.mesa) | 0 | — |
| `diagPUE cap` | 0 | Sin resellar: la mesa fotografiada no cambia (la fila del ⋮ está cerrada) |
| `diagDSK tut` | 0, 8 s | Con `tut.mesa` sobre la mesa de la guiada congelada: Δ 0 en los tres tamaños. Control rojo: TUT_CONTROL=caja-movida da Δ 3 |
| `diagDSK tut` guiada | 0, 1 min 37 s | — |
| `diagDSK tut` puerta | 0, 56 s | Con «Pronto» solo en Mia |
| `diagDSK tut` temas | 0, 15 s | 360×640, 640×360, 780×360 y 1920×1080. Control rojo: TUT_CONTROL=barra-encima (`tut.solape` roja, `tut.barra` verde); y el ancla vieja del 3.7, roja solo en el 3.7 (§4) |
| `diagDSK tut` menu | 0, 43 s | Reloj 20 → 20 con el capítulo abierto; la IA quieta 5 s; el panel de 244 cabe en 360×640 |
| `diagDSK menu-movil` | **1 → 0** | La primera pasada, roja en las 16 celdas por `geomSellada`: el sello del panel seguía en cuatro filas (§5, andamio). Re-sellado a 244: 16 de 16 |
| `diagDSK u1` | **1 → 0** | La primera pasada, `hits` 0/8: el «?» de 62 × 62 le quitaba 9 px de toque a «Partida rápida» (§5, producto). Con el icono a 18: 20/20 celdas, `hits` 8/8, sonido 2/2 |

La serie entera corrió sobre el árbol final (28 corridas, todas con código 0 salvo `menu-movil` y `u1`). Después del arreglo del icono y del sello, se repitieron `1.8b`, `tut`, `tut menu`, `cap`, `menu-movil` y `u1`: todas con código 0. Ninguna otra vara mira el ⋮ abierto.

Antes de pedir el «procede», los árboles de 4-a y 4-b se probaron en una copia de trabajo de `a8ec5fb` (quitada después con `npm run aislado -- --limpiar`): build, vitest, eslint y `1.8b`, como el aislado.

| Árbol | Build | vitest | eslint | `1.8b` |
|---|---|---|---|---|
| 4-a | 0 | 3 176 verdes y 1 saltada (los volcados de APU-1, que no van en un clon limpio) | 0 | 179,9 KiB |
| 4-b | 0 | 3 176 verdes y 1 saltada (la misma) | 0 | 180,0 KiB |

- **4-b**, además, con `diagDSK tut` (la vara del perfil commit, todavía con el `tut.mjs` de 4-a): verde.
- **El árbol de 4-b** difiere del final solo en los archivos de 4-c y 4-d.

---

## 7 · Lo que no se hizo

- **Los capítulos 7 a 10** (la app): siguen en «Pronto». Su índice ya está; los construye la tanda siguiente.
- **La v1.5 del normativo:** la escribe el rector con la lista de §3.
- **Pausar el reloj en PvP:** no se puede, es del servidor. Lo dice la nota del primer paso (P-1).
- **Lo que el arnés no puede medir:** el S25 real (se probó en el STOP-T) y Safari.

---

## 8 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **4-a** el momento, la muestra y los capítulos | `src/lib/guiaManos.js` (`jugarMano` con `parar` y `paradaDePaso`, fuera del bloque de órdenes) · `src/hooks/useCongelado.js` · `src/hooks/useCongelado.test.js` · `src/guia/momento.js` · `src/guia/momento.test.js` · `src/guia/capitulos.js` · `src/guia/MuestraCartas.jsx` · `src/styles/muestra.css` |
| **4-b** las pantallas, la fila del ⋮ y los textos | `src/guia/Capitulo.jsx` · `src/guia/ListaTemas.jsx` · `src/guia/IconosTemas.jsx` · `src/guia/TutorialMesa.jsx` · `src/guia/vuelta.js` · `src/screens/IndiceTemas.jsx` · `src/styles/temas.css` · `src/screens/ComoSeJuega.jsx` · `src/screens/Guiada.jsx` · `src/App.jsx` · `src/components/GameTable.jsx` · `src/components/UtilitiesMenu.jsx` · `src/styles/utilidadesMesa.css` · `src/config/menuEntradas.js` · `src/lib/partidaRapida.test.js` · `src/components/CapaSenal.jsx` · `src/components/capaSenalCore.js` · `src/styles/senal.css` · `src/config/textos.tut.es.js` · `src/config/textos.test.js` · `scripts/testDistSinMoldes.test.js` · `scripts/tut/puerta.mjs` · y en versión intermedia: `scripts/diagDSK.mjs` (solo el sello de `u1` y `menu-movil` con cinco entradas y el panel de 244) |
| **4-c** las varas | `scripts/tut/temas.mjs` · `scripts/tut/menu.mjs` · `scripts/tut/tut.mjs` · `scripts/diagDSK.mjs` (entero: los modos `tut temas` y `tut menu`) · `scripts/arnes/orquestaCore.mjs` · `scripts/arnes/orquesta.test.js` |
| **4-d** Invariantes e informe | `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T4_Informe_v1.0.md` |

**Dos movimientos respecto de la ficha §6**, para que cada commit construya y cuente su parte sola:

- **`scripts/tut/puerta.mjs` va en 4-b, no con las varas en 4-c.** Solo cambia `tut.hub`: «Pronto» queda solo en Mia y «Aprender por tema» abre el índice. Es lo que cambia 4-b en «Cómo se juega»; con la vara de 4-a, `tut puerta` saldría roja sobre el árbol de 4-b.
- **El sello de `u1` y `menu-movil` va en 4-b**, con la fila que lo cambia (la versión intermedia de `scripts/diagDSK.mjs`: `U1_ENTRADAS` e `IDS_SELLADOS` con «Cómo se juega» y `MOVMENU_PANEL` en 244). Como una maestra querida, se re-sella en el mismo commit que la cambia. 4-c añade a `diagDSK.mjs` los modos `tut temas` y `tut menu` y su cabecera.

La versión intermedia se construye desde el árbol final. Solo difiere de él en lo que añade 4-c.
