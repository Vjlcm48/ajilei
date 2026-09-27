# AJILEI · CAP-1 · Fase 1 — Informe

**Versión:** 1.0 · 2026-09-26
**Ficha:** `AJILEI_CAP-1_Fase1_v1.0.md` + `AJILEI_CAP-1_Fase1_Addendum1_v1.0.md`
**Base:** `main` en `82917bd` · **Ejecuta:** Claude Code
**Instrumento:** playwright-core 1.62.1 + Edge. Esta mañana (1a) era la 153.0.4234.48; en el resellado ya era la **154.0.4258.37**. `vite preview` 4173 tras `npm run build`.
**Sin commits y sin `git add`.** Protegidos (`gameEngine.js`, `aiPlayer.js`, `deck.js`) sin abrir y sin cambios.

---

## 1. Resumen

- **Maestras selladas** en `maestras/portada/` con semilla 5, las 9 puertas de contenido en verde en las dos pasadas, `cap.estable` por tolerancia y `cap.ogRecorte` en 4,57 px CSS por lado.
  - `mesav.png` 1080×2112 · 1 169 975 B
  - `mesah.png` 2058×1080 · 1 097 468 B
  - `mesapc.png` 2732×1536 · 1 757 307 B
  - `cap.json` con la traza del sello.
- **Derivados nuevos:**
  - `mesav.webp` 340×692 · 35 280 B (techo 80 KiB);
  - `mesapc.webp` 820×461 · 31 050 B (techo 120 KiB);
  - `og-image-v2.jpg` 1200×630 · 117 065 B (techo 200 KiB), todos con la calidad tope.
- **Las cinco copas** siguen idénticas al byte a `82917bd`. `public/og-image.jpg` está intacto.
- **Visible en la escena 5** (modo nuevo `capvis`): el teléfono enseña el 91,2 % del alto en los cuatro tamaños. La laptop, 92,1–95,2 %, y 89,97 % a 360×640. Hoy la laptop enseñaba el 60–64 %.
- **Build limpio · vitest 1 006/1 006 · lint 20 errores y 1 aviso** (la línea base, en `CardImage.jsx`, `GameTable.jsx` y `SoundContext.jsx`, que no se han tocado).

---

## 2. Tramo 1a (antes del Addendum)

- **Modo `cap`** en `scripts/diagPUE.mjs`, que sólo corre si se pide por su nombre, nunca dentro de `todo`. La lógica vive en el módulo nuevo `scripts/cap/capMesa.mjs`:
  - la sesión simulada: perfil `Jugador_CAP`, `mi_sala` responde `null` y **una sola ruta `**/*`**: lo local pasa, Supabase se contesta en la ruta y cualquier otra petición se corta y se anota;
  - la siembra mulberry32 de `Math.random`;
  - la receta y la espera real;
  - «20s» comprobado, con hasta 3 intentos desde cero;
  - `turnBreath` fijada a 1 200 ms;
  - lecturas del DOM.
- **`.gitignore`:** la línea `capturas-cap/` con su comentario.
- **El hallazgo que paró el sellado:** las tres vistas tienen **dos estados de rasterizado recurrentes**, cada uno estable, que sólo difieren en los degradados radiales del tapete y del óvalo (el 97 % de los píxeles distintos a Δ1; los bordes, hasta Δ30). En tres corridas, «dos pasadas idénticas al byte» salió roja dos veces y **una pareja salió verde con el estado minoritario** (h `8a5d8a75…`). La puerta al byte no prueba reproducibilidad.
- **Hoja y variantes de `og-image`** (A contener, B cubrir, C captura estrecha a 686×360) en `capturas-cap/hoja.html`.
  - B pierde el wordmark, el cronómetro, «Tú», el 58 % del saldo, ⋮ ✕, el 31 % de la botonera y el 14 % de los paneles de IA 4 e IA 1.
  - C cruza el escalón `max-width: 772px` del mazo en apaisado (MZ-2b: el mazo de las IAS pasa de 27×42 a 21×32), con el mismo orden de piezas.
- **Tiempo de 1a:** ~23 min (11:05 → 11:28).

---

## 3. Addendum 1

### 3.1 Decisiones

