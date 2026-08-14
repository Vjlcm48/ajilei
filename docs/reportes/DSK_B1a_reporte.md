# DSK-B1 · Fase a — Micro-diagnóstico del overflow vertical (mesa 5)

**Read-only.** Ningún archivo de `src/` modificado. Medición: `node scripts/diagDSK.mjs b1` (subcomando nuevo) + `diag_b1.json`. Estado medido: WAITING (determinista) y con mano iniciada (idénticos en las filas fijas). STOP antes de implementar.

> **Corrección de encuadre:** Fase 0 reportó "−27px @1280×720". Ese 27 es **solo la mitad inferior** (scrollable) del desborde. El contenedor **centra** el sobrante, así que otro ~27 se pierde recortado arriba. **El exceso vertical REAL a eliminar en 1280×720 es ~54px**, no 27.

---

## 1. Presupuesto vertical por viewport

Stack de la columna central: `screen(pad)` → `game-table(border+pad+gaps)` → `header` → `table-mid(rivals + gap + óvalo)` → `player-zone`. El **óvalo (`.center-zone`) es `flex:1` elástico** → absorbe holgura; en overflow queda en su mínimo de contenido.

| Fila / envoltura | 1024×768 | 1280×720 | 1366×768 | 1920×937 |
|---|--:|--:|--:|--:|
| screen padding (16+16) | 32 | 32 | 32 | 32 |
| game-table border (2+2) | 4 | 4 | 4 | 4 |
| game-table padding (16+18) | 34 | 34 | 34 | 34 |
| game-table gaps (2×10) | 20 | 20 | 20 | 20 |
| header | 32 | 32 | 32 | 32 |
| **rivals-zone** (panel más alto) | **199.09** | **201.98** | **201.98** | 215.19 |
| table-mid gap (rivals↔óvalo) | 10 | 10 | 10 | 10 |
| **center-zone / óvalo** (mín. elástico) | **160.91** | **163.77** | **163.77** | 214.81 |
| player-zone (pad + score + cards + bar) | 276 | 276 | 276 | 300 |
| **DEMANDA TOTAL** | **768.00** | **773.75** | **773.75** | **862.00** |
| viewport (dvh) | 768 | 720 | 768 | 937 |
| **EXCESO real** | **0** ✓ | **+53.75** ⛔ | **+5.75** ⛔ | **−75** ✓ |
| overflow medido (scroll, mitad inf.) | 0 | 27 | 3 | 0 |
| recorte superior (mitad sup.) | 0 | ~26.9 | ~2.9 | 0 |

`game-table.h` medido = 736 / 741.75 / 741.75 / 830 (= DEMANDA − 32 de screen padding). Confirmado.

**Descomposición del `player-zone` (276):** padding 24 + `score-tag-player` 18 (+mb 8) + `cards-row` 132 + `player-bar` 84 (`.action-area height:84` + mt 8). A 1920 sube a 300 (cards-row 156 por escalón @900).

---

## 2. Declaraciones culpables

### 2.a Driver de la dependencia de ANCHO (raíz del misterio 1024↔1366)

| Archivo:línea | Selector | Valor | Tipo | Efecto |
|---|---|---|---|---|
| `src/index.css:18` | `:root` | `font: 18px/145% var(--sans)` | font + line-height heredados | line-box heredada = **26.1px** con font 18 |
| `src/index.css:28-30` | `:root @media (max-width:1024px)` | `font-size: 16px` | toggle por ANCHO | ≤1024px → font 16 → line-box **23.2px** |

Resto de plantilla Vite (`#root{width:1126px}`, `--accent` morado, botones sociales) — **artefacto del starter, ajeno al diseño del juego**. Este `font-size` por ancho es lo que acopla **ancho → font → line-height heredada → presupuesto vertical**. Medido en el panel IA (mismo ancho 180px en ambos): `.opp-topline` line-height 23.2px @1024 vs 26.1px @1366. Inflación por fila de texto ≈ +2.9px; sumada en rivals-zone (+2.89) y óvalo (+2.86) = **+5.75px** exactos (= el exceso de 1366×768).

