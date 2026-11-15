# AJILEI · MES-PvP · Sub-tanda 8 · Fase 0 (sonda) · Informe · v1.0

- **Ficha:** `AJILEI_MES-PvP_Sub8_Fase0_v1.0.md` · **Fecha:** 2026-11-14.
- **Árbol:** `main` = `origin/main` = `eaef6d4`. `git status` antes y después: solo `laminas/lm1/`, `lm2/` y `lm3/` sin seguimiento. Un solo worktree.
- **Qué se hizo:** solo lectura del repo y su historia. No se corrió vitest, PGlite, el arnés ni el control de las IAS: ninguna respuesta lo necesitó. Tres barridos de solo lectura (E; C y D; G2 y G3), con las citas que cuentan comprobadas a mano. La única escritura es este informe.
- **Abreviaturas:** las del Contrato (`mot1_dinero`, `v13_recarga`, `eco1a`, `rnk1a`, `cfg1e`…) y `sub7a` = `20261113150000_mespvp_sub7a_duracion_sala.sql`.

---

## Resumen

| Bloque | Qué hay hoy | Qué pide la 8 | Migración | Deploy | Toca la mesa contra las IAS |
|---|---|---|---|---|---|
| A · Puntos | La llamada al libro ya existe en `aplicar_efectos`, detrás del interruptor apagado. Es un **dato**, no código | Encenderlo (una línea SQL) y corregir la victoria entre personas, que hoy pinta puntos de la tabla de las IAS | No (se enciende con `interruptor_puntos_humanos(true)`) | No | **Sí**: `GameTable.jsx:532-534` |
| B · «Mano actual» | En PvP la entrada se ve y falla: «No se pudo consultar» | Una rama PvP de `consultar_mano` y el cableado del cliente | **Sí** | No | **Sí**: `GameTable.jsx:624-625` |
| C · GEN-1 | `?sala=` sienta. No hay ningún registro de invitación | Nada en la 8 | No | No | No |
| D · AMI-1 | `partida_asientos` sobrevive al cierre, pero no dice si alguien jugó una mano | Una columna, `manos`, si el rector la quiere ya | Solo si entra | No | No |
| E · Pausa 7/8 y 30 s | `reloj.js:60` y `esperas.js:74`. El cliente no tiene la regla | Dos líneas y sus pruebas | No | **Sí** | Por la letra, sí (`esperas.js` está en el grafo de `GameTable`). Sin coste aparte: A y B ya lo piden |
| F · Contrato | v1.4. Falta el texto del tope de 10 | v1.5 | — | — | — |
| G · Confirmaciones | Una partida por cuenta: hecho. Tapete y tono propios: sí. Topes: no atrapan los 250.000. `state.winner`: ya retirado | Nada que construir | — | — | — |

---

## A · Los puntos contra humanos

### A.1 · El interruptor

No es una constante del código: es **una fila de datos**.

| Pieza | Dónde | Qué hace |
|---|---|---|
| La columna | `mot1_dinero:1093-1097` | `ajustes_economia.puntos_humanos boolean not null default false` |
| El rastro | `mot1_dinero:1099-1112` | La tabla `interruptor_cambios` (antes, después, quién, cuándo), con RLS y sin políticas |
| La lectura | `mot1_dinero:1114-1116` | `puntos_humanos_encendidos()` lee la fila |
| El mando | `mot1_dinero:1118-1139` | `interruptor_puntos_humanos(p_encendido)` cambia la fila y anota el rastro. Devuelve `encendido`, `apagado`, `sin_cambio` o `valor_invalido`. Sin permiso para `anon` ni `authenticated`: solo desde el SQL Editor |
| La escritura de la línea | `mot1_dinero:1145-1167` | `anotar_puntos_humanos(sala, uid, mano, sentados, ajilei)`. Pone `origen 'humanos'`, `nivel` nulo, `puntos_base = sentados + 3` y `extra_ajilei(ajilei)`. Lleva `on conflict (origen, mesa_id, mano) do nothing`. Un `check` violado avisa con `warning` y no deshace la mano |
| La llamada | **`v13_recarga:113-121`** (la vigente). La de `mot1_dinero:1325-1334` quedó sustituida, porque `v13_recarga:85` redefine entera `aplicar_efectos` | En `mano_cerrada`, si está encendido, toma el `uid` del asiento `ganador` y anota |

**Para encenderlo no hace falta migración ni deploy.** Basta con `select public.interruptor_puntos_humanos(true);` en el SQL Editor, como la válvula de ECO-1d. Queda en `interruptor_cambios`. Recomendación en §P-3.

### A.2 · Cómo entra hoy una mano ganada

**Contra las IAS:**
- El cliente arma el fin de mano con `finDeMano` (`mesaIACore.js:186-195`): capa 0, `ruleN`, `handCount` y AJILEI.
- Lo manda por la cola de `control` a `informar_pila(p_mesa, p_seq, p_pila, p_fin_vivos, p_fin_gano, p_fin_mano, p_fin_ajilei)`.
- El servidor escribe la línea con `origen 'ias'`, `nivel = mesa.reto` y `puntos_reto_ia(reto)` (`rnk1a:440-447`).
- La sesión la pinta con `puntosDeMano` (`GameTable.jsx:532-534`; `lib/puntos.js:57-61`), que es espejo de la regla y nunca viaja al servidor (INV-65).

