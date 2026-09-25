# AJILEI · LUZ-1 · Fase 0 · Informe de diagnóstico · v1.0

**Fecha:** 2026-09-25 · **Base:** `main` en `90f9539` · **Ficha:** `AJILEI_LUZ-1_Fase0_v1.0.md`
**Ejecutó:** Claude Code · **Rector:** Claude (chat) · **Decide:** Victor
**Tiempo empleado:** unos 17 minutos de reloj, de 05:45 a 06:02 (tope: 60).

Abreviaturas de archivo: **GT** = `src/styles/gameTable.css` · **OP** = `src/styles/opponentPanel.css` · **PC** = `src/styles/playingCard.css` · **TH** = `src/styles/theme.css` · **TP** = `src/styles/tapetes.css` · **EMB** = `src/styles/embellecimiento.css` · **CT** = `src/components/ChipToken.css` · **JSX** = `src/components/GameTable.jsx` · **IX** = `src/index.css`.

Bloques de medios de GT (se citan así en todo el informe):

- **B**: base, 1-1113.
- **T**: `(min-width:768px) and (min-height:601px)`, 1130-1151.
- **P**: portrait móvil `(max-width:767px) and (orientation:portrait)`, 1165-2379. Dentro va **P≤772**, el bloque de compresión `(max-height:772px)`, 2000-2175.
- **L**: landscape móvil `(orientation:landscape) and (max-height:600px)`, 2397-4243.
- **D**: escritorio `(orientation:landscape) and (min-height:601px)`, 4251-6289.

---

## Resumen en semáforo

| Capa | Estado | Resumen |
|---|---|---|
| **A · Luz cenital** | 🟡 viable con obstáculo | Se puede meter como **una capa más de `background` en `.game-table`** desde una hoja nueva: no hace falta DOM ni pseudoelemento, y no toca ninguna caja. **Obstáculo:** los textos que viven en el borde ya están bajos de contraste. «Mano #N» (`.hand-badge`) mide **3,27:1** a 10 px y ya incumple AA; «Pasó» (`.opp-status`), 4,45; «POZO» (`.pot-label`), 4,77; el reloj, 4,76. Oscurecer los bordes los baja todavía más. Además, el tricolor pinta el fondo con una regla más específica (0,2,1), así que hay que cubrirla aparte. |
| **B · Cuerpo del óvalo** | 🟡 viable con obstáculo | La piel del óvalo está declarada **cuatro veces** (B, P, L y `.felt-oval` de mesa 2 en L). Un selector de especificidad 0,2,0 o más la cubre, pero `box-shadow` **sustituye**, así que hay que repetir las dos sombras inset que ya tiene. **Obstáculo:** en teléfono el óvalo solo tiene **1,8 a 4 px libres** hasta los paneles de las IAS y la zona del jugador (§D.3). Un riel **exterior** pisaría a los vecinos, así que en móvil el riel tiene que ir **hacia dentro** (inset) o no pasar de unos 2 px. En escritorio hay 10 px por arriba y por abajo. |
| **C · Sombras de contacto** | 🔴 en la carta seleccionada · 🟡 en el resto | `.playing-card` ya tiene `box-shadow` en cuatro estados, y el de **seleccionada lleva `!important`** (PC:23-27): sin `!important` no se le puede sumar ni quitar nada por `box-shadow`. Un pseudoelemento sobre la carta tampoco sirve, porque `overflow:hidden` (PC:8) lo recorta. Lo único que no choca es `filter: drop-shadow` sobre `.playing-card`, que hoy está libre. El mazo, las fichas y los paneles admiten la capa, pero **reescribiendo** su lista de sombras actual. Los paneles tienen además `turnBreath`, una animación infinita que **pisa `box-shadow`** mientras dura el turno. El pozo está libre. |
| **D · Textura de fieltro** | 🟢 viable | Es otra capa de `background` en `.game-table`, estática y sin filtros. Solo hay que tener en cuenta que **ya existe una textura**: la filigrana dorada a ±45° (TH:107), que se transparenta un 12 % a través de la mesa. |
| **E · Marca de agua** | 🟡 viable con obstáculo | Como capa de `background` en `.center-zone` da Δ=0 sin pseudoelemento ni contexto nuevo. **Obstáculo:** el óvalo cambia muchísimo de forma según la celda. Mide **486×37,8** en S25 horizontal (mesas 5, 4 y 3), en mesa 2 horizontal son **dos piezas de 129×53 y 157×69**, y en vertical el POZO y el mensaje ocupan casi todo el óvalo. No hay un anclaje óptico único, y en horizontal móvil no cabe un isotipo legible. |

Punto de enganche (§F): **`GameTable.jsx` no está protegido.** Aun así, A, B, D y E no necesitan ningún elemento nuevo: todo cabe en capas de `background` y de `box-shadow` desde una hoja nueva importada **después de la línea 5 de `GameTable.jsx`**, para que cargue detrás de `gameTable.css` **y** de `opponentPanel.css`.

---

## §0 · Línea base

| Punto | Esperado | Medido |
|---|---|---|
| `HEAD` | `90f9539` | **`90f9539`** ✔ |
| `git status --short` | 6 residuos conocidos | Los 6 conocidos: los 2 informes MOT-1, los 3 de `laminas/mon1/` y `scripts/_cel1bFila.mjs`. **Aparece además `capturas-luz/`**, que es la salida de esta fase. Nada modificado. ✔ |
| Pruebas | 993 en verde | **993/993** en 35 archivos ✔ |
| Lint | 20 errores | **20 errores y 1 aviso** («0 errors and 1 warning potentially fixable»). La cifra de errores coincide; el aviso se anota y no se investiga. |
| `gate` | 6/6 | **6/6**, `matrixOk: true` ✔ |
| Navegador | — | Edge **153.0.4234.48**. Las líneas base de ARN-1 se tomaron con 151.0.4129.93: es la deriva ya conocida y la avisa el propio arnés. |

---

## §A · Anatomía de la mesa

### A.1 · Árbol y vía de dibujo por mesa

Hay tres ramas en el JSX, que dependen de `aliveN` y de `isLandscapeTable` (`LANDSCAPE_TABLE_MQ`, JSX:92).

```
body[data-tapete]                        ← pinta los laterales (green-abyss, welcome.css:1-7)
└ #root  (1126 px, border-inline 1px)    ← IX:57-67
  └ main.game-table-screen               ← fondo general: filigrana + radial verde (GT:5-17)
    └ section.game-table.table-N[.table-wide]   ← marco dorado (border) + fieltro (background) (GT:19-34)
      ├ header.table-header  (.table-title wordmark, .hand-badge, .header-right)
      ├ [mesas 5/4/3, y mesa 2 en L]  div.table-mid
      │   ├ .table-brand (solo L)
      │   ├ .side-col-left  → .opp-panel…
      │   ├ .mid-center
      │   │   ├ section.rivals-zone → .opp-panel…
      │   │   └ section.center-zone (óvalo)        │ mesa 2 en L: div.two-ovals > .felt-oval.oval-left / .oval-right
      │   └ .side-col-right → .opp-panel…
      ├ [mesa 2 en B/P/D]  section.ai-zone + section.center-zone   (hijos directos de .game-table)
      └ section.player-zone  (.score-tag, .cards-row [.deck-shuffle-wrapper + 5×.card-slot-wrapper], .player-bar)
```

