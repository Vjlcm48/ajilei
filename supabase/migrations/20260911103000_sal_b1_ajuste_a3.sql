-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · SAL-B1 · Ajuste A3 — `unirse_sala`: «¿sigue viva?» va ANTES que «¿ya estabas?»
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_SAL-B1_AjusteA3_Fase1_v1.0.md §2. Corrige el cuerpo que dejó
-- 20260911043500_sal_b1_ajuste.sql (A1 §4); no toca ninguna otra función.
--
-- EL DEFECTO. En las dos ramas (código e id), la reentrada —`es_miembro`—
-- decidía antes de comprobar que la mesa siguiera 'esperando' y sin vencer.
-- `salir_sala` del anfitrión sólo marca `salas.estado = 'cancelada'` y NO borra
-- su fila de `sala_jugadores` (SAL-A §11: «la fila no se borra, se marca»), así
-- que el anfitrión sigue siendo «miembro» de su mesa muerta y `unirse_sala` le
-- devolvía la fila CON id. Una fila con id pasa todas las guardas del cliente
-- por definición (`esMesa`, `entrarSala`): el stub pintaba datos reales y «La
-- mesa arrancó». Visto dos veces en el PC el 2026-09-11 (`AJ-EKW4`, `AJ-DAQN`).
--
-- EL CAMBIO. Sólo el ORDEN de dos comprobaciones, en las dos ramas: primero
-- «viva», luego «miembro». Una mesa muerta no se recupera, tampoco por quien
-- estuvo dentro; la reentrada queda sólo para mesas vivas. Todo lo demás del
-- cuerpo —validación del código, purga e inserción en `intentos_codigo`, límite
-- de cinco, `sala_esperando_de`, saldo, silla libre, inserción— se copia
-- verbatim de A1, comentarios incluidos. `create or replace` conserva los grants
-- de SAL-A §15; no se repiten.
-- ═══════════════════════════════════════════════════════════════════════════

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

  return v_sala;
end
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — correr DESPUÉS del push en el SQL Editor (rector A3 §4)
-- ═══════════════════════════════════════════════════════════════════════════
-- Comentadas, como en SAL-A y A1: `db push` aplica el archivo y una prueba
-- dentro sería un efecto que se repite en cada despliegue.
--
-- ── GRUPO A · El orden del cuerpo, leído del catálogo ──────────────────────
-- En el texto de la función, la primera aparición de `estado <> 'esperando'`
-- va antes que la primera de `es_miembro(v_sala.id`, y lo mismo en la segunda
-- rama (la que empieza en `elsif p_sala is not null`). Esperado: t, t, t.
--
--   with d as (
--     select pg_get_functiondef('public.unirse_sala(text, uuid)'::regprocedure) as t
--   ), r as (
--     select t, substr(t, position('elsif p_sala is not null' in t)) as rama_id from d
--   )
--   select position('estado <> ''esperando''' in t) < position('es_miembro(v_sala.id' in t) as rama_codigo_ok,
--          position('estado <> ''esperando''' in rama_id) < position('es_miembro(v_sala.id' in rama_id) as rama_id_ok,
--          has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute') as grant_vivo
--     from r;
--
-- ── GRUPO B · Conducta, con dos jugadores fabricados (se limpia al final) ──
-- Mismo andamio que A1: `request.jwt.claims` alimenta `auth.uid()`. Se pega
-- ENTERO, de una vez. Siete filas y todas deben decir OK.
--
--   do $a3$
--   declare
--     UNO uuid := '99999999-9999-4999-8999-999999999991';
--     DOS uuid := '99999999-9999-4999-8999-999999999992';
--     s1  public.salas;
--     s2  public.salas;
--     r   public.salas;
--     got text;
--     n   integer;
--   begin
--     drop table if exists _a3_res;
--     create temp table _a3_res (orden int, prueba text, esperado text, obtenido text);
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     values (UNO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'a3_uno@prueba.local', '', now(), now(), '{}', '{}'),
--            (DOS, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'a3_dos@prueba.local', '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (UNO, 'AjusteTresA'), (DOS, 'AjusteTresB');
--
--     -- 1 · el anfitrión arma, cancela, y pide su propia mesa por código → NULL
--     --     (antes de A3 devolvía la mesa: era miembro de un cadáver)
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     s1 := public.crear_sala('privada', 2::smallint, 100);
--     perform public.salir_sala(s1.id);
--     r := public.unirse_sala(s1.codigo);
--     insert into _a3_res values (1, 'anfitrion, mesa cancelada, por codigo -> null', 'NULL',
--       case when r.id is null then 'NULL' else 'SALA' end);
--
--     -- 2 · lo mismo por id → sala_no_disponible
--     begin
--       perform public.unirse_sala(null, s1.id);
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _a3_res values (2, 'anfitrion, mesa cancelada, por id -> error',
--       'sala_no_disponible', got);
--
--     -- 3 · mesa viva: un NO miembro con saldo se sienta (el camino normal)
--     s2 := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
--     r := public.unirse_sala(s2.codigo);
--     select count(*) into n from public.sala_jugadores where sala_id = s2.id and jugador_id = DOS;
--     insert into _a3_res values (3, 'mesa viva, no miembro se sienta', '1', n::text);
--
--     -- 4 · mesa viva: el miembro repite el código y la recupera (reentrada)
--     r := public.unirse_sala(s2.codigo);
--     insert into _a3_res values (4, 'mesa viva, miembro reentra', 'MISMA',
--       case when r.id = s2.id then 'MISMA' else coalesce(r.id::text, 'NULL') end);
--
--     -- 5 · la mesa pasa a 'activa' sin partida (regla provisional de A1) → el
--     --     miembro ya no la recupera: NULL, coherente con mi_sala()
--     update public.salas set estado = 'activa', iniciada_en = now() where id = s2.id;
--     r := public.unirse_sala(s2.codigo);
--     insert into _a3_res values (5, 'mesa activa sin partida, miembro -> null', 'NULL',
--       case when r.id is null then 'NULL' else 'SALA' end);
--
--     -- 6 · el intento de (1) dejó fila: la anotación sigue en pie
--     select count(*) into n from public.intentos_codigo where jugador_id = UNO;
--     insert into _a3_res values (6, 'intento del anfitrion anotado', '1', n::text);
--
--     -- 7 · y DOS acumuló sus tres (3, 4 y 5): también con reentrada se anota
--     select count(*) into n from public.intentos_codigo where jugador_id = DOS;
--     insert into _a3_res values (7, 'tres intentos de DOS anotados', '3', n::text);
--
--     delete from auth.users where id in (UNO, DOS);
--   end
--   $a3$;
--
--   select orden, prueba, esperado, obtenido,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--     from _a3_res order by orden;
--
-- CORRIDA REAL · pendiente. Se anota aquí con fecha y resultado cuando Victor la
-- ejecute.
-- ═══════════════════════════════════════════════════════════════════════════
