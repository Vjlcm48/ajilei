# AJILEI · SAL-B2 · Fase 1a · Informe · v1.0
## Migración `sal_b2`, `asientosDe`, `LLENA_SEG`, núcleo puro y cronómetro — STOP para `db push`

**Ficha:** `AJILEI_SAL-B2_Fase1a_v1.0.md`. **Diagnóstico rector:** `docs/reportes/AJILEI_SAL-B2_Fase0_Informe_v1.0.md` (leído entero antes de empezar).
**Punto de partida:** `main` en `e037db0`. **Fecha:** 2026-09-11.
**Estado al cerrar:** sin commits, sin push, sin `db push`. La migración espera a Victor (§5).

---

## 1 · Archivos

**Creados**

| Archivo | Líneas | Qué es |
|---|---|---|
| `supabase/migrations/20260911230935_sal_b2.sql` | 373 | `unirse_sala` v5 (:51-174), `salir_sala` v2 (:186-222), `salas_abiertas` v2 (:228-254), Grupos A (:263-273) y B (:275-368) comentados |
| `src/screens/salaEsperaCore.js` | 163 | Núcleo puro: `inicialDe` (:37), `sillasDe` (:42), `resumenDe` (:68), `finDe` (:99), `posicionSilla` (:120), `URGE_SEG`/`urge` (:136-140), `siguienteConsejo` (:145), `ORIGEN_ENLACE`/`enlaceDeSala` (:158-162) |
| `src/screens/salaEsperaCore.test.js` | 269 | 38 pruebas |
| `src/hooks/useCronometroSala.js` | 150 | `creaCronometro` (:49, el controlador puro) y `useCronometroSala` (:120, el hook) |
| `src/hooks/useCronometroSala.test.js` | 203 | 16 pruebas |
| `docs/reportes/AJILEI_SAL-B2_Fase1a_Informe_v1.0.md` | — | este informe |

**Editados (aditivo)**

| Archivo | Cambio | Líneas |
|---|---|---|
| `src/lib/salasApi.js` | Comentario de `ahora()` corregido («La usa `useCronometroSala`»); método nuevo `asientosDe` con su bloque de motivo | :130-135; :223-268 |
| `src/lib/salasApi.test.js` | `describe('SAL-B2 · asientosDe')`, 6 pruebas con un cliente falso con tabla | :379-470 |
| `src/config/salas.js` | `LLENA_SEG = 10` junto a `DURACION_SALA_SEG`, con su comentario espejo | :131-139 |

`git diff --stat` de los editados: 3 archivos, 155 inserciones, 1 borrado (la línea del comentario falso). Intocables de la ficha §0.2 sin tocar: `useReloj.js`, `relojCore.js`, `SalaEspera.jsx`, `App.jsx`, `src/styles/*.css`, `textos.es.js`, `salasFixtures.js`, `diagSAL.mjs` no aparecen en `git status`.

---

## 2 · La migración, bloque a bloque

Molde de A3: cabecera con motivo, `create or replace` que conserva grants, sin función nueva, Grupos A/B comentados al final. Cuerpos copiados verbatim de la versión vigente que identificó el informe de Fase 0 §2.2; cada bloque nuevo lleva `-- SAL-B2:`.

**2.1 · `unirse_sala` v5** (:51-174; vigente anterior: A3:25-135). Un solo bloque nuevo, entre el `insert` del asiento y el `return` (:159-169):

```sql
  if (select count(*) from public.sala_jugadores where sala_id = v_sala.id) = v_sala.jugadores then
    update public.salas
       set expira_en = least(expira_en, now() + interval '10 seconds')
     where id = v_sala.id
     returning * into v_sala;
  end if;
```

`least` nunca alarga; `returning * into v_sala` hace que la fila devuelta lleve ya la cuenta corta (el cliente la pinta sin esperar al evento). El recuento es seguro porque la fila de `salas` está bloqueada por el `for update` de arriba. Las ramas de código falso, mesa muerta, reentrada, `ya_en_sala`, saldo y `sala_llena` son las de A3, comentarios incluidos. Nadie «arranca por llena»: cuando `expira_en <= now()` con ≥ 2, `barrer_salas`/`resolver_sala` hacen lo que ya hacían.

**2.2 · `salir_sala` v2** (:186-222; vigente anterior: SAL-A:632-657). Una variable (`v_llena boolean`, :197) y un bloque en la rama del invitado (:209-219):

```sql
    v_llena := (select count(*) from public.sala_jugadores where sala_id = p_sala) = v_sala.jugadores;
    delete from public.sala_jugadores where sala_id = p_sala and jugador_id = v_uid;
    if v_llena and v_sala.estado = 'esperando' then
      update public.salas
         set expira_en = greatest(expira_en, creada_en + interval '3 minutes')
       where id = p_sala;
    end if;
```

