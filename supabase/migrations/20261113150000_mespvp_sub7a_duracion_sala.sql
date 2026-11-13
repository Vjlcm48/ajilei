-- ═══════════════════════════════════════════════════════════════════════════
-- MES-PvP · sub-tanda 7a · cuánto vive una sala: 5:00 la privada y 3:00 la abierta
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MES-PvP_Sub7a_v1.0.md §1.2 (B.1). Diseño: el informe de la Fase 0 de la
-- sub-tanda 7, §B.1. Decisión de Victor: la privada vive 5 minutos (hay que pasar el código) y la
-- abierta, 3. La mesa llena no cambia: sigue acortándose a 10 s (`unirse_sala`, SAL-B2).
--
--   1 · `duracion_sala(tipo)`, la cifra en UN sitio. Solo la llaman funciones de la base: sin
--       permiso para `anon` ni para `authenticated` (los privilegios por defecto de Supabase se lo
--       dan a los dos en toda función nueva; el `revoke` es lo que cuenta).
--   2 · `crear_sala` escribe `expira_en = now() + duracion_sala(p_tipo)`. Cuerpo de `mot1_dinero`
--       (`20261104170000_mot1_dinero.sql:591-668`) sin más cambio que ése.
--   3 · `levantarse_de_sala` (lo que hace `salir_sala`) devuelve el reloj de una mesa llena a
--       `creada_en + duracion_sala(tipo)`. Cuerpo de `mot1_dinero:500-538`, con ese cambio.
--
-- El defecto de la columna (`now() + interval '3 minutes'`, SAL-A:97) se queda de respaldo. El
-- espejo del cliente es `duracionSala` (`src/config/salas.js`), y `salas.test.js` lo compara con
-- esta función leyendo este archivo.
--
-- Compatible con el cliente de antes: el cronómetro de la sala cuenta desde `expira_en`, sea cual
-- sea. Sin deploy de la función `partida`. `create or replace` conserva los permisos.

-- ── 1 · La cifra ───────────────────────────────────────────────────────────
create or replace function public.duracion_sala(p_tipo public.sala_tipo)
returns interval
language sql
immutable
set search_path = ''
as $fn$
  select case p_tipo
           when 'privada' then interval '5 minutes'
           when 'abierta' then interval '3 minutes'
         end
$fn$;

comment on function public.duracion_sala(public.sala_tipo) is
  'MES-PvP 7a · cuánto vive una sala en espera: 5 min la privada, 3 la abierta. Espejo: duracionSala (src/config/salas.js).';

revoke execute on function public.duracion_sala(public.sala_tipo) from public, anon, authenticated;


-- ── 2 · crear_sala ─────────────────────────────────────────────────────────
create or replace function public.crear_sala(
  p_tipo      public.sala_tipo,
  p_jugadores smallint,
  p_apuesta   integer,
  p_entrada   text default 'corta',
  p_ritmo     text default 'normal'
)
returns public.salas
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  ALFABETO constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_uid       uuid := auth.uid();
  v_sala      public.salas;
  v_existente uuid;
  v_codigo    text;
  v_intento   integer := 0;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = 'P0001';
  end if;

  perform public.barrer_salas();

  -- A1 §2.3 · el MISMO predicado que `mi_sala` y `unirse_sala`.
  if public.sala_esperando_de(v_uid) is not null then
    raise exception 'ya_en_sala' using errcode = 'P0001';
  end if;

  if not public.alcanza_entrada(v_uid, public.entrada_de(p_apuesta, p_entrada)) then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  end if;

  if p_tipo = 'abierta' then
    -- MOT-1 · la entrada es identidad; el ritmo no: quien se une juega al de la mesa.
    select s.id into v_existente
      from public.salas s
     where s.tipo = 'abierta' and s.estado = 'esperando'
       and s.jugadores = p_jugadores and s.apuesta = p_apuesta
       and s.entrada = p_entrada
     limit 1;
    if v_existente is not null then
      return public.unirse_sala(null, v_existente);
    end if;
  end if;

  if p_tipo = 'privada' then
    loop
      v_intento := v_intento + 1;
      select 'AJ-' || string_agg(substr(ALFABETO, (floor(random() * 32) + 1)::int, 1), '')
        into v_codigo
        from generate_series(1, 4);
      begin
        insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, entrada, ritmo, expira_en)
        values (v_codigo, p_tipo, p_jugadores, p_apuesta, v_uid, p_entrada, p_ritmo, now() + public.duracion_sala(p_tipo))
        returning * into v_sala;
        exit;
      exception when unique_violation then
        if v_intento >= 10 then raise;
        end if;
      end;
    end loop;
  else
    insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, entrada, ritmo, expira_en)
    values (null, p_tipo, p_jugadores, p_apuesta, v_uid, p_entrada, p_ritmo, now() + public.duracion_sala(p_tipo))
    returning * into v_sala;
  end if;

  perform public.cobrar_entrada(v_sala.id, v_uid, 'crear_sala', public.entrada_de(p_apuesta, p_entrada));

  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, 0);

  return v_sala;
