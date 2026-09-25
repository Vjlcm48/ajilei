# AJILEI · LUZ-1 · Fase 1 · Informe de implementación · v1.0

**Fecha:** 2026-09-25 · **Base:** `main` en `90f9539`, sin commits · **Ficha:** `AJILEI_LUZ-1_Fase1_v1.0.md`
**Ejecutó:** Claude Code · **Rector:** Claude (chat) · **Decide:** Victor
**Tiempo empleado:** unos 30 minutos de reloj, de 06:56 a 07:25 (tope: 3 h).

**Hoja de contacto:**
- en local: `capturas-luz/fase1/hoja.html`, 7 MB, autocontenida;
- publicada, privada, para abrirla en el teléfono: https://claude.ai/artifact/KJiwxgvqyzn5xaCrxDWRj1

Abreviaturas: **GT** `src/styles/gameTable.css` · **OP** `src/styles/opponentPanel.css` · **PC** `src/styles/playingCard.css` · **CT** `src/components/ChipToken.css` · **TP** `src/styles/tapetes.css` · **IX** `src/index.css` · **JSX** `src/components/GameTable.jsx`.
Bloques de medios, los de la Fase 0:
- **B**: base;
- **P**: `(max-width:767px) and (orientation:portrait)`;
- **L**: `(orientation:landscape) and (max-height:600px)`;
- **D**: `(orientation:landscape) and (min-height:601px)`.

---

## Resumen

| Puerta del modo `luz` | Resultado |
|---|---|
| 1 · Cajas sin cambio (Δ = 0) en caliente | ✓ en las 20 celdas y los 4 tapetes: todas las cajas de la mesa, `#root` y el scroll, con Δ exacto de 0 |
| 2 · Contraste | ✓ en 24 de 24: ningún texto que estuviera en 4,5 o más baja de ahí, ningún texto por debajo empeora. «Mano #N» queda entre **4,86 y 5,61** (hoy 3,27–3,43) y los «Pasó» entre **5,08 y 5,61** (hoy 4,45–5,13) |
| 3 · Estados de carta | ✓: seleccionada, ganadora, vacía y, en D, jugable con el ratón encima conservan su `box-shadow` exacto. `turnBreath` sigue solo en los paneles |
| 4 · Fugas a otras pantallas | ✓: lobby, sala de espera y Portada, a 390×844 y a 1920×1080. De 93 a 114 elementos por pantalla, **0 distintos** |
| 5 · Validez del token | ✓: `--luz-k` = 1 y las 11 propiedades comprobadas computan valores válidos y distintos de los de hoy |

**Veredicto del modo: VERDE.** El tricolor **entra**.

Resto de comprobaciones:
- Pruebas: 993/993.
- Lint: los mismos 20 errores y 1 aviso, ninguno en líneas nuevas.
- `gate`: 6/6.
- Build limpio.
- Protegidos intactos.

---

## 1 · Qué se implementó

### 1.1 Archivos

| Archivo | Cambio |
|---|---|
| `src/styles/luz.css` | **Nuevo**, 250 líneas, casi la mitad comentario |
| `src/components/GameTable.jsx` | **Una línea:** `import '../styles/luz.css'`, justo detrás del último import (el de `gameEngine`). El árbol JSX no se toca |
| `scripts/diagDSK.mjs` | El modo `luz`: su documentación en la cabecera, `irALaMesa` en el import de `rutaMesa.mjs`, la línea del despachador y el bloque `runLuz` con sus ayudantes |
| `docs/AJILEI_Sistema_Diseno_v1.2.md` | La nota **7** del §12, al final. No se renumera nada |
| `.gitignore` | `capturas-luz/`, con su comentario |
| `capturas-luz/fase1/` | 24 PNG y `hoja.html`, 30 MB en total. Ignorada por git |

**Orden de carga comprobado en el bundle de producción.** La hoja de luz va detrás de las reglas base que empatan con ella:
- `.card-winner` en el carácter 136 017;
- `.card-empty` en el 136 113;
- `.chip-token` de CT, la última aparición, en el 166 193;
- el bloque de `luz.css` empieza en el 169 881.

