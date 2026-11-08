-- ═══════════════════════════════════════════════════════════════════════════
-- MES-PvP · árbitro v1.3-b · la recarga PvP
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MES-PvP_Arbitro-v1.3b_v1.0.md §2.2. Diseño: el bloque D del informe de la Fase 0
-- (`docs/reportes/AJILEI_MES-PvP_Arbitro-v1.3_Fase0_Informe_v1.0.md`, D4 y H1), con la decisión
-- P-5 de Victor: un movimiento nuevo, `recarga_pvp`.
--
-- La segunda migración del v1.3: va con la del mensaje (`20261107200000`) en un solo
-- `db push --linked`, ANTES del deploy de la función. Es compatible con la función de antes: nadie
-- emite todavía el efecto `recarga`, y `leer_partida` con una columna de más se lee igual, porque
-- `nucleo.js` desestructura la fila.
--
--   1 · El CHECK `movimientos_tipo_chk` con `recarga_pvp`.
--   2 · `neto_jugador_mesa` y `neto_mesa` cuentan también `recarga_pvp`.
--   3 · `aplicar_efectos` con el efecto `recarga { asiento, monto, mano }`, redefinida entera. Un
--       tipo desconocido sigue lanzando.
--   4 · `leer_partida` con `saldos bigint[]`, el saldo de cada asiento en su orden. Cambia lo que
--       devuelve: `drop` + `create`, y VUELVE A DAR sus permisos a `service_role` (el `drop` se los
--       lleva; sin ellos la función da 500 en todas las mesas).
--
-- LO QUE ENTRA ES LO QUE SALE. La recarga sube `entrada` y `pila` del asiento en lo mismo que el
-- libro le cobra: `mesa_cuadra` (Σ(pila + liberado) = Σ entrada, y el libro dice lo mismo) sigue
-- valiendo sin tocarla, y al terminar `neto_mesa` vale 0 con `recarga_pvp` contado.

-- ── 1 · El tipo nuevo del libro ────────────────────────────────────────────
-- La lista vive en UN sitio (eco1a_libro §3): se amplía quitando y poniendo la restricción en la
-- misma migración que la estrena. La de `cfg1e_mano_actual`, más `recarga_pvp`.
alter table public.movimientos drop constraint if exists movimientos_tipo_chk;
alter table public.movimientos add constraint movimientos_tipo_chk check (tipo in (
  'bono_bienvenida', 'constancia', 'video',
  'entrada_ia', 'recarga_ia', 'salida_ia', 'abandono_ia',
  'compra', 'ajuste_admin',
  'garantia_pvp', 'liberacion_pvp', 'resultado_pvp', 'recarga_pvp',
  'consulta'
));


