# AJILEI · RNK-1 · Fase 1b · Informe · v1.0

**Ficha:** `AJILEI_RNK-1_Fase1b_v1.0.md`. **Estado:** STOP-B, antes del túnel. Sin commits.
**Contrato:** informe de la 1a §4 y la migración `20261024191731_rnk1a_libro_puntos.sql`, ya aplicada en la base real (37/37).

---

## Resumen

- **El fin de mano lleva qué mano era y si fue AJILEI.** `finDeMano` devuelve `{ vivos: handRules.ruleN, ganoHumano, mano: handCount, ajilei }`, y `mesaIAApi.informar` manda `p_fin_mano` y `p_fin_ajilei`. Con eso el servidor escribe el libro de puntos.
- **«Puntos obtenidos» sale de la misma regla que el servidor.** `GameTable` calcula el fin de mano una sola vez por mano y lo usa para la cola del servidor y para la sesión. La sesión suma el `total` de `puntosDeMano`, espejo de `puntos_reto_ia` + `extra_ajilei`. Se acabó `manosGanadas × puntosDe(nivel)`.
- **El banco imitado ya conoce el contrato de la 1a:**
  - `informar_pila` con las reglas de la migración;
  - el libro y el total en memoria;
  - `ranking_top`, `ranking_mio` y `mini_perfil` con el orden del Ajuste A;
  - jugadores sembrados (`SEMBRADOS_DEMO` o `sembrarJugador`).
- **Recarga de página: no hay caso** (§3). Al arrancar, la app siempre cierra y cobra la mesa; nunca la reanuda.
- **Verificación:**
  - vitest **74 archivos / 1.824 pruebas** verde (antes 73 / 1.783: +1 archivo, +41 pruebas);
  - lint **21** (los mismos tres archivos);
  - build verde;
  - huellas de los seis protegidos idénticas;
  - arnés en §6.

---

## §1 · Lo que cambió, archivo por archivo

| Archivo | Líneas | Qué |
|---|---|---|
| `src/lib/puntos.js` | nuevo (1-61) | **`ajileiDe(cards, handRules)`** (:36). Da 0 con menos de 5 cartas (H-7) o si `isAjilei` es falso (H-6). Si es AJILEI, `getBestSuitScore(…, comodinValue !== null).points`, exactamente 51 o 52; otra cifra lanza un error. **`puntosDeMano({ origen, nivel, sentados, ajilei })`** (:57) devuelve `{ base, extra, total }`. **`EXTRA_AJILEI`** (:20). |
| `src/hooks/mesaIACore.js` | :25, :91, :163-196 | `finDeMano` (:186) con la forma nueva; `ganoHumano` sigue saliendo de `ganadoresPorCapa` sin cambios. Comentario de `encolarPila` con la forma nueva del `fin`. La cola y «un aviso con fin nunca se salta» no cambian. |
| `src/lib/mesaIAApi.js` | :79-91 | `informar` añade `p_fin_mano: fin.mano` y `p_fin_ajilei: fin.ajilei`. |
| `src/hooks/sesionCore.js` | :17-18, :28-43 | `sesionInicial` gana `puntos: 0` y `ajileis: 0`. `anotarMano` recibe `puntos` y `ajilei`, que solo cuentan si `gano`. La guarda por `handCount` sigue igual. |
| `src/hooks/useSesion.js` | :17-33 | Recibe `fin` y `puntos` en lugar de `winner`. «Ganó» es `fin.ganoHumano`. |
| `src/components/GameTable.jsx` | :19, :496-510, :533, :695-704, :2357 | `finMano` es un `useMemo` por `[phase, handCount]` y `puntosMano` sale de `puntosDeMano`. La cola del servidor usa `finMano` (:533) y la sesión recibe `fin: finMano, puntos: puntosMano` (:700-701). «Puntos obtenidos» es `sesion.puntos` (:2357). El import `puntosDe` se cambia por `puntosDeMano`. `lecturaDeMano` sigue mandando en todo lo demás. |
| `src/dev/bancoImitado.js` | :22-28, :63-83, :133-163, :259, :292-449, :593-595, :662-677 | Constantes `PUNTOS_RETO_SQL`, `EXTRA_AJILEI_SQL`, `TOPE_MANOS_MINUTO_SQL`, `franjaSQL` y `SEMBRADOS_DEMO`. Opciones `usuario` y `sembrados`. `saldoEn` (la fecha de Fortunas) se pone en cada movimiento. La mesa gana `mano_informada` y `manos_recientes`. Nuevos `anotarPuntos`, `informar` (la migración §6, en orden), `rankingTop`, `rankingMio` y `miniPerfil`. Mandos `envejecerManos`, `sembrarJugador` y `sumarPuntos`, y lecturas `puntos`, `total` y `usuario`. |
| `src/hooks/mesaIACore.test.js` | :6-7, :193-268 | El bloque de `finDeMano`, reescrito: el pago lleva `handRules` y `handCount`. Pruebas nuevas: `mano`, AJILEI 51 y «tiene AJILEI y no gana → 0». |
| `scripts/testCelebracion.test.js` | :13-14, :268-308 | Sesión: puntos y AJILEI solo de las ganadas, idempotencia de los puntos, y Σ `puntosDeMano` en los tres retos. |
| `src/dev/bancoImitado.test.js` | :9, :636-855 | Espejo de B8–B11, B19–B22, B12–B15, B18 y B23 con las cifras del guion, más el espejo de las cifras contra la migración. |
| `scripts/testRnk1b.test.js` | nuevo (1-213) | `ajileiDe`, la tabla entera de `puntosDeMano`, el espejo con el SQL y el barrido con el motor real (§4). |