En desarrollo el orden es el mismo, porque el import de la hoja es el último del módulo.

### 1.2 Estructura de `luz.css` y especificidades

| § | Regla | Especificidad | Propiedades |
|---|---|---|---|
| 0 | `.game-table-screen` (y el mismo selector en L y D) | 0,1,0 | Tokens locales: `--luz-k`, `--luz-foco`, `--luz-capa-a`, `--luz-riel`, `--luz-contacto`, `--luz-mazo-negra`, `--luz-ficha` |
| 1 | `.game-table-screen .hand-badge` | 0,2,0 | `color` |
| 1 | `.game-table-screen .opp-status:not(.opp-status-turn, .opp-status-allin, .opp-status-elim)` | 0,3,0 | `color` |
| 1 | `#root:has(.game-table-screen)` | 1,1,0 | `border-inline-color` |
| 2 | `.game-table-screen .game-table` | 0,2,0 | `background-image`, `background-repeat` |
| 2 | `body[data-tapete="tricolor"] .game-table-screen .game-table` | 0,3,1 | `background-image` |
| 3 | `.game-table-screen .center-zone`, `.game-table-screen .table-two .felt-oval` | 0,2,0 / 0,3,0 | `box-shadow` (riel) |
| 3 | `.game-table-screen .center-zone`, `.game-table-screen .table-two .felt-oval.oval-left` | 0,2,0 / 0,4,0 | `background-image`, `-size`, `-position`, `-repeat` (reflejos) |
| 4 | `.game-table-screen :where(.playing-card:not(.flying-card, .shuffle-fan-card, .card-winner, .card-empty))` | 0,1,0 | `box-shadow` |
| 4 | `.game-table-screen .pot-box` | 0,2,0 | `box-shadow` |
| 4 | `.game-table-screen .deck-pile` / `… .deck-pile.opp-deck` / D: `… .player-zone .deck-pile`, `… .ai-zone .deck-pile` | 0,2,0 / 0,3,0 / 0,3,0 | `box-shadow` |
| 4 | `.game-table-screen :where(.chip-token)` | 0,1,0 | `filter` |

Todos los alfas de A, B1 y C llevan `calc(<alfa> * var(--luz-k))`. Las fichas no, por decisión de la ficha (§5.3). Los valores por modo son exactamente los de la ficha: focos de 180, 80 y 85 px, riel, contacto, capa negra del mazo y fichas.

### 1.3 Declaraciones pisadas: valor original → valor repetido

