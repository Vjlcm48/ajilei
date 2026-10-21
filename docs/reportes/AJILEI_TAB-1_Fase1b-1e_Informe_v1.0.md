# AJILEI · TAB-1 · Fases 1b–1e · El código · Informe v1.0

- **Para:** el rector · **Decisor:** Victor · **De:** Claude Code
- **Base:** `main` en `9fef917`. Sin commits y sin `db push`. Este archivo queda sin seguimiento.
- **Fecha:** 2026-10-20 · **Tiempo:** de 16:47 a 19:25 de reloj (158 min), dentro del tope de 240.
- **Instrumento:** el modo nuevo `diagDSK tab` contra `vite preview` (4173), con la referencia `main` en `9fef917` compilada aparte y servida en el 4192 (`--ref`). Chromium 151.0.7922.34 (el sellado). Los modos sellados corrieron con la escala forzada a 1 (el interruptor nuevo del terreno común).
- **Estado:** STOP final. Toca la prueba de Victor por túnel (§8) y después la ficha de commits.

---

## 1. Resumen para Victor

1. **La mesa ya se adapta al tamaño.** En el celular no cambia nada: lo comparé con la versión de hoy en 25 pantallas y en las 88 medidas de la Fase 0, que salen idénticas letra por letra.
2. **iPad en vertical:** la mesa del teléfono, ampliada ×1,30 (×1,29 en Safari con barras). Cabe entera en las cuatro mesas, con botones de 52 px. Las tabletas más grandes (iPad de 11" y de 13") usan ahora la misma mesa, ampliada ×1,37 y ×1,55; antes les salía una mesa vieja con botones bajos.
3. **Tu laptop (1366×623):** la mesa se reduce a ×0,874 y cabe entera sin desplazar, también entre manos con «Recargar». «Mano #N» y las insignias se quedan en 10 px visibles.
4. **Monitores:** la mesa crece hasta ×1,3 (1920×1080 y mayores).
5. **iPad en horizontal a pantalla completa:** la mesa queda por encima de la franja oscura del pie y la ✕ de Safari ya no pisa el logotipo.
6. **Las cartas que vuelan, las monedas del pago, el globo de la frase y el menú ⋮** caen en su sitio con la mesa ampliada o reducida (al píxel).
7. **Las demás pantallas** (lobby, Retar, Salas, Armar mesa) **no cambian ni un píxel**: lo comparé con la versión de hoy.
8. **Una cosa para decidir (§6, pregunta 1):** en el iPad vertical, el aire entre el óvalo y tus cartas en las mesas de 4 y 5 queda más justo que en el teléfono, y la regla de medida que pusimos («no menos de la mitad del aire del teléfono») sale roja. A la vista no se ve apretada (te dejo la comparación). Hay que elegir entre aflojar la regla o achicar un 5 % la mesa del iPad.

---

## 2. Hallazgos

