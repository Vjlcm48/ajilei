# AJILEI · RNK-1 (Rankings) · Fase 1e-L · Lámina del intersticial de SumaMente · Informe · v1.0

- **Ficha:** `AJILEI_RNK-1_Fase1eL_Lamina_v1.0.md` (rector) · **Normativo:** `docs/AJILEI_Rankings_v1.1.md` §1.1 y §6.7 · **Formato:** el de la lámina 1-L (`docs/reportes/AJILEI_RNK-1_Fase1L_Informe_v1.0.md` §1.1)
- **Fecha:** 2026-10-27 · **Ejecutor:** Claude Code · **Base:** `main` en `a6ce473` · **Tiempo:** ~45 min de los 60
- **Escrito para:** el rector y Victor
- **Escrituras:** solo `laminas/rnk1e/` (sin seguimiento de git) y este informe. Nada en `src/`, `public/`, `scripts/` ni `supabase/`. Sin commits.
- **Materiales:** usados donde los dejó Victor, sin moverlos ni copiarlos: `laminas/rnk1e/sumamente_promo_es.mp4` (19,6 s), `sumamente_promo_en.mp4` (20,1 s) y `sumamente_512.png`. Las duraciones son las que lee el propio `<video>`.

---

## Resumen

La lámina dibuja el intersticial completo con el video real, en los siete tamaños de la ficha y en seis vistas. **Por defecto** salen las recomendaciones del rector: **V1 B · V2 A · V3 A**. Cada marco lleva su regla y lee sus propias medidas.

En la barra del visor, **«▶ simular»** hace el recorrido de verdad: icono → video con sonido → «Omitir» a los 5 s → último fotograma con «Continuar a Rankings» → salida.

**Cómo abrirla:**

```
python -m http.server 8765 -d laminas\rnk1e
```

y luego <http://localhost:8765/> (el índice). Hay que abrirla por http y no como archivo: el video y las medidas se leen de dentro de cada marco.

Lo que más importa para decidir:

| | |
|---|---|
| **¿Cabe en 360×640?** | **Sí, con V2 A y sin desplazar.** Línea de familia + video 252×448 (70 % del alto) + botón de Google Play + sitio de «Continuar». V2 B no gana por necesidad (§3-5). |
| **Horizontal bajo** | En 915×412, 832×384 y 1366×623 el video va **en el centro, a toda la altura** (92–93 %). La familia queda a la izquierda, y «Omitir» y los botones a la derecha. Apilado, en 412 de alto el video habría quedado en ~220 px (§3-6). |
| **Hallazgo** | **ECO-1g no tiene botón de sonido.** Su video es simulado: no hay `<video>` ni audio. La lámina propone uno con la forma de la ✕ de ECO-1g (§3-1). |
| **Dudas para Victor** | V1/V2/V3, el sitio de «Continuar» (§3-2), el botón de sonido (§3-1) y si la línea pequeña va dentro del botón (§3-4). |

---

## §1 · Archivos y cómo abrir

| Archivo | Qué es |
|---|---|
| `index.html` | El índice: tabla de 6 vistas × 7 tamaños (más «mosaico», los siete a la vez) y los enlaces de cada variante. |
| `lamina.html` | El visor. La barra elige vista, tamaño, zoom, V1/V2/V3 y el extra «Continuar» (sitio reservado o encima del video), y tiene el botón **▶ simular**. Cada marco lleva **una regla en px** (marca cada 10, número cada 100) y debajo **sus medidas** (§4) en rojo si fallan. |
| `pantalla.html` | El intersticial: CSS, textos y lógica dentro, sin red fuera de la carpeta. Va en un `iframe` del tamaño exacto (con `allow="autoplay"`). Parámetros: `vista`, `v1`, `v2`, `v3`, `cont`. |
| `_medir.mjs` | Mide y fotografía 10 casos × 7 tamaños con **Edge** (`channel: 'msedge'`): el Chromium del arnés no trae H.264 y no abre el mp4. Uso: `node laminas/rnk1e/_medir.mjs <carpeta> [puerto]`, con el http.server levantado. |
| `_simular.mjs` | Prueba el visor: mosaico con las 7 medidas pintadas, y «▶ simular» seguido de 22 s hasta el clic en «Continuar». |

