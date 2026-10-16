# AJILEI · IOS-1 · Fase 1c — El saldo al volver y el Bautizo reforzado · Informe v1.0

- **Ficha:** `docs/AJILEI_IOS-1_Fase1c_v1.0.md` (rector), con el STOP-1 aprobado el 2026-10-16 y las elecciones de Victor en la lámina.
- **Base:** `main` en `65ad9eb`. **Estado:** STOP-3, validada por Victor en Android y PC el 2026-10-16 (§7); las pruebas del iPhone, tras el push, en ajilei.io. Mapa de commits en §8. Sin migraciones ni `db push`.
- **Lámina:** `laminas/ios1c/` (fuera de los commits; Victor la borra tras el push).

---

## 0 · En una página

1. **El «—» de 30 s (F-7) baja a unos 9 s sin cifra, y a 0 con cifra recordada.** Con peticiones que tardan 30 s:

   | Sonda | Hoy (`65ad9eb`) | Con el arreglo |
   |---|---|---|
   | a · arranque, sin cifra recordada | **30,1 s** de «—» | **9,0 s** de «—» |
   | a2 · arranque, con cifra recordada | «—» y el botón de Retar apagado mientras dure | **0 s**: la cifra recordada, atenuada, y el botón funciona |
   | b · salir con `salir_ia` colgada | **29,9 s** de «—» | **9,0 s** de «cobrando» |
   | c · salir con un aviso de fichas colgado delante | **27,1 s** de «—» | **6,2 s** de «cobrando» |

2. **Ninguna petición sin tope.** Todo el HTTP del cliente de Supabase lleva un tope de 8 s en un solo sitio (`src/lib/red.js`, enchufado en `src/lib/supabase.js`). Pasado el tope, la petición es un fallo de red y arrancan los reintentos que ya existían.
3. **La red caída ya no lleva a la Portada ni al Bautizo.** Con el token caducado y sin red, hoy el SDK dice «no hay sesión» y la app pinta la Portada (medido: de los 25,6 s a los 85,6 s, aunque la red volvió a los 32 s); con un perfil que no se pudo leer, el Bautizo. Ahora sale «No pudimos cargar tu cuenta» (escena g), que se reintenta sola.
4. **El Bautizo** juzga el nombre sin los espacios del principio y del final, y avisa solo cuando el nombre no vale. «Guardando…», «Entrando…» y «Enviando…» terminan en el tope.
5. **Varas:** vitest **1.605** (base 1.574: +31), lint 21 (igual), build bien (+1,7 kB gzip en el JS principal y +0,24 kB en el CSS). `diagDSK saldo` 14/14 en verde; las ocho celdas nuevas, rojas contra `65ad9eb` (§3). Sin regresiones en los demás modos (§4).

---

## 1 · Lo que se hizo

### 1.1 · El tope de red (S5)

- **Dónde:** `src/lib/red.js` exporta `fetchConTope(fetch, ms)` y `TOPE_RED_MS = 8000`. `src/lib/supabase.js` se lo pasa al cliente como `global.fetch`, así que vale para las RPC, las tablas y la autenticación (`supabase-js/src/SupabaseClient.ts:343-348` y `:366-409`). El tiempo real va por websocket y no pasa por aquí.
- **La sesión.** Para la autenticación, un fetch cancelado es un `AuthRetryableFetchError` (`auth-js/src/lib/fetch.ts:230-235`), y la sesión solo se borra con un error no reintentable (`GoTrueClient.ts:5101-5124`). Lo sella `src/hooks/authRed.test.js`.
- **Dependencia declarada** (respuesta 1 del rector al STOP-1): el refresco cortado por el tope se reenvía a los 200 ms con el mismo token de refresco, y Supabase lo acepta durante su intervalo de reuso, **10 s por defecto, sin tocar**. Si alguien baja ese intervalo por debajo de 10 s, el tope de 8 s pasa a ser un riesgo: cortar un refresco que sí llegó podría dejar la sesión muerta. Está escrito en la cabecera de `red.js` y en INV-56.
- **El dinero:** todas las funciones que lo mueven son idempotentes (tabla del STOP-1, sin cambios): `sentarse_ia` por token, `recargar_ia` e `informar_pila` por `seq`, `salir_ia` por mesa cerrada, `marcar_ingreso` por día, `cobrar_boleto` por boleto. Las celdas saldo.9 y saldo.10 lo comprueban en el banco imitado: una sola `salida_ia` en el libro aunque la salida se mande dos veces.
- **Las esperas de pantalla** (S7) terminan a los **10 s** (`TOPE_ESPERA_MS`): el tope y un margen de 2 s para el primer reintento que el SDK hace solo. Sin el margen, en el refresco lento la tarjeta g asomaba un instante justo antes de que contestara ese reintento (§6, desviación 1).

