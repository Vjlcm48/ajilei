-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · RNK-1 · Fase 1a — Verificación del libro de puntos y las RPC
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_RNK-1_Fase1a_v1.0.md §4, con el Ajuste A (puesto único).
-- Migración que verifica: supabase/migrations/20261024191731_rnk1a_libro_puntos.sql.
--
-- CÓMO SE USA: como los de ECO-1. Se pega ENTERO en el SQL Editor DESPUÉS del
-- push y se corre UNA vez. Devuelve UNA tabla `prueba | resultado | detalle`
-- (el Editor sólo enseña el último `select`, y es éste): primero el Grupo A
-- (definiciones y permisos), después el Grupo B (comportamiento). Cada fila
-- debe decir PASA. No enseña correos ni uuids de cuentas reales.
-- Antes del push lo corre `npm run guiones` contra un Postgres en memoria.
--
-- NO DEJA RASTRO, por los mismos dos caminos que ECO-1: `begin;` … `rollback;`,
-- y una función en `pg_temp` que lo corre todo dentro de un bloque con
-- `exception` y lo deshace lanzando `rnk1a_deshacer`.
--
-- LAS CUENTAS. Fabrica siete (rnk_a_verif … rnk_y_verif) y, para el corte del
-- top 100, otras 101 (rnkcorte_001 … rnkcorte_101); todas se deshacen. Los
-- nombres de la ficha (rnk_a, rnk_b, rnk_c) no caben en la regla de usernames
-- (6 a 15 caracteres, SUP-2a), de ahí el `_verif`.
--
-- EL RELOJ. Todo el guion es UNA transacción: `now()` no se mueve. Lo que el
-- guion necesita que pase «después» lo resuelve así:
--   · el desempate del ranking lee `clock_timestamp()`, que SÍ avanza; entre
--     dos líneas cuyo orden importa hay un `pg_sleep` de 5 ms;
--   · «pasó un minuto» para el tope de fines de mano: se envejecen las horas
--     de `mesas_ia.manos_recientes` (B21);
--   · en Fortunas, el saldo lo mueve `aplicar_movimiento` con `now()`: dos
--     saldos iguales llegan «a la vez» y decide el nombre (B14).
--
-- LA BASE REAL. El guion no supone que las tablas estén vacías: cada puesto se
-- compara con `puesto_maestros` / `puesto_fortunas` y con su vecino, no con un
-- número fijo. Los números exactos de la ficha (1-2-3-4, franja 25, …) se
-- comprueban además cuando sólo hay cuentas fabricadas, que es lo que pasa
-- justo tras el push.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.rnk1a_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  A constant uuid := 'f1a00000-0000-4000-8000-00000000000a';
  B constant uuid := 'f1a00000-0000-4000-8000-00000000000b';
  C constant uuid := 'f1a00000-0000-4000-8000-00000000000c';
  D constant uuid := 'f1a00000-0000-4000-8000-00000000000d';
  E constant uuid := 'f1a00000-0000-4000-8000-00000000000e';
  X constant uuid := 'f1a00000-0000-4000-8000-0000000000f1';
  Y constant uuid := 'f1a00000-0000-4000-8000-0000000000f2';
  RPC5 constant text := 'public.informar_pila(uuid, integer, bigint, integer, boolean)';
  RPC7 constant text := 'public.informar_pila(uuid, integer, bigint, integer, boolean, integer, smallint)';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  r    public.mesa_ia_resultado;
  r2   public.mesa_ia_resultado;
  mz   public.mesas_ia;
  m_b uuid; m_d uuid; m_e uuid; m_x uuid;
  t1 text; t2 text; t3 text; e1 text; e2 text; e3 text;
  n1 bigint; n2 bigint; n3 bigint; n4 bigint; n5 bigint;
  p1 integer; p2 integer; p3 integer; p4 integer; p5 integer; p6 integer;
  q1 integer; q2 integer; q3 integer;
  f1 smallint; f2 smallint; f3 smallint;
  c1 bigint; c2 bigint;
  ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean;
  solo boolean;
  i integer;
