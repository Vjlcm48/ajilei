-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · SAL-B1 · Ajuste A1 — Tres cuerpos corregidos y un predicado común
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_SAL-B1_AjusteA1_v1.0.md §2 y §3. Corrige la migración
-- 20260905203158_sal_a_salas.sql; no la reemplaza.
--
-- Se aplica con `npx supabase db push`, en la transacción implícita de la CLI.
-- NINGUNA función cambia de nombre ni de firma: se reemplazan cuerpos con
-- `create or replace`, que además CONSERVA los grants que SAL-A concedió (§15
-- de aquella migración). Lo único nuevo es una función interna, y se revoca a
-- todos como `barrer_salas`.
--
-- ── LO QUE MIDIERON DOS TELÉFONOS EL 2026-09-11 ───────────────────────────
--
-- DEFECTO 1 · Una mesa arrancada retenía al jugador para siempre. Tres piezas
--   no miraban el mismo conjunto de estados: `mi_sala()` devolvía mesas
--   'esperando' Y 'activa'; la guarda «ya estás en una mesa» de `crear_sala` y
--   `unirse_sala` sólo miraba 'esperando'; y nada termina una 'activa' en B1,
--   porque no hay partida. Resultado: el Motorola, sentado en una mesa que el
--   barrido arrancó, volvía a ella en cada arranque de la app y podía además
--   sentarse en otra —hubo que cancelarla a mano en SQL.
--
-- DEFECTO 2 · El límite de cinco códigos por minuto nunca se disparaba. Once
--   códigos falsos seguidos desde la misma cuenta, once veces «Código no
--   encontrado». La causa es de Postgres: `unirse_sala` anotaba el intento en
--   `intentos_codigo` y DESPUÉS lanzaba `raise exception`; un `raise` que sale
--   de la función de arriba aborta la transacción entera —la RPC es una
--   transacción— y la anotación se deshace con ella. La tabla no acumulaba
--   nada, así que el `count(*) > 5` no se cumplía jamás. Confirmado leyendo:
--   no hay transacción autónoma en Postgres y ninguna llamada a una función
--   auxiliar lo cambia, porque la auxiliar vive en la misma transacción.
--
-- ── LA REGLA PROVISIONAL QUE ESTA MIGRACIÓN SELLA, HASTA MES-PvP ──────────
-- «Una mesa 'activa' sin partida es una mesa muerta.» MES-PvP, cuando exista
-- la partida, reescribirá el ciclo de vida de 'activa' y será la partida —no
-- la sala— quien reanude a nadie. Cada línea de aquí que dependa de esa regla
-- lleva el comentario `-- provisional hasta MES-PvP`.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · El predicado común: ¿en qué mesa EN ESPERA está este jugador? ─────
-- Rector §2.3. Antes había tres consultas escritas a mano —dos `exists` en
-- `crear_sala`/`unirse_sala` y un `select` en `mi_sala`— y ya habían divergido:
-- una miraba dos estados y las otras uno. A partir de aquí las tres preguntan
-- lo mismo al mismo sitio, y la única forma de que vuelvan a separarse es
-- dejar de llamar a esto.
--
-- Devuelve el ID de la sala o NULL. Un `uuid` y no un booleano porque `mi_sala`
-- necesita la fila y las guardas sólo necesitan saber si hay algo: el uuid
-- sirve a los dos sin una segunda función. `order by creada_en desc limit 1` es
-- la misma elección que `mi_sala` ya hacía —si por la rendija de concurrencia
-- declarada en SAL-A hubiera dos, se enseña la más reciente—.
--
-- SÓLO 'esperando', y es la decisión de §2.1: una 'activa' no reanuda a nadie.
create or replace function public.sala_esperando_de(p_uid uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $fn$
  select s.id
    from public.salas s
    join public.sala_jugadores j on j.sala_id = s.id
   where j.jugador_id = p_uid
     and s.estado = 'esperando'
   order by s.creada_en desc
   limit 1
$fn$;

comment on function public.sala_esperando_de(uuid) is
  'SAL-B1 A1 · La mesa en espera de un jugador, o null. Predicado ÚNICO de «ya en mesa» y de mi_sala.';

-- Interna: sólo la llaman funciones `security definer`, que corren como el
-- definidor y no pierden el privilegio. Mismo trato que `barrer_salas`.
revoke execute on function public.sala_esperando_de(uuid) from public, anon, authenticated;


-- ── 2 · El barrido cancela también las 'activa' muertas ───────────────────
-- Rector §2.2. La primera mitad es la de SAL-A, palabra por palabra. La
-- segunda es la rama provisional: una 'activa' SIN `estado_partida` que lleve
-- más de diez minutos desde que arrancó se cancela.
--
-- `estado_partida is null` es el predicado honesto de «sin partida»: el día que
-- MES-PvP escriba ahí el estado del motor, esta rama deja de tocar esas filas
-- por sí sola —aunque lo correcto será retirarla, no dejar que se apague—.
--
-- `coalesce(iniciada_en, expira_en)`: SAL-A escribe `iniciada_en` al arrancar
-- (en `barrer_salas`, `resolver_sala` y `jugar_ya`), así que el primero es el
-- instante exacto; el segundo es la red para una fila que por lo que fuera
-- llegara sin él. Los DIEZ minutos son `ACTIVA_SIN_PARTIDA_MIN` en
-- `src/config/salas.js`, copiados a mano: si una cifra cambia, la otra también.
create or replace function public.barrer_salas()
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  with vencidas as (
    select s.id,
           (select count(*) from public.sala_jugadores j where j.sala_id = s.id) as sentados
    from public.salas s
    where s.estado = 'esperando' and s.expira_en <= now()
  )
  update public.salas s
     set estado      = case when v.sentados >= 2 then 'activa'::public.sala_estado
                            else 'cancelada'::public.sala_estado end,
         iniciada_en = case when v.sentados >= 2 then now() else s.iniciada_en end
    from vencidas v
   where s.id = v.id
     and s.estado = 'esperando';

  -- provisional hasta MES-PvP · una 'activa' sin partida es una mesa muerta.
  -- 10 minutos = ACTIVA_SIN_PARTIDA_MIN (src/config/salas.js).
  update public.salas s
     set estado = 'cancelada'::public.sala_estado
   where s.estado = 'activa'
     and s.estado_partida is null
     and coalesce(s.iniciada_en, s.expira_en) <= now() - interval '10 minutes';
end
$fn$;


-- ── 3 · Abrir mesa: la guarda «ya en mesa» pasa por el predicado común ─────
-- Cuerpo de SAL-A §9 íntegro salvo UNA línea: el `exists (...)` escrito a mano
-- se sustituye por `sala_esperando_de(v_uid) is not null`. Nada más cambia.
create or replace function public.crear_sala(
  p_tipo      public.sala_tipo,
  p_jugadores smallint,
  p_apuesta   integer
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

  if public.saldo_de(v_uid) < public.regla_asiento() * p_apuesta then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  end if;

  if p_tipo = 'abierta' then
    select s.id into v_existente
      from public.salas s
     where s.tipo = 'abierta' and s.estado = 'esperando'
       and s.jugadores = p_jugadores and s.apuesta = p_apuesta
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
        insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id)
        values (v_codigo, p_tipo, p_jugadores, p_apuesta, v_uid)
        returning * into v_sala;
        exit;
      exception when unique_violation then
        if v_intento >= 10 then raise;
        end if;
      end;
    end loop;
  else
    insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id)
    values (null, p_tipo, p_jugadores, p_apuesta, v_uid)
    returning * into v_sala;
  end if;

  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, 0);

  return v_sala;
