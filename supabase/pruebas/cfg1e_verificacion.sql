-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · CFG-1 · Fase 1e — Verificación de Mano actual de pago
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_CFG-1_Fase1e_v1.0.md §1.3.
-- Migración que verifica: supabase/migrations/20261030193000_cfg1e_mano_actual.sql.
--
-- CÓMO SE USA: como los de ECO-1, RNK-1, la 1c y la 1b. Se pega ENTERO en el
-- SQL Editor DESPUÉS del push y se corre UNA vez. Devuelve UNA tabla
-- `prueba | resultado | detalle`: primero el Grupo A (definición y permisos),
-- después el Grupo B (comportamiento). Cada fila debe decir PASA. No enseña
-- correos ni uuids de cuentas reales. Antes del push lo corre `npm run guiones`
-- contra un Postgres en memoria.
--
-- NO DEJA RASTRO, por los mismos dos caminos de siempre: `begin;` … `rollback;`,
-- y una función en `pg_temp` que lo corre todo dentro de un bloque con
-- `exception` y lo deshace lanzando `cfg1e_deshacer`.
--
-- COMO EL CLIENTE. Lo que hace el teléfono (consultar, leer el contador, tocar
-- la tabla) se corre con `set local role authenticated` y la sesión en
-- `request.jwt.claims`, por `pg_temp.cfg1e_como`, `pg_temp.cfg1e_consultar` y
-- `pg_temp.cfg1e_mi`. Sentarse se hace con `sentarse_ia`, como en la app.
--
-- EL RELOJ. `now()` no se mueve en la transacción, así que el límite de 30 por
-- minuto contaría todas las llamadas del guion juntas: entre bloques, las
-- anotaciones de `intentos_dinero` se corren 2 minutos atrás (molde de la 1g).
--
-- LA MANO ES LA UNIDAD (rector, STOP-E1 P-1). La primera consulta de una mano
-- gasta una gratis o cobra; las siguientes de esa mano, nada ('repetida').
--
-- LAS CUENTAS. Fabrica seis (`cfge_a_verif` en Básico, `cfge_r_verif` para
-- repetir en gratis, `cfge_c_verif` en Avanzado, `cfge_d_verif` en Pro,
-- `cfge_p_verif` sin saldo para pagar y `cfge_n_verif`, la nueva). Todas se
-- deshacen.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Corre `p_sql` como el cliente con la sesión de `p_uid`. Devuelve
-- `PASA·<filas>` o `<sqlstate>·<mensaje>`.
create function pg_temp.cfg1e_como(p_uid uuid, p_sql text)
returns text
language plpgsql
as $fn$
declare
  n bigint;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  set local role authenticated;
  execute p_sql;
  get diagnostics n = row_count;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return 'PASA·' || n;
exception when others then
  return sqlstate || '·' || sqlerrm;
end
$fn$;

-- `consultar_mano` como el cliente: `resultado·precio·gratis_restantes·saldo`,
-- o `ERROR·<sqlstate>`. Con `p_uid` nulo, sin sesión.
create function pg_temp.cfg1e_consultar(p_uid uuid, p_mesa uuid, p_mano integer)
returns text
language plpgsql
as $fn$
declare
  v text;
begin
  if p_uid is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
    set local role authenticated;
  else
    perform set_config('request.jwt.claims', '', true);
  end if;
  select format('%s·%s·%s·%s', r.resultado, r.precio, r.gratis_restantes, r.saldo) into v
    from public.consultar_mano(p_mesa, p_mano) r;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
exception when others then
  return 'ERROR·' || sqlstate;
end
$fn$;

-- `mi_consulta` como el cliente: `gratis_restantes·ultima_mesa·ultima_mano`.
create function pg_temp.cfg1e_mi(p_uid uuid)
returns text
language plpgsql
as $fn$
declare
  v text;
begin
  if p_uid is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
    set local role authenticated;
  else
    perform set_config('request.jwt.claims', '', true);
  end if;
  select format('%s·%s·%s', r.gratis_restantes, coalesce(r.ultima_mesa::text, 'null'),
                coalesce(r.ultima_mano::text, 'null')) into v
    from public.mi_consulta() r;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
exception when others then
  return 'ERROR·' || sqlstate;
end
$fn$;

