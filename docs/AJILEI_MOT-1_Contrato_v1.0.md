# AJILEI · MOT-1 · Contrato del árbitro · v1.0

- **Normativo de MOT-1.** Las fichas 1b–1f se escriben contra este documento: lo que no esté aquí no se construye.
- **Base:** `main` en `1f5cb14`. Toda cita `archivo:líneas` es de ese árbol.
- **Viene de:** ficha `AJILEI_MOT-1_Fase1a_v1.0.md` §2 (decisiones selladas) · `docs/reportes/AJILEI_MOT-1_Fase0b_Informe_v1.0.md` (la sonda).
- **Regla de la campaña:** lo justo. No rediseña lo que funciona. Donde una sub-tanda tenga que decidir, dice cuál y qué debe cumplir.
- **Visto bueno del rector, con sus correcciones (2026-11-04):** no queda ninguna propuesta abierta. Las cifras provisionales lo dicen donde aparecen.
- **Al día con la 1b (2026-11-04):** el §4, el §6 y el §7 recogen los ajustes del rector al STOP-1b. Las citas de esos ajustes a `src/arbitro/` son del árbol de la 1b.
- **Al día con la 1d-i (2026-11-04):** el §4 y el §5 recogen las dos decisiones del rector al STOP-1: el ritmo no es secreto, y la recepción con un cliente suscrito se prueba en la 1e.
- **Al día con la 1d-ii (2026-11-04):** el §6, el §7 y el §9 recogen la precisión de la C-10 (borrar la cuenta no cierra la partida de los demás, con la excepción del anfitrión) y que la llamada a los puntos vive en `guardar_jugada`.

**Abreviaturas de migraciones** (`supabase/migrations/`):

| Corta | Archivo |
|---|---|
| `sal_a` | `20260905203158_sal_a_salas.sql` |
| `sal_b1` | `20260911043500_sal_b1_ajuste.sql` |
| `sal_b2` | `20260911230935_sal_b2.sql` |
| `eco1a` | `20261007144943_eco1a_libro.sql` |
| `eco1c` | `20261008220239_eco1c_mesas_ia.sql` |
| `eco1d` | `20261009105658_eco1d_constancia_limites_valvula.sql` |
| `eco1g` | `20261012230807_eco1g_video.sql` |
| `rnk1a` | `20261024191731_rnk1a_libro_puntos.sql` |
| `cfg1c` | `20261030001500_cfg1c_eliminar_cuenta.sql` |
| `cfg1e` | `20261030193000_cfg1e_mano_actual.sql` |
| `tie1a` | `20261031150000_tie1a_inventario.sql` |

---

## §1 · Parámetros de la mesa

| Parámetro | Valores | ¿Identidad? | Quién lo elige | Hoy | Falta |
|---|---|---|---|---|---|
| Jugadores | 2 a 5 | Sí | Anfitrión | `sal_a:88` · `salas.js:158` | Nada |
| Apuesta | 50 · 100 · 200 · 500 · 1.000 · 2.000 · 5.000 | Sí | Anfitrión, de la tabla | Seis, sin el 50: `sal_a:89` · `salas.js:41` | 1d-i |
| Entrada | Corta (15×) o Llena (50×) | Sí | Anfitrión, de la tabla | No existe | 1d-i |
| Tipo | Privada o abierta (pública) | No | Anfitrión | `sal_a:63` | Nada |
| Ritmo | Normal o rápido | **No** | Anfitrión, al armar la mesa | No existe | 1d-i |

### Las 7 × 2 entradas

No hay cifra libre.

| Apuesta | Corta (15×) | Llena (50×) |
|---:|---:|---:|
| 50 | 750 | 2.500 |
| 100 | 1.500 | 5.000 |
| 200 | 3.000 | 10.000 |
| 500 | 7.500 | 25.000 |
| 1.000 | 15.000 | 50.000 |
| 2.000 | 30.000 | 100.000 |
| 5.000 | 75.000 | 250.000 |

### Identidad y asiento

- **Identidad de una mesa pública abierta:** jugadores × apuesta × entrada. Como máximo una mesa pública en espera por identidad.
- **Índice:** el parcial de hoy (`sal_a:131-133`) pasa a tres columnas. La búsqueda de «abrir se vuelve unirme» (`sal_b1:165`) también.
- **Para sentarse:** saldo ≥ entrada. Sustituye a la regla del 5× (`sal_a:285` · `sal_b1:157` · `sal_b2:143`).
- **Ritmo:** viaja con la mesa y no se muestra en ninguna parte (tarjeta, sala de espera, invitación). Quien se une juega al ritmo de esa mesa sin que se le anuncie. Su único efecto está en el §6.
- **Asiento:** el anfitrión es el asiento 0. Cada uno que llega ocupa la primera silla libre a la derecha del anfitrión, en sentido antihorario. `sala_jugadores.asiento` (0..4, con huecos: `sal_a:147-154`) se compacta al arrancar, en orden ascendente, a los índices `players[i]` del motor (K-11). El árbitro guarda la correspondencia `uid → índice`.
- **Lo que ve cada cliente:** se pinta abajo y ve a los demás en el mismo orden circular. El orden de los asientos es el orden de los turnos.

---

## §2 · Acciones del cliente al árbitro

Lista cerrada de cinco acciones. Una sexta exige cambiar este contrato.

### Lo común a todas

**Campos:** `mesa` (id de la sala) · `version` (la que el cliente cree vigente) · `accion`.

**Comprobaciones, en este orden.** La primera que falla decide el motivo y no se aplica nada.

