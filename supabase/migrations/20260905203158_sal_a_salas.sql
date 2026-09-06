-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · SAL-A — Salas PvP: tablas, cerraduras y las funciones que arbitran
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector: AJILEI_SALA_Fase1_v1.0.md §2. Hechos de partida:
-- AJILEI_SAL_Fase0_Informe_v1.0.md. Molde de cerradura: 0001_sup2a_identidad.sql.
--
-- Se aplica con `npx supabase db push`. Va envuelto en la transacción implícita
-- de la CLI: si algo revienta a mitad no queda medio esquema en pie.
--
-- ── LA DOCTRINA QUE ESTE ARCHIVO MATERIALIZA ──────────────────────────────
--
-- 1. EL CLIENTE NO ESCRIBE. Ni una política de INSERT, UPDATE o DELETE sobre
--    estas tablas para nadie. Todo pasa por funciones `security definer` que
--    comprueban antes de escribir. Un cliente que pudiera hacer
--    `insert into sala_jugadores` se sentaría sin saldo, ocuparía dos asientos
--    y resucitaría salas vencidas — y en un juego con dinero eso no es una
--    hipótesis, es lo primero que alguien intenta.
--
-- 2. TODO CUELGA DE `auth.users.id`. Herencia literal de SUP-2a: «el nombre es
--    rótulo; el ID es contrato». `anfitrion_id` y `jugador_id` son uuid con
--    clave foránea a `profiles(id)`, jamás el username, que es mutable.
--
-- 3. LOS ERRORES SON CLAVES, NO PROSA. Cada `raise` lleva `errcode = 'P0001'` y
--    un mensaje que es una clave de una palabra: `ya_en_sala`,
--    `saldo_insuficiente`… El cliente las traduce con `t('sal.error.<clave>')`.
--    Mismo criterio que SUP-2a con sus tres sqlstate: se compara por código y
--    nunca por texto, porque la prosa cambia y el contrato no.
--
-- 4. EL RELOJ ES EL DEL SERVIDOR. `expira_en` es un `timestamptz` que pone la
--    base, y quien decide si una sala venció es `barrer_salas()`, no el
--    cronómetro de ningún teléfono. El cliente cuenta para ENSEÑAR; el servidor
--    cuenta para DECIDIR.
--
-- 5. NADA DE ECONOMÍA REAL. `saldo_de()` devuelve la constante provisional, como
--    su espejo `src/lib/saldo.js`. La billetera es ECO-1.
--
-- 6. NADA DE PARTIDA. `estado_partida` nace y se queda en `null`. Repartir
--    cartas es MES-PvP, y necesita antes las tres ediciones de `gameEngine.js`
--    que la Fase 0 §4.10 dejó pedidas y que NO son de esta tanda.
--
-- ── IDEMPOTENCIA, Y HASTA DÓNDE ───────────────────────────────────────────
-- Todo lo que admite `if not exists` lo lleva, y las políticas van precedidas de
-- su `drop policy if exists`, para que una segunda pasada no se caiga a mitad y
-- deje el esquema partido. Los `insert` de datos no existen aquí, así que no hay
-- nada que se pueda duplicar.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1 · Los dos vocabularios cerrados ──────────────────────────────────────
-- `enum` y no `text` con `check`: el enum se ve en el catálogo, sale en el dump,
-- y un valor mal escrito falla al COMPILAR la función en vez de al ejecutarla
-- con el jugador delante. El coste conocido es que añadir un valor pide
-- `alter type`; con dos vocabularios de tres valores que son reglas del juego,
-- ese coste es una ventaja.
--
-- `sala_estado` no tiene 'terminada': una partida acabada es asunto de MES-PvP y
-- de la tabla que aquella campaña traiga. Aquí una sala vive hasta que arranca
-- ('activa') o hasta que no arrancó ('cancelada').
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'sala_tipo' and n.nspname = 'public') then
    create type public.sala_tipo as enum ('privada', 'abierta');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'sala_estado' and n.nspname = 'public') then
    create type public.sala_estado as enum ('esperando', 'activa', 'cancelada');
  end if;
end
$$;


-- ── 2 · Las mesas ──────────────────────────────────────────────────────────
-- Las seis apuestas y el rango de jugadores viven en `check` de columna, que es
-- lo que pide la regla 5 de la tanda: la cifra sellada, una vez, citada donde se
-- aplica. Su espejo del cliente es `src/config/salas.js`, que NO valida — sólo
-- decide qué botón enseñar apagado (misma doctrina que `REGLA_USERNAME` en
-- `useAuth.js:66`). Si un día divergen, manda esto.
create table if not exists public.salas (
  id             uuid               primary key default gen_random_uuid(),

  -- Sólo las privadas llevan código. Una mesa abierta se encuentra en el
  -- listado, y darle un código sería inventar una segunda puerta a un sitio que
  -- no tiene cerradura.
  codigo         text               unique,

  tipo           public.sala_tipo   not null,
  jugadores      smallint           not null check (jugadores between 2 and 5),
  apuesta        integer            not null check (apuesta in (100, 200, 500, 1000, 2000, 5000)),
  anfitrion_id   uuid               not null references public.profiles(id) on delete cascade,
  estado         public.sala_estado not null default 'esperando',
  creada_en      timestamptz        not null default now(),

  -- Los tres minutos sellados. `DURACION_SALA_SEG` en `config/salas.js` es la
  -- misma cifra en segundos; no hay forma de que un test compare las dos, así
  -- que si una cambia la otra se cambia A MANO.
  expira_en      timestamptz        not null default now() + interval '3 minutes',

  iniciada_en    timestamptz,

  -- MES-PvP guardará aquí el estado del motor, que la Fase 0 §4.5 midió como un
  -- objeto plano de ~3,4 KB que sobrevive un ida y vuelta por JSON byte a byte.
  -- SAL lo deja en `null` y no lo lee nadie.
  estado_partida jsonb,

  -- El alfabeto sin O/0/I/1, el mismo que `ALFABETO_CODIGO` escribe en extenso.
  constraint salas_codigo_formato_chk
    check (codigo is null or codigo ~ '^AJ-[A-HJ-NP-Z2-9]{4}$'),

  -- Las dos direcciones a la vez: una privada SIN código sería inalcanzable, y
  -- una abierta CON código prometería una puerta que el listado ya abre. El `=`
  -- entre dos booleanos es la forma corta de «lo uno si y sólo si lo otro».
  constraint salas_codigo_solo_privada_chk
    check ((tipo = 'privada') = (codigo is not null))
);

