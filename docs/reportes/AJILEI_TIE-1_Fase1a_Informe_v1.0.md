# AJILEI · TIE-1 · Fase 1a · Informe · v1.0

**Ficha:** `AJILEI_TIE-1_Fase1a_v1.0.md` · **Base:** `main` en `2a9857e`. Sus commits, los SHA y las pruebas aisladas: ficha `AJILEI_TIE-1_Commits1a_v1.0.md`.
**Estado:** 1a-i cerrada (guion 23/23 en la base real) · 1a-ii aprobada en el STOP-A2 (D-7…D-16) · 1a-iii aprobada en el STOP-A3 (D-17…D-20, O-1 = a) y cerrada en verde tras sus ajustes (§3.8) · pruebas A, B y C de Victor al 100 % (§4). Esta ficha no hizo commits: ver la ficha de commits.

---

## 1. 1a-i · Servidor (cerrada)

- **Migración** `supabase/migrations/20261031150000_tie1a_inventario.sql`. Contiene:
  - la tabla `inventario`, con FK en cascada a `auth.users`, el índice único parcial «uno en uso por tipo» y RLS con una sola política de lectura;
  - el catálogo interno: `inventario_tipo_valido`, `precio_articulo`, `articulo_con_tonos` y `articulo_gratis`;
  - las cuatro RPC: `comprar_articulo`, `usar_articulo`, `elegir_tono` y `mi_inventario`.
- **Guion** `supabase/pruebas/tie1a_verificacion.sql`, con 23 filas (A1–A5, B1–B17 y B3b), registrado en `scripts/eco/guionesCore.mjs`.
- **Corrida real** (SQL Editor, tras el `db push` de Victor, guardada como «TIE-1 1a · verificación»): **23/23 PASA**.
- **Mutaciones** (`laminas/tie1a/_muta.mjs`): 11 mutaciones, cada una en rojo en la fila que la vigila. La m9 quita la comprobación de «ya comprado» y el guion sigue verde, porque la clave del libro basta sola (el doble cerrojo).
- **Desviaciones aprobadas por el rector en el STOP-A1 (D-1…D-6):**
  - D-1: la clave del libro lleva al jugador, `compra:<jugador>:<tipo>:<artículo>`, porque `clave_idem` es única en todo el libro.
  - D-2: motivos `sin_sesion` y `limite`, y `no_existe` en `usar_articulo` y `elegir_tono`.
  - D-3: cerrojo `for update` sobre la billetera del jugador.
  - D-4: el catálogo SQL no se concede al cliente.
  - D-5: comprar el verde devuelve `no_existe`.
  - D-6: el guion vive en `supabase/pruebas/`.
- **Ajuste A-1 del rector:** si el libro dice `'repetido'` y falta la fila, la compra la repara sin cobrar y devuelve `ok` («el doble cerrojo se repara solo»). Lo prueba la fila B3b.

## 2. 1a-ii · La tienda (STOP-A2, aprobada)

### 2.1 Qué hay

| Pieza | Archivo |
|---|---|
| Tonos, fuente única | `src/styles/tapetes.css`: §1 pasa a `:is(body, .vit)` y entra el §1b con los seis bloques de tono y `--luz-k`, copiados tal cual de `laminas/tie1a/tonos.css`. Se quita el §2 (entrada del ⋮ y panel). |
| Luz de la vitrina | `src/styles/luz.css`: §0 para `.vit .vit-fondo` (foco a 9cqw, `--luz-k` heredado de `.vit`), §2 con el tricolor de `.vit-mesa`, §3 con los reflejos y el riel a escala de `.vit-ovalo`. |
| Vitrina | `src/components/Vitrina.jsx` y `src/styles/vitrina.css`: tamaños `grande`, `muestra` y `disco`. No importa `GameTable` ni `gameTable.css`. |
| Canal de tapetes | `src/lib/controlTapetes.js`, uno por carga en `App`. El servidor manda y la foto cambia solo con su `'ok'`. |
| API | `src/lib/tiendaApi.js`, con las cuatro RPC; un fallo devuelve `null`, nunca lanza. |
| Núcleos puros | `src/hooks/tapetesCore.js` (`desdeInventario`, `atributosTapete`, `normalizarTono`; sin compra local) y `src/hooks/tiendaCore.js` (vista del artículo, desenlace de cada motivo, estantes). |
| Hook | `src/hooks/useTapetes.js`: la copia del aparato (`ajilei.tapete`, `ajilei.tapete.tono`, el legado que se borra) y `useTapeteEnMesa`, que pone `data-tapete` y `data-tapete-tono` en `body`. |
| Pantalla | `src/screens/Tienda.jsx` y `src/styles/tienda.css`: V2-B, V3-A, V4-A con muestras redondas y V5-A, sobre `PantallaChips` y dentro de `MarcoVideo`. |
| Navegación | `App.jsx`: pantalla `'tienda'` (estante inicial, flecha a la pantalla de origen, casa al lobby) e inventario releído al entrar con sesión. `MarcoVideo`: el «+» abre la tienda en Monedas y la hoja ya no se monta. |
| Mesa | `GameTable.jsx` lee el canal (`useTapeteEnMesa`). El ⋮ pierde «Tapetes»: `UtilitiesMenu.jsx`, `menuEntradas.js` y `useUtilitiesMenu.js` (sin `ALTO_TAPETES`). |
| Bypass | `dev/bancoImitado.js` (inventario y las cuatro RPC del SQL) y `dev/billeteraFalsa.js` (mandos `?tie=vacia`, `comprado`, `sin-saldo`, `error`, `ojito`). |
| Banda B | `salas.css` §16: `:not(:where(.es-tienda))` en la rejilla y `.es-tienda` en la lista «las demás», sin subir la especificidad. |
| Textos | `tie.*` en `textos.es.js`, con el prefijo declarado en `textos.test.js`. |
| Arnés | `scripts/tie/tienda.mjs`, modo `diagDSK tienda`, registrado en `diagDSK.mjs` y en `arnes/nucleo.mjs`; entra en `humo`. |