end
$fn$;


-- ── 4 · Sentarse: el intento fallido PERSISTE ──────────────────────────────
-- Rector §3. El mecanismo elegido, y por qué éste y no otro:
--
--   · La función NO puede cambiar de firma (regla 2 de la tanda), así que no
--     puede devolver un `{sala, error}` compuesto: sigue devolviendo
--     `public.salas`.
--   · Una función auxiliar que «anote y devuelva null» no basta por sí sola: si
--     `unirse_sala` lanza después, la transacción se deshace igual y la
--     anotación de la auxiliar cae con ella. Postgres no tiene transacción
--     autónoma; `dblink` la simularía a costa de una conexión por intento, y
--     eso es una pieza nueva que esta ficha no autoriza.
--   · Lo que SÍ garantiza que el intento persista es que el camino «código
--     bien formado que no encuentra mesa viva» TERMINE NORMALMENTE. La única
--     salida normal de una función que devuelve `public.salas` sin sala es
--     NULL —el mismo NULL que `mi_sala` ya devuelve cuando no hay mesa—.
--
-- Así que: por CÓDIGO, «no encontrado o mesa ya iniciada» devuelve NULL, la
-- anotación se confirma con la transacción y el sexto intento en un minuto
-- llega al `count(*) > 5`. `salasApi.unirseSala` traduce ese NULL a la misma
-- clave de siempre, `codigo_invalido`, cuyo texto ya decía exactamente eso:
-- «Código no encontrado o mesa ya iniciada».
--
-- LO QUE NO CAMBIA: por ID (`p_sala`, el «Unirme» de una tarjeta) se sigue
-- lanzando `sala_no_disponible` —ahí no hay intento que persistir—;
-- `demasiados_intentos` sigue siendo un `raise` (deshace SU anotación, pero el
-- límite ya se cumplió con las cinco anteriores, que sí quedaron); y un código
-- MAL FORMADO sigue lanzando `codigo_invalido` sin anotar, porque no puede
-- coincidir con nada y contarlo sólo castigaría al que se equivoca tecleando.
--
-- La anotación se queda ANTES de la comprobación y de la búsqueda, como en
-- SAL-A: el intento que se rechaza también cuenta.
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

    -- Y «mesa ya iniciada» —o vencida, o cancelada— por el MISMO camino, salvo
    -- para quien ya está sentado en ella, que la recupera como siempre. Dar aquí
    -- un error distinto del de «no existe» diría al que sondea que ese código
    -- existió; devolver lo mismo en los dos casos no cuenta nada.
    if public.es_miembro(v_sala.id, v_uid) then
      return v_sala;
    end if;
    if v_sala.estado <> 'esperando' or v_sala.expira_en <= now() then
      return null;
    end if;
  elsif p_sala is not null then
    select * into v_sala from public.salas where id = p_sala for update;
    if v_sala.id is null then
      raise exception 'sala_no_disponible' using errcode = 'P0001';
    end if;
    if public.es_miembro(v_sala.id, v_uid) then
      return v_sala;
    end if;
    if v_sala.estado <> 'esperando' or v_sala.expira_en <= now() then
      raise exception 'sala_no_disponible' using errcode = 'P0001';
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


