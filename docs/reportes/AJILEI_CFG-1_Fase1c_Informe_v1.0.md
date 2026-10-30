# AJILEI · CFG-1 · Fase 1c · Eliminar cuenta · Informe v1.0

**Escrito para:** el rector y Victor
**Ficha:** `AJILEI_CFG-1_Fase1c_v1.0.md` · **Base:** `main` en `fff91e3` · **Fecha:** 2026-10-29
**Estado:** **1c validada** (2026-10-29). Victor hizo el guion 14/14, el despliegue, el 401 sin token y el guion B de principio a fin con la cuenta desechable `borrame1c` (§6 y §7). El rector dio el visto bueno, aceptó D-1…D-8 (§4) y el Ajuste A. Siguen los commits (ficha `AJILEI_CFG-1_Commits1c_v1.0.md`).

---

## Resumen

- **La fila «Eliminar cuenta»** de la hoja ⚙ abre una ventana propia (`src/components/EliminarCuenta.jsx`), por portal en `<body>`, encima de la hoja, en las siete pantallas que montan la hoja. Se confirma escribiendo «ELIMINAR» (minúsculas valen; espacios no).
- **El cliente** (`src/lib/cuentaApi.js`) llama a la Edge Function `eliminar_cuenta` y traduce a cuatro motivos cerrados. Al `ok` y al 401, el aparato pierde todas sus claves `ajilei.*` y `sessionStorage` (`src/lib/limpiarAparato.js`), se cierra la sesión y aparece la Portada. Con mesa o sala abierta, el aviso «Cierra o abandona tu mesa primero».
- **O-2 de la 1a, cerrado:** `App.cerrarSesion` deja `screen` en el lobby después del `signOut`. Al volver a entrar se aterriza en el lobby.
- **El servidor:** una migración con una sola función, `partida_abierta_de(uuid)` (sólo `service_role`; barre las salas y mira mesa IA y salas esperando o activa), y la Edge Function, que saca el uid del token, consulta la guarda y llama a `auth.admin.deleteUser`. La cascada se lleva todo salvo `bonos_bienvenida`.
- **Ajuste A (STOP-B1):** el 401 sale como el ok; el tope de la llamada es de 20 s; la letra de la ventana escala como la de la hoja.

---

## 1. Línea base, arnés y huellas

| Qué | Resultado |
|---|---|
| `vite build` | código 0 |
| `vitest run` | 82 archivos, **1923** pruebas, todas verdes (1920 en STOP-B1, con las de `cuentaApi`, `limpiarAparato`, el banco y el diccionario; +3 de después: dos de `red` (el tope de 20 s) y la de INV-71 en `testInvariantes`) |
| `npm run lint` | **21** (20 errores y 1 aviso), la línea base. Ninguno en un archivo de la 1c: están en `CardImage.jsx`, `GameTable.jsx` y `SoundContext.jsx` |
| `npm run guiones` | VERDE · 11 migraciones · 5 guiones × 2 pasadas, todos PASA y sin rastro; el nuevo `cfg1c_verificacion.sql`, **14/14** |
| `diagDSK cfg --puerto=4192` | **verde**, 15/15 (las 10 de la 1a, las 4 nuevas y la consola), aislamiento verde, 1 min 21 s |
| Prueba negativa de `cfg.salir.reinicia` | Sin el `setScreen('lobby')`, roja: aterriza en Retar. La puerta muerde |
| Los seis protegidos | `git diff` vacío |
| `dist/` | Ni `?cfg=`, ni la marca del bypass, ni `fueraDelBypass`. Sí está `x-ajilei-tope-ms`: es del cliente de verdad (§4, D-6) |

**Las cuatro puertas nuevas de `cfg`** (`scripts/cfg/cfg.mjs`, sección «CFG-1 1c»). La función la contesta el banco imitado del contexto por una ruta propia:

| Puerta | Qué mide | Dónde |
|---|---|---|
| `cfg.eliminar.ventana` | Por portal en `<body>` y encima de la hoja (z 80, `elementFromPoint` en su centro); campo, botones y ✕ ≥ 44; cabe sin desplazarse y no cambia de tamaño entre estados; borrar apagado vacío, con «ELIMINA», « ELIMINAR» y «ELIMINAR »; encendido con «eliminar», «Eliminar» y «ELIMINAR»; cero oro (los cinco oros de `theme.css`, en color, fondo, bordes, contorno y sombra); `#root` inert; foco en el campo; sin uuid; `Escape` la cierra, la hoja sigue y el foco vuelve a la fila; ninguna llamada sin confirmar | las 5 celdas |
| `cfg.eliminar.mesa` | 409: el aviso exacto, la ventana cerrada, el lobby y la hoja siguen, la sesión intacta, una llamada y la cuenta sin borrar | 412×915 y 1366×768 |
| `cfg.eliminar.ok` | 200 (y 401 en el teléfono): de 5 claves `ajilei.*` (una inventada) a ninguna, `sessionStorage` vacío, sin sesión, Portada, `otra.cosa` se queda; la petición lleva el JWT de la sesión y no la cabecera del tope | 412×915 (200 y 401) y 1366×768 |
| `cfg.salir.reinicia` | Retar → ⚙ → Cerrar sesión → correo y código en la Portada → lobby (la ruta contesta `/auth/v1/verify` con la sesión de `contextoCap`) | 1366×768 |

---

## 2. La ventana, medida

Con `diagDSK cfg` y la sonda de la sesión (capturas en el scratchpad), tras el Ajuste A. Una sola medida por celda: la tarjeta no cambia entre apagado, listo, enviando y error.

| Celda | Tarjeta | Campo | Cancelar / Eliminar | Letra del botón = fila de la hoja | Error |
|---|---|---|---|---|---|
| 360×640 | 328 × 284,86 | 293,6 × 44 | 142,31 × 44, lado a lado | 12,24 px = 12,24 | 1 línea |
| 412×915 | 380 × 313,02 | 340,9 × 44 | 165,3 × 44 | 14,01 = 14,01 | 1 línea |
| 915×412 | 420 × 313,02 | 380,9 × 44 | 185,3 × 44 | 14,01 = 14,01 | 1 línea |
| 1366×768 | 528 × 422,86 | 472 × 48 | 228,5 × 48 | 20,4 = 20,4 | 1 línea |
| 1920×1080 | 528 × 422,86 | 472 × 48 | 228,5 × 48 | 20,4 = 20,4 | 1 línea |

**Las reglas** (`src/styles/eliminarCuenta.css`):
- La letra: `--u: clamp(3.2px, 1vmin, 6px)` en la tarjeta (el de la carcasa) y los factores de la hoja: título 3,6, botones 3,4, aviso 3,3, instrucción y error 3,1. El campo, `max(16px, u·3,4)`.
- El ancho: `min(100%, max(420px, u·88))`. Con 76 u (el ancho de la hoja) los botones de 1920 caían uno debajo de otro: «Eliminar mi cuenta» mide 8,9 em y con su relleno pide 10,5 em por columna.
- Los botones: `repeat(auto-fit, minmax(min(100%, 10.5em), 1fr))`; alto `max(44px, u·8)`.
- La ranura del error: una línea; dos con `@container (width < 23em)`. La frase mide 20,9 em de la letra de la tarjeta. En la 1c-i, con la letra fija, en 360 ocupaba dos líneas y la tarjeta crecía 19,6 px al fallar.
- `@container` mide la caja de **contenido** (378 en la tarjeta de 420): el primer corte en px de la 1c-i reservaba de más en escritorio y se corrigió.

---

## 3. Archivo por archivo

