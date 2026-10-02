# AJILEI · ARN-3 · Higiene del arnés · Fase 0 · Informe v1.0

**Fecha:** 2026-10-01
**Ficha:** `AJILEI_ARN-3_Fase0_v1.0.md`
**Punto de partida:** `main` en `67175f7` (VOZ-2e). El árbol solo tiene los seis residuos conocidos.
**Instrumento:** Edge **154.0.4258.48** del sistema (las baselines de DSK dicen 151.0.4129.93) · `playwright-core` 1.62.1 · para B2, el Chromium de esa versión de Playwright, **151.0.7922.34**, instalado fuera del repo en `%LOCALAPPDATA%\ms-playwright`.
**Dónde se midió:** en una copia `git archive HEAD` dentro del scratchpad, con una unión a `node_modules`, el `.env.local` copiado y sus propios servidores: dev con bypass en 5173, dev sin bypass en 5174 y `vite preview` en **4183** (el 4173 estaba ocupado, ver H-8). B11 se midió en una segunda copia. Las capturas y los JSON del arnés quedaron en esas copias, no en el repo.
**Reloj:** de 19:01 a 20:00: **59 min**, dentro del tope de 120. Nada quedó pendiente por falta de tiempo.
**Escrituras en el repo:** solo este informe. Sin commits.

## Resumen

| Pregunta | Respuesta |
|---|---|
| ¿Cómo está el arnés hoy? | Se corrieron una vez los **43 modos permanentes** (33 de `diagDSK`; `todo`, `cap` y `voz2` de `diagPUE`; `sal` de `diagSAL`; los 2 de `diagCEL0`; `build`, `vitest`, `eslint` y `banco:verificar`). Resultado: **26 verdes** · **5 informativos** sin veredicto · **2 con su rojo conocido** (`diagPUE todo` por `1.8b`, `u1` por `hits 0/8`) · **9 rojos** (`vitest` en copia limpia; `h1`, `tapetes` y `vuelo` por instrumento; `a2`, `z1`, `rec`, `apu` y `cel_celebracion` intermitentes) · **1 roto** (`m1`). Los rojos **nuevos** son de instrumento, no de producto: ver §A2 y §C3 |
| Un rojo no significa lo que dice | **Ningún arnés devuelve código de salida ≠ 0 al salir rojo.** `diagDSK m1` abortó en la segunda de sus 16 celdas, `tapetes` salió ROJO y `cel_celebracion` sacó 6 fallos: los tres terminaron con código **0** (H-2) |
| B2 · ¿Mueve Edge 154 las baselines? | **No.** Edge 154 y el Chromium 151 de Playwright dan **las mismas cifras al centésimo**: `o2` 515 números con 0 diferencias, `o1` 726 y `u1` 210 sin una sola diferencia geométrica, y 20 anchos de texto con Δ 0. **Recomendación: fijar el navegador (camino b).** Las cifras no cambian, pero se quita la variable |
| B4 · Los dos intermitentes | **`a1`: 3 de 42 corridas, causa encontrada.** Dos IAs quiebran al empezar la tercera mano, la mesa se reacomoda de 5 a 3 vivos y el abanico centrado se corre 36,83 px. Es el producto haciendo lo correcto. `a1` lo cuenta como rojo porque supone que la mesa no cambia. **No es un fotograma suelto**: son 54 de 262. **`a2`: 0 de 20 a solas**; en la matriz completa salió 1 rojo, pero por otra puerta (`SINCERRAR`) |
| B5 · `f1` | El punto ciego no se arregla con una línea. Hay una familia de bucles de autojuego que no conocen cuatro estados de APU-1 y REC-1. **`m1` ya se rompió por esto hoy** |
| B11 · ¿Baja `1.8b` de 200 con la mesa diferida? | **Sí: de 222,0 a 168,8 KiB** (medido dos veces con la vara real, idéntico), con 31 KiB de margen. Difiriendo además lobby, salas, retos, PvP y bautizo: **149,4 KiB** |
| B9 · El aviso `inert` | No solo ensucia la consola: **`inert=""` no hace nada en React 19.** La hoja ⚙ cerrada **no lleva el atributo**. Lo que la saca del tabulador es `visibility: hidden`. Arreglo: `inert: true`, en un archivo que no es protegido |
| Triaje | De los 12 pendientes: **8 arreglar** (B2, B3, B4, B5, B7, B8, B9, B11), **3 retirar** (B6, B10 y 16 de los 21 verificadores de B1), **1 fusionar** (B12 se escribe al final, sobre puertas ya sanas). B1 se reparte entre *retirar* y *fusionar*. **Aplazado:** solo los generadores de assets en B2 |

---

## §A · Inventario del instrumento

### A1 · Mapa del arnés

No existe una «corrida completa» de todo el arnés: cada script tiene la suya y ninguna llama a las demás. Las duraciones son de esta corrida, con hasta 7 modos en paralelo. La CPU no pasó del **1 %**, porque los modos se pasan casi todo el tiempo esperando.

| Script · modo | Servidor | Por qué ese servidor | Duración | ¿Corrida completa? |
|---|---|---|---|---|
| `diagDSK d1d2` · `d3` · `bug` · `shots` | 5173 con bypass | necesita saltarse la Portada para llegar a la mesa | 73 s · 11 s · 73 s · 12 s | sí, en `all` |
| `diagDSK lob` · `retar` | 5173 con bypass | ídem (lobby y retos tras el login) | 17 s · 24 s | sí, en `all` |
| `diagDSK apu` | 5173 con bypass | ídem, y los moldes `?apu=` solo existen en DEV | 2 382 s | sí, en `all` |
| `diagDSK gate` · `b1` · `tactil` · `p1` · `p2` | 5173 con bypass | ídem | 7 s · 11 s · 558 s · 148 s · 123 s | no, por su nombre |
| `diagDSK r1` · `r2` · `o1` · `o2` · `h1` | 5173 con bypass | ídem; `o1`/`o2` llevan además línea base de píxel absoluto (APU-1 §6.2) | 502 s · 607 s · 383 s · 16 s · 1 782 s | no |
| `diagDSK m1` · `a1` · `f1` · `z1` · `a2` | 5173 con bypass | ídem; `a1`/`a2` llevan línea base de píxel | 330 s (abortó) · 1 710 s · 1 019 s · 788 s · 770 s | no |
| `diagDSK u1` · `menu-movil` · `u2` · `u3` · `vc` | 5173 con bypass | ídem; `u1` lleva línea base de píxel | 876 s · 473 s · 224 s · 439 s · 404 s | no |
| `diagDSK msg` · `tapetes` · `vuelo` | 5173 con bypass | ídem | 1 099 s · 190 s · 880 s | no |
| `diagDSK luz` · `rev` | 5173 **y** 5174 sin bypass | la puerta de fugas mide la Portada, que con bypass no existe | 658 s · 229 s | no |
| `diagDSK rec` | 5173 con bypass | `?apu=` solo existe en DEV | 880 s | no |
| `diagPUE` (`todo`: `puerta`, 1.1–1.9, 2.4, 2.5, `mon`, `dis`, `bie`) | 4173 (`PUE_BASE`) | la Portada solo existe sin bypass; `1.8` pesa el bundle real | 276 s | es la suya |
| `diagPUE cap` | 4173 | maestras contra el bundle real, sesión simulada | 156 s | no, por su nombre |
| `diagPUE voz2` | 4173 **y** 5173 (`VOZ2_DEV`) | `voz2.burbuja` necesita `?apu=` | 586 s | no, por su nombre |
| `diagSAL sal` | 5173 con bypass | los fixtures `?sal=` son solo DEV (§8.2 de SAL-B1) | 102 s | es la suya |
| `diagCEL0` (`diagnostico`) · `celebracion` | **5173 clavado** en el código (`diagCEL0.mjs:30`, sin variable) | moldes `?cel` solo DEV | 30 s · 266–314 s | `diagnostico` por defecto, `celebracion` por su nombre |
| `vitest` (40 archivos, 1 089 pruebas) | — | — | 3 s | `npm test` |
| `eslint` | — | — | 6 s | `npm run lint` |
| `banco:verificar` (75 formas, 87 celdas) | — | — | 577 s | `npm run banco:verificar` |