**Entre personas, ya construido así** (Contrato §7, «Puntos contra humanos»):
- Escribe **el árbitro, por dentro de `aplicar_efectos`**, en la misma transacción de `guardar_jugada` que las pilas. No hace falta una RPC propia.
- El árbitro emite `mano_cerrada { mano, ganador, sentados, ajilei, pilas }` en `cerrarMano` (`partida.js:228-238`):
  - `ganador` = `ganadorDeMano` = capa 0 (`ganador.js:12`);
  - `sentados` = `motor.handRules.ruleN`, congelado al barajar (Rankings v1.2 §2.3.3);
  - `ajilei` = `ajileiDe(cartas del ganador, handRules)` (`ganador.js:21-24`), que da 0 sin cinco cartas.
- La línea lleva `origen 'humanos'`, `mesa_id = sala_id` (`libro_puntos.mesa_id` va sin FK a propósito, `rnk1a:107`) y `mano = handCount`.
- Los `check` de la tabla ya imponen la regla (`rnk1a:126-140`): `puntos_base = sentados + 3` (de 5 a 8), `extra` 1 o 2, y 52 solo con 5 sentados.
- Cada línea suma al total por disparador (`rnk1a:250-274`), sin distinguir origen.

**No hay nada que escribir en el servidor.**

### A.3 · Los casos

| Caso | Qué dice Rankings v1.2 | Qué hace el código | Veredicto |
|---|---|---|---|
| **Pozo «partido»** | §2.1: ganar la mano es ganar la capa principal; una capa lateral o un sobrante no dan puntos | En AJILEI no hay pozo dividido. Cada capa tiene un solo ganador, y el empate lo rompe la cercanía a la Mano (`pozos.js:319-327`). El árbitro da los puntos al de la capa 0 (`ganador.js:12`; `partida.js:230`) | Un solo dueño por mano. Cubierto |
| **Todos se retiran** | §2.4.2: el AJILEI cuenta aunque los demás se retiren. §2.4.7 (H-7): sin cinco cartas no hay AJILEI | Por la ruta de los retiros, el último en pie es el único elegible de la capa 0 (`partida.js:650-651`). `ajileiDe` da 0 con menos de cinco cartas (`ganador.js:22`) | Cubierto |
| **El rival abandona** (C-8: abandonar es retirarse) | §2.3.2: los puntos se congelan al reparto | El abandonado pierde la elegibilidad y el que queda gana la capa 0 con el `ruleN` del reparto. En mesa de 3 con dos abandonos, el que queda se lleva 6 | Cubierto. Si todos se van a la vez, el más cercano a la Mano no se retira y cobra (Contrato §7); también puntúa |
| **Gana el sentado fuera** | — | No puede: en el motor va `eliminated` (no recibe cartas ni es elegible, `partida.js:36-38`). Tampoco cuenta en `ruleN`: una mesa de 3 con uno fuera da manos de 5 puntos, que es «sentados al barajar» | Imposible. Confirmado |
| **Ganador con la cuenta borrada** | §3, K-12 | `uid` nulo, y `if v_uid is not null` no anota (`v13_recarga:114-117`) | Bien |
| **La mano que cierra la partida (R2)** | — | `mano_cerrada` sale antes que la salida y el fin (`partida.js:242-244`, `:703-714`) | Puntúa |

No hace falta preguntar al rector: Rankings v1.2 cubre todos los casos.

### A.4 · El origen, y el sitio para NOC-1

- `origen in ('ias', 'humanos')` (`rnk1a:126`) **basta para distinguir IA de humano**.
- La «noche» de NOC-1 se puede derivar de `creado_en` (UTC; el día de Chicago se deriva como en ECO-1) sin columna nueva.
- Si NOC-1 necesita una marca explícita, **cabe como columna nueva con valor por defecto**: la tabla solo admite inserciones, y añadir una columna no viola la inmutabilidad.
- Una advertencia para NOC-1, sin construir nada: «puntos dobles» **no puede ir en `puntos_base`**, porque `libro_puntos_base_chk` obliga a `sentados + 3` (`rnk1a:135-140`). Tendría que ir en una columna aparte, y el disparador del total (`puntos_base + extra`, `rnk1a:250-274`) tendría que sumarla.

### A.5 · Lo que ve el jugador

- En la pantalla final entre personas, con `tono 'celebracion'`, se monta la **misma `PantallaVictoria`** que contra las IAS (`GameTable.jsx:995-999`, `:2540-2550`), con «Puntos obtenidos» y «Ver tu nuevo ranking». La derrota y el neutro van a `.game-over-screen` con la frase y la cifra (`:2573-2580`), sin puntos, igual que la derrota contra las IAS.
- **Defecto de hoy, ya en producción:** «Puntos obtenidos» suma `puntosMano`, que siempre se calcula con `origen: 'ias'` y `nivel: game.nivelIA` (`GameTable.jsx:532-534`). En PvP `nivelIA` no existe, así que cae al nivel por defecto, `basico` (`niveles.js:45, :75-77`). Resultado: **1 punto por mano ganada (+1/+2 por AJILEI), donde deberían ser 5–8.** Con el interruptor apagado, esa cifra tampoco está en el libro.
- **«Ver tu nuevo ranking» sale apagado en PvP.** `listoRanking = !!apiRanking && …` (`GameTable.jsx:1028`), y `PartidaPvP` no pasa `apiRanking` (`PartidaPvP.jsx:204-212`; App sí la tiene, `App.jsx:372`). Sin `control`, se encendería nada más montar. Es correcto: la última línea del libro se escribe en la misma transacción que el estado que trae `GAME_OVER`.
- **Arreglo:**
  1. `GameTable.jsx:532-534`: `origen: partida ? 'humanos' : 'ias'`. Toca `GameTable.jsx`, así que pide el control de las IAS. Contra las IAS es Δ0 por construcción.
  2. `App.jsx:1044` → `PartidaPvP` → `GameTable`: pasar `apiRanking`. Toca `PartidaPvP.jsx` y `App.jsx`, no la mesa contra las IAS.