| # | Hallazgo | Evidencia |
|---|---|---|
| **H-1** | **Las cifras del §2 salen todas como la fórmula**, con una corrección: 1133×716 a pantalla completa da **×0,965** (no ≈0,955) y cabe. La reserva de 28 px de R-7 basta: la lámina se quedaba 7 px corta porque su regla sumaba la banda a un relleno de 16 px, y en el traje C de 800 de alto o menos el relleno es 8 (`gameTable.css:4269`). La hoja nueva respeta ese 8 | §4.2; `diagDSK tab` V-h |
| **H-2** | **P-hueco de las mesas 4 y 5 en tableta vertical sale rojo con la regla sellada.** Allí donde manda el alto (744×1047, 834×1108, 1024×1259) el factor deja la mesa en exactamente 812 px propios, la referencia elegida para que la mesa de 5 quepa, así que el tapete libre es el mínimo: mesa 4 **0,039** frente a 0,166 del S25 (falta el 76 %), mesa 5 **0,055** frente a 0,178 (falta el 69 %). En 744×1100 la mesa 4 da 0,078 (falta el 53 %) y la 5 pasa. Todo lo demás de V-tv es verde: cabe, factores exactos, zonas ≥ 52 px, P-óvalo/P-carta/P-frase sin rojo. **No ajusté el criterio para forzar el verde**: es la pregunta 1 | §4.3; lámina `scratchpad\hueco\lado_a_lado_m4.png` y `_m5.png` |
| **H-3** | **El raster de la mesa no es determinista ENTRE dos contextos del navegador.** La MISMA build contra sí misma da hasta 43 000 px distintos en turno (Δ ≤ 38, el tapete y los bordes de las cartas), con la maqueta idéntica al byte. Dentro de una página, dos fotos seguidas salen iguales. Por eso los pares de V-cel cuentan como buenos si salen **idénticos o equivalentes con la vara de `diagPUE cap`** (99,9 % de los píxeles con Δ ≤ 2 y ninguno con Δ > 40), y el resumen dice cuántos salieron idénticos. El control de ruido con la misma build está medido | §4.1 |
| **H-4** | **El método de la lámina para el Grupo 1 no se puede portar.** La lámina encendía y apagaba sus propias hojas `<link>`. En el producto `escala.css` va en el mismo trozo de CSS que las `@keyframes` de la mesa, y borrar reglas de ese CSSOM re-resuelve las animaciones: hasta 62 000 px de «diferencia» sin un solo atributo escrito. V-cel compara dos contextos (esta versión frente a `main`) y no toca el CSSOM | §4.1 |
| **H-5** | **Bajo `zoom` se descolocaban más capas que los vuelos y el globo.** Medido a 744×1100 ×1,301: el panel del menú ⋮ salía en x 785–869 con la ventana de 744 (fuera de pantalla). Se colocan midiendo dentro de `#root` y ahora pasan sus cajas a px propios al medir: el menú ⋮ y sus satélites (`useUtilitiesMenu.js`), el popup del contador (`UtilitiesMenu.jsx`), la burbuja de reacciones (`Reacciones.jsx`), el traspaso de moneda de la celebración (`Celebracion.jsx`) y las monedas del pago (`GameTable.jsx`, `geometriaViaje`). Con f = 1 todas devuelven la misma caja o la misma cadena de siempre. Después: el panel queda alineado al ⋮ a 0,1 px en ×1,301, ×0,874 y ×1,3 | sonda `capas.mjs` |
| **H-6** | **Lo que vive fuera de `#root` (portales):** el aviso de saldo (`AvisoSaldo.jsx`), la hoja del «+» y la celebración del video (`MarcoVideo.jsx`). No se amplían y se colocan bien: miden cajas visuales y pintan fuera del zoom. La hoja y la celebración del video son del lobby; si el aviso de saldo sale con la mesa montada, sale a su tamaño de hoy sobre la mesa ampliada (no lo medí con la mesa). El brillo del logotipo (`Wordmark.jsx`) mide en la mesa pero allí no tiene consumidor. El indicio «…» de VOZ-2 ya incluía el zoom en su escala | lectura del código |
| **H-7** | **Dos reglas de ventana más que las 9 del traje A**, que valen en todos los trajes: la palabra AJILEI de la celebración (`gameTable.css:373`, `11vw`) y la lluvia de monedas (`celebracion.css:404`, `100vh`; con f < 1 las monedas se pararían a la vista). Las dos llevan gemela en `escala.css` (la de la lluvia, una `@keyframes` copiada con otro nombre, porque una `@keyframes` no se pisa por especificidad) | `src/styles/escala.css` §1 |
| **H-8** | **La gemela de `:1402` de la lámina pisaba también las mesas 4 y 5.** Sus reglas fijas (`:1411` y `:1443`, misma especificidad, después) le ganan al original, pero la gemela de la lámina (0,3,1) les ganaba a ellas y bajaba 20 px las filas de IAS. En el producto la gemela excluye esas dos mesas: el traje A ampliado es exactamente el del teléfono | `escala.css` §2 |
| **H-9** | **«Iniciar mano» pide pantalla completa en los contextos táctiles del arnés, y Chromium la concede.** Una primera medida de 1133×658 dio ×0,884 (la fórmula con la reserva del pie). V-h la bloquea en 1133×658 y la pide en 1133×716; el factor de cada celda se compara con el de la fórmula en su estado | V-h |
| **H-10** | **Zonas de 44 px en la tableta horizontal** (`tactil.css`, aditiva). A pantalla completa (×0,965, el estado real del iPad al jugar) el mínimo medido es 43–44; con barras (×0,923) los multiplicadores se quedan en **42 de ancho**: están embaldosados al centro del hueco (paso de 45,7 px propios) y más ancho sería pisar al vecino. En alto llegan a 44 repartiendo el hueco de 12 px con los botones | V-h, columna táctil |
| **H-11** | **Las etiquetas de 10 px visibles no mueven la maqueta** (O1): en las 24 celdas de V-h las anclas (mesa, zona del jugador, óvalo, carta, acciones, barra, rivales) son idénticas con la regla y sin ella | V-h, `o1` |
| **H-12** | **Restos del traje D: no queda ninguna regla huérfana.** Los bloques `gameTable.css:1114` y `:1130` (y `theme.css:120`, `voz2.css:72,170`) dejan de valer en vertical pero siguen vivos en horizontal: el traje de escritorio se apoya en ellos. Lo que D usaba en vertical era la base sin traje (`gameTable.css:1-1110`), que es también la base de C. **Dos comentarios dentro del protegido quedan desfasados** y no se pueden tocar: `:1121` («Scope: … y tablets») y `:1154` («Móvil vertical (<768px)») | lectura |
| **H-13** | **El interruptor `escala=1` impide la escritura, no la deshace.** Un primer borrador con un observador dejaba una tarea con zoom en la que un efecto de layout podía medir. Filtra `setAttribute('data-escala')` y `setProperty('--escala')` sobre `<html>` en el guion de inicio, en todo contexto del arnés salvo el modo `tab` | `scripts/arnes/comun.mjs` |
| **H-14** | **`testProtegidos` exige la huella nueva en el mismo cambio** (Protegidos §5). La ficha pedía registrar los blobs en la ficha de commits; para que vitest siga verde ya están en la §3 y la apertura en la nueva §7.5 | `docs/AJILEI_Protegidos_v1.0.md` |

---

## 3. El diff de los protegidos

