# AJILEI — Campaña PUE · Auditoría de la lámina sellada · Informe v1.0

**31-ago-2026 · HEAD `26b1fb4` · lámina `PUE_lamina_v1.7.html` (49 771 B, 1 147 líneas)**

Última aduana antes de la Fase 1. Dos trabajos: **medir** que la lámina cumple sus
promesas en viewports reales, y **extraer** la regla del halo del ganador para que
la portada celebre como celebra la mesa.

**Cumplimiento del mandato**

| Regla | Estado |
|---|---|
| Ningún archivo existente se modifica | ✅ `src/`, `public/`, `docs/`, raíz y configuración intactos |
| Protegidos: se leen, no se tocan | ✅ `gameTable.css` leído y citado para 2.1; sin una sola escritura |
| Sólo tres archivos nuevos | ✅ `scripts/diagPUE.mjs` · `capturas-pue/` · este informe |
| Sin dependencias nuevas | ✅ `playwright-core@1.62.1` ya vivía en el proyecto |
| Sin commits, sin push | ✅ |

**Método.** `scripts/diagPUE.mjs` sobre el Edge del sistema (`channel:'msedge'`,
sin ventana), contra `npm run dev` en `http://localhost:5173/PUE_lamina_v1.7.html`.
**Cada veredicto sale de una caja de contorno, de una propiedad computada o de la
bitácora de red.** Nada de impresiones. Salidas en `capturas-pue/` (30 archivos,
12 MB) más `capturas-pue/diagPUE.json` con las cifras crudas.

---

## Tabla veredicto por viewport

| Medición | 1920×1080 | 390×844 | 360×640 | 320×568 | 851×393 |
|---|---|---|---|---|---|
| **1.1** sin scroll | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| **1.2** wordmark | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| **1.3a** eje esc 1 | 🟢 | 🟢 | 🟢 | 🟢 | n/a |
| **1.3a** eje esc 2 | 🟢 | 🟢 | 🟢 | 🟢 | n/a |
| **1.3a** eje esc 3 | 🟢 | 🟢 | 🟢 | 🟢 | n/a |
| **1.3a** eje esc 4 | 🔴 **13,70px** | 🟢 5,95 | 🟢 3,89 | 🟢 4,38 | n/a |
| **1.3a** eje esc 5 | 🔴 **14,71px** | 🟢 0,05 | 🟢 0,04 | 🟢 0,04 | n/a |
| **1.3b** sin invasiones | 🟢 | 🟢 | 🟢 | 🟢 | n/a |
| **1.3c** aire mano↔marcador | — | — | 🟢 15,80px | — | — |
| **1.9** consola limpia | 🔴 1 error | 🟢 | 🟢 | 🟢 | 🟢 |

| Medición no ligada a viewport | Veredicto |
|---|---|
| **1.4** hoja móvil (390×844) | 🟢 los cinco puntos |
| **1.5** selector de idioma (escritorio + móvil) | 🟢 los seis puntos |
| **1.6** movimiento reducido | 🟢 los cinco puntos |
| **1.7** pausa de cortesía | 🟢 los dos puntos |
| **1.8** bitácora de red | 🟢 |

**43 mediciones · 40 verdes · 3 rojos**, y de los tres, **dos son la misma causa
geométrica y el tercero es un artefacto de maqueta que no viaja a producción**.

---

# Bloque 1 — Auditoría de arnés

## 1.1 La promesa «sin scroll» · 🟢 los cinco viewports

Medido con `getBoundingClientRect()` contra `window.innerHeight`, más el desborde
del documento (`scrollHeight − innerHeight`).

| Viewport | Elemento crítico | `top` | `bottom` | `innerHeight` | Holgura | Desborde |
|---|---|---|---|---|---|---|
| 390×844 | `.btn-jugar` | — | **624,6** | 844 | 219,4px | **0px** |
| | `.cta-vacuna` | — | **657,8** | 844 | 186,2px | |
| 360×640 | `.btn-jugar` | — | **493,1** | 640 | 146,9px | **0px** |
| | `.cta-vacuna` | — | **526,3** | 640 | 113,7px | |
| 320×568 | `.btn-jugar` | — | **457,1** | 568 | 110,9px | **0px** |
| | `.cta-vacuna` | — | **490,3** | 568 | 77,7px | |
| 1920×1080 | `.tarjeta` | 288,6 | **763,3** | 1080 | 316,7px | **0px** |
| 851×393 | `.tarjeta` | 23,5 | **369,4** | 393 | 23,6px | **0px** |

> **La promesa se cumple, y con margen.** El desborde del documento es **0px en
> los cinco**: la lámina no genera barra de desplazamiento en ninguno. Ni siquiera
> en 320×568, el más apretado del censo, donde la línea de vacuna aún deja 77,7px
> de aire por debajo.

El caso más ajustado es **851×393** (teléfono horizontal), donde la tarjeta ocupa
345,9 de 393px y deja 23,6px. Cabe, pero es el viewport sin holgura para crecer —
y es justo el que la Fase 0 había señalado como descubierto en la puerta actual.
**El traje de `@media (orientation:landscape) and (max-height:540px)` lo resolvió:
oculta escenario, frase y pie de casa, y comprime la tarjeta a `22px 20px 18px`.**

