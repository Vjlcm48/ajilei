# AJILEI · DIS-1 · Fase 0 · Informe · v1.0

**Campaña:** DIS-1, dispositivos realistas de la escena 5 de la Portada
**Ficha:** `AJILEI_DIS-1_Fase0_v1.2.md` (solo lectura, con STOP)
**Fecha:** 2026-09-28 · **Rama:** `main` · **HEAD:** `59fa46d` (REC-2e), igual a `origin/main`
**Terreno:** `npm run build` y `npx vite preview --port 4173 --strictPort`. Navegadores: Edge **154.0.4258.37** (canal `msedge`) y WebKit **26.5** (rev. 2336) de playwright-core 1.62.1.
**Ejecuta:** Claude Code

**Escrito en el repositorio:** solo este informe y siete JPEG de apoyo en `docs/reportes/dis1-fase0/` (114 KB en total). Sin commits y sin `git add`. Ningún protegido abierto.

**Fuera del repositorio:**
- **Sondas de medición**, en el scratchpad de la sesión (bajo `%TEMP%`): `dis1_b3.mjs`, que mide cajas, relevo, red, ancestros y quietud, y `wk_sonda.mjs`, que diagnosticó WebKit.
- **Blender**, en `%TEMP%\dis1-sonda\`: `g2.py`, `g3.py`, `g5.py`, tres PNG y dos `.log`. Victor los borra.
- **Log** de `diagPUE`, en `%TEMP%\dis1-diagpue.log`.

---

## Resumen en ocho líneas

1. **La escena 5 es** `.pue-esc` número 5 (índice 4 del rotor) en `Portada.jsx:490-505`. Entra a los **17,0 s** del montaje y dura 4 s. Los aparatos son **CSS puro**: dos `<div>` con borde, sombra y radios, y dentro un `<img>` con `object-fit: cover`.
2. **El hueco de la laptop no tiene proporción fija.** La tapa es 16:9 en *border-box*, con un bisel de píxeles fijos, así que el hueco va de **1,869** (1920) a **1,977** (360×640). El del teléfono sí es fijo: **0,5007**, girado −3°.
3. **Hoy la escena 5 no existe en ningún teléfono en horizontal**: `landscape and max-height: 540px` pone el escenario en `display: none`. Tampoco se ve con `prefers-reduced-motion`, porque el rotor se queda en la escena 1.
4. **Defecto actual en WebKit** (medido, con captura):
   - en móvil, el marco del teléfono se resuelve a **160 px de ancho en vez de 84**. Queda un cuadrado oscuro con la pantalla pegada a la izquierda;
   - en escritorio, la laptop se desplaza 14,6 px y la base crece de 400 a 434 px.

   Es lo primero que DIS-1 tiene que dejar atrás, por la decisión sellada n.º 5.
5. **Las dos capturas se piden a los ~2,5 s en todos los casos**, incluidos los que nunca las enseñan: teléfono horizontal, y con movimiento reducido (en ese caso a los 79 ms). En móvil, la laptop se pide 17 s antes de su turno.
6. **Peso:**
   - Portada completa: **1 509,3 KiB en el cable** (2 129,2 KiB en crudo);
   - escena 5: **66 330 B** (4,3 %);
   - `1.8b` sigue en el rojo conocido: **219,4 KiB frente a 200**.

   Los renders no entran en `1.8b` si viajan por la política de los 2,5 s.
7. **Blender 4.5.10 LTS corre en modo fondo sin problemas**, pero **no hay GPU para Cycles**: solo hay una Intel UHD 770 integrada.
   - Cycles en CPU (i9-14900K, 32 hilos): 1,87 s en el render de prueba y 4,40 s a 1600×1000 con 128 muestras;
   - EEVEE: 3,28 s;
   - alfa real en todos los PNG.
8. **Línea base:** build limpio · vitest **1056/1056** · lint **21** (20 errores y 1 aviso) · `diagPUE` **122 verdes y 1 rojo** (el `1.8b` conocido).

---

## A · Lo que ya está medido

### A1. Informes leídos

- `AJILEI_CAP-1_Fase0_Informe_v1.0.md`
- `AJILEI_CAP-1_Fase1_Informe_v1.0.md`, con el Addendum 1 y las decisiones de §8
- `AJILEI_CAP-1_Cierre_v1.0.md`
- `AJILEI_REC-2_Cierre_v1.0.md`

### A2. Qué preguntas de esta ficha responden ya

| Pregunta | Dónde | Estado |
|---|---|---|
| B2, B4 (marco CSS, `object-fit: cover`, 16:9 *border-box*, relleno 7/7/9, `aspect-ratio: 340/679`) | CAP-1 Fase 0 §A3 | vigente; aquí se amplía con radios, sombras y giro |
| B3 (cajas de los `<img>` en 4 viewports) | CAP-1 Fase 1 §4.4 (modo `capvis`) | vigente. No medía marcos ni el S25 a 360×704; se completa aquí |
| C1, C2 (relevo ≤ 900 px: teléfono a 0,1 s, se desvanece a 2 s, laptop a 2,2 s) | CAP-1 Fase 0 §A3 | vigente; aquí se mide con una línea de tiempo |
| C3 (`mesapc`/`mesav` perezosas) | CAP-1 Fase 1 §4.6 (`1.8a`, 2 616 ms) | vigente; aquí se amplía a móvil, horizontal y quietud |
| D1 (maestras, dimensiones, sha256) | CAP-1 Cierre §3 y `maestras/portada/cap.json` | vigente; sha256 re-verificados al byte |
| D2 (generador, techos, `OG_DESTINO`, cubrir) | CAP-1 Fase 0 §A2 y Fase 1 §4.1–4.2 | vigente |
| D4 (sin `sharp`) | CAP-1 Fase 0 §E1-3 | vigente, re-verificado |
| E1 (pesos de los derivados) | CAP-1 Cierre §3 | vigente |
| E2 (`1.8b`) | CAP-1 Fase 1 §4.6 y §8.5 · REC-2 Cierre §4 (219,4 KiB) | vigente |
| E3 (`_headers`) | CAP-1 Fase 1 §4.3 | vigente |
| F1 (intercepción de Supabase en `cap`) | CAP-1 Fase 1 §2 · `scripts/cap/capMesa.mjs` | vigente |
| H2 (vitest 1056, lint 21, `diagPUE` 122 + 1) | REC-2 Cierre §4 | re-medido: idéntico |
| H4 (IDX-1 D-14 cerrado por CAP-1) | CAP-1 Cierre §1 | vigente |

### A3. Qué no ha cambiado desde CAP-1

`git diff --stat 5f672b4..59fa46d` sale **vacío** para todos estos archivos: `src/screens/Portada.jsx`, `src/styles/portada.css`, `scripts/gen-portada-assets.mjs`, `scripts/diagPUE.mjs`, `scripts/cap/`, `public/`, `index.html` y `maestras/`. REC-2 solo tocó archivos del juego: `mesaCore.js`, `GameTable.jsx`, `apu.css`, `textos.es.js`, `siembraAPU.js`, las pruebas y `diagDSK.mjs`.

Por tanto, las cifras de CAP-1 sobre la escena 5 siguen valiendo. Aquí solo se mide lo que la ficha pide y CAP-1 no midió: marcos, 360×704, horizontal, línea de tiempo, red por viewport, quietud y WebKit. El `capvis` de hoy repite al centésimo las cifras de CAP-1.

---

## B · La escena 5 hoy

### B1. Estructura

**Componente:** `src/screens/Portada.jsx`, que monta `App.jsx:346-347` cuando `auth.estado === SIN_SESION`.

**JSX de la escena:** `Portada.jsx:490-505`.
```
div.pue-esc(.pue-activa)            ← esc(4)
  div.pue-duo
    div.pue-laptop
      div.pue-laptop-pantalla > img[src=mesapcUrl]   (src sólo si `pesadas`)
      div.pue-laptop-base
    div.pue-telefono
      div.pue-pantalla > img[src=mesavUrl]
