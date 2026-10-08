# AJILEI · ECO-1 · Fase 1b — Informe: el cliente lee el saldo real · v1.0

**Ficha:** `AJILEI_ECO-1_Fase1b_v1.0.md` (con el plan del STOP-1 aprobado y sus tres ajustes) · **Base:** `main` en `78361ed` · **Fecha:** 2026-10-07
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** STOP-2, aceptada por el rector el 2026-10-08 (decisiones en §6, cierre en §8 y §10). Sin `git add` ni commits. Sin migraciones ni SQL.

---

## 0. Resumen

- **Una sola cifra.** El teléfono ya no tiene dos saldos. Toda pantalla que enseña el saldo lee lo mismo: **la billetera del servidor (`mi_billetera()`) más el ajuste local de las partidas contra las IAS**. Son la píldora del Lobby, Retar, SalaOpciones, ArmarMesa, SalaEspera y PartidaPvP, y la recarga de la mesa. `saldoSesion` y la constante 5.000 salieron de la app.
- **El ajuste local es transitorio** (B2). Hace las mismas cuentas que `saldoSesion` en los mismos sitios: la entrada resta, la recarga resta y la salida suma. Vive en memoria, se pierde al recargar la página y está marcado `TRANSITORIO hasta ECO-1c`.
- **Nunca se enseña una cifra inventada.** Mientras la cifra no llega, la píldora enseña «—» con su caja reservada (0,64 px de diferencia de ancho, 0 de alto) y nada se apaga por saldo. Si la lectura falla y no se conocía ninguna cifra, Retar lo dice y ofrece «Reintentar» (ajuste 1 del rector).
- **El bono pasa a 2.500** (B4) y `ALCANCE_NUEVOS` queda en `[100, 200, 500]`, comprobado. Las claves muertas de `ajileiConfig` quedan al día con lo sellado (B5).
- **Varas:** todo en verde. Vitest **1.361** (1.323 + 38 nuevas); lint **21**, los mismos de siempre; build correcto. `diagSAL` **102/102**. `humo` (con `gate`, `lob` y `retar`), `rec`, `apu` (los 7 viewports y `rec2`) y el modo nuevo `saldo` (6 puntos) en verde, con la guardia sobre `dist/` también en verde. Detalle en §4.
- **Para Victor, antes de la ceremonia de commit:** borrar a mano `src/lib/saldo.js` (ajuste 3 del rector, §8). Ya no lo importa nadie.

---

## 1. Lo hecho

### 1.1 Archivos nuevos

| Archivo | Qué es |
|---|---|
| `src/hooks/billeteraCore.js` | El núcleo puro: estados, cuándo leer, aplicar la respuesta, la cifra que se enseña, las tres operaciones del ajuste local y el «saldo para juzgar». |
| `src/hooks/billeteraCore.test.js` | 27 pruebas: lectura, carga, error, ajuste local, refresco, la API y la billetera falsa. |
| `src/hooks/useBilletera.js` | El hook. Se llama una vez en `App` y la cifra baja por props (sin contexto, como pidió el rector). |
| `src/lib/billeteraApi.js` | `crearBilleteraApi(cliente).leer()` llama a `mi_billetera()`. Nunca rechaza: un fallo llega como `{ error }`. |
| `src/dev/billeteraFalsa.js` | El cliente falso del bypass. Doble puerta (`DEV && VITE_AUTH_BYPASS`), como `?sal=`. |
| `scripts/testDistSinMoldes.test.js` | La guardia sobre `dist/` (§4.4). |

