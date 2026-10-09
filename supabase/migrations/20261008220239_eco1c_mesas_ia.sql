-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1c — La mesa contra las IAS, en el servidor
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_ECO-1_Fase1c_v1.0.md §2.1, con las respuestas del STOP-1
-- (P-1 a P-4). Normativo: docs/AJILEI_ECO-1_Reglas_v1.0.md §5 (v1.1 con C4–C6).
-- Hechos: docs/reportes/AJILEI_ECO-1_Fase0_Informe_v1.0.md §C y §D.
--
-- Va SOBRE el libro de la 1a (20261007144943_eco1a_libro.sql): todo el dinero
-- pasa por `aplicar_movimiento`, en la misma transacción que el cambio de la
-- mesa. Los cuatro tipos que usa ya existen en `movimientos_tipo_chk`:
-- `entrada_ia`, `recarga_ia`, `salida_ia` y `abandono_ia`.
--
-- ── LO QUE ESTE ARCHIVO PONE EN LA BASE ───────────────────────────────────
--   · `mesas_ia`        una fila por mesa contra las IAS, con su techo de cobro
--                       y la última pila que el teléfono avisó.
--   · `record_manos`    manos jugadas y ganadas, por jugador, reto y vivos.
--   · `cerrar_partida_abierta` la pieza ÚNICA de la regla C4 (una sola partida
--                       abierta por cuenta). MES-PvP le añadirá su rama.
--   · las seis funciones del cliente: `sentarse_ia`, `recargar_ia`,
--     `informar_pila`, `salir_ia`, `mi_mesa_ia` y `recoger_mesa_ia`.
--   · `record_manos_resumen()`, la consulta de Victor (sin acceso del cliente).
--
-- ── LA DOCTRINA DE LA 1a, QUE AQUÍ SE REPITE ──────────────────────────────
-- 1. El cliente no lee ni escribe tablas: RLS sin políticas y sin privilegios.
-- 2. Todo cuelga de `auth.uid()`; ninguna función de cliente recibe el uuid
--    del jugador.
-- 3. Sin `raise` en los caminos de negocio (lección A1 de SAL-B1): todo
--    devuelve un `mesa_ia_resultado` con un `codigo`.
-- 4. Nada de `returns <tabla>` con `return null` (A2): el compuesto sale
--    siempre con `codigo`, `saldo`, `pila`, `techo`, `seq`, `cobrado`,
--    `anterior_cerrada` y `anterior_cobro` rellenos; `mesa_id` y
--    `motivo_cierre` son nulos sólo cuando no hay mesa o no está cerrada.
-- 5. Ninguna tabla de dinero entra en Realtime.
--
-- ── EL ORDEN DE LAS PREGUNTAS (lección A3 de SAL-B1) ──────────────────────
-- «¿Es tuya y sigue viva la mesa?» va SIEMPRE antes que «¿esto ya lo hiciste?».
-- Un dispositivo que perdió su mesa (C6) recibe `mesa_cerrada` aunque esté
-- reintentando algo que ya se aplicó: lo que importa es que se entere.
--
-- ── CONCURRENCIA ──────────────────────────────────────────────────────────
-- Las seis funciones empiezan bloqueando la billetera del jugador
-- (`for update`), igual que `aplicar_movimiento`. Así todo lo que una cuenta
-- hace con su dinero —desde dos teléfonos o dos pestañas— va en fila, y el
-- índice único de §2 es sólo la última red.
--
-- ── LÍMITES POR MINUTO ────────────────────────────────────────────────────
-- No entran aquí (son de la 1d). El sitio está listo: cada función de dinero
-- llamará a `contar_intento_dinero` justo tras comprobar la sesión, y como esa
-- función no lanza, el corte saldrá como un `codigo` más.
--
-- ── IDEMPOTENCIA DEL ARCHIVO ──────────────────────────────────────────────
-- `if not exists`, `create or replace` y `drop … if exists` en todo: el
-- archivo entero se puede volver a pasar (se probó así; informe 1c §3).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Las constantes, espejo del cliente ─────────────────────────────────
-- Cada cifra vive AQUÍ y en su archivo del cliente, y el comentario dice cuál.
-- Si una se mueve en el cliente y no aquí, el servidor rechaza lo que el
-- teléfono ofrece: el guion de verificación lo cazaría con las prueba 3 y 4.

