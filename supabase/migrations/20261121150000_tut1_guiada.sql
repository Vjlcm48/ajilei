-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · TUT-1 · tanda 3 · El premio de la partida guiada
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_TUT-1_T3_v1.0.md §1.1. Normativo: docs/AJILEI_Tutorial_v1.4.md §1.5 (la
-- recompensa, decidida por Victor el 2026-11-21). Moldes: el libro y el bono de
-- `20261007144943_eco1a_libro.sql` (la huella, `bono_bienvenida_hc`, `abrir_billetera`) y el cobro
-- del video de `20261012230807_eco1g_video.sql` (límite por minuto, billetera bloqueada, el dinero
-- antes que la marca).
--
-- Se aplica con `npx supabase db push --remote`, en la transacción implícita de la CLI. Sin deploy:
-- ninguna Edge Function cambia.
--
--   1 · El tipo `premio_guiada` en `movimientos_tipo_chk`.
--   2 · `premios_guiada`: quién cobró, por la huella del correo. SIN FK: sobrevive al borrado.
--   3 · Las cifras: `premio_guiada_hc(tramo)`, y `limite_dinero` con `cobrar_guiada`.
--   4 · Las dos preguntas del tramo: ¿mano jugada? ¿premio de invitación?
--   5 · `premio_guiada_estado()`, de solo lectura, para la tarjeta y «Cómo se juega».
--   6 · `cobrar_guiada()`, el pago.
--   7 · Cerraduras, permisos y Realtime.
--
-- ── LA REGLA (normativo §1.5) ──────────────────────────────────────────────
--   · 2.000 HC a quien llega limpio: sin ninguna mano jugada (contra las IAS o contra personas) y
--     sin premio de invitación cobrado. 1.000 a todos los demás.
--   · Una vez por persona, con la huella sha256 del correo canónico, como el bono de bienvenida:
--     borrar la cuenta y crearla de nuevo con el mismo correo no vuelve a cobrar.
--   · EL SERVIDOR DECIDE EL TRAMO. `cobrar_guiada` no recibe nada: lo recalcula al pagar. La
--     cifra que el cliente enseña antes sale de `premio_guiada_estado`, que hace la misma cuenta.
--   · Lo que el servidor NO puede saber es si la guiada se jugó entera: no hay servidor en la
--     guiada (INV-47). Quien llame a `cobrar_guiada` a mano cobra lo mismo que quien la termina,
--     una vez por correo: el mismo riesgo que el bono, aceptado (informe de la tanda 3).
--
-- ── LA DOCTRINA DE ECO-1, QUE AQUÍ SE REPITE ──────────────────────────────
-- 1. El cliente no lee ni escribe tablas: RLS sin políticas y sin privilegios.
-- 2. Todo cuelga de `auth.uid()`; ninguna función de cliente recibe el uuid del jugador.
-- 3. Sin `raise` en los caminos de negocio (lección A1 de SAL-B1): «ya cobrado» se DEVUELVE.
-- 4. Sin compuestos con nulos (A2): las dos funciones del cliente devuelven `jsonb`, un objeto
--    con `estado` y `monto` siempre rellenos.
-- 5. Ninguna tabla de dinero entra en Realtime.
--
-- ── IDEMPOTENCIA DEL ARCHIVO ──────────────────────────────────────────────
-- `if not exists`, `create or replace` y `drop … if exists`: se puede volver a pasar entero.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · El tipo nuevo del libro ────────────────────────────────────────────
-- La lista vive en UN sitio (eco1a_libro §3) y se amplía quitando y poniendo la restricción en la
-- misma migración que la estrena. La de `mespvp_v13_recarga`, más `premio_guiada`.
alter table public.movimientos drop constraint if exists movimientos_tipo_chk;
alter table public.movimientos add constraint movimientos_tipo_chk check (tipo in (
  'bono_bienvenida', 'constancia', 'video',
  'entrada_ia', 'recarga_ia', 'salida_ia', 'abandono_ia',
  'compra', 'ajuste_admin',
  'garantia_pvp', 'liberacion_pvp', 'resultado_pvp', 'recarga_pvp',
  'consulta',
  'premio_guiada'
));


-- ── 2 · Quién ya cobró el premio ───────────────────────────────────────────
-- Una fila por persona: la huella del correo canónico (`huella_correo`, eco1a §6) es la clave.
-- SIN FK a `profiles` ni a `auth.users`, a propósito y como `bonos_bienvenida`: borrar la cuenta
-- se lleva en cascada el libro y la billetera, y esta fila es justo lo que tiene que quedarse.
-- `jugador_id` dice qué cuenta cobró; tras un borrado apunta a una cuenta que ya no existe.
--
--   tramo  'limpio' (2.000) · 'jugado' (1.000: alguna mano cerrada) · 'invitado' (1.000: cobró el
--          premio de invitación de GEN-1). Si se dan las dos últimas, manda 'invitado': es la que
--          explica el tope de 2.000 (normativo §1.5).
--   monto  lo que se pagó, como quedó en el libro.
--
-- Esta fila ES la marca «guiada hecha» del normativo §1.2: el cliente la lee por
-- `premio_guiada_estado`, nunca de su aparato.
create table if not exists public.premios_guiada (
  huella     text        primary key,
  jugador_id uuid        not null,
  monto      bigint      not null,
  tramo      text        not null,
  cobrado_en timestamptz not null default now(),

  constraint premios_guiada_monto_chk check (monto > 0),
  constraint premios_guiada_tramo_chk check (tramo in ('limpio', 'jugado', 'invitado'))
);

comment on table public.premios_guiada is
  'TUT-1 T3 · Huella sha256 del correo canónico de quien cobró el premio de la guiada, con su tramo y su monto. Sin FK a propósito: sobrevive al borrado de la cuenta. RLS sin políticas; la escriben solo cobrar_guiada.';


