# AJILEI · ARN-3c · Instrumento III: verificadores, pruebas, servidor y ARN-1 · Informe v1.0

**Fecha:** 2026-10-02
**Ficha:** `AJILEI_ARN-3c_v1.0.md`
**Alcance de este informe:** **solo la sub-tanda 3c-i**. Para en el STOP-1. La 3c-ii espera la revisión del rector.
**Punto de partida:** `main` en `2b96e09` (ARN-3b-3). El árbol solo tenía los seis residuos conocidos.
**`src/` no se tocó**, tampoco `src/dev/`. Ningún protegido se abrió. **Ningún archivo se borró** (D2): la orden `git rm` está en §1.1.

**Dónde se midió:**
- **Corridas «de verdad»:** en el repo, con servidores propios.
- **Pruebas sin verificadores y sin volcados, y los controles:** en una copia fuera del repo (`scratchpad/arn3c/limpia`):
  - `git archive HEAD` **sin** los 20 archivos retirados;
  - el árbol de trabajo de 3c-i encima;
  - el `.env.local`;
  - una unión a `node_modules`.
- **Paralelismo:** como mucho 6 a la vez. `diagPUE todo` (incluye `dis`, vara de tiempo) corrió solo. La primera corrida de la copia, también sola (H3b-ii-4).

**Reloj:** de 03:01 a 03:52 (51 min de los 120). **Sin commits.**

## Resumen

| § | Resultado |
|---|---|
| **3c-i.1 · verificadores** | Se retiran **20 archivos rastreados**: 16 `verify*` y 4 sondas. `grep`: nada en `scripts/`, `package.json` ni `docs/` los invoca, solo cuatro comentarios que los nombran como historia. **En una copia sin ellos:** build limpio y vitest 1 160 + 1 saltada. **Orden `git rm` en §1.1.** `verifyC441` **se retira** (D3): «baraj» aparece 0 veces en las Reglas v1.3. `verifyREN1` **se fusiona en `msg`** como P5, «barrido Heptacoins». **Control:** una caja forzada a desbordar da **4 desbordes, `msg` rojo, código 1** |
| **3c-i.2 · `testBancoBandas`** | Índice `apu1_bandas_origen.json`: 75 volcados, 14,2 KB. **Copia limpia:** **1 160 + 1 saltada en voz alta**, con el aviso en la salida de siempre. **Con volcados:** **1 161/1 161** sin *skip*. **Controles:** un byte cambiado da **rojo por `sha256`**; un volcado de menos da **rojo, «presencia parcial»** |
| **3c-i.3 · aislamiento (D6)** | La regla de `contextoCap` pasa al terreno común: **todo contexto** de los cuatro arneses, y el WebKit de `dis`. La puerta mira lo que **llegó** (dirección de servidor), no la ruta. Una escapada es **código 2**. **Ningún modo necesita la base real**, así que no hay STOP. **Control:** sin la ruta, `gate` verde se convierte en **«3 escapadas → código 2»**. Cambia la consola de `retar`, `apu` y `rec2` (10 → 4 avisos conocidos por celda en `retar`), sin cambiar ningún veredicto |
| **3c-i.4 · `lob` y `msg` al 4173** | `lob` **6/6 verde** en el preview, con la sesión simulada. `msg` con la **vara de semillas 1–15**: **jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK**. **Reproducible:** dos corridas, **24 textos idénticos**. `--semilla=azar`: verde, anotado como **EXPLORACIÓN** |
| **3c-i.5 · remiendos** | **A-3:** `diagSAL shots` retirado; ahora sale con 2 y dice por qué. **H-11:** `rev` dice «canónico sin cobertura (informativo)». **Hallazgo:** los datos de la Fase 0 de REV-1 **tampoco existen en el repo**, y la columna **no es puerta** (pregunta 1) |
| **Varas** | **build** limpio · **vitest 1 161/1 161** en el repo (con volcados) y **1 160 + 1 saltada** en la copia sin volcados (1 145 de antes + 16 nuevas) · **eslint 21** |
| **Tras D6** | `lob` 6/6 · `msg` verde · `rev` verde 10/10 · `diagSAL sal` verde · `diagPUE todo`: solo `1.8b`, el rojo conocido · `cap` 31/31 · `voz2` 222/222. **Aislamiento verde y 0 escapadas en todas.** Mismo veredicto que en ARN-3b-ii |

---

## §1 · 3c-i.1 · Los verificadores (B1, D2–D4)

### 1.1 · Los que se retiran

**Qué se retira.** Son 20 archivos rastreados:
- los 16 `verify*.mjs`;
- 4 sondas sin veredicto: `shotFloat`, `shotStatus`, `measurePanel` y `_sh1probe`.

Entran tres que la Fase 0 había marcado como «fusionar», porque su fusión ya está hecha:

| Archivo | Por qué se retira ahora |
|---|---|
| `verifyC441b` | Su invariante (turno fantasma) vive en el bucle común desde ARN-3b: `scripts/arnes/juego.mjs:37` («D8 · el turno fantasma (verifyC441b, fusionado)»). |
| `verifyREN1` | Fusionado en `msg` en esta tanda (§1.3). |
| `verifyC441` | Retirado por D3 (§1.2). |

La ceremonia de encogimiento de `verifyShrink` ya la vigila el bucle común (`juego.mjs:84`). Con eso, quedan retirados los 16 de «retirar» de la Fase 0 §B1 más estos tres.

**Nada depende de ellos.** El `grep` que sigue busca los 20 nombres como palabra en `scripts/`, `package.json` y `docs/`, sin contar sus propios archivos:

```
scripts/arnes/cajas.mjs:2:      // … `verifyREN1` preguntaba, una sola vez y          (comentario, 3c)
scripts/arnes/juego.mjs:37:     // ── D8 · el turno fantasma (verifyC441b, fusionado)  (comentario, 3b)
scripts/arnes/juego.mjs:84:     // La ceremonia de encogimiento (la vigilancia viva de verifyShrink) (comentario, 3b)
scripts/diagDSK.mjs:10484-10494 // ── ARN-3c · D4 · P5 · Barrido «Heptacoins» (fusiona `verifyREN1`) (comentarios, 3c)
package.json: nada (sus scripts: dev, build, lint, preview, test, banco:verificar)
docs/: 0 invocaciones (`node|npm run|npx … <nombre>`). Solo los nombran informes de docs/reportes/, que son historia
```

`verifyIDN1.mjs:7` nombra a `verifyEMB1`, pero ese archivo también se retira.

**En una copia sin ellos** (`git archive HEAD` excluyendo los 20, más el árbol de 3c-i):
- `vite build`: limpio;
- `vitest`: **1 160 pasan · 1 saltada (visible) · 1 161**;
- con los volcados copiados: **1 161/1 161** (§2).

**La orden, para Victor** (en la ficha de commits, dentro del commit de arnés):

```
git rm scripts/verifyC43.mjs scripts/verifyC431.mjs scripts/verifyC44.mjs scripts/verifyC441.mjs scripts/verifyC441b.mjs scripts/verifyC45.mjs scripts/verifyC45a.mjs scripts/verifyC45b.mjs scripts/verifyC45c.mjs scripts/verifyEMB1.mjs scripts/verifyGameOver.mjs scripts/verifyIDN1.mjs scripts/verifyMesa5.mjs scripts/verifyREN1.mjs scripts/verifyShrink.mjs scripts/verifyViewport.mjs scripts/shotFloat.mjs scripts/shotStatus.mjs scripts/measurePanel.mjs scripts/_sh1probe.mjs
```

**`scripts/_cel1bFila.mjs`** (3c-i.1.4) no está en git: lo borra Victor a mano. Solo se anota.

### 1.2 · `verifyC441` (D3): **se retira**

La regla «el ante se ve descontado **antes de barajar**» **no está** en `docs/AJILEI_APU-1_Reglas_v1.3.md`:
- «baraj» aparece **0 veces** en el documento, y «shuffle» y «animaci», también 0.
- Lo que el documento sí sella es **cuánto y quién**, no **cuándo se ve respecto del barajado**:
  - §1, `:38`: «**Ante** · Lo que cada jugador vivo paga al pozo al arrancar cada mano. **Ante = apuesta de mesa.**»
  - §2.4, `:108-113`: «Cada mano cobra **un ante = apuesta de mesa** a cada jugador vivo […] Quien no cubre el ante queda fuera […] El ante que deja la pila en cero marca all-in».

Por D3, se retira.

La otra mitad del verificador era la parte B: «una Mano humana que se retira en `BET_1` no estanca la mano». Esa la cubre hoy el bucle común. Una mano que no cierra es `SINCERRAR`, con su motivo (ARN-3b).

### 1.3 · `verifyREN1` → `msg` (D4)

`verifyREN1` declaraba a mano la caja de 10 sitios y comparaba contra la palabra vieja, «fichas». Era una comparación antes/después, de un solo uso. Pasa a ser una **puerta permanente de `msg`, la P5 «barrido Heptacoins»**:

- **Qué mide.** Recorre **todo** nodo de texto visible que diga «Heptacoins». Su caja es el primer antepasado que no es `inline` ni `contents`. Se mide contra:
  - en horizontal, la caja de contenido;
  - en vertical, la caja de relleno (la caja de línea puede invadirla sin que se vea);
  - el desplazamiento interno de la caja;
  - los antepasados que recortan (`overflow: hidden|clip`). Los que desplazan no cuentan.
- **«Recorta».** Un recorte con `text-overflow: ellipsis` es la marca del producto (VOZ-2). Se informa como «recorta», no como rojo.
- **Qué no mide.** Lo que no monta: rango 0×0, `visibility` oculta, opacidad 0, o recortado a propósito con `clip`/`clip-path`. Es el rojo fantasma que `verifyREN1` ya había pagado.
- **El juicio es puro:** `juzgaCajaTexto` en `scripts/arnes/cajas.mjs`, con **8 pruebas** en `cajas.test.js`.
- **Dónde barre:**
  - en cada sondeo de las manos de P2 (7 celdas);
  - en P5:
    - la **ruta**, con un gancho opcional `alPaso` nuevo en `recorrerRuta`: lobby, reto, jugadores, apuesta y entrada, a 360×640 y 740×360;
    - la **mesa en la zona hueco 800×1200**, en mesa 5 y mesa 2, que es el único sitio donde montan `.opp-chips` y `.ai-chips`, con una mano jugada;
    - el **diálogo de compra de tapetes** («¿Comprar Tricolor por 50.000 Heptacoins?»), a 360×640 y 1920×937.
- **Veredicto:** 0 desbordes, sin errores de recorrido y al menos una medida. Entra en el `passed` de `msg`.

**Lo que barre hoy, con la vara** (las dos corridas dan lo mismo): **963 medidas, 10 cajas distintas, 0 desbordes, 0 recortes.**

| Vista | Caja | Estado |
|---|---|---|
| hueco5-800x1200 | `span.opp-chips` «1500 / 1450 / 1400 / 1350 Heptacoins» | cabe |
| hueco5-800x1200 · hueco2-800x1200 | `span.pbr-fichas-word` «Heptacoins» | cabe |
| hueco2-800x1200 | `span.ai-chips` «1500 / 1450 Heptacoins» | cabe |
| 360×640 · 1920×937 | `p.tap-dialogo-txt` «¿Comprar Tricolor por 50.000 Heptacoins?» | cabe |

