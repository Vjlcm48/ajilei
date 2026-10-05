# AJILEI · PAN-1 · 1c · Pantalla completa en los teléfonos · Informe v1.0

**Fecha:** 2026-10-04, desde las 16:35.
**Ficha:** `AJILEI_PAN-1_1c1d_PantallaCompleta_Cierre_v1.0.md` (la parte 1c). Base `651c212`.
**Estado:** **publicada** (`77e880b`, §11.8), con la opción (b) del rector (§11): la exclusión `data-sin-pantalla-completa`. La validación del S25 (V1–V11, todas bien) está en `AJILEI_PAN-1_Cierre_v1.0.md` §4. §§1–10 cuentan la primera parada tal como fue; §11 manda.

## §0 · Resumen

- **La regla R1–R9 está en un núcleo puro y probado:** `src/lib/pantallaCompletaCore.js` (84 líneas) y su prueba (9 casos, los 9 de la ficha). El cableado es mínimo: un oyente de `pointerup` en captura sobre el documento y «dentro de la mesa» = `screen === 'table'` en `App.jsx` (+17), la reentrada como primera sentencia de «Iniciar mano» y «Siguiente mano» en `GameTable.jsx` (+8 −1), y `"display": "fullscreen"` en el manifiesto.
- **Ningún archivo tocado está protegido** (M2): los seis de `AJILEI_Protegidos_v1.0.md` §2 siguen intactos.
- **Los vigilantes saben fallar:** cuatro controles en copia, los cuatro rojos (§3).
- **El arnés sí ejercita la pantalla completa** (M3): una sonda en la copia midió que, en los contextos de teléfono, el primer clic la pide y entra a los 3–14 ms **sin `resize` y con el mismo alto**; en escritorio no se pide (§4).
- **La regresión da los mismos veredictos que `651c212`** (§6). Tres modos salieron rojos en la primera tanda por una **carrera de vite** al arrancar 11 servidores a la vez sobre una caché vacía; repetidos con la caché hecha, verdes. `h1` salió verde a la primera.
- **Lo que el arnés no puede medir** (el salto al entrar, el atrás de Android, el aviso de Chrome, el teclado del login) queda para el S25 (V1–V10).

## §1 · Paso 0 · Punto de partida (16:35)

| Comprobación | Resultado |
|---|---|
| `git log -1` | `651c212 PAN-1b: informes` |
| `git status` | los 5 residuos y `laminas/pan1/` |
| `npx vitest run` | **1 312/1 312** (53 archivos) |
| `npx eslint .` | **21** (20 errores, 1 aviso) |
| `node` vivos | ninguno |
| Foto del `.vite` del repo (M5, después del vitest) | 18 archivos |
| Protegidos (M2) | `App.jsx`, `GameTable.jsx`, `index.html` y `public/manifest.webmanifest` no están en la lista de seis |

## §2 · Pasos 1 y 2 · El núcleo, su prueba y el cableado

**`src/lib/pantallaCompletaCore.js`** (A), sin React y con `doc`/`win` por parámetro:

- `aplica(win)`: R1 (`(hover: none) and (pointer: coarse)`), la API presente y habilitada (`requestFullscreen` y `fullscreenEnabled !== false`) y **no instalada** (`instalada(win)`: `display-mode: standalone`, `display-mode: fullscreen` o `navigator.standalone`).
- `pedir(doc, win)`: si aplica y no hay `fullscreenElement`, llama a `documentElement.requestFullscreen({ navigationUI: 'hide' })` **antes de devolver**. Se traga la promesa rechazada y también una excepción síncrona.
- `creaPantallaCompleta(doc, win)`: la política de R4. `fijaDentroMesa`, `alGesto` (pide solo fuera de la mesa), `reentrar` y `engancha` (`pointerup` en captura sobre el documento, que devuelve su desenganche).
- `reentrar(doc, win)`: la reentrada explícita que usa la mesa.

Dos elecciones que no estaban escritas en la ficha:

- **`pointerup`, y no `click`:** es el evento que la especificación nombra para activar la página cuando el puntero no es un ratón. En captura, llega antes que cualquier `stopPropagation` y antes de que el clic cambie de pantalla, así que el toque que lleva a la mesa todavía cuenta como de fuera (R2).
- **`navigationUI: 'hide'`:** pide a Chrome que esconda también la barra de navegación, que es el estilo Netflix que pide la ficha. Si el S25 enseña algo raro, es la primera opción que se quita.

**`src/lib/pantallaCompletaCore.test.js`** (A), con el molde de `useCongelado.test.js`: dobles de `document` y `window`, sin jsdom. Los 9 casos de la ficha:

| # | Caso | Cómo |
|---|---|---|
| 1 | síncrona | el doble anota cuántas llamadas había **dentro** de la llamada; al volver de `pedir`, ya hay 1 |
| 2 | sin API | sin `requestFullscreen`, y con `fullscreenEnabled: false` |
| 3 | instalada | `standalone`, `fullscreen` y `navigator.standalone` |
| 4 | escritorio | ratón, portátil táctil (`pointer: coarse` sin `hover: none`) y `hover: none` sin `pointer: coarse` |
| 5 | ya dentro | la segunda llamada no pide |
| 6 | promesa rechazada | oyente de `unhandledRejection` durante 20 ms: vacío; y una `requestFullscreen` que lanza, tampoco sale |
| 7 | nunca sale | el doble de la salida no se llama en todo el recorrido; **y además** ningún archivo de `src` (pruebas aparte) contiene una llamada de salida |
| 8 | fuera de la mesa | tras salir, el siguiente `pointerup` reentra; el oyente está en captura y se desengancha |
| 9 | dentro de la mesa | tras salir, dos `pointerup` no reentran; `reentrar` sí; al dejar la mesa vuelve a valer cualquier gesto |

**El cableado:**

- `src/App.jsx` (+17): el import y dos efectos detrás del de la precarga (`:359-373`). El primero crea el controlador y lo engancha una vez (`[]`); el segundo fija `fijaDentroMesa(screen === 'table')`. Van antes de cualquier retorno temprano, así que el oyente vive también en la Portada, el bautizo y el login (R2).
- `src/components/GameTable.jsx` (+8 −1): el import (`:43`); «Iniciar mano» pasa de `onClick={beginHand}` a una flecha que llama primero a `reentrarPantallaCompleta(document, window)` y luego a `beginHand()`, que no usa argumentos (`:2302-2309`); y en «Siguiente mano», la reentrada es la primera sentencia del manejador (`:2454`). Nada más cambia en los dos manejadores. `SoundButton` llama al `onClick` de forma síncrona dentro del `click` (`SoundButton.jsx:6-9`), así que la llamada sigue dentro del gesto. No hay más botones «Iniciar mano» ni «Siguiente mano» en `src`.
- `public/manifest.webmanifest`: `"display": "fullscreen"` (R5); `"orientation": "any"` se mantiene (R6).
- **`index.html` no se toca.** Su comentario de `:74` («Safari NO lee `display: standalone` del manifest») sigue siendo cierto con `fullscreen`, y la meta `apple-mobile-web-app-capable` sigue gobernando el iPhone (R7, «iPhone: pendiente»).

En el repo: vitest **1 321/1 321** (54 archivos; +9), eslint **21** y `npm run build` limpio. El aviso de chunks de más de 500 kB es el de siempre: `index` pasa de 527,08 a 528,06 kB (el núcleo va en el chunk de entrada) y `GameTable` de 115,97 a 116,01 kB.

## §3 · Controles (copia `pk`)

`pk` = `git archive 651c212` + el diff, con 151 uniones, `cacheDir: '.vite-copia'`, `.env.local` y los 75 volcados (M4). Verde de partida: **1 321/1 321**.