-- ── 2 · Lo que el libro dice de una mesa ───────────────────────────────────
-- Los cuerpos de `mot1_dinero` con `recarga_pvp`: una recarga es dinero que entra en la mesa, como
-- la garantía. `create or replace` conserva sus permisos.
create or replace function public.neto_jugador_mesa(p_sala uuid, p_uid uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(sum(m.monto), 0)::bigint
    from public.movimientos m
   where m.jugador_id = p_uid
     and m.ref_tipo = 'sala'
     and m.ref_id = p_sala::text
     and m.tipo in ('garantia_pvp', 'liberacion_pvp', 'recarga_pvp')
$fn$;

create or replace function public.neto_mesa(p_sala uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce((select sum(m.monto)
                     from public.movimientos m
                    where m.ref_tipo = 'sala'
                      and m.ref_id = p_sala::text
                      and m.tipo in ('garantia_pvp', 'liberacion_pvp', 'recarga_pvp')), 0)::bigint
       + coalesce((select sum(a.liberado - a.entrada)
                     from public.partida_asientos a
                    where a.sala_id = p_sala and a.uid is null), 0)::bigint
$fn$;


-- ── 3 · El efecto `recarga` ────────────────────────────────────────────────
-- El cuerpo de `mot1_dinero` con una rama más. La recarga va DESPUÉS de `mano_cerrada` en la lista
-- del árbitro: las pilas del cierre van sin ella, y el efecto la suma. Si llegara antes,
-- `mano_cerrada` pisaría la pila y `mesa_cuadra` lo pararía.
--
--   · `aplicar_movimiento(uid, 'recarga_pvp', −monto, 'recarga_pvp:<sala>:<uid>:<mano>')`. Un asiento
--     recarga a lo sumo una vez por pausa, y la clave es única en el libro: la misma recarga no se
--     cobra dos veces (la segunda vuelve como `repetido` y la jugada entera se deshace).
--   · Sin saldo, `saldo_insuficiente`: la jugada entera se deshace y la función la repite una vez
--     con saldos frescos, con los que el árbitro cancela el pedido (`nucleo.js`).
--   · `entrada += monto` y `pila += monto`, en el asiento.
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


-- ── 4 · `leer_partida` con el saldo de cada asiento ────────────────────────
-- El árbitro es puro y no conoce el saldo: la función se lo pasa con la hora (`{ ahora, saldos }`)
-- y nunca se guarda en el estado. El de `saldo_de`, en el orden de los asientos; 0 sin cuenta.
-- `drop` + `create`: cambia lo que devuelve. El `drop` se lleva los permisos.
drop function public.leer_partida(uuid);

create function public.leer_partida(p_sala uuid)
returns table (estado jsonb, version integer, vencimiento timestamptz, correspondencia jsonb, abandonos smallint[], saldos bigint[])
language sql
stable
security definer
set search_path = ''
as $fn$
  select p.estado, p.version, p.vencimiento, p.correspondencia,
         array(select a.asiento
                 from public.partida_asientos a
                where a.sala_id = p.sala_id and a.abandono_pedido and not a.cobrado
                order by a.asiento),
         array(select public.saldo_de(a.uid)::bigint
                 from public.partida_asientos a
                where a.sala_id = p.sala_id
                order by a.asiento)
    from public.partidas p
   where p.sala_id = p_sala
$fn$;

comment on function public.leer_partida(uuid) is
  'MES-PvP v1.3 · Estado, versión, vencimiento, correspondencia, asientos con abandono pedido y saldo de cada asiento, o ninguna fila. Sólo service_role.';

revoke execute on function public.leer_partida(uuid) from public, anon, authenticated;
grant  execute on function public.leer_partida(uuid) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en las migraciones de MOT-1. Se pega cada grupo ENTERO y sin los `-- `.
-- Cada uno acaba en una única consulta `comprobación | resultado | detalle`, y cada fila debe
-- decir PASA: 2 el Grupo A y 8 el Grupo B. Los nombres siguen el informe de la Fase 0 (§H1); A2,
-- A3, A5, B6 y B7 son de la migración del mensaje.
--
-- El Grupo B fabrica cuatro cuentas y dos partidas, y lo deshace todo al final con la excepción
-- `v13rec_deshacer`: no deja rastro.
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- with c(orden, comprobacion, v, ok) as (
--   select 1, 'A1 · el CHECK del libro admite recarga_pvp y conserva los demás tipos',
--          (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk'),
--          (select pg_get_constraintdef(oid) like '%garantia_pvp%liberacion_pvp%resultado_pvp%recarga_pvp%consulta%'
--             from pg_constraint where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk')
--   union all
--   select 4, 'A4 · leer_partida: devuelve los saldos, solo service_role, security definer y search_path vacío',
--          format('devuelve=%s · servicio=%s · aut=%s · anon=%s · definer=%s · config=%s',
--                 pg_get_function_result('public.leer_partida(uuid)'::regprocedure),
--                 has_function_privilege('service_role', 'public.leer_partida(uuid)', 'execute'),
--                 has_function_privilege('authenticated', 'public.leer_partida(uuid)', 'execute'),
--                 has_function_privilege('anon', 'public.leer_partida(uuid)', 'execute'),
--                 (select prosecdef from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure),
--                 (select proconfig::text from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure)),
--          pg_get_function_result('public.leer_partida(uuid)'::regprocedure) like '%abandonos smallint[], saldos bigint[]%'
--          and has_function_privilege('service_role', 'public.leer_partida(uuid)', 'execute')
--          and not has_function_privilege('authenticated', 'public.leer_partida(uuid)', 'execute')
--          and not has_function_privilege('anon', 'public.leer_partida(uuid)', 'execute')
--          and (select prosecdef from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure)
--          and (select 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.leer_partida(uuid)'::regprocedure)
-- )
-- select comprobacion as "comprobación",
--        case when ok then 'PASA' else 'FALLA' end as resultado,
--        v as detalle
--   from c
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.v13r_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.v13r_b()
-- returns table (orden integer, comprobacion text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   U1 constant uuid := 'a13b0000-0000-4000-8000-000000000001';
--   U2 constant uuid := 'a13b0000-0000-4000-8000-000000000002';
--   U3 constant uuid := 'a13b0000-0000-4000-8000-000000000003';
--   U4 constant uuid := 'a13b0000-0000-4000-8000-000000000004';
--   CIEN constant bigint := 100000;
--   VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]';
--   f  jsonb := '[]';
--   s  public.salas;
--   s2 public.salas;
--   j  jsonb;
--   e  text;
--   lp record;
--   n  integer;
--   a0 public.partida_asientos;
--   a1 public.partida_asientos;
-- begin
--   begin
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'v13rec.' || right(u::text, 2) || '@example.invalid', '', now(), now(), '{}', '{}'
--       from unnest(array[U1, U2, U3, U4]) u;
--     insert into public.profiles (id, username)
--     select u, 'v13rec_verif' || right(u::text, 2) from unnest(array[U1, U2, U3, U4]) u;
--     perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP v1.3 · verificación') from unnest(array[U1, U2, U3, U4]) u;
--     delete from public.intentos_dinero where jugador_id in (U1, U2, U3, U4);
--
--     -- Una mesa de 2 de 100 (entrada corta, 1.500) arrancada y su partida, por el camino de siempre.
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
--     perform public.unirse_sala(null, s.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     perform public.jugar_ya(s.id);
--     perform set_config('request.jwt.claims', '', true);
--     j := public.crear_partida(s.id, '{"version":0}'::jsonb, null, jsonb_build_object(U1::text, 0, U2::text, 1), VISTAS);
--
--     -- ── B9 · una partida con estado v1.2 sigue jugando ─────────────────────────
--     -- Sin `entrada` en el estado y sin efecto `recarga`: los efectos de siempre, con la función nueva.
--     j := public.guardar_jugada(s.id, 0, '{"version":1,"motor":{}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":1,"ganador":1,"sentados":2,"ajilei":0,"pilas":[700,2300]}]'::jsonb);
--     select * into a0 from public.partida_asientos where sala_id = s.id and asiento = 0;
--     f := f || pg_temp.v13r_fila(901, 'B9 · una jugada de la v1.2 (mano_cerrada, sin recarga) se guarda igual',
--               j ->> 'ok' = 'true' and a0.pila = 700 and a0.entrada = 1500 and public.mesa_cuadra(s.id),
--               format('%s · pila=%s · entrada=%s', j, a0.pila, a0.entrada));
--
--     -- ── B1 · la recarga mueve −m y sube entrada y pila, con mesa_cuadra ──────────
--     select * into lp from public.leer_partida(s.id);
--     j := public.guardar_jugada(s.id, 1, '{"version":2}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"recarga","asiento":0,"monto":800,"mano":1}]'::jsonb);
--     select * into a0 from public.partida_asientos where sala_id = s.id and asiento = 0;
--     f := f || pg_temp.v13r_fila(101, 'B1 · la recarga cobra −800 con su clave, sube entrada y pila, y la mesa cuadra',
--               j ->> 'ok' = 'true' and public.saldo_de(U1) = CIEN - 1500 - 800
--               and a0.entrada = 2300 and a0.pila = 1500 and public.mesa_cuadra(s.id)
--               and exists (select 1 from public.movimientos m where m.jugador_id = U1 and m.tipo = 'recarga_pvp' and m.monto = -800
--                             and m.clave_idem = 'recarga_pvp:' || s.id || ':' || U1 || ':1' and m.ref_tipo = 'sala' and m.ref_id = s.id::text)
--               and lp.saldos = array[CIEN - 1500, CIEN - 1500]::bigint[],
--               format('%s · saldo=%s · entrada=%s · pila=%s · saldos leídos=%s', j, public.saldo_de(U1), a0.entrada, a0.pila, lp.saldos));
--
--     -- ── B3 · la misma clave no cobra dos veces ─────────────────────────────────
--     begin
--       j := public.guardar_jugada(s.id, 2, '{"version":3}'::jsonb, null, VISTAS, false,
--              '[{"tipo":"recarga","asiento":0,"monto":800,"mano":1}]'::jsonb);
--       e := 'pasó';
--     exception when others then e := sqlerrm;
--     end;
--     select count(*) into n from public.movimientos where clave_idem = 'recarga_pvp:' || s.id || ':' || U1 || ':1';
--     select * into a0 from public.partida_asientos where sala_id = s.id and asiento = 0;
--     f := f || pg_temp.v13r_fila(301, 'B3 · la misma recarga otra vez: la jugada entera se deshace y no cobra',
--               e = 'estado_incoherente' and n = 1 and public.saldo_de(U1) = CIEN - 2300 and a0.entrada = 2300
--               and (select version from public.partidas where sala_id = s.id) = 2,
--               format('error=%s · líneas=%s · saldo=%s', e, n, public.saldo_de(U1)));
--
--     -- ── B2 · sin saldo, la jugada entera se deshace ────────────────────────────
--     perform public.ajuste_admin(U2, 100 - public.saldo_de(U2), 'MES-PvP v1.3 · verificación');
--     begin
--       j := public.guardar_jugada(s.id, 2, '{"version":3}'::jsonb, null, VISTAS, false,
--              '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":2,"ajilei":0,"pilas":[2800,1000]},{"tipo":"recarga","asiento":1,"monto":500,"mano":2}]'::jsonb);
--       e := 'pasó';
--     exception when others then e := sqlerrm;
--     end;
--     select * into a1 from public.partida_asientos where sala_id = s.id and asiento = 1;
--     f := f || pg_temp.v13r_fila(201, 'B2 · sin saldo: saldo_insuficiente y nada cambia, ni el cierre de la mano',
--               e = 'saldo_insuficiente' and public.saldo_de(U2) = 100 and a1.pila = 2300 and a1.entrada = 1500
--               and (select version from public.partidas where sala_id = s.id) = 2,
--               format('error=%s · saldo=%s · pila=%s', e, public.saldo_de(U2), a1.pila));
--
--     -- ── B4 · la salida tras una recarga paga lo recargado; neto_mesa = 0 al terminar ──
--     j := public.guardar_jugada(s.id, 2, '{"version":3}'::jsonb, null, VISTAS, true,
--            '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":2,"ajilei":0,"pilas":[3800,0]},{"tipo":"salida","asiento":0,"monto":3800},{"tipo":"salida","asiento":1,"monto":0},{"tipo":"partida_terminada","ganador":0}]'::jsonb);
--     f := f || pg_temp.v13r_fila(401, 'B4 · al terminar paga la pila con lo recargado y el libro de la mesa queda en 0',
--               j ->> 'ok' = 'true' and public.neto_mesa(s.id) = 0 and public.mesa_cuadra(s.id)
--               and public.saldo_de(U1) = CIEN - 1500 - 800 + 3800 and public.neto_jugador_mesa(s.id, U1) = 1500,
--               format('%s · neto_mesa=%s · saldo U1=%s · neto U1=%s', j, public.neto_mesa(s.id), public.saldo_de(U1), public.neto_jugador_mesa(s.id, U1)));
--
--     -- ── B5 · una partida muerta con recarga cuadra ─────────────────────────────
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     s2 := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     perform public.unirse_sala(null, s2.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     perform public.jugar_ya(s2.id);
--     perform set_config('request.jwt.claims', '', true);
--     j := public.crear_partida(s2.id, '{"version":0}'::jsonb, null, jsonb_build_object(U3::text, 0, U4::text, 1), VISTAS);
--     j := public.guardar_jugada(s2.id, 0, '{"version":1}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":1,"ganador":1,"sentados":2,"ajilei":0,"pilas":[0,3000]},{"tipo":"recarga","asiento":0,"monto":1500,"mano":1}]'::jsonb);
--     update public.partidas set actualizada_en = now() - interval '16 minutes' where sala_id = s2.id;
--     perform 1 from public.salas where id = s2.id for update;
--     perform public.cerrar_partida_muerta(s2.id);
--     f := f || pg_temp.v13r_fila(501, 'B5 · la partida muerta paga pilas con lo recargado, cuadra y queda en 0',
--               (select terminada_en is not null from public.partidas where sala_id = s2.id)
--               and public.neto_mesa(s2.id) = 0 and public.mesa_cuadra(s2.id)
--               and public.saldo_de(U3) = CIEN - 1500 and public.saldo_de(U4) = CIEN + 1500,
--               format('neto_mesa=%s · U3=%s · U4=%s', public.neto_mesa(s2.id), public.saldo_de(U3), public.saldo_de(U4)));
--
--     -- ── B8 · el efecto desconocido sigue lanzando ──────────────────────────────
--     begin
--       perform public.aplicar_efectos(s.id, '[{"tipo":"regalo","asiento":0,"monto":5}]'::jsonb, false);
--       e := 'pasó';
--     exception when others then e := sqlerrm;
--     end;
--     f := f || pg_temp.v13r_fila(801, 'B8 · un efecto desconocido sigue siendo estado_incoherente', e = 'estado_incoherente', e);
--
--     raise exception 'v13rec_deshacer';
--   exception when others then
--     if sqlerrm <> 'v13rec_deshacer' then
--       f := f || pg_temp.v13r_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
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
--   from pg_temp.v13r_b()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
--
-- CORRIDA REAL · pendiente (paso a la nube, tras el STOP-C del v1.3-b). Los resultados van al informe.
-- ═══════════════════════════════════════════════════════════════════════════
