# AJILEI · TUT-1 · Tanda 5 · La app · Informe · v1.0

- **Fecha:** 2026-11-24. **Base:** `1c0303f` (tandas 1 a 4, sin push de `main`; respaldo `respaldo-tut-1`).
- **Ficha:** `AJILEI_TUT-1_T5_v1.0.md`, con las cinco decisiones de §P confirmadas por Victor. **Normativo:** `AJILEI_Tutorial_v1.5.md`, que entra en esta tanda (5-c) y sustituye a la v1.4. Recoge lo que se decidió en el STOP-T: la barra alterna, «Cerrar» corrido, «En el lobby» desde el ⋮, el capítulo 8 de seis pasos, la escalera a 14 px y la colocación única por paso.
- **Lo que esta tanda no hace** (lo dijo el rector al abrirla): la **ruta de la primera vez** (v1.5 §1.2.1) y el **cierre de la ficha §5** (el control de las IAS, el push de `main`, ajilei.io). Los dos son de la tanda 6. Por eso este es el informe de la tanda 5 y no el de cierre de TUT-1 (`AJILEI_TUT-1_Cierre_v1.0.md`, ficha §1.5), que se escribe con la tanda 6.
- **Protegidos:** no se abrió ninguno; el motor, la IA, la baraja, los asientos, los pozos y sus dos hojas de estilo solo se ejecutan. `GameTable.jsx` no se tocó.
- **Nube:** nada. Ninguna migración, ninguna Edge Function, sin deploy. Un capítulo no llama al servidor (`tut.red`, `tut.app`).
- **Lo visible para el jugador:**
  - «Aprender por tema» abre los diez capítulos; «Pronto» queda solo en «Pregúntale a Mia»;
  - los capítulos 7, 8 y 9 se posan, con velo, aro y burbuja, sobre las pantallas de verdad (Retar, Salas, Armar mesa, el lobby): la app navega sola de una a otra y nada se toca por el hueco;
  - el 9.5 y el 10 van sobre la mesa de la guiada congelada (mano 3, paso 3); el 10.1 enseña la escalera de la apuesta como muestra;
  - desde el ⋮ de una mesa, el 7, el 8 y el 9 dicen «En el lobby» y no se abren; el 10 sí.

---

## 1 · Lo que se construyó

### 1.1 Los capítulos 7 a 10 (`src/guia/capitulos.js`)

- **Un paso de la Pista C lleva `pantalla`**: el nombre de `screen` de `App` (`lobby`, `retar-ias`, `sala-opciones`, `armar-mesa`). En lugar de un momento de la guiada, el paso se posa sobre esa pantalla viva. El ayudante `en(pantalla, ancla, clave)` los escribe en una línea.
- **`PANTALLAS`**: la marca de cada pantalla (está montada cuando esa marca existe). Con la pantalla montada y sin el ancla del paso, el paso cae a la tarjeta (§1.2).
- **Los pasos**, con los rótulos de la v1.5 §2.2:
  - el 7 (cuatro, en Retar): las filas del reto, la apuesta y la entrada, y «Sentarme a la mesa»;
  - el 8 (seis): lobby → Salas → Armar mesa (tres pasos) → Salas;
  - el 9 (cinco): cuatro en el lobby (la píldora, el ⚙, Rankings, la tienda) y el ⋮ cerrado de la mesa congelada;
  - el 10 (cinco): la escalera y cuatro consejos en tarjeta sin ancla.
- **`DE_LA_APP`**: los capítulos que navegan por la app (7, 8 y 9). Sale de los datos (los que tienen algún paso con `pantalla`), no de una lista escrita a mano.

### 1.2 El capítulo sobre la app (`src/guia/Capitulo.jsx`, `src/guia/vuelta.js`, `src/App.jsx`)

