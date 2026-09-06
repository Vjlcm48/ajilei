# AJILEI · SAL-A · Fase 1 · Informe

**Fecha:** 2026-09-05
**SHA de partida:** `1f2a610b76ec7dcdb9f84214617e9c4b90163643` (`1f2a610` — *LOB-1e: informes de Fase 0 y Fase 1 (con anexo A1)*)
**Rama:** `main` · Los cinco commits de SAL-A se hicieron **después** de escribir este informe, con la autorización de Victor y según `AJILEI_SALA_Commits_v1.0.md`; sus SHA van en la salida de esa ceremonia, no aquí (este archivo viaja dentro del último de ellos).
**Migración:** `20260905203158_sal_a_salas.sql` — **aplicada por Victor** con `npx supabase db push`. Verificada en lectura (§1.5).
**Protegidos:** ninguno de los cinco de `docs/AJILEI_Protegidos_v1.0.md` §2 se abrió. Las tres ediciones de `gameEngine.js` que la Fase 0 §4.10 dejó pedidas son de **MOT-1** y esta tanda no las toca.
**Escrituras en Supabase por parte de Claude Code:** **ninguna.** Todo lo hecho contra el proyecto vivo es lectura: `migration list`, `inspect db`, `functions list`, `projects list`, `orgs list` y sondas HTTP con la llave publicable.
**Credenciales:** ninguna se escribió, se imprimió ni se pidió. `supabase/config.toml` no lleva el `project-ref`; `supabase/.temp/` queda ignorado por git.

---

## 0. Estado de la tanda

| Bloque | Estado |
|---|---|
| §1.1 CLI como devDependency + `supabase/config.toml` | **hecho** |
| §1.2 `login` · `link` · `migration repair` · `db push` | **hecho por Victor** · verificado (§1.1) |
| §1.3 Cerrar las cuatro preguntas de la Fase 0 | **las cuatro CERRADAS** (§1.4) |
| §2 Migración escrita **y aplicada** | **hecho** · verificada en §1.5 y §1.6 |
| §2.4 Las dos tablas en `supabase_realtime` | **VERIFICADO** — bloque de catálogo 9/9 OK (§1.6) |
| §3 `t()` con variables | **hecho y verde** |
| §4 Config, saldo, sala pendiente | **hecho y verde** |
| §5 Reloj, API de salas, sonidos, `cuenta.id` | **hecho y verde** |
| §7.1 `npm test` | **565 en 23 archivos, todas verdes** |
| §7.2 build y lint | **build limpio · lint 21 (20+1), la línea base exacta** |
| §7.3 Censo tras el push | **completo** (§1.5 + §1.6) |
| §7.4 Sondas de permisos con la llave publicable | **hecho — 14 de 14 denegadas** (§1.5.4) |
| §7.5 `diagDSK lob` y `diagPUE puerta` | **CORRIDOS: 6/6 y 7/7, todo verde** (§7.5) |
| Humo del Bautizo tras el `revoke` | **superado** — cambio de nombre ida y vuelta con partida en curso (§1.6) |
| §2.5 Pruebas A–D en el SQL Editor | **diferidas a SAL-B**, con su motivo (§1.6) |

---

## 1. El enlace, el push y el censo

### 1.1 `migration repair`: la predicción se confirmó

`npx supabase migration list` devuelve:

```json
{"migrations":[
  {"local":"0001","remote":"0001","time":"0001"},
  {"local":"20260905203158","remote":"20260905203158","time":"2026-09-05 20:31:58"}]}
```

**Las dos migraciones aparecen en local y en remoto.** La versión de `0001_sup2a_identidad.sql` se lee **`0001`**, exactamente como se había previsto sin poder comprobarlo — queda verificado contra la herramienta y no contra el formato de nombre.

`supabase/.temp/` se creó y **no aparece en `git status`**: el ignorado añadido en esta tanda funciona.

### 1.2 El dump no se pudo hacer, y por qué

El rector §1.3 pedía `npx supabase db dump --schema-only -f <ruta fuera del repo>`. **Dos obstáculos, los dos reales:**

1. **`--schema-only` no existe** en la CLI 2.116.0: `UnrecognizedOption`. El dump ya es de esquema por defecto; lo que existe es `--data-only` para lo contrario.
2. **`db dump` exige Docker.** Sin el flag, la CLI responde `LegacyDockerRunError: failed to run docker. Docker Desktop is a prerequisite for local development`. `pg_dump` corre dentro de un contenedor, y en esta máquina no hay Docker.

**Se rodeó, no se abandonó.** Lo que sí conecta a la base sin Docker son `migration list` e `inspect db`, que leen del catálogo; y la API REST con la llave publicable responde por las tablas y por los permisos. Con esas tres vías se cierran casi todas las preguntas. Lo que queda sin cerrar está en §1.6, con su motivo y su remedio.

### 1.3 Sin arbitrar SQL: el límite exacto

Se revisó el árbol completo de subcomandos de la CLI: **ninguno ejecuta SQL arbitrario contra el proyecto remoto** sin Docker. `inspect db` tiene 15 subcomandos, todos con su consulta fija (`table-stats`, `index-stats`, `locks`, `bloat`…); `snippets` gestiona los guardados en el SQL Editor pero no ejecuta; `db dump`, `db pull`, `db reset` y `test` pasan por Docker.