### 2.b Contribuyentes fijos base (presentes a 1280/1366 — NO del escalón @900)

| Archivo:línea | Selector | Valor | Tipo |
|---|---|---|---|
| `gameTable.css:15` | `.game-table-screen` | `padding: 16px 20px` | padding (32 vert) |
| `gameTable.css:30` | `.game-table` | `padding: 16px 24px 18px` | padding (34 vert) |
| `gameTable.css:33` | `.game-table` | `gap: 10px` | gap (20 = 2×) |
| `gameTable.css:23` | `.game-table` | `border: 2px` | border (4) |
| `gameTable.css:21` | `.game-table` | `min-height: min(780px,100%)` | min-height (no vinculante: contenido más alto) |
| `gameTable.css:719` | `.table-mid` | `gap: 10px` | gap rivals↔óvalo (10) |
| `gameTable.css:227` | `.player-zone` | `padding: 12px 18px` | padding (24 vert) |
| `gameTable.css:302` | `.action-area` | `height: 84px` | **height fija** (mayor banda fija del pie) |
| `gameTable.css:189` | `.game-message` | `height: 54px` | height fija (fila mín. del óvalo) |
| `gameTable.css:237` | `.cards-row` | `padding: 4px 0 6px` | padding (10) |
| `opponentPanel.css:19` | `.opp-panel` | `min-height: 150px` | no vinculante (contenido ~195-204) |
| `theme.css:53` | `:root` | `--card-h: 118px` | height fija de carta (→ cards-row 132) |

### 2.c Escalón @min-height:900 — **CONFIRMADO fuera de alcance a 720/768**

`theme.css:70` y `gameTable.css:932` (`@media (min-width:768px) and (min-height:900px)`): medido `mqTall=false` en 1280/1366 → NO aplica. Prueba: card 76px (no 91), `cards-row` 132 (no 156), `player-zone` 276 (no 300), `game-table min-height` `min(780px,100%)` (no 830). **El escalón solo agranda 1920** (que tiene el alto para ello). El overflow de 720/768 ocurre con las medidas *pequeñas* (escalón apagado) — el escalón no es culpable.

---

## 3. Mecánica del recorte superior

**Nodo que recorta:** `.game-table-screen` (el scroller, `overflow-y:auto`).
**Causa:** `gameTable.css:12-15` — `display:flex; align-items:center; justify-content:center`. Con un único hijo (`.game-table`) más alto que la caja de contenido del scroller, `align-items:center` **reparte el sobrante simétrico**: la mitad superior cae a offset **negativo** (por encima del origen de scroll → inalcanzable → recorte visual); la mitad inferior queda scrollable.

**Prueba medida (1280×720):** `game-table.top = −10.87px` (borde de la mesa 10.87px sobre el borde del viewport; **26.87px sobre el tope de la caja de contenido** en y=16). Simétrico con el scroll inferior de 27. `scrollHeight` solo cuenta la mitad inferior → overflow 27. A 1366×768: `top=+13.13` (2.87 sobre el tope de contenido) ↔ scroll 3.

**Contraste:** el bloque portrait ya usa `align-items: safe center` (memoria O1) precisamente para evitar este recorte. **El escritorio base sigue en `center` plano** → hereda el bug del recorte superior.

---

## 4. Verificación 1024×768 (limpio pese a compartir alto con 1366)

**Confirmado limpio: overflow 0.** No es porque 768px basten intrínsecamente (1366 tiene el mismo alto y desborda), sino porque **1024 ≤ 1024px de ancho dispara `index.css:29` → root font 16px** → line-heights heredadas caen a 23.2px → filas de texto (line-box de `.opp-cards`, `POZO`/número de `.pot-box`, `.call-box`, `.comodin-note`) se encogen → columna central = **736 = 768 − 32 (screen pad) exacto**. 1366, con ancho >1024, usa font 18 → +5.75 → desborda. **Ese "algo dependiente de ancho que entra en el presupuesto vertical" es la media query de `font-size` de index.css.**

---

## 5. Margen de maniobra (aire comprimible)

