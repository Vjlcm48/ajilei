-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · MOT-1 · Fase 1d-i — El esquema: dónde vive el árbitro
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MOT-1_Fase1d-i_v1.0.md. Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md
-- (§1, §5, §9). Informe: docs/reportes/AJILEI_MOT-1_Fase1d-i_Informe_v1.0.md.
--
-- Se aplica con `npx supabase db push`, en la transacción implícita de la CLI.
--
-- ── AQUÍ NO SE MUEVE DINERO ────────────────────────────────────────────────
-- Saldo ≥ entrada, garantía, liberación, pilas por mano, partida muerta, una
-- partida por cuenta, libro de puntos y topes son de la 1d-ii. No se toca
-- `aplicar_movimiento`, el libro, `sentarse_ia` ni `cerrar_partida_abierta`. La
-- regla 5× de `crear_sala` y `unirse_sala` sigue como está.
--
-- ── EL CLIENTE DE HOY NO SE ENTERA ─────────────────────────────────────────
-- Llama a `crear_sala` con tres parámetros y crea mesas cortas de ritmo normal
-- sin saberlo. Nadie crea partidas hasta la 1e: `barrer_salas` y `mi_sala` hacen
-- lo mismo que hoy mientras `partidas` esté vacía.
--
-- ── EL VALOR NUEVO DEL ENUM ────────────────────────────────────────────────
-- Un valor añadido no se puede USAR en la transacción que lo crea. Aquí solo lo
-- nombra el cuerpo de `guardar_jugada`, que es `plpgsql`: se guarda como texto y
-- el literal se resuelve al ejecutarse, nunca durante esta migración. Ninguna
-- función `language sql`, índice, `check` ni `default` de este archivo lo nombra.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · La mesa ────────────────────────────────────────────────────────────
alter type public.sala_estado add value if not exists 'terminada';

-- Sin `if exists`: si el nombre no fuera éste, la migración cae entera en vez de
-- dejar el `check` viejo en pie y la mesa de 50 rechazada.
alter table public.salas drop constraint salas_apuesta_check;
alter table public.salas add constraint salas_apuesta_check
  check (apuesta in (50, 100, 200, 500, 1000, 2000, 5000));

-- Los literales son los de `ENTRADAS` y `RITMOS` del árbitro (src/arbitro/). La
-- entrada en fichas no se guarda: es `ENTRADAS[entrada] × apuesta`.
alter table public.salas
  add column entrada text not null default 'corta'
    constraint salas_entrada_chk check (entrada in ('corta', 'llena')),
  add column ritmo text not null default 'normal'
    constraint salas_ritmo_chk check (ritmo in ('normal', 'rapido'));

comment on column public.salas.entrada is
  'MOT-1 · Corta (15×) o Llena (50×). Es identidad de la mesa pública.';
comment on column public.salas.ritmo is
  'MOT-1 · No es identidad y no se muestra (contrato §1). Ninguna función que liste mesas lo devuelve.';

-- La identidad de una mesa pública abierta (contrato §1).
drop index public.salas_abierta_unica_idx;
create unique index salas_abierta_unica_idx
  on public.salas (jugadores, apuesta, entrada)
  where tipo = 'abierta' and estado = 'esperando';


-- ── 2 · La partida y las vistas (contrato §5) ──────────────────────────────
-- `partidas.correspondencia` es `{ "<uid>": <índice> }`, con el índice de
-- `players[i]` del motor (K-11). `vencimiento` es null cuando no hay ninguno
-- pendiente; la clase vive en el estado. `salas.estado_partida` sigue nula.
create table public.partidas (
  sala_id         uuid        primary key references public.salas(id) on delete cascade,
  estado          jsonb       not null,
  version         integer     not null check (version >= 0),
  vencimiento     timestamptz,
  correspondencia jsonb       not null,
  creada_en       timestamptz not null default now(),
  actualizada_en  timestamptz not null default now(),
  terminada_en    timestamptz
);

comment on table public.partidas is
  'MOT-1 · Estado del árbitro, con el mazo dentro. Nadie del cliente la lee: RLS sin políticas, sin privilegios y fuera de la publicación.';

create table public.partida_vistas (
  sala_id uuid     not null references public.partidas(sala_id) on delete cascade,
  asiento smallint not null check (asiento between 0 and 4),
  uid     uuid     not null references public.profiles(id) on delete cascade,
  version integer  not null check (version >= 0),
  vista   jsonb    not null,
  primary key (sala_id, asiento),
  unique (sala_id, uid)
);

comment on table public.partida_vistas is
  'MOT-1 · Lo que ve cada asiento (`vistaDe`, contrato §4). Cada cuenta lee solo la suya.';

-- Para la política de lectura y para `mi_sala`, que buscan por cuenta.
create index partida_vistas_uid_idx on public.partida_vistas (uid);

alter table public.partidas       enable row level security;
alter table public.partida_vistas enable row level security;

revoke all on table public.partidas       from public, anon, authenticated;
revoke all on table public.partida_vistas from public, anon, authenticated;
grant select on table public.partida_vistas to authenticated;

create policy partida_vistas_select_propia
  on public.partida_vistas for select
  to authenticated
  using (uid = (select auth.uid()));

-- Fuera de la publicación, y comprobado: el bloque de ECO-1c §14. El aviso de que
-- hay versión nueva lo da el canal privado (§6), sin datos.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'MOT-1 1d-i: supabase_realtime es FOR ALL TABLES; la partida no puede quedar fuera';
  end if;
  foreach t in array array['partidas', 'partida_vistas'] loop
    if exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end
$$;


-- ── 3 · Las RPC del árbitro ────────────────────────────────────────────────
-- Solo `service_role`, sin `auth.uid()` (N-1, molde `partida_abierta_de`).
--
-- Los motivos que devuelven son para la Edge Function, que decide qué responde al
-- cliente; `version_vieja` y `partida_terminada` son los literales del contrato §3.
-- El rechazo por versión NO lanza (lección de SAL-B1 A1). Lanzan solo los errores
-- de quien llama, y con ellos se deshace todo: `estado_incoherente` y
-- `vistas_incompletas`.

-- Devuelve cero filas si no hay partida. `returns table`, para no caer en la fila
-- de nulos de un compuesto vacío (salasApi.js:69-76).
create function public.leer_partida(p_sala uuid)
returns table (estado jsonb, version integer, vencimiento timestamptz, correspondencia jsonb)
language sql
stable
security definer
set search_path = ''
as $fn$
  select p.estado, p.version, p.vencimiento, p.correspondencia
    from public.partidas p
   where p.sala_id = p_sala
$fn$;

