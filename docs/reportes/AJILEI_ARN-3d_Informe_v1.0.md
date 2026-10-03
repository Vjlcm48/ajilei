# AJILEI · ARN-3d · Producto: la mesa ligera y los sonidos a tiempo · Informe v1.0

**Ficha:** `AJILEI_ARN-3d_v1.0.md` (Fase 1). **Base técnica:** `AJILEI_ARN-3d_Fase0_Informe_v1.0.md`, citada por sección (§B4, §C5…); sus medidas no se repiten.
**Punto de partida:** `main` en `5cc97e7`, con los 5 residuos conocidos y el informe de la Fase 0 sin commitear.
**Navegador:** Chromium 151.0.7922.34 de `playwright-core` 1.62.1 (`navegadorArnes`).

---

# Parte 3d-i · Instrumento

**Fecha:** 2026-10-02, de 10:14 a 11:16 (tope 90 min).
**`src/` no se tocó.** Sin commits y sin `git add`.
**Dónde se midió:**
- el repo, para `main` de hoy (un solo build: el de `diagPUE mesa`; el resto, en servidores de desarrollo);
- cinco copias `git archive HEAD` en el scratchpad, cada una con su `.env.local`, una unión a `node_modules` y los `scripts/` de esta tanda:
  - `lazyP3`, `lazyP2` y `lazyP`: las variantes de la Fase 0, regeneradas con sus mismos scripts (`v3.cjs`, `v2.cjs`, `variantes.cjs`);
  - `lazyP3r`: `lazyP3` **sin** la precarga del lobby (ver §1.1);
  - `vcd`: `HEAD` con una regla CSS de control para `vc` (§1.3).
- Puertos propios: 4183, 4191, 4192 y 4195 (preview) y 5185 y 5186 (dev con bypass). El 4173 y el 5173 no se tocaron.

## Resumen

| Pieza | Vara | Control | Estado |
|---|---|---|---|
| §1.1 `esperarMesa` | `msg` y `cap` verdes con el chunk retenido 2 s, en `lazyP3` y en `lazyP3r` | Sin la espera: **`msg` rojo; `cap` sigue verde** (hallazgo H3d-i-1) | Hecho. El control solo «sabe fallar» en `msg` |
| §1.2 `diagPUE mesa` | `main`: 3 puertas verdes, «sin chunk». `lazyP3`: 3 puertas verdes | `lazyP2`: `mesa.a` **rojo**, 321–326 ms en blanco. `lazyP`: `mesa.portada` **rojo** | Hecho |
| §1.3 `vc`, el Δ | `p2` con Δ = 0, `.pbr-chips` igualado (950 → 1100) | Barra desplazada 1 px con la capa viva → `p2` **rojo** (Δ = 1, `.player-bar`), también en `jugado` | Hecho |
| §1.3 `vc`, el roce | **`jugado` verde por primera vez desde ARN-3c**, en 2 de 2 corridas. Roce sonando a los 2–6 ms de ver la capa. Primer `play` en `loading`, informado como conocido de ARN-3d-ii | — (la puerta `loaded` está apagada hasta 3d-ii) | Hecho. **`vc` sigue rojo por otra cosa:** el azar de «sin victoria humana en el tope de manos» (H3d-i-2) |
| §1.4 `encadenado` | 2 pruebas nuevas en `varas.test.js` (las dos ramas) | — | Hecho. Hoy lee «deducido» (no hay marca hasta 3d-ii) |
| §1.5 cabecera de `diagCEL0` | — | — | Hecho |

---

## §1.1 · `esperarMesa(page)`

**Qué se hizo:**
- `scripts/rutaMesa.mjs`: nueva `esperarMesa(page, { timeout = 30000 })`, exportada. Espera a `.game-table` visible y a que no haya `.cargando` (el `fallback` de BIE-1, si algún día se pintara). Sin `sleep`.
- La llaman:
  - `recorrerRuta`, en lugar de su `waitForSelector('.game-table')`;
  - `u1` (`diagDSK.mjs`, segunda entrada tras la recarga), en lugar de su `waitForSelector` repetido;
  - `controlNegativo` (`diagCEL0.mjs`), antes de «Iniciar mano». **Su `waitForTimeout(3500)` se queda:** no espera a la mesa, sino a la mano (ante, barajado y reparto). Lo dice el comentario.
- En `diagDSK` ya existía una función local `esperarMesa(page, cond, limite)` (una espera genérica de condición, con ~10 usos). Para no tocarla, la común se importa como `esperarMesaComun`.

**Un matiz de la vara.** `msg` y `cap` entran al lobby con `networkidle`. En `lazyP3` la precarga del lobby pide el chunk antes, así que `networkidle` **se traga** los 2 s del retraso antes del toque: la espera solo tarda 50–74 ms. Para que el retraso caiga **después** del toque, se hizo la copia `lazyP3r`, que es `lazyP3` sin el `useEffect` de precarga del `Lobby`. Retar sigue pidiendo el chunk (el efecto de `App`) ~150 ms antes del toque. Se corrió la vara en las dos.

**Cómo se retrasó.** Solo en las copias, dentro de `contextoCap` (que usan `msg` y `cap`): `GameTable-*` se retiene 2 000 ms antes de `route.continue()`. Además, el `rutaMesa` de la copia anota cuánto esperó `esperarMesa` desde el toque.

| Copia | Modo | Retención anotada | `esperarMesa` esperó | Veredicto |
|---|---|---|---|---|
| `lazyP3` | `cap` | 2 000–2 013 ms | 53–60 ms (6 pasadas) | **31/31 verde**, código 0 |
| `lazyP3` | `msg` | 2 000–2 008 ms | 50–74 ms (22 entradas) | **verde** («jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK»), código 0 |
| `lazyP3r` | `cap` | 2 001–2 013 ms | **2 364–2 388 ms** | **31/31 verde**, código 0 |
| `lazyP3r` | `msg` | 2 000–2 008 ms | **2 330–2 412 ms** (22 entradas) | **verde**, mismos números, código 0 |

En las dos copias diferidas, `cap.regresion` compara contra las maestras selladas de `maestras/portada/`: **0 píxeles distintos** en las 3 vistas. Los 2 s de espera no cambian la foto.

**Control (`lazyP3r`, `SIN_ESPERA=1`: `recorrerRuta` vuelve en cuanto acaba el clic):**

| Modo | Resultado |
|---|---|
| `msg` | **Rojo.** Todas las celdas de `jugado` corridas salen `FALLA ruta=—` (T5, T4, T3, T2…) y la caza «falso 51» da «la mano no llegó a resultado». La primera corrida la cortó el tope de 30 min de la tarea en segundo plano. La segunda, filtrada a mesa 5, la corté yo a las 11:04 para dejar sitio a las varas de tiempo. **Ninguna de las dos llegó a escribir el código de salida.** El rojo se ve en cada celda. |
| `cap` | **Sigue verde (31/31, código 0).** Ver H3d-i-1. |

**Hallazgo H3d-i-1 · `cap` no depende de `esperarMesa`.** Tras la ruta, `pasadaCap` (`cap/capMesa.mjs`) hace `page.locator('button:has-text("Iniciar mano")').first().click()`. Un `click` por `locator` de Playwright **espera solo** (hasta 30 s) a que el botón exista y sea accionable, y ese botón vive dentro de la mesa. Por eso `cap` aguanta la mesa diferida con o sin la espera común: su lectura nunca va antes de la mesa. **No es un fallo de `cap`, pero la ficha esperaba que su control saliera rojo y no sale.** El control que «sabe fallar» de §1.1 es el de `msg`. No se tocó `cap`.

## §1.2 · Modo `diagPUE mesa`

**Qué es:** sale de `_sondaEntrada` (Fase 0 §B4). Se corre con `node scripts/diagPUE.mjs mesa`. **No entra en `todo`**: es una vara de tiempo y corre sola (se dice en la cabecera del arnés).
- **Red:** «4G lento» por CDP (`Network.emulateNetworkConditions`: latencia 562,5 ms, bajada 180 000 B/s, subida 84 375 B/s), anotado en la cabecera del bloque y en la línea del modo.
- **Sesión simulada:** `contextoCap`, a 1366×768, con un contexto nuevo por repetición. Mesa 5, básico, apuesta 0.
- **Sonda en la página, desde antes del HTML** (un `MutationObserver`):
  - del `pointerdown` en `main.sal [data-accion="cta"]` a dos rAF después de que entra `.game-table`;
  - los intervalos de `#root` **vacío**;
  - los intervalos de **hueco**: ni Retar (`main.sal`) ni la mesa. Es lo que el jugador vería como «pantalla vacía» aunque la raíz tuviera un `fallback` dentro.
- **Escenarios:** A = `networkidle` y 500 ms (precarga terminada); B = entrada inmediata. Además, la Portada con un contexto anónimo: FCP frente a peticiones de `GameTable-*`, con 3 s más de Portada.
- **3 repeticiones por escenario**, y el veredicto por mayoría (`mayoriaDePuertas`, D9).

**«Sin chunk» se dice por la razón correcta.** El chunk de la mesa es `GameTable-*.js|css`. Si en toda la corrida no se pide ninguno y la mesa se pinta, cada puerta lo dice con la lista de scripts cargados.

**Varas (cada una corrida sola, sin otro arnés vivo):**