-- Sienta a `p_uid` en una mesa contra las IAS de 2 con la apuesta mínima del
-- reto y la entrada mínima (10×). Devuelve el id de la mesa.
create function pg_temp.cfg1e_sentar(p_uid uuid, p_reto text)
returns uuid
language plpgsql
as $fn$
declare
  r public.mesa_ia_resultado;
  v_apuesta integer := (public.ia_apuestas_de(p_reto))[1];
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  r := public.sentarse_ia(p_reto, 2, v_apuesta, public.ia_entrada_piso(v_apuesta), gen_random_uuid());
  perform set_config('request.jwt.claims', '', true);
  if r.codigo <> 'ok' then
    raise exception 'cfg1e: sentarse_ia(%) → %', p_reto, r.codigo;
  end if;
  return r.mesa_id;
end
$fn$;

create function pg_temp.cfg1e_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  A  constant uuid := 'c1e00000-0000-4000-8000-00000000000a';
  C  constant uuid := 'c1e00000-0000-4000-8000-00000000000c';
  D  constant uuid := 'c1e00000-0000-4000-8000-00000000000d';
  P  constant uuid := 'c1e00000-0000-4000-8000-00000000000e';
  NU constant uuid := 'c1e00000-0000-4000-8000-00000000000f';
  RE constant uuid := 'c1e00000-0000-4000-8000-000000000010';
  TIPOS constant text[] := array['bono_bienvenida', 'constancia', 'video', 'entrada_ia', 'recarga_ia',
                                 'salida_ia', 'abandono_ia', 'compra', 'ajuste_admin', 'garantia_pvp',
                                 'liberacion_pvp', 'resultado_pvp', 'consulta',
                                 -- MES-PvP v1.3-b · la recarga PvP (`20261108120000_mespvp_v13_recarga.sql`).
                                 'recarga_pvp'];

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  r   public.movimiento_resultado;
  m_a uuid; m_c uuid; m_d uuid; m_p uuid; m_n uuid; m_r uuid;
  t1 text; t2 text; t3 text; t4 text; t5 text; t6 text;
  s0 bigint; s1 bigint; s2 bigint;
  n  bigint; n1 bigint; n2 bigint; n3 bigint;
  i  integer;
  ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean;
  serie text;
  esperada text;