Se mide «llena» antes de borrar. `creada_en + 3 minutes` es el plazo original (default de SAL-A:97); `greatest` nunca acorta. La rama del anfitrión no cambia. El `select … for update` sobre `salas` ya existía y es lo que serializa esta función frente a `unirse_sala`. Nota sobre la ficha §3.2: el texto de la ficha escribía `auth.uid()` en el `delete`; se conserva `v_uid`, que es el verbatim de SAL-A y vale lo mismo.

**2.3 · `salas_abiertas` v2** (:228-254; vigente anterior: SAL-A:709-731). Una condición más en el `where` (:249): `and (select count(*) …) < s.jugadores`. Firma y columnas idénticas.

**2.4 · `crear_sala` no se toca** (ficha §3.4). Motivo en la cabecera de la migración (:37-43): mientras la llena espera su cuenta corta, el índice parcial `salas_abierta_unica_idx` impide crear otra de la misma combinación; si `crear_sala` dejara de encontrarla, el `insert` devolvería `unique_violation`, que el cliente no traduce. Con el cuerpo actual rebota con `sala_llena`, que ya tiene texto. El Grupo B lo verifica (filas 5 y 6).

**2.5 · Grupo A, verbatim** (:263-273):

```sql
select position('interval ''10 seconds''' in pg_get_functiondef('public.unirse_sala(text, uuid)'::regprocedure)) > 0 as unirse_corta,
       position('greatest(expira_en'       in pg_get_functiondef('public.salir_sala(uuid)'::regprocedure))       > 0 as salir_restituye,
       position('< s.jugadores'            in pg_get_functiondef('public.salas_abiertas()'::regprocedure))       > 0 as abiertas_sin_llenas;

select has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute') as unirse,
       has_function_privilege('authenticated', 'public.salir_sala(uuid)',        'execute') as salir,
       has_function_privilege('authenticated', 'public.salas_abiertas()',        'execute') as abiertas;
```

Esperado: `true, true, true` y `true, true, true`.

**2.6 · Grupo B, verbatim** (:275-368). Tres usuarios fabricados (`b2b2b2b2-…-000000000001/2/3`, usernames `SalaB2Uno/Dos/Tres`), borrados al final con el cascade de `auth.users`:

