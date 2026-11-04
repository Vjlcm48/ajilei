# AJILEI · MOT-1 · Fase 0b · Informe de la re-sonda (solo lectura) · v1.0

- **Fecha:** 2026-11-04
- **Base:** `main` en `1f5cb14` · **Referencia de septiembre:** `f9ee503`
- **Duración real:** 10 min 47 s de reloj (06:05:07 → 06:15:54); tope 60 min
- **Termina en:** STOP-0. Sin STOP intermedios.

## §2 · Comprobaciones previas

| Comprobación | Resultado |
|---|---|
| `git log -1` | `1f5cb14`, como pide la ficha |
| `git status --short` | Sin seguimiento: los dos informes de septiembre y tres archivos de `laminas/mon1/`. Ningún archivo con seguimiento modificado |
| Informes de septiembre | Existen y se leyeron enteros |
| `git worktree list` | Una línea |

## Lo que no se leyó o se leyó de otro modo

| Punto | Qué pasó | Efecto |
|---|---|---|
| `src/engine/aiPlayer.js` | Leído por `grep` (imports, estado de módulo, sitios de azar), no entero. La regla «lo justo» bastó para A2, A8 y K-8 | Sin efecto en esta sonda. La ficha que abra el archivo debe leerlo entero |
| `src/lib/saldo.js` | No existe. ECO-1b lo relevó con la billetera (`src/config/salas.js:14-18`) | C2 se contestó con el SQL |
| `src/config/entrada.js` | No existe. Vive en `src/engine/entrada.js` | Ninguno |
| `src/components/PartidaPvP.jsx` y `SalaEspera.jsx` | Están en `src/screens/` | Ninguno |
| Todo lo vivo | Prohibido por §1: `pg_publication_tables`, `functions list`, `alg` del JWT, despliegue de la sonda | Marcado «no determinable por lectura» donde aplica |
| Comportamiento del motor | Por lectura; §1 prohíbe ejecutarlo. Las sondas D5 de septiembre no se repitieron | Los veredictos de A4 se confirman con pruebas en la 1b |
| `sha256` de protegidos | Se comparó blob y líneas; `sha256sum` no está entre los comandos permitidos | Lo vigila `scripts/testProtegidos.test.js` |

---

## A · El motor

### A1 · Protegidos (lista v1.8: seis archivos)

| Archivo | Blob `f9ee503` | Blob `1f5cb14` | Blob en Protegidos §3 | Líneas hoy / §3 | Cambió en |
|---|---|---|---|---|---|
| `src/engine/gameEngine.js` | `6ddadd536eb8` | `21c4d3f56318` | `21c4d3f56318` ✔ | 748 / 748 | `fe46138` APU-1a |
| `src/engine/aiPlayer.js` | `0860812af936` | `8cfc3736cba2` | `8cfc3736cba2` ✔ | 1445 / 1445 | `fe46138` APU-1a |
| `src/engine/deck.js` | `ad6769a761d5` | `eb61426083ca` | `eb61426083ca` ✔ | 69 / 69 | `fe46138` APU-1a |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | `0d1bb8ea66a8` ✔ | 59 / 59 | No cambió |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `fbc9f3d08ede` | `fbc9f3d08ede` ✔ | 1084 / 1084 | `6f371c1` TAB-1c/1d |
| `src/styles/gameTable.css` | `1e21371c8543` | `87c9cb519bdb` | `87c9cb519bdb` ✔ | 6289 / 6289 | `6f371c1` TAB-1 · `67c0792` TAB-2 |

`git log f9ee503..1f5cb14 -- src/engine/` da un solo commit, `fe46138`. Las fases internas están en Protegidos §7.

### A2 · Grafo de importaciones desde `gameEngine.js`

| Archivo | Lo importa | Especificador con extensión | Navegador / React / Howler / Supabase / Node |
|---|---|---|---|
| `src/engine/gameEngine.js` | raíz | Sí (`:1-3, :7-8`) | Ninguno |
| `src/engine/deck.js` | gameEngine `:1`, aiPlayer `:2` | Sí | Ninguno. `Math.random` en `:56` |
| `src/engine/handEvaluator.js` | gameEngine `:2`, aiPlayer `:1` | Sí | Ninguno |
| `src/engine/aiPlayer.js` | gameEngine `:3` | Sí | Ninguno. `Math.random` en `:599`; estado de módulo (A8) |
| `src/engine/pozos.js` | gameEngine `:7`, aiPlayer `:5` | Sí | Ninguno. Sin estado de módulo |
| `src/config/ajileiConfig.js` | gameEngine `:8`, pozos `:15`, aiPlayer `:8` | Sí | Ninguno. No importa nada |

**Seis archivos**, en septiembre cinco: entra `pozos.js`. `src/engine/entrada.js` queda fuera del grafo (`entrada.js:12`: «MOT-1 no la usa»). La copia `supabase/functions/sonda_mot1/motor/` es el motor de septiembre (`gameEngine.js` de 548 líneas) y no sirve.

### A3 · Las seis ediciones de K-1

| Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|
| 1 · exportar `applyBetAction` | Exportada | cayó (hecha, APU-1) | `gameEngine.js:377` |
| 2 · asiento como parámetro | `applyBetAction(state, playerIndex, action, k)`. `applyPlayerBetAction` queda como envoltorio del 0. Reglas §9 no la cuenta como hecha, pero para apuestas lo está | cayó (hecha en las apuestas; el descarte es la 3) | `gameEngine.js:377, :629-631` |
| 3 · descarte por asiento | Un solo array para todo `isHuman` | sigue, tal cual: **la única que falta** | `gameEngine.js:681, :695-697` |
| 4 · `createInitialState` con lista | Acepta `[{ isHuman, chips, name }]`. `id` siempre es el índice | cayó (hecha) | `gameEngine.js:80-91` |
| 5 · quitar el fin de mesa del asiento 0 | Fin de mesa solo con ≤1 vivos | cayó (hecha) | `gameEngine.js:522, :536-539` |
| 6 · extensiones `.js` | Puestas | cayó (hecha) | `gameEngine.js:1-8` |
| Guarda `monto ≥ 0` en el motor | `esLegal` va delante de todo: `k` debe ser entero, >0 y de `multiplicadores`; hay además clamp a 0 | cayó (cambió de forma) | `gameEngine.js:378, :428` · `pozos.js:138, :152` |

### A4 · D5 («el motor no valida nada»)

| Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|
| D5-a monto negativo | `k ≤ 0` → `monto_invalido` | cayó | `pozos.js:138, :152` |
| D5-b monto sin tope | Solo `multiplicadores [1,2,5,10]` | cayó | `pozos.js:24, :138` · `ajileiConfig.js:25` |
| D5-c monto no entero | `monto_invalido` | cayó | `pozos.js:138` |
| D5-d acción desconocida | `accion_desconocida`; el `switch` también devuelve el estado | cayó | `pozos.js:168-169` · `gameEngine.js:418-419` |
| D5-e fuera de turno | `fuera_de_turno` | cayó | `pozos.js:121` |
| D5-f apostar fuera de fase | `fase` | cayó | `pozos.js:118` |
| D5-f `applyDiscard` fuera de fase | Sin guarda | sigue | `gameEngine.js:681-708` |
| D5-f `startHand` a mitad de mano | Sin guarda: cobra otro ante | sigue | `gameEngine.js:502-517` |
| D5-g pasar con apuesta viva | `hay_apuesta` | cayó | `pozos.js:132-133` |
| D5-h índices de descarte malos | Sin validar; un valor que no sea array lanza en `.slice` | sigue | `gameEngine.js:695-706` |
| D5-i retirado o eliminado que apuesta | `retirado` | cayó | `pozos.js:119` |
| D5-j `apostar` baja la apuesta | `hay_apuesta` | cayó | `pozos.js:135-136` |
| D5-k subidas sin límite de número | Regla sellada, no defecto: sin tope por ronda | cayó | `ajileiConfig.js:40-44` |
| El motor no valida; la legalidad vive en la pantalla | `esLegal` es puro y no se importa de vuelta | cambió | `pozos.js:1-5` |

Motivos: **11** en `pozos.js:28-40`. Llaman a `esLegal`: `gameEngine.js:378`, `aiPlayer.js:973, :990, :1025`, `hooks/mesaCore.js:53, :75`.
Validaciones propias del motor: §4.3 en `abrirApuesta` (`gameEngine.js:361-363`), E-13 en `isRoundOver` (`:152-164`), `aplicarRecarga` (`:666-670`).
Sin validar en ninguna parte: asiento dueño de la acción (identidad), descarte (fase, asiento, índices), arranque de mano y `toggleDiscard`. Eso le queda al árbitro.
`applyBetAction` devuelve el mismo estado ante lo ilegal, sin motivo: el motivo hay que pedírselo antes a `esLegal` (`gameEngine.js:367-378`).

### A5 · I-3

| Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|
| La API solo mueve al asiento 0 | Apuestas por cualquier asiento; descarte aún con array único | cambió | `gameEngine.js:377, :695-697` |
| La quiebra del 0 termina la mesa | Ya no | cayó | `gameEngine.js:522, :536-539` |
| `player.id` = asiento | Sigue, y lo fuerza la construcción: `makePlayer(i, …)` | sigue | `gameEngine.js:89-91, :232, :235, :473` |
| Sillas con huecos | `sala_jugadores.asiento` 0..4 con `unique` | sigue | `20260905203158_sal_a_salas.sql:147-154` |
| Primera Mano fija en el 0 | Igual. `startHand` lee `state.pieIndex` si `handCount === 0` | sigue | `gameEngine.js:92-95, :542-543` |
| Regla de la primera Mano sin fuente (R-1) | Escrita: cada uno saca una carta, gana el nominal mayor, empatados repiten; lo ejecuta el servidor | cayó | `docs/AJILEI_APU-1_Reglas_v1.4.md:348` |
| `drawRank` sin consumidor | Sigue sin consumidor; `createDeck` y `shuffleDeck` están exportadas | sigue | `deck.js:16, :34, :62` |

### A6 · H-2/H-3

| Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|
| Comodín y tope dependen de los vivos al barajar, no de la Mano | **Sí, igual** | sigue | `gameEngine.js:518, :580` · `handEvaluator.js:2-6` |

### A7 · `finDeMano`

| Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|
| (no existía) | `finDeMano` con asiento 0 cableado; respaldo `state.winner` | nuevo | `hooks/mesaIACore.js:186-197`; respaldo `:189` |
| (no existía) | Gemelo del respaldo | nuevo | `hooks/manoCore.js:86` |
| (no existía) | Comentario «siempre UNA capa… esta ruta no se toma». Inexacto: hay manos por retiros con un all-in como único en pie (VOZ-3 Fase 0 R-5) | nuevo | `gameEngine.js:193-197` |
| `winner` paga | Tras el pago, `winner` es la capa superior; la mano la gana la capa 0 | cambió | `gameEngine.js:285, :292` · Reglas v1.4 §4.3 |

### A8 · Campos del estado que no existían en `f9ee503`

| Campo | Lo escribe | Prueba |
|---|---|---|
| `players[i].contribMano` | `makePlayer`, `applyBetAction`, `startHand` | `gameEngine.js:63, :424, :556` |
| `players[i].allIn` | `makePlayer`, `applyBetAction`, `startHand` | `gameEngine.js:64, :433, :556` |
| `players[i].entrada` | `makePlayer`, `aplicarRecarga` | `gameEngine.js:65, :675` |

Las 16 claves de primer nivel son las de septiembre. **El estado no lleva capas:** `pot` sigue siendo un entero y las capas se derivan (`pozos.js:243`). Protegidos §7.1 fila E-4 dice «el pozo deja de ser escalar», y el código y Reglas §9 lo contradicen. Pasajeros de pantalla: `nivelIA`. Se reescriben `message` y `winner` al pasar de mano (`GameTable.jsx:2717`).
Estado de módulo nuevo, no de partida: `deck.js:57` (`rng`), `aiPlayer.js:600, :637, :642, :653`.

---

## B · El azar y el modo guion

| Punto | Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|---|
| B1 · baraja | `Math.random` cableado | Fisher-Yates con `rng` inyectable; por defecto `Math.random` ligado tarde | cambió | `deck.js:56-69` |
| B1 · punto de llamada | `startHand` | Sigue único. **K-5(a) enchufa con `setRng`, sin abrir nada** (Protegidos §6.1 cubre «el árbitro de PvP») | sigue | `gameEngine.js:560` · `deck.js:59` |
| B1 · el mazo viaja | Entero en el estado | Resto en `state.deck`, repartidas en `players[i].cards` | sigue | `gameEngine.js:576, :571` |
| B2 · mazo dado o RNG | No admitía | `createInitialState` y `startHand` no reciben ni mazo ni RNG. Sí hay **RNG inyectado a nivel de módulo** | cambió | `gameEngine.js:80, :502` · `deck.js:59` |
| B2 · costura «mazo dado» | — | Con motor: solo `gameEngine.js:560`, y K-1 no lo autoriza. Sin motor ya existe: `tiradasPara(orden)` más `setRng`, un mazo exacto en 39 tiradas | nuevo | `dev/repartoGanador.js:143, :235-244` |

### B3 · Pruebas con azar sellado

| Pieza | Cómo fija la semilla | Prueba |
|---|---|---|
| `diagDSK apu` | Semilla 1 sobre `Math.random` de la página | `scripts/diagDSK.mjs:1950-1958, :3047` · `scripts/arnes/siembra.mjs:24-35` |
| `diagDSK u3` | Semilla 2, igual | `scripts/diagDSK.mjs:9402, :9409` |
| `diagDSK msg` | Sus semillas fijas; `--semilla` es exploración | `scripts/diagDSK.mjs:421-423` |
| `banco:verificar` | `--unit` y `--seed` de la vara `scripts/apu1_bandas.json` | `scripts/bancoVerificar.mjs:120-121` · `scripts/bancoNiveles.mjs:118-121` |
| `testMesaAPU1` | `mulberry32(20260918)` en mazo e IA | `scripts/testMesaAPU1.test.js:27-28, :480-482` |
| `testRnk1b` / `testVoz3` | `generador(1976)` / `generador(7)` | `scripts/testRnk1b.test.js:167-168` · `scripts/testVoz3.test.js:284-285` |
| `testCronica` / `testAI` | `mulberry32(SEMILLA)` / `setRng` | `scripts/testCronica.test.js:62-63` · `scripts/testAI.test.js:515` |
| `testMotorAPU1` / `testNivel1` | LCG sobre `setRng` / oro con `Math.random` espiado | `scripts/testMotorAPU1.test.js:366-403` · `scripts/testNivel1.test.js:71` |

Envejecen solo si cambia el consumo de azar con el generador por defecto: `siembra.mjs:8-10`. El CSPRNG va solo en el servidor, y la edición 3 no consume azar si conserva el orden Mano→Pie.

---

## C · El dinero

### C1 · RPC de dinero