### 2.2 Medidas

- **`diagDSK tienda`: verde** (código 0, aislamiento verde, 28 s).

  | Puerta | Resultado |
  |---|---|
  | `tie.zona` | ≥ 44 en los seis tamaños (Monedas, Tapetes, vista del grafito, ventana), de 2 a 16 tocables por vista |
  | `tie.solape` | 0 |
  | `tie.estantes` | los cinco en orden, uno pulsado, tres «Pronto»; bajo 760 la fila desplaza con el activo entero a la vista |
  | `tie.puerta` | **Δ = 0 en los 11 casos con los 9 valores** (8 tokens en `body` y `.vit`; `--luz-k` en `.game-table-screen` y `.vit-fondo`: 0,85 / 1 / 1,15) |
  | `tie.ventana` | confirmar (31.400 → 21.400), comprando (`aria-busy`, botones quietos), listo (aviso, «✓ En uso», píldora en 21.400, banco con grafito claro en uso y una línea `compra`), error (línea O1, saldo intacto) y el reintento que compra |
  | `tie.falta` | 4.000 HC frente al vinotinto: «No te alcanza: faltan 21.000 HC», CTA atenuado, el enlace lleva a Monedas |
  | `tie.ojito` | la píldora de la tienda tapa la cifra y lo recuerda; la ventana enseña 31.400 |
  | `tie.inventario` | lista con «Usar» / «✓ En uso» / precio; «Usar» y el tono oscuro cambian el servidor y la vitrina solo con su `ok`, sin ninguna línea `compra` |
  | consola | sin errores |

- **`diagDSK lob`: verde.** El lobby no se movió al extender las reglas del ojito.
- **`diagDSK cfg`: verde,** con `cfg.menu` recableado (ver D-7).
- **`vitest run`:** 84 archivos, 1986 pruebas en verde.
- **`eslint src scripts`:** 20 errores, todos anteriores (18 en `GameTable.jsx`, 1 en `CardImage.jsx`, 1 en `SoundContext.jsx`), dentro de los 21 de siempre.
- **`npm run guiones`:** verde, 8 guiones × 2 pasadas.
- **Capturas:** `capturas-dsk/tienda/` (24, regenerables) y `laminas/tie1a/capturas/_1a/` (la sonda con bypass).

### 2.3 Desviaciones de la 1a-ii (para el rector)

- **D-7 · La entrada «Tapetes» del ⋮ sale ya en la 1a-ii** (la ficha la ponía en la 1a-iii). `tapetesCore` pierde la compra local en esta mitad, y el panel del ⋮ seguía «comprando» sin cobrar: dejarlo vivo hasta la 1a-iii era tener dos verdades a la vez. Se adelantan:
  - la entrada, el panel y su CSS (`tapetes.css` §2 y el bloque del panel en `menuMovil.css`);
  - `partidaRapida.test.js`, que pasa a 4/3/200/156;
  - `cfg.menu` (`scripts/cfg/menu1e.mjs`), que tenía 244/200 escritos a mano y no se ponía al día solo; ahora deriva de `altoPanel(filasDelPanel(…))`.
- **D-8 · El «+» se recablea ya en la 1a-ii, y el contexto del video cambia de nombre.** `useVideo().abrirHoja` pasa a `abrirMonedas`, y `MarcoVideo` recibe `onMonedas` de `App`. El estante Monedas llama a `mirar()` al montarse, como hacía la hoja al abrirse. Quedan sin llamadores en la app `controlVideo.abrirHoja`, `cerrarHoja` y `foto.hoja`; sus pruebas siguen. Propuesta: retirarlos en la 1a-iii junto con el recableado de `scripts/eco/video.mjs`.
- **D-9 · `ajilei.tapetes.comprados` sigue en el censo, como LEGADO** (molde de `ajilei.nivel`). La ficha pide sacarla del censo y del código, y a la vez borrarla al arrancar: para borrarla hay que nombrarla. Se nombra solo en `crearAlmacenTapetes` (`removeItem`) y nunca se lee; `testTapetes` §9 lo vigila. Entra `ajilei.tapete.tono` (18 claves).
- **D-10 · Tres textos se reutilizan en vez de crearse.** El diccionario prohíbe dos claves con el mismo texto:
  - el título de la tienda es `lob.nav.tienda`;
  - la fila del ⚙ será `tie.estante.tapetes`;
  - el «No» de la ventana es `lob.cfg.no` (el de «Eliminar cuenta», su molde).

  Entra `tie.cambio.error` («No se pudo cambiar. Inténtalo de nuevo.»), el toast de un «Usar» o un tono que no contestan.