| # | Comprobación | Motivo |
|---|---|---|
| 1 | El token es válido (`SUPABASE_JWKS`) | `no_autenticado` |
| 2 | La cuenta tiene asiento en esa mesa | `no_es_de_esta_mesa` |
| 3 | La partida no terminó | `partida_terminada` |
| 4 | El asiento no está abandonado | `asiento_abandonado` |
| 5 | `version` es la vigente. No se aplica a `elegir_carta_sorteo` ni a `descartar` | `version_vieja` |
| 6 | `accion` es de esta lista | `accion_desconocida` |

**Respuesta:** `{ ok: true, version }` o `{ ok: false, motivo, version }`. No lleva estado: el cliente relee su vista (§5).

**Toda acción con efecto sube la versión en 1.** Un rechazo no la sube.

**Versión en las fases simultáneas.** En el sorteo y en el descarte, la acción se valida contra la ronda o la fase abierta, no contra la versión global: `elegir_carta_sorteo` lleva `ronda` y `descartar` lleva `mano`, y si no son la abierta se rechaza con `fase`. Si la escritura choca con otra elección simultánea, el árbitro reintenta dentro del servidor. Nadie recibe `version_vieja` por elegir o descartar a la vez que otro.

### `elegir_carta_sorteo`

| | |
|---|---|
| **Campos** | `ronda`: la ronda en que se eligió · `carta`: posición 0..4 dentro de las cinco propias. 0 es la de más a la izquierda en su pantalla |
| **Precondiciones** | Sorteo abierto (fase del árbitro, no del motor: `gameEngine.js:10-21` no la tiene) · `ronda` es la ronda abierta · el asiento participa en esta ronda · aún no eligió · posición entera en 0..4 |
| **Efecto** | Anota la elección. Cuando eligieron todos los que participan: voltea las elegidas a la vez y compara con `drawRank(carta.value)` (`deck.js:34`). Si hay una más alta, fija la Mano y arranca la primera mano; si no, sigue el §6 |
| **Motivos** | `fase` · `no_participa` · `ya_eligio` · `carta_invalida` |

Cada ronda, el tope y el vencimiento están en el §6.

### `apostar`

| | |
|---|---|
| **Campos** | `tipo`: uno de `ACCIONES` (`pozos.js:43-45`): `pasar`, `apostar`, `igualar`, `subir`, `allIn`, `retirarse` · `k`: solo con `apostar` y `subir`, un valor de `betting.multiplicadores` (`[1, 2, 5, 10]`, `ajileiConfig.js:25`). En los demás tipos no se lee |
| **Precondiciones** | Las de `pozos.esLegal` (`pozos.js:114-171`): `BET_1`, `BET_2` o `BET_3` · asiento en pie, sin all-in · su turno · lo propio de cada tipo |
| **Efecto** | `applyBetAction(estado, asiento, tipo, k)` (`gameEngine.js:377`). El motivo se le pide antes a `esLegal`, porque el motor devuelve el mismo objeto sin decir por qué (`gameEngine.js:378`). Si cierra la mano, el dinero sigue el §7 |
| **Motivos** | Los once del §3, tabla A |

**El «monto» es `k`.** El cliente manda un multiplicador, nunca fichas. El costo sale de `pozos.costoDe` (`pozos.js:83`).

### `descartar`

| | |
|---|---|
| **Campos** | `mano`: el `handCount` de la mano en que se eligió (`gameEngine.js:598`) · `indices`: lista de enteros, posiciones de las cartas propias. Vacía es válida |
| **Precondiciones** | Fase `DISCARD` · `mano` es la mano con `DISCARD` abierto · asiento no retirado (el asiento en all-in descarta: Reglas v1.4 §4.4) · aún no descartó · índices enteros, en rango y sin repetir · no más de `handRules.maxDiscard` |
| **Efecto** | Guarda los índices del asiento, sin efecto en sus cartas. Cuando descartaron todos los que deben, aplica `applyDiscard` una sola vez, por asiento (edición 3, 1b). El motor repone en orden Mano→Pie (`gameEngine.js:690-708`) |
| **Motivos** | `fase` · `retirado` · `ya_descarto` · `descarte_invalido` |

**El árbitro valida; el motor no lo hace.** `applyDiscard` no tiene guarda de fase ni de índices, y recorta en silencio por encima del tope (`gameEngine.js:695-699`). El árbitro rechaza lo que el motor recortaría.

### `reclamar_vencimiento`

| | |
|---|---|
| **Campos** | Ninguno |
| **Precondiciones** | Hay un vencimiento pendiente y su hora ya pasó **según el reloj del servidor** (K-7(a)). La comprobación común 4 excluye al asiento abandonado; un asiento retirado o eliminado sí puede reclamar |
| **Efecto** | El del §6, según lo que venza. Si dos reclaman a la vez, el segundo recibe `version_vieja` y no pasa nada |
| **Motivos** | `vencimiento_no_cumplido` |

**Arranque.** La lista cerrada no tiene «arrancar», y hoy nadie crea la partida: `jugar_ya` y `barrer_salas` pasan la sala a `activa` y ahí acaban (`sal_a:663-695` · `sal_b1:100-111`). **Una sala `activa` sin partida cuenta como vencimiento cumplido**: el primer `reclamar_vencimiento`, con `version = 0`, crea la partida y abre el sorteo. Es la doctrina de `resolver_sala`: idempotente y la llama quien llegue (`sal_a:370`).

### `abandonar`

| | |
|---|---|
| **Campos** | Ninguno |
| **Precondiciones** | Las comunes |
| **Efecto** | Marca el asiento como abandonado y no mueve dinero. El resto, en el §7 |
| **Motivos** | Solo los comunes. Un segundo `abandonar` recibe `asiento_abandonado` |

