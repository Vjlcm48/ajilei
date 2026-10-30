-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · CFG-1 · Fase 1c — Verificación de la guarda y del borrado en cascada
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_CFG-1_Fase1c_v1.0.md §3.1.
-- Migración que verifica: supabase/migrations/20261030001500_cfg1c_eliminar_cuenta.sql.
--
-- CÓMO SE USA: como los de ECO-1 y RNK-1. Se pega ENTERO en el SQL Editor
-- DESPUÉS del push y se corre UNA vez. Devuelve UNA tabla
-- `prueba | resultado | detalle`: primero el Grupo A (definición y permisos),
-- después el Grupo B (comportamiento). Cada fila debe decir PASA. No enseña
-- correos ni uuids de cuentas reales. Antes del push lo corre `npm run guiones`
-- contra un Postgres en memoria.
--
-- NO DEJA RASTRO, por los mismos dos caminos de siempre: `begin;` … `rollback;`,
-- y una función en `pg_temp` que lo corre todo dentro de un bloque con
-- `exception` y lo deshace lanzando `cfg1c_deshacer`. Lo que `barrer_salas()`
-- toque de las salas reales al llamar a la guarda también se deshace.
--
-- LAS CUENTAS. Fabrica dos (`cfg_a_verif`, `cfg_b_verif`) y, al final, una
-- tercera con un ALIAS del correo de la primera (`+otra`, puntos movidos): la
-- huella de gmail es la misma (eco1a:284-309), así que nace sin bono. Todas se
-- deshacen. El borrado se hace como lo hará `auth.admin.deleteUser`: un
-- `delete from auth.users`, nada más.
--
-- LAS SALAS son privadas (con código), para no chocar con el índice único de
-- las abiertas en espera (`salas_abierta_unica_idx`) si la base real tuviera
-- una mesa abierta de 2 jugadores y 100 HC esperando en ese momento.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.cfg1c_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  A  constant uuid := 'c1c00000-0000-4000-8000-00000000000a';
  B  constant uuid := 'c1c00000-0000-4000-8000-00000000000b';
  A2 constant uuid := 'c1c00000-0000-4000-8000-0000000000a2';
  CORREO_A  constant text := 'cfg1c.verif.a@gmail.com';
  ALIAS_A   constant text := 'CFG1CVERIFA+otra@googlemail.com';
  FUNCION   constant text := 'public.partida_abierta_de(uuid)';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  r   public.mesa_ia_resultado;
  m_a uuid;
  s1  uuid;
  s2  uuid;
  fk  record;
  t1 text; t2 text; t3 text; t4 text;
  g1 text; g2 text; g3 text;
  n  bigint; n1 bigint; n2 bigint; n3 bigint; n4 bigint;
  tablas_antes  text[] := '{}';
  tablas_despues text[] := '{}';
  s0 bigint;
  ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean;
