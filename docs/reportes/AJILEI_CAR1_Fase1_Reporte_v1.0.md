# AJILEI · CAR-1 · Fase 1 · Reporte

**Producción · 04-sep-2026 · base `main` @ `3e8cd15`, sin commits**

El flash no bajó: **desapareció**. De 1 893 ms de mediana a **0 ms medidos, con `complete === true` en el momento de insertar**, y cero peticiones de carta durante el reparto. La baraja pasó de 24,28 MB a **0,56 MB**.

---

## 1 · La tabla del generador

`node scripts/gen-cards.mjs` — 320×452, WebP q80, Edge 152 como convertidor.

| carta | KB origen | KB WebP | ratio | | carta | KB origen | KB WebP | ratio |
|---|---|---|---|---|---|---|---|---|
| cinco_basto | 459,7 | 11,0 | 41,9× | | once_basto | 836,9 | 17,1 | 49,0× |
| cinco_copa | 486,9 | 13,8 | 35,3× | | once_copa | 786,5 | 17,9 | 43,8× |
| cinco_espada | 205,1 | 7,3 | 28,2× | | once_espada | 912,2 | 18,8 | 48,5× |
| cinco_oro | 707,6 | 18,2 | 38,8× | | once_oro | 839,2 | 17,9 | 46,8× |
| cuatro_basto | 388,7 | 9,8 | 39,8× | | seis_basto | 628,2 | 12,5 | 50,2× |
| cuatro_copa | 527,7 | 15,1 | 35,0× | | seis_copa | 486,8 | 13,9 | 35,1× |
| cuatro_espada | 344,8 | 8,8 | 39,3× | | seis_espada | 335,0 | 9,9 | 33,9× |
| cuatro_oro | 718,6 | 19,3 | 37,2× | | seis_oro | 670,1 | 17,5 | 38,3× |
| diez_basto | 615,6 | 14,0 | 43,9× | | siete_basto | 868,3 | 13,5 | **64,3×** |
| diez_copa | 557,8 | 14,9 | 37,5× | | siete_copa | 461,9 | 13,3 | 34,6× |
| diez_espada | 692,1 | 15,5 | 44,6× | | siete_espada | 277,9 | 8,7 | 32,0× |
| diez_oro | 904,3 | 16,3 | 55,5× | | siete_oro | 903,7 | 16,0 | 56,3× |
| doce_basto | 839,2 | 16,5 | 50,7× | | tres_basto | 808,0 | 15,7 | 51,6× |
| doce_copa | 838,7 | 18,0 | 46,6× | | tres_copa | 483,9 | 11,1 | 43,6× |
| doce_espada | 988,0 | 17,6 | 56,3× | | tres_espada | 423,2 | 9,0 | 47,3× |
| doce_oro | 948,2 | 21,5 | 44,1× | | tres_oro | 558,4 | 14,7 | 37,9× |
| dos_basto | 504,6 | 12,7 | 39,7× | | uno_basto | 394,3 | 9,7 | 40,6× |
| dos_copa | 337,2 | 9,5 | 35,6× | | uno_copa | 680,8 | 16,1 | 42,4× |
| dos_espada | 315,3 | 7,5 | 42,1× | | uno_espada | 543,3 | 13,5 | 40,2× |
| dos_oro | 504,5 | 13,7 | 36,9× | | **uno_oro** | 1 083,2 | **27,3** | 39,7× |

> **TOTAL** — 40 derivados · **574,9 KB (0,56 MB)** · maestros 24,28 MB · **−97,7 %** · **43,3× más ligera**
> **MEDIA** — 14,4 KB por carta · **VERIFICADO** 40/40 a 320×452, ninguno de 0 bytes, dentro del techo de 0,80 MB

La Fase 0 extrapoló 0,57 MB desde una sola carta mediana. Salió 0,56. La regla de tres aguantó.

**Idempotencia: mejor de lo declarado.** No hizo falta la cláusula de escape del ±1 %. Segunda corrida, `md5sum` de los 40: **idénticos al byte**. El codificador WebP de Edge es determinista para la misma entrada, el mismo tamaño y la misma calidad.

---

## 2 · Los hunks

**`scripts/gen-cards.mjs`** (nuevo, 155 líneas) — molde de `gen-portada-assets.mjs`. `ANCHO = 320` y `CALIDAD = 0.80` son las dos primeras constantes, cada una con la línea de la Fase 0 que la justifica: el escape a q90 es un número. Una sola sesión de Edge para las 40. Verifica sobre **lo escrito**, no sobre lo que creyó escribir: vuelve a decodificar los 40 ficheros desde disco y comprueba dimensiones y que ninguno sea de 0 bytes. Y pregunta por el tipo que devolvió el canvas en vez de suponerlo — si este Chromium no supiera codificar WebP devolvería un PNG sin avisar, que es exactamente la trampa en la que cayó la medición de AVIF en la Fase 0.

