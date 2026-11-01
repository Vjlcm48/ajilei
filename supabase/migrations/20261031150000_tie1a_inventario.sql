-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · TIE-1 · Fase 1a — El inventario: los tapetes vendidos de verdad
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_TIE-1_Fase1a_v1.0.md §2.1. Verificación:
-- supabase/pruebas/tie1a_verificacion.sql.
--
-- ── QUÉ TRAE ───────────────────────────────────────────────────────────────
--   1 · la tabla `inventario`: lo que cada jugador compró en la tienda, con su
--       tono y si lo tiene en uso. Genérica (`tipo`): TIE-1b y GEN-1 la
--       reutilizan para reversos, avatares…;
--   2 · el catálogo cerrado en SQL: `inventario_tipo_valido`, `precio_articulo`,
--       `articulo_con_tonos` y `articulo_gratis`;
--   3 · `comprar_articulo`, la única que mueve dinero (tipo 'compra' del libro);
--   4 · `usar_articulo` y `elegir_tono`, gratis;
--   5 · `mi_inventario`, la que leen la tienda y `useTapetes` al entrar.
-- El tipo 'compra' ya está en `movimientos_tipo_chk` desde el libro (eco1a §3):
-- esta migración no toca la restricción.
--
-- ── EL VERDE NO TIENE FILA ─────────────────────────────────────────────────
-- Es gratis y no se compra. «Verde en uso» = ninguna fila del tipo 'tapete'
-- con `en_uso`. Una cuenta nueva no necesita siembra, y «Usar» el verde es
-- apagar el que haya.
--
-- ── LA CLAVE DEL LIBRO LLEVA AL JUGADOR (D-1) ──────────────────────────────
-- La ficha pide `compra:<tipo>:<articulo>`. `movimientos.clave_idem` es única
-- en TODO el libro (eco1a §3, `movimientos_clave_idem_uniq`), no por jugador:
-- con esa clave el segundo jugador que comprara el grafito recibiría
-- 'clave_en_uso' y nunca podría comprarlo. La clave es
-- `compra:<jugador>:<tipo>:<articulo>`, el molde de la constancia
-- (`constancia:<jugador>:<día>`, eco1d §4): una compra por artículo y jugador,
-- para siempre, que es lo que la ficha quiere decir.
--
-- ── EL CERROJO DEL JUGADOR ─────────────────────────────────────────────────
-- Las tres que escriben bloquean primero la billetera del jugador (`for
-- update`), la misma fila que bloquea `aplicar_movimiento`. Así dos aparatos
-- del mismo jugador van en fila: la segunda compra del mismo artículo ve la
-- fila de la primera y responde 'ya_comprado', y dos «Usar» a la vez no chocan
-- en el índice de «uno en uso por tipo».
--
-- ── NUNCA LANZAN en el camino normal (lección de SAL-B1 A1) ────────────────
-- Un `raise` desharía la anotación del límite. Cada salida es un motivo
-- cerrado, en `text`.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · La tabla ───────────────────────────────────────────────────────────
-- Cuelga de `auth.users` (ficha §2.1): al borrar la cuenta (`eliminar_cuenta`,
-- CFG-1 1c) se va en cascada, como todo lo demás. Sin disparadores: no es un
-- libro, se puede borrar fila a fila.
create table if not exists public.inventario (
  jugador_id   uuid        not null references auth.users(id) on delete cascade,
  tipo         text        not null,
  articulo     text        not null,
  tono         text        null,
  en_uso       boolean     not null default false,
  adquirido_en timestamptz not null default now(),

  primary key (jugador_id, tipo, articulo),
  constraint inventario_tono_chk check (tono is null or tono in ('claro', 'actual', 'oscuro'))
);

-- A lo sumo un artículo en uso por jugador y tipo.
create unique index if not exists inventario_uno_en_uso_idx
  on public.inventario (jugador_id, tipo) where en_uso;

comment on table public.inventario is
  'TIE-1 1a · Lo que cada jugador compró en la tienda: una fila por artículo, con su tono y si está en uso (a lo sumo uno por tipo). Sólo la escriben comprar_articulo, usar_articulo y elegir_tono. El artículo gratis de cada tipo (el tapete verde) no tiene fila.';
comment on column public.inventario.tipo is
  'TIE-1 1a · ''tapete'' hoy; ''reverso'', ''avatar''… después. La lista vive en inventario_tipo_valido().';
