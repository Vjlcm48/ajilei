-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1d — Constancia, límites por minuto y la válvula apagada
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_ECO-1_Fase1d_v1.0.md §2.1, con el plan del STOP-1 y sus
-- respuestas (P-1 a P-6). Normativo: docs/AJILEI_ECO-1_Reglas_v1.2.md §6 y §7.
--
-- Va SOBRE el libro de la 1a (20261007144943_eco1a_libro.sql) y las mesas de la
-- 1c (20261008220239_eco1c_mesas_ia.sql). Todo el dinero sigue pasando por
-- `aplicar_movimiento`; el tipo que usa la constancia (`constancia`) ya existe
-- en `movimientos_tipo_chk`.
--
-- ── LO QUE ESTE ARCHIVO PONE EN LA BASE ───────────────────────────────────
--   · `bono_constancia_hc()` la cifra de la constancia (K1), en UN sitio.
--   · `constancia`          la racha de cada jugador (K2, K3).
--   · `marcar_ingreso()`    el ingreso del día y el cobro de la constancia.
--   · `limite_dinero()`     los topes por minuto (K6), en UN sitio.
--   · las cinco funciones de la mesa de la 1c, REDEFINIDAS con su límite
--     (`create or replace`, misma firma, mismo tipo de resultado). Su cuerpo es
--     el de la 1c más las líneas marcadas «1d»; nada más cambia.
--   · `ajustes_economia`, `valvula_cambios`, `ganancia_ia_hoy()` y
--     `valvula_ia()`: la válvula (K8), construida y APAGADA.
--   · `constancia_admin()`  la ayuda de las pruebas de Victor (sólo SQL Editor).
--
-- ── LA DOCTRINA DE LA 1a Y LA 1c, QUE AQUÍ SIGUE ──────────────────────────
-- Sin `raise` en los caminos de negocio; el resultado sale siempre relleno;
-- `search_path = ''` y `security definer`; el cliente no lee ni escribe
-- tablas (RLS sin políticas y sin privilegios); nada entra en Realtime.
--
-- ── LOS LÍMITES (K6, K7; plan del STOP-1 §2) ──────────────────────────────
-- `contar_intento_dinero` (1a §7) anota el intento ANTES de contarlo: un
-- intento rechazado también cuenta. Por eso un límite sólo puede atrapar a un
-- cliente que reintenta más deprisa que el tope, y el cliente de la casa, en
-- régimen, reintenta cada 15 s (4/min, `ESPERAS_RED_MS`), por debajo de todos.
-- La comprobación va justo después de la de la sesión: lo primero que se
-- hace, y antes de bloquear nada.
--
-- `informar_pila` NO lleva límite (P-1): no mueve dinero, su abuso queda
-- acotado por el `seq` y por la fila propia, y anotar cada aviso duplicaría las
-- escrituras de la llamada más frecuente.
--
-- ── IDEMPOTENCIA DEL ARCHIVO ──────────────────────────────────────────────
-- `if not exists`, `create or replace`, `on conflict do nothing` y
-- `drop … if exists` en todo: el archivo entero se puede volver a pasar.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Las cifras ─────────────────────────────────────────────────────────

-- K1 · La cifra de la constancia vive AQUÍ y en ningún otro sitio del SQL,
-- como `bono_bienvenida_hc()`. Igual para todos, Premium o no.
create or replace function public.bono_constancia_hc()
returns bigint language sql immutable set search_path = ''
as $fn$ select 500::bigint $fn$;

-- K3 · Cada cuántos días seguidos se cobra.
create or replace function public.constancia_ciclo()
returns integer language sql immutable set search_path = ''
as $fn$ select 3 $fn$;

-- K6 · Los topes por minuto, en UN sitio (plan del STOP-1 §2). Espejo:
-- `LIMITES_SQL` en src/dev/bancoImitado.js, que su prueba de espejo lee de aquí.
--   sentarse_ia      10  ninguna mesa dura menos de ~15–20 s: ~4/min legítimas.
--   recargar_ia      20  una por mano (≥ 10 s) más los reintentos del mismo seq.
--   salir_ia         30  una por mesa más sus reintentos (≤ 7 el primer minuto):
--                        inalcanzable para un cliente legítimo, sólo frena bucles.
--   recoger_mesa_ia  10  una por arranque; cortada no cambia nada (la recoge C4).
--   marcar_ingreso    6  una por arranque y otra por cambio de día.
-- Un nombre desconocido da `null`, y `contar_intento_dinero` con tope nulo
-- responde «no cabe»: cerrado por defecto, que para dinero es lo seguro.
create or replace function public.limite_dinero(p_funcion text)
returns integer language sql immutable set search_path = ''
as $fn$
  select case p_funcion
           when 'sentarse_ia'     then 10
           when 'recargar_ia'     then 20
           when 'salir_ia'        then 30
           when 'recoger_mesa_ia' then 10
           when 'marcar_ingreso'  then 6
         end
