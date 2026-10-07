# AJILEI · ECO-1 · Fase 1a — Informe: el libro (billetera, movimientos y bono) · v1.0

**Ficha:** `AJILEI_ECO-1_Fase1a_v1.0.md` · **Base:** `main` en `eb378b0` · **Fecha:** 2026-10-07
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** STOP. Sin `git add` ni commits. Sin `db push` ni conexión a la base.

---

## 0. Resumen

> **Actualizado tras la revisión del rector:** los ajustes M-2, M-5 y M-8 están aplicados en la misma migración. Lo cambiado y los resultados están en **§8**. Las cifras de verificación vigentes son **21/21 PASA** en el guion y **52** comprobaciones en verde en el arnés. Las de §0–§7 son las de la primera entrega.

- **Escrito:** una migración nueva (`supabase/migrations/20261007144943_eco1a_libro.sql`, 769 líneas en la primera entrega y 834 tras §8), el guion de verificación (`supabase/pruebas/eco1a_verificacion.sql`), el normativo (`docs/AJILEI_ECO-1_Reglas_v1.0.md`, el Anexo A copiado tal cual) y este informe. No se tocó `src/` ni ningún protegido.
- **Verificado de verdad, no solo leído.** No hay PostgreSQL instalado en la máquina ni Docker. Por eso se instaló **PGlite 0.5.8** (PostgreSQL 18.3 compilado a WebAssembly, en proceso y sin servidor) **en el scratchpad, fuera del repo**. Sobre él:
  - se imitó lo mínimo de Supabase: roles, `auth.users`, `auth.uid()`, privilegios por defecto, publicación `supabase_realtime` y un `rls_auto_enable` de imitación;
  - se aplicaron las **5 migraciones del repo**, se sembraron 4 cuentas y se aplicó la nueva **dos veces**;
  - el guion dio **18/18 PASA** y no dejó rastro, tanto con `begin/rollback` como sin él;
  - las otras **39 comprobaciones** del arnés (roles reales, bordes, sabotaje del bono) salieron todas en verde. Detalle en §3.
- **Tras el `db push`:** las 4 cuentas tendrán 2.500 y `saldo_de` las leerá. **Las mesas PvP de 1.000 HC rebotarán con `saldo_insuficiente`**: el cliente sigue creyendo que hay 5.000 hasta la 1b. Las de 100, 200 y 500 siguen entrando. Detalle en §4.
- **Una posible contradicción entre decisiones (§6, M-1):** D3 da 2.500 a cada una de las 4 cuentas y D2 da un bono por persona. Si dos de esas cuentas comparten correo canónico (la consulta O-11 lo dice), la migración aplica D2 y la más nueva arranca en 0.

---

## 1. Lo escrito y por qué, donde la ficha deja elegir

### 1.1 Archivos

| Archivo | Qué es |
|---|---|
| `supabase/migrations/20261007144943_eco1a_libro.sql` | La migración. Nombre con la convención del repo (14 dígitos, posterior a `20260911230935`). Sin `begin/commit`: la transacción la pone `db push`, como en SAL-A:7-8. |
| `supabase/pruebas/eco1a_verificacion.sql` | El guion para después del push. La carpeta `supabase/pruebas/` no existía; se creó. La CLI no la lee: `db push` solo mira `migrations/`, y `supabase test db` busca `supabase/tests/`. |
| `docs/AJILEI_ECO-1_Reglas_v1.0.md` | El Anexo A, byte a byte (sin la valla de bloque de código). |
| `docs/reportes/AJILEI_ECO-1_Fase1a_Informe_v1.0.md` | Este informe. |

### 1.2 Elecciones

