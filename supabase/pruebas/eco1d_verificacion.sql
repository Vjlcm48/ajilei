-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1d — Verificación de la constancia, los límites y la válvula
-- ═══════════════════════════════════════════════════════════════════════════
-- Ficha AJILEI_ECO-1_Fase1d_v1.0.md §2.1. Migración que verifica:
-- supabase/migrations/20261009105658_eco1d_constancia_limites_valvula.sql.
--
-- CÓMO SE USA: igual que los de la 1a y la 1c. Se pega ENTERO en el SQL Editor
-- DESPUÉS del push y se corre UNA vez. Devuelve `prueba | resultado | detalle`
-- y cada fila debe decir PASA. No enseña correos ni uuids de cuentas reales.
--
-- NO DEJA RASTRO, por los mismos dos caminos: `begin;` … `rollback;`, y una
-- función en `pg_temp` que lo corre todo dentro de un bloque con `exception`
-- y lo deshace lanzando `eco1d_deshacer`. También la válvula: si la prueba la
-- enciende, el deshacer la deja como estaba.
--
-- Fabrica CUATRO cuentas (UNO a CUATRO), cada una con su bono de 2.500.
--
-- EL RELOJ. Todo el guion es UNA transacción, así que `now()` no se mueve:
--   · «el día siguiente» se fabrica con `constancia_admin`, moviendo el último
--     día hacia atrás (es lo mismo que Victor hará en el teléfono);
--   · «pasó un minuto» se fabrica envejeciendo las anotaciones de
--     `intentos_dinero` de la cuenta (`en - 2 min`). Es lo único que el guion
--     escribe por fuera de las funciones, y se deshace.
-- Por lo mismo, todos los intentos de una cuenta caen en el mismo minuto: el
-- guion reparte las pruebas entre cuentas para no tropezar con los límites
-- donde no los busca. (El guion de la 1c, que sienta 16 veces a una cuenta en
-- una transacción, ya no se puede volver a correr tras esta migración: cortaría
-- en la 11.ª. No es una regresión: en la base real cada llamada es su propia
-- transacción. Informe de la 1d.)
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create function pg_temp.eco1d_verificar()
returns table (orden integer, prueba text, resultado text, detalle text)
language plpgsql
as $fn$
declare
  UNO    constant uuid := 'ec01d000-0000-4000-8000-000000000001';
  DOS    constant uuid := 'ec01d000-0000-4000-8000-000000000002';
  TRES   constant uuid := 'ec01d000-0000-4000-8000-000000000003';
  CUATRO constant uuid := 'ec01d000-0000-4000-8000-000000000004';

  v_o integer[] := '{}';
  v_p text[]    := '{}';
  v_r text[]    := '{}';
  v_d text[]    := '{}';

  hoy date := public.dia_chicago(now());
  k  public.constancia_resultado;
  k2 public.constancia_resultado;
  k3 public.constancia_resultado;
  r  public.mesa_ia_resultado;
  r2 public.mesa_ia_resultado;
  ra public.mesa_ia_resultado;
  vv public.valvula_estado;
  v1 public.valvula_estado;
  v2 public.valvula_estado;
  v3 public.valvula_estado;
  m_a uuid; m_b uuid;
  s0 bigint; s1 bigint;
  n1 bigint; n2 bigint; n3 bigint;
  c1 text; c2 text; c3 text; c4 text;
  b1 boolean; b2 boolean; b3 boolean;
  t1 text;
  i integer;
  tope_previo bigint;
