# AJILEI — Campaña CAR-1 · Baraja: compresión y precarga · Fase 1 · v1.0

**Instrucción para Claude Code · Producción · 04-sep-2026**

---

## Contexto

La Fase 0 (`AJILEI_CAR1_Fase0_Informe_v1.0.md`, base `3e8cd15`) midió tres causas del flash de carta: 40 PNG de 24,28 MB a 4,2-21,8× la resolución pintada; cero precarga; y Cloudflare sirviendo `/assets/*` con `max-age=0, must-revalidate` pese al hash de contenido. El flash es de **red** (1 893 ms en Fast 4G contra ~15 ms de decodificación). Las dos decorativas de la Bienvenida cuestan 1,79 MB antes de repartir nada.

Sellado por Victor y el rector — opción (A) con siete decisiones:

1. Los PNG **se quedan** en `src/assets/cards/` como maestros, sin referencia desde el código. Los derivados viajan en el repo.
2. **WebP q80, 320×452.** Escape: q90 si el S25 lo pide; es un número en el generador.
3. AVIF descartado.
4. Las decorativas de la Bienvenida usan **el mismo WebP de 320**.
5. `_headers` con **dos zonas**: `/assets/*` inmutable a un año; `public/` e `index.html` sin tocar.
6. Precarga en `App.jsx` junto a `precargarSonidos`, objetos `Image` retenidos en módulo, sin `decode()`.
7. `gen-cards.mjs` calcado de `gen-portada-assets.mjs` (navegador como convertidor).

**Criterio de esta fase: eficacia medida, eficiencia de toque.** Eficacia = la cifra del flash antes/después, no una impresión. Eficiencia = los archivos tocados son exactamente los siete que el informe nombró, ni uno más; ninguna dependencia nueva; el generador corre una vez y produce su propio informe de pesos.

## Mandato

1. **Régimen aditivo.** Archivos nuevos: `scripts/gen-cards.mjs`, `src/lib/precargaBaraja.js`, `public/_headers`, 40 WebP en `src/assets/cards/webp/`. Hunks en `CardImage.jsx`, `WelcomeScreen.jsx`, `App.jsx`. **Nada más.** Ningún PNG se borra ni se mueve.
2. Archivos protegidos según `docs/AJILEI_Protegidos_v1.0.md` (commit `25290bb`). Ninguno participa; `gameTable.css` no se toca (el reverso SVG se queda).
3. Cero dependencias nuevas. El convertidor es el navegador vía `playwright-core`, como `gen-portada-assets.mjs`.
4. **Sin commits, sin push.** Un STOP al cierre.
5. Cifras del arnés vigentes: `gate` 6/6 · `puerta` 6/6 · `mon` 12/12 · `2.5` 10/10.

## Bloque 1 — El generador `scripts/gen-cards.mjs`

Molde: `gen-portada-assets.mjs:14-24`. Lee los 40 PNG de `src/assets/cards/*.png`, los pinta en un canvas a **320×452** con suavizado de alta calidad (`imageSmoothingQuality = 'high'`), exporta `image/webp` a **calidad 0,80**, y escribe `src/assets/cards/webp/<mismo-nombre>.webp`.

Requisitos de eficiencia:

- **Calidad y tamaño son dos constantes al principio del archivo** (`ANCHO = 320`, `CALIDAD = 0.80`), con comentario de una línea que cite la Fase 0. El escape a q90 es cambiar un número y volver a correr.
- Una sola sesión de navegador para las 40, no una por carta.
- **Idempotente**: correr dos veces produce los mismos 40 archivos (mismo tamaño en bytes; si el codificador del navegador no es determinista al byte, decláralo y compara por dimensiones y peso ±1 %).
- Al terminar imprime una tabla: nombre · KB origen · KB WebP · ratio, y al pie el total. **Esa tabla va en el reporte.** Cota esperada: total ≈ 0,57 MB; si sale por encima de 0,80 MB, STOP y reporta antes de seguir.
- Verifica después de escribir que los 40 WebP existen, miden 320×452, y no hay ninguno de 0 bytes.

## Bloque 2 — El código sobre los derivados

**2.1 `CardImage.jsx:1`** — el glob pasa de `'../assets/cards/*.png'` a `'../assets/cards/webp/*.webp'`. `NUM_MAP`/`PALO_MAP` y la construcción de la ruta (línea 15) no cambian. Exporta además, de forma aditiva, la lista de URLs que el glob resuelve (`export const URLS_BARAJA = Object.values(…)`) para que la precarga no repita el glob.

**2.2 `WelcomeScreen.jsx:4-5`** — los dos imports (`doce_oro.png`, `once_oro.png`) apuntan a los WebP de 320. Nada más en ese archivo.

**2.3 Comprobación de que los PNG dejan de viajar**: tras `npm run build`, `dist/assets/` debe contener **40 `.webp` de carta y cero `.png` de carta**. Si Vite emite algún PNG de carta, hay una referencia que el informe no vio: STOP y reporta dónde.

## Bloque 3 — La precarga

