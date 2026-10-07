-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · ECO-1 · Fase 1a — El libro: billetera, movimientos y bono
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_ECO-1_Fase1a_v1.0.md §2, sobre los hechos de
-- docs/reportes/AJILEI_ECO-1_Fase0_Informe_v1.0.md §B, §F, §G y §H.
-- Normativo: docs/AJILEI_ECO-1_Reglas_v1.0.md.
--
-- Se aplica con `npx supabase db push`, en la transacción implícita de la CLI:
-- si algo revienta a mitad no queda medio libro en pie.
--
-- ── LO QUE ESTE ARCHIVO PONE EN LA BASE ───────────────────────────────────
--   · `billeteras`         una fila por jugador con su saldo (nunca negativo).
--   · `movimientos`        el libro: una línea por cada cambio de saldo, de
--                          sólo inserción, con clave idempotente única.
--   · `bonos_bienvenida`   la huella sha256 del correo canónico de quien ya
--                          cobró el bono. SIN FK: sobrevive al borrado (D2).
--   · `intentos_dinero`    el límite de frecuencia de las funciones de dinero.
--   · `aplicar_movimiento` el ÚNICO camino que mueve un saldo, y un disparador
--                          sobre `billeteras` que lo hace cumplir.
--   · el bono de 2.500 al crear el perfil, y el relleno de las cuentas que ya
--     existían (D3).
--   · `saldo_de()` deja de ser la constante 5000 y lee la billetera. Con eso
--     `crear_sala` y `unirse_sala` pasan a comprobar el saldo REAL sin que se
--     toque una línea suya (SAL-A:307-321 lo dejó preparado para esto).
--
-- ── LA DOCTRINA, HEREDADA DE SUP-2a Y SAL-A ────────────────────────────────
-- 1. EL CLIENTE NO ESCRIBE NI LEE. Las cuatro tablas tienen RLS activo y CERO
--    políticas, y además se les retiran los privilegios de tabla a `anon` y
--    `authenticated` (§11). Lo único que el teléfono puede llamar es
--    `mi_billetera()`.
-- 2. TODO CUELGA DE `auth.uid()`. Ninguna función de cliente acepta el uuid del
--    jugador como parámetro.
-- 3. LO QUE DEBE SOBREVIVIR NO SE DESHACE CON UN `raise` (S10, lección de
--    SAL-B1 A1). `aplicar_movimiento` y `contar_intento_dinero` responden con un
--    resultado, nunca con una excepción, en todos los casos previstos.
-- 4. NADA DE `returns <tabla>` CON `return null` (lección de SAL-B1 A2): llega
--    al cliente como una fila de nulos. Lo que devuelve un compuesto aquí lo
--    devuelve SIEMPRE con todos sus campos rellenos.
-- 5. NINGUNA TABLA DE DINERO ENTRA EN REALTIME.
--
-- ── IDEMPOTENCIA ──────────────────────────────────────────────────────────
-- Todo lleva `if not exists`, `create or replace` o `drop … if exists`, y el
-- relleno de §10 sólo toca perfiles sin billetera: el archivo entero se puede
-- volver a pasar sin duplicar un bono. Se probó así (informe §3).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · El resultado de un movimiento ──────────────────────────────────────
-- Un tipo con nombre y no `jsonb`, para que las sub-tandas siguientes declaren
-- `v_res public.movimiento_resultado` y lean `v_res.aplicado` con el
-- compilador de su parte: un campo mal escrito falla al crear la función y no
-- con el jugador delante (mismo argumento que SAL-A:50-54 para sus enum).
--
--   aplicado  true si el movimiento está en el libro (recién escrito o, con la
--             misma clave, escrito antes); false si no se aplicó nada.
--   saldo     el saldo tras el movimiento; en 'repetido' y cuando no se
--             aplicó nada, el saldo ACTUAL de la billetera.
--   motivo    'aplicado' · 'repetido' · 'saldo_insuficiente' · 'sin_billetera'
--             · 'monto_invalido' · 'tipo_invalido' · 'motivo_obligatorio'
--             · 'clave_en_uso' · 'argumento_invalido'.
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'movimiento_resultado' and n.nspname = 'public') then
    create type public.movimiento_resultado as (
      aplicado boolean,
      saldo    bigint,
      motivo   text
    );
  end if;
end
$$;

comment on type public.movimiento_resultado is
  'ECO-1a · Respuesta de aplicar_movimiento y ajuste_admin. Siempre con los tres campos rellenos.';