| Árbol | `mesa.a` (toque → pintada, blanco) | `mesa.b` (blanco, tiempo informado) | `mesa.portada` | Código |
|---|---|---|---|---|
| `main` (repo, 10:21) | **3/3 verde** · 23 · 23 · 24 ms · 0/0 | **3/3 verde** · 24 · 27 · 25 ms · 0/0 | **3/3 verde** · FCP 2 516–2 556 ms | 0 |
| | «sin chunk: mesa en el paquete principal (index-B7kEqEy5.js)» en las 9 lecturas | | | |
| `lazyP3` (11:05) | **3/3 verde** · 30 · 30 · 31 ms · 0/0 · chunk listo al toque | **3/3 verde** · 915 · 969 · 985 ms · 0/0 · chunk sin llegar al toque | **3/3 verde** · FCP 2 220–2 240 · «el chunk no se pide en la Portada» | 0 |

**Controles (solos):**

| Copia | Resultado | Código |
|---|---|---|
| `lazyP2` (`Suspense` local) | **`mesa.a` 0/3 rojo:** 325 · 330 · 328 ms, con **321 · 326 · 324 ms** de `#root` vacío (y el mismo hueco), aunque el chunk estaba listo al toque. Es H3d-2. `mesa.b` también 0/3 rojo (963–974 ms en blanco). `mesa.portada` verde | 1 |
| `lazyP` (precarga en `App`) | **`mesa.portada` 0/3 rojo:** el chunk se pide a los 2 195 · 2 221 · 2 221 ms, **antes** del FCP (2 232 · 2 240 · 2 232). Es H3d-1. Como lleva además un `Suspense` local, `mesa.a` y `mesa.b` también salen rojos | 1 |

**Nota sobre el margen de `mesa.portada` en `lazyP`:** con 4G lento, la petición adelanta al FCP en 11–37 ms; sin estrangular (Fase 0) lo adelantaba en ~90. El rojo es 3/3 por mayoría, pero el margen es estrecho. Si un cambio de la Portada adelantara su FCP, este control podría pasar a verde aunque la precarga siguiera mal colgada. Para eso existe además `1.8b`, que pesa el camino crítico sin estrangular. Las 3 s extra de Portada sirven para que la línea diga también «chunk pedido después del FCP» si ocurriera.

## §1.3 · `vc`: el Δ de `.pbr-chips` y la lectura del roce

**El Δ (Fase 0 §C5):**
- `vcInstall` gana dos utilidades: `__vcTextos(sel)` (los nodos de texto) y `__vcSnapIgualado(sel, textos)`. Esta segunda escribe en los **nodos de texto** de `.pbr-chips` los valores de la toma `durante`, mide las 13 anclas (`getBoundingClientRect` fuerza el reflujo) y devuelve los textos, todo en el mismo tick.
  - Se tocan los nodos de texto y no `textContent`, para no romper el árbol que React lleva por dentro.
- `jugado` toma `despues` con esa foto igualada. La tolerancia sigue en **0,02 px** para las 13 anclas.
- Si no se puede igualar (distinto número de nodos), `p2` sale rojo y la línea lo dice.
- **La línea del modo:** `vc·jugado · .pbr-chips medido con el texto de «durante» (950 Heptacoins → 1100 Heptacoins) · 13 anclas a 0,02 px`.

**El roce (Fase 0 §C4):**
- La página de `jugado` lleva, desde antes del HTML, un envoltorio de `Howl.prototype.play` (`VC_SONDA_ROCE`) que anota `state()` de cada `play` de `chips-collect`.
- `sonando` se lee con `waitForFunction` durante un máximo de **300 ms** (`VC_ROCE_TECHO_MS`) desde que se ve la capa.
- El juicio de `p1` sigue siendo la compuerta de ARN-3c: «suena el roce y nada más».
- `VC_EXIGE_ROCE_CARGADO = false`: el `loading` del primer `play` se informa como **conocido con dueño ARN-3d-ii** y no tiñe `jugado`. En 3d-ii se pone a `true` y la puerta `p12` (`loaded`) entra en `ok`.

**Vara (repo, dev con bypass en 5185):**

| Corrida | Construidas | `jugado` | Δ | Roce | `reloj` | Guardias | Código |
|---|---|---|---|---|---|---|---|
| `vc` (completa) | 20/20 | **OK** (1 mano) | **0** · igualado 950 → 1100 | 2 `play`: `loading@21526` · `loaded@21548`; sonando a los **2 ms** | OK | `mute` OK · **`corte` FALLA: sin victoria humana en el tope de manos** | 1 |
| `vc 2` | 5/5 | **OK** (9 manos) | **0** · igualado 250 → 350 | 2 `play`: `loading` · `loaded`, 17 ms después; sonando a los **3 ms** | **FALLA: sin victoria humana en el tope de manos** | `mute` OK · `corte` OK | 1 |

- **`jugado` sale verde por primera vez desde ARN-3c, en las dos corridas, salvo el conocido de `loading`.** En la primera hubo cambio de dígitos (950 → 1100): justo el caso de los 10,19 px que H-14 confundía con el overlay.
- **Los dos `play` del primer roce** (22 y 17 ms de separación; 25 ms en la copia `vcd`): el primero en `loading` y el segundo en `loaded`. Es lo de la Fase 0 §C4. Se mide en 4173 en 3d-ii §2.5.5.

**Hallazgo H3d-i-2 · lo que deja `vc` en rojo es azar, no instrumento ni producto (diagnosticado, no arreglado):**
- Cada sub-pasada con juego (`jugado`, `reloj`, `mute`, `corte`) necesita **su propia** victoria humana natural, en ≤ 18 manos de `vcHastaVictoria`.
- En la primera corrida se quedó sin ella `corte`; en la segunda, `reloj`.
- En la copia `vcd`, con el mismo código del arnés, `corte` ganó a la primera mano y `reloj` también salió OK.
- Es el mismo terreno que el «20 manos sin victoria» de la Fase 0 y de ARN-3b («cobertura»).
- El veredicto honesto de una sub-pasada sin victoria sería `cobertura` (código 1 con otra palabra), no `FALLA`. No se toca en 3d-i: es una decisión del rector (¿`vc` adopta `conCobertura` o sube el tope?).

**Control (`vcd`: `body:has(.vc-capa) .player-bar { translate: 0 1px }` en una hoja de la copia):** `vc 2` → **rojo**.
- Las 5 celdas construidas: `FALLA [p2_deltaCero]`.
- **`jugado` FALLA con Δ = 1 (`.player-bar`)**, con el texto igualado (600 → 700): la igualación no tapa un desplazamiento real.
- `reloj`, `mute` y `corte`: OK. Código 1.

## §1.4 · `encadenado`: leer `honesto` si existe

- `scripts/arnes/varas.mjs`:
  - nuevo `leeHonesto(ancla)`: verdadero si la marca trae `honesto` booleano;
  - `encadenadoHonesto` lee `ancla.honesto` cuando existe y, si no, cae a la deducción por igualdad de ARN-3c.
- `diagCEL0.mjs`:
  - anota en el ancla `encadenadoLeido` («marca honesto» o «deducido por igualdad con el nominal»);
  - el fallo cita `honesto=` cuando lo hay;
  - la sección «el arco, tiempos MEDIDOS» imprime una línea por celda: `encadenado honesto <bool> (<cómo se leyó>; espera N ms)`.
- **Pruebas** (`varas.test.js`, +2):
  - con la marca: se lee aunque la espera valga el nominal, y un `honesto: false` gana a una espera «de archivo»; sin audio pedido no hay encadenado;
  - sin la marca, o con un valor no booleano: se cae a la deducción.
- Hasta 3d-ii la marca no existe, así que la vara lee «deducido». La corrida de `celebracion` de esta tanda lo muestra (abajo).

## §1.5 · Remiendo H3d-6

La cabecera de `diagCEL0.mjs` ya no pide «`npm run dev` en otra consola». Dice que, desde ARN-3a, el arnés levanta su propio servidor de desarrollo con bypass en 5173 (o `--puerto=N`).

## `diagCEL0 celebracion` (regresión de lo tocado en `diagCEL0`, sola)

Corrida a las 11:07, sola, en el repo (dev con bypass en 5185):
- **El mismo veredicto que en ARN-3c:** 5 fallos, los 5 **conocidos con dueño** (CEL-2c, «el saldo pide 2800 ms y el doble de CEL-2c son 2933», 3/3 en cada una de las 5 celdas), **0 nuevos**. Código 1, como antes.
- **Control negativo: verde**, ahora con `esperarMesa` delante de «Iniciar mano».
- **Encadenado:** `encadenado honesto true (deducido por igualdad con el nominal; espera 2146 ms)` en las 5 celdas del arco. Se lee por deducción porque la marca `honesto` llega en 3d-ii.
- Un suelto que no cuenta (1/3): «escritorio-1920x1080: entraron 3 rubros, deben ser 4».
- Aislamiento (D6): verde.

---

## STOP-1 · Comprobaciones

**vitest:** 44 archivos, **1 177 pruebas, todas verdes** (antes 1 175; +2 de §1.4).
**eslint:** **21 problemas** (20 errores y 1 aviso): la línea base. Ninguno en los archivos tocados (`npx eslint scripts`: 0).
**build:** uno solo en el repo (el de `diagPUE mesa`, 10:20). Las copias compilaron su propio `dist/` dentro de su carpeta.

**Archivos tocados (todos en `scripts/`; `src/` intacto):**

```
 M scripts/arnes/varas.mjs
 M scripts/arnes/varas.test.js
 M scripts/diagCEL0.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M scripts/rutaMesa.mjs
?? docs/reportes/AJILEI_ARN-3d_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_ARN-3d_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```
`git diff --stat`: 6 archivos, +329 / −13 (el grueso, el modo `mesa` de `diagPUE`: +187).

**Fin de línea** (`git ls-files --eol`):

