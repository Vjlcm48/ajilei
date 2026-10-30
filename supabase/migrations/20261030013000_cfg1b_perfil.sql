-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · CFG-1 · Fase 1b — Perfil editable: lugar, freno del nombre
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_CFG-1_Fase1b_v1.0.md §1.2. Verificación:
-- supabase/pruebas/cfg1b_verificacion.sql.
--
-- ── QUÉ TRAE ───────────────────────────────────────────────────────────────
--   1 · tres columnas en `profiles`: `pais`, `estado`, `nombre_cambiado_en`;
--   2 · `username_vedado(text)`: la lista de vedados, sacada del portero de
--       SUP-2a para que `nombre_libre` la llame sin copiarla;
--   3 · el freno de 30 días, en un disparador;
--   4 · `nombre_libre(text)` y `mi_proximo_cambio()`, para el cliente;
--   5 · `update` de `profiles` cerrado a tres columnas;
--   6 · `mini_perfil` y `ranking_top` devuelven `pais` y `estado`.
--
-- ── EL NOMBRE NO ESTÁ COPIADO EN NINGUNA OTRA TABLA ────────────────────────
-- Doctrina de SUP-2a (0001:12-17): todo cuelga de `profiles.id`. Las funciones
-- que enseñan el nombre lo leen de `profiles` al vuelo (`ranking_top`,
-- `mini_perfil`), así que un cambio de nombre se ve en todas partes a la vez.
--
-- ── EL RELOJ ES EL DEL SERVIDOR ────────────────────────────────────────────
-- Doctrina de SAL-A (sal_a_salas:29-32). La fecha del freno la decide
-- `freno_nombre_hasta`, y la usan el disparador y `mi_proximo_cambio`: el
-- cliente solo la formatea. Se suma en UTC para que el resultado no dependa
-- del `timezone` de la sesión (30 días de calendario, no 30 × 24 h locales).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Las columnas ───────────────────────────────────────────────────────
-- `pais`: ISO 3166-1 alfa-2 en mayúsculas, o nulo («Prefiero no decirlo»).
-- `estado`: solo con Venezuela, y solo de la lista sellada (ficha §0-8):
-- 23 estados + Distrito Capital, sin Guayana Esequiba ni Dependencias
-- Federales. Los códigos son los de la lámina (`laminas/cfg1b/datos/estados.js`),
-- que copiará `src/config/estados.js`.
-- `nombre_cambiado_en`: nulo hasta el primer cambio; solo lo escribe el freno.
alter table public.profiles
  add column pais               text        null,
  add column estado             text        null,
  add column nombre_cambiado_en timestamptz null;

alter table public.profiles
  add constraint profiles_pais_formato_chk
    check (pais ~ '^[A-Z]{2}$'),
  -- `is not distinct from`: con `pais = 'VE'` a secas, un país nulo daría
  -- nulo y el CHECK lo dejaría pasar.
  add constraint profiles_estado_solo_ve_chk
    check (estado is null or pais is not distinct from 'VE'),
  add constraint profiles_estado_lista_chk
    check (estado is null or estado in (
      'AMA', 'ANZ', 'APU', 'ARA', 'BAR', 'BOL', 'CAR', 'COJ', 'DEL', 'DC',
      'FAL', 'GUA', 'LGU', 'LAR', 'MER', 'MIR', 'MON', 'NES', 'POR', 'SUC',
      'TAC', 'TRU', 'YAR', 'ZUL'));

comment on column public.profiles.pais is
  'CFG-1 1b · ISO 3166-1 alfa-2 (A-Z), o nulo: «Prefiero no decirlo».';
comment on column public.profiles.estado is
  'CFG-1 1b · Estado de Venezuela (lista sellada de la migración), solo con pais = VE.';
comment on column public.profiles.nombre_cambiado_en is
  'CFG-1 1b · Último cambio de nombre. Solo lo escribe profiles_freno_nombre(); nulo hasta el primero.';


-- ── 2 · Los vedados, en una función ────────────────────────────────────────
-- El predicado es el MISMO que tenía el portero de SUP-2a (0001:146-150):
-- igualdad o contenido sobre el nombre normalizado. El portero pasa a llamarla
-- y su mensaje no cambia, así que el Bautizo sigue recibiendo P0001.
-- Su disparador es de toda la fila (0001:166-168), no `of username`: sin el
-- atajo del principio, un jugador cuyo nombre cayera hoy en una palabra
-- añadida después a la lista no podría cambiar ni su país ni su estado.
create or replace function public.username_vedado(txt text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
      from public.reserved_usernames as r
     where public.normalizar_username(txt) = r.word
        or public.normalizar_username(txt) like '%' || r.word || '%'
  )