-- ── 2 · La billetera ───────────────────────────────────────────────────────
-- Forma (1) del informe §H.2 (D4): el saldo en una columna, para que la
-- cabecera y el ranking lean UNA fila, y el libro al lado para que la columna
-- se pueda auditar. Las dos se escriben juntas, y sólo en `aplicar_movimiento`.
--
-- `bigint` y no `integer`: 2.147.483.647 HC son 860.000 paquetes de 2.500, que
-- un ranking de «grandes fortunas» con acuñación de 42.000 HC/h (informe §E)
-- no tiene por qué no alcanzar nunca. El `check` es la última red: ninguna
-- función debería llegar a él, porque `aplicar_movimiento` mira antes.
create table if not exists public.billeteras (
  jugador_id     uuid        primary key references public.profiles(id) on delete cascade,
  saldo          bigint      not null,
  actualizada_en timestamptz not null default now(),
  constraint billeteras_saldo_no_negativo_chk check (saldo >= 0)
);

comment on table public.billeteras is
  'ECO-1a · Saldo de cada jugador. Sólo lo escribe aplicar_movimiento, junto con su línea en movimientos.';

-- ── La billetera sólo se mueve por el libro (rector, M-5) ─────────────────
-- Sin esto, un `update billeteras set saldo = …` desde el SQL Editor cambiaría
-- el saldo sin una línea en el libro, y `saldo = Σ monto` dejaría de ser
-- verdad sin que nada avisara hasta la próxima verificación. El disparador lo
-- impide en las cuatro puertas:
--   · UPDATE   el saldo sólo cambia con la marca `ajilei.libro = 'si'`, que
--              pone y quita `aplicar_movimiento` pegada a su `update` (§8). Lo
--              demás de la fila (`actualizada_en`) no se vigila.
--   · INSERT   una billetera nace en 0; el dinero entra después, por el libro.
--   · DELETE   sólo en cascada al borrar la cuenta (`pg_trigger_depth() >= 2`,
--              el mismo criterio que `movimientos_inmutable`).
--   · TRUNCATE nunca.
-- Es una guarda contra el error, no una frontera de seguridad: quien tiene SQL
-- puede poner la marca a mano. El cliente no tiene SQL ni privilegios de tabla
-- (§14), así que para él la puerta ya estaba cerrada.
create or replace function public.billeteras_solo_por_libro()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'UPDATE' then
    if new.saldo is distinct from old.saldo
       and coalesce(pg_catalog.current_setting('ajilei.libro', true), '') <> 'si' then
      raise exception 'billetera_solo_por_libro' using errcode = 'P0001',
        hint = 'El saldo sólo cambia con una línea en el libro: public.ajuste_admin(jugador, monto, motivo).';
    end if;
    return new;
  elsif tg_op = 'INSERT' then
    if new.saldo is distinct from 0 then
      raise exception 'billetera_solo_por_libro' using errcode = 'P0001',
        hint = 'Una billetera nace en 0; el saldo entra después con public.ajuste_admin(jugador, monto, motivo).';
    end if;
    return new;
  elsif tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() >= 2 then
    return old;
  end if;
  raise exception 'billetera_solo_por_libro' using errcode = 'P0001',
    hint = 'Una billetera sólo se borra con su cuenta. Para dejarla en 0: public.ajuste_admin(jugador, -saldo, motivo).';
end
$fn$;

drop trigger if exists billeteras_solo_por_libro_trg on public.billeteras;
create trigger billeteras_solo_por_libro_trg
  before insert or update or delete on public.billeteras
  for each row execute function public.billeteras_solo_por_libro();

drop trigger if exists billeteras_sin_truncate_trg on public.billeteras;
create trigger billeteras_sin_truncate_trg
  before truncate on public.billeteras
  for each statement execute function public.billeteras_solo_por_libro();


-- ── 3 · El libro ───────────────────────────────────────────────────────────
-- ── POR QUÉ `check` Y NO `enum` PARA EL TIPO (§2.1 a de la ficha) ──────────
-- SAL-A eligió `enum` para dos vocabularios de tres valores que son reglas del
-- juego y no van a crecer. Éste SÍ va a crecer —la tienda, MES-PvP, la válvula—
-- y ahí el `enum` tiene dos costes que el `check` no tiene:
--   · un valor nuevo (`alter type … add value`) no se puede USAR en la misma
--     transacción que lo añade, y `db push` mete cada migración en una sola
--     transacción: la migración que estrene un tipo tendría que partirse en dos;
--   · un valor de `enum` no se puede retirar nunca.
-- Con `check`, ampliar la lista es `drop constraint` + `add constraint` en la
-- misma migración que la usa. Y la lista vive en UN sitio: `aplicar_movimiento`
-- no la repite, traduce la violación de esta restricción a 'tipo_invalido'.
create table if not exists public.movimientos (
  id          bigint      generated always as identity primary key,
  jugador_id  uuid        not null references public.profiles(id) on delete cascade,
  tipo        text        not null,
  monto       bigint      not null,
  saldo_tras  bigint      not null,
  ref_tipo    text,
  ref_id      text,
  clave_idem  text        not null,
  motivo      text,
  creado_en   timestamptz not null default now(),

  constraint movimientos_clave_idem_uniq unique (clave_idem),
  constraint movimientos_tipo_chk check (tipo in (
    'bono_bienvenida', 'constancia', 'video',
    'entrada_ia', 'recarga_ia', 'salida_ia', 'abandono_ia',
    'compra', 'ajuste_admin',
    'garantia_pvp', 'liberacion_pvp', 'resultado_pvp'
  )),
  constraint movimientos_monto_chk check (monto <> 0),
  constraint movimientos_saldo_tras_chk check (saldo_tras >= 0),
  -- El ajuste del administrador es el único movimiento que no sale de una
  -- regla del juego, así que es el único que tiene que explicarse.
  constraint movimientos_motivo_admin_chk
    check (tipo <> 'ajuste_admin' or (motivo is not null and btrim(motivo) <> ''))
);

