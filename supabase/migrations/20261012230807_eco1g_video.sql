-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1g — El video de recompensa: el boleto
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_ECO-1_Fase1g_v1.0.md §2.1, con el plan del STOP-1 y sus
-- respuestas (P-1 a P-4). Normativo: docs/AJILEI_ECO-1_Reglas_v1.3.md (sección
-- del video) y docs/AJILEI_Tienda_v1.1.md §3.2.
--
-- Va SOBRE el libro de la 1a (20261007144943_eco1a_libro.sql) y los límites de
-- la 1d (20261009105658_eco1d_constancia_limites_valvula.sql). Todo el dinero
-- sigue pasando por `aplicar_movimiento`; el tipo que usa el video (`video`) ya
-- existe en `movimientos_tipo_chk` desde la 1a.
--
-- ── LO QUE ESTE ARCHIVO PONE EN LA BASE ───────────────────────────────────
--   · `video_premio_hc()`, `video_tope_dia()`, `video_minimo_s()` y
--     `video_vida_boleto()`: las cuatro cifras (G1, S2), cada una en UN sitio.
--   · `limite_dinero()` REDEFINIDA (`create or replace`, misma firma): los
--     cinco topes de la 1d, iguales, más los dos del video (S4).
--   · `boletos_video`     un boleto por video pedido (S1, S5).
--   · `mi_video()`        lo que pinta el contador, sin tocar nada.
--   · `pedir_boleto()`    emite el boleto y anula el anterior (S1).
--   · `cobrar_boleto()`   paga 500 HC contra el boleto, una vez (S3).
--
-- ── LA REGLA, EN CORTO ────────────────────────────────────────────────────
-- El servidor paga contra un boleto que él mismo emitió; el teléfono nunca
-- decide cuánto cobra. Un boleto se cobra UNA vez, sólo si pasaron los segundos
-- mínimos desde su emisión y antes de que venza. Para el tope del día cuentan
-- los boletos COBRADOS ese día de Chicago: uno anulado, vencido o sin cobrar
-- (el video cerrado antes de tiempo) no cuenta (G2, S5).
--
-- S6, CON FRANQUEZA: el servidor sabe que pasaron los segundos, no que el
-- jugador miró. Un cliente alterado podría pedir el boleto y cobrarlo a los
-- 35 s sin mirar; el tope de 8 lo acota a 4.000 HC por día. La confirmación del
-- servidor de la red de anuncios cerrará ese hueco el día del anuncio real.
--
-- ── LA DOCTRINA DE LA 1a, LA 1c Y LA 1d, QUE AQUÍ SIGUE ───────────────────
-- Sin `raise` en los caminos de negocio; el resultado sale siempre relleno;
-- `search_path = ''` y `security definer`; el cliente no lee ni escribe
-- tablas (RLS sin políticas y sin privilegios); nada entra en Realtime. La
-- billetera se bloquea primero en las dos funciones que escriben: pedir y
-- cobrar de la misma cuenta van en fila, también desde dos dispositivos.
--
-- ── IDEMPOTENCIA DEL ARCHIVO ──────────────────────────────────────────────
-- `if not exists` y `create or replace` en todo: el archivo entero se puede
-- volver a pasar.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Las cifras ─────────────────────────────────────────────────────────
-- Cada una vive AQUÍ y en ningún otro sitio del SQL, como `bono_bienvenida_hc()`
-- y `bono_constancia_hc()`. Espejos del cliente: `src/dev/bancoImitado.js` (las
-- cuatro) y `videoReward` / `maxVideosPerDay` en `src/config/ajileiConfig.js`.
--
-- EL PREMIO LO DICE EL SERVIDOR: `mi_video` y `cobrar_boleto` lo devuelven en
-- su campo `premio`, y con esa cifra pinta y celebra el cliente. `videoReward`
-- es sólo el espejo, para el arnés y por si el servidor no contesta.

-- G1 · lo que paga un video completado.
create or replace function public.video_premio_hc()
returns bigint language sql immutable set search_path = ''
as $fn$ select 500::bigint $fn$;