### 1.2 · La lectura del saldo y la vuelta a primer plano

- `src/hooks/billeteraCore.js`: una lectura en vuelo **caduca** a los 8 s (`CADUCIDAD_LECTURA_MS`). Hace falta además del tope del transporte porque el SDK espera a tener un token válido antes de cada consulta (`supabase-js/src/lib/fetch.ts:81`), y esa espera no la cubre ningún tope.
- `src/hooks/useBilletera.js`: cada lectura lleva su número; la que caducó y contesta tarde se tira. Tras un fallo, con la app a la vista, la lectura **se reintenta sola** con la escalera de la mesa (1, 2, 4, 8 y 15 s); oculta, se para.
- `src/lib/controlMesaIA.js`: `reintentarAhora({ forzarTrasMs })` fuerza solo lo que lleve en vuelo más que el tope, con el mismo `seq`. `App.jsx` lo usa al volver a primer plano.

### 1.3 · La píldora (S1–S4) y Retar

- **La cifra recordada** (`src/lib/saldoRecordado.js`, clave `ajilei.saldoVisto`, censada en `scripts/testClavesAlmacen.test.js`): una entrada `{ uid, saldo, en }`. Se escribe solo con cifras del servidor, solo la lee su cuenta y se borra al cerrar sesión o al llegar a SIN_SESION.
- **El hook devuelve un campo aparte, `recordado`.** `saldo` sigue nulo sin cifra del servidor, así que ningún juez la ve (el mapa del STOP-1, §3).
- **La píldora** (`BarraSuperior.jsx`, `src/styles/pildora.css`): la cifra recordada atenuada y con pulso (b2) y, al llegar la real, cambio directo (c-A); mientras se cobra una salida, tres puntos (d3). Con movimiento reducido, sin animación.
- **Retar** (`RetarIAS.jsx`): con la cifra recordada el botón dorado se enciende (S4) y `juicio` sigue sin juicio; mientras se cobra, el botón espera con «Cobrando tu mesa…». Con la cifra recordada no sale «No pudimos leer tu saldo»: la lectura se reintenta sola.
- **V-2** (respuesta 2): un fallo de red de la salida ya no suelta el «cobrando» (`App.jsx`, `escucharMesa`); se suelta con una respuesta que no sea `ok` ni `repetido`.

### 1.4 · La puerta y el Bautizo (S6, S7)

- `src/hooks/useAuth.js`, estado nuevo **SIN_RED**: la sesión o el perfil no se pudieron saber por la red.
  - **La sesión:** el INITIAL_SESSION nulo se ignora y decide `getSession()`, con tope. Un `AuthRetryableFetchError` (el token caducado y sin red: `GoTrueClient.ts:3100-3122`) es SIN_RED, no SIN_SESION (respuesta 3).
  - **El perfil:** «no hay fila» (`data: null, error: null`) lleva al Bautizo; un `error` (tope, red, 5xx) es SIN_RED y se vuelve a leer con la escalera.
  - `src/components/CuentaSinRed.jsx`: la escena g con su texto exacto.
- **Guardando…:** con tope, y ante un fallo de red o un 23505 se relee el perfil; si ya es suyo, está hecho (la inserción que llegó y cuya respuesta se perdió).
- **Entrando… y Enviando…:** con tope; un fallo de red dice «No contesta el servidor — revisa tu conexión e inténtalo de nuevo» en vez de «Código incorrecto o vencido».
- `src/screens/bautizoCore.js` y `Bautizo.jsx` (f2): se juzga y se envía el nombre recortado; el campo se limpia al salir de él o tras 1,2 s sin teclear; la línea fija de la regla se quita y el aviso «De 6 a 15 letras, números o _, sin espacios» sale solo cuando el nombre no vale. `autoCorrect="off"`. El ejemplo «tunombre» no cambia.

---

## 2 · El tope, medido

**Se queda en 8 s.** Lo que el arnés puede medir es el EFECTO del tope, no la latencia de la red del teléfono:

| Qué | Con 8 s |
|---|---|
| Una lectura del saldo colgada: «—» hasta la cifra (saldo.7) | 9,0 s: el tope y el primer reintento (1 s) |
| Una salida colgada: «cobrando» hasta la cifra (saldo.9) | 9,0 s |
| Un aviso de fichas colgado delante de la salida (saldo.10) | 6,2 s: el aviso salió unos 2,5 s antes de levantarse |
| El perfil colgado: la tarjeta g y la entrada (saldo.13) | la tarjeta a los 8,1 s y el lobby a los 9,1 s |
| El refresco del token colgado (saldo.14 a) | la cifra recordada a los 8,3 s y la real a los 8,4 s, sin pasar por la tarjeta g |

**Por qué no menos:**
- Las funciones de dinero hacen varias escrituras en una transacción (el libro, la billetera y la mesa). En una red móvil mala, 3–5 s legítimos no son raros. Un tope corto convertiría respuestas lentas pero buenas en fallos y reintentos (que no cobran dos veces, pero que el jugador vería como «No pudimos abrir la mesa»).
- El intervalo de reuso del token de refresco, 10 s, pide un tope por debajo (§1.1).

**Por qué no más:** con cifra recordada el jugador ya no ve el «—», pero sí ve «cobrando» y la tarjeta g. Cada segundo de tope es un segundo más de esas esperas cuando de verdad no hay red.

**Lo que no se midió:** la latencia real de Supabase desde el iPhone por la red de Victor. Desde aquí no se conecta a la base (regla de la ficha) y el arnés no imita la red real. La validación por túnel lo dirá (pregunta 1 de §9).

---

## 3 · Las celdas nuevas del modo `saldo`: rojas contra la base, verdes con el arreglo

Dos corridas de `diagDSK saldo` con el MISMO arnés (el de este árbol):
- **contra la base:** un árbol aparte de `65ad9eb` en el scratchpad, con su `dist/` y el arnés nuevo copiado encima. Las variables de entorno se leen del repo (`envDir`), sin copiar el `.env.local` fuera de él;
- **contra el arreglo:** el árbol de trabajo.

Las dos, con el aislamiento (D6) en verde y 0 escapadas.

| Celda | Contra `65ad9eb` | Con el arreglo |
|---|---|---|
| saldo.1 a saldo.6 (ECO-1b) | ✓ | ✓ |
| **saldo.7** · arranque, lectura colgada 30 s, sin cifra recordada | ✗ «—» **30,1 s** | ✓ «—» **9,0 s** |
| **saldo.8** · con cifra recordada (300) | ✗ «—», botón de Retar **apagado**, no se sienta | ✓ «300» atenuada; botón encendido, 0 mesas en gris, sin bloque del video; se sienta |
| **saldo.9** · `salir_ia` colgada 30 s | ✗ «—» **29,9 s**, nota «Cargando tu saldo…» | ✓ tres puntos **9,0 s**, nota «Cobrando tu mesa…»; una sola `salida_ia` en el libro |
| **saldo.10** · `informar_pila` colgado delante | ✗ «—» **27,1 s** | ✓ tres puntos **6,2 s**; una sola `salida_ia` |
| **saldo.11** · de quién es el recuerdo | ✗ no se escribe nada | ✓ la de otra cuenta no sale; se escribe `{uid, 3.700}`; «Cerrar sesión» la borra |
| **saldo.12** · sin red un rato | ✗ «—»; **1 lectura** en 16 s; botón apagado; vuelta la red, la cifra **no llega sola** en 20 s | ✓ «3.200» atenuada todo el rato; **5 lecturas** en 16 s; «No pudimos abrir la mesa. Revisa tu conexión…»; la cifra sola a los 13,3 s |
| **saldo.13** · el perfil | ✗ colgado: «Cargando» **30,1 s** sin salida; caído: **al Bautizo** | ✓ colgado: la tarjeta a los 8,1 s y el lobby a los 9,1 s; caído: la tarjeta a los 7,1 s y el lobby solo a los 15,1 s (la red volvió a los 14 s); nunca el Bautizo. Control (sin perfil): al Bautizo, en las dos |
| **saldo.14** · el token caducado | ✗ refresco colgado: «Cargando» **30,1 s**. Sin red 32 s: **la Portada** de los 25,6 s a los 85,6 s | ✓ refresco colgado: la cifra recordada a los 8,3 s y la real a los 8,4 s, sin tarjeta g. Sin red 32 s: la tarjeta g de los 10,1 s a los 85,6 s, **nunca la Portada**, y el lobby con la cifra recordada |

**Los 85,6 s de saldo.14, en las dos:** la red vuelve a los 32 s, pero el SDK guarda el fallo de un refresco 60 s por token (`REFRESH_FAILURE_COOLDOWN_MS`, `auth-js/src/GoTrueClient.ts:4975-4996`) y nadie puede adelantarlo: ni el reintento de la app ni el botón. Es un límite del SDK (§6, desviación 6).