| Punto | Elección | Por qué |
|---|---|---|
| §2.1 a · tipos | **`check`** (`movimientos_tipo_chk`, `:175-180`) | SAL-A eligió `enum` para vocabularios fijos (SAL-A:49-54). Este va a crecer, y el `enum` tiene dos costes: un valor nuevo no se puede **usar** en la misma transacción que lo añade (y `db push` mete cada migración en una), y un valor de `enum` nunca se puede retirar. Con `check`, ampliar es `drop`/`add constraint` en la misma migración que lo usa. La lista vive solo en la restricción: `aplicar_movimiento` traduce su violación a `tipo_invalido`. Escrito en `:150-161`. |
| §2.1 f · resultado de `aplicar_movimiento` | Tipo con nombre **`public.movimiento_resultado (aplicado, saldo, motivo)`** (`:48-76`) | Las sub-tandas siguientes declaran `v_res public.movimiento_resultado`, y un campo mal escrito falla al crear la función. `jsonb` no avisa. Los tres campos van siempre rellenos: el arnés lo comprueba en 13 caminos (§3.3). |
| §2.1 f · orden | El de la ficha **más una repetición del paso 1 tras el bloqueo** («1 bis», `:459-463`) | Sin ella, dos llamadas simultáneas con la misma clave pasan el paso 1, la segunda espera el bloqueo y al entrar choca con la clave única: un `unique_violation` en vez de un «repetido». En READ COMMITTED cada sentencia ve lo ya confirmado, así que la segunda pregunta lo encuentra. Queda además un `exception when unique_violation` (`:493-498`) para el caso de que la clave la escriba **otro** jugador, cuyo bloqueo es distinto. |
| §2.1 f · clave repetida | `repetido` (aplicado = true) **solo si coinciden jugador, tipo y monto**; si no, **`clave_en_uso`** sin aplicar (`movimiento_repetido`, `:519-544`) | Una clave igual con otro monto es un error del llamador, no un reintento. En `repetido`, `saldo` es el saldo **actual** de la billetera (ajuste del rector M-2, §8). |
| §2.1 f · motivos | `aplicado` · `repetido` · `saldo_insuficiente` · `sin_billetera` · `monto_invalido` · `tipo_invalido` · `motivo_obligatorio` · `clave_en_uso` · `argumento_invalido` | `sin_billetera` existe porque `aplicar_movimiento` **no crea billeteras**: eso lo hace solo `abrir_billetera`. |
| §2.1 f · `huella_correo` | `sha256` del núcleo, **calificado `pg_catalog.`** y marcado **`stable`** (`:311-328`) | `sha256(bytea)` está en `pg_catalog` desde PG 11 y no depende de `pgcrypto` ni del esquema `extensions`. Se comprobó que funciona con `search_path = ''` y que su hex coincide con el `sha256` de Node. `stable` porque `convert_to()` lo es en el catálogo (medido: `provolatile = 's'`). |
| §2.1 f · `dia_chicago` | **`immutable`** (`:330-347`) | La zona está fija en el cuerpo y el catálogo marca `timezone(text, timestamptz)` como `immutable` (medido). Lo que se gana: sirve para un índice de expresión («videos de hoy» en la 1e). Lo que cuesta, declarado: si cambian las reglas de horario de Chicago, las fechas ya indexadas no se recalculan. Probado: los dos cambios de horario de 2026, y que no depende del `TimeZone` de la sesión. |
| §2.1 g · `mi_billetera` | **`returns bigint`**, un escalar, con `coalesce(…, 0)` (`:682-700`) | La fila de nulos de A2 nace de que PostgREST expande un **compuesto** nulo con `select * from f()`. Un escalar viaja como número JSON sin expansión, y el `coalesce` impide que sea `null`. Sin sesión, también 0. |
| §2.1 h · bono | La lógica en **`abrir_billetera(uuid)`** (`:547-629`); el disparador `al_crear_perfil` solo la llama (`:631-650`) | El relleno de §2.1 i tiene que hacer «exactamente la misma lógica»: una sola función lo garantiza. Cada paso va en su bloque `exception when others` + `raise warning`, y no hay ningún `raise exception` que salga. Si el bono no se paga, la marca se retira, para que la persona no se quede sin bono para siempre. |
| §2.1 i · relleno | Por antigüedad (`order by created_at`), con un NOTICE de recuento sin uuids (`:653-679`) | Si dos cuentas viejas comparten correo canónico, cobra la primera que se creó (→ M-1). |
| §2.1 j · `saldo_de` | Misma firma y retorno; `least(saldo, 2147483647)::integer` (`:706-725`) | El `least` evita que un saldo por encima del máximo de `integer` haga fallar el cast y, con él, impida sentarse en cualquier mesa. |
| §2.1 k · `ajuste_admin` | Devuelve `movimiento_resultado`; clave `admin:` + `gen_random_uuid()` (`:731-758`) | «Devuelve el saldo nuevo» y «si viene vacío lo dice» caben a la vez en el resultado. **No es idempotente**: dos llamadas son dos ajustes. |
| §2.2 · guion sin rastro | Funciona por dos caminos a la vez: `begin … rollback` **y** una función en `pg_temp` que deshace su propio bloque | El SQL Editor enseña una tabla por lote (0001:233-237). Si la tabla no saliera por ir antes del `rollback`, el camino 2 basta: probado sin `begin/rollback`, también 18/18 y sin rastro. |

### 1.3 Dos cosas que no pide la ficha (→ M-6)

