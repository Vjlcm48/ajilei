-- ═══════════════════════════════════════════════════════════════════════════
-- MES-PvP · sub-tanda 8 · «Mano actual» entre personas y las manos de cada asiento
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MES-PvP_Sub8_v1.0.md §2.2. Diseño: el informe de la Fase 0 de la sub-tanda 8
-- (`docs/reportes/AJILEI_MES-PvP_Sub8_Fase0_Informe_v1.0.md`, §B y §D), con las decisiones de
-- Victor P-1 (un solo contador de gratis por cuenta), P-2 (los 500 HC salen de la billetera) y
-- P-4 (`manos` entra en la 8).
--
--   1 · `partida_asientos.manos`: cuántas manos cerró la mesa con el asiento dentro. Lo que AMI-1
--       necesitará: dos jugadores con `manos >= 1` en la misma sala jugaron juntos al menos una mano
--       (todos arrancan juntos, y en la mano 1 nadie está sentado fuera).
--   2 · `consultar_mano` con la rama de la mesa de personas. Cuerpo de `mot1_dinero:82-171` con
--       una sola rama más: si `p_mesa` no es una mesa contra las IAS abierta del que llama, se
--       busca su asiento sin cobrar en esa sala con la partida viva. Allí la mano la dice el
--       servidor (`partidas.estado → motor → handCount`): otra es `mano_distinta`. La función no
--       lee ni devuelve cartas de nadie: el desglose lo calcula el cliente con las suyas.
--       El precio es `precio_consulta('humanos')`, la clave lleva el uid
--       (`consulta:<sala>:<uid>:<mano>`, porque `clave_idem` es única en todo el libro y dos
--       jugadores de la misma sala consultan la misma mano) y el movimiento apunta a la sala.
--       La clave y el resto de la rama de las IAS no cambian.
--   3 · `aplicar_efectos` con `manos = manos + 1` en `mano_cerrada`, para los asientos sin cobrar.
--       Cuerpo de `v13_recarga:85-201` sin más cambio que ése.
--
-- LOS PUNTOS NO ESTÁN AQUÍ. El interruptor es un dato: Victor lo enciende en el SQL Editor con
-- `select public.interruptor_puntos_humanos(true);` después de esta migración y antes del deploy
-- (P-3). La llamada al libro ya vive en `aplicar_efectos` y aquí se copia tal cual.
--
-- Compatible con el cliente de antes (nunca llama a `consultar_mano` con una sala) y con la
-- función `partida` de antes (los efectos no cambian). `create or replace` conserva los permisos:
-- `consultar_mano` para `authenticated` y `service_role`; `aplicar_efectos`, solo la base.

-- ── 1 · Las manos de cada asiento ──────────────────────────────────────────
alter table public.partida_asientos
  add column manos smallint not null default 0;

comment on column public.partida_asientos.manos is
  'MES-PvP 8 · Manos que la mesa cerró con este asiento sin cobrar (lo suma aplicar_efectos en mano_cerrada). Para AMI-1: manos >= 1 en los dos = jugaron juntos.';


-- ── 2 · «Mano actual» en la mesa de personas ───────────────────────────────
create or replace function public.consultar_mano(p_mesa uuid, p_mano integer)
returns public.consulta_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_tope   integer := public.consultas_gratis();
  v_mesa   public.mesas_ia;
  v_fila   public.consultas;
  v_precio integer;
  v_nivel  text;
  v_clave  text;
  v_ref    text;
  v_vigente integer;
  v_res    public.movimiento_resultado;