-- ── 3 · Las cifras ─────────────────────────────────────────────────────────
-- El premio vive AQUÍ y en ningún otro sitio del SQL (molde `bono_bienvenida_hc`). El cliente no
-- tiene espejo: la cifra que enseña es la que devuelve `premio_guiada_estado`. El banco imitado la
-- copia (`PREMIO_GUIADA_SQL`, `src/dev/bancoImitado.js`) y su prueba la compara con este archivo.
-- Un tramo desconocido da nulo: quien la llama lo trata.
create or replace function public.premio_guiada_hc(p_tramo text)
returns bigint
language sql
immutable
set search_path = ''
as $fn$
  select case p_tramo
           when 'limpio'   then 2000
           when 'jugado'   then 1000
           when 'invitado' then 1000
         end::bigint
$fn$;

comment on function public.premio_guiada_hc(text) is
  'TUT-1 T3 · El premio de la guiada en HC por tramo (normativo Tutorial v1.4 §1.5): limpio 2.000, jugado e invitado 1.000.';

-- El cuerpo de `mot1_dinero` (la última que la definió) con `cobrar_guiada`. Cinco por minuto: el
-- premio se cobra UNA vez; los demás intentos son reintentos del cierre y del lobby (ficha §2.1).
create or replace function public.limite_dinero(p_funcion text)
returns integer language sql immutable set search_path = ''
as $fn$
  select case p_funcion
           when 'sentarse_ia'      then 10
           when 'recargar_ia'      then 20
           when 'salir_ia'         then 30
           when 'recoger_mesa_ia'  then 10
           when 'marcar_ingreso'   then 6
           when 'pedir_boleto'     then 10
           when 'cobrar_boleto'    then 20
           when 'crear_sala'       then 10
           when 'unirse_sala'      then 10
           when 'consultar_mano'   then 30
           when 'comprar_articulo' then 30
           when 'cobrar_guiada'    then 5
         end
$fn$;


