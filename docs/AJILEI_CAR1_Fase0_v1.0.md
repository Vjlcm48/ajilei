# AJILEI — Campaña CAR-1 · Baraja: compresión y precarga · Fase 0 · v1.0

**Instrucción para Claude Code · Diagnóstico de solo lectura · 04-sep-2026**

---

## Contexto

Dos síntomas conocidos: las imágenes de las cartas pesan del orden de **1 MB por archivo** (PNG), y en la primera aparición de una carta en la mesa hay un **flash blanco** antes de que se pinte. Hipótesis de trabajo, a confirmar o refutar: las cartas viajan a una resolución muy superior a la que se pintan, se piden a la red la primera vez que se muestran, y el navegador tarda en descargar y decodificar más de lo que dura el reveal.

Hecho fijado por Victor: **no existen maestros fuera del repo.** Los PNG que viven en él son la única fuente; toda compresión será transcodificación desde ellos. Eso pone un techo de calidad y obliga a un criterio: nunca se reemplaza un original sin conservar el PNG fuente en algún sitio gobernado.

Punto de partida: `main` en `3e8cd15`.

## Mandato

1. **Solo lectura.** Cero ediciones, cero archivos nuevos en el repo, cero commits. Se pueden ejecutar `vite preview` (4173, bypass no disponible: usar 5173 con bypass para llegar a la mesa) y las herramientas de medición que ya existan en la máquina. Cualquier script de medición vive en el scratchpad, fuera del repo.
2. Archivos protegidos según `docs/AJILEI_Protegidos_v1.0.md` (commit `25290bb`): se leen, no se tocan.
3. Toda afirmación lleva archivo:línea o cifra medida. Nada desde memoria.
4. Cifras del arnés vigentes: `gate` 6/6 · `puerta` 6/6 · `mon` 12/12 · `2.5` 10/10. No se corre nada de eso aquí salvo para comprobar que el árbol sigue intacto al cerrar.

## Bloque 1 — Inventario de la baraja

Tabla completa de todos los archivos de imagen de cartas (cartas, reversos, comodines, cualquier variante por mesa o por tapete). Por cada uno: ruta, formato, peso en KB, dimensiones en px, profundidad/alfa (¿tiene canal alfa real o es opaco con alfa vacío?), y si hay duplicados por hash.

Al pie: **número de archivos, peso total, peso medio**, y el peso total que un usuario descarga en su primera partida completa (todas las cartas que pueden aparecer en una mano, no solo las 40 de la baraja si hay reversos y variantes).

Incluye también las imágenes de tapete, mesa o fondo que se pinten junto a las cartas si pesan más de 100 KB — no son el objetivo, pero compiten por el mismo ancho de banda en el mismo momento.

## Bloque 2 — Dimensiones pintadas vs. dimensiones del archivo

Para cada contexto donde se pinta una carta — mano del humano, rivales en `OpponentPanel` (mesas 5/4/3), rival en `.ai-zone` (mesa 2), mazo, pozo, carta voladora, reveal, celebración — mide en 4173 con DevTools o Playwright:

- Tamaño CSS al que se pinta (px) en tres viewports: escritorio de referencia, 390×844 (móvil vertical), S25 apaisado si el juego lo permite.
- Relación **px del archivo / px pintados** en el peor caso (la carta más grande pintada) y en el más común (la mano).
- Si hay `srcset`/`sizes` o `<picture>` en algún sitio (predicción: no).

Salida: tabla contexto × viewport, y una cifra: **el tamaño máximo real** al que una carta llega a pintarse en cualquier pantalla, con DPR 3 considerado. Ese número define la resolución objetivo de la Fase 1.

## Bloque 3 — Cómo las referencia el código

1. ¿Las cartas se importan (`import x from './cartas/…'`, procesadas por Vite con hash) o se piden como URL desde `public/`? Archivo:línea del punto donde se construye la ruta de una carta a partir de su palo y valor.
2. ¿Existe un mapa/índice central de cartas (`cartas.js`, `deck.js`) o la ruta se arma en varios sitios?
3. ¿Hay ya alguna precarga? (`<link rel="preload">`, `new Image()`, el `gen-portada-assets`, el service worker — la Fase 0 de FRZ-1 confirmó que no hay SW). Archivo:línea si existe.
4. ¿Cómo se pintan: `<img>`, `background-image` en CSS, `<div>` con URL en estilo inline? Importa porque `background-image` no dispara `onload` de forma útil y cambia la estrategia.
5. Cache: qué cabeceras devuelve Cloudflare Pages hoy para un PNG de carta en `ajilei.io` (`cache-control`, `etag`, `content-type`). Una petición `curl -I` basta. Si hay `_headers` en el repo, cítalo.

