-- ═══════════════════════════════════════════════════════════════════════════
-- MES-PvP · árbitro v1.3-a · el freno del mensaje de la mesa
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha: AJILEI_MES-PvP_Arbitro-v1.3a_v1.0.md §2.3 (ruta B). Diseño: el informe de la Fase 0,
-- §E2 (docs/reportes/AJILEI_MES-PvP_Arbitro-v1.3_Fase0_Informe_v1.0.md).
--
-- El mensaje NO es una acción del árbitro: no escribe el estado ni sube la versión, porque
-- `guardar_jugada` exige la leída + 1 (mot1_dinero) y cada mensaje obligaría a releer las
-- vistas de toda la mesa. El freno de 10 s por jugador vive aquí, en `partida_asientos`, y lo
-- impone `anotar_mensaje` en un solo `update` condicionado: dos llamadas a la vez no pueden
-- pasar las dos.
--
-- Se aplica junto con la migración de la recarga (v1.3-b), en un solo `db push`, ANTES del
-- deploy de `partida`. Es compatible con la función v1.2: nadie la llama todavía.
--
-- `leer_partida` no cambia aquí: su `drop` y `create` van con la recarga.

-- ── 1 · La columna ─────────────────────────────────────────────────────────
-- La hora del último mensaje aceptado de ese asiento. Nula = nunca habló. `partida_asientos`
-- sigue sin políticas ni privilegios del cliente (mot1_dinero, §3).
alter table public.partida_asientos
  add column ultimo_mensaje timestamptz;

comment on column public.partida_asientos.ultimo_mensaje is
  'MES-PvP v1.3 · Hora del último mensaje aceptado del asiento: el freno de 10 s de anotar_mensaje.';

