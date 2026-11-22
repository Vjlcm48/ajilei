# AJILEI · TUT-1 / GUI-1 · Tanda 3 · La puerta de entrada · Informe · v1.0

- **Fecha:** 2026-11-21. **Base:** `b943853` (tandas 1 y 2, sin push de `main`; respaldo `respaldo-tut-1`).
- **Ficha:** `AJILEI_TUT-1_T3_v1.0.md`. **Normativo:** `AJILEI_Tutorial_v1.4.md` (entra con esta tanda; la v1.3 sale con `git rm`).
- **Protegidos:** no se abrió ninguno. `GameTable.jsx` y `Lobby.jsx` se tocaron; el motor, la IA, la baraja, los asientos, los pozos y sus dos hojas de estilo, no.
- **Nube:** una migración, `20261121150000_tut1_guiada.sql`, aplicada por Victor con `db push --remote`: Grupo A 9 de 9 y Grupo B 14 de 14 (STOP-A). Ninguna Edge Function cambia; sin deploy.
- **Lo visible para el jugador:**
  - el premio al terminar la guiada: «+2.000 HC» o «+1.000 HC», celebrado en el cierre;
  - la tarjeta del primer login, con la cifra que dice el servidor;
  - «Cómo se juega» con tres tarjetas;
  - las tres señales de primera vez en la mesa real contra las IAS.

---

## 1 · Lo que se construyó

### 1.1 La nube (`supabase/migrations/20261121150000_tut1_guiada.sql`)

| § | Pieza | Qué hace |
|---|---|---|
| 1 | `movimientos_tipo_chk` | Entra el tipo `premio_guiada` (15 tipos). La restricción se quita y se vuelve a poner. |
| 2 | `premios_guiada` | `huella` (clave primaria, sha256 del correo canónico, **sin FK**), `jugador_id`, `monto`, `tramo` (`limpio` · `jugado` · `invitado`) y `cobrado_en`. RLS sin políticas y sin privilegios para `anon` y `authenticated`. Sobrevive al borrado de la cuenta, como `bonos_bienvenida`. |
| 3 | `premio_guiada_hc(tramo)` | La cifra en un solo sitio: 2.000 para `limpio`, 1.000 para `jugado` e `invitado`. `limite_dinero` se redefine entera con `cobrar_guiada` = 5 por minuto (INV-51). |
| 4 | `guiada_mano_jugada`, `guiada_premio_invitacion` y `guiada_tramo` | Las dos preguntas del tramo (§1.2). Prioridad: `invitado` antes que `jugado`, y `limpio` si no hay ninguna de las dos. |
| 5 | `premio_guiada_estado()` | Solo lectura, para la tarjeta y «Cómo se juega». Devuelve `{ estado, monto, tramo }`, donde `estado` es `disponible`, `cobrado`, `sin_sesion` o `sin_correo`. |
| 6 | `cobrar_guiada()` | El pago. No recibe nada y recalcula el tramo. Su orden se describe debajo de la tabla. |
| 7 | Permisos y Realtime | Solo las dos funciones del cliente, y solo para `authenticated`. Comprueba que ninguna tabla de dinero esté en Realtime. |

**El orden de `cobrar_guiada()`:**

1. La sesión.
2. El límite. Sin billetera devuelve `sin_billetera`.
3. La billetera, bloqueada.
4. El correo.
5. Si la huella ya existe, devuelve `cobrado`.
6. Calcula el tramo y la cifra.
7. Inserta la marca. Si choca con otra, devuelve `cobrado`.
8. Paga con `aplicar_movimiento(…, 'premio_guiada', monto, 'guiada:' || huella, …)`.
9. Devuelve `{ estado: 'pagado', monto, tramo, saldo }`.

Si el libro contesta `repetido` o `clave_en_uso`, devuelve `cobrado`. Cualquier otro fallo borra la marca y devuelve `error`, para que no quede una marca sin dinero. Ningún camino de negocio lanza: «ya cobrado» **se devuelve**.