**3.1 `src/lib/precargaBaraja.js`** — nuevo, corto:

- Importa `URLS_BARAJA` de `CardImage.jsx`.
- `precargarBaraja()`: por cada URL crea `new Image()`, asigna `src`, y guarda el objeto en un array **a nivel de módulo** (retención deliberada: sin referencia viva, el navegador puede desalojar la imagen antes de la mesa). Guarda de reentrada: la segunda llamada no hace nada.
- Sin `decode()`, sin promesas que esperar: el objetivo es que la red ocurra ahora; la decodificación es ruido medido.

**3.2 `App.jsx:62-64`** — una línea junto a `precargarSonidos(SONIDOS_MESA)`, misma condición (`screen !== 'welcome'`), misma doctrina. Nada más en `App.jsx`.

**3.3 Orden de peticiones**: verifica en Network que la precarga de la baraja **no retrasa** la primera pintura de la pantalla de dificultad. 40 peticiones de ~15 KB en paralelo con HTTP/2 son inmediatas en escritorio; en Fast 4G deben terminar en menos de lo que tarda el usuario en elegir mesa y apuesta (Fase 0: varios segundos). Mide el tiempo hasta la última carta descargada en Fast 4G desde que entra a dificultad.

## Bloque 4 — `public/_headers`

Archivo nuevo, dos zonas, y solo dos:

```
# CAR-1 / GOV: los assets de Vite llevan hash de contenido; un año inmutable es seguro.
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

**Lo que NO lleva regla**, deliberadamente: `index.html`, `manifest.webmanifest`, los iconos, `heptacoin.webp` y su póster, `og-image.jpg` — todo lo de `public/` va sin hash y debe seguir revalidando. Comentario de una línea en el archivo que lo diga. Verifica que `dist/_headers` existe tras el build (Vite copia `public/` a la raíz de `dist/`).

La eficacia de esta pieza solo se mide en producción (`curl -I` contra `ajilei.io` tras el despliegue); en esta fase se verifica la sintaxis y la presencia en `dist/`.

## Bloque 5 — Verificación medida: antes y después

La Fase 0 dejó las cifras de antes. Repite **la misma medición** con el árbol modificado, mismas condiciones (5173 bypass, 390×844 DPR 3, mesa 5, Fast 4G, caché deshabilitada):

| Cifra | Antes (Fase 0) | Después | Objetivo |
|---|---|---|---|
| Descarga al llegar a la Bienvenida | 1 787,4 KB | ? | < 40 KB |
| Descarga primera mano completa (12 cartas) | 7,80 MB | ? | < 0,25 MB |
| Retraso inserción → carta visible, mediana | 1 893 ms | ? | **< 100 ms** con precarga completada |
| Peticiones de carta durante el reparto | 2+ | ? | **0** (todas desde caché de memoria) |
| Baraja completa | 24,28 MB | ? | ≈ 0,57 MB |

Corre también **una vez sin precarga** (comentando temporalmente la llamada en `App.jsx`, y restaurándola): el retraso debe bajar a lo que cuesta un WebP de ~15 KB en Fast 4G (~60-80 ms). Esa cifra separa el mérito de la compresión del mérito de la precarga, y el reporte las declara por separado.

Además:

1. `npm run build` verde; `dist/assets/`: 40 WebP, 0 PNG de carta; `dist/_headers` presente.
2. `npm test` verde (467).
3. Arnés: `gate` 6/6 · `puerta` 6/6 contra 4173 · `mon` 12/12 · `2.5` 10/10.
4. `npx eslint .` en la línea base (20).
5. Dos caminos de render: mesa 2 y mesa 5 piden los mismos WebP (verificado en Network, como en Fase 0).
6. Tres capturas 1:1 en `capturas-pue/` (scratchpad, no repo): una figura en la mano a 390×844 DPR 3, la misma en `.ai-zone` de mesa 2, y una decorativa de la Bienvenida en escritorio. Para el ojo de Victor.
7. `git status --short`: exactamente los siete elementos del Mandato §1 más los cuatro residuos. Cualquier otra ruta = STOP.

## Cierre

**STOP.** Reporte con: la tabla del generador; los hunks resumidos de los tres archivos tocados; la tabla antes/después con las cinco cifras y la corrida sin precarga; los siete puntos de verificación; y `git status`. **Sin commits.**

Después: compuerta física de Victor en 4173 (OTP real) y en el S25 por red local — lo que mira es una sola cosa: **si alguna figura se ve blanda** en la mano y en el showdown. Si sí, q90 y se repite; si no, llega la instrucción de cierre: commits (`CAR-1a` generador + WebP · `CAR-1b` código sobre derivados · `CAR-1c` precarga · `GOV-3` `_headers`) y push con ceremonia.

**Cola abierta**: `heptacoin.webp` de 1 MB en la Portada (pesa el doble que la baraja entera; MON-2.1 puede mirarlo) · `baraja.svg` / `baraja2.svg` (5,2 MB de vectores en cola de retiro, ya nombrados) · `GT-HIG` · `ARN-x` · Identidad A al dominio.