```
i/lf    w/lf    attr/text=auto eol=lf   scripts/arnes/varas.mjs
i/lf    w/lf    attr/text=auto eol=lf   scripts/arnes/varas.test.js
i/lf    w/lf    attr/text=auto eol=lf   scripts/diagCEL0.mjs
i/lf    w/lf    attr/text=auto eol=lf   scripts/diagDSK.mjs
i/lf    w/lf    attr/text=auto eol=lf   scripts/diagPUE.mjs
i/lf    w/lf    attr/text=auto eol=lf   scripts/rutaMesa.mjs
```
Este informe, en LF (`file`: sin CRLF).

**Fuera de esta tanda, visto de paso:** `scripts/idx/idxCore.mjs` está en `w/crlf` en el árbol de trabajo (`i/lf`, mismo contenido). Es anterior a esta tanda y no se tocó. Lo marca `diff` contra una copia `git archive`, no `git status`.

**Terreno al parar:**

- **`netstat`** (11:15, puertos 4100–5299 y 5040): solo `0.0.0.0:5040`, pid 7724 (el `svchost` de siempre).
- **`node` vivos: ninguno.** Todos los servidores fueron propios, dentro del proceso de cada arnés.
- **Tareas en segundo plano:**
  - la cadena `cap`/`msg`/controles de `lazyP3r` la detuvo el tope de 30 min de su tarea, a mitad del control de `msg`;
  - la segunda corrida de ese control (mesa 5) la detuve yo con `TaskStop` a las 11:04.
  - Después: 0 `node` (comprobado con `Get-CimInstance`).
- **Un `bash` ajeno sigue vivo:** un `tail -f … arn3b-ii/logs_rec.log | grep …` de **otra sesión** (el monitor de `rec` de ARN-3b-ii, pid 43696, padre 23264). No es de esta tanda y no se tocó.
- **`node_modules` del repo, intacto:** 150 entradas, vite 8.0.14, playwright-core 1.62.1.

**Copias:** las uniones a `node_modules` de las cinco copias (`lazyP3`, `lazyP3r`, `lazyP2`, `lazyP`, `vcd`) **se quitaron** con `rmdir` (comprobado: ya no existen). Las carpetas siguen en el scratchpad de la sesión.

## Mapa provisional de commits (lo de 3d-i)

Lo de esta parte va en el commit 2 de la Fase 0 §D4 («arnés»), sin `--audio-lento` (D9):
`scripts/rutaMesa.mjs` · `scripts/diagPUE.mjs` · `scripts/diagCEL0.mjs` · `scripts/diagDSK.mjs` · `scripts/arnes/varas.mjs` · `scripts/arnes/varas.test.js`.
La etiqueta «rojo conocido» de `1.8b` y `VC_EXIGE_ROCE_CARGADO = true` se cambian en 3d-ii, con el producto que los arregla.

## Preguntas al rector

1. **H3d-i-1:** el control de `cap` no sale rojo sin `esperarMesa`, porque su siguiente paso ya espera solo. ¿Basta con el control de `msg` como prueba de que la espera común hace falta, o se quiere un control propio para `cap`? Por ejemplo, leer la mesa justo tras la ruta, cosa que hoy `cap` no hace.
2. **H3d-i-2:** `vc` queda rojo por azar de cobertura (una sub-pasada sin victoria en 18 manos), en una sub-pasada distinta cada vez. ¿Se pasa a `conCobertura` (veredicto `cobertura`) o se sube el tope? Mientras no se decida, `vc` no puede salir con código 0 de forma fiable, y eso afecta a la regresión de 3d-ii («`vc`: el mismo veredicto de hoy o mejor»).
3. **§1.1:** la vara de la ficha (`lazyP3` + 2 s) no pone a prueba la espera, porque la precarga del lobby se adelanta. La que sí la pone a prueba es `lazyP3r`. ¿Se da por buena así?

**Parada en el STOP-1. Espera la revisión del rector.**

---

# Parte 3d-ii · Producto

**Fecha:** 2026-10-02, de 11:19 a 13:05 (106 min) (tope 150 min).
**Sin commits y sin `git add`.**
**Parada en el STOP-2 con una pregunta BLOQUEANTE (§2.4, caso (b) sin red): ver «Pregunta al rector».**

**Dónde se midió:**
- **el repo:**
  - un solo build (`diagPUE 1.8`, 11:46), y el resto con `--sin-build` en preview;
  - servidores de desarrollo con bypass para los modos de 5173.
- **seis copias del árbol de trabajo** en el scratchpad (`c2/`), cada una con su `.env.local`, una unión a `node_modules` y un solo cambio de control:

  | Copia | Cambio |
  |---|---|
  | `inertc` | `inert: ''` |
  | `knock` | `table-knock.mp3` apartado |
  | `tkc` | `tableKnock` fuera de `SONIDOS_LOBBY` |
  | `ctlmsg` | sin la precarga del lobby, sin `esperarMesa` y el chunk retenido 2 s; `msg` recortado a una celda |
  | `sinesc` | sin el escuchador de `vite:preloadError` |

  Las copias se hicieron con `git ls-files -co --exclude-standard`, porque `git archive HEAD` no lleva lo que aún no está commiteado.
- **Puertos propios:**
  - preview: 4183–4186, 4193–4200;
  - dev: 5185–5192.

  El 4173 y el 5173 no se tocaron.

## Revisión del STOP-1: cómo se aplicó

| Respuesta del rector | Qué se hizo |
|---|---|
| El control de `cap` no hace falta: basta el de `msg` | **Anotado.** H3d-i-1 se cierra así: el único control de `esperarMesa` es el de `msg` |
| `vc`: las cuatro sub-pasadas, con el molde de D14; «cobertura» solo como red; la regresión exige `vc` verde con código 0 | **Hecho y verde con código 0** (§2.5.2). El molde **no** abre ningún protegido: usa `setRng`, la API que `deck.js` exporta para inyectar el generador del barajado (la excepción de Protegidos §6, APU-1 §6.11). Por eso no se paró a preguntar |
| La vara de `chipsCollect` se mide con ese molde | Hecho (§2.5.3): antes `loading`, rojo; después `loaded`, verde |
| `lazyP3r` es la vara buena. El control de `msg` sin la espera, con la mesa diferida real, en una celda y hasta su código de salida | **Hecho: rojo, código 1** (§2.4) |

## Resumen

| Pieza | Vara | Control | Estado |
|---|---|---|---|
| §2.1 B9 `inert` | `retar` 6/6 con **0** avisos en consola y `consolaConocida: 0` en cada celda (antes, 4 conocidos por celda); filtro vacío | `inert: ''` en `inertc` → `retar` **rojo** 0/6, «boolean attribute» en las 6 | Hecho |
| §2.2 B10 `.lob-cta-pvp` | `grep` en `src/ scripts/ index.html`: **0**. `lob` verde 6/6 | — (sin consumidor) | Hecho |
| §2.3 B6 modal y `salta` | `grep bankruptModal src/`: **0**. `testEliminations` verde. `apu` (con `rec2`) sin un rojo: `rec2` **18/18**, mesa **7/7**, con el hueco de cobertura conocido (`cobertura`, código 1) | — | Hecho. D10: `.soon-tag` de `welcome.css` borrado |
| §2.4 B11 mesa diferida | `1.8b` **222,0 rojo → 169,0 verde**. `diagPUE mesa` **verde 3/3 en las tres puertas** | Recarga una vez (verde). Sin red: (a) entra; **(b) no entra** | **Bloqueado en (b)**: pregunta al rector |
| §2.5 sonidos | `honesto` leído por la marca en las 5 celdas. `chipsCollect`: `loaded` en el primer `play`. Prueba de fuente verde | `table-knock` apartado → `honesto: false` en las 5 celdas, **5 rojos NUEVOS**. Sin `chipsCollect` → `loading`, rojo. Sin `tableKnock` → la prueba de fuente, roja | Hecho |
| Regresión | ver la tabla de §Regresión | | **Igual o mejor en todo**: vitest 1 222; `vc` verde con código 0; `diagPUE todo` sin rojos |

---

## §2.1 · B9, `inert`

- **`atributosHoja(abierta)`**, en `src/hooks/lobbyCore.js` (el sitio que proponía la Fase 0 §D2: puro, sin React). Devuelve:
  - cerrada: `{ inert: true, 'aria-hidden': 'true' }`;
  - abierta: `{}`.
- **`Lobby.jsx`** la usa: `{...atributosHoja(hojaAbierta)}`.
- **Prueba:** 2 casos nuevos en `lobbyCore.test.js`.
- **`RETAR_RUIDO_CONOCIDO = []`** (y con él `APU_RUIDO_CONOCIDO`, que es su alias). Los dos comentarios se reescribieron para decir que el filtro está vacío y por qué.

**Vara:** `retar` en el repo: **6/6 celdas, verde, código 0**, con `consola: []` y `consolaConocida: 0` en las seis.
**Control:** la copia `inertc` (`inert: ''`): **`retar` rojo, 0/6, código 1**. En las seis celdas, `consola: error: Received an empty string for a boolean attribute…`.

## §2.2 · B10, `.lob-cta-pvp`

- **Se borraron las tres reglas y su comentario de AJF-1** (`lobby.css`, Fase 0 §A3):
  - `.lobby .lob-cta-pvp`;
  - `… .lob-ico`;
  - `… .lob-pastilla`.
- **La base `.lobby .lob-pastilla` se queda**: está viva en la hoja ⚙, cuatro usos en `Lobby.jsx`.
- **El encabezado de la sección 5** («EL ACCESO QUE TODAVÍA NO EXISTE») se quedaba sin contenido propio. En vez de quitarlo, que habría dejado la numeración saltando de 4 a 6, **se renombró** a «5 · LA PASTILLA», con una nota de qué vivía allí.
  - Esa nota no nombra la clase, para que el `grep` dé 0 de verdad.