$fn$;


-- ── 2 · La racha (K2, K3) ──────────────────────────────────────────────────
-- Una fila por jugador que alguna vez ingresó. Las cuentas que existían antes de
-- la 1d no tienen fila: su racha es 0 y su primer ingreso tras el push es el
-- día 1 (K3). `ultimo_dia` es un día de Chicago (`dia_chicago`).
create table if not exists public.constancia (
  jugador_id     uuid        primary key references public.profiles(id) on delete cascade,
  racha          integer     not null default 0,
  ultimo_dia     date,
  actualizada_en timestamptz not null default now(),

  constraint constancia_racha_chk check (racha >= 0),
  constraint constancia_dia_chk   check ((racha = 0) = (ultimo_dia is null))
);

comment on table public.constancia is
  'ECO-1d · Racha de días seguidos de ingreso (K3). La mueven marcar_ingreso y constancia_admin. RLS activo y CERO políticas.';

-- La respuesta de `marcar_ingreso` (y de `constancia_admin`).
--   codigo         'ok' · 'ya_marcado' · 'limite' · 'sin_sesion' ·
--                  'sin_billetera'; en `constancia_admin` además
--                  'sin_usuario' · 'argumento_invalido'.
--   racha          la racha tras el ingreso (0 si nunca ingresó).
--   dia_del_ciclo  1, 2 o 3 (0 con racha 0).
--   cobrado        lo que ESTA llamada abonó: 0 o `bono_constancia_hc()`.
--   saldo          la billetera AHORA.
--   dia            el día de Chicago de hoy, para que el cliente sepa cuándo
--                  cambia (plan del STOP-1 §1). Nunca nulo.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'constancia_resultado' and n.nspname = 'public') then
    create type public.constancia_resultado as (
      codigo        text,
      racha         integer,
      dia_del_ciclo integer,
      cobrado       bigint,
      saldo         bigint,
      dia           date
    );
  end if;
end
$$;

comment on type public.constancia_resultado is
  'ECO-1d · Respuesta de marcar_ingreso y constancia_admin. Todos los campos siempre rellenos.';

-- La respuesta, rellena. Interna.
create or replace function public.constancia_respuesta(
  p_codigo  text,
  p_jugador uuid,
  p_racha   integer,
  p_cobrado bigint default 0
)
returns public.constancia_resultado
language sql
stable
security definer
set search_path = ''
as $fn$
  select row(
    p_codigo,
    coalesce(p_racha, 0),
    case when coalesce(p_racha, 0) > 0
         then ((p_racha - 1) % public.constancia_ciclo()) + 1 else 0 end,
    coalesce(p_cobrado, 0),
    coalesce((select b.saldo from public.billeteras b where b.jugador_id = p_jugador), 0),
    public.dia_chicago(now())
  )::public.constancia_resultado
$fn$;


-- ── 3 · marcar_ingreso (K2–K4) ─────────────────────────────────────────────
-- La llama el cliente al arrancar con sesión y perfil, y al volver a primer
-- plano si cambió el día. Una vez por día de Chicago cuenta; las demás
-- devuelven `ya_marcado` sin tocar nada.
--
--   ayer → racha + 1 · hoy → nada · otro día o sin fila → racha = 1.
--   racha múltiplo de 3 → `constancia` de 500 HC, con clave
--   'constancia:<jugador>:<día>': un solo cobro por jugador y día aunque dos
--   dispositivos abran a la vez (y aunque la racha se simule dos veces en el
--   mismo día con `constancia_admin`: P-4).
--
-- CONCURRENCIA: la billetera se bloquea primero, como en todas las funciones de
-- dinero, y después la fila de la racha (`for update`). Dos llamadas
-- simultáneas van en fila: la segunda ve `ultimo_dia = hoy`.
create or replace function public.marcar_ingreso()
returns public.constancia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid     uuid := auth.uid();
  v_hoy     date := public.dia_chicago(now());
  v_fila    public.constancia;
  v_racha   integer;
  v_cobrado bigint := 0;
  v_res     public.movimiento_resultado;