comment on column public.inventario.articulo is
  'TIE-1 1a · El id del catálogo (src/config/tapetes.js): grafito, azul, vinotinto, tricolor.';
comment on column public.inventario.tono is
  'TIE-1 1a · claro · actual · oscuro, o null si el artículo no tiene tonos (tricolor).';


-- ── 2 · El catálogo, cerrado en SQL ────────────────────────────────────────
-- Espejo: `src/config/tapetes.js` (precios DE EXHIBICIÓN; el que cobra es éste).
create or replace function public.inventario_tipo_valido(p_tipo text)
returns boolean
language sql
immutable
set search_path = ''
as $fn$ select coalesce(p_tipo in ('tapete'), false) $fn$;

comment on function public.inventario_tipo_valido(text) is
  'TIE-1 1a · Los tipos de artículo que la tienda vende: ''tapete''. TIE-1b y GEN-1 abren más.';

-- El precio en HC; `null` = no está a la venta (tampoco el gratis).
create or replace function public.precio_articulo(p_tipo text, p_articulo text)
returns integer
language sql
immutable
set search_path = ''
as $fn$
  select case p_tipo
    when 'tapete' then
      case p_articulo
        when 'grafito'   then 10000
        when 'azul'      then 15000
        when 'vinotinto' then 25000
        when 'tricolor'  then 50000
      end
  end
$fn$;

comment on function public.precio_articulo(text, text) is
  'TIE-1 1a · HC de un artículo: tapete grafito 10000 · azul 15000 · vinotinto 25000 · tricolor 50000. Otro, null (no se vende). Espejo de exhibición: src/config/tapetes.js.';

create or replace function public.articulo_con_tonos(p_tipo text, p_articulo text)
returns boolean
language sql
immutable
set search_path = ''
as $fn$ select coalesce(p_tipo = 'tapete' and p_articulo in ('grafito', 'azul', 'vinotinto'), false) $fn$;

comment on function public.articulo_con_tonos(text, text) is
  'TIE-1 1a · Si el artículo tiene los tres tonos (claro, actual, oscuro): tapete grafito, azul y vinotinto. El tricolor y el verde, no.';

-- El artículo de cada tipo que se tiene sin comprarlo. No tiene fila.
create or replace function public.articulo_gratis(p_tipo text, p_articulo text)
returns boolean
language sql
immutable
set search_path = ''
as $fn$ select coalesce(p_tipo = 'tapete' and p_articulo = 'verde', false) $fn$;

comment on function public.articulo_gratis(text, text) is
  'TIE-1 1a · El artículo gratis del tipo (tapete verde): no se compra ni tiene fila; «usarlo» es apagar el que esté en uso.';


-- ── 3 · comprar_articulo ───────────────────────────────────────────────────
-- En este orden:
--   1. sesión y perfil; 2. límite por minuto (Reglas ECO-1 §7: toda función
--   que mueve dinero; 30, como consultar_mano); 3. tipo y artículo; 4. el
--   tono; 5. el cerrojo del jugador; 6. ya comprado → no cobra; 7. el cobro
--   (o, si el libro ya lo tenía y falta la fila, la reparación sin cobro);
--   8. la fila, en uso, apagando la anterior del tipo.
--
-- Motivos: 'ok' · 'sin_sesion' · 'limite' · 'tipo_invalido' · 'no_existe'
-- · 'sin_tono' · 'tono_invalido' · 'ya_comprado' · 'sin_saldo', o el motivo de
-- aplicar_movimiento si no cobró por otra razón (p. ej. 'sin_billetera').
-- Un artículo con tonos comprado sin tono se guarda en 'actual'.
create or replace function public.comprar_articulo(p_tipo text, p_articulo text, p_tono text default null)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_precio integer;
  v_tono   text;
  v_res    public.movimiento_resultado;