**Lo honesto: las 7 celdas de P2 no aportan cajas con la vara.**
- En 1366×768, 360×640 y 740×360, `.pbr-fichas-word` es `display: none`.
- El óvalo solo dice «Apuestas N Heptacoins.» si el humano abre, y el bucle de `msg` pasa siempre que puede.
- Las pantallas de la ruta (lobby y filas de «Retar a las IAS») no llevan la palabra.

La cobertura sale de P5, que es para lo que se hizo. Con `--semilla=azar` (base 284683227) el humano sí abrió una mano, y el barrido midió además **«Apuestas 50 Heptacoins.» en el óvalo**: `p.game-message`, cabe, en T2 1366×768 y en hueco2. Prueba que el barrido alcanza el óvalo cuando la frase sale.

**Control (D4).** En la copia, `.pbr-fichas-word { display: inline-block; max-width: 3ch; overflow: hidden; white-space: nowrap }` con `!important`, al final de `gameTable.css`. Corrida: `diagDSK msg 2`.

```
msg·barrido «Heptacoins» · FALLA · 821 medidas · 6 cajas distintas en 4 vistas · desbordes=4 · recortes del producto (elipsis)=0
   ✗ T2 1366x768 · span.pbr-fichas-word · «Heptacoins» (mesa, exceso 49px)
   ✗ T2 360x640 · span.pbr-fichas-word · «Heptacoins» (mesa, exceso 39px)
   ✗ T2 740x360 · span.pbr-fichas-word · «Heptacoins» (mesa, exceso 54px)
   ✗ hueco2-800x1200 · span.pbr-fichas-word · «Heptacoins» (mesa, exceso 49px)
── MSG: compositor OK (92 casos) · jugado 3/3 · fin 1/1 · Δ larga 3/3 · caza 1/1 · barrido FALLA (6 cajas) · ROJO · semillas vara 1–15
── diagDSK msg · msg rojo · aislamiento verde → código 1
```

---

## §2 · 3c-i.2 · `testBancoBandas` (D5)

**Índice:** `scripts/apu1_bandas_origen.json`.
- 75 entradas: `unit`, `siembra` y `sha256` de cada volcado.
- 14,2 KB.
- Lo generó una sonda de un solo uso fuera del repo, a partir de los 75 volcados de `capturas-dsk/`.
- Las 87 celdas de la vara apuntan a esos 75 volcados (8 los comparten).

**La prueba**, en dos pisos (`scripts/testBancoBandas.test.js`):
1. **Siempre:** cada celda de la vara coincide con el índice (`unit` y `siembra`), el índice tiene 75 entradas y no sobra ninguna.
2. **Solo con volcados:** cada volcado tiene el `sha256` del índice y dice lo mismo que su celda.
   - **Sin ninguno**, se salta **en voz alta**: `it.skipIf` con el motivo en el nombre de la prueba, más un aviso en `stderr`.
   - El aviso va por `stderr` porque **`console.warn` no se ve con el reporter por defecto de vitest**: solo con `--reporter=verbose`. Comprobado en la copia: el aviso se veía en `verbose` y no en `npm test`. Por eso se cambió.
   - **Con algunos y no todos**, es **rojo** («faltan volcados (presencia parcial)»).

**Demostraciones:**

| Árbol | Resultado |
|---|---|
| Copia limpia, sin volcados (y sin verificadores) | **1 160 pasan · 1 saltada · 1 161**. En la salida de siempre: `⚠ testBancoBandas · SALTADA la comprobacion por sha256: no hay ninguno de los 75 volcados de scripts/apu1_bandas_origen.json en este arbol (clon limpio). La vara solo se comprueba contra el indice.` |
| La misma copia con los 75 volcados | **1 161/1 161**, sin *skip* |
| Repo (con volcados) | **1 161/1 161** |

**Controles:**
- **Un volcado con un byte cambiado** (`capturas-dsk/_conv1c2f/conv_m2_espejo_basico.json`, byte 2: espacio → tabulador; el JSON sigue siendo válido): **rojo**, `sha256 de capturas-dsk/_conv1c2f/conv_m2_espejo_basico.json: expected 'b334d4c7…' to be 'cb8a6537…'`.
- **Un volcado de menos:** **rojo**, `faltan volcados (presencia parcial)`.
- Restaurado: 13/13.

---

## §3 · 3c-i.3 · El aislamiento de la base (D6)

### 3.1 · Cómo lo conseguía `contextoCap`, y cómo se lleva al terreno

`contextoCap` (`scripts/cap/capMesa.mjs`) pone **una ruta para todo** en el contexto:
- lo local (`data:`, `blob:` y el origen) pasa;
- al host de Supabase le contesta el arnés (`profiles` → perfil falso, `rpc/*` → `null`, `auth/v1/user` → usuario, `auth/v1/token` → sesión, el resto → `[]`);
- todo lo demás se corta y se anota en `red.fuera`, que `cap.red` quiere en 0.

**La misma regla, en el terreno común** (`scripts/arnes/comun.mjs`, `aislarContexto` y `aislarNavegador`):
- **Dónde se engancha.** En `browser.newContext` **de la instancia** que devuelve `navegadorArnes()`. `browser.newPage()` de playwright-core 1.62.1 crea su contexto llamando a `this.newContext(…)`, así que los ~70 sitios que abren página en los cuatro arneses quedan cubiertos sin tocarlos uno a uno.
- **El WebKit de `diagPUE dis`** no sale de `navegadorArnes()` y se aísla a mano.
- **Orden.** La ruta se registra al nacer el contexto. En Playwright manda la última ruta registrada, así que las de `contextoCap` y `contextoBie` (con su sesión y sus retrasos) siguen mandando, y la común queda debajo como red de seguridad.
- **Sockets.** Los no locales (el tiempo real de Supabase) se desvían con `routeWebSocket` y quedan abiertos y mudos. El de Vite, que es local, no se toca.
- **Qué contesta.** Lo mismo que `contextoCap`. Un RPC devuelve `null` con 200: con un cuerpo de error, `traducir` escribiría un `SAL-A` en la consola, y `retar`, `apu`, `rec2` y `diagSAL` lo contarían.
- **Lo puro**, en `nucleo.mjs` con 7 pruebas nuevas en `nucleo.test.js`: `esLocal`, `clasificarPeticion`, `respuestaSupabase`, `corteDelArnes` y `veredictoAislamiento`.

**La puerta** no mira la ruta, porque eso sería creerse a sí misma: mira **lo que llegó**. Hay escapada en tres casos:
- una respuesta de un host no local **con dirección de servidor**: las que contesta el arnés tienen `serverAddr() === null`, medido con una sonda;
- un fallo de red que no es un corte del arnés: el corte propio es `ERR_BLOCKED_BY_CLIENT`;
- un socket no local que dispara `page.on('websocket')`: uno desviado no lo dispara, también medido.

Una sola escapada es **error de instrumento (código 2)**. El veredicto se aplica en `terminar()`, así que cubre los cuatro arneses con un único cambio. `diagDSK` además lo escribe en su JSON (`aislamiento`) y en `veredicto`. Cada corrida termina con una línea:

```
· aislamiento (D6): 18 contextos · 11 a Supabase contestadas aquí · 0 destinos cortados · 0 sockets desviados · 0 escapadas → verde
```

**`cap.red` no pierde vista.** Un socket desviado ya no dispara `page.on('websocket')`, así que `contextoCap` lee además la lista del terreno (`ctx.__aislamiento.sockets`).

**Ningún modo necesita la base real.** Lo encontró un censo de solo lectura de los cuatro arneses y de `src/`:
- **Con bypass**, la app no toca la red de autenticación (`useAuth.js:107,131`). La única llamada a Supabase es `mi_sala` (`App.jsx:281`), una por carga sin `?sal=`.
- **Saldo, retos y tapetes** son locales.
- **`?sal=`** sustituye la API entera por sus fixtures (`salasFixtures.js`).
- **`useReloj`** (`rpc('ahora')`) no lo importa nadie.

No hay STOP por D6.

### 3.2 · Modos cuya consola cambia

| Modo | Antes | Ahora | ¿Cambia el veredicto? |
|---|---|---|---|
| `diagDSK retar` | `401` + `SAL-A … 42501 … mi_sala` en cada carga; filtrados como ruido conocido (`RETAR_RUIDO_CONOCIDO`, `diagDSK.mjs:1246`) | **`consolaConocida` 10 → 4 por celda**: quedan solo los avisos `boolean attribute` (el `inert` de B9). **Verde**, código 0, 24 peticiones a Supabase contestadas aquí | No |
| `diagDSK apu` y su REC-2 | el mismo filtro (`APU_RUIDO_CONOCIDO`) | el ruido de Supabase desaparece. **Se acaba H3b-ii-7:** un corte de red ya no puede pintar de rojo una celda | No (no corrido en 3c-i: ver §7) |
| `diagSAL sal` | sin tráfico a Supabase (`?sal=`) | **sin cambio**: 102 contextos, 0 peticiones a Supabase, 0 cortadas. Su `sal.2` cuenta `requestfailed`, y ninguna petición se cortó | No |
| `diagPUE` (`todo`, `cap`, `bie`, `voz2`) | anónimo en preview: 0 peticiones; `cap` y `bie` ya interceptaban | sin cambio | No |
| El resto de `diagDSK` en 5173, y `diagCEL0` | el `401` y el `SAL-A` en la consola cruda, que ninguna puerta lee | desaparecen | No |

**Ningún modo se apoyaba en el ruido**: solo lo filtraban.

**Queda un punto ciego** (H3c-2). El filtro `/mi_sala/` y `/status of 401/` filtra ahora un ruido que ya no existe. Desde hoy, solo podría esconder **otro** `401` real. No se tocó en 3c-i: quitarlo obliga a volver a correr `apu` (40 min). Se propone para 3c-ii.

### 3.3 · Control (D6)

**El control.** En la copia, la ruta y el desvío de sockets se anulan (`if (false) await ctx.route(…)` y `if (false) await ctx.routeWebSocket(…)`) y el vigía se deja intacto. Se corre `diagDSK gate`, que va a 5173 con bypass y hace la llamada a `mi_sala` en cada carga. Fue la primera corrida de esa copia, y corrió sola. El subdominio del proyecto se tacha aquí, como en CAP: no se clava en el repo.

```
── diagDSK gate · gate verde · aislamiento error → código 2
· aislamiento (D6): 10 contextos · 0 a Supabase contestadas aquí · 0 destinos cortados · 0 sockets desviados · 3 escapadas → ERROR DE INSTRUMENTO
✖ 3 petición(es) salieron a la red real:
    POST https://<ref>.supabase.co/rest/v1/rpc/mi_sala ← 172.64.149.246:443
    POST https://<ref>.supabase.co/rest/v1/rpc/mi_sala ← 104.18.38.10:443
    POST https://<ref>.supabase.co/rest/v1/rpc/mi_sala ← 172.64.149.246:443
```

