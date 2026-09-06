# AJILEI · SAL · Fase 0 · Informe

**Fecha:** 2026-09-05
**SHA de partida:** `1f2a610b76ec7dcdb9f84214617e9c4b90163643` (`1f2a610` — *LOB-1e: informes de Fase 0 y Fase 1 (con anexo A1)*)
**Rama:** `main`
**Punto de partida esperado:** verificado. `git merge-base --is-ancestor 1f2a610 HEAD` → **0** (`1f2a610` ES ancestro de HEAD; de hecho es HEAD).
**Protegidos:** ninguno de los cinco de `docs/AJILEI_Protegidos_v1.0.md` §2 se editó. Tres —`gameEngine.js`, `aiPlayer.js`, `seatLayouts.js`— se **leyeron** para P4, que es lo que la instrucción autoriza. `opponentPanel.css` y `gameTable.css` no se abrieron.
**Escrituras:** ninguna. Ni un archivo creado, movido o borrado salvo este informe. Ni una sentencia SQL de escritura. Las dos sondas de red que se ejecutaron viven en el directorio temporal de la sesión, **fuera del árbol**, y son de solo lectura.

---

## 0. Cómo se inspeccionó Supabase, y con qué límite

**No hay `supabase` CLI ni `psql` en esta máquina** (`command -v supabase` → vacío; no está en `node_modules/.bin`; `command -v psql` → vacío). El `db dump --schema-only` que la instrucción contemplaba no era posible.

La inspección se hizo por tres vías, todas de lectura:

1. **El archivo de migración versionado** — `supabase/migrations/0001_sup2a_identidad.sql`, único archivo bajo `supabase/`. Es la autoridad sobre lo que SUP-2a creó.
2. **La API REST del proyecto** con la llave publicable, sondeando nombres de tabla y de función.
3. **El SDK real de Realtime** desde Node, para ver si el socket existe y qué acepta.

**El límite, declarado por delante:** la llave publicable **no** abre `information_schema` ni `pg_policies` ni `pg_proc`. El endpoint raíz de PostgREST —el que devuelve el OpenAPI con el esquema entero— responde `401 · "Secret API key required · Only secret API keys can be used for this endpoint."`. Así que lo que sigue **no es un censo del esquema**: es la migración versionada, confirmada punto por punto contra el proyecto vivo por sondeo. Donde el sondeo no puede decidir, se dice.

---

## P1 · Supabase — lo que hay

### 1.1 Tablas del esquema `public`

**Existen dos, y solo dos que el sondeo alcance.** Cada nombre candidato se pidió como `GET /rest/v1/<tabla>?select=*&limit=0`:

| Tabla sondeada | HTTP | Cuerpo |
|---|---|---|
| `profiles` | **200** | `[]` |
| `reserved_usernames` | **200** | `[]` |
| `rooms`, `room_players`, `tables`, `matches`, `games`, `balances`, `wallets`, `partidas`, `mesas`, `salas` | **404** | `PGRST205 · Could not find the table 'public.<x>' in the schema cache` |

El detalle que convierte esto de «no encontré» en evidencia: PostgREST añade un `hint` con la tabla **más parecida** que sí conoce. Para `rooms`, `room_players`, `tables` y `partidas` el hint fue siempre `Perhaps you meant the table 'public.profiles'`, y para el resto no hubo hint. En ningún sondeo apareció un tercer nombre. **No hay nada de salas, mesas, partidas ni saldo en la base.**

Los `200` con `[]` son coherentes con la RLS: la llave publicable actúa como `anon`, y la política de lectura de `profiles` es `to authenticated`. La tabla existe y responde; simplemente no devuelve filas a un anónimo.

### 1.2 Columnas, tipos y claves

De `supabase/migrations/0001_sup2a_identidad.sql`:

```sql
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  username   text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_formato_chk
    check (username ~ '^[A-Za-z0-9_]{6,15}$')
);
create unique index profiles_username_lower_uniq on public.profiles (lower(username));
```

```sql
create table public.reserved_usernames (
  word text primary key,
  constraint reserved_usernames_normalizada_chk check (word ~ '^[a-z]+$')
);
```

**Lectura para SAL:** `profiles.id` **es** `auth.users.id`. La doctrina que el propio archivo declara —«TODA referencia futura entre tablas cuelga de `auth.users.id` (UUID), JAMÁS del username»— es la que fija que `host_id` y `player_id` de las salas serán `uuid` con FK a `auth.users(id)` o a `public.profiles(id)`, y nunca texto. El `on delete cascade` ya está probado (la verificación manual del archivo lo confirma en su fila `limpieza`).

`reserved_usernames` lleva ~50 filas sembradas en el mismo script, en forma ya normalizada.

### 1.3 Políticas RLS vigentes

No se pudo leer `pg_policies` con la llave publicable. Lo que la migración declara, y que el comportamiento observado en 1.1 confirma:

| Tabla | Política | Comando | Rol | Expresión |
|---|---|---|---|---|
| `profiles` | `profiles_select_autenticados` | SELECT | `authenticated` | `using (true)` |
| `profiles` | `profiles_insert_propio` | INSERT | `authenticated` | `with check (auth.uid() = id)` |
| `profiles` | `profiles_update_propio` | UPDATE | `authenticated` | `using (auth.uid() = id)` **y** `with check (auth.uid() = id)` |
| `profiles` | — | DELETE | — | **ninguna, a propósito**: nadie borra perfiles desde el cliente |
| `reserved_usernames` | — | todos | — | **RLS activo y CERO políticas**: ni lectura ni escritura para nadie |

**Lectura para SAL:** el molde de cerradura de esta casa ya está fijado y es el que las salas heredarán — RLS activo en toda tabla nueva, políticas por comando, `to authenticated`, y la ausencia de política como forma de prohibir. `profiles` con lectura abierta a todo autenticado es además lo que permitirá que la Sala de espera muestre el username de los rivales sin una tabla puente.

### 1.4 Funciones SQL / RPC y Edge Functions

**Dos funciones, ambas de SUP-2a:**

- `public.normalizar_username(txt text) returns text`, `language sql`, `immutable`, `set search_path = ''`.
- `public.validar_username() returns trigger`, `language plpgsql`, **`security definer`**, `set search_path = ''`, colgada de `profiles_validar_username_trg` (BEFORE INSERT OR UPDATE).

Sondeadas contra el proyecto vivo:

```
POST /rest/v1/rpc/normalizar_username  {"txt":"p3nd3j0"}  → 200  "pendejo"
POST /rest/v1/rpc/validar_username     {}                 → 404  PGRST202
```

La primera **existe y es invocable como RPC con la llave publicable** (ver «Hallazgos laterales»). La segunda no lo es, que es lo correcto: una función `returns trigger` no tiene forma de RPC.

> **Corrección de método, anotada porque cambia una conclusión.** El primer barrido de RPC mandó cuerpo vacío a las dos y obtuvo `404 PGRST202` en ambas. Ese 404 **no** significaba «no existe», sino «no existe *sin parámetros*». Repetido con el argumento real, `normalizar_username` responde 200. Se deja escrito para que nadie reutilice el sondeo de cuerpo vacío como prueba de ausencia.

`crear_sala` y `unirse_sala` se sondearon por si acaso: **404**, no existen.

**Edge Functions: ninguna desplegada desde este árbol.** El directorio `supabase/` contiene **únicamente** `migrations/0001_sup2a_identidad.sql` — no hay `supabase/functions/`, ni `config.toml`, ni `deno.json`. Cuatro nombres tanteados (`hello-world`, `sala`, `motor`, `engine`) dieron `404`. Con la reserva honesta de que **tantear nombres no es enumerar**: sin el panel o el CLI no se puede probar que no exista una función con otro nombre. Va a «Requiere autorización».