| Control | Qué se rompe | Resultado |
|---|---|---|
| A | la llamada, detrás de un `setTimeout` | **rojo**: casos 1, 5, 8 y 9 |
| B | sin la comprobación de instalada | **rojo**: caso 3 |
| C | `alGesto` sin la guarda de «dentro de la mesa» | **rojo**: caso 9 |
| D | una llamada de salida en `App.jsx` al volver al lobby | **rojo**: caso 7 (`src\App.jsx`) |

Los controles A y B los pide la ficha; C y D son de propina. Tras cada uno, el archivo se restauró y se comparó byte a byte con el del repo. Al final, en `pk`, 1 321/1 321.

## §4 · M3 · El arnés y la pantalla completa (sonda en `p1`)

Sonda de scratchpad (`sonda1c.mjs`, nunca en el repo): el servidor del arnés en proceso, el navegador del arnés y un primer clic en (5, 5) del lobby.

| Contexto | Táctil (R1) | Tras el clic | Tras `Escape` |
|---|---|---|---|
| 360×640 `isMobile` + `hasTouch`, `mouse.click` | sí | `requestFullscreen` a los 3 ms, `fullscreenchange` a los 7; **360×640, sin `resize`** | sigue dentro |
| 360×640, `page.tap` | sí | pide a los 51 ms, entra a los 59; **360×640, sin `resize`** | sigue dentro |
| 915×412, `mouse.click` | sí | pide a los 3 ms, entra a los 14; **915×412, sin `resize`** | sigue dentro |
| 1366×768 de escritorio | no | **no se pide** | — |

O sea: en los modos de teléfono la regresión corre **ya en pantalla completa** desde el primer clic, y Chromium sin cabeza entra sin cambiar el alto (H-PAN0-7). El `Escape` del teclado sintético del arnés no la saca. **El Esc en escritorio no aplica (R1): allí nunca se pide.**

## §5 · Paso 3 · Lo que hay que mirar

**1. Los oyentes de `resize`.** En `src` hay seis que cortan algo al cambiar el tamaño: la celebración (`useCelebracion.js:130`), el ⋮ (`useUtilitiesMenu.js:308`), las reacciones (`useReacciones.js:122`), los tapetes (`useTapetes.js:145`), las consultas (`useConsultas.js:65`) y la cuenta (`CuentaPanel.jsx:43`). Hay además dos que recolocan sin cortar: VOZ-2 (`Voz2Capa.jsx:48-52`) y el wordmark (un `ResizeObserver`).

**Los seis que cortan ya se cortan con un `pointerdown` en captura fuera de ellos**, y el `pointerdown` de un toque llega antes que su `click`. Al tocar «Siguiente mano» o «Iniciar mano», la celebración (que se corta con cualquier `pointerdown`, `useCelebracion.js:128`) y los menús abiertos ya se han cerrado **por el propio toque** antes de que corra la reentrada. El `resize` que pueda venir después no encuentra nada vivo que cortar. Además, la reentrada solo pide algo si la pantalla completa se perdió: en el caso normal, `pedir` devuelve sin hacer nada y no hay `resize`.

**Dónde cae el reacomodo, si lo hay:** tras «Siguiente mano», en los 300 ms de limpieza (`isClearing`) y en el barajado de 1 950 ms (`GameTable.jsx:1686-1690`); tras «Iniciar mano», en el barajado. El reparto (los vuelos, que miden la geometría al lanzarse) empieza al terminar el barajado. Un reacomodo de Chrome que tarde menos de ~2 s cae antes de que vuele ninguna carta. **Esto no se puede medir aquí** (sin cabeza no hay cambio de alto): lo dice V4/V5 en el S25.

**2. El login.** Con R2, el primer toque en el campo de correo pide la pantalla completa en su `pointerup`, y el foco (y con él el teclado) llega con los eventos de compatibilidad que siguen. Que las dos cosas pasen juntas solo lo dice el S25 (V8).

**3. El Esc en escritorio:** no aplica (R1). Anotado.