create index if not exists movimientos_jugador_creado_idx
  on public.movimientos (jugador_id, creado_en);

comment on table public.movimientos is
  'ECO-1a · Libro de sólo inserción. Una línea por cambio de saldo; clave_idem única. Lo escribe sólo aplicar_movimiento.';
comment on column public.movimientos.monto is
  'Con signo: positivo entra, negativo sale. En PvP, diferencia de fichas por asiento, nunca a partir de winner (Reglas ECO-1 §2).';

-- ── «No se borra ni se edita», escrito en la base ──────────────────────────
-- Sin políticas nadie del cliente puede tocar el libro, pero el SQL Editor sí,
-- y un `update` a mano descuadraría `saldo = Σ monto` sin dejar rastro. Este
-- disparador lo impide. La única excepción es el borrado EN CASCADA al borrar
-- una cuenta (ficha §2.1 c: `on delete cascade`): ese `delete` lo ejecuta el
-- disparador interno de la FK, así que llega con `pg_trigger_depth() >= 2`; un
-- `delete` escrito a mano llega con 1 y se rechaza. El `truncate` no pasa por
-- disparadores de fila y lleva el suyo.
create or replace function public.movimientos_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() >= 2 then
    return old;
  end if;
  raise exception 'movimientos_inmutable' using errcode = 'P0001',
    hint = 'El libro es de sólo inserción. Para corregir un saldo: public.ajuste_admin(jugador, monto, motivo).';
end
$fn$;

drop trigger if exists movimientos_inmutable_trg on public.movimientos;
create trigger movimientos_inmutable_trg
  before update or delete on public.movimientos
  for each row execute function public.movimientos_inmutable();

drop trigger if exists movimientos_sin_truncate_trg on public.movimientos;
create trigger movimientos_sin_truncate_trg
  before truncate on public.movimientos
  for each statement execute function public.movimientos_inmutable();


-- ── 4 · Quién ya cobró el bono ─────────────────────────────────────────────
-- Clave = sha256 en hex del correo canónico (D2). SIN FK a `auth.users` ni a
-- `profiles`, a propósito: borrar la cuenta arrastra en cascada todo lo demás
-- (informe §G.4), y esta fila es justo lo que tiene que quedarse. No caduca.
-- La futura «Eliminar cuenta» NO debe borrarla.
create table if not exists public.bonos_bienvenida (
  correo_hash text        primary key,
  otorgado_en timestamptz not null default now()
);

comment on table public.bonos_bienvenida is
  'ECO-1a · Huella sha256 del correo canónico de quien cobró el bono. Sin FK a propósito: sobrevive al borrado de la cuenta (D2).';


-- ── 5 · El límite de frecuencia del dinero ─────────────────────────────────
-- El precedente es `intentos_codigo` (SAL-A:177-192): sólo añadir, SIN clave
-- primaria a propósito —dos intentos en el mismo instante son dos hechos—, purga
-- al pasar. Una sola tabla para todas las funciones de dinero (informe §F.3),
-- separadas por `funcion`.
create table if not exists public.intentos_dinero (
  jugador_id uuid        not null references public.profiles(id) on delete cascade,
  funcion    text        not null,
  en         timestamptz not null default now()
);

create index if not exists intentos_dinero_idx
  on public.intentos_dinero (jugador_id, funcion, en);

comment on table public.intentos_dinero is
  'ECO-1a · Límite por minuto de las funciones de dinero. RLS activo y CERO políticas.';


-- ── 6 · Las constantes y los ayudantes puros ───────────────────────────────

-- La cifra del bono vive AQUÍ y en ningún otro sitio del SQL (D1). Su espejo
-- del cliente es `BONO_BIENVENIDA` en `src/config/salas.js`, que hoy dice 1200
-- y la 1b corrige.
create or replace function public.bono_bienvenida_hc()
returns bigint
language sql
immutable
set search_path = ''
as $fn$ select 2500::bigint $fn$;

comment on function public.bono_bienvenida_hc() is
  'ECO-1a · El bono de bienvenida en HC (D1). Espejo: BONO_BIENVENIDA en src/config/salas.js.';

