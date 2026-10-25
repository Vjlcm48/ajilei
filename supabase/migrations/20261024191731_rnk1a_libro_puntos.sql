-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · RNK-1 · Fase 1a — El libro de puntos y las RPC del ranking
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_RNK-1_Fase1a_v1.0.md §3. Normativo: docs/AJILEI_Rankings_v1.0.md
-- (§2 la tabla, §3 el libro, §5 quién entra, §7 el mini-perfil, §9 privacidad).
-- Hechos: docs/reportes/AJILEI_RNK-1_Fase0_Informe_v1.0.md §B, §D y §K.
--
-- Va SOBRE el libro de dinero de ECO-1 (1a), las mesas contra las IAS (1c) y
-- los límites de la 1d/1g. No mueve dinero ni toca ninguna función de dinero.
--
-- ── LO QUE ESTE ARCHIVO PONE EN LA BASE ───────────────────────────────────
--   · `libro_puntos`     una línea por mano ganada, imborrable. Los puntos los
--                        deriva el servidor; el cliente nunca manda una cifra.
--   · `puntos_totales`   una fila por jugador con al menos 1 punto, mantenida
--                        SOLO por disparador desde el libro.
--   · `billeteras_ranking_idx` el índice de «Las grandes fortunas».
--   · `mesas_ia`         dos columnas: `mano_informada` (la última mano con fin
--                        anotado) y `manos_recientes` (el tope por minuto).
--   · `informar_pila`    REDEFINIDA con `p_fin_mano` y `p_fin_ajilei`: escribe
--                        el libro en el mismo bloque que ya escribe
--                        `record_manos`. La firma vieja de 5 se BORRA.
--   · `puesto_maestros`, `puesto_fortunas`: el orden de los rankings, UNO
--                        (Ajuste A, decisión de Victor del 2026-10-24): puesto
--                        único por cifra, luego quién llegó antes, luego nombre.
--   · `ranking_top`, `ranking_mio`, `mini_perfil`: las tres lecturas del
--                        cliente. Ninguna devuelve un uuid ni un correo.
--
-- ── LA DOCTRINA DE ECO-1, QUE AQUÍ SIGUE ──────────────────────────────────
-- 1. El cliente no lee ni escribe tablas: RLS sin políticas y sin privilegios
--    de tabla. Sólo habla con las RPC.
-- 2. Todo cuelga de `auth.uid()`; ninguna función de cliente recibe un uuid.
-- 3. Sin `raise` en los caminos de negocio (SAL-B1 A1): un fin de mano que no
--    cuadra es una ANOMALÍA anotada en la mesa, y la pila sigue su curso.
-- 4. Nada de compuestos nulos (SAL-B1 A2): las lecturas son `returns table` y
--    «no hay» es CERO FILAS (`return;`), nunca una fila de nulos.
-- 5. Nada entra en Realtime.
--
-- ── IDEMPOTENCIA DEL ARCHIVO ──────────────────────────────────────────────
-- `if not exists`, `create or replace` y `drop … if exists` en todo: el
-- archivo entero se puede volver a pasar.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Las cifras, espejo del cliente ─────────────────────────────────────
-- La tabla del normativo §2.2 vive en el `check` de coherencia de §2 (la
-- última red, que ni un `insert` a mano puede saltar) y en estas dos
-- funciones, que son lo que usa `informar_pila`. Si una se mueve sin la otra,
-- el `insert` del libro revienta: lo caza la prueba B8 del guion.

-- Puntos por mano ganada contra las IAS, por reto. Espejo: `NIVELES[].puntos`
-- en src/config/niveles.js (`puntosDe`). Un reto desconocido da `null`, y con
-- él el `check` del libro rechaza la línea.
create or replace function public.puntos_reto_ia(p_reto text)
returns smallint
language sql
immutable
set search_path = ''
as $fn$
  select case p_reto
    when 'basico'   then 1
    when 'avanzado' then 2
    when 'pro'      then 3
  end::smallint
$fn$;

-- El adicional del AJILEI (normativo §2.4): 51 → +1, 52 → +2, nada → 0.
create or replace function public.extra_ajilei(p_ajilei smallint)
returns smallint
language sql
immutable
set search_path = ''
as $fn$
  select case p_ajilei when 51 then 1 when 52 then 2 else 0 end::smallint
$fn$;

-- El tope de fines de mano por mesa y por minuto (ficha §3.2.1). Una mano de
-- verdad dura más de 5 s incluso con «Partida rápida»: 12 por minuto sólo lo
-- alcanza un cliente que inventa manos.
create or replace function public.ia_tope_manos_minuto()
returns integer language sql immutable set search_path = ''
as $fn$ select 12 $fn$;

-- La franja «dentro del N %» (ficha §3.3): ceil(puesto · 100 / total / 5) · 5.
-- Se calcula en enteros —ceil(puesto · 20 / total), por 5— para que ningún
-- redondeo decimal empuje un 5 % exacto al 10 %. Puesto 28 de 100 → 30;
-- puesto 1 de 3 → 35; puesto 1 de 1 → 100. Sólo se llama con total ≥ 1.
create or replace function public.ranking_franja(p_puesto integer, p_total integer)
returns smallint
language sql
immutable
set search_path = ''
as $fn$
  select (((p_puesto * 20 + p_total - 1) / p_total) * 5)::smallint
$fn$;


-- ── 2 · El libro de puntos (normativo §3) ──────────────────────────────────
-- Molde: `movimientos` (ECO-1a §3). Una línea por mano ganada.
--
--   origen       'ias' o 'humanos'. 'humanos' lo admite el esquema, pero
--                ninguna función lo escribe todavía (MOT-1).
--   nivel        el reto, sólo con origen 'ias'.
--   sentados     contra las IAS, los vivos de la mano (el mismo número que
--                `record_manos.vivos`); contra humanos, `handRules.ruleN`.
--   puntos_base  la tabla del normativo §2.2, comprobada por el `check`.
--   ajilei/extra 0/51/52 y su 0/1/2; el 52 sólo en mesa de 5 (§2.4).
--   mesa_id      SIN FK: en 'humanos' apuntará a la mesa de MOT-1.
--   mano         el número de mano dentro de esa mesa, desde 1.
--
-- `unique (origen, mesa_id, mano)`: un reintento por cualquier camino no
-- escribe dos veces la misma mano.
create table if not exists public.libro_puntos (
  id           bigint      generated always as identity primary key,
  jugador_id   uuid        not null references public.profiles(id) on delete cascade,
  creado_en    timestamptz not null default now(),
  origen       text        not null,
  nivel        text,
  sentados     smallint    not null,
  puntos_base  smallint    not null,
  ajilei       smallint    not null default 0,
  extra        smallint    not null,
  mesa_id      uuid        not null,
  mano         integer     not null,

  constraint libro_puntos_mano_uniq       unique (origen, mesa_id, mano),
  constraint libro_puntos_origen_chk      check (origen in ('ias', 'humanos')),
  constraint libro_puntos_nivel_chk       check (nivel in ('basico', 'avanzado', 'pro')),
  constraint libro_puntos_nivel_ias_chk   check ((origen = 'ias') = (nivel is not null)),
  constraint libro_puntos_sentados_chk    check (sentados between 2 and 5),
  constraint libro_puntos_base_rango_chk  check (puntos_base between 1 and 8),
  constraint libro_puntos_ajilei_chk      check (ajilei in (0, 51, 52)),
  constraint libro_puntos_ajilei52_chk    check (ajilei <> 52 or sentados = 5),
  constraint libro_puntos_extra_chk       check (extra = case ajilei when 51 then 1 when 52 then 2 else 0 end),
  -- La tabla del normativo §2.2, escrita en la base: ni un `insert` a mano
  -- puede poner una cifra que la contradiga.
  constraint libro_puntos_base_chk        check (puntos_base = case
                                             when origen = 'ias' then
                                               case nivel when 'basico' then 1 when 'avanzado' then 2 when 'pro' then 3 end
                                             else sentados + 3
                                           end),
  constraint libro_puntos_mano_chk        check (mano >= 1)
);

create index if not exists libro_puntos_jugador_creado_idx
  on public.libro_puntos (jugador_id, creado_en);

comment on table public.libro_puntos is
  'RNK-1a · Una línea por mano ganada. Los puntos base los deriva el servidor; el cliente nunca manda una cifra de puntos (INV-65).';

-- ── «No se borra ni se edita», escrito en la base ──────────────────────────
-- Copia de `movimientos_inmutable` (ECO-1a §3): sólo pasa el borrado EN
-- CASCADA al borrar la cuenta, que llega con `pg_trigger_depth() >= 2` porque
-- lo ejecuta el disparador interno de la FK (K-12); un `delete` a mano llega
-- con 1 y se rechaza. El `truncate` lleva el suyo.
create or replace function public.libro_puntos_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() >= 2 then
    return old;
  end if;
  raise exception 'libro_puntos_inmutable' using errcode = 'P0001',
    hint = 'El libro de puntos es de sólo inserción.';
end
$fn$;

drop trigger if exists libro_puntos_inmutable_trg on public.libro_puntos;
create trigger libro_puntos_inmutable_trg
  before update or delete on public.libro_puntos
  for each row execute function public.libro_puntos_inmutable();

drop trigger if exists libro_puntos_sin_truncate_trg on public.libro_puntos;
create trigger libro_puntos_sin_truncate_trg
  before truncate on public.libro_puntos
  for each statement execute function public.libro_puntos_inmutable();


-- ── 3 · El total por jugador ───────────────────────────────────────────────
-- Lo que leen el ranking y el mini-perfil, para no sumar el libro en cada
-- visita (normativo §3: «se mantiene por disparador desde el libro, nunca
-- escribiendo el total a mano»). La fila nace con la primera línea del libro,
-- así que «tiene ≥ 1 punto» ⇔ «tiene fila» (normativo §5).
create table if not exists public.puntos_totales (
  jugador_id      uuid        primary key references public.profiles(id) on delete cascade,
  puntos          bigint      not null default 0,
  manos           integer     not null default 0,
  ajileis         integer     not null default 0,
  actualizado_en  timestamptz not null default now(),

  constraint puntos_totales_puntos_chk check (puntos >= 0)
);

-- El orden del ranking (Ajuste A): puntos de mayor a menor y, en el empate,
-- quien llegó antes a esa cifra.
create index if not exists puntos_totales_ranking_idx
  on public.puntos_totales (puntos desc, actualizado_en asc, jugador_id);

comment on table public.puntos_totales is
  'RNK-1a · Total de puntos por jugador. Sólo lo escribe el disparador libro_puntos_suma_total; puntos = Σ (puntos_base + extra) del libro.';