```

**Identificador real:** no hay ni `id` ni `data-*`. Es el **quinto `.pue-esc`** dentro de `.pue-escenario`, el índice **4** del rotor (`esc(4)`, `Portada.jsx:372` y `:491`). El arnés lo localiza así: `[...document.querySelectorAll('.pue-esc')].findIndex(e => e.classList.contains('pue-activa')) === 4` (`diagPUE.mjs`, `INDICE_ACTIVA`). En la sonda se usó `.pue-esc:nth-child(5)`. El comentario del JSX lo llama «5 · la mesa real».

**Cómo se entra:**
- **Rotor** (`Portada.jsx:271-278`): un `setTimeout` por escena, con `DURACIONES = [4000, 4000, 4500, 4500, 4000]` (`:44`). Se llega a la escena 5 a los **17 000 ms** del montaje; medido, 17,32–17,36 s desde la navegación. Dura **4 000 ms**.
- **Pausas:** si el foco está en la tarjeta (`pausada`) o la pestaña está oculta, el reloj se rearma (`reintento`) sin avanzar.
- **Con `prefers-reduced-motion`**, `escenaViva` queda fija en 0 (`:190`): **nunca se llega a la escena 5**. Medido: índice 0 durante 20 s.
- **Estilos:** `portada.css:534-625` (base), `:808-841` (≤ 900 px y relevo), `:893-917` (vertical compacto), `:919-924` y `:926-940` (escenario oculto) y `:948-968` (quietud).

### B2. Cómo se dibujan hoy los aparatos

**CSS puro**, sin SVG y sin imagen de marco. La única imagen es la captura del hueco. Todo el conjunto se centra con `.pue-duo`: `left: 50%`, `translateX(-50%)`, ancho `min(560px, 100%)` en escritorio y `min(320px, 94%)` en ≤ 900 px, y alto = alto del escenario.

**Laptop** (`portada.css:552-591`):

| Pieza | Regla | Medida |
|---|---|---|
| Conjunto `.pue-laptop` | `position: absolute; left: 33.17%` (escritorio) o `50%` (≤ 900); `bottom: 6px`; `height: 68%` (escritorio), `88%` (≤ 900), `82%` (vertical ≤ 700 px de alto); `translateX(-50%)`; **sin ancho declarado**: lo da la tapa | 345×204 a 1920 |
| Tapa `.pue-laptop-pantalla` | `height: calc(100% − 10px)`; **`aspect-ratio: 16/9` en *border-box***; `padding: 7px 7px 9px`; borde de 1 px dorado al 35 %; `border-radius: 12px 12px 4px 4px`; sombra `0 22px 40px rgba(0,0,0,.5)` | proporción exterior **1,778** |
| Hueco (`img`) | 100 % × 100 % del contenido; `object-fit: cover`; `object-position: 50% 50%`; `border-radius: 6px` | ancho = tapa − 16, alto = tapa − 18 |
| Base `.pue-laptop-base` | `height: 10px`; `width: 116%`; `margin-left: −8%`; degradado; borde de 1 px sin borde superior; `border-radius: 2px 2px 10px 10px` | sobresale un 8 % por cada lado |

Posición del hueco dentro del marco: 8 px desde la izquierda, la derecha y arriba, y 10 px desde abajo de la tapa (relleno más borde). El bisel es de píxeles fijos, así que **la proporción del hueco depende del tamaño**: `(H·16/9 − 16) / (H − 18)`. Medido: 1,869 a 1920; 1,898 a 1440×850; 1,914 a 1366×768; 1,929 a 390×844; 1,932 en el S25; 1,977 a 360×640. Sin giro ni inclinación.

**Teléfono** (`portada.css:592-625`):

| Pieza | Regla | Medida |
|---|---|---|
| Marco `.pue-telefono` | `position: absolute; left: 83.17%` (escritorio) o `50%`; `bottom: 6px`; `height: 88%` (escritorio) o `100%` (≤ 900); `padding: 7px`; borde de 1 px dorado al 35 %; `border-radius: 26px`; sombra `0 24px 44px rgba(0,0,0,.55)`; **`transform: translateX(-50%) rotate(-3deg)`**; `z-index: 2`; **sin ancho declarado**: lo da la pantalla | 140×264 sin girar a 1920 (0,530); 83×150 en el S25 (0,553) |
| Hueco `.pue-pantalla` | `height: 100%`; **`aspect-ratio: 340/679` = 0,50074**; `overflow: hidden`; `border-radius: 19px` | 124,2×248 a 1920 |
| `img` | 100 % × 100 %; `object-fit: cover`; `object-position: 50% 50%` | — |

Posición del hueco: 8 px por cada lado (relleno más borde), centrado. El giro de −3° se aplica al marco entero, alrededor de su centro.

### B3. Cajas medidas

**Método:**
- sonda Playwright en 4173 con `getBoundingClientRect` (gBCR) y `offsetWidth/offsetHeight` (tamaño sin transformar);
- escena 5 viva, en el instante asentado: teléfono y escritorio a +1,3 s de la activación, laptop móvil a +3,3 s;
- contextos móviles con `isMobile` y `hasTouch`;
- el teléfono va girado −3°: su gBCR es la **envolvente del giro**, y el tamaño real del marco es la columna «sin transformar», centrado en el centro de la envolvente.

| Viewport | Elemento | x, y | ancho × alto (gBCR) | sin transformar (offset) | Método |
|---|---|---|---|---|---|
| 1920×1080 @1 | Contenedor · .pue-escenario | 340,0 · 474,3 | 671,6 × 300,0 | 672 × 300 | gBCR · +1,3 s |
| 1920×1080 @1 | .pue-duo | 395,8 · 474,3 | 560,0 × 300,0 | 560 × 300 | gBCR · +1,3 s |
| 1920×1080 @1 | Laptop · conjunto (.pue-laptop) | 409,1 · 564,3 | 344,9 × 204,0 | 345 × 204 | gBCR · +1,3 s |
| 1920×1080 @1 | Laptop · tapa (.pue-laptop-pantalla) | 409,1 · 564,3 | 344,9 × 194,0 | 345 × 194 | gBCR · +1,3 s |
| 1920×1080 @1 | Laptop · hueco (img) | 417,1 · 572,3 | 328,9 × 176,0 | 329 × 176 | gBCR · +1,3 s |
| 1920×1080 @1 | Laptop · base | 381,5 · 758,3 | 400,0 × 10,0 | 400 × 10 | gBCR · +1,3 s |
| 1920×1080 @1 | Teléfono · marco (.pue-telefono) | 784,6 · 500,8 | 153,8 × 271,0 | 140 × 264 | gBCR · +1,3 s |
| 1920×1080 @1 | Teléfono · hueco (.pue-pantalla) | 793,1 · 509,2 | 137,0 × 254,2 | 124 × 248 | gBCR · +1,3 s |
| S25 v 360×704 @3 | Contenedor · .pue-escenario | 24,0 · 308,2 | 312,0 × 150,0 | 312 × 150 | gBCR · +1,3 s |
| S25 v 360×704 @3 | .pue-duo | 33,4 · 308,2 | 293,3 × 150,0 | 293 × 150 | gBCR · +1,3 s |
| S25 v 360×704 @3 | Laptop · conjunto (.pue-laptop) | 71,6 · 320,2 | 216,9 × 132,0 | 217 × 132 | gBCR · +3,3 s |
| S25 v 360×704 @3 | Laptop · tapa (.pue-laptop-pantalla) | 71,6 · 320,2 | 216,9 × 122,0 | 217 × 122 | gBCR · +3,3 s |
| S25 v 360×704 @3 | Laptop · hueco (img) | 79,6 · 328,2 | 200,9 × 104,0 | 201 × 104 | gBCR · +3,3 s |
| S25 v 360×704 @3 | Laptop · base | 54,2 · 442,2 | 251,6 × 10,0 | 252 × 10 | gBCR · +3,3 s |
| S25 v 360×704 @3 | Teléfono · marco (.pue-telefono) | 134,6 · 300,1 | 90,8 × 154,1 | 83 × 150 | gBCR · +1,3 s |
| S25 v 360×704 @3 | Teléfono · hueco (.pue-pantalla) | 143,0 · 308,6 | 74,0 × 137,3 | 67 × 134 | gBCR · +1,3 s |
| 390×844 @3 | Contenedor · .pue-escenario | 24,0 · 378,0 | 342,0 × 151,9 | 342 × 152 | gBCR · +1,3 s |
| 390×844 @3 | .pue-duo | 35,0 · 378,0 | 320,0 × 151,9 | 320 × 152 | gBCR · +1,3 s |
| 390×844 @3 | Laptop · conjunto (.pue-laptop) | 85,1 · 390,2 | 219,9 × 133,7 | 220 × 134 | gBCR · +3,3 s |
| 390×844 @3 | Laptop · tapa (.pue-laptop-pantalla) | 85,1 · 390,2 | 219,9 × 123,7 | 220 × 124 | gBCR · +3,3 s |
| 390×844 @3 | Laptop · hueco (img) | 93,1 · 398,2 | 203,9 × 105,7 | 204 × 106 | gBCR · +3,3 s |
| 390×844 @3 | Laptop · base | 67,5 · 513,9 | 255,0 × 10,0 | 255 × 10 | gBCR · +3,3 s |
| 390×844 @3 | Teléfono · marco (.pue-telefono) | 149,1 · 369,9 | 91,9 × 156,1 | 84 × 152 | gBCR · +1,3 s |
| 390×844 @3 | Teléfono · hueco (.pue-pantalla) | 157,5 · 378,3 | 75,1 × 139,3 | 68 × 136 | gBCR · +1,3 s |
| 360×640 @3 | Contenedor · .pue-escenario | 24,0 · 270,4 | 312,0 × 132,0 | 312 × 132 | gBCR · +1,3 s |
| 360×640 @3 | .pue-duo | 33,4 · 270,4 | 293,3 × 132,0 | 293 × 132 | gBCR · +1,3 s |
| 360×640 @3 | Laptop · conjunto (.pue-laptop) | 92,7 · 288,2 | 174,6 × 108,2 | 175 × 108 | gBCR · +3,3 s |
| 360×640 @3 | Laptop · tapa (.pue-laptop-pantalla) | 92,7 · 288,2 | 174,6 × 98,2 | 175 × 98 | gBCR · +3,3 s |
| 360×640 @3 | Laptop · hueco (img) | 100,7 · 296,2 | 158,6 × 80,2 | 159 × 80 | gBCR · +3,3 s |
| 360×640 @3 | Laptop · base | 78,7 · 386,4 | 202,6 × 10,0 | 203 × 10 | gBCR · +3,3 s |
| 360×640 @3 | Teléfono · marco (.pue-telefono) | 139,5 · 262,6 | 80,9 × 135,7 | 74 × 132 | gBCR · +1,3 s |
| 360×640 @3 | Teléfono · hueco (.pue-pantalla) | 148,0 · 271,0 | 64,1 × 118,9 | 58 × 116 | gBCR · +1,3 s |
| S25 h 780×360 @3 | todos | — | display: none (el escenario no existe) | — | computed display · +19 s |
| S25 h 704×360 @3 | todos | — | display: none | — | ídem |

**Contexto adicional** (otros viewports, mismo método; hueco de laptop medido con el valor usado de `width`/`height`):

| Viewport | Laptop: tapa | Laptop: hueco (proporción) | Teléfono: marco sin girar | Teléfono: hueco sin girar | Método |
|---|---|---|---|---|---|
| S25 360×780 @3 (el de `capvis`) | 216,9 × 122,0 | 200,9 × 104,0 (1,932) | 83 × 150 | 67 × 134 | gBCR/offset |
| 1366×768 @1 | 242,2 × 136,2 | 226,2 × 118,2 (1,914) | 103 × 189 | 87 × 173 | gBCR/offset |
| 1440×850 @1 | 269,9 × 151,8 | 253,9 × 133,8 (1,898) | 113 × 209 | 97 × 193 | gBCR/offset |
| 901×1000 @1 | 320,7 × 180,4 | 304,7 × 162,4 (1,876) | 131 × 246 | 115 × 230 | gBCR/offset |
| 768×1024 @2 (relevo) | 270,5 × 152,2 | 254,5 × 134,2 (1,896) | 100 × 184 | 84 × 168 | gBCR/offset |

**Tamaño exacto del hueco del teléfono** (valor usado, sin girar):

| Viewport | Hueco |
|---|---|
| 1920 | 124,172 × 248,000 |
| S25 360×704 | 67,094 × 134,000 |
| 390×844 | 68,047 × 135,906 |
| 360×640 | 58,078 × 116,000 |

La proporción es **0,5007** en todos.

### B4. Colocación de la captura

Las dos capturas llevan `object-fit: cover` con `object-position: 50% 50%`: escalan hasta cubrir el hueco y recortan por igual lo que sobra, centrado. Ni desplazamientos ni máscaras.

**Laptop.** `mesapc.webp` mide 820×461 (**1,779**) y el hueco, 1,87–1,98, así que se recorta **alto**. Parte visible (valor usado; el hueco no está girado):

| Viewport | Parte visible del alto |
|---|---|
| 1920×1080 | 95,19 % |
| 1440×850 | 93,75 % |
| 1366×768 | 92,98 % |
| 390×844 | 92,20 % |
| S25 (360×704 y 360×780) | 92,09 % |
| 360×640 | 89,97 % |

Coincide con `capvis`. Densidad: 2,49 px de captura por px CSS a 1920; 4,08 en el S25 y 5,17 a 360×640.

**Teléfono.** `mesav.webp` mide 340×692 (**0,4913**) y el hueco, 0,5007: se recorta **alto**, y la parte visible real es el **98,13 %** en todos los viewports (valor usado, sin girar).

> **Observación:** `capvis` informa del **91,16 %** para el teléfono. Mide la caja gBCR del `<img>` **girado −3°**, que es la envolvente del giro (proporción 0,539, la cifra que CAP-1 Fase 0 atribuía a la caja real), y no el hueco. La vara del teléfono en `capvis` mide, por tanto, una magnitud desplazada hacia abajo unos 7 puntos. Sale verde por el lado seguro. **No se corrige aquí.** Afecta a cómo se defina «visible» en el modo `dis` (F2).

### B5. Espacio libre alrededor de cada aparato

**Ancestros que recortan.** Método: se recorre la cadena de `parentElement` desde `.pue-telefono` y `.pue-laptop` con `getComputedStyle` (overflow, clip-path, contain).

- **El único ancestro que recorta es `main.pue-lienzo`** (`overflow: hidden`, `portada.css:63`), del tamaño del viewport.
- `.pue-duo`, `.pue-esc`, `.pue-escenario`, `.pue-hero` y `.pue-escena-grid` son todos `overflow: visible`.
- `.pue-pantalla` (el hueco del teléfono) lleva `overflow: hidden`, pero solo recorta su propia captura.

Una sombra o un aparato algo más grande **no se corta** mientras no cruce el borde del viewport.

**Tamaños fijos en px:**
- el bisel (relleno 7 y 9 más borde 1) y los radios 12/4/6/26/19;
- la base de 10 px de alto;
- `bottom: 6px`;
- el ancho máximo de `.pue-duo` (560 / 320);
- el alto del escenario en vertical compacto (132 px).

Lo demás es proporcional: `height` en % del escenario, cuyo alto es `clamp(210px, 28vh, 300px)`, `clamp(150px, 18vh, 200px)` en ≤ 900 o `132px` en vertical ≤ 700.

**Holguras medidas** (gBCR, +1,3 s o +3,3 s; «tinta» = unión de los dos aparatos, marco incluido):

| Viewport | Lema → tinta (arriba) | La tinta sobresale del escenario por arriba | Tinta → frase (abajo) | Tinta → bordes laterales del viewport | Tinta → tarjeta |
|---|---|---|---|---|---|
| 1920×1080 | 69,7 | no (26,5 por dentro) | 24,5 | 381,5 / 981,6 | 145,2 |
| S25 360×704 | 20,0 | **8,1** (teléfono con `height: 100%` y giro) | 25,9 | 54,2 / 54,2 | — |
| 390×844 | 25,7 | **8,1** | 25,9 | 67,5 / 67,5 | — |
| 360×640 | **12,2** | **7,8** | 20,1 | 78,7 / 78,7 | — |
| 1366×768 | 48,0 | no | 25,4 | 165,2 / 724,1 | 163,1 |
| 1440×850 | 53,7 | no | 25,2 | 185,0 / 756,6 | 160,2 |
| **901×1000** | 64,4 | no | 24,7 | **−7,9** / 418,6 | 51,2 |

**Hallazgos de B5:**

1. **A 901 px de ancho, la base de la laptop se sale 7,9 px del viewport por la izquierda** y la recorta el lienzo (captura `dis1-fase0/edge_901x1000_base_recortada.jpg`). La causa es la suma de `left: 33.17%` sobre un `.pue-duo` de solo 465 px y la base al 116 %. Pasa en la franja 901…~1000 px.
2. **Las sombras CSS ya invaden la zona de la frase.** Son `0 22px 40px` y `0 24px 44px`, más largas que los 20–26 px de aire hasta la frase. No se ve porque la sombra se difumina. Una sombra de contacto horneada en el render caería en el mismo sitio.
3. En móvil vertical, **el aire hasta el lema de arriba es lo más justo**: 12,2 px a 360×640 y 20 px en el S25. El teléfono ya asoma unos 8 px por encima del escenario.
4. `diagPUE 1.3a` mide la holgura de la escena 5 con los **`<img>`**, no con los marcos: 32,9 px a 1920, 34,3 a 390×844 y 28,6 a 360×640 y 320×568 (vara ≥ 10). Con un render, la «tinta» pasa a ser la del render.

**Textos que rozan:** en escritorio, ninguno. En móvil, el lema de categoría por arriba (hallazgo 3) y la frase por abajo, siempre a ≥ 20 px de la tinta. El CTA «JUGAR» queda por debajo de la frase y no roza.

---

## C · El relevo en móvil

### C1. Dónde se decide

**Solo en CSS**, sin JS: `@media (max-width: 900px)` en `portada.css:809-841`.

- **≤ 900 px de ancho:** relevo (`:837-840`).
- **≥ 901 px:** los dos juntos, con las animaciones base de `:560` y `:606`.

`Portada.jsx` no distingue escritorio de móvil. Solo pregunta `ESCENA_OCULTA` (`:114-115`) para la moneda de la escena 4.

**Casos que el corte arrastra:**
- las tabletas en vertical (768×1024, medido) usan el relevo;
- en vertical con ≤ 700 px de alto, el escenario baja a 132 px y la laptop a `height: 82%` (`:896-917`);
- en vertical con ≤ 520 px de alto, y en horizontal con ≤ 540 px de alto, **no hay escena** (`:920-924` y `:927-940`).

### C2. Cómo es el relevo

**Método:** opacidad computada muestreada cada ~50 ms desde la activación (sonda), más los `animation-*` computados.

| Tramo | Escritorio (≥ 901) | Móvil (≤ 900) |
|---|---|---|
| Laptop entra | `pue-alzar-pc 0.55s ease-out 0.1s`: opacidad 1 a ~0,43 s | `pue-alzar-pc 0.55s ease-out 2.2s`: empieza a 2,22 s, opacidad 1 a **2,54–2,61 s** |
| Teléfono entra | `pue-alzar 0.55s ease-out 0.45s`: opacidad 1 a ~0,78–0,83 s | `pue-alzar 0.55s ease-out 0.1s`: opacidad 1 a **~0,46 s** |
| Teléfono sale | no sale | `pue-esfumar 0.4s ease 2s`: opacidad 0 a **~2,43 s** |
| Cruce | — | entre 2,22 y 2,43 s conviven, los dos por debajo de 0,3 (a 2,27 s: teléfono 0,08, laptop 0,28) |
| Tiempo a opacidad plena | ambos, ~3,2 s | teléfono ≈ 1,55 s (0,46 → 2,0); laptop ≈ **1,4–1,5 s** (2,55 → 4,0) |
| Fin de la escena (4,0 s) | **los aparatos pasan a opacidad 0 de golpe** | ídem |

Las animaciones son `pue-alzar*` (opacidad y `translate` con rebote −8 / +2 px; el teléfono conserva `rotate(-3deg)` en todos los fotogramas) y `pue-esfumar` (solo opacidad).

**Quién lleva el tiempo:**
- **el rotor JS** decide cuándo entra y sale la escena (`setTimeout` de 4 000 ms);
- **el CSS** lleva todo lo de dentro, con `animation-delay`. No hay temporizadores JS por aparato.

Si el rotor se pausa (foco en la tarjeta), la escena se alarga a múltiplos de 4 s, pero sus animaciones (una sola vez, `forwards`) no se repiten.

**Salida a golpe (hallazgo).** Las animaciones de los aparatos cuelgan de `.pue-activa .pue-laptop` y `.pue-activa .pue-telefono`. Al quitar `.pue-activa`, los aparatos vuelven a su `opacity: 0` base en el mismo fotograma, mientras el contenedor `.pue-esc` se desvanece en 0,7 s. Medido: a 4 019 ms, teléfono 0, laptop 0 y contenedor 0,99. **El fundido de salida de la escena 5 no se ve**: los aparatos se apagan en seco.

**`prefers-reduced-motion`:** la escena 5 **no aparece nunca**; el rotor se queda en la escena 1 (medido, 20 s). La regla de quietud (`:948-968`) anula las animaciones y **no** repone la opacidad de `.pue-laptop` ni de `.pue-telefono`. Si la escena llegara a mostrarse con quietud, los aparatos quedarían invisibles. Hoy es inalcanzable.

### C3. Carga de la laptop

**Cuándo se pide.** Las dos capturas llevan `src` solo cuando `pesadas` es verdadero (`Portada.jsx:495` y `:501`). `pesadas` = `quieto || pesadasTardias`, y `pesadasTardias` se activa a los 2 500 ms (`:229-237`). No llevan `loading="lazy"` ni dependen del viewport. Medido, desde la navegación:

| Caso | `mesapc` y `mesav` pedidas | ¿Se enseñan? |
|---|---|---|
| 1920×1080, 1366, 1440, 901 | a 2 806–2 835 ms, juntas | sí, las dos a los ~17,3 s |
| S25 v, 390×844, 360×640, 768×1024 | a 2 801–2 850 ms, juntas | teléfono a ~17,3 s; **laptop a ~19,5 s** |
| S25 h 780×360 y 704×360 | a 2 802–2 812 ms | **nunca**: escenario en `display: none` |
| `prefers-reduced-motion` 1920 | a **79 ms** | **nunca**: el rotor no avanza |

En móvil, la imagen de la laptop **se pide antes de mostrarse**: ~17 s antes de su turno, en el mismo lote que la del teléfono. Nada la retrasa hasta el relevo.

**Relación con `1.8a`.** `diagPUE.mjs:1087` exige que todo lo que casa con `/uno_copa|…|mesapc|mesav|heptacoin-poster/` se pida a ≥ 2 400 ms, y solo lo mide a 1920. Hoy sale verde (2 607 ms).

El patrón de MON-2.1 no se aplica a la escena 5: la moneda de la escena 4 **no** se descarga donde la escena no existe ni con quietud (`Portada.jsx:343-351`, Sistema de Diseño, adenda 5), pero las capturas de la escena 5 sí se descargan. Con 66 KB hoy importa poco. Con renders más pesados, importaría más (K-6).

---

## D · Maestras y derivados

### D1. Las maestras

| Archivo | Resolución | Proporción | sha256 | Vista | Método |
|---|---|---|---|---|---|
| `maestras/portada/mesav.png` | 1080×2112 (RGB de 8 bits, sin alfa) | **0,511** entera · **0,491** la caja dorada (1026×2088, desde 27,12) | `198289a8f290fca3bc603e5e2b4b941fd3b34bc21c3323101a0573e431ad43bc` | v · 360×704 @3 (S25 standalone) → teléfono de la escena 5 | cabecera IHDR con Node y `crypto.createHash`; la caja, del generador (CAP-1 Fase 1 §4.2) |
| `maestras/portada/mesapc.png` | 2732×1536 (RGB de 8 bits) | **1,779** (683:384; 16:9 = 1,778) | `6bca77f6bb092d3c3a0e36f9cc0cc47d6a495e96a0d441ace14f991a9d6761a6` | pc · 1366×768 @2 → laptop de la escena 5 | ídem |
| `maestras/portada/mesah.png` | 2058×1080 (RGB de 8 bits) | **1,906** entera · 1,931 la caja dorada (2016×1044) | `1e13575a3f10a1f1b3afb37db63d10584250f99762bf8b3ed489d49aaaae2710` | h · 686×360 @3 → solo la `og-image` | ídem |
| `maestras/portada/cap.json` | — | — | `f77df5c3…` | traza del sello: semilla 5, Edge 154.0.4258.37, receta y vara | `sha256sum` |

Los tres sha256 coinciden al byte con `cap.json` y con CAP-1 Cierre §3. Las tres entraron en `59ad115` (CAP-1b) y no han cambiado.

### D2. El generador (`scripts/gen-portada-assets.mjs`)

**Entradas y salidas** (`:88-136`):

| Maestra | Salida | Techo | Recorte |
|---|---|---|---|
| `maestras/portada/mesav.png` | `src/assets/portada/mesav.webp`, ancho 340 | 80 KiB | `juego` |
| `maestras/portada/mesapc.png` | `…/mesapc.webp`, ancho 820 | 120 KiB | ninguno |
| `maestras/portada/mesah.png` | `public/${OG_DESTINO}`, 1200×630 | 200 KiB | `juego` + `encaje: 'cubrir'` |

Aparte, cinco copas pasan por IDX-1 (200 de ancho, techo de 25 KiB).

**Constantes:** `MAESTRAS = 'maestras/portada'` (`:76`) y `OG_DESTINO = 'og-image-v2.jpg'` (`:85`).

**Recorte `juego`** (`:220-253`): se camina desde cada borde hasta la primera fila o columna con ≥ 30 % de píxeles **dorados**, muestreando 1 de cada 2. Es el filete de la mesa.

**Medidas de salida** (`:257-258`): el ancho es fijo y el alto sale de la proporción del recorte (`round(sh/sw · ancho)`), salvo que el trabajo declare `alto`.
- `mesav`: 340×692 (0,4913)
- `mesapc`: 820×461 (1,7787)
- `og`: 1200×630

**Encajes** (`:267-291`):
- `contener`: bandas `#09170e`. Ningún trabajo lo usa.
- `cubrir`: se activa con `encaje === 'cubrir' || trabajo.alto`. Es **centrado**: `drawImage(img, sx + (sw−cw)/2, sy + (sh−ch)/2, cw, ch, 0, 0, dw, dh)`. Lo usa solo la `og`.
- sin encaje: escalado directo.