- **Navegar sin escribir.** El paso llama a `onPantalla(destino)` (el `setScreen` de `App`) y nada más. Ningún botón de la pantalla se toca. `App` pinta el capítulo **encima** de la pantalla viva, dentro de `conVideo`. Todo capítulo empieza en la rama `capitulo`, que ya resolvió el `lazy` del trozo de la guiada, así que no hace falta otra espera (`1.8b`, §1.7).
- **El paso en curso, entre pantallas.** Cada pantalla monta un `Capitulo` nuevo, que sigue por el paso del anterior. Ese paso lo guarda `vuelta.js` (`pasoEnCurso`, `anotarPaso`, `soltarCapitulo`, `hayCapitulo`), no `App`.
- **El lobby calla.** Con un capítulo abierto, `PuertaGuiada` no saca la oferta ni reintenta el premio (`hayCapitulo()`).
- **Al cerrar o terminar**, la app vuelve a «Cómo se juega» y abre el índice. Su casa lleva al lobby sin capa, sin sala y sin mesa.
- **El ancla a la vista** (`useALaVista`). `.sal-cuerpo` desplaza y su pie (`.sal-accion`) es fijo. Al montar el paso, el cuerpo se desplaza una vez para que el ancla quede entera por encima del pie. Un ancla que aun así no cabe se queda sin hueco y el paso va a la tarjeta.
- **El ancla que no llega no deja la pantalla vacía** (STOP-T, ronda 1). Si la pantalla del paso está montada y el ancla no, el paso cae a la tarjeta **sin flecha** y el capítulo sigue. `tut.app` lo marca rojo, porque un ancla que falta es un defecto aunque el jugador no se quede atascado.
- **La red del capítulo** (ronda 1). `Capitulo` lleva su propio `Suspense` y un límite de error (`RedCapitulo`). Hasta entonces la única espera era la de la raíz, pintada en verde: una suspensión dentro de un capítulo habría dejado la pantalla en verde. Si algo falla dentro de un capítulo, el límite cierra el capítulo y vuelve al índice: nunca una pantalla vacía.

### 1.3 La capa en la Pista C (`src/components/CapaSenal.jsx`, `capaSenalCore.js`)

- **La barra alterna** (excepción escrita en la v1.5 §2.1). La barra «Volver · Siguiente» sigue fija. En la Pista C, si en un paso su esquina pisara el hueco del ancla, va a la esquina opuesta durante ese paso. Dentro del paso no se mueve.
- **«Cerrar» corrido.** Si el ancla vive arriba a la derecha (el ⚙ del lobby, el ⋮ de la mesa), «Cerrar» se corre a la izquierda del ancla, en su misma fila, solo en ese paso. Nunca baja: bajando pisaba la tarjeta.
- **La colocación única por paso** (ronda 2, §3). `colocarPaso` es una función pura de `capaSenalCore.js` y coloca en orden la barra, «Cerrar» y la burbuja o la tarjeta. Sus entradas son fijas:
  - los rectángulos de las anclas y de los otros controles, y la ventana;
  - los **tamaños** de lo propio: la barra, la burbuja y la tarjeta medidas en copias invisibles;
  - el sitio natural de «Cerrar», sacado de su CSS y no de donde quedó pintado.

  En los capítulos (barra fija y velo) la capa mide una vez por paso y por texto. Después solo vuelve a medir cuando cambia algo de **fuera** (la ventana, el DOM de la pantalla); lo que la capa escribe en sí misma no pide otra medida. La guiada y las señales siguen por su camino de siempre.

### 1.4 La escalera (`src/guia/MuestraCartas.jsx`, `src/styles/muestra.css`)

- Una muestra `tipo: 'escalera'`: seis filas y dos columnas («Lo que tienes» → «Lo que haces»), con el molde del cierre de la guiada.
- La letra es `clamp(13px, 3,9vw, 15px)`, que da 14 px en 360 de ancho, y ninguna celda parte su línea. La segunda columna va en oro y negrita.
- La caja mide `width: max-content`: con `left: 50%` encogía a media ventana.

### 1.5 El índice y el ⋮ (`src/guia/ListaTemas.jsx`)

- **El índice:** las diez filas abren; «Pronto» queda en Mia.
- **El ⋮ de la mesa:** en la capa del índice, las filas de `DE_LA_APP` no se abren (sacarían al jugador de la mesa). Dicen «En el lobby» en el sitio del ✓ (`tut.temas.enlobby`).

### 1.6 Las anclas de la app