**El video** llega como `blob:`. `python -m http.server` no sirve rangos, y sin rangos Chrome no deja posar el video en un segundo concreto. En el producto (Cloudflare Pages sí sirve rangos) no hace falta.

---

## §2 · Vistas y variantes

### 2.1 · Vistas (`?vista=`)

| Vista | Qué muestra |
|---|---|
| `cargando` | Fondo abisal y línea de familia. La caja 9:16 ya está reservada, con el icono en el centro. Botón de Google Play visible y el sitio de «Omitir» vacío. |
| `antes5` | Video en el segundo 2. Con V1 A, contador «3» tenue en el sitio de «Omitir»; con V1 B, nada. |
| `despues5` | Video en el segundo 7, «Omitir» visible. |
| `fin` | Último fotograma (19,6 s), botón de Google Play y **«Continuar a Rankings»** en dorado. |
| `silencio` | Como `despues5`, pero arrancado en silencio: botón de sonido arriba a la izquierda, **dentro** del video. |
| `en` | Como `despues5`, con el video en inglés (20,1 s). No cambia ninguna medida: nada depende del idioma. |

### 2.2 · Variantes

| | Opciones | Por defecto |
|---|---|---|
| V1 · antes de los 5 s | A: contador «5…1» pequeño y tenue, en un círculo de 44 px en el sitio de «Omitir» · B: nada | **B** |
| V2 · Google Play en vertical | A: debajo del video, dentro de la columna · B: al pie fijo, de borde a borde, con fondo de panel y filete de oro al 35 % (la banda «Tu posición») | **A** |
| V3 · escritorio (≥ 1024 de ancho) | A: video a toda la altura que queda · B: 720 px fijos, o menos si no caben | **A** |
| Extra · «Continuar» | `fila`: sitio reservado bajo el botón de Google Play desde el primer segundo (O1) · `sobre`: sin sitio, posado al pie del último fotograma con un degradado | **fila** |

**Disposiciones** (no son variante, salen solas por `@media`):
- **Apilada** (vertical, y apaisado de más de 830 de alto): familia y «Omitir» arriba, el video, y debajo las acciones. El video se asienta sobre los botones: si manda el ancho, el sobrante queda bajo la cabecera, no entre video y botón.
- **Lateral** (`orientation: landscape` y `max-height: 830px`, el mismo corte que las dos columnas de Salas): columnas `1fr · video · 1fr`. La familia va arriba a la izquierda, «Omitir» arriba a la derecha y las acciones abajo a la derecha. V2 no aplica aquí.

**La caja del video** es la escena con `container-type: size`: `width: min(100cqw, 100cqh·9/16)` y `height: min(100cqh, 100cqw·16/9)`. Así es **9:16 exacta** siempre (medida en los 70 casos), y como la caja *es* el video, nunca se recorta.

---

## §3 · Dudas al dibujar

1. **El botón de sonido no existe en ECO-1g.**
   - La ficha pide el botón de sonido «mismo sitio y forma que en `MarcoVideo`». Pero `CapaVideo.jsx` es un video **simulado**: consejos rotativos, isotipo, barra y ✕. No tiene `<video>`, ni audio, ni botón de sonido (lo confirma una búsqueda de `muted`/`sonido` en `src/components` y `src/hooks/videoCore.js`).
   - La lámina propone **la forma de la ✕ de ECO-1g** (`.vid-x`, `video.css:234`): círculo de `max(44px, 9u)` sobre abisal al 62 % con filete de línea, y un altavoz tachado. Va **arriba a la izquierda, dentro del video**, lejos de «Omitir» y del botón de Google Play, para que no se toquen por error.
   - **Recomiendo:** que salga solo cuando el navegador bloquee el sonido, y que un toque lo active y lo haga desaparecer. Sin interruptor permanente: son 20 s.
   - En la simulación (Edge, sin cabeza), el sonido arrancó sin bloqueo, por el gesto de «▶ simular». La vista `silencio` enseña la otra rama.