**Formato y calidad** (`:295-309`): `canvas.toDataURL(tipo, q)`, WebP con tope de 0,92 y JPEG con tope de 0,85. Si pasa del techo, bisección en 12 pasadas entre 0,30 y el tope. `imageSmoothingQuality: 'high'`.

**Motor** (`:157-160`): **Edge**, vía playwright-core (`channel: 'msedge'`, headless). El navegador es el conversador: no hay `sharp` (`:19-28`).

**Derivados de hoy:**

| Derivado | Tamaño | Peso | Calidad |
|---|---|---|---|
| `mesav.webp` | 340×692 | 35 280 B | 0,92, sin bisección |
| `mesapc.webp` | 820×461 | 31 050 B | 0,92 |
| `og-image-v2.jpg` | — | 117 065 B | 0,85 |

Los dos WebP llevan cabecera `VP8X` (medido).

**Nota menor:** el comentario de `OG_DESTINO` (`:78-80`) cita `index.html` «líneas 51 y 61». Hoy `og:image` está en `:61` y `twitter:image` en `:71`. El comentario quedó viejo; no se corrige.

### D3. ¿Admite otra proporción de pantalla sin tocar las maestras?

**Sí, casi sin cambiar código.**
- Añadir `alto: Math.round(ancho / R)` a los trabajos `mesav` o `mesapc` los lleva a la rama `cubrir` (`:279`, condición `|| trabajo.alto`) y produce un derivado de proporción exacta **R**, recortado **centrado** desde la maestra (o desde su caja dorada en `mesav`). No hay que tocar las maestras ni el algoritmo.
- **Laptop:** si el hueco del render es 16:9 (1,7778) y la maestra es 1,7786, el recorte es de **0,02 %**: sin efecto práctico.
- **Teléfono:** la caja dorada mide 0,4914. Un hueco más ancho (0,50) recorta arriba y abajo, y uno más estrecho (19,5:9 = 0,4615), los lados.