1. **El libro se defiende solo** (`:197-228`). Un disparador rechaza `update`, `delete` y `truncate` sobre `movimientos`, incluso para `postgres` desde el SQL Editor, con la clave `movimientos_inmutable` y una pista hacia `ajuste_admin`.
   - Excepción: el borrado **en cascada** al borrar una cuenta. Llega con `pg_trigger_depth() >= 2` y se deja pasar.
   - Probado: el `update`, el `delete` y el `truncate` a mano se rechazan, y la cascada desde `auth.users` pasa.
2. **Sin privilegios de tabla para el cliente** (`:771-780`). Además del RLS sin políticas, `revoke all` sobre las cuatro tablas a `public`, `anon` y `authenticated`.
   - Supabase concede por defecto todo sobre las tablas nuevas de `public`, y `truncate` no pasa por RLS (PostgREST no lo expone, pero la puerta queda abierta).
   - `service_role` conserva sus privilegios.

---

## 2. Cada punto de §2 y la línea que lo cumple

Líneas de `supabase/migrations/20261007144943_eco1a_libro.sql` (M) y de `supabase/pruebas/eco1a_verificacion.sql` (G).

| Ficha | Exige | Dónde |
|---|---|---|
| a | lista cerrada de 12 tipos y por qué | M:175-180; justificación M:150-161 |
| b | `billeteras` (PK/FK cascade, `saldo bigint` ≥ 0, `actualizada_en`) | M:87-92 |
| c | `movimientos`: columnas, `monto <> 0`, `clave_idem` única, motivo en `ajuste_admin`, índice | M:162-190 (motivo M:185-186; índice M:189-190) |
| d | `bonos_bienvenida` sin FK | M:235-238 |
| e | `intentos_dinero` sin PK, índice | M:249-256 |
| f | `correo_canonico` | M:284-309 |
| f | `huella_correo` (sha256 del núcleo con `search_path=''`) | M:318-328 |
| f | `dia_chicago` y su volatilidad | M:342-347; justificación M:330-341 |
| f | `contar_intento_dinero`: purga, anota, cuenta, sin `raise`, `auth.uid()` | M:361-390 |
| f | `aplicar_movimiento` 1→5 | M:420-513: 1 = `:444-448`, 2 = `:450-457`, 1 bis = `:459-463`, 3 = `:469-472`, 4 = `:474-508`, 5 = `:511` |
| g | `mi_billetera` para `authenticated`, 0 sin billetera, tipo justificado | M:690-700; grant M:800 |
| h | disparador `AFTER INSERT`, definer, billetera, huella, bono, nunca bloquea | M:567-650 |
| h | la cifra 2.500 en un solo sitio | M:267-272 (`bono_bienvenida_hc`); `2500` aparece una sola vez en M (`:272`) |
| i | relleno re-ejecutable | M:661-679 (probado con dos pasadas) |
| j | `saldo_de` con la misma firma y permisos | M:715-725; revoke M:797 |
| k | `ajuste_admin` sin conceder, con motivo obligatorio y clave generada | M:740-758; revoke M:796 |
| l | RLS explícito en las cuatro, fuera de Realtime | M:766-769; Realtime M:803-823 |
| l | convivencia con `rls_auto_enable` | M:761-765 (`enable` es idempotente); probado con un disparador de evento de imitación (§3.1) |
| m | revoke/grant de la casa | M:777-800 |
| 2.2 | un bloque con `begin … rollback` y una tabla `prueba \| resultado \| detalle` | G:34 y G:323; la tabla en G:319-321 |
| 2.2 · 1 | 4 billeteras con 2.500 | G:59-68 |
| 2.2 · 2 | 4 bonos y 4 huellas | G:69-78 |
| 2.2 · 3 | saldo = Σ monto | G:79-94 |
| 2.2 · 4 | clave repetida no paga dos veces | G:164-174 |
| 2.2 · 5 | saldo negativo no aplica (`saldo_insuficiente`) | G:175-184 |
| 2.2 · 6 | `ajuste_admin` sin motivo / con motivo | G:185-195 |
| 2.2 · 7 | `correo_canonico`, los dos ejemplos | G:95-101 |
| 2.2 · 8 | `dia_chicago`, los dos ejemplos | G:102-108 |
| 2.2 · 9 | `saldo_de` = saldo real | G:109-116 y G:196-200 |
| 2.2 · 10 | fuera de Realtime; RLS sin políticas | G:117-130 |
| 2.2 · 11 | permisos de `authenticated` | G:131-142 |
| 2.2 · extra | 12 bono por correo canónico · 14 `mi_billetera` · 15 límite de frecuencia · 16 la transición de §6 · 17 libro inmutable · 18 la marca sobrevive al borrado | G:143-163 y G:201-305; el deshacer, G:306-314 |