**Un efecto de borde que conviene saber:** `requestFullscreen` **consume** la activación del gesto. Si el primer toque de la app (o el primero tras una salida, fuera de la mesa) cae justo sobre algo que también necesita activación (`navigator.share`, abrir una ventana), eso podría fallar esa vez. No he encontrado en `src` nada así que esté en el primer toque, pero lo anoto para el S25.

## §6 · Paso 4 · Validación

**En el repo:** vitest **1 321/1 321**, eslint **21** (idénticos), build limpio.

**La regresión de INV-04 e INV-07, en `p1`** (`git archive 651c212` + el diff, 151 uniones, `cacheDir` propio, `.env.local` y los 75 volcados). Comparada con la de `cc` en la 1b (§11.5 de su informe):

| Invariante | Modo | 1c (`p1`) | 1b (`cc`) |
|---|---|---|---|
| INV-04 | `o1` | **verde** (repetido, ver abajo) · 315 s | verde · 357 s |
| INV-04 | `o2` | verde · 17 s | verde |
| INV-04 | `h1` | **verde a la primera** · 1 669 s | rojo 1/16 (intermitente) y verde al desempate |
| INV-04 | `r1` · `r2` | verdes · 609 s · 625 s | verdes |
| INV-04 | `rev` | **verde** (repetido) · 215 s | verde · 219 s |
| INV-04 | `msg` | verde · 1 132 s | verde |
| INV-04 | `diagPUE voz2` | verde, **222 mediciones, 0 rojas** | igual |
| INV-04 · INV-07 | `luz` | **rojo solo en p4_fugas**, la misma línea de resumen (p1–p3, p5 y extras ✓) | igual (preexistente, ARN-4) |
| INV-07 | `tactil` | **verde, 36/36** | verde, 36/36 |
| INV-07 | `u1` | rojo, **el mismo**: 20/20 celdas de escritorio OK y las 8 líneas táctiles **idénticas byte a byte** a las de la 1b (solo `item2` = Tapetes 63×35) | igual |
| INV-07 | `u2` · `menu-movil` | verdes (`menu-movil` repetido) | verdes |
| INV-07 | `diagSAL sal` | verde (102 contextos) | verde |
| INV-07 | `lob` · `retar` | verdes | verdes |
| INV-04 · INV-07 | `apu` completo | 7/7 celdas OK y REC-2 18/18, pero **«cobertura»** (código 1): en 360×640 la fila de All-in no se dio en 4 mesas. Desempate, `apu 360x640` solo: **verde**, con cobertura completa (ver abajo) | verde |
| INV-07 | `rec` | **verde**: p1–p7 y el anillo ✓ · 983 s | verde · 868 s |

**La carrera de vite (instrumento, no producto).** La primera tanda lanzó 11 modos de dev a la vez sobre la `.vite-copia` **vacía** de `p1`. Cuatro servidores vieron `error while updating dependencies` (EPERM/ENOENT en el `rename` de `deps_temp_*` → `deps`) y alguno, además, `Pre-transform error`:

- `o1`: abortó con código 2 en 38 s (`waitForSelector .game-table`).
- `rev`: rojo, con las 10 celdas de mesa sin llegar a la mesa (`waitForSelector`) y las 4 de fuera (Portada y Sala) OK.
- `menu-movil`: rojo solo en la **primera** celda (mesa 5 375×812, un `click` que no termina a las 16:42:10–12, en la ventana del error); las otras 16 OK.
- `sal`: vio el error y salió verde.

Los cuatro logs están guardados tal cual (`*_carrera.log`). Repetidos con la caché ya hecha, `o1`, `rev` y `menu-movil` salen **verdes** con tiempos de la 1b. Ningún rojo apunta a la pantalla completa: los tres son fallos de carga en el primer minuto, y la misma copia, con el mismo árbol, da verde al repetir. **En la 1b no pasó porque `cc` ya tenía la caché caliente.** Para la próxima copia: un arranque solo antes de lanzar la tanda (→ ARN-4, junto a lo de M4).

