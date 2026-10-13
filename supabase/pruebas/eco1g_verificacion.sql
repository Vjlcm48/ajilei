-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1g — Verificación del video de recompensa (el boleto)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_ECO-1_Fase1g_v1.0.md §2.1. Migración que verifica:
-- supabase/migrations/20261012230807_eco1g_video.sql.
--
-- CÓMO SE USA: igual que los de la 1a y la 1d. Se pega ENTERO en el SQL Editor
-- DESPUÉS del push y se corre UNA vez. Devuelve `prueba | resultado | detalle`
-- y cada fila debe decir PASA. No enseña correos ni uuids de cuentas reales.
-- Antes del push lo corre `npm run guiones` contra un Postgres en memoria.
--
-- NO DEJA RASTRO, por los mismos dos caminos: `begin;` … `rollback;`, y una
-- función en `pg_temp` que lo corre todo dentro de un bloque con `exception`
-- y lo deshace lanzando `eco1g_deshacer`.
--
-- Fabrica CUATRO cuentas (UNO a CUATRO), cada una con su bono de 2.500.
--
-- EL RELOJ. Todo el guion es UNA transacción, así que `now()` no se mueve. El
-- tiempo «pasa» envejeciendo filas, que es lo único que el guion escribe por
-- fuera de las funciones, y se deshace:
--   · «pasaron 35 s»      `emitido_en - 36 s` en el boleto;
--   · «pasaron 10 min»    `emitido_en` y `vence_en - 11 min` en el boleto;
--   · «es el día siguiente» `cobrado_en - 26 h` en los boletos cobrados (26 y
--     no 24: el día del cambio de hora de otoño dura 25);
--   · «pasó un minuto»    `en - 2 min` en las anotaciones de `intentos_dinero`.
-- Y UNA fila fabricada a mano, en la prueba 11, para llegar a una guarda que
-- por las funciones no se alcanza; se borra en la misma prueba.
-- Por el reloj quieto, todos los intentos de una cuenta caen en el mismo
-- minuto: el guion reparte las pruebas entre cuentas para no tropezar con los
-- límites donde no los busca.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.eco1g_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  UNO    constant uuid := 'ec01f000-0000-4000-8000-000000000001';
  DOS    constant uuid := 'ec01f000-0000-4000-8000-000000000002';
  TRES   constant uuid := 'ec01f000-0000-4000-8000-000000000003';
  CUATRO constant uuid := 'ec01f000-0000-4000-8000-000000000004';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  hoy date := public.dia_chicago(now());
  e   public.video_estado;
  e2  public.video_estado;
  b   public.boleto_video_resultado;
  b2  public.boleto_video_resultado;
  c   public.cobro_video_resultado;
  c2  public.cobro_video_resultado;
  c3  public.cobro_video_resultado;
  id_a uuid; id_b uuid; id_c uuid; id_x uuid; id_f uuid; id_4 uuid; id_t uuid;
  s0 bigint; s1 bigint;
  p_pronto bigint; p_ok bigint;
  n1 bigint; n2 bigint; n3 bigint; n4 bigint;
  ok1 boolean; ok2 boolean; ok3 boolean;
  t1 text;
  i integer;