| Pantalla | Ancla | Cómo |
|---|---|---|
| Retar (7.1–7.3) y Armar mesa (8.3–8.4) | Las filas de chips | `data-ancla` en la sección de `FilaChips` (su `accion`: `reto`, `apuesta`, `entrada`, `jugadores`, `ritmo`) |
| Retar (7.4) y Armar mesa (8.5) | El botón anclado al pie | `.sal-cta` dentro de su pantalla, también en las dos columnas de INV-55 |
| Salas (8.2) | «Armar mesa» | El `data-accion="armar"` que ya tenía |
| Salas (8.6) | «Entrar por código» | `data-ancla="codigo"` en el bloque 1 de `SalaOpciones` |
| Lobby (8.1, 9.1–9.4) | PvP, la píldora, ⚙, Rankings, la tienda | Sus `data-accion`, y la píldora por su clase `.lob-pildora` |
| Mesa congelada (9.5) | El ⋮ | El `data-ancla="menu"` de la tanda 1 |

- **Solo atributos, sin CSS** (INV-89; `tut.delta` mide Δ 0 debajo de la capa).
- **La píldora va por su clase y no por un atributo nuevo:** un `data-ancla` en la barra del lobby viaja en la entrada y subía `1.8b` a 180,1 (§4).

### 1.7 Los textos y el peso

- **Los textos:** 20 rótulos de los capítulos 7 a 10, los de la escalera y `tut.temas.enlobby`, en `textos.tut.es.js` (trozo diferido), tal como los dice la v1.5. Ninguno pasa de dos líneas en 360 × 640 (`tut.lineas`).
- **`1.8b` = 180,0 KiB**, igual que en la tanda 4: la entrada no crece (gzip de `index-*.js`, 156,85 kB). Lo nuevo viaja en el trozo de la guiada.

---

## 2 · Las decisiones de §P, como quedaron

| | Decisión | Cómo quedó |
|---|---|---|
| P-1 | El 8 no entra a la sala de espera | Así. En la ronda 1 su paso 3 se partió en dos («Cuántos juegan y cuánto se apuesta.» / «Y el ritmo: Normal o Rápido.»): en el acostado los tres mandos no caben a la vez. **Seis pasos** (v1.5) |
| P-2 | El hueco no deja pasar ningún toque | En los diez capítulos. `tut.app` toca el centro de cada ancla: cae en el velo. El toque del 7.4 en «Sentarme a la mesa» no llama a nada y no saca de Retar |
| P-3 | La escalera es una muestra | Así, con la letra a 14 px en 360 (punto 5 de la ronda 1) |
| P-4 | El 9.5, el ⋮ cerrado sobre la mesa congelada | Así: la mesa guiada ya pinta el ⋮ |
| P-5 | Sin `completo` antes de la ola 0 | Sin cambio: lo lanza Victor tras el push (tanda 6) |

---

## 3 · El STOP-T (Victor en el S25, 2026-11-23 y 24)

Cuatro vueltas, más una quinta compilación del mismo árbol (2026-11-24) tras un apagado de la PC. Sin commits hasta el visto bueno.

**Ronda 1.**
- **Aprobados:** los capítulos 7, 8 y 10, y cuatro puntos: la barra alterna (como excepción, que la v1.5 escribe), «Cerrar» corrido, «En el lobby» desde el ⋮ y la escalera a 14.
- **Defecto:** del 9.1 al 9.2 la pantalla se quedaba **en verde** en el S25. Aquí no se reprodujo, ni con el banco imitado en 412×915 ni con el bundle real en 412×915, 846 y 780.
- **Se pusieron** la red del capítulo (§1.2) y la regla del ancla que no llega, y se partió el 8.3.
- **Para ver la causa en el aparato,** el build del túnel se compiló con `VITE_TUT_DIAG=1`, que pinta en pantalla lo que falla.
- **`tut.app` ganó la celda S25 (412×915):** un lobby de cuenta sembrada, con la constancia que cobra al llegar y su ficha, el saldo recordado distinto del real y la bandera.