**Vías que se descartaron a propósito, no por olvido:**
- La **Management API** (`POST /v1/projects/{ref}/database/query`) ejecutaría SQL, pero exige el token personal de acceso. La regla 3 de la tanda dice que las credenciales no viajan; ir a buscar el token que `supabase login` guardó, para pasarlo por una línea de comandos, es exactamente lo que esa regla evita. **No se hizo.**
- **Abrir una sesión autenticada** para probar las funciones de verdad: `anonymous_users` es `false` y `mailer_autoconfirm` también, así que un `signUp` con contraseña no devuelve sesión hasta confirmar el correo. **No hay forma** de que Claude Code se autentique sin la bandeja de Victor.

### 1.4 Las cuatro preguntas abiertas de la Fase 0

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | **Tablas en `supabase_realtime`** | **CERRADA: `salas` y `sala_jugadores` publicadas, `intentos_codigo` no.** Bloque de catálogo, filas 1–3 |
| 2 | **Censo de tablas, políticas y funciones** | **CERRADA.** Tablas, índices y funciones en §1.5; políticas, RLS, `replica identity` y `search_path` en el bloque de catálogo |
| 3 | **Edge Functions desplegadas** | **CERRADA: ninguna.** `npx supabase functions list` → `{"functions":[]}`. Ya no es un tanteo de nombres como en la Fase 0: es la enumeración del proyecto |
| 4 | **Plan y región** | **CERRADA. Plan FREE** (leído del panel por Victor). Región **`us-east-1`**, Postgres **17.6.1.166** (motor 17, canal `ga`), estado `ACTIVE_HEALTHY`, creado el 2026-08-27. Organización **HEPTACREATION** (`ibpcbqdedmszyexlzrpx`). La CLI no expone el plan ni en `projects list` ni en `orgs list`: hizo falta el panel |

### 1.5 Lo que sí quedó verificado del esquema nuevo

#### 1.5.1 Las cinco tablas existen

Dos vías independientes. Del catálogo, `npx supabase inspect db table-stats --linked`:

```
public.profiles · public.salas · public.reserved_usernames
public.sala_jugadores · public.intentos_codigo
```

Y por REST con la llave publicable, `GET /rest/v1/<tabla>?select=*&limit=0`: **`200 []`** en las cinco. El `[]` en `salas` y `sala_jugadores` es lo correcto para un anónimo —las políticas son `to authenticated`—; en `intentos_codigo` es lo correcto **siempre**, porque tiene RLS y cero políticas.

#### 1.5.2 Los nueve índices existen

`npx supabase inspect db index-stats --linked`:

| Índice | Tabla |
|---|---|
| `salas_pkey` · `salas_codigo_key` | `salas` |
| **`salas_abierta_unica_idx`** | `salas` — *el único parcial, el que sostiene «una sola mesa abierta por combinación»* |
| `salas_estado_expira_idx` | `salas` |
| `sala_jugadores_pkey` · `sala_jugadores_sala_id_asiento_key` | `sala_jugadores` — *las dos reglas distintas: un jugador no ocupa dos sillas, dos jugadores no ocupan una* |
| `sala_jugadores_sala_idx` · `sala_jugadores_jugador_idx` | `sala_jugadores` |
| `intentos_codigo_idx` | `intentos_codigo` |

#### 1.5.3 Las trece funciones existen

Se prueba por el **código de error**, y esto merece explicarse porque es lo que convierte una sonda de permisos en un censo: PostgREST responde `PGRST202 · 404` a una función que **no existe**, y `42501 · permission denied for function <nombre>` a una que existe pero está cerrada. Las catorce sondas —las trece nuevas más `normalizar_username`— devolvieron **`42501`**. **Existen todas.**

#### 1.5.4 §7.4 · Los permisos: 14 de 14 denegadas a `anon`

```
POST /rest/v1/rpc/<f>   con la llave publicable
```

| Función | Respuesta |
|---|---|
| `ahora` | **401 · 42501** — *lo que §7.4 exige* |
| `normalizar_username` | **401 · 42501** — *el hallazgo lateral 1 de la Fase 0, CERRADO* |
| `regla_asiento` · `saldo_de` · `es_miembro` · `es_sala_publica` · `barrer_salas` | **401 · 42501** |
| `crear_sala` · `unirse_sala` · `salir_sala` · `jugar_ya` · `resolver_sala` · `salas_abiertas` · `mi_sala` | **401 · 42501** |

**Ni una sola función del proyecto es alcanzable con la llave que viaja al navegador.** Antes de esta migración, `normalizar_username` devolvía `200 "pendejo"` sin sesión.

> **Lo que esta sonda NO prueba, y hay que decirlo:** que `authenticated` **sí** pueda llamar a las nueve que debe. Los `grant` están en el archivo y el push no falló, pero probarlo exige una sesión real, que Claude Code no puede abrir (§1.3). Es lo primero que SAL-B ejercitará.

#### 1.5.5 Las columnas

El `db push` terminó sin error, así que el DDL se ejecutó **exactamente como está escrito**: las tres tablas tienen las columnas, tipos, `check` y claves foráneas del archivo, y los dos `enum` existen (sin ellos, `create table` habría fallado). El archivo de migración es el registro autoritativo y no hace falta un dump para leerlo.

### 1.5.6 El plan es FREE · lo que eso le fija a SAL