**Lo que confirman las dos corridas:** en todos los casos la cifra final es la correcta (el banco imitado lo comprueba). Como dijo el rector en la Fase 0, nunca se contó mal: se enseñaba tarde.

---

## 4 · Regresiones

Todo contra `vite preview` en el 4173, con `--sin-build` sobre el `dist/` del arreglo y el aislamiento (D6) en verde en todos.

| Vara | Resultado | Nota |
|---|---|---|
| `diagDSK saldo` | verde, 14/14 | 3 min 17 s (antes, 14 s: las celdas nuevas esperan a los 30 s de la base y a los 60 s del SDK) |
| `diagDSK lob` | verde | |
| `diagDSK retar` | verde | |
| `diagDSK video` | verde | |
| `diagDSK tam` | verde | |
| `diagDSK constancia` | verde | |
| `diagDSK mesaia` | verde, tras ajustar mesaia.9 | la primera pasada salió roja en mesaia.9: su red era «toda recarga tarda 14 s», que con el tope nunca contesta (§6, desviación 7) |
| `diagPUE puerta` | verde, 7/7 | |
| `diagPUE bie` | verde, 12/12 | la puerta y el «Cargando» de BIE-1 |

**El teléfono en vertical, idéntico donde no cambia nada a propósito.** Sonda de paso del scratchpad: la base (`65ad9eb`) y el arreglo, cada uno en su preview, con la cifra del servidor (3.700), en 412×915, 390×844, 360×640 y 1366×768.
- **Retar, Salas y Armar mesa:** 12 de 12 PNG idénticos byte a byte.
- **El lobby** no se puede comparar entero: su marca y el avatar llevan animación, y la base contra sí misma también difiere en las 4 vistas. Recortado a la barra superior sin el avatar (la píldora, la ficha y el engranaje), sale igual que la base en las 4. En la de 390, la base contra sí misma difiere en esa franja, y su segunda captura coincide con la del arreglo.

**Fuera de lo medido:** la mesa no cambia (solo `controlMesaIA`, sellado por vitest y por `mesaia`). La sala de espera y la partida PvP solo pasan dos props nuevas a la píldora; el punto saldo.6 las lee.

---

## 5 · Las piezas, archivo por archivo

| Archivo | Qué cambia | Líneas |
|---|---|---|
| `src/lib/red.js` (nuevo) | `fetchConTope`, `conTope`, `TOPE_RED_MS` (8 s) y `TOPE_ESPERA_MS` (10 s); la dependencia del intervalo de reuso, en la cabecera | 81 |
| `src/lib/supabase.js` | el cliente con `global.fetch: fetchConTope(…)` | +13 −1 |
| `src/lib/saldoRecordado.js` (nuevo) | la clave `ajilei.saldoVisto`, protegida | 49 |
| `src/hooks/billeteraCore.js` | la caducidad de la lectura, `esperaReintento` y `recordadoPara` | +46 −1 |
| `src/hooks/useBilletera.js` | la lectura con número, el reintento con escalera, el recuerdo (escribir y leer) y el campo `recordado` | +73 −9 |
| `src/lib/controlMesaIA.js` | `reintentarAhora({ forzarTrasMs })` | +14 −1 |
| `src/App.jsx` | la vuelta a primer plano con `forzarTrasMs`; V-2 sin soltar al primer fallo; SIN_RED; `cerrarSesion` que borra el recuerdo | +45 −8 |
| `src/hooks/useAuth.js` | SIN_RED, `esFalloDeRed`, la sesión y el perfil con tope y reintento, «Guardando…» con relectura, mensajes de red | +176 −29 |
| `src/components/CuentaSinRed.jsx` (nuevo) y `src/styles/puerta.css` | la escena g | 33 y +10 |
| `src/components/BarraSuperior.jsx`, `src/components/PantallaChips.jsx` y `src/styles/pildora.css` (nuevo) | la píldora: b2, c-A y d3 | +22 −2, +5 y 45 |
| `src/screens/RetarIAS.jsx` y `src/config/textos.es.js` | el botón con la cifra recordada y la nota «Cobrando tu mesa…» | +19 −3 y +1 |
| `src/screens/Lobby.jsx`, `ArmarMesa.jsx`, `SalaOpciones.jsx`, `SalaEspera.jsx` y `PartidaPvP.jsx` | pasan `recordado` y `cobrando` a la píldora | +2 cada una |
| `src/screens/bautizoCore.js` (nuevo) y `src/screens/Bautizo.jsx` | f2: el nombre recortado, el aviso, `autoCorrect="off"`; se quita la línea fija | 41 y +47 −12 |
| Pruebas | `red.test.js` (7), `saldoRecordado.test.js` (5), `bautizoCore.test.js` (6), `authRed.test.js` (5), `billeteraCore.test.js` (+6), `controlMesaIA.test.js` (+1) y `testClavesAlmacen.test.js` (la clave nueva) | — |
| `scripts/eco/mesaia.mjs` | mesaia.9: el escenario del caso «tope» y su vara de envíos (§6, desviación 7) | +7 −2 |
| Arnés | `scripts/cap/capMesa.mjs` (los mandos de la cuenta y los retrasos con `veces`; la respuesta tardía a una petición ya cancelada no rompe el arnés) y `scripts/diagDSK.mjs` (saldo.7 a saldo.14) | +68 −8 y +304 |
| Doctrina | `docs/AJILEI_Invariantes_v1.0.md` (INV-46 ampliada, INV-56 nueva, el recuento) y este informe | — |

