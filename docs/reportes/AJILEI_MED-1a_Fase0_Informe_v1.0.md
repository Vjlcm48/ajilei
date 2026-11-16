# AJILEI · MED-1a · Medición base · Informe de la Fase 0 · v1.0

- **Fecha:** 2026-11-15 · **SHA:** `b9474c7` (`main` = `origin/main`, árbol limpio al empezar y al terminar).
- **Tiempo real:** unos 75 min, dentro del tope de 90.
- **Qué se hizo:** solo lectura del repo, de su historia y de los logs de la línea base `completo` (`%TEMP%\varas-mwhrzfi8\`, existe) y de la repetición de `h1.5`/`z1` (`%TEMP%\varas-mwi7y7cp\`). Dos consultas de solo lectura a la red: `npm view supabase` y las notas de la v3.0.0 en GitHub. Un script de grafo en el scratchpad. No se corrió vitest, PGlite, ninguna vara, ni nada contra la nube o Cloudflare. La única escritura es este informe.
- **Qué quedó sin mirar:** las cabeceras que recibe de verdad una Edge Function de Supabase (solo se ven desplegando una sonda; §C) y si el panel de Cloudflare ofrece la inyección automática para un Worker (§E). Las dos se dejan como paso de Victor.

**Donde la ficha y el repo no coinciden (manda el repo):**
1. `docs/AJILEI_Generador_de_Usuarios_v1.0.md` **no existe** en el repo (ni la Ruta). La tabla de §B se diseña para recibir cualquier `inv_*` sin conocer su §5.
2. `profiles` lleva `created_at`/`updated_at` en inglés (`0001_sup2a_identidad.sql:29-34`), no `creado_en`.
3. «Registro» son dos momentos: la cuenta nace en `auth.users` al verificar el código (`useAuth.js:328`, `signInWithOtp` con `shouldCreateUser`), y la fila de `profiles` nace minutos después, en el Bautizo (`useAuth.js:368`).
4. ajilei.io no es un proyecto de Pages: es un **Worker con assets estáticos** (`wrangler.jsonc:1-8`, sin `main`; DES-1, `cfeb39c`).
5. El anuncio de la pausa es **simulado** (`AnuncioPvP.jsx:8-21`): no hay «fin del anuncio», solo «Omitir» o el tope de 30 s.

---

## A · Lo que ya se mide sin un evento nuevo

### A.1 · Inventario de tablas con fecha o jugador

| Tabla | Tiempo | Jugador | Distingue filas por | Cita |
|---|---|---|---|---|
| `profiles` | `created_at`, `updated_at`, `nombre_cambiado_en` | `id` (= `auth.users.id`) | `pais` (elegido, ISO o nulo), `estado` (solo VE) | `0001:29-41` · `cfg1b_perfil:36-39` |
| `auth.users` | `created_at` (código verificado) | `id` | — | fuera de las migraciones; legible desde el SQL Editor |
| `movimientos` | `creado_en` | `jugador_id` | `tipo` (14 valores), `ref_tipo`/`ref_id`, `clave_idem` | `eco1a_libro:162-192` · lista vigente `v13_recarga:29-35` |
| `mesas_ia` | `abierta_en`, `cerrada_en`, `ultimo_aviso_en` | `jugador_id` | `reto`, `jugadores`, `apuesta`, `estado`, `motivo_cierre`, `recargas`, **`mano_informada`** (manos por mesa) | `eco1c_mesas_ia:122-162` · `rnk1a:295-296` |
| `record_manos` | `actualizado_en` | `jugador_id` | `reto`, `vivos`; `jugadas` acumuladas **sin fecha** | `eco1c_mesas_ia:185-200` |
| `libro_puntos` | `creado_en` | `jugador_id` | `origen` (`ias`/`humanos`), `nivel`, `sentados`, `mesa_id`, `mano` — solo **manos ganadas** | `rnk1a:112-140` |
| `puntos_totales` | `actualizado_en` | `jugador_id` | totales, sin historia | `rnk1a:185-192` |
| `salas` | `creada_en`, `expira_en`, `iniciada_en` | `anfitrion_id` | `tipo`, `jugadores`, `apuesta`, `estado`, `entrada`, `ritmo` | `sal_a:79-108` · `mot1_esquema:39-43` |
| `sala_jugadores` | `sentado_en` | `jugador_id` | `asiento` — **se borra al levantarse** en espera | `sal_a:147-154`, borrado `:654` |
| `partidas` | `creada_en`, `actualizada_en`, `terminada_en` | (por `sala_id`) | `estado` jsonb (sobrescrito en cada jugada) | `mot1_esquema:61-70` |
| `partida_asientos` | — (las de su partida) | `uid` (nulo si la cuenta se borra) | `asiento`, `entrada` (suma recargas), `liberado`, `cobrado`, **`manos`** | `mot1_dinero:299-313` · `sub8:33-34` |
| `partida_vistas` | — | `uid` | vista actual, sobrescrita | `mot1_esquema:75-83` |
| `consultas` («Mano actual») | `actualizada_en` (solo la última) | `jugador_id` | `gratis_usadas` 0–20, `ultima_mesa/mano` | `cfg1e:63-73` |
| `inventario` | `adquirido_en` | `jugador_id` (FK a `auth.users`) | `tipo`, `articulo`, `tono`, `en_uso` | `tie1a:50-60` |
| `constancia` | `actualizada_en`, `ultimo_dia` (día de Chicago) | `jugador_id` | `racha` — **solo el último día**, se sobrescribe | `eco1d:87-94`, `:204-206` |
| `boletos_video` | `emitido_en`, `vence_en`, `cobrado_en`, `anulado_en` | `jugador_id` | — | `eco1g:119-128` |
| `bonos_bienvenida` | `otorgado_en` | — (hash del correo, a propósito) | — | `eco1a_libro:235-238` |
| `intentos_codigo`, `intentos_dinero` | `intentado_en`, `en` | `jugador_id` | `funcion` — **se purgan al pasar**: no son historia | `sal_a:184-187` · `eco1a_libro:249-253`, purga `:379` |
| `interruptor_cambios`, `valvula_cambios` | `en` | — | rastro de administración | `mot1_dinero:1099-1106` · `eco1d:260` |

### A.2 · Las once preguntas

| Pregunta | ¿Se contesta hoy? | Con qué tabla y columnas | Qué falta |
|---|---|---|---|
| Cuentas nuevas por día | **Sí** | `profiles.created_at` (con nombre); `auth.users.created_at` (con código verificado; la resta es el embudo del Bautizo) | Nada |
| Activos por día (jugó o entró) | **Jugó: sí. Entró: no** | Jugó: `mesas_ia.abierta_en` con `mano_informada ≥ 1` ∪ `partida_asientos.manos ≥ 1` por `partidas.creada_en`. Entró: `marcar_ingreso` se llama una vez por día de Chicago al arrancar (`App.jsx:594-604`, `eco1d:177-206`), pero `constancia` guarda solo el último día | Un **disparador sobre `constancia`** que deje una fila `ingreso` por día (§B). Sin cliente nuevo |
| Manos contra las IAS (total y por activo) | **Sí, por mesa** | `Σ mesas_ia.mano_informada`, fechada por `abierta_en` (una mesa que cruza la medianoche cuenta el día que abrió). `record_manos.jugadas` da el total sin fecha | Nada. La mano depende del aviso del teléfono (`informar_pila`): sin red, se subcuenta |
| Manos contra humanos (total y promedio) | **Sí** | Por asiento: `partida_asientos.manos`; por partida: `max(manos)` de la sala (o `estado→motor→handCount` de `partidas`) | Nada |
| Retención D1 / D7 / D30 | **Parcial** | Cohorte por `profiles.created_at`; vuelta = jugó (fila anterior) | «Volvió sin jugar» necesita la fila `ingreso`. Las cohortes anteriores al despliegue solo tendrán «jugó» |
| Tiempo medio de sesión | **No** | — | El latido (§B) |
| Tapetes comprados | **Sí** | `inventario` (`articulo`, `tono`, `adquirido_en`) + `movimientos` `tipo = 'compra'` (el monto) | Nada |
| «Mano actual» antes y después de las 20 gratis | **Sí, salvo la fecha de cada gratis** | Gratis: `consultas.gratis_usadas` (distribución, cuántos llegan a 20). De pago: `movimientos` `tipo = 'consulta'`, con `ref_tipo` mesa IA o `'sala'` (`sub8:86`, `:103`, `:132`) | La fecha de cada consulta gratis no existe. Para la ola 0 basta la distribución; si Victor quiere la curva por día, es un evento más dentro de `consultar_mano` |
| Partidas entre personas por tamaño de mesa | **Sí** | `partidas` ⋈ `salas` (`jugadores`, `apuesta`, `entrada`, `ritmo`, `tipo`) y `count(partida_asientos)` | Nada |
| …con sus reconexiones y recargas | **Recargas: sí. Reconexiones: no** | Recargas: `movimientos` `tipo = 'recarga_pvp'`, `ref_id` = sala (`sub8:221-243`) | Reconexiones: nadie las anota. La «gracia de reconexión» no existe (Contrato §6 «Ausencia», `:462`). Evento de cliente (§B) |
| Pausa de anuncio: cuántos omiten y a qué segundo | **No** | `enAnuncio` vive en `partidas.estado` y se sobrescribe en cada jugada | Eventos del árbitro (§B) |

**«Activo», propuesta:** dos cifras, las dos de lo que ya se escribe más una fila sin cliente:
- **Activo (entró):** tiene fila `ingreso` ese día de Chicago (la marca `marcar_ingreso`, que ya corre al arrancar con cuenta, perfil y billetera).
- **Jugador activo (jugó):** cerró al menos una mano ese día, contra las IAS o contra personas.

«Abrió la app sin jugar» **se puede contar sin `sesion_inicio`**: con el disparador sobre `constancia`. Lo que no se ve sin latido es cuántas veces al día entró ni cuánto se quedó.

---

## B · Los eventos que faltan de verdad

### B.1 · Los nueve nombres de la Ruta

| Evento | Veredicto | Por qué |
|---|---|---|
| `registro` | **Sobra** | `profiles.created_at` + `auth.users.created_at` |
| `primera_mano` | **Sobra** | `min(mesas_ia.abierta_en)` con `mano_informada ≥ 1`, ∪ `min(partidas.creada_en)` con `manos ≥ 1` |
| `mano_jugada` | **Sobra** | `mesas_ia.mano_informada` + `partida_asientos.manos`. Una fila por mano duplicaría lo que ya está, a ~100× el volumen |
| `compra` | **Sobra** | `movimientos` `'compra'` + `inventario` |
| `sesion_inicio` / `sesion_fin` | **Hacen falta, como latido** (B.4) | Ninguna tabla anota duración |
| `anuncio_inicio` / `anuncio_omitido` / `anuncio_vuelto` | **Hacen falta, del árbitro** (B.2) | El estado se sobrescribe |
| *(nuevo)* `ingreso` | **Hace falta, por disparador** | La historia que `constancia` tira |
| *(nuevo)* `pvp_reconexion` | **Hace falta, del cliente** | Nadie la ve más que el teléfono |

### B.2 · La pausa de anuncio: la escribe el árbitro

**Dónde está cada momento:**
- **Se abre:** `trasManoSiguiente` (`src/arbitro/partida.js:322-340`), cuando vence `mano_siguiente` y `llevaAnuncio(handCount)` (`reloj.js:60`). Marca `enAnuncio` a quien `veAnuncio` (`:318`) y pone el vencimiento de 30 s (`:336`, `esperas.js:74`).
- **Vuelve uno:** `volverAnuncio` (`:499-504`) quita su `enAnuncio`; si no queda nadie, `seguirPausa` (`:376-379`) cierra.
- **Lo vence el tope:** `alVencer` → `CLASES.PAUSA_ANUNCIO` → `cerrarPausa` (`:614-615`, `:342-345`), que borra el `enAnuncio` de todos.
- **Se cierra porque la mesa se queda sin rivales:** `seguirPausa` con `cuantosSiguen ≤ 1` (`:378`).
- **El cliente:** `AnuncioSimulado` manda `volver_anuncio` **solo** al pulsar «Omitir» (`AnuncioPvP.jsx:17-21`). No hay red de anuncios: «volvió al terminar el anuncio» **no existe hoy**. Lo que sí se distingue: pulsó Omitir en el segundo *s* · lo devolvió el tope de 30 s · lo devolvió la mesa (los demás se fueron).

**Por qué el árbitro y no el cliente:** el árbitro tiene el reloj (`ahora`) y la hora de apertura (`vencimiento.en − 30 000`), y es el único que ve el caso que más importa, **el que no vuelve**: un teléfono muerto no informa.

**Cómo:** con efectos, el mismo camino que el libro de puntos y `manos` (`aplicar_efectos`, `sub8:151-260`, llamado desde `guardar_jugada`, `nucleo.js:232-239`). Tres efectos nuevos, sin dinero:
- `anuncio_inicio { mano, asientos }` al abrir → una fila por asiento;
- `anuncio_omitido { asiento, mano, ms }` en `volverAnuncio`;
- `anuncio_vuelto { asiento, mano, ms, como: 'tope' | 'mesa' }` en `cerrarPausa`/`seguirPausa` por quien seguía en anuncio.

`anuncio_vuelto` con «vio el anuncio entero» queda para cuando exista una red de anuncios: entonces `volver_anuncio` llevará un campo `visto` (otro Contrato).

**Orden obligatorio:** `aplicar_efectos` rechaza un `tipo` desconocido (`sub8:248-249`, `else raise 'estado_incoherente'`), así que va **primero la migración, después el deploy**. El árbitro de hoy es compatible con el SQL nuevo. Ojo: con efectos no vacíos corre `mesa_cuadra` (`sub8:257`); con efectos sin dinero cuadra igual, pero es una lectura más por `volver_anuncio`.

**Contrato:** sí es **v1.6**. Cambian los efectos de `volver_anuncio` (§2, `:159-166`), la «Publicidad» del §6 (`:472-486`) y la tabla de efectos del §7. Pide **deploy de `partida`**. El precedente es la v1.5 (los puntos y `manos` en `aplicar_efectos`).

### B.3 · `ingreso` y `pvp_reconexion`

- **`ingreso`:** disparador `AFTER INSERT OR UPDATE OF ultimo_dia` sobre `constancia` (`eco1d:87-94`; lo mueve `marcar_ingreso`, `:195-206`). Una fila por cuenta y día de Chicago, `datos = { racha }`. Sin cliente ni deploy.
- **`pvp_reconexion`:** dos sitios del cliente, los dos fuera del grafo de la mesa contra las IAS (§G):
  - `via: 'arranque'`: el arranque de `App.jsx:624` recibe de `mi_sala` una partida viva, es decir, recargó o reabrió en mitad de la partida. No sirve un disparador en `mi_sala`: también la llama `SalaEspera.jsx:212` en el paso a la partida, y daría falsos positivos.
  - `via: 'canal'`: en `partidaCliente.js:304`, `SUBSCRIBED` después de haberlo perdido.

  Se escriben con la RPC genérica del cliente (B.5).

### B.4 · La sesión en el teléfono: el latido

El candidato del rector sirve, con estos números:
- **RPC `latido_sesion(p_sesion uuid)`**, `security definer`: crea la fila al primer latido y sube `ultimo_latido` y `latidos` después. Si la fila es de otra cuenta, o el último latido tiene más de 10 min, ignora la llamada y el cliente abre otra sesión. Ignora dos latidos a menos de 20 s.
- **N = 60 s.** Son 60 peticiones por jugador y hora visible, con una precisión de ±60 s. Con 500 activos y unos 40 min diarios, son unos 20 000 latidos al día. PostgREST no cobra por petición, y la carga es un `upsert` por llave primaria. Con N = 120 s se ahorra la mitad y se pierde precisión; no compensa.
- **Se para con la app oculta** (`visibilitychange`, el mismo patrón que `App.jsx:594-604` y `partidaCliente.js:352`). Al volver: si estuvo menos de 5 min oculta, sigue la misma sesión; si estuvo más, `sesion_id` nuevo (`crypto.randomUUID`). La recarga de la página abre sesión nueva, con el id en memoria y sin clave nueva de almacén.
- **Duración** = `ultimo_latido − inicio`. No hay `sesion_fin` ni `sendBeacon`.
- **Apagado con el bypass y con la simulación,** como `crearPerfil` (`useAuth.js:361`): así ninguna vara de 5173 ve una llamada nueva.
- **Tabla propia `sesiones`** (`id` del cliente, `jugador_id`, `inicio`, `ultimo_latido`, `latidos`), separada de `eventos`: el latido **actualiza** filas y `eventos` es de solo inserción.

**Algo más barato:** no lo hay que sea fiel. Colgarse de llamadas que ya existen (`marcar_ingreso`, el canal de PvP) no cubre al que mira el lobby o juega contra las IAS sin red.

### B.5 · La forma: una tabla `eventos`

**Recomiendo una sola tabla.** Las consultas son por `tipo` y fecha, y GEN-1 llega sin migración de tabla.
- **Columnas:** `id bigint identity` · `jugador_id uuid null` → `profiles(id) on delete cascade` · `tipo text` · `creado_en timestamptz default now()` · `datos jsonb default '{}'`.
  - `jugador_id` **nulo permitido**: un `inv_*` puede hablar de alguien que aún no tiene cuenta.
  - **cascade** por INV-71: borrar la cuenta lo borra todo, salvo la huella del correo.
- **`tipo` por formato, no por lista:** `check (tipo ~ '^[a-z][a-z0-9_]{2,39}$')` y `pg_column_size(datos) <= 2048`. Con eso, un `inv_*` entra sin tocar la tabla. Lo que GEN-1 sí tendrá que traer es **su función escritora**, que irá en su migración de todos modos.
- **Solo inserción,** copia de `movimientos_inmutable` (`eco1a_libro`, §3; `pg_trigger_depth() >= 2` deja pasar la cascada).
- **RLS activo, cero políticas, `revoke all` a `anon`/`authenticated`.** Escriben:
  - el árbitro, por `aplicar_efectos` (`security definer`, ya existe);
  - el disparador de `constancia`;
  - el cliente, solo por `registrar_evento(p_tipo, p_datos)` (`security definer`), con **lista blanca** de los tipos de cliente (hoy, `pvp_reconexion`) y un tope por minuto que cuenta sus propias filas recientes.

  Los `anuncio_*` no van en esa lista: un cliente no puede fingirlos.
- **Índices:** `(tipo, creado_en)` para las consultas y `(jugador_id, creado_en)` para la retención y el tope.

**Volumen:**

| Origen | 50 activos/día | 500 activos/día |
|---|---|---|
| `ingreso` (1 por activo y día) | ~1 500/mes | ~15 000/mes |
| `anuncio_*` (~12 por partida PvP de 20 manos y 3 asientos; ~20 partidas al día con 50 activos) | ~7 000/mes | ~70 000/mes |
| `pvp_reconexion` | cientos | pocos miles |
| `sesiones` (otra tabla, ~2 por activo y día) | ~3 000/mes | ~30 000/mes |
| **Total** | **~12 000/mes** | **~120 000/mes (~25–30 MB/mes con índices)** |

**Purga:** no hace falta para la ola 0. Con 500 activos sostenidos, un año pesaría unos 300 MB; si el plan es el gratuito (500 MB), habría que decidir antes del verano. Va al §P.

---

## C · `origen` con país

**Lo que tiene `profiles`:** `id`, `username`, `created_at`, `updated_at` (`0001:29-34`), y desde CFG-1 1b `pais`, `estado` y `nombre_cambiado_en` (`cfg1b_perfil:36-39`). El país **elegido** ya existe. Es opcional y nulo hasta que el jugador lo pone en su perfil.

**Permisos:**
- **lectura:** solo `id, username, pais, estado` (`arn4c_profiles_columnas:13-14`, INV-83), así que las columnas nuevas quedan privadas sin hacer nada;
- **actualización:** solo `username, pais, estado` (`cfg1b_perfil:215-216`);
- **alta:** la política `profiles_insert_propio` (`0001:190-193`), sin restricción de columnas.

**Cómo nace la fila:** no hay disparador sobre `auth.users`. La inserta el cliente al bautizarse: `perfilApi.crear` → `insert({ id, username })` (`perfilApi.js:48`), llamado desde `useAuth.crearPerfil` (`useAuth.js:368`). **Ahí se escribe `origen`, en el mismo `insert`.** Como el `grant update` no incluye las columnas nuevas, quedan escritas **una vez y no se tocan más**, por permisos y sin código nuevo.

**Columnas propuestas:**
- `origen text`, con formato cerrado;
- `origen_datos jsonb`: `utm_source/medium/campaign/content`, `sala`, `zona_horaria`, `idioma`, `llegada`.

Las cuentas de antes quedan con `origen` nulo, que las consultas leen como «previo». **No conviene rellenarlas con un `update`:** pasaría por el portero y el freno de `profiles` (`0001:166`, `cfg1b_perfil:164-165`).

**Valores de `origen`:**
- `directo`;
- `utm:<campaña>`;
- `invitacion` (el código va en `origen_datos.sala`: es efímero y no sirve de etiqueta);
- `tienda` (definido, sin uso todavía);
- nulo = previo a MED-1a.

**De dónde sale, y cómo sobrevive hasta el Bautizo:**
- Hoy el único lector de la URL es `recogerDeLaUrl()` (`salaPendiente.js:152`). Lo llama `App.jsx:234-236` y **borra `?sala=` de la barra**. Ese archivo está en el grafo de la mesa (§G): no se toca.
- **Un módulo nuevo, `src/lib/origen.js`,** llamado desde `main.jsx` antes de montar React, es decir, antes de que `App` limpie la barra. Lee `utm_*` y `sala` de `location.search` y lo guarda en `localStorage` con la clave **`ajilei.origen`**:
  - **primer toque:** no se sobrescribe mientras no caduque;
  - **caducidad de 30 días**, con `llegada`;
  - la clave entra en el censo de INV-12 (`testClavesAlmacen.test.js`).
- **No hace falta borrar los `utm_*` de la barra.** Así, «Abrir en Chrome» desde el navegador incrustado los lleva consigo.
- El registro es con **código** (`verifyOtp`, `useAuth.js:348`), en la misma pestaña: el almacén sobrevive.
- `perfilApi.crear` añade `origen` y `origen_datos` al `insert`. Sin datos guardados, va `directo`.

**El país automático:**
- **No hay Worker con código ni Pages Function:** no hay `functions/` ni `_worker.js`, y `wrangler.jsonc` no tiene `main`. `request.cf.country` exigiría añadir un `main` con `run_worker_first: ["/api/*"]` y una ruta `/api/pais`. Es un despliegue de Cloudflare más, en otra herramienta, y una petición más al arrancar.
- **Las cabeceras de una Edge Function de Supabase:** no se pueden comprobar sin desplegar una sonda (prohibido aquí). Además, `partida` solo la llama quien juega PvP: llega tarde para marcar el registro.
- **Recomiendo la zona horaria del aparato:** `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - Se guarda en bruto en `origen_datos.zona_horaria` y el país se deriva en la consulta.
  - **`America/Caracas` es la única zona de Venezuela y no la usa ningún otro país.** La cuenta queda marcada sin que el jugador haga nada, sin red, sin despliegue y sin coste en `1.8b`.
  - **Es mejor que la IP para Venezuela:** el VPN es frecuente allí y daría «US» o «CO», mientras que la zona sigue al aparato.
- **El Worker, solo si un día hace falta el país de quien no tiene zona propia.**
- **Se guardan los dos:** el elegido (`pais`) y el automático (la zona).

---

## D · Las consultas guardadas

Con A + B, las once quedan contestables:

| # | Consulta | Fuente | ¿Necesita definición de Victor? |
|---|---|---|---|
| 1 | Cuentas nuevas por día (y embudo código → nombre) | `auth.users`, `profiles` | El día: ¿de Chicago (como la constancia) o de Caracas? (§P-2) |
| 2 | Activos por día (entró / jugó) | `eventos` `ingreso` ∪ manos | Sí: qué es «activo» (§P-1) |
| 3 | Manos contra las IAS, total y por activo | `mesas_ia` | No |
| 4 | Manos contra humanos, total y promedio por partida | `partida_asientos`, `partidas` | No |
| 5 | Retención D1/D7/D30 | `profiles` + #2 | Sí: desde el registro o desde la primera mano; «volver» = entró o jugó (§P-2) |
| 6 | Tiempo medio de sesión | `sesiones` | Sí: excluir las de menos de 30 s y el corte de 5 min (§P-4) |
| 7 | Tapetes comprados | `inventario`, `movimientos` | No |
| 8 | «Mano actual» antes y después de las 20 | `consultas`, `movimientos` `'consulta'` | No (sin curva diaria de gratis, §A) |
| 9 | Partidas PvP por tamaño, apuesta, entrada y ritmo | `partidas`, `salas`, `partida_asientos` | No |
| 10 | …con reconexiones y recargas | `eventos` `pvp_reconexion`, `movimientos` `'recarga_pvp'` | Sí: qué cuenta como reconexión (§P-5) |
| 11 | Pausa de anuncio: cuántos omiten y a qué segundo, por pausa (tras la 7, la 15…) | `eventos` `anuncio_*` | No |
| + | Origen y país de las cuentas nuevas | `profiles.origen`, `origen_datos`, `pais` | No |

**Convención del SQL Editor:** hasta hoy, una consulta por campaña llamada «<campaña> · verificación» («ECO-1c · verificación», `Invariantes:268`; «SAL-B2 · verificación», `sal_b2:258`). Esas se usan una vez. **Propongo «MED · <nn> · <pregunta>»** (p. ej. «MED · 05 · Retención D1/D7/D30»): el prefijo las separa de las de verificación y el número fija el orden. El texto de cada una vive también en el repo (`supabase/consultas/med_*.sql`), para que no dependa del panel.

---

## E · Cloudflare Web Analytics

- **`index.html`:** ningún beacon ni script de terceros en `<head>`. Solo metas, `og:` y el módulo de Vite.
- **`public/_headers`:** solo `Cache-Control` para `/assets/*` y `/og-image*`. **No hay CSP:** nada lo bloquea.
- **`1.8b` pesa solo `dist/`** (`scripts/arnes/pesoCore.mjs`): toma las rutas de los `<script src>` y `<link>` del HTML (`:30-36`) y las lee de disco. Por eso:
  - **(a) Panel (inyección automática):** no toca `dist/`. `1.8b` no lo ve y el beacon va diferido, fuera del camino crítico. **Recomendado.**
  - **(b) `<script defer>` en `index.html`:** `pesoCore` tomaría la URL absoluta como ruta, y `leer()` daría **error de instrumento (código 2)**. Haría falta además enseñarle a saltar los orígenes externos. Solo si (a) no está disponible.
- **El matiz del Worker:** la casilla de Pages no aplica. Victor va a *Analytics & Logs → Web Analytics → Add a site → ajilei.io* y elige la configuración automática, que exige el dominio en Cloudflare con proxy. Después comprueba en «Ver código fuente» de ajilei.io que aparece `beacon.min.js`. Si el panel solo ofrece el fragmento manual, se va por (b) en la tanda 3, con el arreglo de `pesoCore`.
- **Qué da:** visitas, país y referente por **carga de página**, sin cookies y sin cuenta. No sustituye a `origen`: no se une a ningún jugador.

---

## F · Las herencias de la 9

### F-1 · La CLI de Supabase v3

- **Hoy:** `"supabase": "2.122.1"` exacto (`package.json:35`, `package-lock.json:28`).
- **Registro de npm:** `latest` = **3.1.0**; `v2.stable` = 2.122.1; `beta` = 3.2.0-beta.16; `next` = 4.0.0-next.25. Node local: v22.19.0; la 3.1.0 no declara `engines`.
- **Usos en el repo:** **ningún script la llama.** `scripts/`, `npm run guiones` (PGlite) y el arnés no tocan la CLI (`comun.mjs:327` y `nucleo.mjs:278` solo clasifican hosts). Menciones en texto:
  - `supabase/config.toml:22-26`: `link`, `login`, `db push`, `migration list`. Sigue siendo cierto en la v3.
  - `[functions.partida]` y `[functions.eliminar_cuenta]` con `verify_jwt = false` (`config.toml`): la v3 no los cambia.
  - Comentarios históricos «`npx supabase db push`» en 7 migraciones (`sal_a:7`, `sal_b1:7`, `sal_b2:9`, `eco1a:8`, `mot1_esquema:7`, `mot1_dinero:7`, `v13_recarga:9`, este con `--linked`). **No se editan:** son archivos aplicados.
  - `AJILEI_MOT-1_Contrato_v1.0.md:655`: `functions deploy --use-api` en la tabla histórica del §10. No se edita.
  - 41 informes en `docs/reportes/`: históricos, no se tocan.
  - Las fichas del rector viven fuera del repo: ahí es donde `--linked` pasa a `--remote`.
- **Lo que la v3 cambia para cada uso** (notas de la v3.0.0):
  - **`db push` sin destino va a la pila local.** Aquí no hay Docker, así que **`--remote` pasa a ser obligatorio**.
  - `--linked` y `--project-ref` siguen funcionando con aviso; no se combinan con `--remote=<valor>`.
  - Todo cambio en la nube **pide confirmación, con «No» por defecto**: Enter rechaza y una `y` por tubería no confirma. Sin terminal hace falta `--yes`; `SUPABASE_YES` en un `.env` no cuenta.
  - `functions deploy`: misma confirmación. `import_map.json` por función desaparece; `partida` no lo usa (importa `npm:`). Las notas no hablan de `--use-api` ni de `--no-verify-jwt`: siguen.
  - `migration new`: sin cambios.
- **El primer commit de MED-1a, exacto:**
  - `package.json` y `package-lock.json`: `supabase` 2.122.1 → **3.1.0**, exacto (`npm install -D supabase@3.1.0 --save-exact`).
  - `supabase/config.toml`: un párrafo en la cabecera, «v3: todo comando contra la nube lleva `--remote` y pide confirmación».
  - Ningún normativo dice `--linked` hoy: no hay más textos que cambiar.
- **La secuencia de Victor**, sin cambiar nada de la nube:
  1. `npx supabase --version` → `3.1.0`.
  2. `npx supabase db push --remote --dry-run` → debe decir que no hay migraciones pendientes (la última, `20261114120000`).
  3. Comprobar que no hay partidas vivas: `select count(*) from partidas where terminada_en is null and actualizada_en > now() - interval '10 minutes'` → 0.
  4. `npx supabase functions deploy partida --use-api --no-verify-jwt`, con confirmación «y».
  5. Humo: una mesa privada de 2 con dos ventanas, hasta la primera mano.
- **Riesgo del deploy «sin cambios»:** el código del árbitro es el mismo y el estado vive en Postgres, así que una partida viva no cambia de reglas. Hay dos riesgos:
  - **Peticiones en vuelo durante el cambio:** pueden fallar, y el cliente reintenta. Por eso se despliega con 0 partidas vivas.
  - **Un empaquetado distinto de la v3:** `nucleo.js:19-22` importa `../../../src/arbitro` y `src/engine`. Si falla al empaquetar, no reemplaza la versión viva. Si empaqueta pero rompe al ejecutar, se vuelve atrás con `npx supabase@2.122.1 functions deploy partida --use-api --no-verify-jwt`.

### F-2 · `saldo.5`

- **El rojo** (`varas-mwhrzfi8\saldo.log:204-227`): `despues.nota` = «Necesitas 3.000 HC para sentarte a 200», `chip500Apagado: true`, píldora 900, lecturas 2. **La única condición que falla es `nota.includes('2.500')`.**
- **La causa:**
  - La vara pulsa `'[data-accion="apuesta"]:nth-of-type(3)'` (`diagDSK.mjs:15041`) y lee el mismo selector (`:15052`).
  - Desde `bf10cfe` (MES-PvP 7b-a), `APUESTAS_PVP = [50, 100, 200, 500, …]` (`src/config/salas.js:43`): el tercero es el **200**.
  - **Hay un segundo envejecimiento:** el «2.500» era la regla de 5×. Hoy la Corta es 15× (`salas.js:61-66`), así que el 500 pide **7.500**. Con `SALDO_SERVIDO = 3700` (`diagDSK.mjs:14759`), el chip de 500 **ya nace apagado** y no se podría pulsar.

  El producto dice bien lo que tiene que decir.
- **El componente:** `FilaChips.jsx:50-66` pinta `data-accion` y `aria-pressed`, pero ningún `data-*` con el valor. Añadirlo tocaría un archivo que monta `RetarIAS` (§G).
- **Recomendación, sin tocar el producto:** la vara elige por valor dentro de `[data-accion="apuesta"]`, filtrando por el texto exacto `montoTexto(200)` (`src/config/tapetes.js:107`). Además deriva la nota esperada de `saldoMinimo(200)` (`salas.js:66`) importada de `src/config`, como ya hace con `niveles.js` y `menuEntradas.js` (`diagDSK.mjs:338`, `:374`). El chip apagado se comprueba con el mismo localizador. Así no vuelve a envejecer con la lista ni con la regla. **Solo cambia `scripts/diagDSK.mjs`.**

### F-3 · `h1.5` y `z1` en 1920×937

- **`h1.5`:**
  - **Rojo** (`varas-mwhrzfi8\h1.5.log`): T5 1920×937 con `frames=194` (las otras, ~270). `roleCycleOk: false` porque `sawNoRole: false`: la mano acabó sin un momento sin rol. `headsStable: false`, con «IA 4.cardsY» a 3,41 px en `h1-post`.
  - **Verde al repetir** (`varas-mwi7y7cp\h1.5.log`): `frames=271`, `sawNoRole: true`, `headsStable: true`.

  Es la **mano** la que cambia, no la geometría.
- **`z1`:**
  - **Rojo:** T5 1920×937, «cartas=0 · sin cerrar: h0 tope-con-ia-pensando · SIN COBERTURA» (`z1.log:5`), después de `INTENTOS_COBERTURA = 3` (`juego.mjs:115`). `tope-con-ia-pensando` es la causa que da `causaSinCerrar` (`juego.mjs:109`).
  - **Verde al repetir:** las 16 celdas, en 12 min 49 s (tope de 15).
- **El azar sin sembrar:** `runH1` (`diagDSK.mjs:5033`) y `runZ1` (`:6127`) llaman a `gotoMesa` sin `sembrarAzar`. Solo `apu` (`:1952`, `:3019`), `u3` (`:9403-9410`) y `vuelo` (`:12443-12454`) siembran. Quedan libres el barajado (`deck.js:56`) y los seis dados de la IA, que incluyen el *jitter* del tiempo de pensar (`aiPlayer.js:644`; Protegidos §4, `:274-275`). Es lo mismo que daba el problema en `vuelo` antes de la 9.
- **Recomendación para las dos: sembrar, no subir el tope.**
  - En `h1` no hay tope que subir: el rojo es de **cobertura** (la mano no pasó por el estado medido).
  - En `z1` el tope que salta es el de la mano (`jugarMano`, `max: 200` × 240 ms, `:6148`), no el de la vara. Subirlo alarga la corrida (ya está en 12:49 de 15) sin quitar el azar.
  - Con la convención de INV-82: `H1_SEMILLA` y `Z1_SEMILLA` (una por vara, con mapa por celda solo si una celda no da su caso), `sembrarAzar` antes de `gotoMesa`, `--semilla=N` admite `h1` y `z1` (`:420-429`), y una semilla que deja de dar el caso sale `sinCobertura` con `AVISO_SEMILLA`.
  - Cambian `scripts/diagDSK.mjs` y, en documentos, INV-82 e Invariantes §3. **Ninguno lo monta la mesa:** sembrar `Math.random` desde fuera no abre ningún protegido (`siembra.mjs`, cabecera).
  - **Coste:** elegir semilla exige correr la vara. Cada candidata se prueba en la celda 1920×937 (unos 3–4 min) y la elegida se confirma con la vara entera (~10 min `h1.5`, ~13 min `z1`).

### F-4 · `msg`

- **INV-22 hoy** (`Invariantes:62`): la excepción declarada de la 5a. Un rojo **solo** por «barrido … 0 medidas» no es regresión. Se retira cuando el barrido mida al menos una caja en **cada** corrida.
- **Línea base del 15:** **verde**, «barrido «Heptacoins» · OK · 4 medidas · 1 cajas distintas en 1 vistas» (`msg.log:17`, `:35`), código 0.
- **Control de la 8** (`2571c42`): código 1, solo por INV-22 (Cierre MES-PvP §3.4).
- **Sigue intermitente.** Un verde no cumple la condición de retiro («en cada corrida»), y la corrida anterior fue roja por lo mismo. **La excepción sigue haciendo falta.** No se toca en MED-1a.

---

## G · Grafo

**Criterio** (el de la Sub8 Fase 0, `:252`): los imports **estáticos** desde `GameTable.jsx`, `RetarIAS.jsx` y `PantallaChips.jsx`.
- Desde `GameTable` salen 88 archivos.
- Si se siguen los `import()` de `src/lib/trozos.js` (los trozos perezosos de `HojaConfiguracion`), el grafo arrastra casi toda la app (`useAuth`, `perfilApi`, `partidaCliente`, `src/arbitro`…). Ese camino no se ha contado nunca y aquí tampoco.
- Comprobado con un script de grafo en el scratchpad.

| Archivo que cambiaría | Tanda | ¿Lo monta la mesa contra las IAS? |
|---|---|---|
| `package.json`, `package-lock.json`, `supabase/config.toml` | 0 | No |
| `scripts/diagDSK.mjs` (`saldo.5`, semillas de `h1`/`z1`) | 0 | No (arnés) |
| `supabase/migrations/<nueva>_med1a.sql`, `supabase/pruebas/med1a_verificacion.sql` | 1 | No |
| `src/arbitro/partida.js` (+ pruebas) | 1 | **No** (solo `partidaCliente.js`, `RecargaPvP.jsx` y `dev/partidaImitada.js` importan el árbitro) |
| `src/dev/partidaImitada.js`, si hay que enseñarle los efectos nuevos | 1 | No |
| `src/lib/origen.js` (nuevo), `src/main.jsx` | 2 | No |
| `src/lib/perfilApi.js`, `src/hooks/useAuth.js` | 2 | No (solo por `trozos.js`) |
| `src/hooks/useLatidoSesion.js` (nuevo), `src/App.jsx` | 2 | No |
| `src/lib/partidaCliente.js` | 2 | No (solo por `trozos.js`) |
| `scripts/testClavesAlmacen.test.js` (INV-12) | 2 | No |
| `scripts/arnes/pesoCore.mjs`, solo si E va por (b) | 3 | No |
| **No tocar:** `src/config/salaPendiente.js` | — | **Sí** (`GameTable → salaEsperaCore → salaPendiente`) |
| **No tocar:** `src/components/FilaChips.jsx` | — | **Sí** (`RetarIAS → FilaChips`) |

**MED-1a no lleva control de las IAS:** basta el perfil `commit`, más `pvp.mesa` y `pvp.lm` en las tandas 1 y 2, que tocan el árbitro y el cliente PvP.

**Una salvedad honesta:** el latido corre en la raíz y, por tanto, **también mientras se juega contra las IAS**. Por la letra no paga control. Por construcción, apagado con el bypass y la simulación, ninguna vara de 5173 lo ve. Recomiendo comprobarlo en la tanda 2 con `aislamiento` (`supabaseAtendidas: 0` en `h1`/`mesaia`), no con el control entero.

---

## H · Corte, orden y estimación

| Tanda | Archivos | Migración | Deploy | Panel de Victor | Minutos de Claude Code |
|---|---|---|---|---|---|
| **0 · Instrumentos** | CLI 3.1.0 (`package.json`, lock, `config.toml`) · `saldo.5` por valor · semillas de `h1`/`z1` · INV-82 e Invariantes §3 · informe | No | `partida` sin cambios (Victor, F-1) | — | CLI 15 · `saldo.5` 25 · semillas 75–100 · documentos 15 → **≈ 2 h 10 – 2 h 35** |
| **1 · La nube** | Migración: `eventos` (inmutable, RLS, índices), `sesiones`, `latido_sesion`, `registrar_evento`, `profiles.origen`/`origen_datos`, disparador `ingreso` en `constancia`, `aplicar_efectos` con los tres `anuncio_*` · guion PGlite `med1a` (2 pasadas) · Grupos A y B · `src/arbitro/partida.js` con los efectos y sus pruebas · `partidaImitada.js` · Contrato v1.6 | **Sí** | **`partida`** (después de la migración) | `db push --remote` + Grupos A/B en el SQL Editor | migración y guion 120–150 · árbitro y pruebas 60–90 · Contrato 20 · varas 20 → **≈ 3 h 40 – 4 h 40** |
| **2 · El cliente** | `origen.js` + `main.jsx` + `perfilApi`/`useAuth` · `useLatidoSesion` + `App.jsx` · `pvp_reconexion` (`App.jsx`, `partidaCliente.js`) · INV-12 · `1.8b` (estimado +0,6–1,0 KiB → ~179 de meta 185) | No | No (sale con el push del cliente) | Prueba con un enlace `?utm_campaign=` en un teléfono | origen 50 · latido 60 · reconexión 30 · pruebas y varas 40 → **≈ 3 h** |
| **3 · Consultas y cierre** | Las 12 «MED · nn» (texto en `supabase/consultas/`) · Cloudflare (instrucción; `pesoCore` solo si va por (b)) · Invariantes (INV nueva: `eventos` de solo inserción y `origen` escrito una vez) · informe de cierre | No | No | Guardar las consultas · encender Web Analytics | consultas 60–75 · cierre 30 → **≈ 1 h 30 – 1 h 45** |
| **Total** | | | | | **≈ 10 – 12 h** |

**Lo que confirmo y lo que corrijo del candidato del rector:**
- **Confirmo** el orden y el reparto.
- **Corrijo** tres cosas:
  1. Los `anuncio_*` **sí** van en el árbitro, con v1.6 y deploy después de la migración (B.2).
  2. La tanda 1 trae el disparador `ingreso`, que no estaba en la lista y es lo que más barato contesta «activos» y la retención.
  3. `origen` se escribe desde el cliente, en el `insert` del Bautizo, no por RPC.

**Si no cabe en los 3 días, se corta en este orden** (la ola 0 sigue con datos):
1. `pvp_reconexion` vía canal (queda la de arranque).
2. Las semillas de `h1`/`z1`: instrumento, se pueden heredar a LEC-1 como intermitentes conocidas.
3. El latido: sin él se pierde el tiempo de sesión, pero `ingreso` sigue dando activos y retención.

**No se corta:** `origen` con la zona horaria (Venezuela), `ingreso`, los `anuncio_*` y las consultas.

---

## §P · Preguntas para Victor

1. **«Activo»:** ¿dos cifras, «entró» (fila `ingreso`) y «jugó» (≥ 1 mano cerrada)? *Recomendación: sí, las dos.*
2. **Retención y día:** ¿desde el registro (`profiles.created_at`), con «volver» = entró, y con el día de Chicago, como la constancia? *Recomendación: sí; la primera mano como segunda cohorte si hace falta.*
3. **País:** ¿se guardan los dos, el elegido (`pais`) y el automático (zona horaria del aparato), sin Worker de Cloudflare por ahora? *Recomendación: sí.*
4. **Sesión:** ¿corte a los 5 min oculta, y fuera de la media las de menos de 30 s? *Recomendación: sí.*
5. **Reconexión:** ¿cuentan las dos, la recarga o reapertura en mitad de la partida (`arranque`) y el canal caído (`canal`), por separado? *Recomendación: sí; si hay que cortar, se queda la de arranque.*
6. **Cuánto se guardan los eventos:** ¿sin purga hasta revisar en junio de 2027, o 13 meses desde ya? *Recomendación: sin purga hasta junio, y antes si la base pasa de 300 MB.*
