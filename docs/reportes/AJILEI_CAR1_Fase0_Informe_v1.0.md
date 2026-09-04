# AJILEI · CAR-1 · Fase 0 · Informe v1.0

**Diagnóstico de solo lectura · 04-sep-2026 · base `main` @ `3e8cd15`**

Las dos hipótesis se confirman, y con margen: las cartas viajan a **4,2–21,8× la resolución a la que se pintan**, no hay ni una línea de precarga, y el retraso medido en Fast 4G es de **1,9 s por carta**. Pero hay un tercer culpable que la hipótesis no contemplaba y que se arregla sin tocar un solo píxel: **Cloudflare sirve los assets con hash inmutable bajo `max-age=0, must-revalidate`**.

---

## 1 · Inventario de la baraja

Las 40 cartas son **idénticas en forma**: `1055×1491`, PNG color type 2 (**RGB · sin canal alfa en absoluto**, no "alfa vacío": el canal no existe), 8 bits, chunks `IHDR,pHYs,iTXt,eXIf,IDAT,IEND`. Alfa mínimo medido decodificando las 40 en Edge: **255** en todas; 0 % de píxeles transparentes o parciales. **Sin duplicados por hash.**

| | |
|---|---|
| **Archivos de carta** | 40 PNG + 1 reverso SVG |
| **Peso total** | **24 866,3 KB = 24,28 MB** |
| **Peso medio** | **621,7 KB** |
| **La más pesada** | `uno_oro.png` — 1 083,2 KB |
| **La más ligera** | `cinco_espada.png` — 205,1 KB |
| **Reverso** | `reverso_carta.svg` — 6,8 KB (uno solo, sin variantes) |
| **Variantes por mesa o tapete** | ninguna |

Extremos de la tabla (KB): `uno_oro` 1083,2 · `doce_espada` 988,0 · `doce_oro` 948,2 · `once_espada` 912,2 · `diez_oro` 904,3 … `siete_espada` 277,9 · `cinco_espada` 205,1.

**Lo que descarga un usuario en su primera partida** (medido, mesa 5 y mesa 2, una mano completa hasta el showdown):

| | mesa 5 | mesa 2 |
|---|---|---|
| Sólo por llegar a la **Bienvenida** | 2 cartas · **1 787,4 KB** | ídem |
| Al acabar la **primera mano** | 12 cartas distintas · **7,80 MB** | 12 · **7,90 MB** |

Son 12 y no 25 porque el protocolo de reveal (R1.c) enseña **una sola** mano rival. A lo largo de la sesión converge a las 40 = **24,28 MB**.

**Otras imágenes >100 KB que compiten por el mismo ancho de banda:**

| Archivo | KB | Nota |
|---|---|---|
| `src/assets/baraja2.svg` | 4 002,0 | vector 2D, en cola de retiro |
| `src/assets/baraja.svg` | 1 238,0 | ídem |
| `public/heptacoin.webp` | 1 040,0 | escena 4 de la Portada (MON-2), a los 2,5 s |
| `public/og-image.jpg` | 107,4 | tarjeta social, no la pide el navegador |

**Y un precedente que importa:** `src/assets/portada/` ya contiene **cinco cartas transcodificadas a WebP** a `200×283`, entre **8,6 y 13,0 KB** cada una. La casa ya hizo esto una vez.

---

## 2 · Pintado vs. archivo · la resolución objetivo

Token base: `--card-w: 76px` / `--card-h: 118px`. **No hay `srcset`, ni `sizes`, ni `<picture>` en ningún sitio** — predicción confirmada.

| Viewport | Contexto | Pintado (CSS) | Píxeles físicos | Ratio archivo/pintado |
|---|---|---|---|---|
| **1440×850 DPR 1** | mano del humano | 96,34×136,98 | 96×137 | **10,95×** |
| | rival `opp-panel` (showdown) | 50,16×77,87 | 50×78 | **21,03×** |
| | rival `.ai-zone` (mesa 2, showdown) | 91,2×141,6 | 91×142 | 11,57× |
| **390×844 DPR 3** | mano del humano | 62×96,55 | 186×290 | 5,67× |
| | rival `opp-panel` (showdown) | 49,8×78,05 | 149×234 | 7,06× |
| | rival `.ai-zone` (mesa 2, showdown) | 61×95 | 183×285 | 5,77× |
| **780×360 DPR 3** (S25 apaisado) | mano del humano | 77,28×110,05 | 232×330 | 4,55× |
| | rival `opp-panel` (showdown) | 57,65×90,1 | 173×270 | 6,10× |
| | **rival `.ai-zone` (mesa 2, showdown)** | 83,25×117,65 | **250×353** | **4,22×** ← el máximo de la mesa |
| Bienvenida (≥680px) | `.deco-card` | 150×212 | **450×636** | 2,34× |

