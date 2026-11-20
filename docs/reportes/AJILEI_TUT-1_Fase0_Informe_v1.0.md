# AJILEI · TUT-1 / GUI-1 · Fase 0 · Informe de la sonda · v1.0

- **Fecha:** 2026-11-20.
- **Base:** `main` = `origin/main` = `HEAD` = `c83776e` (los tres medidos con `git rev-parse` al empezar), `git status` limpio.
- **Ficha:** `AJILEI_TUT-1_Fase0_v1.0.md`. Sonda de solo lectura: no se ha escrito código, no hay commits, y este informe es el único archivo nuevo.
- **Lista de protegidos:** `docs/AJILEI_Protegidos_v1.0.md`. El nombre del archivo dice v1.0, pero el documento es la **lista canónica v1.9** y tiene siete archivos (§2: `gameEngine.js`, `aiPlayer.js`, `deck.js`, `seatLayouts.js`, `opponentPanel.css`, `gameTable.css`, `pozos.js`). No existe ningún archivo `AJILEI_Protegidos_v1.9.md`.
- **Cómo se trabajó:** el inventario de mandos de URL (§B.1) lo hizo un agente de exploración en paralelo. Sus citas principales se comprobaron a mano (`salasFixtures.js:91-92`, `billeteraFalsa.js:66-67`, `App.jsx:252`).
- **Unidades:** las estimaciones están en minutos de Claude Code. Lo que no se puede comprimir va en una columna aparte.

---

## 1 · Resumen en diez líneas

1. **El mazo dado ya existe sin abrir nada.** `deck.js:59` exporta `setRng` (excepción §6.1 de Protegidos). `dev/repartoGanador.js:143` (`tiradasPara`) y `:239-247` (`armarOrden`) convierten un orden de baraja en las 39 tiradas del barajado. Hoy esa vía solo existe en desarrollo, detrás de `?apu=gana`.
2. **Los rivales de guion se pueden hacer sin tocar `aiPlayer.js`.** La mesa decide la apuesta de la IA en `GameTable.jsx:1189` (`decidirIA`) y la aplica con `applyBetAction`, que está exportada (`gameEngine.js:377`). Ese es el punto donde enchufar el guion. El descarte de la IA ocurre dentro del motor (`gameEngine.js:698-700` → `decideDiscard`, `aiPlayer.js:1412`). No consume azar, así que con mazo dado es reproducible, pero no se puede elegir desde fuera.
3. **La mesa sin servidor ya existe a medias.** `GameTable` funciona con `control = null`, `apiRanking = null` y `apiConsulta = null` (`:553`, `:1012`, `:1028`, `:1379`, `:1402`; `useConsultas.js:43`). Falta una rama en `App` que monte la mesa sin `retar` ni `sentarse_ia`, y esa mesa queda fuera de INV-47.
4. **Ningún estado fijo sirve en producción.** `?sal`, `?pvp`, `?cfg` y `?tie` exigen `DEV && VITE_AUTH_BYPASS`; `?apu` y `?cel`, `DEV`. Además, `scripts/testDistSinMoldes.test.js` vigila que no lleguen a `dist/`. **No hay ningún estado fijo de la mesa contra las IAS**; la mesa PvP sí tiene unas 70 escenas congeladas, todas de desarrollo.
5. **La lista de los diez capítulos aprobados no está en el repo.** Sin ella, la tabla de los diez capítulos (§B.4) y las anclas por capítulo (§C.4) se entregan por pista y no por capítulo.
6. **Para la capa de señalización hay molde, pero no componente.** `Voz2Capa.jsx:46-52` es una capa `fixed` que mide un ancla (`aPropios`). `MiniPerfil`, `AvisoSaldo` y `ConfirmarConsulta` son portales a `body`, fuera del `zoom` de `#root` (INV-59). Hace falta un componente nuevo, fuera de los protegidos.
7. **Anclas:** la convención `data-accion` está en todas las pantallas. En la mesa faltan anclas en «Iniciar mano», «Siguiente mano», los multiplicadores, «Descartar», las cartas, el pozo y el óvalo, y en los rivales (con sus dos caminos de render, INV-10). Ninguno de esos elementos está en un archivo protegido.
8. **Marcas:** hoy no hay ninguna marca de «primera vez». El patrón local es `lib/partidaRapida.js`, y cualquier clave nueva entra en el censo de INV-12. La recompensa pide una migración: un `tipo` nuevo en `movimientos_tipo_chk`, con el molde de `mespvp_v13_recarga.sql:28-35`.
9. **Ninguna de las tres piezas obliga a abrir un protegido.** Los roces están en invariantes: INV-47 (la mesa guiada no avisa la pila), INV-79 (texto bajo el velo), INV-02/INV-70 (el `setRng` armado que no se consume) e INV-05/04/45/59.
10. **Precio:** común ≈ 6–8 h · GUI-1 ≈ 6,5–8,5 h · TUT-1 ≈ 9–11 h, más lo que no se comprime (láminas, teléfonos, nube, decisiones). La tabla está en el §7.

---

## 2 · A · El modo guion

### A.1 · Dónde entra el azar

- La baraja se crea con `createDeck()` (`deck.js:16-30`) y se baraja con `shuffleDeck` (`deck.js:62-69`), un Fisher-Yates de 39 tiradas contra `rng`.
- `rng` es una variable del módulo (`deck.js:57`). Se inyecta con `setRng(fn)` (`deck.js:59`) y se restaura con `resetRng()` (`deck.js:60`). Es la excepción pre-autorizada de Protegidos §6.1, que cubre *cómo* se sortea y nunca *qué* hay en la baraja.
- **Único punto de entrada del reparto:** `startHand` (`gameEngine.js:502`), que baraja una vez por mano en `gameEngine.js:560` (`shuffleDeck(createDeck())`). Reparte dos cartas por asiento (`:563-570`). El resto de la baraja se queda en `state.deck` (`:576`). La segunda vuelta (`gameEngine.js:310-325`) y el descarte (`:689`, `deckCopy.shift()`) **sacan de esa misma baraja**. Por tanto, con el orden fijado al barajar, la mano entera queda fijada. Hay una salvedad: el reparto de la segunda vuelta depende de quién se retiró «a las 2» (`repartoGanador.js:38-44` lo documenta).
- **Mazo dado desde fuera:** `tiradasPara(orden)` (`repartoGanador.js:143`) convierte un orden de ids en las 39 tiradas. `armarOrden` (`:239-247`) las entrega una sola vez y llama a `resetRng()` al consumir la última. No se abre ningún protegido.