-- G1 · cuántos se cobran por día de Chicago.
create or replace function public.video_tope_dia()
returns integer language sql immutable set search_path = ''
as $fn$ select 8 $fn$;

-- S2 · los segundos que deben pasar desde la emisión para poder cobrar. El
-- video dura unos 40 s a la vista; 35 dejan sitio a la latencia.
create or replace function public.video_minimo_s()
returns integer language sql immutable set search_path = ''
as $fn$ select 35 $fn$;

-- S2 · lo que vive un boleto sin cobrar. Cubre una pausa (la pantalla
-- bloqueada a mitad) y los reintentos de un cobro cortado (K7), sin dejar
-- boletos eternos.
create or replace function public.video_vida_boleto()
returns interval language sql immutable set search_path = ''
as $fn$ select interval '10 minutes' $fn$;

comment on function public.video_premio_hc() is
  'ECO-1g · HC por video completado (G1). Lo devuelven mi_video y cobrar_boleto en `premio`. Espejo: videoReward en src/config/ajileiConfig.js.';
comment on function public.video_tope_dia() is
  'ECO-1g · Videos cobrados por día de Chicago (G1). Espejo: maxVideosPerDay en src/config/ajileiConfig.js.';
comment on function public.video_minimo_s() is
  'ECO-1g · Segundos mínimos entre la emisión del boleto y su cobro (S2).';
comment on function public.video_vida_boleto() is
  'ECO-1g · Vida de un boleto sin cobrar (S2).';

-- K6 · Los topes por minuto, en UN sitio. Es la función de la 1d con dos
-- nombres más; los cinco de antes no cambian (el guion de la 1d los comprueba).
-- Espejo: `LIMITES_SQL` en src/dev/bancoImitado.js.
--   pedir_boleto   10  sólo la lanza un toque del jugador: el cliente no la
--                      reintenta solo. Cada pedido anula el anterior, así que
--                      pedir de más no gana nada; el tope sólo frena bucles.
--   cobrar_boleto  20  lo legítimo es un cobro cada 35 s o más. Con los
--                      reintentos del cliente (1, 2, 4, 8 y 15 s) el primer
--                      minuto son 7 llamadas como mucho. Cortada no pierde
--                      nada: el boleto sigue vivo y se cobra después (K7).
-- `mi_video` NO lleva límite: no mueve dinero ni escribe.
create or replace function public.limite_dinero(p_funcion text)
returns integer language sql immutable set search_path = ''
as $fn$
  select case p_funcion
           when 'sentarse_ia'     then 10
           when 'recargar_ia'     then 20
           when 'salir_ia'        then 30
           when 'recoger_mesa_ia' then 10
           when 'marcar_ingreso'  then 6
           when 'pedir_boleto'    then 10
           when 'cobrar_boleto'   then 20
         end
$fn$;


-- ── 2 · Los boletos ────────────────────────────────────────────────────────
-- Una fila por video PEDIDO. Un boleto acaba de una de tres maneras: cobrado
-- (`cobrado_en`), anulado porque se pidió otro (`anulado_en`) o, sin ninguna de
-- las dos marcas, vencido al pasar `vence_en`. Nunca cobrado y anulado a la vez.
create table if not exists public.boletos_video (
  id         uuid        primary key default gen_random_uuid(),
  jugador_id uuid        not null references public.profiles(id) on delete cascade,
  emitido_en timestamptz not null default now(),
  vence_en   timestamptz not null,
  cobrado_en timestamptz,
  anulado_en timestamptz,

  constraint boletos_video_un_final_chk check (cobrado_en is null or anulado_en is null),
  constraint boletos_video_vida_chk     check (vence_en > emitido_en)
);

-- S1 · UN boleto vivo por cuenta, escrito en la base: como mucho una fila por
-- jugador sin cobrar ni anular. `pedir_boleto` anula la que haya (también si ya
-- venció) antes de emitir, así que el índice nunca le estorba; lo que impide es
-- que un fallo deje dos.
create unique index if not exists boletos_video_vivo_uniq
  on public.boletos_video (jugador_id)
  where cobrado_en is null and anulado_en is null;