**Vía de dibujo del rival, medida en las 20 celdas:** las mesas 5, 4 y 3 usan `opp-panel` en los cinco tamaños. La mesa 2 usa **`.ai-zone` en pc, s25v, 390 y 360**, y **`opp-panel` en s25h**. **Coincide con la referencia de la ficha.** La regla exacta es que la mesa 2 usa `opp-panel` en L, es decir, en landscape con altura de 600 px o menos. En escritorio, que también es horizontal, usa `.ai-zone`.

### A.2 · Capa por capa

Datos de estilos computados en vivo (`geometria.json → celdas.*.capas`) cruzados con la fuente. «SC» significa que la capa crea contexto de apilamiento.

| Capa | Selector y definición | position / z | SC | overflow / radio | Fondo actual | Borde y sombra | Pseudos usados |
|---|---|---|---|---|---|---|---|
| Laterales | `body` welcome.css:1-7 · `body[data-tapete]` TP:26-35, 158-256 | — | — | — | `var(--green-abyss)` `#09170e` | — | — |
| Raíz | `#root` IX:57-67 | static | no | — | ninguno | **`border-inline: 1px solid var(--border)`** (`#e5e4e7` en claro) → **líneas verticales visibles** en pc, a x≈397 y x≈1523 (§J-3) | — |
| Fondo general | `.game-table-screen` GT:5-17 · padding en P:1253, P≤772:2005, L:2400, D≤800:4269 · tricolor TP:288 | static / auto | no | `overflow-y:auto` (contenedor de scroll) / 0 | `var(--filigrana)` + `radial-gradient(circle, base 0 → deep 55% → darkest 100%)` | — | ninguno |
| Marco dorado + fieltro | `.game-table` GT:19-34 · `.table-wide` GT:865 · 1116 (≥768×900) · P:1259 · P≤772:2020 · L:2433 · D≤800:4272 · tricolor TP:267 | **static en D y en P (s25v, 390)**. **relative** en P≤772 m5 (GT:2107), P m4 (GT:1467) y L m5/m3/m2 (GT:3335, 3666, 3859). z auto | no | visible / **32 px** en D, **20** en P, **16** en L | `var(--surface-game)` = `rgba(27,72,44,.88)`, deja pasar un 12 % del fondo general | `border: 2px solid rgba(gold-brand,.45)` = **el marco dorado**. `box-shadow: inset 0 0 70px rgba(0,0,0,.35), inset 0 1px 0 rgba(gold,.10), 0 24px 70px rgba(0,0,0,.45)` | **ninguno** |
| Cabecera | `.table-header` GT:37-41 · L:3392/3526/3737/3952 | static | no | visible / 0 | ninguno | — | ninguno. Sus hijos pasan a absolute z20 en P m4, P≤772 m5 y L m3/m2 |
| Marca en L | `.table-brand` GT:3428-3444, 3548 | absolute, z 20, `translateY(2.6px)` | **sí** | — | ninguno | — | ninguno |
| Rejilla central | `.table-mid` GT:869-876 (+P/L/D) | static; relative en L m5/m4 (GT:3413, 3534) | no. Solo transitorio con `.reflow-settle` (GT:947-952) | visible | ninguno | — | ninguno |
| Columnas | `.side-col-*` GT:885-894, OP:1083-1084 · `.mid-center` GT:878-883 · `.rivals-zone` OP:1074-1080 | static. `display:contents` en L y en P ancha | no | — | ninguno | — | ninguno |
| **Óvalo** | `.center-zone` GT:98-121 (B) · **misma piel repetida** en P:1274-1291 y en L:2641-2669 · T:1130-1151 (rejilla 2×2 + `overflow:hidden` en m4/m5) · D:5560-5563 (`overflow:hidden` en m3/m2) · ancho fijo en L:3483-3489 (m5), 3624-3634 (m4), 3838-3848 (m3) | **relative** siempre, z auto | no | **hidden en pc**, visible en móvil / 999 px | `radial-gradient(ellipse, bright 0 → base 48% → deep 100%)` | `border: 1px solid rgba(gold,.45)` = **el hilo dorado**. `box-shadow: inset 0 0 44px rgba(0,0,0,.35), inset 0 1px 0 rgba(gold,.10)`. **Ninguna sombra exterior** | **ninguno** |
| Óvalos de mesa 2 en L | `.table-two .two-ovals {display:contents}` GT:3962 · `.table-two .felt-oval` GT:4036-4054 · `.oval-left` GT:4060-4081 · `.oval-right` GT:4120-4137 | static | no | visible / izquierdo 999 px, **derecho 14 px (es un rectángulo)** | la misma piel | la misma | ninguno |
| IA (vía nueva) | `.opp-panel` OP:6-24 (+P:1640, L:2506) | relative. z 1 en L (GT:3494-3496), 3 con `chip-open`, 7/8 si gana (GT:5155, 5288) | **sí en L** (z 1) y al ganar | visible / 18 D · 12 P · 10 L | `var(--surface-area-light)` `rgba(9,23,14,.30)` | borde `rgba(gold,.2)`; `turnBreath` al tener el turno | ninguno |
| IA (vía legacy, mesa 2) | `.ai-zone` GT:57-66 (+1115, P:1668/1707, D:4509/4533/5540) | relative | no. Sí con `.turn-dimmed` (opacity .8) y con `.chip-open` z 3. **No debe crear contexto** por el zoom Z1 (GT:5443-5444) | visible / 18 | `surface-area-light` | borde `rgba(gold,.2)`; `turnBreath` | ninguno |
| Zona del jugador | `.player-zone` GT:223-231 · P:1819 · P≤772:2032 · L:2758-2768/2910-2949 · D:4274/4844 | relative en D y L; static en P | no. Sí con `.turn-dimmed` | visible (L la pone a hidden y luego vuelve a visible) / 22 D · 16 P · 14 L | `var(--surface-area)` `rgba(9,23,14,.45)` | borde `rgba(gold,.25)`; `turnBreath` | ninguno |

**Dato crítico: ninguna capa del esqueleto usa `::before` ni `::after`.** Se comprobó en las 20 celdas con estilos computados y también con grep en todo `src/**/*.css`. Todos los pseudoelementos que existen cuelgan de **descendientes**:

- botones: `.action-area .btn::after` GT:2055/4319, `.btn-mult::after`, `.btn-leave::after`;
- `.opp-name-tappable::after` GT:4355 y `.opp-corner-chip::after` GT:4547, solo con puntero grueso en D;
- `.utilities-trigger`, `.util-badge`, `.u2-*`;
- `.u3-popup::before` EMB:72.

**Apilamiento global.** Nada del esqueleto crea contexto de apilamiento, y el único contexto de referencia es el raíz (GT:5325-5326). Un `::before` con `z-index:-1` en `.game-table` quedaría **debajo del fondo de la propia mesa**, es decir, invisible, salvo que se le añada `isolation`. Eso encerraría dentro los z 7, 8 y 9 de los paneles y la lupa, y habría que comprobarlo.