### A.2 · Cómo lo usa el arnés

- **Semilla de página (`h1`, `z1`, `vuelo`, `apu`, `u3`):** `scripts/arnes/siembra.mjs:22-31` sustituye `Math.random` antes de que arranque la app (`addInitScript`, `:34`). Funciona porque `deck.js:56` resuelve `Math.random` en cada llamada. Es un camino **exclusivo del arnés**: no existe en ninguna build, ni de producción ni de desarrollo, sin Playwright.
- **Reparto preparado (`?apu=gana`, `allin`, `allin-espejo`):** `siembraMesaAPU` (`siembraAPU.js:162`) llama a `armarRepartoGanador` o `armarRepartoAllin`. Su puerta es solo `DEV` (`siembraAPU.js:163`), así que **en producción no existe**. El código (`tiradasPara`, `armarOrden`) es puro y no depende del bypass; lo único que lo deja fuera de producción es la carpeta `src/dev/` y la puerta.
- **El árbitro PvP imitado:** `partidaImitada.js:627-666` **busca semillas** (`TOPE_SEMILLAS`) hasta que una produce la escena. No es un mazo escrito, y su puerta es `DEV && VITE_AUTH_BYPASS`. El informe Sub5 Fase 0 §G, fila 13, ya lo anotó: «ni el árbitro, ni el motor, ni la función tienen manos escritas».

### A.3 · Las IAS sin tocar `aiPlayer.js`

- **Apuestas:** `GameTable.jsx:1168-1203`. El efecto decide con `decidirIA(game, seat)` (`:1189`; el motor la exporta en `gameEngine.js:640`) y aplica con `applyBetAction(prev, seat, action, k)` (`:1196`). El guion se engancha aquí: una decisión escrita en lugar de `decidirIA`, con la misma espera (`ritmoDe`). **No toca ningún protegido.** La guarda de `partida` en `:1170` es el molde de cómo apagar la IA.
- **El rival retirado que salta:** `GameTable.jsx:1229-1238` usa `applyAIBetAction`, que decide por dentro. Con un guion que nunca da el turno a un retirado, esta rama no se alcanza (la propia mesa lo anota en `:1212-1215`).
- **Descartes de las IAS:** ocurren dentro de `applyDiscard` (`gameEngine.js:698-700`). Para cada asiento que no tiene `isHuman` se llama a `decideDiscard` (`aiPlayer.js:1412`). Su cuerpo no lee el azar: no aparece entre los seis puntos sembrados de §6.1 (`:494, :644, :696, :803, :852, :864`), y en `:1412-1445` no hay `rng` ni `random`. **Con mazo dado, el descarte de la IA es reproducible, pero no se puede elegir.** Hay tres vías sin abrir el motor:
  - (i) Aceptar el descarte que decida la IA y escribir el guion a su alrededor. Basta una prueba que lo fije.
  - (ii) Sentar a los rivales con `isHuman: true` y pasar la forma de objeto `{asiento: índices}` (edición 3 de MOT-1, `gameEngine.js:684-700`). Efecto colateral: la crónica cambia, porque `cronicaCore.js:111` lee `isHuman`.
  - (iii) Reescribir el estado que devuelve `applyDiscard`. Es frágil, porque desalinea `deck`.
- **Mínimo a abrir si el rector exige descartes elegidos y descarta (ii):** `gameEngine.js:698-700`, tres líneas (un parámetro de descartes por asiento para las IAS). **[PROTEGIDO]** `src/engine/gameEngine.js:698-700`. Con la vía (i) o la (ii) no hace falta.

### A.4 · El dinero: cada llamada al servidor de una mesa contra las IAS

| Momento | Llamada | Archivo:línea |
|---|---|---|
| Antes de sentarse | carga del trozo `controlMesa` (no es red de la base) | `App.jsx:777-778` |
| Sentarse (cobra la entrada) | `sentarse_ia` | `App.jsx:787` → `mesaIAApi.js:70-75` |
| Cada cambio de pila (ante, apuesta, pozo, fin de mano C7) | `informar_pila` por la cola de `control` | `GameTable.jsx:552-560` → `controlMesaIA.js` → `mesaIAApi.js:84-90` |
| Recarga | `recargar_ia` | `GameTable.jsx:1380` → `mesaIAApi.js:77-79` |
| Victoria de mesa (cobro) | `salir_ia` | `GameTable.jsx:1012-1014` |
| Levantarse | `salir_ia` | `App.jsx:860-871` → `mesaIAApi.js:91-93` |
| Mano actual (consulta) | `mi_consulta` / `consultar_mano` | `GameTable.jsx:625` → `useConsultas.js:43-55` |
| Mini-perfil de la victoria | `mini_perfil` (vía `apiRanking`) | `GameTable.jsx:2553-2555` |
| Arranque y recogida | `mi_mesa_ia`, `recoger_mesa_ia` | `mesaIAApi.js:94-105` (desde `App`) |

Fuera de la mesa siguen activos el latido de sesión (`App.jsx:579`) y la constancia, que no dependen de ella.

- **La mesa local ya existe:** con `control = null`, el aviso de pila se corta (`GameTable.jsx:553`), la recarga se aplica en local (`:1379`), la victoria no cobra (`:1012`) y la suscripción no se monta (`:1402`). Con `apiConsulta = null` no hay consultas (`useConsultas.js:43`), y con `apiRanking = null` no hay ranking (`:1028`, `:2553`). Así, **ni el saldo ni el ranking se tocan**: los puntos los deriva el servidor desde `informar_pila` (INV-65), y esa llamada no se hace.
- **El banco imitado no puede encenderse en producción:** su puerta es `DEV` + bypass (`billeteraFalsa.js:66-67`), y `scripts/testDistSinMoldes.test.js:28-58` exige que sus marcas no aparezcan en `dist/`. Tampoco hace falta: la mesa local no lo necesita.
- **Lo que falta:** `App` solo monta `GameTable` con `screen === 'table' && mesa !== null` (`App.jsx:1082`), y `mesa` solo nace en `retar` después de `sentarse_ia` (`App.jsx:828`). Hace falta una rama propia, por ejemplo `screen === 'guiada'`, que monte la mesa con `control={null}`, sin `apiRanking` ni `apiConsulta` y con el guion. La carga sigue siendo dinámica (INV-29, `fabricaMesa`, `App.jsx:81`).
- **Otros dos frenos de la mesa que el guion debe apagar:**
  - El reloj de turno, que se retira o pasa solo a los 20 s y descarta vacío (`GameTable.jsx:924-940`).
  - La pregunta de recarga, que el guion no debe alcanzar nunca.

  La guarda `partida` (`:926`) y la guarda `congelado` (`:927`) son el molde para estos dos.