-- Las apuestas de cada reto. Espejo: `NIVELES[].apuestas` en src/config/niveles.js.
-- Un reto desconocido da un array vacío, y con él `apuesta_invalida`.
create or replace function public.ia_apuestas_de(p_reto text)
returns integer[]
language sql
immutable
set search_path = ''
as $fn$
  select case p_reto
    when 'basico'   then array[50, 100, 150, 250]
    when 'avanzado' then array[100, 200, 300, 500]
    when 'pro'      then array[200, 400, 600, 1000]
    else '{}'::integer[]
  end
$fn$;

-- Piso y techo de la entrada, en múltiplos de la apuesta. Espejo:
-- `betting.entrada` en src/config/ajileiConfig.js (piso 10, techo 50).
create or replace function public.ia_entrada_piso(p_apuesta bigint)
returns bigint language sql immutable set search_path = ''
as $fn$ select 10 * p_apuesta $fn$;

create or replace function public.ia_techo_mesa(p_apuesta bigint)
returns bigint language sql immutable set search_path = ''
as $fn$ select 50 * p_apuesta $fn$;

-- La pila de cada IA al sentarse: min(round(E × 1,5), T). Espejo: `pilaIA` en
-- src/engine/entrada.js (`factorPila` 1,5 en ajileiConfig.js). Con E entero,
-- E × 1,5 es entero o termina en ,5, y `round(numeric)` lo sube igual que
-- `Math.round`, porque aquí nunca es negativo.
create or replace function public.ia_pila_ia(p_entrada bigint, p_apuesta bigint)
returns bigint language sql immutable set search_path = ''
as $fn$ select least(round(p_entrada * 1.5)::bigint, public.ia_techo_mesa(p_apuesta)) $fn$;

-- El silencio a partir del cual `recoger_mesa_ia` da por muerta una mesa de
-- OTRO dispositivo (P-4: N = 10 min). La del mismo dispositivo se recoge
-- siempre: una mesa no sobrevive a recargar la página.
create or replace function public.ia_silencio_recogida()
returns interval language sql immutable set search_path = ''
as $fn$ select interval '10 minutes' $fn$;


