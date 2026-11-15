-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · MES-PvP · sub-tanda 8 — Verificación: los puntos, «Mano actual» y `manos`
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MES-PvP_Sub8_v1.0.md §2.2 (B-3). Informe de la Fase 0, §A.6 y §B.
-- Migración que verifica: supabase/migrations/20261114120000_mespvp_sub8_consulta_pvp_manos.sql.
--
-- CÓMO SE USA: como los demás. `npm run guiones` lo corre contra un Postgres en memoria antes
-- del push; después, sus grupos van comentados al pie de la migración para el SQL Editor.
-- Devuelve UNA tabla `prueba | resultado | detalle`: primero el Grupo A (definiciones y
-- permisos), después el Grupo B (comportamiento). Cada fila debe decir PASA.
--
-- NO DEJA RASTRO, por los dos caminos de siempre: `begin;` … `rollback;`, y una función en
-- `pg_temp` que lo corre todo dentro de un bloque con `exception` y lo deshace lanzando
-- `mespvp8_deshacer`. También el interruptor de los puntos: lo apaga y lo enciende DENTRO.
--
-- LAS CUENTAS. Fabrica cuatro: `mespvp8_a_verif` (anfitrión, asiento 0), `mespvp8_b_verif`
-- (asiento 1), `mespvp8_c_verif` (asiento 2, sale tras la mano 1) y `mespvp8_z_verif`, que no
-- está en la mesa. Una mesa privada de 3 de 100 (Corta, 1.500 cada uno). Las pilas de cada
-- `mano_cerrada` suman las entradas: la mesa cuadra en cada jugada.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.mespvp8_fila(p_o integer, p_c text, p_ok boolean, p_d text)
returns jsonb language sql immutable as $fn$
  select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
$fn$;

-- `consultar_mano` como el cliente: `resultado·precio·gratis_restantes·saldo`, o `ERROR·<sqlstate>`.
create function pg_temp.mespvp8_consultar(p_uid uuid, p_mesa uuid, p_mano integer)
returns text
language plpgsql
as $fn$
declare
  v text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  set local role authenticated;
  select format('%s·%s·%s·%s', r.resultado, r.precio, r.gratis_restantes, r.saldo) into v
    from public.consultar_mano(p_mesa, p_mano) r;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
exception when others then
  return 'ERROR·' || sqlstate;
end
$fn$;

create function pg_temp.mespvp8_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  A constant uuid := 'a8000000-0000-4000-8000-00000000000a';
  B constant uuid := 'a8000000-0000-4000-8000-00000000000b';
  C constant uuid := 'a8000000-0000-4000-8000-00000000000c';
  Z constant uuid := 'a8000000-0000-4000-8000-0000000000ff';
  CIEN constant bigint := 100000;
  VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}},{"asiento":2,"vista":{}}]';
  f    jsonb := '[]';
  s    public.salas;
  r    public.mesa_ia_resultado;
  j    jsonb;
  t1   text;
  t2   text;
  t3   text;
  t4   text;
  n    integer;
  n1   integer;
  sa   bigint;
  sb   bigint;
  lp   record;
  ma   integer[];