**Protegidos:** ninguno tocado. Sin migraciones ni `db push`. CSS aditivo y sin `!important`: `pildora.css` es nueva, y `puerta.css` gana una regla con su clase propia. La regla `.bautizo-regla` de `bautizo.css` se queda sin uso, pero no se borra: quitarla es otra tanda.

---

## 6 · Desviaciones de la ficha

1. **Las esperas de pantalla terminan a los 10 s, no a los 8.** «Cargando», «Entrando…», «Enviando…» y «Guardando…» usan `TOPE_ESPERA_MS` = el tope de red + 2 s. Con el refresco de sesión cortado a los 8 s, el SDK lo reenvía a los 200 ms; sin el margen, la tarjeta g asomaba un instante justo antes de que contestara (lo habría visto saldo.14). Las peticiones siguen cortándose a los 8 s.
2. **Hace falta una caducidad propia de la lectura, además del tope del transporte.** El SDK espera a tener un token válido ANTES de mandar cada consulta (`supabase-js/src/lib/fetch.ts:81`), y esa espera (un refresco en curso) no la corta ningún tope de fetch. Por eso la billetera da por perdida su propia lectura a los 8 s (§1.2). Estaba anunciado en el STOP-1.
3. **Con la cifra recordada no sale «No pudimos leer tu saldo» en Retar.** La lectura se reintenta sola y la escena e (aprobada) no lo lleva. Sin cifra recordada, sale como hoy.
4. **SIN_RED también para la sesión, no solo para el perfil** (respuesta 3): es la misma tarjeta.
5. **El arnés:** `contextoCap` gana un objeto vivo `cuenta` y los retrasos con `veces`, y su ruta ignora la respuesta tardía a una petición que la app ya canceló. El corte de red del token usa `route.abort('failed')`: el vigía del aislamiento (D6) solo reconoce como corte del arnés `ERR_FAILED`, `ERR_ABORTED` y `ERR_BLOCKED_BY_CLIENT`. Con `internetdisconnected`, la primera pasada salió verde pero con «7 escapadas» (código 2), falsas.

---

6. **Un límite del SDK que no se puede rodear:** tras rendirse refrescando la sesión (unos 25 s sin red), el SDK guarda el fallo **60 s** por token de refresco y no vuelve a intentarlo antes. La app ya no pinta la Portada, pero la tarjeta g puede quedarse hasta un minuto después de volver la red. Rodearlo exigiría tocar la sesión por debajo del SDK; no se hace.

7. **`mesaia.9` (de la 1c de ECO-1, INV-53), ajustada.** Su caso «tope» modelaba una red en la que TODA `recargar_ia` tarda 14 s. Con el tope de 8 s, esa petición se corta siempre y se reintenta sola: nunca contesta, y la salida que espera detrás no sale. Además, la vara exigía exactamente 2 envíos (el original y el reintento forzado), y ahora hay también los del tope. El escenario pasa a ser «las tres primeras recargas se cuelgan y luego la red vuelve» (`{ ms: 14000, veces: 3 }`), y la vara a «2 o más envíos, todos con el MISMO `seq`». Se quedan todas las demás condiciones: la tarjeta del tope a los 10 s (10,05 s medido), ninguna recarga cobrada al tope, una sola recarga y una sola salida en el libro, la salida detrás de la recarga y el saldo exacto. Es un cambio de escenario por el tope, no un recorte; lo decide el rector (pregunta 4).

