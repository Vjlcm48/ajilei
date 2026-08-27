-- ═══════════════════════════════════════════════════════════════════════════
-- AJILEI · SUP-2a — Identidad: profiles, reglas de username y cerraduras RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- Se ejecuta UNA vez, pegado íntegro en el SQL Editor del panel de Supabase.
-- Va envuelto en una transacción a propósito: si algo revienta a mitad no
-- queda medio esquema en pie, que es la peor forma de empezar una base.
--
-- Si se re-ejecuta, FALLA RUIDOSO en el primer `create table` («already
-- exists») y revierte. Eso es deliberado: un script de identidad no debe
-- poder pisar en silencio una tabla que ya tiene cuentas dentro.
--
-- ── La doctrina que este archivo materializa ──────────────────────────────
-- El username es MUTABLE (política SumaMente: cambio libre). De ahí se sigue
-- lo único que no se negocia en el resto del proyecto: TODA referencia futura
-- entre tablas cuelga de `auth.users.id` (UUID), JAMÁS del username. El
-- nombre es rótulo; el ID es contrato. Una partida, un saldo o un ranking que
-- guarde el texto del nombre queda huérfano el día que su dueño lo cambie.
--
-- Esta tanda guarda SOLO identidad. Nada de saldo: eso es ECO-1.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 · La tabla de perfiles ───────────────────────────────────────────────
-- `id` no es un identificador propio: es el MISMO uuid de auth.users. Un
-- perfil no existe sin su cuenta, y el `on delete cascade` es también la
-- política de borrado — por eso más abajo no hay política DELETE para nadie:
-- el perfil muere cuando muere la cuenta, nunca por su cuenta.
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  username   text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 6-15 caracteres, alfabeto latino sin acentos, dígitos y guion bajo.
  -- Acepta mayúsculas porque el nombre SE MUESTRA como su dueño lo escribió
  -- («Panita7» se ve «Panita7»); quien decide si dos nombres chocan es el
  -- índice de más abajo, no este CHECK.
  constraint profiles_username_formato_chk
    check (username ~ '^[A-Za-z0-9_]{6,15}$')
);

-- Unicidad SIN distinguir mayúsculas: existe «Panita7» → nadie registra
-- «PANITA7». La unicidad vive en el índice y la presentación en la columna;
-- separarlas es lo que permite tener las dos cosas a la vez.
create unique index profiles_username_lower_uniq
  on public.profiles (lower(username));

comment on table  public.profiles          is 'SUP-2a · Identidad pública del jugador. El id ES el de auth.users.';
comment on column public.profiles.username is 'Rótulo mutable. Nunca usar como clave foránea: para eso está id.';

-- ── 2 · Normalización ──────────────────────────────────────────────────────
-- Un vedado que solo mira el texto literal no sirve de nada: `p3nd3j0` lo
-- rodea sin despeinarse. Esta función deja el nombre en su forma desnuda
-- antes de compararlo — minúsculas, dígitos revertidos a la letra que imitan,
-- y guion bajo BORRADO.
--
-- Lo del guion bajo no estaba en el plan original y se añadió al descubrir el
-- hueco: revertir los dígitos atrapa `p3nd3j0`, pero `p_e_n_d_e_j_o` seguía
-- pasando limpio. Al borrarlo, ambos colapsan a la misma palabra. El coste es
-- nulo para cualquier nombre honesto: `mi_panita` normaliza a `mipanita`, que
-- no está vedado y por tanto pasa — el `_` sigue siendo libre, solo deja de
-- servir de disfraz. La prueba 7 del bloque final blinda esto.
--
-- `immutable` es lo que permite usarla en índices y CHECK si algún día hace
-- falta; `search_path = ''` la deja inmune a un esquema intruso.
create or replace function public.normalizar_username(txt text)
returns text
language sql
immutable
set search_path = ''
as $fn$
  -- translate() con el segundo mapa más corto que el primero BORRA los
  -- sobrantes: 0→o 1→i 3→e 4→a 5→s 7→t, y el `_` final se cae.
  select translate(lower(txt), '013457_', 'oieast')
$fn$;

-- ── 3 · La lista de vedados ────────────────────────────────────────────────
-- Se guarda en forma YA NORMALIZADA, y el CHECK lo impone. Esto merece una
-- explicación porque contradice la lectura literal del plan («sembrar
-- variantes numéricas»): sembrar `p3nd3j0` aquí sería letra MUERTA, porque lo
-- que se compara contra esta tabla nunca lleva dígitos — ya pasó por
-- normalizar_username(). La variante numérica se atrapa normalizando el
-- nombre, no multiplicando las filas. El CHECK está para que un futuro
-- sembrador no añada `p3nd3j0` creyendo que hace algo.
create table public.reserved_usernames (
  word text primary key,
  constraint reserved_usernames_normalizada_chk check (word ~ '^[a-z]+$')
);