**La cobertura de `apu` (azar, no producto).** En el `apu` completo, la celda 360×640 salió «OK» en todo lo que midió, pero **sin cobertura** en `apu.2`/`apu.7` y `tel.boton4`: en ninguna de las 4 mesas abrió una IA por encima de la media apuesta del humano, así que la fila de All-in no apareció y no había botón que medir (D4 de ARN-3b, `diagDSK.mjs:2798-2806`). No hubo ninguna medida roja. Esa fila depende de las apuestas de las IA, que no llevan semilla en este modo, y no del alto ni de la pantalla completa. **Desempate:** `apu 360x640` solo, en la misma copia: **verde** con cobertura completa (`apu.7` al pago en 7 611 ms), y la tarjeta mide lo mismo que en la 1b (blanda 36–36, forzosa 42–42, zona mínima 40 y 43). El log del completo está guardado (`p1_diagDSK_apu_completo.log`).

**Resultado del Paso 4:** los mismos veredictos que en `651c212`. Verde todo, salvo `luz` p4_fugas y `u1`/Tapetes, que son los preexistentes. `h1` no necesitó desempate. **La pantalla completa no cambia ningún veredicto del arnés (M3).**

## §7 · Paso 5 · El mapa

| # | Commit | Archivos | Conteo |
|---|---|---|---|
| 1 | `PAN-1c: pantalla completa` | `src/lib/pantallaCompletaCore.js` (A) · `src/lib/pantallaCompletaCore.test.js` (A) · `src/App.jsx` (M) · `src/components/GameTable.jsx` (M) · `public/manifest.webmanifest` (M) | 5 archivos: +84 · +194 · +17 · +8 −1 · +1 −1 |

> **Superado por §11.6** (entra `SalaEspera.jsx` y cambian los conteos del núcleo y su prueba).

Este informe no va en el commit 1: va con el de cierre en `PAN-1: informes y cierre` (1d). Fuera: `laminas/pan1/`, los cinco residuos y nada más. En `git add` solo van rutas explícitas.

**Después del «OK mapa»:** el commit se comprueba en su copia (`git archive` del SHA, con M4: vitest verde) y Victor hace el push. Después viene la validación del S25 (V1–V10), y la 1d no empieza hasta que Victor la reporte.

## §8 · Cierre del STOP (18:12)

- **`node` vivos:** ninguno. **Puertos 4170–5599:** solo `0.0.0.0:5040` (PID 7724, `svchost`).
- **Copias `p1` y `pk`:** las 151 uniones de cada una quitadas con `[System.IO.Directory]::Delete(…, $false)`; en su `node_modules` quedan solo su `.vite-temp` y el `.package-lock.json`.
- **`node_modules` del repo:** intacto (154 entradas; `vite`, `react` y `playwright-core` presentes).
- **`.vite` del repo:** contra la foto de las 16:36 (M5), solo cambia `results.json` (el vitest del Paso 4). `node_modules/.vite/deps` sigue intacto.
- **`git status`:** `App.jsx`, `GameTable.jsx` y el manifiesto modificados; el núcleo, su prueba y este informe sin rastrear; los cinco residuos y `laminas/pan1/` fuera. HEAD en `651c212`. Sin `git add`.

Parada en el STOP del Paso 5. El rector dio el «OK mapa»; antes del commit, la búsqueda de §9.

## §9 · Tras el «OK mapa» · Compartir, ventanas y portapapeles (antes del commit)

**La búsqueda en todo `src`** (`navigator.share`, `canShare`, `window.open`, portapapeles y `execCommand('copy')`) da **un solo sitio**: la sala de espera del PvP. Allí están `copiar` (`SalaEspera.jsx:332-340`, `navigator.clipboard.writeText` del código) y `compartir` (`:342-354`, `navigator.share` y, sin la API, el portapapeles), en los botones `data-accion="copiar"` (`:521-529`) y `data-accion="compartir"` (`:534`). `IconosSalas.jsx:102` solo los nombra en un comentario. No hay ningún `window.open`.

**Sí puede ser el primer toque fuera de la mesa.** Hay dos caminos:

1. **Se llega a la sala sin tocar nada.** Con la sesión abierta, al abrir o recargar la app no hay Portada, y el arranque de salas (`App.jsx:275-302`) llama a `mi_sala()` y entra por `entrarSala` (`:228-232`) directo a `sala-espera`. El primer toque de la app puede ser «Compartir» o el de copiar.
2. **Se vuelve de compartir.** El anfitrión toca «Compartir», la hoja lo manda a otra app (WhatsApp) y, al volver, la pantalla completa se ha perdido (es un cambio de app, R4). El siguiente toque, que puede ser «Compartir» otra vez, vuelve a pedirla.

**Lo medido** (sonda en una página en blanco, Chromium del arnés, 360×640 táctil, `page.tap` sobre un botón, sin la app):

| | `isActive` en el `pointerup`, antes → después de pedir | `isActive` en el `click` | `window.open` en el `click` |
|---|---|---|---|
| sin pantalla completa | `true` → `true` | `true` | abre |
| con `requestFullscreen` en el `pointerup` (captura) | `true` → **`false`** | **`true`** | **abre** |

`requestFullscreen` **sí consume** la activación en el `pointerup`, pero el `touchend` que llega después (también activa la página según la especificación) la devuelve antes del `click`. En el emulador, lo que necesita activación en el `click` la tiene. **`navigator.share` no se pudo probar:** el Chromium sin cabeza no tiene la API. `clipboard.writeText` en Chrome pide el foco del documento, no la activación.

> **Corrección (§11.4):** la frase sobre `navigator.share` es falsa. La página en blanco de la sonda (`setContent` sobre `about:blank`) no era un contexto seguro, y por eso no tenía la API. En `http://localhost`, el Chromium de Windows **sí** la tiene, y en la sala real `share` se llama con la activación intacta (§11.4).

**Propuesta para el S25,** como V11: con la sesión abierta y una sala privada esperando, cerrar Chrome, reabrir ajilei.io (entra directo a la sala), tocar «Compartir» como primer toque y comprobar que sale la hoja de compartir y la pantalla completa; y otra vez al volver de WhatsApp.

**Para MES-PvP**, en cualquier caso: el botón de invitar no deberá pedir la pantalla completa.

## §10 · Anotado para ARN-4

- **El arranque único de la copia antes de las tandas en paralelo.** Una copia nueva tiene la `.vite-copia` vacía, y 11 servidores de dev arrancando a la vez se pisan al optimizar las dependencias (§6: `o1`, `rev` y `menu-movil` en rojo falso). Antes de lanzar una tanda en paralelo, arrancar un servidor solo hasta que cree `deps`.
- **La cobertura de `apu` depende del azar.** La fila de All-in de 360×640 solo aparece si una IA abre por encima de la media apuesta del humano, y en este modo las IA no llevan semilla: en 4 mesas puede no darse, y el veredicto pasa a «cobertura» (código 1) sin ninguna medida roja (§6). Hoy se desempata repitiendo la celda.

## §11 · La opción (b) del rector: la exclusión `data-sin-pantalla-completa` (2026-10-05)

### 11.1 · Lo que pidió el rector

Opción (b), con un ajuste: **el núcleo no nombra botones concretos.** El oyente no pide la pantalla completa si el toque cae dentro de un elemento con el atributo `data-sin-pantalla-completa` (`target.closest`). Ese atributo lo llevan los botones copiar y compartir de `SalaEspera.jsx`, que antes se comprueba que no esté protegido. A la prueba se añade un caso, con su control.

### 11.2 · La regla (para MES-PvP y lo que venga)

> **Todo botón que comparta, copie o abra otra app lleva `data-sin-pantalla-completa`.** Pedir la pantalla completa gasta la activación del toque, y esos botones la necesitan para sí. Su toque no pide; la pantalla completa vuelve con el siguiente toque fuera de la mesa. El atributo vale para el botón y para todo lo que tiene dentro (iconos, textos): la exclusión sube por los padres. El núcleo no conoce botones, solo el selector `SIN_PANTALLA_COMPLETA`.