begin
  begin
    -- ═══ GRUPO A · definición y permisos ═════════════════════════════════

    -- ── A1 · la función: firma, retorno, security definer, search_path ──
    select count(*) into n1
      from pg_proc f join pg_namespace s on s.oid = f.pronamespace
     where s.nspname = 'public' and f.proname = 'partida_abierta_de'
       and pg_get_function_identity_arguments(f.oid) = 'p_uid uuid'
       and f.prorettype = 'text'::regtype
       and f.prosecdef and f.proconfig @> array['search_path=""'];
    v_o := v_o || 1; v_p := v_p || 'A1 · partida_abierta_de(uuid) → text, security definer, search_path vacío'::text;
    v_r := v_r || case when to_regprocedure(FUNCION) is not null and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('existe=%s · con esa forma=%s', to_regprocedure(FUNCION) is not null, n1 = 1);

    -- ── A2 · sólo la llave de servicio la ejecuta ────────────────────────
    ok1 := has_function_privilege('anon', FUNCION, 'execute');
    ok2 := has_function_privilege('authenticated', FUNCION, 'execute');
    ok3 := has_function_privilege('service_role', FUNCION, 'execute');
    ok4 := exists (select 1 from pg_proc f, aclexplode(f.proacl) a
                    where f.oid = to_regprocedure(FUNCION) and a.grantee = 0 and a.privilege_type = 'EXECUTE');
    v_o := v_o || 2; v_p := v_p || 'A2 · invisible al cliente: ni public, ni anon, ni authenticated; sí service_role'::text;
    v_r := v_r || case when not ok1 and not ok2 and ok3 and not ok4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('anon=%s · authenticated=%s · service_role=%s · public=%s', ok1, ok2, ok3, ok4);

    -- ── A3 · la huella no cuelga de nadie ────────────────────────────────
    select count(*) into n1 from pg_constraint c
     where c.conrelid = 'public.bonos_bienvenida'::regclass and c.contype = 'f';
    v_o := v_o || 3; v_p := v_p || 'A3 · bonos_bienvenida sin claves foráneas (la huella sobrevive al borrado)'::text;
    v_r := v_r || case when n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('claves foráneas=%s', n1);

    -- ═══ GRUPO B · comportamiento ════════════════════════════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (A, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            CORREO_A, '', now(), now(), '{}', '{}'),
           (B, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'cfg1c.verif.b@example.invalid', '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (A, 'cfg_a_verif');
    insert into public.profiles (id, username) values (B, 'cfg_b_verif');
    -- Saldo y un movimiento seguros aunque la huella de A ya hubiera cobrado
    -- (en la base real el bono depende de eso): un ajuste del administrador.
    perform public.ajuste_admin(A, 1000, 'CFG-1 1c · verificación');

    -- ── B1 · una cuenta sin nada abierto ─────────────────────────────────
    t1 := public.partida_abierta_de(A);
    v_o := v_o || 101; v_p := v_p || 'B1 · sin mesa ni sala → null'::text;
    v_r := v_r || case when t1 is null then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s', coalesce(t1, 'null'));

    -- ── B2 · con una mesa contra las IAS abierta ─────────────────────────
    perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid());
    m_a := r.mesa_id;
    t1 := public.partida_abierta_de(A);
    v_o := v_o || 102; v_p := v_p || 'B2 · mesa IA abierta → mesa_ia'::text;
    v_r := v_r || case when r.codigo = 'ok' and t1 = 'mesa_ia' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('sentarse_ia → %s · guarda → %s', r.codigo, coalesce(t1, 'null'));

    -- ── B3 · una mano ganada en el libro de puntos, y se levanta ─────────
    insert into public.libro_puntos (jugador_id, origen, nivel, sentados, puntos_base, ajilei, extra, mesa_id, mano)
    values (A, 'ias', 'basico', 2, 1, 0, 0, m_a, 1);
    r := public.salir_ia(m_a, 500, 1);
    perform set_config('request.jwt.claims', '', true);
    t1 := public.partida_abierta_de(A);
    select count(*) into n1 from public.puntos_totales where jugador_id = A;
    v_o := v_o || 103; v_p := v_p || 'B3 · tras levantarse de la mesa (y con un punto en el libro) → null'::text;
    v_r := v_r || case when r.codigo = 'ok' and t1 is null and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('salir_ia → %s · guarda → %s · total de puntos=%s', r.codigo, coalesce(t1, 'null'), n1);

    -- ── B4 · anfitrión de una sala en espera, aunque no esté sentado ─────
    insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id)
    values ('AJ-ZQ9W', 'privada', 2, 100, A) returning id into s1;
    t1 := public.partida_abierta_de(A);
    v_o := v_o || 104; v_p := v_p || 'B4 · anfitrión de una sala esperando, sin asiento → sala'::text;
    v_r := v_r || case when t1 = 'sala' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s', coalesce(t1, 'null'));

    -- ── B5 · sentado sin ser anfitrión, en espera y en activa viva ───────
    insert into public.sala_jugadores (sala_id, jugador_id, asiento) values (s1, A, 0), (s1, B, 1);
    t1 := public.partida_abierta_de(B);
    update public.salas set estado = 'activa', iniciada_en = now() where id = s1;
    t2 := public.partida_abierta_de(B);
    t3 := public.partida_abierta_de(A);
    v_o := v_o || 105; v_p := v_p || 'B5 · sentado (no anfitrión) en espera y en activa → sala; el anfitrión en activa → sala'::text;
    v_r := v_r || case when t1 = 'sala' and t2 = 'sala' and t3 = 'sala' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('B esperando → %s · B activa → %s · A activa → %s',
                         coalesce(t1, 'null'), coalesce(t2, 'null'), coalesce(t3, 'null'));

    -- ── B6 · una activa muerta (más de 10 min sin partida): se barre ─────
    update public.salas set iniciada_en = now() - interval '11 minutes' where id = s1;
    t1 := public.partida_abierta_de(B);
    select estado::text into g1 from public.salas where id = s1;
    v_o := v_o || 106; v_p := v_p || 'B6 · activa sin partida hace 11 min → el barrido la cancela → null'::text;
    v_r := v_r || case when t1 is null and g1 = 'cancelada' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · la sala quedó %s', coalesce(t1, 'null'), g1);

    -- ── B7 · una en espera ya vencida, con uno solo sentado: se barre ────
    insert into public.salas (codigo, tipo, jugadores, apuesta, anfitrion_id, expira_en)
    values ('AJ-ZQ9X', 'privada', 2, 100, B, now() - interval '1 minute') returning id into s2;
    insert into public.sala_jugadores (sala_id, jugador_id, asiento) values (s2, B, 0);
    t1 := public.partida_abierta_de(B);
    select estado::text into g2 from public.salas where id = s2;
    v_o := v_o || 107; v_p := v_p || 'B7 · esperando vencida con 1 sentado → el barrido la cancela → null'::text;
    v_r := v_r || case when t1 is null and g2 = 'cancelada' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('→ %s · la sala quedó %s', coalesce(t1, 'null'), g2);

    -- ── B8 · los libros no se borran a mano (INV-71) ─────────────────────
    begin delete from public.movimientos   where jugador_id = A; t1 := 'se borró'; exception when others then t1 := 'rechazado'; end;
    begin delete from public.billeteras    where jugador_id = A; t2 := 'se borró'; exception when others then t2 := 'rechazado'; end;
    begin delete from public.libro_puntos  where jugador_id = A; t3 := 'se borró'; exception when others then t3 := 'rechazado'; end;
    begin delete from public.puntos_totales where jugador_id = A; t4 := 'se borró'; exception when others then t4 := 'rechazado'; end;
    v_o := v_o || 108; v_p := v_p || 'B8 · DELETE manual sobre los cuatro libros: rechazado'::text;
    v_r := v_r || case when t1 = 'rechazado' and t2 = 'rechazado' and t3 = 'rechazado' and t4 = 'rechazado' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('movimientos=%s · billeteras=%s · libro_puntos=%s · puntos_totales=%s', t1, t2, t3, t4);

    -- ── B9 · el borrado: `delete from auth.users` y todo se va en cascada ─
    -- Se cuentan las filas de A en CADA tabla con una clave foránea de una
    -- columna a `profiles(id)` o a `auth.users(id)`, leídas del catálogo: una
    -- tabla que nazca mañana entra sola.
    n1 := 0;
    for fk in
      select format('%I.%I', ns.nspname, cl.relname) as tabla, a.attname as columna
        from pg_constraint c
        join pg_class cl on cl.oid = c.conrelid
        join pg_namespace ns on ns.oid = cl.relnamespace
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.contype = 'f' and array_length(c.conkey, 1) = 1
         and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)
    loop
      execute format('select count(*) from %s where %I = $1', fk.tabla, fk.columna) into n using A;
      n1 := n1 + n;
      if n > 0 then tablas_antes := tablas_antes || fk.tabla; end if;
    end loop;
    select count(*) into n3 from public.bonos_bienvenida where correo_hash = public.huella_correo(CORREO_A);
    select count(*) into n4 from public.sala_jugadores where jugador_id = B and sala_id = s1;

    delete from auth.users where id = A;

    n2 := 0;
    for fk in
      select format('%I.%I', ns.nspname, cl.relname) as tabla, a.attname as columna
        from pg_constraint c
        join pg_class cl on cl.oid = c.conrelid
        join pg_namespace ns on ns.oid = cl.relnamespace
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.contype = 'f' and array_length(c.conkey, 1) = 1
         and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)
    loop
      execute format('select count(*) from %s where %I = $1', fk.tabla, fk.columna) into n using A;
      n2 := n2 + n;
      if n > 0 then tablas_despues := tablas_despues || fk.tabla; end if;
    end loop;
    ok1 := 'public.billeteras' = any(tablas_antes) and 'public.movimientos' = any(tablas_antes)
       and 'public.libro_puntos' = any(tablas_antes) and 'public.puntos_totales' = any(tablas_antes)
       and 'public.mesas_ia' = any(tablas_antes) and 'public.salas' = any(tablas_antes)
       and 'public.sala_jugadores' = any(tablas_antes) and 'public.profiles' = any(tablas_antes);
    v_o := v_o || 109; v_p := v_p || 'B9 · delete from auth.users: nada de A en ninguna tabla que apunte a la cuenta'::text;
    v_r := v_r || case when ok1 and n1 > 0 and n2 = 0
                        and not exists (select 1 from auth.users where id = A)
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas antes=%s en %s tablas (%s) · filas después=%s%s',
                         n1, coalesce(array_length(tablas_antes, 1), 0), array_to_string(tablas_antes, ', '), n2,
                         case when n2 > 0 then ' en ' || array_to_string(tablas_despues, ', ') else '' end);

    -- ── B10 · la huella queda; el otro jugador, también, sin su asiento ──
    select count(*) into n from public.bonos_bienvenida where correo_hash = public.huella_correo(CORREO_A);
    select count(*) into n1 from public.profiles where id = B;
    select count(*) into n2 from public.billeteras where jugador_id = B;
    select count(*) into s0 from public.sala_jugadores where jugador_id = B and sala_id = s1;
    v_o := v_o || 110; v_p := v_p || 'B10 · bonos_bienvenida conserva la huella; B sigue, sin el asiento de la sala de A'::text;
    v_r := v_r || case when n3 = 1 and n = 1 and n1 = 1 and n2 = 1 and n4 = 1 and s0 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('huella antes=%s después=%s · perfil de B=%s · billetera de B=%s · asiento de B en la sala de A %s→%s',
                         n3, n, n1, n2, n4, s0);

    -- ── B11 · vuelve con un alias del mismo correo: de cero y sin bono ───
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (A2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            ALIAS_A, '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (A2, 'cfg_a2_verif');
    select b.saldo into s0 from public.billeteras b where b.jugador_id = A2;
    select count(*) into n1 from public.movimientos where jugador_id = A2;
    select count(*) into n2 from public.puntos_totales where jugador_id = A2;
    v_o := v_o || 111; v_p := v_p || 'B11 · cuenta nueva con un alias del mismo correo: 0 HC, sin bono, sin puntos'::text;
    v_r := v_r || case when public.huella_correo(ALIAS_A) = public.huella_correo(CORREO_A)
                        and s0 = 0 and n1 = 0 and n2 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('misma huella=%s · saldo=%s · movimientos=%s · total de puntos=%s',
                         public.huella_correo(ALIAS_A) = public.huella_correo(CORREO_A),
                         coalesce(s0::text, 'sin billetera'), n1, n2);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'cfg1c_deshacer';
  exception when others then
    if sqlerrm <> 'cfg1c_deshacer' then
      v_o := v_o || 999; v_p := v_p || 'X · el guion se detuvo'::text;
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.cfg1c_verificar()
 order by orden;

rollback;