comment on table public.salas is
  'SAL-A · Mesas PvP. Sólo las funciones security definer escriben aquí.';
comment on column public.salas.estado_partida is
  'MES-PvP guardará el estado del motor. SAL lo deja null.';

-- ── La regla sellada de «una sola mesa abierta por combinación» ────────────
-- Un índice único PARCIAL, y no una comprobación dentro de `crear_sala`. La
-- diferencia importa: entre un `select` que no encuentra nada y el `insert` que
-- sigue caben otros jugadores, y dos anfitriones simultáneos crearían dos mesas
-- de 4×500. El índice no tiene esa rendija — la segunda inserción rebota con
-- `unique_violation` aunque llegue en el mismo milisegundo.
--
-- Es parcial porque la regla sólo rige mientras la mesa ESPERA: en cuanto
-- arranca o se cancela, la combinación queda libre para la siguiente.
create unique index if not exists salas_abierta_unica_idx
  on public.salas (jugadores, apuesta)
  where tipo = 'abierta' and estado = 'esperando';

-- Para `barrer_salas`, que busca exactamente por estas dos columnas.
create index if not exists salas_estado_expira_idx
  on public.salas (estado, expira_en);


-- ── 3 · Los asientos ───────────────────────────────────────────────────────
-- La clave primaria compuesta impide que un jugador ocupe dos sillas de la misma
-- mesa; el `unique (sala_id, asiento)` impide que dos jugadores ocupen la misma
-- silla. Son dos reglas distintas y hacen falta las dos.
--
-- `asiento` va de 0 a 4 porque el motor indexa los asientos por posición y el 0
-- es la Mano de la primera mano. El anfitrión se sienta en el 0 al crear.
create table if not exists public.sala_jugadores (
  sala_id     uuid        not null references public.salas(id)    on delete cascade,
  jugador_id  uuid        not null references public.profiles(id) on delete cascade,
  asiento     smallint    not null check (asiento between 0 and 4),
  sentado_en  timestamptz not null default now(),
  primary key (sala_id, jugador_id),
  unique (sala_id, asiento)
);

comment on table public.sala_jugadores is
  'SAL-A · Quién está sentado y en qué silla. Un jugador, como mucho, en UNA sala en espera — lo garantizan los RPC, no un índice.';

-- Por qué «un jugador en una sola sala en espera» NO es un índice: la condición
-- vive en la tabla PADRE (`salas.estado`), y un índice parcial no puede mirar
-- otra tabla. Se comprueba en `crear_sala` y `unirse_sala`, que son los dos
-- únicos caminos que insertan aquí. El coste declarado es que dos peticiones
-- simultáneas del MISMO jugador a dos salas distintas podrían colarse; se
-- acepta porque exige dos dispositivos del mismo dueño actuando en el mismo
-- milisegundo, y lo peor que produce es un asiento fantasma que el barrido
-- cierra a los tres minutos.

-- Para contar sentados por sala, que es lo que hacen casi todas las funciones.
create index if not exists sala_jugadores_sala_idx
  on public.sala_jugadores (sala_id);
-- Y para «¿en qué sala está este jugador?», que es `mi_sala` y las dos guardas
-- de `ya_en_sala`.
create index if not exists sala_jugadores_jugador_idx
  on public.sala_jugadores (jugador_id);


-- ── 4 · El registro de intentos de código ──────────────────────────────────
-- Sin esto, `AJ-XXXX` es un secreto de 32⁴ = 1 048 576 combinaciones que un
-- script prueba entero en minutos. Con cinco intentos por minuto, agotarlo pide
-- cuatro años — y la sala sólo vive tres minutos.
--
-- Es un registro de sólo-añadir, sin clave primaria a propósito: dos intentos en
-- el mismo instante son dos hechos distintos y no hay nada que deduplicar.
create table if not exists public.intentos_codigo (
  jugador_id   uuid        not null references public.profiles(id) on delete cascade,
  intentado_en timestamptz not null default now()
);
create index if not exists intentos_codigo_idx
  on public.intentos_codigo (jugador_id, intentado_en);

comment on table public.intentos_codigo is
  'SAL-A · Límite de fuerza bruta sobre los códigos AJ-XXXX. RLS activo y CERO políticas.';