comment on table public.reserved_usernames is
  'SUP-2a · Términos vedados, en forma normalizada (solo a-z). Se compara contra normalizar_username(), no contra el texto crudo.';

insert into public.reserved_usernames (word) values
  -- Reservadas de la casa: suplantar al equipo es el fraude más barato que
  -- existe en una mesa de apuestas.
  ('admin'), ('administrator'), ('moderador'), ('moderator'),
  ('soporte'), ('support'), ('ayuda'), ('staff'),
  ('ajilei'), ('heptacoin'), ('heptacoins'), ('heptacreation'),
  ('sistema'), ('system'), ('root'), ('oficial'), ('official'),
  -- Groserías fuertes es/en. Ni exhaustiva ni tímida: es beta cerrada y esta
  -- lista se afina con lo que aparezca de verdad, no adivinando.
  ('pendejo'), ('pendeja'), ('cabron'), ('cabrona'),
  ('chingar'), ('chingada'), ('mierda'), ('malparido'),
  ('hijueputa'), ('joputa'), ('gonorrea'), ('culero'), ('pinche'),
  ('marico'), ('marica'), ('maricon'), ('mamaguevo'), ('mamahuevo'),
  ('guevon'), ('pajuo'), ('zorra'), ('puta'), ('puto'), ('verga'),
  ('gilipollas'), ('cojones'), ('conoetumadre'),
  ('fuck'), ('shit'), ('bitch'), ('cunt'), ('whore'),
  ('nigger'), ('nigga'), ('faggot'), ('asshole'), ('bastard'),
  ('slut'), ('pussy'), ('retard'), ('wanker'), ('twat')
on conflict (word) do nothing;

-- ── 4 · El portero ─────────────────────────────────────────────────────────
-- Valida en BEFORE INSERT OR UPDATE. NO impide cambiar de nombre —cambio
-- libre es política sellada— sino que revisa el nombre propuesto, sea el
-- primero o el décimo.
--
-- `security definer` porque reserved_usernames tiene RLS y CERO políticas:
-- ningún cliente puede leerla, pero el portero sí necesita. `search_path = ''`
-- con todo calificado a mano es lo que evita que ese privilegio se convierta
-- en una vía de escalada — sin él, un esquema intruso en el path puede
-- suplantar una función y correr como el definidor.
--
-- Sobre el `like`: el plan pide simplicidad («igualdad y like bastan para la
-- beta») y eso es lo que hay, con su coste declarado — un vedado que aparece
-- DENTRO de una palabra inocente la tumba también. Casos reales conocidos:
-- `badminton` cae por `admin`, `computadora` y `diputado` caen por `puta`,
-- `vergara` cae por `verga`. Es el precio de bloquear `admin1` (que normaliza
-- a `admini` y por tanto NO coincide por igualdad). Si en la beta molesta, la
-- salida no es tocar esto sino darle a cada palabra su modo —exacta o
-- contenida— en una columna nueva; se deja dicho aquí para que quien llegue
-- no crea que el falso positivo pasó inadvertido.
create or replace function public.validar_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  norm   text;
  vedada text;
begin
  norm := public.normalizar_username(new.username);

  select r.word into vedada
  from public.reserved_usernames as r
  where norm = r.word or norm like '%' || r.word || '%'
  order by length(r.word) desc   -- si hay varias, reportar la más específica
  limit 1;

  if vedada is not null then
    raise exception
      'AJILEI: el nombre "%" no esta disponible porque contiene un termino reservado o inapropiado', new.username
      using hint = 'Elige otro nombre de 6 a 15 caracteres (letras, numeros y guion bajo).';
  end if;

  -- El refresco de updated_at viaja con el portero en vez de tener trigger
  -- propio: son la misma pasada BEFORE sobre la misma fila, y dos triggers
  -- para eso solo añaden un orden de ejecución que discutir.
  new.updated_at := now();
  return new;
end;
$fn$;

create trigger profiles_validar_username_trg
  before insert or update on public.profiles
  for each row execute function public.validar_username();

-- Los tres rechazos posibles llegan al cliente con códigos DISTINTOS, y eso
-- es lo que permitirá a SUP-2b decir qué pasó sin adivinar por el texto:
--   23514  el CHECK de formato  → largo o caracteres inválidos
--   23505  el índice único      → ese nombre ya lo tiene alguien
--   P0001  el trigger           → nombre vedado