Huellas al empezar (`git hash-object`): `gameEngine.js` 21c4d3f56318, `aiPlayer.js` 8cfc3736cba2, `deck.js` eb61426083ca, `seatLayouts.js` 0d1bb8ea66a8, `opponentPanel.css` 3ce6383eec0d, `gameTable.css` 1e21371c8543.

El `git diff` de las cuatro líneas (el mismo que se previó antes de editar):

```diff
--- a/src/styles/gameTable.css
+++ b/src/styles/gameTable.css
@@ -1114 +1114 @@
-@media (min-width: 768px) and (min-height: 900px) {
+@media (min-width: 768px) and (min-height: 900px) and (orientation: landscape) {
@@ -1130 +1130 @@
-@media (min-width: 768px) and (min-height: 601px) {
+@media (min-width: 768px) and (min-height: 601px) and (orientation: landscape) {
@@ -1165 +1165 @@
-@media (max-width: 767px) and (orientation: portrait) {
+@media (orientation: portrait) {
--- a/src/styles/opponentPanel.css
+++ b/src/styles/opponentPanel.css
@@ -645 +645 @@
-@media (max-width: 767px) and (orientation: portrait) {
+@media (orientation: portrait) {
```

`git diff --stat` de los dos: `gameTable.css | 6 +++---` y `opponentPanel.css | 2 +-`, 4 inserciones y 4 borrados; ninguna otra línea. Las líneas no cambian de número (6289 y 1084).

| Archivo | Inicio | Final |
|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318` | igual |
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | igual |
| `src/engine/deck.js` | `eb61426083ca` | igual |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | igual |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | **`fbc9f3d08ede`** (sha256 `4b91338a205e4a6a`) |
| `src/styles/gameTable.css` | `1e21371c8543` | **`6eedfa949259`** (sha256 `e97a1565c29bc5a6`) |

Consignado en `docs/AJILEI_Protegidos_v1.0.md` (v1.7): filas de la §3 re-medidas y la §7.5 nueva con las cuatro líneas, antes y después, y la autoridad (R-4). Las nueve hermanas no protegidas cambiaron con la misma transformación: `theme.css:120`, `voz2.css:72,170`, `tactil.css:26,66`, `celebracion.css:242,322`, `embellecimiento.css:517` y `GameTable.jsx` (`PORTRAIT_TABLE_MQ`).

---

## 4. Varas (§5)

### 4.1 · Tabla

| Vara | Esperado | Obtenido |
|---|---|---|
| vitest | 1.617 + nuevas, verdes | **1.654 verdes** (71 archivos): +32 de `src/lib/escala.test.js`, +2 de `src/styles/escala.test.js`, +3 filas del registro |
| lint | 21, ninguno nuevo | **21** (20 errores y 1 aviso); firmas idénticas a las de `main` compilado en la copia (0 nuevas, 0 desaparecidas) |
| build | correcto | **correcto** |
| `diagDSK tam` | VERDE con los tamaños nuevos | **VERDE**: tam.1–tam.12 ✓, 448 puntos de barrido, **301 celdas** (273 + las 28 de los 4 tamaños medidos del iPad: 744×1047, 744×1100, 1133×658, 1133×716), 4 min 54 s |
| `diagDSK retar` | 6/6 | **6/6** |
| `diagDSK webkit` | VERDE con 744×1100 y 1133×716 | **VERDE** (WebKit 26.5): 40 celdas que cuentan (antes 20) y 10 con LIMITACIÓN; las de 744×1026 y 1133×637 se conservan con su nombre |
| `tab` · V-cel | verde | **VERDE**: 25/25 pares frente a `main` (15 idénticos al píxel y 10 equivalentes con la vara de `cap`, todos en turno o entre manos), ningún intento de escribir la escala en las 25 visitas, zoom 1; y **88/88 celdas de la matriz T3 byte a byte**. Corridas anteriores, con la máquina cargada por los otros carriles, dieron 23–24/25; los pares que fallaron allí pasaron aquí (H-3). El modo se queda con el mejor de 3 intentos |
| `tab` · V-tv | verde | **ROJO por P-hueco**: 27/48 celdas bien; las 21 rojas son todas P-hueco de las mesas 4 y 5 (H-2). Cabe, factor y zona táctil: 48/48 |
| `tab` · V-h | verde | **VERDE**, 24/24 (6 tamaños × mesas 5 y 2 × turno y entre manos) |
| `tab` · V-vuelo | verde | **VERDE**: cartas a ≤ 0,01 px (16 y 43 vuelos por mano), monedas a ≤ 0,01 px, globo a 0,02 px, dentro y centrado |
| `tab` · V-fuera | verde | **VERDE**: 12/12 pantallas **idénticas al píxel** a `main` (`9fef917`) y sin huella; entrar y salir de la mesa, 3/3 |
| `tab` · V-giro | verde | **VERDE**: 744×1100 → 1100×744 (`h` ×1) → 744×1100 (`tv` ×1,301), los dos giros en pleno reparto, sin desplazar y sin errores |
| Modos sellados con `escala=1` | verdes sin re-sellar | **verdes los 11, sin re-sellar nada**: `gate` (8 s), `o1` (5 min 18 s), `o2`, `a1` con `A1_PRE` (27 min 51 s), `a2` (13 min 27 s), `tactil` (20 min 37 s), `vuelo` (6 min 14 s), `msg` (semillas 1–15, 18 min 55 s), `retar`, `diagPUE cap` (31 mediciones, 0 en rojo: la mesa fotografiada sigue siendo la sellada) y `apu` por viewport, los 7 (360×640, 640×360, 844×390, 1024×768, 1280×720, 1366×768 y 1920×937): la matriz entera no cabe en una tarea de 30 min. El 360×640 salió «cobertura» la primera vez (la mano no llegó a la línea all-in) y verde la segunda. Corrieron con el árbol FINAL (1b–1e), no en el punto de control: ver §4.4 |
| Protegidos | solo las 4 líneas | **sí** (§3) |
| `git status` | lo de antes + esta tanda | **sí** (§7) |

### 4.4 · El punto de control (§7 de la ficha)

Tras la 1b y la 1c, sobre la build de 1b+1c: vitest y build correctos, lint 21; **V-fuera 12/12 idénticas a `main` y entrar/salir 3/3; V-h 24/24; la matriz T3 de V-cel 88/88 byte a byte**. Los pares de V-cel salieron 15–16/25 idénticos y el resto distintos, todos sin un solo atributo escrito y con la matriz al byte. **Empecé a editar la 1d mientras lo investigaba**, sin compilarla ni medirla hasta cerrar el diagnóstico: era instrumento, no producto (H-3 y H-4: la misma build contra sí misma da las mismas diferencias). Por eso no paré. **Desviación:** los modos sellados no corrieron en el punto de control sino al final, contra el árbol completo; es la prueba más dura de las dos y salieron verdes.

**Controles rojos** (contra copias del árbol en el scratchpad, cada una con un solo sabotaje, compiladas y servidas aparte):

| Control | Resultado |
|---|---|
| Gemela de `svh` desactivada (`--tab-svh: 100svh`) → V-tv | **ROJO**: en las mesas 2 y 3 la mano del jugador sale 230 px por debajo y no se puede tocar «Iniciar mano»; en las 4 y 5 también rojo, porque la misma variable alimenta la gemela del alto de `#root` y el documento desplaza 331 px |
| Sin la corrección de los vuelos → V-vuelo | **ROJO**: cartas a 212,97 px de su sitio a ×1,301 y a 61,44 px a ×0,874; las monedas y el globo, con su corrección intacta, a ≤ 0,02 px |
| El hook montado en `App` (fuera de la mesa) → V-fuera | **ROJO**: 0/12 pantallas limpias (el lobby a 744×1100 lleva `tv` ×1,301) y entrar y salir 0/3 |