- **Aspecto:** no cambia. Las mismas filas y el mismo botón, con otra cifra y encendido. No pide lámina.

### A.6 · Migración, deploy y control rojo

- **Migración:** ninguna. **Deploy:** ninguno. Encender es un dato en la nube.
- **Control rojo del servidor:** un guion nuevo en `supabase/pruebas/` (p. ej. `mespvp8_verificacion.sql`, declarado en `scripts/eco/guionesCore.mjs`) que, sobre PGlite:
  1. con el interruptor apagado, aplica `mano_cerrada {ganador 0, sentados 3, ajilei 51}` y exige 0 líneas (**rojo** si se pide 1);
  2. lo enciende, aplica lo mismo en la mano 2 y exige 1 línea con `origen 'humanos'`, `puntos_base 6` y `extra 1`;
  3. repite la mano 2 y sigue habiendo 1 línea (la doble escritura);
  4. con `ajilei 52` y `sentados 4` no escribe, pero la mano se guarda.

  Hoy no existe ningún guion de MOT-1 en `supabase/pruebas/`: el de la 1d-ii está comentado dentro de la migración (`mot1_dinero:1839+`).
- **Control rojo del cliente:** sacar el cálculo de `puntosMano` a una función pura (p. ej. en `sesionCore` o `lib/puntos`) con su vitest. Con `partida` y `ruleN 3`, el test exige 6 y hoy da 1: **rojo hoy, verde con el arreglo**.
- **En la nube, tras encenderlo:** `select * from interruptor_cambios order by en desc limit 1;` y, después de una mano del túnel, `select origen, sentados, puntos_base, extra, mano from libro_puntos where origen = 'humanos' order by creado_en desc;`.

---

## B · «Mano actual» entre personas

### B.1 · Cómo funciona contra las IAS

- **La RPC:** `consultar_mano(p_mesa uuid, p_mano integer)`, vigente en `mot1_dinero:82-171` (el cuerpo de `cfg1e` con el tope en `limite_dinero`). Pasos:
  1. Sesión.
  2. Tope: 30 por minuto (`limite_dinero('consultar_mano')`, `mot1_dinero:73`).
  3. Argumentos.
  4. La mesa: `mesas_ia` con `id = p_mesa`, `jugador_id = uid` y `estado = 'abierta'` (`:117-123`). Si no la encuentra, devuelve `mesa_invalida`.
  5. Bloquea la fila de `consultas`.
  6. Si es la última mano consultada, devuelve `repetida`.
  7. Gasta una gratis, si queda.
  8. Si no, cobra con `aplicar_movimiento(uid, 'consulta', −precio, 'consulta:<mesa>:<mano>', 'mesa_ia', …)` (`:149-153`).
- **Precio:** `precio_consulta(reto)`: 100, 200 o 300. `'humanos' → 500` ya existe, durmiente (`cfg1e:99-119`); el espejo es `PRECIOS_CONSULTA.humanos` (`config/consultas.js:15`).
- **Las 20 gratis:** `consultas.gratis_usadas` por **cuenta, de por vida**, sin depender de la mesa ni del aparato (`cfg1e:63-78`; `consultas_gratis()` en `:87`).
- **La mano no la lee el servidor.** El desglose lo calcula el cliente con sus propias cartas (`GameTable.jsx:742-750`, `getBestSuitScore` sobre `human.cards`). El servidor solo gasta o cobra.
- **El botón:** la entrada «Mano actual» del ⋮ (`UtilitiesMenu.jsx:263-284`), que se habilita con `hayManoConsultable` (`consultasCore.js:21-27`). La mesa la monta en `GameTable.jsx:624-625` con `mesaId = control?.mesaId` y el precio del `nivel`.

### B.2 · Qué pasa hoy en la mesa de personas: está roto

- `PartidaPvP` monta `GameTable` sin `control`, `apiConsulta`, `nivel` ni `onSaldo` (`PartidaPvP.jsx:204-212`). Por tanto `mesaServidor = null` (`GameTable.jsx:624`).
- La entrada **se ve y se habilita** en las fases de apuesta y descarte, sin etiqueta: `etiquetaConsulta` devuelve `null`.
- Al tocarla, `decidirConsulta` devuelve `'sin_mesa'` (`consultasCore.js:73`) y sale el aviso **«No se pudo consultar»** (`textos.es.js:406`). No llama al servidor.
- Si se llamara a `consultar_mano` con el id de una sala, devolvería `mesa_invalida`: solo mira `mesas_ia` (`mot1_dinero:117-123`).

### B.3 · Dónde está la mano en PvP, y los dos caminos

- **El estado del árbitro vive en una tabla, no en la memoria de la función:**
  - `partidas.estado` (jsonb, con el mazo y las cartas de todos; RLS sin políticas, fuera del cliente; `mot1_esquema:61-73`);
  - cada asiento tiene su vista en `partida_vistas` (`mot1_esquema:75-86`). El cliente ya tiene sus cartas por ahí.
- **Camino 1, recomendado: una rama SQL de `consultar_mano` (migración, sin deploy).**
  - Si `p_mesa` no es una mesa de IA abierta del que llama, se busca en `partida_asientos` con `sala_id = p_mesa`, `uid = uid` y `not cobrado`, y en `partidas` con `terminada_en is null`.
  - Se exige `p_mano = (partidas.estado -> 'motor' ->> 'handCount')::int`: por primera vez, la mano la dice el servidor y no el cliente (cierra para PvP el hueco declarado de INV-75).
  - Precio `precio_consulta('humanos')`.
  - **No lee ni devuelve cartas de nadie**: no le hace falta, porque el desglose sale de la vista propia.
  - La firma no cambia, y el cliente de hoy nunca la llama con una sala: sin ventana de incompatibilidad.
