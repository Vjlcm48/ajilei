# AJILEI · CFG-1 · Fase 1e · El ⋮ de la mesa · Informe v1.0

**Escrito para:** el rector y Victor
**Ficha:** `AJILEI_CFG-1_Fase1e_v1.0.md`, con las respuestas del rector al STOP-E1 · **Base:** `main` en `c69fc8d` · **Fecha:** 2026-10-30
**Estado:** **Validada por Victor (2026-10-30)**: A en la PC con el bypass, B en el S25 por túnel con `test1976` (una consulta gratis: 20 → 19) y C en el servidor real con la cuenta desechable `prueba7623` (`+borrar1e`): 1.500 → 1.000 al sentarse, dos gratis, cobro a 900, repetida sin cobro, cobro a 800 y «Eliminar cuenta». Las tres, al 100 %. Decisión de Victor tras la C: el aviso «No te alcanza» se queda como está (la consulta se paga de la billetera y nunca de la pila de la mesa; si algún día llegan quejas, se ajusta el texto).

---

## Resumen

- **El ⋮ queda en cinco entradas:** Sonido, Reacciones, Tapetes, Partida rápida y Mano actual. Salen «Cuenta» (la figurita) y «Saldo» (la Heptacoin inerte). El panel mide 64×244 en todas las pieles, y 64×200 contra humanos, sin «Partida rápida».
- **Partida rápida (INV-70):** sólo contra las IAS. Se recuerda en el aparato, se congela por mano y acelera ×0,5 el vuelo del reparto y las esperas del segundo reparto. El barajado de 1,95 s no se toca. Medido en la misma corrida (§4).
- **Mano actual de pago (INV-75):** 20 gratis en el servidor y la mano como unidad. El precio sale del nivel de la mesa (100 / 200 / 300). Hay confirmación de un toque en el primer cobro de la sesión, aviso sin saldo, y el recorrido dorado sólo con la mano pagada.
- **Servidor:** migración `20261030193000_cfg1e_mano_actual.sql`, en la base real desde el STOP-E1 (19/19 PASA).
- **Arnés:** `diagDSK cfg` pasa a 19 puertas con `cfg.menu`, `cfg.consulta` y `cfg.rapida`, todas en verde. `u1`, `u3` y `menu-movil` quedan recableados.
- **`u1` deja su rojo conocido.** Tapetes medía 63×35 porque lo tapaba el SVG de «Cuenta». Con «Cuenta» fuera mide 63×44, y el hueco de INV-07 se cierra solo. La ficha esperaba ese rojo hasta la 1f.
- **Documentos:** el normativo pasa a `AJILEI_Menu_Utilidades_v1.6.md`. Invariantes nuevas: INV-70 (la reservada para «Partida rápida») e INV-75. INV-07 e INV-12 al día.

---

## 1. 1e-i · Servidor (STOP-E1, aprobado; en la base real)

Lo entregado y aprobado en el STOP-E1, con los dos ajustes del rector:

- **P-1:** la mano es la unidad también para las gratis. Columnas `ultima_mesa`/`ultima_mano`, y la comprobación `repetida` va antes de gastar.
- **P-2:** el ajuste de la prueba C es de 1.500 HC.

| Qué | Dónde |
|---|---|
| `'consulta'` en `movimientos_tipo_chk` (los 12 tipos de antes se quedan) | `supabase/migrations/20261030193000_cfg1e_mano_actual.sql` §1 |
| Tabla `consultas`: una fila por jugador, `gratis_usadas` 0–20 y la última mano consultada. RLS sin políticas y nada para el cliente (D-1) | §2 |
| `consultas_gratis()` = 20 · `precio_consulta(text)` = 100/200/300/500 | §3 |
| `consultar_mano(p_mesa, p_mano)`. Orden: sesión → límite 30/min → argumentos → mesa abierta y propia (de ella el precio) → fila bloqueada → `repetida` → gratis → cobro con la clave `consulta:<mesa>:<mano>` | §5 |
| `mi_consulta()` → (gratis_restantes, ultima_mesa, ultima_mano) | §6 |
| Guion de 19 filas, registrado en el corredor | `supabase/pruebas/cfg1e_verificacion.sql` · `scripts/eco/guionesCore.mjs` |

