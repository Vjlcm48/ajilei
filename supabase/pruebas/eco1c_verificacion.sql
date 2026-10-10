-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1c — Verificación de las mesas contra las IAS
-- ═══════════════════════════════════════════════════════════════════════════
-- ▓▓ RETIRADO DESDE LA 1d (ECO-1e, E10): ESTE GUION NO SE VUELVE A CORRER ▓▓
-- Tras la migración de la 1d corta en su prueba 9: corre en UNA transacción,
-- `now()` no se mueve, sienta 16 veces a la misma cuenta y la 11.ª es `limite`
-- (informe de la 1d, §1.1). No es una regresión. Sus pruebas críticas —un
-- cobro por mesa, el techo, el libro cuadra— viven en `eco1d_verificacion.sql`
-- (22 y 23); el resto lo vigilan `src/dev/bancoImitado.test.js` y
-- `diagDSK mesaia`. `npm run guiones` no lo corre, y la consulta guardada
-- «ECO-1c · verificación» del SQL Editor tampoco se vuelve a correr. Se queda
-- en el repo como historia de la corrida 19/19 en la base real (informe de la 1c), y como base si
-- una ficha lo adapta para que «pase un minuto» (candidato para la 1g).
--
-- Ficha AJILEI_ECO-1_Fase1c_v1.0.md §2.1. Migración que verifica:
-- supabase/migrations/20261008220239_eco1c_mesas_ia.sql.
--
-- CÓMO SE USA: igual que el de la 1a. Se pega ENTERO en el SQL Editor DESPUÉS
-- del push y se corre UNA vez. Devuelve `prueba | resultado | detalle` y cada
-- fila debe decir PASA. No enseña correos ni uuids de cuentas reales.
--
-- NO DEJA RASTRO, por los mismos dos caminos que el de la 1a: `begin;` …
-- `rollback;`, y una función en `pg_temp` que lo corre todo dentro de un
-- bloque con `exception` y lo deshace lanzando `eco1c_deshacer`. Si la tabla
-- no apareciera por ir antes del `rollback`, se borran esas dos líneas y se
-- corre otra vez: el segundo camino basta solo.
--
-- Fabrica DOS cuentas (UNO y DOS). Cada una nace con el bono de 2.500 de la
-- 1a. La sesión se imita con `request.jwt.claims`, que es lo que lee
-- `auth.uid()`. Si algo revienta, sale una fila `X · el guion se detuvo`.
--
-- La prueba 13 envejece una mesa a mano (`ultimo_aviso_en` hace 11 minutos):
-- es lo único que el guion escribe por fuera de las funciones, y se deshace.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.eco1c_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  UNO constant uuid := 'ec01c000-0000-4000-8000-000000000001';
  DOS constant uuid := 'ec01c000-0000-4000-8000-000000000002';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  r  public.mesa_ia_resultado;
  r2 public.mesa_ia_resultado;
  ra public.mesa_ia_resultado;
  m_a uuid; m_b uuid; m_c uuid; m_d uuid;
  t_a uuid := gen_random_uuid();
  t_b uuid := gen_random_uuid();
  t_c uuid := gen_random_uuid();
  s0 bigint; s1 bigint;
  n1 bigint; n2 bigint; n3 bigint;
  c1 text; c2 text; c3 text; c4 text; c5 text; c6 text; c7 text;
  b1 boolean; b2 boolean; b3 boolean;
  t1 text;