### 1.2 Archivos cambiados

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Fuera `saldoSesion`, `saldoDelJugador` y `siembraAPU`. Entra `useBilletera`; la `billetera` baja a las seis pantallas; `entrar`, `recargar` y `salir` en los mismos tres sitios de antes. |
| `src/screens/Lobby.jsx`, `RetarIAS.jsx`, `SalaOpciones.jsx`, `ArmarMesa.jsx`, `SalaEspera.jsx`, `PartidaPvP.jsx` | Leen la prop `billetera`. Ya no importan `lib/saldo`. |
| `src/components/BarraSuperior.jsx`, `PantallaChips.jsx` | La píldora enseña «—» sin cifra, con `data-saldo` (cargando, listo o error) y `data-saldo-vacio`. |
| `src/styles/lobby.css`, `salas.css` | **Solo aditivo:** una regla con `[data-saldo-vacio]` que da al hueco el ancho de una cifra de cuatro dígitos. |
| `src/screens/retarCore.js` | `guardaDeSaldo`: aplica la guarda de saldo al pintar, cuando la cifra llega tarde. |
| `src/screens/salasCore.js` | `alcanza` y `faltanPara` aceptan `Infinity` como «todavía no se sabe»: todo alcanza y no hay «Te faltan». |
| `src/config/salas.js` | B4: `BONO_BIENVENIDA = 2500`. |
| `src/config/ajileiConfig.js` | B5: `videoReward` 500, `maxVideosPerDay` 8, `constancia: { monto: 500, dias: 3 }`; fuera `bonoDiario`. Siguen sin lectores. |
| `src/config/textos.es.js` | Tres textos: «Cargando tu saldo…», «No pudimos leer tu saldo. Revisa tu conexión.» y «Reintentar». |
| `src/dev/salasFixtures.js` | `armar-aviso` pasa de la mesa de 500 a la de 1.000 (re-sello de B4). |
| `src/main.jsx`, `src/config/salaRecordada.js`, `src/config/salas.js`, `src/dev/siembraAPU.js`, `src/dev/salasFixtures.js` | Comentarios que prometían cosas falsas. Por ejemplo, `main.jsx` decía «el saldo de la sesión se lee de la base al volver», y lo que se pierde al recargar es el ajuste local. |
| `src/config/salas.test.js`, `src/screens/salasCore.test.js`, `scripts/testRetarIAS.test.js` | Re-sellos de B4 y pruebas de «sin cifra todavía». |
| `scripts/arnes/nucleo.mjs` (+ prueba), `scripts/cap/capMesa.mjs`, `scripts/bie/bieRed.mjs` | Las tres rutas que imitan a Supabase contestan `mi_billetera` con 5.000. `contextoCap` acepta una billetera viva configurable. |
| `scripts/diagDSK.mjs` | El modo nuevo `saldo` (§4.3). |
| `scripts/diagSAL.mjs` | Re-sello de `armar-aviso`. |
| `docs/AJILEI_Invariantes_v1.0.md` | INV-46 (nueva). En INV-45, la cita `SalaEspera.jsx:527` pasa a `:530`, porque la prop nueva desplazó tres líneas. |
| `.gitignore` | `capturas-saldo/`. |

**Ningún protegido entra** (`docs/AJILEI_Protegidos_v1.0.md` §2). `GameTable.jsx` tampoco se tocó: ya recibía `saldo`, `onRecargar` y `onLeave` desde `App`.

---

## 2. Cómo funciona

### 2.1 La fuente única

`useBilletera(api, uid)` guarda `{ uid, servidor, estado, ajuste }` y expone:
- `saldo`: `max(0, servidor + ajuste)`, o `null` mientras no se sabe;
- `servidor`;
- `estado`: cargando, listo o error;
- `refrescar()` y `alSaldoInsuficiente()`;
- `entrar(E)`, `recargar(m)` y `salir(fichas, entrada)`.

La billetera es de una cuenta: si se cierra sesión y entra otra en la misma carga de página, empieza de cero, sin la cifra ni el ajuste de la anterior.

### 2.2 Cuándo se lee