- **D-11 · El ojito en la tienda necesitó su caja y su zona de 44.** Las reglas de `tactilLobby.css` §1–§3 eran solo de `.lobby`, y en la tienda el ojito medía 16×21 (`tie.zona`). Ahora valen para `:is(.lobby, :where(.sal[data-tienda]))`: la especificidad sigue en 0,1,0 y el lobby no cambia (`lob` verde). Ninguna otra `.sal` lleva `data-tienda`.
- **D-12 · En los estantes, la zona anclada no recibe toques** (`pointer-events: none` fuera de la vista del artículo). Es una franja de unos 6 px que solo guarda la línea del toast, y en 915×412 se comía el toque de la fila que pasa por debajo.
- **D-13 · `Vitrina` tiene un tercer tamaño, `muestra`:** las franjas de la lista. La ficha nombra `grande` y `disco`.
- **D-14 · En la lista, el verde fuera de uso dice «Usar»** (la lámina pintaba «Gratis»): es del jugador y se pone con un toque.
- **D-15 · Pedir la tienda desde la propia tienda** (el «+», o el enlace de «No te alcanza») cambia de estante. Por el «+» la pantalla se vuelve a montar (llave `n`): la vista abierta se cierra.
- **D-16 · Mientras no llega el inventario, o el saldo, el CTA de compra va atenuado y sin nota** (estado `esperando`). Así nadie compra algo que ya tiene.
- **Andamio (instrumento, no producto):**
  - el modo `tienda` mide solo lo que está entero a la vista dentro del cuerpo desplazable (el criterio de `.sal-desplaza` de `cfg`);
  - en la prueba del error, el 503 que provoca el propio corte no cuenta como error de consola;
  - `diagDSK.mjs` importa `TAPETES_COMPRADOS_LEGADO` con el alias de antes hasta que la 1a-iii recablee `runTapetes`.

### 2.4 Lo que la 1a-ii dejó roto a propósito (arreglado en la 1a-iii, §3)

- `diagDSK video` busca `[data-accion="hoja-monedas"]` (`scripts/eco/video.mjs:123`), y la hoja ya no existe.
- `diagDSK u1`, `menu-movil`, `msg` y `tapetes` entran por `.util-item-tapetes` (`diagDSK.mjs` ~7858 y 11504, `runTapetes`), y la entrada ya no existe.
- El botón «Tienda» del lobby seguía en «Pronto», y la fila «Tapetes» del ⚙ no existía. La tienda se abría solo por el «+».

## 3. 1a-iii · Lobby, ⚙, ⋮, arnés y documentos (STOP-A3)

### 3.0 Lo que dijo el rector en el STOP-A2

D-7 a D-16 aprobadas. Victor probó en la PC los cinco mandos y en el S25 por túnel los nueve tonos, todo bien. Decisiones:
- **D-14:** el verde fuera de uso sigue diciendo «Usar».
- **`tie.tono.actual` dice «Medio».** El id `actual` no cambia. El rótulo se cambió también en `laminas/tie1a/textos.js`. Ni el arnés ni la lámina comparan ese rótulo con un literal.
- **D-8:** lo que quedó sin llamadores en el canal del video se retira en esta mitad (§3.1).
- **D-4:** la prueba que compara los precios de `config/tapetes.js` con los de `precio_articulo` **ya existía**: `scripts/testTapetes.test.js` §8, «el precio de exhibición es el que cobra el servidor: cliente = migración = banco». Lee la migración, el catálogo del cliente y el banco imitado, y compara además los tapetes con tonos y el tope de 30 por minuto. No hizo falta añadirla.

### 3.1 Qué hay

| Pieza | Archivo |
|---|---|
| Lobby | `src/screens/Lobby.jsx`: el botón «Tienda» de la barra inferior llama a `onTienda`, que `App` cablea a `abrirTienda('tapetes')`; sin la prop, sigue en «Pronto». Nada más del lobby cambia (Δ = 0, `lob`). |
| Fila del ⚙ | `src/components/HojaConfiguracion.jsx`: la fila «Tapetes» entre Sonido e Idioma. Rótulo `tie.estante.tapetes` (D-10). Debajo, «{nombre} · {tono}» (`tie.cfg.valor`, el tono en minúscula) o solo el nombre. Lleva el disco `Vitrina tamano="disco"` y el «›». Lee el canal por `cuenta.tapetes`, y `cuenta.abrirTapetes` cierra la hoja y abre la tienda en Tapetes. El CSS va en `src/styles/hojaConfiguracion.css`, copiado de la lámina, tie1a.css §4. |
| Núcleo | `src/hooks/tiendaCore.js`: `enUsoFila(foto)`, lo que nombra la fila; sin canal, el verde. |
| Paquete `cuenta` | `src/App.jsx`: entran `tapetes` (el canal) y `abrirTapetes`. |
| Canal del video (D-8) | `src/lib/controlVideo.js`: salen `abrirHoja`, `cerrarHoja` y `foto.hoja`; `recoger` ya no los mira. `src/lib/controlVideo.test.js`: las cinco pruebas que los usaban se rehacen sobre `mirar` y `pedir`; la de «con la hoja abierta no se abre otra cosa» se retira con la hoja (21 pruebas). |
| Arnés: `video` | `scripts/eco/video.mjs`: el «+» abre la tienda en Monedas (`abrirMonedas`), se pide desde el estante y se vuelve al lobby por la casa. `video.3` comprueba que, al acabar el video, la tienda sigue en Monedas, y que el «+» ya no anuncia un diálogo (`aria-haspopup`). `video.8` mide el estante: dos filas de 44 dentro de la vista y sin pisar la píldora, con el contador y sin desbordar. La forma de la tienda la mide `tienda`. |
| Arnés: `u1` y `menu-movil` | `scripts/diagDSK.mjs`: `U1_ENTRADAS` pasa a cuatro leyendas y `MOVMENU_PANEL` a 200 en las dos orientaciones; la lista de IDs pierde `ENTRADA.TAPETES`. La celda de Tapetes de `menu-movil` sella su ausencia (`sinTapetes`: ni la fila ni el panel). Salen `MOVMENU_TAPETE` y la puerta `hitFichas`; `MOVMENU_FICHA_MIN` queda para el selector de reacciones. |
| Arnés: `msg` | El barrido «Heptacoins» de las dos vistas que abrían el diálogo del panel ahora barre la tienda: lobby → Tienda → Negro grafito → su ventana, o la vitrina con «No te alcanza» si el saldo no llega. |
| Arnés: `tapetes` | `runTapetes` recableado (§3.2). |
| Arnés: `luz` | Su celda con tapete lo sembraba por la copia del aparato, que ya no decide nada. Ahora lo pone en vivo, como `tapetes`. |
| Arnés: `cfg` | `scripts/cfg/cfg.mjs`: puerta nueva `cfg.tapetes`, y `cfg.ojito` gana la tienda (INV-69, §3.3). |
| Documentos | `docs/AJILEI_Tienda_v1.2.md` (§13 nueva; §7, §11 y §12 al día), `docs/AJILEI_Configuracion_v1.3.md` (§13 nueva; §1, §2, §6, §8, §9 y §10), `docs/AJILEI_Menu_Utilidades_v1.7.md` (delta: sale Tapetes, 200/156), `docs/AJILEI_Invariantes_v1.0.md` (§3.5). |
| Censo | `scripts/testClavesAlmacen.test.js`: la fuente de `ajilei.tapete.tono` cita la Tienda v1.2 §13.6. |
| Textos | `tie.tono.actual` = «Medio». |