Capturas: `vista-1920x1080.png` · `vista-390x844.png` · `vista-360x640.png` ·
`vista-320x568.png` · `vista-851x393.png`.

## 1.2 El wordmark se auto-verifica · 🟢 — y cierra el [NO VERIFICADO] de la Extracción

Leído del `<h1>` en vivo, en cada viewport:

| Viewport | `font-size` | `--wm-track` | `--brillo-ancho` medido | `--brillo-slot-dx` | familia · peso |
|---|---|---|---|---|---|
| 1920×1080 | 72px | 12px | **224,84375px** | **0px** | system-ui · 500 |
| 390×844 | 72px | 12px | **224,84375px** | 0px | system-ui · 500 |
| 851×393 | 72px | 12px | **224,84375px** | 0px | system-ui · 500 |
| 360×640 | 46px | 6px | **135,33px** | 0px | system-ui · 500 |
| 320×568 | 46px | 6px | **135,33px** | 0px | system-ui · 500 |

> ### ✅ 224,84px clavados. La Extracción sellaba «≈224,84px» y el navegador da **224,84375px**.

**Y la familia y el peso confirman el hallazgo mayor de la Extracción:**
`system-ui` con `font-weight: 500`, no `--font-base: Arial` con peso normal. La
lámina reprodujo la herencia de `index.css` correctamente.

**El escalón compacto también cuadra — y mejor de lo que el arnés dijo en bruto.**
El arnés extrapoló linealmente desde 56px y marcó Δ=2,06 %. **Esa extrapolación
era la parte tosca, no la lámina.** El ancho del conjunto no es lineal en el
tamaño: la traza `--wm-track` y el `letter-spacing` cambian por escalones. Con el
modelo completo —`ancho = 0,7002·fs + track + k·fs + 4·letter-spacing`, con
**k = 1,589244** despejado del escalón sellado de 72px—:

| Escalón | `fs` / `ls` / `track` | Modelo | Medido o sellado | Δ |
|---|---|---|---|---|
| Escritorio | 72 / 12 / 12 | 224,84px | 224,84px | **0,000px** |
| Producción ≤680px | 56 / 8 / 8 | 168,21px | 168,22px | **0,011px** |
| Compacto de la lámina | 46 / 6 / 6 | 135,31px | **135,33px** | **0,016px** |

**Los tres escalones caen dentro de 0,02px.** El bloque de referencia de la
Extracción §1.3 reproduce el wordmark de producción con fidelidad métrica.

> **Se cierran los dos [NO VERIFICADO] de la Extracción** (§1.2.4 y §1.3): las dos
> longitudes ya no se transcriben de un comentario, se leen del navegador.

**Dos notas de lectura:**

- **`--brillo-slot-dx = 0px` es correcto, no un fallo.** El `<h1>` es
  `text-align: start` dentro de una columna alineada a la izquierda, así que el
  borde izquierdo del `.wm-slot` coincide con el del `<h1>`: `h1Left = 340`,
  `slotLeft = 340`. En la Bienvenida de producción el rótulo va centrado y allí
  vale 167,58px. *(El arnés lo imprime como «—» porque su `parseFloat(...)||null`
  confunde el cero con la ausencia. Es cosmética del log, no de la medida.)*
- **⚠️ La lámina nunca usa el escalón de 56px.** Su escalera es
  **72px → 46px**, con el corte en `(orientation:portrait) and (max-height:700px)`.
  Producción usa **72px → 56px**, con el corte en `max-width: 680px`
  (`welcome.css:238`). **A 390×844 la lámina pinta 72px donde producción pintaría
  56px.** Ver desviación **D3**.

## 1.3 Geometría de escenas · 🔴 dos rojos en escritorio

**Cómo se midió, y por qué así.** «El centro del contenido» se toma de la **unión
de las cajas de la tinta real** —imágenes, texto de la pregunta y marcador—, no
de la del contenedor: `.abanico` es `position:absolute; inset:0`, así que su caja
es el escenario entero y medirla daría un centrado trivial y falso.

> **Corrección de método aplicada a mitad de la corrida.** La primera sonda
> filtraba por `getComputedStyle(pieza).opacity` y **midió de más**: en esta
> lámina el `opacity: 0` vive en el **padre** (`.moneda`, `.carta`), y la
> opacidad heredada no baja al estilo computado del hijo — un `<img>` dentro de
> un padre invisible sigue declarando `opacity: 1`. Así entraba en la unión la
> moneda héroe de la escena 4, que a los 1,4 s todavía no ha caído. Se sustituyó
> por `checkVisibility({opacityProperty:true})`, que sí recorre la cadena de
> ancestros, y **cada escena se mide en su instante ASENTADO**, con la cifra
> sacada del CSS y no de un número redondo: esc 1 a 1 600 ms, esc 2 a 2 600
> (reveló 300+4×280+500), esc 3 a 3 200 (trío a 2,6+0,4 s), esc 4 a 3 200 (héroe
> a 2,0+0,9 s), esc 5 a 1 400.