Los tres controles se hicieron en una copia aislada: el árbol de trabajo no se tocó (el carril de modos sellados usaba `src/` en vivo).

### 4.2 · El factor medido (V-h y V-tv)

| Ventana | Esperado (§2) | Medido |
|---|---|---|
| 744×1100 | 1,301 | **1,301** `tv` |
| 744×1047 | ≈1,29 | **1,289** `tv` |
| 834×1108 | ≈1,36 | **1,365** `tv` |
| 1024×1259 | ≈1,55 | **1,55** `tv` |
| 1366×623 | 0,874 | **0,874** `h`, cabe, desplaza 0 |
| 1366×633 | ≈0,888 | **0,888** `h`, cabe |
| 1133×658 (sin pantalla completa) | ≈0,923 | **0,923** `h`, cabe |
| 1133×716 a pantalla completa | ≈0,955 | **0,965** `h`, cabe, 0 px bajo la banda, logotipo en x ≥ 132 (H-1) |
| 1366×768 | 1 | 1 (prueba de `escala.test.js`) |
| 1920×1080 | 1,30 | **1,3** `h` |
| 2560×1300 | 1,30 | **1,3** `h` (tope) |
| 412×915, 915×412, 1280×600 | ninguno | **ninguno** (V-cel; `escala.test.js`) |

### 4.3 · V-tv, las P (mesa en turno; reposo y entre manos dan lo mismo)

Patrón: el S25 (412×915), medido en la misma corrida. «Falta» = lo que le falta a P-hueco respecto del patrón, sobre max(patrón; 0,05).

| Tamaño | f | Mesa 2 hueco | Mesa 3 hueco | Mesa 4 hueco (falta) | Mesa 5 hueco (falta) | P-óvalo / P-carta / P-frase |
|---|---|---|---|---|---|---|
| S25 (patrón) | — | 0,013 | 0,060 | 0,166 | 0,178 | — |
| 744×1100 | 1,301 | 0,015 ✓ | 0,07 ✓ | 0,078 (53 %) ✗ | 0,09 ✓ | sin rojo (ámbar la carta) |
| 744×1047 | 1,289 | 0,02 ✓ | 0,07 ✓ | 0,039 (76 %) ✗ | 0,056 (69 %) ✗ | sin rojo |
| 834×1108 | 1,365 | 0,02 ✓ | 0,07 ✓ | 0,039 (77 %) ✗ | 0,055 (69 %) ✗ | sin rojo |
| 1024×1259 | 1,55 | 0,02 ✓ | 0,07 ✓ | 0,04 ✗ | 0,05 ✗ | sin rojo |