**Nuevos**
- `src/components/EliminarCuenta.jsx` · la ventana (portal, `inert`, foco, `Escape`, los estados, la palabra).
- `src/styles/eliminarCuenta.css` · su hoja (§2).
- `src/lib/cuentaApi.js` · `crearCuentaApi`, `traducirEliminar` y los cuatro motivos; el tope de 20 s.
- `src/lib/cuentaApi.test.js` · la traducción de cada respuesta del SDK (`FunctionsHttpError` con su `Response` en `context`, `FunctionsFetchError`, relevo) y la llamada.
- `src/lib/limpiarAparato.js` y `.test.js` · borra las `ajilei.*` recorriendo, vacía `sessionStorage`, nunca lanza.
- `supabase/migrations/20261030001500_cfg1c_eliminar_cuenta.sql` · `partida_abierta_de`.
- `supabase/pruebas/cfg1c_verificacion.sql` · el guion, 14 filas.
- `supabase/functions/eliminar_cuenta/index.ts` · la función (con seguimiento; la sonda de MOT-1 no se tocó).
- `docs/AJILEI_Configuracion_v1.1.md` · el normativo, con §11.
- Este informe.

**Cambiados**
- `src/App.jsx` · `cerrarSesion` async y `setScreen('lobby')` tras el `signOut` (O-2); `apiCuenta` (la del banco imitado o la real) y `eliminarCuenta` en el paquete `cuenta`; el 401 como el ok.
- `src/components/HojaConfiguracion.jsx` · la fila abre la ventana; `Escape` es de la ventana mientras está abierta; el foco vuelve a la fila; el aviso de mesa abierta dura 2,6 s.
- `src/hooks/useAuth.js` · la salida del bypass (D-1).
- `src/lib/red.js` y `red.test.js` · `CABECERA_TOPE` (D-6).
- `src/dev/bancoImitado.js` y su prueba · `eliminarCuenta()` con el contrato de la función.
- `src/dev/billeteraFalsa.js` · `simulacionCuenta()` y el mando `?cfg=` (D-3).
- `src/config/textos.es.js` y `textos.test.js` · 12 claves `lob.eliminar.*`; «Cerrar» repetido con `rnk.perfil.cerrar`, declarado.
- `scripts/testClavesAlmacen.test.js` · `limpiarAparato.js` entra en los accesores; `sessionStorage` también ahí (lo vacía, no escribe).
- `scripts/cfg/cfg.mjs` · las cuatro puertas. `scripts/diagDSK.mjs` · sólo la descripción del modo.
- `scripts/eco/guionesCore.mjs` y su prueba · el guion nuevo, vigente, 14 filas.
- `supabase/config.toml` · `[functions.eliminar_cuenta] verify_jwt = false`.
- `docs/AJILEI_Configuracion_v1.0.md` · marcado «Sustituido por v1.1».
- `docs/AJILEI_Invariantes_v1.0.md` · INV-71; INV-07, 68 y 69 a la v1.1; INV-12 (13 accesores); recuento; §4 y las filas de `diagDSK cfg` y del corredor.

---

## 4. Desviaciones

- **D-1 · Con el bypass, «Cerrar sesión» lleva a la Portada.** `useAuth` tenía el estado clavado en COMPLETO y no había Portada en 5173: los pasos A-2 y A-3 del guion no se podían ver. Ahora, sólo en desarrollo, cerrar sesión pone `SIN_SESION` y el formulario vuelve a entrar con cualquier correo y código, sin red. Fuera de desarrollo `AUTH_BYPASS` es `false` y no existe.
- **D-2 · La clave es `lob.eliminar.mesa_abierta`**, no `mesaAbierta`: el diccionario no admite mayúsculas en las claves (`textos.test.js`).
- **D-3 · Dos mandos más:** `?cfg=borrar-error` (500) y `?cfg=borrar-401`. La respuesta del bypass tarda 900 ms para que se vea «enviando».
- **D-4 · Las puertas del arnés de §3.3 se escribieron en la 1c-i**, con el servidor simulado: sirvieron para medir el STOP-B1.
- **D-5 · El error va en `--lose-red`**, como el de la Portada: `--loss-red` sobre este verde no se lee como texto. El botón sí va relleno de `--loss-red`.
- **D-6 · El tope de 20 s viaja en una cabecera** (`x-ajilei-tope-ms`), porque `functions.invoke` no deja pasar opciones propias hasta el `fetch`. `fetchConTope` la quita antes de mandar: no sale ni pide CORS (lo comprueba `cfg.eliminar.ok`).
- **D-7 · `partida_abierta_de` barre primero** (`barrer_salas()`), por la doctrina de SAL-A: si no, una sala vencida o una activa muerta que nadie barrió bloquearía el borrado. Por eso es `plpgsql` y `volatile`.
- **D-8 · La guarda cuenta al anfitrión aunque no esté sentado**, además de los sentados (la ficha decía «como anfitrión o como jugador»).