### (a) El eje · |centro de la tinta − centro de la frase| ≤ 8px

| Escena | 1920×1080 | 390×844 | 360×640 | 320×568 |
|---|---|---|---|---|
| 1 · baraja | 0,00 🟢 | 0,01 🟢 | 0,00 🟢 | 0,00 🟢 |
| 2 · AJILEI | 0,00 🟢 | 0,00 🟢 | 0,00 🟢 | 0,00 🟢 |
| 3 · enseñanza | 0,00 🟢 | 0,00 🟢 | 0,01 🟢 | 0,00 🟢 |
| **4 · Heptacoins** | **13,70 🔴** | 5,95 🟢 | 3,89 🟢 | 4,38 🟢 |
| **5 · mesa** | **14,71 🔴** | 0,05 🟢 | 0,04 🟢 | 0,04 🟢 |

**Las dos desviaciones son deterministas y su aritmética cierra al centésimo.**

**Escena 4 @1920** — `.mesa-monedas` mide 440px (`min(440px,92%)`) y su centro cae
en 675,80, **exactamente el de la frase**. El desvío nace de dentro:

```
.pila  {left:24%; --d:clamp(72px,7vw,100px)}  → 7vw=134,4 → 100px  → centro 105,59 · mitad 50
.heroe {left:72%; --d:clamp(140px,13vw,190px)} → 13vw=249,6 → 190px → centro 316,80 · mitad 95

tinta = [105,59−50 , 316,80+95] = [55,59 , 411,80] → centro 233,70
contenedor: 220,00                                  → Δ = +13,70px
```

Dos causas se suman: **24 % y 72 % son simétricos respecto del 48 %, no del 50 %**
(aporta −8,80px), y **la mitad-diámetro del héroe supera a la de la pila en 45px**
(aporta +22,50px). Neto **+13,70px hacia la derecha**. Medido: **13,70px**.

En móvil la desviación se encoge sola porque las abrazaderas cambian la razón de
tamaños (`--d` del héroe se topa en 104px y la pila en 54,6), no porque la
composición esté centrada.

**Escena 5 @1920** — `.duo` mide 560px, centro 675,80 = el de la frase.

```
.laptop   {left:36%; height:68%} → centro 201,59 · ancho 344,88 → [ 29,15 , 374,03]
.telefono {left:86%; height:88%} → centro 481,59 · ancho 156,56 → [403,31 , 559,87]

tinta = [29,15 , 559,87] → centro 294,51 ;  contenedor 280,00 → Δ = +14,51px
```

El teléfono queda **a ras del borde derecho** del `.duo` (955,67 contra 955,80)
mientras que a la izquierda sobran 29,15px. Medido por el arnés con la tinta fina:
**14,71px**.

> **Lectura honesta.** Las dos escenas son composiciones **deliberadamente
> asimétricas** —una pila pequeña con una moneda grande; una laptop grande con un
> teléfono pequeño— y el centro de su caja envolvente no es su centro óptico. El
> criterio de la ficha se midió como está escrito, y como está escrito **falla en
> escritorio por 5,7 y 6,7px**. Puede corregirse la lámina o puede corregirse el
> criterio; lo que no puede es quedar sin decidir. Ver **D1**.

**Un dato de contexto, no un rojo.** El eje de la escena 4 **se mueve durante la
escena**: mientras sólo está la pila (los primeros ~2 s de 4,5) la tinta se centra
en **561,39 → Δ = 114,41px**; al posarse el héroe salta a 689,49 → Δ = 13,70px.
Medido en muestreo. No se puntúa como falta —juzgar el eje a mitad de una
coreografía no sería justo—, pero explica por qué la captura
`esc4-Heptacoins-1920x1080.png` muestra la pila sola y muy a la izquierda.

### (b) Sin invasiones · 🟢 los cuatro viewports, las cinco escenas

**Ninguna tinta de escena solapa la caja de la frase.** Holguras verticales:

| Escena | 1920×1080 | 390×844 | 360×640 | 320×568 |
|---|---|---|---|---|
| 1 · baraja | 14,0px | 29,5px | 20,8px | 20,8px |
| 2 · AJILEI | 14,0px | 14,0px | 16,0px | 16,0px |
| 3 · enseñanza | 228,5px | 12,5px | 13,2px | 13,2px |
| 4 · Heptacoins | 36,0px | 36,0px | 36,0px | 36,0px |
| **5 · mesa** | **3,6px** ⚠️ | 11,9px | 13,4px | 13,4px |

> **⚠️ La escena 5 en escritorio pasa por 3,6px.** No invade —y por eso es verde—
> pero es **la única medición del censo por debajo de 10px**. El teléfono va
> `rotate(-3deg)`, así que su esquina inferior es lo que se acerca. Cualquier
> retoque del alto del `.duo` o de la interlínea de la frase se come ese margen.
> Ver **D2**.

### (c) El aire entre la mano del AJILEI y el marcador · 🟢

**360×640: 15,80px** (mínimo exigido 12px). Holgura de 3,80px sobre el umbral.