- **Camino 2: una acción nueva del árbitro (deploy).** Mueve dinero desde la función `partida`, que hoy solo mueve dinero por efectos. Abre el Contrato §2 y §3 y pide más prueba. No aporta nada que el camino 1 no dé.

### B.4 · El cobro: sirve casi tal cual, **con un cambio obligatorio en la clave**

- Sirven el mismo `aplicar_movimiento`, con el cerrojo de la billetera; el mismo tipo `consulta` (ya está en `movimientos_tipo_chk`); el mismo tope de 30 y la misma fila de `consultas` (`ultima_mesa` va sin FK: admite el id de la sala).
- **La clave no sirve tal cual.** `clave_idem` es **única en toda la tabla** (`eco1a:174`), y `'consulta:<mesa>:<mano>'` era única solo porque una mesa de IA tiene un único jugador. En una sala, dos jugadores que consultan la misma mano chocarían.
  - El segundo no recibe `repetido`: `movimiento_repetido` exige que el jugador sea el mismo (`eco1a:535-540`).
  - Vería un error, sin cobro.
- **La clave PvP tiene que llevar el uid:** `consulta:<sala>:<uid>:<mano>`, como `recarga_pvp:<sala>:<uid>:<mano>` (Contrato §7). La de las IAS se queda como está, para no romper la idempotencia de lo ya cobrado.
- `ref_tipo 'sala'` no altera los cuadres: `neto_mesa` y `neto_jugador_mesa` filtran por tipo (`v13_recarga:41-71`).

### B.5 · El cliente

| Cambio | Archivo | ¿Mesa contra las IAS? |
|---|---|---|
| `mesaServidor = control?.mesaId ?? partida?.salaId ?? null` y el precio de `'humanos'` cuando hay `partida` (el nombre exacto del id de sala en el objeto `partida` lo fija la tanda) | `GameTable.jsx:624-625` | **Sí**: control de las IAS. Contra las IAS es Δ0 (sin `partida`, las dos expresiones dan lo de hoy) |
| Pasar `apiConsulta` y `onSaldo` (la billetera toma el saldo devuelto, INV-46) | `PartidaPvP.jsx:204-212` · `App.jsx:1044` | No |
| El banco imitado responde a una sala | `src/dev/bancoImitado.js` | No (solo dev) |

- **Aspecto:** la entrada sigue en el mismo sitio, con el mismo texto y las mismas etiquetas que contra las IAS («N gratis» o «500 HC»). La ventana de confirmación reutiliza `ia.mesa.consulta.confirmar.texto` con `{hc}` = 500. **No cambia de sitio ni de texto: no pide lámina.**
- Victor tiene que decidir las condiciones (§P-1 y §P-2).

---

## C · El gancho de GEN-1

### C.1 · Qué hace hoy `?sala=`

- **Al cargar la página:** `recogerDeLaUrl()` lee el código, guarda solo `AJ-XXXX` en `localStorage['ajilei.salaPendiente']` y limpia la barra (`config/salaPendiente.js:135, :152-178, :52-65`). Lo llama el inicializador de `App.jsx:234-236`, con cualquier estado de sesión.
- **Sin cuenta:** Portada (`App.jsx:877-879`) y después Bautizo (`:881-883`). La Portada no menciona la invitación; el código sobrevive en el almacén, también entre pestañas (`salaPendiente.js:21-27`).
- **Con cuenta:**
  1. `consumirSalaPendiente()` (`App.jsx:622`) y luego `miSala()`. Si ya hay mesa, gana esa (`:627-631`).
  2. Si no, `SalaOpciones` hace un único `unirseSala({ codigo })` (`SalaOpciones.jsx:186-202`).
  3. `unirse_sala` (`mot1_dinero:672-798`) busca por código, con tope de 5 por minuto en `intentos_codigo` (`:707-717`). Una sala que ya no espera da `null`. Si no, cobra y sienta.
- **El enlace:** `https://ajilei.io/?sala=AJ-XXXX` (`salaEsperaCore.js:195-200`). Las abiertas no tienen código ni enlace.
- **SAL-B2:** E7 en verde con el enlace pegado en Chrome, pero no sienta desde el navegador incrustado del correo («deuda de la Portada»). E9 (iPhone sin cuenta) sigue pendiente (`AJILEI_SAL-B2_Cierre_v1.0.md:113, :132`).

### C.2 · Qué queda registrado de quién invitó a quién

**Nada.**
- `salas` guarda `anfitrion_id` y `codigo`.
- `sala_jugadores` no dice por qué vía entró cada uno.
- `intentos_codigo` solo guarda `jugador_id` y la hora, y se purga a la hora.
- El enlace es el código de la sala, no un token por invitado.
- Lo único que se infiere es que, en una privada, compartió el anfitrión.

### C.3 · Qué necesitará GEN-1 1d, y qué deja la 8

- **Falta** una tabla de invitaciones (quién, a quién, a qué sala, cuándo, en qué estado) y su lectura para NOT-1.
- **El repo no tiene la especificación** de GEN-1 1d ni de NOT-1: no aparecen «Revancha», «Trae a otro», «NOT-1» ni «Te retaron».
- **Recomendación: nada en la 8.** Una invitación vive en el SQL de salas y **nunca toca el árbitro**: la función `partida` no sabe de invitaciones. Añadirla en enero es una migración nueva que no reabre la función ni el Contrato §2–§7. Diseñarla hoy sin la especificación de NOT-1 obligaría a rehacerla.

---

## D · AMI-1

**`partida_asientos`** (`mot1_dinero:299-312`, con `ultimo_mensaje` de `v13_mensaje:21-22`):

