# AJILEI · RNK-1 (Rankings) · Fase 0 · Informe · v1.0

- **Campaña:** RNK-1 — Rankings («Los grandes maestros» y «Las grandes fortunas»)
- **Ficha:** `AJILEI_RNK-1_Fase0_v1.0.md` (rector) · **Normativo:** `docs/AJILEI_Rankings_v1.0.md` (sellado 2026-10-24)
- **Fecha:** 2026-10-24 · **Ejecutor:** Claude Code · **Modo:** solo lectura (única escritura: este archivo)
- **Escrito para:** el rector y Victor

---

## Resumen (una pantalla)

**Línea base.** `npx vitest run` → **73 archivos / 1.783 pruebas, todo verde** (6,3 s). Ni lint ni build (la ficha no los pide). Huellas de los **seis** protegidos idénticas al empezar y al terminar, y coinciden con la §3 de `AJILEI_Protegidos_v1.0.md` (v1.8). Nota: la ficha dice «los cinco»; la lista vigente tiene seis desde la v1.4 (§H-1).

**Las cinco respuestas que más importan:**

| | Pregunta | Respuesta corta |
|---|---|---|
| a | Regla de puntos del cliente y si lee `ruleN` | `manosGanadas × puntosDe(game.nivelIA)` (`GameTable.jsx:2340`, `niveles.js:75`): **1/2/3 por nivel, plano, coincide con §2.2**. No cuenta asientos (ni `ruleN` ni por su cuenta): **no hay calculadora paralela que retirar**. Le falta el extra del AJILEI. «Ganó» sale de `lecturaDeMano` (VOZ-3), sin `game.winner` en el pago. Solo se ve en la pantalla de victoria de mesa, y se pierde al salir (sin persistencia, a propósito: `sesionCore.js:9-11`). |
| b | Qué recibe la RPC del fin de mano y qué falta | No se llama `finDeMano` en el servidor: es **`informar_pila(p_mesa, p_seq, p_pila, p_fin_vivos, p_fin_gano)`** (`eco1c_mesas_ia.sql:549-555`). Ya viajan **vivos** y **ganó**; el **nivel lo conoce el servidor** (`mesas_ia.reto`). **Faltan:** el **AJILEI (0/51/52)** y el **número de mano** (hoy solo hay `seq`, que cuenta avisos, no manos). Escribe `record_manos` (contador por reto × vivos). |
| c | ¿AJILEI 51/52 sin abrir protegidos? | **Sí.** `isAjilei(cards, ruleN)` y `getBestSuitScore` viven en `src/engine/handEvaluator.js`, que **no es protegido**, y ya los usa `celebracionCore.js:66`. En el pago, `players[0].cards` y `handRules.ruleN` siguen en el estado. La bandera `ajilei` del motor muere dentro de `doShowdown` (`gameEngine.js:222`), así que hay que **recalcular**, como hace la celebración. |
| d | Camino recomendado para la Fase 1 | **Camino 1:** ampliar `informar_pila` con `p_fin_mano` y `p_fin_ajilei`; tabla `libro_puntos` (una fila por mano ganada, clave única mesa+mano); total por **disparador** en una tabla `puntos_totales` con índice; dos RPC de lectura (`ranking_top`, `ranking_mio`) con parámetro de ranking; pantalla con `PantallaChips`-carcasa y tarjeta por portal. «Las grandes fortunas» con **solo la billetera** (§K-1). |
| e | Coste a pedido | Con los índices propuestos, el **top 100** cuesta lo mismo con 1.000 que con 1.000.000 de jugadores (lee 100 filas del índice). **«Mi puesto»** cuenta las filas que hay por encima: barato hasta ~100.000; con ~1.000.000 el peor caso (el último) recorre todo el índice. **Estimación por forma, no medida:** pasar a una copia refrescada hacia los **300.000–1.000.000** jugadores, o antes si la consulta pasa de ~200 ms (§G). |

**Lo que hay que decidir antes de la Fase 1** está en §K (14 preguntas, cada una con recomendación). Las tres del normativo §14: saldo con mesa abierta → **solo billetera** (K-1); ampliar o crear RPC → **ampliar `informar_pila`** (K-2); dónde vive la tarjeta → **componente propio montado por portal en `<body>`** (K-3).

---

## §0 · Método

- Lectura de `docs/AJILEI_Rankings_v1.0.md` entero, `docs/AJILEI_Protegidos_v1.0.md` (§1–§3), `docs/AJILEI_Invariantes_v1.0.md` (tabla §2 y §6), las nueve migraciones de `supabase/migrations/` en lo que toca, y los módulos del cliente citados abajo.
- Nada contra la base real. Ni `npm install`, ni arnés, ni copias de trabajo, ni commits.
- Cada cifra lleva `archivo:línea`. Lo que no se pudo leer está en §M.

---

## §A · Los puntos en el cliente, hoy

### A.1 · Mapa

| Paso | Dónde | Qué hace |
|---|---|---|
| Nivel de la mesa | `GameTable.jsx:318-324`, `nivelCore.js:45-47` | `conNivel` cuelga `nivelIA` del estado al crearlo («pasajero»; el motor lo transporta a ciegas). Nace con la mesa y no cambia (D-7). Lo trae `App` desde `mesa.reto` (`App.jsx:898`). |
| Quién ganó la mano | `GameTable.jsx:490-491` | `lectura = lecturaDeMano(game)`; en el pago `ganadorVisible = lectura?.principal ?? null`. |
| Acumulado de sesión | `GameTable.jsx:681-687` → `useSesion.js:18-28` → `sesionCore.js:26-35` | Al **entrar** en `PAYOUT`, `anotarMano({ handCount, gano: winner === 0, score })` con `winner = ganadorVisible`. Guarda de idempotencia por `handCount`. Lleva `manosJugadas`, `manosGanadas`, `mejorMano`. **No lleva puntos.** |
| Cálculo de puntos | `GameTable.jsx:2340` | `puntos={sesion.manosGanadas * puntosDe(game.nivelIA)}` — una multiplicación al pintar. |
| Tabla | `niveles.js:21,28,35` (`puntos: 1/2/3`), `niveles.js:75-77` (`puntosDe`) | Básico 1 · Avanzado 2 · Pro 3. Un id desconocido cae a Básico. El comentario `niveles.js:68-71` ya prohíbe la calculadora paralela de `ruleN + 3`. |
| Dónde se muestra | `Celebracion.jsx:301` (`Puntos obtenidos`), dentro de `TarjetaResumen` (`:180`), dentro de `PantallaVictoria` (`:330`, `:404`) | **Solo** en la pantalla de victoria de mesa (`GameTable.jsx:2329-2342`, rama `esVictoriaDeMesa`). La derrota (`:2344-2359`) no enseña puntos. La mesa en juego, tampoco. |

### A.2 · Respuestas

- **Regla:** por nivel, plana. **Coincide con §2.2** (IAS). No mira el tamaño de la mesa ni el monto.
- **Nivel:** del pasajero `game.nivelIA`. **Tamaño de la mesa:** no lo lee. No recuenta asientos ni lee `ruleN` para puntuar → **§2.3.3 se cumple hoy**; no hay nada que retirar. Lo que falta es el **extra del AJILEI** (§2.4), que hoy no existe.
- **Disparador:** la lectura de VOZ-3. En el camino de los puntos **no queda ninguna lectura de `game.winner` en el pago**: `ganadorVisible` usa `game.winner` solo fuera de `PAYOUT` (`GameTable.jsx:491`) y `useSesion` solo anota en `PAYOUT` (`useSesion.js:26`). La única lectura de `winner` dentro de `lecturaDeMano` es de presencia (`manoCore.js:79`).
- **Dos cálculos de «ganó», misma regla:** la sesión usa `lecturaDeMano(...).principal` (vía `repartoPorCapas`, `manoCore.js:81-86`); el servidor recibe `finDeMano(...).ganoHumano` (vía `ganadoresPorCapa`, `mesaIACore.js:175-181`). Son dos implementaciones de la regla de la capa 0, selladas como iguales por `scripts/testVoz3.test.js:195` y `:301` (1.500 mesas por tamaño). Caso borde: si `lecturaDeMano` devuelve `null` porque los tramos no casan (`manoCore.js:84`), la sesión no cuenta la mano como ganada y el servidor sí podría. Riesgo bajo (§I-7).
- **Cifras de puntos escritas a mano en `src/`:** solo `src/config/niveles.js:21` (1), `:28` (2), `:35` (3). No hay 5/6/7/8 ni `ruleN + 3` en código (solo el comentario `niveles.js:68`). En el servidor, ninguna cifra de puntos (no existe nada de puntos).
- **Persistencia:** ninguna. `useReducer` en memoria (`useSesion.js:19`), deliberado (`sesionCore.js:9-11`). Al salir o perder, los puntos de la sesión se pierden. Ni `localStorage` ni servidor.

