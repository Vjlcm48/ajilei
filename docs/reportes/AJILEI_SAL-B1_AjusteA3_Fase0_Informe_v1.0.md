# AJILEI · SAL-B1 · Ajuste A3 · Fase 0 · Informe v1.0
## Diagnóstico de solo lectura: el código de invitación pendiente se pierde en el arranque

**Rector:** `AJILEI_SAL-B1_AjusteA3_Fase0_v1.0.md`. Solo lectura: ningún archivo de `src/`, `supabase/`, `scripts/` ni `tests/` se ha editado.
**Punto de partida confirmado:** `npm test` **618 / 618** · lint **21** (20 + 1) · `diagSAL sal` **66 / 66** · protegidos intactos (`git diff 12188af` vacío sobre los cinco) · `git status` **idéntico** al inicio salvo este informe.
**Estado:** STOP. La Fase 1 se redacta a partir de aquí.

---

## 0. El hallazgo que ordena todo lo demás

El enlace observado es `https://<host>/?AJ=XXXX`. **Ningún archivo del árbol construye un enlace de compartir ni lee un parámetro llamado `AJ`.** El único lector de la URL del cliente es `recogerDeLaUrl()` en `src/config/salaPendiente.js:152`, y lee **`?sala=`**: `PARAM_SALA = 'sala'` (`salaPendiente.js:135`, sellado en SAL-A y probado en `salaPendiente.test.js:154`). Un `grep` de `AJ=`, `navigator.share`, `compartir`, `searchParams` y `location.search` en `src/` devuelve solo `salaPendiente.js` (`?sala=`), `salasFixtures.js` (`?sal=`, arnés) y `siembraCEL.js` (`?cel=`). `SalaEspera.jsx:111` copia al portapapeles `sala.codigo` (`AJ-XXXX`), no un enlace; `navigator.share` es de B2 (`SalaEspera.jsx:24`).

Consecuencia directa, que las ocho respuestas desarrollan: con `?AJ=XXXX` en la barra, `recogerDeLaUrl()` devuelve `null` en `salaPendiente.js:161` **sin escribir nada en el almacén y sin limpiar la URL**. Para la app, ese enlace es la portada a secas. Nada de lo que la ficha esperaba (consumo, intento, error rojo) puede ocurrir, porque el código nunca entra.

---

## 1. Mapa de la secuencia de arranque, en orden de ejecución

### 1.0 Tronco común a los tres casos (una carga de página)

| # | Qué ocurre | Dónde |
|---|---|---|
| 1 | `main.jsx` monta `<App>` bajo `StrictMode` | `main.jsx:25-31` |
| 2 | **Render 1.** `useAuth()`: `sesion` nace `undefined` → `estado = CARGANDO` (sin bypass) | `App.jsx:86` · `useAuth.js:86`, `:163-169` |
| 3 | Inicializador de `invitacion`: **`recogerDeLaUrl()`** → `searchParams.get('sala')` → con `?AJ=XXXX`, `crudo === null` → **`return null`** (antes de `guardar` y antes de la limpieza) → `?? leerSalaPendiente()` → lo que haya en `localStorage['ajilei.salaPendiente']` | `App.jsx:124-125` · `salaPendiente.js:157`, `:161`, `:77-79` |
| 4 | `intentarInvitacion = false` (sin simulación) | `App.jsx:132` |
| 5 | `screen = invitacion !== null ? 'sala-opciones' : 'lobby'` → **`'lobby'`** cuando el almacén está vacío | `App.jsx:134-145` |
| 6 | `sala = null`; `entrarSala` (guarda por `esMesa`) | `App.jsx:153`, `:182-186` |
| 7 | `uid = auth.perfil?.id ?? null` → **`null`** en el render 1 | `App.jsx:228` |
| 8 | `CARGANDO` → `return null` (no se pinta nada) | `App.jsx:316` |
| 9 | **Efectos del render 1.** `useAuth` efecto A: `onAuthStateChange` + `getSession()` (asíncronos) | `useAuth.js:106-116` |
| 10 | Efecto de arranque: `if (simulacion) return` (no) → `arranqueDeSesion(null, null)` → `{ arrancar: false }` → **sale sin consumir ni preguntar** | `App.jsx:229-235` · `salasCore.js:221-225` |
| 11 | Llega la sesión → `uid` → efecto B lee `profiles` → `perfil` → `COMPLETO` | `useAuth.js:119`, `:129-146`, `:163-169` |
| 12 | Re-render con `uid` no nulo; el efecto de arranque se dispara por su dependencia `uid` → `arranqueDeSesion(null, uid)` → `{ arrancar: true }` | `App.jsx:233-235`, `:262` |
| 13 | **`pendiente = consumirSalaPendiente()`** = `leer()` + `borrar()` → lo que hubiera en el almacén (y lo borra) | `App.jsx:243` · `salaPendiente.js:123-126` |
| 14 | `api.miSala()` → `mesaOpcional('mi_sala')` → si llega la fila de nulos, **traza** `mi_sala devolvió una fila sin id` y normaliza a `{ data: null }` | `App.jsx:245` · `salasApi.js:190`, `:123-131`, `:127` |
| 15 | **Traza de arranque**: imprime `esMesa(data) ? 'mesa …' : 'sin mesa'` y **`pendiente`** (el valor devuelto por `consumir()` en el paso 13) | `App.jsx:249-252` |
| 16 | `esMesa(data)` → `setInvitacion(null)` + `entrarSala(data)` → stub; si no, `pendiente !== null` → `setIntentarInvitacion(true)`; si no, **nada: se queda en la pantalla que ya tenía** | `App.jsx:253-260` |