2. **El sitio de «Continuar» (O1) cuesta video.**
   - Reservarlo desde el primer segundo (`cont=fila`) deja durante 20 s una franja vacía de 44–66 px bajo el botón de Google Play.
   - Le quita al video, en vertical, 52 px en 360×640 (448 frente a 500) y 78 en 1920×1080 (816 frente a 894). En 412×915 no quita nada, porque ahí manda el ancho.
   - Posarlo encima del último fotograma (`cont=sobre`) aprovecha ese alto, pero el degradado tapa el «¡Descárgala ahora, gratis!» con el que cierra el video.
   - **Recomiendo `fila`:** nada se mueve bajo el dedo y el mensaje final del video queda limpio.
3. **El orden de los botones:** Google Play pegado al video y «Continuar» abajo del todo, en la zona del pulgar, porque al final es la acción principal. En la disposición lateral, el mismo orden en la columna derecha.
4. **«App para Android» va dentro del botón,** como segunda línea, para que todo el botón sea zona táctil (48–66 px de alto). Si va debajo como texto suelto, gasta otros ~16 px de columna y no se puede tocar. **Recomiendo dentro.**
5. **V2: A cabe en 360×640, así que B no gana por necesidad.** La columna es línea de familia + video 252×448 + botón 48 + sitio de «Continuar» 44, con 16 px de margen arriba y abajo, y no desborda. B añade una banda con fondo y le quita 9 px al video. **Recomiendo A.**
6. **El horizontal bajo va en lateral, no apilado.**
   - La ficha pide, en escritorio y horizontal, el video «a la altura disponible» con todo lo demás fuera.
   - Apilado en 915×412, el video se quedaba en ~220 px de alto. En lateral mide 380 (92 %), y en 832×384, 352.
   - El corte (`max-height: 830px`) es el de las dos columnas de Salas. Por eso 1366×623 también va en lateral (581 px, 93 %), y V3 solo actúa en 1920×1080: en 1366×623 caben menos de 720, así que A = B.
7. **V3 A en 1920×1080 da 75,6 %, no ≈ 85 %.** La cabecera (54 px), los dos botones (66 + 66) y los huecos se llevan el resto. V3 B deja el video en 720 (66,7 %). **Recomiendo A.** Si se quiere el 85 %, el remedio es `cont=sobre` (82,8 %), con el coste de la duda 2.
8. **El fondo:** `--green-abyss` liso (`#09170e`), el más oscuro de los tokens, sin rampa ni filigrana. La caja del video es negra (`#000`), igual que las franjas negras que **trae el propio mp4**: la grabación del teléfono ocupa ~78 % del ancho del 720×1280. Se lee como un rectángulo negro sobre el verde casi negro. Si molesta, la solución está en el video (reexportarlo sin franjas), no en la pantalla, porque recortar está prohibido.
9. **El contador de V1 A** usa `--text-muted`: 5,42 : 1, tenue pero dentro de 4,5. Cuenta `5 − ⌊t⌋` y se apaga al llegar a los 5 s, cuando entra «Omitir».
10. **El póster.** Con `poster="sumamente_512.png"`, el navegador pinta el icono al ancho entero de la caja: un cuadrado de 250–470 px. La lámina pone el atributo, como pide la ficha, pero lo tapa con su propia capa: el icono al 34 % del ancho (entre 72 y 140 px), con esquinas redondeadas y centrado sobre el abisal. **Recomiendo** que la 1e use esa capa y no confíe en el póster.
11. **El icono de la línea de familia** es el PNG de 512 (44 KB) pintado a 24–28 px. Para la 1e conviene una copia pequeña (64 px, WebP) en `src/assets/`.
12. **Reducción de movimiento:** solo se quitan los fundidos de «Omitir» y «Continuar» (la regla del lobby, `lobby.css:448`). El video arranca igual, porque es el contenido. Si Victor quiere que con `prefers-reduced-motion` espere un ▶, es una línea en la 1e.
13. **Para la 1e (no se dibuja):** qué hace el botón «atrás» de Android en los 5 primeros segundos. **Recomiendo** que no haga nada hasta que aparezca «Omitir» y luego cuente como «Omitir». Además, abrir el enlace de Play en el S25 para ver que ofrece la app de Play Store.