---

## 3. Cómo se verificó

### 3.1 El banco de pruebas

- **Motor:** PGlite 0.5.8 (`npm install` en `scratchpad/eco1a/`, fuera del repo; nada entra en `package.json`). Es **PostgreSQL 18.3**; Supabase corre **17.6** (`supabase/.temp/postgres-version`). Nada de lo usado cambia entre las dos versiones (`sha256`, `gen_random_uuid`, `pg_trigger_depth`, `get stacked diagnostics`, tipos compuestos, `revoke`), pero es otra versión y se dice.
- **La imitación de Supabase:**
  - roles `anon`, `authenticated` y `service_role`;
  - `auth.users` con las columnas del andamio de la casa, y `auth.uid()` con el cuerpo de Supabase (lee `request.jwt.claim.sub` o `request.jwt.claims`);
  - `alter default privileges … grant all on tables/functions/sequences to anon, authenticated, service_role`, que es lo que obliga a los `revoke` explícitos;
  - una publicación `supabase_realtime` vacía;
  - un `rls_auto_enable` de imitación (disparador de evento en `ddl_command_end` que activa RLS en cada `CREATE TABLE` de `public`). Se comprobó aparte que se dispara de verdad en PGlite. El cuerpo real de Supabase no se conoce: la consulta O-5 solo dio el nombre.
- **El orden:**
  1. `0001`, SAL-A, A1, A3 y B2, tal cual;
  2. 4 cuentas sembradas con correos variados (Gmail con puntos y `+`, googlemail, Outlook en mayúsculas, Hotmail);
  3. la ECO-1a, **dos veces**;
  4. el guion, con y sin `begin/rollback`;
  5. las pruebas de roles y bordes.

### 3.2 Resultados

| Comprobación | Resultado |
|---|---|
| Antes de ECO-1a, `saldo_de` = 5000 | sí |
| 1.ª pasada | NOTICE `ECO-1a relleno: 4 billeteras con bono, 0 sin bono`; 4 billeteras, 4 movimientos, 4 huellas, Σ = 10.000 |
| 2.ª pasada | recuentos idénticos; NOTICE `0 con bono, 0 sin bono` |
| Guion (con `begin/rollback`) | **18/18 PASA**; los recuentos de las 8 tablas tocadas quedan iguales; la función temporal no queda |
| Guion sin `begin/rollback` | **18/18 PASA**, sin rastro |
| Bautizo **como `authenticated`** (RLS de `profiles` y `EXECUTE` revocado en la función del disparador) | el disparador da 2.500: revocar `EXECUTE` no impide que se dispare |
| `authenticated` llama a `mi_billetera()` | 2500 (llega como número) |
| `authenticated` **no puede**: `aplicar_movimiento`, `ajuste_admin`, `saldo_de`, `contar_intento_dinero`, `abrir_billetera`, `select`/`insert`/`update`/`truncate` en las tablas | 10 de 10 `permission denied` |
| `anon` no puede llamar a `mi_billetera` | `permission denied` |
| §6 como `authenticated` con 2.500 | `crear_sala` de 1.000 → `saldo_insuficiente`; de 500 → entra; `unirse_sala` a una abierta de 1.000 → `saldo_insuficiente` |
| `dia_chicago` y el horario de verano | 08-mar 05:30Z → 07-mar; 09-mar 05:30Z → 09-mar; 01-nov 05:30Z → 01-nov; 02-nov 05:30Z → 01-nov. Con `TimeZone = Asia/Tokyo`, igual |
| `correo_canonico`, casos de borde | `A.B.C+x+y@gmail.com` → `abc@gmail.com`; sin arroba → minúsculas; `null` → `null`; `x@sub.gmail.com` sin tocar |
| Libro inmutable | `update`, `delete` y `truncate` a mano → `movimientos_inmutable`; borrar la cuenta en `auth.users` → su libro se va en cascada |
| **Sabotaje del bono** (una restricción `check (false)` sobre `bonos_bienvenida`) | el perfil se crea; billetera en 0; **la marca no queda**; sale `WARNING: ECO-1a: el bono de … falló (23514 · …); billetera abierta sin bono` |
| Cuenta sin correo | billetera en 0, sin bono, con WARNING |
| Firma de `saldo_de` | `integer` / `p_uid uuid`, igual que antes |