El abandono por regla de una partida por cuenta no pasa por esta acción: lo marca el servidor, sin versión del cliente (§7).

---

## §3 · Motivos de rechazo

**Un rechazo nunca cambia el estado ni la versión.** Se devuelven como cadenas literales.

### A · Los once de `pozos.esLegal`

Literales de `pozos.js:28-40`. Son contrato: el comentario de `pozos.js:26-27` prohíbe renombrarlos.

| Motivo | Constante | Cuándo | Reglas v1.4 §3.2 lo llama (`:143`) |
|---|---|---:|---|
| `fuera_de_turno` | `FUERA_DE_TURNO` | No es el asiento activo (`:121`) | Igual |
| `retirado` | `RETIRADO` | Retirado o eliminado (`:119`) | Igual |
| `en_all_in` | `EN_ALL_IN` | Ya está en all-in (`:120`) | `all_in` |
| `monto_invalido` | `MONTO_INVALIDO` | `k` no es de la tabla (`:138, :152`) | Igual |
| `no_alcanza` | `NO_ALCANZA` | La pila no cubre el costo (`:141, :146, :155`) | Igual |
| `hay_apuesta` | `HAY_APUESTA` | `pasar` o `apostar` con apuesta viva (`:133, :136`) | `apuesta_viva` |
| `sin_apuesta` | `SIN_APUESTA` | `igualar` o `subir` sin apuesta viva (`:145, :150`) | `sin_apuesta_viva` |
| `all_in_no_procede` | `ALL_IN_NO_PROCEDE` | La pila cubre lo que falta (`:166`) | `nada_que_igualar` (equivalencia por descarte) |
| `fase` | `FASE` | Fase sin apuesta (`:118`) | `fase_sin_apuesta` |
| `accion_desconocida` | `DESCONOCIDA` | Tipo fuera de la lista (`:169`) | Igual |
| `sin_rival` | `SIN_RIVAL` | Nadie puede contestar (`:137, :151`) | Igual |

Manda el código: la ficha pide los nombres de `pozos.js`. Reglas §3.2 la corrige el rector al cerrar MOT-1 (§9).

### B · Los del árbitro

Lista cerrada. «No es tu turno» y «fase equivocada» no son motivos nuevos: se reutilizan `fuera_de_turno` y `fase`, también en el sorteo y el descarte. `fase` cubre además una `ronda` o una `mano` que no son la abierta. `retirado` y `accion_desconocida` se reutilizan igual.

| Motivo | Cuándo | Acciones |
|---|---|---|
| `no_autenticado` | Sin token o token inválido. Literal de `salasApi.js:45` | Todas |
| `no_es_de_esta_mesa` | La cuenta no tiene asiento en esa mesa | Todas |
| `partida_terminada` | La partida ya se cerró | Todas |
| `asiento_abandonado` | El asiento ya está abandonado | Todas |
| `version_vieja` | La versión no es la vigente | `apostar` · `reclamar_vencimiento` · `abandonar` |
| `vencimiento_no_cumplido` | Aún no es la hora, o no hay vencimiento pendiente | `reclamar_vencimiento` |
| `no_participa` | El asiento no participa en esta ronda del sorteo | `elegir_carta_sorteo` |
| `ya_eligio` | El asiento ya eligió carta en esta ronda | `elegir_carta_sorteo` |
| `carta_invalida` | Posición no entera o fuera de 0..4 | `elegir_carta_sorteo` |
| `ya_descarto` | El asiento ya descartó en esta mano | `descartar` |
| `descarte_invalido` | No es lista, índice fuera de rango o repetido, o por encima del tope | `descartar` |

**No van a `CLAVES_ERROR`.** Esa lista es de las RPC de salas y es exhaustiva (`salasApi.js:40-54`). La de los motivos nace en el trozo de la partida (`trozos.js:28`; INV-84).

---

## §4 · La vista de cada asiento

La arma `vistaDe(estado, asiento)` en la 1b. Lo que no esté en la primera tabla no sale del servidor.

### Lo que ve cada asiento

| Campo | Qué ve | ¿Lo produce hoy el motor? |
|---|---|---|
| Sus cartas | Las suyas | Sí: `players[i].cards` (`gameEngine.js:571`) |
| Cartas de los demás | Solo cuántas tienen | `vistaDe` lo deriva |
| Pilas | Las de todos. La de un asiento que ya cobró vale 0 (§7) | Sí: `players[i].chips` |
| Nombre y estado de cada asiento | Nombre, retirado, all-in, eliminado, abandonado | `name`, `folded`, `allIn`, `eliminated`, sí (`gameEngine.js:61-66`). `abandonado`, no: árbitro |
| Lo cobrado | `cobrado` por asiento: `null` hasta que sale, y luego lo que se llevó. Es de lo que lee la pantalla final | No: árbitro |
| Lo apostado | `contrib` por asiento, `currentBet`, `unit` | Sí (`gameEngine.js:63, :110, :104`). Es lo que `pozos.esLegal` necesita, para que el cliente consulte sin pedir |
| Pozo | Total | Sí: `pot` (`gameEngine.js:109`) |
| Capas | Monto y elegibles de cada una | No guardadas: las deriva `capasDe` (`pozos.js:260`), que necesita `contribMano` |
| Fase | La del motor, o el sorteo | Las del motor: `PHASES` (`gameEngine.js:10-21`). El sorteo lo pone el árbitro |
| Turno | `activePlayerIndex` | Sí |
| Mano y Pie | `manoIndex`, `pieIndex` | Sí (`gameEngine.js:593-594`) |
| Comodín y reglas | `handRules`: `ruleN`, `comodinValue`, `maxDiscard` | Sí (`gameEngine.js:44-50, :580`) |
| Vencimiento | Hora y clase del pendiente | No: árbitro |
| Versión | Entero | No: árbitro |
| Mano | Su número: lo que `descartar` manda en `mano` | Sí: `handCount` (`gameEngine.js:598`) |
| Descarte | Quién ya descartó, y cuántas tras aplicarse | No: árbitro. `applyDiscard` lo cuenta y no lo guarda (`gameEngine.js:688, :700`) |
| Sorteo | La ronda abierta, las cinco posiciones propias sin valor y quién ya eligió; tras el volteo, la carta elegida de cada participante en cada ronda | No: árbitro |
| Revelación, solo en `PAYOUT` por showdown | Cartas y `score` de los no retirados; ganadores por capa | Datos sí (`gameEngine.js:238-241`, `pozos.js:311`). El filtro es de `vistaDe` |
| Fin por retirada de los demás | Ganador, sin cartas de nadie | Sí (`gameEngine.js:198-207`) |