- **Columnas:** `sala_id`, `asiento`, `uid` (con `on delete set null`), `entrada`, `pila`, `liberado`, `cobrado`, `abandono_pedido` y `ultimo_mensaje`.
- **Se inserta** una sola vez, en `crear_partida`, una fila por cada sentado al arrancar, **antes del sorteo** (`:1263-1265`).
- **Se actualiza** con:
  - `mano_cerrada` (pilas);
  - `salida` (`cobrado`, `liberado`);
  - `recarga`;
  - la partida muerta;
  - `abandono_pedido`.
- **Sobrevive al cierre:** `guardar_jugada` solo pone `terminada_en` (`:1429, :1461-1463`).

**¿Basta para «al menos una mano los dos sentados»? No.** Quien abandona durante el sorteo cobra en el acto (`arbitro.test.js:803-805`) y queda igual que quien jugó y salió con su pila. Nada registra cuántas manos jugó ni cuándo salió; la `salida` no lleva mano.

**La columna que falta:** `partida_asientos.manos smallint not null default 0`, que `mano_cerrada` sume en las filas `not cobrado`.
- Todos los asientos arrancan juntos, y en la mano 1 nadie puede estar sentado fuera.
- Por tanto, «los dos con `manos ≥ 1`» equivale exactamente a «jugaron juntos al menos una mano».
- Solo toca SQL: redefinir `aplicar_efectos` entera, como hizo `v13_recarga`. **No toca el árbitro.** §P-4.

**Aparte, para AMI-1 (sin arreglarlo aquí):** si el **anfitrión** borra su cuenta después de terminar, `salas.anfitrion_id on delete cascade` (`sal_a:90`) se lleva la sala, la partida y los `partida_asientos` de todos. Las líneas del libro de puntos sobreviven (`mesa_id` va sin FK).

---

## E · La pausa 7/8 y 30 s

### E.1 · Dónde vive

| Qué | Dónde |
|---|---|
| **La regla** | `src/arbitro/reloj.js:60`: `llevaAnuncio = (mano) => mano % 11 === 5 \|\| mano % 11 === 0`, con su comentario en `:59` |
| **Los 45 s** | `src/config/esperas.js:74`: `PAUSA_ANUNCIO_MS = 45000`. `reloj.js:8, :67` la reexporta como `ESPERA_PAUSA_ANUNCIO_MS` |
| Uso en el árbitro | `partida.js:324` (`llevaAnuncio(motor.handCount)`), `:336` (vencimiento), `:499-504` (`volverAnuncio`), `:614-615` (`cerrarPausa`) |
| `supabase/functions/partida/` | No tiene la regla. `nucleo.js:19-21` importa `src/arbitro/index.js` y la CLI lo empaqueta al desplegar: **cambia solo con el deploy** |
| Espejos del cliente | No hay ninguno con la regla: el cliente ve `vencimiento.clase === 'pausa_anuncio'` (`mesaPvPCore.js:58`; `PartidaPvP.jsx:214, :216`). `PAUSA_ANUNCIO_MS` se usa como tope de `timeLeft` (`mesaPvPCore.js:35, :43`) y como `TOTAL_SEG` de la burbuja (`entreManosCore.js:59`), que en el anuncio va sin anillo (`:111`) |
| Árbitro simulado | `partidaImitada.js` usa el árbitro real (`:23-25`). La escena `recarga-anuncio` fija las manos 4 y 5 (`:471-473`): pasan a 6 y 7. Las demás buscan la primera pausa y se adaptan solas |
| Pruebas | `esperas.test.js:99` (45000) y `:121-124` (la serie). `arbitro.test.js:866-1795`: unas 40 aserciones atadas a las manos 5 y 6, a 11 y 12, y a 45000. `mesaPvPCore.test.js:59` (45). `partidaImitada.test.js:31, :83` (`handCount === 5`) |
| Comentarios | `AnuncioPvP.jsx:9-10` («antes de las manos 6, 12, 17, 23… vencen 45 s») · `partidaImitada.js:478` |
| Documentos | Contrato `:367, :474, :479, :504` · Reglas v1.11 §8.6 `:663-665, :734` · Tienda v1.4 `:201, :204, :231-232, :256` (esta, con texto viejo: «manos 4, 8, 13…») · Invariantes: nada |

### E.2 · La semántica, confirmada

- `cerrarMano` no cambia el número (`partida.js:234`). Al vencer `MANO_SIGUIENTE`, `trasManoSiguiente` evalúa `llevaAnuncio(motor.handCount)` con la fase aún en `PAYOUT` (`:324`).
- Solo `startHand` suma uno (`gameEngine.js:598`), después de la pausa. Por tanto `mano` es **la que acaba de cerrarse**.
- Hoy: después de las manos 5, 11, 16, 22…, es decir, **antes de la 6 y de la 12**, que es lo que vio Victor.
- Con `mano % 15 ∈ {7, 0}`, en el mismo momento relativo: **después de las manos 7, 15, 22, 30, 37, 45, 52, 60…** (saltos de 8 y 7). Es la serie sellada, exacta.

### E.3 · El 30 s

- El cliente no tiene un 45 propio: importa la constante. No hay texto, anillo ni cuenta atrás que lo pinten.
- `AnuncioPvP.jsx:17-59` no muestra cuenta atrás, aunque **Tienda v1.4 §10.1 `:205` la pide**. Es una discrepancia anterior, fuera de la 8 (§R).

### E.4 · Qué pide