El botón de invitar de MES-PvP entra por esta regla.

### 11.3 · El cambio

- **M2:** `src/screens/SalaEspera.jsx` no está entre los seis protegidos (§2 de `AJILEI_Protegidos_v1.0.md`).
- **`src/lib/pantallaCompletaCore.js`** (84 → 94 líneas): `SIN_PANTALLA_COMPLETA = '[data-sin-pantalla-completa]'` (`:67`), `excluido(e)` (`:69`), que mira `e.target.closest` y, sin `target` o sin `closest`, no excluye; y `alGesto(e)` (`:75`) pide solo `!dentroMesa && !excluido(e)`. La cabecera nombra la exclusión.
- **`src/screens/SalaEspera.jsx`** (+4 −1): `data-sin-pantalla-completa=""` en `data-accion="copiar"` (`:527`) y en `data-accion="compartir"` (`:537`), con un comentario de dos líneas. Nada más.
- **`src/lib/pantallaCompletaCore.test.js`** (194 → 228 líneas): el doble de `despacha` pasa un evento con un nodo que tiene un `closest` de verdad sobre su cadena de padres (y que solo acepta el selector del núcleo). **Caso 10:** un toque sobre el botón marcado no pide; tampoco un toque sobre un nodo dos niveles dentro de él; el siguiente toque normal sí pide; y sin `target` (o con un evento vacío) se pide como siempre.

### 11.4 · Controles y validación

| Comprobación | Resultado |
|---|---|
| vitest en el repo | **1 322/1 322** (+1) |
| eslint | **21** (idénticos) |
| `npm run build` | limpio; el aviso de siempre. `index` 528,06 → 528,20 kB; `GameTable` 116,01 kB. En el bundle: `"data-sin-pantalla-completa":""` en `copiar` y en `compartir`, y el selector en el núcleo |
| **Control E** (copia `pk`): `alGesto` sin `!excluido(e)` | **rojo**: caso 10 («expected … to not be called at all, but actually been called 1 times»). Restaurado y comparado byte a byte; `pk` 1 322/1 322 |
| `diagSAL sal` (copia `p1`, caché caliente) | **verde**, 102 contextos, 101 s |
| `diagDSK lob` (copia `p1`) | **verde**, 15 s |

**De punta a punta, en la sala real** (sonda de scratchpad sobre `p1`, `?sal=espera-anfitrion`, que abre la sala de espera sin tocar nada: el camino 1 de §9; 360×640 táctil):

| Toque | Pide | `isActive` en el `click` | Pantalla completa |
|---|---|---|---|
| «Compartir» como primer toque de la app | **no** | `true` | no |
| copiar | **no** | `true` | no |
| el icono dentro de «Compartir» | **no** | `true` | no |
| en la sala, contexto limpio: primer toque normal (cabecera) | sí | `true` | **entra** |
| en el lobby, contexto limpio: primer toque normal | sí | `true` | **entra** |

**Lo que apareció, y su explicación medida.** En la misma página, después de tocar «Compartir», los toques normales piden y Chrome **rechaza** con `TypeError: not granted`. Aislado:

1. **No es el portapapeles.** Tras copiar (con o sin el permiso de portapapeles concedido), el siguiente toque normal entra.
2. **Es la hoja de compartir abierta.** En `http://localhost` (un contexto seguro), el Chromium de Windows **tiene** `navigator.share`; la sala lo llama con la activación intacta, y en un navegador sin cabeza la hoja no se cierra nunca: la promesa no se resuelve ni se rechaza en 3,8 s. **Sin la app**, en una página propia del mismo origen, un `navigator.share` pendiente basta para que `requestFullscreen` se rechace con «not granted»; sin él, entra. Es Chrome negando la pantalla completa mientras su hoja de compartir está abierta, no la exclusión.
3. **Sin la exclusión** (el atributo quitado en la página), la pantalla completa entra en el `pointerup` y `share` también recibe la activación en el `click` (el `touchend` la devuelve, §9). En el emulador, los dos órdenes funcionan. La exclusión es la regla del rector, no un arreglo que el emulador exija.