-- S5 · «los cobrados de hoy de un jugador». `dia_chicago` es `immutable` (1a §6)
-- justo para poder indexarla aquí.
create index if not exists boletos_video_cobrados_idx
  on public.boletos_video (jugador_id, public.dia_chicago(cobrado_en))
  where cobrado_en is not null;

comment on table public.boletos_video is
  'ECO-1g · Un boleto por video pedido. Lo escriben sólo pedir_boleto y cobrar_boleto. RLS activo y CERO políticas.';


-- ── 3 · Los ayudantes ──────────────────────────────────────────────────────

-- G6 · la próxima medianoche de Chicago después de `p_ts`. Es un INSTANTE: el
-- cliente resta con su desfase de reloj y pinta «Vuelven en 5 h 12 min». Los
-- dos días del cambio de hora no duran 24 h, y por eso no se suma un día al
-- instante: se suma al DÍA de Chicago y se vuelve a su zona.
create or replace function public.video_reinicio(p_ts timestamptz)
returns timestamptz
language sql
immutable
set search_path = ''
as $fn$
  select ((public.dia_chicago(p_ts) + 1)::timestamp at time zone 'America/Chicago')
$fn$;

-- S5 · cuántos boletos cobró el jugador en el día de Chicago de AHORA.
create or replace function public.video_cobrados_hoy(p_jugador uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $fn$
  select count(*)::integer
    from public.boletos_video b
   where b.jugador_id = p_jugador
     and b.cobrado_en is not null
     and public.dia_chicago(b.cobrado_en) = public.dia_chicago(now())
$fn$;

-- Los que le quedan hoy: nunca negativo, y 0 sin jugador.
create or replace function public.video_quedan(p_jugador uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $fn$
  select case when p_jugador is null then 0
              else greatest(0, public.video_tope_dia() - public.video_cobrados_hoy(p_jugador)) end
$fn$;


-- ── 4 · Las respuestas ─────────────────────────────────────────────────────

-- La de `mi_video`.
--   codigo       'ok' · 'sin_sesion'.
--   quedan       los videos que puede cobrar todavía hoy (0 sin sesión).
--   tope         `video_tope_dia()`.
--   ahora        el reloj del servidor, para el desfase del cliente.
--   reinicio_en  la próxima medianoche de Chicago.
--   premio       `video_premio_hc()`: lo que paga un video completado. De aquí
--                salen los «+500 HC» que pinta el cliente.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'video_estado' and n.nspname = 'public') then
    create type public.video_estado as (
      codigo      text,
      quedan      integer,
      tope        integer,
      ahora       timestamptz,
      reinicio_en timestamptz,
      premio      bigint
    );
  end if;
end
$$;

-- La de `pedir_boleto`.
--   codigo       'ok' · 'tope_dia' · 'limite' · 'sin_sesion' · 'sin_billetera'.
--   boleto_id, emitido_en, vence_en
--                los del boleto emitido; NULOS si no se emitió ninguno.
--   ahora        el reloj del servidor.
--   minimo_s     `video_minimo_s()`.
--   quedan, reinicio_en
--                como en `mi_video`. El boleto recién emitido no descuenta:
--                cuenta al cobrarse.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'boleto_video_resultado' and n.nspname = 'public') then
    create type public.boleto_video_resultado as (
      codigo      text,
      boleto_id   uuid,
      emitido_en  timestamptz,
      vence_en    timestamptz,
      ahora       timestamptz,
      minimo_s    integer,
      quedan      integer,
      reinicio_en timestamptz
    );
  end if;
end
$$;