| RPC | Migración vigente | Firma | Tope |
|---|---|---|---|
| `sentarse_ia` | `20261009105658_eco1d…:420` | `(text, integer, integer, bigint, uuid, text)` | `limite_dinero` · 10 |
| `recargar_ia` | `eco1d:536` | `(uuid, bigint, integer)` | `limite_dinero` · 20 |
| `salir_ia` | `eco1d:622` | `(uuid, bigint, integer)` | `limite_dinero` · 30 |
| `recoger_mesa_ia` | `eco1d:696` | `(text)` | `limite_dinero` · 10 |
| `informar_pila` | `20261024191731_rnk1a…:339` | `(uuid, integer, bigint, integer, boolean, integer, smallint)` | Sin tope por minuto; solo `ia_tope_manos_minuto` para el libro |
| `marcar_ingreso` | `eco1d:168` | `()` | `limite_dinero` · 6 |
| `pedir_boleto` | `20261012230807_eco1g…:363` | `()` | `limite_dinero` · 10 |
| `cobrar_boleto` | `eco1g:424` | `(uuid)` | `limite_dinero` · 20 |
| `consultar_mano` | `20261030193000_cfg1e…:175` | `(uuid, integer)` | **Literal 30** (`:199`) |
| `comprar_articulo` | `20261031150000_tie1a…:143` | `(text, text, text)` | **Literal 30** (`:162`) |
| `ajuste_admin` · `constancia_admin` · `valvula_ia` | `eco1a:740` · `eco1d:379` · `eco1d:340` | Sin concesión al cliente | No aplica |
| `aplicar_movimiento` · `cerrar_partida_abierta` | `eco1a:420` · `eco1c:303` | Internas | No aplica |

`limite_dinero` tiene 7 entradas: `eco1g:100-113`. `contar_intento_dinero` lee `auth.uid()` y devuelve `false` sin él (`eco1a:372-374`): llamada con llave de servicio, da siempre `limite`.

### C2 · El circuito vs IAS

| Pieza | Hoy | Vale para PvP | Prueba |
|---|---|---|---|
| Cobro de la entrada | `sentarse_ia`, idempotente por token | La forma sí; la RPC no (reto, `auth.uid()`) | `eco1d:420-530` |
| Una partida abierta | Índice único en `mesas_ia` | Regla sí. **Pieza no:** solo conoce `mesas_ia` | `eco1c:167, :303-343` · ECO v1.3 §5, §8 |
| Cobro al salir o cortar | `salir_ia` y `abandono_ia`, por pila informada y techo | No: el árbitro conoce la pila, no hace falta techo | `eco1d:622-690` · `eco1c:313-330` |
| «Saldo flotante» | El término no aparece en normativo ni en código. Lo más cercano: la entrada sale de la billetera y vuelve al cerrar | Sí, como garantía | ECO v1.3 §8 |
| Libro | `movimientos(jugador_id, tipo, monto, saldo_tras, ref_tipo, ref_id, clave_idem, motivo, creado_en)`, solo inserción | **Sí, tal cual.** Tipos ya listos: `garantia_pvp`, `liberacion_pvp`, `resultado_pvp` | `eco1a:162-186` · `cfg1e` lista vigente |
| Restricción del libro | `monto <> 0` y `saldo_tras >= 0` | **Choca con K-9:** con la entrada ya retirada, una mano perdida no puede ser un movimiento negativo si el saldo no la cubre (pregunta 3) | `eco1a:181-182` |
| Récord de manos | `record_manos`, con `reto` limitado a tres | No | `eco1c:185-197` |
| Válvula | Apagada con tope nulo; PvP no la mira | No aplica | `eco1d:243, :312-320` · ECO v1.3:60 |

### C3 · Las entradas

| Entrada | Dónde | Constantes | Quién la lee | Prueba |
|---|---|---|---|---|
| vs IAS piso/medio/techo | Config y espejo SQL | 10× / 20× / 50× | `mesaCore`, `retarCore`, `RetarIAS`, `GameTable`, `sentarse_ia` | `ajileiConfig.js:34` · `entrada.js:35-46` · `eco1c:80-84` |
| PvP Corta/Llena | **Solo normativo, ninguna constante ni columna** | 15× / 50× | Nadie | Reglas v1.4 `:344` · ECO v1.3 `:74` |
| Regla de asiento PvP | SQL y espejo | **Saldo ≥ 5×**; el normativo dice saldo ≥ entrada | `crear_sala`, `unirse_sala` | `sal_a_salas.sql:285` · `sal_b2.sql:143` · `salas.js:57` |
| Apuestas PvP | SQL y espejo | **Seis** (100…5000); el normativo dice siete, con 50 | Salas | `salas.js:41` · Reglas v1.4 `:343` |
| Identidad de mesa abierta | `crear_sala` | Jugadores × apuesta; el normativo añade entrada | `crear_sala` | `salasApi.js:138-144` · Reglas v1.4 `:345` |

### C4 · El libro de puntos