**Vara:**
- `grep -rn lob-cta-pvp src/ scripts/ index.html` → **0**;
- `lob`: **6/6 celdas, verde, código 0**. `lob` mide las cajas de sus 6 vistas, y ninguna cambió.

## §2.3 · B6, el modal de bancarrota, el comentario de `salta` y D10

**Los cuatro borrados de la Fase 0 §A1** (`GameTable.jsx`, que no es protegido):
1. El estado `bankruptModal`.
2. La rama de `beginHand`, que deja `setGame(next)` sin condición, y la última frase del comentario.
3. `!bankruptModal && ` en la guarda de «Siguiente mano», y «o el modal de bancarrota» en su comentario.
4. El bloque JSX con su comentario «Caso B».

**Los comentarios:**
- **`:1155`**, reescrito en pasado: «que la ✕ de la cabecera (y que el modal de bancarrota, que salía por ella hasta que ARN-3d lo retiró por inalcanzable)».
- **Los que lo nombran como historia** (el de la recarga, «Releva al modal de bancarrota…», y el de la caja heredada) se quedan.
- **El de `salta`**, con el texto de §A4, palabra por palabra. **El código de `salta` no se tocó.**

**D10:** después de quitar el modal, `grep -rn "soon-tag\|btn-soon" src/` en JSX y JS da **0 consumidores**. Lo que queda:

| Sitio | Qué es | Qué se hizo |
|---|---|---|
| `gameTable.css:783` y `:798` | Definiciones, en un protegido | **Se quedan** (D10). Anotadas para el registro de ARN-3e |
| `celebracion.css:185` | Un comentario histórico de CEL-2e | Se queda |
| `welcome.css`, «Kept for ModeSelect» | La regla | **Borrada** |

**Vara:**
- `grep -rn bankruptModal src/` → **0**.
- `testEliminations` → verde, dentro de las 1 222 pruebas.
- `apu`, que lleva `rec2` dentro: **`rec2` 18/18 OK; mesa 7/7 OK; 2 puntos sin cobertura** (`apu.2`/`apu.7` y `tel.boton4` en 360×640: «la fila de All-in no se dio en 4 mesas», el hueco de azar de ARN-3b D4). Veredicto `cobertura`, código 1. **Igual o mejor que ARN-3c** (`rec2` 18/18, mesa 6/7, código 1). La tarjeta de recarga, que hereda la caja del modal, sale verde en las 7 vistas y en las 18 de `rec2`.

## §2.4 · B11, la mesa diferida

**Las piezas (la propuesta `lazyP3`, Fase 0 §B3–B5):**

| Pieza | Dónde | Qué hace |
|---|---|---|
| `cargarMesa`, `fabricaMesa`, `precargarMesa` | `src/lib/cargarMesa.js` (nuevo) | Salen de `creaCargadorMesa(importar, ocioso)`, con el importador y el reloj inyectados para vitest. El *thenable* síncrono cuando el módulo ya llegó. **Ni reintentos ni recuerdo de un fallo:** solo se guarda el módulo ya llegado, y la promesa en vuelo se suelta al terminar |
| `const GameTable = lazy(fabricaMesa)` | `App.jsx`, fuera del componente | El único sitio que monta la mesa |
| `startTransition` en `onRetar` | `App.jsx` | Envuelve `setSaldoSesion`, `setMesa` y `setScreen` |
| Precarga en el efecto de `App` | `App.jsx`, el de `SONIDOS_MESA` | `cargarMesa().catch(() => {})`. Fuera de `'lobby'` por H3d-1 |
| Precarga en el montaje del lobby | `Lobby.jsx` | `useEffect(() => { precargarMesa() }, [])`, junto al de `SONIDOS_LOBBY` |
| **Un único** `Suspense` en la raíz | `main.jsx` | `fallback={<EsperaDiferida />}` |
| `EsperaDiferida` | `src/components/EsperaDiferida.jsx` (nuevo) | El `Cargando` de BIE-1 gobernado por `useEsperaVisible` (D5). Va en su propio archivo por `react-refresh/only-export-components` |
| `vite:preloadError` (D11) | `main.jsx` | Recarga **una vez por sesión** de la pestaña. La guarda, en `sessionStorage` (`ajilei.recargaPorChunk`). Si la guarda ya está, o `sessionStorage` falla, no recarga y el error sigue su curso |

**Pruebas:**
- `src/lib/cargarMesa.test.js`: 7 pruebas:
  - antes de llegar el módulo, la promesa; después, un *thenable* síncrono que resuelve en el mismo tick;
  - dos peticiones son un solo `import()`;
  - un fallo se propaga y no se recuerda;
  - la precarga va al reloj ocioso, es idempotente y se traga su fallo.
- `scripts/testMesaDiferida.test.js`: 4 pruebas. **Ningún archivo de `src/` importa `GameTable` de forma estática**; el barrido no está vacío; `cargarMesa.js` usa `import()`; y el detector sabe fallar.

**Varas:**
- **`1.8b`: 222,0 rojo → 169,0 verde** (FCP 216 ms, 7 recursos, techo 200). Se quitó la etiqueta de «rojo conocido» de `diagPUE.mjs`.
  - El chunk sale como `GameTable-*.js`, 116 KB en crudo, y `GameTable-*.css`, 118 KB.
  - El build no avisó de `INEFFECTIVE_DYNAMIC_IMPORT`.
  - El molde de desarrollo **no** viaja a `dist/`: `grep` de `12-Copas`, `ordenGanador` y `apu=gana` en `dist/assets/*.js` da 0.
- **`diagPUE mesa`** (sola): **verde, código 0**, a las 12:33, sola. Con 4G lento:

  | Puerta | Medida | Resultado |
  |---|---|---|
  | `mesa.a`, con la precarga hecha | **30–31 ms** del toque a la mesa pintada, **0 ms** en blanco (ni `#root` vacío ni hueco) | 3/3 |
  | `mesa.b`, entrada inmediata | **0 ms** en blanco; 938–989 ms quieta en Retar (D12) | 3/3 |
  | `mesa.portada` | FCP 2 224–2 236 ms; **el chunk no se pide en la Portada** | 3/3 |

  Son las mismas cifras que `lazyP3` en la 3d-i y en la Fase 0.
- **Regresión:** ver la tabla de §Regresión.

### Controles de D11 (sonda `sondaD11.mjs`, en el scratchpad, sobre el `dist/` del repo)

El chunk se sirve como `index.html` con 200, que es lo que haría `wrangler` tras un despliegue (H3d-3):

| Caso | Qué pasa |
|---|---|
| **Falla una vez** (tras recargar, el chunk existe) | La precarga del **lobby** falla a los 208 ms y la página **se recarga una vez** (2 navegaciones). Después, «Jugar» **entra a la mesa**. Guarda puesta |
| **Falla siempre** | **Una sola recarga**, sin bucle (2 navegaciones en total). Al tocar «Jugar»: `pageerror: Failed to fetch dynamically imported module`, **`#root` vacío**, ni Retar ni mesa |

**Qué se ve si falla también tras recargar:** la pantalla se queda en el verde del fondo, sin un aviso ni un botón. El jugador tiene que recargar a mano. Es lo que hace hoy un error sin `ErrorBoundary`; no se improvisó ninguno.
- El momento de la recarga no es el toque de «Jugar»: es **el primer segundo del lobby**, porque la precarga es lo primero que pide el chunk.

### Medida sin red (D11), con CDP `offline`

| Caso | Qué pasa |
|---|---|
| **(a)** Precarga del lobby terminada, sin red, «Jugar» | **Entra a la mesa**, con su CSS (`display: flex`, 752 px de alto) |
| **(b)** Precarga cortada por falta de red, vuelve la red, «Jugar» | **NO ENTRA.** Ver abajo |

**(b), en detalle:**
- **Con el escuchador de D11 (el producto de hoy):**
  1. La precarga del lobby falla (`ERR_INTERNET_DISCONNECTED`).
  2. Vite dispara `vite:preloadError`.
  3. El escuchador **recarga la página estando sin red** y el navegador se queda en su página de error (`chrome-error://chromewebdata/`).
  4. Cuando vuelve la red, **sigue en la página de error**: no hay lobby ni «Jugar» que tocar.
- **Sin el escuchador** (copia `sinesc`):
  1. El lobby se queda y vuelve la red.
  2. Al tocar «Jugar», **el navegador no vuelve a pedir el chunk**: hay una sola petición en toda la corrida, la fallida.
  3. Sale `Failed to fetch dynamically imported module` y `#root` queda vacío.
  - **Chromium 151 deja el `import()` fallido en caché** (su mapa de módulos), igual que en el caso «falla siempre».
- **Es la condición de parada de §2.4.** No se ha improvisado nada: ni un `ErrorBoundary`, ni un reintento, ni condicionar la recarga a `navigator.onLine`. Ver «Pregunta al rector».

### El control de `msg` sin la espera (revisión del STOP-1)

**La copia `ctlmsg`:**
- la mesa diferida real de hoy;
- **sin** la precarga del lobby: es la condición de `lazyP3r`, la vara buena;
- **sin** `esperarMesa` en `recorrerRuta`;
- el chunk retenido 2 s (`GameTable-*.js` y `.css`, retenidos 2 000–2 008 ms);
- `msg` recortado a **una sola celda** (T5 1366×768): la lista de celdas se corta a 1, y cazas y barrido a 0.

**Resultado:** `msg·jugado T5 1366x768 (escritorio) · FALLA ruta=—` → **`msg` rojo, código 1**, en 173 s. Es el código de salida que faltaba en la 3d-i.

## §2.5 · Los sonidos

### 1 · La marca `honesto` (D13)

