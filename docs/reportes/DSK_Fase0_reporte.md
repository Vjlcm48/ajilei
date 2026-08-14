# DSK · Fase 0 — Diagnóstico read-only (mesa 5)

**Alcance:** escritorio (DSK). Viewport de referencia **1920×937**; matriz 1024×768, 1280×720, 1366×768, 1920×937.
**Invariantes cumplidos:** ningún archivo de `src/` modificado · sin commits · único script nuevo untracked `scripts/diagDSK.mjs` (reutilizable en toda la campaña) · dev server preexistente en `:5173`.
**Método:** Edge headless vía `playwright-core` (`channel: 'msedge'`), auto-juego de manos mesa 5, medición con `getBoundingClientRect` + `Range.getBoundingClientRect` (texto) + `getComputedStyle` + `matchMedia`. Datos crudos en `capturas-dsk/diag_*.json`.
**Naturaleza:** solo hallazgos medidos. Cero recomendaciones de implementación (Fase 1+).

---

## D1 — Gates y estructura

### 1. Condiciones de orientación (transcripción literal)

Los hooks de React que deciden **qué componente monta** (el CSS no puede):

```js
// src/components/GameTable.jsx:46
const LANDSCAPE_TABLE_MQ = '(orientation: landscape) and (max-height: 600px)'
// :52
const PORTRAIT_TABLE_MQ  = '(max-width: 767px) and (orientation: portrait)'
// :64-79
function useMediaQueryMatch(query) { /* useState(matchMedia(query).matches) + listener 'change' */ }
function useIsLandscapeTable() { return useMediaQueryMatch(LANDSCAPE_TABLE_MQ) }
function useIsPortraitTable()  { return useMediaQueryMatch(PORTRAIT_TABLE_MQ) }
```

> No existe un `useIsDesktopTable`. **El escritorio es el estado negativo**: `isLandscapeTable === false && isPortraitTable === false`. No hay bandera propia — se define por exclusión.

### 2. Media queries que definen contextos en `gameTable.css` (todas, verbatim)

| Línea | Condición | Contexto | ¿Aplica a 1920×937? |
|---|---|---|---|
| 932 | `@media (min-width: 768px) and (min-height: 900px)` | **Desktop alto**: `--card` a 91/142 (vía theme.css), `.ai-zone{min-height:234px}`, `.game-table{min-height:830px}` | **Sí** (937 ≥ 900) |
| 948 | `@media (min-width: 768px) and (min-height: 601px)` | **Desktop/tablet**: óvalo 4-5 pasa a grid 2×2 (`grid-template-columns: auto minmax(0,360px)`) | **Sí** (937 ≥ 601) |
| 983 | `@media (max-width: 767px) and (orientation: portrait)` | **Móvil vertical** (bloque de ~1.2k líneas) | No |
| 2215 | `@media (orientation: landscape) and (max-height: 600px)` | **Móvil horizontal** | No |

Y en `theme.css:70`:
```css
@media (min-width: 768px) and (min-height: 900px) { :root { --card-w: 91px; --card-h: 142px; } }
```
Base `theme.css:53`: `--card-w: 76px; --card-h: 118px;`

`opponentPanel.css` solo tiene dos gates: `(orientation: landscape) and (max-height:600px)` (:214) y `(max-width:767px) and (orientation:portrait)` (:598) — **ambos móviles**. El panel de escritorio corre **100% con reglas base**.

### 3. Resolución JSX ↔ CSS a 1920×937 (medido)

**Gates medidos** (`matchMedia`, `diag_d1d2.json`):
`isLandscapeTable=false` · `isPortraitTable=false` · `mqDesktopTall=true` · `mqDesktopMid=true` · `--card-w=91px` · `--card-h=142px`.

**Estructura JSX renderizada** (rama `aliveN >= 3`, GameTable.jsx:1253):
```
.game-table.table-wide.table-five
  └─ .table-mid  (grid, cols medidos "274.219px 463.562px 274.219px")
       ├─ .side-col-left   → IA4 (opp-side-left)
       ├─ .mid-center
       │     ├─ .rivals-zone → IA3 (opp-top-left) · IA2 (opp-top-right)
       │     └─ .center-zone (óvalo)
       └─ .side-col-right  → IA1 (opp-side-right)
```
Confirmado en DOM: `hasTableMid=true`, `hasSideColLeft/Right=true`, `hasRivalsZone=true`, `oppPanels=4`, `hasTwoOvals=false`, `hasAiZone=false`.
`brandInMid=false` → **AJILEI + "Mano #N" viven en el `<header>`** (`hasTableBrand=false`, `brandInHeader=true`).
`letterBadges=false` y `cornerChip=false` (medido: badges con texto **completo** "Mano/Pie", `cornerChips=0`, `oppChipsLines=4`).