No hay protegidos tocados (§5) y no se exporta nada nuevo de `gameEngine.js`. No hay claves de texto nuevas.

---

## §2 · Decisiones dentro del margen

| # | Decisión | Por qué |
|---|---|---|
| D-1 | `ajileiDe` y `puntosDeMano` viven juntos en **`src/lib/puntos.js`** (la ficha daba a elegir entre ese y `celebracionCore.js`). | Así la regla de los puntos queda en un solo módulo puro, y `mesaIACore` lo importa sin arrastrar la celebración. |
| D-2 | **`anotarMano` recibe también `ajilei`**, además de `puntos`. | La ficha pide acumular `sesion.ajileis`, y eso no se deduce de `puntos` (2 puntos pueden ser Avanzado o Básico con AJILEI). |
| D-3 | **`useSesion` recibe `fin` y `puntos`** en vez de `winner`. | Es la regla I-7: «ganó» sale de `fin.ganoHumano`, el mismo objeto que viaja. `ganadorVisible` sigue existiendo para la celebración. |
| D-4 | **`finMano` es un `useMemo` por `[phase, handCount]`**, con el mismo `eslint-disable` que ya usa el efecto de la cola. | Se calcula una vez al entrar en el pago, en el mismo render en que la cola y la sesión lo leen. Las animaciones que cambian `game` durante el pago no lo recalculan. |
| D-5 | **Los demás jugadores del banco son «sembrados»** (`sembrados` al crear, `sembrarJugador` y `sumarPuntos`). La cuenta de la sesión gana puntos solo por `informar_pila`. | El banco imita una sola cuenta, la de la sesión. Las cuentas fabricadas del guion son aquí jugadores con cifra y fecha. |
| D-6 | **`SEMBRADOS_DEMO` está exportado pero no se usa en la app.** No conecté `billeteraFalsa` del bypass a los sembrados. | Qué ve el bypass en la pantalla de Rankings es cosa de la 1c. Basta con `crearBanco({ sembrados: SEMBRADOS_DEMO })`. |
| D-7 | **El barrido de H-3 va en una prueba nueva** (`testRnk1b.test.js`), con partidas enteras de hasta 80 manos y eliminados. No va en el barrido de VOZ-3. | El barrido de VOZ-3 juega una sola mano por mesa, todas con N vivos, así que `ruleN === aliveCount` sería trivial ahí. Además, la ficha pide no tocar las líneas :195 y :301 de VOZ-3. |
| D-8 | **El banco ordena los nombres con `<` sobre minúsculas** (orden de código). | En el servidor, `lower(username)` usa la colación de la base. Solo puede diferir en un empate exacto de cifra **y** de fecha, y la única diferencia sería el `_`. En la práctica no ocurre. |