El modo medido sale verde por sí mismo. Pero el instrumento dice que esa medida se hizo hablando con la base real, y la corrida entera es 2. Con la ruta puesta, la misma copia y el mismo modo darían «0 escapadas»: lo dicen todas las corridas del repo de §6, con 6 a 102 contextos cada una.

---

## §4 · 3c-i.4 · `lob` y `msg` al 4173 (D7)

**`diagDSK` elige el servidor por modo:**
- `lob` y `msg` levantan `vite preview` (4173 o `--puerto=N`);
- `all` levanta además un preview para `lob` (4173 o `--puerto-aux=N`);
- el resto sigue en dev con bypass.

`rec` y `voz2.burbuja` se quedan en 5173 a propósito: `?apu=` solo existe en DEV.

**`lob`.** Las seis vistas entran por `contextoCap` tal cual (`{ w, h, dpr: 1, movil: false }`), como en AJF-1. Su puerta de consola es la de siempre: solo `pageerror`.

**`msg`.** Cada página que abre lleva su propia semilla de una **lista fija**, que es la vara:
- `contextoCap` acepta ahora `{ semilla }`;
- la semilla es `MSG_SEMILLA_BASE + k`, con `k` numerando las páginas en el orden en que `msg` las abre:
  - 0–6, las siete celdas de P2 y P4;
  - 7–8, las dos cazas;
  - 9, el fin de partida;
  - 10–14, el barrido de P5.
- La caza siembra además el barajado de la mano 1 con la suya (`msgSiembraAzar`). Al gastarse, esa siembra devuelve el azar a la de la página.

**Las semillas de la vara: `MSG_SEMILLA_BASE = 1`, es decir, 1–15**

| k | Página | Semilla |
|---|---|---|
| 0–6 | P2 y P4: T5, T4, T3 y T2 a 1366×768 · T5 y T2 a 360×640 · T2 a 740×360 | 1–7 |
| 7–8 | cazas «AJILEI natural» (T2) y «falso 51» (T5) | 8–9 |
| 9 | P3, fin de partida (T2 1366×768) | 10 |
| 10–14 | P5, barrido: ruta 360×640 (+ tapetes) · ruta 740×360 · hueco5 · hueco2 · tapetes 1920×937 | 11–15 |

**Por qué estas.** Son **la primera base que mantiene las coberturas de hoy**: jugado 7/7, fin 1/1, Δ larga 7/7 y caza 2/2. Además, dentro de la vara ejercitan lo que `msg` audita.
- La **condición ① completa** (pastilla de Mano oculta + gana la Mano + empate) sale **1 vez**.
- El insumo distinto del viejo sale 2 veces (T5 360×640 mano 2; T2 740×360 mano 2).
- **19/19 manos re-derivadas** con cartas leídas cuadran con el evaluador.
- Sale un AJILEI de comodín (T5 1366×768, mano 2: «¡AJILEI! IA 3 gana con mano perfecta (comodín).»).

En total, 20 manos jugadas.

Las cazas siguen buscando su propia semilla de barajado: 4394 (AJILEI natural) y 740 (falso 51), como antes.

**Reproducible.** Dos corridas independientes de la vara, la primera con otras cuatro en paralelo, dan **los mismos 24 textos**: 21 frases de resultado de P2 más las dos cazas, comparadas con `diff`, y el barrido igual (10 cajas).

La siembra de `contextoCap` cubre la sesión entera, no solo la primera mano como en CAP. Que las 20 manos salgan idénticas dice que ningún consumidor de `Math.random` dependiente del reloj se cuela entre ellas. Con esto, **E-22** (el rojo intermitente de 1 de cada 4 en mesa 5 a 1366×768) deja de ser intermitente con la vara: o sale siempre, o no sale. Con la 1–15 no sale.

**`--semilla=azar`** (o `--semilla=N`) cambia la base:
- el JSON lo anota (`msg.semillas: { modo, base, lista, exploracion: true }`);
- el resumen dice `EXPLORACIÓN (no es la vara)`;
- en cualquier otro modo, o con un valor que no sea `azar` ni un entero, es error de instrumento.

Corrida de exploración, `--semilla=azar`:

```
── MSG: compositor OK (92 casos) · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK (14 cajas) · VERDE · semillas EXPLORACIÓN (no es la vara) base=284683227
```

Para reproducirla: `node scripts/diagDSK.mjs msg --semilla=284683227`.

`lob --semilla=azar` sale con 2 **antes de levantar nada**. Primero validaba después de levantar el servidor; se corrigió durante la tanda porque un preview compila (ver H3c-6).

---

## §5 · 3c-i.5 · Los dos remiendos

- **A-3 · `diagSAL shots`: retirado** de la lista de modos y de la cabecera.
  - Nadie lo usaba: 0 menciones fuera de su propia cabecera y del informe de ARN-3a que lo encontró.
  - `node scripts/diagSAL.mjs shots` sale ahora con 2 y dice por qué: «"shots" se retiró en ARN-3c: no era un modo distinto; `sal` deja las capturas».
- **H-11 · `rev`: el salto pasa a ser visible.**
  - **Qué se salta.** La comparación contra la Fase 0 de REV-1 lee `capturas-rev/json/_comparacion.json` y `capturas-rev/lab/_canon__cont.png`. **Ninguno de los dos existe hoy ni en el repo de Victor**: `capturas-rev/` solo guarda `fase1b/`.
  - **No es puerta.** Se comprobó: ninguna de `p1`–`p5` ni la oclusión la leen. Solo alimenta las columnas «canónico antes → después» del listado.
  - **Qué sale ahora.** El estado, según los tres estados de 3b (`medida` / `sinCobertura`), en el JSON (`rev.canonico`), en una línea propia y en el resumen:

```
rev canónico · columnas «canónico» SIN COBERTURA (informativas, no son puerta): falta capturas-rev/json/_comparacion.json y capturas-rev/lab/_canon__cont.png
── REV · VERDE · 10 celdas · p1_delta ✓ · p2_marco ✓ · p3_asset ✓ · p4_dibujo ✓ · p5_fuera ✓ · oclusión ✓ · canónico sin cobertura (informativo) · …
```

  - **No cambia el código de salida, a propósito.** Si entrara al veredicto como `cobertura`, `rev` saldría con 1 **para siempre**, por una columna que nunca fue puerta y cuyos datos ya no existen. Ver la pregunta 1 al rector.

---

## §6 · Varas y veredictos tras D6

### 6.1 · Varas

| Vara | Repo (con volcados) | Copia limpia (sin volcados ni verificadores) |
|---|---|---|
| `vite build` | limpio | limpio |
| `vitest` | **1 161/1 161** (43 archivos) | **1 160 pasan · 1 saltada en voz alta · 1 161** |
| `eslint` | **21** (20 errores + 1 aviso, los mismos tres archivos de `src/`) | — |

Pruebas nuevas, 16:
- 8 en `cajas.test.js`;
- 7 en `nucleo.test.js`;
- 1 en `testBancoBandas.test.js` (la de `sha256`; la de procedencia se reescribió).

1 145 + 16 = 1 161.

**Una pasada intermedia de eslint dio 22.** `process` no está declarado en ese archivo de prueba, igual que `Buffer`. Se importa de `node:process`, y la cuenta vuelve a 21.

### 6.2 · Veredictos tras D6 (todos con servidor propio, en el repo)

| Modo | Servidor | Resultado | Aislamiento | Código | Antes (3b-ii) |
|---|---|---|---|---|---|
| `diagDSK lob` | preview 4183 | **6/6 verde** | 6 contextos · 0 escapadas | 0 | 6/6 en 5173 |
| `diagDSK msg` (vara) ×2 | preview 4184 / 4188 | **verde**: jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK | 22 contextos · 0 escapadas | 0 · 0 | verde en 5173 |
| `diagDSK msg --semilla=azar` | preview 4189 | verde (exploración) | 22 · 0 | 0 | — |
| `diagDSK rev` | dev 5173 + 5174 | **verde 10/10** · p1–p5 ✓ · oclusión ✓ · canónico sin cobertura (informativo) | 18 contextos · **11 a Supabase contestadas aquí** · 0 escapadas | 0 | verde (Fase 0) |
| `diagDSK retar` | dev 5173 | **verde** · `consolaConocida` 4 por celda (era 10) | 6 · 24 contestadas · 0 | 0 | verde |
| `diagSAL sal` | dev 5185 | **verde** | 102 contextos · 0 a Supabase · 0 cortadas | 0 | verde |
| `diagPUE todo` (**solo**) | preview 4183 | **195 mediciones, 1 en rojo: `1.8b`** (222,0 KiB, el conocido). `dis.relevo` verde | 49 contextos (con el WebKit) · 0 escapadas | 1 | igual |
| `diagPUE cap` | preview 4187 | **31/31** | 7 · 0 | 0 | 31/31 |
| `diagPUE voz2` | preview 4186 + dev 5186 | **222/222**, burbuja incluida | 40 contextos · 38 contestadas (las `mi_sala` de la burbuja en dev) · 0 | 0 | 222/222 |

`cap` y `voz2` corrieron con `--sin-build` sobre el `dist/` compilado a las 03:16 con este mismo árbol (`src/` sin cambios). `todo` también: su `1.8b` mide el bundle real.

**Mismo veredicto que en ARN-3b-ii en todos.** Lo único nuevo es la línea de aislamiento.

---

## §7 · Hallazgos nuevos (se reportan, no se arreglan)

| ID | Hallazgo |
|---|---|
| **H3c-1** | **`console.warn` no se ve en la salida por defecto de vitest 4.1.8** cuando la prueba pasa: solo con `--reporter=verbose`. Un *skip* «visible» por `console.warn` es, en la práctica, silencioso con `npm test`. Aquí se resolvió con `process.stderr.write`. Conviene recordarlo para cualquier aviso futuro en pruebas |
| **H3c-2** | **Filtro de ruido con un punto ciego.** `RETAR_RUIDO_CONOCIDO`, que también es `APU_RUIDO_CONOCIDO` (`diagDSK.mjs:1246`), sigue filtrando `/mi_sala/` y `/status of 401/`, un ruido que con D6 ya no puede darse. Desde hoy solo podría esconder **otro** `401` real. Además, su comentario remite a una cabecera de `diagSAL` que no lo menciona. Quitarlo obliga a volver a correr `apu` (unos 40 min). Se propone para 3c-ii |
| **H3c-3** | **Los datos de la Fase 0 de REV-1 no existen ni en el repo.** `capturas-rev/` solo guarda `fase1b/`. La regla que cita `REV_CAUSA_B` («su Δ contra el canónico tiene que bajar a la franja del control 3,0–13,2») **no se puede comprobar en ninguna máquina** y nunca fue puerta |
| **H3c-4** | **`scripts/screenshots/`: 31 PNG rastreados** que solo escribían los verificadores retirados. Está en `.gitignore` desde VIS-1c («`scripts/screenshots/` entra en `.gitignore`»), pero los archivos siguen rastreados. Si el rector lo quiere: `git rm -r --cached scripts/screenshots`. No entra en D2 y no se tocó |
| **H3c-5** | **`_vc2audio.mjs`** lanza su propio Edge con `chromium.launch({ channel: 'msedge' })` y no pasa por `navegadorArnes()`, así que D6 no lo alcanza. No es uno de los cuatro arneses ni estaba en la lista de B1. Los generadores de assets (`gen-*`, `dis1/contrato_lamina`, `idx/idxNavegador`) tampoco pasan, pero están aplazados por B2 y no hablan con Supabase |
| **H3c-6** | **`all` compila desde 3c-i:** levanta un preview para `lob`. Un `diagDSK` con preview compila sobre `dist/`, y **vaciar `dist/` mientras otro arnés lo sirve con `--sin-build` es un riesgo**. Pasó una vez en esta tanda: una prueba de `--semilla` mal colocada compiló con tres `msg` sirviendo `dist/`, y no les afectó porque el contenido era idéntico. La validación ya va antes de levantar nada. La regla de 3b-ii sigue en pie: un solo build por tanda y el resto con `--sin-build`. Esto entra en la decisión de `all` de 3c-ii.1.4 |
| **H3c-7** | **La herramienta de edición dejó `scripts/cap/capMesa.mjs` entero en CRLF**, y git avisó. Se devolvió a LF. Es la misma trampa que la de Python en 3b. Los demás archivos tocados están en LF (`file`) |