### A.5 · Un solo botón activo

- **Hoy:** los multiplicadores se apagan con `disabled={!m.disponible}` (`GameTable.jsx:2766`). Las acciones no se apagan: **no se montan** si no son legales (`puedeHacer`, `:2773-2783`). La recarga usa `disabled` (`:3157`, `:3181`, `:3194`, `:3218`). El estilo de los botones vive en `gameTable.css` **[PROTEGIDO]**.
- **No hay ningún mecanismo de «solo este botón responde».** Hay dos sitios posibles, los dos fuera de los protegidos:
  - (a) Un filtro en `GameTable` sobre `puedeHacer` y `mults` (presentación, no reglas).
  - (b) La propia capa: un velo que solo deja pasar el toque por el hueco del ancla. No toca la mesa, pero hay que cuidar el teclado (el foco se escapa por detrás del velo).

  Para el gris del resto no se puede tocar `gameTable.css`: va en una hoja nueva y aditiva (INV-03, sin `!important`).

### A.6 · «El modo guion del imitado»

- Vive en `src/dev/partidaImitada.js` (1.007 líneas): `crearPartidaImitada` (`:613-618`), que busca semillas en `:627-644` y monta las escenas `ESCENAS` (`:490-596`). Simula **el árbitro PvP** (`src/arbitro/`) en memoria, con un reloj virtual, para `PartidaPvP` (`?pvp=`).
- La ruta MOT-1 lo registra como «modo guion» en `AJILEI_MOT-1_Contrato_v1.0.md:653, :684`, con la receta `setRng` + `tiradasPara`.
- **Qué se puede reutilizar tal cual para GUI-1:** `tiradasPara` y `armarOrden` (`repartoGanador.js:143, :239-247`), que son puros. Hay que sacarlos de `src/dev/` a `src/lib/`, porque la carpeta `dev` es la que desaparece del bundle. **No se puede reutilizar** `partidaImitada` en sí: es PvP, busca semillas en vez de escribir manos, y está vetado en `dist/`.

### Tabla · Lo que hace falta para GUI-1

| Pieza | Existe | Falta | ¿Protegido? | Minutos |
|---|---|---|---|---|
| Mazo dado | `setRng` (`deck.js:59`) · `tiradasPara`/`armarOrden` (`repartoGanador.js:143, :239`) | Moverlos a `lib/`; los tres órdenes de baraja (uno por mano) y su prueba; `resetRng` al desmontar (riesgo R-2) | No (usa §6.1, no edita) | 40–60 |
| Rivales de guion | Punto de enganche `GameTable.jsx:1189`; `applyBetAction` exportada | Una decisión escrita por turno; descartes por la vía (i) o (ii) | No con (i)/(ii) · **[PROTEGIDO]** `gameEngine.js:698-700` solo si se exigen descartes elegidos sin (ii) | 60–90 |
| Mesa sin servidor | `control/apiRanking/apiConsulta = null` toleradas (`GameTable.jsx:553, 1012, 1028, 1379, 1402`) | Rama en `App` (molde `App.jsx:1082-1108`); guardas para el reloj (`:924`) y la recarga; excepción declarada a INV-47 | No | 60–80 |
| Un solo botón | `disabled` de los multiplicadores (`:2766`); `puedeHacer` (`:2773-2783`) | Filtro «solo» en `GameTable` o velo con hueco en la capa; hoja aditiva para el gris | No (sin tocar `gameTable.css`) | 30–45 |
| Señales de primera vez | Saber «toca apostar» (`:904`) y «toca descartar» (`:907`) | La capa (común) + qué pista sale en cada uno + la marca «vista» | No | 60–90 |
| Ofrecer al primer login | El Bautizo cierra en `useAuth.js:381-383` → `COMPLETO` → Lobby | Una señal de «recién bautizado» o la marca; la oferta saltable en Lobby | No | 45–60 |
| Marca de hecho | Patrón `partidaRapida.js:17-38`; censo `scripts/testClavesAlmacen.test.js` | Clave `ajilei.*` nueva + censo (INV-12), o una columna en el servidor (§D.1) | No | 20 (local) · 90+ (servidor) |

---

## 3 · B · Estados fijos

### B.1 · Inventario