begin
  begin
    -- ═══ Dos cuentas fabricadas (se deshacen al final) ═══════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (UNO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1c.verif.uno@example.com', '', now(), now(), '{}', '{}'),
           (DOS, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1c.verif.dos@example.com', '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (UNO, 'EcoVerifCUno');
    insert into public.profiles (id, username) values (DOS, 'EcoVerifCDos');
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);

    -- ── 1 · sentarse cobra la entrada, una vez ───────────────────────────
    -- Básico, 2 jugadores, apuesta 50, entrada al piso (500).
    -- Techo = 500 + 1·min(750, 2.500) = 1.250.
    s0 := public.mi_billetera();
    r := public.sentarse_ia('basico', 2, 50, 500, t_a, 'disp-A');
    m_a := r.mesa_id;
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'entrada_ia';
    v_o := v_o || 1; v_p := array_append(v_p, '1 · sentarse cobra la entrada'::text);
    v_r := v_r || case when r.codigo = 'ok' and m_a is not null and r.saldo = s0 - 500
                        and r.pila = 500 and r.techo = 1250 and r.seq = 0
                        and not r.anterior_cerrada and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · saldo %s→%s · pila=%s · techo=%s · entradas=%s',
                         r.codigo, s0, r.saldo, r.pila, r.techo, n1);

    -- ── 2 · el mismo token no cobra dos veces ────────────────────────────
    r2 := public.sentarse_ia('basico', 2, 50, 500, t_a, 'disp-A');
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'entrada_ia';
    v_o := v_o || 2; v_p := array_append(v_p, '2 · mismo token, un solo cobro'::text);
    v_r := v_r || case when r2.codigo = 'repetido' and r2.mesa_id = m_a
                        and r2.saldo = r.saldo and n1 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · misma mesa=%s · saldo=%s · entradas=%s',
                         r2.codigo, r2.mesa_id = m_a, r2.saldo, n1);

    -- ── 3 · la combinación se valida (P-1) y sin efectos ─────────────────
    -- Ninguno de estos intentos puede tocar la mesa abierta ni el saldo.
    s0 := public.mi_billetera();
    c1 := (public.sentarse_ia('basico', 2, 50, 450,  gen_random_uuid())).codigo;  -- bajo el piso (10u = 500)
    c2 := (public.sentarse_ia('basico', 2, 50, 525,  gen_random_uuid())).codigo;  -- no múltiplo de u
    c3 := (public.sentarse_ia('basico', 2, 50, 2550, gen_random_uuid())).codigo;  -- sobre el techo (50u)
    c4 := (public.sentarse_ia('basico', 2, 75, 750,  gen_random_uuid())).codigo;  -- apuesta que no existe
    c5 := (public.sentarse_ia('basico', 2, 1000, 10000, gen_random_uuid())).codigo; -- apuesta de otro reto
    c6 := (public.sentarse_ia('basico', 6, 50, 500,  gen_random_uuid())).codigo;  -- seis jugadores
    c7 := (public.sentarse_ia('experto', 2, 50, 500, gen_random_uuid())).codigo;  -- reto desconocido
    select count(*) into n1 from public.mesas_ia where jugador_id = UNO;
    select estado into t1 from public.mesas_ia where id = m_a;
    v_o := v_o || 3; v_p := array_append(v_p, '3 · validación de la mesa, sin efectos'::text);
    v_r := v_r || case when c1 = 'entrada_invalida' and c2 = 'entrada_invalida' and c3 = 'entrada_invalida'
                        and c4 = 'apuesta_invalida' and c5 = 'apuesta_invalida'
                        and c6 = 'jugadores_invalidos' and c7 = 'reto_invalido'
                        and n1 = 1 and t1 = 'abierta' and public.mi_billetera() = s0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('450=%s · 525=%s · 2550=%s · u75=%s · u1000=%s · 6j=%s · reto=%s · mesas=%s · la abierta=%s',
                         c1, c2, c3, c4, c5, c6, c7, n1, t1);

    -- ── 4 · informar_pila: seq viejo ignorado, pila sobre el techo topada ─
    r  := public.informar_pila(m_a, 1, 450);
    r2 := public.informar_pila(m_a, 1, 999);     -- mismo seq: se ignora
    ra := public.informar_pila(m_a, 0, 10);      -- seq viejo: se ignora
    c1 := r.codigo; c2 := r2.codigo; c3 := ra.codigo;
    n1 := ra.pila;
    r  := public.informar_pila(m_a, 2, 5000);    -- por encima del techo (1.250)
    select anomalias into n2 from public.mesas_ia where id = m_a;
    v_o := v_o || 4; v_p := array_append(v_p, '4 · informar_pila: seq y techo'::text);
    v_r := v_r || case when c1 = 'ok' and c2 = 'repetido' and c3 = 'repetido' and n1 = 450
                        and r.codigo = 'ok' and r.pila = 1250 and r.seq = 2 and n2 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('seq1=%s · seq1 otra vez=%s · seq0=%s · pila tras ellos=%s · 5000→%s · anomalías=%s',
                         c1, c2, c3, n1, r.pila, n2);

    -- ── 5 · el récord suma una mano por fin de mano, una sola vez ────────
    r  := public.informar_pila(m_a, 3, 400, 2, true);
    r2 := public.informar_pila(m_a, 3, 400, 2, true);   -- reintento del mismo aviso
    ra := public.informar_pila(m_a, 4, 350, 2, false);
    perform public.informar_pila(m_a, 5, 350, 7, false); -- vivos imposibles: no cuenta
    select coalesce(sum(jugadas), 0), coalesce(sum(ganadas_humano), 0), coalesce(sum(ganadas_ia), 0)
      into n1, n2, n3 from public.record_manos where jugador_id = UNO;
    v_o := v_o || 5; v_p := array_append(v_p, '5 · récord: una mano por aviso'::text);
    v_r := v_r || case when r.codigo = 'ok' and r2.codigo = 'repetido' and ra.codigo = 'ok'
                        and n1 = 2 and n2 = 1 and n3 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('aviso=%s · reintento=%s · jugadas=%s · humano=%s · ia=%s',
                         r.codigo, r2.codigo, n1, n2, n3);

    -- ── 6 · recargar cobra, sube el techo y la pila ──────────────────────
    -- Pila 350, recarga 500 → pila 850. Techo 1.250 + 500 + 1·2.500 = 4.250.
    s0 := public.mi_billetera();
    r  := public.recargar_ia(m_a, 500, 6);
    r2 := public.recargar_ia(m_a, 500, 6);       -- doble toque
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'recarga_ia';
    v_o := v_o || 6; v_p := array_append(v_p, '6 · recargar cobra y sube el techo'::text);
    v_r := v_r || case when r.codigo = 'ok' and r.saldo = s0 - 500 and r.pila = 850 and r.techo = 4250
                        and r2.codigo = 'repetido' and r2.saldo = r.saldo and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · saldo %s→%s · pila=%s · techo=%s · reintento=%s · recargas=%s',
                         r.codigo, s0, r.saldo, r.pila, r.techo, r2.codigo, n1);

    -- ── 7 · recargar: techo de la mesa, múltiplo y saldo (P-3) ───────────
    -- Pila 850 en mesa de 50 (T = 2.500): 1.700 la pasaría; 1.650 cabe.
    s0 := public.mi_billetera();
    c1 := (public.recargar_ia(m_a, 1700, 7)).codigo;
    c2 := (public.recargar_ia(m_a, 75, 8)).codigo;
    c3 := (public.recargar_ia(m_a, s0 + 50, 9)).codigo;
    v_o := v_o || 7; v_p := array_append(v_p, '7 · recarga sobre el techo, no múltiplo, sin saldo'::text);
    v_r := v_r || case when c1 = 'sobre_techo' and c2 = 'monto_invalido'
                        and c3 in ('saldo_insuficiente', 'sobre_techo')
                        and public.mi_billetera() = s0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('1.700=%s · 75=%s · saldo+50=%s · saldo intacto=%s',
                         c1, c2, c3, public.mi_billetera() = s0);

    -- ── 8 · salir cobra una sola vez y nunca por encima del techo ────────
    s0 := public.mi_billetera();
    r  := public.salir_ia(m_a, 99999, 10);
    r2 := public.salir_ia(m_a, 99999, 11);       -- doble toque
    select count(*), coalesce(sum(monto), 0) into n1, n2
      from public.movimientos where jugador_id = UNO and tipo = 'salida_ia';
    v_o := v_o || 8; v_p := array_append(v_p, '8 · salir: un cobro, topado por el techo'::text);
    v_r := v_r || case when r.codigo = 'ok' and r.cobrado = 4250 and r.saldo = s0 + 4250
                        and r.motivo_cierre = 'salida'
                        and r2.codigo = 'repetido' and r2.cobrado = 4250 and r2.saldo = r.saldo
                        and n1 = 1 and n2 = 4250 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · cobrado=%s · saldo %s→%s · reintento=%s (%s) · salidas=%s por %s',
                         r.codigo, r.cobrado, s0, r.saldo, r2.codigo, r2.cobrado, n1, n2);

    -- ── 9 · sentarse con una mesa abierta la cierra y devuelve lo cobrado (C4/C5)
    -- Mesa B con «Otra…» (600 = 12u, P-1), pila avisada 700. Al abrir la C, B
    -- se cierra como 'reemplazada', vuelven sus 700 y la C lo dice.
    r := public.sentarse_ia('basico', 3, 50, 600, t_b, 'disp-A');
    m_b := r.mesa_id;
    perform public.informar_pila(m_b, 1, 700);
    s0 := public.mi_billetera();
    r  := public.sentarse_ia('avanzado', 2, 100, 1000, t_c, 'disp-B');
    m_c := r.mesa_id;
    r2 := public.sentarse_ia('avanzado', 2, 100, 1000, t_c, 'disp-B');   -- reintento: mismo aviso
    select estado || '/' || motivo_cierre || '/' || cobrado into t1 from public.mesas_ia where id = m_b;
    select count(*) into n1 from public.movimientos
     where jugador_id = UNO and tipo = 'abandono_ia' and clave_idem = 'abandono_ia:' || m_b::text and monto = 700;
    v_o := v_o || 9; v_p := array_append(v_p, '9 · sentarse cierra la vieja y lo dice'::text);
    v_r := v_r || case when r.codigo = 'ok' and r.anterior_cerrada and r.anterior_cobro = 700
                        and r.saldo = s0 + 700 - 1000 and t1 = 'cerrada/reemplazada/700' and n1 = 1
                        and r2.codigo = 'repetido' and r2.mesa_id = m_c
                        and r2.anterior_cerrada and r2.anterior_cobro = 700
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · anterior=%s (%s) · saldo %s→%s · B=%s · abandonos=%s · reintento=%s/%s',
                         r.codigo, r.anterior_cerrada, r.anterior_cobro, s0, r.saldo, t1, n1,
                         r2.codigo, r2.anterior_cobro);

    -- ── 10 · una sola mesa abierta por cuenta (el índice) ────────────────
    select count(*) into n1 from public.mesas_ia where jugador_id = UNO and estado = 'abierta';
    begin
      insert into public.mesas_ia (jugador_id, reto, jugadores, apuesta, entrada,
                                   techo_cobro, pila_informada, token_apertura)
      values (UNO, 'basico', 2, 50, 500, 1250, 500, gen_random_uuid());
      t1 := 'entró';
    exception when unique_violation then t1 := 'rechazada';
    end;
    v_o := v_o || 10; v_p := array_append(v_p, '10 · una sola mesa abierta por cuenta'::text);
    v_r := v_r || case when n1 = 1 and t1 = 'rechazada' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('abiertas=%s · segunda abierta a mano→%s', n1, t1);

    -- ── 11 · la mesa cerrada lo dice (C6) ────────────────────────────────
    c1 := (public.informar_pila(m_b, 9, 100)).codigo;
    c2 := (public.recargar_ia(m_b, 50, 10)).codigo;
    r  := public.salir_ia(m_b, 100, 11);
    v_o := v_o || 11; v_p := array_append(v_p, '11 · la mesa reemplazada responde mesa_cerrada'::text);
    v_r := v_r || case when c1 = 'mesa_cerrada' and c2 = 'mesa_cerrada' and r.codigo = 'mesa_cerrada'
                        and r.motivo_cierre = 'reemplazada' and r.cobrado = 700 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('aviso=%s · recarga=%s · salida=%s (%s, %s)', c1, c2, r.codigo, r.motivo_cierre, r.cobrado);

    -- ── 12 · saldo insuficiente al sentarse: no cierra la vieja ──────────
    -- C sigue abierta (pila 1.000). Una entrada que no cabe ni con su
    -- devolución no puede tocarla.
    s0 := public.mi_billetera();
    r := public.sentarse_ia('pro', 2, 1000, 50000, gen_random_uuid());
    select estado into t1 from public.mesas_ia where id = m_c;
    v_o := v_o || 12; v_p := array_append(v_p, '12 · saldo insuficiente, sin efectos'::text);
    v_r := v_r || case when r.codigo = 'saldo_insuficiente' and t1 = 'abierta'
                        and public.mi_billetera() = s0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · C=%s · saldo %s→%s', r.codigo, t1, s0, public.mi_billetera());

    -- ── 13 · recoger_mesa_ia al arrancar (P-4) ───────────────────────────
    -- C es de 'disp-B' y está fresca: desde 'disp-A' se respeta; desde
    -- 'disp-B' se recoge (la página se recargó). Después, una D de 'disp-A'
    -- envejecida 11 min se recoge desde cualquier otro.
    c1 := (public.recoger_mesa_ia('disp-A')).codigo;
    s0 := public.mi_billetera();
    r  := public.recoger_mesa_ia('disp-B');
    r2 := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-A');
    m_d := r2.mesa_id;
    update public.mesas_ia set ultimo_aviso_en = now() - interval '11 minutes' where id = m_d;
    ra := public.recoger_mesa_ia('disp-Z');
    c2 := (public.recoger_mesa_ia('disp-Z')).codigo;
    v_o := v_o || 13; v_p := array_append(v_p, '13 · recoger: mismo dispositivo, 10 min, ninguna'::text);
    v_r := v_r || case when c1 = 'viva'
                        and r.codigo = 'recogida' and r.mesa_id = m_c and r.cobrado = 1000
                        and r.motivo_cierre = 'abandono' and r.saldo = s0 + 1000
                        and ra.codigo = 'recogida' and ra.mesa_id = m_d and ra.cobrado = 500
                        and c2 = 'ninguna' then 'PASA' else 'FALLA' end;
    v_d := v_d || format('otro disp. fresca=%s · mismo disp.=%s (%s) · silencio 11 min=%s (%s) · después=%s',
                         c1, r.codigo, r.cobrado, ra.codigo, ra.cobrado, c2);

    -- ── 14 · salir con 0 fichas cierra sin movimiento ────────────────────
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid());
    s0 := public.mi_billetera();
    r2 := public.salir_ia(r.mesa_id, 0, 1);
    select count(*) into n1 from public.movimientos
     where clave_idem = 'salida_ia:' || r.mesa_id::text;
    v_o := v_o || 14; v_p := array_append(v_p, '14 · salir con 0, sin movimiento'::text);
    v_r := v_r || case when r2.codigo = 'ok' and r2.cobrado = 0 and r2.motivo_cierre = 'salida'
                        and r2.saldo = s0 and n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · cobrado=%s · saldo=%s · movimientos=%s', r2.codigo, r2.cobrado, r2.saldo, n1);

    -- ── 15 · otra cuenta no toca mi mesa; sin sesión, nada ───────────────
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid());
    perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
    c1 := (public.informar_pila(r.mesa_id, 1, 2000)).codigo;
    c2 := (public.salir_ia(r.mesa_id, 2000, 1)).codigo;
    c3 := (public.recargar_ia(r.mesa_id, 500, 1)).codigo;
    perform set_config('request.jwt.claims', '', true);
    c4 := (public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid())).codigo;
    select count(*) into n1 from public.mi_mesa_ia();
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
    select count(*) into n2 from public.mi_mesa_ia();
    select pila_informada into n3 from public.mesas_ia where id = r.mesa_id;
    v_o := v_o || 15; v_p := array_append(v_p, '15 · ajena y sin sesión'::text);
    v_r := v_r || case when c1 = 'sin_mesa' and c2 = 'sin_mesa' and c3 = 'sin_mesa' and c4 = 'sin_sesion'
                        and n1 = 0 and n2 = 1 and n3 = 500 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('DOS aviso=%s · salida=%s · recarga=%s · sin sesión=%s · mi_mesa sin sesión=%s · de UNO=%s · pila intacta=%s',
                         c1, c2, c3, c4, n1, n2, n3);
    perform public.salir_ia(r.mesa_id, 500, 1);

    -- ── 16 · el cliente no lee las tablas y sólo llama a sus seis ────────
    b1 := has_table_privilege('authenticated', 'public.mesas_ia', 'select')
       or has_table_privilege('authenticated', 'public.record_manos', 'select')
       or has_table_privilege('anon', 'public.mesas_ia', 'select')
       or has_table_privilege('anon', 'public.record_manos', 'select');
    b2 := has_function_privilege('authenticated', 'public.sentarse_ia(text, integer, integer, bigint, uuid, text)', 'execute')
      and has_function_privilege('authenticated', 'public.recargar_ia(uuid, bigint, integer)', 'execute')
      and has_function_privilege('authenticated', 'public.informar_pila(uuid, integer, bigint, integer, boolean)', 'execute')
      and has_function_privilege('authenticated', 'public.salir_ia(uuid, bigint, integer)', 'execute')
      and has_function_privilege('authenticated', 'public.mi_mesa_ia()', 'execute')
      and has_function_privilege('authenticated', 'public.recoger_mesa_ia(text)', 'execute');
    b3 := has_function_privilege('authenticated', 'public.cerrar_partida_abierta(uuid, text)', 'execute')
       or has_function_privilege('authenticated', 'public.record_manos_resumen()', 'execute')
       or has_function_privilege('anon', 'public.sentarse_ia(text, integer, integer, bigint, uuid, text)', 'execute')
       or has_function_privilege('anon', 'public.informar_pila(uuid, integer, bigint, integer, boolean)', 'execute');
    v_o := v_o || 16; v_p := array_append(v_p, '16 · permisos del cliente'::text);
    v_r := v_r || case when not b1 and b2 and not b3 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('lee tablas=%s · las seis=%s · internas o anon=%s', b1, b2, b3);

    -- ── 17 · fuera de Realtime, RLS activo y sin políticas ───────────────
    select count(*) into n1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('mesas_ia', 'record_manos');
    select count(*) into n2 from pg_class c join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and c.relrowsecurity and c.relname in ('mesas_ia', 'record_manos');
    select count(*) into n3 from pg_policies
     where schemaname = 'public' and tablename in ('mesas_ia', 'record_manos');
    v_o := v_o || 17; v_p := array_append(v_p, '17 · sin Realtime, RLS sin políticas'::text);
    v_r := v_r || case when n1 = 0 and n2 = 2 and n3 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('en realtime=%s · con RLS=%s de 2 · políticas=%s', n1, n2, n3);

    -- ── 18 · el libro sigue cuadrando, y cada cobro de mesa está una vez ─
    select count(*) into n1
      from public.billeteras b
     where b.saldo <> coalesce((select sum(m.monto) from public.movimientos m
                                 where m.jugador_id = b.jugador_id), 0);
    -- Cada mesa cerrada con cobro > 0 tiene EXACTAMENTE un movimiento de cierre
    -- por ese monto; y ninguna mesa tiene dos.
    select count(*) into n2
      from public.mesas_ia x
     where x.estado = 'cerrada' and x.cobrado > 0
       and (select count(*) from public.movimientos m
             where m.ref_tipo = 'mesa_ia' and m.ref_id = x.id::text
               and m.tipo in ('salida_ia', 'abandono_ia') and m.monto = x.cobrado) <> 1;
    select count(*) into n3
      from (select m.ref_id from public.movimientos m
             where m.ref_tipo = 'mesa_ia' and m.tipo in ('salida_ia', 'abandono_ia')
             group by m.ref_id having count(*) > 1) d;
    v_o := v_o || 18; v_p := array_append(v_p, '18 · el libro cuadra y cada mesa cobra una vez'::text);
    v_r := v_r || case when n1 = 0 and n2 = 0 and n3 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('billeteras descuadradas=%s · mesas sin su cobro=%s · mesas con dos cobros=%s', n1, n2, n3);

    -- ── 19 · la consulta de Victor ───────────────────────────────────────
    select count(*) into n1 from public.record_manos_resumen() x where x.reto = 'basico' and x.vivos = 2 and x.jugadas >= 2;
    select count(*) into n2 from public.record_manos_resumen() x where x.vivos is null;
    v_o := v_o || 19; v_p := array_append(v_p, '19 · record_manos_resumen'::text);
    v_r := v_r || case when n1 = 1 and n2 >= 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('fila básico·2=%s · filas de total=%s', n1, n2);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'eco1c_deshacer';
  exception when others then
    if sqlerrm <> 'eco1c_deshacer' then
      v_o := v_o || 99; v_p := array_append(v_p, 'X · el guion se detuvo'::text);
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.eco1c_verificar()
 order by orden;

rollback;