-- ── 2 · Las mesas ──────────────────────────────────────────────────────────
-- `techo_cobro` es la cota segura del informe de la Fase 0 §D.1:
--   al sentarse   techo = E + (n−1)·P(E)
--   cada recarga  techo += r + (n−1)·T
-- Nunca es el máximo honesto (el servidor no conoce las pilas de las IAS): es
-- lo más que una mesa honesta puede tener en la pila del humano, y nada se
-- cobra por encima.
--
-- `pila_informada` es lo que se cobra si la partida se corta (C3). Nace en la
-- entrada (seq 0) y la mueven `informar_pila` y `recargar_ia`.
--
-- `reemplazo_de` y `reemplazo_cobro` guardan lo que esta mesa cerró al abrirse
-- (C4), para que el reintento de `sentarse_ia` con el mismo token devuelva el
-- MISMO aviso C5 que la primera respuesta, aunque ésta se perdiera.
--
-- `dispositivo` es la marca del navegador (P-4). La pone el cliente y sólo
-- sirve para decidir si `recoger_mesa_ia` cierra en el acto; cerrar nunca le
-- quita dinero a nadie, así que no es una frontera de seguridad.
create table if not exists public.mesas_ia (
  id               uuid        primary key default gen_random_uuid(),
  jugador_id       uuid        not null references public.profiles(id) on delete cascade,
  reto             text        not null,
  jugadores        smallint    not null,
  apuesta          integer     not null,
  entrada          bigint      not null,
  recargado        bigint      not null default 0,
  recargas         integer     not null default 0,
  techo_cobro      bigint      not null,
  pila_informada   bigint      not null,
  seq_informada    integer     not null default 0,
  anomalias        integer     not null default 0,
  estado           text        not null default 'abierta',
  motivo_cierre    text,
  cobrado          bigint,
  token_apertura   uuid        not null,
  dispositivo      text,
  reemplazo_de     uuid,
  reemplazo_cobro  bigint      not null default 0,
  abierta_en       timestamptz not null default now(),
  ultimo_aviso_en  timestamptz not null default now(),
  cerrada_en       timestamptz,

  constraint mesas_ia_token_uniq     unique (token_apertura),
  constraint mesas_ia_reto_chk       check (reto in ('basico', 'avanzado', 'pro')),
  constraint mesas_ia_jugadores_chk  check (jugadores between 2 and 5),
  constraint mesas_ia_apuesta_chk    check (apuesta > 0),
  constraint mesas_ia_entrada_chk    check (entrada > 0),
  constraint mesas_ia_cifras_chk     check (recargado >= 0 and recargas >= 0 and techo_cobro > 0
                                            and pila_informada >= 0 and seq_informada >= 0
                                            and anomalias >= 0 and reemplazo_cobro >= 0),
  constraint mesas_ia_estado_chk     check (estado in ('abierta', 'cerrada')),
  constraint mesas_ia_motivo_chk     check (motivo_cierre is null
                                            or motivo_cierre in ('salida', 'abandono', 'reemplazada')),
  -- Abierta ⇔ sin motivo, sin cobro y sin fecha de cierre. Una fila a medias
  -- no puede existir: la cierran siempre las mismas dos funciones.
  constraint mesas_ia_cierre_chk     check ((estado = 'abierta') = (motivo_cierre is null)
                                            and (estado = 'abierta') = (cobrado is null)
                                            and (estado = 'abierta') = (cerrada_en is null)),
  constraint mesas_ia_dispositivo_chk check (dispositivo is null or length(dispositivo) <= 64)
);

-- C4 · UNA SOLA mesa abierta por cuenta. Las funciones ya lo garantizan
-- cerrando antes de abrir y en fila por la billetera; esto es la última red.
create unique index if not exists mesas_ia_una_abierta_idx
  on public.mesas_ia (jugador_id) where estado = 'abierta';

create index if not exists mesas_ia_jugador_idx
  on public.mesas_ia (jugador_id, abierta_en);

comment on table public.mesas_ia is
  'ECO-1c · Mesas contra las IAS. Sin lectura del cliente; las mueven sentarse_ia, recargar_ia, informar_pila, salir_ia, recoger_mesa_ia y cerrar_partida_abierta.';
comment on column public.mesas_ia.techo_cobro is
  'Cota segura (Fase 0 §D.1): E + (n−1)·P(E) al sentarse y + r + (n−1)·T por recarga. Nada se cobra por encima.';
comment on column public.mesas_ia.pila_informada is
  'Última pila del humano avisada por el teléfono (C3), topada por techo_cobro. Es lo que se cobra si la partida se corta.';


-- ── 3 · El récord de manos (C7) ────────────────────────────────────────────
-- Por jugador, reto y jugadores VIVOS en la mano (2–5). La mano la gana quien
-- se lleva el pozo PRINCIPAL; lo calcula el teléfono y viaja en el aviso de fin
-- de mano. Sin importar entradas ni recargas: sólo manos.
create table if not exists public.record_manos (
  jugador_id      uuid     not null references public.profiles(id) on delete cascade,
  reto            text     not null,
  vivos           smallint not null,
  jugadas         integer  not null default 0,
  ganadas_humano  integer  not null default 0,
  ganadas_ia      integer  not null default 0,
  actualizado_en  timestamptz not null default now(),

  constraint record_manos_pk        primary key (jugador_id, reto, vivos),
  constraint record_manos_reto_chk  check (reto in ('basico', 'avanzado', 'pro')),
  constraint record_manos_vivos_chk check (vivos between 2 and 5),
  constraint record_manos_suma_chk  check (jugadas >= 0 and ganadas_humano >= 0 and ganadas_ia >= 0
                                           and jugadas = ganadas_humano + ganadas_ia)
);