**Desviaciones aceptadas en el STOP-E1:** D-1 (tabla y no columnas en `profiles`), D-2 (sin `p_nivel`), D-3 (`mesa_invalida`, `argumento_invalido`, `limite`), D-4 (la clave del libro), D-5 (el uuid de la mesa en `mi_consulta`) y D-6 (el «ajuste_admin que rechaza» es el fragmento de la prueba C).

**Decisiones propias, aceptadas por el rector:**
- Una mano anterior ya pagada responde `pagada`, distinto de `repetida`.
- Una mano anterior consultada gratis gasta otra gratis (sólo se recuerda la última).

**Corrida real:** Victor hizo el `db push` y corrió el guion en el SQL Editor: **19/19 PASA**. Lo esencial:
- B2: 19 → 0 en veinte manos.
- B3: gratis·19, repetida·19, repetida·19.
- B4: 7000 → 6900.
- B6: 6900 → 6800.
- B13: la llamada 31.ª, `limite`.

---

## 2. 1e-ii · El menú, archivo por archivo

### 2.1 Las entradas

| Qué | Dónde |
|---|---|
| IDs: entra `rapida`; `saldo` y `cuenta` quedan retirados. Listas de vivas. `ENTRADAS_PANEL`, `presentesDe(contraIAS)`, `altoPanel(filas) = 44·f + 24`, `filasDelPanel` | `src/config/menuEntradas.js:19`, `:41`, `:56`, `:74-89` |
| El panel: fuera `CuentaIcon`, la lista de inertes y la fila «Cuenta». Entra la fila «Partida rápida» (`menuitemcheckbox`, `is-off`, pastilla Sí/No). Mano actual lleva el nombre accesible con el estado, y el badge o la pastilla con la cifra | `src/components/UtilitiesMenu.jsx:56` (icono), `:76` (`textoMano`), `:234` (Partida rápida), `:318` (badge), `:327` (pastilla móvil) |
| La pastilla de estado, el icono apagado y el botón de la confirmación, en CSS aditivo y sin puerta de piel | `src/styles/utilidadesMesa.css` (nuevo) |
| El alto del panel sale de las filas: la pinza usa `altoPanel(filas)`. Se retiran `readConsultas`/`writeConsultas`, `ALTO_CUENTA` y el alto horizontal aparte | `src/hooks/useUtilitiesMenu.js` |
| `GameTable` pierde el panel de Cuenta y el Bautizo en edición. Recibe `contraIAS` (por defecto `false`), `apiConsulta` y `onSaldo`, y de la cuenta sólo nombre y correo | `src/components/GameTable.jsx:331`, `:586`, `:2835-2846` |
| `App` pasa `contraIAS`, la API de Mano actual (`simulacionConsulta() ?? consultaApi`), `onSaldo={tomarSaldo}` y `{ username, correo }` | `src/App.jsx:345`, `:1003-1011` |
| `CuentaPanel.jsx` y `cuenta.css` se borran: ya no tienen consumidores (`git rm`, sin commit) | — |

### 2.2 Partida rápida

| Qué | Dónde |
|---|---|
| Accesor `ajilei.partidaRapida` (`'si'`/`'no'`, por defecto no), `FACTOR_RAPIDA = 0,5`, `factorDeMano(contraIAS, encendida)` | `src/lib/partidaRapida.js:20-42` |
| `rapida` (lo que enseña el ⋮) y `factorManoRef` (lo que usa la mano en curso) | `src/components/GameTable.jsx:594-598` |
| `commitNewHand` lee el aparato una vez y congela el factor | `src/components/GameTable.jsx:1916` |
| El vuelo del reparto: `VUELO_REPARTO_S × factor`, guardado en la carta al crearla | `:288`, `:824`, `:2794` |
| Las esperas del segundo reparto: 300·k / 600·k / 900·k y 2000·k | `:841-852` |

**Ninguna duración vive sólo en `gameTable.css`.** El barajado está en JS (1950) y en CSS (`fanOut 1.95s`), y no se toca. El volteo (0,30 s, CSS) no es una espera y tampoco se toca. No hizo falta el STOP de §2-2.

### 2.3 Mano actual de pago