### 1.5 Realtime

**Está habilitado y alcanzable con la llave publicable.** Dos evidencias independientes:

```
GET /realtime/v1/websocket?apikey=…&vsn=1.0.0   (con cabeceras de upgrade)
→ HTTP/1.1 101 Switching Protocols
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  sb-project-ref: cbbnddlapolelbdsprjm
```

Y con el SDK real (`@supabase/supabase-js` 2.112.4) desde Node:

| Canal | Estado |
|---|---|
| `broadcast` puro (no usa publicación) | **SUBSCRIBED** |
| `postgres_changes` → `public.profiles` | **SUBSCRIBED** |
| `postgres_changes` → `public.reserved_usernames` | **SUBSCRIBED** |
| `postgres_changes` → `public.inexistente_xyz` *(control)* | **SUBSCRIBED** |

**La fila de control es la que importa, y desmonta la prueba.** Una tabla que no existe también dice SUBSCRIBED: el servidor acepta la suscripción sin validar contra la publicación. Por lo tanto **este sondeo prueba que Realtime está vivo, y NO prueba qué tablas están en `supabase_realtime`.** Esa pregunta queda abierta y va a «Requiere autorización».

Es una distinción con consecuencias prácticas, no académica: si SAL se cablea a `postgres_changes` y la tabla nueva no se añade a la publicación, **el canal dirá SUBSCRIBED y no llegará jamás un evento**. Un fallo mudo. La Fase 1 tiene que tratar el alta en la publicación como un paso explícito de la migración (`alter publication supabase_realtime add table …`), no como algo que se dé por hecho.

**Uso actual desde el cliente: CERO.** `grep -rn "channel(\|postgres_changes\|realtime\|broadcast\|\.subscribe(" src/ scripts/` → sin coincidencias. SAL sería el primer consumidor de Realtime del proyecto.

### 1.6 Autenticación configurada

`GET /auth/v1/settings` (público):

```json
{"external":{"email":true, …todos los demás false…, "anonymous_users":false},
 "disable_signup":false, "mailer_autoconfirm":false, "saml_enabled":false}
```

**Lectura para SAL:** `anonymous_users: false`. No hay invitados. Todo jugador que entre a una sala tiene cuenta y `auth.uid()`, lo cual simplifica las políticas RLS de las salas — pero también significa que un enlace `AJ-XXXX` compartido a alguien sin cuenta lo deja en la Portada, no en la sala. La Fase 1 debe decidir qué pasa con el código tras el registro (¿se recuerda y se aplica al volver?).

### 1.7 Plan y región

**No obtenibles sin el panel.** Las cabeceras solo exponen `sb-project-ref: cbbnddlapolelbdsprjm` y el borde de Cloudflare (`CF-Ray: …-ORD`), que es el punto de entrada del cliente, no la región del proyecto. Va a «Requiere autorización».

### 1.8 `src/lib/supabase.js`