-- ── 2 · La pieza ───────────────────────────────────────────────────────────
-- Anota el mensaje si el asiento está vivo en una partida sin terminar y han pasado 10 s
-- desde el anterior. Devuelve `{ ok: true, asiento }`, o `{ ok: false, motivo }` con
-- `freno` (dentro de los 10 s) o `no_es_de_esta_mesa` (ajeno, ya cobrado o partida
-- terminada: quien ya no tiene asiento vivo). Los motivos son los del árbitro
-- (`src/arbitro/motivos.js`). Como las demás piezas del árbitro: uid por parámetro, sin
-- `auth.uid()`, y solo `service_role` (Contrato §5, N-1).
create function public.anotar_mensaje(p_sala uuid, p_uid uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_asiento smallint;
begin
  update public.partida_asientos a
     set ultimo_mensaje = now()
    from public.partidas p
   where a.sala_id = p_sala
     and a.uid = p_uid
     and not a.cobrado
     and p.sala_id = a.sala_id
     and p.terminada_en is null
     and (a.ultimo_mensaje is null or a.ultimo_mensaje <= now() - interval '10 seconds')
  returning a.asiento into v_asiento;

  if v_asiento is not null then
    return jsonb_build_object('ok', true, 'asiento', v_asiento);
  end if;

  if exists (select 1
               from public.partida_asientos a
               join public.partidas p on p.sala_id = a.sala_id
              where a.sala_id = p_sala and a.uid = p_uid and not a.cobrado and p.terminada_en is null) then
    return jsonb_build_object('ok', false, 'motivo', 'freno');
  end if;
  return jsonb_build_object('ok', false, 'motivo', 'no_es_de_esta_mesa');
end
$fn$;

comment on function public.anotar_mensaje(uuid, uuid) is
  'MES-PvP v1.3 · Freno de 10 s del mensaje de la mesa: anota y devuelve el asiento, o freno / no_es_de_esta_mesa. Sólo service_role.';

revoke execute on function public.anotar_mensaje(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.anotar_mensaje(uuid, uuid) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en las migraciones de MOT-1. Se pega cada grupo ENTERO y sin los `-- `.
-- Cada uno acaba en una única consulta `comprobación | resultado | detalle`, y cada fila debe
-- decir PASA: 3 el Grupo A y 7 el Grupo B. Los nombres siguen el informe de la Fase 0 (§H1).
--
-- El Grupo B fabrica tres cuentas y una partida, y lo deshace todo al final con la excepción
-- `v13msj_deshacer`: no deja rastro.
--
-- Lo que no cubren, declarado: dos llamadas a la vez de verdad (pide dos conexiones). La
-- atomicidad descansa en que es un solo `update … where` condicionado.
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- with c(orden, comprobacion, v, ok) as (
--   select 2, 'A2 · partida_asientos.ultimo_mensaje existe, timestamptz y nula por defecto',
--          coalesce((select format('%s · nula=%s · defecto=%s', data_type, is_nullable, coalesce(column_default, 'ninguno'))
--                      from information_schema.columns
--                     where table_schema = 'public' and table_name = 'partida_asientos' and column_name = 'ultimo_mensaje'), 'no está'),
--          coalesce((select data_type = 'timestamp with time zone' and is_nullable = 'YES' and column_default is null
--                      from information_schema.columns
--                     where table_schema = 'public' and table_name = 'partida_asientos' and column_name = 'ultimo_mensaje'), false)
--   union all
--   select 3, 'A3 · anotar_mensaje: solo service_role, security definer y search_path vacío',
--          format('servicio=%s · aut=%s · anon=%s · definer=%s · config=%s',
--                 has_function_privilege('service_role', 'public.anotar_mensaje(uuid, uuid)', 'execute'),
--                 has_function_privilege('authenticated', 'public.anotar_mensaje(uuid, uuid)', 'execute'),
--                 has_function_privilege('anon', 'public.anotar_mensaje(uuid, uuid)', 'execute'),
--                 (select prosecdef from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure),
--                 (select proconfig::text from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure)),
--          has_function_privilege('service_role', 'public.anotar_mensaje(uuid, uuid)', 'execute')
--          and not has_function_privilege('authenticated', 'public.anotar_mensaje(uuid, uuid)', 'execute')
--          and not has_function_privilege('anon', 'public.anotar_mensaje(uuid, uuid)', 'execute')
--          and (select prosecdef from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure)
--          and (select 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.anotar_mensaje(uuid, uuid)'::regprocedure)
--   union all
--   select 5, 'A5 · partida_asientos y partidas siguen sin políticas ni privilegios del cliente',
--          format('políticas=%s · select aut=%s · update aut=%s',
--                 (select count(*) from pg_policies where schemaname = 'public' and tablename in ('partida_asientos', 'partidas')),
--                 has_table_privilege('authenticated', 'public.partida_asientos', 'select'),
--                 has_table_privilege('authenticated', 'public.partida_asientos', 'update')),
--          (select count(*) from pg_policies where schemaname = 'public' and tablename in ('partida_asientos', 'partidas')) = 0
--          and not has_table_privilege('authenticated', 'public.partida_asientos', 'select')
--          and not has_table_privilege('authenticated', 'public.partida_asientos', 'update')
--          and not has_table_privilege('anon', 'public.partida_asientos', 'select')
-- )
-- select comprobacion as "comprobación",
--        case when ok then 'PASA' else 'FALLA' end as resultado,
--        v as detalle
--   from c
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.v13m_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.v13m_b()
-- returns table (orden integer, comprobacion text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   U1 constant uuid := 'a13a0000-0000-4000-8000-000000000001';
--   U2 constant uuid := 'a13a0000-0000-4000-8000-000000000002';
--   U3 constant uuid := 'a13a0000-0000-4000-8000-000000000003';
--   CIEN constant bigint := 100000;
--   f  jsonb := '[]';
--   s  public.salas;
--   j  jsonb;
--   j2 jsonb;
--   t1 timestamptz;
-- begin
--   begin
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'v13msj.' || right(u::text, 2) || '@example.invalid', '', now(), now(), '{}', '{}'
--       from unnest(array[U1, U2, U3]) u;
--     insert into public.profiles (id, username)
--     select u, 'v13msj_verif' || right(u::text, 2) from unnest(array[U1, U2, U3]) u;
--     perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MES-PvP v1.3 · verificación') from unnest(array[U1, U2]) u;
--     delete from public.intentos_dinero where jugador_id in (U1, U2);
--
--     -- Una mesa de 2 arrancada y su partida, por el camino de siempre.
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
--     perform public.unirse_sala(null, s.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     perform public.jugar_ya(s.id);
--     perform set_config('request.jwt.claims', '', true);
--     j := public.crear_partida(s.id, '{"version":0}'::jsonb, null,
--                               jsonb_build_object(U1::text, 0, U2::text, 1),
--                               '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]'::jsonb);
--
--     -- ── B6 · el freno de 10 s ──────────────────────────────────────────────────
--     j := public.anotar_mensaje(s.id, U1);
--     select ultimo_mensaje into t1 from public.partida_asientos where sala_id = s.id and uid = U1;
--     f := f || pg_temp.v13m_fila(601, 'B6a · el primero pasa, devuelve su asiento y anota la hora',
--               j ->> 'ok' = 'true' and (j ->> 'asiento')::int = 0 and t1 = now(), j::text);
--
--     j := public.anotar_mensaje(s.id, U1);
--     f := f || pg_temp.v13m_fila(602, 'B6b · el segundo dentro de los 10 s rebota con freno y no mueve la hora',
--               j ->> 'ok' = 'false' and j ->> 'motivo' = 'freno'
--               and (select ultimo_mensaje from public.partida_asientos where sala_id = s.id and uid = U1) = t1, j::text);
--
--     j := public.anotar_mensaje(s.id, U2);
--     f := f || pg_temp.v13m_fila(603, 'B6c · el freno es por jugador: el otro pasa', j ->> 'ok' = 'true' and (j ->> 'asiento')::int = 1, j::text);
--
--     update public.partida_asientos set ultimo_mensaje = now() - interval '9.999 seconds' where sala_id = s.id and uid = U1;
--     j := public.anotar_mensaje(s.id, U1);
--     update public.partida_asientos set ultimo_mensaje = now() - interval '10 seconds' where sala_id = s.id and uid = U1;
--     j2 := public.anotar_mensaje(s.id, U1);
--     f := f || pg_temp.v13m_fila(604, 'B6d · a 9,999 s rebota; a los 10 s justos pasa', j ->> 'motivo' = 'freno' and j2 ->> 'ok' = 'true',
--               format('9,999 s → %s · 10 s → %s', j, j2));
--
--     -- ── B7 · ajeno, cobrado o partida terminada ───────────────────────────────
--     j := public.anotar_mensaje(s.id, U3);
--     f := f || pg_temp.v13m_fila(701, 'B7a · una cuenta sin asiento en la mesa: no_es_de_esta_mesa',
--               j ->> 'ok' = 'false' and j ->> 'motivo' = 'no_es_de_esta_mesa', j::text);
--
--     j := public.guardar_jugada(s.id, 0, '{"version":1}'::jsonb, null,
--                                '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]'::jsonb, false,
--                                '[{"tipo":"salida","asiento":1,"monto":1500}]'::jsonb);
--     update public.partida_asientos set ultimo_mensaje = null where sala_id = s.id;
--     j2 := public.anotar_mensaje(s.id, U2);
--     f := f || pg_temp.v13m_fila(702, 'B7b · quien ya cobró no habla, aunque no tenga freno',
--               j ->> 'ok' = 'true' and j2 ->> 'ok' = 'false' and j2 ->> 'motivo' = 'no_es_de_esta_mesa', format('salida=%s · mensaje=%s', j, j2));
--
--     update public.partidas set terminada_en = now() where sala_id = s.id;
--     j := public.anotar_mensaje(s.id, U1);
--     f := f || pg_temp.v13m_fila(703, 'B7c · con la partida terminada nadie habla',
--               j ->> 'ok' = 'false' and j ->> 'motivo' = 'no_es_de_esta_mesa', j::text);
--
--     raise exception 'v13msj_deshacer';
--   exception when others then
--     if sqlerrm <> 'v13msj_deshacer' then
--       f := f || pg_temp.v13m_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   return query
--     select (e ->> 'o')::integer, e ->> 'c', e ->> 'r', e ->> 'd'
--       from jsonb_array_elements(f) e;
-- end
-- $fn$;
--
-- select comprobacion as "comprobación", resultado, detalle
--   from pg_temp.v13m_b()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
--
-- CORRIDA REAL · pendiente (paso a la nube, tras el v1.3-b). Los resultados van al informe.
-- ═══════════════════════════════════════════════════════════════════════════
