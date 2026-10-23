# AJILEI · TAB-2 · Fase 0 · La mesa hasta los bordes · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Base:** `main` = `origin/main` = `abc2ebc`
**Tipo:** solo lectura y medida. Sin lámina, sin código y sin commits. **STOP.**
**Navegador de las sondas:** Chromium 151.0.7922.34 (el del arnés) · **Reloj:** 13:12 → 13:30 según `date` (el reloj de la sesión ya engañó otras veces; la corrida de `tab` sola duró 916 s), dentro del tope de 90 min

---

## 1. Resumen para Victor

1. **Las franjas no son un fallo de la mesa: son la «jaula» de la plantilla de Vite.** `#root` mide 1.126 px de ancho fijo (`src/index.css:58`) y la mesa vive dentro. Lo que sobra a los lados lo pinta el `body` con un verde casi negro y liso. La Portada, el lobby, Retar y Salas ya rompen esa jaula con una regla propia; la mesa nunca lo hizo.
2. **TAB-1 no las creó.** A 1920×929 medían **397 px por lado** antes de TAB-1 y hoy miden **330**: la escala ×1,119 las estrechó. En cambio, donde la mesa se reduce (laptop 1366×623, ×0,874) las **ensanchó**, de 120 a 191 px.
3. **Pasa en toda pantalla horizontal más ancha que la mesa:** laptops, monitores e iPad acostado. En el celular, la tableta vertical y las 12 pantallas fuera de la mesa, **0 px**.
4. **Hay un arreglo limpio que no toca protegidos:** soltar la jaula solo mientras la mesa está montada con escala, y devolverle a la mesa su mismo ancho por dentro con relleno. Es como quitar el marco de un cuadro y pintar la pared del mismo fieltro: el cuadro no cambia y el fieltro llega a los bordes **sin costura** y con el tapete elegido (lo probé con verde, vinotinto y tricolor).
5. **R-2 (ventanas bajas):** la frontera segura con el teléfono es el **ancho ≥ 1.024 px**. Ningún teléfono acostado llega a ese ancho (el más ancho que documenté ronda 1.006). Pero hay un matiz: en esas ventanas el traje C reducido muestra **cartas más pequeñas** que el traje del teléfono (76 frente a 101 px de ancho a 1280×577) y la frase sube de 9 a 11,3 px, pero no llega a 12. Conviene verlo en una lámina antes de decidir.
6. Los dos comentarios desfasados de `gameTable.css` están localizados y tienen texto propuesto. Los dos caen en líneas protegidas que **no** están en la apertura de TAB-1.

---

## 2. Arranque y línea base (T0)

| Comprobación | Resultado |
|---|---|
| `HEAD` / `origin/main` | `abc2ebc55f16…` los dos ✓ |
| `git status` | sin cambios en archivos con seguimiento. **Había sin seguimiento ajeno a TAB** desde antes: `docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md`, `docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md` y `laminas/mon1/` (3 archivos). No los toqué. Lo interpreté como «limpio» porque no es trabajo de esta campaña; si el rector lo lee de otro modo, es una puerta que no cerré yo. |
| `laminas/tab1/` | **no existe** en el proyecto (en `laminas/` hay `ajf1 bie1 idx1 mon1 mon2 voz2`). |
| Huellas de los protegidos (al empezar) | coinciden con la §3 de Protegidos v1.7 (tabla abajo). |
| vitest | **1.654** pasan ✓ |
| eslint | **21** problemas (20 errores, 1 aviso) ✓ = línea base |
| `vite build` | correcto ✓ |
| `diagDSK tab` (4173, `--sin-build` sobre el `dist/` recién compilado, `strictPort`) | **VERDE**: V-cel ✓ · V-fuera ✓ · V-h ✓ · V-tv ✓ · V-vuelo ✓ · V-giro ✓ · 916 s · aislamiento verde (214 contextos, 0 escapadas) → código 0. Corrió a la vez que las sondas de 4191/4192 y salió verde igual. |

**Protegidos** (lista de `docs/AJILEI_Protegidos_v1.0.md` §2, versión vigente v1.7), SHA-256 al empezar:

| Archivo | SHA-256 | Líneas |
|---|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a9010c727c5da4e1af039462d7aec58925bff7bf96719f6e0` | 748 |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddfa5e85d849ddfa1204113740da7a97b5bfce0f75714400801` | 1445 |
| `src/engine/deck.js` | `69f92d6b9aac433cb99e7ec23d6052af1a6aa66c0f61eee180ba8f045911aa82` | 69 |
| `src/config/seatLayouts.js` | `0049051fd4b8b891deb86066bb1eb89669e3509f18bb995d288232636b3ee30c` | 59 |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a489466aa9d07ac7c263ca137b3ee12177812ad9a62833f5a` | 1084 |
| `src/styles/gameTable.css` | `e97a1565c29bc5a6ebb846d65bfdb6770de05e48f9f67210cc93479a28103a4b` | 6289 |

**Dónde midieron las sondas.** El 4173 lo ocupaba el modo `tab` de la línea base. Las sondas corrieron contra dos `vite preview` propios con `--strictPort`, sin compilar: **4191** sirve el `dist/` de `abc2ebc` y **4192** sirve la build de `9fef917` (copia por `git archive` en el scratchpad, compilada con `envDir` apuntando al repo). Es el mismo esquema de puertos que usó TAB-1.

---

## 3. T1 · Las franjas: quién pinta cada zona

La captura de Victor (Chrome maximizado, mesa de 2) se reproduce a 1920×929: `t1_act_1920x929_m2_reposo.png`.

| Zona | Elemento que la pinta | Regla | Fondo | Ancho por lado a 1920×929 | ¿Dentro de `#root`? ¿Le afecta el `zoom`? |
|---|---|---|---|---|---|
| **1 · Borde exterior casi negro** | `body` | `src/styles/welcome.css:1-7` (`body { min-height: 100vh; background: var(--green-abyss) }`) | color liso `#09170e` (verde abisal); **sin filigrana ni degradado**. Con otro tapete, el abisal de ese tapete (`tapetes.css:158-256` redefine el token en `body[data-tapete]`) | **330** a la izquierda y **331** a la derecha (el píxel de más es el borde transparente de `#root`) | **fuera** de `#root`: sin `zoom` |
| (filo) | borde de `#root` | `src/index.css:62` `border-inline: 1px solid var(--border)` | `--border` resuelve **transparente** en la mesa, así que se ve el `body`. 0,89 px visibles (1 px propio × 1,119) | 1 | es el borde del propio `#root` (zoomed) |
| **2 · Banda intermedia con dibujo** | `main.game-table-screen` | `src/styles/gameTable.css:5-17` | `var(--filigrana)` (dos `repeating-linear-gradient` a ±45°, periodo 29 px, oro al 5 %, `theme.css:107-117`) + `radial-gradient(circle at center, --green-base 0 %, --green-deep 55 %, --green-darkest 100 %)`. `background-size` y `attachment` por defecto (cubre la caja, se desplaza con ella) | caja de 1.258 px visibles (1.124 propios × 1,119), de x = 331 a 1.589 | **dentro**: el dibujo sale ampliado ×1,119 (periodo visible 32,5 px) |
| **3 · La mesa** | `.game-table` | `gameTable.css:19-34` | `var(--surface-game)` (verde al 88 %) | — | dentro, ampliada |

Detrás de todo, el **lienzo** lo pinta `html` (`src/index.css:22`, `background: var(--bg)`). En el esquema claro es **blanco** (`#fff`) y en el oscuro `#16171d`. Como `html` tiene fondo propio, el del `body` no se propaga al lienzo: el `body` solo cubre su caja de `min-height: 100vh`. No llega a verse en ninguna celda medida (el documento no desplaza), pero un rebote de desplazamiento o un `body` más corto que la ventana enseñaría blanco. Es un aparte de baja prioridad.

**El mecanismo.** No es un `vw/vh` ni un contenedor sin estirar: es el **ancho fijo** de la plantilla de Vite, `#root { width: 1126px; max-width: 100%; margin: 0 auto }` (`src/index.css:57-67`). Con TAB-1, `#root` lleva `zoom: var(--escala)` (`src/styles/escala.css:30-33`) y su ancho visible pasa a ser `1126 × f`. Por eso cada lado mide **(ancho − 1.126·f) / 2** cuando es positivo, en todas las celdas (§4). La pantalla de mesa ocupa el 100 % de ese `#root` y el 100 % del alto (`100dvh`, o su gemela `/escala`), así que **arriba y abajo nunca queda hueco**.

**La Portada, como contraste.** Llena la pantalla porque **rompe la jaula**: `body.portada-activa #root { width: 100%; max-width: none; border-inline: 0 }` (`src/styles/portada.css:30-35`), y su lienzo `.pue-lienzo` (`portada.css:52-70`) pinta `var(--filigrana)` + `radial-gradient(ellipse at 42% 38%, --green-bright, --green-deep 50 %, --green-abyss 100 %)`. **No usa imagen**: el recurso común es el token `--filigrana`, y el degradado es otro (elipse descentrada y más claro). El lobby (`lobby.css:36`) y Salas (`salas.css:30`) copian el mismo molde. La mesa es la única pantalla que conserva la jaula. Es un arrastre de EMB-2: `useTapetes.js:107-115` y `tapetes.css:27-35` ya describían «~400 px de vacío a cada lado» y lo resolvieron **tiñendo** el vacío, no llenándolo.

**«El tapete del color del juego».**
- La mesa elige su tapete con `useTapetes` (`src/hooks/useTapetes.js:54`): lo lee de `localStorage` (`ajilei.tapete`) y lo escribe como `body[data-tapete="…"]` (`:124-128`) **solo mientras la mesa vive**. Cada tapete es una redefinición de tokens (`--green-*`, `--surface-*`) en `body`; el tricolor sustituye además el fondo de `.game-table` y `.game-table-screen` (`tapetes.css:267-301`).
- Las franjas **ya siguen el tapete en color**, porque `--green-abyss` se redefine en `body`. Lo que no tienen es ni filigrana ni degradado (vinotinto: `#1b080d` liso; tricolor: `#0c131c` liso).
- **La Portada usa siempre el verde:** el atributo no existe fuera de la mesa, y en la Portada ni siquiera hay sesión.
- **PvP:** aún no hay mesa PvP. `src/screens/PartidaPvP.jsx` es un stub con el traje de Salas (`.sal`, a ancho completo) hasta MES-PvP. Como el tapete es local (`localStorage` + `body`), cuando exista cada jugador verá el suyo sin hacer nada más, siempre que la mesa PvP monte `useTapetes`.

**Antes y después de TAB-1** (build de `9fef917` en 4192, misma sonda):

