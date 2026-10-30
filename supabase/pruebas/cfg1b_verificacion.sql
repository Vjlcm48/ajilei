-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · CFG-1 · Fase 1b — Verificación del lugar y del freno del nombre
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_CFG-1_Fase1b_v1.0.md §1.3.
-- Migración que verifica: supabase/migrations/20261030013000_cfg1b_perfil.sql.
--
-- CÓMO SE USA: como los de ECO-1, RNK-1 y la 1c. Se pega ENTERO en el SQL
-- Editor DESPUÉS del push y se corre UNA vez. Devuelve UNA tabla
-- `prueba | resultado | detalle`: primero el Grupo A (definición y permisos),
-- después el Grupo B (comportamiento). Cada fila debe decir PASA. No enseña
-- correos ni uuids de cuentas reales. Antes del push lo corre `npm run guiones`
-- contra un Postgres en memoria.
--
-- NO DEJA RASTRO, por los mismos dos caminos de siempre: `begin;` … `rollback;`,
-- y una función en `pg_temp` que lo corre todo dentro de un bloque con
-- `exception` y lo deshace lanzando `cfg1b_deshacer`.
--
-- COMO EL CLIENTE. Lo que el jugador hace desde el teléfono (cambiar el nombre
-- o el lugar, preguntar por un nombre, leer un mini-perfil) se corre con
-- `set local role authenticated` y la sesión en `request.jwt.claims`, a través
-- de `pg_temp.cfg1b_como` y `pg_temp.cfg1b_valor`: así se prueban a la vez el
-- `grant` de columnas, la política de SUP-2a y el disparador.
--
-- EL RELOJ. Dentro de una transacción `now()` no se mueve, y el freno solo
-- deja escribir `nombre_cambiado_en` al disparador. Para ponerlo 10 o 31 días
-- atrás, `pg_temp.cfg1b_mover` apaga ESE disparador, escribe y lo vuelve a
-- encender, todo dentro de la transacción que se deshace. Mientras dura (unos
-- milisegundos), las altas y los cambios de `profiles` de la base real esperan.
--
-- LAS CUENTAS. Fabrica cuatro (`cfgb_a_verif`, `cfgb_b_verif`, para el alta
-- `cfgb_n_verif` y, para B11, `cfgb_vetado1`). Todas se deshacen.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Corre `p_sql` como el cliente con la sesión de `p_uid`. Devuelve
-- `PASA·<filas>` o `<sqlstate>·<mensaje>·<hint>`. Si falla, el bloque se
-- deshace solo, con el rol y la sesión.
create function pg_temp.cfg1b_como(p_uid uuid, p_sql text)
returns text
language plpgsql
as $fn$
declare
  n bigint;
  e text; m text; h text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  set local role authenticated;
  execute p_sql;
  get diagnostics n = row_count;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return 'PASA·' || n;
exception when others then
  get stacked diagnostics e = returned_sqlstate, m = message_text, h = pg_exception_hint;
  return e || '·' || m || '·' || coalesce(h, '');
end
$fn$;

-- Lo mismo para una consulta de un solo valor: el valor en texto (`null` si
-- es nulo), o `ERROR·<sqlstate>`.
create function pg_temp.cfg1b_valor(p_uid uuid, p_sql text)
returns text
language plpgsql
as $fn$
declare
  v text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  set local role authenticated;
  execute p_sql into v;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return coalesce(v, 'null');
exception when others then
  return 'ERROR·' || sqlstate;
end
$fn$;

-- Mueve el reloj del freno de una cuenta (ver la cabecera).
create function pg_temp.cfg1b_mover(p_uid uuid, p_cuando timestamptz)
returns void
language plpgsql
as $fn$
begin
  alter table public.profiles disable trigger profiles_freno_nombre_trg;
  update public.profiles set nombre_cambiado_en = p_cuando where id = p_uid;
  alter table public.profiles enable trigger profiles_freno_nombre_trg;
end
$fn$;