-- ── 5 · Mi sala: SÓLO 'esperando' ─────────────────────────────────────────
-- Rector §2.1. Una 'activa' no reanuda a nadie: en B1 no lleva a ninguna
-- parte, y devolverla era lo que encerraba al jugador. Cuando MES-PvP tenga
-- partida, será la partida —no esta función— quien reanude.
--
-- Sigue barriendo primero, por la razón que SAL-A §14 dejó escrita, y ahora el
-- barrido también cierra la 'activa' muerta de este mismo jugador de paso.
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

  -- provisional hasta MES-PvP · sólo 'esperando', vía el predicado común.
  select s.* into v_sala
    from public.salas s
   where s.id = public.sala_esperando_de(v_uid);

  if not found then
    return null;
  end if;

  return v_sala;
end
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — de SOLO LECTURA, correr DESPUÉS del push en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector §6.2. Van comentadas, como en SAL-A y por la misma razón: `db push`
-- aplica el archivo y una prueba dentro sería un efecto que se repite en cada
-- despliegue. El Grupo A no escribe nada; el Grupo B fabrica dos usuarios de
-- prueba y los borra al final (molde del Grupo B de SAL-A).
--
-- ── A · El esquema quedó como se pide (sin tocar auth) ─────────────────────
--
--   -- Los cuatro cuerpos nuevos y el predicado, con su fuente. Esperado: las
--   -- cinco filas; `usa_predicado` en t para crear_sala, unirse_sala y mi_sala;
--   -- `provisional` en t para barrer_salas y mi_sala.
--   select p.proname, p.prosecdef as definer,
--          position('sala_esperando_de' in pg_get_functiondef(p.oid)) > 0 as usa_predicado,
--          position('provisional hasta MES-PvP' in pg_get_functiondef(p.oid)) > 0 as provisional
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('sala_esperando_de', 'barrer_salas', 'crear_sala', 'unirse_sala', 'mi_sala')
--    order by p.proname;
--
--   -- `sala_esperando_de` NO es invocable desde el cliente. Esperado: f, f.
--   select has_function_privilege('anon',          'public.sala_esperando_de(uuid)', 'execute') as anon,
--          has_function_privilege('authenticated', 'public.sala_esperando_de(uuid)', 'execute') as authenticated;
--
--   -- Y los grants de SAL-A sobrevivieron al `create or replace`. Esperado: t ×4.
--   select has_function_privilege('authenticated', 'public.crear_sala(public.sala_tipo, smallint, integer)', 'execute') as crear,
--          has_function_privilege('authenticated', 'public.unirse_sala(text, uuid)', 'execute') as unirse,
--          has_function_privilege('authenticated', 'public.mi_sala()', 'execute') as mi_sala,
--          not has_function_privilege('authenticated', 'public.barrer_salas()', 'execute') as barrido_sigue_privado;
--
-- ── B · Los tres hechos, con dos jugadores fabricados (se limpia al final) ──
-- Se pega ENTERO, de una vez. Seis filas y todas deben decir OK.
--
--   do $a1$
--   declare
--     UNO uuid := '77777777-7777-7777-7777-777777777777';
--     DOS uuid := '88888888-8888-8888-8888-888888888888';
--     s   public.salas;
--     r   public.salas;
--     got text;
--     n   integer;
--   begin
--     drop table if exists _a1_res;
--     create temp table _a1_res (orden int, prueba text, esperado text, obtenido text);
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     values (UNO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'a1_uno@prueba.local', '', now(), now(), '{}', '{}'),
--            (DOS, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'a1_dos@prueba.local', '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (UNO, 'AjusteUno'), (DOS, 'AjusteDos');
--
--     -- 1 · un código bien formado que no existe devuelve NULL, no un error
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     begin
--       r := public.unirse_sala('AJ-2345');
--       got := case when r.id is null then 'NULL' else 'SALA' end;
--     exception when others then got := sqlerrm;
--     end;
--     insert into _a1_res values (1, 'codigo inexistente -> null', 'NULL', got);
--
--     -- 2 · …y el intento QUEDÓ anotado (esto es lo que el rollback deshacía)
--     select count(*) into n from public.intentos_codigo where jugador_id = UNO;
--     insert into _a1_res values (2, 'intento persistido', '1', n::text);
--
--     -- 3 · el sexto en un minuto se corta con su propia clave
--     for n in 1..4 loop perform public.unirse_sala('AJ-2345'); end loop;
--     begin
--       perform public.unirse_sala('AJ-2345');
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _a1_res values (3, 'sexto -> demasiados_intentos', 'demasiados_intentos', got);
--
--     -- 4 · mi_sala NO devuelve una 'activa': UNO arma, DOS entra, se fuerza el
--     --     arranque, y DOS pregunta.
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
--     perform public.unirse_sala(s.codigo);
--     update public.salas set estado = 'activa', iniciada_en = now() where id = s.id;
--     r := public.mi_sala();
--     insert into _a1_res values (4, 'mi_sala ignora la activa', 'NULL',
--       case when r.id is null then 'NULL' else 'SALA' end);
--
--     -- 5 · el barrido cancela la 'activa' sin partida pasados los 10 minutos
--     update public.salas set iniciada_en = now() - interval '11 minutes' where id = s.id;
--     perform public.barrer_salas();
--     insert into _a1_res values (5, 'activa vieja -> cancelada', 'cancelada',
--       (select estado::text from public.salas where id = s.id));
--
--     -- 6 · y, liberado, DOS arma otra a la primera
--     begin
--       perform public.crear_sala('privada', 2::smallint, 100);
--       got := 'OK';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _a1_res values (6, 'liberado: crea otra', 'OK', got);
--
--     delete from auth.users where id in (UNO, DOS);
--   end
--   $a1$;
--
--   select orden, prueba, esperado, obtenido,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--     from _a1_res order by orden;
--
-- ── C · Con el teléfono (§6 del rector), la lectura que confirma la causa ──
-- Tras UN código falso desde la app, con la sesión de esa cuenta:
--
--   select jugador_id, intentado_en from public.intentos_codigo
--    order by intentado_en desc limit 5;
--
-- ANTES de esta migración devolvía 0 filas tras cualquier número de fallos (el
-- rollback). DESPUÉS, una fila por intento bien formado.
--
-- CORRIDA REAL · pendiente. Se anota aquí con fecha y resultado cuando Victor la
-- ejecute.
-- ═══════════════════════════════════════════════════════════════════════════