| Propiedad | Original (archivo:línea) | Qué se repite, literal | Qué se añade o sustituye |
|---|---|---|---|
| `box-shadow` del óvalo | GT:118 (B), GT:1286 (P), GT:2666 (L), GT:4045 (`.table-two .felt-oval`, L). Las cuatro son iguales | `inset 0 0 44px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(var(--gold-brand-rgb), 0.10)` | Detrás: `var(--luz-riel)`, una sombra en P y L y dos en D |
| `background` del óvalo | GT:111, GT:1279, GT:2659, GT:4038, iguales | `radial-gradient(ellipse at center, var(--green-bright) 0%, var(--green-base) 48%, var(--green-deep) 100%)` como **última** capa | Delante: los dos SVG de reflejos. El `.oval-right` (GT:4133, radio 14) no los lleva |
| `background` de `.game-table` | GT:25, `var(--surface-game)` | No se toca: solo se declara `background-image` | Las seis capas de A |
| `background` del tricolor | TP:268-278 | Sus dos capas (viñeta radial y bandas lineales), literales, **detrás** de A | — |
| `box-shadow` de `.deck-pile` | GT:644 | `2px 2px 0px 0px #7a0000, 4px 4px 0px 0px #8B0000, 6px 6px 0px 0px #6b0000` | Capa negra: antes `8px 8px 6px rgba(0,0,0,0.4)`, ahora `var(--luz-mazo-negra)` |
| `box-shadow` de `.deck-pile.opp-deck` | OP:203 | `1px 1px 0px 0px #7a0000, 2px 2px 0px 0px #8B0000, 3px 3px 0px 0px #6b0000` | Capa negra: antes `4px 4px 4px rgba(0,0,0,0.4)`, ahora `var(--luz-mazo-negra)` |
| `box-shadow` de los mazos en D | GT:4703 (`.player-zone .deck-pile, .ai-zone .deck-pile`) | Las mismas tres capas de 1/2/3 px | Igual que la fila anterior |
| `box-shadow` de la carta en reposo | PC:7, `1px 3px 8px rgba(0, 0, 0, 0.3)` | — (se sustituye) | Difusa y apoyo de la ficha §5.2 |
| `box-shadow` de `.pot-box` | Ninguno (GT:128 solo pinta el fondo) | — | Difusa y apoyo |
| `filter` de `.chip-token` | CT:5, `drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45))` | — (se sustituye, no se añade) | Dos `drop-shadow` según el modo |
| `color` de `.hand-badge` | GT:589, `rgba(var(--text-primary-rgb), 0.45)` | El mismo token | Alfa 0,62 |
| `color` de `.opp-status` | OP:1051, `var(--text-muted)`, que vale `rgba(245, 237, 216, 0.55)` (theme:81) y es el mismo color que `--text-primary-rgb` (theme:79) | El color base, vía `--text-primary-rgb` | Alfa 0,64. El token `--text-muted` no se toca |
| `border-inline` de `#root` | IX:62, `1px solid var(--border)` | El ancho (1 px) no se toca | Solo `border-inline-color: transparent` |

**Inventario de `color` en «Pasó»** (ficha §4.2). Estas son **todas** las declaraciones de `color` que alcanzan a `.opp-status`. Se buscaron con postcss sobre todas las hojas de `src`.

| Declaración | Especificidad | Qué pasa |
|---|---|---|
| OP:1051 `.opp-status` → `var(--text-muted)` | 0,1,0 | La luz la gana con 0,3,0 |
| OP:1057 `.opp-status-turn` → `var(--gold-brand)` | 0,1,0 | Queda **fuera** del selector por el `:not`, así que no compite |
| apu.css:66 `.opp-status.opp-status-allin` → `var(--gold-brand)` | 0,2,0 | Fuera por el `:not` |
| OP:46 `.opp-status.opp-status-elim` → `var(--lose-red)` | 0,2,0 | Fuera por el `:not` |

No existen declaraciones de `color` para `.opp-status` dentro de P ni de L; la ficha las daba por existentes, y eso se aclara en la desviación 4. Las dos vías de dibujo usan las mismas clases:
- `opp-panel`, en OpponentPanel.jsx:165;
- `.ai-zone` de la mesa 2, en JSX:1728.

La puerta 2 midió «Pasó» en las dos vías.

---

## 2 · Las cinco puertas, celda a celda

Comando:

```
node scripts/diagDSK.mjs luz [mesas] [tamaños]
```

- Servidor: 5173 con `VITE_AUTH_BYPASS=1`.
- La Portada se mide contra `LUZ_BASE_PORTADA`, por defecto 5174 (ver §5).
- Semilla 20260925, descarte con la primera carta seleccionada, DPR 2.
- Edge 153.0.4234.48. El arnés avisa, como siempre, de que las baselines se tomaron con la 151.

