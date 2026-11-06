# AJILEI · MOT-1 · Contrato del árbitro · v1.2

- **Normativo de MOT-1.** Las fichas 1b–1f se escriben contra este documento: lo que no esté aquí no se construye.
- **Base:** `main` en `1f5cb14`. Toda cita `archivo:líneas` es de ese árbol.
- **Viene de:** ficha `AJILEI_MOT-1_Fase1a_v1.0.md` §2 (decisiones selladas) · `docs/reportes/AJILEI_MOT-1_Fase0b_Informe_v1.0.md` (la sonda).
- **Regla de la campaña:** lo justo. No rediseña lo que funciona. Donde una sub-tanda tenga que decidir, dice cuál y qué debe cumplir.
- **Visto bueno del rector, con sus correcciones (2026-11-04):** no queda ninguna propuesta abierta. Las cifras provisionales lo dicen donde aparecen.
- **Al día con la 1b (2026-11-04):** el §4, el §6 y el §7 recogen los ajustes del rector al STOP-1b. Las citas de esos ajustes a `src/arbitro/` son del árbol de la 1b.
- **Al día con la 1d-i (2026-11-04):** el §4 y el §5 recogen las dos decisiones del rector al STOP-1: el ritmo no es secreto, y la recepción con un cliente suscrito se prueba en la 1e.
- **Al día con la 1d-ii (2026-11-04):** el §6, el §7 y el §9 recogen la precisión de la C-10 (borrar la cuenta no cierra la partida de los demás, con la excepción del anfitrión) y que la llamada a los puntos vive en `guardar_jugada`.
- **Al día con la 1e (2026-11-04):** el §5 dice que la recepción con un cliente suscrito se prueba en la 1f. La línea anterior de la 1d-i queda corregida por esta.
- **Al día con MES-PvP, sub-tanda 0 (2026-11-05):** v1.1. El §2, el §3, el §4, el §6, el §7, el §9 y el §11 recogen lo que necesita la mesa real, con las decisiones del rector y de Victor sobre la Fase 0 de MES-PvP. Lo normativo para MES-PvP es este mismo archivo. Las citas de lo nuevo son del árbol `de468b3`.
- **Al día con MES-PvP, sub-tanda 3-A (2026-11-06):** v1.2, la del árbitro que se despliega con ella. La **regla C-8** (el abandono, §7) se reescribe según las Reglas v1.7 §8.2: abandonar es retirarse en el acto, en cualquier fase; si queda uno solo en la mano, cobra el pozo; con menos de 2 sentados la partida termina en la misma jugada; quien se va cobra su pila al irse, y con mano en curso al cerrarse esa mano; el showdown ya calculado se recalcula sin él; las tres vías siguen el mismo camino. El §2, el §4 y el §6 se ponen al día con ella. **Renumeración:** lo que la v1.1 dejaba para el árbitro y el Contrato «v1.2» (la recarga PvP, la reposición uno a uno y el volteo de 5 s del sorteo, en el informe de la sub-tanda 3) pasa a la **v1.3**. Las citas de lo nuevo son del árbol `db0313b`.

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

Lista cerrada de seis acciones. Una séptima exige cambiar este contrato.

### Lo común a todas

**Campos:** `mesa` (id de la sala) · `version` (la que el cliente cree vigente) · `accion`.

**Comprobaciones, en este orden.** La primera que falla decide el motivo y no se aplica nada.

| # | Comprobación | Motivo |
|---|---|---|
| 1 | El token es válido (`SUPABASE_JWKS`) | `no_autenticado` |
| 2 | La cuenta tiene asiento en esa mesa | `no_es_de_esta_mesa` |
| 3 | La partida no terminó | `partida_terminada` |
| 4 | El asiento no está abandonado | `asiento_abandonado` |
| 5 | `version` es la vigente. No se aplica a `elegir_carta_sorteo`, a `descartar` ni a `volver_anuncio` | `version_vieja` |
| 6 | `accion` es de esta lista | `accion_desconocida` |