Y sólo si el paso 16 encendió `intentar` **y** `screen` es `'sala-opciones'` (paso 5): el efecto de `SalaOpciones` normaliza `codigoInicial`, marca `yaIntentado`, llama a `api.unirseSala({ codigo })` y, con error, **`setErrorCodigo(error)` + foco** (`SalaOpciones.jsx:180-195`, error en `:188-191`).

### 1.1 Caso (i) · PC, sesión viva, mesa cancelada, `?AJ=JK4T`

Pasos 1-16 tal cual. En el paso 3 `recogerDeLaUrl()` devuelve `null` (`salaPendiente.js:161`): el almacén no recibe nada y la URL conserva `?AJ=JK4T`. `leer()` devuelve `null` (almacén vacío) → `screen = 'lobby'`. En el paso 13 `consumir()` devuelve `null`. Paso 14: `mi_sala` → fila de nulos → traza `mi_sala devolvió una fila sin id` ✔ (consola de Victor). Paso 15: `arranque · mi_sala → sin mesa · invitación pendiente: null` ✔. Paso 16: ni mesa ni pendiente → **nada**; el lobby se queda. `unirse_sala` **no se llama** desde ningún sitio (§3): ninguna línea en consola ✔ y **ninguna fila** en `intentos_codigo` ✔. Al entrar a «Jugar contra jugador», `SalaOpciones` monta con `codigoInicial = invitacion = null` → campo vacío ✔.

**Las cuatro observaciones de (i) son exactamente lo que el código hace con un parámetro que no lee.**

### 1.2 Caso (ii) · Motorola, Gmail sin sesión → login por código → app

Pasos 1-10 idénticos, pero en el paso 2 `estado` pasa de `CARGANDO` a **`SIN_SESION`** cuando `getSession()` responde sin sesión → `App.jsx:323-324` pinta la **Portada**. `invitacion` y `screen` ya quedaron fijados en el render 1 (pasos 3 y 5): `null` y `'lobby'` si el almacén estaba vacío. El login es por código de seis dígitos: `verificarCodigo` → `verifyOtp` (`useAuth.js:181-185`) → `SIGNED_IN` por `onAuthStateChange` (`useAuth.js:109-111`) → **sin recarga de página**: `App` no se remonta y el render 1 sigue mandando. Luego pasos 11-16 como en (i) → lobby, sin error, campo vacío ✔.

**Lo que este mapa NO produce es la fila de `intentos_codigo`.** Por código, `unirse_sala` con código sólo se llama desde `SalaOpciones.jsx:127` (botón) y `:186` (intento automático). El automático exige `intentar = true`, que sólo enciende `App.jsx:260` cuando `pendiente !== null`, y para que `SalaOpciones` esté montada hace falta `invitacion !== null` en el render 1 (`App.jsx:144`), es decir, **el mismo almacén** con código. Si eso se hubiera dado, el error se habría pintado (`SalaOpciones.jsx:188-191`) y la pantalla habría sido `SalaOpciones`, no el lobby. Las dos lecturas posibles de la fila, en §4.