**Qué habría que cambiar de verdad:**
1. **Si el recorte no puede ser centrado** (por ejemplo, conservar la cabecera del teléfono), hace falta un parámetro de anclaje en `:286-288`, unas 3 líneas.
2. **Si conviven el derivado plano de hoy y el de DIS-1** durante una transición, hace falta un `id` y un `destino` nuevos en `TRABAJOS`, porque los nombres de salida son fijos.
3. **Alfa:** las salidas de hoy no la necesitan. Si el generador tuviera que producir también los renders con alfa, `toDataURL('image/webp')` de Edge conserva el canal alfa en principio, pero **no se ha probado en esta fase**. Recordatorio: el WebP animado de MON-2 se hizo con Pillow, fuera de este generador.
4. **Acoplamientos a vigilar:**
   - `capvis` usa los selectores `.pue-pantalla img` y `.pue-laptop-pantalla img`;
   - `1.8a` reconoce `mesapc|mesav` por nombre;
   - `1.3a` toma la tinta de los `<img>`.

### D4. Herramientas

- Node **v22.19.0** y npm 10.9.3.
- **`sharp`: no disponible.** `require.resolve('sharp')` da `MODULE_NOT_FOUND`, y no hay `sharp` ni `@img/*` en `node_modules` ni en `package.json`.
- playwright-core **1.62.1**, fijado en `package.json:30`.