-- ── 5 · `replica identity full`, el paso que no se supone ──────────────────
-- Por defecto un `DELETE` viaja por Realtime con SÓLO la clave primaria. Para
-- `sala_jugadores` eso significaría enterarse de que alguien se levantó sin
-- saber de qué mesa —el `sala_id` está en la clave, así que ahí se salva— pero
-- sin su `asiento`, que es lo que la pantalla necesita para vaciar la silla.
-- Con `full`, la fila borrada llega entera.
--
-- El coste es real y se declara: cada UPDATE escribe la fila vieja completa en
-- el WAL. Con filas de siete columnas y una decena de cambios por sala, es
-- ruido. Si algún día `estado_partida` crece a megabytes, esto se revisa.
alter table public.salas           replica identity full;
alter table public.sala_jugadores  replica identity full;


-- ── 6 · Las cerraduras ─────────────────────────────────────────────────────
alter table public.salas            enable row level security;
alter table public.sala_jugadores   enable row level security;
alter table public.intentos_codigo  enable row level security;

-- ── Los dos ayudantes de las políticas, y por qué existen ─────────────────
-- Una política que consulte otra tabla dispara la RLS de ESA tabla, y como las
-- dos políticas se miran entre sí (`salas` pregunta por miembros, `sala_jugadores`
-- pregunta si la sala es pública), la evaluación se anidaría sola. `security
-- definer` corta el nudo: estas dos funciones leen sin RLS, devuelven un
-- booleano, y las políticas no se llaman entre ellas.
--
-- `search_path = ''` con todo calificado a mano es lo que impide que ese
-- privilegio se convierta en una vía de escalada — sin él, un esquema intruso en
-- el path puede suplantar una tabla y hacerse leer como el definidor. Misma
-- precaución que `validar_username` en SUP-2a.
create or replace function public.es_miembro(p_sala uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.sala_jugadores j
    where j.sala_id = p_sala and j.jugador_id = p_uid
  )
$fn$;

create or replace function public.es_sala_publica(p_sala uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.salas s
    where s.id = p_sala and s.tipo = 'abierta' and s.estado = 'esperando'
  )
$fn$;

-- LECTURA de salas: las abiertas que esperan las ve cualquiera —es el listado— y
-- la propia la ve quien está sentado en ella, en el estado que sea. La segunda
-- mitad no es cortesía: un jugador tiene que poder ver que su sala pasó a
-- 'cancelada' o a 'activa', y si dejara de verla al cambiar de estado, la
-- pantalla se quedaría mirando una fila que desapareció sin explicación.
drop policy if exists salas_select_visibles on public.salas;
create policy salas_select_visibles
  on public.salas for select
  to authenticated
  using (
    (estado = 'esperando' and tipo = 'abierta')
    or public.es_miembro(id, auth.uid())
  );

-- LECTURA de asientos: los de tu sala, y los de cualquier mesa abierta que
-- espere (el listado enseña «3 de 5», y ese recuento sale de aquí).
drop policy if exists sala_jugadores_select_visibles on public.sala_jugadores;
create policy sala_jugadores_select_visibles
  on public.sala_jugadores for select
  to authenticated
  using (
    public.es_miembro(sala_id, auth.uid())
    or public.es_sala_publica(sala_id)
  );

-- ESCRITURA: ninguna política, en las tres tablas y para los tres comandos. Con
-- RLS activo, lo que no está permitido está prohibido. `intentos_codigo` se
-- queda además sin política de lectura: un jugador que pudiera leer su propio
-- contador sabría exactamente cuándo se le reinicia.


-- ── 7 · Las constantes selladas del servidor ───────────────────────────────
-- La regla 5× vive UNA vez, aquí, y las dos funciones que la aplican la citan.
-- `immutable` para que el planificador la incruste y no cueste nada.
create or replace function public.regla_asiento()
returns smallint
language sql
immutable
set search_path = ''
as $fn$ select 5::smallint $fn$;

comment on function public.regla_asiento() is
  'SAL-A · Saldo mínimo = este número × la apuesta. Espejo de REGLA_ASIENTO en src/config/salas.js.';

-- ── El reloj ───────────────────────────────────────────────────────────────
-- La única razón de que exista: el cliente necesita medir su DESFASE una vez al
-- entrar. Un teléfono con la fecha corrida —y los hay— vería una sala vencida
-- hace dos días o con cuarenta horas por delante. No lleva `security definer`
-- porque `now()` no necesita privilegios de nadie.
create or replace function public.ahora()
returns timestamptz
language sql
stable
set search_path = ''
as $fn$ select now() $fn$;