-- Idempotente: la llama quien llegue primero (contrato §2, arranque). El
-- `for update` de la sala ordena dos llamadas a la vez, y también frente a
-- `barrer_salas`: el segundo en llegar encuentra la partida y la devuelve intacta.
--
-- `p_correspondencia` tiene que ser la compactación de las sillas actuales: entre
-- la lectura de la Edge Function y esta llamada, `salir_sala` puede vaciar una
-- silla de una mesa `activa`. Si no coincide, `asientos_distintos`, y se relee.
--
-- `p_vistas`: `[{ "asiento": <índice>, "vista": {…} }, …]`, una por asiento.
create function public.crear_partida(
  p_sala            uuid,
  p_estado          jsonb,
  p_vencimiento     timestamptz,
  p_correspondencia jsonb,
  p_vistas          jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_sala     public.salas;
  v_partida  public.partidas;
  v_creada   boolean := false;
  v_sillas   jsonb;
  v_asientos integer;
  v_filas    integer;
begin
  select * into v_sala from public.salas where id = p_sala for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'sala_no_activa');
  end if;

  select * into v_partida from public.partidas where sala_id = p_sala;
  if not found then
    if v_sala.estado <> 'activa' then
      return jsonb_build_object('ok', false, 'motivo', 'sala_no_activa');
    end if;

    select jsonb_object_agg(c.jugador_id::text, c.indice), count(*)
      into v_sillas, v_asientos
      from (select j.jugador_id, row_number() over (order by j.asiento) - 1 as indice
              from public.sala_jugadores j
             where j.sala_id = p_sala) c;
    if v_sillas is distinct from p_correspondencia then
      return jsonb_build_object('ok', false, 'motivo', 'asientos_distintos');
    end if;

    if (p_estado ->> 'version') is null then
      raise exception 'estado_incoherente' using errcode = 'P0001';
    end if;

    insert into public.partidas (sala_id, estado, version, vencimiento, correspondencia)
    values (p_sala, p_estado, (p_estado ->> 'version')::integer, p_vencimiento, p_correspondencia)
    returning * into v_partida;

    insert into public.partida_vistas (sala_id, asiento, uid, version, vista)
    select p_sala, c.value::smallint, c.key::uuid, v_partida.version, e.valor -> 'vista'
      from jsonb_each_text(p_correspondencia) c
      join jsonb_array_elements(p_vistas) as e(valor)
        on (e.valor ->> 'asiento')::smallint = c.value::smallint;
    get diagnostics v_filas = row_count;
    if v_filas <> v_asientos or jsonb_array_length(p_vistas) <> v_asientos then
      raise exception 'vistas_incompletas' using errcode = 'P0001';
    end if;

    v_creada := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'creada', v_creada,
    'estado', v_partida.estado,
    'version', v_partida.version,
    'vencimiento', v_partida.vencimiento,
    'correspondencia', v_partida.correspondencia
  );
end
$fn$;

-- Una sola transacción, condicionada a la versión leída (contrato §5, paso 2). La
-- versión nueva es la leída + 1 («toda acción con efecto sube la versión en 1»), y
-- el estado tiene que decir lo mismo.
--
-- `p_terminada` es `partidaTerminada(estado)` del árbitro: esta función no mira
-- dentro del motor. `p_efectos` son los `efectos` del árbitro: en la 1d-i se aceptan
-- y se ignoran; la 1d-ii los aplica aquí mismo, sin cambiar la firma.
create function public.guardar_jugada(
  p_sala          uuid,
  p_version_leida integer,
  p_estado        jsonb,
  p_vencimiento   timestamptz,
  p_vistas        jsonb,
  p_terminada     boolean default false,
  p_efectos       jsonb   default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_nueva     integer := p_version_leida + 1;
  v_actual    public.partidas;
  v_asientos  integer;
  v_filas     integer;
begin
  if (p_estado ->> 'version')::integer is distinct from v_nueva then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;

  update public.partidas
     set estado         = p_estado,
         version        = v_nueva,
         vencimiento    = p_vencimiento,
         actualizada_en = now(),
         terminada_en   = case when p_terminada then now() end
   where sala_id = p_sala
     and version = p_version_leida
     and terminada_en is null;

  if not found then
    select * into v_actual from public.partidas where sala_id = p_sala;
    if not found then
      return jsonb_build_object('ok', false, 'motivo', 'sin_partida', 'version', null);
    end if;
    return jsonb_build_object(
      'ok', false,
      'motivo', case when v_actual.terminada_en is not null then 'partida_terminada' else 'version_vieja' end,
      'version', v_actual.version
    );
  end if;

  update public.partida_vistas v
     set version = v_nueva,
         vista   = e.valor -> 'vista'
    from jsonb_array_elements(p_vistas) as e(valor)
   where v.sala_id = p_sala
     and v.asiento = (e.valor ->> 'asiento')::smallint;
  get diagnostics v_filas = row_count;
  select count(*) into v_asientos from public.partida_vistas where sala_id = p_sala;
  if v_filas <> v_asientos or jsonb_array_length(p_vistas) <> v_asientos then
    raise exception 'vistas_incompletas' using errcode = 'P0001';
  end if;

  if p_terminada then
    update public.salas set estado = 'terminada' where id = p_sala and estado = 'activa';
  end if;

  return jsonb_build_object('ok', true, 'version', v_nueva);
end
$fn$;

comment on function public.leer_partida(uuid) is
  'MOT-1 · Estado, versión, vencimiento y correspondencia de una mesa, o ninguna fila. Sólo service_role.';
comment on function public.crear_partida(uuid, jsonb, timestamptz, jsonb, jsonb) is
  'MOT-1 · Idempotente: crea la partida de una sala activa, o devuelve la que hay. Sólo service_role.';
comment on function public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb) is
  'MOT-1 · Escribe estado, versión y vistas si la versión leída sigue vigente; si no, no escribe y lo dice. Sólo service_role.';

revoke execute on function public.leer_partida(uuid)                                                  from public, anon, authenticated;
revoke execute on function public.crear_partida(uuid, jsonb, timestamptz, jsonb, jsonb)               from public, anon, authenticated;
revoke execute on function public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb) from public, anon, authenticated;
grant  execute on function public.leer_partida(uuid)                                                  to service_role;
grant  execute on function public.crear_partida(uuid, jsonb, timestamptz, jsonb, jsonb)               to service_role;
grant  execute on function public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb) to service_role;