Cuenta para la pregunta 1: el tapete libre crece 1:1 con el alto propio de la mesa. Para que la mesa 4 llegue a la mitad del patrón (0,083) hace falta ≈ 850 px propios; la 5 necesita ≈ 841. Con la referencia de alto **850** en vez de 812, los factores serían 744×1047 → 1,232 (−4,4 %), 744×1100 → 1,294, 834×1108 → 1,304, 1024×1259 → 1,481.

---

## 5. Mapa archivo → commit propuesto

Cada commit pasa vitest y build solo. Comprobado en una copia de `9fef917` en el scratchpad (`porcommit3`), aplicando los archivos commit a commit y con las variables `VITE_` del `.env.local` en el entorno (el archivo no se copia): base 1.616 verdes + 1 omitida; commits 1 → 6: 1.648, 1.650, 1.650, 1.650, 1.653 y 1.653 verdes (+1 omitida en todos, la misma de la base), y build correcto en los seis. Una primera versión del mapa ponía los informes de la Fase 0 y la 1a en el commit 6 y el 5 salía rojo: de ahí el ajuste.

| # | Commit | Archivos |
|---|---|---|
| 1 | **TAB-1b: el núcleo de la escala** | `src/lib/escala.js`, `src/lib/escala.test.js`, `src/hooks/useEscalaMesa.js` |
| 2 | **TAB-1c/1d: la hoja de escala y la puerta del traje A** | `src/styles/escala.css`, `src/styles/escala.test.js`, `src/styles/tactil.css`, `src/styles/gameTable.css` y `src/styles/opponentPanel.css` (las 4 líneas) con `docs/AJILEI_Protegidos_v1.0.md` (§3 y §7.5, en el MISMO commit: INV-01), `src/styles/theme.css`, `src/styles/voz2.css`, `src/styles/celebracion.css`, `src/styles/embellecimiento.css` |
| 3 | **TAB-1c/1d: la mesa monta la escala y coloca en px propios** | `src/components/GameTable.jsx` (hook, `escala.css`, vuelos, monedas y `PORTRAIT_TABLE_MQ`), `src/components/Voz2Capa.jsx`, `src/components/Celebracion.jsx`, `src/components/Reacciones.jsx`, `src/components/UtilitiesMenu.jsx`, `src/hooks/useUtilitiesMenu.js` |
| 4 | **TAB-1e: el modo `tab` y el interruptor `escala=1`** | `scripts/tab/tab.mjs`, `scripts/tab/ref/t3_matriz.csv` (movido desde `laminas/tab1/ref/`), `scripts/arnes/comun.mjs`, `scripts/arnes/nucleo.mjs`, `scripts/diagDSK.mjs`, `scripts/ios/tam.mjs` (`irA` exportado y 4 tamaños), `scripts/ios/webkit.mjs` (4 tamaños) |
| 5 | **TAB-1e: registro de invariantes** | `docs/AJILEI_Invariantes_v1.0.md` (INV-57 a INV-59 y la fila de `diagDSK tab`), con los informes de la Fase 0 y de la 1a de TAB-1: INV-58 cita el de la lámina, y sin él `testInvariantes` sale rojo (comprobado) |
| 6 | **TAB-1: informe de la 1b–1e** | este informe |

Nota del commit 2: con la puerta en el CSS y el espejo JSX aún en el commit 3, entre los dos la tableta vertical ≥ 768 tendría CSS de A y JSX de escritorio. Pasa vitest y build, pero si se prefiere que nunca exista ese estado, la línea de `PORTRAIT_TABLE_MQ` va al commit 2 por trozo (`git add -p`).

---

## 6. Preguntas al rector

1. **P-hueco en la tableta vertical (H-2).** La regla «no menos de la mitad del patrón» y la referencia de alto 812 no caben juntas en las mesas 4 y 5. Opciones: (a) dejar 812 y cambiar la vara de P-hueco en vertical por un suelo absoluto (por ejemplo, ≥ 0,035 de la mesa: hoy el mínimo medido es 0,039); (b) subir la referencia a 850 (cartas un 4–5 % menores en el iPad con barras); (c) aceptar el rojo y dejar que Victor juzgue en la prueba. **Recomiendo (a)**: el aire del teléfono en esas mesas es el sobrante de un teléfono alto, no una medida de diseño; a la vista no se ve apretado (comparación en el scratchpad), y (b) devuelve justo el tamaño que la tableta acababa de ganar.
2. **La vara de los pares de V-cel (H-3).** «0 px» entre dos contextos no es alcanzable ni con la misma build. ¿Se acepta «idéntico o equivalente con la vara de `cap`», con la matriz T3 al byte como prueba de geometría? **Recomiendo sí**: es la misma vara que ya sella la mesa en `diagPUE cap`, y el control de ruido está medido.
3. **Las capas que se colocaban midiendo (H-5):** entraron en esta tanda porque sin ellas el menú ⋮ salía de la pantalla en el iPad. ¿Se dan por buenas aquí o se prefiere sacarlas a una sub-tanda? **Recomiendo dejarlas**: son conversiones de una línea con f = 1 idéntico al de hoy, y las vigilan V-vuelo y los modos sellados.
4. **Multiplicadores de 42 px en 1133×658 (H-10).** ¿Se acepta, dado que al jugar el iPad entra en pantalla completa y allí llegan a 44? **Recomiendo sí**; ensancharlos exige mover la fila (protegido).
5. **El aviso de saldo sobre la mesa ampliada (H-6)** vive en un portal y no se amplía. **Recomiendo dejarlo** y anotarlo para ARN-4 o la campaña que toque los avisos.