---

## §B · El fin de mano en el servidor (ECO-1 1c y 1d)

### B.1 · La RPC

`public.informar_pila` (`supabase/migrations/20261008220239_eco1c_mesas_ia.sql:549-627`). No la redefine ni la 1d ni la 1g (`grep informar_pila` en las dos: solo comentarios, `eco1d…sql:37`).

| | |
|---|---|
| **Firma** | `informar_pila(p_mesa uuid, p_seq integer, p_pila bigint, p_fin_vivos integer default null, p_fin_gano boolean default null) returns mesa_ia_resultado` (`:549-555`). `security definer`, `search_path = ''`. |
| **Fin de mano** | Los dos últimos parámetros: si los dos son nulos, no es fin de mano (`:568`). Solo cuenta con un `seq` nuevo (`:588`), así que un reintento no suma dos veces. |
| **Valida** | sesión (`:571`), argumentos (`:574`), bloquea la billetera `for update` (`:577`), mesa propia (`:579-583`), abierta (`:584`), `seq` nuevo (`:587`). Pila por encima de `techo_cobro` → se topa y anomalía (`:592-596`). `vivos` fuera de `2…jugadores` o un dato nulo → **anomalía, no se anota** (`:599-602`). |
| **Escribe** | `record_manos` con `on conflict … do update` (suma `jugadas`, `ganadas_humano`, `ganadas_ia`) (`:603-613`) y la fila de `mesas_ia` (`pila_informada`, `seq_informada`, `anomalias`, `ultimo_aviso_en`) (`:617-623`). |
| **Devuelve** | `mesa_ia_resultado` (`:233-244`): `codigo, mesa_id, saldo, pila, techo, seq, cobrado, anterior_cerrada, anterior_cobro, motivo_cierre`. Nada de la mano. |
| **Límite por minuto** | **Ninguno**, a propósito (`eco1d…sql:37-39`: «no mueve dinero»). |
| **Permisos** | `authenticated` y `service_role` (`eco1c…sql:822`, `:829`). |

### B.2 · Desde dónde la llama el cliente

| Paso | Dónde |
|---|---|
| Efecto que mira la pila; al entrar en `PAYOUT`, una vez por `handCount`, añade el fin | `GameTable.jsx:513-522` |
| `finDeMano(state)` → `{ vivos: state.aliveCount, ganoHumano }` | `src/hooks/mesaIACore.js:175-181` |
| Cola ordenada: un aviso con fin de mano no se salta nunca; reintenta el mismo `seq` | `mesaIACore.js:7-20` (doctrina) |
| Llamada | `src/lib/mesaIAApi.js:79-85`: `llamar('informar_pila', { p_mesa, p_seq, p_pila, p_fin_vivos: fin.vivos, p_fin_gano: fin.ganoHumano })` |
| Espejo para el arnés y el bypass | `src/dev/bancoImitado.js:259-283` (mismas reglas, en JS) |

El cliente **no manda el nivel** (el servidor lo tiene en `mesas_ia.reto` desde `sentarse_ia`). **Sí manda los vivos**, leídos de `state.aliveCount`, no de `handRules.ruleN` (son iguales por construcción: los dos salen de la misma variable `alive` al barajar, `gameEngine.js:578-580`; ver §H-3).

### B.3 · La tabla de partidas contra las IAS

`public.mesas_ia` (`eco1c…sql:122-164`): `id uuid` (pk), `jugador_id`, `reto` (`basico|avanzado|pro`), `jugadores` (2–5, los de la mesa al sentarse), `apuesta`, `entrada`, `recargado`, `recargas`, `techo_cobro`, `pila_informada`, `seq_informada`, `anomalias`, `estado` (`abierta|cerrada`), `motivo_cierre`, `cobrado`, `token_apertura`, `dispositivo`, `reemplazo_de`, `reemplazo_cobro`, `abierta_en`, `ultimo_aviso_en`, `cerrada_en`.

- **Índices:** una sola abierta por cuenta, único parcial (`:167-168`); `(jugador_id, abierta_en)` (`:170-171`); `(jugador_id, cerrada_en) where estado = 'cerrada'` (`eco1d…sql:272-273`).
- **RLS:** activa, **sin políticas y sin privilegios** para el cliente (`eco1c…sql:803`, `:806`).
- **Mano:** **no hay identificador de mano** ni contador de manos. `seq_informada` cuenta avisos (cada apuesta es un aviso), no manos. El número de mano vive solo en el cliente (`game.handCount`).

`public.record_manos` (`eco1c…sql:185-198`): pk `(jugador_id, reto, vivos)`, `jugadas`, `ganadas_humano`, `ganadas_ia`, `actualizado_en`; `check jugadas = ganadas_humano + ganadas_ia`. Sin lectura del cliente (`:804`, `:807`). Victor la consulta con `record_manos_resumen()` (`:784-799`).

### B.4 · Qué falta para escribir el libro de §3

| Campo del libro (§3) | ¿Lo tiene el servidor hoy? | Cómo |
|---|---|---|
| jugador | sí | `auth.uid()` |
| fecha y hora | sí | `now()` |
| origen | sí | constante `'ias'` en esta RPC |
| nivel | **sí** | `mesas_ia.reto` (lo validó `sentarse_ia`) |
| sentados | sí (como `p_fin_vivos`) | validado `2…jugadores` (`:600`) |
| puntos base | **derivable en el servidor** | `case reto when 'basico' then 1 …` — espejo de `niveles.js`, como ya hace `ia_apuestas_de` (`eco1c…sql:64-76`). **No hace falta fiarse de una cifra del cliente.** |
| ajilei (0/51/52) | **no** | parámetro nuevo; lo calcula el cliente (confianza §10) |
| extra (0/1/2) | derivable | de `ajilei` |
| partida | sí | `p_mesa` |
| mano | **no** | parámetro nuevo (`game.handCount`), o contador propio en `mesas_ia` |

**Recomendación (una línea):** ampliar `informar_pila` con dos parámetros por defecto nulos (`p_fin_mano integer`, `p_fin_ajilei smallint`) y escribir el libro **en el mismo bloque `if v_fin` que ya escribe `record_manos`**, con clave única `(mesa_id, mano)` para la idempotencia; una RPC aparte duplicaría el bloqueo de la billetera, la cola por `seq` y la validación de la mesa, y abriría la puerta a una mano con récord y sin libro.

### B.5 · Límite de confianza (normativo §10), confirmado en el código

- Es el cliente quien dice «gané» (`p_fin_gano`, `mesaIAApi.js:83`) y la pila (`p_pila`). El servidor cobra `least(pila_informada, techo_cobro)` (`cerrar_partida_abierta`, `eco1c…sql:303-353`; techo en `:111-115`).
- Guardas del servidor: techo de cobro por mesa (`:111-115`, `:592-596`); `seq` creciente (`:587`); una mesa abierta por cuenta (`:167-168`, y `cerrar_partida_abierta`); límites por minuto en las funciones de dinero (`limite_dinero`, `eco1g…sql:100-112`: sentarse 10, recargar 20, salir 30, recoger 10) — **`informar_pila` sin límite**; la válvula del tope diario, **construida y apagada** (`eco1d…sql:241-257`, `tope_diario_ia` nulo; `valvula_cerrada` `:312-320`).
- Consecuencia para los puntos: un cliente alterado puede inventar `p_fin_gano = true` en cada mano y un `p_fin_ajilei = 52`. Hoy nada lo limita (sin límite por minuto). Ver §I-2.