---

## §B · Paleta del tapete

| Elemento | Valor exacto | Origen |
|---|---|---|
| Escala verde | abyss `#09170e` · darkest `#0b1c11` · deep `#153922` · base `#1b482c` · bright `#235c38` | tokens en TH:42-51 |
| Fieltro (`.game-table`) | `--surface-game` = `rgba(27,72,44,.88)`. **En pantalla** se mide ≈ `rgb(24–25,62–66,38–40)`, porque el fondo general se transparenta | TH:71 |
| Fondo general | radial base → deep → darkest, más `--filigrana`: dos `repeating-linear-gradient` a ±45° con una línea de 1 px cada 29 px en `rgba(201,151,58,.05)` | GT:9-11 y TH:107-117 |
| Óvalo | radial ellipse bright 0 → base 48 % → deep 100 %. Centro medido ≈ `rgb(27–33,71–87,43–53)` | GT:111-116 y sus tres duplicados |
| Hilo dorado | `--gold-brand` `#e8b84b` (232,184,75). Marco: 2 px al 45 %. Óvalo: 1 px al 45 %. Jugador: 25 %. Paneles de IA: 20 % | TH:6-7 |
| Superficies de zona | `--surface-area` `rgba(9,23,14,.45)` · `-light` al 30 % | TH:73-74 |

- **Todo sale de tokens.** No hay ningún verde escrito a mano en GT ni en OP. Los únicos literales son los negros de las sombras.
- **Variación por mesa (5/4/3/2): ninguna.**
- **Por nivel (Básico, Avanzado, Pro): ninguna.** Se comprobó en vivo con el modo `niveles` del script: m5 pc en los tres niveles da los mismos `background` de pantalla, mesa y óvalo. No existe ningún atributo `data-nivel`.
- **Por modo (D, P, L o comprimido): ninguna en color.** Solo cambian el radio y el relleno.
- **Solo cambia con `body[data-tapete]`.** TP:158-256 redefine los tokens `--green-*` y `--surface-*` para grafito, azul, vinotinto y tricolor. El tricolor además **sustituye el `background`** de `.game-table` (TP:267) y de `.game-table-screen` (TP:288), las dos con especificidad 0,2,1. La familia dorada no cambia en ningún tapete. El verde es la ausencia de regla, aunque el atributo `data-tapete="verde"` sí está puesto.

---

## §C · Candidatos a sombra de contacto

| Elemento | Selector / nodo | Radio | Sombra y efectos actuales, por estado | Conflicto y vía |
|---|---|---|---|---|
| **Cartas del jugador** | `.card-slot-wrapper` (GT:630, **sin pintura ni pseudos**) › `div.playing-card` (PC:1-12) › `<img>` (CardImage.jsx:31) | **8 px**, con `overflow:hidden` en PC:8 | **Reposo:** `1px 3px 8px rgba(0,0,0,.3)` + `transition: transform .18s, box-shadow .18s` (PC:7-9). **Jugable** (`.card-clickable`, solo en descarte) al pasar el ratón: `translateY(-6px)` y `2px 10px 18px .35` (PC:18-21). **Seleccionada:** `translateY(-18px) !important`, borde dorado `!important`, `0 14px 26px dorado .6 !important` (PC:23-27). **Ganadora** (`.card-winner`): `0 0 14px dorado .6` (PC:30-33). **Vacía, barajando o recogiendo** (`inReset`): `box-shadow:none`, borde discontinuo (PC:36-40). **Volteo** (`card-flip-anim`): `perspective rotateY` + opacity (GT:1094-1101). **No jugable:** no tiene clase propia; solo `.player-zone.turn-dimmed {opacity:.8}` | **Sustituye en los cuatro estados.** Un pseudo en la carta queda recortado por `overflow`. Un pseudo en el envoltorio no sigue el `translateY` ni el `rotateY`. **Vía limpia: `filter: drop-shadow()` sobre `.playing-card`**, que está libre, no lo recorta el `overflow` y sigue todas las transformaciones. Coste: crea un contexto de apilamiento por carta (hasta ~25). **La seleccionada no admite sumar nada por `box-shadow` sin `!important`** |
| **Cartas de las IAS (dorso)** | `.opp-card-slot` (OP:116, 169, 173; sin pintura ni pseudos) › `.playing-card.card-back` › `<img>` del reverso. Legacy: `.ai-zone .card-slot-wrapper` | 8 px | La misma sombra de reposo PC:7. Ganadora: slot con `scale(1.2)` y z 5 (OP:224-228), `scale(1.6)` en L (OP:272-278), `translateY scale(1.5)` en P, y `translateX scale(1.2)` más lupa Z1 en D (GT:5118-5141, 5404-5429). Coreografía de revelado: solo transform y opacity (GT:5206-5276). Panel `.opp-folded` a opacity .55 (OP:26) | Igual que la fila anterior: `drop-shadow` en `.playing-card` es la vía que no pisa |
| **Mazo** | `.deck-pile` div con `background: url(reverso.svg)` y borde de 2 px (GT:637-649) · D:4698-4706 · `.opp-deck` OP:200-208 · `.deck-hidden {visibility:hidden}` GT:651 | 8 px | **Pila de cuatro sombras:** `2/4/6px #7a0000/#8B0000/#6b0000` + `8px 8px 6px rgba(0,0,0,.4)`. En D y en `.opp-deck`: `1/2/3px` + `4px 4px 4px .4`. Sin filter ni pseudos | **Sustituye.** Hay que repetir la pila en las tres listas (GT:644, 4703, OP:203), o bien usar `drop-shadow` o el `::before` libre |
| Barajado y reparto | `.shuffle-fan-card` ×5 (GT:1076-1085, `fanOut` 1,95 s solo de transform) · `.flying-card` (GT:657-667, fixed z 200) | 8 px | `2px 4px 14px rgba(0,0,0,.45)` | Sustituye. Son transitorios: se recomienda dejarlos fuera de C |
| **POZO** | `.pot-box` div (GT:123-132, relative) · `.call-box` (GT:563-571) | 14 px | **Ninguna.** Sin filter ni pseudos. `.pot-value` tiene `potPulse` (transform + **text-shadow**, 0,4 s) | **Libre:** admite `box-shadow` directo |
| **Fichas** | `ChipToken` = **`<img class="chip-token">`** (ChipToken.jsx:78-90) | redonda (es imagen) | `filter: drop-shadow(0 1px 2px rgba(0,0,0,.45))` (CT:5) | **Sustituye.** Un `<img>` no admite pseudos. Vía: redeclarar la lista de `filter` con un segundo `drop-shadow`, con un selector más específico desde la hoja nueva |
| **Paneles de las IAS** y zona del jugador | `.opp-panel` / `.ai-zone` / `.player-zone` | 18 / 12 / 10 px (panel IA) · 22 / 16 / 14 px (jugador) | **Ninguna en reposo.** Con `.turn-active`, **`turnBreath` 2,4 s infinita anima `box-shadow`** (GT:1013-1031). `.opp-eliminating`: `oppEliminate` anima filter (grayscale/brightness), opacity y scale durante 1 s (OP:32-42) | **Mientras hay turno, la animación sustituye cualquier `box-shadow` declarada.** Para no perderla habría que redefinir `@keyframes turnBreath` en la hoja nueva con la capa incluida (§K-3). `filter` en los paneles choca con `oppEliminate` y crea contexto: no se recomienda. Un `::before` con z −1 caería debajo del fondo de la mesa, y aislar los paneles rompe el Z1 |
| Cartas jugadas en el centro | — | — | **No existen como elementos.** Los descartes vuelan como `.flying-card` del slot al mazo | — |
| Carta del comodín | — | — | **No existe como elemento.** Solo hay texto: `.comodin-note`, una pastilla de 999 px sin sombra, que se monta solo con 4 jugadores o más. `comodinFlash` anima `box-shadow` 0,6 s (GT:911-917). El 7 de Oros es una `.playing-card` normal | — |