---

## §3 · La comprobación de la recarga (ficha §3.2): **no hay caso**

1. **`mano` empieza en 1 y crece de uno en uno.**
   - `createInitialState` pone `handCount: 0` (`gameEngine.js:114`) y cada `startHand` lo sube en 1 (`:598`).
   - Así, la primera mano de la mesa llega al pago con `handCount = 1`, y el barrido lo comprueba en 3.202 pagos (§4).
2. **Una `mesas_ia` es un montaje de `GameTable` con su estado nuevo.**
   - `sentarse_ia` crea el control (`App.jsx:661`) y entra a la mesa.
   - El estado nace en el inicializador de `useState` (`GameTable.jsx:354`, `createInitialState`), y ningún otro sitio de `GameTable` vuelve a crear el estado.
   - Salir de la mesa cambia de pantalla; la mesa siguiente es otro `sentarse_ia`, otra `mesas_ia` y otro montaje.
3. **Al recargar la página la mesa no se reanuda.**
   - El arranque llama a `recoger_mesa_ia` con el id del dispositivo (`App.jsx:453`), que **cierra y cobra** la mesa de este dispositivo siempre, y la de otro tras 10 minutos de silencio (ECO-1c).
   - El cliente **no usa `mi_mesa_ia`** para reanudar (solo existe en `mesaIAApi` y en el banco).
   - Una mesa «viva» de otro dispositivo no se adopta: si te sientas, `sentarse_ia` la cierra (C4) y abre otra, que empieza en la mano 1.
4. **Volver de segundo plano no reinicia nada.** El estado de React sigue vivo (FRZ-1), y `visibilitychange` solo reintenta la cola con el mismo `seq` (`App.jsx:470-481`).

**Conclusión:** el servidor nunca recibe una `mano` que no supere `mano_informada` por una recarga, así que no hace falta la 1b-bis.

---

## §4 · Pruebas

| Qué | Dónde | Resultado |
|---|---|---|
| `ajileiDe`: natural 51 en 2–5; con comodín, 52 solo con `ruleN = 5`; mesa de 4 con 41 + 7 de Oros → **0** (H-6); 4 cartas, 2 cartas o vacío → 0 (H-7); no AJILEI → 0; sin cartas o sin reglas → 0 | `testRnk1b.test.js` §1 | verde |
| `puntosDeMano`: 1/2/3 sin importar los sentados · 5/6/7/8 · +1/+2 en los dos orígenes · base = `NIVELES[].puntos` | `testRnk1b.test.js` §2 | verde |
| Espejo con el SQL: `puntos_reto_ia`, `extra_ajilei`, el `check` del libro (`sentados + 3`, el 52 solo con 5) | `testRnk1b.test.js` §3 | verde |
| Barrido con el motor real, 60 partidas por tamaño, semilla 1976: `ruleN === aliveCount` en cada pago (H-3); `mano` = 1, 2, 3…; `ganoHumano` = VOZ-3; AJILEI solo si gana y **= el nivel `ajilei` de la celebración**; el 52 solo con `ruleN = 5`. Cuenta medida:<br>· N=2: 398 pagos, 0 con eliminados, 149 ganadas, partidas de hasta 26 manos;<br>· N=3: 715 pagos, 525 con eliminados, 118 ganadas, hasta 60 manos;<br>· N=4: 914 pagos, 796 con eliminados, 78 ganadas, hasta 68 manos;<br>· N=5: 1.175 pagos, 1.074 con eliminados, 71 ganadas, hasta 80 manos (el tope), **un AJILEI 51**.<br>Ningún 52 en el barrido: el 52 lo sellan las pruebas de §1. | `testRnk1b.test.js` §4 | verde |
| `finDeMano`: forma nueva, `mano`, `ajilei`, y `ajilei = 0` cuando no gana aunque tenga AJILEI | `mesaIACore.test.js:193-268` | verde (29/29 en el archivo) |
| VOZ-3: `lectura.ganoHumano === finDeMano(pago).ganoHumano` | `testVoz3.test.js:195`, `:301`, sin cambios | verde |
| Sesión: `puntos`, idempotencia, `ajileis`, «Puntos obtenidos» = Σ `puntosDeMano` de las ganadas | `testCelebracion.test.js:268-308` | verde (40/40) |
| Niveles: la tabla 1/2/3 sigue plana | `testNiveles.test.js:182-199`, sin cambios | verde |
| Banco imitado: B8, B9, B10, B19, B20, B22, B11, B21 (recorrido de `informar_pila`, mismas cifras); B12, B13, B14, B15, B18, B23 (lecturas); B25 (el total = Σ libro); espejo de las cifras y del orden contra la migración | `bancoImitado.test.js:636-855` | verde (72/72 en el archivo) |

