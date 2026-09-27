# AJILEI · CAP-1 · Fase 0 — Informe (solo lectura)

**Versión:** 1.0 · 2026-09-26
**Ficha:** `AJILEI_CAP-1_Fase0_v1.0.md` · **Base:** `main` en `82917bd` · **Ejecuta:** Claude Code
**Instrumento:** playwright-core 1.62.1 + Edge **153.0.4234.48** (canal `msedge`), `vite preview` en 4173 tras `npm run build`.
**Escrito:** este informe y `capturas-cap/` (sin versionar). Ningún cambio en `src/`, `scripts/`, `public/`, `index.html` ni `.gitignore`. Sin commits. Protegidos (`gameEngine.js`, `aiPlayer.js`, `deck.js`) sin abrir.

---

## Resumen en seis líneas

1. **Determinismo: SÍ.** Con `Math.random` sembrado (mulberry32) basta: mismo reparto, mismas decisiones de las IAS y **PNG idéntico al byte** entre procesos, *siempre que* se fije la fase de la única animación infinita (`turnBreath`). `crypto.getRandomValues` no hace falta.
2. **La mesa no se alcanza en `vite preview` sin sesión** (el bypass es `DEV && VITE_AUTH_BYPASS`). El taller entra con una **sesión simulada** y **toda** la red a Supabase interceptada por `page.route`. Es la sorpresa principal (E1-1) y la pregunta 1 al rector.
3. **La laptop de la escena 5 sólo enseña el 60–64 % del alto de `mesapc` de hoy** (1122×939 en un hueco ~1,87–1,98): se pierden la cabecera y la botonera. Con una maestra 16:9 se ve el 92–95 %.
4. **Medidas propuestas:** vertical **360×704 @3** (1080×2112), horizontal **780×360 @3** (2340×1080), escritorio **1366×768 @2** (2732×1536).
5. `gen-portada-assets.mjs` **es reejecutable tal cual**: no recorta 100/130 fijos, **detecta** la caja del juego por el filete dorado. Una réplica del taller reproduce los tres derivados de hoy **al byte**. Sin barras no se pierde mesa.
6. `og:image` es URL absoluta y fija (`https://ajilei.io/og-image.jpg`), sin huella y sin regla de caché propia: hay que versionar el nombre.

---

## A. Inventario

### A1. Archivos

| Pieza | Ruta | Dimensiones | Formato | Peso | Rastreado |
|---|---|---|---|---|---|
| maestra vertical | `PUE_mesav_demo.jpg` (raíz) | 1080×2340 | JPEG | 695 886 B | **sí** (DOC-1b `3ea2e27`) |
| maestra horizontal | `PUE_mesah_demo.jpg` (raíz) | 2340×1080 | JPEG | 776 179 B | sí |
| maestra escritorio | `PUE_mesapc_demo.png` (raíz) | 1122×939 | PNG | 524 627 B | sí |
| derivado `mesav` | `src/assets/portada/mesav.webp` | 340×679 | WebP q 0,92 | 30 886 B | sí |
| derivado `mesapc` | `src/assets/portada/mesapc.webp` | 820×686 | WebP q 0,92 | 49 914 B | sí |
| derivado `og-image` | `public/og-image.jpg` | 1200×630 | JPEG q 0,85 | 109 974 B | sí |

Copias en `capturas-cap/actual/`. Las maestras son capturas a mano del S25 (con barras del sistema) y una ventana de escritorio de 1122×939 (no es una resolución de pantalla).

### A2. `scripts/gen-portada-assets.mjs`