### 1.2 La señal de «mano jugada» (la ficha §1.1 pedía encontrarla y documentarla)

Es la misma que ya usa la medición para «jugó» (`supabase/consultas/med_02_activos.sql`): **cerró al menos una mano** en cualquiera de las dos mesas.

- **Contra las IAS:** `mesas_ia.mano_informada >= 1` (RNK-1a). Sentarse no cuenta.
- **Contra personas:** `partida_asientos.manos >= 1` (MES-PvP 8). Lo escribe el árbitro, sin depender del teléfono.

**Por qué no `movimientos`:** el libro sabe quién se **sentó** (`entrada_ia`, `garantia_pvp`), no quién jugó una mano. Con él, sentarse y salir antes de la primera mano ya costaría 1.000.

**Lo que la señal no ve, declarado en la migración:**
- **El borrado.** Una cuenta borrada se lleva sus `mesas_ia` en cascada. Quien juega, borra la cuenta y vuelve con el mismo correo sin haber cobrado cuenta como limpio. El tope de 2.000 no se rompe.
- **Las manos antiguas.** Una mano anterior a RNK-1a (2026-10-24) no está contada en `mano_informada`.

**El premio de invitación (GEN-1)** se pregunta contra el tipo reservado `premio_invitacion`, que todavía no está en el check: hoy siempre es «no». GEN-1 solo tiene que redefinir `guiada_premio_invitacion`.

### 1.3 El guion y el espejo

- **`supabase/pruebas/tut1_verificacion.sql`** (23 filas, `npm run guiones`, PGlite):
  - el **Grupo A** (9 filas) mira la forma;
  - el **Grupo B** (14 filas) mira el comportamiento con usuarios fabricados y borrados:
    - limpio: cobra 2.000 una vez;
    - sentado sin cerrar mano: sigue limpio;
    - con una mano contra las IAS: 1.000, y el sexto cobro en un minuto devuelve `limite`;
    - con una mano entre personas: 1.000;
    - un alias de gmail que cobra, se borra y vuelve con otro alias: `cobrado`;
    - sin sesión; `anon` rechazado; la tabla y las funciones internas, cerradas para el cliente;
    - nadie es `invitado`.
- **El pie de la migración** lleva los dos grupos comentados, generados desde ese archivo, con la corrida real de Victor.
- **`cfg1e_verificacion.sql` y `tie1a_verificacion.sql`:** sus listas cerradas de tipos pasan a 15.
- **`src/dev/bancoImitado.js`:**
  - las dos funciones, con las mismas cifras y el mismo límite (un espejo de la última definición de `limite_dinero`);
  - los mandos `sembrarPremioGuiada`, `cerrarManoPvp` y `marcarInvitacion`;
  - la prueba de contrato en `bancoImitado.test.js`.

### 1.4 La recompensa en el cliente

- **`src/lib/guiadaApi.js`:** envoltorio delgado de las dos funciones (molde `constanciaApi`).
  - **Nunca rechaza:** una red caída, un error o una respuesta sin forma llegan como `{ estado: 'red' }`.
  - Sin cifras escritas: lo que se enseña es lo que contestó el servidor.
  - En desarrollo con bypass, el cliente es el banco imitado (`src/dev/guiadaFalsa.js`, con los mandos `?guia=cobrado|jugado|red|lento`). En la build ese archivo se reduce a `return null`.
- **`CierreGuiada`:** llama a `cobrar_guiada()` **una vez**. Una referencia guarda la promesa, así que el doble efecto del modo estricto no pide dos veces.
  - **Antes de pedir**, pone `pendientePago`.
  - **Con `pagado`:** «+2.000 HC» grande con la moneda y el sonido de las monedas (1,5 s), y la píldora toma el saldo devuelto.
  - **Con `cobrado`:** ni cifra ni celebración.
  - **Con cualquier otra respuesta:** «Te lo acreditamos en cuanto vuelva la conexión».
  - La ranura del premio se reserva desde el primer cuadro (O1).