Además hay **21 verificadores de un solo uso**, todos rotos: ver B1.

### A2 · Corrida de estado (la foto de partida)

Una corrida por modo. **ROTO** significa que el modo no terminó su matriz. Los modos sin veredicto propio son informativos: miden y vuelcan, pero no deciden.

| Modo | Estado | Detalle |
|---|---|---|
| `build` | verde | un chunk JS de 641 KB (187,8 KiB gz), con el aviso de chunks de Vite |
| `vitest` | **rojo** en copia limpia | 1 088/1 089. El único rojo es B7. Con los volcados copiados da 1 089/1 089 |
| `eslint` | igual que la línea base | 21 (20 errores + 1 aviso) |
| `banco:verificar` | verde | 87/87 celdas comparadas, 0 rojas, 0 de otra entrada, 0 de otro motor (con los volcados copiados a la copia) |
| `diagPUE` `todo` | rojo conocido + 1 intermitente | 193 verdes. Rojos: `1.8b` 222,0 KiB (conocido) y `dis.relevo` S25 WebKit 2 508 ms frente a ≤ 2 500 (H-6) |
| `diagPUE cap` | verde | 31/31 |
| `diagPUE voz2` | verde | 222/222, burbuja incluida |
| `diagSAL sal` | verde | 102/102 |
| `diagCEL0 diagnostico` | verde | 16/16 |
| `diagCEL0 celebracion` | **rojo** | los 5 conocidos de CEL-2c (2 800 frente a 2 933 ms) **más uno nuevo y distinto en cada corrida** (H-5) |
| `diagDSK lob` · `retar` | verde | 6/6 · 6/6 |
| `diagDSK gate` | verde | `matrixOk` |
| `diagDSK p1` · `p2` | verde | 16/16 y 16/16 en todos sus booleanos. No emiten `passed` |
| `diagDSK tactil` | verde | 16/16 (`allInteractiveOk`), 339 comprobaciones sin un `ok:false` |
| `diagDSK r1` · `r2` | verde | 12/12 · 12/12 |
| `diagDSK o1` · `o2` | verde | 16/16 · 15/15 |
| `diagDSK a2` | **rojo** | 19/20. T4 1920×937 `SINCERRAR`. A solas, 20/20 (B4) |
| `diagDSK a1` | verde | 16/16 en la matriz completa. En T3 1920×937 el origen está en (692,5; 581,5): la cifra a la que «salta» la mesa de 5 reducida a 3 (B4). Repetido a solas, 2 rojos en 20 en T5 1920×937 |
| `diagDSK m1` | **ROTO** | abortó tras la 1.ª celda: `getBoundingClientRect` de `null` en `diagDSK.mjs:4648` (H-1) |
| `diagDSK h1` | **rojo, 0/16** | cae `cycleStable` en las 16 celdas: el peor es `num`/`chips`, 10,19 px en `h0t0`, el ancho de un dígito, cuando la pila pasa de «1000» a «950». Es instrumento (H-14) |
| `diagDSK f1` | verde | 16/16 (la recarga no apareció: ver B5) |
| `diagDSK z1` | **rojo intermitente** | 15/16: T5 1280×720, el sobrevuelo no escaló dos cartas de `opp-side-right` (`escala=1`, `coreo=n/a`). A solas, 3/3 verdes con `coreo=completa` (H-4) |
| `diagDSK u1` | rojo conocido | 20/20 de geometría; la sub-pasada táctil sigue en `hits 0/8` (`.util-item-tapetes` 63×35 < 44). Es el pendiente de APU-1 §5 |
| `diagDSK menu-movil` · `u2` · `u3` · `vc` | verde | 18/18 · 21/21 · 21/21 · 21/21 |
| `diagDSK msg` | verde | compositor 92 casos · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 |
| `diagDSK tapetes` | **rojo** | compra 0/2: el arnés espera el literal «fichas» y el producto dice «Heptacoins» desde REN-1 (H-3) |
| `diagDSK vuelo` | **rojo** (2 de 2 corridas) | 1/2 escenarios: el humano abortó con «3 manos sin cerrar» en la mano 7 y en la 8, de 40 posibles. Es la familia de B5 (H-13). El escenario de la IA, verde |
| `diagDSK luz` · `rev` | verde | 20 celdas + 4 tapetes · 10 celdas |
| `diagDSK rec` | **rojo intermitente** | `p7` en `forzosa-s25v`: `destapa.caso = false`, porque no había rival con cartas tapadas. A solas, verde 2 de 2 (H-4) |
| `diagDSK apu` | **rojo intermitente** | REC-2 18/18 · mesa de APU-1 6/7: 360×640 cae en `apu.7` (tras pulsar All-in, la mano no llega al pago en 30 s) y en `tel.linea` (H-12). La misma celda a solas: una vez verde y otra roja por `apu.2`, `apu.7` y `tel.boton4`. **2 rojos en 3 corridas, cada vez por puertas distintas** |
| `diagDSK d1d2` · `d3` · `bug` · `shots` · `b1` | informativos | sin veredicto |

### A3 · Navegador

| Quién | Navegador | Versión hoy |
|---|---|---|
| `diagDSK`, `diagPUE`, `diagSAL`, `diagCEL0`, `_vc2audio` | Edge del sistema (`channel: 'msedge'`) | 154.0.4258.48 |
| `diagPUE dis` (la mitad WebKit) | WebKit **de Playwright** (`webkit-2336`): ya está fijado, sin que nadie lo llamara así | el de Playwright 1.62.1 |
| Generadores: `gen-icons`, `gen-portada-assets`, `idx/idxNavegador`, `dis1/contrato_lamina` | Edge del sistema | 154.0.4258.48 |

Qué compara contra una baseline con versión anotada:

- `diagDSK` (`ARNES.chromiumBaselines = '151.0.4129.93'`, `diagDSK.mjs:365`) avisa en cada corrida con `⚠ AVISO: baselines tomadas con 151…`, pero **no compara nada contra esa versión**: solo la escribe. Las líneas base absolutas de píxel son las de `o1`, `o2`, `a1` (`A1_PRE`), `a2`, `u1` y `m1` (`M1_PRE`).
- `maestras/portada/cap.json` y `maestras/dis1/contrato.json` anotan `edge: 154.0.4258.37`. Son trazas, no puertas.
- `diagSAL` solo escribe la versión en su JSON.

---

## §B · Los doce pendientes

### Grupo 1 · El instrumento

#### B1 · Los verificadores rotos tras APU-1

**Reproducción.** Los 21 corrieron contra 5173 con bypass y los 21 terminan con código 1 a los 31 s:
- 19 se quedan esperando `button:has-text("Jugar vs IA")`, que la ruta de NIV-UI/APU-1 ya no tiene;
- `verifyEMB1` y `verifyIDN1` se quedan esperando `.welcome-title`, la Bienvenida vieja que retiró LOB-1.

**Causa.** Los tres clics de la ruta vieja están escritos a mano en cada uno. `rutaMesa.mjs` existe desde APU-1 1e y solo lo usan `diagDSK` y `diagCEL0`.