### Lo que no sale nunca del servidor

| Secreto | Dónde vive | Nota |
|---|---|---|
| El mazo restante | `state.deck` (`gameEngine.js:576`) | Nunca |
| Las cartas del sorteo | Estado del árbitro | El valor de las cinco cartas, hasta el volteo. El de las no elegidas y el resto del mazo, nunca |
| Cartas ajenas antes de la revelación | `players[i].cards` | Tampoco las de un retirado, ni después |
| `score` ajeno antes de la revelación | `players[i].score` | Solo existe desde el showdown |
| Índices de descarte ajenos | Estado del árbitro | Se ve el número, tras aplicarse |
| El estado del RNG | `deck.js:57` y el adaptador CSPRNG | Nunca |
| `message` | `gameEngine.js:244-270, :447-468` | K-12: va en perspectiva del asiento 0 y la voz vive en el cliente |
| `isHuman` y `nivelIA` | Estado del motor | No significan nada en PvP |
| Cuentas de los demás | Correspondencia `uid → índice` | El cliente solo ve índices |

**El ritmo no es secreto: no se muestra en ninguna pantalla.** Viaja en la fila de la mesa (`salas.ritmo`), que el cliente puede leer, y `vistaDe` no lo lleva. El cliente recibe la hora de vencimiento ya escalada (§6).

---

## §5 · Bus y lectura

Sellado el 12-sep. La línea «vistas por Broadcast privado» de la Fase 0b queda retirada.

| Pieza | Qué guarda | Quién lee | Quién escribe | Molde o estado | Lo fija |
|---|---|---|---|---|---|
| Tabla de partida | El estado completo, la versión y el vencimiento | **Nadie del cliente**: RLS sin políticas, sin privilegios y fuera de la publicación | Solo el árbitro | `mesas_ia` (`eco1c:803-807`) · K-6(b) | 1d-i |
| Tabla de vistas | Una fila por mesa y asiento, con la vista del §4 | Cada asiento la suya, por RLS | Solo el árbitro | Nueva | 1d-i |
| Canal privado por mesa | Nada: solo pasa el aviso | Los miembros, con política sobre `realtime.messages` | Solo el árbitro | Sin políticas hoy. Emisión probada en público (`sonda_mot1/index.ts:153-161`); recepción privada sin probar (H-S2) | 1d-i las políticas; la recepción con un cliente suscrito se prueba en la 1e, cuando la Edge Function emita |

### El recorrido

| Paso | Qué pasa |
|---|---|
| 1 | Llega la acción. El árbitro lee el estado y corre el motor |
| 2 | **Una sola transacción, condicionada a la versión leída:** estado, versión nueva, las vistas y, si cerró la mano, las pilas y los puntos |
| 3 | Si la versión ya cambió, no escribe nada y responde `version_vieja`. En `elegir_carta_sorteo` y `descartar` no responde eso: relee y valida otra vez `ronda` o `mano` contra la abierta. Si sigue siéndolo, reintenta; si no, rechaza con `fase` |
| 4 | Tras confirmar, emite en el canal: `{ version: N }` y nada más |
| 5 | Cada cliente con otra versión relee su fila de vistas |

### Qué debe cumplir

- **El bus no manda.** Un aviso perdido no rompe nada: el cliente se pone al día al releer, y una acción con versión vieja se rechaza sin efecto. En las fases simultáneas deciden `ronda` y `mano` (§2).
- **Ningún secreto viaja por el bus.** El payload es solo la versión.
- **`salas.estado_partida` sigue nula** (`sal_a:104, :119`). Esa columna se difunde a los clientes (`sal_a:205, :852-865` · `salasApi.js:284-292`) y por eso el estado no vive ahí.
- **Las RPC del árbitro no leen `auth.uid()`.** Con llave de servicio no hay sesión: llevan el uid por parámetro y solo `service_role` las ejecuta (molde `partida_abierta_de`, `cfg1c:45`; N-1).
- **La sala de espera no cambia:** sigue con `postgres_changes` (`salasApi.js:307-318`).

---

## §6 · Reloj y ritmo

### Los vencimientos

Solo hay un vencimiento pendiente por mesa. Lo guarda el servidor y lo reclama cualquier cliente de la mesa (K-7(a)).

