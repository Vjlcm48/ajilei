# AJILEI · MOT-1 · Fase 1d-i · Informe · v1.0

- **Ficha:** `AJILEI_MOT-1_Fase1d-i_v1.0.md`. **Normativo:** `docs/AJILEI_MOT-1_Contrato_v1.0.md` (§1, §5, §9).
- **Base:** `118408d`. **Migración:** `supabase/migrations/20261104150000_mot1_esquema.sql`.
- **Duración hasta el STOP-1:** 13 min de reloj (14:45 → 14:58). Tope: 2 h.

**En tres líneas.** La migración da al árbitro dónde vivir y no mueve dinero. El cliente de hoy sigue llamando igual: no se tocó ningún archivo de `src/` ni de `scripts/`. Está aplicada, con los Grupos A y B en PASA y el PvP de hoy comprobado en el S25 (§5).

---

## 1 · Lo que lleva la migración

| Bloque | Qué crea o cambia |
|---|---|
| **a) La mesa** | Valor `terminada` en `sala_estado` · `check` con las siete apuestas · columnas `entrada` (`'corta'`/`'llena'`, default `'corta'`) y `ritmo` (`'normal'`/`'rapido'`, default `'normal'`) · índice parcial de tres columnas |
| | `crear_sala(p_tipo, p_jugadores, p_apuesta, p_entrada text default 'corta', p_ritmo text default 'normal') → salas`, con `drop` + `create`, una sola firma y los permisos repuestos. La búsqueda de «abrir» compara la entrada |
| **b) Partida y vistas** | `partidas` (`sala_id`, `estado`, `version`, `vencimiento`, `correspondencia`, `creada_en`, `actualizada_en`, `terminada_en`): RLS sin políticas, sin privilegios del cliente |
| | `partida_vistas` (`sala_id`, `asiento`, `uid`, `version`, `vista`): `authenticated` lee solo la suya. Las dos, fuera de `supabase_realtime` |
| **c) RPC, solo `service_role`** | `leer_partida(p_sala uuid) → table (estado, version, vencimiento, correspondencia)` |
| | `crear_partida(p_sala, p_estado, p_vencimiento, p_correspondencia, p_vistas) → jsonb` |
| | `guardar_jugada(p_sala, p_version_leida, p_estado, p_vencimiento, p_vistas, p_terminada boolean default false, p_efectos jsonb default '[]') → jsonb` |
| **d) El ciclo** | `barrer_salas`: cancela las `activa` sin fila de partida, fila a fila · `mi_sala`: primero la mesa en espera, luego la `activa` con partida · `unirse_sala`: sin cambios |
| **e) El canal** | `miembro_de_tema(p_tema, p_uid) → boolean` · política `partida_recibir` de `select` en `realtime.messages`, para `authenticated`, solo Broadcast. Sin política de emisión |

**Respuestas de las RPC.**

| RPC | Respuesta |
|---|---|
| `crear_partida` | `{ ok: true, creada, estado, version, vencimiento, correspondencia }` · `{ ok: false, motivo: 'sala_no_activa' \| 'asientos_distintos' }` |
| `guardar_jugada` | `{ ok: true, version }` · `{ ok: false, motivo: 'version_vieja' \| 'partida_terminada' \| 'sin_partida', version }` |

Lanzan solo los errores de quien llama, y se deshace todo: `estado_incoherente` y `vistas_incompletas`.

**`--dry-run`:** lista solo `20261104150000_mot1_esquema.sql`.

---

## 2 · Lo que el contrato no cubría y decidí