---

## 7 · La lista de pruebas de Victor (por túnel)

Túnel de siempre: `npm run build` · `npx vite preview --host` · `npx cloudflared tunnel --url http://localhost:4173`. **En el iPhone, instala la dirección del túnel en la pantalla de inicio** (Compartir → «Añadir a pantalla de inicio»): el fallo se vio en la app instalada. La primera vez que abras la app instalada no hay cifra recordada (es otro almacén que Safari): juega una vez para que la haya.

| # | Aparato | Qué hacer | Qué tiene que pasar |
|---|---|---|---|
| 1 | iPhone (app) y otro aparato | **El caso original.** Misma cuenta en los dos. Juega una mesa en el iPhone; abre una mesa en el otro aparato; vuelve al iPhone | La píldora enseña la cifra atenuada con pulso (o los tres puntos, si venías de salir de una mesa) unos segundos, y pasa a la real. **Nunca 30 s de «—»** |
| 2 | iPhone (app) | En una mesa, **bloquea el iPhone 1 minuto**, vuelve y sal con la ✕ | Los tres puntos duran poco (como mucho unos 10 s) y la cifra final cuadra |
| 3 | iPhone (app) | Deja la app **10 minutos en segundo plano** y vuelve | La cifra atenuada y luego la real. Si la app arrancó de nuevo, igual: la atenuada desde el primer momento |
| 4 | iPhone (app) | **Modo avión** y abre la app | La cifra atenuada se queda y no hay «—» eterno. Si la sesión tenía que refrescarse, sale «No pudimos cargar tu cuenta» (nunca la pantalla del correo). Toca «Retar» y prueba a sentarte: «No pudimos abrir la mesa. Revisa tu conexión y vuelve a intentarlo.». Quita el modo avión: la cifra real llega sola. Si salió la tarjeta, se va sola, pero puede tardar hasta un minuto más (§6, desviación 6) |
| 5 | iPhone (app) | Con la cifra atenuada en pantalla, entra en Retar | **El botón dorado funciona**, y ninguna mesa sale en gris por la cifra atenuada |
| 6 | S25 | La píldora, Retar, una mesa y su salida | Todo como siempre. La cifra del servidor sale igual que hoy |
| 7 | (opcional, con un correo sin usar) | En el Bautizo, escribe un nombre con un espacio al final, otro con un espacio en medio y otro con «ñ» | El del espacio al final vale (botón dorado) y el espacio se quita al salir del campo; los otros dos, el aviso «De 6 a 15 letras, números o _, sin espacios» al momento. Ya no está la línea fija de la regla |
| 8 | SQL Editor | Al final, la consulta de abajo | `diferencia` = 0 en cada cuenta, `salidas_dobles` = 0 |

**La consulta de comprobación (prueba 8).** De solo lectura: no escribe nada y no se guarda. Una fila por cada cuenta con movimientos desde el 16-oct (hora de Chicago).

```sql
-- IOS-1c · prueba 8 · solo lectura. Una fila por cuenta usada desde el 16-oct.
-- diferencia = 0: la billetera es la suma de su libro.
-- salidas_dobles = 0: ninguna mesa cobró su salida dos veces (el tope reintenta).
select p.username,
       b.saldo                                        as saldo_billetera,
       coalesce(sum(m.monto), 0)                      as suma_libro,
       b.saldo - coalesce(sum(m.monto), 0)            as diferencia,
       count(*) filter (where m.creado_en >= timestamptz '2026-10-16 00:00 America/Chicago') as movimientos_desde_16oct,
       (select count(*) from (
          select s.ref_id from public.movimientos s
           where s.jugador_id = p.id and s.tipo = 'salida_ia'
           group by s.ref_id having count(*) > 1) d)  as salidas_dobles,
       (select count(*) from public.mesas_ia t
         where t.jugador_id = p.id and t.estado = 'abierta') as mesas_abiertas
  from public.profiles p
  join public.billeteras b on b.jugador_id = p.id
  left join public.movimientos m on m.jugador_id = p.id
 group by p.id, p.username, b.saldo
having max(m.creado_en) >= timestamptz '2026-10-16 00:00 America/Chicago'
 order by p.username;
```

`mesas_abiertas` puede ser 1 si dejaste una mesa sin salir: es lo esperado (la recoge el arranque).

### 7.1 · Resultados de Victor (2026-10-16, por túnel, en Android y PC)

Sin el iPhone ni el iPad ese día. La lista se adaptó a los aparatos que había; **10 de 10 bien**.

