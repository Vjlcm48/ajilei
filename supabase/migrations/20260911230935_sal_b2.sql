-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · SAL-B2 · Fase 1a — Mesa llena: cuenta atrás corta, restitución y listado sin llenas
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_SAL-B2_Fase1a_v1.0.md §3, sobre los hechos de
-- docs/reportes/AJILEI_SAL-B2_Fase0_Informe_v1.0.md §2.4, §2.7 y §7.4.
-- Corrige tres funciones; no toca tablas, tipos, índices, políticas ni la
-- publicación de Realtime (todo eso ya está: informe §2.6).
--
-- Se aplica con `npx supabase db push`, en la transacción implícita de la CLI.
-- NINGUNA función cambia de nombre ni de firma: se reemplazan cuerpos con
-- `create or replace`, que CONSERVA los grants de SAL-A §15 (como declara A1:8-11).
-- No hay función nueva.
--
-- ── LO QUE LA LÁMINA v1.5 PIDE Y LA BASE NO TENÍA ──────────────────────────
--
-- 1. MESA LLENA → ARRANQUE SOLO. Cuando se ocupa la última silla, esperar los
--    tres minutos enteros es hacer esperar a cinco personas que ya están. La
--    cuenta se acorta a diez segundos —tiempo para que el último en llegar vea
--    la mesa antes de que reparta— y el arranque lo hace quien ya lo hacía:
--    `barrer_salas` / `resolver_sala` cuando `expira_en <= now()` con ≥ 2. NO
--    se crea ninguna función de «arrancar por llena».
--
-- 2. SI ALGUIEN SE LEVANTA, EL RELOJ VUELVE. Una mesa que dejó de estar llena
--    recupera su plazo original (`creada_en + 3 minutes`, el default de
--    SAL-A:97): la cuenta corta era una promesa de «ya estamos todos», y sin
--    todos no vale.
--
-- 3. UNA MESA LLENA NO SE LISTA. `salas_abiertas()` enseñaba una 5/5 durante
--    su cuenta corta; «Unirme» rebotaba con `sala_llena`. Fuera del listado.
--
-- ── LA CIFRA VIVE AQUÍ ─────────────────────────────────────────────────────
-- Doctrina 4 de SAL-A: «el cliente cuenta para ENSEÑAR; el servidor cuenta
-- para DECIDIR». `interval '10 seconds'` se espeja en `LLENA_SEG = 10` de
-- `src/config/salas.js`, igual que los tres minutos se espejan en
-- `DURACION_SALA_SEG`. Si cambia uno, el otro se cambia A MANO.
--
-- ── `crear_sala` NO SE TOCA, Y POR QUÉ (rector §3.4) ──────────────────────
-- Su búsqueda de «abrir se vuelve unirme» (A1:161-166) encuentra la mesa llena
-- que espera su cuenta corta y `unirse_sala` rebota con `sala_llena`. Si dejara
-- de encontrarla, el `insert` chocaría con `salas_abierta_unica_idx` (SAL-A:131)
-- y devolvería `unique_violation`, que el cliente no traduce. `sala_llena` ya
-- tiene texto y es el mejor error posible durante diez segundos.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Sentarse: la última silla acorta el reloj ──────────────────────────
-- Cuerpo de A3 (20260911103000_sal_b1_ajuste_a3.sql:25-135) copiado VERBATIM,
-- comentarios incluidos, con UN bloque nuevo entre el `insert` del asiento y el
-- `return`, marcado `-- SAL-B2:`. Nada más cambia: ni la validación del código,
-- ni la anotación de intentos, ni el orden «viva antes que miembro» de A3.
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

  if public.saldo_de(v_uid) < public.regla_asiento() * v_sala.apuesta then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  end if;

  select count(*) into v_sentados from public.sala_jugadores where sala_id = v_sala.id;
  if v_sentados >= v_sala.jugadores then
    raise exception 'sala_llena' using errcode = 'P0001';
  end if;

  select min(g) into v_asiento
    from generate_series(0, v_sala.jugadores - 1) as g
   where g not in (select asiento from public.sala_jugadores where sala_id = v_sala.id);

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