| Punto | Hoy | Prueba |
|---|---|---|
| Tabla | `libro_puntos(jugador_id, creado_en, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)` | `rnk1a:112-142` |
| Guardas | `origen` en `ias`/`humanos`; `nivel` nulo si humanos; `sentados` 2..5; `puntos_base = sentados + 3` en humanos; `extra` por `ajilei`; 52 exige 5; `unique (origen, mesa_id, mano)`; inmutable; `mesa_id` sin FK | `rnk1a:125-141, :155` |
| Quién escribe | Solo `informar_pila`, y solo `origen = 'ias'`; cifra del servidor (INV-65). **Rama humanos: ningún escritor** | `rnk1a:339-470` |
| Lo que deberá escribir el árbitro | `origen='humanos'`, `nivel` nulo, `sentados = handRules.ruleN`, `puntos_base = ruleN + 3`, `ajilei` y `extra` del ganador de la capa 0 | `docs/AJILEI_Rankings_v1.2.md:88, :106, :143` |

### C5 · Mano actual

| Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|
| (no existía) | `precio_consulta('humanos') = 500` y su espejo, **durmientes** | nuevo | `cfg1e:99-116` · `config/consultas.js:15` |
| (no existía) | `consultar_mano` no tiene rama de humanos: busca en `mesas_ia`, sin ella da `mesa_invalida`; `ref_tipo = 'mesa_ia'` | nuevo | `cfg1e:175-263, :212` |
| (no existía) | Menú v1.6: «MOT-1 cierra el hueco» de la mano que dice el cliente. **Con K-8(a) no lo cierra vs IAS:** ahí el servidor sigue sin conocer la mano | nuevo | `docs/AJILEI_Menu_Utilidades_v1.6.md:93-97` |

---

## D · Salas, estado y Realtime

| Punto | Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|---|
| D1 · columna | `estado_partida jsonb` | Igual, siempre nula | sigue | `sal_a_salas.sql:104, :119` |
| D1 · réplica | `replica identity full` en las dos tablas | Igual | sigue | `sal_a_salas.sql:205-206` |
| D1 · publicación | `salas`, `sala_jugadores` | Igual por migraciones; ninguna añade tabla y las de dinero se excluyen. Vivo no consultado | sigue | `sal_a_salas.sql:852-865` · `eco1a:819` |
| D1 · lectura | `select('*')` | Igual, y lleva la columna al cliente en cada cambio | sigue | `salasApi.js:284-292` · `SalaEspera.jsx:212` |
| D2 · `mi_sala()` | — | Solo `esperando`, por `sala_esperando_de`. Deberá devolver la mesa viva | sigue (provisional) | `sal_b1_ajuste.sql:55, :346-372` |
| D2 · barrido | — | `activa` y `estado_partida is null` a 10 min. **Con K-6(b) la columna sigue nula y cancelaría partidas vivas:** el predicado debe mirar la tabla nueva | cambió | `sal_b1_ajuste.sql:116-120` · `salas.js:197` |
| D2 · quien pasa a `activa` | — | `jugar_ya` y `barrer_salas`, sin crear partida. El SQL no invoca la función: alguien debe arrancarla | sigue | `sal_a_salas.sql:663-695` · `sal_b1_ajuste.sql:100-111` |
| D2 · borrado de cuenta | (no existía) | `partida_abierta_de` bloquea con `activa`: una partida sin final bloquea el borrado para siempre | nuevo | `cfg1c:45-77` |
| D3 · suscripción | `postgres_changes` ×2 | Igual; contrato «algo cambió, vuelve a pedir». Broadcast y Presence: cero | sigue | `salasApi.js:307-318` · `SalaEspera.jsx:211-219` |
| D3 · SDK | 2.112.4 | `^2.112.4`, instalado 2.112.4. Trae `private?: boolean` y `setAuth`. Sin políticas en `realtime.messages`; recepción sin probar (H-S2) | sigue | `package.json:18` · `realtime-js/dist/module/RealtimeChannel.d.ts:54` |
| D4 · stub | `partida-pvp` | Un rótulo y un CTA; no lee ni se suscribe | sigue | `screens/PartidaPvP.jsx:16-21` |
| D4 · llegada | — | `fin === 'activa'` → «¡Arranca la partida!» y CTA → `onPartida` → `setScreen('partida-pvp')` | sigue | `SalaEspera.jsx:391, :432-435` · `textos.es.js:215` · `App.jsx:1011, :1021-1023` |

---

## E · La entrada ligera y el ritmo

