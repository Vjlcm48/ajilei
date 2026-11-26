# AJILEI · TUT-1 · Tanda 6 · La ruta de la primera vez · Informe · v1.0

- **Fecha:** 2026-11-25. **Base:** `a2dd147` (5-c; sin push de `main`; respaldo `respaldo-tut-1` en ese SHA).
- **Ficha:** `AJILEI_TUT-1_T6_v1.0.md`. **Contrato:** `AJILEI_Tutorial_v1.5.md` §1.2.1. El normativo no se reescribe: lo que cambió en el STOP-T va como nota v1.6 en `src/config/textos.tut.es.js` (§3).
- **Protegidos:** no se abrió ninguno. El motor, la IA, la baraja, los asientos, los pozos y sus dos hojas de estilo solo se ejecutan.
- **`GameTable.jsx` se tocó, mínimo** (lo permitió Victor para la pastilla, §1.5): un atributo, `texto={guion?.pastilla}`, en la `TransicionMano` que ya montaba. En toda mesa que no es la guiada vale `undefined` y la pastilla es la de siempre.
- **Nube:** nada. Ninguna migración, ninguna Edge Function, sin deploy. La ruta no llama al servidor (`tut.red`).
- **Lo visible para el jugador:**
  - la primera vez que toca «Jugar la guiada» (desde la tarjeta del primer login o desde «Cómo se juega»): «¿En qué consiste el juego?» → el capítulo 2 → «Ahora, a jugar» → la guiada de siempre;
  - con el ✓ del capítulo 2, la tarjeta va directa a la mesa, como hasta ahora;
  - en la guiada, la pastilla entre manos cuenta el camino: «Mano 1 de 3 · Eres Mano», «Mano 2 de 3 · Es Mano IA 1», «Última mano · Es Mano IA 2».

---

## 1 · Lo que se construyó

### 1.1 El encadenado (`src/App.jsx`, `src/guia/Ruta.jsx`, `src/screens/Guiada.jsx`, `src/lib/guia.js`)

- **Una pantalla nueva, `ruta`.** Las dos entradas de «Jugar la guiada» (la oferta del lobby y la tarjeta de «Cómo se juega») van a ella. `App` la pinta en `PantallaDiferida` con el trozo del tutorial; en la entrada solo viaja esa rama (`1.8b`, §1.6).
- **`Ruta` decide al montarse** con `guia.rutaPendiente()`: verdadero mientras `ajilei.guia.vistos` no tenga el 2 (`CAPITULO_DE_LA_RUTA`). Si no está pendiente, pasa a la mesa guiada en el mismo cuadro (`useLayoutEffect`), sin pintar nada.
- **Los tramos:** intro → «Empecemos» → `Capitulo n=2 enRuta` → su «Siguiente» final pone el ✓ (`marcarVisto(2)`, el mismo de «Terminar») → puente → «Jugar» → `setScreen('guiada')`, la rama de la tanda 2 sin tocar: su cierre, su premio y sus tramos siguen igual.
- **«Salir»** en cualquiera de las tres paradas lleva al lobby, sin pagar y sin marcar. La oferta no vuelve: la marca `ofrecida` ya la puso «Jugar la guiada».
- **Recargar a mitad de la ruta** vuelve al lobby. La próxima vez la ruta empieza desde el principio, porque la única marca es el ✓ del 2.
- **`Guiada.jsx`** exporta `Ruta`, como ya hacía con `Capitulo` y `ComoSeJuega`: viaja en el mismo trozo.

### 1.2 El capítulo 2 dentro de la ruta (`src/guia/Capitulo.jsx`, `src/components/CapaSenal.jsx`)

- **`enRuta`**, una propiedad nueva de `Capitulo`:
  - empieza siempre en el paso 1 (no lee `pasoEnCurso`);
  - el botón de arriba dice «Salir» (`controles.salir: true`) y el último paso dice «Siguiente»;
  - ni «Salir» ni «Siguiente» vuelven al índice (`volverAlIndice`), tampoco desde el límite de error (`RedCapitulo`).