| Clase | Empieza | Dura | Al vencer |
|---|---|---|---|
| Arranque | La sala pasa a `activa` | Ya cumplido | Crea la partida y abre el sorteo (§2) |
| Reparto del sorteo | Se abre cada ronda | Espera de animación, siempre rápida y por oleadas: no depende de los asientos | Se abre la elección |
| Elección del sorteo | Termina el reparto de la ronda | 10 s por ronda | Toma la posición 0 de quien no eligió y voltea. El abandonado no espera: la toma al instante (§7) |
| Turno | Le toca a un asiento en `BET_*` | `TURN_TIME` = 20 s (`GameTable.jsx:87`) | `pasar` si es legal; si no, `retirarse` (`GameTable.jsx:913-914`). El abandonado no llega a vencer: se retira en el acto (§7) |
| Descarte | Se abre `DISCARD` | `TURN_TIME` = 20 s (`GameTable.jsx:890`) | Descarte vacío para quien falte (`GameTable.jsx:917`) y aplica. El abandonado no espera: descarta vacío en el acto (§7) |
| Reparto | `DEAL_2` o `DEAL_3` | Espera de animación | `advanceFromDeal` (`gameEngine.js:603`) |
| Barajado | `startHand` | Espera de animación | Se abre el reparto |
| Revelación y mano siguiente | `PAYOUT` | Fin de la coreografía de revelación + 4 s. Sin revelación, cierre de la mano + 4 s (cifra provisional) | Dinero y puntos (§7), asientos que salen y `startHand` (`gameEngine.js:502`). Con ≤1 vivo, `GAME_OVER` (`:522`) |

**`TURN_TIME` no está exportado:** vive dentro del componente de mesa. La 1b lo lleva a donde el árbitro lo lea, sin cambiar la cifra.

### El sorteo

| Punto | Regla |
|---|---|
| Cada ronda | El árbitro baraja el mazo de sorteo completo, las 40 cartas: `shuffleDeck(createDeck())` bajo `setRng` (`deck.js:16, :59, :62`). Reparte 5 cartas boca abajo a cada asiento que participa. Cada uno elige una |
| Las no elegidas | Vuelven al mazo sin mostrarse nunca |
| Quién gana | Las elegidas se voltean a la vez y gana la más alta por `drawRank`: el As es la más baja (`deck.js:32-40`) |
| Quién participa | Todos en la ronda 1; en las siguientes, solo los empatados en la carta más alta. Ninguna ronda arrastra nada de la anterior |
| Tope | 3 rondas en total: la inicial y 2 de desempate. Si la tercera vuelve a empatar, el árbitro elige al azar (CSPRNG) a uno de los que siguen empatados |
| Vencimiento | 10 s de elección por ronda. Al vencer, el árbitro toma la posición 0 de quien no eligió. El abandonado la toma al instante (§7) |
| Reparto | Siempre rápido (`FACTOR_RAPIDA`), sea cual sea el ritmo de la mesa. Va por oleadas: una carta a cada asiento a la vez, cinco oleadas. La espera no depende del número de asientos |
| Vista | Las cinco posiciones propias sin valor y quién ya eligió; tras el volteo, la carta elegida de cada participante en cada ronda |
| Secretos | El valor de las cinco cartas hasta el volteo; el de las no elegidas, nunca |
| Cuándo | Solo en la primera mano de la mesa |
| El Pie | Se deriva: el asiento anterior a la Mano. El árbitro lo escribe en `pieIndex` y `startHand` lo lee sin abrir el motor (`gameEngine.js:542-543`) |

### El ritmo

| Punto | Regla |
|---|---|
| Qué escala | Exactamente lo que hoy escala «Partida rápida» contra las IAS: el vuelo del reparto y las esperas del segundo reparto (`GameTable.jsx:829, :847`) |
| Qué no escala | El barajado, la revelación y la pausa de mano siguiente. Tampoco el reloj de turno, el de descarte y el de sorteo: iguales en los dos ritmos |
| El reparto del sorteo | Siempre con `FACTOR_RAPIDA`, sea cual sea el ritmo |
| Factor | `FACTOR_RAPIDA = 0.5` (`partidaRapida.js:20`). Ninguna cifra nueva |
| Lo que no se usa | `factorDeMano` da siempre 1 fuera de la mesa contra IAS (`partidaRapida.js:42` · su prueba, `partidaRapida.test.js:43`) |

### Las esperas base

Hoy no existe ninguna constante de servidor. **El contrato solo pone una cifra, la pausa de mano siguiente.** Las demás las fija la 1b desde lo que ya mide el cliente:

| Espera | Base | ¿La escala el ritmo? |
|---|---|---|
| Barajado | 1.950 ms, atados a `gameTable.css` (`GameTable.jsx:1927-1935`) | No, a propósito |
| Vuelo de cada carta | `VUELO_REPARTO_S = 0.595` (`GameTable.jsx:287`) | Sí (`:829`) |
| Segundo reparto | 300 · 600 · 900 ms (`GameTable.jsx:848-850`) | Sí (`:847`) |
| Revelación | `REVEAL_CHOREO` (`GameTable.jsx:132-134`) y su coreografía · tope de red `RED_REVELACION_MS = 6000` (`mesaCore.js:395`) | No |
| Mano siguiente | En PvP no hay botón: arranca sola al terminar la revelación, más una pausa de lectura. **4 s, cifra provisional**, tras el fin de la coreografía de revelación, que la 1b mide desde `REVEAL_CHOREO`. Mano cerrada sin revelación (ganan por retirada de los demás): 4 s después del cierre de la mano, la misma cifra provisional. MES-PvP la ajusta con los teléfonos. Contra las IAS sigue siendo un botón, con 300 ms tras tocarlo (`GameTable.jsx:2716-2726`) | No |
| Reparto del sorteo | Cinco oleadas, cada una de un vuelo: 120 + 5 × 297,5 + 400 = 2.008 ms, con cualquier número de asientos (`reloj.js`) | Siempre rápido |

### Reloj sin congelar