**Respuesta:** `{ ok: true, version, ahora }` o `{ ok: false, motivo, version, ahora }`. No lleva estado: el cliente relee su vista (§5). `ahora` es la hora del servidor en ms y va en toda respuesta de la función, también en los rechazos: solo sirve para corregir el desfase del reloj del teléfono.

**Toda acción con efecto sube la versión en 1.** Un rechazo no la sube.

**Versión en las fases simultáneas.** En el sorteo, en el descarte y en la pausa de anuncio, la acción se valida contra la ronda o la fase abierta, no contra la versión global: `elegir_carta_sorteo` lleva `ronda`, y `descartar` y `volver_anuncio` llevan `mano`; si no son la abierta se rechaza con `fase`. Si la escritura choca con otra acción simultánea, el árbitro reintenta dentro del servidor. Nadie recibe `version_vieja` por elegir, descartar o volver del anuncio a la vez que otro.

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
| **Precondiciones** | Fase `DISCARD` · `mano` es la mano con `DISCARD` abierto · asiento no retirado (el asiento en all-in descarta: Reglas v1.5 §4.4) · aún no descartó · índices enteros, en rango y sin repetir · no más de `handRules.maxDiscard` |
| **Efecto** | Guarda los índices del asiento, sin efecto en sus cartas. Cuando descartaron todos los que deben, aplica `applyDiscard` una sola vez, por asiento (edición 3, 1b), y abre la `reposicion` (§6). El motor repone en orden Mano→Pie (`gameEngine.js:690-708`) |
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
| **Efecto** | Marca el asiento como abandonado y, con mano en curso, lo retira en el acto (regla C-8, §7). Con mano en curso no mueve dinero: cobra al cerrarse la mano. El resto, en el §7 |
| **Motivos** | Solo los comunes. Un segundo `abandonar` recibe `asiento_abandonado` |

El abandono por regla de una partida por cuenta no pasa por esta acción: lo marca el servidor, sin versión del cliente (§7). El abandono por ausencia (§6) tampoco: lo marca el árbitro al resolver un vencimiento. Desde la v1.2 las tres vías siguen el mismo camino (C-8, `partida.js`, `retirarEnMano` y `terminarSiQuedaUno`).

### `volver_anuncio`

| | |
|---|---|
| **Campos** | `mano`: el `handCount` de la mano que acaba de cerrar |
| **Precondiciones** | Pausa de anuncio abierta (§6) · `mano` es la de la pausa · el asiento está en `enAnuncio` |
| **Efecto** | Saca el asiento de `enAnuncio` y pone a 0 su cuenta de ausencia (§6). Si no queda nadie en anuncio, cierra la pausa y arranca la mano |
| **Motivos** | `fase` · `no_participa` · `ya_volvio` |

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