| Celda | 1 · Δ (elementos) | 2 · contraste | «Mano #N» hoy → con luz | «Pasó» con luz, mín. (n) | 3 · estados | 5 · token |
|---|---|---|---|---|---|---|
| m5_pc | ✓ 0 (181) | ✓ 24 textos, 0 fallos | 3,27 → 4,86 | 5,25 (4) | ✓ | ✓ |
| m5_s25v | ✓ 0 (176) | ✓ 24 textos, 0 fallos | 3,37 → 5,02 | 5,27 (4) | ✓ | ✓ |
| m5_s25h | ✓ 0 (177) | ✓ 24 textos, 0 fallos | 3,38 → 5,07 | 5,25 (4) | ✓ | ✓ |
| m5_390 | ✓ 0 (176) | ✓ 24 textos, 0 fallos | 3,37 → 5,01 | 5,27 (4) | ✓ | ✓ |
| m5_360 | ✓ 0 (176) | ✓ 24 textos, 0 fallos | 3,37 → 5,01 | 5,27 (4) | ✓ | ✓ |
| m4_pc | ✓ 0 (153) | ✓ 22 textos, 0 fallos | 3,27 → 4,86 | 5,24 (3) | ✓ | ✓ |
| m4_s25v | ✓ 0 (149) | ✓ 22 textos, 0 fallos | 3,38 → 5,34 | 5,27 (3) | ✓ | ✓ |
| m4_s25h | ✓ 0 (150) | ✓ 22 textos, 0 fallos | 3,38 → 5,07 | 5,39 (3) | ✓ | ✓ |
| m4_390 | ✓ 0 (149) | ✓ 22 textos, 0 fallos | 3,38 → 5,34 | 5,27 (3) | ✓ | ✓ |
| m4_360 | ✓ 0 (149) | ✓ 22 textos, 0 fallos | 3,43 → 5,25 | 5,27 (3) | ✓ | ✓ |
| m3_pc | ✓ 0 (124) | ✓ 19 textos, 0 fallos | 3,27 → 4,86 | 5,24 (2) | ✓ | ✓ |
| m3_s25v | ✓ 0 (121) | ✓ 19 textos, 0 fallos | 3,37 → 5,02 | 5,34 (2) | ✓ | ✓ |
| m3_s25h | ✓ 0 (121) | ✓ 19 textos, 0 fallos | 3,43 → 5,61 | 5,25 (2) | ✓ | ✓ |
| m3_390 | ✓ 0 (121) | ✓ 19 textos, 0 fallos | 3,37 → 5,01 | 5,34 (2) | ✓ | ✓ |
| m3_360 | ✓ 0 (121) | ✓ 19 textos, 0 fallos | 3,37 → 5,01 | 5,33 (2) | ✓ | ✓ |
| m2_pc | ✓ 0 (91) | ✓ 17 textos, 0 fallos | 3,27 → 4,86 | 5,08 (1) | ✓ | ✓ |
| m2_s25v | ✓ 0 (89) | ✓ 17 textos, 0 fallos | 3,37 → 5,02 | 5,27 (1) | ✓ | ✓ |
| m2_s25h | ✓ 0 (96) | ✓ 17 textos, 0 fallos | 3,43 → 5,61 | 5,38 (1) | ✓ | ✓ |
| m2_390 | ✓ 0 (89) | ✓ 17 textos, 0 fallos | 3,37 → 5,01 | 5,24 (1) | ✓ | ✓ |
| m2_360 | ✓ 0 (89) | ✓ 17 textos, 0 fallos | 3,37 → 5,01 | 5,17 (1) | ✓ | ✓ |
| *m5_s25v grafito* | ✓ 0 (176) | ✓ 24, 0 | 3,84 → 5,97 | 6,18 (4) | ✓ | ✓ |
| *m5_s25v azul* | ✓ 0 (176) | ✓ 24, 0 | 3,72 → 5,80 | 6,02 (4) | ✓ | ✓ |
| *m5_s25v vinotinto* | ✓ 0 (176) | ✓ 24, 0 | 3,59 → 5,65 | 5,96 (4) | ✓ | ✓ |
| *m5_s25v tricolor* | ✓ 0 (176) | ✓ 24, 0 | 3,78 → 5,84 | 6,10 (4) | ✓ | ✓ |

Las columnas «hoy» salen de la misma página con la hoja apagada, y reproducen las cifras de la Fase 0: «Mano #N» 3,27 en pc y «Pasó» desde 4,45. Todos los textos quedaron emparejados entre encendida y apagada (0 sin pareja).

**Puerta 4 · fugas:**