---

## §C · El AJILEI en el motor

Lecturas de protegidos anotadas en §N.

| Pregunta | Respuesta |
|---|---|
| Dónde se calcula el puntaje | `getBestSuitScore(cards, numPlayers, comodinEnabled)` en **`src/engine/handEvaluator.js:8-31`** (no protegido). Comodín: 10 con 4, 11 con 5 (`:2-6`). |
| Dónde se decide el AJILEI | `isAjilei(cards, numPlayers)` en **`handEvaluator.js:38-61`**: natural = 5 del mismo palo que suman 51 (`:42-45`); comodín = **solo con 5**, 4 del palo + 7 de Oros, `resto + 11 = 52` (`:47-58`). El motor lo llama en `doShowdown` con el `ruleN` congelado (`gameEngine.js:214-223`). |
| ¿Sale del motor? | **No.** La bandera `ajilei` se queda en la variable local `withScores` (`gameEngine.js:219-223`); a los jugadores solo pasa `score` (`:238-241`). En la ruta de los retiros (`resolveWinner`, `gameEngine.js:198-206`) **ni siquiera hay `score`** (queda `null` desde el barajado, `:515-516`). |
| ¿Se puede leer en `PAYOUT`? | **Sí, recalculando.** En el pago siguen `players[0].cards` (`repartirCapas` solo toca `chips`, `pozos.js:361-363`) y `handRules.ruleN`/`comodinValue`. |
| La regla del 52 | Escrita en `handEvaluator.js:34` (comentario) y `:47-58` (código): solo con `numPlayers === 5`, que el motor pasa como `ruleN` = **vivos al barajar** (`gameEngine.js:44-49`, `:578-580`). Una mesa de 5 con un eliminado juega con `ruleN = 4` → sin 52 (§H-5). |
| 51 o 52 | `isAjilei` devuelve solo `true/false`. Para distinguir: con `isAjilei` verdadero, `getBestSuitScore(cards, ruleN, comodinValue !== null).points` da **exactamente 51 o 52** (natural sin 7 de Oros: 51; comodín: 41 + 11 = 52). Un natural de 51 no puede contener el 7 de Oros (con As 11, 7 vale 7, 6 vale 6 y el resto 10 —`src/dev/repartoGanador.js:23`—, un palo con el 7 suma como mucho 7+11+10+10+10 = 48), así que no hay ambigüedad. |
| Lector existente (modelo) | `decideCelebracion` (`src/hooks/celebracionCore.js:61-68`): `isAjilei(humanCards, ruleN)` con el `ruleN` congelado, **solo si el humano es el principal** (`:65`) → nivel `'ajilei'`. Lo usa `lecturaDeMano` (`manoCore.js:130-133`) y de ahí `useCelebracion`. Es justo la regla §2.4.3 (cobra el extra solo quien gana la mano). |
| AJILEI tras un retiro (§2.4.2) | Funciona igual: la celebración recalcula sobre las cartas, haya o no volteo. **Límite físico:** si todos se retiran en `BET_1` («a las 2»), el humano tiene 2 cartas y `isAjilei` exige 5 (`handEvaluator.js:39`); desde `BET_2` ya tiene 5 (`gameEngine.js:312-325`). |

**Veredicto:** **sí, sin abrir ningún protegido.** Basta una función pura nueva fuera del motor (p. ej. `ajileiDe(cards, handRules)` → 0/51/52, junto a `finDeMano` en `mesaIACore.js` o en `celebracionCore.js`), que use `isAjilei` y `getBestSuitScore` de `handEvaluator.js`. No hace falta exportar nada de `gameEngine.js`.

---

## §D · El servidor para el ranking

### D.1 · `profiles`

`supabase/migrations/0001_sup2a_identidad.sql:29-41`: `id uuid` (= `auth.users.id`, `on delete cascade`), `username text` (6–15, `[A-Za-z0-9_]`), `created_at`, `updated_at`. Índice único `lower(username)` (`:46-47`). **Ningún** campo de Premium, avatar, país ni estado. **El correo no está** (vive en `auth.users`; el cliente lo recibe por la sesión, `App.jsx:772`).

RLS (`:179-200`): **todos los autenticados leen todos los perfiles** (`profiles_select_autenticados`, `using (true)`); alta y cambio solo de la fila propia; sin borrado. Ninguna migración posterior la toca (`grep profiles` → solo estas políticas). Para el ranking, el username ya es legible; la RPC puede unirlo igual.

### D.2 · Billeteras y libro de movimientos (ECO-1 1a)

- `public.billeteras` (`eco1a_libro.sql:87-92`): `jugador_id` (pk → `profiles`, cascade), `saldo bigint` (`>= 0`), `actualizada_en`. El comentario de diseño ya previó el ranking: «el saldo en una columna, para que la cabecera **y el ranking** lean UNA fila» (`:78-80`).
- Disparador `billeteras_solo_por_libro` (`:112-155`): el **saldo** solo cambia con la marca del libro; **otras columnas no se vigilan** (`:101-103`, `:118-123`). Relevante para la opción (c) de K-1.
- `public.movimientos` (`:162-187`): libro de solo inserción, inmutable por disparador (`:205-227`); índice `(jugador_id, creado_en)` (`:189-190`). Es el molde del libro de puntos.
- **RLS y privilegios:** las cuatro tablas con RLS y **sin privilegios** para nadie del cliente (`:766-780`). El cliente solo tiene `mi_billetera()` (su propio saldo, `:690-701`, permiso `:800`). **Hoy nadie puede leer el saldo de otro.** Bien.
- **Índices sobre `saldo`:** **ninguno** (solo la pk). El ranking necesita uno nuevo.
- `dia_chicago(ts)` existe (`:342-348`) para el «día» de §3.

### D.3 · El récord de manos

Ver §B.3. Agregado por `(jugador, reto, vivos)` sin fecha por mano: **no sirve para auditar ni para el libro**, sí para cruzar (§O-2: puntos «que habría» = Σ `ganadas_humano × 1/2/3`).

### D.4 · Propuesta de esquema (solo descripción; sin SQL ejecutable)

**Tabla `libro_puntos`** (molde de `movimientos`):

| Columna | Tipo | Nota |
|---|---|---|
| `id` | bigint identity | pk |
| `jugador_id` | uuid → `profiles` cascade | |
| `creado_en` | timestamptz default now() | UTC; el día de Chicago se deriva con `dia_chicago` |
| `origen` | text check (`ias`, `humanos`) | |
| `nivel` | text null check (`basico`,`avanzado`,`pro`) | obligatorio si `origen = 'ias'`, nulo si `humanos` |
| `sentados` | smallint check 2–5 | |
| `puntos_base` | smallint | derivado en el servidor (IAS: 1/2/3; humanos: `sentados + 3`) |
| `ajilei` | smallint check (0, 51, 52) | 52 solo con `sentados = 5` |
| `extra` | smallint check (0, 1, 2) | derivado de `ajilei` |
| `mesa_id` | uuid | partida (IAS: `mesas_ia.id`; humanos: la mesa de MOT-1) |
| `mano` | integer | número de mano dentro de la partida |

Restricciones: `unique (origen, mesa_id, mano)` (idempotencia de reintentos); disparador de inmutabilidad como `movimientos_inmutable` (borrado solo en cascada); RLS sin privilegios. Sin Realtime (doctrina ECO-1, `eco1a…sql:801-821`).

**El total por jugador** — dos formas:

