# AJILEI · SAL-B2 · Fase 0 · Informe · v1.0
## Diagnóstico de solo lectura para la `SalaEspera` real (SAL-3 v1.5) con Realtime

**Ficha:** `AJILEI_SAL-B2_Fase0_v1.0.md`. **Autoridad visual:** `AJILEI_SAL3_lamina_v1.5.html` (sellada 11-sep-2026).
**Punto de partida:** `main` en `e037db0` (SAL-B1f, 2026-09-11). **Fecha del diagnóstico:** 2026-09-11.
**Regla de esta fase:** solo lectura. No se creó ni editó nada fuera de este archivo; no se escribió SQL; no se tocó Supabase remoto.

Convención de citas: `archivo:línea`. Las tres migraciones se abrevian **SAL-A** (`supabase/migrations/20260905203158_sal_a_salas.sql`), **A1** (`…20260911043500_sal_b1_ajuste.sql`) y **A3** (`…20260911103000_sal_b1_ajuste_a3.sql`); **SUP-2a** es `0001_sup2a_identidad.sql`.

---

## 7.1 · Estado del árbol

```
$ git rev-parse --short HEAD
e037db0
$ git status --short
?? _probeA1.mjs
?? _shotA1.mjs
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

Los seis sin seguimiento son exactamente los residuos conocidos de la ficha §7.1 (`laminas/mon1/*` son tres archivos, más `scripts/_cel1bFila.mjs`, `_probeA1.mjs` y `_shotA1.mjs`). Ninguno lo produjo esta fase.

**Protegidos intactos.** `git diff e037db0 --stat -- src/engine/gameEngine.js src/engine/aiPlayer.js src/config/seatLayouts.js src/styles/opponentPanel.css src/styles/gameTable.css` devolvió vacío. Ninguno de los cinco se abrió; no hizo falta.

**Nota sobre los rectores.** `docs/` no contiene ningún rector `AJILEI_SAL*` (solo `docs/reportes/` tiene los informes de SAL-A y SAL-B1). Las fichas viven fuera del repo, como adjuntos de Victor. Donde este informe cita «el rector de B1», la fuente verificable es `docs/reportes/AJILEI_SAL-B1_Fase1_Informe_v1.0.md` y `…_Cierre_v1.0.md`.

---

## 7.2 · Supabase

### 2.1 · Tablas

Dos enumeraciones (SAL-A:63 y :67):

| Tipo | Valores |
|---|---|
| `public.sala_tipo` | `'privada'`, `'abierta'` |
| `public.sala_estado` | `'esperando'`, `'activa'`, `'cancelada'` |

Son **enum**, no `check` ni texto libre. SAL-A:52-58 declara que no existe `'terminada'`: eso es de MES-PvP.

**`public.salas`** (SAL-A:79-118):

| Columna | Tipo | Nulable | Default / restricción |
|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()`, PK |
| `codigo` | `text` | sí | `unique`; `check codigo ~ '^AJ-[A-HJ-NP-Z2-9]{4}$'`; `(tipo='privada') = (codigo is not null)` |
| `tipo` | `sala_tipo` | no | — |
| `jugadores` | `smallint` | no | `check between 2 and 5` |
| `apuesta` | `integer` | no | `check in (100,200,500,1000,2000,5000)` |
| `anfitrion_id` | `uuid` | no | FK `profiles(id) on delete cascade` |
| `estado` | `sala_estado` | no | `'esperando'` |
| `creada_en` | `timestamptz` | no | `now()` |
| `expira_en` | `timestamptz` | no | `now() + interval '3 minutes'` (SAL-A:97) |
| `iniciada_en` | `timestamptz` | sí | — |
| `estado_partida` | `jsonb` | sí | **existe y se queda en `null`** (SAL-A:104). Es la columna que MES-PvP usará; A1:119 ya la lee como predicado de «sin partida». |

Índices: `salas_abierta_unica_idx` único parcial sobre `(jugadores, apuesta) where tipo='abierta' and estado='esperando'` (SAL-A:131) y `salas_estado_expira_idx` (SAL-A:138).

**`public.sala_jugadores`** (SAL-A:147-157):

| Columna | Tipo | Nulable | Default / restricción |
|---|---|---|---|
| `sala_id` | `uuid` | no | FK `salas(id) on delete cascade` |
| `jugador_id` | `uuid` | no | FK `profiles(id) on delete cascade` |
| `asiento` | `smallint` | no | `check between 0 and 4` |
| `sentado_en` | `timestamptz` | no | `now()` |

PK `(sala_id, jugador_id)`; `unique (sala_id, asiento)`. **No hay columna de username ni de nada de partida.**

`public.intentos_codigo` (SAL-A:184) no interesa a la sala de espera.

### 2.2 · Inventario de funciones RPC y definición vigente

| Función | Argumentos | `returns` | `security definer` | Versión vigente |
|---|---|---|---|---|
| `es_miembro` | `(p_sala uuid, p_uid uuid)` | `boolean` | sí | SAL-A:225 |
| `es_sala_publica` | `(p_sala uuid)` | `boolean` | sí | SAL-A:238 |
| `regla_asiento` | `()` | `smallint` | no (immutable) | SAL-A:285 |
| `ahora` | `()` | `timestamptz` | no | SAL-A:300 |
| `saldo_de` | `(p_uid uuid)` | `integer` | sí | SAL-A:315 (constante 5000) |
| `barrer_salas` | `()` | `void` | sí | **A1:93** (reemplaza SAL-A:343; añade la rama `activa` → `cancelada`) |
| `resolver_sala` | `(p_sala uuid)` | `public.salas` | sí | SAL-A:370 (sin cambios) |
| `crear_sala` | `(p_tipo sala_tipo, p_jugadores smallint, p_apuesta integer)` | `public.salas` | sí | **A1:128** (una línea: la guarda «ya en mesa» pasa por `sala_esperando_de`) |
| `unirse_sala` | `(p_codigo text default null, p_sala uuid default null)` | `public.salas` | sí | **A3:25** (reemplaza A1:233, que reemplazó SAL-A:507) |
| `salir_sala` | `(p_sala uuid)` | `void` | sí | SAL-A:632 (sin cambios) |
| `jugar_ya` | `(p_sala uuid)` | `public.salas` | sí | SAL-A:663 (sin cambios) |
| `salas_abiertas` | `()` | `table (id uuid, jugadores smallint, apuesta integer, sentados bigint, expira_en timestamptz)` | sí | SAL-A:709 (sin cambios) |
| `mi_sala` | `()` | `public.salas` | sí | **A1:346** (solo `'esperando'`, vía `sala_esperando_de`) |
| `sala_esperando_de` | `(p_uid uuid)` | `uuid` | sí | **A1:55** (nueva; interna, revocada a `authenticated` en A1:76) |

Trece de SAL-A más una de A1: catorce en total. Permisos (SAL-A:804-827): `authenticated` puede ejecutar `ahora`, `es_miembro`, `es_sala_publica`, `resolver_sala`, `crear_sala`, `unirse_sala`, `salir_sala`, `jugar_ya`, `salas_abiertas`, `mi_sala`. Revocadas a todos: `regla_asiento`, `saldo_de`, `barrer_salas`, `sala_esperando_de`. `anon` no ejecuta ninguna. `create or replace` conserva grants (A1:8-11).

**El barrido.** Nombre exacto: `public.barrer_salas()`. **No hay `pg_cron`** (SAL-A:328-335 lo declara). Lo disparan `crear_sala` (A1:150), `unirse_sala` (A3:46), `salas_abiertas` (SAL-A:720) y `mi_sala` (A1:360). Para **una** sala, el cliente llama a `resolver_sala(p_sala)` cuando su cronómetro toca cero (SAL-A:366-369); `salasApi.resolverSala` ya existe (`src/lib/salasApi.js:181`).

**`jugar_ya`** (SAL-A:663-698): exige `auth.uid()`, que la fila exista, que el llamante sea `anfitrion_id` (`no_eres_anfitrion`), `estado='esperando'` (`sala_no_disponible`) y `count(*) >= 2` (`faltan_jugadores`). Escribe `estado='activa', iniciada_en=now()` y **devuelve la fila actualizada**. No crea `estado_partida`.

### 2.3 · El username

**Dónde vive:** `public.profiles.username` (`text not null`, SUP-2a:31), con `id` = `auth.users.id` (SUP-2a:30). No hay tabla `usuarios`; `raw_user_meta_data` no se usa.

**¿Alguna RPC lo devuelve para otro jugador?** No. Ninguna de las catorce lee `profiles` (verificado leyendo las tres migraciones; el único `join` a `profiles` es la FK). `mi_sala()` devuelve `anfitrion_id`, un uuid.

**RLS de `profiles`** (SUP-2a:184-187):

```sql
create policy profiles_select_autenticados
  on public.profiles for select
  to authenticated
  using (true);
```

**Todo autenticado lee todos los perfiles.** El comentario de SUP-2a:182-183 lo justifica: «los rivales tienen que verte el nombre en la mesa».

**Corrección a un hecho de B1.** El informe de B1 (`docs/reportes/AJILEI_SAL-B1_Fase1_Informe_v1.0.md:214`) y el stub (`src/screens/SalaEspera.jsx:36`) afirman que «`profiles` tampoco es legible para un tercero por RLS». **Es falso**: la política es `using (true)`. Lo que sí era cierto es que ninguna RPC traduce el uuid. La consecuencia para B2 es grande: **no hace falta función `security definer`** para los asientos. Un miembro puede hacer, desde el SDK:

```
from('sala_jugadores').select('asiento, jugador_id, profiles(username)').eq('sala_id', <id>)
```

porque `sala_jugadores_select_visibles` (SAL-A:268-274) le deja ver los asientos de su sala (`es_miembro`) o de una abierta que espera (`es_sala_publica`), y la incrustación `profiles(username)` la resuelve PostgREST por la FK `sala_jugadores.jugador_id → profiles(id)` (SAL-A:149) bajo la política `using (true)`. Es el mismo camino que `contarSentados` ya usa sin SQL (`salasApi.js:200-217`). Queda planteado como decisión en §7.7-1 con recomendación.

### 2.4 · `expira_en`

- Tipo `timestamptz`, `not null`, default `now() + interval '3 minutes'` (SAL-A:97). Lo escribe el `insert` de `crear_sala` por defecto (A1:179-181 y :189-191 no lo mencionan: cae al default).
- **Nadie lo mueve.** `unirse_sala` vigente (A3:25-135) no contiene ningún `update … expira_en`; inserta el asiento (A3:130-131) y devuelve la fila. `salir_sala` (SAL-A:632-657) solo marca `cancelada` o borra la silla. Búsqueda `grep -n expira_en` en las tres migraciones: aparece en el default, en el índice, en los `where … expira_en <= now()` del barrido y de las guardas, en `coalesce(iniciada_en, expira_en)` de A1:120 y en los `update` de las pruebas comentadas. **No existe la lógica de mesa llena (adelantar / restituir).** Va a §7.4.
- **Cliente:** `src/config/salas.js:129` tiene `DURACION_SALA_SEG = 180`. **No hay constante de cuenta atrás corta** (`grep -rn "LLENA" src/config` vacío). La lámina la llama `LLENA_S = 10` y anota «constante en salas.js, no en SQL» (lámina, bloque de datos); ver §7.7-5 sobre dónde debe vivir la cifra.
- **Cómo viaja:** la fila de `salas` llega por PostgREST con `expira_en` como cadena ISO con zona (`timestamptz` → `"2026-09-11T…+00:00"`). `salasApi` no la transforma (`mesaOpcional`, `salasApi.js:123-127`, devuelve la fila cruda); `normalizarMesa` en `src/screens/salasCore.js:100` la copia tal cual a `expiraEn` para el listado. `relojCore.restante(expiraEn, ahora)` acepta esa cadena (`src/hooks/relojCore.js:105-109`, vía `new Date(valor).getTime()` en :73-76).

### 2.5 · Transiciones de `estado`

| De → a | Quién | Condición exacta | Fuente |
|---|---|---|---|
| `esperando → activa` | `jugar_ya` | llamante = `anfitrion_id`, `estado='esperando'`, `count(*) >= 2` | SAL-A:663-698 |
| `esperando → activa` | `barrer_salas` | `expira_en <= now()` y `sentados >= 2`; escribe `iniciada_en = now()` | A1:100-112 |
| `esperando → activa` | `resolver_sala` | lo mismo para una sala, con `for update` | SAL-A:370-397 |
| `esperando → activa` | «mesa llena» | **no existe** | — |
| `esperando → cancelada` | `salir_sala` (anfitrión) | `anfitrion_id = auth.uid()` y `estado='esperando'` | SAL-A:651-652 |
| `esperando → cancelada` | `barrer_salas` / `resolver_sala` | `expira_en <= now()` y `sentados < 2` | A1:107-108; SAL-A:390-394 |
| `activa → cancelada` | `barrer_salas` (provisional hasta MES-PvP) | `estado_partida is null` y `coalesce(iniciada_en, expira_en) <= now() - interval '10 minutes'` | A1:114-120 |
| `cancelada → *`, `activa → esperando` | nadie | — | — |

**Las sillas al salir.** El anfitrión que sale **no borra** ninguna fila de `sala_jugadores`: solo `update public.salas set estado='cancelada'` (SAL-A:652). El invitado que sale **sí borra la suya** (SAL-A:654). SAL-A:626-631 lo declara como diseño para Realtime («la fila no se borra: se marca»), y A3:9-14 lo confirma como el hecho que motivó ese ajuste.

**Cómo lo ve hoy el invitado.** Solo por sondeo: el stub relee `mi_sala()` y, como desde A1 devuelve `null` para todo lo que no sea `'esperando'`, el stub marca `estado:'cancelada'` a ciegas (`SalaEspera.jsx:88-93`) y pinta «La mesa arrancó». **`mi_sala()` no distingue `cancelada` de `activa`.** Para los tres finales de la lámina hacen falta datos que hoy sí están al alcance sin SQL: (a) el `UPDATE` de `salas` por Realtime trae `new.estado`; (b) un `from('salas').select('estado').eq('id', …)` directo lo permite `salas_select_visibles` (SAL-A:257-264: miembro ve su sala «en el estado que sea»); (c) `resolver_sala` devuelve la fila resuelta al llegar a cero (`activa` si ≥ 2, `cancelada` si no), que es exactamente «vencida» contra «arranca».

### 2.6 · Realtime

- **Publicación: ya está.** SAL-A:846-865 añade `public.salas` y `public.sala_jugadores` a `supabase_realtime` con guarda de existencia. `intentos_codigo` no entra (SAL-A:867-869). El informe de SAL-A lo verificó tras el push contra `pg_publication_tables` (`docs/reportes/AJILEI_SALA_Fase1_Informe_v1.0.md:21,72,144`).
- **`replica identity full`: ya está** en las dos tablas (SAL-A:205-206). Los `DELETE` de `sala_jugadores` viajan con `sala_id`, `jugador_id` y `asiento`.
- **RLS de lectura que Realtime respeta:** `salas_select_visibles` (SAL-A:257-264): `(estado='esperando' and tipo='abierta') or es_miembro(id, auth.uid())`. `sala_jugadores_select_visibles` (SAL-A:268-274): `es_miembro(sala_id, auth.uid()) or es_sala_publica(sala_id)`. Un miembro recibe los `INSERT`/`UPDATE` de su `salas` en cualquier estado (incluidos `cancelada` y `activa`, porque su fila de `sala_jugadores` no se borra) y los de `sala_jugadores` de su mesa. **No hace falta política nueva.**
- **Matiz a verificar con dos teléfonos** (no medible aquí): según la documentación de Postgres Changes de Supabase, los eventos `DELETE` no pasan por RLS porque la fila ya no existe; sí pasan por el filtro del canal (`sala_id=eq.<id>`) gracias a la identidad completa. Consecuencia práctica nula: el invitado que se levanta baja su canal al salir.
- **Lo que el cliente ya tiene:** `suscribirSala(salaId, onCambio)` en `salasApi.js:232-243` abre `channel('sala:<id>')` con dos `postgres_changes` filtrados (`salas` por `id=eq.`, `sala_jugadores` por `sala_id=eq.`) y devuelve la función de baja. **Cero consumidores en pantallas**: `grep -rn "suscribirSala\|suscribirAbiertas\|\.channel(" src` solo encuentra `salasApi.js`, su test y el mock de fixtures. Realtime nunca se ha ejercido de punta a punta (SAL-A:882-884 lo difería «a SAL-B con dos teléfonos»).
- **Lo que el evento no trae:** un `INSERT` en `sala_jugadores` llega con `asiento` y `jugador_id`, **sin username**. La pantalla tendrá que releer los asientos (la consulta de §2.3) al recibir cualquier evento, que es el mismo contrato «algo cambió, vuelve a pedir» que `suscribirAbiertas` ya adopta (`salasApi.js:245-257`).

### 2.7 · `salas_abiertas()`

`where` vigente (SAL-A:727-731):

```sql
     where s.tipo = 'abierta' and s.estado = 'esperando'
     order by (select count(*) from public.sala_jugadores j where j.sala_id = s.id) desc,
              s.apuesta asc;
```

Devuelve `sentados` (`count(*)`, SAL-A:713 y :725) pero **no excluye las mesas con todas las sillas ocupadas**. Hoy es inocuo porque una mesa llena sigue esperando hasta tres minutos y «Unirme» rebota con `sala_llena` (A3:121-124). Con la regla de mesa llena de B2 (arranque en ~10 s) el hueco se cierra casi solo, pero la lámina pide no listarlas: va a §7.4.

Visto de paso en la misma consulta: `crear_sala` en modo abierta (A1:161-170) se une a la existente de la combinación **aunque esté llena**, y entonces `unirse_sala` lanza `sala_llena`; el índice parcial impide crear una segunda mientras la llena espera. Con el arranque en 10 s la ventana se reduce a esos segundos. Se anota en §7.6.

---

## 7.3 · Cliente

### 3.1 · `src/lib/salasApi.js`

Exportaciones: `CLAVES_ERROR` (:44), `ERROR_INESPERADO` (:61), `esMesa` (:80), `crearSalasApi` (:111), `salasApi` (:270), `CLAVE_TEXTO_DESCONOCIDO` (:292), `claveDeError` (:305). Métodos de la API y forma que devuelven (todos `{ data, error }` con `error` clave o `null`):

| Método | Línea | Devuelve `data` |
|---|---|---|
| `ahora()` | :131 | timestamptz ISO |
| `crearSala(tipo, jugadores, apuesta)` | :139 | fila de `salas` o `null` (vía `mesaOpcional`) |
| `unirseSala({codigo, salaId})` | :164 | fila o `null`; por código, `null` se traduce a `error:'codigo_invalido'` |
| `salirSala(salaId)` | :171 | `null` |
| `jugarYa(salaId)` | :174 | fila actualizada (`mesaOpcional`) |
| `resolverSala(salaId)` | :181 | fila resuelta (`mesaOpcional`) |
| `salasAbiertas()` | :184 | array de `{id, jugadores, apuesta, sentados, expira_en}` |
| `miSala()` | :187 | fila o `null` (`mesaOpcional`) |
| `contarSentados(salaId)` | :210 | número (`head:true, count:'exact'`) |
| `suscribirSala(salaId, onCambio)` | :232 | función de baja; `onCambio({tabla, evento})` |
| `suscribirAbiertas(onCambio)` | :258 | función de baja; `onCambio()` sin payload |

`esMesa` / `mesaOpcional` normalizan **las cinco** RPC que devuelven `public.salas` (:114-127): `crear_sala`, `unirse_sala`, `jugar_ya`, `resolver_sala`, `mi_sala`. `expira_en` **no se traduce**: llega como cadena ISO y así se queda en la fila (no hay `expiraEn` en esta capa). **No existe función para leer los miembros** de una sala con nombre; solo `contarSentados`.

### 3.2 · `src/screens/salasCore.js`

(No está en `src/lib/`; vive en `src/screens/`.) Funciones puras: `LARGO_CODIGO = 4` (:37), `filtrarCodigo` (:39), `codigoListo` (:50), `alcanza` (:61), `faltanPara` (:71), `normalizarMesa` (:94), `ordenarMesas` (:104), `buscarCombinacion` (:122), `otraMesaAlAlcance` (:135), `CONFIG_POR_DEFECTO` (:147), `TIPOS_SALA` (:149), `normalizarConfig` (:170), `fueraDelAlcanceDeNuevos` (:196), `arranqueDeSesion` (:221). **`decidirArranque` no existe** (`grep -rn decidirArranque src` vacío; solo lo mencionan `docs/reportes/AJILEI_SAL-B1_AjusteA3_Fase0_Informe_v1.0.md:154` y el cierre :48). La máscara canónica del código (`normalizarCodigo`, alfabeto, `CODIGO_REGEX`) vive en `src/config/salas.js:82-121`.

### 3.3 · `src/config/salas.js`

`APUESTAS_PVP` (:37), `BONO_BIENVENIDA = 1200` (:41), `REGLA_ASIENTO = 5` (:48), `saldoMinimo` (:51), `apuestasAlAlcance` (:60), `ALCANCE_NUEVOS` (:68), `ALFABETO_CODIGO` (:82), `CODIGO_REGEX` (:86), `normalizarCodigo` (:102), **`DURACION_SALA_SEG = 180`** (:129), `JUGADORES_PVP` (:138), `CLAVE_CONFIG_SALA` (:157), **`ACTIVA_SIN_PARTIDA_MIN = 10`** (:177). El límite de intentos (5/min) **no** tiene constante en cliente: vive solo en SQL (A3:65-70). **No hay constante de cuenta atrás corta.**

### 3.4 · `src/config/salaPendiente.js` y `recogerDeLaUrl()`

- Parámetro: `PARAM_SALA = 'sala'` (:135) → **`?sala=`**.
- Formatos: todo lo que `normalizarCodigo` acepte (`salas.js:102-121`): `AJ-7K2M`, `AJ7K2M`, `aj 7k2m`, `7K2M`; rechaza O/0/I/1 y cualquier otra longitud.
- `recogerDeLaUrl()` (:152-178): lee el parámetro, lo **guarda normalizado** en `localStorage['ajilei.salaPendiente']` (`guardar`, :52), y **limpia la barra con `history.replaceState`** (:165-171) reconstruyendo `pathname + search + hash`. No consume.
- Consumo: `consumir()` (:123) = `leer()` + `borrar()`, llamado en `App.jsx:243` dentro del efecto de arranque, antes de `mi_sala()`.
- **Lo que «Compartir» debe emitir:** `https://ajilei.io/?sala=AJ-XXXX`, exactamente la clave `sal.espera.compartir.url` de la lámina. El `scope: "/"` del manifest hace que abra la PWA instalada (:133-134).

### 3.5 · `SalaEspera.jsx` (stub) y `App.jsx`

**Props** (`SalaEspera.jsx:40`): `{ api, cuenta, salaInicial = null, onSalir, onLobby }`.
**Al montar:** añade `body.sal-activa` (:54-57); `releer()` → `api.miSala()` y, si hay mesa, `api.contarSentados(id)` (:84-103). No suscribe nada, no precarga sonidos, no usa `useReloj`.
**Salir:** `api.salirSala(sala.id)` y `onSalir()` **pase lo que pase** (:118-128); el anfitrión confirma antes (:223-253), el invitado no.
**Casita:** `onLobby()` sin llamar a `salirSala` (:265-273) → en `App.jsx:421` borra el código pendiente, olvida la invitación, `setSala(null)` y va al lobby. **La mesa sigue viva** y el siguiente arranque la reanuda por `mi_sala()`. Es la conducta que el informe de A3 Fase 1 midió y selló (`docs/reportes/AJILEI_SAL-B1_AjusteA3_Fase1_Informe_v1.0.md:85`: «la casita no cancela; con la mesa viva, reabrir reanuda al anfitrión»). El stub **no tiene flecha «Volver»**; la lámina sí (y allí «Volver» = salir).
**`App.jsx`:** `screen === 'sala-espera'` en :409-424; la mesa vive en `useState sala` (:153) y solo la escriben `entrarSala` (:182-186, con la guarda `esMesa`) y `onSalir`/`onLobby`. `entrarSala` es la única puerta al stub desde los tres caminos (:390, :402, :251). La lista `SIN_PRECARGA` (:79) incluye `'sala-espera'`: B2 debe precargar `SONIDOS_SALAS` al montar la pantalla, no en `App`.

### 3.6 · `BarraSuperior.jsx` y el brillo de la moneda

- `src/components/BarraSuperior.jsx` es **el único marcado** de la barra: lo montan `Lobby.jsx` y las tres pantallas de salas; `grep -rn "lob-pildora" src --include=*.jsx` solo lo encuentra ahí (:80). Clases `lob-*` sin renombrar (:24-40).
- **En producción los keyframes se llaman** (`src/styles/lobby.css`): `lob-halo-moneda` (:742-753: `drop-shadow(0 1px 2px rgba(0,0,0,.45))` en 0/50/76/100 %, más `drop-shadow(0 0 calc(var(--ico) * .5) rgba(var(--gold-brand-hi-rgb), .85))` al 60 %), `lob-destello-moneda` (:759-763: opacidad 0 → 1 al 58 % → 0 al 70 %), `lob-destello-iso` (:729-734) y `lob-respira` (:765-768). Se aplican en `.lobby .lob-moneda .chip-token` (:425-433, `animation: lob-halo-moneda var(--ciclo)`) y `.lobby .lob-moneda::after` (:434-449, el pseudo con el `radial-gradient` de `--gold-brand-hi-rgb` al 0,95). Tokens: `--ciclo: 8s` y `--fase` (:110-111). La lámina los llama `haloCoin`/`destelloCoin` con las mismas paradas.
- **`salas.css` no los tiene:** `grep -n "lob-halo-moneda\|lob-destello\|--ciclo\|lob-respira\|lob-moneda\|chip-token" src/styles/salas.css` → 0 líneas. Y hay algo más que el brillo: **tampoco existe `.sal .lob-moneda .chip-token { width/height: var(--ico) }`**, así que en las pantallas de salas la moneda mide lo que `ChipToken` fija por atributo para `size="icon"` (`src/components/ChipToken.jsx:73-81`; `lobby.css:407-410` explica que en el lobby se lleva a `--ico` desde CSS). Deducido por lectura, no medido: `diagSAL sal.5` no mide la moneda. B2 debe traer bajo `.sal` el bloque completo de `lobby.css:419-449` (posición, tamaño y las dos animaciones), no solo los keyframes.

### 3.7 · El reloj de la casa

- `src/hooks/useReloj.js:22` → `{ ahoraServidor, restante, medido }`. Mide el desfase **una vez** al montar con `supabase.rpc('ahora')` (:40-62) y expone dos funciones estables que leen `Date.now()` corregido en cada llamada (:70-71). **No expone `segundosRestantes`, no tiene latido propio y no escucha `visibilitychange`**: el diseño (relojCore.js:29-33) es que el latido de 1 s solo repinte y cada pulso recalcule contra el reloj corregido, de modo que una pestaña que vuelve de dormir se pone al día en el primer fotograma. Eso ya cumple el requisito de §3.7 sin escuchar visibilidad.
- `src/hooks/relojCore.js`: `calcularDesfase(servidor, ahoraLocal)` (:55), `ahoraServidor(ahoraLocal, desfase)` (:85), `restante(expiraEn, ahoraEnServidor)` (:105, `ceil`, nunca negativo) y `comoReloj(segundos)` (:119, `180 → '3:00'`).
- **Cero consumidores:** `grep -rn "useReloj(" src` solo encuentra su definición; `SalaOpciones.jsx:40-45` lo menciona en un comentario. Nunca se ha montado en una pantalla.
- **Hallazgo que decide el hook de B2:** `useReloj` llama a `supabase.rpc('ahora')` **directamente** (:42-43), no a `api.ahora()` (que existe en `salasApi.js:131` con el comentario «La usa `useReloj`», hoy falso). Bajo el bypass del arnés no hay sesión y `ahora()` está revocada a `anon` (SAL-A:804): la llamada fallaría y dispararía el `console.warn` de :56, que pone en rojo `sal.2` (consola limpia, `diagSAL.mjs:201-216`). Cualquier reloj que B2 monte tiene que recibir la hora por `api`, como el resto de la pantalla. Va a §7.7-2.
- `useCongelado.js` (FRZ-1) maneja `visibilitychange` para el **audio** (`creaCongelador`, `enganchaVisibilidad`, :48 y :128), no para relojes.

### 3.8 · Sonido

- `SONIDOS_SALAS = ['chipsCollect', 'cardShuffle', 'tableKnock']` en `src/hooks/useSounds.js:106`, con su motivo en :88-105 (`chipsCollect` = llegada, `cardShuffle` = barajado, `tableKnock` = «Jugar ya»).
- Archivos: `public/sounds/chips-collect.mp3`, `card-shuffle.mp3`, `table-knock.mp3` (existen los tres; `find public -iname "*.mp3"`).
- Envoltorio: Howler vía `useSounds()` → `play(nombre)` (:176). **No admite volumen**: los volúmenes son fijos en `FUENTES` (`chipsCollect` 0,7 en :37, `cardShuffle` 0,6 en :26, `tableKnock` 0,6 en :39). `play` devuelve `{ sound, id }` para `cardShuffle` (:187-200) con un recorte automático al 49 % de su duración; con ese handle se puede bajar el volumen de esa reproducción (`sound.volume(v, id)` de Howler) sin tocar la receta, si «a volumen bajo» de la lámina se quiere literal. `soundEnabled` del `SoundContext` apaga todo (:177).
- Precarga: `precargarSonidos(nombres)` (:109), idempotente. Ninguna pantalla precarga hoy `SONIDOS_SALAS` (`grep -rn SONIDOS_SALAS src` → solo su definición).

### 3.9 · Activos

| Activo | Ruta | Cómo se monta hoy |
|---|---|---|
| Isotipo | `src/assets/ajilei-isotipo.svg` | `<img>` en `Lobby.jsx:53,192-196` (`?no-inline`); `mask-image` en `embellecimiento.css:330-331`. Proporción 2:3 (`viewBox="15 30 60 90"`, `lobby.css:349`). |
| Dorso de carta | `src/assets/cards/reverso_carta.svg` | `<img>` en `PlayingCard.jsx:3,9` (`faceDown`); `background` en `gameTable.css:642,664,1080` (protegido, no se toca); `Portada.jsx:10`. |
| Moneda | `src/assets/heptacoin.svg` | `ChipToken.jsx:17` (`?no-inline`), dentro de `BalanceDisplay`. `heptacoin.webp` es la pila de la Portada, no una moneda. |

La lámina deja `[SUSTITUIR]` en la marca de agua (el trazado inline es un dibujo aproximado) y pinta el mazo con CSS puro. Ver §7.7-3.

### 3.10 · Textos

Bloque `sal.espera.*` vigente (`src/config/textos.es.js:116-131`, verbatim):

```
'sal.espera.titulo':          'Mesa de {n} · {hc} HC por mano',
'sal.espera.anfitrion.tu':    'Eres el anfitrión · {tipo}',
'sal.espera.anfitrion.otro':  'Estás en la mesa · {tipo}',
'sal.espera.tipo.privada':    'Privada',
'sal.espera.tipo.abierta':    'Abierta',
'sal.espera.codigo.copiar':   'Copiar el código',
'sal.espera.codigo.copiado':  'Copiado',
'sal.espera.sentados':        '{x}/{n} sentados',
'sal.espera.actualizar':      'Actualizar',
'sal.espera.provisional':     'Sala de espera en construcción',
'sal.espera.salir':           'Salir de la mesa',
'sal.espera.cancelar':        '¿Cancelar la mesa?',
'sal.espera.cancelar.si':     'Sí, cancelar',
'sal.espera.cancelar.no':     'Seguir esperando',
'sal.espera.arranco':         'La mesa arrancó · Partida PvP · Próximamente',
'sal.espera.lobby':           'Volver al inicio',
```

Más `sal.volver.aria` y `sal.casa.aria` (:134-135) y `lob.toast.pronto` (:30, «Próximamente»).

**Contra el `DICC` de la lámina v1.5:**

- **Faltan (33 claves):** `sub.inv` (con `{anf}`), `cod.eti`, `abierta.rot`, `compartir`, `compartir.msg`, `compartir.url`, `estado` (equivale a `sentados`), `anfitrion`, `tu`, `vacia`, `jugar`, `jugar.nota`, `jugar.min`, `esperando`, `salir.inv`, `cancelar.p`, `salio`, `llego`, `consejo.1`…`consejo.5`, `llena`, `llena.corta`, `llena.nota`, `fin.cancelada`, `fin.vencida`, `fin.activa`, `fin.volver`, `fin.entrar`, `fin.entrar.nota`.
- **Mismo texto, distinto nombre (5):** lámina `sub.anf` ↔ repo `anfitrion.tu`; `cod.copiar` ↔ `codigo.copiar`; `copiado` («Código copiado») ↔ `codigo.copiado` («Copiado»); `estado` ↔ `sentados`; `cancelar.t` ↔ `cancelar`. Y un texto distinto con el mismo nombre: `cancelar.si` es «Sí, cancelar» en el repo y «Cancelar mesa» en la lámina.
- **Se quedan sin consumidor si B2 reemplaza el stub (4):** `actualizar`, `provisional`, `arranco`, `anfitrion.otro` (la lámina quiere «Anfitrión: {anf}»). Retirarlas o no es §7.7-6.
- `sal.toast.pronto` de la lámina ya existe como `lob.toast.pronto`.

### 3.11 · Destino de `activa`

**No existe** ninguna pantalla ni valor de `screen` para la partida PvP. Los valores de `screen` son `'lobby' | 'nivel-select' | 'mode-select' | 'table' | 'sala-opciones' | 'armar-mesa' | 'sala-espera'` (`App.jsx:145-146`). `grep -rn -i "proximamente\|partida-pvp" src` solo encuentra el texto `sal.espera.arranco` y rótulos ajenos (Celebracion, FormularioPuerta, GameTable). Ver §7.7-4.

### 3.12 · `supabase-js`

`package.json:14` → `"@supabase/supabase-js": "^2.112.4"` (la CLI `supabase` va en `2.116.0`, :30). Cliente singleton en `src/lib/supabase.js:35` (`createClient(url, publishableKey)`), sin `channel()` propio. El único uso de `channel()`/`removeChannel()` del repo es `salasApi.js:232-265`; no hay ningún consumidor en pantallas (§2.6).

---

## 7.4 · Propuesta de migración `sal_b2` (solo descripción, sin SQL)

| # | Punto | Estado | Detalle |
|---|---|---|---|
| 1 | Username de los asientos | **ya está** (no toca SQL) | RLS `profiles using (true)` (SUP-2a:184) + `sala_jugadores_select_visibles` (SAL-A:268) + FK a `profiles` (SAL-A:149) permiten `select asiento, jugador_id, profiles(username)` desde el SDK. Nueva función de `salasApi` (`asientosDe(salaId)`), sin migración. Alternativa con SQL (`asientos_de(sala_id)` `security definer` o username en `mi_sala()`) solo si Victor prefiere no exponer un `select` directo; ver §7.7-1. |
| 2 | Mesa llena adelanta `expira_en` | **falta y toca una función existente (riesgo)** | En `unirse_sala`, tras el `insert` del asiento (A3:130-131): si `sentados + 1 = jugadores`, `expira_en := least(expira_en, now() + <cuenta corta>)`. Sería la **quinta** versión del cuerpo de `unirse_sala` (SAL-A → A1 → A3 → B2); se copia verbatim de A3 y se añade un bloque. El arranque lo hace el barrido / `resolver_sala` que ya existen: no hay función nueva de «arrancar por llena». La cifra (10 s en la lámina) tiene que vivir **en SQL** y espejarse en `salas.js` como `DURACION_SALA_SEG`; ver §7.7-5. |
| 3 | El que sale restituye `expira_en` | **falta y toca una función existente (riesgo)** | En `salir_sala` (SAL-A:632-657), rama invitado: si la mesa estaba llena antes de borrar la silla, `expira_en := greatest(expira_en, creada_en + interval '3 minutes')` (o guardar el `expira_en` original en una columna nueva `expira_original`, más explícito pero es `alter table`). Riesgo: es la primera vez que `salir_sala` cambia desde SAL-A, y el anfitrión que sale no debe tocar nada (cancela). |
| 4 | `salas_abiertas()` sin llenas | **falta y toca una función existente (riesgo bajo)** | Añadir al `where` de SAL-A:729 la condición `count(sala_jugadores) < s.jugadores`. Cuerpo pequeño, sin estado. Considerar la misma condición en la búsqueda de «abrir se vuelve unirme» de `crear_sala` (A1:161-166), que hoy se une a una llena y rebota con `sala_llena`. |
| 5 | Publicación Realtime + `replica identity` | **ya está** | SAL-A:205-206 y :846-865, verificado en el informe de SAL-A. |
| 6 | Políticas RLS de `select` para Realtime | **ya está** | SAL-A:257-274. Un miembro recibe `salas` en todo estado y `sala_jugadores` de su mesa. |
| 7 | `jugar_ya` | **ya está** | SAL-A:663-698, devuelve la fila `activa`. |
| 8 | Vencida vs. arranca al llegar a cero | **ya está** | `resolver_sala` (SAL-A:370-397) devuelve la fila resuelta; `salasApi.resolverSala` (:181). |

Orden probable de la migración: (2) y (3) juntas porque son la misma regla vista desde los dos lados, luego (4). Las pruebas comentadas del archivo (molde de A1/A3) deberían cubrir: llena → `expira_en` adelantado; sale uno → restituido; anfitrión sale de una llena → `cancelada` sin tocar `expira_en`; `salas_abiertas()` no lista una 5/5.

---

## 7.5 · La lámina pide → lo da hoy → falta

| # | La lámina pide | Lo da hoy | Falta |
|---|---|---|---|
| 1 | Asientos con username, anfitrión marcado, «Tú» | `sala_jugadores` (asiento, jugador_id) legible por miembros; `profiles.username` legible por todo autenticado; `anfitrion_id` en la fila; `cuenta.id` en `App.jsx:352` | `asientosDe(salaId)` en `salasApi` (select con incrustación) y releerla en cada evento. Sin SQL. |
| 2 | Cronómetro 3:00 desde `expira_en`, urgencia ≤ 30 s | `expira_en` ISO en la fila; `useReloj` + `relojCore.restante/comoReloj`; `api.ahora()` | Un hook con latido que reciba la hora por `api` (no por el singleton) y una clase `.urge`; `useReloj` hoy no sirve bajo el arnés (§3.7). |
| 3 | Llegadas y salidas en vivo | Publicación, identidad completa, RLS y `suscribirSala` | Un consumidor: `useEffect` que suscriba, relea asientos/estado en cada evento y se dé de baja. Prueba real con dos teléfonos. |
| 4 | Mesa llena → cuenta corta y arranque solo | Barrido y `resolver_sala` arrancan cuando `expira_en <= now()` con ≥ 2 | `unirse_sala` que adelante y `salir_sala` que restituya (§7.4-2/3); constante espejo en `salas.js`. |
| 5 | Tres finales para quien estaba sentado | `salas.estado` legible por miembros en todo estado; evento `UPDATE` con `new.estado`; `resolver_sala` devuelve `activa`/`cancelada` | Mapear: `UPDATE → cancelada` = «El anfitrión cerró la mesa»; reloj a 0 + `resolver_sala` → `cancelada` = «vencida», `activa` = «¡Arranca!»; `UPDATE → activa` (por `jugar_ya` o por otro cliente) = «¡Arranca!». Sustituir el sondeo ciego del stub (:88-93). Las tres claves de texto. |
| 6 | «Jugar ya» desde 2 (anfitrión) | `jugar_ya` RPC y `api.jugarYa` | Solo la pantalla (CTA apagado con `< 2`, `faltan_jugadores` traducido, `tableKnock`). |
| 7 | Compartir con `?sala=AJ-XXXX` | `recogerDeLaUrl` lee `?sala=` y normaliza `AJ-XXXX`/`AJXXXX`; `IconosSalas` tiene Copiar/Check/Globo | `navigator.share` con `text` + `url`, respaldo `clipboard`; claves `compartir.*`; un `IconoCompartir` (no existe). |
| 8 | Mazo, marca de agua, consejos, sonido de llegada, brillo de la moneda | Isotipo SVG, dorso SVG, `SONIDOS_SALAS` con archivos, keyframes en `lobby.css` | Decidir mazo (§7.7-3); duplicar bajo `.sal` el bloque de la moneda de `lobby.css:419-449` y los keyframes; consejos = 5 claves + rotación con handle; precargar `SONIDOS_SALAS` al montar. |
| 9 | `salas_abiertas()` sin mesas llenas | Devuelve `sentados`, no filtra | Condición en el `where` (§7.4-4). |
| 10 | Arnés con estados `espera-*` bajo el bypass | `?sal=` con guarda `DEV && VITE_AUTH_BYPASS`, fixtures con forma de SDK, `sal.0` compara listas | Siete estados nuevos en dos listas, mock de `from().select().eq()` que devuelva filas con `profiles`, mock de canal capaz de emitir, `rpc('ahora')` por `api`, un `medirEstado` por estado (§4.2 abajo). |

---

## 7.6 · Fuera de alcance, visto de paso

1. **`crear_sala` en modo abierta se une a una mesa llena** (A1:161-170 no mira el aforo) y rebota con `sala_llena`; el índice parcial impide abrir otra de la misma combinación mientras la llena espera. Con el arranque en 10 s se reduce a una ventana corta. Es de la ficha de Fase 1 si se toca `salas_abiertas`; si no, MES-PvP.
2. **La moneda de la barra en las pantallas de salas** mide lo que fija el atributo de `ChipToken` (16 px), porque `salas.css` no trae `.sal .lob-moneda .chip-token` (§3.6). Es deuda de B1 que B2 paga de paso al duplicar el bloque; se anota para que no parezca nuevo.
3. **`salasApi.ahora()` no lo usa nadie** y su comentario («La usa `useReloj`») es falso: `useReloj` llama al singleton. Deuda de SAL-A.
4. **Textos de B1 y de la lámina que discrepan** (§3.10): `cancelar.si` («Sí, cancelar» / «Cancelar mesa»), `copiado` («Copiado» / «Código copiado»). Y `cancelar.p` de la lámina dice que «los demás vuelven a la sala de opciones», pero la propia lámina v1.5 los deja en la misma pantalla con el estado `fin-cancelada` y «Buscar otra mesa». Es de textos, no de código; se decide en Fase 1.
5. **`diagSAL sal.5` no mide la moneda** de la barra (mide avatar, ajustes, volver, casa, copiar; `diagSAL.mjs:277-290`). `diagDSK lob` sí la mide en el lobby.
6. **`decidirArranque`** sigue sin existir; B2 no toca la precedencia de arranque (`App.jsx:229-257`), así que no hace falta.
7. **`useCongelado`** (FRZ-1) baja el volumen de Howler en segundo plano; `chipsCollect` sonará al volver, no en segundo plano. Correcto y fuera de alcance.
8. **Los rectores de SAL no están en el repo** (§7.1). No es de esta tanda.
9. Nada de MOT-1, MES-PvP, ECO-1 ni AVA-1 apareció más allá de lo ya citado (`estado_partida`, `saldo_de` constante, el hueco del avatar de la lámina).

---

## 7.7 · Requiere autorización

**1 · Username de terceros: ¿`security definer` o basta RLS?**
Evidencia: `profiles_select_autenticados using (true)` (SUP-2a:184-187); `sala_jugadores_select_visibles` (SAL-A:268-274); FK (SAL-A:149); precedente sin SQL de `contarSentados` (`salasApi.js:200-217`). **Basta RLS.** Recomendación: `asientosDe(salaId)` en `salasApi` con `select('asiento, jugador_id, profiles(username)')`, sin migración. Coste declarado: la incrustación depende de que PostgREST detecte la FK (lo hace, es una FK simple) y de que el mock del arnés devuelva esa forma. La alternativa `asientos_de(sala_id)` `security definer` no aporta seguridad (el dato ya es público entre autenticados) y sí añade una función que mantener. Corrige además la afirmación errónea del informe de B1 (:214).

**2 · Reloj: ¿sobre `useReloj` o hook nuevo `useCronometroSala`?**
Evidencia: `useReloj` no tiene latido ni `segundosRestantes` (§3.7), tiene cero consumidores, y llama a `supabase.rpc('ahora')` directamente (`useReloj.js:42`), lo que rompe el arnés bajo bypass (`ahora` revocada a `anon`, SAL-A:804). Recomendación: **hook nuevo** `useCronometroSala(api, expiraEn)` que (a) pida `api.ahora()` una vez, (b) reutilice `relojCore` entero (`calcularDesfase`, `ahoraServidor`, `restante`, `comoReloj`), (c) tenga un `setInterval` de 1 s con handle que recalcule contra el reloj corregido (así no necesita `visibilitychange`, relojCore.js:29-33), y (d) devuelva `{ segundos, texto, medido }`. `useReloj` queda intacto (intocable según B1) y sin consumidores, como hoy. Alternativa: modificar `useReloj` para que reciba `api`, que toca un archivo declarado intocable.

**3 · Mazo del fieltro: ¿dorso real o dibujo CSS?**
Evidencia: `reverso_carta.svg` existe y ya se monta como `<img>` en `PlayingCard.jsx:9`; la lámina dibuja tres dorsos con gradientes CSS (`.mazo i`) y anima `abanico1..3`. Recomendación: **dorso real** en tres `<img>` con la misma animación de la lámina; un dorso que no sea el de la baraja sería una segunda identidad de carta en el producto (doctrina de la moneda única, `lobby.css:396-405`). Coste: el SVG del reverso se carga en la sala (es uno solo, ya cacheado por la Portada). La alternativa CSS no requiere activo y es la que Victor selló visualmente; por eso se pregunta.

**4 · «Partida PvP · Próximamente»: ¿stub de pantalla nuevo o estado dentro de `SalaEspera`?**
Evidencia: no existe ningún `screen` de partida PvP (§3.11); la lámina v1.5 resuelve `fin-activa` **dentro** de la misma pantalla con el CTA «Entrar a la mesa» y la nota «Partida PvP · Próximamente». Recomendación: **estado dentro de `SalaEspera`** (`fin-activa`), con el CTA pulsable que hoy solo avise «Próximamente» por toast (`lob.toast.pronto`) y no cambie de `screen`. No se crea pantalla: MES-PvP la creará con su propio nombre y evitamos un `screen` huérfano. Si Victor prefiere que el CTA lleve a algún sitio, entonces sí un stub `'partida-pvp'` mínimo.

**5 · Dónde vive la cuenta atrás corta (10 s).**
La lámina anota «constante en `salas.js`, no en SQL». Evidencia en contra: la doctrina 4 de SAL-A (:29-32, «el cliente cuenta para ENSEÑAR; el servidor cuenta para DECIDIR») y el precedente de `DURACION_SALA_SEG` (`salas.js:123-129`) y `ACTIVA_SIN_PARTIDA_MIN` (`salas.js:159-177`): cifra en SQL, espejo comentado en cliente. Si la cifra viviera solo en el cliente, el adelanto de `expira_en` tendría que hacerlo un `update` desde el cliente, que las políticas prohíben. Recomendación: `interval '10 seconds'` en `unirse_sala` y `LLENA_SEG = 10` en `salas.js` como espejo.

**6 · Nombres de claves de texto.**
Cinco claves de la lámina tienen equivalente en el repo con otro nombre (§3.10) y B1 declaró los nombres como contrato. Recomendación: conservar los nombres del repo donde ya existen (`anfitrion.tu`, `codigo.copiar`, `codigo.copiado`, `sentados`, `cancelar`), añadir las 33 nuevas con los nombres de la lámina, y retirar las cuatro huérfanas (`actualizar`, `provisional`, `arranco`, `anfitrion.otro`) en el mismo commit que retira el stub. Los dos textos que discrepan (`cancelar.si`, `copiado`) los decide Victor.

---

## 7.8 · Estimación de la Fase 1

| Bloque | Horas | Riesgo mayor |
|---|---|---|
| SQL (`sal_b2`: `unirse_sala` v5, `salir_sala`, `salas_abiertas`, pruebas comentadas) | 2,5–3 | Quinta versión de `unirse_sala` copiada a mano; una restitución mal calculada deja una mesa con `expira_en` en el pasado. |
| API (`asientosDe`, `LLENA_SEG`, pruebas de `salasApi`) | 1 | Que el mock del arnés y PostgREST devuelvan formas distintas para la incrustación. |
| Núcleo puro (`salaEsperaCore.js`: estado de mesa → vista, textos de fin, «x/n», consejo siguiente, ángulo de las sillas) | 2 | Ninguno grande; es lo probable sin jsdom. |
| Hook de reloj (`useCronometroSala` sobre `relojCore`) | 1,5 | Que el latido no se cancele al desmontar (GT-HIG). |
| Realtime (efecto de suscripción, releer en cada evento, baja, prueba con dos teléfonos y túnel) | 2,5–3 | **El mayor de la tanda:** primer uso real de Realtime; un canal que dice SUBSCRIBED sin entregar eventos (SAL-A:846-852) solo se detecta con dos dispositivos. |
| Pantalla (`SalaEspera.jsx` completa: sillas en anillo con medición, óvalo, diálogo, compartir, toasts, tres finales, precarga) | 5–6 | La geometría de las sillas se calcula con `clientWidth` en la lámina; en React exige `ResizeObserver` o medir en efecto sin pisar `react-hooks/set-state-in-effect`. |
| CSS (`salas.css` §12 reemplazado: mesa, sillas, mazo, marca, consejo, acción, diálogo, moneda bajo `.sal`, tokens sin hex) | 3 | Los `rgba(232,184,75,…)` → `rgba(var(--gold-brand-rgb), …)` (`theme.css:7`) y `rgba(245,223,174,…)` → `rgba(var(--gold-brand-hi-rgb), …)` (`theme.css:23`); el traje apaisado bajo con el óvalo. |
| Arnés (7 estados, mock de asientos y de canal con emisión, `sal.0`, `medirEstado` × 7, retirar `espera-stub`) | 3–4 | Simular la llegada por Realtime exige que el mock de `channel` exponga los handlers a la página. |
| Informe | 1,5 | — |
| **Total** | **≈ 22–25 h** | |

---

## Apéndice A · Arnés (ficha §4)

**4.1 · Cómo funciona hoy.** `scripts/diagSAL.mjs` tiene tres modos: `sal` (11 estados × 6 viewports), `sal <estado>` y `shots` (:6-8). Corre contra el servidor de desarrollo `5173` con `VITE_AUTH_BYPASS=1`, no contra `preview` (:10-29 explica por qué); `AJILEI_BASE` cambia el puerto. Cada celda navega a `/?sal=<estado>` (:145) y mide seis puntos `sal.1`…`sal.6` más `sal.0`. Los estados se inyectan por `src/dev/salasFixtures.js:73-99` bajo la guarda doble `import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS` (:75-76); `App.jsx:98-103` resuelve la simulación una vez y pasa `simulacion.api` a las pantallas. Las fixtures son un **cliente falso con forma de SDK** (`clienteDe`, :247-281: `rpc`, `from().select().eq()`, `channel().on().subscribe()`, `removeChannel`) que pasa por `crearSalasApi` real; la fila de nulos (:227-233) es distinta de una mesa (`salaFalsa`, :205-219, `anfitrion_id` = `PERFIL_DEV.id` de `useAuth.js:54`, o sea **vista de anfitrión**). El punto `sal.0` (:589-598) compara la lista `ESTADOS` del arnés con `ESTADOS_SAL` de las fixtures leyendo el archivo como texto.

**4.2 · Qué haría falta para los siete estados** (`espera-anfitrion`, `espera-invitado`, `espera-abierta`, `espera-llena`, `espera-fin-cancelada`, `espera-fin-vencida`, `espera-fin-activa`), solo descripción:

1. Añadir los siete nombres a `ESTADOS_SAL` (fixtures :44-61) y a `ESTADOS` (arnés :69-82); retirar `espera-stub` (el stub deja de existir) y conservar `espera-fantasma` (prueba negativa). `pantallaDe` ya mapea `espera*` → `'sala-espera'` (:115-119).
2. `salaDe(estado)` (:101-105) devuelve `salaFalsa` con `anfitrion_id` = `PERFIL_DEV.id` para anfitrión y otro uuid para invitado; `tipo:'abierta'` y `codigo:null` para `espera-abierta`; `expira_en` a `enUnRato(LLENA_SEG)` para llena; `estado:'cancelada'`/`'activa'` para los finales de estado (o mejor, `'esperando'` y emitir el `UPDATE` por el canal falso, ver 4).
3. El mock `from` (:273) debe devolver **filas** para `asientosDe` (`[{asiento, jugador_id, profiles:{username}}]`) además del `count` para `contarSentados`: distinguir por si `select` lleva `head:true`.
4. El mock `channel` (:275-278) debe guardar los handlers de `.on()` y exponer en `window` una función de emisión (`window.__salEmitir({tabla, evento})`) para que `medirEstado` simule una llegada (`INSERT` en `sala_jugadores`, comprobar silla nueva + clase `llega`), una salida (`DELETE`) y un `UPDATE` de `salas` a `cancelada`/`activa`. Solo bajo la guarda doble, como todo el archivo.
5. `rpc('ahora')` ya está en el mock (:254); el hook nuevo debe pedirlo por `api` para que el arnés lo alcance (§7.7-2). `rpc('resolver_sala')` (:264) debe devolver `cancelada` para `espera-fin-vencida` y `activa` para `espera-fin-activa`; `expira_en` en el pasado para esos dos.
6. Un `case` por estado en `medirEstado` (:329-587): sillas = `jugadores`, ocupadas = sentados, «Tú» en la silla propia, «Anfitrión» en la 0, reloj con formato `m:ss`, CTA «Jugar ya» apagado/encendido, `.espera` en invitado, caja del código oculta y rótulo con globo en abierta, `.urge` no presente al nacer, y en los finales el texto de `fin` y el CTA correspondiente; O1 en todos (la caja de acción mide lo mismo en las cuatro variantes).
7. `sal.5` debería incorporar la moneda (`.lob-moneda .chip-token`) ahora que B2 la dimensiona bajo `.sal`.

**4.3 · `vite.config.js`** conserva `preview: { allowedHosts: ['.trycloudflare.com'] }` (líneas 8-9). Confirmado.

## Apéndice B · CSS (ficha §5)

**5.1** `src/styles/salas.css`: §1–§11 ocupan :45-708 y §12 (stub) :709-766; §13 (trajes) :768-789. B2 puede reemplazar solo :709-766. Reglas nuevas de la lámina v1.5 a traer sin hex: `.silla .av .ini` (tamaño `calc(var(--silla)*.32)`, `--text-primary`), `.silla .av img` (AVA-1), `.ovalo .reloj.llena` y `.mesa.llena .silla .av` (`--gold-brand`), y el bloque `.sal.fin*` (opacidades, `--text-muted`, `box-shadow 0 0 0 3px rgba(var(--gold-brand-rgb), .22)`). Los `rgba(232,184,75,…)` de la lámina (borde del óvalo .35, mazo .18/.45, halo del reloj) son `rgba(var(--gold-brand-rgb), …)` con `--gold-brand-rgb: 232, 184, 75` (`theme.css:7`); los `rgba(245,223,174,…)` son `rgba(var(--gold-brand-hi-rgb), …)` con `--gold-brand-hi-rgb: 245, 223, 174` (`theme.css:23`). `--linea` ya existe en `.sal` (se usa en `salas.css:206`).

**5.2** El `line-height: 145%` sigue en **`src/index.css:18`** (`font: 18px/145% var(--sans)`; la ficha lo situaba en `src/styles/index.css`, que no existe). `salas.css:151` lo corta con `line-height: 1.2` sobre `.sal`, con el porqué en :133-150. Nada de la lámina v1.5 lo necesita distinto: los bloques que quieren más aire lo declaran localmente (`.dialogo p` 1.4, `.ovalo .fin` 1.3).

## Apéndice C · Dispositivos y prueba física (ficha §6)

Las pruebas comentadas de SAL-A que faltan por correr físicamente:

- **Grupo C · el índice parcial** (SAL-A:1012-1058): dos anfitriones A y B piden `crear_sala('abierta', 4, 500)`; debe quedar **una** mesa, B en el asiento 1, y un `insert` directo de la misma combinación debe rebotar con `unique_violation`.
- **Grupo D · el barrido** (SAL-A:1061-1099): una sala con 1 sentado y `expira_en` en el pasado → `cancelada`; con 2 → `activa` con `iniciada_en` no nulo.

Para correrlas con teléfonos (sin SQL Editor): S25 con `test1976` y Motorola con `ticotest2022`, túnel `cloudflared` sobre `vite preview` (`allowedHosts` ya listo), y el iPhone de Barcelona como «invitado sin cuenta previa» para el trayecto `?sala=` → Portada → Bautizo → sala (`salaPendiente.js:4-13`). Lo que Realtime añade y ningún SQL cubre: que el evento **llegue** (SAL-A:882-884), medido como «el S25 ve sentarse al Motorola sin tocar nada», «el Motorola ve la cancelación del S25», y «los dos ven `3:00 → 0:10` al llenarse una mesa de 2».

---

**Tiempo real de esta Fase 0:** ≈ 1 h 20 min de lectura y redacción, por debajo de las 2–3 h previstas. Sin commits, sin push, sin cambios fuera de este archivo.