| Mando | Se lee en | Valores (dónde) | Pantalla y estado | Puerta | ¿Escribe en el servidor? |
|---|---|---|---|---|---|
| `?sal=` | `dev/salasFixtures.js:97` | 19 estados de `ESTADOS_SAL` (`:47-77`): `opciones-*` (7), `armar*` (3), `espera-*` (9) | SalaOpciones / ArmarMesa / SalaEspera (`pantallaDe`, `:146-150`; aplicado en `App.jsx:253-259`) | `DEV` + `BYPASS` (`:91-92`) | No: cliente PostgREST falso (`:365-451`) |
| `?pvp=` (+ `n`, `asiento`, `nombres`, `ver=vivo`, `corte`, `momento`, `msj`, `msjms`, `abierta`, `premium`, `saldo`, `lento`, `ritmo`, `desc`, `descyo`, `tarde`, `retira`) | `App.jsx:252` · `PartidaPvP.jsx:239` · `partidaImitada.js:972-1006` | ≈ 70 escenas de `ESCENAS` (`partidaImitada.js:490-596`, lista `:607`) | `PartidaPvP` → `GameTable` con `partida` imitada | `DEV` + `BYPASS` (`App.jsx:252`; `partidaImitada.js:970-971`) | No: árbitro en memoria |
| `?cfg=` | `dev/billeteraFalsa.js:164` | `borrar-*` (4), `nombre-*` (4), `correo-*` (4, `correoFalso.js:17-18`), `consulta-*` (3), `mesa-humanos` | No fuerza pantalla: cambia las respuestas de Perfil, Correo, Eliminar y Mano actual; `mesa-humanos` monta la mesa como PvP (`App.jsx:1105`) | `DEV` + `BYPASS` (`:66-67`) | No: banco imitado |
| `?tie=` | `dev/billeteraFalsa.js:324` | `vacia`, `comprado`, `sin-saldo`, `error`, `ojito` (`:311-350`) | Datos de la Tienda | `DEV` + `BYPASS` | No (`ojito` escribe `ajilei.saldoOculto` en el aparato, `:345`) |
| `?apu=` | `dev/siembraAPU.js:80` | `saldo:`, `bolsillo:`, `video:`, 8 moldes (`:220-247`) y `gana` (`:182`) | Estado inicial de la mesa contra las IAS (`GameTable.jsx:376`) | Solo `DEV` (`:77, :163`) | **Sí** sin bypass (se sienta en el servidor real) |
| `?cel` (+ `frase`, `melodia`) | `dev/siembraCEL.js:67` | vacío, `<n>`, `derrota` (`:71-89`) | Mesa que cierra al primer «Iniciar mano», o nace en `GAME_OVER` | Solo `DEV` (`:63`) | **Sí** sin bypass |
| `?suma` | `dev/siembraSuma.js:31` | vacío, `fin` | Contador del intersticial | Solo `DEV` (`:28`) | No |
| `?medir=arranque` | `dev/medirArranque.js:31` | `arranque` | Ninguna: marcas de tiempo | Por consumidor | No |
| `?sala=` | `config/salaPendiente.js:157` | Un código válido (`:53`) | Sala de opciones con el código | **Ninguna: es de producción** | Sí (es el flujo real) |

### B.2 · La condición de arranque

- **Ninguno de los mandos del arnés funciona con la sesión real en ajilei.io.** `?sal`, `?pvp`, `?cfg` y `?tie` exigen el bypass incluso en `vite dev`. `?apu` y `?cel` funcionan en `vite dev` con sesión real, pero no en la build. La guardia `testDistSinMoldes` asegura que ninguno llega a `dist/`.
- **Qué haría falta para tener una pantalla «de mentira» en producción que no escriba:** las pantallas ya reciben su API por parámetro. `App.jsx` lo dice para las salas: «La API de salas entra en las tres pantallas por parámetro. Es el ÚNICO punto de inyección». Para la mesa la entrada es `control`, y `apiRanking`, `apiConsulta` y la tienda siguen el mismo molde. Hay dos caminos:
  - (a) Un trozo nuevo del tutorial que monte la pantalla real con **una API propia de solo lectura** (respuestas fijas, ninguna escritura). Va escrito fuera de `src/dev/` para no chocar con `testDistSinMoldes`.
  - (b) Promocionar fixtures de `src/dev/` a producción. Choca con la guardia de `dist/` y arrastra el banco imitado (1.070 líneas) y las 1.007 de `partidaImitada`.
- El precio de (a) es una API simulada por cada pantalla que se use. Las de salas (`salasFixtures.js:365-451`, `clienteDe`) muestran el tamaño: unas 90 líneas.

### B.3 · La mesa en estado fijo

- **PvP: sí, en desarrollo.** `?pvp=<escena>` congela la mesa con reloj virtual. Hay escenas de sorteo (17, `:221-264`), reparto y dos cartas (`mano-reparto`, `turno-propio`, `turno-ajeno`, `ultima-accion`, `allin-rival`), descarte (`descarte-espera`, `descarte-propio`, `reposicion`, `reponer`), revelación y pago (`revelacion`, `retirada`, `pago-capas`) y final (`final-*`, seis, `:535-585`). **No hay ninguna escena congelada en `BET_2`** (cinco cartas, antes del descarte). Mecánica de montaje: `App.jsx:252` → `PartidaPvP.jsx:255` (`import()` del imitado) → `leerMandoPvP` → `crearPartidaImitada`. `ver=vivo` la reproduce, `momento=` congela otro instante (solo en el sorteo) y `corte=0` quita el corte.
- **Contra las IAS: no existe.** No hay `escena` ni `momento`. Solo están los moldes de pilas y reparto de `?apu=` y `?cel`, sobre el estado inicial (`GameTable.jsx:376`).
- **Cuánto costaría:** sale casi gratis de la maquinaria de GUI-1. Un «momento» es el guion jugado hasta el paso N con el reloj y la IA en pausa (la guarda `congelado` ya existe, `useCongelado`, `GameTable.jsx:439`). Con el modo guion hecho, cada estado de mesa son **15–25 min**: el orden de la baraja, los pasos y una prueba.

### B.4 · Los diez capítulos contra el inventario

**La lista de los diez capítulos no se encontró.** Se buscaron «Pista A», «capítulo», «TUT-1» y «Cómo se juega» en `docs/`, `src/`, `scripts/` y `laminas/`, y en las carpetas hermanas de `Documents`. Ni los títulos ni el reparto por pista están en el repo. Sin ellos, la tabla de diez filas no se puede llenar sin suponer. Va por pista, con las áreas que la ficha nombra (A el juego · B apostar · C la app), y se completa en cuanto llegue la lista (§P-1).

| Pista | Pantallas que tocará | Estados existentes que cubren algo | Lo que hay que crear |
|---|---|---|---|
| A · El juego (cartas, palos, puntos, comodín, descarte, AJILEI) | Mesa contra las IAS | Ninguno en producción. En desarrollo: `?apu=gana` (una mano ganadora), `?cel` (victoria) y escenas PvP de reparto, descarte y revelación | Los estados de mesa por guion (§B.3): dos cartas, cinco cartas, descarte, revelación, AJILEI |
| B · Apostar (ante, pasar, apostar, igualar, subir, retirarse, all-in, capas, recarga) | Mesa contra las IAS (fila de acciones, multiplicadores, pozo, «A igualar») | En desarrollo: moldes `allinIA`, `allinHumano`, `allin`, `capas`, `recarga`, `quiebra` (`siembraAPU.js:220-247`) | Lo mismo por guion: turno con apuesta abierta, all-in, pago por capas, recarga. La recarga cobra en el servidor y necesitaría la simulación local (`GameTable.jsx:1379`) |
| C · La app (lobby, Retar, salas, tienda, ⚙, ⋮, rankings, perfil) | Lobby, Retar, SalaOpciones/ArmarMesa/SalaEspera, Tienda, Rankings, Perfil, hoja ⚙, ⋮ | Todos en desarrollo con bypass: `?sal` (19), `?tie` (5), `?cfg` (16). Ninguno con sesión real | Una API de solo lectura por pantalla (§B.2-a), o la pantalla real viva con la capa encima (§P-6) |