### 1.3 Caso (iii) · PC, sesión viva, mesa `esperando` → sentado en la espera

Pasos 1-16 idénticos a (i) hasta el 14. La única diferencia está en la **respuesta de `mi_sala()`**: una fila con `id` → paso 16 → `entrarSala(data)` → `'sala-espera'` (`App.jsx:253-256`, `:182-186`). `mi_sala()` sólo devuelve la mesa en espera **en la que ese uid ya está sentado** (`sala_esperando_de(auth.uid())`, migración A1 §1 y §5). Es decir: **el PC ya estaba sentado en esa mesa antes de abrir el enlace**, y lo que vio fue la reanudación de §5.3, no la invitación. El `?AJ=XXXX` no participó: devolvió `null` en el paso 3 igual que en (i).

Dos lecturas de «`1/3` visible desde el S25»: (a) el S25 es el anfitrión y miraba su stub antes de pulsar «Actualizar» (el recuento no late en B1, `SalaEspera.jsx:32-36`); (b) el S25 miraba la tarjeta de una mesa **abierta** de 3 en «Mesas formándose ahora» con el PC como único sentado. La (b) es coherente con que una abierta no tiene código y por tanto no puede tener enlace `?AJ=`; la (a) exige que el PC se hubiera unido antes por otra vía. **Más probable: el PC era miembro (o anfitrión) de esa mesa desde antes**, en cualquiera de las dos lecturas. El código no admite una tercera: no hay línea por la que `?AJ=` siente a nadie.

### 1.4 Lo que difiere entre los tres

| | (i) | (ii) | (iii) |
|---|---|---|---|
| Paso 3 (`?AJ=`) | `null`, almacén intacto, URL sin limpiar | igual | igual |
| Paso 5 (`screen`) | `lobby` | `lobby` (Portada delante) | `lobby` |
| Pasos 11-12 (llega `uid`) | sesión persistida, milisegundos | tras el OTP, minutos, **misma carga** | sesión persistida |
| Paso 14 (`mi_sala`) | fila de nulos | fila de nulos | **mesa con id** |
| Paso 16 | nada | nada | `entrarSala` → stub |

La única variable que separa (i) de (iii) es el paso 14. La ficha lo enunció al revés («la app sí lo reconoce») porque (iii) tiene el mismo aspecto que una invitación que funciona.

---

## 2. ¿Qué imprime la traza `arranque · … · invitación pendiente:`?

**El valor consumido, no el residual.** `App.jsx:243` guarda en `pendiente` lo que devuelve `consumirSalaPendiente()` —que es `leer()` **antes** de `borrar()`, `salaPendiente.js:123-126`— y `App.jsx:249-252` imprime esa constante dentro del `then`. Nada vuelve a leer el almacén entre las dos líneas. Por tanto **`invitación pendiente: null` significa que el almacén estaba vacío en el instante del paso 13**, no que ya se hubiera consumido. **H1 queda descartada por la línea 243.**

---

## 3. ¿Dónde vive el `console.log` de `unirse_sala`? ¿Cuántos llamadores tiene?

Vive en **`salasApi.js:127`**, dentro de `mesaOpcional`, la envoltura que comparten las cinco RPC que devuelven `public.salas` (`salasApi.js:123-131`; `unirseSala` pasa por ella en `:167-168`). **La ven todos los llamadores.** Se imprime sólo cuando llega una fila **sin `id`**, que es justo lo que devuelve un código muerto o inexistente desde A1: en (i), la ausencia de la línea equivale a «no se llamó».

Llamadores de `unirseSala` en el cliente, **cuatro**:

| # | Dónde | Cómo |
|---|---|---|
| 1 | `SalaOpciones.jsx:127` (`entrar`, botón «Entrar») | por **código** |
| 2 | `SalaOpciones.jsx:186` (efecto del intento automático) | por **código** |
| 3 | `SalaOpciones.jsx:204` (`unirmeA`, tarjeta) | por **id** |
| 4 | `ArmarMesa.jsx:152` (`pulsar`, «Unirme a esa mesa») | por **id** |