La pregunta 4 de la Fase 0 se hacía por un motivo concreto —«fijan los límites de Realtime, Edge Functions y conexiones que SAL va a usar»—, así que la respuesta merece su consecuencia escrita. En el plan **Free**, los tres techos que esta campaña puede rozar son:

- **Realtime: 200 conexiones concurrentes.** Cada jugador en una sala abre **una** conexión (el singleton de `lib/supabase.js`, y por eso su cabecera insiste en que sea uno solo). 200 conexiones son ~40 mesas de cinco a la vez. Sobra para una beta cerrada; es lo primero que se estrecha si la beta crece.
- **Edge Functions:** las hay en Free, pero con menos invocaciones y sin recursos dedicados. **MOT-1** —el árbitro— es quien va a vivir ahí, y conviene que llegue sabiendo el techo.
- **La base se pausa tras una semana de inactividad.** No afecta al desarrollo diario, pero explica de antemano un arranque lento tras un parón largo, que si no parecería un fallo de las salas.

Nada de esto bloquea SAL-B. Se anota para que la decisión de subir de plan se tome por un motivo medido y no por un susto.

### 1.6 El bloque de catálogo · **9/9 OK**

Quedaban tres cosas que exigen leer catálogos del sistema, y PostgREST no los expone. **Victor las corrió en el SQL Editor y el bloque devolvió las nueve filas en OK.** Eso cierra:

| Fila | Qué medía | Veredicto |
|---|---|---|
| 1–2 | `salas` y `sala_jugadores` **en la publicación `supabase_realtime`** | OK — es la verificación que el rector §2.4 exige nombrada, y sin ella los canales dirían SUBSCRIBED sin entregar un evento |
| 3 | `intentos_codigo` **NO** publicada | OK — publicarla sería un canal por el que se filtra actividad |
| 4–5 | **2** políticas de lectura y **0** de escritura | OK — el cliente no escribe, que es la doctrina entera de la migración |
| 6 | RLS activo en las tres tablas | OK |
| 7 | `replica identity full` en las dos de juego | OK — sin ella un `DELETE` llegaría por Realtime sin el `asiento` que la pantalla necesita |
| 8 | Las 13 funciones con `search_path` fijado | OK — la precaución contra escalada por esquema intruso, heredada de SUP-2a |
| 9 | 11 `security definer` | OK |

**La prueba de humo del Bautizo también pasó:** cambio de nombre ida y vuelta, con partida en curso, sin error. El `revoke` sobre `normalizar_username` no rompió el disparador de SUP-2b — el razonamiento («`validar_username` es `security definer` y `postgres` conserva el privilegio») queda medido y no supuesto.

El bloque, tal como se corrió:

```sql
-- AJILEI · SAL-A · verificación post-push. Sólo lectura.
select prueba, esperado, obtenido,
       case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
from (
  -- §2.4 · LAS DOS TABLAS EN LA PUBLICACIÓN. Es la fila que más importa:
  -- si falta, los canales dirán SUBSCRIBED y no llegará jamás un evento.
  select 1 as orden, 'realtime · salas' as prueba, 'true' as esperado,
         exists(select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public'
                   and tablename='salas')::text as obtenido
  union all select 2, 'realtime · sala_jugadores', 'true',
         exists(select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public'
                   and tablename='sala_jugadores')::text
  union all select 3, 'realtime · intentos_codigo NO publicada', 'false',
         exists(select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public'
                   and tablename='intentos_codigo')::text

  -- POLÍTICAS: dos, las dos de SELECT, y CERO de escritura.
  union all select 4, 'politicas de lectura', '2',
         (select count(*)::text from pg_policies where schemaname='public'
           and tablename in ('salas','sala_jugadores','intentos_codigo') and cmd='SELECT')
  union all select 5, 'politicas de ESCRITURA', '0',
         (select count(*)::text from pg_policies where schemaname='public'
           and tablename in ('salas','sala_jugadores','intentos_codigo') and cmd<>'SELECT')
  union all select 6, 'RLS activo en las tres', '3',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relrowsecurity
             and c.relname in ('salas','sala_jugadores','intentos_codigo'))

  -- REPLICA IDENTITY FULL en las dos de juego ('f' = full).
  union all select 7, 'replica identity full', '2',
         (select count(*)::text from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relreplident='f'
             and c.relname in ('salas','sala_jugadores'))

  -- Las 13 funciones nuevas, todas con search_path fijado.
  union all select 8, 'funciones con search_path', '13',
         (select count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proconfig::text like '%search_path%'
             and p.proname in ('ahora','regla_asiento','saldo_de','es_miembro','es_sala_publica',
                               'barrer_salas','resolver_sala','crear_sala','unirse_sala',
                               'salir_sala','jugar_ya','salas_abiertas','mi_sala'))
  union all select 9, 'security definer', '11',
         (select count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.prosecdef
             and p.proname in ('saldo_de','es_miembro','es_sala_publica','barrer_salas',
                               'resolver_sala','crear_sala','unirse_sala','salir_sala',
                               'jugar_ya','salas_abiertas','mi_sala'))
) t order by orden;
```

**Lo que sigue pendiente de aquí:** las **pruebas A–D del pie de la migración** (rector §2.5), escritas y comentadas en `20260905203158_sal_a_salas.sql`. El bloque de arriba verifica la **forma** del esquema —que las tablas, políticas, funciones y la publicación son las que se pidieron—; los Grupos A–D verifican el **comportamiento**: que el índice parcial muerde, que el sexto intento en un minuto se corta, que el anfitrión que sale cancela, que el barrido con un sentado cancela y con dos arranca. Son dos preguntas distintas y sólo una está respondida.

