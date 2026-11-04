-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1a — Verificación del libro, DESPUÉS del `db push`
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_ECO-1_Fase1a_v1.0.md §2.2. Migración que verifica:
-- supabase/migrations/20261007144943_eco1a_libro.sql.
--
-- CÓMO SE USA: se pega ENTERO en el SQL Editor y se corre UNA vez. Devuelve
-- una tabla `prueba | resultado | detalle` y cada fila debe decir PASA. No
-- enseña correos ni uuids: sólo recuentos y cifras.
--
-- NO DEJA RASTRO, por dos caminos a la vez:
--   1. Todo va entre `begin;` y `rollback;`.
--   2. Las pruebas viven en una función TEMPORAL (`pg_temp`, desaparece con la
--      sesión) que corre todo dentro de un bloque con `exception`, y lo cierra
--      lanzando a propósito `eco1a_deshacer`: el bloque se deshace entero —los
--      usuarios fabricados, sus movimientos, las marcas de bono— y sólo
--      sobreviven las filas del resultado, que viven en variables.
-- El segundo camino existe porque el SQL Editor enseña UNA tabla por lote
-- (0001:233-237). Si en tu Editor la tabla no apareciera por ir antes del
-- `rollback`, borra las líneas `begin;` y `rollback;` y córrelo otra vez: el
-- camino 2 basta por sí solo.
--
-- Si una prueba revienta de forma inesperada, la tabla sale igual, con una
-- fila final `X · el guion se detuvo` en FALLA y el error en `detalle`.
--
-- Las pruebas 1 y 2 cuentan las CUATRO cuentas de antes de ECO-1 (D3): si
-- alguien se registró entre el push y este guion, saldrán en FALLA con las
-- cifras en `detalle`, y eso no es un defecto del libro.
--
-- El punto frágil, como en SUP-2a y SAL-A: el `insert into auth.users` de los
-- usuarios fabricados. Si falla ahí, lo que está en cuestión es el andamio.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.eco1a_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  UNO  constant uuid := 'ec01a000-0000-4000-8000-000000000001';
  DOS  constant uuid := 'ec01a000-0000-4000-8000-000000000002';
  TRES constant uuid := 'ec01a000-0000-4000-8000-000000000003';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  n1 bigint; n2 bigint; n3 bigint; n4 bigint;
  s0 bigint; s1 bigint;
  r1 public.movimiento_resultado;
  r2 public.movimiento_resultado;
  b1 boolean; b2 boolean; b3 boolean;
  t1 text; t2 text;
  sala public.salas;