- **Manda el servidor.** El reloj no se congela con la pantalla apagada. `useCongelado` queda solo para las mesas contra las IAS (`GameTable.jsx:904` · `hooks/useCongelado.js`).
- **Partida muerta.** Si una partida pasa 15 min sin cambiar de versión, `barrer_salas` la cierra. La mano en curso se anula y cada asiento no cobrado recibe, por `liberacion_pvp`, la pila de la última mano cerrada, la que está en SQL. Cifra provisional. Va a la 1d-i y la 1d-ii (§9).
- **Borrar la cuenta con partida viva.** No cierra la partida: perjudicaría a los demás. Mientras el jugador tenga un asiento no cobrado, `partida_abierta_de` (`cfg1c:45-77`) la cuenta como partida abierta y el borrado se rechaza. Podrá borrarla cuando haya cobrado o cuando la partida muera. **Excepción:** el anfitrión, aunque haya cobrado, sigue bloqueado hasta que la partida termine o muera: `salas.anfitrion_id` es `on delete cascade`, y borrarlo se llevaría la sala, la partida y las pilas de todos.
- **Gracia de reconexión y lo que ve el que vuelve:** MES-PvP.

---

## §7 · Dinero y puntos

### La billetera se mueve dos veces

| Cuándo | Movimiento | Monto | Molde |
|---|---|---|---|
| Al **sentarse** | `garantia_pvp` | −entrada | `aplicar_movimiento` (`eco1a:420`) · tipos en `eco1a:179` |
| Al **salir** | `liberacion_pvp` | +pila, con el residuo menor que la unidad (K-10) | El mismo |
| Al cerrar cada mano | **Ninguno** | Las pilas de todos los asientos se reescriben en SQL, en una sola transacción | Paso 2 del §5 |

| Regla | Detalle |
|---|---|
| `saldo_tras >= 0` | Se mantiene (`eco1a:182`) |
| `monto <> 0` | `eco1a:181`: quien sale con pila 0 no anota movimiento |
| Quien cobra | Al emitir su salida, su pila queda en 0 en el estado y el monto pasa a `cobrado`. Pilas + pozo + lo ya cobrado es constante |
| Sin doble pago | Ninguna pila de las que se reescriben al cerrar la mano incluye a un asiento ya cobrado, tampoco al que cobra en ese mismo cierre: su dinero va solo en su salida |
| `resultado_pvp` | Queda sin escritor: con dos movimientos no hace falta (`eco1a:179`) |
| El dinero | Nunca vive en el cliente |
| Residuo | El motor elimina a quien no cubre el ante y le deja las fichas (`gameEngine.js:511, :515`). Vuelven a su saldo al salir |

### Qué debe cumplir la 1d-ii

Lo fija la 1d-ii: firmas, columnas y nombres.

| Requisito | Por qué | Hoy |
|---|---|---|
| Toda salida de la espera devuelve la entrada: `salir_sala`, sala cancelada por `barrer_salas` o `resolver_sala` | La entrada ya salió al sentarse | No mueven dinero (`sal_b2:186` · `sal_b1:93` · `sal_a:370`) |
| Nada se cobra dos veces | Reintentos y dos clientes | `clave_idem` única (`eco1a:174`) |
| Toda función que mueve dinero tiene su tope por minuto, y un tope nunca atrapa dinero | ECO v1.3 §7 | `limite_dinero` (`eco1g:100-113`) |
| Los dos topes literales pasan a `limite_dinero()` | ARN-4 | `cfg1e:199` · `tie1a:162` |
| Las piezas del árbitro llevan el uid por parámetro | N-1 | `contar_intento_dinero` lee `auth.uid()` (`eco1a:372-374`) |

### Una partida abierta por cuenta

Regla de ECO-1, en todos los modos. Todo esto va a la 1d-ii.

| Estando en | Hace | Pasa |
|---|---|---|
| Una sala de espera PvP | Entrar en otra sala de espera PvP | Sigue `ya_en_sala`, como se selló en SAL-B1 (`sal_b1:154` · `sal_b2:140`) |
| Una sala de espera PvP | Sentarse contra las IAS | Sale de la sala y se le devuelve la entrada |
| Una mesa contra las IAS abierta | Sentarse en PvP | C4 cierra la de las IAS y cobra su pila |
| Una partida PvP viva | Abrir otra mesa | Abandono: la tabla siguiente |

| Punto | Regla |
|---|---|
| Si el jugador abre otra mesa, en cualquier aparato | Su asiento PvP vivo queda **abandonado** |
| Qué pasa con su turno | Actúa al instante, sin reloj: en su turno de apuesta se retira, y si abandonó antes, lo hace al tocarle. En all-in o sin turno (`pozos.js:120` · `gameEngine.js:361-363`), sigue disputando la mano por lo que puso |
| En el descarte | Descarta vacío al instante, al abandonar o al abrirse la fase. Si ya había descartado, conserva su descarte. Si era el último que faltaba, la fase se aplica en el acto |
| En el sorteo | Elige al instante la posición 0, al abandonar o al abrirse la elección, también en las rondas de desempate. Si era el último que faltaba, voltea en el acto. Si gana, la Mano pasa al siguiente vivo |
| Qué cobra | Su pila, al cerrar la mano, con el premio si gana. Sin mano en curso, en el acto |
| Lo que ya puso en el pozo | No se le devuelve. Eso no significa que lo pierda si gana |
| Después de cobrar | Sale de la mesa: el árbitro lo marca eliminado y `startHand` ya no lo cuenta (`gameEngine.js:510-518`) |
| La pieza | `cerrar_partida_abierta` solo conoce `mesas_ia` (`eco1c:303-343`). La 1d-ii la lleva a los dos modos |