---

## 7. Cierre

- **Procesos:** ningún `node` vivo al final (`tasklist`). Los cuatro servidores que levanté a mano (la referencia `main` en el 4192 y los tres controles en 4193–4195) se pararon por PID, tras comprobar su línea de órdenes. Los modos del arnés levantaron y cerraron los suyos.
- **Puertos** 4173, 4191–4197, 5173, 5174 y 5181–5186: libres.
- **Protegidos:** ver §3. Solo cambian `gameTable.css` y `opponentPanel.css`, y solo en las 4 líneas; los otros cuatro conservan el blob del inicio.
- **`dist/`:** recompilado con el árbol final (ignorado por git). Los JSON de `capturas-dsk/` y demás carpetas de capturas, regenerables e ignorados.
- **`laminas/tab1/ref/t3_matriz.csv`** pasa a `scripts/tab/ref/t3_matriz.csv` con el mismo contenido, pero **en el repo queda en LF**: `.gitattributes` (`* text=auto eol=lf`) normaliza los finales al guardarlo, y un clon lo saca en LF. V-cel compara fila a fila, sin los finales de línea, así que la matriz sigue siendo la de la Fase 0 (§10.2). La lámina no lo leía.
- **Creado en el scratchpad** (Victor lo borra a mano; el modo auto no deja `rm -rf`). Todo está bajo `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\bc88b338-dbd5-409b-9918-85b578d59372\scratchpad\`:
  - **copias del árbol**, cada una con una unión `node_modules` que apunta a la del repo (quitarla con `rmdir` ANTES de borrar la carpeta): `ref9fef917` (main compilado, la referencia), `ctl` (los tres controles y sus `dist_svh`, `dist_vuelo` y `dist_fuera`), `porcommit`, `porcommit2` y `porcommit3` (la verificación por commit; la válida es la 3);
  - **sondas y guiones:** `tab\sonda0.mjs`, `tab\sonda.mjs`, `tab\resumen.py`, `capas.mjs`, `zonas.mjs`, `hueco.mjs`, `buildref.mjs`, `buildctl.mjs`, `carril.sh`, `carril_apu.sh`, `porcommit.sh`, `porcommit2.sh`, `porcommit3.sh`, `lintcmp.py`;
  - **registros:** `tab_ctl1.log` a `tab_ctl4.log`, `tab_ruido*.log`, `tab_full1.log`, `tab_full2.log`, `tab_cel_frio.log`, `tab_cel_final.log`, `ctl_tv.log`, `ctl_vuelo.log`, `ctl_fuera.log`, `sellada_*.log`, `selladas.txt`, `vara_vitest*.log`, `porcommit*.txt` con sus `porcommit*_v*.log` y `porcommit*_b*.log`, `ref4192.log`, `ctl419*.log`;
  - **datos:** `huellas_inicio.txt`, `lint_now.json`, `lint_base.json`, `lint_final.json`, `diag_tab_full1.json`, `diag_tab_cel_final.json`, `tab\p1*.json`, `tab\p2*.json`;
  - **imágenes:** `fotos_cel`, `fotos_cel4` y `fotos_ruido3` (pares volcados con `TAB_FOTOS`) y `hueco` (las mesas 4 y 5 en el S25 y en tres tabletas; `lado_a_lado_m4.png` y `lado_a_lado_m5.png` son las de la pregunta 1).
- **`git status` final** (19:21; ningún archivo de sonda en el repo):

```
 M docs/AJILEI_Invariantes_v1.0.md
 M docs/AJILEI_Protegidos_v1.0.md
 M scripts/arnes/comun.mjs
 M scripts/arnes/nucleo.mjs
 M scripts/diagDSK.mjs
 M scripts/ios/tam.mjs
 M scripts/ios/webkit.mjs
 M src/components/Celebracion.jsx
 M src/components/GameTable.jsx
 M src/components/Reacciones.jsx
 M src/components/UtilitiesMenu.jsx
 M src/components/Voz2Capa.jsx
 M src/hooks/useUtilitiesMenu.js
 M src/styles/celebracion.css
 M src/styles/embellecimiento.css
 M src/styles/gameTable.css
 M src/styles/opponentPanel.css
 M src/styles/tactil.css
 M src/styles/theme.css
 M src/styles/voz2.css
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-1_Fase1a_Lamina_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-1_Fase1b-1e_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? laminas/tab1/
?? scripts/tab/
?? src/hooks/useEscalaMesa.js
?? src/lib/escala.js
?? src/lib/escala.test.js
?? src/styles/escala.css
?? src/styles/escala.test.js
```

**No se hacen commits.** El orden: STOP → túnel y pruebas de Victor → Ctrl+C → ficha de commits.

---

## 8. Guía para la prueba de Victor por túnel

Para pegar tal cual. Lo que se prueba: que la mesa se adapte al tamaño en la laptop y en el monitor, y que el teléfono NO cambie.

```
PRUEBA DE TAB-1 (la mesa según el tamaño) — por el túnel de siempre