`useCoreografia.js:241` (ahora `:245`) publica `marcaCEL('ancla', { encadenado: !!audio, honesto: esperaPrecedente(audio) > 0, espera })`. Lleva un `import { esperaPrecedente } from './celebracionCore'` y un comentario. `marcaCEL` no hace nada en producción.

**Vara:** `diagCEL0 celebracion` (sola): **el mismo veredicto que en ARN-3c y en la 3d-i**: 5 fallos, los 5 conocidos con dueño (CEL-2c, «el saldo pide 2800 ms y el doble de CEL-2c son 2933», 3/3 en cada una de las 5 celdas), **0 nuevos**, control negativo verde, código 1. **`encadenado honesto true (marca honesto; espera 2146 ms)`** en las 5 celdas del arco: ya se lee por la marca y no por la deducción.
**Control:** `table-knock.mp3` apartado en la copia `knock`: en la copia `knock`, **`encadenado honesto false (marca honesto; espera 1896 ms)`** en las 5 celdas del arco, 3/3. Dos corridas, las dos solas:
  - **la 1.ª (12:41)** sacó el rojo, pero **como conocido**: `diagCEL0` aún tenía en `CEL_CONOCIDOS` la entrada «la fiesta NO se encadenó al toc-toc», con dueño «ARN-3d (precargar tableKnock)». D9 cerró ese pendiente como hecho por LOB-1, así que la etiqueta solo podía tapar una regresión de verdad. **Se retiró** (`scripts/diagCEL0.mjs`, con su comentario);
  - **la 2.ª (12:54)**, con la etiqueta retirada: **10 fallos, 5 conocidos (CEL-2c) y 5 NUEVOS** (el encadenado), control negativo verde, código 1. **Rojo y nombrado como nuevo**, que es lo que tiene que pasar.
  - La vara en el repo (12:33) corrió con la etiqueta todavía puesta, pero no dio ningún fallo de encadenado, así que su veredicto no cambia.

### 2 · El molde nuevo en `src/dev/` (D14): `?apu=gana`

**`src/dev/repartoGanador.js`** (nuevo). Lo consume `siembraAPU.js` como un molde más (`?apu=gana`), con la misma doble puerta (`import.meta.env.DEV` y el parámetro):
- **Prepara el REPARTO de la primera mano, y nada más.** Las 39 tiradas del barajado de `deck.js` se fijan **una vez** con `setRng`, y el generador se desarma solo (`resetRng`) tras la tirada 39.
  - El barajado es el de siempre, con su mismo número de tiradas.
  - La mano se juega por el camino normal: el ante, las tres rondas, los descartes de las IAS (con su propio azar), el showdown y el pago los hace el motor.
- **La mano del humano** (en la primera mano de la sesión la Mano es el humano, `gameEngine.js:92-95`, y el empate es suyo):

  | Jugadores | Mano | Puntos |
  |---|---|---|
  | 2–3 | Cinco «diez» de Copas | 50 |
  | 4 | El 7 de Oros y cuatro «diez» de Copas | 50 |
  | 5 | El 7 de Oros y cuatro «diez» de Copas | 51 |

  **Nunca es AJILEI**: así la celebración es la de mano, que es la que mide `vc`. Los cuatro Ases van al fondo de la baraja, fuera del alcance de cualquier descarte.
- **Las IAS, con manos flojas:** palos repartidos, nunca más de dos cartas de un palo y las de menos puntos primero. El mazo de los descartes va intercalado por palo. **Es un hallazgo de esta tanda (H3d-ii-1):**
  - la primera versión daba a la IA de la mesa 2 cinco Oros (46 puntos);
  - la IA apostó dos veces 500 y dejó al humano en All-in;
  - un All-in con la mejor mano gana el pozo principal, pero el sobrante de la IA vuelve a ella como capa propia, y el óvalo dice «La IA gana con Oros, 46 pts. El pozo se partió…» con `msg-lose`;
  - además, `vcHastaVictoria` no pulsa nunca «All-in»: con la pila corta, el reloj se agota y el humano se retira.
- **La única cosa que el molde no controla:** si una IA se retira «a las 2», la segunda vuelta se corre. Las Copas se colocan en las posiciones del humano para **todos** los casos posibles, salvo uno: 5 jugadores con **exactamente dos** retiradas a las 2. Si pasa, `vc` sigue jugando a ciegas y, si tampoco gana, la sub-pasada sale «sin cobertura».
- **Prueba:** `src/dev/repartoGanador.test.js`, 27 pruebas, contra el barajado y el evaluador **reales**:
  - la baraja sale exacta;
  - el generador se desarma tras un barajado;
  - para cada número de jugadores y de retiradas, la mano del humano no es AJILEI y **nadie puede superarla** con todo lo que alcanzan entre todas las IAS (repartido más descartes);
  - las IAS nacen flojas;
  - los Ases quedan fuera de alcance;
  - el caso no cubierto existe y se declara.
- **En la mesa** (sonda, 1366×768): las cuatro mesas (2, 3, 4 y 5) **ganan la primera mano** («¡Ganas con Copas, 50 pts!»; 51 en mesa 5).

**`vc` con el molde** (`diagDSK.mjs`):
- `gotoMesaVC` entra con `?apu=gana` en `jugado`, `reloj`, `mute` y `corte`. Las 20 celdas de «construido» no lo necesitan y siguen como estaban.
- Cada sub-pasada dice si el molde dio la victoria en la 1.ª mano.
- Sin victoria, `ok: null` y `estado: 'sinCobertura'`, declarado en `sinCobertura` (veredicto `cobertura`, ARN-3b D4). Un `false` sigue siendo rojo.

### 3 · `chipsCollect` en `SONIDOS_MESA` (D14)

- **Cambio:** `chipsCollect` entra en `SONIDOS_MESA` (30 929 B), con el comentario de por qué. El de `SONIDOS_SALAS` se corrigió: ya no es cierto que no esté en ninguna otra lista.
- **La puerta de `vc` se encendió:** `VC_EXIGE_ROCE_CARGADO = true`.
- **Bandera nueva de instrumento:** `vc --retrasa-roce=<ms>` retrasa solo `chips-collect.mp3` en la página de `jugado`.

| Corrida (`vc 2 --retrasa-roce=800`) | Victoria | Primer `play` del roce | ¿Suena en 300 ms? | `jugado` | Código |
|---|---|---|---|---|---|
| **Antes** (`chipsCollect` fuera de la lista), 11:44 | 1.ª mano (molde) | **`loading`** | no (> 300 ms) | **FALLA** (puerta «loaded» roja) | **1** |
| **Después** (en la lista), 11:47 | 1.ª mano (molde) | **`loaded`** | sí, a 1 ms de ver la capa | **OK** | **0** |

**El «antes» es también el control** que pide la ficha («sin `chipsCollect` en la lista → `loading` y rojo»): misma corrida, mismo molde y misma puerta encendida, con la lista de antes.

### 4 · Prueba de fuente de las precargas (D9)

`scripts/testPrecargas.test.js`, 5 pruebas:
- `tableKnock` está en `SONIDOS_LOBBY`;
- `chipsCollect` está en `SONIDOS_MESA`;
- la Portada no paga ninguno de los dos;
- `Lobby.jsx` importa `SONIDOS_LOBBY` y lo precarga en un `useEffect(…, [])`;
- `App.jsx` precarga `SONIDOS_MESA`.

**Controles:**
- en el repo, antes de añadir `chipsCollect`: **rojo** en «chipsCollect está en SONIDOS_MESA»;
- en la copia `tkc`, con `SONIDOS_LOBBY = []`: **rojo** en «tableKnock está en SONIDOS_LOBBY».

### 5 · Los dos `play` de `chipsCollect` (Fase 0 §C4)

**Sonda `sondaPlays.mjs`** en preview (producción, sin StrictMode):
- montaje: `contextoCap`, mesa 2, el envoltorio de `Howl.prototype.play`;
- semillas 3 y 7, manos hasta la primera victoria humana.

**Resultado:**
- **un solo `play` por celebración en las 9 manos**, también en la primera de la página (una recogida de la IA en la mano 1) y en la primera victoria humana (manos 3 y 6). Todos en `loaded`;
- en desarrollo, hoy, también hubo **un solo** `play` en las tres corridas de `jugado` que llegaron a celebrar: antes, después y `vc` entero. La primera corrida del «antes» no llegó a ganar con la primera versión del molde (H3d-ii-1).

**Se cierra como efecto de StrictMode**, como pide la ficha: en producción hay uno. Los dos `play` de la Fase 0 no se reprodujeron hoy ni siquiera en desarrollo.

---

## Regresión

Todo sobre el árbol final. Los modos de 5173, en dev con bypass y su propio puerto; los de 4173, en preview sobre el único build, con `--sin-build`. **Como mucho 6 a la vez; las varas de tiempo, solas** (12:32–13:02, sin ningún otro arnés vivo).