**El rector las aceptó todas** (D-1…D-8), además del Ajuste A de STOP-B1: el 401 como el ok, el tope de 20 s y la letra escalada como la hoja. El `npm:` de la función se empaquetó con `--use-api` (§6).

**Lo que se vio y no se tocó:**
- El velo de la hoja (verde al 60 %) deja el lobby bastante visible detrás del aviso de mesa abierta. Es de la 1a.
- Entre la guarda y `deleteUser` hay una rendija: si en ese instante el jugador se sienta en otro aparato, la mesa se borra con la cuenta sin asiento de cierre. El dinero se va con la cuenta de todos modos (Fase 0 §H-2).

---

## 5. Lo que hay que saber de la función

- **`--no-verify-jwt`: sí hace falta**, como en la sonda. Con las llaves nuevas la puerta del gateway no sirve; la función verifica el token ella misma (`GET /auth/v1/user` con la llave pública). Queda escrito también en `supabase/config.toml`.
- **Las llaves:** el patrón `llave()` de la sonda: `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_SECRET_KEYS`, y la pública igual. Supabase las inyecta: **no hay secreto que poner a mano**. Si faltara alguna, la función contesta 500 y lo dice en su log con qué variable falta.
- **El import** es `npm:@supabase/supabase-js@2.112.4`, la misma versión del cliente. La sonda no importaba nada de npm: que `--use-api` lo empaquete **no está medido**. Si el deploy fallara en el empaquetado, el arreglo es cambiar a `jsr:@supabase/supabase-js@2` (una línea).
- **CORS:** ajilei.io (con y sin www), `localhost` y `127.0.0.1` con cualquier puerto, la red de casa (`192.168.x.x`) y `*.trycloudflare.com`.

---

## 6. Lo que hizo Victor (2026-10-29)

- **`db push`:** aplicada `20261030001500_cfg1c_eliminar_cuenta.sql`.
- **El guion en el SQL Editor:** **14/14 PASA**, igual que en PGlite. La fila B9 en la base real: 13 filas antes en 9 tablas (`profiles`, `salas`, `sala_jugadores`, `billeteras`, `movimientos`, `intentos_dinero`, `mesas_ia`, `libro_puntos`, `puntos_totales`), 0 después. B10: la huella, 1 → 1. B11: el alias nace con 0 HC, sin movimientos ni puntos. El guion corre entre `begin` y `rollback`: no dejó rastro.
- **`functions deploy eliminar_cuenta --use-api --no-verify-jwt`:** desplegada. El import `npm:@supabase/supabase-js@2.112.4` se empaquetó sin problema, así que el riesgo de §5 queda cerrado y no hace falta `jsr:`. (El CLI avisa de la v2.122.0; está en la v2.116.0.)
- **El 401 sin token:** `POST /functions/v1/eliminar_cuenta` sin cabeceras → `HTTP/1.1 401` y `{"motivo":"sin_sesion"}`, servida por `supabase-edge-runtime`. La puerta del gateway no interviene (`--no-verify-jwt`) y la función contesta ella misma.

Visto bueno del rector a los cuatro pasos.

---

## 7. Guion de pruebas (después del despliegue)

**A · PC con el bypass** (`npm run dev` → `http://localhost:5173/`; o el 5174 de la sesión)