- **`src/lib/guia.js`:** `hecha` sale del aparato. Una `hecha` antigua se descarta al leer. Entran `marcarPendiente` y `quitarPendiente`. El censo de INV-12 se pone al día.
- **El reintento del lobby** (`PuertaGuiada`, en el trozo de la guiada): si el aparato dice `pendientePago`, pide `cobrar_guiada()` otra vez.
  - Con `pagado` o `cobrado` quita la marca.
  - Con `pagado`, además, la píldora toma el saldo.

### 1.5 La puerta

- **La tarjeta del primer login** (`OfertaGuiada`, variante a de la lámina, montada por `PuertaGuiada`).
  - **Cuándo sale:** en la primera visita al lobby sin `ofrecida`. No sale con sala pendiente, ni si `premio_guiada_estado()` no dice `disponible`, ni sin red.
  - **Su texto:** «antes de jugar tu primera mano» solo con el tramo `limpio`. La cifra va en negrita y dorada.
  - **La marca `ofrecida`:** la ponen los dos botones. No se pone al pintar la tarjeta: quien cierra la app con ella delante la vuelve a ver.
- **«Cómo se juega»** (`src/screens/ComoSeJuega.jsx`): tres tarjetas sobre la carcasa de Rankings.
  - **Partida guiada:** «3 manos · 2 min», «Gana 2.000 HC» o «✓ Hecha», con la línea reservada.
  - **Aprender por tema** y **Pregúntale a Mia**, las dos con «Pronto» y el aviso `lob.toast.pronto`.
  - **Disposición:** una por fila en el teléfono vertical; en fila en el acostado de 640 o más y en la PC.
  - **Oro único:** solo la tarjeta de la guiada lleva el dorado sólido.
  - El botón «Cómo se juega» del lobby abre esta pantalla, no la guiada.
- **Las señales de primera vez** (`src/components/SenalesPrimeraVez.jsx`, montadas por `GameTable`):
  - **Dónde:** solo con `control` y sin `guion` ni `partida`.
  - **Cómo:** con `CapaSenal` en modo libre: sin velo, con aro, esquivando con pesos el reloj (el que más pesa), la zona de acción, las cartas, el pozo y la barra.
  - **Cuándo se marca:** cada una cuando acaba su momento (iniciar, el turno, el descarte), y entonces no vuelve.
  - **El rótulo** pasa de 300 a 380 px en pantallas de 600 o más.
- **Textos** (`textos.tut.es.js`):
  - la oferta con `{monto}`;
  - las tres señales de §1.6;
  - el grupo nuevo `TEXTOS_TUT_HUB`;
  - las tres claves del premio del cierre.

### 1.6 Todo el tutorial en un solo trozo

«Cómo se juega», la puerta del lobby y las señales viajan en el trozo de la guiada (`screens/Guiada.jsx` los reexporta).

- **Por qué:** con trozos aparte, cada pieza compartida (la capa, los textos, las marcas, la API) es un nombre más en la tabla `__vite__mapDeps` de la entrada, y `1.8b` subía 0,37 KiB. Así sube **+186 B comprimidos (179,9 KiB)**, dentro del tope de 0,2 KiB.
- **El coste:** el lobby pide ese trozo al aterrizar (unos 8 KB comprimidos), y la guiada, «Cómo se juega» y la primera mesa real lo encuentran en la caché.
- Victor aprobó esta decisión en el STOP-T.

### 1.7 La vara `tut`, ampliada

- **`diagDSK tut puerta`** (nueva, en `completo`, `scripts/tut/puerta.mjs` y `montaPuerta.mjs`):
  - **tut.oferta:**
    - sale una vez, con 2.000 y «antes de jugar»;
    - con `?guia=jugado`, 1.000 sin «antes de»;
    - no sale con `?guia=cobrado`, ni tras «Ahora no» y recargar;
    - con sala pendiente no pregunta: monta la `PuertaGuiada` real con un cliente que cuenta, con su control;
    - Δ 0 del lobby; botones de 44.
  - **tut.hub:** las tres tarjetas, la cifra o «✓ Hecha», «Pronto» en dos, el oro solo en la guiada, 44, columna o fila según el tamaño, el aviso, y la guiada que abre la mesa.
  - **tut.senales:** una mesa de 3 contra las IAS en 360×640 y 1920×1080.
    - Cada pista sale una vez y no tapa el reloj ni las cartas.
    - Sin velo, con aro y Δ 0, con el reloj corriendo.
    - Ninguna en la segunda mano.