**Ronda 2. La causa: React #185** («Maximum update depth exceeded»), en la foto del S25.
- **El bucle:** `CapaSenal` medía tras **cada** pintada y leía lo que ella misma había pintado (el desvío de «Cerrar» por su `data-dx`, el tamaño del rótulo ya colocado). Con las fuentes del S25, dos colocaciones se alternaban sin fin, React cortaba el bucle con un error no atrapado y el árbol se desmontaba entero.
- **El verde** era el fondo de la página sin nada encima.
- **El arreglo** es el que prescribió Victor: la colocación única por paso (§1.3), una función pura con su prueba (`capaSenalCore.test.js`: la barra alterna, el desvío de «Cerrar», la misma salida para la misma entrada).
- **Los controles rojos nuevos de `tut.app`:**
  - un contador de pintadas por paso (`__tutPintadas`, solo en desarrollo; tope 12; la corrida real da 5 como mucho);
  - cualquier error de consola dentro de un capítulo es rojo;
  - `TUT_CONTROL=vaiven` alterna el ancho de la ventana 20 veces en el 9.2: 25 pintadas, roja.
- **La celda S25** suma un nombre de 15 letras, el ojito, un saldo de cinco cifras (20.900) y la ficha de la constancia.

**Ronda 3.**
- **Aprobado:** el 9 «perfecto», y los capítulos 1 a 6 y el 10 bien.
- **Lo que quedaba:** en el 7 y el 8, la caja del diagnóstico asomaba un instante.
- **Victor pidió no suponer:** la caja pasó a ser un **registro** de los diez últimos eventos (milisegundo, paso y qué pasó), fuera de React y a la vista hasta su «Cerrar». Anota cada navegación, la espera del ancla y lo que tarda, el ancla perdida, la suspensión, el error atrapado y los errores de ventana y de consola.
- **Aquí,** con el bundle real y una sesión simulada (412×846, el 7 y el 8), el registro solo dio esperas de 3 a 19 ms.

**Ronda 4. Aprobado** (2026-11-24).
- **Las ocho fotos de Victor** (capítulos 1, 2, 3, 6, 7, 8, 9 y 10, en vertical y en acostado) solo registran cuatro cosas: «monta el capítulo», «navega», «espera el ancla · pantalla montada» y «ancla a la vista tras 7–13 ms». Ninguna línea de error, de suspensión ni de ancla perdida.
- **El relámpago del 7 y el 8** era la espera normal del trozo de Retar y de Salas. La caja de la vuelta anterior se pintaba en línea en cada espera.

**El diagnóstico fue un instrumento temporal.**
- **El build de esta tanda va sin `VITE_TUT_DIAG`.** El código queda en `Capitulo.jsx` detrás de esa bandera, y sin ella el bundle no lleva nada: en `dist/`, ningún trozo contiene `tut-diag` ni las frases del registro, y `1.8b` sigue en 180,0. Sirve para el túnel de la tanda 6.
- **Si se prefiere fuera,** se quita entero en 5-a.

---

## 4 · Lo que salió al construirla

- **En el acostado las anclas quedaban bajo el pie fijo de Salas** (`.sal-accion`) o fuera de la vista: `useALaVista` desplaza el cuerpo una vez por paso (§1.2).
- **La barra tapaba un ancla de abajo** (Retar en el acostado): de ahí la esquina alterna. Queda una nota, no un rojo: en el 8.3 a 640×360 la barra pisa 230 px² del aro y no hay esquina libre; el paso va a la tarjeta, que es lo que la v1.5 prevé.
- **Otro paso que va a la tarjeta** (nota de `tut.temas`, no rojo): el 9.1 en 780×360.
- **«Cerrar» tapaba el ⚙ del 9.2:** de ahí el desvío a la izquierda. Una primera versión lo bajaba y pisaba la tarjeta.
- **`1.8b` llegó a 180,1:**
  - por un `data-ancla` en `BarraSuperior` y un envoltorio de espera sobre la capa: los dos viajaban en la entrada;
  - la píldora va por su clase, y la capa por la rama `capitulo`, que ya tiene el trozo.

  Vuelve a 180,0.