**¿Hay divergencia JSX↔CSS?** **No.** El esqueleto `.table-mid` es **compartido** entre escritorio y landscape-móvil por diseño (comentario GameTable.jsx:39-45). En escritorio ese JSX se estila con la **definición base** de `.table-mid` (`grid-template-columns: auto 1fr auto`, gameTable.css:716) porque el bloque landscape (:2215) no aplica. La única transformación desktop-específica es el óvalo → grid 2×2 del bloque `min-height:601` (medido: `.center-zone` display=`grid`). JSX y CSS están sincronizados.

### Conclusión D1
El escritorio hoy se gobierna por: **(a) reglas base de `gameTable.css`/`opponentPanel.css`** + **(b) dos bloques `min-*`**: `min-height:900` (subida de cartas a 91px y min-heights de zona) y `min-height:601` (óvalo 4-5 a grid 2×2). No hay gate positivo de "desktop"; se entra por exclusión de los dos MQ móviles. **Corolario crítico:** el gate de las cartas grandes (91px) y del cromo alto es `min-height:900px`, **no** el ancho — sólo 1920×937 lo cumple en la matriz (ver D3/D4). Construir un gate DSK sin contaminar móvil es viable porque los bloques móviles ya están acotados por `max-width:767`/`max-height:600` y no solapan con `min-width:768`+`min-height:601`.

---

## D2 — Mapeo DOM de los 11 frentes (1920×937)

Estado base = **WAITING** ("¡Bienvenido a Ajilei!"); estado rico = **showdown** ("IA 4 gana con Espadas (37 pts)"). Rects en px del viewport.

**1 · Texto "fichas".** IA: `.opp-chips` (`OpponentPanel.jsx:76`, montado por `!letterBadges`) → texto `"5000 fichas"`, 4 instancias, `font-size:12px`, color dorado, `w≈97.4×24`. Humano: `.pbr-chips` → `.pbr-fichas-word` ("fichas") con `display:block` (visible; se oculta sólo en portrait `.table-wide`). **Componente compartido con móvil**; en desktop la palabra "fichas" se renderiza siempre. La condición que la suprimiría sólo en escritorio no existe hoy (el único gate que desmonta `.opp-chips` es `letterBadges`, atado a portrait/landscape).

**2 · Ficha IA / mecanismo ocultar-revelar saldo.** El toggle de saldo (ficha de esquina `openChipSeat`/`handleChipTap`, `CHIP_TOGGLE_MS=3000`) se monta con la prop `cornerChip` (`OpponentPanel.jsx:100`), que en desktop es **false** → **`cornerChips=0` medido, el mecanismo NO está activo en escritorio**. El saldo se muestra inline y permanente como "N fichas". Estado/handler: `openChipSeat` (GameTable.jsx:243), `handleChipTap` (:682, con gate `showdownWinnerSeat!==null` → inerte en showdown).

**3 · Nombre IA.** `.opp-name` dentro de `.opp-header` (`display:flex; align-items:center; gap:4px`). Medido: texto 13px, `color rgba(245,237,216,.65)`, `text-align:center`, padding/margin 0. Rects (WAITING): IA4 `x=537.5 w=23.1`, IA3 `x=816 w=23.1`, IA2 `x=1080.8`, IA4/1 laterales a `y≈239`, top a `y≈128`. El centrado lo da `flex` del header + `text-align:center` del panel.

**4 · Badges PIE/MANO/TURNO (IA).** `.seat-badge` + modificador (`.opp-panel .seat-badge`, dentro de `.opp-header-anchor` que es `display:contents`). Medido en showdown: pastilla "Pie" `seat-badge-neutral`, `font-size:10px`, `padding:2px 8px`, `bg rgb(26,74,46)`, `letter-spacing:1.5px`, texto **palabra completa** (no letra). Oro para Mano/Turno (`seat-badge-gold`).

**5 · Palabra de estado (se retiró/pasó/igualó).** Nodo: `.opp-status` (`OpponentPanel.jsx:113`). Medido en showdown: `position:static` (en flujo, cuenta para el alto del panel), `font-size:22px`, textos `"Igualó" / "Se retiró" / "Apostó"`. También se narra en el centro vía `.game-message` con `.msg-action` (pop 0.3s). **Sobre el "timer de 3s":** no existe un temporizador que borre la palabra de estado. El valor vive en `lastActions[seat]` (GameTable.jsx:227) y **persiste hasta el reset de la mano siguiente** (`resetting` → `' '`). El único `3000ms` del componente es `CHIP_TOGGLE_MS` (autocierre de la ficha de esquina), **desacoplado del estado y ausente en desktop**. → No hay divergencia móvil/desktop en el ciclo de vida del rótulo; simplemente no hay auto-borrado a 3s.