| Verificador | Qué vigilaba | ¿Sigue siendo regla? ¿Quién la vigila hoy? | Etiqueta |
|---|---|---|---|
| `verifyC43` | pulso y «+N» del pozo sin desplazar nada | sí · `o2` (el «+N» volador entra en su escape) y `msg` | **retirar** |
| `verifyC431` | rótulo de la IA al doble y reseteo en mano nueva | sí · `p1`/`h1` (cabecera de la IA, O1) | **retirar** |
| `verifyC44` | las 4 mesas renderizan; chip de comodín | sí · `d3`/`gate`/`o2` y `testEliminations` (comodín) | **retirar** |
| `verifyC441` | el ante se ve descontado antes de barajar | **dudoso tras APU-1**: el dinero cambió de forma (pregunta 2) | **fusionar** con `apu` si sigue siendo regla |
| `verifyC441b` | ninguna IA «pensando…» con su panel en «Se retiró» (turno fantasma) | **sí, y nadie la vigila**: 0 apariciones de «Se retiró» en `diagDSK` | **fusionar**: invariante por fotograma en el bucle común de B5 |
| `verifyC45`, `C45a`, `C45b`, `verifyShrink` | la ceremonia de encogimiento por quiebra de IA, jugada | sí · el motor lo vigila `testEliminations`; la pantalla, **nadie en vivo** (`o1`/`o2` solo inyectan el aviso) | **retirar** los cuatro; la vigilancia viva queda **fusionada** con B4 (la sonda de hoy la ha visto: es la mesa que se reduce) |
| `verifyC45c` | aviso de eliminación horizontal | sí · `o1` y `o2` (aviso inyectado con nombres de 12ch) | **retirar** |
| `verifyEMB1` · `verifyIDN1` | Δ = 0 de una capa, contra un stash | no: eran comparaciones antes/después de un solo uso; `evidencia/` quedó sellada | **retirar** |
| `verifyGameOver` | la vista GAME_OVER | sí · `vc` (la construye) y `testEliminations` | **retirar** |
| `verifyViewport` | la mesa cabe sin scroll a 1920×1080 | sí · `b1`/`d3`/`o2` (overflow y scroll) | **retirar** |
| `verifyREN1` | ¿desborda «Heptacoins» alguna caja? | sí · VOZ-2 vio C-2 por esta vía; `voz2` y `msg` la cubren solo en el óvalo | **fusionar** en `msg` (barrido de cajas con «Heptacoins») |
| `verifyMesa5`, `shotFloat`, `shotStatus`, `measurePanel`, `_sh1probe` | sondas y capturas sin veredicto | — | **retirar** |
| `_cel1bFila` | sonda de CEL-1b | — (además, sin seguimiento: es uno de los seis residuos) | **retirar** (lo borra Victor) |

**Costo:** retirar 16 → 10 min. Fusionar `C441b` y `REN1` → 45 min. `C441` → 0 min hasta que el rector responda.
**Riesgo:** bajo. Ninguno entra en una vara de cierre.

#### B2 · La deriva del navegador

**Medido** (Edge 154.0.4258.48 frente a Chromium 151.0.7922.34, el mismo arnés con solo el canal cambiado, en una copia):

| Comparación | Números | Diferencias |
|---|---|---|
| `o2` completo (15 celdas, peor caso construido) | 515 | **0** |
| `o1` mesa 5 · 1920×937 | 726 | 5, todas en el **texto** de la secuencia jugada (el azar del reparto); 0 geométricas |
| `u1` mesa 5 · 1920×937 | 210 | 1: qué panel ganó la mano (azar); 0 geométricas |
| `a2` T4 1920×937 (3 corridas en Chromium frente a 20 en Edge) | línea entera | idéntica al centésimo (`sim 192.67/192.69`, `vuelo 748.48≤766.5`, `respiro 16/16`) |
| `a1` T5 1920×937 (2 frente a 20) | línea entera | idéntica |
| Anchos de texto, Arial, 5 cadenas × 4 tamaños, en negrita con tracking | 20 | **Δmáx 0** (p. ej., «ALL-IN» a 13 px = 47,28125 en los dos) |

**Cuántas baselines cambian con 154:** ninguna en lo medido. Las de `o1`, `o2`, `u1` y `a2` dan verde en Edge 154 en la corrida de estado. `a1` sale 16/16 en la matriz, y su rojo intermitente es B4, no deriva. `m1` no se pudo comparar porque abortó (H-1).

**Los dos caminos:**
- **(a) Volver a sellar con 154.** Cero trabajo hoy, porque no hay nada que re-sellar: solo cambiaría la etiqueta. Pero la pregunta volverá con cada actualización de Edge: E-30 en APU-1 y dos veces durante VOZ-2.
- **(b) Fijar el navegador** con el Chromium de Playwright.
  - **La dependencia ya está.** `playwright-core` va fijado exacto a 1.62.1 en `package.json`, y esa versión trae Chromium **151.0.7922.34**.
  - **Descarga:** `node node_modules/playwright-core/cli.js install chromium` dejó **428 MB** (`chromium-1234`) más **272 MB** de *headless shell*. El *headless shell* no hace falta con `channel: 'chromium'`, y la opción `--no-shell` lo evita.
  - **Código:** un ayudante `navegadorArnes()` en un módulo común, que lea `ARNES_CANAL` (por defecto `chromium`; `msedge` para la pasada de contraste), en los cuatro arneses. `ARNES.chromiumBaselines` pasa a decir `chromium 151.0.7922.34 (playwright-core 1.62.1)`. Las cifras **no** se re-sellan: son las mismas.
  - **Las medidas no difieren** de las de Edge 154 en nada de lo medido.

**Recomendación: (b).** Hoy Edge no movió nada, pero cada actualización obliga a demostrarlo otra vez. Con el navegador fijado, solo cambia cuando alguien sube `playwright-core`, y ese commit lleva su corrida de re-sello. La WebKit de `dis` ya funciona así.

**Riesgo:** el Chromium fijo no es el navegador de Victor. Se mitiga con una pasada `ARNES_CANAL=msedge` al cierre de cada campaña (es justo la tabla de arriba) y con las validaciones físicas, que no cambian.

**Aplazado:** los **generadores** (`gen-icons`, `gen-portada-assets`, `idx`, `contrato_lamina`) siguen en Edge. Cambiarles el navegador puede mover bytes de assets sellados, e IDX-1 ya vio texto de lienzo no determinista por GPU. Dueño: la próxima campaña que regenere assets.

**Costo:** 45 min. **Etiqueta: arreglar.**

#### B3 · `msg` y `lob`, del 5173 al 4173

**Qué haría falta:**
- **`lob`:** no usa nada que solo exista en DEV, solo el bypass para saltarse la Portada. `contextoCap(browser, vista, base)` (`scripts/cap/capMesa.mjs:117`) ya acepta una vista arbitraria `{ w, h, dpr, movil }`, así que los seis viewports de `lob` entran tal cual. AJF-1 ya midió el lobby así.
- **`msg`:** llega a la mesa con `gotoMesa`, y la ruta (`irALaMesa`) funciona en 4173 con `contextoCap`, como hizo VOZ-2.
- **Trampa:** `contextoCap` **siembra `Math.random` con una semilla fija** (`SEMILLA_CAP = 5`, `capMesa.mjs:99-108`). `msg` jugaría siempre la misma mano. Hay que parametrizar la semilla, o pasar una lista de semillas.

**Qué se gana:**
1. Se mide el bundle real.
2. **Se deja de hablar con el Supabase real.** Medido hoy: una carga pelada de 5173 hace un `401` y deja `SAL-A: error inesperado de la base — 42501 permission denied for function mi_sala` en la consola (H-7). `contextoCap` da 0 peticiones fuera.
3. No se depende del `.env.local` de la máquina.
4. **`msg` se vuelve reproducible por semilla.** Es justo lo que le falta a E-22, su rojo intermitente de 1 de cada 4 en mesa 5 a 1366×768.