| Pantalla | 390×844 | 1920×1080 | Borde de `#root` |
|---|---|---|---|
| Lobby (`main.lobby`) | ✓ 93 elementos, 0 distintos | ✓ 93, 0 | `0px` (lo pone `body.lobby-activa`) |
| Sala de espera (`?sal=espera-anfitrion`) | ✓ 94, 0 | ✓ 94, 0 | `0px` (`body.sal-activa`) |
| Portada (5174, sin bypass) | ✓ 114, 0 | ✓ 114, 0 | `0px` (`body.portada-activa`) |

**Cómo mide el modo, y por qué no se engaña:**

1. **Encendido y apagado en un solo `evaluate` síncrono.** Entre las dos lecturas no corre ni un tick de React, así que el reloj del descarte no puede colarse como Δ.
2. **Se inyecta `transition: none` durante la medición.** La carta tiene `transition: box-shadow .18s` (PC:9). Sin esto, `getComputedStyle` devuelve, justo después de apagar la hoja, el valor de **arranque** de la transición, que es el de antes: un falso verde garantizado en la puerta 3.
3. **Estados con clase prestada.** Ganadora y vacía no existen en el descarte, así que se prueban poniendo `card-winner` y `card-empty` a una carta en reposo dentro del mismo `evaluate`, y quitándolas antes de devolver.
4. **Comprobación de que la luz está puesta.** La puerta 5 exige que cada capa **cambie** respecto de la hoja apagada, además de ser válida. Una hoja que no cargara daría Δ = 0 y estados iguales, pero no pasaría la 5.

Valores computados de m5_pc, como muestra:
- **Óvalo:** 4 sombras. Las dos de hoy, más `rgba(0,0,0,0.55) 0 1px 17px inset` y `rgba(0,0,0,0.45) 0 4px 12px`.
- **Carta en reposo:** `rgba(0,0,0,0.42) 2px 5px 10px, rgba(0,0,0,0.3) 0 1.5px 2.5px`.
- **Carta seleccionada:** `rgba(232,184,75,0.6) 0 14px 26px`, igual que hoy.
- **Carta con hover:** `rgba(0,0,0,0.35) 2px 10px 18px`, igual que hoy.
- **`turnBreath`:** declarado en una sola regla, `.opp-panel.turn-active, .ai-zone.turn-active, .player-zone.turn-active`, en gameTable.css. `luz.css` no contiene ni `animation` ni `@keyframes`.

---

## 3 · Tricolor: entra

TP:267 declara su fondo con el shorthand `background` y **dos capas de imagen sin color de fondo**, así que el color queda en `transparent`. Esas capas se pueden anteponer sin reescribir nada.

La regla de 0,3,1 pone:
1. primero `var(--luz-capa-a)`, las seis capas de A;
2. después la viñeta radial y las bandas lineales del tricolor, copiadas literalmente de TP:268-278.

Las variables `--tap-tri-*` siguen resolviéndose en el tapete. La captura `m5_s25v_tricolor` computa **8 capas**, y pasa Δ = 0 y el contraste. Las bandas se ven intactas en la hoja de contacto.

---

## 4 · Compatibilidad del `calc()` en el alfa

- **Edge 153 (Chromium):** válido. `getComputedStyle` devuelve el alfa ya resuelto (`rgba(255, 238, 205, 0.055)`), sin `calc(` ni `var(` colgando. Así lo comprueba la puerta 5 en las 24 celdas.
  - Chromium guarda el alfa con 8 bits, así que 0,019 se serializa como `0.02` (5/255). No es un cambio de valor: es la precisión del navegador, y la lámina estaba sujeta a la misma.
- **WebKit: no comprobado.** Playwright no tiene WebKit instalado en esta máquina (no hay `ms-playwright/`), y la ficha no permite instalarlo. **Lo valida el iPhone.**

**Qué buscar en el iPhone.** Si Safari rechazara el `calc()` dentro de `rgba()`, la declaración sería inválida en el momento de computar y la propiedad caería a su valor inicial. Los síntomas serían:
- la mesa sin luz, como hoy (poco grave);
- **el óvalo sin su brillo interior dorado ni el riel**;
- **las cartas en reposo y el POZO sin ninguna sombra**, peor que hoy.