Manda el código: la ficha pide los nombres de `pozos.js`. La columna de Reglas es la de la v1.4; Reglas v1.5 §3.2 ya coincide con `pozos.js`.

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
| `no_participa` | El asiento no participa en esta ronda del sorteo, o en esta pausa de anuncio | `elegir_carta_sorteo` · `volver_anuncio` |
| `ya_eligio` | El asiento ya eligió carta en esta ronda | `elegir_carta_sorteo` |
| `carta_invalida` | Posición no entera o fuera de 0..4 | `elegir_carta_sorteo` |
| `ya_descarto` | El asiento ya descartó en esta mano | `descartar` |
| `descarte_invalido` | No es lista, índice fuera de rango o repetido, o por encima del tope | `descartar` |
| `ya_volvio` | El asiento ya volvió del anuncio en esta pausa | `volver_anuncio` |

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
| `players[i].contribMano` | Lo que cada asiento lleva puesto en la mano, de todos | Sí: `contribMano` |
| `players[i].enAnuncio` | Si ese asiento sigue en el anuncio (§6), de todos | No: árbitro |
| `players[i].ausente` | `true` desde el 2.º vencimiento propio seguido (§6), de todos | No: árbitro |
| `ultimaAccion` | `{ asiento, tipo, puesto, apuestaAntes, apuestaDespues, porReloj }`, o `null` al empezar cada mano. Solo acciones de apuesta. `puesto` son las fichas que metió. La retirada automática de un abandonado no la pisa. K-12 sigue: sale un dato, no una frase | No: árbitro |
| Fase | La del motor, o el sorteo | Las del motor: `PHASES` (`gameEngine.js:10-21`). El sorteo lo pone el árbitro |
| Turno | `activePlayerIndex` | Sí |
| Mano y Pie | `manoIndex`, `pieIndex` | Sí (`gameEngine.js:593-594`) |
| Comodín y reglas | `handRules`: `ruleN`, `comodinValue`, `maxDiscard` | Sí (`gameEngine.js:44-50, :580`) |
| Vencimiento | Hora y clase del pendiente | No: árbitro |
| Versión | Entero | No: árbitro |
| Mano | Su número: lo que `descartar` manda en `mano` | Sí: `handCount` (`gameEngine.js:598`) |
| Descarte | Quién ya descartó, y cuántas tras aplicarse | No: árbitro. `applyDiscard` lo cuenta y no lo guarda (`gameEngine.js:688, :700`) |
| Sorteo | La ronda abierta, las cinco posiciones propias sin valor y quién ya eligió; tras el volteo, la carta elegida de cada participante en cada ronda y su posición (`rondas[].volteo[].posicion`) | No: árbitro |
| Revelación, solo en `PAYOUT` por showdown | Cartas y `score` de los no retirados; ganadores por capa | Datos sí (`gameEngine.js:238-241`, `pozos.js:311`). El filtro es de `vistaDe` |
| `resultado` en el fin, desde la v1.2 | Si la partida termina en la misma jugada que cierra una mano (C-8, R2), la vista del fin publica el `resultado` de esa mano, con la forma del pago. En los demás fines vale `null`. Es lo que deja al cliente enseñar el pago antes de la pantalla final. No es un campo nuevo | No: árbitro (`vista.js`, `finConPago`) |
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
| Canal privado por mesa | Nada: solo pasa el aviso | Los miembros, con política sobre `realtime.messages` | Solo el árbitro | Sin políticas hoy. Emisión probada en público (`sonda_mot1/index.ts:153-161`); recepción privada sin probar (H-S2) | 1d-i las políticas; la recepción con un cliente suscrito se prueba en la 1f, con los dos teléfonos |

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
| Barajado del sorteo · `barajado_sorteo` | Se abre cada ronda, también la primera | `BARAJADO_MS`, una sola velocidad | Empieza el reparto del sorteo |
| Reparto del sorteo | Termina `barajado_sorteo` | Espera de animación, siempre rápida y por oleadas: no depende de los asientos | Se abre la elección |
| Elección del sorteo | Termina el reparto de la ronda | 10 s por ronda | Toma la posición 0 de quien no eligió y voltea. El abandonado no espera: la toma al instante (§7) |
| Volteo del sorteo · `volteo_sorteo` | Voltean las elegidas | 4 s, **provisional · se cierra con los teléfonos** | La Mano queda fijada y arranca la primera mano, o se abre la ronda siguiente |
| Turno | Le toca a un asiento en `BET_*` | `TURN_TIME` = 20 s (`GameTable.jsx:87`) | `pasar` si es legal; si no, `retirarse` (`GameTable.jsx:913-914`). El abandonado no llega a vencer: se retira en el acto (§7) |
| Descarte | Se abre `DISCARD` | `TURN_TIME` = 20 s (`GameTable.jsx:890`) | Descarte vacío para quien falte (`GameTable.jsx:917`) y aplica. El abandonado no descarta: está retirado desde que abandonó (C-8, §7) |
| Reposición · `reposicion` | Se aplica el descarte | Una sola tanda de vuelos a la vez: todos reponen en paralelo, con la fórmula del reparto sobre el mayor descarte (120 + mayor × 595 + 400 ms). Si nadie descartó, 600 ms. **provisional · se cierra con los teléfonos** | El motor sale de `DISCARD`: se abre `BET_3` y su turno, o lo que toque. Ver abajo |
| Reparto | `DEAL_2` o `DEAL_3` | Espera de animación | `advanceFromDeal` (`gameEngine.js:603`) |
| Aviso de salida · `aviso_salida` | `startHand` deja eliminados nuevos y la partida sigue | 3 s, **provisional · se cierra con los teléfonos** | Empieza el barajado |
| Barajado | `startHand`, o termina `aviso_salida` | Espera de animación | Se abre el reparto |
| Revelación y mano siguiente | `PAYOUT` | Con revelación, 6 + 2 s: la red de la celebración más la lectura. Sin revelación, 4 s desde el cierre de la mano. **provisional · se cierra con los teléfonos** | Si la mano lleva anuncio, `pausa_anuncio`. Si no, asientos que salen y `startHand` (`gameEngine.js:502`). Con ≤1 vivo, `GAME_OVER` (`:522`). El dinero y los puntos de la mano ya se escribieron al cerrarla (§7) |
| Pausa de anuncio · `pausa_anuncio` | Vence la mano siguiente de una mano con anuncio | 45 s, o hasta que todos vuelvan | Asientos que salen y `startHand`. Ver «Publicidad» |