- **Entradas → salidas:** `PUE_mesav_demo.jpg` → `src/assets/portada/mesav.webp` (ancho 340, techo 80 KiB, WebP, recorte `juego`); `PUE_mesapc_demo.png` → `mesapc.webp` (ancho 820, techo 120 KiB, WebP, **sin recorte**); `PUE_mesah_demo.jpg` → `public/og-image.jpg` (1200×630 fijo, techo 200 KiB, JPEG con calidad tope 0,85, recorte `juego`, encaje **contener** con bandas `#09170e`). Más las cinco copas (IDX-1), fuera del alcance.
- **Calidad:** empieza en la tope (0,92 o 0,85) y sólo bisecciona si se pasa del techo.
- **Recorte:** **no** hay constantes 100/130. El script busca la caja envolvente de las filas y columnas con ≥ 30 % de píxeles **dorados** (el filete de la mesa); los comentarios explican que la versión «verde» fallaba por el `theme-color` de la barra de estado. Los 100/130 sólo viven en un comentario (la lámina los recortaba por CSS).
- **¿Reejecutable con maestras nuevas?** **Sí, tal cual.** Probado sin ejecutarlo: el cuerpo de canvas se copió literal en `capturas-cap/_taller/derivar.mjs` y, desde las maestras de hoy, reproduce `mesav.webp`, `mesapc.webp` y `og-image.jpg` **idénticos al byte**.
- **¿Qué pasa si la entrada ya no trae barras?** No recorta 230 px buenos: se queda en el filete dorado. Medido con las candidatas: vertical 1080×2340 → caja `27,24 1026×2292`; horizontal 2340×1080 → caja `21,18 2298×1044`. Sólo se van los 8–9 px CSS de margen del tapete fuera del marco, que es lo mismo que pasaba con las de hoy.
- **Cambios que sí propongo (no aplicados):**
  1. Nombres de maestra por **constante o argumento** (`--maestras capturas-cap/…` o `CAP_*.png`), para que la Fase 1 no tenga que sobrescribir `PUE_*_demo.*` en la raíz, o renombrarlos.
  2. El comentario de cabecera dice que las maestras «viven en la RAÍZ sin rastrearse», pero están rastreadas desde DOC-1b. Hay que corregirlo.
  3. `mesapc` debe seguir **sin recorte** (ver B3: recortada al oro sale a 1,44 y la laptop enseña menos).
  4. Si D1 adopta un nombre versionado, el destino del `og-image` sale de una constante compartida con `index.html` (ver D1).

### A3. Consumidores

**Escena 5** (`Portada.jsx:489-504`, `portada.css:543-625` y los escalones 808/895): dos `<img>` con `object-fit: cover` y `object-position: 50% 50%` (valor por defecto). La laptop es un hueco `aspect-ratio: 16/9` en *border-box* con relleno 7/7/9, así que la imagen **no** es 16:9. El teléfono tiene `aspect-ratio: 340/679`, pero la caja medida del `<img>` sale a 0,539. En móvil (≤ 900 px) hay relevo: el teléfono aparece a los 0,1 s y se desvanece a los 2 s, y luego sube la laptop a los 2,2 s. En escritorio aparecen los dos juntos.

Qué parte de la captura **se ve de verdad** (medido en `vite preview`, con `getBoundingClientRect` y `naturalWidth` en la escena 5 activa):

| Viewport | Laptop: caja CSS · proporción | `mesapc` hoy visible | Teléfono: caja CSS · proporción | `mesav` hoy visible |
|---|---|---|---|---|
| S25 360×780 | 200,9×104,0 · 1,932 | 100 % ancho × **61,9 %** alto (recorta 130,7 px de 686 arriba y abajo) | 74,0×137,3 · 0,539 | 100 % × 92,9 % (24 px arriba y abajo) |
| 390×844 | 203,9×105,7 · 1,929 | 100 % × **62,0 %** | 75,1×139,3 · 0,539 | 100 % × 92,9 % |
| 360×640 | 158,6×80,2 · 1,977 | 100 % × **60,5 %** | 64,1×118,9 · 0,539 | 100 % × 92,9 % |
| 1920×1080 | 328,9×176,0 · 1,869 | 100 % × **64,0 %** | 137,0×254,2 · 0,539 | 100 % × 92,9 % |