Ni `App.jsx` ni `SalaEspera.jsx` la llaman. Sólo 1 y 2 pueden dejar fila en `intentos_codigo` (por id la base no anota; migración A1 §4). **H4 queda descartada.**

---

## 4. Camino con login (caso ii): ¿dónde se descarta el resultado?

**En ninguna línea.** Si `unirse_sala` devuelve «sin mesa» por código, `mesaOpcional` lo normaliza (`salasApi.js:128-130`) y `unirseSala` lo convierte en **`codigo_invalido`** (`salasApi.js:169-170`). Los dos llamadores por código lo reciben como `error` y **lo pintan**:

- el botón: `SalaOpciones.jsx:130-137` → `setErrorCodigo(error)` + foco;
- el automático: `SalaOpciones.jsx:188-191` → `setErrorCodigo(error)` + foco.

`claveDeError` se calcula al pintar, en el propio `<p className="sal-aviso-error">` de `SalaOpciones` (`t(claveDeError(errorCodigo))`). La guarda `entrarSala` de A2 (`App.jsx:182-186`) **no interviene** en el camino de error: sólo recibe `data` cuando `error` es `null` (`SalaOpciones.jsx:193`). **H3, como mecanismo, queda descartada**: el código no tiene un punto donde un `codigo_invalido` se pierda camino del lobby.

**¿Existe hoy un mecanismo para que `SalaOpciones` arranque con un error ya pintado?** Sí, indirecto: `codigoInicial` + `intentar` (`App.jsx:389`, `:393`) hacen que el propio componente dispare el intento y pinte el error en su primera visita. **No** existe una prop `errorInicial` ni hace falta: el error nace del intento, y el intento nace del código pendiente. Lo que falla en (ii) no es la pintura del error, es que **no hay código pendiente** porque el paso 3 no lo guardó.

**Entonces, ¿de dónde sale la fila de `ticotest2022` a 21:04:40?** El código de esta build no la produce en una carga que termine en el lobby sin error. Dos lecturas, con lo que se puede señalar:

- **(a) Es de otra carga u otro momento.** `intentos_codigo` sólo se purga **por usuario y al siguiente intento de ese usuario**, y sólo las filas de más de una hora (migración A1 §4, el `delete … interval '1 hour'` antes del `insert`). Una fila de un intento anterior del Motorola ese día —el «pendiente consumido» de A1 §6, o un código tecleado en otra prueba— sigue ahí hasta que `ticotest2022` vuelva a intentar. **Más probable**, y comprobable con `intentado_en` contra la hora real de la prueba (ii).
- **(b) El almacén del navegador incrustado tenía un `ajilei.salaPendiente` de una prueba anterior con `?sala=`**, y el intento automático corrió. Pero entonces la pantalla habría sido `SalaOpciones` con el error rojo (`App.jsx:144` + `SalaOpciones.jsx:188-191`), no el lobby, salvo que el usuario tocara «volver» sin verlo. Menos probable: contradice «lobby, sin error» salvo intervención manual.

---

## 5. `salaPendiente`: almacén, supervivencia y llamadores

- **Almacén:** `localStorage`, clave `ajilei.salaPendiente` (`salaPendiente.js:37`, escritura `:56`, lectura `:79`, borrado `:93`). La razón está en su cabecera (`:21-27`): sobrevivir a un cambio de pestaña o a reabrir la PWA durante el registro.
- **Supervivencia al login:** sí. El login por código no navega: `verifyOtp` en la misma página (`useAuth.js:181-185`), `App` no se remonta.
- **Cambio de contexto del navegador incrustado:** depende de qué abra Gmail. Una *Custom Tab* comparte perfil y `localStorage` con Chrome; un *WebView* propio tiene almacén separado y **lo que se guarde ahí no lo verá la PWA ni Chrome**. El código no puede distinguirlo ni compensarlo (es el hallazgo del anexo de A1). Para (ii) es irrelevante: con `?AJ=` no se guardó nada en ningún almacén.
- **Quién llama a `consumir()`:** sólo `App.jsx:243`. A `borrar()`: `App.jsx:426` («Volver al inicio» del stub, A1 §2.4) y el propio `consumir` (`salaPendiente.js:125`). A `leer()`: `App.jsx:125` (mirar sin gastar).

---

## 6. Limpieza de la URL