comment on table public.record_manos is
  'ECO-1c · Récord de manos contra las IAS (C7). Lo escribe informar_pila con el aviso de fin de mano; lo consulta Victor con record_manos_resumen().';


-- ── 4 · La respuesta ───────────────────────────────────────────────────────
--   codigo           'ok' · 'repetido' · 'mesa_cerrada' · 'sin_mesa' ·
--                    'saldo_insuficiente' · 'sobre_techo' · 'reto_invalido' ·
--                    'jugadores_invalidos' · 'apuesta_invalida' ·
--                    'entrada_invalida' · 'monto_invalido' · 'seq_viejo' ·
--                    'token_en_uso' · 'sin_sesion' · 'sin_billetera' ·
--                    'argumento_invalido' · y en `recoger_mesa_ia`
--                    'recogida' · 'ninguna' · 'viva'.
--   mesa_id          la mesa de la que se habla (null si no hay ninguna).
--   saldo            el saldo de la billetera AHORA, tras lo que se hizo.
--   pila, techo, seq la pila avisada, el techo y el último seq de la mesa.
--   cobrado          lo que volvió al saldo al cerrar ESTA mesa (0 si sigue
--                    abierta o no volvió nada).
--   anterior_cerrada si `sentarse_ia` cerró otra mesa al abrir ésta (C4/C5).
--   anterior_cobro   lo que aquella devolvió (0 puede ser verdad: C5 con 0).
--   motivo_cierre    'salida' · 'abandono' · 'reemplazada' si la mesa está
--                    cerrada; null si sigue abierta.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'mesa_ia_resultado' and n.nspname = 'public') then
    create type public.mesa_ia_resultado as (
      codigo           text,
      mesa_id          uuid,
      saldo            bigint,
      pila             bigint,
      techo            bigint,
      seq              integer,
      cobrado          bigint,
      anterior_cerrada boolean,
      anterior_cobro   bigint,
      motivo_cierre    text
    );
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'cierre_partida' and n.nspname = 'public') then
    create type public.cierre_partida as (
      cerrada  boolean,
      mesa_id  uuid,
      cobrado  bigint
    );
  end if;
end
$$;

comment on type public.mesa_ia_resultado is
  'ECO-1c · Respuesta de las funciones de mesa contra las IAS. codigo siempre relleno.';

-- El saldo actual de un jugador, para rellenar respuestas. Interna.
create or replace function public.ia_saldo_actual(p_jugador uuid)
returns bigint language sql stable security definer set search_path = ''
as $fn$
  select coalesce((select b.saldo from public.billeteras b where b.jugador_id = p_jugador), 0)::bigint
$fn$;

-- Una respuesta a partir de una fila de mesa. Interna. Con `p_mesa.id` nulo
-- (no hay mesa) los campos de la mesa salen a 0, nunca nulos.
create or replace function public.ia_respuesta(
  p_codigo  text,
  p_jugador uuid,
  p_mesa    public.mesas_ia,
  p_anterior_cerrada boolean default false,
  p_anterior_cobro   bigint  default 0
)
returns public.mesa_ia_resultado
language sql
stable
security definer
set search_path = ''
as $fn$
  select row(
    p_codigo,
    p_mesa.id,
    public.ia_saldo_actual(p_jugador),
    coalesce(p_mesa.pila_informada, 0),
    coalesce(p_mesa.techo_cobro, 0),
    coalesce(p_mesa.seq_informada, 0),
    coalesce(p_mesa.cobrado, 0),
    coalesce(p_anterior_cerrada, false),
    coalesce(p_anterior_cobro, 0),
    p_mesa.motivo_cierre
  )::public.mesa_ia_resultado
$fn$;