---

## E · Peso, carga y caché

### E1. Peso actual

Ningún modo permanente suma la Portada entera. La cifra más cercana es la del modo `1.8` de `diagPUE` (solo 1920×1080): `1.8b` crítico 219,4 + `1.8c` diferido 1 154,3 + perezoso 135,6 = **1 509,3 KiB en el cable**, que coincide al decimal con la sonda.

| Medida | 1920×1080 | S25 v 360×704 @3 | S25 h (escena oculta) | Método |
|---|---|---|---|---|
| Peticiones (sin `blob:`) | 16 | 16 | 15 | sonda: `page.on('request'/'response')` durante 21 s |
| Portada completa, crudo | 2 180 302 B (2 129,2 KiB) | 2 180 302 B | 1 115 346 B | suma de `response.body()` |
| Portada completa, cable | **1 545 529 B (1 509,3 KiB)** | **1 545 529 B** | 480 573 B | gzip nivel 9 para el texto; lo ya comprimido, tal cual (el método de `1.8`) |
| … de ello, la moneda animada (escena 4) | 1 064 956 B | 1 064 956 B | 0 (MON-2.1) | ídem |
| **Escena 5** (`mesapc` + `mesav`) | **66 330 B** (31 050 + 35 280) = 4,3 % del cable | **66 330 B** | 66 330 B **sin enseñarse** | ídem; coincide con el disco (`ls -l src/assets/portada` y `dist/assets`) |

`vite preview` sirve sin comprimir. La columna «cable» es una estimación con gzip, no la compresión real de Cloudflare.

### E2. El rojo `1.8b`

**Qué mide** (`diagPUE.mjs:1034-1136`): contexto frío a 1920×1080. Suma los bytes **en el cable** (gzip nivel 9, salvo lo que ya nace comprimido) de toda petición iniciada **antes del primer pintado con contenido** (FCP), leído de `performance.getEntriesByName('first-contentful-paint')`.

**Umbral:** `TECHO_CRITICO_KIB = 200` (`:73`). La decisión 5 de CAP-1 prohíbe re-sellarlo.

**Hoy** (`diagPUE`, 28-sep): FCP = 112 ms, 7 recursos, **219,4 KiB en el cable** (839,3 KiB en crudo). El peso viene de:
- `index-*.js`: 179,3 KiB en el cable, 620,7 en crudo;
- `index-*.css`: 33,3 / 198,5;
- documento: 2,1;
- isotipo, reverso e icono: unos 4,6.

`npm run build` informa de 185,74 kB de JS y 34,52 kB de CSS en gzip.

**Margen para los renders: negativo (−19,4 KiB), pero los renders no cuentan** si viajan como las capturas de hoy, con `src` solo al llegar `pesadas` (2,5 s ≫ FCP de 112 ms).

Lo que DIS-1 sí sumaría a `1.8b`:
- el **CSS** nuevo de la escena, que va en el `index-*.css` crítico: unos cientos de bytes por regla con `matrix3d`;
- el **JS** si la homografía se calcula en tiempo de ejecución.

Para no empeorar el rojo, las matrices deberían llegar **como constantes** (CSS o JSON generado), no como código de cálculo. Un render importado con `?inline` o un data URI también lo empeoraría.

### E3. Ubicación de los renders

**`public/_headers`:**
- `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`. Solo es seguro porque Vite pone hash de contenido.
- `/og-image*` → `public, max-age=86400`, versionado a mano.
- Lo demás de `public/` (sin hash) no lleva regla y **revalida en cada visita**. Lo documentan `_headers` y el Sistema de Diseño, adenda 5, sobre la moneda.

**`src/assets/…` frente a `public/`:**
- lo que se importa desde `src/assets/` sale a `dist/assets/nombre-HASH.ext` y entra en la zona `immutable`;
- `public/` sale tal cual, sin hash.

El precedente de MON-2.1 movió la moneda de `public/` a `src/assets/` precisamente por esto.

**Dónde encajarían:**
- **Derivados web** de los renders (WebP con alfa, dimensionados para la escena): en **`src/assets/portada/`**, junto a `mesav.webp` y `mesapc.webp`, importados desde `Portada.jsx` y con `src` bajo `pesadas`. Así quedan con hash e `immutable`, fuera de `1.8b`, y `1.8a` los vigila si el nombre casa con su expresión o se amplía.
- **Maestras de render** (PNG de 16 bits con alfa a resolución alta, reutilizables en el video): fuera del bundle, versionadas como `maestras/portada/`. Por ejemplo, `maestras/dis1/`, con la traza (versión de Blender, archivo `.blend`, cámara) y las **esquinas del hueco en píxeles** en un JSON. Nada de eso va a `public/`: no tiene que servirse.
- `public/` solo sería el sitio si un render tuviera que tener URL estable fuera de la app, como la `og-image`. No es el caso de la escena 5.

---

## F · Arnés

### F1. Modos de `diagPUE.mjs`

Contexto común: se lanza contra `PUE_BASE` (por defecto `http://localhost:4173`) con Edge, y comprueba antes que el servidor responde (`:146-162`).

| Modo | Qué mide | ¿En `todo`? |
|---|---|---|
| `puerta` | el visitante anónimo llega a la Portada: ruta `/`, sin sesión guardada, raíz y rotor presentes, Bienvenida, Entrada y lobby ausentes (`puerta.0-6`) | sí |
| `1.1` / `1.2` / `1.3` / `1.9` | en 5 viewports (1920, 390×844, 360×640, 320×568, 851×393): sin desplazamiento, escalera del wordmark, **eje y holgura de cada escena** (`1.3a`: la tinta son los `img`, `.pregunta span` y `.marcador` visibles; eje ≤ 4 px e invade=false; holgura con la frase ≥ 10 px), aire mano↔marcador (`1.3c`) y consola limpia | sí |
| `1.4` | hoja móvil a 390×844 (`1.4a-f`) | sí |
| `1.5` | selector de idioma | sí |
| `1.6` | movimiento reducido (`1.6a-f`: nada anima, el rotor no avanza, el póster de la escena 4 queda quieto) | sí |
| `1.7` | pausa del rotor con foco en el correo | sí |
| `2.4` | O1: reservas del formulario; intercepta `**/auth/v1/otp**` (`:668`) | sí |
| `2.5` | gesto del ganador de la escena 2 | sí |
| `mon` | render WebP animado con alfa de la escena 4 frente al rotor, sondas de píxel (`mon.0-10`) | sí |
| `1.8` | bitácora de red en frío a 1920 (`1.8a` perezosas ≥ 2 400 ms; **`1.8b`** crítico; `1.8c` resto; `1.8d-e` el animado) | sí |
| `capvis` | fracción visible de `mesav` y `mesapc` en la escena 5 viva, en 4 viewports (S25 360×780, 390×844, 360×640, 1920) | sí |
| `cap [--sellar]` | fotografía la mesa y sella las maestras (sesión simulada) | **no**: solo por nombre (`hacerSolo`) |

**Cómo llega a la escena 5:** navega a `/` y **espera al rotor real**, `waitForFunction(INDICE_ACTIVA === 4)` (`esperarEscena`, `:133-137`), unos 17 s. No fuerza el índice. `capvis` espera además a que los dos `<img>` estén `complete` con `naturalWidth > 0`.