| Modo | Hoy (antes de 3d-ii) | Después | ¿Igual o mejor? |
|---|---|---|---|
| `1.8b` (`diagPUE 1.8`) | 222,0 KiB, **rojo** | **169,0 KiB, verde**, código 0 | **Mejor** (es la vara) |
| `diagPUE mesa` (sola) | `main`: verde, «sin chunk» | **verde 3/3 ×3**, con chunk | Igual (ahora mide una mesa diferida de verdad) |
| `gate` | verde | **verde**, código 0 (4 vistas) | Igual |
| `vc` (entero) | **rojo** por azar de cobertura (H3d-i-2) | **verde, código 0**: 20/20 celdas, `jugado`, `reloj`, `mute` y `corte` en la 1.ª mano con el molde, puerta `loaded` encendida y verde. 102 s | **Mejor**, lo que pedía la revisión |
| `rev` | verde | **verde**, código 0 | Igual |
| `msg` (19 min) | verde | **verde, código 0**: compositor 92 casos, jugado 7/7, Δ larga 7/7, caza 2/2, barrido 11 cajas, semillas 1–15 | Igual |
| `cap` | verde | **verde, código 0**, 31 mediciones. Ojo: H3d-ii-4 | Igual, con un hallazgo |
| `apu` (45 min) | `rec2` 18/18, mesa 6/7, código 1 (ARN-3c) | `rec2` **18/18**, mesa **7/7**, 2 puntos sin cobertura (360×640), código 1 | Igual o mejor (ningún rojo) |
| `retar` | verde, con 4 conocidos por celda filtrados | **verde, código 0, 0 avisos** y filtro vacío | **Mejor** (es la vara de B9) |
| `lob` | verde | **verde 6/6**, código 0 | Igual |
| `diagPUE todo` (sola) | 195 mediciones, **1 rojo** (`1.8b`, el conocido), código 1 (ARN-3c) | **195 mediciones, 0 en rojo, código 0**; `dis.relevo` verde 3/3 en sus 6 vistas (Chromium y WebKit); 75 contextos, 0 escapadas. 322 s | **Mejor** |
| `diagCEL0 celebracion` (sola) | 5 conocidos CEL-2c, 0 nuevos, código 1 | **5 conocidos CEL-2c, 0 nuevos, control verde, código 1**; `encadenado` por la marca | Igual (mejor lectura) |

**Pruebas:** vitest 48 archivos, **1 222 pruebas, verdes**. Antes eran 44 y 1 177: hay 4 archivos nuevos y +45 pruebas.

| Archivo | Pruebas |
|---|---|
| `cargarMesa` | 7 |
| `testMesaDiferida` | 4 |
| `repartoGanador` | 27 |
| `testPrecargas` | 5 |
| `lobbyCore` | +2 |

`testEliminations` está dentro, en verde.

---

## STOP-2 · Comprobaciones

**vitest:** 48 archivos, **1 222 pruebas, todas verdes** (13:02).
**eslint:** **21 problemas** (20 errores y 1 aviso): la línea base. Ninguno nuevo; los dos que aparecieron en `main.jsx` a mitad de tanda se arreglaron llevando el `fallback` a su propio archivo.
**build:** **uno solo en el repo** (`diagPUE 1.8`, 11:46). Todo lo demás, con `--sin-build` o en desarrollo. Dos copias compilaron su propio `dist/` dentro de su carpeta: `ctlmsg`, a través de su arnés, y `sinesc`, con `vite build`.

**`git status --porcelain`:**

```
 M scripts/arnes/varas.mjs
 M scripts/arnes/varas.test.js
 M scripts/diagCEL0.mjs
 M scripts/diagDSK.mjs
 M scripts/diagPUE.mjs
 M scripts/rutaMesa.mjs
 M src/App.jsx
 M src/components/GameTable.jsx
 M src/dev/siembraAPU.js
 M src/hooks/lobbyCore.js
 M src/hooks/lobbyCore.test.js
 M src/hooks/useCoreografia.js
 M src/hooks/useSounds.js
 M src/main.jsx
 M src/screens/Lobby.jsx
 M src/styles/lobby.css
 M src/styles/welcome.css
?? docs/reportes/AJILEI_ARN-3d_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_ARN-3d_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/testMesaDiferida.test.js
?? scripts/testPrecargas.test.js
?? src/components/EsperaDiferida.jsx
?? src/dev/repartoGanador.js
?? src/dev/repartoGanador.test.js
?? src/lib/cargarMesa.js
?? src/lib/cargarMesa.test.js
```
`git diff --stat` (lo seguido): 17 files changed, 558 insertions(+), 132 deletions(-). Archivos nuevos: 7, con 580 líneas.

**Fin de línea** (`git ls-files --eol` de lo seguido y tocado):

```
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/varas.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/arnes/varas.test.js
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagCEL0.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagDSK.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/diagPUE.mjs
i/lf    w/lf    attr/text=auto eol=lf 	scripts/rutaMesa.mjs
i/lf    w/lf    attr/text=auto eol=lf 	src/App.jsx
i/lf    w/lf    attr/text=auto eol=lf 	src/components/GameTable.jsx
i/lf    w/lf    attr/text=auto eol=lf 	src/dev/siembraAPU.js
i/lf    w/lf    attr/text=auto eol=lf 	src/hooks/lobbyCore.js
i/lf    w/lf    attr/text=auto eol=lf 	src/hooks/lobbyCore.test.js
i/lf    w/lf    attr/text=auto eol=lf 	src/hooks/useCoreografia.js
i/lf    w/lf    attr/text=auto eol=lf 	src/hooks/useSounds.js
i/lf    w/lf    attr/text=auto eol=lf 	src/main.jsx
i/lf    w/lf    attr/text=auto eol=lf 	src/screens/Lobby.jsx
i/lf    w/lf    attr/text=auto eol=lf 	src/styles/lobby.css
i/lf    w/lf    attr/text=auto eol=lf 	src/styles/welcome.css
```
**Los 7 archivos nuevos, en LF** (comprobado byte a byte con Python): `src/lib/cargarMesa.js`, `src/lib/cargarMesa.test.js`, `src/dev/repartoGanador.js`, `src/dev/repartoGanador.test.js`, `src/components/EsperaDiferida.jsx`, `scripts/testMesaDiferida.test.js`, `scripts/testPrecargas.test.js`. Este informe, también en LF.

**Protegidos:** **ninguno abierto.**
- De `gameEngine.js`, `deck.js` y `handEvaluator.js` solo se leyeron líneas con `grep` y `sed`, para entender el reparto y la puntuación (`handEvaluator.js` no es protegido).
- El molde usa `setRng`/`resetRng`, las funciones que `deck.js` ya exporta.
- `gameTable.css` no se tocó (D10).

**Terreno al parar:**
- **`netstat`** (13:03, puertos 4100–5299 y 5040): solo `0.0.0.0:5040`, pid 7724 (el `svchost` de siempre).
- **`node` vivos: ninguno** (`Get-CimInstance`, 13:03). Todos los servidores fueron propios, dentro del proceso de cada arnés o sonda.
- **Tareas en segundo plano:** todas terminaron solas. Una espera auxiliar (un bucle `until`, sin `node`) la cortó el tope de 30 min de su tarea, sin efecto en ninguna medida.
- **`node_modules` del repo, intacto:** 150 entradas (`ls`; con `.bin`, `.vite` y `.vite-temp` son 153: las dos últimas son cachés de Vite de hoy). vite 8.0.14, playwright-core 1.62.1.
- **Copias:** las uniones a `node_modules` de las cinco copias (`inertc`, `knock`, `tkc`, `ctlmsg`, `sinesc`) **se quitaron** con `rmdir` (comprobado). Las carpetas siguen en el scratchpad de la sesión.
- **Sondas de un solo uso**, todas en el scratchpad y **ninguna en el repo**: `sondaD11.mjs`, `sondaGana.mjs`, `sondaPlays.mjs`, `mkcopia.sh`.
- **Sin `git add` y sin commits.**

---

## Mapa archivo → commit