-- ── 4 · Las dos preguntas del tramo ────────────────────────────────────────
-- ── ¿Hay alguna mano jugada? ───────────────────────────────────────────────
-- La señal es la que ya usa la medición para «jugó» (`supabase/consultas/med_02_activos.sql`):
-- CERRÓ al menos una mano, en cualquiera de las dos mesas.
--   · contra las IAS: `mesas_ia.mano_informada >= 1` (RNK-1a). Sentarse no cuenta: una mesa
--     abierta y dejada sin terminar una mano sigue en 0, como el normativo pide («sin ninguna mano
--     jugada», no «sin sentarse»). Depende del aviso del teléfono al cerrar la mano: una mano
--     cerrada sin red no se cuenta.
--   · contra personas: `partida_asientos.manos >= 1` (MES-PvP 8), que escribe el árbitro con cada
--     `mano_cerrada`. No depende del teléfono.
-- Por qué no `movimientos`: el libro sabe quién se SENTÓ (`entrada_ia`, `garantia_pvp`), no quién
-- jugó una mano; con él, sentarse y salir antes de la primera mano ya costaría 1.000.
-- Lo que la señal no ve, declarado: una cuenta borrada se lleva sus `mesas_ia` en cascada, y una
-- partida se va con su sala si el anfitrión borra la suya. Quien juega, borra la cuenta y vuelve
-- con el mismo correo sin haber cobrado la guiada cuenta como limpio. El tope de 2.000 no se
-- rompe por eso (no hay invitación de por medio); solo se pierde el «aprender antes de jugar».
create or replace function public.guiada_mano_jugada(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (select 1 from public.mesas_ia m where m.jugador_id = p_uid and m.mano_informada >= 1)
      or exists (select 1 from public.partida_asientos a where a.uid = p_uid and a.manos >= 1)
$fn$;

-- ── ¿Existe un premio de invitación? ───────────────────────────────────────
-- HOY SIEMPRE NO. El premio del invitado lo estrena GEN-1 1c (1.000 HC al registrarse por el
-- enlace, normativo §1.5) con su propio `tipo` en el libro; la consulta queda escrita contra el
-- nombre que esta tanda le reserva, `premio_invitacion`, que todavía no está en
-- `movimientos_tipo_chk`: ninguna fila lo puede llevar. Si GEN-1 elige otro nombre, o guarda la
-- marca por huella (para que tampoco sobreviva al borrado de la cuenta, como el bono), redefine
-- ESTA función y nada más: las dos del cliente la llaman a través de `guiada_tramo`.
create or replace function public.guiada_premio_invitacion(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (select 1 from public.movimientos m where m.jugador_id = p_uid and m.tipo = 'premio_invitacion')
$fn$;

-- El tramo, en UN sitio: lo usan las dos funciones del cliente, que así dicen siempre lo mismo.
create or replace function public.guiada_tramo(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $fn$
  select case
           when public.guiada_premio_invitacion(p_uid) then 'invitado'
           when public.guiada_mano_jugada(p_uid)       then 'jugado'
           else 'limpio'
         end
$fn$;


-- ── 5 · Lo que el cliente pregunta antes ───────────────────────────────────
-- Para la tarjeta del primer login y la pantalla «Cómo se juega» (ficha §2.2, §2.3). De solo
-- lectura y sin límite por minuto: no escribe nada (`contar_intento_dinero` anota, y una función
-- `stable` no puede).
--
--   { "estado": "disponible", "monto": 2000 | 1000, "tramo": "limpio" | "jugado" | "invitado" }
--   { "estado": "cobrado",    "monto": <lo que cobró>, "tramo": <el de entonces> }
--   { "estado": "sin_sesion" | "sin_correo", "monto": 0, "tramo": null }
--
-- `monto` va siempre relleno. Lo que no es 'disponible' no promete nada: el cliente no enseña
-- cifra (ficha §2.3: «mejor no prometer»).
create or replace function public.premio_guiada_estado()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_correo text;
  v_huella text;
  v_p      public.premios_guiada;
  v_tramo  text;
begin
  if v_uid is null then
    return jsonb_build_object('estado', 'sin_sesion', 'monto', 0, 'tramo', null);
  end if;
  select u.email into v_correo from auth.users u where u.id = v_uid;
  if v_correo is null or btrim(v_correo) = '' then
    return jsonb_build_object('estado', 'sin_correo', 'monto', 0, 'tramo', null);
  end if;
  v_huella := public.huella_correo(v_correo);

  select p.* into v_p from public.premios_guiada p where p.huella = v_huella;
  if found then
    return jsonb_build_object('estado', 'cobrado', 'monto', v_p.monto, 'tramo', v_p.tramo);
  end if;

  v_tramo := public.guiada_tramo(v_uid);
  return jsonb_build_object('estado', 'disponible', 'monto', public.premio_guiada_hc(v_tramo), 'tramo', v_tramo);
end
$fn$;

comment on function public.premio_guiada_estado() is
  'TUT-1 T3 · De solo lectura: si el premio de la guiada está disponible (y cuánto, según el tramo que decide el servidor) o ya cobrado.';


-- ── 6 · El pago ────────────────────────────────────────────────────────────
-- Lo pide el cierre de la guiada al montarse, y el lobby lo reintenta mientras el aparato diga
-- `pendientePago` (ficha §2.1). Sin parámetros: el tramo lo recalcula aquí.
--
--   { "estado": "pagado",  "monto": 2000 | 1000, "tramo": …, "saldo": <el de ahora> }
--   { "estado": "cobrado", "monto": <lo que cobró>, "tramo": <el de entonces>, "saldo": … }
--   { "estado": "sin_sesion" | "limite" | "sin_billetera" | "sin_correo" | "error", "monto": 0, … }
--
-- El orden, el de `cobrar_boleto` y `abrir_billetera`:
--   1. sesión; límite por minuto (INV-51), que anota también el intento que corta;
--   2. la billetera bloqueada (`for update`): dos teléfonos de la misma cuenta van en fila;
--   3. la huella: si ya está, `cobrado`, sin mover nada (nunca lanza por «ya cobrado»);
--   4. la marca con `on conflict do nothing`: dos cuentas del mismo correo cobrando en el mismo
--      instante —que la billetera no ordena, porque son dos billeteras— no cobran dos veces; la
--      segunda espera en el índice y no inserta;
--   5. el dinero, con `clave_idem = 'guiada:' || huella` (la ficha §1.1): la misma persona no
--      puede tener dos líneas del premio en el libro aunque alguien borre la marca a mano;
--   6. si el libro no lo anota, la marca se retira (una marca sin pago dejaría a la persona sin
--      premio para siempre), salvo que la clave ya esté en el libro: entonces sí cobró.
create or replace function public.cobrar_guiada()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_correo text;
  v_huella text;
  v_p      public.premios_guiada;
  v_tramo  text;
  v_monto  bigint;
  v_res    public.movimiento_resultado;
begin
  if v_uid is null then
    return jsonb_build_object('estado', 'sin_sesion', 'monto', 0, 'tramo', null, 'saldo', 0);
  end if;
  if not public.contar_intento_dinero('cobrar_guiada', public.limite_dinero('cobrar_guiada')) then
    -- `contar_intento_dinero` también dice «no» a una cuenta sin perfil (antes del Bautizo).
    if not exists (select 1 from public.billeteras b where b.jugador_id = v_uid) then
      return jsonb_build_object('estado', 'sin_billetera', 'monto', 0, 'tramo', null, 'saldo', 0);
    end if;
    return jsonb_build_object('estado', 'limite', 'monto', 0, 'tramo', null, 'saldo', public.saldo_de(v_uid));
  end if;

  perform 1 from public.billeteras b where b.jugador_id = v_uid for update;
  if not found then
    return jsonb_build_object('estado', 'sin_billetera', 'monto', 0, 'tramo', null, 'saldo', 0);
  end if;

  select u.email into v_correo from auth.users u where u.id = v_uid;
  if v_correo is null or btrim(v_correo) = '' then
    return jsonb_build_object('estado', 'sin_correo', 'monto', 0, 'tramo', null, 'saldo', public.saldo_de(v_uid));
  end if;
  v_huella := public.huella_correo(v_correo);

  select p.* into v_p from public.premios_guiada p where p.huella = v_huella;
  if found then
    return jsonb_build_object('estado', 'cobrado', 'monto', v_p.monto, 'tramo', v_p.tramo, 'saldo', public.saldo_de(v_uid));
  end if;

  v_tramo := public.guiada_tramo(v_uid);
  v_monto := public.premio_guiada_hc(v_tramo);

  insert into public.premios_guiada (huella, jugador_id, monto, tramo)
  values (v_huella, v_uid, v_monto, v_tramo)
  on conflict (huella) do nothing;
  if not found then
    select p.* into v_p from public.premios_guiada p where p.huella = v_huella;
    return jsonb_build_object('estado', 'cobrado', 'monto', v_p.monto, 'tramo', v_p.tramo, 'saldo', public.saldo_de(v_uid));
  end if;

  v_res := public.aplicar_movimiento(
    v_uid, 'premio_guiada', v_monto, 'guiada:' || v_huella, 'premios_guiada', v_huella, null);
  if v_res.motivo in ('repetido', 'clave_en_uso') then
    -- La clave ya estaba: esta persona cobró antes (la marca se borró a mano). La marca nueva
    -- dice la verdad y se queda; no se paga otra vez.
    return jsonb_build_object('estado', 'cobrado', 'monto', v_monto, 'tramo', v_tramo, 'saldo', public.saldo_de(v_uid));
  end if;
  if not v_res.aplicado then
    delete from public.premios_guiada where huella = v_huella;
    raise warning 'TUT-1 T3: el premio de la guiada de % no se aplicó (%)', v_uid, v_res.motivo;
    return jsonb_build_object('estado', 'error', 'monto', 0, 'tramo', null, 'saldo', public.saldo_de(v_uid));
  end if;

  return jsonb_build_object('estado', 'pagado', 'monto', v_monto, 'tramo', v_tramo, 'saldo', v_res.saldo);
end
$fn$;

comment on function public.cobrar_guiada() is
  'TUT-1 T3 · Paga el premio de la guiada una vez por correo canónico, con el tramo que decide el servidor. Nunca lanza por «ya cobrado»: lo devuelve.';


-- ── 7 · Cerraduras, permisos y Realtime ────────────────────────────────────
-- Como en eco1a §14: RLS sin políticas y sin privilegios de tabla para el cliente; `service_role`
-- conserva lo suyo.
alter table public.premios_guiada enable row level security;
revoke all on table public.premios_guiada from public, anon, authenticated;

-- Internas: a nadie.
revoke execute on function public.premio_guiada_hc(text)          from public, anon, authenticated;
revoke execute on function public.guiada_mano_jugada(uuid)        from public, anon, authenticated;
revoke execute on function public.guiada_premio_invitacion(uuid)  from public, anon, authenticated;
revoke execute on function public.guiada_tramo(uuid)              from public, anon, authenticated;
-- `create or replace` conserva los permisos de la 1d; se repite de todos modos.
revoke execute on function public.limite_dinero(text)             from public, anon, authenticated;

-- Las dos del cliente: solo con sesión.
revoke execute on function public.premio_guiada_estado()          from public, anon, authenticated;
revoke execute on function public.cobrar_guiada()                 from public, anon, authenticated;
grant  execute on function public.premio_guiada_estado()          to authenticated;
grant  execute on function public.cobrar_guiada()                 to authenticated;

-- Realtime: fuera, y comprobado (molde eco1a §15).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'TUT-1 T3: supabase_realtime es FOR ALL TABLES; premios_guiada no puede quedar fuera';
  end if;
  if exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'premios_guiada') then
    alter publication supabase_realtime drop table public.premios_guiada;
  end if;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en las migraciones anteriores. Se pega cada grupo ENTERO y sin los `-- `,
-- uno por pestaña, y se guarda como «TUT-1 · verificación A/B». Cada uno acaba en una única
-- consulta `comprobación | resultado | detalle`, y cada fila debe decir PASA: 9 el Grupo A y 14
-- el Grupo B. Son las filas de `supabase/pruebas/tut1_verificacion.sql`, que `npm run guiones`
-- corre antes del push.
--
-- El Grupo B fabrica siete cuentas, dos mesas contra las IAS, una sala de 2 con su partida y una
-- cuenta borrada y vuelta a crear, y lo deshace todo al final con la excepción `tut1_deshacer`:
-- no deja rastro.
--
-- CORRIDA REAL · 2026-11-21, Victor, tras `db push --remote`: Grupo A 9/9 PASA · Grupo B 14/14 PASA.
--
-- ── GRUPO A · forma y permisos ─────────────────────────────────────────────
-- create or replace function pg_temp.tut1_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.tut1_verificar_a()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   TIPOS constant text[] := array['bono_bienvenida', 'constancia', 'video', 'entrada_ia', 'recarga_ia',
--                                  'salida_ia', 'abandono_ia', 'compra', 'ajuste_admin', 'garantia_pvp',
--                                  'liberacion_pvp', 'resultado_pvp', 'recarga_pvp', 'consulta', 'premio_guiada'];
--   INTERNAS constant text[] := array['public.premio_guiada_hc(text)', 'public.guiada_mano_jugada(uuid)',
--                                     'public.guiada_premio_invitacion(uuid)', 'public.guiada_tramo(uuid)'];
--   f  jsonb := '[]';
--   x  text;
--   n  integer;
--   n1 integer;
--   n2 integer;
-- begin
--   -- ── A1 · el tipo nuevo, sin perder ninguno ─────────────────────────────
--   select pg_get_constraintdef(oid) into x from pg_constraint
--    where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk';
--   select count(*) into n1 from unnest(TIPOS) as t(tipo) where x like '%''' || t.tipo || '''%';
--   select count(*) into n2 from regexp_matches(coalesce(x, ''), '''[a-z_]+''', 'g');
--   f := f || pg_temp.tut1_fila(1, 'A1 · movimientos_tipo_chk: los 14 tipos de antes y premio_guiada, ninguno más',
--             n1 = 15 and n2 = 15, format('de la lista=%s de 15 · literales en la restricción=%s', n1, n2));
--
--   -- ── A2 · la tabla ──────────────────────────────────────────────────────
--   x := (select string_agg(attname || ':' || format_type(atttypid, atttypmod) || ':' || attnotnull, ', ' order by attnum)
--           from pg_attribute where attrelid = 'public.premios_guiada'::regclass and attnum > 0 and not attisdropped);
--   f := f || pg_temp.tut1_fila(2, 'A2 · premios_guiada: huella (clave), jugador_id, monto, tramo, cobrado_en; sin FK; tramo y monto con su check',
--             x = 'huella:text:true, jugador_id:uuid:true, monto:bigint:true, tramo:text:true, cobrado_en:timestamp with time zone:true'
--             and exists (select 1 from pg_constraint where conrelid = 'public.premios_guiada'::regclass and contype = 'p'
--                            and pg_get_constraintdef(oid) = 'PRIMARY KEY (huella)')
--             and not exists (select 1 from pg_constraint where conrelid = 'public.premios_guiada'::regclass and contype = 'f')
--             and (select count(*) from pg_constraint where conrelid = 'public.premios_guiada'::regclass and contype = 'c'
--                    and conname in ('premios_guiada_monto_chk', 'premios_guiada_tramo_chk')) = 2,
--             x);
--
--   -- ── A3 · la puerta cerrada ─────────────────────────────────────────────
--   f := f || pg_temp.tut1_fila(3, 'A3 · premios_guiada: RLS activo, cero políticas, ni anon ni authenticated con privilegio alguno',
--             (select relrowsecurity from pg_class where oid = 'public.premios_guiada'::regclass)
--             and (select count(*) from pg_policy where polrelid = 'public.premios_guiada'::regclass) = 0
--             and not has_table_privilege('authenticated', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger')
--             and not has_table_privilege('anon', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger'),
--             format('rls=%s · políticas=%s · authenticated=%s · anon=%s',
--                    (select relrowsecurity from pg_class where oid = 'public.premios_guiada'::regclass),
--                    (select count(*) from pg_policy where polrelid = 'public.premios_guiada'::regclass),
--                    has_table_privilege('authenticated', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger'),
--                    has_table_privilege('anon', 'public.premios_guiada', 'select, insert, update, delete, truncate, references, trigger')));
--
--   -- ── A4 · las cifras ────────────────────────────────────────────────────
--   f := f || pg_temp.tut1_fila(4, 'A4 · premio_guiada_hc: limpio 2.000 · jugado 1.000 · invitado 1.000 · otro tramo nulo',
--             public.premio_guiada_hc('limpio') = 2000 and public.premio_guiada_hc('jugado') = 1000
--             and public.premio_guiada_hc('invitado') = 1000 and public.premio_guiada_hc('otro') is null,
--             format('%s · %s · %s · %s', public.premio_guiada_hc('limpio'), public.premio_guiada_hc('jugado'),
--                    public.premio_guiada_hc('invitado'), coalesce(public.premio_guiada_hc('otro')::text, 'nulo')));
--
--   f := f || pg_temp.tut1_fila(5, 'A5 · limite_dinero: cobrar_guiada 5 por minuto; las de antes, igual',
--             public.limite_dinero('cobrar_guiada') = 5 and public.limite_dinero('sentarse_ia') = 10
--             and public.limite_dinero('cobrar_boleto') = 20 and public.limite_dinero('comprar_articulo') = 30
--             and public.limite_dinero('consultar_mano') = 30 and public.limite_dinero('premio_guiada_estado') is null,
--             format('cobrar_guiada=%s · sentarse_ia=%s · cobrar_boleto=%s · comprar_articulo=%s · consultar_mano=%s',
--                    public.limite_dinero('cobrar_guiada'), public.limite_dinero('sentarse_ia'), public.limite_dinero('cobrar_boleto'),
--                    public.limite_dinero('comprar_articulo'), public.limite_dinero('consultar_mano')));
--
--   -- ── A6 y A7 · las dos del cliente ──────────────────────────────────────
--   f := f || pg_temp.tut1_fila(6, 'A6 · premio_guiada_estado() → jsonb: una firma, sin argumentos, stable, definer, search_path vacío; authenticated sí, anon no',
--             (select count(*) from pg_proc where proname = 'premio_guiada_estado' and pronamespace = 'public'::regnamespace) = 1
--             and (select pronargs = 0 and provolatile = 's' and prosecdef and 'search_path=""' = any (proconfig) and prorettype = 'jsonb'::regtype
--                    from pg_proc where oid = 'public.premio_guiada_estado()'::regprocedure)
--             and has_function_privilege('authenticated', 'public.premio_guiada_estado()', 'execute')
--             and not has_function_privilege('anon', 'public.premio_guiada_estado()', 'execute'),
--             format('versiones=%s · authenticated=%s · anon=%s',
--                    (select count(*) from pg_proc where proname = 'premio_guiada_estado' and pronamespace = 'public'::regnamespace),
--                    has_function_privilege('authenticated', 'public.premio_guiada_estado()', 'execute'),
--                    has_function_privilege('anon', 'public.premio_guiada_estado()', 'execute')));
--
--   f := f || pg_temp.tut1_fila(7, 'A7 · cobrar_guiada() → jsonb: una firma, SIN argumentos (el tramo no viene del cliente), volatile, definer, search_path vacío; authenticated sí, anon no',
--             (select count(*) from pg_proc where proname = 'cobrar_guiada' and pronamespace = 'public'::regnamespace) = 1
--             and (select pronargs = 0 and provolatile = 'v' and prosecdef and 'search_path=""' = any (proconfig) and prorettype = 'jsonb'::regtype
--                    from pg_proc where oid = 'public.cobrar_guiada()'::regprocedure)
--             and has_function_privilege('authenticated', 'public.cobrar_guiada()', 'execute')
--             and not has_function_privilege('anon', 'public.cobrar_guiada()', 'execute'),
--             format('versiones=%s · authenticated=%s · anon=%s',
--                    (select count(*) from pg_proc where proname = 'cobrar_guiada' and pronamespace = 'public'::regnamespace),
--                    has_function_privilege('authenticated', 'public.cobrar_guiada()', 'execute'),
--                    has_function_privilege('anon', 'public.cobrar_guiada()', 'execute')));
--
--   -- ── A8 · las internas, a nadie ─────────────────────────────────────────
--   select count(*) into n from unnest(INTERNAS) as i(firma)
--    where has_function_privilege('authenticated', i.firma, 'execute') or has_function_privilege('anon', i.firma, 'execute');
--   f := f || pg_temp.tut1_fila(8, 'A8 · premio_guiada_hc, guiada_mano_jugada, guiada_premio_invitacion y guiada_tramo: ni authenticated ni anon',
--             n = 0, format('con permiso del cliente=%s de 4', n));
--
--   -- ── A9 · fuera de Realtime ─────────────────────────────────────────────
--   f := f || pg_temp.tut1_fila(9, 'A9 · premios_guiada fuera de supabase_realtime',
--             not exists (select 1 from pg_publication_tables
--                          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'premios_guiada'),
--             format('en la publicación=%s', exists (select 1 from pg_publication_tables
--                          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'premios_guiada')));
--
--   return query
--     select (x2 ->> 'o')::integer, x2 ->> 'c', x2 ->> 'r', x2 ->> 'd'
--       from jsonb_array_elements(f) x2;
-- end
-- $fn$;
--
-- select prueba as "comprobación", resultado, detalle
--   from pg_temp.tut1_verificar_a()
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.tut1_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- -- Una sentencia como el cliente (`authenticated` o `anon`, con la sesión de `p_uid` o sin
-- -- ninguna): su primera columna como texto, o `ERROR·<sqlstate>`.
-- create or replace function pg_temp.tut1_como(p_rol text, p_uid uuid, p_sql text)
-- returns text
-- language plpgsql
-- as $fn$
-- declare
--   v text;
-- begin
--   perform set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
--   if p_rol = 'anon' then set local role anon; else set local role authenticated; end if;
--   execute p_sql into v;
--   reset role;
--   perform set_config('request.jwt.claims', '', true);
--   return coalesce(v, '(nulo)');
-- exception when others then
--   return 'ERROR·' || sqlstate;
-- end
-- $fn$;
--
-- -- La sesión de una cuenta para las llamadas que el guion hace como dueño (`postgres`).
-- create or replace function pg_temp.tut1_sesion(p_uid uuid)
-- returns void language sql as $fn$
--   select set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
-- $fn$;
--
-- create or replace function pg_temp.tut1_verificar_b()
-- returns table (orden integer, prueba text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   L  constant uuid := '7a100000-0000-4000-8000-00000000000a';
--   S  constant uuid := '7a100000-0000-4000-8000-00000000000b';
--   J  constant uuid := '7a100000-0000-4000-8000-00000000000c';
--   P  constant uuid := '7a100000-0000-4000-8000-00000000000d';
--   Q  constant uuid := '7a100000-0000-4000-8000-00000000000e';
--   R  constant uuid := '7a100000-0000-4000-8000-00000000000f';
--   R2 constant uuid := '7a100000-0000-4000-8000-000000000010';
--   CORREO_R  constant text := 'ajilei.tut1.verif+uno@gmail.com';
--   ALIAS_R   constant text := 'ajileitut1verif+dos@googlemail.com';
--   CIEN      constant bigint := 100000;
--   VISTAS    constant jsonb := '[{"asiento":0,"vista":{}},{"asiento":1,"vista":{}}]';
--   f    jsonb := '[]';
--   jp   jsonb;
--   jg   jsonb;
--   v_mesa public.mesa_ia_resultado;
--   v_sala public.salas;
--   t1   text;
--   t2   text;
--   t3   text;
--   t4   text;
--   n    integer;
--   n1   integer;
--   n2   integer;
--   s0   bigint;
--   s1   bigint;
-- begin
--   begin
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            u.correo, '', now(), now(), '{}', '{}'
--       from (values (L, 'tut1.verif.l@example.invalid'), (S, 'tut1.verif.s@example.invalid'),
--                    (J, 'tut1.verif.j@example.invalid'), (P, 'tut1.verif.p@example.invalid'),
--                    (Q, 'tut1.verif.q@example.invalid'), (R, CORREO_R)) as u(id, correo);
--     insert into public.profiles (id, username)
--     values (L, 'tut1_l_verif'), (S, 'tut1_s_verif'), (J, 'tut1_j_verif'),
--            (P, 'tut1_p_verif'), (Q, 'tut1_q_verif'), (R, 'tut1_r_verif');
--     perform public.ajuste_admin(u, CIEN - public.saldo_de(u), 'TUT-1 T3 · verificación') from unnest(array[L, S, J, P, Q, R]) u;
--     delete from public.intentos_dinero where jugador_id in (L, S, J, P, Q, R);
--
--     -- ── B1…B4 · la cuenta limpia ─────────────────────────────────────────
--     t1 := pg_temp.tut1_como('authenticated', L, 'select public.premio_guiada_estado()::text');
--     f := f || pg_temp.tut1_fila(101, 'B1 · limpia (sin manos ni invitación): disponible, 2.000, tramo limpio',
--               t1::jsonb = '{"estado":"disponible","monto":2000,"tramo":"limpio"}'::jsonb, t1);
--
--     s0 := public.saldo_de(L);
--     t1 := pg_temp.tut1_como('authenticated', L, 'select public.cobrar_guiada()::text');
--     s1 := public.saldo_de(L);
--     select count(*) into n from public.movimientos
--      where jugador_id = L and tipo = 'premio_guiada' and monto = 2000 and saldo_tras = s1
--        and clave_idem = 'guiada:' || public.huella_correo('tut1.verif.l@example.invalid');
--     select count(*) into n1 from public.premios_guiada
--      where huella = public.huella_correo('tut1.verif.l@example.invalid') and jugador_id = L and monto = 2000 and tramo = 'limpio';
--     f := f || pg_temp.tut1_fila(102, 'B2 · cobrar: pagado 2.000; el saldo sube 2.000; una línea premio_guiada con clave guiada:<huella>; la marca, limpio',
--               t1::jsonb @> jsonb_build_object('estado', 'pagado', 'monto', 2000, 'tramo', 'limpio', 'saldo', s1)
--               and s1 = s0 + 2000 and n = 1 and n1 = 1,
--               format('%s · saldo %s → %s · línea=%s · marca=%s', t1, s0, s1, n, n1));
--
--     t1 := pg_temp.tut1_como('authenticated', L, 'select public.cobrar_guiada()::text');
--     select count(*) into n from public.movimientos where jugador_id = L and tipo = 'premio_guiada';
--     f := f || pg_temp.tut1_fila(103, 'B3 · cobrar otra vez: cobrado 2.000, sin error, sin línea nueva, el saldo igual',
--               t1::jsonb @> '{"estado":"cobrado","monto":2000,"tramo":"limpio"}'::jsonb and n = 1 and public.saldo_de(L) = s1,
--               format('%s · líneas=%s · saldo=%s', t1, n, public.saldo_de(L)));
--
--     t1 := pg_temp.tut1_como('authenticated', L, 'select public.premio_guiada_estado()::text');
--     f := f || pg_temp.tut1_fila(104, 'B4 · después, el estado dice cobrado, con la cifra y el tramo de entonces',
--               t1::jsonb = '{"estado":"cobrado","monto":2000,"tramo":"limpio"}'::jsonb, t1);
--
--     -- ── B5 · sentarse no es jugar ────────────────────────────────────────
--     perform pg_temp.tut1_sesion(S);
--     v_mesa := public.sentarse_ia('basico', 2, 50, public.ia_entrada_piso(50), gen_random_uuid());
--     perform pg_temp.tut1_sesion(null);
--     t1 := pg_temp.tut1_como('authenticated', S, 'select public.premio_guiada_estado()::text');
--     f := f || pg_temp.tut1_fila(105, 'B5 · sentada contra las IAS sin cerrar ninguna mano (mano_informada 0): sigue limpia, 2.000',
--               v_mesa.codigo = 'ok' and (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id) = 0
--               and t1::jsonb = '{"estado":"disponible","monto":2000,"tramo":"limpio"}'::jsonb,
--               format('sentarse=%s · mano_informada=%s · %s', v_mesa.codigo, (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id), t1));
--
--     -- ── B6 · una mano cerrada contra las IAS ─────────────────────────────
--     perform pg_temp.tut1_sesion(J);
--     v_mesa := public.sentarse_ia('basico', 2, 50, public.ia_entrada_piso(50), gen_random_uuid());
--     v_mesa := public.informar_pila(v_mesa.mesa_id, 1, public.ia_entrada_piso(50)::bigint, 2, true, 1, 0::smallint);
--     perform pg_temp.tut1_sesion(null);
--     t1 := pg_temp.tut1_como('authenticated', J, 'select public.premio_guiada_estado()::text');
--     s0 := public.saldo_de(J);
--     t2 := pg_temp.tut1_como('authenticated', J, 'select public.cobrar_guiada()::text');
--     select count(*) into n from public.movimientos where jugador_id = J and tipo = 'premio_guiada' and monto = 1000;
--     f := f || pg_temp.tut1_fila(106, 'B6 · una mano cerrada contra las IAS (mano_informada 1): disponible 1.000 jugado, y cobra 1.000',
--               (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id) = 1
--               and t1::jsonb = '{"estado":"disponible","monto":1000,"tramo":"jugado"}'::jsonb
--               and t2::jsonb @> '{"estado":"pagado","monto":1000,"tramo":"jugado"}'::jsonb
--               and public.saldo_de(J) = s0 + 1000 and n = 1,
--               format('informar=%s · mano_informada=%s · estado %s · cobro %s · línea=%s',
--                      v_mesa.codigo, (select mano_informada from public.mesas_ia where id = v_mesa.mesa_id), t1, t2, n));
--
--     -- ── B7 · una mano cerrada contra personas ────────────────────────────
--     -- La mesa de 2, por el camino de siempre (el de `mespvp8` y `med1a`). Mano 1: gana P.
--     perform pg_temp.tut1_sesion(P);
--     v_sala := public.crear_sala('privada', 2::smallint, 100);
--     perform pg_temp.tut1_sesion(Q);
--     perform public.unirse_sala(null, v_sala.id);
--     perform pg_temp.tut1_sesion(P);
--     perform public.jugar_ya(v_sala.id);
--     perform pg_temp.tut1_sesion(null);
--     jp := public.crear_partida(v_sala.id, '{"version":0,"motor":{"handCount":1}}'::jsonb, null,
--                               jsonb_build_object(P::text, 0, Q::text, 1), VISTAS);
--     jg := public.guardar_jugada(v_sala.id, 0, '{"version":1,"motor":{"handCount":1}}'::jsonb, null, VISTAS, false,
--            '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":2,"ajilei":0,"pilas":[2000,1000]}]'::jsonb);
--     t1 := pg_temp.tut1_como('authenticated', P, 'select public.premio_guiada_estado()::text');
--     t2 := pg_temp.tut1_como('authenticated', Q, 'select public.premio_guiada_estado()::text');
--     t3 := pg_temp.tut1_como('authenticated', P, 'select public.cobrar_guiada()::text');
--     f := f || pg_temp.tut1_fila(107, 'B7 · una mano cerrada entre personas (partida_asientos.manos 1): las dos cuentas, 1.000 jugado; P cobra 1.000',
--               jg ->> 'ok' = 'true'
--               and (select min(manos) from public.partida_asientos where sala_id = v_sala.id) = 1
--               and t1::jsonb = '{"estado":"disponible","monto":1000,"tramo":"jugado"}'::jsonb
--               and t2::jsonb = '{"estado":"disponible","monto":1000,"tramo":"jugado"}'::jsonb
--               and t3::jsonb @> '{"estado":"pagado","monto":1000,"tramo":"jugado"}'::jsonb,
--               format('partida=%s · jugada=%s · manos=%s · P %s · Q %s · cobro P %s', jp ->> 'ok', jg ->> 'ok',
--                      (select string_agg(manos::text, ',' order by asiento) from public.partida_asientos where sala_id = v_sala.id), t1, t2, t3));
--
--     -- ── B8 · cobra, borra la cuenta y vuelve con otro alias ──────────────
--     t1 := pg_temp.tut1_como('authenticated', R, 'select public.cobrar_guiada()::text');
--     delete from auth.users where id = R;
--     select count(*) into n from public.premios_guiada where huella = public.huella_correo(CORREO_R);
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     values (R2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             ALIAS_R, '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (R2, 'tut1_r2_verif');
--     t2 := pg_temp.tut1_como('authenticated', R2, 'select public.premio_guiada_estado()::text');
--     t3 := pg_temp.tut1_como('authenticated', R2, 'select public.cobrar_guiada()::text');
--     select count(*) into n1 from public.movimientos where jugador_id = R2 and tipo = 'premio_guiada';
--     f := f || pg_temp.tut1_fila(108, 'B8 · cobra 2.000, borra la cuenta (la marca se queda) y vuelve con otro alias del mismo correo: cobrado, 0 HC más',
--               t1::jsonb @> '{"estado":"pagado","monto":2000}'::jsonb
--               and public.huella_correo(ALIAS_R) = public.huella_correo(CORREO_R) and n = 1
--               and t2::jsonb = '{"estado":"cobrado","monto":2000,"tramo":"limpio"}'::jsonb
--               and t3::jsonb @> '{"estado":"cobrado","monto":2000}'::jsonb
--               and n1 = 0 and public.saldo_de(R2) = 0,
--               format('cobro %s · marca tras borrar=%s · misma huella=%s · estado R2 %s · cobro R2 %s · líneas R2=%s · saldo R2=%s',
--                      t1, n, public.huella_correo(ALIAS_R) = public.huella_correo(CORREO_R), t2, t3, n1, public.saldo_de(R2)));
--
--     -- ── B9 y B10 · sin sesión, y anon ────────────────────────────────────
--     select count(*) into n from public.premios_guiada;
--     t1 := pg_temp.tut1_como('authenticated', null, 'select public.premio_guiada_estado()::text');
--     t2 := pg_temp.tut1_como('authenticated', null, 'select public.cobrar_guiada()::text');
--     f := f || pg_temp.tut1_fila(109, 'B9 · sin sesión: sin_sesion las dos, sin error y sin marca nueva',
--               t1::jsonb ->> 'estado' = 'sin_sesion' and t2::jsonb ->> 'estado' = 'sin_sesion'
--               and (select count(*) from public.premios_guiada) = n,
--               format('estado %s · cobro %s', t1, t2));
--
--     t1 := pg_temp.tut1_como('anon', null, 'select public.premio_guiada_estado()::text');
--     t2 := pg_temp.tut1_como('anon', null, 'select public.cobrar_guiada()::text');
--     f := f || pg_temp.tut1_fila(110, 'B10 · anon no puede llamar a ninguna de las dos (permiso denegado)',
--               t1 = 'ERROR·42501' and t2 = 'ERROR·42501', format('estado → %s · cobro → %s', t1, t2));
--
--     -- ── B11 y B12 · el cliente no toca la tabla ni las internas ──────────
--     t1 := pg_temp.tut1_como('authenticated', L, 'select count(*)::text from public.premios_guiada');
--     t2 := pg_temp.tut1_como('authenticated', L,
--             format('insert into public.premios_guiada (huella, jugador_id, monto, tramo) values (''x'', %L, 2000, ''limpio'') returning ''ok''', L));
--     t3 := pg_temp.tut1_como('authenticated', L,
--             format('delete from public.premios_guiada where jugador_id = %L returning ''ok''', L));
--     f := f || pg_temp.tut1_fila(111, 'B11 · el cliente no lee, no escribe ni borra premios_guiada',
--               t1 = 'ERROR·42501' and t2 = 'ERROR·42501' and t3 = 'ERROR·42501',
--               format('leer → %s · escribir → %s · borrar → %s', t1, t2, t3));
--
--     t1 := pg_temp.tut1_como('authenticated', L, format('select public.guiada_tramo(%L)', L));
--     t2 := pg_temp.tut1_como('authenticated', L, format('select public.guiada_mano_jugada(%L)::text', J));
--     t3 := pg_temp.tut1_como('authenticated', L, 'select public.premio_guiada_hc(''limpio'')::text');
--     f := f || pg_temp.tut1_fila(112, 'B12 · el cliente no llama a las internas (guiada_tramo, guiada_mano_jugada, premio_guiada_hc)',
--               t1 = 'ERROR·42501' and t2 = 'ERROR·42501' and t3 = 'ERROR·42501',
--               format('tramo → %s · mano_jugada → %s · hc → %s', t1, t2, t3));
--
--     -- ── B13 · el límite por minuto ───────────────────────────────────────
--     -- J ya cobró: cinco reintentos en el mismo minuto dicen «cobrado»; el sexto, «limite».
--     delete from public.intentos_dinero where jugador_id = J;
--     t1 := '';
--     for n in 1..5 loop
--       t1 := t1 || (pg_temp.tut1_como('authenticated', J, 'select public.cobrar_guiada()::text')::jsonb ->> 'estado') || ' ';
--     end loop;
--     t2 := pg_temp.tut1_como('authenticated', J, 'select public.cobrar_guiada()::text');
--     select count(*) into n1 from public.intentos_dinero where jugador_id = J and funcion = 'cobrar_guiada';
--     select count(*) into n2 from public.movimientos where jugador_id = J and tipo = 'premio_guiada';
--     f := f || pg_temp.tut1_fila(113, 'B13 · límite: cinco cobros por minuto contestan, el sexto dice limite; los seis anotados; una sola línea',
--               btrim(t1) = 'cobrado cobrado cobrado cobrado cobrado' and t2::jsonb ->> 'estado' = 'limite' and n1 = 6 and n2 = 1,
--               format('1–5: %s · 6.º: %s · intentos=%s · líneas=%s', btrim(t1), t2, n1, n2));
--
--     -- ── B14 · la rama del invitado, hoy vacía ────────────────────────────
--     -- GEN-1 1c estrena el premio del invitado; hasta entonces el tipo que la consulta busca no
--     -- está en el libro y nadie es «invitado».
--     select pg_get_constraintdef(oid) into t1 from pg_constraint
--      where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk';
--     select count(*) into n from public.premios_guiada where tramo = 'invitado';
--     f := f || pg_temp.tut1_fila(114, 'B14 · hoy nadie es invitado: premio_invitacion no está en el libro y guiada_premio_invitacion dice no',
--               t1 not like '%premio_invitacion%' and not public.guiada_premio_invitacion(L)
--               and not public.guiada_premio_invitacion(J) and n = 0,
--               format('en el check=%s · L=%s · J=%s · marcas invitado=%s', t1 like '%premio_invitacion%',
--                      public.guiada_premio_invitacion(L), public.guiada_premio_invitacion(J), n));
--
--     raise exception 'tut1_deshacer';
--   exception when others then
--     if sqlerrm <> 'tut1_deshacer' then
--       f := f || pg_temp.tut1_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
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
--   from pg_temp.tut1_verificar_b()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