| | Disparador → tabla `puntos_totales(jugador_id pk, puntos bigint, ajileis int, actualizado_en)` | Vista (`select jugador_id, sum(puntos_base + extra) … group by`) |
|---|---|---|
| Pro | Se puede indexar `(puntos desc)`: top 100 y «mi puesto» por índice. Una sola fila por jugador. Escribe en la misma transacción que el libro. | Cero estado duplicado; imposible que diverja del libro. |
| Contra | Un estado más que guardar (se protege igual que `billeteras`: solo por el libro, y una consulta de verificación `total = Σ libro`). | Cada visita agrega el libro entero: O(filas del libro), no indexable. Bien con testers, mal con 10⁵+ manos. |
| Veredicto | **Recomendado** (es lo que el normativo §3 ya permite: «por disparador desde el libro»). | Solo si se quiere arrancar más rápido y migrar después. |

**Índices:**
- `puntos_totales (puntos desc, jugador_id)` — top 100 y «mi puesto» de Maestros.
- `billeteras (saldo desc, jugador_id)` — top 100 y «mi puesto» de Fortunas (o la expresión de K-1 (c)).
- `libro_puntos (jugador_id, creado_en)` — auditoría y la futura pestaña «Este mes».

**RPC mínimas** (todas `security definer`, `search_path = ''`, sin `raise` en el camino de negocio, permiso solo a `authenticated`):
- `ranking_top(p_ranking text)` → hasta 100 filas `(puesto, username, cifra, es_tu)`; `p_ranking in ('maestros','fortunas')`; `puesto = rank() over (order by cifra desc)` (empate compartido 1-2-2-4); `limit 100`. Sin `jugador_id` en la salida (§9: lo justo). Para abrir el mini-perfil desde la lista hace falta un identificador: o el username (único, `profiles_username_lower_uniq`) o un id opaco (§K-11).
- `ranking_mio(p_ranking text)` → una fila `(puesto, total, franja, cifra)`, o ninguna en Maestros si no tiene puntos (`setof` y `return;`, lección A2).
- `mini_perfil(p_username text)` → `(username, puesto_maestros, puntos, puesto_fortunas, saldo)`; para el propio, el cliente añade el correo que ya tiene (no viaja).
- Una sola RPC por función con parámetro y no dos por ranking: menos superficie, misma forma de respuesta.

**RLS:** el cliente nunca lee `billeteras`, `libro_puntos` ni `puntos_totales`; solo lo que devuelven las RPC (igual que hoy con `mi_billetera`).

### D.5 · Saldo total con mesa abierta (normativo §5)

**Cómo está modelado hoy:**
- Al sentarse, la entrada **sale de la billetera** (`aplicar_movimiento(…'entrada_ia', -p_entrada…)`, `eco1d…sql:506-508`) y nace la mesa con `pila_informada = entrada` (`:515-522`).
- Cada apuesta y cada pozo mueven `pila_informada` (`informar_pila`, muchas veces por mano). Las recargas suben `recargado` y `pila_informada`.
- Al salir/abandonar vuelve `least(pila, techo)` a la billetera (`salir_ia`, `cerrar_partida_abierta`).
- Precedente de «lo que te llevarías»: `ganancia_ia_hoy` ya suma `least(pila_informada, techo_cobro)` de la abierta (`eco1d…sql:291-308`).

| Camino | Qué cuesta |
|---|---|
| (a) Solo billetera | Nada nuevo: índice en `billeteras.saldo`. Coincide al byte con la píldora (INV-46). Quien está sentado aparece más bajo mientras juega. |
| (b) Billetera + pila declarada de la abierta | La cifra cambia **en cada apuesta**. O se calcula al vuelo (unión con `mesas_ia` abiertas → **no hay índice que la ordene**: top 100 = recorrer y ordenar todas las billeteras en cada visita), o se mantiene una columna en cada `informar_pila` (la llamada más frecuente pasa a escribir dos filas y dos índices). Además, la pila informada **va por detrás** del juego real (cola, `seq`). |
| (c) Billetera + lo puesto en la mesa (`entrada + recargado`) | Intermedio: cambia solo al sentarse, recargar y cerrar (ya bloquean la billetera). Una columna `en_mesa` en `billeteras` (el disparador no la vigila) y un índice de expresión `(saldo + en_mesa)`. Pero no es «lo que te llevarías»: es «lo que pusiste». |

**Recomendación (una línea):** **(a) solo la billetera**: quien mira los rankings no puede estar sentado en ese mismo dispositivo (la mesa y el lobby son pantallas excluyentes y salir cobra, `App.jsx:888-905`), así que su propia cifra siempre cuadra con su píldora; la distorsión solo afecta a otros jugadores mientras juegan, y (b) cuesta un índice imposible o una escritura extra en cada apuesta.

### D.6 · Empates y franja

- **Mi puesto** (competición estándar, 1-2-2-4): `1 + count(*) where cifra > mi_cifra`, por el índice (`index only scan` del tramo por encima). No recorre la tabla entera salvo para el último.
- **Total:** Maestros = filas de `puntos_totales` con `puntos > 0` (si la fila nace con la primera línea del libro, son todas). Fortunas = todas las billeteras (incluidas las de saldo 0, que comparten un mismo puesto).
- **Franja:** `ceil(puesto * 100.0 / total / 5) * 5` → «dentro del N %». Ejemplos: 28 % → 30; 3 % → 5; puesto 1 de 1 → 100 (la nota de §6.3).
- **El total** cuesta un `count(*)`: con 10⁶ filas, un recorrido del índice. Si pesa, un contador por disparador en la misma tabla de ajustes (§G).

---

## §E · La pantalla

### E.1 · El lobby

- La barra de abajo: `src/screens/Lobby.jsx:267-279` — `Rankings` (`data-accion="rankings"`, `IconoTrofeo`, `t('lob.nav.rankings')`, `:268-270`), `Tienda` (`:273-275`), `Cómo se juega` (`:276-278`).
- **Detrás de Rankings:** `onClick={pronto}` (`:268`) → el toast común «**Pronto**» (`t('lob.toast.pronto')`, `Lobby.jsx:137-141`, `:371-373`; clave en `textos.es.js:43`). No dice «Próximamente».
- **Navegación:** un `screen` en `App` y una cascada de `if` sin router (`App.jsx:199-212`, `:810-944`). El lobby no conoce `screen`: recibe callbacks (`Lobby.jsx:65-68`, `:75`). Para Rankings: una prop nueva `onRankings` en `Lobby`, un `screen === 'rankings'` en la cascada, envuelto con `conVideo` como las demás pantallas con barra (`App.jsx:796-798`).

### E.2 · La pantalla de victoria

- El control: `src/components/Celebracion.jsx:421` — `<SoundButton className="btn cel-ranking" onClick={alternaAviso}>Ver tu nuevo ranking</SoundButton>`; el aviso «Próximamente» en una región viva siempre montada (`:426`), se retira a los 3 s (`:313-314`, `:341-353`). **Sin `href` y sin navegar**, y eso es puerta del arnés (`diagCEL0.mjs:1438`, `:1607`).
- La pantalla vive **dentro de `GameTable`** (`GameTable.jsx:2329-2342`), no en `App`. Recibe `onLeave` y nada más que permita salir a otra pantalla.
- **Momento:** al entrar en la victoria se cobra la mesa (`control.salir`, `GameTable.jsx:927-935`); la cola garantiza que el último fin de mano llegó antes que la salida (`mesaIACore.js:7-12`). Por tanto, **cuando llega `saldoFinal`, el libro ya tiene la última mano** y la posición nueva es legible. Es la señal natural para habilitar «Ver tu nuevo ranking».
- **Enganche:** la tarjeta propia se monta dentro de `PantallaVictoria` y se pinta por portal en `<body>` (fuera de `#root`, así **no hereda el `zoom` de la escala de la mesa**, INV-59). Ver §K-3.

### E.3 · Piezas reutilizables