## §8 · Preguntas al rector

1. **H-11 / H3c-3.** La comparación «canónico» de `rev` es informativa y sus datos ya no existen.
   - ¿Se queda como está (visible como «sin cobertura», sin cambiar el código)?
   - ¿Entra al veredicto como `cobertura`? Eso deja `rev` en 1 para siempre.
   - ¿O se retira la columna, junto con `REV_CAUSA_B`?
2. **H3c-2.** ¿Se quitan `/mi_sala/` y `/status of 401/` del filtro de ruido en 3c-ii, con su corrida de `apu`?
3. **D7 · `all`.** Ahora levanta dos servidores (dev y preview) y compila. ¿Se acepta así hasta que 3c-ii.1.4 decida qué es `all`?
4. **H3c-4.** ¿Se sacan del índice los 31 PNG de `scripts/screenshots/` en el mismo commit de arnés?

## §9 · STOP-1

**Mapa provisional archivo → commit.** El definitivo va en el STOP-2.

| Commit | Archivos |
|---|---|
| núcleo | `scripts/arnes/nucleo.mjs` · `scripts/arnes/nucleo.test.js` · `scripts/arnes/cajas.mjs` · `scripts/arnes/cajas.test.js` · `scripts/arnes/comun.mjs` |
| arnés | `scripts/diagDSK.mjs` · `scripts/diagPUE.mjs` · `scripts/diagSAL.mjs` · `scripts/cap/capMesa.mjs` · `scripts/rutaMesa.mjs` · **la orden `git rm` de §1.1** |
| índice de B7 | `scripts/apu1_bandas_origen.json` · `scripts/testBancoBandas.test.js` |
| informe | `docs/reportes/AJILEI_ARN-3c_Informe_v1.0.md` |

**Servidores y navegadores.**
- Todos vivieron dentro de su proceso y murieron con él.
- A las 03:52 no queda ningún `node` vivo.
- `netstat` en 4170–4299 y 5000–5599:

```
  TCP    0.0.0.0:5040           0.0.0.0:0              LISTENING       7724
```

Es el `svchost.exe` de Windows de siempre (PID 7724), ajeno. En los puertos que usó el arnés no escucha nada: 4183, 4184, 4186–4189, 4293, 5173, 5174, 5185, 5186 y 5293.

**Copias.**
- `scratchpad/arn3c/limpia` lleva los controles de D4 y D6 encima.
- `scratchpad/arn3c/limpia2` lleva el árbol final, sin verificadores ni volcados.

Las dos uniones a `node_modules` se quitaron con `rmdir`, y el `node_modules` del repo sigue intacto. Los logs de cada corrida están en `scratchpad/arn3c/logs/`, junto con la sonda del índice (`genOrigen.mjs`) y la de Playwright (`sondaPw.mjs`).

**`git status --porcelain`:**

```
 M scripts/arnes/comun.mjs
 M scripts/arnes/nucleo.mjs
 M scripts/arnes/nucleo.test.js
 M scripts/cap/capMesa.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M scripts/diagSAL.mjs
 M scripts/rutaMesa.mjs
 M scripts/testBancoBandas.test.js
?? docs/reportes/AJILEI_ARN-3c_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/apu1_bandas_origen.json
?? scripts/arnes/cajas.mjs
?? scripts/arnes/cajas.test.js
```

Lo que hay es el árbol de 3c-i y los seis residuos. `src/` está intacto. **Sin `git add`.** La 3c-ii espera la revisión del rector.

---
---

# Parte 3c-ii

**Ficha:** `AJILEI_ARN-3c-ii_v1.0.md`, que sustituye a la ficha madre para esta sub-tanda.
**Punto de partida:** `main` en `2b96e09` con el árbol de trabajo de 3c-i encima. No se descartó nada.
**`src/` no se tocó**, tampoco `src/dev/`. Ningún protegido se abrió: `gameEngine.js` se quiso leer en §11.1.2 y no se abrió; se midió desde fuera.
**Reloj:** de 06:46 a 08:59 (133 min de los 150). **Sin commits.**

**Dónde se midió:**
- **Corridas «de verdad»:** en el repo.
- **Controles:** en una copia, `scratchpad/arn3c/ctl2`:
  - `git archive HEAD` con el árbol de trabajo encima;
  - el parche de controles `parche_ctl2.py`, en el que cada control se enciende con una variable de entorno que **solo existe en esa copia**;
  - dos guardas quitadas de su `GameTable.jsx` y `table-knock.mp3` apartado.
- **Copia sin volcados ni verificadores:** `scratchpad/arn3c/limpia3`.
- **Paralelismo:** como mucho 6 a la vez. Las varas de tiempo, solas. La primera corrida de `ctl2`, sola. Un solo build por tanda (D13).

## Resumen de 3c-ii

| § | Resultado |
|---|---|
| **D10 · qué quedaba de ARN-1** | El informe de la Fase 0 de ARN-1 **no está en el repo**. Comprobado contra el código: las cuatro piezas seguían pendientes |
| **§11.1.1 · `encadenado` honesto** | Hecho sin tocar `src/`: el arnés lo deduce de `espera` contra `TOC_NOMINAL_MS`, leído de su fuente. **Control:** con el toc-toc ausente, rojo en las 5 celdas, donde `!!audio` daba verde. **En la vara salió VERDE las 5 veces**, no rojo como esperaba la ficha (pregunta 4) |
| **§11.1.2 · modo `congelado`** | **Nuevo, verde 5/5** (turno, audio, IA, «Siguiente mano», fin del barajado), cada guarda medida en sus dos lados. **Control:** sin dos guardas, 2 rojas. `salta` **no alcanzable**: el motor ya no pone el turno en la Mano retirada, medido a la vista 3/3. `arranca` declarada no sellada |
| **§11.1.3 · `win.mp3`** | La compuerta pide ahora «el roce y nada más». **Control:** un sonido ajeno da rojo con `AJENO=[…]`. Se arregló el bucle `vcHastaVictoria` (no esperaba la revelación). **`vc` sigue rojo** por dos cosas previas que ahora se ven (§11.1.3, pregunta 2) |
| **§11.1.4 · `all`** | Propuesta, no aplicada: **A** (renombrar a `humo`, ~4 min de corrida) ahora y **C** (orquestador, ~1 h 05 de pared) como pieza propia |
| **§12 · `vuelos.sobrante`** | Puerta permanente en `a2`. **`a2` 20/20 verde**, con «tapete (8)» **en las 20 celdas**. **Control:** fondo bajo la fila, rojo |
| **§13 · `cicloVisibility`** | Por señal propia del pago (`A2_EN_PAGO`: el `data-tono` del resultado más las señales de `APU_PAGO_VISIBLE`). `APU_PAGO_VISIBLE` sola **falló su control** (no cubre la revelación). **Controles:** antes rojo ×2, después verde ×2, y una banda visible fuera del pago sigue roja |
| **§14 · D11–D15** | `rev` sin canónico: **verde 10/10**. Filtro sin `401`: `retar` **verde** · `apu` **REC-2 18/18, mesa 6/7, consola 0 en las 7**; el rojo es `apu.5` en 360×640, una carrera de lectura que no se repitió en 2 corridas a solas. **Control:** un `401` inyectado da rojo. `scripts/screenshots/` y `_vc2audio.mjs` a las órdenes de `git rm` (§19) |
| **§15 · varas de tiempo** | Mediana de 3 por puerta, sin aflojar umbrales. **Estables en 5/5:** `celebracion` siempre los 5 conocidos de CEL-2c y 0 nuevos; `dis` 68/68 las cinco veces |
| **§16 · E-22** | **6 de 12 corridas, por el tope. No apareció.** Bases anotadas |
| **Varas finales** | build limpio (uno solo) · vitest **1 175/1 175** en el repo y **1 174 + 1 saltada** en `limpia3` · eslint **21** |

## §10 · D10: qué seguía pendiente de ARN-1

**El informe de la Fase 0 de ARN-1 no existe en el repo:**
- `find` y `git log --all` sobre `*ARN*` solo dan los commits `e2989cc` y `3c20697` (ARN-1) y los informes de ARN-3;
- la ficha madre lo situaba en `docs/reportes/`, y ahí no está.

La comprobación se hizo **contra el código vivo**, pieza por pieza:

| Pieza | ¿Pendiente? | Evidencia |
|---|---|---|
| `encadenado` honesto | **sí** | `useCoreografia.js:241` publica `encadenado: !!audio`, y `diagCEL0` lo creía (`ancla.encadenado !== true`) |
| `congelado` simulado | **sí** | Nadie lo sella en vivo. AJF-1 §B lo verificó **leyendo** (siete guardas). `useCongelado.test.js` sella el núcleo, no las guardas de `GameTable`. FRZ-1 Fase 1 usó una sonda de CDP en su scratchpad. `grep visibilitychange\|document.hidden` en `scripts/diag*`: 0 |
| compuerta de `win.mp3` | **sí** | Ahora en `diagDSK.mjs` (modo `vc`, P1): `!r.sonando.includes('win.mp3')`. `win.mp3` salió del repo y del registro en CEL-A-b (`5e2c93f`), así que la compuerta ya no podía fallar |
| `all` | **sí** (es pregunta) | `all` corre d1d2, d3, bug, shots, lob, retar y apu: 7 de 35 modos (§11.1.4) |

## §11 · 3c-ii.1 · Las piezas de ARN-1

### 11.1.1 · El `encadenado` honesto

**El problema.** `useCoreografia.js:241` publica `marcaCEL('ancla', { encadenado: !!audio, espera })`. Es verdadero con que el toc-toc se haya **pedido**, suene o no. Lo que de verdad encadena la fiesta al `end` de Howler es `esperaPrecedente(audio) > 0`. Si da 0, `esperaRevienta` cae al reloj nominal (`TOC_NOMINAL_MS = 1896`) y la fiesta revienta por temporizador.

**El arreglo, sin tocar `src/` (D1).**
- **Cómo se deduce.** El arnés lo deduce de lo que ya se publica:
  - `espera` vale **exactamente** `TOC_NOMINAL_MS` cuando `esperaPrecedente` dio 0;
  - en otro caso vale `min(3000, duración + 250)`.
