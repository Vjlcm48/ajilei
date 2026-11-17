-- ═══════════════════════════════════════════════════════════════════════════
-- MED-1a · tanda 1 · La nube: `eventos`, `sesiones`, `origen` e `ingreso`
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MED-1a_T1_v1.0.md §3. Diseño: el informe de la Fase 0
-- (`docs/reportes/AJILEI_MED-1a_Fase0_Informe_v1.0.md`, §B.2 a §B.5 y §C).
--
--   1 · `eventos`: de solo inserción (copia de `movimientos_inmutable`), RLS sin políticas y
--       sin privilegios del cliente. `tipo` por formato, no por lista: un `inv_*` de GEN-1
--       entra sin tocar la tabla. Escriben `aplicar_efectos`, el disparador de `constancia`
--       y, desde el cliente, solo `registrar_evento`.
--   2 · `sesiones` y `latido_sesion`: el tiempo dentro, por latidos (el cliente, tanda 2).
--   3 · `registrar_evento`: lista blanca de tipos de cliente (hoy `pvp_reconexion`) y tope de
--       30 filas por minuto. Los `anuncio_*` no entran por aquí: un cliente no los finge.
--   4 · `profiles.origen` y `origen_datos`: se escriben en el `insert` del Bautizo (tanda 2).
--       El `insert` de `profiles` no está restringido por columnas (privilegio de tabla por
--       defecto + `profiles_insert_propio`): no se toca. El `update` (`cfg1b_perfil:215-216`)
--       y el `select` (`arn4c_profiles_columnas:13-14`, INV-83) sí lo están y no las incluyen:
--       quedan escritas una vez y privadas, sin código.
--   5 · El disparador `ingreso` sobre `constancia`: una fila por cuenta y día de Chicago.
--   6 · `aplicar_efectos` con `anuncio_inicio`, `anuncio_omitido` y `anuncio_vuelto` (Contrato
--       v1.6). Cuerpo de `mespvp_sub8:151-272` sin más cambio que la rama nueva. Ninguno mueve
--       pila, pozo ni saldo; `mesa_cuadra` corre como siempre.
--
-- REGLA: LA MEDICIÓN NUNCA TUMBA LA MESA. Un `anuncio_*` mal formado no lanza
-- `estado_incoherente`: se anota como `medicion_invalida` (`jugador_id` nulo, `datos` con la
-- sala y el efecto en bruto) y la jugada se aplica. Un tipo de efecto desconocido sí sigue
-- fallando, como antes. En el mismo espíritu, `latido_sesion` y `registrar_evento` devuelven
-- false en vez de un error, también sin perfil todavía (verificó el código, no se bautizó).
--
-- ORDEN: esta migración va ANTES del deploy de `partida` v1.6. El árbitro de hoy no emite los
-- `anuncio_*` y es compatible con ella; el árbitro nuevo, con el SQL de antes, rompería en
-- `estado_incoherente`. Sin `update` de las cuentas de antes: su `origen` queda nulo.

-- ── 1 · `eventos` ──────────────────────────────────────────────────────────
create table public.eventos (
  id         bigint      generated always as identity primary key,
  jugador_id uuid        null references public.profiles(id) on delete cascade,
  tipo       text        not null,
  creado_en  timestamptz not null default now(),
  datos      jsonb       not null default '{}'::jsonb,

  constraint eventos_tipo_chk  check (tipo ~ '^[a-z][a-z0-9_]{2,39}$'),
  constraint eventos_datos_chk check (pg_column_size(datos) <= 2048)
);

comment on table public.eventos is
  'MED-1a · Lo que la base no guardaba: ingreso, anuncio_*, pvp_reconexion (y los inv_* de GEN-1). Solo inserción. RLS sin políticas; escriben aplicar_efectos, el disparador de constancia y registrar_evento.';

create index eventos_tipo_creado_idx    on public.eventos (tipo, creado_en);
create index eventos_jugador_creado_idx on public.eventos (jugador_id, creado_en);

alter table public.eventos enable row level security;
revoke all on table public.eventos from public, anon, authenticated;

-- El mismo criterio que `movimientos_inmutable` (`eco1a_libro`, §3): solo el borrado EN
-- CASCADA al borrar una cuenta llega con `pg_trigger_depth() >= 2`.
create or replace function public.eventos_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() >= 2 then
    return old;
  end if;
  raise exception 'eventos_inmutable' using errcode = 'P0001',
    hint = 'Los eventos son de sólo inserción.';
end
$fn$;

create trigger eventos_inmutable_trg
  before update or delete on public.eventos
  for each row execute function public.eventos_inmutable();

create trigger eventos_sin_truncate_trg
  before truncate on public.eventos
  for each statement execute function public.eventos_inmutable();

-- ── 2 · `sesiones` y `latido_sesion` ───────────────────────────────────────
-- Tabla aparte porque el latido ACTUALIZA la fila. Duración = ultimo_latido − inicio.
create table public.sesiones (
  id            uuid        primary key,
  jugador_id    uuid        not null references public.profiles(id) on delete cascade,
  inicio        timestamptz not null default now(),
  ultimo_latido timestamptz not null default now(),
  latidos       integer     not null default 1
);

comment on table public.sesiones is
  'MED-1a · Una fila por sesión del cliente (id del cliente). La mueve latido_sesion. RLS sin políticas.';

create index sesiones_jugador_inicio_idx on public.sesiones (jugador_id, inicio);

alter table public.sesiones enable row level security;
revoke all on table public.sesiones from public, anon, authenticated;