- Al llegar a `COMPLETO` con perfil, una vez por cuenta (en desarrollo, StrictMode monta dos veces y la segunda no vuelve a leer).
- Al volver a primer plano, como mucho una vez cada 15 s. **Si la última lectura falló no hay espera**, para que quien vuelve tras cortarse la red vea su saldo ya. Esto lo añadí al escribir la vara d; el plan no lo decía.
- Tras un `saldo_insuficiente` de PvP: al crear o unirse en «Armar una mesa», y al unirse por código, por enlace o por tarjeta en las salas.
- Con «Reintentar» en Retar.

Nunca hay dos lecturas a la vez. Sin sesión o sin perfil no se llama.

### 2.3 Qué se ve mientras carga o si falla

| Pantalla | Cargando | Error sin cifra | Error con cifra |
|---|---|---|---|
| Píldora (las seis) | «—», caja reservada | «—» | la última cifra |
| Retar | nada en gris, ningún aviso, entrada limitada solo por el techo de la mesa, CTA apagado con «Cargando tu saldo…» | lo mismo, y en lugar de la nota un aviso «No pudimos leer tu saldo. Revisa tu conexión.» con **Reintentar** | normal, con la última cifra |
| ArmarMesa | todas las apuestas encendidas; decide el servidor | igual | normal |
| SalaOpciones | ninguna mesa atenuada, ningún «Te faltan» | igual | normal |

La memoria de Retar y de ArmarMesa se lee sin la guarda de saldo si la cifra aún no llegó, y la guarda se aplica al pintar en cuanto llega (sin efectos que escriban estado). Con la cifra ya conocida al montar, que es el caso normal, nada cambia respecto a antes.

### 2.4 El arnés y el modo sin sesión

| Camino | Modos | De dónde sale el saldo |
|---|---|---|
| Desarrollo con bypass (5173) | `retar`, `apu`, `rec`, `diagSAL`, `diagCEL0` y casi todo `diagDSK` | La billetera falsa: `?apu=saldo:<n>`, o 5.000. Lista desde el primer fotograma. |
| `vite preview` (4173) con sesión simulada | `lob`, `msg`, `saldo`, `diagPUE`, `cap` y `bie` | La API real; la ruta del arnés contesta `mi_billetera` con 5.000. `contextoCap({ billetera })` la hace configurable, lenta o caída. |
| Desarrollo sin bypass (5174) | `luz` y `rev` | Solo la Portada: sin perfil no hay lectura. |

---

## 3. Los tres ajustes del rector al plan

1. **Error sin cifra en Retar.** Hecho: `AvisoLectura` en `RetarIAS.jsx` (texto por `t()` y botón `data-accion="saldo-reintentar"`, que llama a `refrescar()`). La vara d lo mide en Retar y en la píldora (`saldo.4`), y el reintento la recupera.
2. **La billetera falsa sustituye solo la lectura.** **Confirmado.** `billeteraFalsa.js` no fabrica una billetera: fabrica un cliente con la forma del de Supabase (`rpc('mi_billetera')`) y lo pasa por `crearBilleteraApi`, la capa real. Lo que devuelve tiene exactamente las dos claves de la API real (`inicial` y `leer`); una prueba lo comprueba (`billeteraCore.test.js`, «la billetera falsa del bypass»). El núcleo, el ajuste local y `entrar`, `recargar` y `salir` son los mismos en la app y en el arnés: `useBilletera` no sabe cuál de las dos recibe. La única diferencia es `inicial`, la cifra que la falsa ya conoce antes de leer.
3. **`src/lib/saldo.js` no se borra.** Dejó de importarse en todo el código. Comprobado con grep (§8).

---

## 4. Varas

