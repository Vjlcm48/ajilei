-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · TIE-1 · Fase 1a — Verificación del inventario y la tienda
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_TIE-1_Fase1a_v1.0.md §2.2.
-- Migración que verifica: supabase/migrations/20261031150000_tie1a_inventario.sql.
--
-- CÓMO SE USA: como los de ECO-1, RNK-1 y CFG-1. Se pega ENTERO en el SQL
-- Editor DESPUÉS del push y se corre UNA vez. Devuelve UNA tabla
-- `prueba | resultado | detalle`: primero el Grupo A (definición y permisos),
-- después el Grupo B (comportamiento, los casos de la ficha en su orden). Cada
-- fila debe decir PASA. No enseña correos ni uuids de cuentas reales. Antes del
-- push lo corre `npm run guiones` contra un Postgres en memoria.
--
-- NO DEJA RASTRO, por los mismos dos caminos de siempre: `begin;` … `rollback;`,
-- y una función en `pg_temp` que lo corre todo dentro de un bloque con
-- `exception` y lo deshace lanzando `tie1a_deshacer`.
--
-- COMO EL CLIENTE. Lo que hace el teléfono (comprar, usar, elegir tono, leer el
-- inventario, tocar la tabla) se corre con `set local role authenticated` y la
-- sesión en `request.jwt.claims`, por `pg_temp.tie1a_como`,
-- `pg_temp.tie1a_llamar` y `pg_temp.tie1a_inv`.
--
-- LAS CUENTAS. Fabrica tres: `tiea_a_verif` (la que compra, con 30.000 HC:
-- alcanza para el grafito y el azul y no para el tricolor después),
-- `tiea_b_verif` (la ajena, para la RLS) y `tiea_l_verif` (la del límite).
-- La de A se borra a mitad (B15, la cascada); todas se deshacen.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Corre `p_sql` como el cliente con la sesión de `p_uid`. Devuelve
-- `PASA·<filas>` o `<sqlstate>·<mensaje>`.
create function pg_temp.tie1a_como(p_uid uuid, p_sql text)
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

-- Llama una función del cliente (`p_sql` = un `select` de un valor) como el
-- cliente: el valor devuelto, o `ERROR·<sqlstate>`. Con `p_uid` nulo, rol
-- `authenticated` sin sesión.
create function pg_temp.tie1a_llamar(p_uid uuid, p_sql text)
returns text
language plpgsql
as $fn$
declare
  v text;