| Punto | Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|---|
| E1 · motor | En el paquete | Diferido: `GameTable` por `cargarMesa`, y también `controlMesaIA` → `mesaIACore` → `gameEngine`. Los cinco del motor están en la lista del guardián. Reparto exacto entre trozos no determinable sin build | cambió | `cargarMesa.js:124` · `trozos.js:32` · `testEntradaLigera.test.js:34` |
| E1 · guardián | — | 43 módulos; `salasApi.js`, `supabase.js`, `entrada.js` y `ajileiConfig.js` no están | nuevo | `testEntradaLigera.test.js:19-42` |
| E1 · `salasApi.js` | — | **En la entrada** (import estático) | nuevo | `App.jsx:98` |
| E1 · cliente Supabase | — | **En la entrada**, con el SDK y su Realtime | nuevo | `hooks/useAuth.js:3` · `App.jsx:65` · `lib/supabase.js:44` |
| E1 · dónde nace lo de MOT-1 | — | En **`trozos.partidaPvP`**, no en `salasApi.js`. No se precarga desde el lobby | nuevo | `trozos.js:28, :39` |
| E2 · reloj de turno | `:715-733` | `TURN_TIME` y efecto; vencido: pasar o retirarse, descarte vacío | sigue | `GameTable.jsx:87, :888-891, :904-922` |
| E2 · salto del retirado | Necesario | El motor abre en `primerTurno` y `nextActiveIndex` salta; por eso «no alcanzable». El árbitro no lo necesita | cayó | `GameTable.jsx:1178-1205` · `gameEngine.js:169-190` |
| E2 · retirado en descarte | `:958-965` | Igual | sigue | `GameTable.jsx:1230-1238` |
| E2 · avance de fase | `:652-680` | Igual; `advanceFromDeal` lo dispara la animación | sigue | `GameTable.jsx:833-869, :854, :860` |
| E2 · mano siguiente | `:1295`, `:2009-2021` | `beginHand` y botón con 300 ms | sigue | `GameTable.jsx:1869-1882, :2714-2724` |
| E2 · `useCongelado` | No lo trató | El reloj **no corre a oscuras**; en PvP no puede valer para los demás (pregunta 5) | nuevo | `GameTable.jsx:428, :904` · `hooks/useCongelado.js:147` |

---

## F · Terreno y pruebas

| Punto | Septiembre decía | Hoy | Veredicto | Prueba |
|---|---|---|---|---|
| F1 · CLI | 2.116.0 | **2.122.1** (ya hay 3.0.0) | cambió | `npx supabase --version` |
| F1 · `config.toml` | Sin `[functions]` | `[functions.eliminar_cuenta] verify_jwt = false` | cambió | `supabase/config.toml:35-36` |
| F1 · funciones en disco | Ninguna | `eliminar_cuenta/` (con seguimiento) y `sonda_mot1/` (ignorada; motor viejo) | cambió | `supabase/functions/` |
| F1 · `.gitignore` | — | Tres líneas de la sonda; limpieza §6 de septiembre sin hacer | sigue | `.gitignore:127-129` |
| F1 · desplegada | Sí | No determinable; pública con `--no-verify-jwt` si sigue | sigue | Fase 1-0 §1 |

### F2 · Lo reutilizable sin copiar deuda

| Pieza | Archivo | Nota |
|---|---|---|
| Lectura del Bearer | `sonda_mot1/index.ts:113-114` | La parte de `/auth/v1/user` no (H-S1) |
| `env`, `llave` | `eliminar_cuenta/index.ts:33-45` | Mismo patrón que la sonda, ya con seguimiento. Su comentario `:25` cita la sonda: envejece al borrarla |
| Envío Broadcast con `sb_secret` | `sonda_mot1/index.ts:153-161` | Emitió `private: false`; habrá que probar privado |
| CORS | `eliminar_cuenta/index.ts:53-60` (`ORIGENES`, `cabecerasCors`) | Tal cual |
| Por qué `verify_jwt = false` | `eliminar_cuenta/index.ts:27-29` | Vale para el árbitro |
| JWKS en local | `auth.getClaims` en auth-js | `@supabase/auth-js/dist/module/GoTrueClient.js:5332`. Si el `alg` es simétrico no valida en local: no determinable por lectura |
| Llamada del cliente | `lib/cuentaApi.js:55` · `lib/red.js:43` | `functions.invoke` con tope de red |

### F3 · Para el humo de dos sesiones

| Pieza | Dónde | Nota |
|---|---|---|
| Cliente con forma de SDK | `dev/salasFixtures.js:336-414` (`clienteDe`: `rpc, from, channel, removeChannel`) | También `simulacionSalas :83`, `apiSinMesa :125` |
| Estados | `ESTADOS_SAL` `dev/salasFixtures.js:47` · `ESTADOS` `scripts/diagSAL.mjs:81` | 17; el de la llegada es `espera-fin-activa` |
| Stub | `screens/PartidaPvP.jsx` | Se sustituye |
| Banco de SQL | `npm run guiones` · `scripts/guiones.mjs` · `supabase/pruebas/` | PGlite antes del `db push` |
| Banco imitado | `dev/bancoImitado.js` | Contrato de dinero en cliente |
| Dos sesiones reales | **No existe** | `diagSAL` usa simulación; la 1f lo crea |

---

## §5 · Veredicto

### a) Tabla K