begin
  -- 1 · sesión
  if v_uid is null or not exists (select 1 from public.profiles p where p.id = v_uid) then
    return 'sin_sesion';
  end if;

  -- 2 · límite
  if not public.contar_intento_dinero('comprar_articulo', 30) then
    return 'limite';
  end if;

  -- 3 · tipo y artículo
  if not public.inventario_tipo_valido(p_tipo) then
    return 'tipo_invalido';
  end if;
  v_precio := public.precio_articulo(p_tipo, p_articulo);
  if v_precio is null then
    return 'no_existe';
  end if;

  -- 4 · el tono
  if public.articulo_con_tonos(p_tipo, p_articulo) then
    v_tono := coalesce(p_tono, 'actual');
    if v_tono not in ('claro', 'actual', 'oscuro') then
      return 'tono_invalido';
    end if;
  elsif p_tono is not null then
    return 'sin_tono';
  end if;

  -- 5 · el cerrojo
  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;

  -- 6 · ya comprado: no se cobra
  if exists (select 1 from public.inventario i
              where i.jugador_id = v_uid and i.tipo = p_tipo and i.articulo = p_articulo) then
    return 'ya_comprado';
  end if;

  -- 7 · el cobro. La clave es el segundo cerrojo: con el mismo artículo el
  -- libro devuelve 'repetido' y no cobra.
  --
  -- El doble cerrojo se repara solo (rector, STOP-A1 A-1): 'repetido' sin
  -- fila quiere decir que el jugador ya pagó ese artículo y perdió la fila.
  -- No se le cobra otra vez: se le devuelve la fila, en uso, con el tono que
  -- pide ahora, y la respuesta es 'ok'. Con la fila, 'ya_comprado'.
  v_res := public.aplicar_movimiento(
    v_uid, 'compra', -v_precio::bigint,
    'compra:' || v_uid::text || ':' || p_tipo || ':' || p_articulo,
    'inventario', p_tipo || ':' || p_articulo, 'Tienda · ' || p_tipo || ' ' || p_articulo);

  if v_res.motivo = 'saldo_insuficiente' then
    return 'sin_saldo';
  end if;
  if v_res.motivo = 'repetido' then
    if exists (select 1 from public.inventario i
                where i.jugador_id = v_uid and i.tipo = p_tipo and i.articulo = p_articulo) then
      return 'ya_comprado';
    end if;
  elsif v_res.motivo <> 'aplicado' then
    return v_res.motivo;
  end if;

  -- 8 · comprar lo pone en uso. Dos sentencias: el índice parcial se comprueba
  -- fila a fila y no admitiría encender antes de apagar.
  update public.inventario
     set en_uso = false
   where jugador_id = v_uid and tipo = p_tipo and en_uso;
  insert into public.inventario (jugador_id, tipo, articulo, tono, en_uso)
  values (v_uid, p_tipo, p_articulo, v_tono, true);

  return 'ok';
end
$fn$;

comment on function public.comprar_articulo(text, text, text) is
  'TIE-1 1a · Compra un artículo de la tienda con la billetera (movimiento compra, clave compra:<jugador>:<tipo>:<articulo>) y lo pone en uso. Motivo cerrado en text; nunca lanza.';


-- ── 4 · usar_articulo ──────────────────────────────────────────────────────
-- Pone en uso un artículo comprado y apaga el resto del tipo. El gratis (el
-- verde) apaga todos. Gratis: sin límite y sin libro.
-- Motivos: 'ok' · 'sin_sesion' · 'tipo_invalido' · 'no_existe' · 'no_comprado'.
create or replace function public.usar_articulo(p_tipo text, p_articulo text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.profiles p where p.id = v_uid) then
    return 'sin_sesion';
  end if;
  if not public.inventario_tipo_valido(p_tipo) then
    return 'tipo_invalido';
  end if;
  if not public.articulo_gratis(p_tipo, p_articulo) and public.precio_articulo(p_tipo, p_articulo) is null then
    return 'no_existe';
  end if;

  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;

  if not public.articulo_gratis(p_tipo, p_articulo)
     and not exists (select 1 from public.inventario i
                      where i.jugador_id = v_uid and i.tipo = p_tipo and i.articulo = p_articulo) then
    return 'no_comprado';
  end if;

  update public.inventario
     set en_uso = false
   where jugador_id = v_uid and tipo = p_tipo and en_uso and articulo is distinct from p_articulo;
  update public.inventario
     set en_uso = true
   where jugador_id = v_uid and tipo = p_tipo and articulo = p_articulo and not en_uso;

  return 'ok';
end
$fn$;

comment on function public.usar_articulo(text, text) is
  'TIE-1 1a · Pone en uso un artículo comprado (apaga el resto del tipo); el gratis (tapete verde) apaga todos. Motivo cerrado en text; nunca lanza.';