| Pieza | Dónde | ¿Sirve? |
|---|---|---|
| `PantallaChips` (carcasa: barra, cabecera con flecha, cuerpo, CTA, casa, toast) | `src/components/PantallaChips.jsx:1-40` | **Sí, como carcasa** (barra superior + flecha + casa). El CTA y su nota no aplican; habrá que ver si acepta una pantalla sin CTA (§M). |
| `FilaChips` (fila de chips con `aria-pressed`) | `src/components/FilaChips.jsx` | **Sí para las dos pestañas** (dos chips, `aria-pressed`). No es un `tablist` ARIA; la Fase 1 decide si basta. |
| Círculo con la inicial (SAL-3) | `inicialDe` en `src/screens/salaEsperaCore.js:37-40`; `.sal-esp-av` / `.sal-esp-ini` en `src/styles/salas.css:947-956` (la imagen de AVA-1 ya tiene su regla, `:956`) | **Sí**, la función tal cual; el CSS va ligado a `--silla` de la sala: copiar el patrón con su propia medida. |
| Píldora de saldo / `BarraSuperior` | `src/components/BarraSuperior.jsx` (`lob-avatar`, `:134`) | **Sí**, viene con la carcasa. |
| `lobby.css` (`--u: clamp(3.2px, 1vmin, 6px)`) | `src/styles/lobby.css:66`; `salas.css:56` igual | **Sí**: la unidad de las pantallas de lobby. |
| Tarjeta de «Retar» | `src/screens/RetarIAS.jsx` | Modelo visual de tarjeta; no hay componente «tarjeta» genérico extraído. |
| Aviso de saldo por portal | `src/components/AvisoSaldo.jsx:2`, `:54` (`createPortal`) | **Sí, como molde** del mini-perfil. También `MarcoVideo.jsx:88`. |
| `PantallaVictoria` / `TarjetaResumen` | `Celebracion.jsx:180`, `:330` | Solo se toca el enlace (`:421-426`). |

### E.4 · Tamaños

- **La escala de TAB-1 vive solo en la mesa:** `useEscalaMesa()` lo monta `GameTable` y solo él (`src/hooks/useEscalaMesa.js:5`, `GameTable.jsx:415`); `src/lib/escala.js:28-31`: «Fuera de la mesa, el lobby, Retar y Salas ya escalan solos con `--u` en `vmin`; bajo `zoom` crecerían dos veces». INV-59. **Excepción que importa:** la pantalla de victoria es parte de la mesa, así que sí está bajo `zoom` (por eso `TarjetaResumen` mide con `aPropios`, `Celebracion.jsx:211-214`).
- **Cortes que ya usan las pantallas de lobby:**

| Hoja | Cortes |
|---|---|
| `src/index.css` | `#root` de 1126 px (`:58`) y `max-width: 1024px` (`:28`, `:80`, `:90`); el lobby y las salas lo exceptúan (`lobby.css:26-28`, `salas.css:24`) |
| `lobby.css` | `max-height: 660px` (`:834`); horizontal `max-height: 520px` (`:847`); horizontal `661–749` (`:866`); movimiento reducido (`:448`, `:814`) |
| `salas.css` | `max-height: 660px` (`:1211`, `:1259`); `661–800` (`:1233`); horizontal `≤ 520` (`:1237`, `:1266`); horizontal `521–830` (`:1284`); `max-height: 800px` (`:1548`); horizontal `≤ 800` (`:1682`); horizontal `min-width: 900px` y `≤ 830` (`:1713`) |
| `celebracion.css` | vertical (`:242`, `:322`); horizontal `≤ 600` (`:259`, `:325`, `:476`) |

  La lámina debería cubrir: celular vertical (360×640, 412×915), celular acostado (≤ 520 de alto), tableta vertical (744×1100 del iPad mini en app), horizontal bajo 521–830 (el rango de `tam`, INV-55), laptop (`h`, 1366×768) y monitor (1920×1080).

### E.5 · Textos

- Diccionario: `src/config/textos.es.js` (207 claves; formato `'prefijo.cosa': 'texto'`). Resolución con `t(clave, vars)` (`src/config/textos.js:80`) y huecos `{n}` (`interpolar`, `:107-127`). Una clave que falta pinta `⟦clave⟧` (`textos.js:47-50`, `:90`).
- Reglas selladas por `src/config/textos.test.js`: minúsculas y sin espacios (`:49-63`); **prefijo dentro de una lista cerrada** `['lob.', 'sal.', 'ia.', 'app.', 'aviso.', 'video.']` (`:67-95`, la lista en `:92`) → Rankings necesita **ampliar la lista** con `rnk.` (o similar); sin dos claves con el mismo texto salvo los pares declarados (`:98`).
- **Claves nuevas estimadas (provisional, ~30):** título de la pantalla; las dos pestañas; el subtítulo de mérito y el de poder (§1.2); cabeceras de columna (puesto, jugador, puntos, Heptacoins); «Tu posición»; «Puesto {n}»; «dentro del {p} %»; «Gana tu primera mano para entrar»; vacío/cargando/sin red/reintentar; el mini-perfil (sus dos líneas de ranking, «Correo», «Editar» y los huecos de país); la tarjeta de SumaMente (título, línea, botón); y en la victoria «Ver tu nuevo ranking» (hoy escrito a mano, `Celebracion.jsx:421`).
- **Textos de la victoria escritos a mano, no por `t()`:** «Puntos obtenidos», «Manos jugadas», «Manos ganadas», «Tu mejor mano» (`Celebracion.jsx:301-306`), «Ver tu nuevo ranking» (`:421`), «Próximamente» (`:426`), «Salir de la mesa» (`:415`). Rankings solo está obligado a lo que añade (§1.3); ver §K-9.

### E.6 · Premium y avatar

**No existe ningún dato de Premium ni de avatar** ni en el cliente ni en el servidor (`grep -i premium` en `src/` y `supabase/` → solo comentarios: «la entrada premium» de «Mano actual», `menuEntradas.js:82`, `UtilitiesMenu.jsx:210`, y «Premium o no» en `eco1d…sql:50`). El avatar del lobby es un icono genérico (`BarraSuperior.jsx:134`). **La corona y el avatar son huecos.** Tampoco hay en el repo ningún recurso ni enlace de SumaMente (solo la mención en `src/assets/heptacoin.svg:4`).

---

## §F · El arnés

- **Modos que miran el lobby:** `diagDSK lob` (`scripts/diagDSK.mjs:1184` y `:1220` miden `[data-accion="rankings"]` y su `svg`), y también `tam`, `webkit`, `saldo`, `constancia`, `video` (todos en `MODOS_PREVIEW`, `diagDSK.mjs:427`, contra el bundle real en 4173). `humo` corre `lob`.
- **La pantalla de victoria:** `scripts/diagCEL0.mjs` modo `celebracion` (5173): mide el control `.cel-ranking` (`:387-395`, `:416`, `:452`, `:1378`), lo pulsa y exige el aviso «Próximamente», la región viva `polite`, el retiro a los 3,5 s y el segundo toque (`:1395-1438`), y que no tenga `href` (`:394`, `:429`, `:1607`). **Estas puertas cambian** cuando el control navegue.
- **Pruebas sobre los puntos que la Fase 1 reescribe o amplía:**

| Prueba | Archivo:línea |
|---|---|
| «5. Puntos de ranking vs IA (§6.1)» — tabla 1/2/3, plana (`puntosDe.length === 1`), defecto | `scripts/testNiveles.test.js:182-199` |
| «VC2 · sesión» — `anotarMano`, idempotencia, mejor mano | `scripts/testCelebracion.test.js:222-272` |
| «ECO-1c · finDeMano (C7)» — `toEqual({ vivos, ganoHumano })`: **se rompe** si `finDeMano` gana campos | `src/hooks/mesaIACore.test.js:200-226` |
| VOZ-3 — `lectura.ganoHumano === finDeMano(pago).ganoHumano` | `scripts/testVoz3.test.js:195`, `:301` |
| Contrato del banco imitado contra el guion SQL | `bancoImitado.test.js` + `supabase/pruebas/eco1c_verificacion.sql` (y `npm run guiones`, PGlite) |
| `diagCEL0` — «Puntos obtenidos» = 0 en la victoria sembrada | `scripts/diagCEL0.mjs:366`, `:1603` |