-- ── 5 · C4 · La pieza de cierre ────────────────────────────────────────────
-- Cierra la partida abierta del jugador, si la hay, y devuelve lo que cobró.
-- Hoy sólo existen las mesas contra las IAS; MES-PvP añadirá aquí la rama de
-- su mesa para que la regla «una sola partida abierta por cuenta, en cualquier
-- modo» siga siendo UNA (Reglas §5 y §8, v1.1).
--
-- Cobra `least(pila_informada, techo_cobro)` como `abandono_ia`. La clave es
-- por mesa, así que una mesa no se cobra dos veces aunque algo la cerrara a la
-- vez por dos caminos. Con 0 no hay movimiento (`movimientos_monto_chk`), sólo
-- el cierre.
--
-- Interna: la llaman `sentarse_ia` (motivo 'reemplazada') y `recoger_mesa_ia`
-- (motivo 'abandono'). Quien la llama ya tiene bloqueada la billetera.
create or replace function public.cerrar_partida_abierta(p_jugador uuid, p_motivo text)
returns public.cierre_partida
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_mesa  public.mesas_ia;
  v_cobro bigint;
  v_res   public.movimiento_resultado;
begin
  select m.* into v_mesa
    from public.mesas_ia m
   where m.jugador_id = p_jugador and m.estado = 'abierta'
     for update;
  if not found then
    return row(false, null::uuid, 0::bigint)::public.cierre_partida;
  end if;

  v_cobro := least(v_mesa.pila_informada, v_mesa.techo_cobro);
  if v_cobro > 0 then
    v_res := public.aplicar_movimiento(
      p_jugador, 'abandono_ia', v_cobro,
      'abandono_ia:' || v_mesa.id::text, 'mesa_ia', v_mesa.id::text, null);
    -- Con la billetera bloqueada y un monto positivo sólo puede fallar si la
    -- clave ya estaba: entonces el cobro YA se hizo y se cierra igual.
    if not v_res.aplicado then
      raise warning 'ECO-1c: el abandono de la mesa % no se anotó (%)', v_mesa.id, v_res.motivo;
    end if;
  end if;

  update public.mesas_ia
     set estado = 'cerrada', motivo_cierre = p_motivo, cobrado = v_cobro, cerrada_en = now()
   where id = v_mesa.id;

  return row(true, v_mesa.id, v_cobro)::public.cierre_partida;
end
$fn$;


-- ── 6 · sentarse_ia ────────────────────────────────────────────────────────
-- Valida la mesa (reto, jugadores, apuesta del reto, entrada como
-- `entradaValida`: entero, múltiplo de u, 10u ≤ E ≤ 50u; P-1), cierra la mesa
-- vieja si la hay (C4), cobra la entrada y abre la nueva.
--
-- SIN EFECTOS SI NO PUEDE: el saldo se juzga ANTES de cerrar la vieja, contando
-- lo que ésta devolvería. Si no alcanza ni así, no se cierra nada.
--
-- IDEMPOTENTE POR TOKEN: el mismo token devuelve la misma mesa sin cobrar otra
-- vez, con el mismo aviso C5 (`reemplazo_de`/`reemplazo_cobro`). Pero si esa
-- mesa ya se cerró —otro dispositivo, o el jugador salió—, la respuesta es
-- `mesa_cerrada`: un reintento tardío no reabre nada.
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


-- ── 7 · recargar_ia ────────────────────────────────────────────────────────
-- Mesa propia y abierta. El monto: entero > 0, múltiplo de la apuesta
-- (`recargaValida`, src/hooks/mesaCore.js) y, con la pila avisada, que no pase
-- del techo de la mesa (P-3: `pila_informada + r ≤ T`). El saldo lo juzga
-- `aplicar_movimiento`.
--
-- Cobra, suma a `recargado`, sube el techo con la holgura de los nivelados
-- (r + (n−1)·T) y sube la pila avisada en r. Idempotente por (mesa, seq): el
-- mismo seq devuelve `repetido` sin cobrar.
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