### 3.2 `runTapetes`, recableado

El panel del ⋮ se retiró, y con él la forma en que el modo cambiaba el tapete en vivo. El modo conserva lo que medía y gana lo nuevo:
- **(1) Δ = 0 en vivo.** Misma página y mismo estado de juego. El tapete se cambia escribiendo en `<body>` los atributos que calcula `atributosTapete`, la misma función con la que la mesa los pone (`useTapeteEnMesa`). Que la mesa ponga lo que dice el canal lo prueba (2). Hay **once casos**: verde, tricolor y los tres tonos de grafito, azul y vinotinto. Se miden las mismas 18 anclas (30 apariciones en la mesa 5 y 25 en la mesa 2) y el contrato de color de VIS-1c (`tapJuzgaBanda`) en cada caso.
- **La puerta (4) «swatch = base»** medía el disco del panel. Pasa a ser **«vitrina = mesa»**: una `.vit` fuera de flujo, con los atributos de `<body>`, frente a `body` (los 8 tokens) y a la `.game-table-screen` viva (`--luz-k`). Entra además **«tonos distintos»**: los tres tonos de un tapete no pueden pintar igual; si no, un bloque que no llegara pasaría midiendo el medio.
- **(2) La mesa lee el servidor** (sustituye al flujo de compra del panel). En frío, la mesa sale en verde. Con `?tie=comprado` sale en grafito oscuro y la copia del aparato lo guarda. Una copia sin respaldo (azul claro con el inventario vacío) no manda: verde, y la copia se pisa. Una compra en la tienda (grafito claro) pinta la mesa, con vitrina = mesa. Fuera de la mesa (la tienda, el lobby) no hay atributo, y al abandonarla se va.
- **(3) Móvil:** 360×640 y 740×360 con `?tie=comprado`: grafito oscuro, `--luz-k` 1,15 y vitrina = mesa.
- **(4) Capturas:** una página por mesa y tamaño, los once casos con el badge TURNO a la vista, más la zona de riesgo del tricolor: 48.

### 3.3 `diagDSK cfg`

- **`cfg.tapetes`** (puerta nueva; ahora son 20):
  - la fila va entre Sonido e Idioma, con el disco de 20 dentro de la fila y el «›», y dice «Verde clásico» con el banco vacío;
  - con el inventario sembrado (grafito claro en uso y azul comprado), en 360×640 y 1366×768, dice «Negro grafito · claro» y el disco lleva grafito claro;
  - tocarla cierra la hoja y abre la tienda en Tapetes, con grafito en «✓ En uso».
- **Sus 44** los mide `cfg.hoja`, que pasa por todas las filas, y su sitio bajo el techo de 584 en 360×640 con «Acerca de» abierto también.
- **`cfg.ojito`, INV-69 redactado de nuevo:** con el ojito cerrado, la píldora de la tienda sale tapada, con los puntos y con su ojito, en las cinco celdas. Que la ventana enseñe el saldo siempre lo mide `tie.ojito`.

### 3.4 Medidas (STOP-A3)

