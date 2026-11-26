# AJILEI · TUT-1 · Tanda 7 · El ⋮ sobre la mesa vacía · Informe · v1.0

- **Fecha:** 2026-11-26. **Base:** `a98d842` (`main` = `origin/main`, TUT-1 publicada). Respaldo nuevo: `respaldo-tut-7`.
- **Ficha:** `AJILEI_TUT-1_T7_v1.0.md`. **Contrato:** `AJILEI_Tutorial_v1.5.md` §2.1. El normativo no se reescribe: la regla va como nota v1.6 en `src/config/textos.tut.es.js` y en la cabecera de `src/guia/capitulos.js`.
- **Protegidos:** no se abrió ninguno. La prueba nueva ejecuta `createDeck` de la baraja, sin leer el archivo.
- **Sin control de las IAS:** no se tocó `GameTable.jsx` ni nada de la mesa. La capa pinta encima (INV-89); `CapaSenal.jsx` tampoco cambió.
- **Nube:** nada. Ningún texto nuevo.
- **Lo que Victor vio en ajilei.io:** desde el ⋮ de una mesa de 3 contra las IAS antes de la primera mano, el índice abría los capítulos 1 y 4 sobre la mesa viva. Sus pasos del AJILEI abrazaban con el aro cinco huecos de carta vacíos mientras el rótulo hablaba de un AJILEI que no se veía.
- **Lo visible para el jugador ahora:**
  - en ese momento, el 1.1 y el 4.1 dibujan un AJILEI (As, 5, 12, 3 y 4 de Bastos) con su aro y la burbuja de siempre;
  - los pasos que señalan cartas que la mesa todavía no tiene (el 4.3 y los de cartas del 3) van en la tarjeta sin flecha;
  - lo que sí existe antes de la primera mano (el mazo, los asientos y la pila del 1.2 al 1.4 y del 4.5) se señala como siempre;
  - desde el índice del lobby y a mitad de mano, nada cambia.

---

## 1 · La regla (v1.6 §2.1)

1. **Un ancla de cartas sin cartas es un ancla ausente.** Sobre la mesa viva (un capítulo abierto desde el ⋮), un paso cuya ancla es una zona de cartas en la que solo hay huecos cae a la tarjeta sin flecha, como cuando el ancla no existe. Nunca hay un aro alrededor de huecos vacíos.
2. **Los pasos que nombran el AJILEI lo enseñan aunque la mesa no lo tenga.** El 1.1 y el 4.1 llevan `muestraSiVacio: 'ajilei'`: con el ancla vacía o ausente, pintan la muestra de un AJILEI de 51 con su aro.
3. **El índice desde el ⋮ no cambia.** Los diez capítulos siguen listados igual, con el 7, el 8 y el 9 «En el lobby». Un capítulo abierto en el momento equivocado se lee en tarjetas; no se esconde.

---

## 2 · Lo que se construyó

### 2.1 `anclaVacia` (`src/components/capaSenalCore.js`)

- **Una zona de cartas** (`ZONA_CARTAS`) es cada hueco de la mano propia (`[data-ancla="carta"]`) y de las de los rivales (`.opp-card-slot` en el panel, `.card-slot-wrapper` en la mesa de 2).
- **Una carta pintada** (`CARTA_PINTADA`) es una `.playing-card` que no es `.card-empty`. Una carta boca abajo también es carta: durante el reparto el aro va a ella.
- **`anclaVacia(el)`** es verdadero si `el` es una zona de cartas sin ninguna carta pintada dentro. Lo que no es zona de cartas (el mazo, la pila, un panel, la muestra) nunca está vacío.
- **Sin jsdom:** solo lee `matches` y `querySelector`, así que la prueba usa objetos planos.

### 2.2 El paso sobre la mesa viva (`src/guia/Capitulo.jsx`)

- **`useConCartas`:** en `vivo`, de las anclas del paso quedan solo los selectores que casan con algún elemento que no es una zona vacía. Sobre la mesa congelada y en las pantallas de la app devuelve `null` y el paso queda como estaba.
- **Se relee con la mesa:** un hueco se llena al repartir. Por eso va sobre `useSyncExternalStore`, con un `MutationObserver` del cuerpo; la foto es una cadena, estable mientras no cambie.
- **Si no queda ninguna:**
  - el paso con `muestraSiVacio` pinta la muestra (`MuestraCartas`, por su trozo, como las demás) y el aro va a ella;
  - el resto le da a `CapaSenal` una lista vacía, y la capa, con `sinAncla`, pone la tarjeta fija sin flecha (el camino de la T4).