-- ── 8 · informar_pila ──────────────────────────────────────────────────────
-- NO MUEVE DINERO. Guarda la pila del humano (C3) si el seq es nuevo; un seq
-- viejo o repetido se ignora sin error (`repetido`). Una pila por encima del
-- techo se topa y se anota la anomalía.
--
-- El fin de mano (C7) viaja en los dos últimos parámetros: los dos nulos = no
-- es fin de mano. Sólo cuenta con un seq nuevo, así que un reintento no suma
-- dos veces. Unos `vivos` imposibles (fuera de 2…jugadores) no se anotan y
-- cuentan como anomalía; la pila se guarda igual.
--
-- Si la mesa ya está cerrada lo dice (`mesa_cerrada`, C6).
create or replace function public.informar_pila(
  p_mesa        uuid,
  p_seq         integer,
  p_pila        bigint,
  p_fin_vivos   integer default null,
  p_fin_gano    boolean default null
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
  v_fin       boolean := p_fin_vivos is not null or p_fin_gano is not null;
  v_vacia     public.mesas_ia;
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
    else
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
  end if;

  update public.mesas_ia
     set pila_informada  = v_pila,
         seq_informada   = p_seq,
         anomalias       = anomalias + v_anomalias,
         ultimo_aviso_en = now()
   where id = v_mesa.id
  returning * into v_mesa;

  return public.ia_respuesta('ok', v_uid, v_mesa);
end
$fn$;


-- ── 9 · salir_ia ───────────────────────────────────────────────────────────
-- Cobra `min(fichas, techo)` como `salida_ia` y cierra con motivo 'salida'.
-- UNA SOLA VEZ: si la mesa ya se cerró por salida, devuelve lo ya cobrado
-- (`repetido`) sin moverse. Si la cerró otra cosa (otro dispositivo, el
-- arranque), `mesa_cerrada` con lo que se cobró entonces.
--
-- Con 0 fichas se cierra sin movimiento (`movimientos_monto_chk`). Unas fichas
-- por encima del techo se topan y cuentan como anomalía.
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


-- ── 10 · mi_mesa_ia ────────────────────────────────────────────────────────
-- La mesa abierta de la cuenta, o NINGUNA FILA (lección A2 de SAL-B1: `setof`
-- y `return;`, nunca un compuesto nulo que llegue como fila de nulos).
create or replace function public.mi_mesa_ia()
returns setof public.mesa_ia_resultado
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid  uuid := auth.uid();
  v_mesa public.mesas_ia;
begin
  if v_uid is null then
    return;
  end if;
  select m.* into v_mesa from public.mesas_ia m
   where m.jugador_id = v_uid and m.estado = 'abierta';
  if not found then
    return;
  end if;
  return next public.ia_respuesta('ok', v_uid, v_mesa);
  return;
end
$fn$;


-- ── 11 · recoger_mesa_ia (P-4) ─────────────────────────────────────────────
-- La llama el cliente UNA vez al arrancar con sesión. Cierra la mesa abierta
-- como 'abandono' y la cobra (C3: la última pila avisada) cuando:
--   · es de ESTE dispositivo: la página se recargó, y una mesa no sobrevive a
--     eso —vive sólo en memoria—, así que está muerta seguro; o
--   · es de otro y lleva más de `ia_silencio_recogida()` (10 min) sin avisos.
-- Si no, la deja (`viva`): puede estar jugándose en otro dispositivo.
--
--   'recogida' → cobrado en `cobrado`, saldo nuevo en `saldo` (aviso C5).
--   'ninguna'  → no había mesa abierta.
--   'viva'     → la hay y se respeta.
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


-- ── 12 · La consulta de Victor (C7) ────────────────────────────────────────
-- En el SQL Editor:
--   select * from public.record_manos_resumen();
-- Una fila por (reto, vivos) con la suma de todos los jugadores y cuántos
-- jugadores aportan, más una fila de total por reto (vivos nulo). El detalle
-- por jugador está en la tabla `record_manos`, que el Editor lee como dueño.
-- No se concede a nadie: el cliente no la ve.
create or replace function public.record_manos_resumen()
returns table (reto text, vivos smallint, jugadores bigint,
               jugadas bigint, ganadas_humano bigint, ganadas_ia bigint)
language sql
stable
security definer
set search_path = ''
as $fn$
  select r.reto, r.vivos, count(distinct r.jugador_id),
         sum(r.jugadas), sum(r.ganadas_humano), sum(r.ganadas_ia)
    from public.record_manos r
   group by grouping sets ((r.reto, r.vivos), (r.reto))
   order by array_position(array['basico', 'avanzado', 'pro'], r.reto), r.vivos nulls last
$fn$;


-- ── 13 · Cerraduras y permisos ─────────────────────────────────────────────
-- Como en la 1a §14: RLS sin políticas y sin privilegios de tabla para el
-- cliente; `service_role` conserva lo suyo.
alter table public.mesas_ia     enable row level security;
alter table public.record_manos enable row level security;

revoke all on table public.mesas_ia     from public, anon, authenticated;
revoke all on table public.record_manos from public, anon, authenticated;

revoke execute on function public.ia_apuestas_de(text)                 from public, anon, authenticated;
revoke execute on function public.ia_entrada_piso(bigint)              from public, anon, authenticated;
revoke execute on function public.ia_techo_mesa(bigint)                from public, anon, authenticated;
revoke execute on function public.ia_pila_ia(bigint, bigint)           from public, anon, authenticated;
revoke execute on function public.ia_silencio_recogida()               from public, anon, authenticated;
revoke execute on function public.ia_saldo_actual(uuid)                from public, anon, authenticated;
revoke execute on function public.ia_respuesta(text, uuid, public.mesas_ia, boolean, bigint) from public, anon, authenticated;
revoke execute on function public.cerrar_partida_abierta(uuid, text)   from public, anon, authenticated;
revoke execute on function public.record_manos_resumen()               from public, anon, authenticated;

-- Las seis del cliente: sólo `authenticated` (y `service_role`, el backend).
revoke execute on function public.sentarse_ia(text, integer, integer, bigint, uuid, text)        from public, anon;
revoke execute on function public.recargar_ia(uuid, bigint, integer)                             from public, anon;
revoke execute on function public.informar_pila(uuid, integer, bigint, integer, boolean)         from public, anon;
revoke execute on function public.salir_ia(uuid, bigint, integer)                                from public, anon;
revoke execute on function public.mi_mesa_ia()                                                   from public, anon;
revoke execute on function public.recoger_mesa_ia(text)                                          from public, anon;

grant execute on function public.sentarse_ia(text, integer, integer, bigint, uuid, text)        to authenticated, service_role;
grant execute on function public.recargar_ia(uuid, bigint, integer)                             to authenticated, service_role;
grant execute on function public.informar_pila(uuid, integer, bigint, integer, boolean)         to authenticated, service_role;
grant execute on function public.salir_ia(uuid, bigint, integer)                                to authenticated, service_role;
grant execute on function public.mi_mesa_ia()                                                   to authenticated, service_role;
grant execute on function public.recoger_mesa_ia(text)                                          to authenticated, service_role;


-- ── 14 · Realtime: fuera, y comprobado ─────────────────────────────────────
-- El mismo bloque que la 1a §15, para las dos tablas nuevas.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'ECO-1c: supabase_realtime es FOR ALL TABLES; las tablas de dinero no pueden quedar fuera';
  end if;
  foreach t in array array['mesas_ia', 'record_manos'] loop
    if exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — en `supabase/pruebas/eco1c_verificacion.sql`, no aquí.
-- ═══════════════════════════════════════════════════════════════════════════
-- Un solo bloque que Victor pega en el SQL Editor DESPUÉS del push; devuelve
-- una tabla `prueba | resultado | detalle` con PASA o FALLA y no deja rastro.
--
-- CORRIDA REAL · pendiente. Se anota aquí con fecha y resultado cuando Victor la
-- ejecute.
-- ═══════════════════════════════════════════════════════════════════════════