| Qué | Dónde |
|---|---|
| Las cifras espejo del servidor: `CONSULTAS_GRATIS`, `PRECIOS_CONSULTA` y `precioConsulta`. `CONSULTAS_KEY` se retira | `src/config/consultas.js` |
| El núcleo puro: `estadoConsultas`, `conMiConsulta`, `decidirConsulta` (`sin_mesa` · `repetida` · `llamar` · `sin_saldo` · `confirmar`), `responderConsulta` y `etiquetaConsulta` | `src/hooks/consultasCore.js:48-120` |
| El hook: `mi_consulta()` al entrar a la mesa; llama, confirma o avisa; devuelve el saldo a la billetera | `src/hooks/useConsultas.js` |
| La API: `consultar_mano` y `mi_consulta`, con la fila validada o `null` | `src/lib/consultaApi.js` |
| La confirmación del primer cobro de la sesión (`ajilei.consultaConfirmada` en `sessionStorage`) | `src/lib/consultaConfirmada.js` |
| La ventana: `valor` (con el pie del contador o «Mano pagada…») o `aviso` (una línea) | `src/components/ManoActual.jsx` |
| La confirmación, familia de «Eliminar cuenta» sin el rojo | `src/components/ConfirmarConsulta.jsx` |
| El recorrido dorado de EMB-1, sólo con `data-pagada` | `src/styles/embellecimiento.css:78`, `:133` |
| Los textos (`ia.mesa.menu.*`, `ia.mesa.consulta.*`) y dos pares duplicados declarados («Cancelar», «Cerrar») | `src/config/textos.es.js`, `src/config/textos.test.js` |

### 2.4 Banco imitado y bypass

| Qué | Dónde |
|---|---|
| `consultar_mano` y `mi_consulta` con el orden del SQL; `gastarConsultas(n)`; las cifras `CONSULTAS_GRATIS_SQL`, `PRECIOS_CONSULTA_SQL` y `LIMITE_CONSULTA_SQL` | `src/dev/bancoImitado.js:515`, `:728`, `:756` |
| Mandos: `?cfg=consulta-gratis` (quedan 3), `consulta-pago` (0, saldo de sobra), `consulta-sin-saldo` (0 y 50 HC sentado) y `mesa-humanos` (sin Partida rápida) | `src/dev/billeteraFalsa.js:246`, `:257` |
| Pruebas: el recorrido B2–B13 del guion y las cifras en espejo de la migración | `src/dev/bancoImitado.test.js` (dos `describe` nuevos al final) |

### 2.5 Pruebas nuevas o rehechas

| Archivo | Qué |
|---|---|
| `scripts/testConsultas.test.js` | Las semánticas de U3 que se fueron (`pedirConsulta`) dejan paso a cuándo llamar, cuándo preguntar, qué pintar y lo que dice la entrada |
| `src/lib/partidaRapida.test.js` (nuevo) | El accesor, el factor, la confirmación de sesión, la API y el contrato de entradas (5 / 4 filas, 244 / 200) |
| `scripts/testClavesAlmacen.test.js` | 17 claves y 14 accesores; `sessionStorage` también en `consultaConfirmada.js` |

---

## 3. Desviaciones de la 1e-ii

- **D-7 · El panel sigue siendo de solo iconos.** La ficha habla de «Partida rápida · No» y de «Mano actual · 13 gratis» como si las entradas tuvieran rótulo, pero el panel es de iconos desde U1b, y el U1b dice que el `title` es el nombre de la entrada y nada más. El estado va en dos sitios:
  - el **nombre accesible**, con el texto entero de la ficha;
  - una **pastilla** en la esquina de la fila: «Sí»/«No», la cifra de gratis, el precio o ✓. En escritorio, la cifra de Mano actual sigue en el badge de U1b, cuyo popup dice ahora la etiqueta entera.
- **D-8 · Se retira `ajilei.consultas`.** El contador vive en el servidor, y dejar la clave sería un segundo contador mentiroso. Las cifras quedan como pedía la ficha, pero por otro camino:
  - claves: 16 − 1 + 2 = 17 (entran `partidaRapida` y `consultaConfirmada`);
  - accesores: 13 − 1 + 2 = 14 (sale `useUtilitiesMenu`; entran `partidaRapida.js` y `consultaConfirmada.js`).