-- ── 4 · Abrir mesa ─────────────────────────────────────────────────────────
-- Cuerpo de SAL-B1 A1 §3 (20260911043500_sal_b1_ajuste.sql:128-199) con dos
-- parámetros opcionales, la entrada en la búsqueda de «abrir se vuelve unirme» y
-- las dos columnas en los dos `insert`.
--
-- `drop` + `create`, no `create or replace`: una firma nueva crearía una segunda
-- función al lado de la vieja, y PostgREST daría la llamada del cliente de hoy por
-- ambigua. El `drop` se lleva los permisos, así que se reponen los de SAL-A §15: el
-- `grant` a `authenticated` y el de `service_role`, que venía de los privilegios por
-- defecto de Supabase.
drop function public.crear_sala(public.sala_tipo, smallint, integer);

create function public.crear_sala(
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

  if public.saldo_de(v_uid) < public.regla_asiento() * p_apuesta then
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
        insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, entrada, ritmo)
        values (v_codigo, p_tipo, p_jugadores, p_apuesta, v_uid, p_entrada, p_ritmo)
        returning * into v_sala;
        exit;
      exception when unique_violation then
        if v_intento >= 10 then raise;
        end if;
      end;
    end loop;
  else
    insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, entrada, ritmo)
    values (null, p_tipo, p_jugadores, p_apuesta, v_uid, p_entrada, p_ritmo)
    returning * into v_sala;
  end if;

  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, 0);

  return v_sala;
end
$fn$;

revoke execute on function public.crear_sala(public.sala_tipo, smallint, integer, text, text) from public, anon;
grant  execute on function public.crear_sala(public.sala_tipo, smallint, integer, text, text) to authenticated, service_role;


-- ── 5 · El ciclo de la mesa ────────────────────────────────────────────────
-- Cuerpo de SAL-B1 A1 §2 (:93-122). La primera mitad no cambia. En la segunda, la
-- señal de «sin partida» pasa de `estado_partida` a la tabla, y una mesa con partida
-- no se toca nunca: la partida muerta es de la 1d-ii.
--
-- Va fila a fila porque un solo `update` no cierra la carrera con `crear_partida`:
-- al soltarse el bloqueo, su `not exists` seguiría mirando la foto de antes y
-- cancelaría una mesa que acaba de arrancar. Con la fila bloqueada, el `update` de
-- dentro mira con una foto nueva. `skip locked`: la que está arrancando no se espera.
create or replace function public.barrer_salas()
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_id uuid;
begin
  with vencidas as (
    select s.id,
           (select count(*) from public.sala_jugadores j where j.sala_id = s.id) as sentados
    from public.salas s
    where s.estado = 'esperando' and s.expira_en <= now()
  )
  update public.salas s
     set estado      = case when v.sentados >= 2 then 'activa'::public.sala_estado
                            else 'cancelada'::public.sala_estado end,
         iniciada_en = case when v.sentados >= 2 then now() else s.iniciada_en end
    from vencidas v
   where s.id = v.id
     and s.estado = 'esperando';

  -- Una 'activa' sin partida es una mesa muerta.
  -- 10 minutos = ACTIVA_SIN_PARTIDA_MIN (src/config/salas.js).
  for v_id in
    select s.id
      from public.salas s
     where s.estado = 'activa'
       and coalesce(s.iniciada_en, s.expira_en) <= now() - interval '10 minutes'
       and not exists (select 1 from public.partidas p where p.sala_id = s.id)
       for update of s skip locked
  loop
    update public.salas s
       set estado = 'cancelada'::public.sala_estado
     where s.id = v_id
       and not exists (select 1 from public.partidas p where p.sala_id = s.id);
  end loop;
end
$fn$;

-- Cuerpo de SAL-B1 A1 §5 (:346-373) con la segunda búsqueda. La mesa en espera va
-- primero, como hoy. El asiento de la partida es la fila de vistas, no
-- `sala_jugadores`: es el que el árbitro reconoce.
create or replace function public.mi_sala()
returns public.salas
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid  uuid := auth.uid();
  v_sala public.salas;
begin
  if v_uid is null then
    return null;
  end if;

  perform public.barrer_salas();

  select s.* into v_sala
    from public.salas s
   where s.id = public.sala_esperando_de(v_uid);

  if found then
    return v_sala;
  end if;

  -- MOT-1 · la mesa con partida viva, para que el jugador vuelva a ella.
  select s.* into v_sala
    from public.salas s
    join public.partida_vistas v on v.sala_id = s.id
   where v.uid = v_uid and s.estado = 'activa'
   order by s.creada_en desc
   limit 1;

  if not found then
    return null;
  end if;

  return v_sala;
end
$fn$;