```sql
do $b2$
declare
  UNO  uuid := 'b2b2b2b2-0000-4000-8000-000000000001';   -- anfitrión
  DOS  uuid := 'b2b2b2b2-0000-4000-8000-000000000002';   -- invitado
  TRES uuid := 'b2b2b2b2-0000-4000-8000-000000000003';   -- el que llega tarde
  s1   public.salas;
  s2   public.salas;
  r    public.salas;
  got  text;
  n    integer;
begin
  drop table if exists _b2_res;
  create temp table _b2_res (orden int, prueba text, esperado text, obtenido text);
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values (UNO,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'b2_uno@prueba.local',  '', now(), now(), '{}', '{}'),
         (DOS,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'b2_dos@prueba.local',  '', now(), now(), '{}', '{}'),
         (TRES, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'b2_tres@prueba.local', '', now(), now(), '{}', '{}');
  insert into public.profiles (id, username) values (UNO, 'SalaB2Uno'), (DOS, 'SalaB2Dos'), (TRES, 'SalaB2Tres');

  -- 1 · el anfitrión abre una ABIERTA de 2 → expira_en ≈ now() + 3 min
  perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
  s1 := public.crear_sala('abierta', 2::smallint, 100);
  insert into _b2_res values (1, 'nace con 3 minutos', 'true',
    (s1.expira_en between now() + interval '2 minutes 59 seconds' and now() + interval '3 minutes 1 second')::text);

  -- 2 · el invitado se sienta → mesa llena → expira_en ≤ now() + 10 s, y la
  --     fila devuelta ya lo trae
  perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
  r := public.unirse_sala(null, s1.id);
  insert into _b2_res values (2, 'llena: la fila devuelta trae la cuenta corta', 'true',
    (r.expira_en <= now() + interval '10 seconds')::text);
  insert into _b2_res values (3, 'llena: y la tabla también', 'true',
    ((select expira_en from public.salas where id = s1.id) <= now() + interval '10 seconds')::text);

  -- 4 · salas_abiertas() no la lista
  select count(*) into n from public.salas_abiertas() a where a.id = s1.id;
  insert into _b2_res values (4, 'llena: fuera del listado', '0', n::text);

  -- 5 · un tercero pide la misma combinación → sala_llena, sin mesa nueva (rector §3.4)
  perform set_config('request.jwt.claims', json_build_object('sub', TRES)::text, true);
  begin
    perform public.crear_sala('abierta', 2::smallint, 100);
    got := 'NO FALLO';
  exception when others then got := sqlerrm;
  end;
  insert into _b2_res values (5, 'tercero: sala_llena', 'sala_llena', got);
  select count(*) into n from public.salas
   where tipo = 'abierta' and estado = 'esperando' and jugadores = 2 and apuesta = 100;
  insert into _b2_res values (6, 'tercero: no creó otra', '1', n::text);

  -- 7 · el invitado sale → expira_en vuelve a creada_en + 3 min; y se lista otra vez
  perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
  perform public.salir_sala(s1.id);
  insert into _b2_res values (7, 'sale uno: reloj restituido', 'true',
    ((select expira_en = creada_en + interval '3 minutes' from public.salas where id = s1.id))::text);
  select count(*) into n from public.salas_abiertas() a where a.id = s1.id;
  insert into _b2_res values (8, 'sale uno: vuelve al listado', '1', n::text);

  -- 9 · vuelve a entrar → llena → corto; se fuerza el vencimiento y
  --     resolver_sala arranca la mesa
  r := public.unirse_sala(null, s1.id);
  update public.salas set expira_en = now() - interval '1 second' where id = s1.id;
  r := public.resolver_sala(s1.id);
  insert into _b2_res values (9, 'llena y vencida: activa con iniciada_en', 'activa',
    case when r.estado = 'activa' and r.iniciada_en is not null then 'activa' else coalesce(r.estado::text, 'NULL') end);

  -- 10 · el anfitrión sale de OTRA mesa llena → cancelada y expira_en intacto
  perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
  s2 := public.crear_sala('privada', 2::smallint, 100);
  perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
  r := public.unirse_sala(s2.codigo);
  perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
  perform public.salir_sala(s2.id);
  insert into _b2_res values (10, 'anfitrión sale de una llena: cancelada, reloj intacto', 'cancelada|true',
    (select estado::text || '|' || (expira_en = r.expira_en)::text from public.salas where id = s2.id));

  delete from auth.users where id in (UNO, DOS, TRES);
end
$b2$;

select orden, prueba, esperado, obtenido,
       case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
  from _b2_res order by orden;
```

Diez filas, todas `OK`. Un detalle que hace determinista la fila 7: el bloque `do` es una sola transacción y `now()` no avanza dentro de ella, así que `creada_en`, el `now() + 3 min` del default y el `creada_en + 3 minutes` de la restitución son el mismo instante exacto; la igualdad es estricta a propósito. La fila 10 compara contra el `expira_en` que devolvió `unirse_sala` del invitado (la cuenta corta), y espera que el anfitrión al cancelar lo deje tal cual.

---

## 3 · Lo que queda del lado del cliente

**3.1 · `salasApi.asientosDe(salaId)`** (`salasApi.js:248-268`). Consulta exacta: `from('sala_jugadores').select('asiento, jugador_id, profiles(username)').eq('sala_id', salaId).order('asiento')`. Devuelve `{ data: [{ asiento, jugadorId, username }], error }`; `username` es `null` si la incrustación no llegó (tolera objeto y array de uno); sin filas devuelve `[]`, nunca `null`; el error pasa por `traducir` como el resto. El comentario (:223-247) deja escrito por qué no hace falta SQL (RLS de `profiles` `using (true)`, RLS de `sala_jugadores`, FK a `profiles`) y corrige la afirmación errónea del informe de B1. Seis pruebas (`salasApi.test.js:384-470`): consulta mandada, forma devuelta, sin reordenar, incrustación ausente, vacío, error del SDK.

**3.2 · `LLENA_SEG = 10`** (`salas.js:139`), con el mismo estilo de comentario que `DURACION_SALA_SEG`: espejo del `interval '10 seconds'` de la migración; «si cambia uno, cambia el otro». Hoy lo consumen las pruebas del núcleo y del hook; F1b lo usará en las fixtures.

**3.3 · `salaEsperaCore.js`** (163 líneas, 38 pruebas). Las siete funciones de la ficha §6 más una auxiliar exportada (`inicialDe`) y dos constantes (`URGE_SEG`, `ORIGEN_ENLACE`):