-- ── El saldo, PROVISIONAL ──────────────────────────────────────────────────
-- Devuelve la constante. No hay billetera: el producto no tiene ledger y una
-- cifra que no se mueve es lo único honesto hasta que exista. ECO-1 lo sustituye
-- por la consulta de verdad y ninguna de las funciones de abajo se entera, que
-- es el motivo de que la regla 5× pregunte por aquí y no lea una tabla.
--
-- Espejo de `saldoDelJugador()` en `src/lib/saldo.js`. Las dos constantes se
-- mueven juntas el día que se muevan.
create or replace function public.saldo_de(p_uid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $fn$ select 5000 $fn$;

comment on function public.saldo_de(uuid) is
  'SAL-A · PROVISIONAL: constante. ECO-1 lo sustituye por la billetera real.';


-- ── 8 · El barrido ─────────────────────────────────────────────────────────
-- Toda sala que esperaba y venció se resuelve: arranca si hay al menos dos
-- sentados, se cancela si no.
--
-- ── POR QUÉ NO HAY `pg_cron` ───────────────────────────────────────────────
-- Porque no hace falta y porque añadiría una pieza que puede pararse sin que
-- nadie se entere. El barrido lo dispara quien MIRA: `salas_abiertas`,
-- `crear_sala` y `unirse_sala` lo llaman al empezar, así que nadie llega a ver
-- ni a entrar en una sala muerta. Una sala vencida que nadie mira se queda un
-- rato con el estado viejo, y eso no le hace daño a nadie — no la ve ni la
-- ocupa nadie, justamente porque nadie está mirando.
--
-- El `and s.estado = 'esperando'` del `where` final parece redundante con el de
-- la CTE y no lo es: si dos llamadas concurrentes barren la misma fila, la
-- segunda se despierta tras el bloqueo y Postgres reevalúa esta condición sobre
-- la fila YA actualizada. Sin ella, la segunda reescribiría encima.
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
end
$fn$;

-- Lo mismo para UNA sala. La llama el cliente cuando su cronómetro toca cero:
-- es idempotente y los cinco jugadores pueden llamarla a la vez sin que el
-- resultado cambie. Devuelve la fila para que quien la llame no tenga que
-- volver a pedirla.
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
    update public.salas
       set estado      = case when v_sentados >= 2 then 'activa'::public.sala_estado
                              else 'cancelada'::public.sala_estado end,
           iniciada_en = case when v_sentados >= 2 then now() else iniciada_en end
     where id = p_sala
     returning * into v_sala;
  end if;

  return v_sala;
end
$fn$;


-- ── 9 · Abrir mesa ─────────────────────────────────────────────────────────
-- El orden de las comprobaciones NO es casual: primero se barre (para no chocar
-- con una sala que en realidad ya venció), luego se mira al jugador (¿ya está en
-- otra? ¿tiene saldo?) y sólo al final se toca la tabla.
--
-- ── «ABRIR» SE VUELVE «UNIRME» ────────────────────────────────────────────
-- Regla sellada. Si se pide una mesa abierta de 4×500 y ya hay una esperando, no
-- se crea una segunda: se entra en aquélla. Vive aquí y no en el cliente porque
-- entre la consulta del cliente y su creación cabe otro jugador; y aun así el
-- índice parcial de arriba es la red que atrapa el caso en que dos anfitriones
-- lleguen en el mismo milisegundo.
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
  -- El alfabeto sin O/0/I/1. Los dos pares que se confunden a la vista salen de
  -- la baraja porque un código se dicta por teléfono y se teclea mirando una
  -- captura. Espejo literal de `ALFABETO_CODIGO`.
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

  if exists (
    select 1 from public.sala_jugadores j
      join public.salas s on s.id = j.sala_id
     where j.jugador_id = v_uid and s.estado = 'esperando'
  ) then
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

  -- ── El código de las privadas ────────────────────────────────────────────
  -- `random()` y no `gen_random_bytes`: NO es criptográficamente seguro, y se
  -- declara. Es aceptable aquí y sólo aquí porque el código no protege dinero
  -- por sí solo — vive tres minutos, sólo sirve mientras la sala espera, y
  -- `unirse_sala` corta a los cinco intentos por minuto. Adivinar uno exige
  -- probar del orden de 500 000 combinaciones a 5 por minuto: dos años para una
  -- puerta que se cierra en tres minutos.
  --
  -- Los diez reintentos son para la colisión, no para el atacante: con un millón
  -- de códigos y un puñado de salas vivas, chocar dos veces seguidas es
  -- prácticamente imposible, y el `unique` de la columna es quien lo decide.
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

  -- El anfitrión se sienta en el 0, que es la Mano de la primera mano.
  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, 0);

  return v_sala;
end
$fn$;


-- ── 10 · Sentarse ──────────────────────────────────────────────────────────
-- Por código o por id. Idempotente: si ya estás dentro, devuelve la sala sin
-- error — es lo que hace que una recarga o un doble clic no produzcan un fallo
-- que el jugador no provocó.
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
    -- Normalización, espejo de `normalizarCodigo` en `config/salas.js`: fuera
    -- todo lo que no sea letra o dígito, a mayúsculas, y el prefijo se reconoce
    -- por LONGITUD y no por sus dos primeras letras (un cuerpo legítimo puede
    -- empezar por «AJ», porque A y J están las dos en el alfabeto).
    v_cuerpo := upper(regexp_replace(p_codigo, '[^A-Za-z0-9]', '', 'g'));
    if length(v_cuerpo) = 6 and left(v_cuerpo, 2) = 'AJ' then
      v_cuerpo := substr(v_cuerpo, 3);
    elsif length(v_cuerpo) <> 4 then
      v_cuerpo := null;
    end if;

    -- Un código mal formado NO cuenta como intento: no puede coincidir con nada,
    -- así que no es fuerza bruta y contarlo sólo castigaría al que se equivoca
    -- tecleando.
    if v_cuerpo is null or v_cuerpo !~ '^[A-HJ-NP-Z2-9]{4}$' then
      raise exception 'codigo_invalido' using errcode = 'P0001';
    end if;

    -- Higiene: el registro es de sólo-añadir y sin esto crece para siempre. Una
    -- hora es de sobra para una ventana de un minuto.
    --
    -- Se acota al jugador ACTUAL y no a toda la tabla, para que el borrado entre
    -- por `intentos_codigo_idx` en vez de recorrerla entera en cada intento de
    -- código. Cada jugador limpia lo suyo al pasar, que es todo lo que hace
    -- falta: nadie acumula filas de otro.
    delete from public.intentos_codigo
     where jugador_id = v_uid and intentado_en < now() - interval '1 hour';

    -- Se registra ANTES de contar, a propósito: así el intento que se rechaza
    -- también cuenta y un atacante no obtiene un sondeo gratis por cada bloqueo.
    insert into public.intentos_codigo (jugador_id) values (v_uid);

    select count(*) into v_intentos
      from public.intentos_codigo
     where jugador_id = v_uid and intentado_en > now() - interval '1 minute';
    if v_intentos > 5 then
      raise exception 'demasiados_intentos' using errcode = 'P0001';
    end if;

    select * into v_sala from public.salas where codigo = 'AJ-' || v_cuerpo for update;
  elsif p_sala is not null then
    select * into v_sala from public.salas where id = p_sala for update;
  else
    raise exception 'codigo_invalido' using errcode = 'P0001';
  end if;

  if v_sala.id is null then
    raise exception 'sala_no_disponible' using errcode = 'P0001';
  end if;

  -- La idempotencia va PRIMERO: si ya estás dentro, ni el aforo ni el saldo ni
  -- el vencimiento pueden convertir tu propia sala en un error.
  if public.es_miembro(v_sala.id, v_uid) then
    return v_sala;
  end if;

  if v_sala.estado <> 'esperando' or v_sala.expira_en <= now() then
    raise exception 'sala_no_disponible' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.sala_jugadores j
      join public.salas s on s.id = j.sala_id
     where j.jugador_id = v_uid and s.estado = 'esperando'
  ) then
    raise exception 'ya_en_sala' using errcode = 'P0001';
  end if;

  if public.saldo_de(v_uid) < public.regla_asiento() * v_sala.apuesta then
    raise exception 'saldo_insuficiente' using errcode = 'P0001';
  end if;

  select count(*) into v_sentados from public.sala_jugadores where sala_id = v_sala.id;
  if v_sentados >= v_sala.jugadores then
    raise exception 'sala_llena' using errcode = 'P0001';
  end if;

  -- El asiento libre MÁS BAJO, y no el siguiente número: si el de la silla 1 se
  -- levantó, el próximo en llegar ocupa esa silla y no la 3. Sin esto, una sala
  -- de cinco con entradas y salidas acabaría con asientos 0, 3 y 7 — y el 7 no
  -- existe.
  select min(g) into v_asiento
    from generate_series(0, v_sala.jugadores - 1) as g
   where g not in (select asiento from public.sala_jugadores where sala_id = v_sala.id);

  insert into public.sala_jugadores (sala_id, jugador_id, asiento)
  values (v_sala.id, v_uid, v_asiento);

  return v_sala;