**Confirmado que se quedan en 5173:** `rec` y `voz2.burbuja`. `?apu=` cuelga de `import.meta.env.DEV` (`src/dev/siembraAPU.js:46,67,84`), y la cadena `apu=` no aparece ni una vez en el JS de `dist/`. No se propone moverlos.

**Costo:** `lob` 30 min, `msg` 60 min. **Riesgo:** medio en `msg`, porque cambia la población de manos que ve (por eso la lista de semillas). **Etiqueta: arreglar.**

#### B4 · Los dos intermitentes

**`a1` · el «fotograma suelto» de 36,83 px en T5 1920×937.**
- **Frecuencia: 3 de 42 corridas (7 %).** 2 de 20 con el arnés tal cual, 0 de 10 y 1 de 12 con la sonda. Los tres rojos dan la **misma cifra exacta**, 36,83 px, y los dos del arnés tal cual caen en el **mismo fotograma**, `h2t14`, que el del cierre de APU-1.
- **Causa, medida con una sonda** (copia del arnés en el scratchpad que vuelca cada fotograma desplazado):

  | Fotograma | Paneles rival | En `.opp-eliminating` | Fila del humano | Mano del humano | `card1.x` |
  |---|---|---|---|---|---|
  | `h2t10` | 4 | **2** | 994 px | 1 032 px | 655,67 |
  | `h2t12` … `h2-post` | **2** | 0 | 770 px | 808 px | **692,50** (+36,83) |

  Dos IAs quiebran al empezar la tercera mano. La ceremonia C4.5 corre y la mesa se reacomoda de 5 a 3 vivos (C4.4). El grupo del humano, centrado desde A2, se recoloca. **Es comportamiento correcto del producto.** `a1` da por hecho que la mesa sigue siendo de 5 durante las tres manos.
- **No es un fotograma:** son **54 de 262**, de `h2t12` hasta el final. `worstOf` guarda solo el máximo y el primer fotograma que lo alcanza. De ahí salió el «en un único frame… y volvieron» del cierre de APU-1, que era una inferencia y no una medida.
- **Por qué ahora:** las pilas cortas de APU-1 hacen probable una quiebra de IA en tres manos.
- **Propuesta:** el bucle común de B5 detecta el cambio de vivos (número de `.opp-panel` o `aliveCount`). Desde ese fotograma marca `mesaReducida`, igual que `ausente`, y lo cuenta aparte. La otra vía es sembrar el reparto (`contextoCap`) con una semilla sin quiebras.
- **Etiqueta: arreglar** (fusionado con B5). **Costo:** 30 min. **Riesgo:** bajo.

**`a2` · los vuelos en T4 1920×937.**
- **Frecuencia a solas: 0 de 20**, siempre `vuelo 748.48≤766.5`, el mismo valor que en Chromium. El 773,48 de APU-1 (+25 px) no apareció en 21 corridas, y eso no significa que no exista.
- **Hipótesis:** el mismo mecanismo que `a1`. Una mesa de 4 reducida cambia la zona del humano y la caja de los vuelos. No está demostrado.
- **En la matriz completa la misma celda salió roja por otra puerta:** `banda 0f (1m/0c/SINCERRAR)`. La mano no cerró, y `respiro`, `bandaSitio` y `cicloVisibility` caen en cascada.
  - **Causa posible, no demostrada.** Los bucles de `a1`/`a2`/`f1`/`m1` solo pulsan Pasar, Igualar y Apostar. Cuando la pila no llega, la fila de APU-1 es «All-in (X)» y «Retirarse» (`GameTable.jsx:2367-2369`). El humano espera entonces los 20 s del reloj, que lo retira (`GameTable.jsx:792-794`), y una mano con varias de esas esperas puede pasar de los 240 ticks.
  - **El arnés no dice por qué no cerró** (D4).
- **Propuesta:** dentro del bucle común de B5, pulsar All-in/Retirarse y, en `SINCERRAR`, volcar los botones de los últimos fotogramas.
- **Etiqueta: arreglar** (fusionado con B5).

#### B5 · El punto ciego gemelo de `f1`

**Qué no ve `f1`.**
- Su bucle (`diagDSK.mjs:5165-5186`) solo espera «Siguiente mano».
- Desde APU-1, ese botón **no se monta** mientras hay recarga pendiente (`GameTable.jsx:2436`, `… && !recarga`). Desde REC-1, la pregunta llega como burbuja y la tarjeta se abre sola a los 5 s.
- Si la recarga aparece, `f1` muestrea fotogramas con la burbuja o la tarjeta encima y no se entera.
- Si la selección no se alcanzó en la primera mano, la segunda no empieza nunca: `sinCerrar`, `selReached = false`. Es un rojo que se parece al «`selReached` intermitente de `f1`» que DSK tenía en vigilancia. Que sea esa la causa del intermitente viejo es una hipótesis.

**Por qué el remedio no es «una línea»:**
- `contestarRecarga(page)` se llama **solo** en `diagDSK.mjs:4891` (`a1`) y `:5962` (`a2`). El cierre de APU-1 decía cinco modos.
- Ningún bucle de autojuego pulsa «All-in».
- Solo `a1Snap` tolera la mesa ausente.
- Ninguno tolera la mesa reducida (B4).
- La prueba es de hoy: **`m1` se rompió** por la misma avería que tenía `a1` antes de C-0.5 (H-1).

**Cómo se cubriría.** Un único `jugarMano(page, { alMuestrear })` compartido que:
1. conteste la recarga, abriendo la burbuja si hace falta (`abrirRecarga` ya existe, `diagDSK.mjs:1662`);
2. pulse All-in/Retirarse;
3. marque `ausente` y `mesaReducida`;
4. diga por qué no cerró.

Lo consumirían `a1`, `a2`, `f1`, `m1`, `h1`, `o1`, `u1` y `vuelo` (H-13), y los demás bucles hermanos cuando se toquen.

**`f1` hoy:** 16/16 en 1 019 s, sin `sinCerrar` y sin quiebras. La recarga no apareció en ninguna celda, así que el punto ciego no se activó. Eso no demuestra que no exista: depende de cómo caiga el juego, que es exactamente lo que le pasó a `m1` (H-1).

**Etiqueta: arreglar** (absorbe B4 y H-1). **Costo:** 60–90 min. **Riesgo:** medio. Toca los modos con línea base de píxel, así que la tanda tiene que demostrar Δ = 0 en las celdas que hoy dan verde.

#### B6 · La sonda del modal de bancarrota

**Dónde estaba anotada:** REC-1 Fase 0 §J-6 («puede ser inalcanzable… se sugiere una sonda aparte») y el cierre de REC-1 §5 («Una sonda propia»). REC-2 lo dejó «como pendiente, sin borrar».

**Qué debía medir:** si el modal heredado (`GameTable.jsx:2843-2860`) llega a abrirse.

**Respuesta, por construcción y sin sonda:**
- se abre solo si `startHand` devuelve `GAME_OVER` **y** el humano está eliminado **y** `aliveCount ≥ 2` (`GameTable.jsx:1630`);
- el motor solo devuelve `GAME_OVER` con `alive <= 1` (`gameEngine.js:521`), y en ese retorno `aliveCount = alive`;
- las dos condiciones son incompatibles: **el modal es código muerto.**
- La parte del motor ya la sella `testEliminations.test.js:198-205`: humano quebrado con ≥ 2 vivos → `DEAL_2`, no `GAME_OVER`.
- `rec` y `voz2.burbuja` no lo cubren, y no hace falta.

**Etiqueta: retirar** la sonda. Razón: es inalcanzable por construcción y la vigilancia la hereda `testEliminations`. Quitar el modal muerto (el estado en `:370`, la condición en `:2436` y el JSX en `:2843`) sería producto en un archivo no protegido, invisible para el jugador: pregunta 3.

**Costo:** 0 min (sonda) · 15 min (borrado, si se autoriza).