- **`encadenadoHonesto(ancla, nominal)`** en `scripts/arnes/varas.mjs`, con 3 pruebas.
- **El nominal se lee de su fuente.** `diagCEL0` lo saca de `src/hooks/coreografiaCore.js` como texto, porque el módulo importa sin extensión y no carga en Node. Si la constante cambia de forma, falla ruidoso.
- **Dueño del rojo.** Cuando no encadena, el fallo lo dice («espera 1896 ms = el reloj nominal: esperaPrecedente dio 0, el toc-toc no sonaba») y queda **conocido con dueño: ARN-3d (precargar `tableKnock`)**.
- **Se quitó una puerta repetida.** «Mandó el temporizador-red» ya no se evalúa cuando no hubo encadenado: sin `end` que esperar, solo repetiría el fallo con otras palabras. Era el «1905 ms de 1896» de H-5.

**Control.** En `ctl2`, `public/sounds/table-knock.mp3` se apartó: el toc-toc se pide (`audio` existe) pero no puede sonar. Con el `!!audio` de antes, esto habría salido **verde**:

```
FALLOS CONOCIDOS (10):
  - [ARN-3d (precargar tableKnock)] escritorio-1920x1080: la fiesta NO se encadenó al toc-toc (encadenado=true, espera 1896 ms = el reloj nominal: esperaPrecedente dio 0, el toc-toc no sonaba) [3/3: r1,r2,r3]
  - … las mismas en movil-360x640, movil-640x360, cuadros-360x640 y reducido-1280x800 …
  - [CEL-2c] … el saldo pide 2800 ms y el doble de CEL-2c son 2933 [3/3] (×5)
FALLOS NUEVOS (0): ninguno
── diagCEL0 celebracion · 10 fallos (10 conocidos con dueño · 0 NUEVOS) · control verde → código 1
```

La cifra de la vara con el archivo en su sitio está en §15.

### 11.1.2 · Modo `congelado` (nuevo, `diagDSK congelado`)

**Qué simula.** La visibilidad, que es lo único que escucha `useCongelado`:
- `document.hidden` y `visibilityState` se redefinen con `addInitScript` antes de que cargue la app;
- `visibilitychange` se dispara a mano.

No se simula el estrangulamiento de timers de una pestaña oculta de verdad; eso no es lo que vigilan estas guardas.

**Cada celda mide los dos lados de su guarda.** A oscuras no pasa nada. Al volver, pasa en un tiempo menor que la ventana medida, lo que prueba que a la vista sí habría pasado.

| Celda | Guarda | A oscuras | Al volver | Hoy |
|---|---|---|---|---|
| `turno` | reloj del humano (`if (congelado) return`) | crono 19 → 19 en 3 s (a la vista 20 → 19 en 1,6 s) | 19 → 17 en 2,2 s | **OK** |
| `audio` | `Howler.volume(0)` | 1 → 0 | 0 → 1 | **OK** |
| `ia` | cadena de decisiones de la IA | turno quieto en la IA 4 s, mensaje quieto | se mueve a los 1 008–1 012 ms | **OK** |
| `sigue` | «Siguiente mano» (`diferir(sigue)`) | 0 cartas de barajado en 3 s | barajado a los 14–15 ms | **OK** |
| `reparte` | fin del barajado (`diferir(reparte)`) | el barajado sigue a los 3 500 ms (dura 1 950) | reparte a los 21–22 ms | **OK** |
| `retirado` | salto del retirado (`diferir(salta)`) | — | — | **no alcanzable** (abajo) |

**`congelado`: VERDE, 5/5 guardas medidas, código 0.**

**La celda `retirado`.**
- **Primera corrida: rojo.** BET_2 abrió con el turno en `ia2`, no en el humano retirado.
- **Antes de llamarlo rojo del juego, se midió la premisa.** `gameEngine.js` es protegido y no se abrió. Una sonda a la vista (`scratchpad/arn3c/sondaRetirado.mjs`, con `MutationObserver` sobre las clases) hizo 3 repeticiones en mesa 3: el humano Mano se retira en «A las 2». Las tres dan la misma secuencia:
  ```
  humano «A las 2 — Tú abre.» → ia2 «Tú se retira.» → ia1 «IA 1 pasa.» → (reparto) → ia2 «A las 3 — Tú abre.» → …
  ```
  **El humano retirado no recibe el turno ni un instante al abrir BET_2.** El motor ya no lo pone en la Mano retirada, así que `salta` no se dispara por esta vía.
- **Conclusión:** el rojo era de la premisa de la celda, no del juego.
- **Cómo quedó la celda.** Comprueba esa premisa en cada corrida:
  - si BET_2 abre en otra silla, queda `noAlcanzable`: informativa, no cuenta y se dice por qué;
  - si algún día vuelve a abrir en la Mano retirada, mide la guarda.
- **Nota al margen.** El comentario de `salta` en `GameTable.jsx` describe un camino que hoy no se da. Es producto: se anota, no se toca.

**No sellada aquí:** la séptima guarda, el descarte con el humano retirado (`diferir(arranca)`). Solo se dispara si el retiro del humano **cierra** la ronda, y eso depende del reparto. Se declara en el JSON (`noSellada`), en la línea del modo y aquí.

**Control.** En `ctl2` se quitaron las dos guardas `if (congelado) return` (reloj e IA). Fue la primera corrida de la copia y corrió sola:

```
congelado·turno    FALLA · … {"turnoOculto":"humano","visible":[20,19],"oculto":[19,17],"alVolver":[17,15]}
congelado·ia       FALLA · … {"turnoAlOcultar":"ia4","turnoTras4s":null,"mensajeQuieto":false,"alVolverMs":null}
── diagDSK congelado · congelado rojo · aislamiento verde → código 1
```

Las otras tres guardas siguen en verde: la puerta acusa exactamente las dos que faltan.

### 11.1.3 · La compuerta de `win.mp3` (modo `vc`, P1)

**Qué se cambió.**
- Antes: `sonando.includes('chips-collect.mp3') && !sonando.includes('win.mp3')`.
- Ahora: `sonando.includes('chips-collect.mp3') && sonandoAjeno.length === 0`, con `VC_SONIDOS_CELEBRACION_MANO = ['chips-collect.mp3']`.

Durante la celebración de mano suena el roce **y nada más**. Una fanfarria que vuelva, con el nombre que sea, es rojo, y la línea del modo dice cuál (`AJENO=[…]`).

**Para medirla hubo que arreglar antes el bucle de `vc` (`vcHastaVictoria`).**
- **El síntoma.** Dos corridas seguidas de `vc` dieron `jugado` «sin victoria humana en el tope de manos», sin haber jugado el tope.
- **La causa.** Tras una mano perdida, el bucle pulsaba «Siguiente mano» **en el acto**. Desde REC-1 ese botón no se monta hasta que termina la revelación (+3,72 s), así que el bucle se rendía tras la primera mano perdida.
- **El arreglo.** Ahora espera el botón hasta 8 s. Es uno de los bucles hermanos que 3b-ii §7 dejó «para la campaña que los toque»; esta tanda tocaba `vc`.

**Control.** En `ctl2`, `CTL_AJENO` hace sonar `coin-bet.mp3` durante la celebración, que es lo que haría una fanfarria nueva:

```
vc·jugado m2 · FALLA manos=2 viva={"capa":true,"fichas":7,…} sonando=["coin-bet.mp3","chips-collect.mp3"] AJENO=["coin-bet.mp3"] Δ=0 (null) …
```

Con la compuerta vieja, este caso salía verde.

**`vc` sigue rojo en el repo**, por dos cosas que la compuerta nueva **no** crea: la vieja exigía lo mismo, pero el bucle nunca llegaba a ganar y nadie lo veía. Corrida con el bucle arreglado:

```
vc·jugado m2 · FALLA manos=1 viva={"capa":true,"fichas":7,"pulso":true,…} sonando=[] Δ=10.19 (.pbr-chips) toque=true · secuencia=true …
```

- **`Δ=10.19` en `.pbr-chips`.** Es la firma de H-14: la pila del humano cambia de cifra entre la toma «con capa» y la toma «sin capa», y el número crece hacia la izquierda. Es del instrumento.
- **`sonando=[]`.** El roce no suena todavía en el instante de leer. `chipsCollect` no está en la precarga del lobby (`useSounds.js:69`: «son de la celebración»), así que se carga en su primer `play`, y `playing()` puede ser falso al leer. En el control de arriba sí sonaba (`["coin-bet.mp3","chips-collect.mp3"]`). **Sin clasificar:** puede ser la lectura demasiado pronto (instrumento) o la misma familia que `tableKnock`, sonidos sin precargar (producto, ARN-3d). Ver H3c-ii-1.

### 11.1.4 · El modo `all`: propuesta (no aplicada, D13)

**Qué es hoy.** `all` corre 7 de los 35 modos de `diagDSK`: `d1d2`, `d3`, `bug` y `shots` (informativos), `lob`, `retar` y `apu`. Desde 3c-i levanta dos servidores (dev y preview) y compila. Tarda unos **43 min**, y **40 de ellos son `apu`**. No es «todo» ni es rápido.

| Opción | Qué hace | Costo (duraciones de la Fase 0) | Riesgo |
|---|---|---|---|
| **A · renombrar a `humo`** | `d1d2`, `d3`, `bug`, `shots`, `gate`, `lob` y `retar`: la pantalla de entrada, la ruta y la mesa recién servida | **~4 min**, más un build. Cambio de 15 min | Ninguno. Lo que hoy corre `all` sin `apu` |
| **B · corrida completa real, en un proceso** | Los 34 modos en serie | **~5 h**. No cabe en ningún tope de tanda. Además mezcla servidores (dev, 5174 sin bypass y preview) y lanzamientos del navegador (`r2` sin `--hide-scrollbars`) | Alto: un aborto a mitad tira horas |
| **C · un orquestador** (p. ej. `scripts/arnes/corrida.mjs`) | Cada modo como **proceso aparte**, con la regla de la casa: 6 carriles, `rec` y las varas de tiempo solas, **un build y el resto `--sin-build`** (H3c-6) | **~1 h 05 de pared** (34 modos en 6 carriles, ordenados del más largo al más corto, más `rec` solo), más las varas aparte. Escribirlo y probarlo: **~60–90 min** | Medio. Es código nuevo, pero puro en su planificación y probable en vitest |

**Recomendación: A ahora y C como pieza propia.** A devuelve a `all` un nombre que dice lo que hace. C es lo que de verdad hace falta para la foto de partida de cada campaña; hoy esa foto se monta a mano (§15).

## §12 · 3c-ii.2 · `vuelos.sobrante`, puerta permanente en `a2` (D8)