| Vara | Resultado | Nota |
|---|---|---|
| vitest | **1.361 en verde** (56 archivos) | 1.323 + 38 nuevas: 27 de `billeteraCore.test.js`, 6 de la guardia, 3 de Retar sin cifra, 1 de `salasCore` (Infinity) y 1 de INV-46 en `testInvariantes`. Los re-sellos de B4 cambian cifras, no número de pruebas. |
| lint | **21** (20 errores y 1 aviso) | Los mismos de antes, en `CardImage.jsx`, `GameTable.jsx` y `SoundContext.jsx`. Ninguno nuevo; los archivos tocados pasan limpios. |
| build | correcto | |
| `diagSAL sal` | **102/102**, código 0 | El re-sello de `armar-aviso` (B4) pasa en los 6 viewports. |
| `diagDSK humo` | código 0 | `gate`, `lob` y `retar` verdes; `d1d2`, `d3`, `bug` y `shots`, informativos. `lob` y `retar` leen ya la billetera (preview y bypass). |
| `diagDSK rec` | **verde**, código 0 | p1–p7 y anillo; unos 20 min. |
| `diagDSK apu` | **verde** en los 8 tramos, código 0 | Corrido por tramos de viewport (`apu 360x640`, …, `apu 1920x937` y `apu rec2`) para no pasar de 30 min por tarea; unos 49 min en total. |
| `diagDSK saldo` (nuevo) | **verde**, 6 puntos y consola limpia, código 0 | 13 s con `--sin-build`. §4.3. |
| Guardia sobre `dist/` | **verde** (6 pruebas) | Con su control rojo, §4.4. |

**Builds:** la tanda compiló más de una vez (el primer `saldo`, `humo`, dos `npm run build` y la guardia, que compila a una carpeta temporal en cada corrida de vitest). INV-35 pide un solo build por tanda; ningún build coincidió con otro arnés sirviendo `dist/`. La guardia compila siempre en su propia carpeta temporal y no toca `dist/`.

### 4.1 B4, re-sellos

- `salas.test.js`: el bono son 2.500 y una cuenta nueva alcanza `[100, 200, 500]` (5 × 500 = 2.500, el borde exacto entra).
- `salasCore.test.js`: el aviso al anfitrión se apaga en la mesa de 500 y se enciende desde la de 1.000.
- `diagSAL armar-aviso`: el molde pasa a la mesa de 1.000. El texto tiene que decir «Con 1.000 HC», «2.500» y «100, 200 o 500». **Se corrigió también la frase:** con tres apuestas, unirlas siempre con « o » daba «100 o 200 o 500»; ahora es «100, 200 o 500».
- `diagSAL` sigue en 102 puntos: cambian las cifras, no el número de puntos.

### 4.2 Vitest

- `src/hooks/billeteraCore.test.js` (27): lectura y carga; error sin cifra y con cifra; respuesta sin número = fallo; recuperación; el ajuste local con las mismas cuentas de `saldoSesion` (incluido el `max(0, …)` de la recarga); la relectura conserva el ajuste; la billetera es de una cuenta; cuándo leer (sin cuenta, una a una, arranque una vez, primer plano cada 15 s y sin espera tras un fallo, `saldo_insuficiente` y reintento); la API (número, texto a número, nunca rechaza); la billetera falsa (sin bypass no existe; con bypass, 5.000 y las mismas dos claves que la real).
- `scripts/testRetarIAS.test.js` (+3): sin cifra no hay gris, aviso ni «No te alcanza»; `guardaDeSaldo`.
- `src/screens/salasCore.test.js` (+1): `Infinity` es «todavía no se sabe».
- `scripts/arnes/nucleo.test.js`: `mi_billetera` contesta 5.000 por defecto o la cifra pedida; el resto de RPC, `null`.

### 4.3 El modo `saldo` (vara nueva, INV-46)

Contra `vite preview`, con la API real y la billetera servida por el arnés en **3.700**, una cifra que ni la constante vieja ni el bono pueden igualar por azar. Viewport 412×915 de teléfono.