---

## §4 · Medidas (Edge, V1 B · V2 A · V3 A · `cont=fila` salvo que se diga)

| Tamaño | `--u` | Disposición | Caja del video (an × al) | % del alto | Google Play (al × an) | «Continuar» (al) | «Omitir» (zona · sitio) | Cabe / desborda |
|---|---|---|---|---|---|---|---|---|
| 360×640 | 3,6 | apilada | **252 × 448** | 70,0 | 48 × 280 | 44 | 79,9 × 44 · (264, 16) | sí / no |
| 412×915 | 4,1 | apilada | **380 × 675,5** | 73,8 | 48 × 280 | 45,3 | 84,5 × 44 · (311, 16) | sí / no |
| 915×412 | 4,1 | lateral | **213,8 × 380** | 92,2 | 48 × 263,7 | 45,3 | 84,5 × 44 · (814, 16) | sí / no |
| 832×384 | 3,8 | lateral | **198 × 352** | 91,7 | 48 × 245,8 | 44 | 81,7 × 44 · (734, 16) | sí / no |
| 744×1100 | 6 | apilada | **470,3 × 836** | 76,0 | 66 × 384 | 66 | 122,2 × 54 · (601, 21) | sí / no |
| 1366×623 | 6 | lateral | **326,8 × 581** | 93,3 | 66 × 384 | 66 | 122,2 × 54 · (1223, 21) | sí / no |
| 1920×1080 | 6 | apilada | **459 × 816** | 75,6 | 66 × 384 | 66 | 122,2 × 54 · (1777, 21) | sí / no |

- **9:16 exacto** en los 70 casos (10 casos × 7 tamaños): `|alto·9 − ancho·16| ≤ 0,6 px`.
- **En vertical caben** video, línea de familia y botón **sin desplazar** en los tres tamaños verticales. La página no desborda en ningún caso, ni a lo ancho ni a lo alto.
- **Variantes:**
  - **V2 B:** 360×640 → 246,9 × 439; 744×1100 → 462,9 × 823; 1920×1080 → 451,7 × 803. En 412×915 no cambia, porque manda el ancho.
  - **`cont=sobre`:** 360×640 → 281,3 × 500 (78,1 %); 744×1100 → 514,1 × 914 (83,1 %); 1920×1080 → 502,9 × 894 (82,8 %).
  - **V3 B:** 1920×1080 → 405 × 720 (66,7 %); igual que A en los demás.
- **Botón de sonido:** `max(44px, 9u)` → 44 × 44 hasta u = 4,9, y 54 × 54 con u = 6.
- **Contraste sobre el fondo** (el texto, con su alfa, compuesto sobre el abisal):

| Texto | Contraste |
|---|---|
| «Ver en Google Play» (`--text-primary`) | **15,77 : 1** (15,94 en V2 B) |
| «App para Android» (`--text-secondary`) | **8,52 : 1** (8,58 en V2 B) |
| «De la familia» (`--text-secondary`) / «HEPTACREATION» (`--text-primary`) | **8,52** / 15,77 : 1 |
| «Omitir» (`--text-secondary`) | **8,52 : 1** |
| Contador de V1 A (`--text-muted`) | **5,42 : 1** |
| «Continuar a Rankings» (`--text-dark` sobre `--gold-brand`) | **9,51 : 1** |

### Lo que la 1e debería sellar