| Vara | Resultado |
|---|---|
| `vitest run` | **84 archivos, 1989 pruebas en verde.** Una menos de `controlVideo` (la de la hoja) y cuatro más: `enUsoFila`, INV-76, INV-77 y la fila de la Tienda v1.2 en el registro |
| `eslint src scripts` | 20 errores y 1 aviso, todos anteriores (18 en `GameTable.jsx`, 1 en `CardImage.jsx`, 1 en `SoundContext.jsx`; el aviso es un `eslint-disable` sobrante de `GameTable.jsx:873`): los 21 de siempre |
| `diagDSK humo` | **rojo solo por `cfg.hoja`** (O-1, abajo). En verde: `gate`, `lob`, `retar`, `rnk`, `suma`, `tienda` y aislamiento. `d1d2`, `d3`, `bug` y `shots` son informativos |
| `diagDSK lob` (en humo) | **verde:** el lobby no se movió con el botón encendido |
| `diagDSK cfg` (en humo) | **19 de 20 puertas en verde, con `cfg.tapetes` y la tienda en `cfg.ojito`.** Roja `cfg.hoja`, solo en 360×640 con «Acerca de» abierto (O-1) |
| `diagDSK tienda` (en humo) | **verde** |
| `diagDSK tapetes` | **verde:** 4/4 celdas con Δ = 0 en los once casos (30 anclas en la mesa 5, 25 en la 2), contrato 11/11 y vitrina = mesa en cada caso (`--luz-k` 0,85 / 1 / 1,15); servidor 2/2 (frío verde, `?tie=comprado` → grafito oscuro, la copia sin respaldo no manda, la compra en la tienda → grafito claro, salir → sin atributo); móvil 2/2; 48 capturas con TURNO, 48/48 |
| `diagDSK u1` | **verde** (cuatro leyendas, panel de 200) |
| `diagDSK menu-movil` | **verde:** 16 celdas con el panel de 64×200 y `sinTapetes`. La contra-celda de escritorio con las vivas `Sonido · Reacciones · Partida rápida · Mano actual` (en la primera corrida salió roja: la lista estaba escrita a mano con «Tapetes»; ahora deriva de `U1_ENTRADAS`) |
| `diagDSK msg` | **verde:** compositor 92 casos, jugado 7/7, fin 1/1, Δ larga 7/7, caza 2/2; barrido OK (4 medidas; en las dos vistas de la tienda no aparece «Heptacoins», D-17) |
| `diagDSK video` | **verde:** video.1 a video.8, aux y consola |
| `testInvariantes` | **verde:** 97 pruebas |

`msg` y `video` corrieron con `--sin-build` contra el `dist/` que compiló `humo`, en otros puertos y en paralelo. Desde esa compilación no se tocó `src/`.

`diagDSK luz` no se corrió en esta pasada: pedía el 5174, ocupado por la revisión de Victor. Se corrió tras el STOP-A3 (§3.8).

#### O-1 · `cfg.hoja` en 360×640 con «Acerca de» abierto (resuelta en el STOP-A3: opción a)

La fila «Tapetes» (V6, sellada en §0) suma **42,26 px** a la hoja: 425,78 plegada, antes 383,52. En 360×640 con «Acerca de» abierto, el contenido mediría 568,29 y el techo de la hoja (`100dvh − 20 u`) es 568. Así que **el cuerpo desplaza 0,29 px** (la cabecera queda fija) y la hoja termina en **617,31**.

`cfg.hoja` sella desde CFG-1 1a que en ese caso termina en 584 o antes y no se desplaza. El 584 es donde terminaba la hoja en la lámina de CFG-1. La 1b dejó la bandera sin texto precisamente por este tope.

En 412×915, 915×412, 1366×768 y 1920×1080 no cambia nada de régimen: el cuerpo o la hoja desplazan donde ya lo hacían. Todas las filas siguen en 44 o más.

La lámina 1a-L midió V6, pero no este caso. No lo decido (regla §6); son dos sellos que ya no caben juntos en 360. Opciones:
- **(a) Aceptarlo:** en 360×640 con «Acerca de» abierto el cuerpo desplaza (lo que ya hace en 1366×768), y `cfg.hoja` pasa a exigir que la hoja quepa en su techo y que lo desplegado entre en la vista. Es mi recomendación: son 0,29 px, la cabecera queda fija y «Acerca de» ya entra en la vista con `scrollIntoView`.
- **(b) Recuperar ≥ 0,3 px** en la hoja de 360 (un relleno, un hueco), sin tocar las filas de 44. Es un cambio de diseño de la hoja, del rector o de Victor.
- **(c) Mover la fila** a otro de los sitios que dibujó la lámina. Reabre V6.

### 3.5 Invariantes y normativos

- **INV-12:** 18 claves y 14 accesores. Entra `ajilei.tapete.tono`. `ajilei.tapetes.comprados` queda como LEGADO (D-9, aprobada): se nombra solo para borrarla al arrancar.
- **INV-69, redactado de nuevo:** el ojito tapa la cifra de la píldora en el lobby y en la tienda; en la ventana de compra el saldo se ve siempre; la pila de la mesa, los rankings y el mini-perfil no lo obedecen. Lo vigilan `cfg.ojito` y `tie.ojito`.
- **INV-76** (la que quedó libre en la 1e): el inventario y las compras viven en el servidor; ninguna pantalla da por comprado lo que no devuelva `mi_inventario`. Lo vigilan el guion de la 1a, `testTapetes`, el banco imitado y `diagDSK tienda`. **Límite declarado:** que no se compre en mitad de una partida lo garantiza el cliente, no el servidor.
- **INV-77** (la siguiente libre): el tapete y el tono en uso mandan en el servidor, con copia en el aparato; la vitrina y la mesa leen los mismos 9 valores (Δ = 0). Lo vigilan `diagDSK tapetes`, `diagDSK tienda` y `testTapetes`.
- **INV-07:** entra `diagDSK tienda` como vigilante; las fuentes pasan al menú v1.7 y a Configuración v1.3.
- **Fuentes al día:**
  - las de INV-68 y de INV-71 a INV-74 pasan a Configuración v1.3;
  - las de INV-70 e INV-75, al menú v1.7.
- **§4:** entra la fila de la Tienda v1.2. Configuración pasa a la v1.3 y el menú a la v1.7. Tapetes queda como «diseño de los fieltros».
- **§6:**
  - la fila nueva de `diagDSK tienda` (en `humo`: sí);
  - `humo`, que ahora corre `tienda`;
  - `cfg`, con 20 puertas y el panel de 200/156;
  - `video`, con el estante en lugar de la hoja;
  - el corredor, con `tie1a_verificacion.sql`.