- **Deploy sí. Migración no.**
- **Control de las IAS:** por la letra, sí, porque `esperas.js` está en el grafo de `GameTable` (`GameTable.jsx:63` importa `TURN_TIME`), aunque el valor que cambia no lo lee ninguna ruta contra las IAS (`PAUSA_ANUNCIO_MS` solo la importan `reloj.js`, `mesaPvPCore.js` y `entreManosCore.js`). Como A y B ya tocan `GameTable.jsx`, no suma una corrida.
- **Ventana cliente–servidor:**
  - un cliente viejo con el servidor nuevo pinta `min(45, hora − ahora)`, que con 30 s da lo correcto;
  - un cliente nuevo con el servidor viejo tope a 30 lo que el servidor alarga a 45, pero no hay nada visible que lo cuente.

  Sin riesgo.
- **Control rojo:** reescribir `esperas.test.js:121-124` para que exija `[7, 15, 22, 30, 37, 45, 52, 60]` en las manos 1–60, y `:99` para que exija 30000. **Rojo hoy, verde con las dos líneas.**

---

## F · El Contrato v1.5 y el tope de 10 por minuto

### F.1 · El tope

- **Dónde está:** dentro de `cobrar_entrada` (`mot1_dinero:397-430`), que llaman `crear_sala` (`sub7a:113`) y `unirse_sala` (`mot1_dinero:778`).
- **Cómo cuenta:** `contar_intento_dinero(funcion, limite_dinero(funcion))`, con 10 para cada una (`mot1_dinero:71-72`). Es una ventana deslizante de un minuto, por cuenta y por función, en `intentos_dinero` (`eco1a:249-256, :361-390`).
- **Qué cuenta:**
  - solo las sentadas que salen bien: un `raise` posterior (`saldo_insuficiente`, `sala_llena`) deshace su propia anotación (`mot1_dinero:394-396`);
  - la reentrada de un miembro no cobra ni cuenta (`:740-742, :752-754`);
  - si `crear_sala` delega en una abierta compatible, cuenta como `unirse_sala` (`sub7a:86-88`).
- **Al superarlo:** `raise exception 'demasiados_intentos'` (P0001). No cobra nada.
- **Hay un segundo tope:** unirse **por código**, 5 por minuto en `intentos_codigo` (`mot1_dinero:707-717`), que lanza el mismo motivo.
- **El cliente** pinta los dos con `sal.error.demasiados_intentos`, **«Demasiados códigos seguidos. Espera un minuto y vuelve a probar.»** (`textos.es.js:258`). Para quien no tecleó ningún código, ese texto miente. Esa es la mitad pendiente de la fila del Contrato (`:616`, que cita `:251`; la clave está hoy en `:258`).

**Párrafo propuesto** para el Contrato §7, en la tabla «Qué debe cumplir la 1d-ii», a continuación de «Toda función que mueve dinero tiene su tope por minuto»:

> | El tope de las sentadas, v1.5 | `crear_sala` y `unirse_sala` cuentan cada sentada que cobra, dentro de `cobrar_entrada`: 10 por minuto y por cuenta, cada una con su nombre en `limite_dinero()`. Solo cuentan las que salen bien (un rechazo posterior deshace su anotación) y la reentrada de quien ya es miembro no cuenta. La undécima lanza `demasiados_intentos` y no cobra nada: un tope nunca atrapa dinero. Si `crear_sala` encuentra una abierta compatible, cuenta como `unirse_sala`. Unirse por código tiene además su tope de 5 por minuto (`intentos_codigo`), con el mismo motivo. El cliente dice los dos con una sola frase, que no habla de códigos: «Demasiados intentos seguidos. Espera un minuto y vuelve a probar.» | `mot1_dinero:397-430, :707-717` · `sub7a:86-88, :113` · `textos.es.js:258` |

El texto visible es de Victor (§P-5). Cambiarlo es solo cliente, sin migración.

### F.2 · Lo que recoge la v1.5

**La convención:** el mismo archivo, `AJILEI_MOT-1_Contrato_v1.0.md`. Se sube el número del título y se añade una línea «Al día con …» a la cabecera (`:3-15`), con lo que se despliega y el árbol de las citas nuevas.

**La v1.5:**
1. **La cabecera:** «Al día con MES-PvP, sub-tanda 8 (fecha): v1.5, la del árbitro que se despliega con ella, y la migración de la 8. Recoge la pausa 7/8 y 30 s (Reglas v1.12 §8.6), los puntos contra humanos encendidos, "Mano actual · Humanos 500" y el tope de las sentadas».
2. **Abreviaturas:** `sub7a` (falta hoy) y la migración de la 8.
3. **§6, «Publicidad»** (`:474, :479`) y **«Los vencimientos»** (`:367`): `mano % 15` es 7 o 0 (7, 15, 22, 30, 37, 45…) y 30 s. **§7** (`:504`): «no a los 30 s».
4. **§7, «Puntos contra humanos»:** «Interruptor: encendido el (fecha), rastro en `interruptor_cambios`». La llamada vive en `v13_recarga:113-121`.
5. **§7, «La billetera se mueve dos veces»:** una fila **«Al consultar la mano (v1.5)»** con `consulta`, −500 y la clave `consulta:<sala>:<uid>:<mano>`, y la regla de que no es dinero de la mesa.
6. **§7:** el párrafo del tope (F.1).
7. **§9:**
   - las filas `:625` y `:626` pasan a «Hecho: MES-PvP 8»;
   - la fila «Respaldo `state.winner`» (`:589`) también se cierra: ya se hizo (G.4);
   - las cuatro filas «hecho en la 7b» (`:613, :614, :616, :617`) y la de la 7a (`:615`) se consolidan en el molde de las de abajo («Hecho: MES-PvP 7a/7b», sin el relato).
8. **§9, fila «Las cifras provisionales del §6»** (`:627`), que el Contrato asigna a la 8: §P-6.

---

## G · Las cuatro confirmaciones