**Qué es.** La sonda de 3b-ii §1, ya puerta:
- Cuando una carta en vuelo dentro de la zona del humano baja de la fila de cartas, se ocultan las voladoras **un instante**: síncrono, dentro del mismo tick de rAF, sin que llegue a pintarse.
- Se describe con `elementFromPoint` qué hay en una rejilla de 5×3 sobre la franja que cuelga: texto, imagen, fondo propio, borde, sombra y contorno, con su visibilidad y su opacidad acumulada.
- **Lo juzga una función pura:** `juzgaSobrante` en `scripts/arnes/cajas.mjs`, con 4 pruebas nuevas.
- Hasta 8 casos por celda.
- **Sin caso en la celda no hay veredicto:** `null`. No es un hueco del azar que se reintente; es una mano sin reposición desde el Pie.

**Control.** En `ctl2`, `CTL_SOBRANTE` le pone fondo rojo a `.player-zone .cards-row` y `.player-bar`, que es justo lo que hay bajo la franja:

```
T5 1366x768 · … zona 0 sobrante PINTA div.cards-row < section.player-zone < section.game-table.table-wide.table-five | … · FAIL [...vuelosSobrante...]
── diagDSK a2 · a2 rojo · aislamiento verde → código 1
```

**`a2` completo en el repo: 20/20 verde, código 0.** `vuelos.sobrante` da **«tapete (8)» en las 20 celdas**: 8 casos medidos en cada una, el tope, y ningún punto que pinte. El caso se da en las cuatro mesas y los cinco tamaños. La puerta tiene cobertura real en juego natural, no es una guarda.

```
T5 1024x768 · … vuelo banda — (0f) zona 0 sobrante tapete (8) · máx 638.97 · IA Δ=0 · OK
…
T2 1440x850 · … vuelo banda — (0f) zona 0 sobrante tapete (8) · máx 674.67 · IA Δ=0 · OK
── diagDSK a2 · a2 verde · aislamiento verde → código 0
```

## §13 · 3c-ii.3 · `cicloVisibility` de `a2` (H3b-ii-2)

**Qué se cambió.** Cada muestra de `a2` lleva ahora `pago = A2_EN_PAGO`, y `enPago` pregunta por esa señal y no por el botón. El filtro `pago`, que alimenta otras puertas, **no** se tocó: el cambio se ciñe a `cicloVisibility`.

**Por qué no bastó `APU_PAGO_VISIBLE`.**
- **El primer intento.** Fue `APU_PAGO_VISIBLE` tal cual («Siguiente mano», recargar, burbuja o tarjeta).
- **Falló su propio control.** El «después» salió **rojo** igual que el «antes». Con la recarga pendiente, durante la revelación (+3,72 s) la banda ya se ve, «Siguiente mano» no se monta y la burbuja aún no se pinta: ninguna de las cuatro señales existe.
- **La señal buena.** Lo que marca el pago **entero** es el resultado: `.game-message[data-tono]` solo lleva valor cuando hay `resultado`, en PAYOUT y GAME_OVER (`GameTable.jsx:2029/2093`).
- **Cómo queda.** `A2_EN_PAGO` mira primero eso y después las cuatro de `APU_PAGO_VISIBLE`.

**Controles**, en `ctl2`, T5 1366×768. El molde `?apu=allinHumano` llega por el parche de la copia. `CTL_ALLIN` hace que el humano vaya All-in cuando la pila no llega, como en la sonda de 3b-ii: sin eso, el bucle común se retira y el caso no se da.

| Corrida | Resultado |
|---|---|
| **antes** (`CTL_VIEJO`: el predicado de 3b-ii) ×2 | **rojo `[cicloVisibility]`** las dos: banda en 17 fotogramas, 1 mano cerrada. H3b-ii-2 reproducido |
| **después** (`A2_EN_PAGO`), repetición 2 | **verde**, la celda entera OK, en el mismo escenario (banda en 17 fotogramas, 1 mano cerrada) |
| **después**, repetición 1 | `cicloVisibility` **verde**. La celda cae solo por `respiro`: el control, con All-in, dejó la recarga pendiente (`SINCERRAR: recarga-pendiente`) y no llegó a otra mano. Es artefacto del control |
| **una banda que de verdad no respeta el pago** (`CTL_BANDA`: visible siempre) | **rojo `[bandaLibre, cicloVisibility, guardiaApuesta]`** |

Sobre este último control: la ficha pide «una banda que no se ve en el pago». Una banda que **nunca** se ve deja `a2` en «sin cobertura», no en rojo, porque así lo quiere D4 de 3b. Lo que `cicloVisibility` juzga es que la banda se vea **solo** en el pago. El control que lo prueba es la banda visible fuera de él.

## §14 · Los demás puntos

### 14.1 · `rev` sin canónico (D11)

**Qué salió de `diagDSK.mjs`:**
- `REV_CAUSA_B`, `REV_FASE0`;
- la lectura de `capturas-rev/json/_comparacion.json` y `capturas-rev/lab/_canon__cont.png`;
- las columnas `canonAntes`, `canonDespues`, `causaB` y `archivoAntes`;
- el bloque y la línea «canónico» de 3c-i.

En su sitio queda un comentario que dice qué se retiró y por qué.

**Documentos vivos que citan la regla:** ninguno fuera de `docs/reportes/` (`grep REV_CAUSA_B|_canon__cont|_comparacion.json|franja del control` en `docs/` y `scripts/`).

**Corrida:**

```
── REV · VERDE · 10 celdas · p1_delta ✓ · p2_marco ✓ · p3_asset ✓ · p4_dibujo ✓ · p5_fuera ✓ · oclusión ✓ · …
── diagDSK rev · rev verde · aislamiento verde → código 0
```

p1–p5 y la oclusión salen iguales que en el STOP-1. Las 45 líneas `rev dibujo` llevan solo `lab↔real`, y no hay línea «canónico».

### 14.2 · El filtro de ruido (D12)

**Qué se cambió.** `RETAR_RUIDO_CONOCIDO` (que también es `APU_RUIDO_CONOCIDO`) queda en `[/boolean attribute/]`: el aviso `inert`, conocido con dueño (ARN-3d). Se corrigió el comentario que remitía a la cabecera de `diagSAL`; ahora remite al aislamiento de D6. El de `APU_RUIDO_CONOCIDO`, igual.

| Corrida | Resultado |
|---|---|
| `retar` | **verde**, código 0. `consola` 0 en las 6 celdas · `consolaConocida` 4 por celda (los `inert`) |
| `apu`, matriz completa (40 min, con otros arneses en paralelo y ninguna vara) | **REC-2 18/18 · mesa 6/7 · código 1.** **`consola: []` en las 7 celdas**: ni un `401` ni un `SAL-A`. El aislamiento contestó 89 peticiones a Supabase, con 0 escapadas. **El rojo no es de D12:** ver abajo |

**El rojo de `apu`: `apu.5` en 360×640.** El molde `?apu=capas` partió el pozo (`capas: 3`, `huboCapas: true`), pero al leer la frase el mensaje estaba **vacío** (`texto: ''`, `tono: ''`).

**Mecanismo probable, no medido:**
- `jugarHasta` vuelve en cuanto `data-capas > 1`, y la frase se lee en una evaluación **posterior**;
- `jugarHasta` pulsa «Siguiente mano», y la mesa vacía el mensaje (`setGame(… message: '' …)`) 300 ms antes de la mano nueva;
- en ese hueco, `data-capas` todavía vale 3.

**Repetición.** La celda se repitió dos veces, sola: `apu 360x640`.

| Repetición | `apu.5` | Celda |
|---|---|---|
| 1 | **OK** («¡Ganas con Copas, 30 pts!», tono `gana`) | **roja por otra puerta: `tel.blanda`** |
| 2 | **OK** («IA 3 gana con Oros, 30 pts.», tono `pierde`) | **verde**, código 0 |

Es el intermitente conocido de esa celda: Fase 0 §A2, «2 rojos en 3 corridas, cada vez por puertas distintas». **No es D12:** en las tres corridas, consola 0. Queda en vigilancia con su dueño (§19).

**Control (D12).** En `ctl2`, `CTL_401` escribe `console.error('Failed to load resource: the server responded with a status of 401 ()')` en `retar`, justo después de abrir «Retar a las IAS». Con el filtro viejo, esto habría quedado escondido como ruido conocido:

```
  FALLA 1024x768 (desktop) · consola: error: Failed to load resource: the server responded with a status of 401 ()
  FALLA 1366x768 (desktop) · …
  FALLA 1920x937 (desktop) · …
── diagDSK retar · retar rojo · aislamiento verde → código 1
```

### 14.3 · `scripts/screenshots/` (D14)

- `git ls-files scripts/screenshots | wc -l` da **31**.
- `git check-ignore -v --no-index scripts/screenshots/c43-float.png` da `.gitignore:54:scripts/screenshots/`: la ruta está ignorada.
- **Quién los lee:** fuera de los 20 archivos retirados, **nadie** en `scripts/` ni en `package.json`. En `docs/` solo los nombran `AJILEI_Tapetes_v1.1.md:110` y `v1.2.md:97` («`scripts/screenshots/` entra en `.gitignore`»), que es historia.
- **La orden**, en el commit de arnés (no toca el disco):

```
git rm -r --cached scripts/screenshots
```

### 14.4 · `_vc2audio.mjs` (D15): **sonda de un solo uso, entra en `git rm`**

- `grep -rn _vc2audio scripts package.json docs`, sin contar el propio archivo, solo da:
  - `diagCEL0.mjs:63`, un comentario que cita su **método** («El análisis es el de `_vc2audio.mjs`…»);
  - el informe de la Fase 0 de ARN-3 y el de 3c-i.
- Nada lo invoca.
- Su historia: `df5270f` (ESC-1) y `5e2c93f` (CEL-A-b).

Se añade a la orden de §1.1 (ver §17).

### 14.5 · Fin de línea (D16)

Ver §23: los 16 archivos tocados están en `w/lf`.

## §15 · 3c-ii.4 · Las varas de tiempo (D9)

**Qué cambió.**
- **`diagCEL0 celebracion`.** Las 6 celdas del arco de CEL-2 (escritorio, 360×640, 640×360, cuadros, mudo y reducido), que son las que miden con reloj de pared, se miden **3 veces**. Un fallo cuenta si sale en al menos 2 (`mayoriaDeFallos`). Las demás puertas del modo son geometría y se miden una vez.
- **`diagPUE dis`.** El bloque entero se mide 3 veces, y cada puerta vale lo que su mayoría (`mayoriaDePuertas`). El detalle de cada puerta lleva las tres cifras (`r1 ‖ r2 ‖ r3`).
- **Por qué mayoría y no mediana.** En una puerta de umbral, «la mediana de 3 cumple» es **exactamente** «al menos 2 de 3 cumplen». Lo sella una prueba. Ningún umbral se aflojó.
- **Conocidos con dueño.** `CEL_CONOCIDOS` separa en la salida los conocidos (con su dueño) de los NUEVOS. El código de salida no cambia: un conocido sigue siendo 1.
- **Lo que no cuenta, a la vista.** Los fallos que salen en una sola repetición se listan aparte («no cuentan»).

**5 corridas de cada una, solas e intercaladas** (`cel` y `dis` 1 a 5, 07:49–08:36). Ningún otro arnés vivo. La vara de `dis` corrió con `--sin-build` sobre el único build de la tanda.