Peor caso a absorber: **~54px (1280×720)**; 1366×768 basta con **~5.75px**; 1024/1920 nada. Menú de holgura reclamable **dentro del bloque DSK** (sin tocar anclajes críticos):

| Fuente | Decl | Actual (vert) | → | Ahorro |
|---|---|--:|--:|--:|
| screen padding | `:15` | 32 | 16 | **16** |
| game-table padding-bottom | `:30` | 18 | 12 | 6 |
| game-table gap ×2 | `:33` | 20 | 12 | 8 |
| table-mid gap | `:719` | 10 | 6 | 4 |
| player-zone padding | `:227` | 24 | 16 | 8 |
| cards-row padding | `:237` | 10 | 4 | 6 |
| font 18→16 (line-heights) | `idx:18` | — | — | ~5.75 |
| action-area (banda ancla) | `:302` | 84 | 74 | 10 |
| game-message (ancla óvalo) | `:189` | 54 | 46 | 8 |
| **Total disponible** | | | | **~72** |

72px disponibles > 54px del peor caso → holgura de sobra para diseñar el reparto.

---

## 6. Estrategias propuestas (sin implementar)

**Restricción común:** todo vive en el bloque DSK bajo sub-media de altura `and (max-height: 800px)` → **1920×937 (937 > 800) queda matemáticamente fuera** → diff-cero por construcción. Sin `!important`; overrides ganan por orden de fuente (gameTable.css se importa después de index.css → el bloque DSK, al final del archivo, es lo último) + especificidad ≥. **Vehículo del font-fix recomendado:** `.game-table-screen { font-size: 16px }` (scopeado, re-hereda hacia abajo con line-height 145% recomputada a 23.2px) — evita pelear la especificidad global de `:root`.

### Estrategia 1 — Neutralización + cromo mínimo  *(recomendada)*
Overrides en `@media (orientation:landscape) and (min-height:601px) and (max-height:800px)`:
- `.game-table-screen { font-size:16px; padding-block:8px }` → −5.75 (line-heights) −16 (pad)
- `.game-table { padding-bottom:12px; gap:6px }` → −6 −8
- `.player-zone { padding-block:8px }` → −8
- `.cards-row { padding:2px 0 }` → −6

**Recupera ≈ 55px** (por partida: font 5.75 en rivals+óvalo, screen 16, game-table 14, player 8, cards 6). Cubre 1280 (54) y 1366 (5.75). **Riesgo bajo-medio:** solo densidad en desktops cortos; no toca la ley de anclaje ni el mensaje.

### Estrategia 2 — Solo raíz + trim mínimo  *(la más conservadora)*
- `.game-table-screen { font-size:16px; padding-block:8px }` + `.game-table { gap:6px }`
**Recupera ≈ 30px.** Resuelve 1366 por completo; **1280 queda ~24px corto** (seguiría con scroll, aunque sin recorte si se añade `align-items:safe center`). **Riesgo mínimo**, pero **insuficiente para 1280×720**.

### Estrategia 3 — Compresión de bandas ancla  *(la más agresiva, menos declaraciones)*
- `.game-table-screen { font-size:16px; padding-block:8px }` + `.game-table { gap:6px }` + `.action-area { height:72px }` + `.game-message { height:44px }`
**Recupera ≈ 52px + font.** Cubre 1280 con pocas reglas. **Riesgo alto:** toca la **banda ancla** `.action-area` (layout de 2 filas de la fase de apuesta) y la **altura ancla** del mensaje — exige re-verificar que ninguna fase (apostar/descartar/pensando) refluya ni recorte botones.

### Complemento transversal (cualquier estrategia)
`.game-table-screen { align-items: safe center }` en el bloque DSK — convierte el recorte superior en scroll alcanzable (mata el síntoma "borde recortado" aunque quede holgura residual). Costo casi nulo, riesgo ~cero; espeja el fix ya aprobado en portrait.

---

## STOP

Fin de fase a (read-only). **No se implementa nada hasta tu aprobación de estrategia.** Mi recomendación: **Estrategia 1 + complemento `safe center`** — cubre el peor caso con margen, no toca anclajes, y el `safe center` da red de seguridad. A la espera de tu elección para pasar a fase b.