end
$fn$;


-- ── 11 · Levantarse ────────────────────────────────────────────────────────
-- El anfitrión que se va CANCELA la mesa; los demás sólo dejan su silla. Es la
-- regla sellada, y su motivo es que el anfitrión eligió las condiciones: una
-- mesa de 4×2000 sin quien la abrió es una mesa que nadie pidió.
--
-- La fila NO se borra al cancelar: se marca. Los otros jugadores tienen que
-- ENTERARSE, y un `delete` les llegaría por Realtime como la desaparición de una
-- sala que estaban mirando. Marcarla deja que la pantalla diga qué pasó.
create or replace function public.salir_sala(p_sala uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid  uuid := auth.uid();
  v_sala public.salas;
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
    delete from public.sala_jugadores where sala_id = p_sala and jugador_id = v_uid;
  end if;
end
$fn$;


-- ── 12 · Arrancar antes de tiempo ──────────────────────────────────────────
-- Sólo el anfitrión, y sólo con dos sentados. NO crea `estado_partida`: repartir
-- cartas es MES-PvP.
create or replace function public.jugar_ya(p_sala uuid)
returns public.salas
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid      uuid := auth.uid();
  v_sala     public.salas;
  v_sentados integer;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = 'P0001';
  end if;

  select * into v_sala from public.salas where id = p_sala for update;
  if not found then
    raise exception 'sala_no_disponible' using errcode = 'P0001';
  end if;
  if v_sala.anfitrion_id <> v_uid then
    raise exception 'no_eres_anfitrion' using errcode = 'P0001';
  end if;
  if v_sala.estado <> 'esperando' then
    raise exception 'sala_no_disponible' using errcode = 'P0001';
  end if;

  select count(*) into v_sentados from public.sala_jugadores where sala_id = p_sala;
  if v_sentados < 2 then
    raise exception 'faltan_jugadores' using errcode = 'P0001';
  end if;

  update public.salas
     set estado = 'activa', iniciada_en = now()
   where id = p_sala
   returning * into v_sala;

  return v_sala;
end
$fn$;


-- ── 13 · El listado ────────────────────────────────────────────────────────
-- Lo que pinta SAL-1. Barre primero para que nadie vea una mesa que ya murió.
-- El orden —más llenas primero, y a igualdad la apuesta más baja— es una
-- decisión de producto: una mesa a la que le falta uno arranca antes, y ésa es
-- la que conviene enseñar arriba.
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
     order by (select count(*) from public.sala_jugadores j where j.sala_id = s.id) desc,
              s.apuesta asc;
end
$fn$;


-- ── 14 · Mi sala ───────────────────────────────────────────────────────────
-- Para reanudar tras una recarga. Devuelve `null` si no hay ninguna.
--
-- BARRE PRIMERO, y esto es una añadidura declarada sobre el rector §2.3, que
-- sólo pedía el barrido en `salas_abiertas`, `crear_sala` y `unirse_sala`. El
-- motivo: `mi_sala` es exactamente la llamada que hace un jugador que VUELVE, y
-- volver después de tres minutos es el caso normal —cerró la app, atendió una
-- llamada—. Sin barrer, se le devolvería una sala 'esperando' que en realidad
-- venció, y su cronómetro arrancaría en cero sin que nada la resolviera.
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
    join public.sala_jugadores j on j.sala_id = s.id
   where j.jugador_id = v_uid and s.estado in ('esperando', 'activa')
   order by s.creada_en desc
   limit 1;

  -- `return v_sala` a secas devolvería una FILA DE NULOS y no `null`: un
  -- `select … into` que no encuentra nada deja la variable compuesta con todos
  -- sus campos vacíos, pero la variable en sí no es nula. PostgREST lo
  -- entregaría como `{"id":null,"codigo":null,…}` y el cliente creería que hay
  -- sala. `not found` es lo que distingue las dos cosas.
  if not found then
    return null;
  end if;

  return v_sala;
end
$fn$;


-- ── 15 · Quién puede llamar a qué ──────────────────────────────────────────
-- Postgres concede EXECUTE a `public` por defecto en toda función nueva, así que
-- sin este bloque un anónimo con la llave publicable —que por diseño acaba en el
-- navegador— podría llamarlas todas. Se revoca a `public` (que es lo que retira
-- el defecto de verdad) y se concede sólo a `authenticated`.
--
-- ── DOS EXCEPCIONES QUE NO SON DESCUIDO ───────────────────────────────────
-- `es_miembro` y `es_sala_publica` SÍ se conceden a `authenticated`, aunque no
-- sean API y nadie las llame desde el cliente. El motivo es que Postgres exige
-- EXECUTE al rol que consulta también para las funciones que aparecen dentro de
-- una expresión de POLÍTICA: si se las revocara, cualquier `select` sobre
-- `salas` moriría con «permission denied for function es_miembro» y las dos
-- tablas quedarían ilegibles para todo el mundo.
--
-- El coste declarado es que un autenticado puede llamarlas como RPC y averiguar
-- si un uuid concreto está en una sala concreta. Para explotarlo hay que conocer
-- ya los dos uuid, y no revela nada que la propia pantalla no enseñe; se acepta
-- a cambio de que las políticas funcionen.
--
-- `saldo_de`, `regla_asiento` y `barrer_salas` sí se revocan a todos: sólo se
-- llaman DESDE otras funciones `security definer`, y ahí corren como el
-- definidor, que no pierde el privilegio.
revoke execute on function public.ahora()                                            from public, anon;
revoke execute on function public.regla_asiento()                                    from public, anon, authenticated;
revoke execute on function public.saldo_de(uuid)                                     from public, anon, authenticated;
revoke execute on function public.es_miembro(uuid, uuid)                             from public, anon;
revoke execute on function public.es_sala_publica(uuid)                              from public, anon;
revoke execute on function public.barrer_salas()                                     from public, anon, authenticated;
revoke execute on function public.resolver_sala(uuid)                                from public, anon;
revoke execute on function public.crear_sala(public.sala_tipo, smallint, integer)    from public, anon;
revoke execute on function public.unirse_sala(text, uuid)                            from public, anon;
revoke execute on function public.salir_sala(uuid)                                   from public, anon;
revoke execute on function public.jugar_ya(uuid)                                     from public, anon;
revoke execute on function public.salas_abiertas()                                   from public, anon;
revoke execute on function public.mi_sala()                                          from public, anon;

grant execute on function public.ahora()                                          to authenticated;
grant execute on function public.es_miembro(uuid, uuid)                           to authenticated;
grant execute on function public.es_sala_publica(uuid)                            to authenticated;
grant execute on function public.resolver_sala(uuid)                              to authenticated;
grant execute on function public.crear_sala(public.sala_tipo, smallint, integer)  to authenticated;
grant execute on function public.unirse_sala(text, uuid)                          to authenticated;
grant execute on function public.salir_sala(uuid)                                 to authenticated;
grant execute on function public.jugar_ya(uuid)                                   to authenticated;
grant execute on function public.salas_abiertas()                                 to authenticated;
grant execute on function public.mi_sala()                                        to authenticated;

-- ── Y el hallazgo lateral 1 de la Fase 0 ──────────────────────────────────
-- `normalizar_username` quedó invocable como RPC con la llave publicable:
-- `POST /rest/v1/rpc/normalizar_username {"txt":"p3nd3j0"}` devolvía `"pendejo"`
-- sin sesión. No filtra la lista de vedados —`reserved_usernames` sigue con RLS
-- y cero políticas— pero expone el normalizador a cualquiera. No estaba
-- pensado: es el defecto de PostgREST, que publica toda función de `public`.
--
-- El disparador `validar_username` la sigue llamando sin problema: corre como
-- `security definer`, o sea como su definidor, que no pierde el privilegio.
revoke execute on function public.normalizar_username(text) from public, anon;


-- ── 16 · Realtime — el paso que no se supone ───────────────────────────────
-- La Fase 0 §1.5 lo dejó medido y con nombre: una suscripción a una tabla que NO
-- ESTÁ en la publicación devuelve igualmente SUBSCRIBED. Se comprobó con una
-- tabla inexistente como control, y también dijo SUBSCRIBED. O sea: si esta alta
-- se olvida, el canal se conecta, la pantalla parece viva, y no llega jamás un
-- evento. Un fallo mudo, del peor tipo.
--
-- Por eso el alta es un paso explícito de la migración y no un supuesto, y por
-- eso el informe la verifica DESPUÉS del push con
-- `select * from pg_publication_tables where pubname = 'supabase_realtime'`.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'salas'
  ) then
    alter publication supabase_realtime add table public.salas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sala_jugadores'
  ) then
    alter publication supabase_realtime add table public.sala_jugadores;
  end if;