**Cómo intercepta Supabase:**
- **La Portada anónima no llama a Supabase.** La sonda registró 16 peticiones, todas al origen local.
- Solo `2.4` intercepta, `**/auth/v1/otp**`, para avanzar el formulario.
- El modo `cap` usa `contextoCap` (`scripts/cap/capMesa.mjs:117-167`):
  - una sesión falsa en `localStorage` (`sb-<ref>-auth-token`);
  - **una sola ruta `**/*`**: lo local pasa, el host de Supabase se contesta en la ruta (`profiles` → perfil falso, `rpc/*` → `null`, `auth/v1/user` y `token`) y todo lo demás se corta y se anota (puerta `cap.red`);
  - el host sale de `VITE_SUPABASE_URL` en `.env.local`.

### F2. Patrón de un modo permanente `dis` (solo la descripción)

Mismo molde que `capvis`: contextos en paralelo, sin escribir nada y dentro de `todo`.

**Viewports:**
- los cinco de la ficha: 1920, S25 v 360×704 @3, 390×844, 360×640, y S25 h, donde se afirma que la escena **no existe**;
- 901×1000, que vigila la franja donde hoy se sale la base;
- **las mismas celdas en WebKit**, `webkit.launch()` de playwright-core. En WebKit, el `load` llega **antes** de que React monte: hay que esperar a `waitForSelector('.pue-escenario')`. La sonda falló así la primera vez.

**Llegada:** `esperarEscena(4)` + imágenes decodificadas. Medición a +1,3 s (escritorio y teléfono) y +3,3 s (laptop en móvil).

**Puertas propuestas:**

| Puerta | Qué comprueba |
|---|---|
| `dis.caja` | caja del render (su `<img>`) igual a la sellada para cada viewport (± 0,5 px CSS) y dentro del viewport: izquierda ≥ 0, derecha ≤ ancho. La 901 de hoy saldría roja |
| `dis.holgura` | ≥ 10 px entre la **silueta opaca** del render (su caja por alfa, sellada en el JSON del render, no la caja del `<img>`, que incluye márgenes transparentes y sombra) y la frase y el lema |
| `dis.homografia` | las 4 esquinas de la captura transformada (la matriz computada del elemento aplicada a los vértices de su caja local, en coordenadas de página) coinciden con las esquinas del hueco del render (JSON de Blender escalado a la caja del render), con tolerancia ≤ 0,5 px CSS. Opcional: sonda de píxel en cada esquina, dentro frente a fuera, como las de `mon` |
| `dis.visible` | fracción de la captura que se ve, **medida en el plano de la pantalla** (tamaño natural frente a caja local antes de la matriz), no en la caja gBCR. Esto corrige de paso el sesgo de `capvis` con el giro (B4) |
| `dis.relevo` | con la línea de tiempo de opacidades: escritorio, los dos a opacidad 1 antes de 1,0 s; móvil, teléfono a 1 en ≤ 0,6 s y a 0 en ≤ 2,5 s, laptop a 1 en ≤ 2,7 s, y solape < 0,3 s |
| `dis.perezoso` | los renders se piden a ≥ 2 400 ms (ampliar la expresión de `1.8a` o reutilizarla) y, si el rector lo decide (K-6), **no** se piden con la escena oculta ni con quietud |
| `dis.quietud` | con `reducedMotion: 'reduce'`, el comportamiento que selle el rector |
| `dis.alfa` | la sonda de «fondo único» de `mon`: un píxel fuera de la silueta del aparato es igual con y sin el `<img>`, para que no aparezca un rectángulo |
| `dis.webkit` | las cajas de WebKit iguales a las de Edge (± 1 px). Hoy saldría roja (B2 / I-1) |
| `dis.errores` | 0 errores de página y de consola |

**Datos sellados que el modo leería:** el JSON de esquinas y silueta que emita el script de Blender (E3), versionado junto a las maestras de render, y nunca un número a mano.

### F3. WebKit