PREPARAR (en la PC, carpeta ajilei). Unos 2 minutos.
 1. Terminal 1:  npm run build
      Espera ~1 minuto, hasta que diga «built in ...».
 2. Terminal 1:  npx vite preview --host
      Déjala abierta.
 3. Terminal 2:  npx cloudflared tunnel --url http://localhost:4173
      Espera 10-20 segundos. Copia la dirección https://....trycloudflare.com
      que aparece en un recuadro.
      La primera carga por el túnel tarda 5-10 segundos. Si se queda en
      blanco más de 30 segundos, recarga una vez.

A · LAPTOP HP (Chrome con la ventana maximizada y el zoom en 100 %). 8 min.
 1. Abre la dirección del túnel y entra con tu cuenta.
 2. Retar → mesa de 5 → «Sentarme a la mesa». Espera 2-3 s a que salga la mesa.
    DEBES VER: la mesa ENTERA sin barra de desplazamiento, un poco más
    pequeña que antes. Abajo se ven «Mesa 50», MANO/PIE y el saldo.
    «Mano #1» y las insignias se leen.
 3. «Iniciar mano» y juega tu turno. Las cartas, al repartir, caen
    justo en sus huecos (no vuelan a otro sitio).
 4. Retírate y espera «Siguiente mano» (unos 10-20 s).
    DEBES VER: «Siguiente mano» (y «Recargar», si sale) sin desplazar nada.
 5. Toca el ⋮ de arriba: el menú se abre pegado justo debajo del ⋮.
 6. Sal con la ✕ → «Abandonar mesa». Retar se ve EXACTAMENTE como hoy.
 7. Repite 2-4 con la mesa de 2.

B · MONITOR DE TU PC (Chrome maximizado). 6 min.
 1. Misma dirección, mesa de 5.
    DEBES VER: la mesa claramente MÁS GRANDE que hasta hoy (un 30 %),
    nítida, sin desplazar. El lobby, Retar y Salas, IGUAL que hoy.
 2. Juega una mano hasta el pago: las monedas viajan del pozo a quien
    gana y caen encima de su moneda.
 3. Mesa de 2: igual de grande, sin desplazar.
 4. (Opcional, para ver la tableta) F12 → icono de móvil/tableta →
    elige «iPad Mini» → recarga. En la mesa debes ver la mesa del
    TELÉFONO ampliada (cartas grandes, botones altos), sin desplazar.
    Cierra F12 al terminar.

C · S25. 5 min.
 1. Abre la dirección en Chrome. Mesa de 5 en vertical y luego gira
    a horizontal; después mesa de 2 en las dos orientaciones.
    DEBES VER: EXACTAMENTE la mesa de hoy. Nada más grande ni más
    pequeño, nada movido.
 2. Toca el ⋮ y una reacción: salen donde siempre.