Se quedan para SAL-B, donde además se pueden ejercitar con dos sesiones reales en vez de con `set_config('request.jwt.claims', …)` fabricado — que es andamio, y el propio archivo lo declara. Va a §8.

---

## 2. La migración

**Ruta:** [supabase/migrations/20260905203158_sal_a_salas.sql](supabase/migrations/20260905203158_sal_a_salas.sql) · 1 115 líneas. **Aplicada.**

### 2.1 Qué crea

| Sección | Contenido |
|---|---|
| 1 | `sala_tipo` (privada · abierta) y `sala_estado` (esperando · activa · cancelada), en bloques `do` con guarda de existencia |
| 2 | `public.salas` — 11 columnas, dos `check` de código, índice **único parcial** `salas_abierta_unica_idx`, índice de barrido |
| 3 | `public.sala_jugadores` — PK compuesta + `unique (sala_id, asiento)`, dos índices |
| 4 | `public.intentos_codigo` — registro de sólo-añadir con su índice |
| 5 | `replica identity full` en las dos tablas de juego |
| 6 | RLS en las tres · `es_miembro` · `es_sala_publica` · **dos políticas, ambas de SELECT** |
| 7 | `regla_asiento()` · `ahora()` · `saldo_de()` |
| 8 | `barrer_salas()` · `resolver_sala()` |
| 9–14 | `crear_sala` · `unirse_sala` · `salir_sala` · `jugar_ya` · `salas_abiertas` · `mi_sala` |
| 15 | `revoke`/`grant` de las 13 funciones **+ el `revoke` de `normalizar_username` a `anon`** |
| 16 | Alta de las dos tablas en `supabase_realtime`, con guarda de existencia |
| pie | Pruebas A–D, comentadas |

**Trece funciones y no diez.** Las tres de más sobre la tabla del rector §2.3 son `es_miembro` (que el propio §2.2 ya pedía), `es_sala_publica` y `regla_asiento`, y las dos últimas están declaradas en §6 de este informe.

### 2.2 Verificación

Antes del push, mecánica sobre el archivo: **26** comillas de dólar `$fn$` emparejadas (13 funciones × 2), **13 de 13** funciones con `set search_path = ''`, **11** `security definer`, **3 de 3** tablas con RLS, **2** políticas y las dos de SELECT, **0** de escritura, **10 de 10** funciones alcanzables por el cliente con su `revoke` y su `grant`, y las **9** claves de error del SQL idénticas a las del cliente (comparadas por extracción, no a ojo).

**Después del push**, contra el proyecto vivo: §1.5 de este informe. Lo que el push demuestra por sí mismo es que **el SQL se ejecuta** — que era el riesgo declarado de la entrega anterior, y ya no lo es.

### 2.3 Las decisiones que el rector dejaba abiertas

**El índice parcial en vez de una comprobación en `crear_sala`.** La regla «una sola mesa abierta por combinación» se garantiza con `create unique index … where tipo = 'abierta' and estado = 'esperando'`. La alternativa —un `select` que mire si ya existe— tiene una rendija: entre esa consulta y el `insert` cabe otro anfitrión. `crear_sala` **también** hace la consulta, pero para *unirse* a la que ya está, que es la regla sellada; el índice es la red que atrapa el empate. Confirmado presente en el catálogo (§1.5.2).

**El límite de intentos se registra ANTES de contar.** Así el intento que se rechaza también cuenta y un atacante no obtiene un sondeo gratis por cada bloqueo. Un código **mal formado** no se registra: no puede coincidir con nada, así que no es fuerza bruta y contarlo sólo castigaría a quien teclea mal.

**El asiento libre más bajo, no el siguiente número.** Si el de la silla 1 se levanta, el próximo ocupa esa silla. Sin eso, una sala de cinco con entradas y salidas acabaría con los asientos 0, 3 y 7 — y el 7 no existe.

**La idempotencia de `unirse_sala` va primero.** Si ya estás dentro, se devuelve la sala antes de mirar aforo, saldo o vencimiento: ni una recarga ni un doble clic pueden convertir tu propia sala en un error.

**El anfitrión que sale marca, no borra.** La fila queda con `estado = 'cancelada'`. Un `delete` les llegaría a los demás por Realtime como la desaparición de algo que estaban mirando; marcarla deja que la pantalla diga qué pasó — y por eso la política de SELECT deja ver la sala propia **en el estado que sea** y no sólo mientras espera.

**`random()` y no `gen_random_bytes`, declarado.** El código no es criptográficamente seguro. Es aceptable **aquí y sólo aquí**: vive tres minutos, sólo sirve mientras la sala espera, y el límite de 5/minuto convierte el millón de combinaciones en años de intentos para una puerta que se cierra en tres minutos.

---

## 3. IDI-0 · `t()` con variables