**Instalado.** `%LOCALAPPDATA%\ms-playwright\webkit-2336\` con `INSTALLATION_COMPLETE` y `DEPENDENCIES_VALIDATED`. Coincide con `playwright-core/browsers.json` (webkit rev. **2336**, versión **26.5**). Se lanzó con éxito: Portada pintada, escena 5 medida en 1920 y 390×844. No se instaló nada.

### F4. Transformaciones actuales

Búsqueda con `grep` en `portada.css`, `puerta.css`, `entrada.css`, `Wordmark` y `FormularioPuerta`, y de homografía en `src/`, `scripts/` y `laminas/`.

**`perspective`:**
- `portada.css:138`: `perspective: 900px` en **`.pue-escenario`**, el contenedor de las cinco escenas, **incluida la 5**;
- `:278`: `perspective: 800px` en `.pue-carta` (escena 2).

**`transform-style: preserve-3d`** (`:287`) y `backface-visibility` (`:301-302`): solo en el volteo de las cartas de la escena 2.

**`filter`:**
- `drop-shadow` en `.pue-abanico img` (`:181`), `.pue-carta` (`:279`), `.pue-trio img` (`:382`) y `.pue-moneda` (`:424`, desconectada);
- `brightness(1.08)` en `.puerta-btn:hover` (`puerta.css:195`).

Ninguno en la escena 5.

**`matrix3d` y `will-change`:** **ningún uso.**

**Homografía:** **no existe código.** La única coincidencia es `diagDSK.mjs:3926`, que comprueba que un `transform` no contiene `matrix3d` en los volteos de cartas de la mesa.

**Riesgo:** el `perspective: 900px` de `.pue-escenario` es ancestro de la escena 5. Según la especificación, solo afecta a hijos con transformación 3D y a descendientes unidos por `preserve-3d`. `.pue-esc` y `.pue-duo` no llevan `preserve-3d`, así que una `matrix3d` en un nieto **no debería** heredar esa perspectiva. No se ha comprobado; entra en la lista de verificación de Edge y WebKit (I-4).

---

## G · Blender en esta máquina

Todo se lanzó con la ruta completa, en modo fondo (`-b --factory-startup`), escribiendo solo en `C:\Users\victo\AppData\Local\Temp\dis1-sonda\`.

### G1. Instalación

- **Ejecutable:** `C:\Program Files\Blender Foundation\Blender 4.5\blender.exe` (junto a `blender-launcher.exe`).
- **`PATH`: no.** `which blender` y `where.exe blender` no lo encuentran; se llama por ruta completa, entre comillas.
- **`blender --version`:** `Blender 4.5.10 LTS`, fecha de compilación 2026-05-19, hash `6dc0b208d1b5`, rama `blender-v4.5-release`, plataforma Windows. Tarda 0,6 s.
- **Python interno:** **3.11.11** (MSC v.1929, 64 bits).

### G2. Motores y aceleración

- **`bpy.app.version`:** `(4, 5, 10)`, «4.5.10 LTS».
- **Valores válidos de `scene.render.engine`**, comprobados fijándolos uno a uno:
  - `BLENDER_EEVEE_NEXT`
  - `BLENDER_WORKBENCH`
  - `CYCLES`

  `BLENDER_EEVEE`, el nombre anterior a 4.2, **no se acepta**. La lista estática de la RNA solo enseña `BLENDER_EEVEE_NEXT`; el resto se registra en caliente.
- **Tipos de dispositivo de Cycles disponibles:** `NONE`, `CUDA`, `OPTIX`, `HIP` y `ONEAPI`. `METAL` no existe en Windows.
- **Dispositivos detectados con cada tipo:** solo `('Intel Core i9-14900K', 'CPU')`. **Ninguna GPU para Cycles.**
  - El hardware (`Win32_VideoController`) es una **Intel UHD Graphics 770** integrada, con el controlador 32.0.101.7084. OneAPI de Cycles solo admite Intel Arc, no Xe-LP.
  - CPU: i9-14900K, 24 núcleos y 32 hilos; RAM de 63,7 GB.
- **EEVEE** sí pinta en modo fondo, sobre la gráfica integrada, pero el módulo `gpu` de Python **no está disponible con `-b`**: no se puede leer el nombre del *renderer* desde el script.
- **Valores por defecto de la escena de fábrica:** Cycles 4 096 muestras con OIDN; EEVEE `taa_render_samples` 64.

### G3. Render de prueba

Escena de fábrica, 1024×1024, `film_transparent = True`, PNG RGBA de 8 bits.

| Motor | Ajuste | Render | Proceso completo | PNG | Alfa | Método |
|---|---|---|---|---|---|---|
| Cycles CPU | 32 muestras, OIDN por defecto | **1,87 s** (1,77 s según el log de Cycles) | 2,32 s | 1024×1024, 8 bits, colortype 6 (RGBA), 325 449 B | esquinas `[0,0,0,0]`; el 89,4 % de los píxeles con alfa 0 | `time.perf_counter()` alrededor de `bpy.ops.render.render(write_still=True)`; proceso cronometrado con `spawnSync` de Node; IHDR leída en crudo; alfa leída con `bpy.data.images.load().pixels` |
| Cycles GPU | — | **no se hizo**: no hay GPU compatible | — | — | — | G2 |
| EEVEE (Next) | 64 muestras de TAA | **3,28 s** | 3,74 s | 1024×1024, RGBA, 297 066 B | esquinas `[0,0,0,0]`; 89,4 % con alfa 0 | ídem |
| Cycles CPU (extra) | 1600×1000, 128 muestras, **PNG de 16 bits** | **4,40 s** (32 hilos) | — | 1600×1000, 16 bits, colortype 6, 939 706 B | — | ídem |

**Extra para el script del rector:** `bpy_extras.object_utils.world_to_camera_view` funciona en modo fondo y da las esquinas proyectadas de un plano en píxeles de la imagen. Probado con la cara superior del cubo a 1600×1000: `[[508.82, 300.48], [788.44, 424.11], [1089.95, 306.77], [806.23, 208.37]]`. Es la pieza que el script necesita para exportar las **4 esquinas del hueco de pantalla** que alimentan la `matrix3d`.

La escena de prueba es trivial. Unos aparatos con materiales metálicos y pantalla a 2–4 K con 256+ muestras tardarán minutos por fotograma en CPU. Para fotos fijas es asumible; para el video futuro, pesa.

### G4. Problemas al lanzar Blender desde mi terminal

- **Sin bloqueos:** ni permisos, ni antivirus, ni avisos de SmartScreen. `%TEMP%` está fuera de OneDrive y no hubo interferencia.
- **Ruta con espacios:** obliga a entrecomillar el ejecutable. Desde Git Bash, los argumentos `--python` y de salida se pasaron como **rutas Windows** (`cygpath -w`).
- **Git Bash no trae `/usr/bin/time` ni `bc`.** La primera tanda de G3 no imprimió nada por eso: el filtro se tragó el error. Se cronometró con Node (`child_process.spawnSync`), que es lo recomendable para los scripts de las fases siguientes.
- **El módulo `gpu` no se puede usar con `-b`** (`SystemError: GPU functions for drawing are not available in background mode`). Solo afecta a consultas de diagnóstico, no al render.
- Hay que usar el identificador `BLENDER_EEVEE_NEXT`; el antiguo `BLENDER_EEVEE` falla en 4.5.

---

## H · Repositorio y protegidos

### H1. Git

- **Rama:** `main`.
- **`HEAD`:** `59fa46d2040e43943489b5eda38841b005b743b5`.
- **`git fetch`:** limpio. `origin/main` = `59fa46d…`, y `git rev-list --left-right --count HEAD...origin/main` da **0 / 0**.
- **`git status --porcelain`** al empezar: solo los residuos conocidos.

  ```
  ?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md          ← residuo conocido (MOT-1)
  ?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md  ← residuo conocido (MOT-1)
  ?? laminas/mon1/_entorno.txt                                  ← residuo conocido
  ?? laminas/mon1/lamina.html                                   ← residuo conocido
  ?? laminas/mon1/tiempos.json                                  ← residuo conocido
  ?? scripts/_cel1bFila.mjs                                     ← residuo conocido
  ```

- **Al terminar** se añaden solo los dos elementos de esta tanda: `docs/reportes/dis1-fase0/` y este informe.
- **Sin otros cambios.** `dist/` (reconstruido) y `capturas-pue/` (reescrito por `diagPUE`) están ignorados en `.gitignore:19` y `:97`.

### H2. Línea base

| Prueba | Resultado |
|---|---|
| `npm run build` | limpio; aviso habitual de *chunk* > 500 kB |
| `npx vitest run` | **37 archivos · 1056/1056** |
| `npx eslint .` | **21 problemas (20 errores y 1 aviso)**, la línea base de REC-2 |
| `node scripts/diagPUE.mjs` (todo, contra 4173) | **122 verdes y 1 rojo:** `1.8b` 219,4 KiB frente a 200, rojo conocido. `capvis` verde con las mismas cifras que CAP-1; `1.8a` verde (capturas a 2 607 ms) |

### H3. Protegidos

Lista canónica: `docs/AJILEI_Protegidos_v1.0.md` v1.5, seis archivos.
1. `gameEngine.js`
2. `aiPlayer.js`
3. `deck.js`
4. `seatLayouts.js`
5. `opponentPanel.css`
6. `gameTable.css`

**Archivos de B, C, D y F**, cruzados con la lista:
- `src/screens/Portada.jsx`
- `src/styles/portada.css`
- `src/App.jsx` (solo `grep`)
- `scripts/gen-portada-assets.mjs`
- `scripts/diagPUE.mjs`
- `scripts/cap/capMesa.mjs`
- `public/_headers`
- `index.html` (solo `grep`)
- `maestras/portada/*`
- `docs/AJILEI_Sistema_Diseno_v1.2.md`

**Ninguno es protegido.** No se abrió ningún protegido. La escena 5 no importa ni depende de ninguno.

Nota menor: `portada.css:209-210` llama a `gameTable.css` «fila 5» de la lista; en la v1.5 es la fila 6. Es un comentario viejo y no se toca.

### H4. Sistema de Diseño

**Versión vigente:** el archivo se llama `docs/AJILEI_Sistema_Diseno_v1.2.md`, pero su cabecera dice **«Versión: 1.3»** (ICO-1, 2026-08-26). Lleva además adendas sin cambio de versión:
- §12, DOC-2b, 2026-09-05;
- la adenda 5, MON-2.1;
- la nota de IDX-1 D-14, «cerrado por CAP-1»;
- la adenda 7, LUZ-1, 2026-09-25.

**Regla sobre la escena 5 o sobre los aparatos: no hay ninguna.** Lo más cercano:
- **§5, reglas de animación:** «solo `transform` y `opacity`». Una `matrix3d` es `transform` y cumple.
- **§6.2:** decorativos en `position: absolute`, fuera del flujo.
- **Adenda 5 (MON-2.1):** la moneda no se descarga donde la escena no existe ni con quietud, y los assets pesados van a `src/assets/` para llevar hash. Es el precedente directo de E3 y K-6.
- **El precedente de la sombra de contacto horneada** vive en `Portada.jsx:80-98` (MON-2): «La sombra de contacto viene del render (shadow catcher), no de CSS».

---

## I · Observaciones y riesgos

1. **WebKit rompe hoy los aparatos planos.**
   - **Qué pasa:** `.pue-telefono` y `.pue-laptop` son absolutos sin ancho, y su ancho sale de un hijo con `aspect-ratio` y alto en %. WebKit 26.5 resuelve ese ancho distinto que Chromium:
     - **móvil 390×844:** marco del teléfono de **160 px de ancho frente a 84** en Edge, con la pantalla a la izquierda (`dis1-fase0/webkit_390x844_telefono.jpg` frente a `edge_390x844_telefono.jpg`);
     - **1920:** conjunto de la laptop de **374,3 px frente a 344,9**, con la tapa desplazada 14,6 px y la base de 434 frente a 400 (`webkit_1920x1080_escena5.jpg`).
   - **Alcance:** es WebKit de Playwright en Windows. Que Safari iOS lo haga igual es muy probable (el mismo motor de maquetación), pero no se ha comprobado en un iPhone.
   - **Consecuencia para DIS-1:** los renders deben ir en cajas con **ancho y alto explícitos**, o un `aspect-ratio` sobre un elemento con ancho definido, nunca con el ancho deducido de un hijo.
2. **El hueco de la laptop cambia de proporción** con el tamaño (1,869–1,977) por el bisel de píxeles fijos. Con un render, el hueco lo fija el render. La vara `capvis` de la laptop (≥ 91 / ≥ 89 %) deja de tener sentido tal cual.
3. **`capvis` subestima el teléfono unos 7 puntos** (91,16 % frente al 98,13 % real) porque mide la envolvente del giro (B4). CAP-1 Fase 0 arrastró la misma lectura («caja 0,539»). No es un rojo oculto: el sesgo va hacia el lado seguro.
4. **`perspective: 900px` en `.pue-escenario`** es ancestro de la escena 5 (F4). En teoría no afecta a una `matrix3d` en un nieto sin `preserve-3d`. Hay que comprobarlo en Edge y WebKit antes de sellar la homografía.
5. **La base de la laptop se sale del viewport a 901 px** (−7,9 px) y el lienzo la recorta (B5). Un render más ancho que la tapa, como una base en perspectiva, lo agravaría en la franja 901…~1000.
6. **Los aparatos se apagan de golpe** al acabar la escena (C2): el fundido de 0,7 s del contenedor no se ve. Con renders, el salto será más visible.
7. **Descargas que nunca se enseñan:** las capturas (y, con DIS-1, los renders) se piden en teléfono horizontal y con movimiento reducido, además de la laptop 17 s antes de su turno en móvil (C3). Hoy son 66 KB; con renders con alfa, previsiblemente varias veces más.
8. **Con quietud**, la escena 5 no se ve nunca. Si el rector quisiera enseñarla, la regla de `:948-968` no repone la opacidad de los aparatos.
9. **El teléfono va girado −3° en 2D.** Si la pose del render ya trae perspectiva, el giro CSS sumaría una rotación en el plano de la pantalla. Es la decisión de pose del rector.
10. **Sin GPU para Cycles.** Todos los renders serán en CPU. Es suficiente para fotos fijas; la estimación para el video queda abierta.
11. **Acoplamientos del arnés con el DOM y los nombres actuales:**
    - `capvis`: `.pue-pantalla img` y `.pue-laptop-pantalla img`;
    - `1.8a`: `mesapc|mesav`;
    - `1.3a`: la tinta son los `img`.

    DIS-1 cambia el DOM de la escena, así que los tres hay que migrarlos a la vez que el modo `dis`.
12. **`capvis` usa el S25 a 360×780 y la ficha pide 360×704** (el standalone real). Las cajas de la escena 5 son idénticas en ambos (el escenario mide 150 px en los dos); solo cambia su `y` (38,4 px). Para DIS-1, 360×704 es el que manda.
13. **Tabletas en vertical** (768×1024) usan el relevo móvil, con `.pue-duo` a 320 px de ancho dentro de un escenario de 720. La escena se ve pequeña en tableta; no es un defecto, pero es un caso que el rector puede querer mirar.

---

## J · Datos para Blender

Datos medidos (Edge 154, `vite preview`). La pose, el tamaño final y la composición los decide el rector. Todo en px CSS salvo que se indique otra cosa.

### J1. Proporción exacta de la pantalla

| Aparato | Para ver el 100 % de la captura | Referencias |
|---|---|---|
| **Laptop** | **1,7786** (2732:1536 = 683:384, la maestra `mesapc.png` entera, sin recorte; el derivado de 820×461 es 1,7787). 16:9 exacto (1,7778) recorta el 0,02 %: indistinguible | hueco de hoy: 1,869–1,977, que enseña el 90–95 % |
| **Teléfono** | **0,4914** (1026:2088 = 171:348, la caja dorada de `mesav.png`; el derivado de 340×692 es 0,4913) | hueco de hoy: 0,5007 (enseña el 98,1 %). Maestra entera con el margen de tapete: 0,5114 (1080:2112). Pantalla real del S25: 1080:2340 = 0,4615 (exigiría recortar los lados de la captura, o una captura nueva, que la decisión 3 descarta) |

**Radios del hueco hoy:** teléfono **19 px** con un ancho de 124 a 1920 (15,3 % del ancho); laptop **6 px** con 329 a 1920 (1,8 %).

### J2. Caja objetivo de hoy en cada viewport

Es lo que el render sustituiría con el tamaño actual. «Sobre» es el espacio disponible entre el lema de arriba y la frase de abajo, antes de restar los 10 px de holgura.

| Viewport | Laptop: conjunto (tapa + base) | Laptop: hueco | Teléfono: marco sin girar (centro) | Teléfono: hueco sin girar | Sobre vertical disponible | Ancho utilizable |
|---|---|---|---|---|---|---|
| **1920×1080 @1** | 400,0 × 204,0 (base 381,5…781,5; tapa 409,1…754,0 × 564,3…758,3) | 328,9 × 176,0 | 140 × 264 en (861,5 · 636,3), −3° | 124,2 × 248,0 | 431,1…796,3 = **365,2** | columna del héroe 340…1011,6 (672); la tarjeta empieza en 1083,6 |
| **S25 v 360×704 @3** | 251,6 × 132,0 (54,2…305,8 × 320,2…452,2) | 200,9 × 104,0 | 83 × 150 en (180 · 377,2), −3° | 67,1 × 134,0 | 280,1…480,2 = **200,1** | 0…360; recorte del lienzo en el borde |
| **390×844 @3** | 255,0 × 133,7 (67,5…322,5 × 390,2…523,9) | 203,9 × 105,7 | 84 × 152 en (195 · 447,9), −3° | 68,0 × 135,9 | 344,2…551,9 = **207,7** | 0…390 |
| **360×640 @3** | 202,6 × 108,2 (78,7…281,3 × 288,2…396,4) | 158,6 × 80,2 | 74 × 132 en (180 · 330,4), −3° | 58,1 × 116,0 | 250,4…418,4 = **168,0** | 0…360 |
| **S25 h 780×360 / 704×360** | — escena inexistente | — | — | — | — | — |

Otros viewports, en B3 (tabla de contexto): 1366×768, 1440×850, 901×1000 y 768×1024.

### J3. Resolución de salida necesaria

Es la caja CSS × DPR. El render maestro debería superarla con margen para el video.

| Aparato | Máximo medido | Otras medidas | Mínimo razonable del derivado web | Densidad de la captura hoy |
|---|---|---|---|---|
| **Laptop** (conjunto, ancho) | **765 px de dispositivo** (255 CSS × 3 a 390×844) | S25: 755; 768×1024 @2: 628; 1440×850 @2: 626; 1920 @1: 400 | unos 800 px de ancho | `mesapc` de 820 px en un hueco de 329 CSS @1 (2,5×) o 204 CSS @3 (612 px de dispositivo), suficiente |
| **Teléfono** (marco, alto) | **456 px de dispositivo** (152 × 3 a 390×844) | S25: 450; 1440×850 @2: 418; 768×1024 @2: 368; 1920 @1: 264 | unos 480 px de alto | `mesav` de 692 px de alto en un hueco de 248 CSS @1 o 134 CSS @3 (402 de dispositivo), suficiente |

Esto sin contar la sombra y la perspectiva, que agrandan el lienzo del render.

### J4. Composición en escritorio

- La laptop y el teléfono conviven, con `z-index: 2` para el teléfono.
- A 1920 hay **3,1 px** entre el borde derecho de la base (781,5) y la envolvente del teléfono (784,6), y 30,6 px desde la tapa (754,0).
- El centro de la tinta de los `img` está desplazado **2,22 px** respecto del eje de la frase (`1.3a`, vara ≤ 4).

---

## K · Preguntas al rector

1. **Proporción de la pantalla del teléfono en el modelo:** 0,4914, para ver el 100 % de la captura. ¿O 0,5007, la de hoy, con el 98,1 % visible? ¿O la del S25 real (0,4615), que obligaría a recortar los lados?
2. **Proporción de la laptop:** ¿16:9 exacto, 1,7778, que recorta el 0,02 %?
3. **Tamaño en pantalla:** ¿los aparatos conservan las cajas de hoy (J2)? ¿O pueden crecer dentro del sobre vertical, con un margen de ≥ 10 px con la frase y el lema? En móvil el aire de arriba es corto (12–26 px).
4. **Capas:** ¿la captura va **debajo** de un render con el hueco transparente, de modo que el bisel del render recorta las esquinas redondeadas? ¿O **encima** de un render con pantalla opaca, con `border-radius` o máscara en la captura transformada?
5. **Formato de las esquinas:** ¿el script de Blender emite un JSON con las 4 esquinas del hueco y la caja opaca de la silueta, y el generador lo convierte en **constantes** (CSS o JSON importado) para no añadir JS al camino crítico (E2)?
6. **Descargas:** ¿los renders y las capturas de la escena 5 adoptan la política de MON-2.1 (no pedir con la escena oculta ni con quietud)? ¿Y la laptop se pide solo en su turno en móvil?
7. **Salida a golpe (C2 / I-6):** ¿se deja o se corrige, para que los aparatos salgan con el fundido del contenedor?
8. **Movimiento reducido:** ¿se mantiene que la escena 5 no se vea nunca?
9. **Giro de −3° del teléfono:** ¿se hornea en la pose del render, se conserva en CSS o se elimina?
10. **Franja 901…~1000 px:** ¿se exige en DIS-1 que el conjunto quepa en el viewport (hoy se sale 7,9 px)?
11. **WebKit:** ¿`dis.webkit` (cajas de WebKit iguales a las de Edge) es una puerta roja de DIS-1? Hoy fallaría con los aparatos planos.
12. **Ubicación:** ¿derivados en `src/assets/portada/` y maestras de render (PNG de 16 bits con alfa, `.blend` y JSON de esquinas) en `maestras/dis1/`? ¿Se versionan los `.blend` o solo sus salidas?
13. **Resolución maestra:** ¿se renderiza una sola vez a resolución de video (por ejemplo, 4 K) y se deriva la web (unos 800 px de laptop y 480 px de alto de teléfono), o dos tandas distintas? Sin GPU, cada fotograma de alta resolución cuesta minutos de CPU.
14. **`capvis`:** ¿se retira al entrar `dis`, o se corrige antes su medida del teléfono (la envolvente del giro)?

---

## L · Tiempo real

- **Inicio:** 15:35 (primer comando).
- **Fin:** 15:56, al cerrar este informe.
- **Total:** unos **21 minutos de reloj**, dentro del tope de 90.
- **Blender (G):** unos 5 minutos en total, repartidos (15:38–15:41 y 15:49). No se atascó.
- **Lo más largo:**
  - la sonda de navegador: 11 viewports en paralelo, más quietud, más WebKit, unos 65 s por pasada;
  - `diagPUE` completo, que corrió en segundo plano mientras se leía el Sistema de Diseño y los protegidos;
  - el diagnóstico de WebKit (el `load` antes del montaje de React).

STOP · Fase 0 completa · sin commits · a la espera de Victor