---

## 4 · C · La capa de señalización

### C.1 · Lo que ya existe parecido

| Pieza | Archivo | Cómo se coloca | ¿Generalizable? |
|---|---|---|---|
| Frase del óvalo (VOZ-2, capa C) | `components/Voz2Capa.jsx:46-52`, `styles/voz2.css:143-160` | `fixed`, `z-index: 20`; mide el óvalo con `getBoundingClientRect` y `aPropios(…, f)` (escala) y escribe `left`/`top`/`width` | **Es el molde de la flecha y el rótulo:** mide un ancla y pinta encima sin mover nada |
| Mini-perfil | `components/MiniPerfil.jsx:122-129`, `styles/miniPerfil.css:18-20` | Portal a `body`, `fixed`, `z-index: 80`, `role="dialog" aria-modal` | Es el molde del portal: fuera de `#root` no hereda el `zoom` (INV-59, comentario en `MiniPerfil.jsx`) |
| Aviso de saldo | `components/AvisoSaldo.jsx:54`, `styles/avisoSaldo.css:15-16` | Portal, `fixed`, `z-index: 60` | Molde de tarjeta con un botón; no apunta a nada |
| Burbuja de recarga (REC-1) | `components/BurbujaRecarga.jsx`, `styles/rec.css:31-35` | `absolute`, `z-index: 5`, en la ranura O1 | No: vive en una caja reservada, no flota |
| Hoja ⚙ / marco | `styles/hojaMarco.css:37-62` | `fixed`, `z-index: 6/7` | No: es hoja, no señal |
| Bautizo / Eliminar (velo) | `styles/bautizo.css:79-88` (`.elc-velo.cfn-velo { z-index: 1000 }`) | Velo a pantalla completa | Es el molde del velo de atenuación |

**Ninguno es una capa genérica de «señalar un elemento».** Las piezas existen sueltas (medir un ancla, portal, velo), pero el componente no.

### C.2 · Dónde viviría

Un componente nuevo, por ejemplo `components/CapaSenal.jsx` con su hoja `styles/senal.css`, montado **por portal a `body`**. Así no hereda el `zoom` de `#root` y no entra en el apilamiento de la mesa. Se pueden montar desde dos sitios:

- **Desde `App`:** un solo punto de montaje. Pero `App` no sabe la fase de la mano, que vive en `GameTable` (`:500`), así que la mesa tendría que exportarla hacia arriba.
- **Desde cada pantalla** que la use (`GameTable`, `Lobby` y las pantallas de la serie): cada una conoce su estado y monta la capa con el ancla y el rótulo.

La que **pide menos cambios** es el montaje por pantalla con el componente común. La señal de primera vez vive donde se sabe la fase (`GameTable`), y el capítulo la monta con su propio guion. `App` solo gana la rama de la mesa guiada (§A.4) y la entrada de la serie.

### C.3 · Los choques conocidos

| Choque | Regla que lo vigila | ¿La capa puede romperla? |
|---|---|---|
| Nada mueve la caja | **INV-05** (O1; `diagDSK p1/h1/a1/a2/m1/f1`) | Solo si se monta *en flujo*. Con `fixed` en un portal no reserva ni empuja. El «un solo botón» por filtro (§A.5-a) **sí** podría quitar botones de la fila y moverla: hay que apagarlos, no desmontarlos |
| El óvalo intocable | **INV-04** (+ INV-58, INV-64) | Si el rótulo se mete dentro del óvalo o lo hace crecer, sí. Encima y por fuera (como VOZ-2 C), no |
| Pantalla completa | **INV-45** | El toque en la capa (Siguiente, Saltar) pide la pantalla completa como cualquier toque, y eso está bien. El riesgo es que el velo **se trague el toque de «Iniciar mano»**, que es el que reentra (`reentrarPantallaCompleta`, `GameTable.jsx:48`): el hueco debe dejar pasar el toque real, no reenviarlo por código |
| `z-index` de la mesa | No hay invariante con escala de `z-index`. Las cifras viven en las hojas: VOZ-2 20, aviso 60, mini-perfil 80, velo 1000 | La capa debe ir por encima de la mesa y de VOZ-2, y por debajo de los diálogos (60/80) y del velo del Bautizo |
| `fixed` frente a `absolute` | No encontrado en el repo como «ways-of-working». La regla vigente está escrita en `MiniPerfil.jsx` (portal + `fixed` fuera de `#root`) y en **INV-59** (la escala vive solo en la mesa) | Con `fixed` dentro de `#root` la capa heredaría el `zoom` y mediría mal. Se evita con el portal o con `aPropios` como VOZ-2 |
| Atenuación del resto | **INV-79** (4,5 : 1 bajo la tinta; exentos los controles apagados con opacidad de grupo < 0,9) | **Sí:** un velo oscuro baja el contraste de todo el texto que cubre. Hace falta una exención declarada o un velo que no cuente como fondo (§P-7) |
| Piso táctil | **INV-07** (40 en la mesa, 44 en el lobby y el menú) | Los botones de la capa (Siguiente, Saltar, Cerrar) lo deben cumplir |
| Botón principal a la vista | **INV-55** | Un velo sobre Retar o Salas tapa el botón anclado. Sirve si el hueco es ese botón; si no, se tapa |
| Pestaña oculta | **INV-25** (5 guardas) | Si la capa o el guion avanzan por temporizador, deben ir por `useCongelado` |
| Letra mínima | **INV-88** | El rótulo debe respetar los pisos de `LEC_PISOS` |
| Dos caminos del rival | **INV-10** | Un ancla de rival hay que ponerla en los dos caminos (opp-panel y ai-zone) |