**Respuesta a la pregunta clave: ¿qué elementos tienen ya un `box-shadow` o `filter` que una sombra nueva reemplazaría?**

1. `.playing-card`, en reposo, al pasar el ratón, seleccionada (con `!important`) y ganadora.
2. `.deck-pile`, en sus tres variantes.
3. `.shuffle-fan-card` y `.flying-card`.
4. `.chip-token`, por `filter`.
5. Los paneles, mientras dura `turnBreath`.
6. `.comodin-note`, durante `comodinFlash`.

**Libres:** `.pot-box`, `.call-box` y los paneles en reposo.

**Animaciones que tocan `box-shadow` o `filter`:**

- transición de `box-shadow` en `.playing-card` (PC:9);
- `turnBreath`, infinita (GT:1020);
- `vcPulso` (GT:353), `comodinFlash` (GT:913) y `oppEliminate` (OP:38);
- `filter` del botón al pasar el ratón (GT:494/497);
- `cel-posada` (celebracion.css:725), pero va fuera de la mesa.

---

## §D · Geometría (línea base del Δ=0)

Todas las cajas están en `capturas-luz/geometria.json → celdas.<id>.cajas`, junto con `ias`, `mano`, `radios` y `capas`.

**Estado medido:** fase de **descarte**, con la primera carta de la mano seleccionada, el reloj en 19 s (18 s en m3_pc) y el POZO con 50 × jugadores (250, 200, 150 y 100). Azar sembrado con 20260925 (§I).

### D.1 · Resumen de cajas (px CSS; x,y y ancho×alto)

| Celda | Mesa (marco + fieltro) | Óvalo | Zona del jugador | Mazo | POZO | Carta |
|---|---|---|---|---|---|---|
| m5_pc | 418,125 1084×830 | 728.2,391 **463.56×234** | 444,635 1032×300 | 661.2,369.8 46.5×70.4 | 757.2,433.1 112×77.5 | 115.33×162.98 |
| m4_pc | 418,125 1084×830 | 728.2,391 **463.56×234** | 444,635 1032×300 | 661.2,364 54.1×82.1 | ídem m5 | ídem |
| m3_pc | 530,125 860×830 | 630.1,391 659.91×234 | 556,635 808×300 | 934,244 54.1×82.1 | 659.1,469.3 112×77.5 | 100.59×142.16 |
| m2_pc | 530,125 860×830 | 556,455 808×170 | 556,635 808×300 | 1176,244.2 47.5×73 | 585,501.3 112×77.5 | 100.59×142.16 |
| m5/m4_s25v | 9,8 394×899 | 21,409.5 370×119 | 21,601.6 370×291.4 | 171.1,290–292 28.9×41.9 | 44,416.6 90×65.4 | 68.39×105.41 |
| m3_s25v | 9,8 394×899.4 | 21,265.5 370×332.5 | 21,602 370×291.4 | 171.1,215.6 | 44,377.1 90×65.4 | ídem |
| m2_s25v | 9,8 394×899 | 21,256 370×341.5 | 21,601.5 370×291.4 | 351,202 31×46 | 44,376.1 90×65.4 | ídem |
| m5/m4_s25h | 7,6 901×400 | 221.5,178.2 **486×37.8** | 9,220 897×176 | m5 216.3,118.7 · m4 45.1,22 (31×46) | 250.5,189.1 99.6×16 | 99.47×140.59 |
| m3_s25h | 27.5,6 860×400 | 221.5,178.2 **486×37.8** | 29.5,220 856×176 | 230.5,22 | 250.5,189.1 99.6×16 | ídem |
| m2_s25h | 27.5,6 860×400 | izquierdo 29.5,163 **129×53** · derecho 728.5,147 **157×69** (radio 14 px) | 29.5,220 856×176 | 127.5,24 | 56.7,169 74.6×41 | ídem |
| m5/m4_390 | 9,8 372×828 | 21,364.5–365 348×119 | 21,530.6 348×291.4 | 161.8,274 27.3×39.4 | 44,372 90×65.4 | 64×98.55 |
| m3_390 | 9,8 372×828.4 | 21,265.5 348×261.5 | 21,531 | 161.8,218.1 | 44,341.6 | ídem |
| m2_390 | 9,8 372×828 | 21,256 348×270.5 | 21,530.5 | 329,202 31×46 | 44,340.6 | ídem |
| m5/m4_360 | 9,4 342×632 | 21,274.8 318×96 | 21,373.6 318×250.4 | 150.3,233 25×36 | 44,283.6 86×50.2 | 58×89.83 |
| m3_360 | 9,4 342×632.4 | 21,237.5 318×134.5 | 21,374 | 149,193.5 | 44,250.1 90×65.4 | ídem |
| m2_360 | 9,4 342×632 | 21,231 318×140.5 | 21,373.5 | 299,179 31×46 | 44,250.6 90×65.4 | ídem |

- **Radios:** mesa 32 px en pc, 20 px en portrait y 16 px en landscape. Óvalo 999 px (el `.oval-right` de m2_s25h tiene 14 px). Carta 8 px en todas las celdas. Paneles de IA 18/12/10 px. Zona del jugador 22/16/14 px.
- **Scroll interno:** 0 en las 20 celdas; `scrollHeight` coincide con `clientHeight` en todas.

### D.2 · Reglas de medios efectivas por tamaño

`geometria.json` guarda cada condición evaluada **suelta** con `matchMedia`. Una condición anidada puede salir «activa» aunque su bloque padre no lo esté, así que esta tabla muestra lo **efectivo**:

| Tamaño | Bloques efectivos |
|---|---|
| **pc 1920×1080** | B + **T** + `(min-width:768px) and (min-height:900px)` (GT:1114 y TH:120: **cartas grandes activas**) + **D**, con `(pointer:fine)` (GT:5353), `(min-height:801px)` (GT:5464) y el 768×900 anidado (GT:5537). **No** entra en `max-height:800` |
| **s25v 412×915** | B + **P**, sin compresión (915 > 772) + `(pointer:coarse)` + MM:61 (el complemento de escritorio) |
| **390×844** | B + **P**, sin compresión + coarse + MM:61 |
| **360×640** | B + **P** + **P≤772 (compresión CV-2/CV-3, GT:2000-2175)** + coarse + MM:61 |
| **s25h 915×412** | B + **L** + `(min-width:773px)` (GT:3892, la variante ancha de mesa 2) + coarse + MM:61. **No** entra en P≤772, que está anidado en P |