CERRAR: Ctrl+C en las dos terminales.
```

| Lo que ves | Qué significa | Qué haces |
|---|---|---|
| Todo como dice arriba | La tanda funciona | Avísale al rector: «TAB-1 bien» → ficha de commits |
| Laptop: hay barra de desplazamiento o el pie queda cortado | El factor no cabe en tu ventana real (quizá la ventana no está maximizada, o hay una barra de marcadores que roba alto) | Foto + dime si la ventana estaba maximizada y si tenías la barra de marcadores |
| Laptop: las letras pequeñas te parecen ilegibles | El piso de 10 px no basta para ti | Foto de cerca; se decide subir el piso |
| Monitor: la mesa no crece | El atributo no se escribe (fallo) | Foto + F12 → pestaña Elements → copia la primera línea `<html …>` |
| Una carta o una moneda vuela a un sitio raro | La corrección de los vuelos falla en tu máquina | Dime mesa y momento (reparto, descarte o pago) |
| El menú ⋮ se abre lejos del ⋮ | Una capa quedó sin convertir | Foto con el menú abierto |
| S25: algo cambió, por poco que sea | Rompe la regla del celular | Foto de hoy (de otra pestaña sin túnel, la app publicada) y la del túnel, lado a lado |
| iPad Mini (opcional): el aire entre el óvalo y tus cartas en la mesa de 4/5 te parece apretado | Es la pregunta 1 (H-2) | Dilo: decide entre aflojar la regla o achicar la mesa un 5 % |

---

## 9. Validación física

**Victor validó la tanda por túnel el 2026-10-21**, con la guía del §8:

| Aparato | Resultado |
|---|---|
| Laptop HP, 1366×623 | Bien |
| S25 | Bien, sin ningún cambio frente a ajilei.io |
| Tableta, emulada con F12 | Bien, sin queja del aire entre el óvalo y la mano en las mesas 4 y 5 |

Veredicto de Victor: **«pruebas al 100 %».**

**Limitación honesta:** la tableta se validó por emulación (el WebKit calibrado del arnés, modos `tam` y `webkit`, y Chrome en F12), no con un iPad físico. Las cifras de alto útil del iPad mini vienen de la Fase 0 y de la 1a; Safari en un iPad real no se ha mirado en esta tanda.

---

## 10. Resoluciones del rector

Ficha de commits v1.0 (2026-10-21), a las preguntas del §6:

| # | Resolución |
|---|---|
| 1 | **(a)** En vertical, P-hueco de las mesas 4 y 5 pasa a un **suelo absoluto ≥ 0,035** del alto de la mesa. Las demás P y las mesas 2 y 3 siguen igual. Victor lo vio y no le pareció apretado. La referencia **812 se mantiene** |
| 2 | **Sí.** En los pares de V-cel cuenta «idéntico o equivalente con la vara de `cap`», y la matriz T3 al byte sirve como prueba de geometría |
| 3 | **Sí.** Las capas convertidas a px propios (menú ⋮, contador, reacciones, celebración y monedas) se quedan en esta tanda |
| 4 | **Sí.** Se aceptan los multiplicadores de 42 px en 1133×658 |
| 5 | **Sí.** El aviso de saldo en un portal se queda como está; anotado como pendiente con dueño «ARN-4 o la campaña de avisos» |

**Nota del rector sobre el punto de control:** se acepta la desviación del §4.4, porque los modos sellados corrieron contra el árbol completo y salieron verdes. Para el futuro, un punto de control se cumple tal como está escrito.

### 10.1 · La vara nueva de P-hueco (C-0 de la ficha de commits)

- **El cambio:** `scripts/tab/tab.mjs`, `semaforo()` recibe la mesa; para las mesas 4 y 5, P-hueco es verde si vale al menos `SUELO_HUECO_45 = 0.035` del alto de la mesa. Las mesas 2 y 3 y las otras tres P conservan la regla del §4.3. V-tv solo mide vertical, así que el suelo no alcanza a la horizontal. INV-58 recoge la regla nueva, y la fila de `diagDSK tab` de la §6 de Invariantes recoge la vara de los pares de V-cel (resolución 2).
- **`diagDSK tab` completo** contra la referencia `main` en `9fef917` (4192), 927 s: **VERDE, las seis varas**. V-cel 25/25 (14 idénticos, 11 equivalentes) y T3 88/88 al byte; **V-tv 48/48**; V-h 24/24; V-vuelo peor 0,01 px en cartas y 0,02 en monedas y globo; V-fuera 12/12 idénticas, y entrar y salir 3/3; V-giro verde en los dos sentidos. Aislamiento verde (230 contextos).
- **P-hueco medido en las mesas 4 y 5** (la tabla del §4.3, ya con la vara nueva): el mínimo es **0,039**, en la mesa 4 a 744×1047, 834×1108 y 1024×1259; la mesa 5 queda entre 0,055 y 0,06, y 744×1100 da 0,08 y 0,09. Las 24 celdas, verdes.
- **Control rojo de la vara nueva:** con el suelo a 0,05, `TAB_SOLO='^744x1047 m4 '` sale **ROJO, 0/3** («P-hueco rojo: 0,0394 frente a 0,05» en reposo, turno y entre manos). Vuelto a 0,035, la misma celda sale verde, 3/3.
- **Varas generales tras el cambio:** vitest 1.654 verdes (71 archivos); lint 21 avisos, los mismos que en `main` (ninguno nuevo); build correcto.

### 10.2 · Hallazgo de la ficha de commits: el CSV de T3 en LF

- **Qué pasó:** al hacer el commit 4, Git avisó de que el CSV de la matriz de la Fase 0 se guardaba con finales LF (regla `* text=auto eol=lf` de `.gitattributes`). `leerT3` partía el archivo por `'\r\n'`, el CRLF que escribe el `csv` de Python. En la copia de trabajo el archivo seguía en CRLF y por eso V-cel salía verde aquí; en cualquier clon nuevo habría leído **una sola línea y ninguna fila de celular**, y T3 habría salido rojo, 0/88.
- **Arreglo** (opción (a) del rector, enmendando el commit 4 antes de publicar): `leerT3` parte por `/\r?\n/`, con un comentario de dos líneas sobre el porqué (`scripts/tab/tab.mjs:441`). Las celdas de la matriz no llevan saltos de línea, así que partir por los dos finales no cambia ninguna fila.
- **Comprobado:** el CSV restaurado desde el repo da `i/lf w/lf`; `leerT3` lee las 88 filas de celular; `diagDSK tab cel` contra la referencia del 4192 sale VERDE: T3 88/88 al byte y pares 25/25 (17 idénticos, 8 equivalentes); aislamiento verde. Sobre el commit 4 enmendado: build correcto y vitest 1.654 verdes.

### 10.3 · Pendientes con dueño

| Pendiente | Dueño | De dónde sale |
|---|---|---|
| **El aviso de saldo sobre la mesa ampliada:** vive en un portal fuera de `#root` y sale a su tamaño de hoy sobre la mesa ampliada | ARN-4 o la campaña de avisos | H-6, resolución 5 |
| **Dos comentarios desfasados dentro del protegido:** `gameTable.css:1121` («Scope: … y tablets») y `:1154` («Móvil vertical (<768px)») ya no describen lo que hacen sus bloques tras la puerta del traje A | Quien vuelva a abrir `gameTable.css` | H-12 |
| **R-2: las ventanas de 600 de alto o menos con ratón** (traje B, hoy sin atributo de escala) | Una sub-tanda propia de TAB-1 | §1 de la ficha 1b–1e, aplazada |