### Puntos contra humanos

| Punto | Regla | Prueba |
|---|---|---|
| Tabla | `libro_puntos`, sin cambios | `rnk1a:112-142` |
| Quién escribe | El árbitro. La función y la llamada son de la 1d-ii: la llamada vive en `guardar_jugada`, al procesar `mano_cerrada` | Rankings v1.2 `:143` |
| Interruptor | La llamada queda detrás de un interruptor apagado, como la válvula de ECO-1, y se enciende en MES-PvP. El humo de la 1f no escribe en los rankings | `eco1d:229` |
| Cuándo | Al cerrar la mano, en la misma transacción que las pilas | Paso 2 del §5 |
| `origen` | `'humanos'` | `rnk1a:125-141` |
| `nivel` | Nulo | `rnk1a:125-141` |
| `sentados` | `handRules.ruleN`, sin otra calculadora | Rankings v1.2 `:88` |
| `puntos_base` | `sentados + 3` | Rankings v1.2 `:88` |
| `ajilei` y `extra` | Los del ganador de la mano. Sin cinco cartas no hay AJILEI, y el 52 exige cinco sentados | Rankings v1.2 `:104-108` |
| Ganador de la mano | La capa 0, no `state.winner`, que tras el pago es la capa superior | `gameEngine.js:285, :292` · `mesaIACore.js:186-197` |
| Doble escritura | `unique (origen, mesa_id, mano)`, con `mano = handCount` | `rnk1a:125` |

---

## §8 · Tabla K final

| Decisión | Fallo | Qué queda | Prueba |
|---|---|---|---|
| K-1 · motor compartido | **Se ajusta** | J-1 sigue. **Solo falta la edición 3** (descarte por asiento). Las otras cinco ya están y la guarda `monto ≥ 0` cayó | `gameEngine.js:377, :80, :536, :1-8, :695-697` |
| K-2(c) · validación | **Se ajusta** | Árbitro adelgazado: las apuestas las valida el motor. Le quedan identidad, descarte, arranque y vencimiento | `gameEngine.js:378` · `pozos.js:114` |
| K-3 · primera Mano | **Cerrada** | Sorteo del §6 | Decisión de Victor en el visto bueno · Reglas v1.4 `:348` · `deck.js:34` |
| K-4(a) | **Cae** | `deck.js` ya es protegido, con la excepción §6.1. No hace falta abrirlo | `Protegidos:89, :250-263` · `deck.js:59` |
| K-5(a) · azar | Sigue | CSPRNG por `setRng`; el mazo queda en el estado | `deck.js:59` · `gameEngine.js:560, :576` |
| K-6(b) · estado | Sigue | Tabla sin lectura de cliente | `sal_a:205, :852` · `eco1c:803` |
| K-7(a) · vencimiento | Sigue | Lo reclama cualquier cliente y lo comprueba el servidor | `sal_a:370` · `salasApi.js:181-185` |
| K-8(a) · IA | Sigue | La IA no juega en el servidor; `aiPlayer.js` viaja inerte | `gameEngine.js:695-697` |
| K-9 · dinero | **Según §7** | Garantía al sentarse, liberación al salir y pilas reescritas por mano. Sin movimiento por mano | `eco1a:175-182` · ECO v1.3 §8 |
| K-10(a) · residuo | Sigue | El residuo vuelve al saldo al salir | `gameEngine.js:511, :515, :522` |
| K-11(a) · sillas | Sigue | Se compactan al arrancar | `gameEngine.js:89-91` · `sal_a:147-154` |
| K-12 · `message` | Sigue | El servidor no lo envía | `gameEngine.js:244-270, :447-468` |
| Bus | **Sellado 12-sep** | Broadcast privado por mesa con solo la versión, y la vista se relee por RLS (§5) | `RealtimeChannel.d.ts:54` |
| Token | Sigue | `SUPABASE_JWKS`. La 1e confirma el `alg` | `eliminar_cuenta/index.ts:6-8` |

---

## §9 · Heredados → sub-tanda