`851×393` no aplica en todo 1.3: el bloque
`@media (orientation:landscape) and (max-height:540px)` oculta `.escenario` y
`.frase` por diseño. El arnés lo detecta y lo declara, no lo cuenta como verde
gratis.

Capturas: `esc{1..5}-{nombre}-{viewport}.png`, 20 archivos.

## 1.4 La hoja móvil (390×844) · 🟢 los cinco puntos

| # | Comprobación | Medición | Veredicto |
|---|---|---|---|
| a | La tarjeta sube | `top` **867,5 → 373,1** | 🟢 |
| b | Fondo **opaco** | `background-color` computado = **`rgb(12, 29, 19)`** = `#0c1d13`, **sin alfa** | 🟢 |
| c | `.escenario` y `.frase` ocultos | `visibility: hidden` en los dos | 🟢 |
| d | El velo recibe los toques | `opacity:1` · `pointer-events:auto` · **`elementFromPoint(195,80)` → `velo`** | 🟢 |
| e | Clic fuera cierra | `hoja-abierta=false` · `top` vuelve a **867,5** (fuera de los 844) | 🟢 |

El punto (d) es el que más se suele fingir y aquí se midió de verdad: se preguntó
al documento **quién recibiría el toque** en el centro de la zona que el velo
cubre, y responde `velo`. La tarjeta-hoja no deja agujeros.

Captura: `hoja-abierta-390x844.png`.

## 1.5 El selector de idioma · 🟢 los seis puntos

| Viewport | Abre | Contenido | Dentro del viewport | Clic fuera cierra |
|---|---|---|---|---|
| 1920×1080 | `abierta` + `display:block` 🟢 | **5 entradas** · Español con **✓** · **4 «Pronto»** 🟢 | sí 🟢 | 🟢 |
| 390×844 | `abierta` + `display:block` 🟢 | **5 entradas** · Español con **✓** · **4 «Pronto»** 🟢 | sí 🟢 | 🟢 |

Las cinco entradas, en orden: Español (✓) · English · Português · Français ·
Italiano. Las cuatro últimas con su marca «Pronto». La lista no se sale del
viewport en ninguno de los dos — se comprobó el `right` contra `innerWidth`.

La decisión sellada de Victor —**visible desde el día uno**— está implementada con
un interruptor explícito, `var MOSTRAR_IDIOMA = true`, comentado en la lámina como
«producción: true solo cuando IDI ofrezca >1 idioma». La maqueta lo fuerza a
`true`; la Fase 1 hereda el mando.

Capturas: `idioma-abierto-1920x1080.png` · `idioma-abierto-390x844.png`.

## 1.6 Movimiento reducido · 🟢 los cinco puntos

Emulado con `reducedMotion: 'reduce'` en el contexto, 1920×1080, tras 2,5 s:

| # | Comprobación | Medición | Veredicto |
|---|---|---|---|
| a | La media query aplica | `matchMedia(...).matches = true` | 🟢 |
| b | Ninguna animación corre | **`document.getAnimations()` con `playState==='running'`: lista vacía** | 🟢 |
| c | Escena 1 estática y completa | `.esc` activa · `opacity: 1` · las **cinco** cartas a `opacity: 1` | 🟢 |
| d | El brillo del botón no se pinta | `.btn-jugar::after` → **`display: none`** | 🟢 |
| e | El rotor no avanza | índice **0** tras 2,5 s | 🟢 |

El punto (b) es el fuerte: no se comprobó que «se ven quietas», se le preguntó al
documento por su lista de animaciones en marcha y **está vacía**.

> **⚠️ Un hueco latente que hoy no muerde.** El bloque de movimiento reducido dice
> `.sube,.tarjeta,.esc *,.esc.activa *{animation:none !important}`, y **`*` no
> alcanza a los pseudo-elementos**. Quedan fuera `.mano::before` (halo,
> `infinite alternate`), `.heroe::after` (brillo de la moneda, `infinite`) y
> `.pila .disco::after`. Hoy no se nota porque con movimiento reducido el rotor
> hace `return` antes de armarse y esas escenas nunca se activan. **En cuanto la
> Fase 1 permita llegar a la escena 2 o 4 con la preferencia puesta, dos
> animaciones infinitas se encienden.** `.btn-jugar::after` ya está tratado
> aparte, lo que prueba que el patrón se conoce — sólo faltan estos tres. Ver
> **D4**.

Captura: `reducido-1920x1080.png`.

## 1.7 La pausa de cortesía · 🟢 los dos puntos

| # | Comprobación | Medición | Veredicto |
|---|---|---|---|
| a | El índice no avanza con el foco dentro | foco en `#correo` · índice **0 → 0 tras 6 s** · `activeElement = #correo` | 🟢 |
| b | El rotor resucita al soltar | tras `blur()`, índice **0 → 2 en 5,2 s** | 🟢 |

Los 6 s de espera son deliberados: la escena más larga dura 4,5 s, así que un
rotor vivo habría cambiado **sí o sí**. Y se comprobó además lo que la ficha no
pedía y hacía falta: **que la pausa se levante**. Una pausa que no se suelta no es
cortesía, es una avería — y el arnés confirma que el rotor vuelve.