- **El banco imitado expone `constancia` y `perfil` solo para leer.** La siembra de la celda S25 va por las opciones de `crearBanco`, con el mando `?lobby=cuenta` de `billeteraFalsa.js` (solo en desarrollo, detrás del bypass). El nombre y el saldo los pone el banco, no `useAuth`.
- **El primer control de vaivén** (mover la capa con `transform`) no provocaba ninguna pintada y salía verde sin medir nada. Se cambió por veinte cambios de ancho de la ventana.

---

## 5 · Las varas

Todas sobre el árbol final, en serie con el orquestador (`--solo`), que compila `dist/` primero (sin `VITE_TUT_DIAG`). El 4173 no se tocó.

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 119 archivos, 3 193 pruebas, verde | Incluye `capaSenalCore.test` (la colocación de un paso), `testDistSinMoldes` (las tres cadenas nuevas obligatorias: `tut.cap7.p1`, `tut.escalera.1.a`, `data-ancla="codigo"`), `testInvariantes` (con la v1.5 y la fila nueva de §4) y `orquesta.test` |
| `1.8b` | 180,0 KiB, verde | Entrada 156,85 kB gzip, igual que la tanda 4. Ningún trozo de `dist/` lleva la caja del diagnóstico |
| `diagDSK tut` | 0, 10 s | — |
| `diagDSK tut` guiada | 0, 1 min 37 s | — |
| `diagDSK tut` puerta | **1 → 0** | La primera pasada se cortó en las señales de primera vez (T1 y T6): en la mano real contra las IAS la vara tocó «All-in» (su orden: pasar, igualar, all-in, retirarse), perdió la pila y la mesa volvió a Retar sin «Siguiente mano». Depende del barajado: la misma vara, sobre el mismo código, salió verde el día anterior. **Andamio, arreglado:** tras ver el descarte la vara se retira antes que ir all-in (`scripts/tut/puerta.mjs`). Repetida: verde en T3, T6 y T1, 55 s |
| `diagDSK tut` temas | 0, 21 s | Diez capítulos en 360×640, 640×360, 780×360, 1920×1080 y la celda S25 (412×915, sembrada: la constancia cobra al llegar y sale su ficha). Pintadas: como mucho 5 por paso en las cinco celdas. Notas: la barra alterna en el 7.4, el 8.2, el 8.5, el 8.6, el 9.1, el 9.3 y el 9.4 según el tamaño; «Cerrar» corrido en el 9.2 y el 9.5; a la tarjeta, el 8.3 (640×360, con barra∩aro de 230 px² y ninguna esquina libre) y el 9.1 (780×360) |
| `diagDSK tut` menu | 0, 44 s | — |
| `diagDSK lec` (lec.mapa) | 0, 42 s | — |
| `diagDSK tam` | 0, 5 min 07 s | Las pantallas de INV-55 con las anclas nuevas |
| `diagDSK lob` | 0, 42 s | — |
| `diagDSK retar` | 0, 27 s | — |
| `diagDSK cfg` | 0, 7 min 46 s | — |
| `diagSAL sal` | 0, 2 min 16 s | — |
| `diagPUE cap` | 0, 2 min 36 s | Sin resellar |
| `diagDSK u1` | 0, 14 min 41 s | — |
| `diagDSK menu-movil` | 0, 7 min 49 s | — |
| `diagDSK pvp` (pvp.mesa) | 0, 7 min 29 s | — |
| `diagDSK z1` | 0, 10 min 51 s | — |
| `diagDSK rec` | 0, 14 min 25 s | — |
| `diagDSK msg` | 1 (dos veces) | Solo por el barrido «Heptacoins» con 0 medidas; compositor 92 casos, jugado 7/7, fin 1/1, Δ larga 7/7 y caza 2/2 en verde. Es la excepción escrita de INV-22: «un rojo solo por barrido … 0 medidas, con el resto verde, no es una regresión». En la tanda 4 salió verde |
| `diagDSK h1` | mesas 5, 4, 3 y 2 con código 0 | — |
| `diagDSK apu` | 9 de 9 con código 0 | Las 7 celdas, rec2 y voz3 |

La serie entera corrió sobre el árbol final (33 corridas, unas 2 h 50 min). Después se repitieron eslint, vitest, el build, `1.8b`, `tut.puerta` (con la vara arreglada) y `msg`. Entre la serie y la repetición solo cambiaron la vara de `tut.puerta`, el número de paso en un comentario de `SalaOpciones.jsx` (de 5 a 6) y los documentos.