-- ── 5 · Cerraduras RLS ─────────────────────────────────────────────────────
-- `enable row level security` es idempotente: si el proyecto ya lo activó por
-- su cuenta, esto no duplica nada ni falla.
alter table public.profiles           enable row level security;
alter table public.reserved_usernames enable row level security;

-- LECTURA: todos los autenticados leen todos los perfiles. El username es
-- público por naturaleza — los rivales tienen que verte el nombre en la mesa.
create policy profiles_select_autenticados
  on public.profiles for select
  to authenticated
  using (true);

-- ALTA: solo tu propia fila, y solo una (la PK del uuid impide la segunda).
create policy profiles_insert_propio
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- CAMBIO: solo tu propia fila. El `using` te deja alcanzarla y el `with
-- check` impide que la SUELTES en manos ajenas reescribiendo el id — sin la
-- segunda mitad, un update podría regalarle tu perfil a otro uuid.
create policy profiles_update_propio
  on public.profiles for update
  to authenticated
  using      (auth.uid() = id)
  with check (auth.uid() = id);

-- BORRADO: ninguna política, a propósito. Con RLS activo, lo que no está
-- permitido está prohibido: nadie borra perfiles desde el cliente. El único
-- camino es borrar la cuenta, y de eso ya se encarga el cascade.