begin
  begin
    -- ═══ GRUPO A · definiciones y permisos ═══════════════════════════════

    -- ── A1 · las dos tablas ──────────────────────────────────────────────
    ok1 := to_regclass('public.libro_puntos') is not null and to_regclass('public.puntos_totales') is not null;
    v_o := v_o || 1; v_p := v_p || 'A1 · existen libro_puntos y puntos_totales'::text;
    v_r := v_r || case when ok1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('libro_puntos=%s · puntos_totales=%s',
                         to_regclass('public.libro_puntos') is not null, to_regclass('public.puntos_totales') is not null);

    -- ── A2 · las columnas nuevas de mesas_ia ─────────────────────────────
    select count(*) into n1 from information_schema.columns
     where table_schema = 'public' and table_name = 'mesas_ia' and column_name = 'mano_informada'
       and data_type = 'integer' and is_nullable = 'NO' and column_default = '0';
    select count(*) into n2 from information_schema.columns
     where table_schema = 'public' and table_name = 'mesas_ia' and column_name = 'manos_recientes'
       and data_type = 'ARRAY' and is_nullable = 'NO';
    v_o := v_o || 2; v_p := v_p || 'A2 · mesas_ia.mano_informada (int, 0) y manos_recientes'::text;
    v_r := v_r || case when n1 = 1 and n2 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('mano_informada=%s · manos_recientes=%s', n1 = 1, n2 = 1);

    -- ── A3 · los índices (los del ranking, de tres columnas: Ajuste A) ───
    ok1 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'libro_puntos'
                    and indexname = 'libro_puntos_jugador_creado_idx' and indexdef like '%(jugador_id, creado_en)');
    ok2 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'puntos_totales'
                    and indexname = 'puntos_totales_ranking_idx' and indexdef like '%(puntos DESC, actualizado_en, jugador_id)');
    ok3 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'billeteras'
                    and indexname = 'billeteras_ranking_idx' and indexdef like '%(saldo DESC, actualizada_en, jugador_id)');
    ok4 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'libro_puntos'
                    and indexname = 'libro_puntos_mano_uniq' and indexdef like 'CREATE UNIQUE INDEX%(origen, mesa_id, mano)');
    v_o := v_o || 3; v_p := v_p || 'A3 · índices: libro, ranking de puntos, ranking de saldo y la mano única'::text;
    v_r := v_r || case when ok1 and ok2 and ok3 and ok4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('libro (jugador, creado)=%s · puntos (desc, fecha, jugador)=%s · saldo (desc, fecha, jugador)=%s · único (origen, mesa, mano)=%s',
                         ok1, ok2, ok3, ok4);

    -- ── A4 · los disparadores ────────────────────────────────────────────
    select count(*) into n1 from pg_trigger g join pg_class k on k.oid = g.tgrelid
     where not g.tgisinternal and (k.relname, g.tgname) in (
       ('libro_puntos',   'libro_puntos_inmutable_trg'),
       ('libro_puntos',   'libro_puntos_sin_truncate_trg'),
       ('libro_puntos',   'libro_puntos_suma_total_trg'),
       ('puntos_totales', 'puntos_totales_solo_por_libro_trg'),
       ('puntos_totales', 'puntos_totales_sin_truncate_trg'));
    v_o := v_o || 4; v_p := v_p || 'A4 · disparadores: inmutable, suma al total, total solo por libro (y sin truncate)'::text;
    v_r := v_r || case when n1 = 5 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('%s de 5', n1);

    -- ── A5 · las tres RPC de lectura y sus ayudantes ─────────────────────
    ok1 := to_regprocedure('public.ranking_top(text)') is not null
       and to_regprocedure('public.ranking_mio(text)') is not null
       and to_regprocedure('public.mini_perfil(text)') is not null;
    ok2 := to_regprocedure('public.puesto_maestros(uuid)') is not null
       and to_regprocedure('public.puesto_fortunas(uuid)') is not null
       and to_regprocedure('public.ranking_franja(integer, integer)') is not null
       and to_regprocedure('public.puntos_reto_ia(text)') is not null
       and to_regprocedure('public.extra_ajilei(smallint)') is not null
       and to_regprocedure('public.ia_tope_manos_minuto()') is not null;
    v_o := v_o || 5; v_p := v_p || 'A5 · existen ranking_top, ranking_mio, mini_perfil y sus ayudantes'::text;
    v_r := v_r || case when ok1 and ok2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('las tres RPC=%s · los seis ayudantes=%s', ok1, ok2);

    -- ── A6 · informar_pila: la firma de 7 y no la de 5 ───────────────────
    select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname = 'informar_pila';
    v_o := v_o || 6; v_p := v_p || 'A6 · informar_pila: existe la firma de 7, no la de 5, y es la única'::text;
    v_r := v_r || case when to_regprocedure(RPC7) is not null and to_regprocedure(RPC5) is null and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('firma de 7=%s · firma de 5=%s · funciones con ese nombre=%s',
                         to_regprocedure(RPC7) is not null, to_regprocedure(RPC5) is not null, n1);

    -- ── A7 · RLS activa, sin políticas y sin privilegios de tabla ────────
    select count(*) into n1 from pg_class k join pg_namespace s on s.oid = k.relnamespace
     where s.nspname = 'public' and k.relname in ('libro_puntos', 'puntos_totales') and k.relrowsecurity;
    select count(*) into n2 from pg_policies
     where schemaname = 'public' and tablename in ('libro_puntos', 'puntos_totales');
    ok1 := has_table_privilege('anon', 'public.libro_puntos', 'select, insert, update, delete, truncate')
        or has_table_privilege('authenticated', 'public.libro_puntos', 'select, insert, update, delete, truncate')
        or has_table_privilege('anon', 'public.puntos_totales', 'select, insert, update, delete, truncate')
        or has_table_privilege('authenticated', 'public.puntos_totales', 'select, insert, update, delete, truncate');
    v_o := v_o || 7; v_p := v_p || 'A7 · las dos tablas: RLS activa, cero políticas, el cliente sin privilegios'::text;
    v_r := v_r || case when n1 = 2 and n2 = 0 and not ok1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('con RLS=%s de 2 · políticas=%s · el cliente tiene algún privilegio=%s', n1, n2, ok1);

    -- ── A8 · anon: sin execute en las RPC nuevas ni en informar_pila ─────
    ok1 := has_function_privilege('anon', 'public.ranking_top(text)', 'execute')
        or has_function_privilege('anon', 'public.ranking_mio(text)', 'execute')
        or has_function_privilege('anon', 'public.mini_perfil(text)', 'execute')
        or has_function_privilege('anon', RPC7, 'execute');
    v_o := v_o || 8; v_p := v_p || 'A8 · anon sin execute en ranking_top, ranking_mio, mini_perfil e informar_pila'::text;
    v_r := v_r || case when not ok1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('anon puede alguna=%s', ok1);

    -- ── A9 · authenticated: las cuatro sí, las internas no ───────────────
    ok1 := has_function_privilege('authenticated', 'public.ranking_top(text)', 'execute')
       and has_function_privilege('authenticated', 'public.ranking_mio(text)', 'execute')
       and has_function_privilege('authenticated', 'public.mini_perfil(text)', 'execute')
       and has_function_privilege('authenticated', RPC7, 'execute');
    ok2 := has_function_privilege('authenticated', 'public.puesto_maestros(uuid)', 'execute')
        or has_function_privilege('authenticated', 'public.puesto_fortunas(uuid)', 'execute')
        or has_function_privilege('authenticated', 'public.ranking_franja(integer, integer)', 'execute')
        or has_function_privilege('authenticated', 'public.puntos_reto_ia(text)', 'execute')
        or has_function_privilege('authenticated', 'public.extra_ajilei(smallint)', 'execute')
        or has_function_privilege('authenticated', 'public.ia_tope_manos_minuto()', 'execute')
        or has_function_privilege('authenticated', 'public.libro_puntos_suma_total()', 'execute')
        or has_function_privilege('authenticated', 'public.libro_puntos_inmutable()', 'execute')
        or has_function_privilege('authenticated', 'public.puntos_totales_solo_por_libro()', 'execute');
    v_o := v_o || 9; v_p := v_p || 'A9 · authenticated con execute en las cuatro; ninguna interna'::text;
    v_r := v_r || case when ok1 and not ok2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('las cuatro del cliente=%s · alguna interna al cliente=%s', ok1, ok2);

    -- ── A10 · INV-67: ni uuid ni correo en lo que devuelven ──────────────
    -- CFG-1 1b: 13 → 17 columnas (pais y estado en ranking_top y mini_perfil).
    select count(*) into n1
      from pg_proc f join pg_namespace s on s.oid = f.pronamespace,
           unnest(f.proallargtypes, f.proargmodes, f.proargnames) as a(tipo, modo, nombre)
     where s.nspname = 'public' and f.proname in ('ranking_top', 'ranking_mio', 'mini_perfil')
       and a.modo = 't'
       and (a.tipo = 'uuid'::regtype or a.nombre ~* '(correo|email|mail|_id$|^id$)');
    select count(*) into n2
      from pg_proc f join pg_namespace s on s.oid = f.pronamespace,
           unnest(f.proallargtypes, f.proargmodes) as a(tipo, modo)
     where s.nspname = 'public' and f.proname in ('ranking_top', 'ranking_mio', 'mini_perfil') and a.modo = 't';
    v_o := v_o || 10; v_p := v_p || 'A10 · INV-67: ninguna columna de las tres es un uuid ni un correo'::text;
    v_r := v_r || case when n1 = 0 and n2 = 17 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('columnas devueltas=%s de 17 · con uuid o correo=%s', n2, n1);

    -- ── A11 · security definer y search_path vacío ───────────────────────
    select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public'
       and f.proname in ('informar_pila', 'ranking_top', 'ranking_mio', 'mini_perfil',
                         'puesto_maestros', 'puesto_fortunas', 'libro_puntos_suma_total')
       and f.prosecdef and f.proconfig @> array['search_path=""'];
    select count(*) into n2 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public'
       and f.proname in ('puntos_reto_ia', 'extra_ajilei', 'ia_tope_manos_minuto', 'ranking_franja',
                         'libro_puntos_inmutable', 'puntos_totales_solo_por_libro')
       and f.proconfig @> array['search_path=""'];
    v_o := v_o || 11; v_p := v_p || 'A11 · las que tocan tablas, security definer; todas con search_path vacío'::text;
    v_r := v_r || case when n1 = 7 and n2 = 6 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('definer con search_path=%s de 7 · puras y guardas con search_path=%s de 6', n1, n2);

    -- ── A12 · fuera de Realtime ──────────────────────────────────────────
    select count(*) into n1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('libro_puntos', 'puntos_totales');
    v_o := v_o || 12; v_p := v_p || 'A12 · ninguna de las dos tablas en supabase_realtime'::text;
    v_r := v_r || case when n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('en realtime=%s', n1);


    -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
    -- Siete cuentas fabricadas, cada una con su billetera y su bono.
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'rnk1a.verif.' || u.n || '@example.com', '', now(), now(), '{}', '{}'
      from (values (A, 'a'), (B, 'b'), (C, 'c'), (D, 'd'), (E, 'e'), (X, 'x'), (Y, 'y')) as u(id, n);
    insert into public.profiles (id, username) values (A, 'rnk_a_verif');
    insert into public.profiles (id, username) values (B, 'rnk_b_verif');
    insert into public.profiles (id, username) values (C, 'rnk_c_verif');
    insert into public.profiles (id, username) values (D, 'rnk_d_verif');
    insert into public.profiles (id, username) values (E, 'rnk_e_verif');
    insert into public.profiles (id, username) values (X, 'rnk_x_verif');
    insert into public.profiles (id, username) values (Y, 'rnk_y_verif');

    -- ── B3 · ias/pro/5/AJILEI 52 → base 3, extra 2, total 5 ──────────────
    -- (va antes que B1 y B2, que necesitan una línea y un total que tocar)
    m_d := gen_random_uuid();
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (D, 'ias', 'pro', 5, 3, 52, 2, m_d, 1);
    select l.puntos_base, l.extra into p1, p2 from public.libro_puntos l where l.jugador_id = D;
    select t.puntos, t.manos, t.ajileis into n1, n2, n3 from public.puntos_totales t where t.jugador_id = D;
    v_o := v_o || 103; v_p := v_p || 'B3 · ias/pro/5 sentados/AJILEI 52: base 3, extra 2, total 5'::text;
    v_r := v_r || case when p1 = 3 and p2 = 2 and n1 = 5 and n2 = 1 and n3 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('base=%s · extra=%s · total=%s · manos=%s · ajileis=%s', p1, p2, n1, n2, n3);

    -- ── B1 · el total no se toca a mano: insert, update ni delete ────────
    begin
      insert into public.puntos_totales (jugador_id, puntos) values (C, 100);
      t1 := 'entró';
    exception when others then t1 := sqlerrm;
    end;
    begin
      update public.puntos_totales set manos = manos + 1 where jugador_id = D;
      t2 := 'cambió';
    exception when others then t2 := sqlerrm;
    end;
    begin
      delete from public.puntos_totales where jugador_id = D;
      t3 := 'borró';
    exception when others then t3 := sqlerrm;
    end;
    select count(*) into n1 from public.puntos_totales where jugador_id = C;
    select t.puntos, t.manos into n2, n3 from public.puntos_totales t where t.jugador_id = D;
    v_o := v_o || 101; v_p := v_p || 'B1 · puntos_totales a mano (insert, update de otra columna, delete): falla'::text;
    v_r := v_r || case when t1 = 'puntos_totales_solo_por_libro' and t2 = 'puntos_totales_solo_por_libro'
                        and t3 = 'puntos_totales_solo_por_libro' and n1 = 0 and n2 = 5 and n3 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('insert → %s · update de manos → %s · delete → %s · el total de D sigue %s/%s',
                         t1, t2, t3, n2, n3);

    -- ── B2 · el libro no se edita ni se borra ────────────────────────────
    begin
      update public.libro_puntos set extra = extra where jugador_id = D;
      t1 := 'cambió';
    exception when others then t1 := sqlerrm;
    end;
    begin
      delete from public.libro_puntos where jugador_id = D;
      t2 := 'borró';
    exception when others then t2 := sqlerrm;
    end;
    select count(*) into n1 from public.libro_puntos where jugador_id = D;
    v_o := v_o || 102; v_p := v_p || 'B2 · update y delete en libro_puntos: falla'::text;
    v_r := v_r || case when t1 = 'libro_puntos_inmutable' and t2 = 'libro_puntos_inmutable' and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('update → %s · delete → %s · líneas de D=%s', t1, t2, n1);

    -- ── B4 · AJILEI 52 con 4 sentados: falla por su check ────────────────
    begin
      insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
      values (C, 'ias', 'basico', 4, 1, 52, 2, gen_random_uuid(), 1);
      t1 := 'entró';
    exception when check_violation then
      get stacked diagnostics t1 = constraint_name;
    end;
    v_o := v_o || 104; v_p := v_p || 'B4 · ias/basico con AJILEI 52 y 4 sentados: falla (check)'::text;
    v_r := v_r || case when t1 = 'libro_puntos_ajilei52_chk' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s', t1);

    -- ── B5 · humanos/4 sentados sin nivel → base 7 ───────────────────────
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (A, 'humanos', null, 4, 7, 0, 0, gen_random_uuid(), 1);
    select l.puntos_base into p1 from public.libro_puntos l where l.jugador_id = A and l.origen = 'humanos';
    -- y una segunda línea de A (avanzado, AJILEI 51 → 2 + 1): A llega a 10
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (A, 'ias', 'avanzado', 3, 2, 51, 1, gen_random_uuid(), 1);
    select t.puntos, t.manos, t.ajileis into n1, n2, n3 from public.puntos_totales t where t.jugador_id = A;
    v_o := v_o || 105; v_p := v_p || 'B5 · humanos/4 sentados sin nivel: base 7 (y A suma 10 con una de avanzado)'::text;
    v_r := v_r || case when p1 = 7 and n1 = 10 and n2 = 2 and n3 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('base=%s · total de A=%s · manos=%s · ajileis=%s', p1, n1, n2, n3);

    -- ── B6 · una cifra inventada: falla por el check de coherencia ───────
    begin
      insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
      values (C, 'ias', 'pro', 5, 8, 0, 0, gen_random_uuid(), 1);
      t1 := 'entró';
    exception when check_violation then
      get stacked diagnostics t1 = constraint_name;
    end;
    select count(*) into n1 from public.puntos_totales where jugador_id = C;
    v_o := v_o || 106; v_p := v_p || 'B6 · ias/pro con puntos_base 8: falla (coherencia con la tabla)'::text;
    v_r := v_r || case when t1 = 'libro_puntos_base_chk' and n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · C sigue sin total=%s', t1, n1 = 0);

    -- ── B7 · la misma (origen, mesa, mano) dos veces: la segunda no entra ─
    begin
      insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
      values (D, 'ias', 'pro', 5, 3, 52, 2, m_d, 1);
      t1 := 'entró';
    exception when unique_violation then
      get stacked diagnostics t1 = constraint_name;
    end;
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (D, 'ias', 'pro', 5, 3, 0, 0, m_d, 1)
    on conflict (origen, mesa_id, mano) do nothing;
    get diagnostics n1 = row_count;
    select count(*) into n2 from public.libro_puntos where jugador_id = D;
    select t.puntos into n3 from public.puntos_totales t where t.jugador_id = D;
    v_o := v_o || 107; v_p := v_p || 'B7 · la misma (origen, mesa, mano) otra vez: no entra, el total no cambia'::text;
    v_r := v_r || case when t1 = 'libro_puntos_mano_uniq' and n1 = 0 and n2 = 1 and n3 = 5 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('insert → %s · con on conflict, filas=%s · líneas de D=%s · total de D=%s', t1, n1, n2, n3);

    -- ═══ informar_pila: la mesa pro de B ═════════════════════════════════
    -- D llegó a 5 en B3; B llega a 5 aquí, DESPUÉS: en el ranking, D delante.
    perform pg_sleep(0.005);
    perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
    r := public.sentarse_ia('pro', 5, 200, 2000, gen_random_uuid());
    m_b := r.mesa_id;

    -- ── B8 · gana la mano 1 con AJILEI 52: libro + record + mano 1 ───────
    r := public.informar_pila(m_b, 1, 2000, 5, true, 1, 52::smallint);
    select count(*), min(l.puntos_base), min(l.extra), min(l.ajilei), min(l.mano), min(l.sentados), min(l.nivel)
      into n1, p1, p2, p3, p4, p5, t1
      from public.libro_puntos l where l.jugador_id = B and l.mesa_id = m_b;
    select coalesce(sum(x.jugadas), 0), coalesce(sum(x.ganadas_humano), 0) into n2, n3
      from public.record_manos x where x.jugador_id = B;
    select * into mz from public.mesas_ia where id = m_b;
    select t.puntos into n4 from public.puntos_totales t where t.jugador_id = B;
    v_o := v_o || 108; v_p := v_p || 'B8 · informar_pila gana la mano 1 (pro, 5 vivos, AJILEI 52): libro, record y mano 1'::text;
    v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and p1 = 3 and p2 = 2 and p3 = 52 and p4 = 1 and p5 = 5
                        and t1 = 'pro' and n2 = 1 and n3 = 1 and mz.mano_informada = 1
                        and cardinality(mz.manos_recientes) = 1 and mz.anomalias = 0 and n4 = 5
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · líneas=%s (base %s, extra %s, ajilei %s, mano %s, sentados %s, %s) · record jugadas=%s ganadas=%s · mano_informada=%s · recientes=%s · anomalías=%s · total=%s',
                         r.codigo, n1, p1, p2, p3, p4, p5, t1, n2, n3, mz.mano_informada,
                         cardinality(mz.manos_recientes), mz.anomalias, n4);

    -- ── B9 · la mano 1 otra vez (seq nuevo), y la mano 0: anomalías ──────
    r  := public.informar_pila(m_b, 2, 2100, 5, true, 1, 0::smallint);
    r2 := public.informar_pila(m_b, 3, 2050, 5, true, 0, 0::smallint);
    select count(*) into n1 from public.libro_puntos where jugador_id = B;
    select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
    select * into mz from public.mesas_ia where id = m_b;
    v_o := v_o || 109; v_p := v_p || 'B9 · la mano 1 repetida y la mano 0: anomalía, libro y record sin cambio, la pila sí'::text;
    v_r := v_r || case when r.codigo = 'ok' and r2.codigo = 'ok' and n1 = 1 and n2 = 1
                        and mz.mano_informada = 1 and mz.anomalias = 2 and mz.seq_informada = 3
                        and mz.pila_informada = 2050
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('códigos=%s/%s · líneas de B=%s · record jugadas=%s · mano_informada=%s · anomalías=%s · seq=%s · pila=%s',
                         r.codigo, r2.codigo, n1, n2, mz.mano_informada, mz.anomalias, mz.seq_informada, mz.pila_informada);

    -- ── B10 · pierde la mano 2: mano_informada 2, libro sin cambio ───────
    r := public.informar_pila(m_b, 4, 1900, 4, false, 2, null);
    select count(*) into n1 from public.libro_puntos where jugador_id = B;
    select coalesce(sum(x.jugadas), 0), coalesce(sum(x.ganadas_ia), 0) into n2, n3
      from public.record_manos x where x.jugador_id = B;
    select * into mz from public.mesas_ia where id = m_b;
    v_o := v_o || 110; v_p := v_p || 'B10 · pierde la mano 2: mano_informada 2, record sí, libro no'::text;
    v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and n2 = 2 and n3 = 1 and mz.mano_informada = 2
                        and cardinality(mz.manos_recientes) = 2 and mz.anomalias = 2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · líneas de B=%s · record jugadas=%s ganadas_ia=%s · mano_informada=%s · recientes=%s',
                         r.codigo, n1, n2, n3, mz.mano_informada, cardinality(mz.manos_recientes));

    -- ── B19 · cliente viejo (sin p_fin_mano): record sí; libro, mano y tope no
    r := public.informar_pila(m_b, 5, 1900, 3, true);
    select count(*) into n1 from public.libro_puntos where jugador_id = B;
    select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
    select coalesce(sum(x.ganadas_humano), 0) into n3 from public.record_manos x where x.jugador_id = B and x.vivos = 3;
    select * into mz from public.mesas_ia where id = m_b;
    v_o := v_o || 119; v_p := v_p || 'B19 · aviso sin p_fin_mano (cliente de antes de la 1b): record sí, libro no'::text;
    v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and n2 = 3 and n3 = 1 and mz.mano_informada = 2
                        and cardinality(mz.manos_recientes) = 2 and mz.anomalias = 2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · líneas de B=%s · record jugadas=%s (ganada con 3 vivos=%s) · mano_informada=%s · recientes=%s · anomalías=%s',
                         r.codigo, n1, n2, n3, mz.mano_informada, cardinality(mz.manos_recientes), mz.anomalias);

    -- ── B20 · AJILEI 50, 52 con 4 vivos, y mano sin vivos: anomalías ─────
    r  := public.informar_pila(m_b, 6, 1900, 5, true, 3, 50::smallint);
    r2 := public.informar_pila(m_b, 7, 1900, 4, true, 3, 52::smallint);
    perform public.informar_pila(m_b, 8, 1900, null, null, 3, null);
    select count(*) into n1 from public.libro_puntos where jugador_id = B;
    select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
    select * into mz from public.mesas_ia where id = m_b;
    v_o := v_o || 120; v_p := v_p || 'B20 · AJILEI 50, AJILEI 52 con 4 vivos, mano sin vivos: tres anomalías'::text;
    v_r := v_r || case when r.codigo = 'ok' and r2.codigo = 'ok' and n1 = 1 and n2 = 3
                        and mz.mano_informada = 2 and mz.anomalias = 5 and mz.seq_informada = 8
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('códigos=%s/%s · líneas de B=%s · record jugadas=%s · mano_informada=%s · anomalías=%s · seq=%s',
                         r.codigo, r2.codigo, n1, n2, mz.mano_informada, mz.anomalias, mz.seq_informada);

    -- ── B22 · AJILEI sin ganar la mano: record sí, libro no (§2.5) ───────
    r := public.informar_pila(m_b, 9, 1900, 4, false, 3, 51::smallint);
    select count(*) into n1 from public.libro_puntos where jugador_id = B;
    select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
    select * into mz from public.mesas_ia where id = m_b;
    v_o := v_o || 122; v_p := v_p || 'B22 · AJILEI 51 sin ganar la mano: record sí, libro no'::text;
    v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and n2 = 4 and mz.mano_informada = 3 and mz.anomalias = 5
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · líneas de B=%s · record jugadas=%s · mano_informada=%s', r.codigo, n1, n2, mz.mano_informada);

    -- ═══ El tope por minuto: la mesa básica de E ═════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', E)::text, true);
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid());
    m_e := r.mesa_id;

    -- ── B11 · 13 fines de mano en el mismo minuto: el 13.º es anomalía ───
    n5 := 0;
    for i in 1..12 loop
      r := public.informar_pila(m_e, i, 500, 2, false, i, null);
      if r.codigo = 'ok' then n5 := n5 + 1; end if;
    end loop;
    select anomalias into p1 from public.mesas_ia where id = m_e;
    r := public.informar_pila(m_e, 13, 500, 2, true, 13, 0::smallint);
    select count(*) into n1 from public.libro_puntos where jugador_id = E;
    select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = E;
    select * into mz from public.mesas_ia where id = m_e;
    v_o := v_o || 111; v_p := v_p || 'B11 · 13 fines de mano en el mismo minuto: el 13.º es anomalía y no entra'::text;
    v_r := v_r || case when n5 = 12 and p1 = 0 and r.codigo = 'ok' and mz.anomalias = 1 and n1 = 0 and n2 = 12
                        and mz.mano_informada = 12 and cardinality(mz.manos_recientes) = 12 and mz.seq_informada = 13
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('12 primeros ok=%s con %s anomalías · el 13.º: codigo=%s, anomalías=%s, líneas de E=%s · record jugadas=%s · mano_informada=%s · recientes=%s',
                         n5, p1, r.codigo, mz.anomalias, n1, n2, mz.mano_informada, cardinality(mz.manos_recientes));

    -- ── B21 · pasado el minuto la ventana se vacía y vuelve a entrar ─────
    update public.mesas_ia
       set manos_recientes = (select array_agg(t - interval '61 seconds') from unnest(manos_recientes) t)
     where id = m_e;
    perform pg_sleep(0.005);
    r := public.informar_pila(m_e, 14, 550, 2, true, 13, 0::smallint);
    select count(*), min(l.puntos_base) into n1, p1 from public.libro_puntos l where l.jugador_id = E;
    select * into mz from public.mesas_ia where id = m_e;
    select t.puntos into n2 from public.puntos_totales t where t.jugador_id = E;
    v_o := v_o || 121; v_p := v_p || 'B21 · la ventana desliza: 61 s después, la mano 13 gana y entra (básico, 1 punto)'::text;
    v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and p1 = 1 and n2 = 1 and mz.mano_informada = 13
                        and cardinality(mz.manos_recientes) = 1 and mz.anomalias = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · líneas de E=%s (base %s) · total=%s · mano_informada=%s · recientes=%s',
                         r.codigo, n1, p1, n2, mz.mano_informada, cardinality(mz.manos_recientes));

    -- ═══ Los rankings ════════════════════════════════════════════════════
    -- Puntos: A 10 · D 5 (llegó primero) · B 5 (después) · E 1 · C nada.
    select count(*) = 4 into solo from public.puntos_totales;

    -- ── B12 · ranking_top('maestros'): 1-2-3-4, el empate lo gana quien llegó antes
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    select r0.puesto into p1 from public.ranking_top('maestros') r0 where r0.username = 'rnk_a_verif';
    select r0.puesto into p2 from public.ranking_top('maestros') r0 where r0.username = 'rnk_d_verif';
    select r0.puesto into p3 from public.ranking_top('maestros') r0 where r0.username = 'rnk_b_verif';
    select r0.puesto into p4 from public.ranking_top('maestros') r0 where r0.username = 'rnk_e_verif';
    select count(*) into n1 from public.ranking_top('maestros') r0 where r0.username = 'rnk_c_verif';
    select count(*), count(distinct r0.puesto), coalesce(max(r0.puesto), 0),
           count(*) filter (where r0.es_tu), count(*) filter (where r0.es_tu and r0.username = 'rnk_a_verif')
      into n2, n3, n4, c1, c2
      from public.ranking_top('maestros') r0;
    ok1 := (select t.actualizado_en from public.puntos_totales t where t.jugador_id = D)
         < (select t.actualizado_en from public.puntos_totales t where t.jugador_id = B);
    v_o := v_o || 112; v_p := v_p || 'B12 · ranking_top maestros: puestos únicos 1-2-3-4; en el empate a 5, D (llegó antes) delante de B'::text;
    v_r := v_r || case when ok1 and p2 = p1 + 1 and p3 = p1 + 2 and p4 = p1 + 3
                        and p1 = public.puesto_maestros(A) and p2 = public.puesto_maestros(D)
                        and p3 = public.puesto_maestros(B) and p4 = public.puesto_maestros(E)
                        and n1 = 0 and n2 = n3 and n4 = n2 and c1 = 1 and c2 = 1
                        and (not solo or (p1 = 1 and p2 = 2 and p3 = 3 and p4 = 4))
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('A=%s · D=%s · B=%s · E=%s · C en la lista=%s · filas=%s, puestos distintos=%s, último=%s · es_tu=%s (A=%s) · D llegó antes=%s · sólo fabricadas=%s',
                         p1, p2, p3, p4, n1 > 0, n2, n3, n4, c1, c2 = 1, ok1, solo);

    -- ── B13 · ranking_mio maestros: C sin puntos → nada; A → su puesto ───
    perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
    select count(*) into n1 from public.ranking_mio('maestros');
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    select m0.puesto, m0.total, m0.franja, m0.cifra into p1, p2, f1, c1 from public.ranking_mio('maestros') m0;
    select count(*) into n2 from public.puntos_totales;
    v_o := v_o || 113; v_p := v_p || 'B13 · ranking_mio maestros: sin puntos → cero filas; A → puesto, total y franja'::text;
    v_r := v_r || case when n1 = 0 and p1 = public.puesto_maestros(A) and p2 = n2
                        and f1 = public.ranking_franja(p1, p2) and c1 = 10
                        and (not solo or (p1 = 1 and p2 = 4 and f1 = 25))
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas de C=%s · A: puesto %s de %s, franja %s %%, cifra %s · sólo fabricadas=%s',
                         n1, p1, p2, f1, c1, solo);

    -- ── B14 · fortunas: puestos únicos y sus franjas ─────────────────────
    -- A, B y C a la cabeza; B y C con el MISMO saldo y la misma hora (now()):
    -- decide el nombre, B delante de C. La franja, con puestos 1, 2 y 3.
    perform public.ajuste_admin(A, 3000000000000, 'RNK-1a verificación');
    perform public.ajuste_admin(B, 1000000002000, 'RNK-1a verificación');
    perform public.ajuste_admin(C, 1000000000000, 'RNK-1a verificación');
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    select m0.puesto, m0.franja, m0.cifra into p1, f1, c1 from public.ranking_mio('fortunas') m0;
    perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
    select m0.puesto, m0.franja, m0.cifra into p2, f2, c2 from public.ranking_mio('fortunas') m0;
    perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
    select m0.puesto, m0.franja, m0.total, m0.cifra into p3, f3, n1, n2 from public.ranking_mio('fortunas') m0;
    select count(*) into n3 from public.billeteras;
    v_o := v_o || 114; v_p := v_p || 'B14 · ranking_mio fortunas: puestos únicos 1-2-3 (empate de saldo y hora → nombre); franjas 35/70/100 sobre 3'::text;
    v_r := v_r || case when p1 = 1 and p2 = 2 and p3 = 3 and c2 = n2 and n1 = n3
                        and p1 = public.puesto_fortunas(A) and p2 = public.puesto_fortunas(B) and p3 = public.puesto_fortunas(C)
                        and f1 = public.ranking_franja(1, n3::integer) and f2 = public.ranking_franja(2, n3::integer)
                        and f3 = public.ranking_franja(3, n3::integer)
                        and public.ranking_franja(1, 3) = 35 and public.ranking_franja(2, 3) = 70
                        and public.ranking_franja(3, 3) = 100 and public.ranking_franja(28, 100) = 30
                        and public.ranking_franja(5, 100) = 5 and public.ranking_franja(1, 1) = 100
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('puestos A=%s B=%s C=%s de %s (saldo B=C: %s) · franjas sobre %s: %s/%s/%s · sobre 3: %s/%s/%s · 28 de 100=%s · 5 de 100=%s · 1 de 1=%s',
                         p1, p2, p3, n1, c2 = n2, n3, f1, f2, f3,
                         public.ranking_franja(1, 3), public.ranking_franja(2, 3), public.ranking_franja(3, 3),
                         public.ranking_franja(28, 100), public.ranking_franja(5, 100), public.ranking_franja(1, 1));

    -- ── B15 · mini_perfil: sin mayúsculas, y 'nadie' → cero filas ────────
    perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
    select count(*) into n1 from public.mini_perfil('RNK_A_VERIF');
    select mp.username, mp.puesto_maestros, mp.puntos, mp.puesto_fortunas, mp.saldo
      into t1, p1, c1, p2, c2
      from public.mini_perfil('RNK_A_VERIF') mp;
    select count(*) into n2 from public.mini_perfil('nadie');
    select mp.puesto_maestros, mp.puntos, mp.saldo into p3, n3, n4 from public.mini_perfil('rnk_c_verif') mp;
    v_o := v_o || 115; v_p := v_p || 'B15 · mini_perfil(RNK_A_VERIF) lo encuentra; nadie → cero filas; sin puntos → nulos'::text;
    v_r := v_r || case when n1 = 1 and t1 = 'rnk_a_verif' and c1 = 10 and p1 = public.puesto_maestros(A)
                        and p2 = 1 and p2 = public.puesto_fortunas(A) and c2 = 3000000002500
                        and n2 = 0 and p3 is null and n3 is null and n4 = 1000000002500
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas=%s · %s: puesto maestros %s con %s · puesto fortunas %s con %s · nadie=%s filas · C: puesto %s, puntos %s, saldo %s',
                         n1, t1, p1, c1, p2, c2, n2, coalesce(p3::text, 'nulo'), coalesce(n3::text, 'nulo'), n4);

    -- ── B16 · como anon: las cuatro, denegadas ───────────────────────────
    -- Una denegación cuenta sólo si el cambio de rol llegó a ocurrir (`e1`):
    -- si el propio `set role` fallara, también daría 42501 y parecería verde.
    -- Las asignaciones a variables no se deshacen con el bloque.
    n1 := 0; n2 := 0;
    begin
      e1 := null; set local role anon; e1 := current_user;
      perform * from public.ranking_top('maestros');
      reset role;
    exception when insufficient_privilege then
      if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
    end;
    begin
      e1 := null; set local role anon; e1 := current_user;
      perform * from public.ranking_mio('maestros');
      reset role;
    exception when insufficient_privilege then
      if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
    end;
    begin
      e1 := null; set local role anon; e1 := current_user;
      perform * from public.mini_perfil('rnk_a_verif');
      reset role;
    exception when insufficient_privilege then
      if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
    end;
    begin
      e1 := null; set local role anon; e1 := current_user;
      perform public.informar_pila(m_b, 99, 1, null, null, null, null);
      reset role;
    exception when insufficient_privilege then
      if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
    end;
    v_o := v_o || 116; v_p := v_p || 'B16 · como anon: ranking_top, ranking_mio, mini_perfil e informar_pila denegadas'::text;
    v_r := v_r || case when n1 = 4 and n2 = 0 and current_user <> 'anon' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('denegadas siendo anon=%s de 4 · sin llegar a ser anon=%s · rol restaurado=%s',
                         n1, n2, current_user <> 'anon');

    -- ── B24 · sin sesión: cero filas en las tres ─────────────────────────
    perform set_config('request.jwt.claims', '', true);
    select count(*) into n1 from public.ranking_top('maestros');
    select count(*) into n2 from public.ranking_mio('fortunas');
    select count(*) into n3 from public.mini_perfil('rnk_a_verif');
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    select count(*) into n4 from public.ranking_top('nada');
    v_o := v_o || 124; v_p := v_p || 'B24 · sin sesión → cero filas en las tres; un ranking desconocido → cero filas'::text;
    v_r := v_r || case when n1 = 0 and n2 = 0 and n3 = 0 and n4 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('ranking_top=%s · ranking_mio=%s · mini_perfil=%s · ranking «nada»=%s', n1, n2, n3, n4);

    -- ── B18 · el que sube después estrena fecha y, si vuelven a empatar, queda detrás
    -- X y Y empatan a 2 (X llega antes). Y sube a 3; X sube a 3 DESPUÉS.
    perform pg_sleep(0.005);
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (X, 'ias', 'avanzado', 3, 2, 0, 0, gen_random_uuid(), 1);
    perform pg_sleep(0.005);
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (Y, 'ias', 'avanzado', 3, 2, 0, 0, gen_random_uuid(), 1);
    p1 := public.puesto_maestros(X); p2 := public.puesto_maestros(Y);
    perform pg_sleep(0.005);
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (Y, 'ias', 'basico', 2, 1, 0, 0, gen_random_uuid(), 1);
    p3 := public.puesto_maestros(X); p4 := public.puesto_maestros(Y);
    perform pg_sleep(0.005);
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (X, 'ias', 'basico', 2, 1, 0, 0, gen_random_uuid(), 1);
    p5 := public.puesto_maestros(X); p6 := public.puesto_maestros(Y);
    select r0.puesto into q1 from public.ranking_top('maestros') r0 where r0.username = 'rnk_x_verif';
    select r0.puesto into q2 from public.ranking_top('maestros') r0 where r0.username = 'rnk_y_verif';
    perform set_config('request.jwt.claims', json_build_object('sub', X)::text, true);
    select m0.puesto into q3 from public.ranking_mio('maestros') m0;
    select t.puntos into c1 from public.puntos_totales t where t.jugador_id = X;
    select t.puntos into c2 from public.puntos_totales t where t.jugador_id = Y;
    v_o := v_o || 118; v_p := v_p || 'B18 · empate a 2: X (antes) delante; Y sube; X sube después y en el nuevo empate a 3 queda detrás'::text;
    v_r := v_r || case when p2 = p1 + 1 and p4 < p3 and c1 = 3 and c2 = 3 and p5 = p6 + 1
                        and q1 = p5 and q2 = p6 and q3 = p5
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('a 2: X=%s Y=%s · Y a 3: X=%s Y=%s · los dos a 3: X=%s Y=%s · ranking_top X=%s Y=%s · ranking_mio de X=%s',
                         p1, p2, p3, p4, p5, p6, q1, q2, q3);

    -- ── B23 · el corte: 100 filas exactas, aunque caiga dentro de un empate
    -- 101 cuentas más con 1 punto cada una: con E, 102 empatadas a 1.
    for i in 1..101 loop
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                              created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
      values (format('f1a00001-0000-4000-8000-%s', lpad(i::text, 12, '0'))::uuid,
              '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              'rnk1a.corte.' || i || '@example.com', '', now(), now(), '{}', '{}');
      insert into public.profiles (id, username)
      values (format('f1a00001-0000-4000-8000-%s', lpad(i::text, 12, '0'))::uuid, 'rnkcorte_' || lpad(i::text, 3, '0'));
      insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
      values (format('f1a00001-0000-4000-8000-%s', lpad(i::text, 12, '0'))::uuid,
              'ias', 'basico', 2, 1, 0, 0, gen_random_uuid(), 1);
    end loop;
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    select count(*), count(distinct r0.puesto), min(r0.puesto), max(r0.puesto),
           bool_and(r0.puesto = public.puesto_maestros(p.id))
      into n1, n2, p1, p2, ok1
      from public.ranking_top('maestros') r0
      join public.profiles p on lower(p.username) = lower(r0.username);
    select count(*) into n3 from public.puntos_totales;
    perform set_config('request.jwt.claims',
                       json_build_object('sub', 'f1a00001-0000-4000-8000-000000000101')::text, true);
    select m0.puesto, m0.total, m0.franja into p3, p4, f1 from public.ranking_mio('maestros') m0;
    select count(*) into n4 from public.ranking_top('maestros') r0 where r0.username = 'rnkcorte_101';
    v_o := v_o || 123; v_p := v_p || 'B23 · el corte: 100 filas exactas con puestos 1…100; el último en llegar al empate, fuera y último'::text;
    v_r := v_r || case when n1 = 100 and n2 = 100 and p1 = 1 and p2 = 100 and ok1 and n3 >= 107
                        and p3 = n3 and p4 = n3 and f1 = 100 and n4 = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas=%s · puestos distintos=%s, de %s a %s · coinciden con puesto_maestros=%s · en el ranking=%s · rnkcorte_101: puesto %s de %s, franja %s %%, en el top=%s',
                         n1, n2, p1, p2, ok1, n3, p3, p4, f1, n4 > 0);

    -- ── B17 · borrar la cuenta de A: su libro y su total se van en cascada
    select count(*) into n1 from public.puntos_totales where jugador_id <> A;
    select count(*) into n2 from public.libro_puntos where jugador_id <> A;
    begin
      delete from public.profiles where id = A;
      t1 := 'borrada';
    exception when others then t1 := sqlerrm;
    end;
    select count(*) into n3 from public.libro_puntos where jugador_id = A;
    select count(*) into n4 from public.puntos_totales where jugador_id = A;
    select count(*) into n5 from public.puntos_totales where jugador_id <> A;
    select count(*) into c1 from public.libro_puntos where jugador_id <> A;
    v_o := v_o || 117; v_p := v_p || 'B17 · borrar a A de profiles: su libro y su total se van en cascada, lo demás intacto'::text;
    v_r := v_r || case when t1 = 'borrada' and n3 = 0 and n4 = 0 and n5 = n1 and c1 = n2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('delete → %s · líneas de A=%s · total de A=%s · totales de los demás %s→%s · líneas de los demás %s→%s',
                         t1, n3, n4, n1, n5, n2, c1);

    -- ── B25 · el libro cuadra: cada total es la suma de su libro ─────────
    select count(*) into n1
      from public.puntos_totales t
      cross join lateral (
        select coalesce(sum(l.puntos_base + l.extra), 0) as puntos, count(*) as manos,
               count(*) filter (where l.ajilei > 0) as ajileis
          from public.libro_puntos l where l.jugador_id = t.jugador_id) s
     where t.puntos <> s.puntos or t.manos <> s.manos or t.ajileis <> s.ajileis;
    select count(distinct l.jugador_id) into n2
      from public.libro_puntos l
     where not exists (select 1 from public.puntos_totales t where t.jugador_id = l.jugador_id);
    select count(*) into n3 from public.puntos_totales;
    v_o := v_o || 125; v_p := v_p || 'B25 · el libro cuadra: cada total = Σ de su libro, y nadie con líneas sin total'::text;
    v_r := v_r || case when n1 = 0 and n2 = 0 and n3 > 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('totales descuadrados=%s · jugadores con líneas sin total=%s · totales revisados=%s', n1, n2, n3);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'rnk1a_deshacer';
  exception when others then
    if sqlerrm <> 'rnk1a_deshacer' then
      v_o := v_o || 999; v_p := v_p || 'X · el guion se detuvo'::text;
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.rnk1a_verificar()
 order by orden;

rollback;
