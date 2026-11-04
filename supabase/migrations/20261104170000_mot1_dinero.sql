-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · MOT-1 · Fase 1d-ii — El dinero y los puntos
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_MOT-1_Fase1d-ii_v1.0.md. Normativo: docs/AJILEI_MOT-1_Contrato_v1.0.md
-- (§7, §9). Informe: docs/reportes/AJILEI_MOT-1_Fase1d-ii_Informe_v1.0.md.
--
-- Se aplica con `npx supabase db push`, en la transacción implícita de la CLI. El
-- valor `terminada` de `sala_estado` lo confirmó la migración anterior: aquí se puede
-- usar como cualquier otro.
--
-- ── LA REGLA DE ORO ────────────────────────────────────────────────────────
-- En una mesa, lo que entró por garantías es exactamente lo que sale por liberaciones.
-- El SQL lo comprueba en cuatro sitios, y si una operación lo rompería se deshace
-- entera (`estado_incoherente`):
--   · `crear_partida`: cada asiento tiene en el libro una garantía neta igual a la
--     entrada, así que la suma es asientos × entrada.
--   · `guardar_jugada`, con efectos: pilas + liberado = entradas, y el libro dice lo
--     mismo que los asientos (`mesa_cuadra`).
--   · `partida_terminada` y la partida muerta: todos cobraron y neto de la mesa = 0.
--   · `cancelar_sala`: neto de la mesa = 0.
-- La devolución de la espera no recibe un monto: devuelve lo que el libro dice que
-- esa cuenta tiene dentro de esa mesa. Una mesa de antes de esta migración, sin
-- garantías, no devuelve nada que no se cobró.
--
-- ── UN TOPE NUNCA ATRAPA DINERO ────────────────────────────────────────────
-- Solo la garantía pasa por `limite_dinero()`. Ninguna devolución ni pieza del árbitro
-- mira un tope ni lee `auth.uid()` (N-1).
--
-- ── EL ORDEN DE LOS CERROJOS ───────────────────────────────────────────────
-- Sala → partida → asiento → billetera, y varias billeteras por `jugador_id`. Dos
-- transacciones que tomen dos de esas filas no se cruzan. `guardar_jugada` y
-- `sentarse_ia` pasan a tomar primero las suyas por eso. El barrido recorre varias
-- mesas en una transacción y no puede ordenar sus billeteras entre mesas: si dos se
-- cruzan, Postgres aborta una, se deshace entera y no se pierde nada.
--
-- ── LO QUE EL ÁRBITRO AÚN NO LLAMA ─────────────────────────────────────────
-- Nadie crea partidas hasta la 1e. Lo que el cliente de hoy nota es el dinero de la
-- espera: la entrada baja al sentarse y vuelve al salir.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · La entrada y los topes ─────────────────────────────────────────────
-- La única función que calcula la entrada. Espejo: `ENTRADAS` de src/arbitro/partida.js
-- y `REGLA_ASIENTO` de src/config/salas.js, que es la Corta. Una entrada desconocida da
-- null, y la rechaza el `check` de la columna.
create function public.entrada_de(p_apuesta integer, p_entrada text)
returns bigint
language sql
immutable
set search_path = ''
as $fn$
  select p_apuesta::bigint * case p_entrada when 'corta' then 15 when 'llena' then 50 end
$fn$;

comment on function public.entrada_de(integer, text) is
  'MOT-1 · apuesta × 15 (corta) o × 50 (llena). La única que calcula la entrada de una mesa PvP.';

-- Cuerpo de ECO-1g (20261012230807_eco1g_video.sql:100-113) con cuatro nombres más. Los
-- dos últimos eran los topes literales de CFG-1e y TIE-1a (ARN-4), con su misma cifra.
--   crear_sala y unirse_sala  10  como `sentarse_ia`: sentarse es lo que cuesta. Las
--                                 devoluciones no pasan por aquí.
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
         end
$fn$;

-- Cuerpo de CFG-1e §5 (20261030193000_cfg1e_mano_actual.sql:175-263), con su tope en
-- `limite_dinero()`. Nada más cambia.
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
  if not public.contar_intento_dinero('consultar_mano', public.limite_dinero('consultar_mano')) then
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

-- Cuerpo de TIE-1a §3 (20261031150000_tie1a_inventario.sql:143-229), con su tope en
-- `limite_dinero()`. Nada más cambia.
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
  if not public.contar_intento_dinero('comprar_articulo', public.limite_dinero('comprar_articulo')) then
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


-- ── 2 · Lo que el libro dice de una mesa ───────────────────────────────────
-- Toda línea de una mesa PvP lleva `ref_tipo = 'sala'` y `ref_id = <id de la sala>`.
-- El índice es para esas líneas y no cambia la forma del libro.
create index movimientos_mesa_pvp_idx
  on public.movimientos (ref_id)
  where ref_tipo = 'sala';