El de la Fase 0 §D4, con lo que cambió: sin `--audio-lento` (D9); con el molde de `src/dev/` y la prueba de las precargas.

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3d-1: núcleo — cargarMesa, el molde del reparto y sus pruebas` | `src/lib/cargarMesa.js` · `src/lib/cargarMesa.test.js` · `src/hooks/lobbyCore.js` (`atributosHoja`) · `src/hooks/lobbyCore.test.js` · `src/dev/repartoGanador.js` · `src/dev/repartoGanador.test.js` · `src/dev/siembraAPU.js` (`?apu=gana`) |
| — | API | **Ninguno**: no se tocó Supabase ni `salasApi` |
| 2 | `ARN-3d-2: arnés — esperarMesa, diagPUE mesa, vc con molde y texto igualado, encadenado honesto` | `scripts/rutaMesa.mjs` · `scripts/diagPUE.mjs` (modo `mesa` y la etiqueta de `1.8b`) · `scripts/diagCEL0.mjs` · `scripts/arnes/varas.mjs` · `scripts/arnes/varas.test.js` · `scripts/diagDSK.mjs` (`u1`, `vc`: molde, cobertura, `--retrasa-roce`, puerta `loaded`) |
| 3 | `ARN-3d-3: pantallas — mesa diferida con precarga en el lobby, inert, CSS y modal muertos, sonidos a tiempo` | `src/App.jsx` · `src/main.jsx` · `src/components/EsperaDiferida.jsx` · `src/screens/Lobby.jsx` · `src/components/GameTable.jsx` · `src/styles/lobby.css` · `src/styles/welcome.css` · `src/hooks/useCoreografia.js` · `src/hooks/useSounds.js` · `scripts/testPrecargas.test.js` · `scripts/testMesaDiferida.test.js` · `scripts/diagDSK.mjs` (`RETAR_RUIDO_CONOCIDO = []` por D15, y la puerta `VC_EXIGE_ROCE_CARGADO = true`) |
| 4 | `ARN-3d-4: informes` | `docs/reportes/AJILEI_ARN-3d_Fase0_Informe_v1.0.md` · `docs/reportes/AJILEI_ARN-3d_Informe_v1.0.md` |

**Tres dependencias entre commits, que deciden dónde va cada cosa:**
- **`diagDSK.mjs` aparece en el 2 y en el 3.** En el 2, `vc` usa `?apu=gana`, que llega con el 1. La puerta `VC_EXIGE_ROCE_CARGADO = true` necesita `chipsCollect` en la lista, que llega con el 3.
  - **Propuesta:** el 2 lleva la puerta en `false` y el 3 la pasa a `true`, junto a `useSounds.js`. Así el 2 queda verde por sí solo, por la misma razón que D15.
  - Hay que partir el archivo al preparar los commits (`git add -p`). Lo decide la ficha de commits.
- **`scripts/testPrecargas.test.js` va en el 3:** exige `chipsCollect` en `SONIDOS_MESA`.
- **`scripts/testMesaDiferida.test.js` va en el 3, junto a `App.jsx`:** en el 1, `App.jsx` todavía importa `GameTable` de forma estática y la prueba saldría roja.

## Lista de comprobación para el teléfono (S25 e iPhone)

Para Victor. Antes de empezar, en cada teléfono: abre AJILEI con la versión nueva (la del túnel o la desplegada).

1. **La primera vez, sin nada guardado.**
   - En los ajustes del navegador, borra los datos del sitio de AJILEI. Abre AJILEI.
   - **Mira:** la Portada sale igual de rápido o más que antes, sin cuadros vacíos.
   - Entra con tu cuenta, ve al lobby, toca «Retar a las IAS», elige las cuatro filas y toca «Jugar».
   - **Mira:** la mesa aparece **directamente**, sin un instante de pantalla verde vacía ni un parpadeo entre Retar y la mesa. Las cartas, la barra de abajo y los rivales, en su sitio de siempre.
2. **Entrada muy rápida.** Borra otra vez los datos y repite, pero en el lobby toca «Retar a las IAS» **en cuanto aparezca**, elige rápido y toca «Jugar».
   - **Mira:** puede tardar un momento en cambiar de pantalla, pero **nunca debe verse la pantalla vacía**: o sigue Retar, o ya está la mesa.
3. **Con la app instalada (el icono en la pantalla de inicio).** Ábrela desde el icono, entra a una mesa y juega una mano.
   - **Mira:** lo mismo que en el paso 1. Si la tenías instalada de antes, tiene que abrir la versión nueva sin pedirte nada.
4. **Ganar la mesa entera.** Juega hasta ganar la mesa.
   - **Mira y escucha:** primero suenan los dos golpes del toc-toc y, justo cuando acaban, empieza la fiesta (la lluvia y la música). La fiesta **no** debe empezar a mitad de los golpes ni con un silencio antes.
5. **La primera mano que ganes.** Fíjate en la **primera** mano que ganes en la partida.
   - **Escucha:** el sonido de fichas suena **a la vez** que las monedas vuelan hacia ti, y no un poco después. Las siguientes, igual.
6. **La hoja ⚙ del lobby.** Ábrela y ciérrala.
   - **Mira:** se ve igual que siempre.
   - En el PC: con la hoja cerrada, el tabulador no debe meterse en ella.
7. **Vuelve al lobby y entra a otra mesa.**
   - **Mira:** la segunda vez la mesa sale al instante.

Si algo no cuadra, haz una captura y apunta la hora.

**Un caso que NO hace falta provocar** (§2.4 (b), resuelto en la revisión del STOP-2): si el móvil pierde la red justo en el primer segundo del lobby, el lobby sigue como si nada. Al tocar «Jugar», la página se recarga una vez y vuelves al lobby; la segunda vez, la mesa entra. Si te pasa sin buscarlo, apunta la hora.

---

## Hallazgos nuevos (se reportan, no se arreglan)

| # | Hallazgo |
|---|---|
| **H3d-ii-1** | **Un All-in con la mejor mano no se celebra como mano ganada.** Si el humano gana el pozo principal y una IA recupera su sobrante como capa propia, el óvalo dice «La IA gana con Oros, 46 pts. El pozo se partió: Te llevas otros 2000 Heptacoins» con `msg-lose`, y la celebración no es la del humano. Medido en mesa 2 con la primera versión del molde. Puede ser doctrina (la voz de APU-1 1e-ii) o no: **para el rector**. Además, `vcHastaVictoria` nunca pulsa «All-in» y, con la pila corta, el reloj retira al humano. Es una causa más del azar de H3d-i-2 |
| **H3d-ii-2** | **Chromium 151 deja en caché un `import()` dinámico fallido**: no vuelve a pedirlo aunque vuelva la red (medido por red caída y por tipo MIME). Es la razón técnica del bloqueo de (b) |
| **H3d-ii-3** | **`vite:preloadError` también se dispara cuando falla la PRECARGA** (`__vitePreload` envuelve todo `import()`, `node_modules/vite/dist/node/chunks/node.js:28293-28304`). Con D11, una precarga cortada por falta de red recarga la página sin red |
| **H3d-ii-4** | **`cap.regresion h` (686×360@3) cambia con la precarga del lobby:** 502 639 px distintos, Δmáx 22, Δ ≤ 2 en el 99,983 %. Sigue verde. Es determinista: la copia `lazyP3` de la 3d-i, que también precargaba en el lobby, dio exactamente la misma cifra, y `lazyP3r`, sin esa precarga, dio 0. Las otras dos vistas de `cap`, 0 px. No se investigó más. **Corregido en la revisión del STOP-2: la precarga no es la causa** (ver al final) |

## Pregunta al rector (bloqueante; resuelta con la opción 2, ver «Revisión del STOP-2»)

**§2.4, caso (b): con la precarga del lobby cortada por falta de red, la mesa no puede entrar hasta que el jugador recargue.**

| | Qué ve el jugador |
|---|---|
| **Con el escuchador de D11 (hoy)** | Si la red se cae en el primer segundo del lobby, la página se recarga **sin red** y se queda en la página de error del navegador («Sin conexión»), aunque la red vuelva enseguida |
| **Sin el escuchador** | Se queda en el lobby, pero al tocar «Jugar» la pantalla se queda vacía, porque el navegador no reintenta el `import()` (H3d-ii-2) |
| **Antes de ARN-3d** | Nada de esto: la mesa iba en el paquete principal |

**¿Qué se hace?** No se ha improvisado nada (ni `ErrorBoundary` ni reintento). Opciones, sin recomendarlas como hechas:
1. **Que el escuchador solo recargue cuando el fallo no viene de la red** (por ejemplo, con `navigator.onLine`), o solo cuando el fallo ocurre al ENTRAR a la mesa y no en la precarga. No resuelve el caso «sin escuchador» de arriba: la mesa seguiría sin poder entrar sin recargar.
2. **Que la precarga del lobby no dispare la recarga** (`preventDefault` desde la precarga) y que el `import()` de la entrada recargue una vez. La recarga traería un mapa de módulos limpio y, con red, la mesa entraría. Costo: un parpadeo de recarga al tocar «Jugar» en ese caso raro.
3. **Aceptarlo como está**, con la campaña de despliegue como dueña (igual que H3d-3).

Lo demás de la tanda no depende de esta respuesta, salvo el comportamiento de `main.jsx`.

---

# Revisión del STOP-2 · La precarga nunca recarga

**Rector:** opción 2 de la pregunta bloqueante. Tope de 45 min: de 13:51 a 14:06 (15 min). Sin commits ni `git add`.

## Resumen

- **(b) resuelto:** sin red en el primer segundo del lobby, el lobby sigue y no hay recarga. Al tocar «Jugar» hay **una** recarga, el jugador **aterriza en el lobby**, y al volver a tocar «Jugar» la mesa entra.
- **El despliegue a mitad de sesión** (el chunk servido como HTML): la precarga falla en silencio, hay una recarga al entrar y después la mesa entra.
- **«Falla siempre»:** una sola recarga, sin bucle.
- **H3d-ii-4:** 0 diferencias de estilo, caja o texto. La precarga **no** cambia la foto: con y sin ella, la foto de 686×360@3 es idéntica byte a byte a la maestra sellada. Los 502 639 px son un estado alterno de rasterizado de los degradados que salta de vista en vista entre corridas.
- **Varas:** `diagPUE mesa` (sola) verde 3/3; `1.8b` verde, 169,2 KiB; `cap` verde, código 0. Vitest con 1 232 pruebas verdes; eslint en 21.
- **Un hallazgo nuevo**, H3d-ii-5: en la recarga de la entrada sale un `pageerror` y `#root` se vacía un instante antes de que llegue la navegación.

## Lo que se cambió

| Archivo | Cambio |
|---|---|
| `src/lib/cargarMesa.js` | La marca «entrando a la mesa» dentro del cargador (`marcarEntrada`, `origenFallo` → `'precarga'` o `'entrada'`) y la función pura `decidirFalloChunk(origen, guarda)`. Exporta `marcarEntradaMesa` y `origenFalloMesa` |
| `src/lib/cargarMesa.test.js` | +10 pruebas: el origen antes y después de la marca, que la marca no dependa de que el módulo llegue o falle, la tabla completa de 6 casos, «la precarga nunca recarga» con toda guarda y un origen desconocido tratado como precarga |
| `src/App.jsx` | `marcarEntradaMesa()` justo antes del `startTransition` de `onRetar`, el único camino a `screen === 'table'` |
| `src/main.jsx` | El escuchador lee la guarda (`'libre'`, `'usada'` o `'rota'` si `sessionStorage` falla) y aplica `decidirFalloChunk` |

**La decisión, en una tabla** (`decidirFalloChunk`):

| Origen | Guarda | Resultado | Qué hace el escuchador |
|---|---|---|---|
| precarga | cualquiera | `'silencio'` | `preventDefault` y nada más |
| entrada | libre | `'recargar'` | escribe la guarda, `preventDefault` y `location.reload()` |
| entrada | usada | `'dejar'` | nada: el error sigue su curso |
| entrada | rota | `'dejar'` | nada: sin guarda no se puede impedir un bucle |