## Bloque 4 — El flash blanco: dónde y cuánto

Observación medida en 5173 (bypass), Chrome con caché deshabilitada en DevTools y estrangulamiento **Fast 4G** para ver lo que ve un teléfono:

1. Primera partida, primera mano: grabación de la pestaña Network durante el reparto. Por carta: cuándo empieza la petición, cuánto tarda, cuánto pesa, y en qué momento del reveal se pinta. Cifra: **retraso entre la carta "revelada" por el estado y la carta visible**.
2. Segunda mano de la misma sesión: ¿el flash desaparece (caché de memoria) o persiste (decodificación)? Distingue **flash de red** de **flash de decodificación**: un PNG de 1 MB tarda en decodificarse aunque esté en caché.
3. Con caché habilitada y recarga: ¿el flash vuelve? (mide si Cloudflare está sirviendo con caché útil o revalida cada vez).
4. ¿Qué se ve durante el flash: blanco puro, el fondo del tapete, un reverso? Captura en `capturas-pue/` o equivalente de scratchpad, no en el repo.

## Bloque 5 — Ventana de precarga disponible

El usuario recorre Portada → (OTP) → pantalla post-login (futuro lobby, hoy la que exista) → mesa. Mide:

1. Cuánto tiempo pasa el usuario en cada pantalla como mínimo (el OTP es tiempo muerto ideal para precargar).
2. Qué se descarga hoy en cada una (Network por pantalla).
3. Si la Portada ya tiene mecanismo de precarga (`gen-portada-assets`, el `<link rel="preload">` del WebP de MON-2) que se pueda extender sin tocar su lógica.
4. Peso que la precarga completa añadiría a un usuario que **no** llega a jugar (llega a la Portada y se va): es el coste de precargar demasiado pronto.

## Bloque 6 — Formato: medición, no opinión

Sobre **tres cartas representativas** (la más pesada, una media, y una con detalle fino — una figura), genera en el scratchpad, sin tocar el repo, versiones a la resolución objetivo del Bloque 2 en: PNG optimizado (`oxipng`/`pngquant` si están, o Sharp que ya vive en el repo por ICO-1), WebP con calidad 80 y 90, y AVIF si Sharp lo soporta en esta instalación. Tabla: formato × calidad × peso, y **tres capturas comparativas 1:1** de la figura para el ojo de Victor. No se decide nada; se mide.

Declara la compatibilidad de cada formato en los tres navegadores objetivo (Chrome Android, Safari iOS, escritorio) con la fuente (caniuse o documentación), no de memoria.

## Cierre

**STOP.** Informe `AJILEI_CAR1_Fase0_Informe_v1.0.md` entregado en el chat, no escrito al repo. Estructura:

1. Inventario con totales (Bloque 1).
2. Tabla pintado vs. archivo y la **resolución objetivo** con su justificación (Bloque 2).
3. Referencia en código, forma de pintado, cache actual (Bloque 3).
4. Flash: red vs. decodificación, cifras y capturas (Bloque 4).
5. Ventana de precarga y su coste (Bloque 5).
6. Tabla de formatos y las tres capturas (Bloque 6).
7. **Recomendación para Fase 1** en tres opciones como máximo, cada una con: formato y resolución, estrategia de precarga (dónde y cuándo), cómo se conserva el PNG fuente (carpeta gobernada + `.gitignore` de derivados, o derivados en repo y fuente fuera, con su argumento), archivos tocados, y si alguno es protegido. Sin ejecutar ninguna.
8. Riesgos: protegidos implicados, dos caminos de render, techo de calidad de la transcodificación, y qué requiere aparato físico (AVIF en iPhone, sobre todo).

Nada más entra en esta fase. La Fase 1 se abre con instrucción propia del rector sobre este informe.