-- Lo que esta cuenta tiene dentro de esta mesa, en negativo.
create function public.neto_jugador_mesa(p_sala uuid, p_uid uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(sum(m.monto), 0)::bigint
    from public.movimientos m
   where m.jugador_id = p_uid
     and m.ref_tipo = 'sala'
     and m.ref_id = p_sala::text
     and m.tipo in ('garantia_pvp', 'liberacion_pvp')
$fn$;


-- ── 3 · La partida guarda sus pilas ────────────────────────────────────────
-- Una fila por asiento de partida, con el índice de `players[i]`. Fuera del cliente y
-- de la publicación, como `partidas`.
--
--   entrada  lo que puso al sentarse. Se guarda aquí porque el libro de una cuenta
--            borrada se va en cascada, y la mesa tiene que seguir cuadrando sin él.
--   pila     la de la última mano cerrada. Es lo que cobra si la partida muere.
--   liberado lo que se llevó al salir.
--   cobrado  ya salió con su dinero. Su pila es 0 para siempre.
--   abandono_pedido  el jugador abrió otra mesa (§2-g de la ficha). El SQL no toca el
--            estado del árbitro: lo marca aquí, y la 1e aplica `abandonarPorServidor`.
--
-- `uid` queda nulo si la cuenta se borra tras cobrar, sin llevarse la fila.
create table public.partida_asientos (
  sala_id         uuid     not null references public.partidas(sala_id) on delete cascade,
  asiento         smallint not null check (asiento between 0 and 4),
  uid             uuid     references public.profiles(id) on delete set null,
  entrada         bigint   not null check (entrada > 0),
  pila            bigint   not null check (pila >= 0),
  liberado        bigint   not null default 0 check (liberado >= 0),
  cobrado         boolean  not null default false,
  abandono_pedido boolean  not null default false,
  primary key (sala_id, asiento),
  unique (sala_id, uid),
  constraint partida_asientos_cobrado_chk check (not cobrado or pila = 0),
  constraint partida_asientos_cuenta_chk  check (cobrado or uid is not null)
);

comment on table public.partida_asientos is
  'MOT-1 · Pilas de la última mano cerrada y salida de cada asiento. Solo el SQL del árbitro. RLS sin políticas y sin privilegios del cliente.';

create index partida_asientos_uid_idx on public.partida_asientos (uid);

-- Para el barrido, que corre en casi cada llamada de salas.
create index partidas_vivas_idx on public.partidas (actualizada_en) where terminada_en is null;

alter table public.partida_asientos enable row level security;
revoke all on table public.partida_asientos from public, anon, authenticated;

-- Lo que la mesa tiene dentro según el libro: garantías − liberaciones, en negativo. Las
-- filas de una cuenta borrada ya no están, y sus asientos ponen lo suyo.
create function public.neto_mesa(p_sala uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce((select sum(m.monto)
                     from public.movimientos m
                    where m.ref_tipo = 'sala'
                      and m.ref_id = p_sala::text
                      and m.tipo in ('garantia_pvp', 'liberacion_pvp')), 0)::bigint
       + coalesce((select sum(a.liberado - a.entrada)
                     from public.partida_asientos a
                    where a.sala_id = p_sala and a.uid is null), 0)::bigint
$fn$;

-- Pilas + liberado = entradas, y el libro dice lo mismo que los asientos.
create function public.mesa_cuadra(p_sala uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select sum(a.pila + a.liberado) = sum(a.entrada)
     and public.neto_mesa(p_sala) = sum(a.liberado) - sum(a.entrada)
    from public.partida_asientos a
   where a.sala_id = p_sala
$fn$;


-- ── 4 · Sentarse y levantarse ──────────────────────────────────────────────
-- Las sillas y las partidas de esta cuenta, antes que su billetera.
create function public.cerrojos_pvp(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform 1 from public.salas s where s.id = public.sala_esperando_de(p_uid) for update;
  perform 1 from public.partida_asientos a where a.uid = p_uid and not a.cobrado for update;
end
$fn$;

-- ¿Alcanza, contando lo que devolvería la mesa contra las IAS que se va a cerrar? El
-- criterio de `sentarse_ia`, para no rechazar a quien tiene el dinero en esa mesa.
create function public.alcanza_entrada(p_uid uuid, p_monto bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select public.saldo_de(p_uid)
       + coalesce((select least(m.pila_informada, m.techo_cobro)
                     from public.mesas_ia m
                    where m.jugador_id = p_uid and m.estado = 'abierta'), 0) >= p_monto
$fn$;

-- La garantía: tope, una partida por cuenta y cobro. Se llama antes de crear la silla,
-- para que `cerrar_partida_abierta` no confunda esta mesa con la que hay que dejar.
--
-- La clave lleva el número de sentada: quien se levanta y vuelve a la misma mesa paga
-- otra vez, y sin ese número el libro lo daría por repetido y lo sentaría gratis.
--
-- Los `raise` deshacen todo lo anterior, también el cierre de la otra mesa. El del tope
-- deshace solo su propia anotación, y las de las sentadas buenas ya están confirmadas:
-- por eso sigue contando (la lección de SAL-B1 A1).
create function public.cobrar_entrada(p_sala uuid, p_uid uuid, p_funcion text, p_monto bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_sentada integer;
  v_res     public.movimiento_resultado;
begin
  if not public.contar_intento_dinero(p_funcion, public.limite_dinero(p_funcion)) then
    raise exception 'demasiados_intentos' using errcode = 'P0001';
  end if;

  perform public.cerrojos_pvp(p_uid);
  perform 1 from public.billeteras b where b.jugador_id = p_uid for update;
  perform public.cerrar_partida_abierta(p_uid, 'reemplazada');

  select count(*) + 1 into v_sentada
    from public.movimientos m
   where m.jugador_id = p_uid and m.ref_tipo = 'sala'
     and m.ref_id = p_sala::text and m.tipo = 'garantia_pvp';

  v_res := public.aplicar_movimiento(
    p_uid, 'garantia_pvp', -p_monto,
    'garantia_pvp:' || p_sala::text || ':' || p_uid::text || ':' || v_sentada::text,
    'sala', p_sala::text, null);

  if v_res.motivo = 'saldo_insuficiente' then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  elsif v_res.motivo <> 'aplicado' then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;
end
$fn$;

-- Devuelve lo que esta cuenta tiene dentro de esta mesa. Sin nada dentro, nada: por eso
-- repetirla no paga dos veces, y la clave del libro lo asegura por segunda vez.
create function public.devolver_entrada(p_sala uuid, p_uid uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_dentro  bigint := -public.neto_jugador_mesa(p_sala, p_uid);
  v_sentada integer;
  v_res     public.movimiento_resultado;
begin
  if v_dentro <= 0 then
    return 0;
  end if;

  select count(*) into v_sentada
    from public.movimientos m
   where m.jugador_id = p_uid and m.ref_tipo = 'sala'
     and m.ref_id = p_sala::text and m.tipo = 'garantia_pvp';

  v_res := public.aplicar_movimiento(
    p_uid, 'liberacion_pvp', v_dentro,
    'liberacion_pvp:' || p_sala::text || ':' || p_uid::text || ':devolucion:' || v_sentada::text,
    'sala', p_sala::text, null);

  if v_res.motivo not in ('aplicado', 'repetido') then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;
  return v_dentro;
end
$fn$;

-- Cancela la mesa y devuelve a todos los sentados. Quien la llama ya tiene la fila de la
-- sala bloqueada.
create function public.cancelar_sala(p_sala uuid)
returns public.salas
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_sala public.salas;
  v_uid  uuid;
begin
  update public.salas set estado = 'cancelada' where id = p_sala returning * into v_sala;

  for v_uid in
    select j.jugador_id from public.sala_jugadores j where j.sala_id = p_sala order by j.jugador_id
  loop
    perform public.devolver_entrada(p_sala, v_uid);
  end loop;

  if public.neto_mesa(p_sala) <> 0 then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;
  return v_sala;
end
$fn$;

-- Cuerpo de SAL-B2 §2 (20260911230935_sal_b2.sql:186-222) sin sesión y con el dinero: lo
-- comparten `salir_sala` y `cerrar_partida_abierta`.
--
-- Con partida no se levanta nadie: esa silla es el acceso al canal, y se sale de la
-- partida con la acción `abandonar`. Un invitado que deja una `activa` sin partida sí
-- recupera lo suyo; el anfitrión de esa mesa espera al barrido, como hasta hoy.
create function public.levantarse_de_sala(p_sala uuid, p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_sala  public.salas;
  v_llena boolean;   -- SAL-B2
begin
  select * into v_sala from public.salas where id = p_sala for update;
  if not found then
    return;   -- salir de una sala que ya no existe no es un error: ya estás fuera
  end if;

  if exists (select 1 from public.partidas p where p.sala_id = p_sala) then
    return;
  end if;

  if v_sala.anfitrion_id = p_uid then
    if v_sala.estado = 'esperando' then
      perform public.cancelar_sala(p_sala);
    end if;
  else
    -- SAL-B2: si la mesa estaba llena, la silla que se libera devuelve el reloj a su plazo original.
    v_llena := (select count(*) from public.sala_jugadores where sala_id = p_sala) = v_sala.jugadores;
    delete from public.sala_jugadores where sala_id = p_sala and jugador_id = p_uid;
    perform public.devolver_entrada(p_sala, p_uid);
    -- `creada_en + 3 minutes` es el plazo original (default de SAL-A:97, espejo
    -- de DURACION_SALA_SEG). `greatest` nunca acorta: si por carrera el plazo
    -- original ya pasó, la cuenta corta sigue y el barrido decide.
    if v_llena and v_sala.estado = 'esperando' then
      update public.salas
         set expira_en = greatest(expira_en, creada_en + interval '3 minutes')
       where id = p_sala;
    end if;
  end if;
end
$fn$;

create or replace function public.salir_sala(p_sala uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = 'P0001';
  end if;

  perform public.levantarse_de_sala(p_sala, v_uid);
end
$fn$;

-- Cuerpo de SAL-A §8 (20260905203158_sal_a_salas.sql:370-398): la cancelación devuelve.
create or replace function public.resolver_sala(p_sala uuid)
returns public.salas
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_sala     public.salas;
  v_sentados integer;
begin
  select * into v_sala from public.salas where id = p_sala for update;
  if not found then
    raise exception 'sala_no_disponible' using errcode = 'P0001';
  end if;

  if v_sala.estado = 'esperando' and v_sala.expira_en <= now() then
    select count(*) into v_sentados from public.sala_jugadores where sala_id = p_sala;
    if v_sentados >= 2 then
      update public.salas
         set estado = 'activa'::public.sala_estado, iniciada_en = now()
       where id = p_sala
       returning * into v_sala;
    else
      v_sala := public.cancelar_sala(p_sala);
    end if;
  end if;

  return v_sala;
end
$fn$;

-- Cuerpo de la 1d-i. Saldo ≥ entrada en lugar del 5×, y la garantía en la transacción de
-- la silla. El cobro va después del `insert` de la sala porque su clave lleva el id.
create or replace function public.crear_sala(
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

  if not public.alcanza_entrada(v_uid, public.entrada_de(p_apuesta, p_entrada)) then
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

  perform public.cobrar_entrada(v_sala.id, v_uid, 'crear_sala', public.entrada_de(p_apuesta, p_entrada));

  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, 0);

  return v_sala;
end
$fn$;

-- Cuerpo de SAL-B2 §1 (20260911230935_sal_b2.sql:51-175) con dos cambios: saldo ≥ entrada
-- y la garantía antes de la silla.
create or replace function public.unirse_sala(
  p_codigo text default null,
  p_sala   uuid default null
)
returns public.salas
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid      uuid := auth.uid();
  v_sala     public.salas;
  v_cuerpo   text;
  v_intentos integer;
  v_sentados integer;
  v_asiento  smallint;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = 'P0001';
  end if;

  perform public.barrer_salas();

  if p_codigo is not null then
    v_cuerpo := upper(regexp_replace(p_codigo, '[^A-Za-z0-9]', '', 'g'));
    if length(v_cuerpo) = 6 and left(v_cuerpo, 2) = 'AJ' then
      v_cuerpo := substr(v_cuerpo, 3);
    elsif length(v_cuerpo) <> 4 then
      v_cuerpo := null;
    end if;

    if v_cuerpo is null or v_cuerpo !~ '^[A-HJ-NP-Z2-9]{4}$' then
      raise exception 'codigo_invalido' using errcode = 'P0001';
    end if;

    delete from public.intentos_codigo
     where jugador_id = v_uid and intentado_en < now() - interval '1 hour';

    insert into public.intentos_codigo (jugador_id) values (v_uid);

    select count(*) into v_intentos
      from public.intentos_codigo
     where jugador_id = v_uid and intentado_en > now() - interval '1 minute';
    if v_intentos > 5 then
      raise exception 'demasiados_intentos' using errcode = 'P0001';
    end if;

    select * into v_sala from public.salas where codigo = 'AJ-' || v_cuerpo for update;

    -- A1 §3 · NO ENCONTRADO → NULL, no `raise`: es lo que deja la anotación de
    -- arriba en pie. Sin esta salida normal, el límite no cuenta nunca.
    if v_sala.id is null then
      return null;
    end if;

    -- A3 · «Ya iniciada», vencida o cancelada → NULL por el MISMO camino que
    -- «no existe», para todos: también para quien fue miembro. Una mesa muerta
    -- no se recupera; la reentrada de abajo es sólo para mesas vivas. Dar aquí
    -- un error distinto del de «no existe» diría al que sondea que ese código
    -- existió; devolver lo mismo en los dos casos no cuenta nada.
    -- (Provisional hasta MES-PvP: cuando exista partida, la reentrada a una
    -- 'activa' con `estado_partida` no nulo se decide allí.)
    if v_sala.estado <> 'esperando' or v_sala.expira_en <= now() then
      return null;
    end if;

    -- La reentrada, sólo para una mesa viva: quien ya está sentado la recupera
    -- como siempre (una recarga o un doble clic no son un error).
    if public.es_miembro(v_sala.id, v_uid) then
      return v_sala;
    end if;
  elsif p_sala is not null then
    select * into v_sala from public.salas where id = p_sala for update;
    if v_sala.id is null then
      raise exception 'sala_no_disponible' using errcode = 'P0001';
    end if;
    -- A3 · mismo orden que por código: primero «viva», luego «miembro».
    if v_sala.estado <> 'esperando' or v_sala.expira_en <= now() then
      raise exception 'sala_no_disponible' using errcode = 'P0001';
    end if;
    if public.es_miembro(v_sala.id, v_uid) then
      return v_sala;
    end if;
  else
    raise exception 'codigo_invalido' using errcode = 'P0001';
  end if;

  -- A1 §2.3 · el MISMO predicado que `mi_sala` y `crear_sala`.
  if public.sala_esperando_de(v_uid) is not null then
    raise exception 'ya_en_sala' using errcode = 'P0001';
  end if;

  if not public.alcanza_entrada(v_uid, public.entrada_de(v_sala.apuesta, v_sala.entrada)) then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  end if;

  select count(*) into v_sentados from public.sala_jugadores where sala_id = v_sala.id;
  if v_sentados >= v_sala.jugadores then
    raise exception 'sala_llena' using errcode = 'P0001';
  end if;

  select min(g) into v_asiento
    from generate_series(0, v_sala.jugadores - 1) as g
   where g not in (select asiento from public.sala_jugadores where sala_id = v_sala.id);

  -- MOT-1 · la garantía, en la transacción de la silla.
  perform public.cobrar_entrada(v_sala.id, v_uid, 'unirse_sala', public.entrada_de(v_sala.apuesta, v_sala.entrada));

  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, v_asiento);

  -- SAL-B2: mesa llena → cuenta atrás corta. La cifra vive AQUÍ; salas.js la espeja como LLENA_SEG.
  -- `least` garantiza que nunca alarga: una mesa a la que le quedaban cinco
  -- segundos sigue con sus cinco. `returning * into v_sala` para que la fila que
  -- se devuelve lleve ya el `expira_en` nuevo y el cliente pinte la cuenta corta
  -- sin esperar al evento de Realtime. La fila de `salas` está bloqueada por el
  -- `for update` de arriba, así que el recuento no puede cambiar entre medio.
  if (select count(*) from public.sala_jugadores where sala_id = v_sala.id) = v_sala.jugadores then
    update public.salas
       set expira_en = least(expira_en, now() + interval '10 seconds')
     where id = v_sala.id
     returning * into v_sala;
  end if;

  return v_sala;
end
$fn$;

-- Sin nadie que la llame. El 5× ya no existe: lo sustituye `entrada_de`.
drop function public.regla_asiento();


-- ── 5 · Una partida por cuenta (C-9) ───────────────────────────────────────
-- Cuerpo de ECO-1c §5 (20261008220239_eco1c_mesas_ia.sql:303-343) con el bloque de PvP.
--
-- 'reemplazada' es abrir otra mesa, y conoce los dos modos. 'abandono' es `recoger_mesa_ia`,
-- que corre al arrancar la app y solo mira la mesa contra las IAS: recargar la página no
-- saca a nadie de una partida. Devuelve lo mismo que antes: su resultado habla de la mesa
-- contra las IAS, y `sentarse_ia` lo usa para el aviso C5.
--
-- Quien la llama ya tiene bloqueadas sus sillas (`cerrojos_pvp`) y su billetera.
create or replace function public.cerrar_partida_abierta(p_jugador uuid, p_motivo text)
returns public.cierre_partida
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_mesa   public.mesas_ia;
  v_cobro  bigint;
  v_res    public.movimiento_resultado;
  v_espera uuid;
begin
  if p_motivo = 'reemplazada' then
    -- La espera: sale con su entrada devuelta. Si es el anfitrión, la mesa se cancela y
    -- todos recuperan la suya.
    v_espera := public.sala_esperando_de(p_jugador);
    if v_espera is not null then
      perform public.levantarse_de_sala(v_espera, p_jugador);
    end if;

    -- La partida viva: no se toca el estado del árbitro y aquí no se mueve dinero. Saldrá
    -- por el efecto `salida` cuando la 1e aplique el abandono.
    update public.partida_asientos a
       set abandono_pedido = true
      from public.partidas p
     where p.sala_id = a.sala_id
       and p.terminada_en is null
       and a.uid = p_jugador
       and not a.cobrado;
  end if;

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

-- Cuerpo de ECO-1d (20261009105658_eco1d_constancia_limites_valvula.sql:420-528) con dos
-- cambios: los cerrojos de PvP primero, y lo que devolvería la sala de espera cuenta para
-- juzgar el saldo. La espera y la partida viva las resuelve `cerrar_partida_abierta`.
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

  -- MOT-1 · el orden de los cerrojos: sala y asiento antes que billetera.
  perform public.cerrojos_pvp(v_uid);

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
  -- MOT-1 · la entrada de la sala de espera que va a dejar también vuelve.
  v_vuelve := v_vuelve - public.neto_jugador_mesa(public.sala_esperando_de(v_uid), v_uid);
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

-- Cuerpo de la 1d-i. El asiento manda: quien ya cobró o pidió abandonar no vuelve a esa
-- mesa. El abandono por la acción `abandonar` vive en el estado del árbitro hasta que
-- cobra, y la 1e decide cómo lo ve `mi_sala` entretanto.
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
    join public.partida_asientos a on a.sala_id = s.id
   where a.uid = v_uid and s.estado = 'activa'
     and not a.cobrado and not a.abandono_pedido
   order by s.creada_en desc
   limit 1;

  if not found then
    return null;
  end if;

  return v_sala;
end
$fn$;

-- Cuerpo de CFG-1c (20261030001500_cfg1c_eliminar_cuenta.sql:45-77). Con partida viva
-- manda el asiento: quien ya cobró puede irse sin cerrar la partida de los demás.
--
-- EL ANFITRIÓN SIGUE BLOQUEADO mientras la partida viva, aunque haya cobrado:
-- `salas.anfitrion_id` es `on delete cascade`, y borrarlo se llevaría la sala, la partida
-- y las pilas de todos.
create or replace function public.partida_abierta_de(p_uid uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  perform public.barrer_salas();

  if exists (
    select 1 from public.mesas_ia m
     where m.jugador_id = p_uid and m.estado = 'abierta'
  ) then
    return 'mesa_ia';
  end if;

  if exists (
    select 1 from public.salas s
     where s.anfitrion_id = p_uid
       and s.estado in ('esperando', 'activa')
  ) or exists (
    select 1 from public.salas s
      join public.sala_jugadores j on j.sala_id = s.id
     where j.jugador_id = p_uid
       and s.estado in ('esperando', 'activa')
       and not exists (select 1 from public.partidas p where p.sala_id = s.id)
  ) or exists (
    select 1 from public.partida_asientos a
      join public.partidas p on p.sala_id = a.sala_id
     where a.uid = p_uid
       and not a.cobrado
       and p.terminada_en is null
  ) then
    return 'sala';
  end if;

  return null;
end
$fn$;

comment on function public.partida_abierta_de(uuid) is
  'CFG-1 1c, MOT-1 1d-ii · null, ''mesa_ia'' o ''sala'' (esperando o activa sin partida, anfitrión de una viva, o asiento sin cobrar). La guarda de eliminar_cuenta. Sólo service_role.';


-- ── 6 · El interruptor de los puntos (C-11) ────────────────────────────────
-- El mecanismo de la válvula (ECO-1d §4): la fila de `ajustes_economia`, un mando que solo
-- se corre en el SQL Editor y un rastro. Nace apagado; se enciende en MES-PvP:
--
--   select public.interruptor_puntos_humanos(true);    -- encender
--   select public.interruptor_puntos_humanos(false);   -- apagar
--   select * from public.interruptor_cambios order by en desc;   -- el rastro
alter table public.ajustes_economia
  add column puntos_humanos boolean not null default false;

comment on column public.ajustes_economia.puntos_humanos is
  'MOT-1 · ¿Anota guardar_jugada puntos contra humanos? Apagado hasta MES-PvP. Se cambia con interruptor_puntos_humanos().';

create table public.interruptor_cambios (
  id          bigint      generated always as identity primary key,
  interruptor text        not null,
  antes       boolean     not null,
  despues     boolean     not null,
  quien       text        not null default current_user,
  en          timestamptz not null default now()
);

comment on table public.interruptor_cambios is
  'MOT-1 · Rastro de interruptor_puntos_humanos(). RLS activo y CERO políticas.';

alter table public.interruptor_cambios enable row level security;
revoke all on table public.interruptor_cambios from public, anon, authenticated;

create function public.puntos_humanos_encendidos()
returns boolean language sql stable security definer set search_path = ''
as $fn$ select a.puntos_humanos from public.ajustes_economia a where a.id $fn$;

create function public.interruptor_puntos_humanos(p_encendido boolean)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_antes boolean;
begin
  if p_encendido is null then
    return 'valor_invalido';
  end if;
  select a.puntos_humanos into v_antes from public.ajustes_economia a where a.id for update;
  if p_encendido = v_antes then
    return 'sin_cambio';
  end if;
  update public.ajustes_economia set puntos_humanos = p_encendido, actualizada_en = now() where id;
  insert into public.interruptor_cambios (interruptor, antes, despues)
  values ('puntos_humanos', v_antes, p_encendido);
  return case when p_encendido then 'encendido' else 'apagado' end;
end
$fn$;

-- Contrato §7: `origen` humanos, `nivel` nulo, `puntos_base` = sentados + 3. La lista la
-- comprueban los `check` de `libro_puntos`. Unos puntos que no entran no deshacen una mano
-- de dinero: se avisa y la jugada sigue.
create function public.anotar_puntos_humanos(
  p_sala     uuid,
  p_uid      uuid,
  p_mano     integer,
  p_sentados smallint,
  p_ajilei   smallint
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.libro_puntos
    (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
  values
    (p_uid, 'humanos', null, p_sentados, p_sentados + 3, p_ajilei,
     public.extra_ajilei(p_ajilei), p_sala, p_mano)
  on conflict (origen, mesa_id, mano) do nothing;
exception when check_violation or not_null_violation then
  raise warning 'MOT-1: los puntos de la mesa %, mano %, no entraron (%)', p_sala, p_mano, sqlerrm;
end
$fn$;


-- ── 7 · La partida ─────────────────────────────────────────────────────────
-- Cuerpo de la 1d-i. Ahora lleva `abandonos`, los asientos que la 1e tiene que abandonar.
-- `drop` + `create`: cambia lo que devuelve. El `drop` se lleva los permisos.
drop function public.leer_partida(uuid);

create function public.leer_partida(p_sala uuid)
returns table (estado jsonb, version integer, vencimiento timestamptz, correspondencia jsonb, abandonos smallint[])
language sql
stable
security definer
set search_path = ''
as $fn$
  select p.estado, p.version, p.vencimiento, p.correspondencia,
         array(select a.asiento
                 from public.partida_asientos a
                where a.sala_id = p.sala_id and a.abandono_pedido and not a.cobrado
                order by a.asiento)
    from public.partidas p
   where p.sala_id = p_sala
$fn$;

comment on function public.leer_partida(uuid) is
  'MOT-1 · Estado, versión, vencimiento, correspondencia y asientos con abandono pedido, o ninguna fila. Sólo service_role.';

revoke execute on function public.leer_partida(uuid) from public, anon, authenticated;
grant  execute on function public.leer_partida(uuid) to service_role;

-- Cuerpo de la 1d-i con las pilas y su comprobación. Cada asiento tiene que tener en el
-- libro exactamente su entrada: si no, `estado_incoherente`. Una mesa de antes de esta
-- migración no arranca: se la lleva el barrido a los 10 min, sin deber nada.
--
-- `sala_no_activa` también con menos de dos: un invitado puede haberse levantado de una
-- `activa` sin partida, y `crearPartida` del árbitro lanza con una silla.
create or replace function public.crear_partida(
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
  v_entrada  bigint;
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
    if v_asientos < 2 then
      return jsonb_build_object('ok', false, 'motivo', 'sala_no_activa');
    end if;
    if v_sillas is distinct from p_correspondencia then
      return jsonb_build_object('ok', false, 'motivo', 'asientos_distintos');
    end if;

    if (p_estado ->> 'version') is null then
      raise exception 'estado_incoherente' using errcode = 'P0001';
    end if;

    v_entrada := public.entrada_de(v_sala.apuesta, v_sala.entrada);
    if exists (select 1 from public.sala_jugadores j
                where j.sala_id = p_sala
                  and public.neto_jugador_mesa(p_sala, j.jugador_id) <> -v_entrada)
       or public.neto_mesa(p_sala) <> -(v_asientos * v_entrada) then
      raise exception 'estado_incoherente' using errcode = 'P0001';
    end if;

    insert into public.partidas (sala_id, estado, version, vencimiento, correspondencia)
    values (p_sala, p_estado, (p_estado ->> 'version')::integer, p_vencimiento, p_correspondencia)
    returning * into v_partida;

    insert into public.partida_asientos (sala_id, asiento, uid, entrada, pila)
    select p_sala, c.value::smallint, c.key::uuid, v_entrada, v_entrada
      from jsonb_each_text(p_correspondencia) c;

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

-- Los `efectos` del árbitro (informe 1b §1), en orden, dentro de la transacción de
-- `guardar_jugada`. Cuando acaba, la mesa tiene que cuadrar, y si dice que terminó, todos
-- tienen que haber cobrado con neto 0. Un efecto que no se entiende no se ignora.
--
-- La `salida` y la partida muerta comparten clave: un asiento cobra una sola vez, por
-- cualquiera de los dos caminos.
create function public.aplicar_efectos(p_sala uuid, p_efectos jsonb, p_terminada boolean)
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

-- Cuerpo de la 1d-i con dos cambios: bloquea primero la sala (el orden de los cerrojos) y
-- aplica los efectos. Con versión vieja sale antes de llegar a ellos.
--
-- El recuento de vistas distingue los asientos de las filas: si una cuenta borró su perfil
-- tras cobrar, su vista se fue en cascada, el árbitro la sigue mandando y la partida de los
-- demás no se puede parar por eso.
create or replace function public.guardar_jugada(
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
  v_vivas     integer;
  v_filas     integer;
begin
  if (p_estado ->> 'version')::integer is distinct from v_nueva then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;

  perform 1 from public.salas where id = p_sala for update;

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
  select count(*) into v_vivas from public.partida_vistas where sala_id = p_sala;
  select count(*) into v_asientos from public.partida_asientos where sala_id = p_sala;
  if v_filas <> v_vivas or jsonb_array_length(p_vistas) <> v_asientos then
    raise exception 'vistas_incompletas' using errcode = 'P0001';
  end if;

  perform public.aplicar_efectos(p_sala, p_efectos, p_terminada);

  if p_terminada then
    update public.salas set estado = 'terminada' where id = p_sala and estado = 'activa';
  end if;

  return jsonb_build_object('ok', true, 'version', v_nueva);
end
$fn$;

-- C-10: la mano en curso se anula y cada asiento sin cobrar se lleva la pila de la última
-- mano cerrada. Quien la llama ya tiene la sala bloqueada. La partida se relee con el
-- bloqueo: una jugada pudo confirmarse entre la búsqueda del barrido y este momento.
create function public.cerrar_partida_muerta(p_sala uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_asiento public.partida_asientos;
  v_res     public.movimiento_resultado;
begin
  perform 1
    from public.partidas p
   where p.sala_id = p_sala
     and p.terminada_en is null
     and p.actualizada_en <= now() - interval '15 minutes'
     for update;
  if not found then
    return;
  end if;

  for v_asiento in
    select a.* from public.partida_asientos a
     where a.sala_id = p_sala and not a.cobrado
     order by a.uid
       for update
  loop
    if v_asiento.pila > 0 then
      v_res := public.aplicar_movimiento(
        v_asiento.uid, 'liberacion_pvp', v_asiento.pila,
        'liberacion_pvp:' || p_sala::text || ':' || v_asiento.uid::text || ':salida',
        'sala', p_sala::text, null);
      if v_res.motivo <> 'aplicado' then
        raise exception 'estado_incoherente' using errcode = 'P0001';
      end if;
    end if;
    update public.partida_asientos
       set cobrado = true, pila = 0, liberado = v_asiento.pila
     where sala_id = p_sala and asiento = v_asiento.asiento;
  end loop;

  if not public.mesa_cuadra(p_sala) or public.neto_mesa(p_sala) <> 0 then
    raise exception 'estado_incoherente' using errcode = 'P0001';
  end if;

  update public.partidas set terminada_en = now(), actualizada_en = now() where sala_id = p_sala;
  update public.salas set estado = 'terminada' where id = p_sala and estado = 'activa';
end
$fn$;

-- Cuerpo de la 1d-i, ahora fila a fila también en la primera mitad, y con el dinero.
--
-- UNA MESA QUE NO CUADRA NO PARA EL BARRIDO. Lo llaman casi todas las funciones de salas:
-- un `raise` que saliera de aquí dejaría a todos sin poder sentarse. Cada mesa va en su
-- propio bloque: si no cuadra, se deshace solo lo suyo, queda como estaba, sale por
-- `raise warning` a los registros de Postgres y el siguiente barrido lo vuelve a intentar.
--
-- 15 minutos, cifra provisional (contrato §6). `skip locked`: la que alguien está tocando
-- no se espera, y su jugada le renueva la hora.
create or replace function public.barrer_salas()
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_id uuid;
begin
  for v_id in
    select s.id
      from public.salas s
     where s.estado = 'esperando' and s.expira_en <= now()
       for update of s skip locked
  loop
    begin
      if (select count(*) from public.sala_jugadores j where j.sala_id = v_id) >= 2 then
        update public.salas s
           set estado = 'activa'::public.sala_estado, iniciada_en = now()
         where s.id = v_id;
      else
        perform public.cancelar_sala(v_id);
      end if;
    exception when others then
      raise warning 'MOT-1: la mesa % no se pudo resolver (%)', v_id, sqlerrm;
    end;
  end loop;

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
    begin
      if not exists (select 1 from public.partidas p where p.sala_id = v_id) then
        perform public.cancelar_sala(v_id);
      end if;
    exception when others then
      raise warning 'MOT-1: la mesa % no se pudo cancelar (%)', v_id, sqlerrm;
    end;
  end loop;

  -- La partida muerta.
  for v_id in
    select s.id
      from public.salas s
      join public.partidas p on p.sala_id = s.id
     where s.estado = 'activa'
       and p.terminada_en is null
       and p.actualizada_en <= now() - interval '15 minutes'
       for update of s skip locked
  loop
    begin
      perform public.cerrar_partida_muerta(v_id);
    exception when others then
      raise warning 'MOT-1: la partida % no se pudo cerrar (%)', v_id, sqlerrm;
    end;
  end loop;
end
$fn$;


-- ── 8 · Permisos ───────────────────────────────────────────────────────────
-- Internas: a nadie del cliente. El molde de ECO-1d §10.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.entrada_de(integer, text)',
    'public.neto_jugador_mesa(uuid, uuid)',
    'public.neto_mesa(uuid)',
    'public.mesa_cuadra(uuid)',
    'public.cerrojos_pvp(uuid)',
    'public.alcanza_entrada(uuid, bigint)',
    'public.cobrar_entrada(uuid, uuid, text, bigint)',
    'public.devolver_entrada(uuid, uuid)',
    'public.cancelar_sala(uuid)',
    'public.levantarse_de_sala(uuid, uuid)',
    'public.puntos_humanos_encendidos()',
    'public.interruptor_puntos_humanos(boolean)',
    'public.anotar_puntos_humanos(uuid, uuid, integer, smallint, smallint)',
    'public.aplicar_efectos(uuid, jsonb, boolean)',
    'public.cerrar_partida_muerta(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end
$$;

-- Fuera de la publicación, y comprobado: el bloque de ECO-1c §14.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'MOT-1 1d-ii: supabase_realtime es FOR ALL TABLES; los asientos no pueden quedar fuera';
  end if;
  foreach t in array array['partida_asientos', 'interruptor_cambios'] loop
    if exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en la 1d-i. Se pega cada grupo ENTERO y sin los `-- `. Cada uno
-- acaba en una única consulta `comprobación | resultado | detalle`, y cada fila debe
-- decir PASA: 18 el Grupo A y 51 el Grupo B.
--
-- El Grupo B fabrica diez cuentas con saldo controlado y lo deshace todo al final, con
-- la excepción que lanza `mot1dii_deshacer`: cuentas, salas, partidas, movimientos, la
-- huella del correo en `bonos_bienvenida` y lo que `barrer_salas()` toque de las salas
-- reales. No deja rastro. Puede sacar avisos `WARNING`: son los de B9c y B10d, a propósito.
--
-- Lo que estos grupos no cubren, declarado: la concurrencia real, que pide dos conexiones.
--
-- ── GRUPO A · definiciones y permisos ──────────────────────────────────────
-- with
-- nuevas(firma) as (values
--   ('public.neto_jugador_mesa(uuid, uuid)'),
--   ('public.neto_mesa(uuid)'),
--   ('public.mesa_cuadra(uuid)'),
--   ('public.cerrojos_pvp(uuid)'),
--   ('public.alcanza_entrada(uuid, bigint)'),
--   ('public.cobrar_entrada(uuid, uuid, text, bigint)'),
--   ('public.devolver_entrada(uuid, uuid)'),
--   ('public.cancelar_sala(uuid)'),
--   ('public.levantarse_de_sala(uuid, uuid)'),
--   ('public.puntos_humanos_encendidos()'),
--   ('public.interruptor_puntos_humanos(boolean)'),
--   ('public.anotar_puntos_humanos(uuid, uuid, integer, smallint, smallint)'),
--   ('public.aplicar_efectos(uuid, jsonb, boolean)'),
--   ('public.cerrar_partida_muerta(uuid)')
-- ),
-- arbitro(firma) as (values
--   ('public.leer_partida(uuid)'),
--   ('public.crear_partida(uuid, jsonb, timestamptz, jsonb, jsonb)'),
--   ('public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb)')
-- ),
-- piezas(firma) as (
--   select firma from arbitro
--   union all values
--   ('public.aplicar_efectos(uuid, jsonb, boolean)'),
--   ('public.anotar_puntos_humanos(uuid, uuid, integer, smallint, smallint)'),
--   ('public.cerrar_partida_muerta(uuid)'),
--   ('public.mesa_cuadra(uuid)'),
--   ('public.neto_mesa(uuid)')
-- ),
-- devoluciones(firma) as (values
--   ('public.salir_sala(uuid)'),
--   ('public.resolver_sala(uuid)'),
--   ('public.barrer_salas()'),
--   ('public.levantarse_de_sala(uuid, uuid)'),
--   ('public.cancelar_sala(uuid)'),
--   ('public.devolver_entrada(uuid, uuid)'),
--   ('public.cerrar_partida_abierta(uuid, text)'),
--   ('public.aplicar_efectos(uuid, jsonb, boolean)'),
--   ('public.guardar_jugada(uuid, integer, jsonb, timestamptz, jsonb, boolean, jsonb)'),
--   ('public.cerrar_partida_muerta(uuid)')
-- ),
-- fuente as (
--   select p.oid, p.proname, p.prosrc, p.oid::regprocedure::text as firma
--     from pg_proc p where p.pronamespace = 'public'::regnamespace
-- ),
-- pub as (
--   select count(*) as dentro from pg_publication_tables
--    where pubname = 'supabase_realtime' and schemaname = 'public'
--      and tablename in ('partida_asientos', 'interruptor_cambios')
-- ),
-- c as (
--   select 1 as orden, 'A1 · las funciones nuevas: existen, definer y search_path vacío' as comprobacion,
--          (select count(*)::text || ' de ' || (select count(*) from nuevas) from nuevas n
--            join pg_proc p on p.oid = to_regprocedure(n.firma)
--           where p.prosecdef and p.proconfig @> array['search_path=""']) as v,
--          (select count(*) from nuevas n join pg_proc p on p.oid = to_regprocedure(n.firma)
--            where p.prosecdef and p.proconfig @> array['search_path=""']) = (select count(*) from nuevas) as ok
--   union all
--   select 2, 'A2 · ninguna función nueva la ejecuta el cliente',
--          (select coalesce(string_agg(firma, ', '), 'ninguna') from (select firma from nuevas union all select 'public.entrada_de(integer, text)') n
--            where has_function_privilege('authenticated', firma, 'execute') or has_function_privilege('anon', firma, 'execute')),
--          not exists (select 1 from (select firma from nuevas union all select 'public.entrada_de(integer, text)') n
--                       where has_function_privilege('authenticated', firma, 'execute') or has_function_privilege('anon', firma, 'execute'))
--   union all
--   select 3, 'A3 · las tres RPC del árbitro: solo service_role',
--          (select string_agg(format('%s: servicio=%s aut=%s anon=%s', firma,
--                                    has_function_privilege('service_role', firma, 'execute'),
--                                    has_function_privilege('authenticated', firma, 'execute'),
--                                    has_function_privilege('anon', firma, 'execute')), ' | ') from arbitro),
--          (select bool_and(has_function_privilege('service_role', firma, 'execute')
--                           and not has_function_privilege('authenticated', firma, 'execute')
--                           and not has_function_privilege('anon', firma, 'execute')) from arbitro)
--   union all
--   select 4, 'A4 · las piezas del árbitro no leen auth.uid ni cuentan intentos',
--          (select coalesce(string_agg(f.firma, ', '), 'ninguna') from piezas w join fuente f on f.oid = to_regprocedure(w.firma)
--            where f.prosrc like '%auth.uid%' or f.prosrc like '%contar_intento_dinero%'),
--          (select count(*) = 8 and bool_and(f.prosrc not like '%auth.uid%' and f.prosrc not like '%contar_intento_dinero%')
--             from piezas w join fuente f on f.oid = to_regprocedure(w.firma))
--   union all
--   select 5, 'A5 · la garantía pasa por limite_dinero',
--          format('crear_sala=%s · unirse_sala=%s', public.limite_dinero('crear_sala'), public.limite_dinero('unirse_sala')),
--          public.limite_dinero('crear_sala') = 10 and public.limite_dinero('unirse_sala') = 10
--          and (select prosrc like '%contar_intento_dinero(p_funcion, public.limite_dinero(p_funcion))%' from fuente where firma = 'cobrar_entrada(uuid,uuid,text,bigint)')
--          and (select prosrc like '%cobrar_entrada%' from fuente where proname = 'crear_sala')
--          and (select prosrc like '%cobrar_entrada%' from fuente where proname = 'unirse_sala')
--   union all
--   select 6, 'A6 · las devoluciones no pasan por ningún tope',
--          (select coalesce(string_agg(f.firma, ', '), 'ninguna') from devoluciones w join fuente f on f.oid = to_regprocedure(w.firma)
--            where f.prosrc like '%limite_dinero%' or f.prosrc like '%contar_intento_dinero%'),
--          (select count(*) = 10 and bool_and(f.prosrc not like '%limite_dinero%' and f.prosrc not like '%contar_intento_dinero%')
--             from devoluciones w join fuente f on f.oid = to_regprocedure(w.firma))
--   union all
--   select 7, 'A7 · no queda ningún tope literal',
--          format('consultar_mano=%s · comprar_articulo=%s · literales: %s',
--                 public.limite_dinero('consultar_mano'), public.limite_dinero('comprar_articulo'),
--                 (select coalesce(string_agg(proname, ', '), 'ninguno') from fuente
--                   where prosrc ~ 'contar_intento_dinero\([^,]+,\s*[0-9]')),
--          public.limite_dinero('consultar_mano') = 30 and public.limite_dinero('comprar_articulo') = 30
--          and not exists (select 1 from fuente where prosrc ~ 'contar_intento_dinero\([^,]+,\s*[0-9]')
--   union all
--   select 8, 'A8 · el interruptor de puntos existe y está apagado',
--          (select format('puntos_humanos=%s · función=%s', a.puntos_humanos, public.puntos_humanos_encendidos()) from public.ajustes_economia a),
--          (select a.puntos_humanos = false from public.ajustes_economia a) and public.puntos_humanos_encendidos() = false
--   union all
--   select 9, 'A9 · el mando es solo del Editor',
--          format('aut=%s · anon=%s',
--                 has_function_privilege('authenticated', 'public.interruptor_puntos_humanos(boolean)', 'execute'),
--                 has_function_privilege('anon', 'public.interruptor_puntos_humanos(boolean)', 'execute')),
--          not has_function_privilege('authenticated', 'public.interruptor_puntos_humanos(boolean)', 'execute')
--          and not has_function_privilege('anon', 'public.interruptor_puntos_humanos(boolean)', 'execute')
--   union all
--   select 10, 'A10 · el 5× ya no existe',
--          format('regla_asiento=%s', to_regprocedure('public.regla_asiento()')),
--          to_regprocedure('public.regla_asiento()') is null
--          and not exists (select 1 from fuente where prosrc like '%regla_asiento%')
--   union all
--   select 11, 'A11 · entrada_de: las catorce cifras del contrato',
--          format('50 corta=%s · 5000 llena=%s', public.entrada_de(50, 'corta'), public.entrada_de(5000, 'llena')),
--          (select bool_and(public.entrada_de(a, 'corta') = a * 15 and public.entrada_de(a, 'llena') = a * 50)
--             from unnest(array[50, 100, 200, 500, 1000, 2000, 5000]) a)
--   union all
--   select 12, 'A12 · partida_asientos: RLS, sin políticas y sin privilegios del cliente',
--          format('rls=%s · políticas=%s · anon=%s · aut=%s',
--                 (select relrowsecurity from pg_class where oid = 'public.partida_asientos'::regclass),
--                 (select count(*) from pg_policies where schemaname = 'public' and tablename = 'partida_asientos'),
--                 has_table_privilege('anon', 'public.partida_asientos', 'select,insert,update,delete'),
--                 has_table_privilege('authenticated', 'public.partida_asientos', 'select,insert,update,delete')),
--          (select relrowsecurity from pg_class where oid = 'public.partida_asientos'::regclass)
--          and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'partida_asientos')
--          and not has_table_privilege('anon', 'public.partida_asientos', 'select,insert,update,delete')
--          and not has_table_privilege('authenticated', 'public.partida_asientos', 'select,insert,update,delete')
--   union all
--   select 13, 'A13 · el rastro: RLS y sin privilegios del cliente',
--          format('rls=%s · aut=%s',
--                 (select relrowsecurity from pg_class where oid = 'public.interruptor_cambios'::regclass),
--                 has_table_privilege('authenticated', 'public.interruptor_cambios', 'select,insert,update,delete')),
--          (select relrowsecurity from pg_class where oid = 'public.interruptor_cambios'::regclass)
--          and not has_table_privilege('authenticated', 'public.interruptor_cambios', 'select,insert,update,delete')
--          and not has_table_privilege('anon', 'public.interruptor_cambios', 'select,insert,update,delete')
--   union all
--   select 14, 'A14 · las dos tablas nuevas, fuera de supabase_realtime',
--          (select dentro::text || ' dentro' from pub),
--          (select dentro = 0 from pub)
--   union all
--   select 15, 'A15 · el libro: sin tipos nuevos',
--          (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk'),
--          (select pg_get_constraintdef(oid) like '%garantia_pvp%liberacion_pvp%' from pg_constraint
--            where conrelid = 'public.movimientos'::regclass and conname = 'movimientos_tipo_chk')
--   union all
--   select 16, 'A16 · leer_partida devuelve los abandonos pedidos',
--          pg_get_function_result('public.leer_partida(uuid)'::regprocedure),
--          pg_get_function_result('public.leer_partida(uuid)'::regprocedure) like '%abandonos smallint[]%'
--   union all
--   select 17, 'A17 · crear_sala y salir_sala siguen siendo del cliente',
--          format('crear=%s · unirse=%s · salir=%s · resolver=%s',
--                 has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute'),
--                 has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute'),
--                 has_function_privilege('authenticated', 'public.salir_sala(uuid)', 'execute'),
--                 has_function_privilege('authenticated', 'public.resolver_sala(uuid)', 'execute')),
--          has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer, text, text)', 'execute')
--          and has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute')
--          and has_function_privilege('authenticated', 'public.salir_sala(uuid)', 'execute')
--          and has_function_privilege('authenticated', 'public.resolver_sala(uuid)', 'execute')
--   union all
--   select 18, 'A18 · partida_abierta_de: solo service_role, y mira el asiento',
--          format('servicio=%s · aut=%s', has_function_privilege('service_role', 'public.partida_abierta_de(uuid)', 'execute'),
--                 has_function_privilege('authenticated', 'public.partida_abierta_de(uuid)', 'execute')),
--          has_function_privilege('service_role', 'public.partida_abierta_de(uuid)', 'execute')
--          and not has_function_privilege('authenticated', 'public.partida_abierta_de(uuid)', 'execute')
--          and (select prosrc like '%partida_asientos%' from fuente where proname = 'partida_abierta_de')
-- )
-- select comprobacion as "comprobación",
--        case when ok then 'PASA' else 'FALLA' end as resultado,
--        v as detalle
--   from c
--  order by orden;
-- ── FIN DEL GRUPO A ────────────────────────────────────────────────────────
--
-- ── GRUPO B · comportamiento ───────────────────────────────────────────────
-- create or replace function pg_temp.d2_fila(p_o integer, p_c text, p_ok boolean, p_d text)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_build_object('o', p_o, 'c', p_c, 'r', case when p_ok then 'PASA' else 'FALLA' end, 'd', coalesce(p_d, '(sin detalle)'))
-- $fn$;
--
-- create or replace function pg_temp.d2_yo(p_uid uuid)
-- returns void language sql as $fn$
--   select set_config('request.jwt.claims', coalesce(json_build_object('sub', p_uid)::text, ''), true)
-- $fn$;
--
-- create or replace function pg_temp.d2_saldo(p_uid uuid, p_saldo bigint)
-- returns void language plpgsql as $fn$
-- declare
--   v_dif bigint := p_saldo - public.saldo_de(p_uid);
-- begin
--   if v_dif <> 0 then
--     perform public.ajuste_admin(p_uid, v_dif, 'MOT-1 1d-ii · verificación');
--   end if;
-- end
-- $fn$;
--
-- -- Una mesa ya arrancada, con todos pagando por el camino del cliente.
-- create or replace function pg_temp.d2_mesa(p_uids uuid[], p_apuesta integer default 100, p_entrada text default 'corta')
-- returns uuid language plpgsql as $fn$
-- declare
--   s public.salas;
--   i integer;
-- begin
--   delete from public.intentos_dinero where jugador_id = any (p_uids);
--   perform pg_temp.d2_yo(p_uids[1]);
--   s := public.crear_sala('privada', cardinality(p_uids)::smallint, p_apuesta, p_entrada);
--   for i in 2 .. cardinality(p_uids) loop
--     perform pg_temp.d2_yo(p_uids[i]);
--     perform public.unirse_sala(null, s.id);
--   end loop;
--   perform pg_temp.d2_yo(p_uids[1]);
--   perform public.jugar_ya(s.id);
--   perform pg_temp.d2_yo(null);
--   return s.id;
-- end
-- $fn$;
--
-- create or replace function pg_temp.d2_vistas(p_n integer, p_v integer)
-- returns jsonb language sql immutable as $fn$
--   select jsonb_agg(jsonb_build_object('asiento', i, 'vista', jsonb_build_object('yo', i, 'v', p_v)))
--     from generate_series(0, p_n - 1) i
-- $fn$;
--
-- create or replace function pg_temp.d2_partida(p_sala uuid)
-- returns jsonb language plpgsql as $fn$
-- declare
--   v_corr jsonb;
--   v_n    integer;
-- begin
--   select jsonb_object_agg(c.jugador_id::text, c.indice), count(*) into v_corr, v_n
--     from (select j.jugador_id, row_number() over (order by j.asiento) - 1 as indice
--             from public.sala_jugadores j where j.sala_id = p_sala) c;
--   return public.crear_partida(p_sala, '{"version":0}'::jsonb, null, v_corr, pg_temp.d2_vistas(v_n, 0));
-- end
-- $fn$;
--
-- create or replace function pg_temp.d2_jugada(p_sala uuid, p_efectos jsonb, p_terminada boolean default false)
-- returns jsonb language plpgsql as $fn$
-- declare
--   v_v integer;
--   v_n integer;
-- begin
--   select version into v_v from public.partidas where sala_id = p_sala;
--   select count(*) into v_n from public.partida_asientos where sala_id = p_sala;
--   return public.guardar_jugada(p_sala, v_v, jsonb_build_object('version', v_v + 1), null,
--                                pg_temp.d2_vistas(v_n, v_v + 1), p_terminada, p_efectos);
-- end
-- $fn$;
--
-- create or replace function pg_temp.d2_pilas(p_sala uuid)
-- returns text language sql stable as $fn$
--   select string_agg(a.pila::text, ',' order by a.asiento) from public.partida_asientos a where a.sala_id = p_sala
-- $fn$;
--
-- create or replace function pg_temp.d2_lineas(p_sala uuid, p_uid uuid)
-- returns bigint language sql stable as $fn$
--   select count(*) from public.movimientos m
--    where m.ref_tipo = 'sala' and m.ref_id = p_sala::text and m.jugador_id = p_uid
-- $fn$;
--
-- create or replace function pg_temp.mot1dii_b()
-- returns table (orden integer, comprobacion text, resultado text, detalle text)
-- language plpgsql
-- as $fn$
-- declare
--   U1  constant uuid := 'd2d20000-0000-4000-8000-000000000001';
--   U2  constant uuid := 'd2d20000-0000-4000-8000-000000000002';
--   U3  constant uuid := 'd2d20000-0000-4000-8000-000000000003';
--   U4  constant uuid := 'd2d20000-0000-4000-8000-000000000004';
--   U5  constant uuid := 'd2d20000-0000-4000-8000-000000000005';
--   U6  constant uuid := 'd2d20000-0000-4000-8000-000000000006';
--   U7  constant uuid := 'd2d20000-0000-4000-8000-000000000007';
--   U8  constant uuid := 'd2d20000-0000-4000-8000-000000000008';
--   U9  constant uuid := 'd2d20000-0000-4000-8000-000000000009';
--   U10 constant uuid := 'd2d20000-0000-4000-8000-00000000000a';
--   CIEN constant bigint := 100000;
--   f  jsonb := '[]';
--   s  public.salas;
--   r  public.salas;
--   ia public.mesa_ia_resultado;
--   mv public.movimiento_resultado;
--   m1 uuid; m2 uuid; m3 uuid; m4 uuid;
--   j  jsonb;
--   a0 bigint; a1 bigint; b0 bigint; b1 bigint; c0 bigint; c1 bigint;
--   n1 bigint; n2 bigint;
--   t1 text; t2 text; t3 text;
--   i  integer;
-- begin
--   begin
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--            'mot1dii.' || right(u::text, 2) || '@example.invalid', '', now(), now(), '{}', '{}'
--       from unnest(array[U1, U2, U3, U4, U5, U6, U7, U8, U9, U10]) u;
--     insert into public.profiles (id, username)
--     select u, 'mot1dii_verif' || right(u::text, 2)
--       from unnest(array[U1, U2, U3, U4, U5, U6, U7, U8, U9, U10]) u;
--     perform pg_temp.d2_saldo(u, CIEN) from unnest(array[U1, U2, U3, U4, U5, U8, U9, U10]) u;
--     perform pg_temp.d2_saldo(U6, 1500);
--     perform pg_temp.d2_saldo(U7, 1499);
--
--     -- ── 1 · Sentarse cobra la entrada justa ────────────────────────────────────
--     perform pg_temp.d2_yo(U1);
--     s := public.crear_sala('privada', 3::smallint, 100);
--     a1 := public.saldo_de(U1);
--     select count(*) into n1 from public.movimientos m
--      where m.jugador_id = U1 and m.tipo = 'garantia_pvp' and m.monto = -1500 and m.ref_tipo = 'sala' and m.ref_id = s.id::text;
--     f := f || pg_temp.d2_fila(101, 'B1a · crear mesa corta de 100 cobra 1.500', a1 = CIEN - 1500 and n1 = 1, format('U1 %s → %s · líneas=%s', CIEN, a1, n1));
--
--     perform pg_temp.d2_yo(U2);
--     r := public.crear_sala('privada', 2::smallint, 100, 'llena');
--     a1 := public.saldo_de(U2);
--     f := f || pg_temp.d2_fila(102, 'B1b · crear mesa llena de 100 cobra 5.000', a1 = CIEN - 5000 and r.entrada = 'llena', format('U2 %s → %s', CIEN, a1));
--     perform public.salir_sala(r.id);
--
--     perform pg_temp.d2_yo(U7);
--     begin
--       perform public.unirse_sala(null, s.id);
--       t1 := 'entró';
--     exception when others then t1 := sqlerrm;
--     end;
--     begin
--       perform public.crear_sala('privada', 2::smallint, 100);
--       t2 := 'entró';
--     exception when others then t2 := sqlerrm;
--     end;
--     a1 := public.saldo_de(U7);
--     select count(*) into n1 from public.sala_jugadores where jugador_id = U7;
--     select count(*) into n2 from public.movimientos where jugador_id = U7 and tipo = 'garantia_pvp';
--     f := f || pg_temp.d2_fila(103, 'B1c · con 1.499 no se sienta en ninguna y no se le cobra',
--                               t1 = 'saldo_insuficiente' and t2 = 'saldo_insuficiente' and a1 = 1499 and n1 = 0 and n2 = 0,
--                               format('unirse=%s · crear=%s · U7 1499 → %s · sillas=%s · líneas=%s', t1, t2, a1, n1, n2));
--
--     perform pg_temp.d2_yo(U6);
--     perform public.unirse_sala(null, s.id);
--     a1 := public.saldo_de(U6);
--     f := f || pg_temp.d2_fila(104, 'B1d · con 1.500 justos se une, y queda en 0', a1 = 0 and public.es_miembro(s.id, U6), format('U6 1500 → %s', a1));
--
--     -- ── 2 · Salir devuelve ─────────────────────────────────────────────────────
--     perform public.salir_sala(s.id);
--     a1 := public.saldo_de(U6);
--     f := f || pg_temp.d2_fila(201, 'B2a · el invitado sale y se le devuelve', a1 = 1500 and not public.es_miembro(s.id, U6), format('U6 0 → %s', a1));
--
--     perform public.unirse_sala(null, s.id);
--     a0 := public.saldo_de(U6);
--     perform public.salir_sala(s.id);
--     a1 := public.saldo_de(U6);
--     n1 := pg_temp.d2_lineas(s.id, U6);
--     f := f || pg_temp.d2_fila(202, 'B2b · volver a la misma mesa paga otra vez y se devuelve otra vez',
--                               a0 = 0 and a1 = 1500 and n1 = 4 and public.neto_jugador_mesa(s.id, U6) = 0,
--                               format('U6 sentado=%s · de pie=%s · líneas=%s', a0, a1, n1));
--
--     perform pg_temp.d2_yo(U4);
--     perform public.unirse_sala(null, s.id);
--     b0 := public.saldo_de(U4);
--     perform pg_temp.d2_yo(U1);
--     perform public.salir_sala(s.id);
--     a1 := public.saldo_de(U1);
--     b1 := public.saldo_de(U4);
--     select estado::text into t1 from public.salas where id = s.id;
--     f := f || pg_temp.d2_fila(203, 'B2c · el anfitrión cancela y devuelve a todos',
--                               t1 = 'cancelada' and a1 = CIEN and b0 = CIEN - 1500 and b1 = CIEN and public.neto_mesa(s.id) = 0,
--                               format('%s · U1 %s → %s · U4 %s → %s · neto=%s', t1, CIEN - 1500, a1, b0, b1, public.neto_mesa(s.id)));
--
--     -- ── 4 · Repetir una devolución no paga dos veces ───────────────────────────
--     a0 := public.saldo_de(U6);
--     n1 := public.devolver_entrada(s.id, U6);
--     mv := public.aplicar_movimiento(U6, 'liberacion_pvp', 1500,
--                                     'liberacion_pvp:' || s.id::text || ':' || U6::text || ':devolucion:2', 'sala', s.id::text, null);
--     perform pg_temp.d2_yo(U6);
--     perform public.salir_sala(s.id);
--     a1 := public.saldo_de(U6);
--     f := f || pg_temp.d2_fila(401, 'B4 · salir otra vez, devolver otra vez o repetir la clave: nada',
--                               a1 = a0 and n1 = 0 and mv.motivo = 'repetido',
--                               format('U6 %s → %s · devolver=%s · clave=%s', a0, a1, n1, mv.motivo));
--
--     -- ── 3 · El barrido y resolver_sala devuelven ───────────────────────────────
--     perform pg_temp.d2_yo(U1);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     a0 := public.saldo_de(U1);
--     update public.salas set expira_en = now() - interval '1 second' where id = s.id;
--     perform public.barrer_salas();
--     a1 := public.saldo_de(U1);
--     select estado::text into t1 from public.salas where id = s.id;
--     f := f || pg_temp.d2_fila(301, 'B3a · espera vencida con uno: cancelada y devuelta', t1 = 'cancelada' and a0 = CIEN - 1500 and a1 = CIEN, format('%s · U1 %s → %s', t1, a0, a1));
--
--     m1 := pg_temp.d2_mesa(array[U1, U2]);
--     a0 := public.saldo_de(U1);
--     update public.salas set iniciada_en = now() - interval '11 minutes' where id = m1;
--     perform public.barrer_salas();
--     a1 := public.saldo_de(U1);
--     b1 := public.saldo_de(U2);
--     select estado::text into t1 from public.salas where id = m1;
--     f := f || pg_temp.d2_fila(302, 'B3b · activa sin partida, vieja: cancelada y devuelta a todos', t1 = 'cancelada' and a1 = CIEN and b1 = CIEN, format('%s · U1 %s → %s · U2 → %s', t1, a0, a1, b1));
--
--     perform pg_temp.d2_yo(U1);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     a0 := public.saldo_de(U1);
--     update public.salas set expira_en = now() - interval '1 second' where id = s.id;
--     r := public.resolver_sala(s.id);
--     a1 := public.saldo_de(U1);
--     f := f || pg_temp.d2_fila(303, 'B3c · resolver_sala con menos de dos: cancelada y devuelta', r.estado = 'cancelada' and a1 = CIEN, format('%s · U1 %s → %s', r.estado, a0, a1));
--
--     perform pg_temp.d2_yo(U1);
--     s := public.crear_sala('privada', 3::smallint, 100);
--     perform pg_temp.d2_yo(U2);
--     perform public.unirse_sala(null, s.id);
--     update public.salas set expira_en = now() - interval '1 second' where id = s.id;
--     perform public.barrer_salas();
--     a0 := public.saldo_de(U1);
--     b0 := public.saldo_de(U2);
--     select estado::text into t1 from public.salas where id = s.id;
--     perform public.salir_sala(s.id);
--     b1 := public.saldo_de(U2);
--     f := f || pg_temp.d2_fila(304, 'B3d · vencida con dos arranca sin devolver; el invitado que sale de la activa sin partida recupera lo suyo',
--                               t1 = 'activa' and a0 = CIEN - 1500 and b0 = CIEN - 1500 and b1 = CIEN,
--                               format('%s · U1=%s · U2 %s → %s', t1, a0, b0, b1));
--     update public.salas set iniciada_en = now() - interval '11 minutes' where id = s.id;
--     perform public.barrer_salas();
--
--     -- ── 5 · crear_partida inicia las pilas ─────────────────────────────────────
--     m1 := pg_temp.d2_mesa(array[U1, U2, U3]);
--     j := pg_temp.d2_partida(m1);
--     t1 := pg_temp.d2_pilas(m1);
--     n1 := public.neto_mesa(m1);
--     f := f || pg_temp.d2_fila(501, 'B5a · crear_partida: cada asiento con su entrada', j ->> 'creada' = 'true' and t1 = '1500,1500,1500' and n1 = -4500, format('pilas=%s · neto=%s', t1, n1));
--
--     j := pg_temp.d2_partida(m1);
--     select count(*) into n1 from public.partida_asientos where sala_id = m1;
--     f := f || pg_temp.d2_fila(502, 'B5b · la segunda llamada no toca nada', j ->> 'creada' = 'false' and n1 = 3 and pg_temp.d2_pilas(m1) = '1500,1500,1500', format('creada=%s · asientos=%s', j ->> 'creada', n1));
--
--     a0 := public.saldo_de(U2);
--     b0 := public.saldo_de(U1);
--     perform pg_temp.d2_yo(U2);
--     perform public.salir_sala(m1);
--     perform pg_temp.d2_yo(U1);
--     perform public.salir_sala(m1);
--     perform pg_temp.d2_yo(null);
--     select count(*) into n1 from public.sala_jugadores where sala_id = m1;
--     select estado::text into t1 from public.salas where id = m1;
--     f := f || pg_temp.d2_fila(505, 'B5e · con partida viva, salir_sala no levanta a nadie ni mueve dinero', n1 = 3 and t1 = 'activa' and public.saldo_de(U2) = a0 and public.saldo_de(U1) = b0, format('sillas=%s · %s · U2 %s → %s · U1 %s → %s', n1, t1, a0, public.saldo_de(U2), b0, public.saldo_de(U1)));
--
--     m2 := pg_temp.d2_mesa(array[U4, U5]);
--     insert into public.sala_jugadores (sala_id, jugador_id, asiento) values (m2, U9, 2);
--     begin
--       j := pg_temp.d2_partida(m2);
--       t1 := 'la creó';
--     exception when others then t1 := sqlerrm;
--     end;
--     select count(*) into n1 from public.partidas where sala_id = m2;
--     f := f || pg_temp.d2_fila(503, 'B5c · un asiento sin garantía: estado_incoherente y sin partida', t1 = 'estado_incoherente' and n1 = 0, format('%s · partidas=%s', t1, n1));
--     delete from public.sala_jugadores where sala_id = m2 and jugador_id = U9;
--
--     perform pg_temp.d2_yo(U5);
--     perform public.salir_sala(m2);
--     perform pg_temp.d2_yo(null);
--     j := pg_temp.d2_partida(m2);
--     f := f || pg_temp.d2_fila(504, 'B5d · con un solo asiento no se crea', j ->> 'motivo' = 'sala_no_activa', j::text);
--     update public.salas set iniciada_en = now() - interval '11 minutes' where id = m2;
--     perform public.barrer_salas();
--
--     -- ── 6 · mano_cerrada guarda las pilas ──────────────────────────────────────
--     a0 := public.saldo_de(U1);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":3,"ajilei":0,"pilas":[2000,1500,1000]}]');
--     t1 := pg_temp.d2_pilas(m1);
--     a1 := public.saldo_de(U1);
--     f := f || pg_temp.d2_fila(601, 'B6a · guarda las pilas y no mueve dinero', j ->> 'ok' = 'true' and t1 = '2000,1500,1000' and a1 = a0, format('pilas=%s · U1 %s → %s', t1, a0, a1));
--
--     j := public.guardar_jugada(m1, 0, '{"version":1}', null, pg_temp.d2_vistas(3, 1), false,
--                                '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":3,"ajilei":0,"pilas":[1,1,4498]},{"tipo":"salida","asiento":0,"monto":1}]');
--     t1 := pg_temp.d2_pilas(m1);
--     f := f || pg_temp.d2_fila(602, 'B6b · con versión vieja no hace nada', j ->> 'motivo' = 'version_vieja' and t1 = '2000,1500,1000' and public.saldo_de(U1) = a0, format('%s · pilas=%s', j::text, t1));
--
--     begin
--       j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":3,"ajilei":0,"pilas":[9000,1500,1000]}]');
--       t1 := 'la guardó';
--     exception when others then t1 := sqlerrm;
--     end;
--     select version into n1 from public.partidas where sala_id = m1;
--     f := f || pg_temp.d2_fila(603, 'B6c · unas pilas que crean fichas se deshacen enteras', t1 = 'estado_incoherente' and n1 = 1 and pg_temp.d2_pilas(m1) = '2000,1500,1000', format('%s · versión=%s · pilas=%s', t1, n1, pg_temp.d2_pilas(m1)));
--
--     -- ── 7 · salida paga, marca cobrado y pone la pila en 0 ─────────────────────
--     a0 := public.saldo_de(U3);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":2,"ganador":0,"sentados":3,"ajilei":0,"pilas":[2000,1500,0]},{"tipo":"salida","asiento":2,"monto":1000}]');
--     a1 := public.saldo_de(U3);
--     select cobrado and pila = 0 and liberado = 1000 into strict t2 from public.partida_asientos where sala_id = m1 and asiento = 2;
--     f := f || pg_temp.d2_fila(701, 'B7a · salida paga, marca cobrado y pone la pila en 0', j ->> 'ok' = 'true' and a1 = a0 + 1000 and t2 = 'true', format('U3 %s → %s · pilas=%s', a0, a1, pg_temp.d2_pilas(m1)));
--
--     n1 := pg_temp.d2_lineas(m1, U3);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"salida","asiento":2,"monto":1000}]');
--     f := f || pg_temp.d2_fila(702, 'B7b · una segunda salida igual no paga', j ->> 'ok' = 'true' and public.saldo_de(U3) = a1 and pg_temp.d2_lineas(m1, U3) = n1, format('U3 %s → %s · líneas=%s', a1, public.saldo_de(U3), pg_temp.d2_lineas(m1, U3)));
--
--     a0 := public.saldo_de(U2);
--     n1 := pg_temp.d2_lineas(m1, U2);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":3,"ganador":0,"sentados":3,"ajilei":0,"pilas":[3500,0,0]},{"tipo":"salida","asiento":1,"monto":0}]');
--     select cobrado into strict t2 from public.partida_asientos where sala_id = m1 and asiento = 1;
--     f := f || pg_temp.d2_fila(703, 'B7c · salida con monto 0: marca cobrado sin movimiento', j ->> 'ok' = 'true' and t2 = 'true' and public.saldo_de(U2) = a0 and pg_temp.d2_lineas(m1, U2) = n1, format('U2 %s → %s · cobrado=%s · líneas=%s', a0, public.saldo_de(U2), t2, pg_temp.d2_lineas(m1, U2)));
--
--     a0 := public.saldo_de(U1);
--     begin
--       j := pg_temp.d2_jugada(m1, '[{"tipo":"salida","asiento":0,"monto":9999}]');
--       t1 := 'pagó';
--     exception when others then t1 := sqlerrm;
--     end;
--     f := f || pg_temp.d2_fila(704, 'B7d · una salida mayor que la pila se deshace entera', t1 = 'estado_incoherente' and public.saldo_de(U1) = a0 and pg_temp.d2_pilas(m1) = '3500,0,0', format('%s · U1 %s → %s', t1, a0, public.saldo_de(U1)));
--
--     begin
--       j := pg_temp.d2_jugada(m1, '[{"tipo":"inventado"}]');
--       t1 := 'lo ignoró';
--     exception when others then t1 := sqlerrm;
--     end;
--     f := f || pg_temp.d2_fila(705, 'B7e · un efecto que no se entiende no se ignora', t1 = 'estado_incoherente', t1);
--
--     -- ── 8 · partida_terminada ──────────────────────────────────────────────────
--     select version into n1 from public.partidas where sala_id = m1;
--     begin
--       j := pg_temp.d2_jugada(m1, '[{"tipo":"partida_terminada","ganador":0}]', true);
--       t1 := 'cerró';
--     exception when others then t1 := sqlerrm;
--     end;
--     select estado::text into t2 from public.salas where id = m1;
--     select version into n2 from public.partidas where sala_id = m1;
--     f := f || pg_temp.d2_fila(801, 'B8a · con un asiento sin cobrar se deshace entera', t1 = 'estado_incoherente' and t2 = 'activa' and n2 = n1 and public.saldo_de(U1) = a0, format('%s · sala=%s · versión %s → %s · U1=%s', t1, t2, n1, n2, public.saldo_de(U1)));
--
--     begin
--       j := pg_temp.d2_jugada(m1, '[{"tipo":"salida","asiento":0,"monto":3500},{"tipo":"partida_terminada","ganador":0}]', false);
--       t1 := 'cerró';
--     exception when others then t1 := sqlerrm;
--     end;
--     f := f || pg_temp.d2_fila(802, 'B8b · el efecto y p_terminada tienen que decir lo mismo', t1 = 'estado_incoherente', t1);
--
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"salida","asiento":0,"monto":3500},{"tipo":"partida_terminada","ganador":0}]', true);
--     a1 := public.saldo_de(U1);
--     select estado::text into t2 from public.salas where id = m1;
--     n1 := public.neto_mesa(m1);
--     f := f || pg_temp.d2_fila(803, 'B8c · con todo cobrado cierra con neto 0', j ->> 'ok' = 'true' and t2 = 'terminada' and n1 = 0 and a1 = a0 + 3500, format('sala=%s · neto=%s · U1 %s → %s · U2=%s · U3=%s', t2, n1, a0, a1, public.saldo_de(U2), public.saldo_de(U3)));
--
--     -- ── 9 · La partida muerta ──────────────────────────────────────────────────
--     perform pg_temp.d2_saldo(u, CIEN) from unnest(array[U1, U2, U3, U4, U5]) u;
--     m1 := pg_temp.d2_mesa(array[U1, U2, U3]);
--     j := pg_temp.d2_partida(m1);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":3,"ajilei":0,"pilas":[2500,1500,0]},{"tipo":"salida","asiento":2,"monto":500}]');
--     a0 := public.saldo_de(U1); b0 := public.saldo_de(U2); c0 := public.saldo_de(U3);
--     update public.partidas set actualizada_en = now() - interval '16 minutes' where sala_id = m1;
--     perform public.barrer_salas();
--     a1 := public.saldo_de(U1); b1 := public.saldo_de(U2); c1 := public.saldo_de(U3);
--     select estado::text into t1 from public.salas where id = m1;
--     n1 := public.neto_mesa(m1);
--     f := f || pg_temp.d2_fila(901, 'B9a · paga las pilas guardadas solo a los no cobrados y cierra con neto 0',
--                               t1 = 'terminada' and n1 = 0 and a1 = a0 + 2500 and b1 = b0 + 1500 and c1 = c0,
--                               format('%s · neto=%s · U1 %s → %s · U2 %s → %s · U3 %s → %s', t1, n1, a0, a1, b0, b1, c0, c1));
--
--     perform pg_temp.d2_saldo(u, CIEN) from unnest(array[U1, U2, U3, U4, U5]) u;
--     m2 := pg_temp.d2_mesa(array[U4, U5]);
--     j := pg_temp.d2_partida(m2);
--     a0 := public.saldo_de(U4);
--     update public.partidas set actualizada_en = now() - interval '14 minutes' where sala_id = m2;
--     perform public.barrer_salas();
--     select s2.estado::text, p.terminada_en is null into t1, t2 from public.salas s2 join public.partidas p on p.sala_id = s2.id where s2.id = m2;
--     f := f || pg_temp.d2_fila(902, 'B9b · con versión reciente no se toca', t1 = 'activa' and t2 = 'true' and public.saldo_de(U4) = a0, format('%s · viva=%s · U4 %s → %s', t1, t2, a0, public.saldo_de(U4)));
--
--     m3 := pg_temp.d2_mesa(array[U1, U2]);
--     j := pg_temp.d2_partida(m3);
--     m4 := pg_temp.d2_mesa(array[U3, U5]);
--     j := pg_temp.d2_partida(m4);
--     update public.partida_asientos set pila = 99999 where sala_id = m3 and asiento = 0;
--     update public.partidas set actualizada_en = now() - interval '16 minutes' where sala_id in (m3, m4);
--     a0 := public.saldo_de(U1); c0 := public.saldo_de(U3);
--     perform public.barrer_salas();
--     select p.terminada_en is null into t1 from public.partidas p where p.sala_id = m3;
--     select p.terminada_en is null into t2 from public.partidas p where p.sala_id = m4;
--     f := f || pg_temp.d2_fila(903, 'B9c · la que no cuadra no paga, sigue viva y no para a la otra',
--                               t1 = 'true' and t2 = 'false' and public.saldo_de(U1) = a0 and public.saldo_de(U3) = c0 + 1500,
--                               format('no cuadra viva=%s · otra viva=%s · U1 %s → %s · U3 %s → %s', t1, t2, a0, public.saldo_de(U1), c0, public.saldo_de(U3)));
--     update public.partida_asientos set pila = 1500 where sala_id = m3 and asiento = 0;
--
--     -- ── 10 · Puntos ────────────────────────────────────────────────────────────
--     perform pg_temp.d2_saldo(u, CIEN) from unnest(array[U1, U2]) u;
--     m1 := pg_temp.d2_mesa(array[U1, U2]);
--     j := pg_temp.d2_partida(m1);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":1,"ganador":0,"sentados":2,"ajilei":0,"pilas":[2000,1000]}]');
--     select count(*) into n1 from public.libro_puntos where mesa_id = m1;
--     f := f || pg_temp.d2_fila(1001, 'B10a · con el interruptor apagado no se anota nada', n1 = 0 and j ->> 'ok' = 'true', format('líneas=%s', n1));
--
--     t1 := public.interruptor_puntos_humanos(true);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":2,"ganador":1,"sentados":2,"ajilei":51,"pilas":[1500,1500]}]');
--     select count(*) into n1 from public.libro_puntos l
--      where l.mesa_id = m1 and l.mano = 2 and l.jugador_id = U2 and l.origen = 'humanos' and l.nivel is null
--        and l.sentados = 2 and l.puntos_base = 5 and l.ajilei = 51 and l.extra = 1;
--     f := f || pg_temp.d2_fila(1002, 'B10b · encendido anota una fila: humanos, sin nivel, sentados + 3 y el extra', t1 = 'encendido' and n1 = 1, format('%s · filas que casan=%s', t1, n1));
--
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":2,"ganador":1,"sentados":2,"ajilei":51,"pilas":[1500,1500]}]');
--     select count(*) into n1 from public.libro_puntos where mesa_id = m1;
--     f := f || pg_temp.d2_fila(1003, 'B10c · la misma mano no se duplica', n1 = 1 and j ->> 'ok' = 'true', format('líneas=%s', n1));
--
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":3,"ganador":0,"sentados":2,"ajilei":52,"pilas":[1500,1500]}]');
--     select count(*) into n1 from public.libro_puntos where mesa_id = m1;
--     f := f || pg_temp.d2_fila(1004, 'B10d · unos puntos imposibles no paran la jugada ni se anotan', n1 = 1 and j ->> 'ok' = 'true', format('jugada=%s · líneas=%s', j ->> 'ok', n1));
--
--     t1 := public.interruptor_puntos_humanos(false);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":4,"ganador":0,"sentados":2,"ajilei":0,"pilas":[1500,1500]}]');
--     select count(*) into n1 from public.libro_puntos where mesa_id = m1;
--     select count(*) into n2 from public.interruptor_cambios where interruptor = 'puntos_humanos' and en = now();
--     f := f || pg_temp.d2_fila(1005, 'B10e · apagado otra vez: nada, y el rastro tiene los dos cambios', t1 = 'apagado' and n1 = 1 and n2 = 2 and not public.puntos_humanos_encendidos(), format('%s · líneas=%s · rastro=%s', t1, n1, n2));
--
--     -- ── 11 · Una partida por cuenta ────────────────────────────────────────────
--     perform pg_temp.d2_saldo(u, CIEN) from unnest(array[U1, U4, U5]) u;
--     perform pg_temp.d2_saldo(U6, 1500);
--     delete from public.intentos_dinero where jugador_id = any (array[U1, U4, U5, U6]);
--     perform pg_temp.d2_yo(U1);
--     s := public.crear_sala('privada', 3::smallint, 100);
--     begin
--       perform public.crear_sala('privada', 2::smallint, 200);
--       t1 := 'entró';
--     exception when others then t1 := sqlerrm;
--     end;
--     perform pg_temp.d2_yo(U5);
--     r := public.crear_sala('privada', 2::smallint, 100);
--     perform pg_temp.d2_yo(U1);
--     begin
--       perform public.unirse_sala(null, r.id);
--       t2 := 'entró';
--     exception when others then t2 := sqlerrm;
--     end;
--     a1 := public.saldo_de(U1);
--     f := f || pg_temp.d2_fila(1101, 'B11a · en espera, crear o unirse a otra: ya_en_sala', t1 = 'ya_en_sala' and t2 = 'ya_en_sala' and a1 = CIEN - 1500, format('crear=%s · unirse=%s · U1=%s', t1, t2, a1));
--     perform pg_temp.d2_yo(U5);
--     perform public.salir_sala(r.id);
--
--     -- El invitado, con todo su saldo dentro de la sala: lo devuelto cuenta para la entrada.
--     perform pg_temp.d2_yo(U6);
--     perform public.unirse_sala(null, s.id);
--     a0 := public.saldo_de(U6);
--     ia := public.sentarse_ia('basico', 2, 50, 1000, gen_random_uuid());
--     a1 := public.saldo_de(U6);
--     f := f || pg_temp.d2_fila(1102, 'B11b · invitado en espera se sienta contra las IAS: sale, y la entrada vuelve',
--                               ia.codigo = 'ok' and a0 = 0 and a1 = 500 and not public.es_miembro(s.id, U6) and public.neto_jugador_mesa(s.id, U6) = 0,
--                               format('%s · U6 %s → %s · sigue sentado=%s', ia.codigo, a0, a1, public.es_miembro(s.id, U6)));
--
--     perform pg_temp.d2_yo(U4);
--     perform public.unirse_sala(null, s.id);
--     b0 := public.saldo_de(U4);
--     perform pg_temp.d2_yo(U1);
--     a0 := public.saldo_de(U1);
--     ia := public.sentarse_ia('basico', 2, 50, 1000, gen_random_uuid(), 'mot1dii');
--     a1 := public.saldo_de(U1);
--     b1 := public.saldo_de(U4);
--     select estado::text into t1 from public.salas where id = s.id;
--     f := f || pg_temp.d2_fila(1103, 'B11c · anfitrión en espera se sienta contra las IAS: la mesa se cancela y todos recuperan',
--                               ia.codigo = 'ok' and t1 = 'cancelada' and a1 = a0 + 1500 - 1000 and b1 = b0 + 1500,
--                               format('%s · %s · U1 %s → %s · U4 %s → %s', ia.codigo, t1, a0, a1, b0, b1));
--
--     -- U1 tiene ahora una mesa contra las IAS abierta, con 1.000 de pila.
--     a0 := public.saldo_de(U1);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     a1 := public.saldo_de(U1);
--     select m.estado::text, m.motivo_cierre, m.cobrado into t1, t2, n1 from public.mesas_ia m where m.id = ia.mesa_id;
--     f := f || pg_temp.d2_fila(1104, 'B11d · con mesa de IAS abierta se sienta en PvP: se cierra y cobra su pila',
--                               t1 = 'cerrada' and t2 = 'reemplazada' and n1 = 1000 and a1 = a0 + 1000 - 1500,
--                               format('%s · %s · cobró=%s · U1 %s → %s', t1, t2, n1, a0, a1));
--     perform public.salir_sala(s.id);
--
--     -- U6 tiene 500 en el saldo y 1.000 en su mesa contra las IAS: la entrada de 1.500 alcanza.
--     perform pg_temp.d2_yo(U6);
--     a0 := public.saldo_de(U6);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     a1 := public.saldo_de(U6);
--     f := f || pg_temp.d2_fila(1110, 'B11j · lo que devuelve la mesa de IAS cuenta para la entrada', a0 = 500 and a1 = 0, format('U6 %s → %s', a0, a1));
--     perform public.salir_sala(s.id);
--
--     perform pg_temp.d2_saldo(u, CIEN) from unnest(array[U1, U2, U3, U4, U5]) u;
--     m1 := pg_temp.d2_mesa(array[U2, U3]);
--     j := pg_temp.d2_partida(m1);
--     perform pg_temp.d2_yo(U2);
--     r := public.mi_sala();
--     t3 := case when r.id = m1 then 'la suya' else 'otra' end;
--     a0 := public.saldo_de(U2);
--     ia := public.sentarse_ia('basico', 2, 50, 1000, gen_random_uuid(), 'mot1dii');
--     a1 := public.saldo_de(U2);
--     select a.abandono_pedido into t1 from public.partida_asientos a where a.sala_id = m1 and a.uid = U2;
--     select a.abandono_pedido into t2 from public.partida_asientos a where a.sala_id = m1 and a.uid = U3;
--     select version into n1 from public.partidas where sala_id = m1;
--     select l.abandonos::text into t3 from public.leer_partida(m1) l;
--     f := f || pg_temp.d2_fila(1105, 'B11e · con asiento sin cobrar abre mesa de IAS: abandono pedido, sin tocar el estado ni el dinero de esa mesa',
--                               ia.codigo = 'ok' and t1 = 'true' and t2 = 'false' and n1 = 0 and a1 = a0 - 1000 and t3 = '{0}' and pg_temp.d2_pilas(m1) = '1500,1500',
--                               format('U2=%s · U3=%s · versión=%s · abandonos=%s · U2 %s → %s · pilas=%s', t1, t2, n1, t3, a0, a1, pg_temp.d2_pilas(m1)));
--
--     r := public.mi_sala();
--     perform pg_temp.d2_yo(U3);
--     s := public.mi_sala();
--     f := f || pg_temp.d2_fila(1106, 'B11f · mi_sala ya no le devuelve esa mesa; al otro, sí', r.id is null and s.id = m1, format('U2=%s · U3 la suya=%s', coalesce(r.id::text, 'ninguna'), s.id = m1));
--
--     s := public.crear_sala('privada', 2::smallint, 100);
--     select a.abandono_pedido into t1 from public.partida_asientos a where a.sala_id = m1 and a.uid = U3;
--     select l.abandonos::text into t3 from public.leer_partida(m1) l;
--     f := f || pg_temp.d2_fila(1107, 'B11g · también al abrir otra mesa PvP', t1 = 'true' and t3 = '{0,1}', format('U3=%s · abandonos=%s', t1, t3));
--     perform public.salir_sala(s.id);
--
--     -- Quien ya cobró no se marca, y recoger_mesa_ia no toca la partida.
--     m2 := pg_temp.d2_mesa(array[U4, U5]);
--     j := pg_temp.d2_partida(m2);
--     j := pg_temp.d2_jugada(m2, '[{"tipo":"salida","asiento":1,"monto":1500}]');
--     perform pg_temp.d2_yo(U5);
--     ia := public.sentarse_ia('basico', 2, 50, 1000, gen_random_uuid());
--     select a.abandono_pedido into t1 from public.partida_asientos a where a.sala_id = m2 and a.asiento = 1;
--     f := f || pg_temp.d2_fila(1108, 'B11h · un asiento ya cobrado no se marca', t1 = 'false' and ia.codigo = 'ok', format('%s · marcado=%s', ia.codigo, t1));
--
--     update public.partida_asientos set abandono_pedido = false where sala_id = m1 and uid = U2;
--     perform pg_temp.d2_yo(U2);
--     ia := public.recoger_mesa_ia('mot1dii');
--     select a.abandono_pedido into t1 from public.partida_asientos a where a.sala_id = m1 and a.uid = U2;
--     f := f || pg_temp.d2_fila(1109, 'B11i · recoger_mesa_ia cierra la de IAS y no toca la partida', ia.codigo = 'recogida' and t1 = 'false', format('%s · marcado=%s', ia.codigo, t1));
--
--     -- ── 12 · Borrar la cuenta ──────────────────────────────────────────────────
--     m1 := pg_temp.d2_mesa(array[U8, U9, U10]);
--     j := pg_temp.d2_partida(m1);
--     t1 := public.partida_abierta_de(U9);
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"mano_cerrada","mano":1,"ganador":1,"sentados":3,"ajilei":0,"pilas":[1500,0,1000]},{"tipo":"salida","asiento":1,"monto":2000}]');
--     t2 := public.partida_abierta_de(U9);
--     f := f || pg_temp.d2_fila(1201, 'B12a · con asiento sin cobrar se rechaza; tras cobrar se permite', t1 = 'sala' and t2 is null, format('sin cobrar=%s · cobrado=%s', coalesce(t1, 'null'), coalesce(t2, 'null')));
--
--     delete from auth.users where id = U9;
--     select count(*) into n1 from public.partida_asientos where sala_id = m1 and uid is null and cobrado and liberado = 2000;
--     select count(*) into n2 from public.partida_vistas where sala_id = m1;
--     j := pg_temp.d2_jugada(m1, '[]');
--     f := f || pg_temp.d2_fila(1202, 'B12b · borrada: su asiento queda, su vista se va y la partida de los demás sigue', n1 = 1 and n2 = 2 and j ->> 'ok' = 'true', format('asiento sin cuenta=%s · vistas=%s · jugada=%s', n1, n2, j ->> 'ok'));
--
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"salida","asiento":0,"monto":1500}]');
--     t1 := public.partida_abierta_de(U8);
--     t2 := public.partida_abierta_de(U10);
--     f := f || pg_temp.d2_fila(1203, 'B12c · el anfitrión cobrado sigue bloqueado mientras la partida viva', t1 = 'sala' and t2 = 'sala', format('anfitrión=%s · el otro=%s', coalesce(t1, 'null'), coalesce(t2, 'null')));
--
--     j := pg_temp.d2_jugada(m1, '[{"tipo":"salida","asiento":2,"monto":1000},{"tipo":"partida_terminada","ganador":2}]', true);
--     n1 := public.neto_mesa(m1);
--     t1 := public.partida_abierta_de(U8);
--     f := f || pg_temp.d2_fila(1204, 'B12d · termina con neto 0 aunque el libro de una cuenta se fue, y el anfitrión queda libre', j ->> 'ok' = 'true' and n1 = 0 and t1 is null, format('jugada=%s · neto=%s · anfitrión=%s', j ->> 'ok', n1, coalesce(t1, 'null')));
--
--     -- ── 13 · El tope ───────────────────────────────────────────────────────────
--     perform pg_temp.d2_saldo(U4, CIEN);
--     delete from public.intentos_dinero where jugador_id = U4;
--     perform pg_temp.d2_yo(U4);
--     for i in 1 .. 10 loop
--       s := public.crear_sala('privada', 2::smallint, 100);
--       perform public.salir_sala(s.id);
--     end loop;
--     a0 := public.saldo_de(U4);
--     begin
--       perform public.crear_sala('privada', 2::smallint, 100);
--       t1 := 'entró';
--     exception when others then t1 := sqlerrm;
--     end;
--     a1 := public.saldo_de(U4);
--     f := f || pg_temp.d2_fila(1301, 'B13 · la 11.ª sentada del minuto rebota sin cobrar, y las 10 salidas nunca rebotaron', t1 = 'demasiados_intentos' and a0 = CIEN and a1 = CIEN, format('%s · U4 %s → %s', t1, a0, a1));
--
--     -- Todo lo fabricado se va aquí, también la huella de los correos en
--     -- `bonos_bienvenida`, que un `delete from auth.users` dejaría (cfg1c:20).
--     perform set_config('request.jwt.claims', '', true);
--     raise exception 'mot1dii_deshacer';
--   exception when others then
--     if sqlerrm <> 'mot1dii_deshacer' then
--       f := f || pg_temp.d2_fila(9999, 'X · el guion se detuvo', false, sqlstate || ' · ' || sqlerrm);
--     end if;
--   end;
--
--   return query
--     select (e ->> 'o')::integer, e ->> 'c', e ->> 'r', e ->> 'd'
--       from jsonb_array_elements(f) e;
-- end
-- $fn$;
--
-- select comprobacion as "comprobación", resultado, detalle
--   from pg_temp.mot1dii_b()
--  order by orden;
-- ── FIN DEL GRUPO B ────────────────────────────────────────────────────────
--
-- CORRIDA REAL · pendiente. Los resultados van al informe de la fase, no aquí.
-- ═══════════════════════════════════════════════════════════════════════════