Nota de paso: **INV-01** dice «los seis protegidos», pero la lista es de siete desde la v1.9. La fila está desfasada, sin efecto sobre esta sonda.

### C.4 · Cómo se apunta a un elemento

La convención es **`data-accion`**, y `id` casi no se usa (uno en `GameTable`, ninguno en `Lobby`).

| Pantalla | Anclas estables | Sin ancla (solo clase o nada) |
|---|---|---|
| Lobby | `jugar-ia`, `jugar-pvp`, `rankings`, `tienda`, `reglas` (`Lobby.jsx:225-268`) | La píldora de saldo, el ⚙, la figurita |
| Retar | `aviso-*`, `contador`, `entrada-mas`/`-menos`/`-monto`, `mas-monedas`, `saldo-reintentar`, `video-quedan`; las filas de chips llevan `data-accion={accion}` (`FilaChips.jsx`), y la pantalla `casa`/`volver` (`PantallaChips.jsx`) | No se comprobó fila a fila qué valor lleva cada chip |
| Salas / Armar / Espera | 6 / 3 / 31 `data-accion`, más `data-asiento` en la Espera | — |
| Tienda / Rankings / Perfil | 19 / 6 / 10 `data-accion` | — |
| Mesa | `pasar`, `apostar`, `igualar`, `subir`, `retirarse`, `allin`, `allin-humano`, `recarga*` (`GameTable.jsx:2734-3242`); `data-coin-source="pot"` en el pozo (`:2382`) | **«Iniciar mano»** (`:2704`), **«Siguiente mano»** (`:2877`), **los multiplicadores** (`:2762-2768`, solo `key`), **«Descartar / Sin descartar»** (`:2831`), **las cartas del humano** (`.card-slot-wrapper`, `:2098-2113`), **el óvalo**, **«A igualar»** (`:2391`), **el comodín**, **los rivales** (`OpponentPanel.jsx` solo tiene `data-coin-target`), **el ⋮** (`UtilitiesTrigger`, `UtilitiesMenu.jsx:86`; las filas sí llevan `data-entrada`) |

Ningún ancla que falte está en un archivo protegido: `GameTable.jsx`, `OpponentPanel.jsx` y `UtilitiesMenu.jsx` no están en la lista. Hay que añadir unas **12 anclas** en la mesa. Atributos nuevos, sin CSS: Δ geométrico 0. Se omite la tabla por capítulo porque falta la lista (§B.4).

### C.5 · Peso

- **Cómo se difiere hoy:** con `lib/trozos.js:18-33`, `creaCargador` y `lazy(trozos.x.fabrica)` en `App.jsx:84-92`; la mesa va por `fabricaMesa` (`App.jsx:81`). INV-84 exige que toda pantalla nueva nazca diferida. Los textos de un trozo viajan con él gracias a `sumarTextos` (`config/textos.js:55`), con el molde de `textos.pvp.es.js` que suma `lib/vistaAMesa.js:34`.
- **El tutorial entero puede ir por ese camino:** el trozo de la capa, el de la serie y el diccionario `textos.tut.es.js`. La mesa guiada reutiliza el trozo de la mesa.
- **Lo que no se puede diferir del todo:** la **oferta del primer login** y la entrada de «Cómo se juega» viven en el `Lobby`, que se importa de forma estática (`App.jsx:5`). El botón ya existe y solo cambia su `onClick`; la oferta suma su cajita y sus 3–4 claves a `textos.es.js`, que va en la entrada. **Estimación: +0,2 a +0,5 KiB** sobre los 179,4 KiB (`AJILEI_LEC-1_T2_Informe_v1.0.md:73`; meta 185, techo 200). No es posible que la primera pantalla «no suba ni un KiB» si la oferta se pinta en el lobby sin trozo. Con la oferta también en un trozo, pedido al aterrizar en el lobby, la subida es de 0,1 KiB o menos (el `import()`).

---

## 5 · D · Las costuras

### D.1 · El primer login

- **Dónde termina el Bautizo:** `crearPerfil` (`useAuth.js:372`) inserta el perfil y, si sale bien, llama a `setCargaPerfil` (`useAuth.js:381-383`). El estado pasa a `COMPLETO`, y la cascada de `App` (`App.jsx:895-897` y siguientes) cae en el `Lobby`. **En ninguna parte queda una señal de «recién bautizado»**: el éxito vive solo en la promesa de `crearPerfil`.
- **¿Hay hoy alguna marca de primera vez?** No: ni en `profiles` (columnas añadidas por migración: `pais`, `estado`, `nombre_cambiado_en`, `origen`, `origen_datos`), ni en `localStorage`, ni en la constancia. Hay dos huellas indirectas:
  - `ajilei.origen`, que se borra justo tras el Bautizo (`olvidarOrigen`, `useAuth.js:381`).
  - El movimiento `bono_bienvenida`, en el servidor.
- **Claves `ajilei.*` existentes** (20 censadas en `scripts/testClavesAlmacen.test.js`, INV-12): `consultaConfirmada`, `consultas`, `dispositivo`, `fraseVictoria`, `idioma`, `medir` (sesión, solo en desarrollo), `melodiaCelebracion`, `nivel`, `origen`, `partidaRapida`, `recargaPorChunk` (sesión), `retoConfig`, `salaConfig`, `salaPendiente`, `saldoOculto`, `saldoVisto`, `sound`, `sumamente`, `tapete`, `tapete.tono`, `tapetes.comprados` (legado). **Cómo se gestionan:** un módulo por clave con un almacén inyectable y todo protegido con `try` (molde `lib/partidaRapida.js:17-38`). `lib/limpiarAparato.js` las borra todas por prefijo al eliminar la cuenta (`:15-44`); cerrar sesión no limpia nada (`:9-11`).
- **Las dos opciones para las marcas «visto» y «guiada hecha»:**

| Opción | Qué es | Costo | Consecuencia |
|---|---|---|---|
| Local | `ajilei.guia` (o dos claves) con el molde de `partidaRapida` + el censo de INV-12 | ≈ 20–30 min | En un segundo aparato vuelve a ofrecer la guiada y a enseñar las señales. Se borra con «Eliminar cuenta». La marca de «recién bautizado» tiene que nacer en el cliente al resolver `crearPerfil` |
| Servidor | Columna(s) en `profiles` o tabla propia, más una RPC para marcar, migración, el espejo en `bancoImitado` y el guion SQL | ≈ 90–120 min + nube (Victor) | Sigue a la cuenta. Ojo con INV-83: `authenticated` solo lee ciertas columnas de `profiles`, y una columna nueva pide revisar ese permiso |