- **`diagDSK tut guiada`:**
  - entra por «Cómo se juega»;
  - el cierre exige `pagado`, «+2.000 HC» visible, la moneda y `pendientePago` quitada;
  - tut.red exige **exactamente una** `cobrar_guiada` y ninguna `premio_guiada_estado` en toda la guiada, y que la píldora suba 2.000.
- **`diagDSK tut`:** los rótulos del grupo `hub` no son de la capa, y `{s}` se mide con 20.

---

## 2 · El STOP-A

La migración se probó antes con `npm run guiones` (PGlite, 23 de 23).

Victor corrió `npx supabase db push --remote --dry-run`, `npx supabase db push --remote` y los dos grupos en el SQL Editor:

| Grupo | Resultado |
|---|---|
| A | 9 de 9 PASA |
| B | 14 de 14 PASA |

---

## 3 · El STOP-T (Victor en el S25, sesión real, 2026-11-21)

Producción servida en 4174 con túnel, contra la nube con la migración aplicada.

- **`test1976`** (con manos jugadas):
  - la tarjeta con 1.000; «Ahora no» y no vuelve;
  - «Cómo se juega» con las tres tarjetas;
  - el cobro de 1.000 con celebración; la segunda guiada, sin cifra;
  - en una mesa de 3 contra las IAS, las tres señales una sola vez, y ninguna en la segunda mano.
- **`tutorial2126`**, cuenta nueva con un correo de **otro dominio**:
  - la tarjeta con 2.000 y «antes de jugar tu primera mano»;
  - el cobro de 2.000, con el saldo de 2.500 a 4.500;
  - la tarjeta que no vuelve, y «✓ Hecha».
- **SQL Editor:**
  - en `premios_guiada`, dos filas: `limpio` 2000 y `jugado` 1000;
  - en `movimientos`, las dos de tipo `premio_guiada`, con claves `guiada:<huella>` distintas.
- **El borrado:** `tutorial2126` ya está eliminada; su fila de `premios_guiada` queda sin perfil, como se anunció.

Victor aprobó las tres decisiones que se le llevaron:
- «Jugar la guiada» también pone `ofrecida`;
- un solo trozo para todo el tutorial;
- el rótulo libre a 380 px en pantallas de 600 o más.

No hubo correcciones de texto, tamaño ni posición.

### 3.1 Hallazgo: el alias `+borrarXX` comparte huella

**Qué pasó.** El primer intento de la cuenta nueva usó un alias `+borrarXX` del Gmail de `test1976`. Llegó con saldo 0, sin tarjeta y con «✓ Hecha».

**Por qué.** La huella sale del correo canónico (`correo_canonico`, ECO-1a). En `gmail.com` y `googlemail.com`, el canónico quita el «+…» y los puntos. En cualquier otro dominio, el correo queda como está, en minúsculas. Ese alias tiene **la misma huella** que `test1976`, que ya había cobrado. Sin bono de bienvenida ni premio, como manda la regla «una vez por persona».

**No es un defecto: es la regla de la huella.** Es la misma que ya documentaron CFG-1 1d y 1e para el bono.

**Desde ahora:** las pruebas del tramo limpio se hacen con correos de otro dominio (`pruebaN@ajilei.io`, por Email Routing). El paso 1 del §4 de la ficha dice «alias `+borrarXX`». La ficha no vive en el repo, así que el texto corregido queda aquí:

> 1. **Con una cuenta nueva de otro dominio** (`pruebaN@ajilei.io` por Email Routing; el cobro es irreversible). Un alias `+borrarXX` del gmail de una cuenta que ya cobró comparte su huella: llega sin bono, sin tarjeta y con «✓ Hecha». Bautizo → …

El normativo v1.4 no menciona el alias. Su §1.5 ya dice «una por persona, con la huella del correo», y no cambia.

---

## 4 · Lo que salió al construirla

- **`1.8b`, de +0,37 a +0,18 KiB.** La primera versión llevaba un trozo para la puerta y otro para «Cómo se juega», y el cliente de desarrollo del premio en `billeteraFalsa.js`; así la entrada exportaba un símbolo más. Esto se probó:
  - **Juntar la puerta y la pantalla:** no ganó nada.
  - **Sacar el cliente de desarrollo a `guiadaFalsa.js`:** ganó algo.
  - **Meterlo todo en el trozo de la guiada:** fue lo que llegó al tope.
- **Una línea borrada de `trozos` compila sin error.** Una sustitución se llevó la entrada `guiada:`. La build salió verde y la app caía al arrancar (`Cannot read properties of undefined (reading 'fabrica')`). Se repuso, y `1.8b` se volvió a medir solo después de ver la app arrancar. Una medida tomada sobre una app que no arranca no vale.
- **PL/pgSQL no distingue mayúsculas.** Las constantes `J`, `S` y `R` del guion chocaban con las variables `j`, `s` y `r` («duplicate declaration»); se renombraron.
- **Las listas cerradas de tipos** de `tie1a_verificacion` y `cfg1e_verificacion` fallan con un tipo nuevo. Se abrieron a 15.
- **`tut.puerta` falló en sus dos primeras corridas por la propia vara:**
  - medía el Δ de la oferta con el lobby todavía moviéndose (ahora reintenta hasta que se queda quieto);
  - montaba la puerta sin el contexto de sonido;
  - buscaba `all-in` y la acción se llama `allin`.

  Después, tres corridas verdes seguidas.
- **La tarjeta del primer login se comía el clic de las varas** (andamio, arreglado).
  - **Qué pasó:** `msg` salió roja en todos sus casos que entran por el lobby (jugado 0/7, fin 0/1, Δ larga 0/7, la caza y el barrido): `page.click` sobre `jugar-ia` no llegaba en 30 s. Un contexto del arnés nace como un aparato nuevo, sin `ajilei.guia`, y desde 3-c la tarjeta sale centrada sobre el lobby atenuado.
  - **El producto:** hace lo que pide la ficha.
  - **El arreglo**, en `scripts/arnes/comun.mjs`, con el molde de la escala forzada (`ESCALA_1`): todo contexto nace con la guía «vista» (`GUIA_VISTA`), es decir, la oferta ofrecida y las tres señales marcadas. Así el lobby y la primera mesa contra las IAS quedan como antes de la tanda 3.
  - **La excepción:** solo `diagDSK tut puerta`, que mide justo eso, la pide real con `guiaReal()`.
  - **A qué alcanza:** a toda vara que entra por el lobby (`msg`, `cfg`, `constancia`, `mesaia`, `video`, `tam` y `lec`) y a las mesas contra las IAS (`cap`, `apu`, `h1` y `z1`), donde las señales saldrían encima.
- **`testInvariantes` rojo por mi letra** (andamio, arreglado): en las columnas de fuente y vigilante, todo lo que va entre comillas de código tiene que ser un modo de dos palabras, una ruta, una prueba o un documento. `pendientePago`, `limite`, `?guia=cobrado` y `diagDSK tut puerta` no lo eran. Las filas nuevas de §6 se llaman `diagDSK tut` guiada y `diagDSK tut` puerta.
- **Riesgo aceptado (el del bono):** el servidor no puede saber si la guiada se jugó entera, porque no hay servidor en la guiada (INV-47). Quien llama a `cobrar_guiada()` a mano cobra lo mismo que quien la termina, una vez por correo.

---

## 5 · Las varas