- **`CapaSenal`:** `controles.terminar` puede ser una clave de `t()`, que pone el rótulo del botón final. Sin ella, «Terminar», como siempre.
- **El capítulo 2 de la serie no cambia:** desde el índice sigue con «Cerrar» y «Terminar».

### 1.3 Las dos pantallas (`src/guia/RutaIntro.jsx`, `src/guia/RutaPuente.jsx`, `src/styles/ruta.css`)

- **La carcasa** es la de la oferta y «Cómo se juega»: una página fija sobre el fondo del lobby atenuado, una tarjeta en el estilo de `ofg`, la letra con los pisos de LEC-1, el oro único en el botón principal (46 px de alto) y «Salir» arriba a la derecha (el mismo botón de la guiada).
- **La intro**, siete piezas (`data-pieza` 0 a 6):
  1. el título;
  2. la frase, con su línea pequeña;
  3. las cinco cartas de Copas;
  4. «Te vamos a enseñar dos cosas:»;
  5. ① con el icono del capítulo 2;
  6. ② con el del capítulo 3;
  7. «Empecemos».
- **La revelación:** una pieza cada 400 ms. Con `prefers-reduced-motion`, todas a la vez. Un toque en la pantalla la completa de golpe; el toque en «Empecemos» no se propaga.
- **O1:** las piezas solo cambian `visibility` y `opacity`, así que todas las cajas están reservadas desde el primer cuadro y nada salta (`tut.delta`).
- **Las cartas** son la muestra de los capítulos (`MuestraCartas`) con una propiedad nueva, `enLinea`: se pinta en su sitio, sin portal y sin marco. Llega por `fabricaMesa`, como en los capítulos: si viajara en el trozo del tutorial, `PlayingCard` se partiría en un trozo compartido y la entrada cargaría su nombre. Al revelarse se iluminan con el aro de oro de la mesa.
- **El puente:** el icono del capítulo 3, «Ahora, a jugar», la frase con su línea pequeña, «Jugar» y «Salir».
- **El acostado bajo:** dos columnas, para que las cinco cartas y el botón se vean sin desplazar en 640×360 y 780×360.

### 1.4 Los textos (`src/config/textos.tut.es.js`)

- **`TEXTOS_TUT_RUTA`**, nueve claves: `tut.ruta.intro.*` (titulo, frase, palos, dos, uno, otro) y `tut.ruta.puente.*` (titulo, texto, nota). «Empecemos» y «Jugar» van en el común (`tut.ctl.empecemos`, `tut.ctl.jugar`).
- **`TEXTOS_TUT_ES`**, la suma que leen las pruebas y la vara, no tenía el grupo de la ruta. Ahora lo lleva, así que `textos.test.js` también lo mira: ninguna clave repetida, las negritas por pares y nada en la entrada.
- **`montaCapa.rotulos()`** deja fuera `tut.ruta.*` y `tut.pastilla.*`: no son rótulos de la capa. Las pantallas de la ruta las mide `tut ruta`, y la pastilla, `tut guiada`.

### 1.5 La pastilla entre manos de la guiada (STOP-T, §3)

- **El texto lo arma el guion:** `guiaManos.pastillaGuiada(game, t)`, una función pura que recibe `t` (el buscador de órdenes importa el módulo desde Node). Las cuatro claves, en `TEXTOS_TUT_GUIADA`:
  - `tut.pastilla.mano`: «Mano {n} de {total}»;
  - `tut.pastilla.ultima`: «Última mano»;
  - `tut.pastilla.eres`: «Eres Mano»;
  - `tut.pastilla.es`: «Es Mano {nombre}».
- **El camino:** `Guiada.jsx` pone `pastilla` en su guion; `GameTable` la pasa a `TransicionMano` (`texto`). Sin guion, `TransicionMano` usa `textoPastilla`, la de siempre: la mesa real no cambia.
- **Desde la mano 1.** La mesa real empieza a contar en la 2 (la 1 de PvP la anuncia el sorteo), y la guiada cuenta las tres. La de la mano 1 sale al tocar «Iniciar mano», mientras se reparte y antes de la burbuja del paso 2, igual que las otras dos.
- **Una línea:** la pastilla ya era `nowrap`. `tut.guiada` comprueba que cada una ocupe una línea y quepa en la pantalla (§4).