comment on column public.puntos_totales.actualizado_en is
  'RNK-1a · Cuándo llegó a la cifra actual (clock_timestamp de la última línea). Desempata el ranking: antes, más arriba.';

-- ── El total sólo se mueve por el libro ────────────────────────────────────
-- Copia del patrón `billeteras_solo_por_libro` (ECO-1a §2), con su propia
-- marca de sesión, `ajilei.puntos`, que pone y quita el disparador del libro
-- pegada a su `insert … on conflict`. A diferencia de `billeteras`, vigila
-- TODAS las columnas: sin la marca no entra ni cambia nada.
--   · INSERT / UPDATE  sólo con la marca.
--   · DELETE           sólo en cascada al borrar la cuenta (depth ≥ 2).
--   · TRUNCATE         nunca.
-- Como en `billeteras`, es una guarda contra el error, no una frontera de
-- seguridad: quien tiene SQL puede poner la marca a mano.
create or replace function public.puntos_totales_solo_por_libro()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op in ('INSERT', 'UPDATE')
     and coalesce(pg_catalog.current_setting('ajilei.puntos', true), '') = 'si' then
    return new;
  elsif tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() >= 2 then
    return old;
  end if;
  raise exception 'puntos_totales_solo_por_libro' using errcode = 'P0001',
    hint = 'El total sólo cambia con una línea en public.libro_puntos.';
end
$fn$;

drop trigger if exists puntos_totales_solo_por_libro_trg on public.puntos_totales;
create trigger puntos_totales_solo_por_libro_trg
  before insert or update or delete on public.puntos_totales
  for each row execute function public.puntos_totales_solo_por_libro();

drop trigger if exists puntos_totales_sin_truncate_trg on public.puntos_totales;
create trigger puntos_totales_sin_truncate_trg
  before truncate on public.puntos_totales
  for each statement execute function public.puntos_totales_solo_por_libro();

-- ── Cada línea del libro suma en el total ──────────────────────────────────
-- `security definer` porque escribe en `puntos_totales`: así funciona quien
-- sea el que inserte en el libro (hoy, `informar_pila`; mañana, MOT-1).
--
-- `actualizado_en` es «cuándo llegó a esta cifra», el desempate del ranking
-- (Ajuste A). Va con `clock_timestamp()` y no con `now()`: `now()` es la hora
-- de la TRANSACCIÓN, y dos líneas de la misma transacción (MOT-1 repartiendo
-- una mano, o un guion) llegarían «a la vez» aunque una fuera después.
create or replace function public.libro_puntos_suma_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform pg_catalog.set_config('ajilei.puntos', 'si', true);
  insert into public.puntos_totales as t (jugador_id, puntos, manos, ajileis, actualizado_en)
  values (new.jugador_id, new.puntos_base + new.extra, 1, (new.ajilei > 0)::integer,
          pg_catalog.clock_timestamp())
  on conflict (jugador_id) do update
    set puntos         = t.puntos + excluded.puntos,
        manos          = t.manos + 1,
        ajileis        = t.ajileis + excluded.ajileis,
        actualizado_en = excluded.actualizado_en;
  perform pg_catalog.set_config('ajilei.puntos', '', true);
  return null;
end
$fn$;

drop trigger if exists libro_puntos_suma_total_trg on public.libro_puntos;
create trigger libro_puntos_suma_total_trg
  after insert on public.libro_puntos
  for each row execute function public.libro_puntos_suma_total();


-- ── 4 · El índice de «Las grandes fortunas» ────────────────────────────────
-- Fortunas = sólo la billetera (Fase 0 §K, aceptada). El desempate es
-- `actualizada_en`, que `aplicar_movimiento` pone a cada cambio de saldo: es
-- «cuándo llegó a este saldo» (Ajuste A).
create index if not exists billeteras_ranking_idx
  on public.billeteras (saldo desc, actualizada_en asc, jugador_id);


-- ── 5 · Lo que la mesa recuerda de los fines de mano ───────────────────────
--   mano_informada   la última mano con fin anotado, haya ganado o no. Un fin
--                    con una mano que no la supera es una anomalía.
--   manos_recientes  las horas de los fines anotados en los últimos 60 s, a lo
--                    sumo `ia_tope_manos_minuto()`. Es una ventana DESLIZANTE
--                    exacta: el 13.º fin en cualquier tramo de 60 s es una
--                    anomalía, también a caballo de dos minutos de reloj (con
--                    un contador por minuto fijo cabrían 24 en dos segundos).
--                    Sólo cuentan los fines anotados: uno rechazado no alarga
--                    el castigo de nadie.
alter table public.mesas_ia add column if not exists mano_informada  integer       not null default 0;
alter table public.mesas_ia add column if not exists manos_recientes timestamptz[] not null default '{}';

alter table public.mesas_ia drop constraint if exists mesas_ia_mano_informada_chk;
alter table public.mesas_ia add constraint mesas_ia_mano_informada_chk check (mano_informada >= 0);

comment on column public.mesas_ia.mano_informada is
  'RNK-1a · Última mano con fin de mano anotado (ganada o no). La siguiente debe ser mayor.';
comment on column public.mesas_ia.manos_recientes is
  'RNK-1a · Horas de los fines anotados en los últimos 60 s (tope ia_tope_manos_minuto()).';


-- ── 6 · informar_pila, con el libro ────────────────────────────────────────
-- NO MUEVE DINERO. El cuerpo es el de la 1c (20261008220239_eco1c_mesas_ia.sql
-- §8) más las líneas marcadas «RNK-1a»; nada más cambia, y `record_manos`
-- sigue escribiéndose igual.
--
-- La firma crece por el final, con defecto, así que la llamada de hoy (cinco
-- argumentos con nombre, por PostgREST) sigue valiendo. La firma vieja se
-- BORRA antes de crear la nueva: con las dos vivas, una llamada de cinco
-- argumentos sería ambigua para PostgREST. Se borra y se crea en la misma
-- transacción del `db push`, así que ningún aviso encuentra el hueco.
--
-- EL FIN DE MANO (C7 y RNK-1a). Cualquiera de los cuatro parámetros `p_fin_*`
-- presente = es fin de mano. Sólo cuenta con un seq nuevo, así que un
-- reintento no suma dos veces. Se anota en `record_manos` si cuadra; y si
-- además trae `p_fin_mano`, pasa también por el libro:
--   · `vivos` fuera de 2…jugadores, o sin `vivos`/`gano`  → anomalía.
--   · sin `p_fin_mano` (cliente de antes de la 1b)        → `record_manos`
--     como hoy, pero ni libro, ni `mano_informada`, ni tope.
--   · `p_fin_mano` < 1 o que no supera la última mano de la mesa (en el libro
--     y en `mano_informada`)                              → anomalía.
--   · `p_fin_ajilei` fuera de {0, 51, 52} (nulo = 0)     → anomalía.
--   · `p_fin_ajilei` = 52 con `vivos` ≠ 5                 → anomalía.
--   · más de 12 fines anotados en 60 s en esta mesa       → anomalía.
-- Una anomalía NO anota el fin en ningún sitio, como hoy con `vivos`
-- imposibles; la pila se guarda igual.
-- Si cuadra: `record_manos`, `mano_informada`, la hora en `manos_recientes`, y
-- si ganó, la línea del libro. Perder no se registra en el libro (§2.1), ni
-- un AJILEI sin ganar la mano (§2.5).
--
-- Si la mesa ya está cerrada lo dice (`mesa_cerrada`, C6).
drop function if exists public.informar_pila(uuid, integer, bigint, integer, boolean);

create or replace function public.informar_pila(
  p_mesa        uuid,
  p_seq         integer,
  p_pila        bigint,
  p_fin_vivos   integer  default null,
  p_fin_gano    boolean  default null,
  p_fin_mano    integer  default null,
  p_fin_ajilei  smallint default null
)
returns public.mesa_ia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid       uuid := auth.uid();
  v_mesa      public.mesas_ia;
  v_pila      bigint;
  v_anomalias integer := 0;
  v_fin       boolean := p_fin_vivos is not null or p_fin_gano is not null
                         or p_fin_mano is not null or p_fin_ajilei is not null;   -- RNK-1a
  v_vacia     public.mesas_ia;
  v_ajilei    smallint := coalesce(p_fin_ajilei, 0);                            -- RNK-1a
  v_anota     boolean := false;   -- RNK-1a · el fin cuadra: va a record_manos
  v_libro     boolean := false;   -- RNK-1a · además trae su mano: pasa por el libro
  v_ultima    integer;            -- RNK-1a · la última mano de la mesa en el libro
  v_recientes timestamptz[];      -- RNK-1a · los fines anotados en los últimos 60 s