**`TURN_TIME` no está exportado:** vive dentro del componente de mesa. La 1b lo lleva a donde el árbitro lo lea, sin cambiar la cifra.

**Durante la reposición, la mano sigue en `DISCARD`.** La vista ya lleva las cartas nuevas de cada asiento y `descarte.cuantas`, y `vencimiento.clase` dice `reposicion`. El motor no abre `BET_3`, no llega al showdown ni paga hasta que vence: nadie ve el resultado antes de ver reponer, y ningún reloj de turno corre durante la animación. Una `apostar` recibe `fase`, y una `descartar`, `ya_descarto`. Quien abandona en la reposición se retira en el acto (C-8, §7): lo calculado para la apuesta 3 o el showdown se recalcula sin él, y si queda uno solo, cobra el pozo.

### El sorteo

| Punto | Regla |
|---|---|
| Antes de cada ronda | Barajado (`barajado_sorteo`), también en la primera. Una sola velocidad: no lo escala el ritmo |
| Cada ronda | El árbitro baraja el mazo de sorteo completo, las 40 cartas: `shuffleDeck(createDeck())` bajo `setRng` (`deck.js:16, :59, :62`). Reparte 5 cartas boca abajo a cada asiento que participa. Cada uno elige una |
| Las no elegidas | Vuelven al mazo sin mostrarse nunca |
| Quién gana | Las elegidas se voltean a la vez y gana la más alta por `drawRank`: el As es la más baja (`deck.js:32-40`) |
| Quién participa | Todos en la ronda 1; en las siguientes, solo los empatados en la carta más alta. Ninguna ronda arrastra nada de la anterior |
| Tope | 3 rondas en total: la inicial y 2 de desempate. Si la tercera vuelve a empatar, el árbitro elige al azar (CSPRNG) a uno de los que siguen empatados |
| Vencimiento | 10 s de elección por ronda. Al vencer, el árbitro toma la posición 0 de quien no eligió. El abandonado la toma al instante (§7) |
| Reparto | Siempre rápido (`FACTOR_RAPIDA`), sea cual sea el ritmo de la mesa. Va por oleadas: una carta a cada asiento a la vez, cinco oleadas. La espera no depende del número de asientos |
| Vista | Las cinco posiciones propias sin valor y quién ya eligió; tras el volteo, la carta elegida de cada participante en cada ronda y qué posición era |
| Secretos | El valor de las cinco cartas hasta el volteo; el de las no elegidas, nunca |
| Cuándo | Solo en la primera mano de la mesa |
| El Pie | Se deriva: el asiento anterior a la Mano. El árbitro lo escribe en `pieIndex` y `startHand` lo lee sin abrir el motor (`gameEngine.js:542-543`) |

### El ritmo

| Punto | Regla |
|---|---|
| Qué escala | Exactamente lo que hoy escala «Partida rápida» contra las IAS: el vuelo del reparto y las esperas del segundo reparto (`GameTable.jsx:829, :847`) |
| Qué no escala | El barajado, la revelación, la pausa de mano siguiente, la reposición, el aviso de salida y la pausa de anuncio. Tampoco el reloj de turno, el de descarte y el de sorteo: iguales en los dos ritmos |
| El reparto del sorteo | Siempre con `FACTOR_RAPIDA`, sea cual sea el ritmo |
| Factor | `FACTOR_RAPIDA = 0.5` (`partidaRapida.js:20`). Ninguna cifra nueva |
| Lo que no se usa | `factorDeMano` da siempre 1 fuera de la mesa contra IAS (`partidaRapida.js:42` · su prueba, `partidaRapida.test.js:43`) |