begin
  if v_uid is null then
    return public.constancia_respuesta('sin_sesion', v_uid, 0);
  end if;
  if not public.contar_intento_dinero('marcar_ingreso', public.limite_dinero('marcar_ingreso')) then
    return public.constancia_respuesta('limite', v_uid,
      (select c.racha from public.constancia c where c.jugador_id = v_uid));
  end if;

  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return public.constancia_respuesta('sin_billetera', v_uid, 0);
  end if;

  insert into public.constancia (jugador_id) values (v_uid) on conflict (jugador_id) do nothing;
  select c.* into v_fila from public.constancia c where c.jugador_id = v_uid for update;

  if v_fila.ultimo_dia = v_hoy then
    return public.constancia_respuesta('ya_marcado', v_uid, v_fila.racha);
  end if;

  v_racha := case when v_fila.ultimo_dia = v_hoy - 1 then v_fila.racha + 1 else 1 end;

  update public.constancia
     set racha = v_racha, ultimo_dia = v_hoy, actualizada_en = now()
   where jugador_id = v_uid;

  if v_racha % public.constancia_ciclo() = 0 then
    v_res := public.aplicar_movimiento(
      v_uid, 'constancia', public.bono_constancia_hc(),
      'constancia:' || v_uid::text || ':' || v_hoy::text,
      'constancia', v_hoy::text, null);
    -- 'aplicado' es un cobro nuevo; 'repetido' es que hoy ya se cobró (P-4):
    -- no se paga ni se anuncia otra vez. Con la billetera bloqueada y monto
    -- positivo no cabe otro motivo; si lo hubiera, la racha avanza igual.
    if v_res.motivo = 'aplicado' then
      v_cobrado := public.bono_constancia_hc();
    elsif v_res.motivo <> 'repetido' then
      raise warning 'ECO-1d: la constancia de % del % no se anotó (%)', v_uid, v_hoy, v_res.motivo;
    end if;
  end if;

  return public.constancia_respuesta('ok', v_uid, v_racha, v_cobrado);
end
$fn$;


-- ── 4 · La válvula (K8), construida y APAGADA ──────────────────────────────
-- Un tope diario a la ganancia neta contra las IAS. Con el tope alcanzado,
-- `sentarse_ia` y `recargar_ia` responden `tope_diario` sin efectos (P-3); la
-- mesa en curso se sigue jugando y se paga completa al salir. PvP y los videos
-- no la miran. Se enciende, se ajusta y se apaga SÓLO desde el SQL Editor:
--
--   select * from public.valvula_ia(25000);   -- encender o cambiar el tope
--   select * from public.valvula_ia(null);    -- apagar
--   select * from public.ajustes_economia;    -- ver el estado
--   select * from public.valvula_cambios order by en desc;   -- el rastro

-- Una sola fila: la clave es un booleano que sólo puede ser `true`.
create table if not exists public.ajustes_economia (
  id             boolean     primary key default true,
  tope_diario_ia bigint,
  actualizada_en timestamptz not null default now(),

  constraint ajustes_economia_una_fila_chk check (id),
  constraint ajustes_economia_tope_chk     check (tope_diario_ia is null or tope_diario_ia > 0)
);

comment on table public.ajustes_economia is
  'ECO-1d · Ajustes de la economía, una sola fila. tope_diario_ia nulo = válvula APAGADA. Se cambia con valvula_ia().';

-- Nace apagada. Si la fila ya está (archivo pasado dos veces), no se toca.
insert into public.ajustes_economia (id, tope_diario_ia) values (true, null)
on conflict (id) do nothing;

-- El rastro: una fila por cada cambio. Es una tabla y no un `raise notice`
-- porque el aviso sólo lo ve la sesión del Editor que lo lanzó y no queda; la
-- tabla es un historial que se puede consultar después (plan del STOP-1 §3).
create table if not exists public.valvula_cambios (
  id           bigint      generated always as identity primary key,
  tope_antes   bigint,
  tope_despues bigint,
  quien        text        not null default current_user,
  en           timestamptz not null default now()
);

comment on table public.valvula_cambios is
  'ECO-1d · Rastro de valvula_ia(): tope antes y después, quién y cuándo. RLS activo y CERO políticas.';

-- Para sumar «las mesas cerradas hoy» sin recorrer todas las del jugador.
create index if not exists mesas_ia_jugador_cierre_idx
  on public.mesas_ia (jugador_id, cerrada_en) where estado = 'cerrada';

-- El tope encendido, o null. Interna.
create or replace function public.tope_diario_ia()
returns bigint language sql stable security definer set search_path = ''
as $fn$ select a.tope_diario_ia from public.ajustes_economia a where a.id $fn$;