| Paso | Qué debe ver |
|---|---|
| `?cfg=borrar-mesa` → ⚙ → Eliminar cuenta → escribir `eliminar` → el botón se enciende → tocar | El aviso «Cierra o abandona tu mesa primero»; sigue dentro, con la hoja abierta |
| `?cfg=borrar-ok` → lo mismo | La Portada; en F12 → Application → Local Storage no queda ninguna clave `ajilei.*` |
| `?cfg=borrar-401` → lo mismo | Igual que el anterior |
| `?cfg=borrar-error` → lo mismo | «No se pudo eliminar la cuenta. Inténtalo de nuevo.» bajo los botones; el campo se conserva |
| Desde Retar → ⚙ → Cerrar sesión → volver a entrar (cualquier correo y código) | Aterriza en el lobby, no en Retar |

**B · Servidor real, con una cuenta desechable.** La cuenta es un alias `+borrar`. **Nunca con `test1976` ni `ticotest2022`.**

**Dónde.** ajilei.io todavía no tiene este cliente, así que la prueba se hace con `npm run build` y `npx vite preview` en la PC (`http://localhost:4173/`). También vale por túnel con el S25. Las dos usan el Supabase real, y la función acepta `localhost` y `*.trycloudflare.com`.

**Las dos consultas** se pegan en el SQL Editor. Cada una tiene **un hueco** marcado con un recuadro.
- **La familia de la huella** solo lee. Su hueco es el alias (`…+borrar@gmail.com`); si no es un alias `+borrar` de gmail, no mira nada. Enseña cuántas filas tiene `auth.users` con ese correo exacto y cuántas tiene `bonos_bienvenida` con su huella. Después pone una fila por cada cuenta de esa huella, con su nombre de usuario, saldo, movimientos, puntos, mesa IA abierta y salas abiertas. No enseña ningún uuid. La otra cuenta de la misma huella sale marcada «no se toca»: sirve para ver que sigue igual.
- **El ajuste** da 1000 HC con `ajuste_admin`. Su hueco es el **nombre de usuario** de la cuenta desechable. El rector lo revisa antes de que se corra. Se detiene con un error «STOP …», sin cambiar nada, en estos casos:
  - el usuario es `test1976` o `ticotest2022`, con cualquier combinación de mayúsculas y espacios;
  - no existe;
  - su correo no es un alias `+borrar` de gmail;
  - ya tiene saldo (el ajuste ya se hizo, o la cuenta nació con bono).

Las dos consultas se probaron en PGlite con todas las migraciones: con el hueco sin rellenar, con el correo base, con los dos protegidos, con una cuenta ajena, dos veces seguidas, sentada en una mesa IA y después de borrarla.

| Paso | Qué hacer | Qué debe ver |
|---|---|---|
| 1 | Correr **la familia** con el alias, antes de crear la cuenta | `auth.users` 0 · `bonos_bienvenida` 1 · una sola cuenta de esa huella (la del correo base), con su saldo. **Anotar ese saldo** |
| 2 | Entrar en la app con el alias y elegir un nombre de usuario (6 a 15 letras, números o `_`; p. ej. `borrame1c`) | La cuenta nace con **0 HC y sin bono**. La familia: `auth.users` 1, `bonos_bienvenida` sigue en 1, dos cuentas, el alias con `saldo=0 · movimientos=0` |
| 3 | El rector revisa **el ajuste** con el nombre en el hueco; Victor lo corre; otra vez la familia | «Success» sin filas; el alias con `saldo=1000 · movimientos=1` |
| 4 | Sentarse en una mesa contra las IAS. Sin salir, en **otra pestaña** con la misma cuenta: ⚙ → Eliminar cuenta → `eliminar` → tocar | «Cierra o abandona tu mesa primero»; la cuenta sigue dentro. La familia: `mesa IA abierta=1` |
| 5 | Salir de la mesa; en la otra pestaña, ⚙ → Eliminar cuenta → `eliminar` → tocar | «Eliminando» y la Portada. En F12 → Application → Local Storage no queda ninguna clave `ajilei.*` |
| 6 | La familia | `auth.users` **0** · `bonos_bienvenida` **1** · una sola cuenta, la del correo base, **con el mismo saldo del paso 1** |
| 7 | Volver a entrar con el mismo alias | Cuenta nueva: se elige nombre otra vez, **0 HC**, sin bono. La familia: dos cuentas, el alias con `saldo=0 · movimientos=0 · puntos=0` |
| 8 | Eliminarla otra vez (⚙ → Eliminar cuenta) y correr la familia | Igual que el paso 6. No queda basura |