- **Nombres:** tablas `partidas` y `partida_vistas`; RPC `leer_partida`, `crear_partida` y `guardar_jugada`.
- **Versión nueva:** es la leída + 1 (contrato §2). `guardar_jugada` no la recibe, y rechaza un estado cuya `version` diga otra cosa.
- **Fin de la partida:** llega en `p_terminada`, que es `partidaTerminada(estado)`. El SQL no mira dentro del motor.
- **Correspondencia:** `{ "<uid>": índice }`. `crear_partida` la compara con la compactación de las sillas de ese momento, porque `salir_sala` puede vaciar una silla de una mesa `activa`.
- **Mesa con partida que ya no está `activa`:** `crear_partida` devuelve la que hay. Solo rechaza si no hay partida.
- **Vencimiento:** `timestamptz` o nulo; la clase vive en el estado. El árbitro lo da en ms y la 1e lo convierte.
- **Motivos internos:** `sala_no_activa`, `asientos_distintos` y `sin_partida` son para la Edge Function. No van a `CLAVES_ERROR` ni al §3.
- **Entrada o ritmo inválidos:** los rechaza el `check`. Un `raise` nuevo exigiría tocar `CLAVES_ERROR`, y el cliente de hoy no puede mandarlos.
- **Columna de más:** `terminada_en`, para no releer la sala en cada guardado.
- **`barrer_salas` fila a fila:** un solo `update` podría cancelar una mesa que acaba de arrancar, porque su `not exists` seguiría mirando la foto de antes del bloqueo.
- **`mi_sala`:** el asiento de la partida se busca en `partida_vistas`, no en `sala_jugadores`. Es el que reconoce el árbitro.
- **Una función de más:** `miembro_de_tema`, concedida a `authenticated` porque la política corre con ese rol. Compara como texto, así que un tema mal formado da «no» y no un error.
- **El `if to_regclass('realtime.messages')`:** el banco de `npm run guiones` no trae el esquema `realtime` y `scripts/` no se toca. Sin el `if`, la vara del commit daría rojo. En Supabase la tabla está, y A17 falla si la política no quedó.
- **«Borrados» en el Grupo B:** se deshacen con una excepción, no con `delete`. El `delete` dejaría la huella de los correos en `bonos_bienvenida` (`cfg1c:20`).
- **Permiso de `service_role` en `crear_sala`:** se concede a mano, porque el `drop` se lleva el que venía de los privilegios por defecto.

---

## 3 · Los dos choques con el contrato, y lo que decidió el rector

El rector aceptó el resto de lo decidido en el §2. Las dos decisiones ya están en el contrato.

**Choque 1 · ¿Quién prueba el cliente suscrito?** El contrato §5 decía «1d-i verifica con un cliente suscrito», y la ficha §2-e lo pasa a la 1e. En la 1d-i nadie emite y lo permitido no incluía suscribirse. **Decisión:** se prueba en la 1e, y el §5 lo dice.

**Choque 2 · El ritmo se puede leer.** El contrato §4 lo ponía en «lo que no sale nunca del servidor». La ficha lo pide como columna de `salas`, y de ahí sale:

- `crear_sala`, `unirse_sala`, `mi_sala`, `jugar_ya` y `resolver_sala` devuelven la fila entera;
- `leerSala` hace `select *`;
- la fila viaja por `postgres_changes`;
- las mesas abiertas en espera se pueden consultar directamente.

No sale en `salas_abiertas`, ni la pantalla lo pinta. Revocarlo por columna rompería el `select *` de `leerSala`. **Decisión:** el ritmo no es secreto. No se muestra en ninguna pantalla, y el §4 lo saca de la lista de lo que no sale del servidor.

---

## 4 · Pruebas antes del push

| Prueba | Resultado |
|---|---|
| Grupos A y B, sacados del texto de la migración, en PGlite 0.5.8 (Postgres 18.3), con un `realtime` imitado | **19/19 y 25/25 PASA** |
| La misma corrida sin esquema `realtime` | La migración aplica y A17 y A18 fallan, que es lo correcto: el `if` no esconde la falta de la política |
| Política del canal, con lo que hace Realtime (fila de prueba y `select` con rol y tema) | Miembro lee Broadcast; no lee Presence; un ajeno no lee; un tema mal formado no da error; nadie emite |
| Rotura a propósito, 27 cambios en la migración | **26 cazados.** Sobrevive quitar el `grant` de `crear_sala`, que equivale a los privilegios por defecto; si faltara el permiso, A14 falla |
| `npm run guiones` | **VERDE**, 16 migraciones, 9 guiones × 2 pasadas |
| `vitest` de `scripts/eco`, `salasApi` y `salas` | 80/80 |