Si se ve eso, el remedio previsto en la ficha es hornear las constantes, que es un cambio mecánico en los bloques de tokens del §0 de `luz.css`, y dejar `--luz-k` documentado sin uso.

### 4.1 · Adenda: WebKit medido — verde, sin hornear

Autorizado por Victor tras el primer STOP.

**Instalación.** WebKit se instaló con `npx playwright-core install webkit`, el CLI del `playwright-core` 1.62.1 que fija el repo. `npx playwright` habría descargado otro paquete de npm, con un WebKit de otra versión. Solo se descargó el navegador (WebKit **26.5**) en `%LOCALAPPDATA%\ms-playwright`. `package.json` y `package-lock.json` quedaron idénticos al byte, con el mismo SHA-1 antes y después.

**Sonda.** Contra 5173 con bypass, en el mismo estado sembrado del modo `luz`: mesa 5, semilla 20260925, descarte con la primera carta seleccionada. Tamaños 390×844 (táctil) y 1920×1080. Se leyó cada propiedad con la hoja encendida y apagada en un solo `evaluate` síncrono, con `transition: none` inyectado, y lo mismo en Edge 153 para comparar. El script está fuera del repo, en el scratchpad.

| Propiedad | 390×844 con luz (WebKit) | ¿= Edge? | Apagada = hoy |
|---|---|---|---|
| `box-shadow` del óvalo | las 2 de hoy + `rgba(0,0,0,0.55) 0 1px 8px inset` | sí | sí (las 2 de hoy) |
| `box-shadow` de la carta en reposo | `rgba(0,0,0,0.42) 1px 3px 6px, rgba(0,0,0,0.3) 0 1px 1.5px` | sí | sí (`rgba(0,0,0,0.3) 1px 3px 8px`) |
| `box-shadow` de la seleccionada | `rgba(232,184,75,0.6) 0 14px 26px` | sí | sí, idéntica |
| `box-shadow` de `.pot-box` | difusa + apoyo, como la carta | sí | sí (`none`) |
| `background-image` de `.game-table` | 6 gradientes, focos de 80px, alfas resueltos (0.055, 0.02…) | sí | sí (`none`) |
| `filter` de la ficha | `drop-shadow(rgba(0,0,0,0.42) 1px 2px 2px) drop-shadow(rgba(0,0,0,0.3) 0 1px 1px)` | sí | sí (`drop-shadow(rgba(0,0,0,0.45) 0 1px 2px)`) |
| `--luz-k` | `1` | sí | — (no existe) |

A 1920×1080 el resultado es el mismo, con los valores de D:
- óvalo con 4 sombras, la última `0 4px 12px`;
- carta y POZO con `2px 5px 10px` y `0 1.5px 2.5px`;
- focos de 180px;
- ficha con `1.5px 3px 3px`.

Las **14 lecturas por tamaño** (7 propiedades × encendida y apagada) coinciden **al carácter** con Edge. Ninguna cae a `none` ni a su valor inicial.

**Veredicto: WebKit en verde.** `calc(<alfa> * var(--luz-k))` es válido en WebKit 26.5. No se hornea nada, `luz.css` no cambia, y por tanto no hace falta repetir las cinco puertas.

El iPhone sigue siendo la prueba final de lo que se ve, porque el Safari del teléfono puede ir por detrás del WebKit 26.5 de Playwright. Pero el riesgo del §4 ya no sale del motor.

---

## 5 · Desviaciones de la ficha