-- true = latido aceptado (o ignorado por llegar a menos de 20 s); false = la sesión no es
-- tuya o lleva más de 10 min sin latir (o la cuenta aún no tiene perfil): el cliente abre otra con un id nuevo.
create or replace function public.latido_sesion(p_sesion uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
  v_s   public.sesiones;
begin
  if v_uid is null or p_sesion is null then
    return false;
  end if;
  -- Verificó el código pero aún no se bautizó: sin perfil no hay fila que colgar.
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    return false;
  end if;

  insert into public.sesiones (id, jugador_id) values (p_sesion, v_uid)
  on conflict (id) do nothing;
  if found then
    return true;
  end if;

  select s.* into v_s from public.sesiones s where s.id = p_sesion for update;
  if v_s.jugador_id <> v_uid then
    return false;
  end if;
  if v_s.ultimo_latido < now() - interval '10 minutes' then
    return false;
  end if;
  if v_s.ultimo_latido > now() - interval '20 seconds' then
    return true;
  end if;

  update public.sesiones
     set ultimo_latido = now(), latidos = latidos + 1
   where id = p_sesion;
  return true;
end
$fn$;

-- ── 3 · `registrar_evento` ─────────────────────────────────────────────────
-- La única puerta del cliente a `eventos`. false = no se anotó (sin sesión, tipo fuera de la
-- lista, `datos` que no es un objeto o pasa de 2 KB, o el tope de 30 filas por minuto) o la cuenta
-- aún no tiene perfil.
create or replace function public.registrar_evento(p_tipo text, p_datos jsonb default '{}'::jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid   uuid  := auth.uid();
  v_datos jsonb := coalesce(p_datos, '{}'::jsonb);
begin
  if v_uid is null then
    return false;
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    return false;
  end if;
  if p_tipo is null or p_tipo not in ('pvp_reconexion') then
    return false;
  end if;
  if jsonb_typeof(v_datos) <> 'object' or pg_catalog.pg_column_size(v_datos) > 2048 then
    return false;
  end if;
  if (select count(*) from public.eventos e
       where e.jugador_id = v_uid and e.creado_en > now() - interval '1 minute') >= 30 then
    return false;
  end if;

  insert into public.eventos (jugador_id, tipo, datos) values (v_uid, p_tipo, v_datos);
  return true;
end
$fn$;

-- ── 4 · `profiles.origen` y `origen_datos` ─────────────────────────────────
-- `origen`: directo · utm:<campaña> · invitacion · tienda · nulo = previo a MED-1a.
-- `origen_datos`: utm_source/medium/campaign/content, sala, zona_horaria, idioma, llegada.
alter table public.profiles
  add column origen       text  null,
  add column origen_datos jsonb null;

alter table public.profiles
  add constraint profiles_origen_chk
    check (origen ~ '^(directo|utm:[a-z0-9_-]{1,40}|invitacion|tienda)$'),
  add constraint profiles_origen_datos_chk
    check (pg_column_size(origen_datos) <= 2048);

-- ── 5 · El disparador `ingreso` sobre `constancia` ─────────────────────────
-- `marcar_ingreso` (`eco1d:168-232`) inserta la fila con `ultimo_dia` nulo y la actualiza
-- después; `constancia_admin` la mueve a días pasados para las pruebas. Por eso solo cuenta un
-- `ultimo_dia` que cambia y que es HOY en Chicago: una fila por cuenta y día, y la puesta a
-- punto de la racha desde el SQL Editor no fabrica ingresos. (La condición vive en la función:
-- el WHEN de un disparador INSERT OR UPDATE no admite `tg_op` ni `OLD`.)
create or replace function public.constancia_ingreso_evento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if tg_op = 'UPDATE' and old.ultimo_dia is not distinct from new.ultimo_dia then
    return null;
  end if;
  if new.ultimo_dia is distinct from public.dia_chicago(now()) then
    return null;
  end if;
  insert into public.eventos (jugador_id, tipo, datos)
  values (new.jugador_id, 'ingreso', jsonb_build_object('racha', new.racha));
  return null;
end
$fn$;

create trigger constancia_ingreso_trg
  after insert or update of ultimo_dia on public.constancia
  for each row execute function public.constancia_ingreso_evento();

-- ── 6 · `aplicar_efectos` con los `anuncio_*` ──────────────────────────────
-- Cada efecto lleva `asiento` y `mano`; los dos de vuelta, `ms` desde la apertura de la pausa
-- (reloj del árbitro) y el de vuelta, `como` ('tope' | 'mesa'). La cuenta sale del asiento:
-- si se borró, `uid` es nulo y la fila va con `jugador_id` nulo (no se pierde). Un anuncio mal
-- formado (asiento fuera de la mesa, sin `mano`, `ms` que falta o es negativo, `como` que no es
-- 'tope' ni 'mesa') NO es `estado_incoherente`: deja una fila `medicion_invalida` y la jugada
-- sigue. Los efectos de dinero y el `else` del tipo desconocido no cambian.
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
  v_datos   jsonb;
  v_n_asiento numeric;
  v_n_mano    numeric;
  v_n_ms      numeric;
  v_valido    boolean;
  v_crudo     text;
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

      -- MED-1a · la pausa de anuncio, medida. Sin dinero, y LA MEDICIÓN NUNCA TUMBA LA MESA: lo
      -- que no se entiende se anota como `medicion_invalida` y la jugada sigue. Los números se
      -- leen solo si son números JSON: un `::smallint` sobre "x" lanzaría, y el manejador de
      -- abajo lo convertiría en `estado_incoherente`.
      when 'anuncio_inicio', 'anuncio_omitido', 'anuncio_vuelto' then
        v_n_asiento := case when jsonb_typeof(v_e -> 'asiento') = 'number' then (v_e ->> 'asiento')::numeric end;
        v_n_mano    := case when jsonb_typeof(v_e -> 'mano')    = 'number' then (v_e ->> 'mano')::numeric end;
        v_n_ms      := case when jsonb_typeof(v_e -> 'ms')      = 'number' then (v_e ->> 'ms')::numeric end;
        v_valido := v_n_asiento is not null and v_n_asiento = trunc(v_n_asiento) and v_n_asiento between 0 and 4
                and v_n_mano is not null and v_n_mano = trunc(v_n_mano) and v_n_mano between 0 and 2147483647
                and (v_e ->> 'tipo' = 'anuncio_inicio'
                     or (v_n_ms is not null and v_n_ms = trunc(v_n_ms) and v_n_ms between 0 and 2147483647))
                and (v_e ->> 'tipo' <> 'anuncio_vuelto' or coalesce(v_e ->> 'como', '') in ('tope', 'mesa'));
        if v_valido then
          select a.* into v_asiento
            from public.partida_asientos a
           where a.sala_id = p_sala and a.asiento = v_n_asiento::smallint;
          v_valido := found;
        end if;

        if v_valido then
          v_datos := jsonb_build_object('sala', p_sala, 'mano', v_n_mano::integer, 'asiento', v_asiento.asiento);
          if v_e ->> 'tipo' <> 'anuncio_inicio' then
            v_datos := v_datos || jsonb_build_object('ms', v_n_ms::integer);
          end if;
          if v_e ->> 'tipo' = 'anuncio_vuelto' then
            v_datos := v_datos || jsonb_build_object('como', v_e ->> 'como');
          end if;
          insert into public.eventos (jugador_id, tipo, datos)
          values (v_asiento.uid, v_e ->> 'tipo', v_datos);
        else
          -- 1.500 caracteres, o 400 si son multibyte: `datos` no pasa de 2 KB (el check lanzaría).
          v_crudo := left(v_e::text, 1500);
          if octet_length(v_crudo) > 1800 then
            v_crudo := left(v_crudo, 400);
          end if;
          insert into public.eventos (jugador_id, tipo, datos)
          values (null, 'medicion_invalida', jsonb_build_object('sala', p_sala, 'efecto', v_crudo));
        end if;

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

-- ── 7 · Permisos ───────────────────────────────────────────────────────────
-- `create or replace` conserva los de `aplicar_efectos` (solo la base). Los disparadores no
-- son del cliente; las dos RPC, solo de `authenticated` (y de `service_role`, como las demás).
revoke execute on function public.eventos_inmutable()                 from public, anon, authenticated;
revoke execute on function public.constancia_ingreso_evento()         from public, anon, authenticated;
revoke execute on function public.latido_sesion(uuid)                 from public, anon;
revoke execute on function public.registrar_evento(text, jsonb)       from public, anon;
grant  execute on function public.latido_sesion(uuid)                 to authenticated, service_role;
grant  execute on function public.registrar_evento(text, jsonb)       to authenticated, service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en las migraciones anteriores. Se pega cada grupo ENTERO y sin los `-- `,
-- uno por pestaña. Cada uno acaba en una única consulta `comprobación | resultado | detalle`, y
-- cada fila debe decir PASA: 11 el Grupo A y 25 el Grupo B. Son las filas de
-- `supabase/pruebas/med1a_verificacion.sql`, que `npm run guiones` corre antes del push.
--
-- El Grupo B fabrica cinco cuentas, una sala de 3 y su partida, eventos, sesiones y dos cuentas
-- borradas, y lo deshace todo al final con la excepción `med1a_deshacer`: no deja rastro.
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- create or replace function pg_temp.med1a_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.med1a_verificar()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   A constant uuid := 'e1a00000-0000-4000-8000-00000000000a';
--   B constant uuid := 'e1a00000-0000-4000-8000-00000000000b';
--   C constant uuid := 'e1a00000-0000-4000-8000-00000000000c';
--   Z constant uuid := 'e1a00000-0000-4000-8000-0000000000ff';
--   W constant uuid := 'e1a00000-0000-4000-8000-0000000000ee';
--   CIEN constant bigint := 100000;
--   VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}},{"asiento":2,"vista":{}}]';
--   f    jsonb := '[]';
--   s    public.salas;
--   j    jsonb;
--   k    public.constancia_resultado;
--   hoy  date := public.dia_chicago(now());
--   ses  uuid := gen_random_uuid();
--   idv  bigint;
--   t1   text;
--   t2   text;
--   t3   text;
--   t4   text;
--   x    text;
--   n    integer;
--   n1   integer;
--   n2   integer;
--   sp   bigint;
--   sa   bigint;
--   sb   bigint;
--   nm   integer;
-- begin
--   begin
--     -- ═══ GRUPO A · definiciones y permisos ═══════════════════════════════
--     x := (select string_agg(attname || ':' || format_type(atttypid, atttypmod) || ':' || attnotnull || ':' || attidentity::text, ', ' order by attnum)
--             from pg_attribute where attrelid = 'public.eventos'::regclass and attnum > 0 and not attisdropped);
--     f := f || pg_temp.med1a_fila(1, 'A1 · eventos: id bigint identity, jugador_id uuid nulo, tipo text, creado_en timestamptz, datos jsonb; FK a profiles en cascada',
--               x = 'id:bigint:true:a, jugador_id:uuid:false:, tipo:text:true:, creado_en:timestamp with time zone:true:, datos:jsonb:true:'
--               and exists (select 1 from pg_constraint where conrelid = 'public.eventos'::regclass and contype = 'f'
--                              and confrelid = 'public.profiles'::regclass and confdeltype = 'c'),
--               x);
--
--     f := f || pg_temp.med1a_fila(2, 'A2 · eventos: tipo por formato, datos ≤ 2 KB; índices (tipo, creado_en) y (jugador_id, creado_en)',
--               (select count(*) from pg_constraint where conrelid = 'public.eventos'::regclass and contype = 'c'
--                   and conname in ('eventos_tipo_chk', 'eventos_datos_chk')) = 2
--               and exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'eventos' and indexdef like '%(tipo, creado_en)')
--               and exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'eventos' and indexdef like '%(jugador_id, creado_en)'),
--               (select string_agg(indexname, ', ' order by indexname) from pg_indexes where schemaname = 'public' and tablename = 'eventos'));
--
--     f := f || pg_temp.med1a_fila(3, 'A3 · eventos: RLS activo, cero políticas, ni anon ni authenticated con privilegio alguno',
--               (select relrowsecurity from pg_class where oid = 'public.eventos'::regclass)
--               and (select count(*) from pg_policy where polrelid = 'public.eventos'::regclass) = 0
--               and not has_table_privilege('authenticated', 'public.eventos', 'select, insert, update, delete, truncate, references, trigger')
--               and not has_table_privilege('anon', 'public.eventos', 'select, insert, update, delete, truncate, references, trigger'),
--               format('rls=%s · políticas=%s · authenticated=%s · anon=%s',
--                      (select relrowsecurity from pg_class where oid = 'public.eventos'::regclass),
--                      (select count(*) from pg_policy where polrelid = 'public.eventos'::regclass),
--                      has_table_privilege('authenticated', 'public.eventos', 'select, insert, update, delete, truncate, references, trigger'),
--                      has_table_privilege('anon', 'public.eventos', 'select, insert, update, delete, truncate, references, trigger')));
--
--     f := f || pg_temp.med1a_fila(4, 'A4 · eventos: solo inserción (update/delete por fila y truncate, con eventos_inmutable)',
--               (select pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.eventos'::regclass and tgname = 'eventos_inmutable_trg')
--                 like '%BEFORE DELETE OR UPDATE ON %eventos FOR EACH ROW EXECUTE FUNCTION %eventos_inmutable()'
--               and (select pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.eventos'::regclass and tgname = 'eventos_sin_truncate_trg')
--                 like '%BEFORE TRUNCATE ON %eventos FOR EACH STATEMENT EXECUTE FUNCTION %eventos_inmutable()',
--               (select string_agg(tgname, ', ' order by tgname) from pg_trigger where tgrelid = 'public.eventos'::regclass and not tgisinternal));
--
--     x := (select string_agg(attname || ':' || format_type(atttypid, atttypmod) || ':' || attnotnull, ', ' order by attnum)
--             from pg_attribute where attrelid = 'public.sesiones'::regclass and attnum > 0 and not attisdropped);
--     f := f || pg_temp.med1a_fila(5, 'A5 · sesiones: columnas, FK a profiles en cascada, índice (jugador_id, inicio), RLS sin políticas ni privilegios del cliente',
--               x = 'id:uuid:true, jugador_id:uuid:true, inicio:timestamp with time zone:true, ultimo_latido:timestamp with time zone:true, latidos:integer:true'
--               and exists (select 1 from pg_constraint where conrelid = 'public.sesiones'::regclass and contype = 'f'
--                              and confrelid = 'public.profiles'::regclass and confdeltype = 'c')
--               and exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'sesiones' and indexdef like '%(jugador_id, inicio)')
--               and (select relrowsecurity from pg_class where oid = 'public.sesiones'::regclass)
--               and (select count(*) from pg_policy where polrelid = 'public.sesiones'::regclass) = 0
--               and not has_table_privilege('authenticated', 'public.sesiones', 'select, insert, update, delete, truncate, references, trigger')
--               and not has_table_privilege('anon', 'public.sesiones', 'select, insert, update, delete, truncate, references, trigger'),
--               x);
--
--     f := f || pg_temp.med1a_fila(6, 'A6 · latido_sesion(uuid) → boolean: una firma, definer, search_path vacío; authenticated sí, anon no',
--               (select count(*) from pg_proc where proname = 'latido_sesion' and pronamespace = 'public'::regnamespace) = 1
--               and (select prosecdef and 'search_path=""' = any (proconfig) and prorettype = 'boolean'::regtype
--                      from pg_proc where oid = 'public.latido_sesion(uuid)'::regprocedure)
--               and has_function_privilege('authenticated', 'public.latido_sesion(uuid)', 'execute')
--               and not has_function_privilege('anon', 'public.latido_sesion(uuid)', 'execute'),
--               format('versiones=%s · authenticated=%s · anon=%s',
--                      (select count(*) from pg_proc where proname = 'latido_sesion' and pronamespace = 'public'::regnamespace),
--                      has_function_privilege('authenticated', 'public.latido_sesion(uuid)', 'execute'),
--                      has_function_privilege('anon', 'public.latido_sesion(uuid)', 'execute')));
--
--     f := f || pg_temp.med1a_fila(7, 'A7 · registrar_evento(text, jsonb) → boolean: una firma, definer, search_path vacío; authenticated sí, anon no',
--               (select count(*) from pg_proc where proname = 'registrar_evento' and pronamespace = 'public'::regnamespace) = 1
--               and (select prosecdef and 'search_path=""' = any (proconfig) and prorettype = 'boolean'::regtype
--                      from pg_proc where oid = 'public.registrar_evento(text, jsonb)'::regprocedure)
--               and has_function_privilege('authenticated', 'public.registrar_evento(text, jsonb)', 'execute')
--               and not has_function_privilege('anon', 'public.registrar_evento(text, jsonb)', 'execute'),
--               format('versiones=%s · authenticated=%s · anon=%s',
--                      (select count(*) from pg_proc where proname = 'registrar_evento' and pronamespace = 'public'::regnamespace),
--                      has_function_privilege('authenticated', 'public.registrar_evento(text, jsonb)', 'execute'),
--                      has_function_privilege('anon', 'public.registrar_evento(text, jsonb)', 'execute')));
--
--     x := (select string_agg(attname || ':' || format_type(atttypid, atttypmod) || ':' || attnotnull, ', ' order by attnum)
--             from pg_attribute where attrelid = 'public.profiles'::regclass and attname in ('origen', 'origen_datos'));
--     f := f || pg_temp.med1a_fila(8, 'A8 · profiles.origen text y origen_datos jsonb, nulas, con su formato y su tope',
--               x = 'origen:text:false, origen_datos:jsonb:false'
--               and (select count(*) from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'c'
--                       and conname in ('profiles_origen_chk', 'profiles_origen_datos_chk')) = 2,
--               x);
--
--     f := f || pg_temp.med1a_fila(9, 'A9 · profiles: authenticated las escribe al dar de alta, no las cambia ni las lee (INV-83); anon nada',
--               has_column_privilege('authenticated', 'public.profiles', 'origen', 'INSERT')
--               and has_column_privilege('authenticated', 'public.profiles', 'origen_datos', 'INSERT')
--               and not has_column_privilege('authenticated', 'public.profiles', 'origen', 'UPDATE')
--               and not has_column_privilege('authenticated', 'public.profiles', 'origen_datos', 'UPDATE')
--               and not has_column_privilege('authenticated', 'public.profiles', 'origen', 'SELECT')
--               and not has_column_privilege('authenticated', 'public.profiles', 'origen_datos', 'SELECT')
--               and not has_column_privilege('anon', 'public.profiles', 'origen', 'SELECT')
--               and not has_column_privilege('anon', 'public.profiles', 'origen_datos', 'SELECT'),
--               format('insert=%s/%s · update=%s/%s · select=%s/%s · anon select=%s/%s',
--                      has_column_privilege('authenticated', 'public.profiles', 'origen', 'INSERT'),
--                      has_column_privilege('authenticated', 'public.profiles', 'origen_datos', 'INSERT'),
--                      has_column_privilege('authenticated', 'public.profiles', 'origen', 'UPDATE'),
--                      has_column_privilege('authenticated', 'public.profiles', 'origen_datos', 'UPDATE'),
--                      has_column_privilege('authenticated', 'public.profiles', 'origen', 'SELECT'),
--                      has_column_privilege('authenticated', 'public.profiles', 'origen_datos', 'SELECT'),
--                      has_column_privilege('anon', 'public.profiles', 'origen', 'SELECT'),
--                      has_column_privilege('anon', 'public.profiles', 'origen_datos', 'SELECT')));
--
--     f := f || pg_temp.med1a_fila(10, 'A10 · constancia: disparador ingreso AFTER INSERT OR UPDATE OF ultimo_dia por fila; funciones de disparador definer y fuera del cliente',
--               (select pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.constancia'::regclass and tgname = 'constancia_ingreso_trg')
--                 like '%AFTER INSERT OR UPDATE OF ultimo_dia ON %constancia FOR EACH ROW EXECUTE FUNCTION %constancia_ingreso_evento()'
--               and (select prosecdef and 'search_path=""' = any (proconfig) from pg_proc where oid = 'public.constancia_ingreso_evento()'::regprocedure)
--               and not has_function_privilege('authenticated', 'public.constancia_ingreso_evento()', 'execute')
--               and not has_function_privilege('authenticated', 'public.eventos_inmutable()', 'execute')
--               and not has_function_privilege('anon', 'public.constancia_ingreso_evento()', 'execute'),
--               (select pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.constancia'::regclass and tgname = 'constancia_ingreso_trg'));
--
--     f := f || pg_temp.med1a_fila(11, 'A11 · aplicar_efectos: una sola versión, con los tres anuncio_* y medicion_invalida, y lo de antes (manos, puntos, recarga); fuera del cliente',
--               (select count(*) from pg_proc where proname = 'aplicar_efectos' and pronamespace = 'public'::regnamespace) = 1
--               and (select prosrc like '%''anuncio_inicio'', ''anuncio_omitido'', ''anuncio_vuelto''%' and prosrc like '%insert into public.eventos%' and prosrc like '%medicion_invalida%'
--                           and prosrc like '%manos = a.manos + 1%' and prosrc like '%anotar_puntos_humanos%' and prosrc like '%recarga_pvp%'
--                           and prosrc like '%else%raise exception ''estado_incoherente''%'
--                      from pg_proc where oid = 'public.aplicar_efectos(uuid, jsonb, boolean)'::regprocedure)
--               and not has_function_privilege('authenticated', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute')
--               and not has_function_privilege('anon', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute'),
--               format('versiones=%s · authenticated=%s',
--                      (select count(*) from pg_proc where proname = 'aplicar_efectos' and pronamespace = 'public'::regnamespace),
--                      has_function_privilege('authenticated', 'public.aplicar_efectos(uuid, jsonb, boolean)', 'execute')));
--
--     raise exception 'med1a_deshacer';
--   exception when others then
--     if sqlerrm <> 'med1a_deshacer' then
--       f := f || pg_temp.med1a_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   perform set_config('request.jwt.claims', '', true);
--   return query
--     select (x2 ->> 'o')::integer, x2 ->> 'c', x2 ->> 'r', x2 ->> 'd'
--       from jsonb_array_elements(f) x2;
-- end
-- $fn$;
--
-- select prueba as "comprobación", resultado, detalle
--   from pg_temp.med1a_verificar()
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.med1a_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- -- Una sentencia como el cliente (`authenticated`, con la sesión de `p_uid` o sin ninguna):
-- -- su primera columna como texto, o `ERROR·<sqlstate>`.
-- create or replace function pg_temp.med1a_como(p_uid uuid, p_sql text)
-- returns text
-- language plpgsql
-- as $fn$
-- declare
--   v text;
-- begin
--   perform set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
--   set local role authenticated;
--   execute p_sql into v;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return coalesce(v, '(nulo)');
-- exception when others then
--   return 'ERROR·' || sqlstate;
-- end
-- $fn$;
--
-- create or replace function pg_temp.med1a_verificar()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   A constant uuid := 'e1a00000-0000-4000-8000-00000000000a';
--   B constant uuid := 'e1a00000-0000-4000-8000-00000000000b';
--   C constant uuid := 'e1a00000-0000-4000-8000-00000000000c';
--   Z constant uuid := 'e1a00000-0000-4000-8000-0000000000ff';
--   W constant uuid := 'e1a00000-0000-4000-8000-0000000000ee';
--   CIEN constant bigint := 100000;
--   VISTAS constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}},{"asiento":2,"vista":{}}]';
--   f    jsonb := '[]';
--   s    public.salas;
--   j    jsonb;
--   k    public.constancia_resultado;
--   hoy  date := public.dia_chicago(now());
--   ses  uuid := gen_random_uuid();
--   idv  bigint;
--   t1   text;
--   t2   text;
--   t3   text;
--   t4   text;
--   x    text;
--   n    integer;
--   n1   integer;
--   n2   integer;
--   sp   bigint;
--   sa   bigint;
--   sb   bigint;
--   nm   integer;
-- begin
--   begin
--     -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'med1a.verif.' || u.n || '@example.invalid', '', now(), now(), '{}', '{}'
--       from (values (A, 'a'), (B, 'b'), (C, 'c'), (Z, 'z'), (W, 'w')) as u(id, n);
--     insert into public.profiles (id, username)
--     values (A, 'med1a_a_verif'), (B, 'med1a_b_verif'), (C, 'med1a_c_verif'), (Z, 'med1a_z_verif');
--     perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'MED-1a · verificación') from unnest(array[A, B, C, Z]) u;
--     delete from public.intentos_dinero where jugador_id in (A, B, C, Z);
--
--     -- ── B1 · solo inserción: update, delete y truncate a mano fallan ─────
--     insert into public.eventos (jugador_id, tipo, datos) values (Z, 'prueba_med1a', '{"x":1}') returning id into idv;
--     begin update public.eventos set datos = '{}' where id = idv; t1 := 'sin error';
--     exception when others then t1 := sqlerrm; end;
--     begin delete from public.eventos where id = idv; t2 := 'sin error';
--     exception when others then t2 := sqlerrm; end;
--     begin truncate public.eventos; t3 := 'sin error';
--     exception when others then t3 := sqlerrm; end;
--     f := f || pg_temp.med1a_fila(101, 'B1 · un update, un delete y un truncate de eventos fallan con eventos_inmutable; la fila sigue igual',
--               t1 = 'eventos_inmutable' and t2 = 'eventos_inmutable' and t3 = 'eventos_inmutable'
--               and (select datos from public.eventos where id = idv) = '{"x":1}'::jsonb,
--               format('update → %s · delete → %s · truncate → %s', t1, t2, t3));
--
--     -- ── B2 · el formato de tipo y el tope de datos ───────────────────────
--     begin insert into public.eventos (tipo) values ('Tipo-Malo'); t1 := 'sin error';
--     exception when others then t1 := sqlstate; end;
--     begin insert into public.eventos (tipo) values ('ab'); t2 := 'sin error';
--     exception when others then t2 := sqlstate; end;
--     begin
--       insert into public.eventos (tipo, datos)
--       values ('prueba_med1a', jsonb_build_object('relleno', (select string_agg(md5(i::text), '') from generate_series(1, 100) i)));
--       t3 := 'sin error';
--     exception when others then t3 := sqlstate; end;
--     f := f || pg_temp.med1a_fila(102, 'B2 · tipo fuera de formato (mayúsculas, guion, 2 letras) y datos de más de 2 KB: rechazados por el check',
--               t1 = '23514' and t2 = '23514' and t3 = '23514',
--               format('Tipo-Malo → %s · ab → %s · 3,2 KB → %s', t1, t2, t3));
--
--     -- ── B3 · el cliente no toca las tablas a mano ────────────────────────
--     t1 := pg_temp.med1a_como(A, 'insert into public.eventos (tipo) values (''pvp_reconexion'') returning ''ok''');
--     t2 := pg_temp.med1a_como(A, 'select count(*)::text from public.eventos');
--     t3 := pg_temp.med1a_como(A, format('insert into public.sesiones (id, jugador_id) values (%L, %L) returning ''ok''', gen_random_uuid(), A));
--     t4 := pg_temp.med1a_como(A, 'select count(*)::text from public.sesiones');
--     f := f || pg_temp.med1a_fila(103, 'B3 · authenticated no inserta ni lee eventos ni sesiones a mano',
--               t1 = 'ERROR·42501' and t2 = 'ERROR·42501' and t3 = 'ERROR·42501' and t4 = 'ERROR·42501',
--               format('eventos insert → %s · select → %s · sesiones insert → %s · select → %s', t1, t2, t3, t4));
--
--     -- ── B4…B8 · latido_sesion en sus cinco ramas ─────────────────────────
--     t1 := pg_temp.med1a_como(A, format('select public.latido_sesion(%L)::text', ses));
--     f := f || pg_temp.med1a_fila(104, 'B4 · latido: una sesión nueva se crea con su cuenta y latidos = 1',
--               t1 = 'true' and (select count(*) from public.sesiones where id = ses and jugador_id = A and latidos = 1) = 1,
--               format('→ %s · filas=%s', t1, (select count(*) from public.sesiones where id = ses)));
--
--     t1 := pg_temp.med1a_como(A, format('select public.latido_sesion(%L)::text', ses));
--     f := f || pg_temp.med1a_fila(105, 'B5 · latido a menos de 20 s: true y no toca la fila',
--               t1 = 'true' and (select latidos from public.sesiones where id = ses) = 1,
--               format('→ %s · latidos=%s', t1, (select latidos from public.sesiones where id = ses)));
--
--     update public.sesiones set inicio = now() - interval '5 minutes', ultimo_latido = now() - interval '61 seconds' where id = ses;
--     t1 := pg_temp.med1a_como(A, format('select public.latido_sesion(%L)::text', ses));
--     f := f || pg_temp.med1a_fila(106, 'B6 · latido a los 61 s: true, latidos = 2 y ultimo_latido = ahora (duración 5 min)',
--               t1 = 'true' and (select latidos = 2 and ultimo_latido = now() and ultimo_latido - inicio = interval '5 minutes'
--                                  from public.sesiones where id = ses),
--               format('→ %s · latidos=%s · duración=%s', t1, (select latidos from public.sesiones where id = ses),
--                      (select ultimo_latido - inicio from public.sesiones where id = ses)));
--
--     update public.sesiones set ultimo_latido = now() - interval '61 seconds' where id = ses;
--     t1 := pg_temp.med1a_como(B, format('select public.latido_sesion(%L)::text', ses));
--     t2 := pg_temp.med1a_como(null, format('select public.latido_sesion(%L)::text', ses));
--     f := f || pg_temp.med1a_fila(107, 'B7 · latido de una sesión ajena, o sin sesión: false y la fila no cambia',
--               t1 = 'false' and t2 = 'false'
--               and (select jugador_id = A and latidos = 2 and ultimo_latido = now() - interval '61 seconds' from public.sesiones where id = ses),
--               format('ajena → %s · sin sesión → %s · latidos=%s', t1, t2, (select latidos from public.sesiones where id = ses)));
--
--     update public.sesiones set ultimo_latido = now() - interval '11 minutes' where id = ses;
--     t1 := pg_temp.med1a_como(A, format('select public.latido_sesion(%L)::text', ses));
--     f := f || pg_temp.med1a_fila(108, 'B8 · latido tras más de 10 min sin latir: false (sesión cerrada) y la fila no cambia',
--               t1 = 'false' and (select latidos = 2 and ultimo_latido = now() - interval '11 minutes' from public.sesiones where id = ses),
--               format('→ %s · latidos=%s', t1, (select latidos from public.sesiones where id = ses)));
--
--     -- ── B9…B11 · registrar_evento ────────────────────────────────────────
--     t1 := pg_temp.med1a_como(A, 'select public.registrar_evento(''pvp_reconexion'', ''{"via":"arranque"}'')::text');
--     f := f || pg_temp.med1a_fila(109, 'B9 · registrar_evento(pvp_reconexion): true, una fila con la cuenta de quien llama y sus datos',
--               t1 = 'true' and (select count(*) from public.eventos
--                                  where jugador_id = A and tipo = 'pvp_reconexion' and datos = '{"via":"arranque"}'::jsonb) = 1,
--               format('→ %s · filas=%s', t1, (select count(*) from public.eventos where jugador_id = A)));
--
--     t1 := pg_temp.med1a_como(B, 'select public.registrar_evento(''anuncio_omitido'', ''{"asiento":0,"mano":7,"ms":1}'')::text');
--     t2 := pg_temp.med1a_como(B, 'select public.registrar_evento(''ingreso'')::text');
--     t3 := pg_temp.med1a_como(B, 'select public.registrar_evento(''pvp_reconexion'', ''[1]'')::text');
--     t4 := pg_temp.med1a_como(null, 'select public.registrar_evento(''pvp_reconexion'')::text');
--     f := f || pg_temp.med1a_fila(110, 'B10 · fuera de la lista (anuncio_omitido, ingreso), datos que no son objeto, o sin sesión: false y sin filas',
--               t1 = 'false' and t2 = 'false' and t3 = 'false' and t4 = 'false'
--               and (select count(*) from public.eventos where jugador_id = B) = 0,
--               format('anuncio_omitido → %s · ingreso → %s · [1] → %s · sin sesión → %s · filas de B=%s', t1, t2, t3, t4,
--                      (select count(*) from public.eventos where jugador_id = B)));
--
--     n := 0;
--     for i in 2..30 loop
--       if pg_temp.med1a_como(A, 'select public.registrar_evento(''pvp_reconexion'', ''{"via":"canal"}'')::text') = 'true' then n := n + 1; end if;
--     end loop;
--     t1 := pg_temp.med1a_como(A, 'select public.registrar_evento(''pvp_reconexion'', ''{"via":"canal"}'')::text');
--     f := f || pg_temp.med1a_fila(111, 'B11 · tope: las 30 primeras del minuto entran y la 31.ª devuelve false',
--               n = 29 and t1 = 'false' and (select count(*) from public.eventos where jugador_id = A) = 30,
--               format('aceptadas tras la 1.ª=%s · 31.ª → %s · filas de A=%s', n, t1, (select count(*) from public.eventos where jugador_id = A)));
--
--     -- ── B12…B13 · el disparador `ingreso` ────────────────────────────────
--     perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
--     k := public.marcar_ingreso();
--     k := public.marcar_ingreso();
--     f := f || pg_temp.med1a_fila(112, 'B12 · el primer ingreso del día deja una fila ingreso {racha: 1}; el segundo del mismo día, ninguna',
--               k.codigo = 'ya_marcado'
--               and (select count(*) from public.eventos where jugador_id = C and tipo = 'ingreso') = 1
--               and (select datos from public.eventos where jugador_id = C and tipo = 'ingreso') = '{"racha":1}'::jsonb,
--               format('2.º → %s · filas=%s', k.codigo, (select count(*) from public.eventos where jugador_id = C and tipo = 'ingreso')));
--
--     perform public.constancia_admin('med1a_c_verif', 1, hoy - 1);
--     n1 := (select count(*) from public.eventos where jugador_id = C and tipo = 'ingreso');
--     k := public.marcar_ingreso();
--     perform public.constancia_admin('med1a_c_verif', 0, null);
--     perform public.constancia_admin('med1a_c_verif', 4, hoy - 3);
--     perform set_config('request.jwt.claims', '', true);
--     select count(*), string_agg(datos ->> 'racha', ',' order by id) into n, t1
--       from public.eventos where jugador_id = C and tipo = 'ingreso';
--     f := f || pg_temp.med1a_fila(113, 'B13 · otro día (ayer → hoy) deja la segunda fila {racha: 2}; poner la racha en días pasados con constancia_admin no fabrica ninguna',
--               n1 = 1 and k.codigo = 'ok' and k.racha = 2 and n = 2 and t1 = '1,2',
--               format('tras admin a ayer=%s · ingreso → %s racha %s · filas=%s · rachas=%s', n1, k.codigo, k.racha, n, t1));
--
--     -- ── B14…B19 · aplicar_efectos con los anuncio_* ──────────────────────
--     -- La mesa de 3, por el camino de siempre (el de `mespvp8`). Mano 1: C sale con 1.000.
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
--     j := public.guardar_jugada(s.id, 0, '{"version":1,"motor":{"handCount":1}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":3,"ajilei":51,"pilas":[2500,1000,1000]},{"tipo":"salida","asiento":2,"monto":1000}]'::jsonb);
--     -- El asiento 2 ya cobró y su cuenta se borra: la FK pone `uid` nulo y sus movimientos se van
--     -- en cascada (`neto_mesa` lo compensa con el asiento sin cuenta). Su anuncio_vuelto, en B16.
--     delete from auth.users where id = C;
--     select sum(pila + liberado) into sp from public.partida_asientos where sala_id = s.id;
--     sa := public.saldo_de(A);
--     sb := public.saldo_de(B);
--     nm := (select count(*) from public.movimientos where ref_tipo = 'sala' and ref_id = s.id::text);
--
--     j := public.guardar_jugada(s.id, 1, '{"version":2,"motor":{"handCount":7}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"anuncio_inicio","asiento":0,"mano":7},{"tipo":"anuncio_inicio","asiento":1,"mano":7}]'::jsonb);
--     select count(*) into n from public.eventos
--      where tipo = 'anuncio_inicio' and datos ->> 'sala' = s.id::text
--        and ((jugador_id = A and datos = jsonb_build_object('sala', s.id, 'mano', 7, 'asiento', 0))
--          or (jugador_id = B and datos = jsonb_build_object('sala', s.id, 'mano', 7, 'asiento', 1)));
--     f := f || pg_temp.med1a_fila(114, 'B14 · anuncio_inicio de los asientos 0 y 1 (mano 7): una fila por asiento con su cuenta y {sala, mano, asiento}',
--               j ->> 'ok' = 'true' and n = 2
--               and (select count(*) from public.eventos where tipo like 'anuncio_%' and datos ->> 'sala' = s.id::text) = 2,
--               format('%s · filas buenas=%s', j, n));
--
--     j := public.guardar_jugada(s.id, 2, '{"version":3,"motor":{"handCount":7}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"anuncio_omitido","asiento":0,"mano":7,"ms":5012}]'::jsonb);
--     select count(*) into n from public.eventos
--      where tipo = 'anuncio_omitido' and jugador_id = A
--        and datos = jsonb_build_object('sala', s.id, 'mano', 7, 'asiento', 0, 'ms', 5012);
--     f := f || pg_temp.med1a_fila(115, 'B15 · anuncio_omitido del asiento 0 a los 5.012 ms: una fila con ms',
--               j ->> 'ok' = 'true' and n = 1, format('%s · filas=%s', j, n));
--
--     j := public.guardar_jugada(s.id, 3, '{"version":4,"motor":{"handCount":7}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"anuncio_vuelto","asiento":1,"mano":7,"ms":30000,"como":"tope"},{"tipo":"anuncio_vuelto","asiento":2,"mano":7,"ms":12000,"como":"mesa"}]'::jsonb);
--     select count(*) into n from public.eventos
--      where tipo = 'anuncio_vuelto'
--        and ((jugador_id = B and datos = jsonb_build_object('sala', s.id, 'mano', 7, 'asiento', 1, 'ms', 30000, 'como', 'tope'))
--          or (jugador_id is null and datos = jsonb_build_object('sala', s.id, 'mano', 7, 'asiento', 2, 'ms', 12000, 'como', 'mesa')));
--     f := f || pg_temp.med1a_fila(116, 'B16 · anuncio_vuelto por el tope (asiento 1) y por la mesa (asiento 2, cuenta borrada → jugador_id nulo)',
--               j ->> 'ok' = 'true' and n = 2, format('%s · filas=%s', j, n));
--
--     f := f || pg_temp.med1a_fila(117, 'B17 · los anuncio_* no mueven dinero: pilas, saldos de A y B y movimientos de la sala de A y B iguales; la mesa cuadra',
--               (select sum(pila + liberado) from public.partida_asientos where sala_id = s.id) = sp
--               and public.saldo_de(A) = sa and public.saldo_de(B) = sb
--               and (select count(*) from public.movimientos where ref_tipo = 'sala' and ref_id = s.id::text) = nm
--               and public.mesa_cuadra(s.id),
--               format('pilas %s → %s · movimientos %s → %s · cuadra=%s', sp,
--                      (select sum(pila + liberado) from public.partida_asientos where sala_id = s.id), nm,
--                      (select count(*) from public.movimientos where ref_tipo = 'sala' and ref_id = s.id::text), public.mesa_cuadra(s.id)));
--
--     n1 := (select count(*) from public.eventos where tipo like 'anuncio_%' and datos ->> 'sala' = s.id::text);
--     begin
--       j := public.guardar_jugada(s.id, 4, '{"version":5,"motor":{"handCount":7}}'::jsonb, null, VISTAS, false,
--              '[{"tipo":"anuncio_visto","asiento":0,"mano":7,"ms":30000}]'::jsonb);
--       t1 := 'sin error';
--     exception when others then t1 := sqlerrm; end;
--     f := f || pg_temp.med1a_fila(118, 'B18 · un efecto desconocido sigue fallando con estado_incoherente y la jugada no se guarda',
--               t1 = 'estado_incoherente' and (select version from public.partidas where sala_id = s.id) = 4
--               and (select count(*) from public.eventos where tipo like 'anuncio_%' and datos ->> 'sala' = s.id::text) = n1,
--               format('→ %s · versión=%s', t1, (select version from public.partidas where sala_id = s.id)));
--
--     -- La regla de MED-1a: la medición nunca tumba la mesa. Una jugada con un anuncio bueno y
--     -- siete malos se aplica entera: el bueno deja su fila y cada malo una `medicion_invalida`.
--     begin
--       j := public.guardar_jugada(s.id, 4, '{"version":5,"motor":{"handCount":8}}'::jsonb, null, VISTAS, false,
--              '[{"tipo":"anuncio_inicio","asiento":0,"mano":8},
--                {"tipo":"anuncio_inicio","asiento":4,"mano":8},
--                {"tipo":"anuncio_vuelto","asiento":0,"mano":8,"ms":30000,"como":"visto"},
--                {"tipo":"anuncio_omitido","asiento":0,"mano":8},
--                {"tipo":"anuncio_inicio","asiento":0},
--                {"tipo":"anuncio_omitido","asiento":1,"mano":8,"ms":-5},
--                {"tipo":"anuncio_inicio","asiento":"x","mano":8}]'::jsonb
--              || jsonb_build_array(jsonb_build_object('tipo', 'anuncio_vuelto', 'asiento', 1, 'mano', 8, 'ms', 1, 'como', repeat('ñ', 1400))));
--       t1 := j ->> 'ok';
--     exception when others then t1 := sqlerrm; end;
--     select count(*), max(length(datos ->> 'efecto')) filter (where datos ->> 'efecto' like '%ññ%'),
--            count(*) filter (where datos ->> 'efecto' like '%"asiento": "x"%')
--       into n, n2, nm
--       from public.eventos
--      where tipo = 'medicion_invalida' and jugador_id is null and datos ->> 'sala' = s.id::text;
--     f := f || pg_temp.med1a_fila(119, 'B19 · siete anuncios mal formados (asiento 4 o "x", como visto, sin ms, ms -5, sin mano, como de 1.400 ñ) no tumban la jugada: siete medicion_invalida, el bueno anotado, la mesa cuadra',
--               t1 = 'true' and n = 7 and n2 = 400 and nm = 1
--               and (select version from public.partidas where sala_id = s.id) = 5
--               and (select count(*) from public.eventos where tipo like 'anuncio_%' and datos ->> 'sala' = s.id::text) = n1 + 1
--               and public.mesa_cuadra(s.id),
--               format('→ %s · medicion_invalida=%s · efecto ñ recortado a %s · "x"=%s · versión=%s · anuncios %s → %s · cuadra=%s',
--                      t1, n, n2, nm, (select version from public.partidas where sala_id = s.id), n1,
--                      (select count(*) from public.eventos where tipo like 'anuncio_%' and datos ->> 'sala' = s.id::text),
--                      public.mesa_cuadra(s.id)));
--
--     -- ── B20 · la cascada al borrar la cuenta ─────────────────────────────
--     t1 := pg_temp.med1a_como(Z, format('select public.latido_sesion(%L)::text', gen_random_uuid()));
--     n1 := (select count(*) from public.eventos where jugador_id = Z) + (select count(*) from public.sesiones where jugador_id = Z);
--     delete from auth.users where id = Z;
--     n2 := (select count(*) from public.eventos where jugador_id = Z) + (select count(*) from public.sesiones where jugador_id = Z);
--     f := f || pg_temp.med1a_fila(120, 'B20 · borrar la cuenta (auth.users → profiles) borra en cascada sus eventos y sus sesiones',
--               t1 = 'true' and n1 = 2 and n2 = 0 and not exists (select 1 from public.profiles where id = Z),
--               format('latido → %s · filas antes=%s · después=%s', t1, n1, n2));
--
--     -- ── B21…B23 · `origen` ───────────────────────────────────────────────
--     begin update public.profiles set origen = 'Facebook' where id = A; t1 := 'sin error';
--     exception when others then t1 := sqlstate; end;
--     begin update public.profiles set origen = 'utm:' where id = A; t2 := 'sin error';
--     exception when others then t2 := sqlstate; end;
--     begin update public.profiles set origen = 'utm:Verano' where id = A; t3 := 'sin error';
--     exception when others then t3 := sqlstate; end;
--     begin
--       update public.profiles
--          set origen_datos = jsonb_build_object('relleno', (select string_agg(md5(i::text), '') from generate_series(1, 100) i))
--        where id = A;
--       t4 := 'sin error';
--     exception when others then t4 := sqlstate; end;
--     f := f || pg_temp.med1a_fila(121, 'B21 · origen fuera de formato (Facebook, utm: vacío, utm:Verano) y origen_datos de más de 2 KB: rechazados por el check',
--               t1 = '23514' and t2 = '23514' and t3 = '23514' and t4 = '23514',
--               format('Facebook → %s · utm: → %s · utm:Verano → %s · 3,2 KB → %s', t1, t2, t3, t4));
--
--     n := 0;
--     foreach x in array array['directo', 'utm:verano_26-b', 'invitacion', 'tienda'] loop
--       update public.profiles set origen = x where id = A;
--       n := n + 1;
--     end loop;
--     update public.profiles set origen = null where id = A;
--     f := f || pg_temp.med1a_fila(122, 'B22 · los cuatro valores de la lista entran (directo, utm:<campaña>, invitacion, tienda) y nulo también',
--               n = 4 and (select origen from public.profiles where id = A) is null,
--               format('aceptados=%s', n));
--
--     -- ── B24…B25 · sin perfil todavía: W verificó el código y aún no se bautizó (corre antes de B23)
--     t1 := pg_temp.med1a_como(W, format('select public.latido_sesion(%L)::text', gen_random_uuid()));
--     f := f || pg_temp.med1a_fila(124, 'B24 · latido_sesion de una cuenta sin perfil: false, sin error y sin fila',
--               t1 = 'false' and (select count(*) from public.sesiones where jugador_id = W) = 0,
--               format('→ %s', t1));
--
--     t1 := pg_temp.med1a_como(W, 'select public.registrar_evento(''pvp_reconexion'', ''{"via":"arranque"}'')::text');
--     f := f || pg_temp.med1a_fila(125, 'B25 · registrar_evento de una cuenta sin perfil: false, sin error y sin fila',
--               t1 = 'false' and (select count(*) from public.eventos where jugador_id = W) = 0,
--               format('→ %s', t1));
--
--     t1 := pg_temp.med1a_como(W, format(
--             'insert into public.profiles (id, username, origen, origen_datos) values (%L, ''med1a_w_verif'', ''utm:prueba_med1a'', ''{"zona_horaria":"America/Caracas","idioma":"es-VE"}'') returning ''ok''', W));
--     t2 := pg_temp.med1a_como(W, format('update public.profiles set origen = ''directo'' where id = %L returning ''ok''', W));
--     t3 := pg_temp.med1a_como(W, format('update public.profiles set origen_datos = ''{}'' where id = %L returning ''ok''', W));
--     t4 := pg_temp.med1a_como(W, format('select origen from public.profiles where id = %L', W));
--     f := f || pg_temp.med1a_fila(123, 'B23 · el cliente escribe origen y origen_datos al bautizarse; después no los cambia ni los lee',
--               t1 = 'ok' and t2 = 'ERROR·42501' and t3 = 'ERROR·42501' and t4 = 'ERROR·42501'
--               and (select origen = 'utm:prueba_med1a' and origen_datos ->> 'zona_horaria' = 'America/Caracas' from public.profiles where id = W),
--               format('alta → %s · cambiar origen → %s · cambiar origen_datos → %s · leer → %s', t1, t2, t3, t4));
--
--     raise exception 'med1a_deshacer';
--   exception when others then
--     if sqlerrm <> 'med1a_deshacer' then
--       f := f || pg_temp.med1a_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   perform set_config('request.jwt.claims', '', true);
--   return query
--     select (x2 ->> 'o')::integer, x2 ->> 'c', x2 ->> 'r', x2 ->> 'd'
--       from jsonb_array_elements(f) x2;
-- end
-- $fn$;
--
-- select prueba as "comprobación", resultado, detalle
--   from pg_temp.med1a_verificar()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