| Decisión | Estado | Por qué | Prueba |
|---|---|---|---|
| K-1 · J-1 + seis ediciones | **revisar** | J-1 sigue. De seis ediciones **falta solo la 3**; la guarda `monto ≥ 0` cayó | `gameEngine.js:377, :80, :536, :1-8, :695-697` |
| K-2(c) | **revisar** | La validación de apuestas ya está en el motor. El árbitro se reduce a identidad, descarte, arranque y vencimiento | `gameEngine.js:378` · `pozos.js:114` |
| K-4(a) | **cae** | `deck.js` es protegido desde Protegidos v1.4, con excepción §6.1. No hace falta abrirlo | `Protegidos:16-26, :89, :250-263` · `deck.js:59` |
| K-5(a) | sigue | `setRng` existe y §6.1 cubre al árbitro; el mazo queda en el estado | `deck.js:59` · `gameEngine.js:560, :576` |
| K-6(b) | sigue | La columna sigue difundiéndose. Molde: `mesas_ia` sin lectura de cliente | `sal_a_salas.sql:205, :852` · `eco1c:803` |
| K-7(a) | sigue | `resolver_sala` sigue siendo la doctrina; el salto del retirado sale del ámbito | `sal_a_salas.sql:370` · `salasApi.js:181-185` |
| K-8(a) | sigue | `decideDiscard` solo para `!isHuman`; `aiPlayer.js` viaja inerte | `gameEngine.js:695-697` |
| K-9 | **revisar** | La garantía está sellada y los tipos existen, pero `saldo_tras >= 0` impide el negativo por mano, y regla 5×, seis apuestas y sin columna `entrada` contradicen el normativo | `eco1a:175-182` · ECO v1.3 §8 · `salas.js:41, :57` |
| K-10(a) | sigue | Ya es lo que hace el motor. El residuo `< unit` queda en `chips` y debe volver al saldo | `gameEngine.js:511, :515, :522` · Reglas §2.4 |
| K-11(a) | sigue | Siguen los huecos; `id` lo pone `createInitialState` | `gameEngine.js:89-91` · `sal_a_salas.sql:147-154` |
| K-12 | sigue | `message` sigue en perspectiva del asiento 0 y la voz vive en el cliente | `gameEngine.js:244-270, :447-468` · `manoCore.js` |
| Bus: solo Realtime Broadcast | sigue | El SDK trae canales privados y no hay dependencia de Ably. Recepción privada sin probar | `RealtimeChannel.d.ts:54` · `package.json` |
| Token por `SUPABASE_JWKS` | sigue | Nada lo contradice; `eliminar_cuenta` usa HTTP porque es una sola llamada. Falta confirmar el `alg` | `eliminar_cuenta/index.ts:6-8` · Fase 1-0 H-S1 |

### b) Tabla de heredados

| Pieza | Dónde está hoy | Sub-tanda |
|---|---|---|
| Árbitro decide por la capa principal (VOZ-3) | `hooks/manoCore.js:86` · `hooks/mesaIACore.js:188-190` · `gameEngine.js:285, :292` · Reglas v1.4 §4.3 | 1b |
| Comentario 195-197 | `gameEngine.js:193-197` | 1b, en la misma apertura de la edición 3 |
| Libro de puntos contra humanos (RNK-1) | `rnk1a:112-142` · `Rankings_v1.2:88, :143` | 1d-ii la función; 1e la llamada |
| Unificar topes en `limite_dinero()` (ARN-4) | `eco1g:100-113` · `cfg1e:199` · `tie1a:162` | 1d-ii |
| Respaldo `state.winner` (ARN-4) | `hooks/mesaIACore.js:189` · `hooks/manoCore.js:86` | 1b |
| Semillas `apu` / `u3` (ARN-4d) | `scripts/diagDSK.mjs:1950-1958, :9402` · `scripts/arnes/siembra.mjs:8-10` | 1b: solo si cambia el consumo; se comprueba, no se re-elige a ciegas |
| `vuelo` sin semilla | `scripts/diagDSK.mjs` modo `vuelo` · memoria ARN-4d | Ninguna: no lo toca MOT-1 |
| Sorteo de la Mano en el servidor con `drawRank` | `deck.js:16, :34, :62` · `gameEngine.js:94, :542-543` · Reglas v1.4 `:348` | 1b |
| Once motivos de `esLegal` en el contrato | `pozos.js:28-40` · lista cerrada del cliente en `salasApi.js:44-54` | 1a el contrato; 1b y 1e el uso |
| «Mano actual · Humanos 500» | `cfg1e:99-116, :212` · `config/consultas.js:15` | MES-PvP: sin consumidor en MOT-1. Depende de la tabla de 1d |
| Modo guion | `gameEngine.js:560` · `deck.js:59` · `dev/repartoGanador.js:143, :235-244` | Ninguna edición; TUT-1/GUI-1. 1a lo anota |
| Motor en el trozo de la mesa (PES-1) | `cargarMesa.js:124` · `trozos.js:28, :32` · `testEntradaLigera.test.js:34` | 1e y 1f: lo nuevo nace en `trozos.partidaPvP` |

### c) Las seis sub-tandas

**El corte sigue, con dos ajustes.** Juntar 1c dentro de 1b: `setRng` ya existe y el azar no abre el motor. Partir 1d en dos: el dinero, que en septiembre no existía, pesa más que el esquema y tiene otro riesgo. Son estimaciones, no medidas.