1. **Carta ganadora y carta vacía excluidas en el `:not`.** La ficha (§5.2.1) daba por hecho que `.card-winner` (PC:30-33) y `.card-empty` (PC:36-40) eran «más específicas» que la regla de contacto. **No lo son:** tienen 0,1,0, empatan con `:where(.playing-card…)` y cargan **antes**. Sin la exclusión, el orden les habría quitado el halo dorado y el `none`, y la puerta 3 habría fallado. Se añadieron dentro del `:where`, así que la especificidad sigue siendo 0,1,0 y el resto del mecanismo es el de la ficha.
2. **El bloque B toma los valores de P.** La ficha da valores para D, P y L. B, la regla base sin medios que en la práctica solo usa el retrato de 768 px o más (tabletas), no tenía celda en la lámina. Se le asignaron los valores compactos de P: foco de 80, riel solo hacia dentro y contacto y mazo pequeños, que no pueden pisar a ningún vecino. **Decisión pendiente del rector** si se quiere otra cosa para las tabletas.
3. **Más tokens locales que `--luz-foco`.** Para no repetir seis gradientes en la regla del tricolor y tres listas por bloque, los valores por modo viajan en custom properties de `.game-table-screen`: `--luz-capa-a`, `--luz-riel`, `--luz-contacto`, `--luz-mazo-negra` y `--luz-ficha`. Nada se declara en `:root`. Los valores son los de la ficha, carácter por carácter.
4. **«Pasó» en P y L.** La ficha pedía ganar también a las «declaraciones de P y L» de `.opp-status`. No existen: la única declaración de `color` del estado neutro es OP:1051 (ver el inventario del §1.3). Las variantes quedan fuera **por construcción**, con el `:not`, en lugar de competir por especificidad.
5. **La Portada, contra un segundo servidor de desarrollo.** Con bypass, la Portada no existe. Además, `AUTH_BYPASS = Boolean(DEV && VITE_AUTH_BYPASS)` (useAuth.js:50) trata la cadena `'0'` como verdadera, así que apagar el bypass con `=0` no funciona: hay que dejar la variable **vacía**. La puerta 4 se midió contra `VITE_AUTH_BYPASS= npx vite --port 5174`. El modo lee `LUZ_BASE_PORTADA`, y si no hay servidor la puerta **falla**; no se salta. `vite preview` no sirve para esto porque en el bundle la hoja de luz no es un `<style>` separado que se pueda apagar.
6. **`mkdirSync` importado localmente en `runLuz`.** Añadirlo al import de `node:fs` de la cabecera habría cambiado la conducta de `retar` y `apu`: ver el hallazgo H-1.
7. **Orden de las celdas en la consola:** 360 y 390 salen antes que pc porque JavaScript ordena primero las claves numéricas. Es solo cosmético; las tablas de este informe van en el orden de la ficha.

---

## 6 · Hallazgos que no se corrigieron (observar, no corregir)

- **H-1 · `mkdirSync` no está importado en `diagDSK.mjs`.** Se usa en las líneas 1204, 2164 y 2165 (modos `retar` y `apu`), siempre dentro de `try {} catch {}`. La excepción `ReferenceError` se traga en silencio y esos modos dependen de que sus carpetas ya existan. No se toca.
- **H-2 · El bypass con `'0'`.** Lo contado en la desviación 5: `VITE_AUTH_BYPASS=0` **enciende** el bypass. Es inocuo en producción (`DEV` es falso), pero puede confundir a quien intente medir la Portada en desarrollo.

---

## 7 · Tiempo real

Unos **30 minutos**, de 06:56 a 07:25:
- ~12 min de inventario y escritura;
- ~10 min de corrida completa del modo;
- ~8 min de comprobaciones e informe.

Tope: 3 h.

---

## STOP

Sin commits. Siguiente paso, en este orden:

1. **Victor prueba en los teléfonos por túnel:** build, luego `vite preview --host`, luego `cloudflared`. El S25 primero, por las bandas en OLED.
   - Con el iPhone se decide el §4, el `calc()` en WebKit.
   - Las fichas (§5.3 de la ficha) se miran aparte: si no convencen, se retira su regla y nada más cambia.
2. **Ficha de commits.** Previsión de la ficha:

| Commit | Contenido |
|---|---|
| LUZ-1a | `luz.css` y `GameTable.jsx` |
| LUZ-1b | Modo `luz` y la línea de `.gitignore` |
| LUZ-1c | Informes de la Fase 0 y la Fase 1, y adenda del Sistema de Diseño |
| LUZ-1d | Informe de cierre |