**Hueco sin cubrir (anotado, no afecta a las 20 celdas):** una tableta en vertical con 768 px o más de ancho no cae ni en P ni en D.

### D.3 · Espacio libre alrededor del óvalo (condiciona la capa B)

| Celda | Óvalo → zona del jugador | Óvalo → panel IA de arriba | Óvalo → marco (a cada lado) |
|---|---|---|---|
| pc m5/m4 | 10 | 10 | 308 (panel IA lateral a 74) |
| pc m3 / m2 | 10 | 10 | 98 / 24 |
| s25v / 390, m5/m4 | 73 / 47 | 73 / 47 (los paneles de los lados, a 212/177) | 10 |
| s25v / 390, m3/m2 | **4** | **4** | 10 |
| 360 m5/m4 | **2,8** | **1,8** | 10 |
| 360 m3/m2 | **2** | **4 / 2** | 10 |
| s25h m5/m4/m3 | **4** | **13,5** | 178 a 212 |
| s25h m2 | **4** | pegado al panel | **0** (izquierdo contra el borde interior) |

### D.4 · Ancho del óvalo: **no es constante, y el 486 no es de escritorio**

- En **escritorio 1920** el óvalo mide **463,56** en m5/m4, **659,91** en m3 y **808** en m2. Ocupa la columna `minmax(0,1fr)` de la rejilla congelada (GT:5032/5518/5528). El comentario de GT:5489 ya registra 463,56.
- El **486** es el ancho **fijo** de L (S25 horizontal) para m5/m4/m3: `--ovl5-w: 486px` en GT:3337 y equivalentes. Allí sí se mantiene igual en las tres mesas: 486×37,8.
- En **vertical** el óvalo ocupa el ancho de la mesa menos 24: 318, 348 o 370. Su alto va de **96** (360, m5/m4) a **341,5** (s25v, m2).

---

## §E · Textos sobre el tapete

El contraste se midió **contra el fondo muestreado en la propia captura**: la moda de los píxeles de la caja del texto, cuantizada a 4 bits por canal, con la opacidad del color compuesta. Hay un dato por texto y celda en `geometria.json → celdas.*.textos` (incluye color, tamaño, peso, `text-shadow`, fondo local declarado y fondo muestreado). Abajo van los valores de m5_pc y el rango en las 20 celdas.

| Texto | Selector (definición) | Color | Tamaño / peso | Fondo local | Contraste m5_pc | Rango en 20 celdas | Posición |
|---|---|---|---|---|---|---|---|
| **Mano #N** | `.hand-badge` GT:587 | `rgba(text-primary,.45)` | 10 / 400 | **fieltro directo**, en la cabecera | **3,27** | 3,27 a 3,43 ⚠ **ya bajo AA** | **borde superior** |
| Palabra de acción («Pasó») | `.opp-status` OP:1048 (cursiva) · P:1642 · L:2517 | `text-muted` (.55) | 22 D · 13 P · 15 L / 400 | panel IA (sin pastilla) | **4,45** | 4,45 a 4,51 (a 13 px, **bajo AA**) | junto al borde en P y L |
| Reloj | `.timer-display` GT:810 · `.ls-timer` GT:833 (visible en L) | muted | 20/900 D · 18 P · 22 L | zona del jugador | 4,76 | 4,76 a 4,89 | borde inferior |
| «POZO» | `.pot-label` GT:134 | muted | 10 / 400 (8 en L m5/4/3) | pastilla `.pot-box` | 4,77 | 4,70 a 4,95 | centro |
| Nombre IA | `.opp-name` OP:71 · `.ai-name`/`.ai-label` GT:76 | `rgba(245,237,216,.65)` **literal** | 13 / 400 (12 en P m2) | panel IA | 5,64 | 5,64 a 5,96 | borde |
| Aviso de descarte | `.discard-hint` GT:460 | `rgba(text-primary,.65)` | 13 D · 11 P/L | zona del jugador | 6,05 | 6,04 a 6,15 | borde inferior |
| Wordmark | `.table-title` GT:43 (`.wm-ilei`) | gold-brand | 22 D · 18 P · 16 L / 500 | fieltro directo | 6,49 | 6,15 a 6,84 | **esquina superior izquierda** |
| Pastilla P / M | `.seat-badge-neutral(-letter)` GT:998/1006 | text-secondary | 10 / 800 | pastilla green-deep | 6,49 | 6,49 | panel |
| Nota del comodín | `.comodin-note` GT:897 | text-secondary | 11 D · 10 P · 8 L/P≤772 | pastilla surface-area | 6,68 | 6,68 a 7,33 | óvalo |
| Mensaje central | `.game-message` GT:186 (+ `.msg-win`/`-lose`/`-action-*`) | `rgba(text-primary,.88)`; gana, pierde y acción en verde, rojo y oro | 14 D · 13 P · 12 L · **9 en L m5/4/3** | **óvalo directo** | 7,23 | 6,04 (m3/m2 pc, centro más claro del óvalo) a 7,53 | centro |
| Cifra del POZO | `.pot-value` GT:142 | gold | 26 D · 20 P · 16 P≤772 · 14–18 L / 700 | pastilla | 7,58 | 7,49 a 8,14 | centro |
| Saldo del jugador | `.pbr-chips .bd-num` | gold | 18 / 700 | zona del jugador | 7,85 | 7,85 a 8,05 | borde inferior |
| Mesa N | `.pbr-mesa` | gold en D; text-secondary en P/L | 14 D · 11 P/L | zona del jugador | 7,94 | 7,33 a 7,94 | borde inferior |
| MANO (humano) | `.seat-badge-gold` GT:992 | text-dark | 10 / 800 | pastilla de oro | 9,51 | 9,51 | borde |
| «Tú» | `.pbr-name` | text-primary | 14 D · 11 P/L / 700 | zona del jugador | 12,4 | 12,4 a 13,15 | borde |

**Textos que no aparecen en el estado capturado y no tienen medida.** Tienen fondo propio, salvo que se indique otra cosa:

- `.chip-balance-float` (saldo flotante de la IA): gold 14/800, **sin pastilla pero con `text-shadow`** doble (OP:529-531). Aparece solo tras tocar la ficha.
- `.opp-status-turn` / `-allin` (oro) y `-elim` (lose-red 16/700).
- La pastilla **TURNO** y `.win-score-chip` (text-dark sobre oro).
- `.timer-warning` (lose-red, con pulso).
- `.pot-float` «+N» (gold 16/800, **sobre el óvalo sin pastilla**).
- `.call-value` (bet-orange sobre pastilla naranja).
- `.elim-notice-inline` (gold 12/700, **sobre el óvalo sin pastilla**).
- `.game-over-msg` (gold 22/700, **sobre el fieltro sin pastilla**).
- `.score-tag`.
- `.msg-action-fold` en **`#b71c1c` sobre verde**: es un rojo oscuro, a vigilar.