-- La de `cobrar_boleto`.
--   codigo       'ok' · 'ya_cobrado' · 'demasiado_pronto' · 'anulado' ·
--                'vencido' · 'ajeno' · 'inexistente' · 'tope_dia' · 'limite' ·
--                'sin_sesion' · 'sin_billetera' · 'error_libro'.
--   cobrado      lo que ESTA llamada abonó: 0 o `video_premio_hc()`.
--   saldo        la billetera AHORA (con `ya_cobrado`, ya subida).
--   quedan, reinicio_en
--                como en `mi_video`, después de esta llamada.
--   faltan_s     con `demasiado_pronto`, los segundos que faltan; si no, 0.
--   premio       `video_premio_hc()`, SIEMPRE, también con `ya_cobrado` (donde
--                `cobrado` es 0): es la cifra con la que el cliente celebra.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'cobro_video_resultado' and n.nspname = 'public') then
    create type public.cobro_video_resultado as (
      codigo      text,
      cobrado     bigint,
      saldo       bigint,
      quedan      integer,
      reinicio_en timestamptz,
      faltan_s    integer,
      premio      bigint
    );
  end if;
end
$$;

comment on type public.video_estado is
  'ECO-1g · Respuesta de mi_video. Todos los campos siempre rellenos.';
comment on type public.boleto_video_resultado is
  'ECO-1g · Respuesta de pedir_boleto. boleto_id, emitido_en y vence_en son nulos si no se emitió boleto; lo demás, siempre relleno.';
comment on type public.cobro_video_resultado is
  'ECO-1g · Respuesta de cobrar_boleto. Todos los campos siempre rellenos.';

-- Las respuestas, rellenas. Internas.
create or replace function public.boleto_video_respuesta(
  p_codigo  text,
  p_jugador uuid,
  p_boleto  public.boletos_video default null
)
returns public.boleto_video_resultado
language sql
stable
security definer
set search_path = ''
as $fn$
  select row(
    p_codigo,
    (p_boleto).id,
    (p_boleto).emitido_en,
    (p_boleto).vence_en,
    now(),
    public.video_minimo_s(),
    public.video_quedan(p_jugador),
    public.video_reinicio(now())
  )::public.boleto_video_resultado
$fn$;

create or replace function public.cobro_video_respuesta(
  p_codigo  text,
  p_jugador uuid,
  p_cobrado bigint  default 0,
  p_faltan  integer default 0
)
returns public.cobro_video_resultado
language sql
stable
security definer
set search_path = ''
as $fn$
  select row(
    p_codigo,
    coalesce(p_cobrado, 0),
    coalesce((select b.saldo from public.billeteras b where b.jugador_id = p_jugador), 0),
    public.video_quedan(p_jugador),
    public.video_reinicio(now()),
    greatest(0, coalesce(p_faltan, 0)),
    public.video_premio_hc()
  )::public.cobro_video_resultado
$fn$;


-- ── 5 · mi_video ───────────────────────────────────────────────────────────
-- Lo que el cliente pinta ANTES de tocar nada: «Te quedan N de 8 hoy» o
-- «Vuelven en…». No escribe ni anota intento (K6: no mueve dinero).
create or replace function public.mi_video()
returns public.video_estado
language sql
stable
security definer
set search_path = ''
as $fn$
  select row(
    case when auth.uid() is null then 'sin_sesion' else 'ok' end,
    public.video_quedan(auth.uid()),
    public.video_tope_dia(),
    now(),
    public.video_reinicio(now()),
    public.video_premio_hc()
  )::public.video_estado
$fn$;

comment on function public.mi_video() is
  'ECO-1g · Videos que quedan hoy, el tope, el premio, el reloj del servidor y la próxima medianoche de Chicago. Sólo lee.';


-- ── 6 · pedir_boleto ───────────────────────────────────────────────────────
-- La llama el cliente cuando el jugador toca «Ver un video». Con `ok` hay un
-- boleto nuevo y el video puede empezar; con cualquier otro código no se
-- emitió nada y NADA cambió (salvo la anotación del intento).
--
-- S1 · pedir ANULA el boleto vivo anterior. Cerrar el video y volver a abrirlo
-- empieza los segundos desde cero: no hay atajo de «abrir, cerrar, esperar y
-- cobrar al reabrir». En dos dispositivos a la vez, el que pidió primero
-- recibirá `anulado` al cobrar.
--
-- El tope se mira ANTES de anular: con los 8 cobrados no se emite ni se anula.
create or replace function public.pedir_boleto()
returns public.boleto_video_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
  v_b   public.boletos_video;