begin
  begin
    -- ═══ GRUPO A · definición y permisos ═════════════════════════════════

    -- ── A1 · la tabla consultas ──────────────────────────────────────────
    select count(*) into n1
      from information_schema.columns
     where table_schema = 'public' and table_name = 'consultas'
       and (column_name, data_type, is_nullable) in (
             ('jugador_id', 'uuid', 'NO'), ('gratis_usadas', 'smallint', 'NO'),
             ('ultima_mesa', 'uuid', 'YES'), ('ultima_mano', 'integer', 'YES'),
             ('actualizada_en', 'timestamp with time zone', 'NO'));
    select count(*) into n2 from information_schema.columns
     where table_schema = 'public' and table_name = 'consultas';
    select count(*) into n3 from pg_constraint
     where conrelid = 'public.consultas'::regclass and contype = 'c'
       and conname in ('consultas_gratis_chk', 'consultas_ultima_chk');
    select count(*) into n from pg_constraint
     where conrelid = 'public.consultas'::regclass and contype = 'f' and confdeltype = 'c'
       and confrelid = 'public.profiles'::regclass;
    select c.relrowsecurity into ok1 from pg_class c where c.oid = 'public.consultas'::regclass;
    select count(*) into s0 from pg_policies where schemaname = 'public' and tablename = 'consultas';
    v_o := v_o || 1; v_p := v_p || 'A1 · consultas: cinco columnas con su tipo, dos CHECK, FK en cascada a profiles, RLS sin políticas'::text;
    v_r := v_r || case when n1 = 5 and n2 = 5 and n3 = 2 and n = 1 and ok1 and s0 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('columnas con su forma=%s de 5 (hay %s) · CHECK=%s de 2 · FK cascada=%s · RLS=%s · políticas=%s',
                         n1, n2, n3, n, ok1, s0);

    -- ── A2 · 'consulta' en el libro, sin perder ningún tipo ──────────────
    select pg_get_constraintdef(oid) into t1 from pg_constraint
     where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk';
    select count(*) into n1 from unnest(TIPOS) as x(tipo) where t1 like '%''' || x.tipo || '''%';
    select count(*) into n2 from regexp_matches(coalesce(t1, ''), '''[a-z_]+''', 'g');
    v_o := v_o || 2; v_p := v_p || 'A2 · movimientos_tipo_chk: los 12 tipos de antes, consulta y recarga_pvp (v1.3), ninguno más'::text;
    v_r := v_r || case when n1 = 14 and n2 = 14 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('de la lista=%s de 14 · literales en la restricción=%s', n1, n2);

    -- ── A3 · las cifras ──────────────────────────────────────────────────
    t1 := public.precio_consulta('basico') || '/' || public.precio_consulta('avanzado') || '/'
       || public.precio_consulta('pro') || '/' || public.precio_consulta('humanos');
    begin
      perform public.precio_consulta('inventado'); t2 := 'sin error';
    exception when others then t2 := sqlstate;
    end;
    begin
      perform public.precio_consulta(null); t3 := 'sin error';
    exception when others then t3 := sqlstate;
    end;
    select count(*) into n from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname in ('precio_consulta', 'consultas_gratis')
       and f.provolatile = 'i' and not f.prosecdef and f.proconfig @> array['search_path=""'];
    v_o := v_o || 3; v_p := v_p || 'A3 · precio_consulta 100/200/300/500, otro nivel y nulo 22023; consultas_gratis 20; inmutables'::text;
    v_r := v_r || case when t1 = '100/200/300/500' and t2 = '22023' and t3 = '22023'
                        and public.consultas_gratis() = 20 and n = 2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('precios=%s · inventado=%s · nulo=%s · gratis=%s · inmutables con search_path=%s de 2',
                         t1, t2, t3, public.consultas_gratis(), n);

    -- ── A4 · las dos del cliente: forma, definer, search_path ────────────
    select count(*) into n from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.prosecdef and f.proconfig @> array['search_path=""']
       and ((f.proname = 'consultar_mano' and pg_get_function_identity_arguments(f.oid) = 'p_mesa uuid, p_mano integer'
             and f.prorettype = 'public.consulta_resultado'::regtype and f.provolatile = 'v')
         or (f.proname = 'mi_consulta' and pg_get_function_identity_arguments(f.oid) = ''
             and f.prorettype = 'public.consulta_estado'::regtype));
    select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname in ('consultar_mano', 'mi_consulta');
    v_o := v_o || 4; v_p := v_p || 'A4 · consultar_mano(uuid, integer) y mi_consulta(): una firma cada una, definer con search_path vacío'::text;
    v_r := v_r || case when n = 2 and n1 = 2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('con su forma=%s de 2 · firmas=%s', n, n1);

    -- ── A5 · quién ejecuta qué ───────────────────────────────────────────
    ok1 := has_function_privilege('authenticated', 'public.consultar_mano(uuid, integer)', 'execute')
       and has_function_privilege('authenticated', 'public.mi_consulta()', 'execute');
    ok2 := has_function_privilege('anon', 'public.consultar_mano(uuid, integer)', 'execute')
        or has_function_privilege('anon', 'public.mi_consulta()', 'execute');
    ok3 := has_function_privilege('authenticated', 'public.precio_consulta(text)', 'execute')
        or has_function_privilege('authenticated', 'public.consultas_gratis()', 'execute')
        or has_function_privilege('anon', 'public.precio_consulta(text)', 'execute')
        or has_function_privilege('anon', 'public.consultas_gratis()', 'execute');
    select count(*) into n from pg_proc f, aclexplode(f.proacl) a
     where f.oid in ('public.consultar_mano(uuid, integer)'::regprocedure, 'public.mi_consulta()'::regprocedure,
                     'public.precio_consulta(text)'::regprocedure, 'public.consultas_gratis()'::regprocedure)
       and a.grantee = 0 and a.privilege_type = 'EXECUTE';
    ok4 := has_table_privilege('authenticated', 'public.consultas', 'select')
        or has_table_privilege('authenticated', 'public.consultas', 'insert')
        or has_table_privilege('authenticated', 'public.consultas', 'update')
        or has_table_privilege('authenticated', 'public.consultas', 'delete')
        or has_table_privilege('anon', 'public.consultas', 'select');
    v_o := v_o || 5; v_p := v_p || 'A5 · las dos del cliente, solo authenticated; las cifras, nadie; public, ninguna; la tabla, cerrada'::text;
    v_r := v_r || case when ok1 and not ok2 and not ok3 and n = 0 and not ok4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('authenticated en las 2=%s · anon en alguna=%s · cifras al cliente=%s · public=%s · tabla al cliente=%s',
                         ok1, ok2, ok3, n, ok4);

    -- ── A6 · A10 de RNK-1 sigue en su cuenta ─────────────────────────────
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
    v_o := v_o || 6; v_p := v_p || 'A6 · INV-67 (A10 de RNK-1): las tres lecturas del ranking, 17 columnas, ninguna uuid ni correo'::text;
    v_r := v_r || case when n1 = 0 and n2 = 17 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('columnas devueltas=%s de 17 · con uuid o correo=%s', n2, n1);

    -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'cfg1e.verif.' || u.n || '@example.invalid', '', now(), now(), '{}', '{}'
      from (values (A, 'a'), (C, 'c'), (D, 'd'), (P, 'p'), (NU, 'n'), (RE, 'r')) as u(id, n);
    insert into public.profiles (id, username)
    values (A, 'cfge_a_verif'), (C, 'cfge_c_verif'), (D, 'cfge_d_verif'), (P, 'cfge_p_verif'), (NU, 'cfge_n_verif'),
           (RE, 'cfge_r_verif');
    -- Saldo seguro aunque la base real no diera el bono a estas huellas.
    perform public.ajuste_admin(x, 5000, 'CFG-1 1e · verificación') from unnest(array[A, C, D, P, NU, RE]) as x;

    -- ── B1 · el cliente no toca la tabla ni las cifras ───────────────────
    t1 := split_part(pg_temp.cfg1e_como(A, 'select * from public.consultas'), '·', 1);
    t2 := split_part(pg_temp.cfg1e_como(A, format('insert into public.consultas (jugador_id, gratis_usadas) values (%L, 0)', A)), '·', 1);
    t3 := split_part(pg_temp.cfg1e_como(A, format('update public.consultas set gratis_usadas = 0 where jugador_id = %L', A)), '·', 1);
    t4 := split_part(pg_temp.cfg1e_como(A, 'select public.precio_consulta(''basico'')'), '·', 1);
    v_o := v_o || 101; v_p := v_p || 'B1 · el cliente: leer, escribir o cambiar consultas, y precio_consulta → 42501'::text;
    v_r := v_r || case when t1 = '42501' and t2 = '42501' and t3 = '42501' and t4 = '42501' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('select=%s · insert=%s · update=%s · precio_consulta=%s', t1, t2, t3, t4);

    -- ── B2 · veinte gratis en veinte manos ───────────────────────────────
    m_a := pg_temp.cfg1e_sentar(A, 'basico');
    s0 := public.ia_saldo_actual(A);
    serie := '';
    ok1 := true;
    for i in 1..20 loop
      t1 := pg_temp.cfg1e_consultar(A, m_a, i);
      serie := serie || split_part(t1, '·', 3) || case when i < 20 then ',' else '' end;
      ok1 := ok1 and split_part(t1, '·', 1) = 'gratis' and split_part(t1, '·', 2) = '100'
                 and split_part(t1, '·', 4) = s0::text;
    end loop;
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    select count(*) into n1 from public.consultas where jugador_id = A and gratis_usadas = 20
       and ultima_mesa = m_a and ultima_mano = 20;
    esperada := '19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0';
    v_o := v_o || 102; v_p := v_p || 'B2 · veinte consultas en las manos 1 a 20: gratis, de 19 a 0, precio 100, el saldo quieto, nada en el libro'::text;
    v_r := v_r || case when ok1 and serie = esperada and public.ia_saldo_actual(A) = s0 and n = 0 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('restantes=%s · todas gratis con el saldo quieto=%s · movimientos=%s · fila en 20 con última=(mesa, 20) %s',
                         serie, ok1, n, n1 = 1);
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = A;

    -- ── B3 · repetir una mano en gratis no gasta ─────────────────────────
    m_r := pg_temp.cfg1e_sentar(RE, 'basico');
    s0 := public.ia_saldo_actual(RE);
    t1 := pg_temp.cfg1e_consultar(RE, m_r, 1);
    t2 := pg_temp.cfg1e_consultar(RE, m_r, 1);
    t3 := pg_temp.cfg1e_consultar(RE, m_r, 1);
    t4 := pg_temp.cfg1e_mi(RE);
    select count(*) into n from public.movimientos where jugador_id = RE and tipo = 'consulta';
    v_o := v_o || 103; v_p := v_p || 'B3 · la mano 1 tres veces con gratis: la primera gasta (19), las otras dos repetida sin tocar nada'::text;
    v_r := v_r || case when t1 = format('gratis·100·19·%s', s0) and t2 = format('repetida·100·19·%s', s0) and t3 = t2
                        and t4 = format('19·%s·1', m_r) and public.ia_saldo_actual(RE) = s0 and n = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s, %s, %s · mi_consulta=19·(mesa)·1 %s · saldo quieto=%s · movimientos=%s',
                         split_part(t1, '·', 1) || '·' || split_part(t1, '·', 3),
                         split_part(t2, '·', 1) || '·' || split_part(t2, '·', 3),
                         split_part(t3, '·', 1) || '·' || split_part(t3, '·', 3),
                         t4 = format('19·%s·1', m_r), public.ia_saldo_actual(RE) = s0, n);

    -- ── B4 · la 21.ª cobra ───────────────────────────────────────────────
    s0 := public.ia_saldo_actual(A);
    t1 := pg_temp.cfg1e_consultar(A, m_a, 21);
    s1 := public.ia_saldo_actual(A);
    select count(*) into n from public.movimientos
     where jugador_id = A and tipo = 'consulta' and monto = -100 and saldo_tras = s1
       and motivo = 'Mano actual · Básico' and ref_tipo = 'mesa_ia' and ref_id = m_a::text
       and clave_idem = 'consulta:' || m_a::text || ':21';
    select count(*) into n1 from public.consultas where jugador_id = A and ultima_mesa = m_a and ultima_mano = 21;
    v_o := v_o || 104; v_p := v_p || 'B4 · la 21.ª (mano 21, Básico): cobrada, saldo − 100, un movimiento consulta con su nota, última = mano 21'::text;
    v_r := v_r || case when t1 = format('cobrada·100·0·%s', s0 - 100) and s1 = s0 - 100 and n = 1 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · saldo %s → %s · movimiento con la forma=%s · última=(mesa, 21) %s',
                         split_part(t1, '·', 1) || '·' || split_part(t1, '·', 2), s0, s1, n, n1 = 1);

    -- ── B5 · la misma mano otra vez ──────────────────────────────────────
    t1 := pg_temp.cfg1e_consultar(A, m_a, 21);
    t2 := pg_temp.cfg1e_consultar(A, m_a, 21);
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    v_o := v_o || 105; v_p := v_p || 'B5 · la mano 21 dos veces más: repetida, sin cobro; un solo movimiento'::text;
    v_r := v_r || case when t1 = format('repetida·100·0·%s', s1) and t2 = t1 and public.ia_saldo_actual(A) = s1 and n = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s, %s · saldo=%s · movimientos=%s', split_part(t1, '·', 1), split_part(t2, '·', 1),
                         public.ia_saldo_actual(A) - s1, n);

    -- ── B6 · otra mano ───────────────────────────────────────────────────
    t1 := pg_temp.cfg1e_consultar(A, m_a, 22);
    s2 := public.ia_saldo_actual(A);
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    select count(*) into n1 from public.consultas where jugador_id = A and ultima_mesa = m_a and ultima_mano = 22;
    v_o := v_o || 106; v_p := v_p || 'B6 · la mano 22: cobrada otra vez, saldo − 100, dos movimientos, última = mano 22'::text;
    v_r := v_r || case when t1 = format('cobrada·100·0·%s', s1 - 100) and s2 = s1 - 100 and n = 2 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · saldo %s → %s · movimientos=%s · última=(mesa, 22) %s',
                         split_part(t1, '·', 1), s1, s2, n, n1 = 1);

    -- ── B7 · volver a la mano 21: el libro ya la tiene ───────────────────
    t1 := pg_temp.cfg1e_consultar(A, m_a, 21);
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    select count(*) into n1 from public.consultas where jugador_id = A and ultima_mesa = m_a and ultima_mano = 22;
    v_o := v_o || 107; v_p := v_p || 'B7 · la mano 21 tras pagar la 22: pagada por la clave del libro, sin cobro; la última sigue en 22'::text;
    v_r := v_r || case when t1 = format('pagada·100·0·%s', s2) and public.ia_saldo_actual(A) = s2 and n = 2 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · saldo quieto=%s · movimientos=%s · última sigue en 22=%s',
                         split_part(t1, '·', 1), public.ia_saldo_actual(A) = s2, n, n1 = 1);

    -- ── B8 · Avanzado y Pro ──────────────────────────────────────────────
    -- Sin gratis desde el principio: el contador lo pone el dueño de la tabla.
    m_c := pg_temp.cfg1e_sentar(C, 'avanzado');
    m_d := pg_temp.cfg1e_sentar(D, 'pro');
    insert into public.consultas (jugador_id, gratis_usadas) values (C, 20), (D, 20);
    s0 := public.ia_saldo_actual(C);
    s1 := public.ia_saldo_actual(D);
    t1 := pg_temp.cfg1e_consultar(C, m_c, 1);
    t2 := pg_temp.cfg1e_consultar(D, m_d, 1);
    select count(*) into n from public.movimientos
     where (jugador_id = C and tipo = 'consulta' and monto = -200 and motivo = 'Mano actual · Avanzado')
        or (jugador_id = D and tipo = 'consulta' and monto = -300 and motivo = 'Mano actual · Pro');
    v_o := v_o || 108; v_p := v_p || 'B8 · el precio sale de la mesa: Avanzado 200 y Pro 300, con su nota'::text;
    v_r := v_r || case when t1 = format('cobrada·200·0·%s', s0 - 200) and t2 = format('cobrada·300·0·%s', s1 - 300) and n = 2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('Avanzado → %s · Pro → %s · movimientos con su nota=%s de 2',
                         split_part(t1, '·', 1) || '·' || split_part(t1, '·', 2),
                         split_part(t2, '·', 1) || '·' || split_part(t2, '·', 2), n);

    -- ── B9 · sin saldo para pagar ────────────────────────────────────────
    m_p := pg_temp.cfg1e_sentar(P, 'basico');
    r := public.ajuste_admin(P, 50 - public.ia_saldo_actual(P), 'CFG-1 1e · verificación');
    insert into public.consultas (jugador_id, gratis_usadas) values (P, 20);
    t1 := pg_temp.cfg1e_consultar(P, m_p, 1);
    t2 := pg_temp.cfg1e_consultar(P, m_p, 1);
    select count(*) into n from public.movimientos where jugador_id = P and tipo = 'consulta';
    select count(*) into n1 from public.consultas where jugador_id = P and ultima_mesa is null and gratis_usadas = 20;
    v_o := v_o || 109; v_p := v_p || 'B9 · saldo 50 contra 100: saldo_insuficiente dos veces, nada escrito (tampoco la última mano)'::text;
    v_r := v_r || case when (r).aplicado and t1 = 'saldo_insuficiente·100·0·50' and t2 = t1
                        and public.ia_saldo_actual(P) = 50 and n = 0 and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s, %s · saldo=%s · movimientos=%s · fila sin última=%s',
                         t1, split_part(t2, '·', 1), public.ia_saldo_actual(P), n, n1 = 1);

    -- ── B10 · mi_consulta cuadra ─────────────────────────────────────────
    t1 := pg_temp.cfg1e_mi(A);
    t2 := pg_temp.cfg1e_mi(NU);
    m_n := pg_temp.cfg1e_sentar(NU, 'basico');
    t3 := split_part(pg_temp.cfg1e_consultar(NU, m_n, 1), '·', 1) || ' ' || split_part(pg_temp.cfg1e_consultar(NU, m_n, 1), '·', 1)
       || ' ' || split_part(pg_temp.cfg1e_consultar(NU, m_n, 2), '·', 1);
    t4 := pg_temp.cfg1e_mi(NU);
    t5 := pg_temp.cfg1e_mi(P);
    v_o := v_o || 110; v_p := v_p || 'B10 · mi_consulta: A 0 con (mesa, 22); la nueva 20 y, tras manos 1, 1, 2, 18 con (mesa, 2); sin saldo, 0 sin última'::text;
    v_r := v_r || case when t1 = format('0·%s·22', m_a) and t2 = '20·null·null'
                        and t3 = 'gratis repetida gratis' and t4 = format('18·%s·2', m_n) and t5 = '0·null·null'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('A=0·(mesa de A)·22 %s · nueva=%s · %s → 18·(mesa)·2 %s · sin saldo=%s',
                         t1 = format('0·%s·22', m_a), t2, t3, t4 = format('18·%s·2', m_n), t5);

    -- ── B11 · sin sesión ─────────────────────────────────────────────────
    t1 := pg_temp.cfg1e_consultar(null, m_a, 23);
    t2 := pg_temp.cfg1e_mi(null);
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    v_o := v_o || 111; v_p := v_p || 'B11 · sin sesión: consultar_mano sin_sesion, mi_consulta 0; nada escrito'::text;
    v_r := v_r || case when t1 = 'sin_sesion·0·0·0' and t2 = '0·null·null' and n = 2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('consultar_mano → %s · mi_consulta → %s · movimientos de A=%s', t1, t2, n);

    -- ── B12 · mesa ajena, inexistente o cerrada; mano 0 o nula ───────────
    -- La nueva (18 gratis, última = mano 2) prueba que nada de esto gasta ni
    -- mueve la última mano.
    t1 := split_part(pg_temp.cfg1e_consultar(NU, m_a, 5), '·', 1);
    t2 := split_part(pg_temp.cfg1e_consultar(NU, gen_random_uuid(), 5), '·', 1);
    t3 := split_part(pg_temp.cfg1e_consultar(NU, m_n, 0), '·', 1);
    t4 := split_part(pg_temp.cfg1e_consultar(NU, m_n, null), '·', 1)
       || '/' || split_part(pg_temp.cfg1e_consultar(NU, null, 5), '·', 1);
    update public.mesas_ia set estado = 'cerrada', motivo_cierre = 'salida', cobrado = 0, cerrada_en = now()
     where id = m_n;
    t5 := split_part(pg_temp.cfg1e_consultar(NU, m_n, 5), '·', 1);
    t6 := pg_temp.cfg1e_mi(NU);
    v_o := v_o || 112; v_p := v_p || 'B12 · mesa ajena, inexistente o cerrada → mesa_invalida; mano 0 o nula → argumento_invalido; sin gastar'::text;
    v_r := v_r || case when t1 = 'mesa_invalida' and t2 = 'mesa_invalida' and t3 = 'argumento_invalido'
                        and t4 = 'argumento_invalido/argumento_invalido' and t5 = 'mesa_invalida'
                        and t6 = format('18·%s·2', m_n)
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('ajena=%s · inexistente=%s · mano 0=%s · nulas=%s · cerrada=%s · le quedan=%s con la última intacta=%s',
                         t1, t2, t3, t4, t5, split_part(t6, '·', 1), t6 = format('18·%s·2', m_n));

    -- ── B13 · el límite: 30 por minuto ───────────────────────────────────
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = D;
    s1 := public.ia_saldo_actual(D);
    ok1 := true;
    for i in 1..30 loop
      ok1 := ok1 and split_part(pg_temp.cfg1e_consultar(D, m_d, 1), '·', 1) = 'repetida';
    end loop;
    t1 := pg_temp.cfg1e_consultar(D, m_d, 2);
    select count(*) into n from public.movimientos where jugador_id = D and tipo = 'consulta';
    select count(*) into n1 from public.intentos_dinero
     where jugador_id = D and funcion = 'consultar_mano' and en > now() - interval '1 minute';
    v_o := v_o || 113; v_p := v_p || 'B13 · treinta en un minuto pasan; la 31.ª, límite, sin cobrar aunque sea otra mano'::text;
    v_r := v_r || case when ok1 and t1 = format('limite·0·0·%s', s1) and public.ia_saldo_actual(D) = s1 and n = 1 and n1 = 31
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('30 repetidas=%s · 31.ª → %s · saldo quieto=%s · movimientos=%s · anotadas=%s',
                         ok1, split_part(t1, '·', 1), public.ia_saldo_actual(D) = s1, n, n1);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'cfg1e_deshacer';
  exception when others then
    if sqlerrm <> 'cfg1e_deshacer' then
      v_o := v_o || 999; v_p := v_p || 'X · el guion se detuvo'::text;
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.cfg1e_verificar()
 order by orden;

rollback;