Todas sobre el árbol final, con `dist/` compilado por el orquestador. El 4173 no se tocó.

| Vara | Resultado | Nota |
|---|---|---|
| eslint (`.`) | 0 | — |
| vitest | 118 archivos, 3 163 pruebas, verde | Incluye `guiadaApi`, `guia`, `bancoImitado` (el espejo del premio), `guionesCore`, `testClavesAlmacen`, `testDistSinMoldes` (salen `ofg-tarjeta` y `tut.oferta`; entran como obligatorias, con `premio_guiada_estado` y `cobrar_guiada`), `testInvariantes` y `orquesta.test` |
| `npm run guiones` | verde | `tut1_verificacion`, 23 de 23, y las listas de tipos de `cfg1e` y `tie1a` con 15 |
| `1.8b` | 179,9 KiB, verde | +186 B comprimidos en la entrada sobre la base (179,7); tope de la ficha +0,2 KiB |
| `diagDSK tut` | 0, 5 s | — |
| `diagDSK tut guiada` | 0, 1 min 40 s | Con la guía «vista» del arnés |
| `diagDSK tut puerta` | 0, 54 s | Tres verdes seguidas antes, y una más con `guiaReal()` |
| `diagDSK lec` (lec.mapa) | 0, 43 s | — |
| `diagDSK apu` | 9 de 9 con código 0 | Las 7 celdas, rec2 y voz3 |
| `diagDSK h1` | mesas 5, 4, 3 y 2 con código 0 | — |
| `diagDSK z1` | 0 | — |
| `diagDSK rec` | 0 | — |
| `diagDSK msg` | **1 → 1 (conforme a INV-22)** | La primera pasada, roja entera: §4, la tarjeta del primer login. Con la guía «vista»: jugado 7/7, fin 1/1, Δ larga 7/7, caza 2/2. Solo queda «barrido «Heptacoins» · 0 medidas», el rojo de instrumento declarado en INV-22 |
| `diagDSK pvp` (pvp.mesa) | 0 | Corrió antes del arreglo: la mesa de personas no tiene señales ni pasa por la oferta |
| `diagPUE cap` | 0 | Sin resellar |
| `diagDSK humo` | 0, 13 min 31 s | Con la guía «vista»; es lo que corre el aislado de cada commit |

Antes de pedir el «procede», los árboles de 3-a, 3-b y 3-c se probaron en una copia de trabajo de `b943853`: build, vitest, eslint y `1.8b`, como el aislado.

| Árbol | Build | vitest | eslint | `1.8b` |
|---|---|---|---|---|
| 3-a | 0 | 3 154 verdes | 0 | 179,7 KiB |
| 3-b | 0 | 3 160 verdes | 0 | 179,8 KiB |
| 3-c | 0 | 3 162 verdes | 0 | 179,9 KiB |

- **3-b**, además, en el servidor de desarrollo: el lobby arranca sin errores. Con `pendientePago` en el aparato, el reintento cobra (la píldora pasa de 5.000 a 7.000) y quita la marca.
- **El árbol de 3-c** difiere del final solo en los archivos de 3-d.

---

## 6 · Lo que no se hizo

- **El tramo `invitado`:** la consulta está escrita contra un tipo que aún no existe. Hoy nadie es `invitado`; lo estrena GEN-1.
- **El capítulo 5 y la serie** (tanda 4); `tut.cap5` sigue en «hasta montar».
- **Las señales en la mesa de personas:** no hay en esta tanda (ficha §2.4).
- **El control de las IAS:** al cerrar la tanda 5 (ficha §5).
- **Lo que el arnés no puede medir:** el sonido de las monedas en el S25 y la tarjeta con el teclado abierto. El S25 se probó en el STOP-T.

---

## 7 · Mapa archivo → commit