### Las esperas base

Las constantes viven en `src/config/esperas.js`. Las de la 1b salen de lo que ya mide el cliente; las marcadas provisional las pone este contrato y se cierran con los teléfonos:

| Espera | Base | ¿La escala el ritmo? |
|---|---|---|
| Barajado | 1.950 ms, atados a `gameTable.css` (`GameTable.jsx:1927-1935`). También el del sorteo | No, a propósito |
| Vuelo de cada carta | `VUELO_REPARTO_S = 0.595` (`GameTable.jsx:287`) | Sí (`:829`) |
| Segundo reparto | 300 · 600 · 900 ms (`GameTable.jsx:848-850`) | Sí (`:847`) |
| Revelación | `REVEAL_CHOREO` (`GameTable.jsx:132-134`) y su coreografía · tope de red `RED_REVELACION_MS = 6000` (`mesaCore.js:395`). El cambio de fase apaga la celebración: por eso la espera cubre la red entera | No |
| Mano siguiente | En PvP no hay botón: arranca sola. **Con revelación, 6.000 + 2.000 ms:** la red de la celebración más la lectura. **Sin revelación** (ganan por retirada de los demás), **4.000 ms** desde el cierre de la mano. **provisional · se cierra con los teléfonos**. Contra las IAS sigue siendo un botón, con 300 ms tras tocarlo (`GameTable.jsx:2716-2726`) | No |
| Reposición | 120 + mayor descarte × 595 + 400 ms; sin descartes, 600 ms. **provisional · se cierra con los teléfonos**: la animación en paralelo nace en MES-PvP y debe caber aquí | No |
| Aviso de salida | 3.000 ms. **provisional · se cierra con los teléfonos** | No |
| Volteo del sorteo | 4.000 ms. **provisional · se cierra con los teléfonos** | No |
| Pausa de anuncio | Tope de 45.000 ms | No |
| Reparto del sorteo | Cinco oleadas, cada una de un vuelo: 120 + 5 × 297,5 + 400 = 2.008 ms, con cualquier número de asientos (`reloj.js`) | Siempre rápido |

### Reloj sin congelar

- **Manda el servidor.** El reloj no se congela con la pantalla apagada. `useCongelado` queda solo para las mesas contra las IAS (`GameTable.jsx:904` · `hooks/useCongelado.js`).
- **Partida muerta.** Si una partida pasa 15 min sin cambiar de versión, `barrer_salas` la cierra. La mano en curso se anula y cada asiento no cobrado recibe, por `liberacion_pvp`, la pila de la última mano cerrada, la que está en SQL. Cifra provisional. Va a la 1d-i y la 1d-ii (§9).
- **Borrar la cuenta con partida viva.** No cierra la partida: perjudicaría a los demás. Mientras el jugador tenga un asiento no cobrado, `partida_abierta_de` (`cfg1c:45-77`) la cuenta como partida abierta y el borrado se rechaza. Podrá borrarla cuando haya cobrado o cuando la partida muera. **Excepción:** el anfitrión, aunque haya cobrado, sigue bloqueado hasta que la partida termine o muera: `salas.anfitrion_id` es `on delete cascade`, y borrarlo se llevaría la sala, la partida y las pilas de todos.

### Ausencia

Sustituye a la «gracia de reconexión». No se distingue a quien no está de quien mira y no toca: quien no juega hace esperar a todos igual.