Hoy la laptop enseña la franja central de la mesa: se pierden la cabecera (wordmark, «Mano #1», ⋮ ✕) y la botonera del jugador (`actual/escena5_1920.png`). El teléfono recorta un poco el wordmark arriba. Densidad: la laptop pinta 2,5 px de `mesapc` por px CSS a 1920 y 4–5 en móvil. El teléfono, 2,5 a 1920 y 4,6 en el S25, así que los anchos 820/340 siguen bastando.

**`index.html:51` y `:61`:** `og:image` y `twitter:image` apuntan a `https://ajilei.io/og-image.jpg`. Es una **URL absoluta con nombre fijo, sin huella** (el comentario de las líneas 36-41 lo defiende a propósito). Declara `og:image:width` 1200, `og:image:height` 630 y `og:image:alt`.

**Otros consumidores:** `public/_headers` sólo da caché `immutable` a `/assets/*`, así que `og-image.jpg` va con la caché por defecto del host. En `diagPUE.mjs:1074` hay una regex de carga perezosa que usa los nombres `mesapc|mesav` (sin extensión ni hash, así que sobrevive). `PUE_lamina_v1.7.html` lee las maestras `PUE_*_demo` por ruta relativa. Aparecen además en documentos: `AJILEI_Sistema_Diseno_v1.2.md:380` (IDX-1 Fase 1c D-14 pendiente, que **es esta campaña**), `AJILEI_PUE_Auditoria_v1.0.md:10` y `AJILEI_CAR1_Fase1_v1.0.md:73`. No aparecen en el manifest.

### A4. El guion de las capturas actuales

| | `mesav` (S25 vertical) | `mesah` (S25 horizontal) | `mesapc` (escritorio) |
|---|---|---|---|
| Mesa | 5 (4 IAS), nivel **no visible** en pantalla | 5 | 5 |
| Mano / fase | Mano #1 · 1.ª ronda de apuesta tras el reparto completo: **«A las 3 — Tú abre.»**, turno del humano (cronómetro 18 s) | igual (18 s) | igual (19 s) |
| Boca arriba | las 5 del humano: 1B · 2E · 2O · 3C · 10B (baraja **clásica**, índice doble) | 2B · 6C · 7E · 7B · 1O | 11O · 5E · 10E · 12E · 12O |
| Boca abajo | 4×5 dorsos con el **reverso viejo** (anterior a REV-1) y un dorso en el mazo junto a IA 4 (Pie) | igual | igual |
| Estado de las IAS | las cuatro «Igualó» | igual | igual |
| Pozo | 2000 (mesa 200) | 2000 | **4000 (mesa 400)** |
| Otras marcas | «Comodín activo · vale 11», píldoras MANO y TURNO del humano, P en IA 4 | igual | igual |
| Nombre / saldo / avatar | **«Tú»** · 4600 · «Mesa 200» · moneda H. Sin nombre de usuario ni avatar | «Tú» · 4600 | «Tú» · 4200 · «Mesa 400» |
| Idioma / orientación | español · vertical | español · horizontal | español · 1122×939 |

La receta que reproduce ese momento, verificada por la bitácora de la sonda: en «A las 2» el humano **Apuesta ×1**, las cuatro IAS **igualan** y se fotografía el turno «**A las 3 — Tú abre.**» con pozo 2000. Diferencia de hoy: el saldo ya no es 5000 − 400. Desde APU-1 1e depende de la entrada elegida («medio» = 20× → 4000, que queda en **3600** en pantalla).

---

## B. El camino del arnés

### B1. Modos existentes

Ningún modo actual sirve tal cual:

- Todos los modos de `diagDSK.mjs` que llegan a la mesa (`rec`, `apu`, `luz`, `rev`, `msg`, `gate`…) usan `recorrerRuta` de `scripts/rutaMesa.mjs` (número de jugadores, reto, apuesta y entrada por `data-accion`, **reutilizable**). Pero corren contra **5173 con bypass**.
- Los moldes `?apu=` y `?cel=` son `DEV`-only y en `vite preview` no existen.
- Sí hay **precedente de siembra**: `msgSiembraAzar` (ARN-3, mulberry32 con contador de tiradas) y `luzSembrar` (LUZ-1).
- Fases alcanzables de forma controlada: turno de apuesta, descarte (`luzLlevarAlDescarte`), revelación y resultado (`playToShowdown`, `msgJuegaUnaMano`), y las siete puertas de `rec`. Ninguno para en «A las 3 tras igualar».

El taller combina `recorrerRuta` con la sesión simulada y la receta de A4, y **alcanza la escena en 12 de 12 corridas con las 8 semillas probadas**: en reto «pro», las cuatro IAS igualan siempre la apuesta ×1.

### B2. Azar: prueba de caja negra

Método: `addInitScript` sustituye `Math.random` por mulberry32(semilla) con contador. Se hacen dos corridas completas con la misma semilla (contextos nuevos) y una con otra semilla, y se comparan el reparto de «A las 2» (DOM), la secuencia de mensajes y rótulos de las IAS muestreada cada 150 ms y el PNG (sha256 más diferencia por píxel hecha en el navegador).

| Prueba | Reparto | Decisiones IAS | Tiradas servidas | PNG |
|---|---|---|---|---|
| v, semilla 11 ×2, sin fijar fase | = | = | 60 / 60 | **distinto**: 221 825 px, Δmáx 3, caja y 1344–2315 |
| v, semilla 11 ×2, fase fijada | = | = | 60 / 60 | **idéntico** (0 px) |
| h, semilla 11 ×2, fase fijada | = | = | — | **idéntico** |
| pc 1920×1080 @1, fase fijada | = | = | — | distinto: 47 313 px, Δmáx 3 (óvalo y rivales altos) |
| pc 1920×1080 @1, fase fijada, +3 s de espera | = | = | — | distinto: 90 297 px, Δmáx 4 |
| pc 1920×1080 @1, fase fijada, `--disable-gpu` | = | = | — | distinto: 5 592 px, Δmáx 2 |
| **pc 1366×768 @2, fase fijada**, en 2 procesos distintos | = | = | — | **idéntico** (`ed95865a779ec350` las dos veces) |
| semilla 11 frente a 23 | 3B·11C frente a 5B·4B | — | — | manos distintas ✔ |

**Veredicto: determinista, sí.** Las fuentes de variación, identificadas por comportamiento:

1. **`turnBreath`**, la respiración dorada de `.player-zone.turn-active` (2,4 s, infinita). Es la **única** animación viva en el momento de la foto, y su fase depende del reloj real. Se fija con Web Animations (`pause()` y `currentTime = 1200`), sin `prefers-reduced-motion` y sin cambiar el aspecto: sólo se elige el instante.
2. **El cronómetro del turno:** se lee «20s» en todas las corridas porque la mesa queda quieta en unos 140 ms (espera real con `getAnimations()` y vuelos a cero, no un tiempo fijo). Es un margen de ~860 ms, no una garantía. Para la Fase 1 propongo `page.clock` o comprobar «20s» en el DOM antes de disparar.
3. **Rasterizado a 1920×1080 @1:** ruido de ±2–4 niveles en degradados grandes y sombras, que no desaparece ni con espera ni del todo sin GPU. Es la misma familia que la trampa de IDX-1 (texto en lienzo GPU). **No aparece a 1366×768 @2**, que es la medida propuesta.

`Date.now` y los temporizadores **no** alteran la mano: las mismas 60 tiradas en el mismo orden. `crypto.getRandomValues` no interviene en la mano, así que no hace falta sembrarlo. Un hecho útil: **la misma semilla da la misma mano en las tres vistas** (v, h y pc comparten reparto), así que una semilla sellada es una sola mano para las tres maestras.

### B3. Viewports y resolución

**Vertical.** No coincide con las actuales. La maestra de hoy, ya recortada al oro, mide 1039×2074 (proporción 0,5007: el viewport standalone del S25 menos las barras). A 360×780, la mesa rellena la pantalla entera y el derivado sale a 0,447, así que el teléfono enseña **el 83 %** del alto (hoy el 93 %). Medido:

| Maestra vertical | Derivado | Visible en el teléfono |
|---|---|---|
| hoy (S25 real) | 340×679 | 92,9 % |
| 360×780 @3 | 340×760 | 83,0 % |
| 360×720 @3 | 340×708 | 89,1 % |
| **360×704 @3** (propuesta) | ≈340×692 (proporción 0,491) | ≈91 % (interpolado, sin medir) |

**Propuesta: 360×704 @3 → 1080×2112**, que es el viewport real del S25 en standalone: (2340 − 100 − 130) / 3 ≈ 703. Enseña la mesa como la ve el jugador. Alternativa: 360×668 llena el hueco al 100 %, pero comprime la mesa por debajo de lo real.

**Horizontal (fuente de `og-image`).** **780×360 @3 → 2340×1080.** Es el formato de hoy, y la regla actual (oro más contener) da 1200×630 con bandas finas (`deriv/og_s*.jpg`, legible a 400 px). La caja del juego sale a 2,20 frente al 1,905 de la tarjeta. Una captura más estrecha (~686×360) llenaría la tarjeta sin bandas, pero no la he medido; queda como opción para el rector.

**Escritorio.** La mesa mide como máximo 1084×830 CSS y se centra.

| Medida | Proporción | Mesa en pantalla | Visible en la laptop (1920 / S25) | Píxeles para DIS-1 |
|---|---|---|---|---|
| hoy 1122×939 | 1,195 | la llena | 64 % / 62 % | 1122×939 |
| 1920×1080 @1 | 1,778 | 1084×830: **56 % del ancho**, márgenes oscuros | ≈95 % / 92 % | 1920×1080 (y ruido de ±4, B2) |
| 1440×900 @2 | 1,600 | 1084×830: 75 % | ≈86 % / 83 % | 2880×1800 |
| 1920×1200 @1 | 1,600 | 1084×830: 56 % | ≈86 % / 83 % | 1920×1200 |
| **1366×768 @2** (propuesta) | 1,779 | 1084×752: **79 %** | **95,2 % / 92,1 %** (medido) | **2732×1536** |
| 1280×720 @2 | 1,778 | 1084×704: 85 % | ≈95 % / 92 % | 2560×1440 |

**Propuesta: 1366×768 @2.** Es la resolución de portátil más común, su 16:9 casa con el hueco, la mesa llena casi todo, da 2,7 k de ancho para DIS-1 y sale **idéntica al byte**. Si DIS-1 pide más, 1366×768 @3 (4098×2304) no cambia la composición. `mesapc` debe seguir **sin recorte al oro**: recortada sale a 820×569 (1,44) y la laptop enseña sólo el 75–77 % (medido, `marco/s5juego_*`).

### B4. Barras del sistema

El marco plano del teléfono **no reserva hueco** para barras: la pantalla es un rectángulo con `border-radius: 19px` y la imagen en `cover`. El derivado de hoy ya llegaba sin barras, porque el recorte al oro las quita. Una captura del arnés sin barras encaja **igual**. Con 360×704 encaja casi igual que hoy, y con 360×780 peor (B3).

### B5. Identidad en pantalla

- **Sesión del taller:** simulada. En `localStorage` va una sesión falsa (`uid 11111111-…`, correo `cap@example.invalid`) y se interceptan todas las peticiones a `cbbnddlapolelbdsprjm.supabase.co`. `profiles` responde `username: Jugador_AJ` y las RPC (`mi_sala`) responden `null`. **No sale ni una petición al proyecto real.**
- **Qué aparece en la mesa:** el asiento del humano dice **«Tú»**; el saldo, «**3600 Heptacoins · Mesa 200**»; la moneda H, y ni avatar ni inicial. La barra superior sólo lleva wordmark, «Mano #1», ⋮ y ✕. Rivales «IA 1…IA 4». **El nombre de usuario no aparece en ninguna de las tres vistas** (0 apariciones de `Jugador_AJ` en el texto de la mesa), y ningún `test1976` ni `DevLocal`.
- **Qué le toca decidir a Victor:** el saldo visible (3600 con entrada «medio»; con «techo» sería otro), la mesa (200 o 400, como la `mesapc` de hoy) y si se admite «20s» en el cronómetro.

---

## C. Candidatas

### C1. Semillas y capturas

Las 12 están en la raíz de `capturas-cap/`: `v_s*.png` (1080×2340), `h_s*.png` (2340×1080) y `pc_s*.png` (2732×1536). Reto **pro**, apuesta 200, entrada medio, fase de `turnBreath` a 1200 ms. Se barrieron 8 semillas y todas alcanzan la escena. Me quedé con las que tienen más palos y figuras:

| Semilla | Mano del jugador | Por qué |
|---|---|---|
| **5** | 3E · Rey E · As C · Rey B · 5O | cuatro palos, dos reyes y el As de copas. **La favorita** |
| 101 | 5B · Caballo E · Sota C · As E · 4B | tres palos, dos figuras |
| 2026 | Caballo B · Rey C · 2B · 3E · 3B | tres palos, dos figuras |
| 11 | 3B · Caballo C · 6E · 6O · 3C | cuatro palos, una figura. Control de B2 |

Descartadas: 23 (tres bastos y poca figura), 42, 88 y 1976 (dos palos dominan). Ninguna IA quebrada: todas igualan y el pozo es 2000.

### C2. Hoja `capturas-cap/hoja.html`

Contiene:

- la actual frente a las cuatro candidatas, por vista;
- **cada candidata dentro del marco real de la escena 5**, en `vite preview` sin sesión, con el derivado servido por `page.route` sobre `/assets/mesav-*.webp` y `/assets/mesapc-*.webp`, a 1920×1080 y en el S25 (teléfono y laptop del relevo);
- la variante `mesapc` recortada al oro, que es peor;
- la variante vertical 360×720;
- la `og-image` 1200×630 con la regla actual y reducida a 400×210.

Los derivados se generaron **en el navegador** con la réplica literal del script, porque `sharp` no está en el proyecto (ver E1-3), y se guardaron en `capturas-cap/deriv/`, nunca en `src/assets/`.

### C3. Pesos

| | `mesav` (techo 80 KiB) | `mesapc` (120 KiB) | `og-image` (200 KiB) |
|---|---|---|---|
| hoy | 30,2 KiB · 340×679 | 48,7 KiB · 820×686 | 107,4 KiB |
| s5 | 36,4 KiB · 340×760 | 30,3 KiB · 820×461 | 107,5 KiB |
| s101 | 36,4 KiB | 30,4 KiB | 107,4 KiB |
| s2026 | 36,9 KiB | 31,1 KiB | 108,6 KiB |
| s11 | 36,8 KiB | 31,2 KiB | 108,2 KiB |

Todos entran con la calidad tope (0,92 y 0,85), sin bisección. Con la vertical a 704, `mesav` pesaría algo menos (35,0 KiB medido a 720).

---

## D. `og-image` y las cachés de las redes

Hoy la URL es fija y absoluta, y `og-image.jpg` no tiene cabecera propia en `_headers`. WhatsApp, Facebook, LinkedIn, X y Telegram cachean la tarjeta **por URL de la imagen y de la página**, entre días y semanas. Si se cambia el archivo sin cambiar la URL, la tarjeta vieja se sigue viendo.

**Propuesta: nombre versionado a mano, `og-image-v2.jpg`** (o `og-cap1.jpg`).

- *Por qué no una huella automática:* Vite no procesa `index.html → public/`, así que habría que calcularla en el generador y reescribir `index.html`. Es más maquinaria para algo que cambia una vez por campaña.
- *Por qué no un parámetro (`?v=2`):* Facebook y WhatsApp lo respetan como URL nueva, pero algunos rastreadores normalizan la consulta y el archivo servido sigue siendo el mismo. El nombre nuevo no tiene esa ambigüedad.

**Qué hay que tocar** (Fase 1):

- `gen-portada-assets.mjs`: el `destino` del trabajo `og-image`.
- `index.html:51` y `:61`, más el comentario de las líneas 36-41.
- Borrar `public/og-image.jpg`, o **conservarlo** unos meses para las tarjetas ya cacheadas que lo pidan. Recomiendo conservarlo una campaña.
- Opcional: en `_headers`, `/og-image*` con `Cache-Control: public, max-age=86400`, para acotar la caché de los intermediarios.

**Cómo forzar la relectura** (lo hace Victor en producción, tras el deploy):

- **Facebook/Meta** (también sirve para WhatsApp e Instagram, que comparten raspador): Sharing Debugger (`developers.facebook.com/tools/debug/`) y luego «Scrape Again».
- **LinkedIn:** Post Inspector.
- **X:** ya no tiene validador. Se relee al publicar una URL nueva o a los ~7 días.
- **Telegram:** mandar la URL a `@WebpageBot`.
- **WhatsApp:** cachea por conversación en el dispositivo. Una prueba limpia pide la URL con algo que la haga nueva (`https://ajilei.io/?s=2`).

---

## E. Cierre

### E1. Contradicciones y sorpresas frente a la ficha

1. **Sin sesión, `vite preview` no llega a la mesa.** `AUTH_BYPASS = DEV && VITE_AUTH_BYPASS` (`useAuth.js:50`), así que en un build de producción la cascada de `App.jsx` se queda en la Portada. La ficha manda el arnés a 4173 y a la vez pide capturas de la mesa. El taller lo resolvió **sin tocar `src/`**, con una sesión simulada y la red a Supabase interceptada, porque la regla 7 lo admite como herramienta del arnés. Pero esto **define qué verá la publicidad** y debe sellarlo el rector (pregunta 1). Alternativas: una sesión real de Victor (exige el buzón, como la verificación de LOB-1 que sigue pendiente) o un build `NODE_ENV=development` servido por `vite preview` (no es el artefacto que se publica).
2. **Los 100/130 de la ficha no existen en el script**, que detecta el filete dorado (A2). Por eso la maestra sin barras no pierde mesa y no hace falta ninguna bandera.
3. **`sharp` no está** en el proyecto: ni en `dependencies`, ni en `devDependencies`, ni en `node_modules`. El propio script lo documenta. C2 usó la réplica en canvas del navegador, que es el método de la casa.
4. **360×780 no es la medida del S25 que vemos hoy.** Es la pantalla entera sin barras. La captura actual equivale a ~360×703, y 780 deja el teléfono de la escena 5 enseñando el 83 % (B3).
5. **La laptop de hoy recorta un 36–40 % del alto de `mesapc`**. Nadie lo pidió, pero cualquier maestra 16:9 lo corrige de paso.
6. **La `mesapc` de hoy tiene otra mesa** (400, pozo 4000). Si las tres maestras salen de una misma semilla, las tres enseñan la misma mano y la misma mesa (pregunta 3).
7. **Las maestras están rastreadas** (DOC-1b), al contrario de lo que dice el comentario de `gen-portada-assets.mjs`.
8. **`capturas-cap/` no está en `.gitignore`.** La línea entra en la Fase 1.
9. **Edge ya es la 153.0.4234.48.** Las baselines de ARN-1 citan la 151. Las cifras de este informe son de la 153.

### E2. Propuesta de Fase 1

1. **Modo `cap` permanente** en `scripts/diagDSK.mjs` (o en `diagPUE.mjs`, que ya es el arnés de 4173; prefiero el segundo):
   - `BASE` 4173 y sesión simulada con toda la red a Supabase interceptada. El nombre del perfil sale de una constante, aunque hoy no se pinta en la mesa;
   - **semilla sellada** (propuesta: 5) y **viewports sellados**: v 360×704 @3, h 780×360 @3, pc 1366×768 @2;
   - receta sellada: mesa 5, `pro`, apuesta 200, entrada `medio`, Apostar ×1 en «A las 2» y foto en «A las 3 — Tú abre.»;
   - espera real (`getAnimations()` y vuelos a cero), comprobación de «20s» en el DOM y fase de `turnBreath` fijada;
   - **puertas:** escena alcanzada, mano esperada para la semilla, pozo 2000, las 4 IAS «Igualó», 0 errores de página, cero peticiones fuera de la ruta interceptada y **hash de cada maestra estable en dos pasadas**;
   - escribe las maestras donde lea `gen-portada-assets.mjs` y deja la hoja en `capturas-cap/`.
2. **`gen-portada-assets.mjs`:** origen de las capturas parametrizado (o las maestras nuevas renombradas con la convención que elija el rector), destino `og-image-v2.jpg`, y el comentario de cabecera corregido (maestras rastreadas). **Sin cambios en el recorte:** no hace falta ninguna bandera para entrada sin barras.
3. **`index.html`:** `og:image` y `twitter:image` a `og-image-v2.jpg`. Opcional: regla en `_headers`.
4. **`.gitignore`:**
   ```
   # CAP-1 · candidatas, derivados de prueba y hoja de revisión (modo `cap`).
   # REGENERABLES con semilla sellada, mismo criterio que capturas-rec.
   capturas-cap/
   ```
5. **Mapa de commits previsto:**
   - **CAP-1a:** modo `cap` del arnés y la línea de `.gitignore`.
   - **CAP-1b:** maestras nuevas a resolución nativa (tres PNG, ~4,2 MB en total, rastreadas como las de hoy para DIS-1) y el ajuste de `gen-portada-assets.mjs`.
   - **CAP-1c:** derivados regenerados (`mesav.webp`, `mesapc.webp`, `og-image-v2.jpg`) y `index.html`.
   - **CAP-1d:** informe de cierre, y la nota del Sistema de Diseño que cierra IDX-1 D-14 (`AJILEI_Sistema_Diseno_v1.2.md:380`).

   Victor borra `capturas-cap/_taller/` a mano al cerrar.

### E3. Preguntas al rector

1. **¿Se sella la sesión simulada** (red a Supabase interceptada, `page.route`) como la vía del modo `cap` contra 4173? ¿O prefieres sesión real o un build de desarrollo servido por preview?
2. **¿Vertical a 360×704** (el S25 real en standalone, ≈91 % visible en el teléfono)? ¿O 360×780, como dice la ficha (83 %)?
3. **¿Una sola semilla y una sola mesa (200) para las tres maestras?** ¿O se respeta la `mesapc` de hoy a 400 (reto pro, apuesta índice 1)?
4. **Semilla:** propongo **5** (cuatro palos, dos reyes y el As de copas). Victor elige en `hoja.html`.
5. **`og-image`:** ¿se mantienen las bandas de «contener», o se prueba una captura horizontal de 1,905 (~686×360) que llene la tarjeta?
6. **Nombre versionado:** ¿`og-image-v2.jpg` y conservar el viejo una campaña?
7. **Saldo visible** en la publicidad (3600 con entrada medio) y el cronómetro en «20s»: ¿de acuerdo?

### E4. Tiempo real

Unos **35 minutos de reloj** (10:18 → ~10:53), dentro del tope de 60. Casi todo se fue en corridas del navegador: B2 (6 pasadas de 3 escenas), el barrido de 8 semillas, las 12 candidatas y los 10 marcos de la escena 5.

---

## Anexo · Contenido de `capturas-cap/`

- `v_s{5,101,2026,11}.png` (~1,2 MB c/u), `h_s*.png` (~1,2 MB), `pc_s*.png` (~1,75 MB): las 12 candidatas.
- `hoja.html`: la hoja de revisión.
- `actual/`: copias de las 3 maestras y los 3 derivados de hoy, más 7 fotos de la escena 5 de hoy (360×640, 390×844, S25 y 1920).
- `deriv/`: `mesav_s*.webp`, `mesapc_s*.webp`, `mesapcJuego_s*.webp`, `og_s*.jpg` y `og400_s*.png`.
- `marco/`: la escena 5 con cada candidata (S25 teléfono y laptop, y 1920) y la variante `s5juego`.
- `_taller/`: `comun.mjs` (sesión simulada, siembra y espera real), `escena.mjs`, `b2.mjs`, `b3.mjs`, `c1.mjs`, `c2.mjs`, `derivar.mjs` (réplica literal del generador), `escena5.mjs`, `a3.mjs`, `hoja.mjs`, las sondas, los JSON de medida y las PNG de las pruebas. Victor lo borra a mano.
- Total: unos 54 MB.