-- ── El correo canónico (D2) ────────────────────────────────────────────────
-- Gmail y googlemail: minúsculas, la parte local cortada en el primer `+` y sin
-- puntos, y el dominio `gmail.com`. El resto de dominios: sólo minúsculas.
--   'Vi.Ctor+prueba@GoogleMail.com' → 'victor@gmail.com'
--   'Vi.Ctor+x@outlook.com'         → 'vi.ctor+x@outlook.com'
-- El dominio se toma tras la ÚLTIMA arroba; un texto sin arroba sólo se pasa a
-- minúsculas. `strict`: un correo nulo da nulo, y quien la llama lo trata.
create or replace function public.correo_canonico(p_correo text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $fn$
declare
  v_correo text := lower(p_correo);
  v_arroba integer;
  v_local  text;
  v_dominio text;
begin
  if strpos(v_correo, '@') = 0 then
    return v_correo;
  end if;
  v_arroba  := length(v_correo) - strpos(reverse(v_correo), '@') + 1;
  v_local   := left(v_correo, v_arroba - 1);
  v_dominio := substr(v_correo, v_arroba + 1);

  if v_dominio in ('gmail.com', 'googlemail.com') then
    return replace(split_part(v_local, '+', 1), '.', '') || '@gmail.com';
  end if;
  return v_correo;
end
$fn$;

-- ── La huella ──────────────────────────────────────────────────────────────
-- `sha256(bytea)` es del núcleo desde PostgreSQL 11 y vive en `pg_catalog`, que
-- se busca siempre aunque `search_path` sea '': no depende de `pgcrypto` ni del
-- esquema `extensions`. Se califica igualmente, para que se lea.
--
-- `stable` y no `immutable`: `convert_to()` está marcada `stable` en el
-- catálogo, y una función no debe prometer más que lo que llama.
create or replace function public.huella_correo(p_correo text)
returns text
language sql
stable
strict
set search_path = ''
as $fn$
  select pg_catalog.encode(
           pg_catalog.sha256(pg_catalog.convert_to(public.correo_canonico(p_correo), 'UTF8')),
           'hex')
$fn$;

-- ── El día de Chicago (D5) ─────────────────────────────────────────────────
-- La base vive en UTC (consulta O-10), así que «hoy» se pide siempre por aquí.
-- La zona va por NOMBRE: el cambio de horario lo pone la base de datos de
-- zonas, no un desfase escrito a mano.
--
-- `immutable`, y por qué no es una promesa de más: la zona está fija en el
-- cuerpo —no depende del `TimeZone` de la sesión, que es lo que hace `stable` a
-- un `::date` sobre `timestamptz`—, y el propio catálogo marca
-- `timezone(text, timestamptz)` como `immutable`. Lo que gana: se puede usar en
-- un índice de expresión, y la 1c/1e lo van a querer para contar «videos de
-- hoy» sin recorrer el libro. Lo que cuesta, declarado: si un día cambian las
-- reglas de horario de Chicago, las fechas ya indexadas no se recalculan solas.
create or replace function public.dia_chicago(p_ts timestamptz)
returns date
language sql
immutable
set search_path = ''
as $fn$ select (p_ts at time zone 'America/Chicago')::date $fn$;


-- ── 7 · El límite de frecuencia ────────────────────────────────────────────
-- Purga, anota y cuenta, en ese orden y como `unirse_sala` (B2:86-96). Devuelve
-- si el intento CABE: `true` mientras los de este minuto no pasen de `p_tope`.
--
-- SIN `raise` (S10): quien la llame y reciba `false` devuelve su propio
-- resultado de «demasiados intentos» y TERMINA NORMALMENTE, y así la anotación
-- se confirma con la transacción. Con un `raise` la fila se iría con el
-- rollback y el límite no contaría nunca (el defecto 2 de SAL-B1 A1:23-31).
--
-- Sin sesión, o sin perfil todavía (antes del Bautizo), no anota —la FK lo
-- impediría con un error— y responde `false`.
create or replace function public.contar_intento_dinero(p_funcion text, p_tope integer)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
  v_n   integer;
begin
  if v_uid is null or p_funcion is null or p_tope is null then
    return false;
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    return false;
  end if;

  delete from public.intentos_dinero
   where jugador_id = v_uid and en < now() - interval '1 hour';

  insert into public.intentos_dinero (jugador_id, funcion) values (v_uid, p_funcion);

  select count(*) into v_n
    from public.intentos_dinero
   where jugador_id = v_uid and funcion = p_funcion and en > now() - interval '1 minute';

  return v_n <= p_tope;
end
$fn$;


-- ── 8 · El corazón del libro ───────────────────────────────────────────────
-- El ÚNICO sitio que escribe `billeteras.saldo`, y siempre junto con su línea
-- en `movimientos`. Interna: la llaman las funciones `security definer` de cada
-- sub-tanda (que comprueban la regla del juego antes) y nunca el cliente.
--
-- El orden de la ficha §2.1 f, con UNA comprobación añadida:
--   1. ¿La clave ya está en el libro? → se devuelve ese movimiento, sin aplicar.
--   2. Bloqueo de la billetera (`for update`): ordena las carreras entre dos
--      dispositivos del mismo jugador.
--   1 bis. LA MISMA PREGUNTA OTRA VEZ, ya con el bloqueo. Sin ella, dos
--      llamadas simultáneas con la misma clave pasan las dos el paso 1, la
--      segunda espera el bloqueo, y al entrar choca con la clave única de la
--      primera. Con la segunda pregunta —en READ COMMITTED cada sentencia ve lo
--      ya confirmado— la segunda encuentra el movimiento y lo devuelve.
--   3. Saldo insuficiente → no aplica y lo dice, sin `raise`.
--   4. Saldo y línea, en la misma transacción.
--   5. Resultado con los tres campos rellenos, siempre.
--
-- Una clave repetida devuelve 'repetido' SÓLO si es el mismo movimiento (mismo
-- jugador, tipo y monto), con el saldo ACTUAL de la billetera (rector, M-2):
-- un reintento —el del video de la 1e, por ejemplo— pinta lo que hay ahora,
-- no lo que había cuando se escribió. Si la clave la tiene otro movimiento, eso
-- es un error del llamador y no un reintento: 'clave_en_uso', sin aplicar.
--
-- Las violaciones de restricción que se pueden prever se traducen a motivo en
-- vez de abortar: así la lista de tipos y la regla del motivo del
-- administrador viven SÓLO en las restricciones de §3.
create or replace function public.aplicar_movimiento(
  p_jugador  uuid,
  p_tipo     text,
  p_monto    bigint,
  p_clave    text,
  p_ref_tipo text default null,
  p_ref_id   text default null,
  p_motivo   text default null
)
returns public.movimiento_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_prev     public.movimientos;
  v_saldo    bigint;
  v_restr    text;
begin
  if p_jugador is null or p_tipo is null or p_clave is null or btrim(p_clave) = '' then
    return row(false, 0::bigint, 'argumento_invalido')::public.movimiento_resultado;
  end if;

  -- 1 · idempotencia
  select m.* into v_prev from public.movimientos m where m.clave_idem = p_clave;
  if found then
    return public.movimiento_repetido(v_prev, p_jugador, p_tipo, p_monto);
  end if;

  -- 2 · bloqueo
  select b.saldo into v_saldo
    from public.billeteras b
   where b.jugador_id = p_jugador
     for update;
  if not found then
    return row(false, 0::bigint, 'sin_billetera')::public.movimiento_resultado;
  end if;

  -- 1 bis · idempotencia, ya con el bloqueo
  select m.* into v_prev from public.movimientos m where m.clave_idem = p_clave;
  if found then
    return public.movimiento_repetido(v_prev, p_jugador, p_tipo, p_monto);
  end if;

  if p_monto is null or p_monto = 0 then
    return row(false, v_saldo, 'monto_invalido')::public.movimiento_resultado;
  end if;

  -- 3 · saldo
  if v_saldo + p_monto < 0 then
    return row(false, v_saldo, 'saldo_insuficiente')::public.movimiento_resultado;
  end if;

  -- 4 · las dos escrituras. El bloque es una subtransacción: si la línea no
  -- entra, el `update` del saldo se deshace con ella y nada queda a medias.
  --
  -- La marca `ajilei.libro` es el pase del disparador de `billeteras` (§2): el
  -- saldo sólo cambia con ella puesta, y se pone y se quita pegada al `update`
  -- para que nada más en la transacción la herede. Es local a la transacción
  -- (`true`) y, si el bloque se deshace, se deshace con él.
  begin
    perform pg_catalog.set_config('ajilei.libro', 'si', true);
    update public.billeteras
       set saldo = v_saldo + p_monto,
           actualizada_en = now()
     where jugador_id = p_jugador;
    perform pg_catalog.set_config('ajilei.libro', '', true);

    insert into public.movimientos
      (jugador_id, tipo, monto, saldo_tras, ref_tipo, ref_id, clave_idem, motivo)
    values
      (p_jugador, p_tipo, p_monto, v_saldo + p_monto, p_ref_tipo, p_ref_id, p_clave, p_motivo);
  exception
    when unique_violation then
      -- Otra transacción, de OTRO jugador (la de éste la ordena el bloqueo),
      -- escribió esta clave entre el paso 1 bis y el `insert`.
      select m.* into v_prev from public.movimientos m where m.clave_idem = p_clave;
      return public.movimiento_repetido(v_prev, p_jugador, p_tipo, p_monto);
    when check_violation then
      get stacked diagnostics v_restr = constraint_name;
      return row(false, v_saldo,
                 case v_restr
                   when 'movimientos_tipo_chk'         then 'tipo_invalido'
                   when 'movimientos_motivo_admin_chk' then 'motivo_obligatorio'
                   when 'movimientos_monto_chk'        then 'monto_invalido'
                   else 'restriccion:' || coalesce(v_restr, '?')
                 end)::public.movimiento_resultado;
  end;

  -- 5 · resultado
  return row(true, v_saldo + p_monto, 'aplicado')::public.movimiento_resultado;
end
$fn$;

-- La respuesta a una clave que ya estaba. Aparte porque `aplicar_movimiento` la
-- da desde tres sitios y las tres tienen que decir lo mismo. Se declara
-- DESPUÉS en el archivo y no importa: PL/pgSQL resuelve los nombres al
-- ejecutar, no al crear.
create or replace function public.movimiento_repetido(
  p_prev    public.movimientos,
  p_jugador uuid,
  p_tipo    text,
  p_monto   bigint
)
returns public.movimiento_resultado
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_actual bigint := coalesce(
    (select b.saldo from public.billeteras b where b.jugador_id = p_jugador), 0);
begin
  if p_prev.id is not null
     and p_prev.jugador_id = p_jugador
     and p_prev.tipo = p_tipo
     and p_prev.monto is not distinct from p_monto then
    -- Rector M-2: el saldo de AHORA, no el `saldo_tras` de aquel movimiento.
    return row(true, v_actual, 'repetido')::public.movimiento_resultado;
  end if;
  return row(false, v_actual, 'clave_en_uso')::public.movimiento_resultado;
end
$fn$;


-- ── 9 · El bono al crear el perfil ─────────────────────────────────────────
-- El perfil lo inserta el CLIENTE por PostgREST en el Bautizo
-- (`useAuth.crearPerfil`, informe §B.2), así que el bono no puede ir en el
-- cliente: va en un disparador `AFTER INSERT` sobre `profiles`.
--
-- La lógica vive en `abrir_billetera` y no en el disparador, porque el relleno
-- de §10 tiene que hacer EXACTAMENTE lo mismo (ficha §2.1 i): dos copias del
-- mismo procedimiento acaban divergiendo, como divergieron las tres guardas de
-- «ya en mesa» (SAL-B1 A1:41-46).
--
-- ── NUNCA IMPIDE CREAR EL PERFIL ───────────────────────────────────────────
-- Un `raise exception` que saliera de aquí desharía el `insert` del perfil, es
-- decir, el Bautizo entero (S10). Por eso cada paso va en su propio bloque con
-- `exception when others`, que deshace SÓLO ese paso, y el fallo sale por
-- `raise warning`, que no aborta nada y queda en los registros de Postgres del
-- panel de Supabase. Si el bono falla, la billetera queda abierta en 0 y Victor
-- lo corrige con `ajuste_admin`.
--
-- Devuelve qué pasó, para el relleno: 'bono' · 'ya_otorgado' · 'sin_correo' ·
-- 'sin_billetera' · 'error' · o el motivo de `aplicar_movimiento` si no pagó.
create or replace function public.abrir_billetera(p_jugador uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  v_correo text;
  v_huella text;
  v_res    public.movimiento_resultado;
begin
  -- 1 · la billetera, en 0
  begin
    insert into public.billeteras (jugador_id, saldo) values (p_jugador, 0)
    on conflict (jugador_id) do nothing;
  exception when others then
    raise warning 'ECO-1a: no se pudo abrir la billetera de % (% · %)', p_jugador, sqlstate, sqlerrm;
    return 'sin_billetera';
  end;

  -- 2 · el bono, una vez por correo canónico
  begin
    select u.email into v_correo from auth.users u where u.id = p_jugador;
    if v_correo is null or btrim(v_correo) = '' then
      raise warning 'ECO-1a: % no tiene correo; billetera en 0 y sin bono', p_jugador;
      return 'sin_correo';
    end if;

    v_huella := public.huella_correo(v_correo);

    -- La marca primero: si la fila ya estaba, esa persona ya cobró y aquí se
    -- acaba. El `on conflict` es lo que hace imposible el doble cobro aunque dos
    -- cuentas del mismo correo canónico se creen en el mismo milisegundo: la
    -- segunda espera a la primera en el índice y no inserta.
    insert into public.bonos_bienvenida (correo_hash) values (v_huella)
    on conflict (correo_hash) do nothing;
    if not found then
      return 'ya_otorgado';
    end if;

    v_res := public.aplicar_movimiento(
      p_jugador, 'bono_bienvenida', public.bono_bienvenida_hc(),
      'bono:' || v_huella, 'perfil', p_jugador::text, null);

    if not v_res.aplicado then
      -- Una marca sin pago dejaría a la persona sin bono para siempre. Se
      -- retira, salvo que la clave del bono la tenga otra cuenta viva de la
      -- misma persona: entonces el bono SÍ se cobró y la marca es verdad.
      if v_res.motivo <> 'clave_en_uso' then
        delete from public.bonos_bienvenida where correo_hash = v_huella;
      end if;
      raise warning 'ECO-1a: el bono de % no se aplicó (%)', p_jugador, v_res.motivo;
      return v_res.motivo;
    end if;

    return 'bono';
  exception when others then
    raise warning 'ECO-1a: el bono de % falló (% · %); billetera abierta sin bono', p_jugador, sqlstate, sqlerrm;
    return 'error';
  end;
end
$fn$;

create or replace function public.al_crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform public.abrir_billetera(new.id);
  return null;
exception when others then
  -- `abrir_billetera` ya captura todo; esto es la red de la red.
  raise warning 'ECO-1a: al_crear_perfil falló para % (% · %)', new.id, sqlstate, sqlerrm;
  return null;
end
$fn$;

drop trigger if exists profiles_abrir_billetera_trg on public.profiles;
create trigger profiles_abrir_billetera_trg
  after insert on public.profiles
  for each row execute function public.al_crear_perfil();


-- ── 10 · Las cuentas que ya existían (D3) ──────────────────────────────────
-- Cada perfil sin billetera pasa por `abrir_billetera`, igual que uno nuevo.
-- Re-ejecutable: un perfil que ya tiene billetera no entra en el bucle, y si
-- entrara, el `on conflict` de la marca y la `clave_idem` del movimiento
-- impedirían el segundo bono.
--
-- Por antigüedad: si dos cuentas viejas compartieran correo canónico, cobra la
-- primera que se creó. El resumen sale como NOTICE, sin uuids ni correos.
do $$
declare
  r      record;
  v_res  text;
  v_bono integer := 0;
  v_otro integer := 0;
begin
  for r in
    select p.id
      from public.profiles p
     where not exists (select 1 from public.billeteras b where b.jugador_id = p.id)
     order by p.created_at, p.id
  loop
    v_res := public.abrir_billetera(r.id);
    if v_res = 'bono' then v_bono := v_bono + 1; else v_otro := v_otro + 1; end if;
  end loop;
  raise notice 'ECO-1a relleno: % billeteras con bono, % sin bono', v_bono, v_otro;
end
$$;


-- ── 11 · Lo que el cliente puede leer ──────────────────────────────────────
-- El saldo del jugador de la sesión. Sin billetera —o sin sesión—, 0.
--
-- `returns bigint`, un escalar, y no un compuesto: la fila de nulos de SAL-B1
-- A2 nace de que PostgREST llama a una función de compuesto con
-- `select * from f()` y Postgres expande un compuesto nulo en una fila con
-- todas las columnas nulas. Un escalar llega como un número JSON, sin
-- expansión, y el `coalesce` impide además que sea `null`.
create or replace function public.mi_billetera()
returns bigint
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(
    (select b.saldo from public.billeteras b where b.jugador_id = auth.uid()),
    0)::bigint
$fn$;

comment on function public.mi_billetera() is
  'ECO-1a · Saldo del jugador de la sesión; 0 sin billetera. La lee el cliente desde la 1b.';


-- ── 12 · `saldo_de` deja de ser la constante ───────────────────────────────
-- MISMA firma y MISMO tipo de retorno (`integer`), para que `crear_sala` (A1:157)
-- y `unirse_sala` (B2:143) sigan compilando y comparando igual sin tocarlas.
-- `create or replace` conserva sus permisos de SAL-A:806 (revocada a todos); se
-- repiten abajo de todos modos.
--
-- El `least` es el precio de mantener `integer`: un saldo por encima de
-- 2.147.483.647 haría fallar el cast y, con él, sentarse en cualquier mesa. Con
-- el tope, quien tenga más que eso simplemente «tiene de sobra» para la regla 5×.
create or replace function public.saldo_de(p_uid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $fn$
  select least(
    coalesce((select b.saldo from public.billeteras b where b.jugador_id = p_uid), 0),
    2147483647)::integer
$fn$;

comment on function public.saldo_de(uuid) is
  'ECO-1a · Saldo de la billetera (0 si no hay). Lo usan crear_sala y unirse_sala para la regla 5×.';


-- ── 13 · El ajuste del administrador ───────────────────────────────────────
-- Para que Victor corrija o recargue cuentas de prueba desde el SQL Editor:
--
--   select * from public.ajuste_admin('<uuid>', 5000, 'recarga de prueba S25');
--
-- NO se concede a nadie (§14): en el SQL Editor se corre como `postgres`, el
-- dueño. El motivo es obligatorio y queda en el libro. Cada llamada genera su
-- propia clave, así que NO es idempotente: dos llamadas son dos ajustes.
-- Devuelve el saldo nuevo dentro del resultado (aplicado · saldo · motivo).
create or replace function public.ajuste_admin(p_jugador uuid, p_monto bigint, p_motivo text)
returns public.movimiento_resultado
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    return row(false,
               coalesce((select b.saldo from public.billeteras b where b.jugador_id = p_jugador), 0),
               'motivo_obligatorio')::public.movimiento_resultado;
  end if;
  return public.aplicar_movimiento(
    p_jugador, 'ajuste_admin', p_monto,
    'admin:' || pg_catalog.gen_random_uuid()::text,
    'admin', null, btrim(p_motivo));
end
$fn$;


-- ── 14 · Cerraduras y permisos ─────────────────────────────────────────────
-- RLS explícito en las cuatro, sin una sola política: lo que no está permitido
-- está prohibido. `enable` es idempotente, así que no choca con
-- `public.rls_auto_enable()` (consulta O-5), el ajuste de Supabase que ya lo
-- activa solo en cada tabla nueva de `public`: si lo hizo, esto no cambia nada.
alter table public.billeteras        enable row level security;
alter table public.movimientos       enable row level security;
alter table public.bonos_bienvenida  enable row level security;
alter table public.intentos_dinero   enable row level security;

-- Y además, sin privilegios de tabla para el cliente. Supabase concede por
-- defecto TODO sobre las tablas nuevas de `public` a `anon` y `authenticated`;
-- con RLS y sin políticas eso ya no da filas, pero `truncate` no pasa por RLS y
-- un `select` que devuelve 0 filas en vez de «permiso denegado» esconde un
-- error de diseño. Para dinero, la puerta cerrada del todo. `service_role` (el
-- backend) conserva lo suyo.
revoke all on table public.billeteras       from public, anon, authenticated;
revoke all on table public.movimientos      from public, anon, authenticated;
revoke all on table public.bonos_bienvenida from public, anon, authenticated;
revoke all on table public.intentos_dinero  from public, anon, authenticated;

-- Funciones. Postgres concede EXECUTE a `public` en toda función nueva y
-- Supabase además a `anon` y `authenticated` (SAL-A:782-786): se retira a los
-- tres en todas, y sólo `mi_billetera` se devuelve a `authenticated`.
revoke execute on function public.bono_bienvenida_hc()                                  from public, anon, authenticated;
revoke execute on function public.correo_canonico(text)                                 from public, anon, authenticated;
revoke execute on function public.huella_correo(text)                                   from public, anon, authenticated;
revoke execute on function public.dia_chicago(timestamptz)                              from public, anon, authenticated;
revoke execute on function public.contar_intento_dinero(text, integer)                  from public, anon, authenticated;
revoke execute on function public.aplicar_movimiento(uuid, text, bigint, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.movimiento_repetido(public.movimientos, uuid, text, bigint)   from public, anon, authenticated;
revoke execute on function public.abrir_billetera(uuid)                                 from public, anon, authenticated;
revoke execute on function public.al_crear_perfil()                                     from public, anon, authenticated;
revoke execute on function public.movimientos_inmutable()                               from public, anon, authenticated;
revoke execute on function public.billeteras_solo_por_libro()                           from public, anon, authenticated;
revoke execute on function public.ajuste_admin(uuid, bigint, text)                      from public, anon, authenticated;
revoke execute on function public.saldo_de(uuid)                                        from public, anon, authenticated;
revoke execute on function public.mi_billetera()                                        from public, anon;

grant execute on function public.mi_billetera() to authenticated;


-- ── 15 · Realtime: fuera, y comprobado ─────────────────────────────────────
-- Una tabla nueva no entra en `supabase_realtime` salvo que se la añada (como
-- hizo SAL-A:851-866 con las suyas) o que la publicación sea `for all tables`.
-- Este bloque no añade nada: comprueba. Si alguna estuviera dentro, la saca; si
-- la publicación fuera `for all tables`, el push se detiene, porque D6 no se
-- podría cumplir sin cambiar algo que no es de esta tanda.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables) then
    raise exception 'ECO-1a: supabase_realtime es FOR ALL TABLES; las tablas de dinero no pueden quedar fuera';
  end if;
  foreach t in array array['billeteras', 'movimientos', 'bonos_bienvenida', 'intentos_dinero'] loop
    if exists (select 1 from pg_publication_tables
                where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — en `supabase/pruebas/eco1a_verificacion.sql`, no aquí.
-- ═══════════════════════════════════════════════════════════════════════════
-- Un solo bloque que Victor pega en el SQL Editor DESPUÉS del push; devuelve
-- una tabla `prueba | resultado | detalle` con PASA o FALLA y no deja rastro.
--
-- CORRIDA REAL · pendiente. Se anota aquí con fecha y resultado cuando Victor la
-- ejecute.
-- ═══════════════════════════════════════════════════════════════════════════