| Punto | Regla |
|---|---|
| Qué cuenta | Cada vencimiento propio resuelto por el reloj: turno de apuesta o descarte. Da igual qué cliente lo reclame. Agotar la pausa de anuncio no cuenta, y tampoco la elección del sorteo: quien no elige recibe la posición 0, sin falta |
| Qué pone a 0 la cuenta | Cualquier acción propia: `apostar`, `descartar`, `elegir_carta_sorteo` o `volver_anuncio` |
| `ausente` | `true` en la vista desde el 2.º vencimiento seguido |
| Abandono | Al llegar a **`N_AUSENCIA` = 3** vencimientos seguidos, **provisional · se cierra con los teléfonos**. El árbitro lo abandona por la misma ruta que `abandonarPorServidor`, y el §7 dice qué pasa con su dinero. Ese 3.er vencimiento lo retira, en su turno de apuesta o en el descarte, como a cualquier abandonado (C-8) |
| Lo que ve el que vuelve | MES-PvP, sub-tanda 6 |

### Publicidad

Las pantallas y los textos están en Tienda §10.1. Lo que el árbitro manda:

| Punto | Regla |
|---|---|
| Qué manos | `llevaAnuncio(mano)`: `mano % 11` es 5 o 0. Es decir, 5, 11, 16, 22, 27, 33, 38, 44… Sustituye a la regla de Tienda v1.3 §10.1 |
| Cuándo | Al vencer la mano siguiente, **antes de `startHand`**. La fase sigue en `PAYOUT`: no se reparte nada, y quien sale no paga el ante |
| Quién sigue | Los vivos, no abandonados, con pila ≥ ante. Si son ≤1, no hay pausa: `startHand` termina la partida |
| Quién lo ve | Los que siguen, salvo `asientos[i].sinAnuncio`: gancho de Premium, hoy siempre `false` (Tienda §5). Si nadie lo ve, no hay pausa |
| Quien no cubre el ante | Cobra al abrirse la pausa (§7) |
| Fin de la pausa | Todos volvieron (`volver_anuncio`), vencen los 45 s, o quedan ≤1 que sigan porque los demás abandonaron. Entonces sale `enAnuncio` de todos y se llama a `startHand` |
| Quien sigue en su anuncio al arrancar la mano | Nada especial: su ante se cobra y sus relojes corren, como los de cualquiera |

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
| Quien no cubre el ante en una mano con anuncio | Cobra al abrirse la pausa, no a los 45 s. No cambia el dinero: `startHand` lo iba a eliminar igual |

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
| Qué pasa en la mano (regla C-8, v1.2) | **Se retira en el acto, en cualquier fase**: en la apuesta (le toque o no; en su turno, por el motor), en el descarte, en la reposición, y en el barajado y el reparto de una mano con el ante cobrado. También en all-in. Pierde lo que puso y no es elegible en ninguna capa. Si queda uno solo en la mano, cobra el pozo por la ruta de los retiros (el resultado de `resolveWinner`, `gameEngine.js:198-207`, con `ganadoresPorCapa` y `repartirCapas`); si quedan dos o más, la mano sigue sin él. Si se van a la vez todos los que seguían en la mano (varios terceros vencimientos en el mismo descarte), el más cercano a la Mano no se retira y cobra el pozo, como el último en pie del motor |
| En el descarte | No descarta: está retirado. Si era el último que faltaba, la fase se aplica en el acto |
| En la reposición | Lo calculado (la apuesta 3 o el showdown) se recalcula sin él, con las cartas nuevas ya repuestas |
| Fin de partida (R2) | Con menos de 2 sentados (ni abandonados ni eliminados), la partida termina **en la misma jugada**, sin empezar otra mano: el estado final y el dinero quedan resueltos ahí. Si la mano se cerró en esa jugada, el fin conserva sus contribuciones y la vista publica su `resultado` (§4) |
| En el sorteo | Elige al instante la posición 0, al abandonar o al abrirse la elección, también en las rondas de desempate. Si era el último que faltaba, voltea en el acto. Si gana, la Mano pasa al siguiente vivo |
| Qué cobra | **Su pila al irse, nunca más** (R3): con mano en curso, al cerrarse esa mano y sin nada del pozo; sin mano en curso, en el acto. Lo que nadie igualó le vuelve, como a cualquiera que se retira (D-7). **La pausa de anuncio es «sin mano en curso»:** quien abandona en ella cobra en el acto y no paga el ante. Sale de `enAnuncio`, y si era el último que faltaba, la mano arranca |
| Lo que ya puso en el pozo | Lo pierde: se retiró (C-8). Antes de la v1.2 lo seguía disputando y podía ganarlo |
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
| Espejo del cliente: `APUESTAS_PVP` | `salas.js:41` · `salas.test.js:29, :36` | MES-PvP 7: `ArmarMesa.jsx:282` pinta lo que diga la lista, y el chip de 50 es de esa campaña |
| **Pantalla de armar mesa:** fila Entrada, chip de 50, control de ritmo del anfitrión | `ArmarMesa.jsx` | MES-PvP 7 |
| **Reloj de la sala:** 5:00 en mesas privadas, 3:00 en públicas | SQL de salas | MES-PvP 7 |
| `salas_abiertas` con `entrada`, y el texto del tope de 10 sentadas por minuto | `sal_b2:228-250` · `salasCore.js:132-135` · `textos.es.js:251` | MES-PvP 7 |
| Sala de espera: sentido y mini-perfil | `salaEsperaCore.js:141` · `MiniPerfil.jsx` | MES-PvP 7 |
| **El árbitro v1.1:** `volver_anuncio`, `ahora`, los campos del §4, los vencimientos nuevos, la ausencia y la pausa de anuncio | `src/arbitro/` · `supabase/functions/partida/` | MES-PvP 1 |
| Cada cliente se ve abajo: la rotación vive fuera de `seatLayouts.js` | El adaptador de la vista | MES-PvP 2 |
| Escalonar los reclamos y corregir el desfase con `ahora` | `partidaCliente.js` | MES-PvP 2 |
| **La mesa real:** los flujos de `GameTable.jsx` marcados «MOT-1 reescribe este flujo», la reposición en paralelo, entrar solo a la mesa, el ganador en `GAME_OVER`, la píldora al día, y fuera el panel y el stub | `GameTable.jsx` · `PartidaPvP.jsx` | MES-PvP 3 |
| El sorteo en pantalla, entero | `PartidaPvP.jsx` | MES-PvP 3 en forma mínima; 5 completo |
| La pausa de anuncio en pantalla y la tarjeta «Premium · Pronto» | Tienda §10.1 | MES-PvP 5 |
| Lo que ve el que vuelve, la partida muerta en el cliente y quien abandona en `mi_sala` | `partidaCliente.js:168-171` · `mot1_dinero:1019-1023` | MES-PvP 6 |
| **«Mano actual · Humanos 500»** | `cfg1e:99-116, :212` · `consultas.js:15` | MES-PvP 8 |
| **Encender los puntos contra humanos** | `mot1_dinero:1086-1092, :1325` | MES-PvP 8 |
| Las cifras provisionales del §6 | `src/config/esperas.js` | MES-PvP 8, con los teléfonos |
| Modo guion | `gameEngine.js:560` · `deck.js:59` · `repartoGanador.js:143, :235-244` | Sin edición del motor; TUT-1/GUI-1 |
| `vuelo` sin semilla | `diagDSK.mjs`, modo `vuelo` | Ninguna: MOT-1 no lo toca |
| Reglas v1.4: motivos con otro nombre y «`pozos.js` no protegido» | Reglas v1.4 `:143` | Hecho: Reglas v1.5, MES-PvP 0 |
| Protegidos §7.1, fila E-4: dice que el pozo deja de ser escalar | Protegidos §7.1 · `pozos.js:243` | Hecho: MES-PvP 0 |

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
| **MES-PvP** | La mesa y la pantalla: armar mesa con Entrada, chip de 50 y ritmo; `APUESTAS_PVP`; la ausencia y lo que ve el que vuelve; la publicidad; «Mano actual · Humanos 500»; mini-perfil en la sala; los flujos de `GameTable.jsx` marcados «MOT-1 reescribe este flujo»; encender los puntos contra humanos. Cada pieza, con su sub-tanda, en el §9. |
| **TUT-1 / GUI-1** | El modo guion: sin edición del motor, con `setRng` y `tiradasPara` (`deck.js:59` · `repartoGanador.js:143, :235-244`). |
| **SW-1** | De MOT-1 no se lleva nada. |