| Punto | Qué mide | Medido |
|---|---|---|
| saldo.1 | La misma cifra en Lobby, Retar, SalaOpciones y ArmarMesa, igual a la servida, con una sola lectura por arranque | «3.700» en las cuatro, `listo`; 1 lectura |
| saldo.2 | Sentarse contra las IAS (Básico · 50, entrada 500), pulsar «Iniciar mano» y abandonar tras el ante | fichas 450; «3.650» en Retar, Lobby, SalaOpciones y ArmarMesa = 3.700 − 500 + 450; sigue 1 lectura |
| saldo.3 | Lectura lenta (2,5 s y 3 s) | Píldora «—», `cargando`, 105,28 × 34,13 px → «3.700», 104,64 × 34,13 (Δ ancho 0,64 px, Δ alto 0). Retar Pro con mesa de 2: 0 apuestas en gris, sin aviso, CTA apagado con «Cargando tu saldo…»; al llegar, 3 en gris (las de piso > 3.700), las esperadas |
| saldo.4 | Lectura fallida (503) | Lobby y Retar con «—» y `error`, nunca una cifra; Retar con «No pudimos leer tu saldo. Revisa tu conexión.» y Reintentar, CTA apagado, 0 en gris. Reintentar → «3.700» y el aviso desaparece. Primer plano (evento `visibilitychange`) → «3.700» sin esperar 15 s |
| saldo.5 | `crear_sala` contesta `saldo_insuficiente` y el servidor baja a 900 | 2.ª lectura; la píldora pasa a «900»; nota «Necesitas 2.500 HC para sentarte a 500»; el chip de 500 se apaga |
| saldo.6 | Dev con bypass, `?apu=saldo:3700`: sala de espera (`?sal=espera-anfitrion`) y Armar una mesa (`?sal=armar`) | «3.700», `listo` en el primer fotograma, en las dos |
| consola | `pageerror` | 0 |

Capturas en `capturas-saldo/` (regenerables, ignoradas por git).

### 4.4 La guardia sobre `dist/`

`scripts/testDistSinMoldes.test.js` compila en una carpeta temporal, en un proceso hijo con `NODE_ENV=production` y además con `VITE_AUTH_BYPASS=1`, que es el peor caso. Comprueba:
- que **no aparecen** la marca de la billetera falsa, `allinHumano` (la tabla de `?apu=`) ni los estados `opciones-fuera-alcance` y `espera-fantasma` de `?sal=`;
- que **sí aparece** `mi_billetera`.

**Control:** el mismo build forzado a modo desarrollo lleva las tres huellas, así que la guardia muerde.

---

## 5. Riesgos y hallazgos