- **Modo nuevo `rnk`:** en `diagDSK`, dentro de `MODOS_PREVIEW` (bundle real + sesión simulada de `contextoCap` + banco imitado, INV-16), igual que `saldo`/`mesaia`. El banco imitado (`src/dev/bancoImitado.js`) tiene que aprender las RPC nuevas y el libro.
- **Invariantes que toca Rankings:**

| INV | Por qué |
|---|---|
| INV-01 / INV-39 | No hace falta abrir protegidos (§C). |
| INV-05 (O1) | La lista, la posición propia y la tarjeta de SumaMente con caja reservada (la tarjeta aparece 1 de cada 5 veces). |
| INV-07 | Piso táctil de 44 px en el lobby: filas tocables de la lista y las pestañas. |
| INV-08 | Un solo oro: la pestaña activa y la Tienda de la barra. |
| INV-12 | Si la frecuencia de SumaMente se guarda, la clave entra en el censo (`scripts/testClavesAlmacen.test.js:13-33`). |
| INV-46 | Una sola cifra de saldo: la cifra propia en Fortunas y en la tarjeta tiene que coincidir con la píldora (refuerza K-1 (a)). |
| INV-47 | El fin de mano viaja en el aviso de pila: el libro se escribe ahí. |
| INV-56 | Ninguna espera sin salida: las RPC nuevas pasan por el tope del cliente. |
| INV-59 | La escala solo en la mesa: la pantalla de rankings no recibe `data-escala`; la tarjeta desde la victoria va por portal fuera de `#root`. |
| INV-63 | Ganar la mano = capa principal: la regla del punto. |

- **Invariantes nuevos propuestos:**
  - **INV-65 · Los puntos de una mano salen de una sola regla.** El servidor deriva los puntos base del reto de la mesa (IAS) o de `sentados + 3` (humanos) y el extra del AJILEI; el cliente nunca manda una cifra de puntos. Lo que la sesión enseña usa la misma función pura, espejo del SQL (molde de `ia_apuestas_de` ↔ `niveles.js`).
  - **INV-66 · El total es derivable del libro.** `puntos_totales.puntos = Σ (puntos_base + extra)` del libro para cada jugador; lo comprueba el guion de verificación y una consulta de Victor.
  - **INV-67 · Los rankings no revelan la cuenta.** Las RPC devuelven solo username, puesto y cifra (ni correo, ni uuid, ni ganados/perdidos); el cliente no lee `billeteras` ni el libro.

---

## §G · Coste (estimación por forma, sin ejecutar nada)

**Escritura:** una fila del libro por mano ganada (más la actualización de una fila de `puntos_totales`), dentro de la transacción de `informar_pila` que ya existe. Tamaño por fila: ~24 B de cabecera + ~70 B de datos (uuid 16, timestamptz 8, uuid 16, enteros pequeños, dos textos cortos) ≈ **100 B**, y con sus dos índices (único `mesa+mano`, `jugador+fecha`) ≈ **200 B por mano ganada**. Un millón de manos ganadas ≈ 200 MB.

**Lecturas a pedido** (Postgres, índice B-tree, datos en memoria; órdenes de magnitud, no medidas):

| Jugadores | Top 100 (índice + 100 uniones a `profiles`) | «Mi puesto», caso medio | «Mi puesto», peor caso (el último) | `count(*)` del total |
|---|---|---|---|---|
| 1.000 | < 1 ms | < 1 ms | < 1 ms | < 1 ms |
| 100.000 | ~1 ms | ~5 ms | ~10–20 ms | ~10–20 ms |
| 1.000.000 | ~1 ms | ~50 ms | ~100–200 ms | ~100–200 ms |

- El top 100 no crece con la tabla. «Mi puesto» crece con el puesto (cuenta las filas de arriba). Una visita = top + mío (+ total) ≈ 2–3 consultas por ranking.
- **Con «Las grandes fortunas» en (b)** (§D.5) no hay índice que sirva: cada visita ordena todas las billeteras → ~0,5–1 s con 10⁶. Otra razón para (a).
- **Con el total por vista** (camino 2), cada visita agrega el libro entero: con 10⁶ manos, segundos. Solo tolerable con testers.
- **Cuándo pasar a una copia refrescada:** hacia los **300.000–1.000.000** jugadores, o en cuanto el `p95` de «mi puesto» pase de ~200 ms (las cifras de la tabla son de forma; habría que medirlas con datos sembrados). **Cómo, sin tocar la pantalla:** una vista materializada `ranking_copia(jugador_id, cifra, puesto, total)` refrescada cada X minutos con `pg_cron` (`refresh materialized view concurrently`, con índice único), y las mismas `ranking_top`/`ranking_mio` leyendo de ella en vez de las tablas vivas. La firma de las RPC no cambia; la pantalla no se entera (§8 del normativo). Coste conocido: el puesto propio puede ir X minutos por detrás justo después de ganar (la tarjeta de la victoria lo notaría; ahí se puede leer en vivo solo el propio).

---

## §H · Contradicciones

| # | Qué dice el código / el repo | Qué dice el normativo o la ficha | Qué habría que cambiar |
|---|---|---|---|
| H-1 | La lista canónica tiene **seis** protegidos (`AJILEI_Protegidos_v1.0.md:87-94`, desde la v1.4) | La ficha §2.3 y §5.1 dice «los cinco» | La ficha. Aquí se tomaron las huellas de los seis. |
| H-2 | En el servidor no existe `finDeMano` ni `p_fin_gano` como RPC: la RPC es `informar_pila` con `p_fin_vivos` y `p_fin_gano` (`eco1c…sql:549-555`); `finDeMano` es del cliente (`mesaIACore.js:175`) | Normativo §3 y §13: «`finDeMano` / `p_fin_gano`» como punto de escritura del servidor | Solo el nombre en el normativo (la idea es correcta). |
| H-3 | Los sentados que viajan son `state.aliveCount` (`mesaIACore.js:176`) y la columna se llama `vivos` (`eco1c…sql:188`) | §2.3.3: los sentados son `handRules.ruleN`, fuente única; el libro los llama `sentados` | Son iguales por construcción (`gameEngine.js:578-580`), pero la Fase 1 debería leer `handRules.ruleN` para cumplir la letra de §2.3.3. |
| H-4 | El cliente puntúa por nivel y **no da extra** por AJILEI (`GameTable.jsx:2340`) | §2.4: +1 / +2 | La Fase 1 añade el extra en servidor y sesión. |
| H-5 | El 52 exige `ruleN === 5` = **cinco vivos al barajar** (`handEvaluator.js:48`; `gameEngine.js:47`, `:580`) | §2.4: «solo posible en mesa de 5» | Precisar en el normativo: «con cinco sentados al barajar». Una mesa de 5 con un eliminado no puede dar 52. |
| H-6 | En mesa de 4, 4 del palo (41) + 7 de Oros (10) puntúa 51 pero **no es AJILEI** (`handEvaluator.js:28` frente a `:47`; ya anotado en MOT-1 Fase 0 R-5) | §2.4 no lo menciona | Precisar: esa mano no lleva extra. |
| H-7 | Un retiro de todos en `BET_1` deja al humano con 2 cartas: no puede haber AJILEI (`handEvaluator.js:39`) | §2.4.2: «basta tenerlo aunque los demás se hayan retirado» | No es contradicción; precisión para el normativo. |
| H-8 | «Ver tu nuevo ranking» solo existe en la **victoria de mesa** (`GameTable.jsx:2329`); quien pierde o sale a mitad no ve ninguna pantalla de fin | §7.2: la tarjeta propia se abre desde la pantalla de victoria | Nada que cambiar; dejar claro que los puntos ganados en una mesa perdida sí entran al libro aunque no haya pantalla que lo diga. |
| H-9 | Los textos de la victoria están escritos a mano (`Celebracion.jsx:301-306`, `:415`, `:421`, `:426`) | §1.3: textos nuevos por `t()` | Al menos el control de ranking y su aviso pasan a `t()` (K-9). |
| H-10 | El lobby responde «Pronto» (`textos.es.js:43`), no «Próximamente» | La ficha §3.E pregunta por «Próximamente» | Nada; dato. |
| H-11 | No hay índice sobre `billeteras.saldo` (solo pk, `eco1a…sql:87-92`) | §8: «ambas sobre un índice por puntos (y por saldo)» | La migración de la Fase 1 lo crea. |
| H-12 | Las puertas de `diagCEL0` exigen «Próximamente» y control sin `href` (`diagCEL0.mjs:1438`, `:1607`) | §7.2: el control abre la tarjeta | Reescribir esas puertas en la Fase 1. |
| H-13 | `profiles` → `on delete cascade` arrastraría el libro (si se modela como `movimientos`, `eco1a…sql:164`) | §3: el libro es «imborrable» | Decidir si «imborrable» admite el borrado de cuenta (K-12). |
| H-14 | `textos.test.js:92` cierra la lista de prefijos | §1.3 pide textos por `t()` | Ampliar la lista con el prefijo de Rankings en la Fase 1. |