end
$$;

-- `intentos_codigo` NO entra en la publicación, a propósito: nadie tiene que
-- enterarse en tiempo real de los intentos de nadie, y publicarla sería un canal
-- por el que se filtra actividad.


-- ═══════════════════════════════════════════════════════════════════════════
-- PRUEBAS — correr DESPUÉS del push, en el SQL Editor del panel
-- ═══════════════════════════════════════════════════════════════════════════
-- Rector §2.5. Van comentadas, como el Grupo B de 0001, y por la misma razón:
-- este archivo lo aplica `db push` y una prueba dentro sería un efecto que se
-- repite en cada despliegue.
--
-- ── LO QUE NO SE PUEDE PROBAR AQUÍ, DECLARADO ─────────────────────────────
-- Las funciones leen `auth.uid()`, que en el SQL Editor es NULL: todas
-- rebotarían con `no_autenticado` antes de llegar a lo que se quiere medir. El
-- bloque de abajo lo rodea con `set local role authenticated` y un
-- `request.jwt.claims` fabricado, que es como Supabase alimenta `auth.uid()`.
-- Es andamio de prueba, no producción.
--
-- Lo que ESTE bloque NO cubre y se difiere a SAL-B con dos teléfonos: el
-- recorrido por Realtime (que llegue el evento, no sólo que la tabla esté
-- publicada) y la concurrencia real de dos anfitriones simultáneos.
--
-- ── GRUPO A · Sin tocar `auth`: lo que se puede comprobar ya ───────────────
--
--   select public.ahora()                       as hora_del_servidor,
--          public.regla_asiento()               as debe_dar_5,
--          public.saldo_de(gen_random_uuid())   as debe_dar_5000;
--
--   -- El alfabeto del `check`, sin tocar la tabla. Esperado: t, f, f, f, f.
--   select v, v ~ '^AJ-[A-HJ-NP-Z2-9]{4}$' as pasa
--   from (values ('AJ-7K2M'), ('AJ-0OI1'), ('AJ7K2M'), ('aj-7k2m'), ('AJ-7K2')) as t(v);
--
--   -- Las dos tablas en la publicación. DEBE devolver exactamente dos filas.
--   select schemaname, tablename from pg_publication_tables
--    where pubname = 'supabase_realtime' and tablename in ('salas', 'sala_jugadores');
--
--   -- Ninguna política de escritura, en ninguna de las tres. Esperado: 0 filas.
--   select tablename, policyname, cmd from pg_policies
--    where schemaname = 'public'
--      and tablename in ('salas', 'sala_jugadores', 'intentos_codigo')
--      and cmd <> 'SELECT';
--
-- ── GRUPO B · Las seis pruebas de verdad ──────────────────────────────────
-- Se pega ENTERO, de una vez. Ocho filas y todas deben decir OK.
--
-- La forma es la del Grupo B de 0001 y por el mismo motivo: el SQL Editor manda
-- el lote entero y el primer error aborta lo que queda, así que los fallos
-- ESPERADOS se convierten en datos con `exception when others` en vez de en un
-- abort. Se limpia solo al final.
--
--   do $sala$
--   declare
--     UNO uuid := '11111111-1111-1111-1111-111111111111';
--     DOS uuid := '22222222-2222-2222-2222-222222222222';
--     s1  public.salas;
--     got text;
--     n   integer;
--   begin
--     drop table if exists _sal_res;
--     create temp table _sal_res (orden int, prueba text, esperado text, obtenido text);
--
--     insert into auth.users (id, instance_id, aud, role, email,
--                             encrypted_password, created_at, updated_at,
--                             raw_app_meta_data, raw_user_meta_data)
--     values
--       (UNO, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--        'sala_uno@prueba.local', '', now(), now(), '{}', '{}'),
--       (DOS, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--        'sala_dos@prueba.local', '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (UNO, 'SalaUno'), (DOS, 'SalaDos');
--
--     -- Así es como Supabase alimenta auth.uid(): un claim en la config local.
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--
--     -- 1 · privada devuelve un código con formato válido
--     s1 := public.crear_sala('privada', 2::smallint, 100);
--     insert into _sal_res values (1, 'codigo con formato',
--       'true', (s1.codigo ~ '^AJ-[A-HJ-NP-Z2-9]{4}$')::text);
--
--     -- 2 · el anfitrión quedó en el asiento 0
--     select asiento into n from public.sala_jugadores
--      where sala_id = s1.id and jugador_id = UNO;
--     insert into _sal_res values (2, 'anfitrion en asiento 0', '0', n::text);
--
--     -- 3 · el mismo jugador no puede abrir una segunda
--     begin
--       perform public.crear_sala('abierta', 2::smallint, 100);
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _sal_res values (3, 'ya_en_sala', 'ya_en_sala', got);
--
--     -- 4 · la regla 5x: con saldo 5000 la mesa de 2000 pide 10000
--     perform set_config('request.jwt.claims', json_build_object('sub', DOS)::text, true);
--     begin
--       perform public.crear_sala('abierta', 2::smallint, 2000);
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _sal_res values (4, 'saldo_insuficiente', 'saldo_insuficiente', got);
--
--     -- 5 · un código inventado no cuela
--     begin
--       perform public.unirse_sala('AJ-2345');
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _sal_res values (5, 'codigo inexistente',
--       'sala_no_disponible', got);
--
--     -- 6 · y quedó registrado como intento
--     select count(*) into n from public.intentos_codigo where jugador_id = DOS;
--     insert into _sal_res values (6, 'intento registrado', '1', n::text);
--
--     -- 7 · el SEXTO intento en un minuto se corta
--     begin
--       for n in 1..5 loop
--         begin perform public.unirse_sala('AJ-2345'); exception when others then end;
--       end loop;
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     begin
--       perform public.unirse_sala('AJ-2345');
--       got := 'NO FALLO';
--     exception when others then got := sqlerrm;
--     end;
--     insert into _sal_res values (7, 'demasiados_intentos', 'demasiados_intentos', got);
--
--     -- 8 · el anfitrión que sale CANCELA
--     perform set_config('request.jwt.claims', json_build_object('sub', UNO)::text, true);
--     perform public.salir_sala(s1.id);
--     insert into _sal_res values (8, 'anfitrion cancela', 'cancelada',
--       (select estado::text from public.salas where id = s1.id));
--
--     delete from auth.users where id in (UNO, DOS);
--   end
--   $sala$;
--
--   select orden, prueba, esperado, obtenido,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--     from _sal_res order by orden;
--
-- ── GRUPO C · El índice parcial, que necesita dos anfitriones ──────────────
-- Se corre aparte porque el Grupo B ya limpió sus usuarios. Prueba la regla
-- «una sola mesa abierta por combinación»: la segunda inserción DEBE rebotar.
--
--   do $unica$
--   declare
--     A uuid := '33333333-3333-3333-3333-333333333333';
--     B uuid := '44444444-4444-4444-4444-444444444444';
--     got text;
--   begin
--     drop table if exists _sal_unica;
--     create temp table _sal_unica (prueba text, esperado text, obtenido text);
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     values (A, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'sala_a@prueba.local', '', now(), now(), '{}', '{}'),
--            (B, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'sala_b@prueba.local', '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (A, 'SalaAaa'), (B, 'SalaBbb');
--
--     perform set_config('request.jwt.claims', json_build_object('sub', A)::text, true);
--     perform public.crear_sala('abierta', 4::smallint, 500);
--
--     -- B pide la MISMA combinación: no se crea una segunda, se une a la de A.
--     perform set_config('request.jwt.claims', json_build_object('sub', B)::text, true);
--     perform public.crear_sala('abierta', 4::smallint, 500);
--     insert into _sal_unica values ('una sola mesa 4x500', '1',
--       (select count(*)::text from public.salas
--         where tipo = 'abierta' and estado = 'esperando' and jugadores = 4 and apuesta = 500));
--     insert into _sal_unica values ('B se sentó en el asiento 1', '1',
--       (select asiento::text from public.sala_jugadores where jugador_id = B));
--
--     -- Y el índice, a pelo: una segunda fila directa DEBE rebotar.
--     begin
--       insert into public.salas (tipo, jugadores, apuesta, anfitrion_id)
--       values ('abierta', 4::smallint, 500, A);
--       got := 'NO FALLO';
--     exception when unique_violation then got := 'unique_violation';
--     end;
--     insert into _sal_unica values ('el indice parcial muerde', 'unique_violation', got);
--
--     delete from auth.users where id in (A, B);
--   end
--   $unica$;
--
--   select prueba, esperado, obtenido,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--     from _sal_unica;
--
-- ── GRUPO D · El barrido ──────────────────────────────────────────────────
-- Necesita una sala vencida, que se fabrica moviéndole el `expira_en` hacia
-- atrás. Con 1 sentado debe quedar 'cancelada'; con 2, 'activa'.
--
--   do $barrido$
--   declare
--     C uuid := '55555555-5555-5555-5555-555555555555';
--     D uuid := '66666666-6666-6666-6666-666666666666';
--     s  public.salas;
--   begin
--     drop table if exists _sal_barrido;
--     create temp table _sal_barrido (prueba text, esperado text, obtenido text);
--     insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
--                             created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
--     values (C, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'sala_c@prueba.local', '', now(), now(), '{}', '{}'),
--            (D, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--             'sala_d@prueba.local', '', now(), now(), '{}', '{}');
--     insert into public.profiles (id, username) values (C, 'SalaCcc'), (D, 'SalaDdd');
--
--     perform set_config('request.jwt.claims', json_build_object('sub', C)::text, true);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     update public.salas set expira_en = now() - interval '1 second' where id = s.id;
--     perform public.barrer_salas();
--     insert into _sal_barrido values ('1 sentado -> cancelada', 'cancelada',
--       (select estado::text from public.salas where id = s.id));
--
--     -- Y ahora con dos.
--     perform public.salir_sala(s.id);
--     s := public.crear_sala('privada', 2::smallint, 100);
--     perform set_config('request.jwt.claims', json_build_object('sub', D)::text, true);
--     perform public.unirse_sala(s.codigo);
--     update public.salas set expira_en = now() - interval '1 second' where id = s.id;
--     perform public.barrer_salas();
--     insert into _sal_barrido values ('2 sentados -> activa', 'activa',
--       (select estado::text from public.salas where id = s.id));
--     insert into _sal_barrido values ('y con iniciada_en', 'true',
--       (select (iniciada_en is not null)::text from public.salas where id = s.id));
--
--     delete from auth.users where id in (C, D);
--   end
--   $barrido$;
--
--   select prueba, esperado, obtenido,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--     from _sal_barrido;
--
-- El punto frágil de los tres grupos es el `insert into auth.users`: esas
-- columnas las define Supabase y cambian entre versiones de GoTrue. Si un día
-- falla ahí, lo que está en cuestión es el andamio, no el esquema — el Grupo A
-- valida la mitad estructural sin tocar `auth`.
--
-- CORRIDA REAL · pendiente. Se anota aquí con fecha y resultado cuando Victor la
-- ejecute, igual que 0001 anota sus dos corridas del 2026-08-27.
-- ═══════════════════════════════════════════════════════════════════════════