- **D-9 · El aviso sin saldo sale sin preguntar.** Si la billetera que conoce la mesa no alcanza para el precio, sale «No te alcanza» sin confirmación ni llamada; si no, decide el servidor. Además, el saldo que contesta `consultar_mano` vuelve a la billetera con su `tomar`, así que la píldora y la oferta de recarga lo saben tras un cobro.
- **D-10 · El recorrido dorado no es un trazo nuevo.** Es el cometa de EMB-1, que hasta ahora rodeaba toda ventana de Mano actual. Desde la 1e sólo la rodea con la mano pagada (`data-pagada`). Mismo oro, mismo pseudo-elemento, Δ=0.
- **D-11 · Borrado de `CuentaPanel.jsx` y `cuenta.css`.** Sin consumidores tras sacar «Cuenta». El Bautizo no cambia.
- **D-12 · Configuración v1.2 corregida en el sitio.** Fueron cuatro líneas: §1 apunta al menú v1.6; §9, la 1e hecha; §10 a, «salió»; §12.3, el Bautizo ya no se abre desde la mesa. No hizo falta una v1.3.
- **D-13 · Sin excepción del móvil horizontal.** Con cinco filas todo cabe en el corredor: se retira `PRESENTES_MOVIL_HORIZONTAL`, y el eje «qué monta» queda por función (`presentesDe`). `altoPanel` vive en `menuEntradas.js` porque el arnés lo importa con `node` y no puede cargar el hook (React y rutas sin extensión).
- **D-14 · «Contra humanos» en el arnés.** La mesa del bundle es siempre contra las IAS, así que el caso se mide con `?cfg=mesa-humanos` en el servidor de desarrollo. Con `cfg` a solas, `diagDSK` levanta además un dev en 5173, como `saldo`, `mesaia` y `video`.
- **D-15 · Qué son «las esperas del segundo reparto».** Las tomo como las de `DEAL_3`: los volteos a 300/600/900 y el avance a 2000. Las dos pausas del primer reparto (120 ms antes de la primera carta y 400 ms antes de apostar) no se tocan. Si el rector las quiere también ×0,5, son dos líneas.
- **D-16 · `u3` y `menu-movil` cambian de semántica donde el contador cambió:**
  - `u3` P4: «sin gratis» ya no es el popup de agotadas sino la confirmación del primer cobro; al cancelar no se cobra nada y el badge sigue en el precio.
  - `menu-movil`: la persistencia tras recargar era del `localStorage`. Ahora es del servidor y la sella el guion. Con el bypass el banco nace con cada carga.
  - `u1`: lee el contador del banco del bypass, y su sub-pasada táctil espera a que llegue la cifra del badge (`mi_consulta()`) antes de medir: el badge sólo existe con cifra.

---

## 4. Medidas

### 4.1 Partida rápida: lo aplicado, en la misma corrida (`cfg.rapida`, 1366×768)

| | Regla | Normal (medido) | Partida rápida (medido) |
|---|---|---|---|
| Vuelo de cada carta del reparto (la `transition` aplicada en la carta) | 0,595 × k | 0,595 s | **0,2975 s**, en el primer reparto y en el segundo |
| Volteos del segundo reparto, desde que aterriza la última carta | 300·k / 600·k / 900·k | 317 / 615 / 918 ms | **172 / 323 / 465 ms** |
| Avance tras el segundo reparto | 2000·k | 2023 ms | **1020 ms** |
| Barajado (`animation-duration` computada · tiempo en pantalla) | 1950, sin factor | 1,95 s · 1952–1954 ms | **igual** |
| Descarte | 0,75, sin factor | 0,75 s | **igual** (medido en la mano rápida) |

- **Apagarla a mitad de mano** (en BET_1, antes del segundo reparto) no cambia esa mano: su segundo reparto siguió a 0,2975 y 150/300/450. La mano siguiente volvió a 0,595.
- **Recargar la página** la conserva («Sí»).

### 4.2 Arnés