### 1.6 El peso

- **`1.8b` = 180,1 KiB** (+0,1 sobre 180,0, el tope de la ficha). Es la rama `ruta` de `App`; todo lo demás viaja en el trozo del tutorial.
- **Sin cambio en 6-b:** sin el diagnóstico, `1.8b` sigue en 180,1. El código vivía detrás de `VITE_TUT_DIAG` y el build de producción ya no lo llevaba.

---

## 2 · El arnés

- **`GUIA_VISTA`** (`scripts/arnes/comun.mjs`, el estado por defecto de los contextos) trae ya el ✓ del capítulo 2. Así `tut.guiada`, `tut.puerta` y todo lo que entra por «Jugar la guiada» siguen como estaban. Ajustes:
  - `tut temas` reescribe su guía sin ✓, una vez por pestaña (`sessionStorage`), porque mira las marcas de los diez capítulos;
  - los contextos del hub de `tut puerta` llevan `vistos: [2]`.
- **`jugarGuiada`** (`scripts/tut/guiada.mjs`): el bucle de la guiada, sacado de `tut guiada` y exportado con sus ayudantes. Lo usa también `tut ruta`.
- **`tut ruta`** (`scripts/tut/ruta.mjs`, nueva; `diagDSK tut ruta`, `tut.ruta` en el orquestador, perfil `completo`), en 360×640, 640×360, 780×360 y 1920×1080:
  - **Contexto A, sin ✓ ni oferta:**
    - la oferta → la intro: el orden de la revelación, su tiempo (1,8 a 4 s), las cajas de O1 y la medida (contraste 4,5, dos líneas, 44, nada se pisa ni desplaza);
    - «Salir» en la intro;
    - el hub → un toque completa la revelación → «Empecemos» → «Salir» en el capítulo: sin ✓ y con el mazo de verdad;
    - el hub → la ruta entera: los siete pasos del capítulo, «Salir» arriba y «Siguiente» al final; el puente medido; «Jugar»; la guiada entera; el cierre pagado con «+2.000 HC»;
    - la red: solo las dos llamadas que la app hace al cambiar de pantalla y una `cobrar_guiada`.
  - **Contexto B, con la oferta ya hecha:** el hub → la ruta → «Salir» en el puente: lobby, `vistos` = [2] y sin oferta. Después el hub abre la mesa directamente, sin pasar por la ruta.
  - **Control rojo:** `TUT_CONTROL=caja-salta` oculta las piezas sin reservar su caja, y `tut.delta` sale roja en los cuatro tamaños.
- **`tut.pastilla`** (`tut guiada`): el espía de la página guarda cada `.tm-pastilla` (texto, líneas por `Range` y si cabe). Al cierre, las tres tienen que ser exactamente las de la v1.6, en una línea y dentro de la pantalla. Antes de la tanda 6 la guiada daba dos pastillas («Mano 2 · Es Mano IA 1», «Mano 3 · Es Mano IA 2»), así que la comparación con la lista exacta sale roja.
- **`tut menu`, arreglo del andamio:** en una corrida, la mano real de 3 contra las IAS dejó en la fila solo «All-in» y «Retirarse»: una IA apostó más que la pila y la vara no tocaba ninguno de los dos. Es la misma clase de rojo que `tut.puerta` tuvo en la tanda 5. Se arregló con `turno()`, que elige dentro de la fila de acciones: pasar, igualar y, si no hay ninguno, all-in antes del descarte y retirarse después. Desde entonces sale verde.
- **La guardia de `dist/`** (`testDistSinMoldes`):
  - obligatorias nuevas: `tut.ruta.intro.titulo`, `tut.ruta.puente.titulo` y `ruta-empecemos`;
  - prohibida nueva: `tut-diag`, el id de la caja del diagnóstico, que ya no existe.

---

## 3 · El STOP-T (Victor en el S25, 2026-11-24 y 25)