#### B7 · `testBancoBandas` en una copia limpia

**Reproducción:**
- En la copia limpia: **1 088/1 089**. El rojo es «la procedencia coincide con el volcado del que salió cada celda» (`testBancoBandas.test.js:155`, `expected 0 to be greater than 0`).
- Con los 75 volcados de `capturas-dsk/` copiados: **1 089/1 089**.

**Causa:** la prueba filtra las celdas cuyo `origen` existe en disco y exige que haya al menos una. De cada volcado solo lee `configuracion.unit` y `siembra`. Los 75 volcados pesan 2,77 MB y están ignorados.

| Opción | Qué cubre | Qué pierde |
|---|---|---|
| **Índice comprometido** (`scripts/apu1_bandas_origen.json`: `unit`, `siembra` y `sha256` de cada volcado; medido: **75 entradas, 12,4 KB**) | en un clon limpio, que la vara y su índice cuadran; con los volcados presentes, además que cada volcado es el del índice (por `sha256`) y dice lo mismo | en un clon limpio no prueba que el índice salió de los volcados: eso solo lo prueba quien los tenga |
| Generarlo al vuelo | — | **imposible.** Los volcados salieron de un motor que ya no existe (`blobs: null`, el árbol de 1c-2 nunca se commiteó) y de 100 000 manos por celda |
| *Skip* explícito y visible (`it.skipIf(!hayVolcados)` más un aviso en la salida) | honesto según D4 | en un clon limpio no verifica nada |

**Recomendación:** el índice, más un *skip* visible solo de la comprobación por `sha256` cuando falten los volcados.

**Costo:** 20 min. **Riesgo:** bajo. **Etiqueta: arreglar.**

#### B8 · Los servidores que sobreviven

**Cómo arrancan y cierran hoy:** **ningún script arranca ni cierra servidores.** `diagPUE` solo comprueba al empezar que el suyo responde (`diagPUE.mjs:170-181`). Los levanta a mano quien corre el arnés.

**Por qué sobreviven.** Medido en mis tres servidores de hoy, arrancados como en VOZ-2:

```
5173 ← node.exe (vite) ← cmd.exe ← node.exe (npx) ← bash.exe ← bash.exe
```

Cuando la tarea de fondo llega a su tope, se mata el `bash`. Windows no mata a los descendientes, así que el `node` de vite queda huérfano y sigue escuchando.

**Agravante, visto hoy (H-8):** en 4173 había un `vite preview --host` con un túnel `cloudflared` desde las 17:26. Es casi seguro de Victor. **Por el puerto no se distingue de un huérfano.** Una limpieza que matara «lo que haya en 4173» le habría tirado el túnel.

**Propuesta** (`scripts/servidor.mjs` o un preámbulo común):
1. **Al empezar, comprobar el puerto.** Si está ocupado, decir PID y línea de comandos y negarse. No matar nada ajeno.
2. **Arrancar el servidor dentro del proceso del arnés** con la API JS de Vite (`preview()` o `createServer()`), para que muera con él. Si se prefiere un proceso aparte: `node node_modules/vite/bin/vite.js` directo, sin `npx` ni `cmd`, con archivo de PID.
3. **`finally`** más manejadores de `SIGINT`/`SIGTERM` que cierren con `server.close()` o `taskkill /T /F /PID`.
4. **Al terminar, `netstat`** como prueba, igual que este STOP.

**Costo:** 45 min. **Riesgo:** bajo. **Etiqueta: arreglar.**

### Grupo 2 · El producto

#### B9 · El aviso `inert` de React

**Texto exacto** (consola, `error`, en cada carga de 5173):

> Received an empty string for a boolean attribute `inert`. This will treat the attribute as if it were false. Either pass `false` to silence this warning, or pass `true` if you used an empty string in earlier versions of React to indicate this attribute is true.

**De dónde sale:** `src/screens/Lobby.jsx:280`, en la hoja ⚙: `{...(hojaAbierta ? {} : { inert: '', 'aria-hidden': 'true' })}`.

**Causa:** React 19.2 trata `inert` como booleano, y la cadena vacía cuenta como `false`.

**Medido:**
- con la hoja cerrada, `aside.lob-hoja` tiene `hasAttribute('inert') === false` y `aria-hidden="true"`;
- **el `inert` no se aplica**, y la intención del comentario («se retira… del orden de tabulación») no la cumple él;
- la cumple `visibility: hidden` (`lobby.css:637`): 25 tabulaciones recorren el lobby tres veces y no entran nunca en la hoja.
- El aviso solo sale en DEV, pero el atributo también falta en producción.

**Arreglo:** `inert: true`. `Lobby.jsx` **no es protegido**. No cambia nada visible. Durante los 0,2 s de la transición de cierre, la hoja pasaría a ser inerte al instante, que es lo correcto.

**Costo:** 5 min. **Riesgo:** muy bajo. **Etiqueta: arreglar.**

#### B10 · El CSS muerto de `.lob-cta-pvp`

**Confirmado:** `grep` de `lob-cta-pvp` en `src/`, `scripts/` e `index.html` solo encuentra `src/styles/lobby.css`, con **0 consumidores**.

**Son 3 reglas**, más el comentario de AJF-1 en `:502-505`:
- `.lobby .lob-cta-pvp` (`:506`)
- `.lobby .lob-cta-pvp .lob-ico` (`:521`)
- `.lobby .lob-cta-pvp .lob-pastilla` (`:535`)

**Ojo al retirarlas:** la base `.lobby .lob-pastilla` (`:527-534`) **sigue viva** (hoja ⚙ y toast). Solo muere la regla descendiente de `:535`.

**Protegido:** `lobby.css` no lo es.

**Costo:** 5 min. **Riesgo:** nulo. **Etiqueta: retirar.** Razón: sin consumidor desde AJF-1, y el propio comentario lo deja «para otra» tanda.

#### B11 · `1.8b` y la carga diferida de la mesa

**1. Qué mide `1.8b`** (`diagPUE.mjs:1054-1145`):
- arranque en frío a 1920×1080 contra `vite preview`;
- suma los bytes **de cable** de toda petición que empieza antes del **primer pintado con contenido** (FCP);
- «de cable» es gzip nivel 9 sobre el cuerpo, salvo lo que ya nace comprimido (webp, mp3, fuentes), que cuenta tal cual;
- techo de 200 KiB.

Composición del camino crítico hoy (222,0 KiB):

| Recurso | KiB de cable | KiB en crudo |
|---|---|---|
| JS (`index-*.js`, un solo chunk) | **181,3** | 626,3 |
| CSS (`index-*.css`, una sola hoja) | **34,0** | 201,1 |
| documento `/` | 2,1 | 5,2 |
| SVG (icono maestro 1,1 · isotipo 1,5 · reverso 2,0) | 4,6 | 14,9 |
| fuentes | 0 (Arial del sistema) | — |
| raster | 0 (las caras, los aparatos y el póster llegan perezosos, ≥ 2,4 s) | — |

**2. Experimento** (segunda copia; cada variante se compiló y se sirvió aparte, y `1.8b` se midió dos veces con `diagPUE 1.8`, con cifras idénticas):

| Variante (`React.lazy`) | JS crítico | CSS crítico | **`1.8b`** |
|---|---|---|---|
| `base` (HEAD) | 181,3 | 34,0 | **222,0 · rojo** |
| **`GameTable`** | 145,9 | 16,2 | **168,8 · verde** |
| `Lobby` | — | — | 218,5 · rojo |
| todo (`GameTable`, `Lobby`, `RetarIAS`, `SalaOpciones`, `ArmarMesa`, `SalaEspera`, `PartidaPvP`, `Bautizo`) | 133,0 | 9,7 | **149,4 · verde** |