**El espejo contra el guion SQL (ficha §3.4).** En la 1c las pruebas del banco **repiten los casos** del guion con sus cifras y **leen las constantes** de la migración; no hay un comparador automático guion↔banco. Seguí la misma forma:
- los casos de `rnk1a_verificacion.sql` van repetidos con sus cifras en `bancoImitado.test.js`;
- el bloque «las cifras del libro de puntos, en espejo» lee de la migración `puntos_reto_ia`, `extra_ajilei`, `ia_tope_manos_minuto`, la fórmula de `ranking_franja` y el orden de `ranking_top`.

**El `grep` de `game.winner` en el camino de los puntos.**
- `useSesion`, `sesionCore`, `lib/puntos`, `mesaIAApi` y `controlMesaIA`: **ninguno**.
- `GameTable`: `game.winner` aparece en `:492` (`ganadorVisible` del fin de partida), `:934` y `:1067` (celebración y fin de partida), y en comentarios. Ninguno alimenta `finMano`, la sesión ni la llamada.
- `mesaIACore.js:188`: `finDeMano` conserva, **sin cambios desde ECO-1c**, el respaldo `capa0 === undefined || capa0 < 0 ? state.winner : capa0`. Solo actúa si la capa 0 no tiene ganador, cosa que no ocurre en un pago real: todos los que no se retiraron son elegibles para la capa 0. La ficha dice que `ganoHumano` «no se toca», así que se queda (§M-1).

---

## §5 · Protegidos (lista v1.8), huellas al byte

Idénticas antes y después, y coinciden con la §3 de `AJILEI_Protegidos_v1.0.md`:

| Archivo | sha256 |
|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a9010c727c5da4e1af039462d7aec58925bff7bf96719f6e0` |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddfa5e85d849ddfa1204113740da7a97b5bfce0f75714400801` |
| `src/engine/deck.js` | `69f92d6b9aac433cb99e7ec23d6052af1a6aa66c0f61eee180ba8f045911aa82` |
| `src/config/seatLayouts.js` | `0049051fd4b8b891deb86066bb1eb89669e3509f18bb995d288232636b3ee30c` |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a489466aa9d07ac7c263ca137b3ee12177812ad9a62833f5a` |
| `src/styles/gameTable.css` | `9b6b716f23ade19aaf0a6941efbc3c2bc219b4eca9cbf451dda9181c5ac47306` |

`decideCelebracion` no cambia. Ya usa la misma `isAjilei` con el `ruleN` congelado: `GameTable.jsx:934` y `:1067` le pasan `game.handRules.ruleN`, y `lecturaDeMano` la llama con el principal. El barrido lo comprueba: el AJILEI de los puntos coincide siempre con el nivel `ajilei` de la celebración.

---

## §6 · Línea base y arnés

| Qué | Resultado |
|---|---|
| vitest | **74 archivos / 1.824 pruebas**, todo verde (línea base: 73 / 1.783) |
| lint | **21** (20 errores y 1 advertencia), los mismos tres archivos de antes: `GameTable.jsx` 19, `CardImage.jsx` 1, `SoundContext.jsx` 1. Los archivos nuevos y los demás tocados, 0. |
| build (`vite build`) | verde (el aviso de siempre del bloque de más de 500 kB) |
| `node scripts/diagDSK.mjs mesaia` | **código 0**: mesaia verde, aislamiento verde · 410 s |
| `node scripts/diagDSK.mjs saldo` | **código 0**: saldo verde, aislamiento verde · 199 s |
| `node scripts/diagPUE.mjs voz2` | **código 0**: 222 mediciones, 0 en rojo, aislamiento verde · 580 s |
| `node scripts/diagDSK.mjs humo` | **código 0**: gate, lob, retar y aislamiento verdes; d1d2, d3, bug y shots informativos · 193 s |

La ficha pide `voz2` en `diagDSK`, pero ese modo vive en `diagPUE` (`diagPUE.mjs:189`); es el que corrí. `apu` y `tab` no se corrieron porque esta tanda no cambia el pago ni la geometría, como dice la ficha. Los cuatro modos corrieron uno tras otro, para no pisarse el `dist`. Sus salidas quedaron en `capturas-pue/` y `dist/`, que están ignorados por git.

---

## §7 · Pruebas de Victor

Unos **25 minutos**. Antes de empezar, en la PC y en la carpeta del proyecto: `npm run build` y `npm run preview -- --host`, con el túnel de siempre. Es la build de este árbol, contra la base real, que ya tiene la migración de la 1a.

| # | Dónde | Qué haces | Cuánto | Qué tienes que ver |
|---|---|---|---|---|
| 1 | S25 por el túnel | Entra con tu cuenta, «Retar a las IAS»: **mesa de 2, Básico, entrada al piso** (la más baja que ofrece). | 1 min | La mesa abre como siempre. |
| 2 | S25 | Juega **hasta ganar la mesa** (la IA se queda sin fichas). Por el camino tienes que **ganar al menos tres manos y perder al menos una**. Ve contando las manos que ganas. Si la IA te deja sin fichas, recarga o vuelve a sentarte; cuenta solo la mesa que termines ganando. | 10–15 min | Nada nuevo durante la partida. |
| 3 | S25, pantalla de victoria | Lee la tarjeta. | — | En Básico, **«Puntos obtenidos» = «Manos ganadas»** (1 punto por mano), por ejemplo «Puntos obtenidos: 3» con «Manos ganadas: 3». Si alguna mano ganada fue AJILEI (improbable), suma 1 más por ella. Haz una foto. |
| 4 | PC, SQL Editor de Supabase | Pega la consulta de abajo, **cambiando `test1976` por tu nombre de usuario** si juegas con otra cuenta, y córrela. Solo lee, no escribe nada. | 2 min | Una fila **`línea`** por mano ganada en esa mesa, con `nivel` = `basico`, `sentados` = 2, `puntos_base` = 1 y `ajilei`/`extra` = 0 (salvo AJILEI). La columna `mano` crece con huecos donde perdiste, porque las perdidas no van al libro. La fila **`mesa`** lleva en la columna `mano` la última mano jugada y en `puntos` las anomalías, que deben ser **0**. La fila **`total`** lleva tus puntos de siempre, que antes de esta prueba eran 0, así que deben coincidir con lo jugado. |
| 5 | Motorola con la app **vieja** (sin actualizar) | Si la tienes instalada: una mesa de 2 en Básico, juega 2–3 manos y gana al menos una. | 3 min | Juega sin ningún error. Si corres la consulta con la cuenta del Motorola, la fila **`mesa`** sale con `mano` = 0 y **no hay filas `línea`**: sus manos entran al récord y no al libro (M-6 de la 1a), hasta que se publique el cliente. Si no tienes la app vieja, sáltalo y anótalo. |
| 6 | Dejarlo como estaba | Cierra el túnel y `Ctrl + C` en el preview. | 1 min | Nada escuchando. |

**La consulta del paso 4** (solo lectura, un único resultado):

```sql
-- RNK-1b · lo que el libro de puntos anotó de tu última mesa contra las IAS.
-- Cambia 'test1976' por tu nombre de usuario si juegas con otra cuenta.
with yo as (
  select p.id from public.profiles p where lower(p.username) = lower('test1976')
), mesa as (
  select m.id, m.reto, m.jugadores, m.mano_informada, m.anomalias, m.abierta_en
    from public.mesas_ia m join yo on m.jugador_id = yo.id
   order by m.abierta_en desc
   limit 1
)
select 'línea' as fila, l.mano, l.nivel, l.sentados, l.puntos_base, l.ajilei, l.extra,
       (l.puntos_base + l.extra)::bigint as puntos, l.creado_en as cuando
  from public.libro_puntos l join mesa on l.mesa_id = mesa.id