### 3.3 Los motivos de `aplicar_movimiento`, uno por uno

| Llamada | aplicado · saldo · motivo |
|---|---|
| tipo `regalo` | f · 2500 · `tipo_invalido` |
| monto 0 / `null` | f · 2500 · `monto_invalido` |
| clave en blanco | f · 0 · `argumento_invalido` |
| jugador sin billetera | f · 0 · `sin_billetera` |
| `ajuste_admin` sin motivo, por esta vía | f · 2500 · `motivo_obligatorio` |
| +500 con clave k5 | t · 3000 · `aplicado` |
| la misma otra vez | t · 3000 · `repetido` |
| k5 con monto 700 | f · 3000 · `clave_en_uso` |
| k5 desde otra cuenta | f · 2500 · `clave_en_uso` |
| −3000 (deja 0 exacto) | t · 0 · `aplicado` |
| −1 sobre 0 | f · 0 · `saldo_insuficiente` |

Ningún camino devolvió un campo nulo.

### 3.4 Lo que este banco **no** pudo probar

- **Concurrencia.** PGlite es una sola conexión. El «1 bis» y la rama `unique_violation` de `:493-498` están razonados, no ejecutados en paralelo. El `clave_en_uso` entre cuentas se alcanzó por el camino 1, no por esa rama.
- **El cuerpo real de `rls_auto_enable`**, ni el resto del entorno de Supabase: `supabase_admin`, propietarios, GoTrue.
- **El SQL Editor de verdad.** No se sabe si enseña la tabla cuando el `rollback` va detrás. El guion trae la salida de reserva (G:17-21).
- **El `insert into auth.users` del guion contra el GoTrue de hoy.** Es el mismo andamio que pasó el 2026-08-27 (0001:353).
- **Los correos reales de las 4 cuentas** (→ M-1).

---

## 4. Lo que pasa en PvP tras el `db push` (§6 de la ficha), confirmado en el código

**El servidor.** `crear_sala` (A1:157-159) y `unirse_sala` (B2:143-145) comparan `saldo_de(v_uid) < regla_asiento() * apuesta`, con `regla_asiento() = 5` (SAL-A:285-290). Con 2.500:

| Apuesta | Mínimo (5×) | Servidor tras el push |
|---|---|---|
| 100 · 200 · 500 | 500 · 1.000 · 2.500 | entra (en 500, justo: `2500 < 2500` es falso) |
| 1.000 | 5.000 | **`saldo_insuficiente`** |
| 2.000 · 5.000 | 10.000 · 25.000 | `saldo_insuficiente` (ya lo eran con 5.000) |

**El cliente sigue con 5.000.** `saldoDelJugador()` devuelve `SALDO_PROVISIONAL = 5000` (`src/lib/saldo.js:50-54`). La regla 5× del cliente es cortesía, y deja **encendidas** las de 1.000 porque 5 × 1.000 = 5.000 ≤ 5.000:
- `alcanza()`: `src/screens/salasCore.js:61-62`;
- el chip de apuesta: `ArmarMesa.jsx:236-240`;
- la tarjeta de mesa: `SalaOpciones.jsx:296`.

**Lo que ve el jugador al intentar una de 1.000:**
- **Abrir o «Unirme» desde Armar mesa:** `ArmarMesa.jsx:186-187` pinta `sal.armar.nota.5x` (`textos.es.js:113`): «Necesitas 5.000 HC para sentarte a 1.000». La pastilla de saldo de la cabecera sigue diciendo 5.000, así que el mensaje se contradice con lo que el jugador ve (→ M-7).
- **«Unirme» desde la lista de mesas:** `SalaOpciones.jsx:204-206` → `avisar(claveDeError(error))` → «No te alcanza para sentarte a esa mesa.» (`textos.es.js:213`), y relee la lista.
- **Por código privado:** `SalaOpciones.jsx:127-130`, con el error bajo el campo (`:278`).
- La clave está en `CLAVES_ERROR` (`salasApi.js:45-55`), así que nunca cae en `error_inesperado`.

**Lo que no cambia:** contra las IAS todo sigue igual (`saldoSesion` en `App.jsx:206` es solo del cliente), y quien ya está sentado en una mesa en espera no se ve afectado: el saldo solo se mira al entrar.

**Es esperado y temporal:** la 1b conecta `saldoDelJugador()` a `mi_billetera()` y corrige `BONO_BIENVENIDA = 1200` (`src/config/salas.js:44`).

---

## 5. Riesgos