### D.2 · «Cómo se juega» del lobby

`screens/Lobby.jsx:267-269`: `<SoundButton className="lob-nav-btn" data-accion="reglas" onClick={pronto}>`, con el comentario en `:257-258`. El toast es `lob.toast.pronto` (`textos.es.js:44`) y se pinta en `Lobby.jsx:287`.

### D.3 · El «?» de la mesa

- **Hoy no hay ninguna entrada «?» ni «Ayuda» en el ⋮.** Las filas son: escritorio = Sonido, Reacciones, Partida rápida, Mano actual y Contador (`config/menuEntradas.js:42-45`); móvil = las cuatro primeras (`:57-59`). El único «?» es el glifo SVG del icono de Mano actual (`UtilitiesMenu.jsx:43-46`).
- **Geometría:** en el teléfono acostado, el corredor deja 245,72 px. Caben cinco filas (244) y no seis (288) (`menuEntradas.js:64-65`). Por tanto, en el móvil una quinta fila cabe justo; en el escritorio serían seis (§P-8).
- **La fase de la mano:** `const { phase } = game` (`GameTable.jsx:500`), con los valores de `PHASES` (`gameEngine.js:10-21`, exportado). El menú se monta dentro de `GameTable`, así que lee la fase sin salir del componente. Desde fuera del motor también se puede leer: es dato puro del estado. No hace falta tocar el motor.

### D.4 · La recompensa al completar

- **El `tipo` vive en un `check`, no en un `enum`** (`eco1a_libro.sql:151-175`). La lista vigente está en `20261108120000_mespvp_v13_recarga.sql:28-35`, y se amplía quitando y volviendo a poner la restricción en la migración que estrena el tipo nuevo. **Sí, pide migración.**
- **«Una vez por cuenta»:** el molde es `clave_idem` única (`movimientos_clave_idem_uniq`, `eco1a_libro.sql:174`), por ejemplo `guiada:<uid>`, más una RPC de cobro con límite por minuto (INV-51).
- **El bono, en cambio, sobrevive al borrado de la cuenta:** `bonos_bienvenida` guarda la huella sha256 del correo, sin FK (`eco1a_libro.sql:230-241`). Si la recompensa usa solo `clave_idem` por `uid`, borrar la cuenta y crearla de nuevo la vuelve a cobrar (§P-5).
- **Además:** el espejo en `bancoImitado.js` (lo vigila su prueba de contrato), la cifra en un único sitio (molde de `bono_bienvenida_hc()`, `eco1a_libro.sql:264-275`) y el guion SQL de verificación.

### D.5 · Las señales de primera vez en la mesa real

Todo en `GameTable.jsx`, sin tocar el motor:

- **«Ahora toca apostar»:** `isPlayerTurnEarly` (`:904`), que es turno del humano en `BET_1`/`BET_2`/`BET_3` sin estar retirado.
- **«Ahora toca descartar»:** `isDiscardTimerActive` (`:907`), que es `DISCARD` sin animación en curso ni retirada.
- **Reparto y showdown:** `isDealPhase` (`:764`) y `phase === PHASES.PAYOUT` (`:555`).
- **El momento natural de apagar la pista es la acción:** `act(...)` (`:1299`), `handleDiscard` (`:1657`, su botón en `:2830`) e «Iniciar mano» (`beginHand`, `:1983`).

---

## 6 · E · Idiomas

- `t(clave, vars)` (`config/textos.js`) interpola `{nombre}` (`PATRON_VAR`). Si falta una clave devuelve `⟦clave⟧`, que el arnés detecta. `sumarTextos` permite diccionarios diferidos. **La capa, los rótulos, la oferta y los capítulos pueden salir enteros de `t()`.** La flecha y el aro son SVG o CSS sin texto.
- **SVG con texto:** solo `UtilitiesMenu.jsx:43-46` (el glifo «?», que no se traduce). No se encontró ningún otro `<text>` en `src/`.
- **Literales fuera de `t()` que la serie va a nombrar.** No son de las piezas nuevas, pero los rótulos los citan, como «Toca *Apostar*». En `GameTable.jsx` (34 llamadas a `t()` contra unas 26 líneas con literales) están: «Pasar», «Apostar {n}», «Igualar ({n})», «Subir a {n}», «Retirarse» (`:2773-2783`), «Iniciar mano» (`:2704`), «Siguiente mano» (`:2877`), «Descartar {n}» / «Sin descartar» (`:2831`), las pistas de descarte (`:2808-2826`), «Pozo» y «A igualar» (`:2383`, `:2391`) y «Barajando…» / «Repartiendo cartas…». Es deuda de IDI-1, no de TUT-1. Pero si un rótulo dice el nombre del botón con `t()` y el botón sigue siendo un literal, los dos se separan en cuanto llegue otro idioma.
- **Claves nuevas (orden de magnitud):** GUI-1 ≈ 30–35 (oferta 4, tres manos × 6 rótulos, señales 6, cierre y recompensa 4). TUT-1 ≈ 65–75 (diez títulos, unos 50 pasos, índice y navegación 8). Común ≈ 8 (Siguiente, Saltar, Cerrar, Volver, paso n de m). **Total ≈ 105–120.** Hoy `textos.es.js` tiene unas 368 entradas y `textos.pvp.es.js` unas 43.

---

## 7 · Estimación por pieza

Minutos de Claude Code. Incluyen las pruebas `vitest`, el modo del arnés y las varas de cada tanda. La columna de la derecha no se comprime.