-- ── 6 · El canal privado por mesa ──────────────────────────────────────────
-- Tema `partida:<id de la sala>`. Recibir: solo los miembros. Emitir: nadie del
-- cliente, y no hace falta política para eso: con RLS activa, sin una de `insert` no
-- se emite. El árbitro emite con la llave de servicio, que no pasa por RLS.
--
-- Compara como texto para que un tema mal formado dé «no» y no un error de cast.
-- `security definer` para no anidar la RLS de `sala_jugadores`, como `es_miembro`, y
-- concedida a `authenticated` por lo mismo (SAL-A §15): la política corre con su rol.
create function public.miembro_de_tema(p_tema text, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select left(p_tema, 8) = 'partida:' and exists (
    select 1 from public.sala_jugadores j
     where j.sala_id::text = substr(p_tema, 9) and j.jugador_id = p_uid
  )
$fn$;

comment on function public.miembro_de_tema(text, uuid) is
  'MOT-1 · ¿Esta cuenta tiene silla en la mesa del tema `partida:<id>`? La usa la política de realtime.messages.';

revoke execute on function public.miembro_de_tema(text, uuid) from public, anon;
grant  execute on function public.miembro_de_tema(text, uuid) to authenticated;

-- El `if`: el banco en memoria de `npm run guiones` no trae el esquema `realtime`,
-- y un banco que no aplica esta migración deja la vara del commit en rojo. En Supabase
-- la tabla siempre está, y el Grupo A falla si la política no quedó creada.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    drop policy if exists partida_recibir on realtime.messages;
    create policy partida_recibir
      on realtime.messages for select
      to authenticated
      using (
        extension = 'broadcast'
        and public.miembro_de_tema((select realtime.topic()), (select auth.uid()))
      );
  end if;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en SAL-A y SAL-B2: `db push` aplica el archivo y una prueba
-- dentro sería un efecto que se repite en cada despliegue. Se pega cada grupo
-- ENTERO y sin los `-- `. El SQL Editor solo enseña el último `select`, así que
-- cada uno acaba en una única consulta `comprobación | resultado | detalle`, y cada
-- fila debe decir PASA: 19 el Grupo A y 25 el Grupo B.
--
-- El Grupo B fabrica seis cuentas y lo deshace todo al final, con la excepción que
-- lanza `mot1di_deshacer`: cuentas, salas, partidas, la huella del correo en
-- `bonos_bienvenida` y lo que `barrer_salas()` toque de las salas reales. No deja
-- rastro. Usa la apuesta de 50 para las mesas abiertas: ninguna mesa real la tiene.
--
-- Lo que estos grupos no cubren, declarado: la recepción real del canal, que se
-- prueba en la 1e cuando la Edge Function emita, y la concurrencia real (dos versiones
-- a la vez, `crear_partida` contra `barrer_salas`), que pide dos conexiones.
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- with
-- fn(nombre, firma) as (values
--   ('leer_partida',   'public.leer_partida(uuid)'),
--   ('crear_partida',  'public.crear_partida(uuid, jsonb, timestamptz, jsonb, jsonb)'),
--   ('guardar_jugada', 'public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb)')
-- ),
-- rpc as (
--   select f.nombre,
--          to_regprocedure(f.firma) is not null as existe,
--          coalesce((select p.prosecdef and p.proconfig @> array['search_path=""']
--                      from pg_proc p where p.oid = to_regprocedure(f.firma)), false) as definer,
--          coalesce((select position('auth.uid' in p.prosrc) = 0
--                      from pg_proc p where p.oid = to_regprocedure(f.firma)), false) as sin_uid,
--          has_function_privilege('service_role',  f.firma, 'execute') as servicio,
--          has_function_privilege('authenticated', f.firma, 'execute') as autenticado,
--          has_function_privilege('anon',          f.firma, 'execute') as anonimo,
--          exists (select 1 from pg_proc p, aclexplode(p.proacl) a
--                   where p.oid = to_regprocedure(f.firma) and a.grantee = 0 and a.privilege_type = 'EXECUTE') as publico
--     from fn f
-- ),
-- tabla(t) as (values ('public.partidas'), ('public.partida_vistas')),
-- prv as (
--   select t,
--          (select c.relrowsecurity from pg_class c where c.oid = to_regclass(t)) as rls,
--          has_table_privilege('anon', t, 'select,insert,update,delete') as anon_algo,
--          has_table_privilege('authenticated', t, 'select') as aut_lee,
--          has_table_privilege('authenticated', t, 'insert,update,delete') as aut_escribe
--     from tabla
-- ),
-- mens as (
--   select to_regclass('realtime.messages') is not null as hay,
--          (select count(*) from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname = 'partida_recibir' and cmd = 'SELECT' and roles = '{authenticated}') as recibir,
--          (select count(*) from pg_policies where schemaname = 'realtime' and tablename = 'messages' and cmd = 'SELECT') as lecturas,
--          (select count(*) from pg_policies where schemaname = 'realtime' and tablename = 'messages' and cmd <> 'SELECT') as escrituras,
--          (select coalesce(string_agg(qual, ' | '), '') from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname = 'partida_recibir') as cond
-- ),
-- c as (
--   select 1 as orden, 'A1 · apuesta: las siete en el check' as comprobacion,
--          (select pg_get_constraintdef(oid) from pg_constraint
--            where conrelid = 'public.salas'::regclass and conname = 'salas_apuesta_check') as v,
--          (select pg_get_constraintdef(oid) like '%50, 100, 200, 500, 1000, 2000, 5000%' from pg_constraint
--            where conrelid = 'public.salas'::regclass and conname = 'salas_apuesta_check') as ok
--   union all
--   select 2, 'A2 · entrada: text, not null, default corta, check',
--          (select format('%s · nula=%s · default=%s', format_type(a.atttypid, a.atttypmod), not a.attnotnull, pg_get_expr(d.adbin, d.adrelid))
--             from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
--            where a.attrelid = 'public.salas'::regclass and a.attname = 'entrada'),
--          (select a.attnotnull and format_type(a.atttypid, a.atttypmod) = 'text' and pg_get_expr(d.adbin, d.adrelid) like '''corta''%'
--             from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
--            where a.attrelid = 'public.salas'::regclass and a.attname = 'entrada')
--          and exists (select 1 from pg_constraint where conrelid = 'public.salas'::regclass and conname = 'salas_entrada_chk'
--                       and pg_get_constraintdef(oid) like '%corta%llena%')
--   union all
--   select 3, 'A3 · ritmo: text, not null, default normal, check',
--          (select format('%s · nula=%s · default=%s', format_type(a.atttypid, a.atttypmod), not a.attnotnull, pg_get_expr(d.adbin, d.adrelid))
--             from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
--            where a.attrelid = 'public.salas'::regclass and a.attname = 'ritmo'),
--          (select a.attnotnull and format_type(a.atttypid, a.atttypmod) = 'text' and pg_get_expr(d.adbin, d.adrelid) like '''normal''%'
--             from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
--            where a.attrelid = 'public.salas'::regclass and a.attname = 'ritmo')
--          and exists (select 1 from pg_constraint where conrelid = 'public.salas'::regclass and conname = 'salas_ritmo_chk'
--                       and pg_get_constraintdef(oid) like '%normal%rapido%')
--   union all
--   select 4, 'A4 · ritmo y entrada fuera del listado de mesas',
--          pg_get_function_result('public.salas_abiertas()'::regprocedure),
--          position('ritmo' in pg_get_function_result('public.salas_abiertas()'::regprocedure)) = 0
--   union all
--   select 5, 'A5 · índice único parcial de tres columnas',
--          (select indexdef from pg_indexes where schemaname = 'public' and indexname = 'salas_abierta_unica_idx'),
--          (select indexdef like 'CREATE UNIQUE INDEX%(jugadores, apuesta, entrada) WHERE%' from pg_indexes
--            where schemaname = 'public' and indexname = 'salas_abierta_unica_idx')
--   union all
--   select 6, 'A6 · sala_estado tiene terminada',
--          (select string_agg(e.enumlabel, ', ' order by e.enumsortorder) from pg_enum e where e.enumtypid = 'public.sala_estado'::regtype),
--          exists (select 1 from pg_enum e where e.enumtypid = 'public.sala_estado'::regtype and e.enumlabel = 'terminada')
--   union all
--   select 7, 'A7 · estado_partida sigue nula en todas las salas',
--          (select count(*)::text || ' con dato' from public.salas where estado_partida is not null),
--          not exists (select 1 from public.salas where estado_partida is not null)
--   union all
--   select 8, 'A8 · partidas: RLS, sin políticas y sin privilegios del cliente',
--          (select format('rls=%s · anon=%s · aut lee=%s · aut escribe=%s · políticas=%s', rls, anon_algo, aut_lee, aut_escribe,
--                         (select count(*) from pg_policies where schemaname = 'public' and tablename = 'partidas'))
--             from prv where t = 'public.partidas'),
--          (select rls and not anon_algo and not aut_lee and not aut_escribe from prv where t = 'public.partidas')
--          and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'partidas')
--   union all
--   select 9, 'A9 · partida_vistas: RLS, solo select de authenticated, solo la suya',
--          (select format('rls=%s · anon=%s · aut lee=%s · aut escribe=%s · política=%s', rls, anon_algo, aut_lee, aut_escribe,
--                         (select string_agg(cmd || ' ' || roles::text || ' ' || qual, ' | ') from pg_policies where schemaname = 'public' and tablename = 'partida_vistas'))
--             from prv where t = 'public.partida_vistas'),
--          (select rls and not anon_algo and aut_lee and not aut_escribe from prv where t = 'public.partida_vistas')
--          and (select count(*) = 1 and bool_and(cmd = 'SELECT' and roles = '{authenticated}' and qual like '%uid = %auth.uid()%')
--                 from pg_policies where schemaname = 'public' and tablename = 'partida_vistas')
--   union all
--   select 10, 'A10 · las dos tablas fuera de supabase_realtime',
--          (select count(*)::text || ' dentro' from pg_publication_tables
--            where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('partidas', 'partida_vistas')),
--          not exists (select 1 from pg_publication_tables
--                       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('partidas', 'partida_vistas'))
--          and not exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables)
--   union all
--   select 11, 'A11 · las tres RPC: definer, sin auth.uid, solo service_role',
--          (select string_agg(format('%s: definer=%s sin_uid=%s servicio=%s aut=%s anon=%s public=%s',
--                                    nombre, definer, sin_uid, servicio, autenticado, anonimo, publico), ' | ') from rpc),
--          (select count(*) = 3 and bool_and(existe and definer and sin_uid and servicio and not autenticado and not anonimo and not publico) from rpc)
--   union all
--   select 12, 'A12 · guardar_jugada: p_efectos y p_terminada opcionales',
--          pg_get_function_arguments('public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb)'::regprocedure),
--          pg_get_function_arguments('public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb)'::regprocedure) like '%p_terminada boolean DEFAULT false, p_efectos jsonb DEFAULT%'
--   union all
--   select 13, 'A13 · crear_sala: una sola firma visible, con dos opcionales',
--          (select string_agg(pg_get_function_arguments(p.oid), ' || ') from pg_proc p
--            where p.pronamespace = 'public'::regnamespace and p.proname = 'crear_sala'),
--          (select count(*) = 1 and bool_and(p.pronargs = 5 and p.pronargdefaults = 2 and p.prosecdef) from pg_proc p
--            where p.pronamespace = 'public'::regnamespace and p.proname = 'crear_sala')
--   union all
--   select 14, 'A14 · crear_sala: authenticated y service_role sí; anon y public no',
--          format('aut=%s · servicio=%s · anon=%s',
--                 has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute'),
--                 has_function_privilege('service_role',  'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute'),
--                 has_function_privilege('anon',          'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')),
--          has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')
--          and has_function_privilege('service_role', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')
--          and not has_function_privilege('anon', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')
--          and not exists (select 1 from pg_proc p, aclexplode(p.proacl) a
--                           where p.oid = 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)'::regprocedure
--                             and a.grantee = 0 and a.privilege_type = 'EXECUTE')
--   union all
--   select 15, 'A15 · barrer_salas ya no mira estado_partida',
--          format('estado_partida=%s · partidas=%s',
--                 position('estado_partida' in p.prosrc) > 0, position('public.partidas' in p.prosrc) > 0),
--          position('estado_partida' in p.prosrc) = 0 and position('public.partidas' in p.prosrc) > 0
--     from pg_proc p where p.oid = 'public.barrer_salas()'::regprocedure
--   union all
--   select 16, 'A16 · mi_sala mira la partida',
--          format('partida_vistas=%s · sala_esperando_de=%s',
--                 position('public.partida_vistas' in p.prosrc) > 0, position('sala_esperando_de' in p.prosrc) > 0),
--          position('public.partida_vistas' in p.prosrc) > 0 and position('sala_esperando_de' in p.prosrc) > 0
--     from pg_proc p where p.oid = 'public.mi_sala()'::regprocedure
--   union all
--   select 17, 'A17 · realtime.messages: recibir solo miembros, por broadcast',
--          format('tabla=%s · partida_recibir=%s · %s', m.hay, m.recibir, m.cond),
--          m.hay and m.recibir = 1 and m.cond like '%broadcast%' and m.cond like '%miembro_de_tema%'
--     from mens m
--   union all
--   select 18, 'A18 · realtime.messages: nadie emite ni escribe',
--          format('lecturas=%s · políticas de escritura=%s', m.lecturas, m.escrituras),
--          m.escrituras = 0 and m.lecturas = 1
--     from mens m
--   union all
--   select 19, 'A19 · miembro_de_tema: authenticated sí; anon no',
--          format('aut=%s · anon=%s',
--                 has_function_privilege('authenticated', 'public.miembro_de_tema(text, uuid)', 'execute'),
--                 has_function_privilege('anon', 'public.miembro_de_tema(text, uuid)', 'execute')),
--          has_function_privilege('authenticated', 'public.miembro_de_tema(text, uuid)', 'execute')
--          and not has_function_privilege('anon', 'public.miembro_de_tema(text, uuid)', 'execute')
-- )
-- select comprobacion as "comprobación",
--        case when ok then 'PASA' else 'FALLA' end as resultado,
--        v as detalle
--   from c
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.mot1di_b()
-- returns table (orden integer, comprobacion text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   U1 constant uuid := 'd1d10000-0000-4000-8000-000000000001';
--   U2 constant uuid := 'd1d10000-0000-4000-8000-000000000002';
--   U3 constant uuid := 'd1d10000-0000-4000-8000-000000000003';
--   U4 constant uuid := 'd1d10000-0000-4000-8000-000000000004';
--   U5 constant uuid := 'd1d10000-0000-4000-8000-000000000005';
--   U6 constant uuid := 'd1d10000-0000-4000-8000-000000000006';
--   v_o integer[] := '{}';
--   v_c text[]    := '{}';
--   v_r text[]    := '{}';
--   v_d text[]    := '{}';
--   s1 public.salas; s2 public.salas; s3 public.salas; s4 public.salas; r public.salas;
--   j1 jsonb; j2 jsonb; j3 jsonb;
--   corr jsonb; vistas2 jsonb; est0 jsonb; est1 jsonb;
--   t1 text; t2 text; t3 text;
--   n1 bigint; n2 bigint; n3 bigint;
--   ok boolean;
-- begin
--   begin
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'mot1di.' || right(u::text, 1) || '@example.invalid', '', now(), now(), '{}', '{}'
--       from unnest(array[U1, U2, U3, U4, U5, U6]) u;
--     insert into public.profiles (id, username)
--     select u, 'mot1di_verif' || right(u::text, 1)
--       from unnest(array[U1, U2, U3, U4, U5, U6]) u;
--     perform public.ajuste_admin(u, 1000, 'MOT-1 1d-i · verificación')
--       from unnest(array[U1, U2, U3, U4, U5, U6]) u;
--
--     -- ── B1 · el cliente de hoy: la misma llamada con nombre que hace salasApi ──
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     s1 := public.crear_sala(p_tipo := 'privada', p_jugadores := 2::smallint, p_apuesta := 100);
--     select asiento into n1 from public.sala_jugadores where sala_id = s1.id and jugador_id = U1;
--     v_o := v_o || 101; v_c := v_c || 'B1 · sin entrada ni ritmo: mesa corta y normal, anfitrión en el 0'::text;
--     v_r := v_r || case when s1.entrada = 'corta' and s1.ritmo = 'normal' and n1 = 0 and s1.estado_partida is null then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('entrada=%s · ritmo=%s · asiento=%s', s1.entrada, s1.ritmo, n1);
--     perform public.salir_sala(s1.id);
--
--     -- ── B2 · misma combinación: entradas distintas conviven; la misma, se une ──
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     s1 := public.crear_sala('abierta', 5::smallint, 50);
--     perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
--     s2 := public.crear_sala('abierta', 5::smallint, 50, 'llena', 'rapido');
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     s3 := public.crear_sala('abierta', 5::smallint, 50, 'corta', 'rapido');
--     select count(*) into n1 from public.salas
--      where tipo = 'abierta' and estado = 'esperando' and jugadores = 5 and apuesta = 50;
--     v_o := v_o || 102; v_c := v_c || 'B2a · corta y llena de 5×50 conviven'::text;
--     v_r := v_r || case when s1.id <> s2.id and s1.entrada = 'corta' and s2.entrada = 'llena' and n1 = 2 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('mesas abiertas de 5×50=%s · %s y %s', n1, s1.entrada, s2.entrada);
--     select asiento into n2 from public.sala_jugadores where sala_id = s1.id and jugador_id = U3;
--     v_o := v_o || 103; v_c := v_c || 'B2b · la misma entrada se vuelve «unirme», al ritmo de esa mesa'::text;
--     v_r := v_r || case when s3.id = s1.id and n1 = 2 and n2 = 1 and s3.ritmo = 'normal' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('misma mesa=%s · asiento=%s · ritmo=%s', s3.id = s1.id, n2, s3.ritmo);
--     begin
--       insert into public.salas (tipo, jugadores, apuesta, anfitrion_id, entrada) values ('abierta', 5, 50, U4, 'llena');
--       t1 := 'entró';
--     exception when unique_violation then t1 := 'unique_violation';
--     end;
--     v_o := v_o || 104; v_c := v_c || 'B2c · el índice rechaza una segunda de la misma identidad'::text;
--     v_r := v_r || case when t1 = 'unique_violation' then 'PASA' else 'FALLA' end;
--     v_d := v_d || t1;
--
--     -- ── B3 · la mesa de 50 se crea; lo que no está en la tabla, no ─────────────
--     begin
--       insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id) values ('AJ-ZQ9Y', 'privada', 2, 75, U4);
--       t1 := 'entró';
--     exception when check_violation then t1 := 'check_violation';
--     end;
--     begin
--       insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, entrada) values ('AJ-ZQ9Z', 'privada', 2, 100, U4, 'media');
--       t2 := 'entró';
--     exception when check_violation then t2 := 'check_violation';
--     end;
--     begin
--       insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, ritmo) values ('AJ-ZQ8Z', 'privada', 2, 100, U4, 'lento');
--       t3 := 'entró';
--     exception when check_violation then t3 := 'check_violation';
--     end;
--     v_o := v_o || 105; v_c := v_c || 'B3 · la mesa de 50 existe; apuesta 75, entrada media y ritmo lento rebotan'::text;
--     v_r := v_r || case when s1.apuesta = 50 and t1 = 'check_violation' and t2 = 'check_violation' and t3 = 'check_violation' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('apuesta=%s · 75=%s · media=%s · lento=%s', s1.apuesta, t1, t2, t3);
--
--     -- ── B4 · unirse_sala da la primera silla libre ─────────────────────────────
--     -- En la mesa de U1: U3 ya está en la silla 1. Entra U4 (2), se levanta U3 y
--     -- entra U5: le toca la 1, que quedó libre.
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     perform public.unirse_sala(null, s1.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     perform public.salir_sala(s1.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U5)::text, true);
--     perform public.unirse_sala(null, s1.id);
--     select asiento into n1 from public.sala_jugadores where sala_id = s1.id and jugador_id = U4;
--     select asiento into n2 from public.sala_jugadores where sala_id = s1.id and jugador_id = U5;
--     v_o := v_o || 106; v_c := v_c || 'B4 · la primera silla libre: la 2 y luego la 1 que se vació'::text;
--     v_r := v_r || case when n1 = 2 and n2 = 1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('U4 en la %s · U5 en la %s', n1, n2);
--
--     -- ── B5 · crear partida ─────────────────────────────────────────────────────
--     -- Mesa de tres con un hueco: sillas 0, 2 y 3, que se compactan a 0, 1 y 2.
--     perform set_config('request.jwt.claims', json_build_object('sub', U5)::text, true);
--     perform public.salir_sala(s1.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     perform public.unirse_sala(null, s1.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U5)::text, true);
--     perform public.unirse_sala(null, s1.id);
--     perform set_config('request.jwt.claims', json_build_object('sub', U3)::text, true);
--     perform public.salir_sala(s1.id);
--     perform set_config('request.jwt.claims', '', true);
--
--     corr := jsonb_build_object(U1::text, 0, U4::text, 1, U5::text, 2);
--     vistas2 := '[{"asiento":0,"vista":{"yo":0,"v":0}},{"asiento":1,"vista":{"yo":1,"v":0}},{"asiento":2,"vista":{"yo":2,"v":0}}]';
--     est0 := '{"version":0,"mazo":["secreto"]}';
--     est1 := '{"version":1,"mazo":["secreto"]}';
--
--     j1 := public.crear_partida(s1.id, est0, now() + interval '2 seconds', corr, vistas2);
--     v_o := v_o || 107; v_c := v_c || 'B5a · una mesa en espera se rechaza, sin escribir'::text;
--     v_r := v_r || case when j1 ->> 'ok' = 'false' and j1 ->> 'motivo' = 'sala_no_activa'
--                         and not exists (select 1 from public.partidas where sala_id = s1.id) then 'PASA' else 'FALLA' end;
--     v_d := v_d || j1::text;
--
--     perform set_config('request.jwt.claims', json_build_object('sub', U1)::text, true);
--     perform public.jugar_ya(s1.id);
--     perform set_config('request.jwt.claims', '', true);
--
--     j1 := public.crear_partida(s1.id, est0, now() + interval '2 seconds',
--                                jsonb_build_object(U1::text, 0, U5::text, 1, U4::text, 2), vistas2);
--     v_o := v_o || 108; v_c := v_c || 'B5b · una correspondencia que no es la compactación se rechaza'::text;
--     v_r := v_r || case when j1 ->> 'motivo' = 'asientos_distintos'
--                         and not exists (select 1 from public.partidas where sala_id = s1.id) then 'PASA' else 'FALLA' end;
--     v_d := v_d || j1::text;
--
--     j1 := public.crear_partida(s1.id, est0, now() + interval '2 seconds', corr, vistas2);
--     select count(*) into n1 from public.partida_vistas where sala_id = s1.id;
--     select uid::text into t1 from public.partida_vistas where sala_id = s1.id and asiento = 2;
--     v_o := v_o || 109; v_c := v_c || 'B5c · una mesa activa la crea: versión 0, tres vistas, sillas compactadas'::text;
--     v_r := v_r || case when j1 ->> 'ok' = 'true' and j1 ->> 'creada' = 'true' and (j1 ->> 'version')::int = 0
--                         and n1 = 3 and t1 = U5::text then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('creada=%s · versión=%s · vistas=%s · índice 2 es U5=%s', j1 ->> 'creada', j1 ->> 'version', n1, t1 = U5::text);
--
--     j2 := public.crear_partida(s1.id, '{"version":0,"otra":true}', now() + interval '9 hours', corr,
--                                '[{"asiento":0,"vista":{"otra":true}},{"asiento":1,"vista":{"otra":true}},{"asiento":2,"vista":{"otra":true}}]');
--     v_o := v_o || 110; v_c := v_c || 'B5d · idempotente: la segunda devuelve la que hay, sin tocarla'::text;
--     v_r := v_r || case when j2 ->> 'creada' = 'false' and j2 -> 'estado' = est0 and j2 ->> 'vencimiento' = j1 ->> 'vencimiento'
--                         and (select estado = est0 from public.partidas where sala_id = s1.id)
--                         and (select vista = '{"yo":0,"v":0}'::jsonb from public.partida_vistas where sala_id = s1.id and asiento = 0)
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('creada=%s · estado intacto=%s', j2 ->> 'creada', j2 -> 'estado' = est0);
--
--     select count(*) into n1 from public.leer_partida(gen_random_uuid());
--     select count(*) into n2 from public.leer_partida(s1.id) l
--      where l.estado = est0 and l.version = 0 and l.vencimiento is not null and l.correspondencia = corr;
--     v_o := v_o || 111; v_c := v_c || 'B5e · leer partida: la de la mesa, o ninguna fila'::text;
--     v_r := v_r || case when n1 = 0 and n2 = 1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('mesa sin partida=%s filas · mesa con partida=%s fila', n1, n2);
--
--     -- ── B6 · guardar jugada ────────────────────────────────────────────────────
--     j1 := public.guardar_jugada(s1.id, 0, est1, now() + interval '20 seconds',
--            '[{"asiento":0,"vista":{"yo":0,"v":1}},{"asiento":1,"vista":{"yo":1,"v":1}},{"asiento":2,"vista":{"yo":2,"v":1}}]');
--     select count(*) into n1 from public.partida_vistas where sala_id = s1.id and version = 1 and (vista ->> 'v')::int = 1;
--     v_o := v_o || 112; v_c := v_c || 'B6a · con la versión vigente escribe estado, versión y todas las vistas'::text;
--     v_r := v_r || case when j1 ->> 'ok' = 'true' and (j1 ->> 'version')::int = 1
--                         and (select version = 1 and estado = est1 from public.partidas where sala_id = s1.id) and n1 = 3 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('%s · vistas al día=%s', j1::text, n1);
--
--     j2 := public.guardar_jugada(s1.id, 0, est1, now() + interval '9 hours',
--            '[{"asiento":0,"vista":{"mala":1}},{"asiento":1,"vista":{"mala":1}},{"asiento":2,"vista":{"mala":1}}]');
--     select count(*) into n1 from public.partida_vistas where sala_id = s1.id and vista ? 'mala';
--     select (vencimiento < now() + interval '1 hour') into ok from public.partidas where sala_id = s1.id;
--     v_o := v_o || 113; v_c := v_c || 'B6b · con versión vieja no escribe nada, y lo dice sin lanzar'::text;
--     v_r := v_r || case when j2 ->> 'ok' = 'false' and j2 ->> 'motivo' = 'version_vieja' and (j2 ->> 'version')::int = 1 and n1 = 0 and ok then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('%s · vistas tocadas=%s · vencimiento intacto=%s', j2::text, n1, ok);
--
--     begin
--       j3 := public.guardar_jugada(s1.id, 1, '{"version":2}', null, '[{"asiento":0,"vista":{"mala":1}}]');
--       t1 := 'no lanzó';
--     exception when others then t1 := sqlerrm;
--     end;
--     select version into n1 from public.partidas where sala_id = s1.id;
--     select count(*) into n2 from public.partida_vistas where sala_id = s1.id and vista ? 'mala';
--     v_o := v_o || 114; v_c := v_c || 'B6c · sin todas las vistas se deshace entera'::text;
--     v_r := v_r || case when t1 = 'vistas_incompletas' and n1 = 1 and n2 = 0 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('%s · versión=%s · vistas tocadas=%s', t1, n1, n2);
--
--     -- ── B7 · lo que lee cada cuenta ────────────────────────────────────────────
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     set local role authenticated;
--     select count(*), count(*) filter (where uid = U4) into n1, n2 from public.partida_vistas where sala_id = s1.id;
--     select count(*) into n3 from public.partida_vistas where uid = U1;
--     reset role;
--     v_o := v_o || 115; v_c := v_c || 'B7a · una cuenta lee su vista y no la de otro'::text;
--     v_r := v_r || case when n1 = 1 and n2 = 1 and n3 = 0 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('filas de la mesa=%s · suyas=%s · de otro=%s', n1, n2, n3);
--
--     set local role authenticated;
--     begin
--       select count(*) into n1 from public.partidas;
--       t1 := 'la leyó';
--     exception when insufficient_privilege then t1 := 'denegado';
--     end;
--     begin
--       update public.partida_vistas set vista = '{}' where uid = U4;
--       t2 := 'la escribió';
--     exception when insufficient_privilege then t2 := 'denegado';
--     end;
--     begin
--       perform public.leer_partida(s1.id);
--       t3 := 'la llamó';
--     exception when insufficient_privilege then t3 := 'denegado';
--     end;
--     reset role;
--     v_o := v_o || 116; v_c := v_c || 'B7b · no lee la partida, no escribe su vista y no llama a las RPC'::text;
--     v_r := v_r || case when t1 = 'denegado' and t2 = 'denegado' and t3 = 'denegado' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('leer partidas=%s · escribir vista=%s · leer_partida=%s', t1, t2, t3);
--
--     set local role anon;
--     begin
--       select count(*) into n1 from public.partida_vistas;
--       t1 := 'la leyó';
--     exception when insufficient_privilege then t1 := 'denegado';
--     end;
--     reset role;
--     v_o := v_o || 117; v_c := v_c || 'B7c · anon no lee las vistas'::text;
--     v_r := v_r || case when t1 = 'denegado' then 'PASA' else 'FALLA' end;
--     v_d := v_d || t1;
--
--     -- ── B8 · el barrido ────────────────────────────────────────────────────────
--     update public.salas set iniciada_en = now() - interval '11 minutes' where id = s1.id;
--     perform public.barrer_salas();
--     select estado::text into t1 from public.salas where id = s1.id;
--     v_o := v_o || 118; v_c := v_c || 'B8a · una activa con partida, vieja, no se cancela'::text;
--     v_r := v_r || case when t1 = 'activa' then 'PASA' else 'FALLA' end;
--     v_d := v_d || t1;
--
--     insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, estado, iniciada_en)
--     values ('AJ-ZQ7Y', 'privada', 2, 100, U6, 'activa', now() - interval '11 minutes') returning * into s4;
--     insert into public.sala_jugadores (sala_id, jugador_id, asiento) values (s4.id, U6, 0);
--     perform public.barrer_salas();
--     select estado::text into t1 from public.salas where id = s4.id;
--     v_o := v_o || 119; v_c := v_c || 'B8b · una activa sin partida, vieja, sí se cancela'::text;
--     v_r := v_r || case when t1 = 'cancelada' then 'PASA' else 'FALLA' end;
--     v_d := v_d || t1;
--
--     insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, estado, iniciada_en)
--     values ('AJ-ZQ6Y', 'privada', 2, 100, U6, 'activa', now() - interval '5 minutes') returning * into s4;
--     perform public.barrer_salas();
--     select estado::text into t1 from public.salas where id = s4.id;
--     v_o := v_o || 120; v_c := v_c || 'B8c · una activa sin partida, de 5 minutos, sigue'::text;
--     v_r := v_r || case when t1 = 'activa' then 'PASA' else 'FALLA' end;
--     v_d := v_d || t1;
--     update public.salas set estado = 'cancelada' where id = s4.id;
--
--     -- ── B9 · mi_sala ───────────────────────────────────────────────────────────
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     r := public.mi_sala();
--     v_o := v_o || 121; v_c := v_c || 'B9a · devuelve la mesa activa con partida'::text;
--     v_r := v_r || case when r.id = s1.id and r.estado = 'activa' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('misma mesa=%s · estado=%s', r.id = s1.id, r.estado);
--
--     perform set_config('request.jwt.claims', json_build_object('sub', U2)::text, true);
--     r := public.mi_sala();
--     v_o := v_o || 122; v_c := v_c || 'B9b · sigue devolviendo la mesa en espera'::text;
--     v_r := v_r || case when r.id = s2.id and r.estado = 'esperando' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('misma mesa=%s · estado=%s', r.id = s2.id, r.estado);
--
--     perform set_config('request.jwt.claims', json_build_object('sub', U6)::text, true);
--     r := public.mi_sala();
--     v_o := v_o || 123; v_c := v_c || 'B9c · no devuelve una cancelada'::text;
--     v_r := v_r || case when r.id is null then 'PASA' else 'FALLA' end;
--     v_d := v_d || coalesce(r.id::text, 'ninguna');
--
--     -- ── La partida terminada: la sala pasa a su valor nuevo y sale de mi_sala ──
--     perform set_config('request.jwt.claims', '', true);
--     j1 := public.guardar_jugada(s1.id, 1, '{"version":2}', null,
--            '[{"asiento":0,"vista":{"v":2}},{"asiento":1,"vista":{"v":2}},{"asiento":2,"vista":{"v":2}}]', true);
--     select estado::text into t1 from public.salas where id = s1.id;
--     perform set_config('request.jwt.claims', json_build_object('sub', U4)::text, true);
--     r := public.mi_sala();
--     perform set_config('request.jwt.claims', '', true);
--     v_o := v_o || 124; v_c := v_c || 'B9d · al terminar, la sala queda terminada y mi_sala no la devuelve'::text;
--     v_r := v_r || case when j1 ->> 'ok' = 'true' and t1 = 'terminada' and r.id is null then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('%s · sala=%s · mi_sala=%s', j1::text, t1, coalesce(r.id::text, 'ninguna'));
--
--     j2 := public.guardar_jugada(s1.id, 2, '{"version":3}', null,
--            '[{"asiento":0,"vista":{"v":3}},{"asiento":1,"vista":{"v":3}},{"asiento":2,"vista":{"v":3}}]');
--     j3 := public.crear_partida(gen_random_uuid(), est0, null, corr, vistas2);
--     v_o := v_o || 125; v_c := v_c || 'B9e · nada se guarda tras terminar, y una mesa que no existe se rechaza'::text;
--     v_r := v_r || case when j2 ->> 'motivo' = 'partida_terminada' and j3 ->> 'motivo' = 'sala_no_activa' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('%s · %s', j2::text, j3::text);
--
--     -- Todo lo fabricado se va aquí, también la huella de los correos en
--     -- `bonos_bienvenida`, que un `delete from auth.users` dejaría (cfg1c:20).
--     perform set_config('request.jwt.claims', '', true);
--     raise exception 'mot1di_deshacer';
--   exception when others then
--     if sqlerrm <> 'mot1di_deshacer' then
--       v_o := v_o || 999; v_c := v_c || 'X · el guion se detuvo'::text;
--       v_r := v_r || 'FALLA'::text;
--       v_d := v_d || (sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   return query select * from unnest(v_o, v_c, v_r, v_d);
-- end
-- $fn$;
--
-- select comprobacion as "comprobación", resultado, detalle
--   from pg_temp.mot1di_b()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
--
-- CORRIDA REAL · pendiente. Los resultados van al informe de la fase, no aquí.
-- ═══════════════════════════════════════════════════════════════════════════