-- ── 5 · elegir_tono ────────────────────────────────────────────────────────
-- Cambia el tono de un artículo comprado, esté en uso o no. Gratis.
-- Motivos: 'ok' · 'sin_sesion' · 'tipo_invalido' · 'no_existe' · 'sin_tono'
-- · 'tono_invalido' · 'no_comprado'.
create or replace function public.elegir_tono(p_tipo text, p_articulo text, p_tono text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.profiles p where p.id = v_uid) then
    return 'sin_sesion';
  end if;
  if not public.inventario_tipo_valido(p_tipo) then
    return 'tipo_invalido';
  end if;
  if not public.articulo_gratis(p_tipo, p_articulo) and public.precio_articulo(p_tipo, p_articulo) is null then
    return 'no_existe';
  end if;
  if not public.articulo_con_tonos(p_tipo, p_articulo) then
    return 'sin_tono';
  end if;
  if p_tono is null or p_tono not in ('claro', 'actual', 'oscuro') then
    return 'tono_invalido';
  end if;

  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;

  update public.inventario
     set tono = p_tono
   where jugador_id = v_uid and tipo = p_tipo and articulo = p_articulo;
  if not found then
    return 'no_comprado';
  end if;

  return 'ok';
end
$fn$;

comment on function public.elegir_tono(text, text, text) is
  'TIE-1 1a · Cambia el tono (claro, actual, oscuro) de un artículo comprado. Gratis. Motivo cerrado en text; nunca lanza.';


-- ── 6 · mi_inventario ──────────────────────────────────────────────────────
-- Lo que tiene el jugador de la sesión, con tono y en uso; con `p_tipo`, sólo
-- ese tipo. Sin sesión, nada (conjunto vacío, nunca una fila de nulos: SAL-B1
-- A2). `security invoker`: la RLS ya lo limita a lo propio; el filtro por
-- `auth.uid()` lo repite para quien no tiene RLS (service_role).
create or replace function public.mi_inventario(p_tipo text default null)
returns setof public.inventario
language sql
stable
security invoker
set search_path = ''
as $fn$
  select i.*
    from public.inventario i
   where i.jugador_id = auth.uid()
     and (p_tipo is null or i.tipo = p_tipo)
   order by i.tipo, i.adquirido_en, i.articulo
$fn$;

comment on function public.mi_inventario(text) is
  'TIE-1 1a · El inventario del jugador de la sesión (todo, o un tipo). Es lo que la tienda y useTapetes leen al entrar.';


-- ── 7 · Cerraduras y permisos ──────────────────────────────────────────────
-- La tabla: el jugador LEE lo suyo (RLS); no escribe nada. Las tres que
-- escriben son `security definer`. Lección de la 1e: lo propio del jugador en
-- tabla aparte y no en `profiles`, que cualquiera lee entera.
alter table public.inventario enable row level security;
revoke all on table public.inventario from public, anon, authenticated;
grant  select on table public.inventario to authenticated;

drop policy if exists inventario_propio_select on public.inventario;
create policy inventario_propio_select on public.inventario
  for select to authenticated
  using (jugador_id = (select auth.uid()));

-- El catálogo: interno. La tienda pinta los precios de `config/tapetes.js` y
-- el servidor cobra con éstos.
revoke execute on function public.inventario_tipo_valido(text)       from public, anon, authenticated;
revoke execute on function public.precio_articulo(text, text)        from public, anon, authenticated;
revoke execute on function public.articulo_con_tonos(text, text)     from public, anon, authenticated;
revoke execute on function public.articulo_gratis(text, text)        from public, anon, authenticated;

-- Las cuatro del cliente: sólo `authenticated` (y `service_role`, el backend).
revoke execute on function public.comprar_articulo(text, text, text) from public, anon;
revoke execute on function public.usar_articulo(text, text)          from public, anon;
revoke execute on function public.elegir_tono(text, text, text)      from public, anon;
revoke execute on function public.mi_inventario(text)                from public, anon;
grant  execute on function public.comprar_articulo(text, text, text) to authenticated, service_role;
grant  execute on function public.usar_articulo(text, text)          to authenticated, service_role;
grant  execute on function public.elegir_tono(text, text, text)      to authenticated, service_role;
grant  execute on function public.mi_inventario(text)                to authenticated, service_role;