- **Recuento:** 77 filas, 70 vigiladas. `scripts/testInvariantes.test.js` da verde: 97 pruebas.
- **Normativos:**
  - **Tienda v1.2.** La §13 nueva cubre la pantalla y sus tres puertas, los cinco estantes, los tonos (9 valores), la vitrina y su Δ = 0, la ventana, el inventario genérico, las cuatro RPC, los motivos cerrados, la regla del ojito y la nota para TIE-1b. Se conserva la numeración de la v1.1, porque Configuración y Rankings citan §7 y §10.
  - **Configuración v1.3.** La §13 nueva es la fila «Tapetes». También cambian §1, §2, §6 (INV-69 y la zona del ojito en la tienda), §8 (el alto medido), §9 y §10.
  - **Menú v1.7,** un delta: sale Tapetes, el ID `tapetes` queda retirado y el panel mide 200/156.
- **Línea de iOS (INV-41):** esta tanda no toca nada propio de WebKit. La tienda y la fila del ⚙ no tienen mediciones en Safari; el iPad queda para la pasada de iOS que toque.

### 3.6 Desviaciones de la 1a-iii (para el rector)

- **D-17 · El barrido «Heptacoins» de `msg` pasa del diálogo del panel a la ventana de la tienda.** La ventana dice «HC», no «Heptacoins» (copy de la lámina), así que el barrido de esas dos vistas ya no encuentra la palabra ahí. Se conserva para que, si un día entra, se mida. La palabra sigue barrida en la ruta y en la mesa.
- **D-18 · `video.8` deja de medir la geometría de una hoja flotante** (el hueco de 9 bajo la píldora, no pisar la ficha ni el ⚙), porque esa hoja ya no existe. Mide el estante: filas de 44 dentro de la vista y sin pisar la píldora, con el contador y sin desbordar. El resto de la forma de la tienda (zonas y solapes en seis tamaños) es de `tie.zona` y `tie.solape`.
- **D-19 · `luz` pone el tapete en vivo** en lugar de sembrar la copia del aparato. No lo pedía la ficha, pero la siembra ya no decide nada: sin el cambio, su celda con tapete mediría el verde.
- **D-20 · La fila «Tapetes» dice «Pronto» si la hoja se monta sin la puerta** (`cuenta.abrirTapetes`), con el molde de la cabecera y de «Eliminar cuenta». Hoy todas las pantallas la pasan.
- **Andamio (instrumento):** en `runTapetes` (2), tras abandonar la mesa la app vuelve a Retar y no al lobby. La compra se hace desde un lobby recién cargado (`?tie=vacia`), con banco nuevo.

### 3.7 Residuos que no se tocaron

- **`swatch` en `src/config/tapetes.js` y los cinco `--tap-swatch-*` de `src/styles/tapetes.css` §0** solo los leía el disco del panel retirado. Siguen sellados por el catálogo de `testTapetes` §1 («todos traen nombre, descripción y swatch») y por el normativo de Tapetes (VIS-1b). **Decisión del rector en el STOP-A3: no se tocan en esta tanda; van a ARN-4 con una v1.3 de Tapetes** (§6). Los comentarios que hablan del panel y de su disco se van con ellos.

### 3.8 Tras el STOP-A3

**Decisiones del rector:**
- D-17 a D-20 aprobadas.
- O-1 = (a).
- §3.7 a ARN-4.
- Cerrar el 5174 y correr `luz`.
- `humo` entero en verde.
- Preparar sin ejecutar el ajuste de la prueba C.

**O-1, contradicción entre dos sellos resuelta.** Chocaban:
- el tope de 584 de la lámina de CFG-1 1a-L: con «Acerca de» abierto, la hoja de 360×640 termina en 584 o antes y no se desplaza;
- la fila «Tapetes» de la lámina de TIE-1 1a-L (V6), que suma 42,26 px.

**Gana la fila.** `cfg.hoja` mide ahora tres principios, en las cinco celdas:
- la hoja **cabe en su techo** (`max-height`, 100dvh − 20 u), plegada y con «Acerca de» abierto;
- **cada fila mide 44 o más**;
- **lo desplegado entra en la vista**, aunque el cuerpo desplace: entero, o, si es más alto que lo visible, empezando en ella.

Se retira el 584 literal (`TECHO_HOJA_360` sale de `scripts/cfg/cfg.mjs`). En 360×640, techo 568 y «Acerca de» de 413,91 a 556,42, dentro de lo visible del cuerpo (148,44–605,52). Quedan al día:
- Configuración v1.3 §8;
- la cabecera de `cfg.mjs`;
- la fila de `diagDSK cfg` en el registro (§6).

**D-21 · `luz` encontró una regresión de producto de la 1a-ii, y se arregló.** `Vitrina.jsx` importa `luz.css`, y la tienda y la fila del ⚙ meten la vitrina en el CSS principal (`dist/assets/index-*.css`). Así `luz.css` pasó a cargar **antes** que `playingCard.css`, que llega con el trozo de la mesa. La regla de contacto de las cartas (`.game-table-screen :where(.playing-card…)`, 0,1,0) empataba con la base y ganaba solo por orden; ahora perdía. Resultado: en la mesa, cartas y dorsos volvían a la sombra de base (`0,3 · 1px 3px 8px`) en lugar del contacto de LUZ-1 (`p5_token` rojo en las 24 celdas, carta y dorso).
- **El arreglo** está en `src/styles/luz.css` §4: `:not(html)` al final del selector, que suma solo un tipo (0,1,1). Gana a la base y sigue perdiendo con el hover (0,2,0) y con el `!important` de la seleccionada, **cargue en el orden que cargue**. La ganadora y la vacía siguen excluidas.
- Es el único empate de `luz.css` que dependía del orden: lo demás de `p5` y `p3_estados` ya pasaba.
- `diagPUE cap` (las maestras de la mesa) da verde con el arreglo.
- Para la ficha de commits: el arreglo va con la tienda (la vitrina es la que cambia el orden), no aparte.