| Corrida | `celebracion` | `dis` |
|---|---|---|
| 1 | 5 fallos: **5 conocidos (CEL-2c) · 0 nuevos** · código 1 · 463 s | **68 mediciones, 0 en rojo** · código 0 · 70 s |
| 2 | 5 conocidos · 0 nuevos · código 1 · 467 s. **1 suelto que no cuenta:** «escritorio-1920x1080: el premio duró 4018 y pedía 2800» [1/3] | 68 · 0 en rojo · código 0 |
| 3 | 5 conocidos · 0 nuevos · código 1 · 468 s | 68 · 0 en rojo · código 0 |
| 4 | 5 conocidos · 0 nuevos · código 1 · 469 s | 68 · 0 en rojo · código 0 |
| 5 | 5 conocidos · 0 nuevos · código 1 · 467 s | 68 · 0 en rojo · código 0 |

**Estable en las dos:** el mismo veredicto las 5 veces, y solo salen los rojos conocidos.

- **`celebracion`: los 5 conocidos son exactamente el saldo de CEL-2c.** «el saldo pide 2800 ms y el doble de CEL-2c son 2933», 3/3 en las cinco celdas del arco con relato: escritorio, 360×640, 640×360, cuadros y mudo.
- **La mediana trabajó una vez.** «el premio duró 4018 y pedía 2800» en una de tres repeticiones de la corrida 2 es de la familia de H-5, los rojos sueltos y distintos en cada corrida. La mediana lo descarta y la salida lo enseña aparte.
- **`dis`: las 68 puertas salen 3/3 verdes en las 5 corridas.** La mediana no tuvo que decidir nunca. El relevo del S25 es la puerta con menos margen: el teléfono vuelve a 0 entre 2 393 y 2 436 ms, contra un tope de 2 500. La Fase 0 vio rojos de 5 a 100 ms sobre ese tope con varios arneses en paralelo; corriendo sola, la vara deja un margen de 64 a 107 ms.
- **El `encadenado` honesto sale VERDE en las 5 de `celebracion`, en todas las celdas.** La ficha esperaba un rojo hasta que la 3d precargue `tableKnock`, y **no sale**: con el archivo servido, el toc-toc estaba sonando al llegar a GAME_OVER y la fiesta se encadenó a su `end`. La puerta sigue sabiendo fallar: su control (§11.1.1) la pone roja en las 5 celdas en cuanto el toc-toc no suena. **Queda lista para validar la 3d**, y el conocido con dueño ARN-3d se mantiene en `CEL_CONOCIDOS` por si vuelve. Ver la pregunta 4.

**Un tropiezo de instrumento durante las varas, registrado:**
- **Qué pasó.** La primera `dis` salió con **código 2**: `ReferenceError: navWebkit is not defined`. El bucle de la mediana de 3 metió `navWebkit` dentro de su bloque, y la función `contexto()`, definida fuera, lo usaba.
- **Arreglo.** `let navWebkit` fuera del bucle.
- **Por qué no se perdió la soledad de las varas.** Al parar el corredor, `TaskStop` no cerró su `bash` hijo: es B8, que sigue vivo para los scripts de shell. Un `celebracion` viejo y una `dis` arrancaron **a la vez** que la reanudación. Se cerró todo por árbol (`taskkill /T /F`) y **la serie se relanzó entera desde `dis1`**, en una carpeta y unos puertos nuevos. Las cifras de la tabla son las de esa serie limpia, más `cel1`, que corrió sola de 07:49 a 07:57 antes del tropiezo.

## §16 · 3c-ii.5 · La cacería de E-22 (D17)

**6 corridas de las 12 previstas** (08:36–08:57): una tanda de 6, todas `msg --semilla=azar --sin-build` sobre el único build de la tanda.

**La segunda tanda no se corrió.** Tarda unos 20 min y habría acabado pasado el tope de 150 min (09:16), antes de cerrar el STOP. La ficha dice «hasta 12».

**E-22 no apareció en ninguna de las 6.** Ni en mesa 5 a 1366×768 ni en otra celda. No hay rojo que clasificar.

| # | Base | Resultado | T5 1366×768 (las manos de P2) |
|---|---|---|---|
| 1 | 257096588 | **VERDE**: jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK (9 cajas) | «IA 1 gana con Espadas, 32 pts.» · «IA 2 gana con Oros, 41 pts.» · «IA 3 gana con Copas, 34 pts.» |
| 2 | 280902192 | **VERDE** (barrido 10 cajas) | «IA 1 gana con Copas, 40 pts.» · «IA 3 gana con Oros, 41 pts.» |
| 3 | 52792308 | **VERDE** (barrido 12 cajas) | «IA 1 gana con Espadas, 30 pts.» · «IA 2 gana con Copas, 41 pts.» · «Empate, 31 pts. Gana IA 2 por ser la Mano.» |
| 4 | 621437613 | **VERDE** (barrido 9 cajas) | «IA 1 gana con Copas, 37 pts.» · «Empate, 38 pts. Gana IA 3 por ser el más cercano a la Mano.» · «IA 4 gana con Espadas, 33 pts.» |
| 5 | 293213138 | **VERDE** (barrido 12 cajas) | «Empate, 31 pts. Gana IA 2 por ser el más cercano a la Mano.» · «IA 3 gana con Oros, 40 pts.» · «IA 3 gana con Bastos, 32 pts.» |
| 6 | 46787976 | **VERDE** (barrido 11 cajas) | «IA 1 gana con Bastos, 41 pts.» · «IA 4 gana con Oros, 31 pts.» · «IA 3 gana con Copas, 51 pts.» |

**Cobertura.** Suman 6 × 7 celdas de P2 (hasta 3 manos cada una) **más** las 2 corridas de la vara y la exploración de 3c-i: en total, **9 corridas de `msg` en verde y ninguna E-22**.

- **Lo que no se puede afirmar.** E-22 era «1 de cada 4 en mesa 5 a 1366×768» **con el arnés de antes**: 5173, con el Supabase real y sin siembra. Si se mantuviera esa frecuencia, la probabilidad de no verlo en 9 corridas sería de 0,75⁹ ≈ 7,5 %.
- **Lo que sí se puede decir.** Ese 7,5 % no basta para declararlo resuelto. Desde 3c-i, `msg` mide el bundle real con la sesión simulada y sin red, y E-22 **no se ha visto ni una vez** en ese terreno.
- **Cómo repetirlo.** Para la próxima cacería, las bases de la tabla reproducen cada corrida con `--semilla=N`.

---

## §17 · La foto de partida actualizada (los 43 modos, más `congelado`)

«Último estado» es el de la corrida más reciente, con la tanda donde se midió. Los rojos conocidos van con su dueño.

| Modo | Último estado | Rojo conocido · dueño | Dónde |
|---|---|---|---|
| `build` | **verde** | — | 3c-ii §18 |
| `vitest` | **1 175/1 175** con volcados · **1 174 + 1 saltada en voz alta = 1 175** sin volcados ni verificadores | — | 3c-ii §18 |
| `eslint` | **21** | los tres archivos de `src/` de siempre | 3c-ii §18 |
| `banco:verificar` | verde | — | Fase 0 (no se tocó) |
| `diagPUE todo` | **1 rojo: `1.8b`** (222,0 KiB) | `1.8b` · **ARN-3d** | 3c-i §6.2 |
| `diagPUE dis` (vara) | **estable, 5/5**: 68 mediciones, 0 en rojo, código 0 (las 68 puertas, 3/3) | — | 3c-ii §15 |
| `diagPUE cap` | **31/31** | — | 3c-i §6.2 |
| `diagPUE voz2` | **222/222** | — | 3c-i §6.2 |
| `diagSAL sal` | **verde** | — | 3c-i §6.2 |
| `diagCEL0 diagnostico` | verde | — | 3b-ii §5.2 |
| `diagCEL0 celebracion` (vara) | **estable, 5/5**: los 5 conocidos de CEL-2c, 0 nuevos, código 1. El `encadenado` honesto en verde | saldo 2 800/2 933 ×5 · **CEL-2c** | 3c-ii §15 |
| `lob` | **6/6** en 4173 | — | 3c-i §6.2 |
| `retar` | **verde**, filtro sin `401` | — | 3c-ii §14.2 |
| `gate` | verde | — | Fase 0. Corrió en `ctl2` como sujeto del control de D6, y la puerta propia salió verde |
| `p1` · `p2` · `tactil` | verde | — | Fase 0 |
| `r1` · `r2` | verde | — | Fase 0 |
| `o1` | **16/16** | — | 3b P10 |
| `o2` | verde | — | Fase 0 |
| `a1` | **16/16** | — | 3b P2 · 3b-ii §4 |
| `a2` | **20/20**, con `vuelos.sobrante` y `cicloVisibility` por señal | — | 3c-ii §12 |
| `m1` | **20/20** | — | 3b P1 |
| `h1` | **16/16** | — | 3b P4 |
| `f1` | **16/16** | — | 3b |
| `z1` | **16/16** | — | 3b P7 |
| `u1` | **20/20**, `hits 0/8` | `hits 0/8` · quien abra `UtilitiesMenu` (APU-1 C-1) | 3b |
| `menu-movil` · `u2` · `u3` | verde | — | Fase 0 |
| `vc` | **rojo**: `jugado` (Δ 10,19 en `.pbr-chips`; el roce sin sonar al leer). Guardias 2/2 en una corrida, 1/2 en otra | ver H3c-ii-1 · **sin dueño asignado: pregunta 2** | 3c-ii §11.1.3 |
| `msg` | **verde** con la vara 1–15 | — | 3c-i §4 · E-22 en §16 |
| `tapetes` | **verde** | — | 3b P5 |
| `vuelo` | **2/2** | — | 3b P6 |
| `luz` | verde | — | Fase 0 |
| `rev` | **verde 10/10**, sin canónico | — | 3c-ii §14.1 |
| `rec` | **verde** (solo, 1 002 s) | — | 3b-ii (después del cierre del informe) |
| `apu` | **REC-2 18/18 · mesa 6/7**; 360×640 a solas: 1 roja (`tel.blanda`), 1 verde | 360×640 intermitente, «cada vez por puertas distintas» · **en vigilancia** (H3c-ii-3) | 3c-ii §14.2 |
| `d1d2` · `d3` · `bug` · `shots` · `b1` | informativos | — | — |
| **`congelado`** (nuevo) | **verde**, 5/5 guardas medidas | `salta`: no alcanzable · `arranca`: no sellada | 3c-ii §11.1.2 |

## §18 · Varas finales

| Vara | Resultado |
|---|---|
| `vite build` | limpio. **El único build de la tanda** (07:37, D13), con ningún arnés sirviendo `dist/` |
| `vitest`, repo con volcados | **1 175/1 175**, 44 archivos. Nuevas en 3c-ii: 10 en `varas.test.js` y 4 en `cajas.test.js` |
| `vitest`, copia **sin** volcados ni verificadores (`limpia3`: sin los 21 `git rm`, sin `scripts/screenshots/`) | **1 174 + 1 saltada en voz alta = 1 175** |
| `eslint` | **21** (20 errores + 1 aviso), los tres archivos de `src/` de siempre |