begin
  if v_uid is null then
    return public.ia_respuesta('sin_sesion', v_uid, v_vacia);
  end if;
  if p_mesa is null or p_seq is null or p_pila is null or p_pila < 0 then
    return public.ia_respuesta('argumento_invalido', v_uid, v_vacia);
  end if;
  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;

  select m.* into v_mesa from public.mesas_ia m
   where m.id = p_mesa and m.jugador_id = v_uid for update;
  if not found then
    return public.ia_respuesta('sin_mesa', v_uid, v_vacia);
  end if;
  if v_mesa.estado <> 'abierta' then
    return public.ia_respuesta('mesa_cerrada', v_uid, v_mesa);
  end if;
  if p_seq <= v_mesa.seq_informada then
    return public.ia_respuesta('repetido', v_uid, v_mesa);
  end if;

  v_pila := p_pila;
  if v_pila > v_mesa.techo_cobro then
    v_pila := v_mesa.techo_cobro;
    v_anomalias := v_anomalias + 1;
  end if;

  if v_fin then
    if p_fin_vivos is null or p_fin_gano is null
       or p_fin_vivos < 2 or p_fin_vivos > v_mesa.jugadores then
      v_anomalias := v_anomalias + 1;
    -- RNK-1a · desde aquí hasta el `end if` del fin
    elsif p_fin_mano is null then
      v_anota := true;
    else
      select max(l.mano) into v_ultima
        from public.libro_puntos l
       where l.origen = 'ias' and l.mesa_id = v_mesa.id;
      v_recientes := coalesce(
        (select pg_catalog.array_agg(t order by t)
           from pg_catalog.unnest(v_mesa.manos_recientes) as t
          where t > now() - interval '60 seconds'),
        '{}');
      if p_fin_mano < 1
         or p_fin_mano <= v_mesa.mano_informada
         or p_fin_mano <= coalesce(v_ultima, 0)
         or v_ajilei not in (0, 51, 52)
         or (v_ajilei = 52 and p_fin_vivos <> 5)
         or coalesce(pg_catalog.array_length(v_recientes, 1), 0) >= public.ia_tope_manos_minuto() then
        v_anomalias := v_anomalias + 1;
      else
        v_anota := true;
        v_libro := true;
      end if;
    end if;
  end if;

  if v_anota then
    insert into public.record_manos as r
      (jugador_id, reto, vivos, jugadas, ganadas_humano, ganadas_ia)
    values
      (v_uid, v_mesa.reto, p_fin_vivos, 1,
       case when p_fin_gano then 1 else 0 end,
       case when p_fin_gano then 0 else 1 end)
    on conflict (jugador_id, reto, vivos) do update
      set jugadas        = r.jugadas + 1,
          ganadas_humano = r.ganadas_humano + excluded.ganadas_humano,
          ganadas_ia     = r.ganadas_ia + excluded.ganadas_ia,
          actualizado_en = now();
  end if;

  -- RNK-1a · la línea del libro. Todo lo que comprueban sus `check` ya se
  -- comprobó arriba (reto de la mesa, vivos 2…5, ajilei y su 52), así que este
  -- `insert` no puede abortar el aviso.
  if v_libro and p_fin_gano then
    insert into public.libro_puntos
      (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values
      (v_uid, 'ias', v_mesa.reto, p_fin_vivos, public.puntos_reto_ia(v_mesa.reto),
       v_ajilei, public.extra_ajilei(v_ajilei), v_mesa.id, p_fin_mano)
    on conflict (origen, mesa_id, mano) do nothing;
  end if;

  update public.mesas_ia
     set pila_informada  = v_pila,
         seq_informada   = p_seq,
         anomalias       = anomalias + v_anomalias,
         ultimo_aviso_en = now(),
         mano_informada  = case when v_libro then p_fin_mano else mano_informada end,      -- RNK-1a
         manos_recientes = case when v_libro then v_recientes || now() else manos_recientes end   -- RNK-1a
   where id = v_mesa.id
  returning * into v_mesa;

  return public.ia_respuesta('ok', v_uid, v_mesa);
end
$fn$;


-- ── 7 · El puesto: único, por cifra y por quién llegó antes (Ajuste A) ─────
-- Decisión de Victor del 2026-10-24: sin puestos compartidos. El orden de los
-- dos rankings es UNO, y vive en estas dos funciones y en `ranking_top`:
--   1. la cifra, de mayor a menor;
--   2. quien llegó antes a esa cifra (`puntos_totales.actualizado_en`,
--      `billeteras.actualizada_en`), antes = más arriba;
--   3. el nombre sin mayúsculas, como último recurso (único por
--      `profiles_username_lower_uniq`, así que el orden es total).
-- puesto = 1 + cuántos van delante con ese orden. Sin fila → `null`.
--
-- El `>= v_cifra` de delante es para el índice: acota la lectura al tramo de
-- arriba, y el resto de la condición decide dentro del empate.
create or replace function public.puesto_maestros(p_jugador uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_cifra  bigint;
  v_fecha  timestamptz;
  v_nombre text;
  v_delante integer;
begin
  select t.puntos, t.actualizado_en, lower(p.username) into v_cifra, v_fecha, v_nombre
    from public.puntos_totales t
    join public.profiles p on p.id = t.jugador_id
   where t.jugador_id = p_jugador;
  if not found then
    return null;
  end if;
  select count(*) into v_delante
    from public.puntos_totales t
   where t.puntos >= v_cifra
     and (t.puntos > v_cifra
          or t.actualizado_en < v_fecha
          or (t.actualizado_en = v_fecha
              and lower((select p.username from public.profiles p where p.id = t.jugador_id)) < v_nombre));
  return v_delante + 1;
end
$fn$;

create or replace function public.puesto_fortunas(p_jugador uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_cifra  bigint;
  v_fecha  timestamptz;
  v_nombre text;
  v_delante integer;
begin
  select b.saldo, b.actualizada_en, lower(p.username) into v_cifra, v_fecha, v_nombre
    from public.billeteras b
    join public.profiles p on p.id = b.jugador_id
   where b.jugador_id = p_jugador;
  if not found then
    return null;
  end if;
  select count(*) into v_delante
    from public.billeteras b
   where b.saldo >= v_cifra
     and (b.saldo > v_cifra
          or b.actualizada_en < v_fecha
          or (b.actualizada_en = v_fecha
              and lower((select p.username from public.profiles p where p.id = b.jugador_id)) < v_nombre));
  return v_delante + 1;
end
$fn$;


-- ── 8 · ranking_top ────────────────────────────────────────────────────────
-- Los 100 primeros de un ranking: 'maestros' (puntos_totales) o 'fortunas'
-- (billeteras). Otro nombre, o sin sesión → cero filas.
--
--   puesto  `row_number()` con el orden de §7: único, 1-2-3-4 (Ajuste A).
--   corte   100 FILAS exactas (decisión de Victor).
--   es_tu   la fila del jugador de la sesión.
--
-- POR EL ÍNDICE. Primero se lee la cifra de la fila 100 (`offset 99` sobre el
-- índice del ranking) y luego sólo las filas con esa cifra o más: todo lo que
-- va delante de una de ellas tiene su cifra o más, así que también está
-- dentro, y el `row_number()` de ese tramo es el de toda la tabla. Con menos
-- de 100 filas no hay corte y entran todas.
create or replace function public.ranking_top(p_ranking text)
returns table (puesto integer, username text, cifra bigint, es_tu boolean)
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
             p.username, t.puntos, t.jugador_id = v_uid
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
             p.username, b.saldo, b.jugador_id = v_uid
        from public.billeteras b
        join public.profiles p on p.id = b.jugador_id
       where v_corte is null or b.saldo >= v_corte
       order by b.saldo desc, b.actualizada_en, lower(p.username)
       limit 100;
  end if;
  return;
end
$fn$;


-- ── 9 · ranking_mio ────────────────────────────────────────────────────────
-- El puesto del jugador de la sesión, aunque esté fuera del top 100.
--   · 'maestros' sin fila en puntos_totales → CERO FILAS: el cliente lee
--     «vacío» y pinta «Gana tu primera mano para entrar» (normativo §5).
--   · 'fortunas' sin billetera → cero filas (no debería pasar: todos la
--     tienen desde el Bautizo).
--   puesto = `puesto_maestros` / `puesto_fortunas` (§7), el mismo orden que
--            `ranking_top`.
--   total  = filas del ranking (puntos_totales o billeteras).
--   franja = `ranking_franja(puesto, total)`.
create or replace function public.ranking_mio(p_ranking text)
returns table (puesto integer, total integer, franja smallint, cifra bigint)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_cifra  bigint;
  v_puesto integer;
  v_total  integer;
begin
  if v_uid is null then
    return;
  end if;

  if p_ranking = 'maestros' then
    select t.puntos into v_cifra from public.puntos_totales t where t.jugador_id = v_uid;
    if not found then
      return;
    end if;
    v_puesto := public.puesto_maestros(v_uid);
    select count(*) into v_total from public.puntos_totales;

  elsif p_ranking = 'fortunas' then
    select b.saldo into v_cifra from public.billeteras b where b.jugador_id = v_uid;
    if not found then
      return;
    end if;
    v_puesto := public.puesto_fortunas(v_uid);
    select count(*) into v_total from public.billeteras;

  else
    return;
  end if;

  return query
    select v_puesto, v_total, public.ranking_franja(v_puesto, v_total), v_cifra;
end
$fn$;


-- ── 10 · mini_perfil ───────────────────────────────────────────────────────
-- Lo público de un jugador, por su nombre (sin mayúsculas, por el índice único
-- `profiles_username_lower_uniq`). No encontrado, o sin sesión → cero filas.
--   puesto_maestros, puntos  nulos si no tiene ningún punto.
--   puesto_fortunas, saldo   el saldo es público por decisión (normativo §7.1).
-- Los puestos, por §7: los mismos que ve el jugador en `ranking_mio`.
-- NO devuelve correo ni uuid (normativo §9, INV-67 propuesto): para el perfil
-- propio, el cliente ya tiene el correo por la sesión.
create or replace function public.mini_perfil(p_username text)
returns table (username text, puesto_maestros integer, puntos bigint, puesto_fortunas integer, saldo bigint)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid;
  v_nombre text;
  v_puntos bigint;
  v_saldo  bigint;
begin
  if v_uid is null or p_username is null then
    return;
  end if;

  select p.id, p.username into v_id, v_nombre
    from public.profiles p
   where lower(p.username) = lower(p_username);
  if not found then
    return;
  end if;

  select t.puntos into v_puntos from public.puntos_totales t where t.jugador_id = v_id;
  select b.saldo  into v_saldo  from public.billeteras b     where b.jugador_id = v_id;

  return query
    select v_nombre, public.puesto_maestros(v_id), v_puntos, public.puesto_fortunas(v_id), v_saldo;
end
$fn$;


-- ── 11 · Cerraduras y permisos ─────────────────────────────────────────────
-- Como en ECO-1: RLS sin políticas y sin privilegios de tabla para el cliente;
-- `service_role` conserva lo suyo.
alter table public.libro_puntos   enable row level security;
alter table public.puntos_totales enable row level security;

revoke all on table public.libro_puntos   from public, anon, authenticated;
revoke all on table public.puntos_totales from public, anon, authenticated;

-- Internas: a nadie.
revoke execute on function public.puntos_reto_ia(text)                 from public, anon, authenticated;
revoke execute on function public.extra_ajilei(smallint)               from public, anon, authenticated;
revoke execute on function public.ia_tope_manos_minuto()               from public, anon, authenticated;
revoke execute on function public.ranking_franja(integer, integer)     from public, anon, authenticated;
revoke execute on function public.libro_puntos_inmutable()             from public, anon, authenticated;
revoke execute on function public.puntos_totales_solo_por_libro()      from public, anon, authenticated;
revoke execute on function public.libro_puntos_suma_total()            from public, anon, authenticated;
revoke execute on function public.puesto_maestros(uuid)                from public, anon, authenticated;
revoke execute on function public.puesto_fortunas(uuid)                from public, anon, authenticated;

-- informar_pila: los mismos permisos que en la 1c, ahora sobre la firma de 7
-- (la de 5 se llevó los suyos al borrarse).
revoke execute on function public.informar_pila(uuid, integer, bigint, integer, boolean, integer, smallint) from public, anon;
grant  execute on function public.informar_pila(uuid, integer, bigint, integer, boolean, integer, smallint) to authenticated, service_role;

-- Las tres lecturas: sólo `authenticated` (ficha §3.3).
revoke execute on function public.ranking_top(text)   from public, anon;
revoke execute on function public.ranking_mio(text)   from public, anon;
revoke execute on function public.mini_perfil(text)   from public, anon;
grant  execute on function public.ranking_top(text)   to authenticated;
grant  execute on function public.ranking_mio(text)   to authenticated;
grant  execute on function public.mini_perfil(text)   to authenticated;


-- ── 12 · Realtime: fuera, y comprobado ─────────────────────────────────────
-- El mismo bloque que ECO-1a §15, para las dos tablas nuevas.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'RNK-1a: supabase_realtime es FOR ALL TABLES; el libro de puntos no puede quedar fuera';
  end if;
  foreach t in array array['libro_puntos', 'puntos_totales'] loop
    if exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — Grupo A y Grupo B
-- ═══════════════════════════════════════════════════════════════════════════
-- Abajo, comentado, el guion entero: es copia literal de
-- `supabase/pruebas/rnk1a_verificacion.sql`, que es el que se pega en el SQL
-- Editor DESPUÉS del push y el que corre `npm run guiones` antes. Devuelve UNA
-- tabla `prueba | resultado | detalle` con el Grupo A (definiciones y
-- permisos) y el Grupo B (comportamiento, con cuentas fabricadas que se
-- deshacen); cada fila debe decir PASA. No deja rastro.
--
-- CORRIDA REAL · pendiente. Va al informe de la 1a de RNK-1; este archivo, una
-- vez aplicado, no se edita.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ COPIA DEL GUION (comentada) ═══
-- -- ═══════════════════════════════════════════════════════════════════════════
-- -- AJILEI · RNK-1 · Fase 1a — Verificación del libro de puntos y las RPC
-- -- ═══════════════════════════════════════════════════════════════════════════
-- -- Ficha AJILEI_RNK-1_Fase1a_v1.0.md §4, con el Ajuste A (puesto único).
-- -- Migración que verifica: supabase/migrations/20261024191731_rnk1a_libro_puntos.sql.
-- --
-- -- CÓMO SE USA: como los de ECO-1. Se pega ENTERO en el SQL Editor DESPUÉS del
-- -- push y se corre UNA vez. Devuelve UNA tabla `prueba | resultado | detalle`
-- -- (el Editor sólo enseña el último `select`, y es éste): primero el Grupo A
-- -- (definiciones y permisos), después el Grupo B (comportamiento). Cada fila
-- -- debe decir PASA. No enseña correos ni uuids de cuentas reales.
-- -- Antes del push lo corre `npm run guiones` contra un Postgres en memoria.
-- --
-- -- NO DEJA RASTRO, por los mismos dos caminos que ECO-1: `begin;` … `rollback;`,
-- -- y una función en `pg_temp` que lo corre todo dentro de un bloque con
-- -- `exception` y lo deshace lanzando `rnk1a_deshacer`.
-- --
-- -- LAS CUENTAS. Fabrica siete (rnk_a_verif … rnk_y_verif) y, para el corte del
-- -- top 100, otras 101 (rnkcorte_001 … rnkcorte_101); todas se deshacen. Los
-- -- nombres de la ficha (rnk_a, rnk_b, rnk_c) no caben en la regla de usernames
-- -- (6 a 15 caracteres, SUP-2a), de ahí el `_verif`.
-- --
-- -- EL RELOJ. Todo el guion es UNA transacción: `now()` no se mueve. Lo que el
-- -- guion necesita que pase «después» lo resuelve así:
-- --   · el desempate del ranking lee `clock_timestamp()`, que SÍ avanza; entre
-- --     dos líneas cuyo orden importa hay un `pg_sleep` de 5 ms;
-- --   · «pasó un minuto» para el tope de fines de mano: se envejecen las horas
-- --     de `mesas_ia.manos_recientes` (B21);
-- --   · en Fortunas, el saldo lo mueve `aplicar_movimiento` con `now()`: dos
-- --     saldos iguales llegan «a la vez» y decide el nombre (B14).
-- --
-- -- LA BASE REAL. El guion no supone que las tablas estén vacías: cada puesto se
-- -- compara con `puesto_maestros` / `puesto_fortunas` y con su vecino, no con un
-- -- número fijo. Los números exactos de la ficha (1-2-3-4, franja 25, …) se
-- -- comprueban además cuando sólo hay cuentas fabricadas, que es lo que pasa
-- -- justo tras el push.
-- -- ═══════════════════════════════════════════════════════════════════════════
--
-- begin;
--
-- create function pg_temp.rnk1a_verificar()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   A constant uuid := 'f1a00000-0000-4000-8000-00000000000a';
--   B constant uuid := 'f1a00000-0000-4000-8000-00000000000b';
--   C constant uuid := 'f1a00000-0000-4000-8000-00000000000c';
--   D constant uuid := 'f1a00000-0000-4000-8000-00000000000d';
--   E constant uuid := 'f1a00000-0000-4000-8000-00000000000e';
--   X constant uuid := 'f1a00000-0000-4000-8000-0000000000f1';
--   Y constant uuid := 'f1a00000-0000-4000-8000-0000000000f2';
--   RPC5 constant text := 'public.informar_pila(uuid, integer, bigint, integer, boolean)';
--   RPC7 constant text := 'public.informar_pila(uuid, integer, bigint, integer, boolean, integer, smallint)';
--
--   v_o integer[] := '{}';
--   v_p text[]    := '{}';
--   v_r text[]    := '{}';
--   v_d text[]    := '{}';
--
--   r    public.mesa_ia_resultado;
--   r2   public.mesa_ia_resultado;
--   mz   public.mesas_ia;
--   m_b uuid; m_d uuid; m_e uuid; m_x uuid;
--   t1 text; t2 text; t3 text; e1 text; e2 text; e3 text;
--   n1 bigint; n2 bigint; n3 bigint; n4 bigint; n5 bigint;
--   p1 integer; p2 integer; p3 integer; p4 integer; p5 integer; p6 integer;
--   q1 integer; q2 integer; q3 integer;
--   f1 smallint; f2 smallint; f3 smallint;
--   c1 bigint; c2 bigint;
--   ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean;
--   solo boolean;
--   i integer;
-- begin
--   begin
--     -- ═══ GRUPO A · definiciones y permisos ═══════════════════════════════
--
--     -- ── A1 · las dos tablas ──────────────────────────────────────────────
--     ok1 := to_regclass('public.libro_puntos') is not null and to_regclass('public.puntos_totales') is not null;
--     v_o := v_o || 1; v_p := v_p || 'A1 · existen libro_puntos y puntos_totales'::text;
--     v_r := v_r || case when ok1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('libro_puntos=%s · puntos_totales=%s',
--                          to_regclass('public.libro_puntos') is not null, to_regclass('public.puntos_totales') is not null);
--
--     -- ── A2 · las columnas nuevas de mesas_ia ─────────────────────────────
--     select count(*) into n1 from information_schema.columns
--      where table_schema = 'public' and table_name = 'mesas_ia' and column_name = 'mano_informada'
--        and data_type = 'integer' and is_nullable = 'NO' and column_default = '0';
--     select count(*) into n2 from information_schema.columns
--      where table_schema = 'public' and table_name = 'mesas_ia' and column_name = 'manos_recientes'
--        and data_type = 'ARRAY' and is_nullable = 'NO';
--     v_o := v_o || 2; v_p := v_p || 'A2 · mesas_ia.mano_informada (int, 0) y manos_recientes'::text;
--     v_r := v_r || case when n1 = 1 and n2 = 1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('mano_informada=%s · manos_recientes=%s', n1 = 1, n2 = 1);
--
--     -- ── A3 · los índices (los del ranking, de tres columnas: Ajuste A) ───
--     ok1 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'libro_puntos'
--                     and indexname = 'libro_puntos_jugador_creado_idx' and indexdef like '%(jugador_id, creado_en)');
--     ok2 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'puntos_totales'
--                     and indexname = 'puntos_totales_ranking_idx' and indexdef like '%(puntos DESC, actualizado_en, jugador_id)');
--     ok3 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'billeteras'
--                     and indexname = 'billeteras_ranking_idx' and indexdef like '%(saldo DESC, actualizada_en, jugador_id)');
--     ok4 := exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'libro_puntos'
--                     and indexname = 'libro_puntos_mano_uniq' and indexdef like 'CREATE UNIQUE INDEX%(origen, mesa_id, mano)');
--     v_o := v_o || 3; v_p := v_p || 'A3 · índices: libro, ranking de puntos, ranking de saldo y la mano única'::text;
--     v_r := v_r || case when ok1 and ok2 and ok3 and ok4 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('libro (jugador, creado)=%s · puntos (desc, fecha, jugador)=%s · saldo (desc, fecha, jugador)=%s · único (origen, mesa, mano)=%s',
--                          ok1, ok2, ok3, ok4);
--
--     -- ── A4 · los disparadores ────────────────────────────────────────────
--     select count(*) into n1 from pg_trigger g join pg_class k on k.oid = g.tgrelid
--      where not g.tgisinternal and (k.relname, g.tgname) in (
--        ('libro_puntos',   'libro_puntos_inmutable_trg'),
--        ('libro_puntos',   'libro_puntos_sin_truncate_trg'),
--        ('libro_puntos',   'libro_puntos_suma_total_trg'),
--        ('puntos_totales', 'puntos_totales_solo_por_libro_trg'),
--        ('puntos_totales', 'puntos_totales_sin_truncate_trg'));
--     v_o := v_o || 4; v_p := v_p || 'A4 · disparadores: inmutable, suma al total, total solo por libro (y sin truncate)'::text;
--     v_r := v_r || case when n1 = 5 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('%s de 5', n1);
--
--     -- ── A5 · las tres RPC de lectura y sus ayudantes ─────────────────────
--     ok1 := to_regprocedure('public.ranking_top(text)') is not null
--        and to_regprocedure('public.ranking_mio(text)') is not null
--        and to_regprocedure('public.mini_perfil(text)') is not null;
--     ok2 := to_regprocedure('public.puesto_maestros(uuid)') is not null
--        and to_regprocedure('public.puesto_fortunas(uuid)') is not null
--        and to_regprocedure('public.ranking_franja(integer, integer)') is not null
--        and to_regprocedure('public.puntos_reto_ia(text)') is not null
--        and to_regprocedure('public.extra_ajilei(smallint)') is not null
--        and to_regprocedure('public.ia_tope_manos_minuto()') is not null;
--     v_o := v_o || 5; v_p := v_p || 'A5 · existen ranking_top, ranking_mio, mini_perfil y sus ayudantes'::text;
--     v_r := v_r || case when ok1 and ok2 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('las tres RPC=%s · los seis ayudantes=%s', ok1, ok2);
--
--     -- ── A6 · informar_pila: la firma de 7 y no la de 5 ───────────────────
--     select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
--      where s.nspname = 'public' and f.proname = 'informar_pila';
--     v_o := v_o || 6; v_p := v_p || 'A6 · informar_pila: existe la firma de 7, no la de 5, y es la única'::text;
--     v_r := v_r || case when to_regprocedure(RPC7) is not null and to_regprocedure(RPC5) is null and n1 = 1
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('firma de 7=%s · firma de 5=%s · funciones con ese nombre=%s',
--                          to_regprocedure(RPC7) is not null, to_regprocedure(RPC5) is not null, n1);
--
--     -- ── A7 · RLS activa, sin políticas y sin privilegios de tabla ────────
--     select count(*) into n1 from pg_class k join pg_namespace s on s.oid = k.relnamespace
--      where s.nspname = 'public' and k.relname in ('libro_puntos', 'puntos_totales') and k.relrowsecurity;
--     select count(*) into n2 from pg_policies
--      where schemaname = 'public' and tablename in ('libro_puntos', 'puntos_totales');
--     ok1 := has_table_privilege('anon', 'public.libro_puntos', 'select, insert, update, delete, truncate')
--         or has_table_privilege('authenticated', 'public.libro_puntos', 'select, insert, update, delete, truncate')
--         or has_table_privilege('anon', 'public.puntos_totales', 'select, insert, update, delete, truncate')
--         or has_table_privilege('authenticated', 'public.puntos_totales', 'select, insert, update, delete, truncate');
--     v_o := v_o || 7; v_p := v_p || 'A7 · las dos tablas: RLS activa, cero políticas, el cliente sin privilegios'::text;
--     v_r := v_r || case when n1 = 2 and n2 = 0 and not ok1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('con RLS=%s de 2 · políticas=%s · el cliente tiene algún privilegio=%s', n1, n2, ok1);
--
--     -- ── A8 · anon: sin execute en las RPC nuevas ni en informar_pila ─────
--     ok1 := has_function_privilege('anon', 'public.ranking_top(text)', 'execute')
--         or has_function_privilege('anon', 'public.ranking_mio(text)', 'execute')
--         or has_function_privilege('anon', 'public.mini_perfil(text)', 'execute')
--         or has_function_privilege('anon', RPC7, 'execute');
--     v_o := v_o || 8; v_p := v_p || 'A8 · anon sin execute en ranking_top, ranking_mio, mini_perfil e informar_pila'::text;
--     v_r := v_r || case when not ok1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('anon puede alguna=%s', ok1);
--
--     -- ── A9 · authenticated: las cuatro sí, las internas no ───────────────
--     ok1 := has_function_privilege('authenticated', 'public.ranking_top(text)', 'execute')
--        and has_function_privilege('authenticated', 'public.ranking_mio(text)', 'execute')
--        and has_function_privilege('authenticated', 'public.mini_perfil(text)', 'execute')
--        and has_function_privilege('authenticated', RPC7, 'execute');
--     ok2 := has_function_privilege('authenticated', 'public.puesto_maestros(uuid)', 'execute')
--         or has_function_privilege('authenticated', 'public.puesto_fortunas(uuid)', 'execute')
--         or has_function_privilege('authenticated', 'public.ranking_franja(integer, integer)', 'execute')
--         or has_function_privilege('authenticated', 'public.puntos_reto_ia(text)', 'execute')
--         or has_function_privilege('authenticated', 'public.extra_ajilei(smallint)', 'execute')
--         or has_function_privilege('authenticated', 'public.ia_tope_manos_minuto()', 'execute')
--         or has_function_privilege('authenticated', 'public.libro_puntos_suma_total()', 'execute')
--         or has_function_privilege('authenticated', 'public.libro_puntos_inmutable()', 'execute')
--         or has_function_privilege('authenticated', 'public.puntos_totales_solo_por_libro()', 'execute');
--     v_o := v_o || 9; v_p := v_p || 'A9 · authenticated con execute en las cuatro; ninguna interna'::text;
--     v_r := v_r || case when ok1 and not ok2 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('las cuatro del cliente=%s · alguna interna al cliente=%s', ok1, ok2);
--
--     -- ── A10 · INV-67: ni uuid ni correo en lo que devuelven ──────────────
--     select count(*) into n1
--       from pg_proc f join pg_namespace s on s.oid = f.pronamespace,
--            unnest(f.proallargtypes, f.proargmodes, f.proargnames) as a(tipo, modo, nombre)
--      where s.nspname = 'public' and f.proname in ('ranking_top', 'ranking_mio', 'mini_perfil')
--        and a.modo = 't'
--        and (a.tipo = 'uuid'::regtype or a.nombre ~* '(correo|email|mail|_id$|^id$)');
--     select count(*) into n2
--       from pg_proc f join pg_namespace s on s.oid = f.pronamespace,
--            unnest(f.proallargtypes, f.proargmodes) as a(tipo, modo)
--      where s.nspname = 'public' and f.proname in ('ranking_top', 'ranking_mio', 'mini_perfil') and a.modo = 't';
--     v_o := v_o || 10; v_p := v_p || 'A10 · INV-67: ninguna columna de las tres es un uuid ni un correo'::text;
--     v_r := v_r || case when n1 = 0 and n2 = 13 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('columnas devueltas=%s de 13 · con uuid o correo=%s', n2, n1);
--
--     -- ── A11 · security definer y search_path vacío ───────────────────────
--     select count(*) into n1 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
--      where s.nspname = 'public'
--        and f.proname in ('informar_pila', 'ranking_top', 'ranking_mio', 'mini_perfil',
--                          'puesto_maestros', 'puesto_fortunas', 'libro_puntos_suma_total')
--        and f.prosecdef and f.proconfig @> array['search_path=""'];
--     select count(*) into n2 from pg_proc f join pg_namespace s on s.oid = f.pronamespace
--      where s.nspname = 'public'
--        and f.proname in ('puntos_reto_ia', 'extra_ajilei', 'ia_tope_manos_minuto', 'ranking_franja',
--                          'libro_puntos_inmutable', 'puntos_totales_solo_por_libro')
--        and f.proconfig @> array['search_path=""'];
--     v_o := v_o || 11; v_p := v_p || 'A11 · las que tocan tablas, security definer; todas con search_path vacío'::text;
--     v_r := v_r || case when n1 = 7 and n2 = 6 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('definer con search_path=%s de 7 · puras y guardas con search_path=%s de 6', n1, n2);
--
--     -- ── A12 · fuera de Realtime ──────────────────────────────────────────
--     select count(*) into n1 from pg_publication_tables
--      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('libro_puntos', 'puntos_totales');
--     v_o := v_o || 12; v_p := v_p || 'A12 · ninguna de las dos tablas en supabase_realtime'::text;
--     v_r := v_r || case when n1 = 0 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('en realtime=%s', n1);
--
--
--     -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
--     -- Siete cuentas fabricadas, cada una con su billetera y su bono.
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'rnk1a.verif.' || u.n || '@example.com', '', now(), now(), '{}', '{}'
--       from (values (A, 'a'), (B, 'b'), (C, 'c'), (D, 'd'), (E, 'e'), (X, 'x'), (Y, 'y')) as u(id, n);
--     insert into public.profiles (id, username) values (A, 'rnk_a_verif');
--     insert into public.profiles (id, username) values (B, 'rnk_b_verif');
--     insert into public.profiles (id, username) values (C, 'rnk_c_verif');
--     insert into public.profiles (id, username) values (D, 'rnk_d_verif');
--     insert into public.profiles (id, username) values (E, 'rnk_e_verif');
--     insert into public.profiles (id, username) values (X, 'rnk_x_verif');
--     insert into public.profiles (id, username) values (Y, 'rnk_y_verif');
--
--     -- ── B3 · ias/pro/5/AJILEI 52 → base 3, extra 2, total 5 ──────────────
--     -- (va antes que B1 y B2, que necesitan una línea y un total que tocar)
--     m_d := gen_random_uuid();
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (D, 'ias', 'pro', 5, 3, 52, 2, m_d, 1);
--     select l.puntos_base, l.extra into p1, p2 from public.libro_puntos l where l.jugador_id = D;
--     select t.puntos, t.manos, t.ajileis into n1, n2, n3 from public.puntos_totales t where t.jugador_id = D;
--     v_o := v_o || 103; v_p := v_p || 'B3 · ias/pro/5 sentados/AJILEI 52: base 3, extra 2, total 5'::text;
--     v_r := v_r || case when p1 = 3 and p2 = 2 and n1 = 5 and n2 = 1 and n3 = 1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('base=%s · extra=%s · total=%s · manos=%s · ajileis=%s', p1, p2, n1, n2, n3);
--
--     -- ── B1 · el total no se toca a mano: insert, update ni delete ────────
--     begin
--       insert into public.puntos_totales (jugador_id, puntos) values (C, 100);
--       t1 := 'entró';
--     exception when others then t1 := sqlerrm;
--     end;
--     begin
--       update public.puntos_totales set manos = manos + 1 where jugador_id = D;
--       t2 := 'cambió';
--     exception when others then t2 := sqlerrm;
--     end;
--     begin
--       delete from public.puntos_totales where jugador_id = D;
--       t3 := 'borró';
--     exception when others then t3 := sqlerrm;
--     end;
--     select count(*) into n1 from public.puntos_totales where jugador_id = C;
--     select t.puntos, t.manos into n2, n3 from public.puntos_totales t where t.jugador_id = D;
--     v_o := v_o || 101; v_p := v_p || 'B1 · puntos_totales a mano (insert, update de otra columna, delete): falla'::text;
--     v_r := v_r || case when t1 = 'puntos_totales_solo_por_libro' and t2 = 'puntos_totales_solo_por_libro'
--                         and t3 = 'puntos_totales_solo_por_libro' and n1 = 0 and n2 = 5 and n3 = 1
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('insert → %s · update de manos → %s · delete → %s · el total de D sigue %s/%s',
--                          t1, t2, t3, n2, n3);
--
--     -- ── B2 · el libro no se edita ni se borra ────────────────────────────
--     begin
--       update public.libro_puntos set extra = extra where jugador_id = D;
--       t1 := 'cambió';
--     exception when others then t1 := sqlerrm;
--     end;
--     begin
--       delete from public.libro_puntos where jugador_id = D;
--       t2 := 'borró';
--     exception when others then t2 := sqlerrm;
--     end;
--     select count(*) into n1 from public.libro_puntos where jugador_id = D;
--     v_o := v_o || 102; v_p := v_p || 'B2 · update y delete en libro_puntos: falla'::text;
--     v_r := v_r || case when t1 = 'libro_puntos_inmutable' and t2 = 'libro_puntos_inmutable' and n1 = 1
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('update → %s · delete → %s · líneas de D=%s', t1, t2, n1);
--
--     -- ── B4 · AJILEI 52 con 4 sentados: falla por su check ────────────────
--     begin
--       insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--       values (C, 'ias', 'basico', 4, 1, 52, 2, gen_random_uuid(), 1);
--       t1 := 'entró';
--     exception when check_violation then
--       get stacked diagnostics t1 = constraint_name;
--     end;
--     v_o := v_o || 104; v_p := v_p || 'B4 · ias/basico con AJILEI 52 y 4 sentados: falla (check)'::text;
--     v_r := v_r || case when t1 = 'libro_puntos_ajilei52_chk' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('→ %s', t1);
--
--     -- ── B5 · humanos/4 sentados sin nivel → base 7 ───────────────────────
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (A, 'humanos', null, 4, 7, 0, 0, gen_random_uuid(), 1);
--     select l.puntos_base into p1 from public.libro_puntos l where l.jugador_id = A and l.origen = 'humanos';
--     -- y una segunda línea de A (avanzado, AJILEI 51 → 2 + 1): A llega a 10
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (A, 'ias', 'avanzado', 3, 2, 51, 1, gen_random_uuid(), 1);
--     select t.puntos, t.manos, t.ajileis into n1, n2, n3 from public.puntos_totales t where t.jugador_id = A;
--     v_o := v_o || 105; v_p := v_p || 'B5 · humanos/4 sentados sin nivel: base 7 (y A suma 10 con una de avanzado)'::text;
--     v_r := v_r || case when p1 = 7 and n1 = 10 and n2 = 2 and n3 = 1 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('base=%s · total de A=%s · manos=%s · ajileis=%s', p1, n1, n2, n3);
--
--     -- ── B6 · una cifra inventada: falla por el check de coherencia ───────
--     begin
--       insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--       values (C, 'ias', 'pro', 5, 8, 0, 0, gen_random_uuid(), 1);
--       t1 := 'entró';
--     exception when check_violation then
--       get stacked diagnostics t1 = constraint_name;
--     end;
--     select count(*) into n1 from public.puntos_totales where jugador_id = C;
--     v_o := v_o || 106; v_p := v_p || 'B6 · ias/pro con puntos_base 8: falla (coherencia con la tabla)'::text;
--     v_r := v_r || case when t1 = 'libro_puntos_base_chk' and n1 = 0 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('→ %s · C sigue sin total=%s', t1, n1 = 0);
--
--     -- ── B7 · la misma (origen, mesa, mano) dos veces: la segunda no entra ─
--     begin
--       insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--       values (D, 'ias', 'pro', 5, 3, 52, 2, m_d, 1);
--       t1 := 'entró';
--     exception when unique_violation then
--       get stacked diagnostics t1 = constraint_name;
--     end;
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (D, 'ias', 'pro', 5, 3, 0, 0, m_d, 1)
--     on conflict (origen, mesa_id, mano) do nothing;
--     get diagnostics n1 = row_count;
--     select count(*) into n2 from public.libro_puntos where jugador_id = D;
--     select t.puntos into n3 from public.puntos_totales t where t.jugador_id = D;
--     v_o := v_o || 107; v_p := v_p || 'B7 · la misma (origen, mesa, mano) otra vez: no entra, el total no cambia'::text;
--     v_r := v_r || case when t1 = 'libro_puntos_mano_uniq' and n1 = 0 and n2 = 1 and n3 = 5 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('insert → %s · con on conflict, filas=%s · líneas de D=%s · total de D=%s', t1, n1, n2, n3);
--
--     -- ═══ informar_pila: la mesa pro de B ═════════════════════════════════
--     -- D llegó a 5 en B3; B llega a 5 aquí, DESPUÉS: en el ranking, D delante.
--     perform pg_sleep(0.005);
--     perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
--     r := public.sentarse_ia('pro', 5, 200, 2000, gen_random_uuid());
--     m_b := r.mesa_id;
--
--     -- ── B8 · gana la mano 1 con AJILEI 52: libro + record + mano 1 ───────
--     r := public.informar_pila(m_b, 1, 2000, 5, true, 1, 52::smallint);
--     select count(*), min(l.puntos_base), min(l.extra), min(l.ajilei), min(l.mano), min(l.sentados), min(l.nivel)
--       into n1, p1, p2, p3, p4, p5, t1
--       from public.libro_puntos l where l.jugador_id = B and l.mesa_id = m_b;
--     select coalesce(sum(x.jugadas), 0), coalesce(sum(x.ganadas_humano), 0) into n2, n3
--       from public.record_manos x where x.jugador_id = B;
--     select * into mz from public.mesas_ia where id = m_b;
--     select t.puntos into n4 from public.puntos_totales t where t.jugador_id = B;
--     v_o := v_o || 108; v_p := v_p || 'B8 · informar_pila gana la mano 1 (pro, 5 vivos, AJILEI 52): libro, record y mano 1'::text;
--     v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and p1 = 3 and p2 = 2 and p3 = 52 and p4 = 1 and p5 = 5
--                         and t1 = 'pro' and n2 = 1 and n3 = 1 and mz.mano_informada = 1
--                         and cardinality(mz.manos_recientes) = 1 and mz.anomalias = 0 and n4 = 5
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('codigo=%s · líneas=%s (base %s, extra %s, ajilei %s, mano %s, sentados %s, %s) · record jugadas=%s ganadas=%s · mano_informada=%s · recientes=%s · anomalías=%s · total=%s',
--                          r.codigo, n1, p1, p2, p3, p4, p5, t1, n2, n3, mz.mano_informada,
--                          cardinality(mz.manos_recientes), mz.anomalias, n4);
--
--     -- ── B9 · la mano 1 otra vez (seq nuevo), y la mano 0: anomalías ──────
--     r  := public.informar_pila(m_b, 2, 2100, 5, true, 1, 0::smallint);
--     r2 := public.informar_pila(m_b, 3, 2050, 5, true, 0, 0::smallint);
--     select count(*) into n1 from public.libro_puntos where jugador_id = B;
--     select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
--     select * into mz from public.mesas_ia where id = m_b;
--     v_o := v_o || 109; v_p := v_p || 'B9 · la mano 1 repetida y la mano 0: anomalía, libro y record sin cambio, la pila sí'::text;
--     v_r := v_r || case when r.codigo = 'ok' and r2.codigo = 'ok' and n1 = 1 and n2 = 1
--                         and mz.mano_informada = 1 and mz.anomalias = 2 and mz.seq_informada = 3
--                         and mz.pila_informada = 2050
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('códigos=%s/%s · líneas de B=%s · record jugadas=%s · mano_informada=%s · anomalías=%s · seq=%s · pila=%s',
--                          r.codigo, r2.codigo, n1, n2, mz.mano_informada, mz.anomalias, mz.seq_informada, mz.pila_informada);
--
--     -- ── B10 · pierde la mano 2: mano_informada 2, libro sin cambio ───────
--     r := public.informar_pila(m_b, 4, 1900, 4, false, 2, null);
--     select count(*) into n1 from public.libro_puntos where jugador_id = B;
--     select coalesce(sum(x.jugadas), 0), coalesce(sum(x.ganadas_ia), 0) into n2, n3
--       from public.record_manos x where x.jugador_id = B;
--     select * into mz from public.mesas_ia where id = m_b;
--     v_o := v_o || 110; v_p := v_p || 'B10 · pierde la mano 2: mano_informada 2, record sí, libro no'::text;
--     v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and n2 = 2 and n3 = 1 and mz.mano_informada = 2
--                         and cardinality(mz.manos_recientes) = 2 and mz.anomalias = 2
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('codigo=%s · líneas de B=%s · record jugadas=%s ganadas_ia=%s · mano_informada=%s · recientes=%s',
--                          r.codigo, n1, n2, n3, mz.mano_informada, cardinality(mz.manos_recientes));
--
--     -- ── B19 · cliente viejo (sin p_fin_mano): record sí; libro, mano y tope no
--     r := public.informar_pila(m_b, 5, 1900, 3, true);
--     select count(*) into n1 from public.libro_puntos where jugador_id = B;
--     select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
--     select coalesce(sum(x.ganadas_humano), 0) into n3 from public.record_manos x where x.jugador_id = B and x.vivos = 3;
--     select * into mz from public.mesas_ia where id = m_b;
--     v_o := v_o || 119; v_p := v_p || 'B19 · aviso sin p_fin_mano (cliente de antes de la 1b): record sí, libro no'::text;
--     v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and n2 = 3 and n3 = 1 and mz.mano_informada = 2
--                         and cardinality(mz.manos_recientes) = 2 and mz.anomalias = 2
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('codigo=%s · líneas de B=%s · record jugadas=%s (ganada con 3 vivos=%s) · mano_informada=%s · recientes=%s · anomalías=%s',
--                          r.codigo, n1, n2, n3, mz.mano_informada, cardinality(mz.manos_recientes), mz.anomalias);
--
--     -- ── B20 · AJILEI 50, 52 con 4 vivos, y mano sin vivos: anomalías ─────
--     r  := public.informar_pila(m_b, 6, 1900, 5, true, 3, 50::smallint);
--     r2 := public.informar_pila(m_b, 7, 1900, 4, true, 3, 52::smallint);
--     perform public.informar_pila(m_b, 8, 1900, null, null, 3, null);
--     select count(*) into n1 from public.libro_puntos where jugador_id = B;
--     select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
--     select * into mz from public.mesas_ia where id = m_b;
--     v_o := v_o || 120; v_p := v_p || 'B20 · AJILEI 50, AJILEI 52 con 4 vivos, mano sin vivos: tres anomalías'::text;
--     v_r := v_r || case when r.codigo = 'ok' and r2.codigo = 'ok' and n1 = 1 and n2 = 3
--                         and mz.mano_informada = 2 and mz.anomalias = 5 and mz.seq_informada = 8
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('códigos=%s/%s · líneas de B=%s · record jugadas=%s · mano_informada=%s · anomalías=%s · seq=%s',
--                          r.codigo, r2.codigo, n1, n2, mz.mano_informada, mz.anomalias, mz.seq_informada);
--
--     -- ── B22 · AJILEI sin ganar la mano: record sí, libro no (§2.5) ───────
--     r := public.informar_pila(m_b, 9, 1900, 4, false, 3, 51::smallint);
--     select count(*) into n1 from public.libro_puntos where jugador_id = B;
--     select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = B;
--     select * into mz from public.mesas_ia where id = m_b;
--     v_o := v_o || 122; v_p := v_p || 'B22 · AJILEI 51 sin ganar la mano: record sí, libro no'::text;
--     v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and n2 = 4 and mz.mano_informada = 3 and mz.anomalias = 5
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('codigo=%s · líneas de B=%s · record jugadas=%s · mano_informada=%s', r.codigo, n1, n2, mz.mano_informada);
--
--     -- ═══ El tope por minuto: la mesa básica de E ═════════════════════════
--     perform set_config('request.jwt.claims', json_build_object('sub', E)::text, true);
--     r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid());
--     m_e := r.mesa_id;
--
--     -- ── B11 · 13 fines de mano en el mismo minuto: el 13.º es anomalía ───
--     n5 := 0;
--     for i in 1..12 loop
--       r := public.informar_pila(m_e, i, 500, 2, false, i, null);
--       if r.codigo = 'ok' then n5 := n5 + 1; end if;
--     end loop;
--     select anomalias into p1 from public.mesas_ia where id = m_e;
--     r := public.informar_pila(m_e, 13, 500, 2, true, 13, 0::smallint);
--     select count(*) into n1 from public.libro_puntos where jugador_id = E;
--     select coalesce(sum(x.jugadas), 0) into n2 from public.record_manos x where x.jugador_id = E;
--     select * into mz from public.mesas_ia where id = m_e;
--     v_o := v_o || 111; v_p := v_p || 'B11 · 13 fines de mano en el mismo minuto: el 13.º es anomalía y no entra'::text;
--     v_r := v_r || case when n5 = 12 and p1 = 0 and r.codigo = 'ok' and mz.anomalias = 1 and n1 = 0 and n2 = 12
--                         and mz.mano_informada = 12 and cardinality(mz.manos_recientes) = 12 and mz.seq_informada = 13
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('12 primeros ok=%s con %s anomalías · el 13.º: codigo=%s, anomalías=%s, líneas de E=%s · record jugadas=%s · mano_informada=%s · recientes=%s',
--                          n5, p1, r.codigo, mz.anomalias, n1, n2, mz.mano_informada, cardinality(mz.manos_recientes));
--
--     -- ── B21 · pasado el minuto la ventana se vacía y vuelve a entrar ─────
--     update public.mesas_ia
--        set manos_recientes = (select array_agg(t - interval '61 seconds') from unnest(manos_recientes) t)
--      where id = m_e;
--     perform pg_sleep(0.005);
--     r := public.informar_pila(m_e, 14, 550, 2, true, 13, 0::smallint);
--     select count(*), min(l.puntos_base) into n1, p1 from public.libro_puntos l where l.jugador_id = E;
--     select * into mz from public.mesas_ia where id = m_e;
--     select t.puntos into n2 from public.puntos_totales t where t.jugador_id = E;
--     v_o := v_o || 121; v_p := v_p || 'B21 · la ventana desliza: 61 s después, la mano 13 gana y entra (básico, 1 punto)'::text;
--     v_r := v_r || case when r.codigo = 'ok' and n1 = 1 and p1 = 1 and n2 = 1 and mz.mano_informada = 13
--                         and cardinality(mz.manos_recientes) = 1 and mz.anomalias = 1
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('codigo=%s · líneas de E=%s (base %s) · total=%s · mano_informada=%s · recientes=%s',
--                          r.codigo, n1, p1, n2, mz.mano_informada, cardinality(mz.manos_recientes));
--
--     -- ═══ Los rankings ════════════════════════════════════════════════════
--     -- Puntos: A 10 · D 5 (llegó primero) · B 5 (después) · E 1 · C nada.
--     select count(*) = 4 into solo from public.puntos_totales;
--
--     -- ── B12 · ranking_top('maestros'): 1-2-3-4, el empate lo gana quien llegó antes
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     select r0.puesto into p1 from public.ranking_top('maestros') r0 where r0.username = 'rnk_a_verif';
--     select r0.puesto into p2 from public.ranking_top('maestros') r0 where r0.username = 'rnk_d_verif';
--     select r0.puesto into p3 from public.ranking_top('maestros') r0 where r0.username = 'rnk_b_verif';
--     select r0.puesto into p4 from public.ranking_top('maestros') r0 where r0.username = 'rnk_e_verif';
--     select count(*) into n1 from public.ranking_top('maestros') r0 where r0.username = 'rnk_c_verif';
--     select count(*), count(distinct r0.puesto), coalesce(max(r0.puesto), 0),
--            count(*) filter (where r0.es_tu), count(*) filter (where r0.es_tu and r0.username = 'rnk_a_verif')
--       into n2, n3, n4, c1, c2
--       from public.ranking_top('maestros') r0;
--     ok1 := (select t.actualizado_en from public.puntos_totales t where t.jugador_id = D)
--          < (select t.actualizado_en from public.puntos_totales t where t.jugador_id = B);
--     v_o := v_o || 112; v_p := v_p || 'B12 · ranking_top maestros: puestos únicos 1-2-3-4; en el empate a 5, D (llegó antes) delante de B'::text;
--     v_r := v_r || case when ok1 and p2 = p1 + 1 and p3 = p1 + 2 and p4 = p1 + 3
--                         and p1 = public.puesto_maestros(A) and p2 = public.puesto_maestros(D)
--                         and p3 = public.puesto_maestros(B) and p4 = public.puesto_maestros(E)
--                         and n1 = 0 and n2 = n3 and n4 = n2 and c1 = 1 and c2 = 1
--                         and (not solo or (p1 = 1 and p2 = 2 and p3 = 3 and p4 = 4))
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('A=%s · D=%s · B=%s · E=%s · C en la lista=%s · filas=%s, puestos distintos=%s, último=%s · es_tu=%s (A=%s) · D llegó antes=%s · sólo fabricadas=%s',
--                          p1, p2, p3, p4, n1 > 0, n2, n3, n4, c1, c2 = 1, ok1, solo);
--
--     -- ── B13 · ranking_mio maestros: C sin puntos → nada; A → su puesto ───
--     perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
--     select count(*) into n1 from public.ranking_mio('maestros');
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     select m0.puesto, m0.total, m0.franja, m0.cifra into p1, p2, f1, c1 from public.ranking_mio('maestros') m0;
--     select count(*) into n2 from public.puntos_totales;
--     v_o := v_o || 113; v_p := v_p || 'B13 · ranking_mio maestros: sin puntos → cero filas; A → puesto, total y franja'::text;
--     v_r := v_r || case when n1 = 0 and p1 = public.puesto_maestros(A) and p2 = n2
--                         and f1 = public.ranking_franja(p1, p2) and c1 = 10
--                         and (not solo or (p1 = 1 and p2 = 4 and f1 = 25))
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('filas de C=%s · A: puesto %s de %s, franja %s %%, cifra %s · sólo fabricadas=%s',
--                          n1, p1, p2, f1, c1, solo);
--
--     -- ── B14 · fortunas: puestos únicos y sus franjas ─────────────────────
--     -- A, B y C a la cabeza; B y C con el MISMO saldo y la misma hora (now()):
--     -- decide el nombre, B delante de C. La franja, con puestos 1, 2 y 3.
--     perform public.ajuste_admin(A, 3000000000000, 'RNK-1a verificación');
--     perform public.ajuste_admin(B, 1000000002000, 'RNK-1a verificación');
--     perform public.ajuste_admin(C, 1000000000000, 'RNK-1a verificación');
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     select m0.puesto, m0.franja, m0.cifra into p1, f1, c1 from public.ranking_mio('fortunas') m0;
--     perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
--     select m0.puesto, m0.franja, m0.cifra into p2, f2, c2 from public.ranking_mio('fortunas') m0;
--     perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
--     select m0.puesto, m0.franja, m0.total, m0.cifra into p3, f3, n1, n2 from public.ranking_mio('fortunas') m0;
--     select count(*) into n3 from public.billeteras;
--     v_o := v_o || 114; v_p := v_p || 'B14 · ranking_mio fortunas: puestos únicos 1-2-3 (empate de saldo y hora → nombre); franjas 35/70/100 sobre 3'::text;
--     v_r := v_r || case when p1 = 1 and p2 = 2 and p3 = 3 and c2 = n2 and n1 = n3
--                         and p1 = public.puesto_fortunas(A) and p2 = public.puesto_fortunas(B) and p3 = public.puesto_fortunas(C)
--                         and f1 = public.ranking_franja(1, n3::integer) and f2 = public.ranking_franja(2, n3::integer)
--                         and f3 = public.ranking_franja(3, n3::integer)
--                         and public.ranking_franja(1, 3) = 35 and public.ranking_franja(2, 3) = 70
--                         and public.ranking_franja(3, 3) = 100 and public.ranking_franja(28, 100) = 30
--                         and public.ranking_franja(5, 100) = 5 and public.ranking_franja(1, 1) = 100
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('puestos A=%s B=%s C=%s de %s (saldo B=C: %s) · franjas sobre %s: %s/%s/%s · sobre 3: %s/%s/%s · 28 de 100=%s · 5 de 100=%s · 1 de 1=%s',
--                          p1, p2, p3, n1, c2 = n2, n3, f1, f2, f3,
--                          public.ranking_franja(1, 3), public.ranking_franja(2, 3), public.ranking_franja(3, 3),
--                          public.ranking_franja(28, 100), public.ranking_franja(5, 100), public.ranking_franja(1, 1));
--
--     -- ── B15 · mini_perfil: sin mayúsculas, y 'nadie' → cero filas ────────
--     perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
--     select count(*) into n1 from public.mini_perfil('RNK_A_VERIF');
--     select mp.username, mp.puesto_maestros, mp.puntos, mp.puesto_fortunas, mp.saldo
--       into t1, p1, c1, p2, c2
--       from public.mini_perfil('RNK_A_VERIF') mp;
--     select count(*) into n2 from public.mini_perfil('nadie');
--     select mp.puesto_maestros, mp.puntos, mp.saldo into p3, n3, n4 from public.mini_perfil('rnk_c_verif') mp;
--     v_o := v_o || 115; v_p := v_p || 'B15 · mini_perfil(RNK_A_VERIF) lo encuentra; nadie → cero filas; sin puntos → nulos'::text;
--     v_r := v_r || case when n1 = 1 and t1 = 'rnk_a_verif' and c1 = 10 and p1 = public.puesto_maestros(A)
--                         and p2 = 1 and p2 = public.puesto_fortunas(A) and c2 = 3000000002500
--                         and n2 = 0 and p3 is null and n3 is null and n4 = 1000000002500
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('filas=%s · %s: puesto maestros %s con %s · puesto fortunas %s con %s · nadie=%s filas · C: puesto %s, puntos %s, saldo %s',
--                          n1, t1, p1, c1, p2, c2, n2, coalesce(p3::text, 'nulo'), coalesce(n3::text, 'nulo'), n4);
--
--     -- ── B16 · como anon: las cuatro, denegadas ───────────────────────────
--     -- Una denegación cuenta sólo si el cambio de rol llegó a ocurrir (`e1`):
--     -- si el propio `set role` fallara, también daría 42501 y parecería verde.
--     -- Las asignaciones a variables no se deshacen con el bloque.
--     n1 := 0; n2 := 0;
--     begin
--       e1 := null; set local role anon; e1 := current_user;
--       perform * from public.ranking_top('maestros');
--       reset role;
--     exception when insufficient_privilege then
--       if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
--     end;
--     begin
--       e1 := null; set local role anon; e1 := current_user;
--       perform * from public.ranking_mio('maestros');
--       reset role;
--     exception when insufficient_privilege then
--       if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
--     end;
--     begin
--       e1 := null; set local role anon; e1 := current_user;
--       perform * from public.mini_perfil('rnk_a_verif');
--       reset role;
--     exception when insufficient_privilege then
--       if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
--     end;
--     begin
--       e1 := null; set local role anon; e1 := current_user;
--       perform public.informar_pila(m_b, 99, 1, null, null, null, null);
--       reset role;
--     exception when insufficient_privilege then
--       if e1 = 'anon' then n1 := n1 + 1; else n2 := n2 + 1; end if;
--     end;
--     v_o := v_o || 116; v_p := v_p || 'B16 · como anon: ranking_top, ranking_mio, mini_perfil e informar_pila denegadas'::text;
--     v_r := v_r || case when n1 = 4 and n2 = 0 and current_user <> 'anon' then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('denegadas siendo anon=%s de 4 · sin llegar a ser anon=%s · rol restaurado=%s',
--                          n1, n2, current_user <> 'anon');
--
--     -- ── B24 · sin sesión: cero filas en las tres ─────────────────────────
--     perform set_config('request.jwt.claims', '', true);
--     select count(*) into n1 from public.ranking_top('maestros');
--     select count(*) into n2 from public.ranking_mio('fortunas');
--     select count(*) into n3 from public.mini_perfil('rnk_a_verif');
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     select count(*) into n4 from public.ranking_top('nada');
--     v_o := v_o || 124; v_p := v_p || 'B24 · sin sesión → cero filas en las tres; un ranking desconocido → cero filas'::text;
--     v_r := v_r || case when n1 = 0 and n2 = 0 and n3 = 0 and n4 = 0 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('ranking_top=%s · ranking_mio=%s · mini_perfil=%s · ranking «nada»=%s', n1, n2, n3, n4);
--
--     -- ── B18 · el que sube después estrena fecha y, si vuelven a empatar, queda detrás
--     -- X y Y empatan a 2 (X llega antes). Y sube a 3; X sube a 3 DESPUÉS.
--     perform pg_sleep(0.005);
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (X, 'ias', 'avanzado', 3, 2, 0, 0, gen_random_uuid(), 1);
--     perform pg_sleep(0.005);
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (Y, 'ias', 'avanzado', 3, 2, 0, 0, gen_random_uuid(), 1);
--     p1 := public.puesto_maestros(X); p2 := public.puesto_maestros(Y);
--     perform pg_sleep(0.005);
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (Y, 'ias', 'basico', 2, 1, 0, 0, gen_random_uuid(), 1);
--     p3 := public.puesto_maestros(X); p4 := public.puesto_maestros(Y);
--     perform pg_sleep(0.005);
--     insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--     values (X, 'ias', 'basico', 2, 1, 0, 0, gen_random_uuid(), 1);
--     p5 := public.puesto_maestros(X); p6 := public.puesto_maestros(Y);
--     select r0.puesto into q1 from public.ranking_top('maestros') r0 where r0.username = 'rnk_x_verif';
--     select r0.puesto into q2 from public.ranking_top('maestros') r0 where r0.username = 'rnk_y_verif';
--     perform set_config('request.jwt.claims', json_build_object('sub', X)::text, true);
--     select m0.puesto into q3 from public.ranking_mio('maestros') m0;
--     select t.puntos into c1 from public.puntos_totales t where t.jugador_id = X;
--     select t.puntos into c2 from public.puntos_totales t where t.jugador_id = Y;
--     v_o := v_o || 118; v_p := v_p || 'B18 · empate a 2: X (antes) delante; Y sube; X sube después y en el nuevo empate a 3 queda detrás'::text;
--     v_r := v_r || case when p2 = p1 + 1 and p4 < p3 and c1 = 3 and c2 = 3 and p5 = p6 + 1
--                         and q1 = p5 and q2 = p6 and q3 = p5
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('a 2: X=%s Y=%s · Y a 3: X=%s Y=%s · los dos a 3: X=%s Y=%s · ranking_top X=%s Y=%s · ranking_mio de X=%s',
--                          p1, p2, p3, p4, p5, p6, q1, q2, q3);
--
--     -- ── B23 · el corte: 100 filas exactas, aunque caiga dentro de un empate
--     -- 101 cuentas más con 1 punto cada una: con E, 102 empatadas a 1.
--     for i in 1..101 loop
--       insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                               created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--       values (format('f1a00001-0000-4000-8000-%s', lpad(i::text, 12, '0'))::uuid,
--               '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--               'rnk1a.corte.' || i || '@example.com', '', now(), now(), '{}', '{}');
--       insert into public.profiles (id, username)
--       values (format('f1a00001-0000-4000-8000-%s', lpad(i::text, 12, '0'))::uuid, 'rnkcorte_' || lpad(i::text, 3, '0'));
--       insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
--       values (format('f1a00001-0000-4000-8000-%s', lpad(i::text, 12, '0'))::uuid,
--               'ias', 'basico', 2, 1, 0, 0, gen_random_uuid(), 1);
--     end loop;
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     select count(*), count(distinct r0.puesto), min(r0.puesto), max(r0.puesto),
--            bool_and(r0.puesto = public.puesto_maestros(p.id))
--       into n1, n2, p1, p2, ok1
--       from public.ranking_top('maestros') r0
--       join public.profiles p on lower(p.username) = lower(r0.username);
--     select count(*) into n3 from public.puntos_totales;
--     perform set_config('request.jwt.claims',
--                        json_build_object('sub', 'f1a00001-0000-4000-8000-000000000101')::text, true);
--     select m0.puesto, m0.total, m0.franja into p3, p4, f1 from public.ranking_mio('maestros') m0;
--     select count(*) into n4 from public.ranking_top('maestros') r0 where r0.username = 'rnkcorte_101';
--     v_o := v_o || 123; v_p := v_p || 'B23 · el corte: 100 filas exactas con puestos 1…100; el último en llegar al empate, fuera y último'::text;
--     v_r := v_r || case when n1 = 100 and n2 = 100 and p1 = 1 and p2 = 100 and ok1 and n3 >= 107
--                         and p3 = n3 and p4 = n3 and f1 = 100 and n4 = 0
--                    then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('filas=%s · puestos distintos=%s, de %s a %s · coinciden con puesto_maestros=%s · en el ranking=%s · rnkcorte_101: puesto %s de %s, franja %s %%, en el top=%s',
--                          n1, n2, p1, p2, ok1, n3, p3, p4, f1, n4 > 0);
--
--     -- ── B17 · borrar la cuenta de A: su libro y su total se van en cascada
--     select count(*) into n1 from public.puntos_totales where jugador_id <> A;
--     select count(*) into n2 from public.libro_puntos where jugador_id <> A;
--     begin
--       delete from public.profiles where id = A;
--       t1 := 'borrada';
--     exception when others then t1 := sqlerrm;
--     end;
--     select count(*) into n3 from public.libro_puntos where jugador_id = A;
--     select count(*) into n4 from public.puntos_totales where jugador_id = A;
--     select count(*) into n5 from public.puntos_totales where jugador_id <> A;
--     select count(*) into c1 from public.libro_puntos where jugador_id <> A;
--     v_o := v_o || 117; v_p := v_p || 'B17 · borrar a A de profiles: su libro y su total se van en cascada, lo demás intacto'::text;
--     v_r := v_r || case when t1 = 'borrada' and n3 = 0 and n4 = 0 and n5 = n1 and c1 = n2 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('delete → %s · líneas de A=%s · total de A=%s · totales de los demás %s→%s · líneas de los demás %s→%s',
--                          t1, n3, n4, n1, n5, n2, c1);
--
--     -- ── B25 · el libro cuadra: cada total es la suma de su libro ─────────
--     select count(*) into n1
--       from public.puntos_totales t
--       cross join lateral (
--         select coalesce(sum(l.puntos_base + l.extra), 0) as puntos, count(*) as manos,
--                count(*) filter (where l.ajilei > 0) as ajileis
--           from public.libro_puntos l where l.jugador_id = t.jugador_id) s
--      where t.puntos <> s.puntos or t.manos <> s.manos or t.ajileis <> s.ajileis;
--     select count(distinct l.jugador_id) into n2
--       from public.libro_puntos l
--      where not exists (select 1 from public.puntos_totales t where t.jugador_id = l.jugador_id);
--     select count(*) into n3 from public.puntos_totales;
--     v_o := v_o || 125; v_p := v_p || 'B25 · el libro cuadra: cada total = Σ de su libro, y nadie con líneas sin total'::text;
--     v_r := v_r || case when n1 = 0 and n2 = 0 and n3 > 0 then 'PASA' else 'FALLA' end;
--     v_d := v_d || format('totales descuadrados=%s · jugadores con líneas sin total=%s · totales revisados=%s', n1, n2, n3);
--
--     perform set_config('request.jwt.claims', '', true);
--     raise exception 'rnk1a_deshacer';
--   exception when others then
--     if sqlerrm <> 'rnk1a_deshacer' then
--       v_o := v_o || 999; v_p := v_p || 'X · el guion se detuvo'::text;
--       v_r := v_r || 'FALLA'::text;
--       v_d := v_d || (sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   return query select * from unnest(v_o, v_p, v_r, v_d);
-- end
-- $fn$;
--
-- select prueba, resultado, detalle
--   from pg_temp.rnk1a_verificar()
--  order by orden;
--
-- rollback;