Las variantes que no se pesaron con `1.8b`, con el gzip del chunk principal según Vite (otro compresor, pero los deltas se comparan bien; base = 187,83 JS + 35,16 CSS):

| Variante | Chunk principal | Efecto |
|---|---|---|
| `RetarIAS` | 186,91 | −0,9 |
| salas (las tres) | 183,15 | −4,7 |
| `PartidaPvP` | 188,29 | **+0,5**: el envoltorio pesa más que lo que saca |
| `Bautizo` | — | **ningún efecto**: Vite avisa `INEFFECTIVE_DYNAMIC_IMPORT`, porque `GameTable.jsx:12` lo importa estático |

**El chunk de la mesa** pesa 37,6 KiB de JS y 19,2 de CSS, en gzip, y **no se pide en la Portada**: no aparece en la bitácora.

**3. Riesgos y mitigación:**

| Riesgo | Mitigación |
|---|---|
| Retraso en la primera entrada a la mesa (~57 KiB más) | Precargar con `import('./components/GameTable')` en el mismo efecto que hoy precarga la baraja y los sonidos de mesa (`App.jsx:335-341`). Ese efecto **no corre en la Portada**: lo confirma `1.8c`, sin un solo WebP de la baraja. Cuando el jugador toca «Jugar», el chunk ya está en caché |
| El `fallback` de `Suspense` como parpadeo | Cambiar de pantalla con `startTransition`: React mantiene la pantalla anterior hasta que la mesa está lista y el `fallback` no llega a pintarse. De respaldo, `fallback = <Cargando/>` con la regla D5 de BIE-1 (nada hasta 300 ms) |
| PWA y *service worker* | **No hay *service worker*** (solo `manifest.webmanifest`), así que hoy no hay precacheo que romper. El riesgo real es otro: un **despliegue a mitad de sesión**. `/assets/*` va con hash e `immutable`, y si el chunk viejo ya no se sirve, el `import()` falla. Mitigación: un escuchador de `vite:preloadError` que recargue una vez, más un límite de error alrededor de la mesa |
| El arnés que entra directo a la mesa | En 5173 el `lazy` es un módulo más: sin cambio. En 4173 lo absorbe el `waitForSelector('.game-table')`. Los moldes `?cel`/`?apu` son DEV. `cap` hace una petición local más, y `cap.red` solo cuenta las de fuera |
| El «Cargando» de BIE-1 | Es el estado de autenticación (`App.jsx:339`). El `fallback` debe reutilizar el mismo componente y la misma regla D5, para que no haya dos esperas distintas |

**4. ¿Se baja de 200?** **Sí, con `GameTable` sola: 168,8 KiB y 31 de margen.** No hace falta nada más. Si el rector quiere más margen, la variante «todo» llega a 149,4.

**Costo:** 60 min más la validación física de Victor (la primera entrada a la mesa, sin parpadeo, en el S25 y en el PC). **Riesgo:** medio. Es la única pieza que toca producto (D1). **Etiqueta: arreglar.**

### Grupo 3 · El registro de invariantes (semilla)

#### B12 · Censo de reglas permanentes

**1. Fuentes.** Hay doctrina, normativo y campaña. El recuento se hizo así:
- buscar marcadores (`sellad|nunca|jamás|prohib|siempre|intocable|regla|doctrina|invariante|no se toca|sin excepci`) y filas `D-n`;
- descartar narración y versiones superadas.

| Fuente | Tipo | Reglas permanentes (est.) |
|---|---|---|
| `AJILEI_Protegidos_v1.0.md` (interna v1.5) | doctrina | ~12 |
| `AJILEI_Sistema_Diseno_v1.2.md` (interna v1.3) | doctrina maestra | ~45 |
| `AJILEI_Identidad_A_v1.0/1.1.md` · `AJILEI_Icono_v1.0.md` | doctrina | ~15 · ~8 |
| `AJILEI_Diseno_Landscape_v1.0.md` | doctrina | ~12 |
| `AJILEI_Reglas_Mano_Congeladas_v1.0.md` | doctrina (motor) | ~8 |
| `AJILEI_APU-1_Reglas_v1.3.md` (las anteriores son historia) | normativo | 60–80 |
| `Modos_y_Asistencia` v1.0+v1.1 · `Menu_Utilidades` v1.0→v1.5 · `Victory_Celebration` v1.0+v1.1 · `Tapetes` v1.0→v1.2 | normativo (cadenas de deltas: todas las versiones siguen mandando) | 40–60 · 50–70 · 30–40 · 20–25 |
| `Componente_Fichas`, `Mensajes_Resultado`, `Reveal_Manos`, `SUP-2b_Puerta`, `Fuentes_Audio`, `PUE_Auditoria`, `Plan_Tandas` | normativo menor | ~40 |
| Informes de cierre (APU-1, REC-2, CAP-1, REC-1, SAL-B2…) y los tres de DSK | campaña | 55–95 |

**Total:** unas **400–560 afirmaciones**, que se quedan en **~300–450 reglas únicas (cifra central ~350)** una vez quitadas las repeticiones. Protegidos, O1, el oro único, el CSS aditivo y los dos caminos de render aparecen cada uno en 5 a 15 sitios.

**2. Muestra de diez reglas:**

| # | Regla | Dónde está escrita | Qué la verifica hoy |
|---|---|---|---|
| 1 | El óvalo es intocable | ningún documento dice «intocable». Lo más cercano: `Protegidos:94-97, 171-174` (constantes O1 selladas), `gameTable.css:5474`, `DSK_U2_fase1_reporte.md:204` | `o1`, `o2`, `h1` (mesa 5), `r1`/`r2`, `msg`, `apu` (`solapeOvalo`), `luz`/`rev` (Δ = 0) y `voz2.ovalo`. **Hueco:** `o1`/`o2` solo en escritorio |
| 2 | Los protegidos no cambian | `Protegidos:64-73` (lista), `:109-116` (huellas) | **ninguna.** Se comprueba a mano en los informes de cierre. `bancoNiveles.mjs:1739` calcula el blob de 3 de los 6, pero solo para marcar bandas caducadas |
| 3 | Piso táctil de 40 px | **ningún documento de doctrina**: solo `diagDSK.mjs:3111-3116` («estándar de campaña»), `Menu_Utilidades_v1.2:145` y `APU-1_Reglas_v1.3:217` | `tactil`, `u1` (coarse), `u2`, `menu-movil` (44), `diagSAL` p4, `lob` (44), `apu` y `retar` |
| 4 | Un solo oro | `Identidad_A_v1.1:71`, `Sistema_Diseno:7, 42, 90, 149` | parcial y por zonas: `testIdxCore:47`, `diagPUE 2.5j` y `tapetes` (contraste del tricolor). **Ninguna puerta cuenta oros por pantalla** |
| 5 | CSS aditivo sin `!important` | `Protegidos:50-51`, `SUP-2b:12` y cabeceras de `rec.css`, `rev.css`, `salas.css` y `menuMovil.css` | **ninguna.** `eslint` no mira CSS. Hoy los únicos `!important` de `src/` son los tres documentados de `playingCard.css:24-26` (comprobado) |
| 6 | «Siguiente mano» siempre tocable | `VOZ-2_Fase1:18, 192`, `Victory_Celebration_v1.0:317-319`. **No es absoluta:** `APU-1_Reglas_v1.3:186, 212, 224` deja que la recarga la bloquee | `voz2.capa(a)`, `voz2.siguiente` y su control negativo. `apu` comprueba el caso contrario (ausente durante la recarga) |
| 7 | Los dos caminos de render del rival | `Sistema_Diseno:179-201`, `GameTable.jsx:95` | `tapetes` (mesas 5 y 2), `p1`, `h1`, `apu`, REC-2 y `msg`. **Ninguna puerta afirma la matriz de enrutado** (qué rama se monta en cada orientación) |
| 8 | Pastilla TURNO sin salto (O1) | la ley general en `Sistema_Diseno:73`; TURNO **solo en código** (`GameTable.jsx:2278-2285`, `OpponentPanel.jsx:89-93`) | `p1` (`noShift`) y `h1`. **Solo en escritorio** |
| 9 | Anclaje óptico del isotipo | `Icono_v1.0:33-49` («PROHIBIDO corregir al centro geométrico») | **ninguna.** `lob.5` solo mira la proporción 2:3 y el `src` |
| 10 | Sin `localStorage` donde no toca | `Tapetes_v1.0:52-53`, `Victory_Celebration_v1.0:309-311`, censo de claves en `LOB1_Fase0:302` | parcial: `testTapetes` (`:59`, `:190-201`, `:222`, `:266`) y `puerta.0`. **Ninguna puerta global** del censo de claves |