## §19 · Mapa archivo → commit definitivo (toda la 3c)

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3c-1: núcleo — aislamiento de la red, juicio de cajas y del sobrante, varas por mediana de 3` | `scripts/arnes/nucleo.mjs` · `scripts/arnes/nucleo.test.js` · `scripts/arnes/comun.mjs` · `scripts/arnes/cajas.mjs` · `scripts/arnes/cajas.test.js` · `scripts/arnes/varas.mjs` · `scripts/arnes/varas.test.js` |
| 2 | `ARN-3c-2: arnés — lob y msg al bundle real, barrido Heptacoins, congelado, sobrante, ciclo por señal, encadenado honesto; retiradas` | `scripts/diagDSK.mjs` · `scripts/diagPUE.mjs` · `scripts/diagSAL.mjs` · `scripts/diagCEL0.mjs` · `scripts/cap/capMesa.mjs` · `scripts/rutaMesa.mjs` · **y las dos órdenes de abajo** |
| 3 | `ARN-3c-3: índice de los volcados de B7` | `scripts/apu1_bandas_origen.json` · `scripts/testBancoBandas.test.js` |
| 4 | `ARN-3c-4: informe de ARN-3c` | `docs/reportes/AJILEI_ARN-3c_Informe_v1.0.md` |

**Órdenes para Victor, dentro del commit 2.** La primera es la de §1.1 más `_vc2audio.mjs` (D15). La segunda no toca el disco (D14).

```
git rm scripts/verifyC43.mjs scripts/verifyC431.mjs scripts/verifyC44.mjs scripts/verifyC441.mjs scripts/verifyC441b.mjs scripts/verifyC45.mjs scripts/verifyC45a.mjs scripts/verifyC45b.mjs scripts/verifyC45c.mjs scripts/verifyEMB1.mjs scripts/verifyGameOver.mjs scripts/verifyIDN1.mjs scripts/verifyMesa5.mjs scripts/verifyREN1.mjs scripts/verifyShrink.mjs scripts/verifyViewport.mjs scripts/shotFloat.mjs scripts/shotStatus.mjs scripts/measurePanel.mjs scripts/_sh1probe.mjs scripts/_vc2audio.mjs
git rm -r --cached scripts/screenshots
```

**A mano**, fuera de git: `scripts/_cel1bFila.mjs`.

## §20 · Aplazados, con dueño

| Aplazado | Dueño | Por qué |
|---|---|---|
| Precargar `tableKnock` | **ARN-3d** | Producto. El `encadenado` honesto salió **verde** en las 5 varas (§15); su control demuestra que se pone rojo si el toc-toc no suena. Es la puerta que validará la 3d |
| `1.8b` (222,0 KiB) | **ARN-3d** | Producto (B11) |
| El saldo 2 800 frente a 2 933 ms (×5) | **CEL-2c** | Sin cambio |
| `u1` `hits 0/8` | quien abra `UtilitiesMenu` | Sin cambio (APU-1 C-1) |
| `vc` `jugado`: Δ de `.pbr-chips` y el roce sin sonar al leer | **pregunta 2** | Lo primero es del instrumento (familia H-14). Lo segundo está sin clasificar (H3c-ii-1) |
| `apu` 360×640 intermitente (`apu.5` en carrera de lectura, `tel.blanda`) | **en vigilancia** | Intermitente conocido. El arreglo de `apu.5` es leer la frase en la misma evaluación que `data-capas` |
| La guarda `arranca` (descarte con el humano retirado) sin sellar | **la campaña que siembre repartos** | Exige que el retiro del humano cierre la ronda |
| El comentario de `salta` en `GameTable.jsx` describe un camino que hoy no se da | **ARN-3d o quien abra `GameTable`** | Producto: no se toca aquí |
| El modo `all` | **pregunta 1** | Propuesta en §11.1.4 |
| Los demás bucles hermanos de 3b-ii §7 | la campaña que los toque | `vcHastaVictoria` ya se tocó aquí (§11.1.3) |
| Generadores de assets con Edge | la próxima campaña de assets | Sin cambio (B2) |
| El molde `allinHumano` descuenta la entrada | **ECO-1** | Sin cambio |
| Diálogo de compra de tapetes sin clave en `textos` | **IDI-1** | Sin cambio |
| E-22: 6 de 12 corridas, por el tope | **la próxima tanda del arnés** | §16: no apareció en 6 (ni en 9 contando la vara); faltan 6 para cerrar las 12 de D17 |

## §21 · Hallazgos nuevos de 3c-ii (se reportan, no se arreglan)

| ID | Hallazgo |
|---|---|
| **H3c-ii-1** | **El roce de `vc` puede no estar sonando cuando se lee.** `chipsCollect` no se precarga («son de la celebración», `useSounds.js:69`). La primera celebración de la página lo carga en su `play`, y `playing()` puede ser falso. Es la misma familia que `tableKnock`. Sin clasificar entre lectura temprana (instrumento) y falta de precarga (producto) |
| **H3c-ii-2** | **La Fase 0 de ARN-1 no está en el repo**, aunque la ficha madre la situaba en `docs/reportes/`. D10 se resolvió contra el código vivo |
| **H3c-ii-3** | **`apu` 360×640 sigue cayendo por puertas distintas**: `apu.5` en la matriz, `tel.blanda` en una repetición, verde en otra. Ninguna por consola |
| **H3c-ii-4** | **Con 6 arneses a la vez, una copia que ya estaba caliente se cayó por arranque en frío** (el lobby tardó más de 30 s: `CTL_BANDA`, primer intento). Es H3b-ii-4 también fuera de la primera corrida. Repetido, salió |
| **H3c-ii-5** | **El motor ya no pone el turno en la Mano retirada al abrir BET_2** (§11.1.2): medido a la vista, 3 de 3. El efecto `salta` de `GameTable` queda sin el camino que su comentario describe |

## §22 · Preguntas al rector

1. **`all`:** ¿A (renombrar a `humo`, 15 min de trabajo), C (orquestador, 60–90 min, como pieza propia), o las dos?
2. **`vc`:** ¿a quién va su `jugado` en rojo? El Δ de `.pbr-chips` es del instrumento. El roce sin sonar al leer puede ir con la precarga de `tableKnock` en ARN-3d.
3. **`congelado`:** ¿se acepta `retirado` como «no alcanzable» y `arranca` como «no sellada», o se quiere un molde que fuerce el reparto para sellarlas?
4. **El `encadenado` honesto salió verde, no rojo** (§15). ¿Se mantiene `tableKnock` en ARN-3d como precarga preventiva, con esta puerta como su vara, o se retira el pendiente? La puerta seguiría en pie igual.

## §23 · STOP-2

**Por qué paró.** Por el STOP-2 de la ficha. No hubo rojo del juego, así que no hubo STOP por D1. Queda a medias la cacería de E-22: 6 de 12, por el tope (§16).

**Fin de línea (D16).** `git ls-files --eol` de todo lo tocado:

```
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/comun.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/nucleo.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/nucleo.test.js
i/lf    w/lf    attr/text=auto eol=lf 	scripts/cap/capMesa.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagCEL0.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagDSK.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagPUE.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagSAL.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/rutaMesa.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/testBancoBandas.test.js
i/      w/lf    attr/text=auto eol=lf 	docs/reportes/AJILEI_ARN-3c_Informe_v1.0.md
i/      w/lf    attr/text=auto eol=lf 	scripts/apu1_bandas_origen.json
i/      w/lf    attr/text=auto eol=lf 	scripts/arnes/cajas.mjs
i/      w/lf    attr/text=auto eol=lf 	scripts/arnes/cajas.test.js
i/      w/lf    attr/text=auto eol=lf 	scripts/arnes/varas.mjs
i/      w/lf    attr/text=auto eol=lf 	scripts/arnes/varas.test.js
```

Los 16 están en `w/lf`.

**Servidores y procesos.**
- A las 08:58 no queda ningún `node` vivo.
- Durante la tanda, `TaskStop` volvió a dejar vivo el `bash` hijo de un corredor de shell (§15). Se cerró por árbol y se comprobó con `Get-CimInstance`.
- `netstat` en 4170–4999 y 5000–5599:

```
  TCP    0.0.0.0:5040           0.0.0.0:0              LISTENING       7724
```

Es el `svchost.exe` de Windows de siempre, ajeno. En los puertos que usó la tanda no escucha nada: 4501, 4511, 4601–4606, 5301–5309, 5311–5312, 5391, 5401–5406, 5411–5415, 5421–5425, 5501 y 5511.

**Copias.**
- `scratchpad/arn3c/ctl2` lleva los controles, su parche (`parche_ctl2.py`) y las dos guardas quitadas.
- `scratchpad/arn3c/limpia3` es el árbol final sin volcados, sin verificadores y sin `scripts/screenshots/`.

Las uniones a `node_modules` se quitaron con `rmdir`, y el del repo sigue intacto. Los logs están en `scratchpad/arn3c/logs2/`, `varas/`, `varas3/` y `e22/`, junto con las sondas `sondaRetirado.mjs` y `sondaPw.mjs`.

**`git status --porcelain`:**

```
 M scripts/arnes/comun.mjs
 M scripts/arnes/nucleo.mjs
 M scripts/arnes/nucleo.test.js
 M scripts/cap/capMesa.mjs
 M scripts/diagCEL0.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M scripts/diagSAL.mjs
 M scripts/rutaMesa.mjs
 M scripts/testBancoBandas.test.js
?? docs/reportes/AJILEI_ARN-3c_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/apu1_bandas_origen.json
?? scripts/arnes/cajas.mjs
?? scripts/arnes/cajas.test.js
?? scripts/arnes/varas.mjs
?? scripts/arnes/varas.test.js
```

Lo que hay es el árbol de toda la 3c y los seis residuos. Contra el STOP-1 hay tres cambios: `diagCEL0.mjs` modificado, y `varas.mjs` y `varas.test.js` nuevos. `src/` está intacto. **Sin `git add`.**

## §24 · Decisiones del rector (revisión del STOP-2)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | `all` | **A** (renombrar a `humo`) en **ARN-3e**. **C** (orquestador) queda aplazado como pieza propia y se decide al cerrar ARN-3 |
| 2 | `vc` | Va a **ARN-3d**: una sonda clasifica el roce sin sonar (lectura temprana o falta de precarga de `chipsCollect`, la familia de `tableKnock`), y la parte de arnés de 3d arregla la lectura del Δ de `.pbr-chips` (H-14) |
| 3 | `congelado` | **Aceptado.** `retirado` queda como «no alcanzable» y `arranca` como «no sellada». No se construye un molde de reparto: obligaría a tocar `src/dev`. Ambas entran al registro de invariantes de **ARN-3e** con su límite declarado |
| 4 | `tableKnock` | **Se mantiene en ARN-3d.** La vara sirve el audio en local, al instante, y no representa la primera carga en un teléfono con red real. La vara de 3d es el `encadenado` honesto **con la red estrangulada**: rojo antes de la precarga, verde después y verde con la red normal. La 3d reporta además los valores de `espera` en verde, para medir el margen contra el nominal (1 896 ms) |
| — | E-22 | Las 6 corridas pendientes de D17 pasan a **ARN-3e** |
| — | `apu.5` (H3c-ii-3) | En **ARN-3e**: leer la frase en la misma evaluación que `data-capas` |