end
$fn$;


-- ── 3 · levantarse_de_sala (el cuerpo de `salir_sala`) ─────────────────────
-- Con partida no se levanta nadie: esa silla es el acceso al canal, y se sale de la partida con
-- la acción `abandonar`. Un invitado que deja una `activa` sin partida sí recupera lo suyo; el
-- anfitrión de esa mesa espera al barrido, como hasta hoy.
create or replace function public.levantarse_de_sala(p_sala uuid, p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_sala  public.salas;
  v_llena boolean;   -- SAL-B2
begin
  select * into v_sala from public.salas where id = p_sala for update;
  if not found then
    return;   -- salir de una sala que ya no existe no es un error: ya estás fuera
  end if;

  if exists (select 1 from public.partidas p where p.sala_id = p_sala) then
    return;
  end if;

  if v_sala.anfitrion_id = p_uid then
    if v_sala.estado = 'esperando' then
      perform public.cancelar_sala(p_sala);
    end if;
  else
    -- SAL-B2: si la mesa estaba llena, la silla que se libera devuelve el reloj a su plazo original.
    v_llena := (select count(*) from public.sala_jugadores where sala_id = p_sala) = v_sala.jugadores;
    delete from public.sala_jugadores where sala_id = p_sala and jugador_id = p_uid;
    perform public.devolver_entrada(p_sala, p_uid);
    -- MES-PvP 7a · el plazo original es `creada_en + duracion_sala(tipo)`: el que escribió
    -- `crear_sala`. `greatest` nunca acorta: si por carrera el plazo original ya pasó, la cuenta
    -- corta sigue y el barrido decide.
    if v_llena and v_sala.estado = 'esperando' then
      update public.salas
         set expira_en = greatest(expira_en, creada_en + public.duracion_sala(v_sala.tipo))
       where id = p_sala;
    end if;
  end if;
end
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en las migraciones de MOT-1 y del v1.3. Se pega cada grupo ENTERO y sin los
-- `-- `. Cada uno acaba en una única consulta `comprobación | resultado | detalle`, y cada fila
-- debe decir PASA: 4 el Grupo A y 5 el Grupo B.
--
-- El Grupo B fabrica cuatro cuentas y dos mesas de 2, y lo deshace todo al final con la excepción
-- `sub7a_deshacer`: no deja rastro. La abierta es Llena de 50 (2.500 HC), una mesa que el cliente
-- no arma hoy: así no se une a una abierta de verdad que esté esperando.
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- with c(orden, comprobacion, v, ok) as (
--   select 1, 'A1 · duracion_sala: privada 5 min y abierta 3 min, inmutable y con search_path vacío',
--          format('privada=%s · abierta=%s · volatil=%s · config=%s',
--                 public.duracion_sala('privada'), public.duracion_sala('abierta'),
--                 (select provolatile from pg_proc where oid = 'public.duracion_sala(public.sala_tipo)'::regprocedure),
--                 (select proconfig::text from pg_proc where oid = 'public.duracion_sala(public.sala_tipo)'::regprocedure)),
--          public.duracion_sala('privada') = interval '5 minutes'
--          and public.duracion_sala('abierta') = interval '3 minutes'
--          and (select provolatile = 'i' from pg_proc where oid = 'public.duracion_sala(public.sala_tipo)'::regprocedure)
--          and (select 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.duracion_sala(public.sala_tipo)'::regprocedure)
--   union all
--   select 2, 'A2 · duracion_sala: sin permiso para anon ni para authenticated',
--          format('anon=%s · aut=%s',
--                 has_function_privilege('anon', 'public.duracion_sala(public.sala_tipo)', 'execute'),
--                 has_function_privilege('authenticated', 'public.duracion_sala(public.sala_tipo)', 'execute')),
--          not has_function_privilege('anon', 'public.duracion_sala(public.sala_tipo)', 'execute')
--          and not has_function_privilege('authenticated', 'public.duracion_sala(public.sala_tipo)', 'execute')
--   union all
--   select 3, 'A3 · crear_sala y levantarse_de_sala (salir_sala) usan duracion_sala; ya no dicen 3 minutos',
--          format('crear=%s · levantarse=%s · levantarse_3min=%s',
--                 position('duracion_sala(p_tipo)' in pg_get_functiondef('public.crear_sala(public.sala_tipo, smallint, integer, text, text)'::regprocedure)) > 0,
--                 position('duracion_sala(v_sala.tipo)' in pg_get_functiondef('public.levantarse_de_sala(uuid, uuid)'::regprocedure)) > 0,
--                 position('3 minutes' in pg_get_functiondef('public.levantarse_de_sala(uuid, uuid)'::regprocedure)) > 0),
--          position('duracion_sala(p_tipo)' in pg_get_functiondef('public.crear_sala(public.sala_tipo, smallint, integer, text, text)'::regprocedure)) > 0
--          and position('duracion_sala(v_sala.tipo)' in pg_get_functiondef('public.levantarse_de_sala(uuid, uuid)'::regprocedure)) > 0
--          and position('3 minutes' in pg_get_functiondef('public.levantarse_de_sala(uuid, uuid)'::regprocedure)) = 0
--          and position('levantarse_de_sala' in pg_get_functiondef('public.salir_sala(uuid)'::regprocedure)) > 0
--   union all
--   select 4, 'A4 · los permisos de siempre: crear_sala y salir_sala para authenticated y no para anon; levantarse_de_sala para ninguno',
--          format('crear aut=%s anon=%s · salir aut=%s anon=%s · levantarse aut=%s anon=%s',
--                 has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute'),
--                 has_function_privilege('anon', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute'),
--                 has_function_privilege('authenticated', 'public.salir_sala(uuid)', 'execute'),
--                 has_function_privilege('anon', 'public.salir_sala(uuid)', 'execute'),
--                 has_function_privilege('authenticated', 'public.levantarse_de_sala(uuid, uuid)', 'execute'),
--                 has_function_privilege('anon', 'public.levantarse_de_sala(uuid, uuid)', 'execute')),
--          has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')
--          and not has_function_privilege('anon', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')
--          and has_function_privilege('authenticated', 'public.salir_sala(uuid)', 'execute')
--          and not has_function_privilege('anon', 'public.salir_sala(uuid)', 'execute')
--          and not has_function_privilege('authenticated', 'public.levantarse_de_sala(uuid, uuid)', 'execute')
--          and not has_function_privilege('anon', 'public.levantarse_de_sala(uuid, uuid)', 'execute')
-- )
-- select comprobacion as "comprobación",
--        case when ok then 'PASA' else 'FALLA' end as resultado,
--        v as detalle
--   from c
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.sub7a_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.sub7a_b()
-- returns table (orden integer, comprobacion text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   U1 constant uuid := 'a7a00000-0000-4000-8000-000000000001';
--   U2 constant uuid := 'a7a00000-0000-4000-8000-000000000002';
--   U3 constant uuid := 'a7a00000-0000-4000-8000-000000000003';
--   U4 constant uuid := 'a7a00000-0000-4000-8000-000000000004';
--   CIEN constant bigint := 100000;
--   f  jsonb := '[]';
--   p  public.salas;
--   a  public.salas;
--   r  public.salas;
-- begin
--   begin
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'sub7a.' || right(u::text, 2) || '@example.invalid', '', now(), now(), '{}', '{}'
--       from unnest(array[U1, U2, U3, U4]) u;
--     insert into public.profiles (id, username)
--     select u, 'sub7a_verif' || right(u::text, 2) from unnest(array[U1, U2, U3, U4]) u;
--     perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP 7a · verificación') from unnest(array[U1, U2, U3, U4]) u;
--     delete from public.intentos_dinero where jugador_id in (U1, U2, U3, U4);
--
--     -- ── B1 y B2 · una privada vive 5 minutos y una abierta 3 ─────────────────
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     p := public.crear_sala('privada', 2::smallint, 100);
--     f := f || pg_temp.sub7a_fila(1, 'B1 · la privada nace con 5:00 (expira_en = creada_en + 5 min)',
--               p.expira_en = p.creada_en + interval '5 minutes' and p.expira_en = now() + interval '5 minutes',
--               format('creada=%s · expira=%s', p.creada_en, p.expira_en));
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     a := public.crear_sala('abierta', 2::smallint, 50, 'llena');
--     f := f || pg_temp.sub7a_fila(2, 'B2 · la abierta nace con 3:00 (expira_en = creada_en + 3 min), y es la de U3',
--               a.anfitrion_id = U3 and a.expira_en = a.creada_en + interval '3 minutes' and a.expira_en = now() + interval '3 minutes',
--               format('anfitrión U3=%s · creada=%s · expira=%s', a.anfitrion_id = U3, a.creada_en, a.expira_en));
--
--     -- ── B3 · la mesa llena se acorta a 10 s, en las dos ──────────────────────
--     perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
--     perform public.unirse_sala(null, p.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     perform public.unirse_sala(null, a.id);
--     f := f || pg_temp.sub7a_fila(3, 'B3 · llena, la cuenta corta es de 10 s en la privada y en la abierta',
--               (select expira_en from public.salas where id = p.id) = now() + interval '10 seconds'
--               and (select expira_en from public.salas where id = a.id) = now() + interval '10 seconds',
--               format('privada=%s · abierta=%s', (select expira_en - now() from public.salas where id = p.id),
--                                                 (select expira_en - now() from public.salas where id = a.id)));
--
--     -- ── B4 y B5 · el invitado que sale devuelve el reloj a su plazo original ──
--     perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
--     perform public.salir_sala(p.id);
--     select * into r from public.salas where id = p.id;
--     f := f || pg_temp.sub7a_fila(4, 'B4 · privada: el invitado sale y vuelve a creada_en + 5 min, con su entrada devuelta',
--               r.expira_en = r.creada_en + interval '5 minutes' and r.estado = 'esperando' and public.saldo_de(U2) = CIEN,
--               format('expira-creada=%s · estado=%s · saldo U2=%s', r.expira_en - r.creada_en, r.estado, public.saldo_de(U2)));
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     perform public.salir_sala(a.id);
--     select * into r from public.salas where id = a.id;
--     f := f || pg_temp.sub7a_fila(5, 'B5 · abierta: el invitado sale y vuelve a creada_en + 3 min, con su entrada devuelta',
--               r.expira_en = r.creada_en + interval '3 minutes' and r.estado = 'esperando' and public.saldo_de(U4) = CIEN,
--               format('expira-creada=%s · estado=%s · saldo U4=%s', r.expira_en - r.creada_en, r.estado, public.saldo_de(U4)));
--
--     perform set_config('request.jwt.claims', '', true);
--     raise exception 'sub7a_deshacer';
--   exception when others then
--     if sqlerrm <> 'sub7a_deshacer' then
--       f := f || pg_temp.sub7a_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   return query
--     select (x ->> 'o')::integer, x ->> 'c', x ->> 'r', x ->> 'd'
--       from jsonb_array_elements(f) x;
-- end
-- $fn$;
--
-- select comprobacion as "comprobación", resultado, detalle
--   from pg_temp.sub7a_b()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
--
-- CORRIDA REAL · pendiente (paso a la nube, tras el STOP-V de la 7a). Los resultados van al informe.
-- ═══════════════════════════════════════════════════════════════════════════