begin
  if v_uid is null then
    return public.boleto_video_respuesta('sin_sesion', v_uid);
  end if;
  if not public.contar_intento_dinero('pedir_boleto', public.limite_dinero('pedir_boleto')) then
    return public.boleto_video_respuesta('limite', v_uid);
  end if;

  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return public.boleto_video_respuesta('sin_billetera', v_uid);
  end if;

  if public.video_cobrados_hoy(v_uid) >= public.video_tope_dia() then
    return public.boleto_video_respuesta('tope_dia', v_uid);
  end if;

  update public.boletos_video
     set anulado_en = now()
   where jugador_id = v_uid and cobrado_en is null and anulado_en is null;

  insert into public.boletos_video (jugador_id, emitido_en, vence_en)
  values (v_uid, now(), now() + public.video_vida_boleto())
  returning * into v_b;

  return public.boleto_video_respuesta('ok', v_uid, v_b);
end
$fn$;

comment on function public.pedir_boleto() is
  'ECO-1g · Emite el boleto de un video y anula el vivo anterior (S1). Con el tope del día alcanzado, tope_dia sin efectos.';


-- ── 7 · cobrar_boleto ──────────────────────────────────────────────────────
-- La llama el cliente cuando el video llegó al final. Paga `video_premio_hc()`
-- UNA vez por boleto.
--
-- EL ORDEN DE LAS COMPROBACIONES. «Ya cobrado» va ANTES que «vencido»: el
-- reintento de un cobro que sí entró tiene que recibir `ya_cobrado` con el
-- saldo ya subido (S3), también si llega pasados los 10 minutos.
--
-- S3 · IDEMPOTENCIA, por dos vías: la clave del libro `'video:' || id`, única,
-- y el `update … where cobrado_en is null`. Dos toques o un reintento de red
-- pagan una sola vez.
--
-- K7 · `limite` no toca el boleto: sigue vivo y el cliente lo reintenta.
--
-- `tope_dia` AQUÍ es una guarda: con un solo boleto vivo por cuenta (S1) la
-- cuenta de cobrados no puede subir mientras un boleto espera, así que por las
-- funciones no se llega. Se deja para que una escritura a mano no pague un
-- noveno video.
create or replace function public.cobrar_boleto(p_boleto uuid)
returns public.cobro_video_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_b      public.boletos_video;
  v_res    public.movimiento_resultado;
  v_desde  timestamptz;
begin
  if v_uid is null then
    return public.cobro_video_respuesta('sin_sesion', v_uid);
  end if;
  if not public.contar_intento_dinero('cobrar_boleto', public.limite_dinero('cobrar_boleto')) then
    return public.cobro_video_respuesta('limite', v_uid);
  end if;

  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return public.cobro_video_respuesta('sin_billetera', v_uid);
  end if;

  select b.* into v_b from public.boletos_video b where b.id = p_boleto for update;
  if not found then
    return public.cobro_video_respuesta('inexistente', v_uid);
  end if;
  if v_b.jugador_id <> v_uid then
    return public.cobro_video_respuesta('ajeno', v_uid);
  end if;
  if v_b.cobrado_en is not null then
    return public.cobro_video_respuesta('ya_cobrado', v_uid);
  end if;
  if v_b.anulado_en is not null then
    return public.cobro_video_respuesta('anulado', v_uid);
  end if;
  if now() >= v_b.vence_en then
    return public.cobro_video_respuesta('vencido', v_uid);
  end if;

  v_desde := v_b.emitido_en + make_interval(secs => public.video_minimo_s());
  if now() < v_desde then
    return public.cobro_video_respuesta('demasiado_pronto', v_uid, 0,
      ceil(extract(epoch from (v_desde - now())))::integer);
  end if;

  if public.video_cobrados_hoy(v_uid) >= public.video_tope_dia() then
    return public.cobro_video_respuesta('tope_dia', v_uid);
  end if;

  -- El dinero primero, y el boleto sólo si el libro lo anotó: las dos cosas
  -- van en la misma transacción, pero así un «no» del libro no deja un boleto
  -- marcado sin su línea. Con la billetera bloqueada y un monto positivo no
  -- cabe otro motivo que 'aplicado'.
  v_res := public.aplicar_movimiento(
    v_uid, 'video', public.video_premio_hc(),
    'video:' || v_b.id::text, 'boleto_video', v_b.id::text, null);
  if v_res.motivo <> 'aplicado' then
    raise warning 'ECO-1g: el boleto % de % no se pudo anotar (%)', v_b.id, v_uid, v_res.motivo;
    return public.cobro_video_respuesta('error_libro', v_uid);
  end if;

  update public.boletos_video
     set cobrado_en = now()
   where id = v_b.id and cobrado_en is null;

  return public.cobro_video_respuesta('ok', v_uid, public.video_premio_hc());
