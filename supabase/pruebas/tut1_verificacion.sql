-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · TUT-1 · tanda 3 — Verificación: el premio de la partida guiada
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_TUT-1_T3_v1.0.md §1.1. Normativo: docs/AJILEI_Tutorial_v1.4.md §1.5.
-- Migración que verifica: supabase/migrations/20261121150000_tut1_guiada.sql.
--
-- CÓMO SE USA: `npm run guiones` lo corre entero contra un Postgres en memoria antes del push.
-- Después del push, Victor pega en el SQL Editor cada grupo ENTERO, uno por pestaña (van
-- comentados al pie de la migración y en el informe de la tanda 3): cada uno acaba en una única
-- consulta `comprobación | resultado | detalle`, y cada fila debe decir PASA. 9 el Grupo A
-- (forma y permisos) y 14 el Grupo B (comportamiento).
--
-- NO DEJA RASTRO. El Grupo A solo lee el catálogo. El Grupo B lo hace todo dentro de un bloque
-- con `exception` y lo deshace lanzando `tut1_deshacer`; aquí, además, `begin;` … `rollback;`.
--
-- LAS CUENTAS DEL GRUPO B. Siete, fabricadas y borradas con el bloque:
--   L  limpia: cobra 2.000, y otra vez no cobra.
--   S  se sienta contra las IAS y no cierra ninguna mano: sigue limpia.
--   J  cierra una mano contra las IAS: 1.000; y con ella, el límite por minuto.
--   P  cierra una mano contra Q en una mesa de 2 entre personas: 1.000.
--   Q  la rival de P.
--   R  con un correo de Gmail con alias: cobra, se borra, y vuelve como R2 con otro alias del
--      mismo correo canónico: «cobrado», sin un HC más.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── GRUPO A · forma y permisos ─────────────────────────────────────────────
create or replace function pg_temp.tut1_fila(p_o integer, p_c text, p_ok boolean, p_d text)
returns jsonb language sql immutable as $fn$
  select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
$fn$;

create or replace function pg_temp.tut1_verificar_a()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  TIPOS constant text[] := array['bono_bienvenida', 'constancia', 'video', 'entrada_ia', 'recarga_ia',
                                 'salida_ia', 'abandono_ia', 'compra', 'ajuste_admin', 'garantia_pvp',
                                 'liberacion_pvp', 'resultado_pvp', 'recarga_pvp', 'consulta', 'premio_guiada'];
  INTERNAS constant text[] := array['public.premio_guiada_hc(text)', 'public.guiada_mano_jugada(uuid)',
                                    'public.guiada_premio_invitacion(uuid)', 'public.guiada_tramo(uuid)'];
  f  jsonb := '[]';
  x  text;
  n  integer;
  n1 integer;
  n2 integer;