Si en el paso 1 `bonos_bienvenida` da 0, o en el paso 2 la cuenta nace con HC, **parar**: el correo base no tiene la huella y el alias se llevaría el bono. La segunda pestaña del paso 4 aterriza en el lobby, porque la app no reanuda la mesa al cargar, y la guarda la decide el servidor, no el aparato.

**Resultado (Victor, 2026-10-29): conforme al 100 %.** En la PC, contra el Supabase real, con el usuario `borrame1c`. Al final se usó el alias `+borrar` del correo de **`test1976`**, no el del Motorola. Esa cuenta sólo la **leyó** la consulta de la familia, como «la otra de la misma huella». Su saldo no cambió (14 200 antes y después), ni sus 116 movimientos ni sus 7 puntos.

| Paso | Visto |
|---|---|
| 1 · familia antes | `auth.users` 0 · `bonos_bienvenida` 1 · 1 cuenta: `test1976`, saldo 14 200, 116 movimientos, 7 puntos |
| 2 · cuenta creada | Nace con **0 HC y sin bono**. Familia: 2 cuentas; `borrame1c` con saldo 0, 0 movimientos, 0 puntos |
| 3 · `ajuste_admin` | «Success». Familia: `borrame1c` con saldo 1000, 1 movimiento |
| 4 · sentada en una mesa IA, eliminar desde otra pestaña | «Cierra o abandona tu mesa primero»; la sesión siguió |
| 5 · tras salir de la mesa, eliminar | «Eliminando», la Portada, ninguna clave `ajilei.*` en F12 |
| 6 · familia | `auth.users` 0 · `bonos_bienvenida` 1 · sólo `test1976`, saldo 14 200 sin cambios |
| 7 · volver a entrar con el alias | Cuenta nueva, hay que elegir nombre otra vez, 0 HC, sin bono |
| 8 · eliminarla, y la familia | `auth.users` 0 · `bonos_bienvenida` 1 · 1 cuenta: `test1976` con saldo 14 200, 116 movimientos, 7 puntos, 0 mesas IA abiertas y 0 salas abiertas |

**La familia de la huella** (sólo lectura):