| Función | Contrato sellado por prueba |
|---|---|
| `sillasDe(sala, asientos, uid)` | Una entrada por plaza (`sala.jugadores`), cada fila en SU número de asiento; `esAnfitrion` por `anfitrion_id`, `esTu` por `uid`; vacía → `{ username: null, inicial: null, vacia: true }`; sentado sin username → `inicial: '?'` |
| `resumenDe(sala, asientos, uid)` | `{ esAnfitrion, sentados, jugadores, llena, puedeJugarYa }`; `puedeJugarYa` = anfitrión ∧ ≥ 2 ∧ ¬llena |
| `finDe(sala, resuelta)` | tabla del informe §7.5-5; la fila resuelta manda; resuelta `'esperando'` → `null` |
| `posicionSilla(i, n, rx, ry, cx=0, cy=0)` | ángulo de la lámina (`-π/2 + 2πi/n`, horario); `arriba = sin < -0.01`; devuelve desplazamiento respecto al centro, o posición absoluta si se pasan `cx`/`cy` |
| `urge(segundos, llena)` | `≤ 30 ∧ ¬llena`; `NaN` no urge |
| `siguienteConsejo(i, total)` | circular; total inválido → 0 |
| `enlaceDeSala(codigo)` | `https://ajilei.io/?sala=AJ-XXXX` construido con `PARAM_SALA` de `salaPendiente.js`; `null` sin código |

**3.4 · `useCronometroSala.js`** (150 líneas, 16 pruebas). Sigue la ficha §7 punto por punto: `api.ahora()` una sola vez al arrancar (`creaCronometro.arranca`, :72-90; nunca el singleton), `calcularDesfase` de `relojCore`, latido de 1 s con handle y limpieza (`para`, :98-101), recálculo contra el reloj corregido en cada pulso (no resta), `cambiaExpira` (:92-95) recalcula en el acto, `texto = comoReloj(segundos)`, sin disparar nada al llegar a cero. Sin `console.warn` cuando `ahora()` falla: `medido: false` ya lo dice y el arnés exige consola limpia.

**El método de prueba, declarado.** No hay `renderHook`, `@testing-library` ni jsdom en el proyecto (`grep` en `src` y `package.json`), y la ficha prohíbe instalar. La receta que la casa SÍ tiene para hooks es la de `useCongelado` (`creaCongelador` + hook que solo ejecuta): el controlador puro `creaCronometro` recibe `now`, `setInterval`, `clearInterval` y `periodoMs` por parámetro y se sella con `vi.useFakeTimers()` (que falsea `Date` y los temporizadores a la vez). Las 16 pruebas cubren: estado inicial sin medir, una sola llamada a `ahora()` y desfase aplicado (positivo y negativo), fallo de `ahora()` → `medido: false` y desfase 0, dato vacío sin `NaN`, medida que llega tarde y medida que llega tras `para()`, cuenta hacia abajo, pestaña que vuelve de dormir (100 s sin pulsos → el siguiente dice la verdad), nunca negativo, `para()` sin avisos posteriores, doble `arranca()` sin doble latido, `cambiaExpira` inmediato (corta y restituida), con desfase, ilegible → 0, y temporizadores inyectados. Lo que queda fuera del sello es el espejo de React (`useState` reflejando lo que el controlador avisa, `useCronometroSala.js:120-149`), que no decide nada. Se plantea en §6.

---

## 4 · Cifras

| Qué | Resultado | Línea base |
|---|---|---|
| `npx eslint .` | **21** (20 errores, 1 aviso), los mismos 21 | 21 |
| `npm test` | **678 / 678** en 26 archivos | 618 / 24 archivos |
| Pruebas nuevas | +60: `salasApi.test.js` +6 (31 → 37), `salaEsperaCore.test.js` 38, `useCronometroSala.test.js` 16 | — |
| `npm run build` | limpio (aviso de tamaño de chunk preexistente); `dist/` sin `simulacionSalas`, `ESTADOS_SAL` ni nombres de estado | — |
| `node scripts/diagSAL.mjs sal` | **66 / 66** celdas, `sal.0` ok (playwright-core 1.62.1, Chromium 152.0.4191.66) | 66 / 66 |
| Protegidos (`git diff e037db0` sobre los cinco) | vacío, al inicio y al final | — |
| Sin seguimiento al terminar | los seis residuos conocidos + el informe de Fase 0 (aún sin commit) + los cinco archivos nuevos de esta tanda | — |

El arnés corrió contra `vite` en `5173` con `VITE_AUTH_BYPASS=1` de `.env.local`, levantado y apagado por esta tanda.

---

## 5 · Lo que Victor hace ahora