$fn$;

create or replace function public.validar_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if tg_op = 'UPDATE' and new.username is not distinct from old.username then
    new.updated_at := now();
    return new;
  end if;

  if public.username_vedado(new.username) then
    raise exception
      'AJILEI: el nombre "%" no esta disponible porque contiene un termino reservado o inapropiado', new.username
      using hint = 'Elige otro nombre de 6 a 15 caracteres (letras, numeros y guion bajo).';
  end if;

  new.updated_at := now();
  return new;
end;
$fn$;


-- ── 3 · El freno de 30 días ────────────────────────────────────────────────
create or replace function public.freno_nombre_hasta(p_desde timestamptz)
returns timestamptz
language sql
immutable
set search_path = ''
as $fn$
  select ((p_desde at time zone 'UTC') + interval '30 days') at time zone 'UTC'
$fn$;

-- En el alta (el Bautizo) no hay cambio: la columna nace nula, la mande quien
-- la mande. En un cambio:
--   · nadie la escribe a mano: se devuelve a la vieja antes de mirar nada;
--   · solo mayúsculas («devlocal» → «DevLocal»): pasa y no gasta el freno;
--   · un nombre de verdad nuevo dentro de los 30 días: `nombre_frenado`, con
--     errcode propio (AJ030, distinto de los tres de SUP-2a) y la fecha desde
--     la que se puede en el `hint`, en ISO y UTC;
--   · fuera de los 30 días, o el primero: pasa y la columna se pone en now().
-- Se llama `profiles_freno_…` para que corra ANTES que el portero (los BEFORE
-- van por orden alfabético): un nombre frenado no llega a la lista de vedados.
-- `security definer` como el portero: corre con el rol del cliente, y
-- `freno_nombre_hasta` no se le concede a nadie.
create or replace function public.profiles_freno_nombre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_hasta timestamptz;
begin
  if tg_op = 'INSERT' then
    new.nombre_cambiado_en := null;
    return new;
  end if;

  new.nombre_cambiado_en := old.nombre_cambiado_en;

  if lower(new.username) = lower(old.username) then
    return new;
  end if;

  if old.nombre_cambiado_en is not null then
    v_hasta := public.freno_nombre_hasta(old.nombre_cambiado_en);
    if now() < v_hasta then
      raise exception 'nombre_frenado'
        using errcode = 'AJ030',
              hint = to_char(v_hasta at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
    end if;
  end if;

  new.nombre_cambiado_en := now();
  return new;
end;
$fn$;

create trigger profiles_freno_nombre_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_freno_nombre();


-- ── 4 · Lo que el cliente pregunta ─────────────────────────────────────────
-- `nombre_libre`: el editor lo llama ANTES de enseñar el aviso de 30 días
-- (ficha §0-9). Verdadero solo si el nombre tiene la forma del CHECK de
-- SUP-2a, no está vedado y no lo tiene OTRO jugador sin distinguir mayúsculas:
-- el propio con otras mayúsculas cuenta como libre. Es una pista, no una
-- reserva: quien decide al final es el `update`, con los mismos códigos.
create or replace function public.nombre_libre(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(p ~ '^[A-Za-z0-9_]{6,15}$', false)
     and not public.username_vedado(p)
     and not exists (
       select 1 from public.profiles pr
        where lower(pr.username) = lower(p)
          and pr.id is distinct from auth.uid())
$fn$;

-- `mi_proximo_cambio`: desde cuándo puede cambiar de nombre el jugador de la
-- sesión. Nulo si puede ya (nunca cambió, o pasaron los 30 días) o sin sesión.
create or replace function public.mi_proximo_cambio()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $fn$
  select h.hasta
    from public.profiles p
    cross join lateral (select public.freno_nombre_hasta(p.nombre_cambiado_en) as hasta) h
   where p.id = auth.uid()
     and p.nombre_cambiado_en is not null
     and now() < h.hasta
$fn$;


-- ── 5 · `update` de `profiles`, cerrado a tres columnas ────────────────────
-- Hasta hoy el cliente tenía `update` sobre toda la fila (lo que Supabase da
-- por defecto) y la política de SUP-2a solo limitaba QUÉ fila. El único
-- `update` del cliente es el de `cambiarNombre` (`useAuth.js:365`, `username`);
-- la 1b añade `pais` y `estado`. `nombre_cambiado_en`, `id` y las fechas
-- quedan fuera: escribirlas desde el cliente es «permiso denegado» (42501).
-- `anon` no tiene política de `update`; se le quita también el privilegio.
revoke update on public.profiles from public, anon, authenticated;
grant  update (username, pais, estado) on public.profiles to authenticated;


-- ── 6 · `mini_perfil` y `ranking_top`, con el lugar ────────────────────────
-- Cambia la forma de lo que devuelven, así que `drop` + `create` (rnk1a §8 y
-- §10, idénticas salvo las dos columnas del final) y sus permisos otra vez.
drop function public.ranking_top(text);
drop function public.mini_perfil(text);

create function public.ranking_top(p_ranking text)
returns table (puesto integer, username text, cifra bigint, es_tu boolean, pais text, estado text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid   uuid := auth.uid();
  v_corte bigint;
begin
  if v_uid is null then
    return;
  end if;

  if p_ranking = 'maestros' then
    select t.puntos into v_corte
      from public.puntos_totales t
     order by t.puntos desc
    offset 99 limit 1;
    return query
      select (row_number() over (order by t.puntos desc, t.actualizado_en, lower(p.username)))::integer,
             p.username, t.puntos, t.jugador_id = v_uid, p.pais, p.estado
        from public.puntos_totales t
        join public.profiles p on p.id = t.jugador_id
       where v_corte is null or t.puntos >= v_corte
       order by t.puntos desc, t.actualizado_en, lower(p.username)
       limit 100;

  elsif p_ranking = 'fortunas' then
    select b.saldo into v_corte
      from public.billeteras b
     order by b.saldo desc
    offset 99 limit 1;
    return query
      select (row_number() over (order by b.saldo desc, b.actualizada_en, lower(p.username)))::integer,
             p.username, b.saldo, b.jugador_id = v_uid, p.pais, p.estado
        from public.billeteras b
        join public.profiles p on p.id = b.jugador_id
       where v_corte is null or b.saldo >= v_corte
       order by b.saldo desc, b.actualizada_en, lower(p.username)
       limit 100;
  end if;
  return;
end
$fn$;

create function public.mini_perfil(p_username text)
returns table (username text, puesto_maestros integer, puntos bigint, puesto_fortunas integer, saldo bigint,
               pais text, estado text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid;
  v_nombre text;
  v_pais   text;
  v_estado text;
  v_puntos bigint;
  v_saldo  bigint;
begin
  if v_uid is null or p_username is null then
    return;
  end if;

  select p.id, p.username, p.pais, p.estado into v_id, v_nombre, v_pais, v_estado
    from public.profiles p
   where lower(p.username) = lower(p_username);
  if not found then
    return;
  end if;

  select t.puntos into v_puntos from public.puntos_totales t where t.jugador_id = v_id;
  select b.saldo  into v_saldo  from public.billeteras b     where b.jugador_id = v_id;

  return query
    select v_nombre, public.puesto_maestros(v_id), v_puntos, public.puesto_fortunas(v_id), v_saldo,
           v_pais, v_estado;
end
$fn$;


-- ── 7 · Permisos de las funciones ──────────────────────────────────────────
-- Internas: a nadie.
revoke execute on function public.username_vedado(text)              from public, anon, authenticated;
revoke execute on function public.freno_nombre_hasta(timestamptz)    from public, anon, authenticated;
revoke execute on function public.profiles_freno_nombre()            from public, anon, authenticated;

-- Para el cliente: solo `authenticated`.
revoke execute on function public.nombre_libre(text)    from public, anon;
revoke execute on function public.mi_proximo_cambio()   from public, anon;
revoke execute on function public.ranking_top(text)     from public, anon;
revoke execute on function public.mini_perfil(text)     from public, anon;
grant  execute on function public.nombre_libre(text)    to authenticated;
grant  execute on function public.mi_proximo_cambio()   to authenticated;
grant  execute on function public.ranking_top(text)     to authenticated;
grant  execute on function public.mini_perfil(text)     to authenticated;