**Varas tras los ajustes:**

| Vara | Resultado |
|---|---|
| `diagDSK luz` | **verde:** 20 celdas y 4 tapetes en vivo (D-19); p1 Δ = 0, p2 contraste, p3 estados, p4 fugas (lobby, sala de espera y Portada, 0 diferencias), p5 token y extras. Antes del arreglo de D-21, p5 rojo en carta y dorso |
| `diagDSK humo` | **verde entero:** `gate`, `lob`, `retar`, `rnk`, `suma`, **`cfg` 20/20 y consola**, `tienda` y aislamiento; `d1d2`, `d3`, `bug` y `shots` informativos |
| `diagPUE cap` | **verde:** 31 mediciones, 0 en rojo; regresión contra las tres maestras dentro de la tolerancia |
| `vitest run` | 84 archivos, 1989 pruebas en verde |
| `eslint src scripts` | 20 errores y 1 aviso, los de siempre |

### 3.9 El ajuste de la prueba C (preparado, sin ejecutar)

Sigue el molde de la 1e: un hueco con el nombre de usuario, y cada guarda para con un error que empieza por «STOP» sin cambiar nada.
- **Guardas:**
  - rechaza `test1976` y `ticotest2022`, con mayúsculas o espacios;
  - exige que el correo sea exactamente `victorjlcm32+borrar1t@gmail.com`, comparado en minúsculas;
  - exige saldo 0, y eso hace que solo se aplique una vez.
- **Una guarda más que la 1e:** para si la cuenta ya tiene algo en `inventario`, porque la prueba empieza sin tapetes.
- **Probado en PGlite con todas las migraciones**, sin quedar en el repo. Para sin cambiar nada:
  - con el hueco sin rellenar;
  - con las dos protegidas;
  - con un usuario que no existe;
  - con una cuenta ajena;
  - con el alias `+borrar1e` de la 1e;
  - con el alias bueno pero con un tapete;
  - en la segunda corrida.

  Con la cuenta buena aplica una vez: 30.000 HC y un solo movimiento `ajuste_admin` con su motivo.

```sql
-- TIE-1 1a · prueba C · 30.000 HC para la cuenta desechable `victorjlcm32+borrar1t@gmail.com`
-- (nace con 0 HC porque comparte huella con el correo base). Alcanza para grafito
-- (10.000) y azul (15.000) y no para el vinotinto (25.000) después. Se corre UNA vez,
-- después de que el rector lo revise. Si algo no cuadra, para con un error que
-- empieza por «STOP» y no cambia nada. Molde: el ajuste de la 1e (informe 1e §7 C).
--
-- ┌─ HUECO ────────────────────────────────────────────────────────────────┐
-- │ Entre las comillas, el nombre de usuario que elegiste para la cuenta     │
-- │ desechable (el que sale en el lobby).                                   │
-- └────────────────────────────────────────────────────────────────────────┘
do $$
declare
  USUARIO constant text := btrim('<<USUARIO DE LA CUENTA DESECHABLE>>');
  v_id     uuid;
  v_correo text;
  v_saldo  bigint;
  r        public.movimiento_resultado;
begin
  if lower(USUARIO) in ('test1976', 'ticotest2022') then
    raise exception 'STOP: % es una cuenta protegida', USUARIO;
  end if;

  select p.id, lower(u.email) into v_id, v_correo
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(p.username) = lower(USUARIO);
  if v_id is null then
    raise exception 'STOP: no hay ninguna cuenta con el usuario «%»', USUARIO;
  end if;

  if v_correo <> 'victorjlcm32+borrar1t@gmail.com' then
    raise exception 'STOP: el correo de «%» no es victorjlcm32+borrar1t@gmail.com', USUARIO;
  end if;

  select b.saldo into v_saldo from public.billeteras b where b.jugador_id = v_id;
  if coalesce(v_saldo, 0) <> 0 then
    raise exception 'STOP: «%» ya tiene % HC (¿el ajuste ya se hizo, o nació con bono?)', USUARIO, v_saldo;
  end if;

  -- La prueba empieza sin tapetes: si ya tiene alguno, no es la cuenta recién nacida.
  if exists (select 1 from public.inventario i where i.jugador_id = v_id) then
    raise exception 'STOP: «%» ya tiene artículos en el inventario', USUARIO;
  end if;

  r := public.ajuste_admin(v_id, 30000, 'TIE-1 1a · prueba C · cuenta desechable, para comprar tapetes');
  if not r.aplicado then
    raise exception 'STOP: el ajuste no se aplicó (%)', r.motivo;
  end if;
  raise notice 'ok: «%» tiene ahora % HC', USUARIO, r.saldo;
end
$$;
```

## 4. Las pruebas de Victor (ficha §5, tras el STOP-A3)

**Las tres, al 100 %.** Sin observaciones que cambien el código.