- **El `hueco` del ⋮** (el 5.4 y el 5.5) sigue igual: se mira sobre la lista ya filtrada.
- **Por qué selectores y no elementos:** la capa recibe selectores. Los de cartas del paso son uno por hueco (`CINCO`, `DOS`, `delPalo`) o, en el 4.3, los cinco huecos del ganador en la revelación, que está llena. Filtrar el selector entero da lo mismo que filtrar cada elemento, y `CapaSenal.jsx` no se toca.

### 2.3 Los datos (`src/guia/capitulos.js`, `src/guia/MuestraCartas.jsx`)

- **`muestraSiVacio: 'ajilei'`** en el 1.1 y el 4.1.
- **`MUESTRA_SI_VACIO.ajilei`:** As, 5, 12, 3 y 4 de Bastos, las cinco de la mano 3 de la guiada, las que el índice enseña en el 1.1, en el orden en que se reparten. Cinco cartas, tamaño `chica`. Las cartas se fijan en `capitulos.js`, como todas las muestras.
- **`ANCLA_MUESTRA`:** el ancla de una muestra, la misma de `anclasDe`.
- **`MuestraCartas`** gana `conjunto`, que se escribe en `data-conjunto` (la vara distingue el AJILEI de la muestra de 52 del 4.2). Es el único cambio del componente.
- **La regla, en nota:** cabecera de `capitulos.js` y nota v1.6 en `textos.tut.es.js` (junto a la de la pastilla).

### 2.4 Las pruebas

- **`capaSenalCore.test.js`:** la zona con solo huecos está vacía; con una carta de cara, boca abajo o seleccionada, no; lo que no es zona, nunca.
- **`capitulos.test.js` (nuevo):**
  - solo el 1.1 y el 4.1 piden la muestra;
  - es un AJILEI para el motor (`isAjilei`, con las cartas de `createDeck`): suma 51, un solo palo, el As primero;
  - su ancla es la de cualquier muestra.

### 2.5 El peso

- **`1.8b` = 180,1 KiB**, la misma cifra que en `a98d842`. Nada viaja en la entrada: todo vive en el trozo del tutorial (`Capitulo`, `capitulos`) y en el de la mesa (`MuestraCartas`).

---

## 3 · La vara (`scripts/tut/menu.mjs`)

- **`tut.menu.vacio`**, en 360×640 y 1920×1080, en la mesa real de 3 contra las IAS **antes de la primera mano**: ⋮ → «Cómo se juega» → el índice → los capítulos 1, 4 y 3, paso a paso con «Siguiente», y «Cerrar».
- **En cada paso**, ningún aro sobre huecos vacíos. Cuenta como tal un aro que es el hueco (más 6 px de margen, con 3 px de tolerancia) de una o varias zonas de cartas vacías. Cinco huecos pegados se funden en uno, así que se compara con la unión de los que encierra. El aro del 1.3, alrededor de los paneles de los rivales, encierra sus huecos pero no es su hueco.
- **Lo que pide a cada paso:**

  | Capítulo | `ajilei` (muestra con aro y burbuja) | `existe` (al menos un aro) | `tarjeta` (sin aro ni flecha) | solo la regla |
  |---|---|---|---|---|
  | 1 | 1.1 | 1.2, 1.3, 1.4 | — | — |
  | 4 | 4.1 | 4.5 | 4.3 | 4.2, 4.4 (sus muestras) |
  | 3 | — | — | 3.1, 3.3, 3.4, 3.7 | 3.2, 3.5, 3.6 |

  En `ajilei`, además: la muestra es `cartas`, `conjunto` = `ajilei`, cinco cartas, `chica`, con su aro y el rótulo con «AJILEI». La muestra del AJILEI no puede salir en ningún otro paso.
- **Después**, la vara sigue como antes: «Iniciar mano» reparte, el 3 en el reparto, el 5 en la apuesta, y `tut.menu.mazo` comprueba el azar.
- **Lo que midió:**
  - en los dos tamaños, el 1.1 y el 4.1 en burbuja sobre la muestra, con un aro;
  - el 1.2 al 1.4 con su aro: uno en 360 y, en el 1.3 de 1920, dos (los dos paneles);
  - el 4.3 y los siete pasos del 3 en tarjeta, sin aro ni flecha. El 3.2 y el 3.6 (la fila de acciones) también: antes de la primera mano no hay fila.
- **Control rojo, `TUT_CONTROL=aro-vacio`:** antes de abrir los capítulos les quita `card-empty` a los huecos (la vara los sigue reconociendo por la marca `tut-control-vacio`). `anclaVacia` ya no ve ninguno vacío y vuelve lo que Victor vio: en los dos tamaños, rojo en el 1.1 y el 4.1 (aro sobre los cinco huecos, sin muestra), y en el 3.1, 3.3, 3.7 y 4.3 (aro sobre huecos en lugar de la tarjeta).