begin
  perform set_config('request.jwt.claims',
                     case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
  set local role authenticated;
  execute p_sql into v;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return coalesce(v, 'null');
exception when others then
  return 'ERROR·' || sqlstate;
end
$fn$;

-- `mi_inventario(p_tipo)` como el cliente: `articulo:tono:uso` por fila, en
-- orden de artículo, separadas por comas (`-` = sin tono; uso 1/0). Vacío si
-- no tiene nada.
create function pg_temp.tie1a_inv(p_uid uuid, p_tipo text)
returns text
language plpgsql
as $fn$
begin
  return pg_temp.tie1a_llamar(p_uid, format(
    'select coalesce(string_agg(format(''%%s:%%s:%%s'', i.articulo, coalesce(i.tono, ''-''), '
    || 'case when i.en_uso then 1 else 0 end), '','' order by i.articulo), '''') '
    || 'from public.mi_inventario(%L::text) i', p_tipo));
end
$fn$;

create function pg_temp.tie1a_verificar()
returns table (orden numeric, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  A  constant uuid := 'f1e1a000-0000-4000-8000-00000000000a';
  B  constant uuid := 'f1e1a000-0000-4000-8000-00000000000b';
  L  constant uuid := 'f1e1a000-0000-4000-8000-00000000000c';
  TIPOS constant text[] := array['bono_bienvenida', 'constancia', 'video', 'entrada_ia', 'recarga_ia',
                                 'salida_ia', 'abandono_ia', 'compra', 'ajuste_admin', 'garantia_pvp',
                                 'liberacion_pvp', 'resultado_pvp', 'consulta'];

  v_o numeric[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  t1 text; t2 text; t3 text; t4 text; t5 text; t6 text;
  s0 bigint; s1 bigint;
  n  bigint; n1 bigint; n2 bigint; n3 bigint;
  i  integer;
  ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean;
begin
  begin
    -- ═══ GRUPO A · definición y permisos ═════════════════════════════════

    -- ── A1 · la tabla inventario ─────────────────────────────────────────
    select count(*) into n1
      from information_schema.columns
     where table_schema = 'public' and table_name = 'inventario'
       and (column_name, data_type, is_nullable) in (
             ('jugador_id', 'uuid', 'NO'), ('tipo', 'text', 'NO'), ('articulo', 'text', 'NO'),
             ('tono', 'text', 'YES'), ('en_uso', 'boolean', 'NO'),
             ('adquirido_en', 'timestamp with time zone', 'NO'));
    select count(*) into n2 from information_schema.columns
     where table_schema = 'public' and table_name = 'inventario';
    select pg_get_constraintdef(oid) into t1 from pg_constraint
     where conrelid = 'public.inventario'::regclass and contype = 'p';
    select count(*) into n from pg_constraint
     where conrelid = 'public.inventario'::regclass and contype = 'f' and confdeltype = 'c'
       and confrelid = 'auth.users'::regclass;
    select count(*) into n3 from pg_constraint
     where conrelid = 'public.inventario'::regclass and contype = 'c' and conname = 'inventario_tono_chk';
    select pg_get_indexdef(i.indexrelid) into t2 from pg_index i
     where i.indrelid = 'public.inventario'::regclass and i.indisunique and i.indpred is not null;
    select c.relrowsecurity into ok1 from pg_class c where c.oid = 'public.inventario'::regclass;
    select count(*) into s0 from pg_policies where schemaname = 'public' and tablename = 'inventario';
    select count(*) into s1 from pg_policies where schemaname = 'public' and tablename = 'inventario'
       and cmd = 'SELECT' and roles = '{authenticated}';
    v_o := v_o || 1; v_p := v_p || 'A1 · inventario: seis columnas, PK (jugador, tipo, artículo), FK en cascada a auth.users, CHECK del tono, único parcial «uno en uso», RLS con una política de lectura'::text;
    v_r := v_r || case when n1 = 6 and n2 = 6 and t1 = 'PRIMARY KEY (jugador_id, tipo, articulo)' and n = 1 and n3 = 1
                        and t2 like '%(jugador_id, tipo) WHERE en_uso' and ok1 and s0 = 1 and s1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('columnas con su forma=%s de 6 (hay %s) · %s · FK cascada=%s · CHECK tono=%s · índice=%s · RLS=%s · políticas=%s (lectura de authenticated=%s)',
                         n1, n2, coalesce(t1, 'sin PK'), n, n3, coalesce(substring(t2 from '\(.*$'), 'ninguno'), ok1, s0, s1);

    -- ── A2 · 'compra' en el libro, la lista intacta ──────────────────────
    select pg_get_constraintdef(oid) into t1 from pg_constraint
     where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk';
    select count(*) into n1 from unnest(TIPOS) as x(tipo) where t1 like '%''' || x.tipo || '''%';
    select count(*) into n2 from regexp_matches(coalesce(t1, ''), '''[a-z_]+''', 'g');
    v_o := v_o || 2; v_p := v_p || 'A2 · movimientos_tipo_chk: los 13 tipos de siempre (compra incluido), ninguno más'::text;
    v_r := v_r || case when n1 = 13 and n2 = 13 and t1 like '%''compra''%' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('de la lista=%s de 13 · literales en la restricción=%s', n1, n2);

    -- ── A3 · el catálogo ─────────────────────────────────────────────────
    t1 := concat_ws('/', public.precio_articulo('tapete', 'grafito'), public.precio_articulo('tapete', 'azul'),
                         public.precio_articulo('tapete', 'vinotinto'), public.precio_articulo('tapete', 'tricolor'));
    ok1 := public.precio_articulo('tapete', 'verde') is null and public.precio_articulo('tapete', 'dorado') is null
       and public.precio_articulo('reverso', 'grafito') is null and public.precio_articulo(null, null) is null;
    t2 := concat_ws('/', public.articulo_con_tonos('tapete', 'grafito'), public.articulo_con_tonos('tapete', 'azul'),
                         public.articulo_con_tonos('tapete', 'vinotinto'), public.articulo_con_tonos('tapete', 'tricolor'),
                         public.articulo_con_tonos('tapete', 'verde'), public.articulo_con_tonos(null, null));
    t3 := concat_ws('/', public.articulo_gratis('tapete', 'verde'), public.articulo_gratis('tapete', 'grafito'),
                         public.articulo_gratis('reverso', 'verde'), public.articulo_gratis(null, null));
    t4 := concat_ws('/', public.inventario_tipo_valido('tapete'), public.inventario_tipo_valido('reverso'),
                         public.inventario_tipo_valido(null));
    select count(*) into n from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public'
       and f.proname in ('precio_articulo', 'articulo_con_tonos', 'articulo_gratis', 'inventario_tipo_valido')
       and f.provolatile = 'i' and not f.prosecdef and f.proconfig @> array['search_path=""'];
    v_o := v_o || 3; v_p := v_p || 'A3 · catálogo: precios 10000/15000/25000/50000, el resto sin precio; tonos sólo grafito/azul/vinotinto; verde gratis; tipo sólo tapete; inmutables'::text;
    v_r := v_r || case when t1 = '10000/15000/25000/50000' and ok1 and t2 = 't/t/t/f/f/f'
                        and t3 = 't/f/f/f' and t4 = 't/f/f' and n = 4
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('precios=%s · sin precio (verde, dorado, reverso, nulo)=%s · tonos=%s · gratis=%s · tipo=%s · inmutables con search_path=%s de 4',
                         t1, ok1, t2, t3, t4, n);

    -- ── A4 · las cuatro del cliente: forma y seguridad ───────────────────
    select count(*) into n from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proconfig @> array['search_path=""']
       and ((f.proname = 'comprar_articulo' and pg_get_function_identity_arguments(f.oid) = 'p_tipo text, p_articulo text, p_tono text'
             and f.prorettype = 'text'::regtype and f.prosecdef and f.provolatile = 'v')
         or (f.proname = 'usar_articulo' and pg_get_function_identity_arguments(f.oid) = 'p_tipo text, p_articulo text'
             and f.prorettype = 'text'::regtype and f.prosecdef and f.provolatile = 'v')
         or (f.proname = 'elegir_tono' and pg_get_function_identity_arguments(f.oid) = 'p_tipo text, p_articulo text, p_tono text'
             and f.prorettype = 'text'::regtype and f.prosecdef and f.provolatile = 'v')
         or (f.proname = 'mi_inventario' and pg_get_function_identity_arguments(f.oid) = 'p_tipo text'
             and f.prorettype = 'public.inventario'::regtype and f.proretset and not f.prosecdef));
    select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname in ('comprar_articulo', 'usar_articulo', 'elegir_tono', 'mi_inventario');
    select count(*) into n2 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname in ('comprar_articulo', 'mi_inventario') and f.pronargdefaults = 1;
    v_o := v_o || 4; v_p := v_p || 'A4 · comprar/usar/elegir_tono (definer, text) y mi_inventario (invoker, setof inventario): una firma cada una, search_path vacío'::text;
    v_r := v_r || case when n = 4 and n1 = 4 and n2 = 2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('con su forma=%s de 4 · firmas=%s · con su argumento por defecto=%s de 2', n, n1, n2);

    -- ── A5 · quién ejecuta qué ───────────────────────────────────────────
    ok1 := has_function_privilege('authenticated', 'public.comprar_articulo(text, text, text)', 'execute')
       and has_function_privilege('authenticated', 'public.usar_articulo(text, text)', 'execute')
       and has_function_privilege('authenticated', 'public.elegir_tono(text, text, text)', 'execute')
       and has_function_privilege('authenticated', 'public.mi_inventario(text)', 'execute');
    ok2 := has_function_privilege('anon', 'public.comprar_articulo(text, text, text)', 'execute')
        or has_function_privilege('anon', 'public.usar_articulo(text, text)', 'execute')
        or has_function_privilege('anon', 'public.elegir_tono(text, text, text)', 'execute')
        or has_function_privilege('anon', 'public.mi_inventario(text)', 'execute');
    ok3 := has_function_privilege('authenticated', 'public.precio_articulo(text, text)', 'execute')
        or has_function_privilege('authenticated', 'public.articulo_con_tonos(text, text)', 'execute')
        or has_function_privilege('authenticated', 'public.articulo_gratis(text, text)', 'execute')
        or has_function_privilege('authenticated', 'public.inventario_tipo_valido(text)', 'execute')
        or has_function_privilege('anon', 'public.precio_articulo(text, text)', 'execute');
    select count(*) into n from pg_proc f, aclexplode(f.proacl) a
     where f.oid in ('public.comprar_articulo(text, text, text)'::regprocedure, 'public.usar_articulo(text, text)'::regprocedure,
                     'public.elegir_tono(text, text, text)'::regprocedure, 'public.mi_inventario(text)'::regprocedure,
                     'public.precio_articulo(text, text)'::regprocedure, 'public.articulo_con_tonos(text, text)'::regprocedure,
                     'public.articulo_gratis(text, text)'::regprocedure, 'public.inventario_tipo_valido(text)'::regprocedure)
       and a.grantee = 0 and a.privilege_type = 'EXECUTE';
    ok4 := has_table_privilege('authenticated', 'public.inventario', 'select')
       and not has_table_privilege('authenticated', 'public.inventario', 'insert')
       and not has_table_privilege('authenticated', 'public.inventario', 'update')
       and not has_table_privilege('authenticated', 'public.inventario', 'delete')
       and not has_table_privilege('anon', 'public.inventario', 'select');
    v_o := v_o || 5; v_p := v_p || 'A5 · las cuatro del cliente, sólo authenticated; el catálogo, nadie; public, ninguna; la tabla, sólo lectura para authenticated'::text;
    v_r := v_r || case when ok1 and not ok2 and not ok3 and n = 0 and ok4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('authenticated en las 4=%s · anon en alguna=%s · catálogo al cliente=%s · public=%s · tabla sólo lectura=%s',
                         ok1, ok2, ok3, n, ok4);

    -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'tie1a.verif.' || u.n || '@example.invalid', '', now(), now(), '{}', '{}'
      from (values (A, 'a'), (B, 'b'), (L, 'l')) as u(id, n);
    insert into public.profiles (id, username)
    values (A, 'tiea_a_verif'), (B, 'tiea_b_verif'), (L, 'tiea_l_verif');
    -- Saldos exactos aunque la base real no diera el bono a estas huellas.
    if public.ia_saldo_actual(A) <> 30000 then
      perform public.ajuste_admin(A, 30000 - public.ia_saldo_actual(A), 'TIE-1 1a · verificación');
    end if;
    if public.ia_saldo_actual(B) <> 15000 then
      perform public.ajuste_admin(B, 15000 - public.ia_saldo_actual(B), 'TIE-1 1a · verificación');
    end if;

    -- ── B1 · cuenta nueva: nada ──────────────────────────────────────────
    t1 := pg_temp.tie1a_inv(A, 'tapete');
    t2 := pg_temp.tie1a_inv(A, null);
    select count(*) into n from public.inventario where jugador_id = A;
    v_o := v_o || 101; v_p := v_p || 'B1 · cuenta nueva: mi_inventario(''tapete'') y mi_inventario() vacíos, sin filas'::text;
    v_r := v_r || case when t1 = '' and t2 = '' and n = 0 and public.ia_saldo_actual(A) = 30000 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('tapete=«%s» · todo=«%s» · filas=%s · saldo=%s', t1, t2, n, public.ia_saldo_actual(A));

    -- ── B2 · comprar el grafito claro ────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''grafito'', ''claro'')');
    s1 := public.ia_saldo_actual(A);
    select count(*) into n from public.movimientos
     where jugador_id = A and tipo = 'compra' and monto = -10000 and saldo_tras = 20000
       and clave_idem = 'compra:' || A::text || ':tapete:grafito'
       and ref_tipo = 'inventario' and ref_id = 'tapete:grafito';
    t2 := pg_temp.tie1a_inv(A, 'tapete');
    v_o := v_o || 102; v_p := v_p || 'B2 · comprar grafito claro: ok, saldo 30.000 → 20.000, un movimiento compra con su clave, la fila en claro y en uso'::text;
    v_r := v_r || case when t1 = 'ok' and s1 = 20000 and n = 1 and t2 = 'grafito:claro:1' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · saldo=%s · movimiento con la forma (clave compra:<jugador>:tapete:grafito)=%s · inventario=%s',
                         t1, s1, n, t2);

    -- ── B3 · la misma compra otra vez ────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''grafito'', ''claro'')');
    t2 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''grafito'', ''oscuro'')');
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'compra';
    t3 := pg_temp.tie1a_inv(A, 'tapete');
    v_o := v_o || 103; v_p := v_p || 'B3 · repetir la compra (mismo tono u otro): ya_comprado, sin cobro, la fila intacta'::text;
    v_r := v_r || case when t1 = 'ya_comprado' and t2 = 'ya_comprado' and public.ia_saldo_actual(A) = 20000 and n = 1
                        and t3 = 'grafito:claro:1' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s, %s · saldo=%s · compras en el libro=%s · inventario=%s',
                         t1, t2, public.ia_saldo_actual(A), n, t3);

    -- ── B3b · el doble cerrojo se repara solo (rector, STOP-A1 A-1) ──────
    -- Pagado en el libro y sin fila: la compra devuelve la fila sin cobrar.
    delete from public.inventario where jugador_id = A and tipo = 'tapete' and articulo = 'grafito';
    select count(*) into n1 from public.inventario where jugador_id = A;
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''grafito'', ''claro'')');
    t2 := pg_temp.tie1a_inv(A, 'tapete');
    select count(*) into n from public.movimientos
     where jugador_id = A and clave_idem = 'compra:' || A::text || ':tapete:grafito';
    v_o := v_o || 103.5; v_p := v_p || 'B3b · pagado y sin fila (borrada a mano): comprar otra vez → ok, sin cobro, la fila vuelve en uso, una sola línea con esa clave'::text;
    v_r := v_r || case when n1 = 0 and t1 = 'ok' and public.ia_saldo_actual(A) = 20000 and t2 = 'grafito:claro:1' and n = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas tras borrar=%s · → %s · saldo=%s · inventario=%s · líneas con la clave=%s',
                         n1, t1, public.ia_saldo_actual(A), t2, n);

    -- ── B4 · sin saldo ───────────────────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''tricolor'')');
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'compra';
    select count(*) into n1 from public.inventario where jugador_id = A and articulo = 'tricolor';
    v_o := v_o || 104; v_p := v_p || 'B4 · tricolor (50.000) con 20.000: sin_saldo, saldo intacto, sin fila'::text;
    v_r := v_r || case when t1 = 'sin_saldo' and public.ia_saldo_actual(A) = 20000 and n = 1 and n1 = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · saldo=%s · compras en el libro=%s · fila tricolor=%s', t1, public.ia_saldo_actual(A), n, n1);

    -- ── B5 · tono a un artículo sin tonos ────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''tricolor'', ''claro'')');
    t2 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''tricolor'', ''rosa'')');
    select count(*) into n from public.inventario where jugador_id = A;
    v_o := v_o || 105; v_p := v_p || 'B5 · tricolor con tono: sin_tono (también con un tono inventado), nada escrito'::text;
    v_r := v_r || case when t1 = 'sin_tono' and t2 = 'sin_tono' and n = 1 and public.ia_saldo_actual(A) = 20000
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('claro → %s · rosa → %s · filas=%s · saldo=%s', t1, t2, n, public.ia_saldo_actual(A));

    -- ── B6 · un tono que no existe ───────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''azul'', ''rosa'')');
    t2 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''azul'', '''')');
    select count(*) into n from public.inventario where jugador_id = A;
    v_o := v_o || 106; v_p := v_p || 'B6 · azul en «rosa» o en tono vacío: tono_invalido, nada escrito'::text;
    v_r := v_r || case when t1 = 'tono_invalido' and t2 = 'tono_invalido' and n = 1 and public.ia_saldo_actual(A) = 20000
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('rosa → %s · vacío → %s · filas=%s · saldo=%s', t1, t2, n, public.ia_saldo_actual(A));

    -- ── B7 · lo que no está a la venta ───────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''dorado'')');
    t2 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''verde'')');
    t3 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''reverso'', ''negro'')');
    t4 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(null, null)');
    select count(*) into n from public.inventario where jugador_id = A;
    v_o := v_o || 107; v_p := v_p || 'B7 · dorado y verde (gratis) → no_existe; reverso → tipo_invalido; nulos → tipo_invalido; nada escrito'::text;
    v_r := v_r || case when t1 = 'no_existe' and t2 = 'no_existe' and t3 = 'tipo_invalido' and t4 = 'tipo_invalido'
                        and n = 1 and public.ia_saldo_actual(A) = 20000 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('dorado → %s · verde → %s · reverso → %s · nulos → %s · filas=%s', t1, t2, t3, t4, n);

    -- ── B8 · el azul sin tono: actual, y pasa a estar en uso ─────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.comprar_articulo(''tapete'', ''azul'')');
    t2 := pg_temp.tie1a_inv(A, 'tapete');
    select count(*) into n from public.inventario where jugador_id = A and tipo = 'tapete' and en_uso;
    v_o := v_o || 108; v_p := v_p || 'B8 · comprar azul sin tono: ok en actual, el azul en uso y el grafito no (uno en uso), saldo 5.000'::text;
    v_r := v_r || case when t1 = 'ok' and t2 = 'azul:actual:1,grafito:claro:0' and n = 1
                        and public.ia_saldo_actual(A) = 5000 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · inventario=%s · en uso=%s · saldo=%s', t1, t2, n, public.ia_saldo_actual(A));

    -- ── B9 · usar el grafito ─────────────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''grafito'')');
    t2 := pg_temp.tie1a_inv(A, 'tapete');
    t3 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''grafito'')');
    t4 := pg_temp.tie1a_inv(A, 'tapete');
    v_o := v_o || 109; v_p := v_p || 'B9 · usar grafito: ok, grafito en uso y azul no; otra vez, ok y nada cambia'::text;
    v_r := v_r || case when t1 = 'ok' and t2 = 'azul:actual:0,grafito:claro:1' and t3 = 'ok' and t4 = t2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · inventario=%s · otra vez → %s · %s', t1, t2, t3, t4);

    -- ── B10 · usar el verde ──────────────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''verde'')');
    t2 := pg_temp.tie1a_inv(A, 'tapete');
    select count(*) into n from public.inventario where jugador_id = A and en_uso;
    select count(*) into n1 from public.inventario where jugador_id = A;
    t3 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''verde'')');
    v_o := v_o || 110; v_p := v_p || 'B10 · usar verde: ok, ninguna fila en uso, las compradas siguen; otra vez, ok'::text;
    v_r := v_r || case when t1 = 'ok' and t2 = 'azul:actual:0,grafito:claro:0' and n = 0 and n1 = 2 and t3 = 'ok'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · inventario=%s · en uso=%s · filas=%s · otra vez → %s', t1, t2, n, n1, t3);

    -- ── B11 · usar lo que no se compró ───────────────────────────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''vinotinto'')');
    t2 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''dorado'')');
    t3 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''reverso'', ''negro'')');
    t4 := pg_temp.tie1a_inv(A, 'tapete');
    v_o := v_o || 111; v_p := v_p || 'B11 · usar vinotinto (no comprado) → no_comprado; dorado → no_existe; reverso → tipo_invalido; nada cambia'::text;
    v_r := v_r || case when t1 = 'no_comprado' and t2 = 'no_existe' and t3 = 'tipo_invalido'
                        and t4 = 'azul:actual:0,grafito:claro:0' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('vinotinto → %s · dorado → %s · reverso → %s · inventario=%s', t1, t2, t3, t4);

    -- ── B12 · elegir tono ────────────────────────────────────────────────
    select count(*) into n2 from public.movimientos where jugador_id = A;
    t1 := pg_temp.tie1a_llamar(A, 'select public.elegir_tono(''tapete'', ''grafito'', ''oscuro'')');
    t2 := pg_temp.tie1a_llamar(A, 'select public.elegir_tono(''tapete'', ''vinotinto'', ''oscuro'')');
    t3 := pg_temp.tie1a_llamar(A, 'select public.elegir_tono(''tapete'', ''tricolor'', ''claro'')')
       || '/' || pg_temp.tie1a_llamar(A, 'select public.elegir_tono(''tapete'', ''verde'', ''claro'')');
    t4 := pg_temp.tie1a_llamar(A, 'select public.elegir_tono(''tapete'', ''grafito'', ''rosa'')')
       || '/' || pg_temp.tie1a_llamar(A, 'select public.elegir_tono(''tapete'', ''grafito'', null)');
    t5 := pg_temp.tie1a_inv(A, 'tapete');
    select count(*) into n from public.movimientos where jugador_id = A;
    v_o := v_o || 112; v_p := v_p || 'B12 · elegir_tono: grafito oscuro → ok (cambia la fila); vinotinto → no_comprado; tricolor y verde → sin_tono; rosa o nulo → tono_invalido; gratis'::text;
    v_r := v_r || case when t1 = 'ok' and t2 = 'no_comprado' and t3 = 'sin_tono/sin_tono'
                        and t4 = 'tono_invalido/tono_invalido' and t5 = 'azul:actual:0,grafito:oscuro:0'
                        and n = n2 and public.ia_saldo_actual(A) = 5000 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('grafito → %s · vinotinto → %s · sin tonos → %s · inválidos → %s · inventario=%s · movimientos nuevos=%s',
                         t1, t2, t3, t4, t5, n - n2);

    -- ── B13 · la RLS: B no ve lo de A ni escribe ─────────────────────────
    t6 := pg_temp.tie1a_llamar(B, 'select public.comprar_articulo(''tapete'', ''grafito'')');
    t1 := pg_temp.tie1a_como(B, format('select * from public.inventario where jugador_id = %L', A));
    t2 := pg_temp.tie1a_como(B, 'select * from public.inventario');
    t3 := split_part(pg_temp.tie1a_como(B, format(
            'insert into public.inventario (jugador_id, tipo, articulo, tono, en_uso) values (%L, ''tapete'', ''vinotinto'', ''actual'', false)', B)), '·', 1);
    t4 := split_part(pg_temp.tie1a_como(B, 'update public.inventario set tono = ''claro'''), '·', 1)
       || '/' || split_part(pg_temp.tie1a_como(B, 'delete from public.inventario'), '·', 1);
    t5 := pg_temp.tie1a_inv(B, 'tapete');
    select count(*) into n from public.inventario where jugador_id = A;
    v_o := v_o || 113; v_p := v_p || 'B13 · RLS: B (con su grafito) no ve las filas de A, sólo la suya; insert, update y delete directos → 42501'::text;
    v_r := v_r || case when t6 = 'ok' and t1 = 'PASA·0' and t2 = 'PASA·1' and t3 = '42501' and t4 = '42501/42501'
                        and t5 = 'grafito:actual:1' and n = 2 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('B compra → %s · filas de A vistas por B=%s · todas las que ve B=%s · insert=%s · update/delete=%s · mi_inventario de B=%s · filas de A intactas=%s',
                         t6, split_part(t1, '·', 2), split_part(t2, '·', 2), t3, t4, t5, n);

    -- ── B14 · el índice parcial: una segunda en uso no entra ─────────────
    t1 := pg_temp.tie1a_llamar(A, 'select public.usar_articulo(''tapete'', ''grafito'')');
    begin
      insert into public.inventario (jugador_id, tipo, articulo, tono, en_uso)
      values (A, 'tapete', 'vinotinto', 'actual', true);
      t2 := 'entró'; t3 := '';
    exception when others then
      t2 := sqlstate;
      get stacked diagnostics t3 = constraint_name;
    end;
    select count(*) into n from public.inventario where jugador_id = A and en_uso;
    v_o := v_o || 114; v_p := v_p || 'B14 · como superusuario, una segunda fila en uso del mismo tipo → 23505 por inventario_uno_en_uso_idx'::text;
    v_r := v_r || case when t1 = 'ok' and t2 = '23505' and t3 = 'inventario_uno_en_uso_idx' and n = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('usar grafito → %s · insert → %s (%s) · en uso=%s', t1, t2, t3, n);

    -- ── B15 · borrar la cuenta se lleva el inventario ────────────────────
    select count(*) into n1 from public.inventario where jugador_id = A;
    delete from auth.users where id = A;
    select count(*) into n from public.inventario where jugador_id = A;
    select count(*) into n2 from public.inventario where jugador_id = B;
    v_o := v_o || 115; v_p := v_p || 'B15 · delete from auth.users de A: su inventario a cero en cascada; el de B intacto'::text;
    v_r := v_r || case when n1 = 2 and n = 0 and n2 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas de A antes=%s · después=%s · filas de B=%s', n1, n, n2);

    -- ── B16 · el límite: 30 por minuto ───────────────────────────────────
    ok1 := true;
    for i in 1..30 loop
      ok1 := ok1 and pg_temp.tie1a_llamar(L, 'select public.comprar_articulo(''tapete'', ''dorado'')') = 'no_existe';
    end loop;
    t1 := pg_temp.tie1a_llamar(L, 'select public.comprar_articulo(''tapete'', ''dorado'')');
    t2 := pg_temp.tie1a_llamar(L, 'select public.comprar_articulo(''tapete'', ''grafito'')');
    select count(*) into n from public.intentos_dinero
     where jugador_id = L and funcion = 'comprar_articulo' and en > now() - interval '1 minute';
    select count(*) into n1 from public.inventario where jugador_id = L;
    select count(*) into n2 from public.movimientos where jugador_id = L and tipo = 'compra';
    v_o := v_o || 116; v_p := v_p || 'B16 · treinta compras de un inexistente en un minuto: no_existe; la 31.ª y la 32.ª (aunque exista), limite, sin cobrar'::text;
    v_r := v_r || case when ok1 and t1 = 'limite' and t2 = 'limite' and n = 32 and n1 = 0 and n2 = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('30 no_existe=%s · 31.ª → %s · 32.ª → %s · anotadas=%s · filas=%s · compras=%s', ok1, t1, t2, n, n1, n2);

    -- ── B17 · sin sesión ─────────────────────────────────────────────────
    t1 := pg_temp.tie1a_llamar(null, 'select public.comprar_articulo(''tapete'', ''grafito'')');
    t2 := pg_temp.tie1a_llamar(null, 'select public.usar_articulo(''tapete'', ''verde'')');
    t3 := pg_temp.tie1a_llamar(null, 'select public.elegir_tono(''tapete'', ''grafito'', ''claro'')');
    t4 := pg_temp.tie1a_inv(null, 'tapete');
    v_o := v_o || 117; v_p := v_p || 'B17 · sin sesión: las tres que escriben → sin_sesion; mi_inventario vacío'::text;
    v_r := v_r || case when t1 = 'sin_sesion' and t2 = 'sin_sesion' and t3 = 'sin_sesion' and t4 = ''
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('comprar → %s · usar → %s · elegir_tono → %s · mi_inventario=«%s»', t1, t2, t3, t4);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'tie1a_deshacer';
  exception when others then
    if sqlerrm <> 'tie1a_deshacer' then
      v_o := v_o || 999; v_p := v_p || 'X · el guion se detuvo'::text;
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.tie1a_verificar()
 order by orden;

rollback;