## 1.8 Bitácora de red · 🟢

Arranque en frío a 1920×1080 con `page.on('request')` + `page.on('response')`.
**14 recursos, los 14 con estado 200.**

| Momento | Peso | Tipo | Recurso |
|---|---|---|---|
| 4 ms | 58,2 KiB | documento | `/PUE_lamina_v1.7.html` |
| 21 ms | 204,9 KiB | script | `/@vite/client` *(sólo en desarrollo)* |
| 21 ms | **4,0 KiB** | imagen | `/src/assets/ajilei-isotipo.svg` |
| 21 ms | **6,8 KiB** | imagen | `/src/assets/cards/reverso_carta.svg` |
| 21 ms | **3,4 KiB** | imagen | `/src/assets/heptacoin.svg` |
| 49 ms | 109,3 KiB | script | `/@react-refresh` *(sólo en desarrollo)* |
| 49 ms | 3,4 KiB | script | `/node_modules/vite/dist/client/env.mjs` *(sólo en desarrollo)* |
| **2 554 ms** | 680,8 KiB | imagen | `/src/assets/cards/uno_copa.png` |
| **2 555 ms** | 483,9 KiB | imagen | `/src/assets/cards/tres_copa.png` |
| **2 555 ms** | 486,9 KiB | imagen | `/src/assets/cards/cinco_copa.png` |
| **2 555 ms** | 557,8 KiB | imagen | `/src/assets/cards/diez_copa.png` |
| **2 555 ms** | 838,7 KiB | imagen | `/src/assets/cards/doce_copa.png` |
| **2 555 ms** | 512,3 KiB | imagen | `/PUE_mesapc_demo.png` |
| **2 555 ms** | 679,6 KiB | imagen | `/PUE_mesav_demo.jpg` |

> ### ✅ Las siete piezas pesadas llegan a los 2 554–2 555 ms. Ni una antes.
> El `setTimeout(cargarPerezosas, 2500)` de la lámina cumple al milisegundo, y las
> cinco caras de cartas **y** las dos capturas de mesa quedan fuera del primer
> pintado.

**Reparto del peso:**

| Tramo | Peso |
|---|---|
| Antes de 2 s (primer pintado) | **331,8 KiB** — de los cuales **317,6 KiB son andamiaje de Vite** (`@vite/client` + `@react-refresh` + `env.mjs`), que **no existe en el build** |
| **Primer pintado real, sin andamiaje** | **≈ 72,4 KiB** — documento 58,2 + los tres vectores 14,2 |
| Diferido a 2,5 s | **4 240,0 KiB (4,14 MiB)** |

> ### El método que la Fase 0 dejó pendiente queda sellado.
> El §4.4 del informe de Fase 0 declaró sus 706,2 KiB **[NO VERIFICADO]**, por
> salir de análisis estático y no de un panel de red. **Esta bitácora es ese panel
> de red**, con `page.on('request')` como allí se propuso. El método está probado
> y `diagPUE.mjs` queda en el árbol para reapuntarlo a la portada de producción.

**Los tres vectores son la mejor noticia del bloque:** isotipo, reverso y
Heptacoin suman **14,2 KiB** y sostienen tres de las cinco escenas —el abanico,
los dorsos del trío y las ocho monedas—. La escena 1 entera cuesta 6,8 KiB, porque
las cinco cartas del abanico son **el mismo** SVG.

**Y la advertencia que la Fase 1 debe llevarse:** las cinco caras del AJILEI pesan
**3,05 MiB** y las dos capturas de mesa **1,16 MiB**. Diferirlas 2,5 s salva el
primer pintado, pero **el visitante que se queda las descarga igual**. Es la misma
cifra que la Extracción §2.3 anticipó (3,04 MiB para la escena 2) y sigue sin
resolver: son las cartas a resolución nativa 1055×1491.

## 1.9 Consola limpia · 🔴 un error, y no viaja a producción

**Cuatro de los cinco viewports: cero errores.** En 1920×1080 aparece uno:

```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Identificado: `/favicon.ico`.** Comprobado por eliminación —las 14 respuestas de
la página son 200, ninguna falla a nivel de contexto— y confirmado directamente:

```
curl -o /dev/null -w "%{http_code}" http://localhost:5173/favicon.ico   →  404
grep "rel=\"icon\"" PUE_lamina_v1.7.html                                →  sin coincidencias
```

La lámina no declara icono, así que el navegador pide `/favicon.ico` por defecto y
Vite responde 404. Aparece sólo en el primer contexto del navegador porque
Chromium no repite la petición por sesión.

> **No viaja a la Fase 1.** El `index.html` de producción **sí** declara
> `<link rel="icon" type="image/svg+xml" href="/icons/ajilei-icon-maestro.svg">`.
> Es un artefacto de maqueta suelta. Severidad **trivial**. Ver **D5**.

---

# Bloque 2 — Extracción del halo del ganador

## 2.1 La regla real, en el juego

**Búsqueda:** `src/styles/` y componentes de celebración, por `halo`, `ganador`,
`winner`, `resplandor`, `glow` y por `box-shadow` con `--gold-brand-rgb`.

> ### ⚠️ Hallazgo que cambia el encargo: en el juego NO existe un halo alrededor de la mano ganadora.
> La lámina pone un resplandor sobre las cinco cartas. **La mesa no hace eso.** Lo
> que la mesa tiene son **cuatro tratamientos dorados distintos**, ninguno de los
> cuales es un halo sobre la mano.

### (1) El pulso del ganador — `.vc-pulso` · **el análogo más cercano**

`src/styles/gameTable.css:337-357` · **ARCHIVO PROTEGIDO — leído y citado, no
tocado** (`AJILEI_Protegidos_v1.0.md` §2, entrada 5).

```css
/* Pulso dorado · un ciclo, uno solo. Vive en un hermano ABSOLUTO dentro del
   nombre, no en .player-zone: allí la abreviatura `animation` es de turnBreath,
   y aunque en fase de pago el halo de turno está apagado (turnSeat es null),
   compartir la propiedad es pedir que algún día se pisen.
   Absoluto y sin caja propia → no toca la reserva de 12ch del nombre: Δ=0. */
.pbr-name { position: relative; }

.vc-pulso {
  position: absolute;
  inset: -6px -10px;
  border-radius: 8px;
  pointer-events: none;
  animation: vcPulso 900ms ease-out 1 both;
}