1. **Las mesas PvP de 1.000 rebotan** durante el hueco entre el push y la 1b (§4). Afecta solo a quien pruebe PvP a 1.000 con las 4 cuentas. Victor puede recargar una cuenta de prueba con `ajuste_admin`.
2. **`service_role` conserva `EXECUTE`** sobre `aplicar_movimiento` y `ajuste_admin`: es el privilegio por defecto de Supabase, y los `revoke` de la casa no lo tocan. Es la llave del backend y la necesitarán las Edge Functions del árbitro, pero quien la tenga puede acuñar. → M-3
3. **Borrar una cuenta borra su libro** (`on delete cascade`, como pide §2.1 c). La marca del bono sobrevive, pero la historia contable de esa cuenta desaparece. → M-4
4. **`billeteras.saldo` aún se puede editar a mano** como `postgres` sin dejar línea en el libro. La prueba 3 del guion lo detectaría; el camino correcto es `ajuste_admin`. → M-5. **Resuelto en §8:** un disparador sobre `billeteras` lo impide.
5. **Los WARNING del disparador llevan el uuid del jugador** en los registros de Postgres. Nunca el correo.
6. **La huella es un dato personal** (Reglas §3): hay que mencionarla en la política de privacidad antes de abrir a testers externos.
7. **`dia_chicago` es `immutable`:** un cambio futuro de las reglas de horario de Chicago no recalcularía fechas ya indexadas. Hoy no hay ningún índice.
8. **Vitest tropezó una vez:** la primera corrida de la línea base dio «54 failed, no tests» en 1,95 s, un fallo al cargar los archivos y no en ninguna prueba. Las dos siguientes dieron 54/1.323 en verde. No se tocó nada del cliente entre una y otra; encaja con el tropiezo conocido de la caché `.vite-temp`.

---

## 6. Preguntas al rector

- **M-1 · D3 frente a D2.** Si dos de las 4 cuentas viejas comparten correo canónico, D3 («las 4 arrancan con 2.500») y D2 («una vez por persona») chocan. La migración aplica D2: cobra la más antigua y la otra queda en 0. Además las pruebas 1 y 2 del guion saldrían en FALLA, con las cifras en `detalle`.
  - La consulta **O-11** de la Fase 0 lo dice (`cuentas` frente a `personas`). Si dio 4/4, no hay choque.
  - Si no, ¿se aplica D2, o Victor completa la otra a mano con `ajuste_admin`?
- **M-2 · Qué saldo devuelve un `repetido`.** Hoy devuelve el `saldo_tras` del movimiento original, como dice la ficha. Para que el teléfono pinte lo que hay *ahora* tras un reintento (el video de la 1e), quizá sirva más el saldo actual. ¿Se mantiene? → **Resuelta (§8): el saldo actual.**
- **M-3 · `service_role`.** ¿Se le retira también `EXECUTE` sobre `ajuste_admin`, dejándole solo `aplicar_movimiento` para el árbitro? ¿O se le quita todo hasta MES-PvP?
- **M-4 · El libro de una cuenta borrada.** ¿Se acepta perderlo en cascada, como pide la ficha? La alternativa es `on delete set null`, con `jugador_id` nulo, para conservar la contabilidad.
- **M-5 · ¿Se protege también `billeteras`?** Un disparador que solo deje cambiar `saldo` desde `aplicar_movimiento`, con una marca de transacción, para que no se pueda descuadrar ni siquiera desde el Editor. → **Resuelta (§8): sí.**
- **M-6 · Los dos extras de §1.3** (libro inmutable por disparador y `revoke all` de tablas). ¿Se quedan?
- **M-7 · El hueco hasta la 1b.** Durante el hueco, «Necesitas 5.000 HC para sentarte a 1.000» se lee junto a una cabecera que dice 5.000. ¿Se avisa a los testers, o la 1b va pegada al push?
- **M-8 · Límite de frecuencia en `mi_billetera`.** No lo lleva: es lectura y anotar en cada lectura sería escribir en cada arranque. Las Reglas §7 dicen «toda función de dinero». ¿Cuenta una lectura como función de dinero? → **Resuelta (§8): no; las Reglas §7 lo dicen ahora.**

---

## 7. Varas al cierre y STOP