### G.1 · Una sola partida abierta, e INV-46

- **INV-46 no es esta regla.** Es «una sola cifra de saldo» (`Invariantes:86`), vigilada desde MES-PvP 3: el hueco de ECO-1e se cerró quitando el saldo de la partida. La regla de una partida abierta vive en el Contrato §7, «Una partida abierta por cuenta».
- **Los cruces, en el servidor:**
  - **Sentarse en PvP con una mesa contra las IAS abierta:** `cobrar_entrada` llama a `cerrar_partida_abierta('reemplazada')` (`mot1_dinero:411-413`), que cierra la mesa de las IAS y cobra `least(pila_informada, techo_cobro)` (`:846-866`).
  - **Abrir una mesa contra las IAS estando en la sala de espera:** `sentarse_ia` (`:965`) llama a `levantarse_de_sala`, que devuelve la entrada (`:828-832`).
  - **Abrir una mesa contra las IAS con una partida PvP viva:** `abandono_pedido = true` (`:836-842`). La función `partida` lo aplica en la siguiente llamada de cualquiera de la mesa, antes de la acción (`leer_partida`, `:1175-1186`; `nucleo.js:153-177`). Sin nadie que llame, la partida muerta cobra a todos a los 15 min.
  - **La misma cuenta en dos aparatos:** una sola vista por cuenta y sala (`unique (sala_id, uid)`, `mot1_esquema:82`). Los dos ven y juegan el mismo asiento, sin dinero duplicado. Sentarse en otra sala desde el segundo aparato es abandonar la primera.
- **El hueco:** en el servidor no queda ninguno (Sub5 Fase 0 §G, fila 4: «Hecho»). Lo que no está medido es qué ve el aparato viejo cuando su mesa de las IAS se cierra por debajo (su próximo `informar_pila` encuentra la mesa cerrada). Necesita el arnés o el teléfono, y no es de la 8.

### G.2 · Tapete y tono

- **Cada jugador ve los suyos, no los del anfitrión.** El canal único de `App` (`App.jsx:381-384`) lee `mi_inventario`, filtrado por `auth.uid()` (`tie1a:333-342`).
- Llega igual a `PartidaPvP` y a `GameTable` (`App.jsx:1044-1048` → `PartidaPvP.jsx:204-212`) que a la mesa contra las IAS (`App.jsx:1085`). `useTapeteEnMesa` lo pone en `<body>` (`GameTable.jsx:638`).
- Ni la vista del árbitro ni `salas` llevan tapete.
- **La sala de espera** no pinta tapete, y la fila «Tapetes» del ⚙ sale apagada (`SalaEspera.jsx:742-748`; INV-76).

### G.3 · Los topes de `limite_dinero()`

- **Lo que limita** (`mot1_dinero:62-78`, sin redefinición posterior): **intentos por minuto y por función**, nunca montos. Es una función `immutable` que solo recibe el nombre.
- **Llena de 5.000 = 250.000 HC:** pasa por `crear_sala` o `unirse_sala` → `cobrar_entrada`, con un intento de los 10. Lo único que mira el monto es `alcanza_entrada` (saldo más lo que devolvería la mesa de las IAS, `:375-386`) y `saldo_tras >= 0`. No hay saldo ni monto máximo, y la válvula de ECO-1d solo mira `sentarse_ia` y `recargar_ia`.
- **La recarga PvP y `guardar_jugada`** no pasan por ningún tope (`v13_recarga:150-172`; `mot1_dinero:26-27`; Contrato `:507`). El freno lo pone el árbitro.
- **Conclusión:** ningún tope legítimo se vuelve un bloqueo.

### G.4 · El respaldo `state.winner`

- Era `capa0 === undefined || capa0 < 0 ? state.winner : capa0` en `finDeMano` (M-1 de RNK-1 1b).
- **Ya se retiró en MOT-1b-b** (`16f7045`): hoy `finDeMano` usa solo la capa 0 (`mesaIACore.js:186-195`), y el árbitro, `ganadorDeMano` (`ganador.js:12`).
- La única lectura que queda es la de `resultadoDeMano` fuera del pago (`manoCore.js:166`): el fin de partida, donde `winner` es el último con fichas. Es legítima y no toca los puntos.
- **Veredicto:** no se retira nada más, ni en la 8 ni en la 9. Solo se cierra la fila del Contrato (`:589`, F.2).

---

## H · Corte y estimación

### H.1 · El corte

**Recomendación: una sola tanda con cinco commits (a–e) y un STOP-C**, no 8a/8b:

| Commit | Contenido |
|---|---|
| a · el árbitro | `reloj.js:60`, `esperas.js:74`, sus pruebas y `partidaImitada` |
| b · el SQL | La migración (la rama PvP de `consultar_mano`; `manos` si §P-4 dice sí) y el guion de PGlite |
| c · el cliente | `GameTable.jsx` (las dos líneas de A.5 y B.5), `PartidaPvP.jsx`, `App.jsx`, el texto del tope y el banco imitado |
| d · el arnés | Las escenas y las varas que cambian |
| e · documentos | Contrato v1.5, Reglas v1.12, Invariantes, informe |

**Por qué una sola:**
- El servidor y el cliente no tienen ventana de incompatibilidad que obligue a separarlos (B.3, E.4).
- El control de las IAS se paga una vez.
- Las dos mitades juntas suman menos que una tanda de la 7.

### H.2 · Los ojos de Victor

- **Nada cambia de aspecto. No hace falta lámina.**
- En el STOP-C, Victor tiene que ver:
  - el texto del tope (§P-5);
  - en el túnel: la cifra de «Puntos obtenidos», «Ver tu nuevo ranking» encendido, «Mano actual» cobrando 500 y la pausa después de la mano 7.