| Corrida | Resultado |
|---|---|
| `diagDSK cfg` | Verde: 19 puertas y la consola (20/20), 4 min 27 s dentro de `humo`. Las tres nuevas, también solas en un preview propio |
| `diagDSK humo` | Verde (código 0): gate, lob, retar, rnk, suma y cfg; d1d2, d3, bug y shots, informativos. 588 s |
| `diagDSK u1` | Verde (código 0): 20/20 celdas, 7/7 táctiles (Tapetes 63×44, el badge confinado a su fila) y sonido 2/2. 890 s |
| `diagDSK menu-movil` | Verde (código 0): 16/16 celdas y la contra-celda de escritorio. La primera pasada cayó en la contra-celda por un «6 filas» escrito a mano en el arnés, ya leído de la lista sellada |
| `diagDSK u3` | 20/20 celdas, agotadas 4/4 (la confirmación, nada cobrado al cancelar), relojes 4/4. Manos 2/4 en la primera pasada: en las mesas 5 y 4 la banda «Tu mejor palo» salió oculta en el pago porque esa mano terminó sin recuento del humano (`human.score` nulo; en el bypass las manos no van sembradas). El contador hizo lo suyo (19 → 18). Repetidas las dos mesas: verde |
| `npm run guiones` | Verde: 13 migraciones, 7 guiones × 2 pasadas, cfg1e 19/19 |
| `vitest` | 84 archivos, 1.983 pruebas, verde |
| lint | 21 (línea base): los mismos tres archivos y las mismas reglas |

---

## 5. Observaciones y preguntas

- **O-1 · El reloj del turno no se para** mientras la confirmación del primer cobro está abierta: `#root` queda inerte y el reloj sigue. En las sondas, de 5 a 4 s en lo que tarda un toque. Es como el Bautizo en edición que vivía en la mesa. ¿Se acepta, o se pausa el reloj mientras pregunta?
- **O-2 · INV-70 seguía reservada para «Partida rápida».** La ficha la numeró INV-76, y así se escribió en el STOP-E2. ¿Se libera la 70 o se renumera la 76 a 70?
- **P-3 · Un atajo para la prueba C.** Con la mano como unidad (P-1 del STOP-E1), las veinte gratis de la ficha piden veinte manos distintas: la ficha decía «pueden ser en pocas manos», y eso ya no vale. El ajuste de la prueba C deja la cuenta desechable con 2 gratis, con las mismas paradas. ¿Se acepta, o se prefiere jugar las veinte manos?
- **O-3 · El límite de `consultar_mano` va literal** (`contar_intento_dinero('consultar_mano', 30)`) y no por `limite_dinero()` como los de ECO-1d. Funciona igual, y el espejo del banco lo lee de la migración. Si se quiere en `limite_dinero`, es una migración pequeña aparte, porque esta ya está en la base.
- **O-4 · Con el bypass, `mi_sala` va al Supabase real y contesta 401.** Es conocido desde TAB-2 2a, no es de esta tanda y no se tocó.
- **Trampa del instrumento:** `npx vitest` lanzado desde Git Bash puede fallar con «Cannot read properties of undefined (reading 'config')» porque la unidad sale como `C:` y `c:`. Desde PowerShell pasa.

### 5.1 Lo que decidió el rector en el STOP-E2

- **Aprobado.** D-7 a D-16 aceptadas. D-10: el recorrido dorado sólo con la mano pagada. D-15: las pausas del primer reparto (120 y 400 ms) no se tocan.
- **O-1, aceptada tal cual:** el reloj del turno sigue mientras pregunta la confirmación.
- **O-2, renumerado:** «Partida rápida» pasa a INV-70, la que tenía reservada, y la 76 queda libre. Corregidos el registro de Invariantes (la fila va tras la 69 y el recuento sigue en 75 filas y 68 vigiladas, ahora 42–75 seguidas), el normativo v1.6 §2, este informe y los comentarios de código que la citaban (`menuEntradas.js`, `partidaRapida.js` y su prueba, `App.jsx`, `GameTable.jsx`, `UtilitiesMenu.jsx`, `testClavesAlmacen.test.js`). Sólo cambia el número: ninguna conducta.
- **O-3, queda como está.** Para ARN-4:
  - unificar el límite de `consultar_mano` en `limite_dinero()`, como los de ECO-1d (una migración aparte, porque esta ya está en la base);
  - sembrar las manos de `u3`, para que la banda «Tu mejor palo» en el pago no dependa del azar del bypass (el rojo de la primera pasada de las mesas 5 y 4, §4.2).
- **P-3, aceptado:** el ajuste de la prueba C deja la cuenta desechable con 2 gratis (§7 C).

---

## 6. `git status` (sin commits)