---

## §I · Riesgos (de mayor a menor gravedad)

| # | Riesgo | Mitigación (una línea) |
|---|---|---|
| I-1 | Una mano ganada con récord y sin línea en el libro (o al revés) si se escribe por dos caminos | Escribir el libro en el mismo bloque `if v_fin` de `informar_pila`, misma transacción, con clave única `mesa+mano`. |
| I-2 | Inflado de puntos por un cliente alterado: `informar_pila` no tiene límite por minuto y acepta cualquier `p_fin_gano`/`p_fin_ajilei` | Heredado y declarado (§10); añadir validaciones baratas: `p_fin_mano` estrictamente creciente por mesa, `ajilei = 52` solo con `sentados = 5`, y una consulta de Victor que cante manos/minuto anómalas. |
| I-3 | El total por disparador diverge del libro (edición a mano desde el Editor) | Proteger `puntos_totales` como `billeteras` (solo por el libro) y verificación `total = Σ libro` en el guion. |
| I-4 | «Mi puesto» y el `count(*)` crecen con la tabla | Índices de §D.4; plan de copia refrescada de §G; medir con datos sembrados antes del lanzamiento abierto. |
| I-5 | Las puertas viejas de `diagCEL0` y las pruebas `toEqual` de `finDeMano` se ponen rojas | Reescribirlas en la misma tanda que cambia el comportamiento (lista de §F). |
| I-6 | La tarjeta desde la victoria hereda el `zoom` de la mesa | Portal a `<body>` (fuera de `#root`), molde `AvisoSaldo`. |
| I-7 | Divergencia cliente/servidor en «ganó» en el caso borde de `lecturaDeMano = null` | Que la sesión use la misma función que viaja (`finDeMano` + `ajileiDe`) para sumar puntos, no `lectura.principal`. |
| I-8 | Empates en el corte del top 100 (el puesto 100 compartido por 30) | Decidir la regla (K-4) y sellarla en el guion. |
| I-9 | Franjas raras con pocos jugadores («dentro del 70 %») | Conocido y aceptado (§6.3). |

---

## §J · Caminos para la Fase 1

Minutos de Claude Code, estimados. **No se comprimen:** la revisión de la lámina por Victor, el `db push`, el túnel y las pruebas en teléfono.

| Camino | Qué es | Minutos de CC | Fuera de CC |
|---|---|---|---|
| **1 (recomendado)** | Ampliar `informar_pila` (`p_fin_mano`, `p_fin_ajilei`) + `libro_puntos` + `puntos_totales` por disparador + índices + `ranking_top`/`ranking_mio`/`mini_perfil` + banco imitado + guion PGlite; cliente: `ajileiDe`, sentados por `ruleN`, sesión con la misma regla; pantalla Rankings + tarjeta por portal + SumaMente + textos; victoria enganchada; modo `rnk`; INV-65…67 y documentos | **~600–720** | lámina (1 vuelta mínimo), `db push`, túnel con S25 y un iPhone |
| 2 | Igual, pero el total por **vista** (sin `puntos_totales` ni disparador) | ~570–690 (ahorra ~30) | igual; reabrir al crecer (§G) |
| 3 | Igual que 1, pero Fortunas con la columna `en_mesa` (K-1 (c)): `sentarse_ia`, `recargar_ia` y el cierre la mantienen; índice de expresión | ~660–780 (+~60) | igual |

Descartado: una RPC nueva `anotar_mano_ia` aparte de `informar_pila` (duplica bloqueo, `seq` y validación; dos llamadas por mano; riesgo I-1).

---

## §K · Preguntas al rector

| # | Pregunta | Recomendación |
|---|---|---|
| K-1 | **Saldo total con mesa abierta (§5, §14.5):** (a) solo billetera, (b) billetera + pila declarada, (c) billetera + lo puesto en la mesa | **(a)**. Razones en §D.5: la cifra propia siempre cuadra con la píldora (INV-46), (b) no tiene índice posible o escribe en cada apuesta, (c) mide «lo que pusiste» y no «lo que te llevarías». |
| K-2 | **¿Se amplía la RPC o se crea otra? (§14.2)** | **Ampliar `informar_pila`** con dos parámetros por defecto nulos; el libro en el mismo bloque que `record_manos`. |
| K-3 | **¿Dónde vive la tarjeta (mini-perfil)?** | Componente propio (`MiniPerfil`), montado por **portal en `<body>`** (molde `AvisoSaldo.jsx:54`), que se abre desde la lista y desde `PantallaVictoria`; no navega (no es un `screen`). |
| K-4 | Top 100 con empate en el corte | Cortar en **100 filas** (orden `cifra desc, username`); quien comparte el puesto 100 y queda fuera ve su puesto en «Tu posición». |
| K-5 | «Ver tu nuevo ranking»: ¿cuándo se habilita y qué abre? | Habilitado cuando llega `saldoFinal` (el libro ya tiene la última mano, §E.2); abre la tarjeta propia. Sin servidor (bypass) → la tarjeta con un estado «sin datos». |
| K-6 | «Puntos obtenidos» en la victoria: ¿suma el extra del AJILEI? ¿de dónde sale? | Sí; la sesión suma por mano con la **misma función pura** que el servidor espeja en SQL (INV-65), alimentada por `finDeMano` + `ajileiDe`; no `manosGanadas × puntosDe`. |
| K-7 | Sentados: ¿`handRules.ruleN` o `aliveCount`? | **`handRules.ruleN`** (letra de §2.3.3); son iguales hoy. |
| K-8 | El 52: ¿«mesa de 5» significa «cinco sentados al barajar»? | Sí; precisarlo en el normativo (H-5) y validar en SQL `ajilei = 52 ⇒ sentados = 5`. |
| K-9 | ¿Rankings pasa a `t()` los textos de la victoria escritos a mano? | Solo el control de ranking y su aviso (los que Rankings cambia); el resto, a IDI-1. Prefijo nuevo `rnk.` en la lista de `textos.test.js:92`. |
| K-10 | SumaMente «1 de cada 5 visitas»: ¿azar o contador? ¿qué enlace e imagen? | **Azar por visita** (sin clave de almacenamiento, sin tocar INV-12). El enlace y la imagen no existen en el repo: los pone Victor. |
| K-11 | Identificador para abrir el mini-perfil desde la lista | El **username** (único sin mayúsculas, `0001…sql:46-47`); no exponer el uuid. Riesgo: si alguien cambia de nombre entre la lista y el toque, «no encontrado» y se recarga. |
| K-12 | ¿«Imborrable» admite el borrado de la cuenta (cascade)? | Sí, igual que `movimientos` (`eco1a…sql:164`, `:199-204`); el normativo lo dice en una línea. |
| K-13 | Puntos retroactivos desde `record_manos` | **Empezar en cero**: `record_manos` no tiene partida, mano ni fecha por mano, y el libro las exige (§3). |
| K-14 | Maestros: ¿quien tiene 0 puntos ve «Gana tu primera mano para entrar» también en la tarjeta de la victoria? | Imposible en la victoria (ganar la mesa implica ganar al menos una mano, salvo que las IAS se queden sin fichas por el ante); en ese borde, la frase de §5. |