**6 · Bug de revelación finalista.** Reproducido (ver sección dedicada abajo). Nodo raíz `.opp-winner`; regla causante `opponentPanel.css:177-185`.

**7 · Frase "Mejor palo: X (N pts)".** Rivales: `.opp-score` (`OpponentPanel.jsx:119`), condición `showScore = isPayoutPhase && !inReset` (`style.visibility`). Humano: `.score-tag-player` (GameTable.jsx:1269) → "Tu mejor palo: Copas (20 pts)". Medido (showdown): 3 `.opp-score` visibles + 1 hidden (el retirado), `.score-tag-player` visible. `font-size:12px`, `height:18px` fija.

**8 · Óvalo central.** `.center-zone`. Medido en showdown: `display:grid` (por bloque `min-height:601`), **`box-sizing: content-box`**, `border-radius:999px`, `padding:6px 28px`, `grid-template-columns:"112px 145.5px"`, `overflow:hidden`, `flex:1 1 0%`. En estado bienvenida (D3) el rect es **464×215**; en showdown con panel ganador lateral cae a **334×215** (ver D3/bug). Es **elástico**: nace de `flex:1` en `.mid-center` y del `1fr` central de `.table-mid`; su ancho es residual del reparto del grid → **se encoge cuando una IA lateral expande su banda de cartas**. El mensaje `.game-message` tiene `height:54px` **FIJA** y `flex:1 1 0%` → no crea línea propia (mismo patrón estable heredado de portrait). Umbral de wrap del mensaje más largo: en desktop el `.game-message` está en la columna `minmax(0,360px)` del grid 2×2 (bloque :948), con `overflow:hidden` en `.center-zone` → el texto se recorta antes que desbordar (no medido un wrap explícito; el equivalente al "482px de móvil" aquí lo fija `minmax(0,360px)`).

**9 · Secuencia "curiosear" del humano (Revelar Manos).** **Corre parcialmente en desktop.** Medido en showdown: `tappable=3` (3 nombres de IA elegibles), la rotación de sacudida (`.opp-name-shake`, `shakeSeat`) **sí se ejecuta** (no está gateada por orientación — GameTable.jsx:778). **Pero la coreografía de volteo NO corre**: `revealClasses=[]` (ninguna `opp-reveal-*`). Causa: `handleRevealTap` (GameTable.jsx:668) evalúa `runsChoreo = isLandscapeTable || (isPortraitTable && aliveN∈{5,4,3})` → **false en desktop** → `setDisplayedSeat(seat)` **instantáneo**. Diferencia vs móvil: móvil ejecuta `startRevealSwap` (~960ms: cerrar→recoger→crecer→abrir); desktop hace corte seco. El tap-para-espiar y la sacudida-affordance funcionan; el intercambio es sin animación.

**10 · Bloque "Tú [MANO]".** `.player-bar-left` (`strong`, GameTable.jsx:1286). Medido: `display:block` (base; el grid que reordena badges es sólo portrait/landscape), `justify-self:start`, `overflow:hidden`, `white-space:nowrap`, `text-overflow:ellipsis`. Hijos: `.pbr-name` ("Tú", `w=17.5×16`) + `.pbr-badges` (contiene `.pbr-tags` → "Mano", y `.badge-turno` cuando aplica). En una sola línea "Tú Mano". Rect `x=463 w=79.4×27.4`.

**11 · Bloque saldo humano + "· Mesa 100".** `.player-bar-right` (`span`, GameTable.jsx:1423). Estructura medida (innerHTML): `.pbr-chips` (`BalanceDisplay` full + `.pbr-fichas-word`"fichas") · **`.pbr-sep` = `" · "`** (el carácter "·" vive **aquí**, span dedicado, GameTable.jsx:1428, rect `x=1381 w=13×16`) · `.pbr-mesa` "Mesa 100". `display:block`, `justify-self:end`, `white-space:nowrap`, color dorado. Rect total `x=1258.7 w=198.3×44.1`.

---

## D3 — Matriz de adaptabilidad (mesa 5)

Iniciada la mano; sin scroll de documento en ningún caso; el scroll relevante es **interno de `.game-table-screen`** (`overflow-y:auto`).