### H.3 · El paso a la nube

Commits → **migración** (`db push`) → **interruptor** (`select public.interruptor_puntos_humanos(true);`) → **deploy** de `partida` → **túnel** → **push**.

- La migración va primero: el cliente viejo no la nota.
- El interruptor, antes del túnel, para ver los puntos en la mano 1.
- El cliente nuevo solo llega con el push.

### H.4 · El control de las IAS

**Sí:**
- por `GameTable.jsx` (`:532-534`, `:624-625`);
- por la letra, por `esperas.js`.

No hace falta por `PartidaPvP.jsx`, `App.jsx`, `reloj.js`, `textos.es.js` ni la migración: ninguno está en la ruta contra las IAS. `textos.es.js` sí la monta, pero la clave nueva solo la leen las salas.

### H.5 · Estimación (minutos de Claude Code)

| Parte | Min |
|---|---|
| a · el árbitro y ~40 aserciones de `arbitro.test.js` | 35 |
| b · la migración y el guion de PGlite (+15 con `manos`) | 45 |
| c · el cliente y sus vitest rojos | 30 |
| d · el arnés (escenas y varas `pvp`) | 20 |
| e · documentos | 30 |
| **Comprimible** | **≈ 160** |
| Aislados (~13,5 min cada uno, uno a uno) | ~30 |
| Control de las IAS | ~20 |
| `diagDSK pvp` (no cabe en el tope de 10 min: la vía de PowerShell que espera a node) | ~15 |
| Migración + interruptor + deploy | ~15 |
| Túnel de Victor | ~20 |
| **No comprimible** | **≈ 100** |
| **Total** | **≈ 4 h 20 min** |

### H.6 · Documentos de la tanda

- **Reglas v1.12** a `docs/` (la adjunta Victor).
- **Contrato v1.5** (F.2).
- **Invariantes:**
  - INV-75 (el contador de «Mano actual» vive en el servidor): se extiende a PvP, y allí la mano la dice el servidor;
  - INV-65 (el cliente nunca manda una cifra de puntos): añadir la fuente PvP;
  - ninguna invariante nueva.
- **Tienda v1.4 §10.1:** la serie y el tope. Su línea `:256` está vieja. Si sube a v1.5, lo decide el rector.

---

## §P · Preguntas al rector

1. **¿Las 20 consultas gratis valen también entre personas, con el mismo contador?** Recomiendo **sí, el mismo contador por cuenta.** CFG-1 1e lo selló como «no hay dos economías» (`GameTable.jsx:617-622`), y un contador aparte pide otra columna y otra cifra que nadie ha sellado.
2. **¿Los 500 HC salen de la billetera, no de la pila, en mitad de la partida?** Recomiendo **sí, de la billetera, como contra las IAS.** La pila es dinero de la mesa, y tocarla dentro de una mano rompería «el dinero nunca se mueve dentro de una mano». El Contrato §7 lo escribe como el único movimiento que no es de la mesa, y sin saldo sale el aviso de siempre.
3. **¿Encender los puntos desde el SQL Editor o con una migración?** Recomiendo **el SQL Editor**, como la válvula: el mando se diseñó para eso, deja rastro en `interruptor_cambios` y se apaga sin otra migración. El guion de PGlite prueba el mecanismo; la fecha queda en el Contrato v1.5.
4. **AMI-1: ¿entra `partida_asientos.manos` en la 8?** Recomiendo **sí.** Va en la misma migración, cuesta unos 15 min y no toca el árbitro. Así cada partida de la ola grande deja el dato que AMI-1 necesita; si espera a enero, las partidas de hasta entonces no lo tendrán.
5. **El texto del tope.** Recomiendo «Demasiados intentos seguidos. Espera un minuto y vuelve a probar.» para los dos topes (código y sentadas). Es una frase, sin variables y sin migración, y deja de mentir a quien no tecleó un código.
6. **Las cifras provisionales del §6 (`esperas.js`), que el Contrato asigna a la 8 «con los teléfonos».** Recomiendo **dejarlas fuera de la 8**, salvo que Victor traiga ya medidas de los teléfonos. En ese caso viajan en el mismo deploy, sin migración.

---

## §R · Riesgos

- **La victoria entre personas pinta hoy, en producción, 1 punto por mano** (la tabla de las IAS, nivel Básico), y el libro está apagado. Encender el interruptor sin el commit c deja la cifra mal y el libro bien.
- **Con la clave de las IAS, dos jugadores de una sala que consultan la misma mano chocan** (`clave_idem` es única global). La clave PvP tiene que llevar el uid.
- **El anfitrión que borra su cuenta se lleva en cascada la sala, la partida y los `partida_asientos` de todos** (el historial de AMI-1). El libro de puntos sobrevive.
- **`unirse_sala` por id no mira el tipo** (`mot1_dinero:743-754`): quien conozca el uuid de una privada entra sin el código. Riesgo bajo (no se adivina un uuid), anterior a la 8.
- **Tienda v1.4 §10.1 pide una cuenta atrás en la tarjeta del anuncio que la pantalla no pinta.** Es anterior a la 8.
- **`arbitro.test.js` tiene unas 40 aserciones atadas a las manos 5 y 6**, y alguna partida larga que cruce la mano 7 puede cambiar sin que se vea en el título.
- **`diagDSK pvp` no cabe en el tope de 10 min de Bash:** se corre por la vía de PowerShell que espera a node.
- **E9 (iPhone sin cuenta por `?sala=`) sigue sin probar desde SAL-B2**, y GEN-1 la heredará.
- **El reloj del sistema de esta sesión daba horas incoherentes:** el tope de 75 min se respetó por el número de pasos, no por el reloj.