**Por qué importa para la capa A.** Los cuatro textos más débiles (Mano #N, Pasó, reloj y POZO) están en los **bordes o cerca**, justo donde A oscurece. «Mano #N» ya no cumple hoy.

---

## §F · Punto de enganche

1. **Quién dibuja la mesa:** `GameTable.jsx`. `<main className="game-table-screen">` está en JSX:1956 y `<section className="game-table …">` en JSX:1966-1971 (marco + fieltro). Los óvalos salen de `renderCenterZone` (JSX:1847) y `renderTwoOvalsZone` (JSX:1923-1945). **`GameTable.jsx` NO está en la lista de protegidos** (v1.5 §2: gameEngine, aiPlayer, deck, seatLayouts, opponentPanel.css y gameTable.css). Un aviso de doctrina, que no es regla: el comentario de JSX:1950-1954 pide dejar ese árbol «intacto: ni una clase, ni un atributo, ni una caja».

2. **Dónde meter un elemento superpuesto:**
   - **Recomendación: no hace falta.** A y D son capas de `background` en `.game-table`, E es una capa de `background` en `.center-zone`, y B es `box-shadow` en `.center-zone` y `.game-table`. Nada de eso cambia cajas ni apilamiento, y **por construcción queda entre el tapete y el contenido**, porque el fondo y la sombra de un elemento se pintan antes que sus hijos.
   - **Si aun así se quiere un elemento:** iría como primer hijo de `section.game-table`, entre JSX:1971 y JSX:1973, antes de `<header>`, con `position:absolute; inset:0; pointer-events:none; border-radius:inherit; z-index:-1`. Eso obliga a darle a `.game-table` **`position:relative` + `isolation:isolate`**, y la mesa hoy es `static` en D y en parte de P (§A.2). Hay dos riesgos que verificar: que algún descendiente absoluto se re-ancle, y que los z internos (paneles 7/8, lupa 9) queden encerrados en el contexto nuevo. Existe un precedente del mismo molde en celebracion.css:348-364 (`.cel-screen` + `.cel-lluvia`).
   - Nada consulta los hijos de `.game-table` por posición: no hay `:first-child` ni `nth-child`, según grep.

3. **Dónde importar la hoja nueva:**
   - Vite inyecta el CSS en el orden de evaluación de los imports: theme, index, embellecimiento, tapetes y menuMovil (main.jsx) → las pantallas que importa App → `gameTable.css` (JSX:2) → `apu.css` (JSX:3) → `playingCard.css` (vía PlayingCard, JSX:4) → **`opponentPanel.css` (vía OpponentPanel, JSX:5)** → el resto.
   - Un import en JSX:4 cargaría **antes** de `opponentPanel.css`. **Tiene que ir detrás de la línea 5**; lo más limpio es al final de los imports de `GameTable.jsx`. Así gana por orden a igual especificidad sobre GT, OP y PC.
   - **Especificidad que necesita cada regla**, sin `!important`:
     - `.game-table`: **0,2,0** (`.game-table-screen .game-table`) gana a GT y a TP en verde, grafito, azul y vinotinto, que solo cambian tokens. Para el tricolor hace falta además **0,3,1** (`body[data-tapete="tricolor"] .game-table-screen .game-table`), o dejar el tricolor fuera de A y D.
     - `.center-zone`: **0,2,0** cubre las tres pieles duplicadas (B, P y L), que son de 0,1,0, salvo las de L con `.table-five .center-zone` (0,2,0), a las que se gana por orden. La mesa 2 en L necesita `.table-two .felt-oval` (0,2,0, GT:4036) o más.
     - Paneles: `.opp-panel` en L va con `.game-table.table-N .opp-panel` (OP:574-579). Para ganar por orden hace falta 0,3,0.
     - Precedentes: apu.css gana por orden más un compuesto; EMB por elemento + clase; TP por tokens en `body[attr]`; menuMovil por el ámbito `.game-table-screen …`. **No hay ningún `:where()` en el repo.**
   - **Al pisar una propiedad hay que repetir el valor actual:** `background` de `.game-table` es `var(--surface-game)`; `box-shadow` de `.game-table` son tres capas, y la de `.center-zone`, dos inset.

4. **Fugas:**
   - **Ninguna otra pantalla usa las clases de la mesa.** `.game-table`, `.center-zone`, `.felt-oval`, `.player-zone`, `.rivals-zone`, `.opp-panel`, `.pot-box`, `.card-slot-wrapper`, `.deck-pile` y `[data-tapete]` solo aparecen en comentarios fuera de GT, OP y los componentes de mesa.
   - **PartidaPvP no dibuja `GameTable`:** es un esbozo `.sal-*`.
   - **La sala de espera (SAL-3)** tiene su propio óvalo, `.sal-esp-mesa` / `.sal-esp-ovalo` (salas.css:849-870).
   - **Lo que sí se comparte son los TOKENS de fieltro:** salas.css:162-164, 207, 862 (el óvalo de espera usa `--surface-game`), 919, 1086; lobby.css:166-168, 199, 532; portada.css:67-69, 303, 573-623; welcome.css; puerta.css:49-50, 118; cuenta.css:70.
   - **Regla para la Fase 1:** no redefinir tokens en `:root`. Si la hoja nueva queda acotada a `.game-table-screen …`, no se filtra a otras pantallas.
   - `data-tapete` vive en `body` (useTapetes.js:124-128) y solo mientras la mesa está montada.

---

## §G · Rendimiento en móvil (inventario, sin medir fotogramas)

- **`will-change`:** solo `.vc-ficha` (`transform, opacity`, GT:335, vuelo de monedas) y `.cel-gota` (pantalla de victoria).
- **`translateZ` / `translate3d`:** ninguno en `src`. Hay 3D temporal en `cardFlipReveal` y `cardFlipClose` (`perspective(600px) rotateY`, GT:1094-1109).
- **`mix-blend-mode`:** **ninguno** en todo `src`.
- **`backdrop-filter`:** solo en modales: `.leave-overlay` blur(3px) (GT:674) y `.bankrupt-overlay` blur(4px) (GT:724), este último anulado en `.apu-suave` (apu.css:143).
- **`filter` en la mesa:**
  - `.chip-token` drop-shadow (CT:5), hasta unas 14 monedas a la vez;
  - `.btn:hover` brightness (GT:494/497);
  - `oppEliminate` (OP:39-41).
  - **Las cartas, el mazo y los paneles no llevan `filter` en reposo.**
- **Animaciones continuas sobre la mesa:**
  - **`turnBreath`** (GT:1017/1020): `box-shadow` con halo de 10 a 26 px, 2,4 s, **infinita siempre que haya turno**. **Es la única que repinta de forma continua durante el juego.**
  - `timerPulse` (GT:822/825): transform + opacity, infinita solo en los últimos segundos.
  - `emb-u3-recorrido` (EMB:119/133): anillo cónico por `@property`, infinito mientras existe el popup «Mano actual», unos 4 s.
  - El resto (`fanOut`, `potPulse`, `msgPop`, `reflowSettle`, `comodinFlash`, `vcPulso`, `oppEliminate`, `vcAjilei`…) son de un solo ciclo.
  - **No existe ninguna animación de «respiración» de marca de agua.** `emb-brillo` es del título de la Portada y de la celebración, no de la mesa (EMB:136-139).
- **Lectura para LUZ-1:**
  - Las capas de `background` estáticas sobre `.game-table` y `.center-zone` solo se repintan cuando se repinta su caja. `turnBreath` repinta los **paneles**, no la mesa.
  - Una `filter: drop-shadow` en cada carta (vía C) añade hasta unas 25 capas filtradas. Es estático, pero conviene medirlo en el S25 dentro de la Fase 1.

---

## §H · Arnés

- **Modos que miden cajas de la mesa** (todos en `scripts/diagDSK.mjs`): `d1d2`, `shots`, `gate` (capturas en WAITING), `b1`, `p1`, `p2`, `r1`, `r2`, `o1`, `o2`, `h1`, `m1`, `a1`, `a2`, `f1`, `z1`, `u1`, `menu-movil`, `apu`, `msg`, **`tapetes`** y `vuelo`.
  - **Ninguno cubre las 4 mesas × 5 tamaños de LUZ-1.** `shots` es solo m5 y en 4 viewports de escritorio. `tapetes` hace m5 y m2 en 1920×937 y 1024×768, más 360×640 y 740×360. `apu` usa la foto 412×915 (`S25_VERTICAL`, diagDSK.mjs:2049).
  - **No existe un perfil S25 horizontal con nombre.** Aquí se usó 915×412, que es el vertical girado.
- **Cómo llega el arnés a la mesa:**
  - `gotoMesa(page, n)` → `recorrerRuta` (`scripts/rutaMesa.mjs`): lobby → `[data-accion="jugar-ia"]` → reto → jugadores → apuesta → entrada → CTA. Aterriza en **WAITING** (antes de «Iniciar mano»).
  - Exige **5173 con `VITE_AUTH_BYPASS=1`**. En `vite preview` (4173) aparece la Portada y no llega al lobby; lo comprobó el modo `sonda4173` de esta fase: `{lobby:false, mains:["portada-activa", …]}`. **Por eso las capturas se tomaron contra 5173** (§1.6 de la ficha).
  - A partir de ahí, cada modo juega con `playToShowdown`, `jugarHasta` o `msgJuegaUnaMano`. `msgSiembraAzar` siembra `Math.random` para que el reparto sea reproducible.
- **Propuesta del modo permanente `luz`** (no está escrito):
  1. **Δ=0 en caliente, en la misma página, sin azar**, con el molde de `tapetes`. Se llega a la celda, se miden las cajas de §D con la hoja de luz **activa**, se desactiva la hoja (`styleSheet.disabled = true` sobre la `<style>` de `luz.css`; en dev Vite la etiqueta con `data-vite-dev-id`), se vuelve a medir y se compara. **Verde solo con Δ=0 exacto** en todas las cajas y en `scroll*`. Así no hace falta una línea base guardada ni reproducir la mano. El `geometria.json` de esta fase queda como línea base **histórica**, contra el mismo estado sembrado.
  2. **Las mismas 20 celdas**, con el estado sembrado de §I (semilla 20260925, descarte con la primera carta seleccionada), en DPR 2 y con los mismos nombres de PNG, en `capturas-luz/`. En los teléfonos, `hasTouch`/`isMobile` como `tactil` y `apu`.
  3. **Contraste:** el mismo muestreo que `capturaLuz.mjs` (la moda del fondo en la propia captura), por texto y celda, con la hoja **encendida y apagada**. Una vara que proponer al rector: no bajar de 4,5 lo que hoy está en 4,5 o más, y no empeorar lo que hoy está por debajo (Mano #N 3,27, Pasó 4,45).
  4. Una cuarta puerta barata: **que los fondos de mesa, óvalo y pantalla de las otras pantallas no cambien.** Se mide `background` y `box-shadow` computados en el lobby, la sala de espera y la Portada, con la hoja de luz cargada.
- Un aviso heredado: `.gitignore` ignora las carpetas `capturas-*` una por una. `capturas-luz/` **no está ignorada** (la ficha lo quiere así en esta fase), y su línea entra en la ficha de commits de la Fase 1.

---

## §I · Capturas y geometría

- **Carpeta `capturas-luz/`:** 22 archivos, **15 MB**. Son 20 PNG en DPR 2, pantalla completa del viewport sin recortar, más `geometria.json` (≈0,5 MB) y el script `capturaLuz.mjs`.
- **Tamaños:**
  - `pc` = 1920×1080;
  - `s25v` = **412×915** (el `S25_VERTICAL` del arnés);
  - `s25h` = **915×412** (el mismo, girado);
  - `390` = 390×844;
  - `360` = 360×640.
  - Los teléfonos llevan `hasTouch` + `isMobile` (puntero grueso), como `tactil` y `apu`.
- **Comando exacto** (servidor 5173 con bypass, que ya estaba corriendo):
  ```
  LUZ_TMP=<scratchpad>/luz node capturas-luz/capturaLuz.mjs celdas 5,4      # y en paralelo:
  LUZ_TMP=<scratchpad>/luz node capturas-luz/capturaLuz.mjs celdas 3,2
  LUZ_TMP=<scratchpad>/luz node capturas-luz/capturaLuz.mjs niveles         # §B, sin PNG
  LUZ_TMP=<scratchpad>/luz node capturas-luz/capturaLuz.mjs sonda4173       # §H
  LUZ_TMP=<scratchpad>/luz node capturas-luz/capturaLuz.mjs unir            # → geometria.json
  ```
  Los JSON intermedios de cada celda quedan fuera del repositorio, en el scratchpad. Cada celda tarda entre 16 y 32 s.
- **Estado de partida, reproducible:**
  1. Ruta canónica: Básico, apuesta 0 (50), entrada «medio».
  2. `Math.random` sembrado con **20260925** justo antes de «Iniciar mano».
  3. El humano pasa o iguala hasta el **descarte** y selecciona **la primera carta**.
  - Se ve en las 20 celdas:
    - la mano del jugador con **una carta seleccionada, con su brillo dorado**;
    - el **reloj** («19s»);
    - el POZO con las 5 apuestas;
    - el mazo del Pie;
    - los paneles con nombre, ficha y «Pasó»;
    - la nota del comodín en m5/m4;
    - el mensaje central «Selecciona hasta N cartas a descartar».
- **Qué no se alcanzó de forma reproducible, y por qué:**
  - **La pastilla TURNO del humano y el `turnBreath`.** En la fase de descarte no hay asiento con turno (el descarte es simultáneo): `transitorios.turnoHumano = false` en las 20 celdas. **TURNO y reloj no conviven en el descarte.** TURNO + reloj + `turnBreath` solo existen en el turno de apuesta del humano, y ahí no hay carta seleccionada. Si la lámina necesita el halo, hace falta una segunda serie en la fase de apuesta (§K-4).
  - **Los estados de carta ganadora, reparto, barajado y recogida** son transitorios y no se capturaron. Sus sombras están inventariadas en §C.
  - **El saldo flotante de la IA** (`chip-balance-float`) necesita tocar la ficha. No se hizo, porque la ficha pide el peor caso de la mano y no de los menús.
  - Una nota sobre el campo `transitorios.turnoIA` de `geometria.json`: el selector del script incluye `.seat-badge-letter`, así que cuenta la pastilla «P» del Pie. **No indica ningún turno de IA**; es un falso positivo del script.
- **`geometria.json`**, por celda:
  - viewport, DPR y si es móvil;
  - medios activos (condiciones sueltas; ver la advertencia de §D.2);
  - `scroll`;
  - `cajas` (pantalla, mesa, cabecera, rivales, `tableMid`, `midCenter`, óvalo o los dos óvalos, zona y barra del jugador, mazo, pozo, a igualar, mensaje, comodín), cada caja con su `radio`;
  - `ias` (vía, nombre, caja, radio y cartas);
  - `mano` (envoltorio, carta con sus clases, radio, `box-shadow`, `transform` y `filter`, e `img`);
  - `radios` (mesa, óvalo, pantalla, carta);
  - `capas` (estilos computados, pseudos y contexto de apilamiento);
  - `textos` (§E).

---

## §J · Hallazgos y contradicciones

1. **El óvalo de 486 px no es de escritorio** (la ficha, §3.D, lo da como referencia de escritorio). En 1920×1080 mide **463,56** en m5/m4, 659,91 en m3 y 808 en m2, y no tiene ancho fijo. El 486 es el ancho fijo de **L** (S25 horizontal) en m5/m4/m3.
2. **La compresión `max-height:772px` solo se activa en 360×640** entre las cinco celdas. No en s25v (915), ni en 390 (844), ni en s25h, porque en horizontal ese bloque está anidado en P y no aplica.
3. **Líneas verticales claras a los lados de la mesa en pc.** Son el `border-inline: 1px solid var(--border)` de `#root` (IX:57-67), que viene de la plantilla de Vite: `--border` vale `#e5e4e7` en claro. Se ven en `m*_pc.png` a x≈397 y x≈1523. Lobby, Portada y salas lo anulan con `body.X #root`; **la mesa no**. Es deuda visual previa a LUZ-1: queda anotada y no se corrige aquí.
4. **«Mano #N» (`.hand-badge`) ya incumple AA:** 3,27:1 a 10 px, sobre el fieltro. «Pasó» (`.opp-status`) está en 4,45 a 13 px en móvil, también por debajo de 4,5.
5. **`.msg-win` / `.msg-lose` pierden su tamaño de 15 px en P y L,** porque `.game-message` de P/L se declara después con la misma especificidad. Lo detectó el inventario estático; no se midió.
6. **`.msg-action-fold` usa `#b71c1c` sobre el verde del óvalo:** es un rojo oscuro con contraste bajo previsible. No se midió porque no salió en el estado capturado.
7. El comentario de `useTapetes.js:50` sobre un «gate de escritorio» está **desfasado**: el atributo se aplica en todos los modos desde MOV-1b-a.
8. `.card-deal-anim` (GT:851) está definida y **ningún JSX la usa**.
9. **Únicas declaraciones `!important` del CSS de `src`:** PC:24-26 (carta seleccionada). La palabra aparece en otras 13 hojas y archivos, pero siempre dentro de comentarios; se comprobó con grep. No es un protegido, pero cierra la vía `box-shadow` de C para ese estado (§K-2).
10. **Lint:** 20 errores como se esperaba, **más 1 aviso** que la ficha no menciona.
11. **Deriva del navegador:** Edge 153.0.4234.48 frente a las líneas base 151.0.4129.93. Es la conocida.
12. **Ya existe una textura de fondo:** la filigrana a ±45° de la pantalla, que se transparenta un 12 % por el fieltro. La capa D se sumaría a ella.

---

## §K · Preguntas al rector (solo las que bloquean la lámina o la Fase 1)

1. **Capa A frente a los textos del borde.** Oscurecer los bordes baja «Mano #N», que ya incumple, y deja «Pasó», el reloj y «POZO» por debajo de 4,5. Las opciones son tres: (a) la viñeta respeta la franja de cabecera y la de la zona del jugador; (b) la Fase 1 acepta un ajuste de color de esos textos, que viven en GT, que es protegido, así que sería por hoja nueva y por especificidad; (c) se acepta perder contraste. ¿Cuál?
2. **Capa C en la carta seleccionada.** Su `box-shadow` lleva `!important` (PC:24-26). Las opciones son dos: (a) usar `filter: drop-shadow` en todas las cartas, que se suma sin conflicto, cuesta un contexto por carta y hay que medirlo en el S25; (b) que la seleccionada se quede sin sombra de contacto, porque su halo dorado ya hace ese papel. ¿Cuál?
3. **Paneles con turno.** Para que la sombra de contacto sobreviva a `turnBreath` hay que **redefinir `@keyframes turnBreath`** en la hoja nueva con la capa de contacto dentro. La sombra de contacto seguiría constante, pero técnicamente viajaría dentro de una animación, y la regla dice «sombras animadas no». ¿Se autoriza, o los paneles con turno pierden la sombra de contacto mientras respiran?
4. **¿La lámina necesita el estado de apuesta?** Es el que tiene TURNO + reloj + `turnBreath`, y no puede tener carta seleccionada. Si hace falta, sería una segunda serie de 20 capturas con el mismo script y una bandera de estado, unos 6 minutos.
5. **Capa B en móvil.** Con 1,8 a 4 px libres alrededor del óvalo, ¿el riel pasa a ser **interior** (inset) en P y L y exterior solo en D? ¿Se incluye en B el marco dorado de la mesa, que tiene espacio de sobra en todas las celdas?
6. **Capa E en S25 horizontal.** Con 486×37,8, y dos piezas de 129×53 y 157×69 en m2, ¿se omite la marca de agua en L?
7. **¿Entra el tricolor?** Si A y D se aplican también al tricolor, hace falta una regla de especificidad 0,3,1 y la luz se superpone a sus bandas. ¿Entra, o se excluye?

---

## §L · Estimación de la Fase 1 (minutos de Claude Code)

| Bloque | Minutos |
|---|---|
| Hoja `luz.css` con A, B, D y E (capas de `background` y `box-shadow`, variantes P, L, D y m2 en L, más el tricolor si entra) | 40–60 |
| Capa C (según §K-2 y §K-3: `drop-shadow` en cartas, redeclarar mazo, fichas y pozo, más los keyframes de turno) | 30–45 |
| Modo `luz` en el arnés (Δ en caliente + 20 capturas + contraste encendido y apagado + puerta de fugas) | 45–60 |
| Corridas completas (20 celdas × 2 estados de hoja; unos 6 minutos por pasada en 2 procesos) y ajustes | 30–45 |
| Informe, ficha de commits y línea de `.gitignore` | 20–30 |
| **Total comprimible** | **≈ 2 h 45 min a 4 h** |
| **No se comprime:** la validación de Victor en teléfonos reales (S25 vertical y horizontal: legibilidad de los textos del borde, fluidez con `drop-shadow` en las cartas y rebote de `turnBreath`) y las vueltas de la lámina con el rector | lo que tarde Victor |