| Viewport | `--card` | `min-h:900` | **Scroll interno** | Mesa (bbox) | Óvalo | Abanico humano | Paneles IA (side / top) | Mazo |
|---|---|---|---|---|---|---|---|---|
| 1024×768 | 76px | no | **0** ✓ | 982×736 (y 16..752) | 437×161 | 892×132 | 180×201 / 190×195 | 40×59 |
| 1280×720 | 76px | no | **27 ⛔** | 1084×742 (y **−11**..731) | 539×164 | 994×132 | 180×204 / 241×198 | 40×59 |
| 1366×768 | 76px | no | **3 ⛔** | 1084×742 (y 13..755) | 539×164 | 994×132 | 180×204 / 241×198 | 40×59 |
| 1920×937 | 91px | sí | **0** ✓ | 1084×830 (y 54..884) | 464×215 | 994×156 | 210×217 / 199×211 | 47×70 |

**Defectos bloqueantes (scroll/overflow):**
- **1280×720 → 27px de overflow interno**: la mesa (742px) no cabe en 720px; borde superior recortado (`y=−11`). Ver `dsk_m5_1280x720.png` (cabecera pegada al canto superior, sin aire).
- **1366×768 → 3px de overflow**: marginal pero presente (mesa 742 en 768 debería sobrar; el `padding:16px` del screen + `min-height` de zonas lo consume).

**Cromo de panel IA ("¿se sostiene el cromo 76px?"):** el token de carta base es **76px** y **se sostiene idéntico en 1024/1280/1366** (los tres <900px de alto). **Sólo salta a 91px en 1920×937** (gate `min-height:900`). Es decir: el "cromo 76" no es un mínimo estable de escritorio sino el **estado por defecto** de casi toda la matriz; el 91 es la excepción de una sola celda. Los altos de panel IA sí escalan con el viewport (195→217px).

**Uso del lienzo:** `.game-table.table-wide` = `min(1100px, 100%)`. A 1920 la mesa mide **1084px** → ~418px de banda muerta a cada lado (fondo verde/negro). El escritorio ancho **no** aprovecha el lienzo horizontal; la mesa está topada en ~1100px y centrada.

---

## Punto 6 — Bug de revelación finalista (reproducido y medido)

**Reproducción:** mano jugada a showdown real (`showdownReal=true`); tap sobre un finalista NO ganador (`opp-side-left`, IA4) para "espiar" su mano. Captura: **`dsk_m5_bug_reveal.png`**.

**Regla causante:** `opponentPanel.css:177-185`
```css
.opp-winner .opp-card-slot            { transform: scale(1.2); position: relative; z-index: 5; }   /* visual, no reflow */
.opp-winner .opp-card-slot:not(:first-child) { margin-left: calc(var(--opp-card-w) * 0.3); }        /* ⚠ REFLOW */
```
El slot base solapa (`margin-left: calc(--opp-card-w * -0.35)` = **−17.52px**); al ganar/revelarse pasa a separación positiva **+15.02px**. Cada carta cambia de `−17.52`→`+15.02` (medido en `cardSlotML`). `transform:scale(1.2)` no refluye; **el `margin-left` sí** ensancha la fila `.opp-cards`.

**Cadena de reflujo medida** (`diag_bug.json` + comparación con D3):

| Métrica | En juego (sin ganador) | Showdown (panel lateral revelado) | Δ |
|---|---|---|---|
| `.opp-cards` del panel revelado | 180px | **310px** | **+130px (+72%)** |
| Ancho panel revelado (lateral) | 210px | **340px** | +130px |
| **Óvalo central** (`.center-zone`) | **464px** | **334px** | **−130px** |
| Paneles superiores (IA2/IA3) | 199px | **134px** | −65px c/u |

**Mecánica:** `.table-mid { grid-template-columns: auto 1fr auto }` (gameTable.css:716). El panel revelado vive en una columna **`auto`** (side-col); su `.opp-cards` crece +130px → la columna `auto` se ensancha → la columna central **`1fr`** (`.mid-center`, que contiene óvalo + `.rivals-zone`) cede exactamente ese espacio → **el óvalo pierde 130px y los paneles superiores se comprimen 65px cada uno**. Es un reflujo real del grid, no un efecto visual. La captura lo muestra: IA4 con cartas boca-arriba desplegadas empujando el óvalo (comprimido) y los paneles IA2/IA3 estrechados.

> Nota: el disparo ocurre al **espiar cualquier finalista** (`isWinner = revealedSeat === seat`), no sólo al ganador por defecto — cada tap reubica el panel de 340px y reordena el encogimiento. Como en desktop el canje es instantáneo (D2-9), el salto de layout es un **corte seco** sin transición.

---