begin
  begin
    -- ═══ Cuatro cuentas fabricadas (se deshacen al final) ════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (UNO,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1g.verif.uno@example.com', '', now(), now(), '{}', '{}'),
           (DOS,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1g.verif.dos@example.com', '', now(), now(), '{}', '{}'),
           (TRES,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1g.verif.tres@example.com', '', now(), now(), '{}', '{}'),
           (CUATRO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1g.verif.cuatro@example.com', '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (UNO,    'EcoVerifGUno');
    insert into public.profiles (id, username) values (DOS,    'EcoVerifGDos');
    insert into public.profiles (id, username) values (TRES,   'EcoVerifGTres');
    insert into public.profiles (id, username) values (CUATRO, 'EcoVerifGCuatro');

    -- ── 1 · las cifras, cada una en su sitio ─────────────────────────────
    v_o := v_o || 1; v_p := array_append(v_p, '1 · las cifras del video y los topes por minuto'::text);
    v_r := v_r || case when public.video_premio_hc() = 500 and public.video_tope_dia() = 8
                        and public.video_minimo_s() = 35 and public.video_vida_boleto() = interval '10 minutes'
                        and public.limite_dinero('pedir_boleto') = 10 and public.limite_dinero('cobrar_boleto') = 20
                        and public.limite_dinero('mi_video') is null
                        and public.limite_dinero('sentarse_ia') = 10 and public.limite_dinero('recargar_ia') = 20
                        and public.limite_dinero('salir_ia') = 30 and public.limite_dinero('recoger_mesa_ia') = 10
                        and public.limite_dinero('marcar_ingreso') = 6
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('premio=%s · tope=%s · mínimo=%s s · vida=%s · pedir=%s/min · cobrar=%s/min · mi_video=%s · los cinco de la 1d=%s/%s/%s/%s/%s',
                         public.video_premio_hc(), public.video_tope_dia(), public.video_minimo_s(),
                         public.video_vida_boleto(), public.limite_dinero('pedir_boleto'),
                         public.limite_dinero('cobrar_boleto'),
                         coalesce(public.limite_dinero('mi_video')::text, 'sin límite'),
                         public.limite_dinero('sentarse_ia'), public.limite_dinero('recargar_ia'),
                         public.limite_dinero('salir_ia'), public.limite_dinero('recoger_mesa_ia'),
                         public.limite_dinero('marcar_ingreso'));

    -- ═══ EL RECORRIDO DE UN VIDEO ════════════════════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);

    -- ── 2 · mi_video antes de nada: 8 de 8 y la medianoche de Chicago ────
    e := public.mi_video();
    select count(*) into n1 from public.intentos_dinero where jugador_id = UNO;
    v_o := v_o || 2; v_p := array_append(v_p, '2 · mi_video: quedan 8 de 8, el reloj y el reinicio; no anota'::text);
    v_r := v_r || case when e.codigo = 'ok' and e.quedan = 8 and e.tope = 8 and e.ahora = now()
                        and e.reinicio_en > now() and e.reinicio_en <= now() + interval '25 hours'
                        and public.dia_chicago(e.reinicio_en) = hoy + 1
                        and (e.reinicio_en at time zone 'America/Chicago')::time = time '00:00'
                        and n1 = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · quedan %s de %s · reloj del servidor=%s · reinicio a las %s de Chicago, en %s · anotados=%s',
                         e.codigo, e.quedan, e.tope, e.ahora = now(),
                         (e.reinicio_en at time zone 'America/Chicago')::time,
                         date_trunc('minute', e.reinicio_en - now()), n1);

    -- ── 3 · pedir: un boleto vivo, sin cobro ─────────────────────────────
    s0 := public.mi_billetera();
    b  := public.pedir_boleto();
    id_a := b.boleto_id;
    select count(*) into n1 from public.boletos_video
     where jugador_id = UNO and cobrado_en is null and anulado_en is null;
    select count(*) into n2 from public.movimientos where jugador_id = UNO and tipo = 'video';
    v_o := v_o || 3; v_p := array_append(v_p, '3 · pedir_boleto: un boleto vivo de 10 min, sin cobro'::text);
    v_r := v_r || case when b.codigo = 'ok' and id_a is not null and b.emitido_en = now()
                        and b.vence_en = now() + interval '10 minutes' and b.ahora = now()
                        and b.minimo_s = 35 and b.quedan = 8 and b.reinicio_en = e.reinicio_en
                        and n1 = 1 and n2 = 0 and public.mi_billetera() = s0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · con boleto=%s · vive %s · mínimo=%s s · quedan=%s · vivos=%s · movimientos=%s · saldo intacto=%s',
                         b.codigo, id_a is not null, b.vence_en - b.emitido_en, b.minimo_s, b.quedan, n1, n2,
                         public.mi_billetera() = s0);

    -- ── 4 · cobrar antes de los 35 s: demasiado pronto, sin cobro ────────
    c := public.cobrar_boleto(id_a);
    p_pronto := c.premio;
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'video';
    select count(*) into n2 from public.boletos_video where id = id_a and cobrado_en is null and anulado_en is null;
    v_o := v_o || 4; v_p := array_append(v_p, '4 · antes de 35 s: demasiado_pronto, y dice cuánto falta'::text);
    v_r := v_r || case when c.codigo = 'demasiado_pronto' and c.faltan_s = 35 and c.cobrado = 0
                        and c.saldo = s0 and c.quedan = 8 and n1 = 0 and n2 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · faltan %s s · cobrado=%s · saldo %s→%s · movimientos=%s · el boleto sigue vivo=%s',
                         c.codigo, c.faltan_s, c.cobrado, s0, c.saldo, n1, n2 = 1);

    -- ── 5 · pasados 35 s: +500, una línea `video` ────────────────────────
    update public.boletos_video set emitido_en = emitido_en - interval '36 seconds' where id = id_a;
    c := public.cobrar_boleto(id_a);
    p_ok := c.premio;
    e := public.mi_video();
    select count(*), coalesce(sum(monto), 0) into n1, n2
      from public.movimientos where jugador_id = UNO and tipo = 'video';
    select count(*) into n3 from public.movimientos
     where clave_idem = 'video:' || id_a::text and ref_tipo = 'boleto_video' and ref_id = id_a::text
       and saldo_tras = s0 + 500;
    v_o := v_o || 5; v_p := array_append(v_p, '5 · tras 35 s: cobra 500, una línea video, quedan 7'::text);
    v_r := v_r || case when c.codigo = 'ok' and c.cobrado = 500 and c.saldo = s0 + 500 and c.quedan = 7
                        and c.faltan_s = 0 and e.quedan = 7 and n1 = 1 and n2 = 500 and n3 = 1
                        and (select x.cobrado_en from public.boletos_video x where x.id = id_a) = now()
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · cobrado=%s · saldo %s→%s · quedan=%s (mi_video dice %s) · líneas video=%s por %s · con su clave=%s',
                         c.codigo, c.cobrado, s0, c.saldo, c.quedan, e.quedan, n1, n2, n3 = 1);

    -- ── 6 · cobrar dos veces: ya cobrado, un solo movimiento (S3) ────────
    c  := public.cobrar_boleto(id_a);
    c2 := public.cobrar_boleto(id_a);
    select count(*) into n1 from public.movimientos where clave_idem = 'video:' || id_a::text;
    v_o := v_o || 6; v_p := array_append(v_p, '6 · S3 · el mismo boleto otra vez: ya_cobrado, un movimiento'::text);
    v_r := v_r || case when c.codigo = 'ya_cobrado' and c.cobrado = 0 and c.saldo = s0 + 500 and c.quedan = 7
                        and c2.codigo = 'ya_cobrado' and c2.saldo = s0 + 500 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('2.ª=%s cobrado %s · 3.ª=%s · saldo ya subido=%s · quedan=%s · movimientos del boleto=%s',
                         c.codigo, c.cobrado, c2.codigo, c.saldo = s0 + 500, c.quedan, n1);

    -- ── 21 · el premio lo dice el servidor, en las dos respuestas ────────
    -- `mi_video` y `cobrar_boleto` traen `premio` SIEMPRE: al cobrar (`ok`),
    -- cuando todavía no toca (`demasiado_pronto`) y en el reintento
    -- (`ya_cobrado`, donde `cobrado` es 0 y el cliente celebra con `premio`).
    -- `e` es el mi_video de la prueba 5; `c` y `c2`, los ya_cobrado de la 6.
    v_o := v_o || 21; v_p := array_append(v_p, '21 · el premio lo dice el servidor: mi_video y cobrar_boleto'::text);
    v_r := v_r || case when e.premio = 500 and e.premio = public.video_premio_hc()
                        and p_ok = 500 and p_pronto = 500
                        and c.codigo = 'ya_cobrado' and c.premio = 500 and c.cobrado = 0 and c2.premio = 500
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('mi_video=%s · cobro ok=%s · demasiado pronto=%s · ya cobrado=%s (cobrado %s) · la cifra del SQL=%s',
                         e.premio, p_ok, p_pronto, c.premio, c.cobrado, public.video_premio_hc());

    -- ── 7 · S1 · pedir otro anula el vivo; el viejo no se cobra ──────────
    s0 := public.mi_billetera();
    b  := public.pedir_boleto();  id_b := b.boleto_id;
    b2 := public.pedir_boleto();  id_c := b2.boleto_id;
    update public.boletos_video set emitido_en = emitido_en - interval '36 seconds' where id in (id_b, id_c);
    select count(*) into n1 from public.boletos_video
     where jugador_id = UNO and cobrado_en is null and anulado_en is null;
    select count(*) into n2 from public.boletos_video where id = id_b and anulado_en is not null and cobrado_en is null;
    c  := public.cobrar_boleto(id_b);
    s1 := public.mi_billetera();
    c2 := public.cobrar_boleto(id_c);
    select count(*) into n3 from public.movimientos where clave_idem = 'video:' || id_b::text;
    v_o := v_o || 7; v_p := array_append(v_p, '7 · S1 · un solo boleto vivo: el viejo, anulado y sin cobro'::text);
    v_r := v_r || case when b.codigo = 'ok' and b2.codigo = 'ok' and id_b <> id_c and n1 = 1 and n2 = 1
                        and c.codigo = 'anulado' and c.cobrado = 0 and s1 = s0 and n3 = 0
                        and c2.codigo = 'ok' and c2.cobrado = 500 and c2.saldo = s0 + 500 and c2.quedan = 6
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('vivos tras pedir dos=%s · el viejo anulado=%s · cobrar el viejo=%s (saldo intacto=%s, movimientos=%s) · cobrar el nuevo=%s +%s · quedan=%s',
                         n1, n2 = 1, c.codigo, s1 = s0, n3, c2.codigo, c2.cobrado, c2.quedan);

    -- ── 8 · vencido a los 10 min; un cobrado viejo sigue diciendo ya_cobrado
    s0 := public.mi_billetera();
    b  := public.pedir_boleto();  id_x := b.boleto_id;
    update public.boletos_video
       set emitido_en = emitido_en - interval '11 minutes', vence_en = vence_en - interval '11 minutes'
     where id in (id_x, id_c);
    c  := public.cobrar_boleto(id_x);
    c2 := public.cobrar_boleto(id_c);
    select count(*) into n1 from public.movimientos where clave_idem = 'video:' || id_x::text;
    v_o := v_o || 8; v_p := array_append(v_p, '8 · a los 10 min: vencido, sin cobro; un cobrado sigue ya_cobrado'::text);
    v_r := v_r || case when c.codigo = 'vencido' and c.cobrado = 0 and c.saldo = s0 and c.quedan = 6 and n1 = 0
                        and c2.codigo = 'ya_cobrado' and c2.saldo = s0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('sin cobrar a los 11 min=%s · saldo intacto=%s · movimientos=%s · quedan=%s · el cobrado, a los 11 min=%s',
                         c.codigo, c.saldo = s0, n1, c.quedan, c2.codigo);

    -- ── 9 · el video cerrado antes no cuenta para el tope (G2) ───────────
    -- CUATRO pide dos veces y no cobra ninguna: el primero queda anulado, el
    -- segundo vivo. Ninguno gasta uno de los 8.
    perform set_config('request.jwt.claims', json_build_object('sub', CUATRO)::text, true);
    s0 := public.mi_billetera();
    b  := public.pedir_boleto();
    e  := public.mi_video();
    b2 := public.pedir_boleto();  id_4 := b2.boleto_id;
    e2 := public.mi_video();
    select count(*) filter (where anulado_en is not null),
           count(*) filter (where anulado_en is null and cobrado_en is null),
           count(*) filter (where cobrado_en is not null)
      into n1, n2, n3
      from public.boletos_video where jugador_id = CUATRO;
    select count(*) into n4 from public.movimientos where jugador_id = CUATRO and tipo = 'video';
    v_o := v_o || 9; v_p := array_append(v_p, '9 · G2 · pedir sin cobrar no gasta ninguno de los 8'::text);
    v_r := v_r || case when b.codigo = 'ok' and b2.codigo = 'ok' and b2.quedan = 8 and e.quedan = 8 and e2.quedan = 8
                        and n1 = 1 and n2 = 1 and n3 = 0 and n4 = 0 and public.mi_billetera() = s0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('quedan tras el 1.º=%s · tras el 2.º=%s · anulados=%s · vivos=%s · cobrados=%s · movimientos=%s · saldo intacto=%s',
                         e.quedan, e2.quedan, n1, n2, n3, n4, public.mi_billetera() = s0);

    -- ═══ EL TOPE DEL DÍA (G1, S5) ════════════════════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
    s0 := public.mi_billetera();

    -- Siete videos completos.
    for i in 1..7 loop
      b := public.pedir_boleto();
      update public.boletos_video set emitido_en = emitido_en - interval '36 seconds' where id = b.boleto_id;
      c := public.cobrar_boleto(b.boleto_id);
    end loop;
    e := public.mi_video();
    b := public.pedir_boleto();  id_x := b.boleto_id;
    update public.boletos_video set emitido_en = emitido_en - interval '36 seconds' where id = id_x;

    -- ── 11 · la guarda del cobro: con 8 cobrados no paga un noveno ───────
    -- Con un solo boleto vivo por cuenta, la cuenta no puede subir mientras
    -- uno espera: por las funciones no se llega aquí. Se fabrica A MANO el
    -- octavo cobrado, se intenta cobrar el que esperaba y se borra lo fabricado.
    insert into public.boletos_video (jugador_id, emitido_en, vence_en, cobrado_en)
    values (DOS, now() - interval '1 minute', now() + interval '9 minutes', now())
    returning id into id_f;
    s1 := public.mi_billetera();
    c2 := public.cobrar_boleto(id_x);
    select count(*) into n1 from public.movimientos where jugador_id = DOS and tipo = 'video';
    select count(*) into n2 from public.boletos_video where id = id_x and cobrado_en is null and anulado_en is null;
    delete from public.boletos_video where id = id_f;
    v_o := v_o || 11; v_p := array_append(v_p, '11 · la guarda: con 8 cobrados, el cobro dice tope_dia y no paga'::text);
    v_r := v_r || case when c2.codigo = 'tope_dia' and c2.cobrado = 0 and c2.saldo = s1 and c2.quedan = 0
                        and n1 = 7 and n2 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · cobrado=%s · saldo intacto=%s · quedan=%s · líneas video=%s · el boleto sigue vivo=%s',
                         c2.codigo, c2.cobrado, c2.saldo = s1, c2.quedan, n1, n2 = 1);

    -- ── 10 · el octavo cobra; el noveno pedido es tope_dia, sin efectos ──
    c3 := public.cobrar_boleto(id_x);
    b2 := public.pedir_boleto();
    e2 := public.mi_video();
    select count(*), count(*) filter (where cobrado_en is not null),
           count(*) filter (where cobrado_en is null and anulado_en is null)
      into n1, n2, n3
      from public.boletos_video where jugador_id = DOS;
    select count(*), coalesce(sum(monto), 0) into n4, s1
      from public.movimientos where jugador_id = DOS and tipo = 'video';
    v_o := v_o || 10; v_p := array_append(v_p, '10 · G1 · ocho al día: el noveno pedido es tope_dia'::text);
    v_r := v_r || case when c.codigo = 'ok' and c.quedan = 1 and e.quedan = 1
                        and c3.codigo = 'ok' and c3.cobrado = 500 and c3.quedan = 0
                        and b2.codigo = 'tope_dia' and b2.boleto_id is null and b2.emitido_en is null
                        and b2.quedan = 0 and b2.reinicio_en > now()
                        and e2.quedan = 0 and n1 = 8 and n2 = 8 and n3 = 0 and n4 = 8 and s1 = 4000
                        and public.mi_billetera() = s0 + 4000
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('7.º=%s quedan %s · 8.º=%s quedan %s · 9.º pedido=%s sin boleto=%s · boletos=%s (cobrados %s, vivos %s) · líneas video=%s por %s · saldo %s→%s',
                         c.codigo, c.quedan, c3.codigo, c3.quedan, b2.codigo, b2.boleto_id is null,
                         n1, n2, n3, n4, s1, s0, public.mi_billetera());

    -- ── 12 · al día siguiente de Chicago vuelve a dejar ──────────────────
    update public.boletos_video set cobrado_en = cobrado_en - interval '26 hours' where jugador_id = DOS;
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = DOS;
    e := public.mi_video();
    b := public.pedir_boleto();
    v_o := v_o || 12; v_p := array_append(v_p, '12 · al día siguiente de Chicago: 8 de 8 otra vez'::text);
    v_r := v_r || case when e.codigo = 'ok' and e.quedan = 8 and b.codigo = 'ok' and b.boleto_id is not null and b.quedan = 8
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('mi_video quedan=%s · pedir=%s con boleto=%s', e.quedan, b.codigo, b.boleto_id is not null);

    -- ── 13 · el reinicio es la medianoche de Chicago, con cambio de hora ─
    -- 2026-11-01 (otoño): el día dura 25 h. 2026-03-08 (primavera): 23 h.
    v_o := v_o || 13; v_p := array_append(v_p, '13 · G6 · el reinicio, también los dos días del cambio de hora'::text);
    v_r := v_r || case when public.video_reinicio(timestamptz '2026-11-01 05:00:00+00') = timestamptz '2026-11-02 06:00:00+00'
                        and public.video_reinicio(timestamptz '2026-11-02 05:59:59+00') = timestamptz '2026-11-02 06:00:00+00'
                        and public.video_reinicio(timestamptz '2026-03-08 06:00:00+00') = timestamptz '2026-03-09 05:00:00+00'
                        and public.video_reinicio(timestamptz '2026-07-15 05:00:00+00') = timestamptz '2026-07-16 05:00:00+00'
                        and public.video_reinicio(timestamptz '2026-07-15 04:59:59+00') = timestamptz '2026-07-15 05:00:00+00'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('otoño=%s · primavera=%s · un día corriente=%s',
                         public.video_reinicio(timestamptz '2026-11-01 05:00:00+00') - timestamptz '2026-11-01 05:00:00+00',
                         public.video_reinicio(timestamptz '2026-03-08 06:00:00+00') - timestamptz '2026-03-08 06:00:00+00',
                         public.video_reinicio(timestamptz '2026-07-15 05:00:00+00') - timestamptz '2026-07-15 05:00:00+00');

    -- ═══ LOS LÍMITES (S4: K6, K7) ════════════════════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', TRES)::text, true);

    -- ── 14 · pedir_boleto: el 11.º del minuto es `limite`, sin efectos ───
    for i in 1..10 loop b := public.pedir_boleto(); end loop;
    id_t := b.boleto_id;
    b2 := public.pedir_boleto();
    select count(*), count(*) filter (where anulado_en is not null) into n1, n2
      from public.boletos_video where jugador_id = TRES;
    select count(*) into n3 from public.boletos_video where id = id_t and anulado_en is null and cobrado_en is null;
    select count(*) into n4 from public.intentos_dinero where jugador_id = TRES and funcion = 'pedir_boleto';
    v_o := v_o || 14; v_p := array_append(v_p, '14 · límite de pedir_boleto: sin boleto, el vivo intacto, la anotación queda'::text);
    v_r := v_r || case when b.codigo = 'ok' and b2.codigo = 'limite' and b2.boleto_id is null and b2.quedan = 8
                        and n1 = 10 and n2 = 9 and n3 = 1 and n4 = 11
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('10.º=%s · 11.º=%s sin boleto=%s · boletos=%s (anulados %s) · el vivo sigue=%s · anotados=%s',
                         b.codigo, b2.codigo, b2.boleto_id is null, n1, n2, n3 = 1, n4);

    -- ── 15 · K7 · un cobro cortado por el límite se cobra entero después ─
    -- Veinte cobros de un bucle (a boletos que no existen) agotan el tope: el
    -- cobro de verdad recibe `limite` y el boleto queda INTACTO. Pasa un
    -- minuto: el mismo boleto cobra sus 500.
    update public.boletos_video set emitido_en = emitido_en - interval '36 seconds' where id = id_t;
    for i in 1..20 loop perform public.cobrar_boleto(gen_random_uuid()); end loop;
    s0 := public.mi_billetera();
    c  := public.cobrar_boleto(id_t);
    select count(*) into n1 from public.boletos_video where id = id_t and cobrado_en is null and anulado_en is null;
    select count(*) into n2 from public.intentos_dinero where jugador_id = TRES and funcion = 'cobrar_boleto';
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = TRES;
    c2 := public.cobrar_boleto(id_t);
    select count(*) into n3 from public.movimientos where clave_idem = 'video:' || id_t::text;
    v_o := v_o || 15; v_p := array_append(v_p, '15 · K7 · cobro cortado: el boleto espera y se cobra entero'::text);
    v_r := v_r || case when c.codigo = 'limite' and c.cobrado = 0 and c.saldo = s0 and n1 = 1 and n2 = 21
                        and c2.codigo = 'ok' and c2.cobrado = 500 and c2.saldo = s0 + 500 and n3 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('cortado=%s (saldo intacto=%s) · el boleto tras el corte, vivo=%s · anotados=%s · un minuto después=%s cobrado %s · saldo %s→%s · movimientos=%s',
                         c.codigo, c.saldo = s0, n1 = 1, n2, c2.codigo, c2.cobrado, s0, c2.saldo, n3);

    -- ═══ LO AJENO, SIN SESIÓN, PERMISOS Y EL LIBRO ═══════════════════════

    -- ── 16 · el boleto de otro no se cobra; el que no existe, tampoco ────
    update public.boletos_video set emitido_en = emitido_en - interval '36 seconds' where id = id_4;
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
    s0 := public.mi_billetera();
    c  := public.cobrar_boleto(id_4);
    c2 := public.cobrar_boleto(gen_random_uuid());
    c3 := public.cobrar_boleto(null);
    select count(*) into n1 from public.boletos_video where id = id_4 and cobrado_en is null and anulado_en is null;
    select count(*) into n2 from public.movimientos where clave_idem = 'video:' || id_4::text;
    v_o := v_o || 16; v_p := array_append(v_p, '16 · ajeno e inexistente: sin cobro, y el boleto del otro, intacto'::text);
    v_r := v_r || case when c.codigo = 'ajeno' and c.cobrado = 0 and c.saldo = s0
                        and c2.codigo = 'inexistente' and c3.codigo = 'inexistente'
                        and n1 = 1 and n2 = 0 and public.mi_billetera() = s0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('el de otro=%s · uno inventado=%s · nulo=%s · saldo intacto=%s · el boleto del otro sigue vivo=%s · movimientos=%s',
                         c.codigo, c2.codigo, c3.codigo, public.mi_billetera() = s0, n1 = 1, n2);

    -- ── 17 · sin sesión, nada; y todo relleno ────────────────────────────
    perform set_config('request.jwt.claims', '', true);
    select count(*) into n1 from public.boletos_video;
    select count(*) into n2 from public.intentos_dinero;
    e := public.mi_video();
    b := public.pedir_boleto();
    c := public.cobrar_boleto(id_4);
    select count(*) into n3 from public.boletos_video;
    select count(*) into n4 from public.intentos_dinero;
    v_o := v_o || 17; v_p := array_append(v_p, '17 · sin sesión: las tres dicen sin_sesion, sin efectos'::text);
    v_r := v_r || case when e.codigo = 'sin_sesion' and e.quedan = 0 and e.tope = 8 and e.ahora is not null and e.reinicio_en is not null
                        and e.premio = 500
                        and b.codigo = 'sin_sesion' and b.boleto_id is null and b.quedan = 0 and b.minimo_s = 35
                        and c.codigo = 'sin_sesion' and c.cobrado = 0 and c.saldo = 0 and c.quedan = 0 and c.faltan_s = 0
                        and c.premio = 500
                        and c.reinicio_en is not null and n3 = n1 and n4 = n2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('mi_video=%s · pedir=%s · cobrar=%s · boletos nuevos=%s · anotaciones nuevas=%s',
                         e.codigo, b.codigo, c.codigo, n3 - n1, n4 - n2);

    -- ── 18 · el cliente sólo llama a las tres ────────────────────────────
    ok1 := has_function_privilege('authenticated', 'public.mi_video()', 'execute')
       and has_function_privilege('authenticated', 'public.pedir_boleto()', 'execute')
       and has_function_privilege('authenticated', 'public.cobrar_boleto(uuid)', 'execute');
    ok2 := has_function_privilege('anon', 'public.mi_video()', 'execute')
        or has_function_privilege('anon', 'public.pedir_boleto()', 'execute')
        or has_function_privilege('anon', 'public.cobrar_boleto(uuid)', 'execute');
    ok3 := has_function_privilege('authenticated', 'public.video_premio_hc()', 'execute')
        or has_function_privilege('authenticated', 'public.video_tope_dia()', 'execute')
        or has_function_privilege('authenticated', 'public.video_minimo_s()', 'execute')
        or has_function_privilege('authenticated', 'public.video_vida_boleto()', 'execute')
        or has_function_privilege('authenticated', 'public.video_reinicio(timestamptz)', 'execute')
        or has_function_privilege('authenticated', 'public.video_cobrados_hoy(uuid)', 'execute')
        or has_function_privilege('authenticated', 'public.video_quedan(uuid)', 'execute')
        or has_function_privilege('authenticated', 'public.boleto_video_respuesta(text, uuid, public.boletos_video)', 'execute')
        or has_function_privilege('authenticated', 'public.cobro_video_respuesta(text, uuid, bigint, integer)', 'execute')
        or has_function_privilege('authenticated', 'public.limite_dinero(text)', 'execute')
        or has_function_privilege('anon', 'public.video_quedan(uuid)', 'execute')
        or has_function_privilege('anon', 'public.video_cobrados_hoy(uuid)', 'execute');
    v_o := v_o || 18; v_p := array_append(v_p, '18 · permisos: mi_video, pedir_boleto y cobrar_boleto, y nada más'::text);
    v_r := v_r || case when ok1 and not ok2 and not ok3 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('las tres para authenticated=%s · alguna para anon=%s · alguna interna al cliente=%s', ok1, ok2, ok3);

    -- ── 19 · la tabla: cerrada, sin Realtime, y un solo vivo por cuenta ──
    ok1 := has_table_privilege('authenticated', 'public.boletos_video', 'select')
        or has_table_privilege('anon', 'public.boletos_video', 'select')
        or has_table_privilege('authenticated', 'public.boletos_video', 'insert')
        or has_table_privilege('authenticated', 'public.boletos_video', 'update');
    select count(*) into n1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'boletos_video';
    select count(*) into n2 from pg_class k join pg_namespace s on s.oid = k.relnamespace
     where s.nspname = 'public' and k.relname = 'boletos_video' and k.relrowsecurity;
    select count(*) into n3 from pg_policies where schemaname = 'public' and tablename = 'boletos_video';
    select count(*) into n4 from pg_indexes
     where schemaname = 'public' and tablename = 'boletos_video'
       and indexname in ('boletos_video_vivo_uniq', 'boletos_video_cobrados_idx');
    select count(*) into s1
      from (select x.jugador_id from public.boletos_video x
             where x.cobrado_en is null and x.anulado_en is null
             group by x.jugador_id having count(*) > 1) d;
    v_o := v_o || 19; v_p := array_append(v_p, '19 · boletos_video cerrada, fuera de Realtime, un vivo por cuenta'::text);
    v_r := v_r || case when not ok1 and n1 = 0 and n2 = 1 and n3 = 0 and n4 = 2 and s1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('el cliente lee o escribe=%s · en realtime=%s · con RLS=%s · políticas=%s · índices=%s de 2 · cuentas con dos vivos=%s',
                         ok1, n1, n2 = 1, n3, n4, s1);

    -- ── 20 · el libro cuadra; un boleto cobrado, un movimiento ───────────
    select count(*) into n1
      from public.billeteras w
     where w.saldo <> coalesce((select sum(m.monto) from public.movimientos m
                                 where m.jugador_id = w.jugador_id), 0);
    select count(*) into n2
      from public.boletos_video x
     where x.cobrado_en is not null
       and (select count(*) from public.movimientos m
             where m.clave_idem = 'video:' || x.id::text and m.tipo = 'video'
               and m.jugador_id = x.jugador_id and m.monto = public.video_premio_hc()) <> 1;
    select count(*) into n3
      from public.movimientos m
     where m.tipo = 'video'
       and not exists (select 1 from public.boletos_video x
                        where x.cobrado_en is not null and m.clave_idem = 'video:' || x.id::text);
    select count(*) into n4 from public.boletos_video where cobrado_en is not null;
    v_o := v_o || 20; v_p := array_append(v_p, '20 · el libro cuadra; cada boleto cobrado tiene su movimiento'::text);
    v_r := v_r || case when n1 = 0 and n2 = 0 and n3 = 0 and n4 >= 11 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('billeteras descuadradas=%s · boletos cobrados sin su línea=%s · líneas video sin boleto=%s',
                         n1, n2, n3);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'eco1g_deshacer';
  exception when others then
    if sqlerrm <> 'eco1g_deshacer' then
      v_o := v_o || 99; v_p := array_append(v_p, 'X · el guion se detuvo'::text);
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.eco1g_verificar()
 order by orden;

rollback;