end
$fn$;

comment on function public.cobrar_boleto(uuid) is
  'ECO-1g · Paga el video contra su boleto, una sola vez (S3): pasados los segundos mínimos y antes de que venza.';


-- ── 8 · Cerraduras y permisos ──────────────────────────────────────────────
-- Como en la 1a §14, la 1c §13 y la 1d §10: RLS sin políticas y sin privilegios
-- de tabla para el cliente; `service_role` conserva lo suyo.
alter table public.boletos_video enable row level security;

revoke all on table public.boletos_video from public, anon, authenticated;

-- Internas: a nadie.
revoke execute on function public.video_premio_hc()                                              from public, anon, authenticated;
revoke execute on function public.video_tope_dia()                                               from public, anon, authenticated;
revoke execute on function public.video_minimo_s()                                               from public, anon, authenticated;
revoke execute on function public.video_vida_boleto()                                            from public, anon, authenticated;
revoke execute on function public.video_reinicio(timestamptz)                                    from public, anon, authenticated;
revoke execute on function public.video_cobrados_hoy(uuid)                                       from public, anon, authenticated;
revoke execute on function public.video_quedan(uuid)                                             from public, anon, authenticated;
revoke execute on function public.boleto_video_respuesta(text, uuid, public.boletos_video)       from public, anon, authenticated;
revoke execute on function public.cobro_video_respuesta(text, uuid, bigint, integer)             from public, anon, authenticated;
-- `create or replace` conserva los permisos de la 1d; se repite de todos modos.
revoke execute on function public.limite_dinero(text)                                            from public, anon, authenticated;

-- Las tres del cliente.
revoke execute on function public.mi_video()            from public, anon;
revoke execute on function public.pedir_boleto()        from public, anon;
revoke execute on function public.cobrar_boleto(uuid)   from public, anon;
grant  execute on function public.mi_video()            to authenticated, service_role;
grant  execute on function public.pedir_boleto()        to authenticated, service_role;
grant  execute on function public.cobrar_boleto(uuid)   to authenticated, service_role;


-- ── 9 · Realtime: fuera, y comprobado ──────────────────────────────────────
-- El mismo bloque que la 1a §15 y la 1d §11, para la tabla nueva.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'ECO-1g: supabase_realtime es FOR ALL TABLES; las tablas de dinero no pueden quedar fuera';
  end if;
  if exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'boletos_video') then
    alter publication supabase_realtime drop table public.boletos_video;
  end if;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — en `supabase/pruebas/eco1g_verificacion.sql`, no aquí.
-- ═══════════════════════════════════════════════════════════════════════════
-- Un solo bloque que Victor pega en el SQL Editor DESPUÉS del push; devuelve
-- una tabla `prueba | resultado | detalle` con PASA o FALLA y no deja rastro.
-- Antes del push lo corre `npm run guiones` contra un Postgres en memoria.
--
-- CORRIDA REAL · pendiente. Va al informe de la 1g; este archivo, una vez
-- aplicado, no se edita.