- **Modificados (24):**
  - documentos: `docs/AJILEI_Configuracion_v1.2.md`, `docs/AJILEI_Invariantes_v1.0.md`, `docs/AJILEI_Menu_Utilidades_v1.5.md` (marcado «Sustituido»);
  - arnés y pruebas: `scripts/cfg/cfg.mjs`, `scripts/diagDSK.mjs`, `scripts/eco/guionesCore.mjs` y su prueba, `scripts/testClavesAlmacen.test.js`, `scripts/testConsultas.test.js`;
  - código: `src/App.jsx`, `src/components/GameTable.jsx`, `src/components/ManoActual.jsx`, `src/components/UtilitiesMenu.jsx`, `src/config/consultas.js`, `src/config/menuEntradas.js`;
  - textos: `src/config/textos.es.js` y su prueba;
  - banco imitado: `src/dev/bancoImitado.js` y su prueba, `src/dev/billeteraFalsa.js`;
  - hooks: `src/hooks/consultasCore.js`, `src/hooks/useConsultas.js`, `src/hooks/useUtilitiesMenu.js`;
  - estilos: `src/styles/embellecimiento.css`.
- **Borrados (en el índice, con `git rm`):** `src/components/CuentaPanel.jsx`, `src/styles/cuenta.css`.
- **Nuevos de esta fase:**
  - documentos: `docs/AJILEI_Menu_Utilidades_v1.6.md`, este informe;
  - arnés: `scripts/cfg/menu1e.mjs`;
  - código: `src/components/ConfirmarConsulta.jsx`, `src/lib/consultaApi.js`, `src/lib/consultaConfirmada.js`, `src/lib/partidaRapida.js` y su prueba, `src/styles/utilidadesMesa.css`;
  - servidor (de la 1e-i, ya en la base): `supabase/migrations/20261030193000_cfg1e_mano_actual.sql`, `supabase/pruebas/cfg1e_verificacion.sql`.
- **No son de esta fase:** los dos informes de MOT-1 y `laminas/mon1/`, que ya estaban antes de empezar.
- **Para borrar a mano** (sondas de la sesión; el borrado se me deniega): `scripts/_sonda1e.mjs`, `scripts/_corre1e.mjs`.

Las dos sondas no entran en ningún commit.

---

## 7. Las pruebas de Victor

### A · PC con el bypass (`npm run dev`, 5173)

| Paso | Qué debe ver |
|---|---|
| Mesa contra las IAS → ⋮ | Sonido, Reacciones, Tapetes, Partida rápida (pastilla «No», el icono atenuado), Mano actual con «20» en su badge. Ni la figurita ni la Heptacoin. Al pasar el ratón: «Partida rápida», «Mano actual» |
| `?cfg=consulta-gratis` → Mano actual en tres manos | 3 → 2 → 1 en el badge; la ventana sin preguntar, con «Te quedan 2 / Te queda 1 / Ya no te quedan…» al pie; sin recorrido dorado. Consultar dos veces la misma mano no baja la cifra |
| `?cfg=consulta-pago` → Mano actual | Badge «100». Ventana «Consultar tu mano cuesta 100 HC…» → «Consultar»: la ventana con el recorrido dorado y «Mano pagada: vuelve a mirarla gratis»; el badge pasa a ✓. Volver a consultar en la misma mano: sin pregunta y sin cobro |
| Siguiente mano → Mano actual | Cobra sin preguntar (ya se confirmó en la sesión); el badge vuelve a «100» al empezar la mano y a ✓ tras consultar |
| Mesa en Avanzado y en Pro con `?cfg=consulta-pago` | El badge dice 200 y 300 |
| `?cfg=consulta-sin-saldo` → Mano actual | «No te alcanza: 100 HC», sin la ventana de pregunta ni la del valor |
| «Partida rápida · Sí» a mitad de una mano | Esa mano sigue igual; la siguiente reparte visiblemente más rápido; el barajado dura lo mismo; recargar la página la conserva en «Sí» |
| `?cfg=mesa-humanos` → ⋮ | Sin Partida rápida: cuatro entradas |
| Stub PvP | No tiene ⋮ (sigue con su ⚙): nada que ver allí |

### B · Túnel con el S25 (`npm run build` → `npx vite preview --host` → `cloudflared`), con `test1976`