| Ventana | Antes (`9fef917`, f = 1) | Hoy (`abc2ebc`) | Efecto de TAB-1 |
|---|---|---|---|
| 1920×929 | **397 / 398** | **330 / 331** (f 1,119) | **las estrechó** 67 px por lado |
| 2560×1290 | 717 / 718 | 548 / 549 (f 1,3) | las estrechó |
| 3440×1290 | 1.157 / 1.158 | 988 / 989 (f 1,3) | las estrechó |
| 3840×1960 | 1.357 / 1.358 | 1.188 / 1.189 (f 1,3) | las estrechó |
| 1440×760 | 157 / 158 | 157 / 158 (f 1) | ninguno |
| 1180×820 | 27 / 28 | 27 / 28 (f 1) | ninguno |
| 1366×623 | 120 / 121 (y la pantalla desplazaba 57 px) | **191 / 192** (f 0,874) | **las ensanchó** 71 px por lado |
| 1133×658 | 3,5 (cálculo: 1.133 − 1.126) | 47 / 48 (f 0,923) | las ensanchó |

**Respuesta:** las franjas existían antes de TAB-1. **TAB-1 no las creó**: las estrechó donde la mesa crece y las ensanchó donde la mesa se reduce. Capturas: `t1_ref_1920x929_m2_reposo.png` frente a `t1_act_1920x929_m2_reposo.png`.

---

## 4. T2 · El barrido: ¿dónde más pasa?

Se midieron 160 celdas de mesa (mesas 2, 3, 4 y 5 × reposo y turno × 20 tamaños), sin un solo fallo de medida, más 80 celdas fuera de la mesa (lobby, Retar, Salas y Armar mesa × 20 tamaños). Hay dos instrumentos que coinciden:
1. **quién pinta:** desde cada borde hacia dentro, en tres líneas, cuántos píxeles seguidos pinta `html`, `body` o `#root` (vía `elementFromPoint` hasta el primer antepasado con fondo);
2. **el color del píxel** en el borde, leído de la captura.

La «columna de 1 px» que la sonda marca a la derecha y abajo en **todas** las celdas es del instrumento (`elementFromPoint` en W − 0,5 no devuelve nada). El píxel en W − 2 es tapete en todas, así que se cuenta como 0.

**Resumen por grupo** (franja por lado, en px visibles; arriba y abajo, 0 en todas las celdas). La franja no depende de la mesa (2 a 5) ni del estado:

| Grupo | Tamaño | Atributo · f | Franja por lado | Color |
|---|---|---|---|---|
| Celular (control) | 412×915, 915×412, 390×844, 360×640 | — · 1 | **0** | — |
| Tableta vertical | 744×1047 · 744×1100 · 820×1180 · 1024×1366 | tv · 1,289 / 1,301 / 1,434 / 1,6 | **0** | — |
| Tableta horizontal | 1133×658 | h · 0,923 | **47** | `#09170e` liso |
| | 1133×716 pantalla completa | h · 0,965 | **23** | `#09170e` |
| | 1180×820 | h · 1 | **27** | `#09170e` |
| | 1366×1024 | h · 1,213 | **0** | — |
| Laptop | 1366×623 (Victor) | h · 0,874 | **191** | `#09170e` |
| | 1280×577 | **— (traje B)** · 1 | **77** | `#09170e` |
| | 1440×760 | h · 1 | **157** | `#09170e` |
| | 1536×730 | h · 1 | **205** | `#09170e` |
| Monitor | 1920×929 (Victor) | h · 1,119 | **330** | `#09170e` |
| | 2560×1290 | h · 1,3 | **548** | `#09170e` |
| | 3440×1290 (ultrapanorámico) | h · 1,3 | **988** (57 % de la pantalla) | `#09170e` |
| | 3840×1960 | h · 1,3 | **1.188** (62 %) | `#09170e` |
| **Fuera de la mesa** (las 12 de V-fuera × 20 tamaños = 80 celdas) | todos | sin atributo | **0** en las 80 | — |

Las ventanas de R-2, medidas hoy en el traje B (§6), también tienen franja cuando son más anchas que 1.126: 1366×520 → 120, 1920×560 → 397, 1242×566 → 58, 1133×500 → 4. Las de menos de 1.126 de ancho no tienen.

**iPad horizontal a pantalla completa (R-7).** La banda de ≈28 px del pie **no es de la página**: es una capa que Safari pinta **encima** (TAB-1 Fase 0, TF-11: «tapa el pie»; corta en recto el borde de la zona del jugador). No se puede teñir desde CSS. Lo que hay **debajo** es tapete: la pantalla de mesa ocupa el 100 % del alto (abajo, 0 px sin tapete en 1133×716). El color de la banda en sí solo se ve en las fotos del iPad de la Fase 0 («oscura»); el WebKit de Windows no la reproduce. Lo que sí es nuestro en esa ventana son **23 px de franja a cada lado**.