create function pg_temp.cfg1b_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  A   constant uuid := 'c1b00000-0000-4000-8000-00000000000a';
  B   constant uuid := 'c1b00000-0000-4000-8000-00000000000b';
  NU  constant uuid := 'c1b00000-0000-4000-8000-00000000000c';
  VE  constant uuid := 'c1b00000-0000-4000-8000-00000000000d';
  FMT constant text := 'YYYY-MM-DD"T"HH24:MI:SS"Z"';
  ACT constant text := 'update public.profiles set %s where id = %L';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  r   public.movimiento_resultado;
  t1 text; t2 text; t3 text; t4 text; t5 text; t6 text; t7 text;
  esperado text;
  c0 timestamptz; c1 timestamptz; c2 timestamptz;
  n  bigint; n1 bigint; n2 bigint;
  ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean; ok5 boolean; ok6 boolean;
begin
  begin
    -- ═══ GRUPO A · definición y permisos ═════════════════════════════════

    -- ── A1 · las tres columnas, con su tipo y nulas ──────────────────────
    select count(*) into n1
      from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles' and is_nullable = 'YES'
       and (column_name, data_type) in (('pais', 'text'), ('estado', 'text'),
                                        ('nombre_cambiado_en', 'timestamp with time zone'));
    select count(*) into n2 from pg_constraint
     where conrelid = 'public.profiles'::regclass and contype = 'c'
       and conname in ('profiles_pais_formato_chk', 'profiles_estado_solo_ve_chk', 'profiles_estado_lista_chk');
    v_o := v_o || 1; v_p := v_p || 'A1 · profiles: pais, estado (text) y nombre_cambiado_en (timestamptz), nulas; tres CHECK'::text;
    v_r := v_r || case when n1 = 3 and n2 = 3 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('columnas=%s de 3 · CHECK=%s de 3', n1, n2);

    -- ── A2 · las funciones nuevas: forma, security definer, search_path ──
    select count(*) into n1
      from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.prosecdef and f.proconfig @> array['search_path=""']
       and ((f.proname = 'nombre_libre'          and pg_get_function_identity_arguments(f.oid) = 'p text'   and f.prorettype = 'boolean'::regtype)
         or (f.proname = 'mi_proximo_cambio'     and pg_get_function_identity_arguments(f.oid) = ''         and f.prorettype = 'timestamptz'::regtype)
         or (f.proname = 'username_vedado'       and pg_get_function_identity_arguments(f.oid) = 'txt text' and f.prorettype = 'boolean'::regtype)
         or (f.proname = 'profiles_freno_nombre' and f.prorettype = 'trigger'::regtype));
    select count(*) into n2
      from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname = 'freno_nombre_hasta'
       and f.provolatile = 'i' and f.proconfig @> array['search_path=""'];
    v_o := v_o || 2; v_p := v_p || 'A2 · nombre_libre, mi_proximo_cambio, username_vedado y el freno: definer con search_path vacío'::text;
    v_r := v_r || case when n1 = 4 and n2 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('definer con su forma=%s de 4 · freno_nombre_hasta inmutable=%s de 1', n1, n2);

    -- ── A3 · quién ejecuta qué ───────────────────────────────────────────
    ok1 := has_function_privilege('authenticated', 'public.nombre_libre(text)', 'execute')
       and has_function_privilege('authenticated', 'public.mi_proximo_cambio()', 'execute')
       and has_function_privilege('authenticated', 'public.ranking_top(text)', 'execute')
       and has_function_privilege('authenticated', 'public.mini_perfil(text)', 'execute');
    ok2 := has_function_privilege('anon', 'public.nombre_libre(text)', 'execute')
        or has_function_privilege('anon', 'public.mi_proximo_cambio()', 'execute')
        or has_function_privilege('anon', 'public.ranking_top(text)', 'execute')
        or has_function_privilege('anon', 'public.mini_perfil(text)', 'execute');
    ok3 := has_function_privilege('authenticated', 'public.username_vedado(text)', 'execute')
        or has_function_privilege('authenticated', 'public.freno_nombre_hasta(timestamptz)', 'execute')
        or has_function_privilege('anon', 'public.username_vedado(text)', 'execute');
    select count(*) into n from pg_proc f, aclexplode(f.proacl) a
     where f.oid in ('public.nombre_libre(text)'::regprocedure, 'public.mi_proximo_cambio()'::regprocedure,
                     'public.ranking_top(text)'::regprocedure, 'public.mini_perfil(text)'::regprocedure,
                     'public.username_vedado(text)'::regprocedure, 'public.freno_nombre_hasta(timestamptz)'::regprocedure)
       and a.grantee = 0 and a.privilege_type = 'EXECUTE';
    v_o := v_o || 3; v_p := v_p || 'A3 · las cuatro del cliente, solo authenticated; las internas, nadie; public, ninguna'::text;
    v_r := v_r || case when ok1 and not ok2 and not ok3 and n = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('authenticated en las 4=%s · anon en alguna=%s · internas al cliente=%s · public=%s', ok1, ok2, ok3, n);

    -- ── A4 · `update` de profiles: solo tres columnas ────────────────────
    ok1 := has_table_privilege('authenticated', 'public.profiles', 'update');
    ok2 := has_column_privilege('authenticated', 'public.profiles', 'username', 'update')
       and has_column_privilege('authenticated', 'public.profiles', 'pais', 'update')
       and has_column_privilege('authenticated', 'public.profiles', 'estado', 'update');
    ok3 := has_column_privilege('authenticated', 'public.profiles', 'nombre_cambiado_en', 'update')
        or has_column_privilege('authenticated', 'public.profiles', 'id', 'update')
        or has_column_privilege('authenticated', 'public.profiles', 'created_at', 'update')
        or has_column_privilege('authenticated', 'public.profiles', 'updated_at', 'update');
    ok4 := has_table_privilege('anon', 'public.profiles', 'update')
        or has_column_privilege('anon', 'public.profiles', 'username', 'update');
    v_o := v_o || 4; v_p := v_p || 'A4 · authenticated actualiza username, pais y estado, y nada más; anon, nada'::text;
    v_r := v_r || case when not ok1 and ok2 and not ok3 and not ok4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('tabla entera=%s · las tres=%s · alguna otra=%s · anon=%s', ok1, ok2, ok3, ok4);

    -- ── A5 · el freno: antes de alta y cambio, y antes que el portero ────
    select count(*) into n1 from pg_trigger
     where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_freno_nombre_trg'
       and tgenabled = 'O' and tgfoid = 'public.profiles_freno_nombre()'::regprocedure
       and (tgtype & 2) <> 0 and (tgtype & 4) <> 0 and (tgtype & 16) <> 0;
    select array_to_string(array_agg(tgname order by tgname), ' < ') into t1 from pg_trigger
     where tgrelid = 'public.profiles'::regclass and not tgisinternal and (tgtype & 2) <> 0;
    v_o := v_o || 5; v_p := v_p || 'A5 · profiles_freno_nombre_trg: BEFORE INSERT OR UPDATE, activo, antes que el portero'::text;
    v_r := v_r || case when n1 = 1 and 'profiles_freno_nombre_trg' < 'profiles_validar_username_trg' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('con esa forma=%s · BEFORE en orden: %s', n1, t1);

    -- ── A6 · A10 de RNK-1 al día: 17 columnas, ni uuid ni correo ─────────
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
    v_o := v_o || 6; v_p := v_p || 'A6 · INV-67 (A10 de RNK-1): las tres lecturas, 17 columnas, ninguna uuid ni correo'::text;
    v_r := v_r || case when n1 = 0 and n2 = 17 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('columnas devueltas=%s de 17 · con uuid o correo=%s', n2, n1);

    -- ── A7 · ranking_top y mini_perfil siguen siendo definer ─────────────
    select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname in ('ranking_top', 'mini_perfil')
       and f.prosecdef and f.proconfig @> array['search_path=""'];
    select count(*) into n2 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname in ('ranking_top', 'mini_perfil');
    v_o := v_o || 7; v_p := v_p || 'A7 · ranking_top y mini_perfil: una firma cada una, definer con search_path vacío'::text;
    v_r := v_r || case when n1 = 2 and n2 = 2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('definer=%s de 2 · firmas=%s', n1, n2);

    -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'cfg1b.verif.' || u.n || '@example.invalid', '', now(), now(), '{}', '{}'
      from (values (A, 'a'), (B, 'b'), (NU, 'n'), (VE, 'v')) as u(id, n);
    insert into public.profiles (id, username) values (A, 'cfgb_a_verif');
    insert into public.profiles (id, username) values (B, 'cfgb_b_verif');

    -- ── B1 · el primer cambio pasa y escribe la fecha ────────────────────
    select nombre_cambiado_en into c0 from public.profiles where id = A;
    t1 := pg_temp.cfg1b_como(A, format(ACT, format('username = %L', 'cfgb_a_nuevo'), A));
    select nombre_cambiado_en, username into c1, t2 from public.profiles where id = A;
    v_o := v_o || 101; v_p := v_p || 'B1 · primer cambio de nombre (como el cliente): pasa y nombre_cambiado_en = now()'::text;
    v_r := v_r || case when c0 is null and t1 = 'PASA·1' and c1 = now() and t2 = 'cfgb_a_nuevo' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('antes=%s · update → %s · nombre=%s · fecha=now() %s',
                         coalesce(c0::text, 'null'), t1, t2, coalesce(c1 = now(), false));

    -- ── B2 · el segundo, a los 10 días: frenado, con la fecha ────────────
    perform pg_temp.cfg1b_mover(A, now() - interval '10 days');
    select nombre_cambiado_en into c1 from public.profiles where id = A;
    esperado := 'AJ030·nombre_frenado·' || to_char(public.freno_nombre_hasta(c1) at time zone 'UTC', FMT);
    t1 := pg_temp.cfg1b_como(A, format(ACT, format('username = %L', 'cfgb_a_otro1'), A));
    t2 := pg_temp.cfg1b_valor(A, 'select public.mi_proximo_cambio()::text');
    select username, nombre_cambiado_en into t3, c2 from public.profiles where id = A;
    v_o := v_o || 102; v_p := v_p || 'B2 · segundo cambio a los 10 días: AJ030 nombre_frenado, hint ISO = cambio + 30 días'::text;
    v_r := v_r || case when t1 = esperado and t2 <> 'null' and t2 not like 'ERROR%'
                        and t2::timestamptz = c1 + interval '30 days'
                        and t3 = 'cfgb_a_nuevo' and c2 = c1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · mi_proximo_cambio=%s · nombre=%s · fecha intacta=%s',
                         t1, case when t2 like 'ERROR%' or t2 = 'null' then t2
                                  else (t2::timestamptz = c1 + interval '30 days')::text end, t3, c2 = c1);

    -- ── B3 · solo mayúsculas: pasa sin gastar el freno ───────────────────
    t1 := pg_temp.cfg1b_como(A, format(ACT, format('username = %L', 'CfgB_A_Nuevo'), A));
    select username, nombre_cambiado_en into t2, c2 from public.profiles where id = A;
    v_o := v_o || 103; v_p := v_p || 'B3 · cfgb_a_nuevo → CfgB_A_Nuevo dentro del freno: pasa y la fecha no se mueve'::text;
    v_r := v_r || case when t1 = 'PASA·1' and t2 = 'CfgB_A_Nuevo' and c2 = c1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · nombre=%s · fecha intacta=%s', t1, t2, c2 = c1);

    -- ── B4 · nombre_cambiado_en no se escribe a mano ─────────────────────
    t1 := pg_temp.cfg1b_como(A, format(ACT, format('nombre_cambiado_en = %L', now() - interval '40 days'), A));
    update public.profiles set nombre_cambiado_en = '2000-01-01T00:00:00Z' where id = A;
    get diagnostics n = row_count;
    select nombre_cambiado_en into c2 from public.profiles where id = A;
    v_o := v_o || 104; v_p := v_p || 'B4 · escribir nombre_cambiado_en: el cliente, 42501; el dueño de la tabla, el freno la devuelve'::text;
    v_r := v_r || case when t1 like '42501·%' and n = 1 and c2 = c1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('cliente → %s · dueño: filas=%s, fecha intacta=%s', split_part(t1, '·', 1), n, c2 = c1);

    -- ── B5 · a los 31 días el cambio pasa ────────────────────────────────
    perform pg_temp.cfg1b_mover(A, now() - interval '31 days');
    t1 := pg_temp.cfg1b_valor(A, 'select public.mi_proximo_cambio()::text');
    t2 := pg_temp.cfg1b_como(A, format(ACT, format('username = %L', 'cfgb_a_final'), A));
    select username, nombre_cambiado_en into t3, c2 from public.profiles where id = A;
    t4 := pg_temp.cfg1b_valor(A, 'select public.mi_proximo_cambio()::text');
    v_o := v_o || 105; v_p := v_p || 'B5 · a los 31 días: mi_proximo_cambio nulo, el cambio pasa y el freno vuelve a empezar'::text;
    v_r := v_r || case when t1 = 'null' and t2 = 'PASA·1' and t3 = 'cfgb_a_final' and c2 = now()
                        and t4 not like 'ERROR%' and t4 <> 'null' and t4::timestamptz = now() + interval '30 days'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('antes: mi_proximo_cambio=%s · update → %s · nombre=%s · fecha=now() %s · después +30 días=%s',
                         t1, t2, t3, c2 = now(),
                         case when t4 like 'ERROR%' or t4 = 'null' then t4
                              else (t4::timestamptz = now() + interval '30 days')::text end);

    -- ── B6 · nombre_libre ────────────────────────────────────────────────
    t1 := pg_temp.cfg1b_valor(A, format('select public.nombre_libre(%L)::text', 'cfgb_libre_x1'));
    t2 := pg_temp.cfg1b_valor(A, format('select public.nombre_libre(%L)::text', 'CFGB_B_VERIF'));
    t3 := pg_temp.cfg1b_valor(A, format('select public.nombre_libre(%L)::text', 'admin_cfgb1'));
    t4 := pg_temp.cfg1b_valor(A, format('select public.nombre_libre(%L)::text', 'cfg b'));
    t5 := pg_temp.cfg1b_valor(A, format('select public.nombre_libre(%L)::text', 'CFGB_A_FINAL'));
    t6 := pg_temp.cfg1b_valor(B, format('select public.nombre_libre(%L)::text', 'CFGB_A_FINAL'));
    t7 := pg_temp.cfg1b_valor(A, 'select public.nombre_libre(null)::text');
    v_o := v_o || 106; v_p := v_p || 'B6 · nombre_libre: libre sí; ocupado, vedado, mala forma y nulo no; el propio en otra caja sí'::text;
    v_r := v_r || case when t1 = 'true' and t2 = 'false' and t3 = 'false' and t4 = 'false'
                        and t5 = 'true' and t6 = 'false' and t7 = 'false' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('libre=%s · de otro=%s · vedado=%s · forma=%s · el propio=%s · el de A visto por B=%s · nulo=%s',
                         t1, t2, t3, t4, t5, t6, t7);

    -- ── B7 · pais y estado ───────────────────────────────────────────────
    t1 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'pais = ''ve'', estado = null', A)), '·', 1);
    t2 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'pais = ''ES'', estado = ''ZUL''', A)), '·', 1);
    t3 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'pais = ''VE'', estado = ''ESQ''', A)), '·', 1);
    t4 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'pais = null, estado = ''ZUL''', A)), '·', 1);
    t5 := pg_temp.cfg1b_como(A, format(ACT, 'pais = ''VE'', estado = ''LGU''', A))
       || ' ' || pg_temp.cfg1b_como(A, format(ACT, 'pais = ''ES'', estado = null', A))
       || ' ' || pg_temp.cfg1b_como(A, format(ACT, 'pais = null, estado = null', A));
    t6 := pg_temp.cfg1b_como(A, format(ACT, 'pais = ''CO''', B));
    select count(*) into n from public.profiles where id = B and pais is null;
    v_o := v_o || 107; v_p := v_p || 'B7 · lugar: ve, ES+estado, estado fuera de lista y estado sin país → 23514; los válidos pasan'::text;
    v_r := v_r || case when t1 = '23514' and t2 = '23514' and t3 = '23514' and t4 = '23514'
                        and t5 = 'PASA·1 PASA·1 PASA·1' and t6 = 'PASA·0' and n = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('ve=%s · ES+ZUL=%s · VE+ESQ=%s · nulo+ZUL=%s · VE+LGU, ES, nulo → %s · el de B por A → %s',
                         t1, t2, t3, t4, t5, t6);

    -- ── B8 · columnas fuera del grant ────────────────────────────────────
    t1 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'created_at = now()', A)), '·', 1);
    t2 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'updated_at = now()', A)), '·', 1);
    t3 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'id = id', A)), '·', 1);
    t4 := split_part(pg_temp.cfg1b_como(A, format(ACT, 'nombre_cambiado_en = null', A)), '·', 1);
    v_o := v_o || 108; v_p := v_p || 'B8 · el cliente no escribe created_at, updated_at, id ni nombre_cambiado_en (42501)'::text;
    v_r := v_r || case when t1 = '42501' and t2 = '42501' and t3 = '42501' and t4 = '42501' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('created_at=%s · updated_at=%s · id=%s · nombre_cambiado_en=%s', t1, t2, t3, t4);

    -- ── B9 · el alta (el Bautizo) no cuenta como cambio ──────────────────
    t1 := pg_temp.cfg1b_como(NU, format('insert into public.profiles (id, username, nombre_cambiado_en) values (%L, %L, %L)',
                                       NU, 'cfgb_n_verif', now() - interval '1 day'));
    select count(*) into n from public.profiles where id = NU and nombre_cambiado_en is null;
    t2 := pg_temp.cfg1b_valor(NU, 'select public.mi_proximo_cambio()::text');
    t3 := pg_temp.cfg1b_como(NU, format(ACT, format('username = %L', 'cfgb_n_nuevo'), NU));
    v_o := v_o || 109; v_p := v_p || 'B9 · alta con nombre_cambiado_en a mano: nace nula; el primer cambio pasa'::text;
    v_r := v_r || case when t1 = 'PASA·1' and n = 1 and t2 = 'null' and t3 = 'PASA·1' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('alta → %s · nula=%s · mi_proximo_cambio=%s · primer cambio → %s', t1, n = 1, t2, t3);

    -- ── B10 · mini_perfil y ranking_top traen el lugar ───────────────────
    t1 := pg_temp.cfg1b_como(A, format(ACT, 'pais = ''VE'', estado = ''ZUL''', A));
    r := public.ajuste_admin(A, 1000000000000, 'CFG-1 1b · verificación');
    t2 := pg_temp.cfg1b_valor(B, format('select pais || ''/'' || estado from public.mini_perfil(%L)', 'CFGB_A_FINAL'));
    t3 := pg_temp.cfg1b_valor(A, format('select coalesce(pais, ''-'') || ''/'' || coalesce(estado, ''-'') from public.mini_perfil(%L)', 'cfgb_b_verif'));
    t4 := pg_temp.cfg1b_valor(A, 'select pais || ''/'' || estado from public.ranking_top(''fortunas'') where es_tu');
    t5 := pg_temp.cfg1b_valor(B, 'select pais || ''/'' || estado from public.ranking_top(''fortunas'') where username = ''cfgb_a_final''');
    v_o := v_o || 110; v_p := v_p || 'B10 · mini_perfil y ranking_top devuelven pais y estado (y nulos sin lugar)'::text;
    v_r := v_r || case when t1 = 'PASA·1' and (r).aplicado and t2 = 'VE/ZUL' and t3 = '-/-' and t4 = 'VE/ZUL' and t5 = 'VE/ZUL'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('lugar → %s · ajuste=%s · mini_perfil de A=%s, de B=%s · ranking_top: A=%s, A visto por B=%s',
                         t1, (r).aplicado, t2, t3, t4, t5);

    -- ── B11 · un nombre que la lista alcanzó después no frena el lugar ────
    -- La cuenta nace con un nombre limpio; la palabra se veda luego, dentro
    -- de esta transacción (`cfgb_vetado1` normaliza a `cfgbvetadoi`).
    insert into public.profiles (id, username) values (VE, 'cfgb_vetado1');
    insert into public.reserved_usernames (word) values ('cfgbvetado');
    t1 := pg_temp.cfg1b_como(VE, format(ACT, 'pais = ''VE'', estado = ''ZUL''', VE));
    t2 := split_part(pg_temp.cfg1b_como(VE, format(ACT, format('username = %L', 'cfgb_vetado2'), VE)), '·', 1);
    select username, pais || '/' || estado into t3, t4 from public.profiles where id = VE;
    v_o := v_o || 111; v_p := v_p || 'B11 · nombre que cae en un vedado nuevo: cambia pais y estado; otro nombre vedado sigue en P0001'::text;
    v_r := v_r || case when t1 = 'PASA·1' and t2 = 'P0001' and t3 = 'cfgb_vetado1' and t4 = 'VE/ZUL'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('vedado=%s · lugar → %s · cambio a cfgb_vetado2 → %s · queda %s en %s',
                         public.username_vedado('cfgb_vetado1'), t1, t2, t3, t4);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'cfg1b_deshacer';
  exception when others then
    if sqlerrm <> 'cfg1b_deshacer' then
      v_o := v_o || 999; v_p := v_p || 'X · el guion se detuvo'::text;
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.cfg1b_verificar()
 order by orden;

rollback;