---

## 6 · Lo que no se hizo

- **La ruta de la primera vez** (v1.5 §1.2.1): la construye la tanda 6.
- **El cierre de la ficha §5** (el control de las IAS en ventana oculta, el push de `main`, borrar el respaldo, ajilei.io, `completo`): tanda 6. El comando del control va con el STOP-C de esta tanda.
- **El informe de cierre de TUT-1:** con la tanda 6.
- **Dos citas de la v1.4 que se quedan:**
  - el comentario de `GameTable.jsx` (las señales de primera vez, «normativo v1.4 §1.6»), para no meter `GameTable.jsx` en una tanda que no lo toca;
  - la cabecera de la migración `20261121150000_tut1_guiada.sql`, que ya está aplicada en la nube.

  Las demás pasan a la v1.5 en 5-c.
- **Lo que el arnés no puede medir:** el S25 real y Safari. Las fuentes del S25 dan otros tamaños que las de Windows, y por eso el #185 no se reprodujo aquí. Desde esta tanda, `tut.app` cuenta las pintadas por paso, de modo que un bucle así ya sale rojo con cualquier fuente.

---

## 7 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **5-a** los capítulos 7 a 10 | `src/guia/capitulos.js` · `src/guia/Capitulo.jsx` · `src/guia/vuelta.js` · `src/guia/ListaTemas.jsx` · `src/guia/MuestraCartas.jsx` · `src/styles/muestra.css` · `src/config/textos.tut.es.js` · `src/components/CapaSenal.jsx` · `src/components/capaSenalCore.js` · `src/components/capaSenalCore.test.js` · `src/components/FilaChips.jsx` · `src/screens/SalaOpciones.jsx` · `src/screens/IndiceTemas.jsx` · `src/components/PuertaGuiada.jsx` · `src/App.jsx` |
| **5-b** las varas | `scripts/tut/temas.mjs` (diez capítulos y `tut.app`) · `scripts/tut/puerta.mjs` (el turno tras el descarte: retirarse antes que el all-in, §5) · `scripts/testDistSinMoldes.test.js` · `scripts/arnes/orquestaCore.mjs` · `src/dev/bancoImitado.js` · `src/dev/billeteraFalsa.js` (la siembra de la celda S25) |
| **5-c** documentos | `docs/AJILEI_Tutorial_v1.5.md` (entra) · `docs/AJILEI_Tutorial_v1.4.md` (`git rm`) · `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T5_Informe_v1.0.md` · los punteros a la v1.5 en los archivos que solo cambian por eso: `src/components/GuiaControl.jsx` · `src/components/OfertaGuiada.jsx` · `src/components/SenalesPrimeraVez.jsx` · `src/guia/momento.js` · `src/lib/guia.js` · `src/lib/guiaManos.js` (fuera del bloque de órdenes) · `src/lib/guiadaApi.js` · `src/screens/CierreGuiada.jsx` · `src/screens/ComoSeJuega.jsx` · `src/screens/Guiada.jsx` · `src/styles/comoSeJuega.css` · `src/styles/ofertaGuiada.css` · `src/styles/senal.css` · `src/styles/temas.css` · `scripts/guia/buscarOrdenes.mjs` · `scripts/testClavesAlmacen.test.js` · `supabase/pruebas/tut1_verificacion.sql` |

**Dos movimientos respecto de la ficha §4:**

- **Los punteros de los archivos que 5-a ya cambia** (`CapaSenal.jsx`, `capaSenalCore.js`, `PuertaGuiada.jsx`, `ListaTemas.jsx`, `IndiceTemas.jsx`) van en 5-a con el resto del archivo. Sus comentarios apuntan a la v1.5 dos commits antes de que entre; no se parten en versiones intermedias por un comentario.
- **La siembra del banco imitado** (`bancoImitado.js`, `billeteraFalsa.js`) va en 5-b, con la vara que la usa. Es código de desarrollo, detrás del bypass; el árbol de 5-a no la necesita.