| # | Aparato | Qué se hizo | Resultado |
|---|---|---|---|
| 1 | S25 y PC, la misma cuenta (test1976) | El caso original: jugar en uno, abrir mesa en el otro, volver al S25 | Los tres puntos un instante y la cifra correcta; sin «—» largo |
| 2 | S25 | Bloqueado 1 min en una mesa, salida con la ✕ | La cifra correcta; los tres puntos ni se vieron |
| 3 | S25 | 10 min en segundo plano | Directamente la cifra real |
| 4 | Motorola | Modo avión | La cifra nunca se fue (la app seguía viva); el botón dorado encendido; al sentarse, «No pudimos abrir la mesa…»; al quitar el modo avión, todo normal |
| 5 | Laptop, Chrome con «Slow 4G» (Chrome ya no ofrece «Slow 3G») | Retar, sentarse, una mano y salir | Sin avisos de red falsos: **el tope de 8 s no es corto** |
| 6 | Laptop, Chrome «Offline» | Sentarse sin red y volver | El aviso de red al sentarse; la cifra se queda; al volver la red, todo sigue |
| 7 | Laptop | Retar con la rueda | Se sigue alcanzando: la 1b, intacta |
| 8 | PC | Cerrar sesión con test1976 y entrar con ticotest2022 | Nunca se ve la cifra de la otra cuenta |
| 9 | S25 | Una mesa completa, el video del «+» y la ficha de la constancia | Como siempre |
| 10 | SQL Editor | La consulta de la prueba 8 | `diferencia` = 0 y `salidas_dobles` = 0 en las tres cuentas (2Alejandro, test1976 y ticotest2022) |

**Pendiente:** las pruebas del iPhone (1 a 5 de la lista de arriba), que Victor hará en ajilei.io tras el push, con la app instalada de verdad. La prueba 7 (el Bautizo) sigue siendo opcional.

**Observaciones de Victor, fuera de esta tanda:**
- **Sin red, el logotipo del lobby no aparece:** el recurso no estaba guardado. Para la 1f: revisar si ajilei.io guarda esos recursos para usarlos sin red.
- **En la laptop no debería hacer falta desplazar en Retar:** va a la lámina de la 1d.
- **En la mesa hay que desplazar para «Iniciar mano»:** es la banda 601–676 y va a TAB-1.

---

## 8 · Tiempo y cierre de terreno

**Tiempo de Claude Code:**

| Tramo | Duración |
|---|---|
| STOP-1 (el plan y la lámina) | unos 15 min, el 16-oct de 14:10 a 14:25 |
| STOP-2 (código, celdas, pasadas, regresiones e informe) | unos 75 min, de 15:18 a 16:33 |
| STOP-3 (informe, registro y comprobación por commit) | unos 5 min, de 18:23 a 18:28 |
| **Total** | **unos 95 min**, frente a los 135–150 estimados en el STOP-1 y dentro del tope de 2 h 30 |

Gran parte del STOP-2 fue espera de las pasadas: cuatro de `saldo` en cada árbol, y las regresiones en cadena. No se recortó ninguna vara.

