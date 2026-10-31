-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · CFG-1 · Fase 1e — Mano actual de pago, en el servidor
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_CFG-1_Fase1e_v1.0.md §1.2. Verificación:
-- supabase/pruebas/cfg1e_verificacion.sql.
--
-- ── QUÉ TRAE ───────────────────────────────────────────────────────────────
--   1 · el tipo 'consulta' en el libro (`movimientos_tipo_chk`);
--   2 · la tabla `consultas`: una fila por jugador con las 20 gratis gastadas
--       y la última mano consultada;
--   3 · `consultas_gratis()` y `precio_consulta(text)`, las cifras;
--   4 · `consultar_mano(uuid, integer)`, la que gasta o cobra;
--   5 · `mi_consulta()`, la que el menú lee al entrar a la mesa.
--
-- ── POR QUÉ UNA TABLA Y NO COLUMNAS EN `profiles` (D-1) ────────────────────
-- La ficha recomienda dos columnas en `profiles`. Tres motivos para no:
--   · `profiles` se lee entera por cualquier autenticado (SUP-2a 0001:184-187,
--     `using (true)`, sin `grant` por columnas): el contador y el uuid de la
--     mesa pagada de cada jugador quedarían a la vista de todos;
--   · `profiles` tiene dos disparadores de fila (`profiles_freno_nombre_trg` y
--     `profiles_validar_username_trg`) que correrían en cada consulta;
--   · A10 de RNK-1 y el `grant update` de la 1b no se tocan.
-- La tabla guarda lo mismo que las columnas (UNA fila por jugador, la última
-- mano consultada), con RLS y sin privilegios para el cliente, como `billeteras`.
--
-- ── LA MANO LA DICE EL CLIENTE (ficha §0-6) ────────────────────────────────
-- Hasta MOT-1 el servidor no conoce las manos contra las IAS: la mano es el
-- par (mesa, número de mano del marcador) que manda el teléfono. La mesa sí se
-- comprueba (abierta y del jugador) y de ella sale el nivel: el cliente no
-- manda el precio ni el nivel. Un cliente tramposo puede repetir el número de
-- mano para no volver a pagar; las 20 gratis, no: viven aquí.
--
-- ── LA MANO ES LA UNIDAD (rector, STOP-E1 P-1) ─────────────────────────────
-- La primera consulta de una mano gasta una gratis o cobra; las siguientes de
-- esa misma mano no gastan nada ('repetida'). La fila de `consultas` recuerda
-- la ÚLTIMA mano consultada, gratis o pagada.
--
-- ── EL COBRO ES DEL LIBRO ──────────────────────────────────────────────────
-- La clave del movimiento es `consulta:<mesa>:<mano>`: una mano se cobra UNA
-- vez aunque se vuelva a ella después de consultar otra (aplicar_movimiento
-- devuelve 'repetido' y la respuesta es 'pagada').
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · 'consulta' en el libro ─────────────────────────────────────────────
-- La lista vive en UN sitio (eco1a_libro §3): se amplía quitando y poniendo
-- la restricción en la misma migración que la estrena.
alter table public.movimientos drop constraint if exists movimientos_tipo_chk;
alter table public.movimientos add constraint movimientos_tipo_chk check (tipo in (
  'bono_bienvenida', 'constancia', 'video',
  'entrada_ia', 'recarga_ia', 'salida_ia', 'abandono_ia',
  'compra', 'ajuste_admin',
  'garantia_pvp', 'liberacion_pvp', 'resultado_pvp',
  'consulta'
));


-- ── 2 · La tabla ───────────────────────────────────────────────────────────
-- Nace al primer `consultar_mano` del jugador; sin fila, quedan las 20 y no
-- hay última mano.
-- `gratis_usadas` solo sube y solo la escribe `consultar_mano`; el `check` es
-- la última red (el tope lo mira la función con `consultas_gratis()`).
create table if not exists public.consultas (
  jugador_id     uuid        primary key references public.profiles(id) on delete cascade,
  gratis_usadas  smallint    not null default 0,
  ultima_mesa    uuid        null,
  ultima_mano    integer     null,
  actualizada_en timestamptz not null default now(),

  constraint consultas_gratis_chk check (gratis_usadas between 0 and 20),
  constraint consultas_ultima_chk check ((ultima_mesa is null) = (ultima_mano is null)
                                         and (ultima_mano is null or ultima_mano > 0))
);