| Pieza | Partes | Minutos | No se comprime |
|---|---|---|---|
| **Común** | Capa (`CapaSenal`: portal, medida del ancla con escala, velo con hueco, flecha, aro, rótulo, `prefers-reduced-motion`, `useCongelado`, teclado) | 120–150 | Lámina de la capa (Victor); revisión en teléfonos (pantalla completa, iOS: INV-41) |
| | ≈ 12 anclas nuevas en la mesa (Δ 0) | 20–30 | — |
| | Marcas (local) · o servidor | 25 · 90–120 | Servidor: aplicar en la nube (Victor) |
| | Recompensa (migración, RPC, banco imitado, guion SQL, cliente) | 100–130 | Nube y prueba en vivo (Victor); monto y alcance (rector, §P-5) |
| | Modo del arnés (`diagDSK tut`: capa sobre el ancla, Δ O1, piso táctil, contraste) | 60–90 | — |
| | **Subtotal común** | **≈ 330–520** (5,5–8,5 h) | |
| **GUI-1** | Modo guion: mazo dado a `lib/`, rivales de guion, rama de `App`, guardas del reloj y la recarga, excepción de INV-47 | 160–220 | Decisión de INV-47 (rector, §P-3) y de los descartes (§P-2) |
| | Tres manos (órdenes de baraja, pasos y una prueba por mano) | 90–120 | Guion de las tres manos validado por Victor jugando |
| | Señales de primera vez (pistas de apostar y descartar, marca «vista») | 60–90 | — |
| | Puerta de entrada (oferta saltable tras el Bautizo, marca «hecha») | 45–60 | Lámina de la oferta |
| | **Subtotal GUI-1** | **≈ 355–490** (6–8 h) | |
| **TUT-1** | «Cómo se juega» (índice de la serie en un trozo diferido) | 60–80 | Lámina del índice |
| | «?» en el ⋮ (fila nueva y capítulo según la fase) | 45–60 | Decisión de geometría (§P-8) |
| | Diez capítulos: los de mesa reutilizan el guion (≈ 30–40 cada uno); los de la app necesitan una API de solo lectura (≈ 45–60 cada uno) | 350–500 | La lista de capítulos (§P-1); textos de los pasos (Victor y rector); un capítulo modelo en lámina |
| | **Subtotal TUT-1** | **≈ 455–640** (7,5–10,5 h) | |

Si la serie se construye sobre el modo guion, GUI-1 tiene que ir antes que los capítulos de mesa. Es una dependencia técnica, no una recomendación de orden.

---

## 8 · Riesgos

### Primero, los protegidos

- **R-1 · Descartes elegidos para los rivales.** Si el guion necesita que una IA descarte cartas concretas, distintas de las que decide `decideDiscard`, y no se acepta la vía `isHuman` (que cambia la crónica, `cronicaCore.js:111`), hay que abrir **[PROTEGIDO]** `src/engine/gameEngine.js:698-700`. Con la vía (i) no se abre nada.
- **R-2 · `setRng` armado y no consumido.** `armarOrden` deja preparado el generador global (`deck.js:57`) y solo lo suelta al consumir la tirada 39 (`repartoGanador.js:242-246`). Si el jugador sale de la mesa guiada antes de «Iniciar mano», **la siguiente mesa real barajaría con el orden del guion**. No abre ningún protegido, pero roza la **excepción §6.1** (solo cubre cómo se sortea) e **INV-02** / **INV-70** («nunca toca el barajado»). Hay que hacer `resetRng()` al desmontar, y una prueba que lo fije.
- **R-3 · El gris de los botones no puede ir en `gameTable.css` [PROTEGIDO].** Debe ir en una hoja nueva y aditiva (INV-03).

### Después, las invariantes que la capa o la guiada pueden rozar

- **INV-47:** la mesa guiada no avisa ninguna pila al servidor. Hace falta una excepción declarada («la mesa guiada no mueve dinero»), o la invariante saldría roja en cuanto la vigile `diagDSK mesaia`.
- **INV-79:** el velo de atenuación baja el contraste del texto que cubre.
- **INV-05 / INV-04:** la capa siempre encima, nunca dentro del óvalo. El «solo un botón» apaga, no desmonta.
- **INV-45:** el hueco del velo deja pasar el toque real de «Iniciar mano» y «Siguiente mano».
- **INV-59:** la capa en un portal a `body`, o medida con `aPropios`.
- **INV-10:** las anclas del rival en los dos caminos de render.
- **INV-07 / INV-88 / INV-55 / INV-25:** el piso táctil, la letra, el botón anclado y la pestaña oculta, en los botones y temporizadores de la capa.
- **INV-12:** toda clave nueva entra en el censo.
- **INV-84:** las pantallas nuevas nacen diferidas.

### Por último, el peso

- **INV-30:** la oferta en el `Lobby` estático sube `1.8b` entre 0,2 y 0,5 KiB (179,4 → ≈ 179,9). Con la oferta también en un trozo, ≈ 0,1 KiB. Todo lo demás (capa, serie, textos, guion) puede ir diferido.

---

## 9 · §P · Preguntas al rector

1. **La lista de los diez capítulos** (título y pista de cada uno) no está en el repo. ¿Dónde vive? Sin ella, la tabla de §B.4 y las anclas por capítulo de §C.4 quedan por pista y no por capítulo.
2. **Descartes de los rivales en la guiada:** ¿basta con que descarten lo que decide la IA, que con mazo dado es fijo y reproducible? ¿O el guion necesita descartes elegidos? Lo segundo es R-1: abrir `gameEngine.js:698-700`, o sentar a los rivales como humanos con la crónica cambiada.
3. **INV-47 y la mesa guiada:** ¿se acepta una mesa sin ningún aviso al servidor como excepción escrita? ¿Y debe contar para algo del servidor (constancia, `eventos` de medición)?
4. **Marcas «guiada hecha» y «señal vista»:** ¿locales (vuelven a salir en un segundo aparato) o en el servidor (migración e INV-83)?
5. **Recompensa:** ¿una vez por cuenta (por `uid`, que se vuelve a cobrar si se borra y se recrea la cuenta) o por correo, como el bono (huella que sobrevive al borrado)? ¿Y qué monto?
6. **Capítulos de la Pista C con la sesión real:** ¿pantalla «de mentira» con una API propia de solo lectura (no escribe nada), o pantalla real con la capa encima (un toque fuera del guion escribiría de verdad)?
7. **INV-79 y el velo:** ¿el texto atenuado bajo el velo queda exento, como los controles apagados, o la atenuación tiene que respetar 4,5 : 1?
8. **El «?» de la mesa:** ¿una fila nueva del ⋮ (en el móvil cabe justo, 5 × 244 ≤ 245,72; en el escritorio pasa a 6 filas) o un botón propio fuera del panel?