| Pieza | Dónde está hoy | Sub-tanda |
|---|---|---|
| Árbitro decide por la capa principal (VOZ-3) | `manoCore.js:86` · `mesaIACore.js:188-190` · `gameEngine.js:285, :292` | 1b |
| Respaldo `state.winner` (ARN-4) | `mesaIACore.js:189` · `manoCore.js:86` | 1b |
| Sorteo de la Mano con `drawRank` | `deck.js:34` · `gameEngine.js:542-543` · Reglas v1.4 `:348` | 1b |
| Semillas `apu` / `u3` (ARN-4d) | `diagDSK.mjs:1950-1958, :9402` · `siembra.mjs:8-10` | 1b: se comprueba si cambia el consumo de azar |
| Comentario de la ruta del último en pie (VOZ-3) | `gameEngine.js:193-197` | 1b: autorizado en Protegidos v1.9 |
| Sentido de las sillas: sala de espera y mesa, antihorario desde el asiento 0, igual que contra las IAS | `salaEsperaCore.js:138` · `seatLayouts.js:32, :43` | 1b lo comprueba. Si alguna no lo hace, lo anota para MES-PvP sin arreglarlo |
| Once motivos en el contrato | `pozos.js:28-40` | 1a el contrato (§3); 1b y 1e el uso |
| **Siete apuestas en el SQL** | `sal_a:89` | 1d-i |
| **Columna `entrada`, con valor por defecto** para que el cliente de hoy no se rompa | No existe | 1d-i. Por defecto, Corta. Un `default` de columna no puede leer `apuesta`: la 1d-i dice cómo |
| **Índice de tres columnas y búsqueda de «abrir»** | `sal_a:131-133` · `sal_b1:165` | 1d-i |
| **Columna `ritmo`** | No existe | 1d-i |
| `unirse_sala` da la primera silla libre | `sal_b2:152-154` | 1d-i lo comprueba |
| Tabla de partida, vistas y `realtime.messages` | §5 | 1d-i |
| `barrer_salas` no puede cancelar partidas vivas | `sal_b1:116-120`: mira `estado_partida`, que seguirá nula | 1d-i |
| `sala_estado` sin valor de partida terminada | `sal_a:67` | 1d-i |
| Partida muerta: cierre a los 15 min, y la guarda de borrar la cuenta (§6) | `sal_b1:116-120` · `cfg1c:45-77` | 1d-i y 1d-ii |
| `mi_sala` debe devolver la mesa viva | `sal_b1:346-372` | 1d-i |
| **Saldo ≥ entrada** | `sal_a:285` · `sal_b1:157` · `sal_b2:143` | 1d-ii, con la garantía |
| Garantía, liberación y pilas por mano | §7 | 1d-ii |
| C4 entre modos y los casos de la espera (§7) | `eco1c:303-343` · `sal_b1:154` · `sal_b2:140` | 1d-ii |
| Libro de puntos contra humanos (RNK-1) | `rnk1a:112-142` · Rankings v1.2 `:88, :143` | 1d-ii la función y la llamada en `guardar_jugada`, con el interruptor apagado (§7) |
| Unificar topes en `limite_dinero()` (ARN-4) | `eco1g:100-113` · `cfg1e:199` · `tie1a:162` | 1d-ii |
| Motor en el trozo de la mesa (PES-1) | `cargarMesa.js:124` · `trozos.js:28, :32` · `testEntradaLigera.test.js:34` | 1e y 1f: lo nuevo nace en `trozos.partidaPvP` |
| Limpiar la sonda | `sonda_mot1/` · `.gitignore:127-129` | 1e |
| `REGLA_ASIENTO` pasa a 15 (la Corta, entrada por defecto), con sus pruebas, para que el cliente no ofrezca mesas que el servidor rechaza | `salas.js:57` · `salas.test.js:42-44` | 1d-ii: la única excepción a «la 1d solo toca SQL» |
| Espejo del cliente: `APUESTAS_PVP` | `salas.js:41` · `salas.test.js:29, :36` | MES-PvP: `ArmarMesa.jsx:282` pinta lo que diga la lista, y el chip de 50 es de esa campaña |
| **Pantalla de armar mesa:** fila Entrada, chip de 50, control de ritmo del anfitrión | `ArmarMesa.jsx` | MES-PvP |
| **«Mano actual · Humanos 500»** | `cfg1e:99-116, :212` · `consultas.js:15` | MES-PvP |
| Modo guion | `gameEngine.js:560` · `deck.js:59` · `repartoGanador.js:143, :235-244` | Sin edición del motor; TUT-1/GUI-1 |
| `vuelo` sin semilla | `diagDSK.mjs`, modo `vuelo` | Ninguna: MOT-1 no lo toca |
| Reglas v1.4: motivos con otro nombre y «`pozos.js` no protegido» | Reglas v1.4 `:143` | El rector, al cerrar MOT-1, en la Reglas v1.5 |
| Protegidos §7.1, fila E-4: dice que el pozo deja de ser escalar | `Protegidos:306` · `pozos.js:243` | El rector, al cerrar MOT-1, en la Reglas v1.5 |

---

## §10 · Orden de las sub-tandas

Los minutos son estimaciones de la Fase 0b, no medidas.

| # | Sub-tanda | Contenido | Minutos de Claude Code | Lo que hace Victor |
|---|---|---|---:|---|
| 1 | **1a** · Documental | Este contrato y Protegidos v1.9 | 20–30 | Visto bueno y `git push` |
| 2 | **1b** · Motor y árbitro sin red, con el azar dentro | Edición 3 y el comentario de `gameEngine.js:193-197`, con su fila de Protegidos en el mismo commit · árbitro · `vistaDe` · compactar sillas · sorteo · capa 0 por asiento · adaptador CSPRNG · esperas base | 120–180 | Autorizar la apertura de `gameEngine.js` |
| 3 | **1d-i** · Esquema | §9, filas 1d-i | 60–90 | `db push` y guion en el SQL Editor |
| 4 | **1d-ii** · Dinero y puntos | §9, filas 1d-ii | 90–120 | `db push` y guion en el SQL Editor |
| 5 | **1e** · Edge Function | JWKS · `uid → asiento` · acciones · vencimiento · vistas en Postgres y aviso por Broadcast privado | 90–150 | `functions deploy --use-api`, confirmar el `alg` y borrar la sonda |
| 6 | **1f** · Humo con dos sesiones | Dos clientes sin UI de mesa | 45–60 | Prueba con dos teléfonos |
| | **Total** | | **≈ 7–10 h** | |

---

## §11 · Fuera de MOT-1

| Campaña | Qué se lleva |
|---|---|
| **MES-PvP** | La mesa y la pantalla: armar mesa con Entrada, chip de 50 y ritmo; `APUESTAS_PVP`; gracia de reconexión y lo que ve el que vuelve; «Mano actual · Humanos 500»; mini-perfil en la sala; los flujos de `GameTable.jsx` marcados «MOT-1 reescribe este flujo»; encender los puntos contra humanos. |
| **TUT-1 / GUI-1** | El modo guion: sin edición del motor, con `setRng` y `tiradasPara` (`deck.js:59` · `repartoGanador.js:143, :235-244`). |
| **SW-1** | De MOT-1 no se lleva nada. |