begin
  -- ── A1 · el tipo nuevo, sin perder ninguno ─────────────────────────────
  select pg_get_constraintdef(oid) into x from pg_constraint
   where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk';
  select count(*) into n1 from unnest(TIPOS) as t(tipo) where x like '%''' || t.tipo || '''%';
  select count(*) into n2 from regexp_matches(coalesce(x, ''), '''[a-z_]+''', 'g');
  f := f || pg_temp.tut1_fila(1, 'A1 · movimientos_tipo_chk: los 14 tipos de antes y premio_guiada, ninguno más',
            n1 = 15 and n2 = 15, format('de la lista=%s de 15 · literales en la restricción=%s', n1, n2));

  -- ── A2 · la tabla ──────────────────────────────────────────────────────
  x := (select string_agg(attname || ':' || format_type(atttypid, atttypmod) || ':' || attnotnull, ', ' order by attnum)
          from pg_attribute where attrelid = 'public.premios_guiada'::regclass and attnum > 0 and not attisdropped);
  f := f || pg_temp.tut1_fila(2, 'A2 · premios_guiada: huella (clave), jugador_id, monto, tramo, cobrado_en; sin FK; tramo y monto con su check',
            x = 'huella:text:true, jugador_id:uuid:true, monto:bigint:true, tramo:text:true, cobrado_en:timestamp with time zone:true'
            and exists (select 1 from pg_constraint where conrelid = 'public.premios_guiada'::regclass and contype = 'p'
                           and pg_get_constraintdef(oid) = 'PRIMARY KEY (huella)')
            and not exists (select 1 from pg_constraint where conrelid = 'public.premios_guiada'::regclass and contype = 'f')
            and (select count(*) from pg_constraint where conrelid = 'public.premios_guiada'::regclass and contype = 'c'
                   and conname in ('premios_guiada_monto_chk', 'premios_guiada_tramo_chk')) = 2,
            x);

  -- ── A3 · la puerta cerrada ─────────────────────────────────────────────
  f := f || pg_temp.tut1_fila(3, 'A3 · premios_guiada: RLS activo, cero políticas, ni anon ni authenticated con privilegio alguno',
            (select relrowsecurity from pg_class where oid = 'public.premios_guiada'::regclass)
            and (select count(*) from pg_policy where polrelid = 'public.premios_guiada'::regclass) = 0
            and not has_table_privilege('authenticated', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger')
            and not has_table_privilege('anon', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger'),
            format('rls=%s · políticas=%s · authenticated=%s · anon=%s',
                   (select relrowsecurity from pg_class where oid = 'public.premios_guiada'::regclass),
                   (select count(*) from pg_policy where polrelid = 'public.premios_guiada'::regclass),
                   has_table_privilege('authenticated', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger'),
                   has_table_privilege('anon', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger')));

  -- ── A4 · las cifras ────────────────────────────────────────────────────
  f := f || pg_temp.tut1_fila(4, 'A4 · premio_guiada_hc: limpio 2.000 · jugado 1.000 · invitado 1.000 · otro tramo nulo',
            public.premio_guiada_hc('limpio') = 2000 and public.premio_guiada_hc('jugado') = 1000
            and public.premio_guiada_hc('invitado') = 1000 and public.premio_guiada_hc('otro') is null,
            format('%s · %s · %s · %s', public.premio_guiada_hc('limpio'), public.premio_guiada_hc('jugado'),
                   public.premio_guiada_hc('invitado'), coalesce(public.premio_guiada_hc('otro')::text, 'nulo')));

  f := f || pg_temp.tut1_fila(5, 'A5 · limite_dinero: cobrar_guiada 5 por minuto; las de antes, igual',
            public.limite_dinero('cobrar_guiada') = 5 and public.limite_dinero('sentarse_ia') = 10
            and public.limite_dinero('cobrar_boleto') = 20 and public.limite_dinero('comprar_articulo') = 30
            and public.limite_dinero('consultar_mano') = 30 and public.limite_dinero('premio_guiada_estado') is null,
            format('cobrar_guiada=%s · sentarse_ia=%s · cobrar_boleto=%s · comprar_articulo=%s · consultar_mano=%s',
                   public.limite_dinero('cobrar_guiada'), public.limite_dinero('sentarse_ia'), public.limite_dinero('cobrar_boleto'),
                   public.limite_dinero('comprar_articulo'), public.limite_dinero('consultar_mano')));

  -- ── A6 y A7 · las dos del cliente ──────────────────────────────────────
  f := f || pg_temp.tut1_fila(6, 'A6 · premio_guiada_estado() → jsonb: una firma, sin argumentos, stable, definer, search_path vacío; authenticated sí, anon no',
            (select count(*) from pg_proc where proname = 'premio_guiada_estado' and pronamespace = 'public'::regnamespace) = 1
            and (select pronargs = 0 and provolatile = 's' and prosecdef and 'search_path=""' = any (proconfig) and prorettype = 'jsonb'::regtype
                   from pg_proc where oid = 'public.premio_guiada_estado()'::regprocedure)
            and has_function_privilege('authenticated', 'public.premio_guiada_estado()', 'execute')
            and not has_function_privilege('anon', 'public.premio_guiada_estado()', 'execute'),
            format('versiones=%s · authenticated=%s · anon=%s',
                   (select count(*) from pg_proc where proname = 'premio_guiada_estado' and pronamespace = 'public'::regnamespace),
                   has_function_privilege('authenticated', 'public.premio_guiada_estado()', 'execute'),
                   has_function_privilege('anon', 'public.premio_guiada_estado()', 'execute')));

  f := f || pg_temp.tut1_fila(7, 'A7 · cobrar_guiada() → jsonb: una firma, SIN argumentos (el tramo no viene del cliente), volatile, definer, search_path vacío; authenticated sí, anon no',
            (select count(*) from pg_proc where proname = 'cobrar_guiada' and pronamespace = 'public'::regnamespace) = 1
            and (select pronargs = 0 and provolatile = 'v' and prosecdef and 'search_path=""' = any (proconfig) and prorettype = 'jsonb'::regtype
                   from pg_proc where oid = 'public.cobrar_guiada()'::regprocedure)
            and has_function_privilege('authenticated', 'public.cobrar_guiada()', 'execute')
            and not has_function_privilege('anon', 'public.cobrar_guiada()', 'execute'),
            format('versiones=%s · authenticated=%s · anon=%s',
                   (select count(*) from pg_proc where proname = 'cobrar_guiada' and pronamespace = 'public'::regnamespace),
                   has_function_privilege('authenticated', 'public.cobrar_guiada()', 'execute'),
                   has_function_privilege('anon', 'public.cobrar_guiada()', 'execute')));

  -- ── A8 · las internas, a nadie ─────────────────────────────────────────
  select count(*) into n from unnest(INTERNAS) as i(firma)
   where has_function_privilege('authenticated', i.firma, 'execute') or has_function_privilege('anon', i.firma, 'execute');
  f := f || pg_temp.tut1_fila(8, 'A8 · premio_guiada_hc, guiada_mano_jugada, guiada_premio_invitacion y guiada_tramo: ni authenticated ni anon',
            n = 0, format('con permiso del cliente=%s de 4', n));

  -- ── A9 · fuera de Realtime ─────────────────────────────────────────────
  f := f || pg_temp.tut1_fila(9, 'A9 · premios_guiada fuera de supabase_realtime',
            not exists (select 1 from pg_publication_tables
                         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'premios_guiada'),
            format('en la publicación=%s', exists (select 1 from pg_publication_tables
                         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'premios_guiada')));

  return query
    select (x2 ->> 'o')::integer, x2 ->> 'c', x2 ->> 'r', x2 ->> 'd'
      from jsonb_array_elements(f) x2;
end
$fn$;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────

-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
create or replace function pg_temp.tut1_fila(p_o integer, p_c text, p_ok boolean, p_d text)
returns jsonb language sql immutable as $fn$
  select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
$fn$;

-- Una sentencia como el cliente (`authenticated` o `anon`, con la sesión de `p_uid` o sin
-- ninguna): su primera columna como texto, o `ERROR·<sqlstate>`.
create or replace function pg_temp.tut1_como(p_rol text, p_uid uuid, p_sql text)
returns text
language plpgsql
as $fn$
declare
  v text;
begin
  perform set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
  if p_rol = 'anon' then set local role anon; else set local role authenticated; end if;
  execute p_sql into v;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return coalesce(v, '(nulo)');
exception when others then
  return 'ERROR·' || sqlstate;
end
$fn$;

-- La sesión de una cuenta para las llamadas que el guion hace como dueño (`postgres`).
create or replace function pg_temp.tut1_sesion(p_uid uuid)
returns void language sql as $fn$
  select set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
$fn$;

create or replace function pg_temp.tut1_verificar_b()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  L  constant uuid := '7a100000-0000-4000-8000-00000000000a';
  S  constant uuid := '7a100000-0000-4000-8000-00000000000b';
  J  constant uuid := '7a100000-0000-4000-8000-00000000000c';
  P  constant uuid := '7a100000-0000-4000-8000-00000000000d';
  Q  constant uuid := '7a100000-0000-4000-8000-00000000000e';
  R  constant uuid := '7a100000-0000-4000-8000-00000000000f';
  R2 constant uuid := '7a100000-0000-4000-8000-000000000010';
  CORREO_R  constant text := 'ajilei.tut1.verif+uno@gmail.com';
  ALIAS_R   constant text := 'ajileitut1verif+dos@googlemail.com';
  CIEN      constant bigint := 100000;
  VISTAS    constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]';
  f    jsonb := '[]';
  jp   jsonb;
  jg   jsonb;
  v_mesa public.mesa_ia_resultado;
  v_sala public.salas;
  t1   text;
  t2   text;
  t3   text;
  t4   text;
  n    integer;
  n1   integer;
  n2   integer;
  s0   bigint;
  s1   bigint;
begin
  begin
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           u.correo, '', now(), now(), '{}', '{}'
      from (values (L, 'tut1.verif.l@example.invalid'), (S, 'tut1.verif.s@example.invalid'),
                   (J, 'tut1.verif.j@example.invalid'), (P, 'tut1.verif.p@example.invalid'),
                   (Q, 'tut1.verif.q@example.invalid'), (R, CORREO_R)) as u(id, correo);
    insert into public.profiles (id, username)
    values (L, 'tut1_l_verif'), (S, 'tut1_s_verif'), (J, 'tut1_j_verif'),
           (P, 'tut1_p_verif'), (Q, 'tut1_q_verif'), (R, 'tut1_r_verif');
    perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'TUT-1 T3 · verificación') from unnest(array[L, S, J, P, Q, R]) u;
    delete from public.intentos_dinero where jugador_id in (L, S, J, P, Q, R);

    -- ── B1…B4 · la cuenta limpia ─────────────────────────────────────────
    t1 := pg_temp.tut1_como('authenticated', L, 'select public.premio_guiada_estado()::text');
    f := f || pg_temp.tut1_fila(101, 'B1 · limpia (sin manos ni invitación): disponible, 2.000, tramo limpio',
              t1::jsonb = '{"estado":"disponible","monto":2000,"tramo":"limpio"}'::jsonb, t1);

    s0 := public.saldo_de(L);
    t1 := pg_temp.tut1_como('authenticated', L, 'select public.cobrar_guiada()::text');
    s1 := public.saldo_de(L);
    select count(*) into n from public.movimientos
     where jugador_id = L and tipo = 'premio_guiada' and monto = 2000 and saldo_tras = s1
       and clave_idem = 'guiada:' || public.huella_correo('tut1.verif.l@example.invalid');
    select count(*) into n1 from public.premios_guiada
     where huella = public.huella_correo('tut1.verif.l@example.invalid') and jugador_id = L and monto = 2000 and tramo = 'limpio';
    f := f || pg_temp.tut1_fila(102, 'B2 · cobrar: pagado 2.000; el saldo sube 2.000; una línea premio_guiada con clave guiada:<huella>; la marca, limpio',
              t1::jsonb @> jsonb_build_object('estado', 'pagado', 'monto', 2000, 'tramo', 'limpio', 'saldo', s1)
              and s1 = s0 + 2000 and n = 1 and n1 = 1,
              format('%s · saldo %s → %s · línea=%s · marca=%s', t1, s0, s1, n, n1));

    t1 := pg_temp.tut1_como('authenticated', L, 'select public.cobrar_guiada()::text');
    select count(*) into n from public.movimientos where jugador_id = L and tipo = 'premio_guiada';
    f := f || pg_temp.tut1_fila(103, 'B3 · cobrar otra vez: cobrado 2.000, sin error, sin línea nueva, el saldo igual',
              t1::jsonb @> '{"estado":"cobrado","monto":2000,"tramo":"limpio"}'::jsonb and n = 1 and public.saldo_de(L) = s1,
              format('%s · líneas=%s · saldo=%s', t1, n, public.saldo_de(L)));

    t1 := pg_temp.tut1_como('authenticated', L, 'select public.premio_guiada_estado()::text');
    f := f || pg_temp.tut1_fila(104, 'B4 · después, el estado dice cobrado, con la cifra y el tramo de entonces',
              t1::jsonb = '{"estado":"cobrado","monto":2000,"tramo":"limpio"}'::jsonb, t1);

    -- ── B5 · sentarse no es jugar ────────────────────────────────────────
    perform pg_temp.tut1_sesion(S);
    v_mesa := public.sentarse_ia('basico', 2, 50, public.ia_entrada_piso(50), gen_random_uuid());
    perform pg_temp.tut1_sesion(null);
    t1 := pg_temp.tut1_como('authenticated', S, 'select public.premio_guiada_estado()::text');
    f := f || pg_temp.tut1_fila(105, 'B5 · sentada contra las IAS sin cerrar ninguna mano (mano_informada 0): sigue limpia, 2.000',
              v_mesa.codigo = 'ok' and (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id) = 0
              and t1::jsonb = '{"estado":"disponible","monto":2000,"tramo":"limpio"}'::jsonb,
              format('sentarse=%s · mano_informada=%s · %s', v_mesa.codigo, (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id), t1));

    -- ── B6 · una mano cerrada contra las IAS ─────────────────────────────
    perform pg_temp.tut1_sesion(J);
    v_mesa := public.sentarse_ia('basico', 2, 50, public.ia_entrada_piso(50), gen_random_uuid());
    v_mesa := public.informar_pila(v_mesa.mesa_id, 1, public.ia_entrada_piso(50)::bigint, 2, true, 1, 0::smallint);
    perform pg_temp.tut1_sesion(null);
    t1 := pg_temp.tut1_como('authenticated', J, 'select public.premio_guiada_estado()::text');
    s0 := public.saldo_de(J);
    t2 := pg_temp.tut1_como('authenticated', J, 'select public.cobrar_guiada()::text');
    select count(*) into n from public.movimientos where jugador_id = J and tipo = 'premio_guiada' and monto = 1000;
    f := f || pg_temp.tut1_fila(106, 'B6 · una mano cerrada contra las IAS (mano_informada 1): disponible 1.000 jugado, y cobra 1.000',
              (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id) = 1
              and t1::jsonb = '{"estado":"disponible","monto":1000,"tramo":"jugado"}'::jsonb
              and t2::jsonb @> '{"estado":"pagado","monto":1000,"tramo":"jugado"}'::jsonb
              and public.saldo_de(J) = s0 + 1000 and n = 1,
              format('informar=%s · mano_informada=%s · estado %s · cobro %s · línea=%s',
                     v_mesa.codigo, (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id), t1, t2, n));

    -- ── B7 · una mano cerrada contra personas ────────────────────────────
    -- La mesa de 2, por el camino de siempre (el de `mespvp8` y `med1a`). Mano 1: gana P.
    perform pg_temp.tut1_sesion(P);
    v_sala := public.crear_sala('privada', 2::smallint, 100);
    perform pg_temp.tut1_sesion(Q);
    perform public.unirse_sala(null, v_sala.id);
    perform pg_temp.tut1_sesion(P);
    perform public.jugar_ya(v_sala.id);
    perform pg_temp.tut1_sesion(null);
    jp := public.crear_partida(v_sala.id, '{"version":0,"motor":{"handCount":1}}'::jsonb, null,
                              jsonb_build_object(P::text, 0, Q::text, 1), VISTAS);
    jg := public.guardar_jugada(v_sala.id, 0, '{"version":1,"motor":{"handCount":1}}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":2,"ajilei":0,"pilas":[2000,1000]}]'::jsonb);
    t1 := pg_temp.tut1_como('authenticated', P, 'select public.premio_guiada_estado()::text');
    t2 := pg_temp.tut1_como('authenticated', Q, 'select public.premio_guiada_estado()::text');
    t3 := pg_temp.tut1_como('authenticated', P, 'select public.cobrar_guiada()::text');
    f := f || pg_temp.tut1_fila(107, 'B7 · una mano cerrada entre personas (partida_asientos.manos 1): las dos cuentas, 1.000 jugado; P cobra 1.000',
              jg ->> 'ok' = 'true'
              and (select min(manos) from public.partida_asientos where sala_id = v_sala.id) = 1
              and t1::jsonb = '{"estado":"disponible","monto":1000,"tramo":"jugado"}'::jsonb
              and t2::jsonb = '{"estado":"disponible","monto":1000,"tramo":"jugado"}'::jsonb
              and t3::jsonb @> '{"estado":"pagado","monto":1000,"tramo":"jugado"}'::jsonb,
              format('partida=%s · jugada=%s · manos=%s · P %s · Q %s · cobro P %s', jp ->> 'ok', jg ->> 'ok',
                     (select string_agg(manos::text, ',' order by asiento) from public.partida_asientos where sala_id = v_sala.id), t1, t2, t3));

    -- ── B8 · cobra, borra la cuenta y vuelve con otro alias ──────────────
    t1 := pg_temp.tut1_como('authenticated', R, 'select public.cobrar_guiada()::text');
    delete from auth.users where id = R;
    select count(*) into n from public.premios_guiada where huella = public.huella_correo(CORREO_R);
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (R2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            ALIAS_R, '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (R2, 'tut1_r2_verif');
    t2 := pg_temp.tut1_como('authenticated', R2, 'select public.premio_guiada_estado()::text');
    t3 := pg_temp.tut1_como('authenticated', R2, 'select public.cobrar_guiada()::text');
    select count(*) into n1 from public.movimientos where jugador_id = R2 and tipo = 'premio_guiada';
    f := f || pg_temp.tut1_fila(108, 'B8 · cobra 2.000, borra la cuenta (la marca se queda) y vuelve con otro alias del mismo correo: cobrado, 0 HC más',
              t1::jsonb @> '{"estado":"pagado","monto":2000}'::jsonb
              and public.huella_correo(ALIAS_R) = public.huella_correo(CORREO_R) and n = 1
              and t2::jsonb = '{"estado":"cobrado","monto":2000,"tramo":"limpio"}'::jsonb
              and t3::jsonb @> '{"estado":"cobrado","monto":2000}'::jsonb
              and n1 = 0 and public.saldo_de(R2) = 0,
              format('cobro %s · marca tras borrar=%s · misma huella=%s · estado R2 %s · cobro R2 %s · líneas R2=%s · saldo R2=%s',
                     t1, n, public.huella_correo(ALIAS_R) = public.huella_correo(CORREO_R), t2, t3, n1, public.saldo_de(R2)));

    -- ── B9 y B10 · sin sesión, y anon ────────────────────────────────────
    select count(*) into n from public.premios_guiada;
    t1 := pg_temp.tut1_como('authenticated', null, 'select public.premio_guiada_estado()::text');
    t2 := pg_temp.tut1_como('authenticated', null, 'select public.cobrar_guiada()::text');
    f := f || pg_temp.tut1_fila(109, 'B9 · sin sesión: sin_sesion las dos, sin error y sin marca nueva',
              t1::jsonb ->> 'estado' = 'sin_sesion' and t2::jsonb ->> 'estado' = 'sin_sesion'
              and (select count(*) from public.premios_guiada) = n,
              format('estado %s · cobro %s', t1, t2));

    t1 := pg_temp.tut1_como('anon', null, 'select public.premio_guiada_estado()::text');
    t2 := pg_temp.tut1_como('anon', null, 'select public.cobrar_guiada()::text');
    f := f || pg_temp.tut1_fila(110, 'B10 · anon no puede llamar a ninguna de las dos (permiso denegado)',
              t1 = 'ERROR·42501' and t2 = 'ERROR·42501', format('estado → %s · cobro → %s', t1, t2));

    -- ── B11 y B12 · el cliente no toca la tabla ni las internas ──────────
    t1 := pg_temp.tut1_como('authenticated', L, 'select count(*)::text from public.premios_guiada');
    t2 := pg_temp.tut1_como('authenticated', L,
            format('insert into public.premios_guiada (huella, jugador_id, monto, tramo) values (''x'', %L, 2000, ''limpio'') returning ''ok''', L));
    t3 := pg_temp.tut1_como('authenticated', L,
            format('delete from public.premios_guiada where jugador_id = %L returning ''ok''', L));
    f := f || pg_temp.tut1_fila(111, 'B11 · el cliente no lee, no escribe ni borra premios_guiada',
              t1 = 'ERROR·42501' and t2 = 'ERROR·42501' and t3 = 'ERROR·42501',
              format('leer → %s · escribir → %s · borrar → %s', t1, t2, t3));

    t1 := pg_temp.tut1_como('authenticated', L, format('select public.guiada_tramo(%L)', L));
    t2 := pg_temp.tut1_como('authenticated', L, format('select public.guiada_mano_jugada(%L)::text', J));
    t3 := pg_temp.tut1_como('authenticated', L, 'select public.premio_guiada_hc(''limpio'')::text');
    f := f || pg_temp.tut1_fila(112, 'B12 · el cliente no llama a las internas (guiada_tramo, guiada_mano_jugada, premio_guiada_hc)',
              t1 = 'ERROR·42501' and t2 = 'ERROR·42501' and t3 = 'ERROR·42501',
              format('tramo → %s · mano_jugada → %s · hc → %s', t1, t2, t3));

    -- ── B13 · el límite por minuto ───────────────────────────────────────
    -- J ya cobró: cinco reintentos en el mismo minuto dicen «cobrado»; el sexto, «limite».
    delete from public.intentos_dinero where jugador_id = J;
    t1 := '';
    for n in 1..5 loop
      t1 := t1 || (pg_temp.tut1_como('authenticated', J, 'select public.cobrar_guiada()::text')::jsonb ->> 'estado') || ' ';
    end loop;
    t2 := pg_temp.tut1_como('authenticated', J, 'select public.cobrar_guiada()::text');
    select count(*) into n1 from public.intentos_dinero where jugador_id = J and funcion = 'cobrar_guiada';
    select count(*) into n2 from public.movimientos where jugador_id = J and tipo = 'premio_guiada';
    f := f || pg_temp.tut1_fila(113, 'B13 · límite: cinco cobros por minuto contestan, el sexto dice limite; los seis anotados; una sola línea',
              btrim(t1) = 'cobrado cobrado cobrado cobrado cobrado' and t2::jsonb ->> 'estado' = 'limite' and n1 = 6 and n2 = 1,
              format('1–5: %s · 6.º: %s · intentos=%s · líneas=%s', btrim(t1), t2, n1, n2));

    -- ── B14 · la rama del invitado, hoy vacía ────────────────────────────
    -- GEN-1 1c estrena el premio del invitado; hasta entonces el tipo que la consulta busca no
    -- está en el libro y nadie es «invitado».
    select pg_get_constraintdef(oid) into t1 from pg_constraint
     where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk';
    select count(*) into n from public.premios_guiada where tramo = 'invitado';
    f := f || pg_temp.tut1_fila(114, 'B14 · hoy nadie es invitado: premio_invitacion no está en el libro y guiada_premio_invitacion dice no',
              t1 not like '%premio_invitacion%' and not public.guiada_premio_invitacion(L)
              and not public.guiada_premio_invitacion(J) and n = 0,
              format('en el check=%s · L=%s · J=%s · marcas invitado=%s', t1 like '%premio_invitacion%',
                     public.guiada_premio_invitacion(L), public.guiada_premio_invitacion(J), n));

    raise exception 'tut1_deshacer';
  exception when others then
    if sqlerrm <> 'tut1_deshacer' then
      f := f || pg_temp.tut1_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  perform set_config('request.jwt.claims', '', true);
  return query
    select (x2 ->> 'o')::integer, x2 ->> 'c', x2 ->> 'r', x2 ->> 'd'
      from jsonb_array_elements(f) x2;
end
$fn$;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────

select prueba, resultado, detalle
  from (select * from pg_temp.tut1_verificar_a()
        union all
        select * from pg_temp.tut1_verificar_b()) x
 order by orden;

rollback;