| Commit | Archivos |
|---|---|
| **3-a** la nube | `supabase/migrations/20261121150000_tut1_guiada.sql` · `supabase/pruebas/tut1_verificacion.sql` · `supabase/pruebas/cfg1e_verificacion.sql` · `supabase/pruebas/tie1a_verificacion.sql` · `scripts/eco/guionesCore.mjs` · `scripts/eco/guionesCore.test.js` · `src/dev/bancoImitado.js` · `src/dev/bancoImitado.test.js` · `docs/AJILEI_Tutorial_v1.4.md` |
| **3-b** la recompensa en el cliente | `src/lib/guia.js` · `src/lib/guia.test.js` · `scripts/testClavesAlmacen.test.js` · `src/lib/guiadaApi.js` · `src/lib/guiadaApi.test.js` · `src/dev/guiadaFalsa.js` · `src/screens/CierreGuiada.jsx` · `src/styles/guiada.css` · y en versión intermedia: `src/components/PuertaGuiada.jsx` (solo el reintento) · `src/screens/Lobby.jsx` (la ranura de la puerta) · `src/App.jsx` (`onSaldo`) · `src/screens/Guiada.jsx` (`onSaldo` y la puerta reexportada) · `src/lib/trozos.js` · `src/config/textos.tut.es.js` (las claves del premio) |
| **3-c** la puerta | `scripts/arnes/comun.mjs` (la guía «vista» de los contextos del arnés) · `src/screens/ComoSeJuega.jsx` · `src/styles/comoSeJuega.css` · `src/components/PuertaGuiada.jsx` · `src/components/OfertaGuiada.jsx` · `src/styles/ofertaGuiada.css` · `src/screens/Lobby.jsx` · `src/App.jsx` · `src/screens/Guiada.jsx` · `src/lib/trozos.js` · `src/config/textos.tut.es.js` · `src/components/GameTable.jsx` · `src/components/SenalesPrimeraVez.jsx` · `src/styles/senal.css` · `scripts/testDistSinMoldes.test.js` |
| **3-d** vara, Invariantes, normativo e informe | `scripts/tut/guiada.mjs` · `scripts/tut/montaCapa.mjs` · `scripts/tut/puerta.mjs` · `scripts/tut/montaPuerta.mjs` · `scripts/diagDSK.mjs` · `scripts/arnes/orquestaCore.mjs` · `scripts/arnes/orquesta.test.js` · `docs/AJILEI_Invariantes_v1.0.md` · `docs/reportes/AJILEI_TUT-1_T3_Informe_v1.0.md` · `git rm docs/AJILEI_Tutorial_v1.3.md` · los punteros a la v1.4: `src/screens/Guiada.jsx` · `src/styles/senal.css` · `src/components/GuiaControl.jsx` · `src/components/CapaSenal.jsx` · `src/components/capaSenalCore.js` · `src/lib/guiaManos.js` (fuera del bloque de órdenes) · `scripts/guia/buscarOrdenes.mjs` |

**Tres movimientos respecto de la ficha §6**, para que cada commit construya y cuente su parte sola:

- **`scripts/arnes/comun.mjs` va en 3-c, no con la vara en 3-d.** 3-c es el commit que monta la oferta y las señales. Sin la guía «vista», el `humo` del aislado de ese commit ya entraría por un lobby tapado. `guiaReal()` se estrena en 3-d, con `tut puerta`.

- **El normativo v1.4 entra en 3-a:** es el primer commit que lo cita (la migración y su guion), como la v1.3 en 2-a. La v1.3 sale en 3-d, con las Invariantes y los punteros que dejan de citarla.
- **El reintento del lobby, en 3-b, sin la oferta.** La ficha pone «`Lobby` reintento» en 3-b y «`OfertaGuiada` montada, `Lobby`» en 3-c, y en el árbol las dos cosas viven en `PuertaGuiada`. Por eso 3-b lleva:
  - una `PuertaGuiada` que solo reintenta;
  - la ranura del lobby;
  - el `onSaldo` de `App`.

  3-c la completa con la oferta, «Cómo se juega» y las señales. Las versiones intermedias se construyen desde el árbol final. Solo difieren de él en lo que añade 3-c y en los comentarios que lo nombran.