```sql
-- CFG-1 1c · STOP-B2 · La familia de una huella. Sólo lee: no cambia nada.
-- Se corre antes de crear la cuenta desechable, después de crearla, después del
-- ajuste y después de eliminarla.
--
-- ┌─ HUECO ────────────────────────────────────────────────────────────────┐
-- │ Entre las comillas, el alias con el que entras: tu_correo+borrar@gmail.com │
-- └────────────────────────────────────────────────────────────────────────┘
with hueco as (
  select lower(btrim('<<ALIAS +borrar>>')) as correo
),
valido as (
  select h.correo, public.huella_correo(h.correo) as huella
    from hueco h
   where h.correo ~ '^[a-z0-9._-]+\+borrar@gmail\.com$'
),
familia as (
  select u.id, u.email, u.created_at
    from auth.users u
    join valido v on public.huella_correo(u.email) = v.huella
   where u.email is not null
),
filas as (
  select 0 as o,
         'hueco' as que,
         case when exists (select 1 from valido) then 'un alias +borrar de gmail: se mira'
              else 'NO es un alias +borrar de gmail: no se mira nada' end as valor
  union all
  select 1, 'auth.users con ese correo exacto',
         case when exists (select 1 from valido) then (select count(*) from auth.users u join valido v on lower(u.email) = v.correo)::text else '—' end
  union all
  select 2, 'bonos_bienvenida con esa huella',
         case when exists (select 1 from valido) then (select count(*) from public.bonos_bienvenida b join valido v on b.correo_hash = v.huella)::text else '—' end
  union all
  select 3, 'cuentas con esa huella',
         case when exists (select 1 from valido) then (select count(*) from familia)::text else '—' end
  union all
  select 10 + row_number() over (order by f.created_at)::int,
         'cuenta ' || coalesce(p.username, '(sin perfil todavía)')
           || case when lower(f.email) = (select correo from valido) then ' · el alias +borrar'
                   else ' · la otra de la misma huella (no se toca)' end,
         format('saldo=%s · movimientos=%s · puntos=%s · mesa IA abierta=%s · salas abiertas=%s',
                coalesce((select b.saldo::text from public.billeteras b where b.jugador_id = f.id), '—'),
                (select count(*) from public.movimientos m where m.jugador_id = f.id),
                (select count(*) from public.libro_puntos l where l.jugador_id = f.id),
                (select count(*) from public.mesas_ia x where x.jugador_id = f.id and x.estado = 'abierta'),
                (select count(*) from public.salas s
                  where s.estado in ('esperando', 'activa')
                    and (s.anfitrion_id = f.id
                         or exists (select 1 from public.sala_jugadores j
                                     where j.sala_id = s.id and j.jugador_id = f.id))))
    from familia f
    left join public.profiles p on p.id = f.id
)
select que as "qué", valor from filas order by o;
```

**El ajuste** (una vez, revisado por el rector):

```sql
-- CFG-1 1c · STOP-B2 · 1000 HC para la cuenta desechable (la cuenta nace con 0 HC
-- porque comparte huella, y sin saldo no se puede sentar en una mesa contra las IAS).
-- Se corre UNA vez, después de que el rector lo revise. Si algo no cuadra, para
-- con un error que empieza por «STOP» y no cambia nada.
--
-- ┌─ HUECO ────────────────────────────────────────────────────────────────┐
-- │ Entre las comillas, el nombre de usuario que elegiste para la cuenta     │
-- │ desechable (el que sale en el lobby).                                   │
-- └────────────────────────────────────────────────────────────────────────┘
do $$
declare
  USUARIO constant text := btrim('<<USUARIO DE LA CUENTA DESECHABLE>>');
  v_id     uuid;
  v_correo text;
  v_saldo  bigint;
  r        public.movimiento_resultado;
begin
  if lower(USUARIO) in ('test1976', 'ticotest2022') then
    raise exception 'STOP: % es una cuenta protegida', USUARIO;
  end if;

  select p.id, lower(u.email) into v_id, v_correo
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(p.username) = lower(USUARIO);
  if v_id is null then
    raise exception 'STOP: no hay ninguna cuenta con el usuario «%»', USUARIO;
  end if;

  if v_correo !~ '^[a-z0-9._-]+\+borrar@gmail\.com$' then
    raise exception 'STOP: el correo de «%» no es un alias +borrar de gmail', USUARIO;
  end if;

  select b.saldo into v_saldo from public.billeteras b where b.jugador_id = v_id;
  if coalesce(v_saldo, 0) <> 0 then
    raise exception 'STOP: «%» ya tiene % HC (¿el ajuste ya se hizo, o nació con bono?)', USUARIO, v_saldo;
  end if;

  r := public.ajuste_admin(v_id, 1000, 'CFG-1 1c · STOP-B2 · cuenta desechable, para sentarse en una mesa IA');
  if not r.aplicado then
    raise exception 'STOP: el ajuste no se aplicó (%)', r.motivo;
  end if;
  raise notice 'ok: «%» tiene ahora % HC', USUARIO, r.saldo;
end
$$;
```