**[CardImage.jsx](src/components/CardImage.jsx)** · +17 −2

```js
const cardImages = import.meta.glob('../assets/cards/webp/*.webp', { eager: true, query: '?url', import: 'default' })
export const URLS_BARAJA = Object.values(cardImages)
…
const url = cardImages[`../assets/cards/webp/${nombre}_${palo}.webp`]
```

`NUM_MAP`, `PALO_MAP` y la forma de la ruta quedan intactos. **Una desviación mínima que declaro**: la ficha pedía que la línea 15 no cambiara, pero la clave del glob **es** la ruta — con `.png` la búsqueda devolvería `undefined`. Cambia el directorio y la extensión, exactamente el mismo cambio de la línea 1, y nada más.

**[WelcomeScreen.jsx](src/components/WelcomeScreen.jsx)** · +5 −2 — los dos imports apuntan a `../assets/cards/webp/*.webp?url`. Nada más en el archivo.

**`src/lib/precargaBaraja.js`** (nuevo, 38 líneas) — importa `URLS_BARAJA`, crea 40 `new Image()`, los retiene en un array de módulo, guarda de reentrada por `retenidas.length`. Sin `decode()` y sin promesa. La retención lleva su comentario: sin referencia viva el `Image` es basura recolectable en cuanto acaba la función, y el navegador puede desalojar lo que se acaba de traer.

**[App.jsx](src/App.jsx)** · +4 −0 — el import y una línea dentro del efecto que ya existía, con la misma condición:

```js
if (screen !== 'welcome') precargarSonidos(SONIDOS_MESA)
if (screen !== 'welcome') precargarBaraja()
```

**`public/_headers`** (nuevo, 15 líneas) — una sola regla, `/assets/*` a un año inmutable, y once líneas de comentario explicando qué **no** lleva regla y por qué. Presente en `dist/_headers` tras el build.

---

## 3 · Antes y después

Mismas condiciones que la Fase 0: 5173 con bypass, 390×844 DPR 3, mesa 5, Fast 4G por CDP, caché deshabilitada.

| Cifra | Antes (Fase 0) | Después | Objetivo | |
|---|---|---|---|---|
| Descarga al llegar a la Bienvenida | 1 787,4 KB | **40,0 KB** (cuerpo 39,4 KB) | < 40 KB | al filo — ver abajo |
| Descarga hasta acabar la primera mano | 7,80 MB | **0,57 MB** | < 0,25 MB | no, y a propósito |
| Retraso inserción → carta visible, mediana | 1 893 ms | **0 ms** | < 100 ms | ✅ |
| Peticiones de carta durante el reparto | 2+ | **0** | 0 | ✅ |
| Baraja completa | 24,28 MB | **0,56 MB** | ≈ 0,57 MB | ✅ |

**Las ocho inserciones de mesa de la corrida, una por una:** `dos_copa` 0 ms · `once_espada` 0 ms · `doce_copa` 0 ms · `once_basto` 0 ms · `seis_espada` 0 ms · y las tres del reveal, 0 ms. Todas con `img.complete === true` **en el mismo barrido en que se insertan**. No es que el flash sea corto: no llega a existir un fotograma sin carta.

**Los 40,0 KB de la Bienvenida.** El cuerpo son 39,4 KB (`doce_oro` 21,5 + `once_oro` 17,9); los 40,0 son con cabeceras, que es como la Fase 0 contó los 1 787,4. Queda 0,6 KB por encima del objetivo redondo, y bajarlo exigiría q75 en dos cartas concretas o retirar una decorativa — dos decisiones de diseño que no me tocan. Lo dejo dicho, no lo toco: **44,7× menos que antes**.

**Los 0,57 MB de la primera mano, que es la desviación de verdad.** El objetivo de <0,25 MB y el de **0 peticiones durante el reparto** son incompatibles: precargar la baraja significa traerse las 40 antes de repartir. La corrida de control lo demuestra — sin precarga la primera mano costó 104,8 KB y habría entrado de sobra en el objetivo, pero con 5 cartas pidiendo red en pleno reparto. Se eligió el otro lado a sabiendas, y la cifra que justifica la elección no es la de la mano sino la de la sesión: **0,57 MB contra 24,28 MB**, con o sin precarga. La ficha pedía las dos cosas; sólo una puede cumplirse, y el reporte declara cuál se cumplió.

### La corrida de control: qué mérito es de cada mitad

Con la llamada de `App.jsx` comentada, mismas condiciones:

| | mediana | rango | peticiones en el reparto |
|---|---|---|---|
| **Antes** (PNG, sin precarga) | 1 893 ms | 1 780–1 995 | 2+ |
| **Sólo comprimir** (WebP 320, sin precarga) | **68 ms** | 60–80 ms (n=5) | 5 |
| **Comprimir + precargar** | **0 ms** | 0–0 (n=8) | **0** |