**Hoy:** 3 tienen puerta directa (3, 6 y 7), 4 tienen cobertura parcial (1, 4, 8 y 10) y 3 no tienen ninguna (2, 5 y 9).

**Antes de escribir el registro conviene saber:**
- dos reglas viven **solo en código**: O1/TURNO y el piso de 40 px;
- `Sistema_Diseno_v1.2.md:13` («nunca… bajo ninguna circunstancia» para el motor) **contradice** la §7 de Protegidos, que documenta aperturas autorizadas;
- `Diseno_Landscape_v1.0.md:15` todavía lista 3 protegidos;
- el único registro parecido que existe es `Reglas_Mano_Congeladas_v1.0.md:133-148` («§5 Qué lo vigila»): una regla con siete pruebas. Es el molde a copiar.

**3. Formato propuesto:** `docs/AJILEI_Invariantes_v1.0.md`, más su gemelo legible por máquina `scripts/invariantes.json`. Columnas:

| Columna | Contenido |
|---|---|
| `id` | `INV-NNN` |
| Regla | una frase |
| Fuente | archivo y línea de la doctrina |
| Alcance | vistas y mesas |
| Puerta | `script modo [etiqueta]` o `archivo.test.js › nombre`, o «ninguna» |
| Tipo | píxel, relación, booleana o código |
| ¿En la corrida completa? | sí o no |
| Estado | viva, parcial o sin puerta |
| Dueño | — |

**Cómo se mantiene vivo:** una prueba de vitest (`scripts/testInvariantes.test.js`) que lea el JSON y falle en tres casos:
1. una puerta apunta a un modo o a una etiqueta que ya no aparece en su script (por `grep` del literal);
2. un archivo de prueba o un nombre de `it()` ya no existe;
3. una regla en estado «viva» no tiene puerta.

Al revés, una regla en estado «sin puerta» sale como aviso visible, no como verde (D4). Las dos de «solo código» pasan a doctrina antes de entrar.

**Etiqueta: fusionar.** El registro se escribe en la última sub-tanda, sobre las puertas ya sanas (D2). **Costo:** 60 min. **Riesgo:** bajo.

---

## §C · Cierre

### C1 · Tabla de triaje

| # | Pendiente | Etiqueta | Costo | Riesgo |
|---|---|---|---|---|
| B1 | Verificadores rotos (21) | **retirar** 16 · **fusionar** 3 (`C441b`, `REN1`, la ceremonia viva → B4) · `C441` según la pregunta 2 | 55 min | bajo |
| B2 | Deriva del navegador | **arreglar** (fijar Chromium 151) · generadores **aplazados** | 45 min | bajo |
| B3 | `msg`/`lob` al 4173 | **arreglar** | 90 min | medio (`msg`) |
| B4 | Intermitentes `a1`/`a2` | **arreglar** (fusionado con B5) | 30 min | bajo |
| B5 | `f1` y los bucles de autojuego | **arreglar** (absorbe B4 y H-1) | 60–90 min | medio |
| B6 | Sonda del modal de bancarrota | **retirar** (código muerto; lo hereda `testEliminations`) | 0 (+15 si se borra el modal) | nulo |
| B7 | `testBancoBandas` | **arreglar** (índice + *skip* visible) | 20 min | bajo |
| B8 | Servidores huérfanos | **arreglar** | 45 min | bajo |
| B9 | Aviso `inert` | **arreglar** (`inert: true`) | 5 min | muy bajo |
| B10 | `.lob-cta-pvp` | **retirar** | 5 min | nulo |
| B11 | `1.8b` y carga diferida | **arreglar** (solo `GameTable`) | 60 min + físico | medio |
| B12 | Registro de invariantes | **fusionar** (se escribe al final, sobre puertas sanas) | 60 min | bajo |

### C2 · Partición en sub-tandas (orden de D2)

| Sub-tanda | Contenido | Tope | STOP |
|---|---|---|---|
| **ARN-3a · Instrumento I: terreno** | B8 (servidores), B2 (Chromium fijo y `navegadorArnes()`), H-2 (código ≠ 0 en rojo y en error), H-9 (`diagCEL0` con variable de base) | 90 min | corrida de estado repetida con Chromium fijo: mismas cifras que §A2 en `o1`, `o2`, `a1`, `a2` y `u1`; un rojo devuelve ≠ 0; tras matar la tarea, `netstat` limpio |
| **ARN-3b · Instrumento II: el bucle de autojuego** | B5 + B4 + H-1 (`m1`) + H-4 («el caso no se dio» ≠ rojo, en `rec` y `z1`) + H-13 (`vuelo`) + H-14 (`h1`) + `apu` 360×640 (2 rojos en 3) + H-3 (`tapetes` lee el copy de `textos`) | 120 min | `m1` 16/16 · `a1` T5 1920×937 sin rojo por mesa reducida en 20 corridas · `a2` sin `SINCERRAR` mudo · `tapetes` verde · `h1` 16/16 · `vuelo` 2/2 · `rec`/`z1` sin rojos por caso ausente |
| **ARN-3c · Instrumento III: verificadores, pruebas y servidor** | B1, B7, B3 (`lob` y `msg` al 4173 con semillas) y H-5/H-6 (varas de tiempo de `cel` y `dis`: margen o repetición) | 120 min | `vitest` 1 089 en clon limpio (con el *skip* visible si faltan volcados) · `lob` y `msg` verdes en 4173 · `cel`/`dis` estables en 5 corridas |
| **ARN-3d · Producto** | B11 (solo `GameTable`, precarga en el lobby y `startTransition`), B9, B10 y, si el rector lo autoriza, el modal muerto de B6 | 90 min | `1.8b` ≤ 200 · validación física de Victor (primera entrada a la mesa sin parpadeo; la hoja ⚙ sin cambio visible) |
| **ARN-3e · Registro** | B12 | 60 min | `docs/AJILEI_Invariantes_v1.0.md` + `scripts/invariantes.json` + la prueba que lo mantiene vivo, verde |

**Aplazado, con dueño:**
- Generadores de assets con Edge (B2). Dueño: la próxima campaña que regenere assets. Razón: puede mover bytes sellados.
- `u1` `hits 0/8`. Dueño: quien abra `UtilitiesMenu` (decidido en APU-1 C-1).
- CEL-2c, el rojo de 133 ms. Dueño: la campaña CEL-2c.
- E-22 de `msg`. Se reevalúa tras ARN-3c, porque con semilla deja de ser intermitente o se reproduce.

### C3 · Hallazgos nuevos (se reportan, no se arreglan)