| Comprobación | Resultado |
|---|---|
| Escrituras en el repo | la migración, el guion (carpeta nueva `supabase/pruebas/`), el normativo y este informe. **Sin `git add` ni commits** |
| `src/` y protegidos | sin tocar |
| Base de datos real | ni `db push`, ni conexión, ni consultas |
| PGlite | instalado en `scratchpad/eco1a/` (fuera del repo); su `node_modules` no es una unión, no hubo copias de trabajo ni worktrees (`git worktree list`: solo `main`) |
| Línea base | **vitest 54 archivos / 1.323 pruebas en verde** (en la 2.ª y la 3.ª corrida; la 1.ª tropezó al cargar, §5-8) · **lint 21 problemas (20 errores, 1 aviso)** · **build correcto** (con el aviso de chunk > 500 kB de siempre) |
| Puertos 4170–5599 a la escucha | `svchost` en el 5040, y **`adb.exe` en el 5037** (Android SDK, PID 22884, arrancado a las 11:12, antes de esta tanda: no es de aquí y no se tocó) |
| Procesos `node` vivos | ninguno |
| `git status` | `?? docs/AJILEI_ECO-1_Reglas_v1.0.md`, `?? docs/reportes/AJILEI_ECO-1_Fase1a_Informe_v1.0.md`, `?? supabase/migrations/20261007144943_eco1a_libro.sql`, `?? supabase/pruebas/` · más `?? docs/reportes/AJILEI_ECO-1_Fase0_Informe_v1.0.md` (de la Fase 0, aún sin commit) · más los 5 residuos de siempre (los dos informes de MOT-1 y `laminas/mon1/{_entorno.txt, lamina.html, tiempos.json}`) |

**Siguiente, según la ficha §5:**
1. el rector revisa;
2. Victor hace el `db push` y corre `supabase/pruebas/eco1a_verificacion.sql`, que debe dar **21 filas** en PASA;
3. ceremonia de commit.

---

## 8. Ajustes del rector

Revisión del rector sobre la primera entrega, sin errores. Pidió tres ajustes en la **misma** migración, que aún no se ha aplicado. Igual que antes: sin `db push`, sin conexión a la base y sin tocar `src/`.

### 8.1 Lo cambiado

| Ajuste | Qué | Dónde |
|---|---|---|
| **M-2** · `repetido` da el saldo actual | `movimiento_repetido` lee el saldo de la billetera una vez (`v_actual`) y lo devuelve en `repetido` y en `clave_en_uso`; ya no devuelve el `saldo_tras` del original. Comentarios al día en el tipo y en la cabecera de `aplicar_movimiento`. | M:56-57 (tipo), M:411-415 (cabecera), M:519-544 (función) |
| **M-5** · la billetera solo se mueve por el libro | `aplicar_movimiento` pone `set_config('ajilei.libro', 'si', true)` justo antes del `update` de `billeteras` y la deja en `''` justo después. Si el bloque se deshace, la marca se deshace con él (los GUC son transaccionales). | M:475-487 |
| | Disparador **`billeteras_solo_por_libro`**: <br>· **UPDATE:** si cambia `saldo` sin la marca, `raise exception 'billetera_solo_por_libro'` con `hint` hacia `ajuste_admin`; cambiar solo `actualizada_en` está permitido. <br>· **INSERT:** solo con saldo 0. <br>· **DELETE:** solo en cascada (`pg_trigger_depth() >= 2`). <br>· **TRUNCATE:** nunca. <br>Una sola función con cuatro `hint` distintos y la misma clave. | M:97-147 |
| | `EXECUTE` de la función del disparador, revocado a `public`, `anon` y `authenticated` | M:795 |
| **M-8** · Reglas §7 | La línea queda, palabra por palabra: «Límite de frecuencia por minuto en toda función que mueve dinero (las lecturas, como mi_billetera, no lo llevan), sin raise al anotar.» | `docs/AJILEI_ECO-1_Reglas_v1.0.md:37` |
| Guion | Tres filas nuevas, en el mismo bloque y sin rastro: <br>· **19** `update` manual del saldo, rechazado. Va justo después de un `aplicar_movimiento`, así que de paso prueba que la marca no se quedó puesta. <br>· **20** un `repetido` tras otro movimiento devuelve el saldo actual. <br>· **21** `insert` manual con saldo ≠ 0, rechazado. El BEFORE INSERT salta antes que la clave primaria, así que el rechazo que se lee es el del libro. | G:238-273 |

**Límite declarado de la marca:** es una guarda contra el error, no una frontera de seguridad. Quien tiene SQL puede poner `ajilei.libro` a mano. El cliente no tiene SQL ni privilegios de tabla (§1.3), así que para él no cambia nada. Escrito también en M:109-111.

**Compatibilidad comprobada:**
- `abrir_billetera` sigue funcionando: inserta en 0 y el bono entra por `aplicar_movimiento`.
- El relleno, igual.
- `ajuste_admin` también: su saldo nuevo sale en el resultado.
- La cascada al borrar una cuenta se lleva billetera y libro.