begin
  begin
    -- ═══ Cuatro cuentas fabricadas (se deshacen al final) ════════════════
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (UNO,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1d.verif.uno@example.com', '', now(), now(), '{}', '{}'),
           (DOS,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1d.verif.dos@example.com', '', now(), now(), '{}', '{}'),
           (TRES,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1d.verif.tres@example.com', '', now(), now(), '{}', '{}'),
           (CUATRO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'eco1d.verif.cuatro@example.com', '', now(), now(), '{}', '{}');
    insert into public.profiles (id, username) values (UNO,    'EcoVerifDUno');
    insert into public.profiles (id, username) values (DOS,    'EcoVerifDDos');
    insert into public.profiles (id, username) values (TRES,   'EcoVerifDTres');
    insert into public.profiles (id, username) values (CUATRO, 'EcoVerifDCuatro');

    -- ── 1 · la válvula nace apagada ──────────────────────────────────────
    select a.tope_diario_ia into tope_previo from public.ajustes_economia a where a.id;
    select count(*) into n1 from public.ajustes_economia;
    v_o := v_o || 1; v_p := array_append(v_p, '1 · la válvula nace apagada, una sola fila'::text);
    v_r := v_r || case when n1 = 1 and tope_previo is null then 'PASA' else 'FALLA' end;
    v_d := v_d || format('filas=%s · tope=%s', n1, coalesce(tope_previo::text, 'nulo (apagada)'));
    -- Si alguien la encendió antes de correr el guion, se apaga AQUÍ para que
    -- las pruebas de mesa no dependan de ella; el deshacer la devuelve.
    perform public.valvula_ia(null);

    -- ═══ LA CONSTANCIA ═══════════════════════════════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);

    -- ── 2 · primer ingreso: día 1, sin cobro; el segundo, ya marcado ─────
    s0 := public.mi_billetera();
    k  := public.marcar_ingreso();
    k2 := public.marcar_ingreso();
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'constancia';
    v_o := v_o || 2; v_p := array_append(v_p, '2 · primer ingreso = día 1; otra vez = ya_marcado'::text);
    v_r := v_r || case when k.codigo = 'ok' and k.racha = 1 and k.dia_del_ciclo = 1 and k.cobrado = 0
                        and k.saldo = s0 and k.dia = hoy
                        and k2.codigo = 'ya_marcado' and k2.racha = 1 and k2.cobrado = 0 and n1 = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('1.º=%s racha %s día %s cobrado %s · 2.º=%s racha %s cobrado %s · constancias=%s',
                         k.codigo, k.racha, k.dia_del_ciclo, k.cobrado, k2.codigo, k2.racha, k2.cobrado, n1);

    -- ── 3 · el día siguiente suma uno, sin cobro ─────────────────────────
    perform public.constancia_admin('EcoVerifDUno', 1, hoy - 1);
    k := public.marcar_ingreso();
    v_o := v_o || 3; v_p := array_append(v_p, '3 · día siguiente = racha 2, sin cobro'::text);
    v_r := v_r || case when k.codigo = 'ok' and k.racha = 2 and k.dia_del_ciclo = 2 and k.cobrado = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · racha=%s · día=%s · cobrado=%s', k.codigo, k.racha, k.dia_del_ciclo, k.cobrado);

    -- ── 4 · el tercer día cobra 500, una vez ─────────────────────────────
    perform public.constancia_admin('EcoVerifDUno', 2, hoy - 1);
    s0 := public.mi_billetera();
    k  := public.marcar_ingreso();
    k2 := public.marcar_ingreso();
    select count(*), coalesce(sum(monto), 0) into n1, n2
      from public.movimientos where jugador_id = UNO and tipo = 'constancia';
    select count(*) into n3 from public.movimientos
     where clave_idem = 'constancia:' || UNO::text || ':' || hoy::text;
    v_o := v_o || 4; v_p := array_append(v_p, '4 · día 3 = un cobro de 500'::text);
    v_r := v_r || case when k.codigo = 'ok' and k.racha = 3 and k.dia_del_ciclo = 3
                        and k.cobrado = 500 and k.saldo = s0 + 500
                        and k2.codigo = 'ya_marcado' and k2.cobrado = 0 and k2.saldo = s0 + 500
                        and n1 = 1 and n2 = 500 and n3 = 1 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · racha=%s · cobrado=%s · saldo %s→%s · otra vez=%s · constancias=%s por %s',
                         k.codigo, k.racha, k.cobrado, s0, k.saldo, k2.codigo, n1, n2);

    -- ── 5 · la clave por día: la racha simulada otra vez hoy no paga (P-4) ─
    -- Es la red de «dos dispositivos a la vez»: aunque la racha volviera a
    -- llegar a 3 hoy, la clave 'constancia:<jugador>:<hoy>' ya está.
    -- (Pasa un minuto: UNO lleva 5 marcas y el tope es 6.)
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = UNO;
    perform public.constancia_admin('EcoVerifDUno', 2, hoy - 1);
    s0 := public.mi_billetera();
    k  := public.marcar_ingreso();
    select count(*) into n1 from public.movimientos where jugador_id = UNO and tipo = 'constancia';
    v_o := v_o || 5; v_p := array_append(v_p, '5 · clave por jugador y día: un solo cobro'::text);
    v_r := v_r || case when k.codigo = 'ok' and k.racha = 3 and k.cobrado = 0 and k.saldo = s0 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · racha=%s · cobrado=%s · saldo %s→%s · constancias=%s',
                         k.codigo, k.racha, k.cobrado, s0, k.saldo, n1);

    -- ── 6 · un día perdido devuelve la racha a 1 ─────────────────────────
    perform public.constancia_admin('EcoVerifDUno', 2, hoy - 2);
    k := public.marcar_ingreso();
    v_o := v_o || 6; v_p := array_append(v_p, '6 · día perdido = racha 1'::text);
    v_r := v_r || case when k.codigo = 'ok' and k.racha = 1 and k.dia_del_ciclo = 1 and k.cobrado = 0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('codigo=%s · racha=%s · día=%s · cobrado=%s', k.codigo, k.racha, k.dia_del_ciclo, k.cobrado);

    -- ── 7 · la cuenta sigue tras cobrar: el día 4 no paga, el 6 sí ───────
    -- Con DOS, que hoy no ha cobrado. Su racha es suya: lo de UNO no la toca.
    perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
    select count(*) into n3 from public.constancia where jugador_id = DOS;
    perform public.constancia_admin('EcoVerifDDos', 3, hoy - 1);
    k := public.marcar_ingreso();
    perform public.constancia_admin('EcoVerifDDos', 5, hoy - 1);
    s0 := public.mi_billetera();
    k2 := public.marcar_ingreso();
    v_o := v_o || 7; v_p := array_append(v_p, '7 · día 4 sin cobro, día 6 cobra; cada racha es suya'::text);
    v_r := v_r || case when n3 = 0
                        and k.codigo = 'ok' and k.racha = 4 and k.dia_del_ciclo = 1 and k.cobrado = 0
                        and k2.codigo = 'ok' and k2.racha = 6 and k2.dia_del_ciclo = 3
                        and k2.cobrado = 500 and k2.saldo = s0 + 500
                        and (select c.racha from public.constancia c where c.jugador_id = UNO) = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('DOS sin fila antes=%s · día 4=%s/%s cobrado %s · día 6=%s/%s cobrado %s · racha de UNO=%s',
                         n3 = 0, k.racha, k.dia_del_ciclo, k.cobrado, k2.racha, k2.dia_del_ciclo, k2.cobrado,
                         (select c.racha from public.constancia c where c.jugador_id = UNO));

    -- ── 8 · sin sesión, nada; la ayuda, por nombre y con sus guardas ─────
    perform set_config('request.jwt.claims', '', true);
    k  := public.marcar_ingreso();
    k2 := public.constancia_admin('NoExisteNadie', 1, hoy);
    k3 := public.constancia_admin('EcoVerifDDos', 1, hoy + 1);   -- día futuro
    c1 := (public.constancia_admin('EcoVerifDDos', 0, hoy)).codigo;  -- racha 0 con día
    c2 := (public.constancia_admin('ecoverifddos', 0, null)).codigo; -- sin mayúsculas, vuelve a 0
    select count(*) into n1 from public.constancia where jugador_id = DOS and racha = 0 and ultimo_dia is null;
    v_o := v_o || 8; v_p := array_append(v_p, '8 · sin sesión; constancia_admin y sus guardas'::text);
    v_r := v_r || case when k.codigo = 'sin_sesion' and k.racha = 0 and k.cobrado = 0 and k.saldo is not null
                        and k2.codigo = 'sin_usuario' and k3.codigo = 'argumento_invalido'
                        and c1 = 'argumento_invalido' and c2 = 'ok' and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('sin sesión=%s · usuario falso=%s · día futuro=%s · racha 0 con día=%s · reinicio=%s',
                         k.codigo, k2.codigo, k3.codigo, c1, c2);

    -- ═══ LOS LÍMITES (K6, K7) ════════════════════════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', TRES)::text, true);

    -- ── 9 · marcar_ingreso: el 7.º del minuto es `limite`, sin efectos ───
    k := public.marcar_ingreso();                                      -- 1: día 1
    for i in 2..6 loop perform public.marcar_ingreso(); end loop;      -- 2..6: ya_marcado
    perform public.constancia_admin('EcoVerifDTres', 2, hoy - 1);      -- mañana cobraría…
    k2 := public.marcar_ingreso();                                     -- 7: limite
    select count(*) into n1 from public.intentos_dinero where jugador_id = TRES and funcion = 'marcar_ingreso';
    select count(*) into n2 from public.movimientos where jugador_id = TRES and tipo = 'constancia';
    v_o := v_o || 9; v_p := array_append(v_p, '9 · límite de marcar_ingreso: sin efectos, la anotación queda'::text);
    v_r := v_r || case when k.codigo = 'ok' and k2.codigo = 'limite' and k2.racha = 2 and k2.cobrado = 0
                        and n1 = 7 and n2 = 0
                        and (select c.racha from public.constancia c where c.jugador_id = TRES) = 2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('1.º=%s · 7.º=%s (racha %s) · anotados=%s · constancias=%s',
                         k.codigo, k2.codigo, k2.racha, n1, n2);

    -- ── 10 · sentarse_ia: el 11.º del minuto es `limite`, sin efectos ────
    s0 := public.mi_billetera();
    for i in 1..10 loop perform public.sentarse_ia('experto', 2, 50, 500, gen_random_uuid()); end loop;
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-T');
    select count(*) into n1 from public.mesas_ia where jugador_id = TRES;
    select count(*) into n2 from public.intentos_dinero where jugador_id = TRES and funcion = 'sentarse_ia';
    v_o := v_o || 10; v_p := array_append(v_p, '10 · límite de sentarse_ia: sin mesa ni cobro'::text);
    v_r := v_r || case when r.codigo = 'limite' and r.mesa_id is null and r.saldo = s0
                        and n1 = 0 and n2 = 11 and public.mi_billetera() = s0
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('11.º=%s · mesas=%s · anotados=%s · saldo %s→%s', r.codigo, n1, n2, s0, public.mi_billetera());

    -- ── 11 · K7 · salir_ia cortado no atrapa: la mesa espera y se cobra ──
    -- Pasa un minuto; TRES se sienta y avisa 800. Treinta salidas de un bucle
    -- (a una mesa que no existe) agotan el tope: la salida de verdad recibe
    -- `limite` y la mesa queda INTACTA. Pasa otro minuto: la misma salida cobra.
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = TRES;
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-T');
    m_a := r.mesa_id;
    perform public.informar_pila(m_a, 1, 800);
    for i in 1..30 loop perform public.salir_ia(gen_random_uuid(), 100, 1); end loop;
    s0 := public.mi_billetera();
    r  := public.salir_ia(m_a, 800, 2);
    select estado || '/' || pila_informada into t1 from public.mesas_ia where id = m_a;
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = TRES;
    r2 := public.salir_ia(m_a, 800, 2);
    select count(*) into n1 from public.movimientos where clave_idem = 'salida_ia:' || m_a::text;
    v_o := v_o || 11; v_p := array_append(v_p, '11 · K7 · salir cortado: la mesa espera y se cobra entera'::text);
    v_r := v_r || case when m_a is not null and r.codigo = 'limite' and t1 = 'abierta/800'
                        and r2.codigo = 'ok' and r2.cobrado = 800 and r2.saldo = s0 + 800 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('cortada=%s · mesa tras el corte=%s · un minuto después=%s cobrado %s · saldo %s→%s · salidas=%s',
                         r.codigo, t1, r2.codigo, r2.cobrado, s0, r2.saldo, n1);

    -- ── 12 · K7 · recoger cortado no atrapa: la recoge C4 al sentarse ────
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-T');
    m_b := r.mesa_id;
    perform public.informar_pila(m_b, 1, 650);
    for i in 1..10 loop perform public.recoger_mesa_ia('disp-T'); end loop;   -- 10 caben (la 1.ª la recogería…)
    -- …así que se reabre una mesa para que el corte caiga sobre una abierta.
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-T');
    m_b := r.mesa_id;
    perform public.informar_pila(m_b, 1, 650);
    ra := public.recoger_mesa_ia('disp-T');                                   -- 11.ª: limite
    select estado into t1 from public.mesas_ia where id = m_b;
    s0 := public.mi_billetera();
    r2 := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-T');
    select estado || '/' || motivo_cierre || '/' || cobrado into c1 from public.mesas_ia where id = m_b;
    v_o := v_o || 12; v_p := array_append(v_p, '12 · K7 · recoger cortado: C4 la cierra y la cobra'::text);
    v_r := v_r || case when ra.codigo = 'limite' and t1 = 'abierta'
                        and r2.codigo = 'ok' and r2.anterior_cerrada and r2.anterior_cobro = 650
                        and r2.saldo = s0 + 650 - 500 and c1 = 'cerrada/reemplazada/650'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('recoger=%s · mesa=%s · sentarse=%s anterior %s (%s) · saldo %s→%s · vieja=%s',
                         ra.codigo, t1, r2.codigo, r2.anterior_cerrada, r2.anterior_cobro, s0, r2.saldo, c1);

    -- ── 13 · recargar_ia: el 21.º del minuto es `limite`, sin efectos ────
    m_a := r2.mesa_id;
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = TRES;
    for i in 1..20 loop perform public.recargar_ia(gen_random_uuid(), 50, 1); end loop;
    s0 := public.mi_billetera();
    r := public.recargar_ia(m_a, 500, 1);
    select count(*) into n1 from public.movimientos where jugador_id = TRES and tipo = 'recarga_ia';
    v_o := v_o || 13; v_p := array_append(v_p, '13 · límite de recargar_ia: sin cobro'::text);
    v_r := v_r || case when r.codigo = 'limite' and n1 = 0 and public.mi_billetera() = s0
                        and (select pila_informada from public.mesas_ia where id = m_a) = 500
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('21.ª=%s · recargas=%s · saldo intacto=%s', r.codigo, n1, public.mi_billetera() = s0);

    -- ── 14 · informar_pila no lleva límite (P-1) ─────────────────────────
    for i in 1..40 loop perform public.informar_pila(m_a, i, 500 - i); end loop;
    r := public.informar_pila(m_a, 41, 400);
    select count(*) into n1 from public.intentos_dinero where jugador_id = TRES and funcion = 'informar_pila';
    v_o := v_o || 14; v_p := array_append(v_p, '14 · informar_pila sin límite ni anotación'::text);
    v_r := v_r || case when r.codigo = 'ok' and r.pila = 400 and n1 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('41.º aviso=%s · pila=%s · anotados=%s', r.codigo, r.pila, n1);
    update public.intentos_dinero set en = en - interval '2 minutes' where jugador_id = TRES;
    perform public.salir_ia(m_a, 400, 42);

    -- ── 15 · los topes, uno por uno ──────────────────────────────────────
    v_o := v_o || 15; v_p := array_append(v_p, '15 · las cifras de limite_dinero'::text);
    v_r := v_r || case when public.limite_dinero('sentarse_ia') = 10 and public.limite_dinero('recargar_ia') = 20
                        and public.limite_dinero('salir_ia') = 30 and public.limite_dinero('recoger_mesa_ia') = 10
                        and public.limite_dinero('marcar_ingreso') = 6 and public.limite_dinero('informar_pila') is null
                        and public.bono_constancia_hc() = 500 and public.constancia_ciclo() = 3
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('sentarse=%s · recargar=%s · salir=%s · recoger=%s · marcar=%s · informar=%s · constancia=%s cada %s',
                         public.limite_dinero('sentarse_ia'), public.limite_dinero('recargar_ia'),
                         public.limite_dinero('salir_ia'), public.limite_dinero('recoger_mesa_ia'),
                         public.limite_dinero('marcar_ingreso'),
                         coalesce(public.limite_dinero('informar_pila')::text, 'sin límite'),
                         public.bono_constancia_hc(), public.constancia_ciclo());

    -- ═══ LA VÁLVULA (K8, P-2, P-3) ═══════════════════════════════════════
    perform set_config('request.jwt.claims', json_build_object('sub', CUATRO)::text, true);

    -- ── 16 · apagada no cambia nada ──────────────────────────────────────
    -- CUATRO se sienta y avisa 1.250 (el techo): «ganaría» 750 si saliera.
    r := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-C');
    m_a := r.mesa_id;
    perform public.informar_pila(m_a, 1, 1250);
    n1 := public.ganancia_ia_hoy(CUATRO);
    b1 := public.valvula_cerrada(CUATRO);
    r2 := public.recargar_ia(m_a, 50, 2);
    v_o := v_o || 16; v_p := array_append(v_p, '16 · apagada: no cierra nada'::text);
    v_r := v_r || case when r.codigo = 'ok' and n1 = 750 and not b1 and r2.codigo = 'ok'
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('sentarse=%s · ganancia hoy=%s · cerrada=%s · recarga=%s', r.codigo, n1, b1, r2.codigo);

    -- ── 17 · encendida: sentarse y recargar dicen tope_diario, sin efectos
    -- Tope 500 < 750. La mesa nueva no se abre, la vieja NO se cierra, la
    -- recarga no cobra; y un reintento de una apertura ya hecha sigue
    -- devolviendo su mesa (`repetido`), nunca `tope_diario`.
    vv := public.valvula_ia(500);
    s0 := public.mi_billetera();
    r  := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-C');
    ra := public.recargar_ia(m_a, 50, 3);
    select estado into t1 from public.mesas_ia where id = m_a;
    select count(*) into n1 from public.mesas_ia where jugador_id = CUATRO;
    select token_apertura::text into c4 from public.mesas_ia where id = m_a;
    r2 := public.sentarse_ia('basico', 2, 50, 500, c4::uuid, 'disp-C');
    v_o := v_o || 17; v_p := array_append(v_p, '17 · encendida: tope_diario sin efectos, la vieja sigue'::text);
    v_r := v_r || case when vv.codigo = 'encendida' and vv.tope_diario_ia = 500
                        and r.codigo = 'tope_diario' and r.mesa_id is null and not r.anterior_cerrada
                        and ra.codigo = 'tope_diario' and t1 = 'abierta' and n1 = 1
                        and public.mi_billetera() = s0 and r2.codigo = 'repetido' and r2.mesa_id = m_a
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('válvula=%s (%s) · sentarse=%s · recargar=%s · vieja=%s · mesas=%s · saldo intacto=%s · reintento del token=%s',
                         vv.codigo, vv.tope_diario_ia, r.codigo, ra.codigo, t1, n1,
                         public.mi_billetera() = s0, r2.codigo);

    -- ── 18 · K8 · la mesa en curso se paga completa ──────────────────────
    -- Pila 1.250 + la recarga de 50 de la 16 = 1.300 (techo 1.250 + 50 + 2.500).
    s0 := public.mi_billetera();
    r  := public.salir_ia(m_a, 1300, 4);
    r2 := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-C');
    n1 := public.ganancia_ia_hoy(CUATRO);
    v_o := v_o || 18; v_p := array_append(v_p, '18 · K8 · la mesa en curso cobra entera; después, tope'::text);
    v_r := v_r || case when r.codigo = 'ok' and r.cobrado = 1300 and r.saldo = s0 + 1300
                        and r2.codigo = 'tope_diario' and n1 = 750 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('salir=%s cobrado %s · saldo %s→%s · sentarse después=%s · ganancia hoy=%s (1.300 − 500 − 50)',
                         r.codigo, r.cobrado, s0, r.saldo, r2.codigo, n1);

    -- ── 19 · apagarla lo devuelve todo; cada cambio deja rastro ──────────
    v1 := public.valvula_ia(0);
    v2 := public.valvula_ia(null);
    v3 := public.valvula_ia(null);
    r  := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-C');
    select count(*) into n1 from public.valvula_cambios
     where en = now() and ((tope_antes is null and tope_despues = 500) or (tope_antes = 500 and tope_despues is null));
    v_o := v_o || 19; v_p := array_append(v_p, '19 · apagada otra vez: se sienta; el rastro'::text);
    v_r := v_r || case when v1.codigo = 'tope_invalido' and v1.tope_diario_ia = 500
                        and v2.codigo = 'apagada' and not v2.encendida and v2.tope_antes = 500
                        and v3.codigo = 'sin_cambio' and r.codigo = 'ok' and n1 = 2
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('tope 0=%s · apagar=%s · apagar otra vez=%s · sentarse=%s · cambios anotados=%s',
                         v1.codigo, v2.codigo, v3.codigo, r.codigo, n1);
    perform public.salir_ia(r.mesa_id, 500, 1);

    -- ═══ PERMISOS, TABLAS Y LO DE LA 1c ══════════════════════════════════
    perform set_config('request.jwt.claims', '', true);

    -- ── 20 · el cliente sólo llama a marcar_ingreso ──────────────────────
    b1 := has_function_privilege('authenticated', 'public.marcar_ingreso()', 'execute')
      and not has_function_privilege('anon', 'public.marcar_ingreso()', 'execute');
    b2 := has_function_privilege('authenticated', 'public.valvula_ia(bigint)', 'execute')
       or has_function_privilege('anon', 'public.valvula_ia(bigint)', 'execute')
       or has_function_privilege('authenticated', 'public.constancia_admin(text, integer, date)', 'execute')
       or has_function_privilege('anon', 'public.constancia_admin(text, integer, date)', 'execute')
       or has_function_privilege('authenticated', 'public.ganancia_ia_hoy(uuid)', 'execute')
       or has_function_privilege('authenticated', 'public.valvula_cerrada(uuid)', 'execute')
       or has_function_privilege('authenticated', 'public.limite_dinero(text)', 'execute')
       or has_function_privilege('authenticated', 'public.constancia_respuesta(text, uuid, integer, bigint)', 'execute');
    b3 := has_function_privilege('authenticated', 'public.sentarse_ia(text, integer, integer, bigint, uuid, text)', 'execute')
      and has_function_privilege('authenticated', 'public.recargar_ia(uuid, bigint, integer)', 'execute')
      and has_function_privilege('authenticated', 'public.salir_ia(uuid, bigint, integer)', 'execute')
      and has_function_privilege('authenticated', 'public.recoger_mesa_ia(text)', 'execute')
      and not has_function_privilege('anon', 'public.sentarse_ia(text, integer, integer, bigint, uuid, text)', 'execute');
    v_o := v_o || 20; v_p := array_append(v_p, '20 · permisos: válvula y ayuda sólo para el Editor'::text);
    v_r := v_r || case when b1 and not b2 and b3 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('marcar_ingreso sólo authenticated=%s · internas o del Editor al cliente=%s · las de la mesa siguen=%s',
                         b1, b2, b3);

    -- ── 21 · tablas nuevas: sin lectura, RLS sin políticas, sin Realtime ─
    b1 := false;
    foreach t1 in array array['constancia', 'ajustes_economia', 'valvula_cambios'] loop
      b1 := b1 or has_table_privilege('authenticated', 'public.' || t1, 'select')
               or has_table_privilege('anon', 'public.' || t1, 'select')
               or has_table_privilege('authenticated', 'public.' || t1, 'update');
    end loop;
    select count(*) into n1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public'
       and tablename in ('constancia', 'ajustes_economia', 'valvula_cambios');
    select count(*) into n2 from pg_class c join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and c.relrowsecurity
       and c.relname in ('constancia', 'ajustes_economia', 'valvula_cambios');
    select count(*) into n3 from pg_policies
     where schemaname = 'public' and tablename in ('constancia', 'ajustes_economia', 'valvula_cambios');
    v_o := v_o || 21; v_p := array_append(v_p, '21 · tablas nuevas cerradas y fuera de Realtime'::text);
    v_r := v_r || case when not b1 and n1 = 0 and n2 = 3 and n3 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('el cliente lee o escribe=%s · en realtime=%s · con RLS=%s de 3 · políticas=%s', b1, n1, n2, n3);

    -- ── 22 · 1c · un cobro por mesa y el techo, con el cuerpo nuevo ──────
    perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
    s0 := public.mi_billetera();
    r  := public.sentarse_ia('basico', 2, 50, 500, gen_random_uuid(), 'disp-U');
    r2 := public.salir_ia(r.mesa_id, 99999, 1);
    ra := public.salir_ia(r.mesa_id, 99999, 2);
    select count(*) into n1 from public.movimientos where clave_idem = 'salida_ia:' || r.mesa_id::text;
    v_o := v_o || 22; v_p := array_append(v_p, '22 · 1c · salir: un cobro, topado por el techo'::text);
    v_r := v_r || case when r.codigo = 'ok' and r.techo = 1250
                        and r2.codigo = 'ok' and r2.cobrado = 1250 and r2.saldo = s0 - 500 + 1250
                        and ra.codigo = 'repetido' and ra.cobrado = 1250 and n1 = 1
                   then 'PASA' else 'FALLA' end;
    v_d := v_d || format('techo=%s · salir=%s cobrado %s · otra vez=%s · salidas=%s',
                         r.techo, r2.codigo, r2.cobrado, ra.codigo, n1);

    -- ── 23 · el libro cuadra y cada mesa cobra una vez ───────────────────
    select count(*) into n1
      from public.billeteras b
     where b.saldo <> coalesce((select sum(m.monto) from public.movimientos m
                                 where m.jugador_id = b.jugador_id), 0);
    select count(*) into n2
      from public.mesas_ia x
     where x.estado = 'cerrada' and x.cobrado > 0
       and (select count(*) from public.movimientos m
             where m.ref_tipo = 'mesa_ia' and m.ref_id = x.id::text
               and m.tipo in ('salida_ia', 'abandono_ia') and m.monto = x.cobrado) <> 1;
    select count(*) into n3
      from (select m.jugador_id, m.ref_id from public.movimientos m
             where m.tipo = 'constancia'
             group by m.jugador_id, m.ref_id having count(*) > 1) d;
    v_o := v_o || 23; v_p := array_append(v_p, '23 · el libro cuadra; una mesa, un cobro; una constancia por día'::text);
    v_r := v_r || case when n1 = 0 and n2 = 0 and n3 = 0 then 'PASA' else 'FALLA' end;
    v_d := v_d || format('billeteras descuadradas=%s · mesas sin su cobro=%s · días con dos constancias=%s', n1, n2, n3);

    perform set_config('request.jwt.claims', '', true);
    raise exception 'eco1d_deshacer';
  exception when others then
    if sqlerrm <> 'eco1d_deshacer' then
      v_o := v_o || 99; v_p := array_append(v_p, 'X · el guion se detuvo'::text);
      v_r := v_r || 'FALLA'::text;
      v_d := v_d || (sqlstate || ' · ' || sqlerrm);
    end if;
  end;

  return query select * from unnest(v_o, v_p, v_r, v_d);
end
$fn$;

select prueba, resultado, detalle
  from pg_temp.eco1d_verificar()
 order by orden;

rollback;