| # | Riesgo o hallazgo | Qué hay | Qué se hizo |
|---|---|---|---|
| R-1 | **Transición PvP (B6), aceptada** | El servidor solo conoce la billetera, no el ajuste local. Ejemplo: billetera 2.500 y +2.600 ganados contra las IAS, así que la píldora dice 5.100 y la mesa de 1.000 sale encendida. El servidor ve 2.500, por debajo de los 5.000 que exige, y contesta `saldo_insuficiente`. Se relee la billetera, sigue en 2.500 y la píldora sigue en 5.100: el jugador ve «Necesitas 5.000 HC para sentarte a 1.000» con 5.100 en la píldora. | Documentado, no se arregla: desaparece en la 1c, cuando el ajuste pase a ser movimientos del libro. |
| R-2 | **`DevLocal` viaja en el bundle de producción** (anterior a la 1b) | La constante `PERFIL_DEV` de `useAuth.js` queda en el bundle como código muerto: el minificador no pliega `Boolean(import.meta.env.DEV && …)`. No es activable (la rama nunca se ejecuta), pero contradice la cabecera del hook. | No se toca en esta tanda. Por eso la guardia de `dist/` no lo incluye: saldría roja por algo que no es de la 1b. Ver P-2. |
| R-3 | **PartidaPvP sin vara de arnés** | El modo `saldo` cubre Lobby, Retar, SalaOpciones, ArmarMesa (preview) y SalaEspera y ArmarMesa (dev). PartidaPvP solo se alcanza al arrancar una mesa, y en el arnés eso es esperar al reloj de la sala. | Recibe la misma prop que las demás (`billetera.saldo`). Queda para el teléfono (§7, prueba 1). |
| R-4 | **La pestaña oculta no se puede medir** (FRZ-1) | Playwright no oculta una pestaña de verdad. `saldo.4` emite `visibilitychange` con la pestaña visible, que es justo lo que el oyente comprueba. | Validación real en el teléfono (§7, prueba 6). |
| R-5 | **Primer plano tras un fallo, sin espera** | El plan decía «al menos 15 s entre lecturas por primer plano». Al escribir la vara d vi que, tras un corte, eso dejaba al jugador hasta 15 s con «—» aunque la red ya hubiera vuelto. | Si la última lectura falló, primer plano lee ya (siempre una a una). Sellado en `billeteraCore.test.js`. |
| R-6 | **La apuesta rechazada cae de la selección** | Tras un `saldo_insuficiente` se relee la billetera. Si la cifra nueva ya no alcanza la mesa elegida, la guarda de saldo la cae al defecto (100), igual que haría la memoria. | La nota sigue hablando de la mesa que el servidor rechazó (`apuestaIntentada` en `ArmarMesa.jsx`): «Necesitas 2.500 HC para sentarte a 500», no «… a 100». Lo mide `saldo.5`. |
| R-7 | **La recarga de la mesa con la cifra caída** | `GameTable` recibe `billetera.saldo ?? 0`. En la práctica nunca es `null` en la mesa: Retar no deja sentarse sin cifra, y un fallo posterior conserva la última. | Comentado en `App.jsx`. |
| R-8 | **`mi_billetera` y los saldos enormes** | Devuelve `bigint`, y PostgREST lo entrega como número JSON. Por encima de 2^53 perdería precisión. | No aplica a una economía de miles de HC; anotado. |

---

## 6. Preguntas al rector

- **P-1 · R-1 en pantalla.** Hasta la 1c, ¿basta con documentarlo, o quiere el rector que en ese caso la nota diga algo distinto (por ejemplo «Lo ganado contra las IAS todavía no cuenta para las mesas con amigos»)? Sería un texto nuevo y una condición (`ajuste > 0` y `saldo_insuficiente`). No lo he hecho.
  - **Respuesta del rector:** solo documentado, sin texto nuevo. Desaparece en la 1c (R-1 / B6).
- **P-2 · `DevLocal` en producción (R-2).** ¿Se abre una tanda corta para que `useAuth.js` use la misma puerta en la primera línea que `siembraAPU` y `salasFixtures`, y añadir `DevLocal` a la guardia de `dist/`? `useAuth.js` no es protegido, pero no es de esta tanda.
  - **Respuesta del rector:** no en esta tanda. Pasa a **ARN-4**: una puerta de una línea en `useAuth.js`, como en `siembraAPU` y `salasFixtures`, y `DevLocal` añadido a la guardia de `dist/`.
- **P-3 · El hueco «—».** ¿Vale el guion largo como «todavía no se sabe», o prefiere el rector un hueco vacío (solo la moneda) o tres puntos? El arnés mide la caja, no el glifo; cambiarlo es una línea.
  - **Respuesta del rector:** se queda «—».
- **P-4 · `humo` y el modo `saldo`.** `saldo` tarda unos 13 s con `--sin-build` y levanta preview y dev. ¿Entra en `humo`, como `lob` y `retar`, o se corre por su nombre como `apu`? Lo he dejado por su nombre.
  - **Respuesta del rector:** se corre por su nombre y no entra en `humo`. Su lugar definitivo se decide en el orquestador de ARN-4.

---

## 7. Pruebas en el teléfono para Victor