- **Dos compilaciones del mismo árbol**, aparte de `dist/` y con `VITE_TUT_DIAG=1`, en el preview de 4174 con túnel. La segunda fue tras un apagado de la PC. Sin commits.
- **Aprobada sin correcciones a la ruta.** Victor la recorrió así:
  - entera, con una cuenta nueva de otro dominio (`tutorial2511`): la tarjeta con 2.000 → la intro → el capítulo 2 → el puente → la guiada → «+2.000 HC». En la base, `premios_guiada` con tramo limpio y 2.000, y en `movimientos` el `saldo_tras` en 4.500;
  - «Salir» en la intro y en el puente;
  - el acostado;
  - `test1976`, directo a la mesa.
- **Las dos frases partidas**, nota v1.6 en los textos. En 360 de ancho las dos daban tres líneas; la de la intro, también en 640 y 780.
  - **Intro:** la caída que la ficha ya preveía. «**Reúne cartas del mismo palo** para sumar más que los demás.» y, en línea pequeña, «Oros, copas, espadas o bastos.».
  - **Puente:** sin cambiar una palabra. «**Tres manos para que aprendas haciendo.**» y, en línea pequeña, «Tú solo tocas lo que se ilumina.».
- **Una corrección de texto en la guiada:** la pastilla entre manos (§1.5). Victor no pidió otro túnel: la verá en ajilei.io.
- **El diagnóstico sale (6-b).** El registro de la tanda 5 (`VITE_TUT_DIAG`) se quitó entero de `Capitulo.jsx`: la caja, el oyente de errores, la espera del ancla y la suspensión. Quedan la red del capítulo (`Suspense` sin respaldo y `RedCapitulo`), que es producto. En el repositorio no queda ninguna referencia a la bandera, salvo la línea que cuenta su salida, y `dist/` no lleva `tut-diag` (lo vigila la guardia).

---

## 4 · Las varas

Todas sobre el árbol final de 6-b, en serie con el orquestador (`--solo`), que compila `dist/` primero (sin `VITE_TUT_DIAG`). El 4173 no se tocó.

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 119 archivos, 3 200 pruebas, verde | Incluye `guia.test` (la ruta corre hasta el ✓ del 2, también con el almacén roto), `guiaManos.test` (la pastilla de las tres manos), `textos.test` (con la ruta y la pastilla en la suma), `testDistSinMoldes` (`tut-diag` prohibida), `testClavesAlmacen` (sin claves nuevas), `testInvariantes` y `orquesta.test` |
| `1.8b` | 180,1 KiB, verde | Igual con y sin el diagnóstico |
| `diagDSK tut` | 0, 9 s | — |
| `diagDSK tut` guiada | 0, 1 min 37 s | Con `tut.pastilla`: las tres pastillas exactas, una línea y dentro, en 360×640, 640×360 y 1920×1080 |
| `diagDSK tut` puerta | 0, 55 s | Con `vistos: [2]` en el hub |
| `diagDSK tut` temas | 0, 22 s | Con su guía sin ✓ |
| `diagDSK tut` menu | **1 → 0** | En la serie, la celda 1920×1080 se cortó esperando un selector (30 s), y la vara solo guardaba las dos primeras líneas del error, sin decir cuál. **Andamio, mejorado:** si el recorrido se corta, ahora dice la etapa y los botones de la fila de acciones. Repetida nueve veces, con fotos del corte por si salía: verde las nueve, en 40–44 s. Sin causa a la vista. La hipótesis es la misma clase de barajado del arreglo de esta tanda: un all-in antes del descarte que pierde la pila y deja la mesa sin «Siguiente mano». No se reprodujo |
| `diagDSK tut` ruta | 0, 1 min 50 s | Cuatro tamaños; control `caja-salta` rojo (corrido en el STOP-T) |
| `diagDSK lec` (lec.mapa) | 0, 46 s | — |
| `diagDSK msg` | 0, 19 min 20 s | Verde, también el barrido «Heptacoins» (en la tanda 5 salió 1 por la excepción de INV-22) |
| `diagPUE cap` | 0, 2 min 36 s | Sin resellar |
| `diagDSK lob` | 0, 42 s | — |
| `diagDSK cfg` | 0, 7 min 41 s | — |
| `diagDSK apu` | 9 de 9 con código 0 | Las siete celdas, rec2 y voz3; por la pastilla |
| `diagDSK h1` | mesas 5, 4, 3 y 2 con código 0 | Por la pastilla |
| `diagDSK z1` | 0, 10 min 53 s | Por la pastilla |
| `diagDSK rec` | 0, 16 min 43 s | Por la pastilla |
| `diagDSK pvp` (pvp.mesa) | 0, 7 min 27 s | Por la pastilla: la mesa entre personas sigue con su pastilla |