| # | Decisión | Aplicación |
|---|---|---|
| D-1 | `cap.estable` por tolerancia: mismas dimensiones, ≥ 99,9 % de píxeles con Δ ≤ 2 por canal y Δ máximo ≤ 40. Todas las puertas de contenido en verde **en las dos pasadas** | `TOLERANCIA_CAP` y `compararPng`/`equivalentes` en `capMesa.mjs`. `cap.ias` y `cap.saldo`, que en 1a sólo miraban la primera pasada, miran ya las dos. La segunda pasada sólo se guarda si la vara sale roja |
| D-2 | Laptop a 360×640 ≥ 89 % | Vara del modo `capvis` |
| D-3 | `og-image` = variante C | Vista `h` a 686×360 @3, `encaje: 'cubrir'` en el generador y puerta `cap.ogRecorte` (≤ 6 px CSS por lado) |

### 3.2 `cap.estable` en el resellado

| Vista | Δ ≤ 2 | Δ máximo | Píxeles distintos | sha256 (pasada 1 / 2) |
|---|---|---|---|---|
| v 360×704 @3 | 100,000 % | 0 | 0 de 2 280 960 | `198289a8…` / `198289a8…` |
| h 686×360 @3 | 99,983 % | 22 | 502 639 de 2 222 640 | `1e13575a…` / `292e1c45…` |
| pc 1366×768 @2 | 100,000 % | 0 | 0 de 4 196 352 | `6bca77f6…` / `6bca77f6…` |

h cayó en los dos estados de rasterizado en la misma corrida y la vara lo absorbe: el 22,6 % de los píxeles cambian, casi todos en 1 nivel. Las puertas de contenido (escena, mano, pozo, IAS, saldo, crono, red y errores) salieron verdes en las tres vistas y en las dos pasadas: «20s» al primer intento, 0 peticiones fuera de la ruta, 4 a Supabase (`GET /rest/v1/profiles` y `POST /rest/v1/rpc/mi_sala`), todas contestadas por la ruta, y 0 errores. `cap.ogRecorte`: caja dorada de 2016×1044 (1,931), cubrir corta **4,57 px CSS por lado** en x y 0 en y.

### 3.3 `maestras/portada/cap.json`

Es trazabilidad, no puerta: ningún modo compara huellas contra él. Recoge:

- `campana` y `generado` (2026-09-26T20:51:53Z);
- `edge` 154.0.4258.37;
- `semilla` 5 y el PRNG (mulberry32 sobre `Math.random`, `crypto` sin tocar);
- `receta` en texto;
- `vara` (2 · 0,999 · 40);
- por maestra: vista, viewport y DPR, dimensiones, bytes, **sha256 completo**, el resultado de `cap.estable` (fracción con Δ ≤ 2, Δ máximo, píxeles distintos) y, en `mesah`, la caja dorada y el recorte por lado.

sha256 completos:
- `mesav.png` `198289a8f290fca3bc603e5e2b4b941fd3b34bc21c3323101a0573e431ad43bc`
- `mesah.png` `1e13575a3f10a1f1b3afb37db63d10584250f99762bf8b3ed489d49aaaae2710`
- `mesapc.png` `6bca77f6bb092d3c3a0e36f9cc0cc47d6a495e96a0d441ace14f991a9d6761a6`

---

## 4. Tramo 1b

### 4.1 `scripts/gen-portada-assets.mjs`

- `MAESTRAS = 'maestras/portada'` como origen de `mesav`, `mesapc` y `og-image` (desde `mesah.png`).
- `OG_DESTINO = 'og-image-v2.jpg'`, con un comentario que remite a `index.html:61` y `:71` y explica el versionado a mano.
- `og-image` con `encaje: 'cubrir'`. La rama de cubrir centrado ya existía (cualquier trabajo con `alto` y sin encaje); se nombra `cubrir || alto` sin cambiar de comportamiento. «contener» se conserva y ningún trabajo lo usa.
- **El algoritmo de recorte por filete dorado no se ha tocado.**
- Cabecera corregida: las maestras están versionadas (las viejas desde DOC-1b, las nuevas en `maestras/portada/`), y las `PUE_*_demo.*` se quedan en la raíz para la lámina histórica, pero el script ya no las lee.

### 4.2 Derivados (corrida completa, los ocho)