- **A · PC con bypass, en `npm run dev`:**
  - los cinco mandos `?tie=`; lobby → «Tienda» → estantes → cada tapete, con sus tres tonos en la vitrina;
  - «No te alcanza» con `?tie=sin-saldo`, y la ventana en sus cuatro estados;
  - la fila «Tapetes» del ⚙ con el disco, y el ⋮ de una mesa con cuatro entradas;
  - con el ojito tapado, sigue tapado en la tienda y la ventana enseña el saldo.
- **B · S25 por túnel con `test1976`** (servidor real, sin comprar):
  - la tienda en vertical y acostado, y los nueve tonos en la vitrina del teléfono real, la confirmación que faltó en la lámina;
  - «Verde clásico» en uso y la fila del ⚙;
  - el ⋮ en una mesa contra las IAS.
- **C · Servidor real con la cuenta desechable `pruebatapete`:** compra, tono, la mesa con el tapete puesto, «No te alcanza» y «Eliminar cuenta», que de paso prueba la cascada sobre `inventario`.

**Corrección de la prueba A.** Con bypass va en `npm run dev`, no en `vite preview`: la ficha (§5) y este informe decían 4173, y estaban mal. El bypass y los mandos `?tie=` solo existen en desarrollo; el 4173 con túnel es para la sesión real.

**Regla nueva de la casa.** Una cuenta desechable se usa solo si la prueba deja algo que no puede revertirse en `test1976` o `ticotest2022`. Comprar sí lo deja: por eso B va sin comprar y C va con cuenta desechable.

## 5. Lista de borrado para Victor

Claude Code no ha borrado nada. Ninguno de estos archivos tiene quien lo importe.
- `src/components/HojaMonedas.jsx`: la hoja «Conseguir monedas». Su CSS ya salió de `video.css`, y sus textos (`video.hoja.*`) siguen vivos en el estante Monedas.
- `src/components/TapetesPanel.jsx`: el panel del ⋮, con `GodeteIcon`, que solo usaba él. Su CSS ya salió de `tapetes.css` §2 y de `menuMovil.css`.
- Sobrantes de `laminas/tie1a/` (no se commitean; la ficha dice que Victor borra la carpeta entera tras el push): `_muta.mjs`, `_tienda.mjs`, `_401.mjs`, `_chips.mjs`, `_tapa.mjs`, `_sonda.mjs`, `_factor.mjs`, `capturas/_rev1.png`, `capturas/_corrida.txt` y `capturas/_1a/`.
- Capturas regenerables, ignoradas por git: `capturas-dsk/tienda/` y las `tapete_*` de `capturas-dsk/`.

## 6. Pendientes

**Para la ficha de commits:** nada abierto. O-1 está resuelta; `luz`, `humo` y `cap` salen verdes (§3.8), y las pruebas de Victor, al 100 % (§4).

**Para ARN-4:**
- **Una v1.3 de Tapetes** que retire `swatch` de `src/config/tapetes.js` y los `--tap-swatch-*` de `tapetes.css` §0, con su prueba del catálogo (`testTapetes` §1) y los comentarios del panel (§3.7; decisión del rector en el STOP-A3).
- **El tope de `comprar_articulo` va literal** (`contar_intento_dinero('comprar_articulo', 30)`), como el de `consultar_mano` (O-3 de CFG-1 1e), y no por `limite_dinero()` como los de ECO-1d. Funciona igual, y el banco imitado lo lee de la migración (`LIMITE_COMPRA_SQL`, vigilado en `testTapetes` §8). Unificarlo es una migración pequeña aparte, porque esta ya está en la base.
- **La clave LEGADO `ajilei.tapetes.comprados`** se retira tras los testers de la ola 2 (D-9).
- **Cinco archivos de `src/` sin llamadores:** `src/App.css`, `src/components/SuitSymbol.jsx`, `src/components/WelcomeScreen.jsx`, `src/hooks/useReloj.js` y `src/screens/Entrada.jsx`. Ya estaban en `2a9857e` y esta tanda no los dejó sin llamadores. No se tocan aquí (decisión del rector en el STOP-C1).
- **Residuo conocido, no de esta tanda:** con el bypass, `mi_sala` va al Supabase real y contesta 401 (O-4 de CFG-1 1e).
- **La compra en mitad de una partida** la impide el cliente (no hay puerta desde la mesa), no el servidor: limitación declarada en INV-76. Si MES-PvP abre una puerta a la tienda desde una sala, la guarda tiene que ir al servidor.

**Para TIE-1b** (packs y reversos, mismos moldes):
- **Un `tipo` más en `inventario`** (`reverso`) y en el catálogo interno: `inventario_tipo_valido`, `precio_articulo`, y `articulo_con_tonos` y `articulo_gratis` si aplican. Las cuatro RPC y sus motivos no cambian.
- **Los packs no son inventario** sino movimientos de la billetera (`compra_pack`, con la pasarela). El estante Monedas ya tiene su fila «Paquetes de monedas» en «Pronto».
- **Un estante que deja de decir «Pronto»** (`ESTANTES` en `src/hooks/tiendaCore.js`), su lista con el molde de `ListaTapetes` y su vitrina propia. El reverso no es fieltro: no hereda la `.vit`.
- **La ventana de compra (V5-A) y su desenlace por motivo** (`trasCompra`) valen tal cual.
- **El canal** (`src/lib/controlTapetes.js`) es por tipo (`TIPO = 'tapete'`). Generalizarlo o hacer uno por tipo es la primera decisión de la 1b.

**Para las fichas futuras:** «usar con bypass» va en `npm run dev`; el 4173 con túnel, para la sesión real.

**Siguiente sub-tanda:** CFG-1 1d (cambio de correo), en sesión nueva.