**Lo que el banco no podía medir:**

- **Concurrencia real:** dos versiones a la vez y `crear_partida` contra `barrer_salas` piden dos conexiones, y PGlite tiene una. Está razonada, y sigue sin medir.
- **La recepción real del canal:** se prueba en la 1e (§3).
- **La llamada por PostgREST y el permiso para crear la política en `realtime.messages`:** los despejó la corrida real (§5).
- **Postgres:** el banco va en 18.3 y Supabase en 17.6.1 (diferencia conocida, Invariantes §6).

---

## 5 · Resultados de Victor

| Paso | Resultado |
|---|---|
| `npx supabase db push --linked` | Aplicada (`Finished`). `migration list --linked` la da en local y en remoto |
| Grupo A en el SQL Editor | **19/19 PASA**, con A17 y A18: la política de `realtime.messages` quedó creada y nadie emite |
| Grupo B en el SQL Editor | **25/25 PASA**, sin fila `X` |
| S25 en ajilei.io: armar mesa privada, sala de espera y salir | Todo como siempre |

---

## 6 · Nota para la 1d-ii

**Lo que queda preparado en `guardar_jugada`.**

| Parámetro | Hoy | En la 1d-ii |
|---|---|---|
| `p_efectos jsonb default '[]'` | Se acepta y se ignora | Los `efectos` del árbitro, tal cual: `mano_cerrada` (`mano`, `ganador`, `sentados`, `ajilei`, `pilas`) y `salida`. Se aplican dentro de la misma transacción, con `create or replace` y sin cambiar la firma |
| `p_terminada boolean default false` | Pasa la sala a `terminada` y fija `terminada_en` | Sin cambios |

**Dónde guardar las pilas de la última mano cerrada.** Recomiendo una columna nueva, `partidas.pilas bigint[]`, indexada como `players[i]`:

- está en una tabla que el cliente no lee y fuera de la publicación;
- se reescribe en la misma fila y la misma transacción que el estado;
- `crear_partida` puede sembrarla sin parámetro nuevo: `ENTRADAS[entrada] × apuesta` en cada asiento, con `salas.entrada` y `salas.apuesta`;
- la partida muerta la lee sin abrir el `jsonb` del árbitro.

No debe ir en `sala_jugadores`: esa tabla se difunde por Realtime y la lee el cliente.

**Lo que la 1d-ii debe tener en cuenta:**

- **Partida muerta:** `partidas.actualizada_en` cambia con cada versión. Es la hora que mira el cierre a los 15 min. Lo escribe `barrer_salas`, en el mismo bloque que ya salta las mesas con partida.
- **`salir_sala` con partida viva:** hoy un invitado que la llame en una mesa `activa` borra su silla de `sala_jugadores`, y con ella su acceso al canal. La partida y su vista siguen. Hay que cortarlo junto con la devolución de la entrada.
- **`mi_sala` y el asiento abandonado:** hoy devuelve la mesa aunque su asiento esté abandonado, porque ese dato vive en el estado del árbitro. Hay que resolverlo cuando exista la pieza del abandono (contrato §7).
- **Salida fuera de un cierre:** debe poner a 0 la pila de ese asiento en la misma transacción (aviso de la 1b).

**Para MES-PvP:** `salas_abiertas` no devuelve `entrada`. Hasta que existan mesas llenas no se nota; luego dos mesas de la misma combinación se verían iguales en el listado.