begin
  -- 1 · sesión
  if v_uid is null or not exists (select 1 from public.profiles p where p.id = v_uid) then
    return row('sin_sesion', 0, 0, 0::bigint)::public.consulta_resultado;
  end if;

  select c.* into v_fila from public.consultas c where c.jugador_id = v_uid;

  -- 2 · límite
  if not public.contar_intento_dinero('consultar_mano', public.limite_dinero('consultar_mano')) then
    return row('limite', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;

  -- 3 · argumentos
  if p_mesa is null or p_mano is null or p_mano < 1 then
    return row('argumento_invalido', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;

  -- 4 · la mesa y su precio: contra las IAS como siempre; si no, la de personas (MES-PvP 8)
  select m.* into v_mesa
    from public.mesas_ia m
   where m.id = p_mesa and m.jugador_id = v_uid and m.estado = 'abierta';
  if found then
    v_precio := public.precio_consulta(v_mesa.reto);
    v_nivel := case v_mesa.reto when 'basico' then 'Básico' when 'avanzado' then 'Avanzado' else 'Pro' end;
    v_clave := 'consulta:' || p_mesa::text || ':' || p_mano::text;
    v_ref := 'mesa_ia';
  else
    select (p.estado -> 'motor' ->> 'handCount')::integer into v_vigente
      from public.partida_asientos a
      join public.partidas p on p.sala_id = a.sala_id
     where a.sala_id = p_mesa and a.uid = v_uid and not a.cobrado and p.terminada_en is null;
    if not found then
      return row('mesa_invalida', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
                 public.ia_saldo_actual(v_uid))::public.consulta_resultado;
    end if;
    if v_vigente is distinct from p_mano then
      return row('mano_distinta', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
                 public.ia_saldo_actual(v_uid))::public.consulta_resultado;
    end if;
    v_precio := public.precio_consulta('humanos');
    v_nivel := 'Humanos';
    v_clave := 'consulta:' || p_mesa::text || ':' || v_uid::text || ':' || p_mano::text;
    v_ref := 'sala';
  end if;

  -- 5 · la fila, bloqueada
  insert into public.consultas (jugador_id) values (v_uid) on conflict (jugador_id) do nothing;
  select c.* into v_fila from public.consultas c where c.jugador_id = v_uid for update;

  -- 6 · la última mano consultada
  if v_fila.ultima_mesa = p_mesa and v_fila.ultima_mano = p_mano then
    return row('repetida', v_precio, greatest(v_tope - v_fila.gratis_usadas, 0),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;

  -- 7 · una gratis
  if v_fila.gratis_usadas < v_tope then
    update public.consultas
       set gratis_usadas = v_fila.gratis_usadas + 1,
           ultima_mesa = p_mesa,
           ultima_mano = p_mano,
           actualizada_en = now()
     where jugador_id = v_uid;
    return row('gratis', v_precio, v_tope - (v_fila.gratis_usadas + 1),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;

  -- 8 · el cobro. Con la clave de la mano, una mano pagada antes que la última
  -- vuelve 'repetido' y no se cobra dos veces: 'pagada', sin tocar la fila.
  v_res := public.aplicar_movimiento(
    v_uid, 'consulta', -v_precio::bigint, v_clave, v_ref, p_mesa::text, 'Mano actual · ' || v_nivel);

  if v_res.motivo = 'aplicado' then
    update public.consultas
       set ultima_mesa = p_mesa,
           ultima_mano = p_mano,
           actualizada_en = now()
     where jugador_id = v_uid;
    return row('cobrada', v_precio, 0, v_res.saldo)::public.consulta_resultado;
  end if;
  if v_res.motivo = 'repetido' then
    return row('pagada', v_precio, 0, v_res.saldo)::public.consulta_resultado;
  end if;
  return row(v_res.motivo, v_precio, 0, v_res.saldo)::public.consulta_resultado;
end
$fn$;


-- ── 3 · `manos` en `mano_cerrada` ──────────────────────────────────────────
create or replace function public.aplicar_efectos(p_sala uuid, p_efectos jsonb, p_terminada boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_e       jsonb;
  v_asiento public.partida_asientos;
  v_monto   bigint;
  v_uid     uuid;
  v_fin     boolean := false;
  v_res     public.movimiento_resultado;
begin
  if jsonb_typeof(p_efectos) is distinct from 'array' then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;

  for v_e in select e.valor from jsonb_array_elements(p_efectos) with ordinality as e(valor, n) order by e.n loop
    case v_e ->> 'tipo'
      when 'mano_cerrada' then
        if jsonb_array_length(v_e -> 'pilas') <> (select count(*) from public.partida_asientos where sala_id = p_sala) then
          raise exception 'estado_incoherente' using errcode = 'P0001';
        end if;
        update public.partida_asientos a
           set pila = case when a.cobrado then 0 else (v_e -> 'pilas' ->> a.asiento::integer)::bigint end
         where a.sala_id = p_sala;

        -- MES-PvP 8 · la mano cuenta para quien seguía en la mesa (AMI-1).
        update public.partida_asientos a
           set manos = a.manos + 1
         where a.sala_id = p_sala and not a.cobrado;

        if public.puntos_humanos_encendidos() then
          select a.uid into v_uid
            from public.partida_asientos a
           where a.sala_id = p_sala and a.asiento = (v_e ->> 'ganador')::smallint;
          if v_uid is not null then
            perform public.anotar_puntos_humanos(
              p_sala, v_uid, (v_e ->> 'mano')::integer,
              (v_e ->> 'sentados')::smallint, coalesce((v_e ->> 'ajilei')::smallint, 0::smallint));
          end if;
        end if;

      when 'salida' then
        select a.* into v_asiento
          from public.partida_asientos a
         where a.sala_id = p_sala and a.asiento = (v_e ->> 'asiento')::smallint
           for update;
        v_monto := (v_e ->> 'monto')::bigint;
        if not found or v_monto is null or v_monto < 0 then
          raise exception 'estado_incoherente' using errcode = 'P0001';
        end if;

        -- Una segunda salida igual no paga.
        if not v_asiento.cobrado then
          if v_monto > 0 then
            v_res := public.aplicar_movimiento(
              v_asiento.uid, 'liberacion_pvp', v_monto,
              'liberacion_pvp:' || p_sala::text || ':' || v_asiento.uid::text || ':salida',
              'sala', p_sala::text, null);
            if v_res.motivo <> 'aplicado' then
              raise exception 'estado_incoherente' using errcode = 'P0001';
            end if;
          end if;
          update public.partida_asientos
             set cobrado = true, pila = 0, liberado = v_monto
           where sala_id = p_sala and asiento = v_asiento.asiento;
        end if;

      when 'recarga' then
        select a.* into v_asiento
          from public.partida_asientos a
         where a.sala_id = p_sala and a.asiento = (v_e ->> 'asiento')::smallint
           for update;
        v_monto := (v_e ->> 'monto')::bigint;
        if not found or v_monto is null or v_monto <= 0 or v_asiento.cobrado or (v_e ->> 'mano') is null then
          raise exception 'estado_incoherente' using errcode = 'P0001';
        end if;

        v_res := public.aplicar_movimiento(
          v_asiento.uid, 'recarga_pvp', -v_monto,
          'recarga_pvp:' || p_sala::text || ':' || v_asiento.uid::text || ':' || ((v_e ->> 'mano')::integer)::text,
          'sala', p_sala::text, null);
        if v_res.motivo = 'saldo_insuficiente' then
          raise exception 'saldo_insuficiente' using errcode = 'P0001';
        elsif v_res.motivo <> 'aplicado' then
          raise exception 'estado_incoherente' using errcode = 'P0001';
        end if;

        update public.partida_asientos
           set entrada = entrada + v_monto, pila = pila + v_monto
         where sala_id = p_sala and asiento = v_asiento.asiento;

      when 'partida_terminada' then
        v_fin := true;

      else
        raise exception 'estado_incoherente' using errcode = 'P0001';
    end case;
  end loop;

  if v_fin is distinct from p_terminada then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;

  if jsonb_array_length(p_efectos) > 0 and not public.mesa_cuadra(p_sala) then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;

  if p_terminada and (
       exists (select 1 from public.partida_asientos a where a.sala_id = p_sala and not a.cobrado)
       or public.neto_mesa(p_sala) <> 0
     ) then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;
exception
  -- Una pila negativa, nula o que no es un número: lo mismo que una cuenta que no cuadra.
  when check_violation or not_null_violation or invalid_text_representation then
    raise exception 'estado_incoherente' using errcode = 'P0001';
end
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en las migraciones anteriores. Se pega cada grupo ENTERO y sin los `-- `,
-- uno por pestaña. Cada uno acaba en una única consulta `comprobación | resultado | detalle`, y
-- cada fila debe decir PASA: 4 el Grupo A y 10 el Grupo B. Son las filas de
-- `supabase/pruebas/mespvp8_verificacion.sql`, que `npm run guiones` corre antes del push.
--
-- El Grupo B fabrica cuatro cuentas, una mesa contra las IAS, una sala de 3 y su partida, apaga y
-- enciende el interruptor de los puntos DENTRO, y lo deshace todo al final con la excepción
-- `mespvp8_deshacer`: no deja rastro, tampoco en `interruptor_cambios`. El interruptor de
-- verdad se enciende DESPUÉS, aparte (P-3). Puede sacar un aviso `WARNING` (B4, a propósito).
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- create or replace function pg_temp.mespvp8_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.mespvp8_verificar()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   A constant uuid := 'a8000000-0000-4000-8000-00000000000a';
--   B constant uuid := 'a8000000-0000-4000-8000-00000000000b';
--   C constant uuid := 'a8000000-0000-4000-8000-00000000000c';
--   Z constant uuid := 'a8000000-0000-4000-8000-0000000000ff';
--   CIEN constant bigint := 100000;
--   VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}},{"asiento":2,"vista":{}}]';
--   f    jsonb := '[]';
--   s    public.salas;
--   r    public.mesa_ia_resultado;
--   j    jsonb;
--   t1   text;
--   t2   text;
--   t3   text;
--   t4   text;
--   n    integer;
--   n1   integer;
--   sa   bigint;
--   sb   bigint;
--   lp   record;
--   ma   integer[];
-- begin
--   begin
--     -- ═══ GRUPO A · definiciones y permisos ═══════════════════════════════
--     f := f || pg_temp.mespvp8_fila(1, 'A1 · partida_asientos.manos: smallint, no nula, por defecto 0',
--               (select format_type(atttypid, atttypmod) = 'smallint' and attnotnull
--                  from pg_attribute where attrelid = 'public.partida_asientos'::regclass and attname = 'manos')
--               and (select pg_get_expr(adbin, adrelid) from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
--                     where d.adrelid = 'public.partida_asientos'::regclass and a.attname = 'manos') = '0',
--               (select format('tipo=%s · no nula=%s', format_type(atttypid, atttypmod), attnotnull)
--                  from pg_attribute where attrelid = 'public.partida_asientos'::regclass and attname = 'manos'));
--
--     f := f || pg_temp.mespvp8_fila(2, 'A2 · consultar_mano: una sola firma (uuid, integer), definer, search_path vacío; authenticated sí, anon no',
--               (select count(*) from pg_proc where proname = 'consultar_mano' and pronamespace = 'public'::regnamespace) = 1
--               and (select prosecdef and 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.consultar_mano(uuid, integer)'::regprocedure)
--               and has_function_privilege('authenticated', 'public.consultar_mano(uuid, integer)', 'execute')
--               and not has_function_privilege('anon', 'public.consultar_mano(uuid, integer)', 'execute'),
--               format('versiones=%s · authenticated=%s · anon=%s',
--                      (select count(*) from pg_proc where proname = 'consultar_mano' and pronamespace = 'public'::regnamespace),
--                      has_function_privilege('authenticated', 'public.consultar_mano(uuid, integer)', 'execute'),
--                      has_function_privilege('anon', 'public.consultar_mano(uuid, integer)', 'execute')));
--
--     f := f || pg_temp.mespvp8_fila(3, 'A3 · aplicar_efectos: una sola versión, suma `manos` y conserva los puntos; fuera del cliente',
--               (select count(*) from pg_proc where proname = 'aplicar_efectos' and pronamespace = 'public'::regnamespace) = 1
--               and (select prosrc like '%manos = a.manos + 1%' and prosrc like '%anotar_puntos_humanos%' and prosrc like '%recarga_pvp%'
--                      from pg_proc where oid = 'public.aplicar_efectos(uuid, jsonb, boolean)'::regprocedure)
--               and not has_function_privilege('authenticated', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute')
--               and not has_function_privilege('anon', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute'),
--               format('versiones=%s · authenticated=%s',
--                      (select count(*) from pg_proc where proname = 'aplicar_efectos' and pronamespace = 'public'::regnamespace),
--                      has_function_privilege('authenticated', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute')));
--
--     f := f || pg_temp.mespvp8_fila(4, 'A4 · precio_consulta(''humanos'') = 500',
--               public.precio_consulta('humanos') = 500, format('humanos=%s', public.precio_consulta('humanos')));
--
--     raise exception 'mespvp8_deshacer';
--   exception when others then
--     if sqlerrm <> 'mespvp8_deshacer' then
--       f := f || pg_temp.mespvp8_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   perform set_config('request.jwt.claims', '', true);
--   return query
--     select (x ->> 'o')::integer, x ->> 'c', x ->> 'r', x ->> 'd'
--       from jsonb_array_elements(f) x;
-- end
-- $fn$;
--
-- select prueba as "comprobación", resultado, detalle
--   from pg_temp.mespvp8_verificar()
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.mespvp8_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- -- `consultar_mano` como el cliente: `resultado·precio·gratis_restantes·saldo`, o `ERROR·<sqlstate>`.
-- create or replace function pg_temp.mespvp8_consultar(p_uid uuid, p_mesa uuid, p_mano integer)
-- returns text
-- language plpgsql
-- as $fn$
-- declare
--   v text;
-- begin
--   perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
--   set local role authenticated;
--   select format('%s·%s·%s·%s', r.resultado, r.precio, r.gratis_restantes, r.saldo) into v
--     from public.consultar_mano(p_mesa, p_mano) r;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return v;
-- exception when others then
--   return 'ERROR·' || sqlstate;
-- end
-- $fn$;
--
-- create or replace function pg_temp.mespvp8_verificar()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   A constant uuid := 'a8000000-0000-4000-8000-00000000000a';
--   B constant uuid := 'a8000000-0000-4000-8000-00000000000b';
--   C constant uuid := 'a8000000-0000-4000-8000-00000000000c';
--   Z constant uuid := 'a8000000-0000-4000-8000-0000000000ff';
--   CIEN constant bigint := 100000;
--   VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}},{"asiento":2,"vista":{}}]';
--   f    jsonb := '[]';
--   s    public.salas;
--   r    public.mesa_ia_resultado;
--   j    jsonb;
--   t1   text;
--   t2   text;
--   t3   text;
--   t4   text;
--   n    integer;
--   n1   integer;
--   sa   bigint;
--   sb   bigint;
--   lp   record;
--   ma   integer[];
-- begin
--   begin
--     -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'mespvp8.verif.' || u.n || '@example.invalid', '', now(), now(), '{}', '{}'
--       from (values (A, 'a'), (B, 'b'), (C, 'c'), (Z, 'z')) as u(id, n);
--     insert into public.profiles (id, username)
--     values (A, 'mespvp8_a_verif'), (B, 'mespvp8_b_verif'), (C, 'mespvp8_c_verif'), (Z, 'mespvp8_z_verif');
--     perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP 8 · verificación') from unnest(array[A, B, C, Z]) u;
--     delete from public.intentos_dinero where jugador_id in (A, B, C, Z);
--
--     -- Una consulta contra las IAS de A (mano 1, gratis): el contador es el de la cuenta (P-1).
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     r := public.sentarse_ia('basico', 2, 50, public.ia_entrada_piso(50), gen_random_uuid());
--     perform set_config('request.jwt.claims', '', true);
--     t1 := pg_temp.mespvp8_consultar(A, r.mesa_id, 1);
--
--     -- La mesa de 3, por el camino de siempre. Sentarse en PvP cierra la de las IAS (C4).
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     s := public.crear_sala('privada', 3::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
--     perform public.unirse_sala(null, s.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
--     perform public.unirse_sala(null, s.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     perform public.jugar_ya(s.id);
--     perform set_config('request.jwt.claims', '', true);
--     j := public.crear_partida(s.id, '{"version":0,"motor":{"handCount":1}}'::jsonb, null,
--                               jsonb_build_object(A::text, 0, B::text, 1, C::text, 2), VISTAS);
--
--     -- ── B1 · apagado, la mano ganada no escribe ──────────────────────────
--     -- Mano 1: gana A con AJILEI de 51, y C sale con 1.000 al cerrarse.
--     t2 := public.interruptor_puntos_humanos(false);
--     j := public.guardar_jugada(s.id, 0, '{"version":1,"motor":{"handCount":1}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":3,"ajilei":51,"pilas":[2500,1000,1000]},{"tipo":"salida","asiento":2,"monto":1000}]'::jsonb);
--     select count(*) into n from public.libro_puntos where origen = 'humanos' and mesa_id = s.id;
--     f := f || pg_temp.mespvp8_fila(101, 'B1 · interruptor apagado: la mano 1 ganada se guarda y no escribe en el libro',
--               j ->> 'ok' = 'true' and t2 in ('apagado', 'sin_cambio') and n = 0,
--               format('%s · interruptor=%s · líneas=%s', j ->> 'ok', t2, n));
--
--     -- ── B2 · encendido, una línea con la tabla de humanos ────────────────
--     t2 := public.interruptor_puntos_humanos(true);
--     j := public.guardar_jugada(s.id, 1, '{"version":2,"motor":{"handCount":2}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":3,"ajilei":51,"pilas":[3000,500,0]}]'::jsonb);
--     select count(*) into n from public.libro_puntos
--      where origen = 'humanos' and mesa_id = s.id and mano = 2 and jugador_id = A and nivel is null
--        and sentados = 3 and puntos_base = 6 and ajilei = 51 and extra = 1;
--     select count(*) into n1 from public.libro_puntos where origen = 'humanos' and mesa_id = s.id;
--     f := f || pg_temp.mespvp8_fila(102, 'B2 · encendido: la mano 2 deja una línea humanos, sin nivel, base 6 y extra 1',
--               j ->> 'ok' = 'true' and n = 1 and n1 = 1,
--               format('%s · interruptor=%s · línea buena=%s · líneas de la mesa=%s', j ->> 'ok', t2, n, n1));
--
--     -- ── B5 · `manos`: dos cierres, y quien salió tras el primero se queda en 1 ──
--     select array_agg(a.manos::integer order by a.asiento) into ma from public.partida_asientos a where a.sala_id = s.id;
--     f := f || pg_temp.mespvp8_fila(105, 'B5 · manos: tras dos mano_cerrada, 2 · 2 · 1 (el asiento 2 salió tras la primera)',
--               ma = array[2, 2, 1]::integer[] and public.mesa_cuadra(s.id),
--               format('manos=%s · cuadra=%s', ma, public.mesa_cuadra(s.id)));
--
--     -- ── B3 · la misma mano otra vez no escribe dos veces ─────────────────
--     j := public.guardar_jugada(s.id, 2, '{"version":3,"motor":{"handCount":2}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":3,"ajilei":51,"pilas":[3000,500,0]}]'::jsonb);
--     select count(*) into n from public.libro_puntos where origen = 'humanos' and mesa_id = s.id and mano = 2;
--     f := f || pg_temp.mespvp8_fila(103, 'B3 · la mano 2 repetida sigue en una línea',
--               j ->> 'ok' = 'true' and n = 1, format('%s · líneas de la mano 2=%s', j ->> 'ok', n));
--
--     -- ── B4 · un 52 con 4 sentados no escribe, y la mano se guarda ────────
--     j := public.guardar_jugada(s.id, 3, '{"version":4,"motor":{"handCount":3}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":3,"ganador":1,"sentados":4,"ajilei":52,"pilas":[2500,1000,0]}]'::jsonb);
--     select count(*) into n from public.libro_puntos where origen = 'humanos' and mesa_id = s.id and mano = 3;
--     f := f || pg_temp.mespvp8_fila(104, 'B4 · AJILEI de 52 con 4 sentados: sin línea, y la pila de la mano 3 queda guardada',
--               j ->> 'ok' = 'true' and n = 0
--               and (select pila from public.partida_asientos where sala_id = s.id and asiento = 1) = 1000,
--               format('%s · líneas de la mano 3=%s · pila del asiento 1=%s', j ->> 'ok', n,
--                      (select pila from public.partida_asientos where sala_id = s.id and asiento = 1)));
--
--     -- ── C1 · el contador de gratis es uno: IA + personas = 2 ─────────────
--     t2 := pg_temp.mespvp8_consultar(A, s.id, 3);
--     select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
--     f := f || pg_temp.mespvp8_fila(201, 'C1 · una consulta contra las IAS y otra en la mesa de personas gastan 2 gratis del mismo contador',
--               split_part(t1, '·', 1) = 'gratis' and split_part(t2, '·', 1) = 'gratis' and split_part(t2, '·', 2) = '500'
--               and (select gratis_usadas from public.consultas where jugador_id = A) = 2 and n = 0,
--               format('IA → %s · personas → %s · gratis_usadas=%s · cobros=%s', split_part(t1, '·', 1), t2,
--                      (select gratis_usadas from public.consultas where jugador_id = A), n));
--
--     -- ── C2 · sin gratis, los dos de la misma sala cobran la misma mano ───
--     j := public.guardar_jugada(s.id, 4, '{"version":5,"motor":{"handCount":4}}'::jsonb, null, VISTAS, false, '[]'::jsonb);
--     insert into public.consultas (jugador_id) values (B) on conflict (jugador_id) do nothing;
--     update public.consultas set gratis_usadas = 20 where jugador_id in (A, B);
--     sa := public.saldo_de(A);
--     sb := public.saldo_de(B);
--     t1 := pg_temp.mespvp8_consultar(A, s.id, 4);
--     t2 := pg_temp.mespvp8_consultar(B, s.id, 4);
--     select count(*) into n from public.movimientos
--      where tipo = 'consulta' and monto = -500 and ref_tipo = 'sala' and ref_id = s.id::text
--        and clave_idem in ('consulta:' || s.id || ':' || A || ':4', 'consulta:' || s.id || ':' || B || ':4');
--     f := f || pg_temp.mespvp8_fila(202, 'C2 · sin gratis, A y B consultan la mano 4: dos cobros de 500, cada uno con su clave',
--               split_part(t1, '·', 1) = 'cobrada' and split_part(t2, '·', 1) = 'cobrada' and n = 2
--               and public.saldo_de(A) = sa - 500 and public.saldo_de(B) = sb - 500 and public.mesa_cuadra(s.id),
--               format('A → %s · B → %s · movimientos=%s · cuadra=%s', t1, t2, n, public.mesa_cuadra(s.id)));
--
--     -- ── C3 · la misma mano otra vez: repetida, sin cobrar ────────────────
--     t1 := pg_temp.mespvp8_consultar(A, s.id, 4);
--     select count(*) into n from public.movimientos where jugador_id = A and tipo = 'consulta';
--     f := f || pg_temp.mespvp8_fila(203, 'C3 · A repite la mano 4: repetida y un solo cobro',
--               split_part(t1, '·', 1) = 'repetida' and n = 1 and public.saldo_de(A) = sa - 500,
--               format('→ %s · cobros de A=%s', t1, n));
--
--     -- ── C4 · una mano que no es la del servidor ──────────────────────────
--     t1 := pg_temp.mespvp8_consultar(A, s.id, 5);
--     t2 := pg_temp.mespvp8_consultar(B, s.id, 3);
--     select count(*) into n from public.movimientos where jugador_id in (A, B) and tipo = 'consulta';
--     f := f || pg_temp.mespvp8_fila(204, 'C4 · la mano 5 o la 3 con la 4 en juego: mano_distinta, sin cobro ni cambio de la última',
--               split_part(t1, '·', 1) = 'mano_distinta' and split_part(t2, '·', 1) = 'mano_distinta' and n = 2
--               and (select ultima_mano from public.consultas where jugador_id = A) = 4,
--               format('A mano 5 → %s · B mano 3 → %s · cobros=%s', t1, t2, n));
--
--     -- ── C5 · quien no está sentado: la sala ajena y quien ya salió ───────
--     t1 := pg_temp.mespvp8_consultar(Z, s.id, 4);
--     t2 := pg_temp.mespvp8_consultar(C, s.id, 4);
--     select count(*) into n from public.movimientos where jugador_id in (C, Z) and tipo = 'consulta';
--     f := f || pg_temp.mespvp8_fila(205, 'C5 · una sala ajena y el asiento que ya cobró: mesa_invalida, sin cobro',
--               split_part(t1, '·', 1) = 'mesa_invalida' and split_part(t2, '·', 1) = 'mesa_invalida' and n = 0,
--               format('ajena → %s · salió → %s · cobros=%s', t1, t2, n));
--
--     raise exception 'mespvp8_deshacer';
--   exception when others then
--     if sqlerrm <> 'mespvp8_deshacer' then
--       f := f || pg_temp.mespvp8_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   perform set_config('request.jwt.claims', '', true);
--   return query
--     select (x ->> 'o')::integer, x ->> 'c', x ->> 'r', x ->> 'd'
--       from jsonb_array_elements(f) x;
-- end
-- $fn$;
--
-- select prueba as "comprobación", resultado, detalle
--   from pg_temp.mespvp8_verificar()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