## D4 — Fijos vs. fluidos

**Hallazgo estructural:** el camino de escritorio (base + bloques `min-*`) usa **cero `clamp()` y cero unidades de viewport para dimensionar**. Los 8 `clamp()` de `gameTable.css` (líneas 1008, 1831, 2047, 2106, 2175, 2685, 2704, 3516) y el grueso de `vw/vh/svh` viven **todos dentro de los bloques móviles** (portrait ≥983 / landscape ≥2215). En desktop **no se activa ninguno**. La doctrina FL-1 (fluidez) **no está aplicada en escritorio**: todo es **px fijo con un único escalón discreto** en `min-height:900`.

**Valores fijos que quedarían desproporcionados al variar el lienzo:**

| Elemento | Valor | Fijo/Fluido | Nota |
|---|---|---|---|
| `--card-w/h` | 76→**91**px | escalón único @900 | salto binario; nada entre 76 y 91 |
| `--opp-card-w/h` | `calc(--card-w * 0.55)` | derivado del escalón | mismo salto binario |
| `.game-table` ancho | `min(860/1100px, 100%)` | semi-fluido (tope 1100) | banda muerta a 1920 (D3) |
| `.game-table` min-height | `min(780/830px, 100%)` | escalón @900 | |
| `.game-message` | `height:54px`; `font 14/15px` | **fijo** | alto de anclaje |
| `.pot-value` / `.call-value` / `.timer-display` | 26 / 22 / 20px | **fijo** | |
| `.seat-badge` | `font 10px`, `padding 2px 8px` | **fijo** | idéntico en toda la matriz |
| `.opp-chips` / `.opp-score` | 12px, `height:18px` | **fijo** | |
| `.opp-panel` | `min-height:150px`, `max-width:360px`, `padding:10px 14px` | **fijo** | |
| `.action-area` | `height:84px` | **fijo** | franja de anclaje |
| `.btn` / `.btn-mult` | 13 / 12px, `padding 9px 18px` | **fijo** | |
| `.center-zone` | `padding:6px 28px`, `gap 4px 18px`, `minmax(0,360px)` | **fijo** (+minmax semi-fluido) | |

**Ya fluidos (relativos), aplicables a desktop:** el `.game-table` con `min(...,100%)`, el `1fr`/`auto` de `.table-mid`, el `flex:1` del óvalo, el `minmax(0,360px)` del mensaje, `max-width:360px` del panel. Son fluidez **de reparto** (grid/flex), no **de escala** (tipografía/iconos siguen en px fijo).

**Bajo doctrina FL-1** (fuentes/iconos/fichas/badges): hoy **ninguno** de ellos es fluido en desktop — todos en px fijo con el único escalón @900. Iconos de ficha (`ChipToken` full=36px, compact/icon) y badges no reaccionan al ancho.

---

## D5 — Capturas

En `capturas-dsk/`:
- `dsk_m5_1024x768.png` — sin scroll ✓
- `dsk_m5_1280x720.png` — **overflow 27px**, borde superior recortado ⛔
- `dsk_m5_1366x768.png` — overflow 3px ⛔
- `dsk_m5_1920x937.png` — referencia, cartas 91px, sin scroll ✓
- `dsk_m5_bug_reveal.png` — **bug punto 6**: panel IA4 espiado expandido, óvalo comprimido, paneles superiores estrechados.

Datos crudos: `diag_d1d2.json`, `diag_d3.json`, `diag_bug.json`, `diag_shots.json`. Arnés reutilizable: `scripts/diagDSK.mjs` (`node scripts/diagDSK.mjs <d1d2|d3|bug|shots|all>`).

---

## Síntesis de defectos medidos (para priorizar en Fase 1)

1. **Overflow vertical** en 1280×720 (27px) y 1366×768 (3px) — scroll interno + recorte de borde superior.
2. **Reflujo del showdown** (punto 6): espiar un finalista encoge el óvalo −130px y los paneles vecinos −65px vía `margin-left` del grid `auto 1fr auto`.
3. **Cartas pequeñas (76px)** en 3 de 4 viewports de escritorio por gate `min-height:900` (sólo 1920×937 sube a 91).
4. **Banda muerta** ~418px/lado a 1920 por tope `min(1100px,…)`.
5. **Cero fluidez de escala** en desktop (px fijo + un escalón); FL-1 sin aplicar.
6. Elementos compartidos con móvil sin gate desktop propio: "fichas" siempre visible, saldo IA sin toggle (inline permanente), estado sin auto-borrado.

*Fin del diagnóstico. Sin recomendaciones de implementación (corresponde a fases siguientes).*