begin
  begin
    -- ═══ GRUPO A · definiciones y permisos ═══════════════════════════════
    f := f || pg_temp.mespvp8_fila(1, 'A1 · partida_asientos.manos: smallint, no nula, por defecto 0',
              (select format_type(atttypid, atttypmod) = 'smallint' and attnotnull
                 from pg_attribute where attrelid = 'public.partida_asientos'::regclass and attname = 'manos')
              and (select pg_get_expr(adbin, adrelid) from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
                    where d.adrelid = 'public.partida_asientos'::regclass and a.attname = 'manos') = '0',
              (select format('tipo=%s · no nula=%s', format_type(atttypid, atttypmod), attnotnull)
                 from pg_attribute where attrelid = 'public.partida_asientos'::regclass and attname = 'manos'));

    f := f || pg_temp.mespvp8_fila(2, 'A2 · consultar_mano: una sola firma (uuid, integer), definer, search_path vacío; authenticated sí, anon no',
              (select count(*) from pg_proc where proname = 'consultar_mano' and pronamespace = 'public'::regnamespace) = 1
              and (select prosecdef and 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.consultar_mano(uuid, integer)'::regprocedure)
              and has_function_privilege('authenticated', 'public.consultar_mano(uuid, integer)', 'execute')
              and not has_function_privilege('anon', 'public.consultar_mano(uuid, integer)', 'execute'),
              format('versiones=%s · authenticated=%s · anon=%s',
                     (select count(*) from pg_proc where proname = 'consultar_mano' and pronamespace = 'public'::regnamespace),
                     has_function_privilege('authenticated', 'public.consultar_mano(uuid, integer)', 'execute'),
                     has_function_privilege('anon', 'public.consultar_mano(uuid, integer)', 'execute')));

    f := f || pg_temp.mespvp8_fila(3, 'A3 · aplicar_efectos: una sola versión, suma `manos` y conserva los puntos; fuera del cliente',
              (select count(*) from pg_proc where proname = 'aplicar_efectos' and pronamespace = 'public'::regnamespace) = 1
              and (select prosrc like '%manos = a.manos + 1%' and prosrc like '%anotar_puntos_humanos%' and prosrc like '%recarga_pvp%'
                     from pg_proc where oid = 'public.aplicar_efectos(uuid, jsonb, boolean)'::regprocedure)
              and not has_function_privilege('authenticated', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute')
              and not has_function_privilege('anon', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute'),
              format('versiones=%s · authenticated=%s',
                     (select count(*) from pg_proc where proname = 'aplicar_efectos' and pronamespace = 'public'::regnamespace),
                     has_function_privilege('authenticated', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute')));

    f := f || pg_temp.mespvp8_fila(4, 'A4 · precio_consulta(''humanos'') = 500',
              public.precio_consulta('humanos') = 500, format('humanos=%s', public.precio_consulta('humanos')));

    -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'mespvp8.verif.' || u.n || '@example.invalid', '', now(), now(), '{}', '{}'
      from (values (A, 'a'), (B, 'b'), (C, 'c'), (Z, 'z')) as u(id, n);
    insert into public.profiles (id, username)
    values (A, 'mespvp8_a_verif'), (B, 'mespvp8_b_verif'), (C, 'mespvp8_c_verif'), (Z, 'mespvp8_z_verif');
    perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP 8 · verificación') from unnest(array[A, B, C, Z]) u;
    delete from public.intentos_dinero where jugador_id in (A, B, C, Z);

    -- Una consulta contra las IAS de A (mano 1, gratis): el contador es el de la cuenta (P-1).
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    r := public.sentarse_ia('basico', 2, 50, public.ia_entrada_piso(50), gen_random_uuid());
    perform set_config('request.jwt.claims', '', true);
    t1 := pg_temp.mespvp8_consultar(A, r.mesa_id, 1);

    -- La mesa de 3, por el camino de siempre. Sentarse en PvP cierra la de las IAS (C4).
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    s := public.crear_sala('privada', 3::smallint, 100);
    perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
    perform public.unirse_sala(null, s.id);
    perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
    perform public.unirse_sala(null, s.id);
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    perform public.jugar_ya(s.id);
    perform set_config('request.jwt.claims', '', true);
    j := public.crear_partida(s.id, '{"version":0,"motor":{"handCount":1}}'::jsonb, null,
                              jsonb_build_object(A::text, 0, B::text, 1, C::text, 2), VISTAS);

    -- ── B1 · apagado, la mano ganada no escribe ──────────────────────────
    -- Mano 1: gana A con AJILEI de 51, y C sale con 1.000 al cerrarse.
    t2 := public.interruptor_puntos_humanos(false);
    j := public.guardar_jugada(s.id, 0, '{"version":1,"motor":{"handCount":1}}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":3,"ajilei":51,"pilas":[2500,1000,1000]},{"tipo":"salida","asiento":2,"monto":1000}]'::jsonb);
    select count(*) into n from public.libro_puntos where origen = 'humanos' and mesa_id = s.id;
    f := f || pg_temp.mespvp8_fila(101, 'B1 · interruptor apagado: la mano 1 ganada se guarda y no escribe en el libro',
              j ->> 'ok' = 'true' and t2 in ('apagado', 'sin_cambio') and n = 0,
              format('%s · interruptor=%s · líneas=%s', j ->> 'ok', t2, n));

    -- ── B2 · encendido, una línea con la tabla de humanos ────────────────
    t2 := public.interruptor_puntos_humanos(true);
    j := public.guardar_jugada(s.id, 1, '{"version":2,"motor":{"handCount":2}}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":3,"ajilei":51,"pilas":[3000,500,0]}]'::jsonb);
    select count(*) into n from public.libro_puntos
     where origen = 'humanos' and mesa_id = s.id and mano = 2 and jugador_id = A and nivel is null
       and sentados = 3 and puntos_base = 6 and ajilei = 51 and extra = 1;
    select count(*) into n1 from public.libro_puntos where origen = 'humanos' and mesa_id = s.id;
    f := f || pg_temp.mespvp8_fila(102, 'B2 · encendido: la mano 2 deja una línea humanos, sin nivel, base 6 y extra 1',
              j ->> 'ok' = 'true' and n = 1 and n1 = 1,
              format('%s · interruptor=%s · línea buena=%s · líneas de la mesa=%s', j ->> 'ok', t2, n, n1));

    -- ── B5 · `manos`: dos cierres, y quien salió tras el primero se queda en 1 ──
    select array_agg(a.manos::integer order by a.asiento) into ma from public.partida_asientos a where a.sala_id = s.id;
    f := f || pg_temp.mespvp8_fila(105, 'B5 · manos: tras dos mano_cerrada, 2 · 2 · 1 (el asiento 2 salió tras la primera)',
              ma = array[2, 2, 1]::integer[] and public.mesa_cuadra(s.id),
              format('manos=%s · cuadra=%s', ma, public.mesa_cuadra(s.id)));

    -- ── B3 · la misma mano otra vez no escribe dos veces ─────────────────
    j := public.guardar_jugada(s.id, 2, '{"version":3,"motor":{"handCount":2}}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":3,"ajilei":51,"pilas":[3000,500,0]}]'::jsonb);
    select count(*) into n from public.libro_puntos where origen = 'humanos' and mesa_id = s.id and mano = 2;
    f := f || pg_temp.mespvp8_fila(103, 'B3 · la mano 2 repetida sigue en una línea',
              j ->> 'ok' = 'true' and n = 1, format('%s · líneas de la mano 2=%s', j ->> 'ok', n));

    -- ── B4 · un 52 con 4 sentados no escribe, y la mano se guarda ────────
    j := public.guardar_jugada(s.id, 3, '{"version":4,"motor":{"handCount":3}}'::jsonb, null, VISTAS, false,
           '[{"tipo":"mano_cerrada","mano":3,"ganador":1,"sentados":4,"ajilei":52,"pilas":[2500,1000,0]}]'::jsonb);
    select count(*) into n from public.libro_puntos where origen = 'humanos' and mesa_id = s.id and mano = 3;
    f := f || pg_temp.mespvp8_fila(104, 'B4 · AJILEI de 52 con 4 sentados: sin línea, y la pila de la mano 3 queda guardada',
              j ->> 'ok' = 'true' and n = 0
              and (select pila from public.partida_asientos where sala_id = s.id and asiento = 1) = 1000,
              format('%s · líneas de la mano 3=%s · pila del asiento 1=%s', j ->> 'ok', n,
                     (select pila from public.partida_asientos where sala_id = s.id and asiento = 1)));

    -- ── C1 · el contador de gratis es uno: IA + personas = 2 ─────────────
    t2 := pg_temp.mespvp8_consultar(A, s.id, 3);
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    f := f || pg_temp.mespvp8_fila(201, 'C1 · una consulta contra las IAS y otra en la mesa de personas gastan 2 gratis del mismo contador',
              split_part(t1, '·', 1) = 'gratis' and split_part(t2, '·', 1) = 'gratis' and split_part(t2, '·', 2) = '500'
              and (select gratis_usadas from public.consultas where jugador_id = A) = 2 and n = 0,
              format('IA → %s · personas → %s · gratis_usadas=%s · cobros=%s', split_part(t1, '·', 1), t2,
                     (select gratis_usadas from public.consultas where jugador_id = A), n));

    -- ── C2 · sin gratis, los dos de la misma sala cobran la misma mano ───
    j := public.guardar_jugada(s.id, 4, '{"version":5,"motor":{"handCount":4}}'::jsonb, null, VISTAS, false, '[]'::jsonb);
    insert into public.consultas (jugador_id) values (B) on conflict (jugador_id) do nothing;
    update public.consultas set gratis_usadas = 20 where jugador_id in (A, B);
    sa := public.saldo_de(A);
    sb := public.saldo_de(B);
    t1 := pg_temp.mespvp8_consultar(A, s.id, 4);
    t2 := pg_temp.mespvp8_consultar(B, s.id, 4);
    select count(*) into n from public.movimientos
     where tipo = 'consulta' and monto = -500 and ref_tipo = 'sala' and ref_id = s.id::text
       and clave_idem in ('consulta:' || s.id || ':' || A || ':4', 'consulta:' || s.id || ':' || B || ':4');
    f := f || pg_temp.mespvp8_fila(202, 'C2 · sin gratis, A y B consultan la mano 4: dos cobros de 500, cada uno con su clave',
              split_part(t1, '·', 1) = 'cobrada' and split_part(t2, '·', 1) = 'cobrada' and n = 2
              and public.saldo_de(A) = sa - 500 and public.saldo_de(B) = sb - 500 and public.mesa_cuadra(s.id),
              format('A → %s · B → %s · movimientos=%s · cuadra=%s', t1, t2, n, public.mesa_cuadra(s.id)));

    -- ── C3 · la misma mano otra vez: repetida, sin cobrar ────────────────
    t1 := pg_temp.mespvp8_consultar(A, s.id, 4);
    select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
    f := f || pg_temp.mespvp8_fila(203, 'C3 · A repite la mano 4: repetida y un solo cobro',
              split_part(t1, '·', 1) = 'repetida' and n = 1 and public.saldo_de(A) = sa - 500,
              format('→ %s · cobros de A=%s', t1, n));

    -- ── C4 · una mano que no es la del servidor ──────────────────────────
    t1 := pg_temp.mespvp8_consultar(A, s.id, 5);
    t2 := pg_temp.mespvp8_consultar(B, s.id, 3);
    select count(*) into n from public.movimientos where jugador_id in (A, B) and tipo = 'consulta';
    f := f || pg_temp.mespvp8_fila(204, 'C4 · la mano 5 o la 3 con la 4 en juego: mano_distinta, sin cobro ni cambio de la última',
              split_part(t1, '·', 1) = 'mano_distinta' and split_part(t2, '·', 1) = 'mano_distinta' and n = 2
              and (select ultima_mano from public.consultas where jugador_id = A) = 4,
              format('A mano 5 → %s · B mano 3 → %s · cobros=%s', t1, t2, n));

    -- ── C5 · quien no está sentado: la sala ajena y quien ya salió ───────
    t1 := pg_temp.mespvp8_consultar(Z, s.id, 4);
    t2 := pg_temp.mespvp8_consultar(C, s.id, 4);
    select count(*) into n from public.movimientos where jugador_id in (C, Z) and tipo = 'consulta';
    f := f || pg_temp.mespvp8_fila(205, 'C5 · una sala ajena y el asiento que ya cobró: mesa_invalida, sin cobro',
              split_part(t1, '·', 1) = 'mesa_invalida' and split_part(t2, '·', 1) = 'mesa_invalida' and n = 0,
              format('ajena → %s · salió → %s · cobros=%s', t1, t2, n));

    raise exception 'mespvp8_deshacer';
  exception when others then
    if sqlerrm <> 'mespvp8_deshacer' then
      f := f || pg_temp.mespvp8_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  perform set_config('request.jwt.claims', '', true);
  return query
    select (x ->> 'o')::integer, x ->> 'c', x ->> 'r', x ->> 'd'
      from jsonb_array_elements(f) x;
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.mespvp8_verificar()
 order by orden;

rollback;