-- reserved_usernames se queda con RLS activo y SIN una sola política: ni
-- lectura ni escritura para nadie. Solo el panel y el rol de servicio la
-- tocan; el portero llega por `security definer`, que salta RLS por diseño.

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN MANUAL — correr DESPUÉS del script, en el SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── Grupo A · Se puede correr YA, sin un solo usuario registrado ──────────
-- No inserta nada: interroga a la lógica directamente. Sirve para ver la
-- normalización con los ojos antes de fiarse de ella.
--
--   select public.normalizar_username('p3nd3j0')       as debe_dar_pendejo,
--          public.normalizar_username('p_e_n_d_e_j_o') as debe_dar_pendejo_2,
--          public.normalizar_username('Panita7')       as debe_dar_panitat,
--          public.normalizar_username('mi_panita')     as debe_dar_mipanita;
--
--   -- El CHECK de formato, sin tocar la tabla:
--   select v, v ~ '^[A-Za-z0-9_]{6,15}$' as pasa_formato
--   from (values ('corto'), ('con espacio'), ('Panita7'), ('Ramón12'),
--                ('dieciseis_chars_')) as t(v);
--   -- Esperado: false, false, true, false (la tilde no entra), false (16).
--
-- ── Grupo A' · Las mismas nueve, en una sola pegada y autoevaluadas ───────
-- Las dos consultas de arriba obligan a comparar a ojo, y el SQL Editor solo
-- muestra la tabla del ÚLTIMO statement de un lote — así que pegadas juntas
-- se ve una y se pierde la otra. Esta versión las funde en una consulta que
-- se juzga sola: nueve filas, columna `veredicto`, todas deben decir OK.
-- La comparación es contra texto, de ahí el `::text` sobre los booleanos.
--
--   select prueba, obtenido, esperado,
--          case when obtenido = esperado then 'OK' else '<<< MAL' end as veredicto
--   from (
--     select 'A1 · norm p3nd3j0'        as prueba, public.normalizar_username('p3nd3j0')       as obtenido, 'pendejo'  as esperado
--     union all select 'A2 · norm p_e_n_d_e_j_o', public.normalizar_username('p_e_n_d_e_j_o'), 'pendejo'
--     union all select 'A3 · norm Panita7',       public.normalizar_username('Panita7'),       'panitat'
--     union all select 'A4 · norm mi_panita',     public.normalizar_username('mi_panita'),     'mipanita'
--     union all select 'A5 · fmt corto',            ('corto'            ~ '^[A-Za-z0-9_]{6,15}$')::text, 'false'
--     union all select 'A6 · fmt con espacio',      ('con espacio'      ~ '^[A-Za-z0-9_]{6,15}$')::text, 'false'
--     union all select 'A7 · fmt Panita7',          ('Panita7'          ~ '^[A-Za-z0-9_]{6,15}$')::text, 'true'
--     union all select 'A8 · fmt Ramón12',          ('Ramón12'          ~ '^[A-Za-z0-9_]{6,15}$')::text, 'false'
--     union all select 'A9 · fmt dieciseis_chars_', ('dieciseis_chars_' ~ '^[A-Za-z0-9_]{6,15}$')::text, 'false'
--   ) t
--   order by prueba;
--
-- La fila que más vale mirar es A2: `p_e_n_d_e_j_o` colapsa al mismo
-- `pendejo` que A1, y esa es toda la razón de que la normalización borre el
-- guion bajo. Si alguien deshace ese borrado, A2 es la primera en ponerse
-- roja — antes incluso que la prueba 7 del Grupo B.
--
-- CORRIDA REAL · 2026-08-27, contra el proyecto: 9/9 OK.
--
-- ── Grupo B · Las siete pruebas de verdad, contra la tabla ────────────────
-- Van dentro de begin/rollback y crean dos usuarios de prueba que NO
-- sobreviven al bloque: al terminar, la base queda exactamente como estaba.
--
--   begin;
--
--   insert into auth.users (id, instance_id, aud, role, email,
--                           encrypted_password, created_at, updated_at,
--                           raw_app_meta_data, raw_user_meta_data)
--   values
--     ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
--      'authenticated', 'authenticated', 'sup2a_uno@prueba.local', '', now(), now(), '{}', '{}'),
--     ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
--      'authenticated', 'authenticated', 'sup2a_dos@prueba.local', '', now(), now(), '{}', '{}');
--
--   -- 6 · EL ÚNICO QUE DEBE PASAR. Va primero porque las pruebas 5 y 7
--   --     necesitan que ya exista una fila con la que chocar.
--   insert into public.profiles (id, username)
--   values ('11111111-1111-1111-1111-111111111111', 'Panita7');
--   -- ✅ Esperado: INSERT 0 1.
--
--   -- Las seis siguientes deben FALLAR, cada una a su manera. En cuanto una
--   -- falla, la transacción queda abortada y las demás dirían «current
--   -- transaction is aborted» — por eso cada una va envuelta en su savepoint,
--   -- que permite encadenarlas sin reiniciar el bloque.
--
--   -- 1 · Cinco caracteres → corto.
--   savepoint s1;
--   insert into public.profiles (id, username)
--   values ('22222222-2222-2222-2222-222222222222', 'Panit');
--   rollback to s1;
--   -- ❌ Esperado: 23514 · profiles_username_formato_chk
--
--   -- 2 · Con espacio.
--   savepoint s2;
--   insert into public.profiles (id, username)
--   values ('22222222-2222-2222-2222-222222222222', 'Pana Nita');
--   rollback to s2;
--   -- ❌ Esperado: 23514 · profiles_username_formato_chk
--
--   -- 3 · Vedado de la casa, con capitalización de disfraz.
--   savepoint s3;
--   insert into public.profiles (id, username)
--   values ('22222222-2222-2222-2222-222222222222', 'AdminAjilei');
--   rollback to s3;
--   -- ❌ Esperado: P0001 · «...contiene un termino reservado o inapropiado»
--
--   -- 4 · Vedado disfrazado de dígitos — lo que caza la normalización.
--   savepoint s4;
--   insert into public.profiles (id, username)
--   values ('22222222-2222-2222-2222-222222222222', 'p3nd3j0x');
--   rollback to s4;
--   -- ❌ Esperado: P0001
--
--   -- 5 · Duplicado con otra capitalización. Aquí se ve la decisión de fondo:
--   --     el formato lo acepta, pero el índice sobre lower() no.
--   savepoint s5;
--   insert into public.profiles (id, username)
--   values ('22222222-2222-2222-2222-222222222222', 'PANITA7');
--   rollback to s5;
--   -- ❌ Esperado: 23505 · profiles_username_lower_uniq
--
--   -- 7 · EL GUARDIÁN DEL HUECO. `p_e_n_d_e_j_o` normaliza a `pendejo` solo
--   --     porque normalizar_username() BORRA el guion bajo. Si alguien
--   --     retoca esa función y quita el borrado, TODO lo demás sigue en
--   --     verde y solo esta prueba se pone en rojo. No borrar.
--   savepoint s7;
--   insert into public.profiles (id, username)
--   values ('22222222-2222-2222-2222-222222222222', 'p_e_n_d_e_j_o');
--   rollback to s7;
--   -- ❌ Esperado: P0001
--
--   rollback;   -- ← IMPRESCINDIBLE: deshace los usuarios y el perfil de prueba.
--
--   -- Comprobación final de que no quedó rastro (fuera de la transacción):
--   select count(*) as debe_ser_cero from public.profiles;
--
-- ═══════════════════════════════════════════════════════════════════════════