| Paso | Qué debe ver |
|---|---|
| ⋮ en vertical y acostado | Las cinco entradas, todas tocables a 44 (también Tapetes, desde que «Cuenta» salió); la pastilla «No» en Partida rápida y la cifra de Mano actual en su pastilla |
| «Partida rápida · Sí» | La siguiente mano reparte más rápido; el barajado igual; criterio de Victor: si el ×0,5 se siente brusco, se dice y se ajusta |
| Mano actual | La cifra real de `test1976` (20 si nunca consultó); una consulta gratis para ver el desglose, y la cifra baja a 19 |

### C · Servidor real, cuenta desechable `+borrar1e`

Con `npm run build` y `npx vite preview` en la PC (`localhost:4173`), en ventana de incógnito. **Nunca con `test1976` ni `ticotest2022`.**

| Paso | Qué debe ver |
|---|---|
| Crear la cuenta con `tucorreo+borrar1e@gmail.com` y bautizarla | El lobby con 0 HC (comparte huella: sin bono) |
| El rector revisa **el ajuste** (abajo) con el nombre en el hueco; Victor lo corre | «Success» sin filas; la píldora dice 1.500. El ajuste deja además **2 gratis** (P-3) |
| Sentarse en Básico, mesa de 2, apuesta 50, entrada mínima (500) | La billetera queda en **1.000**; Mano actual dice «2» |
| Una consulta gratis en la mano 1 y otra en la mano 2 (repetir en la misma mano no gasta) | 2 → 1 → «100»; la billetera no se mueve |
| La 3.ª, en la mano 3 | Pregunta «…100 HC…» → «Consultar»: billetera **900**, ✓ y el recorrido dorado. En el SQL Editor (opcional), un movimiento `consulta` de −100 con la nota «Mano actual · Básico» |
| Otra consulta en la misma mano · otra en la mano siguiente | Sin cobro · cobro sin preguntar, billetera **800** |
| Salir de la mesa → «Eliminar cuenta» → `eliminar` | La Portada (de paso, la 1c otra vez) |

**El ajuste** (una vez, revisado por el rector). Da 1.500 HC y, como atajo, deja la cuenta con 2 consultas gratis (`consultas.gratis_usadas = 18`, como dueño de la tabla). Probado en PGlite con todas las migraciones:
- para con el hueco sin rellenar, con los dos protegidos (con mayúsculas y espacios), con un usuario que no existe, con una cuenta ajena, con el alias `+borrar` de la 1c y en la segunda corrida;
- con la cuenta buena aplica una vez: 1.500 HC, un movimiento, y una sola fila en `consultas`, la suya, con 18.

```sql
-- CFG-1 1e · prueba C · 1.500 HC y 2 consultas gratis para la cuenta desechable `+borrar1e` (nace con
-- 0 HC porque comparte huella con el correo base). Se corre UNA vez, después de
-- que el rector lo revise. Si algo no cuadra, para con un error que empieza por
-- «STOP» y no cambia nada. Molde: el ajuste de la 1c (informe 1c §4 B).
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

  if v_correo !~ '^[a-z0-9._-]+\+borrar1e@gmail\.com$' then
    raise exception 'STOP: el correo de «%» no es un alias +borrar1e de gmail', USUARIO;
  end if;

  select b.saldo into v_saldo from public.billeteras b where b.jugador_id = v_id;
  if coalesce(v_saldo, 0) <> 0 then
    raise exception 'STOP: «%» ya tiene % HC (¿el ajuste ya se hizo, o nació con bono?)', USUARIO, v_saldo;
  end if;

  r := public.ajuste_admin(v_id, 1500, 'CFG-1 1e · prueba C · cuenta desechable, para pagar Mano actual');
  if not r.aplicado then
    raise exception 'STOP: el ajuste no se aplicó (%)', r.motivo;
  end if;
  -- El atajo de las gratis: le quedan 2 (las otras 18, gastadas como dueño de
  -- la tabla). Así la prueba ve el paso de «2 gratis» a «100 HC» en tres manos
  -- y no en veinte.
  insert into public.consultas (jugador_id, gratis_usadas) values (v_id, 18)
  on conflict (jugador_id) do update set gratis_usadas = 18;
  raise notice 'ok: «%» tiene ahora % HC y 2 consultas gratis', USUARIO, r.saldo;
end
$$;
```