1. `npx supabase db push` desde la raíz del repo. Aplica solo `20260911230935_sal_b2.sql` (las anteriores ya están).
2. En el SQL Editor, consulta guardada «SAL-B2 · verificación»: pegar el **Grupo A** (§2.5). Esperado: una fila `true, true, true` y otra `true, true, true`.
3. Pegar el **Grupo B entero** (§2.6), de una vez. Esperado: diez filas con veredicto `OK`. Si el `insert into auth.users` falla por columnas de GoTrue, lo que falla es el andamio, no el esquema (el Grupo A ya validó las definiciones).
4. Anotar fecha y resultado en el bloque `CORRIDA REAL · pendiente` al final de la migración (es el único cambio que la migración admite después del push: un comentario).
5. Con A y B en verde, se redacta la ficha de F1b.

Sin `db push` no hay nada que probar con teléfonos: F1a no toca pantallas.

---

## 6 · Dudas y «requiere autorización»

1. **Método de prueba del hook.** La ficha §7 decía «`@testing-library/react` solo si ya está en `package.json`; si no está, para y pregunta». No está. Se optó por la receta existente de la casa (`useCongelado`: controlador puro + hook que solo ejecuta) en vez de parar, porque es la misma que sellaron FRZ-1, CEL y coreografía y no instala nada. Si Victor prefiere `renderHook`, es una dependencia nueva y una decisión suya.
2. **`posicionSilla` devuelve desplazamiento respecto al centro** (con `cx`/`cy` opcionales para la posición absoluta). La lámina suma `W/2, H/2` en la pantalla; aquí los radios y el centro son medidas del DOM que F1b tendrá y el núcleo no. Contrato a confirmar antes de F1b.
3. **`inicialDe`**: sentado sin username → `'?'`; silla vacía → `inicial: null` (la lámina no pinta inicial en la vacía). La ficha decía «`?` si no hay username» sin distinguir; se interpretó como «sentado sin nombre».
4. **`finDe`**: cuando hay fila resuelta, manda ella (es el hecho más reciente); una resuelta `'cancelada'` sobre una fila conocida `'cancelada'` da `'vencida'`. Si Victor prefiere que la fila conocida `'cancelada'` gane siempre (el anfitrión cerró antes de que el reloj local llegara a cero), es un cambio de dos líneas.
5. **`eslint-disable-next-line react-hooks/exhaustive-deps`** en `useCronometroSala.js:142`: `expiraEn` se omite a propósito de las dependencias del efecto que mide y arranca (lo atiende el segundo efecto). Lint sigue en 21; la directiva no cuenta como aviso. Es el único `eslint-disable` que esta tanda añade.
6. **Migración, fila 7 del Grupo B**: la igualdad `expira_en = creada_en + 3 minutes` es estricta y depende de que el default de `expira_en` siga siendo `now() + interval '3 minutes'` (SAL-A:97). Si un día cambia el default, cambia la restitución y esta fila.
7. **Ficha §3.2**: el `delete` se dejó con `v_uid` (verbatim de SAL-A) y no con `auth.uid()` como escribía la ficha; son el mismo valor.

Ninguna de las siete bloquea el `db push`.

---

## 7 · Tiempo real

≈ 50 min (lectura del informe de Fase 0 y de las recetas de prueba, migración, API, núcleo, hook, pruebas, lint, test, build, arnés e informe). La única prueba que falló en la primera corrida fue una expectativa mía sobre la mesa de 5 (con el ángulo de la lámina quedan tres sillas arriba, no dos); se corrigió la prueba, no el código.

**STOP.** Sin commits, sin push, sin `db push`.

---

## Corrida real · 2026-09-11

Añadido en F1b (rector F1b §10), con lo que Victor reportó tras `npx supabase db push` de `20260911230935_sal_b2.sql` en producción. La nota `CORRIDA REAL · pendiente` de la migración no se edita (criterio de A3).

**Grupo A** — dos filas: `unirse_corta = true, salir_restituye = true, abiertas_sin_llenas = true` y `unirse = true, salir = true, abiertas = true`.

**Grupo B** — diez filas, todas `OK`:

| Orden | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 1 | nace con 3 minutos | `true` | `true` |
| 2 | llena: la fila devuelta trae la cuenta corta | `true` | `true` |
| 3 | llena: y la tabla también | `true` | `true` |
| 4 | llena: fuera del listado | `0` | `0` |
| 5 | tercero: sala_llena | `sala_llena` | `sala_llena` |
| 6 | tercero: no creó otra | `1` | `1` |
| 7 | sale uno: reloj restituido | `true` | `true` |
| 8 | sale uno: vuelve al listado | `1` | `1` |
| 9 | llena y vencida: activa con iniciada_en | `activa` | `activa` |
| 10 | anfitrión sale de una llena: cancelada, reloj intacto | `cancelada\|true` | `cancelada\|true` |