**Cierre de terreno** (comprobado a las 16:33 del 16-oct):
- **Puertos y procesos:** nadie escucha en 4173, 4195, 4196, 5173 ni 5174, y no queda ningún `node` vivo.
- **Copias en el repo:** ninguna. El `node_modules` del repo, intacto.
- **Fuera del repo,** en `…\scratchpad\ios1c\`, están el árbol de control de la base (`base/`, con su `dist/` y ya sin la unión a `node_modules`), su `base.tar`, las sondas y los logs. Se van con la carpeta.
- **`git status --short`:** lo de esta tanda, más `laminas/ios1c/` y lo que ya estaba fuera (los 2 informes de MOT-1 y `laminas/mon1/` ×3). Sin `git add` ni commits.

**STOP-2.** Se paró aquí.

**El mapa de commits** (STOP-3), en el orden de la ficha: núcleo → pantallas → arnés y pruebas → doctrina e informe. Cada commit con `git add` de sus rutas, nunca `-A`; `laminas/ios1c/` queda fuera.

| # | Commit | Archivos |
|---|---|---|
| 1 | Núcleo: el tope de red, la lectura que no se cuelga y la cifra recordada | 11: `src/lib/red.js`, `red.test.js`, `supabase.js`, `saldoRecordado.js`, `saldoRecordado.test.js`, `controlMesaIA.js`, `controlMesaIA.test.js`; `src/hooks/billeteraCore.js`, `billeteraCore.test.js`, `useBilletera.js`; `scripts/testClavesAlmacen.test.js` |
| 2 | Pantallas: la píldora, Retar, el Bautizo y la puerta | 18: `src/App.jsx`; `src/hooks/useAuth.js`, `authRed.test.js`; `src/components/CuentaSinRed.jsx`, `BarraSuperior.jsx`, `PantallaChips.jsx`; `src/styles/puerta.css`, `pildora.css`; `src/config/textos.es.js`; `src/screens/RetarIAS.jsx`, `Lobby.jsx`, `ArmarMesa.jsx`, `SalaOpciones.jsx`, `SalaEspera.jsx`, `PartidaPvP.jsx`, `Bautizo.jsx`, `bautizoCore.js`, `bautizoCore.test.js` |
| 3 | Arnés: saldo.7 a saldo.14 y mesaia.9 | 3: `scripts/cap/capMesa.mjs`, `scripts/diagDSK.mjs`, `scripts/eco/mesaia.mjs` |
| 4 | Doctrina e informe | 2: `docs/AJILEI_Invariantes_v1.0.md`, `docs/reportes/AJILEI_IOS-1_Fase1c_Informe_v1.0.md` |

`testClavesAlmacen` va en el 1 porque la clave nueva nace allí, y sin ella el commit no pasaría vitest. El registro va con el informe porque INV-56 lo cita y `testInvariantes` exige que exista.

**Cada commit, por sí solo** (exigencia del rector), comprobado en un árbol aparte del scratchpad y sin tocar el de Victor:
- el árbol es `git archive` de `65ad9eb`, con `node_modules` por una unión que se quita al acabar;
- las variables se leen del repo (`envDir` en el `vite.config.js` de la copia, que no entra en ningún commit);
- se le añaden los archivos de cada commit en el orden del mapa;
- en cada paso corren `npx vitest run` y `npx vite build`.

| Estado | vitest | build |
|---|---|---|
| `65ad9eb` | 64 archivos · 1.573 + 1 saltada (1.574) | bien |
| + 1 núcleo | 66 · 1.592 + 1 saltada (1.593) | bien |
| + 2 pantallas | 68 · 1.603 + 1 saltada (1.604) | bien |
| + 3 arnés | 68 · 1.603 + 1 saltada (1.604) | bien |
| + 4 doctrina e informe | 68 · 1.604 + 1 saltada (1.605) | bien |

La saltada es `scripts/testBancoBandas.test.js`: sus volcados no viajan con `git archive`. En el árbol de Victor pasan las 1.605. Al final, la copia es igual byte a byte al árbol de Victor en los 34 archivos, y `git status` no tiene nada de la tanda fuera del mapa.

**Cierre de terreno del STOP-3** (18:25 del 16-oct):
- nadie escucha en 4173, 4195, 4196, 5173 ni 5174, y no queda ningún `node` vivo;
- el `node_modules` del repo, intacto;
- la copia `porcommit/` (sin unión) y su `.tar` quedan en el scratchpad, con `base/`.

**STOP-3.** Paro antes del primer `git add`.

---

## 9 · Preguntas al rector, y sus respuestas (2026-10-16)

1. **El tope, en el teléfono real.**
   - **Respuesta: se queda en 8 s.** Si en el iPhone salen avisos de red con buena señal, se mira con datos. La autenticación tiene que quedar siempre por debajo de los 10 s del intervalo de reuso. La prueba 5 de Victor (Slow 4G, sin avisos falsos) ya lo apoya.
2. **`.bautizo-regla` sin uso.**
   - **Respuesta: se borra en la 1f.**
3. **La cifra recordada en la app instalada de iOS.**
   - **Respuesta: sí,** basta con anotar que la primera vez en la app instalada no hay cifra recordada (ya está en la §7).
4. **`mesaia.9`.**
   - **Respuesta: aceptados** el escenario nuevo y la vara de «2 o más envíos con el mismo `seq`».
5. **La caché de 60 s del SDK.**
   - **Respuesta: aceptada como límite.**
   - Para la 1f: comprobar si esa caché vive solo en memoria y, si es así, si el «Reintentar» de la tarjeta g puede recargar la página para saltarla.

**Pendientes para la 1f** (anotados):
- borrar `.bautizo-regla`;
- la caché del SDK y el «Reintentar» que recarga;
- el logotipo del lobby sin red.

**Fuera de IOS-1c:** Retar sin desplazar en la laptop va a la 1d; la banda 601–676 de la mesa, a TAB-1.