En el teléfono, la hoja se cierra (se comparte o se cancela) y la promesa se resuelve. Lo que pase al volver (que el siguiente toque normal vuelva a pedir y entre) **solo lo dice el S25.**

**V11 para el S25**, actualizada:

| # | Prueba | Lo esperado |
|---|---|---|
| V11 | Con la sesión abierta y una sala privada esperando: cerrar Chrome y reabrir ajilei.io (entra directo a la sala); tocar «Compartir» como primer toque; compartir por WhatsApp y volver; tocar fuera de los botones | sale la hoja de compartir **sin** pantalla completa; al volver, el toque fuera de los botones **entra** en pantalla completa. Y lo mismo con copiar (el código queda copiado y no entra hasta el toque siguiente) |

### 11.5 · Trampa de esta vuelta

- **La API de compartir depende del contexto seguro.** Una sonda con `page.setContent` sobre `about:blank` no tiene `navigator.share`; una servida desde `http://localhost`, sí. Una sonda que dice «sin API» no prueba nada sobre la app.

### 11.6 · El mapa, actualizado

| # | Commit | Archivos | Conteo |
|---|---|---|---|
| 1 | `PAN-1c: pantalla completa` | `src/lib/pantallaCompletaCore.js` (A) · `src/lib/pantallaCompletaCore.test.js` (A) · `src/App.jsx` (M) · `src/components/GameTable.jsx` (M) · `src/screens/SalaEspera.jsx` (M) · `public/manifest.webmanifest` (M) | 6 archivos: +94 · +228 · +17 · +8 −1 · +4 −1 · +1 −1 |

Este informe sigue fuera del commit 1 (va con el cierre de la 1d). Fuera: `laminas/pan1/`, los cinco residuos y nada más. En `git add`, solo rutas explícitas. Tras el «OK mapa», el commit se comprueba en una copia nueva (`git archive` del SHA, con `.env.local` y los volcados; vitest verde) y Victor hace el push. La validación del S25 pasa a ser **V1–V11**.

### 11.7 · Cierre de esta vuelta

- **`node` vivos:** ninguno. **Puertos 4170–5599:** solo `0.0.0.0:5040` (PID 7724, `svchost`).
- **Copias `p1` y `pk`:** las 151 uniones de cada una, vueltas a crear para esta vuelta y quitadas otra vez con `[System.IO.Directory]::Delete(…, $false)`.
- **`node_modules` del repo:** intacto (154 entradas). **`.vite` del repo:** contra la foto de la §1, solo cambia `results.json` (los vitest del repo). `deps` intacto.
- **`git status`:** `App.jsx`, `GameTable.jsx`, `SalaEspera.jsx` y el manifiesto modificados; el núcleo, su prueba y este informe sin rastrear; los cinco residuos y `laminas/pan1/` fuera. HEAD en `651c212`. Sin `git add`.

De vuelta en el STOP del Paso 5. El rector dio el «OK mapa» de §11.6.

### 11.8 · El commit y su comprobación

- **`77e880b` `PAN-1c: pantalla completa`:** las seis rutas de §11.6, con rutas explícitas (6 archivos, +352 −3).
- **Comprobado en una copia nueva** (`k3`: `git archive 77e880b`, 151 uniones, `cacheDir: '.vite-copia'` antes del primer arranque, `.env.local` y los 75 volcados): **vitest 1 322/1 322**, sin saltadas; los 10 casos del núcleo, verdes. Uniones quitadas después; ningún `node` vivo.
- **Publicado por Victor el 2026-10-05:** `651c212..77e880b`; `HEAD`, `origin/main` y el remoto = `77e880b542d798b7f4514bb2fe956b067c79ab51`. Después, la validación del S25 (V1–V11); la 1d no empieza hasta que la reporte.