La serie corrió entera sobre el árbol final, unas 2 h 10 min: 31 corridas, con el build. Después solo cambiaron el rastro de `tut menu`, la prohibida `tut-diag` de la guardia y los documentos. Por eso se repitieron `tut.menu` (nueve veces), eslint, vitest y `1.8b`.

---

## 5 · Lo que no se hizo

- **El cierre de la ficha §5:** el control de las IAS en ventana oculta, el push de `main`, borrar el respaldo, ajilei.io y `completo`. Lo hace Victor; el comando del control va con el STOP-C.
- **Las dos citas de la v1.4 que dejó la tanda 5:**
  - la cabecera de la migración `20261121150000_tut1_guiada.sql` (aplicada en la nube) se queda así;
  - el comentario de `GameTable.jsx` («normativo v1.4 §1.6») también, aunque esta tanda toca el archivo: el permiso era mínimo y para la pastilla.
- **Lo que el arnés no puede medir:** el S25 y Safari. La revelación con las fuentes del aparato la vio Victor, y la pastilla la verá en ajilei.io.
- **iOS (INV-41):** nada validado en un iPhone. Si alguien abre la ruta en Safari, hay que mirar el `fixed` de las dos pantallas con la barra de Safari y la revelación con `prefers-reduced-motion`. Va en la lista del cierre de TUT-1, §6.

---

## 6 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **6-a** la ruta y la pastilla | `src/guia/Ruta.jsx` · `src/guia/RutaIntro.jsx` · `src/guia/RutaPuente.jsx` · `src/styles/ruta.css` · `src/App.jsx` · `src/screens/Guiada.jsx` · `src/guia/Capitulo.jsx` (con `enRuta`; **todavía con el diagnóstico**, versión intermedia) · `src/guia/MuestraCartas.jsx` · `src/components/CapaSenal.jsx` · `src/lib/guia.js` · `src/lib/guia.test.js` · `src/config/textos.tut.es.js` · `src/lib/guiaManos.js` · `src/lib/guiaManos.test.js` · `src/components/TransicionMano.jsx` · `src/components/GameTable.jsx` |
| **6-b** las varas, el diagnóstico fuera y los documentos | `src/guia/Capitulo.jsx` (sin el diagnóstico) · `scripts/tut/ruta.mjs` · `scripts/tut/guiada.mjs` · `scripts/tut/menu.mjs` · `scripts/tut/puerta.mjs` · `scripts/tut/temas.mjs` · `scripts/tut/montaCapa.mjs` · `scripts/arnes/comun.mjs` · `scripts/arnes/orquestaCore.mjs` · `scripts/arnes/orquesta.test.js` · `scripts/diagDSK.mjs` · `scripts/testDistSinMoldes.test.js` · `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T6_Informe_v1.0.md` · `docs/reportes/AJILEI_TUT-1_Cierre_v1.0.md` |

**Dos movimientos respecto de la ficha §4:**

- **La pastilla va en 6-a,** con la ruta: es producto y comparte `textos.tut.es.js` y `Guiada.jsx`.
- **`Capitulo.jsx` va en los dos commits:** en 6-a con `enRuta` y el diagnóstico, y en 6-b sin el diagnóstico (lo pidió Victor). La versión de 6-a se guarda aparte y entra en el índice sin tocar el árbol.