begin
  begin
    -- ── 1 · las cuatro cuentas de antes, con 2.500 cada una ──────────────
    select count(*) into n1 from public.profiles;
    select count(*) into n2 from public.billeteras;
    select count(*) into n3 from public.profiles p
      join public.billeteras b on b.jugador_id = p.id
     where b.saldo = 2500;
    v_o := v_o || 1; v_p := array_append(v_p, '1 · 4 billeteras con 2.500'::text);
    v_r := v_r || case when n1 = 4 and n2 = 4 and n3 = 4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('perfiles=%s · billeteras=%s · con 2.500=%s', n1, n2, n3);

    -- ── 2 · cuatro bonos y cuatro huellas ────────────────────────────────
    select count(*) into n1 from public.movimientos where tipo = 'bono_bienvenida';
    select count(*) into n2 from public.bonos_bienvenida;
    select count(*) into n3 from public.movimientos m
      join public.bonos_bienvenida h on m.clave_idem = 'bono:' || h.correo_hash
     where m.tipo = 'bono_bienvenida' and m.monto = public.bono_bienvenida_hc();
    v_o := v_o || 2; v_p := array_append(v_p, '2 · 4 bonos y 4 huellas'::text);
    v_r := v_r || case when n1 = 4 and n2 = 4 and n3 = 4 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('movimientos bono=%s · huellas=%s · casados=%s', n1, n2, n3);

    -- ── 3 · el libro cuadra: saldo = Σ monto, y la última línea dice lo mismo
    select count(*) into n1 from public.billeteras;
    select count(*) into n2
      from public.billeteras b
     where b.saldo <> coalesce((select sum(m.monto) from public.movimientos m
                                 where m.jugador_id = b.jugador_id), 0)
        or b.saldo <> coalesce((select m.saldo_tras from public.movimientos m
                                 where m.jugador_id = b.jugador_id
                                 order by m.id desc limit 1), 0);
    select count(distinct m.jugador_id) into n3
      from public.movimientos m
     where not exists (select 1 from public.billeteras b where b.jugador_id = m.jugador_id);
    v_o := v_o || 3; v_p := array_append(v_p, '3 · saldo = Σ movimientos'::text);
    v_r := v_r || case when n2 = 0 and n3 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('billeteras=%s · descuadradas=%s · libro sin billetera=%s', n1, n2, n3);

    -- ── 7 · correo canónico ───────────────────────────────────────────────
    t1 := public.correo_canonico('Vi.Ctor+prueba@GoogleMail.com');
    t2 := public.correo_canonico('Vi.Ctor+x@outlook.com');
    v_o := v_o || 7; v_p := array_append(v_p, '7 · correo canónico'::text);
    v_r := v_r || case when t1 = 'victor@gmail.com' and t2 = 'vi.ctor+x@outlook.com' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('gmail→%s · outlook→%s', t1, t2);

    -- ── 8 · el día de Chicago ─────────────────────────────────────────────
    t1 := public.dia_chicago('2026-10-07 04:30+00')::text;
    t2 := public.dia_chicago('2026-10-07 05:30+00')::text;
    v_o := v_o || 8; v_p := array_append(v_p, '8 · día de Chicago'::text);
    v_r := v_r || case when t1 = '2026-10-06' and t2 = '2026-10-07' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('04:30Z→%s · 05:30Z→%s', t1, t2);

    -- ── 9 · saldo_de lee la billetera (todas las cuentas reales) ─────────
    select count(*), count(*) filter (where public.saldo_de(p.id) <> coalesce(b.saldo, 0))
      into n1, n2
      from public.profiles p left join public.billeteras b on b.jugador_id = p.id;
    v_o := v_o || 9; v_p := array_append(v_p, '9 · saldo_de = billetera'::text);
    v_r := v_r || case when n1 > 0 and n2 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('perfiles=%s · distintos=%s', n1, n2);

    -- ── 10 · fuera de Realtime, RLS activo y sin políticas ───────────────
    select count(*) into n1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public'
       and tablename in ('billeteras', 'movimientos', 'bonos_bienvenida', 'intentos_dinero');
    select count(*) into n2 from pg_class c join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and c.relrowsecurity
       and c.relname in ('billeteras', 'movimientos', 'bonos_bienvenida', 'intentos_dinero');
    select count(*) into n3 from pg_policies
     where schemaname = 'public'
       and tablename in ('billeteras', 'movimientos', 'bonos_bienvenida', 'intentos_dinero');
    v_o := v_o || 10; v_p := array_append(v_p, '10 · sin Realtime, RLS sin políticas'::text);
    v_r := v_r || case when n1 = 0 and n2 = 4 and n3 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('en realtime=%s · con RLS=%s de 4 · políticas=%s', n1, n2, n3);

    -- ── 11 · qué puede ejecutar `authenticated` ───────────────────────────
    b1 := has_function_privilege('authenticated', 'public.mi_billetera()', 'execute');
    b2 := has_function_privilege('authenticated', 'public.aplicar_movimiento(uuid, text, bigint, text, text, text, text)', 'execute')
       or has_function_privilege('authenticated', 'public.ajuste_admin(uuid, bigint, text)', 'execute')
       or has_function_privilege('authenticated', 'public.saldo_de(uuid)', 'execute');
    b3 := has_function_privilege('anon', 'public.mi_billetera()', 'execute')
       or has_table_privilege('authenticated', 'public.billeteras', 'select')
       or has_table_privilege('authenticated', 'public.movimientos', 'select');
    v_o := v_o || 11; v_p := array_append(v_p, '11 · permisos de authenticated'::text);
    v_r := v_r || case when b1 and not b2 and not b3 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('mi_billetera=%s · aplicar/ajuste/saldo_de=%s · anon o lectura de tablas=%s', b1, b2, b3);

    -- ═══ Desde aquí, con tres cuentas fabricadas (se deshacen al final) ═══
    -- UNO y DOS comparten correo canónico (puntos, `+` y googlemail): sólo el
    -- primero cobra. TRES llega con el mismo correo tras borrar a UNO.
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (UNO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'Eco1a.Verif+uno@GoogleMail.com', '', now(), now(), '{}', '{}'),
           (DOS, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1averif@gmail.com', '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (UNO, 'EcoVerifUno');
    insert into public.profiles (id, username) values (DOS, 'EcoVerifDos');

    -- ── 12 · el bono, una vez por correo canónico ─────────────────────────
    select b.saldo into s0 from public.billeteras b where b.jugador_id = UNO;
    select b.saldo into s1 from public.billeteras b where b.jugador_id = DOS;
    select count(*) into n1 from public.movimientos where jugador_id = DOS;
    v_o := v_o || 12; v_p := array_append(v_p, '12 · bono por correo canónico'::text);
    v_r := v_r || case when s0 = 2500 and s1 = 0 and n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('1.ª cuenta=%s · 2.ª con el mismo correo=%s · movimientos de la 2.ª=%s',
                         coalesce(s0::text, 'sin billetera'), coalesce(s1::text, 'sin billetera'), n1);

    -- ── 4 · una clave repetida no paga dos veces ──────────────────────────
    r1 := public.aplicar_movimiento(UNO, 'constancia', 100, 'eco1a:verif:repetida', 'prueba', null, null);
    r2 := public.aplicar_movimiento(UNO, 'constancia', 100, 'eco1a:verif:repetida', 'prueba', null, null);
    select b.saldo into s1 from public.billeteras b where b.jugador_id = UNO;
    select count(*) into n1 from public.movimientos where clave_idem = 'eco1a:verif:repetida';
    v_o := v_o || 4; v_p := array_append(v_p, '4 · clave repetida no paga dos veces'::text);
    v_r := v_r || case when r1.aplicado and r1.motivo = 'aplicado'
                        and r2.aplicado and r2.motivo = 'repetido'
                        and s1 = s0 + 100 and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('1.ª=%s · 2.ª=%s · saldo %s→%s · líneas=%s', r1.motivo, r2.motivo, s0, s1, n1);

    -- ── 5 · saldo insuficiente: no aplica y lo dice ───────────────────────
    s0 := s1;
    r1 := public.aplicar_movimiento(UNO, 'entrada_ia', -(s0 + 1), 'eco1a:verif:negativo', 'prueba', null, null);
    select b.saldo into s1 from public.billeteras b where b.jugador_id = UNO;
    select count(*) into n1 from public.movimientos where clave_idem = 'eco1a:verif:negativo';
    v_o := v_o || 5; v_p := array_append(v_p, '5 · saldo insuficiente no aplica'::text);
    v_r := v_r || case when not r1.aplicado and r1.motivo = 'saldo_insuficiente'
                        and r1.saldo = s0 and s1 = s0 and n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('aplicado=%s · motivo=%s · saldo %s→%s · líneas=%s', r1.aplicado, r1.motivo, s0, s1, n1);

    -- ── 6 · ajuste del administrador: sin motivo no, con motivo sí ───────
    s0 := s1;
    r1 := public.ajuste_admin(UNO, 50, '   ');
    r2 := public.ajuste_admin(UNO, 50, 'verificacion eco1a');
    select b.saldo into s1 from public.billeteras b where b.jugador_id = UNO;
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'ajuste_admin';
    v_o := v_o || 6; v_p := array_append(v_p, '6 · ajuste_admin exige motivo'::text);
    v_r := v_r || case when not r1.aplicado and r1.motivo = 'motivo_obligatorio'
                        and r2.aplicado and r2.saldo = s0 + 50 and s1 = s0 + 50 and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('sin motivo=%s · con motivo=%s · saldo %s→%s', r1.motivo, r2.motivo, s0, s1);

    -- ── 13 · saldo_de sigue a la billetera cuando se mueve ───────────────
    v_o := v_o || 13; v_p := array_append(v_p, '13 · saldo_de tras moverse'::text);
    v_r := v_r || case when public.saldo_de(UNO) = s1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('saldo_de=%s · billetera=%s', public.saldo_de(UNO), s1);

    -- ── 14 · mi_billetera con la sesión de UNO, y sin sesión ─────────────
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
    n1 := public.mi_billetera();
    perform set_config('request.jwt.claims', '', true);
    n2 := public.mi_billetera();
    v_o := v_o || 14; v_p := array_append(v_p, '14 · mi_billetera'::text);
    v_r := v_r || case when n1 = s1 and n2 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('con sesión=%s · sin sesión=%s', n1, n2);

    -- ── 15 · el límite de frecuencia anota y corta sin abortar ───────────
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
    b1 := public.contar_intento_dinero('eco1a_prueba', 2);
    b2 := public.contar_intento_dinero('eco1a_prueba', 2);
    b3 := public.contar_intento_dinero('eco1a_prueba', 2);
    select count(*) into n1 from public.intentos_dinero where jugador_id = UNO and funcion = 'eco1a_prueba';
    v_o := v_o || 15; v_p := array_append(v_p, '15 · límite de frecuencia'::text);
    v_r := v_r || case when b1 and b2 and not b3 and n1 = 3 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('1.º=%s · 2.º=%s · 3.º=%s · anotados=%s', b1, b2, b3, n1);

    -- ── 16 · aviso de transición (§6): la entrada ya mira el saldo real ──
    -- UNO tiene 2.650: la mesa de 200 pide 3.000 y rebota; la de 100 pide
    -- 1.500 y entra (MOT-1 1d-ii).
    begin
      perform public.crear_sala('privada', 2::smallint, 200);
      t1 := 'entró';
    exception when others then t1 := sqlerrm;
    end;
    begin
      sala := public.crear_sala('privada', 2::smallint, 100);
      t2 := case when sala.id is not null then 'entró' else 'sin mesa' end;
    exception when others then t2 := sqlerrm;
    end;
    v_o := v_o || 16; v_p := array_append(v_p, '16 · crear_sala con saldo real'::text);
    v_r := v_r || case when t1 = 'saldo_insuficiente' and t2 = 'entró' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('saldo=%s · mesa de 200→%s · mesa de 100→%s', s1, t1, t2);
    perform set_config('request.jwt.claims', '', true);

    -- ── 20 · un 'repetido' devuelve el saldo de AHORA (rector, M-2) ───────
    -- Se cobra una clave, se mueve otra cosa, y se reintenta la primera.
    r1 := public.aplicar_movimiento(UNO, 'constancia', 10, 'eco1a:verif:actual', 'prueba', null, null);
    s0 := r1.saldo;
    r2 := public.aplicar_movimiento(UNO, 'video', 5, 'eco1a:verif:otro', 'prueba', null, null);
    r1 := public.aplicar_movimiento(UNO, 'constancia', 10, 'eco1a:verif:actual', 'prueba', null, null);
    select b.saldo into s1 from public.billeteras b where b.jugador_id = UNO;
    v_o := v_o || 20; v_p := array_append(v_p, '20 · repetido da el saldo actual'::text);
    v_r := v_r || case when r1.aplicado and r1.motivo = 'repetido'
                        and r1.saldo = s1 and r1.saldo = s0 + 5 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('tras la 1.ª=%s · ahora=%s · el reintento dice %s (%s)', s0, s1, r1.saldo, r1.motivo);

    -- ── 19 · el saldo no se toca a mano (rector, M-5) ─────────────────────
    -- Justo después de `aplicar_movimiento`: así se ve también que la marca
    -- del libro no se quedó puesta.
    begin
      update public.billeteras set saldo = saldo + 1000 where jugador_id = UNO;
      t1 := 'se editó';
    exception when others then t1 := sqlerrm;
    end;
    select b.saldo into s0 from public.billeteras b where b.jugador_id = UNO;
    v_o := v_o || 19; v_p := array_append(v_p, '19 · update manual del saldo, rechazado'::text);
    v_r := v_r || case when t1 = 'billetera_solo_por_libro' and s0 = s1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('update→%s · saldo %s→%s', t1, s1, s0);

    -- ── 21 · una billetera no nace con dinero (rector, M-5) ───────────────
    -- DOS ya tiene la suya en 0: el disparador BEFORE INSERT salta antes que
    -- la clave primaria, así que el rechazo que se lee es el del libro.
    begin
      insert into public.billeteras (jugador_id, saldo) values (DOS, 999);
      t2 := 'entró';
    exception when others then t2 := sqlerrm;
    end;
    v_o := v_o || 21; v_p := array_append(v_p, '21 · insert manual con saldo ≠ 0, rechazado'::text);
    v_r := v_r || case when t2 = 'billetera_solo_por_libro' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('insert con 999→%s', t2);

    -- ── 17 · el libro no se edita ni se borra a mano ─────────────────────
    begin
      update public.movimientos set monto = monto + 1 where jugador_id = UNO;
      t1 := 'se editó';
    exception when others then t1 := sqlerrm;
    end;
    begin
      delete from public.movimientos where jugador_id = UNO;
      t2 := 'se borró';
    exception when others then t2 := sqlerrm;
    end;
    v_o := v_o || 17; v_p := array_append(v_p, '17 · libro de sólo inserción'::text);
    v_r := v_r || case when t1 = 'movimientos_inmutable' and t2 = 'movimientos_inmutable' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('update→%s · delete→%s', t1, t2);

    -- ── 18 · la marca sobrevive al borrado de la cuenta ──────────────────
    select count(*) into n1 from public.bonos_bienvenida;
    delete from auth.users where id = UNO;
    select count(*) into n2 from public.billeteras where jugador_id = UNO;
    select count(*) into n3 from public.bonos_bienvenida;
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (TRES, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'ECO1AVERIF+tres@gmail.com', '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (TRES, 'EcoVerifTres');
    select b.saldo into s0 from public.billeteras b where b.jugador_id = TRES;
    v_o := v_o || 18; v_p := array_append(v_p, '18 · la marca sobrevive al borrado'::text);
    v_r := v_r || case when n2 = 0 and n3 = n1 and s0 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('billetera borrada=%s · huellas %s→%s · cuenta nueva con el mismo correo=%s',
                         n2 = 0, n1, n3, coalesce(s0::text, 'sin billetera'));

    raise exception 'eco1a_deshacer';
  exception when others then
    if sqlerrm <> 'eco1a_deshacer' then
      v_o := v_o || 99; v_p := array_append(v_p, 'X · el guion se detuvo'::text);
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.eco1a_verificar()
 order by orden;

rollback;