---

## §L · Estimación de la Fase 1 en sub-tandas

| Sub-tanda | Contenido | Minutos de CC | STOP |
|---|---|---|---|
| 1-L | Lámina: pantalla Rankings (dos pestañas, top, «Tu posición», vacío de Maestros, SumaMente) y la tarjeta (propia y ajena), en los tamaños de §E.4 | ~120 | revisión de Victor |
| 1a | Migración (libro, totales, disparadores, índices, `informar_pila` ampliada, tres RPC) + guion de verificación + `npm run guiones` (PGlite) | ~120 | **`db push` de Victor** |
| 1b | Cliente del fin de mano: `ajileiDe`, `ruleN`, `p_fin_mano`; sesión con la misma regla; banco imitado y sus pruebas; `finDeMano`/VOZ-3/niveles reescritas | ~100 | — |
| 1c | Pantalla Rankings + `MiniPerfil` + API de lectura + textos `rnk.*` + SumaMente + navegación en `App` y `Lobby` | ~180 | túnel |
| 1d | Victoria enganchada (K-5, K-6) + `diagCEL0` reescrito + modo `diagDSK rnk` + INV-65…67 + Invariantes §6 + informe | ~150 | túnel + teléfonos, commits |
| **Total** | | **~670** (~11 h) | |

---

## §M · Imposibles o fuera de tope

- **Nada imposible.** Todo lo de §1 de la ficha se puede construir sin abrir protegidos.
- No verificado (por tope o porque no se lee sin ejecutar): si `PantallaChips` admite una pantalla **sin CTA** (leí solo su cabecera `:1-40`); las cifras de coste de §G son **de forma**, no medidas; los nombres de las cuatro cuentas de prueba no están en el repo (la consulta §O-2 las lista todas).
- No se corrieron lint ni build (la ficha no los pide; regla 7).

---

## §N · Lecturas de protegidos

| Archivo | Líneas | Motivo |
|---|---|---|
| `src/engine/gameEngine.js` | `grep` de `isAjilei\|ajilei\|ruleN\|comodinValue\|handRules\|aliveCount\|score:` (líneas sueltas 2–741) | Localizar dónde se decide el AJILEI y dónde se congela `ruleN` (bloque C). |
| `src/engine/gameEngine.js` | 10–26 | `PHASES` (en qué fase hay 5 cartas). |
| `src/engine/gameEngine.js` | 30–50 | `makeHandRules`: `ruleN` y `comodinValue`. |
| `src/engine/gameEngine.js` | 180–207 | `resolveWinner`: la ruta de los retiros conserva las cartas y no tiene `score`. |
| `src/engine/gameEngine.js` | 205–300 | `doShowdown`: la bandera `ajilei` muere en la variable local. |
| `src/engine/gameEngine.js` | 505–530, 570–585 | `startHand`: `aliveCount` y `handRules` salen del mismo `alive` (H-3). |
| `src/engine/gameEngine.js` | `grep` de `DISCARD\|deckPtr\|…` (líneas 16, 312–331, 561–576) | En qué paso el humano tiene 5 cartas (H-7). |
| `src/engine/gameEngine.js` y `src/engine/aiPlayer.js` | líneas sueltas devueltas por un `grep "puntos"` sobre todo `src/` (gameEngine 38, 277, 278; aiPlayer 139, 178, 181, 197, 557, 1079, 1087, 1428) | Incidental: censo de cifras de puntos escritas a mano (bloque A). Ninguna es de ranking. |
| `src/styles/gameTable.css` | solo el nombre del archivo, en un `grep -l premium` | Incidental: censo de Premium (bloque E.6). No se leyó contenido. |
| `src/engine/deck.js`, `src/config/seatLayouts.js`, `src/styles/opponentPanel.css` | — | No leídos. |

**Huellas al byte** (sha256 completo · líneas · bytes), idénticas al empezar (17:10) y al terminar:

| Archivo | sha256 | líneas | bytes |
|---|---|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a9010c727c5da4e1af039462d7aec58925bff7bf96719f6e0` | 748 | 33602 |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddfa5e85d849ddfa1204113740da7a97b5bfce0f75714400801` | 1445 | 79408 |
| `src/engine/deck.js` | `69f92d6b9aac433cb99e7ec23d6052af1a6aa66c0f61eee180ba8f045911aa82` | 69 | 2314 |
| `src/config/seatLayouts.js` | `0049051fd4b8b891deb86066bb1eb89669e3509f18bb995d288232636b3ee30c` | 59 | 3032 |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a489466aa9d07ac7c263ca137b3ee12177812ad9a62833f5a` | 1084 | 51096 |
| `src/styles/gameTable.css` | `9b6b716f23ade19aaf0a6941efbc3c2bc219b4eca9cbf451dda9181c5ac47306` | 6289 | 324115 |

Los blobs de git (`21c4d3f56318`, `8cfc3736cba2`, `eb61426083ca`, `0d1bb8ea66a8`, `fbc9f3d08ede`, `87c9cb519bdb`) y los 16 primeros caracteres del sha256 coinciden con la §3 de `AJILEI_Protegidos_v1.0.md`.

---

## §O · Consultas para Victor

Solo lectura. Pegar **de una sola vez** en el SQL Editor. No escriben nada.

```sql
-- O-1 · Cuántas filas hay hoy
select 'profiles'     as tabla, count(*) as filas from public.profiles
union all select 'billeteras',   count(*) from public.billeteras
union all select 'record_manos', count(*) from public.record_manos
union all select 'mesas_ia',     count(*) from public.mesas_ia
union all select 'mesas_ia abiertas', count(*) from public.mesas_ia where estado = 'abierta';

-- O-2 · Cada cuenta: saldo, manos y los puntos que el libro habría dado
-- (1/2/3 por mano ganada según el reto; sin el extra del AJILEI, que hoy no se guarda)
select p.username,
       p.created_at::date                                         as alta,
       coalesce(b.saldo, 0)                                       as saldo,
       coalesce(sum(r.jugadas), 0)                                as manos_jugadas,
       coalesce(sum(r.ganadas_humano), 0)                         as manos_ganadas,
       coalesce(sum(r.ganadas_humano * case r.reto when 'basico' then 1
                                                   when 'avanzado' then 2
                                                   when 'pro' then 3 end), 0) as puntos_teoricos,
       (select count(*) from public.mesas_ia m where m.jugador_id = p.id) as mesas_ia,
       (select least(m.pila_informada, m.techo_cobro) from public.mesas_ia m
         where m.jugador_id = p.id and m.estado = 'abierta')      as pila_mesa_abierta
  from public.profiles p
  left join public.billeteras   b on b.jugador_id = p.id
  left join public.record_manos r on r.jugador_id = p.id
 group by p.id, p.username, p.created_at, b.saldo
 order by p.created_at;
```

**Resultado esperado (forma):**

O-1

| tabla | filas |
|---|---|
| profiles | n |
| billeteras | n (igual que profiles: la billetera nace con el perfil) |
| record_manos | ≤ cuentas × 3 retos × 4 tamaños |
| mesas_ia | n |
| mesas_ia abiertas | 0 o pocas |

O-2

| username | alta | saldo | manos_jugadas | manos_ganadas | puntos_teoricos | mesas_ia | pila_mesa_abierta |
|---|---|---|---|---|---|---|---|
| … | 2026-… | … | … | … | … | … | null si no hay mesa abierta |

Sirve para cruzar con lo que Victor recuerda haber jugado en las cuatro cuentas de prueba, y para ver cómo quedarían hoy los dos rankings con datos reales (cuántas cuentas entrarían en Maestros y cuántas comparten saldo).