### 8.2 Resultados, repetidos de cero en PGlite

El mismo recorrido de §3.1: las 5 migraciones, 4 cuentas y la migración **dos veces**.

| Comprobación | Resultado |
|---|---|
| 1.ª pasada | `ECO-1a relleno: 4 billeteras con bono, 0 sin bono`; 4 / 4 / 4, Σ = 10.000 |
| 2.ª pasada | recuentos idénticos, `0 con bono, 0 sin bono` |
| Guion con `begin/rollback` | **21/21 PASA**, sin rastro, la función temporal no queda |
| Guion sin `begin/rollback` | **21/21 PASA**, sin rastro |
| Las 39 comprobaciones de §3 | las 39 en verde |
| **Nuevas (13)** | todas en verde: <br>· `ajuste_admin` con la guarda puesta → aplicado, 12.500 <br>· `repetido` tras otros movimientos → saldo actual (0, no los 3.000 de entonces) <br>· `update` manual del saldo como `postgres` → `billetera_solo_por_libro` <br>· `update` que solo toca `actualizada_en` → permitido <br>· `insert` con 999 sobre una billetera existente → `billetera_solo_por_libro` (antes que la PK) <br>· `delete` manual → rechazado <br>· `truncate … cascade` → rechazado <br>· en una transacción, `aplicar_movimiento` aplicado y luego `update` manual → rechazado (la marca no queda) <br>· lo mismo con un movimiento deshecho por tipo inválido → rechazado <br>· marca vacía fuera de `aplicar_movimiento` <br>· borrar la cuenta → su billetera se va en cascada <br>· `EXECUTE` del disparador revocado a `authenticated` <br>· al final de todo, `saldo = Σ monto` en todas las billeteras |
| **Total** | **52 comprobaciones del arnés + 21/21 del guion, todo en verde** |

Lo que el banco sigue sin poder probar es lo mismo de §3.4: la concurrencia, el `rls_auto_enable` real, el SQL Editor real y el GoTrue de hoy.

### 8.3 Varas y STOP, tras los ajustes

| Comprobación | Resultado |
|---|---|
| Línea base | **vitest 54 archivos / 1.323 pruebas en verde** (a la primera) · **lint 21 problemas (20 errores, 1 aviso)** · **build correcto** |
| Escrituras | la migración y el guion (editados), el normativo (§7, una línea) y este informe (§0, referencias de línea al día en §1–§2, preguntas M-2/M-5/M-8 marcadas como resueltas, esta §8). **Sin `git add` ni commits** |
| `src/`, protegidos y base real | sin tocar |
| Puertos 4170–5599 | `svchost` en el 5040 y `adb.exe` en el 5037 (el de Victor, ver §7) |
| Procesos `node` vivos | ninguno |
| Copias de trabajo | ninguna; PGlite sigue en el scratchpad, fuera del repo |
| `git status` | igual que en §7: los 4 archivos nuevos de ECO-1a, el informe de la Fase 0 y los 5 residuos de siempre |

---

## 9. Corrida real

**Fecha:** 2026-10-07. La hizo Victor contra el proyecto de Supabase.

| Paso | Resultado |
|---|---|
| `npx supabase db push` (CLI v2.116.0) | «Finished supabase db push» |
| `supabase/pruebas/eco1a_verificacion.sql` en el SQL Editor | **21/21 PASA** |

Detalles clave de la tabla del guion:
- **1** · 4 billeteras, las 4 con 2.500.
- **2** · 4 movimientos `bono_bienvenida` y 4 huellas en `bonos_bienvenida`.
- **3** · 0 billeteras descuadradas: `saldo = Σ monto` en todas.
- **16** · la regla 5× ya mira el saldo real: mesa de 1.000 → `saldo_insuficiente`; mesa de 500 → entró.

**Lo que esto cierra:**
- **M-1 no llegó a darse.** Las 4 cuentas cobraron sus 4 bonos con 4 huellas distintas, así que ningún par compartía correo canónico, y D2 y D3 no chocaron.
- **§3.4 queda confirmado en la base real** en lo que el banco no podía ver: el `insert into auth.users` del guion funciona contra el GoTrue de hoy, el SQL Editor enseñó la tabla y la migración convivió con el `rls_auto_enable` real. La concurrencia sigue sin probarse.

**La migración no se edita.** Su línea «CORRIDA REAL · pendiente» se queda como está, porque el archivo ya está aplicado. La corrida queda anotada aquí.