**Ruta:** [src/lib/supabase.js:26-36](src/lib/supabase.js#L26-L36)

```js
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'SUP-1: faltan variables de entorno de Supabase — copia .env.example como .env.local y llena los valores'
  )
}

export const supabase = createClient(url, publishableKey)
```

**Tres hechos que condicionan SAL:**

1. **Expone el cliente crudo, sin envoltorio.** Cualquier pantalla puede llamar a `supabase.channel(...)` directamente.
2. **`createClient` se llama SIN objeto de opciones.** No hay configuración de `auth` ni de `realtime`: rigen los valores por defecto del SDK (`persistSession: true`, `autoRefreshToken: true`, y los parámetros de Realtime sin tocar — notablemente **sin `eventsPerSecond` declarado**). Si SAL necesita limitar el caudal de eventos o ajustar el reintento, ese es el sitio, y es un archivo **no protegido**.
3. **Es singleton por doctrina explícita**, y la cabecera del módulo ya nombra la razón exacta que a SAL le importa: *«Dos instancias del SDK sobre el mismo proyecto se pisan la sesión en almacenamiento y abren dos sockets de tiempo real, que es justamente lo que un PvP no puede permitirse.»* Las tres pantallas de SAL comparten este cliente; ninguna llama a `createClient`.

**Quién lo importa hoy:** solo [src/hooks/useAuth.js](src/hooks/useAuth.js). Nadie más en todo `src/`.

---

## P2 · El reloj del servidor

### 2.1 Tiempo de servidor en el código actual: NO EXISTE

`grep -rn "timestamptz\|now()" src/` no devuelve una sola llamada real — las tres coincidencias son la palabra `Date.now()` dentro de otros usos, listadas abajo. **Ninguna pantalla lee la hora del servidor. Nunca.**

Donde sí vive `now()` es en la base, y solo como defecto de columna y refresco de fila: `created_at`/`updated_at` en `profiles`, y `new.updated_at := now()` dentro de `validar_username()`. El reloj del servidor **existe y es alcanzable**, pero hoy nada del cliente lo consulta.

### 2.2 Cómo lee hoy el cliente la hora — el censo completo

Tres sitios, y **ninguno mide tiempo transcurrido**:

| Ruta | Uso |
|---|---|
| [src/components/GameTable.jsx:406](src/components/GameTable.jsx#L406) | `const id = Date.now() + Math.random()` — generador de **id** de elemento |
| [src/components/GameTable.jsx:1323](src/components/GameTable.jsx#L1323) | `const id = Date.now()` — generador de **id** |
| [src/dev/arcoCEL.js:30](src/dev/arcoCEL.js#L30) | `performance.now()` — instrumentación de desarrollo del arnés CEL |

`useCongelado.js` **no** usa `Date.now()`, contra lo que cabía esperar de FRZ-1.

### 2.3 El único cronómetro que ya existe, y por qué se hizo así

**Ruta:** [src/components/FormularioPuerta.jsx:40-49](src/components/FormularioPuerta.jsx#L40-L49)

```js
  // La cuenta regresiva se apoya en un intervalo de 1 s y no en un `Date.now()`
  // acumulado porque su único trabajo es apagar un enlace: un desfase de medio
  // segundo tras una pestaña en segundo plano no le hace daño a nadie, y el
  // límite de verdad —el que devuelve 429— lo impone el servidor, no esto.
  useEffect(() => {
    if (restante <= 0) return
    const id = setInterval(() => setRestante(n => (n > 0 ? n - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [restante])
```

**Lectura para SAL, y es la más importante de P2.** El precedente de la casa es un `setInterval` decorativo cuyo comentario declara explícitamente que *el límite de verdad lo impone el servidor*. El cronómetro 3:00 de la Sala de espera es **el mismo patrón llevado a su forma dura**: la cuenta que se ve puede ser un intervalo local, pero el instante de arranque y el de cancelación tienen que venir de una columna `timestamptz` del servidor, porque de ellos depende dinero. Un `setInterval` de 1 s que ha estado en una pestaña congelada (FRZ-1) puede llevar minutos de retraso.

Y hay una vuelta de tuerca que la Fase 1 no puede saltarse: el cliente **no puede** confiar en `Date.now()` para calcular «cuánto falta» ni siquiera restando contra un `expira_en` del servidor, porque el reloj del teléfono puede estar corrido de horas. El patrón correcto es **medir el desfase una vez** —pedir la hora del servidor al entrar a la sala, guardar `offset = servidor − local`— y contar contra el reloj local corregido.

### 2.4 Corrección de deriva: no existe

Se buscó y **no hay nada**. Ni un `offset`, ni una sincronización, ni una lectura de hora remota. Es esperado —hasta hoy no había motivo— y queda anotado como lo que SAL tiene que inventar desde cero.

---

## P3 · Estado del recorrido PvP en el cliente

### 3.1 Qué hace hoy «Jugar contra jugador»

**Ruta:** [src/screens/Lobby.jsx:255-259](src/screens/Lobby.jsx#L255-L259)

```jsx
          <SoundButton className="lob-cta-pvp" data-accion="jugar-pvp" onClick={pronto}>
            <IconoCandado />
            <span>{t('lob.cta.pvp')}</span>
            <span className="lob-pastilla">{t('lob.cta.pronto')}</span>
          </SoundButton>
```

Y `pronto` — [src/screens/Lobby.jsx:131-135](src/screens/Lobby.jsx#L131-L135):

```js
  const pronto = () => {
    setToastVivo(true)
    clearTimeout(relojToast.current)
    relojToast.current = setTimeout(() => setToastVivo(false), 1200)
  }
```

**Lectura:** el botón levanta un toast de 1200 ms («Pronto») y nada más. Tres cosas que SAL hereda y no debe romper: es un `SoundButton` (suena `buttonClick`), lleva un **candado** y una **pastilla «Próximamente»** que habrá que retirar, y su gancho de arnés es `data-accion="jugar-pvp"`, que ya existe y no cambia.

Nótese el contraste con el CTA hermano: `jugar-ia` es un `<button>` pelado a propósito ([src/screens/Lobby.jsx:246-253](src/screens/Lobby.jsx#L246-L253)) para que el golpe de mesa **releve** al clic en vez de sonar encima. Si el CTA de PvP acaba disparando su propio sonido de entrada, hereda esa misma decisión.

### 3.2 `screen` y la cascada de `App.jsx`

**Ruta:** [src/App.jsx:62](src/App.jsx#L62)

```js
  const [screen, setScreen] = useState('lobby') // 'lobby' | 'nivel-select' | 'mode-select' | 'table'
```

**Cuatro valores.** El orden real de la cascada, leído de arriba abajo:

| Guarda | Devuelve | Ruta |
|---|---|---|
| `auth.estado === CARGANDO` | `null` (no pinta nada) | [App.jsx:100](src/App.jsx#L100) |
| `auth.estado === SIN_SESION` | `<Portada>` | [App.jsx:108](src/App.jsx#L108) |
| `auth.estado === SESION_SIN_PERFIL` | `<Bautizo>` | [App.jsx:112](src/App.jsx#L112) |
| `screen === 'table'` | `<GameTable>` | [App.jsx:143](src/App.jsx#L143) |
| `screen === 'mode-select'` | `<ModeSelect>` | [App.jsx:155](src/App.jsx#L155) |
| `screen === 'nivel-select'` | `<NivelSelect>` | [App.jsx:169](src/App.jsx#L169) |
| *(caída)* | `<Lobby>` | [App.jsx:181-187](src/App.jsx#L181-L187) |

**Lectura para SAL:** no hay router; es un `useState` y una cascada de `if`, y `App.jsx` es *el único sitio del proyecto que sabe cómo se pasa de una pantalla a otra*. Los tres valores nuevos —`'sala-opciones' | 'armar-mesa' | 'sala-espera'`— son tres `if` más **antes de la caída al lobby**, y el comentario del propio `screen` (una línea) es donde se declaran. `App.jsx` **no es protegido**.

Dos avisos que la cascada impone:

- **La guarda de precarga se cuela.** [App.jsx:88-94](src/App.jsx#L88-L94) dice `if (screen !== 'lobby') precargarSonidos(SONIDOS_MESA)` y lo mismo con `precargarBaraja()`. En cuanto `screen` valga `'sala-opciones'`, **se dispararán 380 KiB de audio de mesa y 0,57 MB de baraja** al entrar a la primera pantalla de salas. Puede ser lo deseado (el jugador va camino de una mesa) o puede ser exactamente lo que CAR-1 y PUE-1.2 sacaron del arranque, si el jugador solo estaba mirando. **Es una decisión de la Fase 1, no un accidente que deba descubrirse midiendo.**
- **El lobby no conoce `screen`.** `Lobby` recibe tres props y ninguna más ([App.jsx:181-187](src/App.jsx#L181-L187)); el PvP entra como una cuarta prop `onJugarPvP`, con el mismo molde que `onJugarIA`.

### 3.3 `useAuth`: qué expone, y el `uid` que NO expone

**Ruta:** [src/hooks/useAuth.js:244-247](src/hooks/useAuth.js#L244-L247)

```js
  return {
    estado, perfil: perfilVivo, correo: sesion?.user?.email ?? null,
    enviarCodigo, verificarCodigo, crearPerfil, cambiarNombre, cerrarSesion,
  }
```

El `uid` de Supabase es **interno al hook** — [src/hooks/useAuth.js:119](src/hooks/useAuth.js#L119):

```js
  const uid = sesion?.user?.id ?? null
```

Pero **sí sale por otra puerta**: el perfil se consulta con `.select('id, username')` ([useAuth.js:135](src/hooks/useAuth.js#L135)), así que **`auth.perfil.id` ES el `auth.users.id`**.

Y aquí está el hueco concreto — [src/App.jsx:126-131](src/App.jsx#L126-L131):

```js
  const cuenta = {
    username: auth.perfil?.username ?? '',
    correo: auth.correo ?? '',
    cambiarNombre: auth.cambiarNombre,
    cerrarSesion: auth.cerrarSesion,
  }
```

**`cuenta` no lleva `id`.** Las salas necesitan el uuid para `host_id` / `player_id`, y hoy ninguna pantalla lo recibe. El arreglo es de una línea (`id: auth.perfil?.id ?? null`) en `App.jsx`, que no es protegido. `GameTable` recibe este mismo objeto y no se entera de un campo de más.

**El bypass, y por qué corta un modo del arnés.** [src/hooks/useAuth.js:54](src/hooks/useAuth.js#L54):

```js
const PERFIL_DEV = { id: '00000000-0000-4000-8000-000000000000', username: 'DevLocal' }
```

Es un uuid **fijo y ficticio** cuyo comentario dice «jamás viaja a la red», y con `AUTH_BYPASS` el hook ni siquiera consulta `profiles` ([useAuth.js:130-131](src/hooks/useAuth.js#L130-L131)). Consecuencia dura para SAL: **el modo del arnés que mida contra Supabase no puede correr con `VITE_AUTH_BYPASS=1`**, porque ese perfil no existe en la base y cualquier FK lo rechazaría. Y con dos jugadores ficticios sería el mismo uuid dos veces, chocando contra la PK. El modo con backend necesita sesiones reales; el modo sin backend es el que usa el bypass.

### 3.4 Sonidos: el molde de LOB-1 y lo que le falta

**Ruta:** [src/hooks/useSounds.js:84](src/hooks/useSounds.js#L84)

```js
export const SONIDOS_LOBBY = ['tableKnock']
```

Los dos que la instrucción quiere para las salas **existen en la tabla pero no en esa lista**:

| Sonido | Ruta | ¿Precargado hoy? |
|---|---|---|
| `cardShuffle` | [useSounds.js:26](src/hooks/useSounds.js#L26) (`volume: 0.6`) | Sí, pero en `SONIDOS_MESA` ([useSounds.js:63-64](src/hooks/useSounds.js#L63)) |
| `chipsCollect` | [useSounds.js:37](src/hooks/useSounds.js#L37) (`volume: 0.7`) | **No, en ninguna lista** — el comentario de [useSounds.js:61](src/hooks/useSounds.js#L61) lo excluye de `SONIDOS_MESA` por ser de la celebración |
| `tableKnock` | [useSounds.js:39](src/hooks/useSounds.js#L39) (`volume: 0.6`) | Sí, `SONIDOS_LOBBY` |

**Lectura:** SAL necesita su propia lista (`SONIDOS_SALAS`) o ampliar `SONIDOS_LOBBY`, y `useSounds.js` **no es protegido**. El molde a copiar es el de `Lobby.jsx`: `useEffect(() => { precargarSonidos(SONIDOS_LOBBY) }, [])` al montar, no al pulsar, porque `precargarSonidos` es idempotente y Howler encolaría un `play` sobre un `Howl` que aún no bajó. `cardShuffle` además tiene un recorte especial al reproducir ([useSounds.js:165](src/hooks/useSounds.js#L165)) que hay que respetar.

`SoundButton` vive en [src/components/SoundButton.jsx](src/components/SoundButton.jsx) y dispara `buttonClick` antes del `onClick`.

### 3.5 IDI-0 — **`t()` NO interpola**

**Ruta:** [src/config/textos.js:60-72](src/config/textos.js#L60-L72)

```js
export function t(clave, idioma = IDIOMA_POR_DEFECTO) {
  const dicc = DICCIONARIOS[idioma] ?? DICCIONARIOS[IDIOMA_POR_DEFECTO]
  const valor = dicc?.[clave]
  if (typeof valor === 'string' && valor.length > 0) return valor

  if (!AVISADAS.has(clave)) {
    AVISADAS.add(clave)
    console.warn(`IDI-0: clave sin traducir en "${idioma}" — ${clave}`)
  }
  return `⟦${clave}⟧`
}
```

**Devuelve el valor tal cual. No hay sustitución de `{n}` ni de `{hc}`, ni un segundo argumento para variables.** El diccionario lo confirma: las 18 claves de [src/config/textos.es.js:26-56](src/config/textos.es.js#L26-L56) son cadenas planas y **ninguna** contiene un marcador `{…}`.

Y el hook estrecha aún más la firma — [src/hooks/useIdioma.js:60](src/hooks/useIdioma.js#L60):

```js
  const t = useMemo(() => (clave) => traducir(clave, idioma), [idioma])
```

**El `t` que las pantallas reciben acepta UN solo argumento.** Aunque `textos.js` creciera, `useIdioma` habría que tocarlo también.

**Consecuencia directa para SAL**, y es de las que cambian el plan: las salas están llenas de texto con variables —«3 de 5 jugadores», «Apuesta: 500 HC», «Quedan 2:47», «Código AJ-7K3M»—. Hoy **no hay forma de expresarlas** con `t()`. Hay dos salidas y la Fase 1 tiene que elegir una explícitamente:

1. **Extender `t()`** con un tercer parámetro de variables y una sustitución de `{clave}`, propagando el cambio a `useIdioma`. Ninguno de los dos archivos es protegido. Es lo correcto a medio plazo: IDI-1 traerá cuatro diccionarios más y el orden de las palabras cambia entre idiomas (partir la frase en trozos concatenados es exactamente lo que hace intraducible un texto).
2. **Trocear las claves** y componer en el JSX. Barato hoy, deuda garantizada en IDI-1.

Hay un detalle a favor de extender: el fallback visible `⟦clave⟧` es lo que mide el punto 4 del modo `lob` del arnés. Cualquier extensión tiene que preservarlo, y conviene que una **variable** que falte también cante en vez de imprimir `undefined`.

El alcance declarado del diccionario ([textos.es.js:23-25](src/config/textos.es.js#L23)) es **solo el lobby**. SAL sería la segunda campaña en entrar, y el comentario de las claves como contrato aplica igual: *«la clave no se renombra nunca… el arnés se cuelga de `data-accion`, jamás del rótulo visible»*.

### 3.6 El arnés: qué habría que extender para un modo `sal`

**Lo que hay hoy:**

| | `diagDSK.mjs` modo `lob` | `diagPUE.mjs` modo `puerta` |
|---|---|---|
| Base | `process.env.AJILEI_BASE \|\| 'http://localhost:5173'` ([diagDSK.mjs:266](scripts/diagDSK.mjs#L266)) | `process.env.PUE_BASE \|\| 'http://localhost:4173'` ([diagPUE.mjs:28](scripts/diagPUE.mjs#L28)) |
| Terreno | `npm run dev` **con `VITE_AUTH_BYPASS=1`** | `npm run build && vite preview` (puerta viva) |
| Función | `runLob(browser)` ([diagDSK.mjs:783](scripts/diagDSK.mjs#L783)) | `puerta.0`…`puerta.6` |
| Viewports | 6 celdas, `LOB_VIEWPORTS` ([diagDSK.mjs:764-771](scripts/diagDSK.mjs#L764)) — 640×360, 360×640, 844×390, 1024×768, 1366×768, 1920×937 | — |
| Enganche | `await page.waitForSelector('main.lobby')` + 400 ms de asiento; selectores por `[data-accion]` | selectores de Portada |

`puerta.4` — [scripts/diagPUE.mjs:210](scripts/diagPUE.mjs#L210):

```js
  anota('puerta.4 el lobby NO captura al visitante anónimo', !R.lobby,
```

**Lo que un modo `sal` necesita, en dos mitades:**

**`sal` sin backend (geometría, con datos simulados).** Es una extensión mecánica de `runLob`: mismo `LOB_VIEWPORTS`, misma espera de selector raíz, mismos ganchos `[data-accion]`, mismo punto 4 de `⟦`. Lo único que **no existe** es una forma de poner las tres pantallas en escena sin base. El proyecto ya tiene dos moldes para eso y ninguno sirve tal cual: `?cel=<n>` de CEL y `siembraCEL.js` (puerta doble `import.meta.env.DEV && VITE_…`). La Fase 1 tiene que decidir el suyo —un `?sal=<estado>` con salas de mentira— y ese es el andamio que permite medir la Sala de espera con 1, 2 y 5 sentados sin cinco teléfonos.

**`sal` contra Supabase.** Aquí el arnés cambia de naturaleza y conviene decirlo antes de escribirlo:
- **No puede usar el bypass** (§3.3): necesita sesiones reales, y por tanto un camino de login programático (OTP por correo no es automatizable; haría falta otra vía).
- **Necesita dos contextos de navegador** —dos jugadores— para que haya algo que medir: una sala con un solo asiento ocupado no ejerce Realtime.
- **Escribiría en la base.** Un arnés que crea salas deja filas; necesita limpieza, o un proyecto aparte.
- Correría contra `vite preview` en 4173 con la puerta viva, no contra 5173.

Es un arnés de otra categoría que los veinte que hay. Merece su propio archivo (`diagSAL.mjs`) y no un modo más de `diagDSK`.

---

## P4 · Pureza del motor — la pregunta que decide el árbitro

### 4.1 Impurezas: CERO

```
grep -n "document|window|localStorage|Howl|import.*react|setTimeout|setInterval|
         requestAnimationFrame|fetch(" src/engine/ src/config/seatLayouts.js
→ (sin coincidencias)
```

Cuatro archivos de motor (1 572 líneas) más `seatLayouts.js` (59): **ni una sola referencia al DOM, a un temporizador, a la red, al almacenamiento o a React.** Lo esperado se cumple exactamente.

### 4.2 Node-ismos: CERO

```
grep -n "require\(|Buffer|process\.|__dirname|module.exports" src/engine/ src/config/seatLayouts.js
→ (sin coincidencias)
```

ESM puro. Nada que Deno no tenga.

### 4.3 `Math.random` — dónde, y qué significa

| Ruta | Uso |
|---|---|
| [src/engine/deck.js:45](src/engine/deck.js#L45) | Fisher-Yates dentro de `shuffleDeck` |
| [src/engine/aiPlayer.js:494](src/engine/aiPlayer.js#L494) | barajado interno de la IA |
| [aiPlayer.js:644](src/engine/aiPlayer.js#L644), [:696](src/engine/aiPlayer.js#L696), [:803](src/engine/aiPlayer.js#L803), [:852](src/engine/aiPlayer.js#L852), [:864](src/engine/aiPlayer.js#L864) | ruido de evaluación, disimulo, farol, decisión de subir |

**`gameEngine.js` no llama a `Math.random` ni una vez.** Toda su aleatoriedad entra por `shuffleDeck(createDeck())` en `startHand` ([gameEngine.js:421](src/engine/gameEngine.js#L421)).

**¿Barajado con semilla inyectable? NO.** [src/engine/deck.js:41-48](src/engine/deck.js#L41-L48):

```js
export function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
```

Un solo parámetro, `Math.random` cableado. No acepta fuente de aleatoriedad ni `seed`.

**Y aquí un hecho que cambia el coste del arreglo: `deck.js` NO ES PROTEGIDO.** La lista canónica ([docs/AJILEI_Protegidos_v1.0.md §2](docs/AJILEI_Protegidos_v1.0.md)) son **cinco** archivos: `gameEngine.js`, `aiPlayer.js`, `seatLayouts.js`, `opponentPanel.css`, `gameTable.css`. `deck.js` y `handEvaluator.js` **no están en ella**. Darle a `shuffleDeck` un segundo parámetro opcional (`shuffleDeck(deck, rng = Math.random)`) es **aditivo, retrocompatible y no requiere autorización**.

Para el servidor esto importa por dos razones: `Math.random` no es criptográficamente seguro (en un juego con dinero, un barajado predecible es el fallo), y sin semilla registrada una mano no es **auditable** — no se puede reconstruir para resolver una disputa.

**La IA en el servidor:** el motor **no la invoca por su cuenta** en el camino de apuestas —`applyAIBetAction` es explícita ([gameEngine.js:479](src/engine/gameEngine.js#L479))—, pero **sí la invoca sola en el descarte**. Ver §4.10, que es donde deja de ser un detalle.

### 4.4 Exports públicos de `gameEngine.js`

| Símbolo | Firma / tipo |
|---|---|
| `PHASES` | objeto de 10 fases: `WAITING, DEAL_2, BET_1, DEAL_3, BET_2, DISCARD, BET_3, SHOWDOWN, PAYOUT, GAME_OVER` |
| `MIN_BET` | número (`AJILEI_CONFIG.betting.apuestaMinima`) |
| `maxDiscard(numPlayers)` | → número (5 con ≤4 jugadores, 3 con 5) |
| `makeHandRules(ruleN)` | → `{ ruleN, comodinValue, maxDiscard }` |
| `createInitialState(unit = 10, numPlayers = 2)` | → estado |
| `startHand(state)` | → estado |
| `advanceFromDeal(state)` | → estado |
| `applyPlayerBetAction(state, action, betAmount)` | → estado |
| `applyAIBetAction(state)` | → estado |
| `applyDiscard(state, humanDiscardIndices)` | → estado |
| `toggleDiscard(state, cardIndex)` | → estado |

**No exportado, y es el que hace falta:** `applyBetAction(state, playerIndex, action, betAmount)` ([gameEngine.js:249](src/engine/gameEngine.js#L249)) — la única función que sabe aplicar una apuesta **de un asiento arbitrario**. Es `function`, sin `export`.

### 4.5 Forma del estado — **objeto plano serializable, verificado**

Sonda ejecutada (`createInitialState(10, 3)` → `startHand` → `advanceFromDeal`, y round-trip por JSON):

```
claves del estado : phase, numPlayers, aliveCount, handRules, eliminatedNames, unit,
                    players, pieIndex, manoIndex, activePlayerIndex, pot, currentBet,
                    selectedDiscards, winner, message, handCount, deck
bytes JSON        : 3418
ida==vuelta       : true
tipos raros       : []            (ni funciones, ni Map, ni Set)
startHand muta?   : no muta
devuelve nuevo?   : si, objeto nuevo
sigue desde JSON  : BET_1 · pot 30
manos visibles    : Tú:2 IA 1:2 IA 2:2
mazo restante     : 34 cartas EN el estado
```

**Un objeto plano de 17 claves y ~3,4 KB, sin clases, funciones, `Map`/`Set` ni referencias circulares.** Sobrevive `JSON.parse(JSON.stringify(…))` **byte a byte**, y la partida **continúa desde el estado deserializado** sin distinguirlo del original. Cabe holgadamente en una columna `jsonb`.

Cada jugador es `{ id, name, isHuman, chips, cards, contrib, acted, folded, score, eliminated }` ([gameEngine.js:52](src/engine/gameEngine.js#L52)) — todo primitivo o array de objetos planos.

### 4.6 ¿Muta o devuelve nuevo? — **Devuelve nuevo, sin excepción**

Verificado arriba: `startHand` no toca el estado que recibe. El patrón es uniforme y explícito en las once funciones: `return { ...state, … }`, con `players.map(p => ({ ...p, … }))` para el nivel de abajo y `[...state.deck]` para el mazo. **El motor es una función pura del estado.** Para guardarlo en Postgres entre jugadas esto es exactamente lo que hace falta: leer fila → aplicar → escribir fila, sin sorpresas de aliasing.

### 4.7 Vista parcial por jugador — **NO EXISTE**

```
grep -rn "vistaParcial|redact|sanitiz|maskState|forPlayer|publicState|hideCards" src/
→ (sin coincidencias)
```

El estado es **uno solo con todas las manos a la vista**, y además con las **34 cartas restantes del mazo dentro** (`state.deck`, confirmado por la sonda). En vs-IA no importaba: todo vivía en el navegador del único humano.

En PvP es **el requisito de seguridad número uno**. Mandar este objeto a los cinco clientes es repartir las cartas de todos boca arriba y el mazo completo con ellas. La Fase 1 necesita una función `vistaDe(estado, uid)` que devuelva mano propia + cartas contadas de los demás + mesa, y **cero mazo**.

La buena noticia: es **aditiva**. Es una función nueva, en un archivo nuevo, que lee el estado y devuelve otro objeto. No toca `gameEngine.js`. Puede vivir junto al árbitro y en el cliente a la vez.

### 4.8 Pruebas y entorno

```
npm test → Test Files 19 passed (19) · Tests 483 passed (483) · Duration 737ms
```

Del motor se ocupan `scripts/testEngine.test.js`, `testHandRules.test.js`, `testEliminations.test.js`, `testAI.test.js`, `testNivel1/2.test.js`, `testNiveles.test.js`.

**Entorno: `node` puro.** No hay `vitest.config.*`, y [vite.config.js](vite.config.js) no declara bloque `test`, así que rige el defecto de Vitest, que es `environment: 'node'`. La corrida lo confirma: `environment 2ms` (jsdom tarda cientos de ms en levantar) y no hay jsdom entre las dependencias. **El motor ya se ejercita sin navegador, 483 veces.**

### 4.9 Deno vs Node — **el obstáculo real, y es de resolución de módulos**

Importar el motor desde Node **falla**:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  'C:\…\src\engine\deck' imported from …\src\engine\gameEngine.js
```

La causa, en las cuatro primeras líneas de [src/engine/gameEngine.js:1-4](src/engine/gameEngine.js#L1-L4):

```js
import { createDeck, shuffleDeck } from './deck'
import { getBestSuitScore, isAjilei, getComodinValue } from './handEvaluator'
import { decideBetAction, decideDiscard } from './aiPlayer'
import { AJILEI_CONFIG } from '../config/ajileiConfig'
```

**Sin extensión.** Vite y Vitest lo resuelven; **Node ESM y Deno no** — ambos exigen el especificador completo.

Es un problema **conocido y ya rodeado** en esta casa. [scripts/_resolveExt.mjs](scripts/_resolveExt.mjs) existe justamente para esto, y su cabecera lo dice con todas las letras:

> *«El arreglo obvio —añadir la extensión— toca `gameEngine.js`, que es ARCHIVO PROTEGIDO… Así que el arnés se adapta al motor y no al revés.»*

Con ese gancho registrado, el motor importa y corre en Node sin tocar nada (es como se obtuvieron las cifras de §4.5).

Y el alcance es **más pequeño de lo que parece**: el censo de especificadores muestra que `aiPlayer.js` **ya usa `.js`** en sus dos imports ([aiPlayer.js:1-2](src/engine/aiPlayer.js#L1-L2)). `deck.js`, `handEvaluator.js`, `seatLayouts.js` y `ajileiConfig.js` no importan nada. **Las únicas cuatro líneas afectadas de todo el motor son las cuatro de arriba.**

### 4.10 El obstáculo que la instrucción no anticipaba: la API pública está cableada a un solo humano en el asiento 0

Tres hechos, y hay que verlos juntos:

**(a) La única forma exportada de aplicar una apuesta fija el asiento 0** — [gameEngine.js:474-476](src/engine/gameEngine.js#L474-L476):

```js
export function applyPlayerBetAction(state, action, betAmount) {
  return applyBetAction(state, 0, action, betAmount)   // human is always seat 0
}
```

La otra puerta exportada, `applyAIBetAction` ([gameEngine.js:479-483](src/engine/gameEngine.js#L479)), sí usa `state.activePlayerIndex` — pero **llama a `decideBetAction`**, o sea a la IA, que en PvP está prohibida. `applyBetAction`, que acepta `playerIndex`, **no está exportada**.

**(b) El descarte reparte el mismo array a todos los humanos y llama a la IA por los demás** — [gameEngine.js:500-502](src/engine/gameEngine.js#L500-L502):

```js
    let indices = player.isHuman
      ? humanDiscardIndices
      : decideDiscard(state, seat)
```

`applyDiscard(state, humanDiscardIndices)` recibe **un solo** array. Con cinco jugadores marcados `isHuman: true`, los cinco descartarían **las mismas posiciones**. Y con `isHuman: false`, decide la IA — que es justo lo que PvP no admite.

**(c) `createInitialState` construye una mesa de un humano y N−1 IAs** — [gameEngine.js:56-63](src/engine/gameEngine.js#L56-L63): asiento 0 `isHuman: true` y nombre `'Tú'`; el resto `isHuman: false` con nombres `'IA'` / `'IA n'`. Y toma las fichas de `AJILEI_CONFIG.economy.saldoInicial`, no de un saldo por jugador.

**Ninguno de los tres se rodea de forma aditiva honesta.** Un envoltorio externo que quisiera aplicar la apuesta del asiento 3 tendría que **reimplementar** `applyBetAction` —el pozo, el `currentBet`, el `acted`, el cierre de ronda, la eliminación— y un árbitro que duplica las reglas del motor deja de ser un árbitro: es un segundo motor que puede divergir del primero. Eso es peor que abrir el archivo.

Lo que hace falta es quirúrgico y **compatible hacia atrás**:

1. `export` delante de `applyBetAction` (una palabra; no cambia una coma de lo que ya funciona).
2. Un parámetro de asiento opcional en `applyPlayerBetAction` (`seat = 0`) y un descarte por asiento en `applyDiscard` (aceptar un mapa `{seat: indices}` **o** el array de hoy).
3. Un `createInitialState` que admita una lista de jugadores con nombre, uuid y fichas propias.

Los tres viven en `gameEngine.js`, que es **protegido**. Van a «Requiere autorización».

---

### 4.11 VEREDICTO DE P4

> **El motor PUEDE correr en una Edge Function, con 3 adaptaciones fuera del protegido — pero NO PUEDE arbitrar una mesa PvP sin abrir `gameEngine.js`, porque su API pública solo sabe mover al humano del asiento 0.**

Desglosado, para que la Fase 1 no tenga que releer:

**Lo que ya está resuelto y no cuesta nada:** pureza total (§4.1), ESM sin Node-ismos (§4.2), estado JSON plano que va y vuelve intacto (§4.5), funciones puras sin mutación (§4.6), 483 pruebas en Node puro (§4.8).

**Las 3 adaptaciones fuera del protegido:**
1. **Empaquetar el motor** para el Edge Function con un `esbuild`/`vite build` que resuelva los cuatro especificadores sin extensión (§4.9). Evita tocar el protegido, y de paso deja fuera a `aiPlayer.js` por *tree-shaking* si nada lo importa.
2. **`shuffleDeck(deck, rng = Math.random)`** en `deck.js`, que **no es protegido** (§4.3) — para barajar con CSPRNG y con semilla registrable.
3. **`vistaDe(estado, uid)`**, función nueva en archivo nuevo (§4.7) — mano propia, cartas contadas de los demás, mesa, cero mazo.

**Lo que sí exige abrir el protegido** (§4.10): exportar `applyBetAction`, parametrizar el asiento en `applyPlayerBetAction` / `applyDiscard`, y un `createInitialState` que acepte jugadores reales.

**El camino más corto si Victor prefiere no abrirlo:** un `sal.arbitro.js` que envuelva al motor y **reordene los asientos** antes de cada llamada no funciona (los índices `manoIndex`/`pieIndex` y el orden de reparto son posicionales y sellados por HR-1). No hay atajo limpio. La decisión honesta es autorizar las tres ediciones quirúrgicas, que son aditivas y no cambian una sola regla del juego.

---

## P5 · Economía en config

### 5.1 `AJILEI_CONFIG.economy` — las cuatro claves

**Ruta:** [src/config/ajileiConfig.js:21-26](src/config/ajileiConfig.js#L21-L26)

```js
  economy: {
    saldoInicial: 5000,
    bonoDiario: 50,
    videoReward: 25,
    maxVideosPerDay: 5,
  },
```

**No hay más.** No existe una clave `apuestas` dentro de `economy`, ni nada de PvP.

Las apuestas viven en otros dos sitios, **ninguno con las seis de 100–5000**:

- [ajileiConfig.js:1](src/config/ajileiConfig.js#L1) — `export const STAKE_OPTIONS = [100, 200, 300, 500]`, **cuatro**, consumidas solo por [TableSelect.jsx:15](src/components/TableSelect.jsx#L15).
- [src/config/niveles.js:22,29,36](src/config/niveles.js#L22) — **cuatro por nivel**: `[50,100,150,250]`, `[100,200,300,500]`, `[200,400,600,1000]`, leídas por `apuestasDe(id)` ([niveles.js:59](src/config/niveles.js#L59)). El solapamiento es intención sellada.

**Lectura para SAL:** las seis apuestas PvP (100–5000) **no existen todavía en ningún sitio**. Son constantes nuevas. Y no deben meterse en `niveles.js`, cuyas tablas están atadas a la dificultad de la IA — un concepto que en PvP no existe.

Y el `betting` que sí gobierna la mesa ([ajileiConfig.js:12-19](src/config/ajileiConfig.js#L12)) es de otra escala: `entrada: 10`, `apuestaMinima: 10`, `maximoPorRonda: 100`, `allInEnabled: false`. Merece atención: la «apuesta» que SAL elige (100–5000) es la **entrada a la mesa**, no la apuesta por ronda del motor. Son dos números distintos y la Fase 1 debe decir cómo se relacionan, porque `createInitialState(unit, numPlayers)` toma `unit` como el **ante** de cada mano.

### 5.2 Dónde se lee `saldoInicial` hoy — **seis sitios, y uno es el protegido**

| Ruta | Uso |
|---|---|
| [src/engine/gameEngine.js:57](src/engine/gameEngine.js#L57) | `const chips = AJILEI_CONFIG.economy.saldoInicial` — **PROTEGIDO** |
| [src/screens/Lobby.jsx:196](src/screens/Lobby.jsx#L196) | la píldora de saldo del lobby |
| [src/components/ModeSelect.jsx:40](src/components/ModeSelect.jsx#L40) | `<BalanceDisplay chips={…saldoInicial} /> Heptacoins` |
| [src/hooks/sesionCore.js:50](src/hooks/sesionCore.js#L50) | `return chips - AJILEI_CONFIG.economy.saldoInicial` — netas de la sesión |
| [scripts/diagCEL0.mjs:196](scripts/diagCEL0.mjs#L196), [scripts/diagDSK.mjs:3687](scripts/diagDSK.mjs#L3687) | arneses, con la cifra copiada |

**Lectura, y es incómoda:** *no hay un solo sitio*. Hay seis, y el más difícil de cambiar —el que decide las fichas con las que empieza un jugador— está **dentro del archivo protegido**. La instrucción pide que SAL lea el saldo «de un solo sitio que ECO-1 luego cambie por Supabase sin tocar las salas», y eso hoy hay que **construirlo**: una función `saldoDelJugador()` en un módulo nuevo que hoy devuelva la constante y mañana consulte Supabase. SAL debe consumir **solo** esa función. Los otros cinco sitios son de vs-IA y pueden quedarse como están hasta ECO-1.

El informe de LOB-1 Fase 1 ya lo había dicho: *«El saldo sigue siendo una constante… No hay ledger en el producto»*.

### 5.3 El bono 1200 — **no existe en ninguna parte**

`grep -rn "1200|bonoDiario|bono" docs/*.md src/config/*.js` devuelve **una sola** coincidencia: `bonoDiario: 50` ([ajileiConfig.js:23](src/config/ajileiConfig.js#L23)).

- **No hay `1200`** en ningún archivo de configuración ni en ningún documento de `docs/`.
- **No hay un «1000 viejo» como bono.** El `1000` que existe es la apuesta más alta del nivel 3 ([niveles.js:36](src/config/niveles.js#L36)), que es otra cosa.

El bono 1200 es una decisión sellada **sin una sola línea de respaldo en el árbol**. Nace en la Fase 1.

---

## P6 · Compartir y copiar en el cliente

### 6.1 `navigator.share` / `navigator.clipboard`: **CERO**

```
grep -rn "navigator.share|navigator.clipboard|execCommand|share_target" src/ index.html public/
→ (sin coincidencias)
```

Confirmado lo esperado. SAL sería el primer consumidor de ambas API — el código `AJ-XXXX` necesita «copiar» y «compartir».

### 6.2 `manifest.webmanifest` — sin `share_target`

[public/manifest.webmanifest](public/manifest.webmanifest) tiene exactamente estas claves: `name`, `short_name`, `start_url`, `scope`, `display: standalone`, `orientation: any`, `background_color`, `theme_color`, `icons`. **Nada de `share_target`**, ni `protocol_handlers`, ni `launch_handler`.

Anotación útil: `scope: "/"` y `start_url: "/"`. Si el código de sala llegara por enlace (`/sala/AJ-7K3M` o `/?sala=AJ7K3M`), cae dentro del `scope` y **abriría la PWA instalada**. Pero el proyecto **no tiene router** (§3.2), así que una ruta con path no la entiende nadie: el parámetro de consulta es el camino compatible con lo que hay.

### 6.3 Política de permisos: **no hay ninguna que estorbe**

[public/_headers](public/_headers) declara **una sola regla**, y es de caché (`/assets/*` → `immutable`). **No hay `Permissions-Policy` ni `Content-Security-Policy`** en `_headers` ni en [index.html](index.html).

**Lectura:** nada bloquea `clipboard-write`. En contexto seguro (HTTPS, que es como se sirve) y en el documento de primer nivel, `navigator.clipboard.writeText()` está permitido por defecto. `navigator.share()` exige además **gesto del usuario** —un clic— y no está disponible en todos los escritorios, así que el botón de compartir necesita camino alterno (copiar) cuando `navigator.share` no existe.

---

## P7 · Estado del repositorio

### 7.1 SHA y árbol

```
git log -1 --format=%H
1f2a610b76ec7dcdb9f84214617e9c4b90163643
```

```
git status --short
 M docs/reportes/AJILEI_LOB1_Fase1_Informe_v1.0.md
?? _probeA1.mjs
?? _shotA1.mjs
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

**Los siete residuos son exactamente los previstos** por la instrucción: los tres de `laminas/mon1/`, `scripts/_cel1bFila.mjs`, `_probeA1.mjs`, `_shotA1.mjs`, y el informe de LOB-1 Fase 1 modificado sin commitear (su pie). Victor no los borró. **Esta fase no añade ni quita ninguno** — al cerrar, el árbol es idéntico salvo este informe, que aparecerá como un octavo `??`.

### 7.2 `src/screens/` y las tres pantallas ausentes

```
src/screens/  →  Bautizo.jsx  Entrada.jsx  Lobby.jsx  Portada.jsx
```

Cuatro archivos. `find . -iname "*Sala*" -o -iname "*ArmarMesa*"` (excluyendo `node_modules` y `.git`) → **sin coincidencias**. **`SalaOpciones.jsx`, `ArmarMesa.jsx` y `SalaEspera.jsx` no existen en ningún sitio del árbol.**

`src/screens/` sigue siendo el sitio de las pantallas completas, y `Lobby.jsx` es el precedente inmediato del molde que SAL debe seguir (hoja de estilos propia, clase en `<body>` con alcance, textos por `t()`, ganchos `data-accion`).

Nota de higiene heredada: `src/components/WelcomeScreen.jsx` **sigue en el árbol** aunque nada lo renderice — el punto `lob.1` del arnés lo vigila precisamente por eso. `src/screens/Entrada.jsx` está en la misma situación desde PUE.

### 7.3 `package.json` y el SDK

[package.json](package.json) — dependencias de producción: **cuatro**.

```json
"@supabase/supabase-js": "^2.112.4",
"howler": "^2.2.4",
"react": "^19.2.6",
"react-dom": "^19.2.6"
```

**Instalado: `@supabase/supabase-js` 2.112.4** — es **2.x** y trae Realtime dentro:

```
deps: @supabase/auth-js, @supabase/functions-js, @supabase/postgrest-js,
      @supabase/realtime-js, @supabase/storage-js
```

Confirmado. No hace falta instalar nada para Realtime ni para invocar Edge Functions (`functions-js` ya viaja). Dev: `playwright-core` 1.62.1 y `vitest` 4.1.8, que son el arnés y las pruebas.

---

## Hallazgos laterales

1. **`normalizar_username` es invocable como RPC con la llave publicable.** `POST /rest/v1/rpc/normalizar_username {"txt":"p3nd3j0"}` → `200 "pendejo"`, sin sesión. No filtra la lista de vedados (`reserved_usernames` está bien cerrada, RLS sin políticas), pero deja el normalizador expuesto a cualquiera con la llave del cliente —que por diseño acaba en el navegador—. Es de bajo riesgo y probablemente no intencionado: PostgREST expone toda función `public` por defecto. Si molesta, se cierra con `revoke execute … from anon`. **No se tocó nada.**

2. **La guarda de precarga de `App.jsx` se dispara con el primer `screen` nuevo.** `if (screen !== 'lobby')` ([App.jsx:88-94](src/App.jsx#L88-L94)) lanza `SONIDOS_MESA` (~380 KiB) y `precargarBaraja()` (0,57 MB) en cuanto `screen` valga `'sala-opciones'`. La cabecera de ese efecto advierte de este caso exacto para el lobby. Decisión consciente para la Fase 1, no hallazgo que descubrir midiendo.

3. **`deck.js` y `handEvaluator.js` no son protegidos.** La lista canónica son cinco archivos y estos dos no están. Abarata la semilla del barajado (§4.3) — pero conviene decirlo en voz alta antes de que alguien lo dé por hecho: **el motor de verdad, `gameEngine.js`, sí lo es.**

4. **`GameTable.jsx` genera ids con `Date.now()`** ([:406](src/components/GameTable.jsx#L406), [:1323](src/components/GameTable.jsx#L1323)). Sirve hoy porque el ámbito es un solo navegador. En PvP dos clientes pueden emitir el mismo milisegundo; cualquier identificador que cruce la red necesita otro origen (uuid, o que lo ponga la base).

5. **No hay router y el `scope` de la PWA es `/`.** Un enlace de invitación con path (`/sala/AJ-7K3M`) abriría la PWA y aterrizaría en un `App` que no sabe leerlo. El parámetro de consulta es la vía compatible.

6. **El diccionario IDI-0 está declarado «solo lobby»** ([textos.es.js:23-25](src/config/textos.es.js#L23)) con 18 claves. SAL será la segunda campaña que entre y probablemente duplique o triplique ese tamaño — buen momento para decidir si las claves se agrupan por pantalla (`sal.espera.*`) antes de que haya cien.

7. **No existe carpeta `supabase/functions/` ni `config.toml`.** El proyecto no está enlazado a un CLI local: la única migración se aplicó pegándola en el SQL Editor del panel, como declara su propia cabecera. Si SAL va a traer varias migraciones y una Edge Function, la Fase 1 debería decidir si se adopta el CLI (`supabase link`, `supabase db push`, `supabase functions deploy`) o se sigue pegando a mano — pegar a mano una Edge Function no es posible.

---

## Requiere autorización

Cuatro preguntas de la instrucción quedaron sin respuesta dura, todas por el mismo motivo: **la llave publicable no abre el catálogo del sistema, y no hay CLI ni `psql` en la máquina.** Ninguna se contestó por conjetura.

| # | Pregunta abierta | Qué se necesita |
|---|---|---|
| 1 | **Qué tablas están en la publicación `supabase_realtime`** (§1.5). El sondeo no discrimina: una tabla inexistente también dice SUBSCRIBED. | `select * from pg_publication_tables where pubname='supabase_realtime'` en el SQL Editor, o Database → Replication en el panel. |
| 2 | **Censo cierto de tablas, políticas y funciones** (§1.1–1.4). Lo reportado es la migración versionada confirmada por sondeo, no una lectura de `information_schema` / `pg_policies` / `pg_proc`. | Panel, o el CLI de Supabase instalado (`supabase db dump --schema-only` a un archivo fuera del repo). |
| 3 | **Enumeración de Edge Functions desplegadas** (§1.4). Cuatro nombres tanteados dieron 404; tantear no es enumerar. | `supabase functions list`, o Edge Functions en el panel. |
| 4 | **Plan (Free/Pro) y región del proyecto** (§1.7). Fijan los límites de Realtime, Edge Functions y conexiones que SAL va a consumir. | Panel → Settings → General / Billing. |

Y una quinta, que no es de acceso sino de **decisión de Victor**:

| # | Qué se pide | Por qué |
|---|---|---|
| 5 | **Autorización para tres ediciones quirúrgicas en `src/engine/gameEngine.js`** (protegido): (a) `export` sobre `applyBetAction`; (b) asiento parametrizable en `applyPlayerBetAction` y descarte por asiento en `applyDiscard`; (c) `createInitialState` que acepte una lista de jugadores reales. | §4.10. Son las tres cosas sin las que el motor **no puede** arbitrar una mesa de cinco humanos. Todas son **aditivas y retrocompatibles** —vs-IA sigue llamando igual— y **ninguna cambia una regla del juego**. La alternativa aditiva que la doctrina de protegidos suele encontrar aquí **no existe**: envolver el motor obligaría a reimplementar la aplicación de apuestas, y un árbitro que duplica las reglas puede divergir del motor que valida. Eso es peor que abrir el archivo. Se **detuvo** y se reporta, como manda §1 de `AJILEI_Protegidos_v1.0.md`. |

---

## Hechos que condicionan la Fase 1

1. **El motor arbitra, pero no sabe mover a nadie que no sea el asiento 0.** Es puro, serializable (3,4 KB de JSON plano, ida y vuelta byte-idéntica), no muta y corre en Node hoy — pero su API pública cablea `seat 0` en la apuesta, reparte un solo array de descarte a todos los humanos y llama a la IA por los demás. **Sin tres ediciones en `gameEngine.js` (protegido) no hay PvP.**

2. **Realtime está vivo, pero SUBSCRIBED no prueba nada.** Una suscripción a una tabla inexistente también devuelve SUBSCRIBED: si la tabla nueva no se añade a `supabase_realtime`, el canal se conecta y **no llega un solo evento**. El alta en la publicación es un paso explícito de la migración, no un supuesto.

3. **`t()` no interpola, y las salas son puro texto con variables.** «3 de 5 jugadores», «Quedan 2:47», «AJ-7K3M». `useIdioma` además estrecha `t` a un solo argumento. Extender `t()` (dos archivos, ninguno protegido) o trocear claves: hay que elegir en la Fase 1, y trocear es deuda garantizada en IDI-1.

4. **No hay reloj de servidor en el cliente, ni corrección de deriva, ni saldo real.** El cronómetro 3:00 y la regla del 5× necesitan las dos cosas desde cero: un `timestamptz` del servidor con desfase medido una vez, y un `saldoDelJugador()` único —hoy `saldoInicial` se lee en **seis** sitios y uno está dentro del protegido—. El bono 1200 y las seis apuestas 100–5000 **no existen en una sola línea del árbol**.

5. **El estado enseña todas las manos y las 34 cartas del mazo.** No hay ninguna función de vista parcial en todo `src/`. Mandarlo a los cinco clientes es repartir boca arriba. `vistaDe(estado, uid)` es aditiva y no toca el protegido — pero es requisito de seguridad, no adorno, y va antes del primer píxel de la Sala de espera.

---

**STOP.**

Árbol idéntico al de partida salvo este informe. Sin commits. Ninguna escritura en Supabase. Ningún archivo protegido editado.