**Archivos** (en el scratchpad, `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\d970e55e-5c62-4e74-a6db-a1fdf923456f\scratchpad\`):
- CSV: `barrido_act.csv` (160 filas), `fuera_act.csv` (80), `ref_ref.csv` (8, `9fef917`); los JSON completos son `sonda_*.json`.
- Capturas clave, en `fotos\`:
  - `t1_ref_1920x929_m2_reposo.png`: **antes** de TAB-1, franjas de 397;
  - `t1_act_1920x929_m2_reposo.png`: **hoy**, franjas de 330;
  - `bar_act_3440x1290_m2_reposo.png`: el ultrapanorámico, el peor caso;
  - `bar_act_1366x623_m2_reposo.png`: la laptop de Victor, franjas de 191;
  - `bar_act_1133x716fs_m2_reposo.png`: el iPad a pantalla completa;
  - `proto_m2b_1920x929_m2.png` y `proto_m3_1920x929_m2.png`: los dos mecanismos de §5;
  - `costura_m2b_1920x929.png` y `costura_m3_1920x929.png`: recortes de 180×240 sobre el antiguo borde de `#root`;
  - `r2_act_1280x577_m5_turno.png` y `r2sim_1280x577_m5_ajuste.png`: R-2, hoy frente a C simulado.

---

## 5. T3 · Cómo podría resolverse (sin escribir código)

Probé cuatro variantes **solo en el navegador** (`addStyleTag` tras llegar a la mesa) en 11 tamaños × mesas 5 y 2 (66 celdas). Las cuatro van en `escala.css` bajo `html[data-escala…]`.

| | Mecanismo | Franja que queda | Costura (Δ de luz en el antiguo borde, 9 alturas) | Geometría de la mesa | Celular |
|---|---|---|---|---|---|
| **M1** | capa `position: fixed` fuera de `#root` (`body::before`, `z-index: -1`) con el fondo de la pantalla | **igual que hoy**: el fondo del `body` se pinta encima de un hijo con `z-index` negativo (orden de pintado del contexto raíz). Para verse, tendría que vaciar el fondo del `body` o crear contextos de apilado, y entonces es M3 | — | idéntica | idéntico |
| **M2** | `html[data-escala] #root { width: auto; max-width: none; margin: 0 }` (la Portada, con alcance de escala) | **0** en las 22 celdas | **sin costura**: ≤ 1,7, salvo cruces sueltos de una línea de filigrana (4–7) | ✗ **mesas 5 (y 4) se ensanchan** hasta 16 px propios (1084 → 1100 a 1180×820; +17,7 visibles a 1920×929), porque su ancho lo limitaba la jaula | idéntico |
| **M2b** | M2 solo con `="h"` **más** `.game-table-screen { padding-inline: max(20px, calc((100% − 1124px) / 2 + 20px)) }`: el contenido conserva sus 1.084 propios de hoy | **0** en las 22 | **sin costura** (≤ 1,7 y los mismos cruces de línea) | **idéntica** con f = 1 (1180×820 y 1440×760: igual al píxel); con f ≠ 1, deriva subpíxel ≤ 0,6 px (m5 1366×623: x 209,41 → 209,28) por el redondeo bajo `zoom` | idéntico |
| **M3** | el `body` pinta el tapete: `html[data-escala] body { background: var(--filigrana), radial-gradient(…); background-attachment: fixed }` | 0 de «vacío», pero el tapete de fuera es **otro** | **costura visible**: Δ −6 a −24 en todas las alturas (dos degradados distintos que se encuentran en una línea recta) y dibujo a dos escalas (periodo 29 px fuera, 29·f dentro: 32,5 a ×1,119 y 37,7 a ×1,3) | idéntica | idéntico |

**Las seis preguntas, para M2b (la recomendada):**
1. **Protegidos:** no toca ninguno. Va entera en `src/styles/escala.css`, que no está protegida, y gana por especificidad (`html[data-escala="h"] #root` = 1,1,1 contra el 1,0,0 de `#root`, sin `!important`), con el mismo molde que `portada.css:30`.
2. **Celular idéntico al píxel:** sí, por construcción, porque el celular no recibe `data-escala` y no evalúa la regla. Medido: 412×915 y 915×412, sin cambio de geometría. La vara V-cel del modo `tab` lo seguiría vigilando.
3. **«La escala solo en la mesa»:** sí. La regla vive bajo el atributo que `useEscalaMesa` escribe al montar la mesa y borra al desmontarla.
4. **Costura:** no hay, porque fuera y dentro son el **mismo elemento**, que está dentro del `zoom`: un único dibujo a escala f de borde a borde. Lo que sí cambia es el **degradado radial**: se estira a toda la ventana, así que el halo claro alrededor de la mesa se ensancha y las esquinas oscurecen hacia `--green-darkest` (`proto_m2b_1920x929_m2.png`). Es un cambio de aspecto, no un defecto, pero es la razón principal para hacer **lámina**.
5. **Rendimiento:** no hay imagen; son tres degradados CSS. A 3840×1960, la caja pintada pasa de 1.464×1.960 (2,9 Mpx) a 3.840×1.960 (7,5 Mpx). Es un fondo estático (la pantalla no desplaza). **No lo medí en fps**; el riesgo es bajo, pero una vara de rendimiento barata sería contar los repintados de la pantalla durante una mano en 3840×1960.
6. **Tapete elegido:** sí. Probado a 1920×929 con vinotinto y tricolor (`tapete_*_m2b.png`): el borde pasa de `#1b080d` liso a `#2a0b14` (tapete con degradado) y de `#0c131c` a `#111d2b` respectivamente. En PvP valdrá igual (tokens en `body`).

**Lo que M2b no cubre:** las ventanas **sin atributo** más anchas que 1.126, que hoy caen en el traje B (1280×577, 1366×520, 1920×560, 1133×500). Se cubren solas si R-2 las pasa a `h` (§6). Si R-2 se aplazara, haría falta una marca de mesa que excluya al celular (una clase en `body` desde la mesa, o un atributo `hb` en `useEscalaMesa`), y eso choca con «el celular no lee una regla nueva» si se hace sin cuidado. **R-2 y los bordes se resuelven mejor juntos.**

**¿Lámina? Sí, corta.** Hay más de una manera razonable de verse el fondo estirado. Debería mostrar, a 1920×929 y 3440×1290, mesa de 2 y de 5, en verde y en tricolor:
- (a) hoy;
- (b) M2b con el degradado estirado;
- (c) M2b con el degradado acotado (por ejemplo, el radial con un tamaño fijo centrado en la mesa y `--green-darkest` hacia fuera), por si (b) aclara demasiado los lados del ultrapanorámico.

M3 solo como contraste, para que se vea la costura.

**Recomendación:** M2b, dentro de `escala.css`, junto con R-2.

---

## 6. T4 · R-2: las ventanas bajas

### 6.1 Lo que reciben hoy (medido en turno, mesas 5 y 2)

Todas estas ventanas reciben el **traje B** (`(orientation: landscape) and (max-height: 600px)`), sin atributo y con f = 1. Ninguna desplaza. Valores en px visibles:

| Ventana | Traje | Frase m5 / m2 | Carta del jugador | Botón más bajo (×1…×10) | Etiquetas | `hover` · `pointer` | Franja |
|---|---|---|---|---|---|---|---|
| 1280×577 | B | **9** / 12 | 101×143 | 30×23 | 10 | hover · fine | 77 |
| 1242×566 (1366×768 al 110 %) | B | 9 / 12 | 101×143 | 30×23 | 10 | hover · fine | 58 |
| 1093×498 (al 125 %) | B | 9 / 12 | 101×143 | 30×23 | 10 | hover · fine | 0 |
| 1024×600 (netbook) | B | 9 / 12 | 101×143 | 30×23 | 10 | hover · fine | 0 |
| 1366×520 | B | 9 / 12 | 101×143 | 30×23 | 10 | hover · fine | 120 |
| 1920×560 | B | 9 / 12 | 101×143 | 30×23 | 10 | hover · fine | 397 |
| 980×560 (iPad en ventana) | B | 9 / 12 | 101×143 | 30×23 | 10 | **none · coarse** | 0 |
| 1133×500 (iPad en ventana) | B | 9 / 12 | 101×143 | 30×23 | 10 | none · coarse | 4 |
| *control* 1366×623 | C ×0,874 | 12,24 | 82×116 | 35×23,5 | 10 | hover · fine | 191 |

(En la emulación, «iPad» es un contexto táctil de Chromium: `hover: none`, `pointer: coarse`.)

El problema de R-2 se confirma: es la **frase de 9 px en las mesas 4 y 5**. Las cartas de B son en cambio **grandes**: 101 px frente a 82 en C. Captura: `r2_act_1280x577_m5_turno.png`, que es la mesa del teléfono acostado estirada a 1.280 de ancho.

### 6.2 La frontera con el celular

**Viewports de teléfonos grandes en px CSS** (vertical; acostado se intercambian, y el alto pierde la barra del navegador):

| Teléfono | Viewport | Acostado: ancho máx. | `hover` · `pointer` |
|---|---|---|---|
| iPhone 16/17 Pro Max | 440×956 (dpr 3) | 956 con `viewport-fit=cover`; **sin él** (hoy AJILEI no lo pide) Safari estrecha a ≈832–880 (IOS-1 1f) | none · coarse |
| iPhone 15 Plus / Pro Max | 430×932 | 932 | none · coarse |
| Galaxy S25 Ultra | 412×891 (dpr 3,5) | 891 | none · coarse |
| Galaxy S25 (el del arnés) | 412×915 | 915 | none · coarse |
| Galaxy Z Flip 6 (interior) | ≈411×1.006 (2.640 px / 2,625, estimado) | **≈1.006**, el más ancho que encontré | none · coarse |
| Xperia 1 (21:9) | ≈411×960 | 960 | none · coarse |
| Galaxy Z Fold 6, exterior | ≈369×905 (968×2.376 / 2,625, estimado) | ≈905 | none · coarse |
| Galaxy Z Fold 6, interior | ≈707×823 (1.856×2.160 / 2,625, estimado) | lado corto ≈707 ≥ 600 → **ya hoy no es «celular»** para `escala.js` (cae en `tv` o `h`) | none · coarse |
| Pixel 9 Pro Fold, interior | ≈790×820 (estimado) | ídem: no es celular | none · coarse |

Fuentes: [YesViz, viewport por dispositivo](https://yesviz.com/viewport.php), [iPhone 17 Pro Max](https://yesviz.com/devices/iphone-17-pro-max/), [Galaxy S25 Ultra](https://yesviz.com/devices/samsung-s25-ultra/), [GSMArena, Z Fold6](https://m.gsmarena.com/samsung_galaxy_z_fold6-13147.php), [SamMobile, pantallas del Z Fold 6](https://www.sammobile.com/news/galaxy-z-fold-6-display-size-detailed/). Las cifras marcadas «estimado» salen de píxeles físicos ÷ dpr. Las del Flip y el Fold conviene verificarlas con un dispositivo o con las DevTools antes de sellar.

**Discriminadores:**

| Discriminador | Teléfonos que atraparía por error | Ventanas que dejaría fuera (seguirían en B) |
|---|---|---|
| **Ancho ≥ 1.024** (solo en horizontal) | **ninguno**: el más ancho, el Flip acostado, ronda 1.006, a 18 px de margen. Un plegable abierto ya no es celular por su lado corto | 980×560 (iPad en ventana estrecha). Cualquier ventana de menos de 1.024 de ancho |
| `(hover: hover) and (pointer: fine)` | un teléfono con ratón o en modo escritorio (DeX, ratón Bluetooth): `pointer` puede pasar a `fine` y le daría C con 400 de alto. Raro, **pero no imposible** | **los dos iPad en ventana** (`coarse`), y cualquier laptop táctil que informe `coarse` |
| Ancho ≥ 1.024 **o** (`hover` y `fine`) | los del caso anterior | ninguno de la lista, salvo el iPad estrecho con dedo |
| Ancho ≥ 1.024 **y** `fine` | ninguno | los iPad en ventana (los dos) |

**Recomendación: ancho ≥ 1.024 solo.** Es la única que **nunca** atrapa un teléfono por construcción (no depende del periférico), coincide con el corte del lado ancho de un iPad y deja fuera únicamente el iPad en ventana de menos de 1.024, que hoy ya funciona en B. La regla quedaría así:
- **celular** = lado corto < 600 **y**, en horizontal, ancho < 1.024;
- **horizontal-b** desaparece (o queda solo para la franja ancho < 1.024, alto ≤ 600, lado corto ≥ 600, que es vacía en horizontal);
- **h** = horizontal con alto > 600 **o** ancho ≥ 1.024.

### 6.3 El traje C con su factor (simulado, solo en el navegador)

**Cómo:** en el contexto de la sonda, `matchMedia` reescrito y las 20 reglas `@media` del bundle reescritas en el CSSOM. B no casa nunca y la puerta de 601 casa siempre. Después, `data-escala="h"` y `--escala` a mano. Ojo: el bundle minificado usa **sintaxis de rango** (`(height<=600px)`, `(height>=601px)`), y un primer intento que buscaba `max-height` no reescribió nada. Esa corrida se descartó.

**Los px de aire que habría que quitar con el suelo sellado (0,87).** La mesa de 5 de C necesita 713 propios (`escala.js`, `REF.hBaja`). Desbordamiento medido de la pantalla, en px propios (≈ teórico 713 − alto/0,87):

| Ventana | m5 | m2 |
|---|---|---|
| 1024×600 | 22 | 0 |
| 1280×577 | 49 | 16 |
| 1242×566 | 61 | 28 |
| 1920×560 / 980×560 | 68 | 35 |
| 1366×520 | 114 | 81 |
| 1133×500 | 137 | 104 |
| 1093×498 | 140 | 107 |

La estimación de TAB-1 (10–27 px) solo vale para la franja 590–600. Por debajo, **el suelo 0,87 no es compatible con no desplazar**.

**El factor que tocaría sin suelo, f = alto/713:**

| Ventana | f | Frase | Carta | Botón más bajo | Etiquetas | Desplaza (m5/m2) |
|---|---|---|---|---|---|---|
| 1024×600 | 0,842 | 11,8 | 79×112 | 33,7×23,1 | 10 | 0 / 0 |
| 1280×577 | 0,809 | 11,3 | 76×108 | 32,5×22,7 | 10 | 1 / 0 |
| 1242×566 | 0,794 | 11,1 | 75×106 | 31,9×22,5 | 10 | 1 / 0 |
| 1920×560 / 980×560 | 0,785 | 11,0 | 74×104 | 31,6×22,4 | 10 | 1 / 0 |
| 1366×520 | 0,729 | 10,2 | 69×97 | 29,5×20,7 | 10 | 2 / 0 |
| 1133×500 | 0,701 | 9,8 | 66×93 | 28,4×20,4 | 10 | 2 / 0 |
| 1093×498 | 0,698 | **9,8** | 66×93 | 28,3×20,4 | 10 | 2 / 0 |

- **Etiquetas pequeñas:** se cumple el suelo de **10 px** en todas, porque la regla `max(10px, 10px / f)` de `escala.css:135` ya lo asegura.
- **Frase:** sube de 9 a 9,8–11,8 en las mesas 4 y 5 (mejora), pero **ninguna llega a los 12 px** que exige V-h (`PISO_FRASE`), y en la mesa de 2 empeora (de 12 a 9,8–11,8).
- **Cartas:** **más pequeñas** que en B (66–79 frente a 101). Es el precio de pasar de «el teléfono acostado a lo ancho» a «la mesa de escritorio reducida».
- **Desplaza:** 1–2 px residuales en la mesa de 5. Con referencia 715 en vez de 713, o con `floor` del factor a la milésima por abajo, quedaría en 0.

**Las 4 líneas protegidas de la puerta de C** (texto actual) y la transformación que propongo, **solo de condición** (molde §7.5):

| Archivo:línea | Hoy | Propuesta |
|---|---|---|
| `gameTable.css:1130` | `@media (min-width: 768px) and (min-height: 601px) and (orientation: landscape) {` | `@media (min-width: 768px) and (min-height: 601px) and (orientation: landscape), (min-width: 1024px) and (orientation: landscape) {` |
| `gameTable.css:2397` | `@media (orientation: landscape) and (max-height: 600px) {` | `@media (orientation: landscape) and (max-height: 600px) and (max-width: 1023px) {` |
| `gameTable.css:4251` | `@media (orientation: landscape) and (min-height: 601px) {` | `@media (orientation: landscape) and (min-height: 601px), (orientation: landscape) and (min-width: 1024px) {` |
| `opponentPanel.css:261` | `@media (orientation: landscape) and (max-height: 600px) {` | `@media (orientation: landscape) and (max-height: 600px) and (max-width: 1023px) {` |

`:1114` (`min-height: 900px`) no cambia: estas ventanas nunca llegan a 900. Las `@media (max-height: 800px)` anidadas dentro de `:4251` se aplican solas (≤ 600 ⊂ ≤ 800).

**Rangos que Victor tendría que autorizar:** `gameTable.css` **1130, 2397 y 4251** y `opponentPanel.css` **261**, una línea cada uno, solo condición. Además, si se aprueba §7, los comentarios (§7). Hermanas **no protegidas** con la misma transformación (≈ 20 reglas, todas por `grep '(max-height: 600px)|(min-height: 601px)'`):
- espejos JS: `GameTable.jsx:108,123`, `Reacciones.jsx:114-115` y `useUtilitiesMenu.js:56`;
- hojas: `apu.css:412`, `celebracion.css:259,325,476`, `embellecimiento.css:520`, `luz.css:66,75,234`, `menuMovil.css:61,159` y otras, `tactil.css` (3) y `voz2.css` (2);
- clasificación: `escala.js` (`clasificar`, `factorDe`) y su prueba.

El factor de esta clase necesita una decisión propia (§8, pregunta 3).

---

## 7. T5 · Los dos comentarios desfasados

Los dos están en `gameTable.css` (protegido entero). **Ninguno** cae en las cuatro líneas que abrió §7.5 (1114, 1130, 1165 y 645 de opponentPanel), aunque los dos son vecinos de ellas. Tampoco caen en las líneas de la puerta de C propuestas en §6.3. Editarlos exige autorizar sus rangos de comentario. No los he tocado.

**Comentario 1, `gameTable.css:1119-1129`** (justo encima de la puerta `:1130`). Texto actual de la parte desfasada:
> `Scope: (min-width:768) and (min-height:601) → cubre escritorio, laptop landscape >600px y tablets, y NO solapa con los bloques móviles (portrait max-width:767 / landscape max-height:600). 2 y 3 jug no se tocan.`

Qué quedó viejo: desde TAB-1 1d la media lleva `and (orientation: landscape)`, así que **ya no cubre las tabletas en vertical** (van al traje A ×f), y el bloque vertical ya no es `portrait max-width:767`, sino `(orientation: portrait)` a secas (`:1165`).

Texto propuesto (líneas 1127-1129):
> `Scope: (min-width:768) and (min-height:601) and (orientation:landscape) → escritorio, laptop y tableta EN HORIZONTAL de más de 600 de alto (TAB-1 1d: la tableta vertical va al traje A ×f). NO solapa con los bloques móviles (portrait / landscape max-height:600). 2 y 3 jug no se tocan.`

Si R-2 se aprueba, se añade: `… o de 1024 de ancho en adelante (TAB-2)`.

**Comentario 2, `gameTable.css:1153-1164`** (justo encima de `:1165`). Texto actual de la parte desfasada:
> `── Móvil vertical (<768px) — Tanda C4.2 ──` · `… → cero impacto en desktop (≥768px) ni en otras pantallas.` · `C5.1: acotado a `orientation: portrait` — antes era solo `max-width: 767px`, … Con esta condición el bloque vertical es exclusivo de portrait …`

Qué quedó viejo: el título y el «cero impacto en ≥768px» dicen que el bloque es solo de teléfonos de menos de 768. Desde TAB-1 1d la condición es `(orientation: portrait)` **sin ancho**: vale para **toda** ventana vertical (tabletas incluidas, ampliadas por `escala.css`). La nota C5.1 describe una condición, `max-width: 767px and portrait`, que ya no existe.

Texto propuesto:
> título: `── Vertical (traje A) — Tanda C4.2 · TAB-1 1d ──` · frase de impacto: `… → cero impacto en horizontal (escritorio, laptop, teléfono acostado) ni en otras pantallas.` · y tras la nota C5.1 una línea nueva: `TAB-1 1d (Protegidos v1.7 §7.5): sin el max-width — el traje A vale para TODA ventana vertical; de 600 de lado corto en adelante lo amplía escala.css (data-escala="tv").`

---

## 8. Preguntas al rector

1. **Mecanismo de los bordes.** ¿M2b (soltar `#root` bajo `data-escala="h"` y conservar el ancho de contenido con relleno, en `escala.css`, sin protegidos)? **Recomiendo sí.** M2 queda descartado porque ensancha la mesa de 5, y M3 porque deja costura.
2. **Lámina antes del código.** ¿Una lámina corta con hoy / M2b con el degradado estirado / M2b con el degradado acotado, a 1920×929 y 3440×1290, mesas 2 y 5, en verde y en tricolor? **Recomiendo sí**: el degradado estirado cambia el halo alrededor de la mesa y el ojo de Victor decide.
3. **R-2, el factor.** Por debajo de 601 de alto, el suelo 0,87 desborda de 22 a 140 px. Opciones:
   - (a) f = alto/713 sin suelo (mínimo 0,698 a 1093×498), frase 9,8–11,8;
   - (b) un suelo nuevo, por ejemplo 0,78, y que las ventanas por debajo de ≈556 de alto desplacen;
   - (c) dejar R-2 en B y arreglar solo la frase de B para esta clase.

   **Recomiendo (a)** con referencia 715 (0 px de desplazamiento) y llevar a la lámina el caso 1280×577 m5: B tiene cartas más grandes y C se lee como escritorio. Que Victor elija mirando.
4. **R-2, la frase.** Con (a), ninguna de estas ventanas llega a los 12 px de V-h. ¿Se rebaja la vara para la clase baja a ≥ 10 (el suelo de etiquetas), o se busca un `max(12px, …/f)` en la frase, con su medida de O1 dentro del óvalo? **Recomiendo** la vara ≥ 10 para alto ≤ 600 y medir O1 antes de tocar la letra.
5. **R-2, la frontera.** ¿Ancho ≥ 1.024 solo, aceptando que el iPad en ventana de menos de 1.024 siga en B? **Recomiendo sí.** Ningún teléfono documentado llega, y es independiente del periférico.
6. **Orden.** ¿R-2 y los bordes en la misma campaña? **Recomiendo sí**: con R-2, M2b cubre también 1280×577, 1366×520, 1920×560 y 1133×500. Sin R-2, esas ventanas necesitarían otra marca de mesa, con riesgo para el celular.
7. **Comentarios.** ¿Autorizar sus rangos de solo comentario (`gameTable.css:1127-1129` y `:1153-1164`) en la misma apertura que la puerta de C? **Recomiendo sí**, en el mismo commit que las cuatro líneas y con la huella re-medida (§5 de Protegidos).
8. **Aparte.** El lienzo de `html` es blanco en el esquema claro (`index.css:22`), detrás del `body`. ¿Lo dejamos anotado para una campaña de higiene (y MES-PvP)? **Recomiendo** anotarlo, sin tocarlo en TAB-2.

---

## 9. Plan propuesto

| Sub-tanda | Qué | Vara nueva | Estimación (Claude Code) |
|---|---|---|---|
| **2a · Lámina** | `laminas/tab2/` con la receta de TAB-1 1a (iframes de la app real con estilo inyectado): bordes (hoy / M2b estirado / M2b acotado / M3 de contraste) y R-2 (B frente a C×f a 1280×577, 1093×498 y 1024×600) | — (la mira Victor) | 45–60 min |
| **2b · Bordes (código)** | M2b en `escala.css` (2 reglas), más su gemela del degradado si la lámina la pide | **V-borde**: «ningún píxel sin tapete fuera del celular». En cada celda con atributo, los cuatro bordes los pinta `.game-table-screen` (la sonda de §4, `elementFromPoint` + píxel), y la geometría de la mesa no cambia frente a la escala sin M2b (≤ 0,75 px con f ≠ 1, igual al píxel con f = 1) | 30 min |
| **2c · R-2 (código)** | las 4 líneas protegidas + ≈ 20 hermanas + `escala.js` (`clasificar`, `factorDe`, `LADO_CELULAR` con el ancho) + pruebas + comentarios §7 + Protegidos v1.8 §7.6 con las huellas | V-h ampliada a la clase baja: no desplaza, etiquetas ≥ 10, frase ≥ la vara que decida el rector; **V-frontera**: la matriz de teléfonos de §6.2 (incluido 1006×411) sin atributo y en B, byte a byte frente a hoy | 60–75 min |
| **2d · Arnés** | `tab.mjs`: V-borde, los 8 tamaños de R-2 en V-h y la frontera en V-cel; `diagDSK tab` completo verde; `tam`, `retar` y `webkit` verdes | — | 30–40 min + corridas (`tab` ≈ 15 min) |

---

## 10. Cierre

**Creado en el scratchpad** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\d970e55e-5c62-4e74-a6db-a1fdf923456f\scratchpad\`):
- `sonda.mjs` (modos `t1`, `barrido`, `fuera`, `ref`, `r2`, `r2sim`, `proto`, `tapete`), `resumen.cjs` y `buildref.mjs`;
- los JSON `sonda_*.json` y los CSV `barrido_act.csv`, `fuera_act.csv` y `ref_ref.csv`;
- `fotos\` (40 PNG), `huellas_ini.txt` y `diag_tab.log` (la línea base del modo `tab`);
- `ref9fef\`: la copia de `9fef917` con su `dist/` y su `.vite-cache`.

**⚠ Carpeta con unión `node_modules`:**
- `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\d970e55e-5c62-4e74-a6db-a1fdf923456f\scratchpad\ref9fef\node_modules` → **unión** a `C:\Users\victo\OneDrive\Documents\ajilei\node_modules`. **Quítala con `rmdir` antes de borrar `ref9fef`**: un borrado recursivo que la siga vaciaría el `node_modules` del proyecto. No la he borrado.

**Huellas al terminar:** las seis **idénticas** a las del arranque (§2). `huellas_ini.txt` y `huellas_fin.txt` en el scratchpad, comparadas con `diff`: sin diferencias.

**`git diff --stat`:** vacío.

**`git status`:**
```
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md          (ya estaba, ajeno a TAB)
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md  (ya estaba, ajeno a TAB)
?? docs/reportes/AJILEI_TAB-2_Fase0_Informe_v1.0.md          (este informe)
?? laminas/mon1/_entorno.txt                                  (ya estaba)
?? laminas/mon1/lamina.html                                   (ya estaba)
?? laminas/mon1/tiempos.json                                  (ya estaba)
```
`laminas/tab1/` no existía en T0 y sigue sin existir.

**Procesos:** los dos `vite preview` de las sondas (4191 y 4192) se pararon por su PID. No queda **ningún `node.exe` vivo**, y los puertos 4173, 4191 y 4192 están libres.