-- ── 2 · Levantarse: la silla que se libera devuelve el reloj ───────────────
-- Cuerpo de SAL-A §11 (20260905203158_sal_a_salas.sql:632-657) copiado
-- VERBATIM, con UNA variable nueva y UN bloque nuevo en la rama del invitado.
-- La rama del anfitrión no cambia: cancela y no toca `expira_en`.
--
-- El `select … for update` de la fila de `salas` ya existía: es lo que
-- serializa esta función frente a `unirse_sala`, que bloquea la misma fila. Se
-- mide si la mesa estaba llena ANTES de borrar la silla, porque después ya no
-- lo está por definición.
create or replace function public.salir_sala(p_sala uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid   uuid := auth.uid();
  v_sala  public.salas;
  v_llena boolean;   -- SAL-B2
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = 'P0001';
  end if;

  select * into v_sala from public.salas where id = p_sala for update;
  if not found then
    return;   -- salir de una sala que ya no existe no es un error: ya estás fuera
  end if;

  if v_sala.anfitrion_id = v_uid then
    update public.salas set estado = 'cancelada' where id = p_sala and estado = 'esperando';
  else
    -- SAL-B2: si la mesa estaba llena, la silla que se libera devuelve el reloj a su plazo original.
    v_llena := (select count(*) from public.sala_jugadores where sala_id = p_sala) = v_sala.jugadores;
    delete from public.sala_jugadores where sala_id = p_sala and jugador_id = v_uid;
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


-- ── 3 · El listado: una mesa llena no se lista ─────────────────────────────
-- Cuerpo de SAL-A §13 (:709-731) copiado VERBATIM con UNA condición más en el
-- `where`. Firma y columnas de retorno idénticas.
create or replace function public.salas_abiertas()
returns table (
  id        uuid,
  jugadores smallint,
  apuesta   integer,
  sentados  bigint,
  expira_en timestamptz
)
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform public.barrer_salas();

  return query
    select s.id, s.jugadores, s.apuesta,
           (select count(*) from public.sala_jugadores j where j.sala_id = s.id),
           s.expira_en
      from public.salas s
     where s.tipo = 'abierta' and s.estado = 'esperando'
       and (select count(*) from public.sala_jugadores j where j.sala_id = s.id) < s.jugadores   -- SAL-B2: una mesa llena no se lista
     order by (select count(*) from public.sala_jugadores j where j.sala_id = s.id) desc,
              s.apuesta asc;
end
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor (rector §3.5)
-- Consulta guardada en el panel como «SAL-B2 · verificación».
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en SAL-A, A1 y A3: `db push` aplica el archivo y una prueba
-- dentro sería un efecto que se repite en cada despliegue.
--
-- ── GRUPO A · Las tres definiciones, leídas del catálogo ───────────────────
-- Esperado: una fila, `true, true, true`. Y los grants de SAL-A sobrevivieron
-- al `create or replace`: `true, true, true`.
--
--   select position('interval ''10 seconds''' in pg_get_functiondef('public.unirse_sala(text, uuid)'::regprocedure)) > 0 as unirse_corta,
--          position('greatest(expira_en'       in pg_get_functiondef('public.salir_sala(uuid)'::regprocedure))       > 0 as salir_restituye,
--          position('< s.jugadores'            in pg_get_functiondef('public.salas_abiertas()'::regprocedure))       > 0 as abiertas_sin_llenas;
--
--   select has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute') as unirse,
--          has_function_privilege('authenticated', 'public.salir_sala(uuid)',        'execute') as salir,
--          has_function_privilege('authenticated', 'public.salas_abiertas()',        'execute') as abiertas;
--
-- ── GRUPO B · Conducta, con tres jugadores fabricados (se limpia al final) ──
-- Mismo andamio que A1 y A3: `request.jwt.claims` alimenta `auth.uid()`. Se
-- pega ENTERO, de una vez. Diez filas y todas deben decir OK.
--
--   do $b2$
--   declare
--     UNO  uuid := 'b2b2b2b2-0000-4000-8000-000000000001';   -- anfitrión
--     DOS  uuid := 'b2b2b2b2-0000-4000-8000-000000000002';   -- invitado
--     TRES uuid := 'b2b2b2b2-0000-4000-8000-000000000003';   -- el que llega tarde
--     s1   public.salas;
--     s2   public.salas;
--     r    public.salas;
--     got  text;
--     n    integer;
--   begin
--     drop table if exists _b2_res;
--     create temp table _b2_res (orden int, prueba text, esperado text, obtenido text);
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     values (UNO,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'b2_uno@prueba.local',  '', now(), now(), '{}', '{}'),
--            (DOS,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'b2_dos@prueba.local',  '', now(), now(), '{}', '{}'),
--            (TRES, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'b2_tres@prueba.local', '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (UNO, 'SalaB2Uno'), (DOS, 'SalaB2Dos'), (TRES, 'SalaB2Tres');
--
--     -- 1 · el anfitrión abre una ABIERTA de 2 → expira_en ≈ now() + 3 min
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     s1 := public.crear_sala('abierta', 2::smallint, 100);
--     insert into _b2_res values (1, 'nace con 3 minutos', 'true',
--       (s1.expira_en between now() + interval '2 minutes 59 seconds' and now() + interval '3 minutes 1 second')::text);
--
--     -- 2 · el invitado se sienta → mesa llena → expira_en ≤ now() + 10 s, y la
--     --     fila devuelta ya lo trae
--     perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
--     r := public.unirse_sala(null, s1.id);
--     insert into _b2_res values (2, 'llena: la fila devuelta trae la cuenta corta', 'true',
--       (r.expira_en <= now() + interval '10 seconds')::text);
--     insert into _b2_res values (3, 'llena: y la tabla también', 'true',
--       ((select expira_en from public.salas where id = s1.id) <= now() + interval '10 seconds')::text);
--
--     -- 4 · salas_abiertas() no la lista
--     select count(*) into n from public.salas_abiertas() a where a.id = s1.id;
--     insert into _b2_res values (4, 'llena: fuera del listado', '0', n::text);
--
--     -- 5 · un tercero pide la misma combinación → sala_llena, sin mesa nueva (rector §3.4)
--     perform set_config('request.jwt.claims', json_build_object('sub', TRES)::text, true);
--     begin
--       perform public.crear_sala('abierta', 2::smallint, 100);
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _b2_res values (5, 'tercero: sala_llena', 'sala_llena', got);
--     select count(*) into n from public.salas
--      where tipo = 'abierta' and estado = 'esperando' and jugadores = 2 and apuesta = 100;
--     insert into _b2_res values (6, 'tercero: no creó otra', '1', n::text);
--
--     -- 7 · el invitado sale → expira_en vuelve a creada_en + 3 min; y se lista otra vez
--     perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
--     perform public.salir_sala(s1.id);
--     insert into _b2_res values (7, 'sale uno: reloj restituido', 'true',
--       ((select expira_en = creada_en + interval '3 minutes' from public.salas where id = s1.id))::text);
--     select count(*) into n from public.salas_abiertas() a where a.id = s1.id;
--     insert into _b2_res values (8, 'sale uno: vuelve al listado', '1', n::text);
--
--     -- 9 · vuelve a entrar → llena → corto; se fuerza el vencimiento y
--     --     resolver_sala arranca la mesa
--     r := public.unirse_sala(null, s1.id);
--     update public.salas set expira_en = now() - interval '1 second' where id = s1.id;
--     r := public.resolver_sala(s1.id);
--     insert into _b2_res values (9, 'llena y vencida: activa con iniciada_en', 'activa',
--       case when r.estado = 'activa' and r.iniciada_en is not null then 'activa' else coalesce(r.estado::text, 'NULL') end);
--
--     -- 10 · el anfitrión sale de OTRA mesa llena → cancelada y expira_en intacto
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     s2 := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
--     r := public.unirse_sala(s2.codigo);
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     perform public.salir_sala(s2.id);
--     insert into _b2_res values (10, 'anfitrión sale de una llena: cancelada, reloj intacto', 'cancelada|true',
--       (select estado::text || '|' || (expira_en = r.expira_en)::text from public.salas where id = s2.id));
--
--     delete from auth.users where id in (UNO, DOS, TRES);
--   end
--   $b2$;
--
--   select orden, prueba, esperado, obtenido,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--     from _b2_res order by orden;
--
-- El punto frágil sigue siendo el `insert into auth.users` (columnas de GoTrue
-- que cambian entre versiones): si falla ahí, lo que está en cuestión es el
-- andamio, no el esquema — el Grupo A valida las definiciones sin tocar `auth`.
--
-- CORRIDA REAL · pendiente. Se anota aquí con fecha y resultado cuando Victor la
-- ejecute.
-- ═══════════════════════════════════════════════════════════════════════════