---

## 4 · El STOP-T (Victor en el S25, 2026-11-26)

- **Una compilación** del árbol, aparte de `dist/`, en el preview de 4174 con túnel. Sin commits.
- **Aprobado sin correcciones,** en vertical y en horizontal:
  - los capítulos 1, 4 y 3 desde el ⋮ antes de la primera mano;
  - «Cerrar» → «Iniciar mano»: la mano reparte normal;
  - el ⋮ a mitad de mano abre el capítulo de la fase;
  - el índice del lobby sigue igual.

---

## 5 · Las varas

Sobre el árbol final, en serie con el orquestador (`--solo`), que compila `dist/` primero. El 4173 no se tocó.

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 120 archivos, 3 207 pruebas, verde | Con `capaSenalCore.test` (la regla), `capitulos.test` (nuevo: el AJILEI para el motor) y `testInvariantes` |
| `1.8b` | 180,1 KiB, verde | Sin cambio |
| `diagDSK tut` | 0, 9 s | — |
| `diagDSK tut` guiada | 0, 1 min 37 s | — |
| `diagDSK tut` puerta | 0, 57 s | — |
| `diagDSK tut` temas | 0, 23 s | El índice del lobby, sin cambios |
| `diagDSK tut` menu | 0, 49 s | Con `tut.menu.vacio`; control `aro-vacio` rojo en los dos tamaños (corrido antes del STOP-T) |
| `diagDSK tut` ruta | 0, 1 min 51 s | — |
| `diagPUE cap` | 0, 2 min 35 s | Sin resellar |
| `diagDSK lec` (lec.mapa) | 0, 46 s | — |
| `diagDSK msg` | **1, dos veces** (18 min 58 s y ~19 min) | Las dos, rojas **solo** por «barrido «Heptacoins» · 0 medidas», con 0 desbordes. El resto, verde: compositor (92 casos), jugado 7/7, fin 1/1, Δ larga 7/7, caza 2/2. Es la excepción declarada de INV-22 (el barrido solo mide lo que está en pantalla en cada sondeo): no es una regresión. Esta tanda no toca la mesa, y la vara no abre ningún capítulo. En la tanda 6 salió verde. **Confirmada sobre `a98d842` limpio** (worktree separado, después de los commits): 1, 19 min 02 s, el mismo rojo y solo ese (barrido 0 medidas, 0 desbordes; compositor 92, jugado 7/7, fin 1/1, Δ larga 7/7, caza 2/2). El rojo viene de antes de la tanda: es la excepción de INV-22 |

La serie corrió entera sobre el árbol de la tanda, unos 30 min: 13 corridas, con el build. Después solo cambiaron la nota v1.6 de `textos.tut.es.js` (un comentario) y los documentos. Por eso se repitieron `msg`, `1.8b`, vitest y eslint (5 corridas, unos 20 min), con el mismo resultado.

---

## 6 · Lo que no se hizo

- **El cierre:** push de `main`, borrar `respaldo-tut-7` y ajilei.io en el S25 (el ⋮ antes de la mano). Lo hace Victor.
- **El caso intermedio:** con la mano a medio repartir (dos cartas), el 1.1 abrazaría las dos que hay y no pintaría la muestra («vacía o ausente», al pie de la letra). Desde el ⋮ no se llega ahí: en el reparto el ⋮ abre el capítulo 3, no el 1.
- **Lo que el arnés no puede medir:** el S25 y Safari. Victor lo vio en el S25.
- **iOS (INV-41):** nada validado en un iPhone; sigue en la lista del cierre de TUT-1.

---

## 7 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **7-a** la regla y la muestra | `src/components/capaSenalCore.js` · `src/components/capaSenalCore.test.js` · `src/guia/Capitulo.jsx` · `src/guia/capitulos.js` · `src/guia/capitulos.test.js` · `src/guia/MuestraCartas.jsx` · `src/config/textos.tut.es.js` (la nota v1.6, solo comentario) |
| **7-b** la vara y los documentos | `scripts/tut/menu.mjs` · `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T7_Informe_v1.0.md` |

**Dos movimientos respecto de la ficha §4:**

- **`capitulos.test.js`, nuevo, va en 7-a,** con lo que prueba.
- **La nota v1.6 de `textos.tut.es.js` va en 7-a,** con la regla que anota (la ficha §0 la pide; §4 no nombra el archivo).