union all
select 'mesa', mesa.mano_informada, mesa.reto, mesa.jugadores, null, null, null,
       mesa.anomalias::bigint, mesa.abierta_en
  from mesa
union all
select 'total', t.manos, null, null, null, null, null, t.puntos, t.actualizado_en
  from public.puntos_totales t join yo on t.jugador_id = yo.id
order by 1, 2;
```

Columnas: `fila` · `mano` (en `mesa`: la última mano anotada; en `total`: cuántas manos hay en el libro) · `nivel` · `sentados` · `puntos_base` · `ajilei` · `extra` · `puntos` (en `mesa`: las anomalías) · `cuando`.

**Resultados posibles:**

| Ves | Significa | Qué hacer |
|---|---|---|
| Lo de la tabla | la 1b funciona contra la base real | pega la foto del paso 3 y el resultado del paso 4 |
| «Puntos obtenidos» distinto de «Manos ganadas» sin AJILEI | la sesión no suma con la regla | foto y avísame |
| No hay filas `línea` en tu mesa (S25) | lo que se sirve no es este árbol (cliente viejo) | comprueba el preview; si es este árbol, avísame |
| `mesa` con anomalías > 0 | el servidor rechazó algún fin de mano | pega el resultado y avísame |
| El Motorola da un error | la llamada vieja no encaja con la firma de 7 | foto y avísame |

```
Resultado real · 2026-10-25 (Victor, túnel con el S25, cuenta test1976; mesa de 2, Básico; perdió la mesa en la mano 9)

fila,mano,nivel,sentados,puntos_base,ajilei,extra,puntos,cuando
línea,3,basico,2,1,0,0,1,2026-10-25 18:48:05.079767+00
línea,5,basico,2,1,0,0,1,2026-10-25 18:49:19.530382+00
línea,6,basico,2,1,0,0,1,2026-10-25 18:49:55.161054+00
mesa,9,basico,2,null,null,null,0,2026-10-25 18:46:02.836508+00
total,3,null,null,null,null,null,3,2026-10-25 18:49:55.168374+00

Motorola, app publicada (cliente viejo), cuenta ticotest2022:
fila,mano,nivel,sentados,puntos_base,ajilei,extra,puntos,cuando
mesa,0,basico,2,null,null,null,0,2026-10-25 18:57:53.043488+00

Veredicto: PASA. Tres líneas, 0 anomalías, total = 3. El cliente viejo juega sin error y no escribe el libro (M-6). La tarjeta de victoria («Puntos obtenidos») no se alcanzó (la IA de Básico no cayó en bancarrota); se valida en el túnel de la 1d.
```

---

## §M · Notas y preguntas

**M-1 · El respaldo de `state.winner` en `finDeMano`.** `mesaIACore.js:188` conserva, desde ECO-1c, `capa0 === undefined || capa0 < 0 ? state.winner : capa0`. Solo actúa si la capa 0 no tiene ganador, cosa que en un pago real no ocurre. Lo dejé porque la ficha dice que `ganoHumano` «no se toca». **¿Se quita en una tanda de higiene, para que `game.winner` desaparezca del todo del camino de los puntos?**
Decisión del rector (2026-10-25): se deja; va a una tanda de higiene fuera de RNK-1.

**M-2 · El orden por nombre en el banco** usa el orden de código y no la colación de la base (D-8). Solo importa en un empate exacto de cifra y de fecha.

**M-3 · `SEMBRADOS_DEMO` no está enchufado al bypass** (D-6). Si la 1c quiere ver la pantalla de Rankings con jugadores en el 5173, es una línea en `billeteraFalsa`. La dejo para la 1c.

**M-4 · El AJILEI de 52 no sale en el barrido** (60 partidas por tamaño): es rarísimo. Lo sellan las pruebas unitarias de `ajileiDe` y el espejo con el SQL, que exige `sentados = 5` en el `check`.

**M-5 · La ventana M-6 de la 1a sigue abierta** hasta que se publique este cliente: las manos ganadas en la app publicada entran al récord pero no al libro. El paso 5 de §7 lo comprueba.