| Derivado | Maestra (caja) | Salida | Calidad | Peso | Techo |
|---|---|---|---|---|---|
| `mesav.webp` | 1080×2112 (caja 27,12 1026×2088) | 340×692 | 0,92 | 35 280 B | 81 920 |
| `mesapc.webp` | 2732×1536 (sin recorte) | 820×461 | 0,92 | 31 050 B | 122 880 |
| `og-image-v2.jpg` | 2058×1080 (caja 21,18 2016×1044) | 1200×630, cubrir | 0,85 | 117 065 B | 204 800 |
| 5 copas | — | 200×283 | 0,92 | 8 742 a 13 152 B | 25 600 |

**Puerta de las copas:** los sha256 de los cinco `*_copa.webp` coinciden con `git show 82917bd:…`. `public/og-image.jpg` sigue en 109 974 B, sin tocar.

### 4.3 `index.html` y `public/_headers`

- `og:image` y `twitter:image` pasan a `https://ajilei.io/og-image-v2.jpg`. Se mantienen `og:image:width` 1200, `og:image:height` 630 y el `alt`. El comentario del bloque Open Graph explica el versionado a mano, `OG_DESTINO`, la conservación de la versión anterior y la regla de caché.
- `_headers`: nueva regla `/og-image*` → `Cache-Control: public, max-age=86400`. La de `/assets/*` queda intacta. Se corrigió el párrafo que decía que `og-image.jpg` «no lleva regla». **`dist/_headers` conserva las dos reglas**, y `dist/` lleva `og-image.jpg` y `og-image-v2.jpg`.

### 4.4 Visible en la escena 5 (modo `capvis`, derivados reales de `src/`)

| Viewport | Teléfono: caja (proporción) | Visible alto | Laptop: caja (proporción) | Visible alto | Vara laptop |
|---|---|---|---|---|---|
| S25 360×780 | 74,01×137,33 (0,539) | **91,16 %** | 200,88×104,00 (1,932) | **92,09 %** | ≥ 92 |
| 390×844 | 75,07×139,28 (0,539) | **91,16 %** | 203,86×105,67 (1,929) | **92,20 %** | ≥ 92 |
| 360×640 | 64,07×118,88 (0,539) | **91,17 %** | 158,63×80,23 (1,977) | **89,97 %** | ≥ 89 |
| 1920×1080 | 136,98×254,16 (0,539) | **91,16 %** | 328,88×176,00 (1,869) | **95,19 %** | ≥ 92 |

Todas se ven al 100 % del ancho. Antes: teléfono 92,9 % y laptop 60,5–64,0 %. El teléfono pierde 1,7 puntos (la maestra es 0,491 frente al 0,501 de la captura a mano) y la laptop gana 28–31.

### 4.5 Regresión

- `npm run build` limpio.
- **vitest:** 36 archivos, **1 006/1 006**.
- **lint:** **20 errores y 1 aviso**, la línea base, todos en archivos no tocados.
- `diagPUE` (todos los modos de `todo`): 114 verdes y **1 rojo previo** (`1.8b`, ver §4.6).
- Modo `cap` sin `--sellar` contra las maestras selladas: ver §4.6.
- Protegidos sin cambios.

### 4.6 diagPUE y regresión del modo `cap`

**`node scripts/diagPUE.mjs`** (todo): 114 mediciones verdes y 1 roja.

- **`1.8a`** (carga perezosa, la regex `mesapc|mesav`) está **en verde**: `mesapc-COjvAznI.webp` y `mesav-cka9vZbP.webp` llegan a los 2 616 ms con el resto de lo perezoso.
- **`1.8b` rojo, previo a CAP-1:** el camino crítico hasta el primer pintado mide **219,0 KiB en el cable frente a un techo de 200**. Lo pesan el JS (`index-*.js`, 179,1 KiB) y el CSS (`index-*.css`, 33,2 KiB), que CAP-1 no toca. Lo único de CAP-1 en ese camino es el comentario nuevo de `index.html`, unos 0,3 KiB de un documento de 2,1 KiB; sin él seguiría en ~218,7 KiB. El bundle ha ido creciendo en las campañas anteriores. No se corrige aquí: queda anotado (pregunta 5).

**`node scripts/diagPUE.mjs cap`** (sin `--sellar`), contra `maestras/portada/`:

| Vista | `cap.estable` | `cap.regresion` contra la sellada |
|---|---|---|
| v | 100 % · Δmáx 0 · `198289a8…` en las dos | 100 % · Δmáx 0 · 0 px distintos |
| h | 100 % · Δmáx 0 · `1e13575a…` en las dos | 100 % · Δmáx 0 · 0 px distintos |
| pc | 99,994 % · Δmáx 16 · `83b842f4…` / `6bca77f6…` | 99,994 % · Δmáx 16 · 637 633 px distintos |

Todas las puertas de contenido y `cap.ogRecorte` (4,6 px) están en verde. En pc volvió a salir el estado minoritario de rasterizado, y la vara del Addendum lo absorbe tal y como se diseñó. `maestras/portada/` no se tocó: los archivos conservan la fecha del sellado.

---

## 5. Desviaciones

1. **Modo nuevo `capvis`** en `diagPUE.mjs`, que la ficha no nombraba. §1b.5 pedía medir lo visible «con los derivados reales ya en `src/`»; hacerlo en un modo permanente es lo que permite repetirlo. No entra en `todo`, igual que `cap`.
2. **`cap.ogRecorte` y el cubrir de las puertas se derivan con el cuerpo literal del generador**, extraído del propio archivo en tiempo de ejecución por sus marcas (`derivarComoGenerador` en `capMesa.mjs`), en vez de una copia. Si alguien cambia las marcas `const salida = await pagina.evaluate(` o `}, { uri: comoDataURI(rutaOrigen)`, la puerta falla con un mensaje explícito, nunca en falso.
3. **`cap.ias` y `cap.saldo` miran las dos pasadas** (en 1a sólo la primera), como pide D-1.
4. **`_headers`:** además de añadir la regla, se corrigió el párrafo previo que enumeraba `og-image.jpg` entre lo que «no lleva regla».
5. **Edge cambió de versión durante la campaña** (153 → 154). Las maestras están selladas con la 154 y `cap.json` lo registra.

---

## 6. Preguntas al rector

1. La laptop queda **justa** en el S25 (92,09 %) y a 390×844 (92,20 %) frente a la vara de 92. Cualquier cambio de la escena 5 (relleno del marco, `aspect-ratio`) puede ponerla en rojo. ¿Se acepta ese margen o se prefiere una vara de 91?
2. El teléfono baja de 92,9 % a 91,2 % porque la maestra vertical (360×704) es un 2 % más alta que la captura a mano. ¿Se acepta?
3. `capvis` y `cap` quedan fuera de `todo`. ¿Entra `capvis` en `todo` (unos 20 s), ya que no escribe nada?
4. La prueba en teléfonos por el túnel verá `og-image-v2.jpg` sólo cuando esté desplegada en `ajilei.io`. En local, la tarjeta no se puede probar con los raspadores reales.
5. `1.8b` de `diagPUE` (camino crítico 219,0 KiB frente a 200) está en rojo **antes** de CAP-1. ¿Se abre una tanda para el bundle, o se re-sella el techo con la cifra medida?

---

## 7. Tiempo real

- **1a:** ~23 min (11:05 → 11:28).
- **Addendum (resellado y 1b):** ~17 min de reloj (15:46 → ~16:03), dentro del tope de 60. `diagPUE` completo corrió en segundo plano mientras pasaban vitest y lint.

---

## 8. Decisiones del rector sobre §6

Tomadas en la ficha `AJILEI_CAP-1_Commits_v1.0.md` y aplicadas en la tanda de ajustes previa a los commits.

| # | Decisión |
|---|---|
| 1 | La vara de la laptop en `capvis` pasa a **≥ 91 %** en el S25 360×780, a 390×844 y a 1920×1080. A 360×640 sigue en **≥ 89 %**. El teléfono sigue en **≥ 90 %**. |
| 2 | Se acepta el 91,2 % del teléfono (maestra 360×704 = viewport real del S25 en standalone). |
| 3 | **`capvis` entra en `todo`**, porque no escribe nada. `cap` se queda fuera. |
| 4 | Anotado: la tarjeta real de `og-image` sólo se prueba tras el despliegue. |
| 5 | **`1.8b` no se re-sella.** Queda como **rojo conocido** (219,0 KiB frente a 200, anterior a CAP-1, por el JS y el CSS del bundle) y pasa a la tanda de pendientes. El techo de 200 **no se toca**; el mensaje de la medición lo dice. |