- **Qué se retira:** sólo **`?sala=`**. `recogerDeLaUrl()` lee (`salaPendiente.js:157`), guarda (`:163`) y **después** borra el parámetro con `history.replaceState` (`:167-171`), en la **misma llamada síncrona**. `?AJ=` no se toca nunca: el `return null` de `:161` está antes de la limpieza. **Comprobación de un segundo para Victor:** tras cargar `?AJ=XXXX`, la barra de direcciones **conserva** `?AJ=XXXX`; con `?sala=…` desaparece.
- **Cuándo:** en el inicializador de `invitacion` (`App.jsx:124-125`), durante el **render 1**, antes de cualquier efecto. Lectura, guardado y limpieza son tres líneas consecutivas de la misma función; no hay ventana entre ellas.
- **¿Puede la limpieza adelantarse al arranque con sesión viva?** No, y por dos razones con línea: (1) los efectos corren después del render, y el arranque es un efecto (`App.jsx:229`); (2) aunque `uid` estuviera disponible en el render 1 (sólo con bypass, `useAuth.js:163-164`), el efecto seguiría corriendo **después** de que el inicializador hubiera leído, guardado y limpiado. Sin bypass, `uid` llega tras `getSession()` (`useAuth.js:115`), decenas de milisegundos después. **H2 queda descartada.** (Era la pata que A1 §4.3 cerró al mover `recogerDeLaUrl()` del efecto al inicializador.)

---

## 7. Cobertura actual

- **`salasCore.test.js:267-330` · «SAL-B1 A2 · arranqueDeSesion»** (5 pruebas, líneas 281, 286, 295, 309, 318): cubre **sólo la guardia** (cuándo arranca), no la precedencia (qué hace al arrancar).
- **`salaPendiente.test.js:124-160` · «SAL-A · recoger de la URL»:** `lee ?sala=, lo recuerda y LIMPIA la barra` (:125), `la limpieza conserva los demás parámetros y el hash` (:132), **`sin ?sala= no toca nada` (:138)** —que es, literalmente, la conducta observada en (i)—, `un ?sala= con basura se limpia igual, pero no se guarda` (:145), `el nombre del parámetro es el sellado` (:154). Y **`SAL-B1 · consumir`** (:164-196, 5 pruebas).
- **`salasApi.test.js`:** el `null` y la fila de nulos por código → `codigo_invalido` (A1 y A2).

**Sin prueba:** la **precedencia** del paso 16 como secuencia (mesa → stub; pendiente → intento; nada → lobby) vive inline en `App.jsx:253-260`; y ninguno de los tres casos de §1 tiene prueba: **(i)** ningún test alimenta `?AJ=`, **(ii)** ningún test recorre «sin sesión → login → arranque con pendiente», **(iii)** ningún test dice «mesa con id gana al pendiente». La prueba `:138` cubre el *comportamiento actual* de (i) —ignorar lo que no sea `?sala=`— y sella justo lo que la Fase 1 tendrá que decidir si sigue siendo verdad.

---

## 8. Propuesta de Fase 1 (sin ejecutar)

**Primero, una decisión de producto que el código no puede tomar:** ¿cuál es el formato del enlace? SAL-A selló `?sala=` (Fase 0 §6.2, por «el proyecto no tiene router»). El enlace `?AJ=XXXX` no lo genera ningún código de B1; alguien lo escribió. Dos salidas, no excluyentes:

- **(A) El enlace se ajusta al lector:** cuando B2 implemente «Compartir», emite `?sala=AJXXXX`. Cero cambios hoy; (i) y (ii) quedan resueltos con el enlace correcto, y se puede **comprobar antes de la Fase 1** repitiendo (i) en el PC con `?sala=AJ-XXXX`: el resultado esperado es `SalaOpciones` con el error rojo (la sonda de A1 §4.5 recorrió exactamente ese camino con el bypass).
- **(B) El lector acepta también el alias:** `recogerDeLaUrl()` lee `?sala=` **y** `?AJ=` (el segundo con el cuerpo de cuatro, `AJ` como prefijo implícito), y limpia los dos. Es el cambio mínimo si `?AJ=XXXX` es el formato que se quiere —más corto y con la marca dentro—.

**Cambio mínimo recomendado (B) + la secuencia probada:**