**Resultado (2026-10-08):** Victor las corrió por el túnel, contra la base real, en el S25 (`test1976`) y en el Motorola (`ticotest2022`). **Las pruebas 1 a 6 salieron en verde en los dos teléfonos.** La 7 se omitió por decisión del rector: el caso ya lo cubre `saldo.5` en el arnés (un `saldo_insuficiente` que obliga a releer la billetera) y desaparece en la 1c, cuando lo ganado contra las IAS pase a ser movimientos del libro (R-1 / B6).

Con la build en el túnel de siempre, contra la base real. Cada prueba dice qué hacer y qué debe verse.

1. **S25 (`test1976`). Abre la app y entra.**
   - Debe verse: la píldora de arriba dice **2.500** en el inicio, en «Retar a las IAS», en «Jugar contra jugador», en «Armar una mesa» y, si llegas, en la sala de espera.
   - No debe verse **5.000** en ningún sitio.
   - Al entrar puede aparecer un instante una raya «—» en la píldora: es la cifra llegando. No debe salir nunca un 0.
2. **Juega una mesa contra las IAS, gana o pierde algo y sal** (con la ✕ o al terminar).
   - Debe verse: la píldora cambia y dice **la misma cifra nueva** en el inicio, en Retar y en las pantallas de jugar contra jugador.
3. **Recarga la página** (desliza hacia abajo o cierra y abre).
   - Debe verse: la píldora vuelve a **2.500**. Lo ganado o perdido contra las IAS todavía no se guarda; eso llega en la 1c.
4. **Ve a «Jugar contra jugador» → «Armar una mesa».**
   - Debe verse: la apuesta de **1.000 apagada** (no te alcanza: hacen falta 5.000) y la de **500 encendida**.
   - El aviso naranja para invitados nuevos sale con la de **1.000**, no con la de 500, y dice «2.500 HC de bienvenida» y «100, 200 o 500».
   - Si tienes 2.500 justos, una mesa de 500 debe dejarte entrar.
5. **Motorola (`ticotest2022`). Lo mismo que la prueba 1.**
   - Debe verse: también **2.500**, con su propia billetera. Si en el S25 ganaste o perdiste algo, el Motorola no lo ve: cada teléfono lleva lo suyo.
6. **Red cortada.** Pon el teléfono en modo avión, cambia a otra app y vuelve. Quita el modo avión, cambia a otra app y vuelve otra vez.
   - Con la red cortada, la píldora sigue diciendo la última cifra que conocía (nunca 0 ni 5.000).
   - El aviso «No pudimos leer tu saldo» con el botón **Reintentar** solo sale si la primera lectura del saldo falla nada más entrar. En el teléfono es difícil de provocar; lo cubre el arnés (`saldo.4`).
   - Al volver la red y volver a la app, la cifra aparece sola, o pulsando Reintentar.
7. **Un caso raro, solo si te sobra tiempo.** Gana contra las IAS hasta pasar de 5.000 en la píldora y prueba a crear una mesa de 1.000.
   - Debe verse: el servidor dice que no («Necesitas 5.000 HC…»). Es lo esperado hasta la 1c (R-1).

---

## 8. Para Victor antes de la ceremonia de commit

**Borrar a mano `src/lib/saldo.js`** antes de la ceremonia. Es la doctrina de OneDrive: los borrados los hace Victor.

Ya no lo importa nadie. Grep del 2026-10-07 sobre `src/` y `scripts/` (`.js`, `.jsx`, `.mjs`):
- **imports de `lib/saldo`:** ninguno;
- **menciones de `saldoDelJugador` o `SALDO_PROVISIONAL` fuera del propio archivo:** una sola, en un comentario histórico de `src/screens/Lobby.jsx:185` («el respaldo `saldoDelJugador()` era la constante 5.000»). Es un comentario y no rompe nada al borrar.

Con el archivo borrado, vitest, lint y build deben seguir igual. Conviene repetir `npm run build` después de borrarlo, por si acaso.