comment on table public.consultas is
  'CFG-1 1e · Mano actual: las consultas gratis gastadas y la última mano consultada, una fila por jugador. Sólo la escribe consultar_mano.';
comment on column public.consultas.gratis_usadas is
  'CFG-1 1e · Consultas gratis gastadas (0–20). Contador global del jugador: no depende del aparato ni de la mesa.';
comment on column public.consultas.ultima_mesa is
  'CFG-1 1e · Mesa contra las IAS de la última mano consultada, gratis o pagada (con ultima_mano). El cobro de verdad está en el libro: clave consulta:<mesa>:<mano>.';
comment on column public.consultas.ultima_mano is
  'CFG-1 1e · Número de mano (el «Mano #N» del marcador) de la última consultada. Lo dice el cliente hasta MOT-1.';


-- ── 3 · Las cifras ─────────────────────────────────────────────────────────
-- Espejo del cliente: `CONSULTAS_GRATIS` en src/config/consultas.js.
create or replace function public.consultas_gratis()
returns integer
language sql
immutable
set search_path = ''
as $fn$ select 20 $fn$;

comment on function public.consultas_gratis() is
  'CFG-1 1e · Consultas gratis por jugador, de por vida. Espejo: CONSULTAS_GRATIS en src/config/consultas.js.';

-- El precio de una mano, por nivel. 'humanos' queda durmiente hasta MES-PvP:
-- ninguna mesa de `mesas_ia` lo tiene. Un nivel desconocido no tiene precio.
create or replace function public.precio_consulta(p_nivel text)
returns integer
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  case p_nivel
    when 'basico'   then return 100;
    when 'avanzado' then return 200;
    when 'pro'      then return 300;
    when 'humanos'  then return 500;
    else
      raise exception 'precio_consulta: nivel desconocido «%»', coalesce(p_nivel, 'null')
        using errcode = '22023';
  end case;
end
$fn$;

comment on function public.precio_consulta(text) is
  'CFG-1 1e · HC de la primera consulta de una mano: basico 100 · avanzado 200 · pro 300 · humanos 500 (durmiente). Otro nivel, 22023.';


-- ── 4 · La respuesta ───────────────────────────────────────────────────────
-- Un tipo con nombre, como `movimiento_resultado`: siempre los cuatro campos
-- rellenos, nunca una fila nula (la de SAL-B1 A2).
--
--   resultado         'gratis' · 'cobrada' · 'repetida' (la última mano, sin
--                     tocar nada) · 'pagada' (una mano anterior que el libro ya
--                     cobró) · 'saldo_insuficiente'
--                     · 'sin_sesion' · 'argumento_invalido' · 'mesa_invalida'
--                     · 'limite', o el motivo de aplicar_movimiento si no
--                     cobró por otra razón (p. ej. 'sin_billetera').
--   precio            el precio de una mano en ESA mesa (0 sin mesa válida).
--   gratis_restantes  las gratis que quedan tras esta llamada.
--   saldo             el saldo de la billetera tras esta llamada.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'consulta_resultado' and n.nspname = 'public') then
    create type public.consulta_resultado as (
      resultado        text,
      precio           integer,
      gratis_restantes integer,
      saldo            bigint
    );
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'consulta_estado' and n.nspname = 'public') then
    create type public.consulta_estado as (
      gratis_restantes integer,
      ultima_mesa      uuid,
      ultima_mano      integer
    );
  end if;
end
$$;

comment on type public.consulta_resultado is
  'CFG-1 1e · Respuesta de consultar_mano. Siempre con los cuatro campos rellenos.';
comment on type public.consulta_estado is
  'CFG-1 1e · Respuesta de mi_consulta.';