1. `src/config/salaPendiente.js`: `PARAM_SALA_CORTO = 'AJ'`; `recogerDeLaUrl()` prueba `sala` y, si no, `AJ` (normalizando `AJ-` + cuerpo con `normalizarCodigo`, que ya acepta prefijo puesto o quitado); borra ambos parámetros. Sin tocar el resto del módulo.
2. `src/config/salaPendiente.test.js`: +3 (`?AJ=XXXX` se recuerda y se limpia; `?sala=` sigue mandando si vienen los dos; `?AJ=` con basura se limpia y no se guarda). La prueba `:138` se **renombra**, no se relaja: «sin `?sala=` ni `?AJ=` no toca nada».
3. **Una función pura nueva en `salasCore.js`**, molde de `arranqueDeSesion`: `decidirArranque(mesa, pendiente) → { destino: 'stub' | 'intentar' | 'quedarse' }`, que es el paso 16 hoy inline en `App.jsx:253-260`. `App` sólo la llama. Es lo que permite probar **los tres casos de §1 sin jsdom**: (i) `mesa = null, pendiente = 'AJ-JK4T'` → `'intentar'`; (ii) idéntico tras un `arranqueDeSesion(null → uid)`; (iii) `mesa` con id y `pendiente` presente → `'stub'` (la mesa gana y el pendiente se descarta). +3 pruebas mínimas en `salasCore.test.js`.
4. `src/App.jsx`: sustituir las siete líneas del paso 16 por la llamada; ningún otro cambio.
5. **Arnés:** un estado `opciones-alias-aj` no es posible tal cual —el arnés entra por `?sal=` y los fixtures no leen la URL—, así que la cobertura del alias queda en Vitest; el arnés no cambia.
6. **SQL: no.** Nada de esto toca la base.
7. **Trazas:** el `console.log` de `unirse_sala` **ya vive en `salasApi.js:127`**, así que no hay nada que mover; sigue temporal y se retira en la ficha de commits, junto con el de arranque (`App.jsx:249`).

Si Victor prefiere (A), la Fase 1 se reduce a los puntos 3 y 4 (probar la precedencia) y a una nota para B2 con el formato sellado.

---

## Hipótesis: cuál sobrevive

| | Enunciado | Veredicto | Dónde |
|---|---|---|---|
| **H1** | La traza imprime el valor residual tras consumir | **Descartada.** Imprime la constante `pendiente`, devuelta por `consumir()`; `null` = almacén vacío | `App.jsx:243`, `:249-252` · `salaPendiente.js:123-126` |
| **H2** | Carrera: el arranque corre antes de que `recogerDeLaUrl()` escriba | **Descartada.** Lectura, guardado y limpieza ocurren en el inicializador del render 1; el arranque es un efecto y además espera a `uid` | `App.jsx:124-125`, `:229-235` · `useAuth.js:115` |
| **H3** | El resultado de `unirse_sala` se descarta camino del lobby | **Descartada como mecanismo.** Los dos llamadores por código pintan el error; `entrarSala` sólo recibe éxitos. El origen de la fila de (ii) queda **abierto**: más probable, una carga anterior (§4.a) | `SalaOpciones.jsx:130-137`, `:188-193` · `salasApi.js:169-170` |
| **H4** | La traza de `unirse_sala` vive en un componente | **Descartada.** Vive en `salasApi.js:127`, común a los cuatro llamadores | `salasApi.js:123-131` |
| **H5** *(nueva)* | **El parámetro no es el que se lee**: el enlace dice `?AJ=` y el lector espera `?sala=` | **Confirmada por el código** para (i) y (iii); para (ii) explica la pantalla y deja la fila a §4.a. Es la única hipótesis que hace que la traza `pendiente: null`, la ausencia de `unirse_sala`, la ausencia de fila, el campo vacío y el lobby sean **la misma cosa** | `salaPendiente.js:135`, `:157`, `:161` |

**Comprobación de un minuto, sin código:** cargar en el PC `https://<host>/?sala=AJ-XXXX` con una mesa cancelada. Si aparece `SalaOpciones` con «Código no encontrado o mesa ya iniciada» y la barra pierde el parámetro, H5 está cerrada por observación además de por lectura.

---

## STOP

Sin ediciones, sin commits. `git status` idéntico al de partida más este informe.