La ficha predijo 60–80 ms para la compresión sola. Salió 68 de mediana, dentro de la horquilla exacta. **La compresión hace el 96 % del trabajo; la precarga se lleva el 4 % que queda — y ese 4 % es el que se ve.**

### La precarga no estorba a nadie (§3.3)

| | con precarga | sin precarga |
|---|---|---|
| click «Jugar vs IA» → dificultad pintada | **59 ms** | 64 ms |
| última carta descargada, desde que entra a dificultad | **1 091 ms** | — |

En Fast 4G la baraja entera está en el navegador **un segundo después** de pisar la pantalla de dificultad, cuando aún quedan por delante elegir mesa, elegir apuesta y pulsar «Iniciar mano». Margen de sobra, y la pantalla de dificultad pinta si acaso más rápido que sin precarga (la diferencia son 5 ms: ruido, no señal).

---

## 4 · Los siete puntos de verificación

1. **`npm run build` verde.** `dist/assets/`: **40 WebP de carta, 0 PNG de carta** (0 ficheros `.png` en toda la carpeta) · 572,4 KB · **`dist/_headers` presente**, 985 B. Ninguna referencia oculta a un PNG que el informe no hubiera visto.
2. **`npm test` verde: 467 pruebas, 17 archivos.**
3. **Arnés** — `puerta` **6/6** VERDE contra 4173 · `mon` **12/12** VERDE · `2.5` **10/10** VERDE · `gate`: matriz completa, `matrixOk: true`.
   *Una corrección honesta a la ficha:* `gate` (que vive en `diagDSK.mjs`, no en `diagPUE.mjs`) emite una **matriz de 4 filas** —1920×937, 1366×768, 640×360, 360×640—, no 6. Las cuatro `ok`. Informo lo que el arnés emite, no lo que la ficha esperaba.
4. **`npx eslint .`: 20 errores + 1 aviso — la línea base exacta.** Ninguno cae en los cuatro archivos de esta tanda; verificado por filtro. El `export const URLS_BARAJA` de un `.jsx` con componente no dispara `react-refresh/only-export-components`.
5. **Los dos caminos de render piden lo mismo.** Medido en el DOM: mesa 5 y mesa 2 sirven **ambas** desde `/src/assets/cards/webp/*.webp` con `naturalWidth 320`.
   *Segunda corrección a mis propias notas de Fase 0:* en mesa 2 el rival **no** se pinta por `.ai-zone` sino por `opp-panel` dentro de `.rivals-zone` — la cadena real es `playing-card < opp-card-slot < opp-cards < opp-panel < rivals-zone`. La cifra de Fase 0 sigue en pie (83×118 CSS = **249×354 físicos** a 780×360 DPR 3, el sitio más grande donde una carta llega a pintarse); lo que estaba mal era la etiqueta del contenedor, no el número. Y el reverso resulta ser un `<img>` de `reverso_carta.svg?no-inline` dentro del mismo `opp-card-slot`, no sólo un fondo CSS. Intacto: sigue siendo SVG y esta tanda no lo toca.
6. **Tres capturas 1:1** en el scratchpad, ya enviadas: `diez_oro` en la mano (186×290 físicos), `once_copa` en el panel del rival de mesa 2 (238×336 físicos, el caso peor), y `doce_oro` decorativa en escritorio (150×212). A mi ojo ninguna se ve blanda, ni siquiera la figura a tamaño de showdown — pero esa compuerta es tuya, no mía.
7. **`git status --short`** — exactamente los siete elementos del mandato más los cuatro residuos, ninguna ruta más:

```
 M src/App.jsx                    ?? public/_headers
 M src/components/CardImage.jsx   ?? scripts/gen-cards.mjs
 M src/components/WelcomeScreen.jsx  ?? src/assets/cards/webp/   (40 archivos, 676 KB)
                                 ?? src/lib/precargaBaraja.js
 ?? laminas/mon1/_entorno.txt · laminas/mon1/lamina.html · laminas/mon1/tiempos.json · scripts/_cel1bFila.mjs
```

**Los 40 PNG maestros siguen ahí, sin borrar ni mover.** `package.json` y `package-lock.json` sin tocar: cero dependencias nuevas. Los cinco protegidos, **INTACTO** los cinco, con el recuento de líneas del registro: `gameEngine.js` 548 · `aiPlayer.js` 908 · `seatLayouts.js` 59 · `opponentPanel.css` 1084 · `gameTable.css` 6289.

---

**STOP.** Sin commits.

Tres cosas para cuando abras la compuerta física en 4173 y en el S25: la eficacia de `_headers` **no se puede medir aquí** —`vite preview` no aplica reglas de Cloudflare— y sólo se verá con un `curl -I` contra `ajilei.io` después del despliegue; los 40,0 KB de la Bienvenida están 0,6 KB por encima del objetivo redondo y decidir si eso importa es tuyo; y el objetivo de <0,25 MB en la primera mano se cambió, a sabiendas, por las 0 peticiones durante el reparto.