- **Por qué una marca y no el error:** tras una precarga cortada, Chromium deja el `import()` fallido en caché (H3d-ii-2) y la entrada falla al acto con el mismo error. El error no dice si alguien está esperando la mesa; la marca, sí.
- **La marca no se quita nunca.** Si el módulo llega, ya no hay fallo que clasificar; si no llega, la recarga trae un módulo nuevo con la marca a cero.
- **El efecto de `App` que pide el chunk** al pasar a Retar (`cargarMesa().catch`) corre antes de la marca, así que cuenta como precarga, como pidió el rector.
- **Con el evento prevenido, Vite resuelve el `import()` sin módulo** (`node.js:28297`). En la precarga eso se traga: el cargador no guarda nada y la entrada lo volverá a pedir.

## Las tres medidas de D11

Sonda de un solo uso en el scratchpad (`sondaD11b.mjs`, ninguna en el repo), en preview con la sesión simulada de `contextoCap`, 1366×768. Las tres corrieron en paralelo, en puertos distintos.

| Caso | Antes de «Jugar» | Primer «Jugar» | ¿Dónde aterriza? | Segundo «Jugar» |
|---|---|---|---|---|
| **(b)** precarga cortada sin red (`ERR_INTERNET_DISCONNECTED`), vuelve la red | lobby, **sin recarga**, guarda vacía; sigue en el lobby al volver la red | **una** recarga (navegación a los 208 ms del inicio de la ruta) | **en el lobby**, con la guarda escrita | **la mesa entra** |
| **despliegue** (el chunk servido como HTML la 1.ª vez) | lobby, **sin recarga**; el HTML se sirvió una vez, a la precarga | **una** recarga (a los 205 ms) | **en el lobby** | **la mesa entra** (el chunk ya responde JS) |
| **falla siempre** (HTML siempre) | lobby, sin recarga | **una** recarga | en el lobby | **sin recarga nueva**: `Failed to fetch dynamically imported module` y `#root` vacío |

- **Navegaciones de la página principal:** 2 en cada caso, la carga inicial y la recarga de la entrada. En «falla siempre» no hay una tercera: **sin bucle**.
- **Peticiones del chunk:** 2 en cada caso, la precarga del primer documento y la del segundo. La entrada del primer documento **no** pide el chunk: lo resuelve la caché del `import()` fallido, y por eso recarga al acto.
- **Al aterrizar en el lobby, la elección de mesa se pierde:** el jugador vuelve a pasar por «Retar a las IAS». El `setSaldoSesion` del primer intento iba dentro de la transición que no llegó a confirmarse, y la recarga vuelve a leer el saldo.
- **«Falla siempre» termina igual que antes:** pantalla en el verde del fondo, sin aviso. No se improvisó ningún `ErrorBoundary`.

## H3d-ii-4 · La comparación de §B8 a 686×360@3

**Sonda** (`sondaB8h.mjs`, en el scratchpad): la receta de `cap` en la vista h (`pasadaCap`, semilla 5, «A las 3 — Tú abre.»). En el instante de la foto lee el estilo computado completo (sin `animation*` ni `transition*`), la caja y el texto de `html`, `body` y cada elemento de `#root`.
- **Con precarga:** el árbol de trabajo.
- **Sin precarga:** la copia `sinprec`, con la línea `useEffect(() => { precargarMesa() }, [])` de `Lobby.jsx` quitada.

| | Elementos | Estilo distinto | Caja distinta | Texto distinto |
|---|---|---|---|---|
| 686×360@3 | 187 / 187 | **0** | **0** | **0** |

- **Lo demás, igual:** las hojas (`index-….css` y `GameTable-….css`, en el mismo orden), la animación viva (`turnBreath`, fijada) y la lectura de la mesa.
- **La única diferencia del `<head>`** es el hash del `modulepreload` del JS de la mesa: cada árbol compila el suyo.
- **La foto:** las dos dan `1e13575a3f10…`, **idéntica byte a byte a la maestra sellada** `maestras/portada/mesah.png`.

**De dónde salen los 502 639 px:**
1. **No son de la precarga.** En el `cap.json` de la regresión de esta mañana, la vista h tiene `sha256` `292e1c45…` en la pasada 1 y `1e13575a…` en la pasada 2. **En la misma corrida y con el mismo árbol, la segunda pasada ya era la maestra.** `cap.regresion` compara solo la pasada 1.
2. **Dónde caen** (la pasada 1 de esta mañana frente a la maestra, `difH.mjs`): por todo el fotograma (x de 3 a 2054, y de 0 a 1079). Δ=1 en 485 289 px (96,5 %), Δ=2 en 16 969 (3,4 %) y Δ≥3 en solo 381. Por elemento, en los fondos con degradado y translucidez: `player-zone` 83 213, `table-mid` 75 736, `center-zone` 37 157, `game-table` 32 753, la cabecera de un rival 32 229… Ningún borde, texto ni carta desplazados.
3. **Es el estado alterno de rasterizado de los degradados** que la vara de `cap` ya tolera por diseño (Addendum 1, D-1: «el rasterizado de los degradados tiene más de un estado»).
4. **Salta de vista en vista:** en la corrida de `cap` de hoy, la vista h da **0 px** frente a la maestra y es la **pc** la que trae 637 633 px distintos entre sus dos pasadas (Δmáx 16, Δ ≤ 2 en el 99,994 %). Esta mañana, la pc daba 0.
- **Corrección de lo dicho en la 3d-ii:** el «determinista» de H3d-ii-4 no aguanta. Que `lazyP3` repitiera la cifra exacta habla de un estado de rasterizado que se repite, no de que la precarga lo provoque.

## Varas

| Vara | Resultado |
|---|---|
| `diagPUE mesa` (**sola**, `--sin-build`) | **verde, código 0**: `mesa.a` 3/3 (30–31 ms, 0 en blanco, chunk listo al toque); `mesa.b` 3/3 (0 en blanco, 928–988 ms, se informa); `mesa.portada` 3/3 (el chunk no se pide en la Portada) |
| `1.8b` (`diagPUE 1.8`) | **verde, código 0**: FCP 264 ms, 7 recursos, **169,2 KiB** en el cable (techo 200). La 3d-ii medía 169,0: +0,2 KiB por la decisión y la marca, que viajan en el paquete principal |
| `cap` | **verde, código 0**, 31 mediciones. `regresion`: v 0 px, h 0 px, pc 637 633 px dentro de la vara (ver arriba) |
| vitest | **48 archivos, 1 232 pruebas, verdes** (antes 1 222: +10 de `cargarMesa.test.js`) |
| eslint | **21**, igual que la línea base |

- **Un solo build** del árbol de trabajo (`vite build`, 13:54). Las varas corrieron con `--sin-build` sobre ese `dist/`. La copia `sinprec` se compiló aparte, como las copias de control.
- `1.8b` y `cap` corrieron a la vez, en puertos distintos; `diagPUE mesa`, sola.

## Hallazgo nuevo

| # | Hallazgo |
|---|---|
| **H3d-ii-5** | **En la recarga de la entrada, `#root` se vacía un instante antes de navegar.** Con el evento prevenido, Vite resuelve el `import()` sin módulo; `React.lazy` lee `.default` de `undefined` (`pageerror: Cannot read properties of undefined (reading 'default')`) y, sin `ErrorBoundary`, React desmonta la raíz. La navegación llega en ≈ 200 ms desde el inicio de la ruta, así que el hueco es aún más corto. No se arregló: pide que la entrada no resuelva mientras se recarga, y eso no estaba en la revisión. **Para el rector** |

## Comprobaciones

- **Todo lo tocado en LF** (comprobado con Python): `cargarMesa.js`, `cargarMesa.test.js`, `main.jsx`, `App.jsx` y este informe.
- **`netstat` limpio:** solo el 5040. **Ningún `node` vivo.**
- **`node_modules` intacto** (150). La unión de la copia `sinprec` se quitó con `rmdir`.
- **Sondas de un solo uso** en el scratchpad, ninguna en el repo: `sondaD11b.mjs`, `sondaB8h.mjs`, `difH.mjs`.
- **Mapa de commits:** sin cambios. `cargarMesa.js` y su prueba siguen en el 1 (las piezas nuevas no dependen de nada del 3); `App.jsx` y `main.jsx`, en el 3.
- **Sin `git add` y sin commits.**

# Validación de Victor y cierre

| Teléfono | Resultado |
|---|---|
| **Samsung S25** (Chrome, por túnel, 2026-10-02) | **Al 100%, sin novedad.** Primera entrada, entrada rápida, primer roce a tiempo, toc-toc y fiesta, hoja ⚙ y segunda mesa: todo correcto |
| **iPhone** (WebKit/iOS) | **Pendiente.** Por decisión de Victor, ARN-3d se publica sin esperar. Su lista de pruebas entra en la sesión intensiva de iOS (iPhone y quizás iPad), y si aparece algo, se corrige entonces |

**Decisiones del rector en la revisión final:**
- **H3d-ii-4:** cerrado. La precarga no cambia la foto (idéntica byte a byte a la maestra). Los píxeles venían del segundo estado de rasterizado de los degradados, que la vara de `cap` ya tolera.
- **H3d-ii-5:** aceptado tal cual. Es un hueco de menos de 0,2 s antes de una recarga, y solo en el caso raro de la entrada fallida. Se anota para quien añada un `ErrorBoundary`.
- **H3d-ii-1:** la voz del All-in con la mejor mano se corrige en su campaña. Decisión de Victor: «¡Ganas con…!» en tono de victoria, y la devolución del sobrante a la IA, aparte.
- **H3d-3** (`wrangler.jsonc` sirve HTML con 200 cuando falta un chunk): aplazado. Su dueña es la campaña de despliegue.
- **No se puede probar por el túnel:** la PWA instalada. Se prueba tras publicar.