**Hecho (2026-10-08).** Victor borró el archivo a mano; `git status` lo da como `D src/lib/saldo.js`. Repetido sin él:
- **vitest:** 1.361 en verde;
- **lint:** 21 (20 errores y 1 aviso), los mismos tres archivos de siempre;
- **build:** correcto.

Ningún import se rompió. Grep sobre `src/` y `scripts/`: la única mención que queda de `lib/saldo` es un comentario histórico en `scripts/diagCEL0.mjs:218`, que cuenta cómo era antes.

---

## 9. Cierre de terreno

- **Puertos 4170–5599:** solo el `svchost` del 5040 y el `adb` del 5037 (Android SDK de Victor). Ningún servidor del arnés vivo.
- **`node`:** ninguno vivo.
- **Copias:** no se hizo ninguna copia del repo en esta tanda; no hay uniones que quitar.
- **Restos fuera del repo:** quedó la carpeta temporal `%LOCALAPPDATA%\Temp\tmp.jeL2rJbn59`, del primer build de prueba a mano, cuyo borrado fue denegado. **Corrección (2026-10-08): no estaba vacía, como dije.** Contenía un build completo (`dist/` con `assets`, `emoji`, `icons` y `sounds`). Mi comprobación de entonces no imprimió el recuento de archivos y la di por vacía sin mirarla de otra forma. Victor la revisó y la borró a mano el 2026-10-08. La guardia de vitest borra sola su carpeta en cada corrida.
- **`git status`:** los 31 archivos cambiados y los 7 nuevos de §1 (incluido este informe), más los 5 residuos de MOT-1 de siempre (dos informes de MOT-1 y `laminas/mon1/{_entorno.txt, lamina.html, tiempos.json}`). Desde el 2026-10-08, además, el borrado de Victor: `D src/lib/saldo.js`. Sin `git add` ni commits.

---

## 10. Para ARN-4

Lo que esta tanda deja pendiente para ARN-4, por decisión del rector:

1. **`DevLocal` en producción (P-2).** Una puerta de una línea en `useAuth.js`, como en `siembraAPU` y `salasFixtures`, y `DevLocal` añadido a las huellas prohibidas de `scripts/testDistSinMoldes.test.js`.
2. **El sitio del modo `saldo` (P-4).** Hoy se corre por su nombre (`node scripts/diagDSK.mjs saldo`). Su lugar definitivo lo decide el orquestador de ARN-4.
3. **El coste de la guardia sobre `dist/`.** Compila la app entera en cada corrida de vitest. Medido el 2026-10-08, tres corridas de cada caso en esta máquina:

| Caso | Tiempo de pared de vitest | Tiempo sumado de las pruebas |
|---|---|---|
| Vitest completo (56 archivos, 1.361 pruebas) | 2,00 · 2,06 · 2,10 s | 8,92 · 9,09 · 9,37 s |
| Vitest sin la guardia (`--exclude`, 1.355 pruebas) | 2,05 · 2,04 · 2,07 s | 7,94 · 8,00 · 8,08 s |
| La guardia sola | 0,62 · 0,56 · 0,57 s | 0,49 · 0,43 · 0,44 s |

   - **En tiempo de pared no añade nada medible:** corre en paralelo con los otros archivos y la build de hoy tarda unos 250 ms (rolldown).
   - **En trabajo sí:** suma alrededor de 1 s al tiempo total de las pruebas (de unos 8,0 a unos 9,1 s) y lanza un proceso hijo con un build completo en cada corrida, también en modo `watch` cuando se toca algo que la reejecuta.
   - **Crecerá con la app:** el coste es el de un `vite build`. Si un día pesa, ARN-4 puede sacarla a un comando propio (por ejemplo, junto al build de la ceremonia de commit) o compilar una sola vez para todas las guardias de `dist/`.