@keyframes vcPulso {
  0%   { opacity: 0; box-shadow: 0 0 0 0    rgba(var(--gold-brand-rgb), 0.00); }
  25%  { opacity: 1; box-shadow: 0 0 18px 2px rgba(var(--gold-brand-rgb), 0.70); }
  100% { opacity: 0; box-shadow: 0 0 26px 6px rgba(var(--gold-brand-rgb), 0.00); }
}
```

**Disparador:** `src/components/Celebracion.jsx:109` —
`return <span key={activa.id} className="vc-pulso" aria-hidden="true" />`. La
`key` es lo que fuerza el remontaje y con él el reinicio de la animación.

**Sobre qué se pinta: el NOMBRE del ganador** (`.pbr-name`), no sus cartas.

### (2) El énfasis de las cartas ganadoras — sin resplandor

`gameTable.css:954-965` · **PROTEGIDO**

```css
/* ── Showdown winner emphasis ── */
.card-slot-wrapper.card-slot-winner { transform: scale(1.2); position: relative; z-index: 5; }
.card-slot-wrapper.card-slot-winner + .card-slot-wrapper.card-slot-winner { margin-left: 18px; }
```

**Disparador:** `GameTable.jsx:1396`, con `rivalWon`. Las cartas ganadoras
**crecen un 20 % y nada más**. Ni halo, ni borde, ni sombra dorada.

### (3) El respiro del TURNO — `turnBreath` · **no es del ganador**

`gameTable.css:1012-1030` · **PROTEGIDO**

```css
.opp-panel.turn-active, .ai-zone.turn-active, .player-zone.turn-active {
  border-color: var(--gold-brand);
  animation: turnBreath 2.4s ease-in-out infinite;
}
@keyframes turnBreath {
  0%, 100% { box-shadow: 0 0 0 1px var(--gold-brand), 0 0 10px rgba(var(--gold-brand-rgb), 0.30); }
  50%      { box-shadow: 0 0 0 1px var(--gold-brand), 0 0 26px rgba(var(--gold-brand-rgb), 0.70); }
}
```

> **Éste es el único halo dorado INFINITO y palpitante de toda la mesa, y
> significa «es tu turno».** No «ganaste».

### (4) La palabra AJILEI — `.vc-ajilei`

`gameTable.css:371-385` · **PROTEGIDO**. `animation: vcAjilei 2000ms ease-out 1
both`, `color: var(--gold-brand)`, `clamp(44px, 11vw, 132px)`, traza `0.23em`,
`text-shadow: 0 4px 28px rgba(0,0,0,.55)`. Montada por `Celebracion.jsx:126`
sobre `.vc-ajilei-capa` (fija, `z-index: 32`), con el `<Wordmark/>` dentro.

## 2.2 Diferencias contra la aproximación de la lámina

La lámina (`PUE_lamina_v1.7.html:359-370`):

```css
.mano::before{
  content:'';position:absolute;inset:-16px -18px;
  border-radius:18px;
  border:1px solid rgba(var(--gold-brand-rgb),.55);
  box-shadow:0 0 34px 8px rgba(var(--gold-brand-rgb),.38),
             0 0 90px 22px rgba(var(--gold-brand-rgb),.16);
  opacity:0;transition:opacity .5s ease;
  pointer-events:none;
}
.mano.gana::before{opacity:1;animation:halo-pulso 2s ease-in-out .5s infinite alternate}
@keyframes halo-pulso{from{opacity:1}to{opacity:.65}}
```

| # | Aspecto | Lámina v1.7 | Juego (`vcPulso`) | Severidad |
|---|---|---|---|---|
| 1 | **Sobre qué se pinta** | La **mano entera** (5 cartas) | El **nombre** del ganador. Las cartas sólo crecen a `scale(1.2)`, sin resplandor | **Alta** |
| 2 | **Repetición** | `infinite alternate` — **no para nunca** | `1 both` — **un solo ciclo** | **Alta** |
| 3 | **Duración** | 2 s por medio ciclo, con `.5s` de retardo | **900 ms**, ciclo completo | Media |
| 4 | **Qué se anima** | Sólo `opacity` (1 → 0,65). El resplandor es **fijo** | El `box-shadow` entero: difuminado 0→18→26px, extensión 0→2→6px, alfa 0→0,70→0 | **Alta** |
| 5 | **Curva** | `ease-in-out` (respiración) | `ease-out` (impacto que se apaga) | Media |
| 6 | **Borde de 1px** | **Sí**, `1px solid rgba(oro,.55)` permanente | **No.** El único anillo de 1px de la mesa es de `turnBreath` | **Alta** |
| 7 | **Extensión** | Dos capas: `34px 8px` a .38 **y** `90px 22px` a .16 | Una capa, pico `18px 2px` a **.70** | Media |
| 8 | **Caja** | `inset:-16px -18px` · radio 18px | `inset:-6px -10px` · radio 8px | Baja |
| 9 | **Estado final** | Se queda **encendido** | Termina en `opacity: 0` — **desaparece** | **Alta** |

### El problema no es de números: es de idioma

Los puntos 2, 6 y 9 juntos dicen algo peor que «los valores no coinciden»:

> **Un halo dorado, con anillo de 1px, que palpita sin parar y se queda encendido,
> es exactamente el vocabulario de `turnBreath` — que en la mesa significa «te
> toca».** La lámina lo está usando para decir «ganaste». Si la portada se integra
> tal cual, la Fase 1 importa a la marca un gesto que en el juego significa otra
> cosa.

El juego celebra **con un golpe de luz que se apaga**: 900 ms, `ease-out`, de la
nada al pico y de vuelta a la nada.

### La tensión real que Victor debe resolver

**Clonar `vcPulso` literalmente tiene un coste.** La portada es un bucle ambiente:
la escena 2 dura 4 s y el visitante puede llegar a mitad. **Un destello de 900 ms
disparado una sola vez es fácil de perder.** El halo infinito de la lámina existe
por eso, no por descuido.

Tres salidas, en orden de fidelidad:

1. **Fidelidad estricta.** Clonar `vcPulso` tal cual sobre el marcador «51 AJILEI»
   —el análogo del nombre del ganador— y dar `transform: scale(1.2)` a las cartas.
   La portada celebra idéntico a la mesa. Coste: el momento es breve.
2. **Fidelidad con repetición** *(recomendada)*. **Los mismos keyframes de
   `vcPulso`**, misma curva, mismo pico y mismo final en cero, **repetidos** una
   vez por ciclo de escena. Conserva el gesto —golpe que se apaga— y resuelve la
   visibilidad. **Y elimina el anillo de 1px**, que es lo que hoy suena a turno.
3. **Dejarlo como está** y aceptar que la portada habla un dialecto propio. No se
   recomienda: la Extracción ya demostró lo caro que sale que la portada y el
   producto digan lo mismo de dos maneras.

**En las tres, dos correcciones son obligatorias:** quitar el `border: 1px` (punto
6) y animar el `box-shadow` en vez de sólo la `opacity` (punto 4). Son las que
convierten una respiración en un destello.

---

## Desviaciones halladas

| # | Desviación | Dónde | Severidad | Insumo para |
|---|---|---|---|---|
| **D1** | **Eje fuera de tolerancia en escritorio:** escena 4 a **13,70px** y escena 5 a **14,71px** (umbral 8px). Aritmética cerrada al centésimo: 24 %/72 % centran en 48 %, y la mitad-diámetro del héroe supera a la de la pila en 45px | `PUE_lamina_v1.7.html:467,490` y `:523,558` | **Media** — sólo en ≥900px; móvil pasa | v1.7.x, **o** revisar el criterio si la asimetría es deliberada |
| **D2** | **Holgura de 3,6px** entre la tinta de la escena 5 y la frase en 1920. No invade, pero es la única medición del censo bajo 10px | `:518-575` | **Media** — cualquier retoque la consume | v1.7.x |
| **D3** | **La escalera del wordmark diverge de producción.** Lámina 72→46px (`portrait & max-height:700`); producción 72→56px (`max-width:680`). A **390×844 la lámina pinta 72px donde producción pintará 56px** | `:793-794` vs `welcome.css:238` | **Media** — trampa de integración | Fase 1: decidir qué escalera manda |
| **D4** | **El bloque de movimiento reducido no alcanza a los pseudo-elementos.** `.esc *` no matchea `::before`/`::after`: quedan sueltos `.mano::before` (`infinite alternate`), `.heroe::after` (`infinite`) y `.pila .disco::after`. Hoy invisible porque el rotor no arranca | `:833-837` | **Baja hoy · Alta en Fase 1** | v1.7.x — tres selectores |
| **D5** | **404 de `/favicon.ico`** — la lámina no declara icono | `PUE_lamina_v1.7.html` (cabecera) | **Trivial** — no viaja: `index.html` sí lo declara | ninguno |
| **D6** | **`capturas-pue/` no está en `.gitignore`.** 30 archivos, **12 MB**, sin rastrear pero barribles por un `git add -A` distraído — el mismo accidente que el `.gitignore` documenta con los 101 MB de `capturas-dsk` | `.gitignore` | **Media** (higiene) | Añadir `capturas-pue/` |
| **D7** | **La escena 2 y la 5 cuestan 4,14 MiB diferidos.** Bien escondidos tras los 2,5 s, pero el visitante que se queda los paga. Ya anticipado por la Extracción §2.3 | `:872-900` | **Media** — fuera del alcance de PUE | Campaña de compresión |

**Ninguna desviación es bloqueante.** D1 y D2 son ajustes de píxeles en escritorio;
D3 y D4 son decisiones de integración de una línea cada una; D5 no existe en
producción; D6 es higiene del repo; D7 es una campaña aparte ya identificada.

---

## Veredicto: ¿lista para Fase 1?

# SÍ.

**40 de 43 mediciones en verde**, y los tres rojos están acotados, explicados con
aritmética que cierra al centésimo, y ninguno toca lo que la lámina prometía como
contrato.

**Lo que la lámina prometía, cumplido y medido:**

- **«Sin scroll»** — desborde **0px** en los cinco viewports, con 77,7px de aire
  incluso en 320×568.
- **El wordmark es el mismo objeto** — **224,84375px** contra los 224,84 sellados,
  con `system-ui` y peso 500, y los tres escalones dentro de **0,02px** del
  modelo.
- **El patrón adaptativo funciona** — la hoja móvil sube, es **opaca de verdad**
  (`rgb(12,29,19)`, sin alfa), oculta escenario y frase, y el velo **recibe los
  toques** comprobado con `elementFromPoint`.
- **El traje compacto salva 851×393**, el viewport que la Fase 0 había señalado
  como descubierto.
- **El selector de idioma** está completo en los dos terrenos: cinco entradas,
  Español con ✓, cuatro «Pronto», y cierra al clic fuera.
- **Movimiento reducido**: `getAnimations()` devuelve **lista vacía**.
- **La pausa de cortesía** no sólo pausa: **suelta**.
- **La carga perezosa cumple al milisegundo** — las siete piezas pesadas a
  2 554–2 555 ms, con un primer pintado real de **≈72,4 KiB** descontado el
  andamiaje de Vite.

**Con dos condiciones para la Fase 1, ninguna de las cuales pide una v1.7.x antes
de empezar:**

1. **El halo del ganador se corrige, no se copia.** La lámina lo declaraba como
   aproximación y la extracción encontró algo más grave que un desajuste de
   valores: **el juego no tiene halo sobre la mano**, y el gesto que la lámina usa
   —anillo de 1px, palpitar infinito, quedarse encendido— es el vocabulario de
   `turnBreath`, que significa «te toca». Recomendación: **opción 2 de §2.2** —
   los keyframes de `vcPulso` (900 ms, `ease-out`, `box-shadow` animado, final en
   cero), repetidos una vez por ciclo de escena, **sin el borde de 1px**.
2. **D3 se decide antes de escribir CSS de producción.** Si la Fase 1 reutiliza
   `.welcome-title` de `welcome.css`, el corte de 680px impondrá 56px a 390×844 y
   la portada **no** se verá como la lámina aprobada. Es una decisión de una línea,
   pero tiene que tomarse a conciencia y no descubrirse en la primera captura.

---

## Cobertura declarada

| Punto | Estado |
|---|---|
| 1.1 – 1.9 | ✅ Completos en los cinco viewports del censo |
| 2.1 – 2.2 | ✅ Completos |
| Cierre del [NO VERIFICADO] de la Extracción §1.2.4/§1.3 | ✅ **Cerrado** por 1.2 |
| Cierre del MÉTODO pendiente de la Fase 0 §4.4 | ✅ **Sellado** por 1.8 |

**Lo que no se midió, y se declara:** la lámina se auditó **servida por Vite en
desarrollo**, así que los 317,6 KiB de `@vite/client` y `@react-refresh` de la
bitácora **no existen en un build**; el peso real del primer pintado en producción
será otro y hay que remedirlo cuando la portada sea código. El navegador fue
**Edge (Chromium)**: Safari/WebKit no se probó, y con él quedan sin verificar
`checkVisibility`, el `mix-blend-mode` de ningún elemento y el comportamiento de
la hoja móvil en iOS — el mismo iPhone que PUE tiene pendiente desde la Fase 0.

**Archivos nuevos, los tres del mandato:** `scripts/diagPUE.mjs` ·
`capturas-pue/` (30 archivos, 12 MB, sin rastrear) · este informe.
**Ningún archivo existente fue modificado. No hay commits ni push.**

*Un verde de este informe mide lo que dice: cajas de contorno, propiedades
computadas y bitácora de red.*