Dos correcciones sobre lo que una medición ingenua diría:

- Las `.deco-card` miden **150×212 CSS**, no 218×253: `getBoundingClientRect()` devolvía la caja del `rotate(-22deg)` de [welcome.css:163](src/styles/welcome.css#L163). Están a `opacity: 0.22`, `aria-hidden`, y `display: none` por debajo de 680 px ([welcome.css:226-227](src/styles/welcome.css#L226)).
- **El mazo y la carta voladora nunca pintan una cara.** El mazo es `background: url(reverso_carta.svg)` ([gameTable.css:642, 664, 1080](src/styles/gameTable.css#L642)) y `FlyingCard` es un `<div>` sin `<img>` ([GameTable.jsx:258-274](src/components/GameTable.jsx#L258)): vuela siempre de dorso. Los PNG sólo aparecen en los huecos de mano.

> ### Resolución objetivo: **320×452**
> El máximo real en la mesa es **250×353** físicos. 320 le da un 28 % de margen para cualquier viewport que aún no exista y, medido, es **indistinguible de 450** (comparativa 3). Cubrir además las decorativas de la Bienvenida exigiría 450×636 — y ésas son un caso aparte que la Fase 1 puede resolver por otra vía.

---

## 3 · Cómo lo referencia el código

1. **Importadas por Vite**, con hash de contenido: [CardImage.jsx:1](src/components/CardImage.jsx#L1) hace `import.meta.glob('../assets/cards/*.png', { eager: true, query: '?url', import: 'default' })`. La ruta se arma en [CardImage.jsx:15](src/components/CardImage.jsx#L15) desde `NUM_MAP`/`PALO_MAP` (3-10). Comprobado: el build emite **40** ficheros con patrón `nombre-HASH.png`.
2. **Punto único**, con una excepción: `CardImage.jsx` es el único lugar donde se construye la ruta de una cara. La excepción es [WelcomeScreen.jsx:4-5](src/components/WelcomeScreen.jsx#L4), que importa `doce_oro.png` y `once_oro.png` directamente.
3. **Precarga: ninguna.** Cero `new Image()`, cero `<link rel="preload">` de cartas, y sin service worker (la Fase 0 de FRZ-1 ya lo confirmó). El único preload del proyecto es el de sonidos.
4. **`<img>` con `objectFit: contain`** ([CardImage.jsx:18-22](src/components/CardImage.jsx#L18)) → `onload` y `.decode()` son plenamente utilizables. Sólo el reverso usa `background-image`, y es SVG.
5. **Cache en producción** — `curl -I https://ajilei.io/assets/uno_oro-CUUWBET1.png`:
   ```
   Content-Type: image/png
   Cache-Control: public, max-age=0, must-revalidate
   ETag: "ee545cd5b1d24d65113136ba6c9c11f7"
   CF-Cache-Status: MISS → HIT (2ª petición)
   ```
   Con el ETag, la condicional devuelve **304 Not Modified**. Es decir: el edge sí cachea, pero **el navegador revalida cada carta en cada visita** — 40 idas y vueltas antes de poder pintar desde disco. Y es la política de todo el sitio, incluido el JS con hash. **No hay `_headers` en el repo**, que es exactamente el archivo con el que Cloudflare Pages arregla esto.

---

## 4 · El flash: red, no decodificación

**Qué se ve:** ni blanco puro ni el tapete ni un reverso. Es **`rgb(253, 246, 227)` = `#fdf6e3`**, el papel hueso que `.playing-card` pinta de fondo ([playingCard.css:5](src/styles/playingCard.css#L5)), con su borde `rgba(30,20,10,.18)` y su radio de 8 px. Un rectángulo de carta en blanco entre los huecos punteados — está en la cuarta captura que te mandé.

**Retraso inserción en el DOM → carta visible** (390×844 DPR 3, mesa 5, caché deshabilitada):

| Red | Mediana | Máximo | La petición más lenta |
|---|---|---|---|
| Sin estrangular (localhost) | 38 ms | 38 ms | — |
| **Fast 4G** (9 Mbit/s · 40 ms) | **1 893 ms** | 1 995 ms | `doce_oro` 948,2 KB en 1 992 ms |
| **Slow 4G** (1,6 Mbit/s · 150 ms) | **12 166 ms** | 12 166 ms | `once_oro` 839,2 KB en 12 164 ms |

**Decodificación aislada** (`createImageBitmap`, 5 pasadas, este PC):

| Carta | KB | Mediana | Rango |
|---|---|---|---|
| `uno_oro` | 1 083,2 | 13,4–18,9 ms | 12,4–35,5 |
| `seis_oro` | 670,1 | 10,3–19,3 ms | 9,8–28,7 |
| `doce_espada` | 988,0 | 12,6–15,4 ms | 11,7–43,7 |

> **Veredicto: el flash es de RED.** 1 893 ms contra ~15 ms son dos órdenes de magnitud. Aunque el teléfono decodifique 3–4× más lento que este PC, la decodificación seguiría siendo ruido frente a la descarga.

**Con caché habilitada y recarga** (Fast 4G): las cartas ya descargadas bajan a **56 ms**; las nuevas siguen en **837 ms**. El flash se reduce ~34× pero **no desaparece** — cada carta sigue haciendo su ida y vuelta condicional, que es precisamente lo que `must-revalidate` impone en producción. *Muestra pequeña y declarada: el auto-juego sólo llegó a 4 cartas distintas por corrida en esa condición.*

---

## 5 · La ventana de precarga

**Portada (build 4173, visitante anónimo):** 17 peticiones · **1 305,4 KB** en el arranque. Abrir la hoja del correo añade 29,9 KB. Los 15 s siguientes de rotor: **0 KB**. El rotor dura **21 s por ciclo** (`DURACIONES = [4000,4000,4500,4500,4000]`, [Portada.jsx:38](src/screens/Portada.jsx#L38)), y lo pesado entra a los 2,5 s ([Portada.jsx:72](src/screens/Portada.jsx#L72)).

**El tiempo muerto grande es el OTP**: el usuario se va a su bandeja de correo y vuelve. Decenas de segundos, sin una sola petición en vuelo.

**Recorrido del lobby (5173, bypass):**

| Paso | Peticiones | KB |
|---|---|---|
| Bienvenida → dificultad | 9 | **374,1** |
| dificultad → mesa+apuesta | 1 | 3,4 |
| elegir mesa | 0 | 0 |
| apuesta → **mesa** | 1 | 6,8 |
| Iniciar mano (reparto) | 3 | **1 350,0** (2 PNG de carta = 1 343,2) |

**El mecanismo ya existe y no hay que inventarlo.** [App.jsx:62-64](src/App.jsx#L62):

```js
useEffect(() => {
  if (screen !== 'welcome') precargarSonidos(SONIDOS_MESA)
}, [screen])
```

Mismo sitio, mismo momento, misma doctrina — «quien va a necesitarlos los pide antes de necesitarlos». La baraja cabe ahí sin tocar una línea de su lógica.

**Coste de precargar todo para quien llega a la Portada y se va: 24,28 MB hoy. Con la baraja a WebP q80 320 px: 0,57 MB.**

---

## 6 · Formatos

Peso en KB. Convertidor: **el navegador** (Edge 152), que es el precedente declarado de la casa en [gen-portada-assets.mjs:14-24](scripts/gen-portada-assets.mjs#L14) — «sin Sharp, y no por gusto»: no está instalado y el mandato prohíbe dependencias.

| Carta | Ancho | canvas-PNG | **WebP q80** | WebP q90 | JPEG q85 | AVIF q60 |
|---|---|---|---|---|---|---|
| **uno_oro** (la más pesada) | 200 | 76,1 | **12,8** | 17,0 | 20,1 | — |
| | 256 | 119,4 | **17,6** | 23,9 | 27,2 | — |
| | **320** | 178,1 | **27,3** | 36,4 | 43,5 | — |
| | 450 | 325,3 | 45,3 | 61,8 | 73,8 | — |
| | 1055 | 1 481,6 | 151,2 | 215,6 | 264,2 | — |
| **tres_oro** (la mediana) | 200 | 41,6 | **7,0** | 9,6 | 12,6 | — |
| | 256 | 64,9 | **9,6** | 13,3 | 16,5 | — |
| | **320** | 97,5 | **14,7** | 19,9 | 26,1 | — |
| | 450 | 175,2 | 24,0 | 33,4 | 43,7 | — |
| | 1055 | 779,1 | 79,1 | 111,1 | 155,4 | — |
| **doce_espada** (figura, detalle fino) | 200 | 68,3 | **8,6** | 11,9 | 14,7 | — |
| | 256 | 104,6 | **11,5** | 16,3 | 19,4 | — |
| | **320** | 161,2 | **17,6** | 24,3 | 29,9 | — |
| | 450 | 300,0 | 28,9 | 41,5 | 50,4 | — |
| | 1055 | 1 396,6 | 107,3 | 154,8 | 190,5 | — |

**La baraja entera** (40 × la mediana medida), contra los **24,28 MB** de hoy:

| Ancho | WebP q80 | WebP q90 | JPEG q85 |
|---|---|---|---|
| 200 | 0,27 MB | 0,38 MB | 0,49 MB |
| 256 | 0,37 MB | 0,52 MB | 0,64 MB |
| **320** | **0,57 MB** (**42×** menos) | 0,78 MB | 1,02 MB |
| 450 | 0,94 MB | 1,30 MB | 1,71 MB |

**Dos cosas que no se pudieron medir, y por qué:**

- **AVIF: no medible en esta máquina.** El canvas de Edge 152 devuelve `image/png` cuando se le pide `toBlob('image/avif')` — preguntado, no supuesto. Y Sharp no está instalado. Medirlo exige una dependencia nueva, que el mandato prohíbe.
- **«PNG optimizado» tampoco.** No hay `oxipng`, `pngquant` ni ImageMagick en la máquina (`convert` es el de Windows, no el de ImageMagick). La columna `canvas-PNG` es un PNG **sin optimizar**, y por eso sale hinchada: no es una cota justa del PNG, es el suelo.

**Compatibilidad**, con fuente:

| Formato | Uso global | Chrome | Chrome Android | Safari iOS | Safari escritorio |
|---|---|---|---|---|---|
| **WebP** | **96,82 %** | 32+ | sí | **14+** | 16+ (parcial desde 14) |
| **AVIF** | 95,36 % | 85+ | sí | **16+** | 16.4+ (parcial 16.1–16.3) |

Fuentes: [caniuse.com/webp](https://caniuse.com/webp) · [caniuse.com/avif](https://caniuse.com/avif)

**Lo que dicen las tres capturas:** a tamaño real de mesa los cuatro candidatos son **indistinguibles**. Al 300 % sin suavizado, WebP q80 muestra un suavizado levísimo en la barba y las gemas de la corona frente al original; JPEG q85 añade algo más de ruido en los planos lisos del manto. Y sobre el ancho: **200 px se queda blando** a 250 px pintados, 256 va justo, **320 y 450 son la misma imagen**.

---

## 7 · Recomendación para la Fase 1

### (A) Cabeceras + WebP q80 a 320 px + precarga en el lobby — **la recomendada**

- **Formato y resolución:** WebP q80, 320×452. Baraja entera **0,57 MB** (42× menos).
- **Precarga, en dos capas:** un `_headers` que dé `public, max-age=31536000, immutable` a `/assets/*`; y la baraja pedida en [App.jsx:62-64](src/App.jsx#L62), al lado de `precargarSonidos(SONIDOS_MESA)` — el recorrido dificultad → mesa + apuesta son varios segundos y 0,57 MB entran de sobra.
- **El PNG fuente:** se queda **donde está**, en `src/assets/cards/`, como maestro; simplemente deja de referenciarse desde el código. Los derivados van a `src/assets/cards/webp/` y los escribe un `scripts/gen-cards.mjs` calcado de `gen-portada-assets.mjs`. Derivados **en** el repo, como ya lo están los cinco de `src/assets/portada/`, porque Cloudflare Pages construye desde `main` y no ejecuta scripts de generación.
- **Archivos tocados:** `CardImage.jsx` (el glob y la extensión), `WelcomeScreen.jsx` (2 imports), `App.jsx` (+1 llamada), `_headers` (nuevo), `scripts/gen-cards.mjs` (nuevo), 40 WebP nuevos. **Ningún protegido.**
- **Precio:** el repo engorda 0,57 MB y los 24,28 MB de maestros siguen ahí.

### (B) Igual que (A), pero los maestros salen del repo

- Los 40 PNG se mudan a una carpeta gobernada fuera de `main`, `.gitignore` los excluye y el repo sólo lleva los WebP. Un `git clone` baja 24 MB menos.
- **Precio, y es el que la desaconseja:** Victor fijó que *no existen maestros fuera del repo*. Esta opción obliga a crear ese sitio gobernado y a mantenerlo vivo; el día que se pierda, el techo de calidad queda congelado para siempre en el WebP y no hay vuelta atrás.
- **Archivos tocados:** los de (A) + `.gitignore` + un documento que diga dónde viven.

### (C) Sólo cabeceras y precarga, sin transcodificar

- `_headers` con `immutable` + precarga de los 40 PNG en el lobby. Cero riesgo de calidad, cero derivados.
- **Precio:** 24,28 MB de precarga. En Fast 4G son ~22 s; en Slow 4G, más de dos minutos. Inviable en móvil, y el usuario que no juega los paga igual.
- Se declara porque aísla la mitad barata —las cabeceras— que (A) y (B) también incluyen, y porque es la única que no toca ni un asset.

---

## 8 · Riesgos declarados

- **Protegidos: ninguno participa.** Con un matiz que conviene tener escrito: `gameTable.css` (protegido) contiene los tres `background: url(reverso_carta.svg)` del mazo y la voladora ([642](src/styles/gameTable.css#L642), 664, 1080). La Fase 1 **no los toca** — el reverso es un SVG de 6,8 KB y se queda como está. Si alguna vez se quisiera cambiar el reverso, ahí hay una compuerta.
- **Dos caminos de render: cubiertos por construcción.** `CardImage` es el punto único de la cara de la carta y sirve tanto a `OpponentPanel` (mesas 5/4/3) como a `.ai-zone` (mesa 2) a través del mismo `renderOpponentCard`. Verificado en el Bloque 2: las dos vías piden exactamente los mismos archivos.
- **Techo de calidad.** La transcodificación parte del PNG, no de un maestro vectorial. Mientras el PNG siga en el repo no hay degradación acumulativa —cada regeneración parte del mismo origen—, y ése es el argumento fuerte de (A) sobre (B).
- **AVIF.** No medible aquí. Si Victor lo quiere, exige dependencia nueva o servicio externo, y su ganancia sobre WebP a estos tamaños (11–18 KB por carta) son pocos KB. El esfuerzo no está claro; la decisión es suya.
- **Trampa del `_headers`:** `immutable` es seguro para `/assets/*` porque Vite les pone hash de contenido (40/40 confirmados), pero **`public/` NO lleva hash** — `heptacoin.webp`, el póster, los iconos, el manifest. Darles `immutable` dejaría cacheada una versión vieja tras un despliegue. El `_headers` de la Fase 1 tiene que distinguir las dos zonas.
- **Aparato físico:** (1) que el WebP a 320 px no se vea blando en el S25 real, que es donde Victor juega — la comparativa 3 dice que no, pero está hecha en un monitor; (2) AVIF en el iPhone de la familia, si se elige ese camino; (3) que la precarga en el lobby no compita con nada crítico en una red móvil de verdad.

---

**STOP.** Nada más entra en esta fase. La Fase 1 se abre con instrucción propia del rector.

Un apunte de método, por si sirve para redactarla: los ~7,9 MB de la primera mano son sobre todo **dos cartas que no se juegan** — `doce_oro` y `once_oro`, las decorativas de la Bienvenida, al 22 % de opacidad y a 150 px CSS. Son 1,79 MB descargados antes de que nadie reparta. Si la Fase 1 sólo hiciera eso, ya sería la mitad del problema del arranque.