-- P-2 · La ganancia neta de HOY contra las IAS, POR MESA y en el día de
-- Chicago en que se CIERRA: Σ (cobrado − entrada − recargado) de las mesas
-- cerradas hoy, más lo que daría la abierta si se cerrara ahora,
-- least(pila_informada, techo_cobro) − entrada − recargado.
--   · Una mesa que cruza la medianoche cuenta entera el día que se cierra,
--     no su entrada ayer y su salida hoy.
--   · La abierta cuenta ya: sentarse (que la cerraría por C4) no puede
--     esconder su ganancia.
-- El día empieza a la medianoche de Chicago, calculada con la zona por nombre
-- (el cambio de horario lo pone la base de zonas, como en `dia_chicago`).
-- Interna: la usan `sentarse_ia` y `recargar_ia`, y Victor desde el Editor.
create or replace function public.ganancia_ia_hoy(p_jugador uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $fn$
  with dia as (
    select (public.dia_chicago(now())::timestamp at time zone 'America/Chicago')               as desde,
           ((public.dia_chicago(now()) + 1)::timestamp at time zone 'America/Chicago')         as hasta
  )
  select coalesce((select sum(m.cobrado - m.entrada - m.recargado)
                     from public.mesas_ia m, dia
                    where m.jugador_id = p_jugador and m.estado = 'cerrada'
                      and m.cerrada_en >= dia.desde and m.cerrada_en < dia.hasta), 0)::bigint
       + coalesce((select least(m.pila_informada, m.techo_cobro) - m.entrada - m.recargado
                     from public.mesas_ia m
                    where m.jugador_id = p_jugador and m.estado = 'abierta'), 0)::bigint
$fn$;

-- ¿Está cerrada hoy la puerta para este jugador? Apagada = nunca. Interna.
create or replace function public.valvula_cerrada(p_jugador uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(public.ganancia_ia_hoy(p_jugador) >= public.tope_diario_ia(), false)
$fn$;

-- El estado que devuelve `valvula_ia`.
--   codigo 'encendida' · 'apagada' · 'sin_cambio' · 'tope_invalido'.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'valvula_estado' and n.nspname = 'public') then
    create type public.valvula_estado as (
      codigo         text,
      encendida      boolean,
      tope_diario_ia bigint,
      tope_antes     bigint
    );
  end if;
end
$$;

-- El mando de Victor. NO se concede a nadie (§9): en el SQL Editor se corre como
-- `postgres`, el dueño. Un tope ≤ 0 no cambia nada y lo dice.
create or replace function public.valvula_ia(p_tope bigint)
returns public.valvula_estado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_antes bigint;
begin
  select a.tope_diario_ia into v_antes from public.ajustes_economia a where a.id for update;
  if p_tope is not null and p_tope <= 0 then
    return row('tope_invalido', v_antes is not null, v_antes, v_antes)::public.valvula_estado;
  end if;
  if p_tope is not distinct from v_antes then
    return row('sin_cambio', v_antes is not null, v_antes, v_antes)::public.valvula_estado;
  end if;
  update public.ajustes_economia set tope_diario_ia = p_tope, actualizada_en = now() where id;
  insert into public.valvula_cambios (tope_antes, tope_despues) values (v_antes, p_tope);
  return row(case when p_tope is null then 'apagada' else 'encendida' end,
             p_tope is not null, p_tope, v_antes)::public.valvula_estado;
end
$fn$;


-- ── 5 · La ayuda de las pruebas de Victor (plan del STOP-1 §6) ─────────────
-- Deja la racha de una cuenta, buscada por NOMBRE DE USUARIO, en un estado
-- dado, sin mover dinero. Sólo SQL Editor (§9). Ejemplos:
--
--   -- «mañana es el día 3»: racha 2 y último día ayer
--   select * from public.constancia_admin('test1976', 2, public.dia_chicago(now()) - 1);
--   -- «faltó un día»: el último fue anteayer
--   select * from public.constancia_admin('test1976', 2, public.dia_chicago(now()) - 2);
--   -- como recién creada (racha 0)
--   select * from public.constancia_admin('test1976', 0, null);
--
-- Con racha 0 el día va nulo, y con racha > 0 tiene que haber día, y no puede
-- ser futuro. El resultado trae `codigo`, la racha, el día del ciclo, `saldo` y,
-- en `dia`, el último día que quedó (no el de hoy).
create or replace function public.constancia_admin(p_usuario text, p_racha integer, p_ultimo_dia date)
returns public.constancia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_id uuid;
  v_r  public.constancia_resultado;
begin
  select p.id into v_id from public.profiles p where lower(p.username) = lower(btrim(p_usuario));
  if not found then
    return row('sin_usuario', 0, 0, 0::bigint, 0::bigint, public.dia_chicago(now()))::public.constancia_resultado;
  end if;
  if p_racha is null or p_racha < 0
     or (p_racha = 0) <> (p_ultimo_dia is null)
     or p_ultimo_dia > public.dia_chicago(now()) then
    v_r := public.constancia_respuesta('argumento_invalido', v_id,
             (select c.racha from public.constancia c where c.jugador_id = v_id));
    return v_r;
  end if;

  insert into public.constancia as c (jugador_id, racha, ultimo_dia, actualizada_en)
  values (v_id, p_racha, p_ultimo_dia, now())
  on conflict (jugador_id) do update
    set racha = excluded.racha, ultimo_dia = excluded.ultimo_dia, actualizada_en = now();

  v_r := public.constancia_respuesta('ok', v_id, p_racha);
  v_r.dia := coalesce(p_ultimo_dia, v_r.dia);
  return v_r;
end
$fn$;


-- ── 6 · sentarse_ia, con su límite y la válvula ────────────────────────────
-- El cuerpo de la 1c (eco1c §6) más dos cosas, marcadas «1d»:
--   · el límite, justo tras la sesión;
--   · la válvula, DESPUÉS del token (un reintento de una apertura que sí se
--     hizo devuelve su mesa, nunca `tope_diario`) y de validar la mesa, y
--     ANTES del saldo y del cierre de la vieja: con `tope_diario` no pasa nada.
create or replace function public.sentarse_ia(
  p_reto        text,
  p_jugadores   integer,
  p_apuesta     integer,
  p_entrada     bigint,
  p_token       uuid,
  p_dispositivo text default null
)
returns public.mesa_ia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid     uuid := auth.uid();
  v_saldo   bigint;
  v_previa  public.mesas_ia;
  v_vieja   public.mesas_ia;
  v_nueva   public.mesas_ia;
  v_vuelve  bigint := 0;
  v_cierre  public.cierre_partida;
  v_res     public.movimiento_resultado;
  v_id      uuid := gen_random_uuid();
  v_vacia   public.mesas_ia;
begin
  if v_uid is null then
    return public.ia_respuesta('sin_sesion', v_uid, v_vacia);
  end if;
  -- 1d · K6
  if not public.contar_intento_dinero('sentarse_ia', public.limite_dinero('sentarse_ia')) then
    return public.ia_respuesta('limite', v_uid, v_vacia);
  end if;
  if p_reto is null or p_jugadores is null or p_apuesta is null or p_entrada is null or p_token is null then
    return public.ia_respuesta('argumento_invalido', v_uid, v_vacia);
  end if;

  select b.saldo into v_saldo from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return public.ia_respuesta('sin_billetera', v_uid, v_vacia);
  end if;

  -- El token, ya en fila. Si es de esta cuenta, es un reintento.
  select m.* into v_previa from public.mesas_ia m where m.token_apertura = p_token;
  if found then
    if v_previa.jugador_id <> v_uid then
      return public.ia_respuesta('token_en_uso', v_uid, v_vacia);
    end if;
    return public.ia_respuesta(
      case when v_previa.estado = 'abierta' then 'repetido' else 'mesa_cerrada' end,
      v_uid, v_previa, v_previa.reemplazo_de is not null, v_previa.reemplazo_cobro);
  end if;

  if p_reto not in ('basico', 'avanzado', 'pro') then
    return public.ia_respuesta('reto_invalido', v_uid, v_vacia);
  end if;
  if p_jugadores not between 2 and 5 then
    return public.ia_respuesta('jugadores_invalidos', v_uid, v_vacia);
  end if;
  if not (p_apuesta = any (public.ia_apuestas_de(p_reto))) then
    return public.ia_respuesta('apuesta_invalida', v_uid, v_vacia);
  end if;
  if p_entrada % p_apuesta <> 0
     or p_entrada < public.ia_entrada_piso(p_apuesta)
     or p_entrada > public.ia_techo_mesa(p_apuesta) then
    return public.ia_respuesta('entrada_invalida', v_uid, v_vacia);
  end if;

  -- 1d · K8 · la válvula. Sin efectos: ni cierra la vieja ni cobra.
  if public.valvula_cerrada(v_uid) then
    return public.ia_respuesta('tope_diario', v_uid, v_vacia);
  end if;

  -- Lo que devolvería la mesa vieja, para juzgar el saldo sin tocar nada.
  select m.* into v_vieja from public.mesas_ia m
   where m.jugador_id = v_uid and m.estado = 'abierta';
  if found then
    v_vuelve := least(v_vieja.pila_informada, v_vieja.techo_cobro);
  end if;
  if p_entrada > v_saldo + v_vuelve then
    return public.ia_respuesta('saldo_insuficiente', v_uid, v_vacia);
  end if;

  -- C4 · primero se cierra la vieja (su dinero vuelve), después se cobra.
  v_cierre := public.cerrar_partida_abierta(v_uid, 'reemplazada');

  v_res := public.aplicar_movimiento(
    v_uid, 'entrada_ia', -p_entrada,
    'entrada_ia:' || v_id::text, 'mesa_ia', v_id::text, null);
  if not v_res.aplicado then
    -- No debería pasar: el saldo se juzgó con la billetera ya bloqueada. Si
    -- pasa, la vieja SÍ quedó cerrada y cobrada, y eso se dice.
    return public.ia_respuesta(v_res.motivo, v_uid, v_vacia, v_cierre.cerrada, v_cierre.cobrado);
  end if;

  insert into public.mesas_ia
    (id, jugador_id, reto, jugadores, apuesta, entrada, techo_cobro, pila_informada,
     token_apertura, dispositivo, reemplazo_de, reemplazo_cobro)
  values
    (v_id, v_uid, p_reto, p_jugadores, p_apuesta, p_entrada,
     p_entrada + (p_jugadores - 1) * public.ia_pila_ia(p_entrada, p_apuesta),
     p_entrada, p_token, left(p_dispositivo, 64),
     case when v_cierre.cerrada then v_cierre.mesa_id end,
     coalesce(v_cierre.cobrado, 0))
  returning * into v_nueva;

  return public.ia_respuesta('ok', v_uid, v_nueva, v_cierre.cerrada, v_cierre.cobrado);
end
$fn$;


-- ── 7 · recargar_ia, con su límite y la válvula (P-3) ──────────────────────
-- El cuerpo de la 1c (eco1c §7) más el límite tras la sesión y la válvula
-- DESPUÉS de las respuestas de reintento (`repetido`, `seq_viejo`: una recarga
-- que ya entró sigue diciéndolo) y de validar el monto, y ANTES de cobrar.
-- `tope_diario` aquí es un «no» definitivo: la mesa sigue y se paga completa.
create or replace function public.recargar_ia(p_mesa uuid, p_monto bigint, p_seq integer)
returns public.mesa_ia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid   uuid := auth.uid();
  v_mesa  public.mesas_ia;
  v_res   public.movimiento_resultado;
  v_clave text;
  v_vacia public.mesas_ia;
begin
  if v_uid is null then
    return public.ia_respuesta('sin_sesion', v_uid, v_vacia);
  end if;
  -- 1d · K6
  if not public.contar_intento_dinero('recargar_ia', public.limite_dinero('recargar_ia')) then
    return public.ia_respuesta('limite', v_uid, v_vacia);
  end if;
  if p_mesa is null or p_monto is null or p_seq is null then
    return public.ia_respuesta('argumento_invalido', v_uid, v_vacia);
  end if;
  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return public.ia_respuesta('sin_billetera', v_uid, v_vacia);
  end if;

  select m.* into v_mesa from public.mesas_ia m
   where m.id = p_mesa and m.jugador_id = v_uid for update;
  if not found then
    return public.ia_respuesta('sin_mesa', v_uid, v_vacia);
  end if;
  if v_mesa.estado <> 'abierta' then
    return public.ia_respuesta('mesa_cerrada', v_uid, v_mesa);
  end if;

  v_clave := 'recarga_ia:' || v_mesa.id::text || ':' || p_seq::text;
  if exists (select 1 from public.movimientos m where m.clave_idem = v_clave) then
    return public.ia_respuesta('repetido', v_uid, v_mesa);
  end if;
  if p_seq <= v_mesa.seq_informada then
    return public.ia_respuesta('seq_viejo', v_uid, v_mesa);
  end if;

  if p_monto <= 0 or p_monto % v_mesa.apuesta <> 0 then
    return public.ia_respuesta('monto_invalido', v_uid, v_mesa);
  end if;
  if v_mesa.pila_informada + p_monto > public.ia_techo_mesa(v_mesa.apuesta) then
    return public.ia_respuesta('sobre_techo', v_uid, v_mesa);
  end if;

  -- 1d · K8 · P-3 · la válvula, sin efectos.
  if public.valvula_cerrada(v_uid) then
    return public.ia_respuesta('tope_diario', v_uid, v_mesa);
  end if;

  v_res := public.aplicar_movimiento(
    v_uid, 'recarga_ia', -p_monto, v_clave, 'mesa_ia', v_mesa.id::text, null);
  if not v_res.aplicado then
    return public.ia_respuesta(v_res.motivo, v_uid, v_mesa);
  end if;

  update public.mesas_ia
     set recargado       = recargado + p_monto,
         recargas        = recargas + 1,
         techo_cobro     = techo_cobro + p_monto
                           + (jugadores - 1) * public.ia_techo_mesa(apuesta),
         pila_informada  = pila_informada + p_monto,
         seq_informada   = p_seq,
         ultimo_aviso_en = now()
   where id = v_mesa.id
  returning * into v_mesa;

  return public.ia_respuesta('ok', v_uid, v_mesa);
end
$fn$;


-- ── 8 · salir_ia, con su límite ────────────────────────────────────────────
-- El cuerpo de la 1c (eco1c §9) más el límite tras la sesión. K7: con 30/min
-- ningún cliente legítimo lo alcanza, y si un bucle lo alcanzara la respuesta
-- `limite` NO toca la mesa: sigue abierta con su última pila, y la cobra la
-- siguiente salida que quepa, `recoger_mesa_ia` o el cierre de C4 al sentarse.
-- La válvula no la mira nunca: la mesa en curso se paga completa (K8).
create or replace function public.salir_ia(p_mesa uuid, p_fichas bigint, p_seq integer)
returns public.mesa_ia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid   uuid := auth.uid();
  v_mesa  public.mesas_ia;
  v_cobro bigint;
  v_res   public.movimiento_resultado;
  v_vacia public.mesas_ia;
begin
  if v_uid is null then
    return public.ia_respuesta('sin_sesion', v_uid, v_vacia);
  end if;
  -- 1d · K6
  if not public.contar_intento_dinero('salir_ia', public.limite_dinero('salir_ia')) then
    return public.ia_respuesta('limite', v_uid, v_vacia);
  end if;
  if p_mesa is null or p_fichas is null or p_fichas < 0 or p_seq is null then
    return public.ia_respuesta('argumento_invalido', v_uid, v_vacia);
  end if;
  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return public.ia_respuesta('sin_billetera', v_uid, v_vacia);
  end if;

  select m.* into v_mesa from public.mesas_ia m
   where m.id = p_mesa and m.jugador_id = v_uid for update;
  if not found then
    return public.ia_respuesta('sin_mesa', v_uid, v_vacia);
  end if;
  if v_mesa.estado <> 'abierta' then
    return public.ia_respuesta(
      case when v_mesa.motivo_cierre = 'salida' then 'repetido' else 'mesa_cerrada' end,
      v_uid, v_mesa);
  end if;
  if p_seq <= v_mesa.seq_informada then
    return public.ia_respuesta('seq_viejo', v_uid, v_mesa);
  end if;

  v_cobro := least(p_fichas, v_mesa.techo_cobro);
  if v_cobro > 0 then
    v_res := public.aplicar_movimiento(
      v_uid, 'salida_ia', v_cobro,
      'salida_ia:' || v_mesa.id::text, 'mesa_ia', v_mesa.id::text, null);
    if not v_res.aplicado then
      return public.ia_respuesta(v_res.motivo, v_uid, v_mesa);
    end if;
  end if;

  update public.mesas_ia
     set estado          = 'cerrada',
         motivo_cierre   = 'salida',
         cobrado         = v_cobro,
         pila_informada  = v_cobro,
         seq_informada   = p_seq,
         anomalias       = anomalias + case when p_fichas > techo_cobro then 1 else 0 end,
         ultimo_aviso_en = now(),
         cerrada_en      = now()
   where id = v_mesa.id
  returning * into v_mesa;

  return public.ia_respuesta('ok', v_uid, v_mesa);
end
$fn$;


-- ── 9 · recoger_mesa_ia, con su límite ─────────────────────────────────────
-- El cuerpo de la 1c (eco1c §11) más el límite tras la sesión. Cortada no
-- cambia nada: la mesa sigue abierta y la recoge el siguiente arranque o el
-- cierre de C4 al sentarse (K7).
create or replace function public.recoger_mesa_ia(p_dispositivo text default null)
returns public.mesa_ia_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_mesa   public.mesas_ia;
  v_cierre public.cierre_partida;
  v_vacia  public.mesas_ia;
begin
  if v_uid is null then
    return public.ia_respuesta('sin_sesion', v_uid, v_vacia);
  end if;
  -- 1d · K6
  if not public.contar_intento_dinero('recoger_mesa_ia', public.limite_dinero('recoger_mesa_ia')) then
    return public.ia_respuesta('limite', v_uid, v_vacia);
  end if;
  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;

  select m.* into v_mesa from public.mesas_ia m
   where m.jugador_id = v_uid and m.estado = 'abierta';
  if not found then
    return public.ia_respuesta('ninguna', v_uid, v_vacia);
  end if;

  if not ((p_dispositivo is not null and v_mesa.dispositivo is not distinct from left(p_dispositivo, 64))
          or v_mesa.ultimo_aviso_en < now() - public.ia_silencio_recogida()) then
    return public.ia_respuesta('viva', v_uid, v_mesa);
  end if;

  v_cierre := public.cerrar_partida_abierta(v_uid, 'abandono');
  select m.* into v_mesa from public.mesas_ia m where m.id = v_cierre.mesa_id;
  return public.ia_respuesta('recogida', v_uid, v_mesa);
end
$fn$;


-- ── 10 · Cerraduras y permisos ─────────────────────────────────────────────
-- Como en la 1a §14 y la 1c §13: RLS sin políticas y sin privilegios de tabla
-- para el cliente; `service_role` conserva lo suyo.
alter table public.constancia       enable row level security;
alter table public.ajustes_economia enable row level security;
alter table public.valvula_cambios  enable row level security;

revoke all on table public.constancia       from public, anon, authenticated;
revoke all on table public.ajustes_economia from public, anon, authenticated;
revoke all on table public.valvula_cambios  from public, anon, authenticated;

-- Internas y del Editor: a nadie.
revoke execute on function public.bono_constancia_hc()                                   from public, anon, authenticated;
revoke execute on function public.constancia_ciclo()                                     from public, anon, authenticated;
revoke execute on function public.limite_dinero(text)                                    from public, anon, authenticated;
revoke execute on function public.constancia_respuesta(text, uuid, integer, bigint)      from public, anon, authenticated;
revoke execute on function public.tope_diario_ia()                                       from public, anon, authenticated;
revoke execute on function public.ganancia_ia_hoy(uuid)                                  from public, anon, authenticated;
revoke execute on function public.valvula_cerrada(uuid)                                  from public, anon, authenticated;
revoke execute on function public.valvula_ia(bigint)                                     from public, anon, authenticated;
revoke execute on function public.constancia_admin(text, integer, date)                  from public, anon, authenticated;

-- La del cliente.
revoke execute on function public.marcar_ingreso()                                       from public, anon;
grant  execute on function public.marcar_ingreso()                                       to authenticated, service_role;

-- Las cinco redefinidas: `create or replace` conserva sus permisos de la 1c; se
-- repiten de todos modos, como hizo la 1a con `saldo_de`.
revoke execute on function public.sentarse_ia(text, integer, integer, bigint, uuid, text) from public, anon;
revoke execute on function public.recargar_ia(uuid, bigint, integer)                      from public, anon;
revoke execute on function public.salir_ia(uuid, bigint, integer)                         from public, anon;
revoke execute on function public.recoger_mesa_ia(text)                                   from public, anon;
grant  execute on function public.sentarse_ia(text, integer, integer, bigint, uuid, text) to authenticated, service_role;
grant  execute on function public.recargar_ia(uuid, bigint, integer)                      to authenticated, service_role;
grant  execute on function public.salir_ia(uuid, bigint, integer)                         to authenticated, service_role;
grant  execute on function public.recoger_mesa_ia(text)                                   to authenticated, service_role;


-- ── 11 · Realtime: fuera, y comprobado ─────────────────────────────────────
-- El mismo bloque que la 1a §15, para las tres tablas nuevas.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'ECO-1d: supabase_realtime es FOR ALL TABLES; las tablas de dinero no pueden quedar fuera';
  end if;
  foreach t in array array['constancia', 'ajustes_economia', 'valvula_cambios'] loop
    if exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — en `supabase/pruebas/eco1d_verificacion.sql`, no aquí.
-- ═══════════════════════════════════════════════════════════════════════════
-- Un solo bloque que Victor pega en el SQL Editor DESPUÉS del push; devuelve
-- una tabla `prueba | resultado | detalle` con PASA o FALLA y no deja rastro.
--
-- CORRIDA REAL · pendiente. Va al informe de la 1d; este archivo, una vez
-- aplicado, no se edita.
-- ═══════════════════════════════════════════════════════════════════════════