| ID | Hallazgo |
|---|---|
| **H-1** | **`diagDSK m1` está roto.** Abortó tras la 1.ª de 16 celdas: `TypeError … reading 'getBoundingClientRect'` en `diagDSK.mjs:4648`, porque `.player-zone .deck-pile` ya no existía (la mesa se acabó). Es la avería de `a1` antes de C-0.5 |
| **H-2** | **Rojo y error con código de salida 0.** `diagDSK` guarda la excepción en `report.error` y sale con 0; `diagPUE` (2 ROJO), `diagCEL0` (6 FALLOS) y `diagDSK tapetes`/`vuelo`/`rec` (ROJO) también salen con 0. Un encadenado `&&` o una CI no ven nada. Es D4 a nivel de comando |
| **H-3** | **`tapetes` ROJO por instrumento viejo.** `diagDSK.mjs:11114-11120` compara contra el literal «fichas» (`'¿Comprar Tricolor por 50.000 fichas?'` y `'N fichas'`). Desde REN-1 (`8036a28`) el producto dice «Heptacoins», y desde REN-1b (`e4f8f6f`) la baldosa lleva solo el número. Su propio comentario dice «Copy y montos SALEN de la fuente única», pero el sufijo está escrito a mano |
| **H-4** | **«El caso no se dio» se pinta como rojo.** `rec` · `forzosa-s25v` · `p7`: `destapa.caso = false`, porque no había rival con cartas tapadas (1 de 3 corridas; las otras dos verdes). `z1` T5 1280×720: `coreo=n/a` y escala 1 en el rival derecho (1 de 4 corridas). Lo probable es que esa mano no tuviera revelación, pero no se comprobó. Debería salir «no medido» o forzarse con un molde |
| **H-5** | **`diagCEL0 celebracion` tiene varas de tiempo inestables.** Además de los 5 fallos de CEL-2c, cada una de cuatro corridas sacó uno o dos fallos **distintos**: «entraron 3 rubros, deben ser 4» (1920) · «el saldo duró 4138 y pedía 2800» (1920) · «a mitad de cascada hay 3 rubros visibles y deben ser 2» (mudo) · «mandó el temporizador-red (1905 ms de 1896), no el 'end' de Howler» (reducido). La cuarta no sacó extra |
| **H-6** | **`dis.relevo` es intermitente:** 1, 0, 3 y 2 rojos en cuatro corridas, en Edge y en WebKit, por 5 a 100 ms sobre topes de 600, 2 500 y 2 700 ms (margen ~3 %) en una animación medida con reloj de pared |
| **H-7** | **El arnés de 5173 habla con el Supabase real.** Cada carga pelada da `401` y `SAL-A: error inesperado de la base — 42501 permission denied for function mi_sala` |
| **H-8** | **En 4173 había un `vite preview --host` con túnel `cloudflared`** (PID 29600 y 2852, desde las 17:26). No se tocó. Por eso el STOP lo sigue mostrando |
| **H-9** | `diagCEL0` tiene la base **clavada** a `http://localhost:5173` (`:30`), sin la variable `AJILEI_BASE` que tienen `diagDSK` y `diagSAL` |
| **H-10** | El cierre de APU-1 §6.2/§6.4 dice que C-0.5 puso `contestarRecarga` en cinco modos (`o1`, `o2`, `a1`, `a2`, `u1`). Solo hay **dos llamadas** (`a1` y `a2`) |
| **H-11** | `vuelo` tarda 880 s y `rec` 880 s. `rev` sale verde en la copia limpia aunque `capturas-rev/fase0/` (ignorada) no exista: su comparación contra la Fase 0 se salta en silencio (`diagDSK.mjs:12276-12277`, `existsSync ? … : null`). No se comprobó qué puerta queda sin vara |
| **H-12** | Tres pendientes que el cierre de REC-1 §5 asignó a «la tanda de higiene del arnés» **no están en la ficha**: `tel.linea` en `apu`, el molde `allinHumano` que descuenta mal el saldo, y H-2 de LUZ-1 (el bypass con `'0'`). **`tel.linea` sale rojo hoy** en la matriz de `apu` (360×640) y en una de las dos repeticiones a solas (§A2). Ver la pregunta 5 |
| **H-13** | **`vuelo humano` es otro bucle de la familia de B5.** Sale rojo en las **dos** corridas, pero no por azar: el escenario admite 40 manos (`diagDSK.mjs:11263`) y abortó en la 7.ª y en la 8.ª con `abortadaEn: "mano N: 3 manos sin cerrar"`. Tres manos seguidas sin «Siguiente mano» encajan con una recarga o un All-in que su bucle (`:11323`) no contesta. Lo honesto del arnés es que dice por qué; lo que falla es que lo pinta como el escenario rojo |
| **H-14** | **`h1` sale 0/16 por instrumento.** Su `cycleStable` (`diagDSK.mjs:4383`) exige Δ < 0,6 en todas las anclas del área del humano, incluido el borde **izquierdo** de `num` y `chips`. Ese número está alineado a la derecha y crece hacia la izquierda por diseño: el propio modo lo comprueba aparte con `numRightFixed` y `growsLeft` (`:4438`). Antes de APU-1 la pila no cambiaba de número de dígitos dentro del ciclo; ahora pasa de «1000» a «950» al cobrar el ante y el borde se mueve 10,19 px, un dígito. Los demás falsos del JSON son banderas o cobertura (`ovalGated` es solo `n === 5`). Va a ARN-3b |

### C4 · Preguntas al rector

1. **B2:** ¿se fija el arnés al Chromium 151.0.7922.34 de `playwright-core` 1.62.1 y se re-etiqueta `ARNES.chromiumBaselines`, sin re-sellar cifras? ¿Se acepta la pasada de contraste `ARNES_CANAL=msedge` al cierre de cada campaña?
2. **B1:** ¿los 16 de un solo uso se retiran con `git rm` o pasan a un archivo histórico? ¿Sigue siendo regla tras APU-1 «el ante se ve descontado antes de barajar» (`verifyC441`)?
3. **B6:** ¿se borra el modal muerto de bancarrota en ARN-3d (producto invisible, archivo no protegido) o se aplaza?
4. **B11:** ¿alcance mínimo, solo `GameTable` (168,8 KiB), o la variante completa (149,4)? ¿Se acepta precargar el chunk desde el lobby?
5. **H-12:** los tres pendientes de REC-1 asignados a la higiene del arnés, ¿entran en ARN-3b o se aplazan?
6. **B3:** para `msg` en 4173, ¿una lista fija de semillas (reproducible, menos variedad) o semilla por corrida anotada en el JSON?
7. **H-2:** ¿un rojo o un error tiene que salir con código ≠ 0 en todos los arneses (D4 extendido al comando)?
8. **H-8:** ¿es de Victor el `vite preview` con el túnel del 4173? Si lo es, el STOP no lo cierra a propósito.

### C5 · STOP

**Servidores.** Los míos (4183, 5173, 5174 y los cuatro del experimento, 4191–4194) se cerraron por PID y por árbol. Antes, detener sus tareas de fondo **no los cerró**: los siete siguieron escuchando, y con ellos sus `npx` padres. Es B8 reproducido en directo. `netstat` al final:

```
  TCP    0.0.0.0:4173           0.0.0.0:0              LISTENING       29600
  TCP    [::]:4173              [::]:0                 LISTENING       29600
```

Solo queda el **4173**: el `vite preview --host` con túnel `cloudflared` de las 17:26 (H-8). **No es mío y no se tocó** (pregunta 8). En 4183, 4191–4194, 5173 y 5174 no escucha nada. Tampoco quedan navegadores del arnés ni corredores vivos.

**Copias.** Las dos copias del scratchpad conservan su salida (logs, JSON, capturas). Las uniones a `node_modules` se quitaron con `rmdir` y el `node_modules` del repo sigue intacto. El Chromium de Playwright (428 MB + 272 MB de *headless shell*) queda en `%LOCALAPPDATA%\ms-playwright` para ARN-3a. Si el rector elige el camino (a), se puede borrar.

**`git status --porcelain`:**

```
?? docs/reportes/AJILEI_ARN-3_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

Solo el informe nuevo y los seis residuos. Sin `git add`.