| Medida | Valor de la lámina |
|---|---|
| Unidad y margen | `--u: clamp(3.2px, 1vmin, 6px)` · margen `max(16px, 3,5u)` + `safe-area` (los de `.vid-raiz`) · hueco `max(8px, 2u)` |
| Cabecera | alto `max(44px, 9u)`; icono `clamp(24px, 6u, 28px)` con radio del 22 %; texto `max(12px, 2,8u)` |
| «Omitir» | píldora de contorno, alto `max(44px, 9u)`, texto `max(13px, 3,2u)` con chevrón; aparece con un fundido de 200 ms |
| Caja del video | 9:16 por `cq` (§2.2), radio `2u`, fondo `#000`; en lateral, columna `min(100dvh − 2·margen, tope) · 9/16` |
| Google Play | `min-height: max(48px, 11u)`, ancho `min(100%, max(280px, 64u))`, contorno `--text-secondary`, dos líneas (`max(14px, 3,6u)` / `max(11px, 2,6u)`) |
| «Continuar» | el `.sal-cta`: alto `--cta-h` = `max(44px, 11u)`, mismo ancho que Google Play, sitio reservado |
| Corte lateral | `(orientation: landscape) and (max-height: 830px)` |

---

## §5 · Textos (tal como irían al diccionario)

En `textos.es.js:501-505` el prefijo `rnk.` ya existe, y el comentario reserva `rnk.suma.*` para la 1e. Hoy no hay ninguna `rnk.suma.*`. Propuestas (**7**):

| Clave | Texto |
|---|---|
| `rnk.suma.familia` | De la familia {marca} — `{marca}` = «HEPTACREATION», en negrita, sin traducir |
| `rnk.suma.titulo` | SumaMente (la `aria-label` de la caja del video) |
| `rnk.suma.boton` | Ver en Google Play |
| `rnk.suma.boton.sub` | App para Android |
| `rnk.suma.omitir` | Omitir |
| `rnk.suma.continuar` | Continuar a Rankings |
| `rnk.suma.sonido.aria` | Activar el sonido (botón de sonido; la ficha no la lista: es nueva) |

- La 1-L proponía `rnk.suma.boton` = «Ver en Play Store» y `rnk.suma.linea`. La ficha 1e sella «Ver en Google Play», y `linea` ya no hace falta: la tarjeta fija de SumaMente es solo para Premium (§6.7 del normativo).
- **Sin choque con la prueba de repetidos** (`textos.test.js:98`): ni «Omitir» ni «Continuar a Rankings» están hoy en `textos.es.js`.
- El idioma del video sigue al de `t()`: `es` → `_es.mp4`; si falta un idioma, `_en.mp4`.

---

## §6 · Lo que la lámina no hace

- **No lleva el contador** de entradas (n.º 8, cada 8, una vez por día de Chicago, «Omitir» cuenta como visto, nunca para Premium). Es lógica de la 1e y no se dibuja.
- **No navega a Rankings:** «Omitir» y «Continuar» llevan a un rótulo de «Aquí se abriría Rankings».
- **El enlace de Google Play es real** (`target="_blank"`, `rel="noopener noreferrer"`). La lámina no lo abrió, ni a mano ni desde el arnés.
- **Solo se midió en Edge** (Chromium 151, el de la máquina; el Chromium del arnés no abre H.264). No se pasó WebKit: en el iPhone, el arranque con sonido y `playsinline` los valida la 1e con `diagDSK webkit` o en el aparato.
- **El arranque con sonido** no es representativo: Edge sin cabeza no lo bloqueó, y los navegadores reales pueden hacerlo. La rama en silencio se ve en la vista `silencio`.
- **La letra** es la del producto (`var(--sans, system-ui, …)`, que hoy cae a `system-ui`).

---

## §7 · Fuera del repo

En el scratchpad de la sesión quedan las 70 capturas y `medidas.json` de `_medir.mjs`, y las dos del visor (`visor_mosaico.png`, `visor_simulado_fin.png`):
`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\18b512dc-12ee-41a9-9c7e-637ff7eed4b7\scratchpad\rnk1e\`

No hay servidores vivos: el http.server de la medición se cerró y el puerto 8765 está libre. El único error de consola en las 70 cargas es el 404 de `favicon.ico`.