-- ── 5 · consultar_mano ─────────────────────────────────────────────────────
-- En este orden:
--   1. sesión y perfil; 2. límite por minuto (Reglas ECO-1 §7: toda función
--   que mueve dinero; 30, como salir); 3. argumentos; 4. la mesa, abierta y
--   del jugador, y de ella el precio; 5. la fila del jugador, bloqueada
--   (ordena dos aparatos del mismo jugador); 6. es la última mano consultada
--   → 'repetida', sin tocar nada (va ANTES de gastar: rector, STOP-E1 P-1);
--   7. quedan gratis → se gasta una y la mano pasa a ser la última; 8. el
--   cobro, con la clave de la mano.
--
-- NUNCA LANZA en el camino normal (lección de SAL-B1 A1): un `raise` desharía
-- la anotación del límite. Cada salida es una fila.
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
  v_res    public.movimiento_resultado;
begin
  -- 1 · sesión
  if v_uid is null or not exists (select 1 from public.profiles p where p.id = v_uid) then
    return row('sin_sesion', 0, 0, 0::bigint)::public.consulta_resultado;
  end if;

  select c.* into v_fila from public.consultas c where c.jugador_id = v_uid;

  -- 2 · límite
  if not public.contar_intento_dinero('consultar_mano', 30) then
    return row('limite', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;

  -- 3 · argumentos
  if p_mesa is null or p_mano is null or p_mano < 1 then
    return row('argumento_invalido', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;

  -- 4 · la mesa y su precio
  select m.* into v_mesa
    from public.mesas_ia m
   where m.id = p_mesa and m.jugador_id = v_uid and m.estado = 'abierta';
  if not found then
    return row('mesa_invalida', 0, greatest(v_tope - coalesce(v_fila.gratis_usadas, 0), 0),
               public.ia_saldo_actual(v_uid))::public.consulta_resultado;
  end if;
  v_precio := public.precio_consulta(v_mesa.reto);

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
  v_nivel := case v_mesa.reto when 'basico' then 'Básico' when 'avanzado' then 'Avanzado' else 'Pro' end;
  v_res := public.aplicar_movimiento(
    v_uid, 'consulta', -v_precio::bigint,
    'consulta:' || p_mesa::text || ':' || p_mano::text,
    'mesa_ia', p_mesa::text, 'Mano actual · ' || v_nivel);

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

comment on function public.consultar_mano(uuid, integer) is
  'CFG-1 1e · Mano actual: la primera consulta de una mano (mesa, número) gasta una de las 20 gratis o, sin ellas, la cobra una vez con aplicar_movimiento; las siguientes de esa mano, nada. Nunca lanza.';


-- ── 6 · mi_consulta ────────────────────────────────────────────────────────
-- Lo que el menú pinta al entrar a la mesa. Sin fila, las 20. Sin sesión, 0 y
-- sin última mano. Devuelve el uuid de una MESA del propio jugador, que el
-- cliente ya tiene (la de `sentarse_ia`): no es la cuenta (INV-67, A10 de
-- RNK-1 solo mira las lecturas del ranking).
create or replace function public.mi_consulta()
returns public.consulta_estado
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid  uuid := auth.uid();
  v_fila public.consultas;
begin
  if v_uid is null then
    return row(0, null::uuid, null::integer)::public.consulta_estado;
  end if;
  select c.* into v_fila from public.consultas c where c.jugador_id = v_uid;
  return row(greatest(public.consultas_gratis() - coalesce(v_fila.gratis_usadas, 0), 0),
             v_fila.ultima_mesa, v_fila.ultima_mano)::public.consulta_estado;
end
$fn$;

comment on function public.mi_consulta() is
  'CFG-1 1e · Consultas gratis que le quedan al jugador de la sesión y su última mano consultada (mesa, número).';


-- ── 7 · Cerraduras y permisos ──────────────────────────────────────────────
-- La tabla como las del dinero (eco1a_libro §14): RLS sin políticas y sin
-- privilegios para el cliente.
alter table public.consultas enable row level security;
revoke all on table public.consultas from public, anon, authenticated;

revoke execute on function public.consultas_gratis()          from public, anon, authenticated;
revoke execute on function public.precio_consulta(text)       from public, anon, authenticated;
revoke execute on function public.consultar_mano(uuid, integer) from public, anon;
revoke execute on function public.mi_consulta()               from public, anon;
grant  execute on function public.consultar_mano(uuid, integer) to authenticated, service_role;
grant  execute on function public.mi_consulta()               to authenticated, service_role;