**Firma nueva** — [src/config/textos.js:79](src/config/textos.js#L79): `t(clave, vars = {}, idioma = IDIOMA_POR_DEFECTO)`.

La sustitución vive en una función **exportada aparte**, y ésa es la única desviación de forma respecto al rector §3:

```js
export function interpolar(texto, vars = {}, clave = '') { … }
```

**Por qué se separó:** el diccionario del lobby son 18 rótulos fijos y ninguno lleva un `{` (lo defiende un test nuevo). Probar la sustitución **a través de `t`** habría obligado a sembrar claves de mentira en `textos.es.js`, que es el contrato sellado de LOB-1. Con `interpolar` exportada, la regla se ejercita con el texto que haga falta y el diccionario real no se entera. `t` la llama; el comportamiento del rector es idéntico.

**Lo demás, tal cual se pidió:**
- Patrón `/\{([a-z0-9_]+)\}/g`. Sin `eval`, sin `new Function`.
- Una variable ausente pinta **`⟦nombre⟧`** y avisa una vez, igual que una clave ausente. El guardia marca por `clave#nombre`, así que **dos huecos rotos de la misma cadena avisan los dos**.
- `null` cuenta como ausente; **`0` no** — «0 sentados» es una frase legítima, y confundirlos es el fallo clásico de `||`.
- Retrocompatible: un test recorre las 18 claves y comprueba que `t(clave)` sigue devolviendo exactamente `TEXTOS_ES[clave]`.
- El fallback `⟦clave⟧` que mide `lob.4` del arnés está intacto — y ahora **medido**, no supuesto: §7.5.

**El hook** — [src/hooks/useIdioma.js:60](src/hooks/useIdioma.js#L60) — pasa a `(clave, vars) => traducir(clave, vars, idioma)`. **El `t` que ven las pantallas sigue sin aceptar idioma**, y es deliberado: ése lo pone el hook, que es quien lo conoce.

**Dos llamadas existentes se actualizaron**, las dos en `textos.test.js`: pasaban el idioma como segundo argumento (`t(clave, 'es')`), que ahora es el hueco de `vars`. No hay ninguna otra en todo `src/`.

**Tests:** 22 en el archivo (11 nuevos), incluido el que garantiza que el patrón es estrecho — `{ n }`, `{N}`, `{a-b}` se quedan como literal en vez de convertirse en nombres de variable que nadie va a pasar.

**Ninguna clave `sal.*` se añadió al diccionario.** SAL-B las trae con sus pantallas.

---

## 4. Config y lectores únicos

### 4.1 [src/config/salas.js](src/config/salas.js)

| Símbolo | Valor / comportamiento |
|---|---|
| `APUESTAS_PVP` | `[100, 200, 500, 1000, 2000, 5000]` |
| `BONO_BIENVENIDA` | `1200` — **primera vez que la cifra existe en el árbol** (Fase 0 §5.3 no encontró ninguna) |
| `REGLA_ASIENTO` | `5` |
| `saldoMinimo(a)` · `apuestasAlAlcance(s)` | fórmula, no constante |
| `ALCANCE_NUEVOS` | **`[100, 200]`**, *derivado* de `apuestasAlAlcance(BONO_BIENVENIDA)` |
| `ALFABETO_CODIGO` | 32 símbolos, sin O/0/I/1 |
| `normalizarCodigo(t)` | `'AJ-XXXX'` o `null` |
| `DURACION_SALA_SEG` | `180` |
| **`CODIGO_REGEX`** *(añadido)* | `/^AJ-[A-HJ-NP-Z2-9]{4}$/` — el mismo alfabeto en forma de rango, tal cual viaja en el `check` de la migración |
| **`JUGADORES_PVP`** *(añadido)* | `[2,3,4,5]`, **derivado** de `AJILEI_CONFIG.game.playersMin/Max` |

**`CODIGO_REGEX` existe para que las dos formas del alfabeto no se separen en silencio.** Un test las confronta **en las dos direcciones**: que todo lo del alfabeto pase el rango, y que el rango no acepte nada de más. Una sola dirección no bastaba.

**Tests:** 21. Los que más valen son el borde del 5× (`apuestasAlAlcance(500)` sí, `499` no), el que comprueba que la lista devuelta es **nueva** —sin eso, un `.sort()` de un consumidor reordenaría `APUESTAS_PVP` para toda la app— y el del cuerpo que empieza por `AJ`: `normalizarCodigo('AJKL')` → `'AJ-AJKL'`, porque `A` y `J` están las dos en el alfabeto y mirar sólo las dos primeras letras se comería un cuerpo legítimo. Por eso el prefijo se reconoce por **longitud**.

### 4.2 [src/lib/saldo.js](src/lib/saldo.js)

`saldoDelJugador()` → `AJILEI_CONFIG.economy.saldoInicial`, con el aviso de provisionalidad y el enlace a su espejo `saldo_de()`. **Es el único lector de saldo que SAL puede importar.** Los seis sitios existentes (Fase 0 §5.2) no se tocaron.

Se documenta el punto delicado del contrato: **es síncrona**, y el día que consulte la red devolverá una promesa. Por eso hay un solo consumidor.

> **Una tensión que conviene tener escrita:** `saldoDelJugador()` devuelve **5000** y `BONO_BIENVENIDA` es **1200**. No es una contradicción de esta tanda —el rector pide literalmente las dos cosas— pero significa que **hoy `ALCANCE_NUEVOS` no describe lo que un jugador nuevo vería**: con 5000 alcanza hasta la mesa de 1000, no sólo las dos primeras. La constante del bono existe para ECO-1. Va a §8.

### 4.3 [src/config/salaPendiente.js](src/config/salaPendiente.js)

`guardar` · `leer` · `borrar` sobre `ajilei.salaPendiente`, con `try/catch` en las tres (molde de `readNivel`/`readIdioma`), más `recogerDeLaUrl()`.

**Se normaliza al guardar Y al leer.** No es redundante: entre las dos puede haber pasado cualquier cosa, incluida una mano editando el almacenamiento.

**`localStorage` y no `sessionStorage`**, porque el trayecto puede cruzar de pestaña: el código de seis dígitos llega por correo y en un móvil eso puede significar volver a la app en otra pestaña.

**La limpieza de la URL no es cosmética.** Sin `history.replaceState`, el `?sala=` se queda y vuelve a leerse en cada recarga: una invitación consumida o vencida resucitaría sola cada vez que el jugador refresca. Se usa `replaceState` y no `pushState` para que el botón «atrás» no devuelva al jugador a la invitación fantasma. Un `?sala=` con basura **también se limpia** —aunque no se guarde— por la misma razón.

**Tests:** 14, con el almacenamiento y la barra de direcciones simulados sobre `globalThis.window`, molde exacto de [scripts/testTapetes.test.js:205-220](scripts/testTapetes.test.js#L205). Incluye el caso «sin `window`», que es lo que ocurre en Vitest sin jsdom.

---

## 5. Cliente

### 5.1 El reloj — [relojCore.js](src/hooks/relojCore.js) + [useReloj.js](src/hooks/useReloj.js)

El núcleo **no tiene un solo `Date.now()`**: la hora entra por parámetro en las cuatro funciones. Eso es lo que permite probar el vencimiento de un cronómetro de tres minutos sin esperar tres minutos.

`calcularDesfase` · `ahoraServidor` · `restante` · **`comoReloj`** (añadido: `180 → '3:00'`; vive aquí y no en el componente porque dos implementaciones de esto se separan en el primer caso de borde, que siempre es el 60).

`restante` **nunca es negativo** y redondea **hacia arriba** — con `floor`, el primer fotograma de una sala recién creada diría «2:59» y parecería rota.

**El hook** pide `rpc('ahora')` **una vez** al montar y guarda el desfase en un `ref` (lo leen las funciones, que necesitan el valor vigente) más un `state` (que provoca **un** repintado cuando la medida llega). Si la RPC falla, desfase 0 y **un** aviso en consola.

> **Un fallo real que el test cazó.** `calcularDesfase(null, ahora)` devolvía **−1 788 609 600 000 ms** — cincuenta y seis años. La causa: `new Date(null).getTime()` es `0`, la época de 1970, un número **perfectamente finito**, así que el guardia de `Number.isFinite` sobre el resultado no saltaba. Con una RPC caída que devolviera `null`, **todas las salas habrían nacido vencidas**. Se rechazan `null`, `undefined` y `''` a mano antes de construir la fecha, y hay un test con ese nombre para que nadie deshaga el guardia.

**Lo que la medida NO corrige, declarado en el módulo:** la latencia del viaje. El instante local se toma justo antes de mandar, lo que deja el error acotado por debajo; corregirlo bien exigiría medir ida y vuelta al estilo NTP, y aquí se cuenta una cuenta atrás en segundos enteros donde 200 ms no los ve nadie.

**Tests:** 19, incluido el recorrido completo (teléfono 45 s adelantado → la sala sigue teniendo sus 180 s) y el de la pestaña que vuelve de dormir.

### 5.2 [src/lib/salasApi.js](src/lib/salasApi.js)

`crearSalasApi(cliente = supabase)` devuelve las nueve operaciones más las dos suscripciones. **El singleton sigue siendo el de siempre y nadie llama a `createClient`.**

**Los errores nunca salen crudos.** `traducir()` devuelve `{ data, error }` donde `error` es **siempre** una clave o `null`. Un `P0001` cuyo mensaje **no** esté en `CLAVES_ERROR` cae a `ERROR_INESPERADO` y avisa: es la red contra una función futura que olvide la convención y lance una frase.

**`suscribirAbiertas` va SIN filtro, y es una decisión con motivo:** un filtro de Realtime se aplica a la fila del evento, así que la sala que **sale** de `esperando` —la que más importa quitar del listado— no casaría con `estado=eq.esperando`. El contrato es «algo cambió, vuelve a pedir la lista».

**Las dos suscripciones devuelven la función de BAJA y no el canal**, porque eso es exactamente lo que un `useEffect` sabe devolver sin pensarlo.

**Tests:** 16, con un cliente falso inyectado. **Ninguno abre un socket.** `lib/supabase.js` se sustituye con `vi.mock` (molde de [useCongelado.test.js:26](src/hooks/useCongelado.test.js#L26) con `howler`) porque ese módulo **lanza al importarse** si faltan las variables de entorno — un test que dependiera de `.env.local`, que git ignora, pasaría aquí y reventaría en un clon recién hecho.

### 5.3 Sonidos

`SONIDOS_SALAS = ['chipsCollect', 'cardShuffle', 'tableKnock']` en [useSounds.js](src/hooks/useSounds.js). **Nada se precarga en esta tanda**: no hay todavía pantalla que los dispare.

### 5.4 `cuenta.id` y §5.5 la recogida del `?sala=`

[src/App.jsx:126](src/App.jsx#L126) — `id: auth.perfil?.id ?? null`, el `auth.users.id`. Y un `useEffect(() => { recogerDeLaUrl() }, [])` **arriba, con los demás hooks y antes de las tres guardas de sesión**: se dispara aunque el render haya devuelto `null` por `CARGANDO` o la Portada por `SIN_SESION`, que son exactamente los estados en los que llega alguien invitado por enlace. **Aquí sólo se recuerda**; consumirla es SAL-B.

---

## 6. Desviaciones del rector, todas declaradas

1. **`interpolar` se exporta** además de vivir dentro de `t`. Para poder probar la sustitución sin sembrar claves de mentira en el diccionario sellado.
2. **`es_sala_publica` y `regla_asiento`** son funciones que el rector no nombra. La primera evita que las dos políticas se llamen entre sí; la segunda es la regla 5× viviendo **una sola vez**.
3. **`mi_sala()` llama a `barrer_salas()`**, que el rector §2.3 sólo pedía en otras tres. Motivo: `mi_sala` es justo la llamada del jugador que **vuelve**, y volver después de tres minutos es el caso normal. Sin barrer se le devolvería una sala `'esperando'` que en realidad venció.
4. **`CODIGO_REGEX`, `JUGADORES_PVP` y `comoReloj`** son exportaciones de más, cada una con su motivo escrito en el archivo.
5. **`CLAVES_ERROR` tiene nueve claves y el rector §2.3 enumeraba siete.** Las dos de más son `codigo_invalido` y `no_autenticado` (la guarda de `auth.uid() is null`). Sin la segunda, una sesión caducada produciría una violación de clave foránea y el jugador vería «error inesperado».
6. **El dump del rector §1.3 no se pudo hacer** (§1.2). Se sustituyó por tres vías de lectura que cierran casi todo, y lo que falta está en §1.6 con su bloque de SQL listo para pegar.

---

## 7. Verificación

| # | Qué | Resultado |
|---|---|---|
| 1 | `npm test` | **565 pruebas, 23 archivos, todas verdes.** Antes de la tanda: 483 en 19. **+82** |
| 2 | `npm run build` | **limpio** |
| 3 | `npm run lint` | **21 problemas (20 errores + 1 aviso)** — la línea base **exacta**, medida en el árbol de `1f2a610` con las fuentes nuevas apartadas |
| 4 | Claves de error SQL ≡ cliente | **9 ≡ 9** |
| 5 | Estructura del SQL + push sin error | §2.2 |
| 6 | Censo tras el push | §1.5 — tablas, índices y funciones **verificados**; políticas y publicación en §1.6 |
| 7 | Sondas de permisos | **14 de 14 denegadas a `anon`** (§1.5.4) |
| 8 | `diagDSK lob` | **6/6 celdas · 54 puntos · todo verde · consola limpia** |
| 9 | `diagPUE puerta` | **7/7 · todo verde** |

**Sobre el lint:** dos errores se produjeron y se corrigieron, no se dejaron pasar. `useReloj.js` leía `desfaseRef.current` en el `return` del hook (`react-hooks/refs`, y con razón: el número habría quedado clavado al valor de ese render), y `salaPendiente.js` tenía una asignación inicial que nadie llegaba a leer (`no-useless-assignment`).

### 7.5 Los dos arneses · corridos, no supuestos

**`node scripts/diagDSK.mjs lob`** contra `vite` en 5173 con el bypass:

```
celdas: 6 · veredicto global: true
  640x360    móvil landscape   ok=true  puntos=9  consola=0
  360x640    portrait          ok=true  puntos=9  consola=0
  844x390    móvil landscape   ok=true  puntos=9  consola=0
  1024x768   desktop           ok=true  puntos=9  consola=0
  1366x768   desktop           ok=true  puntos=9  consola=0
  1920x937   desktop           ok=true  puntos=9  consola=0
TODOS LOS PUNTOS VERDES
```

**`node scripts/diagPUE.mjs puerta`** contra `npm run build && vite preview` en 4173, con la puerta viva:

```
VERDE · puerta.0 el contexto es anónimo de verdad · sin token de sesión en localStorage
VERDE · puerta.1 la raíz pinta la Portada · main.portada-lienzo=true · .pue-btn-jugar=true
VERDE · puerta.2 el rotor de escenas está vivo · 5/5 escenas · 1 activa
VERDE · puerta.3 la Bienvenida vieja NO captura al visitante
VERDE · puerta.4 el lobby NO captura al visitante anónimo · main.lobby=false
VERDE · puerta.5 ni la Entrada ni el Bautizo se cuelan
VERDE · puerta.6 consola limpia al cruzar la puerta · sin errores
TODO VERDE — ninguna medición falló
```

**Las dos que importaban de verdad:** `lob` punto 4 mide que el `innerText` no contenga `⟦`, o sea que la firma nueva de `t()` no rompió una sola de las 18 claves del lobby en ninguno de los seis tamaños. Y `puerta.6` mide consola limpia al cruzar la puerta, que es exactamente donde corre el `useEffect` del `?sala=` que esta tanda añadió a `App.jsx`.

**Un aviso del propio arnés, sin consecuencia:** `baselines tomadas con 151.0.4129.93 · vivo 152.0.4191.62`. Edge se actualizó desde la última calibración. Las 54 mediciones pasaron igual, así que las tolerancias aguantan el salto de versión; se anota por si una campaña futura ve una deriva de sub-píxel.

---

## 8. Requiere autorización · y lo que queda abierto

| # | Qué | Estado |
|---|---|---|
| 1 | **Las pruebas A–D** del pie de la migración | **Diferidas a SAL-B.** El bloque de catálogo verificó la *forma* del esquema; A–D verifican el *comportamiento*, y allí se podrán correr con dos sesiones reales en vez de con claims fabricados |
| 2 | **Que `authenticated` sí pueda llamar a las nueve funciones** | No probable sin sesión real (§1.3): sin usuarios anónimos y sin autoconfirmación de correo, Claude Code no puede autenticarse. Lo ejercita SAL-B en su primer arranque |
| 3 | **Las tres ediciones de `gameEngine.js`** (protegido) que la Fase 0 §4.10 dejó pedidas | **Siguen pendientes de tu decisión.** Son de MOT-1, no de esta tanda, pero sin ellas el motor no puede arbitrar una mesa PvP |
| 4 | **`saldoDelJugador()` devuelve 5000 y `BONO_BIENVENIDA` es 1200** | Decisión de producto para ECO-1, no un fallo. §4.2 |
| 5 | **El techo de 200 conexiones de Realtime en el plan Free** | ~40 mesas de cinco a la vez. No bloquea la beta; es el primer límite que se estrecha si crece. §1.5.6 |

---

## 9. Plan de commits · AUTORIZADO

Cinco, tal como el rector §9 los ordena. Victor los autorizó con `AJILEI_SALA_Commits_v1.0.md`, y se ejecutan con este informe dentro del quinto.

**SAL-Aa · IDI-0 variables**
`src/config/textos.js` · `src/hooks/useIdioma.js` · `src/config/textos.test.js`

**SAL-Ab · Config**
`src/config/salas.js` · `src/config/salas.test.js` · `src/lib/saldo.js` · `src/config/salaPendiente.js` · `src/config/salaPendiente.test.js` · `src/App.jsx`

**SAL-Ac · Base**
`supabase/migrations/20260905203158_sal_a_salas.sql` · `supabase/config.toml` · `package.json` · `package-lock.json` · `.gitignore`

**SAL-Ad · Cliente**
`src/hooks/useReloj.js` · `src/hooks/relojCore.js` · `src/hooks/relojCore.test.js` · `src/lib/salasApi.js` · `src/lib/salasApi.test.js` · `src/hooks/useSounds.js`

**SAL-Ae · Informe**
`docs/reportes/AJILEI_SALA_Fase1_Informe_v1.0.md`

> Nota: `docs/reportes/AJILEI_SAL_Fase0_Informe_v1.0.md` sigue **sin commitear** desde la fase anterior, igual que el pie modificado de `AJILEI_LOB1_Fase1_Informe_v1.0.md`. No entran en este plan porque no son de esta tanda; se dejan dichos para que no se pierdan.

---

## 10. `git status --short` · antes de la ceremonia de commits

```
 M .gitignore
 M docs/reportes/AJILEI_LOB1_Fase1_Informe_v1.0.md
 M package-lock.json
 M package.json
 M src/App.jsx
 M src/config/textos.js
 M src/config/textos.test.js
 M src/hooks/useIdioma.js
 M src/hooks/useSounds.js
?? _probeA1.mjs
?? _shotA1.mjs
?? docs/reportes/AJILEI_SALA_Fase1_Informe_v1.0.md
?? docs/reportes/AJILEI_SAL_Fase0_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
?? src/config/salaPendiente.js
?? src/config/salaPendiente.test.js
?? src/config/salas.js
?? src/config/salas.test.js
?? src/hooks/relojCore.js
?? src/hooks/relojCore.test.js
?? src/hooks/useReloj.js
?? src/lib/salasApi.js
?? src/lib/salasApi.test.js
?? src/lib/saldo.js
?? supabase/config.toml
?? supabase/migrations/20260905203158_sal_a_salas.sql
```

Los seis residuos de campañas anteriores siguen intactos. `supabase/.temp/`, `dist/`, `capturas-lob/` y `capturas-pue/` no aparecen: los ignorados funcionan. El dump temporal que se intentó vivía fuera del árbol y no llegó a generarse.

---

## 11. Verificaciones de Victor

Dos, ambas superadas, y las dos cierran cosas que Claude Code no podía medir por sí solo:

- **Bloque de catálogo: 9/9 OK** (Victor, SQL Editor). Cierra la publicación de Realtime —la verificación que el rector §2.4 exige por su nombre—, las dos políticas de lectura y las cero de escritura, el RLS de las tres tablas, `replica identity full` y el censo de `search_path` y `security definer` de las trece funciones. §1.6.
- **Humo del Bautizo: cambio de nombre ida y vuelta con partida en curso, sin error** (Victor). El `revoke` sobre `normalizar_username` no rompió el disparador de SUP-2b. Lo que era razonamiento pasa a ser medición.
- **Plan del proyecto: FREE** (Victor, panel). Cierra la última de las cuatro preguntas de la Fase 0. Sus consecuencias para SAL, en §1.5.6.

---

**STOP.**

Ninguna escritura en Supabase por parte de Claude Code. Ningún archivo protegido abierto —los cinco verificados byte a byte contra `1f2a610`—. Ninguna credencial escrita, impresa ni utilizada.

Cimientos en pie. **Nada visible cambia en producción con esta tanda**: no hay una pantalla nueva, y el botón «Jugar contra jugador» del lobby sigue avisando «Pronto». Lo que existe ahora es el suelo sobre el que SAL-B las construye.