| Sub-tanda | Contenido | Minutos de Claude Code | Lo que no se comprime (Victor) |
|---|---|---:|---|
| 1a · Documental | Contrato de acciones y vista, motivos, respuestas del §5-e, Protegidos, normativos | 20–30 | Decisiones del §5-e |
| 1b · Motor y árbitro sin red (con azar) | Edición 3 con fila §3 y §7 en el mismo commit; árbitro; `vistaDe`; compactar sillas; sorteo; capa 0 por asiento; adaptador CSPRNG | 120–180 | Autorizar la apertura de `gameEngine.js` |
| 1c · Azar | Dentro de 1b. Por separado serían | 15–20 | Nada |
| 1d-i · Esquema | Tabla de partida, ciclo de `activa`, `barrer_salas`, `mi_sala`, `realtime.messages` | 60–90 | `db push`, guion en el SQL Editor |
| 1d-ii · Dinero y puntos | Garantía y reparto con `aplicar_movimiento`, C4 entre modos, `libro_puntos`, `limite_dinero` | 90–120 | `db push`, guion en el SQL Editor |
| 1e · Edge Function | JWKS, `uid → asiento`, acciones, vencimiento, vistas por Broadcast privado | 90–150 | `functions deploy --use-api`, confirmar el `alg`, borrar la sonda |
| 1f · Humo con dos sesiones | Dos clientes sin UI de mesa | 45–60 | Prueba con dos teléfonos |
| **Total** | | **≈ 7–10 h** | |

### d) Riesgos nuevos

| # | Riesgo | Prueba |
|---|---|---|
| N-1 | **Las RPC de dinero no sirven desde el servidor:** todas leen `auth.uid()`. Con `sb_secret` dan `sin_sesion` o `limite`. El árbitro necesita funciones con uid por parámetro, solo para `service_role` (molde `partida_abierta_de`) | `eco1a:372-374` · `cfg1c:45, :83` |
| N-2 | **C4 entre modos no tiene pieza:** `cerrar_partida_abierta` no conoce PvP, y con fichas en el pozo «última pila» no basta | `eco1c:303-343` · ECO v1.3 §5, §8 |
| N-3 | **K-9 choca con `saldo_tras >= 0`** si la mano se anota como movimiento | `eco1a:182` |
| N-4 | **Salas contradice el normativo:** regla 5×, seis apuestas, sin `entrada` | `salas.js:41, :57` · Reglas v1.4 `:343-345` |
| N-5 | **El barrido cancelaría partidas vivas** con K-6(b) | `sal_b1_ajuste.sql:116-120` |
| N-6 | **Partida sin final = cuenta imborrable** al retirar la regla de 10 min | `cfg1c:45-77` |
| N-7 | **Reloj y FRZ-1:** con todas las pestañas ocultas nadie reclama; y quien vuelve puede encontrarse retirado | `hooks/useCongelado.js` · `GameTable.jsx:904` |
| N-8 | **INV-84:** añadir a `salasApi.js` o al cliente engorda la entrada | `App.jsx:98` · `trozos.js:1-6` |
| N-9 | **`pozos.js` decide la legalidad y no es protegido** | `gameEngine.js:378` · `Protegidos:85-92` |
| N-10 | **Promesas que MOT-1 no cumple:** siete `-- MOT-1 reescribe este flujo` en `GameTable.jsx` (MOT-1 no toca la mesa) y Menú v1.6 sobre la mano vs IAS | `GameTable.jsx` (7 líneas) · `Menu_Utilidades_v1.6.md:93-97` |
| N-11 | **La sonda sigue en disco y quizá desplegada:** pública, sin JWT, con emisión Broadcast por `?b=1` | `sonda_mot1/index.ts:147-161` · `.gitignore:127-129` |
| N-12 | **Protegidos §7.1 fila E-4 dice lo contrario del código** sobre el `pot` | `Protegidos` §7.1 · `pozos.js:243` |

### e) Preguntas al rector

| # | Pregunta | Recomendación |
|---|---|---|
| 1 | Para sentarse en PvP: ¿saldo ≥ 5× (SQL) o saldo ≥ entrada (normativo)? ¿La Corta sigue en 15× o se alinea a 20×? | Saldo ≥ entrada y `entrada` en la identidad de la mesa, en 1d-ii; Corta en 15×, como está sellada |
| 2 | ¿Seis apuestas (SQL y cliente) o siete con 50 (normativo)? | Seis; se corrige Reglas §8 en 1a |
| 3 | ¿Qué es «reconciliación por mano» si la entrada ya salió de la billetera y `saldo_tras` no puede ser negativo? | La pila por asiento se reescribe en cada mano, en una transacción; la billetera solo se mueve al sentarse y al salir |
| 4 | C4 con una partida PvP viva: si abre otra mesa en otro teléfono, ¿qué pasa con su asiento? | Aplicar lo sellado: el asiento abandona, se retira por el reloj y cobra su pila al cerrar la mano; lo puesto en el pozo no vuelve |
| 5 | ¿El reloj de turno PvP se congela con la pestaña oculta? | No: manda el vencimiento del servidor. Si nadie reclama, la mesa espera. `useCongelado` queda solo para vs IAS |
| 6 | ¿`pozos.js` entra en Protegidos? | Sí, v1.9 en 1a |
